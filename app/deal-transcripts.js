import { transcriptText } from './zoom-crm.js?v=20261008-transcript-recovery';

export function transcriptRows(zoom = [], manual = []) {
  return [
    ...zoom.filter(f => !f.deleted_at && f.status !== 'deleted' && (!/chat|metadata/i.test(f.kind || '') && (/transcript/i.test(f.kind || '') || /^(VTT|TXT)$/i.test(f.extension || '')))).map(f => ({
      id: 'zoom:' + f.id, name: f.topic || 'Встреча Zoom', date: f.recording_start,
      ready: f.status === 'stored', error: f.error, source: String(f.meeting_id||'').startsWith('crm-') ? 'Pllato Meet' : 'Zoom',
      path: '/api/zoom/files/' + encodeURIComponent(f.id),
    })),
    ...manual.filter(f => f.kind === 'transcript').map(f => ({
      id: 'manual:' + f.id, name: f.name || 'Транскрипция', date: f.uploadedAt,
      ready: true, source: 'Загружена вручную', path: f.url,
    })),
  ].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
}

export function mountDealTranscripts(root, { dealId, base, getToken, onAdd }) {
  const heading = document.createElement('div');
  heading.className = 'dc-section-h';
  heading.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:0';
  const title = document.createElement('span'); title.textContent = 'Транскрипции встреч';
  const add = document.createElement('button'); add.type = 'button'; add.className = 'tbtn tbtn-xs'; add.textContent = '+ Добавить'; add.onclick = onAdd;
  const refresh = document.createElement('button'); refresh.type = 'button'; refresh.className = 'tbtn tbtn-xs'; refresh.textContent = 'Обновить';
  heading.append(title); if(onAdd) heading.append(add); heading.append(refresh);
  const list = document.createElement('div'); list.setAttribute('aria-live', 'polite');
  root.replaceChildren(heading, list);
  let busy = false;
  async function request(path) {
    const response = await fetch(base + path, { headers: { Authorization: 'Bearer ' + await getToken() } });
    if (!response.ok) throw new Error('Не удалось загрузить данные (HTTP ' + response.status + ')');
    return response;
  }
  async function load() {
    if (busy || !root.isConnected) return;
    busy = true; refresh.disabled = true;
    if (!list.childNodes.length) list.textContent = 'Загружаем транскрипции…';
    const results = await Promise.allSettled([
      request('/api/zoom/files?deal=' + encodeURIComponent(dealId)).then(r => r.json()),
      request('/api/deals/' + encodeURIComponent(dealId) + '/qualification/recordings').then(r => r.json()),
    ]);
    if (!root.isConnected) { busy = false; return; }
    list.replaceChildren();
    const rows = transcriptRows(results[0].value?.files, results[1].value?.recordings);
    for (const row of rows) {
      const item = document.createElement('div');
      item.style.cssText = 'padding:10px 0;border-top:1px solid var(--b1)';
      const name = document.createElement('b'); name.textContent = row.name;
      const meta = document.createElement('div'); meta.style.cssText = 'font-size:12px;color:var(--t3);margin:4px 0 8px';
      const date = new Date(row.date);
      meta.textContent = [isNaN(date) ? '' : date.toLocaleString('ru-RU', { timeZone: 'Asia/Almaty', dateStyle: 'short', timeStyle: 'short' }) + ' · Алматы', row.source, row.ready ? 'Готова' : 'Ожидает переноса из Zoom'].filter(Boolean).join(' · ');
      item.append(name, meta);
      const status = document.createElement('div'); status.setAttribute('role', 'status'); status.style.fontSize = '12px';
      if (row.ready) {
        const read = document.createElement('button'); read.type = 'button'; read.className = 'tbtn tbtn-sm'; read.textContent = 'Читать';
        const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'tbtn tbtn-sm'; copy.textContent = 'Копировать транскрипцию'; copy.style.marginLeft = '6px';
        const text = document.createElement('pre'); text.hidden = true;
        text.style.cssText = 'white-space:pre-wrap;max-height:320px;overflow:auto;font:inherit;font-size:13px;user-select:text';
        let cached;
        const getText = async () => cached ?? (cached = transcriptText(await (await request(row.path)).text()));
        read.onclick = async () => {
          if (!text.hidden) { text.hidden = true; read.textContent = 'Читать'; return; }
          read.disabled = true;
          try { text.textContent = await getText(); text.hidden = false; read.textContent = 'Свернуть'; status.textContent = ''; }
          catch (e) { status.textContent = e.message; } finally { read.disabled = false; }
        };
        copy.onclick = async () => {
          copy.disabled = true;
          try { await navigator.clipboard.writeText(await getText()); status.textContent = 'Транскрипция скопирована'; }
          catch (e) { if (cached !== undefined) { text.textContent = cached; text.hidden = false; read.textContent = 'Свернуть'; status.textContent = 'Не удалось скопировать автоматически. Выделите текст ниже.'; } else status.textContent = e.message; }
          finally { copy.disabled = false; }
        };
        item.append(read, copy, text);
      } else if (row.error) {
        status.textContent = /4711|scope/i.test(row.error) ? 'Zoom не разрешил перенос файла. Нужно обновить права подключения Zoom.' : row.error;
        status.style.color = 'var(--rd)';
      }
      item.append(status); list.append(item);
    }
    for (const result of results) if (result.status === 'rejected') {
      const error = document.createElement('p'); error.textContent = result.reason.message; list.append(error);
    }
    if (!rows.length && results.every(r => r.status === 'fulfilled')) list.textContent = 'Транскрипций пока нет. Можно вставить текст или загрузить TXT/VTT кнопкой «+ Добавить».';
    busy = false; refresh.disabled = false;
  }
  refresh.onclick = load;
  load();
  return { refresh: load };
}
