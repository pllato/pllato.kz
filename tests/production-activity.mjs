import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {normalizeActivity,handleProductionActivity} from '../crm/worker/production-activity.js';
const now=Date.now(),hour=Math.floor(now/3600000)*3600000;
const body={observedAt:now,coverageStart:hour-3600000,available:true,buckets:[{at:hour,count:7}],prompt:'must not be stored'};
assert.equal(normalizeActivity(body,now).prompt,undefined);
assert.throws(()=>normalizeActivity({...body,buckets:[{at:hour,count:-1}]},now));
assert.throws(()=>normalizeActivity({...body,buckets:[{at:hour,count:1},{at:hour,count:2}]},now));
assert.throws(()=>normalizeActivity({...body,observedAt:now+86400000},now));
const records=new Map();class HttpError extends Error{constructor(status,msg){super(msg);this.status=status;}}
const token='a'.repeat(43),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
const deps={sources:[{id:'codex-mac',source:'codex',tokenHash:hash}],HttpError,get:async(_,c,id)=>records.get(id),save:async(_,c,item)=>records.set(item.id,item)};
const req=(key=token,payload=body)=>new Request('https://example.com/production-activity/ingest',{method:'POST',headers:{Authorization:'Bearer '+key,'X-Activity-Device':'codex-mac'},body:JSON.stringify(payload)});
await assert.rejects(handleProductionActivity(req('x'.repeat(43)),{},null,deps),e=>e.status===401);
await handleProductionActivity(req(),{},null,deps);await handleProductionActivity(req(),{},null,deps);assert.equal(records.size,1);assert.equal(records.get('codex-mac').buckets[0].count,7);
await assert.rejects(handleProductionActivity(new Request('https://example.com/production-activity'),{},{},deps),e=>e.status===403);
const view=await handleProductionActivity(new Request('https://example.com/production-activity'),{},{isRoot:true},deps);assert(!JSON.stringify(view).includes(hash));
await handleProductionActivity(req(token,{available:false,observedAt:now+1}),{},null,deps);assert.equal(records.get('codex-mac').buckets[0].count,7);assert.equal(records.get('codex-mac').available,false);
const c={window:{},Date};vm.createContext(c);vm.runInContext(readFileSync('app/production-activity.js','utf8'),c);
const periods=[{start:hour-3600000,end:hour,label:'before'},{start:hour,end:hour+3600000,label:'now'}];
const lines=c.window.productionActivity.series({sources:[{source:'codex',coverageStart:hour,observedAt:now,buckets:[{at:hour,count:7}]}]},periods);
assert.equal(lines[0].points[0].value,null);assert.equal(lines[0].points[1].value,7);assert.equal(lines[2].points[1].value,null);assert.equal(lines[0].points[1].incomplete,true);
console.log('PASS validation, authentication, idempotence, secret exclusion, disconnected source, missing history and totals');

const multi=c.window.productionActivity.series({sources:[{source:'claude',machineId:'a',coverageStart:hour,observedAt:now,buckets:[{at:hour,count:3}]},{source:'claude',machineId:'b',coverageStart:hour,observedAt:now,buckets:[{at:hour,count:7}]}]},periods);
assert.equal(multi[0].points[1].value,10);assert.equal(multi[2].points[1].value,10);
assert.equal(c.window.productionActivity.computers({sources:[{id:'device_a',machineId:'a',source:'claude'},{id:'device_b',machineId:'b',source:'claude'},{id:'device_c',machineId:'a',source:'codex'}]}).length,2);
console.log('PASS multi-computer totals and grouping');
