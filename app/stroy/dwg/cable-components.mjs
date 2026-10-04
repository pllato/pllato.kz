import {overlapLinks} from './cable-overlap.mjs?v=0.17.75';
// Conservative partition only: cableChain still performs all exact tests.
const cache=new WeakMap();
const eligible=s=>s.text===null&&!s.fill&&!s.hatch&&['LINE','ARC','LWPOLYLINE','POLYLINE','SPLINE'].includes(s.entityType)&&s.pts.length>1;
const key=s=>JSON.stringify([s.layer,s.color,s.rgb,s.deviceId?[s.id,s.deviceId,...(s.entityMatrix||[])]:null]);
function partition(group){
 const parent=group.map((_,i)=>i),ids=new Map(group.map((s,i)=>[s,i]));
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 const join=(a,b)=>{a=root(a);b=root(b);if(a!==b)parent[b]=a;};
 let eps=1e-7;for(const s of group)eps=Math.max(eps,Math.hypot(s.bounds[2]-s.bounds[0],s.bounds[3]-s.bounds[1])*1e-5);
 const buckets=new Map();
 for(let i=0;i<group.length;i++)for(const p of [group[i].pts[0],group[i].pts.at(-1)]){
  const x=Math.floor(p[0]/eps),y=Math.floor(p[1]/eps);
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const e of buckets.get((x+a)+','+(y+b))||[])if(Math.hypot(p[0]-e.p[0],p[1]-e.p[1])<=eps)join(i,e.i);
  const k=x+','+y;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push({p,i});
 }
 const overlap=overlapLinks(group);
 for(const s of group)for(const end of [0,1])for(const link of overlap.links(s,end))join(ids.get(s),ids.get(link.s));
 const parts=new Map(),result=new Map();for(let i=0;i<group.length;i++){const k=root(i);if(!parts.has(k))parts.set(k,[]);parts.get(k).push(group[i]);}
 for(const part of parts.values())for(const s of part)result.set(s,part);return result;
}
export function cableCandidates(shapes,seed){
 let entry=cache.get(shapes);if(!entry)cache.set(shapes,entry=new Map());
 const k=key(seed);if(!entry.has(k)){
  // Only index the picked style/instance, not every wall, hatch and device in
  // the whole file. Exact endpoint/overlap and branch rules remain unchanged.
  const group=[],matrix=seed.entityMatrix||[];
  for(const s of shapes){
   if(s.layer!==seed.layer||s.color!==seed.color||s.rgb!==seed.rgb||!eligible(s))continue;
   if(seed.deviceId){const m=s.entityMatrix||[];if(s.id!==seed.id||s.deviceId!==seed.deviceId||m.length!==matrix.length||m.some((n,i)=>n!==matrix[i]))continue;}
   else if(s.deviceId)continue;
   group.push(s);
  }
  entry.set(k,partition(group));
 }
 return entry.get(k).get(seed)||[];
}
