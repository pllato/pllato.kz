// Pllato CRM — модель воронок (pipelines).
// Каждая воронка имеет свой набор стадий. Сделки привязаны к воронке через pipelineId.

import { Store } from "./store.js";

const PIPELINES_KEY = "pllato_core_pipelines";
const ACTIVE_KEY = "pllato_core_active_pipeline";
const LEGACY_STAGES_KEY = "pllato_core_stages";
const MIGRATION_FLAG = "pllato_core_pipelines_migrated_v1";

// === Шаблоны стадий ===

export const DEFAULT_NEW_CLIENT_STAGES = [
  { id: "ps_new",       title: "Новый",                title_short: "Новый",       color: "#8896b3" },
  { id: "ps_lpr",       title: "Выход на ЛПР",         title_short: "ЛПР",         color: "#5d6b85" },
  { id: "ps_qual",      title: "Квалификация",         title_short: "Квалиф.",     color: "#3b82f6" },
  { id: "ps_meet_set",  title: "Встреча назначена",    title_short: "Встр. назн.", color: "#06b6d4" },
  { id: "ps_meet_done", title: "Встреча проведена",    title_short: "Встр. пров.", color: "#a855f7" },
  { id: "ps_quote_req", title: "Запрос на просчёт",    title_short: "Просчёт",     color: "#ec4899" },
  { id: "ps_kp",        title: "КП отправлено",        title_short: "КП",          color: "#f59e0b" },
  { id: "ps_contract",  title: "Договор",              title_short: "Договор",     color: "#b8895a" },
  { id: "ps_prepay",    title: "Аванс",                title_short: "Аванс",       color: "#22c55e" },
  { id: "ps_work",      title: "Выполнение работ",     title_short: "Работа",      color: "#16a34a" },
  { id: "ps_paid",      title: "Окончательный расчёт", title_short: "Расчёт",      color: "#15803d" },
].map((s) => ({ id: s.id, title: s.title, color: s.color }));

export const DEFAULT_RECURRING_CLIENT_STAGES = [
  { id: "psr_actual",   title: "Актуализация потребностей", color: "#06b6d4" },
  { id: "psr_request",  title: "Получение запроса",         color: "#3b82f6" },
  { id: "psr_kp",       title: "КП отправлено",             color: "#f59e0b" },
  { id: "psr_contract", title: "Договор",                   color: "#b8895a" },
  { id: "psr_prepay",   title: "Аванс",                     color: "#22c55e" },
  { id: "psr_work",     title: "Выполнение работ",          color: "#16a34a" },
  { id: "psr_paid",     title: "Окончательный расчёт",      color: "#15803d" },
];

// === Хранилище ===

let _idSeq = 0;
function uid(prefix) {
  _idSeq++;
  return `${prefix}_${Date.now().toString(36)}_${_idSeq}`;
}

export function newPipelineId() { return uid("p"); }
export function newStageIdForPipeline() { return uid("ps"); }

function read() {
  try {
    const raw = localStorage.getItem(PIPELINES_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : [];
  } catch (_) { return []; }
}

function write(pipelines) {
  try { localStorage.setItem(PIPELINES_KEY, JSON.stringify(pipelines)); } catch (_) {}
}

// === Публичный API ===

export function getPipelines() {
  ensurePipelinesInitialized();
  return read().filter((p) => !p.isDeleted);
}

export function getDeletedPipelines() {
  ensurePipelinesInitialized();
  return read().filter((p) => p.isDeleted).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
}

export function getAllPipelinesIncludingDeleted() {
  ensurePipelinesInitialized();
  return read();
}

export function countActiveDealsInPipeline(pipelineId) {
  try {
    const deals = Store.list("deals") || [];
    return deals.filter((d) => (d.pipelineId || "") === pipelineId).length;
  } catch (_) { return 0; }
}

export function canDeletePipeline(pipelineId) {
  const active = getPipelines();
  if (active.length <= 1) return { ok: false, reason: "Это последняя активная воронка — её нельзя удалить." };
  if (countActiveDealsInPipeline(pipelineId) > 0) {
    return { ok: false, reason: "В воронке есть сделки. Перенесите их в другую воронку или удалите." };
  }
  return { ok: true };
}

export function restorePipeline(pipelineId) {
  const pipelines = read();
  const idx = pipelines.findIndex((p) => p.id === pipelineId);
  if (idx === -1) return false;
  pipelines[idx] = { ...pipelines[idx], isDeleted: false, deletedAt: null };
  write(pipelines);
  return true;
}

export function getPipelineById(id) {
  return read().find((p) => p.id === id) || null;
}

export function getActivePipelineId() {
  ensurePipelinesInitialized();
  const id = localStorage.getItem(ACTIVE_KEY);
  // Игнорируем удалённые воронки: вкладки сверху рендерим только активные,
  // если сохранённая активная id оказалась isDeleted=true — берём первую живую.
  const livePipelines = read().filter((p) => !p.isDeleted);
  if (id && livePipelines.some((p) => p.id === id)) return id;
  const first = livePipelines[0]?.id || null;
  if (first && id !== first) {
    // Сохраняем нормализованный id, чтобы при следующем рендере точно подсветилась вкладка.
    try { localStorage.setItem(ACTIVE_KEY, first); } catch (_) {}
  }
  return first;
}

export function setActivePipelineId(id) {
  try { localStorage.setItem(ACTIVE_KEY, id); } catch (_) {}
}

export function createPipeline(title, stages) {
  ensurePipelinesInitialized();
  const pipelines = read();
  const safeStages = Array.isArray(stages) && stages.length
    ? stages.map((s) => ({ ...s, id: s.id || newStageIdForPipeline() }))
    : [{ id: newStageIdForPipeline(), title: "Новая стадия", color: "#8896b3" }];
  const pipeline = {
    id: newPipelineId(),
    title: (title || "Новая воронка").trim(),
    stages: safeStages,
  };
  pipelines.push(pipeline);
  write(pipelines);
  return pipeline;
}

export function updatePipeline(id, patch) {
  const pipelines = read();
  const idx = pipelines.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  pipelines[idx] = { ...pipelines[idx], ...patch };
  write(pipelines);
  return pipelines[idx];
}

export function deletePipeline(id) {
  const check = canDeletePipeline(id);
  if (!check.ok) return check;
  const pipelines = read();
  const idx = pipelines.findIndex((p) => p.id === id);
  if (idx === -1) return { ok: false, reason: "Воронка не найдена." };
  pipelines[idx] = { ...pipelines[idx], isDeleted: true, deletedAt: Date.now() };
  write(pipelines);
  // If deleted pipeline was active — switch to first remaining active
  if (getActivePipelineId() === id) {
    const stillActive = pipelines.filter((p) => !p.isDeleted);
    if (stillActive.length) setActivePipelineId(stillActive[0].id);
  }
  return { ok: true };
}

// Hard delete (permanent) — used when emptying trash (future). Not exposed in current UI.
export function hardDeletePipeline(id) {
  const pipelines = read();
  const filtered = pipelines.filter((p) => p.id !== id);
  if (filtered.length === pipelines.length) return false;
  write(filtered);
  return true;
}

/**
 * Переставить активные воронки в новый порядок.
 * @param {string[]} orderedIds — id активных воронок в новом порядке
 * @returns {boolean}
 */
export function reorderPipelines(orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return false;
  const pipelines = read();
  const byId = new Map(pipelines.map((p) => [p.id, p]));
  const reordered = [];
  // Сначала те, что указаны в новом порядке
  orderedIds.forEach((id) => {
    const p = byId.get(id);
    if (p && !p.isDeleted) {
      reordered.push(p);
      byId.delete(id);
    }
  });
  // Затем остальные активные (на случай если переставили часть)
  pipelines.forEach((p) => {
    if (!p.isDeleted && byId.has(p.id)) reordered.push(p);
  });
  // И удалённые в конец (порядок сохраняем)
  pipelines.forEach((p) => { if (p.isDeleted) reordered.push(p); });
  write(reordered);
  return true;
}

export function getStagesForPipeline(pipelineId) {
  const pipeline = getPipelineById(pipelineId);
  return pipeline ? pipeline.stages : [];
}

export function saveStagesForPipeline(pipelineId, stages) {
  updatePipeline(pipelineId, { stages });
}

// === Миграция (один раз) ===

let _migrationDone = false;
export function ensurePipelinesInitialized() {
  if (_migrationDone) return;
  if (localStorage.getItem(MIGRATION_FLAG) === "1") {
    _migrationDone = true;
    return;
  }
  const existing = read();
  if (existing.length) {
    localStorage.setItem(MIGRATION_FLAG, "1");
    _migrationDone = true;
    return;
  }
  // Read legacy stages
  let legacyStages = null;
  try {
    const raw = localStorage.getItem(LEGACY_STAGES_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr) && arr.length) legacyStages = arr;
  } catch (_) {}
  const newClients = {
    id: newPipelineId(),
    title: "Новые клиенты",
    stages: legacyStages || DEFAULT_NEW_CLIENT_STAGES.map((s) => ({ ...s })),
  };
  const recurring = {
    id: newPipelineId(),
    title: "Текущие клиенты",
    stages: DEFAULT_RECURRING_CLIENT_STAGES.map((s) => ({ ...s })),
  };
  write([newClients, recurring]);
  setActivePipelineId(newClients.id);
  // Все существующие сделки → "Новые клиенты"
  try {
    const deals = Store.list("deals") || [];
    for (const d of deals) {
      if (!d.pipelineId) {
        Store.update("deals", d.id, { pipelineId: newClients.id });
      }
    }
  } catch (_) {}
  localStorage.setItem(MIGRATION_FLAG, "1");
  _migrationDone = true;
}
