import test from 'node:test';import assert from 'node:assert/strict';import {tasksForDay} from '../app/day-tasks.js';
test('daily list follows explicit dueDate instead of task week, respects lifecycle and time order',()=>{
 const rows=[{id:'late',dueDate:'2026-11-26',dueTime:'18:00',start:1},{id:'early',dueDate:'2026-11-26',dueTime:'09:00',start:999999},{id:'all-day',dueDate:'2026-11-26'},{id:'done',dueDate:'2026-11-26',dueTime:'12:00',done:true},{id:'tomorrow',dueDate:'2026-11-27'},{id:'no-date'},{id:'deleted',dueDate:'2026-11-26',deleted:true},{id:'moved',dueDate:'2026-11-26',movedToTaskId:'new'},{id:'moved-start',dueDate:'2026-11-26',movedToStart:1}];
 assert.deepEqual(tasksForDay(rows,'2026-11-26').map(x=>x.id),['all-day','early','done','late']);assert.equal(rows[0].id,'late');assert.deepEqual(tasksForDay(rows,'2026-11-27').map(x=>x.id),['tomorrow']);
});
import fs from 'node:fs';import vm from 'node:vm';
test('calendar and charts share one in-flight task collection request',async()=>{
 const s=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8'),start=s.indexOf('async function loadFinanceWeekTasks(){'),end=s.indexOf('\nfunction demoOrderTaskTitle',start);let calls=0,finish,renders=0;
 const context=vm.createContext({CURRENT:{email:'user@x.kz'},FINANCE_WEEK_TASKS:[],FINANCE_WEEK_TASKS_LOADED:false,FINANCE_WEEK_TASKS_PROMISE:null,FINANCE_WEEK_TASKS_ERROR:false,apiFetch:async()=>{calls++;return new Promise(resolve=>{finish=resolve;});},renderTodayCalendar:()=>renders++});
 vm.runInContext(s.slice(start,end),context);const requests=[context.loadFinanceWeekTasks(),context.loadFinanceWeekTasks(),context.loadFinanceWeekTasks()];assert.equal(calls,1);finish({collections:{chart_week_tasks:[{id:'t'}]}});await Promise.all(requests);assert.equal(context.FINANCE_WEEK_TASKS_LOADED,true);assert.equal(context.FINANCE_WEEK_TASKS[0].id,'t');assert.equal(renders,1);await context.loadFinanceWeekTasks();assert.equal(calls,1);
});

test('orders day list excludes cash, other charts and undated tasks',()=>{
 const rows=[{id:'order',kind:'orders',dueDate:'2026-11-26',dueTime:'15:00'},{id:'cash',kind:'cash',dueDate:'2026-11-26'},{id:'other',kind:'posts',dueDate:'2026-11-26'},{id:'undated',kind:'orders'},{id:'tomorrow',kind:'orders',dueDate:'2026-11-27'}];
 assert.deepEqual(tasksForDay(rows,'2026-11-26','orders').map(t=>t.id),['order']);assert.deepEqual(tasksForDay(rows,'2026-11-27','orders').map(t=>t.id),['tomorrow']);
});
