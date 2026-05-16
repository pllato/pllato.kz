import {
  BUILTIN_REGISTRY,
  canEdit,
  typeMeta,
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

export function renderDocumentPage(container, model) {
  const doc = model.doc;
  const me = model.me;
  const meta = typeMeta(doc.type);
  const editable = canEdit(doc, me);
  const author = model.usersById?.[doc.authorId];
  const authorName = author?.name || author?.fullName || author?.email || doc.authorId || 'Сотрудник';

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
          <button class="doc-btn" data-action="share">Поделиться</button>
          <button class="doc-btn" data-action="edit">Изменить</button>
          <button class="doc-btn doc-btn-danger" data-action="delete">Удалить</button>
        </div>
      ` : ''}
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

  if (doc.builtin) {
    const renderBuiltin = BUILTIN_REGISTRY[doc.contentModuleId || ''];
    if (typeof renderBuiltin === 'function') {
      renderBuiltin(target, { doc, moduleState: model.moduleState || {} });
      return;
    }
    target.innerHTML = '<div class="doc-empty"><h3>Модуль документа не найден</h3><p>Проверь contentModuleId у этой записи.</p></div>';
    return;
  }

  target.innerHTML = `<article class="doc-markdown">${markdownToHtml(doc.body || '') || '<p>Текст документа пока пустой.</p>'}</article>`;
}
