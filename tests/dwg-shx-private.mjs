// Opt-in regression against locally owned fonts; never copies font bytes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {readShx} from '../app/stroy/dwg/shx-font.mjs';
const root=process.env.DWG_SHX_DIRECTORY;
if(!root)throw Error('Set DWG_SHX_DIRECTORY to a licensed local SHX directory');
for(const name of ['simplex','txt','romans','romand','monotxt','ISO','isocp','isoct']){
 const bytes=fs.readFileSync(path.join(root,name+'.shx'));
 const font=readShx(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 const text=font.layout('ABC 123');assert.ok(text.width>0);assert.ok(text.paths.length>0);
 assert.deepEqual(font.layout('ABC 123'),text);
 const missing=font.missing('АБВ');
 if(['ISO','isocp','isoct'].includes(name))assert.ok(missing.length);
 else assert.equal(missing.length,0);
 assert.throws(()=>font.layout('😀'),/нет символа/);
 console.log(name+': geometry PASS; Cyrillic '+(missing.length?'missing':'PASS'));
}
