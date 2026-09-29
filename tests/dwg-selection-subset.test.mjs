import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionSubset,toggleSelectionPart} from '../app/stroy/dwg/selection-subset.mjs';
import {pathLength} from '../app/stroy/dwg/selection-metrics.mjs';
const line=(key,a,b)=>({entityKey:key,entityType:'LINE',pts:[a,b],bounds:[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])],text:null,layer:'cable',color:5});
test('refinement removes and restores only the clicked CAD part; geometry untouched',()=>{
 const shapes=[line('a',[0,0],[10,0]),line('b',[10,0],[10,10]),line('c',[10,10],[20,10]),line('other',[0,1],[10,1])],before=JSON.stringify(shapes);
 let selection=selectionSubset(shapes,new Set(['a','b','c']));
 selection=toggleSelectionPart(shapes,selection,shapes[1]);
 assert.deepEqual([...selection.keys],['a','c']);assert.equal(pathLength(selection.paths),20);
 assert.equal(toggleSelectionPart(shapes,selection,shapes[3]),selection);
 selection=selectionSubset(shapes,selection.keys,selection.universe);
 assert.equal(selection.keys.has('b'),false);
 selection=toggleSelectionPart(shapes,selection,shapes[1]);assert.equal(selection.keys.size,3);assert.equal(pathLength(selection.paths),30);assert.equal(JSON.stringify(shapes),before);
});
test('coincident copies toggle together and never double the length',()=>{
 const shapes=[line('a',[0,0],[10,0]),line('copy',[10,0],[0,0]),line('b',[10,0],[20,0])];
 let selection=selectionSubset(shapes,new Set(['a','copy','b']));assert.equal(pathLength(selection.paths),20);
 selection=toggleSelectionPart(shapes,selection,shapes[0]);assert.deepEqual([...selection.keys],['b']);
 selection=toggleSelectionPart(shapes,selection,shapes[1]);assert.equal(selection.keys.size,3);assert.equal(pathLength(selection.paths),20);
});
