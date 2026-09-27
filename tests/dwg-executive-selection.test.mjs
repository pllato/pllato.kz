import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectExecutiveRoots} from '../app/stroy/dwg/executive-selection.mjs';
const record=(type,handle,owner)=>({type,id:'dwg-'+handle,pairs:[[5,handle],[330,owner||'0']]});
const doc={entities:[record('INSERT','AA'),record('ATTRIB','AB','aa'),record('LINE','AC')]};
const shapes=[{id:'dwg-AA',pts:[[0,0],[10,10]]},{id:'dwg-AB',pts:[[12,5]]},{id:'dwg-AC',pts:[[20,0],[30,10]]}];
test('Block and attached attributes produce one root without dropping other entities',()=>{
 assert.deepEqual(selectExecutiveRoots(doc,shapes,[-1,-1,31,11]),['AA','AC']);
});
test('Selecting only a label or cutting through its block does not detach it',()=>{
 assert.deepEqual(selectExecutiveRoots(doc,shapes,[11,4,13,6]),[]);
 assert.deepEqual(selectExecutiveRoots(doc,shapes,[-1,-1,11,11]),[]);
});
test('Generated decorations are not recloned as source objects',()=>{
 assert.deepEqual(selectExecutiveRoots(doc,[...shapes,{id:'executive-title',pts:[[0,0]]}],[-1,-1,31,11]),['AA','AC']);
});
