// Selection only: never merge or explode the underlying CAD entities.
export function cableChain(shapes,seed,hidden=new Set()){
 const eligible=s=>s.text===null&&!s.fill&&!s.hatch&&['LINE','ARC','LWPOLYLINE','POLYLINE','SPLINE'].includes(s.entityType)&&s.pts.length>1;
 if(!seed||!eligible(seed))return [];
 const scope=s=>s.deviceId?[s.id,s.deviceId,...(s.entityMatrix||[])].join('|'):null;
 const candidates=shapes.filter(s=>eligible(s)&&!hidden.has(s.layer)&&s.layer===seed.layer&&s.color===seed.color&&s.rgb===seed.rgb&&scope(s)===scope(seed));
 // Drawing-unit tolerance, independent of zoom. Avoid bridging actual gaps.
 const span=Math.max(...seed.bounds.map(Math.abs),1),eps=Math.max(1e-7,span*1e-10);
 const near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<=eps;
 const buckets=new Map(),cell=p=>p.map(v=>Math.floor(v/eps));
 for(const s of candidates){if(near(s.pts[0],s.pts.at(-1)))continue;for(const p of [s.pts[0],s.pts.at(-1)]){const key=cell(p).join(',');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push({s,p});}}
 const chosen=new Set([seed]),queue=[seed];
 for(let i=0;i<queue.length;i++)for(const p of [queue[i].pts[0],queue[i].pts.at(-1)]){
  const [x,y]=cell(p),matches=new Set();
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const e of buckets.get([x+a,y+b].join(','))||[])if(near(p,e.p))matches.add(e.s);
  // A junction with three or more members is ambiguous: do not choose a branch.
  if(matches.size!==2)continue;
  for(const s of matches)if(!chosen.has(s)){chosen.add(s);queue.push(s);}
 }
 return [...chosen];
}
