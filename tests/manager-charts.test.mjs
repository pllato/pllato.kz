import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../crm/worker/worker.js',import.meta.url),'utf8').replace(/^import[\s\S]*?;\n/gm,'').replace('export default','const workerExport =');
function setup(){
 const sandbox={console,URL,URLSearchParams,Request,Response,TextEncoder,TextDecoder,crypto:globalThis.crypto,fetch:async()=>Response.json({series:[]})};
 const ctx=vm.createContext(sandbox);vm.runInContext(source,ctx);
 const now=Date.now();
 const stored={money:{a:{deal:100,cur:'KZT',managerEmail:'a@test.kz',pays:[{sum:100,at:now-10000}]},b:{deal:200,cur:'USD',managerEmail:'b@test.kz',pays:[{sum:100,at:now-10000}]},c:{deal:50,cur:'KZT',pays:[{sum:10,at:now-10000}]}},rate:500,chartVisibility:{cash:['a@test.kz'],orders:['a@test.kz'],releases:['a@test.kz']},chartAccess:{cash:{'a@test.kz':{total:false,managers:'own',tasks:'own'}}}};
 ctx.stored=stored;ctx.rows=[{id:'a',kind:'cash',managerEmail:'a@test.kz',text:'mine'},{id:'b',kind:'cash',managerEmail:'b@test.kz',text:'other'},{id:'auto',kind:'cash',automatic:true,sourceProjectId:'b',text:'other auto'},{id:'old',kind:'cash',author:'a@test.kz',text:'old mine'}];
 vm.runInContext('d1GetDoc=async(env,col,id)=>col===PRIVATE_PROJECT_FINANCE_COLLECTION?stored:rows.find(x=>x.id===id);d1ListCollection=async()=>rows;d1UpsertDoc=async(env,col,item)=>{if(col===PRIVATE_PROJECT_FINANCE_COLLECTION)stored=item;};',ctx);
 return ctx;
}
const actor={email:'a@test.kz',user:{}};
test('own financial data excludes other managers and totals in day/week/month',async()=>{
 const c=setup();
 for(const period of ['day','week','month']){
  const result=await c.handleProjectFinanceChartsGet({},actor,new URL('https://test?period='+period));
  assert.equal(result.access.cash.total,false);
  assert.equal(result.managerCharts.cash.length,1);
  assert.equal(result.managerCharts.cash[0].email,'a@test.kz');
  assert.equal(result.managerCharts.cash[0].series.reduce((n,p)=>n+p.value,0),100);
  assert.ok(result.charts.cash.every(p=>p.value===null));
 }
});
test('all series preserve aggregate and unassigned, personal series ignore manual overrides',async()=>{
 const c=setup();const result=await c.handleProjectFinanceChartsGet({},{isRoot:true},new URL('https://test'));
 assert.equal(result.managerCharts.cash.length,3);
 assert.equal(result.charts.cash.reduce((n,p)=>n+p.value,0),50110);
 assert.equal(result.managerCharts.cash.flatMap(m=>m.series).reduce((n,p)=>n+p.value,0),50110);
 assert.ok(result.managerCharts.cash.some(m=>m.email===''));
});
test('task filtering covers own, automatic source owner, selected managers and legacy author',async()=>{
 const c=setup();const request=new Request('https://test',{method:'POST',body:JSON.stringify({collections:['chart_week_tasks']})});
 const result=await c.handleStorePull(request,{},actor);
 assert.deepEqual(Array.from(result.collections.chart_week_tasks,x=>x.id),['a','old']);
 c.stored.chartAccess.cash['a@test.kz']={total:false,managers:'own',tasks:'selected',taskManagers:['b@test.kz']};
 const result2=await c.handleStorePull(new Request(request.url,{method:'POST',body:JSON.stringify({collections:['chart_week_tasks']})}),{},actor);
 assert.deepEqual(Array.from(result2.collections.chart_week_tasks,x=>x.id),['b','auto']);
});
test('cannot edit another manager task, promote access, or assign project without superadmin',async()=>{
 const c=setup();
 await assert.rejects(c.handleStorePush(new Request('https://test',{method:'POST',body:JSON.stringify({ops:[{type:'upsert',collection:'chart_week_tasks',item:{id:'b',kind:'cash',managerEmail:'a@test.kz'}}]})}),{},actor));
 await assert.rejects(c.handleProjectFinanceChartsPut(new Request('https://test',{method:'PUT',body:JSON.stringify({kind:'cash',chartAccess:{cash:{'a@test.kz':{total:true,managers:'all'}}}})}),{},actor));
 await assert.rejects(c.handleProjectManagers(new Request('https://test',{method:'PUT',body:JSON.stringify({projectId:'a',managerEmail:'b@test.kz'})}),{},actor));
});
test('own point details exclude other payments and total correction',async()=>{
 const c=setup(),now=Date.now();
 const result=await c.handleProjectFinanceChartDetails({},actor,new URL(`https://test?kind=cash&start=${now-86400000}&end=${now+86400000}`));
 assert.equal(result.items.length,1);assert.equal(result.items[0].projectId,'a');assert.equal(result.chartValue,100);
});
test('KEP graph visible to all, superadmin can persist independent access and assignments',async()=>{
 const c=setup();
 assert.equal(c.financeAccess(c.normalizeProjectFinance(c.stored),actor,'kep').managers,'all');
 await c.handleProjectManagers(new Request('https://test',{method:'PUT',body:JSON.stringify({projectId:'c',managerEmail:'a@test.kz'})}),{},{isRoot:true});
 assert.equal(c.stored.money.c.managerEmail,'a@test.kz');
 assert.equal(c.stored.money.c.pays[0].sum,10);
});

test('KEP SQL counts each deal once by conducting manager, leaves unassigned separate, requires auth',async()=>{
 const {DatabaseSync}=await import('node:sqlite');
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE pipelines(id TEXT,name TEXT,stages TEXT);CREATE TABLE deal_stage_events(deal_id TEXT,pipeline_id TEXT,stage_id TEXT,entered_at TEXT);CREATE TABLE deals(id TEXT,custom_fields TEXT);CREATE TABLE users(uid TEXT,email TEXT,name TEXT,last_name TEXT);`);
 const stages={demo:{name:'Создание Демо',sort:1},show:{name:'Показ Демо',sort:2},pay:{name:'Аванс',sort:3}};
 db.prepare('INSERT INTO pipelines VALUES(?,?,?)').run('p','Pllato Старт',JSON.stringify(stages));
 db.prepare('INSERT INTO users VALUES(?,?,?,?)').run('m','m@test.kz','Мария','Иванова');
 db.prepare('INSERT INTO deals VALUES(?,?)').run('one',JSON.stringify({kepManagerUid:'m'}));
 db.prepare('INSERT INTO deals VALUES(?,?)').run('two','{}');
 for(const [id,stage] of [['one','demo'],['one','show'],['two','pay']]) db.prepare('INSERT INTO deal_stage_events VALUES(?,?,?,?)').run(id,'p',stage,new Date().toISOString());
 const source=fs.readFileSync(new URL('../elc-worker/worker.js',import.meta.url),'utf8');
 const extract=name=>{let start=source.indexOf('async function '+name+'(');if(start<0)start=source.indexOf('function '+name+'(');return source.slice(start,source.indexOf('\n}',start)+2);};
 const ctx=vm.createContext({URL,Response,console,safeJsonParse:(s,f)=>{try{return JSON.parse(s)}catch{return f}},requireAuth:async()=>({claims:{}}),resolveCanonicalUser:async()=>({}),ensureStageEventsBackfill:async()=>{},json:(data,status)=>Response.json(data,{status})});
 for(const name of ['_ymd','weekAnchorThuUTC','buildChartBuckets','countIntoBuckets','resolvePllatoKepStages','handlePllatoKepManagers'])vm.runInContext(extract(name),ctx);
 const env={DB:{prepare(sql){return {bind(...args){return {first:async()=>db.prepare(sql).get(...args),all:async()=>({results:db.prepare(sql).all(...args)})}}}}}};
 const response=await ctx.handlePllatoKepManagers(new Request('https://test?period=week'),env);
 const data=await response.json();assert.equal(data.managers.length,2);
 assert.equal(data.managers.find(m=>m.email==='m@test.kz').series.reduce((n,p)=>n+p.value,0),1);
 assert.equal(data.managers.find(m=>m.email==='').series.reduce((n,p)=>n+p.value,0),1);
 ctx.requireAuth=async()=>({error:'unauthorized',status:401});
 assert.equal((await ctx.handlePllatoKepManagers(new Request('https://test'),env)).status,401);
});
