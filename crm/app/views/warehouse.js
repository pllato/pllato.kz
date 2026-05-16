import { ICONS } from "../icons.js";
import { listEmployees } from "../employees.js";
import {
  listProducts,
  listProductCategories,
  getProduct,
  saveProduct,
  archiveProduct,
  listBatchesForProduct,
  addBatch,
  writeOffBatch,
  adjustBatch,
  setBatchOnSale,
  stockSummary,
  expiringBatches,
  expiredBatches,
  listStockRows,
  listStockMovements,
  stockValuation,
  seedWarehouseDemo,
} from "../warehouse_store.js";

const PAGE_SIZE = 25;
const TABS = new Set(["products", "stock", "movements"]);

const state = {
  search: "",
  categoryId: "",
  stockStatus: "all",
  expiringOnly: false,
  page: 1,
  stockSort: "expiry",
  includeArchivedStock: false,
  includeArchivedProductBatches: false,
  productTab: "batches",
  batchFormOpen: false,
  movementsType: "all",
  movementsDays: "30",
  saveState: "idle",
};

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function parseNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmtMoney(n) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(parseNum(n, 0)))} ₸`;
}

function fmtDateIso(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDayStart(ts = Date.now()) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function daysLeftByIso(isoDate) {
  if (!isoDate) return Number.POSITIVE_INFINITY;
  const ts = new Date(`${isoDate}T00:00:00`).getTime();
  if (!Number.isFinite(ts)) return Number.POSITIVE_INFINITY;
  return Math.floor((ts - toDayStart()) / 86400000);
}

function formatDaysLeft(days) {
  if (!Number.isFinite(days)) return "—";
  if (days < 0) return `истёк ${Math.abs(days)} дн`;
  if (days === 0) return "сегодня";
  return `${days} дн`;
}

function productExpiryStatus(product) {
  if (product?.hasExpired) {
    return { cls: "danger", text: "Просрочено" };
  }
  if (!Number.isFinite(product?.nearestDaysLeft)) {
    return { cls: "muted", text: "—" };
  }
  if (product.nearestDaysLeft <= 30) {
    return { cls: "warn", text: `≤ ${product.nearestDaysLeft} дн` };
  }
  if (product.nearestDaysLeft <= 90) {
    return { cls: "caution", text: `${product.nearestDaysLeft} дн` };
  }
  return { cls: "ok", text: fmtDateIso(product?.nearestBatch?.expiryDate) };
}

function batchExpiryClass(daysLeft) {
  if (!Number.isFinite(daysLeft)) return "";
  if (daysLeft < 0) return "is-expired";
  if (daysLeft <= 30) return "is-30";
  if (daysLeft <= 90) return "is-90";
  return "";
}

function movementTypeLabel(type) {
  return ({
    in: "Приход",
    out: "Расход",
    writeoff: "Списание",
    adjust: "Корректировка",
  }[type] || type || "—");
}

function movementReasonLabel(reason) {
  return ({
    purchase: "Поставка",
    deal_shipment: "Отгрузка по сделке",
    expired: "Просрочка",
    damaged: "Брак",
    inventory_correction: "Корректировка",
    manual: "Ручная операция",
  }[reason] || reason || "—");
}

function parseHash() {
  const hash = (location.hash || "#warehouse/products").replace(/^#/, "");
  const [pathPart, queryPart = ""] = hash.split("?");
  const parts = pathPart.split("/").filter(Boolean);

  if (parts[0] !== "warehouse") {
    return { tab: "products", productId: null, query: new URLSearchParams() };
  }

  const tabRaw = parts[1] || "products";
  const tab = TABS.has(tabRaw) ? tabRaw : "products";
  const productId = tab === "products" && parts[2] ? decodeURIComponent(parts[2]) : null;
  const query = new URLSearchParams(queryPart || "");
  return { tab, productId, query };
}

function normalizeWarehouseHash() {
  if (/^#warehouse\/?$/.test(location.hash || "")) {
    history.replaceState(null, "", "#warehouse/products");
  }
}

function openProduct(id) {
  if (!id) return;
  location.hash = `#warehouse/products/${encodeURIComponent(id)}`;
}

function openNewProduct() {
  location.hash = "#warehouse/products/new";
}

function closeProductModal() {
  location.hash = "#warehouse/products";
}

function buildCategoryMap(categories) {
  return new Map(categories.map((c) => [c.id, c.name]));
}

function renderTop(tab) {
  return `
    <div class="wh-head">
      <div class="wh-title-wrap">
        <div class="wh-title-ico">${ICONS.warehouse || ICONS.deals}</div>
        <div>
          <h3>Склад</h3>
          <p>Каталог товаров, партии и остатки.</p>
        </div>
      </div>
      <div class="wh-top-actions">
        <button type="button" class="btn-ghost" disabled title="Импорт будет в следующем PR">Импорт</button>
        <button type="button" class="btn-primary" id="whNewProduct">${ICONS.plus}<span>Товар</span></button>
      </div>
    </div>
    <div class="wh-tabs" role="tablist" aria-label="Склад">
      <a class="wh-tab ${tab === "products" ? "active" : ""}" href="#warehouse/products">Товары</a>
      <a class="wh-tab ${tab === "stock" ? "active" : ""}" href="#warehouse/stock">Остатки</a>
      <a class="wh-tab ${tab === "movements" ? "active" : ""}" href="#warehouse/movements">Движения</a>
    </div>
  `;
}

function renderProductsSection() {
  const categories = listProductCategories();
  const catMap = buildCategoryMap(categories);
  const products = listProducts({
    query: state.search,
    categoryId: state.categoryId,
    stockStatus: state.stockStatus,
    expiringOnly: state.expiringOnly,
    includeArchived: false,
  });

  const expiringCount = expiringBatches(30).length + expiredBatches().length;
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;
  const start = (state.page - 1) * PAGE_SIZE;
  const pageRows = products.slice(start, start + PAGE_SIZE);

  const tableBody = pageRows.length
    ? pageRows
        .map((p) => {
          const total = p.summary?.total || 0;
          const low = p.minStock > 0 && total > 0 && total < p.minStock;
          const stockCls = total <= 0 ? "is-out" : low ? "is-low" : "is-ok";
          const expiry = productExpiryStatus(p);
          return `
            <tr class="wh-row" data-wh-open="${escapeAttr(p.id)}">
              <td>
                <div class="wh-product-cell">
                  <div class="wh-photo-ph">${ICONS.warehouse || ICONS.tasks}</div>
                  <div>
                    <div class="wh-product-name">${escape(p.name || "Без названия")}</div>
                    <div class="wh-product-sub">${escape(p.sku || "—")} · ${escape(p.unit || "шт.")}</div>
                  </div>
                </div>
              </td>
              <td>${escape(catMap.get(p.categoryId) || "—")}</td>
              <td><span class="wh-stock ${stockCls}">${new Intl.NumberFormat("ru-RU").format(total)}</span></td>
              <td>${fmtMoney(p.sellPrice || 0)}</td>
              <td><span class="wh-exp wh-exp-${expiry.cls}">${escape(expiry.text)}</span></td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="5"><div class="wh-empty-row">Ничего не найдено по текущим фильтрам.</div></td></tr>`;

  return `
    <section class="wh-card">
      <div class="list-toolbar wh-toolbar">
        <label class="search-input">
          <span class="search-ico">${ICONS.search}</span>
          <input type="search" id="whSearch" value="${escapeAttr(state.search)}" placeholder="Поиск по артикулу, штрихкоду, названию">
        </label>
        <select id="whCategory">
          <option value="">Все категории</option>
          ${categories.map((c) => `<option value="${escapeAttr(c.id)}" ${state.categoryId === c.id ? "selected" : ""}>${escape(c.name)}</option>`).join("")}
        </select>
        <select id="whStockStatus">
          <option value="all" ${state.stockStatus === "all" ? "selected" : ""}>Все остатки</option>
          <option value="in" ${state.stockStatus === "in" ? "selected" : ""}>В наличии</option>
          <option value="low" ${state.stockStatus === "low" ? "selected" : ""}>Заканчивается</option>
          <option value="out" ${state.stockStatus === "out" ? "selected" : ""}>Нет в наличии</option>
        </select>
        <button type="button" id="whExpiringBadge" class="dupes-badge ${state.expiringOnly ? "active" : ""}">
          ${ICONS.calendar}<span>${expiringCount} истекают в 30 дней</span>
        </button>
      </div>

      <div class="wh-table-wrap">
        <table class="wh-table">
          <thead>
            <tr>
              <th>Товар</th>
              <th>Категория</th>
              <th>Остаток</th>
              <th>Цена продажи</th>
              <th>Срок</th>
            </tr>
          </thead>
          <tbody>${tableBody}</tbody>
        </table>
      </div>

      <footer class="wh-list-foot">
        <div>${products.length} товаров · стоимость склада ${fmtMoney(stockValuation())}</div>
        <div class="wh-page">
          <button type="button" class="btn-ghost btn-sm" id="whPrev" ${state.page <= 1 ? "disabled" : ""}>Назад</button>
          <span>${state.page}/${totalPages}</span>
          <button type="button" class="btn-ghost btn-sm" id="whNext" ${state.page >= totalPages ? "disabled" : ""}>Вперёд</button>
        </div>
      </footer>
    </section>
  `;
}

function sortedStockRows() {
  const rows = listStockRows({ includeArchived: state.includeArchivedStock }).map((row) => {
    const minDays = row.batches.reduce((min, b) => Math.min(min, parseNum(b.daysLeft, Number.POSITIVE_INFINITY)), Number.POSITIVE_INFINITY);
    const totalValue = row.batches.reduce((sum, b) => sum + parseNum(b.value, 0), 0);
    return { ...row, minDays, totalValue };
  });

  if (state.stockSort === "qty") {
    rows.sort((a, b) => parseNum(b.total, 0) - parseNum(a.total, 0));
  } else if (state.stockSort === "value") {
    rows.sort((a, b) => parseNum(b.totalValue, 0) - parseNum(a.totalValue, 0));
  } else {
    rows.sort((a, b) => a.minDays - b.minDays);
  }

  rows.forEach((row) => {
    row.batches = row.batches.slice().sort((a, b) => {
      if (state.stockSort === "qty") return parseNum(b.qty, 0) - parseNum(a.qty, 0);
      if (state.stockSort === "value") return parseNum(b.value, 0) - parseNum(a.value, 0);
      return parseNum(a.daysLeft, Number.POSITIVE_INFINITY) - parseNum(b.daysLeft, Number.POSITIVE_INFINITY);
    });
  });

  return rows;
}

function renderStockSection() {
  const rows = sortedStockRows();

  const body = rows.length
    ? rows
        .map((row) => {
          const header = `
            <tr class="wh-stock-group-row">
              <td colspan="8">
                <div class="wh-stock-group-head">
                  <button type="button" class="wh-link-btn" data-wh-open="${escapeAttr(row.product.id)}">${escape(row.product.name || "Без названия")}</button>
                  <span>${escape(row.product.sku || "—")}</span>
                  <span>Общий остаток: ${new Intl.NumberFormat("ru-RU").format(row.total)}</span>
                </div>
              </td>
            </tr>
          `;

          const batchRows = row.batches
            .map((b) => {
              const cls = batchExpiryClass(b.daysLeft);
              return `
                <tr class="wh-stock-row ${cls}">
                  <td>${escape(b.batchNumber || "—")}</td>
                  <td>${fmtDateIso(b.expiryDate)}</td>
                  <td>${formatDaysLeft(b.daysLeft)}</td>
                  <td>${new Intl.NumberFormat("ru-RU").format(parseNum(b.qty, 0))}</td>
                  <td>${fmtMoney(parseNum(b.costPrice, 0))}</td>
                  <td>${fmtMoney(parseNum(b.value, 0))}</td>
                  <td>${b.onSale ? '<span class="badge warn">В акции</span>' : "—"}</td>
                  <td>
                    <div class="wh-row-actions">
                      <button type="button" class="btn-ghost btn-sm" data-wh-writeoff="${escapeAttr(b.id)}">Списать</button>
                      <button type="button" class="btn-ghost btn-sm" data-wh-onsale="${escapeAttr(b.id)}" data-wh-onsale-val="${b.onSale ? "1" : "0"}">${b.onSale ? "Убрать" : "В акцию"}</button>
                    </div>
                  </td>
                </tr>
              `;
            })
            .join("");

          return header + batchRows;
        })
        .join("")
    : `<tr><td colspan="8"><div class="wh-empty-row">Пока нет партий и остатков.</div></td></tr>`;

  return `
    <section class="wh-card">
      <div class="wh-toolbar wh-toolbar-stock">
        <label>
          Сортировка
          <select id="whStockSort">
            <option value="expiry" ${state.stockSort === "expiry" ? "selected" : ""}>По сроку (ASC)</option>
            <option value="qty" ${state.stockSort === "qty" ? "selected" : ""}>По остатку</option>
            <option value="value" ${state.stockSort === "value" ? "selected" : ""}>По стоимости</option>
          </select>
        </label>
        <label class="wh-checkbox">
          <input type="checkbox" id="whStockArchived" ${state.includeArchivedStock ? "checked" : ""}>
          Показать архивные партии
        </label>
      </div>

      <div class="wh-table-wrap">
        <table class="wh-table wh-table-stock">
          <thead>
            <tr>
              <th>Партия</th>
              <th>Срок</th>
              <th>До истечения</th>
              <th>Остаток</th>
              <th>Закупка</th>
              <th>Стоимость</th>
              <th>Маркер</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderMovementsSection() {
  const movements = listStockMovements({
    type: state.movementsType,
    days: parseNum(state.movementsDays, 0),
  });

  const products = listProducts({ includeArchived: true });
  const productMap = new Map(products.map((p) => [p.id, p]));
  const batchMap = new Map();
  listStockRows({ includeArchived: true }).forEach((row) => {
    row.batches.forEach((b) => batchMap.set(b.id, b));
  });
  const employeeMap = new Map(listEmployees().map((e) => [e.id, e]));

  const body = movements.length
    ? movements
        .map((m) => {
          const product = productMap.get(m.productId);
          const batch = m.batchId ? batchMap.get(m.batchId) : null;
          const user = m.userId ? employeeMap.get(m.userId) : null;
          return `
            <tr>
              <td>${fmtDateTime(m.ts || m.createdAt)}</td>
              <td>
                <div>${escape(product?.name || "—")}</div>
                <div class="wh-td-sub">${escape(product?.sku || "")}</div>
              </td>
              <td>${escape(batch?.batchNumber || "—")}</td>
              <td>${movementTypeLabel(m.type)}</td>
              <td>${new Intl.NumberFormat("ru-RU").format(parseNum(m.qty, 0))}</td>
              <td>${escape(movementReasonLabel(m.reason))}</td>
              <td>${escape(user?.name || "—")}</td>
              <td>${m.dealId ? `<a href="#crm/${escapeAttr(m.dealId)}">Открыть</a>` : "—"}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="8"><div class="wh-empty-row">Движений по выбранным фильтрам нет.</div></td></tr>`;

  return `
    <section class="wh-card">
      <div class="wh-toolbar wh-toolbar-stock">
        <label>
          Тип
          <select id="whMovType">
            <option value="all" ${state.movementsType === "all" ? "selected" : ""}>Все</option>
            <option value="in" ${state.movementsType === "in" ? "selected" : ""}>Приход</option>
            <option value="out" ${state.movementsType === "out" ? "selected" : ""}>Расход</option>
            <option value="writeoff" ${state.movementsType === "writeoff" ? "selected" : ""}>Списание</option>
            <option value="adjust" ${state.movementsType === "adjust" ? "selected" : ""}>Корректировка</option>
          </select>
        </label>
        <label>
          Период
          <select id="whMovDays">
            <option value="7" ${state.movementsDays === "7" ? "selected" : ""}>7 дней</option>
            <option value="30" ${state.movementsDays === "30" ? "selected" : ""}>30 дней</option>
            <option value="90" ${state.movementsDays === "90" ? "selected" : ""}>90 дней</option>
            <option value="0" ${state.movementsDays === "0" ? "selected" : ""}>Всё время</option>
          </select>
        </label>
      </div>

      <div class="wh-table-wrap">
        <table class="wh-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Товар</th>
              <th>Партия</th>
              <th>Тип</th>
              <th>Кол-во</th>
              <th>Причина</th>
              <th>Кто</th>
              <th>Сделка</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderProductBatchesTab(product) {
  if (!product?.id) {
    return `<div class="wh-side-empty">Сначала сохрани карточку товара, затем добавляй партии.</div>`;
  }

  const batches = listBatchesForProduct(product.id, { includeArchived: state.includeArchivedProductBatches });
  const rows = batches.length
    ? batches
        .map((b) => {
          const days = daysLeftByIso(b.expiryDate);
          const cls = batchExpiryClass(days);
          return `
            <tr class="${cls}">
              <td>${escape(b.batchNumber || "—")}</td>
              <td>${fmtDateIso(b.expiryDate)}</td>
              <td>${new Intl.NumberFormat("ru-RU").format(parseNum(b.qty, 0))}</td>
              <td>${fmtMoney(parseNum(b.costPrice, 0))}</td>
              <td>${escape(b.supplierName || "—")}</td>
              <td>
                <div class="wh-row-actions">
                  <button type="button" class="btn-ghost btn-sm" data-wh-writeoff="${escapeAttr(b.id)}">Списать</button>
                  <button type="button" class="btn-ghost btn-sm" data-wh-adjust="${escapeAttr(b.id)}">Корр.</button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="6"><div class="wh-empty-row">Пока нет партий.</div></td></tr>`;

  return `
    <div class="wh-side-head">
      <button type="button" class="btn-primary btn-sm" id="whOpenBatchForm">${ICONS.plus}<span>Партия</span></button>
      <label class="wh-checkbox">
        <input type="checkbox" id="whProductArchived" ${state.includeArchivedProductBatches ? "checked" : ""}>
        Показать архивные
      </label>
    </div>

    ${state.batchFormOpen ? `
      <form id="whBatchForm" class="wh-inline-form">
        <div class="wh-inline-grid">
          <div class="field"><label>Номер партии *</label><input name="batchNumber" required placeholder="B-1098"></div>
          <div class="field"><label>Срок годности${product.trackBatches ? " *" : ""}</label><input type="date" name="expiryDate" ${product.trackBatches ? "required" : ""}></div>
          <div class="field"><label>Дата производства</label><input type="date" name="manufactureDate"></div>
          <div class="field"><label>Дата прихода</label><input type="date" name="receivedAt" value="${new Date().toISOString().slice(0, 10)}"></div>
          <div class="field"><label>Кол-во *</label><input name="initialQty" type="number" min="0" step="1" value="0" required></div>
          <div class="field"><label>Цена закупки</label><input name="costPrice" type="number" min="0" step="0.01" value="${escapeAttr(product.costPrice || 0)}"></div>
          <div class="field field-wide"><label>Поставщик</label><input name="supplierName" placeholder="Медтехсервис"></div>
          <div class="field field-wide"><label>Комментарий</label><input name="note" placeholder="Комментарий к партии"></div>
        </div>
        <div class="wh-inline-actions">
          <button type="button" class="btn-ghost" id="whCancelBatchForm">Отмена</button>
          <button type="submit" class="btn">Добавить партию</button>
        </div>
      </form>
    ` : ""}

    <div class="wh-side-table-wrap">
      <table class="wh-side-table">
        <thead>
          <tr>
            <th>Партия</th>
            <th>Срок</th>
            <th>Остаток</th>
            <th>Закупка</th>
            <th>Поставщик</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderProductMovementsTab(product) {
  if (!product?.id) {
    return `<div class="wh-side-empty">Сохрани товар, чтобы видеть движения.</div>`;
  }

  const movements = listStockMovements({ type: "all", days: 0 }).filter((m) => m.productId === product.id);
  const batchMap = new Map(listBatchesForProduct(product.id, { includeArchived: true }).map((b) => [b.id, b]));
  const employeeMap = new Map(listEmployees().map((e) => [e.id, e]));

  const body = movements.length
    ? movements
        .slice(0, 150)
        .map((m) => {
          const b = m.batchId ? batchMap.get(m.batchId) : null;
          const u = m.userId ? employeeMap.get(m.userId) : null;
          return `
            <tr>
              <td>${fmtDateTime(m.ts || m.createdAt)}</td>
              <td>${escape(b?.batchNumber || "—")}</td>
              <td>${escape(movementTypeLabel(m.type))}</td>
              <td>${new Intl.NumberFormat("ru-RU").format(parseNum(m.qty, 0))}</td>
              <td>${escape(movementReasonLabel(m.reason))}</td>
              <td>${escape(u?.name || "—")}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="6"><div class="wh-empty-row">Движений пока нет.</div></td></tr>`;

  return `
    <div class="wh-side-table-wrap">
      <table class="wh-side-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Партия</th>
            <th>Тип</th>
            <th>Кол-во</th>
            <th>Причина</th>
            <th>Кто</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function renderSaveHint() {
  if (state.saveState === "saving") return "Сохранение...";
  if (state.saveState === "saved") return "Сохранено";
  if (state.saveState === "error") return "Ошибка сохранения";
  return "Сохранение по кнопке";
}

function renderProductModal(productIdRaw) {
  const isNew = !productIdRaw || productIdRaw === "new";
  const product = isNew ? null : getProduct(productIdRaw);

  if (!isNew && !product) {
    return `
      <div class="modal-backdrop" id="whModalBackdrop">
        <div class="modal" role="dialog" aria-modal="true">
          <header class="modal-header"><h2>Товар не найден</h2><button type="button" class="btn-ghost icon-only" id="whCloseModal">${ICONS.x}</button></header>
          <div class="placeholder"><div class="placeholder-icon">${ICONS.warehouse || ICONS.tasks}</div><h3>Запись удалена или недоступна</h3><p>Обнови страницу или выбери товар из списка.</p></div>
        </div>
      </div>
    `;
  }

  const model = product || {
    sku: "",
    barcode: "",
    name: "",
    categoryId: "",
    unit: "шт.",
    costPrice: 0,
    sellPrice: 0,
    minStock: 0,
    trackBatches: true,
    regNumber: "",
    regExpiry: "",
    description: "",
  };

  const summary = product?.id ? stockSummary(product.id) : { total: 0 };
  const categories = listProductCategories();
  const tab = state.productTab === "movements" ? "movements" : "batches";

  return `
    <div class="modal-backdrop" id="whModalBackdrop">
      <div class="modal modal-xl" role="dialog" aria-modal="true">
        <header class="modal-header">
          <div class="deal-head-main">
            ${product?.id ? `<div class="deal-meta-line">SKU ${escape(model.sku || "—")} · Остаток ${new Intl.NumberFormat("ru-RU").format(summary.total || 0)}</div>` : ""}
            <h2>${isNew ? "Новый товар" : escape(model.name || "Товар")}</h2>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-ghost icon-only" id="whCloseModal" aria-label="Закрыть">${ICONS.x}</button>
          </div>
        </header>

        <div class="deal-modal-body wh-product-modal-body">
          <div class="deal-form-col wh-form-col">
            <form id="whProductForm" class="form-grid" data-id="${escapeAttr(product?.id || "")}">
              <div class="field"><label>Артикул (SKU) *</label><input name="sku" required value="${escapeAttr(model.sku)}" placeholder="SKU-001247"></div>
              <div class="field"><label>Штрихкод</label><input name="barcode" value="${escapeAttr(model.barcode || "")}" placeholder="4607010691234"></div>
              <div class="field field-wide"><label>Название *</label><input name="name" required value="${escapeAttr(model.name || "")}" placeholder="Пластырь..."></div>
              <div class="field"><label>Категория</label>
                <select name="categoryId">
                  <option value="">—</option>
                  ${categories.map((c) => `<option value="${escapeAttr(c.id)}" ${model.categoryId === c.id ? "selected" : ""}>${escape(c.name)}</option>`).join("")}
                </select>
              </div>
              <div class="field"><label>Ед. измерения</label><input name="unit" value="${escapeAttr(model.unit || "шт.")}" placeholder="шт."></div>
              <div class="field"><label>Цена закупки</label><input name="costPrice" type="number" min="0" step="0.01" value="${escapeAttr(model.costPrice || 0)}"></div>
              <div class="field"><label>Цена продажи</label><input name="sellPrice" type="number" min="0" step="0.01" value="${escapeAttr(model.sellPrice || 0)}"></div>
              <div class="field"><label>Мин. остаток</label><input name="minStock" type="number" min="0" step="1" value="${escapeAttr(model.minStock || 0)}"></div>
              <label class="wh-checkbox wh-checkbox-block">
                <input name="trackBatches" type="checkbox" ${model.trackBatches ? "checked" : ""}>
                Учитывать партии
              </label>
              <div class="field"><label>Номер РУ</label><input name="regNumber" value="${escapeAttr(model.regNumber || "")}" placeholder="КЗ.05.07.2022"></div>
              <div class="field"><label>Срок действия РУ</label><input name="regExpiry" type="date" value="${escapeAttr(model.regExpiry || "")}"></div>
              <div class="field field-wide"><label>Описание</label><textarea name="description" rows="3" placeholder="Комментарий по товару">${escape(model.description || "")}</textarea></div>
              <div class="field field-wide wh-form-buttons">
                ${product?.id ? `<button type="button" class="btn-ghost danger" id="whArchiveProduct">${ICONS.trash}<span>Архивировать</span></button>` : "<span></span>"}
                <button type="submit" class="btn">${isNew ? "Создать товар" : "Сохранить"}</button>
              </div>
            </form>
          </div>

          <div class="deal-timeline-col wh-side-col">
            <div class="timeline-tabs wh-side-tabs">
              <button type="button" class="tlb-btn ${tab === "batches" ? "active" : ""}" data-wh-ptab="batches">Партии</button>
              <button type="button" class="tlb-btn ${tab === "movements" ? "active" : ""}" data-wh-ptab="movements">Движения</button>
            </div>
            <div class="wh-side-content">
              ${tab === "batches" ? renderProductBatchesTab(product) : renderProductMovementsTab(product)}
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <div class="wh-modal-foot-note">${product?.id ? "Изменения по партиям пишутся в журнал автоматически." : "После сохранения карточки можно добавлять партии."}</div>
          <div class="modal-footer-right">
            <span class="deal-autosave-hint" data-state="${escapeAttr(state.saveState)}">${escape(renderSaveHint())}</span>
          </div>
        </footer>
      </div>
    </div>
  `;
}

function renderBody(tab) {
  if (tab === "stock") return renderStockSection();
  if (tab === "movements") return renderMovementsSection();
  return renderProductsSection();
}

export function renderWarehouse(container) {
  normalizeWarehouseHash();
  seedWarehouseDemo();

  const parsed = parseHash();
  if (parsed.query.get("tab") === "movements") state.productTab = "movements";
  if (parsed.query.get("tab") === "batches") state.productTab = "batches";

  container.innerHTML = `
    <div class="wh-view">
      ${renderTop(parsed.tab)}
      ${renderBody(parsed.tab)}
      ${parsed.tab === "products" && parsed.productId ? renderProductModal(parsed.productId) : ""}
    </div>
  `;

  wireEvents(container, parsed);
}

function withTry(fn) {
  try {
    fn();
  } catch (e) {
    alert(e?.message || String(e));
  }
}

function writeOffFlow(batchId) {
  const amountRaw = prompt("Сколько списать?", "1");
  if (amountRaw == null) return;
  const qty = parseNum(amountRaw, 0);
  if (qty <= 0) return alert("Количество должно быть больше нуля");

  const reasonRaw = prompt("Причина (expired / damaged / manual)", "expired");
  if (reasonRaw == null) return;
  const reason = String(reasonRaw || "expired").trim() || "expired";

  const note = prompt("Комментарий", "") || "";
  writeOffBatch(batchId, qty, reason, note);
}

function adjustFlow(batchId) {
  const nextRaw = prompt("Новый остаток партии", "0");
  if (nextRaw == null) return;
  const newQty = parseNum(nextRaw, 0);
  if (newQty < 0) return alert("Остаток не может быть отрицательным");
  const note = prompt("Комментарий к корректировке", "") || "";
  adjustBatch(batchId, newQty, note);
}

function readProductFormData(form) {
  const fd = new FormData(form);
  const id = form.dataset.id || null;
  return {
    id: id || undefined,
    sku: String(fd.get("sku") || "").trim(),
    barcode: String(fd.get("barcode") || "").trim(),
    name: String(fd.get("name") || "").trim(),
    categoryId: String(fd.get("categoryId") || "").trim(),
    unit: String(fd.get("unit") || "").trim() || "шт.",
    costPrice: parseNum(fd.get("costPrice"), 0),
    sellPrice: parseNum(fd.get("sellPrice"), 0),
    minStock: Math.max(0, parseNum(fd.get("minStock"), 0)),
    trackBatches: fd.get("trackBatches") === "on",
    regNumber: String(fd.get("regNumber") || "").trim(),
    regExpiry: String(fd.get("regExpiry") || "").trim(),
    description: String(fd.get("description") || "").trim(),
  };
}

function readBatchFormData(form) {
  const fd = new FormData(form);
  const qty = Math.max(0, parseNum(fd.get("initialQty"), 0));
  return {
    batchNumber: String(fd.get("batchNumber") || "").trim(),
    expiryDate: String(fd.get("expiryDate") || "").trim(),
    manufactureDate: String(fd.get("manufactureDate") || "").trim(),
    receivedAt: String(fd.get("receivedAt") || "").trim(),
    initialQty: qty,
    qty,
    costPrice: Math.max(0, parseNum(fd.get("costPrice"), 0)),
    supplierName: String(fd.get("supplierName") || "").trim(),
    note: String(fd.get("note") || "").trim(),
  };
}

function wireEvents(container, parsed) {
  container.querySelector("#whNewProduct")?.addEventListener("click", () => {
    openNewProduct();
  });

  container.querySelector("#whSearch")?.addEventListener("input", (e) => {
    state.search = e.target.value || "";
    state.page = 1;
    renderWarehouse(container);
  });

  container.querySelector("#whCategory")?.addEventListener("change", (e) => {
    state.categoryId = e.target.value || "";
    state.page = 1;
    renderWarehouse(container);
  });

  container.querySelector("#whStockStatus")?.addEventListener("change", (e) => {
    state.stockStatus = e.target.value || "all";
    state.page = 1;
    renderWarehouse(container);
  });

  container.querySelector("#whExpiringBadge")?.addEventListener("click", () => {
    state.expiringOnly = !state.expiringOnly;
    state.page = 1;
    renderWarehouse(container);
  });

  container.querySelector("#whPrev")?.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    renderWarehouse(container);
  });

  container.querySelector("#whNext")?.addEventListener("click", () => {
    state.page += 1;
    renderWarehouse(container);
  });

  container.querySelectorAll("[data-wh-open]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.whOpen;
      if (!id) return;
      openProduct(id);
    });
  });

  container.querySelector("#whStockSort")?.addEventListener("change", (e) => {
    state.stockSort = e.target.value || "expiry";
    renderWarehouse(container);
  });

  container.querySelector("#whStockArchived")?.addEventListener("change", (e) => {
    state.includeArchivedStock = Boolean(e.target.checked);
    renderWarehouse(container);
  });

  container.querySelector("#whMovType")?.addEventListener("change", (e) => {
    state.movementsType = e.target.value || "all";
    renderWarehouse(container);
  });

  container.querySelector("#whMovDays")?.addEventListener("change", (e) => {
    state.movementsDays = e.target.value || "30";
    renderWarehouse(container);
  });

  container.querySelector("#whCloseModal")?.addEventListener("click", () => {
    state.batchFormOpen = false;
    state.saveState = "idle";
    closeProductModal();
  });

  container.querySelector("#whModalBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id !== "whModalBackdrop") return;
    state.batchFormOpen = false;
    state.saveState = "idle";
    closeProductModal();
  });

  container.querySelectorAll("[data-wh-ptab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.productTab = btn.dataset.whPtab === "movements" ? "movements" : "batches";
      renderWarehouse(container);
    });
  });

  container.querySelector("#whOpenBatchForm")?.addEventListener("click", () => {
    state.batchFormOpen = true;
    renderWarehouse(container);
  });

  container.querySelector("#whCancelBatchForm")?.addEventListener("click", () => {
    state.batchFormOpen = false;
    renderWarehouse(container);
  });

  container.querySelector("#whProductArchived")?.addEventListener("change", (e) => {
    state.includeArchivedProductBatches = Boolean(e.target.checked);
    renderWarehouse(container);
  });

  container.querySelector("#whBatchForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const targetId = parsed.productId && parsed.productId !== "new" ? parsed.productId : null;
    if (!targetId) return alert("Сначала сохрани карточку товара");

    withTry(() => {
      addBatch(targetId, readBatchFormData(e.target));
      state.batchFormOpen = false;
      state.productTab = "batches";
      renderWarehouse(container);
    });
  });

  container.querySelectorAll("[data-wh-writeoff]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      withTry(() => {
        writeOffFlow(btn.dataset.whWriteoff);
        renderWarehouse(container);
      });
    });
  });

  container.querySelectorAll("[data-wh-adjust]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      withTry(() => {
        adjustFlow(btn.dataset.whAdjust);
        renderWarehouse(container);
      });
    });
  });

  container.querySelectorAll("[data-wh-onsale]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      withTry(() => {
        const next = btn.dataset.whOnsaleVal !== "1";
        setBatchOnSale(btn.dataset.whOnsale, next);
        renderWarehouse(container);
      });
    });
  });

  container.querySelector("#whArchiveProduct")?.addEventListener("click", () => {
    const targetId = parsed.productId && parsed.productId !== "new" ? parsed.productId : null;
    if (!targetId) return;
    if (!confirm("Архивировать товар?")) return;

    withTry(() => {
      archiveProduct(targetId);
      state.batchFormOpen = false;
      state.saveState = "idle";
      closeProductModal();
    });
  });

  container.querySelector("#whProductForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      state.saveState = "saving";
      const saved = saveProduct(readProductFormData(form));
      state.saveState = "saved";
      state.batchFormOpen = false;
      if (saved?.id && parsed.productId !== saved.id) {
        openProduct(saved.id);
        return;
      }
      renderWarehouse(container);
      setTimeout(() => {
        if (!container.isConnected) return;
        state.saveState = "idle";
        renderWarehouse(container);
      }, 1200);
    } catch (err) {
      state.saveState = "error";
      renderWarehouse(container);
      alert(err?.message || String(err));
    }
  });
}
