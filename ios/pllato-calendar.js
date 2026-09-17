// ─────────────────────────────────────────────────────────────────────
// Pllato · Календарь — встречи дня на домашнем экране iPhone.
//
// iOS не умеет делать виджеты из веб-приложения: WidgetKit — это нативный
// код. Поэтому виджет рисует бесплатное приложение Scriptable, а данные
// берёт из портала по ключу. Своё приложение в App Store не нужно.
//
// Установка:
//   1. Scriptable из App Store (бесплатно).
//   2. В портале: «Виджет на iPhone» → «Создать ключ» → «Скопировать
//      скрипт» (ключ уже подставлен).
//   3. Scriptable → «+» → вставить → назвать «Pllato Календарь» → Готово.
//   4. Домашний экран: долгое нажатие → «+» → Scriptable → размер →
//      «Добавить виджет». Затем долгое нажатие на виджет → «Изменить
//      виджет» → Script: Pllato Календарь.
//
// Размеры: маленький — ближайшая встреча, средний — 4 события,
// большой — 9 событий. Обновляется по расписанию iOS (обычно раз в
// 15–30 минут) — чаще система не даёт ни одному виджету.
// ─────────────────────────────────────────────────────────────────────

const KEY = "ВСТАВЬТЕ_КЛЮЧ_ИЗ_ПОРТАЛА";

const API = "https://pllato-elc-worker.uurraa.workers.dev/api/widget/today";
const OPEN_URL = "https://pllato.kz/team.html?page=calendar";

const C = {
  bg1: new Color("#171d2b"),
  bg2: new Color("#0d1119"),
  card: new Color("#ffffff", 0.06),
  text: new Color("#f5f2ec"),
  dim: new Color("#8e94a3"),
  bronze: new Color("#cfa46c"),
  green: new Color("#46d18a"),
  violet: new Color("#a78bfa"),
  red: new Color("#f87171"),
};

const fm = FileManager.local();
const CACHE = fm.joinPath(fm.cacheDirectory(), "pllato-today.json");
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"];

const pad = (n) => String(n).padStart(2, "0");
const hhmm = (ms) => { const d = new Date(ms); return pad(d.getHours()) + ":" + pad(d.getMinutes()); };

function plural(n, forms) {
  const a = Math.abs(n) % 100, b = a % 10;
  return forms[(a > 10 && a < 20) || b > 4 || b === 0 ? 2 : b === 1 ? 0 : 1];
}

function readCache() {
  try { return JSON.parse(fm.readString(CACHE)); } catch (e) { return null; }
}

async function loadToday() {
  const now = new Date();
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const req = new Request(`${API}?key=${encodeURIComponent(KEY)}&date=${date}&tzo=${now.getTimezoneOffset()}`);
  req.timeoutInterval = 20;
  const data = await req.loadJSON();
  if (!data || data.ok !== true) throw new Error(data && data.error ? data.error : "нет данных");
  data.fetchedAt = Date.now();
  try { fm.writeString(CACHE, JSON.stringify(data)); } catch (e) { /* кеш не обязателен */ }
  return data;
}

// Подложка карточки — чтобы строки не сливались в сплошной текст.
function card(parent, pad = 7) {
  const s = parent.addStack();
  s.layoutHorizontally();
  s.centerAlignContent();
  s.backgroundColor = C.card;
  s.cornerRadius = 9;
  s.setPadding(pad, 9, pad, 9);
  return s;
}

function statusLine(events) {
  const now = Date.now();
  const meets = events.filter((e) => e.kind !== "task");
  const running = meets.find((e) => e.at <= now && e.end > now);
  const next = meets.find((e) => e.at > now);
  if (running) return next ? `идёт · дальше в ${hhmm(next.at)}` : "идёт сейчас";
  if (next) {
    const mins = Math.round((next.at - now) / 60000);
    return mins <= 90 ? `через ${mins < 1 ? "минуту" : mins + " мин"}` : `ближайшая в ${hhmm(next.at)}`;
  }
  return meets.length ? "все прошли" : "встреч нет";
}

function header(w, data) {
  const row = w.addStack();
  row.centerAlignContent();
  const d = new Date();
  const title = row.addText(`${d.getDate()} ${MONTHS[d.getMonth()]}`);
  title.font = Font.semiboldSystemFont(14);
  title.textColor = C.text;
  row.addSpacer();
  const meets = data.events.filter((e) => e.kind !== "task").length;
  const chip = row.addStack();
  chip.backgroundColor = C.card;
  chip.cornerRadius = 7;
  chip.setPadding(3, 7, 3, 7);
  const cnt = chip.addText(`${meets} ${plural(meets, ["встреча", "встречи", "встреч"])}`);
  cnt.font = Font.mediumSystemFont(11);
  cnt.textColor = C.bronze;
  w.addSpacer(3);
  const st = w.addText(statusLine(data.events));
  st.font = Font.systemFont(11);
  st.textColor = C.dim;
  st.lineLimit = 1;
}

// Строка события: цветная полоска слева, время, название, отметка «сейчас».
function eventRow(w, ev, now) {
  const isNow = ev.at <= now && ev.end > now;
  const isPast = ev.end <= now;
  const accent = ev.kind === "task" ? C.violet : isNow ? C.green : C.bronze;

  const box = card(w, 6);
  const bar = box.addStack();
  bar.size = new Size(3, 24);
  bar.backgroundColor = accent;
  bar.cornerRadius = 2;
  box.addSpacer(8);

  const col = box.addStack();
  col.layoutVertically();
  const top = col.addStack();
  top.centerAlignContent();
  const t = top.addText(hhmm(ev.at));
  t.font = new Font("Menlo", 10.5);
  t.textColor = accent;
  top.addSpacer(6);
  const name = top.addText(ev.title || "—");
  name.font = Font.mediumSystemFont(12);
  name.textColor = C.text;
  name.lineLimit = 1;
  if (ev.note || ev.pipe) {
    const sub = col.addText([ev.note, ev.stage].filter(Boolean).join(" · "));
    sub.font = Font.systemFont(9.5);
    sub.textColor = C.dim;
    sub.lineLimit = 1;
  }
  box.addSpacer();
  if (isNow) {
    const pill = box.addStack();
    pill.backgroundColor = new Color("#46d18a", 0.18);
    pill.cornerRadius = 6;
    pill.setPadding(2, 6, 2, 6);
    const p = pill.addText("сейчас");
    p.font = Font.boldSystemFont(9);
    p.textColor = C.green;
  }
  if (isPast) box.addSpacer(0);
}

function buildWidget(data, errorText) {
  const w = new ListWidget();
  const g = new LinearGradient();
  g.colors = [C.bg1, C.bg2];
  g.locations = [0, 1];
  w.backgroundGradient = g;
  w.setPadding(13, 13, 11, 13);
  w.url = OPEN_URL;
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

  if (errorText) {
    const t = w.addText("Pllato · Календарь");
    t.font = Font.semiboldSystemFont(13);
    t.textColor = C.text;
    w.addSpacer(5);
    const e = w.addText(errorText);
    e.font = Font.systemFont(11);
    e.textColor = C.dim;
    return w;
  }

  const size = config.runsInWidget ? config.widgetFamily : "medium";
  const events = data.events || [];
  const now = Date.now();

  if (size === "small" || size === "accessoryRectangular") {
    const meets = events.filter((e) => e.kind !== "task");
    const upcoming = meets.find((e) => e.end > now) || meets[meets.length - 1];
    const top = w.addStack();
    top.centerAlignContent();
    const cnt = top.addText(String(meets.length));
    cnt.font = Font.boldSystemFont(28);
    cnt.textColor = C.text;
    top.addSpacer(6);
    const lbl = top.addText(plural(meets.length, ["встреча", "встречи", "встреч"]));
    lbl.font = Font.systemFont(11);
    lbl.textColor = C.dim;
    w.addSpacer(7);
    if (upcoming) {
      const isNow = upcoming.at <= now && upcoming.end > now;
      const t = w.addText(hhmm(upcoming.at) + (isNow ? "  · идёт" : ""));
      t.font = new Font("Menlo", 12);
      t.textColor = isNow ? C.green : C.bronze;
      w.addSpacer(2);
      const n = w.addText(upcoming.title || "—");
      n.font = Font.mediumSystemFont(11);
      n.textColor = C.text;
      n.lineLimit = 3;
    } else {
      const n = w.addText("Календарь свободен");
      n.font = Font.systemFont(11);
      n.textColor = C.dim;
    }
    w.addSpacer();
    return w;
  }

  header(w, data);
  w.addSpacer(8);
  const limit = size === "large" ? 8 : 3;
  const shown = events.slice(0, limit);
  if (!shown.length) {
    const t = w.addText("Календарь свободен");
    t.font = Font.systemFont(12);
    t.textColor = C.dim;
  }
  shown.forEach((ev, i) => {
    if (i) w.addSpacer(5);
    eventRow(w, ev, now);
  });
  const rest = events.length - shown.length;
  w.addSpacer();
  const foot = w.addStack();
  foot.centerAlignContent();
  if (rest > 0) {
    const more = foot.addText(`и ещё ${rest}`);
    more.font = Font.systemFont(9.5);
    more.textColor = C.dim;
  }
  foot.addSpacer();
  const upd = foot.addText(hhmm(data.fetchedAt || Date.now()));
  upd.font = Font.systemFont(9.5);
  upd.textColor = C.dim;
  upd.textOpacity = 0.7;
  return w;
}

let widget;
if (!KEY || KEY.indexOf("ВСТАВЬТЕ") === 0) {
  widget = buildWidget(null, "Вставьте ключ из портала:\npllato.kz → Виджет на iPhone");
} else {
  try {
    widget = buildWidget(await loadToday(), null);
  } catch (e) {
    const cached = readCache();
    widget = cached ? buildWidget(cached, null)
      : buildWidget(null, "Не удалось получить данные:\n" + (e.message || e));
  }
}

if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
