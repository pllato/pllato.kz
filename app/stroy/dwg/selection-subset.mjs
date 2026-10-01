import {cableChain} from './cable-chain.mjs?v=0.17.59';

// Refine selection at CAD entity boundaries, without changing geometry.
export function selectionSubset(shapes,keys,universe=keys){
 const available=shapes.filter(s=>keys.has(s.entityKey)),seen=new Set(),measureKeys=new Set(),paths=[];
 let coincident=0,overlaps=0;
 for(const shape of available){
  if(seen.has(shape.entityKey))continue;
  const chain=cableChain(available,shape),members=chain.length?chain:[shape];
  for(const s of [...members,...chain.coincident||[]])seen.add(s.entityKey);
  for(const s of members)measureKeys.add(s.entityKey);
  paths.push(...(chain.paths||members.map(s=>s.pts)));
  coincident+=chain.coincident?.length||0;overlaps+=chain.overlaps||0;
 }
 return {keys:seen,measureKeys,paths,coincident,overlaps,manual:true,universe:new Set(universe)};
}

export function canRefinePart(seed,hit){
 return !!seed&&!!hit&&hit.text===null&&!hit.fill&&!hit.hatch&&hit.pts.length>1&&
 ['LINE','ARC','LWPOLYLINE','POLYLINE','SPLINE'].includes(hit.entityType)&&
 !String(hit.id||'').startsWith('executive-')&&
 String(seed.deviceId||'')===String(hit.deviceId||'')&&
 (!seed.deviceId||(seed.id===hit.id&&String(seed.entityMatrix)===String(hit.entityMatrix)));
}
export function toggleSelectionPart(shapes,selection,hit){
 const universe=new Set(selection.universe||selection.keys);
 const seed=shapes.find(s=>selection.keys.has(s.entityKey));
 if(!canRefinePart(seed,hit))return selection;
 universe.add(hit.entityKey);
 const span=Math.hypot(hit.bounds[2]-hit.bounds[0],hit.bounds[3]-hit.bounds[1]),eps=Math.max(1e-7,span*1e-5);
 const same=s=>s.entityType===hit.entityType&&s.pts.length===hit.pts.length&&[false,true].some(reverse=>s.pts.every((p,i)=>Math.hypot(p[0]-hit.pts[reverse?hit.pts.length-1-i:i][0],p[1]-hit.pts[reverse?hit.pts.length-1-i:i][1])<=eps));
 const keys=new Set(selection.keys),remove=keys.has(hit.entityKey);
 for(const s of shapes)if(universe.has(s.entityKey)&&same(s))remove?keys.delete(s.entityKey):keys.add(s.entityKey);
 return selectionSubset(shapes,keys,universe);
}
