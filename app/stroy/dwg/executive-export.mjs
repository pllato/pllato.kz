import {executiveEntities} from './executive-project.mjs?v=0.17.43';
import {vectorPdf} from './vector-pdf.mjs?v=0.17.43';

export function executivePages(project,shapes,assigned){
 if(!project?.sheets.length)throw Error('Сначала создайте исполнительную');
 const loose=assigned||executiveLooseRoots(project,shapes);
 let offset=0;
 return project.sheets.flatMap(sheet=>{
  const layout=executiveEntities(project,sheet.id),count=layout.items.length,roots=new Set(sheet.nativeHandles.map(h=>'dwg-'+h)),start=offset;offset+=count;
  const selected=shapes.filter(s=>roots.has(s.id)||loose.get(s.id)===sheet.id||s.id.startsWith('executive-')&&Number(s.id.slice(10))>=start&&Number(s.id.slice(10))<offset);
  // Executive PDF is a paper-space plot: content beyond the sheet is clipped,
  // never allowed to shrink its frame and create large blank margins.
  return layout.pageRanges.map((range,index)=>{const pageShapes=selected.filter(s=>{if(!s.id.startsWith('executive-'))return index===0;const n=Number(s.id.slice(10))-start;return n>=range.start&&n<range.end||index===0&&n>=layout.decorationEnd;});const bounds=[...range.origin,range.origin[0]+420*sheet.paperUnit,range.origin[1]+297*sheet.paperUnit];return {sheet,shapes:pageShapes,bounds};});
 });
}

// Standalone text/lines drawn inside exactly one sheet belong to that export.
// Test the complete root bounds, never individual display fragments of a block.
export function executiveLooseRoots(project,shapes){
 const reserved=new Set([...project.sheets.flatMap(s=>s.nativeHandles),(project.generatedHandles||[])].flat().map(h=>'dwg-'+h)),bounds=new Map(),result=new Map();
 for(const s of shapes){if(reserved.has(s.id)||s.id.startsWith('executive-'))continue;const b=bounds.get(s.id);if(b){b[0]=Math.min(b[0],s.bounds[0]);b[1]=Math.min(b[1],s.bounds[1]);b[2]=Math.max(b[2],s.bounds[2]);b[3]=Math.max(b[3],s.bounds[3]);}else bounds.set(s.id,[...s.bounds]);}
 for(const [id,b] of bounds){const owners=project.sheets.filter(s=>b[0]>=s.origin[0]&&b[1]>=s.origin[1]&&b[2]<=s.origin[0]+420*s.paperUnit&&b[3]<=s.origin[1]+297*s.paperUnit);if(owners.length===1)result.set(id,owners[0].id);}
 return result;
}

// A self-contained image PDF; CAD editing remains in the DWG export.
export function imagePdf(pages){
 const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
 const push=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);length+=b.length;};
 const obj=(id,body)=>{offsets[id]=length;push(id+' 0 obj\n');body();push('\nendobj\n');};
 push('%PDF-1.4\n');obj(1,()=>push('<< /Type /Catalog /Pages 2 0 R >>'));
 obj(2,()=>push(`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')}] >>`));
 pages.forEach((page,i)=>{const id=3+i*3;obj(id,()=>push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1190.551 841.89] /Resources << /XObject << /Im ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`));obj(id+1,()=>{push(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`);push(page.bytes);push('\nendstream');});const content='q 1190.551 0 0 841.89 0 0 cm /Im Do Q';obj(id+2,()=>push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));});
 const xref=length;push(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);for(const n of offsets.slice(1))push(String(n).padStart(10,'0')+' 00000 n \n');push(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(parts,{type:'application/pdf'});
}

export async function executivePdf(project,shapes,onProgress=()=>{},options={}){
 const measure=document.createElement('canvas').getContext('2d');
 // Screen text bounds are intentionally very generous for hit-testing. Use
 // font metrics here so those hit areas do not create enormous printed margins.
 const hidden=new Set(options.hiddenLayers||[]);
 const printable=shapes.filter(shape=>!hidden.has(shape.layer)).map(shape=>{
  if(shape.text===null||shape.multiline)return shape;
  const f=shape.font;measure.font=(f?.italic?'italic ':'')+(f?.bold?'bold ':'')+'100px "'+(f?.family||'Arial')+'"';measure.textAlign=['left','center','right'][shape.halign]||'left';measure.textBaseline=['alphabetic','bottom','middle','top'][shape.valign]||'alphabetic';
  const metrics=measure.measureText(shape.text),k=shape.height/100,c=Math.cos(shape.angle),s=Math.sin(shape.angle),origin=shape.pts[0],points=[];
  for(const x of [-metrics.actualBoundingBoxLeft,metrics.actualBoundingBoxRight])for(const y of [-metrics.actualBoundingBoxAscent,metrics.actualBoundingBoxDescent]){const X=(x-Math.tan(shape.oblique||0)*y)*k*(shape.textScale||1),Y=-y*k;points.push([origin[0]+X*c-Y*s,origin[1]+X*s+Y*c]);}
  return {...shape,bounds:[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]};
 });
 let sheets;
 if(options.whole){const bounds=[Infinity,Infinity,-Infinity,-Infinity];for(const s of printable){bounds[0]=Math.min(bounds[0],s.bounds[0]);bounds[1]=Math.min(bounds[1],s.bounds[1]);bounds[2]=Math.max(bounds[2],s.bounds[2]);bounds[3]=Math.max(bounds[3],s.bounds[3]);}if(!bounds.every(Number.isFinite))throw Error('Нет отображаемой геометрии для PDF');if(bounds[2]===bounds[0])bounds[2]++;if(bounds[3]===bounds[1])bounds[3]++;sheets=[{shapes:printable,bounds}];}
 else sheets=executivePages(project,printable,executiveLooseRoots(project,shapes)).filter(p=>!options.ids||options.ids.includes(p.sheet.id));
 if(!sheets.length)throw Error('Не выбраны исполнительные');if(sheets.length>50)throw Error('Предел PDF: 50 исполнительных за выгрузку');
 return vectorPdf(sheets,onProgress);
}
