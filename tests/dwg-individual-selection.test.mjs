import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scene} from '../app/stroy/dwg/cad.mjs';
const r=(type,id,pairs)=>({type,id,pairs:pairs.map(([k,v])=>[k,String(v)])});
test('Nested geometry retains its own record and coordinate transform',()=>{
 const line=r('LINE','line',[[10,0],[20,0],[11,10],[21,0]]),other=r('LINE','other',[[10,0],[20,5],[11,10],[21,5]]);
 const doc={layers:new Map(),blocks:new Map([['P',{base:[0,0],flags:0,records:[line,other]}]]),entities:[r('INSERT','sheet',[[2,'P'],[10,100],[20,200],[50,90]])]};
 const shapes=scene(doc).shapes;
 assert.equal(shapes.length,2);assert.equal(shapes[0].id,'sheet');assert.equal(shapes[0].entityId,'line');
 assert.notEqual(shapes[0].entityKey,shapes[1].entityKey);
 assert.ok(Math.abs(shapes[0].entityMatrix[1]-1)<1e-10);
 assert.deepEqual(shapes[0].pts[0],[100,200]);
});
test('Leader graphics select the real leader, never an invented child record',()=>{
 const leader=r('MULTILEADER','leader',[]);leader.parts=[r('LINE','fake',[[10,0],[20,0],[11,10],[21,0]])];
 const doc={layers:new Map(),blocks:new Map(),entities:[leader]};
 assert.equal(scene(doc).shapes[0].entityId,'leader');
});
