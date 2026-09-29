import {test} from 'node:test';import assert from 'node:assert/strict';
import {boxedObjects,mountBoxSelection} from '../app/stroy/dwg/box-selection.mjs';
test('box contains complete logical objects, excludes hidden/partial, detects shared instances',()=>{
 const a={id:'root',entityId:'a',bounds:[0,0,10,10],layer:'a'},b={id:'root',entityId:'b',bounds:[5,5,20,20],layer:'a'},copy={...a,id:'root2',bounds:[50,50,60,60]};
 const identity=s=>({id:s.entityId});assert.equal(boxedObjects([a,b,copy],[0,0,15,15],identity)[0].shared,true);
 assert.deepEqual(boxedObjects([a,b],[0,0,15,15],identity,new Set(['a'])),[]);
 assert.equal(boxedObjects([a,{...a,bounds:[0,0,30,30]}],[0,0,15,15],identity).length,0);
});
test('box gesture moves once; click, cancel and multitouch do not mutate',()=>{
 let commits=0,delta;const group={bounds:[10,10,20,20],shapes:[]};const api={enabled:()=>true,world:p=>p,screen:p=>p,draw(){},status(){},select:()=>[group],commit:(g,d)=>{commits++;delta=d;}};const box=mountBoxSelection(api);
 box.down(1,[0,0]);box.up(1,[30,30]);assert.equal(box.groups().length,1);
 box.down(2,[15,15]);box.move(2,[25,35]);box.up(2,[25,35]);assert.equal(commits,1);assert.deepEqual(delta,[10,20]);
 box.down(3,[0,0]);box.up(3,[30,30]);box.down(4,[15,15]);box.down(5,[16,16]);box.up(4,[30,30]);box.up(5,[40,40]);assert.equal(commits,1);
 box.down(6,[15,15]);box.reset();box.up(6,[90,90]);assert.equal(commits,1);
});
