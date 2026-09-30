// Opt-in private input; logs counts/timings only, never drawing content.
import fs from 'node:fs';
import create from '../app/stroy/dwg/vendor/libredwg-web.js';
import {LibreDwg} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
import {nativeDocument} from '../app/stroy/dwg/native-adapter.mjs';
import {scene} from '../app/stroy/dwg/cad.mjs';
const bytes=fs.readFileSync(process.env.DWG_PERF_FIXTURE),times={};let start=performance.now();
const m=await create({print:()=>{},printErr:()=>{}});times.engine=performance.now()-start;
m.FS.writeFile('input.dwg',bytes);start=performance.now();const {data:p,error}=m.dwg_read_file('input.dwg');times.nativeRead=performance.now()-start;
if(error>=128)throw Error('Native read '+error);
const sdk=LibreDwg.createByWasmInstance(m);sdk.dwg_dynapi_header_data=()=>undefined;
start=performance.now();const {database}=sdk.convertEx(p,true);times.convert=performance.now()-start;
start=performance.now();const doc=nativeDocument(database);times.adapter=performance.now()-start;sdk.dwg_free(p);
start=performance.now();const cloned=structuredClone(doc);times.transferClone=performance.now()-start;
start=performance.now();const output=scene(cloned);times.scene=performance.now()-start;
console.log(JSON.stringify({scope:'Node phase benchmark, not browser end-to-end',records:doc.records.length,shapes:output.shapes.length,milliseconds:Object.fromEntries(Object.entries(times).map(([k,v])=>[k,Math.round(v)]))}));
