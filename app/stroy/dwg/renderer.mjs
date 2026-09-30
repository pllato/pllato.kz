// SPDX-License-Identifier: GPL-3.0-or-later
import {paintHatch} from './hatch.mjs?v=0.17.27';
export function previewTransform(current,cached){const scale=current.s/cached.s;return {scale,x:current.x-cached.x*scale,y:current.y-cached.y*scale};}
export function textLines(text,width,measure){return text.split(/\r?\n/).flatMap(paragraph=>{if(!(width>0))return [paragraph];const lines=[];let line='';for(const word of paragraph.split(/\s+/)){const next=line?line+' '+word:word;if(line&&measure(next)>width){lines.push(line);line=word;}else line=next;}lines.push(line);return lines;});}
// Последовательные линии одного цвета рисуем пачкой, сохраняя порядок цветов,
// заливок и текста. Экранные координаты не создают временные массивы точек.
export function paintShapes(ctx,shapes,{view,width,height,hidden,selected,colors,pixelsPerMm=96/25.4}){
 const scale=view.s,ox=view.x,oy=view.y;
 const left=(-20-ox)/scale,right=(width+20-ox)/scale,bottom=(oy-height-20)/scale,top=(oy+20)/scale;
 let color=null,lineWidth=1,segments=0;
 const flush=()=>{if(segments){ctx.stroke();segments=0;}};
 for(const shape of shapes){
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
