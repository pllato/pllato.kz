import {test} from 'node:test';import assert from 'node:assert/strict';
import {validateExecutiveProject,readExecutiveMetadata} from '../app/stroy/dwg/executive-metadata.mjs';
import {createExecutiveProject,createExecutive,addRoute,executiveEntities} from '../app/stroy/dwg/executive-project.mjs';
test('Metadata validates shapes, Unicode and ignores unrecognised fields',()=>{
 const p=createExecutiveProject();createExecutive(p,{id:'a',title:'Квартира',metresPerUnit:.001,paperUnit:2,nativeHandles:['AB']});p.generatedHandles=['BC'];p.untrusted='not code';
 const valid=validateExecutiveProject(p);assert.equal(valid.untrusted,undefined);assert.equal(valid.sheets[0].paperUnit,2);
 p.sheets[0].stamp={organization:'RLS',code:'ИД-01',stage:'ИД',checkedBy:'Проверяющий',approvedBy:'Согласующий'};
 assert.deepEqual(validateExecutiveProject(p).sheets[0].stamp,p.sheets[0].stamp);
 assert.throws(()=>validateExecutiveProject({...p,generatedHandles:['../../bad']}));
 assert.throws(()=>validateExecutiveProject({...p,version:100}));
});
test('Read only the named executive record and reject broken ownership links',()=>{
 const p=createExecutiveProject(),data=new TextEncoder().encode(JSON.stringify(p));
 const db={objects:{DICTIONARY:[{handle:'1',entries:{PLLATO_EXECUTIVE_V1:'2'}},{handle:'2',entries:{PROJECT:'3'}}],XRECORD:[{handle:'3',data:[{code:310,value:data}]}]}};
 assert.deepEqual(readExecutiveMetadata(db),{...p,generatedHandles:[]});db.objects.XRECORD=[];assert.throws(()=>readExecutiveMetadata(db));
 assert.equal(readExecutiveMetadata({}),null);
});
test('More than ten cable groups receive editable continuation sheets',()=>{
 const p=createExecutiveProject();createExecutive(p,{id:'a',metresPerUnit:1,nativeHandles:['1']});
 for(let i=0;i<23;i++)addRoute(p,'a',{id:'r'+i,points:[[0,0],[1,0]],brand:'Кабель '+i,section:'3×2,5'});
 const result=executiveEntities(p,'a');assert.equal(result.ledger.rows.length,23);assert.equal(result.items.filter(i=>i.text?.includes('— ведомость, продолжение')).length,2);
});
test('Separated CAD root metadata retains angle and rejects invalid flags',()=>{
 const p=createExecutiveProject();const s=createExecutive(p,{id:'separate',metresPerUnit:.001,nativeHandles:['A','B']});
 s.nativeSeparated=true;s.nativeBaseAngle=.15;
 const next=validateExecutiveProject(p).sheets[0];assert.equal(next.nativeSeparated,true);assert.equal(next.nativeBaseAngle,.15);
 s.nativeSeparated='yes';assert.throws(()=>validateExecutiveProject(p));s.nativeSeparated=true;s.nativeBaseAngle=Infinity;assert.throws(()=>validateExecutiveProject(p));
});
