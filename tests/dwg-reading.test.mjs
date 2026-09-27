import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDxf,scene,serialize,move} from '../app/stroy/dwg/cad.mjs';
const record=(t,p=[])=>[[0,t],...p].map(x=>x.join('\n')).join('\n')+'\n';
const draw=(entities,blocks='')=>parseDxf(record('SECTION',[[2,'BLOCKS']])+blocks+record('ENDSEC')+record('SECTION',[[2,'ENTITIES']])+entities+record('ENDSEC')+record('EOF'));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('legacy polyline uses vertices, closure and preserves original records',()=>{
 const d=draw(record('POLYLINE',[[70,1]])+record('VERTEX',[[10,2],[20,3]])+record('VERTEX',[[10,7],[20,3]])+record('VERTEX',[[10,7],[20,8]])+record('SEQEND'));
 const s=scene(d);assert.equal(s.shapes.length,1);assert.deepEqual(s.shapes[0].pts,[[2,3],[7,3],[7,8],[2,3]]);assert.deepEqual(s.unsupported,[]);assert.match(serialize(d),/VERTEX/);
});
test('mesh and fitted polyline are reported, not rendered as false outlines',()=>{
 const d=draw(record('POLYLINE',[[70,64]])+record('VERTEX',[[10,2],[20,3]])+record('SEQEND'));assert.equal(scene(d).shapes.length,0);assert.equal(scene(d).unsupported.length,1);
});
test('ellipse uses WCS major axis, ratio and reversed normal',()=>{
 const d=draw(record('ELLIPSE',[[10,10],[20,20],[11,4],[21,0],[40,.5],[41,0],[42,Math.PI/2],[230,-1]]));const p=scene(d).shapes[0].pts;
 assert.deepEqual(p[0],[14,20]);near(p.at(-1)[0],10);near(p.at(-1)[1],18);
});
test('LINE coordinates remain WCS regardless of extrusion',()=>{
 const d=draw(record('LINE',[[10,2],[20,3],[11,4],[21,5],[210,1],[230,0]]));assert.deepEqual(scene(d).shapes[0].pts,[[2,3],[4,5]]);
});
test('negative normal mirrors OCS circle, but cannot be moved unsafely',()=>{
 const d=draw(record('CIRCLE',[[10,4],[20,3],[40,2],[230,-1]]));assert.deepEqual(scene(d).shapes[0].pts[0],[-6,3]);assert.throws(()=>move(d.entities[0],1,1),/OCS/);
});
test('dimension uses cached graphical block and preserves dimension owner',()=>{
 const block=record('BLOCK',[[2,'*D1']])+record('LINE',[[10,1],[20,2],[11,5],[21,2]])+record('ENDBLK');
 const d=draw(record('DIMENSION',[[2,'*D1']]),block),s=scene(d);assert.equal(s.shapes.length,1);assert.equal(s.shapes[0].id,d.entities[0].id);assert.deepEqual(s.shapes[0].pts,[[1,2],[5,2]]);
 assert.match(scene(draw(record('DIMENSION',[[2,'missing']]))).unsupported[0][0],/без графического/);
});
test('rational quadratic spline follows quarter circle, not control polygon',()=>{
 const d=draw(record('SPLINE',[[71,2],...[0,0,0,1,1,1].map(v=>[40,v]),...[1,Math.SQRT1_2,1].map(v=>[41,v]),[10,1],[20,0],[10,1],[20,1],[10,0],[20,1]]));
 const p=scene(d).shapes[0].pts;near(p[18][0],Math.SQRT1_2);near(p[18][1],Math.SQRT1_2);assert.deepEqual(p[0],[1,0]);assert.deepEqual(p.at(-1),[0,1]);
});
test('SOLID DXF vertex order is not a self-intersecting bow tie',()=>{
 const s=scene(draw(record('SOLID',[[10,0],[20,0],[11,2],[21,0],[12,0],[22,2],[13,2],[23,2]]))).shapes[0];
 assert.equal(s.fill,true);assert.deepEqual(s.pts,[[0,0],[2,0],[2,2],[0,2],[0,0]]);
});
