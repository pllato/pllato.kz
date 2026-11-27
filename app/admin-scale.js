const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>crypto.randomUUID();
const pref=(key,fallback=null)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
const remember=(key,value)=>{try{value===null?localStorage.removeItem(key):localStorage.setItem(key,value);}catch{}};
export function initAdminScale({host,api,userKey,onToggle=()=>{}}){
 const key='pllato:admin-scale:'+userKey,foldKey=key+':open',sectionsKey=key+':sections';
 let doc=null,dirty=false,busy=false,conflict=false,disposed=false,timer,version=0,archive=false,loading=false,fullscreen=null,lastSync=0;
 let open=pref(foldKey)==='true',expanded=new Set();try{expanded=new Set(JSON.parse(pref(sectionsKey,'[]')));}catch{}
 host.className='adm-host';host.tabIndex=-1;host.setAttribute('aria-label','Админ Шкала');host.hidden=!open;
 host.innerHTML='<section class="adm-panel"><header class="adm-head"><div><h2>Админ Шкала</h2><p>Цели, планы и действия в одном месте</p></div><div class="adm-actions"><button type="button" data-action="fullscreen">На весь экран</button><button type="button" data-action="fold">Свернуть</button></div></header><div class="adm-toolbar"><span data-status role="status" aria-live="polite">Откройте шкалу для работы</span><div class="adm-actions"><button type="button" data-action="refresh">Обновить</button><button type="button" data-action="save" class="adm-primary">Сохранить</button></div></div><div class="adm-warning" data-warning hidden></div><div class="adm-body"><div class="adm-tools"><button type="button" data-action="add-section">+ Раздел</button><button type="button" data-action="expand-all">Развернуть разделы</button><button type="button" data-action="collapse-all">Свернуть разделы</button><button type="button" data-action="archive" aria-pressed="false">Архив</button></div><div class="adm-grid" data-grid></div></div></section>';
 const panel=host.firstElementChild,$=s=>panel.querySelector(s),grid=$('[data-grid]');
 function status(text,kind=''){if(disposed)return;$('[data-status]').textContent=text;$('[data-status]').dataset.kind=kind;}
 function draft(){if(!doc)return false;try{localStorage.setItem(key,JSON.stringify({base:doc.revision,sections:doc.sections,at:Date.now()}));return true;}catch{return false;}}
 function warning(text){const el=$('[data-warning]');el.hidden=!text;el.innerHTML=text?'<span>'+escape(text)+'</span><div class="adm-actions"><button type="button" data-action="export">Скачать черновик</button><button type="button" data-action="reload">Загрузить с сервера</button></div>':'';}
 function count(s){return s.items.filter(i=>!i.archived).length;}
 function render(focus){
  if(!doc)return;
  const visible=doc.sections.filter(s=>archive?s.archived||s.items.some(i=>i.archived):!s.archived);
  grid.innerHTML=visible.map((s,idx)=>{const opened=archive||expanded.has(s.id),items=s.items.filter(i=>archive?(s.archived||i.archived):!i.archived);
   return `<section class="adm-section" data-section="${escape(s.id)}"><header><button type="button" class="adm-chevron" data-action="section" aria-expanded="${opened}" aria-label="${opened?'Свернуть':'Развернуть'} ${escape(s.title)}">${opened?'⌄':'›'}</button><input data-title aria-label="Название раздела" maxlength="160" value="${escape(s.title)}"><span class="adm-count">${count(s)}</span><div class="adm-actions"><button type="button" data-action="section-up" title="Раздел выше" aria-label="Раздел выше">↑</button><button type="button" data-action="section-down" title="Раздел ниже" aria-label="Раздел ниже">↓</button><button type="button" data-action="${s.archived?'restore-section':'archive-section'}" title="${s.archived?'Восстановить раздел':'В архив'}">${s.archived?'Вернуть':'⋯'}</button></div></header><div class="adm-section-body" ${opened?'':'hidden'}>${items.map(i=>`<div class="adm-item" data-item="${escape(i.id)}"><textarea data-text rows="2" maxlength="10000" aria-label="Пункт в разделе ${escape(s.title)}" placeholder="Что нужно прописать…">${escape(i.text)}</textarea><div class="adm-item-actions" ${archive&&s.archived?'hidden':''}><button type="button" data-action="item-up" aria-label="Пункт выше" title="Пункт выше">↑</button><button type="button" data-action="item-down" aria-label="Пункт ниже" title="Пункт ниже">↓</button><button type="button" data-action="${archive?'restore-item':'archive-item'}">${archive?'Восстановить':'В архив'}</button></div></div>`).join('')||'<p class="adm-empty">'+(archive?'Архивных пунктов нет':'Пока нет пунктов. Добавьте первый.')+'</p>'}${!archive?'<button type="button" class="adm-add" data-action="add-item">+ Добавить пункт</button>':''}</div></section>`;
  }).join('')||'<p class="adm-empty">'+(archive?'Архив пуст':'Добавьте первый раздел')+'</p>';
  panel.querySelector('[data-action=archive]').setAttribute('aria-pressed',String(archive));
  panel.querySelector('[data-action=archive]').textContent=archive?'Назад к шкале':'Архив';
  for(const t of grid.querySelectorAll('textarea'))resize(t);
  if(focus)grid.querySelector(`[data-item="${CSS.escape(focus)}"] textarea,[data-section="${CSS.escape(focus)}"] input`)?.focus();
 }
 function resize(el){el.style.height='auto';el.style.height=Math.min(420,Math.max(68,el.scrollHeight+2))+'px';}
 function changed(){dirty=true;version++;if(!draft())warning('На устройстве не удалось записать черновик. Оставьте окно открытым до сохранения на сервере или скачайте черновик.');status('Есть изменения…');clearTimeout(timer);if(!conflict)timer=setTimeout(save,1400);}
 async function save(){
  clearTimeout(timer);if(!doc||!dirty||busy||conflict||disposed)return;
  if(doc.sections.some(s=>!s.title.trim())){status('Заполните названия разделов для сохранения на сервере.','error');return;}
  busy=true;status('Сохраняем…');const v=version,body={revision:doc.revision,sections:structuredClone(doc.sections)};
  try{const result=await api('/admin-scale',{method:'PUT',body});if(disposed)return;lastSync=Date.now();doc.revision=result.revision;doc.updatedAt=result.updatedAt;doc.updatedBy=result.updatedBy;
   if(v===version){dirty=false;remember(key,null);status('Сохранено · '+new Date(result.updatedAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}));warning('');}
   else{draft();status('Сохраняем новые изменения…');}
  }catch(e){if(disposed)return;const localSaved=draft();if(e.status===409){conflict=true;warning(localSaved?'Шкала изменена в другом окне. Ваш текст сохранён как черновик на этом устройстве. Скачайте его перед загрузкой серверной версии.':'Шкала изменена в другом окне. Черновик не удалось записать на устройство: скачайте его, прежде чем закрывать окно.');}else if(!localSaved)warning('Сервер и локальное хранилище недоступны. Текст пока есть только в этом окне — скачайте черновик перед выходом.');status(e.status===409?'Нужно сравнить версии':([400,413].includes(e.status)?e.message:(localSaved?'Не сохранено на сервере. Черновик оставлен на устройстве.':'Не сохранено. Скачайте черновик, пока окно открыто.')),'error');}
  finally{busy=false;if(dirty&&!conflict&&!disposed&&v!==version)timer=setTimeout(save,1400);}
 }
 async function load(discard=false){
  if(loading||busy)return;if(dirty&&!discard&&!confirm('Есть несохранённые изменения. Загрузить серверную версию? Сначала можно скачать черновик.'))return;
  loading=true;const previousVersion=version;status('Загружаем шкалу…');
  try{const data=await api('/admin-scale');if(disposed)return;if(doc&&version!==previousVersion){status('Обновление отменено: появились новые изменения');return;}doc=data.scale;lastSync=Date.now();dirty=false;conflict=false;
   let local;try{local=JSON.parse(localStorage.getItem(key)||'null');}catch{}
   if(local&&!Array.isArray(local.sections))local=null;
   if(local&&JSON.stringify(local.sections)===JSON.stringify(doc.sections)){remember(key,null);local=null;}
   if(local&&!discard){if(local.base===doc.revision){doc.sections=local.sections;dirty=true;status('Восстановлен черновик с этого устройства');timer=setTimeout(save,1400);}
    else{doc.sections=local.sections;dirty=true;conflict=true;warning('Найден черновик другой версии. Скачайте его перед загрузкой серверной версии.');status('Открыт локальный черновик','error');}}
   else{if(discard)remember(key,null);warning('');status(doc.updatedAt?'Сохранено · '+new Date(doc.updatedAt).toLocaleString('ru-RU'):'Заполните нужные разделы. Изменения сохраняются автоматически.');}
   if(!expanded.size&&doc.sections[0])expanded.add(doc.sections[0].id);render();
  }catch(e){status(e.message||'Не удалось загрузить шкалу. Нажмите «Обновить».','error');}
  finally{loading=false;}
 }
 function fold(value){open=value;remember(foldKey,String(open));host.hidden=!open;onToggle(open);if(open&&(!doc||(!dirty&&!busy&&Date.now()-lastSync>60000)))load();}
 function exitFullscreen(){if(!fullscreen)return;host.append(panel);fullscreen.remove();fullscreen=null;panel.querySelector('[data-action=fullscreen]').textContent='На весь экран';}
 function enterFullscreen(){if(fullscreen){fullscreen.close();return;}fullscreen=document.createElement('dialog');fullscreen.className='adm-dialog';fullscreen.setAttribute('aria-label','Админ Шкала');fullscreen.append(panel);document.body.append(fullscreen);fullscreen.addEventListener('close',exitFullscreen,{once:true});fullscreen.showModal();panel.querySelector('[data-action=fullscreen]').textContent='Обычный размер';}
 function exportDraft(){if(!doc)return;const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='admin-scale-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function move(array,item,direction){const index=array.indexOf(item),next=index+direction;if(next<0||next>=array.length)return false;[array[index],array[next]]=[array[next],array[index]];return true;}
 panel.addEventListener('input',e=>{if(!doc)return;const s=doc.sections.find(s=>s.id===e.target.closest('[data-section]')?.dataset.section);if(!s)return;if(e.target.matches('[data-title]'))s.title=e.target.value;else if(e.target.matches('[data-text]')){const item=s.items.find(i=>i.id===e.target.closest('[data-item]').dataset.item);item.text=e.target.value;resize(e.target);}else return;changed();});
 panel.addEventListener('click',e=>{
  const b=e.target.closest('button[data-action]');if(!b)return;const action=b.dataset.action;
  if(action==='fold'){if(fullscreen)fullscreen.close();fold(false);document.querySelector('[data-admin-scale-toggle]')?.focus({preventScroll:true});return;}if(action==='fullscreen'){enterFullscreen();return;}if(action==='save'){save();return;}if(action==='refresh'){load();return;}if(action==='reload'){if(confirm('Загрузить серверную версию? Для сохранения своего текста сначала скачайте черновик.')){clearTimeout(timer);load(true);}return;}if(action==='export'){exportDraft();return;}
  if(!doc)return;if(action==='archive'){archive=!archive;render();return;}
  if(action==='expand-all'||action==='collapse-all'){expanded=action==='expand-all'?new Set(doc.sections.map(s=>s.id)):new Set();remember(sectionsKey,JSON.stringify([...expanded]));render();return;}
  if(action==='add-section'){if(doc.sections.length>=40){status('До 40 разделов, включая архив.','error');return;}const s={id:id(),title:'Новый раздел',archived:false,items:[]};doc.sections.push(s);expanded.add(s.id);archive=false;changed();render(s.id);return;}
  const s=doc.sections.find(s=>s.id===b.closest('[data-section]')?.dataset.section);if(!s)return;let focus;
  if(action==='section'){expanded.has(s.id)?expanded.delete(s.id):expanded.add(s.id);remember(sectionsKey,JSON.stringify([...expanded]));render();return;}
  if(action==='add-item'){if(doc.sections.reduce((n,s)=>n+s.items.length,0)>=500){status('До 500 пунктов во всей шкале, включая архив.','error');return;}if(s.items.length>=100){status('До 100 пунктов в разделе, включая архив.','error');return;}const item={id:id(),text:'',archived:false};s.items.push(item);expanded.add(s.id);focus=item.id;}
  else if(action==='archive-section'){if(!confirm('Убрать раздел в архив? Его можно будет восстановить вместе с пунктами.'))return;s.archived=true;}
  else if(action==='restore-section')s.archived=false;
  else if(action.startsWith('section-')){if(!move(doc.sections,s,action.endsWith('up')?-1:1))return;}
  else{const item=s.items.find(i=>i.id===b.closest('[data-item]')?.dataset.item);if(!item)return;if(action==='archive-item')item.archived=true;else if(action==='restore-item'){s.archived=false;item.archived=false;}else if(!move(s.items,item,action.endsWith('up')?-1:1))return;}
  changed();render(focus);
 });
 const unload=e=>{if(dirty){draft();e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',unload);
 if(open)load();onToggle(open);
 return {toggle:()=>fold(!open),open:()=>fold(true),isOpen:()=>open,destroy(){disposed=true;clearTimeout(timer);if(dirty)draft();if(fullscreen){host.append(panel);fullscreen.remove();fullscreen=null;}window.removeEventListener('beforeunload',unload);host.remove();}};
}
