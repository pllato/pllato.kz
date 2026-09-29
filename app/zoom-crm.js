// UI Zoom: все материалы открываются через авторизованный API CRM.
export function zoomClient({ base, getToken }) {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(path, options = {}) {
    const r = await fetch(base + '/api/zoom' + path, { ...options, headers: { 'Content-Type':'application/json', Authorization:'Bearer '+await getToken(), ...options.headers } });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Ошибка Zoom');
    return data;
  }
  async function event(container, taskId) {
    if (!container) return;
    container.textContent = 'Проверяем ссылку Zoom…';
    try {
      const {meeting} = await api('/tasks/'+encodeURIComponent(taskId));
      if (!container.isConnected) return;
      if (meeting?.join_url && /^https:\/\/([a-z0-9-]+\.)?zoom\.(us|com)\//i.test(meeting.join_url)) {
        container.innerHTML = `<a class="tbtn tbtn-a" href="${esc(meeting.join_url)}" target="_blank" rel="noopener noreferrer">Открыть Zoom</a>
          <button type="button" class="tbtn" data-copy>Копировать ссылку</button>
          <div style="font-size:12px;overflow-wrap:anywhere;margin-top:8px">${esc(meeting.join_url)}</div>`;
        container.querySelector('[data-copy]').onclick = async e => { try { await navigator.clipboard.writeText(meeting.join_url); e.target.textContent='Скопировано'; } catch { e.target.textContent='Скопируйте ссылку ниже'; } };
      } else {
        container.innerHTML = `<div>${esc(meeting?.error || 'Ссылка Zoom ещё не создана.')}</div><button type="button" class="tbtn" data-create>Создать ссылку Zoom</button>`;
        container.querySelector('[data-create]').onclick = async e => {
          e.target.disabled=true;
          try { await api('/tasks/'+encodeURIComponent(taskId),{method:'POST'}); await event(container,taskId); }
          catch(error) { container.textContent=error.message; }
        };
      }
    } catch(e) { container.textContent=e.message; }
  }
  function created(taskId, error) {
    const dialog=document.createElement('dialog');
    dialog.style.cssText='max-width:560px;width:90%;padding:20px;background:var(--bg2,#fff);color:var(--t1,#111);border:1px solid var(--b1,#ccc);border-radius:12px';
    dialog.innerHTML='<h3>Встреча сохранена в календаре</h3><div data-result></div><button class="tbtn" data-close style="margin-top:18px">Закрыть</button>';
    document.body.append(dialog); dialog.showModal();
    dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
    event(dialog.querySelector('[data-result]'),taskId);
  }
  async function files(container, dealId, canDelete = false) {
    if(!container) return;
    container.textContent='Загружаем материалы Zoom…';
    try {
      const {files:rows}=await api('/files'+(dealId?'?deal='+encodeURIComponent(dealId):''));
      if(!container.isConnected)return;
      container.innerHTML=rows.length?rows.map(f=>`<div style="padding:10px 0;border-bottom:1px solid var(--b1)">
        <b>${esc(f.topic || 'Встреча Zoom')}</b><div style="font-size:12px;color:var(--t3)">${esc(f.recording_start)} · ${esc(f.kind)} · ${(f.size/1048576).toFixed(1)} МБ</div>
        ${f.status==='stored'?`<button class="tbtn" data-open="${esc(f.id)}">${f.extension==='MP4'?'Смотреть':/VTT|TXT/.test(f.extension)?'Транскрипт / текст':'Открыть файл'}</button>${canDelete?` <button class="tbtn" data-del="${esc(f.id)}">Удалить файл</button>`:''}`:`<span>${f.status==='deleted'?'Файл удалён':'Ожидает переноса'}</span>`}
        ${!dealId?`<button class="tbtn" data-link="${esc(f.id)}">Прикрепить к сделке</button>`:''}
        ${f.error?`<div style="color:var(--rd)">${esc(f.error)}</div>`:''}<div data-player="${esc(f.id)}"></div></div>`).join(''):'Материалов Zoom пока нет.';
      container.querySelectorAll('[data-open]').forEach(b=>b.onclick=async()=>{
        const f=rows.find(x=>x.id===b.dataset.open), box=Array.from(container.querySelectorAll('[data-player]')).find(x=>x.dataset.player===f.id);
        try {
          const url=base+'/api/zoom/files/'+encodeURIComponent(f.id)+'?auth='+encodeURIComponent(await getToken());
          const tag=f.extension==='MP4'?'video':f.extension==='M4A'?'audio':null;
          if(tag){box.innerHTML=`<${tag} controls preload="metadata" style="width:100%;max-height:360px" src="${esc(url)}"></${tag}>`;}
          else if(/VTT|TXT/.test(f.extension)) {
            const r=await fetch(url); if(!r.ok)throw new Error('Не удалось прочитать файл');
            const pre=document.createElement('pre');pre.style.cssText='max-height:400px;overflow:auto;white-space:pre-wrap';pre.textContent=await r.text();box.replaceChildren(pre);
          }else{const a=document.createElement('a');a.href=url;a.textContent='Скачать';a.target='_blank';a.rel='noopener noreferrer';box.replaceChildren(a);}
        }catch(e){box.textContent=e.message;}
      });
      container.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{
        if(!confirm('Удалить этот файл из CRM? Восстановить его здесь будет нельзя.'))return;
        b.disabled=true;
        try{await api('/files/'+encodeURIComponent(b.dataset.del),{method:'DELETE'});await files(container,dealId,canDelete);}catch(e){alert(e.message);b.disabled=false;}
      });
      container.querySelectorAll('[data-link]').forEach(b=>b.onclick=async()=>{
        const chooser=document.createElement('div');
        chooser.innerHTML='<input type="search" placeholder="Название сделки" aria-label="Поиск сделки"><button class="tbtn">Найти</button><div data-results></div>';
        b.after(chooser); b.disabled=true;
        chooser.querySelector('button').onclick=async()=>{
          const results=chooser.querySelector('[data-results]');
          try{
            const q=chooser.querySelector('input').value.trim();if(q.length<2){results.textContent='Введите хотя бы два символа';return;}
            const response=await fetch(base+'/api/list/deals?'+new URLSearchParams({q,pageSize:'20'}),{headers:{Authorization:'Bearer '+await getToken()}});
            if(!response.ok)throw new Error('Не удалось найти сделки');
            const data=await response.json();results.replaceChildren();
            for(const deal of data.items || []){
              const button=document.createElement('button');button.className='tbtn';button.textContent=deal.title || 'Без названия';results.append(button);
              button.onclick=async()=>{try{await api('/files/'+encodeURIComponent(b.dataset.link)+'/link',{method:'POST',body:JSON.stringify({dealId:deal.id || deal.bitrixKey})});await files(container,dealId,canDelete);}catch(e){results.textContent=e.message;}};
            }
            if(!results.children.length)results.textContent='Сделки не найдены';
          }catch(e){results.textContent=e.message;}
        };
      });
    }catch(e){container.textContent=e.message;}
  }
  async function settings() {
    const dialog=document.createElement('dialog');dialog.style.cssText='max-width:720px;width:90%;background:var(--bg2,#fff);color:var(--t1,#111);padding:20px;border:1px solid var(--b1,#ccc);border-radius:12px';
    dialog.innerHTML='<h3>Zoom</h3><div data-status>Проверяем подключение…</div><div data-archive></div><button class="tbtn" data-close>Закрыть</button>';
    document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
    const box=dialog.querySelector('[data-status]');
    try {
      const s=await api('/status');
      box.innerHTML=`<p>${s.connected?'Аккаунт подключён.':'Аккаунт ещё не подключён.'}</p>${s.admin?`<button class="tbtn" data-connect ${s.configured?'':'disabled'}>${s.connected?'Переподключить':'Подключить Zoom'}</button>`:''}${!s.configured?'<p>Ожидается настройка ключей приложения администратором.</p>':''}
        <p>После проверенного переноса: ${s.trashAfterCopy?'оригиналы перемещаются в корзину Zoom':'очистка Zoom ещё не включена'}.</p>
        <p>«Аванс» и «Первый этап»: хранение без срока. «Центральный файл»: ${s.retentionEnabled?'видео удаляются через 28 дней после перехода, текст остаётся':'автоудаление пока не включено'}.</p>`;
      const connect=box.querySelector('[data-connect]');if(connect)connect.onclick=async()=>{connect.disabled=true;try{const r=await api('/connect',{method:'POST'});location.assign(r.url);}catch(e){box.textContent=e.message;}};
      if(s.admin){const archive=dialog.querySelector('[data-archive]');archive.innerHTML='<h4>Записи без привязки к сделке</h4><div data-files></div>';await files(archive.querySelector('[data-files]'),null,true);}
    }catch(e){box.textContent=e.message;}
  }
  return {event,created,files,settings};
}
