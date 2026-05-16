import {
  BUILTIN_REGISTRY,
  canEdit,
  documentVisual,
  normalizeKind,
  normalizeMime,
  detectEmbedProvider,
  formatSize,
  markdownToHtml,
} from './registry.js';

function text(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

function accessText(doc) {
  if (doc.scope === 'team') return 'вся команда';
  const n = Array.isArray(doc.sharedWith) ? doc.sharedWith.length : 0;
  return `${n} ${n === 1 ? 'человек' : 'человек'}`;
}

function isImageMime(mime, fileName = '') {
  const ext = String(fileName || '').toLowerCase();
  return mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/.test(ext);
}

function isVideoMime(mime, fileName = '') {
  const ext = String(fileName || '').toLowerCase();
  return mime.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/.test(ext);
}

function isAudioMime(mime, fileName = '') {
  const ext = String(fileName || '').toLowerCase();
  return mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/.test(ext);
}

function isTextMime(mime, fileName = '') {
  const ext = String(fileName || '').toLowerCase();
  return mime.startsWith('text/')
    || mime === 'application/json'
    || /\.(txt|md|json|csv|log)$/i.test(ext);
}

function toGooglePreview(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('docs.google.com')) {
      if (!u.pathname.endsWith('/preview')) {
        u.pathname = `${u.pathname.replace(/\/$/, '')}/preview`;
      }
      u.search = '';
      return u.toString();
    }
  } catch (_) {
    return url;
  }
  return url;
}

function embedInfo(rawUrl) {
  const url = String(rawUrl || '').trim();
  const provider = detectEmbedProvider(url);
  if (!url) return { provider: 'other', canFrame: false, openUrl: '', iframeUrl: '', label: 'Открыть' };
  if (provider.startsWith('google_')) {
    return { provider, canFrame: true, openUrl: url, iframeUrl: toGooglePreview(url), label: 'Открыть' };
  }
  if (provider === 'figma') {
    return {
      provider,
      canFrame: true,
      openUrl: url,
      iframeUrl: `https://www.figma.com/embed?embed_host=pllato&url=${encodeURIComponent(url)}`,
      label: 'Открыть в Figma',
    };
  }
  if (provider === 'youtube') {
    const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    const id = m?.[1] || '';
    return {
      provider,
      canFrame: !!id,
      openUrl: url,
      iframeUrl: id ? `https://www.youtube.com/embed/${id}` : '',
      label: 'Открыть в YouTube',
    };
  }
  if (provider === 'vimeo') {
    const m = url.match(/vimeo\.com\/(\d+)/);
    const id = m?.[1] || '';
    return {
      provider,
      canFrame: !!id,
      openUrl: url,
      iframeUrl: id ? `https://player.vimeo.com/video/${id}` : '',
      label: 'Открыть в Vimeo',
    };
  }
  if (provider === 'notion') {
    return { provider, canFrame: false, openUrl: url, iframeUrl: '', label: 'Открыть в Notion' };
  }
  return { provider, canFrame: false, openUrl: url, iframeUrl: '', label: 'Открыть ссылку' };
}

function renderFile(target, doc) {
  const file = doc.file || {};
  const url = String(file.downloadURL || '').trim();
  const fileName = String(file.fileName || 'file');
  const mime = normalizeMime(file.mimeType || '');
  const sizeText = formatSize(file.sizeBytes || 0);

  if (!url) {
    target.innerHTML = `
      <section class="doc-empty">
        <h3>Файл недоступен</h3>
        <p>У документа нет ссылки на загруженный файл.</p>
      </section>
    `;
    return;
  }

  if (mime === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
    target.innerHTML = `
      <iframe class="doc-file-iframe" src="${text(url)}" title="${text(fileName)}"></iframe>
      <div class="doc-file-meta">${text(fileName)} · ${text(sizeText || '—')}</div>
    `;
    return;
  }

  if (isImageMime(mime, fileName)) {
    target.innerHTML = `
      <img class="doc-file-image" src="${text(url)}" alt="${text(fileName)}">
      <div class="doc-file-meta">${text(fileName)} · ${text(sizeText || '—')}</div>
    `;
    return;
  }

  if (isVideoMime(mime, fileName)) {
    target.innerHTML = `
      <video class="doc-file-video" src="${text(url)}" controls></video>
      <div class="doc-file-meta">${text(fileName)} · ${text(sizeText || '—')}</div>
    `;
    return;
  }

  if (isAudioMime(mime, fileName)) {
    target.innerHTML = `
      <audio class="doc-file-audio" src="${text(url)}" controls></audio>
      <div class="doc-file-meta">${text(fileName)} · ${text(sizeText || '—')}</div>
    `;
    return;
  }

  if (isTextMime(mime, fileName)) {
    target.innerHTML = `
      <div class="doc-file-meta">${text(fileName)} · ${text(sizeText || '—')}</div>
      <pre class="doc-file-pre" data-text-preview>Загружаем содержимое...</pre>
      <div class="doc-muted-note">Показан предпросмотр. Для полного файла используй «Скачать».</div>
    `;
    const pre = target.querySelector('[data-text-preview]');
    fetch(url)
      .then((res) => res.text())
      .then((content) => {
        const lines = String(content).split('\n').slice(0, 200).join('\n');
        pre.textContent = lines || 'Файл пустой.';
      })
      .catch(() => {
        pre.textContent = 'Не удалось загрузить предпросмотр.';
      });
    return;
  }

  target.innerHTML = `
    <div class="doc-file-card">
      <div class="doc-file-icon"><i class="ti ti-file"></i></div>
      <div class="doc-file-title">${text(fileName)}</div>
      <div class="doc-file-sub">${text(mime || 'file')} ${sizeText ? `· ${text(sizeText)}` : ''}</div>
      <a class="doc-btn doc-btn-primary" href="${text(url)}" target="_blank" rel="noopener">Скачать</a>
    </div>
  `;
}

function renderEmbed(target, doc) {
  const info = embedInfo(doc.embed?.url || '');
  if (!info.openUrl) {
    target.innerHTML = `<section class="doc-empty"><h3>Ссылка не указана</h3><p>Добавь URL в настройках документа.</p></section>`;
    return;
  }
  if (info.canFrame && info.iframeUrl) {
    target.innerHTML = `
      <iframe class="doc-file-iframe" src="${text(info.iframeUrl)}" title="${text(doc.title || 'Документ')}"></iframe>
      <div class="doc-file-meta">Источник: ${text(info.openUrl)}</div>
      <div style="margin-top:8px"><a class="doc-btn" href="${text(info.openUrl)}" target="_blank" rel="noopener">Открыть в новой вкладке</a></div>
    `;
    return;
  }
  target.innerHTML = `
    <div class="doc-file-card">
      <div class="doc-file-icon"><i class="ti ti-external-link"></i></div>
      <div class="doc-file-title">${text(doc.title || 'Внешний документ')}</div>
      <div class="doc-file-sub">${text(info.openUrl)}</div>
      <a class="doc-btn doc-btn-primary" href="${text(info.openUrl)}" target="_blank" rel="noopener">${text(info.label)}</a>
    </div>
  `;
}

export function renderDocumentPage(container, model) {
  const doc = model.doc;
  const me = model.me;
  const meta = documentVisual(doc);
  const kind = normalizeKind(doc.kind, doc);
  const editable = canEdit(doc, me);
  const author = model.usersById?.[doc.authorId];
  const authorName = author?.name || author?.fullName || author?.email || doc.authorId || 'Сотрудник';
  const fileUrl = String(doc.file?.downloadURL || '').trim();
  const openUrl = kind === 'file'
    ? fileUrl
    : String(doc.embed?.url || '').trim();

  container.innerHTML = `
    <section class="doc-page-header">
      <button class="doc-btn" data-action="back">← Документы</button>
      <div class="doc-page-meta">
        <span>${text(meta.label)}</span>
        <span>обновлено ${text(model.formatDateTime(doc.updatedAt))}</span>
        <span>доступ: ${text(accessText(doc))}</span>
        <span>автор: ${text(authorName)}</span>
      </div>
      <div class="doc-title-row" style="margin-top:8px;margin-bottom:8px">
        <div>
          <h1>${text(doc.title || 'Без названия')}</h1>
          <div class="doc-subtitle">${text(doc.description || '')}</div>
        </div>
      </div>
      ${editable ? `
        <div class="doc-page-actions">
          ${openUrl ? `<a class="doc-btn" href="${text(openUrl)}" target="_blank" rel="noopener">${kind === 'file' ? 'Скачать' : 'Открыть'}</a>` : ''}
          <button class="doc-btn" data-action="share">Поделиться</button>
          <button class="doc-btn" data-action="edit">Изменить</button>
          <button class="doc-btn doc-btn-danger" data-action="delete">Удалить</button>
        </div>
      ` : `${openUrl ? `<div class="doc-page-actions"><a class="doc-btn" href="${text(openUrl)}" target="_blank" rel="noopener">${kind === 'file' ? 'Скачать' : 'Открыть'}</a></div>` : ''}`}
    </section>
    <section class="doc-content-card">
      <div data-doc-content></div>
    </section>
  `;

  container.querySelector('[data-action="back"]')?.addEventListener('click', () => model.onBack?.());
  container.querySelector('[data-action="share"]')?.addEventListener('click', () => model.onShare?.(doc.id));
  container.querySelector('[data-action="edit"]')?.addEventListener('click', () => model.onEdit?.(doc.id));
  container.querySelector('[data-action="delete"]')?.addEventListener('click', () => model.onDelete?.(doc.id));

  const target = container.querySelector('[data-doc-content]');

  if (kind === 'builtin' || doc.builtin) {
    const renderBuiltin = BUILTIN_REGISTRY[doc.contentModuleId || ''];
    if (typeof renderBuiltin === 'function') {
      renderBuiltin(target, { doc, moduleState: model.moduleState || {} });
      return;
    }
    target.innerHTML = '<div class="doc-empty"><h3>Модуль документа не найден</h3><p>Проверь contentModuleId у этой записи.</p></div>';
    return;
  }

  if (kind === 'file') {
    renderFile(target, doc);
    return;
  }

  if (kind === 'embed') {
    renderEmbed(target, doc);
    return;
  }

  target.innerHTML = `<article class="doc-markdown">${markdownToHtml(doc.body || '') || '<p>Текст документа пока пустой.</p>'}</article>`;
}
