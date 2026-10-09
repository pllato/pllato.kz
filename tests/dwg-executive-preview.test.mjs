import test from 'node:test';import assert from 'node:assert/strict';
import {fromRecords,scene,get} from '../app/stroy/dwg/cad.mjs';
import {createExecutiveProject,createExecutive} from '../app/stroy/dwg/executive-project.mjs';
import {deferPlan,previewRecords} from '../app/stroy/dwg/executive-preview.mjs';
import {validateExecutiveProject} from '../app/stroy/dwg/executive-metadata.mjs';
import {captureRecovery,replayRecovery} from '../app/stroy/dwg/recovery.mjs';
const record=(type,id,pairs=[])=>({type,id,pairs});
function fixture(){const d=fromRecords([record('SECTION','section',[[2,'ENTITIES']]),record('LINE','dwg-A',[[5,'A'],[10,0],[20,0],[11,100],[21,0]]),record('LINE','dwg-B',[[5,'B'],[10,0],[20,10],[11,100],[21,10]]),record('ENDSEC','end')]);d.native=true;d.nativeOps=[];return d;}
function project(){const p=createExecutiveProject();createExecutive(p,{id:'one',title:'One',origin:[1000,0],planCentre:[1000,0],metresPerUnit:.001,paperUnit:100});return p;}
test('deferred plan renders exact selected CAD records without cloning source payload',()=>{
 const d=fixture(),p=project(),source=d.entities[0];deferPlan(p,{sheetId:'one',handles:['A'],centre:[0,0],position:[1000,0]});
 const preview=previewRecords(d,p);assert.equal(d.blocks.get(get(preview[0],2)).records[0],source);assert.equal(p.sheets[0].nativeHandles.length,0);
 const shapes=scene({...d,entities:preview}).shapes;assert.equal(shapes.length,1);assert.equal(shapes[0].id,'executive-preview-one');assert.equal(shapes[0].pts[0][0],1000);assert.equal(shapes[0].pts.at(-1)[0],1100);
 assert.equal(source.pairs[1][1],0);assert.equal(scene(d).shapes.length,2);
 assert.equal(previewRecords(d,p).length,1);assert.equal(d.blocks.size,1);
});
test('pending selection survives validation, recovery and rotation without a DWG operation',()=>{
 const d=fixture(),p=project();deferPlan(p,{sheetId:'one',handles:['A'],centre:[0,0],position:[1000,0]});p.sheets[0].angle=Math.PI/2;d.executiveProject=p;
 const validated=validateExecutiveProject(JSON.parse(JSON.stringify(p)));assert.deepEqual(validated.sheets[0].sourcePlan,p.sheets[0].sourcePlan);
 const restored=replayRecovery(fixture(),captureRecovery(d)),preview=previewRecords(restored,restored.executiveProject),shapes=scene({...restored,entities:preview}).shapes;
 assert.ok(Math.abs(shapes[0].pts.at(-1)[0]-1000)<1e-9);assert.ok(Math.abs(shapes[0].pts.at(-1)[1]-100)<1e-9);
 assert.deepEqual(restored.nativeOps,[]);assert.equal(restored.entities.length,2);
});
test('invalid deferred references and missing source records remain explicit failures',()=>{
 const p=project();assert.throws(()=>deferPlan(p,{sheetId:'one',handles:['A','A'],centre:[0,0],position:[1,2]}));
 deferPlan(p,{sheetId:'one',handles:['C'],centre:[0,0],position:[1,2]});assert.throws(()=>previewRecords(fixture(),p),/не найдены/);
 const bad=structuredClone(p);bad.sheets[0].sourcePlan.centre=[NaN,0];assert.throws(()=>validateExecutiveProject(bad));
});
