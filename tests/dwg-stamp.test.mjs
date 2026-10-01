import test from 'node:test';
import assert from 'node:assert/strict';
import {createExecutiveProject,createExecutive,executiveEntities} from '../app/stroy/dwg/executive-project.mjs';
import {validateExecutiveProject} from '../app/stroy/dwg/executive-metadata.mjs';
import {stampLabels,stampChoices} from '../app/stroy/dwg/stamp-fields.mjs';
test('stamp fields survive metadata validation and become export TEXT entities',()=>{
 const p=createExecutiveProject(),s=createExecutive(p,{id:'s',metresPerUnit:1});
 s.stamp=Object.fromEntries(Object.keys(stampLabels).map(k=>[k,'value-'+k]));
 const restored=validateExecutiveProject(JSON.parse(JSON.stringify(p)));
 assert.deepEqual(restored.sheets[0].stamp,s.stamp);
 const texts=executiveEntities(restored,'s').items.filter(i=>i.type==='TEXT').map(i=>i.text).join('\n');
 for(const key of ['contractor','checkedBy','approvedBy','contractorSignature','checkedSignature','approvedSignature','date','checkedDate','approvedDate','organization'])assert.ok(texts.includes('value-'+key),key);
 s.stamp.checkedDate=42;assert.throws(()=>validateExecutiveProject(p),/штамп/);
});
test('suggestions reuse staff across roles and retain defaults',()=>{
 assert.deepEqual(stampChoices('checkedBy',[{stamp:{contractor:'Иванов',approvedBy:'Иванов',checkedBy:'Петров'}}]),['Иванов','Петров']);
 assert.deepEqual(stampChoices('approvedRole',[]),['Выполнил','Проверил','Согласовал']);
});
