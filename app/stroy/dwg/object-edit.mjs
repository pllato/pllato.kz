import {get,num,move,set} from './cad.mjs?v=0.16.1';
import {localDelta} from './cable-edit.mjs?v=0.16.1';
export function editObjects(doc,targets,{delta=[0,0],remove=false,color}={}){
 if(!targets.length||!delta.every(Number.isFinite))throw Error('Выберите объект');
 if(color!==undefined&&(!Number.isInteger(color)||color<1||color>255))throw Error('Неверный цвет');
 const plans=targets.map(({id,matrix})=>{
  const r=doc.records.find(r=>r.id===id);
  if(!r||r.id.startsWith('executive-')||!['LINE','LWPOLYLINE','ARC','CIRCLE','TEXT','MTEXT','INSERT'].includes(r.type)||num(r,210)||num(r,220)||num(r,230,1)!==1)throw Error('Этот тип объекта пока нельзя изменить');
  if(remove&&r.type==='MTEXT')throw Error('Удаление MTEXT пока не поддерживается');
  if(doc.executiveProject?.sheets.some(s=>s.nativeHandles.includes(get(r,5))))throw Error('Нельзя изменить весь лист этим инструментом');
  const [dx,dy]=localDelta(matrix,delta);return {r,op:{handle:get(r,5),dx,dy,...(remove?{remove:true}:{}),...(color!==undefined?{color}: {})}};
 });
 // Validate every coordinate and attached attribute before changing any member.
 if(!remove)for(const {r,op} of plans){move({...r,pairs:structuredClone(r.pairs)},op.dx,op.dy);if(r.type==='INSERT')for(const a of doc.records)if(a.type==='ATTRIB'&&get(a,330)===op.handle)move({...a,pairs:structuredClone(a.pairs)},op.dx,op.dy);}
 const removed=new Set();
 for(const {r,op} of plans){
  if(remove){removed.add(r);if(r.type==='INSERT')for(const a of doc.records)if(a.type==='ATTRIB'&&get(a,330)===op.handle)removed.add(a);}
  else{move(r,op.dx,op.dy);if(r.type==='INSERT')for(const a of doc.records)if(a.type==='ATTRIB'&&get(a,330)===op.handle)move(a,op.dx,op.dy);if(color!==undefined){r.pairs=r.pairs.filter(p=>p[0]!==420);set(r,62,color);}}
  if(doc.native&&!r.id.startsWith('new-'))doc.nativeOps.push(op);
 }
 if(remove){doc.records=doc.records.filter(r=>!removed.has(r));doc.entities=doc.entities.filter(r=>!removed.has(r));for(const b of doc.blocks.values())b.records=b.records.filter(r=>!removed.has(r));
  const ids=new Set(targets.map(t=>t.id));for(const s of doc.executiveProject?.sheets||[])s.routes=s.routes.filter(r=>!r.sourceIds?.some(id=>ids.has(id)));
 }
}
