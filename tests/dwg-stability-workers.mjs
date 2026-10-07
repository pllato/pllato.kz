// Optional private fixture: node tests/dwg-stability-workers.mjs input.dwg output-directory
// Exercises production reader/writer workers, not a replacement exporter.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {nativeTransferReceiver} from '../app/stroy/dwg/native-transfer.mjs';
import {createExecutiveProject,createExecutive,rotateExecutive} from '../app/stroy/dwg/executive-project.mjs';
const [input,directory]=process.argv.slice(2);
fs.mkdirSync(directory,{recursive:true});
const source=fs.readFileSync(input),hash=b=>createHash('sha256').update(b).digest('hex');
const sourceHash=hash(source),bytes=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
const listeners=new Set();let receiver,resolveResult,rejectResult;
globalThis.self={addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),postMessage:message=>{
 if(message.error)return rejectResult(Error(message.error));if(message.progress){if(process.env.DWG_STABILITY_PROGRESS)console.error(new Date().toISOString(),message.progress);return;}
 try{const result=receiver(message);if(result)resolveResult(result);}catch(e){rejectResult(e);}
}};
async function run(module,data){
 receiver=nativeTransferReceiver({postMessage:message=>queueMicrotask(()=>{for(const fn of listeners)fn({data:message});})});
 const result=new Promise((resolve,reject)=>{resolveResult=resolve;rejectResult=reject;});
 await import(new URL('../app/stroy/dwg/'+module+'?stability='+Math.random(),import.meta.url));
 const timer=setTimeout(()=>rejectResult(Error(module+' timed out')),180000);
 try{self.onmessage({data}).catch(rejectResult);return await result;}finally{clearTimeout(timer);}
}
const read=buffer=>run('native-reader.mjs',{buffer,compact:true});
const write=data=>run('executive-worker.mjs',{ops:[],added:[],...data});
const initial=await read(bytes(source));
assert.ok(!initial.doc.executiveProject?.sheets.length,'Use an original fixture without existing executives');
const sourceRoots=new Set(initial.doc.exportRootHandles);
// Root LINE avoids selecting attached attributes or paper-space entities.
// Adapter records are DXF group-code arrays; pick the handle via the public document records.
const {get}=await import('../app/stroy/dwg/cad.mjs');
const candidates=initial.doc.records.filter(r=>get(r,0)==='LINE'&&sourceRoots.has(get(r,5)));
assert.ok(candidates.length,'Fixture needs a root LINE');
const handles=candidates.slice(0,3).map(r=>get(r,5));
let current=bytes(source),project=createExecutiveProject();
for(let i=0;i<2;i++){
 const id='stability-'+i,position=[100000+i*10000,200000];
 createExecutive(project,{id,title:'Проверка '+i,origin:position,planCentre:position,metresPerUnit:.001});
 const requestProject=structuredClone(project),requestBytes=hash(new Uint8Array(current));
 const saved=await write({buffer:current,project,cloneRequest:{sheetId:id,handles:i?handles:[handles[0]],centre:[0,0],position}});
 assert.deepEqual(project,requestProject,'Worker mutated request metadata');
 assert.equal(hash(new Uint8Array(current)),requestBytes,'Worker mutated input bytes');
 project=saved.project;current=saved.buffer;
}
for(let cycle=0;cycle<3;cycle++){
 rotateExecutive(project,'stability-0',cycle*Math.PI/2);
 const packet={buffer:current,project,separateFull:true};
 const first=await write(packet),second=await write(packet);
 assert.deepEqual(first.project,second.project,'Repeated download changed metadata');
 const a=await read(first.buffer),b=await read(second.buffer);
 assert.deepEqual(a.doc.exportRootHandles,b.doc.exportRootHandles,'Repeated download changed root composition');
 assert.equal(a.doc.executiveProject.sheets.length,2);
 const actual=new Set(a.doc.exportRootHandles),expected=new Set([...sourceRoots,...first.project.generatedHandles,...first.project.sheets.flatMap(s=>s.nativeHandles)]);
 assert.deepEqual(actual,expected,'Full DWG lost original roots or gained orphan roots');
 const recordIndex=new Map(a.doc.records.map(r=>[get(r,5),r]));
 for(const original of candidates){
  const record=recordIndex.get(get(original,5));assert.ok(record);
  for(const code of [0,10,20,30,11,21,31,62,8])assert.equal(get(record,code),get(original,code),'Original LINE changed: '+code);
 }
 for(const sheet of first.project.sheets){assert.ok(sheet.nativeSeparated);assert.ok(sheet.nativeHandles.length>=1);for(const h of sheet.nativeHandles)assert.ok(actual.has(h));}
 const output=path.join(directory,'cycle-'+cycle+'.dwg');fs.writeFileSync(output,new Uint8Array(first.buffer),{flag:'wx'});
 // Reopen downloaded DWG, edit one independent copied LINE, regroup and export again.
 const editedHandle=first.project.sheets[0].nativeHandles[0];
 const beforeEdit=a.doc.records.find(r=>get(r,5)===editedHandle);assert.equal(get(beforeEdit,0),'LINE');
 const grouped=await write({buffer:first.buffer,project:a.doc.executiveProject,ops:[{handle:editedHandle,dx:1,dy:2,color:3}]});
 const reopened=await read(grouped.buffer);
 const edited=reopened.doc.records.find(r=>get(r,5)===editedHandle);
 assert.ok(edited,'Edited independent object disappeared');assert.equal(Number(get(edited,62)),3);
 for(const code of [10,11])assert.ok(Math.abs(Number(get(edited,code))-Number(get(beforeEdit,code))-1)<1e-7,'LINE X edit lost');
 for(const code of [20,21])assert.ok(Math.abs(Number(get(edited,code))-Number(get(beforeEdit,code))-2)<1e-7,'LINE Y edit lost');
 assert.ok(grouped.project.sheets.every(s=>!s.nativeSeparated&&s.nativeHandles.length===1));
 project=grouped.project;current=grouped.buffer;
 console.log('PASS cycle',cycle+1,': two sheets, one-object sheet, repeated full download, roots, reopen, edit, regroup');
}
await assert.rejects(write({buffer:bytes(source),project:createExecutiveProject(),ops:[{handle:'not-a-handle',dx:0,dy:0}]}),/Неверное изменение/);
await assert.rejects(write({buffer:bytes(source),project:createExecutiveProject(),ops:[{handle:handles[0],dx:NaN,dy:0}]}),/Неверное изменение/);
const old=bytes(source);new Uint8Array(old).set(new TextEncoder().encode('AC1021'));
await assert.rejects(write({buffer:old,project:createExecutiveProject()}),/DWG 2018/);
assert.equal(hash(fs.readFileSync(input)),sourceHash,'Original file changed');
console.log('PASS rejected malformed edits and old version; original SHA256 unchanged');
