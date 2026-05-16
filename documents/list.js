import {
  typeMeta,
  canEdit,
  isVisibleInPersonal,
  isVisibleInShared,
  isAdminUser,
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

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || '?';
  const b = parts[1]?.[0] || '';
  return (a + b).toUpperCase();
}

function fullName(user) {
  return String(user?.name || user?.fullName || user?.email || 'Сотрудник').trim();
}

function accessLabel(doc) {
  if (doc.scope === 'team') return 'вся команда';
  const count = Array.isArray(doc.sharedWith) ? doc.sharedWith.length : 0;
  if (count <= 0) return 'только выбранные';
  return `${count} ${count === 1 ? 'человек' : 'человек'}`;
}

function filterDocs(docs, me, activeTab, showAllForAdmin, query) {
  const visible = docs.filter((doc) => (
    activeTab === 'personal'
      ? isVisibleInPersonal(doc, me)
      : isVisibleInShared(doc, me, showAllForAdmin)
  ));

  const q = String(query || '').trim().toLowerCase();
  if (!q) return visible;
  return visible.filter((doc) => {
    const hay = `${doc.title || ''} ${doc.description || ''}`.toLowerCase();
    return hay.includes(q);
  });
}

function tabCounts(docs, me, showAllForAdmin) {
  return {
    shared: docs.filter((doc) => isVisibleInShared(doc, me, showAllForAdmin)).length,
    personal: docs.filter((doc) => isVisibleInPersonal(doc, me)).length,
  };
}

export function renderDocumentsList(container, model) {
  const me = model.me;
  const docs = Array.isArray(model.docs) ? model.docs : [];
  const usersById = model.usersById || {};
  const isAdmin = isAdminUser(me);
  const counts = tabCounts(docs, me, model.showAllForAdmin);
  const filtered = filterDocs(docs, me, model.activeTab, model.showAllForAdmin, model.query);

  container.innerHTML = `
    <section class="doc-title-row">
      <div>
        <h1>Документы</h1>
        <div class="doc-subtitle">Внутренние регламенты, инструкции и мотивационные материалы.</div>
      </div>
      ${model.canCreate === false
        ? '<button class="doc-btn doc-btn-primary" disabled title="Недоступно в автономном режиме">+ Новый документ</button>'
        : '<button class="doc-btn doc-btn-primary" data-action="create">+ Новый документ</button>'}
    </section>

    <section class="doc-filters-row">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div class="doc-segments" data-tabs>
          <button class="doc-seg ${model.activeTab === 'shared' ? 'is-active' : ''}" data-tab="shared">Общие <span class="doc-count-pill">${counts.shared}</span></button>
          <button class="doc-seg ${model.activeTab === 'personal' ? 'is-active' : ''}" data-tab="personal">Личные <span class="doc-count-pill">${counts.personal}</span></button>
        </div>
        ${isAdmin ? `
          <label class="doc-admin-toggle">
            <input type="checkbox" data-action="show-all" ${model.showAllForAdmin ? 'checked' : ''}>
            <span>Показать все документы команды</span>
          </label>
        ` : ''}
      </div>
      <div class="doc-search"><input type="search" data-action="search" value="${text(model.query || '')}" placeholder="Поиск по названию и описанию"></div>
    </section>

    ${filtered.length ? `
      <section class="doc-grid">
        ${filtered.map((doc) => {
          const meta = typeMeta(doc.type);
          const author = usersById[doc.authorId] || null;
          const authorName = fullName(author || { name: doc.authorId || 'Сотрудник' });
          const editable = canEdit(doc, me);
          return `
            <article class="doc-card" data-open="${text(doc.id)}">
              <div class="doc-card-head">
                <div class="doc-type-icon" style="background:${meta.bg};color:${meta.fg}"><i class="ti ti-${meta.icon}"></i></div>
                <div class="doc-type-pill">${text(meta.label)}</div>
              </div>

              <h3 class="doc-card-title">${text(doc.title || 'Без названия')}</h3>
              <p class="doc-card-desc">${text(doc.description || 'Без описания')}</p>

              ${editable ? `
                <div class="doc-card-actions">
                  <button class="doc-btn" data-action="share" data-id="${text(doc.id)}">Поделиться</button>
                  <button class="doc-btn" data-action="edit" data-id="${text(doc.id)}">Изменить</button>
                  <button class="doc-btn doc-btn-danger" data-action="delete" data-id="${text(doc.id)}">Удалить</button>
                </div>
              ` : ''}

              <div class="doc-card-meta">
                <div>
                  <div class="doc-author">
                    <div class="doc-avatar">${text(initials(authorName))}</div>
                    <span>${text(authorName)}</span>
                  </div>
                  <div class="doc-access-meta" style="margin-top:5px"><i class="ti ti-users"></i><span>${text(accessLabel(doc))}</span></div>
                </div>
                <div class="doc-date">${text(model.formatDate(doc.updatedAt))}</div>
              </div>
            </article>
          `;
        }).join('')}
      </section>
    ` : `
      <section class="doc-empty">
        <h3>${model.activeTab === 'shared' ? 'Нет документов в общих' : 'Нет личных документов'}</h3>
        <p>${model.activeTab === 'shared'
          ? 'Попроси коллегу поделиться документом или создай новый.'
          : 'Создай первый документ и поделись им с коллегами.'}</p>
      </section>
    `}
  `;

  container.querySelector('[data-action="create"]')?.addEventListener('click', () => model.onCreate?.());

  container.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => model.onTabChange?.(button.dataset.tab));
  });

  container.querySelector('[data-action="show-all"]')?.addEventListener('change', (event) => {
    model.onToggleShowAll?.(!!event.target.checked);
  });

  container.querySelector('[data-action="search"]')?.addEventListener('input', (event) => {
    model.onSearch?.(event.target.value || '');
  });

  container.querySelectorAll('[data-open]').forEach((card) => {
    card.addEventListener('click', (event) => {
      const control = event.target.closest('button');
      if (control) return;
      model.onOpen?.(card.dataset.open);
    });
  });

  container.querySelectorAll('[data-action="share"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      model.onShare?.(button.dataset.id);
    });
  });

  container.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      model.onEdit?.(button.dataset.id);
    });
  });

  container.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      model.onDelete?.(button.dataset.id);
    });
  });
}
