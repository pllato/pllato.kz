import { Store } from "../store.js";
import { ICONS } from "../icons.js";
import { openCommunicate } from "../communicate.js";
import { parseImport, findDuplicate } from "../import_contacts.js";
import { getStages, findStage } from "../stages.js";
import { currentEmployee, getEmployee, avatar } from "../employees.js";
import { listChannels } from "../channels.js";
import {
  waCloudEnabled,
  syncWaCollections,
  resolveOrCreateDirectWaChat,
  messagesForChat,
  renderMessageMedia,
  sendWaFromDialog,
} from "../wa_dialog.js";

const COLLECTION = "contacts";
const CONTACT_ACTIVITIES = "contact_activities";

const SOURCES = [
  { id: "site", label: "Сайт" },
  { id: "call", label: "Звонок" },
  { id: "referral", label: "Рекомендация" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "dealers", label: "Дилеры" },
];

function loadState() {
  try {
    return JSON.parse(sessionStorage.getItem("pllato_state_contacts") || "null") || {};
  } catch {
    return {};
  }
}

const _saved = loadState();
const state = {
  selectedId: _saved.selectedId || null,
  search: _saved.search || "",
  formOpen: false,
  formMode: "create",
  formId: null,
  formDraft: null,
  activityFilter: "all",
  noteOpen: false,
  noteText: "",
  dupesModalOpen: false,
  importOpen: false,
  importData: null,
  waFloat: { open: false, contactId: null, mediaOpen: false, searchOpen: false, searchQuery: "", draftText: "" },
  chatSyncing: false,
  chatSyncTimer: null,
};

function saveState() {
  sessionStorage.setItem(
    "pllato_state_contacts",
    JSON.stringify({
      selectedId: state.selectedId,
      search: state.search,
    }),
  );
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function initialsOf(name) {
  const parts = String(name || "").trim().split(/\s+/);
  return `${parts[0]?.[0] || "?"}${parts[1]?.[0] || ""}`.toUpperCase();
}

function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDayMonth(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function fmtTimeShort(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function fmtAmount(n) {
  if (!n && n !== 0) return "—";
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n)} ₸`;
}

function fmtChatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function pluralRu(n, one, few, many) {
  const v = Math.abs(n) % 100;
  const d = v % 10;
  if (v > 10 && v < 20) return many;
  if (d > 1 && d < 5) return few;
  if (d === 1) return one;
  return many;
}

function sourceLabel(id) {
  return SOURCES.find((s) => s.id === id)?.label || id || "—";
}

function normalizeSourceName(row) {
  if (typeof row === "string") return row.trim();
  if (!row || typeof row !== "object") return "";
  return String(row.title || row.name || row.label || row.value || "").trim();
}

function contactSourceOptions() {
  const rows = Store.list("customer_sources");
  const values = rows.map(normalizeSourceName).filter(Boolean);
  const unique = Array.from(new Set(values));
  return unique.length ? unique : ["WhatsApp", "Звонок", "Рекомендация", "Сайт", "Дилеры"];
}

function defaultDraft() {
  return {
    type: "individual",
    name: "",
    company: "",
    position: "",
    phone: "",
    email: "",
    source: contactSourceOptions()[0] || "",
    note: "",
    tagsText: "",
  };
}

function dealsForContact(cid) {
  return Store.list("deals").filter((d) => d.contactId === cid);
}

function createLeadDealForContact(contact, { source = "contact" } = {}) {
  if (!contact?.id) return null;
  const stages = getStages();
  const firstStage = stages[0]?.id || "new";
  return Store.create("deals", {
    title: contact.name || "Новая сделка",
    amount: 0,
    stage: firstStage,
    contactId: contact.id,
    dueDate: null,
    notes:
      source === "import"
        ? "Сделка создана автоматически из импорта контактов."
        : "Сделка создана автоматически из карточки контакта.",
  });
}

function normEmail(s) {
  return String(s || "").toLowerCase().trim();
}

function normPhone(s) {
  return String(s || "").replace(/\D+/g, "");
}

function findDuplicates() {
  const contacts = Store.list(COLLECTION);
  const byEmail = {};
  const byPhone = {};

  contacts.forEach((c) => {
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

  Object.values(byEmail).forEach((group) => {
    if (group.length < 2) return;
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) add(group[i], group[j], "email");
    }
  });

  Object.values(byPhone).forEach((group) => {
    if (group.length < 2) return;
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) add(group[i], group[j], "phone");
    }
  });

  return pairs;
}

function mergeContacts(winnerId, loserId) {
  const winner = Store.get(COLLECTION, winnerId);
  const loser = Store.get(COLLECTION, loserId);
  if (!winner || !loser) return;

  const patch = {};
  ["email", "phone", "company", "position", "source", "notes", "note", "type"].forEach((key) => {
    if (!winner[key] && loser[key]) patch[key] = loser[key];
  });
  patch.tags = Array.from(new Set([...(winner.tags || []), ...(loser.tags || [])]));

  Store.update(COLLECTION, winnerId, patch);

  Store.list("deals")
    .filter((d) => d.contactId === loserId)
    .forEach((d) => Store.update("deals", d.id, { contactId: winnerId }));

  Store.list("tasks")
    .filter((t) => t.linkedTo?.type === "contact" && t.linkedTo?.id === loserId)
    .forEach((t) => Store.update("tasks", t.id, { linkedTo: { type: "contact", id: winnerId } }));

  Store.list(CONTACT_ACTIVITIES)
    .filter((a) => a.contactId === loserId)
    .forEach((a) => Store.update(CONTACT_ACTIVITIES, a.id, { contactId: winnerId }));

  Store.remove(COLLECTION, loserId);
}

function seedDemo() {
  Store.seed(COLLECTION, [
    {
      name: "Алексей Иванов",
      email: "alex@example.com",
      phone: "+7 701 555 11 22",
      company: "Tech Solutions",
      position: "CTO",
      source: "Рекомендация",
      tags: ["VIP", "Tech"],
      note: "Запросил демо CRM на 50 пользователей.",
      type: "individual",
    },
    {
      name: "Мария Петрова",
      email: "maria@boutique.kz",
      phone: "+7 707 333 44 55",
      company: "Boutique Almaty",
      position: "Owner",
      source: "Сайт",
      tags: ["retail"],
      note: "Интересует модуль склада.",
      type: "individual",
    },
    {
      name: "Сергей Ким",
      email: "skim@logistic.kz",
      phone: "+7 705 222 77 88",
      company: "Astana Logistics",
      position: "Sales Director",
      source: "Реклама",
      tags: ["B2B"],
      note: "",
      type: "individual",
    },
  ]);
}

function textNorm(v) {
  return String(v ?? "").toLowerCase();
}

function matchesSearch(contact, query) {
  if (!query) return true;
  const hay = [
    contact.name,
    contact.email,
    contact.phone,
    contact.company,
    contact.position,
    contact.source,
    contact.note,
    (contact.tags || []).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(query.toLowerCase());
}

function hashContactId() {
  const m = (location.hash || "").match(/^#contacts\/(.+)$/);
  return m ? m[1] : null;
}

function ensureSelected(contacts) {
  const allIds = new Set(contacts.map((c) => c.id));
  const fromHash = hashContactId();
  if (fromHash && allIds.has(fromHash)) {
    state.selectedId = fromHash;
  }
  if (state.selectedId && !allIds.has(state.selectedId)) {
    state.selectedId = null;
  }
  if (!state.selectedId && contacts.length) {
    state.selectedId = contacts[0].id;
  }
}

function setHashForSelected(id) {
  if (!id) {
    if ((location.hash || "").startsWith("#contacts/")) location.hash = "#contacts";
    return;
  }
  const next = `#contacts/${id}`;
  if ((location.hash || "") !== next) {
    history.replaceState(null, "", next);
  }
}

function activityMatchesFilter(a, filter) {
  if (!a) return false;
  if (filter === "wa") return a.type === "whatsapp";
  if (filter === "call") return a.type === "call";
  if (filter === "note") return a.type === "note";
  return true;
}

function activitiesForContact(contact) {
  if (!contact?.id) return [];
  const dealIds = new Set(dealsForContact(contact.id).map((d) => d.id));
  const dealActs = Store.list("deal_activities")
    .filter((a) => a.dealId && dealIds.has(a.dealId))
    .map((a) => ({ ...a, _origin: "deal" }));

  const directActs = Store.list(CONTACT_ACTIVITIES)
    .filter((a) => a.contactId === contact.id)
    .map((a) => ({ ...a, _origin: "contact" }));

  return [...dealActs, ...directActs].sort((a, b) => (b.ts || b.createdAt || 0) - (a.ts || a.createdAt || 0));
}

function activityCounts(activities) {
  const counts = { all: activities.length, wa: 0, call: 0, note: 0 };
  activities.forEach((a) => {
    if (a.type === "whatsapp") counts.wa += 1;
    if (a.type === "call") counts.call += 1;
    if (a.type === "note") counts.note += 1;
  });
  return counts;
}

function renderActivityTabs(activities) {
  const current = state.activityFilter || "all";
  const counts = activityCounts(activities);
  const tabs = [
    { id: "all", label: "Все", count: counts.all },
    { id: "wa", label: "WhatsApp", count: counts.wa },
    { id: "call", label: "Звонки", count: counts.call },
    { id: "note", label: "Заметки", count: counts.note },
  ];
  return `
    <div class="timeline-filters contact-activity-tabs" id="contactActivityTabs">
      ${tabs
        .map(
          (tab) => `
            <button type="button" class="timeline-filter-btn ${current === tab.id ? "active" : ""}" data-contact-filter="${tab.id}">
              <span>${tab.label}</span>
              ${tab.count > 0 ? `<span class="timeline-filter-count">●${tab.count}</span>` : ""}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function stageTitleById(stageId) {
  if (!stageId) return "";
  return findStage(stageId)?.title || String(stageId);
}

function renderActivity(activity) {
  const author = getEmployee(activity.authorId);
  const by = escape(author?.name || "Я");
  const time = fmtTimeShort(activity.ts || activity.createdAt);
  const type = activity.type || "note";

  if (type === "stage") {
    const from = stageTitleById(activity.fromStage);
    const to = stageTitleById(activity.toStage);
    return `
      <div class="tl-stage-event">
        <span class="tl-stage-mark">↗</span>
        <span>Стадия: ${escape(from)} → ${escape(to)} · ${by}, ${escape(time)}</span>
      </div>
    `;
  }

  if (type === "deal_created") {
    return `
      <div class="tl-stage-event">
        <span class="tl-stage-mark">+</span>
        <span>Сделка создана · ${by}, ${escape(time)}</span>
      </div>
    `;
  }

  const icons = { note: "📝", email: "✉", task: "⚙", whatsapp: "💬", call: "📞" };
  const labels = { note: "Заметка", email: "Письмо", task: "Дело", whatsapp: "WhatsApp", call: "Звонок" };

  let body = "";
  if (type === "email") {
    body = `<div class="act-sub">→ ${escape(activity.to || "")}${activity.subject ? ` · ${escape(activity.subject)}` : ""}</div><div>${escape(activity.text || "").replace(/\n/g, "<br>")}</div>`;
  } else if (type === "task") {
    body = `<div class="act-task"><span class="act-task-title">${escape(activity.title || "")}</span>${activity.dueAt ? `<span class="act-task-due">⏰ ${fmtDate(activity.dueAt)}</span>` : ""}</div>`;
  } else {
    body = `<div>${escape(activity.text || "").replace(/\n/g, "<br>")}</div>`;
  }

  return `
    <div class="tl-item">
      <div class="tl-ico">${icons[type] || "•"}</div>
      <div class="tl-body">
        <div class="tl-head">
          <span class="tl-author">${by}</span>
          <span class="tl-type">${labels[type] || escape(type)}</span>
          <span class="tl-time">${fmtDate(activity.ts || activity.createdAt)}</span>
        </div>
        ${body}
      </div>
    </div>
  `;
}

function dayKey(ts) {
  const d = new Date(ts || Date.now());
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function waDayLabel(ts) {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (dayKey(ts) === dayKey(today.getTime())) return "сегодня";
  if (dayKey(ts) === dayKey(yesterday.getTime())) return "вчера";
  return fmtDayMonth(ts);
}

function messageSearchBlob(m) {
  const media = m?.media || {};
  return textNorm([m?.text, media?.caption, media?.fileName].filter(Boolean).join(" "));
}

function renderMessageStatus(m) {
  if (m?.from !== "me") return "";
  if (m.delivered) return `<span class="msg-status delivered">✓✓</span>`;
  if (m.sent || m.ts || m.createdAt) return `<span class="msg-status">✓</span>`;
  return "";
}

function renderWaMessages(messages, searchQuery = "") {
  const query = textNorm(searchQuery || "").trim();
  const filtered = query
    ? (messages || []).filter((m) => messageSearchBlob(m).includes(query))
    : messages || [];

  if (filtered.length === 0) {
    return `<div class="chat-empty">${query ? "Поиск не дал результатов." : "Сообщений пока нет."}</div>`;
  }

  const asc = [...filtered].sort((a, b) => (a.ts || a.createdAt || 0) - (b.ts || b.createdAt || 0));
  let prev = "";

  return asc
    .map((m) => {
      const ts = m.ts || m.createdAt || Date.now();
      const key = dayKey(ts);
      const divider = key !== prev ? `<div class="wa-day-divider"><span>${escape(waDayLabel(ts))}</span></div>` : "";
      prev = key;
      return `${divider}
        <div class="msg ${m.from === "me" ? "me" : "them"}">
          <div class="msg-bubble">
            ${m.text ? `<div class="msg-text">${escape(m.text).replace(/\n/g, "<br>")}</div>` : ""}
            ${renderMessageMedia(m)}
          </div>
          <div class="msg-time">${fmtChatTime(ts)} ${renderMessageStatus(m)}</div>
        </div>
      `;
    })
    .join("");
}

function renderListItem(contact, active) {
  const subtitle = contact.company || contact.email || contact.phone || "";
  const tags = (contact.tags || [])
    .slice(0, 2)
    .map((tag) => `<span class="chip-mini">${escape(tag)}</span>`)
    .join("");
  const dealsCount = dealsForContact(contact.id).length;

  return `
    <button class="contact-row ${active ? "active" : ""}" data-id="${contact.id}">
      <div class="avatar avatar-sm">${escape(initialsOf(contact.name || "?"))}</div>
      <div class="contact-row-body">
        <div class="contact-row-name">${escape(contact.name || "(без имени)")}</div>
        <div class="contact-row-sub">${escape(subtitle)}</div>
        ${
          tags || dealsCount
            ? `<div class="contact-row-tags">${tags}${
                dealsCount
                  ? `<span class="chip-mini chip-mini-accent">${dealsCount} ${pluralRu(dealsCount, "сделка", "сделки", "сделок")}</span>`
                  : ""
              }</div>`
            : ""
        }
      </div>
    </button>
  `;
}

function renderLeftEmpty(search) {
  if (search) {
    return `
      <div class="list-empty">
        <div class="list-empty-ico">${ICONS.search}</div>
        <div>Ничего не найдено по «${escape(search)}»</div>
      </div>
    `;
  }
  return `
    <div class="list-empty">
      <div class="list-empty-ico">${ICONS.users}</div>
      <div>Контактов пока нет</div>
    </div>
  `;
}

function renderGlobalEmpty() {
  return `
    <div class="detail-empty contact-global-empty">
      <div class="detail-empty-ico">${ICONS.users}</div>
      <h3>Пока пусто</h3>
      <p>Создай первый контакт вручную или импортируй базу из файла.</p>
      <div class="contact-empty-actions">
        <button type="button" class="btn-primary" id="emptyNewContact">${ICONS.plus}<span>Создать контакт</span></button>
        <button type="button" class="btn-ghost" id="emptyImport">Импорт CSV</button>
      </div>
    </div>
  `;
}

function renderNothing() {
  return `
    <div class="detail-empty">
      <div class="detail-empty-ico">${ICONS.users}</div>
      <h3>Выбери контакт слева</h3>
      <p>Или создай новый контакт.</p>
    </div>
  `;
}

function renderInfoCell(icon, label, value) {
  return `
    <div class="contact-info-cell">
      <div class="contact-info-label">${icon}<span>${label}</span></div>
      <div class="contact-info-value">${value || "—"}</div>
    </div>
  `;
}

function renderDetail(contact) {
  const compactId = String(contact.id || "").slice(-6);
  const created = fmtDayMonth(contact.createdAt);
  const subtitle = [contact.position, contact.company].filter(Boolean).join(" · ");
  const tags = (contact.tags || []).map((tag) => `<span class="chip">${escape(tag)}</span>`).join("");

  const deals = dealsForContact(contact.id);
  const allActs = activitiesForContact(contact);
  const shownActs = allActs.filter((a) => activityMatchesFilter(a, state.activityFilter));

  return `
    <div class="detail-card contact-detail-card">
      <header class="contact-detail-head">
        <div class="avatar avatar-lg">${escape(initialsOf(contact.name || "?"))}</div>
        <div class="contact-head-text">
          <div class="contact-meta-line">Контакт #${escape(compactId)}${created ? ` · добавлен ${escape(created)}` : ""}</div>
          <h2>${escape(contact.name || "(без имени)")}</h2>
          <div class="detail-sub">${escape(subtitle || "Без должности и компании")}</div>
        </div>
        <div class="contact-head-actions">
          <button type="button" class="btn-ghost icon-only" id="editContact" title="Изменить">${ICONS.edit}</button>
          <button type="button" class="btn-ghost icon-only danger" id="deleteContact" title="Удалить">${ICONS.trash}</button>
        </div>
      </header>

      <section class="contact-info-grid">
        ${renderInfoCell(ICONS.phone, "Телефон", contact.phone ? escape(contact.phone) : "—")}
        ${renderInfoCell(ICONS.mail, "Email", contact.email ? `<a href="mailto:${escapeAttr(contact.email)}">${escape(contact.email)}</a>` : "—")}
        ${renderInfoCell(ICONS.building, "Компания", escape(contact.company || "—"))}
        ${renderInfoCell(ICONS.dashboard, "Источник", escape(sourceLabel(contact.source)))}
      </section>

      ${tags ? `<section class="contact-tags-row">${tags}</section>` : ""}

      <section class="contact-related-deals">
        <div class="contact-related-head">
          <span>Сделки</span>
          <button type="button" class="btn-ghost btn-sm" id="createDealForContact">+ Сделка</button>
        </div>
        ${
          deals.length
            ? `<div class="contact-deals-list">${deals
                .map((d) => {
                  const stage = findStage(d.stage);
                  return `<a href="#crm/${d.id}" class="contact-deal-pill"><span class="dot" style="background:${stage?.color || "var(--accent)"}"></span><span class="title">${escape(d.title || "(без названия)")}</span><span class="sum">${fmtAmount(d.amount)}</span></a>`;
                })
                .join("")}</div>`
            : `<div class="contact-deals-empty">Связанных сделок пока нет.</div>`
        }
      </section>

      <section class="contact-activity">
        ${renderActivityTabs(allActs)}
        ${
          state.noteOpen
            ? `
              <div class="contact-note-compose" id="contactNoteCompose">
                <textarea id="contactNoteText" rows="2" placeholder="Заметка по контакту...">${escape(state.noteText)}</textarea>
                <div class="contact-note-actions">
                  <button type="button" class="btn-ghost btn-sm" id="cancelContactNote">Отмена</button>
                  <button type="button" class="btn-primary btn-sm" id="saveContactNote">Сохранить</button>
                </div>
              </div>
            `
            : ""
        }
        <div class="timeline-list">
          ${
            shownActs.length
              ? shownActs.map((a) => renderActivity(a)).join("")
              : '<div class="tl-empty">Активности по контакту появятся здесь.</div>'
          }
        </div>
      </section>

      <footer class="deal-action-bar contact-action-bar">
        <button type="button" class="deal-action-btn" id="contactActionCall" ${contact.phone ? "" : "disabled"}>${ICONS.phone}<span>Позвонить</span></button>
        <button type="button" class="deal-action-btn deal-action-btn-primary" id="contactActionWA" ${contact.phone ? "" : "disabled"}><span class="dab-emoji">💬</span><span>WhatsApp</span></button>
        <button type="button" class="deal-action-btn" id="contactActionEmail" ${contact.email ? "" : "disabled"}>${ICONS.mail}<span>Письмо</span></button>
        <button type="button" class="deal-action-btn" id="contactActionNote"><span class="dab-emoji">📝</span><span>Заметка</span></button>
      </footer>
    </div>
  `;
}

function renderFormModal() {
  if (!state.formOpen) return "";

  const isEdit = state.formMode === "edit";
  const draft = { ...defaultDraft(), ...(state.formDraft || {}) };
  const isCompany = draft.type === "company";
  const sourceOptions = contactSourceOptions();

  return `
    <div class="modal-backdrop" id="contactFormBackdrop">
      <div class="modal" style="max-width:760px" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h2>${isEdit ? "Редактирование контакта" : "Новый контакт"}</h2>
          <button type="button" class="btn-ghost icon-only" id="closeContactForm">${ICONS.x}</button>
        </header>
        <div class="contact-form-hint">Заполни хотя бы имя — остальное опционально.</div>
        <form id="contactForm" class="form-grid contact-form-grid">
          <div class="field field-wide">
            <label class="flbl">Тип контакта</label>
            <div class="seg contact-type-seg">
              <button type="button" class="${!isCompany ? "on" : ""}" data-contact-type="individual">Физлицо</button>
              <button type="button" class="${isCompany ? "on" : ""}" data-contact-type="company">Компания</button>
            </div>
          </div>

          <div class="field">
            <label class="flbl">${isCompany ? "Название" : "Имя"}</label>
            <input name="name" required value="${escapeAttr(draft.name)}" placeholder="${isCompany ? "Название компании" : "Имя и фамилия"}">
          </div>

          <div class="field">
            <label class="flbl">Компания</label>
            <input name="company" value="${escapeAttr(draft.company)}" placeholder="Компания">
          </div>

          ${
            isCompany
              ? ""
              : `
                <div class="field">
                  <label class="flbl">Должность</label>
                  <input name="position" value="${escapeAttr(draft.position)}" placeholder="Должность">
                </div>
              `
          }

          <div class="field">
            <label class="flbl">Телефон</label>
            <input name="phone" type="tel" value="${escapeAttr(draft.phone)}" placeholder="+7...">
          </div>

          <div class="field">
            <label class="flbl">Email</label>
            <input name="email" type="email" value="${escapeAttr(draft.email)}" placeholder="mail@example.com">
          </div>

          <div class="field">
            <label class="flbl">Источник</label>
            <select name="source">
              ${sourceOptions
                .map((s) => `<option value="${escapeAttr(s)}" ${draft.source === s ? "selected" : ""}>${escape(s)}</option>`)
                .join("")}
            </select>
          </div>

          <div class="field field-wide">
            <label class="flbl">Теги</label>
            <input name="tags" value="${escapeAttr(draft.tagsText || "")}" placeholder="VIP, retail, B2B">
          </div>

          <div class="field field-wide">
            <label class="flbl">Примечание</label>
            <textarea name="note" rows="3" placeholder="Комментарий">${escape(draft.note || "")}</textarea>
          </div>
        </form>

        <footer class="modal-footer">
          <div>
            ${isEdit ? `<button type="button" class="btn-ghost danger" id="deleteContactFromForm">${ICONS.trash}<span>Удалить</span></button>` : ""}
          </div>
          <div class="modal-footer-right">
            <button type="button" class="btn-ghost" id="cancelContactForm">Отмена</button>
            <button type="submit" form="contactForm" class="btn">${isEdit ? "Сохранить" : "Создать и привязать"}</button>
          </div>
        </footer>
      </div>
    </div>
  `;
}

function renderWaFloat(contact) {
  const searchQuery = state.waFloat.searchQuery || "";
  const draftText = state.waFloat.draftText || "";
  const sendIcon = draftText.trim() ? ICONS.send : ICONS.mic;

  if (!contact?.phone) {
    return `
      <div class="wa-float" id="waFloat">
        <div class="wa-float-head">
          <div class="wa-float-title">WhatsApp</div>
          <button type="button" class="btn-ghost icon-only" id="closeWaFloat">${ICONS.x}</button>
        </div>
        <div class="wa-float-empty">У контакта нет телефона.</div>
      </div>
    `;
  }

  const { chat, channel } = resolveOrCreateDirectWaChat({ name: contact.name, phone: contact.phone });
  if (!chat) {
    return `
      <div class="wa-float" id="waFloat">
        <div class="wa-float-head">
          <div class="wa-float-title">${escape(contact.name || contact.phone)}</div>
          <button type="button" class="btn-ghost icon-only" id="closeWaFloat">${ICONS.x}</button>
        </div>
        <div class="wa-float-empty">Не удалось открыть чат.</div>
      </div>
    `;
  }

  const messages = messagesForChat(chat.id);

  return `
    <div class="wa-float" id="waFloat" data-chat-id="${escapeAttr(chat.id)}" data-channel-id="${escapeAttr(channel?.id || "")}" data-phone="${escapeAttr(contact.phone)}">
      <div class="wa-float-head">
        <div class="wa-float-user">
          <div class="avatar avatar-sm">${escape(initialsOf(contact.name || contact.phone || "?"))}</div>
          <div class="wa-float-meta">
            <div class="wa-float-title">${escape(contact.name || contact.phone)}</div>
            <div class="wa-float-sub">${escape(channel?.name ? `Канал: ${channel.name}` : "WhatsApp канал не настроен")}</div>
          </div>
        </div>
        <div class="wa-float-head-actions">
          <button type="button" class="btn-ghost icon-only" id="waFloatSearchToggle" title="Поиск">${ICONS.search}</button>
          <button type="button" class="btn-ghost icon-only" id="waFloatCall" title="Позвонить">${ICONS.phone}</button>
          <button type="button" class="btn-ghost icon-only" id="closeWaFloat">${ICONS.x}</button>
        </div>
      </div>
      ${
        state.waFloat.searchOpen
          ? `
            <div class="wa-float-search">
              <input type="search" id="waFloatSearchInput" value="${escapeAttr(searchQuery)}" placeholder="Поиск в переписке...">
            </div>
          `
          : ""
      }
      <div class="chat-messages wa-float-messages" id="waFloatMessages">
        ${renderWaMessages(messages, searchQuery)}
      </div>
      <form class="wa-float-compose" id="waFloatForm">
        <button type="button" class="wa-compose-icon-btn" id="waToggleMedia" title="Файл">${ICONS.paperclip}</button>
        <button type="button" class="wa-compose-icon-btn" id="waCameraStub" title="Камера (в разработке)" disabled>${ICONS.camera}</button>
        <input name="text" type="text" id="waFloatText" value="${escapeAttr(draftText)}" placeholder="Сообщение клиенту...">
        <button type="button" class="wa-compose-icon-btn" id="waSmileStub" title="Эмодзи">${ICONS.smile}</button>
        <button type="submit" class="wa-compose-send-btn" id="waFloatSendBtn" title="Отправить">${sendIcon}</button>
      </form>
      <form class="chat-compose chat-compose-media ${state.waFloat.mediaOpen ? "" : "is-hidden"}" id="waFloatMedia">
        <input name="fileUrl" type="url" placeholder="Ссылка на файл (опц.)">
        <input name="fileName" type="text" placeholder="Имя файла (опц.)">
        <label class="chat-voice-opt"><input name="asVoice" id="waAsVoice" type="checkbox"> voice</label>
      </form>
    </div>
  `;
}

async function syncContactChatCloud(container) {
  if (!waCloudEnabled() || state.chatSyncing) return;
  state.chatSyncing = true;
  try {
    await syncWaCollections();
    if (container?.isConnected && !state.formOpen) renderContacts(container, { skipChatSyncKick: true });
  } catch (error) {
    console.warn("contacts chat sync failed:", error);
  } finally {
    state.chatSyncing = false;
  }
}

function ensureContactChatLoop(container) {
  if (!waCloudEnabled() || state.chatSyncTimer) return;
  state.chatSyncTimer = setInterval(() => {
    if (!container?.isConnected) {
      clearInterval(state.chatSyncTimer);
      state.chatSyncTimer = null;
      return;
    }
    if (state.waFloat.open) syncContactChatCloud(container);
  }, 12000);
}

export function renderContacts(container, opts = {}) {
  seedDemo();

  const allContacts = Store.list(COLLECTION);
  const list = allContacts.filter((c) => matchesSearch(c, state.search));
  ensureSelected(allContacts);

  if (state.selectedId && !list.some((c) => c.id === state.selectedId) && list.length) {
    state.selectedId = list[0].id;
  }

  const selected = state.selectedId ? Store.get(COLLECTION, state.selectedId) : null;
  const duplicates = findDuplicates();

  setHashForSelected(selected?.id || null);

  container.innerHTML = `
    <div class="contacts-layout contacts-layout-v3">
      <aside class="contacts-list-pane">
        <div class="list-toolbar">
          <div class="search-input">
            <span class="search-ico">${ICONS.search}</span>
            <input type="search" id="contactSearch" placeholder="Поиск по имени, email, телефону..." value="${escapeAttr(state.search)}">
          </div>
          <button class="btn-primary" id="newContact">${ICONS.plus}<span>Новый контакт</span></button>
        </div>

        <div class="list-meta">
          <span>${list.length} ${pluralRu(list.length, "контакт", "контакта", "контактов")}</span>
          ${duplicates.length ? `<button class="dupes-badge" id="openDupes">${ICONS.merge} ${duplicates.length}</button>` : ""}
        </div>

        <div class="contacts-list" id="contactsList">
          ${list.length ? list.map((c) => renderListItem(c, c.id === state.selectedId)).join("") : renderLeftEmpty(state.search)}
        </div>

        <div class="contacts-list-foot">
          <button class="btn-ghost" id="importContacts">Импорт CSV</button>
        </div>
      </aside>

      <section class="contacts-detail-pane">
        ${allContacts.length === 0 && !state.search ? renderGlobalEmpty() : selected ? renderDetail(selected) : renderNothing()}
      </section>

      ${state.importOpen ? renderImportModal() : ""}
      ${state.dupesModalOpen ? renderDupesModal(duplicates) : ""}
      ${renderFormModal()}
      ${state.waFloat.open ? renderWaFloat(selected || Store.get(COLLECTION, state.waFloat.contactId)) : ""}
    </div>
  `;

  wireEvents(container);
  saveState();
  ensureContactChatLoop(container);
  if (!opts.skipChatSyncKick && state.waFloat.open) {
    setTimeout(() => {
      syncContactChatCloud(container);
    }, 0);
  }
}

function runImportParse(container, text) {
  const parsed = parseImport(text);
  const existing = Store.list(COLLECTION);
  parsed.forEach((c) => {
    if (findDuplicate(c, existing)) c._dupe = true;
  });
  state.importData = { contacts: parsed, createDeals: true, skipDupes: true };
  renderContacts(container);
}

function confirmImport(container) {
  const data = state.importData;
  if (!data) return;

  let createdContacts = 0;
  let createdDeals = 0;

  data.contacts.forEach((c) => {
    if (c._dupe && data.skipDupes !== false) return;

    const { _dupe, ...payload } = c;
    const created = Store.create(COLLECTION, {
      name: payload.name || "(без имени)",
      email: payload.email || "",
      phone: payload.phone || "",
      company: payload.company || "",
      position: payload.position || "",
      source: "Импорт",
      tags: payload.tags || [],
      note: payload.notes || "",
      type: "individual",
    });

    createdContacts += 1;
    if (data.createDeals) {
      const deal = createLeadDealForContact(created, { source: "import" });
      if (deal) createdDeals += 1;
    }
  });

  alert(`Импортировано: ${createdContacts} контактов${data.createDeals ? `, ${createdDeals} сделок` : ""}.`);
  state.importOpen = false;
  state.importData = null;
  renderContacts(container);
}

function renderImportModal() {
  const data = state.importData;
  return `
    <div class="modal-backdrop" id="importBackdrop">
      <div class="modal modal-xl" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h2>Импорт контактов</h2>
          <button class="btn-ghost icon-only" id="closeImport">${ICONS.x}</button>
        </header>
        <div class="import-body">
          ${
            !data
              ? `
                <div class="import-step1">
                  <p class="settings-hint">Загрузи CSV/TXT файл или вставь текст со списком клиентов. Распознаются имена, телефоны и email.</p>
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
              `
              : `
                <div class="import-step2">
                  <div class="import-summary">
                    <strong>Найдено: ${data.contacts.length}</strong>
                    ${data.contacts.filter((c) => c._dupe).length > 0 ? ` · <span style="color:var(--warning)">дубликатов: ${data.contacts.filter((c) => c._dupe).length}</span>` : ""}
                  </div>
                  <div class="import-options">
                    <label class="checkbox-label">
                      <input type="checkbox" id="optCreateDeals" ${data.createDeals ? "checked" : ""}>
                      <span>Создать сделку для каждого нового контакта</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" id="optSkipDupes" ${data.skipDupes !== false ? "checked" : ""}>
                      <span>Пропустить дубликаты (по email/телефону)</span>
                    </label>
                  </div>
                  <div class="import-list">
                    ${data.contacts
                      .slice(0, 50)
                      .map(
                        (c, i) => `
                          <div class="import-row ${c._dupe ? "dupe" : ""}">
                            <span class="import-i">${i + 1}</span>
                            <div class="import-cell">
                              <div class="import-name">${escape(c.name || "(без имени)")}</div>
                              <div class="import-sub">${escape(c.phone || "")}${c.email ? ` · ${escape(c.email)}` : ""}${c.company ? ` · ${escape(c.company)}` : ""}</div>
                            </div>
                            ${c._dupe ? '<span class="import-badge">дубликат</span>' : ""}
                          </div>
                        `,
                      )
                      .join("")}
                    ${data.contacts.length > 50 ? `<div class="import-more">…и ещё ${data.contacts.length - 50}</div>` : ""}
                  </div>
                  <div class="form-buttons">
                    <button class="btn-ghost" id="importBack">Назад</button>
                    <button class="btn" id="importConfirm">Импортировать ${data.contacts.filter((c) => !c._dupe || data.skipDupes === false).length}</button>
                  </div>
                </div>
              `
          }
        </div>
      </div>
    </div>
  `;
}

function renderDupesModal(dupes) {
  if (!dupes.length) {
    return `
      <div class="modal-backdrop" id="dupesBackdrop">
        <div class="modal" style="max-width:480px;" role="dialog" aria-modal="true">
          <header class="modal-header">
            <h2>Дубликаты не найдены</h2>
            <button class="btn-ghost icon-only" id="closeDupes">${ICONS.x}</button>
          </header>
          <div style="padding:24px;color:var(--text-muted);text-align:center">Все контакты уникальны.</div>
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
          ${dupes
            .map(
              (pair, i) => `
                <div class="dupe-pair" data-i="${i}">
                  <div class="dupe-reason">Совпадает: ${pair.reason === "email" ? "email" : "телефон"}</div>
                  <div class="dupe-cards">
                    <label class="dupe-card">
                      <input type="radio" name="dupe-${i}" value="a" checked>
                      <div class="dupe-card-body">
                        <div class="dupe-name">${escape(pair.a.name)}</div>
                        <div class="dupe-meta">${escape(pair.a.email || "")} ${pair.a.phone ? `· ${escape(pair.a.phone)}` : ""}</div>
                        <div class="dupe-meta">${dealsForContact(pair.a.id).length} сделок · добавлен ${fmtDate(pair.a.createdAt)}</div>
                      </div>
                    </label>
                    <label class="dupe-card">
                      <input type="radio" name="dupe-${i}" value="b">
                      <div class="dupe-card-body">
                        <div class="dupe-name">${escape(pair.b.name)}</div>
                        <div class="dupe-meta">${escape(pair.b.email || "")} ${pair.b.phone ? `· ${escape(pair.b.phone)}` : ""}</div>
                        <div class="dupe-meta">${dealsForContact(pair.b.id).length} сделок · добавлен ${fmtDate(pair.b.createdAt)}</div>
                      </div>
                    </label>
                  </div>
                  <button class="btn-primary dupe-merge-btn" data-merge="${i}" data-a="${pair.a.id}" data-b="${pair.b.id}">${ICONS.merge}<span>Объединить</span></button>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
}

function openContactForm(mode, contactId = null) {
  state.formOpen = true;
  state.formMode = mode;
  state.formId = contactId;
  state.noteOpen = false;
  state.noteText = "";

  if (mode === "edit" && contactId) {
    const c = Store.get(COLLECTION, contactId);
    state.formDraft = {
      ...defaultDraft(),
      type: c?.type || "individual",
      name: c?.name || "",
      company: c?.company || "",
      position: c?.position || "",
      phone: c?.phone || "",
      email: c?.email || "",
      source: c?.source || contactSourceOptions()[0] || "",
      note: c?.note || c?.notes || "",
      tagsText: (c?.tags || []).join(", "),
    };
  } else {
    state.formDraft = defaultDraft();
  }
}

function closeContactForm() {
  state.formOpen = false;
  state.formMode = "create";
  state.formId = null;
  state.formDraft = null;
}

function wireEvents(container) {
  container.querySelector("#contactSearch")?.addEventListener("input", (e) => {
    state.search = e.target.value || "";
    renderContacts(container);
    const el = container.querySelector("#contactSearch");
    el?.focus();
    el?.setSelectionRange(state.search.length, state.search.length);
  });

  container.querySelectorAll(".contact-row").forEach((el) => {
    el.addEventListener("click", () => {
      state.selectedId = el.dataset.id;
      state.activityFilter = "all";
      state.noteOpen = false;
      state.noteText = "";
      renderContacts(container);
    });
  });

  container.querySelector("#newContact")?.addEventListener("click", () => {
    openContactForm("create");
    renderContacts(container);
  });

  container.querySelector("#emptyNewContact")?.addEventListener("click", () => {
    openContactForm("create");
    renderContacts(container);
  });

  container.querySelector("#importContacts")?.addEventListener("click", () => {
    state.importOpen = true;
    state.importData = null;
    renderContacts(container);
  });

  container.querySelector("#emptyImport")?.addEventListener("click", () => {
    state.importOpen = true;
    state.importData = null;
    renderContacts(container);
  });

  container.querySelector("#openDupes")?.addEventListener("click", () => {
    state.dupesModalOpen = true;
    renderContacts(container);
  });

  container.querySelector("#closeDupes")?.addEventListener("click", () => {
    state.dupesModalOpen = false;
    renderContacts(container);
  });

  container.querySelector("#dupesBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "dupesBackdrop") {
      state.dupesModalOpen = false;
      renderContacts(container);
    }
  });

  container.querySelectorAll("[data-merge]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.dataset.merge;
      const checked = container.querySelector(`input[name="dupe-${idx}"]:checked`);
      const winner = checked?.value === "b" ? btn.dataset.b : btn.dataset.a;
      const loser = winner === btn.dataset.a ? btn.dataset.b : btn.dataset.a;
      if (!winner || !loser) return;
      if (!confirm("Объединить контакты? Связанные сделки и задачи перейдут к выбранному.")) return;
      mergeContacts(winner, loser);
      state.dupesModalOpen = false;
      state.selectedId = winner;
      renderContacts(container);
    });
  });

  container.querySelector("#editContact")?.addEventListener("click", () => {
    if (!state.selectedId) return;
    openContactForm("edit", state.selectedId);
    renderContacts(container);
  });

  container.querySelector("#deleteContact")?.addEventListener("click", () => {
    const contact = state.selectedId ? Store.get(COLLECTION, state.selectedId) : null;
    if (!contact) return;
    if (!confirm(`Удалить контакт «${contact.name}»?`)) return;

    Store.remove(COLLECTION, contact.id);
    state.selectedId = null;
    state.waFloat = { open: false, contactId: null, mediaOpen: false, searchOpen: false, searchQuery: "", draftText: "" };
    state.noteOpen = false;
    state.noteText = "";
    renderContacts(container);
  });

  container.querySelector("#createDealForContact")?.addEventListener("click", () => {
    if (!state.selectedId) return;
    location.hash = `#crm/new?contactId=${state.selectedId}`;
  });

  container.querySelectorAll("[data-contact-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activityFilter = btn.dataset.contactFilter || "all";
      renderContacts(container);
    });
  });

  container.querySelector("#contactActionCall")?.addEventListener("click", () => {
    const c = state.selectedId ? Store.get(COLLECTION, state.selectedId) : null;
    if (!c?.phone) return;
    openCommunicate({
      type: "call",
      to: c.phone,
      contactName: c.name,
      context: { collection: CONTACT_ACTIVITIES, fk: { contactId: c.id } },
    });
  });

  container.querySelector("#contactActionEmail")?.addEventListener("click", () => {
    const c = state.selectedId ? Store.get(COLLECTION, state.selectedId) : null;
    if (!c?.email) return;
    openCommunicate({
      type: "email",
      to: c.email,
      contactName: c.name,
      context: { collection: CONTACT_ACTIVITIES, fk: { contactId: c.id } },
    });
  });

  container.querySelector("#contactActionWA")?.addEventListener("click", () => {
    const c = state.selectedId ? Store.get(COLLECTION, state.selectedId) : null;
    if (!c?.phone) return;
    state.waFloat = {
      open: true,
      contactId: c.id,
      mediaOpen: false,
      searchOpen: false,
      searchQuery: "",
      draftText: "",
    };
    renderContacts(container);
  });

  container.querySelector("#contactActionNote")?.addEventListener("click", () => {
    state.noteOpen = true;
    renderContacts(container);
    const ta = container.querySelector("#contactNoteText");
    ta?.focus();
  });

  container.querySelector("#cancelContactNote")?.addEventListener("click", () => {
    state.noteOpen = false;
    state.noteText = "";
    renderContacts(container);
  });

  container.querySelector("#contactNoteText")?.addEventListener("input", (e) => {
    state.noteText = e.target.value || "";
  });

  container.querySelector("#saveContactNote")?.addEventListener("click", () => {
    const text = String(state.noteText || "").trim();
    const c = state.selectedId ? Store.get(COLLECTION, state.selectedId) : null;
    if (!text || !c) return;

    Store.create(CONTACT_ACTIVITIES, {
      contactId: c.id,
      type: "note",
      text,
      authorId: currentEmployee()?.id,
      ts: Date.now(),
    });

    state.noteText = "";
    state.noteOpen = false;
    state.activityFilter = "all";
    renderContacts(container);
  });

  container.querySelector("#contactFormBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "contactFormBackdrop") {
      closeContactForm();
      renderContacts(container);
    }
  });

  container.querySelector("#closeContactForm")?.addEventListener("click", () => {
    closeContactForm();
    renderContacts(container);
  });

  container.querySelector("#cancelContactForm")?.addEventListener("click", () => {
    closeContactForm();
    renderContacts(container);
  });

  container.querySelectorAll("[data-contact-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const formEl = container.querySelector("#contactForm");
      if (formEl) {
        const fd = new FormData(formEl);
        state.formDraft = {
          ...(state.formDraft || defaultDraft()),
          name: String(fd.get("name") || ""),
          company: String(fd.get("company") || ""),
          position: String(fd.get("position") || ""),
          phone: String(fd.get("phone") || ""),
          email: String(fd.get("email") || ""),
          source: String(fd.get("source") || ""),
          tagsText: String(fd.get("tags") || ""),
          note: String(fd.get("note") || ""),
        };
      }
      state.formDraft = { ...(state.formDraft || defaultDraft()), type: btn.dataset.contactType === "company" ? "company" : "individual" };
      renderContacts(container);
    });
  });

  const form = container.querySelector("#contactForm");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const draft = state.formDraft || defaultDraft();
    const isCompany = draft.type === "company";

    const name = String(fd.get("name") || "").trim();
    if (!name) return;

    const company = String(fd.get("company") || "").trim();
    const data = {
      type: isCompany ? "company" : "individual",
      name,
      company: isCompany ? (company || name) : company,
      position: isCompany ? "" : String(fd.get("position") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      source: String(fd.get("source") || "").trim(),
      tags: String(fd.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      note: String(fd.get("note") || "").trim(),
    };

    if (state.formMode === "edit" && state.formId) {
      Store.update(COLLECTION, state.formId, data);
      state.selectedId = state.formId;
    } else {
      const created = Store.create(COLLECTION, data);
      createLeadDealForContact(created, { source: "contact" });
      state.selectedId = created.id;
    }

    closeContactForm();
    renderContacts(container);
  });

  container.querySelector("#deleteContactFromForm")?.addEventListener("click", () => {
    if (!state.formId) return;
    const c = Store.get(COLLECTION, state.formId);
    if (!c) return;
    if (!confirm(`Удалить контакт «${c.name}»?`)) return;
    Store.remove(COLLECTION, c.id);
    closeContactForm();
    state.selectedId = null;
    renderContacts(container);
  });

  container.querySelector("#closeImport")?.addEventListener("click", () => {
    state.importOpen = false;
    state.importData = null;
    renderContacts(container);
  });

  container.querySelector("#importBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "importBackdrop") {
      state.importOpen = false;
      state.importData = null;
      renderContacts(container);
    }
  });

  const importFile = container.querySelector("#importFile");
  importFile?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    runImportParse(container, text);
  });

  const importDrop = container.querySelector("#importDrop");
  if (importDrop) {
    importDrop.addEventListener("dragover", (e) => {
      e.preventDefault();
      importDrop.classList.add("over");
    });
    importDrop.addEventListener("dragleave", () => importDrop.classList.remove("over"));
    importDrop.addEventListener("drop", async (e) => {
      e.preventDefault();
      importDrop.classList.remove("over");
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const text = await file.text();
      runImportParse(container, text);
    });
  }

  container.querySelector("#importParse")?.addEventListener("click", () => {
    const text = String(container.querySelector("#importText")?.value || "");
    runImportParse(container, text);
  });

  container.querySelector("#importBack")?.addEventListener("click", () => {
    state.importData = null;
    renderContacts(container);
  });

  container.querySelector("#optCreateDeals")?.addEventListener("change", (e) => {
    if (state.importData) state.importData.createDeals = e.target.checked;
  });

  container.querySelector("#optSkipDupes")?.addEventListener("change", (e) => {
    if (state.importData) {
      state.importData.skipDupes = e.target.checked;
      renderContacts(container);
    }
  });

  container.querySelector("#importConfirm")?.addEventListener("click", () => {
    confirmImport(container);
  });

  if (state.waFloat.open) {
    container.querySelector("#closeWaFloat")?.addEventListener("click", () => {
      state.waFloat = { open: false, contactId: null, mediaOpen: false, searchOpen: false, searchQuery: "", draftText: "" };
      renderContacts(container);
    });

    container.querySelector("#waToggleMedia")?.addEventListener("click", () => {
      state.waFloat = { ...state.waFloat, mediaOpen: !state.waFloat.mediaOpen };
      renderContacts(container);
    });

    container.querySelector("#waFloatSearchToggle")?.addEventListener("click", () => {
      state.waFloat = {
        ...state.waFloat,
        searchOpen: !state.waFloat.searchOpen,
        searchQuery: state.waFloat.searchOpen ? "" : state.waFloat.searchQuery,
      };
      renderContacts(container);
    });

    container.querySelector("#waFloatSearchInput")?.addEventListener("input", (e) => {
      state.waFloat = { ...state.waFloat, searchOpen: true, searchQuery: e.target.value || "" };
      const c = state.selectedId ? Store.get(COLLECTION, state.selectedId) : null;
      const chatId = container.querySelector("#waFloat")?.dataset.chatId || "";
      const messages = chatId ? messagesForChat(chatId) : [];
      const host = container.querySelector("#waFloatMessages");
      if (host) host.innerHTML = renderWaMessages(messages, state.waFloat.searchQuery);
      if (!state.waFloat.searchQuery) {
        const input = container.querySelector("#waFloatSearchInput");
        input?.focus();
      }
      if (!c) return;
    });

    container.querySelector("#waFloatCall")?.addEventListener("click", () => {
      const c = state.selectedId ? Store.get(COLLECTION, state.selectedId) : null;
      if (!c?.phone) return;
      openCommunicate({
        type: "call",
        to: c.phone,
        contactName: c.name,
        context: { collection: CONTACT_ACTIVITIES, fk: { contactId: c.id } },
      });
    });

    const waTextInput = container.querySelector("#waFloatText");
    const waSendBtn = container.querySelector("#waFloatSendBtn");
    waTextInput?.addEventListener("input", () => {
      const value = waTextInput.value || "";
      state.waFloat = { ...state.waFloat, draftText: value };
      if (waSendBtn) waSendBtn.innerHTML = value.trim() ? ICONS.send : ICONS.mic;
    });

    container.querySelector("#waFloatForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const c = state.selectedId ? Store.get(COLLECTION, state.selectedId) : null;
      if (!c) return;

      const float = container.querySelector("#waFloat");
      const chatId = float?.dataset.chatId || "";
      const channelId = float?.dataset.channelId || "";
      const chat = chatId ? Store.get("chats", chatId) : null;
      const channel = listChannels({ type: "greenapi_wa" }).find((row) => row.id === channelId) || null;

      const text = String(waTextInput?.value || "").trim();
      const mediaForm = container.querySelector("#waFloatMedia");
      const fileUrl = String(mediaForm?.querySelector('input[name="fileUrl"]')?.value || "").trim();
      const fileName = String(mediaForm?.querySelector('input[name="fileName"]')?.value || "").trim();
      const asVoice = Boolean(mediaForm?.querySelector('input[name="asVoice"]')?.checked);

      if (!chat || !channel) {
        alert("Сначала настрой активный WhatsApp канал в Контакт-центре.");
        return;
      }
      if (!text && !fileUrl) return;

      const submitBtn = container.querySelector("#waFloatSendBtn");
      submitBtn?.setAttribute("disabled", "disabled");
      try {
        await sendWaFromDialog({ chat, channel, text, urlFile: fileUrl, fileName, asVoice });
      } catch (error) {
        alert(error?.message || String(error));
        return;
      } finally {
        submitBtn?.removeAttribute("disabled");
      }

      Store.create(CONTACT_ACTIVITIES, {
        contactId: c.id,
        type: "whatsapp",
        text: text || (asVoice ? "[voice]" : fileName || "[файл]"),
        authorId: currentEmployee()?.id,
        ts: Date.now(),
      });

      const form = container.querySelector("#waFloatForm");
      form?.reset();
      mediaForm?.reset();
      state.waFloat = { ...state.waFloat, draftText: "" };
      renderContacts(container, { skipChatSyncKick: true });
      setTimeout(() => {
        syncContactChatCloud(container);
      }, 700);
    });
  }
}
