import {get} from './cad.mjs?v=0.17.67';
// Only a real block instance may become a device. Do not group nearby strokes
// or treat the plan/container (which contains other INSERTs) as one appliance.
export function deviceInstances(doc){
 const leaf=new Set();for(const [name,block] of doc.blocks)if(block.records.length&&!block.records.some(r=>r.type==='INSERT'))leaf.add(name);
 const result=new Set();for(const r of doc.records)if(r.type==='INSERT'&&leaf.has(get(r,2)))result.add(r.id);return result;
}
export function wholeDevice(shape,instances){return !!shape.deviceId&&instances.has(shape.deviceId);}
