const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('app.html','utf8');
for(const [i,m] of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!m[1].includes('src=')&&!m[1].includes('application/ld')){const p='/tmp/pay-script-'+i+'.mjs';fs.writeFileSync(p,m[2]);require('child_process').execFileSync('node',['--check',p]);}
const names=['paymentPlanAmount','paymentPlanStage','setPlanField','setPlanMode','addPlanStage','delPlanStage'];
const extract=n=>{const a=html.indexOf('function '+n+'('),b=html.indexOf('\nfunction ',a+10);return html.slice(a,b)};
const c={MONEY:{x:{deal:1500000,pays:[{sum:150000}],paymentPlan:[{id:'second',label:'Второй',percent:45,dueAt:1},{id:'final',label:'Финальный',percent:45,dueAt:2}]}},_mmId:'x',canSeeProjectMoney:()=>true,mDeal:()=>c.MONEY.x.deal,mRecv:()=>150000,mDebt:()=>1350000,savePlanAndRender:()=>{},alert:()=>{},crypto:require('crypto'),confirm:()=>false};vm.createContext(c);vm.runInContext(names.map(extract).join('\n'),c);
c.setPlanMode('custom');assert.equal(c.MONEY.x.planPaidBase,150000);assert.equal(c.MONEY.x.paymentPlan[0].percent,45);
c.setPlanField('second','percent','30');assert.equal(c.paymentPlanAmount('x',c.MONEY.x.paymentPlan[0]),450000);
c.setPlanField('final','percent','30');c.addPlanStage();const id=c.MONEY.x.paymentPlan[2].id;c.setPlanField(id,'percent','10');assert.equal(c.MONEY.x.paymentPlan.reduce((s,p)=>s+c.paymentPlanAmount('x',p),0),1050000);
c.MONEY.x.deal=2000000;assert.equal(c.paymentPlanAmount('x',c.MONEY.x.paymentPlan[0]),600000);
c.setPlanField('second','mode','amount');c.MONEY.x.deal=1500000;assert.equal(c.paymentPlanAmount('x',c.MONEY.x.paymentPlan[0]),600000);
c.setPlanField('second','amount','123.45');assert.equal(c.MONEY.x.paymentPlan[0].amount,123.45);
c.setPlanField('final','percent','101');assert.equal(c.MONEY.x.paymentPlan[1].percent,30);
c.delPlanStage(id);assert.equal(c.MONEY.x.paymentPlan.length,2);assert(c.MONEY.x.paymentPlan[1].final);
const helper=fs.readFileSync('crm/worker/payment-plan.js','utf8').replace('export ','');vm.runInContext(helper,c);
let round=c.normalizeCustomPaymentPlan(JSON.parse(JSON.stringify(c.MONEY.x.paymentPlan)));assert.equal(round.length,2);assert.equal(round[1].percent,30);assert.equal(round[0].amount,123.45);
assert.equal(c.normalizeCustomPaymentPlan([{id:'bad',dueAt:1,percent:101}]).length,0);
assert.equal(c.normalizeCustomPaymentPlan([{id:'good',dueAt:1,percent:10},{id:'good',dueAt:2,percent:30}]).length,1);
console.log('PASS: syntax, flexible percentages, fixed amounts, invalid values, add/delete, persistence roundtrip');

const worker=fs.readFileSync('crm/worker/worker.js','utf8');const a=worker.indexOf('function normalizeProjectFinance('),b=worker.indexOf('\nasync function listSocialDays',a);Object.assign(c,{isObject:v=>v&&typeof v==='object'&&!Array.isArray(v),paymentLabel:(v,f='')=>String(v||f),paymentCardTitle:v=>String(v||''),normalizeChartAccess:v=>v||{}});vm.runInContext(worker.slice(a,b),c);
let saved=c.normalizeProjectFinance({money:{x:c.MONEY.x}});let loaded=c.normalizeProjectFinance(JSON.parse(JSON.stringify(saved)));assert.equal(loaded.money.x.planMode,'custom');assert.equal(loaded.money.x.planPaidBase,150000);assert.equal(loaded.money.x.paymentPlan[1].percent,30);assert.equal(loaded.money.x.paymentPlan[0].amount,123.45);console.log('PASS: actual API normalization GET/PUT roundtrip');
