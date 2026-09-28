// Optional private fixture stays local; never committed or uploaded.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {default:create}=await import(process.env.DWG_EXECUTIVE_MODULE||'../app/stroy/dwg/vendor/pllato-executive-engine.mjs');
const input=fs.readFileSync(process.env.DWG_OWNER_FIXTURE);
const messages=[],m=await create({print:()=>{},printErr:s=>{if(/OWNER|SAVE_REJECT/.test(s))messages.push(s);}});
m.FS.writeFile('/input.dwg',input);
assert.ok(m.ccall('pllato_open','number',['string'],['/input.dwg'])<128);
for(let cycle=0;cycle<2;cycle++){
 const addedPath=`/added-${cycle}.dwg`,removedPath=`/removed-${cycle}.dwg`;
 assert.equal(m.ccall('pllato_add_line','number',Array(4).fill('number'),[cycle+1,2,3,4]),0);
 const handle=m.ccall('pllato_last_handle','string',[],[]);
 assert.ok(m.ccall('pllato_save','number',['string'],[addedPath])<128,JSON.stringify(messages));
 assert.ok(m.ccall('pllato_open','number',['string'],[addedPath])<128);
 assert.equal(m.ccall('pllato_remove','number',['string'],[handle]),0,JSON.stringify(messages));
 assert.ok(m.ccall('pllato_save','number',['string'],[removedPath])<128,JSON.stringify(messages));
 assert.ok(m.ccall('pllato_open','number',['string'],[removedPath])<128);
 console.log('Owner list preserved through add/save/reopen/remove/save, cycle',cycle+1);
}
assert.deepEqual(fs.readFileSync(process.env.DWG_OWNER_FIXTURE),input,'Original must remain unchanged');
m.ccall('pllato_close',null,[],[]);
