// Pllato CRM — сотрудники (общий модуль, используется всеми view).
// Источник правды — Firebase /users (общая база сотрудников всей команды Pllato).
// Эта обёртка кеширует в localStorage и предоставляет синхронный API.

import { Store } from "./store.js";

const COLLECTION = "employees";
const FB_SYNC_FLAG = "pllato_employees_fb_sync";  // если true, демо-seed не работает

const COLORS = ["#b8895a", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444"];

// Стабильный цвет по id/email (хэш)
function colorFor(seed) {
  let h = 0;
  for (let i = 0; i < (seed || "").length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export function isFirebaseSynced() {
  return localStorage.getItem(FB_SYNC_FLAG) === "1";
}

export function seedEmployees() {
  // Если уже подгрузили из Firebase — никаких демо-данных.
  if (isFirebaseSynced()) return;
  if (Store.list(COLLECTION).length > 0) return;
  const samples = [
    { name: "Pllato",        email: "pllato@example.com", role: "admin",   isCurrent: true },
    { name: "Айдана Бекова", email: "aydana@pllato.kz",   role: "manager" },
    { name: "Тимур Алиев",   email: "timur@pllato.kz",    role: "manager" },
    { name: "Сергей Ким",    email: "sergey@pllato.kz",   role: "viewer" },
  ];
  samples.forEach((e, i) => Store.create(COLLECTION, { ...e, color: COLORS[i % COLORS.length] }));
}

/**
 * Полная замена коллекции сотрудников из Firebase /users.
 * @param {Object} usersMap — { uid: { email, name, lastName, position, isAdmin, isSuperAdmin } }
 * @param {string} currentEmail — email текущего залогиненного пользователя
 * @returns {{ id, name, email, role }[]} — синхронизированные сотрудники + map старых ID на новые
 */
export function replaceEmployeesFromFirebase(usersMap, currentEmail) {
  const me = (currentEmail || "").toLowerCase().trim();
  // Старая коллекция — для миграции assigneeId по email
  const oldList = Store.list(COLLECTION);
  const oldByEmail = {};
  oldList.forEach(e => { if (e.email) oldByEmail[(e.email || "").toLowerCase().trim()] = e.id; });

  // Удаляем всё старое
  oldList.forEach(e => Store.remove(COLLECTION, e.id));

  // Маппинг старый id → новый id (для миграции assigneeId)
  const idMap = {};

  const newItems = [];
  Object.entries(usersMap || {}).forEach(([uid, u]) => {
    if (!u || !u.email) return;
    const emailNorm = u.email.toLowerCase().trim();
    const name = (u.lastName || u.name)
      ? `${u.lastName || ""} ${u.name || ""}`.trim()
      : (u.name || u.email.split("@")[0]);
    const role = u.isSuperAdmin ? "admin" : u.isAdmin ? "admin" : "manager";
    const fbId = "fb_" + uid;
    const now = Date.now();
    const items = JSON.parse(localStorage.getItem("pllato_core_" + COLLECTION) || "[]");
    items.unshift({
      id: fbId,
      name,
      email: u.email,
      position: u.position || "",
      role,
      isAdmin: !!u.isAdmin,
      isSuperAdmin: !!u.isSuperAdmin,
      isCurrent: emailNorm === me,
      color: colorFor(uid),
      createdAt: now,
      updatedAt: now,
    });
    localStorage.setItem("pllato_core_" + COLLECTION, JSON.stringify(items));
    newItems.push({ id: fbId, email: emailNorm });
    if (oldByEmail[emailNorm]) idMap[oldByEmail[emailNorm]] = fbId;
  });

  // Миграция assigneeId / participantIds / authorId по email
  migrateReferences(idMap);

  localStorage.setItem(FB_SYNC_FLAG, "1");
  return newItems;
}

function migrateReferences(idMap) {
  const keys = Object.keys(idMap);
  if (keys.length === 0) return;
  function rewriteCollection(coll, fields) {
    const items = JSON.parse(localStorage.getItem("pllato_core_" + coll) || "[]");
    let changed = false;
    items.forEach(item => {
      fields.forEach(f => {
        if (typeof item[f] === "string" && idMap[item[f]]) {
          item[f] = idMap[item[f]]; changed = true;
        } else if (Array.isArray(item[f])) {
          item[f] = item[f].map(v => idMap[v] || v);
          changed = true;
        }
      });
    });
    if (changed) localStorage.setItem("pllato_core_" + coll, JSON.stringify(items));
  }
  rewriteCollection("deals", ["assigneeId"]);
  rewriteCollection("tasks", ["assigneeId", "participantIds"]);
  rewriteCollection("feed",  ["authorId"]);
  rewriteCollection("task_comments", ["authorId"]);
  rewriteCollection("deal_activities", ["authorId"]);
  rewriteCollection("notifications", ["authorId"]);
}

export function listEmployees() {
  seedEmployees();
  return Store.list(COLLECTION).sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0));
}
export function getEmployee(id) {
  return id ? Store.get(COLLECTION, id) : null;
}
export function currentEmployee() {
  return listEmployees().find(e => e.isCurrent) || listEmployees()[0] || null;
}

export function initialsOf(name) {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
}

export function avatar(employee, size = "sm") {
  if (!employee) return `<span class="avatar avatar-${size}" style="background:var(--text-dim)">?</span>`;
  const color = employee.color || COLORS[0];
  return `<span class="avatar avatar-${size}" style="background:${color}" title="${(employee.name || "").replace(/"/g, "&quot;")}">${initialsOf(employee.name)}</span>`;
}

export function ROLES() {
  return [
    { id: "admin",   label: "Администратор" },
    { id: "manager", label: "Менеджер" },
    { id: "viewer",  label: "Наблюдатель" },
  ];
}

// Все возможные права (по разделам CRM)
export const ALL_PERMISSIONS = ["dashboard", "contacts", "crm", "calls", "tasks", "feed", "chat", "docs", "settings"];

// Возвращает permissions для текущего пользователя.
// Если у текущего сотрудника НЕТ roleId — даём полный доступ (исторический pllato = admin).
// Если есть roleId — берём permissions из роли; если роль не найдена, fallback по строковому полю role.
export function currentPermissions() {
  const me = currentEmployee();
  if (!me) return ALL_PERMISSIONS.slice();
  // Текущий пользователь со старым строковым полем role
    if (!me.roleId) {
      if (me.role === "admin")   return ALL_PERMISSIONS.slice();
    if (me.role === "manager") return ALL_PERMISSIONS.filter(p => p !== "settings");
    if (me.role === "viewer")  return ["dashboard", "feed"];
    return ALL_PERMISSIONS.slice();
  }
  // Ищем роль через Store напрямую (без циклического импорта)
  let role = null;
  try {
    const arr = JSON.parse(localStorage.getItem("pllato_core_roles") || "[]");
    role = arr.find(r => r.id === me.roleId);
  } catch {}
  if (!role) return ALL_PERMISSIONS.slice();
  const perms = Array.isArray(role.permissions) ? role.permissions.slice() : [];
  // Backward compatibility: old role snapshots had "crm" but not "calls".
  if (perms.includes("crm") && !perms.includes("calls")) perms.push("calls");
  return perms;
}

export function hasPermission(routeId) {
  return currentPermissions().includes(routeId);
}

// CRUD wrappers
export function createEmployee(data) {
  return Store.create(COLLECTION, { ...data, color: data.color || COLORS[Store.list(COLLECTION).length % COLORS.length] });
}
export function updateEmployee(id, patch) {
  return Store.update(COLLECTION, id, patch);
}
export function removeEmployee(id) {
  const e = Store.get(COLLECTION, id);
  if (e?.isCurrent) return false;
  return Store.remove(COLLECTION, id);
}
