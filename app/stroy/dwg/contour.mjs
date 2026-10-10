// Selection geometry only. CAD roots are copied intact; contours never cut them.
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const on=(p,a,b)=>Math.abs(cross(a,b,p))<=1e-7*Math.max(1,Math.hypot(b[0]-a[0],b[1]-a[1]))&&p[0]>=Math.min(a[0],b[0])-1e-7&&p[0]<=Math.max(a[0],b[0])+1e-7&&p[1]>=Math.min(a[1],b[1])-1e-7&&p[1]<=Math.max(a[1],b[1])+1e-7;
const proper=(a,b,c,d)=>cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0;
export const intersects=(a,b,c,d)=>proper(a,b,c,d)||on(a,c,d)||on(b,c,d)||on(c,a,b)||on(d,a,b);
export function inside(p,polygon){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[j],b=polygon[i];if(on(p,a,b))return true;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])result=!result;}return result;}
export function selectionContour(area){
 if(area.length===4&&area.every(Number.isFinite))return [[area[0],area[1]],[area[2],area[1]],[area[2],area[3]],[area[0],area[3]]];
 if(!Array.isArray(area)||area.length<3||area.length>256||area.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))throw Error('Контур: укажите от 3 до 256 точек');
 const p=area.map(v=>[...v]);for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8)throw Error('Контур содержит совпадающие точки');for(let j=i+1;j<p.length;j++){if(j===i+1||i===0&&j===p.length-1)continue;if(intersects(a,b,p[j],p[(j+1)%p.length]))throw Error('Стороны контура пересекаются. Уберите последнюю точку.');}}
 const o=p[0],sum=p.reduce((n,a,i)=>n+cross(o,a,p[(i+1)%p.length]),0);if(Math.abs(sum)<1e-8)throw Error('Контур должен охватывать область');return p;
}
export function contourHits(shape,polygon,crossing){
 const pts=shape.pts||[],contained=pts.map(p=>inside(p,polygon));if(!pts.length)return false;
 if(crossing&&contained.some(Boolean))return true;if(!crossing&&!contained.every(Boolean))return false;
 for(let i=1;i<pts.length;i++)for(let j=0;j<polygon.length;j++){const a=pts[i-1],b=pts[i],c=polygon[j],d=polygon[(j+1)%polygon.length];if(crossing?intersects(a,b,c,d):proper(a,b,c,d))return crossing;}
 if(crossing&&(shape.fill||shape.hatch)&&polygon.some(p=>inside(p,pts)))return true;
 return !crossing;
}
