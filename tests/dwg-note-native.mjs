import fs from 'node:fs';
import assert from 'node:assert/strict';
import create from '../app/stroy/dwg/vendor/pllato-executive-engine.mjs';
import reader from '../app/stroy/dwg/vendor/libredwg-web.js';
import {LibreDwg,Dwg_File_Type} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
const input=fs.readFileSync(process.env.DWG_TEST_FILE),m=await create({print:()=>{},printErr:()=>{}}),r=await reader({print:()=>{},printErr:()=>{}}),sdk=LibreDwg.createByWasmInstance(r);
const read=bytes=>{const p=sdk.dwg_read_data(bytes,Dwg_File_Type.DWG);try{return sdk.convert(p);}finally{sdk.dwg_free(p);}};
const all=db=>[...db.entities,...db.tables.BLOCK_RECORD.entries.flatMap(b=>b.entities||[])];
const before=read(input),note=all(before).find(e=>e.type==='MTEXT'&&/Труба/.test(e.text));assert.ok(note,'MTEXT fixture required');
m.FS.writeFile('/in.dwg',input);assert.ok(m.ccall('pllato_open','number',['string'],['/in.dwg'])<128);
const text='{\\C7;Труба ПНД %%C16мм\\PИзменённая запись}';
assert.equal(m.ccall('pllato_text','number',['string','string'],[note.handle,text]),0);
assert.equal(m.ccall('pllato_text_height','number',['string','number'],[note.handle,275]),0);
assert.equal(m.ccall('pllato_text_height','number',['string','number'],[note.handle,-1]),1);
assert.ok(m.ccall('pllato_save','number',['string'],['/out.dwg'])<128);
const after=read(m.FS.readFile('/out.dwg')),changed=all(after).find(e=>e.handle===note.handle);
assert.equal(changed.text,text);assert.equal(changed.textHeight,275);
assert.equal(all(before).length,all(after).length);
// SDK REVIT xdata decoding is unstable even on repeated reads; compare the
// complete text/geometry/style record here, not its unrelated xdata projection.
const comparable=({xdata,...rest})=>rest;
for(const other of all(before).filter(e=>e.type==='MTEXT'&&e.handle!==note.handle))assert.deepEqual(comparable(all(after).find(e=>e.handle===other.handle)),comparable(other));
console.log('MTEXT native write/read: text, Cyrillic, newline, height and other notes unchanged PASS');
