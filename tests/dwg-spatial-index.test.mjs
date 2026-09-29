import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spatialIndex,viewportShapes,deriveSpatialIndex} from '../app/stroy/dwg/spatial-index.mjs';
test('incremental deletion and decorations preserve exact query order and bounds',()=>{
 let shapes=Array.from({length:1000},(_,i)=>({bounds:[i,i,i+1,i+1]}));spatialIndex(shapes);
 for(let step=0;step<12;step++){
  const removed=new Set([shapes[4],shapes[21]]),added=[{bounds:[-20-step,-20,2,2]}],next=shapes.filter(s=>!removed.has(s)).concat(added);
  deriveSpatialIndex(shapes,next,removed,added);shapes=next;
  for(const b of [[-100,-100,100,100],[400,400,500,500],[-1000,-1000,2000,2000]])assert.deepEqual(spatialIndex(shapes).query(b),shapes.filter(({bounds:q})=>q[0]<=b[2]&&q[2]>=b[0]&&q[1]<=b[3]&&q[3]>=b[1]));
 }
});
test('Spatial broad phase exactly matches linear bounds scan and preserves drawing order',()=>{
 const shapes=Array.from({length:10000},(_,i)=>{const x=i%100,y=Math.floor(i/100);return {bounds:[x,y,x+1,y+1]};});shapes.push({bounds:[-1000,-1000,1000,1000]});const index=spatialIndex(shapes);assert.equal(spatialIndex(shapes),index);
 for(const b of [[0,0,0,0],[10,10,11,11],[-2000,-2000,2000,2000],[500,500,501,501],[1001,1001,2000,2000]])assert.deepEqual(index.query(b),shapes.filter(({bounds:q})=>q[0]<=b[2]&&q[2]>=b[0]&&q[1]<=b[3]&&q[3]>=b[1]));assert.deepEqual(spatialIndex([]).query([0,0,1,1]),[]);
});
test('Viewport candidates retain margin, reversed screen Y and painter order at all zooms',()=>{
 const shapes=Array.from({length:40000},(_,i)=>({bounds:[i%200,Math.floor(i/200),i%200+1,Math.floor(i/200)+1]}));
 for(const s of [.1,1,10,100])for(const x of [-1000,0,50]){
  const view={x,y:150,s},w=300,h=200,b=[(-20-x)/s,(150-h-20)/s,(w+20-x)/s,170/s];
  const visible=({bounds:q})=>q[0]<=b[2]&&q[2]>=b[0]&&q[1]<=b[3]&&q[3]>=b[1];
  assert.deepEqual(viewportShapes(shapes,view,w,h).filter(visible),shapes.filter(visible));
 }
});
