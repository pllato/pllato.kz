import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drawingPreset,drawingPalette} from '../app/stroy/dwg/drawing-presets.mjs';
import {createExecutiveProject,createExecutive,addRoute,executiveEntities} from '../app/stroy/dwg/executive-project.mjs';
import {validateExecutiveProject} from '../app/stroy/dwg/executive-metadata.mjs';
import {writeAdditions} from '../app/stroy/dwg/authoring.mjs';
import {scene,fromRecords} from '../app/stroy/dwg/cad.mjs';
test('Palette contains actual resolved entity/layer/block colors, with exact RGB and no duplicates',()=>{
 const rec=(type,pairs)=>({type,id:String(Math.random()),pairs});const d=fromRecords([rec('SECTION',[[2,'TABLES']]),rec('LAYER',[[2,'wire'],[62,140]]),rec('ENDSEC',[]),rec('SECTION',[[2,'BLOCKS']]),rec('BLOCK',[[2,'B']]),rec('LINE',[[62,0],[10,0],[20,0],[11,10],[21,10]]),rec('ENDBLK',[]),rec('ENDSEC',[]),rec('SECTION',[[2,'ENTITIES']]),rec('INSERT',[[2,'B'],[62,3]]),rec('LINE',[[8,'wire'],[10,0],[20,0],[11,10],[21,10]]),rec('LINE',[[420,0x123456],[10,0],[20,0],[11,10],[21,10]]),rec('ENDSEC',[])]);
 const palette=drawingPalette(scene(d).shapes);assert.deepEqual(new Set(palette.map(p=>p.value)),new Set(['3','140','#123456']));assert.equal(drawingPalette([{color:5},{color:5},{rgb:'#0000ff'}]).length,1);assert.deepEqual(drawingPalette([]),[]);
});
test('RGB is retained in metadata and generated native additions',()=>{
 const p=createExecutiveProject();createExecutive(p,{id:'s',nativeHandles:['AA'],metresPerUnit:.001});addRoute(p,'s',{id:'r',points:[[0,0],[10,10]],rgb:0x123456});const restored=validateExecutiveProject(p);assert.equal(restored.sheets[0].routes[0].rgb,0x123456);const item=executiveEntities(restored,'s').items.find(i=>i.routeId==='r'),calls=[];writeAdditions({ccall:(name,_r,_t,args)=>{calls.push([name,args]);return name==='pllato_last_handle'?'AB':0;}},[item]);assert.ok(calls.some(([name,args])=>name==='pllato_rgb'&&args[1]===0x123456));
});
test('New cable presets retain physical weight, brand, section and color through metadata',()=>{
 assert.equal(drawingPreset.color,5);const p=createExecutiveProject();createExecutive(p,{id:'s',nativeHandles:['AA'],metresPerUnit:.001});addRoute(p,'s',{id:'r',points:[[0,0],[1000,0]],...drawingPreset,lineweight:50});const restored=validateExecutiveProject(p),r=restored.sheets[0].routes[0];assert.equal(r.lineweight,50);assert.equal(r.brand,drawingPreset.brand);assert.equal(r.section,drawingPreset.section);assert.equal(executiveEntities(restored,'s').items.find(i=>i.routeId==='r').lineweight,50);assert.throws(()=>addRoute(p,'s',{id:'bad',points:[[0,0],[1,0]],lineweight:42}));
});
test('Authoring writes actual DWG lineweight and rejects a native failure',()=>{
 const calls=[],m={ccall:(name,_r,_t,args)=>{calls.push([name,args]);return name==='pllato_last_handle'?'AB':0;}};writeAdditions(m,[{type:'LINE',values:[0,0,1,1],color:5,lineweight:50}]);assert.ok(calls.some(([name,args])=>name==='pllato_lineweight'&&args[0]==='AB'&&args[1]===50));assert.throws(()=>writeAdditions({ccall:name=>name==='pllato_last_handle'?'AB':name==='pllato_lineweight'?1:0},[{type:'LINE',values:[0,0,1,1],lineweight:50}]));
});
