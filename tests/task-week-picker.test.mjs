import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
const names=['financeWeekBoundsAt','financeWeeksInYear','moveFinanceWeekTaskForward'];
const code=names.map(n=>{const a=html.search(new RegExp('(?:async )?function '+n+'\\('));return html.slice(a,html.indexOf('\n}',a)+2);}).join('\n');
function setup(){const c=vm.createContext({Date});vm.runInContext(code,c);return c;}
test('year list covers New Year, leap years and continuous Thursday periods',()=>{
 const c=setup();for(const year of [2026,2027,2028]){
 const weeks=c.financeWeeksInYear(year);assert.ok(weeks.length>=52&&weeks.length<=54);
 assert.ok(weeks[0].start<=Date.UTC(year,0,1)-5*3600000);
 assert.ok(weeks.at(-1).end>=Date.UTC(year+1,0,1)-5*3600000);
 weeks.forEach((w,i)=>{const d=new Date(w.start+5*3600000);assert.equal(d.getUTCDay(),4);assert.equal(d.getUTCHours(),14);assert.equal(w.end-w.start,7*86400000);if(i)assert.equal(weeks[i-1].end,w.start);});
 }
});
test('selected distant week is used for manual and automatic tasks; cancel does not write',async()=>{
 const c=setup(),current=c.financeWeekBoundsAt(Date.parse('2026-11-10')).start,target=current+12*7*86400000;
 let calls=[];Object.assign(c,{FINANCE_WEEK_TASKS:[{id:'t',kind:'cash',start:current}],canConfigureFinanceChart:()=>true,canEditFinanceTask:()=>true,financeCurrentWeekPoint:()=>({start:current}),chooseFinanceTaskWeek:async()=>target,financeWeekTaskIsAutomatic:()=>false,copyFinanceWeekTask:async(t,s,e)=>calls.push([s,e]),moveAutomaticPaymentPlanTaskForward:async(t,s)=>calls.push([s])});
 await c.moveFinanceWeekTaskForward('t');assert.deepEqual(calls,[[target,target+7*86400000]]);
 calls=[];c.financeWeekTaskIsAutomatic=()=>true;await c.moveFinanceWeekTaskForward('t');assert.deepEqual(calls,[[target]]);
 calls=[];c.chooseFinanceTaskWeek=async()=>null;await c.moveFinanceWeekTaskForward('t');assert.deepEqual(calls,[]);
});
test('task completed while choosing cannot be moved',async()=>{
 const c=setup();const task={id:'t',kind:'orders',start:1};Object.assign(c,{FINANCE_WEEK_TASKS:[task],canConfigureFinanceChart:()=>true,canEditFinanceTask:()=>true,chooseFinanceTaskWeek:async()=>{task.done=true;return 2;},copyFinanceWeekTask:()=>assert.fail('must not write')});await c.moveFinanceWeekTaskForward('t');
});
