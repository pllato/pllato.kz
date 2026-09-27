// Experimental binary clone gate. Never executed against production endpoints.
import fs from 'node:fs';import assert from 'node:assert/strict';
import reader from '../app/stroy/dwg/vendor/libredwg-web.js';
import {LibreDwg,Dwg_File_Type} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
if(!process.env.DWG_CLONE_MODULE||!process.env.DWG_CLONE_FIXTURE)throw Error('Set DWG_CLONE_MODULE and DWG_CLONE_FIXTURE');
const {default:clone}=await import(process.env.DWG_CLONE_MODULE);
const input=fs.readFileSync(process.env.DWG_CLONE_FIXTURE),r=await reader({print:()=>{},printErr:()=>{}}),sdk=LibreDwg.createByWasmInstance(r);
const p=sdk.dwg_read_data(input,Dwg_File_Type.DWG),db=sdk.convert(p),root=db.entities.find(e=>e.type==='INSERT');
const m=await clone({print:()=>{},printErr:s=>{if(s.includes('CLONE')||s.includes('VERIFY'))console.log(s);}});
try{
 m.FS.writeFile('/in.dwg',input);assert.ok(m.ccall('pllato_open','number',['string'],['/in.dwg'])<128);
 assert.equal(m.ccall('pllato_clone_graph','number',['string','number','number'],[root.handle,1000,0]),0);
 const metadata=JSON.stringify({version:1,title:'Исполнительная',cables:Array(20).fill({brand:'ВВГнг',section:'3×2,5',length:10})});
 const metadataBytes=new TextEncoder().encode(metadata);
 assert.equal(m.ccall('pllato_executive_metadata','number',['array','number'],[metadataBytes,metadataBytes.length]),0);
 assert.ok(m.ccall('pllato_save','number',['string'],['/out.dwg'])<128);
 const p2=sdk.dwg_read_data(m.FS.readFile('/out.dwg'),Dwg_File_Type.DWG);
 try{const output=sdk.convert(p2),roots=output.entities.filter(e=>e.type==='INSERT');
  const stored=output.objects.XRECORD.find(x=>x.data.some(x=>x.code===310));
  assert.ok(stored&&stored.ownerHandle!=='0','Metadata needs dictionary ownership');
  const restored=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(stored.data.flatMap(x=>Array.from(x.value))));
  assert.equal(restored,metadata,'Russian executive metadata must survive native DWG roundtrip');
  assert.equal(roots.length,2);assert.notEqual(roots[0].blockRecordId,roots[1].blockRecordId);
  console.log('definitions',output.tables.BLOCK_RECORD.entries.map(e=>({handle:e.handle,name:e.name,entities:e.entities?.map(x=>({handle:x.handle,type:x.type,block:x.blockRecordId}))})));
  assert.equal(roots[0].insertionPoint.x,0);assert.equal(roots[1].insertionPoint.x,1000);
  const blocks=output.tables.BLOCK_RECORD.entries;assert.equal(new Set(blocks.map(b=>b.name)).size,blocks.length,'Block definitions must have unique names');
  const definition=id=>blocks.find(b=>b.handle===id);
  const sourceInsert=definition(roots[0].blockRecordId).entities.find(e=>e.type==='INSERT');
  const copiedInsert=definition(roots[1].blockRecordId).entities.find(e=>e.type==='INSERT');
  assert.equal(copiedInsert.attribs.length,sourceInsert.attribs.length);
  for(let i=0;i<sourceInsert.attribs.length;i++){
   const original=sourceInsert.attribs[i],copy=copiedInsert.attribs[i];
   assert.notEqual(copy.handle,original.handle,'Attribute must get an independent handle');
   assert.equal(copy.text.text,original.text.text,'Attribute text must survive');
   assert.equal(copy.ownerBlockRecordSoftId,copiedInsert.handle,'Attribute must belong to copied INSERT');
  }
  const originalDevice=definition(definition(roots[0].blockRecordId).entities.find(e=>e.type==='INSERT').blockRecordId);
  const copiedDevice=definition(definition(roots[1].blockRecordId).entities.find(e=>e.type==='INSERT').blockRecordId);
  assert.deepEqual(copiedDevice.entities.map(e=>e.type),originalDevice.entities.map(e=>e.type),'Native types must not be exploded or omitted');
  for(const original of originalDevice.entities.filter(e=>e.type==='HATCH')){
   const copy=copiedDevice.entities.find(e=>e.type==='HATCH');
   assert.notEqual(copy.handle,original.handle);
   assert.equal(copy.ownerBlockRecordSoftId,copiedDevice.handle);
   assert.deepEqual(copy.boundaryPaths,original.boundaryPaths);
   assert.equal(copy.patternName,original.patternName);
   assert.equal(copy.associativity,original.associativity);
  }
  const originalLine=originalDevice.entities.find(e=>e.type==='LINE'),copiedLine=copiedDevice.entities.find(e=>e.type==='LINE');
  assert.notEqual(originalLine.handle,copiedLine.handle,'Nested geometry must be independent');
  assert.equal(m.ccall('pllato_move','number',['string','number','number'],[copiedLine.handle,25,40]),0);
  assert.ok(m.ccall('pllato_save','number',['string'],['/edited.dwg'])<128);
  const p3=sdk.dwg_read_data(m.FS.readFile('/edited.dwg'),Dwg_File_Type.DWG);
  try{
   const edited=sdk.convert(p3),all=edited.tables.BLOCK_RECORD.entries.flatMap(b=>b.entities||[]);
   const unchanged=all.find(e=>e.handle===originalLine.handle),changed=all.find(e=>e.handle===copiedLine.handle);
   assert.deepEqual(unchanged,originalLine,'Editing copied geometry must not change source');
   assert.equal(changed.startPoint.x,originalLine.startPoint.x+25);
   assert.equal(changed.startPoint.y,originalLine.startPoint.y+40);
  }finally{sdk.dwg_free(p3);}
  console.log('PASS nested independent block clone');
 }finally{sdk.dwg_free(p2);}
}finally{sdk.dwg_free(p);m._pllato_close();}
