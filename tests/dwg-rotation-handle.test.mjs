import test from 'node:test';
import assert from 'node:assert/strict';
import {rotationFrame,rotationDelta,rotatedPoint} from '../app/stroy/dwg/rotation-handle.mjs';
test('rotation gesture and preview respect parent rotation, scale and mirroring',()=>{
 for(const matrix of [[1,0,0,1,0,0],[0,2,-3,0,12,8],[-2,0,0,3,5,4]]){
  const f=rotationFrame([2,3],matrix),p=[f.world[0]+matrix[0]*10,f.world[1]+matrix[1]*10];
  const end=rotatedPoint(f,p,90);assert.ok(Math.abs(rotationDelta(f,p,end)-90)<1e-8);
  assert.deepEqual(rotatedPoint(f,f.world,90),f.world);
 }
 assert.equal(rotationFrame([0,0],[0,0,0,0,0,0]),null);
});
