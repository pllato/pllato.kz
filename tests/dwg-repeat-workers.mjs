// Optional private fixture: repeated production worker creation and full DWG
// export/read, separate sheets, exact root inventory and unchanged source hash.
import fs from 'node:fs';import {Worker} from 'node:worker_threads';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {nativeTransferReceiver} from '../app/stroy/dwg/native-transfer.mjs';
import {sceneAsync,get} from '../app/stroy/dwg/cad.mjs';
import {reusableScene,mergeReusedScene} from '../app/stroy/dwg/scene-reuse.mjs';
import {createExecutiveProject,createExecutive} from '../app/stroy/dwg/executive-project.mjs';
import {executivePlacement} from '../app/stroy/dwg/executive-placement.mjs';
const sourcePath=process.argv[2],dir=process.argv[3],dimensionHandle=process.argv[4],extraHandles=(process.argv[5]||'').split(',').filter(Boolean),cycles=Number(process.argv[6]||30);if(!sourcePath||!dir||!dimensionHandle)throw Error('Usage: node --expose-gc tests/dwg-large-workers.mjs private-input.dwg private-output-directory dimension-handle extra-root-handles cycles');fs.mkdirSync(dir,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),originalHash=hash(fs.readFileSync(sourcePath));
const mb=()=>Object.fromEntries(Object.entries(process.memoryUsage()).map(([k,v])=>[k,Math.round(v/1048576)]));
async function run(module,data,previous=null){const worker=new Worker(new URL('./dwg-worker-host.mjs',import.meta.url),{workerData:{module:new URL('../app/stroy/dwg/'+module,import.meta.url).href}});const receiver=nativeTransferReceiver(worker,()=>{},previous);return new Promise((resolve,reject)=>{worker.on('error',reject);worker.on('message',async m=>{try{if(m.ready)return worker.postMessage(data,[data.buffer]);if(m.progress){if(process.env.DWG_LARGE_PROGRESS)console.log(module,m.progress,mb());return;}if(m.error)throw Error(m.error);const r=receiver(m);if(r){await worker.terminate();resolve(r);}}catch(e){await worker.terminate();reject(e);}});});}
const source=fs.readFileSync(sourcePath);let current=source.buffer.slice(source.byteOffset,source.byteOffset+source.byteLength);
let {doc}=await run('native-reader.mjs',{buffer:current,compact:true});assert.ok(!doc.executiveProject?.sheets.length,'Use an original without executive metadata');const originalRoots=new Set(doc.exportRootHandles);let drawing=await sceneAsync(doc);globalThis.gc?.();console.log('INITIAL',doc.records.length,drawing.shapes.length,mb());
const roots=new Map(doc.entities.map(r=>[r.id,r])),counts=new Map();for(const s of drawing.shapes)counts.set(s.id,(counts.get(s.id)||0)+1);
const candidates=[...counts].filter(([id])=>roots.get(id)?.type==='INSERT').sort((a,b)=>b[1]-a[1]);console.log('Largest display root',candidates[0]?.[1]||0,'primitives');
const chosen=candidates.slice(0,3).map(([id])=>id).concat(doc.entities.filter(r=>r.type==='LINE').slice(0,500).map(r=>r.id));const dimension=doc.entities.find(r=>get(r,5)===dimensionHandle.toUpperCase());assert.ok(dimension,'Dimension linked to the reported DIMASSOC must be included');chosen.push(dimension.id);for(const handle of extraHandles){const extra=doc.entities.find(r=>get(r,5)===handle.toUpperCase());assert.ok(extra,'Requested regression root must exist');chosen.push(extra.id);}assert.ok(chosen.length);const handles=chosen.map(id=>get(roots.get(id),5)),{origin,centre,position,unit}=executivePlacement(drawing.shapes,chosen);
current=source.buffer.slice(source.byteOffset,source.byteOffset+source.byteLength);
let project=createExecutiveProject();
for(let cycle=1;cycle<=cycles;cycle++){
 const sheetId='dimassoc-'+cycle;createExecutive(project,{id:sheetId,title:'Repeated check '+cycle,origin:[origin[0]+cycle*100000,origin[1]],planCentre:[position[0]+cycle*100000,position[1]],metresPerUnit:.001,paperUnit:unit});
 const input=current.slice(0);
 const saved=await run('executive-worker.mjs',{buffer:input,ops:[],added:[],project,cloneRequest:{sheetId,handles,centre,position:[position[0]+cycle*100000,position[1]]}});
 fs.writeFileSync(dir+'/cycle-'+cycle+'.dwg',new Uint8Array(saved.buffer));
 const reopened=await run('native-reader.mjs',{buffer:saved.buffer,compact:true,returnBuffer:true},doc);
 assert.equal(reopened.doc.executiveProject.sheets.length,cycle);
 project=reopened.doc.executiveProject;current=reopened.buffer;doc=reopened.doc;
 assert.equal(hash(fs.readFileSync(sourcePath)),originalHash);
 console.log('PASS consecutive creation/save/read',cycle,doc.records.length,mb());
}
const final=await run('executive-worker.mjs',{buffer:current,ops:[],added:[],project,separateFull:true});
fs.writeFileSync(dir+'/whole.dwg',new Uint8Array(final.buffer));
const checked=await run('native-reader.mjs',{buffer:final.buffer,compact:true});assert.equal(checked.doc.executiveProject.sheets.length,cycles);assert.ok(checked.doc.executiveProject.sheets.every(s=>s.nativeSeparated));const expectedRoots=new Set([...originalRoots,...final.project.generatedHandles,...final.project.sheets.flatMap(s=>s.nativeHandles)]);assert.deepEqual(new Set(checked.doc.exportRootHandles),expectedRoots,'Full DWG root inventory changed');
console.log('PASS whole DWG export/reopen,',cycles,'separate sheets, exact root inventory, unchanged source');
