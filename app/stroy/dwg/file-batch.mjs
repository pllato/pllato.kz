// Inactive drawings are revision pointers, never parsed documents or buffers.
export function fileBatch({store,open,saveCurrent,release,busy,changed,status,persist=()=>{},initial=[],freeze=()=>{},thaw=()=>{},failure=()=> 'Этот файл не открыт.'}){
 let entries=initial.slice(0,100).filter(r=>r&&typeof r.id==='string'&&typeof r.revision==='string'&&typeof r.name==='string').map(r=>({...r})),current=null,loading=null,locked=false;
 const notify=()=>{persist(entries);changed();};
 const row=id=>entries.find(r=>r.id===id);
 function remember(revision,id){const r=row(id||loading||current);if(!r||!revision)return;r.revision=revision.id;r.dirty=!!revision.dirty;r.error=false;delete r.message;notify();}
 async function preserve(){const rev=await saveCurrent();if(!rev)return;if(current)remember(rev);else{const r={id:crypto.randomUUID(),name:rev.fileName||rev.name,revision:rev.id,dirty:!!rev.dirty};entries.push(r);current=r.id;notify();}}
 async function read(r){const rev=await store.revision(r.revision);if(!rev)throw Error('Локальная версия файла не найдена. Загрузите файл снова.');const file=await store.source(rev.sourceId);if(!file)throw Error('Исходный файл не найден. Загрузите файл снова.');return open(file,rev.initial?null:rev);}
 async function activate(id){if(locked||busy()||id===current)return false;const target=row(id);if(!target)return false;locked=true;freeze('switch');let previous,cleared=false;
  try{await preserve();previous=row(current);loading=id;notify();release();cleared=true;if(!await read(target))throw Error(failure());current=id;target.error=false;delete target.message;return true;}
  catch(e){target.error=true;target.message=e.message;status(e.message);if(cleared&&previous){loading=previous.id;try{if(await read(previous))current=previous.id;else current=null;}catch{current=null;}}status('Не открыт '+target.name+': '+e.message+(current?(cleared?' Предыдущий файл восстановлен.':' Текущий файл оставлен открытым.'):''));return false;}
  finally{loading=null;locked=false;thaw();notify();}
 }
 async function add(files){if(locked||busy())return false;locked=true;freeze('add');let first=null;try{for(const file of files){if(!/\.(dwg|dxf)$/i.test(file.name)){status('Пропущен '+file.name+': нужен DWG или DXF.');continue;}const limit=/\.dwg$/i.test(file.name)?128:256;if(file.size>limit*1024*1024){status('Не добавлен '+file.name+': предел '+limit+' МБ.');continue;}if(entries.length>=100){status('В пакете уже 100 файлов. Закройте ненужные вкладки.');break;}try{const rev=await store.save(file,null,{name:file.name.replace(/\.(dwg|dxf)$/i,''),fileName:file.name,label:'Добавление в пакет',initial:true,dirty:false});const r={id:crypto.randomUUID(),name:file.name,revision:rev.id,dirty:false,error:false};entries.push(r);first??=r.id;notify();}catch(e){status('Не добавлен '+file.name+': '+e.message);}}}finally{locked=false;thaw();notify();}return first?activate(first):false;}
 async function remove(id){if(locked||busy())return false;const r=row(id);if(!r)return false;if(id===current){const other=entries.find(x=>x.id!==id);if(other){if(!await activate(other.id))return false;}else{locked=true;freeze('switch');try{await preserve();release();current=null;}catch(e){status(e.message);return false;}finally{locked=false;thaw();}}}entries=entries.filter(x=>x.id!==id);notify();return true;}
 return {rows:()=>entries.map(r=>({...r})),active:()=>current,loading:()=>loading,locked:()=>locked,remember,add,activate,remove,
  async openRevision(rev){if(locked||busy())return false;const r={id:crypto.randomUUID(),name:rev.fileName||rev.name,revision:rev.id,dirty:!!rev.dirty};entries.push(r);notify();return activate(r.id);},
  async detach(){if(locked||busy())return false;locked=true;freeze('switch');try{await preserve();current=null;return true;}catch(e){status(e.message);return false;}finally{locked=false;thaw();notify();}}
 };
}
