// Pllato CRM — модуль Контакты.
// Список + поиск + форма добавления/редактирования + детальная карточка.
// Данные через Store (сейчас localStorage; позже Firebase RTDB).

import { Store } from "../store.js";
import { ICONS } from "../icons.js";
import { openCommunicate } from "../communicate.js";
import { parseImport, findDuplicate } from "../import_contacts.js";
import { getStages } from "../stages.js";

const COLLECTION = "contacts";

const SOURCES = [
  { id: "site",     label: "Сайт" },
  { id: "call",     label: "Звонок" },
  { id: "referral", label: "Реферал" },
  { id: "ads",      label: "Реклама" },
  { id: "other",    label: "Другое" },
];

function loadState() {
  try { return JSON.parse(sessionStorage.getItem("pllato_state_contacts") || "null") || {}; } catch { return {}; }
}
function saveState() {
  const { dupesModalOpen, importOpen, importData, ...persist } = state;
  sessionStorage.setItem("pllato_state_contacts", JSON.stringify(persist));
}
const _saved = loadState();
const state = {
  selectedId: _saved.selectedId || null,
  mode: "view",
  search: _saved.search || "",
  dupesModalOpen: false,
  importOpen: false,
  importData: null,        // { contacts: [...], createDeals: boolean }
};

function dealsForContact(cid) {
  return Store.list("deals").filter(d => d.contactId === cid);
}
function tasksForContact(cid) {
  return Store.list("tasks").filter(t => t.linkedTo?.type === "contact" && t.linkedTo?.id === cid);
}

function normEmail(s) { return (s || "").toLowerCase().trim(); }
function normPhone(s) { return (s || "").replace(/\D+/g, ""); }

// Находим пары дубликатов (по email или телефону)
function findDuplicates() {
  const contacts = Store.list(COLLECTION);
  const byEmail = {}, byPhone = {};
  contacts.forEach(c => {
    const e = normEmail(c.email);
    const p = normPhone(c.phone);
    if (e) (byEmail[e] = byEmail[e] || []).push(c);
    if (p) (byPhone[p] = byPhone[p] || []).push(c);
  });
  const pairs = [];
  const seen = new Set();
  function add(a, b, reason) {
    const key = [a.id, b.id].sort().join("|");
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push({ a, b, reason });
  }
  Object.values(byEmail).forEach(group => {
    if (group.length >= 2) for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) add(group[i], group[j], "email");
  });
  Object.values(byPhone).forEach(group => {
    if (group.length >= 2) for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) add(group[i], group[j], "phone");
  });
  return pairs;
}

function mergeContacts(winnerId, loserId) {
  const winner = Store.get(COLLECTION, winnerId);
  const loser = Store.get(COLLECTION, loserId);
  if (!winner || !loser) return;
  // Дозаполняем пустые поля winner-а из loser-а
  const patch = {};
  ["email", "phone", "company", "position", "source", "notes"].forEach(k => {
    if (!winner[k] && loser[k]) patch[k] = loser[k];
  });
  const tagsMerged = Array.from(new Set([...(winner.tags || []), ...(loser.tags || [])]));
  patch.tags = tagsMerged;
  Store.update(COLLECTION, winnerId, patch);
  // Переносим связанные сделки и задачи
  Store.list("deals").filter(d => d.contactId === loserId).forEach(d => Store.update("deals", d.id, { contactId: winnerId }));
  Store.list("tasks").filter(t => t.linkedTo?.type === "contact" && t.linkedTo?.id === loserId)
    .forEach(t => Store.update("tasks", t.id, { linkedTo: { type: "contact", id: winnerId } }));
  Store.remove(COLLECTION, loserId);
}

// Демо-данные при первом запуске
function seedDemo() {
  Store.seed(COLLECTION, [
    { name: "Алексей Иванов", email: "alex@example.com", phone: "+7 701 555 11 22",
      company: "Tech Solutions", position: "CTO", source: "referral", tags: ["VIP", "Tech"], notes: "Запросил демо CRM на 50 пользователей." },
    { name: "Мария Петрова", email: "maria@boutique.kz", phone: "+7 707 333 44 55",
      company: "Boutique Almaty", position: "Owner", source: "site", tags: ["retail"], notes: "Интересует модуль склада." },
    { name: "Сергей Ким", email: "skim@logistic.kz", phone: "+7 705 222 77 88",
      company: "Astana Logistics", position: "Sales Director", source: "ads", tags: ["B2B"], notes: "" },
  ]);
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function initialsOf(name) {
  const parts = (name || "").trim().split(/\s+/);
  return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
}
function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function sourceLabel(id) {
  return SOURCES.find(s => s.id === id)?.label || "—";
}
function matchesSearch(contact, q) {
  if (!q) return true;
  const hay = `${contact.name} ${contact.email} ${contact.phone} ${contact.company} ${(contact.tags || []).join(" ")}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

export function renderContacts(container) {
  seedDemo();

  const list = Store.list(COLLECTION).filter(c => matchesSearch(c, state.search));
  if (!state.selectedId && list.length) state.selectedId = list[0].id;
  const selected = state.selectedId ? Store.get(COLLECTION, state.selectedId) : null;

  const dupes = findDuplicates();
  container.innerHTML = `
    <div class="contacts-layout">
      <aside class="contacts-list-pane">
        <div class="list-toolbar">
          <div class="search-input">
            <span class="search-ico">${ICONS.search}</span>
            <input type="search" id="contactSearch" placeholder="Поиск по имени, email, тегу…" value="${escape(state.search)}">
          </div>
          <button class="btn-ghost icon-only" id="importContacts" title="Импорт контактов">⬆</button>
          <button class="btn-primary" id="newContact">${ICONS.plus}<span>Контакт</span></button>
        </div>
        <div class="list-meta">
          ${list.length} ${pluralRu(list.length, "контакт", "контакта", "контактов")}
          ${dupes.length > 0 ? `<button class="dupes-badge" id="openDupes" title="Найдены дубликаты">${ICONS.merge} ${dupes.length}</button>` : ""}
        </div>
        <div class="contacts-list" id="contactsList">
          ${list.length === 0 ? renderEmpty(state.search) : list.map(c => renderListItem(c, c.id === state.selectedId)).join("")}
        </div>
      </aside>

      <section class="contacts-detail-pane">
        ${state.mode === "create"
          ? renderForm(null)
          : state.mode === "edit" && selected
            ? renderForm(selected)
            : selected
              ? renderDetail(selected)
              : renderNothing()}
      </section>

      ${state.dupesModalOpen ? renderDupesModal(dupes) : ""}
      ${state.importOpen ? renderImportModal() : ""}
    </div>
  `;

  wireEvents(container);
}

function pluralRu(n, one, few, many) {
  n = Math.abs(n) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return many;
  if (n1 > 1 && n1 < 5) return few;
  if (n1 === 1) return one;
  return many;
}

function renderListItem(c, active) {
  const tags = (c.tags || []).slice(0, 2).map(t => `<span class="chip-mini">${escape(t)}</span>`).join("");
  const dealsCount = dealsForContact(c.id).length;
  return `
    <button class="contact-row ${active ? "active" : ""}" data-id="${c.id}">
      <div class="avatar avatar-sm">${initialsOf(c.name)}</div>
      <div class="contact-row-body">
        <div class="contact-row-name">${escape(c.name || "(без имени)")}</div>
        <div class="contact-row-sub">${escape(c.company || c.email || "")}</div>
        ${tags || dealsCount > 0 ? `<div class="contact-row-tags">${tags}${dealsCount > 0 ? `<span class="chip-mini chip-mini-accent">${dealsCount} ${pluralRu(dealsCount, "сделка", "сделки", "сделок")}</span>` : ""}</div>` : ""}
      </div>
    </button>
  `;
}

function renderEmpty(searchQuery) {
  if (searchQuery) {
    return `
      <div class="list-empty">
        <div class="list-empty-ico">${ICONS.search}</div>
        <div>Ничего не найдено по «${escape(searchQuery)}»</div>
      </div>
    `;
  }
  return `
    <div class="list-empty">
      <div class="list-empty-ico">${ICONS.users}</div>
      <div>Контактов пока нет.<br>Нажми «Контакт» сверху, чтобы добавить первый.</div>
    </div>
  `;
}

function renderNothing() {
  return `
    <div class="detail-empty">
      <div class="detail-empty-ico">${ICONS.users}</div>
      <h3>Выбери контакт слева</h3>
      <p>Или добавь новый — кнопка «Контакт» в шапке списка.</p>
    </div>
  `;
}

function renderDetail(c) {
  const tags = (c.tags || []).map(t => `<span class="chip">${escape(t)}</span>`).join("");
  return `
    <div class="detail-card">
      <div class="detail-header">
        <div class="avatar avatar-lg">${initialsOf(c.name)}</div>
        <div class="detail-title">
          <h2>${escape(c.name || "(без имени)")}</h2>
          <div class="detail-sub">
            ${c.position ? escape(c.position) : ""}${c.position && c.company ? " · " : ""}${c.company ? escape(c.company) : ""}
          </div>
        </div>
        <div class="detail-actions">
          <button class="btn-ghost icon-only" id="editContact" title="Изменить" aria-label="Изменить">${ICONS.edit}</button>
          <button class="btn-ghost icon-only danger" id="deleteContact" title="Удалить" aria-label="Удалить">${ICONS.trash}</button>
        </div>
      </div>

      <div class="detail-grid">
        ${c.email ? row(ICONS.mail, "Email", `<a href="mailto:${escape(c.email)}">${escape(c.email)}</a>
          <span class="comm-btn-group">
            <button class="comm-btn" data-comm-email="${escape(c.email)}" data-comm-name="${escape(c.name || "")}" data-comm-contact="${escape(c.id)}" title="Письмо через канал">✉</button>
          </span>`) : ""}
        ${c.phone ? row(ICONS.phone, "Телефон", `<a href="tel:${escape(c.phone)}">${escape(c.phone)}</a>
          <span class="comm-btn-group">
            <button class="comm-btn" data-comm-call="${escape(c.phone)}" data-comm-name="${escape(c.name || "")}" data-comm-contact="${escape(c.id)}" title="Позвонить через канал">📞</button>
            <button class="comm-btn" data-comm-wa="${escape(c.phone)}" data-comm-name="${escape(c.name || "")}" data-comm-contact="${escape(c.id)}" title="WhatsApp">💬</button>
          </span>`) : ""}
        ${c.company ? row(ICONS.building, "Компания", escape(c.company)) : ""}
        ${row(ICONS.dashboard, "Источник", sourceLabel(c.source))}
      </div>

      ${tags ? `<div class="detail-section"><div class="detail-section-title">Теги</div><div class="chips">${tags}</div></div>` : ""}

      ${(() => {
        const deals = dealsForContact(c.id);
        if (deals.length === 0) return "";
        return `<div class="detail-section">
          <div class="detail-section-title">Сделки (${deals.length})</div>
          <div class="related-deals">
            ${deals.map(d => `
              <a class="related-deal" href="#crm/${d.id}">
                <span class="related-deal-title">${escape(d.title)}</span>
                <span class="related-deal-amount">${new Intl.NumberFormat("ru-RU").format(d.amount || 0)} ₸</span>
              </a>
            `).join("")}
          </div>
        </div>`;
      })()}

      ${c.notes ? `<div class="detail-section"><div class="detail-section-title">Заметки</div><div class="notes">${escape(c.notes).replace(/\n/g, "<br>")}</div></div>` : ""}

      <div class="detail-footer">
        <span>Добавлен: ${fmtDate(c.createdAt)}</span>
        ${c.updatedAt && c.updatedAt !== c.createdAt ? `<span> · Обновлён: ${fmtDate(c.updatedAt)}</span>` : ""}
      </div>
    </div>
  `;
}

function runImportParse(container, text) {
  const parsed = parseImport(text);
  const existing = Store.list(COLLECTION);
  // помечаем дубликаты
  parsed.forEach(c => { if (findDuplicate(c, existing)) c._dupe = true; });
  state.importData = { contacts: parsed, createDeals: true, skipDupes: true };
  renderContacts(container);
}

function confirmImport(container) {
  const data = state.importData;
  if (!data) return;
  const stages = getStages();
  const firstStage = stages[0]?.id || "new";
  let createdContacts = 0, createdDeals = 0;
  data.contacts.forEach(c => {
    if (c._dupe && data.skipDupes !== false) return;
    const { _dupe, ...payload } = c;
    const created = Store.create(COLLECTION, {
      name: payload.name || "(без имени)",
      email: payload.email || "",
      phone: payload.phone || "",
      company: payload.company || "",
      position: payload.position || "",
      source: "import",
      tags: payload.tags || [],
      notes: payload.notes || "",
    });
    createdContacts++;
    if (data.createDeals) {
      Store.create("deals", {
        title: created.name,
        amount: 0,
        stage: firstStage,
        contactId: created.id,
        dueDate: null,
        notes: "",
      });
      createdDeals++;
    }
  });
  alert(`Импортировано: ${createdContacts} контактов${data.createDeals ? `, ${createdDeals} сделок` : ""}.`);
  state.importOpen = false;
  state.importData = null;
  renderContacts(container);
}

function renderImportModal() {
  const data = state.importData;
  const existing = Store.list(COLLECTION);
  return `
    <div class="modal-backdrop" id="importBackdrop">
      <div class="modal modal-xl" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h2>Импорт контактов</h2>
          <button class="btn-ghost icon-only" id="closeImport">${ICONS.x}</button>
        </header>
        <div class="import-body">
          ${!data ? `
            <div class="import-step1">
              <p class="settings-hint">Загрузи CSV/TXT файл или просто вставь текст со списком клиентов. Распознаются имена, телефоны, email — даже из «грязных» данных.</p>
              <div class="import-drop" id="importDrop">
                <div>📁 Перетащи файл сюда или</div>
                <label class="btn-primary" style="display:inline-flex;cursor:pointer;width:auto;margin-top:10px;">
                  Выбрать файл
                  <input type="file" id="importFile" style="display:none" accept=".csv,.tsv,.txt,.vcf">
                </label>
              </div>
              <div style="text-align:center;color:var(--text-dim);font-size:12px;margin:14px 0;">или</div>
              <textarea id="importText" rows="6" placeholder="Иван Иванов, +7 701 555 1122, ivan@example.com&#10;Мария Петрова +7 707 333 4455"></textarea>
              <button class="btn-primary" id="importParse" style="margin-top:10px;width:auto;">Распознать</button>
            </div>
          ` : `
            <div class="import-step2">
              <div class="import-summary">
                <strong>Найдено: ${data.contacts.length}</strong>
                ${data.contacts.filter(c => c._dupe).length > 0 ? ` · <span style="color:var(--warning)">дубликатов: ${data.contacts.filter(c => c._dupe).length}</span>` : ""}
              </div>
              <div class="import-options">
                <label class="checkbox-label">
                  <input type="checkbox" id="optCreateDeals" ${data.createDeals ? "checked" : ""}>
                  <span>Создать сделку для каждого нового контакта (стадия «${escape(getStages()[0]?.title || "Новые")}»)</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" id="optSkipDupes" ${data.skipDupes !== false ? "checked" : ""}>
                  <span>Пропустить дубликаты (по email/телефону)</span>
                </label>
              </div>
              <div class="import-list">
                ${data.contacts.slice(0, 50).map((c, i) => `
                  <div class="import-row ${c._dupe ? "dupe" : ""}">
                    <span class="import-i">${i + 1}</span>
                    <div class="import-cell">
                      <div class="import-name">${escape(c.name || "(без имени)")}</div>
                      <div class="import-sub">${escape(c.phone || "")} ${c.email ? "· " + escape(c.email) : ""} ${c.company ? "· " + escape(c.company) : ""}</div>
                    </div>
                    ${c._dupe ? `<span class="import-badge">дубликат</span>` : ""}
                  </div>
                `).join("")}
                ${data.contacts.length > 50 ? `<div class="import-more">…и ещё ${data.contacts.length - 50}</div>` : ""}
              </div>
              <div class="form-buttons">
                <button class="btn-ghost" id="importBack">Назад</button>
                <button class="btn" id="importConfirm">Импортировать ${data.contacts.filter(c => !c._dupe || data.skipDupes === false).length}</button>
              </div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderDupesModal(dupes) {
  if (dupes.length === 0) {
    return `
      <div class="modal-backdrop" id="dupesBackdrop">
        <div class="modal" style="max-width:480px;" role="dialog" aria-modal="true">
          <header class="modal-header">
            <h2>Дубликаты не найдены</h2>
            <button class="btn-ghost icon-only" id="closeDupes">${ICONS.x}</button>
          </header>
          <div style="padding:24px;color:var(--text-muted);text-align:center">
            Все контакты уникальны.
          </div>
        </div>
      </div>
    `;
  }
  return `
    <div class="modal-backdrop" id="dupesBackdrop">
      <div class="modal" style="max-width:680px;" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h2>Дубликаты (${dupes.length})</h2>
          <button class="btn-ghost icon-only" id="closeDupes">${ICONS.x}</button>
        </header>
        <div class="dupes-list">
          ${dupes.map((p, i) => `
            <div class="dupe-pair" data-i="${i}">
              <div class="dupe-reason">Совпадает: ${p.reason === "email" ? "email" : "телефон"}</div>
              <div class="dupe-cards">
                <label class="dupe-card">
                  <input type="radio" name="dupe-${i}" value="a" checked>
                  <div class="dupe-card-body">
                    <div class="dupe-name">${escape(p.a.name)}</div>
                    <div class="dupe-meta">${escape(p.a.email || "")} ${p.a.phone ? "· " + escape(p.a.phone) : ""}</div>
                    <div class="dupe-meta">${dealsForContact(p.a.id).length} сделок · добавлен ${fmtDate(p.a.createdAt)}</div>
                  </div>
                </label>
                <label class="dupe-card">
                  <input type="radio" name="dupe-${i}" value="b">
                  <div class="dupe-card-body">
                    <div class="dupe-name">${escape(p.b.name)}</div>
                    <div class="dupe-meta">${escape(p.b.email || "")} ${p.b.phone ? "· " + escape(p.b.phone) : ""}</div>
                    <div class="dupe-meta">${dealsForContact(p.b.id).length} сделок · добавлен ${fmtDate(p.b.createdAt)}</div>
                  </div>
                </label>
              </div>
              <button class="btn-primary dupe-merge-btn" data-merge="${i}" data-a="${p.a.id}" data-b="${p.b.id}">
                ${ICONS.merge}<span>Объединить</span>
              </button>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function row(icon, label, value) {
  return `
    <div class="detail-row">
      <span class="detail-row-ico">${icon}</span>
      <div>
        <div class="detail-row-label">${label}</div>
        <div class="detail-row-value">${value}</div>
      </div>
    </div>
  `;
}

function renderForm(c) {
  const isNew = !c;
  c = c || { name: "", email: "", phone: "", company: "", position: "", source: "site", tags: [], notes: "" };
  return `
    <form class="detail-card form-card" id="contactForm">
      <div class="form-header">
        <h2>${isNew ? "Новый контакт" : "Редактирование"}</h2>
        <button type="button" class="btn-ghost" id="cancelForm">${ICONS.x}</button>
      </div>

      <div class="form-grid">
        <div class="field">
          <label>Имя *</label>
          <input name="name" required value="${escape(c.name)}" placeholder="Имя и фамилия">
        </div>
        <div class="field">
          <label>Компания</label>
          <input name="company" value="${escape(c.company)}" placeholder="Название компании">
        </div>
        <div class="field">
          <label>Должность</label>
          <input name="position" value="${escape(c.position)}" placeholder="CEO, менеджер…">
        </div>
        <div class="field">
          <label>Источник</label>
          <select name="source">
            ${SOURCES.map(s => `<option value="${s.id}" ${c.source === s.id ? "selected" : ""}>${s.label}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>Email</label>
          <input name="email" type="email" value="${escape(c.email)}" placeholder="email@example.com">
        </div>
        <div class="field">
          <label>Телефон</label>
          <input name="phone" type="tel" value="${escape(c.phone)}" placeholder="+7 …">
        </div>
        <div class="field field-wide">
          <label>Теги (через запятую)</label>
          <input name="tags" value="${escape((c.tags || []).join(", "))}" placeholder="VIP, retail, B2B">
        </div>
        <div class="field field-wide">
          <label>Заметки</label>
          <textarea name="notes" rows="4" placeholder="Что важно помнить о клиенте…">${escape(c.notes)}</textarea>
        </div>
      </div>

      <div class="form-footer">
        <button type="button" class="btn-ghost" id="cancelFormBtn">Отмена</button>
        <button type="submit" class="btn">${isNew ? "Создать" : "Сохранить"}</button>
      </div>
    </form>
  `;
}

function wireEvents(container) {
  // ===== Импорт =====
  container.querySelector("#importContacts")?.addEventListener("click", () => {
    state.importOpen = true;
    state.importData = null;
    renderContacts(container);
  });
  container.querySelector("#closeImport")?.addEventListener("click", () => {
    state.importOpen = false; state.importData = null; renderContacts(container);
  });
  container.querySelector("#importBackdrop")?.addEventListener("click", e => {
    if (e.target.id === "importBackdrop") { state.importOpen = false; state.importData = null; renderContacts(container); }
  });
  // Шаг 1: загрузка файла или вставка текста
  const fileInput = container.querySelector("#importFile");
  fileInput?.addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    runImportParse(container, text);
  });
  const drop = container.querySelector("#importDrop");
  if (drop) {
    drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", async e => {
      e.preventDefault(); drop.classList.remove("over");
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const text = await file.text();
      runImportParse(container, text);
    });
  }
  container.querySelector("#importParse")?.addEventListener("click", () => {
    const text = container.querySelector("#importText")?.value || "";
    runImportParse(container, text);
  });
  // Шаг 2: подтверждение
  container.querySelector("#importBack")?.addEventListener("click", () => {
    state.importData = null; renderContacts(container);
  });
  container.querySelector("#optCreateDeals")?.addEventListener("change", e => {
    if (state.importData) state.importData.createDeals = e.target.checked;
  });
  container.querySelector("#optSkipDupes")?.addEventListener("change", e => {
    if (state.importData) { state.importData.skipDupes = e.target.checked; renderContacts(container); }
  });
  container.querySelector("#importConfirm")?.addEventListener("click", () => {
    confirmImport(container);
  });

  // Кнопки коммуникации (email / call / WhatsApp)
  container.querySelectorAll("[data-comm-email]").forEach(b => b.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation();
    openCommunicate({ type: "email", to: b.dataset.commEmail, contactName: b.dataset.commName,
      context: { collection: "contact_activities", fk: { contactId: b.dataset.commContact } } });
  }));
  container.querySelectorAll("[data-comm-call]").forEach(b => b.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation();
    openCommunicate({ type: "call", to: b.dataset.commCall, contactName: b.dataset.commName,
      context: { collection: "contact_activities", fk: { contactId: b.dataset.commContact } } });
  }));
  container.querySelectorAll("[data-comm-wa]").forEach(b => b.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation();
    openCommunicate({ type: "whatsapp", to: b.dataset.commWa, contactName: b.dataset.commName,
      context: { collection: "contact_activities", fk: { contactId: b.dataset.commContact } } });
  }));

  // Кнопка дубликатов
  container.querySelector("#openDupes")?.addEventListener("click", () => {
    state.dupesModalOpen = true;
    renderContacts(container);
  });
  container.querySelector("#closeDupes")?.addEventListener("click", () => {
    state.dupesModalOpen = false;
    renderContacts(container);
  });
  container.querySelector("#dupesBackdrop")?.addEventListener("click", e => {
    if (e.target.id === "dupesBackdrop") {
      state.dupesModalOpen = false;
      renderContacts(container);
    }
  });
  container.querySelectorAll("[data-merge]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = btn.dataset.merge;
      const checked = container.querySelector(`input[name="dupe-${i}"]:checked`);
      const winner = checked?.value === "b" ? btn.dataset.b : btn.dataset.a;
      const loser = winner === btn.dataset.a ? btn.dataset.b : btn.dataset.a;
      if (!confirm("Объединить контакты? Связанные сделки и задачи перейдут к выбранному.")) return;
      mergeContacts(winner, loser);
      renderContacts(container);
    });
  });

  const search = container.querySelector("#contactSearch");
  if (search) {
    search.addEventListener("input", e => {
      state.search = e.target.value;
      renderContacts(container);
      // вернуть фокус в поле поиска
      const again = container.querySelector("#contactSearch");
      if (again) {
        again.focus();
        again.setSelectionRange(state.search.length, state.search.length);
      }
    });
  }

  container.querySelectorAll(".contact-row").forEach(el => {
    el.addEventListener("click", () => {
      state.selectedId = el.dataset.id;
      state.mode = "view";
      saveState();
      renderContacts(container);
    });
  });

  const newBtn = container.querySelector("#newContact");
  if (newBtn) newBtn.addEventListener("click", () => {
    state.mode = "create";
    state.selectedId = null;
    renderContacts(container);
  });

  const editBtn = container.querySelector("#editContact");
  if (editBtn) editBtn.addEventListener("click", () => {
    state.mode = "edit";
    renderContacts(container);
  });

  const delBtn = container.querySelector("#deleteContact");
  if (delBtn) delBtn.addEventListener("click", () => {
    const c = Store.get(COLLECTION, state.selectedId);
    if (!c) return;
    if (confirm(`Удалить контакт «${c.name}»?`)) {
      Store.remove(COLLECTION, state.selectedId);
      state.selectedId = null;
      state.mode = "view";
      renderContacts(container);
    }
  });

  const cancelBtns = container.querySelectorAll("#cancelForm, #cancelFormBtn");
  cancelBtns.forEach(b => b.addEventListener("click", () => {
    state.mode = "view";
    renderContacts(container);
  }));

  const form = container.querySelector("#contactForm");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = {
        name: (fd.get("name") || "").trim(),
        company: (fd.get("company") || "").trim(),
        position: (fd.get("position") || "").trim(),
        email: (fd.get("email") || "").trim(),
        phone: (fd.get("phone") || "").trim(),
        source: fd.get("source") || "site",
        tags: (fd.get("tags") || "").split(",").map(s => s.trim()).filter(Boolean),
        notes: (fd.get("notes") || "").trim(),
      };
      if (!data.name) return;

      if (state.mode === "edit" && state.selectedId) {
        Store.update(COLLECTION, state.selectedId, data);
      } else {
        const created = Store.create(COLLECTION, data);
        state.selectedId = created.id;
      }
      state.mode = "view";
      renderContacts(container);
    });
  }
}
