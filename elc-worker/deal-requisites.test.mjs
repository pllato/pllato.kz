import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {handleDealRequisites} from './deal-requisites.js';
test('реквизиты сохраняют текст и файл независимо, проверяют доступ и размер',async()=>{
 const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE deals(id TEXT PRIMARY KEY); INSERT INTO deals VALUES('deal_1')");
 const DB={prepare(sql){return {args:[],bind(...args){this.args=args;return this;},async first(){return db.prepare(sql).get(...this.args);},async all(){return {results:db.prepare(sql).all(...this.args)};},async run(){return db.prepare(sql).run(...this.args);}};},async batch(xs){return Promise.all(xs.map(x=>x.run()));}};
 const objects=new Map();const env={DB,FILES:{async put(k,body){const bytes=await new Response(body).arrayBuffer();objects.set(k,bytes);return {size:bytes.byteLength};},async get(k){const body=objects.get(k);return body?{body,size:body.byteLength}:null;},async delete(k){objects.delete(k);}}};
 const deps={json:(d,status=200)=>Response.json(d,{status}),requireAuthFlexible:async()=>({claims:{}}),resolveCanonicalUser:async()=>({canonicalUid:'manager'}),dealAccessSql:()=>({where:'',params:[]}),canEditRecord:async()=>true,corsHeaders:()=>({})};
 const call=(method,body,headers={},file)=>handleDealRequisites(new Request('https://test/api',{method,body,headers}),env,deps,'deal_1',file);
 assert.equal((await call('PUT',JSON.stringify({text:'БИН 123, счёт KZ…'}))).status,200);
 const upload=await call('POST','hello',{'Content-Length':'5','Content-Type':'text/plain','X-File-Name':'bank.txt'});assert.equal(upload.status,200);const {file}=await upload.json();
 const data=await(await call('GET')).json();assert.equal(data.text,'БИН 123, счёт KZ…');assert.equal(data.files.length,1);
 const download=await call('GET',undefined,{},file.id);assert.equal(await download.text(),'hello');assert.match(download.headers.get('Content-Disposition'),/^attachment/);
 assert.equal((await call('POST','x',{'Content-Length':String(16*1024*1024),'Content-Type':'text/plain'})).status,413);
 deps.canEditRecord=async()=>false;assert.equal((await call('PUT',JSON.stringify({text:'no'}))).status,403);assert.equal((await call('GET')).status,200);
 deps.dealAccessSql=()=>({where:' AND 0=1',params:[]});assert.equal((await call('GET',undefined,{},file.id)).status,403);
});
