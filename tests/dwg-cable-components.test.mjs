import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cableChain} from '../app/stroy/dwg/cable-chain.mjs';
import {cableCandidates} from '../app/stroy/dwg/cable-components.mjs';
const url=new URL('../app/stroy/dwg/cable-chain.mjs',import.meta.url);
const source=(await readFile(url,'utf8')).replace(/from '([^']+)'/g,(_,p)=>`from '${new URL(p,url)}'`).replace('hidden.has(seed.layer)?[]:cableCandidates(shapes,seed)',`shapes.filter(s=>!hidden.has(s.layer)&&s.layer===seed.layer&&s.color===seed.color&&s.rgb===seed.rgb)`);
const {cableChain:reference}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const line=(i,a,b)=>({id:''+i,entityId:''+i,entityKey:''+i,entityType:'LINE',layer:'ЭЛ',color:5,text:null,pts:[a,b],bounds:[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])]});
test('component broad phase matches full-layer chain including gaps, duplicates and branches',()=>{
 const shapes=[];for(let i=0;i<50;i++){const x=i*100;shapes.push(line(shapes.length,[x,0],[x+10,0]),line(shapes.length+1,[x+9.9,0],[x+20,0]),line(shapes.length+2,[x+20,0],[x+20,10]));if(i%3===0)shapes.push(line(shapes.length,[x+20,0],[x+30,0]));if(i%4===0)shapes.push(line(shapes.length,[x,0],[x+10,0]));}
 const result=chain=>({ids:chain.map(s=>s.id),paths:chain.paths,duplicates:chain.coincident?.map(s=>s.id),overlaps:chain.overlaps});
 for(const seed of shapes)assert.deepEqual(result(cableChain(shapes,seed)),result(reference(shapes,seed)));
});
test('selection does not build matrix/style buckets for unrelated objects',()=>{
 const seed=line('seed',[0,0],[10,0]),other=line('other',[10,0],[20,0]);other.layer='wall';Object.defineProperty(other,'deviceId',{get(){throw Error('unrelated instance must not be indexed');}});
 assert.deepEqual(cableCandidates([seed,other],seed),[seed]);
});
