// ─────────────────────────────────────────────────────────────────────
// Pllato · Статистика — динамика и деньги на домашнем экране iPhone.
//
// Виджет рисует бесплатное приложение Scriptable; своё приложение в
// App Store не нужно. Данные берутся из портала по ключу.
//
// Установка:
//   1. Scriptable из App Store (бесплатно).
//   2. В портале: «Виджет на iPhone» → «Создать ключ» → вкладка
//      «Статистика» → «Скопировать скрипт» (ключ уже подставлен).
//   3. Scriptable → «+» → вставить → назвать «Pllato Статистика» → Готово.
//   4. Домашний экран: долгое нажатие → «+» → Scriptable → размер →
//      «Добавить виджет» → долгое нажатие на виджет → «Изменить виджет»
//      → Script: Pllato Статистика.
//
// ПЕРИОД И МЕТРИКА — поле «Parameter» в том же окне «Изменить виджет»:
//     день · неделя · месяц          — интервал (по умолчанию неделя)
//     неделя:заказы                  — интервал и метрика через двоеточие
//   Метрики: заказы, обращения, кэп, деньги, сдано.
//
// КАК ЛИСТАТЬ ГРАФИКИ. Внутри виджета iOS не даёт ни прокрутки, ни
// кнопок — виджет это картинка. Поэтому листание сделано двумя путями:
//   • тап по виджету открывает полный экран со всеми графиками и делами,
//     он прокручивается;
//   • несколько виджетов можно сложить в смарт-стопку (перетащить один
//     на другой) и листать свайпом — например «день», «неделя», «месяц».
// ─────────────────────────────────────────────────────────────────────

const KEY = "ВСТАВЬТЕ_КЛЮЧ_ИЗ_ПОРТАЛА";

const API = "https://pllato-comm.uurraa.workers.dev/api/widget/stats";
// Тап по виджету запускает этот же скрипт в приложении — там уже можно
// показать прокручиваемый экран. ВАЖНО: строка ниже должна совпадать с
// именем скрипта в Scriptable, иначе тап ничего не откроет.
const SCRIPT_NAME = "Pllato Статистика";

const C = {
  bg1: new Color("#171d2b"),
  bg2: new Color("#0d1119"),
  card: new Color("#ffffff", 0.06),
  line: new Color("#ffffff", 0.10),
  text: new Color("#f5f2ec"),
  dim: new Color("#8e94a3"),
  bronze: new Color("#cfa46c"),
  green: new Color("#46d18a"),
  red: new Color("#f87171"),
};

const METRICS = {
  inquiries: { name: "Новые обращения", color: "#7aa2f7" },
  kep: { name: "Люди на КЭП", color: "#a78bfa" },
  orders: { name: "Новые заказы", color: "#cfa46c" },
  cash: { name: "Поступления", color: "#46d18a" },
  releases: { name: "Сдано проектов", color: "#f0a35e" },
};
const ORDER = ["inquiries", "kep", "orders", "cash", "releases"];
const PERIOD_RU = { day: "по дням", week: "по неделям", month: "по месяцам" };

function parseParam(raw) {
  const s = String(raw || "").trim().toLowerCase();
  const [p, m] = s.split(":").map((x) => (x || "").trim());
  const periods = { день: "day", day: "day", неделя: "week", week: "week", месяц: "month", month: "month" };
  const metrics = {
    заказы: "orders", orders: "orders",
    обращения: "inquiries", inquiries: "inquiries",
    кэп: "kep", кеп: "kep", kep: "kep",
    деньги: "cash", поступления: "cash", cash: "cash",
    сдано: "releases", releases: "releases",
  };
  return { period: periods[p] || "week", metric: metrics[m] || "" };
}

const fm = FileManager.local();
const opts = parseParam(args.widgetParameter);
const CACHE = fm.joinPath(fm.cacheDirectory(), `pllato-stats-${opts.period}.json`);

const pad = (n) => String(n).padStart(2, "0");
const hhmm = (ms) => { const d = new Date(ms); return pad(d.getHours()) + ":" + pad(d.getMinutes()); };

function money(n) {
  n = Math.round(Number(n) || 0);
  if (n >= 1e6) { const v = n / 1e6; return (v >= 10 ? Math.round(v) : v.toFixed(1).replace(".", ",")) + " млн"; }
  if (n >= 1000) return Math.round(n / 1000) + "к";
  return String(n);
}
const num = (n) => {
  n = Math.round(Number(n) || 0);
  return n >= 1000 ? n.toLocaleString("ru-RU") : String(n);
};
const val = (kind, v) => (kind === "cash" ? money(v) : num(v));

function readCache() {
  try { return JSON.parse(fm.readString(CACHE)); } catch (e) { return null; }
}

async function loadStats() {
  const req = new Request(`${API}?key=${encodeURIComponent(KEY)}&period=${opts.period}&points=8`);
  req.timeoutInterval = 20;
  const data = await req.loadJSON();
  if (!data || data.ok !== true) throw new Error(data && data.error ? data.error : "нет данных");
  data.fetchedAt = Date.now();
  try { fm.writeString(CACHE, JSON.stringify(data)); } catch (e) { /* кеш не обязателен */ }
  return data;
}

function pickMetric(data) {
  const charts = data.charts || {};
  if (opts.metric && Array.isArray(charts[opts.metric]) && charts[opts.metric].length) return opts.metric;
  for (const kind of ["orders", "inquiries", "cash", "kep", "releases"]) {
    if (Array.isArray(charts[kind]) && charts[kind].length) return kind;
  }
  return "";
}

// Линия с точками и подписями значений — как графики в портале.
// Текущий, ещё не закрытый период рисуем полым кружком.
function chartImage(series, colorHex, width, height, opt = {}) {
  const showValues = opt.showValues !== false;
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const color = new Color(colorHex);
  const values = series.map((p) => Number(p.value) || 0);
  const max = Math.max(1, ...values);
  const padTop = showValues ? 16 : 6;
  const padBottom = opt.showLabels ? 14 : 4;
  const h = height - padTop - padBottom;
  const n = values.length;
  const step = n > 1 ? (width - 16) / (n - 1) : 0;
  const xy = values.map((v, i) => new Point(8 + i * step, padTop + h - (v / max) * h));

  // Базовая линия
  ctx.setStrokeColor(new Color("#ffffff", 0.10));
  ctx.setLineWidth(1);
  const base = new Path();
  base.move(new Point(0, padTop + h + 0.5));
  base.addLine(new Point(width, padTop + h + 0.5));
  ctx.addPath(base);
  ctx.strokePath();

  // Ломаная
  if (n > 1) {
    ctx.setStrokeColor(color);
    ctx.setLineWidth(2);
    const path = new Path();
    path.move(xy[0]);
    for (let i = 1; i < n; i += 1) path.addLine(xy[i]);
    ctx.addPath(path);
    ctx.strokePath();
  }

  // Точки и подписи
  xy.forEach((p, i) => {
    const partial = series[i].partial;
    ctx.setFillColor(partial ? new Color("#0d1119") : color);
    ctx.setStrokeColor(color);
    ctx.setLineWidth(2);
    const dot = new Path();
    dot.addEllipse(new Rect(p.x - 3.5, p.y - 3.5, 7, 7));
    ctx.addPath(dot);
    if (partial) { ctx.strokePath(); } else { ctx.fillPath(); }
    if (showValues) {
      ctx.setTextColor(partial ? C.dim : C.text);
      ctx.setFont(Font.mediumSystemFont(9));
      ctx.setTextAlignedCenter();
      ctx.drawTextInRect(String(values[i]), new Rect(p.x - 22, p.y - 16, 44, 12));
    }
  });

  // Подписи периодов
  if (opt.showLabels) {
    ctx.setTextColor(C.dim);
    ctx.setFont(Font.systemFont(8.5));
    ctx.setTextAlignedLeft();
    ctx.drawTextInRect(series[0].label || "", new Rect(0, height - 12, 60, 11));
    ctx.setTextAlignedRight();
    ctx.drawTextInRect(series[n - 1].label || "", new Rect(width - 60, height - 12, 60, 11));
  }
  return ctx.getImage();
}

function totalsRow(w, totals) {
  if (!totals) return;
  const row = w.addStack();
  row.centerAlignContent();
  const cell = (label, value, color) => {
    const st = row.addStack();
    st.layoutVertically();
    const l = st.addText(label);
    l.font = Font.systemFont(9);
    l.textColor = C.dim;
    const v = st.addText(money(value));
    v.font = Font.boldSystemFont(15);
    v.textColor = color;
    v.lineLimit = 1;
  };
  cell("Сумма сделок", totals.deal, C.text);
  row.addSpacer();
  cell("Получено", totals.got, C.green);
  row.addSpacer();
  cell("Остаток", totals.debt, C.red);
}

// Дела недели — тот же список, что под графиком в портале.
function tasksBlock(w, data, kind, limit) {
  const list = (data.tasks || {})[kind] || [];
  const head = w.addStack();
  head.centerAlignContent();
  const t = head.addText("Дела недели");
  t.font = Font.semiboldSystemFont(10.5);
  t.textColor = C.text;
  head.addSpacer(6);
  const series = (data.charts || {})[kind] || [];
  const point = series.length ? series[series.length - 1] : null;
  if (point) {
    const per = head.addText(periodLabel(point));
    per.font = Font.systemFont(9);
    per.textColor = C.dim;
  }
  head.addSpacer();
  if (!list.length) {
    w.addSpacer(3);
    const e = w.addText("на этот период дел пока нет");
    e.font = Font.systemFont(9.5);
    e.textColor = C.dim;
    return;
  }
  list.slice(0, limit).forEach((task) => {
    w.addSpacer(4);
    const row = w.addStack();
    row.centerAlignContent();
    const mark = row.addText(task.done ? "✓" : "•");
    mark.font = Font.systemFont(10);
    mark.textColor = task.done ? C.green : C.bronze;
    row.addSpacer(6);
    const txt = row.addText(task.text);
    txt.font = Font.systemFont(10.5);
    txt.textColor = task.done ? C.dim : C.text;
    txt.lineLimit = 1;
    row.addSpacer();
    if (task.amount) {
      const a = row.addText(money(task.amount));
      a.font = Font.mediumSystemFont(10);
      a.textColor = C.dim;
    }
  });
  const rest = list.length - Math.min(limit, list.length);
  if (rest > 0) {
    w.addSpacer(3);
    const more = w.addText(`и ещё ${rest}`);
    more.font = Font.systemFont(9);
    more.textColor = C.dim;
  }
}

function periodLabel(point) {
  const d = (ms) => { const x = new Date(ms); return pad(x.getDate()) + "." + pad(x.getMonth() + 1); };
  return point.start && point.end ? `${d(point.start)}–${d(point.end)}` : (point.label || "");
}

function buildWidget(data, errorText) {
  const w = new ListWidget();
  const g = new LinearGradient();
  g.colors = [C.bg1, C.bg2];
  g.locations = [0, 1];
  w.backgroundGradient = g;
  w.setPadding(13, 13, 11, 13);
  // Тап открывает полный экран со всеми графиками — там есть прокрутка.
  w.url = `scriptable:///run?scriptName=${encodeURIComponent(SCRIPT_NAME)}`;
  w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);

  if (errorText) {
    const t = w.addText("Pllato · Статистика");
    t.font = Font.semiboldSystemFont(13);
    t.textColor = C.text;
    w.addSpacer(5);
    const e = w.addText(errorText);
    e.font = Font.systemFont(11);
    e.textColor = C.dim;
    return w;
  }

  const size = config.runsInWidget ? config.widgetFamily : "large";
  const kind = pickMetric(data);
  const series = (data.charts || {})[kind] || [];
  const meta = METRICS[kind] || { name: "Динамика", color: "#cfa46c" };
  const last = series.length ? series[series.length - 1] : null;
  const prev = series.length > 1 ? series[series.length - 2] : null;

  const head = w.addStack();
  head.centerAlignContent();
  const h = head.addText(meta.name);
  h.font = Font.semiboldSystemFont(13);
  h.textColor = C.text;
  h.lineLimit = 1;
  head.addSpacer();
  const chip = head.addStack();
  chip.backgroundColor = C.card;
  chip.cornerRadius = 7;
  chip.setPadding(3, 7, 3, 7);
  const p = chip.addText(PERIOD_RU[data.period] || "по неделям");
  p.font = Font.mediumSystemFont(10);
  p.textColor = C.bronze;

  w.addSpacer(5);

  const valRow = w.addStack();
  valRow.centerAlignContent();
  const v = valRow.addText(last ? val(kind, last.value) : "—");
  v.font = Font.boldSystemFont(size === "small" ? 22 : 25);
  v.textColor = C.text;
  if (last && prev && Number(prev.value)) {
    const diff = Math.round(((last.value - prev.value) / prev.value) * 100);
    valRow.addSpacer(7);
    const d = valRow.addText((diff >= 0 ? "▲ " : "▼ ") + Math.abs(diff) + "%");
    d.font = Font.mediumSystemFont(11);
    d.textColor = diff >= 0 ? C.green : C.red;
  }
  valRow.addSpacer();

  if (series.length) {
    w.addSpacer(4);
    const width = size === "small" ? 130 : 300;
    const height = size === "small" ? 40 : size === "large" ? 92 : 74;
    const img = w.addImage(chartImage(series, meta.color, width, height, {
      showValues: size !== "small",
      showLabels: size !== "small",
    }));
    img.resizable = false;
  }

  if (size === "small") { w.addSpacer(); return w; }

  if (data.totals) {
    w.addSpacer(8);
    totalsRow(w, data.totals);
  }

  if (size === "large") {
    w.addSpacer(9);
    tasksBlock(w, data, kind, 4);
  }

  w.addSpacer();
  const foot = w.addStack();
  foot.centerAlignContent();
  const hint = foot.addText("тап — все графики");
  hint.font = Font.systemFont(9);
  hint.textColor = C.dim;
  hint.textOpacity = 0.7;
  foot.addSpacer();
  const upd = foot.addText(hhmm(data.fetchedAt || Date.now()));
  upd.font = Font.systemFont(9);
  upd.textColor = C.dim;
  upd.textOpacity = 0.7;
  return w;
}

// ── Полный экран в приложении: все графики подряд, с прокруткой ──────
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function svgChart(series, colorHex) {
  const W = 320, H = 130, padTop = 22, padBottom = 20;
  const values = series.map((p) => Number(p.value) || 0);
  const max = Math.max(1, ...values);
  const n = values.length;
  const step = n > 1 ? (W - 24) / (n - 1) : 0;
  const pts = values.map((v, i) => [12 + i * step, padTop + (H - padTop - padBottom) * (1 - v / max)]);
  const line = pts.map((p) => p.join(",")).join(" ");
  const dots = pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4"
      fill="${series[i].partial ? "#0d1119" : colorHex}" stroke="${colorHex}" stroke-width="2"/>
    <text x="${p[0].toFixed(1)}" y="${(p[1] - 9).toFixed(1)}" text-anchor="middle"
      font-size="10" fill="${series[i].partial ? "#8e94a3" : "#f5f2ec"}">${values[i]}</text>`).join("");
  const labels = series.map((p, i) => `<text x="${pts[i][0].toFixed(1)}" y="${H - 4}" text-anchor="middle"
      font-size="8.5" fill="#8e94a3">${escapeHtml(p.label || "")}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet">
    <line x1="0" y1="${H - padBottom}" x2="${W}" y2="${H - padBottom}" stroke="#ffffff" stroke-opacity="0.1"/>
    <polyline points="${line}" fill="none" stroke="${colorHex}" stroke-width="2"/>
    ${dots}${labels}</svg>`;
}

function fullScreenHtml(data) {
  const kinds = ORDER.filter((k) => Array.isArray(data.charts?.[k]) && data.charts[k].length);
  const cards = kinds.map((kind) => {
    const series = data.charts[kind];
    const meta = METRICS[kind] || { name: kind, color: "#cfa46c" };
    const last = series[series.length - 1];
    const prev = series.length > 1 ? series[series.length - 2] : null;
    const diff = prev && Number(prev.value)
      ? Math.round(((last.value - prev.value) / prev.value) * 100)
      : null;
    const tasks = (data.tasks || {})[kind] || [];
    return `<section class="card">
      <div class="h"><b>${escapeHtml(meta.name)}</b><span class="chip">${escapeHtml(PERIOD_RU[data.period] || "")}</span></div>
      <div class="v"><span class="big">${escapeHtml(val(kind, last.value))}</span>
        ${diff === null ? "" : `<span class="d ${diff >= 0 ? "up" : "down"}">${diff >= 0 ? "▲" : "▼"} ${Math.abs(diff)}%</span>`}</div>
      ${svgChart(series, meta.color)}
      <div class="tasks">
        <div class="th">Дела недели <span>${escapeHtml(periodLabel(last))}</span></div>
        ${tasks.length
          ? tasks.map((t) => `<div class="t${t.done ? " done" : ""}"><i>${t.done ? "✓" : "•"}</i><span>${escapeHtml(t.text)}</span>${t.amount ? `<b>${escapeHtml(money(t.amount))}</b>` : ""}</div>`).join("")
          : '<div class="empty">на этот период дел пока нет</div>'}
      </div>
    </section>`;
  }).join("");
  const totals = data.totals
    ? `<section class="card totals">
        <div><small>Сумма сделок</small><b>${escapeHtml(money(data.totals.deal))}</b></div>
        <div><small>Получено</small><b class="green">${escapeHtml(money(data.totals.got))}</b></div>
        <div><small>Остаток</small><b class="red">${escapeHtml(money(data.totals.debt))}</b></div>
      </section>`
    : "";
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
  :root { color-scheme: dark; }
  body { margin:0; padding:18px 14px 40px; background:#0d1119; color:#f5f2ec;
    font:14px/1.45 -apple-system,system-ui,sans-serif; }
  h1 { font-size:19px; margin:0 0 3px; }
  .sub { color:#8e94a3; font-size:12px; margin:0 0 14px; }
  .card { background:#171d2b; border:1px solid rgba(255,255,255,.07); border-radius:16px;
    padding:14px 14px 10px; margin-bottom:12px; }
  .h { display:flex; align-items:center; gap:8px; }
  .h b { font-size:14px; }
  .chip { margin-left:auto; font-size:10.5px; color:#cfa46c; background:rgba(255,255,255,.06);
    padding:3px 8px; border-radius:8px; }
  .v { display:flex; align-items:baseline; gap:9px; margin:6px 0 2px; }
  .big { font-size:26px; font-weight:700; }
  .d { font-size:12px; } .up { color:#46d18a; } .down { color:#f87171; }
  .tasks { margin-top:8px; padding-top:9px; border-top:1px solid rgba(255,255,255,.07); }
  .th { font-size:11px; font-weight:700; margin-bottom:5px; }
  .th span { color:#8e94a3; font-weight:400; margin-left:6px; }
  .t { display:flex; align-items:baseline; gap:7px; padding:3px 0; font-size:12.5px; }
  .t i { font-style:normal; color:#cfa46c; }
  .t b { margin-left:auto; color:#8e94a3; font-weight:600; font-size:11.5px; }
  .t.done span { color:#8e94a3; text-decoration:line-through; }
  .t.done i { color:#46d18a; }
  .empty { color:#8e94a3; font-size:12px; }
  .totals { display:flex; gap:10px; }
  .totals div { flex:1; } .totals small { display:block; color:#8e94a3; font-size:10.5px; }
  .totals b { font-size:17px; } .green { color:#46d18a; } .red { color:#f87171; }
  .upd { color:#8e94a3; font-size:11px; text-align:center; margin-top:6px; }
</style></head><body>
  <h1>Статистика Pllato</h1>
  <p class="sub">${escapeHtml(PERIOD_RU[data.period] || "")} · потяните вверх, чтобы листать графики</p>
  ${totals}${cards}
  <div class="upd">обновлено ${escapeHtml(hhmm(data.fetchedAt || Date.now()))}</div>
</body></html>`;
}

// ── Запуск ───────────────────────────────────────────────────────────
let data = null;
let errorText = null;
if (!KEY || KEY.indexOf("ВСТАВЬТЕ") === 0) {
  errorText = "Вставьте ключ из портала:\npllato.kz → Виджет на iPhone";
} else {
  try {
    data = await loadStats();
  } catch (e) {
    data = readCache();
    if (!data) errorText = "Не удалось получить данные:\n" + (e.message || e);
  }
}

if (config.runsInWidget) {
  Script.setWidget(buildWidget(data, errorText));
} else if (data) {
  // Запуск из приложения или по тапу на виджет — полный экран с прокруткой.
  const web = new WebView();
  await web.loadHTML(fullScreenHtml(data));
  await web.present(true);
} else {
  await buildWidget(null, errorText).presentMedium();
}
Script.complete();
