import test from 'node:test';
import assert from 'node:assert/strict';
import {cableLengthLabel} from '../app/stroy/dwg/cable-length-label.mjs';
test('length overlay distinguishes geometry and total, using route calibration',()=>{
 const route={points:[[0,0],[3000,4000]],metresPerUnit:.001,extraMetres:4};
 assert.equal(cableLengthLabel(route),'Длина ≈ 5 м\nС учётом отпусков ≈ 9 м (+4 м)');
 route.extraMetres=1.25;
 assert.equal(cableLengthLabel(route),'Длина ≈ 5 м\nС учётом отпусков ≈ 6,25 м (+1,25 м)');
 route.extraMetres=0;assert.equal(cableLengthLabel(route),'Длина ≈ 5 м');
 route.paths=[[[0,0],[3000,0]],[[0,0],[0,4000]]];route.extraMetres=2;
 assert.equal(cableLengthLabel(route),'Длина ≈ 7 м\nС учётом отпусков ≈ 9 м (+2 м)');
});
