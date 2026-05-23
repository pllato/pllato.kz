import { Store } from "../store.js";
import { ICONS } from "../icons.js";
import { openCommunicate } from "../communicate.js";
import { parseImport, findDuplicate } from "../import_contacts.js";
import { getStages, findStage } from "../stages.js";
import { currentEmployee, getEmployee, avatar } from "../employees.js";
import { listChannels } from "../channels.js";
import { listWarehouseDocumentsByContact } from "../warehouse.js";
import { FIELD_TYPES, getDealFields, saveDealFields, newFieldId } from "../custom_fields.js";
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
const DEAL_ACTIVITIES = "deal_activities";
const IMPORT_BATCHES = "import_batches";
const IMPORT_MAPPING_KEY = "pllato_import_mapping";

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

function defaultContactsFilters() {
  return {
    source: null,
    dateAdded: "any",
    dateRange: { from: "", to: "" },
    tags: null,
    companies: null,
    hasPhone: "any",
    hasEmail: "any",
    hasDeals: "any",
    importBatches: null,
  };
}

const state = {
  selectedId: _saved.selectedId || null,
  search: _saved.search || "",
  // Контакты теперь всегда «list»; split-режим скрыт из UI (карточка контакта открывается модалкой).
  view: "list",
  modalContactId: null,
  filters: { ...defaultContactsFilters(), ...(_saved.filters || {}) },
  sort: _saved.sort || { col: "createdAt", dir: "desc" },
  selectedIds: new Set(Array.isArray(_saved.selectedIds) ? _saved.selectedIds : []),
  trashOpen: false,
  importsHistoryOpen: false,
  bulkMenu: null, // null | "tag" | "source"
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

const IMPORT_CONTACT_FIELDS = [
  { id: "name", label: "Имя" },
  { id: "phone", label: "Телефон" },
  { id: "email", label: "Email" },
  { id: "company", label: "Компания" },
  { id: "position", label: "Должность" },
  { id: "source", label: "Источник" },
  { id: "tags", label: "Тег" },
  { id: "note", label: "Заметка" },
];

const IMPORT_DEAL_FIELDS = [
  { id: "deal_amount", label: "Сумма" },
  { id: "deal_title", label: "Название сделки" },
];

const IMPORT_CUSTOM_FIELD_TYPES = FIELD_TYPES.filter((f) => [
  "text",
  "textarea",
  "number",
  "money",
  "date",
  "datetime",
  "select",
  "multi",
  "boolean",
  "phone",
  "email",
  "url",
].includes(f.id));

function saveState() {
  sessionStorage.setItem(
    "pllato_state_contacts",
    JSON.stringify({
      selectedId: state.selectedId,
      search: state.search,
      filters: state.filters,
      sort: state.sort,
      selectedIds: [...state.selectedIds],
    }),
  );
}

function normalizeHeaderKey(v) {
  return String(v || "").trim().toLowerCase();
}

function loadSavedImportMapping() {
  try {
    return JSON.parse(localStorage.getItem(IMPORT_MAPPING_KEY) || "null");
  } catch {
    return null;
  }
}

function saveImportMapping(headers, mapping) {
  const payload = {
    headers: (headers || []).map(normalizeHeaderKey),
    mapping: { ...(mapping || {}) },
  };
  localStorage.setItem(IMPORT_MAPPING_KEY, JSON.stringify(payload));
}

function mappingMatchesHeaders(saved, headers) {
  if (!saved || !Array.isArray(saved.headers) || !saved.mapping) return false;
  const current = (headers || []).map(normalizeHeaderKey);
  if (saved.headers.length !== current.length) return false;
  return saved.headers.every((h, i) => h === current[i]);
}

function defaultImportStageId() {
  return getStages()[0]?.id || "new";
}

function toContactPayloadDraft(raw = {}) {
  const tagsRaw = raw.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw
    : String(tagsRaw || "")
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean);
  return {
    name: String(raw.name || "").trim(),
    phone: String(raw.phone || "").trim(),
    email: String(raw.email || "").trim(),
    company: String(raw.company || "").trim(),
    position: String(raw.position || "").trim(),
    source: String(raw.source || "").trim(),
    tags,
    note: String(raw.note || "").trim(),
  };
}

function buildImportRowPayload(row, mapping = {}) {
  const contact = { name: "", phone: "", email: "", company: "", position: "", source: "", tags: [], note: "" };
  const deal = { title: "", amount: 0, customFields: {} };

  row.forEach((cellRaw, index) => {
    const mapId = mapping[index];
    if (!mapId || mapId === "skip") return;
    const cell = String(cellRaw || "").trim();
    if (!cell) return;

    if (mapId === "tags") {
      contact.tags = cell.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
      return;
    }
    if (mapId === "deal_amount") {
      const amount = Number(String(cell).replace(/[^\d.-]/g, ""));
      deal.amount = Number.isFinite(amount) ? amount : 0;
      return;
    }
    if (mapId === "deal_title") {
      deal.title = cell;
      return;
    }
    if (String(mapId).startsWith("cf:")) {
      const fieldId = String(mapId).slice(3);
      if (fieldId) deal.customFields[fieldId] = cell;
      return;
    }
    if (Object.prototype.hasOwnProperty.call(contact, mapId)) {
      contact[mapId] = cell;
    }
  });

  if (!deal.title) deal.title = contact.name || "Новая сделка";
  if (!Number.isFinite(Number(deal.amount))) deal.amount = 0;

  return { contact, deal };
}

function createImportedDeal(contact, draft, options = {}) {
  const me = currentEmployee();
  const created = Store.create("deals", {
    title: String(draft?.title || contact?.name || "Новая сделка").trim(),
    amount: Number(draft?.amount || 0) || 0,
    stage: options.stageId || defaultImportStageId(),
    contactId: contact.id,
    dueDate: null,
    notes: "",
    assigneeId: me?.id || null,
    customFields: { ...(draft?.customFields || {}) },
  });
  Store.create(DEAL_ACTIVITIES, {
    dealId: created.id,
    type: "deal_created",
    text: "Создана при импорте CSV",
    authorId: me?.id || null,
    ts: Date.now(),
  });
  return created;
}

function ensureImportStats(data) {
  if (!data) return { total: 0, duplicates: 0, importable: 0 };
  const total = data.rowsPayload.length;
  const duplicates = data.rowsPayload.filter((r) => r._dupe).length;
  const importable = data.rowsPayload.filter((r) => !(r._dupe && data.skipDupes !== false)).length;
  return { total, duplicates, importable };
}

function rebuildImportRowsPayload(data) {
  const existing = listAliveContacts();
  const seenEmails = new Set(existing.map((c) => normEmail(c.email)).filter(Boolean));
  const seenPhones = new Set(existing.map((c) => normPhone(c.phone)).filter(Boolean));
  data.rowsPayload = (data.rows || []).map((row, rowIndex) => {
    const payload = buildImportRowPayload(row, data.mapping || {});
    const contactDraft = toContactPayloadDraft(payload.contact);
    const valid = Boolean(contactDraft.name || contactDraft.phone || contactDraft.email);
    const byExisting = valid ? findDuplicate(contactDraft, existing) : null;
    const email = normEmail(contactDraft.email);
    const phone = normPhone(contactDraft.phone);
    const byBatch = Boolean((email && seenEmails.has(email)) || (phone && seenPhones.has(phone)));
    const dupe = byExisting || byBatch;
    if (!dupe) {
      if (email) seenEmails.add(email);
      if (phone) seenPhones.add(phone);
    }
    return {
      rowIndex,
      row,
      contact: contactDraft,
      deal: payload.deal,
      _valid: valid,
      _dupe: Boolean(dupe),
      _dupeId: dupe?.id || null,
    };
  }).filter((entry) => entry._valid);
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

const CONTACT_TRASH_RETENTION_MS = 30 * 86400000;
const IMPORT_BATCHES_LIMIT = 10;

function isContactAlive(contact) {
  return !contact?.deletedAt;
}

function isContactTrashed(contact) {
  return Boolean(contact?.deletedAt);
}

function isDealAlive(deal) {
  return !deal?.deletedAt;
}

function listAliveContacts() {
  return Store.list(COLLECTION).filter(isContactAlive);
}

function listTrashedContacts() {
  return Store.list(COLLECTION).filter(isContactTrashed);
}

function softDeleteContact(id) {
  if (!id) return;
  const me = currentEmployee();
  Store.update(COLLECTION, id, { deletedAt: Date.now(), deletedBy: me?.id || null });
}

function restoreContact(id) {
  if (!id) return;
  Store.update(COLLECTION, id, { deletedAt: null, deletedBy: null });
}

function hardDeleteContact(id) {
  if (!id) return;
  Store.list(CONTACT_ACTIVITIES)
    .filter((a) => a.contactId === id)
    .forEach((a) => Store.remove(CONTACT_ACTIVITIES, a.id));
  Store.remove(COLLECTION, id);
}

function purgeOldContactTrash() {
  const cutoff = Date.now() - CONTACT_TRASH_RETENTION_MS;
  listTrashedContacts().forEach((c) => {
    if (Number(c.deletedAt || 0) < cutoff) hardDeleteContact(c.id);
  });
}

function daysSince(ts) {
  if (!ts) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / 86400000));
}

function daysToPurge(ts) {
  if (!ts) return 30;
  return Math.max(0, 30 - daysSince(ts));
}

function listImportBatches() {
  return Store.list(IMPORT_BATCHES).sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

function activeImportBatches() {
  return listImportBatches().filter((b) => b.status !== "reverted");
}

function pruneImportBatchesHistory() {
  const batches = listImportBatches();
  if (batches.length <= IMPORT_BATCHES_LIMIT) return;
  const overflow = batches.slice(IMPORT_BATCHES_LIMIT);
  overflow.forEach((batch) => Store.remove(IMPORT_BATCHES, batch.id));
}

function wasUntouched(contact, batchTs) {
  if (!contact) return false;
  const delta = Number(contact.updatedAt || 0) - Number(contact.createdAt || 0);
  if (delta > 5000) return false;
  const contactActs = Store.list(CONTACT_ACTIVITIES).filter((a) => a.contactId === contact.id);
  if (contactActs.length > 0) return false;
  const waMessages = Store.list("whatsapp_messages").filter((m) => {
    const phone = String(contact.phone || "").replace(/\D+/g, "");
    const to = String(m?.to || "").replace(/\D+/g, "");
    const from = String(m?.from || "").replace(/\D+/g, "");
    return phone && (phone === to || phone === from);
  });
  if (waMessages.length > 0) return false;
  if (Number(contact.createdAt || 0) > Number(batchTs || 0) + 10000) return false;
  return true;
}

function revertBatch(batchId) {
  const batch = Store.get(IMPORT_BATCHES, batchId);
  if (!batch || batch.status === "reverted") return { revertedContacts: 0, revertedDeals: 0 };

  const now = Date.now();
  const me = currentEmployee();

  const safeContactIds = (batch.contactIds || []).filter((cid) => {
    const contact = Store.get(COLLECTION, cid);
    if (!contact || contact.deletedAt) return false;
    return wasUntouched(contact, batch.ts);
  });

  safeContactIds.forEach((cid) => {
    Store.update(COLLECTION, cid, { deletedAt: now, deletedBy: me?.id || null });
  });

  const safeDealIds = (batch.dealIds || []).filter((did) => {
    const deal = Store.get("deals", did);
    if (!deal || deal.deletedAt) return false;
    const acts = Store.list(DEAL_ACTIVITIES).filter((a) => a.dealId === did);
    const manualActs = acts.filter((a) => a.type !== "deal_created" || Number(a.ts || 0) > Number(batch.ts || 0) + 5000);
    return manualActs.length === 0;
  });

  safeDealIds.forEach((did) => {
    Store.update("deals", did, { deletedAt: now, deletedBy: me?.id || null });
  });

  Store.update(IMPORT_BATCHES, batch.id, {
    status: "reverted",
    revertedAt: now,
    revertedBy: me?.id || null,
    revertedContactCount: safeContactIds.length,
    revertedDealCount: safeDealIds.length,
  });

  return { revertedContacts: safeContactIds.length, revertedDeals: safeDealIds.length };
}

function dealsForContact(cid) {
  return Store.list("deals").filter((d) => d.contactId === cid && isDealAlive(d));
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
  const contacts = listAliveContacts();
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
  if (!state.selectedId) {
    const fromHash = hashContactId();
    if (fromHash && allIds.has(fromHash)) {
      state.selectedId = fromHash;
    }
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

function formatFilterCount(values) {
  if (!Array.isArray(values) || values.length === 0) return "любой";
  return String(values.length);
}

function sourceFilterLabel() {
  const values = state.filters.source;
  if (!Array.isArray(values) || values.length === 0) return "любой";
  if (values.length === 1 && values[0] === "__import__") return "Импорт";
  return String(values.length);
}

function dateFilterLabel() {
  const v = state.filters.dateAdded;
  if (v === "today") return "сегодня";
  if (v === "7d") return "7 дней";
  if (v === "30d") return "30 дней";
  if (v === "custom") {
    const from = state.filters.dateRange?.from || "—";
    const to = state.filters.dateRange?.to || "—";
    return `${from} → ${to}`;
  }
  return "любой";
}

function yesNoAnyLabel(v) {
  if (v === true) return "да";
  if (v === false) return "нет";
  return "любой";
}

function resetAllFilters() {
  state.filters = defaultContactsFilters();
}

function importBatchOptions() {
  return listImportBatches()
    .slice(0, 10)
    .map((b) => {
      const fileLabel = b.fileName || "Вставленный текст";
      const tsLabel = fmtDate(b.ts || 0);
      return { id: b.id, label: `${fileLabel} · ${tsLabel}` };
    });
}

function uniqueTags(contacts) {
  const out = new Set();
  contacts.forEach((c) => (c.tags || []).forEach((tag) => out.add(String(tag || "").trim())));
  return [...out].filter(Boolean).sort((a, b) => a.localeCompare(b, "ru-RU"));
}

function uniqueCompanies(contacts) {
  const out = new Set();
  contacts.forEach((c) => {
    const v = String(c.company || "").trim();
    if (v) out.add(v);
  });
  return [...out].sort((a, b) => a.localeCompare(b, "ru-RU"));
}

function applyContactsFilters(contacts) {
  const now = Date.now();
  const dayMs = 86400000;
  return contacts.filter((c) => {
    const sourceFilter = state.filters.source;
    if (Array.isArray(sourceFilter) && sourceFilter.length > 0) {
      const isImport = Boolean(c.importBatchId || String(c.source || "").toLowerCase() === "импорт");
      const sourceMatched = sourceFilter.some((v) => {
        if (v === "__import__") return isImport;
        return String(c.source || "") === v;
      });
      if (!sourceMatched) return false;
    }

    const createdAt = Number(c.createdAt || c.ts || 0);
    if (state.filters.dateAdded === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      if (createdAt < start.getTime()) return false;
    } else if (state.filters.dateAdded === "7d") {
      if (createdAt < now - 7 * dayMs) return false;
    } else if (state.filters.dateAdded === "30d") {
      if (createdAt < now - 30 * dayMs) return false;
    } else if (state.filters.dateAdded === "custom") {
      const fromRaw = state.filters.dateRange?.from;
      const toRaw = state.filters.dateRange?.to;
      if (fromRaw) {
        const fromTs = new Date(fromRaw).getTime();
        if (Number.isFinite(fromTs) && createdAt < fromTs) return false;
      }
      if (toRaw) {
        const toTs = new Date(toRaw).getTime() + dayMs - 1;
        if (Number.isFinite(toTs) && createdAt > toTs) return false;
      }
    }

    if (Array.isArray(state.filters.tags) && state.filters.tags.length > 0) {
      const tags = new Set((c.tags || []).map((t) => String(t)));
      if (!state.filters.tags.some((tag) => tags.has(tag))) return false;
    }

    if (Array.isArray(state.filters.companies) && state.filters.companies.length > 0) {
      if (!state.filters.companies.includes(String(c.company || "").trim())) return false;
    }

    if (state.filters.hasPhone === true && !String(c.phone || "").trim()) return false;
    if (state.filters.hasPhone === false && String(c.phone || "").trim()) return false;
    if (state.filters.hasEmail === true && !String(c.email || "").trim()) return false;
    if (state.filters.hasEmail === false && String(c.email || "").trim()) return false;

    const dealsCount = dealsForContact(c.id).length;
    if (state.filters.hasDeals === true && dealsCount === 0) return false;
    if (state.filters.hasDeals === false && dealsCount > 0) return false;

    if (Array.isArray(state.filters.importBatches) && state.filters.importBatches.length > 0) {
      if (!state.filters.importBatches.includes(c.importBatchId || "")) return false;
    }

    return true;
  });
}

function sortContacts(contacts) {
  const col = state.sort?.col || "createdAt";
  const dir = state.sort?.dir === "asc" ? 1 : -1;
  const valueOf = (c) => {
    if (col === "name") return String(c.name || "").toLowerCase();
    if (col === "phone") return String(c.phone || "").toLowerCase();
    if (col === "company") return String(c.company || "").toLowerCase();
    if (col === "source") return String(c.source || "").toLowerCase();
    if (col === "deals") return dealsForContact(c.id).length;
    return Number(c.createdAt || c.ts || 0);
  };
  return [...contacts].sort((a, b) => {
    const av = valueOf(a);
    const bv = valueOf(b);
    if (av === bv) return String(a.id).localeCompare(String(b.id));
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv), "ru-RU") * dir;
  });
}

function exportContactsCsv(rows) {
  if (!rows.length) return;
  const header = ["Имя", "Email", "Телефон", "Компания", "Источник", "Сделок"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, "\"\"")}"`;
  const lines = [header.map(esc).join(",")];
  rows.forEach((c) => {
    lines.push([
      c.name || "",
      c.email || "",
      c.phone || "",
      c.company || "",
      c.source || "",
      dealsForContact(c.id).length,
    ].map(esc).join(","));
  });
  const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const day = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `contacts_export_${day}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function renderContactListTable(filteredContacts, sortedContacts) {
  const selectedInFiltered = filteredContacts.filter((c) => state.selectedIds.has(c.id)).length;
  const allSelected = filteredContacts.length > 0 && selectedInFiltered === filteredContacts.length;
  const allAlive = listAliveContacts();
  const tags = uniqueTags(allAlive);
  const companies = uniqueCompanies(allAlive);
  const sources = Array.from(new Set(contactSourceOptions().concat(["Импорт"])));
  const batches = importBatchOptions();

  return `
    <div class="contacts-listv">
      <div class="contacts-listv-toolbar">
        <div class="contacts-listv-head">Контакты · <strong>${listAliveContacts().length}</strong></div>
        <div class="contacts-listv-actions">
          <label class="search-input contacts-listv-search">
            <span class="search-ico">${ICONS.search}</span>
            <input type="search" id="contactSearch" placeholder="Поиск по имени, email, телефону..." value="${escapeAttr(state.search)}">
          </label>
          <button type="button" class="btn-ghost" id="openImportsHistory">Импорты <span class="contacts-badge">${activeImportBatches().length}</span></button>
          <button type="button" class="btn-ghost ${state.trashOpen ? "active" : ""}" id="openContactTrash">Корзина <span class="contacts-badge">${listTrashedContacts().length}</span></button>
          <button type="button" class="btn-primary" id="newContact">${ICONS.plus}<span>Контакт</span></button>
        </div>
      </div>

      <div class="contacts-filter-row">
        <details class="contacts-filter-chip">
          <summary>Источник: ${escape(sourceFilterLabel())}</summary>
          <div class="contacts-filter-menu">
            <label><input type="checkbox" data-filter-source="__import__" ${(state.filters.source || []).includes("__import__") ? "checked" : ""}> Импорт</label>
            ${sources.filter((s) => s !== "Импорт").map((s) => `<label><input type="checkbox" data-filter-source="${escapeAttr(s)}" ${(state.filters.source || []).includes(s) ? "checked" : ""}> ${escape(s)}</label>`).join("")}
          </div>
        </details>

        <details class="contacts-filter-chip">
          <summary>Дата добавления: ${escape(dateFilterLabel())}</summary>
          <div class="contacts-filter-menu">
            <label><input type="radio" name="filter-date" value="any" ${state.filters.dateAdded === "any" ? "checked" : ""}> Любой</label>
            <label><input type="radio" name="filter-date" value="today" ${state.filters.dateAdded === "today" ? "checked" : ""}> Сегодня</label>
            <label><input type="radio" name="filter-date" value="7d" ${state.filters.dateAdded === "7d" ? "checked" : ""}> 7 дней</label>
            <label><input type="radio" name="filter-date" value="30d" ${state.filters.dateAdded === "30d" ? "checked" : ""}> 30 дней</label>
            <label><input type="radio" name="filter-date" value="custom" ${state.filters.dateAdded === "custom" ? "checked" : ""}> Произвольный период</label>
            <div class="contacts-date-range">
              <input type="date" id="filterDateFrom" value="${escapeAttr(state.filters.dateRange?.from || "")}">
              <input type="date" id="filterDateTo" value="${escapeAttr(state.filters.dateRange?.to || "")}">
            </div>
          </div>
        </details>

        <details class="contacts-filter-chip">
          <summary>Тег: ${escape(formatFilterCount(state.filters.tags))}</summary>
          <div class="contacts-filter-menu">
            ${tags.length ? tags.map((tag) => `<label><input type="checkbox" data-filter-tag="${escapeAttr(tag)}" ${(state.filters.tags || []).includes(tag) ? "checked" : ""}> ${escape(tag)}</label>`).join("") : `<div class="contacts-filter-empty">Тегов пока нет</div>`}
          </div>
        </details>

        <details class="contacts-filter-chip">
          <summary>Компания: ${escape(formatFilterCount(state.filters.companies))}</summary>
          <div class="contacts-filter-menu">
            ${companies.length
              ? companies.map((company) => `<label><input type="checkbox" data-filter-company="${escapeAttr(company)}" ${(state.filters.companies || []).includes(company) ? "checked" : ""}> ${escape(company)}</label>`).join("")
              : `<div class="contacts-filter-empty">Компаний пока нет</div>`}
          </div>
        </details>

        <details class="contacts-filter-chip">
          <summary>Есть телефон: ${escape(yesNoAnyLabel(state.filters.hasPhone))}</summary>
          <div class="contacts-filter-menu">
            <label><input type="radio" name="filter-phone" value="any" ${state.filters.hasPhone === "any" ? "checked" : ""}> Любой</label>
            <label><input type="radio" name="filter-phone" value="true" ${state.filters.hasPhone === true ? "checked" : ""}> Да</label>
            <label><input type="radio" name="filter-phone" value="false" ${state.filters.hasPhone === false ? "checked" : ""}> Нет</label>
          </div>
        </details>

        <details class="contacts-filter-chip">
          <summary>Есть email: ${escape(yesNoAnyLabel(state.filters.hasEmail))}</summary>
          <div class="contacts-filter-menu">
            <label><input type="radio" name="filter-email" value="any" ${state.filters.hasEmail === "any" ? "checked" : ""}> Любой</label>
            <label><input type="radio" name="filter-email" value="true" ${state.filters.hasEmail === true ? "checked" : ""}> Да</label>
            <label><input type="radio" name="filter-email" value="false" ${state.filters.hasEmail === false ? "checked" : ""}> Нет</label>
          </div>
        </details>

        <details class="contacts-filter-chip">
          <summary>Есть сделки: ${escape(yesNoAnyLabel(state.filters.hasDeals))}</summary>
          <div class="contacts-filter-menu">
            <label><input type="radio" name="filter-deals" value="any" ${state.filters.hasDeals === "any" ? "checked" : ""}> Любой</label>
            <label><input type="radio" name="filter-deals" value="true" ${state.filters.hasDeals === true ? "checked" : ""}> Да</label>
            <label><input type="radio" name="filter-deals" value="false" ${state.filters.hasDeals === false ? "checked" : ""}> Нет</label>
          </div>
        </details>

        ${batches.length ? `
          <details class="contacts-filter-chip">
            <summary>Партия: ${escape(formatFilterCount(state.filters.importBatches))}</summary>
            <div class="contacts-filter-menu">
              ${batches.map((batch) => `<label><input type="checkbox" data-filter-batch="${escapeAttr(batch.id)}" ${(state.filters.importBatches || []).includes(batch.id) ? "checked" : ""}> ${escape(batch.label)}</label>`).join("")}
            </div>
          </details>
        ` : ""}

        <button type="button" class="btn-ghost contacts-filter-more" title="Будет расширено позже" disabled>+ Ещё фильтр</button>
        <button type="button" class="btn-ghost contacts-filter-reset" id="resetContactFilters">Сбросить все</button>
      </div>

      ${state.selectedIds.size > 0 ? `
        <div class="contacts-bulk-bar">
          <div class="contacts-bulk-left">
            <strong>Выбрано: ${state.selectedIds.size} из ${filteredContacts.length}</strong>
            ${selectedInFiltered < filteredContacts.length ? `<button type="button" class="btn-link" id="bulkSelectFiltered">выделить все ${filteredContacts.length} на странице</button>` : ""}
          </div>
          <div class="contacts-bulk-right">
            <div class="contacts-bulk-menu-wrap">
              <button type="button" class="btn-ghost" id="bulkTagMenu">Добавить тег ▾</button>
              ${state.bulkMenu === "tag" ? `
                <div class="contacts-bulk-menu">
                  <input type="text" id="bulkTagInput" placeholder="Новый тег">
                  <button type="button" class="btn-primary btn-sm" id="bulkTagApply">Применить</button>
                  ${tags.map((tag) => `<button type="button" class="btn-ghost btn-sm" data-bulk-tag="${escapeAttr(tag)}">${escape(tag)}</button>`).join("")}
                </div>
              ` : ""}
            </div>
            <div class="contacts-bulk-menu-wrap">
              <button type="button" class="btn-ghost" id="bulkSourceMenu">Изменить источник ▾</button>
              ${state.bulkMenu === "source" ? `
                <div class="contacts-bulk-menu">
                  ${sources.map((s) => `<button type="button" class="btn-ghost btn-sm" data-bulk-source="${escapeAttr(s)}">${escape(s)}</button>`).join("")}
                </div>
              ` : ""}
            </div>
            <button type="button" class="btn-ghost" id="bulkExportCsv">Экспорт CSV</button>
            <button type="button" class="btn-ghost danger" id="bulkTrash">${ICONS.trash}<span>В корзину</span></button>
            <button type="button" class="btn-ghost" id="bulkClear">Снять выделение</button>
          </div>
        </div>
      ` : ""}

      <div class="contacts-table-wrap">
        <table class="contacts-table">
          <thead>
            <tr>
              <th class="col-check"><input type="checkbox" id="contactsSelectAll" ${allSelected ? "checked" : ""}></th>
              <th><button type="button" class="contacts-sort-btn" data-sort-col="name">Имя${state.sort.col === "name" ? (state.sort.dir === "asc" ? " ↑" : " ↓") : ""}</button></th>
              <th><button type="button" class="contacts-sort-btn" data-sort-col="phone">Телефон${state.sort.col === "phone" ? (state.sort.dir === "asc" ? " ↑" : " ↓") : ""}</button></th>
              <th><button type="button" class="contacts-sort-btn" data-sort-col="company">Компания${state.sort.col === "company" ? (state.sort.dir === "asc" ? " ↑" : " ↓") : ""}</button></th>
              <th><button type="button" class="contacts-sort-btn" data-sort-col="source">Источник${state.sort.col === "source" ? (state.sort.dir === "asc" ? " ↑" : " ↓") : ""}</button></th>
              <th><button type="button" class="contacts-sort-btn" data-sort-col="deals">Сделок${state.sort.col === "deals" ? (state.sort.dir === "asc" ? " ↑" : " ↓") : ""}</button></th>
            </tr>
          </thead>
          <tbody>
            ${sortedContacts.map((c) => {
              const selected = state.selectedIds.has(c.id);
              const dealsCount = dealsForContact(c.id).length;
              return `
                <tr data-contact-row="${escapeAttr(c.id)}" class="${selected ? "is-selected" : ""}">
                  <td class="col-check">
                    <input type="checkbox" data-contact-check="${escapeAttr(c.id)}" ${selected ? "checked" : ""}>
                  </td>
                  <td>
                    <div class="contacts-cell-main">${escape(c.name || "(без имени)")}</div>
                    <div class="contacts-cell-sub">${escape(c.email || "— нет email")}</div>
                  </td>
                  <td>${escape(c.phone || "— нет")}</td>
                  <td>${escape(c.company || "—")}</td>
                  <td><span class="contacts-source-chip">${escape(c.importBatchId ? "Импорт" : (c.source || "—"))}</span></td>
                  <td>${dealsCount}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="contacts-listv-foot">Показано ${sortedContacts.length} из ${filteredContacts.length} (с фильтрами) · из ${listAliveContacts().length} всего</div>
    </div>
  `;
}

function renderContactsTrashModal() {
  const rows = listTrashedContacts().sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  return `
    <div class="modal-backdrop" id="contactsTrashBackdrop">
      <div class="modal modal-xl" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h2>Корзина контактов · ${rows.length}</h2>
          <button type="button" class="btn-ghost icon-only" id="closeContactsTrash">${ICONS.x}</button>
        </header>
        <div class="contacts-trash-note">Контакты в корзине хранятся 30 дней, затем удаляются автоматически.</div>
        <div class="contacts-trash-wrap">
          <table class="contacts-trash-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Телефон</th>
                <th>Компания</th>
                <th>Удалил</th>
                <th>Источник</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length ? rows.map((c) => {
                const by = getEmployee(c.deletedBy);
                return `
                  <tr>
                    <td>
                      <div class="contacts-cell-main">${escape(c.name || "(без имени)")}</div>
                      <div class="contacts-cell-sub">${escape(c.email || "—")} · удалено ${daysSince(c.deletedAt)} дн назад · через ${daysToPurge(c.deletedAt)} дн — навсегда</div>
                    </td>
                    <td>${escape(c.phone || "—")}</td>
                    <td>${escape(c.company || "—")}</td>
                    <td>${escape(by?.name || "Сотрудник")}</td>
                    <td>${escape(c.importBatchId ? "Импорт" : (c.source || "—"))}</td>
                    <td>
                      <div class="contacts-trash-actions">
                        <button type="button" class="btn-ghost" data-trash-restore="${escapeAttr(c.id)}">↶ Восстановить</button>
                        <button type="button" class="btn-ghost danger" data-trash-delete="${escapeAttr(c.id)}">✕ Удалить навсегда</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join("") : `<tr><td colspan="6"><div class="contacts-filter-empty">Корзина пуста</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderImportsHistoryModal() {
  const batches = listImportBatches();
  const latestActiveId = activeImportBatches()[0]?.id || null;
  const stagesMap = Object.fromEntries(getStages().map((s) => [s.id, s.title]));

  return `
    <div class="modal-backdrop" id="importsHistoryBackdrop">
      <div class="modal modal-xl" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h2>История импортов</h2>
          <button type="button" class="btn-ghost icon-only" id="closeImportsHistory">${ICONS.x}</button>
        </header>
        <div class="imports-history-note">
          Откат партии переносит контакты и сделки в корзину. Контакты с ручными правками пропускаются.
        </div>
        <div class="imports-history-list">
          ${batches.length
            ? batches.map((batch) => {
                const contacts = (batch.contactIds || []).map((cid) => Store.get(COLLECTION, cid)).filter(Boolean);
                const untouched = contacts.filter((c) => !c.deletedAt && wasUntouched(c, batch.ts)).length;
                const changed = Math.max(0, contacts.length - untouched);
                const author = getEmployee(batch.authorId);
                const revertedBy = getEmployee(batch.revertedBy);
                const reverted = batch.status === "reverted";
                const stageLabel = stagesMap[batch.stageId] || "—";
                const batchTitle = batch.fileName || "Вставленный текст";
                const dayText = `${fmtDayMonth(batch.ts)} ${fmtTimeShort(batch.ts)}`;
                return `
                  <article class="import-batch-card ${batch.id === latestActiveId && !reverted ? "is-latest" : ""}">
                    <div class="import-batch-main">
                      <div class="import-batch-title">
                        <strong>${escape(batchTitle)}</strong>
                        ${batch.id === latestActiveId && !reverted ? `<span class="contacts-source-chip">последний</span>` : ""}
                      </div>
                      <div class="import-batch-meta">
                        ${escape(dayText)} · ${escape(author?.name || "Сотрудник")} · ${contacts.length} контактов
                        ${batch.dealIds?.length ? ` · ${batch.dealIds.length} сделок` : ""}
                        ${batch.stageId ? ` · стадия «${escape(stageLabel)}»` : ""}
                      </div>
                      ${
                        reverted
                          ? `<div class="import-batch-stats">Откачено ${daysSince(batch.revertedAt)} дн назад · ${escape(revertedBy?.name || "Сотрудник")}</div>`
                          : `<div class="import-batch-stats">✔ Без правок: ${untouched} · ⚠ Уже изменены: ${changed} · ↻ Откатить можно: ${untouched}</div>`
                      }
                    </div>
                    <div class="import-batch-actions">
                      ${
                        reverted
                          ? `<span class="contacts-source-chip">откачено</span>`
                          : `<button type="button" class="btn-ghost danger" data-revert-batch="${escapeAttr(batch.id)}">↶ Откатить</button>`
                      }
                      <button type="button" class="btn-ghost" data-show-batch="${escapeAttr(batch.id)}">Показать</button>
                    </div>
                  </article>
                `;
              }).join("")
            : `<div class="contacts-filter-empty">Пока нет импортов.</div>`}
        </div>
        <div class="imports-history-foot">
          <span>Хранится последние ${IMPORT_BATCHES_LIMIT} партий импорта</span>
          <button type="button" class="btn-primary btn-sm" id="importsHistoryNew">Новый импорт</button>
        </div>
      </div>
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

function renderContactModal(contact) {
  if (!contact || !isContactAlive(contact)) return "";
  return `
    <div class="contact-modal-overlay">
      <div class="contact-modal">
        <button type="button" class="contact-modal-close" data-close-contact-modal aria-label="Закрыть">×</button>
        ${renderDetail(contact)}
      </div>
    </div>
  `;
}

function renderDetail(contact) {
  const compactId = String(contact.id || "").slice(-6);
  const created = fmtDayMonth(contact.createdAt);
  const subtitle = [contact.position, contact.company].filter(Boolean).join(" · ");
  const tags = (contact.tags || []).map((tag) => `<span class="chip">${escape(tag)}</span>`).join("");

  const deals = dealsForContact(contact.id);
  const purchases = listWarehouseDocumentsByContact(contact.id, 5);
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

      <section class="contact-related-deals">
        <div class="contact-related-head">
          <span>Документы по заказам</span>
          <a class="btn-ghost btn-sm" href="#warehouse/documents">Склад</a>
        </div>
        ${
          purchases.length
            ? `<div class="contact-deals-list">${purchases
                .map((d) => `<a href="#warehouse/documents" class="contact-deal-pill"><span class="dot" style="background:var(--accent)"></span><span class="title">${escape(d.number || "Документ")}</span><span class="sum">${escape(d.date || "")}</span></a>`)
                .join("")}</div>`
            : `<div class="contact-deals-empty">Документов по заказам пока нет.</div>`
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
  purgeOldContactTrash();
  seedDemo();

  const allContacts = listAliveContacts();
  const searchList = allContacts.filter((c) => matchesSearch(c, state.search));
  const filteredContacts = applyContactsFilters(searchList);
  const sortedContacts = sortContacts(filteredContacts);
  const aliveIds = new Set(allContacts.map((c) => c.id));
  state.selectedIds = new Set([...state.selectedIds].filter((id) => aliveIds.has(id)));
  if (state.selectedIds.size === 0) state.bulkMenu = null;

  ensureSelected(allContacts);
  if (state.selectedId && !searchList.some((c) => c.id === state.selectedId) && searchList.length) {
    state.selectedId = searchList[0].id;
  }

  const selected = state.selectedId ? Store.get(COLLECTION, state.selectedId) : null;
  const selectedAlive = selected && isContactAlive(selected) ? selected : null;
  const duplicates = findDuplicates();

  if (state.view === "split") {
    setHashForSelected(selectedAlive?.id || null);
  }

  container.innerHTML = `
    ${state.view === "list"
      ? `
        ${renderContactListTable(filteredContacts, sortedContacts)}
      `
      : `
      <div class="contacts-layout contacts-layout-v3">
        <aside class="contacts-list-pane">
          <div class="list-toolbar list-toolbar-contacts">
            <div class="contacts-view-switch">
              <button type="button" class="btn-ghost ${state.view === "split" ? "active" : ""}" data-contacts-view="split">Split</button>
              <button type="button" class="btn-ghost ${state.view === "list" ? "active" : ""}" data-contacts-view="list">Списком</button>
            </div>
            <div class="search-input">
              <span class="search-ico">${ICONS.search}</span>
              <input type="search" id="contactSearch" placeholder="Поиск по имени, email, телефону..." value="${escapeAttr(state.search)}">
            </div>
            <button class="btn-primary" id="newContact">${ICONS.plus}<span>Новый контакт</span></button>
          </div>

          <div class="list-meta">
            <span>${searchList.length} ${pluralRu(searchList.length, "контакт", "контакта", "контактов")}</span>
            <div class="list-meta-actions">
              ${duplicates.length ? `<button class="dupes-badge" id="openDupes">${ICONS.merge} ${duplicates.length}</button>` : ""}
              <button type="button" class="btn-ghost" id="openContactTrash">Корзина <span class="contacts-badge">${listTrashedContacts().length}</span></button>
            </div>
          </div>

          <div class="contacts-list" id="contactsList">
            ${searchList.length ? searchList.map((c) => renderListItem(c, c.id === state.selectedId)).join("") : renderLeftEmpty(state.search)}
          </div>

          <div class="contacts-list-foot">
            <button class="btn-ghost" id="importContacts">Импорт CSV</button>
          </div>
        </aside>

        <section class="contacts-detail-pane">
          ${allContacts.length === 0 && !state.search ? renderGlobalEmpty() : selectedAlive ? renderDetail(selectedAlive) : renderNothing()}
        </section>

        ${state.waFloat.open ? renderWaFloat(selectedAlive || Store.get(COLLECTION, state.waFloat.contactId)) : ""}
      </div>
    `}

    ${state.importOpen ? renderImportModal() : ""}
    ${state.dupesModalOpen ? renderDupesModal(duplicates) : ""}
    ${state.trashOpen ? renderContactsTrashModal() : ""}
    ${state.importsHistoryOpen ? renderImportsHistoryModal() : ""}
    ${renderFormModal()}
    ${state.modalContactId ? renderContactModal(Store.get(COLLECTION, state.modalContactId)) : ""}
    ${state.view === "list" && state.waFloat.open ? renderWaFloat(Store.get(COLLECTION, state.waFloat.contactId) || selectedAlive) : ""}
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

function runImportParse(container, text, opts = {}) {
  const parsed = parseImport(text);
  if (!parsed?.rows?.length) {
    alert("Не удалось распознать строки для импорта. Проверь файл или текст.");
    return;
  }

  const mapping = { ...(parsed.autoMap || {}) };
  const saved = loadSavedImportMapping();
  if (mappingMatchesHeaders(saved, parsed.headers)) {
    Object.assign(mapping, saved.mapping || {});
  }

  state.importData = {
    step: 2,
    headers: parsed.headers || [],
    rows: parsed.rows || [],
    mapping,
    createDeals: true,
    stageId: defaultImportStageId(),
    skipDupes: true,
    rememberMapping: false,
    fileName: opts.fileName || null,
    rowsPayload: [],
    fieldDraft: null, // { column, label, type }
  };
  rebuildImportRowsPayload(state.importData);
  renderContacts(container);
}

function confirmImport(container) {
  const data = state.importData;
  if (!data) return;

  const me = currentEmployee();
  const ts = Date.now();
  const batch = Store.create(IMPORT_BATCHES, {
    ts,
    authorId: me?.id || null,
    fileName: data.fileName || null,
    rowCount: Array.isArray(data.rows) ? data.rows.length : 0,
    contactIds: [],
    dealIds: [],
    mapping: { ...(data.mapping || {}) },
    stageId: data.stageId || defaultImportStageId(),
    status: "active",
    revertedAt: null,
    revertedBy: null,
  });

  let createdContacts = 0;
  let createdDeals = 0;
  const contactIds = [];
  const dealIds = [];

  data.rowsPayload.forEach((entry) => {
    if (entry._dupe && data.skipDupes !== false) return;
    const payload = entry.contact || {};
    const created = Store.create(COLLECTION, {
      name: payload.name || "(без имени)",
      email: payload.email || "",
      phone: payload.phone || "",
      company: payload.company || "",
      position: payload.position || "",
      source: payload.source || "Импорт",
      tags: payload.tags || [],
      note: payload.note || "",
      type: "individual",
      importBatchId: batch.id,
    });

    createdContacts += 1;
    contactIds.push(created.id);
    if (data.createDeals) {
      const deal = createImportedDeal(created, entry.deal, { stageId: data.stageId });
      if (deal) {
        Store.update("deals", deal.id, { importBatchId: batch.id });
        createdDeals += 1;
        dealIds.push(deal.id);
      }
    }
  });

  Store.update(IMPORT_BATCHES, batch.id, { contactIds, dealIds });
  pruneImportBatchesHistory();

  if (data.rememberMapping) {
    saveImportMapping(data.headers, data.mapping);
  }

  alert(`Импортировано: ${createdContacts} контактов${data.createDeals ? `, ${createdDeals} сделок` : ""}.`);
  state.importOpen = false;
  state.importData = null;
  renderContacts(container);
}

function renderImportFieldOptions(data, colIndex) {
  const customFields = getDealFields();
  const selected = data.mapping?.[colIndex] || "skip";
  return `
    <select data-map-col="${colIndex}">
      <option value="skip" ${selected === "skip" ? "selected" : ""}>Пропустить колонку</option>
      <optgroup label="Поля контакта">
        ${IMPORT_CONTACT_FIELDS.map((f) => `<option value="${f.id}" ${selected === f.id ? "selected" : ""}>${f.label}</option>`).join("")}
      </optgroup>
      <optgroup label="Поля сделки">
        ${IMPORT_DEAL_FIELDS.map((f) => `<option value="${f.id}" ${selected === f.id ? "selected" : ""}>${f.label}</option>`).join("")}
      </optgroup>
      <optgroup label="Кастомные поля сделки">
        ${customFields.map((f) => {
          const key = `cf:${f.id}`;
          return `<option value="${key}" ${selected === key ? "selected" : ""}>${escape(f.label)}</option>`;
        }).join("")}
        <option value="__new_custom__">+ Создать кастомное поле…</option>
      </optgroup>
    </select>
  `;
}

function renderImportModal() {
  const data = state.importData;
  const stats = ensureImportStats(data);
  const mappedValues = new Set(Object.values(data?.mapping || {}));
  const hasRequiredMapping = mappedValues.has("name") || mappedValues.has("phone") || mappedValues.has("email");
  const previewRows = (data?.rowsPayload || []).slice(0, 20);
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
              : data.step === 2
                ? `
                  <div class="import-step2">
                    <div class="import-summary">
                      <strong>${escape(data.fileName || "Вставленный текст")}</strong>
                      · ${data.rows.length} строк
                      · ${data.headers.length} колонок
                    </div>
                    <div class="import-summary">
                      <strong>Будет импортировано: ${stats.importable}</strong>
                      · строк: ${stats.total}
                      ${stats.duplicates ? ` · <span style="color:var(--warning)">дубликатов: ${stats.duplicates}</span>` : ""}
                    </div>

                    <div class="import-map-table-wrap">
                      <table class="import-map-table">
                        <thead>
                          <tr>
                            <th>Колонка из файла</th>
                            <th></th>
                            <th>Поле</th>
                            <th>Превью</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${data.headers.map((header, idx) => `
                            <tr>
                              <td>${escape(header || `Колонка ${idx + 1}`)}</td>
                              <td>→</td>
                              <td>${renderImportFieldOptions(data, idx)}</td>
                              <td>${escape((data.rows[0] && data.rows[0][idx]) || "")}</td>
                            </tr>
                          `).join("")}
                        </tbody>
                      </table>
                    </div>

                    ${data.fieldDraft ? `
                      <div class="import-inline-field">
                        <h4>Новое кастомное поле сделки</h4>
                        <div class="import-inline-field-row">
                          <input type="text" id="importNewFieldLabel" value="${escapeAttr(data.fieldDraft.label || "")}" placeholder="Название поля">
                          <select id="importNewFieldType">
                            ${IMPORT_CUSTOM_FIELD_TYPES.map((t) => `<option value="${t.id}" ${data.fieldDraft.type === t.id ? "selected" : ""}>${escape(t.label)}</option>`).join("")}
                          </select>
                          <button type="button" class="btn-primary" id="importCreateField">Создать поле</button>
                          <button type="button" class="btn-ghost" id="importCancelField">Отмена</button>
                        </div>
                      </div>
                    ` : ""}

                    <div class="import-options">
                      <label class="checkbox-label">
                        <input type="checkbox" id="optCreateDeals" ${data.createDeals ? "checked" : ""}>
                        <span>Создавать сделку для каждого нового контакта</span>
                      </label>
                      ${data.createDeals ? `
                        <label class="import-stage-pick">
                          <span>Стадия:</span>
                          <select id="optDealStage">
                            ${getStages().map((s) => `<option value="${escapeAttr(s.id)}" ${data.stageId === s.id ? "selected" : ""}>${escape(s.title)}</option>`).join("")}
                          </select>
                        </label>
                      ` : ""}
                      <label class="checkbox-label">
                        <input type="checkbox" id="optSkipDupes" ${data.skipDupes !== false ? "checked" : ""}>
                        <span>Пропустить дубликаты (по email/телефону)</span>
                      </label>
                      <label class="checkbox-label">
                        <input type="checkbox" id="optRememberMapping" ${data.rememberMapping ? "checked" : ""}>
                        <span>Запомнить это сопоставление для следующих импортов</span>
                      </label>
                    </div>

                    <div class="form-buttons">
                      <button class="btn-ghost" id="importBack">Назад</button>
                      <button class="btn" id="importToPreview" ${hasRequiredMapping ? "" : "disabled"}>Далее</button>
                    </div>
                    ${hasRequiredMapping ? "" : '<div class="import-hint-warn">Нужно сопоставить хотя бы одну колонку с полем: Имя, Телефон или Email.</div>'}
                  </div>
                `
                : `
                  <div class="import-step3">
                    <div class="import-summary">
                      <strong>К подтверждению: ${stats.importable}</strong>
                      · строк: ${stats.total}
                      ${stats.duplicates ? ` · дубликатов: ${stats.duplicates}` : ""}
                    </div>
                    <div class="import-preview-table-wrap">
                      <table class="import-preview-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Контакт</th>
                            <th>Сделка</th>
                            <th>Статус</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${previewRows.map((entry, i) => `
                            <tr class="${entry._dupe ? "dupe" : ""}">
                              <td>${i + 1}</td>
                              <td>
                                <strong>${escape(entry.contact.name || "(без имени)")}</strong>
                                <div class="import-sub">${escape(entry.contact.phone || "")}${entry.contact.email ? ` · ${escape(entry.contact.email)}` : ""}</div>
                              </td>
                              <td>
                                ${data.createDeals
                                  ? `<strong>${escape(entry.deal.title || "Новая сделка")}</strong><div class="import-sub">${new Intl.NumberFormat("ru-RU").format(Number(entry.deal.amount || 0))} ₸</div>`
                                  : "Не создавать"}
                              </td>
                              <td>${entry._dupe ? "<span class=\"import-badge\">дубликат</span>" : "ok"}</td>
                            </tr>
                          `).join("")}
                        </tbody>
                      </table>
                    </div>
                    ${data.rowsPayload.length > previewRows.length ? `<div class="import-more">…и ещё ${data.rowsPayload.length - previewRows.length}</div>` : ""}
                    <div class="form-buttons">
                      <button class="btn-ghost" id="importStepBack">Назад</button>
                      <button class="btn" id="importConfirm">Импортировать ${stats.importable}</button>
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
  (() => {
    const searchEl = container.querySelector("#contactSearch");
    if (!searchEl) return;
    let debounce = null;
    searchEl.addEventListener("input", () => {
      const v = searchEl.value || "";
      const caretPos = typeof searchEl.selectionStart === "number" ? searchEl.selectionStart : v.length;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        state.search = v;
        renderContacts(container);
        const newEl = container.querySelector("#contactSearch");
        if (newEl) { newEl.focus(); try { newEl.setSelectionRange(caretPos, caretPos); } catch (_) {} }
      }, 220);
    });
  })();

  container.querySelectorAll("[data-contacts-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.contactsView === "list" ? "list" : "split";
      state.view = next;
      localStorage.setItem("pllato_contacts_view", next);
      if (next === "split" && !state.selectedId) {
        state.selectedId = listAliveContacts()[0]?.id || null;
      }
      renderContacts(container);
    });
  });

  container.querySelector("#openContactTrash")?.addEventListener("click", () => {
    state.trashOpen = true;
    renderContacts(container);
  });

  container.querySelector("#closeContactsTrash")?.addEventListener("click", () => {
    state.trashOpen = false;
    renderContacts(container);
  });

  container.querySelector("#contactsTrashBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "contactsTrashBackdrop") {
      state.trashOpen = false;
      renderContacts(container);
    }
  });

  container.querySelectorAll("[data-trash-restore]").forEach((btn) => {
    btn.addEventListener("click", () => {
      restoreContact(btn.dataset.trashRestore);
      renderContacts(container);
    });
  });

  container.querySelectorAll("[data-trash-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.trashDelete;
      const contact = Store.get(COLLECTION, id);
      if (!contact) return;
      if (!confirm(`Удалить контакт «${contact.name || "(без имени)"}» навсегда?`)) return;
      hardDeleteContact(id);
      renderContacts(container);
    });
  });

  container.querySelector("#openImportsHistory")?.addEventListener("click", () => {
    state.importsHistoryOpen = true;
    renderContacts(container);
  });

  container.querySelector("#closeImportsHistory")?.addEventListener("click", () => {
    state.importsHistoryOpen = false;
    renderContacts(container);
  });

  container.querySelector("#importsHistoryNew")?.addEventListener("click", () => {
    state.importsHistoryOpen = false;
    state.importOpen = true;
    state.importData = null;
    renderContacts(container);
  });

  container.querySelector("#importsHistoryBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "importsHistoryBackdrop") {
      state.importsHistoryOpen = false;
      renderContacts(container);
    }
  });

  container.querySelectorAll("[data-show-batch]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const batchId = btn.dataset.showBatch;
      if (!batchId) return;
      state.filters.importBatches = [batchId];
      state.view = "list";
      localStorage.setItem("pllato_contacts_view", state.view);
      state.importsHistoryOpen = false;
      renderContacts(container);
    });
  });

  container.querySelectorAll("[data-revert-batch]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const batchId = btn.dataset.revertBatch;
      const batch = Store.get(IMPORT_BATCHES, batchId);
      if (!batch) return;
      const contactsCount = (batch.contactIds || []).length;
      const dealsCount = (batch.dealIds || []).length;
      const label = batch.fileName || "Вставленный текст";
      if (!confirm(`Откатить импорт «${label}»? ${contactsCount} контактов и ${dealsCount} сделок будут перемещены в корзину.`)) return;
      const res = revertBatch(batchId);
      alert(`Откат выполнен: контактов ${res.revertedContacts}, сделок ${res.revertedDeals}.`);
      renderContacts(container);
    });
  });

  container.querySelector("#resetContactFilters")?.addEventListener("click", () => {
    resetAllFilters();
    state.selectedIds.clear();
    renderContacts(container);
  });

  container.querySelectorAll("[data-filter-source]").forEach((input) => {
    input.addEventListener("change", () => {
      const current = new Set(state.filters.source || []);
      const value = input.dataset.filterSource;
      if (!value) return;
      if (input.checked) current.add(value);
      else current.delete(value);
      state.filters.source = current.size ? [...current] : null;
      renderContacts(container);
    });
  });

  container.querySelectorAll('input[name="filter-date"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.filters.dateAdded = input.value || "any";
      renderContacts(container);
    });
  });

  container.querySelector("#filterDateFrom")?.addEventListener("change", (e) => {
    state.filters.dateAdded = "custom";
    state.filters.dateRange = { ...(state.filters.dateRange || { from: "", to: "" }), from: e.target.value || "" };
    renderContacts(container);
  });

  container.querySelector("#filterDateTo")?.addEventListener("change", (e) => {
    state.filters.dateAdded = "custom";
    state.filters.dateRange = { ...(state.filters.dateRange || { from: "", to: "" }), to: e.target.value || "" };
    renderContacts(container);
  });

  container.querySelectorAll("[data-filter-tag]").forEach((input) => {
    input.addEventListener("change", () => {
      const current = new Set(state.filters.tags || []);
      const value = input.dataset.filterTag;
      if (!value) return;
      if (input.checked) current.add(value);
      else current.delete(value);
      state.filters.tags = current.size ? [...current] : null;
      renderContacts(container);
    });
  });

  container.querySelectorAll("[data-filter-company]").forEach((input) => {
    input.addEventListener("change", () => {
      const current = new Set(state.filters.companies || []);
      const value = input.dataset.filterCompany;
      if (!value) return;
      if (input.checked) current.add(value);
      else current.delete(value);
      state.filters.companies = current.size ? [...current] : null;
      renderContacts(container);
    });
  });

  container.querySelectorAll('input[name="filter-phone"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.filters.hasPhone = input.value === "any" ? "any" : input.value === "true";
      renderContacts(container);
    });
  });

  container.querySelectorAll('input[name="filter-email"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.filters.hasEmail = input.value === "any" ? "any" : input.value === "true";
      renderContacts(container);
    });
  });

  container.querySelectorAll('input[name="filter-deals"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.filters.hasDeals = input.value === "any" ? "any" : input.value === "true";
      renderContacts(container);
    });
  });

  container.querySelectorAll("[data-filter-batch]").forEach((input) => {
    input.addEventListener("change", () => {
      const current = new Set(state.filters.importBatches || []);
      const value = input.dataset.filterBatch;
      if (!value) return;
      if (input.checked) current.add(value);
      else current.delete(value);
      state.filters.importBatches = current.size ? [...current] : null;
      renderContacts(container);
    });
  });

  container.querySelectorAll("[data-sort-col]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const col = btn.dataset.sortCol || "createdAt";
      if (state.sort.col === col) {
        state.sort = { col, dir: state.sort.dir === "asc" ? "desc" : "asc" };
      } else {
        state.sort = { col, dir: col === "createdAt" ? "desc" : "asc" };
      }
      renderContacts(container);
    });
  });

  container.querySelectorAll("[data-contact-check]").forEach((input) => {
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("change", () => {
      const id = input.dataset.contactCheck;
      if (!id) return;
      if (input.checked) state.selectedIds.add(id);
      else state.selectedIds.delete(id);
      renderContacts(container);
    });
  });

  container.querySelector("#contactsSelectAll")?.addEventListener("change", (e) => {
    const checked = Boolean(e.target.checked);
    const filteredIds = applyContactsFilters(listAliveContacts().filter((c) => matchesSearch(c, state.search))).map((c) => c.id);
    if (checked) filteredIds.forEach((id) => state.selectedIds.add(id));
    else filteredIds.forEach((id) => state.selectedIds.delete(id));
    renderContacts(container);
  });

  container.querySelector("#bulkSelectFiltered")?.addEventListener("click", () => {
    applyContactsFilters(listAliveContacts().filter((c) => matchesSearch(c, state.search))).forEach((c) => state.selectedIds.add(c.id));
    renderContacts(container);
  });

  container.querySelector("#bulkTagMenu")?.addEventListener("click", () => {
    state.bulkMenu = state.bulkMenu === "tag" ? null : "tag";
    renderContacts(container);
  });

  container.querySelector("#bulkSourceMenu")?.addEventListener("click", () => {
    state.bulkMenu = state.bulkMenu === "source" ? null : "source";
    renderContacts(container);
  });

  container.querySelectorAll("[data-bulk-tag]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = String(btn.dataset.bulkTag || "").trim();
      if (!tag) return;
      state.selectedIds.forEach((id) => {
        const c = Store.get(COLLECTION, id);
        if (!c || !isContactAlive(c)) return;
        const tags = new Set((c.tags || []).map((t) => String(t || "").trim()).filter(Boolean));
        tags.add(tag);
        Store.update(COLLECTION, id, { tags: [...tags] });
      });
      state.bulkMenu = null;
      renderContacts(container);
    });
  });

  container.querySelector("#bulkTagApply")?.addEventListener("click", () => {
    const tag = String(container.querySelector("#bulkTagInput")?.value || "").trim();
    if (!tag) return;
    state.selectedIds.forEach((id) => {
      const c = Store.get(COLLECTION, id);
      if (!c || !isContactAlive(c)) return;
      const tags = new Set((c.tags || []).map((t) => String(t || "").trim()).filter(Boolean));
      tags.add(tag);
      Store.update(COLLECTION, id, { tags: [...tags] });
    });
    state.bulkMenu = null;
    renderContacts(container);
  });

  container.querySelectorAll("[data-bulk-source]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const source = String(btn.dataset.bulkSource || "").trim();
      if (!source) return;
      state.selectedIds.forEach((id) => {
        const c = Store.get(COLLECTION, id);
        if (!c || !isContactAlive(c)) return;
        Store.update(COLLECTION, id, { source });
      });
      state.bulkMenu = null;
      renderContacts(container);
    });
  });

  container.querySelector("#bulkExportCsv")?.addEventListener("click", () => {
    const rows = [...state.selectedIds]
      .map((id) => Store.get(COLLECTION, id))
      .filter((c) => c && isContactAlive(c));
    exportContactsCsv(rows);
  });

  container.querySelector("#bulkTrash")?.addEventListener("click", () => {
    const rows = [...state.selectedIds]
      .map((id) => Store.get(COLLECTION, id))
      .filter((c) => c && isContactAlive(c));
    if (!rows.length) return;
    if (!confirm(`Переместить ${rows.length} контактов в корзину?`)) return;
    rows.forEach((c) => softDeleteContact(c.id));
    state.selectedIds.clear();
    state.bulkMenu = null;
    alert(`Перенесено в корзину: ${rows.length}`);
    renderContacts(container);
  });

  container.querySelector("#bulkClear")?.addEventListener("click", () => {
    state.selectedIds.clear();
    state.bulkMenu = null;
    renderContacts(container);
  });

  container.querySelectorAll("[data-contact-row]").forEach((row) => {
    row.addEventListener("click", (e) => {
      // Игнорируем клики по чекбоксам и кнопкам внутри строки (массовое выделение).
      if (e.target.closest("input,button,a,label")) return;
      const id = row.dataset.contactRow;
      if (!id) return;
      state.modalContactId = id;
      state.selectedId = id;
      state.activityFilter = "all";
      state.noteOpen = false;
      state.noteText = "";
      renderContacts(container);
    });
  });

  // Закрытие модалки контакта
  container.querySelector("[data-close-contact-modal]")?.addEventListener("click", () => {
    state.modalContactId = null;
    renderContacts(container);
  });
  container.querySelector(".contact-modal-overlay")?.addEventListener("click", (e) => {
    if (e.target.classList?.contains("contact-modal-overlay")) {
      state.modalContactId = null;
      renderContacts(container);
    }
  });
  // Если внутри модалки кликают по ссылке на сделку — закрываем модалку перед навигацией.
  container.querySelectorAll(".contact-modal a[href^='#crm/']").forEach((a) => {
    a.addEventListener("click", () => { state.modalContactId = null; });
  });
  // ESC закрывает модалку
  if (state.modalContactId && !container.dataset.contactEscWired) {
    container.dataset.contactEscWired = "1";
    const onEsc = (e) => {
      if (e.key === "Escape" && state.modalContactId) {
        state.modalContactId = null;
        renderContacts(container);
      }
    };
    document.addEventListener("keydown", onEsc);
  }

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
    if (!confirm(`Переместить контакт «${contact.name}» в корзину?`)) return;

    softDeleteContact(contact.id);
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
    if (!confirm(`Переместить контакт «${c.name}» в корзину?`)) return;
    softDeleteContact(c.id);
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
    runImportParse(container, text, { fileName: file.name || null });
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
      runImportParse(container, text, { fileName: file.name || null });
    });
  }

  container.querySelector("#importParse")?.addEventListener("click", () => {
    const text = String(container.querySelector("#importText")?.value || "");
    runImportParse(container, text, { fileName: null });
  });

  container.querySelector("#importBack")?.addEventListener("click", () => {
    state.importData = null;
    renderContacts(container);
  });

  container.querySelector("#importToPreview")?.addEventListener("click", () => {
    if (!state.importData) return;
    state.importData.step = 3;
    renderContacts(container);
  });

  container.querySelector("#importStepBack")?.addEventListener("click", () => {
    if (!state.importData) return;
    state.importData.step = 2;
    renderContacts(container);
  });

  container.querySelectorAll("[data-map-col]").forEach((select) => {
    select.addEventListener("change", () => {
      if (!state.importData) return;
      const col = Number(select.dataset.mapCol);
      if (!Number.isFinite(col)) return;
      const value = String(select.value || "skip");
      if (value === "__new_custom__") {
        state.importData.fieldDraft = {
          column: col,
          label: state.importData.headers[col] || `Поле ${col + 1}`,
          type: "text",
        };
        renderContacts(container);
        return;
      }
      state.importData.mapping[col] = value;
      state.importData.fieldDraft = null;
      rebuildImportRowsPayload(state.importData);
      renderContacts(container);
    });
  });

  container.querySelector("#importNewFieldLabel")?.addEventListener("input", (e) => {
    if (!state.importData?.fieldDraft) return;
    state.importData.fieldDraft.label = e.target.value || "";
  });

  container.querySelector("#importNewFieldType")?.addEventListener("change", (e) => {
    if (!state.importData?.fieldDraft) return;
    state.importData.fieldDraft.type = e.target.value || "text";
  });

  container.querySelector("#importCancelField")?.addEventListener("click", () => {
    if (!state.importData) return;
    state.importData.fieldDraft = null;
    renderContacts(container);
  });

  container.querySelector("#importCreateField")?.addEventListener("click", () => {
    if (!state.importData?.fieldDraft) return;
    const label = String(state.importData.fieldDraft.label || "").trim();
    if (!label) {
      alert("Укажи название поля.");
      return;
    }
    const fields = getDealFields();
    const order = fields.reduce((max, f) => Math.max(max, Number(f.order || 0)), 0) + 1;
    const id = newFieldId();
    saveDealFields([
      ...fields,
      {
        id,
        type: state.importData.fieldDraft.type || "text",
        label,
        required: false,
        showInKanban: true,
        options: [],
        order,
      },
    ]);
    state.importData.mapping[state.importData.fieldDraft.column] = `cf:${id}`;
    state.importData.fieldDraft = null;
    rebuildImportRowsPayload(state.importData);
    renderContacts(container);
  });

  container.querySelector("#optCreateDeals")?.addEventListener("change", (e) => {
    if (!state.importData) return;
    state.importData.createDeals = e.target.checked;
    renderContacts(container);
  });

  container.querySelector("#optDealStage")?.addEventListener("change", (e) => {
    if (!state.importData) return;
    state.importData.stageId = e.target.value || defaultImportStageId();
  });

  container.querySelector("#optSkipDupes")?.addEventListener("change", (e) => {
    if (state.importData) {
      state.importData.skipDupes = e.target.checked;
      renderContacts(container);
    }
  });

  container.querySelector("#optRememberMapping")?.addEventListener("change", (e) => {
    if (!state.importData) return;
    state.importData.rememberMapping = e.target.checked;
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
