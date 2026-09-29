import fs from 'node:fs';
import assert from 'node:assert/strict';
import create from '../app/stroy/dwg/vendor/pllato-executive-engine.mjs';
import reader from '../app/stroy/dwg/vendor/libredwg-web.js';
import {LibreDwg,Dwg_File_Type} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
import {writeAdditions} from '../app/stroy/dwg/authoring.mjs';
const m=await create({print:()=>{},printErr:()=>{}}),r=await reader({print:()=>{},printErr:()=>{}}),sdk=LibreDwg.createByWasmInstance(r);
m.FS.writeFile('/in.dwg',fs.readFileSync(process.env.DWG_CLONE_FIXTURE));assert.ok(m.ccall('pllato_open','number',['string'],['/in.dwg'])<128);
for(const rgb of [0x123456,0,0xffffff]){writeAdditions(m,[{type:'LINE',values:[0,0,10,10],color:7,rgb}]);const handle=m.ccall('pllato_last_handle','string',[],[]);assert.ok(m.ccall('pllato_save','number',['string'],['/out-'+rgb+'.dwg'])<128);const p=sdk.dwg_read_data(m.FS.readFile('/out-'+rgb+'.dwg'),Dwg_File_Type.DWG);try{assert.equal(sdk.convert(p).entities.find(e=>e.handle===handle).color,rgb);}finally{sdk.dwg_free(p);}}
console.log('PASS exact RGB native DWG roundtrip');
