import test from 'node:test';import assert from 'node:assert/strict';import {scheduleValue,compareTaskSchedule,taskScheduleLabel} from '../app/task-schedule.js';
test('schedule uses Almaty on every device and sorts undated tasks last',()=>{
 assert.equal(scheduleValue('2026-11-26','15:30'),Date.parse('2026-11-26T10:30Z'));
 const tasks=[{id:'none'},{id:'late',dueDate:'2026-11-27'},{id:'early',dueDate:'2026-11-26',dueTime:'18:00'}];assert.deepEqual(tasks.sort(compareTaskSchedule).map(t=>t.id),['early','late','none']);assert.match(taskScheduleLabel(tasks[0]),/26.11.*18:00/);
 for(const date of ['2026-02-30','bad'])assert.throws(()=>scheduleValue(date));
});

test('same-day chronology uses time, and undated tasks follow dated tasks',()=>{
 const rows=[{id:'late',dueDate:'2026-11-30',dueTime:'19:00'},{id:'early',dueDate:'2026-11-30',dueTime:'12:30'},{id:'none'},{id:'before',dueDate:'2026-11-27',dueTime:'17:00'}];
 assert.deepEqual(rows.sort(compareTaskSchedule).map(t=>t.id),['before','early','late','none']);
});
import fs from 'node:fs';import vm from 'node:vm';
test('chronology defaults on and user choice survives reload independently per account',()=>{
 const source=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8'),code=source.slice(source.indexOf('const taskChronology=new Set();'),source.indexOf('function taskDueLabel('));
 const saved=new Map(),storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
 const setup=()=>{const context=vm.createContext({CURRENT:{email:'a@x.kz'},FINANCE_CHART_META:{orders:{},cash:{}},localStorage:storage,refreshFinanceWeekTaskBlock:()=>{}});vm.runInContext(code,context);return context;};
 let ctx=setup();assert.equal(ctx.taskChronologyEnabled('orders'),true);ctx.toggleTaskChronology('orders');assert.equal(ctx.taskChronologyEnabled('orders'),false);
 ctx=setup();assert.equal(ctx.taskChronologyEnabled('orders'),false);assert.equal(ctx.taskChronologyEnabled('cash'),true);ctx.CURRENT.email='b@x.kz';assert.equal(ctx.taskChronologyEnabled('orders'),true);ctx.CURRENT.email='a@x.kz';assert.equal(ctx.taskChronologyEnabled('orders'),false);
});
