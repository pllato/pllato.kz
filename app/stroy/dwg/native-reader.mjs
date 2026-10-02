// SPDX-License-Identifier: GPL-3.0-or-later
import createModule from './vendor/libredwg-web.js?v=0.17.72';
import {warningText} from './progress.mjs?v=0.17.72';
import {LibreDwg} from './vendor/libredwg-sdk.js?v=0.17.72';
import {nativeDocument} from './native-adapter.mjs?v=0.17.72';
import {readDimensionDefinitions} from './native-dimensions.mjs?v=0.17.72';
import {readExecutiveMetadata} from './executive-metadata.mjs?v=0.17.72';
import {sendNativeDocument} from './native-transfer.mjs?v=0.17.72';
self.onmessage=async({data:request})=>{
 if(request?.nativeAck!==undefined)return;
 const compact=request?.compact===true,data=compact?request.buffer:request;
 let sdk,pointer;
 try{
  self.postMessage({progress:'Загружаю движок…',percent:5});
  const messages=[],engine=await createModule({locateFile:path=>new URL('./vendor/'+path+'?v=0.17.72',import.meta.url).href,print:()=>{},printErr:s=>{if(messages.length<12)messages.push(String(s));}});
  engine.FS.writeFile('input.dwg',new Uint8Array(data));
  self.postMessage({progress:'Читаю DWG: движок не сообщает внутренний процент…',percent:15});
  const result=engine.dwg_read_file('input.dwg');pointer=result.data;
  // The parser owns the native drawing now; do not retain another full input
  // in MEMFS throughout conversion and the large cross-thread handoff.
  engine.FS.unlink('input.dwg');
  sdk=LibreDwg.createByWasmInstance(engine);
  // ACADVER lives in the file header, not the generic header-variable table.
  // The upstream dynamic binding can dereference an invalid value for R2018.
  const headerData=sdk.dwg_dynapi_header_data.bind(sdk);
  sdk.dwg_dynapi_header_data=(p,field)=>field==='ACADVER'
   ?new TextDecoder().decode(new Uint8Array(data,0,6))
   :field==='INSUNITS'?headerData(p,field):undefined;
  if(result.error>=128||!pointer)throw Error('Ошибка чтения DWG: '+result.error);
  self.postMessage({progress:'Подготавливаю объекты DWG для отображения…'});
  let lastProgress=-Infinity;
  let {database,stats}=sdk.convertEx(pointer,true,(done,total)=>{const now=performance.now();if(done===total||now-lastProgress>=80){lastProgress=now;self.postMessage({progress:'Подготавливаю объекты: '+done.toLocaleString('ru')+' / '+total.toLocaleString('ru'),percent:35+50*done/Math.max(1,total)});}});
  self.postMessage({progress:'Собираю геометрию и подписи…',percent:85});
  readDimensionDefinitions(sdk,pointer,database);
  const doc=nativeDocument(database,!compact);
  doc.executiveProject=readExecutiveMetadata(database);
  doc.native=true;doc.nativeOps=[];doc.nativeUnknown=stats.unknownEntityCount||0;
  const attached=new Set(database.entities.flatMap(e=>(e.attribs||[]).map(a=>a.handle)));
  doc.exportRootHandles=database.entities.filter(e=>!attached.has(e.handle)).map(e=>e.handle);
  database=null;
  if(result.error)messages.unshift(warningText(result.error)+' (код '+result.error+')');
  sdk.dwg_free(pointer);pointer=null;
  if(compact)await sendNativeDocument(doc,messages,self);
  else self.postMessage({doc,messages});
 }catch(e){self.postMessage({error:e.message||String(e)});}
 finally{if(sdk&&pointer)sdk.dwg_free(pointer);}
};
