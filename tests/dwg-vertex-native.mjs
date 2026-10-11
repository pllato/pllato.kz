// Local-only fixture: edit a normal polyline, save a copy and verify exact geometry.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import createReader from '../app/stroy/dwg/vendor/libredwg-web.js';
import createWriter from '../app/stroy/dwg/vendor/pllato-executive-engine.mjs';
import {LibreDwg} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
import {nativeDocument} from '../app/stroy/dwg/native-adapter.mjs';
import {entityControls} from '../app/stroy/dwg/control-edit.mjs';
const bytes=fs.readFileSync(process.env.DWG_VERTEX_FIXTURE),handle=process.env.DWG_VERTEX_HANDLE;
const reader=await createReader({print:()=>{},printErr:()=>{}}),sdk=LibreDwg.createByWasmInstance(reader);sdk.dwg_dynapi_header_data=()=>undefined;
function read(bytes){reader.FS.writeFile('/in.dwg',bytes);const {data:p}=reader.dwg_read_file('/in.dwg');const {database}=sdk.convertEx(p,true);const doc=nativeDocument(database);sdk.dwg_free(p);return doc;}
const doc=read(bytes),r=doc.records.find(r=>r.id==='dwg-'+handle);assert.equal(r.type,'LWPOLYLINE');const before=entityControls(r);assert.ok(before.length>1);
const [x,y]=before[0].point,writer=await createWriter({print:()=>{},printErr:()=>{}});writer.FS.writeFile('/in.dwg',bytes);assert.ok(writer.ccall('pllato_open','number',['string'],['/in.dwg'])<128);
if(bytes.subarray(0,6).toString()==='AC1032')assert.equal(writer.ccall('pllato_preserve_source','number',['string'],['/in.dwg']),0);
assert.equal(writer.ccall('pllato_vertex','number',['string','number','number','number'],[handle,before.length,x,y]),3,'Out-of-range indices remain rejected');
assert.equal(writer.ccall('pllato_vertex','number',['string','number','number','number'],[handle,0,x+125,y+250]),0,'Implicit standard extrusion must allow vertex edits');
assert.ok(writer.ccall('pllato_save','number',['string'],['/out.dwg'])<128);const output=writer.FS.readFile('/out.dwg');
const after=entityControls(read(output).records.find(r=>r.id==='dwg-'+handle));
assert.deepEqual(after[0].point,[x+125,y+250]);assert.deepEqual(after.slice(1).map(h=>h.point),before.slice(1).map(h=>h.point));
writer._pllato_close();assert.deepEqual(fs.readFileSync(process.env.DWG_VERTEX_FIXTURE),bytes);console.log('PASS polyline vertex edit, bounded index guard, save/reopen, original unchanged');
