import test from 'node:test';import assert from 'node:assert/strict';
import {routeLength,cableLedger,rotatePoints} from '../app/stroy/dwg/cable-ledger.mjs';
const route=(id,extra={})=>({id,sheetId:'sheet1',points:[[0,0],[3000,0],[3000,4000]],metresPerUnit:.001,brand:'ВВГнг-LS',section:'3х2,5',...extra});
test('cables without leaders count once; multiple leaders do not multiply length',()=>{
 const x=cableLedger([route('a'),route('b',{leaders:[{},{},{}],extraMetres:2})]);
 assert.equal(x.rows[0].length,16);assert.deepEqual(x.withoutLeaders,['a']);
});
test('missing cable attributes reported and sheets independently totalled',()=>{
 const x=cableLedger([route('a',{brand:''}),route('b',{sheetId:'sheet2'}),route('c')],{sheetId:'sheet1'});
 assert.equal(x.rows[0].length,7);assert.deepEqual(x.unassigned,[{id:'a',length:7}]);
});
test('rotation preserves measured length; invalid data cannot silently become zero',()=>{
 const r=route('a');assert.ok(Math.abs(routeLength(rotatePoints(r.points,Math.PI/3,[15,20]),.001)-7)<1e-10);
 assert.throws(()=>routeLength(r.points,0));assert.throws(()=>cableLedger([r,r]));assert.throws(()=>cableLedger([route('x',{extraMetres:-1})]));
});
