import test from 'node:test';
import assert from 'node:assert/strict';
import {cableChain} from '../app/stroy/dwg/cable-chain.mjs';
import {pathLength,syncLinkedRoutes} from '../app/stroy/dwg/selection-metrics.mjs';
const shape=(key,pts,extra={})=>({entityKey:key,entityType:'LINE',text:null,pts,bounds:[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))],layer:'cable',color:5,...extra});
test('selects line and arc by endpoints, ignores crossing tick marks',()=>{
 const a=shape('a',[[0,0],[1,0]]),b=shape('b',[[1,0],[1.5,.2],[2,1]],{entityType:'ARC'}),c=shape('c',[[2,1],[2,3]]),tick=shape('tick',[[.5,-1],[1.5,1]]);
 assert.deepEqual(cableChain([a,b,c,tick],b),[b,a,c]);
});
test('does not cross gaps, branches, layers, colors or block instances',()=>{
 const a=shape('a',[[0,0],[1,0]]),b=shape('b',[[1,0],[2,0]]),c=shape('c',[[1,0],[1,1]]);
 assert.deepEqual(cableChain([a,b,c],a),[a]);
 for(const extra of [{layer:'dimension'},{color:3},{deviceId:'other'}])assert.deepEqual(cableChain([a,{...b,...extra}],a),[a]);
 assert.deepEqual(cableChain([a,shape('gap',[[1.001,0],[2,0]])],a),[a]);
 assert.deepEqual(cableChain([a,b],a,new Set(['cable'])),[a]);
});
test('closed symbols and composite leader geometry never join cable',()=>{
 const a=shape('a',[[0,0],[1,0]]),symbol=shape('s',[[1,0],[2,1],[1,0]],{entityType:'LWPOLYLINE'}),leader=shape('l',[[1,0],[2,0]],{entityType:'COMPOSITE'});
 assert.deepEqual(cableChain([a,symbol,leader],a),[a]);
});
test('coincident copies are not a junction and do not multiply measured length',()=>{
 const a=shape('a',[[0,0],[.3,.7],[1,1]],{entityType:'ARC'}),b=shape('b',[[1,1],[1.7,1.3],[2,2]],{entityType:'ARC'});
 const aa={...a,entityKey:'aa'},bb={...b,entityKey:'bb'},ccc={...b,entityKey:'ccc'};
 const result=cableChain([a,aa,b,bb,ccc],aa);
 assert.deepEqual(result,[aa,b]);assert.equal(result.coincident.length,3);
 assert.deepEqual(cableChain([a,aa,b,bb,ccc],bb),[bb,a]);
});
test('tiny endpoint mismatch works equally after translating an executive',()=>{
 for(const shift of [0,1e6]){
  const a=shape('a',[[shift,0],[shift+1000,1000]],{entityType:'ARC'}),b=shape('b',[[shift+1000.0009,1000],[shift+2000,2000]],{entityType:'ARC'});
  assert.equal(cableChain([a,b],a).length,2);
 }
});
test('different curves with the same endpoints remain ambiguous, not duplicates',()=>{
 const a=shape('a',[[0,0],[1,0]]),b=shape('b',[[1,0],[2,1],[3,0]],{entityType:'ARC'}),c=shape('c',[[1,0],[2,-1],[3,0]],{entityType:'ARC'});
 assert.deepEqual(cableChain([a,b,c],a),[a]);
});
const arc=(id,c,start,span,r)=>shape(id,Array.from({length:33},(_,i)=>[c[0]+r*Math.cos(start+span*i/32),c[1]+r*Math.sin(start+span*i/32)]),{entityType:'ARC',entityId:id});
test('reciprocal tangent arc overlap joins and counts the overlap only once',()=>{
 const a=arc('a',[20,5000],Math.atan2(-5000,-20),1,Math.hypot(20,5000)),b=arc('b',[20,-700],Math.atan2(700,20),1,Math.hypot(20,700));
 const r=cableChain([a,b],a);assert.equal(r.length,2);assert.equal(r.overlaps,1);
 const length=pathLength(r.paths);assert.ok(length<pathLength([a.pts,b.pts])-39);assert.ok(length>pathLength([a.pts,b.pts])-41);
 assert.ok(Math.abs(length-pathLength(cableChain([a,b],b).paths))<1e-6,'Picking either part gives the same total');
 const project={sheets:[{routes:[{sourceIds:['a','b']}]}]};syncLinkedRoutes(project,[a,b]);assert.equal(pathLength(project.sheets[0].routes[0].paths),length);
 const shifted={...b,entityKey:'parallel',pts:b.pts.map(p=>[p[0]+2,p[1]])};assert.equal(cableChain([a,shifted],a).length,1,'Do not jump to a nearby cable');
});
test('collinear overlap joins but crossing, gaps and ambiguous overlaps do not',()=>{
 const a=shape('a',[[0,0],[100,0]]),b=shape('b',[[95,0],[200,0]]),cross=shape('cross',[[95,0],[95,100]]);
 assert.equal(cableChain([a,b],a).length,2);assert.equal(pathLength(cableChain([a,b],a).paths),200);
 assert.equal(cableChain([a,cross],a).length,1);
 const c=shape('c',[[96,0],[210,0]]);assert.equal(cableChain([a,b,c],a).length,1);
});
