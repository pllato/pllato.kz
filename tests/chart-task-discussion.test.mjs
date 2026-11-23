import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleTaskDiscussion,sharedTaskEditable} from '../crm/worker/chart-task-discussion.js';
class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
function setup(allowed=true){const writes=[],reads=[];return {writes,reads,deps:{HttpError,teamId:'pllato',getTask:async()=>({id:'t',managerEmail:'other@test.kz'}),canAccess:async()=>allowed,db:{prepare(sql){return {bind(...args){return {async all(){reads.push({sql,args});return {results:[{id:'t:2',data:JSON.stringify({text:'new'})},{id:'t:1',data:JSON.stringify({text:'old'})}]}},async run(){writes.push({sql,args})}}}}}}}};}
const actor={email:'staff@test.kz',user:{name:'Employee'}};
test('visible task can be edited by a different employee',()=>{assert.equal(sharedTaskEditable({managerEmail:'other'},true),true);assert.equal(sharedTaskEditable({deleted:true},true),false);assert.equal(sharedTaskEditable({},false),false);});
test('comments are independent inserts with trusted author and server time',async()=>{const x=setup();const r=await handleTaskDiscussion(new Request('https://test',{method:'POST',body:JSON.stringify({text:'Update',author:'forged',createdAt:1})}),{},actor,'t',x.deps);assert.equal(r.item.author,actor.email);assert.equal(r.item.authorName,'Employee');assert.ok(r.item.createdAt>1);assert.equal(x.writes.length,1);assert.match(x.writes[0].sql,/^INSERT/);});
test('thread loads oldest first using bounded task-key query',async()=>{const x=setup();const r=await handleTaskDiscussion(new Request('https://test'),{},actor,'t',x.deps);assert.deepEqual(r.items.map(x=>x.text),['old','new']);assert.match(x.reads[0].sql,/LIMIT 51/);assert.equal(x.reads[0].args[2],'t:');});
test('inaccessible tasks reject reads and writes',async()=>{for(const method of ['GET','POST']){const x=setup(false);await assert.rejects(handleTaskDiscussion(new Request('https://test',{method}),{},actor,'t',x.deps),e=>e.status===403);assert.equal(x.reads.length+x.writes.length,0);}});
test('blank comments and another task cursor are rejected',async()=>{const x=setup();await assert.rejects(handleTaskDiscussion(new Request('https://test',{method:'POST',body:'{"text":"  "}'}),{},actor,'t',x.deps),e=>e.status===400);await assert.rejects(handleTaskDiscussion(new Request('https://test?before=another:123'),{},actor,'t',x.deps),e=>e.status===400);});

test('moved task keeps the original discussion key',async()=>{const x=setup();x.deps.getTask=async()=>({id:'new',discussionId:'original'});await handleTaskDiscussion(new Request('https://test'),{},actor,'new',x.deps);assert.equal(x.reads[0].args[2],'original:');});

import {handleTaskDiscussionSummaries} from '../crm/worker/chart-task-discussion.js';
test('summary checks task visibility before querying bounded thread ranges',async()=>{
 const x=setup();x.deps.getTasks=async()=>[{id:'hidden'},{id:'deleted',deleted:true},{id:'moved',discussionId:'original'},{id:'unrequested'}];x.deps.canAccess=async task=>task.id!=='hidden';
 x.deps.db={prepare(sql){return {bind(...args){x.reads.push({sql,args});return {all:async()=>({results:[{task_id:'moved',data:JSON.stringify({id:'original:1',text:'x'.repeat(4000),author:'other'})}]})};}}}};
 const r=await handleTaskDiscussionSummaries(new Request('https://test',{method:'POST',body:JSON.stringify({ids:['hidden','deleted','moved']})}),actor,x.deps);
 assert.deepEqual(r.items.map(x=>x.taskId),['moved']);assert.equal(r.items[0].latest.text.length,240);assert.equal(x.reads.length,1);assert.deepEqual(x.reads[0].args.slice(0,2),['moved','original:']);assert.match(x.reads[0].sql,/ORDER BY id DESC LIMIT 1/);
});
test('summary rejects oversized and malformed batches without DB reads',async()=>{
 for(const ids of [Array(41).fill('t'),[''],[42],null]){const x=setup();x.deps.getTasks=async()=>{throw Error('must not load');};await assert.rejects(handleTaskDiscussionSummaries(new Request('https://test',{method:'POST',body:JSON.stringify({ids})}),actor,x.deps),e=>e.status===400);assert.equal(x.reads.length,0);}
});
test('summary returns no private data when every task is inaccessible',async()=>{
 const x=setup(false);x.deps.getTasks=async()=>[{id:'t'}];const r=await handleTaskDiscussionSummaries(new Request('https://test',{method:'POST',body:'{"ids":["t"]}'}),actor,x.deps);assert.deepEqual(r.items,[]);assert.equal(x.reads.length,0);
});
