import test from 'node:test';
import assert from 'node:assert/strict';
import {createExecutiveProject,createExecutive,executiveEntities} from '../app/stroy/dwg/executive-project.mjs';
import {validateExecutiveProject} from '../app/stroy/dwg/executive-metadata.mjs';
import {stampLabels,stampChoices} from '../app/stroy/dwg/stamp-fields.mjs';
import {stampCells,STAMP_WIDTH,STAMP_HEIGHT,fitStampText} from '../app/stroy/dwg/executive-stamp.mjs';
test('reference stamp is a complete non-overlapping 185 by 55 grid',()=>{const cells=stampCells();assert.equal(cells.reduce((sum,c)=>sum+c.w*c.h,0),STAMP_WIDTH*STAMP_HEIGHT);for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++){const a=cells[i],b=cells[j];assert.ok(Math.min(a.x+a.w,b.x+b.w)<=Math.max(a.x,b.x)||Math.min(a.y+a.h,b.y+b.h)<=Math.max(a.y,b.y));}assert.deepEqual(cells.filter(c=>c.key?.startsWith('revision')).length,24);assert.ok(Object.keys(stampLabels).every(k=>cells.some(c=>c.key===k)));const org=cells.find(c=>c.key==='organization');assert.deepEqual([org.x,org.y,org.w,org.h],[135,40,50,15]);});
test('reference text fits project address and respects manual line breaks',()=>{const cell=stampCells().find(c=>c.key==='project'),value='Многоквартирный жилой комплекс со встроенными, встроенно-пристроенными помещениями расположенный по адресу: город, район, микрорайон, улица, участок (без наружных инженерных сетей)',f=fitStampText(value,cell);assert.ok(f.lines.length*f.size*1.25<cell.h-1);assert.ok(f.lines.length>=2);assert.deepEqual(fitStampText('Розеточная сеть.\nПлан 6-го этажа',stampCells().find(c=>c.key==='drawing')).lines,['Розеточная сеть.','План 6-го этажа']);});
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
