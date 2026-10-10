import {test} from 'node:test';import assert from 'node:assert/strict';
import {selectExecutiveRoots} from '../app/stroy/dwg/executive-selection.mjs';
const rec=(h)=>({type:'INSERT',id:'dwg-'+h,pairs:[[5,h]]}),doc={entities:[rec('A'),rec('B'),rec('C')]};
const shapes=[{id:'dwg-A',pts:[[-2,5],[12,5]],bounds:[-2,5,12,5],text:null},{id:'dwg-B',pts:[[2,2],[3,3]],bounds:[2,2,3,3],text:null},{id:'dwg-C',pts:[[8,8],[9,9]],bounds:[8,8,9,9],text:null}];
test('Crossing rectangle includes the complete architectural block instead of silently dropping it',()=>assert.deepEqual(selectExecutiveRoots(doc,shapes,[0,0,10,10],{crossing:true}),['A','B','C']));
test('Concave polygon excludes notch and includes intersecting exact roots',()=>assert.deepEqual(selectExecutiveRoots(doc,shapes,[[0,0],[10,0],[10,4],[4,4],[4,10],[0,10]],{crossing:true}),['A','B']));
test('Self-intersecting contour is rejected instead of yielding unpredictable selection',()=>assert.throws(()=>selectExecutiveRoots(doc,shapes,[[0,0],[10,10],[0,10],[10,0]],{crossing:true}),/пересека/));
test('Whole-root polygon containment checks edges across concave notch',()=>assert.deepEqual(selectExecutiveRoots(doc,shapes,[[0,0],[10,0],[10,4],[4,4],[4,10],[0,10]]),['B']));
