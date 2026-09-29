// Pure translation only: CAD records are still edited by object-edit and saved
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
