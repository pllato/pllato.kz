import {selectionContour,contourHits} from './contour.mjs?v=0.17.99';
import {get} from './cad.mjs?v=0.17.90';

// INSERT and attached ATTRIBs form one selection unit, never separate roots.
export function selectExecutiveRoots(doc,shapes,area,options={}){
 const polygon=selectionContour(area),rect=area.length===4&&area.every(Number.isFinite),hits=new Set(),outside=new Set();
 const byId=new Map(doc.entities.map(r=>[r.id,r]));
 const byHandle=new Map(doc.entities.map(r=>[get(r,5).toUpperCase(),r]));
 const bounds=new Map();
 for(const shape of shapes){
  if(shape.id.startsWith('executive-')||typeof shape.text==='string'&&!shape.text.trim())continue;
  let root=byId.get(shape.id);if(!root||root.id.startsWith('new-'))continue;
  if(root.type==='ATTRIB'){
   const parent=byHandle.get(get(root,330).toUpperCase());
   if(parent?.type==='INSERT')root=parent;
  }
  const b=bounds.get(root.id)||[Infinity,Infinity,-Infinity,-Infinity];
  const geometry=shape.geometryBounds||(shape.text===null?shape.bounds:null);
  if(geometry){b[0]=Math.min(b[0],geometry[0]);b[1]=Math.min(b[1],geometry[1]);b[2]=Math.max(b[2],geometry[2]);b[3]=Math.max(b[3],geometry[3]);}
  else for(const [x,y] of shape.pts){b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);}
  bounds.set(root.id,b);
  if(!rect||options.crossing){const hitShape=shape.geometryBounds&&typeof shape.text==='string'?{pts:[[shape.geometryBounds[0],shape.geometryBounds[1]]]}:shape;if(contourHits(hitShape,polygon,!!options.crossing))hits.add(root.id);else outside.add(root.id);}
 }
 return doc.entities.filter(r=>{
  const b=bounds.get(r.id);return b&&b.every(Number.isFinite)&&(options.crossing?hits.has(r.id):rect?b[0]>=area[0]&&b[1]>=area[1]&&b[2]<=area[2]&&b[3]<=area[3]:hits.has(r.id)&&!outside.has(r.id));
 }).map(r=>get(r,5));
}
