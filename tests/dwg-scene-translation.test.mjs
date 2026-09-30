import test from 'node:test';import assert from 'node:assert/strict';
import {fromRecords,scene,move} from '../app/stroy/dwg/cad.mjs';
import {translatedScene,translatedDeviceScene} from '../app/stroy/dwg/scene-translation.mjs';
import {editObjects} from '../app/stroy/dwg/object-edit.mjs';
const record=(id,type,pairs)=>({id,type,pairs:[[0,type],...pairs].map(([c,v])=>[c,String(v)])});
test('empty device attributes do not force full scene reconstruction',()=>{
 const doc=fromRecords([record('s','SECTION',[[2,'BLOCKS']]),record('block','BLOCK',[[2,'B']]),record('line','LINE',[[10,0],[20,0],[11,10],[21,20]]),record('eb','ENDBLK',[]),record('end','ENDSEC',[]),record('entities','SECTION',[[2,'ENTITIES']]),record('insert','INSERT',[[5,'A'],[2,'B'],[10,100],[20,200]]),record('attr','ATTRIB',[[330,'A'],[10,-50000],[20,-50000],[40,8000],[1,'']]),record('e','ENDSEC',[])]);
 const before=scene(doc),target={id:'insert',matrix:before.shapes[0].deviceMatrix},delta=[12,-8];
 const fast=translatedDeviceScene(doc,before,[target],delta);assert.ok(fast);editObjects(doc,[target],{delta});assert.deepEqual(fast,scene(doc));
 doc.records.find(r=>r.id==='attr').pairs.find(p=>p[0]===1)[1]='visible';
 assert.equal(translatedDeviceScene(doc,scene(doc),[target],delta),null);
});
test('device translation reuses the drawing and matches full block expansion',()=>{
 const doc=fromRecords([record('s','SECTION',[[2,'BLOCKS']]),record('block','BLOCK',[[2,'B']]),record('line','LINE',[[10,0],[20,0],[11,10],[21,20]]),record('text','TEXT',[[10,1],[20,2],[40,2],[1,'ABC']]),record('eb','ENDBLK',[]),record('end','ENDSEC',[]),record('entities','SECTION',[[2,'ENTITIES']]),record('insert','INSERT',[[2,'B'],[10,100],[20,200],[41,2],[42,3],[50,90]]),record('e','ENDSEC',[])]);
 const before=scene(doc),target={id:'insert',matrix:before.shapes[0].deviceMatrix},delta=[12,-8];
 const fast=translatedDeviceScene(doc,before,[target],delta);assert.ok(fast);editObjects(doc,[target],{delta});const full=scene(doc);
 assert.deepEqual(fast,full);
});
test('incremental translation matches complete scene and preserves unaffected shapes',()=>{
 const doc=fromRecords([record('s','SECTION',[[2,'ENTITIES']]),record('a','LINE',[[10,0],[20,0],[11,10],[21,20]]),record('b','CIRCLE',[[10,50],[20,60],[40,4]]),record('e','ENDSEC',[])]);
 const before=scene(doc),r=doc.entities[0],fast=translatedScene(before,[{id:r.id}],[12,-8]);move(r,12,-8);
 assert.deepEqual(fast,scene(doc));assert.equal(fast.shapes[1],before.shapes[1]);assert.notEqual(fast.shapes[0],before.shapes[0]);assert.deepEqual(before.shapes[0].pts,[[0,0],[10,20]]);
});
test('limited scenes, unsupported objects and different instances use full rebuild',()=>{
 const shape={id:'r',entityId:'a',entityType:'LINE',entityMatrix:[1,0,0,1,0,0],pts:[[0,0],[1,1]],bounds:[0,0,1,1],text:null};
 assert.equal(translatedScene({shapes:[shape],limited:true},[{id:'a'}],[1,1]),null);
 assert.equal(translatedScene({shapes:[{...shape,entityType:'INSERT'}]},[{id:'a'}],[1,1]),null);
 assert.equal(translatedScene({shapes:[shape]},[{id:'a',matrix:[2,0,0,2,0,0]}],[1,1]),null);
 assert.equal(translatedScene({shapes:[shape]},[{id:'missing'}],[1,1]),null);
 assert.equal(translatedScene({shapes:[shape]},[{id:'a'}],[1]),null);
 assert.equal(translatedScene({shapes:[shape]},[],[1,1]),null);
});
test('nested rotated and scaled block translation matches native record edit',()=>{
 const doc=fromRecords([record('s','SECTION',[[2,'BLOCKS']]),record('block','BLOCK',[[2,'B']]),record('line','LINE',[[10,0],[20,0],[11,10],[21,20]]),record('eb','ENDBLK',[]),record('end','ENDSEC',[]),record('entities','SECTION',[[2,'ENTITIES']]),record('insert','INSERT',[[2,'B'],[10,100],[20,200],[41,2],[42,3],[50,90]]),record('e','ENDSEC',[])]);
 const before=scene(doc),target={id:'line',matrix:before.shapes[0].entityMatrix},delta=[12,-8];
 const fast=translatedScene(before,[target],delta);editObjects(doc,[target],{delta});
 const full=scene(doc);
 assert.equal(fast.shapes.length,full.shapes.length);
 fast.shapes.forEach((s,i)=>s.pts.forEach((p,j)=>p.forEach((v,k)=>assert.ok(Math.abs(v-full.shapes[i].pts[j][k])<1e-9))));
});
