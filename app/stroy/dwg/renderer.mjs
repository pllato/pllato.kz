// SPDX-License-Identifier: GPL-3.0-or-later
import {paintHatch} from './hatch.mjs?v=0.17.73';
import {shxLayout} from './shx-layout.mjs';
export function previewTransform(current,cached){const scale=current.s/cached.s;return {scale,x:current.x-cached.x*scale,y:current.y-cached.y*scale};}
export function textLines(text,width,measure){return text.split(/\r?\n/).flatMap(paragraph=>{if(!(width>0))return [paragraph];const lines=[];let line='';for(const word of paragraph.split(/\s+/)){const next=line?line+' '+word:word;if(line&&measure(next)>width){lines.push(line);line=word;}else line=next;}lines.push(line);return lines;});}
export function textHitDistance(ctx,s,p,view){
 const size=s.height*view.s;if(!(size>0))return Infinity;
 const dx=p[0]-(s.pts[0][0]*view.s+view.x),dy=p[1]-(view.y-s.pts[0][1]*view.s),c=Math.cos(s.angle||0),sn=Math.sin(s.angle||0);
 const y=dx*sn+dy*c,x=(dx*c-dy*sn+y*Math.tan(s.oblique||0))/(s.textScale||1);
 ctx.save();const f=s.font;ctx.font=(f?.italic?'italic ':'')+(f?.bold?'bold ':'')+Math.max(2,size)+'px "'+(f?.family||'Arial')+'"';
 const lines=s.multiline?textLines(s.text,s.textWidth*view.s,t=>ctx.measureText(t).width):[s.text];
 const a=Math.max(1,Math.min(9,s.attachment||1)),col=s.multiline?(a-1)%3:s.halign||0,row=Math.floor((a-1)/3),total=size+(lines.length-1)*size*1.2;
 const top=s.multiline?-row*total/2:({0:-size,1:-size,2:-size/2,3:0}[s.valign||0]);let best=Infinity;
 for(let i=0;i<lines.length;i++){const width=ctx.measureText(lines[i]).width,left=-width*([0,.5,1][col]||0),t=top+i*size*1.2;best=Math.min(best,Math.hypot(Math.max(left-x,0,x-left-width),Math.max(t-y,0,y-t-size)));}
 ctx.restore();return best;
}
// Последовательные линии одного цвета рисуем пачкой, сохраняя порядок цветов,
// заливок и текста. Экранные координаты не создают временные массивы точек.
export function paintShapes(ctx,shapes,{view,width,height,hidden,selected,colors,pixelsPerMm=96/25.4}){
 const steps=paintShapeSteps(ctx,shapes,{view,width,height,hidden,selected,colors,pixelsPerMm});
 while(!steps.next().done){}
}
// Keep the same path/batching state across yields: chunking must not change
// painter order, overlapping strokes, hatches or text. Use a private context.
export function* paintShapeSteps(ctx,shapes,{view,width,height,hidden,selected,colors,pixelsPerMm=96/25.4},budgetMs=8){
 const scale=view.s,ox=view.x,oy=view.y;
 const left=(-20-ox)/scale,right=(width+20-ox)/scale,bottom=(oy-height-20)/scale,top=(oy+20)/scale;
 let color=null,lineWidth=1,segments=0;
 const flush=()=>{if(segments){ctx.stroke();segments=0;}};
 let checked=0,start=performance.now();
 for(const shape of shapes){
  if(++checked%64===0&&performance.now()-start>=budgetMs){yield;start=performance.now();}
  const b=shape.bounds;
  if(hidden.has(shape.layer)||b[2]<left||b[0]>right||b[3]<bottom||b[1]>top)continue;
  const isSelected=selected instanceof Set?selected.has(shape.entityKey):shape.id===selected||shape.entityKey===selected||shape.deviceId===selected;
  const sourceColor=shape.rgb||colors[shape.color]||'#ffffff';
  const nextColor=isSelected?'#c26b00':/^#(?:fff|ffffff)$/i.test(sourceColor)?'#000000':sourceColor,weight=Math.max(1,(shape.lineweight||0)/100*pixelsPerMm),nextWidth=isSelected?Math.max(2.5,weight):weight;
  if(shape.hatch){flush();paintHatch(ctx,shape,view,nextColor,width,height);continue;}
  if(shape.text!==null){
   const p=shape.pts[0],x=p[0]*scale+ox,y=oy-p[1]*scale,size=shape.height*scale;
   if(size<2||size>2000||x<-2000||x>width+2000||y<-2000||y>height+2000)continue;
   flush();ctx.save();ctx.fillStyle=nextColor;ctx.translate(x,y);ctx.rotate(-shape.angle);const f=shape.font;ctx.font=(f?.italic?'italic ':'')+(f?.bold?'bold ':'')+Math.max(2,size)+'px "'+(f?.family||'Arial')+'"';
   if(shape.textScale&&shape.textScale!==1)ctx.scale(shape.textScale,1);if(shape.oblique)ctx.transform(1,0,-Math.tan(shape.oblique),1,0,0);
   let strokes=null;try{strokes=shxLayout(shape);}catch{/* The font catalog reports missing glyphs; PDF refuses this substitution. */}
   if(strokes){ctx.strokeStyle=nextColor;ctx.lineWidth=Math.max(1,(shape.lineweight||0)/100*pixelsPerMm);ctx.beginPath();for(const path of strokes)for(let i=0;i<path.length;i++){const [px,py]=path[i];if(i)ctx.lineTo(px*size,py*size);else ctx.moveTo(px*size,py*size);}ctx.stroke();ctx.restore();continue;}
   if(shape.multiline){const lines=textLines(shape.text,shape.textWidth*scale,t=>ctx.measureText(t).width),anchor=Math.max(1,Math.min(9,shape.attachment||1)),row=Math.floor((anchor-1)/3),col=(anchor-1)%3,step=size*1.2,total=size+(lines.length-1)*step;ctx.textBaseline='top';ctx.textAlign=['left','center','right'][col];for(let i=0;i<lines.length;i++)ctx.fillText(lines[i],0,i*step-row*total/2);}
   else{ctx.textAlign=['left','center','right'][shape.halign]||'left';ctx.textBaseline=['alphabetic','bottom','middle','top'][shape.valign]||'alphabetic';ctx.fillText(shape.text,0,0);}ctx.restore();continue;
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
