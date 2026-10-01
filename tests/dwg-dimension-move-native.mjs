import fs from 'node:fs';import assert from 'node:assert/strict';
import create from '../app/stroy/dwg/vendor/pllato-executive-engine.mjs';
import reader from '../app/stroy/dwg/vendor/libredwg-web.js';import {LibreDwg,Dwg_File_Type} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
import {nativeDocument} from '../app/stroy/dwg/native-adapter.mjs';import {planDimensionMove} from '../app/stroy/dwg/dimension-edit.mjs';import {get} from '../app/stroy/dwg/cad.mjs';
import {readDimensionDefinitions} from '../app/stroy/dwg/native-dimensions.mjs';
const input=fs.readFileSync(process.env.DWG_TEST_FILE),r=await reader({print:()=>{},printErr:()=>{}}),sdk=LibreDwg.createByWasmInstance(r),m=await create({print:()=>{},printErr:()=>{}});
const read=b=>{const p=sdk.dwg_read_data(b,Dwg_File_Type.DWG);try{const db=sdk.convert(p);readDimensionDefinitions(sdk,p,db);return db;}finally{sdk.dwg_free(p);}},all=db=>[...db.entities,...db.tables.BLOCK_RECORD.entries.flatMap(b=>b.entities||[])];
const before=read(input),doc=nativeDocument(before);let candidate;
const detach=process.env.DWG_TEST_DETACH==='1';
for(const e of doc.records){if(e.type!=='DIMENSION'||(detach&&!e.dimensionMoveLocked))continue;try{planDimensionMove(doc,e,[125,-75],{detach});candidate=e;break;}catch{}}
assert.ok(candidate);const handle=get(candidate,5),old=all(before).find(e=>e.handle===handle);
m.FS.writeFile('/in',input);assert.ok(m.ccall('pllato_open','number',['string'],['/in'])<128);
if(detach){assert.equal(m.ccall('pllato_dimension_move','number',['string','number','number'],[handle,125,-75]),5);assert.equal(m.ccall('pllato_dimension_detach','number',['string'],[handle]),0);}
assert.equal(m.ccall('pllato_dimension_move','number',['string','number','number'],[handle,125,-75]),0);
assert.ok(m.ccall('pllato_save','number',['string'],['/out'])<128);
const after=read(m.FS.readFile('/out')),next=all(after).find(e=>e.handle===handle);
if(detach)assert.equal(next.dimensionMoveLocked,false);
for(const key of ['definitionPoint','textPoint','subDefinitionPoint1','subDefinitionPoint2']){assert.ok(Math.abs(next[key].x-old[key].x-125)<1e-6,key);assert.ok(Math.abs(next[key].y-old[key].y+75)<1e-6,key);}
assert.equal(next.measurement,old.measurement);assert.equal(next.text,old.text);
const cache=db=>db.tables.BLOCK_RECORD.entries.find(b=>b.name===old.name).entities;
assert.equal(cache(before).length,cache(after).length);for(const text of cache(before).filter(e=>['TEXT','MTEXT'].includes(e.type))){const next=cache(after).find(e=>e.handle===text.handle);assert.equal(next.text,text.text);assert.equal(next.textHeight,text.textHeight);}
console.log('Native dimension translation/re-read: points moved, value/label/font unchanged PASS',handle);
assert.ok(m.ccall('pllato_open','number',['string'],['/out'])<128);assert.ok(m.ccall('pllato_save','number',['string'],['/out2'])<128);assert.equal(all(read(m.FS.readFile('/out2'))).find(e=>e.handle===handle).measurement,old.measurement);
