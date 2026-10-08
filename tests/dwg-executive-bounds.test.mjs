import test from 'node:test';import assert from 'node:assert/strict';
import {selectExecutiveRoots} from '../app/stroy/dwg/executive-selection.mjs';
import {executivePlacement} from '../app/stroy/dwg/executive-placement.mjs';
test('selection and placement use exact path bounds without expanding compact paths',()=>{
 const r={id:'dwg-A',type:'LINE',pairs:[[5,'A']]},shape={id:r.id,text:null,bounds:[1,2,3,4],get pts(){throw Error('Path should stay compact');}},doc={entities:[r]};
 assert.deepEqual(selectExecutiveRoots(doc,[shape],[0,0,5,5]),['A']);assert.deepEqual(executivePlacement([shape],[r.id]).bounds,[1,2,3,4]);
});
test('text selection uses actual anchor bounds rather than padded hit area',()=>{
 const r={id:'dwg-A',type:'TEXT',pairs:[[5,'A']]},shape={id:r.id,text:'Текст',bounds:[-100,-100,100,100],geometryBounds:[1,2,1,2],get pts(){throw Error('Use anchor bounds');}};
 assert.deepEqual(selectExecutiveRoots({entities:[r]},[shape],[0,0,5,5]),['A']);assert.deepEqual(executivePlacement([shape],[r.id]).bounds,[1,2,1,2]);
});
