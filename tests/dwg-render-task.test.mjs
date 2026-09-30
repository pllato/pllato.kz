import test from 'node:test';import assert from 'node:assert/strict';
import {renderTask} from '../app/stroy/dwg/render-task.mjs';
import {releaseObsoleteViews} from '../app/stroy/dwg/view-history.mjs';
test('superseded raster jobs are closed and cannot publish stale images',()=>{
 const queue=[],published=[];let closed=false;
 const task=renderTask({schedule:fn=>(queue.push(fn),fn),cancel:()=>{}});
 function* old(){try{yield;}finally{closed=true;}}
 task.start('old',old(),()=>published.push('old'));queue.shift()();
 task.start('new',(function*(){yield;})(),()=>published.push('new'));
 while(queue.length)queue.shift()();
 assert.equal(closed,true);assert.deepEqual(published,['new']);assert.equal(task.key,undefined);
});
test('stopping releases iterator and errors clear active job',()=>{
 const queue=[];let error;const task=renderTask({schedule:fn=>queue.push(fn),cancel:()=>{}});
 task.start(1,(function*(){throw Error('paint');})(),()=>assert.fail(),e=>error=e);
 queue.shift()();assert.equal(error.message,'paint');assert.equal(task.key,undefined);
 task.start(2,(function*(){yield;})(),()=>assert.fail());task.stop();queue.shift()();assert.equal(task.key,undefined);
});
test('native transaction releases obsolete scenes without losing recovery or active undo',()=>{
 const doc={},file={},recovery={ops:[{handle:'1',dx:2}]};
 const old={viewState:{doc:{},drawing:{shapes:[]}},file,recovery,name:'drawing'},current={viewState:{doc},file,recovery};
 const entries=releaseObsoleteViews([old,current],doc);
 assert.deepEqual(entries[0],{file,recovery,name:'drawing'});assert.equal(entries[0].recovery,recovery);assert.equal(entries[1],current);
 assert.ok(old.viewState,'does not mutate an in-flight transaction');
});
