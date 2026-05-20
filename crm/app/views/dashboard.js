// Pllato CRM — Дашборд: объединённый вид (большой график + сетка обзора + drill-down).

import { Store } from "../store.js";
import { listEmployees } from "../employees.js";
import { getPipelines } from "../pipelines.js";

const PERIOD_KEY     = "pllato_dashboard_period";
const REPORT_KEY     = "pllato_dashboard_report";
const RANGE_KEY      = "pllato_dashboard_range";
const MANAGER_KEY    = "pllato_dashboard_manager";
const DEMO_MODE_KEY  = "pllato_dashboard_demo_modes";
const BACKFILL_FLAG  = "pllato_stage_events_backfill_v1";

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function pluralRu(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

const REPORTS = [
  { id: "calls",            title: "Кол-во звонков",           unit: "шт",  color: "#3b82f6", itemType: "call" },
  { id: "talk_traffic",     title: "Длительность разговоров",  unit: "мин", color: "#06b6d4", itemType: null   },
  { id: "kp_sent",          title: "КП отправлено",            unit: "шт",  color: "#a855f7", itemType: "deal" },
  { id: "quotes",           title: "Запросы на просчёт",       unit: "шт",  color: "#ec4899", itemType: "deal" },
  { id: "contracts",        title: "Договоры",                 unit: "шт",  color: "#b8895a", itemType: "deal" },
  { id: "payments",         title: "Оплаты",                   unit: "шт",  color: "#22c55e", itemType: "deal" },
  { id: "revenue",          title: "Выручка",                  unit: "₸",   color: "#15803d", itemType: "deal" },
  { id: "plan_fact",        title: "План / факт",              unit: "%",   color: "#f59e0b", itemType: null   },
  { id: "new_clients",      title: "Новые клиенты",            unit: "шт",  color: "#06b6d4", itemType: "contact" },
  { id: "avg_check",        title: "Средний чек",              unit: "₸",   color: "#a855f7", itemType: "deal" },
  { id: "items_per_check",  title: "Позиций в чеке",           unit: "шт",  color: "#3b82f6", itemType: null   },
  { id: "churn",            title: "Отток клиентов",           unit: "%",   color: "#ef4444", itemType: null   },
  { id: "abc_xyz",          title: "ABC-XYZ анализ",           unit: "—",   color: "#5d6b85", itemType: null   },
];
const NOT_IMPLEMENTED_REAL = new Set(["talk_traffic", "plan_fact", "items_per_check", "churn", "abc_xyz"]);

const state = {
  activeReportId: null,
  period: null, rangeFrom: null, rangeTo: null,
  managerFilter: "all", demoModes: {},
};

function loadState() {
  state.activeReportId = localStorage.getItem(REPORT_KEY) || "revenue";
  if (!REPORTS.find((r) => r.id === state.activeReportId)) state.activeReportId = "revenue";
  state.period = localStorage.getItem(PERIOD_KEY) || "day";
  if (!["day", "week", "month"].includes(state.period)) state.period = "day";
  state.managerFilter = localStorage.getItem(MANAGER_KEY) || "all";
  try {
    const raw = localStorage.getItem(RANGE_KEY);
    const obj = raw ? JSON.parse(raw) : null;
    if (obj && obj.from && obj.to) { state.rangeFrom = obj.from; state.rangeTo = obj.to; }
  } catch (_) {}
  if (!state.rangeFrom || !state.rangeTo) [state.rangeFrom, state.rangeTo] = defaultRange(state.period);
  try {
    const raw = localStorage.getItem(DEMO_MODE_KEY);
    state.demoModes = raw ? JSON.parse(raw) : {};
    if (typeof state.demoModes !== "object" || !state.demoModes) state.demoModes = {};
  } catch (_) { state.demoModes = {}; }
  for (const id of NOT_IMPLEMENTED_REAL) {
    if (typeof state.demoModes[id] === "undefined") state.demoModes[id] = true;
  }
}
function persistState() {
  try {
    localStorage.setItem(REPORT_KEY, state.activeReportId);
    localStorage.setItem(PERIOD_KEY, state.period);
    localStorage.setItem(RANGE_KEY, JSON.stringify({ from: state.rangeFrom, to: state.rangeTo }));
    localStorage.setItem(MANAGER_KEY, state.managerFilter);
    localStorage.setItem(DEMO_MODE_KEY, JSON.stringify(state.demoModes));
  } catch (_) {}
}
function isDemoMode(rid) { return Boolean(state.demoModes[rid]); }

// ─── Time bucketing ─────────────────────────────────────────────────

function startOfDay(ts)   { const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime(); }
function startOfWeek(ts)  { const d = new Date(ts); d.setHours(0,0,0,0); const dy = d.getDay() || 7; d.setDate(d.getDate() - dy + 1); return d.getTime(); }
function startOfMonth(ts) { const d = new Date(ts); d.setHours(0,0,0,0); d.setDate(1); return d.getTime(); }
function bucketStart(ts, p) { return p === "month" ? startOfMonth(ts) : (p === "week" ? startOfWeek(ts) : startOfDay(ts)); }
function bucketNext(ts, p) {
  if (p === "month") { const d = new Date(ts); d.setMonth(d.getMonth() + 1); return d.getTime(); }
  if (p === "week") return ts + 7 * 86400000;
  return ts + 86400000;
}
function formatBucket(ts, p) {
  const d = new Date(ts);
  if (p === "month") return d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  if (p === "week") {
    const end = new Date(bucketNext(ts, p) - 86400000);
    return `неделя ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} — ${String(end.getDate()).padStart(2, "0")}.${String(end.getMonth() + 1).padStart(2, "0")}`;
  }
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}
function formatBucketShort(ts, p) {
  const d = new Date(ts);
  if (p === "month") return d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function generateBuckets(fromTs, toTs, period) {
  const buckets = [];
  let cur = bucketStart(fromTs, period);
  while (cur <= toTs && buckets.length < 366) { buckets.push(cur); cur = bucketNext(cur, period); }
  return buckets;
}
function defaultRange(period) {
  const to = Date.now();
  if (period === "month") return [to - 365 * 86400000, to];
  if (period === "week")  return [to - 90 * 86400000, to];
  return [to - 30 * 86400000, to];
}

// ─── Stage index ────────────────────────────────────────────────────

let _stagesIndex = null;
function buildStagesIndex() {
  const m = new Map();
  for (const p of (getPipelines() || [])) for (const s of (p.stages || [])) m.set(s.id, String(s.title || "").toLowerCase());
  _stagesIndex = m;
}
function stageTitleOf(id) { if (!_stagesIndex) buildStagesIndex(); return _stagesIndex.get(id) || ""; }

// ─── Backfill ───────────────────────────────────────────────────────

function backfillStageEventsOnce() {
  try {
    if (localStorage.getItem(BACKFILL_FLAG)) return;
    const deals = Store.list("deals") || [];
    const events = Store.list("deal_activities") || [];
    const validStageIds = new Set((getPipelines() || []).flatMap((p) => (p.stages || []).map((s) => s.id)));
    const have = new Set(events.filter((a) => a.type === "stage" && a.dealId).map((a) => a.dealId));
    let created = 0, skipped = 0;
    for (const d of deals) {
      if (!d.stage || have.has(d.id)) continue;
      if (!validStageIds.has(d.stage)) { skipped++; continue; }
      Store.create("deal_activities", { dealId: d.id, type: "stage", ts: d.updatedAt || d.createdAt || Date.now(), fromStage: null, toStage: d.stage, _synthetic: true });
      created++;
    }
    localStorage.setItem(BACKFILL_FLAG, "1");
    if (created > 0) console.log(`[dashboard] backfilled ${created} synthetic stage events`);
    if (skipped > 0) console.log(`[dashboard] skipped ${skipped} deals with orphan stage IDs`);
  } catch (e) { console.warn("[dashboard] backfill failed", e); }
}

// ─── Stage events ───────────────────────────────────────────────────

function listStageEvents() { return (Store.list("deal_activities") || []).filter((a) => a.type === "stage" && a.dealId && a.toStage); }
function stageEventsInPeriod(fromTs, toTs, matcher) {
  return listStageEvents().filter((a) => {
    const ts = a.ts || a.createdAt || 0;
    if (ts < fromTs || ts > toTs) return false;
    return matcher(stageTitleOf(a.toStage));
  });
}
function filterEventsByAssignee(events, assigneeId) {
  if (!assigneeId) return events;
  const dealMap = new Map((Store.list("deals") || []).map((d) => [d.id, d]));
  return events.filter((e) => {
    const d = dealMap.get(e.dealId);
    return d && (d.assigneeId === assigneeId || d.ownerId === assigneeId);
  });
}
function dedupFirstPerDeal(events) {
  const m = new Map();
  for (const e of events) {
    const ts = e.ts || e.createdAt || 0;
    const prev = m.get(e.dealId);
    if (!prev || ts < (prev.ts || prev.createdAt || 0)) m.set(e.dealId, e);
  }
  return [...m.values()];
}

const isPaidStage     = (t) => t.includes("оконча") || t.includes("выигр") || t === "won" || t.includes("расчёт") || t.includes("расчет");
const isKpStage       = (t) => t.includes("кп") || t.includes("предложен") || t.includes("proposal");
const isQuoteStage    = (t) => t.includes("просчёт") || t.includes("просчет") || t.includes("квалификац") || t === "qualified";
const isContractStage = (t) => t.includes("договор") || t.includes("contract");
const isAdvanceStage  = (t) => t.includes("аванс");

// ─── Item builders ──────────────────────────────────────────────────

function makeDealItemBuilder() {
  const dealMap = new Map((Store.list("deals") || []).map((d) => [d.id, d]));
  const contacts = new Map((Store.list("contacts") || []).map((c) => [c.id, c]));
  const employees = new Map((listEmployees() || []).map((e) => [e.id, e]));
  return (ev) => {
    const dealId = ev.dealId || ev.id;
    const d = dealMap.get(dealId); if (!d) return null;
    const c = contacts.get(d.contactId); const emp = employees.get(d.assigneeId);
    return {
      type: "deal", id: d.id, title: d.title || "Без названия",
      amount: Number(d.amount) || 0,
      contactName: c?.title || c?.name || "",
      assigneeName: emp?.name || emp?.email || "",
      ts: ev.ts || ev.updatedAt || ev.createdAt || d.updatedAt || 0,
    };
  };
}
function makeContactItemBuilder() {
  const employees = new Map((listEmployees() || []).map((e) => [e.id, e]));
  return (c) => {
    const emp = employees.get(c.ownerId || c.assigneeId || c.responsibleId);
    return { type: "contact", id: c.id, title: c.title || c.name || "Без имени",
      assigneeName: emp?.name || emp?.email || "", phone: c.phone || c.tel || "",
      ts: c.createdAt || c.ts || 0 };
  };
}
function makeCallItemBuilder() {
  const contacts = new Map((Store.list("contacts") || []).map((c) => [c.id, c]));
  const employees = new Map((listEmployees() || []).map((e) => [e.id, e]));
  return (call) => {
    const c = contacts.get(call.contactId);
    const emp = employees.get(call.userId || call.assigneeId || call.employeeId || call.operatorId || call.authorId);
    return { type: "call", id: call.id, title: c?.title || c?.name || call.title || "Звонок",
      duration: call.duration || 0, contactName: c?.title || c?.name || "",
      assigneeName: emp?.name || emp?.email || "",
      ts: call.ts || call.createdAt || call.startedAt || 0 };
  };
}

function bucketize(items, getTs, fromTs, toTs, period, accum, buildItem) {
  const buckets = generateBuckets(fromTs, toTs, period);
  const vals = new Map(buckets.map((b) => [b, 0]));
  const its = new Map(buckets.map((b) => [b, []]));
  for (const item of items) {
    const ts = getTs(item);
    if (!ts || ts < fromTs || ts > toTs) continue;
    const b = bucketStart(ts, period);
    if (vals.has(b)) {
      vals.set(b, vals.get(b) + accum(item));
      if (buildItem) { const built = buildItem(item); if (built) its.get(b).push(built); }
    }
  }
  return {
    labels: buckets.map((b) => formatBucketShort(b, period)),
    values: buckets.map((b) => vals.get(b) || 0),
    itemsByBucket: buckets.map((b) => its.get(b) || []),
    bucketsTs: buckets,
  };
}

function computeFromStageEvents(matcher, period, fromTs, toTs, assigneeId, dedup) {
  let events = filterEventsByAssignee(stageEventsInPeriod(fromTs, toTs, matcher), assigneeId);
  if (dedup) events = dedupFirstPerDeal(events);
  return bucketize(events, (e) => e.ts || e.createdAt || 0, fromTs, toTs, period, () => 1, makeDealItemBuilder());
}
function computeKpSent(p, f, t, a)    { return computeFromStageEvents(isKpStage, p, f, t, a, false); }
function computeQuotes(p, f, t, a)    { return computeFromStageEvents(isQuoteStage, p, f, t, a, false); }
function computePayments(p, f, t, a)  { return computeFromStageEvents((x) => isAdvanceStage(x) || isPaidStage(x), p, f, t, a, false); }
function computeContracts(p, f, t, a) { return computeFromStageEvents(isContractStage, p, f, t, a, true); }

function computeRevenue(period, fromTs, toTs, assigneeId) {
  let events = filterEventsByAssignee(stageEventsInPeriod(fromTs, toTs, isPaidStage), assigneeId);
  events = dedupFirstPerDeal(events);
  const dealMap = new Map((Store.list("deals") || []).map((d) => [d.id, d]));
  return bucketize(events, (e) => e.ts || e.createdAt || 0, fromTs, toTs, period,
    (e) => Number(dealMap.get(e.dealId)?.amount) || 0, makeDealItemBuilder());
}

function computeAvgCheck(period, fromTs, toTs, assigneeId) {
  let events = filterEventsByAssignee(stageEventsInPeriod(fromTs, toTs, isPaidStage), assigneeId);
  events = dedupFirstPerDeal(events);
  const dealMap = new Map((Store.list("deals") || []).map((d) => [d.id, d]));
  const builder = makeDealItemBuilder();
  const buckets = generateBuckets(fromTs, toTs, period);
  const sums = new Map(buckets.map((b) => [b, 0]));
  const cnts = new Map(buckets.map((b) => [b, 0]));
  const its = new Map(buckets.map((b) => [b, []]));
  for (const e of events) {
    const ts = e.ts || e.createdAt || 0;
    if (ts < fromTs || ts > toTs) continue;
    const b = bucketStart(ts, period);
    if (sums.has(b)) {
      sums.set(b, sums.get(b) + (Number(dealMap.get(e.dealId)?.amount) || 0));
      cnts.set(b, cnts.get(b) + 1);
      const built = builder(e); if (built) its.get(b).push(built);
    }
  }
  return {
    labels: buckets.map((b) => formatBucketShort(b, period)),
    values: buckets.map((b) => { const c = cnts.get(b) || 0; return c ? Math.round((sums.get(b) || 0) / c) : 0; }),
    itemsByBucket: buckets.map((b) => its.get(b) || []),
    bucketsTs: buckets,
  };
}

function computeNewClients(p, f, t, a) {
  let contacts = Store.list("contacts") || [];
  if (a) contacts = contacts.filter((c) => c.ownerId === a || c.assigneeId === a || c.responsibleId === a);
  return bucketize(contacts, (c) => c.createdAt || c.ts || 0, f, t, p, () => 1, makeContactItemBuilder());
}

function computeCalls(p, f, t, a) {
  let calls = Store.list("calls") || [];
  if (!calls.length) calls = (Store.list("deal_activities") || []).filter((x) => (x.type || "").toLowerCase() === "call");
  if (a) calls = calls.filter((c) => c.userId === a || c.assigneeId === a || c.employeeId === a || c.operatorId === a || c.authorId === a);
  return bucketize(calls, (c) => c.ts || c.createdAt || c.startedAt || 0, f, t, p, () => 1, makeCallItemBuilder());
}

function mockReport(rid, p, f, t, a) {
  const seedStr = `${rid}|${a || "all"}`;
  const buckets = generateBuckets(f, t, p);
  let seed = 0; for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) | 0;
  const rand = (max) => { seed = ((seed * 9301 + 49297) | 0) >>> 0; return seed % max; };
  const base = 25 + rand(75);
  return { labels: buckets.map((b) => formatBucketShort(b, p)), values: buckets.map(() => Math.max(0, base + rand(40) - 20)), itemsByBucket: buckets.map(() => []), bucketsTs: buckets, isMock: true };
}
function emptyReport(p, f, t) {
  const buckets = generateBuckets(f, t, p);
  return { labels: buckets.map((b) => formatBucketShort(b, p)), values: buckets.map(() => 0), itemsByBucket: buckets.map(() => []), bucketsTs: buckets, notImplemented: true };
}

function computeReport(rid, period, fromTs, toTs, opts) {
  const { useMock, assigneeId } = opts || {};
  if (useMock) return mockReport(rid, period, fromTs, toTs, assigneeId);
  if (NOT_IMPLEMENTED_REAL.has(rid)) return emptyReport(period, fromTs, toTs);
  switch (rid) {
    case "revenue":     return computeRevenue(period, fromTs, toTs, assigneeId);
    case "kp_sent":     return computeKpSent(period, fromTs, toTs, assigneeId);
    case "quotes":      return computeQuotes(period, fromTs, toTs, assigneeId);
    case "contracts":   return computeContracts(period, fromTs, toTs, assigneeId);
    case "payments":    return computePayments(period, fromTs, toTs, assigneeId);
    case "new_clients": return computeNewClients(period, fromTs, toTs, assigneeId);
    case "avg_check":   return computeAvgCheck(period, fromTs, toTs, assigneeId);
    case "calls":       return computeCalls(period, fromTs, toTs, assigneeId);
    default:            return emptyReport(period, fromTs, toTs);
  }
}

// ─── Goals & Formatting ─────────────────────────────────────────────

function goalKey(rid, p) { return `pllato_dashboard_goal_${rid}_${p}`; }
function getGoal(rid, p) {
  try { const v = parseFloat(localStorage.getItem(goalKey(rid, p))); return isFinite(v) && v > 0 ? v : null; }
  catch (_) { return null; }
}
function setGoal(rid, p, value) {
  try { if (value > 0) localStorage.setItem(goalKey(rid, p), String(value)); else localStorage.removeItem(goalKey(rid, p)); } catch (_) {}
}
function formatValue(n, unit) {
  if (unit === "₸") {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M ₸`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K ₸`;
    return `${n.toLocaleString("ru-RU")} ₸`;
  }
  if (unit === "—") return String(n);
  return `${n.toLocaleString("ru-RU")} ${unit}`;
}
function formatStat(n, unit) { return formatValue(Math.round(n), unit); }
function formatAmountFull(n) { return `${(Number(n) || 0).toLocaleString("ru-RU")} ₸`; }
function formatDuration(sec) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m === 0) return `${s} сек`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Sparkline & Trend ──────────────────────────────────────────────

function sparkline(values, color, goal) {
  if (!values || !values.length) return "";
  const W = 280, H = 48;
  const max = Math.max(...values, goal || 0, 1);
  const n = values.length;
  if (n === 1) return `<svg class="dr-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><circle cx="${W/2}" cy="${H/2}" r="3" fill="${color}"/></svg>`;
  const points = values.map((v, i) => {
    const x = (i / (n - 1)) * W;
    const y = H - (v / max) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polyPts = points.join(" ");
  const areaPts = `0,${H} ${polyPts} ${W},${H}`;
  const goalLine = (goal && goal > 0)
    ? `<line x1="0" y1="${(H - (goal / max) * (H - 4) - 2).toFixed(1)}" x2="${W}" y2="${(H - (goal / max) * (H - 4) - 2).toFixed(1)}" stroke="#ef4444" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>`
    : "";
  return `<svg class="dr-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <polygon points="${areaPts}" fill="${color}" opacity="0.15"/>
    <polyline points="${polyPts}" stroke="${color}" stroke-width="1.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    ${goalLine}
  </svg>`;
}

function computeTrend(values) {
  if (!values || values.length < 2) return { sign: "→", pct: 0, cls: "" };
  const mid = Math.floor(values.length / 2);
  const first = values.slice(0, mid);
  const second = values.slice(mid);
  const fA = first.reduce((a, b) => a + b, 0) / (first.length || 1);
  const sA = second.reduce((a, b) => a + b, 0) / (second.length || 1);
  if (fA === 0 && sA === 0) return { sign: "—", pct: 0, cls: "" };
  if (fA === 0) return { sign: "↑", pct: 100, cls: "positive" };
  const pct = Math.round(((sA - fA) / fA) * 100);
  if (pct > 5)  return { sign: "↑", pct, cls: "positive" };
  if (pct < -5) return { sign: "↓", pct, cls: "negative" };
  return { sign: "→", pct, cls: "" };
}

// ─── Render (combined view) ─────────────────────────────────────────

let _chartInstance = null;

export function renderDashboard(container) {
  loadState();
  backfillStageEventsOnce();
  buildStagesIndex();

  const activeReport = REPORTS.find((r) => r.id === state.activeReportId) || REPORTS[0];
  const period = state.period;
  const assigneeId = state.managerFilter === "all" ? null : state.managerFilter;
  const employees = listEmployees() || [];

  // Active report data
  const useMockActive = isDemoMode(activeReport.id);
  const activeData = computeReport(activeReport.id, period, state.rangeFrom, state.rangeTo, { useMock: useMockActive, assigneeId });
  const activeGoal = getGoal(activeReport.id, period);
  const activeSum = activeData.values.reduce((a, b) => a + b, 0);
  const activeMax = activeData.values.length ? Math.max(...activeData.values) : 0;
  const activeAvg = activeData.values.length ? activeSum / activeData.values.length : 0;

  // All cards (overview)
  const cards = REPORTS.map((r) => {
    const useMock = isDemoMode(r.id);
    const data = computeReport(r.id, period, state.rangeFrom, state.rangeTo, { useMock, assigneeId });
    const sum = data.values.reduce((a, b) => a + b, 0);
    const trend = computeTrend(data.values);
    const goal = getGoal(r.id, period);
    return { ...r, data, sum, trend, useMock, goal, notImplemented: data.notImplemented };
  });

  const fromStr = new Date(state.rangeFrom).toISOString().slice(0, 10);
  const toStr   = new Date(state.rangeTo).toISOString().slice(0, 10);

  const helpText = useMockActive
    ? "Демо-данные · клик по точке графика недоступен"
    : (activeData.notImplemented
        ? "⚠ Источник данных пока не реализован — переключите на «Демо» или дождитесь следующего PR"
        : (activeReport.itemType ? "Боевые данные · клик по точке графика → детали" : "Боевые данные · события перехода через стадии"));

  container.innerHTML = `
    <div class="dashboard-reports combined-mode">
      <!-- Top toolbar (filters for everything) -->
      <div class="dr-toolbar">
        <div class="dr-toolbar-left">
          <h2 class="dr-toolbar-title">Дашборд</h2>
          <span class="dr-toolbar-sub">Все 13 отчётов · клик по карточке внизу → большой график вверху</span>
        </div>
        <div class="dr-toolbar-controls">
          <select id="managerFilter" class="dr-manager-select">
            <option value="all" ${state.managerFilter === "all" ? "selected" : ""}>Вся компания</option>
            ${employees.map((e) => `<option value="${escape(e.id)}" ${state.managerFilter === e.id ? "selected" : ""}>${escape(e.name || e.email || e.id)}</option>`).join("")}
          </select>
          <div class="dr-period-switch">
            <button class="dr-period ${period === "day" ? "active" : ""}" data-period="day">День</button>
            <button class="dr-period ${period === "week" ? "active" : ""}" data-period="week">Неделя</button>
            <button class="dr-period ${period === "month" ? "active" : ""}" data-period="month">Месяц</button>
          </div>
          <div class="dr-range">
            <input type="date" id="rangeFrom" value="${fromStr}">
            <span>—</span>
            <input type="date" id="rangeTo" value="${toStr}">
          </div>
        </div>
      </div>

      <!-- Big chart section (active report) -->
      <section class="dr-active-section">
        <div class="dr-active-head">
          <div class="dr-active-title">
            <span class="dr-item-dot dr-active-dot" style="background:${activeReport.color}"></span>
            <h3>${escape(activeReport.title)}</h3>
            <div class="dr-mode-toggle">
              <button class="dr-mode ${!useMockActive ? "active" : ""}" data-mode="real">Боевые</button>
              <button class="dr-mode ${useMockActive ? "active" : ""}" data-mode="demo">Демо</button>
            </div>
          </div>
          <div class="dr-active-help ${activeData.notImplemented ? "dr-warn" : ""}">${escape(helpText)}</div>
        </div>

        <div class="dr-stats">
          <div class="dr-stat"><div class="dr-stat-label">Сумма</div><div class="dr-stat-value">${formatStat(activeSum, activeReport.unit)}</div></div>
          <div class="dr-stat"><div class="dr-stat-label">Среднее</div><div class="dr-stat-value">${formatStat(activeAvg, activeReport.unit)}</div></div>
          <div class="dr-stat"><div class="dr-stat-label">Пик</div><div class="dr-stat-value">${formatStat(activeMax, activeReport.unit)}</div></div>
          <div class="dr-stat dr-stat-goal">
            <div class="dr-stat-label">План (макс)</div>
            <div class="dr-stat-goal-input">
              <input type="number" min="0" step="1" id="goalInput" value="${activeGoal ?? ""}" placeholder="нет">
              <span class="dr-stat-unit">${escape(activeReport.unit === "—" ? "" : activeReport.unit)}</span>
            </div>
          </div>
        </div>

        <div class="dr-chart-wrap"><canvas id="reportChart"></canvas></div>
      </section>

      <!-- Overview grid (all cards) -->
      <section class="dr-overview-section">
        <h4 class="dr-section-title">Все отчёты</h4>
        <div class="dr-overview-grid">
          ${cards.map((c) => renderOverviewCard(c, c.id === activeReport.id)).join("")}
        </div>
      </section>
    </div>
  `;

  renderChart(activeReport, activeData, activeGoal, period, useMockActive);
  wireEvents(container);
}

function renderOverviewCard(c, isActive) {
  const trendTxt = c.trend.pct === 0 && c.trend.sign === "—"
    ? "нет данных"
    : (c.trend.pct === 0 ? "без изменений" : `${c.trend.sign} ${Math.abs(c.trend.pct)}%`);
  const goalTxt = c.goal && c.goal > 0 ? `<span class="dr-oc-goal">цель ${formatValue(c.goal, c.unit)}</span>` : "";
  return `
    <button class="dr-overview-card ${isActive ? "is-active" : ""}" data-report-id="${escape(c.id)}">
      <div class="dr-oc-head">
        <span class="dr-item-dot" style="background:${c.color}"></span>
        <span class="dr-oc-title">${escape(c.title)}</span>
        ${c.useMock ? `<span class="dr-item-badge">демо</span>` : ""}
      </div>
      <div class="dr-oc-main">
        <div class="dr-oc-value">${formatValue(Math.round(c.sum), c.unit)}</div>
        <div class="dr-oc-trend ${c.trend.cls}">${trendTxt}</div>
      </div>
      ${sparkline(c.data.values, c.color, c.goal)}
      <div class="dr-oc-footer">
        ${goalTxt}
        ${c.notImplemented ? `<span class="dr-oc-note">в разработке</span>` : ""}
      </div>
    </button>
  `;
}

function renderChart(report, data, goal, period, useMock) {
  if (typeof window.Chart === "undefined") { setTimeout(() => renderChart(report, data, goal, period, useMock), 200); return; }
  const canvas = document.getElementById("reportChart");
  if (!canvas) return;
  if (_chartInstance) { try { _chartInstance.destroy(); } catch (_) {} _chartInstance = null; }

  const datasets = [{
    label: report.title, data: data.values, borderColor: report.color,
    backgroundColor: hexToRgba(report.color, 0.12),
    borderWidth: 2, pointBackgroundColor: report.color, pointBorderColor: "#fff",
    pointBorderWidth: 1.5, pointRadius: data.values.length > 60 ? 0 : 4, pointHoverRadius: 7,
    tension: 0, fill: true,
  }];
  if (goal && goal > 0) {
    datasets.push({
      label: "План (макс)", data: data.values.map(() => goal),
      borderColor: "#ef4444", borderWidth: 1.5, borderDash: [6, 6],
      pointRadius: 0, tension: 0, fill: false,
    });
  }
  const maxValue = Math.max(...data.values, goal || 0, 1);
  const canDrill = !useMock && report.itemType && !data.notImplemented;

  _chartInstance = new window.Chart(canvas, {
    type: "line",
    data: { labels: data.labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      onHover: (ev, els) => { if (canDrill) canvas.style.cursor = els.length > 0 ? "pointer" : "default"; },
      onClick: (ev, els) => {
        if (!canDrill || !els.length) return;
        const idx = els[0].index;
        const items = (data.itemsByBucket && data.itemsByBucket[idx]) || [];
        const bucketTs = (data.bucketsTs && data.bucketsTs[idx]) || 0;
        showDrillModal(report, period, bucketTs, items, data.values[idx]);
      },
      plugins: {
        legend: { display: true, position: "top", labels: { boxWidth: 12, padding: 12, font: { size: 12 } } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatValue(Math.round(ctx.parsed.y), report.unit)}` } },
      },
      scales: {
        y: { beginAtZero: true, suggestedMax: maxValue * 1.1, grid: { color: "rgba(128,128,128,0.08)" }, ticks: { color: "#94a3b8", font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { color: "#94a3b8", maxRotation: 0, autoSkipPadding: 20, font: { size: 11 } } },
      },
    },
  });
}

function hexToRgba(hex, alpha) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function wireEvents(container) {
  // Card click → switch active report
  container.querySelectorAll("[data-report-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.activeReportId === btn.dataset.reportId) return; // already active
      state.activeReportId = btn.dataset.reportId;
      persistState();
      renderDashboard(container);
      // Scroll up to chart smoothly
      container.querySelector(".dr-active-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Demo/Real toggle (only for active)
  container.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.demoModes[state.activeReportId] = (btn.dataset.mode === "demo");
      persistState();
      renderDashboard(container);
    });
  });

  container.querySelector("#goalInput")?.addEventListener("change", (e) => {
    const v = parseFloat(e.target.value);
    setGoal(state.activeReportId, state.period, isFinite(v) ? v : 0);
    renderDashboard(container);
  });

  container.querySelector("#managerFilter")?.addEventListener("change", (e) => {
    state.managerFilter = e.target.value || "all"; persistState(); renderDashboard(container);
  });
  container.querySelectorAll("[data-period]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.period = btn.dataset.period;
      [state.rangeFrom, state.rangeTo] = defaultRange(state.period);
      persistState(); renderDashboard(container);
    });
  });
  container.querySelector("#rangeFrom")?.addEventListener("change", (e) => {
    const v = e.target.value; if (!v) return;
    const ts = new Date(v + "T00:00:00").getTime();
    if (ts > state.rangeTo) return;
    state.rangeFrom = ts; persistState(); renderDashboard(container);
  });
  container.querySelector("#rangeTo")?.addEventListener("change", (e) => {
    const v = e.target.value; if (!v) return;
    const ts = new Date(v + "T23:59:59").getTime();
    if (ts < state.rangeFrom) return;
    state.rangeTo = ts; persistState(); renderDashboard(container);
  });
}

// ─── Drill-down modal ───────────────────────────────────────────────

function showDrillModal(report, period, bucketTs, items, totalValue) {
  document.getElementById("drillModal")?.remove();
  const dateStr = formatBucket(bucketTs, period);
  const n = items.length;
  const noun = report.itemType === "deal" ? pluralRu(n, "сделка", "сделки", "сделок")
             : report.itemType === "contact" ? pluralRu(n, "контакт", "контакта", "контактов")
             : report.itemType === "call" ? pluralRu(n, "звонок", "звонка", "звонков")
             : "элементов";
  const totalText = report.unit === "₸" ? `Сумма: ${formatValue(totalValue, report.unit)}` : `Значение: ${formatValue(totalValue, report.unit)}`;
  const sorted = [...items].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const list = sorted.length
    ? sorted.map((it) => renderDrillItem(it, report.itemType)).join("")
    : `<div class="drill-empty">Нет элементов за этот период.</div>`;

  const modal = document.createElement("div");
  modal.id = "drillModal";
  modal.className = "drill-modal-backdrop";
  modal.innerHTML = `
    <div class="drill-modal" role="dialog">
      <div class="drill-modal-head">
        <div class="drill-modal-head-text">
          <h3>${escape(report.title)}</h3>
          <div class="drill-modal-sub">${escape(dateStr)} · ${n} ${escape(noun)} · ${escape(totalText)}</div>
        </div>
        <button class="drill-modal-close" type="button" aria-label="Закрыть">✕</button>
      </div>
      <div class="drill-modal-body">${list}</div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => { modal.remove(); document.removeEventListener("keydown", esc); };
  const esc = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", esc);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
    if (e.target.classList.contains("drill-modal-close")) close();
  });
}

function renderDrillItem(it) {
  const time = it.ts ? new Date(it.ts).toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
  let right = "";
  if (it.type === "deal" && (it.amount || it.amount === 0)) right = `<div class="drill-item-right">${formatAmountFull(it.amount)}</div>`;
  else if (it.type === "call" && it.duration) right = `<div class="drill-item-right">${formatDuration(it.duration)}</div>`;
  else right = `<div class="drill-item-right drill-item-time">${escape(time)}</div>`;
  const sub = [];
  if (it.contactName) sub.push(escape(it.contactName));
  if (it.phone) sub.push(escape(it.phone));
  if (it.assigneeName) sub.push(`<span class="drill-assignee">${escape(it.assigneeName)}</span>`);
  if (!sub.length && time && it.type === "deal") sub.push(escape(time));
  const icon = it.type === "deal" ? "💼" : it.type === "contact" ? "👤" : it.type === "call" ? "📞" : "·";
  return `
    <div class="drill-item">
      <div class="drill-item-icon">${icon}</div>
      <div class="drill-item-main">
        <div class="drill-item-title">${escape(it.title || "Без названия")}</div>
        ${sub.length ? `<div class="drill-item-sub">${sub.join(" · ")}</div>` : ""}
      </div>
      ${right}
    </div>
  `;
}
