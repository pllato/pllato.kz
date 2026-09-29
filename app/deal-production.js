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
    .kanban-docs{display:flex;gap:4px;flex-wrap:wrap;margin-top:7px}.kanban-doc{font-size:10px;font-weight:700;border-radius:99px;padding:3px 7px;background:#eef2ff;color:#4338ca}.kanban-doc.ready{background:#dcfce7;color:#15803d}.kanban-doc.error{background:#fee2e2;color:#b91c1c}
    @media(max-width:720px){.dp-gates{grid-template-columns:1fr}.dp-item{align-items:flex-start;flex-wrap:wrap}.dp-status{margin-left:auto}}
  `;
  document.head.appendChild(style);
}

function statusBadge(status) {
  const [label, css] = LABELS[status] || LABELS.missing;
  return `<span class="dp-status ${css}">${status === 'building' ? '● ' : status === 'ready' ? '✓ ' : ''}${label}</span>`;
}

function icon(kind) { return kind === 'demo' ? '✨' : kind === 'kp' ? '📘' : '🧾'; }

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
  const parts = [];
  if (p.demo && p.demo !== 'missing') parts.push(`<span class="kanban-doc ${esc(p.demo)}">✨ Демо ${p.demo === 'ready' ? '✓' : p.demo === 'error' ? '!' : '…'}</span>`);
  if (p.kp && p.kp !== 'missing') parts.push(`<span class="kanban-doc ${esc(p.kp)}">📘 КП ${p.kp === 'ready' ? '✓' : p.kp === 'error' ? '!' : '…'}</span>`);
  if (Number(p.invoicesTotal || 0)) parts.push(`<span class="kanban-doc ${p.invoicesReady === p.invoicesTotal ? 'ready' : ''}">🧾 ${Number(p.invoicesReady || 0)}/${Number(p.invoicesTotal)}</span>`);
  return parts.length ? `<div class="kanban-docs">${parts.join('')}</div>` : '';
}

export function mountDealProduction(root, { dealId, base, getToken, onChanged }) {
  if (!root) return () => {};
  addStyles();
  let stopped = false, timer = null, polls = 0;
  const request = async (path = '', options = {}) => {
    const token = await getToken();
    const response = await fetch(`${base}/api/deals/${encodeURIComponent(dealId)}/production${path}`, {
      ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  };
  const draw = data => {
    const items = data.items || [], active = items.some(x => x.status === 'queued' || x.status === 'building');
    const gates = [
      ['Транскрипция', data.transcript?.ready, data.transcript?.ready ? (data.transcript.name || 'Готова') : 'Нужен VTT/TXT'],
      ['Реквизиты', data.requisites?.ready, data.requisites?.ready ? (data.requisites.files ? `Файлов: ${data.requisites.files}` : 'Заполнены') : 'Нужны для счетов'],
      ['График оплат', data.commercial?.ready, data.commercial?.ready ? `${data.commercial.paymentCount} платежей` : 'Появится из КП'],
    ];
    root.innerHTML = `<div class="dp-wrap"><div class="dp-head"><div><b>Комплект сделки</b><p>Демо, КП и все счета создаются и хранятся здесь</p></div>${data.summary?.hasErrors ? '<button class="dp-retry">Повторить</button>' : ''}</div>
      <div class="dp-gates">${gates.map(g => `<div class="dp-gate ${g[1] ? 'ok' : 'miss'}"><strong>${g[1] ? '✓' : '○'} ${esc(g[0])}</strong>${esc(g[2])}</div>`).join('')}</div>
      <div class="dp-list">${items.length ? items.map(item => `<div class="dp-item"><span class="dp-icon">${icon(item.kind)}</span><span class="dp-copy"><b>${esc(item.title)}</b><small>${item.amount != null ? new Intl.NumberFormat('ru-RU').format(item.amount) + ' ' + esc(item.currency || '') : esc(item.fileName || (item.kind === 'demo' ? 'Интерактивная ссылка' : 'PDF'))}</small>${item.error ? `<span class="dp-error">${esc(item.error)}</span>` : ''}</span>${statusBadge(item.status)}${item.status === 'ready' ? `<button class="dp-open" data-artifact="${esc(item.id)}">Открыть</button>` : ''}</div>`).join('') : '<div class="dp-empty">Документы ещё не запускались. Они появятся после перевода сделки на соответствующую стадию.</div>'}</div></div>`;
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
    if (!stopped && active && polls++ < 40) timer = setTimeout(load, 8000);
  };
  const load = async () => {
    try { draw(await request()); }
    catch (error) { root.innerHTML = `<div class="dp-wrap"><div class="dp-error">Не удалось загрузить документы: ${esc(error.message)}</div></div>`; }
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
