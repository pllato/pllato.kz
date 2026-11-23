const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const person='<svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="6" r="3"/><path d="M4 17v-2a6 6 0 0 1 12 0v2"/></svg>';
export function createTaskAssigneePicker({getTask,getUsers,getName,canEdit,save,onSaved}){
 let pop=null,trigger=null,busy=false;
 function render(task){
  const email=String(task.assigneeEmail||''),name=email?getName(email):(canEdit(task)?'Назначить':'Не назначен');
  const title=email?'Временный ответственный: '+name:'Выбрать временного ответственного за дело';
  const initials=email?name.trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase():'';
  const content=`<span class="fc-assignee-avatar${email?' assigned':''}">${email?esc(initials):person}</span><span class="fc-assignee-name">${esc(name)}</span>`;
  return `<small class="fc-task-assignee">${canEdit(task)?`<button type="button" data-task-assignee="${esc(task.id)}" aria-label="${esc(title)}" title="${esc(title)}" aria-haspopup="dialog" aria-expanded="false" onclick="openTaskAssignee(event,this)">${content}</button>`:`<span title="${esc(title)}">${content}</span>`}</small>`;
 }
 function close(restore=false){pop?.remove();pop=null;trigger?.setAttribute('aria-expanded','false');if(restore&&trigger?.isConnected)trigger.focus({preventScroll:true});trigger=null;}
 function open(event,button){
  event?.stopPropagation();const id=button.dataset.taskAssignee,task=getTask(id);if(!task||!canEdit(task))return;
  if(trigger===button){close(true);return;}close();trigger=button;button.setAttribute('aria-expanded','true');busy=false;
  pop=document.createElement('div');pop.className='task-assignee-pop';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Временный ответственный за дело');
  pop.innerHTML='<header><strong>Ответственный за дело</strong><button type="button" aria-label="Закрыть выбор ответственного">✕</button></header><p>Только для этого дела</p><input type="search" placeholder="Найти сотрудника…" aria-label="Найти сотрудника"><div class="task-assignee-options"></div><div class="task-assignee-status" role="status"></div>';
  document.body.append(pop);const rect=button.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(rect.left,innerWidth-288))+'px';pop.style.top=Math.max(8,Math.min(rect.bottom+6,innerHeight-350))+'px';
  const currentPop=pop,input=pop.querySelector('input'),list=pop.querySelector('.task-assignee-options'),status=pop.querySelector('[role=status]');
  const people=new Map(getUsers().filter(u=>u.email&&!u.disabled).map(u=>[String(u.email).toLowerCase(),u.name||u.email]));if(task.assigneeEmail&&!people.has(task.assigneeEmail))people.set(task.assigneeEmail,getName(task.assigneeEmail));
  function paint(){list.replaceChildren();const term=input.value.trim().toLowerCase();let count=0;
   for(const [email,name] of [['','Без ответственного'],...people]){if(email&&term&&!String(name+' '+email).toLowerCase().includes(term))continue;count++;const option=document.createElement('button');option.type='button';option.disabled=busy;option.setAttribute('aria-pressed',String(email===String(task.assigneeEmail||'')));option.textContent=(email===String(task.assigneeEmail||'')?'✓  ':'')+name;
    option.onclick=async()=>{if(busy)return;if(email===String(task.assigneeEmail||'')){close(true);return;}busy=true;paint();status.textContent='Сохраняю…';try{const item=await save(id,email);onSaved(item);if(pop===currentPop){close();for(const b of document.querySelectorAll('[data-task-assignee]'))if(b.dataset.taskAssignee===id){b.focus({preventScroll:true});break;}}}catch{if(currentPop.isConnected){status.textContent='Не удалось назначить. Попробуйте ещё раз.';busy=false;paint();}}};list.append(option);
   }
   if(count===1&&term){const empty=document.createElement('p');empty.textContent='Сотрудник не найден';list.append(empty);}
  }
  input.oninput=paint;pop.querySelector('header button').onclick=()=>close(true);paint();input.focus({preventScroll:true});
 }
 document.addEventListener('click',event=>{if(pop&&!pop.contains(event.target)&&!trigger?.contains(event.target))close();},true);
 document.addEventListener('keydown',event=>{if(pop&&event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}},true);
 window.addEventListener('resize',()=>close());document.addEventListener('scroll',event=>{if(pop&&!pop.contains(event.target))close();},true);
 return {render,open,close};
}
