import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import vm from 'node:vm';
import {restrictedViewer,viewerRequestAllowed,handleAstanaViewer} from './astana-viewer.js';
const pid='pipeline_2zttlx',claims={email:'observer@example.com',email_verified:true},profile={uid:'observer',mode:'astana-readonly'};
const json=(data,status=200)=>Response.json(data,{status});
function fixture(){
 const db=new DatabaseSync(':memory:');db.exec(`CREATE TABLE users(uid,email,name,last_name,active);CREATE TABLE pipelines(id,name,stages);CREATE TABLE contacts(id,name,last_name,phones);CREATE TABLE deals(id,title,stage_id,pipeline_id,custom_fields,comments,source_description,bitrix_date_create,contact_id,responsible_uid);INSERT INTO users VALUES('observer','observer@example.com','Observer','',1),('owner','owner@example.com','Owner','',1);INSERT INTO pipelines VALUES('${pid}','ELC Astana','[{"id":"NEW","name":"Новая заявка","color":"#abcdef"}]');INSERT INTO contacts VALUES('shared','Name','Surname','[{"value":"+77770000000"}]');`);
 const insert=db.prepare('INSERT INTO deals VALUES(?,?,?,?,?,?,?,?,?,?)');insert.run('a','Astana lead','NEW',pid,JSON.stringify({astanaName:'Astana client',astanaNote:'Allowed note',astanaLevel:'Beginner'}),'','WhatsApp','2026-11-27','shared','owner');insert.run('b','SECRET OTHER LEAD','NEW','other','{}','SECRET OTHER NOTE','','2026-11-27','shared','owner');
 const sql=[];const env={DB:{prepare(s){sql.push(s);return{bind(...args){const query=db.prepare(s);return{first:async()=>query.get(...args),all:async()=>({results:query.all(...args)})};}}}}};return{db,env,sql};
}
test('read allowlist denies all mutation verbs and every unrelated endpoint, including WS and query tricks',()=>{
 for(const method of ['POST','PUT','PATCH','DELETE','HEAD'])for(const path of ['/api/me','/api/astana-view','/api/astana/deal/a','/api/rtdb/deals/a.json'])assert.equal(viewerRequestAllowed(new Request('https://test'+path,{method})),false);
 for(const path of ['/api/list/deals?pipeline=other','/api/rtdb/users.json','/api/wa/messages','/api/astana/members','/api/astana/calendar','/api/ws/user?token=x','/api/zoom/recordings','/api/astana-view/../admin/users'])assert.equal(viewerRequestAllowed(new Request('https://test'+path)),false);
 for(const path of ['/api/me','/api/astana-view?pipeline=other'])assert.equal(viewerRequestAllowed(new Request('https://test'+path)),true);
});
test('handler never reads or writes DB for forbidden operations',async()=>{
 const env={DB:{prepare(){throw Error('must not query');}}};const response=await handleAstanaViewer(new Request('https://test/api/astana-view',{method:'POST'}),env,claims,profile,json);assert.equal(response.status,403);
});
test('unverified identities, wrong user and disabled user fail closed',async()=>{
 const f=fixture();try{
 assert.equal((await handleAstanaViewer(new Request('https://test/api/astana-view'),f.env,{...claims,email_verified:false},profile,json)).status,403);
 assert.equal((await handleAstanaViewer(new Request('https://test/api/astana-view'),f.env,{...claims,email:'other@example.com'},profile,json)).status,403);
 f.db.exec("UPDATE users SET active=0 WHERE uid='observer'");assert.equal((await handleAstanaViewer(new Request('https://test/api/me'),f.env,claims,profile,json)).status,403);
 }finally{f.db.close();}
});
test('fixed-pipeline SQL cannot leak shared-contact deals and query injection remains data',async()=>{
 const f=fixture();try{
 const response=await handleAstanaViewer(new Request('https://test/api/astana-view?pipeline=other'),f.env,claims,profile,json);assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store');const data=await response.json();assert.equal(data.total,1);assert.deepEqual(data.items.map(d=>d.id),['a']);assert.equal(data.items[0].note,'Allowed note');assert.equal(data.items[0].phone,'+77770000000');assert.ok(!JSON.stringify(data).includes('SECRET'));
 for(const query of ["%27%20OR%201%3D1--",'%25','SECRET']){const r=await handleAstanaViewer(new Request('https://test/api/astana-view?q='+query),f.env,claims,profile,json);assert.equal((await r.json()).total,0);}
 const me=await(await handleAstanaViewer(new Request('https://test/api/me'),f.env,claims,profile,json)).json();assert.equal(me.role,'viewer');assert.deepEqual(me.orgPerms.pipelineIds,[pid]);assert.equal(me.needsPhone,false);
 }finally{f.db.close();}
});
test('profile config cache is DB-isolated and does not query D1 per ordinary request',async()=>{
 let reads=0;const env={DB:{prepare(){return{bind(){return{first:async()=>{reads++;return{v:JSON.stringify({[claims.email]:profile})};}}}};}}};assert.equal((await restrictedViewer(env,'OBSERVER@example.com')).uid,'observer');assert.equal(await restrictedViewer(env,'staff@example.com'),null);assert.equal(reads,1);
 const other={DB:{prepare(){return{bind(){return{first:async()=>null}}}}}};assert.equal(await restrictedViewer(other,claims.email),null);
});
test('production dispatch blocks observer before any API/WS route and preserves ordinary routing',async()=>{
 const s=fs.readFileSync(new URL('./worker.js',import.meta.url),'utf8');const start=s.indexOf("    if(path.startsWith('/api/')&&request.method!=='OPTIONS')");const end=s.indexOf('    // Чистые публичные адреса',start);assert.ok(start<s.indexOf('if (path === "/api/ws/user")'));
 const ctx=vm.createContext({URL,Response,json,restrictedViewer:async(env,email)=>email===claims.email?profile:null,viewerRequestAllowed,requestClaims:async()=>claims,handleAstanaViewer:async()=>new Response('viewer')});vm.runInContext('async function guard(request,env){const url=new URL(request.url),path=url.pathname;'+s.slice(start,end)+'return new Response("normal");}',ctx);
 for(const path of ['/api/wa/send','/api/ws/user?token=x','/api/rtdb/pipelines.json'])assert.equal((await ctx.guard(new Request('https://test'+path,{headers:{Authorization:'Bearer signed'}}),{})).status,403);
 assert.equal(await(await ctx.guard(new Request('https://test/api/astana-view',{headers:{Authorization:'Bearer signed'}}),{})).text(),'viewer');
 ctx.requestClaims=async()=>({email:'staff@example.com'});assert.equal(await(await ctx.guard(new Request('https://test/api/me',{headers:{Authorization:'Bearer signed'}}),{})).text(),'normal');
});
