import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {groupSchema,migrateGroupNames,groupName,groupPhone,processStageGroups,handleStageGroups} from './wa-stage-groups.js';
async function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE pipelines(id TEXT PRIMARY KEY,name TEXT,stages TEXT);
 CREATE TABLE deals(id TEXT PRIMARY KEY,title TEXT,contact_id TEXT,responsible_uid TEXT);
 CREATE TABLE contacts(id TEXT PRIMARY KEY,name TEXT,last_name TEXT,phones TEXT);
 CREATE TABLE users(uid TEXT PRIMARY KEY,name TEXT,last_name TEXT,phone TEXT,active INTEGER);
 CREATE TABLE wa_channels(id TEXT PRIMARY KEY,id_instance TEXT,api_url TEXT,api_token_instance TEXT,display_name TEXT,active INTEGER);
 CREATE TABLE wa_chats(id TEXT PRIMARY KEY,instance_id TEXT,chat_id TEXT,is_group INTEGER,name TEXT,deal_id TEXT,last_message_text TEXT,last_message_at INTEGER,updated_at TEXT);
 INSERT INTO pipelines VALUES('p','Pllato','{"a":{"name":"Аванс"},"b":{"name":"Первый этап"}}');
 INSERT INTO deals VALUES('deal_1','Тест','c','manager');
 INSERT INTO contacts VALUES('c','Клиент','Тест','[{"value":"+7 701 000 00 01"}]');
 INSERT INTO users VALUES('manager','Менеджер','','77010000002',1),('dev','Разработчик','','77010000003',1);
 INSERT INTO wa_channels VALUES('ch','123','https://api.green-api.com','test-token','Рабочий',1);`);
 const DB={prepare(sql){return {args:[],bind(...args){this.args=args;return this;},async first(){return db.prepare(sql).get(...this.args)||null;},async all(){return {results:db.prepare(sql).all(...this.args)};},async run(){return db.prepare(sql).run(...this.args);}};},async batch(xs){return Promise.all(xs.map(s=>s.run()));}};
 const env={DB},deps={json:(d,s=200)=>Response.json(d,{status:s}),requireAuthFlexible:async()=>({claims:{}}),resolveCanonicalUser:async()=>({role:'admin'}),dealAccessSql:()=>({where:'',params:[]})};
 await groupSchema(env);
 const request=(method='GET',body,path='rules?pipeline=p')=>handleStageGroups(new Request('https://crm.test/api/wa/stage-groups/'+path,{method,body:body?JSON.stringify(body):undefined}),env,deps);
 const rules=[{stage_id:'a',channel_id:'ch',employee_uids:[]},{stage_id:'b',channel_id:'ch',employee_uids:['dev']}];
 const stage=(s='a')=>db.prepare('INSERT INTO deal_stage_events(deal_id,pipeline_id,stage_id,entered_at) VALUES(?,?,?,?)').run('deal_1','p',s,new Date().toISOString());
 const calls=[];let members=new Set(['77010000002@c.us']),admins=new Set();
 const fetch=async(url,opt)=>{
  const method=new URL(url).pathname.split('/')[2],body=JSON.parse(opt.body);calls.push({method,body});
  if(method==='checkWhatsapp')return Response.json({existsWhatsapp:true,chatId:body.chatId});
  if(method==='createGroup')return Response.json({created:true,chatId:'123456@g.us',groupInviteLink:'https://chat.whatsapp.com/testinvite'});
  if(method==='getGroupData')return Response.json({participants:[...members].map(id=>({id,isAdmin:admins.has(id)})),groupInviteLink:'https://chat.whatsapp.com/testinvite'});
  if(method==='addGroupParticipant'){if(body.participantChatId==='77010000003@c.us'){members.add(body.participantChatId);return Response.json({addParticipant:true});}return Response.json({addParticipant:false});}
  if(method==='setGroupAdmin'){admins.add(body.participantChatId);return Response.json({setGroupAdmin:true});}
  if(method==='sendMessage')return Response.json({idMessage:'sent'});
  throw new Error('Unexpected method '+method);
 };
 return {db,env,deps,request,rules,stage,calls,fetch,members,admins};
}
test('имя группы: контакт и дата Алматы, ограничение 100 символов',()=>{assert.equal(groupName('Иван',new Date('2026-09-29T20:00:00Z')),'Иван - Pllato IT разработка - CRM - 30.09.2026');assert.equal(groupName('я'.repeat(200)).length,100);assert.equal(groupPhone('8 (701) 000-00-01'),'77010000001');assert.equal(groupPhone('123'),null);});
test('только будущие переходы, группа одна, личное приглашение один раз, следующий этап добавляет сотрудника',async()=>{
 const f=await fixture();f.stage();assert.equal((await f.request('PUT',{rules:f.rules})).status,200);
 const prev=globalThis.fetch;globalThis.fetch=f.fetch;
 try{
  await processStageGroups(f.env);assert.equal(f.calls.length,0);
  f.stage();await processStageGroups(f.env);
  assert.equal(f.calls.filter(x=>x.method==='createGroup').length,1);assert.equal(f.calls.filter(x=>x.method==='sendMessage'&&x.body.chatId.endsWith('@c.us')).length,1);
  assert.equal(f.calls.find(x=>x.method==='sendMessage'&&x.body.chatId.endsWith('@c.us')).body.chatId,'77010000001@c.us');
  assert.equal(f.db.prepare('SELECT deal_id FROM wa_chats').get().deal_id,'deal_1');
  f.stage();await processStageGroups(f.env);f.stage('b');await processStageGroups(f.env);
  assert.equal(f.calls.filter(x=>x.method==='createGroup').length,1);assert.equal(f.calls.filter(x=>x.method==='sendMessage'&&x.body.chatId.endsWith('@c.us')).length,1);
  assert.equal(f.db.prepare("SELECT status FROM wa_group_people WHERE chat_id='77010000003@c.us'").get().status,'member');
 }finally{globalThis.fetch=prev;}
});
test('неопределённый результат создания не повторяет POST',async()=>{
 const f=await fixture();await f.request('PUT',{rules:f.rules});f.stage();const prev=globalThis.fetch;
 let calls=0;globalThis.fetch=async(url,opt)=>{if(String(url).includes('/checkWhatsapp/'))return Response.json({existsWhatsapp:true});calls++;throw new Error('timeout');};
 try{await processStageGroups(f.env);assert.equal(calls,1);f.db.exec("UPDATE wa_stage_group_jobs SET status='pending'");await processStageGroups(f.env);assert.equal(calls,1);assert.match(f.db.prepare('SELECT error FROM wa_stage_group_jobs').get().error,/не подтверждено/);}finally{globalThis.fetch=prev;}
});
test('настройки администратора, доступ к сделке и проверка телефонов',async()=>{
 const f=await fixture();f.deps.resolveCanonicalUser=async()=>({role:'agent'});assert.equal((await f.request()).status,403);
 f.deps.dealAccessSql=()=>({where:' AND 0=1',params:[]});assert.equal((await f.request('GET',undefined,'deals/deal_1')).status,403);
 f.deps.resolveCanonicalUser=async()=>({role:'admin'});f.db.exec("UPDATE users SET phone=NULL WHERE uid='dev'");assert.equal((await f.request('PUT',{rules:f.rules})).status,400);
});
test('не больше одной новой группы за 5 минут с рабочего номера',async()=>{
 const f=await fixture();await f.request('PUT',{rules:f.rules});f.stage();f.db.exec("INSERT INTO deals VALUES('deal_2','Второй','c','manager')");
 const prev=globalThis.fetch;globalThis.fetch=f.fetch;
 try{await processStageGroups(f.env);f.db.prepare("INSERT INTO deal_stage_events(deal_id,pipeline_id,stage_id) VALUES('deal_2','p','a')").run();await processStageGroups(f.env);assert.equal(f.calls.filter(x=>x.method==='createGroup').length,1);assert.equal(f.db.prepare("SELECT status FROM wa_stage_group_jobs WHERE deal_id='deal_2'").get().status,'pending');}finally{globalThis.fetch=prev;}
});
test('неопределённая отправка приглашения не рассылается повторно; отключение отменяет очередь',async()=>{
 const f=await fixture();await f.request('PUT',{rules:f.rules});f.stage();const prev=globalThis.fetch;
 let sends=0;globalThis.fetch=async(url,opt)=>{if(String(url).includes('/sendMessage/')&&JSON.parse(opt.body).chatId.endsWith('@c.us')){sends++;throw new Error('timeout');}return f.fetch(url,opt);};
 try{
  await processStageGroups(f.env);assert.equal(sends,1);
  f.db.exec("UPDATE wa_stage_group_jobs SET status='pending'");await processStageGroups(f.env);assert.equal(sends,1);
  f.stage('b');await f.request('PUT',{rules:[]});await processStageGroups(f.env);assert.equal(f.calls.filter(x=>x.method==='addGroupParticipant'&&x.body.participantChatId==='77010000003@c.us').length,0);
 }finally{globalThis.fetch=prev;}
});
test('нельзя запустить создание без WhatsApp у участника',async()=>{
 const f=await fixture();await f.request('PUT',{rules:f.rules});f.stage();const prev=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({existsWhatsapp:false});
 try{await processStageGroups(f.env);assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM wa_deal_groups').get().n,0);assert.match(f.db.prepare('SELECT error FROM wa_stage_group_jobs').get().error,/не найден/);}finally{globalThis.fetch=prev;}
});
test('карточка возвращает только свои группы с точным каналом отправки',async()=>{
 const f=await fixture();f.db.exec("INSERT INTO wa_chats(id,instance_id,chat_id,is_group,name,deal_id) VALUES('wa:123:11@g.us','123','11@g.us',1,'Своя','deal_1'),('wa:999:22@g.us','999','22@g.us',1,'Чужая','deal_2'),('wa:123:33@c.us','123','33@c.us',0,'Личная','deal_1')");
 const data=await (await f.request('GET',undefined,'deals/deal_1')).json();assert.deepEqual(data.chats,[{id:'wa:123:11@g.us',chat_id:'11@g.us',instance_id:'123',name:'Своя'}]);
 f.deps.dealAccessSql=()=>({where:' AND 0=1',params:[]});assert.equal((await f.request('GET',undefined,'deals/deal_1')).status,403);
});
test('менеджер создаёт вручную без правил этапов; повторный запрос не создаёт дубль',async()=>{
 const f=await fixture();f.deps.resolveCanonicalUser=async()=>({role:'agent'});
 const body={action:'create',channel_id:'ch',employee_uids:['dev']};
 assert.equal((await f.request('POST',body,'deals/deal_1')).status,202);
 assert.equal((await f.request('POST',body,'deals/deal_1')).status,409);
 const prev=globalThis.fetch;globalThis.fetch=f.fetch;
 try{await processStageGroups(f.env);await processStageGroups(f.env);
 assert.equal(f.calls.filter(c=>c.method==='createGroup').length,1);
 assert.equal(f.db.prepare('SELECT status FROM wa_manual_group_jobs').get().status,'done');
 assert.equal(f.db.prepare('SELECT deal_id FROM wa_chats').get().deal_id,'deal_1');
 assert.equal((await f.request('POST',body,'deals/deal_1')).status,409);
 }finally{globalThis.fetch=prev;}
});
test('ручное создание проверяет доступ, телефон менеджера и канал до постановки в очередь',async()=>{
 const f=await fixture(),body={action:'create',channel_id:'ch',employee_uids:[]};
 f.deps.dealAccessSql=()=>({where:' AND 0=1',params:[]});assert.equal((await f.request('POST',body,'deals/deal_1')).status,403);
 f.deps.dealAccessSql=()=>({where:'',params:[]});assert.equal((await f.request('POST',{...body,channel_id:'missing'},'deals/deal_1')).status,400);
 f.db.exec("UPDATE users SET phone='' WHERE uid='manager'");assert.equal((await f.request('POST',body,'deals/deal_1')).status,400);
 assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM wa_manual_group_jobs').get().n,0);
});
test('приветствие первое автоматическое сообщение, однократно при ручном и автоматическом создании',async()=>{
 for(const manual of [true,false]){
  const f=await fixture();
  await f.request('PUT',{rules:f.rules});
  if(manual)await f.request('POST',{action:'create',channel_id:'ch',employee_uids:[]},'deals/deal_1');else f.stage();
  const prev=globalThis.fetch;globalThis.fetch=f.fetch;
  try{
   await processStageGroups(f.env);f.stage('b');await processStageGroups(f.env);
   const sends=f.calls.filter(c=>c.method==='sendMessage');
   assert.equal(sends[0].body.chatId,'123456@g.us');assert.match(sends[0].body.message,/Добро пожаловать в Pllato/);
   assert.equal(sends.filter(c=>c.body.chatId.endsWith('@g.us')).length,1);
  }finally{globalThis.fetch=prev;}
 }
});
test('при потерянном ответе приветствие не дублируется',async()=>{
 const f=await fixture();await f.request('PUT',{rules:f.rules});f.stage();const prev=globalThis.fetch;let welcomes=0;
 globalThis.fetch=async(url,opt)=>{if(String(url).includes('/sendMessage/')&&JSON.parse(opt.body).chatId.endsWith('@g.us')){welcomes++;throw new Error('timeout');}return f.fetch(url,opt);};
 try{await processStageGroups(f.env);f.db.exec("UPDATE wa_stage_group_jobs SET status='pending'");await processStageGroups(f.env);assert.equal(welcomes,1);assert.equal(f.db.prepare('SELECT status FROM wa_group_welcome').get().status,'sending');}finally{globalThis.fetch=prev;}
});
test('карточка показывает общие правила своей воронки с именами сотрудников',async()=>{
 const f=await fixture();f.db.exec("ALTER TABLE deals ADD COLUMN pipeline_id TEXT; UPDATE deals SET pipeline_id='p'");
 await f.request('PUT',{rules:f.rules});
 const data=await (await f.request('GET',undefined,'deals/deal_1')).json();
 assert.equal(data.pipeline.name,'Pllato');assert.deepEqual(data.stageRules.map(r=>({stage:r.stage,employees:r.employees})),[{stage:'Аванс',employees:[]},{stage:'Первый этап',employees:['Разработчик']}]);
});

test('опция назначает всех присутствующих и поздних участников, повторно админов не трогает',async()=>{
 const f=await fixture();await f.request('POST',{action:'create',channel_id:'ch',employee_uids:['dev']},'deals/deal_1');
 const previous=globalThis.fetch;globalThis.fetch=f.fetch;
 try{await processStageGroups(f.env);assert.ok(f.admins.has('77010000002@c.us'));assert.ok(f.admins.has('77010000003@c.us'));assert.ok(!f.admins.has('77010000001@c.us'));
 const before=f.calls.filter(c=>c.method==='setGroupAdmin').length;
 f.members.add('77010000001@c.us');f.db.exec('UPDATE wa_group_admin_policy SET checked_at=0');await processStageGroups(f.env);
 assert.ok(f.admins.has('77010000001@c.us'));assert.equal(f.calls.filter(c=>c.method==='setGroupAdmin').length,before+1);
 f.db.exec('UPDATE wa_group_admin_policy SET checked_at=0');await processStageGroups(f.env);assert.equal(f.calls.filter(c=>c.method==='setGroupAdmin').length,before+1);
 assert.equal((await (await f.request('GET',undefined,'deals/deal_1')).json()).adminPolicy.status,'active');
 }finally{globalThis.fetch=previous;}
});
test('правило этапа сохраняет опцию; ошибка назначения видна и повтор не создаёт новую группу',async()=>{
 const f=await fixture();await f.request('PUT',{rules:f.rules});assert.equal((await (await f.request()).json()).rules[0].all_admins,true);f.stage();
 const previous=globalThis.fetch;globalThis.fetch=async(url,opt)=>String(url).includes('/setGroupAdmin/')?Response.json({setGroupAdmin:false}):f.fetch(url,opt);
 try{await processStageGroups(f.env);assert.equal(f.db.prepare('SELECT status FROM wa_group_admin_policy').get().status,'error');globalThis.fetch=f.fetch;f.db.exec('UPDATE wa_group_admin_policy SET checked_at=0');await processStageGroups(f.env);assert.equal(f.db.prepare('SELECT status FROM wa_group_admin_policy').get().status,'active');assert.equal(f.calls.filter(c=>c.method==='createGroup').length,1);}finally{globalThis.fetch=previous;}
});
test('явное отключение сохраняет обычные права участников',async()=>{
 const f=await fixture();await f.request('POST',{action:'create',channel_id:'ch',employee_uids:[],all_admins:false},'deals/deal_1');const previous=globalThis.fetch;globalThis.fetch=f.fetch;
 try{await processStageGroups(f.env);assert.equal(f.calls.filter(c=>c.method==='setGroupAdmin').length,0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM wa_group_admin_policy').get().n,0);}finally{globalThis.fetch=previous;}
});

test('старое название переносит имя вперёд, сохраняет дату, подтверждает WhatsApp и не повторяется',async()=>{
 const f=await fixture(),old='Pllato IT разработка - CRM - Азат - 29.09.2026',name='Азат - Pllato IT разработка - CRM - 29.09.2026';
 f.db.prepare('INSERT INTO wa_deal_groups(deal_id,channel_id,group_id,name,created_at) VALUES(?,?,?,?,?)').run('deal_1','ch','123456@g.us',old,123);
 f.db.prepare('INSERT INTO wa_chats(id,instance_id,chat_id,is_group,name,deal_id) VALUES(?,?,?,?,?,?)').run('chat','123','123456@g.us',1,old,'deal_1');
 let subject=old,updates=0;const prev=globalThis.fetch;
 globalThis.fetch=async(url,opt)=>{const body=JSON.parse(opt.body);assert.equal(body.groupId,'123456@g.us');if(url.includes('/updateGroupName/')){updates++;subject=body.groupName;return Response.json({updateGroupName:true});}return Response.json({subject});};
 try{await migrateGroupNames(f.env);await migrateGroupNames(f.env);
 assert.equal(updates,1);assert.equal(subject,name);assert.equal(f.db.prepare('SELECT name FROM wa_chats').get().name,name);
 assert.deepEqual({...f.db.prepare('SELECT name,created_at,group_id FROM wa_deal_groups').get()},{name,created_at:123,group_id:'123456@g.us'});
 }finally{globalThis.fetch=prev;}
});
test('отказ WhatsApp оставляет старое имя; повтор проверяет результат до нового POST',async()=>{
 const f=await fixture(),old='Pllato IT разработка - CRM - Азат - 29.09.2026',name='Азат - Pllato IT разработка - CRM - 29.09.2026';
 f.db.prepare('INSERT INTO wa_deal_groups(deal_id,channel_id,group_id,name,created_at) VALUES(?,?,?,?,?)').run('deal_1','ch','123456@g.us',old,123);
 const prev=globalThis.fetch;let subject=old,updates=0;
 globalThis.fetch=async(url)=>{if(url.includes('/updateGroupName/')){updates++;return Response.json({updateGroupName:false});}return Response.json({subject});};
 try{await migrateGroupNames(f.env,1000);assert.equal(f.db.prepare('SELECT name FROM wa_deal_groups').get().name,old);
 assert.match(f.db.prepare('SELECT error FROM wa_group_name_migration').get().error,/не подтвердил/);
 await migrateGroupNames(f.env,2000);assert.equal(updates,1);
 subject=name;await migrateGroupNames(f.env,3601001);assert.equal(updates,1);assert.equal(f.db.prepare('SELECT name FROM wa_deal_groups').get().name,name);
 }finally{globalThis.fetch=prev;}
});
test('ручное название WhatsApp не перезаписывается миграцией',async()=>{
 const f=await fixture();f.db.prepare('INSERT INTO wa_deal_groups(deal_id,channel_id,group_id,name,created_at) VALUES(?,?,?,?,?)').run('deal_1','ch','123456@g.us','Pllato IT разработка - CRM - Азат - 29.09.2026',123);
 const prev=globalThis.fetch;globalThis.fetch=async(url)=>{assert.ok(url.includes('/getGroupData/'));return Response.json({subject:'Личное название'});};
 try{await migrateGroupNames(f.env);assert.match(f.db.prepare('SELECT error FROM wa_group_name_migration').get().error,/вручную/);}finally{globalThis.fetch=prev;}
});
