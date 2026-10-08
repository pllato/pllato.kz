import test from 'node:test';
import assert from 'node:assert/strict';
import {fromRecords,scene} from '../app/stroy/dwg/cad.mjs';
import {packRecords,unpackRecords,nativeTransferReceiver,sendNativeDocument} from '../app/stroy/dwg/native-transfer.mjs';
test('compact native pairs preserve exact strings, additional CAD data and identity indexes',()=>{
 const records=[{type:'SECTION',id:'s',pairs:[[2,'ENTITIES']]},{type:'LINE',id:'a',pairs:[[0,'LINE'],[10,'-0'],[20,'2'],[11,'3.141592653589793'],[21,'4'],[1,'Привет\n\\P\u0000']],extra:undefined,parts:[{value:NaN}],bytes:new Uint8Array([7])},{type:'ENDSEC',id:'e',pairs:[]}];
 const copy=unpackRecords(structuredClone(packRecords(records)));assert.deepEqual(copy,records);
 const sent=[],receive=nativeTransferReceiver({postMessage:m=>sent.push(m)});
 assert.equal(receive({nativeChunk:0,total:3,...packRecords(records)}),null);
 const {doc}=receive({nativeComplete:true,total:3,metadata:{native:true,nativeOps:[]},messages:[]});
 assert.equal(doc.entities[0],doc.records[1]);assert.deepEqual(scene(doc),scene(fromRecords(records)));assert.deepEqual(sent,[{nativeAck:0}]);
});
test('native transfer rejects missing and out-of-order chunks',()=>{
 const receive=nativeTransferReceiver({postMessage(){}});
 assert.throws(()=>receive({nativeChunk:1,...packRecords([])}),/порядок/);
 assert.throws(()=>nativeTransferReceiver({})({nativeComplete:true,total:1}),/Неполная/);
});
test('unchanged records share memory, changed native fields do not',()=>{
 const records=[{type:'SECTION',id:'s',pairs:[[2,'ENTITIES']]},{type:'LINE',id:'a',pairs:[[10,'1']],dimensionEndLocked:true},{type:'ENDSEC',id:'e',pairs:[]}];
 const previous=fromRecords(records),next=structuredClone(records);
 const receive=nativeTransferReceiver({postMessage(){}},()=>{},previous);
 receive({nativeChunk:0,total:3,...packRecords(next)});
 const result=receive({nativeComplete:true,total:3,metadata:{},messages:[]});assert.equal(result.doc.records[1],records[1]);
 next[1].dimensionEndLocked=false;
 const changed=nativeTransferReceiver({postMessage(){}},()=>{},previous);
 changed({nativeChunk:0,total:3,...packRecords(next)});
 assert.notEqual(changed({nativeComplete:true,total:3,metadata:{},messages:[]}).doc.records[1],records[1]);
 assert.equal(records[1].dimensionEndLocked,true);
});
test('native sender bounds the queue and releases acknowledged records',async()=>{
 const records=Array.from({length:5000},(_,i)=>({type:'LINE',id:String(i),pairs:[[10,String(i)]]}));
 records.unshift({type:'SECTION',id:'s',pairs:[[2,'ENTITIES']]});records.push({type:'ENDSEC',id:'e',pairs:[]});
 const listeners=new Set();let pending=0,chunks=0,result;
 const receiver=nativeTransferReceiver({postMessage:message=>setTimeout(()=>{pending--;for(const listener of [...listeners])listener({data:message});},0)});
 const port={addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),postMessage(message){if(message.nativeChunk!==undefined){chunks++;assert.equal(++pending,1);}const value=receiver(structuredClone(message));if(value)result=value;}};
 await sendNativeDocument({records,native:true},[],port);
 assert.equal(chunks,3);assert.equal(result.doc.entities.length,5000);assert.ok(records.every(r=>r===null));assert.equal(listeners.size,0);
});
test('source buffer returns separately after all record acknowledgements',async()=>{
 const buffer=new Uint8Array([65,67,49,48,51,50]).buffer,listeners=new Set();let result,returned;
 const receiver=nativeTransferReceiver({postMessage:m=>queueMicrotask(()=>{for(const f of [...listeners])f({data:m});})});
 const port={addEventListener:(_,f)=>listeners.add(f),removeEventListener:(_,f)=>listeners.delete(f),postMessage(m,transfer=[]){if(m.nativeComplete){assert.equal(transfer[0],buffer);returned=m.buffer;}const r=receiver(m);if(r)result=r;}};
 await sendNativeDocument({records:[{type:'SECTION',id:'s',pairs:[[2,'ENTITIES']]},{type:'ENDSEC',id:'e',pairs:[]}],native:true},[],port,buffer);
 assert.equal(returned,buffer);assert.equal(result.buffer,buffer);assert.equal(result.doc.buffer,undefined);
});
