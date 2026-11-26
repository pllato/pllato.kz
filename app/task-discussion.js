// Only an open task loads or refreshes its own discussion.
export function mountTaskDiscussion(root,{taskId,apiFetch,getUsers=()=>[]}){
 root.innerHTML='<header><h4>Обсуждение</h4><button type="button" data-refresh>Обновить</button></header><button type="button" data-older hidden>Ранее</button><div class="task-chat-list" role="log" aria-live="polite"></div><p data-status role="status"></p><form><label class="sr-only" for="taskChatText">Комментарий к делу</label><textarea id="taskChatText" rows="2" maxlength="4000" placeholder="Напишите обновление или задайте вопрос…" required></textarea><button type="submit">Отправить</button></form>';
 const list=root.querySelector('[role=log]'),status=root.querySelector('[data-status]'),form=root.querySelector('form'),input=root.querySelector('textarea'),send=form.querySelector('button'),older=root.querySelector('[data-older]');
 const url='/project-finance/tasks/'+encodeURIComponent(taskId)+'/comments';
 const mentions=new Map(),controls=document.createElement('div');controls.className='task-mention-controls';
 const pick=document.createElement('select');pick.setAttribute('aria-label','Упомянуть сотрудника');const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='@ Упомянуть сотрудника';pick.append(placeholder);
 for(const u of getUsers()){if(!u.email||u.disabled)continue;const o=document.createElement('option');o.value=u.email;o.textContent=u.name||u.email;pick.append(o);}
 const chips=document.createElement('span');controls.append(pick,chips);form.before(controls);
 function paintMentions(){chips.replaceChildren();for(const [email,name] of mentions){const b=document.createElement('button');b.type='button';b.textContent='@'+name+' ×';b.onclick=()=>{mentions.delete(email);paintMentions();};chips.append(b);}}
 pick.onchange=()=>{if(pick.value&&mentions.size<10){mentions.set(pick.value,pick.selectedOptions[0].textContent);paintMentions();}pick.value='';};
 let busy=false,cursor=null,items=new Map();
 function notify(read=false){const latest=[...items.values()].sort((a,b)=>b.id.localeCompare(a.id))[0];if(latest)document.dispatchEvent(new CustomEvent('task-discussion-update',{detail:{taskId,item:latest,read:read&&!document.hidden}}));}
 list.addEventListener('scroll',()=>{if(list.scrollHeight-list.scrollTop-list.clientHeight<40)notify(true);});
 function paint(){list.replaceChildren();const sorted=[...items.values()].sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id));
  if(!sorted.length){const empty=document.createElement('p');empty.className='task-chat-empty';empty.textContent='Комментариев пока нет';list.append(empty);}
  for(const c of sorted){const row=document.createElement('article'),meta=document.createElement('small'),text=document.createElement('p');meta.textContent=(c.authorName||c.author)+' · '+new Date(c.createdAt).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});text.textContent=c.text;row.append(meta,text);list.append(row);}
 }
 async function load(previous=false){if(busy)return;busy=true;try{
  const nearBottom=list.scrollHeight-list.scrollTop-list.clientHeight<60,oldHeight=list.scrollHeight,oldTop=list.scrollTop;
  const data=await apiFetch(url+(previous&&cursor?'?before='+encodeURIComponent(cursor):''));
  if(!root.isConnected)return;
  for(const c of data.items||[])items.set(c.id,c);
  if(previous||items.size<=50)cursor=data.nextCursor;older.hidden=!cursor;paint();status.textContent='';
  if(previous)list.scrollTop+=list.scrollHeight-oldHeight;else list.scrollTop=nearBottom?list.scrollHeight:oldTop;
  notify(!previous&&nearBottom);
 }catch(e){if(root.isConnected)status.textContent='Не удалось загрузить комментарии. Нажмите «Обновить».';}finally{busy=false;}}
 older.onclick=()=>load(true);root.querySelector('[data-refresh]').onclick=()=>load();
 form.onsubmit=async event=>{event.preventDefault();const text=input.value.trim();if(!text||send.disabled)return;send.disabled=true;status.textContent='';
  try{const data=await apiFetch(url,{method:'POST',body:{text,mentions:[...mentions.keys()]}});if(!root.isConnected)return;items.set(data.item.id,data.item);if(input.value.trim()===text){input.value='';mentions.clear();paintMentions();}paint();list.scrollTop=list.scrollHeight;notify(true);}
  catch(e){status.textContent='Комментарий не отправлен. Текст сохранён в поле — попробуйте ещё раз.';}finally{send.disabled=false;}
 };
 input.addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();form.requestSubmit();}});
 let timer;
 function tick(){if(!root.isConnected){clearInterval(timer);return;}if(!document.hidden&&!busy)load();}
 timer=setInterval(tick,30000);load();
 return ()=>clearInterval(timer);
}
