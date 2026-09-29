const LABELS = {
  queued: ['В очереди', 'queued'], building: ['Создаётся', 'building'], ready: ['Готово', 'ready'],
  error: ['Ошибка', 'error'], missing: ['Не создано', 'missing'],
};

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function addStyles() {
  if (document.getElementById('deal-production-styles')) return;
  const style = document.createElement('style');
  style.id = 'deal-production-styles';
  style.textContent = `
    .dp-wrap{background:var(--bg3);border:1px solid var(--b1);border-radius:10px;padding:14px}
    .dp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
    .dp-head b{font-size:14px;color:var(--t1)}.dp-head p{margin:3px 0 0;color:var(--t3);font-size:11px}
    .dp-gates{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-bottom:12px}
    .dp-gate{background:var(--bg2);border:1px solid var(--b1);border-radius:8px;padding:8px 9px;font-size:11px;color:var(--t2)}
    .dp-gate strong{display:block;color:var(--t1);margin-bottom:2px}.dp-gate.ok{border-color:#22c55e55}.dp-gate.miss{border-color:#f59e0b66}
    .dp-list{display:flex;flex-direction:column;gap:7px}.dp-item{display:flex;align-items:center;gap:9px;background:var(--bg2);border:1px solid var(--b1);border-radius:8px;padding:9px 10px}
    .dp-icon{width:30px;height:30px;border-radius:8px;background:var(--bg3);display:grid;place-items:center;flex:none}.dp-copy{min-width:0;flex:1}
    .dp-copy b,.dp-copy small{display:block}.dp-copy b{font-size:12px;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dp-copy small{font-size:10px;color:var(--t3);margin-top:2px}
    .dp-status{font-size:10px;font-weight:700;padding:4px 7px;border-radius:99px}.dp-status.ready{background:#dcfce7;color:#15803d}.dp-status.queued{background:#e0e7ff;color:#4338ca}.dp-status.building{background:#dbeafe;color:#1d4ed8}.dp-status.error{background:#fee2e2;color:#b91c1c}.dp-status.missing{background:var(--bg3);color:var(--t3)}
    .dp-open{border:1px solid var(--b1);background:var(--bg2);color:var(--ac2);border-radius:7px;padding:6px 9px;cursor:pointer;font-size:11px;font-weight:600}.dp-open:hover{border-color:var(--ac2)}
    .dp-empty{font-size:11px;color:var(--t3);padding:8px 1px}.dp-error{font-size:10px;color:#dc2626;margin-top:3px}.dp-retry{border:0;background:#dc2626;color:#fff;border-radius:7px;padding:7px 10px;cursor:pointer;font-size:11px}
    .dp-transcript{margin:0 0 12px;padding:10px;background:var(--bg2);border:1px dashed var(--b1);border-radius:8px}.dp-transcript-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.dp-transcript-head span{font-size:11px;color:var(--t2)}.dp-transcript-actions{display:flex;gap:6px;flex-wrap:wrap}.dp-transcript-editor{display:none;margin-top:9px}.dp-transcript-editor.open{display:block}.dp-transcript-editor textarea{box-sizing:border-box;width:100%;min-height:150px;resize:vertical;border:1px solid var(--b1);border-radius:8px;padding:10px;background:var(--bg3);color:var(--t1);font:12px/1.5 inherit}.dp-transcript-status{min-height:16px;margin-top:6px;font-size:10px;color:var(--t3)}
    .kanban-docs{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:10px;padding-top:9px;border-top:1px solid var(--b1)}.kanban-doc{min-width:0;display:flex;align-items:center;gap:6px;border:1px solid var(--b1);border-radius:8px;padding:6px 7px;background:var(--bg3);color:var(--t3)}.kanban-doc-icon{font-size:14px;line-height:1}.kanban-doc-copy{min-width:0}.kanban-doc-copy b,.kanban-doc-copy small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kanban-doc-copy b{font-size:9px;line-height:1.2;text-transform:uppercase;letter-spacing:.02em}.kanban-doc-copy small{font-size:10px;line-height:1.3;margin-top:2px}.kanban-doc.ready{background:#ecfdf5;border-color:#86efac;color:#15803d}.kanban-doc.queued,.kanban-doc.building{background:#eff6ff;border-color:#93c5fd;color:#1d4ed8}.kanban-doc.error{background:#fef2f2;border-color:#fca5a5;color:#b91c1c}.kanban-doc.missing{background:var(--bg3);border-color:var(--b1);color:var(--t3)}
    @media(max-width:720px){.dp-gates{grid-template-columns:1fr}.dp-item{align-items:flex-start;flex-wrap:wrap}.dp-status{margin-left:auto}}
  `;
  document.head.appendChild(style);
}

function statusBadge(status) {
  const [label, css] = LABELS[status] || LABELS.missing;
  return `<span class="dp-status ${css}">${status === 'building' ? '● ' : status === 'ready' ? '✓ ' : ''}${label}</span>`;
}

function icon(kind) { return kind === 'demo' ? '✨' : kind === 'kp' ? '📘' : '🧾'; }

function formatDateTime(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function openPrivateFile(item, base, getToken) {
  const popup = window.open('', '_blank');
  if (popup) popup.document.write('<title>Открываем документ…</title><p style="font-family:sans-serif;padding:24px">Открываем документ…</p>');
  try {
    const token = await getToken();
    const response = await fetch(base + item.url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `HTTP ${response.status}`);
    const blobUrl = URL.createObjectURL(await response.blob());
    if (popup) popup.location.href = blobUrl;
    else {
      const a = document.createElement('a'); a.href = blobUrl; a.target = '_blank'; a.click();
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
  } catch (error) {
    if (popup) popup.close();
    throw error;
  }
}

export function renderDealProductionBadges(customFields = {}) {
  addStyles();
  const p = customFields?._production;
  if (!p || typeof p !== 'object') return '';
  const normalize = value => ['ready', 'queued', 'building', 'error'].includes(value) ? value : 'missing';
  const words = { ready: 'готово', queued: 'в очереди', building: 'создаётся', error: 'ошибка', missing: 'не создано' };
  const tile = (icon, label, status, detail = '') => {
    const state = normalize(status);
    return `<div class="kanban-doc ${state}" title="${esc(label)}: ${esc(detail || words[state])}"><span class="kanban-doc-icon">${icon}</span><span class="kanban-doc-copy"><b>${esc(label)}</b><small>${state === 'ready' ? '✓ ' : state === 'error' ? '! ' : state === 'queued' || state === 'building' ? '● ' : '○ '}${esc(detail || words[state])}</small></span></div>`;
  };
  const total = Number(p.invoicesTotal || 0), ready = Number(p.invoicesReady || 0);
  const invoiceStatus = p.invoiceStatus || (!total ? 'missing' : ready === total ? 'ready' : p.hasErrors ? 'error' : 'building');
  return `<div class="kanban-docs" aria-label="Готовность материалов сделки">${[
    tile('📝', 'Транскрипция', p.transcript, p.transcript === 'ready' ? 'готова' : ''),
    tile('✨', 'Демо', p.demo),
    tile('📘', 'КП', p.kp),
    tile('🧾', 'Счета', invoiceStatus, total ? `${ready}/${total} готово` : ''),
  ].join('')}</div>`;
}

export function mountDealProduction(root, { dealId, base, getToken, onChanged }) {
  if (!root) return () => {};
  addStyles();
  let stopped = false, timer = null, polls = 0, transcriptFeedback = '', productionSignature = null, savingTranscript = false;
  const request = async (path = '', options = {}) => {
    const token = await getToken();
    const response = await fetch(`${base}/api/deals/${encodeURIComponent(dealId)}/production${path}`, {
      ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  };
  const uploadTranscript = async file => {
    if (!file?.size) throw new Error('Добавьте текст транскрипции или выберите файл');
    if (file.size > 5 * 1024 * 1024) throw new Error('Размер TXT/VTT не должен превышать 5 МБ');
    const token = await getToken();
    const response = await fetch(`${base}/api/deals/${encodeURIComponent(dealId)}/qualification/recording?kind=transcript`, {
      method: 'POST', body: file,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type || 'text/plain; charset=utf-8', 'X-File-Name': encodeURIComponent(file.name || 'manual-transcript.txt') },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  };
  const draw = data => {
    const items = data.items || [], active = items.some(x => x.status === 'queued' || x.status === 'building');
    const nextSignature = JSON.stringify({
      transcript: { ready: data.transcript?.ready, source: data.transcript?.source, createdAt: data.transcript?.createdAt },
      summary: data.summary,
    });
    const productionChanged = productionSignature !== null && productionSignature !== nextSignature;
    productionSignature = nextSignature;
    const transcriptReady = Boolean(data.transcript?.ready);
    const transcriptWhen = formatDateTime(data.transcript?.createdAt);
    const transcriptSource = data.transcript?.source === 'manual' ? 'Вручную' : 'Zoom';
    const transcriptDetail = transcriptReady
      ? `${transcriptSource} · ${data.transcript.name || 'готова'}${transcriptWhen ? ` · ${transcriptWhen}` : ''}`
      : 'Нужен VTT/TXT';
    const gates = [
      ['Транскрипция', transcriptReady, transcriptDetail],
      ['Реквизиты', data.requisites?.ready, data.requisites?.ready ? (data.requisites.files ? `Файлов: ${data.requisites.files}` : 'Заполнены') : 'Нужны для счетов'],
      ['График оплат', data.commercial?.ready, data.commercial?.ready ? `${data.commercial.paymentCount} платежей` : 'Появится из КП'],
    ];
    root.innerHTML = `<div class="dp-wrap"><div class="dp-head"><div><b>Комплект сделки</b><p>Демо, КП и все счета создаются и хранятся здесь</p></div>${data.summary?.hasErrors ? '<button class="dp-retry">Повторить</button>' : ''}</div>
      <div class="dp-gates">${gates.map(g => `<div class="dp-gate ${g[1] ? 'ok' : 'miss'}"><strong>${g[1] ? '✓' : '○'} ${esc(g[0])}</strong>${esc(g[2])}</div>`).join('')}</div>
      <div class="dp-transcript"><div class="dp-transcript-head"><span>${transcriptReady ? `Активная версия: <b>${esc(transcriptSource)}</b>${transcriptWhen ? ` · ${esc(transcriptWhen)}` : ''}. Можно загрузить замену.` : 'Транскрибацию можно добавить на любом этапе, в том числе после встречи вне CRM.'}</span><div class="dp-transcript-actions"><button class="dp-open" data-transcript-paste>${transcriptReady ? 'Заменить текстом' : 'Вставить текст'}</button><button class="dp-open" data-transcript-file>Загрузить TXT/VTT</button><input data-transcript-input type="file" accept=".txt,.vtt,text/plain,text/vtt" hidden></div></div><div class="dp-transcript-editor${transcriptReady ? '' : ' open'}"><textarea data-transcript-text maxlength="500000" placeholder="Вставьте сюда полный текст встречи. Желательно сохранить реплики, стоимость, сроки и условия оплаты."></textarea><div style="margin-top:7px"><button class="dp-open" data-transcript-save>Сохранить транскрипцию</button></div></div><div class="dp-transcript-status" role="status">${esc(transcriptFeedback)}</div></div>
      <div class="dp-list">${items.length ? items.map(item => `<div class="dp-item"><span class="dp-icon">${icon(item.kind)}</span><span class="dp-copy"><b>${esc(item.title)}</b><small>${item.amount != null ? new Intl.NumberFormat('ru-RU').format(item.amount) + ' ' + esc(item.currency || '') : esc(item.fileName || (item.kind === 'demo' ? 'Интерактивная ссылка' : 'PDF'))}</small>${item.error ? `<span class="dp-error">${esc(item.error)}</span>` : ''}</span>${statusBadge(item.status)}${item.status === 'ready' ? `<button class="dp-open" data-artifact="${esc(item.id)}">Открыть</button>` : ''}</div>`).join('') : '<div class="dp-empty">Документы ещё не запускались. Они появятся после перевода сделки на соответствующую стадию.</div>'}</div></div>`;
    const transcriptEditor = root.querySelector('.dp-transcript-editor');
    const transcriptText = root.querySelector('[data-transcript-text]');
    const transcriptInput = root.querySelector('[data-transcript-input]');
    const transcriptStatus = root.querySelector('.dp-transcript-status');
    root.querySelector('[data-transcript-paste]').onclick = () => {
      transcriptEditor.classList.toggle('open');
      if (transcriptEditor.classList.contains('open')) transcriptText.focus();
    };
    root.querySelector('[data-transcript-file]').onclick = () => transcriptInput.click();
    const saveTranscript = async file => {
      if (savingTranscript) return;
      savingTranscript = true;
      const buttons = root.querySelectorAll('[data-transcript-save],[data-transcript-file],[data-transcript-paste]');
      buttons.forEach(button => { button.disabled = true; });
      transcriptText.disabled = true;
      transcriptStatus.textContent = 'Сохраняем транскрипцию…';
      try {
        const uploaded = await uploadTranscript(file);
        transcriptFeedback = `✓ Загружено вручную: ${uploaded.recording?.name || file.name} · используется эта версия`;
        transcriptStatus.textContent = transcriptFeedback;
        polls = 0;
        transcriptText.value = '';
        transcriptText.blur();
        savingTranscript = false;
        await load();
      } catch (error) {
        transcriptStatus.textContent = error.message;
        buttons.forEach(button => { button.disabled = false; });
      } finally {
        savingTranscript = false;
        transcriptText.disabled = false;
      }
    };
    root.querySelector('[data-transcript-save]').onclick = () => {
      const value = transcriptText.value.trim();
      saveTranscript(new File([value], `manual-transcript-${new Date().toISOString().slice(0, 10)}.txt`, { type: 'text/plain; charset=utf-8' }));
    };
    transcriptInput.onchange = () => {
      const file = transcriptInput.files?.[0];
      if (!file) return;
      if (!/\.(?:txt|vtt)$/i.test(file.name)) { transcriptStatus.textContent = 'Выберите файл TXT или VTT'; transcriptInput.value = ''; return; }
      saveTranscript(file);
    };
    root.querySelectorAll('[data-artifact]').forEach(button => {
      button.onclick = async () => {
        const item = items.find(x => x.id === button.dataset.artifact);
        if (!item) return;
        button.disabled = true;
        try {
          if (item.kind === 'demo') window.open(item.url, '_blank', 'noopener');
          else await openPrivateFile(item, base, getToken);
        } catch (error) { alert('Не удалось открыть документ: ' + error.message); }
        finally { button.disabled = false; }
      };
    });
    const retry = root.querySelector('.dp-retry');
    if (retry) retry.onclick = async () => {
      retry.disabled = true;
      try { await request('/retry', { method: 'POST' }); await load(); if (onChanged) onChanged(); }
      catch (error) { alert('Не удалось перезапустить: ' + error.message); retry.disabled = false; }
    };
    clearTimeout(timer);
    // Новая Zoom-транскрипция может появиться уже после открытия карточки.
    // Обновляем блок и в спокойном состоянии, чтобы пользователь увидел её без перезагрузки.
    if (!stopped && polls++ < 120) timer = setTimeout(load, active ? 8000 : 20000);
    if (productionChanged && onChanged) Promise.resolve(onChanged()).catch(() => {});
  };
  const editingTranscript = () => savingTranscript || Boolean(root.querySelector('[data-transcript-text]')?.value) || document.activeElement === root.querySelector('[data-transcript-text]');
  const deferLoad = () => { clearTimeout(timer); if (!stopped) timer = setTimeout(load, 8000); };
  const load = async () => {
    if (stopped) return;
    if (editingTranscript()) { deferLoad(); return; }
    try {
      const data = await request();
      if (stopped) return;
      if (editingTranscript()) { deferLoad(); return; }
      draw(data);
    }
    catch (error) { if (editingTranscript()) { deferLoad(); return; } root.innerHTML = `<div class="dp-wrap"><div class="dp-error">Не удалось загрузить документы: ${esc(error.message)}</div></div>`; }
  };
  const refreshForRequisites = event => {
    if (!event.detail?.dealId || String(event.detail.dealId) === String(dealId)) load();
  };
  root.closest('.modal-content,dialog,[role="dialog"]')?.addEventListener('elc:requisites-changed', refreshForRequisites);
  root.innerHTML = '<div class="dp-wrap"><div class="dp-empty">⏳ Загружаем комплект сделки…</div></div>';
  load();
  return () => {
    stopped = true;
    clearTimeout(timer);
    root.closest('.modal-content,dialog,[role="dialog"]')?.removeEventListener('elc:requisites-changed', refreshForRequisites);
  };
}
