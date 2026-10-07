// Run independently of browser UI: node tests/dwg-separated-workers.mjs private-input.dwg private-output.dwg
import fs from 'node:fs';
import {nativeTransferReceiver} from '../app/stroy/dwg/native-transfer.mjs';
const listeners=new Set();let resolveResult,rejectResult,receiver;
globalThis.self={addEventListener:(type,fn)=>listeners.add(fn),removeEventListener:(type,fn)=>listeners.delete(fn),postMessage:message=>{if(message.error){rejectResult(Error(message.error));return;}if(message.progress)return;try{const result=receiver(message);if(result)resolveResult(result);}catch(e){rejectResult(e);}}};
async function run(module,data){
 receiver=nativeTransferReceiver({postMessage:message=>queueMicrotask(()=>{for(const fn of listeners)fn({data:message});})});
 const result=new Promise((res,rej)=>{resolveResult=res;rejectResult=rej;});await import(new URL(module+'?test='+Math.random(),import.meta.url));self.onmessage({data}).catch(rejectResult);return result;
}
const bytes=path=>{const b=fs.readFileSync(path);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);};
const [input,output]=process.argv.slice(2);
const read=await run('../app/stroy/dwg/native-reader.mjs',{buffer:bytes(input),compact:true});
const original=structuredClone(read.doc.executiveProject);if(!original?.sheets.length)throw Error('No sheets');
const saved=await run('../app/stroy/dwg/executive-worker.mjs',{buffer:bytes(input),project:original,ops:[],added:[],separateFull:true});
fs.writeFileSync(output,new Uint8Array(saved.buffer),{flag:'wx'});fs.writeFileSync(output+'.project.json',JSON.stringify(saved.project,null,2));
if(!saved.project.sheets.every(s=>s.nativeSeparated&&s.nativeHandles.length>=1))throw Error('Not separated');
const reopened=await run('../app/stroy/dwg/native-reader.mjs',{buffer:bytes(output),compact:true});
const roots=new Set(reopened.doc.exportRootHandles);for(const s of reopened.doc.executiveProject.sheets)for(const h of s.nativeHandles)if(!roots.has(h))throw Error('Non-root sheet member '+h);
const grouped=await run('../app/stroy/dwg/executive-worker.mjs',{buffer:bytes(output),project:reopened.doc.executiveProject,ops:[],added:[]});
if(!grouped.project.sheets.every(s=>!s.nativeSeparated&&s.nativeHandles.length===1))throw Error('Not prepared for browser editing');
const exportedAgain=await run('../app/stroy/dwg/executive-worker.mjs',{buffer:grouped.buffer,project:grouped.project,ops:[],added:[],separateFull:true});
fs.writeFileSync(output+'.reexport.dwg',new Uint8Array(exportedAgain.buffer),{flag:'wx'});
console.log('PASS real reader/writer workers: separated output, metadata roots, import identity wrapper, separated re-export',saved.project.sheets.map(s=>s.nativeHandles.length));
