const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={pending:'В очереди',done:'Готово',error:'Нужно проверить',cancelled:'Отменено',creating:'Создание не подтверждено',active:'Группа создана',member:'В группе',invited:'Приглашение отправлено в личку',sending:'Отправка приглашения не подтверждена'};
export function stageGroupsClient({base,getToken}){
 async function api(path,method='GET',body){const r=await fetch(base+'/api/wa/stage-groups/'+path,{method,headers:{Authorization:'Bearer '+await getToken(),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw new Error(data.error||'Ошибка WhatsApp');return data;}
 async function settings(pipelineId){
  const dialog=document.createElement('dialog');dialog.style.cssText='width:min(850px,94vw);max-height:90vh;overflow:auto;padding:22px;background:var(--bg2,#fff);color:var(--t1,#111);border:1px solid var(--b1,#ccc);border-radius:12px';
  dialog.innerHTML='<h3>WhatsApp-группы по этапам</h3><p>Клиент и ответственный менеджер добавляются автоматически. На каждом этапе выберите дополнительных сотрудников. Если добавить участника не получится, ему отправится ссылка в личный WhatsApp.</p><p>Название: Pllato IT разработка - CRM - Имя контакта - ДД.ММ.ГГГГ.</p><div data-content>Загрузка…</div><p data-status role="status"></p><button type="button" class="tbtn" data-save disabled>Сохранить настройки</button> <button type="button" class="tbtn" data-close>Закрыть</button>';
  document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
  const box=dialog.querySelector('[data-content]'),status=dialog.querySelector('[data-status]'),save=dialog.querySelector('[data-save]');
  try{
   const data=await api('rules?pipeline='+encodeURIComponent(pipelineId));if(!dialog.open)return;
   box.innerHTML=`<p><b>${esc(data.pipeline.name)}</b></p><p style="font-size:13px">Правила действуют на будущие переходы. Одна группа на сделку: следующие этапы добавляют людей в неё, прежние участники остаются. Рабочий номер выбирается при создании группы. Очередь соблюдает интервал 5 минут между новыми группами с одного номера.</p>`;
   for(const [id,stage] of Object.entries(data.pipeline.stages).sort((a,b)=>(a[1].sort||0)-(b[1].sort||0))){
    const rule=data.rules.find(x=>x.stage_id===id),row=document.createElement('details');row.dataset.stage=id;row.open=!!rule;row.style.cssText='padding:10px;border-bottom:1px solid var(--b1)';
    row.innerHTML=`<summary>${esc(stage.name||id)}${rule?' · включено':''}</summary><label style="display:block;margin:10px 0"><input type="checkbox" data-enabled ${rule?'checked':''}> Создать группу / добавить участников на этом этапе</label><label>Рабочий WhatsApp-номер <select data-channel><option value="">Выберите номер</option>${data.channels.map(ch=>`<option value="${esc(ch.id)}" ${rule?.channel_id===ch.id?'selected':''}>${esc(ch.display_name||ch.id_instance)}</option>`).join('')}</select></label><p>Дополнительные сотрудники (до 8):</p><div style="max-height:210px;overflow:auto">${data.users.map(u=>`<label style="display:block;margin:7px 0"><input type="checkbox" data-uid="${esc(u.uid)}" ${rule?.employee_uids.includes(u.uid)?'checked':''} ${u.phone?'':'disabled'}> ${esc([u.name,u.last_name].filter(Boolean).join(' '))} <span style="font-size:12px;color:var(--t3)">${esc(u.phone||'нет телефона в профиле')}</span></label>`).join('')}</div>`;
    box.append(row);
   }
   if(data.jobs.length){const jobs=document.createElement('div');jobs.innerHTML='<h4>Очередь и ошибки</h4>'+data.jobs.map(j=>`<p><a href="/team.html#deal/${encodeURIComponent(j.deal_id.replace(/^deal_/,''))}">${esc(j.title||j.deal_id)}</a>: ${esc(labels[j.status]||j.status)} ${esc(j.error||'')}</p>`).join('');box.append(jobs);}
   save.disabled=false;
   save.onclick=async()=>{
    const rules=[...box.querySelectorAll('[data-stage]')].filter(r=>r.querySelector('[data-enabled]').checked).map(r=>({stage_id:r.dataset.stage,channel_id:r.querySelector('[data-channel]').value,employee_uids:[...r.querySelectorAll('[data-uid]:checked')].map(c=>c.dataset.uid)}));
    save.disabled=true;status.textContent='Сохраняется…';try{await api('rules?pipeline='+encodeURIComponent(pipelineId),'PUT',{rules});status.textContent='Настройки сохранены. Правила действуют при следующих переходах на этапы.';}catch(e){status.textContent=e.message;}finally{save.disabled=false;}
   };
  }catch(e){box.textContent=e.message;}
 }
 async function manual(container,dealId){
  const dialog=document.createElement('dialog');
  dialog.style.cssText='width:min(600px,94vw);max-height:85vh;overflow:auto;padding:22px;background:var(--bg2,#fff);color:var(--t1,#111);border:1px solid var(--b1,#ccc);border-radius:12px';
  dialog.innerHTML='<h3>Создать группу WhatsApp</h3><p>Клиент и ответственный менеджер добавятся автоматически. Если участника нельзя добавить, ему отправится приглашение в личный WhatsApp.</p><div data-content>Загрузка…</div><p data-status role="status"></p><button class="tbtn" data-create disabled>Создать группу</button> <button class="tbtn" data-close>Отмена</button>';
  document.body.append(dialog);dialog.showModal();dialog.onclose=()=>dialog.remove();dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  const box=dialog.querySelector('[data-content]'),status=dialog.querySelector('[data-status]'),create=dialog.querySelector('[data-create]');
  try{
   const data=await api('deals/'+encodeURIComponent(dealId)+'?options=1');if(!dialog.open)return;
   box.innerHTML=`<label>Рабочий WhatsApp-номер <select data-channel><option value="">Выберите номер</option>${data.options.channels.map(c=>`<option value="${esc(c.id)}" ${data.options.channels.length===1?'selected':''}>${esc(c.display_name||c.id_instance)}</option>`).join('')}</select></label><p>Дополнительные сотрудники (до 8):</p>${data.options.users.map(u=>`<label style="display:block;margin:8px 0"><input type="checkbox" data-uid="${esc(u.uid)}" ${u.phone?'':'disabled'}> ${esc([u.name,u.last_name].filter(Boolean).join(' '))}${u.phone?'':' — нет телефона'}</label>`).join('')}<p>Название: Pllato IT разработка - CRM - Имя контакта - дата создания.</p>`;
   create.disabled=false;
   create.onclick=async()=>{
    create.disabled=true;status.textContent='Добавляем в очередь…';
    try{await api('deals/'+encodeURIComponent(dealId),'POST',{action:'create',channel_id:box.querySelector('[data-channel]').value,employee_uids:[...box.querySelectorAll('[data-uid]:checked')].map(x=>x.dataset.uid)});dialog.close();await deal(container,dealId);}
    catch(e){status.textContent=e.message;create.disabled=false;}
   };
  }catch(e){status.textContent=e.message;}
 }
 async function deal(container,dealId){
  if(!container)return;
  try{
   const data=await api('deals/'+encodeURIComponent(dealId));if(!container.isConnected)return;
   if(!data.group&&!data.jobs.length){container.innerHTML='<div class="dc-section-h">Рабочая группа WhatsApp</div><button type="button" class="tbtn" data-manual>Создать группу WhatsApp</button>';container.querySelector('[data-manual]').onclick=()=>manual(container,dealId);return;}
   const link=data.group?.invite_link,valid=/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(link||'');
   container.innerHTML=`<div class="dc-section-h">Рабочая группа WhatsApp</div><b>${esc(data.group?.name||'Создание группы')}</b>${valid?`<p><a href="${esc(link)}" target="_blank" rel="noopener noreferrer">Открыть группу WhatsApp</a> <button type="button" class="tbtn" data-copy>Копировать приглашение</button></p>`:''}<p>${data.jobs.map(j=>esc(labels[j.status]||j.status)+(j.error?': '+esc(j.error):'')).join('<br>')}</p>${data.people.map(p=>`<div>${esc(p.label)} — ${esc(labels[p.status]||p.status)}</div>`).join('')}<p data-status role="status"></p>${data.admin&&data.jobs.some(j=>j.status==='error')?`<input data-group-id placeholder="ID уже созданной группы (…@g.us)" aria-label="ID уже созданной группы"><button type="button" class="tbtn" data-retry>Проверить / повторить обработку</button>`:''}`;
   if(data.jobs.some(j=>j.status==='pending')){clearTimeout(container._waGroupTimer);container._waGroupTimer=setTimeout(()=>{if(container.isConnected)deal(container,dealId);},5000);}
   const status=container.querySelector('[data-status]');
   const copy=container.querySelector('[data-copy]');if(copy)copy.onclick=async()=>{try{await navigator.clipboard.writeText(link);status.textContent='Ссылка скопирована';}catch{status.textContent='Скопируйте ссылку из кнопки открытия группы';}};
   const retry=container.querySelector('[data-retry]');if(retry)retry.onclick=async()=>{retry.disabled=true;try{await api('deals/'+encodeURIComponent(dealId),'POST',{groupId:container.querySelector('[data-group-id]').value.trim()||undefined});await deal(container,dealId);}catch(e){status.textContent=e.message;retry.disabled=false;}};
  }catch(e){container.textContent='Группа WhatsApp: '+e.message;}
 }
 return {settings,deal};
}
