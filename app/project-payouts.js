const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(v)+' ₸';
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Almaty'});
let options, loadedFor;
export async function initProjectPayouts(config){
  options=config;
  const who=config.current()?.email;if(!who||loadedFor===who)return;
  loadedFor=who;
  try{
    const access=await config.api('/project-payouts/access');
    if(config.current()?.email!==who)return;
    document.querySelectorAll('.tool-card[data-app-id]').forEach(card=>{
      if(card.querySelector('.project-payouts-button'))return;
      const id=card.dataset.appId;
      if(!access.admin&&!access.projects.includes(id))return;
      const button=document.createElement('button');button.type='button';button.className='project-payouts-button';button.textContent='Выплаты';
      button.onclick=()=>openPayouts(id,card.querySelector('h3')?.textContent||id);
      card.append(button);
    });
  }catch(error){loadedFor=null;console.error('Выплаты:',error);}
}
async function openPayouts(projectId,title){
  document.querySelector('#projectPayoutDialog')?.remove();
  const dialog=document.createElement('dialog');dialog.id='projectPayoutDialog';dialog.className='project-payout-dialog';
  dialog.innerHTML=`<header><div><h2>Выплаты по проекту</h2><p>${esc(title)}</p></div><button type="button" data-close aria-label="Закрыть">✕</button></header><div class="pp-body"><p>Загружаю…</p></div>`;
  document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
  const body=dialog.querySelector('.pp-body'), url='/project-payouts?projectId='+encodeURIComponent(projectId);
  let data,filter='all',people=[];
  const errorBox=()=>body.querySelector('[role=alert]');
  async function refresh(){try{data=await options.api(url);render();}catch(e){body.innerHTML=`<p role="alert">${esc(e.message||e)}</p><button data-retry>Повторить</button>`;body.querySelector('[data-retry]').onclick=refresh;}}
  async function mutate(value){await options.api(url,{method:'POST',body:value});await refresh();}
  function render(){
    if(!dialog.isConnected)return;
    const items=data.items||[], sums={planned:0,paid:0}, recipients=new Map();
    items.forEach(i=>{sums[i.status]+=i.amount;const key=i.recipient.trim().toLocaleLowerCase('ru');const r=recipients.get(key)||{name:i.recipient,planned:0,paid:0};r[i.status]+=i.amount;recipients.set(key,r);});
    const visible=items.filter(i=>filter==='all'||i.status===filter).sort((a,b)=>(a.status===b.status?(a.status==='planned'?a.date.localeCompare(b.date):b.date.localeCompare(a.date)):a.status==='planned'?-1:1));
    body.innerHTML=`<div class="pp-summary"><div><small>Запланировано к выплате</small><strong>${money(sums.planned)}</strong></div><div><small>Выплачено</small><strong>${money(sums.paid)}</strong></div></div>
    <div class="pp-toolbar"><label>Показать <select data-filter><option value="all">Все записи</option><option value="planned">Запланировано</option><option value="paid">Выплачено</option></select></label>${data.admin?'<button data-new>+ Выплата</button><button data-access>Настройки доступа</button>':'<span>Доступ для просмотра</span>'}</div><p role="alert"></p><div data-editor></div>
    ${recipients.size?`<details class="pp-recipients"><summary>Итого по получателям · ${recipients.size}</summary><div class="pp-table"><table><thead><tr><th>Получатель</th><th>Запланировано</th><th>Выплачено</th></tr></thead><tbody>${[...recipients.values()].map(r=>`<tr><td>${esc(r.name)}</td><td>${money(r.planned)}</td><td>${money(r.paid)}</td></tr>`).join('')}</tbody></table></div></details>`:''}
    <div class="pp-list">${visible.length?visible.map(i=>`<article class="pp-entry"><div><strong>${esc(i.recipient)}</strong>${i.role?`<span class="pp-role">${esc(i.role)}</span>`:''}<p>${esc(i.note||'Без назначения')}</p><small>${i.status==='paid'?'Выплачено':'Запланировано'} · ${esc(i.date.split('-').reverse().join('.'))}</small></div><div class="pp-entry-right"><strong>${money(i.amount)}</strong>${data.admin?`<div>${i.status==='planned'?`<button data-paid="${esc(i.entryId)}">Отметить выплату</button>`:''}<button data-edit="${esc(i.entryId)}">Изменить</button></div>`:''}</div></article>`).join(''):'<p class="pp-empty">Выплат пока нет. Добавьте запланированную или уже выполненную выплату.</p>'}</div>`;
    body.querySelector('[data-filter]').value=filter;body.querySelector('[data-filter]').onchange=e=>{filter=e.target.value;render();};
    body.querySelector('[data-new]')?.addEventListener('click',()=>edit());body.querySelector('[data-access]')?.addEventListener('click',accessEditor);
    body.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(items.find(i=>i.entryId===b.dataset.edit)));
    body.querySelectorAll('[data-paid]').forEach(b=>b.onclick=()=>edit({...items.find(i=>i.entryId===b.dataset.paid),status:'paid',date:today()}));
  }
  async function loadPeople(){if(people.length)return;const result=await options.api('/users/list');people=(result.users||[]).filter(u=>u.email);}
  function edit(item={}){
    const slot=body.querySelector('[data-editor]');
    slot.innerHTML=`<form class="pp-form"><h3>${item.entryId?'Изменить выплату':'Новая выплата'}</h3><div class="pp-fields"><label>Получатель<input name="recipient" list="pp-people" required maxlength="160" placeholder="Имя сотрудника или подрядчика" value="${esc(item.recipient||'')}"></label><datalist id="pp-people"></datalist><label>Роль<select name="role">${['Программист','Продажи','Дизайнер','Другое'].map(r=>`<option${item.role===r?' selected':''}>${r}</option>`).join('')}</select></label><label>Сумма, ₸<input name="amount" type="number" min="0.01" max="1000000000000" step="0.01" required value="${esc(item.amount||'')}"></label><label>Статус<select name="status"><option value="planned">Запланировано</option><option value="paid">Выплачено</option></select></label><label>Дата <span data-date-label></span><input name="date" type="date" required value="${esc(item.date||today())}"></label><label class="pp-wide">Назначение / комментарий<textarea name="note" maxlength="1000" rows="2" placeholder="Например: разработка первого этапа или комиссия за продажу">${esc(item.note||'')}</textarea></label></div><div class="pp-form-actions"><button type="submit">Сохранить</button><button type="button" data-cancel>Отмена</button>${item.entryId?'<button type="button" data-delete>Удалить запись</button>':''}</div><p role="status">Это запись учёта выплаты. Банковский перевод не выполняется.</p><p data-error role="alert"></p></form>`;
    const form=slot.querySelector('form');form.elements.status.value=item.status||'planned';
    const dateLabel=()=>{form.querySelector('[data-date-label]').textContent=form.elements.status.value==='paid'?'фактической выплаты':'плановой выплаты';form.elements.date.max=form.elements.status.value==='paid'?today():'';};dateLabel();form.elements.status.onchange=dateLabel;
    slot.querySelector('[data-cancel]').onclick=()=>slot.replaceChildren();
    slot.querySelector('[data-delete]')?.addEventListener('click',async()=>{if(!confirm('Удалить запись из учёта выплат?'))return;await submit({id:item.entryId,deleted:true});});
    const entryId=item.entryId||crypto.randomUUID();
    async function submit(value){form.querySelectorAll('button').forEach(b=>b.disabled=true);try{await mutate(value);}catch(e){form.querySelector('[data-error]').textContent=e.message||String(e);form.querySelectorAll('button').forEach(b=>b.disabled=false);}}
    form.onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(form));submit({...values,id:entryId,amount:Number(values.amount)});};
    loadPeople().then(()=>{if(form.isConnected)form.querySelector('datalist').innerHTML=people.map(u=>`<option value="${esc(u.name||u.email)}">${esc(u.email)}</option>`).join('');}).catch(()=>{});
    form.elements.recipient.focus();slot.scrollIntoView({block:'nearest'});
  }
  async function accessEditor(){
    const slot=body.querySelector('[data-editor]');slot.innerHTML='<p>Загружаю сотрудников…</p>';
    try{await loadPeople();const known=new Set(people.map(u=>u.email.toLowerCase()));const users=[...people,...data.viewers.filter(e=>!known.has(e)).map(email=>({email,name:email}))];
    slot.innerHTML=`<form class="pp-form"><h3>Кто видит выплаты этого проекта</h3><p>Супер-админ всегда имеет полный доступ. Выбранные сотрудники смогут просматривать все выплаты проекта без права изменения.</p><div class="pp-access">${users.map(u=>`<label><input type="checkbox" value="${esc(u.email.toLowerCase())}"${data.viewers.includes(u.email.toLowerCase())?' checked':''}> <span>${esc(u.name||u.email)}<small>${esc(u.email)}</small></span></label>`).join('')||'<p>Сотрудников пока нет</p>'}</div><div class="pp-form-actions"><button type="submit">Сохранить доступ</button><button type="button" data-cancel>Отмена</button></div><p data-error role="alert"></p></form>`;
    const form=slot.querySelector('form');form.querySelector('[data-cancel]').onclick=()=>slot.replaceChildren();form.onsubmit=async e=>{e.preventDefault();form.querySelectorAll('button').forEach(b=>b.disabled=true);try{await options.api('/project-payouts/access?projectId='+encodeURIComponent(projectId),{method:'PUT',body:{viewers:[...form.querySelectorAll('input:checked')].map(i=>i.value)}});await refresh();}catch(err){form.querySelector('[data-error]').textContent=err.message||String(err);form.querySelectorAll('button').forEach(b=>b.disabled=false);}};
    }catch(e){slot.innerHTML=`<p role="alert">${esc(e.message||e)}</p>`;}
  }
  await refresh();
}
