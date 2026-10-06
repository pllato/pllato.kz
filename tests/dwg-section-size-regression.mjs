// Verify physical DWG2018 section framing, independently of the LibreDWG reader.
// The writer currently emits uncompressed data pages. Use a locally saved DWG.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const b=fs.readFileSync(process.argv[2]);
assert.equal(b.subarray(0,6).toString(),'AC1032');
function crc16(bytes){let c=0xc0c1;for(const v of bytes){c^=v;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xa001:0);}return c;}
for(const [name,start,end] of [
 ['Header','cf7b1f23fdde38a95f7c68b84e6d335f','3084e0dc0221c756a0839747b192cca0'],
 ['Classes','8da1c4b8c4a9f8c5c0dcf45fe7cfb68a','725e3b473b56073a3f230ba018304975']
]){
 const i=b.indexOf(Buffer.from(start,'hex'));assert.ok(i>=32,name+' sentinel');
 const size=b.readUInt32LE(i+16);assert.equal(b.readUInt32LE(i+20),0,name+' size high DWORD');
 const crcAt=i+24+size;
 assert.equal(b.subarray(crcAt+2,crcAt+18).toString('hex'),end,name+' size excludes both size DWORDs');
 assert.equal(b.readUInt16LE(crcAt),crc16(b.subarray(i+16,crcAt)),name+' CRC includes both size DWORDs');
}
console.log('PASS DWG2018 Header/Classes size and CRC framing');

// Data-page masking depends on physical address. Validate every uncompressed
// page, including drawings with enough pages to exhaust the old byte counter.
let pages=0;
for(let offset=0x100;offset+32<=b.length;offset+=32){
 const mask=(0x4164536b^offset)>>>0;
 if(((b.readUInt32LE(offset)^mask)>>>0)!==0x4163043b)continue;
 const h=Array.from({length:8},(_,i)=>(b.readUInt32LE(offset+i*4)^mask)>>>0);
 assert.ok(h[1]>0&&h[1]<100,'section type');
 assert.equal(h[3],h[2],'decompressed payload excludes physical page header');
 assert.ok(offset+32+h[2]<=b.length,'page payload bounds');pages++;
}
assert.ok(pages>0,'data pages found');
console.log('PASS uncompressed data-page payload sizes',pages);
