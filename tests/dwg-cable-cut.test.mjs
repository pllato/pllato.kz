import test from 'node:test';
import assert from 'node:assert/strict';
import {cutCable} from '../app/stroy/dwg/cable-edit.mjs';
test('cut projects points and preserves both remaining bends',()=>{
 const points=[[0,0],[10,0],[10,10],[20,10]];
 assert.deepEqual(cutCable(points,[5,1],[15,9]),[[[0,0],[5,0]],[[15,10],[20,10]]]);
 assert.deepEqual(points,[[0,0],[10,0],[10,10],[20,10]]);
 assert.deepEqual(cutCable(points,[15,9],[5,1]),cutCable(points,[5,1],[15,9]));
});
test('cut endpoint and whole route do not create zero-length remnants',()=>{
 assert.deepEqual(cutCable([[0,0],[10,0]],[0,0],[5,0]),[[[5,0],[10,0]]]);
 assert.deepEqual(cutCable([[0,0],[10,0]],[0,0],[10,0]),[]);
 assert.throws(()=>cutCable([[0,0],[10,0]],[3,0],[3,0]));
});
