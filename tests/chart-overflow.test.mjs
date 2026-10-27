import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
const app=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
function extract(source,name){const start=source.indexOf('function '+name+'(');return source.slice(start,source.indexOf('\n}',start)+2);}
for(const name of ['financeChartSvg','pxChartSvg'])test(name+' expands for overflow and moves configured guide with its label',()=>{
 const c=vm.createContext({MANAGER_CHARTS:{},CHART_EFFECTIVE_ACCESS:{},financeChartScale:()=>100,pxBinding:()=>({max:100}),FINANCE_CHART_META:{inquiries:{color:'blue',title:'Test'}},mEsc:String,financeValue:(_,v)=>String(v),pxValue:(_,v)=>String(v),financePointComments:()=>[]});
 vm.runInContext(extract(app,name),c);
 const series=[{value:50,label:'one',start:1,end:2},{value:200,label:'two',start:2,end:3,partial:true}];
 const svg=c[name](name==='financeChartSvg'?'inquiries':{key:'inquiries',title:'Test',color:'blue'},series);
 assert.match(svg,/y1="342(?:\.0)?"[^>]*y2="342(?:\.0)?"/);
 assert.match(svg,/y="304(?:\.0)?"[^>]*>Максимум шкалы: 100/);
 assert.match(svg,/cy="480\.0"/);
 assert.match(svg,/cy="66\.0"/);
 assert.match(svg,/y1="618"/);
});
test('inquiries exclude invalid imports but retain legitimate archived deals',async()=>{
 const source=fs.readFileSync(new URL('../elc-worker/worker.js',import.meta.url),'utf8');
 const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE pipelines(id TEXT,name TEXT);INSERT INTO pipelines VALUES('p','Pllato Старт');CREATE TABLE deals(pipeline_id TEXT,bitrix_date_create TEXT,custom_fields TEXT,archived INTEGER);INSERT INTO deals VALUES('p','2026-10-27',NULL,0),('p','2026-10-27','{}',1),('p','2026-10-27','{\"analyticsExcluded\":true}',1);");
 const env={DB:{prepare(sql){return {bind(...args){return {first:async()=>db.prepare(sql).get(...args),all:async()=>({results:db.prepare(sql).all(...args)})};}}}}};
 const c=vm.createContext({URL,buildChartBuckets:()=>[{start:'2026-10-01'}],countIntoBuckets:rows=>[{value:rows.length}],json:x=>x});
 vm.runInContext('async '+extract(source,'handlePublicPllatoInquiries'),c);
 const result=await c.handlePublicPllatoInquiries(new Request('https://test'),env);assert.equal(result.series[0].value,2);db.close();
});
test('automatic scale and configured headroom retain top guide; manager peaks also fit',()=>{
 const c=vm.createContext({MANAGER_CHARTS:{},CHART_EFFECTIVE_ACCESS:{},financeChartScale:()=>0,FINANCE_CHART_META:{inquiries:{color:'blue',title:'Test'}},mEsc:String,financeValue:(_,v)=>String(v),financePointComments:()=>[]});
 vm.runInContext(extract(app,'financeChartSvg'),c);
 const series=[{value:50,label:'one',start:1,end:2}];
 assert.match(c.financeChartSvg('inquiries',series),/y="28"[^>]*>Максимум шкалы: 50/);
 c.financeChartScale=()=>100;
 assert.match(c.financeChartSvg('inquiries',series),/cy="342.0"/);
 c.MANAGER_CHARTS={inquiries:[{email:'a',name:'A',series:[{...series[0],value:200}]}]};c.managerColor=()=> 'red';
 const svg=c.financeChartSvg('inquiries',series);assert.match(svg,/cy="480.0"/);assert.match(svg,/y="304"[^>]*>Максимум шкалы: 100/);
});
test('production activity uses the same overflow guide and zero line',()=>{
 const source=fs.readFileSync(new URL('../app/production-activity.js',import.meta.url),'utf8');
 const start=source.indexOf(' function svg('),end=source.indexOf('\n function connection',start);
 const c=vm.createContext({colors:{total:'blue'},esc:String});vm.runInContext(source.slice(start,end),c);
 const svg=c.svg([{key:'total',name:'Total',points:[{value:50},{value:200}]}],100);
 assert.match(svg,/y1="342" y2="342"/);assert.match(svg,/y="304"[^>]*>Максимум шкалы: 100/);assert.match(svg,/cy="480"/);assert.match(svg,/y1="618" y2="618"/);
});
