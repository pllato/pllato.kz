// Pllato CRM — Состав заказа в сделке (модалка) + предварительный заказ для склада.
// UI: компактный summary в карточке сделки → клик «Открыть» → отдельная модалка с таблицей.
// Статусы: draft (черновик) → preliminary (отправлен на склад).

import { Store } from "./store.js";
import { listWarehouseProducts, getWarehouseProduct, productSummary } from "./warehouse.js";
import { currentEmployee } from "./employees.js";
import { apiFetch } from "./auth.js";
import {
  submitOneCDocument,
  ONE_C_VAT_RATES,
  ONE_C_VAT_5,
  PAYMENT_PURPOSE_OPTS,
  PAYMENT_SCHEMES,
  ONE_C_BASES_UI,
  listContractsFor,
  searchClientContacts,
  clientBinHint,
} from "./one_c_invoice.js";
import {
  listDeliveryPointsForContact,
  getDeliveryPoint,
  saveDeliveryPoint,
} from "./delivery_points.js";

const ITEMS = "deal_items";
const DEALS = "deals";

export const ORDER_STATUS_DRAFT = "draft";
export const ORDER_STATUS_PRELIMINARY = "preliminary";
export const ORDER_STATUS_APPROVED = "approved";
export const ORDER_STATUS_PAYMENT_PENDING = "payment_pending"; // C.5 — для 100% предоплаты
export const ORDER_STATUS_SHIPPED = "shipped";

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
  const item = Store.create(ITEMS, {
    dealId,
    productId: payload.productId || null,
    productSku: product?.sku || "",
    productName: product?.name || "",
    unit: product?.unit || "шт",
    qty,
    unitPrice,
    lineAmount: qty * unitPrice,
  });
  // Если позиция уже валидная (товар + кол-во) — сразу промоутим заказ в «Предварительный».
  autoPromoteToPreliminary(dealId);
  return item;
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
  const updated = Store.update(ITEMS, id, next);
  // После изменения проверяем: если в заказе появилась первая валидная позиция —
  // автоматически отправляем на склад в «Предварительные».
  if (updated?.dealId) autoPromoteToPreliminary(updated.dealId);
  return updated;
}

// Авто-промоция: как только в сделке-черновике появилась хотя бы одна валидная
// позиция (есть товар + кол-во > 0) — статус заказа переходит в «Предварительный».
// Это означает, что склад сразу видит заказ в колонке «Предварительные».
// Уже отправленные/согласованные/отгруженные заказы не трогаем.
function autoPromoteToPreliminary(dealId) {
  const deal = Store.get(DEALS, dealId);
  if (!deal) return;
  const status = deal.orderStatus || ORDER_STATUS_DRAFT;
  if (status !== ORDER_STATUS_DRAFT) return;
  const hasValid = listDealItems(dealId).some(
    (i) => i.productId && (Number(i.qty) || 0) > 0
  );
  if (!hasValid) return;
  const me = currentEmployee();
  const now = Date.now();
  Store.update(DEALS, dealId, {
    orderStatus: ORDER_STATUS_PRELIMINARY,
    orderSubmittedAt: now,
    orderSubmittedBy: me?.id || null,
    orderSubmittedByName: me?.name || me?.email || "",
  });
  try {
    Store.create("deal_activities", {
      dealId,
      type: "order_auto_submitted",
      text: "Заказ автоматически отправлен на склад (появилась валидная позиция)",
      authorId: me?.id || null,
      ts: now,
    });
  } catch (e) {
    console.warn("[deal_items] не удалось записать activity order_auto_submitted:", e);
  }
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

/**
 * Заказы, согласованные на отгрузку (после клика «Согласовать» в карточке).
 * Сортировка — свежие сверху по orderApprovedAt.
 */
export function listApprovedDealOrders() {
  return Store.list(DEALS)
    .filter((d) => d.orderStatus === ORDER_STATUS_APPROVED && !d.isDeleted)
    .sort((a, b) => (b.orderApprovedAt || 0) - (a.orderApprovedAt || 0));
}

/**
 * Согласовать заказ на отгрузку. Фиксируем кто и когда — пишем в сделку
 * и в timeline (deal_activities). Возвращаем обновлённую сделку.
 */
export function approveDealOrder(dealId) {
  const deal = Store.get(DEALS, dealId);
  if (!deal) throw new Error("Сделка не найдена");
  if (deal.orderStatus !== ORDER_STATUS_PRELIMINARY) {
    throw new Error("Согласовать можно только предварительный заказ");
  }
  const me = currentEmployee();
  const now = Date.now();
  const updated = Store.update(DEALS, dealId, {
    orderStatus: ORDER_STATUS_APPROVED,
    orderApprovedAt: now,
    orderApprovedBy: me?.id || null,
    orderApprovedByName: me?.name || me?.email || "Сотрудник",
  });
  // Активность в timeline сделки.
  try {
    Store.create("deal_activities", {
      dealId,
      type: "order_approved",
      text: `Согласовано на отгрузку: ${me?.name || me?.email || "сотрудник"}`,
      authorId: me?.id || null,
      ts: now,
    });
  } catch (e) {
    console.warn("[deal_items] не удалось добавить activity order_approved:", e);
  }
  return updated;
}

/**
 * Заказы в стадии «Ожидание оплаты» — для 100% предоплаты.
 * После согласования директором, перед фактической отгрузкой.
 */
export function listPaymentPendingDealOrders() {
  return Store.list(DEALS)
    .filter((d) => d.orderStatus === ORDER_STATUS_PAYMENT_PENDING && !d.isDeleted)
    .sort((a, b) => (b.orderAwaitingPaymentAt || 0) - (a.orderAwaitingPaymentAt || 0));
}

/**
 * Перевести заказ в «Ожидание оплаты» — это стадия между approved и shipped
 * для договоров с 100% предоплатой. Менеджер ждёт пока клиент оплатит счёт.
 */
export function markDealOrderAwaitingPayment(dealId, extra = {}) {
  const deal = Store.get(DEALS, dealId);
  if (!deal) throw new Error("Сделка не найдена");
  if (deal.orderStatus !== ORDER_STATUS_APPROVED) {
    throw new Error("В ожидание оплаты можно перевести только согласованный заказ");
  }
  const me = currentEmployee();
  const now = Date.now();
  const updated = Store.update(DEALS, dealId, {
    orderStatus: ORDER_STATUS_PAYMENT_PENDING,
    orderAwaitingPaymentAt: now,
    orderAwaitingPaymentBy: me?.id || null,
    orderInvoiceForPaymentId: extra.invoiceId || null,
    orderInvoiceForPaymentNumber: extra.invoiceNumber || null,
    orderExpectedAmount: Number(extra.amount) || 0,
  });
  try {
    Store.create("deal_activities", {
      dealId,
      type: "order_awaiting_payment",
      text: extra.invoiceNumber
        ? `Ожидаем оплату по счёту № ${extra.invoiceNumber}`
        : "Ожидаем оплату клиента",
      authorId: me?.id || null,
      ts: now,
    });
  } catch (e) { /* noop */ }
  return updated;
}

/**
 * Подтвердить получение оплаты от клиента. Менеджер фиксирует факт оплаты
 * (с прикреплением скана платёжки опционально) — заказ возвращается в approved
 * и склад может его отгружать.
 *
 * @param {string} dealId
 * @param {{ amount: number, paidAt?: string, note?: string, attachmentUrl?: string }} payload
 */
export function confirmDealOrderPayment(dealId, payload = {}) {
  const deal = Store.get(DEALS, dealId);
  if (!deal) throw new Error("Сделка не найдена");
  if (deal.orderStatus !== ORDER_STATUS_PAYMENT_PENDING) {
    throw new Error("Подтвердить оплату можно только для заказа в стадии «Ожидание оплаты»");
  }
  const me = currentEmployee();
  const now = Date.now();
  const amount = Number(payload.amount) || 0;
  const updated = Store.update(DEALS, dealId, {
    orderStatus: ORDER_STATUS_APPROVED, // возврат в approved для отгрузки
    orderPaymentConfirmedAt: now,
    orderPaymentConfirmedBy: me?.id || null,
    orderPaymentConfirmedByName: me?.name || me?.email || "Сотрудник",
    orderPaymentAmount: amount,
    orderPaymentDate: payload.paidAt || new Date().toISOString().slice(0, 10),
    orderPaymentNote: payload.note || "",
    orderPaymentAttachmentUrl: payload.attachmentUrl || "",
  });
  try {
    Store.create("deal_activities", {
      dealId,
      type: "order_payment_confirmed",
      text: amount > 0
        ? `Оплата подтверждена: ${amount.toLocaleString("ru-RU")} ₸ от ${payload.paidAt || "сегодня"}`
        : "Оплата подтверждена",
      authorId: me?.id || null,
      ts: now,
    });
  } catch (e) { /* noop */ }
  return updated;
}

/**
 * Заказы, по которым уже сформирована накладная — отгружены.
 * Сортировка по времени отгрузки (последние сверху).
 */
export function listShippedDealOrders() {
  return Store.list(DEALS)
    .filter((d) => d.orderStatus === ORDER_STATUS_SHIPPED && !d.isDeleted)
    .sort((a, b) => (b.orderShippedAt || 0) - (a.orderShippedAt || 0));
}

/**
 * Перевести заказ в статус «отгружен». Вызывается из createInvoiceFromDeal()
 * сразу после успешного создания расходной накладной.
 * Идемпотентность: если уже shipped — ничего не делаем.
 *
 * @param {string} dealId
 * @param {{ invoiceId?: string, invoiceNumber?: string }} extra
 */
export function markDealOrderShipped(dealId, extra = {}) {
  const deal = Store.get(DEALS, dealId);
  if (!deal) return null;
  if (deal.orderStatus === ORDER_STATUS_SHIPPED) return deal;
  const me = currentEmployee();
  const now = Date.now();
  const updated = Store.update(DEALS, dealId, {
    orderStatus: ORDER_STATUS_SHIPPED,
    orderShippedAt: now,
    orderShippedBy: me?.id || null,
    orderShippedByName: me?.name || me?.email || "",
    orderInvoiceId: extra.invoiceId || null,
    orderInvoiceNumber: extra.invoiceNumber || null,
  });
  try {
    Store.create("deal_activities", {
      dealId,
      type: "order_shipped",
      text: extra.invoiceNumber
        ? `Заказ отгружен — накладная № ${extra.invoiceNumber}`
        : "Заказ отгружен",
      authorId: me?.id || null,
      ts: now,
    });
  } catch (e) {
    console.warn("[deal_items] не удалось добавить activity order_shipped:", e);
  }
  return updated;
}

/**
 * Отозвать согласование — возврат в статус 'preliminary'.
 */
export function revokeDealOrderApproval(dealId) {
  const deal = Store.get(DEALS, dealId);
  if (!deal) throw new Error("Сделка не найдена");
  if (deal.orderStatus !== ORDER_STATUS_APPROVED) {
    throw new Error("Отозвать согласование можно только у согласованного заказа");
  }
  const me = currentEmployee();
  const now = Date.now();
  const updated = Store.update(DEALS, dealId, {
    orderStatus: ORDER_STATUS_PRELIMINARY,
    orderApprovalRevokedAt: now,
    orderApprovalRevokedBy: me?.id || null,
  });
  try {
    Store.create("deal_activities", {
      dealId,
      type: "order_approval_revoked",
      text: `Согласование отозвано: ${me?.name || me?.email || "сотрудник"}`,
      authorId: me?.id || null,
      ts: now,
    });
  } catch (e) {
    console.warn("[deal_items] не удалось добавить activity order_approval_revoked:", e);
  }
  return updated;
}

/**
 * Reconciler: разовый проход на boot, синхронизирует статусы заказов с
 * фактическим состоянием склада. Идемпотентен — можно звать сколько угодно раз.
 *
 * 1) Любая sale_invoice (не cancelled) → её сделка должна быть в shipped
 *    (с заполненным orderInvoiceId/Number). Без этого после старого пути
 *    «Сформировать накладную» заказ оставался в approved хотя накладная уже была.
 * 2) Любой draft-заказ с валидной позицией → авто-промоция в preliminary
 *    (на случай если данные были созданы до того, как мы внедрили автоматику
 *    в createDealItem/updateDealItem).
 *
 * @returns {{ shipped: number, promoted: number }}
 */
export function reconcileOrderStatuses() {
  let shipped = 0;
  let promoted = 0;

  // (1) Накладные → заказы в shipped.
  const docs = Store.list("warehouse_documents").filter(
    (d) => d.type === "sale_invoice" && d.status !== "cancelled" && d.dealId
  );
  for (const doc of docs) {
    const deal = Store.get(DEALS, doc.dealId);
    if (!deal) continue;
    if (deal.orderStatus === ORDER_STATUS_SHIPPED) continue;
    try {
      markDealOrderShipped(doc.dealId, { invoiceId: doc.id, invoiceNumber: doc.number });
      shipped += 1;
    } catch (e) {
      console.warn("[reconciler] markDealOrderShipped failed for deal", doc.dealId, e);
    }
  }

  // (2) Draft с валидными позициями → preliminary.
  // Группируем deal_items по dealId один раз — без перебора в цикле.
  const validByDeal = new Map();
  for (const it of Store.list(ITEMS)) {
    if (it.productId && (Number(it.qty) || 0) > 0) {
      validByDeal.set(it.dealId, true);
    }
  }
  for (const [dealId] of validByDeal) {
    const deal = Store.get(DEALS, dealId);
    if (!deal || deal.isDeleted) continue;
    const status = deal.orderStatus || ORDER_STATUS_DRAFT;
    if (status !== ORDER_STATUS_DRAFT) continue;
    try {
      autoPromoteToPreliminary(dealId);
      promoted += 1;
    } catch (e) {
      console.warn("[reconciler] autoPromote failed for deal", dealId, e);
    }
  }

  if (shipped > 0 || promoted > 0) {
    console.log(`[reconciler] order statuses synced: shipped=${shipped}, promoted=${promoted}`);
  }
  return { shipped, promoted };
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
  // Товар на складе без привязки к 1С → под строкой компактный inline-матчер.
  const storeProduct = item.productId ? Store.get("warehouse_products", item.productId) : null;
  const needsMatch = !!(storeProduct && !storeProduct._1c_ref_key);

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
    ${needsMatch ? `
    <tr class="dim-match-row" data-deal-match-row="${escapeAttr(item.productId)}">
      <td colspan="6" style="padding:6px 8px 10px;border-top:none">
        <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:8px 10px;font-size:12px;color:#9a3412">
          ⚠ Не сопоставлено с 1С — без привязки не войдёт в счёт/реализацию.
          <div style="display:flex;gap:6px;margin-top:6px">
            <input type="search" class="dim-match-q" placeholder="Поиск в номенклатуре 1С…" value="${escapeAttr(storeProduct?.name || item.productName || "")}" style="flex:1;padding:6px 8px;border:1px solid var(--border,#ccc);border-radius:6px;font:inherit;background:var(--surface,#fff);color:var(--text,#111)">
            <button type="button" class="dim-match-search btn-ghost btn-sm" style="white-space:nowrap">Искать</button>
          </div>
          <div class="dim-match-results" style="margin-top:6px"></div>
        </div>
      </td>
    </tr>
    ` : ""}
  `;
}

// === RENDER: Реквизиты для 1С (всегда видимая карточка в окне «Заказ») ===

const REQ_FIELD_STYLE = "width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;font:inherit;background:var(--surface,#fff);color:var(--text,#111)";
const REQ_LABEL_STYLE = "display:block;font-size:12.5px;color:var(--text-muted,#666);margin-bottom:4px";

function renderClientSearchResultsHtml(results, query) {
  if (results.length) {
    return results.map((c) => `<button type="button" class="dim-client-pick" data-cid="${escapeAttr(c.id)}" style="display:flex;justify-content:space-between;gap:10px;width:100%;text-align:left;border:none;border-bottom:1px solid var(--border,#f0f0f0);background:none;padding:8px 10px;cursor:pointer;color:var(--text,#111);font:inherit"><span>${escapeHtml(c.name || "(без названия)")}</span><span style="color:var(--text-muted,#888);font-size:11.5px;white-space:nowrap">${escapeHtml(clientBinHint(c))}</span></button>`).join("");
  }
  return `<div style="padding:8px 10px;font-size:12px;color:var(--text-muted,#888)">${String(query || "").trim().length >= 2 ? "Не найдено — проверьте написание или заведите контакт в CRM." : ""}</div>`;
}

// Карточка реквизитов 1С — всегда видна. Поля префилятся из полей сделки и
// персистятся на change/input. Здесь же привязка клиента, если заказ без контакта.
function renderRequisitesCard(deal) {
  const contact = deal.contactId ? Store.get("contacts", deal.contactId) : null;
  const hasClient = !!deal.contactId;
  const contractorRef = contact?._1c_ref_key || null;
  const contracts = listContractsFor(contractorRef);
  const deliveryPoints = hasClient ? listDeliveryPointsForContact(deal.contactId) : [];
  const selectedBase = deal.oneCBase || "aminamed";
  const selectedContract = deal.oneCContractRef || "";
  const selectedPayPurpose = deal.oneCPaymentPurpose || "710";
  const selectedScheme = deal.paymentScheme || "";
  const selectedVat = deal.oneCVatRef || ONE_C_VAT_5;

  // Адрес доставки: дефолт — первичная точка или адрес из 1С/контакта.
  let defaultDelivery = "";
  if (contact) {
    const primary = deliveryPoints.find((p) => p.isPrimary) || deliveryPoints[0];
    defaultDelivery = primary
      ? (primary.label || [primary.city, primary.address].filter(Boolean).join(", "))
      : (contact._1c_address || contact.address || "");
  }
  const primaryPoint = deliveryPoints.find((p) => p.isPrimary) || deliveryPoints[0] || null;

  const clientBlock = hasClient
    ? `<div style="font-weight:600">${escapeHtml(contact?.name || deal.contactName || deal.title || "—")}${contractorRef ? ` <span style="color:#16a34a;font-weight:400;font-size:12px">✓ есть в 1С</span>` : ""} <button type="button" class="btn-ghost btn-sm" data-dim-client-change style="padding:2px 8px;font-size:12px">сменить</button></div>`
    : `
      <div style="background:#fff3e0;border:1px solid #f59e0b;border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:12px;color:#92400e">⚠ Заказ не привязан к клиенту. Без клиента счёт в 1С не создать.</div>
      <input id="dim-client-search" type="text" value="" placeholder="Найти клиента по названию или БИН…" autocomplete="off" style="${REQ_FIELD_STYLE};margin-bottom:6px">
      <div id="dim-client-results" style="max-height:170px;overflow:auto;border:1px solid var(--border,#eee);border-radius:8px;display:none"></div>
    `;

  const deliveryBlock = deliveryPoints.length
    ? `
      <select id="dim-onec-delivery-select" style="${REQ_FIELD_STYLE};margin-bottom:6px">
        ${deliveryPoints.map((p) => `<option value="${escapeAttr(p.id)}"${primaryPoint && p.id === primaryPoint.id ? " selected" : ""}>${escapeHtml(p.label || [p.city, p.address].filter(Boolean).join(", "))}</option>`).join("")}
        <option value="__manual__">➕ Другой адрес</option>
      </select>
      <input id="dim-onec-delivery" type="text" value="" placeholder="город, адрес" style="${REQ_FIELD_STYLE};display:none">
    `
    : `<input id="dim-onec-delivery" type="text" value="${escapeAttr(defaultDelivery)}" placeholder="город, адрес — запомнится для клиента" style="${REQ_FIELD_STYLE}">`;

  return `
    <div class="dim-req-card" style="background:var(--surface,#fff);border:1px solid var(--border,#ddd);border-radius:10px;padding:14px 16px;margin-bottom:14px">
      <div style="font-weight:700;font-size:14px;margin-bottom:12px;color:var(--text,#111)">🧾 Реквизиты для 1С</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="grid-column:1 / -1">
          <label style="${REQ_LABEL_STYLE}">Клиент</label>
          ${clientBlock}
        </div>
        <div>
          <label style="${REQ_LABEL_STYLE}">Юр.лицо (база 1С)</label>
          <select id="dim-onec-base" style="${REQ_FIELD_STYLE}">
            ${ONE_C_BASES_UI.map((b) => `<option value="${escapeAttr(b.key)}"${b.key === selectedBase ? " selected" : ""}>${escapeHtml(b.label)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label style="${REQ_LABEL_STYLE}">Договор (1С)</label>
          <select id="dim-onec-contract" style="${REQ_FIELD_STYLE}">
            <option value="">— без договора —</option>
            ${contracts.map((c) => `<option value="${escapeAttr(c.ref)}"${c.ref === selectedContract ? " selected" : ""}>${escapeHtml(c.label)}</option>`).join("")}
          </select>
          ${contractorRef && contracts.length === 0 ? `<div style="font-size:11px;color:var(--text-muted,#888);margin-top:4px">Договоров клиента не найдено — обновите «Договоры» в «1С интеграция».</div>` : ""}
        </div>
        <div style="grid-column:1 / -1">
          <label style="${REQ_LABEL_STYLE}">Адрес доставки</label>
          ${deliveryBlock}
        </div>
        <div>
          <label style="${REQ_LABEL_STYLE}">Код назначения платежа</label>
          <select id="dim-onec-paypurpose" style="${REQ_FIELD_STYLE}">
            ${PAYMENT_PURPOSE_OPTS.map((p) => `<option value="${escapeAttr(p.code)}"${p.code === selectedPayPurpose ? " selected" : ""}>${escapeHtml(p.label)}</option>`).join("")}
          </select>
        </div>
        <div>
          <label style="${REQ_LABEL_STYLE}">Ставка НДС</label>
          <select id="dim-onec-vat" style="${REQ_FIELD_STYLE}">
            ${ONE_C_VAT_RATES.map((v) => `<option value="${escapeAttr(v.ref)}"${v.ref === selectedVat ? " selected" : ""}>${escapeHtml(v.label)}</option>`).join("")}
          </select>
        </div>
        <div style="grid-column:1 / -1">
          <label style="${REQ_LABEL_STYLE}">Схема оплаты</label>
          <select id="dim-onec-payscheme" style="${REQ_FIELD_STYLE};margin-bottom:${selectedScheme === "postpay" ? "6px" : "0"}">
            <option value="">— не указана —</option>
            ${PAYMENT_SCHEMES.map((s) => `<option value="${escapeAttr(s.key)}"${s.key === selectedScheme ? " selected" : ""}>${escapeHtml(s.label)}</option>`).join("")}
          </select>
          <input id="dim-onec-postpay-date" type="date" value="${escapeAttr(deal.postpayDueDate || "")}" title="Дата, до которой клиент должен оплатить" style="${REQ_FIELD_STYLE};display:${selectedScheme === "postpay" ? "block" : "none"}">
        </div>
        <div style="grid-column:1 / -1">
          <label style="${REQ_LABEL_STYLE}">Комментарий (попадёт в 1С)</label>
          <textarea id="dim-onec-comment" rows="2" placeholder="необязательно — добавится к пометке Pllato CRM" style="${REQ_FIELD_STYLE};resize:vertical">${escapeHtml(deal.oneCComment || "")}</textarea>
        </div>
      </div>
    </div>
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

  // Шапка-баннер по статусу: показывает где находится заказ и кто что делал.
  let banner = "";
  if (status === ORDER_STATUS_PRELIMINARY) {
    banner = `
      <div class="dim-banner dim-banner-pending">
        <div class="dim-banner-icon">⏳</div>
        <div class="dim-banner-text">
          <strong>Предварительный заказ — ждёт согласования</strong>
          <div class="dim-banner-meta">
            Отправлен: ${fmtDateTime(deal.orderSubmittedAt) || "—"}${deal.orderSubmittedByName ? ` · ${escapeHtml(deal.orderSubmittedByName)}` : ""}
          </div>
        </div>
      </div>
    `;
  } else if (status === ORDER_STATUS_APPROVED) {
    banner = `
      <div class="dim-banner dim-banner-approved">
        <div class="dim-banner-icon">✓</div>
        <div class="dim-banner-text">
          <strong>Согласован на отгрузку</strong>
          <div class="dim-banner-meta">
            Согласовал: ${escapeHtml(deal.orderApprovedByName || "—")}${deal.orderApprovedAt ? ` · ${fmtDateTime(deal.orderApprovedAt)}` : ""}
          </div>
        </div>
      </div>
    `;
  } else if (status === ORDER_STATUS_SHIPPED) {
    banner = `
      <div class="dim-banner dim-banner-shipped">
        <div class="dim-banner-icon">✅</div>
        <div class="dim-banner-text">
          <strong>Заказ отгружен</strong>
          <div class="dim-banner-meta">
            ${deal.orderInvoiceNumber ? `Накладная № ${escapeHtml(deal.orderInvoiceNumber)} · ` : ""}${fmtDateTime(deal.orderShippedAt) || ""}${deal.orderShippedByName ? ` · ${escapeHtml(deal.orderShippedByName)}` : ""}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="dim-backdrop" data-dim-backdrop>
      <div class="dim-modal" role="dialog" aria-modal="true" aria-labelledby="dimTitle">
        <header class="dim-header">
          <div class="dim-header-left">
            <h2 id="dimTitle">Заказ</h2>
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

          ${renderRequisitesCard(deal)}

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
            ${renderFooterActions(deal, items)}
            <button type="button" class="btn-ghost" data-dim-close>Закрыть</button>
          </div>
        </footer>
      </div>
    </div>
  `;
}

// Действия в модалке — последовательный workflow, ОДНА primary-кнопка за раз:
//   Согласование → Счёт → Отгрузка.
// Реквизиты 1С всегда видны выше; здесь только шаги жизненного цикла.
function renderFooterActions(deal, items) {
  const status = getDealOrderStatus(deal);
  const hasClient = !!deal.contactId;
  // Сопоставлены ли позиции с 1С (есть кол-во > 0 И привязка товара к 1С).
  const hasMatchedLines = items.some(
    (i) => (Number(i.qty) || 0) > 0 && Store.get("warehouse_products", i.productId)?._1c_ref_key
  );
  const hasInvoice = !!deal.oneCInvoiceNumber;
  const hasRealization = !!deal.oneCRealizationNumber;

  // Черновик/Предварительный: шаг 1 — согласование заказа.
  if (status === ORDER_STATUS_DRAFT || status === ORDER_STATUS_PRELIMINARY) {
    const recallBtn = status === ORDER_STATUS_PRELIMINARY
      ? `<button type="button" class="btn-ghost btn-sm" data-deal-order-recall title="Вернуть в черновик">↩ Вернуть в черновик</button>`
      : "";
    const disabled = items.length === 0;
    return `
      ${recallBtn}
      <button type="button" class="btn-primary deal-action-btn-approve" data-deal-order-approve title="${disabled ? "Добавьте хотя бы одну позицию" : "Согласовать заказ"}"${disabled ? " disabled" : ""}>✓ Согласовать заказ</button>
    `;
  }
  // Согласован, счёта ещё нет: шаг 2 — создать счёт в 1С.
  if (status === ORDER_STATUS_APPROVED && !hasInvoice) {
    let invoiceDisabled = "";
    let invoiceTitle = "Создать «Счёт на оплату покупателю» в 1С (черновик)";
    if (!hasClient) { invoiceDisabled = " disabled"; invoiceTitle = "Сначала выберите клиента в реквизитах 1С"; }
    else if (!hasMatchedLines) { invoiceDisabled = " disabled"; invoiceTitle = "Ни одна позиция не сопоставлена с номенклатурой 1С"; }
    return `
      <button type="button" class="btn-ghost btn-sm" data-deal-order-revoke title="Отозвать согласование">↶ Отозвать</button>
      <button type="button" class="btn-primary" data-deal-order-1c-invoice title="${escapeAttr(invoiceTitle)}"${invoiceDisabled}>🧾 Создать счёт в 1С</button>
    `;
  }
  // Согласован, счёт создан: шаг 3 — отгрузка (накладная + реализация в 1С).
  if (status === ORDER_STATUS_APPROVED && hasInvoice) {
    return `
      <span class="dim-footer-note" style="font-size:12.5px;color:#16a34a;margin-right:6px">Счёт 1С № ${escapeHtml(deal.oneCInvoiceNumber)} ✓</span>
      <button type="button" class="btn-primary" data-deal-order-ship title="Заказ перейдёт в «Отгружены»: расходная накладная З-2 + реализация в 1С">📦 Отгрузить (накладная + реализация в 1С)</button>
    `;
  }
  // Отгружен: печать накладной + реализация в 1С (если ещё не создана).
  if (status === ORDER_STATUS_SHIPPED) {
    const realizationBtn = hasRealization
      ? ""
      : `<button type="button" class="btn-ghost btn-sm" data-deal-order-1c-realization title="Создать «Реализацию товаров и услуг» в 1С (черновик)">📦 Реализация в 1С</button>`;
    const invoiceNote = hasInvoice
      ? `<span class="dim-footer-note" style="font-size:12.5px;color:#16a34a;margin-right:6px">Счёт 1С № ${escapeHtml(deal.oneCInvoiceNumber)} ✓</span>`
      : "";
    return `
      ${invoiceNote}
      ${realizationBtn}
      <button type="button" class="btn-primary" data-deal-order-print title="Открыть печатную форму З-2">📄 Открыть накладную${deal.orderInvoiceNumber ? ` № ${escapeHtml(deal.orderInvoiceNumber)}` : ""}</button>
    `;
  }
  return "";
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

  // === Реквизиты для 1С: персист на change/input ===

  // Тихий апдейт без перерисовки (поля, не влияющие на остальной UI).
  const persistDeal = (patch) => { try { Store.update(DEALS, dealId, patch); } catch {} };

  // Юр.лицо: смена базы влияет на договоры/контрагента → перерисовываем.
  root.querySelector("#dim-onec-base")?.addEventListener("change", (e) => {
    persistDeal({ oneCBase: e.target.value || "aminamed" });
    refreshModal();
  });
  // Договор: смена влияет на отображение → перерисовываем.
  root.querySelector("#dim-onec-contract")?.addEventListener("change", (e) => {
    persistDeal({ oneCContractRef: e.target.value || null });
    refreshModal();
  });
  // Код назначения / НДС / комментарий — тихо.
  root.querySelector("#dim-onec-paypurpose")?.addEventListener("change", (e) => persistDeal({ oneCPaymentPurpose: e.target.value || "710" }));
  root.querySelector("#dim-onec-vat")?.addEventListener("change", (e) => persistDeal({ oneCVatRef: e.target.value || ONE_C_VAT_5 }));
  root.querySelector("#dim-onec-comment")?.addEventListener("input", (e) => persistDeal({ oneCComment: e.target.value || null }));
  // Схема оплаты: postpay → показать дату; перерисовываем чтобы поле появилось/исчезло.
  root.querySelector("#dim-onec-payscheme")?.addEventListener("change", (e) => {
    const scheme = e.target.value || null;
    persistDeal({ paymentScheme: scheme, ...(scheme === "postpay" ? {} : { postpayDueDate: null }) });
    refreshModal();
  });
  root.querySelector("#dim-onec-postpay-date")?.addEventListener("change", (e) => persistDeal({ postpayDueDate: e.target.value || null }));
  // Адрес: «Другой адрес» → показать ручное поле без перерисовки (не терять ввод).
  root.querySelector("#dim-onec-delivery-select")?.addEventListener("change", (e) => {
    const inp = root.querySelector("#dim-onec-delivery");
    if (inp) {
      inp.style.display = e.target.value === "__manual__" ? "block" : "none";
      if (e.target.value === "__manual__") inp.focus();
    }
  });

  // Привязка клиента «на месте» (если заказ без контакта).
  const bindClientPicks = () => {
    root.querySelectorAll(".dim-client-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        const c = Store.get("contacts", btn.dataset.cid);
        if (!c) return;
        persistDeal({ contactId: c.id, contactName: c.name || null });
        refreshModal();
      });
    });
  };
  bindClientPicks();
  root.querySelector("#dim-client-search")?.addEventListener("input", (e) => {
    const q = e.target.value || "";
    const box = root.querySelector("#dim-client-results");
    if (!box) return;
    const results = searchClientContacts(q);
    box.style.display = (results.length || q.trim().length >= 2) ? "" : "none";
    box.innerHTML = renderClientSearchResultsHtml(results, q);
    bindClientPicks();
  });
  root.querySelector("[data-dim-client-change]")?.addEventListener("click", (e) => {
    e.preventDefault();
    persistDeal({ contactId: null, contactName: null });
    refreshModal();
  });

  // Inline-матчер несопоставленных позиций (поиск номенклатуры 1С + привязка).
  root.querySelectorAll("[data-deal-match-row]").forEach((row) => {
    const pid = row.dataset.dealMatchRow;
    if (!pid) return;
    const q = row.querySelector(".dim-match-q");
    const btn = row.querySelector(".dim-match-search");
    const res = row.querySelector(".dim-match-results");
    const doSearch = async () => {
      const text = (q.value || "").trim();
      if (text.length < 2) { res.innerHTML = '<span style="font-size:11px;color:#888">Введите минимум 2 символа</span>'; return; }
      res.innerHTML = '<span style="font-size:11px;color:#888">Ищем в 1С…</span>';
      try {
        const r = await apiFetch("/api/crm/1c/nomenclature/search?q=" + encodeURIComponent(text));
        const found = r?.results || [];
        if (!found.length) { res.innerHTML = '<span style="font-size:11px;color:#888">Ничего не найдено в 1С</span>'; return; }
        res.innerHTML = found.map((x) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:4px 0;border-top:1px solid var(--border,#f0f0f0)"><span style="font-size:12px;color:var(--text,#111)">${escapeHtml(x.name)} <span style="opacity:.5">${escapeHtml(x.code || "")}</span></span><button type="button" class="dim-match-pick btn-ghost btn-sm" data-ref="${escapeAttr(x.ref)}" data-unit="${escapeAttr(x.unit || "")}" data-vat="${escapeAttr(x.vat || "")}" style="white-space:nowrap">Привязать</button></div>`).join("");
        res.querySelectorAll(".dim-match-pick").forEach((b) => b.addEventListener("click", async () => {
          b.disabled = true; b.textContent = "…";
          try {
            await apiFetch("/api/crm/1c/products/map", { method: "POST", body: { productId: pid, refKey: b.dataset.ref, unitRef: b.dataset.unit || null, vatRef: b.dataset.vat || null } });
            try { Store.update("warehouse_products", pid, { _1c_ref_key: b.dataset.ref, _1c_unit_ref: b.dataset.unit || null, _1c_vat_ref: b.dataset.vat || null, _1c_match_method: "manual", _1c_match_ambiguous: false }); } catch {}
            refreshModal();
          } catch (err) { b.disabled = false; b.textContent = "Привязать"; alert("Ошибка привязки: " + (err?.message || String(err))); }
        }));
      } catch (err) { res.innerHTML = '<span style="color:#dc2626;font-size:11px">Ошибка: ' + escapeHtml(err?.message || String(err)) + '</span>'; }
    };
    btn?.addEventListener("click", doSearch);
    q?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doSearch(); } });
  });

  // Собрать реквизиты 1С из полей сделки + разрешить адрес доставки из UI.
  // Возвращает аргументы для submitOneCDocument (без docType).
  const collectOneCArgs = () => {
    const deal = Store.get(DEALS, dealId);
    const contact = deal?.contactId ? Store.get("contacts", deal.contactId) : null;
    // Адрес доставки: из выбранной точки клиента или ручной ввод (новый — запомним).
    let deliveryAddress = null;
    const deliverySel = root.querySelector("#dim-onec-delivery-select");
    const deliveryManual = (root.querySelector("#dim-onec-delivery")?.value || "").trim();
    if (deliverySel && deliverySel.value && deliverySel.value !== "__manual__") {
      const pt = getDeliveryPoint(deliverySel.value);
      deliveryAddress = pt ? (pt.label || [pt.city, pt.address].filter(Boolean).join(", ")) : null;
    } else if (deliveryManual) {
      deliveryAddress = deliveryManual;
      if (deal?.contactId) { try { saveDeliveryPoint({ contactId: deal.contactId, address: deliveryManual }); } catch {} }
    }
    return {
      deal,
      contact,
      items: listDealItems(dealId),
      base: deal?.oneCBase || "aminamed",
      contractRef: deal?.oneCContractRef || null,
      deliveryAddress,
      paymentPurposeCode: deal?.oneCPaymentPurpose || "710",
      vatRef: deal?.oneCVatRef || ONE_C_VAT_5,
      comment: deal?.oneCComment || "",
      paymentScheme: deal?.paymentScheme || null,
      postpayDueDate: deal?.postpayDueDate || null,
    };
  };

  // Recall (вернуть из preliminary в draft).
  root.querySelector("[data-deal-order-recall]")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!confirm("Вернуть заказ в черновик? Со склада он исчезнет из предварительных заказов.")) return;
    recallDealOrder(dealId);
    refreshModal();
  });
  // Согласовать на отгрузку (директорское действие).
  root.querySelector("[data-deal-order-approve]")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!confirm("Согласовать заказ на отгрузку?")) return;
    try {
      approveDealOrder(dealId);
      refreshModal();
    } catch (err) {
      alert(err?.message || "Не удалось согласовать заказ");
    }
  });
  // Отозвать согласование.
  root.querySelector("[data-deal-order-revoke]")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!confirm("Отозвать согласование? Заказ вернётся в «Предварительные».")) return;
    try {
      revokeDealOrderApproval(dealId);
      refreshModal();
    } catch (err) {
      alert(err?.message || "Не удалось отозвать");
    }
  });
  // Отгрузить и сформировать накладную (создаёт З-2, переводит заказ в shipped).
  // Авто-печать НЕ запускаем — пользователь сам нажмёт «📄 Открыть накладную» когда нужно.
  root.querySelector("[data-deal-order-ship]")?.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!confirm("Сформировать расходную накладную и закрыть заказ? Заказ перейдёт в «Отгружены».")) return;
    try {
      const deal = Store.get(DEALS, dealId);
      if (!deal) return;
      const itemsNow = listDealItems(dealId);
      if (itemsNow.length === 0) { alert("В заказе нет позиций."); return; }
      const contact = deal.contactId ? Store.get("contacts", deal.contactId) : null;
      const counterpartyText = contact?.name
        ? `${contact.name} · ${deal.title || ""}`
        : (deal.title || "");
      // Динамический импорт — избегаем циклической зависимости warehouse.js ↔ deal_items.js.
      const wh = await import("./warehouse.js");
      const result = wh.createInvoiceFromDeal(dealId, {
        counterpartyContactId: deal.contactId || null,
        counterpartyText,
        items: itemsNow.map((i) => ({
          productId: i.productId,
          qty: Number(i.qty) || 0,
          unitPrice: Number(i.unitPrice) || 0,
        })),
        totalAmount: dealItemsTotal(dealId),
        note: `Накладная по сделке «${deal.title || ""}»`,
      });
      const { doc, posted, postError } = result;
      // Синхронно переводим заказ в shipped.
      markDealOrderShipped(dealId, { invoiceId: doc.id, invoiceNumber: doc.number });
      // Best-effort: создаём реализацию в 1С (черновик). Ошибка не блокирует отгрузку.
      let realizationMsg = "";
      try {
        const args = collectOneCArgs();
        const out = await submitOneCDocument({ ...args, docType: "realization" });
        if (out?.number) realizationMsg = `\n\n✓ Реализация в 1С создана черновиком: № ${out.number}.`;
      } catch (rerr) {
        realizationMsg = `\n\n⚠ Реализацию в 1С создать не удалось (${rerr?.message || String(rerr)}). Создайте её позже кнопкой «Реализация в 1С».`;
      }
      refreshModal();
      if (!posted) {
        alert(`⚠ Накладная № ${doc.number} создана как ЧЕРНОВИК — не удалось провести (FIFO-списание):\n\n${postError}\n\nОткрой документ в Склад → Документы и проведи вручную после докомплекта остатка.${realizationMsg}`);
      } else if (realizationMsg) {
        alert(`📦 Накладная № ${doc.number} проведена.${realizationMsg}`);
      }
    } catch (err) {
      alert("Не удалось сформировать накладную: " + (err?.message || String(err)));
    }
  });
  // Создать документ 1С (счёт / реализацию) headless — реквизиты берём из карточки.
  const submitOneCFromModal = async (docType, btn) => {
    const args = collectOneCArgs();
    if (!args.deal?.contactId) { alert("Сначала выберите клиента в реквизитах 1С."); return; }
    const word = docType === "invoice" ? "Счёт" : "Реализация";
    const origText = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Создаём в 1С…"; }
    try {
      const out = await submitOneCDocument({ ...args, docType });
      refreshModal();
      alert(`✓ ${word} № ${out.number || "(без номера)"} создан(а) черновиком в 1С.\n\nОткройте 1С, проверьте номенклатуру/серии/юр.лицо и проведите.`);
      if (out.unmatched?.length) {
        alert(`⚠ Не вошли в документ (нет привязки к 1С): ${out.unmatched.map((u) => u.name).join(", ")}.`);
      }
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = origText; }
      alert(`Не удалось создать «${word}» в 1С: ` + (err?.message || String(err)));
    }
  };
  root.querySelector("[data-deal-order-1c-invoice]")?.addEventListener("click", (e) => { e.preventDefault(); submitOneCFromModal("invoice", e.currentTarget); });
  root.querySelector("[data-deal-order-1c-realization]")?.addEventListener("click", (e) => { e.preventDefault(); submitOneCFromModal("realization", e.currentTarget); });
  // Открыть/распечатать накладную (когда уже отгружен).
  root.querySelector("[data-deal-order-print]")?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const deal = Store.get(DEALS, dealId);
      const invoiceId = deal?.orderInvoiceId;
      if (!invoiceId) {
        // Fallback: ищем накладную по dealId через warehouse.js.
        const wh = await import("./warehouse.js");
        const inv = wh.findInvoiceByDeal(dealId);
        if (!inv) { alert("Накладная не найдена."); return; }
        const print = await import("./views/warehouse/invoice_print.js");
        print.printInvoiceZ2(inv.id);
        return;
      }
      const print = await import("./views/warehouse/invoice_print.js");
      print.printInvoiceZ2(invoiceId);
    } catch (err) {
      alert("Не удалось открыть накладную: " + (err?.message || String(err)));
    }
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
