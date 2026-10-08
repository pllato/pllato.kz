import test from 'node:test';import assert from 'node:assert/strict';
import {compactRecord,pairsOf} from '../app/stroy/dwg/compact-record.mjs';
import {get,set,fromRecords,scene,cloneDoc,serializeChunks,move} from '../app/stroy/dwg/cad.mjs';
import {packRecords,unpackRecords,equalNativeRecord,nativeTransferReceiver} from '../app/stroy/dwg/native-transfer.mjs';
import {captureView,restoreView} from '../app/stroy/dwg/view-history.mjs';
const line=()=>compactRecord('LINE','dwg-A',JSON.stringify([[0,'LINE'],[5,'A'],[10,'1'],[20,'2'],[11,'3'],[21,'4'],[1,'\n\u0000\\PПривет']]));
const document=r=>fromRecords([{type:'SECTION',id:'s',pairs:[[2,'ENTITIES']]},r,{type:'ENDSEC',id:'e',pairs:[]}]);
test('compact records retain exact strings without materializing on read, render, clone or transfer',()=>{
 const r=line(),encoded=r._encoded,doc=document(r);assert.equal(get(r,1),'\n\u0000\\PПривет');assert.deepEqual(scene(doc).shapes[0].pts,[[1,2],[3,4]]);
 const copy=cloneDoc(doc);assert.equal(copy.entities[0]._encoded,encoded);assert.equal(r._encoded,encoded);
 const packet=packRecords([r]);assert.equal(r._encoded,encoded);const received=unpackRecords(structuredClone(packet))[0];assert.equal(received._encoded,encoded);assert.ok(equalNativeRecord(r,received));
 assert.deepEqual(pairsOf(received),pairsOf(r));assert.equal(received._encoded,encoded);assert.ok([...serializeChunks(doc)].join('').includes('\\U+041F'));
});
test('compact edits and undo materialize only the selected record and keep independent history',()=>{
 const r=line(),other=line();other.id='dwg-B';const doc=document(r);doc.entities.push(other);doc.records.splice(2,0,other);doc.native=true;doc.nativeOps=[];
 const state=captureView(doc,scene(doc),[r]);move(r,10,20);set(r,62,3);assert.equal(get(r,10),'11');assert.equal(get(r,62),'3');assert.ok(other._encoded);
 restoreView(state);assert.equal(get(r,10),'1');assert.equal(get(r,62),'');assert.ok(other._encoded);
 const ordinary={type:r.type,id:r.id,pairs:structuredClone(r.pairs)};assert.ok(equalNativeRecord(line(),ordinary));ordinary.pairs[2][1]='999';assert.ok(!equalNativeRecord(line(),ordinary));
});
test('compact transfer reuses an edited record when all values and extra fields match',()=>{
 const old=line();old.dimensionEndLocked=true;old.pairs;const doc=document(old),next=line();next.dimensionEndLocked=true;
 const receiver=nativeTransferReceiver({postMessage(){}},()=>{},doc);receiver({nativeChunk:0,total:3,...packRecords([doc.records[0],next,doc.records[2]])});
 assert.equal(receiver({nativeComplete:true,total:3,metadata:{},messages:[]}).doc.entities[0],old);
});
test('structured clones can be reindexed and edited without discarding compact records',()=>{
 const source=document(line()),copy=fromRecords(structuredClone(source.records));
 assert.equal(copy.entities[0]._encoded,source.entities[0]._encoded);set(copy.entities[0],62,4);assert.equal(get(copy.entities[0],62),'4');assert.equal(get(source.entities[0],62),'');
});
