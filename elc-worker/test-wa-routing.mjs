import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// A phone can exist on two business lines. Replies must retain the opened
// chat's line rather than using the last updated chat for that phone.
const worker=readFileSync(new URL('./worker.js',import.meta.url),'utf8');
let delivered;
const context=vm.createContext({
  requireAuthFlexible:async()=>({claims:{}}), resolveCanonicalUser:async()=>({}),
  getWaChannelByInstance:async(_,instance)=>({id:instance}),
  deliverWaMessage:async(_,args)=>{delivered=args;return{idMessage:'test-message',chatDocId:'wa:line-A:phone@c.us'};},
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
