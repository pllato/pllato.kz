import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {managerStageError,managerPatchError} from './manager-stage-gate.js';
const source=readFileSync(new URL('./worker.js',import.meta.url),'utf8');
function fixture(){
 const db=new DatabaseSync(':memory:');db.exec(`CREATE TABLE pipelines(id TEXT,name TEXT,stages TEXT);
 INSERT INTO pipelines VALUES('start','Pllato Старт','{"NEW":{"name":"Новая"},"NEXT":{"name":"Следующая"}}'),('elc','ELC','{"NEW":{"name":"Новая"},"NEXT":{"name":"Следующая"}}');
 CREATE TABLE deals(id TEXT PRIMARY KEY,pipeline_id TEXT,stage_id TEXT,mirrored_in TEXT,responsible_uid TEXT,custom_fields TEXT,reject_reason TEXT,bitrix_date_modify TEXT,stage_changed_at TEXT);
 INSERT INTO deals(id,pipeline_id,stage_id,custom_fields) VALUES('deal_1','start','NEW','{}');`);
 const env={DB:{prepare(sql){let args=[];return{bind(...a){args=a;return this;},async first(){return db.prepare(sql).get(...args)||null;},async run(){return db.prepare(sql).run(...args);},async all(){return{results:db.prepare(sql).all(...args)};}};}}};
 const c=vm.createContext({Request,Response,console,managerStageError,managerPatchError,
 requireAuthFlexible:async()=>({claims:{}}),resolveCanonicalUser:async()=>({role:'admin'}),canEditRecord:async()=>true,canChangeAnyDealStage:()=>false,
 json:(v,s)=>Response.json(v,{status:s}),ensureStageChangedAtColumn:async()=>{},logStageEvent:async()=>{},auditLog:async()=>{},AUTOMATIC_PRODUCTION_ENABLED:false,DEMO_BUILD_STAGE_RE:/^demo$/,INVOICE_BUILD_STAGE_RE:/^invoice$/,LPR_FOUND_STAGE_RE:/^lpr$/});
 const start=source.indexOf('async function handleDealStageChange('),end=source.indexOf('// POST /api/deals/{id}/mirror',start);vm.runInContext(source.slice(start,end),c);
 return {db,env,deal:()=>db.prepare('SELECT * FROM deals').get(),move:(pipelineId='start',stageId='NEXT')=>c.handleDealStageChange(new Request('https://test',{method:'PATCH',body:JSON.stringify({pipelineId,stageId})}),env,'deal_1'),bulk:body=>c.handleDealsBulkUpdate(new Request('https://test',{method:'POST',body:JSON.stringify({dealIds:['deal_1'],pipelineId:'start',stageId:'NEXT',...body})}),env)};
}
test('Pllato Старт: ни один / только один менеджер блокируют переход даже админа',async()=>{
 for(const [lead,kep,expected] of [[null,null,2],['a',null,1],[null,'b',1]]){
  const f=fixture();f.db.prepare('UPDATE deals SET responsible_uid=?,custom_fields=?').run(lead,JSON.stringify({kepManagerUid:kep}));
  const response=await f.move();assert.equal(response.status,422);const body=await response.json();assert.equal(body.code,'MANAGERS_REQUIRED');assert.equal(body.missing.length,expected);assert.equal(f.deal().stage_id,'NEW');
 }
});
test('оба менеджера разрешают переход, включая одного человека в двух ролях',async()=>{const f=fixture();f.db.exec(`UPDATE deals SET responsible_uid='a',custom_fields='{"kepManagerUid":"a"}'`);assert.equal((await f.move()).status,200);assert.equal(f.deal().stage_id,'NEXT');});
test('другая воронка не требует менеджеров',async()=>{const f=fixture();f.db.exec("UPDATE deals SET pipeline_id='elc'");assert.equal((await f.move('elc')).status,200);assert.equal(f.deal().stage_id,'NEXT');});
test('повтор текущей стадии не блокируется',async()=>{const f=fixture();assert.equal((await f.move('start','NEW')).status,200);});
test('стадия зеркала Старт проверяется независимо от основной воронки',async()=>{const f=fixture();f.db.exec(`UPDATE deals SET pipeline_id='elc',mirrored_in='{"start":"NEW"}'`);assert.equal((await f.move()).status,422);assert.equal(f.deal().mirrored_in,'{"start":"NEW"}');assert.equal((await f.move('elc')).status,200);});
test('массовый перенос оставляет незаполненные сделки на месте',async()=>{const f=fixture();const data=await(await f.bulk({})).json();assert.equal(data.updated,0);assert.equal(data.failed.length,1);assert.match(data.failed[0].error,/Менеджер КЭПов/);assert.equal(f.deal().stage_id,'NEW');});
test('массовый перенос с одновременным сбросом менеджера запрещён',async()=>{const f=fixture();f.db.exec(`UPDATE deals SET responsible_uid='a',custom_fields='{"kepManagerUid":"b"}'`);const data=await(await f.bulk({setResponsible:true,responsibleUid:null})).json();assert.equal(data.updated,0);assert.equal(f.deal().stage_id,'NEW');assert.equal(f.deal().responsible_uid,'a');});
test('прямой PATCH защищён; заполнение менеджеров в том же запросе разрешено',async()=>{const f=fixture();for(const p of [{stageId:'NEXT'},{stage_id:'NEXT'},{mirroredIn:{start:'NEXT'}}])assert.equal((await managerPatchError(f.env,f.deal(),p)).code,'MANAGERS_REQUIRED');assert.equal(await managerPatchError(f.env,f.deal(),{stageId:'NEXT',responsibleUid:'a',customFields:{kepManagerUid:'b'}}),null);assert.equal(await managerPatchError(f.env,f.deal(),{title:'New title'}),null);});
test('пустые строки и повреждённые поля не обходят проверку',async()=>{const f=fixture();assert.equal((await managerStageError(f.env,{...f.deal(),responsible_uid:'  ',custom_fields:'bad'},'start','NEXT')).missing.length,2);});
