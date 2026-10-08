import assert from 'node:assert/strict';
import {createPlanAutosave} from '../app/financial-autosave.js';
let plan={revision:0,value:'a'},calls=[],release;
const saver=createPlanAutosave({snapshot:()=>plan,delay:10000,write:async payload=>{calls.push(payload);if(calls.length===1)await new Promise(r=>release=r);return {revision:payload.revision+1};},accepted:r=>{plan.revision=r.revision;},onState:()=>{}});
saver.mark();const flushing=saver.flush();plan.value='b';saver.mark();release();await flushing;
assert.deepEqual(calls,[{revision:0,value:'a'},{revision:1,value:'b'}]);assert.equal(saver.isDirty(),false);saver.stop();
let failed=true,states=[];const retry=createPlanAutosave({snapshot:()=>({value:5}),delay:10000,write:async()=>{if(failed)throw Error('Offline');return {};},accepted:()=>{},onState:s=>states.push(s)});
retry.mark();await assert.rejects(()=>retry.flush(),/Offline/);assert.equal(retry.isDirty(),true);failed=false;await retry.flush();assert.equal(retry.isDirty(),false);assert.ok(states.includes('error'));retry.stop();
console.log('Autosave: serial writes preserve edits during pending request, revision advances, failure keeps dirty state, retry recovers.');
