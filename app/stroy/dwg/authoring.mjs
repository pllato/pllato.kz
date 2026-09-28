import {get,num} from './cad.mjs?v=0.17';
export const isNew=r=>r?.id?.startsWith('new-');
export function additions(doc){return doc.entities.filter(isNew).map(r=>{
 const color=num(r,62);const style=color>=1&&color<=255?{color}:{};
 if(r.type==='LINE')return {sourceId:r.id,...style,type:r.type,values:[10,20,11,21].map(c=>num(r,c))};
 if(r.type==='TEXT')return {sourceId:r.id,...style,type:r.type,text:get(r,1),values:[num(r,10),num(r,20),num(r,40),num(r,50)*Math.PI/180]};
 if(r.type==='LWPOLYLINE'){const points=[];for(let i=0;i<r.pairs.length;i++)if(r.pairs[i][0]===10){const y=r.pairs.slice(i+1).find(p=>p[0]===20);if(!y)throw Error('Полилиния: отсутствует Y');points.push(Number(r.pairs[i][1]),Number(y[1]));}return {sourceId:r.id,...style,type:r.type,points,closed:!!(num(r,70)&1)};}
 throw Error('Запись нового объекта '+r.type+' пока не поддерживается');
});}
export function writeAdditions(m,items,onCreated=()=>{}){
 if(!Array.isArray(items)||items.length>100000)throw Error('Слишком много новых объектов');
 for(const item of items){let code;
  if(item.type==='LINE'||item.type==='TEXT'){
   if(!Array.isArray(item.values)||item.values.length!==4||!item.values.every(Number.isFinite))throw Error('Неверные координаты нового объекта');
   if(item.type==='LINE')code=m.ccall('pllato_add_line','number',Array(4).fill('number'),item.values);
   else {if(typeof item.text!=='string'||item.text.length>2000||item.text.includes('\0')||item.values[2]<=0)throw Error('Неверный новый текст');code=m.ccall('pllato_add_text','number',['string',...Array(4).fill('number')],[item.text,...item.values]);}
  }else if(item.type==='LWPOLYLINE'){
   if(!Array.isArray(item.points)||item.points.length<4||item.points.length>200000||item.points.length%2||!item.points.every(Number.isFinite))throw Error('Неверная полилиния');
   // ccall array allocates on stack; bound each polyline below stack size.
   const bytes=new Uint8Array(new Float64Array(item.points).buffer);
   code=m.ccall('pllato_add_polyline','number',['array','number','number'],[bytes,item.points.length/2,item.closed?1:0]);
  }else throw Error('Неизвестный тип добавляемого объекта');
  if(code)throw Error('Не удалось создать '+item.type+' (код '+code+')');
  if(item.color!==undefined){if(!Number.isInteger(item.color)||item.color<1||item.color>255)throw Error('Неверный цвет');const handle=m.ccall('pllato_last_handle','string',[],[]);if(m.ccall('pllato_color','number',['string','number'],[handle,item.color]))throw Error('Не удалось записать цвет');}
  onCreated(item);
 }
}
