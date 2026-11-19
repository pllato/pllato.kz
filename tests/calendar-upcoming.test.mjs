import test from 'node:test';
import assert from 'node:assert/strict';
import {handleCalendarUpcoming} from '../elc-worker/calendar-upcoming.js';
const at=Date.parse('2026-11-19T05:00:00Z'); // 10:00 Almaty
const request=new Request('https://test/api/calendar/upcoming?date=2026-11-19&tzo=-300');
function setup({fail=false,authError=false}={}){
 const queries=[];
 const deal={id:'deal_client',title:'Client',pipeline_id:'p',stage_id:'new',opportunity:100,custom_fields:JSON.stringify({firstZoomAt:'2026-11-19T10:00'}),bitrix_id:null};
 const tasks=[{id:'t',title:'Call',mark:'zoom_meeting',start_date_plan:'2026-11-19T10:00',end_date_plan:null,deadline:'2027-01-01',crm_links:['deal_client']},{id:'later',title:'Tomorrow',mark:'offline_meeting',start_date_plan:'2026-11-20T12:00+05:00'},{id:'old',mark:'zoom_meeting',start_date_plan:'2026-11-18T20:00'}];
 const db={prepare(sql){const q={sql,args:[],bind(...args){this.args=args;return this;},async all(){return {results:[]}}};queries.push(q);return q;},async batch(){if(fail)throw Error('overloaded');return [{results:[{id:'p',name:'Sales',stages:'{"new":{"name":"New"}}'}]},{results:tasks},{results:[deal]}];}};
 const deps={json:(body,status)=>new Response(JSON.stringify(body),{status}),requireAuthFlexible:async()=>authError?{error:'missing token',status:401}:{claims:{}},resolveCanonicalUser:async()=>({role:'agent',orgPerms:{pipelineIds:['p'],dealScope:'own'}}),dealAccessSql:me=>{assert.equal(me.orgPerms.dealScope,'all');return {where:' AND pipeline_id IN (?)',params:['p']}},widgetDayBounds:()=>({date:'2026-11-19',tzo:-300,dayStart:Date.parse('2026-11-18T19:00Z')}),widgetParseWhen:(s,tzo)=>{if(!s)return NaN;return /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(s)?Date.parse(s+'Z')+tzo*60000:Date.parse(s)},widgetLinkedDealId:t=>t.crm_links?.[0]?.replace(/^deal_/,'')||null};
 return {db,deps,queries};
}
test('narrow batch preserves timezone, tomorrow and task/deal deduplication',async()=>{
 const x=setup(),r=await handleCalendarUpcoming(request,{DB:x.db},x.deps),d=await r.json();
 assert.equal(r.status,200);assert.equal(d.items.length,2);assert.equal(d.items[0].at,at);
 assert.equal(d.items[0].src,'встреча');assert.equal(d.items[0].deal,'deal_client');assert.equal(d.items[0].stage,'New');
 assert.equal(d.items[1].title,'Tomorrow');assert.equal(d.items[1].kind,'meet');
 assert.equal(x.queries.length,3);assert.doesNotMatch(x.queries.map(q=>q.sql).join(' '),/COUNT\(|SELECT \*|ALTER TABLE/i);
 assert.deepEqual(x.queries[2].args,['2026-11-18','2026-11-19','2026-11-20','2026-11-21','p']);
});
test('unauthenticated access performs no database queries',async()=>{
 const x=setup({authError:true});const r=await handleCalendarUpcoming(request,{DB:x.db},x.deps);assert.equal(r.status,401);assert.equal(x.queries.length,0);
});
test('database failure returns a retryable error, not an empty success',async()=>{
 const x=setup({fail:true});const r=await handleCalendarUpcoming(request,{DB:x.db},x.deps);assert.equal(r.status,503);assert.equal((await r.json()).items,undefined);
});
