// Optional private fixture stays local: node tests/dwg-mirrored-insert-native.mjs input.dwg mirrored-handle
import fs from 'node:fs';
import assert from 'node:assert/strict';
import create from '../app/stroy/dwg/vendor/pllato-executive-engine.mjs';
import reader from '../app/stroy/dwg/vendor/libredwg-web.js';
import {LibreDwg,Dwg_File_Type} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
const [path,handle]=process.argv.slice(2),input=fs.readFileSync(path),r=await reader({print:()=>{},printErr:s=>console.error(s)}),sdk=LibreDwg.createByWasmInstance(r);
function read(bytes){const p=sdk.dwg_read_data(bytes,Dwg_File_Type.DWG);try{return sdk.convert(p);}finally{sdk.dwg_free(p);}}
const source=read(input).entities.find(e=>e.handle.toUpperCase()===handle.toUpperCase());assert.equal(source.type,'INSERT');assert.deepEqual(source.extrusionDirection,{x:0,y:0,z:-1});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const angle of [0,Math.PI/2]){
 const m=await create({print:()=>{},printErr:s=>console.error(s)});
 m.FS.writeFile('/in.dwg',input);assert.ok(m.ccall('pllato_open','number',['string'],['/in.dwg'])<128);assert.equal(m.ccall('pllato_preserve_source','number',['string'],['/in.dwg']),0);
 assert.equal(m.ccall('pllato_clone_selection','number',['string',...Array(5).fill('number')],[handle,0,0,100000,200000,angle]),0);
 const wrapper=m.FS.readFile('/clone-result.txt',{encoding:'utf8'});
 assert.equal(m.ccall('pllato_separate_sheet','number',['string'],[wrapper]),0);
 const members=m.FS.readFile('/ungroup-result.txt',{encoding:'utf8'}).trim().split(',');assert.equal(members.length,1);
 assert.ok(m.ccall('pllato_save','number',['string'],['/out.dwg'])<128);
 const db=read(m.FS.readFile('/out.dwg')),copied=db.entities.find(e=>e.handle===members[0]);assert.equal(copied.type,'INSERT');assert.deepEqual(copied.extrusionDirection,source.extrusionDirection);assert.deepEqual(copied.scale,source.scale);
 const x=source.insertionPoint.x,y=source.insertionPoint.y;near(copied.insertionPoint.x,Math.cos(angle)*x+Math.sin(angle)*y-100000);near(copied.insertionPoint.y,-Math.sin(angle)*x+Math.cos(angle)*y+200000);near(Math.atan2(Math.sin(copied.rotation-source.rotation+angle),Math.cos(copied.rotation-source.rotation+angle)),0);const unchanged=db.entities.find(e=>e.handle===source.handle);for(const key of ['type','insertionPoint','rotation','extrusionDirection','scale','blockRecordId'])assert.deepEqual(unchanged[key],source[key],'Original INSERT geometry changed: '+key);
 console.log('PASS mirrored INSERT world position, rotation, normal, scale, original preservation:',angle);
}
assert.deepEqual(fs.readFileSync(path),input,'Original file changed');
