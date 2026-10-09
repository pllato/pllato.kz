// Анкеты для ТЗ клиентов (app/brief.html): список для команды, подшивка к карточке app.html, сводка в карточке.
const API = 'https://pllato-elc-worker.uurraa.workers.dev/api/briefs';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
const when = (iso) => iso ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const pageOf = (b) => b.template === 'custom' ? `app/brief-${b.id.replace(/-.*$/, '')}.html` : 'app/brief.html';
const linkOf = (b) => b.key ? (b.template === 'custom' ? `${pageOf(b)}?key=${b.key}` : `app/brief.html?id=${b.id}&key=${b.key}`) : '';

let CACHE = null;
async function load(getToken, force) {
  if (CACHE && !force) return CACHE;
  const token = getToken();
  if (!token) throw new Error('Сессия не найдена — войдите заново');
  const r = await fetch(API, { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d?.ok) throw new Error(d?.error || `HTTP ${r.status}`);
  CACHE = d.items || [];
  return CACHE;
}
function cards() {
  return [...document.querySelectorAll('.tool-card[data-app-id]')]
    .map((c) => ({ id: c.dataset.appId, title: (c.querySelector('h3')?.textContent || c.dataset.appId).trim() }))
    .filter((c, i, a) => c.id && a.findIndex((x) => x.id === c.id) === i);
}
const STYLE = `.bra{font-size:13.5px}.bra-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0 14px}.bra-top input{flex:1;min-width:240px;padding:9px 11px;border:1px solid #d8dde5;border-radius:10px;font:inherit}
.bra-link{display:flex;gap:8px;align-items:center;background:#eef6f1;border:1px solid #cfe3d8;border-radius:12px;padding:10px 12px;margin-bottom:12px;flex-wrap:wrap}.bra-link code{flex:1;min-width:220px;font-size:12.5px;word-break:break-all}
.bra button,.bra .btn{border:1px solid #cfd6df;background:#fff;border-radius:9px;padding:7px 12px;cursor:pointer;font:inherit;font-weight:700;color:#1d2a25;text-decoration:none;white-space:nowrap}.bra button.p{background:#1f6b55;border-color:#1f6b55;color:#fff}
.bra table{width:100%;border-collapse:collapse}.bra th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b7b88;padding:8px;border-bottom:1px solid #e3e7ec}.bra td{padding:9px 8px;border-bottom:1px solid #eef1f4;vertical-align:top}
.bra .pc{display:inline-block;min-width:44px;font-weight:800;color:#1f6b55}.bra .bar{height:5px;background:#e9edf0;border-radius:3px;overflow:hidden;width:90px;margin-top:4px}.bra .bar i{display:block;height:100%;background:#1f6b55}
.bra select{max-width:260px;padding:6px 8px;border:1px solid #d8dde5;border-radius:8px;font:inherit}.bra .muted{color:#6b7b88;font-size:12px}.bra .tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 7px;border-radius:6px;background:#e7f1ec;color:#1f6b55;margin-left:4px}
.brief-linked{margin:10px 0 12px;border:1px solid rgba(31,107,85,.28);border-radius:12px;padding:9px 12px;background:rgba(31,107,85,.06);font-size:12.5px}.brief-linked b{color:#1f6b55}.brief-linked a{font-weight:700;color:#1f6b55;margin-right:10px}`;
function ensureStyle() { if (!document.getElementById('bra-style')) { const s = document.createElement('style'); s.id = 'bra-style'; s.textContent = STYLE; document.head.appendChild(s); } }
const pct = (b) => b.template === 'universal' ? Math.min(100, Math.round(b.answered / 70 * 100)) : Math.min(100, Math.round(b.answered / 83 * 100));

export async function mountBriefs(el, { getToken, userName = '' }) {
  ensureStyle();
  const ref = encodeURIComponent((userName || '').split('@')[0]);
  const shareUrl = `https://pllato.kz/app/brief.html${ref ? '?ref=' + ref : ''}`;
  el.innerHTML = `<div class="bra"><h2 style="margin:4px 0 6px">Анкеты клиентов для ТЗ</h2><p class="muted">Отправьте клиенту ссылку — он заполнит анкету о своём бизнесе. Заявка появится здесь; подшейте её к карточке клиента, и прогресс будет виден прямо в карточке.</p>
  <div class="bra-link"><b>Ссылка для клиента:</b><code>${esc(shareUrl)}</code><button class="p" data-copy>Скопировать</button><a class="btn" href="https://wa.me/?text=${encodeURIComponent('Здравствуйте! Чтобы мы сделали систему точно под ваш бизнес, заполните, пожалуйста, анкету — около часа, можно частями: ' + shareUrl)}" target="_blank" rel="noopener">WhatsApp</a></div>
  <div class="bra-top"><input placeholder="Поиск: компания, контакт, телефон, менеджер" data-q><button data-reload>Обновить</button></div><div data-list>Загружаю…</div></div>`;
  el.querySelector('[data-copy]').onclick = (e) => { navigator.clipboard.writeText(shareUrl); e.target.textContent = 'Скопировано ✓'; };
  const list = el.querySelector('[data-list]'), q = el.querySelector('[data-q]');
  const opts = cards();
  async function draw(force) {
    let items;
    try { items = await load(getToken, force); } catch (e) { list.innerHTML = `<p class="muted">Не удалось загрузить анкеты: ${esc(e.message)}. Если это первая настройка — нужно обновить воркер.</p>`; return; }
    const t = q.value.trim().toLowerCase();
    const rows = items.filter((b) => !t || [b.company, b.contact, b.phone, b.ref, b.id].join(' ').toLowerCase().includes(t));
    if (!rows.length) { list.innerHTML = '<p class="muted">Анкет пока нет.</p>'; return; }
    list.innerHTML = `<table><thead><tr><th>Компания / контакт</th><th>Тип</th><th>Заполнено</th><th>Обновлено</th><th>Карточка</th><th></th></tr></thead><tbody>${rows.map((b) => `<tr data-id="${esc(b.id)}">
      <td><b>${esc(b.company || '(без названия)')}</b>${b.done ? '<span class="tag">отправлена</span>' : ''}<div class="muted">${esc([b.contact, b.phone].filter(Boolean).join(' · '))}${b.ref ? ' · от ' + esc(b.ref) : ''}</div></td>
      <td class="muted">${esc((b.kinds || []).join(', ') || (b.template === 'custom' ? 'индивидуальная' : '—'))}</td>
      <td><span class="pc">${pct(b)}%</span><span class="muted">${b.answered} отв.</span><div class="bar"><i style="width:${pct(b)}%"></i></div></td>
      <td class="muted">${when(b.updatedAt)}${b.lastBy ? '<br>' + esc(b.lastBy) : ''}</td>
      <td><select data-link><option value="">— не подшита —</option>${opts.map((o) => `<option value="${esc(o.id)}"${o.id === b.appId ? ' selected' : ''}>${esc(o.title.slice(0, 70))}</option>`).join('')}</select></td>
      <td>${linkOf(b) ? `<a class="btn" href="${esc(linkOf(b))}#tz" target="_blank" rel="noopener">ТЗ →</a>` : ''}</td></tr>`).join('')}</tbody></table>`;
    list.querySelectorAll('select[data-link]').forEach((s) => s.onchange = async () => {
      const id = s.closest('tr').dataset.id;
      s.disabled = true;
      try {
        const r = await fetch(`${API}/${encodeURIComponent(id)}/link`, { method: 'POST', headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' }, body: JSON.stringify({ appId: s.value }) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const b = CACHE.find((x) => x.id === id); if (b) b.appId = s.value;
        paintLinkedBriefs({ getToken, items: CACHE });
      } catch (e) { alert('Не удалось подшить: ' + e.message); }
      s.disabled = false;
    });
  }
  q.oninput = () => draw(false);
  el.querySelector('[data-reload]').onclick = () => draw(true);
  draw(true);
}

export async function paintLinkedBriefs({ getToken, items }) {
  ensureStyle();
  try { items = items || await load(getToken); } catch (e) { return; }
  document.querySelectorAll('.brief-linked').forEach((n) => n.remove());
  items.filter((b) => b.appId).forEach((b) => {
    const card = document.querySelector(`.tool-card[data-app-id="${CSS.escape(b.appId)}"]`);
    if (!card) return;
    const box = document.createElement('div');
    box.className = 'brief-linked';
    box.innerHTML = `Анкета для ТЗ: <b>${pct(b)}%</b> · ${b.answered} ответов · ${when(b.updatedAt)}${b.done ? ' · <b>отправлена ✓</b>' : ''}<br>${linkOf(b) ? `<a href="${esc(linkOf(b))}#tz" target="_blank" rel="noopener">Итоговое ТЗ →</a><a href="${esc(linkOf(b))}" target="_blank" rel="noopener">Анкета</a>` : ''}`;
    const anchor = card.querySelector('.tool-cta') || card.lastElementChild;
    card.insertBefore(box, anchor);
  });
}
