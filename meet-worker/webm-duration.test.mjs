import {test} from 'node:test';
import assert from 'node:assert/strict';
import {finalizeWebmHeader} from '../meet-webm.js';
import {RecordingUpload} from '../meet-recording.js';
const head=Uint8Array.from([0x1a,0x45,0xdf,0xa3,0x80,0x18,0x53,0x80,0x67,0xff,0x15,0x49,0xa9,0x66,0x87,0x2a,0xd7,0xb1,0x83,0x0f,0x42,0x40]);
test('finalization adds finite duration and preserves media bytes',async()=>{
 const original=new Blob([head,Uint8Array.from([31,67,182,117,1,2,3])],{type:'video/webm'});
 const fixed=await finalizeWebmHeader(original,63004),bytes=new Uint8Array(await fixed.arrayBuffer());
 const marker=bytes.findIndex((v,i)=>v===0x44&&bytes[i+1]===0x89);
 assert.equal(new DataView(bytes.buffer).getFloat64(marker+3),63004);
 assert.deepEqual(bytes.slice(-7),new Uint8Array(await original.slice(-7).arrayBuffer()));
 assert.equal((await finalizeWebmHeader(fixed,63004)).size,fixed.size);
});
test('multipart complete uses the corrected first-part etag',async()=>{
 const meta={id:'record',owner:'crm',mime:'video/webm',durationSec:63};
 const upload=new RecordingUpload('',meta,()=>null,{async meta(){},async append(){},async remove(){},async audios(){return []}});
 const calls=[];upload.request=async(path,options)=>{calls.push({path,body:options.body});if(path.includes('rec-init'))return {uploadId:'u'};if(path.includes('rec-part'))return {partNumber:Number(path.split('/').pop()),etag:'etag-'+calls.length};return {ok:true,size:123};};
 await upload.append(new Blob([head,new Uint8Array(5*1024*1024)]),meta);await upload.finish(meta);
 const writes=calls.filter(c=>c.path.endsWith('/1'));assert.equal(writes.length,2);assert.equal(writes[1].body.size,writes[0].body.size);
 const complete=JSON.parse(calls.find(c=>c.path.includes('rec-complete')).body);assert.equal(complete[0].etag,upload.parts[0].etag);
});
