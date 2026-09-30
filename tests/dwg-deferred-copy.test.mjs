import test from 'node:test';import assert from 'node:assert/strict';
import {parseDxf,scene,get,move} from '../app/stroy/dwg/cad.mjs';
import {prepareDeferredCopy,addDeferredCopy,deferredAddition,writeDeferredCopies} from '../app/stroy/dwg/deferred-copy.mjs';
import {captureRecovery,replayRecovery} from '../app/stroy/dwg/recovery.mjs';
const fixture=()=>{const doc=parseDxf('0\nSECTION\n2\nBLOCKS\n0\nBLOCK\n2\nPLAN\n10\n0\n20\n0\n0\nLINE\n5\nA\n10\n1\n20\n2\n11\n6\n21\n8\n0\nENDBLK\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nINSERT\n5\nB\n2\nPLAN\n10\n100\n20\n200\n41\n2\n42\n2\n0\nENDSEC\n0\nEOF');for(const r of doc.records)if(get(r,5))r.id='dwg-'+get(r,5);doc.native=true;doc.nativeOps=[];doc.executiveProject={sheets:[{id:'sheet',nativeHandles:['B'],routes:[]}],generatedHandles:[]};return doc;};
test('copy keeps exact CAD records, matrix, recovery and snapshot before later source edits',()=>{
 const doc=fixture(),source=scene(doc).shapes[0],data=prepareDeferredCopy(doc,[{id:'dwg-A',matrix:source.entityMatrix}],doc.executiveProject.sheets[0]),copy=addDeferredCopy(doc,data,[13,17]);
 const expected=source.pts.map(([x,y])=>[x+13,y+17]);assert.deepEqual(scene({...doc,entities:[copy]}).shapes[0].pts,expected);
 move(doc.records.find(r=>r.id==='dwg-A'),50,60);doc.nativeOps.push({handle:'A',dx:50,dy:60});
 assert.deepEqual(scene({...doc,entities:[copy]}).shapes[0].pts,expected);
 const addition=deferredAddition(doc,copy);assert.equal(addition.opIndex,0);assert.deepEqual(addition.transform,[6.5,8.5,0,1,1]);
 const state=captureRecovery(doc),restored=replayRecovery(fixture(),state),r=restored.entities.find(r=>r.deferredCopy);assert.deepEqual(scene({...restored,entities:[r]}).shapes[0].pts,expected);
});
test('native copies run only at their journal position and failed copy is never accepted',()=>{
 const calls=[],m={ccall:(name,...args)=>(calls.push(name),0),FS:{readFile:()=> 'CA'}},item={type:'COPY',opIndex:2,handles:['A'],parent:'B',transform:[0,0,0,1,1],color:256};let result;
 writeDeferredCopies(m,[item],1);assert.equal(calls.length,0);writeDeferredCopies(m,[item],2,(i,h)=>result=h);assert.equal(result,'CA');assert.deepEqual(calls,['pllato_copy_objects']);
 assert.throws(()=>writeDeferredCopies({...m,ccall:()=>3},[item],2),/код 3/);
});
