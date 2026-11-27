import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';
import {defaultAdminScale,validateAdminScale,handleAdminScale,canUseAdminScale} from '../admin-scale.js';
class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
const admin={email:'owner@example.com',isAdmin:true,user:{apps:{}}},staff={email:'staff@example.com',user:{apps:{admin_scale:true}}},denied={email:'viewer@example.com',user:{apps:{}}};
const req=(body,method='PUT')=>new Request('https://test/admin-scale',{method,...(method==='PUT'?{body:JSON.stringify(body)}:{})});
test('ten blank PDF-based sections, fresh immutable defaults, archive and custom titles are supported',()=>{
 const doc=defaultAdminScale();assert.equal(doc.sections.length,10);assert.equal(doc.sections[0].title,'Долгосрочные цели');assert.equal(doc.sections.at(-1).title,'Ценные конечные продукты');assert.ok(doc.sections.every(s=>s.items.length===0));doc.sections[0].title='Свой раздел';doc.sections[0].items.push({id:'note',text:'Наша цель',archived:true});assert.equal(validateAdminScale(doc)[0].title,'Свой раздел');assert.equal(defaultAdminScale().sections[0].title,'Долгосрочные цели');
});
test('unauthorized access is denied before DB reads, explicit flag grants access and unsupported verbs are denied',async()=>{
 assert.equal(canUseAdminScale(denied),false);assert.equal(canUseAdminScale(staff),true);assert.equal(canUseAdminScale({isAdmin:true,user:null}),false);
 const deps={HttpError,get:()=>{throw Error('must not read');}};await assert.rejects(handleAdminScale(req(null,'GET'),{},denied,deps),e=>e.status===403);await assert.rejects(handleAdminScale(req(null,'DELETE'),{},admin,deps),e=>e.status===405);
});
test('invalid payloads, duplicates, oversized text and invalid revisions are rejected without writing',async()=>{
 const deps={HttpError,get:async()=>null,save:()=>{throw Error('must not save');}};
 for(const alter of [d=>d.revision=-1,d=>d.sections[0].title='',d=>d.sections.push(d.sections[0]),d=>d.sections[0].items.push({id:'item',text:'x'.repeat(10001),archived:false}),d=>d.sections[0].items.push({id:'item',text:'x',archived:'no'})]){const d=defaultAdminScale();alter(d);await assert.rejects(handleAdminScale(req(d),{},admin,deps),e=>e.status===400);}
 await assert.rejects(handleAdminScale(new Request('https://test/admin-scale',{method:'PUT',body:'x'.repeat(250001)}),{},admin,deps),e=>e.status===413);
});
test('real store compare-and-swap prevents stale overwrite and round-trips edits/order/archive',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE store(team_id,collection,id,data,created_at,updated_at,PRIMARY KEY(team_id,collection,id));');
 const source=fs.readFileSync(new URL('../worker.js',import.meta.url),'utf8');const sql=source.match(/prepare\("(INSERT INTO store\(team_id,collection,id,data,created_at,updated_at\).*?)"\)/)[1];
 const deps={HttpError,get:async()=>{const row=db.prepare('SELECT data FROM store WHERE id=?').get('scale');return row?JSON.parse(row.data):null;},save:async(env,doc,revision)=>db.prepare(sql).run('team','_admin_scale_private','scale',JSON.stringify(doc),doc.updatedAt,doc.updatedAt,revision).changes>0};
 try{const original=(await handleAdminScale(req(null,'GET'),{},staff,deps)).scale;const change=structuredClone(original);change.sections[0].items.push({id:'entry',text:'Проверяем сохранение',archived:false});assert.equal((await handleAdminScale(req(change),{},staff,deps)).revision,1);await assert.rejects(handleAdminScale(req(original),{},admin,deps),e=>e.status===409);
 const saved=(await handleAdminScale(req(null,'GET'),{},admin,deps)).scale;saved.sections.reverse();saved.sections.at(-1).items[0].archived=true;await handleAdminScale(req(saved),{},admin,deps);const read=(await handleAdminScale(req(null,'GET'),{},staff,deps)).scale;assert.equal(read.revision,2);assert.equal(read.sections.at(-1).items[0].archived,true);assert.equal(read.updatedBy,admin.email);
 assert.equal(await deps.save({},original,0),false);
 }finally{db.close();}
});
test('private collection is blocked in generic store pull and push',()=>{
 const s=fs.readFileSync(new URL('../worker.js',import.meta.url),'utf8');assert.match(s,/collections\.includes\(ADMIN_SCALE_COLLECTION\).*HttpError\(403/);assert.match(s,/collection === ADMIN_SCALE_COLLECTION\).*HttpError\(403/);assert.match(s,/path==='\/admin-scale'[\s\S]*?strictTeamCheck:true/);
});
