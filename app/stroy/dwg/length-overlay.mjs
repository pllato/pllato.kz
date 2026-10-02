export function midpoint(paths){
 let total=0;for(const p of paths)for(let i=1;i<p.length;i++)total+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);let remaining=total/2;
 for(const p of paths)for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],n=Math.hypot(b[0]-a[0],b[1]-a[1]);if(remaining<=n&&n)return a.map((v,k)=>v+(b[k]-v)*remaining/n);remaining-=n;}return paths[0]?.[0];
}
export function paintLength(ctx,paths,text,screen,width,height){
 const p=midpoint(paths);if(!p)return;const [x,y]=screen(p);if(x<0||y<0||x>width||y>height)return;
 ctx.save();ctx.font='12px "Pllato CAD", sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';const lines=text.split('\n'),w=Math.max(...lines.map(line=>ctx.measureText(line).width)),h=lines.length*17+2,cx=Math.max(w/2+4,Math.min(width-w/2-4,x)),bottom=Math.max(h+3,y-3);ctx.fillStyle='#fffffff0';ctx.fillRect(cx-w/2-4,bottom-h,w+8,h);ctx.fillStyle='#171717';lines.forEach((line,i)=>ctx.fillText(line,cx,bottom-2-(lines.length-1-i)*17));ctx.restore();
}
