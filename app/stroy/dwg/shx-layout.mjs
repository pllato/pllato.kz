import {localShx} from './local-shx.mjs';
// Coordinates relative to the text insertion point, y down, unit text height.
export function shxLayout(shape){
 const font=localShx(shape.font?.source);if(!font)return null;
 const lines=shape.text.split(/\r?\n/).flatMap(paragraph=>{
  const width=(shape.textWidth||0)/shape.height;if(!shape.multiline||!(width>0))return [paragraph];
  const result=[];let line='';for(const word of paragraph.split(/\s+/)){const next=line?line+' '+word:word;if(line&&font.layout(next).width>width){result.push(line);line=word;}else line=next;}result.push(line);return result;
 });
 const anchor=Math.max(1,Math.min(9,shape.attachment||1)),row=Math.floor((anchor-1)/3),col=(anchor-1)%3,paths=[];
 for(let k=0;k<lines.length;k++){const t=font.layout(lines[k]),align=shape.multiline?col:shape.halign||0,dx=-(align===1?.5:align===2?1:0)*t.width;
  const dy=shape.multiline?k*1.2-row*(1+(lines.length-1)*1.2)/2+1:shape.valign===2?.5:shape.valign===3?1:0;
  for(const p of t.paths)paths.push(p.map(([x,y])=>[x+dx,dy-y]));
 }return paths;
}
