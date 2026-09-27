// SPDX-License-Identifier: GPL-3.0-or-later
export function previewTransform(current,cached){const scale=current.s/cached.s;return {scale,x:current.x-cached.x*scale,y:current.y-cached.y*scale};}
// Последовательные линии одного цвета рисуем пачкой, сохраняя порядок цветов,
// заливок и текста. Экранные координаты не создают временные массивы точек.
export function paintShapes(ctx,shapes,{view,width,height,hidden,selected,colors}){
 const scale=view.s,ox=view.x,oy=view.y;
 const left=(-20-ox)/scale,right=(width+20-ox)/scale,bottom=(oy-height-20)/scale,top=(oy+20)/scale;
 let color=null,lineWidth=1,segments=0;
 const flush=()=>{if(segments){ctx.stroke();segments=0;}};
 for(const shape of shapes){
  const b=shape.bounds;
  if(hidden.has(shape.layer)||b[2]<left||b[0]>right||b[3]<bottom||b[1]>top)continue;
  const nextColor=shape.id===selected?'#ffbe6c':colors[shape.color]||'#a9bed5',nextWidth=shape.id===selected?2.5:1;
  if(shape.text!==null){
   const p=shape.pts[0],x=p[0]*scale+ox,y=oy-p[1]*scale,size=shape.height*scale;
   if(size<2||size>2000||x<-2000||x>width+2000||y<-2000||y>height+2000)continue;
   flush();ctx.save();ctx.fillStyle=nextColor;ctx.translate(x,y);ctx.rotate(-shape.angle);ctx.font=Math.max(2,size)+'px Arial';ctx.fillText(shape.text,0,0);ctx.restore();continue;
  }
  if(color!==nextColor||lineWidth!==nextWidth||shape.fill){flush();color=nextColor;lineWidth=nextWidth;ctx.strokeStyle=color;ctx.lineWidth=lineWidth;}
  if(!segments)ctx.beginPath();
  const points=shape.pts;
  for(let i=0;i<points.length;i++){const p=points[i],x=p[0]*scale+ox,y=oy-p[1]*scale;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
  segments+=points.length;
  if(shape.fill){ctx.fillStyle=color;ctx.fill();flush();}else if(segments>=4096)flush();
 }
 flush();
}
