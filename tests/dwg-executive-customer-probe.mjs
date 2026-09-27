// Local-only diagnostic: input never written or uploaded, output stays in WASM FS.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import reader from '../app/stroy/dwg/vendor/libredwg-web.js';
import engine from '../app/stroy/dwg/vendor/pllato-executive-engine.mjs';
import {LibreDwg,Dwg_File_Type} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
const bytes=fs.readFileSync(process.env.DWG_TEST_FILE);
console.log('Read customer DWG',bytes.length);
let roots;
if(process.env.DWG_ROOT_HANDLE)roots=[{handle:process.env.DWG_ROOT_HANDLE}];else{
const r=await reader({print:()=>{},printErr:()=>{}}),sdk=LibreDwg.createByWasmInstance(r);
const p=sdk.dwg_read_data(bytes,Dwg_File_Type.DWG);const header=sdk.dwg_dynapi_header_data.bind(sdk);sdk.dwg_dynapi_header_data=(p,f)=>f==='ACADVER'?'AC1032':f==='INSUNITS'?header(p,f):undefined;
const {database:db}=sdk.convertEx(p,true);roots=db.entities.filter(e=>e.type==='INSERT');
console.log('Model inserts',roots.length,'first',roots.slice(0,5).map(e=>({handle:e.handle,name:e.name})));
sdk.dwg_free(p);
}
const m=await engine({print:()=>{},printErr:s=>{if(process.env.DWG_TRACE||/^(CLONE_|OPAQUE|SAVE_)/.test(s))console.log(s);}});m.FS.writeFile('/in.dwg',bytes);
console.log('Native open',m.ccall('pllato_open','number',['string'],['/in.dwg']));
if(process.env.DWG_PROBE_HANDLE)console.log('Opaque coverage',m.ccall('pllato_probe_opaque','number',['string'],[process.env.DWG_PROBE_HANDLE]));
if(process.env.DWG_PROBE_ONLY){m._pllato_close();process.exit(0);}
const root=roots[0];const code=m.ccall('pllato_clone_selection','number',['string',...Array(5).fill('number')],[root.handle,0,0,100000,0,0]);console.log('Clone',code);
assert.equal(code,0,'Native clone must retain the complete dependency graph');
const save=m.ccall('pllato_save','number',['string'],['/copy.dwg']);console.log('Save gate',save);
assert.ok(save<128,'Native save/read-back structural gate must pass');
m._pllato_close();
