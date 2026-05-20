// Pllato CRM — Состав заказа в сделке (Этап 1).
// Хранение позиций сделки + UI секции в карточке.
// Связь со складом: чтение каталога товаров + остатков.
// На Этапе 2: при переходе в стадию "Аванс" — автоматическое создание warehouse_document.

import { Store } from "./store.js";
import { listWarehouseProducts, getWarehouseProduct, productSummary } from "./warehouse.js";
import { ICONS } from "./icons.js";

const COLLECTION = "deal_items";

// === API ===

export function listDealItems(dealId) {
  return Store.list(COLLECTION)
    .filter((x) => x.dealId === dealId)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

export function createDealItem(dealId, payload = {}) {
  const product = payload.productId ? getWarehouseProduct(payload.productId) : null;
  const qty = Number(payload.qty) || 0;
  const unitPrice = Number(payload.unitPrice) || 0;
  return Store.create(COLLECTION, {
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
  const item = Store.get(COLLECTION, id);
  if (!item) return null;

  const next = { ...patch };

  // Если меняем товар — обновим denormalized поля
  if (patch.productId !== undefined && patch.productId !== item.productId) {
    const product = patch.productId ? getWarehouseProduct(patch.productId) : null;
    next.productSku = product?.sku || "";
    next.productName = product?.name || "";
    next.unit = product?.unit || "шт";
  }

  // Пересчёт суммы строки
  if (patch.qty !== undefined || patch.unitPrice !== undefined) {
    const qty = patch.qty !== undefined ? Number(patch.qty) || 0 : item.qty;
    const unitPrice = patch.unitPrice !== undefined ? Number(patch.unitPrice) || 0 : item.unitPrice;
    next.qty = qty;
    next.unitPrice = unitPrice;
    next.lineAmount = qty * unitPrice;
  }

  return Store.update(COLLECTION, id, next);
}

export function removeDealItem(id) {
  return Store.remove(COLLECTION, id);
}

export function removeAllDealItemsForDeal(dealId) {
  listDealItems(dealId).forEach((x) => Store.remove(COLLECTION, x.id));
}

export function dealItemsTotal(dealId) {
  return listDealItems(dealId).reduce((sum, x) => sum + (Number(x.lineAmount) || 0), 0);
}

// === Render ===

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function fmtNum(n) {
  return new Intl.NumberFormat("ru-RU").format(Number(n) || 0);
}

function renderItemRow(item, products) {
  const product = item.productId ? products.find((p) => p.id === item.productId) : null;
  const summary = item.productId ? productSummary(item.productId) : null;
  const stock = summary?.total || 0;
  const shortage = item.qty > stock;
  const stockClass = !item.productId ? "" : (shortage ? "stock-low" : "stock-ok");
  const stockLabel = !item.productId ? "—" : `${fmtNum(stock)} ${escapeHtml(item.unit || "шт")}`;

  return `
    <tr data-deal-item-id="${escapeAttr(item.id)}">
      <td class="dis-product">
        <select data-deal-item-field="productId" data-id="${escapeAttr(item.id)}">
          <option value="">— выбери товар —</option>
          ${products.map((p) => `
            <option value="${escapeAttr(p.id)}" ${p.id === item.productId ? "selected" : ""}>
              ${escapeHtml(p.sku || "—")} · ${escapeHtml(p.name)}
            </option>
          `).join("")}
        </select>
      </td>
      <td class="dis-stock ${stockClass}" title="${shortage ? "Недостаточно на складе" : "Остаток на складе"}">
        ${stockLabel}
      </td>
      <td class="num">
        <input type="number" min="0" step="1" value="${escapeAttr(item.qty)}"
               data-deal-item-field="qty" data-id="${escapeAttr(item.id)}">
      </td>
      <td class="num">
        <input type="number" min="0" step="100" value="${escapeAttr(item.unitPrice)}"
               data-deal-item-field="unitPrice" data-id="${escapeAttr(item.id)}">
      </td>
      <td class="num dis-amount">${fmtNum(item.lineAmount)} ₸</td>
      <td class="dis-actions">
        <button type="button" class="btn-ghost btn-icon btn-sm" data-deal-item-remove data-id="${escapeAttr(item.id)}" title="Удалить позицию">${ICONS.x}</button>
      </td>
    </tr>
  `;
}

export function renderDealItemsSection(dealId, dealAmount = 0) {
  const items = listDealItems(dealId);
  const total = dealItemsTotal(dealId);
  const products = listWarehouseProducts({ includeArchived: false });
  const amountDiff = Math.abs((Number(dealAmount) || 0) - total);
  const showAmountMismatch = items.length > 0 && amountDiff > 0.5;

  return `
    <div class="field field-wide deal-items-section" data-deal-items data-deal-id="${escapeAttr(dealId)}">
      <div class="dis-header">
        <label>Состав заказа</label>
        <button type="button" class="btn-ghost btn-sm" data-deal-items-add>
          ${ICONS.plus}<span>Позиция</span>
        </button>
      </div>
      ${items.length === 0 ? `
        <div class="dis-empty">
          Заказ пуст. Нажми «+ Позиция» чтобы добавить товар со склада.
        </div>
      ` : `
        <div class="dis-table-wrap">
          <table class="dis-table">
            <thead>
              <tr>
                <th>Товар</th>
                <th>Остаток</th>
                <th class="num">Кол-во</th>
                <th class="num">Цена, ₸</th>
                <th class="num">Сумма</th>
                <th></th>
              </tr>
            </thead>
            <tbody data-deal-items-body>
              ${items.map((item) => renderItemRow(item, products)).join("")}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="num"><strong>Итого по заказу:</strong></td>
                <td class="num dis-total"><strong>${fmtNum(total)} ₸</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        ${showAmountMismatch ? `
          <div class="dis-warning">
            ⚠ Сумма заказа (${fmtNum(total)} ₸) отличается от суммы сделки (${fmtNum(dealAmount)} ₸) на ${fmtNum(amountDiff)} ₸.
          </div>
        ` : ""}
      `}
    </div>
  `;
}

// === Handlers ===

// Перерисовывает только секцию (не всю модалку) — чтобы не терять фокус в других полях.
function refreshSection(container, dealId, dealAmount) {
  const section = container.querySelector("[data-deal-items]");
  if (!section) return;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderDealItemsSection(dealId, dealAmount);
  const fresh = wrapper.firstElementChild;
  section.replaceWith(fresh);
  attachDealItemsHandlers(container, dealId, dealAmount);
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function attachDealItemsHandlers(container, dealId, dealAmount = 0) {
  const section = container.querySelector("[data-deal-items]");
  if (!section) return;

  // Добавить позицию
  section.querySelector("[data-deal-items-add]")?.addEventListener("click", (e) => {
    e.preventDefault();
    createDealItem(dealId, {});
    refreshSection(container, dealId, dealAmount);
  });

  // Удалить позицию
  section.querySelectorAll("[data-deal-item-remove]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      if (!id) return;
      removeDealItem(id);
      refreshSection(container, dealId, dealAmount);
    });
  });

  // Изменение полей: productId (select) — мгновенно; qty/unitPrice — с debounce
  const handleField = (input, immediate) => {
    const id = input.dataset.id;
    const field = input.dataset.dealItemField;
    if (!id || !field) return;
    let value = input.value;
    if (field === "qty" || field === "unitPrice") value = Number(value) || 0;
    updateDealItem(id, { [field]: value });
    if (immediate) refreshSection(container, dealId, dealAmount);
  };

  // Select товара — обновить сразу (нужно перерисовать остаток + sku/name)
  section.querySelectorAll('select[data-deal-item-field="productId"]').forEach((sel) => {
    sel.addEventListener("change", () => handleField(sel, true));
  });

  // Цифровые поля — debounced для плавного ввода, перерисовка после
  const onNum = debounce((input) => {
    handleField(input, false);
    // Перерисуем только сумму строки и итог — без полной refreshSection чтобы не сбить фокус
    const row = input.closest("tr");
    const id = input.dataset.id;
    const item = Store.get("deal_items", id);
    if (row && item) {
      const amountCell = row.querySelector(".dis-amount");
      if (amountCell) amountCell.textContent = `${fmtNum(item.lineAmount)} ₸`;
    }
    const totalCell = section.querySelector(".dis-total");
    if (totalCell) totalCell.innerHTML = `<strong>${fmtNum(dealItemsTotal(dealId))} ₸</strong>`;
  }, 250);

  section.querySelectorAll('input[data-deal-item-field="qty"], input[data-deal-item-field="unitPrice"]').forEach((input) => {
    input.addEventListener("input", () => onNum(input));
  });
}
