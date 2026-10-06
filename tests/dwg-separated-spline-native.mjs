// Optional private fixture: node tests/dwg-separated-spline-native.mjs input.dwg [output-prefix]
import fs from 'node:fs';import assert from 'node:assert/strict';
import create from '../app/stroy/dwg/vendor/pllato-executive-engine.mjs';
import reader from '../app/stroy/dwg/vendor/libredwg-web.js';
import {LibreDwg,Dwg_File_Type} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
const [path,prefix]=process.argv.slice(2),input=fs.readFileSync(path),r=await reader({print:()=>{},printErr:()=>{}}),sdk=LibreDwg.createByWasmInstance(r);
function read(bytes){const p=sdk.dwg_read_data(bytes,Dwg_File_Type.DWG);try{return sdk.convert(p);}finally{sdk.dwg_free(p);}}
const source=read(input).entities.find(e=>e.type==='SPLINE'&&e.controlPoints?.length>1);assert.ok(source,'Fixture needs a SPLINE');
console.log('SOURCE SPLINE',source.handle,source.controlPoints.length);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const [index,angle] of [0,Math.PI/2].entries()){
 const m=await create({print:()=>{},printErr:s=>console.error(s)});m.FS.writeFile('/in.dwg',input);assert.ok(m.ccall('pllato_open','number',['string'],['/in.dwg'])<128);assert.equal(m.ccall('pllato_preserve_source','number',['string'],['/in.dwg']),0);
 assert.equal(m.ccall('pllato_clone_selection','number',['string',...Array(5).fill('number')],[source.handle,0,0,100000,200000,angle]),0);const wrapper=m.FS.readFile('/clone-result.txt',{encoding:'utf8'});assert.equal(m.ccall('pllato_check_separate_sheet','number',['string'],[wrapper]),0);assert.equal(m.ccall('pllato_separate_sheet','number',['string'],[wrapper]),0);
 const members=m.FS.readFile('/ungroup-result.txt',{encoding:'utf8'}).trim().split(',');assert.equal(members.length,1);assert.ok(m.ccall('pllato_save','number',['string'],['/out.dwg'])<128);
 const bytes=m.FS.readFile('/out.dwg');if(prefix)fs.writeFileSync(prefix+'-'+index+'.dwg',bytes,{flag:'wx'});const db=read(bytes),copy=db.entities.find(e=>e.handle===members[0]);assert.equal(copy.type,'SPLINE');for(const key of ['degree','knots','weights','flag'])assert.deepEqual(copy[key],source[key],key);
 for(const key of ['controlPoints','fitPoints']){assert.equal(copy[key]?.length,source[key]?.length);for(let i=0;i<(source[key]?.length||0);i++){const p=source[key][i],q=copy[key][i];near(q.x,Math.cos(angle)*p.x-Math.sin(angle)*p.y+100000);near(q.y,Math.sin(angle)*p.x+Math.cos(angle)*p.y+200000);near(q.z,p.z);}}
 assert.deepEqual(db.entities.find(e=>e.handle===source.handle).controlPoints,source.controlPoints);console.log('PASS separated SPLINE points, knots, weights, type and original geometry:',angle);
}
assert.deepEqual(fs.readFileSync(path),input);
