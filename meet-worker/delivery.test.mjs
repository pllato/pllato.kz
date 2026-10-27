import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {beginDelivery,acceptAudio,finishDelivery,processDelivery} from './delivery.js';
import {pcmWav} from '../meet-audio.js';
import {RecordingUpload} from '../meet-recording.js';
function fixture(){
 const sql=new DatabaseSync(':memory:');
 sql.exec(`CREATE TABLE zoom_files(id TEXT PRIMARY KEY,meeting_uuid TEXT,meeting_id TEXT,deal_id TEXT,topic TEXT,recording_start TEXT,kind TEXT,extension TEXT,size INTEGER,status TEXT,r2_key TEXT,error TEXT,imported_at TEXT,deleted_at TEXT);`);
 sql.exec(readFileSync(new URL('./migrations/0001-delivery.sql',import.meta.url),'utf8'));
 const DB={prepare(q){return {bind(...args){this.args=args;return this;},async run(){const r=sql.prepare(q).run(...this.args||[]);return {meta:{changes:Number(r.changes)}};},async first(){return sql.prepare(q).get(...this.args||[])||null;},async all(){return {results:sql.prepare(q).all(...this.args||[])}}};},async batch(queries){return Promise.all(queries.map(q=>q.run()));}};
 const objects=new Map();let calls=0;
 return {sql,objects,get calls(){return calls},CRM_DB:DB,CRM_FILES:{async put(k,v){objects.set(k,v)},async get(k){const v=objects.get(k);return v===undefined?null:{arrayBuffer:async()=>v}}},AI:{async run(){calls++;return {text:'Проверка записи встречи.'}}}};
}
const meeting={meeting_id:'crm-test',deal_id:'deal-test',topic:'Test'},id='crm-test-1793098033927';
test('durable queue deduplicates audio and publishes only after all fragments finish',async()=>{
 const env=fixture();await beginDelivery(env,meeting,id);
 const wav=pcmWav(new Int16Array(16000));
 const send=()=>acceptAudio(env,meeting,id,0,new Request('https://test',{method:'PUT',body:wav}));
 await send();await send();assert.equal(env.sql.prepare('SELECT COUNT(*) n FROM meet_audio_jobs').get().n,1);
 await processDelivery(env);assert.equal(env.calls,1);
 assert.equal(env.sql.prepare("SELECT status FROM zoom_files WHERE kind='transcript'").get().status,'processing');
 await finishDelivery(env,id,1);await processDelivery(env);await processDelivery(env);
 assert.equal(env.calls,1);assert.equal(env.sql.prepare("SELECT status FROM zoom_files WHERE kind='transcript'").get().status,'stored');
 assert.match(env.objects.get(`crm-meet/${id}/transcript.txt`),/Проверка записи/);
});
test('AI failure retries durably and reports failure after a bounded number of attempts',async()=>{
 const env=fixture();await acceptAudio(env,meeting,id,0,new Request('https://test',{method:'PUT',body:pcmWav(new Int16Array(10))}));await finishDelivery(env,id,1);
 let calls=0;env.AI.run=async()=>{calls++;throw Error('Unavailable');};
 for(let i=0;i<7;i++){env.sql.exec('UPDATE meet_audio_jobs SET retry_at=0');await processDelivery(env);}
 assert.equal(calls,6);assert.equal(env.sql.prepare("SELECT status FROM zoom_files WHERE kind='transcript'").get().status,'failed');
});
test('missing final fragment cannot become a complete transcript',async()=>{
 const env=fixture();await acceptAudio(env,meeting,id,0,new Request('https://test',{method:'PUT',body:pcmWav(new Int16Array(10))}));await finishDelivery(env,id,2);await processDelivery(env);
 assert.equal(env.sql.prepare("SELECT status FROM zoom_files WHERE kind='transcript'").get().status,'processing');
});
test('no speech is explicit, not fabricated speech',async()=>{
 const env=fixture();env.AI.run=async()=>({text:''});await acceptAudio(env,meeting,id,0,new Request('https://test',{method:'PUT',body:pcmWav(new Int16Array(10))}));await finishDelivery(env,id,1);await processDelivery(env);
 assert.match(env.objects.get(`crm-meet/${id}/transcript.txt`),/речь не обнаружена/);
});
test('local audio is retained until both audio and metadata are acknowledged',async()=>{
 const parts=[];let removed=false,fail=true;
 const store={async meta(){},async append(){},async audio(id,seq,blob){parts.push({seq,blob})},async audios(){return parts},async remove(){removed=true}};
 const upload=new RecordingUpload('',{id,owner:'crm',mime:'video/mp4'},()=>'',store);
 upload.completed=true;upload.request=async path=>{if(path.includes('/audio/')&&fail)throw Error('offline');return {ok:true}};
 upload.appendAudio(pcmWav(new Int16Array(10)));
 await assert.rejects(upload.finish(upload.meta));assert.equal(removed,false);
 fail=false;await upload.finish(upload.meta);assert.equal(removed,true);
});

test('audio worklet emits full minutes and flushes the final fraction without loss',async()=>{
 const {runInNewContext}=await import('node:vm');let Processor;const messages=[];
 class Base{constructor(){this.port={postMessage:m=>messages.push(m)}}}
 runInNewContext(readFileSync(new URL('../meet-audio-worklet.js',import.meta.url),'utf8'),{AudioWorkletProcessor:Base,sampleRate:48000,registerProcessor:(name,Class)=>Processor=Class});
 const processor=new Processor(),input=new Float32Array(128).fill(.2),blocks=22510;
 for(let i=0;i<blocks;i++)processor.process([[input]]);
 processor.port.onmessage({data:'stop'});
 const segments=messages.filter(m=>m.samples);
 assert.equal(segments[0].samples.length,960000);assert.equal(segments.reduce((n,m)=>n+m.samples.length,0),Math.floor(blocks*128/3));assert.equal(messages.at(-1).stopped,true);
});
