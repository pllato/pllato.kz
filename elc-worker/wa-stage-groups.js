export const groupWelcome = 'Добро пожаловать в Pllato! 👋\nМы — студия разработки программного обеспечения. Создаём CRM-системы, сайты и приложения для бизнеса.\n\nВ этом чате будем обсуждать ваш проект, согласовывать задачи и материалы, делиться результатами и решать рабочие вопросы.\n\nРады сотрудничеству!';
const parse=(s,fallback)=>{try{return JSON.parse(s)||fallback;}catch{return fallback;}};
const changed=r=>Number(r.meta?.changes ?? r.changes ?? 0)>0;
const inviteUrl=s=>/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(s||'')?s:'';
export function groupPhone(value){let p=String(value||'').replace(/\D/g,'');if(p.length===11&&p[0]==='8')p='7'+p.slice(1);return /^\d{10,15}$/.test(p)?p:null;}
export function groupName(name,date=new Date()){
 const day=new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Almaty',day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
 const prefix='Pllato IT разработка - CRM - ',suffix=' - '+day;
 return prefix+String(name||'Клиент').trim().slice(0,100-prefix.length-suffix.length)+suffix;
}
export async function groupSchema(env){
 await env.DB.batch([
  env.DB.prepare('CREATE TABLE IF NOT EXISTS deal_stage_events (id INTEGER PRIMARY KEY AUTOINCREMENT,deal_id TEXT,pipeline_id TEXT,stage_id TEXT,entered_at TEXT)'),
  env.DB.prepare('CREATE TABLE IF NOT EXISTS wa_stage_group_rules (pipeline_id TEXT NOT NULL, stage_id TEXT NOT NULL, channel_id TEXT NOT NULL, employee_uids TEXT NOT NULL, since_event INTEGER NOT NULL, PRIMARY KEY(pipeline_id,stage_id))'),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS wa_stage_group_jobs (event_id INTEGER PRIMARY KEY,deal_id TEXT NOT NULL,pipeline_id TEXT NOT NULL,stage_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',error TEXT,created_at INTEGER NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS wa_deal_groups (deal_id TEXT PRIMARY KEY,channel_id TEXT NOT NULL,group_id TEXT,invite_link TEXT,name TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at INTEGER NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS wa_group_people (deal_id TEXT NOT NULL,chat_id TEXT NOT NULL,label TEXT,status TEXT NOT NULL,error TEXT,PRIMARY KEY(deal_id,chat_id))"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS wa_manual_group_jobs (deal_id TEXT PRIMARY KEY,channel_id TEXT NOT NULL,employee_uids TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',error TEXT,created_at INTEGER NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS wa_group_welcome (deal_id TEXT PRIMARY KEY,status TEXT NOT NULL DEFAULT 'pending',message_id TEXT)"),
  env.DB.prepare('CREATE TABLE IF NOT EXISTS wa_group_locks (id TEXT PRIMARY KEY,until_at INTEGER NOT NULL,owner TEXT)'),
  env.DB.prepare("INSERT OR IGNORE INTO wa_group_locks VALUES('runner',0,'')")
 ]);
}
async function provider(channel,method,body){
 const base=String(channel.api_url||'https://api.green-api.com').replace(/\/$/,'');
 let r;try{r=await fetch(`${base}/waInstance${channel.id_instance}/${method}/${channel.api_token_instance}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});}catch{throw new Error(method+': ответ не получен');}
 if(!r.ok)throw new Error(method+': HTTP '+r.status);
 try{return await r.json();}catch{throw new Error(method+': некорректный ответ');}
}
async function participants(env,deal,uids){
 const contact=await env.DB.prepare('SELECT name,last_name,phones FROM contacts WHERE id=?').bind(deal.contact_id||'').first();
 const phones=parse(contact?.phones,[]),phone=groupPhone(phones[0]?.value||phones[0]?.VALUE||phones[0]);
 if(!phone)throw new Error('У клиента в контакте нет корректного номера WhatsApp');
 if(!deal.responsible_uid)throw new Error('У сделки не назначен ответственный менеджер');
 const people=[{chatId:phone+'@c.us',label:[contact.name,contact.last_name].filter(Boolean).join(' ')||'Клиент'}];
 for(const uid of new Set([deal.responsible_uid,...uids])){
  const u=await env.DB.prepare('SELECT name,last_name,phone,active FROM users WHERE uid=?').bind(uid).first();
  if(!u||!u.active)throw new Error('Участник не найден или отключён: '+uid);
  const p=groupPhone(u.phone);if(!p)throw new Error('У сотрудника '+(u.name||uid)+' не указан телефон');
  if(!people.some(x=>x.chatId===p+'@c.us'))people.push({chatId:p+'@c.us',label:[u.name,u.last_name].filter(Boolean).join(' ')});
 }
 return people;
}
async function processJob(env,job,rule){
 const deal=await env.DB.prepare('SELECT * FROM deals WHERE id=?').bind(job.deal_id).first();
 if(!deal)throw new Error('Сделка не найдена');
 const people=await participants(env,deal,parse(rule.employee_uids,[]));
 let group=await env.DB.prepare('SELECT * FROM wa_deal_groups WHERE deal_id=?').bind(deal.id).first();
 const channelId=group?.channel_id||rule.channel_id;
 const channel=await env.DB.prepare('SELECT * FROM wa_channels WHERE id=? AND active=1').bind(channelId).first();
 if(!channel)throw new Error('Рабочий WhatsApp-номер отключён');
 for(const person of people){
  const found=await provider(channel,'checkWhatsapp',{chatId:person.chatId});
  if(found.existsWhatsapp!==true)throw new Error(person.label+': номер не найден в WhatsApp');
  person.lid=found.chatId;
 }
 if(!group){
  await env.DB.prepare('INSERT OR IGNORE INTO wa_deal_groups(deal_id,channel_id,name,created_at) VALUES(?,?,?,?)').bind(deal.id,channel.id,groupName(people[0].label),Date.now()).run();
  group=await env.DB.prepare('SELECT * FROM wa_deal_groups WHERE deal_id=?').bind(deal.id).first();
 }
 if(!group.group_id){
  if(group.status==='creating')throw new Error('Создание группы не подтверждено. Проверьте WhatsApp и привяжите созданную группу по ID, чтобы не создать дубль.');
  const lockId='create:'+channel.id_instance;
  await env.DB.prepare('INSERT OR IGNORE INTO wa_group_locks VALUES(?,0,?)').bind(lockId,'').run();
  const slot=await env.DB.prepare('UPDATE wa_group_locks SET until_at=? WHERE id=? AND until_at<=?').bind(Date.now()+300000,lockId,Date.now()).run();
  if(!changed(slot))return false;
  // Save intent before external POST; an ambiguous response must never repeat it.
  group.name=groupName(people[0].label);
  await env.DB.prepare("UPDATE wa_deal_groups SET status='creating',name=?,created_at=? WHERE deal_id=?").bind(group.name,Date.now(),deal.id).run();
  const result=await provider(channel,'createGroup',{groupName:group.name,chatIds:people.map(x=>x.chatId)});
  if(!result.created||!/^\d[\d-]*@g\.us$/.test(result.chatId||''))throw new Error('WhatsApp не подтвердил создание. Проверьте группу перед повторной попыткой.');
  group.group_id=result.chatId;group.invite_link=inviteUrl(result.groupInviteLink);
  await env.DB.batch([
   env.DB.prepare("UPDATE wa_deal_groups SET group_id=?,invite_link=?,status='active' WHERE deal_id=?").bind(group.group_id,group.invite_link,deal.id),
   env.DB.prepare('INSERT OR IGNORE INTO wa_group_welcome(deal_id) VALUES(?)').bind(deal.id)
  ]);
 }
 // Only newly created groups have a welcome row; never post into old groups on rollout.
 const welcome=await env.DB.prepare('SELECT status FROM wa_group_welcome WHERE deal_id=?').bind(deal.id).first();
 if(welcome?.status==='sending')throw new Error('Отправка приветствия не подтверждена. Проверьте сообщения группы; повторная отправка остановлена, чтобы не создать дубль.');
 if(welcome?.status==='pending'){
  const claimed=await env.DB.prepare("UPDATE wa_group_welcome SET status='sending' WHERE deal_id=? AND status='pending'").bind(deal.id).run();
  if(!changed(claimed))throw new Error('Приветствие уже обрабатывается');
  const sent=await provider(channel,'sendMessage',{chatId:group.group_id,message:groupWelcome});
  if(!sent.idMessage)throw new Error('Отправка приветствия не подтверждена. Проверьте сообщения группы.');
  await env.DB.prepare("UPDATE wa_group_welcome SET status='sent',message_id=? WHERE deal_id=?").bind(sent.idMessage,deal.id).run();
 }
 const data=await provider(channel,'getGroupData',{groupId:group.group_id});
 if(!Array.isArray(data.participants))throw new Error('Не удалось проверить участников группы');
 const members=new Set(data.participants.flatMap(p=>[p.id,p.phoneNumber,p.lid]).filter(Boolean));
 const link=inviteUrl(data.groupInviteLink)||group.invite_link;
 if(link)await env.DB.prepare('UPDATE wa_deal_groups SET invite_link=? WHERE deal_id=?').bind(link,deal.id).run();
 await env.DB.prepare(`INSERT INTO wa_chats(id,instance_id,chat_id,is_group,name,deal_id,last_message_text,last_message_at,updated_at) VALUES(?,?,?,1,?,?,'',?,datetime('now')) ON CONFLICT(id) DO UPDATE SET deal_id=excluded.deal_id,name=excluded.name`).bind('wa:'+channel.id_instance+':'+group.group_id,channel.id_instance,group.group_id,group.name,deal.id,Date.now()).run();
 let issues=[];
 // Bounded rule size keeps a job below its lease even when provider requests time out.
 for(const person of people){
  const old=await env.DB.prepare('SELECT status FROM wa_group_people WHERE deal_id=? AND chat_id=?').bind(deal.id,person.chatId).first();
  const set=async(status,error=null)=>env.DB.prepare('INSERT INTO wa_group_people VALUES(?,?,?,?,?) ON CONFLICT(deal_id,chat_id) DO UPDATE SET status=excluded.status,error=excluded.error,label=excluded.label').bind(deal.id,person.chatId,person.label,status,error).run();
  if(members.has(person.chatId)||(person.lid&&members.has(person.lid))){await set('member');continue;}
  if(old?.status==='invited')continue;
  if(old?.status==='sending'){issues.push(person.label+': отправка приглашения не подтверждена');continue;}
  let added=false;
  try{const r=await provider(channel,'addGroupParticipant',{groupId:group.group_id,participantChatId:person.chatId});added=r.addParticipant===true;}catch{}
  if(added){await set('member');continue;}
  const check=await provider(channel,'getGroupData',{groupId:group.group_id});
  if(!Array.isArray(check.participants))throw new Error('Не удалось проверить результат добавления');
  if(check.participants.some(p=>[p.id,p.phoneNumber,p.lid].filter(Boolean).some(id=>id===person.chatId||id===person.lid))){await set('member');continue;}
  if(!link){await set('error','WhatsApp не вернул ссылку приглашения');issues.push(person.label+': нет ссылки приглашения');continue;}
  await set('sending');
  try{
   const r=await provider(channel,'sendMessage',{chatId:person.chatId,message:`Приглашаем вас в рабочую группу «${group.name}».\nПрисоединиться: ${link}`});
   if(!r.idMessage)throw new Error('Отправка приглашения не подтверждена');
   await set('invited');
  }catch(e){await set('sending',e.message);issues.push(person.label+': отправка приглашения не подтверждена');}
 }
 if(issues.length)throw new Error(issues.join('; '));
 return true;
}
export async function processStageGroups(env){
 await groupSchema(env);
 const owner=crypto.randomUUID(),now=Date.now();
 const lease=await env.DB.prepare("UPDATE wa_group_locks SET owner=?,until_at=? WHERE id='runner' AND until_at<=?").bind(owner,now+1200000,now).run();
 if(!changed(lease))return;
 try{
  const manual=await env.DB.prepare("SELECT * FROM wa_manual_group_jobs WHERE status='pending' ORDER BY created_at LIMIT 1").first();
  if(manual){
   try{if(await processJob(env,manual,manual))await env.DB.prepare("UPDATE wa_manual_group_jobs SET status='done',error=NULL WHERE deal_id=?").bind(manual.deal_id).run();}
   catch(e){await env.DB.prepare("UPDATE wa_manual_group_jobs SET status='error',error=? WHERE deal_id=?").bind(e.message,manual.deal_id).run();}
   return;
  }
  // Only transitions recorded after rule activation; no mass creation for old deals.
  await env.DB.prepare(`INSERT OR IGNORE INTO wa_stage_group_jobs(event_id,deal_id,pipeline_id,stage_id,created_at) SELECT e.id,e.deal_id,e.pipeline_id,e.stage_id,? FROM deal_stage_events e JOIN wa_stage_group_rules r ON r.pipeline_id=e.pipeline_id AND r.stage_id=e.stage_id WHERE e.id>r.since_event`).bind(now).run();
  const {results}=await env.DB.prepare("SELECT * FROM wa_stage_group_jobs WHERE status='pending' ORDER BY event_id LIMIT 5").all();
  for(const job of results){
   const rule=await env.DB.prepare('SELECT * FROM wa_stage_group_rules WHERE pipeline_id=? AND stage_id=?').bind(job.pipeline_id,job.stage_id).first();
   if(!rule){await env.DB.prepare("UPDATE wa_stage_group_jobs SET status='cancelled' WHERE event_id=?").bind(job.event_id).run();continue;}
   try{if(await processJob(env,job,rule))await env.DB.prepare("UPDATE wa_stage_group_jobs SET status='done',error=NULL WHERE event_id=?").bind(job.event_id).run();}
   catch(e){await env.DB.prepare("UPDATE wa_stage_group_jobs SET status='error',error=? WHERE event_id=?").bind(e.message,job.event_id).run();}
   break;
  }
 }finally{await env.DB.prepare("UPDATE wa_group_locks SET until_at=0 WHERE id='runner' AND owner=?").bind(owner).run();}
}
export async function handleStageGroups(request,env,deps){
 const {json,requireAuthFlexible,resolveCanonicalUser,dealAccessSql}=deps;
 try{
  const auth=await requireAuthFlexible(request,env);if(auth.error)return json({error:auth.error},auth.status,request);
  const me=await resolveCanonicalUser(env,auth.claims),url=new URL(request.url);
  await groupSchema(env);
  const dealMatch=url.pathname.match(/\/deals\/([^/]+)$/);
  if(dealMatch){
   const dealId=decodeURIComponent(dealMatch[1]),access=dealAccessSql(me);
   const dealRecord=await env.DB.prepare('SELECT * FROM deals WHERE id=?'+access.where).bind(dealId,...access.params).first();
   if(!dealRecord)return json({error:'Нет доступа к сделке'},403,request);
   if(request.method==='GET'){
    const group=await env.DB.prepare('SELECT name,group_id,invite_link,status FROM wa_deal_groups WHERE deal_id=?').bind(dealId).first();
    const {results:jobs}=await env.DB.prepare('SELECT event_id,status,error FROM wa_stage_group_jobs WHERE deal_id=? ORDER BY event_id DESC LIMIT 10').bind(dealId).all();
    const {results:people}=await env.DB.prepare('SELECT label,status,error FROM wa_group_people WHERE deal_id=?').bind(dealId).all();
    const {results:chats}=await env.DB.prepare('SELECT id,chat_id,instance_id,name FROM wa_chats WHERE deal_id=? AND is_group=1 ORDER BY name').bind(dealId).all();
    const manual=await env.DB.prepare('SELECT status,error FROM wa_manual_group_jobs WHERE deal_id=?').bind(dealId).first();
    let options;
    if(url.searchParams.get('options')==='1'){
     const {results:users}=await env.DB.prepare('SELECT uid,name,last_name,phone FROM users WHERE active=1 ORDER BY name').all();
     const {results:channels}=await env.DB.prepare('SELECT id,display_name,id_instance FROM wa_channels WHERE active=1').all();
     options={users,channels};
    }
    const pipeline=await env.DB.prepare('SELECT id,name,stages FROM pipelines WHERE id=?').bind(dealRecord.pipeline_id||'').first();
    const {results:rules}=await env.DB.prepare('SELECT stage_id,employee_uids FROM wa_stage_group_rules WHERE pipeline_id=?').bind(dealRecord.pipeline_id||'').all();
    const stages=parse(pipeline?.stages,{}),stageRules=[];
    for(const rule of rules){
     const employees=[];
     for(const uid of parse(rule.employee_uids,[])){
      const u=await env.DB.prepare('SELECT name,last_name FROM users WHERE uid=?').bind(uid).first();
      employees.push([u?.name,u?.last_name].filter(Boolean).join(' ')||'Сотрудник');
     }
     stageRules.push({stage:stages[rule.stage_id]?.name||rule.stage_id,sort:stages[rule.stage_id]?.sort||0,employees});
    }
    stageRules.sort((a,b)=>a.sort-b.sort);
    return json({group,jobs:manual?[manual,...jobs]:jobs,people,chats,options,pipeline:pipeline?{id:pipeline.id,name:pipeline.name}:null,stageRules,admin:me.role==='admin'},200,request);
   }
   if(request.method!=='POST')return json({error:'Method not allowed'},405,request);
   const body=await request.json(),group=await env.DB.prepare('SELECT * FROM wa_deal_groups WHERE deal_id=?').bind(dealId).first();
   if(body.action==='create'){
    if(group)return json({error:'Группа уже создана или создаётся. Используйте существующую группу.'},409,request);
    if(!Array.isArray(body.employee_uids)||body.employee_uids.length>8)return json({error:'Выберите не больше 8 дополнительных сотрудников'},400,request);
    if(!await env.DB.prepare('SELECT id FROM wa_channels WHERE id=? AND active=1').bind(body.channel_id||'').first())return json({error:'Выберите активный WhatsApp-номер'},400,request);
    const deal=await env.DB.prepare('SELECT * FROM deals WHERE id=?').bind(dealId).first();
    try{await participants(env,deal,body.employee_uids);}catch(e){return json({error:e.message},400,request);}
    const inserted=await env.DB.prepare('INSERT OR IGNORE INTO wa_manual_group_jobs(deal_id,channel_id,employee_uids,created_at) VALUES(?,?,?,?)').bind(dealId,body.channel_id,JSON.stringify([...new Set(body.employee_uids)]),Date.now()).run();
    if(!changed(inserted))return json({error:'Запрос на создание уже существует. Проверьте статус группы.'},409,request);
    return json({ok:true,status:'pending'},202,request);
   }
   if(me.role!=='admin')return json({error:'Только администратор'},403,request);
   // Manual recovery validates the supplied group through the configured account.
   if(body.groupId){
    if(!group||!/^\d[\d-]*@g\.us$/.test(body.groupId))return json({error:'Нужен корректный ID группы WhatsApp'},400,request);
    const channel=await env.DB.prepare('SELECT * FROM wa_channels WHERE id=? AND active=1').bind(group.channel_id).first();
    if(!channel)return json({error:'WhatsApp-номер отключён'},400,request);
    const data=await provider(channel,'getGroupData',{groupId:body.groupId});
    if(!Array.isArray(data.participants)||!inviteUrl(data.groupInviteLink))return json({error:'Нет прав администратора группы или недоступна ссылка приглашения'},400,request);
    await env.DB.prepare("UPDATE wa_deal_groups SET group_id=?,invite_link=?,status='active' WHERE deal_id=?").bind(body.groupId,inviteUrl(data.groupInviteLink),dealId).run();
   }else if(group?.status==='creating')return json({error:'Сначала проверьте созданную группу в WhatsApp и укажите её ID'},409,request);
   await env.DB.prepare("UPDATE wa_stage_group_jobs SET status='pending',error=NULL WHERE deal_id=? AND status='error'").bind(dealId).run();
   await env.DB.prepare("UPDATE wa_manual_group_jobs SET status='pending',error=NULL WHERE deal_id=? AND status='error'").bind(dealId).run();
   return json({ok:true},200,request);
  }
  if(me.role!=='admin')return json({error:'Настройки доступны администратору'},403,request);
  const pipelineId=url.searchParams.get('pipeline');
  const pipeline=await env.DB.prepare('SELECT id,name,stages FROM pipelines WHERE id=?').bind(pipelineId||'').first();
  if(!pipeline)return json({error:'Воронка не найдена'},404,request);
  if(request.method==='GET'){
   const {results:rules}=await env.DB.prepare('SELECT stage_id,channel_id,employee_uids FROM wa_stage_group_rules WHERE pipeline_id=?').bind(pipelineId).all();
   const {results:users}=await env.DB.prepare('SELECT uid,name,last_name,phone FROM users WHERE active=1 ORDER BY name').all();
   const {results:channels}=await env.DB.prepare('SELECT id,display_name,id_instance FROM wa_channels WHERE active=1').all();
   const {results:jobs}=await env.DB.prepare("SELECT j.deal_id,j.status,j.error,d.title FROM wa_stage_group_jobs j JOIN deals d ON d.id=j.deal_id WHERE j.pipeline_id=? AND j.status IN ('error','pending') ORDER BY j.event_id DESC LIMIT 20").bind(pipelineId).all();
   return json({pipeline:{...pipeline,stages:parse(pipeline.stages,{})},rules:rules.map(r=>({...r,employee_uids:parse(r.employee_uids,[])})),users,channels,jobs},200,request);
  }
  if(request.method!=='PUT')return json({error:'Method not allowed'},405,request);
  const body=await request.json(),stages=parse(pipeline.stages,{});
  if(!Array.isArray(body.rules)||body.rules.length>100)return json({error:'Некорректные правила'},400,request);
  const rules=[],seen=new Set();
  for(const r of body.rules){
   if(!stages[r.stage_id]||seen.has(r.stage_id)||!Array.isArray(r.employee_uids)||r.employee_uids.length>8)return json({error:'Проверьте этапы и сотрудников (до 8 дополнительных на этап)'},400,request);
   seen.add(r.stage_id);
   if(!await env.DB.prepare('SELECT id FROM wa_channels WHERE id=? AND active=1').bind(r.channel_id||'').first())return json({error:'Выберите активный WhatsApp-номер'},400,request);
   const ids=[...new Set(r.employee_uids)];
   for(const uid of ids){const u=await env.DB.prepare('SELECT phone FROM users WHERE uid=? AND active=1').bind(uid).first();if(!groupPhone(u?.phone))return json({error:'У выбранного сотрудника нет корректного телефона'},400,request);}
   rules.push({...r,employee_uids:JSON.stringify(ids)});
  }
  const max=await env.DB.prepare('SELECT COALESCE(MAX(id),0) AS id FROM deal_stage_events').first();
  await env.DB.batch([
   env.DB.prepare('DELETE FROM wa_stage_group_rules WHERE pipeline_id=?').bind(pipelineId),
   // Cancel pending work when rules are changed; new transitions use new settings.
   env.DB.prepare("UPDATE wa_stage_group_jobs SET status='cancelled' WHERE pipeline_id=? AND status='pending'").bind(pipelineId),
   ...rules.map(r=>env.DB.prepare('INSERT INTO wa_stage_group_rules VALUES(?,?,?,?,?)').bind(pipelineId,r.stage_id,r.channel_id,r.employee_uids,max.id))
  ]);
  return json({ok:true},200,request);
 }catch(e){return json({error:e.message||'Ошибка настройки WhatsApp-групп'},500,request);}
}
