import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalPhone, findRecordingCall, recordingToken, resolveRecordingLinks} from './call-recordings.js';
test('normalizes Kazakhstan trunk but preserves international country code',()=>{
 assert.equal(normalPhone('+7 (701) 123-45-67'),normalPhone('87011234567'));
 assert.notEqual(normalPhone('+996553940000'),normalPhone('+7996553940000'));
});
test('matches direction and call time, never old or ambiguous conversations',()=>{
 const meta={phone:'77011234567',direction:'out',startedAt:'2026-10-14T06:00:00Z'};
 const row={id:1,phone:'+7 701 123 45 67',direction:'out',started_at:meta.startedAt};
 assert.equal(findRecordingCall([row],meta)?.id,1);
 assert.equal(findRecordingCall([{...row,direction:'in'}],meta),null);
 assert.equal(findRecordingCall([{...row,started_at:'2026-10-13T06:00:00Z'}],meta),null);
 assert.equal(findRecordingCall([row,{...row,id:2}],meta),null);
});
test('retries keep same unguessable audio URL',async()=>{
 assert.equal(await recordingToken('server:123.4','secret'),await recordingToken('server:123.4','secret'));
 assert.notEqual(await recordingToken('server:123.4','secret'),await recordingToken('server:123.5','secret'));
 assert.match(await recordingToken('server:123.4','secret'),/^[a-f0-9-]{36}$/);
});
test('ambiguous deals never receive arbitrary audio',()=>{
 const contacts=[{id:'c1',phones:JSON.stringify([{value:'+996553940000'}])}];
 assert.deepEqual(resolveRecordingLinks(contacts,[{id:'d1',contact_id:'c1'}],'996553940000'),{contactId:'c1',dealId:'d1'});
 assert.deepEqual(resolveRecordingLinks(contacts,[{id:'d1',contact_id:'c1'},{id:'d2',contact_id:'c1'}],'996553940000'),{contactId:'c1',dealId:null});
});

import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {lookupRecordingLinks} from './call-recordings.js';
const worker=readFileSync(new URL('./worker.js',import.meta.url),'utf8');
const uploadSource=worker.slice(worker.indexOf('async function handleSipRecordingUpload('),worker.indexOf('async function handleSipRecordingGet('));
const upload=new Function('json','findRecordingCall','recordingToken','lookupRecordingLinks',uploadSource+';return handleSipRecordingUpload;')((x,status)=>Response.json(x,{status}),findRecordingCall,recordingToken,lookupRecordingLinks);
function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE contacts(id TEXT,phones TEXT);CREATE TABLE deals(id TEXT,contact_id TEXT,closed INTEGER);
 CREATE TABLE call_log(id INTEGER PRIMARY KEY,caller_uid TEXT,direction TEXT,phone TEXT,contact_id TEXT,deal_id TEXT,started_at TEXT,ended_at TEXT,duration_sec INTEGER,status TEXT,provider TEXT,recording_url TEXT,recording_r2_key TEXT,note TEXT);`);
 const objects=new Map();
 const env={SIP_ROUTE_SECRET:'secret',FILES:{put:async(k,v)=>objects.set(k,v)},DB:{prepare(sql){return {bind(...args){return {first:async()=>db.prepare(sql).get(...args),all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>db.prepare(sql).run(...args)}}}}}};
 const request=(extra='')=>new Request('https://worker.test/api/sip/recording?secret=secret&phone=996553940000&direction=out&callKey=123.4&duration=60&started=1700000000'+extra,{method:'POST',body:new Uint8Array(500)});
 return {db,env,objects,request};
}
test('upload links outgoing audio to client and existing call; retry has one object and row',async()=>{
 const f=fixture();f.db.exec(`INSERT INTO contacts VALUES('c','[{"value":"+996553940000"}]');INSERT INTO deals VALUES('d','c',0);`);
 f.db.prepare("INSERT INTO call_log(id,caller_uid,direction,phone,started_at) VALUES(1,'manager','out','+996553940000',?)").run(new Date(1700000000000).toISOString());
 assert.equal((await upload(f.request(),f.env)).status,200);
 assert.equal((await upload(f.request(),f.env)).status,200);
 const row=f.db.prepare('SELECT * FROM call_log').get();assert.equal(row.deal_id,'d');assert.equal(row.caller_uid,'manager');assert.equal(row.direction,'out');assert.ok(row.recording_url);
 assert.equal(f.objects.size,1);assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM call_log').get().n,1);
});
test('old unrelated call is not overwritten and insertion works without a CRM call event',async()=>{
 const f=fixture();f.db.exec("INSERT INTO call_log(id,direction,phone,started_at) VALUES(1,'out','996553940000','2020-01-01T00:00:00Z')");
 assert.equal((await upload(f.request(),f.env)).status,200);
 assert.equal(f.db.prepare('SELECT recording_url FROM call_log WHERE id=1').get().recording_url,null);
 assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM call_log').get().n,2);
});
test('invalid upload secret stores nothing',async()=>{
 const f=fixture();const r=new Request('https://worker.test/api/sip/recording?secret=wrong&phone=996553940000',{method:'POST',body:'test'});
 assert.equal((await upload(r,f.env)).status,401);assert.equal(f.objects.size,0);
});
const logSource=worker.slice(worker.indexOf('async function handleCallLog('),worker.indexOf('// ── /api/contact-card-by-phone'));
const callLog=new Function('requireAuthFlexible','json','normalPhone',logSource+';return handleCallLog;')(async()=>({uid:'u'}),(x,status)=>Response.json(x,{status}),normalPhone);
test('deal sees existing orphan audio by exact full phone, excludes another deal and supports recordings pagination',async()=>{
 const f=fixture();f.db.exec(`INSERT INTO contacts VALUES('c','[{"value":"+996553940000"}]');INSERT INTO deals VALUES('d','c',0);
 INSERT INTO call_log(id,direction,phone,started_at,recording_url) VALUES(1,'in','+996 553-940-000','2026-10-14T06:00:00Z','https://worker.test/audio/1');
 INSERT INTO call_log(id,direction,phone,started_at,recording_url,deal_id) VALUES(2,'in','996553940000','2026-10-14T06:00:00Z','https://worker.test/audio/2','another');
 INSERT INTO call_log(id,direction,phone,started_at) VALUES(3,'in','996553940000','2026-10-14T06:00:00Z');`);
 const resp=await callLog(new Request('https://worker.test/api/call/log?dealId=d&recordingsOnly=1'),f.env);
 assert.deepEqual((await resp.json()).items.map(x=>x.id),[1]);
 const page=await callLog(new Request('https://worker.test/api/call/log?recordingsOnly=1&limit=1&offset=1'),f.env);
 assert.deepEqual((await page.json()).items.map(x=>x.id),[1]);
});
const configSource=worker.slice(worker.indexOf('async function handleSipAsteriskConfig('),worker.indexOf('// ════════════════════════════════════════════════════════════════════════\n// ПОЧТА'));
test('every outgoing and incoming route starts recording and uses a quick hangup handler',async()=>{
 const config=new Function('ensureSipTables',configSource+';return handleSipAsteriskConfig;')(async()=>{});
 const env={SIP_ROUTE_SECRET:'test',DB:{prepare(sql){return {all:async()=>({results:sql.includes('sip_lines')?[{id:'l1',number:'77010000000'}]:[]})}}}};
 const response=await config(new Request('https://pllato-elc-worker.uurraa.workers.dev/api/sip/asterisk-config?secret=test&file=extensions'),env);
 assert.equal(response.status,200);const text=await response.text();
 assert.match(text,/hangup_handler_push.*crm-record-finish/);
 assert.match(text,/Gosub\(crm-record-start,s,1\(\$\{EXTEN\},out\)\)/);
 assert.match(text,/Gosub\(crm-record-start,s,1\(\$\{CRM_PHONE\},in\)\)/);
 assert.match(text,/StopMixMonitor\(\)/);assert.match(text,/pllato-recording-queue/);
 assert.ok(!text.includes('curl -fsS'));
});
test('concurrent distinct recordings never acknowledge an unreferenced object',async()=>{
 const f=fixture();f.db.prepare("INSERT INTO call_log(id,caller_uid,direction,phone,started_at) VALUES(1,'u','out','996553940000',?)").run(new Date(1700000000000).toISOString());
 const prepare=f.env.DB.prepare;let arrivals=0,release;const gate=new Promise(resolve=>release=resolve);
 f.env.DB.prepare=sql=>{const stmt=prepare(sql);return {bind(...args){const bound=stmt.bind(...args);if(sql.startsWith('SELECT * FROM call_log WHERE direction=')){const all=bound.all;bound.all=async()=>{const data=await all();if(++arrivals===2)release();await gate;return data;};}return bound;}};};
 const a=f.request(),b=new Request(f.request().url.replace('callKey=123.4','callKey=123.5'),{method:'POST',body:new Uint8Array(500)});
 const responses=await Promise.all([upload(a,f.env),upload(b,f.env)]);
 assert.deepEqual(responses.map(r=>r.status),[200,200]);assert.equal(f.objects.size,2);
 assert.equal(f.db.prepare('SELECT COUNT(DISTINCT recording_r2_key) AS n FROM call_log').get().n,2);
});
