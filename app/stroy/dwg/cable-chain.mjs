// Selection only: never merge or explode the underlying CAD entities.
export function cableChain(shapes,seed,hidden=new Set()){
 const eligible=s=>s.text===null&&!s.fill&&!s.hatch&&['LINE','ARC','LWPOLYLINE','POLYLINE','SPLINE'].includes(s.entityType)&&s.pts.length>1;
 if(!seed||!eligible(seed))return [];
 const scope=s=>s.deviceId?[s.id,s.deviceId,...(s.entityMatrix||[])].join('|'):null;
 const candidates=shapes.filter(s=>eligible(s)&&!hidden.has(s.layer)&&s.layer===seed.layer&&s.color===seed.color&&s.rgb===seed.rgb&&scope(s)===scope(seed));
 // Relative to geometry, never to its world position or the screen zoom.
 // 0.001% of the picked part accommodates CAD round-off, not visible gaps.
 const span=Math.hypot(seed.bounds[2]-seed.bounds[0],seed.bounds[3]-seed.bounds[1]),eps=Math.max(1e-7,span*1e-5);
 const near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<=eps;
 if(near(seed.pts[0],seed.pts.at(-1)))return [seed];
 const buckets=new Map(),cell=p=>p.map(v=>Math.floor(v/eps));
 const at=p=>{const [x,y]=cell(p),found=[];for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const e of buckets.get([x+a,y+b].join(','))||[])if(near(p,e.p))found.push(e.s);return [...new Set(found)];};
 const same=(a,b)=>a.entityType===b.entityType&&a.pts.length===b.pts.length&&[false,true].some(reverse=>a.pts.every((p,i)=>near(p,b.pts[reverse?b.pts.length-1-i:i])));
 const copies=new Map(),representative=new Map();
 for(const s of candidates){
  if(near(s.pts[0],s.pts.at(-1)))continue;
  const existing=at(s.pts[0]).find(t=>same(s,t));
  if(existing){copies.get(existing).push(s);representative.set(s,existing);continue;}
  copies.set(s,[s]);representative.set(s,s);
  for(const p of [s.pts[0],s.pts.at(-1)]){const key=cell(p).join(',');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push({s,p});}
 }
 const first=representative.get(seed)||seed,chosen=new Set([first]),queue=[first];
 for(let i=0;i<queue.length;i++)for(const p of [queue[i].pts[0],queue[i].pts.at(-1)]){
  const matches=new Set(at(p));
  // A junction with three or more members is ambiguous: do not choose a branch.
  if(matches.size!==2)continue;
  for(const s of matches)if(!chosen.has(s)){chosen.add(s);queue.push(s);}
 }
 const result=[...chosen].map(s=>s===first?seed:s);
 const coincident=[...chosen].flatMap(s=>copies.get(s)||[s]).filter(s=>!result.includes(s));
 if(coincident.length)Object.defineProperty(result,'coincident',{value:coincident});
 return result;
}
