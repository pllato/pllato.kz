import test from 'node:test';
import assert from 'node:assert/strict';
import {fromRecords,get,addEntity} from '../app/stroy/dwg/cad.mjs';
import {captureRecovery,replayRecovery} from '../app/stroy/dwg/recovery.mjs';
function source(){const doc=fromRecords([{id:'section',type:'SECTION',pairs:[[2,'ENTITIES']]},{id:'dwg-A',type:'LINE',pairs:[[5,'A'],[10,1],[20,2],[11,3],[21,4]]},{id:'dwg-B',type:'TEXT',pairs:[[5,'B'],[10,0],[20,0],[40,1],[1,'old']]},{id:'end',type:'ENDSEC',pairs:[]}]);doc.native=true;doc.nativeOps=[];return doc;}
test('Compact recovery replays edits, deletions, additions and executive metadata',()=>{
 const doc=source();doc.nativeOps=[{handle:'A',dx:3,dy:4},{handle:'B',remove:true}];doc.executiveProject={sheets:[{angle:Math.PI/2}]};addEntity(doc,'LINE',[[10,10],[20,20],[11,30],[21,40]]);
 const state=captureRecovery(doc);doc.nativeOps[0].dx=99;
 const restored=replayRecovery(source(),state);assert.equal(Number(get(restored.records.find(r=>get(r,5)==='A'),10)),4);assert.ok(!restored.records.some(r=>r.id==='dwg-B'));assert.equal(restored.entities.filter(r=>r.id.startsWith('new-')).length,1);assert.equal(restored.executiveProject.sheets[0].angle,Math.PI/2);assert.equal(restored.nativeOps[0].dx,3);
});
test('Recovery refuses a mismatched source rather than losing an edit',()=>{assert.throws(()=>replayRecovery(source(),{ops:[{handle:'MISSING',dx:1,dy:0}],added:[],project:null}),/не найден/);});
