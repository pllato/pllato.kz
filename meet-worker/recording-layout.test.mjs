import test from 'node:test';
import assert from 'node:assert/strict';
import {containRect,recordingLayout} from '../meet-recording-layout.js';
test('portrait, landscape and ultrawide retain ratio and complete image',()=>{
 for(const [sw,sh] of [[1920,1080],[1080,1920],[3440,1440],[640,480]])for(const t of recordingLayout(2,1)){
  const r=containRect(sw,sh,t.x,t.y,t.w,t.h-24);
  assert.ok(Math.abs(r.width/r.height-sw/sh)<1e-9);assert.ok(r.x>=t.x-.001&&r.y>=t.y-.001);assert.ok(r.width<=t.w+.001&&r.height<=t.h-24+.001);
 }
});
test('multiple screens and cameras do not overlap or cover caption strip',()=>{
 const ts=recordingLayout(6,2);assert.equal(ts.length,8);
 for(const [i,a] of ts.entries()){
  assert.ok(a.y+a.h<=668);for(const b of ts.slice(i+1))assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
 }
});
