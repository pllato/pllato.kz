// Общая проверка только видимых строк; никаких запросов на каждое дело.
export function initTaskCommentPreviews({apiFetch,getEmail}){
 const summaries=new Map(),fetched=new Map();let busy=false,timer,disposed=false,account='';
 const readKey=()=> 'pllato_task_reads_v1:'+String(getEmail()||'').toLowerCase();
 let reads={};
 function ensureAccount(){const next=String(getEmail()||'').toLowerCase();if(next===account)return;account=next;summaries.clear();fetched.clear();try{reads=JSON.parse(localStorage.getItem(readKey())||'{}');}catch{reads={};}}
 function thread(id){return String(id||'').slice(0,String(id||'').lastIndexOf(':'));}
 function markRead(c){const key=thread(c.id);if(!key||reads[key]>=c.id)return;reads[key]=c.id;try{localStorage.setItem(readKey(),JSON.stringify(Object.fromEntries(Object.entries(reads).sort((a,b)=>b[1].localeCompare(a[1])).slice(0,1000))));}catch{}}
 function rows(){return [...document.querySelectorAll('.fc-week-task[data-task-id]')];}
 function paint(){ensureAccount();for(const row of rows()){
  const summary=summaries.get(row.dataset.taskId),c=summary?.latest;
  const slot=row.querySelector('.text');if(!slot)continue;
  let preview=slot.querySelector('.fc-task-comment-preview');
  if(!c){if(preview)preview.remove();row.classList.remove('has-unread-comment','has-comment');continue;}
  const unread=String(c.author||'').toLowerCase()!==account&&String(reads[thread(c.id)]||'')<c.id;
  const label=(c.authorName||c.author||'Сотрудник')+': '+c.text;
  if(!preview){preview=document.createElement('span');preview.className='fc-task-comment-preview';slot.append(preview);}
  const signature=c.id+':'+unread;if(preview.dataset.signature!==signature){preview.dataset.signature=signature;preview.replaceChildren();const dot=document.createElement('span');dot.className='fc-task-comment-dot';dot.setAttribute('aria-hidden','true');const text=document.createElement('span');text.textContent=label;preview.append(dot,text);preview.title=(unread?'Непрочитано · ':'')+label;preview.setAttribute('aria-label',preview.title);}
  row.classList.add('has-comment');row.classList.toggle('has-unread-comment',unread);
 }}
 function visibleIds(){return [...new Set(rows().filter(row=>{
  const r=row.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return false;
  const list=row.closest('.fc-week-tasks-list');if(list){const b=list.getBoundingClientRect();if(r.bottom<=b.top||r.top>=b.bottom)return false;}
  return true;
 }).map(row=>row.dataset.taskId))];}
 async function refresh(){ensureAccount();if(disposed||busy||document.hidden||!account)return;
  const ids=visibleIds().filter(id=>Date.now()-(fetched.get(id)||0)>=20000);if(!ids.length)return;
  busy=true;const owner=account;
  try{for(let i=0;i<ids.length;i+=40){if(document.hidden||disposed)return;const batch=ids.slice(i,i+40);for(const id of batch)fetched.set(id,Date.now()+40000);const data=await apiFetch('/project-finance/task-discussion-summaries',{method:'POST',body:{ids:batch}});if(owner!==String(getEmail()||'').toLowerCase()||disposed)return;
   for(const summary of data.items||[]){const old=summaries.get(summary.taskId);if(!old?.latest||(summary.latest&&summary.latest.id>=old.latest.id))summaries.set(summary.taskId,summary);}
   for(const id of batch)fetched.set(id,Date.now());paint();
  }}catch{/* Повтор по общему таймеру; содержимое строк остаётся на месте. */}
  finally{busy=false;}
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(()=>{paint();refresh();},250);}
 function update(event){ensureAccount();const {taskId,item,read}=event.detail||{};if(!taskId||!item)return;const old=summaries.get(taskId)?.latest;if(!old||item.id>=old.id)summaries.set(taskId,{taskId,latest:{...item,text:String(item.text||'').slice(0,240)}});if(read&&!document.hidden)markRead(item);paint();}
 function storage(event){if(event.key===readKey()){try{reads=JSON.parse(event.newValue||'{}');}catch{reads={};}paint();}}
 const observer=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('.fc-week-task,.fc-week-tasks')||n.querySelector?.('.fc-week-task')))))schedule();});
 observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('scroll',schedule,true);document.addEventListener('visibilitychange',schedule);document.addEventListener('task-discussion-update',update);window.addEventListener('storage',storage);
 const interval=setInterval(()=>{paint();refresh();},20000);schedule();
 return {refresh,dispose(){disposed=true;clearInterval(interval);clearTimeout(timer);observer.disconnect();document.removeEventListener('scroll',schedule,true);document.removeEventListener('visibilitychange',schedule);document.removeEventListener('task-discussion-update',update);window.removeEventListener('storage',storage);}};
}
