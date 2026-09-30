import test from 'node:test';import assert from 'node:assert/strict';
import {paintShapes,paintShapeSteps,previewTransform} from '../app/stroy/dwg/renderer.mjs';
const options={view:{x:0,y:100,s:1},width:100,height:100,hidden:new Set(),selected:null,colors:['#000','#111','#222']};
test('preview maps cached pixels to the exact current world transform',()=>{
 const a={x:30,y:90,s:2},b={x:10,y:50,s:5},p={x:12,y:7},t=previewTransform(b,a);
 assert.equal((p.x*a.s+a.x)*t.scale+t.x,p.x*b.s+b.x);assert.equal((a.y-p.y*a.s)*t.scale+t.y,b.y-p.y*b.s);
});
const shape=(id,color=1)=>({id,layer:'0',color,pts:[[0,0],[10,10]],bounds:[0,0,10,10],text:null,fill:false});
test('cooperative painting preserves every drawing call across yields',()=>{
 const shapes=Array.from({length:3000},(_,i)=>({...shape(i,i%7?1:2),fill:i%37===0})),a=context(),b=context();
 paintShapes(a,shapes,options);const steps=paintShapeSteps(b,shapes,options,0);let yields=0;while(!steps.next().done)yields++;
 assert.ok(yields>10);assert.deepEqual(b.log,a.log);
});
function context(){const log=[];return new Proxy({log},{get:(o,k)=>k in o?o[k]:(...a)=>log.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});}
test('same-color lines share strokes without dropping vertices',()=>{
 const c=context();paintShapes(c,Array.from({length:1000},(_,i)=>shape(i)),options);assert.equal(c.log.filter(x=>x[0]==='stroke').length,1);assert.equal(c.log.filter(x=>x[0]==='moveTo').length,1000);assert.equal(c.log.filter(x=>x[0]==='lineTo').length,1000);assert.deepEqual(c.log.find(x=>x[0]==='lineTo'),['lineTo',10,90]);
});
test('color changes, fills and text preserve painter order',()=>{
 const c=context(),t={...shape(3),text:'Тест',height:5,angle:0};paintShapes(c,[shape(1),shape(2,2),t,{...shape(4),fill:true},shape(5)],options);
 assert.deepEqual(c.log.filter(x=>['stroke','fillText','fill'].includes(x[0])).map(x=>x[0]),['stroke','stroke','fillText','fill','stroke','stroke']);
});
test('hidden and off-screen geometry is culled; subpixel text not drawn',()=>{
 const c=context();paintShapes(c,[{...shape(1),layer:'hidden'},{...shape(2),bounds:[1000,1000,1010,1010]},{...shape(3),text:'tiny',height:1}],{...options,hidden:new Set(['hidden'])});assert.equal(c.log.length,0);
});
test('Selecting an internal line does not highlight the whole executive',()=>{
 const c=context(),colors=[];c.stroke=()=>colors.push(c.strokeStyle);
 paintShapes(c,[{...shape('sheet'),entityKey:'one'},{...shape('sheet'),entityKey:'two'}],{...options,selected:'one'});
 assert.deepEqual(colors,['#c26b00','#111']);
});
test('Cable chain highlights every selected key but no neighbouring object',()=>{
 const c=context(),colors=[];c.stroke=()=>colors.push(c.strokeStyle);
 paintShapes(c,['a','b','c'].map(entityKey=>({...shape('sheet'),entityKey})),{...options,selected:new Set(['a','b'])});
 assert.deepEqual(colors,['#c26b00','#111']);
});
