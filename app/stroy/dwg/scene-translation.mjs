// Pure translation only: CAD records are still edited by object-edit and saved
import {get} from './cad.mjs?v=0.17.46';
export function translatedDeviceScene(doc,drawing,targets,delta,recordById=id=>doc.records.find(r=>r.id===id)){
 if(drawing.limited||!targets.length||delta.length!==2||!delta.every(Number.isFinite))return null;
 const wanted=new Map();
 for(const t of targets){const r=recordById(t.id),block=r?.type==='INSERT'&&doc.blocks.get(get(r,2));if(!block||block.records.some(r=>r.type==='INSERT')||doc.records.some(a=>a.type==='ATTRIB'&&get(a,330)===get(r,5)))return null;wanted.set(t.id,t);}
 const shifted=m=>[...m.slice(0,4),m[4]+delta[0],m[5]+delta[1]],seen=new Set();let valid=true;
 const shapes=drawing.shapes.map(s=>{const t=wanted.get(s.deviceId);if(!t)return s;const parent=t.matrix||[1,0,0,1,0,0];if(!s.deviceMatrix||parent.some((v,i)=>v!==s.deviceMatrix[i])||!s.entityMatrix){valid=false;return s;}seen.add(t.id);const entityMatrix=shifted(s.entityMatrix);return {...s,entityMatrix,entityKey:s.id+'|'+s.entityId+'|'+entityMatrix.join(','),pts:s.pts.map(p=>[p[0]+delta[0],p[1]+delta[1]]),bounds:s.bounds.map((v,i)=>v+delta[i%2]),...(s.matrix?{matrix:shifted(s.matrix)}:{})};});
 return valid&&seen.size===wanted.size?{...drawing,shapes}:null;
}
// by the native writer. Reuse unaffected display geometry, never approximate it.
export function translatedScene(drawing,targets,delta){
 if(!drawing||drawing.limited||!Array.isArray(delta)||delta.length!==2||!delta.every(Number.isFinite)||!targets.length)return null;
 const byId=new Map(targets.map(t=>[t.id,t])),seen=new Set();let valid=true;
 const shapes=drawing.shapes.map(s=>{
  const target=byId.get(s.entityId||s.id);if(!target)return s;
  if(!['LINE','ARC','CIRCLE','LWPOLYLINE','SPLINE'].includes(s.entityType)||s.text!==null||s.hatch||s.fill){valid=false;return s;}
  const a=target.matrix||[1,0,0,1,0,0],b=s.entityMatrix||[1,0,0,1,0,0];
  if(a.some((v,i)=>v!==b[i])){valid=false;return s;}
  seen.add(target.id);const [dx,dy]=delta;
  return {...s,pts:s.pts.map(([x,y])=>[x+dx,y+dy]),bounds:s.bounds.map((v,i)=>v+(i%2?dy:dx))};
 });
 return valid&&seen.size===byId.size?{...drawing,shapes}:null;
}
