import test from 'node:test';import assert from 'node:assert/strict';
import {hatchGeometry,paintHatch} from '../app/stroy/dwg/hatch.mjs';
const box=(a,b)=>({boundaryPathTypeFlag:2,vertices:[{x:a,y:a},{x:b,y:a},{x:b,y:b},{x:a,y:b}]});
test('hatch retains island rings and rejects unsupported spline edges',()=>{
 const h=hatchGeometry({solidFill:1,boundaryPaths:[box(0,10),box(3,7)]});assert.equal(h.loops.length,2);
 assert.equal(hatchGeometry({solidFill:1,boundaryPaths:[{edges:[{type:4}]}]}),null);
});
test('pattern clips even-odd, uses original offsets and dash gaps',()=>{
 const h=hatchGeometry({solidFill:0,boundaryPaths:[box(0,10)],definitionLines:[{angle:0,base:{x:0,y:0},offset:{x:0,y:2},dashLengths:[1,-1]}]});
 const segments=[],clips=[],ctx={save(){},restore(){},beginPath(){},moveTo(x,y){this.p=[x,y]},lineTo(x,y){segments.push([this.p,[x,y]])},closePath(){},clip(rule){clips.push(rule)},transform(){},stroke(){}};
 paintHatch(ctx,{hatch:h,matrix:[1,0,0,1,0,0],bounds:[0,0,10,10]},{s:10,x:0,y:100},'#fff',100,100);
 assert.deepEqual(clips,['evenodd']);assert.ok(segments.some(([a,b])=>a[0]===0&&b[0]===1));assert.ok(segments.some(([a,b])=>a[0]===2&&b[0]===3));
});
