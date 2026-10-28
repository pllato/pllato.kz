import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {resolvePllatoDemoStages} from '../elc-worker/demo-chart.js';
const source=readFileSync(new URL('../elc-worker/worker.js',import.meta.url),'utf8');
const stages={new:{name:'Новая',sort:0},create:{name:'Создание Демо',sort:1},demo:{name:'Показ Демо',sort:2},advance:{name:'Аванс',sort:3}};
assert.deepEqual(resolvePllatoDemoStages(stages).stageIds,['demo']);
assert.equal(resolvePllatoDemoStages({create:stages.create}),null);
const db=new DatabaseSync(':memory:');
db.exec(`CREATE TABLE pipelines(id TEXT,name TEXT,stages TEXT); CREATE TABLE deal_stage_events(deal_id TEXT,pipeline_id TEXT,stage_id TEXT,entered_at TEXT); CREATE TABLE deals(id TEXT,title TEXT,custom_fields TEXT,responsible_uid TEXT); CREATE TABLE users(uid TEXT,email TEXT,name TEXT,last_name TEXT);`);
db.prepare('INSERT INTO pipelines VALUES (?,?,?)').run('p','Pllato Старт',JSON.stringify(stages));
db.prepare('INSERT INTO users VALUES (?,?,?,?)').run('u','manager@example.com','Manager','');
for(const id of ['before','boundary','after','repeat','skip','other'])db.prepare('INSERT INTO deals VALUES (?,?,?,?)').run(id,id,JSON.stringify({kepManagerUid:'u'}),'u');
for(const row of [
 ['before','p','demo','2026-10-08T08:59:59.000Z'],
 ['boundary','p','demo','2026-10-08T09:00:00.000Z'],
 ['after','p','demo','2026-10-09T09:00:00.000Z'],
 ['repeat','p','demo','2026-10-07T09:00:00.000Z'],
 ['repeat','p','demo','2026-10-10T09:00:00.000Z'],
 ['after','p','advance','2026-10-10T10:00:00.000Z'],
 ['skip','p','create','2026-10-09T09:00:00.000Z'],
 ['skip','p','advance','2026-10-10T09:00:00.000Z'],
 ['other','other','demo','2026-10-09T09:00:00.000Z'],
])db.prepare('INSERT INTO deal_stage_events VALUES (?,?,?,?)').run(...row);
const env={DB:{prepare(sql){
 return {bind(...args){
  return {first:async()=>db.prepare(sql).get(...args),all:async()=>({results:db.prepare(sql).all(...args)})};
 }};
}}};
const buckets=[['2026-10-01T09:00:00Z','2026-10-08T09:00:00Z'],['2026-10-08T09:00:00Z','2026-10-15T09:00:00Z']].map(([start,end],i)=>({start,startMs:Date.parse(start),endMs:Date.parse(end),label:String(i),partial:!!i}));
const countSrc=source.slice(source.indexOf('function countIntoBuckets('),source.indexOf('// То же разложение',source.indexOf('function countIntoBuckets(')));
const handlers=source.slice(source.indexOf('function resolvePllatoKepStages('),source.indexOf('function leadAnalyticsText('));
const {summary,managers,details}=new Function('resolvePllatoDemoStages','ensureStageEventsBackfill','buildChartBuckets','json','requireAuth','resolveCanonicalUser','safeJsonParse',countSrc+handlers+';return {summary:handlePublicPllatoKep,managers:handlePllatoKepManagers,details:handlePllatoChartDetails}')(
 resolvePllatoDemoStages,async()=>{},()=>buckets,(body,status)=>({body,status}),async()=>({claims:{}}),async()=>({orgPerms:{pipelineIds:['p']}}),JSON.parse);
const request=new Request('https://test/api/public/pllato-demos?period=week');
assert.deepEqual((await summary(request,env,'demos')).body.series.map(x=>x.value),[2,2]);
assert.deepEqual((await summary(request,env,'kep')).body.series.map(x=>x.value),[2,3]);
assert.deepEqual((await managers(request,env,'demos')).body.managers[0].series.map(x=>x.value),[2,2]);
const start=buckets[1].startMs,end=buckets[1].endMs;
const result=await details(new Request(`https://test/api/charts/pllato-details?kind=demos&start=${start}&end=${end}`),env);
assert.equal(result.status,200);assert.deepEqual(result.body.items.map(x=>x.dealId),['boundary','after']);
const src=readFileSync(new URL('../app.html',import.meta.url),'utf8');
assert.ok(src.includes("['social','inquiries','kep','demos','orders','cash','releases']"));
console.log('Demo chart: exact stage, first entry, no re-entry duplicates, later-stage retention, pipeline isolation, Thursday 14:00 boundary, manager totals and drilldown agree.');
