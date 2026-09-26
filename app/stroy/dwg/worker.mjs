// SPDX-License-Identifier: GPL-3.0-or-later
import createModule from './vendor/libredwg-web.js';
self.onmessage=async({data})=>{
 try{
  const messages=[];const engine=await createModule({print:()=>{},printErr:s=>{if(messages.length<12)messages.push(String(s));}});
  engine.FS.writeFile('input.dwg',new Uint8Array(data));
  const code=engine.dwg_write_dxf('input.dwg','output.dxf');
  if(code!==0)throw Error('LibreDWG не смог безопасно преобразовать файл (код '+code+').');
  const bytes=engine.FS.readFile('output.dxf');
  if(bytes.length>64*1024*1024)throw Error('Результат больше 64 МБ: используйте отдельный лист.');
  const buffer=bytes.slice().buffer;self.postMessage({buffer,messages},[buffer]);
 }catch(e){self.postMessage({error:e.message||String(e)});}
};
