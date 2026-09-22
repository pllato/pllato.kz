import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { ensureWaHistorySchema, historyMessage, syncWaHistory } from './wa-history.js';

const sql = new DatabaseSync(':memory:');
sql.exec(`CREATE TABLE kv(k TEXT PRIMARY KEY, v TEXT);
  CREATE TABLE wa_channels(id_instance TEXT PRIMARY KEY, api_url TEXT, api_token_instance TEXT, active INTEGER);
  CREATE TABLE wa_chats(id TEXT PRIMARY KEY, instance_id TEXT, chat_id TEXT, is_group INTEGER,
    deal_id TEXT, last_message_text TEXT, last_message_at INTEGER, last_message_from TEXT,
    unread_count INTEGER, updated_at TEXT);
  CREATE TABLE wa_messages(id TEXT PRIMARY KEY, chat_id TEXT, wa_message_id TEXT, direction TEXT,
    text TEXT, media_kind TEXT, media_url TEXT, media_file_name TEXT, media_mime_type TEXT,
    caption TEXT, sender_name TEXT, meta_ad_id TEXT, meta_ad_attribution TEXT, ts INTEGER);
  CREATE TABLE deals(id TEXT PRIMARY KEY, source_id TEXT, source_description TEXT, meta_ad_id TEXT, meta_ad_attribution TEXT);
  INSERT INTO wa_channels VALUES ('1','https://api.green-api.com','test-only',1);
  INSERT INTO wa_chats VALUES ('wa:1:chat','1','chat',0,'deal', '⚠ Сообщение не синхронизировано',9999999,'them',3,NULL);
  INSERT INTO deals(id) VALUES ('deal');`);
const db = {
  prepare(query) {
    let params=[];
    return { bind(...p) { params=p; return this; },
      async first() { return sql.prepare(query).get(...params) || null; },
      async all() { return {results:sql.prepare(query).all(...params)}; },
      async run() { const r=sql.prepare(query).run(...params); return {meta:{changes:Number(r.changes)}}; },
    };
  },
  async batch(statements) { sql.exec('BEGIN'); try { const r=await Promise.all(statements.map(s=>s.run())); sql.exec('COMMIT'); return r; } catch(e) { sql.exec('ROLLBACK'); throw e; } },
};
await ensureWaHistorySchema(db);
const history=[{idMessage:'in1',chatId:'chat',type:'incoming',timestamp:100,typeMessage:'extendedTextMessage',textMessage:'Сколько стоит?',extendedTextMessage:{sourceId:'ad123',title:'Реклама'}},
  {idMessage:'out1',chatId:'chat',type:'outgoing',timestamp:110,typeMessage:'imageMessage',downloadUrl:'https://example.com/image',caption:'Фото',mimeType:'image/jpeg'}];
let calls=0;
const provider=async()=>{calls++;return Response.json(history);};
assert.equal((await syncWaHistory(db,'wa:1:chat',provider,1000000)).status,'synced');
assert.equal(sql.prepare('SELECT count(*) n FROM wa_messages').get().n,2);
assert.equal(sql.prepare("SELECT id FROM wa_messages WHERE wa_message_id='in1'").get().id,'wa:1:in1','same IDs as live webhook');
assert.equal(sql.prepare('SELECT unread_count FROM wa_chats').get().unread_count,3,'history must preserve unread state');
assert.equal(sql.prepare('SELECT last_message_at FROM wa_chats').get().last_message_at,110000,'shell discovery time replaced by real message time');
assert.equal(sql.prepare('SELECT meta_ad_id FROM deals').get().meta_ad_id,'ad123');
await syncWaHistory(db,'wa:1:chat',provider,1000100);
assert.equal(calls,1,'polling does not hammer provider');
sql.exec("UPDATE wa_chats SET last_message_at=99999999,last_message_text='new live message'");
await syncWaHistory(db,'wa:1:chat',provider,2000000);
assert.equal(sql.prepare('SELECT count(*) n FROM wa_messages').get().n,2,'repeated recovery is idempotent');
assert.equal(sql.prepare('SELECT last_message_text FROM wa_chats').get().last_message_text,'new live message');
sql.exec("UPDATE wa_history_sync SET retry_at=0");
assert.equal((await syncWaHistory(db,'wa:1:chat',async()=>Response.json([]),3000000)).status,'provider_empty');
assert.equal(sql.prepare('SELECT count(*) n FROM wa_messages').get().n,2,'empty provider cannot erase history');
sql.exec("UPDATE wa_history_sync SET retry_at=0");
assert.equal((await syncWaHistory(db,'wa:1:chat',async()=>new Response('',{status:429}),4000000)).status,'error');
assert.ok(sql.prepare('SELECT retry_at FROM wa_history_sync').get().retry_at>4000000);
sql.exec("UPDATE wa_history_sync SET retry_at=0");
assert.equal((await syncWaHistory(db,'wa:1:chat',provider,4000100)).status,'pending','shared instance rate limit');
assert.equal(historyMessage({...history[0],chatId:'other'}, {id:'wa:1:chat',chat_id:'chat'}),null);
assert.equal(historyMessage({...history[0],timestamp:'bad'}, {chat_id:'chat'}),null);

// Exercise the actual bulk-phone handler with a D1 parameter-limit adapter.
const source=readFileSync(new URL('./worker.js',import.meta.url),'utf8');
const start=source.indexOf('async function handleContactsPhonesBulk(');
const end=source.indexOf('\n// Батч:',start);
const batchSizes=[];
const context=vm.createContext({URL, requireAuthFlexible:async()=>({}),json:data=>data});
vm.runInContext(source.slice(start,end),context);
const ids=Array.from({length:200},(_,i)=>`contact_${i}`);
const response=await context.handleContactsPhonesBulk(new Request(`https://test/api/contacts/phones?ids=${ids.join(',')}`),{DB:{prepare(){return{bind(...args){assert.ok(args.length<=100);batchSizes.push(args.length);return{async all(){return{results:args.map(id=>({id,phones:JSON.stringify([{value:'+77000000000'}])}))};}};}};}}});
assert.equal(Object.keys(response.items).length,200);
assert.deepEqual(batchSizes,[80,80,40]);
const webhookStart=source.indexOf('async function handleWaWebhook(');
const webhookEnd=source.indexOf('\n// POST /api/wa/send',webhookStart);
const webhookContext=vm.createContext({URL,
  extractWaWebhookEnvelope:()=>({instanceId:'1',waMessageId:'in1'}),
  getWaChannelByInstance:async()=>({active:1,webhook_token:'test-only'}),
  waMessageDocId:(instance,id)=>`wa:${instance}:${id}`,
  json:(data,status)=>({data,status}),
});
vm.runInContext(source.slice(webhookStart,webhookEnd),webhookContext);
const duplicate=await webhookContext.handleWaWebhook(new Request('https://test/api/wa/webhook?token=test-only',{method:'POST',body:'{}'}),{DB:db});
assert.equal(duplicate.data.duplicate,true);
assert.equal(sql.prepare('SELECT unread_count FROM wa_chats').get().unread_count,3);
const unauthorized=await webhookContext.handleWaWebhook(new Request('https://test/api/wa/webhook?token=wrong',{method:'POST',body:'{}'}),{DB:db});
assert.equal(unauthorized.status,401,'duplicate guard must not bypass webhook authentication');
console.log('WhatsApp recovery + 200-contact phone loading: all tests passed');
