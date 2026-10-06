import {test} from 'node:test';import assert from 'node:assert/strict';
import {convertOldDwg} from '../app/stroy/dwg/local-conversion.mjs';
test('Absent optional local CAD helper leaves native input untouched',async()=>{
 const bytes=new TextEncoder().encode('AC1021original').buffer;const before=new Uint8Array(bytes).slice();
 assert.equal(await convertOldDwg(bytes,{fetchImpl:async()=>{throw Error('unavailable');}}),null);assert.deepEqual(new Uint8Array(bytes),before);
});
test('Local conversion returns only DWG2018 and reports refused conversion',async()=>{
 const original=new TextEncoder().encode('AC1021original').buffer;let calls=0;
 const fetchImpl=async(url,options)=>{calls++;if(url.endsWith('/status'))return {ok:true,json:async()=>({available:true})};assert.equal(options.body,original);assert.equal(options.headers['Content-Type'],'application/acad');return {ok:true,arrayBuffer:async()=>new TextEncoder().encode('AC1032copy').buffer};};
 assert.equal(new TextDecoder().decode(await convertOldDwg(original,{fetchImpl})),'AC1032copy');assert.equal(calls,2);
 await assert.rejects(convertOldDwg(original,{fetchImpl:async url=>url.endsWith('/status')?{ok:true,json:async()=>({available:true})}:{ok:false,json:async()=>({error:'AUDIT failed'})}}),/AUDIT failed/);
});
