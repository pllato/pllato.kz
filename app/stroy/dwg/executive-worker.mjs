import createModule from './vendor/pllato-executive-engine.mjs?v=0.17.44';
import {writeAdditions} from './authoring.mjs?v=0.17.44';
import {writeDeferredCopies} from './deferred-copy.mjs?v=0.17.44';
import {validateExecutiveProject} from './executive-metadata.mjs?v=0.17.44';
import {executiveEntities} from './executive-project.mjs?v=0.17.44';
self.onmessage=async({data})=>{
 let m,diagnostic='';
 try{
  const {buffer,ops=[],added=[],cloneRequest,copyRequest}=data;
  const project=validateExecutiveProject(data.project);
  if(!(buffer instanceof ArrayBuffer)||!Array.isArray(ops)||ops.length>100000)throw Error('Неверный пакет изменений');
  self.postMessage({progress:'Готовлю DWG исполнительных…',percent:5});
  m=await createModule({locateFile:path=>new URL('./vendor/'+path+'?v=0.17.44',import.meta.url).href,print:()=>{},printErr:s=>{if(/^(CLONE_REJECT|MOVE_REJECT|REMOVE_|ROOT_REJECT|SAVE_REJECT|EXPORT_REJECT|EXPORT_EDGE)/.test(s))diagnostic=s.slice(0,200);}});m.FS.writeFile('/input.dwg',new Uint8Array(buffer));
  const opened=m.ccall('pllato_open','number',['string'],['/input.dwg']);if(opened>=128)throw Error('DWG не прочитан: '+opened);
  self.postMessage({progress:'Проверяю изменения и связи объектов DWG…',percent:15});
  const check=(code,label)=>{if(code){const reason=diagnostic.startsWith('CLONE_REJECT_ROOT')?'Выделен вложенный объект без его блока-владельца. Выделите блок целиком. '+diagnostic:diagnostic.includes('ACAD_TABLE')?'Исходная CAD-таблица пока не поддерживается безопасным копированием. Таблица не удалена, операция отменена целиком. '+diagnostic:diagnostic.includes('MULTILEADER')?'Связанная сложная выноска не прошла проверку точности копирования. Операция отменена целиком, выноска не удалена. '+diagnostic:diagnostic.includes('BLOCKSTRETCHACTION')?'Команда растяжения динамического блока не прошла проверку точности записи. Копирование отменено без упрощения CAD-структуры.':diagnostic;throw Error(label+' (код '+code+'). '+reason+' Исходный файл не изменён.');}};
  if(added.some(i=>i.type==='COPY'&&(!Number.isInteger(i.opIndex)||i.opIndex<0||i.opIndex>ops.length)))throw Error('Неверный порядок копии');
  const mapCopy=(item,handle)=>{for(const s of project.sheets)for(const r of s.routes)if(r.sourceIds)r.sourceIds=r.sourceIds.map(id=>id===item.sourceId?'dwg-'+handle:id);};
  for(let opIndex=0;opIndex<=ops.length;opIndex++){
   writeDeferredCopies(m,added,opIndex,mapCopy);if(opIndex===ops.length)break;
   const op=ops[opIndex];
   if(op.styleFont!==undefined){if(typeof op.styleFont!=='string'||!/^([0-9a-f]+)$/i.test(op.handle))throw Error('Неверный стиль');check(m.ccall('pllato_style_font','number',['string','string'],[op.handle,op.styleFont]),'Смена шрифта отклонена');continue;}
   if(op.layerOff!==undefined){if(typeof op.layerOff!=='boolean'||!/^([0-9a-f]+)$/i.test(op.handle))throw Error('Неверный слой');check(m.ccall('pllato_layer_off','number',['string','number'],[op.handle,Number(op.layerOff)]),'Слой не найден');continue;}
   if(op.vertex){const {index,x,y}=op.vertex;if(!Number.isInteger(index)||![x,y].every(Number.isFinite))throw Error('Неверная вершина');check(m.ccall('pllato_vertex','number',['string','number','number','number'],[op.handle,index,x,y]),'Правка вершины отклонена');}
   if(!/^[0-9a-f]+$/i.test(op.handle)||!Number.isFinite(op.dx)||!Number.isFinite(op.dy))throw Error('Неверное изменение');
   if(op.node){const {index,x,y}=op.node;if(!Number.isInteger(index)||![x,y].every(Number.isFinite))throw Error('Неверная точка');check(m.ccall('pllato_spline_point','number',['string','number','number','number'],[op.handle,index,x,y]),'Правка управляющей точки SPLINE отклонена');}
   if(op.angle!==undefined){if(!Number.isFinite(op.angle))throw Error('Неверный угол');check(m.ccall('pllato_insert_angle','number',['string','number'],[op.handle,op.angle]),'Поворот прибора отклонён');}
   if(op.remove){check(m.ccall('pllato_remove','number',['string'],[op.handle]),'Нельзя удалить связанный объект '+op.handle);continue;}
   if(op.dx||op.dy)check(m.ccall('pllato_move','number',['string','number','number'],[op.handle,op.dx,op.dy]),'Не удалось применить ранее сделанное перемещение объекта '+op.handle);
   if(op.color!==undefined){if(!Number.isInteger(op.color)||op.color<1||op.color>255)throw Error('Неверный цвет');check(m.ccall('pllato_color','number',['string','number'],[op.handle,op.color]),'Не удалось изменить цвет');}
   if(op.text!==undefined){if(typeof op.text!=='string'||op.text.length>2000||op.text.includes('\0'))throw Error('Неверный текст');check(m.ccall('pllato_text','number',['string','string'],[op.handle,op.text]),'Не удалось изменить текст');}
  }
  self.postMessage({progress:'Обновляю оформление исполнительных…',percent:20});
  for(const handle of project.generatedHandles||[])check(m.ccall('pllato_remove','number',['string'],[handle]),'Не удалось обновить оформление, объект '+handle);
  project.generatedHandles=[];
  let supportRoots=[];
  const copies=new Map();
  for(const request of (copyRequest?(Array.isArray(copyRequest)?copyRequest:[copyRequest]):[])){const {handle,parent,transform}=request;if(!/^[0-9a-f]+$/i.test(handle)||!project.sheets.some(s=>s.nativeHandles[0]===parent)||!Array.isArray(transform)||transform.length!==5||!transform.every(Number.isFinite))throw Error('Неверные параметры копирования');const key=JSON.stringify([parent,transform]);const group=copies.get(key)||{parent,transform,handles:[]};group.handles.push(handle);copies.set(key,group);}
  for(const {parent,transform,handles} of copies.values()){self.postMessage({progress:'Копирую объект с CAD-структурой…',percent:30});check(m.ccall('pllato_copy_objects','number',['string','string',...Array(5).fill('number')],[handles.join(','),parent,...transform]),'Не удалось скопировать объект');}
  const addedHandles=[];
  writeAdditions(m,added.filter(i=>i.type!=='COPY'),item=>{const handle=m.ccall('pllato_last_handle','string',[],[]);addedHandles.push(handle);const id='dwg-'+handle;for(const s of project.sheets)for(const r of s.routes)if(r.sourceIds)r.sourceIds=r.sourceIds.map(source=>source===item.sourceId?id:source);});
  if(cloneRequest){
   const {sheetId,handles,centre,position}=cloneRequest,s=project.sheets.find(s=>s.id===sheetId);
   if(Array.isArray(handles)&&handles.length>20000)throw Error('Выделено '+handles.length+' объектов. Предел одной исполнительной — 20 000: выделите меньшую область. Исходный файл не изменён.');
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
  if(data.exportOnly){
   const removed=new Set(ops.filter(o=>o.remove).map(o=>o.handle));
   const roots=new Set([...(data.keepRoots||[]).filter(h=>!removed.has(h)),...project.sheets.flatMap(s=>s.nativeHandles),...project.generatedHandles,...addedHandles]);
   if(!roots.size||[...roots].some(h=>!/^[0-9a-f]+$/i.test(h)))throw Error('Неверный состав выбранных исполнительных');
   self.postMessage({progress:'Собираю отдельный DWG со всеми CAD-зависимостями…',percent:65});
   check(m.ccall('pllato_export_selection','number',['string'],[[...roots].join(',')]),'Не удалось собрать отдельный DWG');
   supportRoots=m.FS.readFile('/export-support.txt',{encoding:'utf8'}).trim().split(/\s+/).filter(Boolean);
  }
  self.postMessage({progress:'Проверяю DWG повторным чтением…',percent:80});
  const saved=m.ccall('pllato_save','number',['string'],['/output.dwg']);if(saved>=128)throw Error('DWG не прошёл проверку сохранения: '+saved);
  const output=m.FS.readFile('/output.dwg');if(new Uint8Array(buffer,0,6).some((b,i)=>b!==output[i]))throw Error('Изменилась версия DWG');
  let exportRootHandles;
  if(data.exportOnly){
   const reopened=m.ccall('pllato_open','number',['string'],['/output.dwg']);if(reopened>=128)throw Error('Экспортный DWG не прочитан повторно');
   check(m.ccall('pllato_root_manifest','number',[],[]),'Не удалось проверить состав экспортного DWG');
   exportRootHandles=m.FS.readFile('/root-manifest.txt',{encoding:'utf8'}).trim().split(/\s+/).filter(Boolean).map(row=>row.split(',')[0]);
   const removed=new Set(ops.filter(o=>o.remove).map(o=>o.handle)),expected=new Set([...(data.keepRoots||[]).filter(h=>!removed.has(h)),...project.sheets.flatMap(s=>s.nativeHandles),...project.generatedHandles,...addedHandles,...supportRoots]);
   if(exportRootHandles.length!==expected.size||exportRootHandles.some(h=>!expected.has(h)))throw Error('Состав экспортного DWG не совпал с выбранными исполнительными');
  }
  self.postMessage({buffer:output.buffer,project,addedHandles,exportRootHandles,supportRoots,warnings:opened|saved},[output.buffer]);
 }catch(e){self.postMessage({error:e.message||String(e)});}finally{m?._pllato_close();}
};
