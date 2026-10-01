// SPDX-License-Identifier: GPL-3.0-or-later
import {fromRecords} from './cad.mjs?v=0.17.58';

// Millions of tiny DXF pair arrays are expensive to structured-clone. Only
// their lossless [integer, string] payload uses JSON; all other CAD properties
// (including undefined, typed arrays and hatch/leader data) retain native clone.
export function packRecords(records){
 const headers=[],pairs=[];
 for(const record of records){const {pairs:values,...header}=record;headers.push(header);pairs.push(values);}
 return {headers,pairs:JSON.stringify(pairs)};
}
export function unpackRecords(chunk){
 const pairs=JSON.parse(chunk.pairs);
 if(pairs.length!==chunk.headers.length)throw Error('Неполная передача DWG');
 return chunk.headers.map((header,i)=>{
  // Keep the same stable object layout as native-adapter. A spread followed
  // by `pairs` makes property access costly across millions of scene visits.
  const record={type:header.type,id:header.id,pairs:pairs[i]};
  for(const key of Object.keys(header))if(key!=='type'&&key!=='id')record[key]=header[key];
  return record;
 });
}
export function equalNativeRecord(a,b){
 if(Object.is(a,b))return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 if(Array.isArray(a)){if(!Array.isArray(b)||a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(!equalNativeRecord(a[i],b[i]))return false;return true;}
 if(ArrayBuffer.isView(a)){if(a.constructor!==b.constructor||a.byteLength!==b.byteLength)return false;const x=new Uint8Array(a.buffer,a.byteOffset,a.byteLength),y=new Uint8Array(b.buffer,b.byteOffset,b.byteLength);for(let i=0;i<x.length;i++)if(x[i]!==y[i])return false;return true;}
 const keys=Object.keys(a);
 return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&equalNativeRecord(a[k],b[k]));
}
export function nativeTransferReceiver(worker,progress=()=>{},previous=null){
 const records=[];let sequence=0;
 const reusable=previous?new Map(previous.records.map(r=>[r.id,r])):null;
 return message=>{
  if(message.nativeChunk!==undefined){
   if(message.nativeChunk!==sequence++)throw Error('Нарушен порядок передачи DWG');
   for(const record of unpackRecords(message)){const old=reusable?.get(record.id);records.push(old&&equalNativeRecord(old,record)?old:record);}
   progress('Передаю чертёж: '+records.length.toLocaleString('ru')+' объектов',90+4*records.length/Math.max(1,message.total));
   worker.postMessage({nativeAck:message.nativeChunk});
   return null;
  }
  if(message.nativeComplete){
   if(records.length!==message.total)throw Error('Неполная передача DWG');
   return {doc:Object.assign(fromRecords(records),message.metadata),messages:message.messages};
  }
  return message;
 };
}
export async function sendNativeDocument(doc,messages,port){
 const {records,entities,blocks,layers,textStyles,...metadata}=doc;
 // Consumes a disposable reader result, never the editor's active document.
 // The compact reader deliberately has no duplicate entity/block indexes.
 const size=2048,total=records.length;
 for(let start=0,sequence=0;start<total;start+=size,sequence++){
  const ack=new Promise(resolve=>{const listener=event=>{if(event.data?.nativeAck===sequence){port.removeEventListener('message',listener);resolve();}};port.addEventListener('message',listener);});
  port.postMessage({nativeChunk:sequence,total,...packRecords(records.slice(start,start+size))});
  // Bounded queue: do not retain an entire second drawing in pending messages.
  await ack;
  records.fill(null,start,Math.min(total,start+size));
 }
 port.postMessage({nativeComplete:true,total,metadata,messages});
}
