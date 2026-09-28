import test from 'node:test';import assert from 'node:assert/strict';
import {shapePaths,pathLength,syncLinkedRoutes} from '../app/stroy/dwg/selection-metrics.mjs';
import {createExecutiveProject,createExecutive,addRoute,executiveLedger,executiveEntities,rotateExecutive} from '../app/stroy/dwg/executive-project.mjs';
import {validateExecutiveProject} from '../app/stroy/dwg/executive-metadata.mjs';
test('Linked cable sums separate segments without counting gaps or redrawing source',()=>{
 const p=createExecutiveProject();createExecutive(p,{id:'s',metresPerUnit:1,nativeHandles:['A']});
 addRoute(p,'s',{id:'r',points:[[0,0],[3,4]],paths:[[[0,0],[3,4]],[[20,0],[23,4]]],sourceIds:['dwg-B','dwg-C'],brand:'Кабель',section:'3×2,5'});
 assert.equal(executiveLedger(p).rows[0].length,10);assert.ok(!executiveEntities(p,'s').items.some(i=>i.routeId==='r'));
 rotateExecutive(p,'s',Math.PI/2);assert.equal(executiveLedger(validateExecutiveProject(p)).rows[0].length,10);
 const shapes=[{entityId:'dwg-B',text:null,pts:[[0,0],[6,8]]},{entityId:'dwg-C',text:null,pts:[[20,0],[23,4]]}];syncLinkedRoutes(p,shapes);assert.equal(executiveLedger(p).rows[0].length,15);assert.equal(pathLength(shapePaths(shapes)),15);
});
