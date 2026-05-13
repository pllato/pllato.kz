// Pllato CORE CRM — центр уведомлений.
// Хранит события в localStorage. UI открывается из колокольчика в topbar.

import { Store } from "./store.js";

const COLLECTION = "notifications";

export function listNotifications() {
  return Store.list(COLLECTION);  // сортируется по updatedAt DESC в Store
}
export function unreadCount() {
  return Store.list(COLLECTION).filter(n => !n.read).length;
}
export function addNotification(notif) {
  return Store.create(COLLECTION, { read: false, ...notif });
}
export function markRead(id) {
  return Store.update(COLLECTION, id, { read: true });
}
export function markAllRead() {
  Store.list(COLLECTION).filter(n => !n.read).forEach(n => Store.update(COLLECTION, n.id, { read: true }));
}
export function removeNotification(id) {
  return Store.remove(COLLECTION, id);
}
export function clearAll() {
  Store.list(COLLECTION).forEach(n => Store.remove(COLLECTION, n.id));
}

const TYPES = {
  task:     { icon: "✓", label: "Задача" },
  deal:     { icon: "₸", label: "Сделка" },
  contact:  { icon: "👤", label: "Контакт" },
  comment:  { icon: "💬", label: "Комментарий" },
  feed:     { icon: "≡", label: "Пост в ленте" },
  system:   { icon: "ℹ", label: "Система" },
};

export function typeMeta(t) {
  return TYPES[t] || TYPES.system;
}

export function seedDemoNotifications() {
  if (Store.list(COLLECTION).length > 0) return;
  const now = Date.now();
  const seed = [
    { type: "deal",   title: "Сделка перешла в «Предложение»",     description: "CRM на 50 пользователей", link: "#crm", _ts: now - 30 * 60000, read: false },
    { type: "task",   title: "Новая задача от Айданы",             description: "Подготовить демо для Tech Solutions", link: "#tasks", _ts: now - 90 * 60000, read: false },
    { type: "comment",title: "Тимур прокомментировал задачу",       description: "Слайды по архитектуре в работе...", link: "#tasks", _ts: now - 3 * 3600000, read: true },
    { type: "system", title: "Pllato CORE обновлён до v0.2",        description: "Появились центр уведомлений и графики на дашборде.", link: "#dashboard", _ts: now - 6 * 3600000, read: true },
  ];
  seed.forEach(s => {
    const { _ts, ...data } = s;
    const c = Store.create(COLLECTION, data);
    const items = JSON.parse(localStorage.getItem("pllato_core_" + COLLECTION) || "[]");
    const i = items.findIndex(x => x.id === c.id);
    if (i >= 0) {
      items[i].createdAt = _ts;
      items[i].updatedAt = _ts;
      localStorage.setItem("pllato_core_" + COLLECTION, JSON.stringify(items));
    }
  });
}
