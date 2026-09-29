import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scene,sceneAsync,demo} from '../app/stroy/dwg/cad.mjs';
test('Cooperative scene construction retains every primitive and can cancel',async()=>{const doc=demo();doc.entities=Array.from({length:10000},(_,i)=>doc.entities[i%4]);assert.deepEqual(await sceneAsync(doc),scene(doc));await assert.rejects(sceneAsync(doc,()=>{},()=>true),/отменено/);});
