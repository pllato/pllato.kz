// Pllato CORE CRM — Лента v2.
// Видимость постов: всем команде или выбранным сотрудникам.
// Прикрепление файлов к постам и комментариям.

import { Store } from "../store.js";
import { ICONS } from "../icons.js";
import { listEmployees, getEmployee, currentEmployee, avatar, initialsOf } from "../employees.js";

const COLLECTION = "feed";

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmtRel(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  if (h < 24) return `${h} ч назад`;
  if (d < 7) return `${d} дн назад`;
  return new Date(ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}
function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function seedDemo() {
  if (Store.list(COLLECTION).length > 0) return;
  const employees = listEmployees();
  const aydana = employees.find(e => e.name === "Айдана Бекова");
  const timur = employees.find(e => e.name === "Тимур Алиев");
  const now = Date.now();
  const posts = [
    {
      authorId: aydana?.id,
      text: "🚀 Запустили обновление CORE CRM — модуль воронки. Теперь можно тащить сделки между стадиями мышкой и редактировать стадии.",
      visibility: "all",
      visibilityIds: [],
      files: [],
      likes: [],
      _ts: now - 2 * 3600000,
    },
    {
      authorId: timur?.id,
      text: "Напоминаю — в пятницу демо-звонок с клиентом Tech Solutions. Алексей Иванов будет рассказывать про их кейс. Подключайтесь.",
      visibility: "all",
      visibilityIds: [],
      files: [],
      likes: [],
      _ts: now - 6 * 3600000,
    },
  ];
  posts.forEach(p => {
    const { _ts, ...data } = p;
    const created = Store.create(COLLECTION, { ...data, comments: [] });
    const items = JSON.parse(localStorage.getItem("pllato_core_" + COLLECTION) || "[]");
    const i = items.findIndex(x => x.id === created.id);
    if (i >= 0) {
      items[i].createdAt = _ts;
      items[i].updatedAt = _ts;
      localStorage.setItem("pllato_core_" + COLLECTION, JSON.stringify(items));
    }
  });
}

const state = {
  composeText: "",
  composeFiles: [],
  composeVisibility: "all",   // "all" / "selected"
  composeVisIds: [],
  visibilityPickerOpen: false,
  openComments: {},
  commentFiles: {},
};

function canSee(post, meId) {
  if (post.visibility !== "selected") return true;
  if (post.authorId === meId) return true;
  return (post.visibilityIds || []).includes(meId);
}

export function renderFeed(container) {
  seedDemo();
  const me = currentEmployee();
  const employees = listEmployees();
  const allPosts = Store.list(COLLECTION);
  const posts = allPosts.filter(p => canSee(p, me?.id));

  container.innerHTML = `
    <div class="feed-view">
      <div class="composer">
        ${avatar(me, "md")}
        <form id="composeForm" class="composer-form">
          <textarea name="text" placeholder="Поделись новостью или вопросом..." rows="2">${escape(state.composeText)}</textarea>
          ${state.composeFiles.length ? `
            <div class="composer-files">
              ${state.composeFiles.map((f, i) => `<span class="file-item">📎 ${escape(f.name)} <span class="file-size">${fmtSize(f.size)}</span>
                <button type="button" class="btn-ghost icon-only danger" data-rm-comp-file="${i}">${ICONS.x}</button>
              </span>`).join("")}
            </div>
          ` : ""}
          <div class="composer-actions">
            <label class="btn-ghost" style="cursor:pointer">
              ${ICONS.paperclip}<span>Файл</span>
              <input type="file" multiple style="display:none" id="composeFileInput">
            </label>
            <button type="button" class="btn-ghost" id="visibilityBtn">
              ${ICONS.eye}<span>${state.composeVisibility === "all" ? "Видят все" : `Выбраны: ${state.composeVisIds.length}`}</span>
            </button>
            <button type="submit" class="btn-primary">${ICONS.plus}<span>Опубликовать</span></button>
          </div>
          ${state.visibilityPickerOpen ? renderVisibilityPicker(employees, state.composeVisIds, state.composeVisibility) : ""}
        </form>
      </div>

      <div class="feed-list">
        ${posts.length === 0
          ? `<div class="placeholder"><div class="placeholder-icon">${ICONS.feed}</div><h3>В ленте пока пусто</h3><p>Напиши первый пост сверху.</p></div>`
          : posts.map(p => renderPost(p, me, employees)).join("")}
      </div>
    </div>
  `;

  wireEvents(container);
}

function renderVisibilityPicker(employees, selectedIds, mode) {
  return `
    <div class="visibility-picker">
      <label class="vis-radio">
        <input type="radio" name="vis" value="all" ${mode === "all" ? "checked" : ""}>
        <span><strong>Видят все</strong> — пост увидит вся команда</span>
      </label>
      <label class="vis-radio">
        <input type="radio" name="vis" value="selected" ${mode === "selected" ? "checked" : ""}>
        <span><strong>Только выбранные</strong> — пост увидят только отмеченные сотрудники</span>
      </label>
      <div class="vis-employees ${mode === "selected" ? "" : "disabled"}">
        ${employees.filter(e => !e.isCurrent).map(e => `
          <label class="participant-chip ${selectedIds.includes(e.id) ? "on" : ""}" data-vis-emp="${e.id}">
            <input type="checkbox" value="${e.id}" ${selectedIds.includes(e.id) ? "checked" : ""} ${mode === "selected" ? "" : "disabled"}>
            ${avatar(e, "xs")}
            <span>${escape(e.name)}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `;
}

function renderPost(p, me, employees) {
  const author = getEmployee(p.authorId);
  const liked = me && (p.likes || []).includes(me.id);
  const likesCount = (p.likes || []).length;
  const commentsCount = (p.comments || []).length;
  const isOpen = state.openComments[p.id];
  const isPrivate = p.visibility === "selected";

  return `
    <article class="post" data-id="${p.id}">
      <header class="post-head">
        ${avatar(author, "md")}
        <div class="post-author">
          <div class="post-author-name">${escape(author?.name || "Аноним")}</div>
          <div class="post-time">${fmtRel(p.createdAt)} ${isPrivate ? `<span class="post-private" title="Видят только выбранные">🔒</span>` : ""}</div>
        </div>
      </header>
      <div class="post-body">${escape(p.text || "").replace(/\n/g, "<br>")}</div>
      ${p.files?.length ? `
        <div class="post-files">
          ${p.files.map(f => `<span class="file-item">📎 ${escape(f.name)} <span class="file-size">${fmtSize(f.size)}</span></span>`).join("")}
        </div>
      ` : ""}
      <footer class="post-footer">
        <button class="post-action ${liked ? "active" : ""}" data-action="like" data-id="${p.id}">
          ❤ ${likesCount > 0 ? likesCount : ""}
        </button>
        <button class="post-action" data-action="toggle-comments" data-id="${p.id}">
          💬 ${commentsCount > 0 ? commentsCount : ""}
        </button>
      </footer>
      ${isOpen || commentsCount > 0 ? `
        <div class="comments">
          ${(p.comments || []).map(c => {
            const cAuthor = getEmployee(c.authorId);
            return `
              <div class="comment">
                ${avatar(cAuthor, "xs")}
                <div class="comment-body">
                  <div class="comment-author">${escape(cAuthor?.name || "?")}<span class="comment-time"> · ${fmtRel(c.ts)}</span></div>
                  <div>${escape(c.text || "").replace(/\n/g, "<br>")}</div>
                  ${c.files?.length ? `<div class="comment-files">${c.files.map(f => `<span class="file-item">📎 ${escape(f.name)} <span class="file-size">${fmtSize(f.size)}</span></span>`).join("")}</div>` : ""}
                </div>
              </div>
            `;
          }).join("")}
          <form class="comment-form" data-id="${p.id}">
            ${avatar(me, "xs")}
            <input type="text" name="text" placeholder="Комментировать..." autocomplete="off">
            <label class="btn-ghost icon-only" style="cursor:pointer" title="Файл">
              ${ICONS.paperclip}
              <input type="file" multiple style="display:none" data-comment-file="${p.id}">
            </label>
            ${state.commentFiles[p.id]?.length ? `<span class="file-size">📎 ${state.commentFiles[p.id].length}</span>` : ""}
            <button type="submit" class="btn-primary icon-only">${ICONS.plus}</button>
          </form>
        </div>
      ` : ""}
    </article>
  `;
}

function wireEvents(container) {
  // ----- Composer -----
  const composeForm = container.querySelector("#composeForm");
  const composeArea = composeForm?.querySelector("textarea");
  composeArea?.addEventListener("input", e => { state.composeText = e.target.value; });

  // Файлы
  container.querySelector("#composeFileInput")?.addEventListener("change", e => {
    const files = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, type: f.type }));
    state.composeFiles = [...state.composeFiles, ...files];
    renderFeed(container);
  });
  container.querySelectorAll("[data-rm-comp-file]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.composeFiles.splice(Number(btn.dataset.rmCompFile), 1);
      renderFeed(container);
    });
  });

  // Видимость — toggle picker
  container.querySelector("#visibilityBtn")?.addEventListener("click", () => {
    state.visibilityPickerOpen = !state.visibilityPickerOpen;
    renderFeed(container);
  });
  container.querySelectorAll('input[name="vis"]').forEach(radio => {
    radio.addEventListener("change", () => {
      state.composeVisibility = radio.value;
      renderFeed(container);
    });
  });
  container.querySelectorAll("[data-vis-emp]").forEach(chip => {
    chip.querySelector('input[type="checkbox"]')?.addEventListener("change", e => {
      const id = chip.dataset.visEmp;
      if (e.target.checked) {
        if (!state.composeVisIds.includes(id)) state.composeVisIds.push(id);
      } else {
        state.composeVisIds = state.composeVisIds.filter(x => x !== id);
      }
      chip.classList.toggle("on", e.target.checked);
    });
  });

  // Сабмит поста
  composeForm?.addEventListener("submit", e => {
    e.preventDefault();
    const me = currentEmployee();
    const text = (composeArea?.value || "").trim();
    if (!text && state.composeFiles.length === 0) return;
    Store.create(COLLECTION, {
      authorId: me?.id,
      text,
      files: state.composeFiles,
      visibility: state.composeVisibility,
      visibilityIds: state.composeVisibility === "selected" ? state.composeVisIds.slice() : [],
      likes: [],
      comments: [],
    });
    state.composeText = "";
    state.composeFiles = [];
    state.composeVisibility = "all";
    state.composeVisIds = [];
    state.visibilityPickerOpen = false;
    renderFeed(container);
  });

  // ----- Posts -----
  container.querySelectorAll('[data-action="like"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const me = currentEmployee();
      if (!me) return;
      const id = btn.dataset.id;
      const post = Store.get(COLLECTION, id);
      if (!post) return;
      const likes = post.likes || [];
      const i = likes.indexOf(me.id);
      if (i >= 0) likes.splice(i, 1); else likes.push(me.id);
      Store.update(COLLECTION, id, { likes });
      renderFeed(container);
    });
  });
  container.querySelectorAll('[data-action="toggle-comments"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      state.openComments[id] = !state.openComments[id];
      renderFeed(container);
    });
  });

  // Файлы в комментарии (один input на пост)
  container.querySelectorAll("[data-comment-file]").forEach(inp => {
    inp.addEventListener("change", e => {
      const postId = inp.dataset.commentFile;
      const files = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size, type: f.type }));
      state.commentFiles[postId] = [...(state.commentFiles[postId] || []), ...files];
      renderFeed(container);
    });
  });

  container.querySelectorAll(".comment-form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const id = form.dataset.id;
      const input = form.querySelector('input[name="text"]');
      const text = input.value.trim();
      const files = state.commentFiles[id] || [];
      if (!text && files.length === 0) return;
      const me = currentEmployee();
      const post = Store.get(COLLECTION, id);
      if (!post) return;
      const comments = post.comments || [];
      comments.push({
        authorId: me?.id,
        text,
        files,
        ts: Date.now(),
      });
      Store.update(COLLECTION, id, { comments });
      state.commentFiles[id] = [];
      state.openComments[id] = true;
      renderFeed(container);
    });
  });
}
