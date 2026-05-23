import { Store } from "../store.js";
import { ICONS } from "../icons.js";
import { listEmployees, getEmployee, currentEmployee, avatar } from "../employees.js";

const COLLECTION = "feed";

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function seedDemo() {
  if (Store.list(COLLECTION).length > 0) return;
  const employees = listEmployees();
  const aydana = employees.find((e) => e.name === "Айдана Бекова");
  const timur = employees.find((e) => e.name === "Тимур Алиев");
  const now = Date.now();

  const samples = [
    {
      authorId: aydana?.id,
      text: "Запустили обновление CRM. Проверьте карточку сделки и нижнюю панель действий.",
      visibility: "all",
      visibilityIds: [],
      files: [],
      likes: [],
      comments: [],
      createdAt: now - 2 * 3600000,
      updatedAt: now - 2 * 3600000,
    },
    {
      authorId: timur?.id,
      text: "На пятницу запланирован демо-звонок с Tech Solutions. Подтвердите участие в комментариях.",
      visibility: "all",
      visibilityIds: [],
      files: [],
      likes: [],
      comments: [],
      createdAt: now - 6 * 3600000,
      updatedAt: now - 6 * 3600000,
    },
  ];

  samples.forEach((post) => {
    const created = Store.create(COLLECTION, post);
    if (post.createdAt) {
      const rows = Store.list(COLLECTION);
      const row = rows.find((x) => x.id === created.id);
      if (row) {
        row.createdAt = post.createdAt;
        row.updatedAt = post.updatedAt || post.createdAt;
        localStorage.setItem("pllato_core_feed", JSON.stringify(rows));
      }
    }
  });
}

function canSee(post, meId) {
  if (post.visibility !== "selected") return true;
  if (!meId) return false;
  if (post.authorId === meId) return true;
  return (post.visibilityIds || []).includes(meId);
}

const state = {
  composeText: "",
  composeFiles: [],
  composeVisibility: "all",
  composeVisIds: [],
  visibilityPickerOpen: false,
  commentFiles: {},
  showAllComments: {},
  feedFilter: "all",
};

function postMatchesFilter(post, me) {
  if (state.feedFilter === "mine") return Boolean(me?.id) && post.authorId === me.id;
  if (state.feedFilter === "mentions") {
    const text = String(post.text || "").toLowerCase();
    const mentionByName = me?.name ? text.includes(`@${String(me.name).toLowerCase()}`) : false;
    const mentionById = Array.isArray(post.mentions) && me?.id ? post.mentions.includes(me.id) : false;
    return mentionByName || mentionById;
  }
  return true;
}

function renderFeedFilters() {
  const tabs = [
    { id: "all", label: "Все" },
    { id: "mine", label: "Мне" },
    { id: "mentions", label: "@упоминания" },
  ];
  return `
    <div class="feed-head-tabs">
      ${tabs
        .map(
          (tab) => `
            <button type="button" class="feed-head-tab ${state.feedFilter === tab.id ? "active" : ""}" data-feed-filter="${tab.id}">${tab.label}</button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderVisibilityPicker(employees) {
  return `
    <div class="visibility-picker">
      <label class="vis-radio">
        <input type="radio" name="vis" value="all" ${state.composeVisibility === "all" ? "checked" : ""}>
        <span><strong>Видят все</strong> — пост увидит вся команда</span>
      </label>
      <label class="vis-radio">
        <input type="radio" name="vis" value="selected" ${state.composeVisibility === "selected" ? "checked" : ""}>
        <span><strong>Только выбранные</strong> — пост увидят отмеченные сотрудники</span>
      </label>
      <div class="vis-employees ${state.composeVisibility === "selected" ? "" : "disabled"}">
        ${employees
          .filter((e) => !e.isCurrent)
          .map(
            (e) => `
              <label class="participant-chip ${state.composeVisIds.includes(e.id) ? "on" : ""}" data-vis-emp="${e.id}">
                <input type="checkbox" value="${e.id}" ${state.composeVisIds.includes(e.id) ? "checked" : ""} ${state.composeVisibility === "selected" ? "" : "disabled"}>
                ${avatar(e, "xs")}
                <span>${escape(e.name)}</span>
              </label>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderComposer(me, employees) {
  return `
    <div class="feed-composer-wrap">
      <div class="composer">
        ${avatar(me, "sm")}
        <form id="composeForm" class="composer-form">
          <textarea name="text" id="composeText" placeholder="Поделись новостью или вопросом..." rows="1">${escape(state.composeText)}</textarea>
          ${state.composeFiles.length
            ? `
              <div class="composer-files">
                ${state.composeFiles
                  .map(
                    (f, i) => `
                      <span class="file-item">📎 ${escape(f.name)} <span class="file-size">${fmtSize(f.size)}</span>
                        <button type="button" class="btn-ghost icon-only danger" data-rm-comp-file="${i}">${ICONS.x}</button>
                      </span>
                    `,
                  )
                  .join("")}
              </div>
            `
            : ""}
          <div class="composer-actions">
            <label class="btn-ghost btn-sm" style="cursor:pointer">
              ${ICONS.paperclip}<span>Файл</span>
              <input type="file" id="composeFileInput" multiple style="display:none">
            </label>
            <button type="button" class="btn-ghost btn-sm" id="visibilityBtn">${ICONS.users}<span>${state.composeVisibility === "all" ? "Видят все" : `Выбрано: ${state.composeVisIds.length}`}</span></button>
            <button type="submit" class="btn-primary btn-sm">Опубликовать</button>
          </div>
          ${state.visibilityPickerOpen ? renderVisibilityPicker(employees) : ""}
        </form>
      </div>
    </div>
  `;
}

function renderPostVisibility(post, employees) {
  if (post.visibility !== "selected") return "";
  const names = (post.visibilityIds || [])
    .map((id) => employees.find((e) => e.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3);
  if (!names.length) return '<span class="post-vis">Команда</span>';
  return `<span class="post-vis">Видят: ${escape(names.join(", "))}${(post.visibilityIds || []).length > names.length ? "…" : ""}</span>`;
}

function renderComments(post) {
  const comments = post.comments || [];
  const showAll = Boolean(state.showAllComments[post.id]);
  const visible = showAll ? comments : comments.slice(-3);
  const hiddenCount = comments.length - visible.length;

  return `
    <div class="comments-block">
      ${
        hiddenCount > 0
          ? `<button type="button" class="feed-more-comments" data-show-all-comments="${post.id}">Ещё ${hiddenCount} ${hiddenCount === 1 ? "комментарий" : "комментариев"}</button>`
          : ""
      }
      ${visible
        .map((comment) => {
          const author = getEmployee(comment.authorId);
          return `
            <div class="comment">
              ${avatar(author, "xs")}
              <div class="comment-body">
                <div class="comment-author">${escape(author?.name || "?")}<span class="comment-time">${fmtRel(comment.ts || comment.createdAt)}</span></div>
                <div>${escape(comment.text || "").replace(/\n/g, "<br>")}</div>
                ${comment.files?.length ? `<div class="comment-files">${comment.files.map((f) => `<span class="file-item">📎 ${escape(f.name)} <span class="file-size">${fmtSize(f.size)}</span></span>`).join("")}</div>` : ""}
              </div>
            </div>
          `;
        })
        .join("")}
      <form class="comment-form" data-id="${post.id}">
        ${avatar(currentEmployee(), "xs")}
        <input type="text" name="text" placeholder="Написать комментарий..." autocomplete="off">
        <label class="btn-ghost icon-only" style="cursor:pointer" title="Файл">
          ${ICONS.paperclip}
          <input type="file" multiple style="display:none" data-comment-file="${post.id}">
        </label>
        ${state.commentFiles[post.id]?.length ? `<span class="file-size">📎 ${state.commentFiles[post.id].length}</span>` : ""}
      </form>
    </div>
  `;
}

function renderPost(post, me, employees) {
  const author = getEmployee(post.authorId);
  const liked = Boolean(me?.id && (post.likes || []).includes(me.id));
  const text = escape(post.text || "").replace(/\n/g, "<br>");

  return `
    <article class="feed-post" data-id="${post.id}">
      <div class="post-head">
        ${avatar(author, "sm")}
        <div class="post-body-wrap">
          <div class="post-head-line">
            <span class="post-author">${escape(author?.name || "Аноним")}</span>
            <span class="post-time">${fmtRel(post.createdAt)}</span>
            ${renderPostVisibility(post, employees)}
          </div>
          <div class="post-text">${text}</div>
          ${post.files?.length ? `<div class="post-files">${post.files.map((f) => `<span class="file-item">📎 ${escape(f.name)} <span class="file-size">${fmtSize(f.size)}</span></span>`).join("")}</div>` : ""}
          <div class="post-actions">
            <button type="button" class="post-action ${liked ? "active" : ""}" data-action="like" data-id="${post.id}">${ICONS.heart || "❤"}<span>${(post.likes || []).length || ""}</span></button>
            <button type="button" class="post-action" data-focus-comment="${post.id}">${ICONS.chat}<span>${(post.comments || []).length || ""}</span></button>
          </div>
          ${renderComments(post)}
        </div>
      </div>
    </article>
  `;
}

export function renderFeed(container) {
  seedDemo();
  const me = currentEmployee();
  const employees = listEmployees();

  const visiblePosts = Store.list(COLLECTION)
    .filter((p) => canSee(p, me?.id))
    .sort((a, b) => (b.createdAt || b.updatedAt || 0) - (a.createdAt || a.updatedAt || 0));

  const posts = visiblePosts.filter((post) => postMatchesFilter(post, me));

  container.innerHTML = `
    <div class="feed-view">
      <div class="feed-head">
        <h3>Лента</h3>
        ${renderFeedFilters()}
      </div>

      <section class="feed-card">
        ${renderComposer(me, employees)}
        <div class="feed-posts">
          ${
            posts.length
              ? posts.map((post) => renderPost(post, me, employees)).join("")
              : `<div class="placeholder"><div class="placeholder-icon">${ICONS.feed}</div><h3>В ленте пусто</h3><p>Опубликуй первый пост выше.</p></div>`
          }
        </div>
      </section>
    </div>
  `;

  wireEvents(container);
}

function autoGrow(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(180, Math.max(38, el.scrollHeight))}px`;
}

function wireEvents(container) {
  container.querySelectorAll("[data-feed-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.feedFilter = btn.dataset.feedFilter || "all";
      renderFeed(container);
    });
  });

  const composeForm = container.querySelector("#composeForm");
  const composeText = container.querySelector("#composeText");
  autoGrow(composeText);

  composeText?.addEventListener("input", (e) => {
    state.composeText = e.target.value || "";
    autoGrow(e.target);
  });

  container.querySelector("#composeFileInput")?.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []).map((f) => ({ name: f.name, size: f.size, type: f.type }));
    state.composeFiles = [...state.composeFiles, ...files];
    renderFeed(container);
  });

  container.querySelectorAll("[data-rm-comp-file]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.rmCompFile);
      state.composeFiles.splice(idx, 1);
      renderFeed(container);
    });
  });

  container.querySelector("#visibilityBtn")?.addEventListener("click", () => {
    state.visibilityPickerOpen = !state.visibilityPickerOpen;
    renderFeed(container);
  });

  container.querySelectorAll('input[name="vis"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      state.composeVisibility = radio.value;
      renderFeed(container);
    });
  });

  container.querySelectorAll("[data-vis-emp]").forEach((chip) => {
    chip.querySelector('input[type="checkbox"]')?.addEventListener("change", (e) => {
      const id = chip.dataset.visEmp;
      if (!id) return;
      if (e.target.checked) {
        if (!state.composeVisIds.includes(id)) state.composeVisIds.push(id);
      } else {
        state.composeVisIds = state.composeVisIds.filter((x) => x !== id);
      }
      chip.classList.toggle("on", e.target.checked);
    });
  });

  composeForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = String(composeText?.value || "").trim();
    if (!text && state.composeFiles.length === 0) return;

    const me = currentEmployee();
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

  container.querySelectorAll('[data-action="like"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      const post = Store.get(COLLECTION, btn.dataset.id);
      const me = currentEmployee();
      if (!post || !me?.id) return;
      const likes = Array.isArray(post.likes) ? [...post.likes] : [];
      const idx = likes.indexOf(me.id);
      if (idx >= 0) likes.splice(idx, 1);
      else likes.push(me.id);
      Store.update(COLLECTION, post.id, { likes });
      renderFeed(container);
    });
  });

  container.querySelectorAll("[data-show-all-comments]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.showAllComments[btn.dataset.showAllComments] = true;
      renderFeed(container);
    });
  });

  container.querySelectorAll("[data-focus-comment]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = container.querySelector(`.comment-form[data-id="${btn.dataset.focusComment}"] input[name="text"]`);
      input?.focus();
    });
  });

  container.querySelectorAll("[data-comment-file]").forEach((input) => {
    input.addEventListener("change", (e) => {
      const postId = input.dataset.commentFile;
      if (!postId) return;
      const files = Array.from(e.target.files || []).map((f) => ({ name: f.name, size: f.size, type: f.type }));
      state.commentFiles[postId] = [...(state.commentFiles[postId] || []), ...files];
      renderFeed(container);
    });
  });

  container.querySelectorAll(".comment-form").forEach((form) => {
    const input = form.querySelector('input[name="text"]');
    input?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      form.requestSubmit();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const postId = form.dataset.id;
      const post = postId ? Store.get(COLLECTION, postId) : null;
      if (!post) return;

      const text = String(input?.value || "").trim();
      const files = state.commentFiles[post.id] || [];
      if (!text && files.length === 0) return;

      const comments = Array.isArray(post.comments) ? [...post.comments] : [];
      comments.push({
        authorId: currentEmployee()?.id,
        text,
        files,
        ts: Date.now(),
      });

      Store.update(COLLECTION, post.id, { comments });
      state.commentFiles[post.id] = [];
      state.showAllComments[post.id] = true;
      renderFeed(container);
    });
  });
}
