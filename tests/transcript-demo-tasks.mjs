import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {transcriptDemoTasks} from '../elc-worker/transcript-demo-tasks.js';
const db=new DatabaseSync(':memory:');db.exec(`CREATE TABLE deals(id TEXT,title TEXT,pipeline_id TEXT,mirrored_in TEXT);CREATE TABLE pipelines(id TEXT,name TEXT);CREATE TABLE zoom_files(id TEXT,deal_id TEXT,topic TEXT,recording_start TEXT,imported_at TEXT,status TEXT,deleted_at TEXT,kind TEXT,extension TEXT);CREATE TABLE zoom_private(k TEXT,v TEXT);CREATE TABLE deal_qual_recordings(id TEXT,deal_id TEXT,name TEXT,uploaded_at TEXT,kind TEXT);INSERT INTO pipelines VALUES('p','Pllato Старт'),('e','ELC');INSERT INTO deals VALUES('visible','Client','p','{}'),('hidden','Hidden','p','{}'),('elc','School','e','{}');INSERT INTO zoom_files VALUES('z1','visible','Demo','2026-10-20','2026-10-20','stored',NULL,'audio_transcript','VTT'),('z2','hidden','Private','2026-10-20','2026-10-20','stored',NULL,'audio_transcript','VTT'),('z3','elc','School','2026-10-20','2026-10-20','stored',NULL,'audio_transcript','VTT'),('z4','visible','Pending','2026-10-20','2026-10-20','pending',NULL,'audio_transcript','VTT');INSERT INTO deal_qual_recordings VALUES('m1','visible','Manual','2026-10-20','transcript');INSERT INTO zoom_private VALUES('duration:z1','1800');`);
db.exec(`ALTER TABLE zoom_files ADD COLUMN meeting_uuid TEXT;UPDATE zoom_files SET meeting_uuid='meeting-1';`);
const env={DB:{prepare(sql){return {bind(...v){this.v=v;return this},async run(){return db.prepare(sql).run(...this.v||[])},async all(){return {results:db.prepare(sql).all(...this.v||[])}},async first(){return db.prepare(sql).get(...this.v||[])}}}}};
const deps={me:{userRecord:{active:1},canonicalUid:'u'},dealAccessSql:()=>({where:' AND id=?',params:['visible']}),canEditRecord:async()=>true};const call=(body,d=deps)=>transcriptDemoTasks(new Request('https://test/api/zoom/demo-tasks',body?{method:'PUT',body:JSON.stringify(body)}:{}),env,d);
let j=await(await call()).json();assert.equal(j.items.length,2);assert.equal(j.items.find(t=>t.id==='zoom:z1').duration_seconds,'1800');
assert.equal((await call({id:'zoom:z2',done:true,projectId:''})).status,403);
assert.equal((await call({id:'zoom:z1',done:true,projectId:'demo-client'})).status,200);await call({id:'zoom:z1',done:true,projectId:'demo-client'});
j=await(await call()).json();assert.equal(j.items.length,2);assert.equal(j.items.find(t=>t.id==='zoom:z1').done,1);assert.equal(j.items.find(t=>t.id==='zoom:z1').project_id,'demo-client');
assert.equal(db.prepare('SELECT COUNT(*) n FROM transcript_demo_state').get().n,1);
assert.equal((await call({id:'manual:m1',done:true,projectId:''},{...deps,canEditRecord:async()=>false})).status,403);
assert.equal((await call(undefined,{...deps,me:{userRecord:{active:0}}})).status,403);
console.log('PASS: ready/manual sources, Pllato-only scope, ACL, stable identities, completion and project links');

db.exec(`INSERT INTO zoom_files(id,deal_id,topic,recording_start,imported_at,status,kind,extension,meeting_uuid) VALUES
 ('z1-copy','visible','Demo','2026-10-20','2026-10-20','stored','audio_transcript','TXT','meeting-1'),
 ('z1-chat','visible','Demo','2026-10-20','2026-10-20','stored','chat_file','TXT','meeting-1'),
 ('z-only-chat','visible','Chat only','2026-10-21','2026-10-21','stored','chat_file','TXT','chat-meeting'),
 ('z-repeat','visible','Another meeting','2026-10-20','2026-10-20','stored','audio_transcript','VTT','meeting-2'),
 ('z-part','visible','Next segment','2026-10-20T10:30:00Z','2026-10-20','stored','audio_transcript','VTT','meeting-1');`);
j=await(await call()).json();assert.equal(j.items.length,4);assert.equal(j.items.filter(t=>t.title==='Demo').length,1);assert.equal(j.items.find(t=>t.title==='Demo').done,1);assert.equal(j.items.find(t=>t.title==='Demo').project_id,'demo-client');
await call({id:'zoom:z1-copy',done:false,projectId:'demo-client'});j=await(await call()).json();assert.equal(j.items.find(t=>t.title==='Demo').done,0);
await call({id:'zoom:z1-chat',done:true,projectId:'demo-client'});j=await(await call()).json();assert.equal(j.items.find(t=>t.title==='Demo').done,1);assert.equal(j.items.find(t=>t.title==='Demo').file_path,'/api/zoom/files/z1');
console.log('PASS: duplicate formats grouped, chats excluded, repeat meetings/segments retained, saved state preserved and reversible');
