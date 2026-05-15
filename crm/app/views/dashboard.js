import { Store } from "../store.js";
import { ICONS } from "../icons.js";
import { getStages, findStage } from "../stages.js";
import { getEmployee, avatar } from "../employees.js";

const PERIOD_KEY = "pllato_dashboard_period";

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtAmount(n) {
  if (!n && n !== 0) return "—";
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n)} ₸`;
}

function fmtAmountShort(n) {
  if (!n) return "0";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
}

function fmtRel(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  if (h < 24) return `${h} ч назад`;
  if (d < 7) return `${d} дн назад`;
  return new Date(ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function addDays(ts, days) {
  return ts + days * 86400000;
}

function pluralRu(n, one, few, many) {
  const v = Math.abs(n) % 100;
  const d = v % 10;
  if (v > 10 && v < 20) return many;
  if (d > 1 && d < 5) return few;
  if (d === 1) return one;
  return many;
}

function isWinStage(stage) {
  const key = `${stage?.id || ""} ${stage?.title || ""}`.toLowerCase();
  return key.includes("won") || key.includes("win") || key.includes("выиг");
}

function isLossStage(stage) {
  const key = `${stage?.id || ""} ${stage?.title || ""}`.toLowerCase();
  return key.includes("lost") || key.includes("loss") || key.includes("проиг");
}

function readPeriod() {
  const value = Number(localStorage.getItem(PERIOD_KEY) || 14);
  return [7, 14, 30].includes(value) ? value : 14;
}

function savePeriod(period) {
  localStorage.setItem(PERIOD_KEY, String(period));
}

const state = {
  period: readPeriod(),
};

function daysRange(period) {
  const today = startOfDay(Date.now());
  const start = addDays(today, -(period - 1));
  return Array.from({ length: period }, (_, i) => addDays(start, i));
}

function stageEventHistory() {
  const map = new Map();
  Store.list("deal_activities")
    .filter((a) => a.type === "stage" && a.dealId)
    .sort((a, b) => (a.ts || a.createdAt || 0) - (b.ts || b.createdAt || 0))
    .forEach((a) => {
      if (!map.has(a.dealId)) map.set(a.dealId, []);
      map.get(a.dealId).push(a);
    });
  return map;
}

function stageAtTime(deal, history, dayEndTs) {
  if ((deal.createdAt || 0) > dayEndTs) return null;
  if (!history || history.length === 0) return deal.stage;

  let stage = history[0].fromStage || deal.stage;
  for (const event of history) {
    const ts = event.ts || event.createdAt || 0;
    if (ts <= dayEndTs) {
      stage = event.toStage || stage;
    } else {
      break;
    }
  }

  if (dayEndTs >= Date.now() - 60000) return deal.stage || stage;
  return stage;
}

function stageCardsData(stages, deals, period) {
  const days = daysRange(period);
  const historyMap = stageEventHistory();
  const buckets = Object.fromEntries(stages.map((s) => [s.id, Array.from({ length: days.length }, () => 0)]));

  deals.forEach((deal) => {
    const history = historyMap.get(deal.id) || [];
    days.forEach((dayStart, idx) => {
      const dayEnd = dayStart + 86399999;
      const stageId = stageAtTime(deal, history, dayEnd);
      if (stageId && buckets[stageId]) buckets[stageId][idx] += 1;
    });
  });

  return stages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage.id);
    const count = stageDeals.length;
    const sum = stageDeals.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    let spark = buckets[stage.id] || [];

    if (spark.length && spark.every((v) => v === 0) && count > 0) {
      spark = spark.map((_, i) => (i === spark.length - 1 ? count : 0));
    }

    const delta = spark.length > 1 ? spark[spark.length - 1] - spark[0] : 0;
    return { stage, count, sum, spark, delta };
  });
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function renderKpiCards(deals, stages, period) {
  const stageById = new Map(stages.map((s) => [s.id, s]));
  const activeDeals = deals.filter((d) => {
    const stage = stageById.get(d.stage);
    return !isWinStage(stage) && !isLossStage(stage);
  });
  const wonDeals = deals.filter((d) => isWinStage(stageById.get(d.stage)));

  const forecast = activeDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const wonSum = wonDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const avgCheck = wonDeals.length ? wonSum / wonDeals.length : 0;

  const from = Date.now() - period * 86400000;
  const wonPeriod = deals.filter((d) => isWinStage(stageById.get(d.stage)) && (d.updatedAt || d.createdAt || 0) >= from);
  const lostPeriod = deals.filter((d) => isLossStage(stageById.get(d.stage)) && (d.updatedAt || d.createdAt || 0) >= from);
  const activePeriod = deals.filter((d) => {
    const stage = stageById.get(d.stage);
    const ts = d.updatedAt || d.createdAt || 0;
    return ts >= from && !isWinStage(stage) && !isLossStage(stage);
  });

  const conversionBase = wonPeriod.length + lostPeriod.length + activePeriod.length;
  const conversion = conversionBase ? (wonPeriod.length / conversionBase) * 100 : 0;

  const cycles = wonPeriod
    .map((d) => {
      const created = d.createdAt || 0;
      const closed = d.updatedAt || created;
      if (!created || closed <= created) return 0;
      return (closed - created) / 86400000;
    })
    .filter((v) => v > 0);
  const avgCycle = average(cycles);

  const cards = [
    {
      label: "Forecast",
      value: fmtAmount(forecast),
      hint: `${activeDeals.length} ${pluralRu(activeDeals.length, "активная", "активные", "активных")} сделка`,
      cls: "",
    },
    {
      label: "Выиграно",
      value: fmtAmount(wonSum),
      hint: `${wonDeals.length} ${pluralRu(wonDeals.length, "сделка", "сделки", "сделок")}`,
      cls: "is-success",
    },
    {
      label: "Средний чек",
      value: fmtAmount(avgCheck),
      hint: "по выигранным",
      cls: "",
    },
    {
      label: "Конверсия",
      value: `${conversion.toFixed(1).replace(/\.0$/, "")}%`,
      hint: `за ${period} дн`,
      cls: "",
    },
    {
      label: "Средний цикл",
      value: avgCycle ? `${avgCycle.toFixed(1).replace(/\.0$/, "")} дн` : "—",
      hint: "по закрытым",
      cls: "",
    },
  ];

  return `
    <section class="dash-kpis">
      ${cards
        .map(
          (c) => `
            <article class="kpi-card ${c.cls}">
              <div class="label">${c.label}</div>
              <div class="value">${c.value}</div>
              <div class="hint">${c.hint}</div>
            </article>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderStagesSection(stageCards) {
  const periodButtons = [7, 14, 30]
    .map(
      (d) => `<button type="button" class="dash-period-btn ${state.period === d ? "active" : ""}" data-period="${d}">${d} дней</button>`,
    )
    .join("");

  return `
    <section class="dash-stage-block">
      <header class="dash-stage-head">
        <h3>По стадиям воронки</h3>
        <div class="dash-period-switch">${periodButtons}</div>
      </header>
      <div class="dash-stage-grid">
        ${stageCards
          .map(({ stage, count, sum, spark, delta }) => {
            const max = Math.max(1, ...spark);
            const muted = count === 0 && spark.every((v) => v === 0);
            const deltaText = delta > 0 ? `+${delta}` : String(delta);
            const deltaClass = delta > 0 ? "up" : delta < 0 ? "dn" : "flat";
            return `
              <article class="stage-card ${muted ? "is-muted" : ""}" style="--stage-color:${stage.color}">
                <div class="stage-card-head">
                  <span class="dot"></span>
                  <span class="stage-card-title">${escape(stage.title)}</span>
                  <span class="stage-card-delta ${deltaClass}">${deltaText}</span>
                </div>
                <div class="stage-card-numbers">
                  <span class="count">${count}</span>
                  <span class="count-label">${pluralRu(count, "сделка", "сделки", "сделок")}</span>
                  <span class="sum">${fmtAmountShort(sum)}</span>
                </div>
                <div class="stage-card-spark">
                  ${spark
                    .map((v) => `<span style="height:${Math.max(2, (v / max) * 32).toFixed(1)}px"></span>`)
                    .join("")}
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderTaskWidget(tasks) {
  const today = startOfDay(Date.now());
  const open = tasks.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.dueDate && startOfDay(t.dueDate) < today);
  const dueToday = open.filter((t) => t.dueDate && startOfDay(t.dueDate) === today);
  const dueWeek = open.filter((t) => t.dueDate && startOfDay(t.dueDate) > today && startOfDay(t.dueDate) <= addDays(today, 7));

  const top = [...open]
    .sort((a, b) => (a.dueDate || Number.MAX_SAFE_INTEGER) - (b.dueDate || Number.MAX_SAFE_INTEGER))
    .slice(0, 3);

  return `
    <section class="dash-bottom-card">
      <header class="dash-bottom-head">
        <h4>Задачи на сегодня</h4>
        <a href="#tasks">Все →</a>
      </header>
      <div class="dash-task-kpis">
        <div class="tkpi danger"><span>${overdue.length}</span><small>Просрочено</small></div>
        <div class="tkpi warn"><span>${dueToday.length}</span><small>Сегодня</small></div>
        <div class="tkpi"><span>${dueWeek.length}</span><small>Неделя</small></div>
      </div>
      <div class="dash-mini-list">
        ${top.length
          ? top.map((t) => `<a class="dash-mini-item" href="#tasks/${t.id}">${ICONS.tasks}<span>${escape(t.title || "(без названия)")}</span></a>`).join("")
          : `<div class="dash-empty">Активных задач нет</div>`}
      </div>
    </section>
  `;
}

function renderActivityWidget() {
  const feed = Store.list("feed").map((p) => ({
    id: p.id,
    ts: p.createdAt || p.ts || 0,
    text: p.text || "",
    authorId: p.authorId,
    type: "feed",
  }));
  const acts = Store.list("deal_activities").map((a) => ({
    id: a.id,
    ts: a.ts || a.createdAt || 0,
    text: a.text || a.title || (a.type === "stage" ? `Стадия: ${findStage(a.fromStage)?.title || a.fromStage || ""} → ${findStage(a.toStage)?.title || a.toStage || ""}` : ""),
    authorId: a.authorId,
    type: a.type || "note",
  }));

  const recent = [...feed, ...acts]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 3);

  return `
    <section class="dash-bottom-card">
      <header class="dash-bottom-head">
        <h4>Активность команды</h4>
        <a href="#feed">Лента →</a>
      </header>
      <div class="dash-mini-list">
        ${recent.length
          ? recent
              .map((item) => {
                const author = getEmployee(item.authorId);
                const name = author?.name || "Команда";
                const text = item.text || "Активность";
                return `
                  <a class="dash-activity-item" href="${item.type === "feed" ? "#feed" : "#crm"}">
                    ${avatar(author, "xs")}
                    <div class="dash-activity-body">
                      <div class="dash-activity-head"><strong>${escape(name)}</strong><span>${fmtRel(item.ts)}</span></div>
                      <div class="dash-activity-text">${escape(text).slice(0, 110)}${text.length > 110 ? "…" : ""}</div>
                    </div>
                  </a>
                `;
              })
              .join("")
          : `<div class="dash-empty">Пока событий нет</div>`}
      </div>
    </section>
  `;
}

export function renderDashboard(container) {
  const deals = Store.list("deals");
  const tasks = Store.list("tasks");
  const stages = getStages();
  const period = state.period;

  const stageCards = stageCardsData(stages, deals, period);

  container.innerHTML = `
    <div class="dash-view">
      ${renderKpiCards(deals, stages, period)}
      ${renderStagesSection(stageCards)}
      <section class="dash-bottom-grid">
        ${renderTaskWidget(tasks)}
        ${renderActivityWidget()}
      </section>
    </div>
  `;

  container.querySelectorAll("[data-period]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = Number(btn.dataset.period);
      if (![7, 14, 30].includes(next) || next === state.period) return;
      state.period = next;
      savePeriod(next);
      renderDashboard(container);
    });
  });
}
