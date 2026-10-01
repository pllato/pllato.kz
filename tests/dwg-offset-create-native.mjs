import fs from 'node:fs';import assert from 'node:assert/strict';
import create from '../app/stroy/dwg/vendor/pllato-executive-engine.mjs';
import reader from '../app/stroy/dwg/vendor/libredwg-web.js';import {LibreDwg,Dwg_File_Type} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
import {nativeDocument} from '../app/stroy/dwg/native-adapter.mjs';import {readDimensionDefinitions} from '../app/stroy/dwg/native-dimensions.mjs';
import {demo,get} from '../app/stroy/dwg/cad.mjs';import {createOffsetDimension,dimensionAddition} from '../app/stroy/dwg/dimension-create.mjs';import {writeAdditions} from '../app/stroy/dwg/authoring.mjs';import {dimensionDefinition,planDimensionEdit,applyDimensionPlan} from '../app/stroy/dwg/dimension-edit.mjs';
const input=fs.readFileSync(process.env.DWG_TEST_FILE),m=await create({print:()=>{},printErr:s=>{if(s.includes('REJECT'))console.error(s);}});
m.FS.writeFile('/in',input);assert.ok(m.ccall('pllato_open','number',['string'],['/in'])<128);
const expected=[];
for(const axis of ['horizontal','vertical']){const doc=demo(),dim=createOffsetDimension(doc,[100,200],[950,1050],[1200,1300],axis,25);applyDimensionPlan(planDimensionEdit(doc,dim,{length:1200,offset:150}));writeAdditions(m,[dimensionAddition(doc,dim)]);expected.push(m.ccall('pllato_last_handle','string',[],[]));}
assert.ok(m.ccall('pllato_save','number',['string'],['/out'])<128);
const bytes=m.FS.readFile('/out'),readerModule=await reader({print:()=>{},printErr:()=>{}}),sdk=LibreDwg.createByWasmInstance(readerModule),ptr=sdk.dwg_read_data(bytes,Dwg_File_Type.DWG);const db=sdk.convert(ptr);readDimensionDefinitions(sdk,ptr,db);sdk.dwg_free(ptr);const doc=nativeDocument(db);
for(const handle of expected){const dim=doc.records.find(r=>get(r,5)===handle);assert.equal(dim.type,'DIMENSION');assert.ok(Math.abs(dimensionDefinition(dim).length-1200)<1e-6);const cache=doc.blocks.get(get(dim,2));assert.equal(cache.records.filter(r=>r.type==='LINE').length,5);assert.equal(get(cache.records.find(r=>r.type==='TEXT'),1),'1200');assert.equal(m.ccall('pllato_dimension_move','number',['string','number','number'],[handle,25,-50]),0);assert.equal(m.ccall('pllato_dimension','number',['string','number','number','number'],[handle,1400,250,0]),0);}
assert.ok(m.ccall('pllato_save','number',['string'],['/out2'])<128);
assert.equal(m.ccall('pllato_export_selection','number',['string'],[expected.join(',')]),0);assert.ok(m.ccall('pllato_save','number',['string'],['/selected'])<128);
const selected=sdk.dwg_read_data(m.FS.readFile('/selected'),Dwg_File_Type.DWG);const subset=sdk.convert(selected);readDimensionDefinitions(sdk,selected,subset);sdk.dwg_free(selected);const subsetDoc=nativeDocument(subset);for(const handle of expected){const dim=subsetDoc.entities.find(r=>get(r,5)===handle);assert.ok(dim);assert.ok(Math.abs(dimensionDefinition(dim).length-1400)<1e-6);assert.equal(subsetDoc.blocks.get(get(dim,2)).records.filter(r=>r.type==='LINE').length,5);}
console.log('PASS new H/V native DIMENSION: cache, measurement, move, edit, save and selected export');
