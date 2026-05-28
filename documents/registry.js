import { renderPartnerMotivation } from "./builtin/partner_motivation.js";
import { renderElcTrainer } from "./builtin/elc_trainer.js";

export const BUILTIN_REGISTRY = {
  partner_motivation: renderPartnerMotivation,
  elc_trainer: renderElcTrainer,
};

const VALID_KINDS = new Set(["builtin", "markdown", "file", "embed"]);

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

export function normalizeKind(kind, raw = {}) {
  const next = String(kind || "").toLowerCase();
  if (VALID_KINDS.has(next)) return next;
  if (raw?.builtin === true) return "builtin";
  if (raw?.file && (raw.file?.storagePath || raw.file?.downloadURL || raw.file?.fileName)) return "file";
  if (raw?.embed?.url) return "embed";
  return "markdown";
}

export function normalizeScope(scope) {
  return String(scope || "") === "team" ? "team" : "personal";
}

export function normalizeShared(list) {
  const arr = Array.isArray(list) ? list : [];
  return [...new Set(arr.map((x) => String(x || "").trim()).filter(Boolean))].sort();
}

export function normalizeMime(mime) {
  return String(mime || "").split(";")[0].trim().toLowerCase();
}

export function sanitizeFileName(name) {
  const clean = String(name || "")
    .replace(/[/\\]/g, "_")
    .replace(/[<>:"|?*\x00-\x1f]/g, "")
    .trim();
  return (clean || "untitled").slice(0, 255);
}

function normalizeFileMeta(rawFile) {
  if (!rawFile || typeof rawFile !== "object") return null;
  const fileName = sanitizeFileName(rawFile.fileName || rawFile.name || "");
  const storagePath = String(rawFile.storagePath || rawFile.storageKey || "").trim();
  const downloadURL = String(rawFile.downloadURL || rawFile.url || "").trim();
  const mimeType = normalizeMime(rawFile.mimeType || rawFile.contentType || "");
  const sizeBytes = Number(rawFile.sizeBytes ?? rawFile.size ?? 0) || 0;
  const uploadedAt = Number(rawFile.uploadedAt || 0) || 0;
  const uploadedBy = String(rawFile.uploadedBy || "").trim();
  if (!fileName && !storagePath && !downloadURL) return null;
  return {
    storagePath,
    fileName,
    mimeType,
    sizeBytes,
    uploadedAt,
    uploadedBy,
    downloadURL,
  };
}

export function detectEmbedProvider(url) {
  const raw = String(url || "").trim().toLowerCase();
  if (!raw) return "other";
  if (raw.includes("docs.google.com/document/")) return "google_docs";
  if (raw.includes("docs.google.com/spreadsheets/")) return "google_sheets";
  if (raw.includes("docs.google.com/presentation/")) return "google_slides";
  if (raw.includes("notion.so")) return "notion";
  if (raw.includes("figma.com")) return "figma";
  if (raw.includes("youtube.com") || raw.includes("youtu.be")) return "youtube";
  if (raw.includes("vimeo.com")) return "vimeo";
  return "other";
}

function normalizeEmbedMeta(rawEmbed) {
  if (!rawEmbed || typeof rawEmbed !== "object") return null;
  const url = String(rawEmbed.url || "").trim();
  if (!url) return null;
  const provider = String(rawEmbed.provider || detectEmbedProvider(url)).toLowerCase();
  return {
    url,
    provider,
    title: String(rawEmbed.title || "").trim(),
  };
}

function fileKindFromMeta(file) {
  const mime = normalizeMime(file?.mimeType);
  const ext = String(file?.fileName || "").toLowerCase();

  if (mime === "application/pdf" || ext.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/.test(ext)) return "image";
  if (mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || ext.endsWith(".pptx") || ext.endsWith(".ppt")) return "pptx";
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mime === "application/msword" || ext.endsWith(".docx") || ext.endsWith(".doc")) return "docx";
  if (mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || mime === "application/vnd.ms-excel" || mime === "text/csv" || ext.endsWith(".xlsx") || ext.endsWith(".xls") || ext.endsWith(".csv")) return "xlsx";
  if (mime.startsWith("video/") || /\.(mp4|webm|mov)$/.test(ext)) return "video";
  if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/.test(ext)) return "audio";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z") || /\.(zip|rar|7z)$/.test(ext)) return "archive";
  if (mime.startsWith("text/") || mime === "application/json" || /\.(txt|json|csv)$/.test(ext)) return "text";
  return "other";
}

export function formatSize(bytes) {
  const value = Number(bytes) || 0;
  if (value <= 0) return "";
  if (value < 1024) return `${value} Б`;
  if (value < 1024 * 1024) return `${Math.round(value / 102.4) / 10} КБ`;
  if (value < 1024 * 1024 * 1024) return `${Math.round(value / (1024 * 102.4)) / 10} МБ`;
  return `${Math.round(value / (1024 * 1024 * 102.4)) / 10} ГБ`;
}

function providerLabel(provider) {
  const map = {
    google_docs: "Google Docs",
    google_sheets: "Google Sheets",
    google_slides: "Google Slides",
    notion: "Notion",
    figma: "Figma",
    youtube: "YouTube",
    vimeo: "Vimeo",
    other: "Ссылка",
  };
  return map[String(provider || "other")] || "Ссылка";
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

  const kind = normalizeKind(raw?.kind, raw);
  const file = normalizeFileMeta(raw?.file || null);
  const embed = normalizeEmbedMeta(raw?.embed || null);

  return {
    id: fallbackId,
    kind,
    type: normalizeType(raw?.type),
    slug: raw?.slug ? String(raw.slug) : undefined,
    title: String(raw?.title || "").trim() || "Без названия",
    description: String(raw?.description || "").trim(),
    builtin: kind === "builtin" || raw?.builtin === true,
    contentModuleId: raw?.contentModuleId ? String(raw.contentModuleId) : undefined,
    body: typeof raw?.body === "string" ? raw.body : "",
    file,
    embed,
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

export function documentVisual(doc) {
  const kind = normalizeKind(doc?.kind, doc);
  if (kind === "builtin") {
    return { icon: "puzzle", bg: "#FAEEDA", fg: "#854F0B", label: "интерактив" };
  }
  if (kind === "markdown") {
    return { icon: "markdown", bg: "#E6F1FB", fg: "#185FA5", label: "текст" };
  }
  if (kind === "embed") {
    const provider = detectEmbedProvider(doc?.embed?.url || "");
    return { icon: "external-link", bg: "#F1EFE8", fg: "#444441", label: providerLabel(provider) };
  }

  const file = doc?.file || {};
  const fileKind = fileKindFromMeta(file);
  const size = formatSize(file.sizeBytes);
  const labelSuffix = size ? ` · ${size}` : "";
  const map = {
    pdf: { icon: "file-type-pdf", bg: "#FCEBEB", fg: "#A32D2D", label: `PDF${labelSuffix}` },
    image: { icon: "photo", bg: "#E1F5EE", fg: "#0F6E56", label: `${String(file.fileName || "").split(".").pop()?.toUpperCase() || "IMAGE"}${labelSuffix}` },
    pptx: { icon: "presentation", bg: "#EEEDFE", fg: "#3C3489", label: `PPTX${labelSuffix}` },
    docx: { icon: "file-type-doc", bg: "#E6F1FB", fg: "#0C447C", label: `DOCX${labelSuffix}` },
    xlsx: { icon: "file-type-xls", bg: "#EAF3DE", fg: "#3B6D11", label: `${String(file.fileName || "").toLowerCase().endsWith(".csv") ? "CSV" : "XLSX"}${labelSuffix}` },
    video: { icon: "video", bg: "#FBEAF0", fg: "#993556", label: `VIDEO${labelSuffix}` },
    audio: { icon: "music", bg: "#FBEAF0", fg: "#993556", label: `AUDIO${labelSuffix}` },
    archive: { icon: "file-zip", bg: "#F1EFE8", fg: "#5F5E5A", label: `ZIP${labelSuffix}` },
    text: { icon: "file-text", bg: "#F1EFE8", fg: "#444441", label: `${String(file.fileName || "").toLowerCase().endsWith(".json") ? "JSON" : "TEXT"}${labelSuffix}` },
    other: { icon: "file", bg: "#F1EFE8", fg: "#444441", label: `FILE${labelSuffix}` },
  };
  return map[fileKind] || map.other;
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
