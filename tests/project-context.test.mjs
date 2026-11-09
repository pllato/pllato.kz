import {test} from 'node:test';
import assert from 'node:assert/strict';
import {linkedTasks,contactInfo} from '../app/project-context.js';
test('project and CRM links resolve once, moved/deleted/completed tasks are excluded',()=>{
 const tasks=[{id:'a',sourceProjectId:'p',crmDealId:'deal_123',start:2},{id:'b',crmDealId:'123',start:1},{id:'c',sourceProjectId:'other'},{id:'d',sourceProjectId:'p',done:true},{id:'e',sourceProjectId:'p',deleted:true},{id:'f',sourceProjectId:'p',movedToStart:12}];
 assert.deepEqual(linkedTasks(tasks,'p',['deal_123']).map(t=>t.id),['b','a']);
 assert.equal(linkedTasks(tasks,'other',[]).length,1);
});
test('primary contact accepts CRM phone formats without guessing names',()=>{
 assert.deepEqual(contactInfo({name:'Иван',lastName:'Петров',phones:[{VALUE:'+7 701 123 45 67'}]}),{name:'Иван Петров',phone:'+7 701 123 45 67'});
 assert.deepEqual(contactInfo(null),{name:'',phone:''});
 assert.equal(contactInfo({phones:[{value:'+7701'}]}).phone,'+7701');
});
