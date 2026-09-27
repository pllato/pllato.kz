// SPDX-License-Identifier: GPL-3.0-or-later
// DWG definition lines already include pattern scale/rotation; do not apply twice.
const xy=p=>[p.x,p.y];
export function hatchGeometry(e){
 const loops=[];
 for(const path of e.boundaryPaths||[]){
  const pts=[];
  if(path.vertices){for(let i=0;i<path.vertices.length;i++){const a=path.vertices[i],b=path.vertices[(i+1)%path.vertices.length];pts.push(xy(a));if(a.bulge){const q=a.bulge,dx=b.x-a.x,dy=b.y-a.y,cx=(a.x+b.x)/2-dy*(1-q*q)/(4*q),cy=(a.y+b.y)/2+dx*(1-q*q)/(4*q),r=Math.hypot(a.x-cx,a.y-cy),t=Math.atan2(a.y-cy,a.x-cx),span=4*Math.atan(q),n=Math.max(4,Math.ceil(Math.abs(span)*24));for(let j=1;j<n;j++)pts.push([cx+r*Math.cos(t+span*j/n),cy+r*Math.sin(t+span*j/n)]);}}}
  else for(const edge of path.edges||[]){
   if(edge.type===1){pts.push(xy(edge.start),xy(edge.end));}
   else if(edge.type===2||edge.type===3){let span=edge.endAngle-edge.startAngle;if(edge.isCCW){while(span<=0)span+=Math.PI*2;}else{while(span>=0)span-=Math.PI*2;}const n=Math.max(8,Math.ceil(Math.abs(span)*24)),u=edge.type===2?[edge.radius,0]:xy(edge.end),ratio=edge.type===2?1:edge.lengthOfMinorAxis;for(let i=0;i<=n;i++){const t=edge.startAngle+span*i/n;pts.push([edge.center.x+u[0]*Math.cos(t)-u[1]*ratio*Math.sin(t),edge.center.y+u[1]*Math.cos(t)+u[0]*ratio*Math.sin(t)]);}}
   else return null;
  }
  if(pts.length<3||pts.some(p=>!p.every(Number.isFinite)))return null;
  loops.push({pts,flag:path.boundaryPathTypeFlag});
 }
 if(!loops.length||(!e.solidFill&&!e.definitionLines?.length)||e.gradientFlag)return null;
 // Normal uses even/odd islands. Outer includes external and outermost loops;
 // Ignore islands includes only external boundaries.
 const chosen=e.hatchStyle===2?loops.filter(l=>l.flag&1):e.hatchStyle===1?loops.filter(l=>l.flag&17):loops;
 if(!chosen.length)return null;
 return {loops:chosen.map(l=>l.pts),solid:!!e.solidFill,lines:e.definitionLines||[]};
}
export function paintHatch(ctx,shape,view,color,width,height){
 const {hatch:h,matrix:m}=shape,s=view.s;
 ctx.save();ctx.beginPath();for(const loop of h.loops){loop.forEach((p,i)=>{const x=(m[0]*p[0]+m[2]*p[1]+m[4])*s+view.x,y=view.y-(m[1]*p[0]+m[3]*p[1]+m[5])*s;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.closePath();}
 ctx.fillStyle=color;if(h.solid){ctx.fill('evenodd');ctx.restore();return;}ctx.clip('evenodd');
 const det=m[0]*m[3]-m[1]*m[2];if(!det){ctx.restore();return;}
 const inv=(x,y)=>{x=(x-view.x)/s-m[4];y=(view.y-y)/s-m[5];return [(m[3]*x-m[2]*y)/det,(-m[1]*x+m[0]*y)/det];};
 const b=shape.bounds,x0=Math.max(0,b[0]*s+view.x),x1=Math.min(width,b[2]*s+view.x),y0=Math.max(0,view.y-b[3]*s),y1=Math.min(height,view.y-b[1]*s);
 const corners=[inv(x0,y0),inv(x1,y0),inv(x1,y1),inv(x0,y1)];
 ctx.transform(s*m[0],-s*m[1],s*m[2],-s*m[3],view.x+s*m[4],view.y-s*m[5]);
 const pixel=1/(s*Math.max(Math.hypot(m[0],m[1]),Math.hypot(m[2],m[3])));ctx.strokeStyle=color;ctx.lineWidth=pixel;
 for(const line of h.lines){const u=[Math.cos(line.angle),Math.sin(line.angle)],n=[-u[1],u[0]],base=line.base,offset=line.offset,step=offset.x*n[0]+offset.y*n[1];if(!Number.isFinite(step)||Math.abs(step)<1e-10)continue;
  const proj=corners.map(p=>(p[0]-base.x)*n[0]+(p[1]-base.y)*n[1]),a=Math.min(...proj)/step,b=Math.max(...proj)/step,lo=Math.floor(Math.min(a,b)),hi=Math.ceil(Math.max(a,b)),stride=Math.max(1,Math.ceil(pixel*.6/Math.abs(step)),Math.ceil((hi-lo)/4000));
  const ts=corners.map(p=>p[0]*u[0]+p[1]*u[1]),tmin=Math.min(...ts),tmax=Math.max(...ts),dash=line.dashLengths||[],period=dash.reduce((v,d)=>v+Math.abs(d),0);ctx.beginPath();
  for(let k=Math.ceil(lo/stride)*stride;k<=hi;k+=stride){const x=base.x+k*offset.x,y=base.y+k*offset.y,start=tmin-x*u[0]-y*u[1],end=tmax-x*u[0]-y*u[1];
   const segment=(a,b)=>{ctx.moveTo(x+u[0]*a,y+u[1]*a);ctx.lineTo(x+u[0]*b,y+u[1]*b);};
   if(!period)segment(start,end);else{let budget=10000;for(let t=Math.floor(start/period)*period;t<end&&budget>0;t+=period){let q=t;for(const d of dash){if(--budget<0)break;const next=q+Math.abs(d);if(d>=0&&next>=start&&q<=end)segment(Math.max(q,start),Math.min(Math.max(next,q+pixel),end));q=next;}}}
  }ctx.stroke();
 }ctx.restore();
}
