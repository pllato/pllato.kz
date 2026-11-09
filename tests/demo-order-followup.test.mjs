import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
const functions=['demoOrderTaskTitle','financeDemoTaskText','financeWeekBoundsAt','demoOrderFollowups','financeDemoTaskLink','syncDemoOrderFollowups'];
const code=functions.map(name=>{const start=html.search(new RegExp('(?:async )?function '+name+'\\('));return html.slice(start,html.indexOf('\n}',start)+2);}).join('\n');
const now=Date.parse('2026-10-28T15:00:00+05:00');
const record={projectId:'client',title:'Клиент',timestamp:now-3600000,manager:'manager@example.com',demoUrl:'app/client.html',crmDealId:'deal1'};
function setup(){const c=vm.createContext({Date,URL,location:{href:'https://pllato.kz/app',origin:'https://pllato.kz'},mEsc:String,DEMO_ORDER_SYNC:null,CURRENT:{isSuperAdmin:true},canConfigureFinanceChart:()=>true,FINANCE_WEEK_TASKS:[],appDemoRecords:()=>[record]});vm.runInContext(code,c);return c;}
test('one order follow-up links demo and manager, with correct weekly bounds',()=>{
 const c=setup(),[t]=c.demoOrderFollowups([record,record],[],now);
 assert.equal(c.demoOrderFollowups([record,record],[],now).length,1);
 assert.equal(t.kind,'orders');assert.equal(t.sourceProjectId,'client');assert.equal(t.managerEmail,record.manager);assert.equal(t.crmDealId,'deal1');
 assert.equal(t.start,Date.parse('2026-10-22T14:00:00+05:00'));assert.equal(t.end,Date.parse('2026-10-29T14:00:00+05:00'));
 assert.match(c.financeDemoTaskLink(t),/https:\/\/pllato.kz\/app\/client.html/);
});
test('old, undated and future catalog entries are excluded',()=>{
 const c=setup();for(const timestamp of [0,Date.parse('2026-10-27T12:00:00+05:00'),now+86400000])assert.equal(c.demoOrderFollowups([{...record,timestamp}],[],now).length,0);
});
test('completed, deleted and moved originals are never recreated',()=>{
 const c=setup();for(const state of [{done:true},{deleted:true},{movedToStart:now}])assert.equal(c.demoOrderFollowups([record],[{id:'demo-order:client',...state}],now).length,0);
});
test('untrusted URLs are not rendered as demo links',()=>{
 const c=setup();for(const sourceDemoUrl of ['javascript:alert(1)','https://evil.test/app/a','/login.html',''])assert.equal(c.financeDemoTaskLink({source:'demo-followup',sourceDemoUrl}),'');
});
test('sync writes create-only and reloads persisted state; simultaneous calls share one job',async()=>{
 const c=setup();let pushes=0,pulls=0;c.apiFetch=async(path,{body})=>{pushes++;assert.equal(path,'/store/push');assert.equal(body.ops[0].createOnly,true);};c.loadFinanceWeekTasks=async()=>{pulls++;};
 await Promise.all([c.syncDemoOrderFollowups(),c.syncDemoOrderFollowups()]);assert.equal(pushes,1);assert.equal(pulls,1);
});
test('manager only creates own demo tasks',async()=>{
 const c=setup();c.CURRENT={email:'other@example.com'};c.apiFetch=()=>{throw Error('must not write');};await c.syncDemoOrderFollowups();
});
test('date-only publication is actionable in the morning, but not on future dates',()=>{
 const c=setup(),morning=Date.parse('2026-10-29T09:00:00+05:00');
 const [task]=c.demoOrderFollowups([{...record,dateOnly:true,timestamp:Date.parse('2026-10-29T12:00:00+05:00')}],[],morning);
 assert.ok(task);assert.equal(task.start,Date.parse('2026-10-22T14:00:00+05:00'));
 assert.equal(c.demoOrderFollowups([{...record,dateOnly:true,timestamp:Date.parse('2026-10-30T12:00:00+05:00')}],[],morning).length,0);
});

test('follow-up starts with the contact from the linked deal',()=>{
 const c=setup();
 const [task]=c.demoOrderFollowups([{...record,crmDealTitle:'Александр Разинков · оборудование'}],[],now);
 assert.equal(task.text,'Александр Разинков · оборудование — Связаться после демо');
 assert.equal(c.demoOrderTaskTitle({...record,contactName:'Руслан',crmDealTitle:'Компания'}),'Руслан — Клиент — Связаться после демо');
 assert.equal(c.demoOrderTaskTitle(record),'Клиент — Связаться после демо');
});
test('legacy default labels update without changing custom tasks or stored state',()=>{
 const c=setup(),task={source:'demo-followup',sourceProjectId:'client',text:'Связаться после демо — Клиент',done:true};
 assert.equal(c.financeDemoTaskText(task),'Клиент — Связаться после демо');
 assert.equal(task.text,'Связаться после демо — Клиент');
 for(const custom of [{...task,text:'Гаухар на пятницу. Связаться после демо'}, {...task,text:task.text+' завтра'}, {...task,source:'manual'}])assert.equal(c.financeDemoTaskText(custom),custom.text);
});

test('contact prefixes company and existing generated task in the editor',()=>{
 const c=setup(),entry={...record,contactName:'Есен',title:'Sayahat Gurme (Есен) — Демо + КП'};
 c.appDemoRecords=()=>[entry];
 const expected='Есен — Sayahat Gurme (Есен) — Демо + КП — Связаться после демо';
 assert.equal(c.demoOrderTaskTitle(entry),expected);
 assert.equal(c.financeDemoTaskText({source:'demo-followup',sourceProjectId:'client',text:entry.title+' — Связаться после демо'}),expected);
 assert.equal(c.financeDemoTaskText({source:'demo-followup',sourceProjectId:'client',text:'Есен перезвонить в пятницу'}),'Есен перезвонить в пятницу');
 assert.ok(html.includes("mEsc(existing?financeDemoTaskText(existing):'')"));
});
