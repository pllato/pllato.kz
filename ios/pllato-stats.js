// ─────────────────────────────────────────────────────────────────────
// Pllato · Статистика — деньги и динамика на домашнем экране iPhone.
//
// Виджет рисует бесплатное приложение Scriptable; своё приложение в
// App Store не нужно. Данные берутся из портала по ключу.
//
// Установка:
//   1. Scriptable из App Store (бесплатно).
//   2. В портале: «Виджет на iPhone» → «Создать ключ» → «Скопировать
//      скрипт статистики» (ключ уже подставлен).
//   3. Scriptable → «+» → вставить → назвать «Pllato Статистика» → Готово.
//   4. Домашний экран: долгое нажатие → «+» → Scriptable → размер →
//      «Добавить виджет» → долгое нажатие на виджет → «Изменить виджет»
//      → Script: Pllato Статистика.
//
// ПЕРИОД И МЕТРИКА — в поле «Parameter» того же окна «Изменить виджет»:
//     день            — динамика по дням
//     неделя          — по неделям (по умолчанию)
//     месяц           — по месяцам
//     неделя:заказы   — период и метрика через двоеточие
//   Метрики: заказы, обращения, кэп, деньги, сдано.
// Так на экран можно положить несколько виджетов с разными интервалами:
// один «день», другой «месяц» — это разные виджеты одного скрипта.
// ─────────────────────────────────────────────────────────────────────

const KEY = "ВСТАВЬТЕ_КЛЮЧ_ИЗ_ПОРТАЛА";

const API = "https://pllato-comm.uurraa.workers.dev/api/widget/stats";
const OPEN_URL = "https://pllato.kz/app.html";

const C = {
  bg1: new Color("#171d2b"),
  bg2: new Color("#0d1119"),
  card: new Color("#ffffff", 0.06),
  text: new Color("#f5f2ec"),
  dim: new Color("#8e94a3"),
  bronze: new Color("#cfa46c"),
  green: new Color("#46d18a"),
  red: new Color("#f87171"),
  bar: new Color("#cfa46c"),
  barSoft: new Color("#cfa46c", 0.28),
};

// Названия метрик — как в портале.
const METRICS = {
  inquiries: { name: "Новые обращения", color: new Color("#7aa2f7") },
  kep: { name: "Люди на КЭП", color: new Color("#a78bfa") },
  orders: { name: "Новые заказы", color: new Color("#cfa46c") },
  cash: { name: "Поступления", color: new Color("#46d18a") },
  releases: { name: "Сдано проектов", color: new Color("#f0a35e") },
};
const PERIOD_RU = { day: "по дням", week: "по неделям", month: "по месяцам" };

// Разбор параметра виджета: «неделя», «день:заказы», «month:cash».
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

// Деньги короткой строкой: 47 млн, 1,2 млн, 320к.
function money(n) {
  n = Math.round(Number(n) || 0);
  if (n >= 1e6) { const v = n / 1e6; return (v >= 10 ? Math.round(v) : v.toFixed(1).replace(".", ",")) + " млн"; }
  if (n >= 1000) return Math.round(n / 1000) + "к";
  return String(n);
}
function num(n) {
  n = Math.round(Number(n) || 0);
  return n >= 1000 ? n.toLocaleString("ru-RU") : String(n);
}

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

// Какую метрику показывать: заданную параметром или первую доступную.
function pickMetric(data) {
  const charts = data.charts || {};
  if (opts.metric && Array.isArray(charts[opts.metric]) && charts[opts.metric].length) return opts.metric;
  for (const kind of ["orders", "inquiries", "cash", "kep", "releases"]) {
    if (Array.isArray(charts[kind]) && charts[kind].length) return kind;
  }
  return "";
}

// Столбиковая диаграмма. Последний столбец — текущий, незавершённый
// период: рисуем его приглушённым, чтобы не сравнивать с полными.
function chartImage(series, color, width, height) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const values = series.map((p) => Number(p.value) || 0);
  const max = Math.max(1, ...values);
  const n = values.length;
  const gap = n > 8 ? 4 : 6;
  const bw = Math.max(4, (width - gap * (n - 1)) / n);
  values.forEach((v, i) => {
    const h = Math.max(2, Math.round((v / max) * (height - 2)));
    const x = Math.round(i * (bw + gap));
    const y = height - h;
    ctx.setFillColor(series[i].partial ? C.barSoft : color);
    const path = new Path();
    path.addRoundedRect(new Rect(x, y, Math.round(bw), h), 3, 3);
    ctx.addPath(path);
    ctx.fillPath();
  });
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

function buildWidget(data, errorText) {
  const w = new ListWidget();
  const g = new LinearGradient();
  g.colors = [C.bg1, C.bg2];
  g.locations = [0, 1];
  w.backgroundGradient = g;
  w.setPadding(13, 13, 11, 13);
  w.url = OPEN_URL;
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

  const size = config.runsInWidget ? config.widgetFamily : "medium";
  const kind = pickMetric(data);
  const series = (data.charts || {})[kind] || [];
  const meta = METRICS[kind] || { name: "Динамика", color: C.bar };
  const last = series.length ? series[series.length - 1] : null;
  const prev = series.length > 1 ? series[series.length - 2] : null;
  const isMoney = kind === "cash";

  // Шапка: метрика и выбранный интервал.
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

  w.addSpacer(6);

  // Текущее значение и изменение к прошлому периоду.
  const valRow = w.addStack();
  valRow.centerAlignContent();
  const v = valRow.addText(last ? (isMoney ? money(last.value) : num(last.value)) : "—");
  v.font = Font.boldSystemFont(size === "small" ? 24 : 26);
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
    w.addSpacer(7);
    const width = size === "small" ? 130 : size === "large" ? 300 : 300;
    const height = size === "small" ? 34 : 52;
    const img = w.addImage(chartImage(series, meta.color, width, height));
    img.resizable = false;
    // Подписи периодов — только там, где хватает места.
    if (size !== "small") {
      w.addSpacer(3);
      const labels = w.addStack();
      const first = labels.addText(series[0].label || "");
      first.font = Font.systemFont(8.5);
      first.textColor = C.dim;
      labels.addSpacer();
      const lastLbl = labels.addText(last.label || "");
      lastLbl.font = Font.systemFont(8.5);
      lastLbl.textColor = C.dim;
    }
  }

  if (size !== "small" && data.totals) {
    w.addSpacer(9);
    const line = w.addStack();
    line.size = new Size(0, 1);
    line.backgroundColor = C.card;
    w.addSpacer(7);
    totalsRow(w, data.totals);
  }

  if (size === "large") {
    w.addSpacer(9);
    const other = Object.keys(data.charts || {}).filter((k) => k !== kind);
    other.slice(0, 4).forEach((k, i) => {
      const s = (data.charts[k] || []);
      const lastPoint = s.length ? s[s.length - 1] : null;
      if (!lastPoint) return;
      if (i) w.addSpacer(4);
      const row = w.addStack();
      row.centerAlignContent();
      const dot = row.addStack();
      dot.size = new Size(6, 6);
      dot.cornerRadius = 3;
      dot.backgroundColor = (METRICS[k] || { color: C.bar }).color;
      row.addSpacer(7);
      const nm = row.addText((METRICS[k] || { name: k }).name);
      nm.font = Font.systemFont(11);
      nm.textColor = C.dim;
      row.addSpacer();
      const val = row.addText(k === "cash" ? money(lastPoint.value) : num(lastPoint.value));
      val.font = Font.mediumSystemFont(11.5);
      val.textColor = C.text;
    });
  }

  w.addSpacer();
  const upd = w.addText("обновлено " + hhmm(data.fetchedAt || Date.now()));
  upd.font = Font.systemFont(9);
  upd.textColor = C.dim;
  upd.textOpacity = 0.7;
  return w;
}

let widget;
if (!KEY || KEY.indexOf("ВСТАВЬТЕ") === 0) {
  widget = buildWidget(null, "Вставьте ключ из портала:\npllato.kz → Виджет на iPhone");
} else {
  try {
    widget = buildWidget(await loadStats(), null);
  } catch (e) {
    const cached = readCache();
    widget = cached ? buildWidget(cached, null)
      : buildWidget(null, "Не удалось получить данные:\n" + (e.message || e));
  }
}

if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
