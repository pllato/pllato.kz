import {get} from './cad.mjs?v=0.17.6';

// INSERT and attached ATTRIBs form one selection unit, never separate roots.
export function selectExecutiveRoots(doc,shapes,area){
 const byId=new Map(doc.entities.map(r=>[r.id,r]));
 const byHandle=new Map(doc.entities.map(r=>[get(r,5).toUpperCase(),r]));
 const bounds=new Map();
 for(const shape of shapes){
  if(shape.id.startsWith('executive-'))continue;
  let root=byId.get(shape.id);if(!root||root.id.startsWith('new-'))continue;
  if(root.type==='ATTRIB'){
   const parent=byHandle.get(get(root,330).toUpperCase());
   if(parent?.type==='INSERT')root=parent;
  }
  const b=bounds.get(root.id)||[Infinity,Infinity,-Infinity,-Infinity];
  for(const [x,y] of shape.pts){b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);}
  bounds.set(root.id,b);
 }
 return doc.entities.filter(r=>{
  const b=bounds.get(r.id);return b&&b.every(Number.isFinite)&&b[0]>=area[0]&&b[1]>=area[1]&&b[2]<=area[2]&&b[3]<=area[3];
 }).map(r=>get(r,5));
}
