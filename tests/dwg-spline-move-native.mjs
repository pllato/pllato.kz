// Local-only customer regression. Never store the input or exported DWG in Git.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import createReader from '../app/stroy/dwg/vendor/libredwg-web.js';
import createWriter from '../app/stroy/dwg/vendor/pllato-executive-engine.mjs';
import {LibreDwg} from '../app/stroy/dwg/vendor/libredwg-sdk.js';
import {nativeDocument} from '../app/stroy/dwg/native-adapter.mjs';
import {editObjects} from '../app/stroy/dwg/object-edit.mjs';
import {splineControls} from '../app/stroy/dwg/control-edit.mjs';
const bytes=fs.readFileSync(process.env.DWG_CLONE_FIXTURE);
const ids=process.env.DWG_MOVE_HANDLES.split(',').map(h=>'dwg-'+h);
const reader=await createReader({print:()=>{},printErr:()=>{}}),sdk=LibreDwg.createByWasmInstance(reader);
sdk.dwg_dynapi_header_data=()=>undefined;
function read(bytes){reader.FS.writeFile('/in.dwg',bytes);const {data:p}=reader.dwg_read_file('/in.dwg');const {database}=sdk.convertEx(p,true);sdk.dwg_free(p);return nativeDocument(database);}
const doc=read(bytes);doc.native=true;doc.nativeOps=[];
const before=ids.map(id=>splineControls(doc.records.find(r=>r.id===id)).map(h=>h.point));
assert.ok(before.every(points=>points.length>1));
editObjects(doc,ids.map(id=>({id})),{delta:[125,250]});
const writer=await createWriter({print:()=>{},printErr:()=>{}});writer.FS.writeFile('/in.dwg',bytes);
assert.ok(writer.ccall('pllato_open','number',['string'],['/in.dwg'])<128);
for(const op of doc.nativeOps)assert.equal(writer.ccall('pllato_spline_point','number',['string','number','number','number'],[op.handle,op.node.index,op.node.x,op.node.y]),0);
assert.ok(writer.ccall('pllato_save','number',['string'],['/out.dwg'])<128);
const reopened=read(writer.FS.readFile('/out.dwg'));
ids.forEach((id,i)=>{const r=reopened.records.find(r=>r.id===id);assert.equal(r.type,'SPLINE');splineControls(r).forEach((h,j)=>{assert.ok(Math.abs(h.point[0]-before[i][j][0]-125)<1e-6);assert.ok(Math.abs(h.point[1]-before[i][j][1]-250)<1e-6);});});
writer._pllato_close();console.log('PASS native SPLINE chain movement, save and reopen without flattening');
