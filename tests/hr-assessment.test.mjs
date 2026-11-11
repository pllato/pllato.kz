import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {assessSubmission} from '../hr-worker/assessment.js';
import worker from '../hr-worker/worker.js';
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../hr-worker/schema.sql',import.meta.url),'utf8'));
const DB={prepare(query){return {bind(...args){return {async run(){const r=sql.prepare(query).run(...args);return {meta:{changes:r.changes}}},async first(){return sql.prepare(query).get(...args)},async all(){return {results:sql.prepare(query).all(...args)}}}},async first(){return sql.prepare(query).get()},async all(){return {results:sql.prepare(query).all()}}}}};
const bank=[...HR_COGNITIVE.items,...HR_ABSTRACT.items.map(x=>({...x,section:'A'}))];
function body(form='A',correct=true){const d={fam:'sales',stage:'iq',cform:form,ans:{cognitive:bank.filter(x=>x.form===form).map(x=>({id:x.id,a:correct?x.answerIndex:null}))}};return {name:'Тест',phone:'77010000000',fam:'sales',stage:'iq',code:HR.encodeResult(d)}}
for(const form of ['A','B','C']){assert.equal(assessSubmission(body(form)).status,'passed');assert.equal(assessSubmission(body(form,false)).status,'failed')}
const wrong=body();const decoded=HR.decodeResult(wrong.code).data;decoded.ans.cognitive[1]=decoded.ans.cognitive[0];wrong.code=HR.encodeResult(decoded);assert.throws(()=>assessSubmission(wrong));
const personal={name:'Тест',phone:'77010000000',fam:'sales',stage:'personality',status:'passed',fit:99,code:HR.encodeResult({fam:'sales',stage:'personality',ans:{personality:Object.fromEntries(HR_PERSONALITY.items.map(it=>[it.id,it.attn_answer||3]))}})};assert.equal(assessSubmission(personal).status,'review');
let notifications=0;const ctx={waitUntil(p){notifications++;p.catch(()=>{})}};
async function req(path,method='GET',body,auth=true){const r=await worker.fetch(new Request('https://test/api/hr/'+path,{method,headers:{'Content-Type':'application/json',...(auth?{'X-HR-Team':'test'}:{})},...(body?{body:JSON.stringify(body)}:{})}),{DB,HR_TEAM_PASSWORD:'test'},ctx);return {status:r.status,...await r.json()}}
assert.equal((await req('summary','GET',null,false)).status,401);
const attempt=await req('attempt','POST',{name:'Тест',phone:'77010000000',fam:'sales',stage:'personality'},false);assert.ok(attempt.token);
personal.attempt={id:attempt.id,token:attempt.token};const submitted=await req('submit','POST',personal,false);assert.equal(submitted.ok,true);assert.equal(notifications,1);
assert.equal((await req('summary')).pending,1);assert.equal((await req('submissions')).items.length,1);
await req('submission/'+submitted.id,'PATCH',{reviewed:true});assert.equal((await req('summary')).pending,0);
await req('submit','POST',personal,false);assert.equal(notifications,1);assert.equal((await req('summary')).pending,0);
assert.equal((await req('push/subscribe','POST',{endpoint:'https://evil.test/',keys:{}})).status,400);
console.log('HR assessment + database lifecycle: all checks passed');

const answers=Object.fromEntries(HR_PERSONALITY.items.map(it=>[it.id,it.attn_answer||3]));
const quality={version:1,readMs:Object.fromEntries(HR_PERSONALITY.items.map(it=>[it.id,1600])),fastClicks:0,attentionRetries:0};
function assessQuality(q=quality,a=answers){return assessSubmission({...personal,code:HR.encodeResult({stage:'personality',fam:'sales',ans:{personality:a},telemetry:{personalityQuality:q}})})}
assert.equal(assessQuality().status,'review');
assert.throws(()=>assessQuality({...quality,readMs:{}}));
assert.throws(()=>assessQuality(quality,{...answers,'ATT-01':1}));
assert.throws(()=>assessQuality(quality,{}));
assert.equal(assessQuality({...quality,failed:true,attentionRetries:3},{}).status,'needs_retry');
assert.throws(()=>assessQuality({...quality,failed:true,attentionRetries:2},{}));
console.log('Personality completion, read times, attention instructions and retry outcome: passed');

const registry=(await req('submissions')).items[0];
assert.equal(registry.code,undefined);
assert.equal(registry.chart.quality,'legacy');
assert.equal(Object.keys(registry.chart.scales).length,6);
assert.equal(JSON.stringify(registry).includes('readMs'),false);
const {registryChart}=await import('../hr-worker/assessment.js');
const checked={stage:'personality',code:HR.encodeResult({ans:{personality:answers},telemetry:{personalityQuality:quality}})};
assert.equal(registryChart(checked).quality,'checked');
assert.equal(registryChart({...checked,status:'needs_retry'}).scales,null);
assert.equal(registryChart({stage:'personality',code:'broken'}),null);
assert.equal(registryChart({stage:'iq'}),null);
assert.equal(registryChart({stage:'personality',code:HR.encodeResult({ans:{personality:{}}})}),null);
console.log('Registry: compact profiles, legacy/checked/retry states, no answer/code leakage passed');
for(const age of [null,0,121,25.5,'25']){const d=HR.decodeResult(personal.code).data;d.cand={formVersion:2,age};assert.throws(()=>assessSubmission({...personal,code:HR.encodeResult(d)}));}
const ageData=HR.decodeResult(personal.code).data;ageData.cand={formVersion:2,age:25};
const agePayload={...personal,code:HR.encodeResult(ageData)};
assert.equal(assessSubmission(agePayload).status,'review');
await req('submit','POST',agePayload,false);
assert.equal((await req('submissions')).items[0].age,25);
console.log('Required age validation and registry round-trip passed');
