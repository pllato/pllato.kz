import test from 'node:test';
import assert from 'node:assert/strict';
import {demo,parseDxf,parseDxfAsync,cloneDoc,serializeChunks,serialize,scene,move,num,get,set,addEntity} from '../app/stroy/dwg/cad.mjs';
test('demo, geometry and Unicode survive DXF round trip',()=>{
 const d=demo();assert.equal(scene(d).shapes.length,4);
 const text=d.entities.find(r=>r.type==='TEXT');set(text,1,'Кабель №1');
 const line=d.entities.find(r=>r.type==='LINE');move(line,100,200);
 const copy=parseDxf(serialize(d));assert.equal(num(copy.entities.find(r=>r.type==='LINE'),10),1100);
 assert.ok(scene(copy).shapes.some(s=>s.text==='Кабель №1'));
});
test('unknown entities and paper space are retained, not silently exported away',()=>{
 const s=serialize(demo()).replace(/\r?\n/g,'\r\n');
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
test('history shares source text but isolates mutable pairs, additions and removals',()=>{
 const d=demo(),before=cloneDoc(d),line=d.entities.find(r=>r.type==='LINE');move(line,30,40);
 assert.equal(num(before.entities.find(r=>r.type==='LINE'),10),1000);
 const after=cloneDoc(d);move(line,60,70);assert.equal(num(after.entities.find(r=>r.type==='LINE'),10),1030);
 addEntity(d,'LINE',[[10,1],[20,2],[11,3],[21,4]]);assert.equal(before.entities.length,4);assert.equal(after.entities.length,4);
 d.records.splice(0,1);assert.equal(before.records[0].type,'SECTION');
});
test('DXF above former 64 MiB limit round trips without materializing opaque pairs',()=>{
 const payload=('1\n'+'x'.repeat(1000)+'\n').repeat(68000);
 const text='0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nSECTION\n2\nOBJECTS\n0\nXRECORD\n'+payload+'0\nENDSEC\n0\nEOF\n';
 assert.ok(text.length>64*1024*1024);const d=parseDxf(text);
 assert.equal(d.records.find(r=>r.type==='XRECORD')._pairs,undefined);
 assert.equal([...serializeChunks(d)].join(''),text);
});
test('async parser reports progress and cancellation never returns partial document',async()=>{
 const text='0\nSECTION\n2\nENTITIES\n'+('0\nLINE\n10\n1\n20\n2\n11\n3\n21\n4\n').repeat(10000)+'0\nENDSEC\n0\nEOF\n';
 let cancel=false;await assert.rejects(parseDxfAsync(text,()=>{cancel=true;},()=>cancel),/отменена/);
 const progress=[];const d=await parseDxfAsync(text,n=>progress.push(n));assert.equal(d.entities.length,10000);assert.ok(progress.length>0);
});
