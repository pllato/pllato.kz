import test from 'node:test';import assert from 'node:assert/strict';
import {dwgVersion,requireWritableVersion,checkOpeningVersion} from '../app/stroy/dwg/dwg-version.mjs';
const bytes=s=>new TextEncoder().encode(s).buffer;
test('DWG 2007 is identified and rejected before expensive write with actionable reason',()=>{assert.equal(dwgVersion(bytes('AC1021')).needsConversion,true);assert.throws(()=>requireWritableVersion(bytes('AC1021')),/DWG 2018/);});
test('other versions retain native validation, without a promise of compatibility',()=>{for(const s of ['AC1015','AC1018','AC1024','AC1027','AC1032']){assert.equal(dwgVersion(bytes(s)).signature,s);assert.doesNotThrow(()=>requireWritableVersion(bytes(s)));}assert.doesNotThrow(()=>dwgVersion(bytes('')));});

test('opening rejects old DWG from its header without reading or changing the full file',async()=>{
 const content=new Uint8Array([...new TextEncoder().encode('AC1021'),1,2,3]);const original=content.slice();let reads=0;
 const file={name:'plan.DWG',slice(start,end){assert.equal(start,0);assert.equal(end,6);reads++;return new Blob([content.slice(start,end)]);},arrayBuffer(){throw Error('full read forbidden');}};
 await assert.rejects(checkOpeningVersion(file),/DWG 2018/);assert.equal(reads,1);assert.deepEqual(content,original);
});
test('opening accepts modern DWG and does not inspect DXF as DWG',async()=>{
 await checkOpeningVersion(Object.assign(new Blob([bytes('AC1032')]),{name:'modern.dwg'}));
 await checkOpeningVersion({name:'drawing.dxf',slice(){throw Error('DWG check on DXF');}});
});
