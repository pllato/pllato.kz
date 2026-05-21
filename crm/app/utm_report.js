// Pllato CRM — UTM Analytics Report Module.
// Phase 4: модалка с аналитикой по UTM-источникам.
// Метрики: количество, сумма, средний чек, конверсия по источникам/каналам/кампаниям.

import { Store } from "./store.js";
import { UTM_SOURCE_PRESETS, getSourcePreset } from "./utm.js";

// === Утилиты ===

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(s) { return escapeHtml(s); }

function fmtNum(n) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(Number(n) || 0));
}

function fmtMoney(n) {
  return `${fmtNum(n)} ₸`;
}

function fmtPct(n) {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

// === Период ===

const PERIODS = {
  today: { label: "Сегодня", days: 1 },
  week: { label: "7 дней", days: 7 },
  month: { label: "30 дней", days: 30 },
  quarter: { label: "Квартал", days: 90 },
  year: { label: "Год", days: 365 },
  all: { label: "Всё время", days: null },
};

function getPeriodRange(periodKey) {
  const p = PERIODS[periodKey] || PERIODS.month;
  if (!p.days) return { from: 0, to: Date.now() };
  const now = Date.now();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (periodKey !== "today") start.setDate(start.getDate() - p.days + 1);
  return { from: start.getTime(), to: now };
}

// === Подсчёт статистики ===

function computeUtmStats(deals, range, dimension = "source") {
  const filtered = deals.filter((d) => {
    if (d.isDeleted) return false;
    const ts = d.createdAt || d.ts || 0;
    return ts >= range.from && ts <= range.to;
  });

  const groups = new Map();
  let totalCount = 0, totalAmount = 0, untaggedCount = 0, untaggedAmount = 0;

  filtered.forEach((d) => {
    const key = String(d[`utm${dimension.charAt(0).toUpperCase() + dimension.slice(1)}`] || "").trim();
    const amount = Number(d.amount) || 0;
    totalCount++;
    totalAmount += amount;
    if (!key) {
      untaggedCount++;
      untaggedAmount += amount;
      return;
    }
    if (!groups.has(key)) {
      groups.set(key, { key, count: 0, amount: 0, deals: [] });
    }
    const g = groups.get(key);
    g.count++;
    g.amount += amount;
    g.deals.push(d);
  });

  // Сортировка по сумме (по убыванию)
  const rows = Array.from(groups.values())
    .sort((a, b) => b.amount - a.amount)
    .map((g) => ({
      ...g,
      avgCheck: g.count > 0 ? g.amount / g.count : 0,
      sharePct: totalAmount > 0 ? g.amount / totalAmount : 0,
    }));

  return {
    totalCount,
    totalAmount,
    avgCheck: totalCount > 0 ? totalAmount / totalCount : 0,
    rows,
    untagged: { count: untaggedCount, amount: untaggedAmount, sharePct: totalAmount > 0 ? untaggedAmount / totalAmount : 0 },
  };
}

// === Рендер баров по источникам ===

function renderBarChart(rows, accentColor = "#22c55e") {
  if (rows.length === 0) return "";
  const maxAmount = Math.max(...rows.map((r) => r.amount), 1);

  return `
    <div class="utm-rep-bars">
      ${rows.slice(0, 10).map((r) => {
        const width = (r.amount / maxAmount) * 100;
        const preset = getSourcePreset(r.key);
        return `
          <div class="utm-rep-bar-row">
            <div class="utm-rep-bar-label">
              <span class="utm-bar-icon" style="color:${preset.color}">${preset.icon}</span>
              <span class="utm-bar-name">${escapeHtml(preset.label || r.key)}</span>
            </div>
            <div class="utm-rep-bar-track">
              <div class="utm-rep-bar-fill" style="width:${width}%;background:${preset.color}"></div>
            </div>
            <div class="utm-rep-bar-value">${fmtMoney(r.amount)}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

// === Рендер таблицы по источникам ===

function renderStatsTable(stats, dimensionLabel) {
  if (stats.rows.length === 0 && stats.untagged.count === 0) {
    return `<div class="utm-rep-empty">Нет сделок за выбранный период</div>`;
  }
  return `
    <table class="utm-rep-table">
      <thead>
        <tr>
          <th>${escapeHtml(dimensionLabel)}</th>
          <th class="num">Сделок</th>
          <th class="num">Сумма</th>
          <th class="num">Средний чек</th>
          <th class="num">Доля</th>
        </tr>
      </thead>
      <tbody>
        ${stats.rows.map((r) => {
          const preset = getSourcePreset(r.key);
          return `
            <tr>
              <td>
                <span class="utm-rep-row-label">
                  <span class="utm-rep-dot" style="background:${preset.color}"></span>
                  <strong>${escapeHtml(preset.label || r.key)}</strong>
                  <span class="utm-rep-row-key">${escapeHtml(r.key)}</span>
                </span>
              </td>
              <td class="num">${fmtNum(r.count)}</td>
              <td class="num"><strong>${fmtMoney(r.amount)}</strong></td>
              <td class="num">${fmtMoney(r.avgCheck)}</td>
              <td class="num">${fmtPct(r.sharePct)}</td>
            </tr>
          `;
        }).join("")}
        ${stats.untagged.count > 0 ? `
          <tr class="utm-rep-untagged">
            <td><em>Без метки</em></td>
            <td class="num">${fmtNum(stats.untagged.count)}</td>
            <td class="num">${fmtMoney(stats.untagged.amount)}</td>
            <td class="num">${fmtMoney(stats.untagged.count > 0 ? stats.untagged.amount / stats.untagged.count : 0)}</td>
            <td class="num">${fmtPct(stats.untagged.sharePct)}</td>
          </tr>
        ` : ""}
      </tbody>
    </table>
  `;
}

// === CSV export ===

function exportCsv(stats, dimensionLabel) {
  const header = `${dimensionLabel},Сделок,Сумма,Средний чек,Доля %\n`;
  const rows = stats.rows.map((r) =>
    `"${r.key}",${r.count},${r.amount},${Math.round(r.avgCheck)},${(r.sharePct * 100).toFixed(1)}`
  ).join("\n");
  const untagged = stats.untagged.count > 0
    ? `\n"Без метки",${stats.untagged.count},${stats.untagged.amount},${Math.round(stats.untagged.count > 0 ? stats.untagged.amount / stats.untagged.count : 0)},${(stats.untagged.sharePct * 100).toFixed(1)}`
    : "";
  const csv = header + rows + untagged;
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `utm_report_${dimensionLabel.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// === Модалка ===

const modalState = {
  mountEl: null,
  period: "month",
  dimension: "source", // source | medium | campaign
};

function refreshReport() {
  if (!modalState.mountEl) return;
  const fresh = document.createElement("div");
  fresh.innerHTML = renderReportContentHTML();
  const newRoot = fresh.firstElementChild;
  if (newRoot) {
    const body = modalState.mountEl.querySelector(".utm-rep-body");
    if (body) body.innerHTML = newRoot.innerHTML;
  }
  wireBodyHandlers();
}

function renderReportContentHTML() {
  const deals = Store.list("deals");
  const range = getPeriodRange(modalState.period);
  const stats = computeUtmStats(deals, range, modalState.dimension);

  const dimensionLabel = {
    source: "Источник",
    medium: "Канал",
    campaign: "Кампания",
  }[modalState.dimension] || "Источник";

  return `<div class="utm-rep-content">
    <!-- KPI карточки -->
    <div class="utm-rep-kpis">
      <div class="utm-rep-kpi">
        <div class="utm-rep-kpi-label">Сделок</div>
        <div class="utm-rep-kpi-value">${fmtNum(stats.totalCount)}</div>
      </div>
      <div class="utm-rep-kpi">
        <div class="utm-rep-kpi-label">Выручка</div>
        <div class="utm-rep-kpi-value">${fmtMoney(stats.totalAmount)}</div>
      </div>
      <div class="utm-rep-kpi">
        <div class="utm-rep-kpi-label">Средний чек</div>
        <div class="utm-rep-kpi-value">${fmtMoney(stats.avgCheck)}</div>
      </div>
      <div class="utm-rep-kpi">
        <div class="utm-rep-kpi-label">С UTM-метками</div>
        <div class="utm-rep-kpi-value">${fmtPct(stats.totalCount > 0 ? (stats.totalCount - stats.untagged.count) / stats.totalCount : 0)}</div>
      </div>
    </div>

    <!-- Bar chart -->
    ${stats.rows.length > 0 ? `
      <div class="utm-rep-section">
        <h3>Топ ${Math.min(10, stats.rows.length)} по сумме · ${escapeHtml(dimensionLabel)}</h3>
        ${renderBarChart(stats.rows)}
      </div>
    ` : ""}

    <!-- Таблица -->
    <div class="utm-rep-section">
      <h3>Разбивка по ${dimensionLabel.toLowerCase()}</h3>
      ${renderStatsTable(stats, dimensionLabel)}
    </div>
  </div>`;
}

function renderReportModalHTML() {
  const periodButtons = Object.entries(PERIODS).map(([k, v]) =>
    `<button class="utm-rep-period-btn ${modalState.period === k ? "active" : ""}" data-utm-period="${k}">${escapeHtml(v.label)}</button>`
  ).join("");

  const dimButtons = [
    { id: "source", label: "По источникам" },
    { id: "medium", label: "По каналам" },
    { id: "campaign", label: "По кампаниям" },
  ].map((d) =>
    `<button class="utm-rep-dim-btn ${modalState.dimension === d.id ? "active" : ""}" data-utm-dim="${d.id}">${escapeHtml(d.label)}</button>`
  ).join("");

  return `<div class="utm-rep-backdrop" data-utm-rep-backdrop>
    <div class="utm-rep-modal" role="dialog" aria-modal="true">
      <header class="utm-rep-header">
        <div class="utm-rep-title">
          📊 <strong>UTM-аналитика</strong>
        </div>
        <button type="button" class="btn-ghost icon-only" data-utm-rep-close aria-label="Закрыть">✕</button>
      </header>
      <div class="utm-rep-controls">
        <div class="utm-rep-control-group">
          <div class="utm-rep-control-label">Период</div>
          <div class="utm-rep-control-row">${periodButtons}</div>
        </div>
        <div class="utm-rep-control-group">
          <div class="utm-rep-control-label">Группировка</div>
          <div class="utm-rep-control-row">${dimButtons}</div>
        </div>
        <div class="utm-rep-control-spacer"></div>
        <button type="button" class="btn-ghost btn-sm" data-utm-rep-export>📥 Экспорт CSV</button>
      </div>
      <div class="utm-rep-body">
        ${renderReportContentHTML()}
      </div>
    </div>
  </div>`;
}

function wireBodyHandlers() {
  if (!modalState.mountEl) return;
  const root = modalState.mountEl;

  root.querySelectorAll("[data-utm-period]").forEach((btn) => {
    btn.addEventListener("click", () => {
      modalState.period = btn.dataset.utmPeriod;
      const fresh = document.createElement("div");
      fresh.innerHTML = renderReportModalHTML();
      const newRoot = fresh.firstElementChild;
      if (newRoot) {
        modalState.mountEl.replaceWith(newRoot);
        modalState.mountEl = newRoot;
        wireModalHandlers();
      }
    });
  });

  root.querySelectorAll("[data-utm-dim]").forEach((btn) => {
    btn.addEventListener("click", () => {
      modalState.dimension = btn.dataset.utmDim;
      const fresh = document.createElement("div");
      fresh.innerHTML = renderReportModalHTML();
      const newRoot = fresh.firstElementChild;
      if (newRoot) {
        modalState.mountEl.replaceWith(newRoot);
        modalState.mountEl = newRoot;
        wireModalHandlers();
      }
    });
  });
}

function wireModalHandlers() {
  if (!modalState.mountEl) return;
  const root = modalState.mountEl;

  // Close
  root.querySelectorAll("[data-utm-rep-close]").forEach((btn) =>
    btn.addEventListener("click", closeUtmReport));
  root.querySelector("[data-utm-rep-backdrop]")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeUtmReport();
  });

  // CSV export
  root.querySelector("[data-utm-rep-export]")?.addEventListener("click", () => {
    const deals = Store.list("deals");
    const range = getPeriodRange(modalState.period);
    const stats = computeUtmStats(deals, range, modalState.dimension);
    const dimLabel = {
      source: "Источник", medium: "Канал", campaign: "Кампания",
    }[modalState.dimension];
    exportCsv(stats, dimLabel);
  });

  // Period/dim buttons
  wireBodyHandlers();

  // Escape
  if (!modalState._escHandler) {
    modalState._escHandler = (e) => { if (e.key === "Escape") closeUtmReport(); };
    document.addEventListener("keydown", modalState._escHandler);
  }
}

export function openUtmReport() {
  if (modalState.mountEl) closeUtmReport();
  const wrap = document.createElement("div");
  wrap.innerHTML = renderReportModalHTML();
  const root = wrap.firstElementChild;
  if (!root) return;
  document.body.appendChild(root);
  modalState.mountEl = root;
  wireModalHandlers();
}

export function closeUtmReport() {
  if (modalState.mountEl) {
    modalState.mountEl.remove();
    modalState.mountEl = null;
  }
  if (modalState._escHandler) {
    document.removeEventListener("keydown", modalState._escHandler);
    modalState._escHandler = null;
  }
}
