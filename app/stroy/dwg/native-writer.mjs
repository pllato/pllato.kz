// SPDX-License-Identifier: GPL-3.0-or-later
import createModule from './vendor/pllato-engine.mjs?v=0.14.2';
import {writeAdditions} from './authoring.mjs?v=0.14.2';
self.onmessage=async({data})=>{
 try{
  const {buffer,ops,added=[]}=data;
  if(!(buffer instanceof ArrayBuffer)||!Array.isArray(ops)||ops.length>100000)throw Error('Неверный пакет изменений.');
  self.postMessage({progress:'Открываю исходный DWG для записи изменений…',percent:10});
  const m=await createModule({locateFile:p=>new URL('./vendor/'+p+'?v=0.14.2',import.meta.url).href,print:()=>{},printErr:()=>{}});
  m.FS.writeFile('/input.dwg',new Uint8Array(buffer));
  const opened=m.ccall('pllato_open','number',['string'],['/input.dwg']);
  if(opened>=128)throw Error('DWG не прочитан: '+opened);
  for(const op of ops){
   if(!/^[0-9a-f]+$/i.test(op.handle)||!Number.isFinite(op.dx)||!Number.isFinite(op.dy))throw Error('Неверные параметры изменения.');
   if(op.dx||op.dy){const code=m.ccall('pllato_move','number',['string','number','number'],[op.handle,op.dx,op.dy]);if(code)throw Error('Нельзя переместить объект '+op.handle+' (код '+code+').');}
   if(op.text!==undefined){if(typeof op.text!=='string'||op.text.length>2000||op.text.includes('\0'))throw Error('Недопустимый текст.');const code=m.ccall('pllato_text','number',['string','string'],[op.handle,op.text]);if(code)throw Error('Нельзя изменить текст '+op.handle+' (код '+code+').');}
  }
  writeAdditions(m,added);
  self.postMessage({progress:'Записываю DWG и проверяю повторным чтением…',percent:60});
  const saved=m.ccall('pllato_save','number',['string'],['/output.dwg']);
  if(saved>=128)throw Error('Проверка сохранения DWG не пройдена (код '+saved+'). Исходный файл не изменён.');
  const bytes=m.FS.readFile('/output.dwg');
  const original=new Uint8Array(buffer,0,6);if(original.some((v,i)=>bytes[i]!==v))throw Error('Движок изменил версию DWG: выдача файла отменена.');
  m._pllato_close();self.postMessage({buffer:bytes.buffer,warnings:opened|saved},[bytes.buffer]);
 }catch(e){self.postMessage({error:e.message||String(e)});}
};
