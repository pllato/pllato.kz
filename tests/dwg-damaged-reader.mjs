// Run separately: protects the test runner from a native parser abort.
import assert from 'node:assert/strict';
let response;
globalThis.self={postMessage:message=>{if(!message.progress)response=message;}};
await import('../app/stroy/dwg/native-reader.mjs');
const buffer=new TextEncoder().encode('AC1032'+'\0'.repeat(250)).buffer;
await self.onmessage({data:buffer});
assert.ok(response.error,'Damaged file must be rejected');
assert.ok(!response.doc,'Damaged file cannot replace the working document');
console.log('PASS damaged DWG rejected:',response.error);
