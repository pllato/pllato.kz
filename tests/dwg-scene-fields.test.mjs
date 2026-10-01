import test from 'node:test';
import assert from 'node:assert/strict';
import {fromRecords,scene,set,parseDxf} from '../app/stroy/dwg/cad.mjs';
test('scene scratch fields retain first group, defaults and refresh after edits',()=>{
 const a={id:'a',type:'LINE',pairs:[[10,'1'],[10,'999'],[20,'2'],[11,'3'],[21,'4'],[62,'5']]},b={id:'b',type:'LINE',pairs:[[10,'5'],[20,'6'],[11,'7'],[21,'8']]};
 const doc=fromRecords([{type:'SECTION',pairs:[[2,'ENTITIES']]},a,b,{type:'ENDSEC',pairs:[]}]);
 let shapes=scene(doc).shapes;assert.deepEqual(shapes[0].pts,[[1,2],[3,4]]);assert.equal(shapes[0].color,5);assert.equal(shapes[1].color,7);
 set(a,10,25);shapes=scene(doc).shapes;assert.equal(shapes[0].pts[0][0],25);assert.equal(shapes[1].pts[0][0],5);
});
test('scene scratch fields do not materialize raw LINE DXF pairs',()=>{
 const doc=parseDxf('0\nSECTION\n2\nENTITIES\n0\nLINE\n10\n1\n20\n2\n11\n3\n21\n4\n0\nENDSEC\n0\nEOF\n');
 const line=doc.entities[0];assert.equal(line._pairs,undefined);assert.deepEqual(scene(doc).shapes[0].pts,[[1,2],[3,4]]);assert.equal(line._pairs,undefined);
});
