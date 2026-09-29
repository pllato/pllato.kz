import test from 'node:test';import assert from 'node:assert/strict';
import {captureView,restoreView} from '../app/stroy/dwg/view-history.mjs';
test('in-memory undo and redo restore changed records, deleted records and project',()=>{
 const a={id:'a',pairs:[[10,1]]},b={id:'b',pairs:[[10,2]]},block={records:[a,b]},doc={records:[a,b],entities:[a,b],blocks:new Map([['b',block]]),nativeOps:[],executiveProject:{sheets:[]}},drawing={shapes:[]};
 const before=captureView(doc,drawing,[a]);a.pairs[0][1]=8;doc.records=[a];doc.entities=[a];block.records=[a];doc.nativeOps.push({handle:'a',dx:7,dy:0});doc.executiveProject.sheets.push({id:'s'});
 const after=captureView(doc,{},[a]);assert.equal(restoreView(before),drawing);assert.equal(a.pairs[0][1],1);assert.equal(doc.records[1],b);assert.equal(block.records[1],b);assert.equal(doc.nativeOps.length,0);assert.equal(doc.executiveProject.sheets.length,0);
 restoreView(after);assert.equal(a.pairs[0][1],8);assert.equal(doc.records.length,1);assert.equal(doc.nativeOps.length,1);assert.equal(doc.executiveProject.sheets.length,1);
});
