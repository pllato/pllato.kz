import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.js';
function fixture(){const writes=[];return {writes,env:{HR_TEAM_PASSWORD:'fixture-only',DB:{prepare(sql){return {bind(...values){return {run:async()=>{writes.push({sql,values});return {meta:{changes:1}};}}}}}}}}}
async function patch(env,data,password='fixture-only'){return worker.fetch(new Request('https://test/api/hr/submission/test-candidate',{method:'PATCH',headers:{'X-HR-Team':password,'Content-Type':'application/json'},body:JSON.stringify(data)}),env,{waitUntil(){}})}
test('manual statuses persist together with review time and preserve automatic test result',async()=>{for(const decision of ['reserve','reject','internship','hire']){const {env,writes}=fixture();assert.equal((await patch(env,{decision})).status,200);assert.equal(writes.length,1);assert.match(writes[0].sql,/reviewed_at=\?,decision=\?/);assert.ok(writes[0].values[0]);assert.equal(writes[0].values[1],decision);assert.doesNotMatch(writes[0].sql,/\bstatus=/)}});
test('return to new clears decision and review marker atomically',async()=>{const {env,writes}=fixture();assert.equal((await patch(env,{decision:null,reviewed:false})).status,200);assert.deepEqual(writes[0].values.slice(0,2),[null,null])});
test('invalid status and unauthenticated updates never write',async()=>{const {env,writes}=fixture();assert.equal((await patch(env,{decision:'unknown'})).status,400);assert.equal((await patch(env,{decision:'reserve'},'wrong')).status,401);assert.equal(writes.length,0)});
