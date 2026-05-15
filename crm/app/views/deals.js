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
import {
  waCloudEnabled,
  syncWaCollections,
  resolveOrCreateDirectWaChat,
  messagesForChat,
  renderDialogMessages,
  sendWaFromDialog,
} from "../wa_dialog.js";

const COLLECTION = "deals";
const CONTACTS = "contacts";
const ACTIVITIES = "deal_activities";


const state = {
  modalOpen: false,
  modalDealId: null,
  dragId: null,
  scrollTimer: null,
  stagesModalOpen: false,
  dealChatSyncing: false,
  dealChatSyncTimer: null,
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

  const deals = Store.list(COLLECTION);
  const contacts = Store.list(CONTACTS);
  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c]));

  const byStage = Object.fromEntries(stages.map(s => [s.id, []]));
  deals.forEach(d => { if (byStage[d.stage]) byStage[d.stage].push(d); });

  container.innerHTML = `
    <div class="deals-view">
      <div class="deals-toolbar">
        <div class="deals-totals">
          ${stages.map(s => {
            const list = byStage[s.id];
            const sum = list.reduce((a, d) => a + (Number(d.amount) || 0), 0);
            return `<div class="stage-total" style="--stage-color: ${s.color}">
              <span class="dot"></span>
              <span class="stage-name">${escape(s.title)}</span>
              <span class="stage-count">${list.length}</span>
              <span class="stage-sum">${fmtAmount(sum)}</span>
            </div>`;
          }).join("")}
        </div>
        <div class="deals-toolbar-right">
          <button class="btn-ghost" id="manageStages" title="Настроить стадии">${ICONS.settings}<span>Стадии</span></button>
          <button class="btn-primary" id="newDeal">${ICONS.plus}<span>Сделка</span></button>
        </div>
      </div>

      <div class="kanban" id="kanbanWrap">
        ${stages.map(stage => renderColumn(stage, byStage[stage.id], contactMap)).join("")}
      </div>

      ${state.modalOpen ? renderDealModal(Store.get(COLLECTION, state.modalDealId), contacts, stages) : ""}
      ${state.stagesModalOpen ? renderStagesModal(stages) : ""}
    </div>
  `;

  wireEvents(container);
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
    d = { title: "", amount: "", stage: stages[0]?.id || "new", contactId: contacts[0]?.id || "", dueDate: null, notes: "" };
  }
  const employees = listEmployees();
  const contact = contacts.find(c => c.id === d.contactId);
  const assignee = getEmployee(d.assigneeId);
  const acts = isNew ? [] : activitiesFor(d.id);

  return `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal modal-xl" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h2>${isNew ? "Новая сделка" : escape(d.title || "Без названия")}</h2>
          <div class="modal-actions">
            ${!isNew && contact?.phone ? `<button type="button" class="btn-ghost icon-only" id="dealCall" title="Позвонить ${escape(contact.name || "")}">📞</button>` : ""}
            ${!isNew && contact?.phone ? `<button type="button" class="btn-ghost icon-only" id="dealWA" title="WhatsApp">💬</button>` : ""}
            ${!isNew && contact?.email ? `<button type="button" class="btn-ghost icon-only" id="dealEmail" title="Письмо">✉</button>` : ""}
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
              <div class="field">
                <label>Дедлайн</label>
                <input name="dueDate" type="date" value="${fmtDateInput(d.dueDate)}">
              </div>
              ${renderTypeahead({
                name: "contactId",
                value: d.contactId,
                items: contacts.map(c => ({ id: c.id, name: c.name || "(без имени)", sub: c.company || c.email || c.phone || "" })),
                label: "Контакт",
                placeholder: "Поиск по имени, компании, email…",
                createLabel: "Создать контакт",
                emptyText: "— не выбран —",
              })}
              ${renderTypeahead({
                name: "assigneeId",
                value: d.assigneeId,
                items: employees.map(e => ({ id: e.id, name: e.name, sub: e.email || "" })),
                label: "Ответственный",
                placeholder: "Поиск сотрудника…",
                emptyText: "— не назначен —",
              })}
              ${renderCustomFields(d)}
              <div class="field field-wide">
                <label>Заметки</label>
                <textarea name="notes" rows="4" placeholder="Контекст сделки, договорённости…">${escape(d.notes)}</textarea>
              </div>
              <div class="field field-wide form-buttons">
                ${!isNew ? `<button type="button" class="btn-ghost danger" id="deleteDeal">${ICONS.trash}<span>Удалить</span></button>` : "<span></span>"}
                <button type="submit" class="btn">${isNew ? "Создать" : "Сохранить"}</button>
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
              <div class="timeline-list">
                ${acts.length === 0
                  ? `<div class="tl-empty">Активности по сделке появятся здесь. Добавь первую — заметку, письмо, дело или звонок.</div>`
                  : acts.map(a => renderActivity(a)).join("")}
              </div>

              ${renderDealChatPane(contact)}
            </div>
          ` : ""}
        </div>
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
      ${stages.map(s => `
        <button class="deal-stage-bar-btn ${s.id === activeId ? "active" : ""}" data-stage="${s.id}" style="--stage-color:${s.color}">
          ${escape(s.title)}
        </button>
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
          <span class="tl-author">${escape(author?.name || "Я")}</span>
          <span class="tl-type">${labels[type] || type}</span>
          <span class="tl-time">${fmtTime(a.ts || a.createdAt)}</span>
        </div>
        ${body}
      </div>
    </div>
  `;
}

function renderDealChatPane(contact) {
  if (!contact?.phone) {
    return `
      <div class="deal-chat-pane">
        <div class="deal-chat-head">Диалог</div>
        <div class="tl-empty">У контакта нет телефона для WhatsApp.</div>
      </div>
    `;
  }

  const { chat, channel } = resolveOrCreateDirectWaChat({ name: contact.name, phone: contact.phone });
  if (!chat) {
    return `
      <div class="deal-chat-pane">
        <div class="deal-chat-head">Диалог</div>
        <div class="tl-empty">Не удалось открыть чат.</div>
      </div>
    `;
  }

  const messages = messagesForChat(chat.id);
  const phoneDigits = String(contact.phone || "").replace(/[^\d]/g, "");
  const waHref = phoneDigits ? `https://wa.me/${phoneDigits}` : "";
  const telHref = phoneDigits ? `tel:+${phoneDigits}` : "";
  return `
    <div class="deal-chat-pane" data-chat-id="${escape(chat.id)}" data-channel-id="${escape(channel?.id || "")}">
      <div class="deal-chat-head">
        <div class="wa-dialog-user">
          <div class="avatar avatar-md">${escape(initialsOf(contact.name || contact.phone || "?"))}</div>
          <div>
            <div class="deal-chat-title">${escape(contact.name || contact.phone)}</div>
            <div class="deal-chat-sub">${escape(channel?.name ? `Канал: ${channel.name}` : "WhatsApp канал не настроен")}</div>
          </div>
        </div>
        <div class="wa-dialog-actions">
          ${telHref ? `<a class="wa-action-link" href="${escapeAttr(telHref)}">Позвонить</a>` : ""}
          ${waHref ? `<a class="wa-action-link" href="${escapeAttr(waHref)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ""}
        </div>
      </div>
      <div class="chat-messages deal-chat-messages" id="dealChatMessages">
        ${renderDialogMessages(messages, { timeFormatter: fmtChatTime })}
      </div>
      <form class="chat-compose" id="dealChatForm">
        <input name="text" type="text" placeholder="Сообщение клиенту...">
        <button type="submit" class="btn-primary" title="Отправить">${ICONS.send}</button>
      </form>
      <form class="chat-compose chat-compose-media" id="dealChatMedia">
        <input name="fileUrl" type="url" placeholder="Ссылка на файл (опц.)">
        <input name="fileName" type="text" placeholder="Имя файла (опц.)">
        <label class="chat-voice-opt"><input name="asVoice" type="checkbox"> voice</label>
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
    if (container?.isConnected && !(state.modalOpen && state.modalDealId)) renderDeals(container);
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
    if (state.modalOpen && state.modalDealId) syncDealChatCloud(container);
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
function openDealModal(container, dealId = null) {
  state.modalOpen = true;
  state.modalDealId = dealId;
  if (dealId) location.hash = `#crm/${dealId}`;
  renderDeals(container);
}
function closeDealModal(container) {
  state.modalOpen = false;
  state.modalDealId = null;
  if (location.hash.startsWith("#crm/")) location.hash = "#crm";
  renderDeals(container);
}

// Открытие сделки из URL — вызывается извне (из app.js router)
export function tryOpenDealFromHash() {
  const m = (location.hash || "").match(/^#crm\/(.+)$/);
  if (m) {
    state.modalOpen = true;
    state.modalDealId = m[1];
  }
}

// =========================================================================
// Events
// =========================================================================
function wireEvents(container) {
  const contacts = Store.list(CONTACTS);
  container.querySelector("#newDeal")?.addEventListener("click", () => openDealModal(container, null));
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
          let contactName = query;
          if (!contactName) contactName = (prompt("Имя нового контакта:") || "").trim();
          if (!contactName) return null;
          const phone = (prompt("Телефон (необязательно):") || "").trim();
          const created = Store.create(CONTACTS, {
            name: contactName,
            phone,
            email: "",
            company: "",
            position: "",
            source: "site",
            tags: [],
            notes: "",
          });
          // обновим items
          window.__taItems.contactId = Store.list(CONTACTS).map(c => ({ id: c.id, name: c.name || "(без имени)", sub: c.company || c.email || c.phone || "" }));
          return { id: created.id, name: contactName, sub: phone || "" };
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
    // Кнопки коммуникации в шапке карточки сделки
    container.querySelector("#dealCall")?.addEventListener("click", () => {
      const deal = Store.get(COLLECTION, state.modalDealId);
      const c = contacts.find(x => x.id === deal?.contactId);
      if (!c?.phone) return;
      openCommunicate({ type: "call", to: c.phone, contactName: c.name,
        context: { collection: ACTIVITIES, fk: { dealId: state.modalDealId } },
        onDone: () => renderDeals(container) });
    });
    container.querySelector("#dealWA")?.addEventListener("click", () => {
      const deal = Store.get(COLLECTION, state.modalDealId);
      const c = contacts.find(x => x.id === deal?.contactId);
      if (!c?.phone) return;
      openCommunicate({ type: "whatsapp", to: c.phone, contactName: c.name,
        context: { collection: ACTIVITIES, fk: { dealId: state.modalDealId } },
        onDone: () => renderDeals(container) });
    });
    container.querySelector("#dealEmail")?.addEventListener("click", () => {
      const deal = Store.get(COLLECTION, state.modalDealId);
      const c = contacts.find(x => x.id === deal?.contactId);
      if (!c?.email) return;
      openCommunicate({ type: "email", to: c.email, contactName: c.name,
        context: { collection: ACTIVITIES, fk: { dealId: state.modalDealId } },
        onDone: () => renderDeals(container) });
    });

    container.querySelector("#copyLink")?.addEventListener("click", () => {
      const url = `${location.origin}${location.pathname}#crm/${state.modalDealId}`;
      navigator.clipboard?.writeText(url).then(
        () => { alert("Ссылка скопирована:\n" + url); },
        () => { prompt("Скопируй ссылку:", url); }
      );
    });

    dealForm.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(dealForm);
      const dueRaw = fd.get("dueDate");
      // Собираем кастомные поля
      const customFields = {};
      getDealFields().forEach(f => {
        const v = fd.get("cf_" + f.id);
        if (v !== null) customFields[f.id] = String(v).trim();
      });
      const data = {
        title: (fd.get("title") || "").trim(),
        amount: Number(fd.get("amount")) || 0,
        contactId: fd.get("contactId") || null,
        assigneeId: fd.get("assigneeId") || null,
        dueDate: dueRaw ? new Date(dueRaw).getTime() : null,
        notes: (fd.get("notes") || "").trim(),
        customFields,
      };
      if (!data.title) return;
      if (state.modalDealId) {
        Store.update(COLLECTION, state.modalDealId, data);
      } else {
        const created = Store.create(COLLECTION, { ...data, stage: getStages()[0]?.id || "new" });
        state.modalDealId = created.id;
      }
      renderDeals(container);
    });

    // ----- Stage bar (быстрое переключение) -----
    container.querySelectorAll(".deal-stage-bar-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!state.modalDealId) return;
        const newStage = btn.dataset.stage;
        const deal = Store.get(COLLECTION, state.modalDealId);
        if (deal && deal.stage !== newStage) {
          Store.update(COLLECTION, state.modalDealId, { stage: newStage });
          addActivity(state.modalDealId, "stage", { fromStage: deal.stage, toStage: newStage });
          renderDeals(container);
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
        const text = container.querySelector("#tlText")?.value.trim();
        if (currentTl === "task") {
          const title = container.querySelector("#tlTitle")?.value.trim();
          const dueAtRaw = container.querySelector("#tlDueAt")?.value;
          if (!title) return;
          addActivity(state.modalDealId, "task", { title, dueAt: dueAtRaw ? new Date(dueAtRaw).getTime() : null });
        } else if (currentTl === "email") {
          const to = container.querySelector("#tlEmail")?.value.trim();
          const subject = container.querySelector("#tlSubject")?.value.trim();
          if (!text && !to) return;
          addActivity(state.modalDealId, "email", { to, subject, text });
        } else {
          if (!text) return;
          addActivity(state.modalDealId, currentTl, { text });
        }
        renderDeals(container);
      });
    }
    bindTimelineSubmit();

    const dealChatForm = container.querySelector("#dealChatForm");
    dealChatForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!state.modalDealId) return;

      const deal = Store.get(COLLECTION, state.modalDealId);
      const c = contacts.find(x => x.id === deal?.contactId);
      if (!c) return;

      const pane = container.querySelector(".deal-chat-pane");
      const chatId = pane?.dataset.chatId || "";
      const channelId = pane?.dataset.channelId || "";
      const chat = chatId ? Store.get("chats", chatId) : null;
      const channel = listChannels({ type: "greenapi_wa" }).find(x => x.id === channelId) || null;

      if (!chat || !channel) {
        alert("Нет активного WhatsApp канала или чат не найден.");
        return;
      }

      const text = String(dealChatForm.querySelector("input[name='text']")?.value || "").trim();
      const mediaForm = container.querySelector("#dealChatMedia");
      const fileUrl = String(mediaForm?.querySelector("input[name='fileUrl']")?.value || "").trim();
      const fileName = String(mediaForm?.querySelector("input[name='fileName']")?.value || "").trim();
      const asVoice = !!mediaForm?.querySelector("input[name='asVoice']")?.checked;

      const btn = dealChatForm.querySelector("button[type='submit']");
      btn?.setAttribute("disabled", "disabled");
      try {
        await sendWaFromDialog({
          chat,
          channel,
          text,
          urlFile: fileUrl,
          fileName,
          asVoice,
        });
      } catch (err) {
        alert(err?.message || String(err));
        return;
      } finally {
        btn?.removeAttribute("disabled");
      }

      addActivity(state.modalDealId, "whatsapp", {
        text: text || (fileUrl ? `[Файл] ${fileName || fileUrl}` : ""),
      });

      dealChatForm.reset();
      mediaForm?.reset();
      renderDeals(container);
      setTimeout(() => { syncDealChatCloud(container); }, 700);
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
