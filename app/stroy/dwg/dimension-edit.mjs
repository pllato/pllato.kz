import {get,num,set} from './cad.mjs?v=0.17.77';
const point=(r,c)=>[num(r,c,NaN),num(r,c+10,NaN)];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
export const dimensionAssociated=(doc,r)=>!!(r.dimensionEndLocked||r.dimensionMoveLocked)&&!doc.nativeOps?.some(op=>op.handle===get(r,5)&&op.detachDimension===true);
export function dimensionDefinition(r){
 if(r?.type!=='DIMENSION'||num(r,70,-1)!==0||num(r,210)||num(r,220)||num(r,230,1)!==1)return null;
 const a=point(r,13),b=point(r,14),q=point(r,10),angle=num(r,50,NaN)*Math.PI/180,d=[Math.cos(angle),Math.sin(angle)],n=[-d[1],d[0]];
 if(![...a,...b,...q,...d].every(Number.isFinite))return null;
 const signed=dot(b,d)-dot(a,d);if(Math.abs(signed)<1e-8)return null;
 return {a,b,q,d,n,signed,length:Math.abs(signed),offset:dot(q,n)-(dot(a,n)+dot(b,n))/2};
}
// Edit the DIMENSION definition and its private cached graphics together.
// Glyphs and arrow blocks keep their size; no CAD entity is exploded/deleted.
export function planDimensionEdit(doc,r,{length,offset,endNormal=0}){
 const f=dimensionDefinition(r);if(!f)throw Error('Поддерживаются плоские линейные размеры');
 if(r.dimensionEndLocked&&dimensionAssociated(doc,r)&&(Math.abs(length-f.length)>1e-8||Math.abs(endNormal)>1e-8))throw Error('Конец размера связан средствами AutoCAD. Изменение этой зависимости пока не поддерживается');
 if(!Number.isFinite(length)||length<=1e-8||!Number.isFinite(offset)||!Number.isFinite(endNormal))throw Error('Введите положительную длину и конечный вынос');
 const block=doc.blocks.get(get(r,2));if(!block||!block.records.length)throw Error('Нет графического блока размера');
 if(doc.records.some(other=>other!==r&&['DIMENSION','INSERT'].includes(other.type)&&get(other,2)===get(r,2)))throw Error('Графика размера используется несколькими объектами');
 if(block.records.some(v=>!['LINE','INSERT','MTEXT','TEXT','POINT'].includes(v.type)))throw Error('Сложное оформление размера пока не поддерживается');
 const anchors=block.records.filter(v=>v.type==='POINT').map(v=>point(v,10)),tolerance=Math.max(1e-5,f.length*1e-6);
 if(anchors.length&&![f.a,f.b].every(p=>anchors.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<tolerance)))throw Error('Определение и графика этого размера используют разные координаты. Правка отменена для сохранности DWG');
 const old=dot(f.a,f.d),deltaLength=Math.sign(f.signed)*length-f.signed,deltaOffset=offset-f.offset+endNormal/2;
 const map=p=>{const t=(dot(p,f.d)-old)/f.signed,base=(1-t)*dot(f.a,f.n)+t*dot(f.b,f.n),den=dot(f.q,f.n)-base;
  const weight=Math.abs(den)>1e-8?(dot(p,f.n)-base)/den:0,normal=(1-weight)*t*endNormal+weight*deltaOffset;
  return [p[0]+f.d[0]*t*deltaLength+f.n[0]*normal,p[1]+f.d[1]*t*deltaLength+f.n[1]*normal];};
 const q=[f.q[0]+f.d[0]*deltaLength+f.n[0]*deltaOffset,f.q[1]+f.d[1]*deltaLength+f.n[1]*deltaOffset];
 const b=f.b.map((v,i)=>v+f.d[i]*deltaLength+f.n[i]*endNormal),text=String(Number(length.toFixed(3))),patches=[];
 const add=(record,changes)=>patches.push({record,handle:get(record,5),type:record.type,changes});
 const t=map(point(r,11));add(r,[[14,b[0]],[24,b[1]],[10,q[0]],[20,q[1]],[11,t[0]],[21,t[1]],[42,length],[1,'']]);
 for(const child of block.records){
  const changes=[];for(const c of ['LINE','TEXT'].includes(child.type)?[10,11]:[10]){if(!child.pairs.some(p=>p[0]===c))continue;const p=map(point(child,c));changes.push([c,p[0]],[c+10,p[1]]);}
  if(['TEXT','MTEXT'].includes(child.type))changes.push([1,text]);
  add(child,changes);
 }
 if(patches.some(p=>p.changes.some(([c,v])=>c!==1&&!Number.isFinite(v))))throw Error('Некорректная геометрия размера');
 return {patches,definition:[...f.a,...b,...q,...t,length]};
}
export function applyDimensionPlan(plan){for(const {record,changes}of plan.patches)for(const [code,value]of changes)set(record,code,value);}
export function planDimensionMove(doc,r,delta,{detach=false}={}){
 if(!Array.isArray(delta)||delta.length!==2||!delta.every(Number.isFinite))throw Error('Некорректный сдвиг размера');
 const f=dimensionDefinition(r);if(!f)throw Error('Выберите линейный размер');
 if(dimensionAssociated(doc,r)&&!detach)throw Error('Размер связан средствами AutoCAD; независимый перенос недоступен');
 // Reuse the private-cache/coordinate checks without applying a stretch.
 planDimensionEdit(doc,r,{length:f.length,offset:f.offset});
 const records=[r,...doc.blocks.get(get(r,2)).records];
 return {patches:records.map(record=>{const codes=record===r?[10,11,13,14]:['LINE','TEXT'].includes(record.type)?[10,11]:[10],changes=[];
  for(const c of codes)if(record.pairs.some(p=>p[0]===c)){const p=point(record,c);changes.push([c,p[0]+delta[0]],[c+10,p[1]+delta[1]]);}
  if(changes.some(([,v])=>!Number.isFinite(v)))throw Error('Некорректные координаты размера');return {record,changes};})};
}
