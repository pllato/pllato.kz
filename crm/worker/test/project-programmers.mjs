import assert from 'node:assert/strict';
import {handleProjectProgrammers} from '../project-programmers.js';
class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
const rows=new Map(),deps={HttpError,put:async(_,c,row)=>rows.set(row.id,row),list:async()=>[...rows.values()]};
const admin={email:'admin@test.kz',user:{isAdmin:true}},viewer={email:'viewer@test.kz',user:{}};
const call=(actor,method='GET',body)=>handleProjectProgrammers(new Request('https://test/project-programmers',{method,...(body?{body:JSON.stringify(body)}:{})}),{},actor,deps);
await assert.rejects(()=>call(viewer,'PUT',{projectId:'demo',programmerEmail:'dev@test.kz'}),e=>e.status===403);
await call(admin,'PUT',{projectId:'demo',programmerEmail:'DEV@test.kz'});
assert.deepEqual(await call(viewer),{canManage:false,programmers:{demo:'dev@test.kz'}});
await call(admin,'PUT',{projectId:'other',programmerEmail:'second@test.kz'});
await call(admin,'PUT',{projectId:'demo',programmerEmail:''});
assert.deepEqual((await call(viewer)).programmers,{demo:'',other:'second@test.kz'});
assert.equal(rows.get('programmer:demo').updatedBy,admin.email);
await assert.rejects(()=>call(admin,'PUT',{projectId:'../invalid'}),e=>e.status===400);
await assert.rejects(()=>call(admin,'PUT',{projectId:'demo',programmerEmail:'bad'}),e=>e.status===400);
console.log('Project programmers: ACL, persistence, normalization, isolation, clearing and validation passed');
