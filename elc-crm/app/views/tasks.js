// Pllato CRM — Задачи v2.
// По образцу team.html: модалка с подзадачами, чат-комментариями, файлами,
// участниками. Подзадачи хранятся в той же коллекции с полем parentId.

import { Store } from "../store.js";
import { ICONS } from "../icons.js";
import { listEmployees, getEmployee, currentEmployee, avatar, initialsOf } from "../employees.js";

const COLLECTION = "tasks";
const COMMENTS = "task_comments";
const CONTACTS = "contacts";
const DEALS = "deals";

const PRIORITIES = [
  { id: "low",  label: "Низкий",  color: "var(--text-dim)" },
  { id: "med",  label: "Средний", color: "#3b82f6" },
  { id: "high", label: "Высокий", color: "var(--danger)" },
];

function loadTasksState() {
  try { return JSON.parse(sessionStorage.getItem("pllato_state_tasks") || "null") || {}; } catch { return {}; }
}
function saveTasksState() {
  sessionStorage.setItem("pllato_state_tasks", JSON.stringify({ filter: state.filter, modalTaskId: state.modalOpen ? state.modalTaskId : null }));
}
const _ts = loadTasksState();
const state = {
  filter: (_ts.filter === "open" ? "active" : _ts.filter) || "active",
  modalOpen: Boolean(_ts.modalTaskId),
  modalTaskId: _ts.modalTaskId || null,
  parentForCreate: null,
};

function isContactAlive(contact) {
  return !contact?.deletedAt;
}

function isDealAlive(deal) {
  return !deal?.deletedAt;
}

function listAliveContacts() {
  return Store.list(CONTACTS).filter(isContactAlive);
}

function listAliveDeals() {
  return Store.list(DEALS).filter(isDealAlive);
}

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
function fmtDate(ts) {
  if (!ts) return "";
  const today = startOfDay(Date.now());
  const due = startOfDay(ts);
  const diff = (due - today) / 86400000;
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Завтра";
  if (diff === -1) return "Вчера";
  return new Date(ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}
function fmtDateInput(ts) { return ts ? new Date(ts).toISOString().slice(0, 10) : ""; }
function fmtTime(ts) { return new Date(ts).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function seedDemo() {
  if (Store.list(COLLECTION).length > 0) return;
  const employees = listEmployees();
  const contacts = listAliveContacts();
  const deals = listAliveDeals();
  const me = currentEmployee();
  const now = Date.now();

  const samples = [
    {
      title: "Подготовить демо для Tech Solutions",
      description: "Сделать презентацию, отрепетировать с командой, забронировать переговорку.",
      priority: "high",
      dueDate: now + 2 * 86400000,
      status: "open",
      assigneeId: me?.id,
      participantIds: employees.slice(0, 3).map(e => e.id),
      linkedTo: deals[0] ? { type: "deal", id: deals[0].id } : null,
      files: [],
    },
  ];
  const created = samples.map(t => Store.create(COLLECTION, t));

  // Подзадачи
  if (created[0]) {
    Store.create(COLLECTION, {
      title: "Слайды по архитектуре",
      parentId: created[0].id,
      priority: "med",
      dueDate: now + 86400000,
      status: "open",
      assigneeId: employees[1]?.id,
      participantIds: [],
      files: [],
    });
    Store.create(COLLECTION, {
      title: "Слайды по тарифам",
      parentId: created[0].id,
      priority: "med",
      dueDate: now + 86400000,
      status: "done",
      assigneeId: employees[2]?.id,
      participantIds: [],
      files: [],
    });
  }

  Store.create(COLLECTION, {
    title: "Перезвонить Алексею Иванову",
    description: "Обсудить количество мест и сроки внедрения.",
    priority: "med",
    dueDate: now,
    status: "open",
    assigneeId: me?.id,
    participantIds: [],
    linkedTo: contacts[0] ? { type: "contact", id: contacts[0].id } : null,
    files: [],
  });

  // Демо-комментарии к первой задаче
  if (created[0]) {
    Store.create(COMMENTS, {
      taskId: created[0].id,
      authorId: employees[1]?.id,
      text: "Слайды по архитектуре в работе, к завтрашнему утру будут готовы.",
      files: [],
      ts: now - 2 * 3600000,
    });
    Store.create(COMMENTS, {
      taskId: created[0].id,
      authorId: me?.id,
      text: "Супер. Я подготовлю чек-лист тарифов и пришлю.",
      files: [],
      ts: now - 60 * 60000,
    });
  }
}

function rootTasks() {
  return Store.list(COLLECTION).filter(t => !t.parentId);
}
function subtasksOf(parentId) {
  return Store.list(COLLECTION).filter(t => t.parentId === parentId);
}
function commentsOf(taskId) {
  return Store.list(COMMENTS).filter(c => c.taskId === taskId).reverse();
}

function groupTasks(tasks) {
  const today = startOfDay(Date.now());
  const tomorrow = today + 86400000;
  const weekEnd = today + 7 * 86400000;
  const groups = {
    overdue: { title: "Просрочены", color: "var(--danger)", items: [] },
    today:   { title: "Сегодня",    color: "var(--accent)", items: [] },
    tomorrow:{ title: "Завтра",     color: "#3b82f6",       items: [] },
    week:    { title: "На неделе",  color: "var(--text-muted)", items: [] },
    later:   { title: "Позже",      color: "var(--text-muted)", items: [] },
    nodate:  { title: "Без даты",   color: "var(--text-dim)",   items: [] },
    done:    { title: "Завершённые",color: "var(--success)",    items: [] },
  };
  tasks.forEach(t => {
    if (t.status === "done") { groups.done.items.push(t); return; }
    if (!t.dueDate) { groups.nodate.items.push(t); return; }
    const due = startOfDay(t.dueDate);
    if (due < today) groups.overdue.items.push(t);
    else if (due === today) groups.today.items.push(t);
    else if (due === tomorrow) groups.tomorrow.items.push(t);
    else if (due <= weekEnd) groups.week.items.push(t);
    else groups.later.items.push(t);
  });
  return groups;
}

export function renderTasks(container) {
  seedDemo();
  const allRootTasks = rootTasks();
  const activeCount = allRootTasks.filter((t) => t.status !== "done").length;
  const doneCount = allRootTasks.filter((t) => t.status === "done").length;
  const allCount = allRootTasks.length;

  let tasks = allRootTasks;
  if (state.filter === "active") tasks = tasks.filter((t) => t.status !== "done");
  if (state.filter === "done") tasks = tasks.filter((t) => t.status === "done");

  const groups = groupTasks(tasks);
  const order = state.filter === "done" ? ["done"]
    : state.filter === "active" ? ["overdue", "today", "tomorrow", "week", "later", "nodate"]
    : ["overdue", "today", "tomorrow", "week", "later", "nodate", "done"];

  container.innerHTML = `
    <div class="tasks-view">
      <div class="tasks-toolbar">
        <div class="tasks-filter">
          ${[
            { id: "active", label: "Активные", count: activeCount },
            { id: "all", label: "Все", count: allCount },
            { id: "done", label: "Завершённые", count: doneCount },
          ].map(f =>
            `<button class="tasks-filter-tab ${state.filter === f.id ? "on" : ""}" data-filter="${f.id}">${f.label} <span class="filter-count">${f.count}</span></button>`
          ).join("")}
        </div>
        <button class="btn-primary" id="newTask">${ICONS.plus}<span>+ Задача</span></button>
      </div>

      <div class="tasks-card">
        ${order.map(g => {
          const grp = groups[g];
          if (grp.items.length === 0) return "";
          const headClass = g === "overdue" ? "overdue" : g === "today" ? "today" : "";
          return `
            <section class="task-group">
              <header class="task-group-head ${headClass}">
                <span class="dot" style="background:${grp.color}"></span>
                <span class="group-title">${grp.title}</span>
                <span class="group-count">${grp.items.length}</span>
              </header>
              <div class="task-list">
                ${grp.items.map(t => renderTaskRow(t)).join("")}
              </div>
            </section>
          `;
        }).join("") || `<div class="placeholder"><div class="placeholder-icon">${ICONS.tasks}</div><h3>Задач нет</h3><p>Нажми «+ Задача» сверху.</p></div>`}
      </div>

      ${state.modalOpen ? renderTaskModal() : ""}
    </div>
  `;

  wireEvents(container);
}

function renderTaskRow(t) {
  const prio = t.priority || "low";
  const assignee = getEmployee(t.assigneeId);
  const subs = subtasksOf(t.id);
  const subsDone = subs.filter(s => s.status === "done").length;
  const comms = commentsOf(t.id);
  const linkType = t.linkedTo?.type;
  const linked = linkType === "deal"
    ? Store.get(DEALS, t.linkedTo.id)?.title
    : linkType === "contact"
      ? Store.get(CONTACTS, t.linkedTo.id)?.name
      : "";

  const today = startOfDay(Date.now());
  const isOverdue = t.dueDate && startOfDay(t.dueDate) < today && t.status !== "done";

  return `
    <article class="task-row ${t.status === "done" ? "done" : ""}" data-id="${t.id}">
      <button class="task-check" data-toggle="${t.id}" aria-label="Отметить">
        ${t.status === "done" ? ICONS.check : ""}
      </button>
      <span class="prio-dot prio-${prio}"></span>
      <div class="task-body" data-open="${t.id}">
        <div class="task-title">${escape(t.title || "(без названия)")}</div>
        ${t.description ? `<div class="task-desc">${escape(t.description)}</div>` : ""}
        <div class="task-meta">
          ${t.dueDate ? `<span class="meta-item ${isOverdue ? "overdue" : ""}">${ICONS.calendar} ${fmtDate(t.dueDate)}</span>` : ""}
          ${linked ? `<span class="meta-item">${ICONS.link} ${escape(linked)}</span>` : ""}
          ${subs.length > 0 ? `<span class="meta-item">${ICONS.tasks} ${subsDone}/${subs.length}</span>` : ""}
          ${comms.length > 0 ? `<span class="meta-item">${ICONS.chat} ${comms.length}</span>` : ""}
          ${t.files?.length > 0 ? `<span class="meta-item">${ICONS.paperclip} ${t.files.length}</span>` : ""}
        </div>
      </div>
      ${assignee ? `<div class="task-assignee" title="${escape(assignee.name)}">${avatar(assignee, "xs")}</div>` : ""}
    </article>
  `;
}

// =========================================================================
// Модалка задачи
// =========================================================================
function renderTaskModal() {
  const isNew = !state.modalTaskId;
  const t = isNew
    ? { title: "", description: "", priority: "med", status: "open", dueDate: null, assigneeId: currentEmployee()?.id, participantIds: [], files: [], parentId: state.parentForCreate || null }
    : Store.get(COLLECTION, state.modalTaskId);
  if (!t) return "";

  const employees = listEmployees();
  const contacts = listAliveContacts();
  const deals = listAliveDeals();
  const parentTask = t.parentId ? Store.get(COLLECTION, t.parentId) : null;
  const subs = isNew ? [] : subtasksOf(t.id);
  const comms = isNew ? [] : commentsOf(t.id);
  const linkType = t.linkedTo?.type || "";
  const linkId = t.linkedTo?.id || "";
  const participantIds = t.participantIds || [];

  return `
    <div class="modal-backdrop" id="taskBackdrop">
      <div class="modal modal-xl" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h2>
            ${parentTask ? `<span class="parent-crumb" data-open-parent="${parentTask.id}">${escape(parentTask.title)} ›</span> ` : ""}
            ${isNew ? "Новая задача" : escape(t.title || "Задача")}
          </h2>
          <div class="modal-actions">
            <button type="button" class="btn-ghost icon-only" id="closeTaskModal">${ICONS.x}</button>
          </div>
        </header>

        <div class="task-modal-body">
          <div class="task-form-col">
            <form id="taskForm">
              <div class="form-grid form-grid-1col">
                <div class="field field-wide">
                  <label>Название *</label>
                  <input name="title" required value="${escape(t.title)}" placeholder="Что нужно сделать">
                </div>
                <div class="field field-wide">
                  <label>Описание</label>
                  <textarea name="description" rows="3" placeholder="Детали, контекст...">${escape(t.description || "")}</textarea>
                </div>
                <div class="field">
                  <label>Приоритет</label>
                  <select name="priority">
                    ${PRIORITIES.map(p => `<option value="${p.id}" ${t.priority === p.id ? "selected" : ""}>${p.label}</option>`).join("")}
                  </select>
                </div>
                <div class="field">
                  <label>Дедлайн</label>
                  <input name="dueDate" type="date" value="${fmtDateInput(t.dueDate)}">
                </div>
                <div class="field">
                  <label>Ответственный</label>
                  <select name="assigneeId">
                    <option value="">— не назначен —</option>
                    ${employees.map(e => `<option value="${e.id}" ${t.assigneeId === e.id ? "selected" : ""}>${escape(e.name)}</option>`).join("")}
                  </select>
                </div>
                <div class="field">
                  <label>Привязать к</label>
                  <select name="linkType">
                    <option value="" ${!linkType ? "selected" : ""}>— ничего —</option>
                    <option value="contact" ${linkType === "contact" ? "selected" : ""}>Контакт</option>
                    <option value="deal" ${linkType === "deal" ? "selected" : ""}>Сделка</option>
                  </select>
                </div>
                <div class="field field-wide" id="linkObjectWrap" ${linkType ? "" : 'style="display:none"'}>
                  <label>Объект</label>
                  <select name="linkId" id="linkIdSelect">
                    <option value="">—</option>
                    ${(linkType === "contact" ? contacts.map(c => `<option value="${c.id}" ${linkId === c.id ? "selected" : ""}>${escape(c.name)}</option>`)
                      : linkType === "deal" ? deals.map(d => `<option value="${d.id}" ${linkId === d.id ? "selected" : ""}>${escape(d.title)}</option>`)
                      : []).join("")}
                  </select>
                </div>

                <div class="field field-wide">
                  <label>Участники</label>
                  <div class="participants-picker" id="participantsPicker">
                    ${employees.map(e => `
                      <label class="participant-chip ${participantIds.includes(e.id) ? "on" : ""}" data-emp="${e.id}">
                        <input type="checkbox" name="participantIds" value="${e.id}" ${participantIds.includes(e.id) ? "checked" : ""}>
                        ${avatar(e, "xs")}
                        <span>${escape(e.name)}</span>
                      </label>
                    `).join("")}
                  </div>
                </div>

                <div class="field field-wide">
                  <label>Файлы</label>
                  <div class="files-block">
                    ${(t.files || []).map((f, i) => `
                      <div class="file-item" data-file-i="${i}">
                        <span>📎</span>
                        <span class="file-name">${escape(f.name)}</span>
                        <span class="file-size">${fmtSize(f.size)}</span>
                        ${!isNew ? `<button type="button" class="btn-ghost icon-only danger" data-rm-file="${i}">${ICONS.x}</button>` : ""}
                      </div>
                    `).join("")}
                    <label class="file-add-btn">
                      ${ICONS.paperclip}<span>Прикрепить файлы</span>
                      <input type="file" multiple style="display:none" id="taskFileInput">
                    </label>
                  </div>
                </div>

                ${!isNew ? `<div class="field field-wide">
                  <label class="checkbox-label">
                    <input type="checkbox" name="status" ${t.status === "done" ? "checked" : ""}>
                    <span>Задача выполнена</span>
                  </label>
                </div>` : ""}

                <div class="field field-wide form-buttons">
                  ${!isNew ? `<button type="button" class="btn-ghost danger" id="deleteTask">${ICONS.trash}<span>Удалить</span></button>` : "<span></span>"}
                  <button type="submit" class="btn">${isNew ? "Создать" : "Сохранить"}</button>
                </div>
              </div>
            </form>

            ${!isNew && !t.parentId ? `
              <div class="subtasks-section">
                <div class="subtasks-head">
                  <h3>Подзадачи (${subs.length})</h3>
                  <button class="btn-ghost" id="addSubtask">${ICONS.plus}<span>Подзадача</span></button>
                </div>
                <div class="subtasks-list">
                  ${subs.length === 0
                    ? `<div class="tl-empty">Подзадач пока нет.</div>`
                    : subs.map(s => renderSubtask(s)).join("")}
                </div>
              </div>
            ` : ""}
          </div>

          ${!isNew ? `
            <div class="task-chat-col">
              <div class="task-chat-head">
                <h3>Комментарии (${comms.length})</h3>
                <span>Лента общения по задаче</span>
              </div>
              <div class="task-chat-list">
                ${comms.length === 0
                  ? `<div class="tl-empty">Сообщений пока нет — напиши первое.</div>`
                  : comms.map(c => renderComment(c)).join("")}
              </div>
              <form class="task-chat-compose" id="commentForm">
                <textarea name="text" placeholder="Написать комментарий..." rows="2" required></textarea>
                <div class="task-chat-compose-actions">
                  <label class="btn-ghost icon-only" title="Прикрепить" style="cursor:pointer">
                    ${ICONS.paperclip}
                    <input type="file" multiple style="display:none" id="commentFileInput">
                  </label>
                  <span class="comment-attached" id="commentAttached"></span>
                  <button type="submit" class="btn-primary">${ICONS.plus}</button>
                </div>
              </form>
            </div>
          ` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderSubtask(s) {
  const prio = PRIORITIES.find(p => p.id === (s.priority || "med"));
  const assignee = getEmployee(s.assigneeId);
  const subs2 = subtasksOf(s.id);
  return `
    <div class="subtask-row ${s.status === "done" ? "done" : ""}" data-id="${s.id}">
      <button class="task-check" data-toggle="${s.id}">${s.status === "done" ? ICONS.check : ""}</button>
      <div class="subtask-body" data-open="${s.id}">
        <div class="subtask-title"><span class="prio-dot" style="background:${prio.color}"></span><span>${escape(s.title)}</span></div>
        <div class="subtask-meta">
          ${s.dueDate ? `<span>${ICONS.calendar} ${fmtDate(s.dueDate)}</span>` : ""}
          ${assignee ? `<span>${avatar(assignee, "xs")} ${escape(assignee.name)}</span>` : ""}
          ${subs2.length > 0 ? `<span>📂 ${subs2.filter(x => x.status === "done").length}/${subs2.length}</span>` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderComment(c) {
  const author = getEmployee(c.authorId);
  return `
    <div class="task-comment">
      ${avatar(author, "sm")}
      <div class="task-comment-body">
        <div class="task-comment-head">
          <span class="task-comment-author">${escape(author?.name || "?")}</span>
          <span class="task-comment-time">${fmtTime(c.ts || c.createdAt)}</span>
        </div>
        <div class="task-comment-text">${escape(c.text || "").replace(/\n/g, "<br>")}</div>
        ${c.files?.length > 0 ? `
          <div class="comment-files">
            ${c.files.map(f => `<span class="file-item">📎 ${escape(f.name)} <span class="file-size">${fmtSize(f.size)}</span></span>`).join("")}
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

// =========================================================================
// Helpers / events
// =========================================================================
function openModal(container, taskId, parentForCreate = null) {
  state.modalOpen = true;
  state.modalTaskId = taskId;
  state.parentForCreate = parentForCreate;
  saveTasksState();
  renderTasks(container);
}
function closeModal(container) {
  state.modalOpen = false;
  state.modalTaskId = null;
  state.parentForCreate = null;
  saveTasksState();
  renderTasks(container);
}

let pendingCommentFiles = [];

function wireEvents(container) {
  // фильтры
  container.querySelectorAll(".tasks-filter-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      saveTasksState();
      renderTasks(container);
    });
  });
  container.querySelector("#newTask")?.addEventListener("click", () => openModal(container, null));

  // Чекбокс toggle статус
  container.querySelectorAll("[data-toggle]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const id = btn.dataset.toggle;
      const t = Store.get(COLLECTION, id);
      if (!t) return;
      Store.update(COLLECTION, id, { status: t.status === "done" ? "open" : "done" });
      if (state.modalOpen && state.modalTaskId === id) {
        // если открыли задачу в модалке — перерисовать
      }
      renderTasks(container);
    });
  });

  // Открытие задачи
  container.querySelectorAll("[data-open]").forEach(el => {
    el.addEventListener("click", () => openModal(container, el.dataset.open));
  });
  container.querySelectorAll("[data-open-parent]").forEach(el => {
    el.addEventListener("click", () => openModal(container, el.dataset.openParent));
  });

  // ===== Modal events =====
  if (!state.modalOpen) return;

  container.querySelector("#closeTaskModal")?.addEventListener("click", () => closeModal(container));
  container.querySelector("#taskBackdrop")?.addEventListener("click", e => {
    if (e.target.id === "taskBackdrop") closeModal(container);
  });

  // Удаление задачи (вместе с подзадачами и комментариями)
  container.querySelector("#deleteTask")?.addEventListener("click", () => {
    if (!state.modalTaskId) return;
    const t = Store.get(COLLECTION, state.modalTaskId);
    if (confirm(`Удалить задачу «${t.title}»? Подзадачи и комментарии тоже удалятся.`)) {
      // подзадачи
      subtasksOf(state.modalTaskId).forEach(s => Store.remove(COLLECTION, s.id));
      // комментарии
      commentsOf(state.modalTaskId).forEach(c => Store.remove(COMMENTS, c.id));
      Store.remove(COLLECTION, state.modalTaskId);
      closeModal(container);
    }
  });

  // Динамика «Привязать к → Объект»
  const linkTypeSelect = container.querySelector('[name="linkType"]');
  linkTypeSelect?.addEventListener("change", () => {
    const wrap = container.querySelector("#linkObjectWrap");
    const sel = container.querySelector("#linkIdSelect");
    const type = linkTypeSelect.value;
    if (!type) { wrap.style.display = "none"; sel.innerHTML = '<option value="">—</option>'; return; }
    wrap.style.display = "";
    const items = type === "contact" ? listAliveContacts() : listAliveDeals();
    sel.innerHTML = `<option value="">—</option>` + items.map(x => `<option value="${x.id}">${escape(x.name || x.title)}</option>`).join("");
  });

  // Чипы участников
  container.querySelectorAll(".participant-chip").forEach(chip => {
    chip.addEventListener("click", e => {
      // Не блокируем event для input — он сам обработает checked
      setTimeout(() => {
        const cb = chip.querySelector('input[type="checkbox"]');
        chip.classList.toggle("on", cb.checked);
      }, 0);
    });
  });

  // Файлы задачи
  const fileInput = container.querySelector("#taskFileInput");
  fileInput?.addEventListener("change", e => {
    if (!state.modalTaskId) {
      alert("Сохрани задачу прежде чем добавлять файлы.");
      return;
    }
    const files = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, type: f.type }));
    const t = Store.get(COLLECTION, state.modalTaskId);
    Store.update(COLLECTION, state.modalTaskId, { files: [...(t.files || []), ...files] });
    renderTasks(container);
  });
  container.querySelectorAll("[data-rm-file]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!state.modalTaskId) return;
      const i = Number(btn.dataset.rmFile);
      const t = Store.get(COLLECTION, state.modalTaskId);
      const files = [...(t.files || [])];
      files.splice(i, 1);
      Store.update(COLLECTION, state.modalTaskId, { files });
      renderTasks(container);
    });
  });

  // Сабмит формы задачи
  const taskForm = container.querySelector("#taskForm");
  taskForm?.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(taskForm);
    const dueRaw = fd.get("dueDate");
    const linkType = fd.get("linkType");
    const linkId = fd.get("linkId");
    const data = {
      title: (fd.get("title") || "").trim(),
      description: (fd.get("description") || "").trim(),
      priority: fd.get("priority") || "med",
      dueDate: dueRaw ? new Date(dueRaw).getTime() : null,
      status: fd.get("status") ? "done" : "open",
      assigneeId: fd.get("assigneeId") || null,
      participantIds: fd.getAll("participantIds"),
      linkedTo: linkType && linkId ? { type: linkType, id: linkId } : null,
    };
    if (!data.title) return;

    if (state.modalTaskId) {
      Store.update(COLLECTION, state.modalTaskId, data);
    } else {
      const created = Store.create(COLLECTION, { ...data, files: [], parentId: state.parentForCreate || null });
      state.modalTaskId = created.id;
      state.parentForCreate = null;
    }
    renderTasks(container);
  });

  // Подзадача — кнопка
  container.querySelector("#addSubtask")?.addEventListener("click", () => {
    if (!state.modalTaskId) return;
    openModal(container, null, state.modalTaskId);
  });

  // Комментарии: prepare files + submit
  const commentFileInput = container.querySelector("#commentFileInput");
  const commentAttached = container.querySelector("#commentAttached");
  commentFileInput?.addEventListener("change", e => {
    pendingCommentFiles = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, type: f.type }));
    if (commentAttached) {
      commentAttached.textContent = pendingCommentFiles.length
        ? `📎 ${pendingCommentFiles.length} файл(ов)` : "";
    }
  });
  container.querySelector("#commentForm")?.addEventListener("submit", e => {
    e.preventDefault();
    if (!state.modalTaskId) return;
    const ta = container.querySelector("#commentForm textarea");
    const text = ta?.value.trim();
    if (!text && pendingCommentFiles.length === 0) return;
    Store.create(COMMENTS, {
      taskId: state.modalTaskId,
      authorId: currentEmployee()?.id,
      text: text || "",
      files: pendingCommentFiles,
      ts: Date.now(),
    });
    pendingCommentFiles = [];
    renderTasks(container);
  });
}
