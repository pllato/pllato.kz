import test from 'node:test';
import assert from 'node:assert/strict';
import {demo,scene,cloneDoc,addEntity,set} from '../app/stroy/dwg/cad.mjs';
import {reusableScene,mergeReusedScene} from '../app/stroy/dwg/scene-reuse.mjs';
function fixture(){const doc=demo();doc.native=true;doc.nativeOps=[];doc.layers.set('PLAN',{color:7});return doc;}
function copy(doc){return {...cloneDoc(doc),layers:structuredClone(doc.layers),textStyles:structuredClone(doc.textStyles)};}
test('unchanged native base is reused without dropping geometry',()=>{
 const old=fixture(),before=scene(old),next=copy(old);
 addEntity(next,'LINE',[[8,'0'],[10,'1'],[20,'2'],[11,'3'],[21,'4']]);
 const reuse=reusableScene(old,next,before);assert.ok(reuse);
 const actual=mergeReusedScene(reuse,scene(reuse.doc));
 assert.deepEqual(actual,scene(next));assert.equal(actual.shapes[0],before.shapes[0]);
});
test('changed or removed sources and display tables force full build',()=>{
 const old=fixture(),before=scene(old);
 for(const change of [d=>set(d.entities[0],10,999),d=>d.entities.shift(),d=>d.layers.set([...d.layers.keys()][0],{color:1}),d=>{set(d.entities[0],7,'new');d.textStyles.set('new',{font:'other'});}]){
  const next=copy(old);change(next);assert.equal(reusableScene(old,next,before),null);
 }
 assert.equal(reusableScene(old,cloneDoc(old),{...before,limited:true}),null);
});
test('new unused decoration tables do not invalidate the base',()=>{
 const old=fixture(),next=copy(old);next.layers.set('decoration',{color:7});next.textStyles.set('title',{font:'times.ttf'});
 assert.ok(reusableScene(old,next,scene(old)));
});
test('adapter-local polyline vertex IDs may change, coordinates may not',()=>{
 const old=fixture(),poly={type:'POLYLINE',id:'dwg-a',pairs:[[70,'0']]},vertices=[{type:'VERTEX',id:'native-1',pairs:[[10,'0'],[20,'0']]},{type:'VERTEX',id:'native-2',pairs:[[10,'5'],[20,'6']]},{type:'SEQEND',id:'native-3',pairs:[]}];
 old.entities=[poly,...vertices];const next={...old,entities:structuredClone(old.entities)};next.entities.slice(1).forEach((r,i)=>r.id='native-'+(100+i));
 const before=scene(old),reuse=reusableScene(old,next,before);assert.ok(reuse);assert.equal(reuse.doc.entities.length,0);assert.deepEqual(mergeReusedScene(reuse,scene(reuse.doc)),scene(next));
 next.entities[1].pairs[0][1]='9';assert.equal(reusableScene(old,next,before),null);
});
test('a changed nested block invalidates reuse',()=>{
 const old=fixture();old.blocks.set('device',{base:[0,0],flags:0,records:[{id:'dwg-b',type:'LINE',pairs:[[10,'0'],[11,'1']]}]});
 const next={...old,blocks:structuredClone(old.blocks)};next.blocks.get('device').records[0].pairs[1][1]='5';assert.equal(reusableScene(old,next,scene(old)),null);
});
test('reordered sources are rejected; new interleaved roots retain native painter order',()=>{
 const old=fixture(),before=scene(old),next=copy(old);next.entities.reverse();assert.equal(reusableScene(old,next,before),null);
 const interleaved=copy(old);interleaved.entities.splice(1,0,{id:'dwg-new',type:'LINE',pairs:[[10,'0'],[11,'9']]});const reuse=reusableScene(old,interleaved,before);assert.ok(reuse);const actual=mergeReusedScene(reuse,scene(reuse.doc));assert.deepEqual(actual,scene(interleaved));assert.equal(actual.shapes[0],before.shapes[0]);assert.equal(actual.shapes[2],before.shapes[1]);
});
