import test from 'node:test';
import assert from 'node:assert/strict';
import {editObjects} from '../app/stroy/dwg/object-edit.mjs';
test('delete SPLINE chain atomically without approximating its geometry',()=>{
 const records=[1,2,3,4].map(n=>({id:'dwg-'+n,type:'SPLINE',pairs:[[5,String(n)],[210,0],[220,0],[230,1]]}));
 const doc={native:true,nativeOps:[],records:[...records],entities:[...records],blocks:new Map([['B',{records:[...records]}]])};
 editObjects(doc,records.map(r=>({id:r.id})),{remove:true});
 assert.equal(doc.records.length,0);assert.equal(doc.blocks.get('B').records.length,0);assert.equal(doc.nativeOps.length,4);assert.ok(doc.nativeOps.every(op=>op.remove));
});
