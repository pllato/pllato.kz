// Use the synthetic output of tests/native/color-handle-regression.c.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import reader from '../app/stroy/dwg/vendor/libredwg-web.js';
import {LibreDwg,Dwg_File_Type} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
const m=await reader({print:()=>{},printErr:()=>{}}),sdk=LibreDwg.createByWasmInstance(m);
const ptr=sdk.dwg_read_data(fs.readFileSync(process.env.DWG_COLOR_FIXTURE),Dwg_File_Type.DWG);
assert.ok(ptr);
try{
 sdk.dwg_dynapi_header_data=()=>undefined;
 const {database:db}=sdk.convertEx(ptr,true),blocks=new Map(db.tables.BLOCK_RECORD.entries.map(b=>[b.handle,b]));
 const inserts=db.tables.BLOCK_RECORD.entries.flatMap(b=>b.entities.filter(e=>e.type==='INSERT'));
 assert.ok(inserts.length>=2);
 for(const e of inserts){assert.ok(blocks.has(e.blockRecordId),'Every INSERT must resolve its actual BLOCK_HEADER');assert.ok(!e.recoveredBlockRecordId,'No guessed color/layer fallback');assert.equal(e.colorIndex,5);}
 console.log('PASS reader C0 model and nested INSERT definitions; no fallback handles');
}finally{sdk.dwg_free(ptr);}
