// Reuse a verified, unchanged base plan after native executive creation.
// Any changed source record, block definition or display table falls back to
// a complete build. This does not replace native save/read-back validation.
import {deriveSpatialIndex} from './spatial-index.mjs?v=0.17.57';
function equal(a,b){
 if(Object.is(a,b))return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 if(Array.isArray(a)){if(!Array.isArray(b)||a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(!equal(a[i],b[i]))return false;return true;}
 const keys=Object.keys(a),other=Object.keys(b);
 return keys.length===other.length&&keys.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));
}
// VERTEX/SEQEND and MULTILEADER display parts have adapter-local serial IDs;
// inserting a STYLE can renumber them without changing any CAD geometry.
function sameRecord(a,b){return a===b||!!b&&(a.id===b.id||a.id.startsWith('native-')&&b.id.startsWith('native-'))&&a.type===b.type&&equal(a.pairs,b.pairs)&&((!a.parts&&!b.parts)||a.parts?.length===b.parts?.length&&a.parts.every((r,i)=>sameRecord(r,b.parts[i])))&&equal(a.hatch,b.hatch);}
export function reusableScene(previous,next,drawing){
 if(!previous.native||!next.native||!drawing||drawing.limited)return null;
 for(const field of ['layers','textStyles']){
  for(const [name,value] of previous[field]){
   if(field==='textStyles'&&name.startsWith('PLLATO_DISPLAY_')&&!previous.records.some(r=>!r.id.startsWith('executive-')&&r.pairs.some(([c,v])=>c===7&&v===name)))continue;
   if(!next[field].has(name)||!equal(value,next[field].get(name)))return null;
  }
  const added=new Set([...next[field].keys()].filter(name=>!previous[field].has(name)));
  // A new decoration style/layer is harmless unless an existing record used
  // that formerly undefined name (which would change its resolved appearance).
  if(added.size){const code=field==='layers'?8:7;for(const r of previous.records)for(const [c,value] of r.pairs)if(c===code&&added.has(value))return null;}
 }
 // New independent block definitions are allowed; existing ones must match.
 for(const [name,block] of previous.blocks){const target=next.blocks.get(name);
  if(!target||!equal(block.base,target.base)||block.flags!==target.flags||block.records.length!==target.records.length||!block.records.every((r,i)=>sameRecord(r,target.records[i])))return null;
 }
 const generated=new Set((previous.executiveProject?.generatedHandles||[]).map(h=>'dwg-'+h));
 const decoration=id=>id.startsWith('executive-')||generated.has(id);
 const targets=new Map(next.entities.map((r,i)=>[r.id,i])),retained=new Set(),consumed=new Set();let lastTarget=-1;
 for(let i=0;i<previous.entities.length;i++){
  const r=previous.entities[i];if(decoration(r.id))continue;const index=targets.get(r.id);
  if(index===undefined||index<=lastTarget||!sameRecord(r,next.entities[index]))return null;lastTarget=index;retained.add(r.id);consumed.add(index);
  if(r.type==='POLYLINE'){
   let j=index+1;
   while(previous.entities[i+1]?.type==='VERTEX'){if(!sameRecord(previous.entities[++i],next.entities[j]))return null;consumed.add(j++);}
   if(previous.entities[i+1]?.type==='SEQEND'){if(!sameRecord(previous.entities[++i],next.entities[j]))return null;consumed.add(j);}
  }
 }
 // Reusing the base and appending a delta must preserve native painter order.
 for(let i=0;i<lastTarget;i++)if(!consumed.has(i))return null;
 const base=[],removed=new Set();for(const shape of drawing.shapes)if(retained.has(shape.id))base.push(shape);else removed.add(shape);
 return {previous:drawing.shapes,removed,base,doc:{...next,entities:next.entities.filter((r,i)=>!consumed.has(i))},unsupported:drawing.unsupported};
}
export function mergeReusedScene(reuse,added){
 const unsupported=new Map(reuse.unsupported);
 for(const [type,count] of added.unsupported)unsupported.set(type,(unsupported.get(type)||0)+count);
 const shapes=reuse.base.concat(added.shapes);deriveSpatialIndex(reuse.previous,shapes,reuse.removed,added.shapes);
 return {shapes,unsupported:[...unsupported],limited:added.limited};
}
