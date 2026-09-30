import {test} from 'node:test';
import assert from 'node:assert/strict';
import {executivePlacement} from '../app/stroy/dwg/executive-placement.mjs';
test('New executive clears every drawing and tightly fits the selected plan',()=>{
 const p=executivePlacement([{id:'a',pts:[[0,0],[3800,1770]]},{id:'other',pts:[[10000,-100],[14000,2000]],bounds:[10000,-100,14000,2000]}],['a']);
 assert.ok(p.origin[0]>14000);assert.ok(Math.abs(p.unit-3800/390*1.01)<1e-10);
 assert.deepEqual(p.centre,[1900,885]);
 assert.ok(3800/(390*p.unit)>.99);assert.ok(1770/(200*p.unit)>.89);
});
test('Placement rejects absent selection and retains drawing coordinates',()=>{
 assert.throws(()=>executivePlacement([],['a']));
 const p=executivePlacement([{id:'a',pts:[[-100,-200],[0,0]]}],['a']);
 assert.deepEqual(p.centre,[-50,-100]);assert.ok(p.origin[0]>0);
});
