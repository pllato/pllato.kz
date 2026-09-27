import createModule from './vendor/pllato-executive-engine.mjs';
import {writeAdditions} from './authoring.mjs';
import {validateExecutiveProject} from './executive-metadata.mjs';
import {executiveEntities} from './executive-project.mjs';
self.onmessage=async({data})=>{
 let m,diagnostic='';
 try{
  const {buffer,ops=[],added=[],cloneRequest}=data;
  const project=validateExecutiveProject(data.project);
  if(!(buffer instanceof ArrayBuffer)||!Array.isArray(ops)||ops.length>100000)throw Error('Неверный пакет изменений');
  self.postMessage({progress:'Готовлю DWG исполнительных…',percent:5});
  m=await createModule({print:()=>{},printErr:s=>{if(s.startsWith('CLONE_REJECT'))diagnostic=s.slice(0,200);}});m.FS.writeFile('/input.dwg',new Uint8Array(buffer));
  const opened=m.ccall('pllato_open','number',['string'],['/input.dwg']);if(opened>=128)throw Error('DWG не прочитан: '+opened);
  const check=(code,label)=>{if(code){const reason=diagnostic.includes('BLOCKSTRETCHACTION')?'Команда растяжения динамического блока не прошла проверку точности записи. Копирование отменено без упрощения CAD-структуры.':diagnostic;throw Error(label+' (код '+code+'). '+reason+' Исходный файл не изменён.');}};
  for(const op of ops){
   if(!/^[0-9a-f]+$/i.test(op.handle)||!Number.isFinite(op.dx)||!Number.isFinite(op.dy))throw Error('Неверное изменение');
   if(op.remove){check(m.ccall('pllato_remove','number',['string'],[op.handle]),'Нельзя удалить связанный объект');continue;}
   if(op.dx||op.dy)check(m.ccall('pllato_move','number',['string','number','number'],[op.handle,op.dx,op.dy]),'Не удалось переместить объект');
   if(op.text!==undefined){if(typeof op.text!=='string'||op.text.length>2000||op.text.includes('\0'))throw Error('Неверный текст');check(m.ccall('pllato_text','number',['string','string'],[op.handle,op.text]),'Не удалось изменить текст');}
  }
  for(const handle of project.generatedHandles||[])check(m.ccall('pllato_remove','number',['string'],[handle]),'Не удалось обновить оформление');
  project.generatedHandles=[];
  writeAdditions(m,added);
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
  self.postMessage({buffer:output.buffer,project,warnings:opened|saved},[output.buffer]);
 }catch(e){self.postMessage({error:e.message||String(e)});}finally{m?._pllato_close();}
};
