import test from 'node:test';
import assert from 'node:assert/strict';
import {areaDrag} from '../app/stroy/dwg/area-drag.mjs';
test('rectangle selection requires drag; supports reverse; cancels click, reset and multi-touch',()=>{
 let enabled=true;const completed=[],g=areaDrag({enabled:()=>enabled,start:()=>{},move:()=>{},cancel:()=>{},finish:(a,b)=>completed.push([a,b])});
 g.down(1,[10,10]);g.up(1,[10,10]);assert.equal(completed.length,0);
 g.down(1,[10,10]);g.up(1,[100,12]);assert.equal(completed.length,0);
 g.down(1,[100,100]);g.move(1,[20,20]);g.up(1,[20,20]);assert.deepEqual(completed,[[[100,100],[20,20]]]);
 g.down(1,[10,10]);g.reset();assert.equal(g.up(1,[100,100]),false);assert.equal(completed.length,1);
 g.down(1,[10,10]);g.down(2,[20,20]);g.up(2,[100,100]);g.up(1,[100,100]);assert.equal(completed.length,1);assert.equal(g.active(),false);
 enabled=false;assert.equal(g.down(1,[0,0]),false);enabled=true;g.down(1,[0,0],2);assert.equal(g.active(),false);
});

test('failed finish and interrupted drag permit a fresh independent rectangle',()=>{
 let attempts=0;const g=areaDrag({enabled:()=>true,start:()=>{},move:()=>{},cancel:()=>{},finish:()=>{attempts++;if(attempts===1)throw Error('engine failure');}});
 g.down(1,[0,0]);assert.throws(()=>g.up(1,[100,100]),/engine failure/);assert.equal(g.active(),false);
 g.reset();g.down(2,[0,0]);g.up(2,[50,50]);assert.equal(attempts,2);assert.equal(g.active(),false);
 g.down(3,[0,0]);g.reset();g.down(4,[0,0]);g.up(4,[80,80]);assert.equal(attempts,3);
});
