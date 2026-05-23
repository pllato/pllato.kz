// Pllato CRM — сотрудники (общий модуль, используется всеми view).
// Источник правды — Worker /users/list. Модуль кеширует список в localStorage.

import { Store } from "./store.js";
import { apiFetch, getSession } from "./auth.js";

const COLLECTION = "employees";
const EMP_SYNC_FLAG = "pllato_employees_sync";

const COLORS = ["#b8895a", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444"];

function colorFor(seed) {
  let h = 0;
  for (let i = 0; i < (seed || "").length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export function isEmployeesSynced() {
  return localStorage.getItem(EMP_SYNC_FLAG) === "1";
}

export function seedEmployees() {
  if (isEmployeesSynced()) return;
  if (Store.list(COLLECTION).length > 0) return;
  const samples = [
    { name: "Pllato", email: "pllato@example.com", role: "admin", isCurrent: true },
    { name: "Айдана Бекова", email: "aydana@pllato.kz", role: "manager" },
    { name: "Тимур Алиев", email: "timur@pllato.kz", role: "manager" },
    { name: "Сергей Ким", email: "sergey@pllato.kz", role: "viewer" },
  ];
  samples.forEach((e, i) => Store.create(COLLECTION, { ...e, color: COLORS[i % COLORS.length] }));
}

function normalizeUserRole(user) {
  const isSuperAdmin = Boolean(user?.isSuperAdmin || Number(user?.is_super_admin) === 1);
  const isAdmin = Boolean(user?.isAdmin || Number(user?.is_admin) === 1);
  if (isSuperAdmin || isAdmin) return "admin";
  const role = String(user?.role || user?.position || "").toLowerCase().trim();
  if (role === "viewer") return "viewer";
  if (role === "field" || role === "field_sales" || role.includes("поле")) return "field";
  return "manager";
}

function fullName(user) {
  const first = String(user?.name || "").trim();
  const last = String(user?.lastName || user?.last_name || "").trim();
  const both = `${last} ${first}`.trim();
  if (both) return both;
  const email = String(user?.email || "").trim();
  return email ? email.split("@")[0] : "Сотрудник";
}

function replaceEmployeesFromRows(rows, currentEmail) {
  const me = String(currentEmail || "").toLowerCase().trim();
  const oldList = Store.list(COLLECTION);
  const oldByEmail = {};
  oldList.forEach((e) => {
    if (e.email) oldByEmail[String(e.email).toLowerCase().trim()] = e.id;
  });

  oldList.forEach((e) => Store.remove(COLLECTION, e.id));

  const idMap = {};
  const normalized = Array.isArray(rows) ? rows : [];
  const now = Date.now();
  const storageKey = "pllato_core_" + COLLECTION;
  const fresh = [];

  normalized.forEach((user, index) => {
    if (!user || !user.email) return;
    const emailNorm = String(user.email).toLowerCase().trim();
    const stableId = String(user.id || user.uid || `u_${index}`).trim();
    const id = stableId.startsWith("u_") ? stableId : `u_${stableId}`;
    const item = {
      id,
      name: fullName(user),
      email: String(user.email || "").trim(),
      position: String(user.position || "").trim(),
      role: normalizeUserRole(user),
      isAdmin: Boolean(user.isAdmin || Number(user.is_admin) === 1),
      isSuperAdmin: Boolean(user.isSuperAdmin || Number(user.is_super_admin) === 1),
      apps: user.apps && typeof user.apps === "object" ? user.apps : {},
      isCurrent: emailNorm === me,
      color: colorFor(id),
      createdAt: Number(user.createdAt || user.created_at) || now,
      updatedAt: Number(user.updatedAt || user.updated_at) || now,
    };
    fresh.push(item);
    const oldId = oldByEmail[emailNorm];
    if (oldId && oldId !== id) idMap[oldId] = id;
  });

  localStorage.setItem(storageKey, JSON.stringify(fresh));
  migrateReferences(idMap);
  localStorage.setItem(EMP_SYNC_FLAG, "1");
  return fresh;
}

export async function replaceEmployeesFromWorker() {
  const data = await apiFetch("/users/list", { method: "GET" });
  const rows = Array.isArray(data?.users) ? data.users : [];
  const currentEmail = String(getSession()?.user?.email || "").toLowerCase().trim();
  return replaceEmployeesFromRows(rows, currentEmail);
}

function migrateReferences(idMap) {
  if (Object.keys(idMap).length === 0) return;
  function rewriteCollection(coll, fields) {
    const items = JSON.parse(localStorage.getItem("pllato_core_" + coll) || "[]");
    let changed = false;
    items.forEach((item) => {
      fields.forEach((field) => {
        if (typeof item[field] === "string" && idMap[item[field]]) {
          item[field] = idMap[item[field]];
          changed = true;
        } else if (Array.isArray(item[field])) {
          const next = item[field].map((v) => idMap[v] || v);
          if (next.join("|") !== item[field].join("|")) {
            item[field] = next;
            changed = true;
          }
        }
      });
    });
    if (changed) localStorage.setItem("pllato_core_" + coll, JSON.stringify(items));
  }
  rewriteCollection("deals", ["assigneeId"]);
  rewriteCollection("tasks", ["assigneeId", "participantIds"]);
  rewriteCollection("feed", ["authorId"]);
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
  return listEmployees().find((e) => e.isCurrent) || listEmployees()[0] || null;
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
    { id: "admin", label: "Администратор" },
    { id: "manager", label: "Менеджер" },
    { id: "field", label: "Менеджер по продажам в поле" },
    { id: "viewer", label: "Наблюдатель" },
  ];
}

export const ALL_PERMISSIONS = ["dashboard", "contacts", "crm", "warehouse", "calls", "tasks", "feed", "chat", "settings", "field"];

export function currentPermissions() {
  const me = currentEmployee();
  if (!me) return ALL_PERMISSIONS.slice();
  if (!me.roleId) {
    if (me.role === "admin") return ALL_PERMISSIONS.slice();
    if (me.role === "manager") return ALL_PERMISSIONS.filter((p) => p !== "settings" && p !== "field");
    if (me.role === "field") return ["field"];
    if (me.role === "viewer") return ["dashboard", "feed", "warehouse"];
    return ALL_PERMISSIONS.slice();
  }

  let role = null;
  try {
    const arr = JSON.parse(localStorage.getItem("pllato_core_roles") || "[]");
    role = arr.find((r) => r.id === me.roleId);
  } catch {}
  if (!role) return ALL_PERMISSIONS.slice();
  const perms = Array.isArray(role.permissions) ? role.permissions.slice() : [];
  if (perms.includes("crm") && !perms.includes("calls")) perms.push("calls");
  if (!perms.includes("warehouse") && role.warehouseDisabled !== true) perms.push("warehouse");
  return perms;
}

export function hasPermission(routeId) {
  return currentPermissions().includes(routeId);
}

export function createEmployee(data) {
  return Store.create(COLLECTION, { ...data, color: data.color || COLORS[Store.list(COLLECTION).length % COLORS.length] });
}

export function updateEmployee(id, patch) {
  return Store.update(COLLECTION, id, patch);
}

export function removeEmployee(id) {
  const employee = Store.get(COLLECTION, id);
  if (employee?.isCurrent) return false;
  return Store.remove(COLLECTION, id);
}

// =============================================================================
// Binotel internal line per employee (локальное хранение, не идёт в worker D1).
// Используется как fallback в calls.js когда employee объект не содержит поля.
// =============================================================================
const BINOTEL_LINES_KEY = "pllato_emp_binotel_lines";

function readBinotelLinesMap() {
  try {
    const raw = localStorage.getItem(BINOTEL_LINES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return (parsed && typeof parsed === "object") ? parsed : {};
  } catch { return {}; }
}

function writeBinotelLinesMap(map) {
  try { localStorage.setItem(BINOTEL_LINES_KEY, JSON.stringify(map || {})); } catch {}
}

export function getEmployeeBinotelLine(employeeId) {
  if (!employeeId) return "";
  const map = readBinotelLinesMap();
  return String(map[employeeId] || "").replace(/[^\d]/g, "");
}

export function setEmployeeBinotelLine(employeeId, line) {
  if (!employeeId) return;
  const map = readBinotelLinesMap();
  const normalized = String(line || "").replace(/[^\d]/g, "");
  if (normalized) map[employeeId] = normalized;
  else delete map[employeeId];
  writeBinotelLinesMap(map);
}
