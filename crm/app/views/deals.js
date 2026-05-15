// Pllato CRM — модуль CRM (Сделки / воронка).
// Редактируемые стадии, auto-scroll при drag, URL-ссылка на сделку,
// split-view карточка со шкалой стадий и таймлайном коммуникации.

import { Store } from "../store.js";
import { ICONS } from "../icons.js";
import { getStages, saveStages, newStageId, STAGE_COLORS, findStage } from "../stages.js";
import { getDealFields } from "../custom_fields.js";
import { openCommunicate } from "../communicate.js";
import { listEmployees, getEmployee, currentEmployee, avatar, initialsOf } from "../employees.js";
import { renderTypeahead, attachTypeahead } from "../typeahead.js";
import { listChannels } from "../channels.js";
import { renderCalls } from "./calls.js";
import {
  waCloudEnabled,
  syncWaCollections,
  resolveOrCreateDirectWaChat,
  messagesForChat,
  renderMessageMedia,
  sendWaFromDialog,
} from "../wa_dialog.js";

const COLLECTION = "deals";
const CONTACTS = "contacts";
const ACTIVITIES = "deal_activities";


const state = {
  modalOpen: false,
  modalDealId: null,
  newDealContactId: null,
  dragId: null,
  scrollTimer: null,
  stagesModalOpen: false,
  dealChatSyncing: false,
  dealChatSyncTimer: null,
  crmSearch: "",
  crmTab: "deals",
  callsRoute: { page: "dial" },
  // Плавающее WhatsApp-окно (открывается из карточки сделки).
  waFloat: { open: false, contactId: null, dealId: null, mediaOpen: false, searchOpen: false, searchQuery: "", draftText: "" },
  // Режим блока контакта в карточке сделки: view (просмотр) / edit (правка полей) / change (выбор другого) / create (новый контакт).
  contactMode: "view",
  contactCreateDraft: null,
  activityFilter: "all",
};

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmtAmount(n) {
  if (!n && n !== 0) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₸";
}
function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}
function fmtDayMonth(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}
function fmtDateInput(ts) {
  if (!ts) return "";
  return new Date(ts).toISOString().slice(0, 10);
}
function fmtTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function fmtChatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function fmtTimeShort(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function defaultContactCreateDraft(name = "") {
  return {
    type: "individual",
    name: String(name || "").trim(),
    company: "",
    phone: "",
    email: "",
    source: "",
    note: "",
  };
}

function textNorm(v) {
  return String(v ?? "").toLowerCase();
}

function digitsOnly(v) {
  return String(v || "").replace(/[^\d]/g, "");
}

function buildActivityTextByDeal() {
  const out = new Map();
  Store.list(ACTIVITIES).forEach((a) => {
    const line = [
      a.type,
      a.text,
      a.title,
      a.subject,
      a.to,
      a.notes,
      a.fromStage,
      a.toStage,
      a.outcome,
    ].filter(Boolean).join(" ");
    if (!line || !a.dealId) return;
    out.set(a.dealId, (out.get(a.dealId) || "") + " " + line);
  });
  return out;
}

function buildChatTextByPhone() {
  const textByChat = new Map();
  Store.list("chat_messages").forEach((m) => {
    const media = m.media || {};
    const line = [m.text, media.caption, media.fileName].filter(Boolean).join(" ");
    if (!line || !m.chatId) return;
    textByChat.set(m.chatId, ((textByChat.get(m.chatId) || "") + " " + line).trim());
  });

  const textByPhone = new Map();
  Store.list("chats").forEach((chat) => {
    const phoneDigits = digitsOnly(chat?.phone || chat?.waChatId || "");
    if (!phoneDigits) return;
    const chatText = textByChat.get(chat.id);
    if (!chatText) return;
    textByPhone.set(phoneDigits, ((textByPhone.get(phoneDigits) || "") + " " + chatText).trim());
  });
  return textByPhone;
}

function buildDealSearchText(deal, contact, stageTitle, activityText, chatText) {
  const custom = Object.values(deal.customFields || {}).join(" ");
  const tags = Array.isArray(contact?.tags) ? contact.tags.join(" ") : "";
  const dueText = deal.dueDate ? new Date(deal.dueDate).toLocaleDateString("ru-RU") : "";

  return textNorm([
    deal.title,
    deal.notes,
    deal.amount,
    dueText,
    stageTitle,
    custom,
    contact?.name,
    contact?.phone,
    contact?.email,
    contact?.company,
    contact?.position,
    contact?.notes,
    tags,
    activityText,
    chatText,
  ].filter(Boolean).join(" "));
}

function resolveCallsTabFromHash() {
  const parts = (location.hash || "#crm").replace(/^#/, "").split("/").filter(Boolean);
  if (parts[0] === "calls") return true;
  return parts[0] === "crm" && parts[1] === "calls";
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
  if (unique.length) return unique;
  return ["WhatsApp", "Звонок", "Рекомендация", "Сайт", "Дилеры"];
}

function stageTitleById(stageId) {
  if (!stageId) return "";
  return findStage(stageId)?.title || String(stageId);
}

function isWinStage(stage) {
  const key = `${stage?.id || ""} ${stage?.title || ""}`.toLowerCase();
  return key.includes("won") || key.includes("win") || key.includes("выиг");
}

function isLossStage(stage) {
  const key = `${stage?.id || ""} ${stage?.title || ""}`.toLowerCase();
  return key.includes("lost") || key.includes("loss") || key.includes("проиг");
}

function activityMatchesFilter(a, filter) {
  if (!a) return false;
  if (filter === "wa") return a.type === "whatsapp";
  if (filter === "call") return a.type === "call";
  if (filter === "note") return a.type === "note";
  return true;
}

function filterActivities(activities, filter) {
  return (activities || []).filter((a) => activityMatchesFilter(a, filter || "all"));
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

function renderActivityFilterTabs(activities) {
  const current = state.activityFilter || "all";
  const counts = activityCounts(activities || []);
  const tabs = [
    { id: "all", label: "Все" },
    { id: "wa", label: "WhatsApp", count: counts.wa },
    { id: "call", label: "Звонки", count: counts.call },
    { id: "note", label: "Заметки", count: counts.note },
  ];
  return `
    <div class="timeline-filters" id="timelineFilterTabs">
      ${tabs.map((tab) => `
        <button type="button" class="timeline-filter-btn ${current === tab.id ? "active" : ""}" data-filter="${tab.id}">
          <span>${tab.label}</span>
          ${tab.count > 0 ? `<span class="timeline-filter-count">●${tab.count}</span>` : ""}
        </button>
      `).join("")}
    </div>
  `;
}

function dayKey(ts) {
  const d = new Date(ts || Date.now());
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function waDayLabel(ts) {
  const current = new Date();
  const prev = new Date(Date.now() - 86400000);
  const key = dayKey(ts);
  if (key === dayKey(current.getTime())) return "сегодня";
  if (key === dayKey(prev.getTime())) return "вчера";
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
    : (messages || []);

  if (filtered.length === 0) {
    return `<div class="chat-empty">${query ? "Поиск не дал результатов." : "Сообщений пока нет."}</div>`;
  }

  const asc = [...filtered].sort((a, b) => (a.ts || a.createdAt || 0) - (b.ts || b.createdAt || 0));
  let prevKey = "";

  return asc.map((m) => {
    const ts = m.ts || m.createdAt || Date.now();
    const key = dayKey(ts);
    const divider = key !== prevKey
      ? `<div class="wa-day-divider"><span>${escape(waDayLabel(ts))}</span></div>`
      : "";
    prevKey = key;

    return `${divider}
      <div class="msg ${m.from === "me" ? "me" : "them"}">
        <div class="msg-bubble">
          ${m.text ? `<div class="msg-text">${escape(m.text).replace(/\n/g, "<br>")}</div>` : ""}
          ${renderMessageMedia(m)}
        </div>
        <div class="msg-time">${fmtChatTime(ts)} ${renderMessageStatus(m)}</div>
      </div>
    `;
  }).join("");
}

// Привести сделки к актуальному списку стадий: если стадия удалена — переносим в первую
function reconcileDeals(stages) {
  const ids = new Set(stages.map(s => s.id));
  const fallback = stages[0]?.id || "new";
  const deals = Store.list(COLLECTION);
  deals.forEach(d => {
    if (!ids.has(d.stage)) Store.update(COLLECTION, d.id, { stage: fallback });
  });
}

// Демо-сидинг
function seedDemo() {
  if (Store.list(COLLECTION).length > 0) return;
  const contacts = Store.list(CONTACTS);
  if (contacts.length === 0) return;
  const me = currentEmployee();
  const now = Date.now();
  const stages = getStages();
  const samples = [
    { title: "CRM на 50 пользователей", amount: 4500000, stage: "proposal",  contactId: contacts[0]?.id, dueDate: now + 7*86400000, notes: "Запрошено демо.", assigneeId: me?.id },
    { title: "Запуск маркетплейса",     amount: 2800000, stage: "qualified", contactId: contacts[1]?.id, dueDate: now + 14*86400000, notes: "Уточнить требования.", assigneeId: me?.id },
    { title: "Внедрение телефонии",     amount: 1200000, stage: "new",       contactId: contacts[2]?.id, dueDate: null, notes: "", assigneeId: me?.id },
    { title: "Поддержка и SLA",         amount: 800000,  stage: "won",       contactId: contacts[0]?.id, dueDate: null, notes: "Контракт подписан.", assigneeId: me?.id },
  ];
  const ids = new Set(stages.map(s => s.id));
  samples.forEach(d => {
    if (d.contactId && ids.has(d.stage)) Store.create(COLLECTION, d);
  });
}

function activitiesFor(dealId) {
  return Store.list(ACTIVITIES).filter(a => a.dealId === dealId).reverse();
}
function addActivity(dealId, type, data = {}) {
  const me = currentEmployee();
  return Store.create(ACTIVITIES, {
    dealId,
    type,
    authorId: me?.id,
    ts: Date.now(),
    ...data,
  });
}

export function renderDeals(container) {
  const stages = getStages();
  reconcileDeals(stages);
  seedDemo();

  if (resolveCallsTabFromHash()) {
    state.crmTab = "calls";
  }

  const deals = Store.list(COLLECTION);
  const contacts = Store.list(CONTACTS);
  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));

  const activityTextByDeal = buildActivityTextByDeal();
  const chatTextByPhone = buildChatTextByPhone();
  const query = String(state.crmSearch || "").trim();
  const queryNorm = textNorm(query);

  const filteredDeals = queryNorm
    ? deals.filter((d) => {
        const contact = contactMap[d.contactId] || null;
        const phoneDigits = digitsOnly(contact?.phone || "");
        const stageTitle = findStage(d.stage)?.title || "";
        const searchBlob = buildDealSearchText(
          d,
          contact,
          stageTitle,
          activityTextByDeal.get(d.id) || "",
          phoneDigits ? (chatTextByPhone.get(phoneDigits) || "") : "",
        );
        return searchBlob.includes(queryNorm);
      })
    : deals;

  const byStage = Object.fromEntries(stages.map(s => [s.id, []]));
  filteredDeals.forEach(d => { if (byStage[d.stage]) byStage[d.stage].push(d); });

  container.innerHTML = `
    <div class="deals-view">
      <div class="deals-toolbar">
        <div class="crm-top-controls">
          <div class="crm-view-switch">
            <button class="crm-view-btn ${state.crmTab === "deals" ? "active" : ""}" data-crm-tab="deals">${ICONS.deals}<span>CRM</span></button>
            <button class="crm-view-btn ${state.crmTab === "calls" ? "active" : ""}" data-crm-tab="calls">${ICONS.phone}<span>Звонки</span></button>
          </div>
          <label class="crm-global-search">
            <span class="crm-search-icon">${ICONS.search}</span>
            <input id="crmGlobalSearch" type="search" value="${escapeAttr(state.crmSearch)}" placeholder="Поиск по CRM: карточки, заметки, активности, переписка...">
            ${state.crmSearch ? `<button type="button" class="crm-search-clear" id="clearCrmSearch" aria-label="Очистить поиск">${ICONS.x}</button>` : ""}
          </label>
        </div>

        <div class="deals-toolbar-right">
          ${state.crmTab === "deals" ? `<button class="btn-ghost" id="manageStages" title="Настроить стадии">${ICONS.settings}<span>Стадии</span></button>` : ""}
          ${state.crmTab === "deals" ? `<button class="btn-primary" id="newDeal">${ICONS.plus}<span>Сделка</span></button>` : ""}
        </div>
      </div>

      ${state.crmTab === "deals" ? `
        <div class="crm-search-meta">
          ${queryNorm
            ? `Найдено: <strong>${filteredDeals.length}</strong> сделок`
            : `Сделок: <strong>${deals.length}</strong>`}
        </div>

        ${queryNorm && filteredDeals.length === 0
          ? `<div class="crm-search-empty">По запросу «${escape(query)}» ничего не найдено. Проверь формулировку или убери часть текста.</div>`
          : ""}

        <div class="kanban" id="kanbanWrap">
          ${stages.map(stage => renderColumn(stage, byStage[stage.id], contactMap)).join("")}
        </div>
      ` : `
        <div class="crm-calls-wrap">
          <div id="crmCallsMount"></div>
        </div>
      `}

      ${state.crmTab === "deals" && state.modalOpen ? renderDealModal(Store.get(COLLECTION, state.modalDealId), contacts, stages) : ""}
      ${state.crmTab === "deals" && state.stagesModalOpen ? renderStagesModal(stages) : ""}
      ${state.crmTab === "deals" && state.waFloat.open ? renderWaFloat(
        Store.get(COLLECTION, state.waFloat.dealId),
        contactMap[state.waFloat.contactId] || null
      ) : ""}
    </div>
  `;

  wireEvents(container);

  if (state.crmTab === "calls") {
    const callsMount = container.querySelector("#crmCallsMount");
    if (callsMount) {
      renderCalls(callsMount, {
        embedded: true,
        route: state.callsRoute,
        onRouteChange: (route) => { state.callsRoute = route; },
      });
    }
    return;
  }

  ensureDealChatLoop(container);
}

function renderColumn(stage, deals, contactMap) {
  return `
    <div class="kanban-col" data-stage="${stage.id}" style="--stage-color: ${stage.color}">
      <div class="kanban-col-head">
        <span class="dot"></span>
        <span class="kanban-col-title">${escape(stage.title)}</span>
        <span class="kanban-col-count">${deals.length}</span>
      </div>
      <div class="kanban-col-body" data-stage="${stage.id}">
        ${deals.length === 0
          ? `<div class="kanban-empty">Перетащи сюда</div>`
          : deals.map(d => renderCard(d, contactMap[d.contactId])).join("")}
      </div>
    </div>
  `;
}

function renderCard(d, contact) {
  const stage = findStage(d.stage);
  const assignee = getEmployee(d.assigneeId);
  return `
    <article class="deal-card" data-id="${d.id}" draggable="true" style="border-left-color:${stage?.color || "var(--accent)"}">
      <div class="deal-card-title">${escape(d.title || "(без названия)")}</div>
      <div class="deal-card-meta">
        <span class="deal-amount">${fmtAmount(d.amount)}</span>
        ${d.dueDate ? `<span class="deal-due">${ICONS.calendar} ${fmtDate(d.dueDate)}</span>` : ""}
      </div>
      <div class="deal-card-foot">
        ${contact ? `<span class="deal-contact"><span class="avatar avatar-xs">${initialsOf(contact.name)}</span>${escape(contact.name)}</span>` : "<span></span>"}
        ${assignee ? avatar(assignee, "xs") : ""}
      </div>
    </article>
  `;
}

// =========================================================================
// Модалка СДЕЛКИ — split-view: слева поля, справа таймлайн
// =========================================================================
function renderDealModal(d, contacts, stages) {
  const isNew = !d;
  if (isNew) {
    d = {
      title: "",
      amount: "",
      stage: stages[0]?.id || "new",
      contactId: state.newDealContactId || contacts[0]?.id || "",
      dueDate: null,
      notes: "",
    };
  }
  const employees = listEmployees();
  const contact = contacts.find(c => c.id === d.contactId);
  const assignee = getEmployee(d.assigneeId);
  const acts = isNew ? [] : activitiesFor(d.id);
  const shownActs = filterActivities(acts, state.activityFilter);
  const createdLabel = fmtDayMonth(d.createdAt || d.ts);
  const compactId = String(d.id || "").slice(-6);

  return `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal modal-xl" role="dialog" aria-modal="true">
        <header class="modal-header">
          <div class="deal-head-main">
            ${!isNew
              ? `<div class="deal-meta-line">Сделка #${escape(compactId || d.id || "")}${createdLabel ? ` · открыта ${escape(createdLabel)}` : ""}</div>`
              : ""}
            <h2>${isNew ? "Новая сделка" : escape(d.title || "Без названия")}</h2>
          </div>
          <div class="modal-actions">
            ${!isNew ? `<button type="button" class="btn-ghost icon-only" id="copyLink" title="Скопировать ссылку">${ICONS.link}</button>` : ""}
            <button type="button" class="btn-ghost icon-only" id="closeModal" aria-label="Закрыть">${ICONS.x}</button>
          </div>
        </header>

        ${!isNew ? renderStageBar(d.stage, stages) : ""}

        <div class="deal-modal-body">
          <div class="deal-form-col">
            <form id="dealForm" class="form-grid form-grid-1col">
              <div class="field field-wide">
                <label>Название *</label>
                <input name="title" required value="${escape(d.title)}" placeholder="Например: внедрение CRM">
              </div>
              <div class="field">
                <label>Сумма, ₸</label>
                <input name="amount" type="number" min="0" step="1000" value="${d.amount || ""}" placeholder="0">
              </div>
              ${renderDealContactBlock(contact, d)}
              ${renderTypeahead({
                name: "assigneeId",
                value: d.assigneeId,
                items: employees.map(e => ({ id: e.id, name: e.name, sub: e.email || "" })),
                label: "Ответственный",
                placeholder: "Поиск сотрудника…",
                emptyText: "— не назначен —",
              })}
              ${renderCustomFields(d)}
              <div class="field field-wide form-buttons">
                ${!isNew ? `<button type="button" class="btn-ghost danger" id="deleteDeal">${ICONS.trash}<span>Удалить</span></button>` : "<span></span>"}
                ${isNew
                  ? `<button type="submit" class="btn">Создать</button>`
                  : `<span class="deal-autosave-hint" id="dealAutosaveHint" data-state="idle">Автосохранение включено</span>`}
              </div>
            </form>
          </div>

          ${!isNew ? `
            <div class="deal-timeline-col">
              <div class="timeline-tabs">
                <button class="tlb-btn active" data-act="note">📝 Заметка</button>
                <button class="tlb-btn" data-act="email">✉ Письмо</button>
                <button class="tlb-btn" data-act="task">⚙ Дело</button>
                <button class="tlb-btn" data-act="whatsapp">💬 WhatsApp</button>
                <button class="tlb-btn" data-act="call">📞 Звонок</button>
              </div>
              <div class="timeline-input" id="timelineInput">
                ${renderTimelineInput("note")}
              </div>
              ${renderActivityFilterTabs(acts)}
              <div class="timeline-list">
                ${shownActs.length === 0
                  ? `<div class="tl-empty">Активности по сделке появятся здесь. Добавь первую — заметку, письмо, дело или звонок.</div>`
                  : shownActs.map(a => renderActivity(a)).join("")}
              </div>
            </div>
          ` : ""}
        </div>
        ${!isNew ? renderDealActionBar(d, contact) : ""}
      </div>
    </div>
  `;
}

function renderCustomFields(d) {
  const fields = getDealFields();
  if (fields.length === 0) return "";
  const values = d.customFields || {};
  return fields.map(f => {
    const v = values[f.id] ?? "";
    if (f.type === "select") {
      const opts = (f.options || []).map(o => `<option value="${escape(o)}" ${v === o ? "selected" : ""}>${escape(o)}</option>`).join("");
      return `<div class="field"><label>${escape(f.label)}</label><select name="cf_${f.id}"><option value="">—</option>${opts}</select></div>`;
    }
    if (f.type === "number") {
      return `<div class="field"><label>${escape(f.label)}</label><input name="cf_${f.id}" type="number" value="${escape(v)}"></div>`;
    }
    if (f.type === "date") {
      return `<div class="field"><label>${escape(f.label)}</label><input name="cf_${f.id}" type="date" value="${escape(v)}"></div>`;
    }
    return `<div class="field"><label>${escape(f.label)}</label><input name="cf_${f.id}" type="text" value="${escape(v)}"></div>`;
  }).join("");
}

function renderStageBar(activeId, stages) {
  return `
    <div class="deal-stage-bar">
      ${stages.map((s, idx) => `
        <div class="deal-stage-step ${s.id === activeId ? "active" : ""} ${isWinStage(s) ? "is-win" : ""} ${isLossStage(s) ? "is-loss" : ""}" style="--stage-color:${s.color}">
          <button class="deal-stage-bar-btn ${s.id === activeId ? "active" : ""}" data-stage="${s.id}" style="--stage-color:${s.color}">
            ${escape(s.title)}
          </button>
          ${idx < stages.length - 1 ? `<span class="deal-stage-arrow" aria-hidden="true">${ICONS.arrowRight}</span>` : ""}
        </div>
      `).join("")}
    </div>
  `;
}

function renderTimelineInput(type) {
  if (type === "task") {
    return `
      <input type="text" id="tlTitle" placeholder="Что нужно сделать">
      <input type="datetime-local" id="tlDueAt">
      <button class="btn-primary" id="tlSubmit">Создать дело</button>
    `;
  }
  if (type === "email") {
    return `
      <input type="email" id="tlEmail" placeholder="Кому (email)">
      <input type="text" id="tlSubject" placeholder="Тема">
      <textarea id="tlText" rows="3" placeholder="Текст письма..."></textarea>
      <button class="btn-primary" id="tlSubmit">Отправить</button>
    `;
  }
  if (type === "call") {
    return `
      <input type="text" id="tlText" placeholder="Что обсудили на звонке...">
      <button class="btn-primary" id="tlSubmit">Записать звонок</button>
    `;
  }
  if (type === "whatsapp") {
    return `
      <textarea id="tlText" rows="3" placeholder="Текст для WhatsApp..."></textarea>
      <button class="btn-primary" id="tlSubmit">Отправить в WA</button>
    `;
  }
  return `
    <textarea id="tlText" rows="3" placeholder="Заметка по сделке..."></textarea>
    <button class="btn-primary" id="tlSubmit">Сохранить</button>
  `;
}

function renderActivity(a) {
  const author = getEmployee(a.authorId);
  const type = a.type || "note";
  const icons = { note: "📝", email: "✉", task: "⚙", whatsapp: "💬", call: "📞" };
  const labels = { note: "Заметка", email: "Письмо", task: "Дело", whatsapp: "WhatsApp", call: "Звонок" };
  const by = escape(author?.name || "Я");
  const time = fmtTimeShort(a.ts || a.createdAt);

  if (type === "stage") {
    const from = stageTitleById(a.fromStage);
    const to = stageTitleById(a.toStage);
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

  let body = "";
  if (type === "email") {
    body = `<div class="act-sub">→ ${escape(a.to || "")}${a.subject ? " · " + escape(a.subject) : ""}</div><div>${escape(a.text || "").replace(/\n/g, "<br>")}</div>`;
  } else if (type === "task") {
    body = `<div class="act-task"><span class="act-task-title">${escape(a.title || "")}</span>${a.dueAt ? `<span class="act-task-due">⏰ ${fmtTime(a.dueAt)}</span>` : ""}</div>`;
  } else {
    body = `<div>${escape(a.text || "").replace(/\n/g, "<br>")}</div>`;
  }

  return `
    <div class="tl-item">
      <div class="tl-ico">${icons[type] || "•"}</div>
      <div class="tl-body">
        <div class="tl-head">
          <span class="tl-author">${by}</span>
          <span class="tl-type">${labels[type] || type}</span>
          <span class="tl-time">${fmtTime(a.ts || a.createdAt)}</span>
        </div>
        ${body}
      </div>
    </div>
  `;
}

// Блок контакта в карточке сделки.
// 3 режима через state.contactMode: view (карточка), edit (правка полей), change (выбор другого).
// Внутри всегда есть hidden input name="contactId" — поэтому FormData сабмита формы продолжает работать.
function renderDealContactBlock(contact, d) {
  const contacts = Store.list(CONTACTS);
  const mode = state.contactMode || "view";
  const draft = { ...defaultContactCreateDraft(), ...(state.contactCreateDraft || {}) };
  const sourceOptions = contactSourceOptions();
  const sourceValue = sourceOptions.includes(draft.source) ? draft.source : (sourceOptions[0] || "");

  // Режим выбора другого контакта (или первичный выбор для новой сделки).
  if (mode === "change" || (!contact && mode !== "edit" && mode !== "create")) {
    return `
      <div class="deal-contact-block deal-contact-pick">
        ${renderTypeahead({
          name: "contactId",
          value: d.contactId,
          items: contacts.map(c => ({ id: c.id, name: c.name || "(без имени)", sub: c.company || c.email || c.phone || "" })),
          label: "Контакт",
          placeholder: "Поиск по имени, компании, email…",
          createLabel: "Создать контакт",
          emptyText: "— не выбран —",
        })}
        <div class="dcc-pick-actions">
          <button type="button" class="btn-ghost btn-sm" id="createContactInline">+ Создать новый контакт</button>
          ${contact ? `<button type="button" class="btn-ghost btn-sm dcc-cancel" id="cancelContactChange">Отмена</button>` : ""}
        </div>
      </div>
    `;
  }

  // Режим создания нового контакта и мгновенной привязки к сделке.
  if (mode === "create") {
    const isCompany = draft.type === "company";
    return `
      <div class="deal-contact-block deal-contact-creating">
        <div class="dcc-label">Новый контакт</div>
        <input type="hidden" name="contactId" value="${escapeAttr(d.contactId || "")}">
        <div class="dcc-type-toggle">
          <button type="button" class="dcc-type-btn ${!isCompany ? "active" : ""}" data-contact-type="individual">Физлицо</button>
          <button type="button" class="dcc-type-btn ${isCompany ? "active" : ""}" data-contact-type="company">Компания</button>
        </div>
        <div class="dcc-create-grid">
          <div class="field field-wide">
            <label>${isCompany ? "Название компании" : "Имя"}</label>
            <input type="text" id="dccCreateName" value="${escapeAttr(draft.name)}" placeholder="${isCompany ? "Например: Boutique Almaty" : "Имя и фамилия"}">
          </div>
          ${!isCompany ? `
            <div class="field field-wide">
              <label>Компания</label>
              <input type="text" id="dccCreateCompany" value="${escapeAttr(draft.company)}" placeholder="Компания (опционально)">
            </div>
          ` : ""}
          <div class="field">
            <label>Телефон</label>
            <input type="tel" id="dccCreatePhone" value="${escapeAttr(draft.phone)}" placeholder="+7...">
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" id="dccCreateEmail" value="${escapeAttr(draft.email)}" placeholder="example@mail.com">
          </div>
          <div class="field">
            <label>Источник</label>
            <select id="dccCreateSource">
              ${sourceOptions.map((opt) => `<option value="${escapeAttr(opt)}" ${sourceValue === opt ? "selected" : ""}>${escape(opt)}</option>`).join("")}
            </select>
          </div>
          <div class="field field-wide">
            <label>Примечание</label>
            <textarea id="dccCreateNote" rows="2" placeholder="Комментарий (опционально)">${escape(draft.note || "")}</textarea>
          </div>
        </div>
        <div class="dcc-create-actions">
          <button type="button" class="btn-ghost btn-sm" id="cancelContactCreate">Отмена</button>
          <button type="button" class="btn-primary btn-sm" id="createContactAndBind">Создать и привязать</button>
        </div>
      </div>
    `;
  }

  // Режим inline-редактирования полей контакта.
  if (mode === "edit" && contact) {
    return `
      <div class="deal-contact-block deal-contact-editing">
        <div class="dcc-label">Редактирование контакта</div>
        <input type="hidden" name="contactId" value="${escapeAttr(contact.id)}">
        <div class="dce-grid">
          <input type="text" id="dceName" placeholder="Имя" value="${escapeAttr(contact.name || "")}">
          <input type="text" id="dcePhone" placeholder="Телефон" value="${escapeAttr(contact.phone || "")}">
          <input type="email" id="dceEmail" placeholder="Email" value="${escapeAttr(contact.email || "")}">
          <input type="text" id="dceCompany" placeholder="Компания" value="${escapeAttr(contact.company || "")}">
        </div>
        <div class="dce-actions">
          <button type="button" class="btn-ghost btn-sm" id="cancelContactEdit">Отмена</button>
          <button type="button" class="btn-primary btn-sm" id="saveContactEdit">Сохранить контакт</button>
        </div>
      </div>
    `;
  }

  // Режим карточки (по умолчанию).
  if (!contact) {
    return `
      <div class="deal-contact-block deal-contact-pick">
        ${renderTypeahead({
          name: "contactId",
          value: d.contactId,
          items: contacts.map(c => ({ id: c.id, name: c.name || "(без имени)", sub: c.company || c.email || c.phone || "" })),
          label: "Контакт",
          placeholder: "Поиск по имени, компании, email…",
          createLabel: "Создать контакт",
          emptyText: "— не выбран —",
        })}
        <div class="dcc-pick-actions">
          <button type="button" class="btn-ghost btn-sm" id="createContactInline">+ Создать новый контакт</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="deal-contact-block">
      <div class="dcc-label">Контакт</div>
      <input type="hidden" name="contactId" value="${escapeAttr(contact.id)}">
      <div class="deal-contact-card">
        <div class="avatar avatar-md">${escape(initialsOf(contact.name || contact.phone || "?"))}</div>
        <div class="dcc-info">
          <div class="dcc-name">${escape(contact.name || "(без имени)")}</div>
          ${contact.phone ? `<div class="dcc-line">${ICONS.phone}<span>${escape(contact.phone)}</span></div>` : ""}
          ${contact.email ? `<div class="dcc-line">${ICONS.mail}<span>${escape(contact.email)}</span></div>` : ""}
          ${contact.company ? `<div class="dcc-line dcc-meta">${ICONS.building}<span>${escape(contact.company)}</span></div>` : ""}
        </div>
        <div class="dcc-actions">
          <button type="button" class="btn-ghost icon-only" id="editContact" title="Изменить данные контакта">${ICONS.edit}</button>
          <button type="button" class="btn-ghost icon-only" id="changeContact" title="Сменить контакт">${ICONS.users}</button>
        </div>
      </div>
    </div>
  `;
}

// Нижняя панель действий: Позвонить · WhatsApp · Заметка.
// Показывается только для существующих сделок (для новой ещё нечем позвонить — нет данных).
function renderDealActionBar(d, contact) {
  const hasPhone = Boolean(contact?.phone);
  return `
    <footer class="deal-action-bar">
      <button type="button" class="deal-action-btn" id="actionBarCall" ${!hasPhone ? "disabled" : ""} title="${hasPhone ? "Позвонить" : "У контакта нет телефона"}">
        ${ICONS.phone}<span>Позвонить</span>
      </button>
      <button type="button" class="deal-action-btn deal-action-btn-primary" id="actionBarWA" ${!hasPhone ? "disabled" : ""} title="${hasPhone ? "Открыть WhatsApp" : "У контакта нет телефона"}">
        <span class="dab-emoji">💬</span><span>WhatsApp</span>
      </button>
      <button type="button" class="deal-action-btn" id="actionBarNote" title="Добавить заметку в ленту">
        <span class="dab-emoji">📝</span><span>Заметка</span>
      </button>
    </footer>
  `;
}

// Плавающее WhatsApp-окно (фиксировано снизу справа). Использует те же утилиты wa_dialog.js.
function renderWaFloat(deal, contact) {
  const searchQuery = state.waFloat.searchQuery || "";
  const draftText = state.waFloat.draftText || "";
  const sendIcon = draftText.trim() ? ICONS.send : ICONS.mic;

  if (!contact?.phone) {
    return `
      <div class="wa-float" id="waFloat">
        <div class="wa-float-head">
          <div class="wa-float-title">WhatsApp</div>
          <button type="button" class="btn-ghost icon-only" id="closeWaFloat" aria-label="Закрыть">${ICONS.x}</button>
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
          <button type="button" class="btn-ghost icon-only" id="closeWaFloat" aria-label="Закрыть">${ICONS.x}</button>
        </div>
        <div class="wa-float-empty">Не удалось открыть чат.</div>
      </div>
    `;
  }

  const messages = messagesForChat(chat.id);
  const phoneToCall = contact?.phone || "";
  return `
    <div class="wa-float" id="waFloat" data-chat-id="${escapeAttr(chat.id)}" data-channel-id="${escapeAttr(channel?.id || "")}" data-phone="${escapeAttr(phoneToCall)}">
      <div class="wa-float-head">
        <div class="wa-float-user">
          <div class="avatar avatar-sm">${escape(initialsOf(contact.name || contact.phone || "?"))}</div>
          <div class="wa-float-meta">
            <div class="wa-float-title">${escape(contact.name || contact.phone)}</div>
            <div class="wa-float-sub">${escape(channel?.name ? `Канал: ${channel.name}` : "WhatsApp канал не настроен")}</div>
          </div>
        </div>
        <div class="wa-float-head-actions">
          <button type="button" class="btn-ghost icon-only" id="waFloatSearchToggle" title="Поиск по сообщениям">${ICONS.search}</button>
          <button type="button" class="btn-ghost icon-only" id="waFloatCall" title="Позвонить">${ICONS.phone}</button>
          <button type="button" class="btn-ghost icon-only" id="closeWaFloat" aria-label="Закрыть">${ICONS.x}</button>
        </div>
      </div>
      ${state.waFloat.searchOpen ? `
        <div class="wa-float-search">
          <input type="search" id="waFloatSearchInput" value="${escapeAttr(searchQuery)}" placeholder="Поиск в переписке...">
        </div>
      ` : ""}
      <div class="chat-messages wa-float-messages" id="waFloatMessages">
        ${renderWaMessages(messages, searchQuery)}
      </div>
      <form class="wa-float-compose" id="waFloatForm">
        <button type="button" class="wa-compose-icon-btn" id="waToggleMedia" title="Файл">${ICONS.paperclip}</button>
        <button type="button" class="wa-compose-icon-btn" id="waCameraStub" title="Камера (в разработке)" disabled>${ICONS.camera}</button>
        <input name="text" type="text" id="waFloatText" value="${escapeAttr(draftText)}" placeholder="Сообщение клиенту...">
        <button type="button" class="wa-compose-icon-btn" id="waSmileStub" title="Эмодзи (скоро)">${ICONS.smile}</button>
        <button type="submit" class="wa-compose-send-btn" id="waFloatSendBtn" title="Отправить">
          ${sendIcon}
        </button>
      </form>
      <form class="chat-compose chat-compose-media ${state.waFloat.mediaOpen ? "" : "is-hidden"}" id="waFloatMedia">
        <input name="fileUrl" type="url" placeholder="Ссылка на файл (опц.)">
        <input name="fileName" type="text" placeholder="Имя файла (опц.)">
        <label class="chat-voice-opt"><input name="asVoice" id="waAsVoice" type="checkbox"> voice</label>
      </form>
    </div>
  `;
}

async function syncDealChatCloud(container) {
  if (!waCloudEnabled()) return;
  if (state.dealChatSyncing) return;
  state.dealChatSyncing = true;
  try {
    await syncWaCollections();
    // Не перерисовываем открытую модалку сделки: это ломает UX (мигание и сброс фокуса/дропдаунов).
    // Также не перерисовываем при открытом плавающем WA-окне.
    const shouldSkip = (state.modalOpen && state.modalDealId) || state.waFloat.open;
    if (container?.isConnected && !shouldSkip) renderDeals(container);
  } catch (e) {
    console.warn("deals chat sync failed:", e);
  } finally {
    state.dealChatSyncing = false;
  }
}

function ensureDealChatLoop(container) {
  if (!waCloudEnabled() || state.dealChatSyncTimer) return;
  state.dealChatSyncTimer = setInterval(() => {
    if (!container?.isConnected) {
      clearInterval(state.dealChatSyncTimer);
      state.dealChatSyncTimer = null;
      return;
    }
    // Тянем апдейты пока открыта карточка сделки ИЛИ плавающее окно.
    if ((state.modalOpen && state.modalDealId) || state.waFloat.open) syncDealChatCloud(container);
  }, 12000);
}

// =========================================================================
// Модалка УПРАВЛЕНИЯ СТАДИЯМИ
// =========================================================================
function renderStagesModal(stages) {
  return `
    <div class="modal-backdrop" id="stagesBackdrop">
      <div class="modal" role="dialog" aria-modal="true" style="max-width: 520px;">
        <header class="modal-header">
          <h2>Стадии воронки</h2>
          <button type="button" class="btn-ghost icon-only" id="closeStagesModal">${ICONS.x}</button>
        </header>
        <div class="stages-edit">
          ${stages.map((s, i) => `
            <div class="stage-edit-row" data-index="${i}" data-id="${s.id}">
              <button class="se-handle" title="Перетащи" data-handle="${s.id}">${ICONS.grip}</button>
              <input type="color" value="${s.color}" data-color="${s.id}">
              <input type="text" value="${escape(s.title)}" data-title="${s.id}" placeholder="Название стадии">
              <button class="btn-ghost icon-only danger" data-remove="${s.id}" ${stages.length <= 1 ? "disabled" : ""}>${ICONS.trash}</button>
            </div>
          `).join("")}
          <div class="stages-up-down" id="upDownHint">
            Используй стрелки для перестановки:
            ${stages.map((s, i) => `
              <span class="ud-row">
                <button data-up="${i}" ${i === 0 ? "disabled" : ""}>↑</button>
                <button data-down="${i}" ${i === stages.length - 1 ? "disabled" : ""}>↓</button>
                <span>${escape(s.title)}</span>
              </span>
            `).join("")}
          </div>
        </div>
        <footer class="modal-footer">
          <button class="btn-ghost" id="addStage">${ICONS.plus}<span>Добавить стадию</span></button>
          <div class="modal-footer-right">
            <button class="btn-ghost" id="cancelStages">Отмена</button>
            <button class="btn" id="saveStages">Сохранить</button>
          </div>
        </footer>
      </div>
    </div>
  `;
}

// =========================================================================
// Open/close helpers (с URL-hash)
// =========================================================================
function openDealModal(container, dealId = null, prefillContactId = null) {
  state.crmTab = "deals";
  state.modalOpen = true;
  state.modalDealId = dealId;
  state.newDealContactId = dealId ? null : prefillContactId;
  state.contactMode = "view";
  state.contactCreateDraft = null;
  state.activityFilter = "all";
  state.waFloat = { open: false, contactId: null, dealId: null, mediaOpen: false, searchOpen: false, searchQuery: "", draftText: "" };
  if (dealId) location.hash = `#crm/${dealId}`;
  renderDeals(container);
}
function closeDealModal(container) {
  state.modalOpen = false;
  state.modalDealId = null;
  state.newDealContactId = null;
  state.contactMode = "view";
  state.contactCreateDraft = null;
  state.activityFilter = "all";
  state.waFloat = { open: false, contactId: null, dealId: null, mediaOpen: false, searchOpen: false, searchQuery: "", draftText: "" };
  if (location.hash.startsWith("#crm/")) location.hash = "#crm";
  renderDeals(container);
}

// Открытие сделки из URL — вызывается извне (из app.js router)
export function tryOpenDealFromHash() {
  const hash = location.hash || "";

  if (/^#calls(?:\/|$)/.test(hash) || /^#crm\/calls(?:\/|$)/.test(hash)) {
    state.crmTab = "calls";
    state.modalOpen = false;
    state.modalDealId = null;
    state.waFloat = { open: false, contactId: null, dealId: null, mediaOpen: false, searchOpen: false, searchQuery: "", draftText: "" };
    return;
  }

  const m = hash.match(/^#crm\/(.+)$/);
  if (m && m[1] !== "calls") {
    if (m[1].startsWith("new")) {
      const [, query = ""] = m[1].split("?");
      const params = new URLSearchParams(query || "");
      state.crmTab = "deals";
      state.modalOpen = true;
      state.modalDealId = null;
      state.newDealContactId = params.get("contactId") || null;
      return;
    }
    state.crmTab = "deals";
    state.modalOpen = true;
    state.modalDealId = m[1];
    state.newDealContactId = null;
  }
}

// =========================================================================
// Events
// =========================================================================
function wireEvents(container) {
  const contacts = Store.list(CONTACTS);

  container.querySelectorAll("[data-crm-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextTab = btn.dataset.crmTab === "calls" ? "calls" : "deals";
      if (nextTab === state.crmTab) return;

      state.crmTab = nextTab;
      if (nextTab === "calls") {
        state.modalOpen = false;
        state.modalDealId = null;
        state.stagesModalOpen = false;
        state.waFloat = { open: false, contactId: null, dealId: null, mediaOpen: false, searchOpen: false, searchQuery: "", draftText: "" };
        if (!/^#crm\/calls(?:\/|$)/.test(location.hash || "")) {
          location.hash = "#crm/calls/dial";
          return;
        }
      } else if (/^#calls(?:\/|$)/.test(location.hash || "") || /^#crm\/calls(?:\/|$)/.test(location.hash || "")) {
        location.hash = "#crm";
        return;
      }

      renderDeals(container);
    });
  });

  container.querySelector("#crmGlobalSearch")?.addEventListener("input", (e) => {
    state.crmSearch = e.target.value || "";
    renderDeals(container);
  });

  container.querySelector("#clearCrmSearch")?.addEventListener("click", () => {
    state.crmSearch = "";
    renderDeals(container);
  });

  if (state.crmTab !== "deals") return;

  container.querySelector("#newDeal")?.addEventListener("click", () => openDealModal(container, null, null));
  container.querySelector("#manageStages")?.addEventListener("click", () => {
    state.stagesModalOpen = true;
    renderDeals(container);
  });

  // Открытие сделки
  container.querySelectorAll(".deal-card").forEach(card => {
    card.addEventListener("click", () => {
      if (state.dragId) return;
      openDealModal(container, card.dataset.id);
    });

    // Drag&Drop
    card.addEventListener("dragstart", e => {
      state.dragId = card.dataset.id;
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", card.dataset.id);
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      clearInterval(state.scrollTimer); state.scrollTimer = null;
      setTimeout(() => { state.dragId = null; }, 50);
    });
  });

  const wrap = container.querySelector("#kanbanWrap");
  container.querySelectorAll(".kanban-col").forEach(col => {
    col.addEventListener("dragover", e => {
      e.preventDefault();
      col.classList.add("drop-target");
      // Auto-scroll по краям Kanban
      if (wrap) {
        const rect = wrap.getBoundingClientRect();
        const edge = 90;
        const x = e.clientX;
        if (x > rect.right - edge) {
          if (!state.scrollTimer) state.scrollTimer = setInterval(() => { wrap.scrollLeft += 18; }, 16);
        } else if (x < rect.left + edge) {
          if (!state.scrollTimer) state.scrollTimer = setInterval(() => { wrap.scrollLeft -= 18; }, 16);
        } else {
          clearInterval(state.scrollTimer); state.scrollTimer = null;
        }
      }
    });
    col.addEventListener("dragleave", () => {
      col.classList.remove("drop-target");
    });
    col.addEventListener("drop", e => {
      e.preventDefault();
      col.classList.remove("drop-target");
      clearInterval(state.scrollTimer); state.scrollTimer = null;
      const id = e.dataTransfer.getData("text/plain") || state.dragId;
      if (!id) return;
      const stage = col.dataset.stage;
      const deal = Store.get(COLLECTION, id);
      if (deal && deal.stage !== stage) {
        Store.update(COLLECTION, id, { stage });
        addActivity(id, "stage", { fromStage: deal.stage, toStage: stage });
        renderDeals(container);
      }
    });
  });

  // ----- Deal Modal -----
  const dealForm = container.querySelector("#dealForm");
  if (dealForm) {
    // Подгружаем items для typeahead в window.__taItems
    window.__taItems = window.__taItems || {};
    window.__taItems.contactId = Store.list(CONTACTS).map(c => ({ id: c.id, name: c.name || "(без имени)", sub: c.company || c.email || c.phone || "" }));
    window.__taItems.assigneeId = listEmployees().map(e => ({ id: e.id, name: e.name, sub: e.email || "" }));
    attachTypeahead(dealForm, {
      onCreate: async (name, query) => {
        if (name === "contactId") {
          state.contactMode = "create";
          state.contactCreateDraft = defaultContactCreateDraft(query || "");
          renderDeals(container);
          return null;
        }
        return null;
      },
    });
    container.querySelector("#closeModal")?.addEventListener("click", () => closeDealModal(container));
    container.querySelector("#modalBackdrop")?.addEventListener("click", e => {
      if (e.target.id === "modalBackdrop") closeDealModal(container);
    });
    container.querySelector("#deleteDeal")?.addEventListener("click", () => {
      if (!state.modalDealId) return;
      const d = Store.get(COLLECTION, state.modalDealId);
      if (confirm(`Удалить сделку «${d.title}»?`)) {
        Store.remove(COLLECTION, state.modalDealId);
        // удалить активности
        Store.list(ACTIVITIES).filter(a => a.dealId === state.modalDealId).forEach(a => Store.remove(ACTIVITIES, a.id));
        closeDealModal(container);
      }
    });
    // Кнопки коммуникации перенесены в нижнюю панель действий — см. #actionBar* ниже.

    container.querySelector("#copyLink")?.addEventListener("click", () => {
      const url = `${location.origin}${location.pathname}#crm/${state.modalDealId}`;
      navigator.clipboard?.writeText(url).then(
        () => { alert("Ссылка скопирована:\n" + url); },
        () => { prompt("Скопируй ссылку:", url); }
      );
    });

    const autosaveHint = container.querySelector("#dealAutosaveHint");
    let autosaveTimer = null;
    let autosaveSnapshot = "";

    function setAutosaveState(text, mode = "idle") {
      if (!autosaveHint) return;
      autosaveHint.textContent = text;
      autosaveHint.dataset.state = mode;
    }

    function collectDealFormData() {
      const fd = new FormData(dealForm);
      // Собираем кастомные поля
      const customFields = {};
      getDealFields().forEach(f => {
        const v = fd.get("cf_" + f.id);
        if (v !== null) customFields[f.id] = String(v).trim();
      });
      // dueDate и notes больше не редактируются через форму (заметки → лента активности).
      // Legacy-значения существующих сделок остаются нетронутыми — не передаём их в update.
      return {
        title: (fd.get("title") || "").trim(),
        amount: Number(fd.get("amount")) || 0,
        contactId: fd.get("contactId") || null,
        assigneeId: fd.get("assigneeId") || null,
        customFields,
      };
    }

    function saveExistingDeal(force = false) {
      if (!state.modalDealId) return;
      const data = collectDealFormData();
      if (!data.title) {
        setAutosaveState("Укажи название сделки", "error");
        return;
      }
      // Любые временные режимы блока контакта сбрасываем после сохранения.
      state.contactMode = "view";
      const nextSnapshot = JSON.stringify(data);
      if (!force && nextSnapshot === autosaveSnapshot) return;
      Store.update(COLLECTION, state.modalDealId, data);
      autosaveSnapshot = nextSnapshot;
      setAutosaveState(`Сохранено ${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`, "saved");
    }

    function scheduleAutosave() {
      if (!state.modalDealId) return;
      clearTimeout(autosaveTimer);
      setAutosaveState("Сохраняем...", "saving");
      autosaveTimer = setTimeout(() => saveExistingDeal(false), 350);
    }

    if (state.modalDealId) {
      autosaveSnapshot = JSON.stringify(collectDealFormData());
      setAutosaveState("Автосохранение включено", "idle");
      dealForm.addEventListener("input", scheduleAutosave);
      dealForm.addEventListener("change", scheduleAutosave);
    }

    dealForm.addEventListener("submit", e => {
      e.preventDefault();
      if (state.modalDealId) {
        saveExistingDeal(true);
        return;
      }

      const data = collectDealFormData();
      if (!data.title) return;
      const created = Store.create(COLLECTION, { ...data, stage: getStages()[0]?.id || "new" });
      addActivity(created.id, "deal_created", { text: "Сделка создана" });
      state.modalDealId = created.id;
      state.newDealContactId = null;
      state.activityFilter = "all";
      renderDeals(container);
    });

    function renderTimelineListFromStore() {
      if (!state.modalDealId) return;
      const list = container.querySelector(".timeline-list");
      if (!list) return;
      const allActs = activitiesFor(state.modalDealId);
      const shown = filterActivities(allActs, state.activityFilter);
      list.innerHTML = shown.length === 0
        ? `<div class="tl-empty">Активности по сделке появятся здесь. Добавь первую — заметку, письмо, дело или звонок.</div>`
        : shown.map((a) => renderActivity(a)).join("");
    }

    function bindTimelineFilters() {
      container.querySelectorAll(".timeline-filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.activityFilter = btn.dataset.filter || "all";
          const allActs = activitiesFor(state.modalDealId);
          const host = container.querySelector("#timelineFilterTabs");
          if (host) host.outerHTML = renderActivityFilterTabs(allActs);
          bindTimelineFilters();
          renderTimelineListFromStore();
        });
      });
    }

    function refreshTimeline() {
      if (!state.modalDealId) return;
      const allActs = activitiesFor(state.modalDealId);
      const host = container.querySelector("#timelineFilterTabs");
      if (host) host.outerHTML = renderActivityFilterTabs(allActs);
      bindTimelineFilters();
      renderTimelineListFromStore();
    }

    bindTimelineFilters();

    // ----- Stage bar (быстрое переключение) -----
    container.querySelectorAll(".deal-stage-bar-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!state.modalDealId) return;
        const newStage = btn.dataset.stage;
        const deal = Store.get(COLLECTION, state.modalDealId);
        if (deal && deal.stage !== newStage) {
          Store.update(COLLECTION, state.modalDealId, { stage: newStage });
          addActivity(state.modalDealId, "stage", { fromStage: deal.stage, toStage: newStage });
          refreshTimeline();
          container.querySelectorAll(".deal-stage-bar-btn").forEach(b => b.classList.toggle("active", b.dataset.stage === newStage));
        }
      });
    });

    // ----- Timeline (заметки/письма/дела/wa/звонки) -----
    let currentTl = "note";
    container.querySelectorAll(".tlb-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".tlb-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentTl = btn.dataset.act;
        const inp = container.querySelector("#timelineInput");
        if (inp) inp.innerHTML = renderTimelineInput(currentTl);
        bindTimelineSubmit();
      });
    });
    function bindTimelineSubmit() {
      const submit = container.querySelector("#tlSubmit");
      submit?.addEventListener("click", () => {
        if (!state.modalDealId) return;

        let act = null;
        const text = container.querySelector("#tlText")?.value.trim();
        if (currentTl === "task") {
          const title = container.querySelector("#tlTitle")?.value.trim();
          const dueAtRaw = container.querySelector("#tlDueAt")?.value;
          if (!title) return;
          act = addActivity(state.modalDealId, "task", { title, dueAt: dueAtRaw ? new Date(dueAtRaw).getTime() : null });
          const titleEl = container.querySelector("#tlTitle");
          const dueEl = container.querySelector("#tlDueAt");
          if (titleEl) titleEl.value = "";
          if (dueEl) dueEl.value = "";
        } else if (currentTl === "email") {
          const to = container.querySelector("#tlEmail")?.value.trim();
          const subject = container.querySelector("#tlSubject")?.value.trim();
          if (!text && !to) return;
          act = addActivity(state.modalDealId, "email", { to, subject, text });
          const toEl = container.querySelector("#tlEmail");
          const subjEl = container.querySelector("#tlSubject");
          const textEl = container.querySelector("#tlText");
          if (toEl) toEl.value = "";
          if (subjEl) subjEl.value = "";
          if (textEl) textEl.value = "";
        } else {
          if (!text) return;
          act = addActivity(state.modalDealId, currentTl, { text });
          const textEl = container.querySelector("#tlText");
          if (textEl) textEl.value = "";
        }

        if (act) refreshTimeline();
      });
    }
    bindTimelineSubmit();

    // ===== Экшн-бар внизу карточки =====
    container.querySelector("#actionBarCall")?.addEventListener("click", () => {
      const deal = Store.get(COLLECTION, state.modalDealId);
      const c = contacts.find(x => x.id === deal?.contactId);
      if (!c?.phone) return;
      openCommunicate({ type: "call", to: c.phone, contactName: c.name,
        context: { collection: ACTIVITIES, fk: { dealId: state.modalDealId } },
        onDone: () => renderDeals(container) });
    });
    container.querySelector("#actionBarWA")?.addEventListener("click", () => {
      const deal = Store.get(COLLECTION, state.modalDealId);
      const c = contacts.find(x => x.id === deal?.contactId);
      if (!c?.phone) return;
      // Открываем плавающее окно поверх карточки сделки.
      state.waFloat = { open: true, contactId: c.id, dealId: state.modalDealId, mediaOpen: false, searchOpen: false, searchQuery: "", draftText: "" };
      renderDeals(container);
    });
    container.querySelector("#actionBarNote")?.addEventListener("click", () => {
      // Активируем таб «Заметка» в таймлайне и фокусируем поле ввода.
      const noteTab = container.querySelector('.tlb-btn[data-act="note"]');
      noteTab?.click();
      const ta = container.querySelector("#tlText");
      ta?.focus();
      ta?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // ===== Карточка контакта: edit / change / cancel / save =====
    container.querySelector("#editContact")?.addEventListener("click", () => {
      state.contactMode = "edit";
      renderDeals(container);
    });
    container.querySelector("#changeContact")?.addEventListener("click", () => {
      state.contactMode = "change";
      state.contactCreateDraft = null;
      renderDeals(container);
    });
    container.querySelector("#createContactInline")?.addEventListener("click", () => {
      state.contactMode = "create";
      state.contactCreateDraft = defaultContactCreateDraft("");
      renderDeals(container);
    });
    container.querySelector("#cancelContactEdit")?.addEventListener("click", () => {
      state.contactMode = "view";
      renderDeals(container);
    });
    container.querySelector("#cancelContactChange")?.addEventListener("click", () => {
      state.contactMode = "view";
      renderDeals(container);
    });
    container.querySelector("#cancelContactCreate")?.addEventListener("click", () => {
      state.contactMode = "change";
      renderDeals(container);
    });
    container.querySelectorAll("[data-contact-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = { ...defaultContactCreateDraft(), ...(state.contactCreateDraft || {}) };
        state.contactCreateDraft = { ...current, type: btn.dataset.contactType === "company" ? "company" : "individual" };
        renderDeals(container);
      });
    });

    function syncContactCreateDraftFromInputs() {
      if (state.contactMode !== "create") return;
      const current = { ...defaultContactCreateDraft(), ...(state.contactCreateDraft || {}) };
      state.contactCreateDraft = {
        ...current,
        name: String(container.querySelector("#dccCreateName")?.value || "").trim(),
        company: String(container.querySelector("#dccCreateCompany")?.value || "").trim(),
        phone: String(container.querySelector("#dccCreatePhone")?.value || "").trim(),
        email: String(container.querySelector("#dccCreateEmail")?.value || "").trim(),
        source: String(container.querySelector("#dccCreateSource")?.value || "").trim(),
        note: String(container.querySelector("#dccCreateNote")?.value || "").trim(),
      };
    }

    ["#dccCreateName", "#dccCreateCompany", "#dccCreatePhone", "#dccCreateEmail", "#dccCreateSource", "#dccCreateNote"].forEach((sel) => {
      container.querySelector(sel)?.addEventListener("input", syncContactCreateDraftFromInputs);
      container.querySelector(sel)?.addEventListener("change", syncContactCreateDraftFromInputs);
    });

    container.querySelector("#createContactAndBind")?.addEventListener("click", () => {
      syncContactCreateDraftFromInputs();
      const draft = { ...defaultContactCreateDraft(), ...(state.contactCreateDraft || {}) };
      const baseName = String(draft.name || "").trim();
      if (!baseName) {
        container.querySelector("#dccCreateName")?.focus();
        return;
      }

      const isCompany = draft.type === "company";
      const company = isCompany ? baseName : String(draft.company || "").trim();
      const created = Store.create(CONTACTS, {
        type: isCompany ? "company" : "individual",
        name: baseName,
        company,
        phone: String(draft.phone || "").trim(),
        email: String(draft.email || "").trim(),
        source: String(draft.source || "").trim(),
        notes: String(draft.note || "").trim(),
        position: "",
        tags: [],
      });

      if (state.modalDealId) {
        Store.update(COLLECTION, state.modalDealId, { contactId: created.id });
      }
      window.__taItems.contactId = Store.list(CONTACTS).map((c) => ({
        id: c.id,
        name: c.name || "(без имени)",
        sub: c.company || c.email || c.phone || "",
      }));
      state.contactMode = "view";
      state.contactCreateDraft = null;
      renderDeals(container);
    });

    container.querySelector("#saveContactEdit")?.addEventListener("click", () => {
      const deal = Store.get(COLLECTION, state.modalDealId);
      if (!deal?.contactId) return;
      const name = container.querySelector("#dceName")?.value.trim() || "";
      const phone = container.querySelector("#dcePhone")?.value.trim() || "";
      const email = container.querySelector("#dceEmail")?.value.trim() || "";
      const company = container.querySelector("#dceCompany")?.value.trim() || "";
      Store.update(CONTACTS, deal.contactId, { name, phone, email, company });
      state.contactMode = "view";
      renderDeals(container);
    });

    // ===== Плавающее WhatsApp-окно =====
    container.querySelector("#closeWaFloat")?.addEventListener("click", () => {
      state.waFloat = { open: false, contactId: null, dealId: null, mediaOpen: false, searchOpen: false, searchQuery: "", draftText: "" };
      renderDeals(container);
    });

    container.querySelector("#waToggleMedia")?.addEventListener("click", () => {
      state.waFloat = { ...state.waFloat, mediaOpen: !state.waFloat.mediaOpen };
      renderDeals(container);
    });

    container.querySelector("#waFloatSearchToggle")?.addEventListener("click", () => {
      state.waFloat = {
        ...state.waFloat,
        searchOpen: !state.waFloat.searchOpen,
        searchQuery: !state.waFloat.searchOpen ? state.waFloat.searchQuery : "",
      };
      renderDeals(container);
    });

    container.querySelector("#waFloatSearchInput")?.addEventListener("input", (e) => {
      state.waFloat = { ...state.waFloat, searchQuery: e.target.value || "", searchOpen: true };
      const float = container.querySelector("#waFloat");
      const chatId = float?.dataset.chatId || "";
      const messages = chatId ? messagesForChat(chatId) : [];
      const wrap = container.querySelector("#waFloatMessages");
      if (wrap) wrap.innerHTML = renderWaMessages(messages, state.waFloat.searchQuery);
    });

    container.querySelector("#waFloatCall")?.addEventListener("click", () => {
      const deal = Store.get(COLLECTION, state.modalDealId);
      const c = contacts.find(x => x.id === deal?.contactId);
      if (!c?.phone) return;
      openCommunicate({
        type: "call",
        to: c.phone,
        contactName: c.name,
        context: { collection: ACTIVITIES, fk: { dealId: state.modalDealId } },
        onDone: () => renderDeals(container),
      });
    });

    const waFloatForm = container.querySelector("#waFloatForm");
    waFloatForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const float = container.querySelector("#waFloat");
      const chatId = float?.dataset.chatId || "";
      const channelId = float?.dataset.channelId || "";
      const chat = chatId ? Store.get("chats", chatId) : null;
      const channel = listChannels({ type: "greenapi_wa" }).find(x => x.id === channelId) || null;

      if (!chat || !channel) {
        alert("Нет активного WhatsApp канала или чат не найден.");
        return;
      }

      const textInput = waFloatForm.querySelector("input[name='text']");
      const text = String(textInput?.value || "").trim();
      const mediaForm = container.querySelector("#waFloatMedia");
      const fileUrl = String(mediaForm?.querySelector("input[name='fileUrl']")?.value || "").trim();
      const fileName = String(mediaForm?.querySelector("input[name='fileName']")?.value || "").trim();
      let asVoice = !!mediaForm?.querySelector("input[name='asVoice']")?.checked;
      if (!text && !fileUrl) {
        const voiceToggle = mediaForm?.querySelector("input[name='asVoice']");
        if (voiceToggle) voiceToggle.checked = true;
        return;
      }

      const btn = waFloatForm.querySelector("button[type='submit']");
      btn?.setAttribute("disabled", "disabled");
      try {
        await sendWaFromDialog({ chat, channel, text, urlFile: fileUrl, fileName, asVoice });
      } catch (err) {
        alert(err?.message || String(err));
        return;
      } finally {
        btn?.removeAttribute("disabled");
      }

      // Зеркалим сообщение в ленту активности сделки.
      if (state.waFloat.dealId) {
        addActivity(state.waFloat.dealId, "whatsapp", {
          text: text || (fileUrl ? `[Файл] ${fileName || fileUrl}` : ""),
        });
      }

      waFloatForm.reset();
      mediaForm?.reset();
      state.waFloat = { ...state.waFloat, draftText: "" };
      renderDeals(container);
      setTimeout(() => { syncDealChatCloud(container); }, 700);
    });

    const waTextInput = container.querySelector("#waFloatText");
    const waSendBtn = container.querySelector("#waFloatSendBtn");
    waTextInput?.addEventListener("input", () => {
      const value = String(waTextInput.value || "");
      state.waFloat = { ...state.waFloat, draftText: value };
      if (waSendBtn) {
        waSendBtn.innerHTML = value.trim() ? ICONS.send : ICONS.mic;
      }
    });
  }

  // ----- Stages Modal -----
  if (state.stagesModalOpen) wireStagesModal(container);
}

function wireStagesModal(container) {
  let stagesDraft = getStages().map(s => ({ ...s }));

  function rerenderModal() {
    state.stagesModalOpen = false;
    // обновлять только модалку — но проще целиком
    saveStagesDraft();
    state.stagesModalOpen = true;
    renderDeals(container);
  }
  function saveStagesDraft() {
    // считать из DOM в draft (на случай если пользователь редактировал inputs)
    stagesDraft = Array.from(container.querySelectorAll(".stage-edit-row")).map(row => ({
      id: row.dataset.id,
      title: container.querySelector(`[data-title="${row.dataset.id}"]`)?.value || "",
      color: container.querySelector(`[data-color="${row.dataset.id}"]`)?.value || "#8896b3",
    }));
  }

  container.querySelector("#closeStagesModal")?.addEventListener("click", () => {
    state.stagesModalOpen = false; renderDeals(container);
  });
  container.querySelector("#cancelStages")?.addEventListener("click", () => {
    state.stagesModalOpen = false; renderDeals(container);
  });
  container.querySelector("#stagesBackdrop")?.addEventListener("click", e => {
    if (e.target.id === "stagesBackdrop") { state.stagesModalOpen = false; renderDeals(container); }
  });

  container.querySelector("#addStage")?.addEventListener("click", () => {
    saveStagesDraft();
    stagesDraft.push({ id: newStageId(), title: "Новая стадия", color: STAGE_COLORS[stagesDraft.length % STAGE_COLORS.length] });
    saveStages(stagesDraft);
    renderDeals(container);
  });

  container.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      saveStagesDraft();
      const id = btn.dataset.remove;
      stagesDraft = stagesDraft.filter(s => s.id !== id);
      if (stagesDraft.length === 0) stagesDraft = [{ id: newStageId(), title: "Новая", color: "#8896b3" }];
      saveStages(stagesDraft);
      reconcileDeals(stagesDraft);
      renderDeals(container);
    });
  });

  container.querySelectorAll("[data-up]").forEach(btn => {
    btn.addEventListener("click", () => {
      saveStagesDraft();
      const i = Number(btn.dataset.up);
      if (i > 0) {
        [stagesDraft[i - 1], stagesDraft[i]] = [stagesDraft[i], stagesDraft[i - 1]];
        saveStages(stagesDraft);
        renderDeals(container);
      }
    });
  });
  container.querySelectorAll("[data-down]").forEach(btn => {
    btn.addEventListener("click", () => {
      saveStagesDraft();
      const i = Number(btn.dataset.down);
      if (i < stagesDraft.length - 1) {
        [stagesDraft[i + 1], stagesDraft[i]] = [stagesDraft[i], stagesDraft[i + 1]];
        saveStages(stagesDraft);
        renderDeals(container);
      }
    });
  });

  // Кнопка Сохранить — собирает значения inputs и пишет
  container.querySelector("#saveStages")?.addEventListener("click", () => {
    saveStagesDraft();
    saveStages(stagesDraft);
    state.stagesModalOpen = false;
    renderDeals(container);
  });
}
