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
//   3. Scriptable → «+» → вставить → назвать как угодно → Готово.
//   4. Домашний экран: долгое нажатие → «+» → Scriptable → размер →
//      «Добавить виджет» → долгое нажатие на виджет → «Изменить виджет»
//      → Script: выбрать этот скрипт.
//
// ПЕРИОД И МЕТРИКА — поле «Parameter» в том же окне «Изменить виджет»:
//     день · неделя · месяц          — интервал (по умолчанию неделя)
//     неделя:заказы                  — интервал и метрика через двоеточие
//   Метрики: обращения, кэп, заказы, деньги, сдано.
//   Без параметра показывается первый график портала — новые обращения.
//
// КАК ЛИСТАТЬ ГРАФИКИ. Сам виджет iOS листать не умеет: это картинка,
// которую система перерисовывает по своему расписанию, ни прокрутки, ни
// свайпов внутри неё не бывает. Поэтому:
//   • ТАП по виджету открывает полноэкранный режим — там все графики
//     листаются свайпом влево-вправо, переключаются день/неделя/месяц
//     и под каждым графиком видны дела недели;
//   • несколько виджетов можно сложить в смарт-стопку (перетащить один
//     на другой) и листать свайпом прямо на экране.
// ─────────────────────────────────────────────────────────────────────

const KEY = "ВСТАВЬТЕ_КЛЮЧ_ИЗ_ПОРТАЛА";

const API = "https://pllato-comm.uurraa.workers.dev/api/widget/stats";

// Порядок и названия — как в портале: обращения, КЭП, заказы, деньги.
const METRICS = {
  inquiries: { name: "Новые обращения", color: "#7aa2f7" },
  kep: { name: "Люди на КЭП", color: "#a78bfa" },
  orders: { name: "Новые заказы", color: "#cfa46c" },
  cash: { name: "Поступления", color: "#46d18a" },
  releases: { name: "Сдано проектов", color: "#f0a35e" },
};
const ORDER = ["inquiries", "kep", "orders", "cash", "releases"];
const PERIOD_RU = { day: "по дням", week: "по неделям", month: "по месяцам" };
const PERIOD_SHORT = { day: "День", week: "Неделя", month: "Месяц" };

const C = {
  bg1: new Color("#1a2130"),
  bg2: new Color("#0b0f17"),
  card: new Color("#ffffff", 0.07),
  hair: new Color("#ffffff", 0.10),
  text: new Color("#f6f3ed"),
  dim: new Color("#8e94a3"),
  bronze: new Color("#cfa46c"),
  green: new Color("#46d18a"),
  red: new Color("#f87171"),
};

function parseParam(raw) {
  const s = String(raw || "").trim().toLowerCase();
  const [p, m] = s.split(":").map((x) => (x || "").trim());
  const periods = { день: "day", day: "day", неделя: "week", week: "week", месяц: "month", month: "month" };
  const metrics = {
    обращения: "inquiries", inquiries: "inquiries",
    кэп: "kep", кеп: "kep", kep: "kep",
    заказы: "orders", orders: "orders",
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

async function loadStats(period) {
  const req = new Request(`${API}?key=${encodeURIComponent(KEY)}&period=${period}&points=8`);
  req.timeoutInterval = 20;
  const data = await req.loadJSON();
  if (!data || data.ok !== true) throw new Error(data && data.error ? data.error : "нет данных");
  data.fetchedAt = Date.now();
  return data;
}

// Первый доступный график — в порядке портала, если метрика не задана.
function pickMetric(data) {
  const charts = data.charts || {};
  if (opts.metric && Array.isArray(charts[opts.metric]) && charts[opts.metric].length) return opts.metric;
  for (const kind of ORDER) {
    if (Array.isArray(charts[kind]) && charts[kind].length) return kind;
  }
  return "";
}

function periodLabel(point) {
  const d = (ms) => { const x = new Date(ms); return pad(x.getDate()) + "." + pad(x.getMonth() + 1); };
  return point && point.start && point.end ? `${d(point.start)}–${d(point.end)}` : (point?.label || "");
}

// ── График в виджете ────────────────────────────────────────────────
// Линия с точками и значениями, под ней мягкая заливка — как в портале,
// только тёмной темой. Текущий незакрытый период — полый кружок.
function chartImage(series, colorHex, width, height, opt = {}) {
  const showValues = opt.showValues !== false;
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const color = new Color(colorHex);
  const values = series.map((p) => Number(p.value) || 0);
  const max = Math.max(1, ...values);
  const padTop = showValues ? 17 : 6;
  const padBottom = opt.showLabels ? 15 : 5;
  const h = height - padTop - padBottom;
  const n = values.length;
  const left = 10, right = width - 10;
  const step = n > 1 ? (right - left) / (n - 1) : 0;
  const xy = values.map((v, i) => new Point(left + i * step, padTop + h - (v / max) * h));
  const baseY = padTop + h;

  // Заливка под линией — несколькими полосами, чтобы получился градиент.
  if (n > 1) {
    const bands = 7;
    for (let b = 0; b < bands; b += 1) {
      const top = baseY - (h * (bands - b)) / bands;
      const bottom = baseY - (h * (bands - b - 1)) / bands;
      ctx.setFillColor(new Color(colorHex, 0.16 * ((bands - b) / bands)));
      const area = new Path();
      const pts = [];
      for (let i = 0; i < n; i += 1) {
        pts.push(new Point(xy[i].x, Math.min(bottom, Math.max(top, xy[i].y))));
      }
      area.move(new Point(pts[0].x, bottom));
      pts.forEach((p) => area.addLine(p));
      area.addLine(new Point(pts[n - 1].x, bottom));
      area.closeSubpath();
      ctx.addPath(area);
      ctx.fillPath();
    }
  }

  // Базовая линия
  ctx.setStrokeColor(C.hair);
  ctx.setLineWidth(1);
  const base = new Path();
  base.move(new Point(0, baseY + 0.5));
  base.addLine(new Point(width, baseY + 0.5));
  ctx.addPath(base);
  ctx.strokePath();

  // Ломаная
  if (n > 1) {
    ctx.setStrokeColor(color);
    ctx.setLineWidth(2.4);
    const path = new Path();
    path.move(xy[0]);
    for (let i = 1; i < n; i += 1) path.addLine(xy[i]);
    ctx.addPath(path);
    ctx.strokePath();
  }

  // Точки и подписи значений
  xy.forEach((p, i) => {
    const partial = series[i].partial;
    ctx.setFillColor(partial ? new Color("#0b0f17") : color);
    ctx.setStrokeColor(color);
    ctx.setLineWidth(2);
    const dot = new Path();
    dot.addEllipse(new Rect(p.x - 3.6, p.y - 3.6, 7.2, 7.2));
    ctx.addPath(dot);
    if (partial) ctx.strokePath(); else ctx.fillPath();
    if (showValues) {
      ctx.setTextColor(partial ? C.dim : C.text);
      ctx.setFont(Font.semiboldSystemFont(9.5));
      ctx.setTextAlignedCenter();
      ctx.drawTextInRect(val(opt.kind, values[i]), new Rect(p.x - 26, p.y - 17, 52, 13));
    }
  });

  // Подписи крайних периодов
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

function divider(w) {
  const d = w.addStack();
  d.size = new Size(0, 1);
  d.backgroundColor = C.hair;
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
    st.addSpacer(2);
    const v = st.addText(money(value));
    v.font = Font.boldSystemFont(16);
    v.textColor = color;
    v.lineLimit = 1;
  };
  cell("Сумма сделок", totals.deal, C.text);
  row.addSpacer();
  cell("Получено", totals.got, C.green);
  row.addSpacer();
  cell("Остаток", totals.debt, C.red);
}

function tasksBlock(w, data, kind, limit) {
  const list = (data.tasks || {})[kind] || [];
  const series = (data.charts || {})[kind] || [];
  const point = series.length ? series[series.length - 1] : null;

  const head = w.addStack();
  head.centerAlignContent();
  const t = head.addText("Дела недели");
  t.font = Font.semiboldSystemFont(10.5);
  t.textColor = C.text;
  head.addSpacer(6);
  if (point) {
    const per = head.addText(periodLabel(point));
    per.font = Font.systemFont(9);
    per.textColor = C.dim;
  }
  head.addSpacer();

  if (!list.length) {
    w.addSpacer(4);
    const e = w.addText("на этот период дел пока нет");
    e.font = Font.systemFont(9.5);
    e.textColor = C.dim;
    return;
  }
  list.slice(0, limit).forEach((task) => {
    w.addSpacer(5);
    const row = w.addStack();
    row.centerAlignContent();
    const mark = row.addText(task.done ? "✓" : "◦");
    mark.font = Font.boldSystemFont(10);
    mark.textColor = task.done ? C.green : C.bronze;
    row.addSpacer(7);
    const txt = row.addText(task.text);
    txt.font = Font.systemFont(11);
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
    w.addSpacer(4);
    const more = w.addText(`и ещё ${rest}`);
    more.font = Font.systemFont(9);
    more.textColor = C.dim;
  }
}

function buildWidget(data, errorText) {
  const w = new ListWidget();
  const g = new LinearGradient();
  g.colors = [C.bg1, C.bg2];
  g.locations = [0, 1];
  w.backgroundGradient = g;
  w.setPadding(14, 14, 12, 14);
  // Тап открывает полноэкранный режим этого же скрипта — как бы он ни
  // назывался: имя берём у самого скрипта, а не просим вписать вручную.
  w.url = `scriptable:///run?scriptName=${encodeURIComponent(Script.name())}`;
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

  // Шапка: цветная точка метрики, название, чип интервала.
  const head = w.addStack();
  head.centerAlignContent();
  const dot = head.addStack();
  dot.size = new Size(7, 7);
  dot.cornerRadius = 3.5;
  dot.backgroundColor = new Color(meta.color);
  head.addSpacer(7);
  const h = head.addText(meta.name);
  h.font = Font.semiboldSystemFont(13.5);
  h.textColor = C.text;
  h.lineLimit = 1;
  head.addSpacer();
  const chip = head.addStack();
  chip.backgroundColor = C.card;
  chip.cornerRadius = 8;
  chip.setPadding(3, 8, 3, 8);
  const p = chip.addText(PERIOD_RU[data.period] || "по неделям");
  p.font = Font.mediumSystemFont(10);
  p.textColor = C.bronze;

  w.addSpacer(6);

  // Значение и изменение к прошлому периоду.
  const valRow = w.addStack();
  valRow.bottomAlignContent();
  const v = valRow.addText(last ? val(kind, last.value) : "—");
  v.font = Font.boldSystemFont(size === "small" ? 23 : 27);
  v.textColor = C.text;
  if (last && prev && Number(prev.value)) {
    const diff = Math.round(((last.value - prev.value) / prev.value) * 100);
    valRow.addSpacer(8);
    const pill = valRow.addStack();
    pill.backgroundColor = new Color(diff >= 0 ? "#46d18a" : "#f87171", 0.16);
    pill.cornerRadius = 7;
    pill.setPadding(2, 7, 3, 7);
    const d = pill.addText((diff >= 0 ? "▲ " : "▼ ") + Math.abs(diff) + "%");
    d.font = Font.semiboldSystemFont(10.5);
    d.textColor = diff >= 0 ? C.green : C.red;
  }
  valRow.addSpacer();

  if (series.length) {
    w.addSpacer(size === "small" ? 4 : 6);
    const width = size === "small" ? 132 : 302;
    const height = size === "small" ? 42 : size === "large" ? 96 : 78;
    const img = w.addImage(chartImage(series, meta.color, width, height, {
      showValues: size !== "small",
      showLabels: size !== "small",
      kind,
    }));
    img.resizable = false;
  }

  if (size === "small") { w.addSpacer(); return w; }

  if (data.totals) {
    w.addSpacer(9);
    divider(w);
    w.addSpacer(8);
    totalsRow(w, data.totals);
  }

  if (size === "large") {
    w.addSpacer(10);
    divider(w);
    w.addSpacer(8);
    tasksBlock(w, data, kind, 4);
  }

  w.addSpacer();
  const foot = w.addStack();
  foot.centerAlignContent();
  const hint = foot.addText("нажмите — все графики");
  hint.font = Font.systemFont(9);
  hint.textColor = C.dim;
  hint.textOpacity = 0.75;
  foot.addSpacer();
  const upd = foot.addText(hhmm(data.fetchedAt || Date.now()));
  upd.font = Font.systemFont(9);
  upd.textColor = C.dim;
  upd.textOpacity = 0.75;
  return w;
}

// ── Полноэкранный режим: листаемые графики, переключение периода ─────
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fullScreenHtml(byPeriod) {
  // Все три интервала загружены заранее — переключение мгновенное и
  // без сети: WebView работает с уже полученными данными.
  const payload = JSON.stringify({
    periods: byPeriod,
    metrics: METRICS,
    order: ORDER,
    periodRu: PERIOD_RU,
    periodShort: PERIOD_SHORT,
  }).replace(/</g, "\\u003c");

  return `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<style>
  :root{ color-scheme:dark; --bg:#0b0f17; --card:#161d2b; --line:rgba(255,255,255,.08);
         --text:#f6f3ed; --dim:#8e94a3; --bronze:#cfa46c; --green:#46d18a; --red:#f87171; }
  *{ box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  body{ margin:0; background:var(--bg); color:var(--text);
        font:15px/1.45 -apple-system,system-ui,"SF Pro Text",sans-serif;
        padding:max(14px,env(safe-area-inset-top)) 0 calc(28px + env(safe-area-inset-bottom)); }
  header{ padding:0 18px 12px; }
  h1{ font-size:22px; font-weight:800; letter-spacing:-.02em; margin:0 0 2px; }
  .sub{ color:var(--dim); font-size:12.5px; margin:0 0 13px; }
  .seg{ display:flex; gap:3px; background:rgba(255,255,255,.06); border-radius:11px; padding:3px; }
  .seg button{ flex:1; border:0; background:transparent; color:var(--dim); font:600 13px/1 inherit;
               padding:9px 0; border-radius:9px; transition:.15s; }
  .seg button.on{ background:var(--text); color:#0b0f17; }
  .totals{ display:flex; gap:9px; padding:0 18px 14px; }
  .totals div{ flex:1; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:10px 12px; }
  .totals small{ display:block; color:var(--dim); font-size:10.5px; margin-bottom:3px; }
  .totals b{ font-size:17px; font-weight:800; letter-spacing:-.02em; }
  .green{ color:var(--green); } .red{ color:var(--red); }
  .rail{ display:flex; gap:12px; overflow-x:auto; scroll-snap-type:x mandatory;
         padding:0 18px 4px; scrollbar-width:none; }
  .rail::-webkit-scrollbar{ display:none; }
  .card{ flex:0 0 calc(100vw - 36px); scroll-snap-align:center;
         background:var(--card); border:1px solid var(--line); border-radius:20px; padding:16px 16px 12px; }
  .ch{ display:flex; align-items:center; gap:9px; }
  .dot{ width:9px; height:9px; border-radius:50%; flex:none; }
  .ch b{ font-size:15px; font-weight:700; letter-spacing:-.01em; }
  .val{ display:flex; align-items:baseline; gap:9px; margin:10px 0 2px; }
  .big{ font-size:31px; font-weight:800; letter-spacing:-.03em; }
  .pill{ font-size:12px; font-weight:600; padding:3px 8px; border-radius:8px; }
  .pill.up{ color:var(--green); background:rgba(70,209,138,.15); }
  .pill.down{ color:var(--red); background:rgba(248,113,113,.15); }
  svg{ display:block; width:100%; height:auto; margin:6px 0 2px; }
  .tasks{ margin-top:10px; padding-top:11px; border-top:1px solid var(--line); }
  .th{ display:flex; align-items:baseline; gap:7px; font-size:12px; font-weight:700; margin-bottom:7px; }
  .th span{ color:var(--dim); font-weight:400; font-size:11px; }
  .t{ display:flex; align-items:baseline; gap:9px; padding:4px 0; font-size:13.5px; }
  .t i{ font-style:normal; color:var(--bronze); font-size:12px; }
  .t b{ margin-left:auto; color:var(--dim); font-weight:600; font-size:12px; }
  .t.done span{ color:var(--dim); text-decoration:line-through; }
  .t.done i{ color:var(--green); }
  .empty{ color:var(--dim); font-size:12.5px; }
  .dots{ display:flex; justify-content:center; gap:6px; padding:14px 0 0; }
  .dots i{ width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.2); transition:.2s; }
  .dots i.on{ background:var(--bronze); width:18px; border-radius:3px; }
  .upd{ color:var(--dim); font-size:11.5px; text-align:center; margin-top:14px; }
</style></head><body>
<header>
  <h1>Статистика Pllato</h1>
  <p class="sub" id="sub">—</p>
  <div class="seg" id="seg"></div>
</header>
<div class="totals" id="totals"></div>
<div class="rail" id="rail"></div>
<div class="dots" id="dots"></div>
<div class="upd" id="upd"></div>
<script>
const D = ${payload};
let period = "week";

const pad = n => String(n).padStart(2,"0");
const money = n => { n = Math.round(Number(n)||0);
  if (n >= 1e6) { const v = n/1e6; return (v>=10 ? Math.round(v) : v.toFixed(1).replace(".",",")) + " млн"; }
  if (n >= 1000) return Math.round(n/1000) + "к";
  return String(n); };
const num = n => { n = Math.round(Number(n)||0); return n>=1000 ? n.toLocaleString("ru-RU") : String(n); };
const val = (k,v) => k === "cash" ? money(v) : num(v);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const perLabel = p => p && p.start && p.end
  ? pad(new Date(p.start).getDate())+"."+pad(new Date(p.start).getMonth()+1)+"–"+pad(new Date(p.end).getDate())+"."+pad(new Date(p.end).getMonth()+1)
  : (p && p.label) || "";

function svgChart(series, color, kind){
  const W=320,H=150,top=26,bot=26,L=16,R=W-16;
  const vals=series.map(p=>Number(p.value)||0);
  const max=Math.max(1,...vals), n=vals.length;
  const step=n>1?(R-L)/(n-1):0;
  const pts=vals.map((v,i)=>[L+i*step, top+(H-top-bot)*(1-v/max)]);
  const baseY=H-bot;
  const area="M"+pts[0][0]+","+baseY+" "+pts.map(p=>"L"+p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")+" L"+pts[n-1][0]+","+baseY+" Z";
  const line=pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
  const gid="g"+Math.random().toString(36).slice(2,8);
  const dots=pts.map((p,i)=>'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="4.5" fill="'+(series[i].partial?"#161d2b":color)+'" stroke="'+color+'" stroke-width="2.2"/>'
    +'<text x="'+p[0].toFixed(1)+'" y="'+(p[1]-11).toFixed(1)+'" text-anchor="middle" font-size="11" font-weight="600" fill="'+(series[i].partial?"#8e94a3":"#f6f3ed")+'">'+esc(val(kind,vals[i]))+'</text>').join("");
  const labels=series.map((p,i)=>'<text x="'+pts[i][0].toFixed(1)+'" y="'+(H-7)+'" text-anchor="middle" font-size="9.5" fill="#8e94a3">'+esc(p.label||"")+'</text>').join("");
  return '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">'
    +'<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1">'
    +'<stop offset="0" stop-color="'+color+'" stop-opacity=".28"/><stop offset="1" stop-color="'+color+'" stop-opacity="0"/></linearGradient></defs>'
    +'<path d="'+area+'" fill="url(#'+gid+')"/>'
    +'<line x1="0" y1="'+baseY+'" x2="'+W+'" y2="'+baseY+'" stroke="#ffffff" stroke-opacity=".1"/>'
    +'<polyline points="'+line+'" fill="none" stroke="'+color+'" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>'
    +dots+labels+'</svg>';
}

function render(){
  const data = D.periods[period];
  document.getElementById("seg").innerHTML = ["day","week","month"]
    .map(p => '<button data-p="'+p+'"'+(p===period?' class="on"':'')+'>'+D.periodShort[p]+'</button>').join("");
  document.getElementById("sub").textContent = "Динамика " + (D.periodRu[period]||"") + " · листайте графики свайпом";
  if(!data){ document.getElementById("rail").innerHTML = '<div class="card">Нет данных за этот интервал</div>'; return; }

  const t = data.totals;
  document.getElementById("totals").innerHTML = t
    ? '<div><small>Сумма сделок</small><b>'+esc(money(t.deal))+'</b></div>'
      +'<div><small>Получено</small><b class="green">'+esc(money(t.got))+'</b></div>'
      +'<div><small>Остаток</small><b class="red">'+esc(money(t.debt))+'</b></div>'
    : "";

  const kinds = D.order.filter(k => Array.isArray(data.charts[k]) && data.charts[k].length);
  document.getElementById("rail").innerHTML = kinds.map(kind => {
    const s = data.charts[kind], meta = D.metrics[kind] || {name:kind,color:"#cfa46c"};
    const last = s[s.length-1], prev = s.length>1 ? s[s.length-2] : null;
    const diff = prev && Number(prev.value) ? Math.round(((last.value-prev.value)/prev.value)*100) : null;
    const tasks = (data.tasks||{})[kind] || [];
    return '<section class="card">'
      +'<div class="ch"><span class="dot" style="background:'+meta.color+'"></span><b>'+esc(meta.name)+'</b></div>'
      +'<div class="val"><span class="big">'+esc(val(kind,last.value))+'</span>'
      +(diff===null?"":'<span class="pill '+(diff>=0?"up":"down")+'">'+(diff>=0?"▲":"▼")+' '+Math.abs(diff)+'%</span>')+'</div>'
      +svgChart(s, meta.color, kind)
      +'<div class="tasks"><div class="th">Дела недели <span>'+esc(perLabel(last))+'</span></div>'
      +(tasks.length
        ? tasks.map(x => '<div class="t'+(x.done?" done":"")+'"><i>'+(x.done?"✓":"◦")+'</i><span>'+esc(x.text)+'</span>'+(x.amount?'<b>'+esc(money(x.amount))+'</b>':"")+'</div>').join("")
        : '<div class="empty">на этот период дел пока нет</div>')
      +'</div></section>';
  }).join("");

  document.getElementById("dots").innerHTML = kinds.map((k,i)=>'<i'+(i===0?' class="on"':'')+'></i>').join("");
  document.getElementById("upd").textContent = "обновлено " + pad(new Date(data.fetchedAt).getHours()) + ":" + pad(new Date(data.fetchedAt).getMinutes());
  document.getElementById("rail").scrollLeft = 0;
}

document.getElementById("seg").addEventListener("click", e => {
  const b = e.target.closest("button[data-p]");
  if (!b || b.dataset.p === period) return;
  period = b.dataset.p;
  render();
});
document.getElementById("rail").addEventListener("scroll", () => {
  const rail = document.getElementById("rail");
  const cards = rail.querySelectorAll(".card");
  if (!cards.length) return;
  const i = Math.round(rail.scrollLeft / (cards[0].offsetWidth + 12));
  document.querySelectorAll(".dots i").forEach((d,k) => d.classList.toggle("on", k===i));
}, { passive:true });

render();
<\/script></body></html>`;
}

// ── Запуск ───────────────────────────────────────────────────────────
let data = null;
let errorText = null;

if (!KEY || KEY.indexOf("ВСТАВЬТЕ") === 0) {
  errorText = "Вставьте ключ из портала:\npllato.kz → Виджет на iPhone";
} else if (config.runsInWidget) {
  try {
    data = await loadStats(opts.period);
    try { fm.writeString(CACHE, JSON.stringify(data)); } catch (e) { /* кеш не обязателен */ }
  } catch (e) {
    data = readCache();
    if (!data) errorText = "Не удалось получить данные:\n" + (e.message || e);
  }
}

if (config.runsInWidget) {
  Script.setWidget(buildWidget(data, errorText));
} else if (errorText) {
  await buildWidget(null, errorText).presentMedium();
} else {
  // Полноэкранный режим: тянем все три интервала сразу, чтобы
  // переключение День / Неделя / Месяц было мгновенным.
  const byPeriod = {};
  const loaded = await Promise.all(["day", "week", "month"].map(async (p) => {
    try { return [p, await loadStats(p)]; } catch (e) { return [p, null]; }
  }));
  loaded.forEach(([p, d]) => { if (d) byPeriod[p] = d; });
  if (!Object.keys(byPeriod).length) {
    await buildWidget(null, "Не удалось получить данные").presentMedium();
  } else {
    const web = new WebView();
    await web.loadHTML(fullScreenHtml(byPeriod));
    await web.present(true);
  }
}
Script.complete();
