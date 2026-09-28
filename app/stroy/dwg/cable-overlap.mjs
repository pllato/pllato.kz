// Геометрия только для выбора/метража. CAD-записи не изменяются.
export function curve(s){
 const pts=s.pts,lengths=[0];for(let i=1;i<pts.length;i++)lengths.push(lengths.at(-1)+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
 const length=lengths.at(-1),unit=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
 const tangent=end=>unit(pts[end?pts.length-2:1].map((x,i)=>x-pts[end?pts.length-1:0][i]));
 let circle=null;
 if(s.entityType==='ARC'&&pts.length>2){
  const p=pts[0],q=pts[Math.floor(pts.length/2)],r=pts.at(-1),x=q[0]-p[0],y=q[1]-p[1],u=r[0]-p[0],v=r[1]-p[1],d=2*(x*v-y*u);
  if(Math.abs(d)>1e-12){const cx=((x*x+y*y)*v-(u*u+v*v)*y)/d,cy=(x*(u*u+v*v)-u*(x*x+y*y))/d,c=[p[0]+cx,p[1]+cy],radius=Math.hypot(cx,cy);
   if(pts.every(p=>Math.abs(Math.hypot(p[0]-c[0],p[1]-c[1])-radius)<Math.max(1e-7,length*1e-7))){
    const angles=pts.map(p=>Math.atan2(p[1]-c[1],p[0]-c[0]));let span=0;for(let i=1;i<angles.length;i++)span+=Math.atan2(Math.sin(angles[i]-angles[i-1]),Math.cos(angles[i]-angles[i-1]));
    circle={c,radius,start:angles[0],span};
   }
  }
 }
 function project(p){
  if(circle){const {c,radius,start,span}=circle;let a=(Math.atan2(p[1]-c[1],p[0]-c[0])-start)*Math.sign(span);a=(a+Math.PI*2)%(Math.PI*2);if(a>Math.abs(span)+1e-8)return null;return {t:a/Math.abs(span),distance:Math.abs(Math.hypot(p[0]-c[0],p[1]-c[1])-radius)};}
  let best=null;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dy=b[1]-a[1],n=dx*dx+dy*dy;if(!n)continue;const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/n)),distance=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);if(!best||distance<best.distance)best={t:(lengths[i-1]+t*Math.sqrt(n))/length,distance};}return best;
 }
 function point(t){if(circle){const {c,radius,start,span}=circle;return [c[0]+radius*Math.cos(start+t*span),c[1]+radius*Math.sin(start+t*span)];}const d=t*length;let i=1;while(i<lengths.length-1&&lengths[i]<d)i++;const f=(d-lengths[i-1])/(lengths[i]-lengths[i-1]);return pts[i-1].map((v,k)=>v+f*(pts[i][k]-v));}
 return {length,tangent,project,cut:(lo,hi)=>[point(lo),...pts.filter((p,i)=>lengths[i]/length>lo&&lengths[i]/length<hi),point(hi)]};
}

export function overlapLinks(shapes){
 const geometry=new Map(shapes.map(s=>[s,curve(s)])),ends=shapes.flatMap(s=>[0,1].map(end=>({s,end,p:end?s.pts.at(-1):s.pts[0]}))).sort((a,b)=>a.p[0]-b.p[0]),cache=new Map();
 function links(s,end){const key=s.entityKey+'#'+end;if(cache.has(key))return cache.get(key);const found=[],g=geometry.get(s),p=end?s.pts.at(-1):s.pts[0],radius=g.length*.1;
  let lo=0,hi=ends.length;while(lo<hi){const mid=(lo+hi)>>1;if(ends[mid].p[0]<p[0]-radius)lo=mid+1;else hi=mid;}
  for(let i=lo;i<ends.length&&ends[i].p[0]<=p[0]+radius;i++){const e=ends[i],h=geometry.get(e.s);if(e.s===s||!['LINE','ARC'].includes(s.entityType)||!['LINE','ARC'].includes(e.s.entityType))continue;
   const gap=Math.hypot(p[0]-e.p[0],p[1]-e.p[1]),tol=Math.max(1e-7,Math.min(g.length,h.length)*1e-5);if(gap<=tol||gap>Math.min(g.length,h.length)*.1)continue;
   const a=h.project(p),b=g.project(e.p);if(!a||!b||a.distance>tol||b.distance>tol||Math.abs(a.t-e.end)>.1||Math.abs(b.t-end)>.1)continue;
   const u=g.tangent(end),v=h.tangent(e.end);if(u[0]*v[0]+u[1]*v[1]>-.95)continue;
   found.push({s:e.s,end:e.end,t:a.t,ownT:b.t});
  }cache.set(key,found);return found;
 }
 return {links,geometry};
}
