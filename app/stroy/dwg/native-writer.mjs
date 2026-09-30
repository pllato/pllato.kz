// SPDX-License-Identifier: GPL-3.0-or-later
import createModule from './vendor/pllato-executive-engine.mjs?v=0.17.43';
import {writeAdditions} from './authoring.mjs?v=0.17.43';
import {writeDeferredCopies} from './deferred-copy.mjs?v=0.17.43';
self.onmessage=async({data})=>{
 try{
  const {buffer,ops,added=[]}=data;
  if(!(buffer instanceof ArrayBuffer)||!Array.isArray(ops)||ops.length>100000)throw Error('Неверный пакет изменений.');
  self.postMessage({progress:'Открываю исходный DWG для записи изменений…',percent:10});
  const m=await createModule({locateFile:p=>new URL('./vendor/'+p+'?v=0.17.43',import.meta.url).href,print:()=>{},printErr:()=>{}});
  m.FS.writeFile('/input.dwg',new Uint8Array(buffer));
  const opened=m.ccall('pllato_open','number',['string'],['/input.dwg']);
  if(opened>=128)throw Error('DWG не прочитан: '+opened);
  if(added.some(i=>i.type==='COPY'&&(!Number.isInteger(i.opIndex)||i.opIndex<0||i.opIndex>ops.length)))throw Error('Неверный порядок копии');
  for(let opIndex=0;opIndex<=ops.length;opIndex++){
   writeDeferredCopies(m,added,opIndex);if(opIndex===ops.length)break;
   const op=ops[opIndex];
   if(op.styleFont!==undefined){if(typeof op.styleFont!=='string'||!/^([0-9a-f]+)$/i.test(op.handle))throw Error('Неверный стиль');const code=m.ccall('pllato_style_font','number',['string','string'],[op.handle,op.styleFont]);if(code)throw Error('Смена шрифта отклонена: '+code);continue;}
   if(op.layerOff!==undefined){if(typeof op.layerOff!=='boolean'||!/^([0-9a-f]+)$/i.test(op.handle))throw Error('Неверный слой');if(m.ccall('pllato_layer_off','number',['string','number'],[op.handle,Number(op.layerOff)]))throw Error('Слой не найден');continue;}
   if(op.vertex){const {index,x,y}=op.vertex;if(!Number.isInteger(index)||![x,y].every(Number.isFinite))throw Error('Неверная вершина');const code=m.ccall('pllato_vertex','number',['string','number','number','number'],[op.handle,index,x,y]);if(code)throw Error('Правка вершины отклонена: '+code);}
   if(!/^[0-9a-f]+$/i.test(op.handle)||!Number.isFinite(op.dx)||!Number.isFinite(op.dy))throw Error('Неверные параметры изменения.');
   if(op.node){const {index,x,y}=op.node;if(!Number.isInteger(index)||![x,y].every(Number.isFinite))throw Error('Неверная точка');const code=m.ccall('pllato_spline_point','number',['string','number','number','number'],[op.handle,index,x,y]);if(code)throw Error('Правка SPLINE отклонена: '+op.handle+' · '+code);}
   if(op.angle!==undefined){if(!Number.isFinite(op.angle))throw Error('Неверный угол');const code=m.ccall('pllato_insert_angle','number',['string','number'],[op.handle,op.angle]);if(code)throw Error('Поворот прибора отклонён: '+op.handle);}
   if(op.remove){const code=m.ccall('pllato_remove','number',['string'],[op.handle]);if(code)throw Error('Нельзя удалить объект '+op.handle+' (код '+code+').');continue;}
   if(op.color!==undefined){if(!Number.isInteger(op.color)||op.color<1||op.color>255)throw Error('Неверный цвет');const code=m.ccall('pllato_color','number',['string','number'],[op.handle,op.color]);if(code)throw Error('Нельзя изменить цвет '+op.handle+' (код '+code+').');}
   if(op.dx||op.dy){const code=m.ccall('pllato_move','number',['string','number','number'],[op.handle,op.dx,op.dy]);if(code)throw Error('Нельзя переместить объект '+op.handle+' (код '+code+').');}
   if(op.text!==undefined){if(typeof op.text!=='string'||op.text.length>2000||op.text.includes('\0'))throw Error('Недопустимый текст.');const code=m.ccall('pllato_text','number',['string','string'],[op.handle,op.text]);if(code)throw Error('Нельзя изменить текст '+op.handle+' (код '+code+').');}
  }
  writeAdditions(m,added.filter(i=>i.type!=='COPY'));
  self.postMessage({progress:'Записываю DWG и проверяю повторным чтением…',percent:60});
  const saved=m.ccall('pllato_save','number',['string'],['/output.dwg']);
  if(saved>=128)throw Error('Проверка сохранения DWG не пройдена (код '+saved+'). Исходный файл не изменён.');
  const bytes=m.FS.readFile('/output.dwg');
  const original=new Uint8Array(buffer,0,6);if(original.some((v,i)=>bytes[i]!==v))throw Error('Движок изменил версию DWG: выдача файла отменена.');
  m._pllato_close();self.postMessage({buffer:bytes.buffer,warnings:opened|saved},[bytes.buffer]);
 }catch(e){self.postMessage({error:e.message||String(e)});}
};
