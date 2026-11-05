import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../app.html',import.meta.url),'utf8');
const code=['orderFinanceWeekTasks','financeTaskReorderItems'].map(name=>{let start=html.indexOf('function '+name+'(');return html.slice(start,html.indexOf('\n}',start)+2)}).join('\n');
const c=vm.createContext({canEditFinanceTask:t=>!t.readonly});vm.runInContext(code,c);
const ids=rows=>Array.from(rows,r=>r.id);
test('moves in both directions and survives reload, keeping starred groups',()=>{
 const tasks=[{id:'a',starred:true},{id:'b',starred:true},{id:'c'},{id:'d'}];
 const updates=c.financeTaskReorderItems(tasks,'b',-1);
 const saved=tasks.map(t=>updates.find(u=>u.id===t.id)||t);
 assert.deepEqual(ids(c.orderFinanceWeekTasks(JSON.parse(JSON.stringify(saved)))),['b','a','c','d']);
 assert.deepEqual(ids(c.financeTaskReorderItems(saved,'b',1)),['a','b']);
 assert.equal(c.financeTaskReorderItems(tasks,'a',-1).length,0);
 assert.equal(c.financeTaskReorderItems(tasks,'b',1).length,0);
});
test('protects permissions, preserves data, puts new tasks after ordered rows',()=>{
 const tasks=[{id:'a',rowOrder:1,text:'keep',done:false},{id:'b',rowOrder:0,starred:false},{id:'new'}];
 assert.deepEqual(ids(c.orderFinanceWeekTasks(tasks)),['b','a','new']);
 assert.equal(c.financeTaskReorderItems(tasks,'a',-1)[0].text,'keep');
 assert.equal(c.financeTaskReorderItems([{id:'a'},{id:'b',readonly:true}],'a',1).length,0);
 assert.equal(c.financeTaskReorderItems(tasks,'a',3).length,0);
});
