import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {insertChartTaskIfAbsent} from '../chart-task-create.js';
test('atomic insert preserves completion, deletion and moves on retry and isolates teams',async()=>{
 const sql=new DatabaseSync(':memory:');
 sql.exec('CREATE TABLE store(team_id TEXT,collection TEXT,id TEXT,data TEXT,created_at INTEGER,updated_at INTEGER,PRIMARY KEY(team_id,collection,id))');
 const db={prepare(query){return {bind(...args){return {run:async()=>sql.prepare(query).run(...args)};}};}};
 for(const state of [{done:true},{deleted:true},{movedToStart:123}]){
  const item={id:JSON.stringify(state),createdAt:1,...state};
  await insertChartTaskIfAbsent(db,'team',item);
  await Promise.all(Array.from({length:5},()=>insertChartTaskIfAbsent(db,'team',{id:item.id,createdAt:2,done:false})));
  assert.deepEqual(JSON.parse(sql.prepare('SELECT data FROM store WHERE id=? AND team_id=?').get(item.id,'team').data),item);
  await insertChartTaskIfAbsent(db,'other',{id:item.id,createdAt:2});
 }
 assert.equal(sql.prepare('SELECT count(*) AS n FROM store').get().n,6);
 sql.close();
});
