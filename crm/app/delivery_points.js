// Pllato CRM · Точки доставки (физические адреса) у клиента.
// По итогам встречи 25.05: одно юр.лицо может иметь несколько фактических точек.
// Обязательное поле при создании заявки. Помогает водителю и складу не путать
// две аптеки сети на одном адресе.

import { Store } from "./store.js";

const COLLECTION = "delivery_points";

export function listDeliveryPoints(filters = {}) {
  return Store.list(COLLECTION)
    .filter((p) => !p.isDeleted)
    .filter((p) => !filters.contactId || p.contactId === filters.contactId)
    .sort((a, b) => {
      // Сначала "главная" точка
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return String(a.label || "").localeCompare(String(b.label || ""));
    });
}

export function getDeliveryPoint(id) {
  return id ? Store.get(COLLECTION, id) : null;
}

export function listDeliveryPointsForContact(contactId) {
  if (!contactId) return [];
  return listDeliveryPoints({ contactId });
}

export function getDefaultDeliveryPointForContact(contactId) {
  const list = listDeliveryPointsForContact(contactId);
  return list.find((p) => p.isPrimary) || list[0] || null;
}

export function saveDeliveryPoint(payload = {}) {
  const data = {
    contactId: String(payload.contactId || "").trim(),
    label: String(payload.label || "").trim(),
    city: String(payload.city || "").trim(),
    district: String(payload.district || "").trim(),
    address: String(payload.address || "").trim(),
    landmark: String(payload.landmark || "").trim(),
    contactPersonName: String(payload.contactPersonName || "").trim(),
    contactPersonPhone: String(payload.contactPersonPhone || "").trim(),
    workHours: String(payload.workHours || "").trim(),
    note: String(payload.note || "").trim(),
    isPrimary: Boolean(payload.isPrimary),
  };
  if (!data.contactId) throw new Error("Укажи клиента для точки доставки");
  if (!data.address) throw new Error("Укажи адрес доставки");
  if (!data.label) {
    // Авто-лейбл: «город, район, дом» если не задан явно
    data.label = [data.city, data.address].filter(Boolean).join(", ") || "Точка доставки";
  }

  // Если ставят isPrimary — снимаем у других у того же клиента
  if (data.isPrimary) {
    Store.list(COLLECTION)
      .filter((p) => p.contactId === data.contactId && p.isPrimary && p.id !== payload.id)
      .forEach((p) => Store.update(COLLECTION, p.id, { isPrimary: false }));
  }

  if (payload.id) return Store.update(COLLECTION, payload.id, data);
  return Store.create(COLLECTION, data);
}

export function deleteDeliveryPoint(id) {
  if (!id) return false;
  Store.update(COLLECTION, id, { isDeleted: true });
  return true;
}

/** Прогресс onboarding: хотя бы у одного контакта есть точка */
export function deliveryPointsProgress() {
  const list = Store.list(COLLECTION).filter((p) => !p.isDeleted);
  const contacts = new Set(list.map((p) => p.contactId));
  return {
    total: list.length,
    contacts: contacts.size,
    ready: list.length > 0,
  };
}
