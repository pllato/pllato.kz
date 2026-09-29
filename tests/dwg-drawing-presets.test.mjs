import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drawingPreset} from '../app/stroy/dwg/drawing-presets.mjs';
import {createExecutiveProject,createExecutive,addRoute,executiveEntities} from '../app/stroy/dwg/executive-project.mjs';
import {validateExecutiveProject} from '../app/stroy/dwg/executive-metadata.mjs';
import {writeAdditions} from '../app/stroy/dwg/authoring.mjs';
test('New cable presets retain physical weight, brand, section and color through metadata',()=>{
 assert.equal(drawingPreset.color,5);const p=createExecutiveProject();createExecutive(p,{id:'s',nativeHandles:['AA'],metresPerUnit:.001});addRoute(p,'s',{id:'r',points:[[0,0],[1000,0]],...drawingPreset,lineweight:50});const restored=validateExecutiveProject(p),r=restored.sheets[0].routes[0];assert.equal(r.lineweight,50);assert.equal(r.brand,drawingPreset.brand);assert.equal(r.section,drawingPreset.section);assert.equal(executiveEntities(restored,'s').items.find(i=>i.routeId==='r').lineweight,50);assert.throws(()=>addRoute(p,'s',{id:'bad',points:[[0,0],[1,0]],lineweight:42}));
});
test('Authoring writes actual DWG lineweight and rejects a native failure',()=>{
 const calls=[],m={ccall:(name,_r,_t,args)=>{calls.push([name,args]);return name==='pllato_last_handle'?'AB':0;}};writeAdditions(m,[{type:'LINE',values:[0,0,1,1],color:5,lineweight:50}]);assert.ok(calls.some(([name,args])=>name==='pllato_lineweight'&&args[0]==='AB'&&args[1]===50));assert.throws(()=>writeAdditions({ccall:name=>name==='pllato_last_handle'?'AB':name==='pllato_lineweight'?1:0},[{type:'LINE',values:[0,0,1,1],lineweight:50}]));
});
