import createModule from './vendor/pllato-executive-engine.mjs?v=0.17.13';
import {writeAdditions} from './authoring.mjs?v=0.17.13';
import {validateExecutiveProject} from './executive-metadata.mjs?v=0.17.13';
import {executiveEntities} from './executive-project.mjs?v=0.17.13';
self.onmessage=async({data})=>{
 let m,diagnostic='';
 try{
  const {buffer,ops=[],added=[],cloneRequest,copyRequest}=data;
  const project=validateExecutiveProject(data.project);
  if(!(buffer instanceof ArrayBuffer)||!Array.isArray(ops)||ops.length>100000)throw Error('Неверный пакет изменений');
  self.postMessage({progress:'Готовлю DWG исполнительных…',percent:5});
  m=await createModule({locateFile:path=>new URL('./vendor/'+path+'?v=0.17.13',import.meta.url).href,print:()=>{},printErr:s=>{if(/^(CLONE_REJECT|REMOVE_OWNER|SAVE_REJECT)/.test(s))diagnostic=s.slice(0,200);}});m.FS.writeFile('/input.dwg',new Uint8Array(buffer));
  const opened=m.ccall('pllato_open','number',['string'],['/input.dwg']);if(opened>=128)throw Error('DWG не прочитан: '+opened);
  self.postMessage({progress:'Проверяю изменения и связи объектов DWG…',percent:15});
  const check=(code,label)=>{if(code){const reason=diagnostic.startsWith('CLONE_REJECT_ROOT')?'Выделен вложенный объект без его блока-владельца. Выделите блок целиком. '+diagnostic:diagnostic.includes('ACAD_TABLE')?'Исходная CAD-таблица пока не поддерживается безопасным копированием. Таблица не удалена, операция отменена целиком. '+diagnostic:diagnostic.includes('MULTILEADER')?'Связанная сложная выноска не прошла проверку точности копирования. Операция отменена целиком, выноска не удалена. '+diagnostic:diagnostic.includes('BLOCKSTRETCHACTION')?'Команда растяжения динамического блока не прошла проверку точности записи. Копирование отменено без упрощения CAD-структуры.':diagnostic;throw Error(label+' (код '+code+'). '+reason+' Исходный файл не изменён.');}};
  for(const op of ops){
   if(!/^[0-9a-f]+$/i.test(op.handle)||!Number.isFinite(op.dx)||!Number.isFinite(op.dy))throw Error('Неверное изменение');
   if(op.node){const {index,x,y}=op.node;if(!Number.isInteger(index)||![x,y].every(Number.isFinite))throw Error('Неверная точка');check(m.ccall('pllato_spline_point','number',['string','number','number','number'],[op.handle,index,x,y]),'Правка управляющей точки SPLINE отклонена');}
   if(op.angle!==undefined){if(!Number.isFinite(op.angle))throw Error('Неверный угол');check(m.ccall('pllato_insert_angle','number',['string','number'],[op.handle,op.angle]),'Поворот прибора отклонён');}
   if(op.remove){check(m.ccall('pllato_remove','number',['string'],[op.handle]),'Нельзя удалить связанный объект');continue;}
   if(op.dx||op.dy)check(m.ccall('pllato_move','number',['string','number','number'],[op.handle,op.dx,op.dy]),'Не удалось переместить объект');
   if(op.color!==undefined){if(!Number.isInteger(op.color)||op.color<1||op.color>255)throw Error('Неверный цвет');check(m.ccall('pllato_color','number',['string','number'],[op.handle,op.color]),'Не удалось изменить цвет');}
   if(op.text!==undefined){if(typeof op.text!=='string'||op.text.length>2000||op.text.includes('\0'))throw Error('Неверный текст');check(m.ccall('pllato_text','number',['string','string'],[op.handle,op.text]),'Не удалось изменить текст');}
  }
  self.postMessage({progress:'Обновляю оформление исполнительных…',percent:20});
  for(const handle of project.generatedHandles||[])check(m.ccall('pllato_remove','number',['string'],[handle]),'Не удалось обновить оформление, объект '+handle);
  project.generatedHandles=[];
  if(data.exportOnly){
   const keep=new Set(project.sheets.flatMap(s=>s.nativeHandles)),alreadyRemoved=new Set(ops.filter(o=>o.remove).map(o=>o.handle));
   if(!Array.isArray(data.removeRoots)||data.removeRoots.some(h=>typeof h!=='string'||!/^[0-9a-f]+$/i.test(h)||keep.has(h)))throw Error('Неверный список исходных объектов для экспорта');
   self.postMessage({progress:'Исключаю исходные планы из экспортной копии…',percent:25});
   for(const handle of data.removeRoots)if(!alreadyRemoved.has(handle))check(m.ccall('pllato_remove','number',['string'],[handle]),'Экспорт только исполнительных остановлен: нельзя безопасно исключить исходный объект '+handle);
  }
  const copies=new Map();
  for(const request of (copyRequest?(Array.isArray(copyRequest)?copyRequest:[copyRequest]):[])){const {handle,parent,transform}=request;if(!/^[0-9a-f]+$/i.test(handle)||!project.sheets.some(s=>s.nativeHandles[0]===parent)||!Array.isArray(transform)||transform.length!==5||!transform.every(Number.isFinite))throw Error('Неверные параметры копирования');const key=JSON.stringify([parent,transform]);const group=copies.get(key)||{parent,transform,handles:[]};group.handles.push(handle);copies.set(key,group);}
  for(const {parent,transform,handles} of copies.values()){self.postMessage({progress:'Копирую объект с CAD-структурой…',percent:30});check(m.ccall('pllato_copy_objects','number',['string','string',...Array(5).fill('number')],[handles.join(','),parent,...transform]),'Не удалось скопировать объект');}
  const addedHandles=[];
  writeAdditions(m,added,item=>{const handle=m.ccall('pllato_last_handle','string',[],[]);addedHandles.push(handle);const id='dwg-'+handle;for(const s of project.sheets)for(const r of s.routes)if(r.sourceIds)r.sourceIds=r.sourceIds.map(source=>source===item.sourceId?id:source);});
  if(cloneRequest){
   const {sheetId,handles,centre,position}=cloneRequest,s=project.sheets.find(s=>s.id===sheetId);
   if(!s||s.nativeHandles.length||!Array.isArray(handles)||!handles.length||handles.length>20000||handles.some(h=>!/^[0-9a-f]+$/i.test(h))||![centre,position].every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))throw Error('Неверная область копирования');
   self.postMessage({progress:'Копирую CAD-структуру выбранного плана…',percent:25});
   check(m.ccall('pllato_clone_selection','number',['string',...Array(5).fill('number')],[handles.join(','),...centre,...position,s.angle]),'Не удалось безопасно скопировать выбранный план');
   s.nativeHandles=[m.FS.readFile('/clone-result.txt',{encoding:'utf8'})];
  }
  self.postMessage({progress:'Записываю оформление, трассы и ведомости…',percent:55});
  for(const s of project.sheets){
   if(s.nativeHandles.length!==1)throw Error('Не создана CAD-группа исполнительной');
   check(m.ccall('pllato_insert_angle','number',['string','number'],[s.nativeHandles[0],s.angle]),'Не удалось повернуть план');
   writeAdditions(m,executiveEntities(project,s.id).items,()=>project.generatedHandles.push(m.ccall('pllato_last_handle','string',[],[])));
  }
  const bytes=new TextEncoder().encode(JSON.stringify(project));
  if(bytes.length>4*1024*1024)throw Error('Данные исполнительных превышают 4 МБ');
  check(m.ccall('pllato_executive_metadata','number',['array','number'],[bytes,bytes.length]),'Не удалось сохранить связи исполнительных');
  self.postMessage({progress:'Проверяю DWG повторным чтением…',percent:80});
  const saved=m.ccall('pllato_save','number',['string'],['/output.dwg']);if(saved>=128)throw Error('DWG не прошёл проверку сохранения: '+saved);
  const output=m.FS.readFile('/output.dwg');if(new Uint8Array(buffer,0,6).some((b,i)=>b!==output[i]))throw Error('Изменилась версия DWG');
  self.postMessage({buffer:output.buffer,project,addedHandles,warnings:opened|saved},[output.buffer]);
 }catch(e){self.postMessage({error:e.message||String(e)});}finally{m?._pllato_close();}
};
