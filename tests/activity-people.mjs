import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
const context=vm.createContext({window:{},Date});vm.runInContext(fs.readFileSync(new URL('../app/production-activity.js',import.meta.url),'utf8'),context);
const api=context.window.productionActivity,now=Date.now(),hour=Math.floor(now/3600000)*3600000;
const source=(id,name,kind,count)=>({id,machineId:id,personName:name,source:kind,connected:true,available:true,coverageStart:hour,observedAt:now,buckets:[{at:hour,count}]});
const data={sources:[source('a','Ернар','codex',3),source('b','Ернар','claude',7),source('c','Ирина','codex',5),{id:'empty',name:'Нет истории',source:'codex'}]};
const periods=[{start:hour-3600000,end:hour,label:'Раньше'},{start:hour,end:hour+3600000,label:'Сейчас'}];
assert.equal(api.people(data).length,3);
const lines=api.peopleSeries(data,periods);assert.equal(lines[0].points[1].value,15);assert.equal(lines.find(l=>l.name==='Ернар').points[1].value,10);assert.equal(lines.find(l=>l.name==='Ернар').points[0].value,null);
const html=api.card(data,periods);assert(html.includes('Ернар'));assert(html.includes('Codex 3'));assert(html.includes('Claude 7'));assert(html.includes('Активность · Сейчас'));assert(!html.includes('undefined'));
const malicious={sources:[source('a','<img src=x onerror=alert(1)>','codex',1)]};assert(!api.card(malicious,periods).includes('<img'));
const mapped={...data,settings:{people:{a:'Платон',b:'Платон'}}};assert.equal(api.people(mapped).filter(p=>p.name==='Платон').length,1);
assert.equal(api.peopleSeries(mapped,periods).find(l=>l.name==='Платон').points[1].value,10);
console.log('PASS people graph: aggregation, assignment, periods, missing history, colors and escaped names');
const zeroData={sources:[source('zero','Zero person','codex',0),source('active','Active person','claude',2),{id:'unknown',name:'Unknown person',source:'claude'}]};
const list=api.peopleList(zeroData,periods[1]);
assert(!list.includes('Zero person'));assert(list.includes('Active person'));assert(list.includes('Unknown person'));
assert.equal(api.people(zeroData).length,3); // Hide rows, never delete connections.
// Employee details start collapsed; choice survives chart refreshes.
assert(!/class="pa-people" open/.test(api.card(data,periods)));
api.togglePeople(true);
assert(/class="pa-people" open/.test(api.card(data,periods)));
api.togglePeople(false);
const withTasks=api.card(data,periods,{tasksHtml:'<section data-task-kind="production">Дела недели</section>'});
assert(withTasks.includes('data-task-kind="production"'));
assert(withTasks.indexOf('Дела недели')<withTasks.indexOf('class="pa-people"'));
assert(!/class="pa-people" open/.test(withTasks));
