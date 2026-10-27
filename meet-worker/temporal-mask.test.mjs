import test from 'node:test';
import assert from 'node:assert/strict';
import {TemporalPersonMask} from '../meet-temporal-mask.js';
const frame=a=>new Uint8ClampedArray([81,110,130,a]);
test('stationary confidence flicker is reduced without modifying colour',()=>{
 const filter=new TemporalPersonMask();filter.apply(frame(190),1,1,0);
 const values=[];
 for(let i=1;i<=20;i++){const f=frame(i%2?180:200);filter.apply(f,1,1,i*50);values.push(f[3]);assert.deepEqual([...f.slice(0,3)],[81,110,130]);}
 assert.ok(Math.max(...values)-Math.min(...values)<8);
});
test('moving foreground and background replace history immediately',()=>{
 const filter=new TemporalPersonMask();filter.apply(frame(0),1,1,0);
 const person=frame(255);filter.apply(person,1,1,50);assert.equal(person[3],255);
 const bg=frame(0);filter.apply(bg,1,1,100);assert.equal(bg[3],0);
});
test('pause, camera reset and dimensions cannot reuse an old silhouette',()=>{
 const filter=new TemporalPersonMask();filter.apply(frame(180),1,1,0);
 const resumed=frame(200);filter.apply(resumed,1,1,1000);assert.equal(resumed[3],200);
 filter.reset();const reset=frame(180);filter.apply(reset,1,1,1050);assert.equal(reset[3],180);
 const resized=new Uint8ClampedArray([0,0,0,200,0,0,0,160]);filter.apply(resized,2,1,1100);assert.equal(resized[3],200);assert.equal(resized[7],160);
});
test('persistent changes converge instead of freezing the contour',()=>{
 const filter=new TemporalPersonMask();filter.apply(frame(180),1,1,0);
 let f;for(let i=1;i<=30;i++){f=frame(200);filter.apply(f,1,1,i*50);}
 assert.ok(f[3]>=199);
});
