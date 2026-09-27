// SPDX-License-Identifier: GPL-3.0-or-later
import createModule from './vendor/libredwg-web.js';
import {LibreDwg} from './vendor/libredwg-sdk.js?v=0.6';
import {nativeDocument} from './native-adapter.mjs?v=0.6';
self.onmessage=async({data})=>{
 let sdk,pointer;
 try{
  self.postMessage({progress:'Читаю DWG напрямую…'});
  const messages=[],engine=await createModule({print:()=>{},printErr:s=>{if(messages.length<12)messages.push(String(s));}});
  engine.FS.writeFile('input.dwg',new Uint8Array(data));
  const result=engine.dwg_read_file('input.dwg');pointer=result.data;
  sdk=LibreDwg.createByWasmInstance(engine);
  // ACADVER lives in the file header, not the generic header-variable table.
  // The upstream dynamic binding can dereference an invalid value for R2018.
  const headerData=sdk.dwg_dynapi_header_data.bind(sdk);
  sdk.dwg_dynapi_header_data=(p,field)=>field==='ACADVER'
   ?new TextDecoder().decode(new Uint8Array(data,0,6))
   :field==='INSUNITS'?headerData(p,field):undefined;
  if(result.error>=128||!pointer)throw Error('Ошибка чтения DWG: '+result.error);
  self.postMessage({progress:'Подготавливаю объекты DWG для отображения…'});
  const {database,stats}=sdk.convertEx(pointer,true),doc=nativeDocument(database);
  doc.native=true;doc.nativeOps=[];doc.nativeUnknown=stats.unknownEntityCount||0;
  if(result.error)messages.unshift('Код предупреждений чтения: '+result.error);
  self.postMessage({doc,messages});
 }catch(e){self.postMessage({error:e.message||String(e)});}
 finally{if(sdk&&pointer)sdk.dwg_free(pointer);}
};
