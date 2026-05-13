// Pllato CRM — Дашборд v2.
// Виджет «Воронка», KPI задач, контакты, активность и НАСТРАИВАЕМЫЙ ГРАФИК
// по сделкам с выбором стадии / интервала (день/неделя/месяц) / метрики
// (количество сделок vs сумма).

import { Store } from "../store.js";
import { ICONS } from "../icons.js";
import { getStages } from "../stages.js";

const SETTINGS_KEY = "pllato_dashboard_chart";

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function initialsOf(name) {
  const parts = (name || "").trim().split(/\s+/);
  return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
}
function fmtAmount(n) {
  if (!n && n !== 0) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₸";
}
function fmtAmountShort(n) {
  if (!n) return "0";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".0", "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
}
function fmtRel(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин`;
  if (h < 24) return `${h} ч`;
  if (d < 30) return `${d} дн`;
  return new Date(ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}
function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
function startOfWeek(ts) {
  const d = new Date(ts);
  const day = (d.getDay() + 6) % 7; // понедельник = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
}
function startOfMonth(ts) {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function readChartSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null") || { stage: "all", interval: "day", metric: "count", days: 14 };
  } catch { return { stage: "all", interval: "day", metric: "count", days: 14 }; }
}
function saveChartSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

let chartSettings = readChartSettings();

function buildChartData(deals, stages) {
  const cfg = chartSettings;
  let filtered = deals;
  if (cfg.stage !== "all") filtered = filtered.filter(d => d.stage === cfg.stage);

  // Сетка бакетов по интервалу
  const now = Date.now();
  const bucketSize = cfg.interval === "month" ? 30 * 86400000 : cfg.interval === "week" ? 7 * 86400000 : 86400000;
  const periodDays = cfg.days || (cfg.interval === "day" ? 14 : cfg.interval === "week" ? 12 * 7 : 12 * 30);
  const from = startOfDay(now - periodDays * 86400000);

  const groupStart = cfg.interval === "month" ? startOfMonth : cfg.interval === "week" ? startOfWeek : startOfDay;
  const buckets = {};
  let cursor = groupStart(from);
  while (cursor <= now) {
    buckets[cursor] = 0;
    if (cfg.interval === "month") {
      const d = new Date(cursor);
      cursor = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    } else {
      cursor += bucketSize;
    }
  }

  filtered.forEach(d => {
    const ts = d.createdAt || 0;
    if (ts < from) return;
    const key = groupStart(ts);
    if (key in buckets) {
      buckets[key] += cfg.metric === "sum" ? (Number(d.amount) || 0) : 1;
    }
  });

  const data = Object.keys(buckets).sort((a, b) => Number(a) - Number(b)).map(k => ({
    ts: Number(k),
    value: buckets[k],
  }));
  return data;
}

function fmtBucketLabel(ts) {
  const d = new Date(ts);
  if (chartSettings.interval === "month") {
    return d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
  }
  if (chartSettings.interval === "week") {
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  }
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function renderChart(deals, stages) {
  chartSettings = readChartSettings();
  const data = buildChartData(deals, stages);
  const max = Math.max(1, ...data.map(d => d.value));
  const total = data.reduce((a, b) => a + b.value, 0);
  const stageColor = chartSettings.stage === "all"
    ? "var(--accent)"
    : (stages.find(s => s.id === chartSettings.stage)?.color || "var(--accent)");

  return `
    <section class="widget widget-wide chart-widget">
      <header class="widget-head">
        <h3>График по сделкам</h3>
        <span class="widget-sub">Всего за период: <strong>${chartSettings.metric === "sum" ? fmtAmount(total) : total + " шт"}</strong></span>
      </header>
      <div class="chart-controls">
        <label>Стадия
          <select id="chartStage">
            <option value="all" ${chartSettings.stage === "all" ? "selected" : ""}>Все</option>
            ${stages.map(s => `<option value="${s.id}" ${chartSettings.stage === s.id ? "selected" : ""}>${escape(s.title)}</option>`).join("")}
          </select>
        </label>
        <label>Интервал
          <select id="chartInterval">
            <option value="day" ${chartSettings.interval === "day" ? "selected" : ""}>День</option>
            <option value="week" ${chartSettings.interval === "week" ? "selected" : ""}>Неделя</option>
            <option value="month" ${chartSettings.interval === "month" ? "selected" : ""}>Месяц</option>
          </select>
        </label>
        <label>Метрика
          <select id="chartMetric">
            <option value="count" ${chartSettings.metric === "count" ? "selected" : ""}>Количество сделок</option>
            <option value="sum" ${chartSettings.metric === "sum" ? "selected" : ""}>Сумма (₸)</option>
          </select>
        </label>
        <label>Период
          <select id="chartDays">
            <option value="7" ${chartSettings.days === 7 ? "selected" : ""}>7 дней</option>
            <option value="14" ${chartSettings.days === 14 ? "selected" : ""}>14 дней</option>
            <option value="30" ${chartSettings.days === 30 ? "selected" : ""}>30 дней</option>
            <option value="90" ${chartSettings.days === 90 ? "selected" : ""}>90 дней</option>
            <option value="180" ${chartSettings.days === 180 ? "selected" : ""}>180 дней</option>
          </select>
        </label>
      </div>
      <div class="chart-area">
        ${data.length === 0 || total === 0
          ? `<div class="tl-empty">Нет данных за выбранный период.</div>`
          : `<div class="bars" style="--bar-color:${stageColor}">
              ${data.map(d => `
                <div class="bar-col" title="${fmtBucketLabel(d.ts)}: ${chartSettings.metric === "sum" ? fmtAmount(d.value) : d.value}">
                  <div class="bar-track">
                    <div class="bar-fill" style="height:${(d.value / max * 100).toFixed(0)}%"></div>
                    ${d.value > 0 ? `<div class="bar-val">${chartSettings.metric === "sum" ? fmtAmountShort(d.value) : d.value}</div>` : ""}
                  </div>
                  <div class="bar-label">${fmtBucketLabel(d.ts)}</div>
                </div>
              `).join("")}
            </div>`}
      </div>
    </section>
  `;
}

function pluralRu(n, one, few, many) {
  n = Math.abs(n) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return many;
  if (n1 > 1 && n1 < 5) return few;
  if (n1 === 1) return one;
  return many;
}

export function renderDashboard(container) {
  const deals = Store.list("deals");
  const contacts = Store.list("contacts");
  const tasks = Store.list("tasks");
  const feed = Store.list("feed");
  const stages = getStages();

  const activeDeals = deals.filter(d => d.stage !== "lost" && d.stage !== "won");
  const wonDeals = deals.filter(d => d.stage === "won");
  const forecast = activeDeals.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const wonSum = wonDeals.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const stageStats = stages.map(s => ({
    ...s,
    count: deals.filter(d => d.stage === s.id).length,
    sum: deals.filter(d => d.stage === s.id).reduce((a, d) => a + (Number(d.amount) || 0), 0),
  }));
  const maxStageSum = Math.max(1, ...stageStats.map(s => s.sum));

  const today = startOfDay(Date.now());
  const openTasks = tasks.filter(t => t.status !== "done");
  const overdueTasks = openTasks.filter(t => t.dueDate && startOfDay(t.dueDate) < today);
  const todayTasks = openTasks.filter(t => t.dueDate && startOfDay(t.dueDate) === today);
  const weekTasks = openTasks.filter(t => t.dueDate && startOfDay(t.dueDate) > today && startOfDay(t.dueDate) <= today + 7 * 86400000);

  const weekAgo = Date.now() - 7 * 86400000;
  const recentContacts = contacts.filter(c => c.createdAt > weekAgo);

  const recentPosts = feed.slice(0, 3);

  container.innerHTML = `
    <div class="dash-view">
      <div class="dash-grid">

        ${renderChart(deals, stages)}

        <section class="widget widget-wide">
          <header class="widget-head">
            <h3>Воронка продаж</h3>
            <span class="widget-sub">Активные сделки</span>
          </header>
          <div class="metric-row">
            <div class="metric">
              <div class="metric-label">Forecast</div>
              <div class="metric-value">${fmtAmount(forecast)}</div>
              <div class="metric-hint">${activeDeals.length} активных</div>
            </div>
            <div class="metric">
              <div class="metric-label">Выиграно</div>
              <div class="metric-value success">${fmtAmount(wonSum)}</div>
              <div class="metric-hint">${wonDeals.length} ${pluralRu(wonDeals.length, "сделка", "сделки", "сделок")}</div>
            </div>
          </div>
          <div class="stage-bars">
            ${stageStats.map(s => `
              <div class="stage-bar-row">
                <div class="stage-bar-head">
                  <span class="dot" style="background:${s.color}"></span>
                  <span class="stage-bar-name">${escape(s.title)}</span>
                  <span class="stage-bar-meta">${s.count} · ${fmtAmount(s.sum)}</span>
                </div>
                <div class="stage-bar-track">
                  <div class="stage-bar-fill" style="width: ${(s.sum / maxStageSum * 100).toFixed(0)}%; background: ${s.color}"></div>
                </div>
              </div>
            `).join("")}
          </div>
        </section>

        <section class="widget">
          <header class="widget-head">
            <h3>Задачи</h3>
            <span class="widget-sub">Что важно сегодня</span>
          </header>
          <div class="kpi-grid">
            <a class="kpi" href="#tasks">
              <div class="kpi-num ${overdueTasks.length > 0 ? "danger" : ""}">${overdueTasks.length}</div>
              <div class="kpi-label">Просрочено</div>
            </a>
            <a class="kpi" href="#tasks">
              <div class="kpi-num accent">${todayTasks.length}</div>
              <div class="kpi-label">На сегодня</div>
            </a>
            <a class="kpi" href="#tasks">
              <div class="kpi-num">${weekTasks.length}</div>
              <div class="kpi-label">На неделе</div>
            </a>
          </div>
          ${todayTasks.length > 0 ? `
            <div class="mini-list">
              ${todayTasks.slice(0, 3).map(t => `<div class="mini-item">${ICONS.tasks}<span>${escape(t.title)}</span></div>`).join("")}
            </div>
          ` : ""}
        </section>

        <section class="widget">
          <header class="widget-head">
            <h3>Контакты</h3>
            <span class="widget-sub">База клиентов</span>
          </header>
          <div class="kpi-grid">
            <a class="kpi" href="#contacts">
              <div class="kpi-num">${contacts.length}</div>
              <div class="kpi-label">Всего</div>
            </a>
            <a class="kpi" href="#contacts">
              <div class="kpi-num accent">+${recentContacts.length}</div>
              <div class="kpi-label">За неделю</div>
            </a>
          </div>
          ${contacts.slice(0, 3).length > 0 ? `
            <div class="mini-list">
              ${contacts.slice(0, 3).map(c => `
                <a class="mini-item" href="#contacts">
                  <div class="avatar avatar-xs">${initialsOf(c.name)}</div>
                  <span>${escape(c.name)}</span>
                  <span class="mini-sub">${escape(c.company || "")}</span>
                </a>
              `).join("")}
            </div>
          ` : ""}
        </section>

        <section class="widget widget-wide">
          <header class="widget-head">
            <h3>Активность команды</h3>
            <span class="widget-sub">Последние посты из ленты</span>
          </header>
          ${recentPosts.length > 0 ? `
            <div class="activity-list">
              ${recentPosts.map(p => `
                <a class="activity-item" href="#feed">
                  <div class="avatar avatar-sm">${initialsOf(p.authorName || p.author?.name || "?")}</div>
                  <div class="activity-body">
                    <div class="activity-head">
                      <span class="activity-author">${escape(p.authorName || p.author?.name || "?")}</span>
                      <span class="activity-time">${fmtRel(p.createdAt)}</span>
                    </div>
                    <div class="activity-text">${escape((p.text || "").slice(0, 160))}${p.text?.length > 160 ? "…" : ""}</div>
                  </div>
                </a>
              `).join("")}
            </div>
          ` : `<div class="widget-empty">Пока активности нет. <a href="#feed">Открой ленту</a> и напиши первый пост.</div>`}
        </section>

      </div>
    </div>
  `;

  wireChartEvents(container);
}

function wireChartEvents(container) {
  ["chartStage", "chartInterval", "chartMetric", "chartDays"].forEach(id => {
    container.querySelector("#" + id)?.addEventListener("change", e => {
      const settings = readChartSettings();
      if (id === "chartStage") settings.stage = e.target.value;
      if (id === "chartInterval") settings.interval = e.target.value;
      if (id === "chartMetric") settings.metric = e.target.value;
      if (id === "chartDays") settings.days = Number(e.target.value);
      saveChartSettings(settings);
      renderDashboard(container);
    });
  });
}
