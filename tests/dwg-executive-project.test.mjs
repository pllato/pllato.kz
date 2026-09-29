import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../app/stroy/dwg/executive-project.mjs';
const fixture=()=>{const p=e.createExecutiveProject();e.createExecutive(p,{id:'a',metresPerUnit:.001,nativeHandles:['AB']});e.addRoute(p,'a',{id:'r',points:[[0,0],[3000,0],[3000,4000]],brand:'ВВГнг',section:'3×2,5'});return p;};
test('Moving a single leader keeps anchor, other leaders and cable quantities',()=>{
 const p=fixture();for(const id of ['l','other'])e.addLeader(p,'a','r',{id,anchor:[1,2],elbow:[3,4],label:[5,6]});const before=e.executiveLedger(p);
 e.moveLeader(p,'a','l',[10,20]);const [l,other]=p.sheets[0].routes[0].leaders;
 assert.deepEqual(l,{id:'l',anchor:[1,2],elbow:[13,24],label:[15,26],textHeight:1.4});assert.deepEqual(other.label,[5,6]);assert.deepEqual(e.executiveLedger(p),before);
});
test('Calibration changes all route quantities, not geometry or extra metres',()=>{
 const p=fixture(),points=structuredClone(p.sheets[0].routes[0].points);p.sheets[0].routes[0].extraMetres=2;
 e.calibrateExecutive(p,'a',[0,0],[1000,0],2);assert.equal(e.executiveLedger(p).rows[0].length,16);assert.deepEqual(p.sheets[0].routes[0].points,points);
 const before=structuredClone(p);assert.throws(()=>e.calibrateExecutive(p,'a',[0,0],[0,0],2));assert.deepEqual(p,before);
});
test('Executive retains native ownership and produces editable decoration/routes',()=>{
 const p=fixture(),result=e.executiveEntities(p,'a');assert.deepEqual(p.sheets[0].nativeHandles,['AB']);assert.equal(result.ledger.rows[0].length,7);assert.ok(result.items.some(i=>i.type==='LWPOLYLINE'));
});
test('Leaders track assigned cable; deleting leaders never loses quantities',()=>{
 const p=fixture();e.addLeader(p,'a','r',{id:'l',anchor:[1,2],elbow:[3,4],label:[5,6]});
 e.setCable(p,'a','r',{brand:'КВВГ',section:'4×1,5',extraMetres:2});
 assert.ok(e.executiveEntities(p,'a').items.some(i=>i.text==='КВВГ 4×1,5'));
 e.removeLeader(p,'a','l');assert.equal(e.executiveLedger(p).rows[0].length,9);assert.deepEqual(e.executiveLedger(p).withoutLeaders,['r']);
 e.removeRoute(p,'a','r');assert.equal(e.executiveLedger(p).rows.length,0);
});
test('Rotation affects plan routes/compass but not sheet origin or quantities',()=>{
 const p=fixture(),before=e.executiveLedger(p);const command=e.rotateExecutive(p,'a',Math.PI/2);
 assert.deepEqual(command.handles,['AB']);assert.deepEqual(p.sheets[0].origin,[0,0]);assert.deepEqual(e.executiveLedger(p),before);
 assert.ok(Math.abs(p.sheets[0].routes[0].points[1][1]-3000)<1e-9);
});
test('Failed transaction does not partially edit source; history snapshots independent',()=>{
 const p=fixture(),before=structuredClone(p);
 assert.throws(()=>e.executiveTransaction(p,q=>{e.moveRoute(q,'a','r',[5,5]);e.setCable(q,'a','r',{brand:'',section:'',extraMetres:-1});}));
 assert.deepEqual(p,before);const next=e.executiveTransaction(p,q=>e.moveRoute(q,'a','r',[5,5]));assert.deepEqual(p,before);assert.deepEqual(next.sheets[0].routes[0].points[0],[5,5]);
});
test('Invalid references/units and duplicate IDs rejected',()=>{
 const p=fixture();assert.throws(()=>e.createExecutive(p,{id:'a',metresPerUnit:1}));assert.throws(()=>e.createExecutive(p,{id:'b',metresPerUnit:0}));assert.throws(()=>e.createExecutive(p,{id:'b',metresPerUnit:1,nativeHandles:['AB','ab']}));assert.throws(()=>e.addRoute(p,'a',{id:'r',points:[[0,0],[1,1]]}));
});
