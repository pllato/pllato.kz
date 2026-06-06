// Pllato CRM — Бронь товара под заказ (Block 4).
//
// Бронь резервирует остаток на складе под конкретный заказ (сделку) на
// ограниченный срок (по умолчанию 3 дня, редактируется). Пока бронь активна
// и не просрочена — её количество вычитается из «доступно» в подборе товара.
// Физического списания со склада бронь НЕ делает: FIFO-проводка накладной
// происходит только при «Отгружено по накладной» (см. warehouse.js), в этот
// момент бронь помечается consumed.
//
// Запись брони: { dealId, productId, lotId|null, qty, expiresAt (YYYY-MM-DD),
//                 status: "active"|"consumed"|"released", note }

import { Store } from "./store.js";

const COLLECTION = "warehouse_reservations";

export const RESERVATION_DEFAULT_DAYS = 3;

function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Дата «сегодня + N дней» в формате YYYY-MM-DD (для дефолтного срока брони/счёта).
export function addDaysIso(days = RESERVATION_DEFAULT_DAYS, fromIso = null) {
  const base = fromIso ? new Date(fromIso + "T00:00:00") : new Date();
  if (!Number.isFinite(base.getTime())) return todayIso();
  base.setDate(base.getDate() + (Number(days) || 0));
  return base.toISOString().slice(0, 10);
}

function safeList() {
  try { return Store.list(COLLECTION) || []; } catch { return []; }
}

// Бронь «держит» остаток, если она активна и не просрочена.
export function isHolding(r) {
  if (!r || r.status !== "active") return false;
  if (!r.expiresAt) return true;
  return String(r.expiresAt) >= todayIso();
}

export function isExpired(r) {
  return !!r && r.status === "active" && !!r.expiresAt && String(r.expiresAt) < todayIso();
}

export function listReservations() {
  return safeList();
}

export function listReservationsForDeal(dealId) {
  if (!dealId) return [];
  return safeList().filter((r) => r.dealId === dealId);
}

export function activeReservationsForDeal(dealId) {
  return listReservationsForDeal(dealId).filter((r) => r.status === "active");
}

// Сколько единиц товара сейчас забронировано (держится) по всем заказам.
// excludeDealId — не учитывать бронь самого заказа (чтобы в его же окне
// «доступно» не вычиталось то, что он сам и забронировал).
export function reservedQtyForProduct(productId, opts = {}) {
  if (!productId) return 0;
  const excludeDealId = opts.excludeDealId || null;
  return safeList()
    .filter((r) => r.productId === productId)
    .filter((r) => !excludeDealId || r.dealId !== excludeDealId)
    .filter(isHolding)
    .reduce((sum, r) => sum + Math.max(0, toNum(r.qty, 0)), 0);
}

// Забронированное количество по конкретной партии (lotId).
export function reservedQtyForLot(lotId, opts = {}) {
  if (!lotId) return 0;
  const excludeDealId = opts.excludeDealId || null;
  return safeList()
    .filter((r) => r.lotId === lotId)
    .filter((r) => !excludeDealId || r.dealId !== excludeDealId)
    .filter(isHolding)
    .reduce((sum, r) => sum + Math.max(0, toNum(r.qty, 0)), 0);
}

/**
 * Сформировать бронь под заказ. Идемпотентно: ранее активная бронь этого
 * заказа снимается (released) и создаётся заново по текущим позициям.
 *
 * @param {string} dealId
 * @param {Array<{productId, qty, lotId?}>} lines
 * @param {{ expiresAt?: string }} opts
 * @returns {Array} созданные записи брони
 */
export function createReservationForDeal(dealId, lines = [], opts = {}) {
  if (!dealId) throw new Error("dealId обязателен для брони");
  releaseReservationsForDeal(dealId);
  const expiresAt = opts.expiresAt || addDaysIso(RESERVATION_DEFAULT_DAYS);
  const created = [];
  (Array.isArray(lines) ? lines : []).forEach((line) => {
    const qty = Math.max(0, toNum(line.qty, 0));
    if (!line.productId || qty <= 0) return;
    created.push(Store.create(COLLECTION, {
      dealId,
      productId: line.productId,
      lotId: line.lotId || null,
      qty,
      expiresAt,
      status: "active",
      note: line.note || "",
    }));
  });
  return created;
}

// Обновить срок действия брони заказа (все активные записи).
export function setDealReservationExpiry(dealId, expiresAt) {
  if (!dealId || !expiresAt) return 0;
  let n = 0;
  activeReservationsForDeal(dealId).forEach((r) => {
    Store.update(COLLECTION, r.id, { expiresAt });
    n += 1;
  });
  return n;
}

// Снять бронь (товар снова доступен). Используется при отзыве/отмене заказа.
export function releaseReservationsForDeal(dealId) {
  if (!dealId) return 0;
  let n = 0;
  activeReservationsForDeal(dealId).forEach((r) => {
    Store.update(COLLECTION, r.id, { status: "released", releasedAt: Date.now() });
    n += 1;
  });
  return n;
}

// Списать бронь (товар ушёл со склада по накладной). Вызывается при отгрузке.
export function consumeReservationsForDeal(dealId) {
  if (!dealId) return 0;
  let n = 0;
  activeReservationsForDeal(dealId).forEach((r) => {
    Store.update(COLLECTION, r.id, { status: "consumed", consumedAt: Date.now() });
    n += 1;
  });
  return n;
}

// Срок действия брони заказа (минимальная дата среди активных записей).
export function dealReservationExpiry(dealId) {
  const act = activeReservationsForDeal(dealId);
  if (!act.length) return null;
  return act.map((r) => r.expiresAt).filter(Boolean).sort()[0] || null;
}
