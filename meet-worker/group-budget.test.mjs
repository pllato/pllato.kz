import {test} from 'node:test';
import assert from 'node:assert/strict';
import {groupVideoBudget} from '../meet-group-budget.js';
test('seven participants use total camera budget of 2 Mbps, screen 3 Mbps',()=>{
 const p=groupVideoBudget(6);assert.ok(p.camera.maxBitrate*6<=2_000_000);assert.ok(p.screen.maxBitrate*6<=3_000_000);assert.equal(p.camera.maxFramerate,15);assert.equal(p.camera.maxDimension,480);
});
test('small calls retain existing quality; mobile remains bounded',()=>{
 assert.equal(groupVideoBudget(1).camera.maxBitrate,2_000_000);assert.equal(groupVideoBudget(1).screen.maxBitrate,4_000_000);
 assert.equal(groupVideoBudget(1,true).camera.maxBitrate,600_000);assert.ok(groupVideoBudget(6,true).camera.maxBitrate*6<=1_200_000);
});
