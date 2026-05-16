import { ICONS } from "../icons.js";
import { listEmployees, currentEmployee, avatar } from "../employees.js";
import {
  BUILTIN_DOC_MODULES,
  ensureBuiltinDocumentsSeed,
  isEmployeeAdmin,
  isVisibleToCurrent,
  listDocuments,
  normalizeVisibility,
  saveDocumentVisibility,
} from "../docs/registry.js";

const MOBILE_BREAKPOINT = 720;

const uiState = {
  mobileAccessOpen: false,
};

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtTs(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseDocsRoute() {
  const raw = (location.hash || "#docs").replace(/^#/, "");
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] !== "docs") return { docId: null };
  return { docId: parts[1] ? decodeURIComponent(parts[1]) : null };
}

function docAudienceCount(doc, employees) {
  const visibility = normalizeVisibility(doc);
  if (visibility.mode === "all") return employees.length;
  return visibility.employeeIds.length;
}

function renderList(container, docs, isAdmin, employees) {
  const list = isAdmin ? docs : docs.filter(isVisibleToCurrent);
  container.innerHTML = `
    <div class="docs-view">
      <div class="doc-head">
        <div>
          <h3>Документы</h3>
          <p>Внутренние регламенты, инструкции и мотивационные материалы.</p>
        </div>
        ${isAdmin ? `<button class="btn-ghost" disabled title="В v1 новые документы добавляются только кодом">${ICONS.plus}<span>Новый</span></button>` : ""}
      </div>
      ${list.length === 0 ? `
        <div class="doc-empty">
          <div class="placeholder-icon">${ICONS.book}</div>
          <h4>Пока нет документов с доступом</h4>
          <p>Попроси администратора открыть доступ к нужному документу.</p>
        </div>
      ` : `
        <div class="doc-grid">
          ${list.map((doc) => `
            <a class="doc-card" href="#docs/${encodeURIComponent(doc.id)}">
              <div class="doc-card-top">
                <span class="doc-card-icon">${ICONS.book}</span>
                <span class="doc-card-type">${doc.type || "document"}</span>
              </div>
              <h4>${escapeHtml(doc.title || "Без названия")}</h4>
              <p>${escapeHtml(doc.description || "Описание отсутствует")}</p>
              <div class="doc-card-foot">
                <span>Обновлён: ${fmtTs(doc.updatedAt || doc.createdAt)}</span>
                ${isAdmin ? `<span class="chip-mini chip-mini-accent">${docAudienceCount(doc, employees)} сотрудников</span>` : ""}
              </div>
            </a>
          `).join("")}
        </div>
      `}
    </div>
  `;
}

function renderAccessPanel(doc, employees) {
  const visibility = normalizeVisibility(doc);
  const selected = new Set(visibility.employeeIds);
  return `
    <div class="doc-access-panel" data-doc-access>
      <h4>Доступ</h4>
      <div class="doc-access-mode">
        <button type="button" class="${visibility.mode === "all" ? "active" : ""}" data-access-mode="all">Всем</button>
        <button type="button" class="${visibility.mode === "selected" ? "active" : ""}" data-access-mode="selected">Выбранным</button>
      </div>
      <div class="doc-access-selected ${visibility.mode === "selected" ? "" : "is-hidden"}" data-access-selected-wrap>
        <input type="search" class="calc-input" placeholder="Поиск сотрудника..." data-access-search>
        <div class="doc-access-list" data-access-list>
          ${employees.map((e) => `
            <label class="doc-access-item" data-name="${escapeHtml((e.name || "").toLowerCase())}" data-email="${escapeHtml((e.email || "").toLowerCase())}">
              ${avatar(e, "xs")}
              <span class="doc-access-item-body">
                <b>${escapeHtml(e.name || "Без имени")}</b>
                <small>${escapeHtml(e.email || "—")}</small>
              </span>
              <input type="checkbox" value="${escapeHtml(e.id)}" ${selected.has(e.id) ? "checked" : ""}>
            </label>
          `).join("")}
        </div>
      </div>
      <button type="button" class="btn-primary doc-access-save" data-access-save disabled>${ICONS.check}<span>Сохранить</span></button>
      <div class="doc-access-hint">Режим «Всем» открывает документ всем сотрудникам с правом раздела «Документы».</div>
    </div>
  `;
}

function readAccessState(panel) {
  const selectedWrap = panel.querySelector("[data-access-selected-wrap]");
  const modeBtn = panel.querySelector(".doc-access-mode .active");
  const mode = modeBtn?.dataset.accessMode === "all" ? "all" : "selected";
  const employeeIds = selectedWrap
    ? Array.from(selectedWrap.querySelectorAll('input[type="checkbox"]:checked')).map((x) => x.value)
    : [];
  return normalizeVisibility({ visibility: { mode, employeeIds: mode === "all" ? [] : employeeIds } });
}

function setActiveMode(panel, mode) {
  panel.querySelectorAll("[data-access-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.accessMode === mode);
  });
  const wrap = panel.querySelector("[data-access-selected-wrap]");
  if (wrap) wrap.classList.toggle("is-hidden", mode !== "selected");
}

function wireAccessPanel(panel, doc, onSave) {
  const initial = JSON.stringify(normalizeVisibility(doc));
  const saveBtn = panel.querySelector("[data-access-save]");

  function syncDirty() {
    const current = JSON.stringify(readAccessState(panel));
    if (saveBtn) saveBtn.disabled = current === initial;
  }

  panel.querySelectorAll("[data-access-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveMode(panel, btn.dataset.accessMode || "selected");
      syncDirty();
    });
  });

  panel.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener("change", syncDirty);
  });

  panel.querySelector("[data-access-search]")?.addEventListener("input", (e) => {
    const q = String(e.target.value || "").toLowerCase().trim();
    panel.querySelectorAll(".doc-access-item").forEach((row) => {
      const hay = `${row.dataset.name || ""} ${(row.dataset.email || "")}`;
      row.classList.toggle("is-hidden", q && !hay.includes(q));
    });
  });

  saveBtn?.addEventListener("click", () => {
    const visibility = readAccessState(panel);
    onSave(visibility);
  });

  syncDirty();
}

function renderDocPage(container, doc, isAdmin, employees) {
  const audienceCount = docAudienceCount(doc, employees);
  container.innerHTML = `
    <div class="doc-page">
      <div class="doc-page-head">
        <a class="btn-ghost" href="#docs"><span>← Назад</span></a>
        <div class="doc-page-title">
          <h3>${escapeHtml(doc.title || "Документ")}</h3>
          <p>Обновлён: ${fmtTs(doc.updatedAt || doc.createdAt)}</p>
        </div>
        ${isAdmin ? `<span class="chip-mini chip-mini-accent">Доступ: ${audienceCount} сотрудников</span>` : ""}
      </div>

      <div class="doc-page-layout">
        <article class="doc-article" id="docArticleHost"></article>
        ${isAdmin ? `<aside class="doc-side">${renderAccessPanel(doc, employees)}</aside>` : ""}
      </div>

      ${isAdmin ? `
        <div class="doc-mobile-access">
          <button class="btn-primary" type="button" data-open-mobile-access>${ICONS.settings}<span>Управлять доступом</span></button>
        </div>
      ` : ""}
    </div>
    ${isAdmin && uiState.mobileAccessOpen ? `
      <div class="modal-backdrop" data-doc-access-modal>
        <div class="modal doc-access-modal">
          <div class="modal-header">
            <h2>Управление доступом</h2>
            <button type="button" class="btn-ghost icon-only" data-close-mobile-access>${ICONS.x}</button>
          </div>
          <div class="doc-access-modal-body">
            ${renderAccessPanel(doc, employees)}
          </div>
        </div>
      </div>
    ` : ""}
  `;

  const article = container.querySelector("#docArticleHost");
  if (article && doc.builtin && doc.contentModuleId && BUILTIN_DOC_MODULES[doc.contentModuleId]) {
    BUILTIN_DOC_MODULES[doc.contentModuleId](article, doc);
  } else if (article && doc.body) {
    article.innerHTML = doc.body;
  } else if (article) {
    article.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">${ICONS.book}</div>
        <h3>Контент документа не подключён</h3>
      </div>
    `;
  }

  if (isAdmin) {
    container.querySelectorAll("[data-doc-access]").forEach((panel) => {
      wireAccessPanel(panel, doc, (visibility) => {
        saveDocumentVisibility(doc.id, visibility);
        uiState.mobileAccessOpen = false;
        renderDocs(container);
      });
    });

    container.querySelector("[data-open-mobile-access]")?.addEventListener("click", () => {
      uiState.mobileAccessOpen = true;
      renderDocs(container);
    });

    container.querySelector("[data-close-mobile-access]")?.addEventListener("click", () => {
      uiState.mobileAccessOpen = false;
      renderDocs(container);
    });

    container.querySelector("[data-doc-access-modal]")?.addEventListener("click", (e) => {
      if (e.target.matches("[data-doc-access-modal]")) {
        uiState.mobileAccessOpen = false;
        renderDocs(container);
      }
    });
  }
}

export function renderDocs(container) {
  ensureBuiltinDocumentsSeed();

  const me = currentEmployee();
  const isAdmin = isEmployeeAdmin(me);
  const docs = listDocuments();
  const employees = listEmployees();
  const { docId } = parseDocsRoute();

  if (!docId) {
    uiState.mobileAccessOpen = false;
    renderList(container, docs, isAdmin, employees);
    return;
  }

  const doc = docs.find((d) => d.id === docId);
  if (!doc || !isVisibleToCurrent(doc)) {
    uiState.mobileAccessOpen = false;
    location.hash = "#docs";
    return;
  }

  if (window.innerWidth > MOBILE_BREAKPOINT) uiState.mobileAccessOpen = false;
  renderDocPage(container, doc, isAdmin, employees);
}
