import fs from 'node:fs';
import assert from 'node:assert/strict';
import reader from '../app/stroy/dwg/vendor/libredwg-web.js';
import {LibreDwg,Dwg_File_Type} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
const {default:create}=await import(process.env.DWG_EXECUTIVE_MODULE);
const input=fs.readFileSync(process.env.DWG_CLONE_FIXTURE);
const m=await create({print:()=>{},printErr:()=>{}}),r=await reader({print:()=>{},printErr:()=>{}}),sdk=LibreDwg.createByWasmInstance(r);
const read=bytes=>{const p=sdk.dwg_read_data(bytes,Dwg_File_Type.DWG);try{return sdk.convert(p);}finally{sdk.dwg_free(p);}};
const original=read(input),root=original.entities.find(e=>e.type==='INSERT');
m.FS.writeFile('/in.dwg',input);assert.ok(m.ccall('pllato_open','number',['string'],['/in.dwg'])<128);
assert.equal(m.ccall('pllato_clone_selection','number',['string',...Array(5).fill('number')],[root.handle,0,0,1000,2000,Math.PI/2]),0);
const copyHandle=m.FS.readFile('/clone-result.txt',{encoding:'utf8'});
assert.ok(m.ccall('pllato_save','number',['string'],['/out.dwg'])<128);
const result=read(m.FS.readFile('/out.dwg')),copy=result.entities.find(e=>e.handle===copyHandle);
assert.deepEqual(result.entities.find(e=>e.handle===root.handle),root);
for(const originalBlock of original.tables.BLOCK_RECORD.entries.filter(b=>['PLAN','DEVICE'].includes(b.name)))assert.deepEqual(result.tables.BLOCK_RECORD.entries.find(b=>b.handle===originalBlock.handle),originalBlock);
assert.equal(copy.insertionPoint.x,1000);assert.equal(copy.insertionPoint.y,2000);assert.equal(copy.rotation,Math.PI/2);
const group=result.tables.BLOCK_RECORD.entries.find(b=>b.handle===copy.blockRecordId);
assert.equal(group.entities.length,1);assert.equal(group.entities[0].type,'INSERT');assert.equal(group.entities[0].ownerBlockRecordSoftId,group.handle);
assert.notEqual(group.entities[0].blockRecordId,root.blockRecordId);
const copiedPlan=result.tables.BLOCK_RECORD.entries.find(b=>b.handle===group.entities[0].blockRecordId);
const device=copiedPlan.entities.find(e=>e.type==='INSERT');
assert.equal(m.ccall('pllato_move','number',['string','number','number'],[device.handle,12,34]),0);
// Creation, deletion and metadata replacement must survive a second save.
assert.equal(m.ccall('pllato_add_line','number',Array(4).fill('number'),[1,2,3,4]),0);
const added=m.ccall('pllato_last_handle','string',[],[]);
assert.equal(m.ccall('pllato_remove','number',['string'],[added]),0);
for(const text of ['{"version":1,"title":"Первый"}','{"version":1,"title":"Второй"}']){
 const bytes=new TextEncoder().encode(text);assert.equal(m.ccall('pllato_executive_metadata','number',['array','number'],[bytes,bytes.length]),0);
}
assert.ok(m.ccall('pllato_save','number',['string'],['/updated.dwg'])<128);
const updated=read(m.FS.readFile('/updated.dwg'));
const moved=updated.tables.BLOCK_RECORD.entries.flatMap(b=>b.entities||[]).find(e=>e.handle===device.handle);
assert.equal(moved.insertionPoint.x,device.insertionPoint.x+12);
for(let i=0;i<device.attribs.length;i++){assert.equal(moved.attribs[i].text.startPoint.x,device.attribs[i].text.startPoint.x+12);assert.equal(moved.attribs[i].text.startPoint.y,device.attribs[i].text.startPoint.y+34);}
assert.ok(!updated.entities.some(e=>e.handle===added));
assert.equal(updated.objects.XRECORD.length,1);
const stored=new TextDecoder().decode(Uint8Array.from(updated.objects.XRECORD[0].data.flatMap(x=>Array.from(x.value))));
assert.equal(JSON.parse(stored).title,'Второй');
assert.equal(m.ccall('pllato_remove','number',['string'],[device.handle]),0);
assert.ok(m.ccall('pllato_save','number',['string'],['/removed.dwg'])<128);
const removed=read(m.FS.readFile('/removed.dwg'));
assert.ok(!removed.tables.BLOCK_RECORD.entries.flatMap(b=>b.entities||[]).some(e=>e.handle===device.handle));
assert.deepEqual(removed.entities.find(e=>e.handle===root.handle),root);
m._pllato_close();console.log('PASS native executive group, rotation, independent block ownership');
