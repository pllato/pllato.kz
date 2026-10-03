import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectContractsService, relationId, COLLECTION } from '../app/contracts/service.js';
test('server relations survive a fresh service and concurrent attachments do not overwrite each other', async()=>{
 const store=new Map();
 const api=async(path,{body})=>{
  if(path==='/store/pull') return {collections:{[COLLECTION]:[...store.values()]}};
  const op=body.ops[0]; assert.equal(op.collection,COLLECTION); store.set(op.item.id,op.item); return {ok:true,applied:1};
 };
 const service=projectContractsService(api);
 await Promise.all([service.attach('project_a',{id:'ct_1',title:'First'}),service.attach('project_a',{id:'ct_2',title:'Second'})]);
 await service.attach('project_b',{id:'ct_1',title:'First'});
 await service.attach('project_a',{id:'ct_1',title:'First'});
 const rows=await projectContractsService(api).links();
 assert.equal(rows.length,3);
 assert.equal(rows.filter(r=>r.projectId==='project_a').length,2);
 assert.ok(rows.every(r=>!('publicToken' in r)&&!('fileBase64' in r)));
});
test('failed attachment rejects and can be retried using the same contract without another upload', async()=>{
 let fail=true; let calls=0;
 const api=async(path)=>{assert.equal(path,'/store/push'); calls++; if(fail)throw new Error('offline');return {ok:true};};
 const service=projectContractsService(api);
 await assert.rejects(service.attach('project',{id:'ct_1',title:'Contract'}),/offline/);
 fail=false; const saved=await service.attach('project',{id:'ct_1',title:'Contract'});
 assert.equal(saved.id,'project:ct_1'); assert.equal(calls,2);
});
test('bad keys and failed reads cannot appear as successful empty state',async()=>{
 assert.throws(()=>relationId('a:b','c'));
 assert.throws(()=>relationId('a',''));
 await assert.rejects(projectContractsService(async()=>({})).links(),/привязки/);
});
