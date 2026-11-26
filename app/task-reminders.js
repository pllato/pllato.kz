import {compareTaskSchedule,taskScheduleLabel} from './task-schedule.js';
export function initTaskReminders({api,getEmail,getTasks,openTask,kindTitle}){
 const pendingReads=new Set();
 const button=document.getElementById('taskRemindersButton');let owner='',data={items:[],unread:0},busy=false,last=0,dialog=null,mode='notices',cursor=null;
 const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
 function badge(){button.textContent='Дела'+(data.unread?' · '+data.unread:'');button.classList.toggle('has-unread',data.unread>0);button.setAttribute('aria-label','Лента дел'+(data.unread?', непрочитанных: '+data.unread:''));}
 async function refresh(older=false){if(busy||!getEmail()||document.hidden)return;busy=true;const account=getEmail();
  if(owner!==account){owner=account;data={items:[],unread:0};cursor=null;last=0;pendingReads.clear();badge();}
  try{const result=await api('/project-finance/task-reminders'+(older&&cursor?'?before='+encodeURIComponent(cursor):''));if(getEmail()!==account)return;data={...result,items:older?[...data.items,...result.items]:result.items};cursor=result.nextCursor;last=Date.now();badge();paint();const ids=data.items.filter(n=>pendingReads.has(n.taskId)&&!n.readAt).slice(0,50).map(n=>n.id);pendingReads.clear();if(ids.length)read(ids).catch(()=>{});}catch{if(dialog)dialog.querySelector('[data-status]').textContent='Не удалось обновить. Попробуйте ещё раз.';}finally{busy=false;}
 }
 async function read(ids){if(!ids.length)return;await api('/project-finance/task-reminders',{method:'POST',body:{ids}});for(const n of data.items)if(ids.includes(n.id)&&!n.readAt){n.readAt=Date.now();data.unread=Math.max(0,data.unread-1);}badge();paint();}
 function readTask(id){if(!last){pendingReads.add(id);refresh();return;}read(data.items.filter(n=>n.taskId===id&&!n.readAt).map(n=>n.id).slice(0,50)).catch(()=>{});}
 function paint(){if(!dialog?.open)return;const list=dialog.querySelector('[data-list]');list.replaceChildren();
  const tasks=mode==='agenda'?getTasks().filter(t=>!t.deleted&&!t.done&&!t.movedToTaskId&&t.dueDate).sort(compareTaskSchedule):null;
  const items=tasks||data.items;
  if(!items.length){const p=document.createElement('p');p.className='task-inbox-empty';p.textContent=mode==='agenda'?'Дел с датой пока нет. Укажите срок в карточке дела.':'Уведомлений пока нет. Здесь появятся назначения, упоминания и комментарии.';list.append(p);}
  for(const n of items){const task=tasks?n:n.task;const row=document.createElement('button');row.type='button';row.className='task-inbox-row'+(!tasks&&!n.readAt?' unread':'');
   const title=task.taskTextOverride||task.text||'Дело';const date=taskScheduleLabel(task);
   row.innerHTML=`<strong>${esc(title)}</strong><small>${esc(kindTitle(task.kind))}${date?' · '+esc(date):''}</small>${tasks?'':`<span>${esc(n.actorName)} · ${n.kind==='assigned'?'назначил(а) вас ответственным':n.kind==='mention'?'упоминание: '+esc(n.text):esc(n.text)}</span><time>${new Date(n.createdAt).toLocaleString('ru-RU',{timeZone:'Asia/Almaty',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</time>`}`;
   row.onclick=()=>{dialog.close();openTask(task);readTask(task.id);};list.append(row);
  }
  dialog.querySelector('[data-more]').hidden=mode==='agenda'||!cursor;dialog.querySelector('[data-read]').hidden=mode==='agenda'||!data.items.some(n=>!n.readAt);
 }
 async function enablePush(){const status=dialog.querySelector('[data-status]');
  if(!('serviceWorker' in navigator)||!('PushManager' in window)){status.textContent='На iPhone откройте приложение с экрана «Домой», чтобы включить push.';return;}
  try{const permission=await Notification.requestPermission();if(permission!=='granted'){status.textContent='Разрешите уведомления в настройках браузера. Лента дел доступна и без push.';return;}
   const {publicKey}=await api('/project-finance/task-reminders/push-key');if(!publicKey)throw Error('Push пока не настроен');
   const registration=await navigator.serviceWorker.register('/task-sw.js',{scope:'/app'});await new Promise((resolve,reject)=>{if(registration.active)return resolve();const worker=registration.installing||registration.waiting;if(!worker)return reject(Error('Не удалось включить уведомления'));worker.addEventListener('statechange',()=>{if(worker.state==='activated')resolve();if(worker.state==='redundant')reject(Error('Попробуйте ещё раз'));});});
   const raw=atob(publicKey.replace(/-/g,'+').replace(/_/g,'/'));const key=Uint8Array.from(raw,c=>c.charCodeAt(0));
   const subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
   await api('/project-finance/task-reminders/subscribe',{method:'POST',body:subscription.toJSON()});status.textContent='Push для дел включён на этом устройстве';
  }catch(e){status.textContent=e.message||'Не удалось включить push';}
 }
 button.onclick=()=>{if(owner!==getEmail()){owner=getEmail();data={items:[],unread:0};cursor=null;last=0;pendingReads.clear();badge();}dialog?.remove();dialog=document.createElement('dialog');dialog.className='task-inbox';dialog.innerHTML='<header><h2>Дела и напоминания</h2><button data-close aria-label="Закрыть">✕</button></header><nav><button data-tab="notices" aria-pressed="true">Уведомления</button><button data-tab="agenda" aria-pressed="false">Хронология</button></nav><div class="task-inbox-tools"><button data-refresh>Обновить</button><button data-push>Включить push</button><button data-read>Прочитать показанные</button></div><p data-status role="status"></p><div data-list></div><button data-more hidden>Загрузить ранее</button>';
  document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{mode=b.dataset.tab;dialog.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));paint();});mode='notices';
  dialog.querySelector('[data-refresh]').onclick=()=>refresh();dialog.querySelector('[data-push]').onclick=enablePush;dialog.querySelector('[data-more]').onclick=()=>refresh(true);dialog.querySelector('[data-read]').onclick=()=>read(data.items.filter(n=>!n.readAt).slice(0,50).map(n=>n.id)).catch(()=>{dialog.querySelector('[data-status]').textContent='Не удалось отметить прочитанными';});dialog.showModal();paint();refresh();
 };
 const tick=()=>{if(getEmail()&&!document.hidden&&Date.now()-last>=60000)refresh();};
 setInterval(tick,60000);document.addEventListener('visibilitychange',tick);window.addEventListener('focus',tick);setTimeout(tick,3000);
 return {refresh,readTask};
}
