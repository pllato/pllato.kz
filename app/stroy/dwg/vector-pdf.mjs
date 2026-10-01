// Vector PDF backend. Embedded OFL osifont; no canvas screenshot or JPEG.
import {paintHatchSteps} from './hatch.mjs?v=0.17.56';
import {textLines} from './renderer.mjs?v=0.17.56';
import {aciColors} from './colors.mjs?v=0.17.56';
import {shxLayout} from './shx-layout.mjs';
import {printLineweight} from './print-lineweight.mjs';
import {localTtf} from './local-ttf.mjs';
const enc=new TextEncoder(),n=v=>{if(!Number.isFinite(v))throw Error('Неверная координата PDF');return Number(v.toFixed(6)).toString();},hex=v=>v.toString(16).padStart(4,'0').toUpperCase();
export function trueType(bytes){
 const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),u=o=>d.getUint16(o),s=o=>d.getInt16(o),l=o=>d.getUint32(o),tables={};
 for(let i=0;i<u(4);i++){const o=12+i*16;tables[String.fromCharCode(...bytes.slice(o,o+4))]=l(o+8);}
 const head=tables.head,hhea=tables.hhea,cmap=tables.cmap,units=u(head+18),count=u(hhea+34),width=id=>u(tables.hmtx+Math.min(id,count-1)*4)*1000/units;
 let format4,format12;for(let i=0;i<u(cmap+2);i++){const p=cmap+l(cmap+4+i*8+4);if(u(p)===4)format4=p;if(u(p)===12)format12=p;}
 function glyph(cp){if(format12){for(let i=0;i<l(format12+12);i++){const p=format12+16+i*12,a=l(p),b=l(p+4);if(cp>=a&&cp<=b)return l(p+8)+cp-a;}}if(format4&&cp<=65535){const c=u(format4+6)/2,e=format4+14,start=e+c*2+2,delta=start+c*2,range=delta+c*2;for(let i=0;i<c;i++)if(cp<=u(e+i*2)){if(cp<u(start+i*2))return 0;const off=u(range+i*2),v=off?u(range+i*2+off+2*(cp-u(start+i*2))):cp;return v?(v+s(delta+i*2))&65535:0;}}return 0;}
 return {bytes,glyph,width,ascent:s(hhea+4)*1000/units,descent:s(hhea+6)*1000/units,bbox:[36,38,40,42].map(o=>s(head+o)*1000/units)};
}
export async function vectorPdf(pages,onProgress=()=>{}){
 const response=await fetch(new URL('./vendor/osifont/osifont.ttf',import.meta.url),{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Не загружен шрифт PDF');
 const defaultFont={...trueType(new Uint8Array(await response.arrayBuffer())),name:'osifont',used:new Map(),resource:'F1'},fonts=[defaultFont],fontCache=new Map(),streams=[],layers=[...new Set(pages.flatMap(p=>p.shapes.map(s=>s.layer||'0')))],layerIds=new Map(layers.map((name,i)=>[name,i]));
 const chooseFont=a=>{const source=a.font?.source||'',local=localTtf(source);if(!local){if(/^(times|times new roman)(\.ttf|\||$)/i.test(source))throw Error('Для точного PDF загрузите Times New Roman.ttf через «Шрифты»');return defaultFont;}if(!fontCache.has(local.name)){const f={...trueType(local.bytes),name:local.postscript,used:new Map(),resource:'F'+(fonts.length+1)};fontCache.set(local.name,f);fonts.push(f);}return fontCache.get(local.name);};
 let font=defaultFont,used=font.used;
 const textInfo=text=>{let width=0,encoded='';for(const ch of text){const cp=ch.codePointAt(0),g=font.glyph(cp);if(!g&&cp!==32)throw Error('В шрифте PDF нет символа '+ch);used.set(g,ch);width+=font.width(g);encoded+=hex(g);}return {width,encoded};};
 const color=value=>{let c=value||'#000000';if(c.toLowerCase()==='#ffffff')c='#000000';return [1,3,5].map(i=>n(parseInt(c.slice(i,i+2),16)/255)).join(' ');};
 for(let pageIndex=0;pageIndex<pages.length;pageIndex++){
  onProgress(pageIndex,pages.length);await new Promise(r=>setTimeout(r,0));const {shapes,bounds:b}=pages[pageIndex],w=1190.551,h=841.89,pad=2,s=Math.min((w-pad*2)/(b[2]-b[0]),(h-pad*2)/(b[3]-b[1])),x=w/2-(b[0]+b[2])*s/2,y=h/2+(b[1]+b[3])*s/2,out=['q','0 0 '+n(w)+' '+n(h)+' re W n','1 0 0 -1 0 '+n(h)+' cm'];
  const emit=t=>out.push(t),path=pts=>{for(let i=0;i<pts.length;i++)emit(n(pts[i][0])+' '+n(pts[i][1])+(i?' l':' m'));};
  // Canvas-compatible subset for the existing CAD hatch geometry/clip algorithm.
  const hatchContext={save:()=>emit('q'),restore:()=>emit('Q'),beginPath:()=>emit('n'),moveTo:(a,b)=>emit(`${n(a)} ${n(b)} m`),lineTo:(a,b)=>emit(`${n(a)} ${n(b)} l`),closePath:()=>emit('h'),fill:rule=>emit(rule==='evenodd'?'f*':'f'),clip:rule=>emit(rule==='evenodd'?'W* n':'W n'),stroke:()=>emit('S'),transform:(...m)=>emit(m.map(n).join(' ')+' cm'),set fillStyle(c){emit(color(c)+' rg');},set strokeStyle(c){emit(color(c)+' RG');},set lineWidth(v){emit(n(v)+' w');}};
  let activeLayer=-1,lastYield=performance.now();
  const pause=async j=>{onProgress(pageIndex+j/Math.max(1,shapes.length),pages.length,'Формирование PDF');await new Promise(r=>setTimeout(r,0));onProgress(pageIndex+j/Math.max(1,shapes.length),pages.length,'Формирование PDF');lastYield=performance.now();};
  for(let j=0;j<shapes.length;j++){
   if(j%128===0&&performance.now()-lastYield>8)await pause(j);
   const a=shapes[j],c=color(a.rgb||aciColors[a.color]),layer=layerIds.get(a.layer||'0');if(layer!==activeLayer){if(activeLayer>=0)emit('EMC');emit(`/OC /L${layer} BDC`);activeLayer=layer;}emit(c+' RG '+c+' rg');emit(n(printLineweight(a))+' w');
   if(a.hatch){for(const step of paintHatchSteps(hatchContext,a,{s,x,y},a.rgb||aciColors[a.color]||'#000000',w,h,true)){if(performance.now()-lastYield>8)await pause(j);}continue;}
   if(a.text!==null){
    font=chooseFont(a);used=font.used;
    const strokes=shxLayout(a);
    if(strokes){const size=a.height*s,scale=a.textScale||1,angle=-a.angle,cs=Math.cos(angle),sn=Math.sin(angle);emit('q');emit([cs,sn,-sn,cs,a.pts[0][0]*s+x,y-a.pts[0][1]*s].map(n).join(' ')+' cm');emit([scale,0,-Math.tan(a.oblique||0)*scale,1,0,0].map(n).join(' ')+' cm');emit(n(a.lineweight>0?a.lineweight/100*72/25.4:.35)+' w');const actual=Array.from({length:a.text.length},(_,i)=>hex(a.text.charCodeAt(i))).join('');emit('/Span << /ActualText <FEFF'+actual+'> >> BDC');for(const points of strokes){path(points.map(([px,py])=>[px*size,py*size]));emit('S');}emit(`BT /F1 ${n(size)} Tf 3 Tr 1 0 0 -1 0 0 Tm <${textInfo(' ').encoded}> Tj ET`);emit('EMC');emit('Q');continue;}
    const size=a.height*s,scale=a.textScale||1,lines=a.multiline?textLines(a.text,(a.textWidth||0)*s,t=>textInfo(t).width*size/1000):[a.text],anchor=Math.max(1,Math.min(9,a.attachment||1)),row=Math.floor((anchor-1)/3),col=(anchor-1)%3;
    emit('q');const angle=-a.angle,cs=Math.cos(angle),sn=Math.sin(angle);emit([cs,sn,-sn,cs,a.pts[0][0]*s+x,y-a.pts[0][1]*s].map(n).join(' ')+' cm');emit([scale,0,-Math.tan(a.oblique||0)*scale,1,0,0].map(n).join(' ')+' cm');
    for(let k=0;k<lines.length;k++){const t=textInfo(lines[k]),align=a.multiline?col:(a.halign||0),dx=-(align===1?.5:align===2?1:0)*t.width*size/1000;
     let dy=0;if(a.multiline)dy=k*size*1.2-row*(size+(lines.length-1)*size*1.2)/2+font.ascent*size/1000;else if(a.valign===1)dy=font.descent*size/1000;else if(a.valign===2)dy=(font.ascent+font.descent)*size/2000;else if(a.valign===3)dy=font.ascent*size/1000;
     emit(`BT /${font.resource} ${n(size)} Tf 1 0 0 -1 ${n(dx)} ${n(dy)} Tm <${t.encoded}> Tj ET`);
    }emit('Q');continue;
   }
   path(a.pts.map(p=>[p[0]*s+x,y-p[1]*s]));emit(a.fill?'f':'S');
  }if(activeLayer>=0)emit('EMC');emit('Q');streams.push(new Uint8Array(await new Response(new Blob([out.join('\n')]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()));
 }
 const parts=[],offsets=[0];let length=0;const push=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);length+=b.length;},obj=(id,body)=>{offsets[id]=length;push(`${id} 0 obj\n`);body();push('\nendobj\n');},stream=(id,bytes,extra='')=>obj(id,()=>{push(`<< /Length ${bytes.length} ${extra} >>\nstream\n`);push(bytes);push('\nendstream');});
 const pageStart=3+fonts.length*5,layerStart=pageStart+streams.length*2,refs=layers.map((_,i)=>`${layerStart+i} 0 R`).join(' ');
 push('%PDF-1.7\n');obj(1,()=>push(`<< /Type /Catalog /Pages 2 0 R /OCProperties << /OCGs [${refs}] /D << /Order [${refs}] /ON [${refs}] >> >> >>`));obj(2,()=>push(`<< /Type /Pages /Count ${streams.length} /Kids [${streams.map((_,i)=>`${pageStart+i*2} 0 R`).join(' ')}] >>`));
 for(let fi=0;fi<fonts.length;fi++){const font=fonts[fi],used=font.used,id=3+fi*5;
 obj(id,()=>push(`<< /Type /Font /Subtype /Type0 /BaseFont /${font.name} /Encoding /Identity-H /DescendantFonts [${id+1} 0 R] /ToUnicode ${id+4} 0 R >>`));
 obj(id+1,()=>push(`<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${font.name} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${id+2} 0 R /CIDToGIDMap /Identity /W [${[...used.keys()].map(g=>`${g} [${n(font.width(g))}]`).join(' ')}] >>`));
 obj(id+2,()=>push(`<< /Type /FontDescriptor /FontName /${font.name} /Flags 32 /FontBBox [${font.bbox.map(n).join(' ')}] /ItalicAngle 0 /Ascent ${n(font.ascent)} /Descent ${n(font.descent)} /CapHeight ${n(font.ascent)} /StemV 80 /FontFile2 ${id+3} 0 R >>`));stream(id+3,font.bytes,`/Length1 ${font.bytes.length}`);
 const mappings=[...used].map(([g,ch])=>`<${hex(g)}> <${Array.from({length:ch.length},(_,i)=>hex(ch.charCodeAt(i))).join('')}>`),cmap=['/CIDInit /ProcSet findresource begin 12 dict begin begincmap','/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def','/CMapName /PllatoUnicode def /CMapType 2 def','1 begincodespacerange <0000> <FFFF> endcodespacerange'];for(let i=0;i<mappings.length;i+=100){const m=mappings.slice(i,i+100);cmap.push(`${m.length} beginbfchar`,...m,'endbfchar');}cmap.push('endcmap CMapName currentdict /CMap defineresource pop end end');stream(id+4,enc.encode(cmap.join('\n')));}
 streams.forEach((bytes,i)=>{const id=pageStart+i*2;obj(id,()=>push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1190.551 841.89] /Resources << /Font << ${fonts.map((f,k)=>`/${f.resource} ${3+k*5} 0 R`).join(' ')} >> /Properties << ${layers.map((_,k)=>`/L${k} ${layerStart+k} 0 R`).join(' ')} >> >> /Contents ${id+1} 0 R >>`));stream(id+1,bytes,'/Filter /FlateDecode');});
 layers.forEach((name,i)=>obj(layerStart+i,()=>push(`<< /Type /OCG /Name <FEFF${Array.from({length:name.length},(_,i)=>hex(name.charCodeAt(i))).join('')}> >>`)));
 const xref=length;push(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);for(const offset of offsets.slice(1))push(String(offset).padStart(10,'0')+' 00000 n \n');push(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(parts,{type:'application/pdf'});
}
