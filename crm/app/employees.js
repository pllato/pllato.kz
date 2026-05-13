// Pllato CRM — сотрудники (общий модуль, используется всеми view).

import { Store } from "./store.js";

const COLLECTION = "employees";

const COLORS = ["#b8895a", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444"];

export function seedEmployees() {
  if (Store.list(COLLECTION).length > 0) return;
  const samples = [
    { name: "Pllato",        email: "pllato@example.com", role: "admin",   isCurrent: true },
    { name: "Айдана Бекова", email: "aydana@pllato.kz",   role: "manager" },
    { name: "Тимур Алиев",   email: "timur@pllato.kz",    role: "manager" },
    { name: "Сергей Ким",    email: "sergey@pllato.kz",   role: "viewer" },
  ];
  samples.forEach((e, i) => Store.create(COLLECTION, { ...e, color: COLORS[i % COLORS.length] }));
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
export const ALL_PERMISSIONS = ["dashboard", "contacts", "crm", "tasks", "feed", "chat", "settings"];

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
  return role.permissions || [];
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
