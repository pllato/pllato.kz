import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const team=readFileSync(new URL('../team.html',import.meta.url),'utf8');
const section=(from,to)=>team.slice(team.indexOf(from),team.indexOf(to,team.indexOf(from)));
function bulkFixture(fetch){
 const fields={'deals-bulk-stage':{value:'WON'},'deals-bulk-responsible':{value:''}};
 const c=vm.createContext({Set,URLSearchParams,AbortSignal,fetch,document:{getElementById:id=>fields[id]||{},querySelectorAll:()=>[]},fbAuth:{currentUser:{getIdToken:async()=> 'token'}},dealsState:{view:'kanban',activePipelineId:'p1',search:'name',stageFilter:'',dealsByPipeline:{}},dealsPagedState:{selectedIds:new Set(),bulkBusy:false,page:1,items:[]},computeKanbanScope:()=>({scope:'mine',assignee:'u1'}),effectiveScope:()=> 'mine',WORKER_LIST_URL:'https://fixture/list',WORKER_BASE_URL:'https://fixture',showToast(){},renderDealsBulkActions(){},renderDealsPagedTable(){},renderDealsPagedPager(){},loadDealsPage:async()=>{},loadDealsData:async()=>{},renderDealsLayout(){}});
 vm.runInContext(section('function getDealRecordId(','function getDealPublicId(')+section('async function selectAllFilteredDeals(','function renderDealsPagedPager('),c);return c;
}
test('stage selection includes all 450 records over three pages and carries visibility filters',async()=>{
 const calls=[];const c=bulkFixture(async url=>{const q=new URL(url).searchParams;calls.push(q);const page=+q.get('page');return Response.json({total:450,items:Array.from({length:page===3?50:200},(_,i)=>({id:'deal_'+((page-1)*200+i)}))});});
 await c.selectAllFilteredDeals('NEW');assert.equal(c.dealsPagedState.selectedIds.size,450);assert.equal(calls.length,3);
 for(const q of calls){assert.equal(q.get('stage'),'NEW');assert.equal(q.get('scope'),'mine');assert.equal(q.get('assignee'),'u1');assert.equal(q.get('pipeline'),'p1');assert.equal(q.get('q'),'name');}
 await c.selectAllFilteredDeals('NEW',false);assert.equal(c.dealsPagedState.selectedIds.size,0);
});
test('selection failure does not add a partial stage',async()=>{
 let calls=0;const c=bulkFixture(async()=>{if(++calls===2)throw Error('offline');return Response.json({total:450,items:[{id:'deal_1'}]});});
 await c.selectAllFilteredDeals('NEW');assert.equal(c.dealsPagedState.selectedIds.size,0);assert.equal(c.dealsPagedState.bulkBusy,false);
});
test('bulk update keeps failed records selected and never retries confirmed successes',async()=>{
 let calls=0;const c=bulkFixture(async(url,opts)=>{calls++;const b=JSON.parse(opts.body);assert.ok(b.dealIds.length<=50);if(calls===2)throw Error('offline');return Response.json({updated:49,failed:[{dealId:'deal_4',error:'нет прав'}]});});
 for(let i=0;i<70;i++)c.dealsPagedState.selectedIds.add('deal_'+i);
 await c.applyDealsBulkUpdate();assert.equal(c.dealsPagedState.selectedIds.size,21);assert.ok(c.dealsPagedState.selectedIds.has('deal_4'));assert.ok(!c.dealsPagedState.selectedIds.has('deal_3'));assert.equal(c.dealsPagedState.bulkBusy,false);
});
test('column preferences are isolated per user and pipeline; stale fields are removed',()=>{
 const data=new Map();const c=vm.createContext({Set,window:{currentUser:{canonicalUid:'a'}},fbAuth:{},dealsState:{activePipelineId:'p1',customSchema:{level:{label:'Уровень'}}},localStorage:{getItem:k=>data.get(k)}});
 vm.runInContext(section('function dealListColumnOptions()','function dealListCell('),c);
 assert.equal(c.dealListColumns().length,5);data.set(c.dealListColumnsKey(),JSON.stringify(['cf:level','deleted','title']));assert.deepEqual([...c.dealListColumns()],['cf:level','title']);c.dealsState.activePipelineId='p2';assert.equal(c.dealListColumns().length,5);c.dealsState.activePipelineId='p1';c.window.currentUser.canonicalUid='b';assert.equal(c.dealListColumns().length,5);
});
test('right swipe goes back on mobile while vertical scroll and form controls do not',()=>{
 const chat=readFileSync(new URL('public/chat.js',import.meta.url),'utf8');const handlers={};let backs=0;const main={addEventListener:(name,fn)=>handlers[name]=fn};
 const c=vm.createContext({el:{querySelector:s=>s==='.tc-main'?main:true},backToChatList(){backs++},Date});
 vm.runInContext(chat.slice(chat.indexOf('    let swipeStart=null;'),chat.indexOf("    el.querySelector('#tc-new-ch-btn')")),c);
 const swipe=(dx,dy,control=false)=>{handlers.touchstart({touches:[{clientX:20,clientY:100}],target:{closest:()=>control}});handlers.touchend({changedTouches:[{clientX:20+dx,clientY:100+dy}]});};
 swipe(150,10);assert.equal(backs,1);swipe(120,150);swipe(-150,0);swipe(150,0,true);assert.equal(backs,1);
});
test('back action preserves the current chat draft',()=>{
 const chat=readFileSync(new URL('public/chat.js',import.meta.url),'utf8');const saved=[];const c=vm.createContext({state:{activeChannelId:'chat1',composerDraft:'Черновик'},saveDraft:(...a)=>saved.push(a),syncViewport(){},renderChannelList(){},renderMainHead(){},renderMessages(){},renderComposer(){}});
 vm.runInContext(chat.slice(chat.indexOf('  function backToChatList(){'),chat.indexOf('  function pluralMembers')),c);c.backToChatList();assert.deepEqual(saved,[['chat1','Черновик']]);assert.equal(c.state.activeChannelId,null);
});
