import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeDocument} from '../app/stroy/dwg/native-adapter.mjs';
import {cloneDoc,get,num,move,scene} from '../app/stroy/dwg/cad.mjs';
const database=entities=>({header:{ACADVER:'AC1032',INSUNITS:4},tables:{LAYER:{entries:[]},BLOCK_RECORD:{entries:[]}},entities});
test('native LWPOLYLINE flags map closure and omitted extrusion correctly',()=>{
 const doc=nativeDocument(database([{type:'LWPOLYLINE',handle:'F',flag:512,extrusionDirection:{x:0,y:0,z:0},vertices:[{x:0,y:0},{x:1,y:0},{x:1,y:1}]}]));
 assert.equal(num(doc.entities[0],70),1);const view=scene(doc);assert.equal(view.shapes.length,1);assert.deepEqual(view.shapes[0].pts.at(-1),[0,0]);assert.deepEqual(view.unsupported,[]);
});
test('native view preserves handles and coordinates; does not import paper space',()=>{
 const db=database([{type:'LINE',handle:'AB',startPoint:{x:1,y:2,z:0},endPoint:{x:3,y:4,z:0}},{type:'LINE',handle:'CD',isInPaperSpace:true}]);
 const doc=nativeDocument(db);assert.equal(doc.entities.length,1);assert.equal(get(doc.entities[0],5),'AB');assert.equal(num(doc.entities[0],10),1);
});
test('native undo snapshots retain independent operation log',()=>{
 const doc=nativeDocument(database([]));doc.native=true;doc.nativeUnknown=3;doc.nativeOps=[{handle:'A',dx:2,dy:3,text:'Тест'}];
 const copy=cloneDoc(doc);copy.nativeOps[0].dx=99;assert.equal(doc.nativeOps[0].dx,2);assert.equal(copy.nativeUnknown,3);assert.equal(copy.native,true);
});
test('attribute geometry uses nested text and is not duplicated',()=>{
 const attr={type:'ATTRIB',handle:'2',text:{text:'Номер',startPoint:{x:10,y:20},textHeight:3}};
 const doc=nativeDocument(database([{type:'INSERT',handle:'1',name:'B',insertionPoint:{x:0,y:0},attribs:[attr]},attr]));
 assert.equal(doc.entities.filter(e=>e.type==='ATTRIB').length,1);const r=doc.entities.find(e=>e.type==='ATTRIB');assert.equal(get(r,1),'Номер');assert.equal(num(r,10),10);assert.equal(get(doc.entities[0],66),'1');
});
test('overflowing movement is rejected before any coordinate changes',()=>{
 const r={type:'LINE',pairs:[[10,'1'],[20,'2'],[11,'1e308'],[21,'4']]};assert.throws(()=>move(r,1e308,0));assert.equal(num(r,10),1);
});
