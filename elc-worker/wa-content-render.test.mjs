import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../team.html',import.meta.url),'utf8');
test('обновляет последние сообщения даже при неизменном количестве',async()=>{
 const body={dataset:{},innerHTML:'',scrollHeight:10,scrollTop:0};
 let items=[{id:'one',text:'Старое',ts:1000}];
 const c=vm.createContext({document:{getElementById:()=>body},fbAuth:{currentUser:{getIdToken:async()=>''}},WORKER_BASE_URL:'https://test',fetch:async()=>({ok:true,json:async()=>({items})}),renderWaMessageHtml:m=>m.text,formatWaDayLabel:()=>'',escapeHtml:s=>s});
 vm.runInContext(source.slice(source.indexOf('async function renderWaMessages('),source.indexOf('\nfunction formatWaDayLabel(')),c);
 await c.renderWaMessages('group@g.us');assert.match(body.innerHTML,/Старое/);
 items=[{id:'two',text:'Новое',ts:2000}];await c.renderWaMessages('group@g.us',{silent:true});assert.match(body.innerHTML,/Новое/);
 items=[{id:'two',text:'Восстановленное',ts:2000}];await c.renderWaMessages('group@g.us',{silent:true});assert.match(body.innerHTML,/Восстановленное/);
});
test('сообщение без доступного содержимого не выглядит пустым',()=>{
 const c=vm.createContext({waSenderColor:()=>'',escapeHtml:s=>s,renderMetaAdAttributionHtml:()=>''});
 const start=source.indexOf('function renderWaMessageHtml('),end=source.indexOf('// ── Embedded WhatsApp pane',start);
 vm.runInContext(source.slice(start,end),c);
 assert.match(c.renderWaMessageHtml({direction:'in',ts:1000,senderName:'Клиент'},true),/Содержимое сообщения пока недоступно/);
});
