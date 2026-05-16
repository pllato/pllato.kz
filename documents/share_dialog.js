function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

function asId(value) {
  return String(value || '').trim();
}

function asName(user) {
  return String(user?.name || user?.fullName || user?.email || 'Сотрудник').trim();
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || '?';
  const b = parts[1]?.[0] || '';
  return (a + b).toUpperCase();
}

function normalizeUsers(users) {
  if (Array.isArray(users)) {
    return users
      .map((u) => ({ ...u, id: asId(u.id || u.uid) }))
      .filter((u) => u.id);
  }
  return Object.entries(users || {}).map(([uid, u]) => ({ ...u, id: asId(uid) })).filter((u) => u.id);
}

function ensureInlineStyles() {
  if (document.getElementById('docs-share-inline-style')) return;
  const style = document.createElement('style');
  style.id = 'docs-share-inline-style';
  style.textContent = `
    .doc-modal-overlay{position:fixed;inset:0;background:rgba(11,14,16,.4);display:flex;align-items:center;justify-content:center;padding:16px;z-index:2400}
    .doc-modal{width:min(700px,100%);max-height:min(86vh,840px);overflow:auto;background:#fff;border:.5px solid rgba(41,40,36,.12);border-radius:16px;box-shadow:0 16px 50px rgba(0,0,0,.2)}
    .doc-modal-head{padding:14px 16px;border-bottom:.5px solid rgba(41,40,36,.12);display:flex;align-items:center;justify-content:space-between;gap:10px}
    .doc-modal-head h3{margin:0;font-size:18px;font-weight:500}
    .doc-modal-sub{margin-top:5px;color:#62615a;font-size:13px}
    .doc-modal-body{padding:14px 16px 16px}
    .doc-modal-foot{border-top:.5px solid rgba(41,40,36,.12);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:8px}
    .doc-btn{border:.5px solid rgba(41,40,36,.12);background:#fff;color:#62615a;border-radius:11px;padding:9px 12px;font-size:14px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px;text-decoration:none}
    .doc-btn-primary{background:#b8895a;color:#fff;border-color:#b8895a}
    .doc-btn-primary:disabled{opacity:.5;cursor:not-allowed}
    .doc-segments{display:inline-flex;align-items:center;gap:4px;padding:3px;border:.5px solid rgba(41,40,36,.12);border-radius:999px;background:#f3f1eb}
    .doc-seg{border:0;border-radius:999px;background:transparent;color:#62615a;font-size:14px;font-weight:500;padding:7px 12px;cursor:pointer}
    .doc-seg.is-active{background:#fff;color:#1f1f1b;border:.5px solid rgba(41,40,36,.12)}
    .doc-search input{width:100%;border:.5px solid rgba(41,40,36,.12);border-radius:10px;font-size:14px;padding:9px 10px;color:#1f1f1b;background:#fff}
    .doc-search input:focus{outline:none;border-color:#b8895a}
    .doc-people-list{display:grid;gap:6px;margin-top:10px;max-height:300px;overflow:auto}
    .doc-person-row{border:.5px solid rgba(41,40,36,.12);border-radius:11px;padding:8px;display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center}
    .doc-person-row.is-selected{background:#f3f1eb}
    .doc-person-row.is-disabled{opacity:.58}
    .doc-avatar{width:24px;height:24px;border-radius:50%;background:#efeae1;color:#5b5348;font-size:11px;font-weight:500;display:grid;place-items:center;flex-shrink:0}
    .doc-person-meta{min-width:0}
    .doc-person-name{font-size:14px;font-weight:500;color:#1f1f1b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .doc-person-sub{font-size:12px;color:#8a887f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .doc-muted-note{font-size:12px;color:#8a887f}
    .doc-list-min{display:grid;gap:8px;max-height:340px;overflow:auto;margin-top:10px}
    .doc-list-row{border:.5px solid rgba(41,40,36,.12);border-radius:11px;padding:8px;display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center}
    .doc-list-row.is-disabled{opacity:.58}
    @media (max-width:720px){.doc-modal-overlay{align-items:flex-end;padding:0}.doc-modal{width:100%;max-height:90vh;border-radius:16px 16px 0 0;border-bottom:0}}
  `;
  document.head.appendChild(style);
}

function createModalShell({ title, subtitle }) {
  ensureInlineStyles();
  const overlay = document.createElement('div');
  overlay.className = 'doc-modal-overlay';
  overlay.innerHTML = `
    <div class="doc-modal" role="dialog" aria-modal="true">
      <div class="doc-modal-head">
        <div>
          <h3>${escapeHtml(title)}</h3>
          ${subtitle ? `<div class="doc-modal-sub">${escapeHtml(subtitle)}</div>` : ''}
        </div>
        <button class="doc-btn" data-close>Закрыть</button>
      </div>
      <div class="doc-modal-body" data-body></div>
      <div class="doc-modal-foot" data-foot></div>
    </div>
  `;
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector('[data-close]')?.addEventListener('click', () => close());

  function close() {
    overlay.remove();
  }

  document.body.appendChild(overlay);
  return {
    close,
    overlay,
    body: overlay.querySelector('[data-body]'),
    foot: overlay.querySelector('[data-foot]'),
  };
}

export function openDocumentEditorDialog({
  mode = 'create',
  initial = {},
  isAdmin = false,
  users = {},
  currentUser = null,
  onSave,
}) {
  const shell = createModalShell({
    title: mode === 'edit' ? 'Редактировать документ' : 'Новый документ',
    subtitle: mode === 'edit'
      ? 'Обнови название, описание и настройки доступа документа.'
      : 'Документ появится в твоей вкладке «Личные» и можно будет расшарить коллегам.',
  });

  const builtin = initial?.builtin === true;
  const type = String(initial?.type || 'other');
  const scope = isAdmin ? String(initial?.scope || 'personal') : 'personal';
  const people = normalizeUsers(users).filter((u) => asId(u.id) && asId(u.id) !== asId(currentUser?.id));
  const selected = new Set((initial?.sharedWith || []).map((id) => asId(id)).filter(Boolean));

  shell.body.innerHTML = `
    <div class="doc-modal-field">
      <label>Название</label>
      <input type="text" data-field="title" value="${escapeHtml(initial?.title || '')}" maxlength="120" placeholder="Например, регламент квалификации лидов">
    </div>
    <div class="doc-modal-field">
      <label>Описание</label>
      <textarea data-field="description" maxlength="500" placeholder="Коротко о содержимом документа">${escapeHtml(initial?.description || '')}</textarea>
    </div>
    <div class="doc-modal-field">
      <label>Тип документа</label>
      <select data-field="type" ${builtin ? 'disabled' : ''}>
        <option value="motivation" ${type === 'motivation' ? 'selected' : ''}>motivation</option>
        <option value="regulation" ${type === 'regulation' ? 'selected' : ''}>regulation</option>
        <option value="instruction" ${type === 'instruction' ? 'selected' : ''}>instruction</option>
        <option value="other" ${type === 'other' ? 'selected' : ''}>other</option>
      </select>
    </div>
    ${isAdmin ? `
      <div class="doc-modal-field">
        <label>Доступ</label>
        <select data-field="scope" ${builtin ? '' : ''}>
          <option value="personal" ${scope === 'personal' ? 'selected' : ''}>выбранным сотрудникам</option>
          <option value="team" ${scope === 'team' ? 'selected' : ''}>всей команде</option>
        </select>
      </div>
    ` : ''}
    <div class="doc-modal-field" data-access-wrap>
      <label>Сотрудники с доступом</label>
      ${people.length ? `
        <div class="doc-search"><input data-emp-query type="search" placeholder="Поиск сотрудника"></div>
        <div class="doc-people-list" data-emp-list></div>
        <div class="doc-muted-note" data-emp-count></div>
      ` : `
        <div class="doc-muted-note">Список сотрудников временно недоступен. После загрузки users можно назначить доступ через «Поделиться».</div>
      `}
      <div class="doc-muted-note" data-team-hint style="display:none">При доступе «всей команде» список сотрудников не используется.</div>
    </div>
    ${builtin ? '' : `
      <div class="doc-modal-field">
        <label>Содержимое (markdown)</label>
        <textarea data-field="body" style="min-height:180px" placeholder="# Заголовок\nТекст документа...">${escapeHtml(initial?.body || '')}</textarea>
      </div>
    `}
    ${builtin ? '<div class="doc-muted-note">Это встроенный документ. Тексты и калькулятор редактируются в коде модуля.</div>' : ''}
  `;

  shell.foot.innerHTML = `
    <div></div>
    <div style="display:flex;gap:8px">
      <button class="doc-btn" data-cancel>Отмена</button>
      <button class="doc-btn doc-btn-primary" data-save>Сохранить</button>
    </div>
  `;

  const titleEl = shell.body.querySelector('[data-field="title"]');
  const saveBtn = shell.foot.querySelector('[data-save]');
  const scopeEl = shell.body.querySelector('[data-field="scope"]');
  const empQueryEl = shell.body.querySelector('[data-emp-query]');
  const empListEl = shell.body.querySelector('[data-emp-list]');
  const empCountEl = shell.body.querySelector('[data-emp-count]');
  const teamHintEl = shell.body.querySelector('[data-team-hint]');
  const accessWrapEl = shell.body.querySelector('[data-access-wrap]');

  function currentScope() {
    if (!isAdmin) return 'personal';
    const raw = String(scopeEl?.value || scope || 'personal');
    return raw === 'team' ? 'team' : 'personal';
  }

  function renderEmployees() {
    if (!empListEl) return;
    const activeScope = currentScope();
    const q = String(empQueryEl?.value || '').trim().toLowerCase();
    const filtered = people.filter((p) => {
      if (!q) return true;
      const hay = `${asName(p)} ${p.email || ''}`.toLowerCase();
      return hay.includes(q);
    });

    const disabled = activeScope === 'team';
    if (teamHintEl) teamHintEl.style.display = disabled ? '' : 'none';
    if (empQueryEl) empQueryEl.disabled = disabled;
    if (accessWrapEl) accessWrapEl.style.opacity = disabled ? '0.74' : '1';

    if (!filtered.length) {
      empListEl.innerHTML = `<div class="doc-muted-note">Сотрудники не найдены.</div>`;
      if (empCountEl) empCountEl.textContent = `Выбрано: ${selected.size} из ${people.length}`;
      return;
    }

    empListEl.innerHTML = filtered.map((p) => {
      const pid = asId(p.id);
      const checked = selected.has(pid);
      const sub = `${p.role || 'сотрудник'} · ${p.email || ''}`;
      return `
        <label class="doc-person-row ${checked ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}">
          <div class="doc-avatar">${escapeHtml(initials(asName(p)))}</div>
          <div class="doc-person-meta">
            <div class="doc-person-name">${escapeHtml(asName(p))}</div>
            <div class="doc-person-sub">${escapeHtml(sub)}</div>
          </div>
          <input type="checkbox" data-emp-id="${escapeHtml(pid)}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
        </label>
      `;
    }).join('');

    empListEl.querySelectorAll('input[data-emp-id]').forEach((input) => {
      input.addEventListener('change', () => {
        const id = asId(input.dataset.empId);
        if (!id) return;
        if (input.checked) selected.add(id);
        else selected.delete(id);
        renderEmployees();
      });
    });

    if (empCountEl) empCountEl.textContent = `Выбрано: ${selected.size} из ${people.length}`;
  }

  function readPayload() {
    const title = String(shell.body.querySelector('[data-field="title"]')?.value || '').trim();
    const description = String(shell.body.querySelector('[data-field="description"]')?.value || '').trim();
    const body = String(shell.body.querySelector('[data-field="body"]')?.value || '');
    const selectedType = String(shell.body.querySelector('[data-field="type"]')?.value || type || 'other');
    const selectedScope = currentScope();

    return {
      title,
      description,
      body,
      type: selectedType,
      scope: selectedScope === 'team' ? 'team' : 'personal',
      sharedWith: selectedScope === 'team' ? [] : [...selected].sort(),
    };
  }

  empQueryEl?.addEventListener('input', () => renderEmployees());
  scopeEl?.addEventListener('change', () => renderEmployees());
  renderEmployees();

  shell.foot.querySelector('[data-cancel]')?.addEventListener('click', () => shell.close());
  saveBtn?.addEventListener('click', async () => {
    const payload = readPayload();
    if (!payload.title) {
      titleEl?.focus();
      return;
    }
    saveBtn.disabled = true;
    try {
      await onSave?.(payload);
      shell.close();
    } finally {
      saveBtn.disabled = false;
    }
  });

  titleEl?.focus();
}

export function openDocumentShareDialog({
  doc,
  users,
  currentUser,
  isAdmin,
  onSave,
}) {
  const people = normalizeUsers(users)
    .filter((u) => asId(u.id) && asId(u.id) !== asId(doc?.authorId));

  const shell = createModalShell({
    title: 'Поделиться',
    subtitle: 'Документ появится во вкладке «Общие» у выбранных сотрудников.',
  });

  let mode = String(doc?.scope || 'personal') === 'team' && isAdmin ? 'team' : 'selected';
  if (!isAdmin) mode = 'selected';

  let query = '';
  const selected = new Set((doc?.sharedWith || []).map((id) => asId(id)).filter(Boolean));

  shell.body.innerHTML = `
    <div class="doc-segments" data-segments>
      <button class="doc-seg" data-mode="selected">Выбранным</button>
      ${isAdmin ? '<button class="doc-seg" data-mode="team">Всей команде</button>' : ''}
    </div>
    <div class="doc-search" style="margin-top:10px"><input data-query type="search" placeholder="Поиск по имени или email"></div>
    <div class="doc-muted-note" data-team-note style="margin-top:8px;display:none">Документ будет доступен всей команде. Индивидуальный список не используется.</div>
    <div class="doc-people-list" data-list></div>
  `;

  shell.foot.innerHTML = `
    <div class="doc-muted-note" data-count></div>
    <div style="display:flex;gap:8px">
      <button class="doc-btn" data-cancel>Отмена</button>
      <button class="doc-btn doc-btn-primary" data-save>Сохранить</button>
    </div>
  `;

  const listEl = shell.body.querySelector('[data-list]');
  const countEl = shell.foot.querySelector('[data-count]');
  const teamNoteEl = shell.body.querySelector('[data-team-note]');

  function renderSegments() {
    shell.body.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.mode === mode);
    });
  }

  function renderList() {
    const q = query.trim().toLowerCase();
    const filtered = people.filter((p) => {
      const hay = `${asName(p)} ${(p.email || '').toLowerCase()}`.toLowerCase();
      return !q || hay.includes(q);
    });

    if (mode === 'team') {
      teamNoteEl.style.display = '';
      listEl.innerHTML = '';
      countEl.textContent = `Выбрано: вся команда (${people.length})`;
      return;
    }

    teamNoteEl.style.display = 'none';
    if (!filtered.length) {
      listEl.innerHTML = `<div class="doc-muted-note">Сотрудники не найдены.</div>`;
      countEl.textContent = `Выбрано: ${selected.size} из ${people.length}`;
      return;
    }

    listEl.innerHTML = filtered.map((p) => {
      const id = asId(p.id);
      const checked = selected.has(id);
      const sub = `${p.role || 'сотрудник'} · ${p.email || ''}`;
      return `
        <label class="doc-person-row ${checked ? 'is-selected' : ''}">
          <div class="doc-avatar">${escapeHtml(initials(asName(p)))}</div>
          <div class="doc-person-meta">
            <div class="doc-person-name">${escapeHtml(asName(p))}</div>
            <div class="doc-person-sub">${escapeHtml(sub)}</div>
          </div>
          <input type="checkbox" data-person-id="${escapeHtml(id)}" ${checked ? 'checked' : ''}>
        </label>
      `;
    }).join('');

    listEl.querySelectorAll('input[data-person-id]').forEach((input) => {
      input.addEventListener('change', () => {
        const pid = asId(input.dataset.personId);
        if (!pid) return;
        if (input.checked) selected.add(pid);
        else selected.delete(pid);
        renderList();
      });
    });

    countEl.textContent = `Выбрано: ${selected.size} из ${people.length}`;
  }

  shell.body.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode === 'team' ? 'team' : 'selected';
      renderSegments();
      renderList();
    });
  });

  shell.body.querySelector('[data-query]')?.addEventListener('input', (event) => {
    query = String(event.target.value || '');
    renderList();
  });

  shell.foot.querySelector('[data-cancel]')?.addEventListener('click', () => shell.close());
  shell.foot.querySelector('[data-save]')?.addEventListener('click', async (event) => {
    const saveBtn = event.currentTarget;
    const scope = isAdmin && mode === 'team' ? 'team' : 'personal';
    const payload = {
      scope,
      sharedWith: scope === 'team' ? [] : [...selected].sort(),
    };
    saveBtn.disabled = true;
    try {
      await onSave?.(payload);
      shell.close();
    } finally {
      saveBtn.disabled = false;
    }
  });

  renderSegments();
  renderList();
}

export function openEmployeeDocumentsDialog({
  employee,
  documents,
  currentUser,
  onSave,
}) {
  const targetId = asId(employee?.id);
  if (!targetId) return;

  const editableDocs = (documents || []).filter((doc) => asId(doc.authorId) !== targetId);
  const selected = new Set(
    editableDocs
      .filter((doc) => doc.scope !== 'team' && (doc.sharedWith || []).includes(targetId))
      .map((doc) => asId(doc.id))
      .filter(Boolean)
  );

  const initial = new Set(selected);

  const shell = createModalShell({
    title: `Документы для ${asName(employee)}`,
    subtitle: 'Отметь документы, которые сотрудник увидит во вкладке «Общие».',
  });

  let query = '';
  shell.body.innerHTML = `
    <div class="doc-search"><input data-query type="search" placeholder="Поиск документа"></div>
    <div class="doc-list-min" data-list></div>
  `;

  shell.foot.innerHTML = `
    <div class="doc-muted-note" data-count></div>
    <div style="display:flex;gap:8px">
      <button class="doc-btn" data-cancel>Отмена</button>
      <button class="doc-btn doc-btn-primary" data-save>Сохранить</button>
    </div>
  `;

  const listEl = shell.body.querySelector('[data-list]');
  const countEl = shell.foot.querySelector('[data-count]');

  function renderList() {
    const q = query.trim().toLowerCase();
    const rows = editableDocs.filter((doc) => {
      if (!q) return true;
      const hay = `${doc.title || ''} ${doc.description || ''}`.toLowerCase();
      return hay.includes(q);
    });

    if (!rows.length) {
      listEl.innerHTML = `<div class="doc-muted-note">Документы не найдены.</div>`;
      countEl.textContent = `Выбрано: ${selected.size} из ${editableDocs.filter((d) => d.scope !== 'team').length}`;
      return;
    }

    listEl.innerHTML = rows.map((doc) => {
      const id = asId(doc.id);
      const disabled = doc.scope === 'team';
      const checked = disabled || selected.has(id);
      return `
        <label class="doc-list-row ${disabled ? 'is-disabled' : ''}">
          <input type="checkbox" data-doc-id="${escapeHtml(id)}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
          <div>
            <div class="doc-person-name">${escapeHtml(doc.title || 'Без названия')}</div>
            <div class="doc-person-sub">${disabled ? 'документ открыт всей команде' : escapeHtml(doc.description || 'личный доступ')}</div>
          </div>
          <div class="doc-muted-note">${escapeHtml(doc.scope === 'team' ? 'team' : 'personal')}</div>
        </label>
      `;
    }).join('');

    listEl.querySelectorAll('input[data-doc-id]').forEach((input) => {
      input.addEventListener('change', () => {
        const id = asId(input.dataset.docId);
        if (!id) return;
        if (input.checked) selected.add(id);
        else selected.delete(id);
        renderList();
      });
    });

    countEl.textContent = `Выбрано: ${selected.size} из ${editableDocs.filter((d) => d.scope !== 'team').length}`;
  }

  shell.body.querySelector('[data-query]')?.addEventListener('input', (event) => {
    query = String(event.target.value || '');
    renderList();
  });

  shell.foot.querySelector('[data-cancel]')?.addEventListener('click', () => shell.close());
  shell.foot.querySelector('[data-save]')?.addEventListener('click', async (event) => {
    const updates = [];
    for (const doc of editableDocs) {
      if (doc.scope === 'team') continue;
      const id = asId(doc.id);
      const hasNow = selected.has(id);
      const had = initial.has(id);
      if (hasNow === had) continue;
      const next = new Set((doc.sharedWith || []).map((x) => asId(x)).filter(Boolean));
      if (hasNow) next.add(targetId);
      else next.delete(targetId);
      updates.push({
        id,
        sharedWith: [...next].sort(),
      });
    }

    const saveBtn = event.currentTarget;
    saveBtn.disabled = true;
    try {
      await onSave?.(updates);
      shell.close();
    } finally {
      saveBtn.disabled = false;
    }
  });

  renderList();
}
