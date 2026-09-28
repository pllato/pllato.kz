import test from 'node:test';
import assert from 'node:assert/strict';
import {cableChain} from '../app/stroy/dwg/cable-chain.mjs';
const shape=(key,pts,extra={})=>({entityKey:key,entityType:'LINE',text:null,pts,bounds:[0,0,100,100],layer:'cable',color:5,...extra});
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
