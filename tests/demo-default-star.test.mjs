import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {developmentLists} from '../crm/worker/portal-project-lists.js';
const source=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
const start=source.indexOf('function defaultDemoDevelopment(');
const context=vm.createContext({Set});vm.runInContext(source.slice(start,source.indexOf('\n}',start)+2),context);
const cards=['old','new','removed','future'].map((appId,i)=>({dataset:{appId,created:['2026-11-05','2026-11-06','2026-11-06','2026-12-01'][i]}}));
test('new demos default on; old catalog and explicit off stay off across reloads',()=>{
 const data=developmentLists([{projectId:'removed',enabled:false},{projectId:'manual',enabled:true}]);
 for(let i=0;i<2;i++)assert.deepEqual([...context.defaultDemoDevelopment(data,cards)],['manual','new','future']);
});
test('wait for opt-out-aware API before applying defaults',()=>assert.deepEqual([...context.defaultDemoDevelopment({development:['manual']},cards)],['manual']));
