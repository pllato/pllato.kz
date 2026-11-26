export const ASTANA_PIPELINE='pipeline_2zttlx';
const CONFIG_KEY='pipeline:astana:admissions';
const defaults={sources:['WhatsApp','Instagram','Facebook','Рекомендация','Другое'],levels:['Не определён','Beginner','Elementary','Pre-Intermediate','Intermediate','Upper-Intermediate','Advanced']};
export function astanaAllowed(me){if(me?.userRecord?.active===0||me?.userRecord?.active===false)return false;return me?.email==='uurraa@gmail.com'||(me?.orgPerms?.pipelineIds==null&&me?.role==='admin')||me?.orgPerms?.pipelineIds?.includes(ASTANA_PIPELINE);}
// Участие в Astana даёт работу со всеми её заявками; перенос в другую
// воронку не является частью этого разрешения.
export function astanaEditTargetAllowed(me,source,target){
 if(source!==ASTANA_PIPELINE)return true;
 if(!astanaAllowed(me))return false;
 if(!target||target===ASTANA_PIPELINE)return true;
 return me.email==='uurraa@gmail.com'||(me.role==='admin'&&(!Array.isArray(me.orgPerms?.pipelineIds)||me.orgPerms.pipelineIds.includes(target)));
}
function parse(s,f={}){try{return JSON.parse(s)||f;}catch{return f;}}
export function validateAdmissions(body,config){
 const name=String(body.name||'').trim(),phone=String(body.phone||'').replace(/[^\d+]/g,'');
 if(!name||name.length>200)throw Error('Укажите имя до 200 символов');
 if(!/^\+?\d{10,15}$/.test(phone))throw Error('Укажите телефон с кодом страны');
 const trial=String(body.trialLessonAt||'');if(trial&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+05:00$/.test(trial)||!Number.isFinite(Date.parse(trial))||new Date(Date.parse(trial)+18000000).toISOString().slice(0,16)!==trial.slice(0,16)))throw Error('Укажите корректную дату и время пробного');
 const source=String(body.source||''),level=String(body.level||'');if(source&&!config.sources.includes(source))throw Error('Выберите источник из списка');if(level&&!config.levels.includes(level))throw Error('Выберите уровень из списка');
 return {name,phone,trialLessonAt:trial,source,level,note:String(body.note||'').slice(0,4000)};
}
function lists(input){const result={};for(const key of ['sources','levels']){if(!Array.isArray(input[key])||input[key].length>100)throw Error('Список должен содержать до 100 значений');result[key]=[...new Set(input[key].map(s=>String(s).trim()).filter(Boolean))];if(!result[key].length||result[key].some(s=>s.length>100))throw Error('Укажите непустой список, до 100 символов в значении');}return result;}
async function configFor(env){const row=await env.DB.prepare('SELECT v FROM kv WHERE k=?').bind(CONFIG_KEY).first();return {...defaults,...parse(row?.v)};}
function admission(row){const cf=parse(row.custom_fields),contactPhones=parse(row.contact_phones,[]);return {id:row.id,bitrixId:row.bitrix_id,pipelineId:row.pipeline_id,stageId:row.stage_id,responsibleUid:row.responsible_uid,contactId:row.contact_id,customFields:cf,name:cf.astanaName||[row.contact_last_name,row.contact_name].filter(Boolean).join(' ')||row.title,phone:cf.astanaPhone||contactPhones[0]?.value||'',trialLessonAt:cf.trialLessonAt||'',source:(!cf.astanaSourceManual&&row.source_id==='META_AD')?'Instagram':cf.astanaSource||(/^WhatsApp/.test(row.source_description||'')?'WhatsApp':/^Instagram/.test(row.source_description||'')?'Instagram':row.source_description||''),level:cf.astanaLevel||'',note:cf.astanaNote??row.comments??'',channelId:cf.astanaChannelId||null};}
const SELECT=`SELECT d.*,c.name AS contact_name,c.last_name AS contact_last_name,c.phones AS contact_phones FROM deals d LEFT JOIN contacts c ON c.id=d.contact_id`;
export async function handleAstanaAdmissions(request,env,deps){
 const {json,requireAuthFlexible,resolveCanonicalUser,rowToCamel,auditLog,logStageEvent}=deps;
 const auth=await requireAuthFlexible(request,env);if(auth.error)return json({error:auth.error},auth.status,request);
 const me=await resolveCanonicalUser(env,auth.claims);if(!astanaAllowed(me))return json({error:'Нет доступа к ELC Astana'},403,request);
 const url=new URL(request.url),tail=url.pathname.replace('/api/astana/',''),method=request.method;
 const config=await configFor(env);
 try{
  if(tail==='settings'){
   if(method==='GET'){const p=await env.DB.prepare('SELECT stages FROM pipelines WHERE id=?').bind(ASTANA_PIPELINE).first();return json({ok:true,config,stages:parse(p?.stages)},200,request);}
   if(method!=='PUT')return json({error:'Метод не поддерживается'},405,request);
   const incoming=lists(await request.json());await env.DB.prepare('INSERT INTO kv(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(CONFIG_KEY,JSON.stringify(incoming)).run();await auditLog(env,me,'astana_lists_update','pipelines',ASTANA_PIPELINE,{});return json({ok:true,config:incoming},200,request);
  }
  if(tail==='members'){
   if(method==='GET'){
    const row=await env.DB.prepare("SELECT v FROM kv WHERE k='org:fieldConfig'").first(),cfg=parse(row?.v)[ASTANA_PIPELINE]||{};
    const {results}=await env.DB.prepare('SELECT uid,name,last_name,email FROM users WHERE active=1 ORDER BY name LIMIT 500').all();
    return json({ok:true,memberUids:cfg.accessMemberUids||[],users:results.map(u=>({uid:u.uid,name:[u.last_name,u.name].filter(Boolean).join(' ')||u.email,email:u.email}))},200,request);
   }
   if(method!=='PUT')return json({error:'Метод не поддерживается'},405,request);
   const body=await request.json();if(!Array.isArray(body.memberUids)||body.memberUids.length>100||body.memberUids.some(id=>typeof id!=='string'))throw Error('Укажите до 100 сотрудников');
   const ids=[...new Set(body.memberUids)];if(!ids.length)throw Error('Оставьте хотя бы одного сотрудника');
   const {results:users}=await env.DB.prepare(`SELECT uid FROM users WHERE active=1 AND uid IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all();if(users.length!==ids.length)throw Error('Сотрудник не найден');
   // Владелец сохраняет административный доступ; участники редактируют только Astana.
   const owner=await env.DB.prepare('SELECT uid FROM users WHERE lower(email)=? LIMIT 1').bind('uurraa@gmail.com').first();if(owner&&!ids.includes(owner.uid))ids.push(owner.uid);
   await env.DB.prepare(`INSERT INTO kv(k,v) VALUES('org:fieldConfig',json_object(?,json_object('accessMode','restricted','accessMemberUids',json(?),'viewAllMemberUids',json(?),'accessNodeIds',json('[]')))) ON CONFLICT(k) DO UPDATE SET v=json_set(COALESCE(kv.v,'{}'),'$."pipeline_2zttlx".accessMode','restricted','$."pipeline_2zttlx".accessMemberUids',json(?),'$."pipeline_2zttlx".viewAllMemberUids',json(?),'$."pipeline_2zttlx".accessNodeIds',json('[]'))`).bind(ASTANA_PIPELINE,JSON.stringify(ids),JSON.stringify(ids),JSON.stringify(ids),JSON.stringify(ids)).run();
   await auditLog(env,me,'astana_members_update','pipelines',ASTANA_PIPELINE,{memberUids:ids});return json({ok:true,memberUids:ids},200,request);
  }
  if(tail==='calendar'&&method==='GET'){
   const from=url.searchParams.get('from'),to=url.searchParams.get('to');if(!/^\d{4}-\d{2}-\d{2}$/.test(from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(to||'')||!(Date.parse(to)>Date.parse(from))||Date.parse(to)-Date.parse(from)>62*864e5)throw Error('Укажите диапазон до 62 дней');
   const {results}=await env.DB.prepare(SELECT+` WHERE d.pipeline_id=? AND json_valid(d.custom_fields) AND json_extract(d.custom_fields,'$.trialLessonAt')>=? AND json_extract(d.custom_fields,'$.trialLessonAt')<? ORDER BY json_extract(d.custom_fields,'$.trialLessonAt') LIMIT 501`).bind(ASTANA_PIPELINE,from,to).all();return json({ok:true,items:results.slice(0,500).map(admission),truncated:results.length>500},200,request);
  }
  const match=tail.match(/^deal(?:\/([^/]+))?$/);if(!match)return json({error:'Не найдено'},404,request);
  const id=match[1]?decodeURIComponent(match[1]):null;
  let old=id?await env.DB.prepare(SELECT+' WHERE d.id=? AND d.pipeline_id=?').bind(id,ASTANA_PIPELINE).first():null;
  if(id&&!old)return json({error:'Сделка не найдена'},404,request);
  if(method==='GET'&&old){const p=await env.DB.prepare('SELECT stages FROM pipelines WHERE id=?').bind(ASTANA_PIPELINE).first();return json({ok:true,item:admission(old),deal:rowToCamel(old,'deals'),config,stages:parse(p?.stages)},200,request);}
  if(!['POST','PUT'].includes(method))return json({error:'Метод не поддерживается'},405,request);
  if((method==='POST'&&id)||(method==='PUT'&&!id))throw Error('Некорректный запрос');
  const body=await request.json(),legacy=old?admission(old):{},value=validateAdmissions(body,{sources:[...config.sources,legacy.source],levels:[...config.levels,legacy.level]}),now=new Date().toISOString();
  const pipeline=await env.DB.prepare('SELECT stages FROM pipelines WHERE id=?').bind(ASTANA_PIPELINE).first(),stages=parse(pipeline?.stages);
  const stage=String(body.stageId||old?.stage_id||'NEW');if(!stages[stage])throw Error('Неизвестная стадия ELC Astana');
  const cf={...parse(old?.custom_fields),astanaName:value.name,astanaPhone:value.phone,astanaSource:value.source,astanaSourceManual:true,astanaLevel:value.level,astanaNote:value.note,trialLessonAt:value.trialLessonAt,trialLessonSetByUid:me.canonicalUid||me.firebaseUid};
  const dealId=old?.id||'deal_astana_'+crypto.randomUUID(),bitrix=old?.bitrix_id||dealId.slice(5);
  if(old)await env.DB.prepare('UPDATE deals SET title=?,source_description=?,custom_fields=?,stage_id=?,closed=?,bitrix_date_modify=?,modify_by_uid=? WHERE id=? AND pipeline_id=?').bind(value.name,value.source,JSON.stringify(cf),stage,['S','F'].includes(stages[stage].semantics)?1:0,now,me.canonicalUid,dealId,ASTANA_PIPELINE).run();
  else await env.DB.prepare('INSERT INTO deals(id,bitrix_id,title,pipeline_id,stage_id,responsible_uid,created_by_uid,source_description,custom_fields,bitrix_date_create,bitrix_date_modify) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(dealId,bitrix,value.name,ASTANA_PIPELINE,stage,me.canonicalUid,me.canonicalUid,value.source,JSON.stringify(cf),now,now).run();
  if(!old||old.stage_id!==stage)await logStageEvent(env,dealId,ASTANA_PIPELINE,stage,now);
  await auditLog(env,me,'astana_admission_save','deals',dealId,{trialLessonAt:value.trialLessonAt});
  const row=await env.DB.prepare(SELECT+' WHERE d.id=? AND d.pipeline_id=?').bind(dealId,ASTANA_PIPELINE).first();return json({ok:true,item:admission(row),deal:rowToCamel(row,'deals'),config},200,request);
 }catch(error){return json({error:error.message||'Не удалось сохранить'},400,request);}
}
