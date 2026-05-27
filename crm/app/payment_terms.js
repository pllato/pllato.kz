// Pllato CRM · Справочник видов оплаты в договоре.
// 5 базовых типов (по итогам встречи 25.05): предоплата 100% / срок 1 месяц /
// консигнация / 4 дня / ручной ввод. Можно добавлять кастомные.

import { Store } from "./store.js";

const COLLECTION = "payment_terms";
const SEED_FLAG = "pllato_payment_terms_seeded_v1";

/** Системные коды (захардкожены, на них завязана логика канбана) */
export const PAYMENT_KIND = {
  PREPAY_100: "prepay_100",     // 100% предоплата → стадия «Ожидание оплаты»
  TERM_1MONTH: "term_1month",   // срок 1 месяц после поставки
  CONSIGNMENT: "consignment",   // консигнация — оплата по факту реализации
  TERM_4DAYS: "term_4days",     // 4 рабочих дня
  CUSTOM_DAYS: "custom_days",   // ручной ввод N дней
};

const DEFAULT_TERMS = [
  { kind: PAYMENT_KIND.PREPAY_100,  label: "Предоплата 100%",                days: 0,   requiresPayment: true,  order: 1 },
  { kind: PAYMENT_KIND.TERM_1MONTH, label: "Срок платежа — 1 месяц",         days: 30,  requiresPayment: false, order: 2 },
  { kind: PAYMENT_KIND.CONSIGNMENT, label: "Консигнация (по факту реализации)", days: 0, requiresPayment: false, order: 3 },
  { kind: PAYMENT_KIND.TERM_4DAYS,  label: "4 рабочих дня после поставки",   days: 4,   requiresPayment: false, order: 4 },
  { kind: PAYMENT_KIND.CUSTOM_DAYS, label: "Ручной ввод (N дней)",           days: null,requiresPayment: false, order: 5 },
];

function ensureSeed() {
  if (localStorage.getItem(SEED_FLAG) === "1") return;
  const existing = Store.list(COLLECTION);
  if (existing.length === 0) {
    DEFAULT_TERMS.forEach((t) => Store.create(COLLECTION, t));
  }
  localStorage.setItem(SEED_FLAG, "1");
}

export function listPaymentTerms() {
  ensureSeed();
  return Store.list(COLLECTION)
    .filter((t) => !t.isDeleted)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function getPaymentTerm(id) {
  ensureSeed();
  return id ? Store.get(COLLECTION, id) : null;
}

export function getPaymentTermByKind(kind) {
  ensureSeed();
  return Store.list(COLLECTION).find((t) => t.kind === kind && !t.isDeleted) || null;
}

export function savePaymentTerm(payload = {}) {
  const data = {
    kind: String(payload.kind || "").trim() || PAYMENT_KIND.CUSTOM_DAYS,
    label: String(payload.label || "").trim(),
    days: payload.days === null || payload.days === "" ? null : Number(payload.days) || 0,
    requiresPayment: Boolean(payload.requiresPayment),
    order: Number(payload.order) || 99,
  };
  if (!data.label) throw new Error("Укажи название вида оплаты");
  if (payload.id) return Store.update(COLLECTION, payload.id, data);
  return Store.create(COLLECTION, data);
}

export function deletePaymentTerm(id) {
  if (!id) return false;
  const term = Store.get(COLLECTION, id);
  // Системные виды нельзя удалить — они зашиты в логику канбана.
  if (term && [PAYMENT_KIND.PREPAY_100, PAYMENT_KIND.CONSIGNMENT].includes(term.kind)) {
    throw new Error("Системный вид оплаты нельзя удалить (используется в логике канбана)");
  }
  Store.update(COLLECTION, id, { isDeleted: true });
  return true;
}

/** Прогресс onboarding-задачи: видов оплаты больше дефолтных или хотя бы какой-то изменён */
export function paymentTermsProgress() {
  ensureSeed();
  const all = Store.list(COLLECTION).filter((t) => !t.isDeleted);
  return {
    total: all.length,
    seeded: all.length >= DEFAULT_TERMS.length,
    ready: all.length >= DEFAULT_TERMS.length,
  };
}
