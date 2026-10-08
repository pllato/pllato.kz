import test from 'node:test';import assert from 'node:assert/strict';
import {compactShapePoints} from '../app/stroy/dwg/compact-points.mjs';
import {scene,fromRecords} from '../app/stroy/dwg/cad.mjs';
import {spatialIndex} from '../app/stroy/dwg/spatial-index.mjs';
test('compact paths retain Float64 coordinates and independent temporary arrays',()=>{
 const pts=Array.from({length:153},(_,i)=>[Math.cos(i/13)*12345.678901234567,Math.sin(i/13)*12345.678901234567]);
 const shape=compactShapePoints({id:'a',pts,bounds:[-13000,-13000,13000,13000]});assert.deepEqual(shape.pts,pts);
 const temporary=shape.pts;temporary[0][0]=999;assert.deepEqual(shape.pts,pts);
 assert.equal(spatialIndex([shape]).query([-1,-1,1,1])[0],shape);
 const moved=pts.map(([x,y])=>[x+1,y+2]);shape.pts=moved;assert.deepEqual(shape.pts,moved);assert.equal(shape._pointData,undefined);
});
test('large native scene retains every curve sample and selection identity',()=>{
 const records=[{type:'SECTION',id:'s',pairs:[[2,'ENTITIES']]},{type:'CIRCLE',id:'dwg-A',pairs:[[0,'CIRCLE'],[10,'1'],[20,'2'],[40,'3']]},{type:'ENDSEC',id:'e',pairs:[]}];
 const small=fromRecords(records),expected=scene(small).shapes[0];
 const large={...small,native:true,records:[...records,...Array.from({length:20000},(_,i)=>({type:'ENDSEC',id:'dummy-'+i,pairs:[]}))]};
 const actual=scene(large).shapes[0];assert.ok(actual._pointData instanceof Float64Array);assert.deepEqual(actual.pts,expected.pts);
 for(const field of ['id','entityKey','entityMatrix','bounds','color','layer'])assert.deepEqual(actual[field],expected[field]);
});
test('repeated curve definitions share samples while retaining distinct instance transforms',()=>{
 const points=Array.from({length:20},(_,i)=>[i/3,Math.sin(i)]),cache=new WeakMap(),key={};
 const a=compactShapePoints({id:'a',pts:points},points,[1,0,0,1,0,0],cache,key);
 const b=compactShapePoints({id:'b',pts:points},points,[0,2,-3,0,100,200],cache,key);
 assert.equal(a._pointData,b._pointData);assert.deepEqual(a.pts,points);
 assert.deepEqual(b.pts,points.map(([x,y])=>[100-3*y,200+2*x]));
});
