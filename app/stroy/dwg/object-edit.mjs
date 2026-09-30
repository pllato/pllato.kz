import {get,num,move,set} from './cad.mjs?v=0.17.45';
import {localDelta} from './cable-edit.mjs?v=0.17.45';
import {movableSpline,splineControls,setSplineControl} from './control-edit.mjs?v=0.17.45';
export function editObjects(doc,targets,{delta=[0,0],remove=false,color}={}){
 if(!targets.length||!delta.every(Number.isFinite))throw Error('Выберите объект');
 if(color!==undefined&&(!Number.isInteger(color)||color<1||color>255))throw Error('Неверный цвет');
 // Resolve a group in one pass, not a full-file scan per selected segment.
 const wanted=new Set(targets.map(t=>t.id)),records=new Map();
 for(const r of doc.records)if(wanted.has(r.id)&&!records.has(r.id)){records.set(r.id,r);if(records.size===wanted.size)break;}
 const plans=targets.map(({id,matrix})=>{
  const r=records.get(id);
  if(!r||r.id.startsWith('executive-')||!['LINE','LWPOLYLINE','ARC','CIRCLE','TEXT','MTEXT','INSERT',...((remove||movableSpline(r))?['SPLINE']:[])].includes(r.type)||(!remove&&(num(r,210)||num(r,220)||num(r,230,1)!==1)))throw Error('Этот тип объекта пока нельзя изменить: '+(r?.type||'не найден')+' · '+id);
  if(remove&&r.type==='MTEXT')throw Error('Удаление MTEXT пока не поддерживается');
  if(doc.executiveProject?.sheets.some(s=>s.nativeHandles.includes(get(r,5))))throw Error('Нельзя изменить весь лист этим инструментом');
  const [dx,dy]=localDelta(matrix,delta);return {r,op:{handle:get(r,5),dx,dy,...(remove?{remove:true}:{}),...(color!==undefined?{color}: {})}};
 });
 // Validate every coordinate and attached attribute before changing any member.
 if(!remove)for(const {r,op} of plans){if(r.type==='SPLINE'){if(splineControls(r).some(h=>!h.point.map((v,i)=>v+(i?op.dy:op.dx)).every(Number.isFinite)))throw Error('Неверный сдвиг');}else move({...r,pairs:structuredClone(r.pairs)},op.dx,op.dy);if(r.type==='INSERT')for(const a of doc.records)if(a.type==='ATTRIB'&&get(a,330)===op.handle)move({...a,pairs:structuredClone(a.pairs)},op.dx,op.dy);}
 const removed=new Set();
 for(const {r,op} of plans){
  if(!remove&&r.type==='SPLINE'){
   if(op.dx||op.dy)for(const h of splineControls(r)){const x=h.point[0]+op.dx,y=h.point[1]+op.dy;setSplineControl(r,h.index,x,y);if(doc.native)doc.nativeOps.push({handle:op.handle,dx:0,dy:0,node:{index:h.index,x,y}});}
   if(color!==undefined){r.pairs=r.pairs.filter(p=>p[0]!==420);set(r,62,color);if(doc.native)doc.nativeOps.push({handle:op.handle,dx:0,dy:0,color});}continue;
  }
  if(remove){removed.add(r);if(r.type==='INSERT')for(const a of doc.records)if(a.type==='ATTRIB'&&get(a,330)===op.handle)removed.add(a);}
  else{move(r,op.dx,op.dy);if(r.type==='INSERT')for(const a of doc.records)if(a.type==='ATTRIB'&&get(a,330)===op.handle)move(a,op.dx,op.dy);if(color!==undefined){r.pairs=r.pairs.filter(p=>p[0]!==420);set(r,62,color);}}
  if(doc.native&&!r.id.startsWith('new-'))doc.nativeOps.push(op);
 }
 if(remove){doc.records=doc.records.filter(r=>!removed.has(r));doc.entities=doc.entities.filter(r=>!removed.has(r));for(const b of doc.blocks.values())b.records=b.records.filter(r=>!removed.has(r));
  const ids=new Set(targets.map(t=>t.id));for(const s of doc.executiveProject?.sheets||[])s.routes=s.routes.filter(r=>!r.sourceIds?.some(id=>ids.has(id)));
 }
}
