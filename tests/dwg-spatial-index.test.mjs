import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spatialIndex} from '../app/stroy/dwg/spatial-index.mjs';
test('Spatial broad phase exactly matches linear bounds scan and preserves drawing order',()=>{
 const shapes=Array.from({length:10000},(_,i)=>{const x=i%100,y=Math.floor(i/100);return {bounds:[x,y,x+1,y+1]};});shapes.push({bounds:[-1000,-1000,1000,1000]});const index=spatialIndex(shapes);assert.equal(spatialIndex(shapes),index);
 for(const b of [[0,0,0,0],[10,10,11,11],[-2000,-2000,2000,2000],[500,500,501,501],[1001,1001,2000,2000]])assert.deepEqual(index.query(b),shapes.filter(({bounds:q})=>q[0]<=b[2]&&q[2]>=b[0]&&q[1]<=b[3]&&q[3]>=b[1]));assert.deepEqual(spatialIndex([]).query([0,0,1,1]),[]);
});
