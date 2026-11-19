import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf("const CAL_WORKER="),html.indexOf('/* ===== Рабочее пространство Pixel'));
function setup(){
  const writes=[],timers=[];
  const ctx=vm.createContext({console:{warn(){}},CURRENT:{isAdmin:true,email:'test'},getSession:()=>({token:'test'}),Date,Map,Set,AbortController,URLSearchParams,
    localStorage:{getItem:()=>null,setItem:(...args)=>writes.push(args)},
    document:{getElementById:()=>null},setTimeout:(fn,ms)=>{timers.push(ms);return 1;},clearTimeout(){},setInterval(){},clearInterval(){}});
  vm.runInContext(source,ctx);
  vm.runInContext('calLoadZoomLinks=async()=>{}',ctx);
  return {ctx,writes,timers,run:code=>vm.runInContext(code,ctx)};
}
test('HTTP failure rejects calendar load rather than returning empty events',async()=>{
  const x=setup(); x.ctx.fetch=async()=>({ok:false,status:500});
  await assert.rejects(x.run('calFetchToday()'),/HTTP 500/);
});
test('failed refresh preserves meetings, does not overwrite cache, retries after a minute',async()=>{
  const x=setup();
  x.run('CAL_EVENTS=[{at:123,title:"Saved meeting"}];calFetchToday=async()=>{throw new Error("overloaded")}');
  await x.run('loadTodayCalendar()');
  assert.equal(x.run('CAL_EVENTS[0].title'),'Saved meeting');
  assert.equal(x.run('CAL_ERROR'),true);
  assert.equal(x.writes.length,0);
  assert.equal(x.timers.at(-1),60000);
});
test('initial failure renders an error, while successful empty response means no meetings',async()=>{
  const x=setup(),box={querySelector:()=>null}; x.ctx.document.getElementById=()=>box;
  x.run('calFetchToday=async()=>{throw new Error("overloaded")}');
  await x.run('loadTodayCalendar()');
  assert.match(box.innerHTML,/Не удалось загрузить/);
  assert.doesNotMatch(box.innerHTML,/календарь свободен/);
  x.run('calFetchToday=async()=>[]');
  await x.run('loadTodayCalendar()');
  assert.equal(x.run('CAL_ERROR'),false);
  assert.match(box.innerHTML,/календарь свободен/);
  assert.equal(x.writes.length,1);
});
test('overlapping reloads share the active request',async()=>{
  const x=setup();let resolve,calls=0;
  x.ctx.calFetchToday=()=>{calls++;return new Promise(r=>resolve=r)};
  const first=x.run('loadTodayCalendar()'); await x.run('loadTodayCalendar()');
  assert.equal(calls,1); resolve([]);await first;
});
test('hidden tab does not request calendar sources',async()=>{
 const x=setup();x.ctx.document.hidden=true;
 x.ctx.calFetchToday=()=>{throw new Error('Should not fetch');};
 await x.run('loadTodayCalendar()');
 assert.equal(x.writes.length,0);assert.equal(x.run('CAL_ERROR'),false);
 assert.equal(x.timers.at(-1),60000);
});

test('two-day calendar makes one authenticated request, without loading pipeline lists',async()=>{
 const x=setup(),calls=[];x.ctx.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({ok:true,items:[{title:'Meeting'}]})};};
 const items=await x.run('calFetchToday()');assert.equal(items.length,1);assert.equal(calls.length,1);
 assert.match(calls[0].url,/api\/calendar\/upcoming/);assert.doesNotMatch(calls[0].url,/auth=/);
 assert.equal(calls[0].options.headers.Authorization,'Bearer test');
});
