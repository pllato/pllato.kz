import assert from 'node:assert/strict';
import {handleProjectPayouts,PAYOUT_COLLECTION} from '../crm/worker/project-payouts.js';
class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
const store=new Map();const deps={HttpError,get:async(_,c,id)=>store.get(id),put:async(_,c,item)=>{assert.equal(c,PAYOUT_COLLECTION);store.set(item.id,item);},list:async(_,kind,projectId)=>[...store.values()].filter(i=>i.kind===kind&&(!projectId||i.projectId===projectId))};
const admin={email:'boss@test.kz',user:{isSuperAdmin:true}},viewer={email:'staff@test.kz',user:{}},other={email:'other@test.kz',user:{}};
const call=(actor,method='GET',path='/project-payouts?projectId=demo',body)=>handleProjectPayouts(new Request('https://test'+path,{method,...(body?{body:JSON.stringify(body)}:{})}),{},actor,deps);
const denied=async(fn,status)=>assert.rejects(fn,e=>e.status===status);
await denied(()=>call(viewer),403);
const value={id:'payment_1',recipient:'Программист Алексей',role:'Программист',amount:125000.50,status:'planned',date:'2026-10-20',note:'Первый этап'};
await call(admin,'POST',undefined,value);await call(admin,'POST',undefined,value);assert.equal(store.size,1,'retry is idempotent');
assert.equal((await call(admin)).items[0].amount,125000.50);
await denied(()=>call(viewer,'POST',undefined,value),403);
await call(admin,'PUT','/project-payouts/access?projectId=demo',{viewers:['STAFF@test.kz']});
assert.deepEqual((await call(viewer,'GET','/project-payouts/access')).projects,['demo']);
assert.equal((await call(viewer)).items.length,1);assert.deepEqual((await call(viewer)).viewers,[]);
await denied(()=>call(viewer,'GET','/project-payouts?projectId=another'),403);
await denied(()=>call(other),403);
await denied(()=>call(viewer,'PUT','/project-payouts/access?projectId=demo',{viewers:['other@test.kz']}),403);
await denied(()=>call(admin,'POST',undefined,{...value,amount:-1}),400);
await denied(()=>call(admin,'POST',undefined,{...value,date:'2026-02-31'}),400);
await denied(()=>call(admin,'POST',undefined,{...value,status:'paid',date:'2999-01-01'}),400);
await call(admin,'POST',undefined,{...value,status:'paid',date:'2026-01-01'});assert.equal((await call(admin)).items[0].status,'paid');
await call(admin,'PUT','/project-payouts/access?projectId=demo',{viewers:[]});await denied(()=>call(viewer),403);
await call(admin,'POST',undefined,{id:value.id,deleted:true});assert.equal((await call(admin)).items.length,0);assert.equal(store.get('entry:demo:payment_1').deleted,true);
console.log('Payout tests passed: save/retry, status, amounts, dates, ACL isolation/revocation, viewer cannot write, soft deletion.');

// Generic sync must not bypass project-scoped permissions, even for admins.
const {readFileSync}=await import('node:fs');const vm=await import('node:vm');
const source=readFileSync(new URL('../crm/worker/worker.js',import.meta.url),'utf8');
const ctx=vm.createContext({PAYOUT_COLLECTION,HttpError,readRequestBodyAsJson:r=>r.json(),normalizeCollectionList:x=>x,normalizeCollectionName:x=>x,isObject:x=>!!x,DEFAULT_STORE_PULL_LIMIT:1000,MAX_STORE_OPS:100});
for(const name of ['handleStorePull','handleStorePush']){const start=source.indexOf('async function '+name+'(');vm.runInContext(source.slice(start,source.indexOf('\n}',start)+2),ctx);}
await denied(()=>ctx.handleStorePull(new Request('https://test/store/pull',{method:'POST',body:JSON.stringify({collections:[PAYOUT_COLLECTION]})}),{},admin),403);
await denied(()=>ctx.handleStorePush(new Request('https://test/store/push',{method:'POST',body:JSON.stringify({ops:[{type:'upsert',collection:PAYOUT_COLLECTION,item:{id:'any'}}]})}),{},admin),403);
console.log('Generic store ACL bypass protection passed.');
