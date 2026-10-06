import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {clientGroupSchema,clientGroupPhones,readClientGroups,refreshClientGroups,requestClientGroupRefresh,processClientGroupRefresh} from './wa-client-groups.js';
async function fixture(){
 const db=new DatabaseSync(':memory:');db.exec(`CREATE TABLE contacts(id TEXT,phones TEXT);CREATE TABLE wa_channels(id TEXT,id_instance TEXT,api_url TEXT,api_token_instance TEXT,active INTEGER);CREATE TABLE wa_chats(id TEXT PRIMARY KEY,instance_id TEXT,chat_id TEXT,is_group INTEGER,name TEXT,last_message_text TEXT,last_message_at INTEGER,updated_at TEXT,deal_id TEXT);INSERT INTO wa_channels VALUES('a','111','https://example.test','test',1),('b','222','https://example.test','test',1);INSERT INTO contacts VALUES('c','[{"value":"+7 701 000 00 01"},{"VALUE":"8 (701) 000-00-02"}]');`);
 const env={DB:{prepare(sql){const result=args=>({first:async()=>db.prepare(sql).get(...args),all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>db.prepare(sql).run(...args)});return{...result([]),bind:(...args)=>result(args)};},batch:async rows=>{db.exec('BEGIN');try{const r=[];for(const row of rows)r.push(await row.run());db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}}};await clientGroupSchema(env);return{db,env};
}
test('existing groups match phone/LID by channel; shared membership never overwrites deal; no sends',async()=>{
 const {db,env}=await fixture();const prev=globalThis.fetch;let members=['77010000001@c.us','77010000002@c.us'];const methods=[];
 globalThis.fetch=async(url,opt)=>{const parts=new URL(url).pathname.split('/');const method=parts[2],instance=parts[1];methods.push(method);if(method==='getContacts')return Response.json([{id:'123@g.us',name:'Existing group'}]);if(method==='checkWhatsapp')return Response.json({existsWhatsapp:true,chatId:instance==='waInstance111'?'opaque@lid':'other@lid'});if(method==='getGroupData')return Response.json({participants:(instance==='waInstance111'?members:['different@lid']).map(id=>({id}))});throw Error('Unexpected write '+method);};
 try{
  const phones=await clientGroupPhones(env,'c');assert.deepEqual(phones,['77010000001','77010000002']);
  await requestClientGroupRefresh(env,phones);await processClientGroupRefresh(env);
  assert.equal((await readClientGroups(env,phones)).chats.length,1);
  assert.equal((await readClientGroups(env,['77010000002'])).chats[0].instance_id,'111');
  assert.equal((await readClientGroups(env,['77010000099'])).chats.length,0);
  db.exec("UPDATE wa_chats SET deal_id='original' WHERE instance_id='111'");members=['opaque@lid'];await refreshClientGroups(env,phones,true);
  assert.equal((await readClientGroups(env,phones)).chats.length,1,'hidden phone resolves through the same channel LID');
  assert.equal(db.prepare("SELECT deal_id FROM wa_chats WHERE instance_id='111'").get().deal_id,'original');
  members=[];await refreshClientGroups(env,phones,true);assert.equal((await readClientGroups(env,phones)).chats.length,0,'departed participant no longer matches');
  assert.ok(methods.every(m=>['getContacts','checkWhatsapp','getGroupData'].includes(m)));
 }finally{globalThis.fetch=prev;}
});
test('large catalogs continue in bounded batches and cache avoids provider calls',async()=>{
 const {db,env}=await fixture();db.exec("DELETE FROM wa_channels WHERE id='b'");const prev=globalThis.fetch;let details=0;
 globalThis.fetch=async url=>{if(url.includes('/getContacts/'))return Response.json(Array.from({length:11},(_,i)=>({id:`${i+100}@g.us`,name:'Group '+i})));if(url.includes('/checkWhatsapp/'))return Response.json({existsWhatsapp:true});if(url.includes('/getGroupData/')){details++;return Response.json({participants:[{phoneNumber:'77010000001@c.us'}]});}throw Error('Unexpected');};
 try{await requestClientGroupRefresh(env,['77010000001']);await processClientGroupRefresh(env);assert.equal(details,8);assert.equal((await readClientGroups(env,['77010000001'])).discovery.checked,8);await processClientGroupRefresh(env);assert.equal(details,11);assert.equal((await readClientGroups(env,['77010000001'])).chats.length,11);await requestClientGroupRefresh(env,['77010000001']);await processClientGroupRefresh(env);assert.equal(details,11);}finally{globalThis.fetch=prev;}
});
