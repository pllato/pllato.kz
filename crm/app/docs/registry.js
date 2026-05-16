import { Store } from "../store.js";
import { currentEmployee } from "../employees.js";
import { renderPartnerMotivation } from "./partner_motivation.js";

const COLLECTION = "documents";
const BUILTIN_SLUG = "partner-motivation";
const BUILTIN_MODULE_ID = "partner_motivation";

export const BUILTIN_DOC_MODULES = {
  [BUILTIN_MODULE_ID]: renderPartnerMotivation,
};

function now() {
  return Date.now();
}

function currentActor() {
  const me = currentEmployee();
  return me?.email || me?.id || "system";
}

export function ensureBuiltinDocumentsSeed() {
  const docs = Store.list(COLLECTION);
  const builtin = docs.find((doc) => doc.slug === BUILTIN_SLUG);
  if (builtin) {
    const patch = {};
    if (!builtin.type) patch.type = "motivation";
    if (!builtin.title) patch.title = "Система Мотивации Партнёра по привлечению клиентов";
    if (!builtin.description) patch.description = "Формула, KPI, правила выплат и калькулятор для партнёров.";
    if (!builtin.builtin) patch.builtin = true;
    if (!builtin.contentModuleId) patch.contentModuleId = BUILTIN_MODULE_ID;
    if (!builtin.visibility || !builtin.visibility.mode) {
      patch.visibility = { mode: "selected", employeeIds: [] };
    }
    if (Object.keys(patch).length > 0) {
      patch.updatedBy = currentActor();
      Store.update(COLLECTION, builtin.id, patch);
    }
    return;
  }

  const actor = currentActor();
  const ts = now();
  Store.create(COLLECTION, {
    type: "motivation",
    slug: BUILTIN_SLUG,
    title: "Система Мотивации Партнёра по привлечению клиентов",
    description: "Формула, KPI, правила выплат и калькулятор для партнёров.",
    builtin: true,
    contentModuleId: BUILTIN_MODULE_ID,
    visibility: { mode: "selected", employeeIds: [] },
    createdAt: ts,
    updatedAt: ts,
    createdBy: actor,
    updatedBy: actor,
  });
}

export function normalizeVisibility(doc) {
  const mode = doc?.visibility?.mode === "all" ? "all" : "selected";
  const list = Array.isArray(doc?.visibility?.employeeIds) ? doc.visibility.employeeIds : [];
  const employeeIds = [...new Set(list.filter(Boolean))].sort();
  return { mode, employeeIds };
}

export function isEmployeeAdmin(employee) {
  return !!(employee?.isAdmin || employee?.isSuperAdmin || employee?.role === "admin");
}

export function isVisibleToCurrent(doc) {
  const me = currentEmployee();
  if (!me) return false;
  if (isEmployeeAdmin(me)) return true;
  const visibility = normalizeVisibility(doc);
  if (visibility.mode === "all") return true;
  return visibility.employeeIds.includes(me.id);
}

export function listDocuments() {
  ensureBuiltinDocumentsSeed();
  return Store.list(COLLECTION).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function saveDocumentVisibility(docId, visibility) {
  const actor = currentActor();
  return Store.update(COLLECTION, docId, {
    visibility: normalizeVisibility({ visibility }),
    updatedBy: actor,
  });
}
