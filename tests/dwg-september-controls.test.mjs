import test from 'node:test';
import assert from 'node:assert/strict';
import {entityControls,setEntityVertex,previewEntity} from '../app/stroy/dwg/control-edit.mjs';
import {parseCableTable} from '../app/stroy/dwg/table-paste.mjs';
import {createExecutiveProject,createExecutive,addRoute,addLeader,executiveEntities} from '../app/stroy/dwg/executive-project.mjs';
test('LINE and polyline vertices edit exactly without flattening',()=>{
 const line={id:'a',type:'LINE',pairs:[[10,1],[20,2],[11,3],[21,4]]};
 const handles=entityControls(line);assert.equal(handles.length,2);
 assert.deepEqual(previewEntity(line,handles[1],[8,9]).at(-1),[8,9]);assert.equal(line.pairs[2][1],3);
 setEntityVertex(line,1,8,9);assert.deepEqual(entityControls(line)[1].point,[8,9]);
 const poly={id:'p',type:'LWPOLYLINE',pairs:[[10,0],[20,0],[42,.5],[10,10],[20,10]]};setEntityVertex(poly,1,12,13);
 assert.equal(poly.pairs[2][1],.5);assert.deepEqual(entityControls(poly)[1].point,[12,13]);
});
test('Excel clipboard table accepts decimals and rejects invalid rows',()=>{
 assert.deepEqual(parseCableTable('Марка\tСечение\tДлина\nВВГ\t3×2,5\t12,4'),[{brand:'ВВГ',section:'3×2,5',length:12.4}]);
 assert.throws(()=>parseCableTable('ВВГ\t3×2,5\t=1+2'));assert.throws(()=>parseCableTable('ВВГ\t3×2,5\t-1'));
});
test('new leaders use 1.4 mm and title is centered',()=>{
 const p=createExecutiveProject();createExecutive(p,{id:'s',title:'Исполнительная',metresPerUnit:.001});
 addRoute(p,'s',{id:'r',points:[[0,0],[10,10]],brand:'ВВГ',section:'3×2,5'});
 addLeader(p,'s','r',{id:'l',anchor:[0,0],elbow:[1,1],label:[2,2]});
 assert.equal(p.sheets[0].routes[0].leaders[0].textHeight,1.4);
 assert.equal(executiveEntities(p,'s').items.find(i=>i.text==='Исполнительная').align,1);
});
