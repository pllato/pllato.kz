import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// A phone can exist on two business lines. Replies must retain the opened
// chat's line rather than using the last updated chat for that phone.
const worker=readFileSync(new URL('./worker.js',import.meta.url),'utf8');
let delivered;
let deliveries = 0;
const context=vm.createContext({
  requireAuthFlexible:async()=>({claims:{}}), resolveCanonicalUser:async()=>({}),
  getWaChannelByInstance:async(_,instance)=>({id:instance,id_instance:instance,active:1}),
  deliverWaMessage:async(_,args)=>{deliveries++;delivered=args;return{idMessage:'test-message',chatDocId:'wa:line-A:phone@c.us'};},
  waChatIdFromPhone:phone=>String(phone).replace(/\D/g,'').replace(/^8(\d{10})$/, '7$1')+'@c.us',
  auditLog:async()=>{}, json:(data,status)=>({data,status}),
});
const start=worker.indexOf('async function handleWaSend(');
vm.runInContext(worker.slice(start,worker.indexOf('// ── Отложенные',start)),context);
const env={DB:{prepare(query){assert.ok(query.includes('WHERE id = ? LIMIT 1'),'must resolve canonical chat, not fallback to another line');return{bind(id){assert.equal(id,'wa:line-A:phone@c.us');return{first:async()=>({instance_id:'line-A',chat_id:'phone@c.us'})};}};}}};
const send=async body=>context.handleWaSend(new Request('https://test/api/wa/send',{method:'POST',body:JSON.stringify(body)}),env);
assert.equal((await send({chatId:'wa:line-A:phone@c.us',text:'test'})).status,200);
assert.equal(delivered.channel.id,'line-A');
assert.equal(delivered.chatId,'phone@c.us');

const frontend=readFileSync(new URL('../app/pllato-crm.html',import.meta.url),'utf8');
const mediaStart=frontend.indexOf('async function sendWaMediaFile(');
const mediaContext=vm.createContext({
  uploadWaMediaFile:async()=>({publicUrl:'https://example.com/test',fileName:'test.ogg'}),
  fbAuth:{currentUser:{getIdToken:async()=>'test-only'}},WORKER_BASE_URL:'https://test',
  fetch:async(_,options)=>{const result=await send(JSON.parse(options.body));return{ok:true,json:async()=>result.data};},
});
vm.runInContext(frontend.slice(mediaStart,frontend.indexOf('// Открывает скрытый',mediaStart)),mediaContext);
await mediaContext.sendWaMediaFile({canonicalChatId:'wa:line-A:phone@c.us',rawChatId:'phone@c.us'},new Blob(['test']),'test.ogg','caption');
assert.equal(delivered.channel.id,'line-A');
assert.equal(delivered.mediaUrl,'https://example.com/test');
assert.equal(delivered.text,'caption');
console.log('WhatsApp text + media routing: all tests passed (no real messages sent)');

// A stale deal pane must fail closed for text and attachments, before any provider call.
const previousDeliveries=deliveries;
for (const payload of [{text:'test'},{mediaUrl:'https://example.com/test'}]) {
  assert.equal((await send({chatId:'wa:line-A:phone@c.us',phone:'77011239999',...payload})).status,409);
}
assert.equal(deliveries,previousDeliveries);
assert.equal((await send({chatId:'wa:line-A:phone@c.us',instanceId:'line-B',text:'test'})).status,409);
assert.equal(deliveries,previousDeliveries);

const helperStart=frontend.indexOf('function findWaRecipientChat(');
vm.runInContext(frontend.slice(helperStart,frontend.indexOf('async function openWaChatModal(',helperStart)),context);
const wrong={id:'wa:line-A:77775770557@c.us',chatId:'77775770557@c.us',contactId:'shared',dealId:undefined};
const right={id:'wa:line-A:77011239999@c.us',chatId:'77011239999@c.us',contactId:'shared'};
assert.equal(context.findWaRecipientChat([wrong,right],'77011239999@c.us'),right);
assert.equal(context.findWaRecipientChat([wrong],'77011239999@c.us'),null);
assert.equal(context.findWaRecipientChat([wrong,right],right.id),right);
console.log('Wrong-recipient and conflicting-channel requests are blocked before delivery');

// Real SQL: a connected line wins over a newer disconnected history, and
// unrelated recipients cannot leak into a phone-scoped lookup.
const {DatabaseSync}=await import('node:sqlite');
const db=new DatabaseSync(':memory:');
db.exec(`CREATE TABLE wa_channels(id_instance TEXT, active INTEGER, conn_state TEXT);
 CREATE TABLE wa_chats(id TEXT,instance_id TEXT,chat_id TEXT,phone TEXT,archived INTEGER,last_message_at INTEGER);
 INSERT INTO wa_channels VALUES ('old',1,'down'),('current',1,'up');
 INSERT INTO wa_chats VALUES
 ('wa:old:77011239999@c.us','old','77011239999@c.us','77011239999',0,999),
 ('wa:current:77011239999@c.us','current','77011239999@c.us','77011239999',0,1),
 ('wa:current:77775770557@c.us','current','77775770557@c.us','77775770557',0,1000);`);
const listContext=vm.createContext({URL,
 requireAuthFlexible:async()=>({claims:{}}),resolveCanonicalUser:async()=>({role:'admin'}),
 ensureWaArchivedColumn:async()=>{},ensureWaAvatarColumn:async()=>{},
 normalizeWaPhone:phone=>String(phone||'').replace(/\D/g,''),
 waChatIdFromPhone:phone=>`${phone}@c.us`,json:data=>data});
const listStart=worker.indexOf('async function handleWaListChats(');
vm.runInContext(worker.slice(listStart,worker.indexOf('// GET /api/wa/messages',listStart)),listContext);
const listing=await listContext.handleWaListChats(new Request('https://test/api/wa/chats?scope=all&phone=77011239999'),{DB:{prepare(query){return{bind(...params){return{all:async()=>({results:db.prepare(query).all(...params)})};}};}}});
assert.equal(listing.items.length,2);
assert.equal(listing.items[0].instanceId,'current');
assert.ok(listing.items.every(c=>c.chatId==='77011239999@c.us'));
console.log('Recipient SQL lookup selects connected line and excludes unrelated chats');

// Exercise both live entry points: the ELC page must never regress independently.
for (const file of ['../app/pllato-crm.html', '../team.html']) {
  const source=readFileSync(new URL(file,import.meta.url),'utf8');
  const helperStart=source.indexOf('function findWaRecipientChat(');
  const mountStart=source.indexOf('async function mountWhatsappPaneInDeal(');
  const mountEnd=source.indexOf('  // Первый рендер',mountStart);
  for (const includeRecipient of [true,false]) {
    const pane={};
    const body={};
    const recipient={id:'wa:current:77075263383@c.us',chatId:'77075263383@c.us',instanceId:'current'};
    const context=vm.createContext({
      fbAuth:{currentUser:{getIdToken:async()=>'test-only'}},WORKER_BASE_URL:'https://test',
      fetch:async url=>{
        assert.equal(new URL(url).searchParams.get('phone'),'77075263383');
        return {ok:true,json:async()=>({items:[{...wrong,dealId:null},...(includeRecipient?[recipient]:[])]})};
      }
    });
    vm.runInContext(source.slice(helperStart,source.indexOf('async function openWaChatModal(',helperStart)),context);
    vm.runInContext(source.slice(mountStart,mountEnd)+'return pane._waState;\n}',context);
    const state=await context.mountWhatsappPaneInDeal({querySelector:id=>id==='#dc-wa-pane'?pane:id==='#dc-wa-body'?body:null},{bitrixId:null},null,'+77075263383','Бейбут');
    assert.equal(state.rawChatId,'77075263383@c.us',file);
    assert.equal(state.phone,'77075263383',file);
    assert.equal(state.canonicalChatId,includeRecipient?recipient.id:null,file);
  }
}
console.log('Pllato and ELC deal panes: new lead cannot inherit unrelated history or recipient');
