import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deviceInstances,wholeDevice} from '../app/stroy/dwg/device-selection.mjs';
test('Device selection uses complete leaf INSERT instances, never loose lines or plan containers',()=>{
 const insert=(id,name)=>({id,type:'INSERT',pairs:[[2,name]]}),a=insert('a','device'),b=insert('b','device'),plan=insert('p','plan');const doc={records:[a,b,plan],blocks:new Map([['device',{records:[{type:'LINE'},{type:'ARC'},{type:'TEXT'}]}],['plan',{records:[a,b,{type:'LINE'}]}]])};
 const devices=deviceInstances(doc);assert.deepEqual([...devices],['a','b']);for(const entityType of ['LINE','ARC','CIRCLE','SPLINE','TEXT'])assert.equal(wholeDevice({deviceId:'a',entityType},devices),true);assert.equal(wholeDevice({deviceId:'p'},devices),false);assert.equal(wholeDevice({entityType:'LINE'},devices),false);
});
