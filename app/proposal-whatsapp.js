const BASE = 'https://pllato-elc-worker.uurraa.workers.dev';
const CAPTION = 'В продолжение встречи, высылаем вам подготовленное КП.';
const CAPTION_DEMO = 'Спасибо, предоплату получили!\n\nЗнакомьтесь — Ернар, глава нашей разработки.\n\nЕрнар, начинаем поднимать базу для нашего нового клиента. Во вложении — демо системы одним файлом, от него стартуем.';
const LEAD_DEV = {name: 'Ернар', acc: 'Ернара', phone: '77478379659', label: '+7 747 837 96 59'};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function initProposalWhatsApp({getToken, getDeals}) {
  const sent = new Map();
  async function request(path, options = {}) {
    const token = getToken();
    if (!token) throw Error('Войдите в App для отправки КП.');
    const response = await fetch(BASE + path, {...options, headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'}, cache: 'no-store'});
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Ошибка WhatsApp: ' + response.status);
    return data;
  }
  function mount() {
    for (const card of document.querySelectorAll('.tool-card[data-app-id]')) {
      for (const link of card.querySelectorAll('a[href]')) {
        const url = new URL(link.href);
        if (link.dataset.proposalMounted || url.origin !== 'https://pllato.kz') continue;
        const demo = /-standalone\.html$/i.test(url.pathname);
        if (!demo && !/\.pdf$/i.test(url.pathname)) continue;
        if (!demo && !/(?:\bkp\b|[_/-]kp[_/.-]|КП|Коммерческое предложение)/i.test(decodeURIComponent(url.pathname) + ' ' + link.textContent)) continue;
        link.dataset.proposalMounted = '1';
        const button = document.createElement('button');
        button.type = 'button'; button.dataset.proposalWa = ''; button.className = 'proposal-wa-button';
        button.textContent = 'Отправить в WhatsApp';
        button.onclick = () => open(card, url, demo);
        link.after(button);
      }
    }
  }
  function open(card, url, demo) {
    if (document.querySelector('.proposal-wa-dialog')) return;
    const deals = [...new Map(getDeals(card).filter(d => d.id).map(d => [d.id, d])).values()];
    const dialog = document.createElement('dialog');
    dialog.className = 'proposal-wa-dialog';
    const fileName = decodeURIComponent(url.pathname.split('/').pop());
    dialog.innerHTML = `<form><header><h3>${demo ? 'Старт работ · демо в группу клиента' : 'Отправить КП в WhatsApp'}</h3><button type="button" data-close aria-label="Закрыть">×</button></header><p class="proposal-wa-project">${esc(card.querySelector('h3')?.textContent || '')}</p><a class="proposal-wa-file" href="${esc(url.href)}" target="_blank" rel="noopener">${esc(fileName)} ↗</a><label>Сделка CRM<select name="deal"><option value="">Выберите сделку</option>${deals.map(d => `<option value="${esc(d.id)}">${esc(d.title || d.id)}</option>`).join('')}</select></label><label>Группа клиента · рабочий канал<select name="recipient" disabled><option value="">Загрузка…</option></select></label><button type="button" data-refresh>Обновить группы</button>${demo ? `<label class="proposal-wa-check"><input type="checkbox" name="addDev" checked> Добавить ${LEAD_DEV.acc} (${LEAD_DEV.label}) в группу администратором</label>` : ''}<label>Подпись<textarea name="caption" rows="${demo ? 6 : 3}">${demo ? CAPTION_DEMO : CAPTION}</textarea></label><p role="status" aria-live="polite"></p><footer><button type="button" data-close>Отмена</button><button type="submit" data-send disabled>${demo ? 'Отправить файл' : 'Отправить PDF'}</button></footer></form>`;
    document.body.append(dialog);
    const form = dialog.querySelector('form'), deal = form.elements.deal, recipient = form.elements.recipient;
    const send = dialog.querySelector('[data-send]'), status = dialog.querySelector('[role=status]'), refresh = dialog.querySelector('[data-refresh]');
    let chats = [], sending = false, generation = 0;
    const key = () => url.href + '|' + recipient.value;
    function update() {
      const receipt = sent.get(key());
      send.disabled = sending || !chats.some(c => c.id === recipient.value) || !!receipt;
      send.textContent = receipt ? 'Отправлено ✓' : (demo ? 'Отправить файл' : 'Отправить PDF');
      status.textContent = receipt ? 'Отправлено в эту группу · ' + receipt : '';
    }
    async function load(force = false) {
      const current = ++generation;
      chats = []; recipient.innerHTML = '<option value="">Выберите группу</option>'; recipient.disabled = true; send.disabled = true;
      refresh.disabled = true; status.textContent = deal.value ? 'Загружаем группы…' : 'Сначала привяжите демо к CRM-сделке через «Транскрибации → демо».';
      if (!deal.value) return;
      try {
        const [groups, channels] = await Promise.all([
          request('/api/wa/stage-groups/deals/' + encodeURIComponent(deal.value) + (force ? '?refreshGroups=1' : '')),
          request('/api/wa/channels/public')
        ]);
        if (current !== generation || !dialog.isConnected) return;
        const names = new Map((channels.items || []).map(c => [String(c.idInstance), c.displayName]));
        chats = (groups.chats || []).filter(c => c.id?.startsWith('wa:') && c.chat_id?.endsWith('@g.us') && names.has(String(c.instance_id)));
        recipient.innerHTML = '<option value="">Выберите группу</option>' + chats.map(c => `<option value="${esc(c.id)}">${esc(c.name || 'Группа клиента')} · ${esc(names.get(String(c.instance_id)))}</option>`).join('');
        recipient.disabled = !chats.length;
        if (chats.length === 1) recipient.value = chats[0].id;
        update();
        if (!chats.length) status.textContent = 'Рабочая группа не найдена. Проверьте группу в CRM и нажмите «Обновить группы».';
      } catch (error) { if (current === generation) status.textContent = error.message; }
      finally { if (current === generation) refresh.disabled = false; }
    }
    deal.onchange = () => load(); recipient.onchange = update; refresh.onclick = () => load(true);
    for (const button of dialog.querySelectorAll('[data-close]')) button.onclick = () => {if (!sending) dialog.close();};
    dialog.oncancel = event => {if (sending) event.preventDefault();};
    dialog.onclose = () => {generation++; dialog.remove();};
    form.onsubmit = async event => {
      event.preventDefault();
      const chat = chats.find(c => c.id === recipient.value);
      if (sending || !chat || sent.has(key())) return;
      sending = true; const receiptKey = key();
      for (const control of form.querySelectorAll('button,select,textarea')) control.disabled = true;
      let devNote = '';
      if (demo && form.elements.addDev?.checked) {
        status.textContent = 'Добавляем ' + LEAD_DEV.acc + ' в группу…';
        try {
          const r = await request('/api/wa/group/add-admin', {method: 'POST', body: JSON.stringify({chatId: chat.id, instanceId: String(chat.instance_id), phone: LEAD_DEV.phone})});
          devNote = r.admin ? LEAD_DEV.name + ' добавлен администратором. ' : r.added ? LEAD_DEV.name + ' добавлен в группу (админа назначьте вручную). ' : LEAD_DEV.name + ' уже в группе. ';
        } catch (error) {
          devNote = 'Не удалось добавить ' + LEAD_DEV.acc + ' (' + error.message + ') — добавьте вручную. ';
        }
      }
      status.textContent = demo ? devNote + 'Отправляем файл демо…' : 'Отправляем PDF…';
      try {
        const result = await request('/api/wa/send', {method: 'POST', body: JSON.stringify({chatId: chat.id, instanceId: String(chat.instance_id), mediaUrl: url.href, fileName, text: form.elements.caption.value.trim()})});
        if (!result.ok || !result.idMessage) throw Error('Сервис не подтвердил отправку. Проверьте переписку перед повтором.');
        sent.set(receiptKey, new Date().toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit',timeZone:'Asia/Almaty'}));
        status.textContent = (devNote || '') + 'Отправлено в «' + (chat.name || 'Группа клиента') + '» ✓'; send.textContent = 'Отправлено ✓';
      } catch (error) {
        status.textContent = error.message + ' Перед повторной отправкой проверьте переписку в CRM.';
      } finally {
        sending = false;
        for (const control of form.querySelectorAll('button,select,textarea')) control.disabled = false;
        send.disabled = sent.has(receiptKey);
      }
    };
    dialog.showModal();
    if (deals.length === 1) deal.value = deals[0].id;
    load();
  }
  const style = document.createElement('style');
  style.textContent = `.proposal-wa-button{font:600 12px/1.3 system-ui;color:#167246;background:#f2faf5;border:1px solid #cce4d5;border-radius:7px;padding:7px 10px;cursor:pointer;margin:3px 0 7px}.proposal-wa-dialog{box-sizing:border-box;width:min(480px,calc(100vw - 24px));max-height:90dvh;overflow:auto;border:1px solid #e8e3d9;border-radius:14px;padding:20px;background:#fff;color:#171e29;font:14px/1.5 system-ui}.proposal-wa-dialog::backdrop{background:#17202b70}.proposal-wa-dialog header,.proposal-wa-dialog footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.proposal-wa-dialog h3{font-size:18px;margin:0}.proposal-wa-project{font-size:13px;color:#6b7280;margin:10px 0;overflow-wrap:anywhere}.proposal-wa-file{font-size:13px;color:#906b42;overflow-wrap:anywhere}.proposal-wa-dialog label{display:block;font-size:12px;font-weight:600;margin-top:14px}.proposal-wa-dialog select,.proposal-wa-dialog textarea{box-sizing:border-box;width:100%;min-width:0;display:block;margin-top:5px;padding:9px;border:1px solid #ddd8cf;border-radius:7px;background:white;color:inherit;font:14px/1.4 system-ui}.proposal-wa-dialog textarea{resize:vertical}.proposal-wa-dialog button{font:600 13px system-ui;padding:8px 12px;border:1px solid #e8e3d9;border-radius:7px;background:white;color:#6d543b;cursor:pointer}.proposal-wa-dialog [data-refresh]{font-size:12px;margin-top:6px}.proposal-wa-dialog [data-send]{background:#16834a;color:white;border-color:#16834a}.proposal-wa-dialog :disabled{opacity:.5;cursor:default}.proposal-wa-dialog label.proposal-wa-check{display:flex;gap:8px;align-items:center;font-weight:600;font-size:13px;margin-top:14px;cursor:pointer}.proposal-wa-dialog label.proposal-wa-check input{width:auto;margin:0}.proposal-wa-dialog [role=status]{font-size:12px;overflow-wrap:anywhere;min-height:18px;margin:12px 0}`;
  document.head.append(style);
  new MutationObserver(mount).observe(document.body, {childList:true, subtree:true});
  mount();
}
