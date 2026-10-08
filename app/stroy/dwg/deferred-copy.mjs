import {cloneRecord,restoreCompactRecord} from './compact-record.mjs?v=0.17.89';
import {get,num,addEntity} from './cad.mjs?v=0.17.90';
import {copyTransform} from './object-copy.mjs?v=0.17.90';
const identity=[1,0,0,1,0,0];
const supported=new Set(['LINE','LWPOLYLINE','ARC','CIRCLE','TEXT','MTEXT','INSERT']);
export function prepareDeferredCopy(doc,targets,sheet){
 if(!sheet?.nativeHandles?.[0]||!targets.length)throw Error('Выберите исполнительную и объект');
 const matrix=targets[0].matrix||identity;
 if(targets.some(t=>(t.matrix||identity).some((v,i)=>Math.abs(v-matrix[i])>1e-9)))throw Error('Выберите объекты одной CAD-группы');
 const ids=new Set(targets.map(t=>t.id)),records=doc.records.filter(r=>ids.has(r.id));
 if(records.length!==ids.size||records.some(r=>!/^dwg-[0-9a-f]+$/i.test(r.id)||!supported.has(r.type)))throw Error('Этот тип пока нельзя копировать без преобразования CAD-структуры');
 const prefix='COPY_'+crypto.randomUUID(),blocks=new Map();let count=0;
 function clone(records){return records.map(r=>{
  if(++count>20000)throw Error('Слишком большой объект для быстрого копирования');
  const next=cloneRecord(r);next.id=prefix+'_'+count;
  if(r.type==='INSERT'){
   const name=get(r,2),key=prefix+'_'+name;
   if(!blocks.has(key)){const b=doc.blocks.get(name);if(!b)throw Error('Не найден блок '+name);blocks.set(key,{...b,records:[]});blocks.get(key).records=clone(b.records);}
   next.pairs=next.pairs.map(p=>p[0]===2?[2,key]:p);
  }
  return next;
 });}
 // Include attached attributes in the display snapshot, but native copy takes
 // only INSERT handles and preserves their own dependency graph at export.
 const handles=records.map(r=>get(r,5)),owners=new Set(records.filter(r=>r.type==='INSERT').map(r=>get(r,5)));
 const attached=doc.records.filter(r=>r.type==='ATTRIB'&&owners.has(get(r,330)));
 blocks.set(prefix,{base:[0,0,0],records:clone(records.concat(attached))});
 return {handles,parent:sheet.nativeHandles[0],opIndex:doc.nativeOps.length,blocks:[...blocks],name:prefix,matrix:[...matrix]};
}
export function installDeferredBlocks(doc,data){for(const [name,block] of data.blocks){for(const r of block.records)restoreCompactRecord(r);doc.blocks.set(name,block);}}
export function addDeferredCopy(doc,data,delta){
 if(!delta.every(Number.isFinite))throw Error('Неверный сдвиг');
 const [a,b,c,d,x,y]=data.matrix,sx=Math.hypot(a,b),sy=(a*d-b*c)/sx;
 if(!sx||!sy||Math.abs(a*c+b*d)>1e-8*Math.abs(sx*sy))throw Error('Копирование с перекосом не поддерживается');
 installDeferredBlocks(doc,data);
 const r=addEntity(doc,'INSERT',[[2,data.name],[10,x+delta[0]],[20,y+delta[1]],[41,sx],[42,sy],[50,Math.atan2(b,a)*180/Math.PI],[62,data.wrapperColor??256]]);
 r.deferredCopy=structuredClone(data);return r;
}
export function deferredAddition(doc,r){
 const data=r.deferredCopy,sheet=doc.executiveProject?.sheets.find(s=>s.nativeHandles[0]===data.parent);
 if(!sheet)throw Error('Не найдена исполнительная для копии');
 const angle=num(r,50)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),sx=num(r,41,1),sy=num(r,42,1);
 return {type:'COPY',sourceId:r.id,handles:data.handles,parent:data.parent,opIndex:data.opIndex,color:num(r,62,256),transform:copyTransform(doc,sheet,[c*sx,s*sx,-s*sy,c*sy,num(r,10),num(r,20)],[0,0],[0,0])};
}
export function writeDeferredCopies(m,items,index,onCreated=()=>{}){
 for(const item of items)if(item.type==='COPY'&&item.opIndex===index){
  if(!Array.isArray(item.handles)||!item.handles.length||item.handles.length>20000||item.handles.some(h=>!/^[0-9a-f]+$/i.test(h))||!/^[0-9a-f]+$/i.test(item.parent)||item.transform?.length!==5||!item.transform.every(Number.isFinite)||!Number.isInteger(item.color)||item.color<1||item.color>256)throw Error('Неверная отложенная копия');
  const code=m.ccall('pllato_copy_objects','number',['string','string',...Array(5).fill('number')],[item.handles.join(','),item.parent,...item.transform]);
  if(code)throw Error('Копия не прошла проверку CAD-структуры (код '+code+'). Исходный файл не изменён.');
  const handle=m.FS.readFile('/clone-result.txt',{encoding:'utf8'}).trim();
  if(item.color>=1&&item.color<=255&&m.ccall('pllato_color','number',['string','number'],[handle,item.color]))throw Error('Не удалось записать цвет копии');
  onCreated(item,handle);
 }
}
