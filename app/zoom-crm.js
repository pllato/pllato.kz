export function transcriptText(raw) {
  if(!/^\uFEFF?WEBVTT\b/.test(raw))return raw;
  return raw.replace(/^\uFEFF/,'').split(/\r?\n\s*\r?\n/).flatMap(block=>{
    const lines=block.split(/\r?\n/);const cue=lines.findIndex(line=>line.includes('-->'));
    if(cue<0)return [];
    return [lines.slice(cue+1).join('\n').replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')];
  }).join('\n\n');
}
export function zoomInvitation(meeting) {
  const start=new Date(meeting.start_time);
  const time=meeting.start_time && !isNaN(start) ? new Intl.DateTimeFormat('ru-RU',{timeZone:'Asia/Almaty',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(start) : '';
  return ['Pllato приглашает вас на встречу в Zoom.',meeting.topic ? 'Тема: '+meeting.topic : '',time ? 'Дата и время: '+time+' (Алматы, UTC+5)' : '', 'Подключиться к встрече:',meeting.join_url].filter(Boolean).join('\n');
}
// UI Zoom: все материалы открываются через авторизованный API CRM.
export function zoomClient({ base, getToken }) {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(path, options = {}) {
    const r = await fetch(base + '/api/zoom' + path, { ...options, headers: { 'Content-Type':'application/json', Authorization:'Bearer '+await getToken(), ...options.headers } });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Ошибка Zoom');
    return data;
  }
  let badgeBusy=false,badgeChecked=0,badgeSignature='';
  async function refreshBadges() {
    if(document.hidden || badgeBusy)return;
    const nodes=[...document.querySelectorAll('[data-zoom-deal]')];
    if(!nodes.length)return;
    const ids=[...new Set(nodes.map(n=>n.dataset.zoomDeal).filter(Boolean))];
    const signature=ids.join(',');
    if(signature===badgeSignature && Date.now()-badgeChecked<45000 && nodes.every(n=>n.dataset.zoomChecked))return;
    badgeBusy=true;
    try {
      const statuses=new Map();
      for(let i=0;i<ids.length;i+=100){const data=await api('/deal-status',{method:'POST',body:JSON.stringify({ids:ids.slice(i,i+100)})});for(const row of data.deals)statuses.set(row.deal_id,row);}
      for(const node of nodes){const row=statuses.get(node.dataset.zoomDeal);node.dataset.zoomChecked='1';
        node.style.display=row?'block':'none';
        node.textContent=row ? 'Zoom: '+[row.videos?'запись готова':'',row.transcripts?'транскрипт готов':'',!row.videos&&!row.transcripts?'материалы готовы':''].filter(Boolean).join(' · ') : '';
      }
      badgeSignature=signature;badgeChecked=Date.now();
    }catch{}finally{badgeBusy=false;}
  }
  setInterval(refreshBadges,10000);
  async function event(container, taskId, path = '/tasks/'+encodeURIComponent(taskId)) {
    if (!container) return;
    container.textContent = 'Проверяем ссылку Zoom…';
    try {
      const {meeting} = await api(path);
      if (!container.isConnected) return;
      if (meeting?.join_url && /^https:\/\/([a-z0-9-]+\.)?zoom\.(us|com)\//i.test(meeting.join_url)) {
        container.innerHTML = `<a class="tbtn tbtn-a" href="${esc(meeting.join_url)}" target="_blank" rel="noopener noreferrer">Открыть Zoom</a>
          <button type="button" class="tbtn" data-invite>Копировать приглашение</button>
          <button type="button" class="tbtn" data-copy>Копировать ссылку</button>
          <button type="button" class="tbtn" data-host>Код организатора для сотрудника</button><div data-host-status role="status"></div>
          <div style="font-size:12px;overflow-wrap:anywhere;margin-top:8px">${esc(meeting.join_url)}</div>`;
        const invitation=zoomInvitation(meeting);
        const preview=document.createElement('div');preview.style.cssText='white-space:pre-wrap;font-size:12px;margin-top:8px';preview.textContent=invitation;container.append(preview);
        container.querySelector('[data-invite]').onclick=async e=>{try{await navigator.clipboard.writeText(invitation);e.target.textContent='Приглашение скопировано';}catch{e.target.textContent='Скопируйте приглашение ниже';}};
        container.querySelector('[data-copy]').onclick = async e => { try { await navigator.clipboard.writeText(meeting.join_url); e.target.textContent='Скопировано'; } catch { e.target.textContent='Скопируйте ссылку ниже'; } };
        container.querySelector('[data-host]').onclick=async e=>{
          const b=e.currentTarget,box=container.querySelector('[data-host-status]');b.disabled=true;
          try {
            const {hostKey}=await api('/meetings/'+encodeURIComponent(meeting.meeting_id)+'/host-access',{method:'POST'});
            box.textContent='Код организатора: '+hostKey+'. В Zoom: Участники → Принять права организатора → введите код. Не отправляйте его клиентам.';
            const copy=document.createElement('button');copy.type='button';copy.className='tbtn';copy.textContent='Копировать код';
            copy.onclick=async()=>{try{await navigator.clipboard.writeText(hostKey);copy.textContent='Код скопирован';}catch{copy.textContent='Скопируйте код вручную';}};box.append(copy);
          }catch(error){box.textContent=error.message;}finally{b.disabled=false;}
        };
      } else {
        container.innerHTML = `<div>${esc(meeting?.error || 'Ссылка Zoom ещё не создана.')}</div><button type="button" class="tbtn" data-create>Создать ссылку Zoom</button>`;
        container.querySelector('[data-create]').onclick = async e => {
          e.target.disabled=true;
          try { await api(path,{method:'POST'}); await event(container,taskId,path); }
          catch(error) { container.textContent=error.message; }
        };
      }
    } catch(e) { container.textContent=e.message; }
  }
  async function dealMeetings(container,dealId) {
    if(!container)return;
    try {const data=await api('/deals/'+encodeURIComponent(dealId)+'/meetings');
      for(const m of data.meetings){const row=document.createElement('div');row.style.cssText='padding:12px 0;border-bottom:1px solid var(--b1)';container.append(row);await event(row,m.task_id);}
    }catch(e){container.textContent=e.message;}
  }
  async function syncFirst(dealId){await api('/deals/'+encodeURIComponent(dealId)+'/first-meeting',{method:'POST'});}
  async function firstMeeting(container, dealId, date, sync = false) {
    if (!container) return;
    if (!date) { container.textContent='Укажите дату — ссылка Zoom появится здесь.'; return; }
    const path='/deals/'+encodeURIComponent(dealId)+'/first-meeting';
    if (sync) {
      container.textContent='Создаём ссылку Zoom…';
      try { await api(path,{method:'POST'}); }
      catch(e) { container.textContent=e.message; return; }
    }
    await event(container,null,path);
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
        ${f.status==='stored'?`<button class="tbtn" data-open="${esc(f.id)}">${f.extension==='MP4'?'Смотреть видео':f.extension==='M4A'?'Слушать аудио':/VTT|TXT/.test(f.extension)?'Транскрипт / текст':'Открыть файл'}</button>${/^(VTT|TXT)$/.test(f.extension)?` <button type="button" class="tbtn" data-copy-text="${esc(f.id)}">Копировать текст</button>`:''}${canDelete?` <button class="tbtn" data-del="${esc(f.id)}">Удалить файл</button>`:''}`:`<span>${f.status==='deleted'?'Файл удалён':'Ожидает переноса'}</span>`}
        ${!dealId?`<button class="tbtn" data-link="${esc(f.id)}">Прикрепить к сделке</button>`:''}
        ${f.error?`<div style="color:var(--rd)">${esc(f.error)}</div>`:''}<div data-player="${esc(f.id)}"></div></div>`).join(''):'Материалов Zoom пока нет.';
      // Show playable previews immediately, without opening a separate window.
      const mediaFiles=rows.filter(f=>f.status==='stored' && /^(MP4|M4A|MP3|WAV)$/i.test(f.extension || ''));
      if(mediaFiles.length){
        const token=await getToken();
        if(!container.isConnected)return;
        for(const f of mediaFiles){
          const box=[...container.querySelectorAll('[data-player]')].find(x=>x.dataset.player===f.id);
          const video=String(f.extension).toUpperCase()==='MP4';
          const player=document.createElement(video?'video':'audio');
          player.controls=true;player.preload='metadata';player.setAttribute('playsinline','');
          player.setAttribute('aria-label',video?'Видеозапись Zoom':'Аудиозапись Zoom');
          player.style.cssText=video?'display:block;width:100%;max-width:720px;aspect-ratio:16/9;object-fit:contain;background:#111;border-radius:8px;margin:12px 0':'display:block;width:100%;max-width:720px;margin:12px 0';
          const status=document.createElement('div');status.setAttribute('role','status');
          player.onerror=()=>{status.textContent='Не удалось загрузить превью. Откройте запись кнопкой выше.';};
          if(video)player.addEventListener('loadedmetadata',()=>{if(player.duration>0)player.currentTime=Math.min(0.1,player.duration/2);},{once:true});
          player.addEventListener('click',e=>e.stopPropagation());
          player.src=base+'/api/zoom/files/'+encodeURIComponent(f.id)+'?auth='+encodeURIComponent(token);
          box.replaceChildren(player,status);
        }
      }
      async function preview(f, copyOnly=false) {
        const ext=String(f.extension || '').toUpperCase();
        const dialog=document.createElement('dialog');
        dialog.style.cssText='width:min(900px,92vw);max-height:90vh;overflow:auto;padding:20px;background:var(--bg2,#fff);color:var(--t1,#111);border:1px solid var(--b1,#ccc);border-radius:12px';
        dialog.innerHTML='<h3></h3><div data-content>Загрузка…</div><p data-status role="status"></p><button type="button" class="tbtn" data-close>Закрыть</button>';
        dialog.querySelector('h3').textContent=f.topic || 'Встреча Zoom';
        const box=dialog.querySelector('[data-content]'),status=dialog.querySelector('[data-status]');
        document.body.append(dialog);dialog.showModal();
        dialog.querySelector('[data-close]').onclick=()=>dialog.close();
        dialog.onclose=()=>{const media=dialog.querySelector('video,audio');if(media){media.pause();media.removeAttribute('src');media.load();}dialog.remove();};
        try {
          const token=await getToken(),path=base+'/api/zoom/files/'+encodeURIComponent(f.id);
          if(!dialog.open)return;
          const tag=ext==='MP4'?'video':/^(M4A|MP3|WAV)$/.test(ext)?'audio':null;
          if(tag){
            const player=document.createElement(tag);player.controls=true;player.preload='metadata';player.setAttribute('playsinline','');
            player.style.cssText='display:block;width:100%;max-height:65vh;margin:12px 0';
            player.onerror=()=>{status.textContent='Не удалось воспроизвести запись. Закройте окно и откройте снова, чтобы обновить доступ.';};
            player.src=path+'?auth='+encodeURIComponent(token);box.replaceChildren(player);
          }else if(/^(VTT|TXT)$/.test(ext)) {
            const r=await fetch(path,{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw new Error('Не удалось прочитать транскрипт');
            const raw=await r.text();if(!dialog.open)return;
            const text=ext==='VTT'?transcriptText(raw):raw;
            const pre=document.createElement('pre');pre.style.cssText='max-height:55vh;overflow:auto;white-space:pre-wrap;user-select:text';pre.textContent=text;
            const copy=document.createElement('button');copy.type='button';copy.className='tbtn';copy.textContent='Копировать текст';
            copy.onclick=async()=>{try{await navigator.clipboard.writeText(text);status.textContent='Текст скопирован';}catch{status.textContent='Выделите текст ниже и скопируйте вручную.';const range=document.createRange();range.selectNodeContents(pre);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);}};
            box.replaceChildren(copy,pre);if(copyOnly)await copy.onclick();
          }else{const a=document.createElement('a');a.href=path+'?auth='+encodeURIComponent(token);a.textContent='Скачать файл';a.target='_blank';a.rel='noopener noreferrer';box.replaceChildren(a);}
        }catch(e){box.textContent=e.message;}
      }
      container.querySelectorAll('[data-open]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();preview(rows.find(x=>x.id===b.dataset.open));});
      container.querySelectorAll('[data-copy-text]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();preview(rows.find(x=>x.id===b.dataset.copyText),true);});
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
        <p>Видео, транскрипты и другие материалы хранятся в архиве CRM бессрочно, независимо от этапа сделки. Удаление — только вручную из карточки.</p>`;
      const connect=box.querySelector('[data-connect]');if(connect)connect.onclick=async()=>{connect.disabled=true;try{const r=await api('/connect',{method:'POST'});location.assign(r.url);}catch(e){box.textContent=e.message;}};
      if(s.admin){
        const audit=document.createElement('div');audit.innerHTML='<h4>Проверка переноса</h4><button class="tbtn" data-audit>Проверить все встречи</button> <button class="tbtn" data-retry>Повторить незавершённый перенос</button><div data-result role="status"></div>';box.append(audit);
        const check=async retry=>{const result=audit.querySelector('[data-result]');result.textContent='Проверяем…';for(const b of audit.querySelectorAll('button'))b.disabled=true;
          try{const data=await api('/transfer-audit',{method:retry?'POST':'GET'});result.innerHTML=(retry?'<p>Очередь обновлена. Транскрипты переносятся первыми; недоступные файлы восстанавливаются из корзины.</p>':'')+`<p>Встреч, требующих проверки: ${data.meetings.length}</p>`+data.meetings.map(m=>`<div style="padding:8px 0;border-bottom:1px solid var(--b1)">${esc(m.topic)} · ${esc(m.meeting_id)}<br>${m.transcripts?'Транскрипт сохранён':'Транскрипт ещё не сохранён'} · ожидает файлов: ${m.pending}${m.error?'<br>'+esc(m.error):''}${m.deal_id?`<br><a href="/team.html#deal/${encodeURIComponent(m.deal_id.replace(/^deal_/,''))}">Карточка сделки</a>`:''}</div>`).join('');}catch(e){result.textContent=e.message;}finally{for(const b of audit.querySelectorAll('button'))b.disabled=false;}};
        audit.querySelector('[data-audit]').onclick=()=>check(false);audit.querySelector('[data-retry]').onclick=()=>check(true);
        const host=document.createElement('div');host.innerHTML='<h4>Код организатора для сотрудников</h4><p>Скопируйте действующий шестизначный код из профиля Zoom. Здесь сохраняется существующий код, а не создаётся новый. Он будет доступен сотрудникам с правом изменения сделки или встречи.</p><input type="password" inputmode="numeric" maxlength="6" autocomplete="off" aria-label="Код организатора Zoom"><button type="button" class="tbtn" data-save-host>Сохранить код</button><p data-host-result role="status"></p>';
        box.append(host);host.querySelector('[data-save-host]').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{await api('/host-key',{method:'POST',body:JSON.stringify({hostKey:host.querySelector('input').value.trim()})});host.querySelector('input').value='';host.querySelector('[data-host-result]').textContent='Код сохранён в зашифрованном виде.';}catch(error){host.querySelector('[data-host-result]').textContent=error.message;}finally{b.disabled=false;}};
      }
      if(s.admin){const archive=dialog.querySelector('[data-archive]');archive.innerHTML='<h4>Записи без привязки к сделке</h4><div data-files></div>';await files(archive.querySelector('[data-files]'),null,true);}
    }catch(e){box.textContent=e.message;}
  }
  return {event,firstMeeting,syncFirst,dealMeetings,created,files,settings};
}
