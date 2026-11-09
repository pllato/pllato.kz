const BASE='https://pllato-elc-worker.uurraa.workers.dev';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=v=>String(v||'').replace(/^deal_/,'');
export function linkedTasks(tasks,projectId,dealIds){
 const ids=new Set(dealIds.map(key));
 return tasks.filter(t=>!t.deleted&&!t.done&&!Number(t.movedToStart)&&(t.sourceProjectId===projectId||(t.crmDealId&&ids.has(key(t.crmDealId)))))
 .sort((a,b)=>Number(!!b.starred)-Number(!!a.starred)||Number(a.start)-Number(b.start));
}
export function contactInfo(c){
 const phones=Array.isArray(c?.phones)?c.phones:[];
 return {name:[c?.name,c?.lastName].filter(Boolean).join(' ').trim(),phone:phones.map(p=>typeof p==='string'?p:p?.VALUE||p?.value||'').find(Boolean)||''};
}
export function initProjectContext({getToken,getTasks,taskText,canEdit,onToggle,onOpen,kindTitle}){
 const cache=new Map();let active=0;const queue=[];
 function schedule(job){return new Promise((resolve,reject)=>{queue.push({job,resolve,reject});pump();});}
 function pump(){while(active<2&&queue.length){const q=queue.shift();active++;q.job().then(q.resolve,q.reject).finally(()=>{active--;pump();});}}
 async function read(type,id){const r=await fetch(`${BASE}/api/rtdb/${type}/${encodeURIComponent(id)}.json`,{headers:{Authorization:'Bearer '+getToken()},cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Данные CRM недоступны');return r.json();}
 function contact(id){if(!cache.has(id))cache.set(id,schedule(async()=>{const d=await read('deals',id);if(!d)return null;return d.contactId?contactInfo(await read('contacts',d.contactId)):null;}));return cache.get(id);}
 function tasks(root,card,ids){
  const list=linkedTasks(getTasks(),card.dataset.appId,ids),expanded=root.querySelector('details')?.open;
  root.replaceChildren();if(!list.length)return;
  const head=document.createElement('strong');head.textContent=`Дела · ${list.length}`;root.append(head);
  const row=t=>{const el=document.createElement('div');el.className='pc-task';const cb=document.createElement('input');cb.type='checkbox';cb.disabled=!canEdit(t);cb.setAttribute('aria-label','Выполнено: '+taskText(t));cb.onchange=async()=>{cb.disabled=true;await onToggle(t,cb.checked);render();};const button=document.createElement('button');button.type='button';button.textContent=taskText(t);button.title=taskText(t);button.onclick=()=>onOpen(t);const meta=document.createElement('small');meta.textContent=kindTitle(t.kind)+(t.start?' · '+new Date(Number(t.start)).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',timeZone:'Asia/Almaty'}):'');const body=document.createElement('div');body.append(button,meta);el.append(cb,body);return el;};
  list.slice(0,2).forEach(t=>root.append(row(t)));
  if(list.length>2){const more=document.createElement('details');more.open=!!expanded;const s=document.createElement('summary');s.textContent=`Ещё ${list.length-2}`;more.append(s);list.slice(2).forEach(t=>more.append(row(t)));root.append(more);}
 }
 function render(){for(const card of document.querySelectorAll('.tool-card[data-app-id]')){
  const ids=[...new Set([card.dataset.crmDealId,...[...card.querySelectorAll('[data-transcript-crm-link] .project-crm-row > a')].map(a=>decodeURIComponent(a.hash.replace('#deal/','')))].filter(Boolean))];
  if(!ids.length&&!getTasks().some(t=>t.sourceProjectId===card.dataset.appId))continue;
  let box=card.querySelector('.project-context');if(!box){box=document.createElement('section');box.className='project-context';box.innerHTML='<div class="pc-contact"></div><div class="pc-tasks"></div>';const title=card.querySelector('h3');title?title.after(box):card.append(box);}
  tasks(box.querySelector('.pc-tasks'),card,ids);
  const target=box.querySelector('.pc-contact');const signature=ids.join('|');if(target.dataset.ids===signature)continue;target.dataset.ids=signature;
  if(!ids.length){target.textContent='';continue;}target.textContent='Загрузка контакта…';
  Promise.allSettled(ids.map(contact)).then(results=>{if(target.dataset.ids!==signature)return;target.replaceChildren();results.forEach((r,i)=>{const el=document.createElement('div');if(r.status==='rejected'){el.textContent='Контакт недоступен';const retry=document.createElement('button');retry.type='button';retry.textContent='Повторить';retry.onclick=()=>{cache.delete(ids[i]);delete target.dataset.ids;render();};el.append(retry);}else{const c=r.value;el.innerHTML='<small>Основной контакт</small><b>'+esc(c?.name||'Не указан в CRM')+'</b>';if(c?.phone){const a=document.createElement('a');a.textContent=c.phone;a.href='tel:'+c.phone.replace(/[^+\d]/g,'');el.append(a);}}target.append(el);});});
 }}
 return {render};
}
