// One bounded screen-space stroke becomes one CAD polyline, never a raster.
const distance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
export function simplifyStroke(points,tolerance=.75){if(points.length<3)return points.map(p=>[...p]);const keep=new Set([0,points.length-1]),stack=[[0,points.length-1]];while(stack.length){const [a,b]=stack.pop();let max=tolerance,index=-1;for(let i=a+1;i<b;i++){const d=distance(points[i],points[a],points[b]);if(d>max){max=d;index=i;}}if(index>=0){keep.add(index);stack.push([a,index],[index,b]);}}return [...keep].sort((a,b)=>a-b).map(i=>[...points[i]]);}
export function freehandGesture(api){let id=null,points=[];
 const reset=()=>{id=null;points=[];api.draw();};
 const sample=p=>{if(points.length&&Math.hypot(p[0]-points.at(-1)[0],p[1]-points.at(-1)[1])<1.5)return;if(points.length>=8192)points=points.filter((_,i)=>i%2===0);points.push([...p]);};
 return {reset,active:()=>id!==null,points:()=>points,
 down(pointer,p,button=0){if(!api.enabled()||button!==0)return false;id=pointer;points=[[...p]];api.draw();return true;},
 move(pointer,p){if(pointer!==id)return false;sample(p);api.draw();return true;},
 up(pointer,p){if(pointer!==id)return false;sample(p);if(points.length>1)points.push([...p]);const stroke=simplifyStroke(points);reset();if(stroke.length>1&&stroke.some(q=>Math.hypot(q[0]-stroke[0][0],q[1]-stroke[0][1])>=3))api.commit(stroke);return true;}
 };
}
