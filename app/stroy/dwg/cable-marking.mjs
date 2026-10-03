import {cableLayer} from './source-cable-lengths.mjs?v=0.17.74';

export const markingComplete=route=>!!(String(route.brand||'').trim()&&String(route.section||'').trim());
// Only recognized cable geometry is checked, never dimensions or device symbols.
export function markingIndex(routes){
 const assigned=new Set(routes.flatMap(r=>r.sourceIds||[]));
 return {routes,assigned};
}
export function unmarkedSource(shape,index,devices,hidden){
 return shape.text===null&&!shape.fill&&!shape.hatch&&
  ['LINE','ARC','LWPOLYLINE','POLYLINE','SPLINE'].includes(shape.entityType)&&shape.pts.length>1&&
  !hidden.has(shape.layer)&&!devices.has(shape.deviceId)&&!index.assigned.has(shape.entityId||shape.id)&&
  !shape.id.startsWith('executive-')&&(cableLayer(shape.layer)||shape.id.startsWith('new-'));
}
export function paintMarking(ctx,index,shapes,devices,hidden,screen,width,height){
 ctx.save();ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';
 const path=points=>{if(!points?.length)return;const p=points.map(screen);if(p.every(v=>v[0]<-10)||p.every(v=>v[0]>width+10)||p.every(v=>v[1]<-10)||p.every(v=>v[1]>height+10))return;ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.stroke();};
 ctx.strokeStyle='#d32f2f';ctx.setLineDash([7,4]);
 for(const s of shapes)if(unmarkedSource(s,index,devices,hidden))path(s.pts);
 // Assigned routes use their current editable paths, not a second CAD traversal.
 const visible=hidden.size?new Set(shapes.filter(s=>!hidden.has(s.layer)).map(s=>s.entityId||s.id)):null;
 for(const r of index.routes){if(r.sourceIds?visible&&!r.sourceIds.some(id=>visible.has(id)):hidden.has('0'))continue;const complete=markingComplete(r);ctx.strokeStyle=complete?'#168447':'#d32f2f';ctx.setLineDash(complete?[]:[7,4]);for(const p of r.paths||[r.points])path(p);}
 ctx.restore();
}
