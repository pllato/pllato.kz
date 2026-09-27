import fs from 'node:fs';
import assert from 'node:assert/strict';
const {default:create}=await import(process.env.DWG_TABLE_TEST_MODULE);
const m=await create({print:()=>{},printErr:()=>{}});
try{
 m.FS.writeFile('/input.dwg',fs.readFileSync(process.env.DWG_CLONE_FIXTURE));
 assert.ok(m.ccall('pllato_open','number',['string'],['/input.dwg'])<128);
 assert.equal(m.ccall('pllato_test_table_relocation','number',[],[]),0);
 assert.equal(m.ccall('pllato_test_assoc_registry','number',[],[]),0);
 console.log('PASS table handle remap / data preservation / malformed stream / width guard / independent associative registry');
}finally{m._pllato_close();}
