import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createExecutiveProject,createExecutive,executiveEntities} from '../app/stroy/dwg/executive-project.mjs';
import {executivePages,executiveLooseRoots,imagePdf} from '../app/stroy/dwg/executive-export.mjs';
const fixture=()=>{const p=createExecutiveProject();for(const [id,x,h] of [['a',0,'AA'],['b',1000,'BB']])createExecutive(p,{id,origin:[x,0],nativeHandles:[h],metresPerUnit:1,paperUnit:1});return p;};
const shape=(id,bounds)=>({id,bounds});
test('Executive PDF bounds stay at the sheet edges even for overflowing native geometry',()=>{
 const p=fixture(),pages=executivePages(p,[shape('dwg-AA',[-500,-500,900,900])]);
 assert.deepEqual(pages[0].bounds,[0,0,420,297]);
 assert.equal(pages[0].shapes.length,1);
});
test('Executive pages isolate native roots, decorations and standalone annotations',()=>{
 const p=fixture(),n=executiveEntities(p,'a').items.length,shapes=[shape('dwg-AA',[0,0,420,297]),shape('dwg-BB',[1000,0,1420,297]),shape('dwg-original',[-900,0,-500,300]),shape('executive-0',[0,0,1,1]),shape('executive-'+n,[1000,0,1001,1]),shape('new-text',[10,10,20,20])];
 const pages=executivePages(p,shapes);assert.equal(pages.length,2);assert.deepEqual(pages[0].shapes.map(s=>s.id),['dwg-AA','executive-0','new-text']);assert.deepEqual(pages[1].shapes.map(s=>s.id),['dwg-BB','executive-'+n]);
});
test('Loose root assignment never selects only a fragment or ambiguous overlapping sheets',()=>{
 const p=fixture();assert.equal(executiveLooseRoots(p,[shape('new-line',[20,20,30,30]),shape('new-line',[400,20,500,30])]).size,0);p.sheets[1].origin=[0,0];assert.equal(executiveLooseRoots(p,[shape('new-text',[20,20,30,30])]).size,0);assert.throws(()=>executivePages({sheets:[]},[]));
});
test('PDF emits independent pages with byte-accurate xref offsets',async()=>{
 const pdf=imagePdf([1,2].map(()=>({width:1,height:1,bytes:new Uint8Array([255,216,255,217])}))),bytes=new Uint8Array(await pdf.arrayBuffer()),text=new TextDecoder().decode(bytes);assert.equal(pdf.type,'application/pdf');assert.match(text,/\/Count 2/);assert.equal((text.match(/\/Type \/Page /g)||[]).length,2);const rows=text.split('xref\n')[1].split('\n').slice(2,10);for(let i=0;i<rows.length;i++){const offset=Number(rows[i].slice(0,10));assert.equal(new TextDecoder().decode(bytes.slice(offset,offset+7)),`${i+1} 0 obj`);}
});
