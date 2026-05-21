// Pllato CRM — UTM Analytics & Builder embedded block.
// Рендерится внутри Дашборда. Два блока: (1) аналитика (2) конструктор ссылок.

import { Store } from "./store.js";
import { UTM_SOURCE_PRESETS, UTM_MEDIUM_PRESETS, getSourcePreset } from "./utm.js";

// === Утилиты ===
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
const fmtNum = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(Number(n) || 0));
const fmtMoney = (n) => `${fmtNum(n)} ₸`;
const fmtPct = (n) => (!isFinite(n) ? "—" : `${(n * 100).toFixed(1)}%`);

const PERIODS = {
  today: { label: "Сегодня", days: 1 },
  week: { label: "7 дней", days: 7 },
  month: { label: "30 дней", days: 30 },
  quarter: { label: "Квартал", days: 90 },
  year: { label: "Год", days: 365 },
  all: { label: "Всё", days: null },
};

function getPeriodRange(periodKey) {
  const p = PERIODS[periodKey] || PERIODS.month;
  if (!p.days) return { from: 0, to: Date.now() };
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (periodKey !== "today") start.setDate(start.getDate() - p.days + 1);
  return { from: start.getTime(), to: Date.now() };
}

function computeUtmStats(deals, range, dimension = "source") {
  const dimKey = `utm${dimension.charAt(0).toUpperCase() + dimension.slice(1)}`;
  const filtered = deals.filter((d) => {
    if (d.isDeleted) return false;
    const ts = d.createdAt || d.ts || 0;
    return ts >= range.from && ts <= range.to;
  });
  const groups = new Map();
  let totalCount = 0, totalAmount = 0, untaggedCount = 0, untaggedAmount = 0;
  filtered.forEach((d) => {
    const key = String(d[dimKey] || "").trim();
    const amount = Number(d.amount) || 0;
    totalCount++; totalAmount += amount;
    if (!key) { untaggedCount++; untaggedAmount += amount; return; }
    if (!groups.has(key)) groups.set(key, { key, count: 0, amount: 0 });
    const g = groups.get(key);
    g.count++; g.amount += amount;
  });
  const rows = Array.from(groups.values())
    .sort((a, b) => b.amount - a.amount)
    .map((g) => ({
      ...g,
      avgCheck: g.count > 0 ? g.amount / g.count : 0,
      sharePct: totalAmount > 0 ? g.amount / totalAmount : 0,
    }));
  return {
    totalCount, totalAmount,
    avgCheck: totalCount > 0 ? totalAmount / totalCount : 0,
    rows,
    untagged: { count: untaggedCount, amount: untaggedAmount, sharePct: totalAmount > 0 ? untaggedAmount / totalAmount : 0 },
  };
}

function renderBarChart(rows) {
  if (rows.length === 0) return "";
  const maxAmount = Math.max(...rows.map((r) => r.amount), 1);
  return `<div class="utm-block-bars">
    ${rows.slice(0, 10).map((r) => {
      const width = (r.amount / maxAmount) * 100;
      const preset = getSourcePreset(r.key);
      return `<div class="utm-block-bar-row">
        <div class="utm-block-bar-label">
          <span style="color:${preset.color}">${preset.icon}</span>
          <span>${escapeHtml(preset.label || r.key)}</span>
        </div>
        <div class="utm-block-bar-track">
          <div class="utm-block-bar-fill" style="width:${width}%;background:${preset.color}"></div>
        </div>
        <div class="utm-block-bar-value">${fmtMoney(r.amount)}</div>
      </div>`;
    }).join("")}
  </div>`;
}

function renderStatsTable(stats, dimensionLabel) {
  if (stats.rows.length === 0 && stats.untagged.count === 0) {
    return `<div class="utm-block-empty">Нет сделок за выбранный период</div>`;
  }
  return `<table class="utm-block-table">
    <thead>
      <tr>
        <th>${escapeHtml(dimensionLabel)}</th>
        <th class="num">Сделок</th>
        <th class="num">Сумма</th>
        <th class="num">Средний</th>
        <th class="num">Доля</th>
      </tr>
    </thead>
    <tbody>
      ${stats.rows.map((r) => {
        const preset = getSourcePreset(r.key);
        return `<tr>
          <td><span class="utm-block-dot" style="background:${preset.color}"></span><strong>${escapeHtml(preset.label || r.key)}</strong> <span class="utm-block-key">${escapeHtml(r.key)}</span></td>
          <td class="num">${fmtNum(r.count)}</td>
          <td class="num"><strong>${fmtMoney(r.amount)}</strong></td>
          <td class="num">${fmtMoney(r.avgCheck)}</td>
          <td class="num">${fmtPct(r.sharePct)}</td>
        </tr>`;
      }).join("")}
      ${stats.untagged.count > 0 ? `<tr class="utm-block-untagged">
        <td><em>Без метки</em></td>
        <td class="num">${fmtNum(stats.untagged.count)}</td>
        <td class="num">${fmtMoney(stats.untagged.amount)}</td>
        <td class="num">${fmtMoney(stats.untagged.count > 0 ? stats.untagged.amount / stats.untagged.count : 0)}</td>
        <td class="num">${fmtPct(stats.untagged.sharePct)}</td>
      </tr>` : ""}
    </tbody>
  </table>`;
}

function exportCsv(stats, dimensionLabel) {
  const header = `${dimensionLabel},Сделок,Сумма,Средний,Доля %\n`;
  const rows = stats.rows.map((r) =>
    `"${r.key}",${r.count},${r.amount},${Math.round(r.avgCheck)},${(r.sharePct * 100).toFixed(1)}`
  ).join("\n");
  const untagged = stats.untagged.count > 0
    ? `\n"Без метки",${stats.untagged.count},${stats.untagged.amount},${Math.round(stats.untagged.amount / Math.max(1, stats.untagged.count))},${(stats.untagged.sharePct * 100).toFixed(1)}`
    : "";
  const blob = new Blob(["\uFEFF" + header + rows + untagged], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `utm_${dimensionLabel.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// === Состояние блока (в localStorage чтобы не сбрасывалось при переходах) ===
const STORAGE_PERIOD = "pllato_utm_block_period";
const STORAGE_DIM = "pllato_utm_block_dim";
const STORAGE_HISTORY = "pllato_utm_builder_history";

function getStoredPeriod() { return localStorage.getItem(STORAGE_PERIOD) || "month"; }
function setStoredPeriod(v) { localStorage.setItem(STORAGE_PERIOD, v); }
function getStoredDim() { return localStorage.getItem(STORAGE_DIM) || "source"; }
function setStoredDim(v) { localStorage.setItem(STORAGE_DIM, v); }

function getHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_HISTORY) || "[]"); }
  catch { return []; }
}
function addToHistory(entry) {
  const hist = getHistory();
  hist.unshift({ ...entry, savedAt: Date.now(), id: "utm_" + Date.now() });
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(hist.slice(0, 30)));
}
function removeFromHistory(id) {
  const hist = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(hist));
}

// === Builder ===

function buildUtmUrl({ baseUrl, source, medium, campaign, content, term }) {
  if (!baseUrl) return "";
  let url;
  try { url = new URL(baseUrl); } catch (e) { return ""; }
  const fields = { utm_source: source, utm_medium: medium, utm_campaign: campaign, utm_content: content, utm_term: term };
  Object.entries(fields).forEach(([k, v]) => {
    if (v && String(v).trim()) url.searchParams.set(k, String(v).trim());
    else url.searchParams.delete(k);
  });
  return url.toString();
}

function renderBuilderHTML() {
  const sourceOpts = Object.entries(UTM_SOURCE_PRESETS)
    .filter(([k]) => k !== "")
    .map(([k]) => `<option value="${k}">`).join("");
  const mediumOpts = Object.entries(UTM_MEDIUM_PRESETS)
    .filter(([k]) => k !== "")
    .map(([k]) => `<option value="${k}">`).join("");

  return `<div class="utm-builder">
    <div class="utm-builder-header">
      <h4>🔧 Конструктор UTM-ссылок</h4>
      <span class="utm-builder-sub">Создавай ссылки для рекламных площадок — Google Ads, Instagram, Facebook</span>
    </div>
    <div class="utm-builder-grid">
      <label class="utm-builder-field utm-builder-field-wide">
        <span>Базовая ссылка *</span>
        <input type="url" id="ub-url" placeholder="https://aminamed.kz/" value="https://aminamed.kz/">
      </label>
      <label class="utm-builder-field">
        <span>Источник (utm_source) *</span>
        <input type="text" id="ub-source" list="ub-sources-list" placeholder="google">
        <datalist id="ub-sources-list">${sourceOpts}</datalist>
      </label>
      <label class="utm-builder-field">
        <span>Канал (utm_medium)</span>
        <input type="text" id="ub-medium" list="ub-mediums-list" placeholder="cpc">
        <datalist id="ub-mediums-list">${mediumOpts}</datalist>
      </label>
      <label class="utm-builder-field">
        <span>Кампания (utm_campaign)</span>
        <input type="text" id="ub-campaign" placeholder="summer_2026">
      </label>
      <label class="utm-builder-field">
        <span>Креатив (utm_content)</span>
        <input type="text" id="ub-content" placeholder="banner_320x100">
      </label>
      <label class="utm-builder-field">
        <span>Ключ (utm_term)</span>
        <input type="text" id="ub-term" placeholder="ключевое_слово">
      </label>
    </div>
    <div class="utm-builder-preview">
      <div class="utm-builder-preview-label">Готовая ссылка:</div>
      <code id="ub-preview" class="utm-builder-preview-url">https://aminamed.kz/</code>
      <div class="utm-builder-actions">
        <button type="button" class="btn-primary" id="ub-copy">📋 Копировать</button>
        <button type="button" class="btn-ghost" id="ub-save">💾 Сохранить в историю</button>
        <button type="button" class="btn-ghost" id="ub-clear">✕ Сбросить</button>
      </div>
    </div>
    <div class="utm-builder-history" id="ub-history-wrap">
      ${renderHistoryHTML()}
    </div>
  </div>`;
}

function renderHistoryHTML() {
  const hist = getHistory();
  if (hist.length === 0) {
    return `<div class="utm-builder-history-empty">История пуста — сохраняй созданные ссылки чтобы быстро их переиспользовать</div>`;
  }
  return `<h5>Сохранённые ссылки (${hist.length})</h5>
    <div class="utm-builder-history-list">
      ${hist.map((h) => {
        const preset = getSourcePreset(h.source);
        return `<div class="utm-builder-history-item" data-history-id="${h.id}">
          <div class="utm-builder-history-meta">
            <span class="utm-block-dot" style="background:${preset.color}"></span>
            <strong>${escapeHtml(h.campaign || "(без кампании)")}</strong>
            <span class="utm-builder-history-source">${escapeHtml(preset.label)} · ${escapeHtml(h.medium || "—")}</span>
            <span class="utm-builder-history-date">${new Date(h.savedAt).toLocaleDateString("ru-RU")}</span>
          </div>
          <div class="utm-builder-history-url"><code>${escapeHtml(h.url)}</code></div>
          <div class="utm-builder-history-actions">
            <button type="button" class="btn-ghost btn-sm" data-history-copy="${h.id}">📋</button>
            <button type="button" class="btn-ghost btn-sm" data-history-delete="${h.id}">✕</button>
          </div>
        </div>`;
      }).join("")}
    </div>`;
}

function refreshBuilderPreview(root) {
  const baseUrl = root.querySelector("#ub-url").value.trim();
  const source = root.querySelector("#ub-source").value.trim();
  const medium = root.querySelector("#ub-medium").value.trim();
  const campaign = root.querySelector("#ub-campaign").value.trim();
  const content = root.querySelector("#ub-content").value.trim();
  const term = root.querySelector("#ub-term").value.trim();
  const result = buildUtmUrl({ baseUrl, source, medium, campaign, content, term });
  const preview = root.querySelector("#ub-preview");
  if (preview) preview.textContent = result || "— укажи базовую ссылку и источник —";
  return { baseUrl, source, medium, campaign, content, term, url: result };
}

function wireBuilder(root) {
  ["#ub-url", "#ub-source", "#ub-medium", "#ub-campaign", "#ub-content", "#ub-term"].forEach((sel) => {
    const el = root.querySelector(sel);
    if (el) el.addEventListener("input", () => refreshBuilderPreview(root));
  });

  root.querySelector("#ub-copy")?.addEventListener("click", async () => {
    const data = refreshBuilderPreview(root);
    if (!data.url) return alert("Сначала укажи базовую ссылку и источник");
    try {
      await navigator.clipboard.writeText(data.url);
      const btn = root.querySelector("#ub-copy");
      const orig = btn.textContent;
      btn.textContent = "✓ Скопировано";
      setTimeout(() => { btn.textContent = orig; }, 1500);
    } catch {
      prompt("Скопируй вручную:", data.url);
    }
  });

  root.querySelector("#ub-save")?.addEventListener("click", () => {
    const data = refreshBuilderPreview(root);
    if (!data.url) return alert("Сначала укажи базовую ссылку и источник");
    if (!data.source) return alert("Источник обязателен");
    addToHistory(data);
    const wrap = root.querySelector("#ub-history-wrap");
    if (wrap) {
      wrap.innerHTML = renderHistoryHTML();
      wireHistoryHandlers(root);
    }
  });

  root.querySelector("#ub-clear")?.addEventListener("click", () => {
    ["#ub-source", "#ub-medium", "#ub-campaign", "#ub-content", "#ub-term"].forEach((sel) => {
      const el = root.querySelector(sel);
      if (el) el.value = "";
    });
    refreshBuilderPreview(root);
  });

  wireHistoryHandlers(root);
  refreshBuilderPreview(root);
}

function wireHistoryHandlers(root) {
  root.querySelectorAll("[data-history-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.historyCopy;
      const item = getHistory().find((h) => h.id === id);
      if (!item) return;
      try {
        await navigator.clipboard.writeText(item.url);
        btn.textContent = "✓";
        setTimeout(() => { btn.textContent = "📋"; }, 1000);
      } catch {
        prompt("Скопируй вручную:", item.url);
      }
    });
  });
  root.querySelectorAll("[data-history-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("Удалить эту ссылку из истории?")) return;
      removeFromHistory(btn.dataset.historyDelete);
      const wrap = root.querySelector("#ub-history-wrap");
      if (wrap) {
        wrap.innerHTML = renderHistoryHTML();
        wireHistoryHandlers(root);
      }
    });
  });
}

// === Analytics block ===

function renderAnalyticsHTML(period, dimension) {
  const deals = Store.list("deals");
  const range = getPeriodRange(period);
  const stats = computeUtmStats(deals, range, dimension);

  const dimLabel = { source: "Источник", medium: "Канал", campaign: "Кампания" }[dimension] || "Источник";

  const periodBtns = Object.entries(PERIODS).map(([k, v]) =>
    `<button type="button" class="utm-block-period ${period === k ? "active" : ""}" data-utm-period="${k}">${escapeHtml(v.label)}</button>`
  ).join("");

  const dimBtns = [
    { id: "source", label: "Источники" },
    { id: "medium", label: "Каналы" },
    { id: "campaign", label: "Кампании" },
  ].map((d) =>
    `<button type="button" class="utm-block-dim ${dimension === d.id ? "active" : ""}" data-utm-dim="${d.id}">${escapeHtml(d.label)}</button>`
  ).join("");

  return `<div class="utm-analytics">
    <div class="utm-block-controls">
      <div class="utm-block-controls-left">
        <h4>📊 UTM-аналитика</h4>
        <span class="utm-block-sub">Откуда приходят сделки и сколько приносят</span>
      </div>
      <div class="utm-block-controls-right">
        <div class="utm-block-segmented">${periodBtns}</div>
        <div class="utm-block-segmented">${dimBtns}</div>
        <button type="button" class="btn-ghost btn-sm" data-utm-export>📥 CSV</button>
      </div>
    </div>
    <div class="utm-block-kpis">
      <div class="utm-block-kpi"><div class="utm-block-kpi-label">Сделок</div><div class="utm-block-kpi-value">${fmtNum(stats.totalCount)}</div></div>
      <div class="utm-block-kpi"><div class="utm-block-kpi-label">Выручка</div><div class="utm-block-kpi-value">${fmtMoney(stats.totalAmount)}</div></div>
      <div class="utm-block-kpi"><div class="utm-block-kpi-label">Средний чек</div><div class="utm-block-kpi-value">${fmtMoney(stats.avgCheck)}</div></div>
      <div class="utm-block-kpi"><div class="utm-block-kpi-label">С UTM-метками</div><div class="utm-block-kpi-value">${fmtPct(stats.totalCount > 0 ? (stats.totalCount - stats.untagged.count) / stats.totalCount : 0)}</div></div>
    </div>
    ${stats.rows.length > 0 ? `<div class="utm-block-section">
      <h5>Топ ${Math.min(10, stats.rows.length)} · ${escapeHtml(dimLabel)}</h5>
      ${renderBarChart(stats.rows)}
    </div>` : ""}
    <div class="utm-block-section">
      <h5>Разбивка по ${dimLabel.toLowerCase()}</h5>
      ${renderStatsTable(stats, dimLabel)}
    </div>
  </div>`;
}

// === Главная функция: рендер всего блока ===

export function renderUtmAnalyticsBlock(container) {
  if (!container) return;

  const period = getStoredPeriod();
  const dimension = getStoredDim();

  container.innerHTML = `
    <section class="utm-dashboard-block">
      ${renderAnalyticsHTML(period, dimension)}
      ${renderBuilderHTML()}
    </section>
  `;

  // Wire analytics controls
  const refreshAnalytics = () => {
    const analyticsRoot = container.querySelector(".utm-analytics");
    if (!analyticsRoot) return;
    const p = getStoredPeriod();
    const d = getStoredDim();
    analyticsRoot.outerHTML = renderAnalyticsHTML(p, d);
    wireAnalytics();
  };

  const wireAnalytics = () => {
    container.querySelectorAll("[data-utm-period]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setStoredPeriod(btn.dataset.utmPeriod);
        refreshAnalytics();
      });
    });
    container.querySelectorAll("[data-utm-dim]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setStoredDim(btn.dataset.utmDim);
        refreshAnalytics();
      });
    });
    container.querySelector("[data-utm-export]")?.addEventListener("click", () => {
      const p = getStoredPeriod();
      const d = getStoredDim();
      const deals = Store.list("deals");
      const range = getPeriodRange(p);
      const stats = computeUtmStats(deals, range, d);
      const dimLabel = { source: "Источник", medium: "Канал", campaign: "Кампания" }[d];
      exportCsv(stats, dimLabel);
    });
  };

  wireAnalytics();
  wireBuilder(container);
}
