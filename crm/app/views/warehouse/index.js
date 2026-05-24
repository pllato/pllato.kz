import { ICONS } from "../../icons.js";
import {
  ensureWarehouseSeed,
  migrateWarehouseLegacyCollections,
  canEditWarehouse,
  listWarehouseKpis,
  listWarehouseAlerts,
  listWarehouseProducts,
  listWarehouseMovements,
  saveWarehouseProduct,
  reorderWarehouseProduct,
  getWarehouseProductSort,
  setWarehouseProductSort,
  createWarehouseDocument,
  updateWarehouseDocument,
  getWarehouseDocument,
  postWarehouseDocument,
  cancelWarehouseDocument,
  autoSplitDocumentItems,
} from "../../warehouse.js";
import { renderProductsListView } from "./products_list.js";
import { renderProductCardView } from "./product_card.js";
import { renderDocumentsListView } from "./documents_list.js";
import {
  newWarehouseDocumentDraft,
  draftFromDocument,
  renderWarehouseDocumentModal,
  readDraftFromModal,
  isOutType,
} from "./document_form.js";
import { renderWarehouseReportsView } from "./reports.js";
import { renderPreliminaryOrdersView, wirePreliminaryOrdersEvents } from "./preliminary_orders.js";
import { renderWarehouseImportView, initWarehouseImportView } from "./import_xlsx.js";
import { renderStocktakeView, wireStocktakeEvents } from "./stocktake_view.js";

const ui = {
  productQuery: "",
  productEntity: "",
  productCategory: "",
  productPage: 0,           // пагинация каталога
  productPageSize: 50,
  docsType: "",
  docsStatus: "",
  reportDate: new Date().toISOString().slice(0, 10),
  productFormOpen: false,
  productFormError: "",
  productDraft: null,
  docModal: {
    open: false,
    draft: null,
    error: "",
  },
};

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function num(v) {
  return new Intl.NumberFormat("ru-RU").format(Number(v) || 0);
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU");
}

function parseWarehouseRoute() {
  const raw = (location.hash || "#warehouse").replace(/^#/, "");
  const [path] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  if (parts[0] !== "warehouse") return { page: "home", productId: null };

  const second = parts[1] || "";
  if (!second) return { page: "home", productId: null };
  if (second === "products" && parts[2]) return { page: "product", productId: decodeURIComponent(parts[2]) };
  if (second === "products") return { page: "products", productId: null };
  if (second === "documents") return { page: "documents", productId: null };
  if (second === "orders") return { page: "orders", productId: null };
  if (second === "reports") return { page: "reports", productId: null };
  if (second === "import") return { page: "import", productId: null };
  if (second === "stocktakes") {
    if (parts[2] === "new") return { page: "stocktakes", subroute: { page: "new" } };
    if (parts[2]) return { page: "stocktakes", subroute: { page: "card", stocktakeId: decodeURIComponent(parts[2]) } };
    return { page: "stocktakes", subroute: { page: "list" } };
  }
  return { page: "home", productId: null };
}

function renderHomeView(canEdit) {
  const kpi = listWarehouseKpis();
  const alerts = listWarehouseAlerts();
  const topMoves = listWarehouseMovements({}).slice(-8).reverse();
  const topProducts = listWarehouseProducts({ includeArchived: false }).slice(0, 5);

  return `
    <section class="whm-section">
      ${alerts.length ? `
        <div class="alert-bar ${alerts.some((a) => a.level === "danger") ? "danger" : ""}">
          <span class="whm-alert-ico">${ICONS.alertTriangle}</span>
          <span>${escapeHtml(alerts.slice(0, 3).map((a) => a.message).join(" · "))}</span>
          <div class="spacer"></div>
          <a class="btn-sm btn-ghost" href="#warehouse/products">Открыть товары</a>
        </div>
      ` : ""}

      <div class="kpi-grid whm-kpi-grid">
        <div class="kpi"><div class="kpi-label">Активных товаров</div><div class="kpi-value">${num(kpi.products)}</div></div>
        <div class="kpi"><div class="kpi-label">Партий с остатком</div><div class="kpi-value">${num(kpi.activeLots)}</div></div>
        <div class="kpi"><div class="kpi-label">Истекает в 30 дней</div><div class="kpi-value">${num(kpi.expiringSoon)}</div><div class="kpi-sub warning">Просрочено: ${num(kpi.expired)}</div></div>
        <div class="kpi"><div class="kpi-label">Документов за месяц</div><div class="kpi-value">${num(kpi.docsMonth)}</div></div>
      </div>

      <div class="whm-grid-2">
        <div class="card">
          <div class="card-head"><h3>Последние движения</h3><a class="btn-sm btn-ghost" href="#warehouse/documents">Документы →</a></div>
          <table class="table">
            <thead><tr><th>Дата</th><th>Тип</th><th>Куда</th><th class="num">Кол-во</th></tr></thead>
            <tbody data-wh-recent-moves>
              ${topMoves.length ? topMoves.map((m) => `<tr><td>${escapeHtml(fmtDate(m.date))}</td><td>${escapeHtml(m.type)}</td><td>${escapeHtml(m.counterpartyText || "—")}</td><td class="num">${m.direction === "out" ? "−" : "+"}${num(m.qty)}</td></tr>`).join("") : `<tr><td colspan="4" class="dim">Загружаем из IndexedDB…</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="card">
          <div class="card-head"><h3>Быстрые действия</h3></div>
          <div class="card-pad whm-quick-actions">
            <a class="btn-ghost" href="#warehouse/products">${ICONS.package}<span>Каталог</span></a>
            <button type="button" class="btn-ghost" data-wh-new-doc="receipt" ${canEdit ? "" : "disabled"}>${ICONS.truckIn}<span>Приход</span></button>
            <button type="button" class="btn-ghost" data-wh-new-doc="sale_invoice" ${canEdit ? "" : "disabled"}>${ICONS.truckOut}<span>Расход</span></button>
            <a class="btn-ghost" href="#warehouse/reports">${ICONS.clipboardList}<span>Отчёт остатки</span></a>
            <a class="btn-ghost" href="#warehouse/stocktakes">${ICONS.calendarClock}<span>Инвентаризация</span></a>
          </div>
          <div class="card-head" style="border-top:1px solid var(--border-soft)"><h3>Товары (топ-5)</h3></div>
          <div class="card-pad">
            <ul class="whm-mini-list">
              ${topProducts.map((p) => `<li><a href="#warehouse/products/${escapeAttr(p.id)}">${escapeHtml(p.name)}</a><span>${num(p.summary?.total || 0)} ${escapeHtml(p.unit || "шт")}</span></li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    </section>
  `;
}

function shellTabs(route) {
  const tab = route.page;
  return `
    <div class="wh-head">
      <div class="wh-title-wrap">
        <div class="wh-title-ico">${ICONS.warehouse}</div>
        <div>
          <h3>Склад</h3>
          <p>Партионный учёт, FIFO-документы, контроль сроков.</p>
        </div>
      </div>
      <div class="wh-top-actions">
        <a class="btn-ghost" href="#warehouse/import">${ICONS.clipboardList}<span>Импорт</span></a>
      </div>
    </div>
    <div class="wh-tabs" role="tablist" aria-label="Склад">
      <a class="wh-tab ${tab === "home" ? "active" : ""}" href="#warehouse">Главная</a>
      <a class="wh-tab ${tab === "products" || tab === "product" ? "active" : ""}" href="#warehouse/products">Каталог</a>
      <a class="wh-tab ${tab === "documents" ? "active" : ""}" href="#warehouse/documents">Документы</a>
      <a class="wh-tab ${tab === "orders" ? "active" : ""}" href="#warehouse/orders">Заказы</a>
      <a class="wh-tab ${tab === "reports" ? "active" : ""}" href="#warehouse/reports">Отчёты</a>
      <a class="wh-tab ${tab === "stocktakes" ? "active" : ""}" href="#warehouse/stocktakes">Инвентаризация</a>
    </div>
  `;
}

function openDocModal(type, prefill = {}) {
  ui.docModal.open = true;
  ui.docModal.error = "";
  ui.docModal.draft = newWarehouseDocumentDraft(type, prefill);
}

function openDocModalById(docId) {
  const doc = getWarehouseDocument(docId);
  if (!doc) return;
  ui.docModal.open = true;
  ui.docModal.error = "";
  ui.docModal.draft = draftFromDocument(doc);
}

function closeDocModal() {
  ui.docModal.open = false;
  ui.docModal.error = "";
}

function openProductForm(product = null) {
  ui.productFormOpen = true;
  ui.productFormError = "";
  ui.productDraft = product ? { ...product } : { sku: "", name: "", category: "", entity: "", unit: "шт", pack: "", description: "", minStock: 0 };
}

function closeProductForm() {
  ui.productFormOpen = false;
  ui.productFormError = "";
  ui.productDraft = null;
}

function readProductForm(container) {
  const form = container.querySelector("[data-wh-product-form]");
  if (!form) return null;
  const fd = new FormData(form);
  return {
    id: fd.get("id") || null,
    sku: fd.get("sku") || "",
    name: fd.get("name") || "",
    category: fd.get("category") || "",
    entity: fd.get("entity") || "",
    unit: fd.get("unit") || "шт",
    pack: fd.get("pack") || "",
    minStock: Number(fd.get("minStock") || 0),
    description: fd.get("description") || "",
  };
}

function readModalDraft(container) {
  const draft = readDraftFromModal(container);
  if (!draft) return null;
  draft.id = ui.docModal.draft?.id || null;
  draft.status = ui.docModal.draft?.status || "draft";
  draft.counterpartyContactId = ui.docModal.draft?.counterpartyContactId || null;
  draft.attachedFiles = ui.docModal.draft?.attachedFiles || [];
  return draft;
}

function renderStocktakesSoon() {
  return `
    <section class="whm-section">
      <div class="placeholder whm-placeholder">
        <div class="placeholder-icon">${ICONS.calendarClock}</div>
        <h3>Инвентаризация скоро</h3>
        <p>В этот MVP включены каталог, карточка товара, документы и отчёт остатков на дату.</p>
      </div>
    </section>
  `;
}

function pageContent(route, canEdit) {
  if (route.page === "home") return renderHomeView(canEdit);
  if (route.page === "products") return renderProductsListView(ui, canEdit);
  if (route.page === "product") return renderProductCardView(route.productId, canEdit);
  if (route.page === "documents") return renderDocumentsListView(ui, canEdit);
  if (route.page === "reports") return renderWarehouseReportsView(ui);
  if (route.page === "import") return renderWarehouseImportView();
  if (route.page === "orders") return renderPreliminaryOrdersView();
  if (route.page === "stocktakes") return renderStocktakeView(route.subroute || { page: "list" });
  return renderHomeView(canEdit);
}

function rerender(container) {
  renderWarehouse(container);
}

function wireWarehouseEvents(container, route, canEdit) {
  // Pagination: переключение страниц каталога товаров.
  container.querySelectorAll("[data-wh-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = Number(btn.dataset.whPage);
      if (Number.isFinite(page) && page >= 0) {
        ui.productPage = page;
        rerender(container);
        // Прокрутка к верху таблицы, чтобы видеть новые строки.
        const table = container.querySelector(".whm-table");
        if (table) table.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  let filterDebounce = null;
  container.querySelectorAll("[data-wh-filter]").forEach((el) => {
    const apply = () => {
      const key = el.dataset.whFilter;
      const wasFocused = document.activeElement === el;
      const caretPos = wasFocused && typeof el.selectionStart === "number" ? el.selectionStart : null;
      ui[`product${key[0].toUpperCase()}${key.slice(1)}`] = el.value;
      ui.productPage = 0;   // при смене фильтра возвращаемся к первой странице
      rerender(container);
      // Restore focus + caret position in the freshly rendered input
      if (wasFocused) {
        const newEl = container.querySelector(`[data-wh-filter="${key}"]`);
        if (newEl) {
          newEl.focus();
          if (caretPos !== null && typeof newEl.setSelectionRange === "function") {
            try { newEl.setSelectionRange(caretPos, caretPos); } catch (_) {}
          }
        }
      }
    };
    // Text inputs: debounce so we don't re-render mid-typing (which drops characters)
    if (el.tagName === "INPUT") {
      el.addEventListener("input", () => {
        clearTimeout(filterDebounce);
        filterDebounce = setTimeout(apply, 220);
      });
    }
    // Selects (and Enter/blur on inputs): apply immediately
    el.addEventListener("change", apply);
  });

  container.querySelectorAll("[data-wh-doc-filter]").forEach((el) => {
    el.addEventListener("change", () => {
      const k = el.dataset.whDocFilter;
      if (k === "type") ui.docsType = el.value;
      if (k === "status") ui.docsStatus = el.value;
      rerender(container);
    });
  });

  container.querySelector("[data-wh-open-product-form]")?.addEventListener("click", () => {
    if (!canEdit) return;
    openProductForm();
    rerender(container);
  });

  container.querySelectorAll("[data-wh-open-product]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-wh-open-product");
      if (!id) return;
      location.hash = `#warehouse/products/${encodeURIComponent(id)}`;
    });
  });

  // Sort column headers (asc/desc) + reset to manual
  container.querySelectorAll("[data-wh-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const field = th.dataset.whSort;
      if (!field) return;
      const cur = getWarehouseProductSort();
      const nextDir = cur.field === field && cur.dir === "asc" ? "desc" : "asc";
      setWarehouseProductSort(field, nextDir);
      rerender(container);
    });
  });
  container.querySelector("[data-wh-reset-sort]")?.addEventListener("click", () => {
    setWarehouseProductSort("manual", "asc");
    rerender(container);
  });

  // Drag & drop reordering of catalog rows (only when sort is manual)
  (() => {
    if (getWarehouseProductSort().field !== "manual") return;
    let dragSourceId = null;
    const rows = container.querySelectorAll("[data-wh-row-id][draggable=\"true\"]");
    if (!rows.length) return;
    const clearMarkers = () => {
      rows.forEach((r) => r.classList.remove("dragging", "drag-over-above", "drag-over-below"));
    };
    rows.forEach((row) => {
      row.addEventListener("dragstart", (e) => {
        dragSourceId = row.dataset.whRowId;
        row.classList.add("dragging");
        try {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", dragSourceId);
        } catch (_) {}
      });
      row.addEventListener("dragend", () => {
        dragSourceId = null;
        clearMarkers();
      });
      row.addEventListener("dragover", (e) => {
        if (!dragSourceId || row.dataset.whRowId === dragSourceId) return;
        e.preventDefault();
        try { e.dataTransfer.dropEffect = "move"; } catch (_) {}
        const rect = row.getBoundingClientRect();
        const insertBefore = e.clientY < rect.top + rect.height / 2;
        row.classList.remove(insertBefore ? "drag-over-below" : "drag-over-above");
        row.classList.add(insertBefore ? "drag-over-above" : "drag-over-below");
      });
      row.addEventListener("dragleave", (e) => {
        if (!row.contains(e.relatedTarget)) {
          row.classList.remove("drag-over-above", "drag-over-below");
        }
      });
      row.addEventListener("drop", (e) => {
        e.preventDefault();
        const sourceId = dragSourceId;
        const targetId = row.dataset.whRowId;
        clearMarkers();
        if (!sourceId || !targetId || sourceId === targetId) return;
        const rect = row.getBoundingClientRect();
        const insertBefore = e.clientY < rect.top + rect.height / 2;
        reorderWarehouseProduct(sourceId, targetId, insertBefore);
        rerender(container);
      });
    });
  })();

  container.querySelectorAll("[data-wh-new-doc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!canEdit) return;
      const type = btn.getAttribute("data-wh-new-doc") || "receipt";
      const prefill = route.page === "product" ? { productId: route.productId } : {};
      openDocModal(type, prefill);
      rerender(container);
    });
  });

  container.querySelectorAll("[data-wh-open-doc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-wh-open-doc");
      if (!id) return;
      openDocModalById(id);
      rerender(container);
    });
  });

  container.querySelector("[data-wh-report-date]")?.addEventListener("change", (e) => {
    ui.reportDate = e.target.value;
    rerender(container);
  });

  container.querySelector("[data-wh-open-import]")?.addEventListener("click", () => {
    location.hash = "#warehouse/import";
  });

  // Product modal
  container.querySelectorAll("[data-wh-close-product]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeProductForm();
      rerender(container);
    });
  });

  container.querySelector("[data-wh-save-product]")?.addEventListener("click", () => {
    const payload = readProductForm(container);
    if (!payload) return;
    try {
      saveWarehouseProduct(payload);
      closeProductForm();
      rerender(container);
    } catch (e) {
      ui.productFormError = e?.message || String(e);
      rerender(container);
    }
  });

  // Document modal
  container.querySelector("[data-wh-doc-close]")?.addEventListener("click", () => {
    closeDocModal();
    rerender(container);
  });

  container.querySelectorAll("[data-wh-line-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const draft = readModalDraft(container) || ui.docModal.draft;
      if (!draft) return;
      draft.items.push({ lineId: `line_${Date.now()}`, splitFromLineId: null, productId: null, lotId: null, lotCode: "", expiryDate: "", qty: 0, unitPrice: 0, lineAmount: 0 });
      ui.docModal.draft = draft;
      rerender(container);
    });
  });

  container.querySelectorAll("[data-wh-line-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-wh-line-remove"));
      const draft = readModalDraft(container) || ui.docModal.draft;
      if (!draft || !Number.isFinite(idx)) return;
      draft.items = draft.items.filter((_, i) => i !== idx);
      if (!draft.items.length) draft.items.push({ lineId: `line_${Date.now()}`, splitFromLineId: null, productId: null, lotId: null, lotCode: "", expiryDate: "", qty: 0, unitPrice: 0, lineAmount: 0 });
      ui.docModal.draft = draft;
      rerender(container);
    });
  });

  container.querySelector("[data-wh-doc-autosplit]")?.addEventListener("click", () => {
    const draft = readModalDraft(container) || ui.docModal.draft;
    if (!draft) return;
    if (!isOutType(draft.type)) {
      ui.docModal.error = "Автосплит доступен только для расходных документов";
      rerender(container);
      return;
    }
    draft.items = autoSplitDocumentItems(draft.type, draft.items);
    ui.docModal.error = "";
    ui.docModal.draft = draft;
    rerender(container);
  });

  container.querySelector("[data-wh-doc-save]")?.addEventListener("click", () => {
    if (!canEdit) return;
    const draft = readModalDraft(container);
    if (!draft) return;
    ui.docModal.error = "";
    try {
      let saved = null;
      if (draft.id) {
        saved = updateWarehouseDocument(draft.id, draft);
      } else {
        saved = createWarehouseDocument(draft);
      }
      ui.docModal.draft = draftFromDocument(saved);
      rerender(container);
    } catch (e) {
      ui.docModal.error = e?.message || String(e);
      rerender(container);
    }
  });

  container.querySelector("[data-wh-doc-post]")?.addEventListener("click", () => {
    if (!canEdit) return;
    const draft = readModalDraft(container);
    if (!draft) return;
    ui.docModal.error = "";
    try {
      const saved = draft.id ? updateWarehouseDocument(draft.id, draft) : createWarehouseDocument(draft);
      postWarehouseDocument(saved.id);
      closeDocModal();
      rerender(container);
    } catch (e) {
      ui.docModal.error = e?.message || String(e);
      rerender(container);
    }
  });

  container.querySelector("[data-wh-doc-cancel]")?.addEventListener("click", () => {
    if (!canEdit) return;
    const draft = ui.docModal.draft;
    if (!draft?.id) return;
    ui.docModal.error = "";
    try {
      cancelWarehouseDocument(draft.id);
      closeDocModal();
      rerender(container);
    } catch (e) {
      ui.docModal.error = e?.message || String(e);
      rerender(container);
    }
  });
}

export function renderWarehouse(container) {
  migrateWarehouseLegacyCollections();
  const qs = new URLSearchParams(location.search);
  if (qs.get("demo") === "warehouse") ensureWarehouseSeed();
  const route = parseWarehouseRoute();
  const editable = canEditWarehouse();

  container.innerHTML = `
    <div class="wh-view whm-view">
      ${shellTabs(route)}
      ${pageContent(route, editable)}
      ${renderWarehouseDocumentModal(ui, editable)}
    </div>
  `;

  wireWarehouseEvents(container, route, editable);

  // Подключаем события импортного экрана, если мы на /import.
  // Idempotent: повторный вызов на одной DOM-ноде не дублирует слушателей.
  if (route.page === "import") {
    initWarehouseImportView(container);
  }

  // Канбан Заказов: подвешиваем обработчики кнопок «Согласовать / Отозвать».
  if (route.page === "orders") {
    wirePreliminaryOrdersEvents(container);
  }
  // Инвентаризация: события списка/карточки/диалогов.
  if (route.page === "stocktakes") {
    wireStocktakeEvents(container, route.subroute || { page: "list" });
  }
  // При approval/refresh из дочернего модуля — перерендериваем view.
  if (!window.__pllato_wh_refresh_wired) {
    window.__pllato_wh_refresh_wired = true;
    window.addEventListener("pllato:warehouse-refresh", () => {
      const mount = document.getElementById("mainView");
      if (mount) renderWarehouse(mount);
    });
  }

  // На главной — async подгрузка движений из IndexedDB (в дополнение к
  // localStorage-движениям, отрендеренным синхронно выше).
  if (route.page === "home") {
    const host = container.querySelector("[data-wh-recent-moves]");
    if (host) {
      import("../../wh_movements_db.js").then(async ({ getRecentMovements }) => {
        try {
          const recent = await getRecentMovements(8);
          if (recent.length === 0) {
            // Нет движений в IDB — оставляем то что было.
            return;
          }
          // Заменяем содержимое tbody свежими движениями.
          host.innerHTML = recent.map((m) => `
            <tr>
              <td>${escapeHtml(fmtDate(m.date))}</td>
              <td>${escapeHtml(m.type || "")}</td>
              <td>${escapeHtml(m.counterpartyText || "—")}</td>
              <td class="num">${m.direction === "out" ? "−" : "+"}${num(m.qty)}</td>
            </tr>
          `).join("");
        } catch (err) {
          console.warn("[warehouse-home] не удалось подгрузить движения из IDB:", err);
        }
      }).catch(() => {});
    }
  }

  // В карточке товара — async подгрузка движений из IndexedDB и пере-рендер
  // блока [data-wh-movements-host] полным содержимым (с учётом и localStorage,
  // и IDB).
  if (route.page === "product" && route.productId) {
    const host = container.querySelector('[data-wh-movements-host]');
    if (host) {
      Promise.all([
        import("../../warehouse.js"),
        import("./product_card.js"),
      ]).then(async ([whMod, cardMod]) => {
        try {
          const grouped = await whMod.listGroupedMovementsByLotAsync(route.productId);
          host.innerHTML = cardMod.renderMovementsBlock(grouped);
        } catch (err) {
          console.warn("[warehouse-product] не удалось подгрузить движения из IDB:", err);
        }
      }).catch(() => {});
    }
  }
}
