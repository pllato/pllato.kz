// Pllato CRM — Дашборд v3: отчёты на основе истории переходов между стадиями.
// Источник данных: коллекция deal_activities, события type="stage" с fromStage/toStage/ts.
// Chart.js через CDN (см. index.html).

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

// ─── Catalog ────────────────────────────────────────────────────────

const REPORTS = [
  { id: "calls",            title: "Кол-во звонков",           unit: "шт",  color: "#3b82f6" },
  { id: "talk_traffic",     title: "Длительность разговоров",  unit: "мин", color: "#06b6d4" },
  { id: "kp_sent",          title: "КП отправлено",            unit: "шт",  color: "#a855f7" },
  { id: "quotes",           title: "Запросы на просчёт",       unit: "шт",  color: "#ec4899" },
  { id: "contracts",        title: "Договоры",                 unit: "шт",  color: "#b8895a" },
  { id: "payments",         title: "Оплаты",                   unit: "шт",  color: "#22c55e" },
  { id: "revenue",          title: "Выручка",                  unit: "₸",   color: "#15803d" },
  { id: "plan_fact",        title: "План / факт",              unit: "%",   color: "#f59e0b" },
  { id: "new_clients",      title: "Новые клиенты",            unit: "шт",  color: "#06b6d4" },
  { id: "avg_check",        title: "Средний чек",              unit: "₸",   color: "#a855f7" },
  { id: "items_per_check",  title: "Позиций в чеке",           unit: "шт",  color: "#3b82f6" },
  { id: "churn",            title: "Отток клиентов",           unit: "%",   color: "#ef4444" },
  { id: "abc_xyz",          title: "ABC-XYZ анализ",           unit: "—",   color: "#5d6b85" },
];

const NOT_IMPLEMENTED_REAL = new Set(["talk_traffic", "plan_fact", "items_per_check", "churn", "abc_xyz"]);

// ─── State ──────────────────────────────────────────────────────────

const state = {
  activeReportId: null,
  period: null,
  rangeFrom: null,
  rangeTo: null,
  managerFilter: "all",
  demoModes: {},
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
  if (!state.rangeFrom || !state.rangeTo) {
    [state.rangeFrom, state.rangeTo] = defaultRange(state.period);
  }
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

function isDemoMode(reportId) { return Boolean(state.demoModes[reportId]); }

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

// ─── Stage lookup across all pipelines ──────────────────────────────

let _stagesIndex = null;
function buildStagesIndex() {
  const m = new Map();
  const pipelines = getPipelines() || [];
  for (const p of pipelines) {
    for (const s of (p.stages || [])) m.set(s.id, String(s.title || "").toLowerCase());
  }
  _stagesIndex = m;
}
function stageTitleOf(stageId) {
  if (!_stagesIndex) buildStagesIndex();
  return _stagesIndex.get(stageId) || "";
}

// ─── ONE-TIME BACKFILL: create synthetic stage event for deals without history ──

function backfillStageEventsOnce() {
  try {
    if (localStorage.getItem(BACKFILL_FLAG)) return;
    const deals = Store.list("deals") || [];
    const events = Store.list("deal_activities") || [];
    const dealsWithStageEvents = new Set(
      events.filter((a) => a.type === "stage" && a.dealId).map((a) => a.dealId)
    );
    let created = 0;
    for (const d of deals) {
      if (!d.stage) continue;
      if (dealsWithStageEvents.has(d.id)) continue;
      Store.create("deal_activities", {
        dealId: d.id,
        type: "stage",
        ts: d.updatedAt || d.createdAt || Date.now(),
        fromStage: null,
        toStage: d.stage,
        _synthetic: true,
      });
      created++;
    }
    localStorage.setItem(BACKFILL_FLAG, "1");
    if (created > 0) console.log(`[dashboard] backfilled ${created} synthetic stage events for legacy deals`);
  } catch (e) {
    console.warn("[dashboard] backfill failed", e);
  }
}

// ─── Stage event queries ────────────────────────────────────────────

function listStageEvents() {
  return (Store.list("deal_activities") || [])
    .filter((a) => a.type === "stage" && a.dealId && a.toStage);
}

function stageEventsInPeriod(fromTs, toTs, toStageMatcher) {
  return listStageEvents().filter((a) => {
    const ts = a.ts || a.createdAt || 0;
    if (ts < fromTs || ts > toTs) return false;
    return toStageMatcher(stageTitleOf(a.toStage));
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

// Dedup: keep only the FIRST event per dealId (for once-only metrics like revenue / contract)
function dedupFirstPerDeal(events) {
  const firstByDeal = new Map();
  for (const e of events) {
    const ts = e.ts || e.createdAt || 0;
    const prev = firstByDeal.get(e.dealId);
    if (!prev || ts < (prev.ts || prev.createdAt || 0)) firstByDeal.set(e.dealId, e);
  }
  return [...firstByDeal.values()];
}

// ─── Stage matchers ─────────────────────────────────────────────────

const isPaidStage     = (t) => t.includes("оконча") || t.includes("выигр") || t === "won" || t.includes("расчёт") || t.includes("расчет");
const isKpStage       = (t) => t.includes("кп") || t.includes("предложен") || t.includes("proposal");
const isQuoteStage    = (t) => t.includes("просчёт") || t.includes("просчет") || t.includes("квалификац") || t === "qualified";
const isContractStage = (t) => t.includes("договор") || t.includes("contract");
const isAdvanceStage  = (t) => t.includes("аванс");

// ─── Bucketing helper ───────────────────────────────────────────────

function bucketize(items, getTs, fromTs, toTs, period, accum) {
  const buckets = generateBuckets(fromTs, toTs, period);
  const map = new Map(buckets.map((b) => [b, 0]));
  for (const item of items) {
    const ts = getTs(item);
    if (!ts || ts < fromTs || ts > toTs) continue;
    const b = bucketStart(ts, period);
    if (map.has(b)) map.set(b, map.get(b) + accum(item));
  }
  return {
    labels: buckets.map((b) => formatBucket(b, period)),
    values: buckets.map((b) => map.get(b) || 0),
  };
}

// ─── Real-data computations (HISTORY-BASED) ─────────────────────────

function computeFromStageEvents(matcher, period, fromTs, toTs, assigneeId, dedup) {
  let events = filterEventsByAssignee(stageEventsInPeriod(fromTs, toTs, matcher), assigneeId);
  if (dedup) events = dedupFirstPerDeal(events);
  return bucketize(events, (e) => e.ts || e.createdAt || 0, fromTs, toTs, period, () => 1);
}

// KP / Quotes / Payments — every transition counts (sent КП multiple times = multiple)
function computeKpSent(period, fromTs, toTs, assigneeId) {
  return computeFromStageEvents(isKpStage, period, fromTs, toTs, assigneeId, false);
}
function computeQuotes(period, fromTs, toTs, assigneeId) {
  return computeFromStageEvents(isQuoteStage, period, fromTs, toTs, assigneeId, false);
}
function computePayments(period, fromTs, toTs, assigneeId) {
  return computeFromStageEvents((t) => isAdvanceStage(t) || isPaidStage(t), period, fromTs, toTs, assigneeId, false);
}

// Contracts — typically one per deal (dedup)
function computeContracts(period, fromTs, toTs, assigneeId) {
  return computeFromStageEvents(isContractStage, period, fromTs, toTs, assigneeId, true);
}

// Revenue — once per deal (first time it became paid), sum current amount
function computeRevenue(period, fromTs, toTs, assigneeId) {
  let events = filterEventsByAssignee(stageEventsInPeriod(fromTs, toTs, isPaidStage), assigneeId);
  events = dedupFirstPerDeal(events);
  const dealMap = new Map((Store.list("deals") || []).map((d) => [d.id, d]));
  return bucketize(events, (e) => e.ts || e.createdAt || 0, fromTs, toTs, period, (e) => {
    const d = dealMap.get(e.dealId);
    return Number(d?.amount) || 0;
  });
}

function computeAvgCheck(period, fromTs, toTs, assigneeId) {
  let events = filterEventsByAssignee(stageEventsInPeriod(fromTs, toTs, isPaidStage), assigneeId);
  events = dedupFirstPerDeal(events);
  const dealMap = new Map((Store.list("deals") || []).map((d) => [d.id, d]));
  const buckets = generateBuckets(fromTs, toTs, period);
  const sums = new Map(buckets.map((b) => [b, 0]));
  const cnts = new Map(buckets.map((b) => [b, 0]));
  for (const e of events) {
    const ts = e.ts || e.createdAt || 0;
    if (ts < fromTs || ts > toTs) continue;
    const b = bucketStart(ts, period);
    if (sums.has(b)) {
      sums.set(b, sums.get(b) + (Number(dealMap.get(e.dealId)?.amount) || 0));
      cnts.set(b, cnts.get(b) + 1);
    }
  }
  return {
    labels: buckets.map((b) => formatBucket(b, period)),
    values: buckets.map((b) => {
      const c = cnts.get(b) || 0;
      return c ? Math.round((sums.get(b) || 0) / c) : 0;
    }),
  };
}

// Independent of stage history
function computeNewClients(period, fromTs, toTs, assigneeId) {
  let contacts = Store.list("contacts") || [];
  if (assigneeId) {
    contacts = contacts.filter((c) =>
      c.ownerId === assigneeId || c.assigneeId === assigneeId || c.responsibleId === assigneeId
    );
  }
  return bucketize(contacts, (c) => c.createdAt || c.ts || 0, fromTs, toTs, period, () => 1);
}

function computeCalls(period, fromTs, toTs, assigneeId) {
  let calls = Store.list("calls") || [];
  if (!calls.length) {
    const acts = Store.list("deal_activities") || [];
    calls = acts.filter((a) => (a.type || "").toLowerCase() === "call");
  }
  if (assigneeId) {
    calls = calls.filter((c) =>
      c.userId === assigneeId || c.assigneeId === assigneeId ||
      c.employeeId === assigneeId || c.operatorId === assigneeId ||
      c.authorId === assigneeId
    );
  }
  return bucketize(calls, (c) => c.ts || c.createdAt || c.startedAt || 0, fromTs, toTs, period, () => 1);
}

// ─── Synthetic data ─────────────────────────────────────────────────

function mockReport(reportId, period, fromTs, toTs, assigneeId) {
  const seedStr = `${reportId}|${assigneeId || "all"}`;
  const buckets = generateBuckets(fromTs, toTs, period);
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) | 0;
  const rand = (max) => { seed = ((seed * 9301 + 49297) | 0) >>> 0; return seed % max; };
  const base = 25 + rand(75);
  return {
    labels: buckets.map((b) => formatBucket(b, period)),
    values: buckets.map(() => Math.max(0, base + rand(40) - 20)),
  };
}

function emptyReport(period, fromTs, toTs) {
  const buckets = generateBuckets(fromTs, toTs, period);
  return { labels: buckets.map((b) => formatBucket(b, period)), values: buckets.map(() => 0), notImplemented: true };
}

function computeReport(reportId, period, fromTs, toTs, opts) {
  const { useMock, assigneeId } = opts || {};
  if (useMock) return mockReport(reportId, period, fromTs, toTs, assigneeId);
  if (NOT_IMPLEMENTED_REAL.has(reportId)) return emptyReport(period, fromTs, toTs);
  switch (reportId) {
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

function goalKey(reportId, period) { return `pllato_dashboard_goal_${reportId}_${period}`; }
function getGoal(reportId, period) {
  try { const v = parseFloat(localStorage.getItem(goalKey(reportId, period))); return isFinite(v) && v > 0 ? v : null; }
  catch (_) { return null; }
}
function setGoal(reportId, period, value) {
  try { if (value > 0) localStorage.setItem(goalKey(reportId, period), String(value));
        else localStorage.removeItem(goalKey(reportId, period)); }
  catch (_) {}
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

// ─── Render ─────────────────────────────────────────────────────────

let _chartInstance = null;

export function renderDashboard(container) {
  loadState();
  backfillStageEventsOnce();
  buildStagesIndex();

  const activeReport = REPORTS.find((r) => r.id === state.activeReportId) || REPORTS[0];
  const period = state.period;
  const useMock = isDemoMode(activeReport.id);
  const assigneeId = state.managerFilter === "all" ? null : state.managerFilter;
  const employees = listEmployees() || [];

  const data = computeReport(activeReport.id, period, state.rangeFrom, state.rangeTo, { useMock, assigneeId });
  const goal = getGoal(activeReport.id, period);

  const sum = data.values.reduce((a, b) => a + b, 0);
  const max = data.values.length ? Math.max(...data.values) : 0;
  const avg = data.values.length ? sum / data.values.length : 0;

  const fromDateStr = new Date(state.rangeFrom).toISOString().slice(0, 10);
  const toDateStr   = new Date(state.rangeTo).toISOString().slice(0, 10);

  const helpText = useMock
    ? "Демо-данные · отображаются синтетические значения для предпросмотра графика"
    : (data.notImplemented
        ? "⚠ Источник этих данных пока не реализован — переключите на «Демо» или дождитесь следующего PR"
        : "Боевые данные · считаются по событиям перехода сделок через стадии в выбранном периоде");

  container.innerHTML = `
    <div class="dashboard-reports">
      <aside class="dr-sidebar">
        <div class="dr-sidebar-title">Отчёты</div>
        <ul class="dr-list">
          ${REPORTS.map((r) => `
            <li>
              <button class="dr-item ${r.id === activeReport.id ? "active" : ""}" data-report-id="${escape(r.id)}">
                <span class="dr-item-dot" style="background:${r.color}"></span>
                <span class="dr-item-title">${escape(r.title)}</span>
                ${isDemoMode(r.id) ? `<span class="dr-item-badge">демо</span>` : ""}
              </button>
            </li>
          `).join("")}
        </ul>
      </aside>
      <main class="dr-main">
        <div class="dr-head">
          <div class="dr-head-title">
            <h2>${escape(activeReport.title)}</h2>
            <div class="dr-mode-toggle">
              <button class="dr-mode ${!useMock ? "active" : ""}" data-mode="real">Боевые</button>
              <button class="dr-mode ${useMock ? "active" : ""}" data-mode="demo">Демо</button>
            </div>
            <span class="dr-note ${data.notImplemented ? "dr-warn" : ""}">${escape(helpText)}</span>
          </div>
          <div class="dr-head-controls">
            <select id="managerFilter" class="dr-manager-select" title="Фильтр по менеджеру">
              <option value="all" ${state.managerFilter === "all" ? "selected" : ""}>Вся компания</option>
              ${employees.map((e) => `<option value="${escape(e.id)}" ${state.managerFilter === e.id ? "selected" : ""}>${escape(e.name || e.email || e.id)}</option>`).join("")}
            </select>
            <div class="dr-period-switch">
              <button class="dr-period ${period === "day" ? "active" : ""}" data-period="day">День</button>
              <button class="dr-period ${period === "week" ? "active" : ""}" data-period="week">Неделя</button>
              <button class="dr-period ${period === "month" ? "active" : ""}" data-period="month">Месяц</button>
            </div>
            <div class="dr-range">
              <input type="date" id="rangeFrom" value="${fromDateStr}">
              <span>—</span>
              <input type="date" id="rangeTo" value="${toDateStr}">
            </div>
          </div>
        </div>

        <div class="dr-stats">
          <div class="dr-stat">
            <div class="dr-stat-label">Сумма за период</div>
            <div class="dr-stat-value">${formatStat(sum, activeReport.unit)}</div>
          </div>
          <div class="dr-stat">
            <div class="dr-stat-label">Среднее</div>
            <div class="dr-stat-value">${formatStat(avg, activeReport.unit)}</div>
          </div>
          <div class="dr-stat">
            <div class="dr-stat-label">Пиковое значение</div>
            <div class="dr-stat-value">${formatStat(max, activeReport.unit)}</div>
          </div>
          <div class="dr-stat dr-stat-goal">
            <div class="dr-stat-label">План (макс)</div>
            <div class="dr-stat-goal-input">
              <input type="number" min="0" step="1" id="goalInput" value="${goal ?? ""}" placeholder="нет">
              <span class="dr-stat-unit">${escape(activeReport.unit === "—" ? "" : activeReport.unit)}</span>
            </div>
          </div>
        </div>

        <div class="dr-chart-wrap">
          <canvas id="reportChart"></canvas>
        </div>
      </main>
    </div>
  `;

  renderChart(activeReport, data, goal, period);
  wireDashboardEvents(container);
}

function renderChart(report, data, goal, period) {
  if (typeof window.Chart === "undefined") {
    setTimeout(() => renderChart(report, data, goal, period), 200);
    return;
  }
  const canvas = document.getElementById("reportChart");
  if (!canvas) return;
  if (_chartInstance) { try { _chartInstance.destroy(); } catch (_) {} _chartInstance = null; }

  const datasets = [{
    label: report.title,
    data: data.values,
    borderColor: report.color,
    backgroundColor: hexToRgba(report.color, 0.12),
    borderWidth: 2,
    pointBackgroundColor: report.color,
    pointBorderColor: "#fff",
    pointBorderWidth: 1.5,
    pointRadius: data.values.length > 60 ? 0 : 3,
    pointHoverRadius: 6,
    tension: 0,
    fill: true,
  }];

  if (goal && goal > 0) {
    datasets.push({
      label: "План (макс)",
      data: data.values.map(() => goal),
      borderColor: "#ef4444",
      borderWidth: 1.5,
      borderDash: [6, 6],
      pointRadius: 0,
      tension: 0,
      fill: false,
    });
  }

  const maxValue = Math.max(...data.values, goal || 0, 1);

  _chartInstance = new window.Chart(canvas, {
    type: "line",
    data: { labels: data.labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
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
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function wireDashboardEvents(container) {
  container.querySelectorAll("[data-report-id]").forEach((btn) => {
    btn.addEventListener("click", () => { state.activeReportId = btn.dataset.reportId; persistState(); renderDashboard(container); });
  });
  container.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => { state.demoModes[state.activeReportId] = (btn.dataset.mode === "demo"); persistState(); renderDashboard(container); });
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
  container.querySelector("#goalInput")?.addEventListener("change", (e) => {
    const v = parseFloat(e.target.value);
    setGoal(state.activeReportId, state.period, isFinite(v) ? v : 0);
    renderDashboard(container);
  });
}
