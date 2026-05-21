// Pllato CRM — Dedupe duplicates from Store collections.
// Решает race condition когда несколько устройств одновременно seed'ят defaults.

import { Store } from "./store.js";

function normalize(v) {
  return String(v || "").toLowerCase().trim();
}

/**
 * Удаляет дубликаты в коллекции по name/title.
 * Оставляет самую раннюю запись (по createdAt), остальные — Store.remove.
 */
export function dedupeByName(collection, nameField = "name") {
  const items = Store.list(collection);
  if (items.length < 2) return 0;

  const sorted = [...items].sort((a, b) =>
    (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0)
  );

  const seen = new Set();
  let removed = 0;

  for (const item of sorted) {
    const key = normalize(item[nameField]);
    if (!key) continue;
    if (seen.has(key)) {
      Store.remove(collection, item.id);
      removed++;
    } else {
      seen.add(key);
    }
  }

  if (removed > 0) {
    console.log(`[dedupe] ${collection}.${nameField}: удалено ${removed} дубликатов`);
  }
  return removed;
}

/**
 * Пробегает по всем известным коллекциям с потенциалом дубликатов.
 */
export function dedupeAll() {
  const targets = [
    { collection: "roles", field: "name" },
    { collection: "pipelines", field: "title" },
    { collection: "pipelines", field: "name" }, // на случай если поле name
    { collection: "funnels", field: "title" },
    { collection: "funnels", field: "name" },
  ];

  let total = 0;
  for (const t of targets) {
    try {
      total += dedupeByName(t.collection, t.field);
    } catch (e) {
      // коллекция может не существовать — это нормально
    }
  }
  return total;
}
