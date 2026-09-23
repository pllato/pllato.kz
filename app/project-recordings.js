// Project materials and CRM use the same authenticated R2 attachments.
const WORKER = 'https://pllato-elc-worker.uurraa.workers.dev';

export function initProjectRecordings({ getSession }) {
  for (const card of document.querySelectorAll('[data-recordings-deal]')) {
    const dealId = card.dataset.recordingsDeal;
    const details = card.querySelector('details.tool-dd');
    const menu = details?.querySelector('.tool-dd-menu');
    if (!menu || !/^deal_[a-zA-Z0-9_-]+$/.test(dealId)) continue;

    const section = document.createElement('section');
    section.style.cssText = 'border-top:1px solid var(--border);margin-top:8px;padding-top:8px';
    const title = document.createElement('strong');
    title.textContent = 'Записи встреч и файлы из сделки';
    const files = document.createElement('div');
    const deal = document.createElement('a');
    deal.href = `/team.html#deal/${encodeURIComponent(dealId)}`;
    deal.target = '_blank';
    deal.rel = 'noopener noreferrer';
    deal.textContent = 'Открыть сделку → Квалификация (бриф) → Записи звонка';
    const refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.textContent = 'Обновить файлы';
    section.append(title, files, refresh, deal);
    menu.append(section);

    let loading = false;
    async function load() {
      if (loading) return;
      const token = getSession()?.token;
      if (!token) { files.textContent = 'Войдите в портал для просмотра файлов.'; return; }
      loading = true;
      refresh.disabled = true;
      files.textContent = 'Загрузка файлов…';
      try {
        const response = await fetch(`${WORKER}/api/deals/${encodeURIComponent(dealId)}/qualification/recordings`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data.ok || !Array.isArray(data.recordings)) throw new Error('Invalid file list');
        files.replaceChildren();
        const recordings = data.recordings.filter(file => file.kind !== 'logo');
        for (const file of recordings) {
          if (!/^[a-zA-Z0-9_-]+$/.test(file.id)) continue;
          const link = document.createElement('a');
          const url = `${WORKER}/api/deals/${encodeURIComponent(dealId)}/qualification/recording/${encodeURIComponent(file.id)}`;
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = `${file.name} · ${(Number(file.size || 0) / 1024 / 1024).toFixed(2)} МБ`;
          link.addEventListener('click', event => {
            event.preventDefault();
            const currentToken = getSession()?.token;
            if (!currentToken) { files.textContent = 'Войдите в портал для просмотра файлов.'; return; }
            window.open(`${url}?auth=${encodeURIComponent(currentToken)}`, '_blank', 'noopener,noreferrer');
          });
          files.append(link);
        }
        if (!files.childElementCount) files.textContent = 'В сделку пока не загружены файлы встреч.';
      } catch {
        files.textContent = 'Не удалось загрузить файлы. Повторите попытку или откройте сделку.';
      } finally {
        loading = false;
        refresh.disabled = false;
      }
    }
    refresh.addEventListener('click', load);
    details.addEventListener('toggle', () => { if (details.open) load(); });
    if (details.open) load();
  }
}
