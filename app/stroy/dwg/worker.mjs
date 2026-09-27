// SPDX-License-Identifier: GPL-3.0-or-later
import createModule from './vendor/libredwg-web.js';
self.onmessage=async({data})=>{
 try{
  self.postMessage({progress:'Запускаю DWG-движок…'});
  const messages=[];const engine=await createModule({print:()=>{},printErr:s=>{if(messages.length<12)messages.push(String(s));}});
  self.postMessage({progress:'Преобразую DWG в DXF. Большой проект может занять несколько минут…'});
  engine.FS.writeFile('input.dwg',new Uint8Array(data));
  const code=engine.dwg_write_dxf('input.dwg','output.dxf');
  if(code!==0)throw Error('LibreDWG не смог безопасно преобразовать файл (код '+code+').');
  if(engine.FS.stat('output.dxf').size>256*1024*1024)throw Error('Результат больше 256 МБ: превышен безопасный объём браузерного редактора.');
  const bytes=engine.FS.readFile('output.dxf');
  engine.FS.unlink('input.dwg');engine.FS.unlink('output.dxf');
  const buffer=bytes.buffer;self.postMessage({buffer,messages},[buffer]);
 }catch(e){self.postMessage({error:e.message||String(e)});}
};
