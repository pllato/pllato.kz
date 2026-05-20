// Pllato CRM — Состав заказа в сделке + предварительный заказ для склада.
// Этап 1.5: статус заказа (draft → preliminary), submit/recall, поиск товара.
// Следующий этап: согласование на складе → автосписание через warehouse_document.

import { Store } from "./store.js";
import { listWarehouseProducts, getWarehouseProduct, productSummary } from "./warehouse.js";
import { currentEmployee } from "./employees.js";
import { ICONS } from "./icons.js";

const ITEMS = "deal_items";
const DEALS = "deals";

export const ORDER_STATUS_DRAFT = "draft";
export const ORDER_STATUS_PRELIMINARY = "preliminary";

// === API: Позиции ===

export function listDealItems(dealId) {
  return Store.list(ITEMS)
    .filter((x) => x.dealId === dealId)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

export function createDealItem(dealId, payload = {}) {
  const product = payload.productId ? getWarehouseProduct(payload.productId) : null;
  const qty = Number(payload.qty) || 0;
  const unitPrice = Number(payload.unitPrice) || 0;
  return Store.create(ITEMS, {
    dealId,
    productId: payload.productId || null,
    productSku: product?.sku || "",
    productName: product?.name || "",
    unit: product?.unit || "шт",
    qty,
    unitPrice,
    lineAmount: qty * unitPrice,
  });
}

export function updateDealItem(id, patch = {}) {
  const item = Store.get(ITEMS, id);
  if (!item) return null;
  const next = { ...patch };
  if (patch.productId !== undefined && patch.productId !== item.productId) {
    const product = patch.productId ? getWarehouseProduct(patch.productId) : null;
    next.productSku = product?.sku || "";
    next.productName = product?.name || "";
    next.unit = product?.unit || "шт";
  }
  if (patch.qty !== undefined || patch.unitPrice !== undefined) {
    const qty = patch.qty !== undefined ? Number(patch.qty) || 0 : item.qty;
    const unitPrice = patch.unitPrice !== undefined ? Number(patch.unitPrice) || 0 : item.unitPrice;
    next.qty = qty;
    next.unitPrice = unitPrice;
    next.lineAmount = qty * unitPrice;
  }
  return Store.update(ITEMS, id, next);
}

export function removeDealItem(id) {
  return Store.remove(ITEMS, id);
}

export function removeAllDealItemsForDeal(dealId) {
  listDealItems(dealId).forEach((x) => Store.remove(ITEMS, x.id));
}

export function dealItemsTotal(dealId) {
  return listDealItems(dealId).reduce((sum, x) => sum + (Number(x.lineAmount) || 0), 0);
}

// === API: Статус заказа ===

export function getDealOrderStatus(deal) {
  return deal?.orderStatus || ORDER_STATUS_DRAFT;
}

export function isOrderEditable(deal) {
  return getDealOrderStatus(deal) === ORDER_STATUS_DRAFT;
}

export function submitDealOrder(dealId) {
  const me = currentEmployee();
  const items = listDealItems(dealId);
  if (items.length === 0) throw new Error("Заказ пуст — добавь хотя бы одну позицию");
  return Store.update(DEALS, dealId, {
    orderStatus: ORDER_STATUS_PRELIMINARY,
    orderSubmittedAt: Date.now(),
    orderSubmittedBy: me?.id || null,
    orderSubmittedByName: me?.name || me?.email || "",
  });
}

export function recallDealOrder(dealId) {
  return Store.update(DEALS, dealId, {
    orderStatus: ORDER_STATUS_DRAFT,
    orderRecalledAt: Date.now(),
  });
}

export function listPreliminaryDealOrders() {
  return Store.list(DEALS)
    .filter((d) => d.orderStatus === ORDER_STATUS_PRELIMINARY && !d.isDeleted)
    .sort((a, b) => (b.orderSubmittedAt || 0) - (a.orderSubmittedAt || 0));
}

// === Render ===

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(s) { return escapeHtml(s); }

function fmtNum(n) {
  return new Intl.NumberFormat("ru-RU").format(Number(n) || 0);
}

function fmtDateTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function productLabel(product) {
  if (!product) return "";
  return `${product.sku || "—"} · ${product.name || ""}`;
}

function renderItemRow(item, products, editable) {
  const product = item.productId ? products.find((p) => p.id === item.productId) : null;
  const summary = item.productId ? productSummary(item.productId) : null;
  const stock = summary?.total || 0;
  const shortage = item.qty > stock && item.productId;
  const stockClass = !item.productId ? "" : (shortage ? "stock-low" : "stock-ok");
  const stockLabel = !item.productId ? "—" : `${fmtNum(stock)} ${escapeHtml(item.unit || "шт")}`;
  const inputDisabled = editable ? "" : "disabled";

  // Typeahead на товар: input + dropdown с фильтрацией
  const initialLabel = product ? productLabel(product) : "";

  return `
    <tr data-deal-item-id="${escapeAttr(item.id)}">
      <td class="dis-product">
        <div class="dis-typeahead" data-item-id="${escapeAttr(item.id)}">
          <input type="text" class="dis-ta-input" placeholder="Поиск товара…"
                 value="${escapeAttr(initialLabel)}"
                 data-deal-item-typeahead="${escapeAttr(item.id)}"
                 ${inputDisabled}
                 autocomplete="off">
          <div class="dis-ta-list" data-deal-item-list="${escapeAttr(item.id)}" hidden></div>
        </div>
      </td>
      <td class="dis-stock ${stockClass}" title="${shortage ? "Недостаточно на складе" : "Остаток на складе"}">
        ${stockLabel}
      </td>
      <td class="num">
        <input type="number" min="0" step="1" value="${escapeAttr(item.qty)}"
               data-deal-item-field="qty" data-id="${escapeAttr(item.id)}" ${inputDisabled}>
      </td>
      <td class="num">
        <input type="number" min="0" step="100" value="${escapeAttr(item.unitPrice)}"
               data-deal-item-field="unitPrice" data-id="${escapeAttr(item.id)}" ${inputDisabled}>
      </td>
      <td class="num dis-amount">${fmtNum(item.lineAmount)} ₸</td>
      <td class="dis-actions">
        ${editable ? `<button type="button" class="btn-ghost btn-icon btn-sm" data-deal-item-remove data-id="${escapeAttr(item.id)}" title="Удалить позицию">${ICONS.x}</button>` : ""}
      </td>
    </tr>
  `;
}

function renderStatusBanner(deal) {
  const status = getDealOrderStatus(deal);
  if (status === ORDER_STATUS_PRELIMINARY) {
    const ts = deal.orderSubmittedAt ? fmtDateTime(deal.orderSubmittedAt) : "";
    const by = deal.orderSubmittedByName ? ` · ${escapeHtml(deal.orderSubmittedByName)}` : "";
    return `
      <div class="dis-banner dis-banner-preliminary">
        <div class="dis-banner-icon">📦</div>
        <div class="dis-banner-text">
          <strong>Предварительный заказ отправлен на склад</strong>
          <div class="dis-banner-meta">${ts}${by}</div>
        </div>
        <button type="button" class="btn-ghost btn-sm" data-deal-order-recall>↩ Вернуть в черновик</button>
      </div>
    `;
  }
  return "";
}

function renderActionButtons(deal, items, editable) {
  const status = getDealOrderStatus(deal);
  if (status === ORDER_STATUS_DRAFT) {
    const canSubmit = items.length > 0;
    return `
      <div class="dis-actions-bar">
        <button type="button" class="btn-ghost btn-sm" data-deal-items-add>${ICONS.plus}<span>Позиция</span></button>
        <div class="dis-spacer"></div>
        <button type="button" class="btn-primary btn-sm" data-deal-order-submit ${canSubmit ? "" : "disabled"}>
          📤 Сформировать заказ
        </button>
      </div>
    `;
  }
  // Для preliminary действия скрыты — только в баннере recall
  return "";
}

export function renderDealItemsSection(dealId) {
  const deal = Store.get(DEALS, dealId);
  if (!deal) return "";
  const items = listDealItems(dealId);
  const total = dealItemsTotal(dealId);
  const products = listWarehouseProducts({ includeArchived: false });
  const status = getDealOrderStatus(deal);
  const editable = isOrderEditable(deal);
  const amountDiff = Math.abs((Number(deal.amount) || 0) - total);
  const showAmountMismatch = items.length > 0 && amountDiff > 0.5 && status === ORDER_STATUS_DRAFT;

  const statusBadge = status === ORDER_STATUS_PRELIMINARY
    ? `<span class="dis-status-badge preliminary">Предварительный заказ</span>`
    : `<span class="dis-status-badge draft">Черновик</span>`;

  return `
    <div class="field field-wide deal-items-panel" data-deal-items data-deal-id="${escapeAttr(dealId)}">
      <div class="dip-header">
        <div class="dip-title">
          ${ICONS.package || "📦"} <strong>Состав заказа</strong>
          ${statusBadge}
        </div>
        <div class="dip-summary">
          ${items.length} ${items.length === 1 ? "позиция" : (items.length >= 2 && items.length <= 4 ? "позиции" : "позиций")} ·
          <strong class="dip-total">${fmtNum(total)} ₸</strong>
        </div>
      </div>

      ${renderStatusBanner(deal)}

      ${items.length === 0 ? `
        <div class="dis-empty">
          ${editable
            ? `Заказ пуст. Нажми «+ Позиция» чтобы добавить товар со склада (поиск по SKU или названию).`
            : `Заказ пуст.`}
        </div>
      ` : `
        <div class="dis-table-wrap">
          <table class="dis-table">
            <thead>
              <tr>
                <th class="th-product">Товар</th>
                <th class="th-stock">Остаток</th>
                <th class="num th-qty">Кол-во</th>
                <th class="num th-price">Цена, ₸</th>
                <th class="num th-amount">Сумма</th>
                <th class="th-actions"></th>
              </tr>
            </thead>
            <tbody data-deal-items-body>
              ${items.map((item) => renderItemRow(item, products, editable)).join("")}
            </tbody>
          </table>
        </div>
        ${showAmountMismatch ? `
          <div class="dis-warning">
            ⚠ Итог заказа (${fmtNum(total)} ₸) отличается от суммы сделки (${fmtNum(deal.amount)} ₸) на ${fmtNum(amountDiff)} ₸.
          </div>
        ` : ""}
      `}

      ${renderActionButtons(deal, items, editable)}
    </div>
  `;
}

// === Typeahead ===

function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function filterProductsByQuery(products, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return products.slice(0, 50);
  return products
    .filter((p) => {
      const sku = String(p.sku || "").toLowerCase();
      const name = String(p.name || "").toLowerCase();
      return sku.includes(q) || name.includes(q);
    })
    .slice(0, 50);
}

function renderProductOptions(products, query) {
  const filtered = filterProductsByQuery(products, query);
  if (filtered.length === 0) {
    return `<div class="dis-ta-empty">Ничего не найдено</div>`;
  }
  return filtered.map((p) => {
    const summary = productSummary(p.id);
    const stock = summary?.total || 0;
    return `
      <div class="dis-ta-item" data-product-id="${escapeAttr(p.id)}" role="option">
        <div class="dis-ta-item-main">
          <span class="dis-ta-sku">${escapeHtml(p.sku || "—")}</span>
          <span class="dis-ta-name">${escapeHtml(p.name)}</span>
        </div>
        <div class="dis-ta-item-stock">${fmtNum(stock)} ${escapeHtml(p.unit || "шт")}</div>
      </div>
    `;
  }).join("");
}

function setupTypeahead(input, list, products, onSelect) {
  let openList = null;

  const open = () => {
    list.hidden = false;
    list.innerHTML = renderProductOptions(products, input.value);
    bindItems();
    openList = list;
  };

  const close = () => {
    list.hidden = true;
    openList = null;
  };

  const bindItems = () => {
    list.querySelectorAll(".dis-ta-item").forEach((el) => {
      el.addEventListener("mousedown", (e) => {
        // mousedown а не click чтобы сработать ДО blur
        e.preventDefault();
        const productId = el.dataset.productId;
        const product = products.find((p) => p.id === productId);
        if (product) {
          input.value = productLabel(product);
          onSelect(productId);
        }
        close();
      });
    });
  };

  input.addEventListener("focus", open);
  input.addEventListener("input", () => {
    list.innerHTML = renderProductOptions(products, input.value);
    bindItems();
    list.hidden = false;
  });
  input.addEventListener("blur", () => {
    // Небольшая задержка чтобы click по элементу успел сработать
    setTimeout(close, 150);
  });
  // Escape — закрыть
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      close();
      input.blur();
    }
  });
}

// === Handlers ===

function refreshSection(container, dealId) {
  const section = container.querySelector("[data-deal-items]");
  if (!section) return;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderDealItemsSection(dealId);
  const fresh = wrapper.firstElementChild;
  if (fresh) {
    section.replaceWith(fresh);
    attachDealItemsHandlers(container, dealId);
  }
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function attachDealItemsHandlers(container, dealId) {
  const section = container.querySelector("[data-deal-items]");
  if (!section) return;
  const products = listWarehouseProducts({ includeArchived: false });

  // Кнопка "+ Позиция"
  section.querySelector("[data-deal-items-add]")?.addEventListener("click", (e) => {
    e.preventDefault();
    createDealItem(dealId, {});
    refreshSection(container, dealId);
  });

  // Удаление позиции
  section.querySelectorAll("[data-deal-item-remove]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      if (!id) return;
      removeDealItem(id);
      refreshSection(container, dealId);
    });
  });

  // Typeahead на каждой строке
  section.querySelectorAll(".dis-typeahead").forEach((wrap) => {
    const itemId = wrap.dataset.itemId;
    const input = wrap.querySelector(".dis-ta-input");
    const list = wrap.querySelector(".dis-ta-list");
    if (!input || !list || !itemId) return;
    setupTypeahead(input, list, products, (productId) => {
      updateDealItem(itemId, { productId });
      refreshSection(container, dealId);
    });
  });

  // Изменение qty/unitPrice — debounced
  const updateAmounts = (input) => {
    const id = input.dataset.id;
    const item = Store.get(ITEMS, id);
    if (!item) return;
    const row = input.closest("tr");
    if (row) {
      const amountCell = row.querySelector(".dis-amount");
      if (amountCell) amountCell.textContent = `${fmtNum(item.lineAmount)} ₸`;
    }
    const totalEl = section.querySelector(".dip-total");
    if (totalEl) totalEl.textContent = `${fmtNum(dealItemsTotal(dealId))} ₸`;
  };

  const onNum = debounce((input) => {
    const id = input.dataset.id;
    const field = input.dataset.dealItemField;
    if (!id || !field) return;
    const value = Number(input.value) || 0;
    updateDealItem(id, { [field]: value });
    updateAmounts(input);
  }, 250);

  section.querySelectorAll('input[data-deal-item-field="qty"], input[data-deal-item-field="unitPrice"]')
    .forEach((input) => input.addEventListener("input", () => onNum(input)));

  // Submit order
  section.querySelector("[data-deal-order-submit]")?.addEventListener("click", (e) => {
    e.preventDefault();
    try {
      submitDealOrder(dealId);
      refreshSection(container, dealId);
    } catch (err) {
      alert(err?.message || "Не удалось сформировать заказ");
    }
  });

  // Recall order
  section.querySelector("[data-deal-order-recall]")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!confirm("Вернуть заказ в черновик? Со склада он исчезнет из предварительных заказов.")) return;
    recallDealOrder(dealId);
    refreshSection(container, dealId);
  });
}
