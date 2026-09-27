import test from 'node:test';import assert from 'node:assert/strict';
import {additions,writeAdditions} from '../app/stroy/dwg/authoring.mjs';
import {demo,addEntity,cloneDoc,move} from '../app/stroy/dwg/cad.mjs';
test('new geometry follows edits/undo and excludes original entities',()=>{
 const doc=demo();const r=addEntity(doc,'LINE',[[10,1],[20,2],[11,3],[21,4]]);const undo=cloneDoc(doc);move(r,10,20);
 assert.deepEqual(additions(doc),[{type:'LINE',values:[11,22,13,24]}]);assert.deepEqual(additions(undo)[0].values,[1,2,3,4]);
 doc.entities=doc.entities.filter(e=>e.id!==r.id);assert.deepEqual(additions(doc),[]);
});
test('writer rejects unsupported/invalid additions instead of dropping them',()=>{
 const m={ccall:()=>0};assert.throws(()=>writeAdditions(m,[{type:'HATCH'}]));assert.throws(()=>writeAdditions(m,[{type:'LINE',values:[1,2,NaN,4]}]));assert.throws(()=>writeAdditions(m,[{type:'TEXT',text:'x',values:[0,0,-1,0]}]));
});
