import test from 'node:test';import assert from 'node:assert/strict';
import {demo,parseDxf,serialize,scene,get} from '../app/stroy/dwg/cad.mjs';
import {createOffsetDimension,offsetGeometry,dimensionAddition} from '../app/stroy/dwg/dimension-create.mjs';
import {dimensionDefinition,planDimensionEdit,planDimensionMove,applyDimensionPlan} from '../app/stroy/dwg/dimension-edit.mjs';
import {captureRecovery,replayRecovery} from '../app/stroy/dwg/recovery.mjs';
import {captureView,restoreView} from '../app/stroy/dwg/view-history.mjs';
const fixture=()=>demo();
for(const axis of ['horizontal','vertical'])test('new '+axis+' dimension supports edit, move, history, recovery and DXF',()=>{
 const doc=fixture();doc.native=true;doc.nativeOps=[];const old=captureView(doc,scene(doc));
 const r=createOffsetDimension(doc,[10,20],[860,970],[1000,1100],axis,25),f=dimensionDefinition(r);assert.equal(f.length,axis==='horizontal'?850:950);
 assert.equal(scene({...doc,entities:[r]}).shapes.length,6);
 applyDimensionPlan(planDimensionEdit(doc,r,{length:1200,offset:f.offset}));applyDimensionPlan(planDimensionMove(doc,r,[100,-50]));
 const item=dimensionAddition(doc,r);assert.equal(item.values.length,33);assert.equal(item.text,'1200');
 const state=captureRecovery(doc),restored=fixture();restored.native=true;restored.nativeOps=[];replayRecovery(restored,state);assert.deepEqual(dimensionAddition(restored,restored.entities.find(e=>e.type==='DIMENSION')),item);
 const parsed=parseDxf(serialize(doc));assert.equal(dimensionDefinition(parsed.entities.find(e=>e.type==='DIMENSION')).length,1200);assert.equal(scene({...parsed,entities:parsed.entities.filter(e=>e.type==='DIMENSION')}).shapes.length,6);
 const after=captureView(doc,scene(doc));restoreView(old);assert.ok(!doc.entities.includes(r));restoreView(after);assert.ok(doc.entities.includes(r));assert.equal(dimensionDefinition(r).length,1200);
});
test('offset refuses zero projected distance and invalid axis before creation',()=>{assert.throws(()=>offsetGeometry([0,0],[0,10],[20,20],'horizontal',10));assert.throws(()=>offsetGeometry([0,0],[10,10],[20,20],'diagonal',10));});
