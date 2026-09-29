import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../team.html',import.meta.url),'utf8');
const code=html.slice(html.indexOf('async function mountWhatsappPaneInDeal'),html.indexOf('// ── Лента событий сделки'));
const deferred=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve};};
function fixture({phone='77010000001',fetchHook}={}){
 const elements={};
 const element=()=>({style:{},dataset:{},value:'',children:[],isConnected:true,innerHTML:'',textContent:'',scrollHeight:0,scrollTop:0,clientHeight:0,replaceChildren(){this.children=[];},appendChild(c){this.children.push(c);},setAttribute(){},addEventListener(){},insertAdjacentHTML(_,s){this.innerHTML+=s;}});
 for(const id of ['pane','body','input','send','attach','voice','status','tabs'])elements['#dc-wa-'+id]=element();
 const modal={querySelector:id=>elements[id]},pane=elements['#dc-wa-pane'];pane.querySelector=modal.querySelector;
 const requests=[];
 const context=vm.createContext({console,encodeURIComponent,Date,JSON,parseInt,document:{createElement:element,getElementById:id=>elements['#'+id]},window:{},setInterval:()=>1,clearInterval(){},setTimeout(){},alert(){},WORKER_BASE_URL:'https://test',fbAuth:{currentUser:{getIdToken:async()=>'test'}},getDealRecordId:()=> 'deal_1',findWaRecipientChat:items=>items?.[0],escapeHtml:s=>s,renderWaMessageHtml:(m,group)=>`${group?'group:':'private:'}${m.text}`,bindWaVoiceButton(){},bindWaAttachButton(){},fetch:async(url,opts)=>{
   requests.push({url,body:opts?.body&&JSON.parse(opts.body)});
   const hook=fetchHook?.(url,opts);if(hook)return hook;
   if(url.includes('/chats?'))return Response.json({items:[{id:'wa:11:77010000001@c.us',instanceId:'11'}]});
   if(url.includes('/stage-groups/'))return Response.json({chats:[{id:'wa:22:123@g.us',instance_id:'22',chat_id:'123@g.us',name:'Проект'}]});
   if(url.includes('/messages?'))return Response.json({items:[]});
   return Response.json({ok:true});
 }});
 vm.runInContext(code,context);
 return {context,e:elements,pane,requests,mount:()=>context.mountWhatsappPaneInDeal(modal,{},{},phone,'Клиент')};
}
test('группа доступна без телефона клиента; отправка использует групповой ID и его канал',async()=>{
 const f=fixture({phone:''});await f.mount();f.e['#dc-wa-input'].value='В группу';await f.e['#dc-wa-send'].onclick();
 const send=f.requests.find(r=>r.url.endsWith('/send'));assert.deepEqual(send.body,{chatId:'wa:22:123@g.us',phone:'',instanceId:'22',text:'В группу',mediaUrl:'',fileName:''});
});
test('переключение во время отправки сохраняет получателя и новый черновик',async()=>{
 const pending=deferred();const f=fixture({fetchHook:url=>url.endsWith('/send')?pending.promise:null});await f.mount();
 f.e['#dc-wa-input'].value='Личное';const sending=f.e['#dc-wa-send'].onclick();await new Promise(r=>setImmediate(r));
 f.e['#dc-wa-tabs'].children[1].onclick();f.e['#dc-wa-input'].value='Черновик группы';
 pending.resolve(Response.json({chatId:'wa:11:77010000001@c.us'}));await sending;
 assert.equal(f.requests.find(r=>r.url.endsWith('/send')).body.chatId,'wa:11:77010000001@c.us');assert.equal(f.e['#dc-wa-input'].value,'Черновик группы');assert.equal(f.pane._waState.canonicalChatId,'wa:22:123@g.us');
 f.e['#dc-wa-tabs'].children[0].onclick();assert.equal(f.e['#dc-wa-input'].value,'');
 f.e['#dc-wa-tabs'].children[1].onclick();assert.equal(f.e['#dc-wa-input'].value,'Черновик группы');
});
test('запоздавшие сообщения личного чата не попадают в группу и не отмечаются прочитанными',async()=>{
 const pending=deferred();const f=fixture({fetchHook:url=>url.includes('/messages?')&&url.includes('77010000001')?pending.promise:null});await f.mount();
 f.e['#dc-wa-tabs'].children[1].onclick();await new Promise(r=>setImmediate(r));
 pending.resolve(Response.json({items:[{text:'Личное секретное',ts:1}]}));await new Promise(r=>setImmediate(r));
 assert.ok(!f.e['#dc-wa-body'].innerHTML.includes('секретное'));
 assert.ok(!f.requests.some(r=>r.url.endsWith('/mark-read')&&r.body.chatId.includes('77010000001')));
});
