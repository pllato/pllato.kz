import test from 'node:test';import assert from 'node:assert/strict';
import {splineControls,setSplineControl} from '../app/stroy/dwg/control-edit.mjs';
test('spline control edit preserves knots, weights and other points',()=>{const r={id:'x',type:'SPLINE',pairs:[[10,1],[20,2],[10,3],[20,4],[40,.5],[41,1]]};assert.deepEqual(splineControls(r,[2,0,0,2,10,20])[1].point,[16,28]);setSplineControl(r,1,7,8);assert.deepEqual(r.pairs,[[10,1],[20,2],[10,7],[20,8],[40,.5],[41,1]]);assert.throws(()=>setSplineControl(r,3,0,0));});
