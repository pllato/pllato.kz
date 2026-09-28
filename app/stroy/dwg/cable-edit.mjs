// Same Catmull–Rom curve as the graphical editor, sampled for DWG polylines.
export function cableCurve(points,smooth=true){
 if(!smooth||points.length<3)return points.map(p=>[...p]);
 const out=[];
 for(let i=0;i<points.length-1;i++){
  const a=points[i-1]||points[i],b=points[i],c=points[i+1],d=points[i+2]||c;
  for(let j=0;j<32;j++){const t=j/32,t2=t*t,t3=t2*t;out.push([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));}
 }
 out.push([...points.at(-1)]);return out;
}
export function nearestCablePoint(paths,p){
 let best=null,dist=Infinity;
 for(const path of paths)for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1))),q=[a[0]+dx*t,a[1]+dy*t],n=Math.hypot(q[0]-p[0],q[1]-p[1]);if(n<dist){dist=n;best=q;}}
 return best;
}
export function localDelta(matrix,delta){const [a,b,c,d]=matrix||[1,0,0,1],det=a*d-b*c;if(!Number.isFinite(det)||Math.abs(det)<1e-12)throw Error('Вырожденный масштаб объекта');return [(d*delta[0]-c*delta[1])/det,(-b*delta[0]+a*delta[1])/det];}
export function joinCablePaths(paths){
 const pending=paths.map(p=>p.map(q=>[...q]));if(!pending.length)throw Error('Нет линии');const out=pending.shift();
 const size=paths.reduce((n,p)=>n+p.slice(1).reduce((s,q,i)=>s+Math.hypot(q[0]-p[i][0],q[1]-p[i][1]),0),0),tol=Math.max(1e-7,size*1e-5),near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<=tol;
 while(pending.length){let found=false;for(let i=0;i<pending.length;i++){let p=pending[i];if(near(out.at(-1),p[0])||near(out.at(-1),p.at(-1))){if(!near(out.at(-1),p[0]))p.reverse();out.push(...p.slice(1));}else if(near(out[0],p.at(-1))||near(out[0],p[0])){if(!near(out[0],p.at(-1)))p.reverse();out.unshift(...p.slice(0,-1));}else continue;pending.splice(i,1);found=true;break;}if(!found)throw Error('Между участками есть разрыв: форма не изменена');}
 return out;
}
export function bendCable(points,index,end){
 const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));const total=distances.at(-1)||1,centre=distances[index]/total,delta=end.map((v,k)=>v-points[index][k]);
 return points.map((p,i)=>{let weight=i===index?1:0;if(index>0&&index<points.length-1&&i>0&&i<points.length-1){const d=Math.abs(distances[i]/total-centre);if(d<.25)weight=.5*(1+Math.cos(Math.PI*d/.25));}return p.map((v,k)=>v+delta[k]*weight);});
}
