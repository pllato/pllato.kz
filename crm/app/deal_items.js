// Pllato CRM — Состав заказа в сделке (модалка) + предварительный заказ для склада.
// UI: компактный summary в карточке сделки → клик «Открыть» → отдельная модалка с таблицей.
// Статусы: draft (черновик) → preliminary (отправлен на склад).

import { Store } from "./store.js";
import { listWarehouseProducts, getWarehouseProduct, productSummary } from "./warehouse.js";
import { currentEmployee } from "./employees.js";

const ITEMS = "deal_items";
const DEALS = "deals";

export const ORDER_STATUS_DRAFT = "draft";
export const ORDER_STATUS_PRELIMINARY = "preliminary";

// State модалки (один заказ в один момент времени)
const modalState = {
  dealId: null,
  mountEl: null, // элемент модалки в DOM, либо null
};

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

// === Утилиты ===

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

function statusBadgeHtml(status) {
  if (status === ORDER_STATUS_PRELIMINARY) {
    return `<span class="dis-status-badge preliminary">Предварительный заказ</span>`;
  }
  return `<span class="dis-status-badge draft">Черновик</span>`;
}

// === RENDER: Компактный summary в карточке сделки ===

export function renderDealItemsSection(dealId) {
  const deal = Store.get(DEALS, dealId);
  if (!deal) return "";
  const items = listDealItems(dealId);
  const total = dealItemsTotal(dealId);
  const status = getDealOrderStatus(deal);
  const itemsWord = items.length === 1 ? "позиция" : (items.length >= 2 && items.length <= 4 ? "позиции" : "позиций");
  const amountDiff = Math.abs((Number(deal.amount) || 0) - total);
  const hasMismatch = items.length > 0 && amountDiff > 0.5 && status === ORDER_STATUS_DRAFT;

  return `
    <div class="field field-wide deal-items-summary" data-deal-items-summary data-deal-id="${escapeAttr(dealId)}">
      <div class="dis-sum-row">
        <div class="dis-sum-left">
          <strong class="dis-sum-title">📦 Состав заказа</strong>
          ${statusBadgeHtml(status)}
        </div>
        <div class="dis-sum-stats">
          ${items.length > 0
            ? `${items.length} ${itemsWord} · <strong>${fmtNum(total)} ₸</strong>`
            : `<span class="muted">пусто</span>`}
        </div>
      </div>
      ${hasMismatch ? `
        <div class="dis-sum-warning">⚠ Не совпадает с суммой сделки (${fmtNum(deal.amount)} ₸)</div>
      ` : ""}
      <div class="dis-sum-actions">
        <button type="button" class="btn-primary" data-deal-items-open>
          ${items.length > 0 ? "📋 Открыть заказ" : "+ Сформировать заказ"}
        </button>
      </div>
    </div>
  `;
}

// === RENDER: Модалка с полным составом заказа ===

function renderItemRow(item, products, editable) {
  const product = item.productId ? products.find((p) => p.id === item.productId) : null;
  const summary = item.productId ? productSummary(item.productId) : null;
  const stock = summary?.total || 0;
  const shortage = item.qty > stock && item.productId;
  const stockClass = !item.productId ? "" : (shortage ? "stock-low" : "stock-ok");
  const stockLabel = !item.productId ? "—" : `${fmtNum(stock)} ${escapeHtml(item.unit || "шт")}`;
  const inputDisabled = editable ? "" : "disabled";
  const initialLabel = product ? productLabel(product) : "";

  return `
    <tr data-deal-item-id="${escapeAttr(item.id)}">
      <td class="dim-product">
        <div class="dim-typeahead" data-item-id="${escapeAttr(item.id)}">
          <input type="text" class="dim-ta-input" placeholder="Поиск товара по SKU или названию…"
                 value="${escapeAttr(initialLabel)}"
                 data-deal-item-typeahead="${escapeAttr(item.id)}"
                 ${inputDisabled}
                 autocomplete="off">
          <div class="dim-ta-list" data-deal-item-list="${escapeAttr(item.id)}" hidden></div>
        </div>
      </td>
      <td class="dim-stock ${stockClass}" title="${shortage ? "Недостаточно на складе" : "Остаток на складе"}">
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
      <td class="num dim-amount">${fmtNum(item.lineAmount)} ₸</td>
      <td class="dim-row-actions">
        ${editable ? `<button type="button" class="btn-ghost btn-icon btn-sm" data-deal-item-remove data-id="${escapeAttr(item.id)}" title="Удалить позицию">✕</button>` : ""}
      </td>
    </tr>
  `;
}

function renderModalHTML(dealId) {
  const deal = Store.get(DEALS, dealId);
  if (!deal) return "";
  const items = listDealItems(dealId);
  const total = dealItemsTotal(dealId);
  const products = listWarehouseProducts({ includeArchived: false });
  const status = getDealOrderStatus(deal);
  const editable = isOrderEditable(deal);
  const amountDiff = Math.abs((Number(deal.amount) || 0) - total);
  const showAmountMismatch = items.length > 0 && amountDiff > 0.5;

  const itemsWord = items.length === 1 ? "позиция" : (items.length >= 2 && items.length <= 4 ? "позиции" : "позиций");

  const banner = status === ORDER_STATUS_PRELIMINARY ? `
    <div class="dim-banner">
      <div class="dim-banner-icon">📦</div>
      <div class="dim-banner-text">
        <strong>Предварительный заказ отправлен на склад</strong>
        <div class="dim-banner-meta">
          ${fmtDateTime(deal.orderSubmittedAt) || ""}
          ${deal.orderSubmittedByName ? ` · ${escapeHtml(deal.orderSubmittedByName)}` : ""}
        </div>
      </div>
      <button type="button" class="btn-ghost btn-sm" data-deal-order-recall>↩ Вернуть в черновик</button>
    </div>
  ` : "";

  return `
    <div class="dim-backdrop" data-dim-backdrop>
      <div class="dim-modal" role="dialog" aria-modal="true" aria-labelledby="dimTitle">
        <header class="dim-header">
          <div class="dim-header-left">
            <h2 id="dimTitle">Состав заказа</h2>
            ${statusBadgeHtml(status)}
          </div>
          <div class="dim-header-right">
            <span class="dim-stats">
              ${items.length > 0
                ? `${items.length} ${itemsWord} · <strong>${fmtNum(total)} ₸</strong>`
                : `<span class="muted">Заказ пуст</span>`}
            </span>
            <button type="button" class="btn-ghost icon-only" data-dim-close aria-label="Закрыть">✕</button>
          </div>
        </header>

        <div class="dim-body">
          ${banner}

          ${items.length === 0 ? `
            <div class="dim-empty">
              <div class="dim-empty-icon">📦</div>
              <div class="dim-empty-title">Заказ пуст</div>
              <div class="dim-empty-text">Нажми «+ Позиция» чтобы добавить товар со склада. Поиск работает по SKU и названию.</div>
            </div>
          ` : `
            <table class="dim-table">
              <thead>
                <tr>
                  <th class="dim-th-product">Товар</th>
                  <th class="dim-th-stock">Остаток</th>
                  <th class="num dim-th-qty">Кол-во</th>
                  <th class="num dim-th-price">Цена, ₸</th>
                  <th class="num dim-th-amount">Сумма</th>
                  <th class="dim-th-actions"></th>
                </tr>
              </thead>
              <tbody data-dim-body>
                ${items.map((item) => renderItemRow(item, products, editable)).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="num"><strong>Итого:</strong></td>
                  <td class="num dim-total"><strong>${fmtNum(total)} ₸</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            ${showAmountMismatch ? `
              <div class="dim-warning">
                ⚠ Итог заказа (${fmtNum(total)} ₸) отличается от суммы сделки (${fmtNum(deal.amount)} ₸) на ${fmtNum(amountDiff)} ₸.
              </div>
            ` : ""}
          `}
        </div>

        <footer class="dim-footer">
          <div class="dim-footer-left">
            ${editable ? `
              <button type="button" class="btn-ghost btn-sm" data-deal-items-add>+ Позиция</button>
            ` : ""}
          </div>
          <div class="dim-footer-right">
            ${editable && items.length > 0 ? `
              <button type="button" class="btn-primary" data-deal-order-submit>📤 Сформировать заказ</button>
            ` : ""}
            <button type="button" class="btn-ghost" data-dim-close>Закрыть</button>
          </div>
        </footer>
      </div>
    </div>
  `;
}

// === Typeahead для строк ===

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
    return `<div class="dim-ta-empty">Ничего не найдено по запросу «${escapeHtml(query)}»</div>`;
  }
  return filtered.map((p) => {
    const summary = productSummary(p.id);
    const stock = summary?.total || 0;
    return `
      <div class="dim-ta-item" data-product-id="${escapeAttr(p.id)}" role="option">
        <div class="dim-ta-item-main">
          <span class="dim-ta-sku">${escapeHtml(p.sku || "—")}</span>
          <span class="dim-ta-name">${escapeHtml(p.name)}</span>
        </div>
        <div class="dim-ta-item-stock">${fmtNum(stock)} ${escapeHtml(p.unit || "шт")}</div>
      </div>
    `;
  }).join("");
}

function setupTypeahead(input, list, products, onSelect) {
  const open = () => {
    list.hidden = false;
    list.innerHTML = renderProductOptions(products, input.value);
    bindItems();
  };
  const close = () => { list.hidden = true; };

  const bindItems = () => {
    list.querySelectorAll(".dim-ta-item").forEach((el) => {
      el.addEventListener("mousedown", (e) => {
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
  input.addEventListener("blur", () => setTimeout(close, 150));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { close(); input.blur(); }
  });
}

// === Управление модалкой ===

function refreshModal() {
  if (!modalState.dealId || !modalState.mountEl) return;
  const fresh = document.createElement("div");
  fresh.innerHTML = renderModalHTML(modalState.dealId);
  const newRoot = fresh.firstElementChild;
  if (newRoot) {
    modalState.mountEl.replaceWith(newRoot);
    modalState.mountEl = newRoot;
    wireModalHandlers();
  }
}

function refreshSummary() {
  if (!modalState.dealId) return;
  const summary = document.querySelector(`[data-deal-items-summary][data-deal-id="${modalState.dealId}"]`);
  if (!summary) return;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderDealItemsSection(modalState.dealId);
  const fresh = wrapper.firstElementChild;
  if (fresh) {
    summary.replaceWith(fresh);
    attachSummaryHandlers(fresh.parentElement || document.body, modalState.dealId);
  }
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function wireModalHandlers() {
  const root = modalState.mountEl;
  if (!root) return;
  const dealId = modalState.dealId;
  const products = listWarehouseProducts({ includeArchived: false });

  // Закрытие
  const closeModal = () => closeDealItemsModal();
  root.querySelectorAll("[data-dim-close]").forEach((btn) => btn.addEventListener("click", closeModal));
  root.querySelector("[data-dim-backdrop]")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Добавить позицию
  root.querySelector("[data-deal-items-add]")?.addEventListener("click", (e) => {
    e.preventDefault();
    createDealItem(dealId, {});
    refreshModal();
  });

  // Удалить позицию
  root.querySelectorAll("[data-deal-item-remove]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      if (!id) return;
      removeDealItem(id);
      refreshModal();
    });
  });

  // Typeahead в строках
  root.querySelectorAll(".dim-typeahead").forEach((wrap) => {
    const itemId = wrap.dataset.itemId;
    const input = wrap.querySelector(".dim-ta-input");
    const list = wrap.querySelector(".dim-ta-list");
    if (!input || !list || !itemId) return;
    setupTypeahead(input, list, products, (productId) => {
      updateDealItem(itemId, { productId });
      refreshModal();
    });
  });

  // Qty / unitPrice — debounced
  const updateAmounts = (input) => {
    const id = input.dataset.id;
    const item = Store.get(ITEMS, id);
    if (!item) return;
    const row = input.closest("tr");
    if (row) {
      const amountCell = row.querySelector(".dim-amount");
      if (amountCell) amountCell.textContent = `${fmtNum(item.lineAmount)} ₸`;
    }
    const totalCell = root.querySelector(".dim-total");
    if (totalCell) totalCell.innerHTML = `<strong>${fmtNum(dealItemsTotal(dealId))} ₸</strong>`;
  };

  const onNum = debounce((input) => {
    const id = input.dataset.id;
    const field = input.dataset.dealItemField;
    if (!id || !field) return;
    const value = Number(input.value) || 0;
    updateDealItem(id, { [field]: value });
    updateAmounts(input);
  }, 250);

  root.querySelectorAll('input[data-deal-item-field="qty"], input[data-deal-item-field="unitPrice"]')
    .forEach((input) => input.addEventListener("input", () => onNum(input)));

  // Submit / recall
  root.querySelector("[data-deal-order-submit]")?.addEventListener("click", (e) => {
    e.preventDefault();
    try {
      submitDealOrder(dealId);
      refreshModal();
    } catch (err) {
      alert(err?.message || "Не удалось сформировать заказ");
    }
  });
  root.querySelector("[data-deal-order-recall]")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!confirm("Вернуть заказ в черновик? Со склада он исчезнет из предварительных заказов.")) return;
    recallDealOrder(dealId);
    refreshModal();
  });

  // Escape для закрытия модалки
  if (!modalState._escHandler) {
    modalState._escHandler = (e) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", modalState._escHandler);
  }
}

export function openDealItemsModal(dealId) {
  if (modalState.mountEl) closeDealItemsModal();
  modalState.dealId = dealId;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderModalHTML(dealId);
  const root = wrapper.firstElementChild;
  if (!root) return;
  document.body.appendChild(root);
  modalState.mountEl = root;
  wireModalHandlers();
  // Фокус на input если есть пустая позиция
  setTimeout(() => {
    const firstInput = root.querySelector(".dim-ta-input:not([disabled])");
    if (firstInput && !firstInput.value) firstInput.focus();
  }, 50);
}

export function closeDealItemsModal() {
  if (modalState.mountEl) {
    modalState.mountEl.remove();
    modalState.mountEl = null;
  }
  if (modalState._escHandler) {
    document.removeEventListener("keydown", modalState._escHandler);
    modalState._escHandler = null;
  }
  const dealId = modalState.dealId;
  modalState.dealId = null;
  // Обновим summary в карточке сделки
  if (dealId) {
    const summary = document.querySelector(`[data-deal-items-summary][data-deal-id="${dealId}"]`);
    if (summary) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = renderDealItemsSection(dealId);
      const fresh = wrapper.firstElementChild;
      if (fresh) {
        const parent = summary.parentElement;
        summary.replaceWith(fresh);
        if (parent) attachSummaryHandlers(parent, dealId);
      }
    }
  }
}

// === Handlers для summary в карточке сделки ===

function attachSummaryHandlers(container, dealId) {
  // Навешиваем на ВСЕ кнопки [data-deal-items-open] в карточке сделки (саммари + action-bar).
  container.querySelectorAll("[data-deal-items-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openDealItemsModal(dealId);
    });
  });
}

// Главный экспорт для интеграции в renderDealModal (deals.js)
export function attachDealItemsHandlers(container, dealId) {
  attachSummaryHandlers(container, dealId);
}
