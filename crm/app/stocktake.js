// Pllato CRM — Инвентаризация склада.
// Жизненный цикл: draft → pending → approved (с автокорректировкой остатков)
//                                  → rejected (с комментарием).
//
// Структура записи в Store.list("stocktakes"):
//   {
//     id, number, date, entity, scope, scopeFilter,
//     status, createdBy, createdAt, startedAt,
//     submittedAt, submittedBy, submittedByName,
//     approvedAt, approvedBy, approvedByName, approvalComment,
//     rejectedAt, rejectedBy, rejectionReason,
//     notes,
//     items: [{ productId, sku, name, unit, expectedQty, actualQty, diff, reason, counted }],
//     totals: { productsTotal, productsCounted, shortageQty, shortageAmount, surplusQty, surplusAmount },
//     appliedDocumentIds: []
//   }

import { Store } from "./store.js";
import { listWarehouseProducts, productSummary, getWarehouseProduct } from "./warehouse.js";
import { currentEmployee } from "./employees.js";

const COLLECTION = "stocktakes";

export const STOCKTAKE_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

// Причины списания недостачи.
export const SHORTAGE_REASONS = [
  { id: "damage", label: "Порча" },
  { id: "natural", label: "Естественная убыль" },
  { id: "theft", label: "Хищение" },
  { id: "expired", label: "Истёк срок годности" },
  { id: "mistake", label: "Ошибка учёта" },
  { id: "other", label: "Другое" },
];

// ---------- утилиты ----------
function asText(v) { return String(v || "").trim(); }
function toNum(v, f = 0) { const n = Number(v); return Number.isFinite(n) ? n : f; }

let _numCounter = 0;
function nextStocktakeNumber() {
  const year = new Date().getFullYear();
  const existing = Store.list(COLLECTION);
  // Считаем номер от количества существующих инвентаризаций.
  _numCounter = Math.max(_numCounter, existing.length);
  _numCounter += 1;
  return `STK-${year}-${String(_numCounter).padStart(4, "0")}`;
}

// ---------- список / получение ----------
export function listStocktakes(filters = {}) {
  const status = asText(filters.status);
  return Store.list(COLLECTION)
    .filter((s) => !s.isDeleted)
    .filter((s) => !status || s.status === status)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function getStocktake(id) {
  return id ? Store.get(COLLECTION, id) : null;
}

// ---------- создание ----------
/**
 * Создать новую инвентаризацию: набираем товары по фильтру и фиксируем
 * expectedQty (системные остатки на момент старта).
 *
 * @param {object} opts
 *   - entity: 'ИП' | 'ТОО' | '' (все)
 *   - scope: 'all' | 'category'
 *   - scopeFilter: имя категории (если scope='category')
 *   - notes
 */
export function createStocktake(opts = {}) {
  const me = currentEmployee();
  const now = Date.now();
  const entity = asText(opts.entity);
  const scope = opts.scope === "category" ? "category" : "all";
  const scopeFilter = scope === "category" ? asText(opts.scopeFilter) : "";

  // Набираем товары по фильтру.
  const products = listWarehouseProducts({
    includeArchived: false,
    entity,
    category: scopeFilter,
  });

  const items = products.map((p) => {
    const expected = Number(p.summary?.total || productSummary(p.id)?.total || 0);
    return {
      productId: p.id,
      sku: p.sku || "",
      name: p.name || "",
      unit: p.unit || "шт",
      entity: p.entity || "",
      category: p.category || "",
      expectedQty: expected,
      actualQty: null,
      diff: null,
      reason: "",
      counted: false,
    };
  });

  const doc = Store.create(COLLECTION, {
    number: nextStocktakeNumber(),
    date: new Date().toISOString().slice(0, 10),
    entity,
    scope,
    scopeFilter,
    status: STOCKTAKE_STATUS.DRAFT,
    createdBy: me?.id || null,
    createdByName: me?.name || me?.email || "",
    startedAt: now,
    notes: asText(opts.notes),
    items,
    totals: computeTotals(items),
    appliedDocumentIds: [],
  });
  return doc;
}

// ---------- обновление позиции (вписать факт) ----------
export function setActualQty(stocktakeId, productId, actualQty, reason = "") {
  const st = getStocktake(stocktakeId);
  if (!st) throw new Error("Инвентаризация не найдена");
  if (st.status !== STOCKTAKE_STATUS.DRAFT) {
    throw new Error("Редактировать можно только черновик");
  }
  const items = (st.items || []).map((it) => {
    if (it.productId !== productId) return it;
    const expected = Number(it.expectedQty) || 0;
    if (actualQty === null || actualQty === undefined || actualQty === "") {
      return { ...it, actualQty: null, diff: null, counted: false, reason: "" };
    }
    const actual = Math.max(0, Number(actualQty) || 0);
    return {
      ...it,
      actualQty: actual,
      diff: actual - expected,
      counted: true,
      reason: asText(reason),
    };
  });
  return Store.update(COLLECTION, stocktakeId, {
    items,
    totals: computeTotals(items),
  });
}

export function setItemReason(stocktakeId, productId, reason) {
  const st = getStocktake(stocktakeId);
  if (!st) throw new Error("Инвентаризация не найдена");
  if (st.status !== STOCKTAKE_STATUS.DRAFT) {
    throw new Error("Редактировать можно только черновик");
  }
  const items = (st.items || []).map((it) => {
    if (it.productId !== productId) return it;
    return { ...it, reason: asText(reason) };
  });
  return Store.update(COLLECTION, stocktakeId, { items });
}

// ---------- удаление черновика ----------
export function deleteStocktake(id) {
  const st = getStocktake(id);
  if (!st) return false;
  if (st.status === STOCKTAKE_STATUS.APPROVED) {
    throw new Error("Утверждённую инвентаризацию нельзя удалить — только отменить");
  }
  Store.update(COLLECTION, id, { isDeleted: true });
  return true;
}

// ---------- отправка на согласование ----------
export function submitStocktake(stocktakeId) {
  const st = getStocktake(stocktakeId);
  if (!st) throw new Error("Инвентаризация не найдена");
  if (st.status !== STOCKTAKE_STATUS.DRAFT) {
    throw new Error("Отправить на согласование можно только черновик");
  }
  const counted = (st.items || []).filter((it) => it.counted);
  if (counted.length === 0) {
    throw new Error("Нет посчитанных позиций. Внеси факт хотя бы для одного товара.");
  }
  const me = currentEmployee();
  return Store.update(COLLECTION, stocktakeId, {
    status: STOCKTAKE_STATUS.PENDING,
    submittedAt: Date.now(),
    submittedBy: me?.id || null,
    submittedByName: me?.name || me?.email || "",
  });
}

// ---------- возврат в черновик из pending ----------
export function recallStocktake(stocktakeId) {
  const st = getStocktake(stocktakeId);
  if (!st) throw new Error("Инвентаризация не найдена");
  if (st.status !== STOCKTAKE_STATUS.PENDING) {
    throw new Error("Отозвать можно только из 'на согласовании'");
  }
  return Store.update(COLLECTION, stocktakeId, {
    status: STOCKTAKE_STATUS.DRAFT,
    recalledAt: Date.now(),
  });
}

// ---------- согласование (Этап 2 — пока без автопроводки документов) ----------
export function approveStocktake(stocktakeId, comment = "") {
  const st = getStocktake(stocktakeId);
  if (!st) throw new Error("Инвентаризация не найдена");
  if (st.status !== STOCKTAKE_STATUS.PENDING) {
    throw new Error("Согласовать можно только инвентаризацию 'на согласовании'");
  }
  const me = currentEmployee();
  return Store.update(COLLECTION, stocktakeId, {
    status: STOCKTAKE_STATUS.APPROVED,
    approvedAt: Date.now(),
    approvedBy: me?.id || null,
    approvedByName: me?.name || me?.email || "",
    approvalComment: asText(comment),
  });
}

export function rejectStocktake(stocktakeId, reason = "") {
  const st = getStocktake(stocktakeId);
  if (!st) throw new Error("Инвентаризация не найдена");
  if (st.status !== STOCKTAKE_STATUS.PENDING) {
    throw new Error("Отклонить можно только инвентаризацию 'на согласовании'");
  }
  const me = currentEmployee();
  return Store.update(COLLECTION, stocktakeId, {
    status: STOCKTAKE_STATUS.REJECTED,
    rejectedAt: Date.now(),
    rejectedBy: me?.id || null,
    rejectionReason: asText(reason),
  });
}

// ---------- итоги ----------
export function computeTotals(items) {
  let productsTotal = 0;
  let productsCounted = 0;
  let shortageQty = 0;
  let shortageAmount = 0;
  let surplusQty = 0;
  let surplusAmount = 0;

  for (const it of (items || [])) {
    productsTotal += 1;
    if (it.counted) productsCounted += 1;
    const diff = Number(it.diff);
    if (!Number.isFinite(diff) || diff === 0) continue;
    // Цена — берём из товара (последний приход).
    let priceHint = 0;
    if (it.productId) {
      const p = getWarehouseProduct(it.productId);
      priceHint = toNum(p?.price, 0) || toNum(p?.lastInPrice, 0);
    }
    if (diff < 0) {
      shortageQty += Math.abs(diff);
      shortageAmount += Math.abs(diff) * priceHint;
    } else {
      surplusQty += diff;
      surplusAmount += diff * priceHint;
    }
  }
  return {
    productsTotal,
    productsCounted,
    shortageQty,
    shortageAmount: +shortageAmount.toFixed(2),
    surplusQty,
    surplusAmount: +surplusAmount.toFixed(2),
  };
}

// ---------- проверка ширины: какие позиции с расхождением ----------
export function listShortages(stocktake) {
  return (stocktake?.items || []).filter((it) => it.counted && Number(it.diff) < 0);
}
export function listSurpluses(stocktake) {
  return (stocktake?.items || []).filter((it) => it.counted && Number(it.diff) > 0);
}
export function listOk(stocktake) {
  return (stocktake?.items || []).filter((it) => it.counted && Number(it.diff) === 0);
}
