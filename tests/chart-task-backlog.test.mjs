import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
const names=['financeCurrentWeekPoint','financeWeekShortDate','financeWeekTaskPeriod','financeWeekTasks','financeWeekTaskBlockForPoint','financeWeekTaskIsAutomatic','financeWeekTaskAutoBadge','financeWeekTaskOpenAction','financeWeekTaskAmount','moveFinanceWeekTaskForward','moveAutomaticPaymentPlanTaskForward','carryFinanceWeekTaskToCurrent'];
const code=names.map(name=>{const start=source.search(new RegExp('(?:async )?function '+name+'\\('));const end=source.indexOf('\n}',start)+2;return source.slice(start,end);}).join('\n');
function setup(){
 const c=vm.createContext({Date,console,FINANCE_WEEK_TASKS:[],FINANCE_WEEK_TASK_HISTORY_OPEN:new Set(),CURRENT:{email:'me'},mEsc:String,fmtT:String,financeTaskManagerLabel:()=>'',canConfigureFinanceChart:()=>true,canEditFinanceTask:()=>true,financeWeekTaskHistoryBlock:()=>'',paymentPlanProjectToken:String,confirm:()=>true,_mmId:null,alert:msg=>{throw Error(msg);}});
 vm.runInContext(code,c);return c;
}
test('all previous unfinished weeks remain visible; completed/deleted/moved and future tasks stay out',()=>{
 const c=setup(),point=c.financeCurrentWeekPoint([]),week=7*86400000;
 c.FINANCE_WEEK_TASKS=[{id:'old',text:'old unfinished',start:point.start-week*5},{id:'recent',text:'recent unfinished',start:point.start-week},{id:'done',text:'old completed',start:point.start-week,done:true},{id:'moved',text:'moved away',start:point.start-week,movedToStart:point.start},{id:'deleted',text:'deleted old',start:point.start-week,deleted:true},{id:'future',text:'future task',start:point.end},{id:'now',text:'current task',start:point.start,amount:100}].map(t=>({...t,kind:'cash',end:t.start+week}));
 const html=c.financeWeekTaskBlockForPoint('cash',point);
 for(const text of ['old unfinished','recent unfinished','current task','В текущую'])assert.ok(html.includes(text),text);
 for(const text of ['old completed','moved away','deleted old','future task'])assert.ok(!html.includes(text),text);
 assert.ok(html.indexOf('old unfinished')<html.indexOf('current task'));
 assert.ok(html.includes('План недели: 100'));
});
test('next week means next from today, even for a task missed five weeks ago',async()=>{
 const c=setup(),point=c.financeCurrentWeekPoint([]),week=7*86400000;
 c.FINANCE_WEEK_TASKS=[{id:'old',kind:'cash',start:point.start-5*week,end:point.start-4*week}];
 c.copyFinanceWeekTask=async(task,start,end)=>{assert.equal(start,point.end);assert.equal(end,point.end+week);};
 await c.moveFinanceWeekTaskForward('old');
});
test('automatic overdue payment moves to current week preserving weekday and time',async()=>{
 const c=setup(),point=c.financeCurrentWeekPoint([]),week=7*86400000,offset=86400000;
 const task={id:'auto',kind:'cash',start:point.start-week*4,automatic:true,source:'payment-plan',sourceProjectId:'project',sourcePlanId:'final'};
 c.FINANCE_WEEK_TASKS=[task];const stage={id:'final',dueAt:task.start+offset};
 c.paymentPlanStage=()=>stage;c.financeWeekBoundsAt=()=>({start:task.start,end:task.start+week});
 c.document={getElementById:()=>({dataset:point})};
 let writes=0,syncs=0;c.flushMoneySave=async()=>{writes++;};c.syncPaymentPlanTasks=async()=>{syncs++;};
 await c.carryFinanceWeekTaskToCurrent('auto');assert.equal(stage.dueAt,point.start+offset);assert.equal(writes,1);assert.equal(syncs,1);
});
test('next-week column contains only that week and totals its own plan',()=>{
 const c=setup(),point=c.financeCurrentWeekPoint([]),week=7*86400000;
 c.FINANCE_WEEK_TASKS=[{id:'old',text:'old task',start:point.start-week,amount:500},{id:'now',text:'current task',start:point.start,amount:100},{id:'next',text:'next task',start:point.end,amount:250},{id:'later',text:'later task',start:point.end+week,amount:900}].map(t=>({...t,kind:'cash',end:t.start+week}));
 const html=c.financeWeekTaskBlockForPoint('cash',{start:point.end,end:point.end+week},'next');
 assert.match(html,/Следующая неделя/);assert.match(html,/next task/);assert.match(html,/План недели: 250/);assert.match(html,/data-week-view="next"/);assert.match(html,/id="financeWeekTasks-cash-next"/);
 for(const text of ['old task','current task','later task','toggleFinanceWeekTaskHistory','В текущую'])assert.ok(!html.includes(text),text);
});
