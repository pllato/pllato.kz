import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareNewCopies} from '../app/stroy/dwg/new-object-copy.mjs';
test('new LINE copies preserve exact endpoints and style without modifying original',()=>{
 const r={id:'new-A',type:'LINE',pairs:[[0,'LINE'],[5,'A'],[10,'1'],[20,'2'],[11,'3'],[21,'4'],[62,'5'],[370,'25']]},before=structuredClone(r);
 const [copy]=prepareNewCopies([r],[10,-5]);assert.deepEqual(r,before);
 assert.deepEqual(copy.pairs,[[10,'11'],[20,'-3'],[11,'13'],[21,'-1'],[62,'5'],[370,'25']]);
 assert.throws(()=>prepareNewCopies([{...r,id:'dwg-A'}],[0,0]));
});
