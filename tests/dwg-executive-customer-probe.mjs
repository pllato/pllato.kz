// Local-only diagnostic: input never written or uploaded, output stays in WASM FS.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import reader from '../app/stroy/dwg/vendor/libredwg-web.js';
const {default:engine}=await import(process.env.DWG_EXECUTIVE_MODULE||'../app/stroy/dwg/vendor/pllato-executive-engine.mjs');
import {LibreDwg,Dwg_File_Type} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
const bytes=fs.readFileSync(process.env.DWG_TEST_FILE);
console.log('Read customer DWG',bytes.length);
let roots;
const rootsFile=process.env.DWG_ROOTS_FILE,digest=createHash('sha256').update(bytes).digest('hex');
if(rootsFile&&fs.existsSync(rootsFile)){
 const saved=JSON.parse(fs.readFileSync(rootsFile,'utf8'));assert.equal(saved.digest,digest);roots=saved.handles.map(handle=>({handle}));
}else if(process.env.DWG_ROOT_HANDLE)roots=[{handle:process.env.DWG_ROOT_HANDLE}];else{
const r=await reader({print:()=>{},printErr:()=>{}}),sdk=LibreDwg.createByWasmInstance(r);
const p=sdk.dwg_read_data(bytes,Dwg_File_Type.DWG);const header=sdk.dwg_dynapi_header_data.bind(sdk);sdk.dwg_dynapi_header_data=(p,f)=>f==='ACADVER'?'AC1032':f==='INSUNITS'?header(p,f):undefined;
const {database:db}=sdk.convertEx(p,true);roots=process.env.DWG_ROOT_COUNT?db.entities.slice(0,Number(process.env.DWG_ROOT_COUNT)):db.entities.filter(e=>e.type==='INSERT');
console.log('Selected roots',roots.length,'first',roots.slice(0,5).map(e=>({handle:e.handle,name:e.name})));
sdk.dwg_free(p);
}
if(rootsFile&&!fs.existsSync(rootsFile))fs.writeFileSync(rootsFile,JSON.stringify({digest,handles:roots.map(r=>r.handle)}),{flag:'wx'});
const m=await engine({print:()=>{},printErr:s=>{if(process.env.DWG_TRACE||/^(CLONE_|OPAQUE|SAVE_)/.test(s))console.log(s);}});m.FS.writeFile('/in.dwg',bytes);
console.log('Native open',m.ccall('pllato_open','number',['string'],['/in.dwg']));
if(process.env.DWG_TABLE_PROBE)console.log('Table stream',m.ccall('pllato_probe_table','number',['string'],[process.env.DWG_TABLE_PROBE]));
for(const handle of (process.env.DWG_PROBE_HANDLES||process.env.DWG_PROBE_HANDLE||'').split(',').filter(Boolean)){
 const result=m.ccall('pllato_probe_opaque','number',['string'],[handle]);console.log('Opaque coverage',handle,result);
 if(process.env.DWG_EXPECT_COVERAGE)assert.equal(result,0,'Typed record must preserve all semantic bits: '+handle);
}
if(process.env.DWG_PROBE_ONLY){m._pllato_close();process.exit(0);}
const handles=process.env.DWG_ROOT_COUNT?roots.map(r=>r.handle).join(','):roots[0].handle;const code=process.env.DWG_SAVE_ONLY?0:m.ccall('pllato_clone_selection','number',['string',...Array(5).fill('number')],[handles,0,0,100000,0,0]);console.log('Clone',code);
assert.equal(code,0,'Native clone must retain the complete dependency graph');
const save=m.ccall('pllato_save','number',['string'],['/copy.dwg']);console.log('Save gate',save);
assert.ok(save<128,'Native save/read-back structural gate must pass');
if(process.env.DWG_SAVE_TWICE){
 assert.ok(m.ccall('pllato_open','number',['string'],['/copy.dwg'])<128);
 const second=m.ccall('pllato_save','number',['string'],['/second.dwg']);console.log('Second save gate',second);
 assert.ok(second<128,'Reopened DWG must survive a second save');
}
m._pllato_close();
