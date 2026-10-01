import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demo,scene,addEntity,move} from '../app/stroy/dwg/cad.mjs';
import {updatedRootScene} from '../app/stroy/dwg/root-scene.mjs';
test('root INSERT update preserves painter order, attributes and unaffected instances',()=>{
 const doc=demo();doc.blocks.set('socket',{base:[0,0],records:[{id:'arc',type:'ARC',pairs:[[10,0],[20,0],[40,50],[50,0],[51,180]]}]});
 const a=addEntity(doc,'INSERT',[[2,'socket'],[10,300],[20,400]]),b=addEntity(doc,'INSERT',[[2,'socket'],[10,600],[20,400]]),before=scene(doc),untouched=before.shapes.find(s=>s.id===b.id);
 move(a,25,10);const after=updatedRootScene(doc,before,[{id:a.id}]);assert.deepEqual(after,scene(doc));assert.equal(after.shapes.find(s=>s.id===b.id),untouched);assert.deepEqual(updatedRootScene(doc,before,[{id:'arc'}]),scene(doc));
});
