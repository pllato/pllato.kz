const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>crypto.randomUUID();
const pref=(key,fallback=null)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
const remember=(key,value)=>{try{value===null?localStorage.removeItem(key):localStorage.setItem(key,value);}catch{}};
export function initAdminScale({host,api,userKey,onToggle=()=>{},initialOpen,onFoldRequest}){
 const key='pllato:admin-scale:'+userKey,foldKey=key+':open',selectionKey=key+':selected',viewKey=key+':view';
 let doc=null,dirty=false,busy=false,conflict=false,disposed=false,timer,version=0,archive=false,loading=false,fullscreen=null,lastSync=0;
 let open=initialOpen??(pref(foldKey)==='true'),selected=pref(selectionKey),mode=pref(viewKey,'overview');
 host.className='adm-host';host.tabIndex=-1;host.setAttribute('aria-label','Админ Шкала');host.hidden=!open;
 host.innerHTML='<section class="adm-panel"><header class="adm-head"><div class="adm-heading"><h2>Админ Шкала</h2><span data-status role="status" aria-live="polite">Откройте шкалу для работы</span></div><div class="adm-actions"><button type="button" data-action="save" class="adm-primary">Сохранить</button><button type="button" data-action="refresh" class="adm-refresh" title="Обновить данные">Обновить</button><button type="button" data-action="fullscreen">На весь экран</button><button type="button" data-action="fold">Свернуть</button></div></header><div class="adm-viewbar"><div role="group" aria-label="Вид Админ Шкалы"><button type="button" data-action="overview" aria-pressed="true">Вся шкала</button><button type="button" data-action="edit-mode" aria-pressed="false">Редактирование</button></div><span>Нажмите на запись, чтобы изменить</span></div><div class="adm-warning" data-warning hidden></div><div class="adm-workspace"><aside class="adm-sidebar" aria-label="Разделы Админ Шкалы"><div class="adm-nav-heading">Разделы <small data-nav-count></small></div><nav class="adm-nav" data-nav aria-label="Шкала сверху вниз"></nav><label class="adm-mobile-picker">Раздел<select data-picker aria-label="Выбрать раздел"></select></label><div class="adm-nav-footer"><button type="button" data-action="add-section">+ Раздел</button><button type="button" data-action="archive" aria-pressed="false">Архив</button></div></aside><div class="adm-editor" data-grid></div></div></section>';
 const panel=host.firstElementChild,$=s=>panel.querySelector(s),grid=$('[data-grid]'),nav=$('[data-nav]');
 function status(text,kind=''){if(disposed)return;$('[data-status]').textContent=text;$('[data-status]').dataset.kind=kind;}
 function draft(){if(!doc)return false;try{localStorage.setItem(key,JSON.stringify({base:doc.revision,sections:doc.sections,at:Date.now()}));return true;}catch{return false;}}
 function warning(text){const el=$('[data-warning]');el.hidden=!text;el.innerHTML=text?'<span>'+escape(text)+'</span><div class="adm-actions"><button type="button" data-action="export">Скачать черновик</button><button type="button" data-action="reload">Загрузить с сервера</button></div>':'';}
 function count(s){return s.items.filter(i=>!i.archived).length;}
 function countLabel(s){const n=count(s),d=n%10,h=n%100;return n+' '+(d===1&&h!==11?'пункт':d>=2&&d<=4&&(h<12||h>14)?'пункта':'пунктов');}
 function render(focus){
  if(!doc)return;
  const visible=doc.sections.filter(s=>archive?s.archived||s.items.some(i=>i.archived):!s.archived);
  if(focus){const target=visible.find(s=>s.id===focus||s.items.some(i=>i.id===focus));if(target)selected=target.id;}
  if(!visible.some(s=>s.id===selected))selected=visible[0]?.id||null;
  if(!archive)remember(selectionKey,selected);
  const scroll=nav.scrollTop;
  nav.innerHTML=visible.map((s,idx)=>`<button type="button" data-action="select-section" data-select="${escape(s.id)}" aria-current="${s.id===selected?'true':'false'}" title="${escape(s.title)}"><span class="adm-nav-number">${String(idx+1).padStart(2,'0')}</span><span class="adm-nav-title">${escape(s.title)}</span><span class="adm-count">${archive?s.items.filter(i=>s.archived||i.archived).length:count(s)}</span></button>`).join('')||'<p class="adm-empty">'+(archive?'Архив пуст':'Разделов пока нет')+'</p>';
  nav.scrollTop=scroll;$('[data-nav-count]').textContent=visible.length;
  const picker=$('[data-picker]');picker.innerHTML=visible.map((s,idx)=>`<option value="${escape(s.id)}">${idx+1}. ${escape(s.title)}</option>`).join('');picker.value=selected||'';picker.disabled=!visible.length;
  const s=visible.find(s=>s.id===selected);
  grid.innerHTML=s?`<section class="adm-section" data-section="${escape(s.id)}" aria-label="Редактирование раздела"><header class="adm-editor-head"><div class="adm-editor-title"><label for="adm-title-${escape(s.id)}">${archive?'Архив · ':''}Раздел ${visible.indexOf(s)+1} из ${visible.length}</label><input id="adm-title-${escape(s.id)}" data-title aria-label="Название раздела" maxlength="160" value="${escape(s.title)}"></div><details class="adm-menu"><summary aria-label="Действия с разделом" title="Переместить или убрать раздел">⋯</summary><div><button type="button" data-action="section-up">↑ Раздел выше</button><button type="button" data-action="section-down">↓ Раздел ниже</button><button type="button" data-action="${s.archived?'restore-section':'archive-section'}">${s.archived?'Восстановить раздел':'В архив'}</button></div></details></header><div class="adm-editor-toolbar"><span>${archive?'Архивные пункты':countLabel(s)} · изменения сохраняются автоматически</span>${!archive?'<button type="button" data-action="add-item" class="adm-add">+ Пункт</button>':''}</div><div class="adm-section-body">${s.items.filter(i=>archive?(s.archived||i.archived):!i.archived).map((i,idx)=>`<div class="adm-item" data-item="${escape(i.id)}"><span class="adm-item-number">${idx+1}</span><textarea data-text rows="1" maxlength="10000" aria-label="Пункт в разделе ${escape(s.title)}" placeholder="Что нужно прописать…">${escape(i.text)}</textarea><details class="adm-menu adm-item-menu" ${archive&&s.archived?'hidden':''}><summary aria-label="Действия с пунктом ${idx+1}" title="Действия с пунктом">⋯</summary><div><button type="button" data-action="item-up">↑ Пункт выше</button><button type="button" data-action="item-down">↓ Пункт ниже</button><button type="button" data-action="${archive?'restore-item':'archive-item'}">${archive?'Восстановить':'В архив'}</button></div></details></div>`).join('')||'<div class="adm-empty-state"><b>'+(archive?'Архивных пунктов нет':'Начните с первого пункта')+'</b><p>'+(archive?'Восстановите раздел, чтобы продолжить работу.':'Добавляйте записи и редактируйте их прямо здесь.')+'</p>'+(!archive?'<button type="button" data-action="add-item" class="adm-primary">+ Добавить пункт</button>':'')+'</div>'}</div></section>`:'<div class="adm-empty-state"><b>'+(archive?'Архив пуст':'Добавьте первый раздел')+'</b></div>';
  const overview=mode==='overview'&&!archive;
  panel.classList.toggle('is-overview',overview);
  panel.querySelector('[data-action=overview]').setAttribute('aria-pressed',String(overview));
  panel.querySelector('[data-action=edit-mode]').setAttribute('aria-pressed',String(!overview));
  if(overview)grid.innerHTML='<table class="adm-overview"><caption>Вся шкала · '+visible.length+' разделов · '+visible.reduce((n,s)=>n+count(s),0)+' пунктов</caption><tbody>'+visible.map((s,idx)=>`<tr><th scope="row"><button type="button" data-action="select-section" data-select="${escape(s.id)}"><span>${String(idx+1).padStart(2,'0')}</span><b>${escape(s.title)}</b></button></th><td>${s.items.filter(i=>!i.archived).map((i,n)=>`<button type="button" class="adm-overview-item" data-action="edit-overview" data-select="${escape(s.id)}" data-focus-item="${escape(i.id)}" aria-label="Изменить пункт ${n+1} раздела ${escape(s.title)}"><span>${n+1}.</span><span>${escape(i.text||'Пустой пункт')}</span></button>`).join('')||`<button type="button" class="adm-overview-empty" data-action="select-section" data-select="${escape(s.id)}">Не заполнено</button>`}</td></tr>`).join('')+'</tbody></table>';
  panel.querySelector('[data-action=archive]').setAttribute('aria-pressed',String(archive));
  panel.querySelector('[data-action=archive]').textContent=archive?'К шкале':'Архив';
  for(const t of grid.querySelectorAll('textarea'))resize(t);
  if(focus)grid.querySelector(`[data-item="${CSS.escape(focus)}"] textarea,[data-section="${CSS.escape(focus)}"] input`)?.focus();
 }
 function resize(el){el.style.height='auto';el.style.height=Math.min(320,Math.max(46,el.scrollHeight+2))+'px';}
 function selectSection(value,focus=false){mode='edit';remember(viewKey,mode);selected=value;render();if(focus)nav.querySelector(`[data-select="${CSS.escape(value)}"]`)?.focus({preventScroll:true});}
 $('[data-picker]').onchange=e=>selectSection(e.target.value);
 nav.addEventListener('keydown',e=>{const keys=['ArrowDown','ArrowUp','Home','End'];if(!keys.includes(e.key))return;const buttons=[...nav.querySelectorAll('[data-select]')],at=buttons.indexOf(e.target);if(at<0)return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,at+(e.key==='ArrowDown'?1:-1)));selectSection(buttons[next].dataset.select,true);});
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
   render();
  }catch(e){status(e.message||'Не удалось загрузить шкалу. Нажмите «Обновить».','error');}
  finally{loading=false;}
 }
 function fold(value){if(!value&&fullscreen)fullscreen.close();if(open===value)return;open=value;remember(foldKey,String(open));host.hidden=!open;onToggle(open);if(open&&(!doc||(!dirty&&!busy&&Date.now()-lastSync>60000)))load();}
 function exitFullscreen(){if(!fullscreen)return;host.append(panel);fullscreen.remove();fullscreen=null;panel.querySelector('[data-action=fullscreen]').textContent='На весь экран';}
 function enterFullscreen(){if(fullscreen){fullscreen.close();return;}fullscreen=document.createElement('dialog');fullscreen.className='adm-dialog';fullscreen.setAttribute('aria-label','Админ Шкала');fullscreen.append(panel);document.body.append(fullscreen);fullscreen.addEventListener('close',exitFullscreen,{once:true});fullscreen.showModal();panel.querySelector('[data-action=fullscreen]').textContent='Обычный размер';}
 function exportDraft(){if(!doc)return;const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='admin-scale-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function move(array,item,direction){const index=array.indexOf(item),next=index+direction;if(next<0||next>=array.length)return false;[array[index],array[next]]=[array[next],array[index]];return true;}
 panel.addEventListener('input',e=>{if(!doc)return;const s=doc.sections.find(s=>s.id===e.target.closest('[data-section]')?.dataset.section);if(!s)return;if(e.target.matches('[data-title]')){s.title=e.target.value;const label=nav.querySelector(`[data-select="${CSS.escape(s.id)}"] .adm-nav-title`);if(label)label.textContent=s.title;const opt=$('[data-picker]').selectedOptions[0];if(opt)opt.textContent=s.title;}else if(e.target.matches('[data-text]')){const item=s.items.find(i=>i.id===e.target.closest('[data-item]').dataset.item);item.text=e.target.value;resize(e.target);}else return;changed();});
 panel.addEventListener('click',e=>{
  const b=e.target.closest('button[data-action]');if(!b)return;const action=b.dataset.action;
  if(action==='fold'){if(onFoldRequest){onFoldRequest();return;}if(fullscreen)fullscreen.close();fold(false);document.querySelector('[data-admin-scale-toggle]')?.focus({preventScroll:true});return;}if(action==='fullscreen'){enterFullscreen();return;}if(action==='save'){save();return;}if(action==='refresh'){load();return;}if(action==='reload'){if(confirm('Загрузить серверную версию? Для сохранения своего текста сначала скачайте черновик.')){clearTimeout(timer);load(true);}return;}if(action==='export'){exportDraft();return;}
  if(!doc)return;if(action==='overview'||action==='edit-mode'){mode=action==='overview'?'overview':'edit';remember(viewKey,mode);archive=false;render();return;}if(action==='edit-overview'){mode='edit';remember(viewKey,mode);selected=b.dataset.select;render(b.dataset.focusItem);return;}if(action==='select-section'){selectSection(b.dataset.select,true);return;}if(action==='archive'){archive=!archive;if(!archive)selected=pref(selectionKey);render();return;}
  if(action==='add-section'){if(doc.sections.length>=40){status('До 40 разделов, включая архив.','error');return;}const s={id:id(),title:'Новый раздел',archived:false,items:[]};doc.sections.push(s);selected=s.id;archive=false;changed();render(s.id);return;}
  const s=doc.sections.find(s=>s.id===b.closest('[data-section]')?.dataset.section);if(!s)return;let focus;
  if(action==='add-item'){if(doc.sections.reduce((n,s)=>n+s.items.length,0)>=500){status('До 500 пунктов во всей шкале, включая архив.','error');return;}if(s.items.length>=100){status('До 100 пунктов в разделе, включая архив.','error');return;}const item={id:id(),text:'',archived:false};s.items.push(item);focus=item.id;}
  else if(action==='archive-section'){if(!confirm('Убрать раздел в архив? Его можно будет восстановить вместе с пунктами.'))return;s.archived=true;}
  else if(action==='restore-section')s.archived=false;
  else if(action.startsWith('section-')){if(!move(doc.sections,s,action.endsWith('up')?-1:1))return;}
  else{const item=s.items.find(i=>i.id===b.closest('[data-item]')?.dataset.item);if(!item)return;if(action==='archive-item')item.archived=true;else if(action==='restore-item'){s.archived=false;item.archived=false;}else if(!move(s.items,item,action.endsWith('up')?-1:1))return;}
  changed();render(focus);
 });
 const unload=e=>{if(dirty){draft();e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',unload);
 if(open)load();onToggle(open);
 return {setOpen:fold,toggle:()=>fold(!open),open:()=>fold(true),isOpen:()=>open,destroy(){disposed=true;clearTimeout(timer);if(dirty)draft();if(fullscreen){host.append(panel);fullscreen.remove();fullscreen=null;}window.removeEventListener('beforeunload',unload);host.remove();}};
}
