import { renderPartnerMotivation } from "./builtin/partner_motivation.js";

export const BUILTIN_REGISTRY = {
  partner_motivation: renderPartnerMotivation,
};

export function isAdminUser(user) {
  return !!(user?.isAdmin || user?.isSuperAdmin || user?.isRootSuper);
}

export function canEdit(doc, user) {
  if (!doc || !user) return false;
  return isAdminUser(user) || String(doc.authorId || "") === String(user.id || "");
}

export function normalizeType(type) {
  const t = String(type || "").toLowerCase();
  if (["motivation", "regulation", "instruction", "other"].includes(t)) return t;
  return "other";
}

export function normalizeScope(scope) {
  return String(scope || "") === "team" ? "team" : "personal";
}

export function normalizeShared(list) {
  const arr = Array.isArray(list) ? list : [];
  return [...new Set(arr.map((x) => String(x || "").trim()).filter(Boolean))].sort();
}

export function normalizeDocument(raw, id) {
  const fallbackId = String(id || raw?.id || "");
  const now = Date.now();

  let scope = normalizeScope(raw?.scope);
  let sharedWith = normalizeShared(raw?.sharedWith);

  // Migration v1 -> v2
  if (raw?.visibility && !raw?.scope) {
    const mode = raw.visibility?.mode === "all" ? "all" : "selected";
    const old = normalizeShared(raw.visibility?.employeeIds || []);
    scope = mode === "all" ? "team" : "personal";
    sharedWith = mode === "selected" ? old : [];
  }

  return {
    id: fallbackId,
    type: normalizeType(raw?.type),
    slug: raw?.slug ? String(raw.slug) : undefined,
    title: String(raw?.title || "").trim() || "Без названия",
    description: String(raw?.description || "").trim(),
    builtin: raw?.builtin === true,
    contentModuleId: raw?.contentModuleId ? String(raw.contentModuleId) : undefined,
    body: typeof raw?.body === "string" ? raw.body : "",
    authorId: String(raw?.authorId || "").trim(),
    scope,
    sharedWith,
    createdAt: Number(raw?.createdAt) || now,
    updatedAt: Number(raw?.updatedAt) || now,
  };
}

export function typeMeta(type) {
  const t = normalizeType(type);
  const map = {
    motivation: {
      key: "motivation",
      label: "motivation",
      icon: "coin",
      bg: "#FAEEDA",
      fg: "#854F0B",
    },
    regulation: {
      key: "regulation",
      label: "regulation",
      icon: "clipboard-list",
      bg: "#E6F1FB",
      fg: "#185FA5",
    },
    instruction: {
      key: "instruction",
      label: "instruction",
      icon: "book",
      bg: "#E1F5EE",
      fg: "#0F6E56",
    },
    other: {
      key: "other",
      label: "other",
      icon: "file",
      bg: "#F1EFE8",
      fg: "#444441",
    },
  };
  return map[t] || map.other;
}

export function isVisibleInPersonal(doc, me) {
  return String(doc.authorId || "") === String(me?.id || "");
}

export function isVisibleInShared(doc, me, showAllForAdmin = false) {
  if (!me) return false;
  if (String(doc.authorId || "") === String(me.id || "")) return false;
  if (showAllForAdmin && isAdminUser(me)) return true;
  if (doc.scope === "team") return true;
  return (doc.sharedWith || []).includes(String(me.id || ""));
}

export function markdownToHtml(src) {
  const lines = String(src || "").split(/\n/);
  const out = [];
  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) continue;
    if (line.startsWith("### ")) out.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
    else if (line.startsWith("## ")) out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    else if (line.startsWith("# ")) out.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
    else out.push(`<p>${escapeHtml(line)}</p>`);
  }
  return out.join("");
}

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}
