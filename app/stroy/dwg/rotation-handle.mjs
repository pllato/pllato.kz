const map=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
export function rotationFrame(pivot,matrix=[1,0,0,1,0,0]){
 matrix=matrix||[1,0,0,1,0,0];
 if(!Array.isArray(matrix)||matrix.length!==6||!matrix.every(Number.isFinite))return null;
 const [a,b,c,d,x,y]=matrix,det=a*d-b*c;if(Math.abs(det)<1e-12)return null;
 const inv=[d/det,-b/det,-c/det,a/det,(c*y-d*x)/det,(b*x-a*y)/det];
 return {pivot,matrix,inv,world:map(matrix,pivot)};
}
export function rotationDelta(frame,start,end){
 const angle=p=>{const q=map(frame.inv,p);return Math.atan2(q[1]-frame.pivot[1],q[0]-frame.pivot[0]);};
 const delta=angle(end)-angle(start);return Math.atan2(Math.sin(delta),Math.cos(delta))*180/Math.PI;
}
export function rotatedPoint(frame,p,degrees){
 const q=map(frame.inv,p),a=degrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a),x=q[0]-frame.pivot[0],y=q[1]-frame.pivot[1];
 return map(frame.matrix,[frame.pivot[0]+c*x-s*y,frame.pivot[1]+s*x+c*y]);
}
