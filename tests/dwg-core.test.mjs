import test from 'node:test';
import assert from 'node:assert/strict';
import {demo,parseDxf,serialize,scene,move,num,get,set,addEntity} from '../app/stroy/dwg/cad.mjs';
test('demo, geometry and Unicode survive DXF round trip',()=>{
 const d=demo();assert.equal(scene(d).shapes.length,4);
 const text=d.entities.find(r=>r.type==='TEXT');set(text,1,'Кабель №1');
 const line=d.entities.find(r=>r.type==='LINE');move(line,100,200);
 const copy=parseDxf(serialize(d));assert.equal(num(copy.entities.find(r=>r.type==='LINE'),10),1100);
 assert.ok(scene(copy).shapes.some(s=>s.text==='Кабель №1'));
});
test('unknown entities and paper space are retained, not silently exported away',()=>{
 const s=serialize(demo()).replace('0\r\nEOF','0\r\nEOF');
 const d=parseDxf(s.replace('0\r\nENDSEC\r\n0\r\nEOF','0\r\nSPLINE\r\n8\r\n0\r\n10\r\n42\r\n0\r\nLINE\r\n67\r\n1\r\n10\r\n20\r\n0\r\nENDSEC\r\n0\r\nEOF'));
 assert.ok(scene(d).unsupported.some(([t])=>t==='SPLINE'));
 assert.match(serialize(d),/SPLINE/);assert.match(serialize(d),/67\r\n1/);
});
test('new entities are put in ENTITIES and can be reopened',()=>{
 const d=demo();const a=addEntity(d,'LINE',[[10,12],[20,13],[11,20],[21,30]]);
 const b=addEntity(d,'TEXT',[[10,0],[20,0],[40,2],[1,'Новый']]);
 assert.notEqual(get(a,5),get(b,5));assert.equal(parseDxf(serialize(d)).entities.length,6);
});
test('MTEXT direction vector is not translated',()=>{
 const r={type:'MTEXT',pairs:[[10,'1'],[20,'2'],[11,'1'],[21,'0']]};move(r,10,20);
 assert.equal(num(r,10),11);assert.equal(num(r,11),1);assert.equal(num(r,21),0);
});
test('bad DXF fails explicitly',()=>{assert.throws(()=>parseDxf('not a file'));assert.throws(()=>parseDxf('AutoCAD Binary DXF'));});
