import {get} from './cad.mjs?v=0.17.15';
// Only a real block instance may become a device. Do not group nearby strokes
// or treat the plan/container (which contains other INSERTs) as one appliance.
export function deviceInstances(doc){
 const result=new Set();for(const r of doc.records){if(r.type!=='INSERT')continue;const block=doc.blocks.get(get(r,2));if(block?.records.length&&!block.records.some(r=>r.type==='INSERT'))result.add(r.id);}return result;
}
export function wholeDevice(shape,instances){return !!shape.deviceId&&instances.has(shape.deviceId);}
