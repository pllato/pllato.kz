// Pllato CRM · Справочник договоров с клиентами.
// По итогам встречи 25.05: один контакт = несколько договоров.
// В каждом договоре указан тип оплаты + срок действия + юр.лицо отправителя.

import { Store } from "./store.js";
import { currentEmployee } from "./employees.js";

const COLLECTION = "contracts";

export function listContracts(filters = {}) {
  return Store.list(COLLECTION)
    .filter((c) => !c.isDeleted)
    .filter((c) => !filters.contactId || c.contactId === filters.contactId)
    .filter((c) => !filters.organizationId || c.organizationId === filters.organizationId)
    .filter((c) => !filters.active || isActive(c))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function getContract(id) {
  return id ? Store.get(COLLECTION, id) : null;
}

export function listContractsForContact(contactId) {
  if (!contactId) return [];
  return Store.list(COLLECTION)
    .filter((c) => !c.isDeleted && c.contactId === contactId)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * Дефолтный договор для контакта — берём активный с самым свежим startDate.
 * Используется в модалке заказа для автоподтягивания типа оплаты и реквизитов.
 */
export function getDefaultContractForContact(contactId) {
  const list = listContractsForContact(contactId).filter(isActive);
  if (list.length === 0) return null;
  return list.sort((a, b) => String(b.startDate || "").localeCompare(String(a.startDate || "")))[0];
}

function isActive(c) {
  if (c.isDeleted) return false;
  if (c.status === "archived") return false;
  if (c.endDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (c.endDate < today) return false;
  }
  return true;
}

export function saveContract(payload = {}) {
  const me = currentEmployee();
  const data = {
    contactId: String(payload.contactId || "").trim() || null,
    organizationId: String(payload.organizationId || "").trim() || null,
    number: String(payload.number || "").trim(),
    title: String(payload.title || "").trim(),
    startDate: String(payload.startDate || "").trim(),
    endDate: String(payload.endDate || "").trim(),
    paymentTermId: String(payload.paymentTermId || "").trim() || null,
    paymentDays: payload.paymentDays === null || payload.paymentDays === ""
      ? null
      : Number(payload.paymentDays) || 0,
    priceTier: String(payload.priceTier || "default").trim(),
    discountPct: Number(payload.discountPct) || 0,
    note: String(payload.note || "").trim(),
    fileUrl: String(payload.fileUrl || "").trim(),
    status: String(payload.status || "active").trim(),
  };
  if (!data.contactId) throw new Error("Укажи клиента договора");
  if (!data.number && !data.title) throw new Error("Укажи номер или название договора");

  if (payload.id) {
    return Store.update(COLLECTION, payload.id, data);
  }
  return Store.create(COLLECTION, {
    ...data,
    createdBy: me?.id || null,
    createdAt: Date.now(),
  });
}

export function archiveContract(id) {
  if (!id) return false;
  Store.update(COLLECTION, id, { status: "archived" });
  return true;
}

export function deleteContract(id) {
  if (!id) return false;
  Store.update(COLLECTION, id, { isDeleted: true });
  return true;
}

/** Onboarding-прогресс: «есть ли хотя бы один договор» */
export function contractsProgress() {
  const list = Store.list(COLLECTION).filter((c) => !c.isDeleted);
  return {
    total: list.length,
    ready: list.length > 0,
  };
}
