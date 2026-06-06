// Pllato CRM — Состав заказа в сделке (модалка) + предварительный заказ для склада.
// UI: компактный summary в карточке сделки → клик «Открыть» → отдельная модалка с таблицей.
// Статусы: draft (черновик) → preliminary (отправлен на склад).

import { Store } from "./store.js";
import { listWarehouseProducts, getWarehouseProduct, productSummary, ensureProductFromOneC, createCrmProductForOneC } from "./warehouse.js";
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
import { listContractsForContact, saveContract } from "./contracts.js";

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
  context: "crm", // "crm" (менеджер — только «Создать заказ») | "warehouse" (склад — жизненный цикл)
  focusItemId: null, // id позиции, на которую направить фокус после refreshModal
  focusField: null, // "product" | "qty" — какое поле строки фокусировать
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
  // Заказ НЕ уходит на склад автоматически. Менеджер собирает позиции в черновике
  // и явно жмёт «Создать заказ» (submitDealOrder) — только тогда он попадает
  // в «Предварительные» на складе. Это требование заказчика: «в СРМ можно
  // только Создать заказ», вся дальнейшая жизнь заказа — на складе.
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
  // Авто-промоция убрана намеренно: заказ уходит на склад только по явному
  // нажатию «Создать заказ» (submitDealOrder). До этого живёт в черновике CRM.
  return updated;
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
 *
 * Авто-промоцию черновиков в preliminary убрали: заказ уходит на склад только
 * по явному «Создать заказ». На boot ничего не «дотягиваем» в preliminary.
 *
 * @returns {{ shipped: number }}
 */
export function reconcileOrderStatuses() {
  let shipped = 0;

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

  if (shipped > 0) {
    console.log(`[reconciler] order statuses synced: shipped=${shipped}`);
  }
  return { shipped };
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
          <input type="text" class="dim-ta-input" placeholder="Код / название — ищем по складу и в 1С…"
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
  // Договор: значение select — 1С-guid (oneCContractRef), либо "crm:"+id (crmContractId), либо "".
  const crmContracts = hasClient ? listContractsForContact(deal.contactId) : [];
  const selectedContract = deal.oneCContractRef
    ? deal.oneCContractRef
    : (deal.crmContractId ? "crm:" + deal.crmContractId : "");
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

  const clientName = escapeHtml(contact?.name || deal.contactName || deal.title || "—");
  let clientBlock;
  if (hasClient && contractorRef) {
    // Клиент сопоставлен с 1С — зелёный статус + кнопка «сменить».
    clientBlock = `<div style="font-weight:600">${clientName} <span style="color:#16a34a;font-weight:400;font-size:12px">✓ сопоставлен с 1С</span> <button type="button" class="btn-ghost btn-sm" data-dim-client-change style="padding:2px 8px;font-size:12px">сменить</button></div>`;
  } else if (hasClient) {
    // Клиент есть, но НЕ сопоставлен с 1С — амбер-предупреждение + три действия.
    clientBlock = `
      <div style="font-weight:600;margin-bottom:6px">${clientName} <span style="color:#d97706;font-weight:400;font-size:12px">⚠ не сопоставлен с 1С</span> <button type="button" class="btn-ghost btn-sm" data-dim-client-change style="padding:2px 8px;font-size:12px">сменить</button></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
        <button type="button" class="btn-ghost btn-sm" data-dim-1c-find style="white-space:nowrap">🔍 Найти в 1С</button>
        <button type="button" class="btn-ghost btn-sm" data-dim-1c-create style="white-space:nowrap">➕ Завести в 1С</button>
        <button type="button" class="btn-ghost btn-sm" data-dim-1c-similar style="white-space:nowrap">🔎 Похожие в 1С</button>
      </div>
      <div id="dim-1c-find-msg" style="font-size:12px;color:#92400e;margin-bottom:6px;display:none"></div>
      <div id="dim-contractor-box" style="display:none;margin-bottom:6px">
        <input id="dim-contractor-search" type="text" value="${escapeAttr(contact?.name || "")}" placeholder="Поиск контрагента в 1С по названию…" autocomplete="off" style="${REQ_FIELD_STYLE};margin-bottom:6px">
        <div id="dim-contractor-results" style="max-height:170px;overflow:auto;border:1px solid var(--border,#eee);border-radius:8px;display:none"></div>
      </div>
    `;
  } else {
    clientBlock = `
      <div style="background:#fff3e0;border:1px solid #f59e0b;border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:12px;color:#92400e">⚠ Заказ не привязан к клиенту. Без клиента счёт в 1С не создать.</div>
      <input id="dim-client-search" type="text" value="" placeholder="Найти клиента по названию или БИН…" autocomplete="off" style="${REQ_FIELD_STYLE};margin-bottom:6px">
      <div id="dim-client-results" style="max-height:170px;overflow:auto;border:1px solid var(--border,#eee);border-radius:8px;display:none"></div>
      <button type="button" class="btn-ghost btn-sm" id="dim-client-new-toggle" style="margin-top:6px;padding:4px 10px;font-size:12px">➕ Создать клиента в CRM</button>
      <div id="dim-client-new-form" style="display:none;margin-top:8px;border:1px solid var(--border,#eee);border-radius:8px;padding:10px;background:var(--surface-2,#fafafa)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="grid-column:1 / -1"><label style="${REQ_LABEL_STYLE}">Наименование / ФИО *</label><input id="dim-nc-name" type="text" autocomplete="off" placeholder="ТОО «…», больница, ИП или ФИО" style="${REQ_FIELD_STYLE}"></div>
          <div><label style="${REQ_LABEL_STYLE}">Телефон</label><input id="dim-nc-phone" type="text" autocomplete="off" placeholder="+7 …" style="${REQ_FIELD_STYLE}"></div>
          <div><label style="${REQ_LABEL_STYLE}">Email</label><input id="dim-nc-email" type="text" autocomplete="off" placeholder="name@mail.kz" style="${REQ_FIELD_STYLE}"></div>
          <div><label style="${REQ_LABEL_STYLE}">БИН / ИИН</label><input id="dim-nc-bin" type="text" autocomplete="off" inputmode="numeric" placeholder="12 цифр (для поиска в 1С)" style="${REQ_FIELD_STYLE}"></div>
          <div><label style="${REQ_LABEL_STYLE}">Контактное лицо</label><input id="dim-nc-person" type="text" autocomplete="off" placeholder="кто принимает заказ" style="${REQ_FIELD_STYLE}"></div>
          <div style="grid-column:1 / -1"><label style="${REQ_LABEL_STYLE}">Адрес доставки</label><input id="dim-nc-address" type="text" autocomplete="off" placeholder="город, улица, дом — сохранится в CRM" style="${REQ_FIELD_STYLE}"></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button type="button" class="btn-primary btn-sm" id="dim-nc-save">Создать и привязать</button>
          <button type="button" class="btn-ghost btn-sm" id="dim-nc-cancel">Отмена</button>
        </div>
        <div id="dim-nc-msg" style="font-size:12px;color:#dc2626;margin-top:6px;display:none"></div>
      </div>
    `;
  }

  const deliveryHint = `<div style="font-size:11px;color:var(--text-muted,#888);margin-bottom:6px">адрес сохранится у клиента в CRM (в 1С адресов нет)</div>`;
  const deliveryBlock = deliveryPoints.length
    ? `
      ${deliveryHint}
      <select id="dim-onec-delivery-select" style="${REQ_FIELD_STYLE};margin-bottom:6px">
        ${deliveryPoints.map((p) => `<option value="${escapeAttr(p.id)}"${primaryPoint && p.id === primaryPoint.id ? " selected" : ""}>${escapeHtml(p.label || [p.city, p.address].filter(Boolean).join(", "))}</option>`).join("")}
        <option value="__manual__">➕ Другой адрес</option>
      </select>
      <input id="dim-onec-delivery" type="text" value="" placeholder="город, адрес — сохранится в CRM" style="${REQ_FIELD_STYLE};display:none">
      <button type="button" class="btn-ghost btn-sm" id="dim-delivery-add" style="margin-top:6px;padding:4px 10px;font-size:12px">➕ Добавить адрес</button>
    `
    : `
      ${deliveryHint}
      <input id="dim-onec-delivery" type="text" value="${escapeAttr(defaultDelivery)}" placeholder="город, адрес — сохранится в CRM" style="${REQ_FIELD_STYLE}">
      <button type="button" class="btn-ghost btn-sm" id="dim-delivery-add" style="margin-top:6px;padding:4px 10px;font-size:12px">➕ Добавить адрес</button>
    `;

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
          <label style="${REQ_LABEL_STYLE}">Договор</label>
          <select id="dim-onec-contract" style="${REQ_FIELD_STYLE}">
            <option value="">— без договора —</option>
            ${contracts.length ? `<optgroup label="Из 1С">${contracts.map((c) => `<option value="${escapeAttr(c.ref)}"${c.ref === selectedContract ? " selected" : ""}>${escapeHtml(c.label)}</option>`).join("")}</optgroup>` : ""}
            ${crmContracts.length ? `<optgroup label="В CRM (заведёт Асем в 1С)">${crmContracts.map((c) => { const v = "crm:" + c.id; const lbl = (c.title || c.number || "договор") + " (CRM · заведёт Асем)"; return `<option value="${escapeAttr(v)}"${v === selectedContract ? " selected" : ""}>${escapeHtml(lbl)}</option>`; }).join("")}</optgroup>` : ""}
          </select>
          <button type="button" class="btn-ghost btn-sm" id="dim-contract-create" style="margin-top:6px;padding:4px 10px;font-size:12px">➕ Создать договор (CRM)</button>
          ${contractorRef && contracts.length === 0 ? `<div style="font-size:11px;color:var(--text-muted,#888);margin-top:4px">Договоров клиента в 1С не найдено — обновите «Договоры» в «1С интеграция» или создайте договор в CRM.</div>` : ""}
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
              <div class="dim-empty-text">Нажми «➕ Добавить позицию». Поиск товара идёт по складу и сразу по номенклатуре 1С; можно завести новый код.</div>
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
          ${editable ? `
            <button type="button" class="btn-ghost" data-deal-items-add style="width:100%;margin-top:10px;padding:10px;font-size:14px">➕ Добавить позицию</button>
          ` : ""}
        </div>

        <footer class="dim-footer">
          <div class="dim-footer-left"></div>
          <div class="dim-footer-right">
            ${renderFooterActions(deal, items, modalState.context)}
            <button type="button" class="btn-ghost" data-dim-close>Закрыть</button>
          </div>
        </footer>
      </div>
    </div>
  `;
}

// Действия в модалке зависят от контекста:
//   context="crm"      — менеджер/поле: ТОЛЬКО «Создать заказ» (draft→preliminary).
//                        Дальше заказ живёт на складе — здесь только статус.
//   context="warehouse"— склад: последовательный жизненный цикл,
//                        Согласование → Счёт в 1С → Отгрузка (ОДНА primary за раз).
// Реквизиты 1С всегда видны выше; здесь только действия.
function renderFooterActions(deal, items, context = "crm") {
  if (context === "crm") return renderCrmFooterActions(deal, items);
  return renderWarehouseFooterActions(deal, items);
}

// CRM/поле: единственное действие менеджера — «Создать заказ». Дальше — на складе.
function renderCrmFooterActions(deal, items) {
  const status = getDealOrderStatus(deal);
  const hasClient = !!deal.contactId;

  if (status === ORDER_STATUS_DRAFT) {
    let disabled = "";
    let title = "Отправить заказ на склад в «Предварительные»";
    if (items.length === 0) { disabled = " disabled"; title = "Добавьте хотя бы одну позицию"; }
    else if (!hasClient) { disabled = " disabled"; title = "Сначала выберите клиента в реквизитах 1С (защита от ошибок)"; }
    return `
      <span class="dim-footer-note" style="font-size:12px;color:var(--text-muted,#888);margin-right:8px">После создания заказ уйдёт на склад в «Предварительные».</span>
      <button type="button" class="btn-primary" data-deal-order-create title="${escapeAttr(title)}"${disabled}>✓ Создать заказ</button>
    `;
  }
  // Уже создан/в работе — менеджер видит только статус, без действий цикла.
  let note = "";
  if (status === ORDER_STATUS_PRELIMINARY) {
    note = `<span class="dim-footer-note" style="font-size:12.5px;color:#6366f1">✓ Заказ создан — ждёт согласования на складе.</span>`;
  } else if (status === ORDER_STATUS_APPROVED) {
    note = `<span class="dim-footer-note" style="font-size:12.5px;color:#d97706">Согласован на складе — счёт и отгрузка делаются на складе.</span>`;
  } else if (status === ORDER_STATUS_PAYMENT_PENDING) {
    note = `<span class="dim-footer-note" style="font-size:12.5px;color:#a855f7">Ожидает оплату (контроль на складе).</span>`;
  } else if (status === ORDER_STATUS_SHIPPED) {
    note = `<span class="dim-footer-note" style="font-size:12.5px;color:#16a34a">✅ Отгружен${deal.orderInvoiceNumber ? ` · накладная № ${escapeHtml(deal.orderInvoiceNumber)}` : ""}.</span>`;
  }
  const recall = status === ORDER_STATUS_PRELIMINARY
    ? `<button type="button" class="btn-ghost btn-sm" data-deal-order-recall title="Вернуть в черновик, чтобы поправить состав">↩ Вернуть в черновик</button>`
    : "";
  return `${note}${recall}`;
}

// Склад: полный жизненный цикл (последовательно, ОДНА primary за раз).
function renderWarehouseFooterActions(deal, items) {
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

// Живой поиск товара в строке заказа: одновременно по складу (мгновенно) и по
// номенклатуре 1С (debounced fetch). Плюс опция «создать новый код в CRM».
// Требование заказчика: «Поиск товара сразу должен идти по 1с».
const TA_GROUP_STYLE = "padding:5px 10px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--text-muted,#888);background:var(--surface-2,#f7f7f8)";
const TA_NOTE_STYLE = "padding:7px 10px;font-size:11.5px;color:var(--text-muted,#888)";
const TA_1C_ITEM_STYLE = "display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 10px;cursor:pointer;border-bottom:1px solid var(--border,#f0f0f0)";
const TA_CREATE_STYLE = "padding:8px 10px;cursor:pointer;font-size:12.5px;color:#2563eb;border-top:1px solid var(--border,#eee);background:var(--surface,#fff)";

function setupRowProductSearch(input, list, opts) {
  const { localProducts, baseKey, entity, onPick } = opts;
  let token = 0;
  // Состояние блока 1С: idle|loading|done|error.
  const st = { onec: [], onecState: "idle", onecQ: "" };

  const close = () => { list.hidden = true; };

  const localItemHtml = (p) => {
    const stock = productSummary(p.id)?.total || 0;
    return `
      <div class="dim-ta-item" data-product-id="${escapeAttr(p.id)}" role="option">
        <div class="dim-ta-item-main">
          <span class="dim-ta-sku">${escapeHtml(p.sku || "—")}</span>
          <span class="dim-ta-name">${escapeHtml(p.name)}</span>
        </div>
        <div class="dim-ta-item-stock">${fmtNum(stock)} ${escapeHtml(p.unit || "шт")}</div>
      </div>`;
  };

  const buildHtml = (q) => {
    let html = "";
    const loc = filterProductsByQuery(localProducts, q).slice(0, 8);
    // Локальные refs, чтобы не дублировать те же позиции из 1С.
    const localRefs = new Set(localProducts.map((p) => p._1c_ref_key).filter(Boolean));

    if (loc.length) {
      html += `<div style="${TA_GROUP_STYLE}">На складе</div>` + loc.map(localItemHtml).join("");
    }

    if (q.length >= 2) {
      // Блок 1С — показываем только если запрос совпадает с тем, что искали.
      if (st.onecState === "loading") {
        html += `<div style="${TA_NOTE_STYLE}">Ищем в 1С…</div>`;
      } else if (st.onecState === "error") {
        html += `<div style="${TA_NOTE_STYLE}">⚠ 1С недоступна — можно создать код в CRM.</div>`;
      } else if (st.onecState === "done" && st.onecQ === q) {
        const fresh = st.onec.filter((x) => !localRefs.has(x.ref));
        if (fresh.length) {
          html += `<div style="${TA_GROUP_STYLE}">В 1С — привязать</div>`;
          html += fresh.map((x) => `
            <div class="dim-ta-1c" data-ref="${escapeAttr(x.ref)}" data-code="${escapeAttr(x.code || "")}" data-name="${escapeAttr(x.name || "")}" data-unit="${escapeAttr(x.unit || "")}" data-vat="${escapeAttr(x.vat || "")}" style="${TA_1C_ITEM_STYLE}">
              <span style="font-size:12.5px;color:var(--text,#111)">${escapeHtml(x.name || "(без названия)")} <span style="opacity:.5">${escapeHtml(x.code || "")}</span></span>
              <span style="font-size:11px;color:#2563eb;white-space:nowrap">из 1С →</span>
            </div>`).join("");
        } else {
          html += `<div style="${TA_NOTE_STYLE}">В 1С по «${escapeHtml(q)}» не найдено.</div>`;
        }
      }
      // Всегда даём создать новый код в CRM (Асем заведёт в 1С).
      html += `<div class="dim-ta-create" data-create-q="${escapeAttr(q)}" style="${TA_CREATE_STYLE}">➕ Создать код «${escapeHtml(q)}» в CRM <span style="opacity:.6">(Асем заведёт в 1С)</span></div>`;
    } else if (loc.length === 0) {
      html += `<div class="dim-ta-empty">Введите 2+ символа — ищем по складу и по 1С</div>`;
    }
    return html;
  };

  const render = (q) => {
    list.innerHTML = buildHtml(q);
    list.hidden = false;
    bindClicks();
  };

  const bindClicks = () => {
    // Локальный товар.
    list.querySelectorAll(".dim-ta-item").forEach((el) => {
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const pid = el.dataset.productId;
        if (pid) onPick(pid);
        close();
      });
    });
    // Привязка позиции из 1С.
    list.querySelectorAll(".dim-ta-1c").forEach((el) => {
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        try {
          const prod = ensureProductFromOneC({
            ref: el.dataset.ref,
            code: el.dataset.code,
            name: el.dataset.name,
            unitRef: el.dataset.unit || null,
            vatRef: el.dataset.vat || null,
            base: baseKey,
          });
          if (prod?.id) onPick(prod.id);
        } catch (err) {
          alert("Не удалось привязать товар из 1С: " + (err?.message || String(err)));
        }
        close();
      });
    });
    // Создать новый код в CRM (Асем заведёт в 1С).
    list.querySelectorAll(".dim-ta-create").forEach((el) => {
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const q = el.dataset.createQ || "";
        const codeGuess = /^[\w\-./]+$/.test(q) ? q : "";
        const code = (prompt("Код (SKU) нового товара:", codeGuess) || "").trim();
        if (!code) { close(); return; }
        const name = (prompt("Название товара:", q) || "").trim();
        if (!name) { close(); return; }
        try {
          const prod = createCrmProductForOneC({ sku: code, name, base: baseKey, entity });
          if (prod?.id) onPick(prod.id);
        } catch (err) {
          alert(err?.message || "Не удалось создать товар");
        }
        close();
      });
    });
  };

  const runOneCSearch = debounce((q) => {
    if (q.length < 2) return;
    const my = ++token;
    st.onecState = "loading";
    st.onecQ = q;
    render(q);
    apiFetch("/api/crm/1c/nomenclature/search?q=" + encodeURIComponent(q) + "&base=" + encodeURIComponent(baseKey || "aminamed"))
      .then((r) => {
        if (my !== token) return; // устарел
        st.onec = r?.results || [];
        st.onecState = "done";
        st.onecQ = q;
        if (input.value.trim() === q) render(q);
      })
      .catch(() => {
        if (my !== token) return;
        st.onecState = "error";
        if (input.value.trim() === q) render(q);
      });
  }, 350);

  input.addEventListener("focus", () => render(input.value.trim()));
  input.addEventListener("input", () => {
    const q = input.value.trim();
    st.onecState = "idle";
    render(q);
    runOneCSearch(q);
  });
  input.addEventListener("blur", () => setTimeout(close, 180));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { close(); input.blur(); }
  });
}

// === Управление модалкой ===

// Сообщаем складскому канбану, что заказы изменились (если он открыт под модалкой).
// ВАЖНО: слушатель в warehouse/index.js рендерит warehouse в #mainView без проверки
// текущего роутинга — поэтому диспатчим ТОЛЬКО в складском контексте, иначе из CRM
// мы бы случайно затёрли вид сделок складским канбаном.
function notifyWarehouseRefresh() {
  if (modalState.context !== "warehouse") return;
  try { window.dispatchEvent(new CustomEvent("pllato:warehouse-refresh")); } catch {}
}

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

  // Добавить позицию: создаём пустую строку и после перерисовки фокусируем её
  // typeahead товара (товар → кол-во → цена → сумма — направляем менеджера).
  root.querySelector("[data-deal-items-add]")?.addEventListener("click", (e) => {
    e.preventDefault();
    const newItem = createDealItem(dealId, {});
    modalState.focusItemId = newItem?.id || null;
    modalState.focusField = "product";
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

  // Живой поиск товара в строках: по складу + по номенклатуре 1С + создание кода.
  const orderBaseKey = Store.get(DEALS, dealId)?.oneCBase || "aminamed";
  root.querySelectorAll(".dim-typeahead").forEach((wrap) => {
    const itemId = wrap.dataset.itemId;
    const input = wrap.querySelector(".dim-ta-input");
    const list = wrap.querySelector(".dim-ta-list");
    if (!input || !list || !itemId) return;
    setupRowProductSearch(input, list, {
      localProducts: products,
      baseKey: orderBaseKey,
      onPick: (productId) => {
        updateDealItem(itemId, { productId });
        // После выбора товара ведём фокус в поле «Кол-во» этой же строки.
        modalState.focusItemId = itemId;
        modalState.focusField = "qty";
        refreshModal();
      },
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
  // Договор: значение может быть 1С-guid, "crm:"+id или "" (без договора).
  // В счёт уходит только oneCContractRef (1С); CRM-договор хранится отдельно
  // и 1С НЕ отправляется (Асем заведёт вручную).
  root.querySelector("#dim-onec-contract")?.addEventListener("change", (e) => {
    const v = e.target.value || "";
    if (v.startsWith("crm:")) {
      persistDeal({ oneCContractRef: null, crmContractId: v.slice(4) });
    } else if (v) {
      persistDeal({ oneCContractRef: v, crmContractId: null });
    } else {
      persistDeal({ oneCContractRef: null, crmContractId: null });
    }
    refreshModal();
  });
  // Создать договор в CRM (Асем позже заведёт его в 1С).
  root.querySelector("#dim-contract-create")?.addEventListener("click", (e) => {
    e.preventDefault();
    const deal = Store.get(DEALS, dealId);
    if (!deal?.contactId) { alert("Сначала выберите клиента."); return; }
    const name = (prompt("Название/номер договора:") || "").trim();
    if (!name) return;
    try {
      // saveContract валидирует по number/title — кладём введённое и туда, и в name.
      const created = saveContract({ contactId: deal.contactId, name, title: name });
      if (created?.id) persistDeal({ oneCContractRef: null, crmContractId: created.id });
      refreshModal();
    } catch (err) {
      alert(err?.message || "Не удалось создать договор");
    }
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
  // «➕ Добавить адрес» — сохраняет адрес в адресную книгу клиента (CRM, в 1С
  // адресов нет). Если поле ввода ещё скрыто (выбрана сохранённая точка) —
  // первый клик показывает ручной ввод; когда в нём есть текст — сохраняем.
  root.querySelector("#dim-delivery-add")?.addEventListener("click", (e) => {
    e.preventDefault();
    const sel = root.querySelector("#dim-onec-delivery-select");
    const inp = root.querySelector("#dim-onec-delivery");
    // Шаг 1: ручной ввод ещё не открыт — открыть и сфокусировать.
    if (inp && (inp.style.display === "none") && (!inp.value || !inp.value.trim())) {
      if (sel) sel.value = "__manual__";
      inp.style.display = "block";
      inp.focus();
      return;
    }
    // Шаг 2: в ручном вводе есть текст — сохранить адрес у клиента.
    const cid = Store.get(DEALS, dealId)?.contactId;
    const val = (inp?.value || "").trim();
    if (!cid) { alert("Сначала выберите клиента — адрес сохраняется в его карточке."); return; }
    if (!val) {
      if (sel) sel.value = "__manual__";
      if (inp) { inp.style.display = "block"; inp.focus(); }
      alert("Введите адрес доставки в поле выше, затем нажмите «Добавить адрес».");
      return;
    }
    try {
      saveDeliveryPoint({ contactId: cid, address: val });
      refreshModal(); // адрес появится в выпадашке точек доставки клиента
    } catch (err) { alert(err?.message || "Не удалось сохранить адрес"); }
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

  // ➕ Создать полного клиента в CRM «на месте» (когда в 1С/CRM не нашёлся).
  root.querySelector("#dim-client-new-toggle")?.addEventListener("click", () => {
    const form = root.querySelector("#dim-client-new-form");
    if (!form) return;
    const show = form.style.display === "none";
    form.style.display = show ? "" : "none";
    if (show) {
      const q = (root.querySelector("#dim-client-search")?.value || "").trim();
      const nameInp = root.querySelector("#dim-nc-name");
      if (nameInp && q && !nameInp.value) nameInp.value = q;
      nameInp?.focus();
    }
  });
  root.querySelector("#dim-nc-cancel")?.addEventListener("click", () => {
    const form = root.querySelector("#dim-client-new-form");
    if (form) form.style.display = "none";
  });
  root.querySelector("#dim-nc-save")?.addEventListener("click", () => {
    const val = (id) => (root.querySelector(id)?.value || "").trim();
    const name = val("#dim-nc-name");
    const phone = val("#dim-nc-phone");
    const email = val("#dim-nc-email");
    const bin = val("#dim-nc-bin").replace(/\D+/g, "");
    const person = val("#dim-nc-person");
    const address = val("#dim-nc-address");
    const msgEl = root.querySelector("#dim-nc-msg");
    const fail = (t) => { if (msgEl) { msgEl.style.display = ""; msgEl.textContent = t; } };
    if (!name) { fail("Укажите наименование или ФИО клиента."); root.querySelector("#dim-nc-name")?.focus(); return; }
    if (bin && bin.length !== 12) { fail("БИН/ИИН должен содержать 12 цифр (или оставьте поле пустым)."); root.querySelector("#dim-nc-bin")?.focus(); return; }
    let created;
    try {
      created = Store.create("contacts", {
        name,
        phone,
        email,
        bin: bin || "",
        company: name,
        contactPerson: person || "",
        _1c_address: address || "",
        source: "crm-manual",
      });
    } catch (err) { fail(err?.message || "Не удалось создать контакт"); return; }
    if (address) { try { saveDeliveryPoint({ contactId: created.id, address }); } catch {} }
    persistDeal({ contactId: created.id, contactName: name });
    refreshModal();
  });

  // === Сопоставление клиента с 1С (когда контакт есть, но _1c_ref_key нет) ===
  // У контрагентов 1С нет телефона в OData → ищем по БИН/ИИН (find) или по названию.
  const dealNow = Store.get(DEALS, dealId);
  const contactNow = dealNow?.contactId ? Store.get("contacts", dealNow.contactId) : null;
  const oneCBaseNow = () => Store.get(DEALS, dealId)?.oneCBase || "aminamed";
  const findMsgEl = root.querySelector("#dim-1c-find-msg");
  const contractorBox = root.querySelector("#dim-contractor-box");
  const contractorSearch = root.querySelector("#dim-contractor-search");
  const contractorResults = root.querySelector("#dim-contractor-results");

  const withBusy = async (btn, fn) => {
    const orig = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "…"; }
    try { await fn(); }
    catch (err) { alert(err?.message || String(err)); }
    finally { if (btn) { btn.disabled = false; btn.textContent = orig; } }
  };

  // Воркер для базы Аминамед обновляет _1c_ref_key только в D1 — локальный Store
  // об этом не знает, поэтому штампуем его сами, иначе бейдж «не сопоставлен»
  // не сменится до следующей полной синхронизации. Для других баз реф контакта
  // не храним (контрагент резолвится вживую по БИН при создании документа).
  const stampContractorRef = (cid, refKey) => {
    if (!cid || !refKey || oneCBaseNow() !== "aminamed") return;
    try { Store.update("contacts", cid, { _1c_ref_key: refKey }); } catch {}
  };

  // 🔎 Похожие: поиск контрагента 1С по названию + привязка по выбору.
  const runContractorSearch = async (text) => {
    if (!contractorResults) return;
    const q = String(text || "").trim();
    if (q.length < 2) { contractorResults.style.display = "none"; contractorResults.innerHTML = ""; return; }
    contractorResults.style.display = "";
    contractorResults.innerHTML = '<div style="padding:8px 10px;font-size:11px;color:#888">Ищем в 1С…</div>';
    try {
      const r = await apiFetch("/api/crm/1c/contractors/search?q=" + encodeURIComponent(q) + "&base=" + encodeURIComponent(oneCBaseNow()));
      const found = r?.results || [];
      if (!found.length) { contractorResults.innerHTML = '<div style="padding:8px 10px;font-size:11px;color:#888">Ничего не найдено в 1С</div>'; return; }
      contractorResults.innerHTML = found.map((x) => `<button type="button" class="dim-contractor-pick" data-ref="${escapeAttr(x.ref)}" style="display:flex;justify-content:space-between;gap:10px;width:100%;text-align:left;border:none;border-bottom:1px solid var(--border,#f0f0f0);background:none;padding:8px 10px;cursor:pointer;color:var(--text,#111);font:inherit"><span>${escapeHtml(x.name || "(без названия)")}</span><span style="color:var(--text-muted,#888);font-size:11.5px;white-space:nowrap">${escapeHtml(x.bin || "")}</span></button>`).join("");
      contractorResults.querySelectorAll(".dim-contractor-pick").forEach((b) => b.addEventListener("click", () => withBusy(b, async () => {
        const cid = Store.get(DEALS, dealId)?.contactId;
        const res = await apiFetch("/api/crm/1c/contractors/map", { method: "POST", body: { contactId: cid, refKey: b.dataset.ref, base: oneCBaseNow() } });
        stampContractorRef(cid, res?.ref_key || b.dataset.ref);
        refreshModal();
      })));
    } catch (err) {
      contractorResults.innerHTML = '<div style="padding:8px 10px;color:#dc2626;font-size:11px">Ошибка: ' + escapeHtml(err?.message || String(err)) + '</div>';
    }
  };

  const debouncedContractorSearch = debounce((v) => runContractorSearch(v), 300);
  contractorSearch?.addEventListener("input", (e) => debouncedContractorSearch(e.target.value));

  // 🔍 Найти в 1С — по БИН/ИИН. Worker сам штампует _1c_ref_key (для aminamed).
  root.querySelector("[data-dim-1c-find]")?.addEventListener("click", (e) => {
    e.preventDefault();
    withBusy(e.currentTarget, async () => {
      const cid = Store.get(DEALS, dealId)?.contactId;
      const r = await apiFetch("/api/crm/1c/contractors/find", { method: "POST", body: { contactId: cid, base: oneCBaseNow() } });
      if (r?.found) {
        stampContractorRef(cid, r?.ref_key);
        refreshModal();
      } else if (findMsgEl) {
        findMsgEl.style.display = "";
        findMsgEl.textContent = "По БИН не найден — выберите из похожих или заведите.";
        // Авто-открываем «похожие» и ищем по имени контакта.
        if (contractorBox) contractorBox.style.display = "";
        const name = contactNow?.name || "";
        if (contractorSearch) contractorSearch.value = name;
        runContractorSearch(name);
      }
    });
  });

  // ➕ Завести в 1С — создать контрагента в 1С.
  root.querySelector("[data-dim-1c-create]")?.addEventListener("click", (e) => {
    e.preventDefault();
    withBusy(e.currentTarget, async () => {
      const cid = Store.get(DEALS, dealId)?.contactId;
      const r = await apiFetch("/api/crm/1c/contractors/create", { method: "POST", body: { contactId: cid, base: oneCBaseNow() } });
      stampContractorRef(cid, r?.ref_key);
      refreshModal();
      const base = oneCBaseNow();
      if (r?.ref_key && base === "aminamed") {
        alert(r?.already_exists ? "✓ Клиент уже есть в 1С — привязан." : "✓ Клиент заведён в 1С и сопоставлен.");
      } else if (r?.ref_key) {
        alert("✓ Клиент заведён в выбранной базе 1С. (Метка сопоставления хранится только для базы Аминамед; в других базах контрагент подтянется по БИН при создании счёта.)");
      }
    });
  });

  // 🔎 Похожие в 1С — тоггл блока поиска (префилл — имя контакта).
  root.querySelector("[data-dim-1c-similar]")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!contractorBox) return;
    const show = contractorBox.style.display === "none" || !contractorBox.style.display;
    contractorBox.style.display = show ? "" : "none";
    if (show && contractorSearch) {
      if (!contractorSearch.value) contractorSearch.value = contactNow?.name || "";
      contractorSearch.focus();
      if (contractorSearch.value.trim().length >= 2) runContractorSearch(contractorSearch.value);
    }
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

  // «Создать заказ» (CRM/поле): draft→preliminary, заказ уходит на склад.
  // Защита от дурачка: без позиций и без клиента кнопка disabled, но дублируем проверку.
  root.querySelector("[data-deal-order-create]")?.addEventListener("click", (e) => {
    e.preventDefault();
    const d = Store.get(DEALS, dealId);
    if (!d?.contactId) { alert("Сначала выберите клиента в реквизитах 1С — без клиента заказ не создать."); return; }
    const orderItems = listDealItems(dealId);
    if (orderItems.length === 0) { alert("Добавьте хотя бы одну позицию."); return; }
    // Предупреждение: позиции без привязки к 1С не войдут в счёт, пока их не сопоставят.
    const unmatched = orderItems.filter((i) => {
      const p = i.productId ? Store.get("warehouse_products", i.productId) : null;
      return !p || !p._1c_ref_key;
    });
    if (unmatched.length) {
      const names = unmatched.slice(0, 6).map((i) => {
        const p = i.productId ? Store.get("warehouse_products", i.productId) : null;
        return "• " + ((p?.sku ? p.sku + " · " : "") + (p?.name || i.name || "позиция"));
      }).join("\n");
      const more = unmatched.length > 6 ? `\n…и ещё ${unmatched.length - 6}` : "";
      const ok = confirm(
        `⚠ ${unmatched.length} из ${orderItems.length} позиций не привязаны к 1С:\n${names}${more}\n\n` +
        "Эти позиции НЕ войдут в счёт 1С, пока их не сопоставят (выбрать товар из группы «В 1С» в поиске или привязать на складе).\n\n" +
        "Всё равно создать заказ?"
      );
      if (!ok) return;
    }
    try {
      submitDealOrder(dealId);
      refreshModal();
      notifyWarehouseRefresh();
      alert("✓ Заказ создан и отправлен на склад в «Предварительные».\n\nДальнейшие шаги (согласование, счёт в 1С, отгрузка) делаются на складе.");
    } catch (err) {
      alert(err?.message || "Не удалось создать заказ");
    }
  });
  // Recall (вернуть из preliminary в draft).
  root.querySelector("[data-deal-order-recall]")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!confirm("Вернуть заказ в черновик? Со склада он исчезнет из предварительных заказов.")) return;
    recallDealOrder(dealId);
    refreshModal();
    notifyWarehouseRefresh();
  });
  // Согласовать на отгрузку (директорское действие).
  root.querySelector("[data-deal-order-approve]")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!confirm("Согласовать заказ на отгрузку?")) return;
    try {
      approveDealOrder(dealId);
      refreshModal();
      notifyWarehouseRefresh();
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
      notifyWarehouseRefresh();
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
      notifyWarehouseRefresh();
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
      notifyWarehouseRefresh();
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

  // Направленный фокус после refreshModal (товар → кол-во).
  if (modalState.focusItemId) {
    const fid = modalState.focusItemId;
    const field = modalState.focusField;
    modalState.focusItemId = null;
    modalState.focusField = null;
    let target = null;
    if (field === "qty") {
      target = root.querySelector(`input[data-deal-item-field="qty"][data-id="${fid}"]`);
    } else {
      target = root.querySelector(`[data-deal-item-typeahead="${fid}"]`);
    }
    if (target) {
      target.focus();
      if (typeof target.select === "function") target.select();
    }
  }

  // Escape для закрытия модалки
  if (!modalState._escHandler) {
    modalState._escHandler = (e) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", modalState._escHandler);
  }
}

export function openDealItemsModal(dealId, context = "crm") {
  if (modalState.mountEl) closeDealItemsModal();
  modalState.dealId = dealId;
  modalState.context = context === "warehouse" ? "warehouse" : "crm";
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
  const wasWarehouse = modalState.context === "warehouse";
  modalState.dealId = null;
  modalState.context = "crm";
  // Если окно открывалось со склада — обновим канбан предзаказов под ним.
  // Диспатчим напрямую: notifyWarehouseRefresh() уже бы видел сброшенный контекст.
  if (wasWarehouse) {
    try { window.dispatchEvent(new CustomEvent("pllato:warehouse-refresh")); } catch {}
  }
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
