import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTeamReadCache} from './team-request-cache.js';
const origin='https://worker.test', url=origin+'/api/chat/channels';
const auth={headers:{Authorization:'Bearer a'}};
test('shares concurrent reads, independent bodies, TTL and account/scope isolation',async()=>{
 let calls=0,t=0;
 const cache=createTeamReadCache(async()=>Response.json({call:++calls}),{origin,now:()=>t});
 const responses=await Promise.all([cache.fetch(url,auth),cache.fetch(new URL(url),auth)]);
 assert.deepEqual(await responses[0].json(),await responses[1].json());assert.equal(calls,1);
 await cache.fetch(url,auth);assert.equal(calls,1);
 await cache.fetch(url+'?archived=1',auth);await cache.fetch(url,{headers:{Authorization:'Bearer b'}});assert.equal(calls,3);
 t=30001;await cache.fetch(url,auth);assert.equal(calls,4);
});
test('mutation and explicit invalidation refresh cached lists; errors retry',async()=>{
 let calls=0,status=200;
 const cache=createTeamReadCache(async()=>Response.json({call:++calls},{status}),{origin});
 await cache.fetch(url,auth);await cache.fetch(origin+'/api/chat/read',{...auth,method:'POST'});await cache.fetch(url,auth);assert.equal(calls,3);
 cache.invalidate();status=500;await cache.fetch(url,auth);status=200;await cache.fetch(url,auth);assert.equal(calls,5);
});
test('in-flight read cannot repopulate cache after invalidation',async()=>{
 let resolve,calls=0;
 const cache=createTeamReadCache(async()=>{calls++;if(calls===1)await new Promise(r=>resolve=r);return Response.json({});},{origin});
 const pending=cache.fetch(url,auth);await Promise.resolve();cache.invalidate();resolve();await pending;await cache.fetch(url,auth);assert.equal(calls,2);
});
test('relative page URLs, unauthenticated and independently cancellable requests bypass cache',async()=>{
 let calls=0;
 const cache=createTeamReadCache(async()=>{calls++;return Response.json({});},{origin,baseURL:'https://site.test/team.html'});
 for(let i=0;i<2;i++){await cache.fetch('/api/chat/channels',auth);await cache.fetch(url);await cache.fetch(url,{...auth,signal:new AbortController().signal});}
 assert.equal(calls,6);
});
