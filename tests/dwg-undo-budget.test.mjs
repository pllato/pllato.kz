import test from 'node:test';import assert from 'node:assert/strict';
import {boundedUndo} from '../app/stroy/dwg/undo-budget.mjs';
const MiB=1024*1024;
test('large consecutive DWGs retain recent undo within mobile byte budget',()=>{
 const entries=Array.from({length:15},(_,i)=>({file:{size:(40+i)*MiB},i}));
 const kept=boundedUndo(entries);assert.deepEqual(kept.map(e=>e.i),[14]);
 assert.deepEqual(boundedUndo(entries,{bytes:120*MiB}).map(e=>e.i),[13,14]);
});
test('many patches on the same native file do not multiply its memory charge',()=>{
 const file={size:80*MiB};const entries=Array.from({length:20},(_,i)=>({file,i}));
 assert.equal(boundedUndo(entries).length,15);const oversized={size:200*MiB};assert.equal(boundedUndo(entries.map(e=>({...e,file:oversized}))).length,15);assert.equal(boundedUndo(entries,{count:5}).length,5);
});
test('one oversized undo remains available and input history is unchanged',()=>{
 const entries=[{file:{size:5*MiB}},{file:{size:200*MiB}}];const original=[...entries];
 assert.deepEqual(boundedUndo(entries),[entries[1]]);assert.deepEqual(entries,original);
 assert.deepEqual(boundedUndo([]),[]);
});
