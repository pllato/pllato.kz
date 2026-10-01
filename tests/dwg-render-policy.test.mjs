import test from 'node:test';import assert from 'node:assert/strict';
import {canvasResolution,RASTER_THRESHOLD} from '../app/stroy/dwg/render-policy.mjs';
test('tablet backing buffers are bounded without changing CSS/world size',()=>{
 for(const [w,h,d]of [[1280,854,2.5],[3200,2136,3],[854,1280,2.5]]){const [x,y]=canvasResolution(w,h,d,true);assert.ok(x*y<2404000);assert.ok(Math.abs(x/y-w/h)<.002);assert.ok(x/w<=1.501);}
 assert.deepEqual(canvasResolution(1000,500,1,false),[1000,500]);assert.deepEqual(canvasResolution(0,0,2,true),[1,1]);
 assert.ok(17577>RASTER_THRESHOLD,'ordinary executive uses cooperative raster cache');
});
