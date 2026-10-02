import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDrops,dropsTotal,routeDrops,ledgerClipboard} from '../app/stroy/dwg/cable-drops.mjs';
import {createExecutiveProject,createExecutive,addRoute,executiveLedger} from '../app/stroy/dwg/executive-project.mjs';
import {validateExecutiveProject} from '../app/stroy/dwg/executive-metadata.mjs';
test('Drops survive metadata validation and add once without changing geometry',()=>{
 const p=createExecutiveProject();createExecutive(p,{id:'s',metresPerUnit:.001,nativeHandles:['AB']});
 const points=[[0,0],[3000,0]],drops=[{name:'До розетки',metres:1.2},{name:'Запас',metres:2.3}];
 addRoute(p,'s',{id:'r',points,brand:'ВВГ',section:'3×2,5',drops});
 const next=validateExecutiveProject(p),r=next.sheets[0].routes[0];
 assert.deepEqual(r.points,points);assert.deepEqual(r.drops,drops);assert.equal(r.extraMetres,3.5);
 assert.equal(executiveLedger(next).rows[0].length,6.5);
});
test('Drops validate lengths and retain old aggregate values',()=>{
 assert.equal(dropsTotal(Array.from({length:100},()=>({name:'',metres:1}))),100);
 for(const metres of [-1,NaN,Infinity])assert.throws(()=>normalizeDrops([{name:'x',metres}]));
 assert.deepEqual(routeDrops({extraMetres:2}),[{name:'Ранее заданный отпуск',metres:2}]);
 assert.equal(dropsTotal([]),0);
});
test('Clipboard is a three-column tab-separated ledger',()=>{
 assert.equal(ledgerClipboard([{brand:'ВВГ\nнг',section:'3×2,5',length:12.345}]),'Кабель\tСечение\tДлина, м\nВВГ нг\t3×2,5\t12,345');
});
