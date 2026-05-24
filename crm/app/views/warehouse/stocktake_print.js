// Pllato CRM — печатная форма «Сличительная ведомость по инвентаризации».
// Адаптирована под формат КЗ (близка к ИНВ-3 / Приложение 25 МФ РК),
// но не строгая — нужна для внутренних подписей и архива.
//
// Использование:
//   import { printStocktakeReport } from "./stocktake_print.js";
//   printStocktakeReport(stocktakeId, { mode: 'full' | 'differences' });
//
// mode:
//   'full'        — все позиции (полная опись)
//   'differences' — только расхождения (недостача + излишки)

import { getStocktake } from "../../stocktake.js";
import { findOrganizationByEntity, getDefaultOrganization } from "../../organizations.js";
import { getWarehouseProduct } from "../../warehouse.js";

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("ru-RU");
}

function fmtDT(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("ru-RU") + " " +
         new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function fmtNum(n) {
  return new Intl.NumberFormat("ru-RU").format(Number(n) || 0);
}
function fmtMoney(n) {
  return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(n) || 0);
}

const REASON_LABELS = {
  damage: "Порча",
  natural: "Естественная убыль",
  theft: "Хищение",
  expired: "Истёк срок годности",
  mistake: "Ошибка учёта",
  other: "Другое",
};
function reasonLabel(r) { return REASON_LABELS[r] || r || ""; }

/**
 * Открыть в новом окне печатную ведомость и автоматически вызвать print.
 *
 * @param {string} stocktakeId
 * @param {{ mode?: 'full' | 'differences' }} [opts]
 */
export function printStocktakeReport(stocktakeId, opts = {}) {
  const st = getStocktake(stocktakeId);
  if (!st) {
    alert("Инвентаризация не найдена.");
    return;
  }
  const mode = opts.mode === "differences" ? "differences" : "full";

  // Организация-владелец склада. Если у инвентаризации задано entity — берём
  // по нему. Иначе — первая позиция с entity. Иначе — default.
  let org = null;
  if (st.entity) org = findOrganizationByEntity(st.entity);
  if (!org) {
    for (const it of (st.items || [])) {
      if (it.entity) { org = findOrganizationByEntity(it.entity); if (org) break; }
      if (it.productId) {
        const p = getWarehouseProduct(it.productId);
        if (p?.entity) { org = findOrganizationByEntity(p.entity); if (org) break; }
      }
    }
  }
  if (!org) org = getDefaultOrganization();
  if (!org) {
    alert("Не настроена организация. Зайди в Настройки → Организации.");
    return;
  }

  const items = (st.items || []).filter((it) => mode === "full" ? true : (it.counted && Number(it.diff) !== 0));
  const t = st.totals || { shortageQty: 0, shortageAmount: 0, surplusQty: 0, surplusAmount: 0 };

  // Заполняем строки — для каждой считаем сумму расхождения по цене товара.
  const rows = items.map((it, idx) => {
    let priceHint = 0;
    if (it.productId) {
      const p = getWarehouseProduct(it.productId);
      priceHint = Number(p?.price) || Number(p?.lastInPrice) || 0;
    }
    const diff = Number(it.diff);
    const diffMoney = (Number.isFinite(diff) ? diff : 0) * priceHint;
    return {
      idx: idx + 1,
      sku: it.sku || "",
      name: it.name || "",
      unit: it.unit || "шт",
      expected: Number(it.expectedQty) || 0,
      actual: it.counted ? (Number(it.actualQty) || 0) : null,
      diff: it.counted ? diff : null,
      diffMoney: it.counted ? diffMoney : 0,
      reason: it.reason || "",
      counted: !!it.counted,
    };
  });

  const subtitle = mode === "differences"
    ? `Только расхождения (${rows.length} позиций)`
    : `Полная опись (${rows.length} позиций)`;

  const scope = st.scope === "category" && st.scopeFilter
    ? `Категория: ${st.scopeFilter}`
    : (st.entity ? `Юр.лицо: ${st.entity}` : "Весь склад");

  const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Сличительная ведомость ${escape(st.number)}</title>
<style>
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { font-family: "Times New Roman", Times, serif; font-size: 10pt; color: #000; margin: 0; padding: 0; }
.st-header-right { text-align: right; font-size: 9pt; margin-bottom: 10px; color: #444; }
.st-form-tag { display: inline-block; padding: 2px 10px; border: 1px solid #000; font-weight: 700; }
.st-org-line { display: flex; gap: 12px; margin-bottom: 6px; align-items: baseline; font-size: 10pt; }
.st-org-line .label { color: #444; }
.st-org-line .value { font-weight: 700; border-bottom: 1px solid #000; flex: 1; padding: 0 6px; }
.st-num-block { display: flex; justify-content: flex-end; gap: 16px; margin: 8px 0; }
.st-num-block .cell { border: 1px solid #000; padding: 4px 10px; text-align: center; min-width: 110px; }
.st-num-block .label-row { font-size: 8.5pt; color: #444; padding: 2px 4px; text-align: center; }
.st-title { text-align: center; font-size: 14pt; font-weight: 700; margin: 14px 0 6px; }
.st-subtitle { text-align: center; font-size: 11pt; color: #444; margin-bottom: 10px; }
.st-info-row { display: flex; gap: 24px; margin-bottom: 12px; font-size: 10pt; }
.st-info-row .info { display: flex; gap: 6px; }
.st-info-row .info .lbl { color: #444; }
.st-info-row .info .val { font-weight: 700; }
.st-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 10px; }
.st-table th, .st-table td { border: 1px solid #000; padding: 3px 5px; vertical-align: middle; }
.st-table th { font-weight: 600; text-align: center; background: #f5f5f5; }
.st-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
.st-table td.idx, .st-table td.center { text-align: center; }
.st-table .row-shortage { background: #fde2e2; }
.st-table .row-surplus { background: #d8f3dc; }
.st-table .row-uncounted { background: #f5f5f5; color: #777; font-style: italic; }
.st-table tfoot td { font-weight: 700; background: #f5f5f5; }
.st-totals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0; font-size: 10pt; }
.st-totals-box { border: 1px solid #000; padding: 8px 12px; }
.st-totals-box .ttl { color: #444; font-size: 9pt; }
.st-totals-box .val { font-weight: 700; font-size: 12pt; }
.st-totals-box.shortage { background: #fde2e2; }
.st-totals-box.surplus { background: #d8f3dc; }
.st-signs { margin-top: 18px; font-size: 10pt; }
.st-sign-row { display: flex; gap: 14px; margin: 12px 0; align-items: baseline; }
.st-sign-label { width: 200px; }
.st-sign-line { flex: 1; border-bottom: 1px solid #000; min-height: 14px; padding: 0 4px; }
.st-sign-name { white-space: nowrap; font-weight: 700; padding-bottom: 1px; }
.st-sign-sep { width: 12px; text-align: center; }
.st-sub-label { font-size: 8pt; color: #555; margin-top: 2px; padding-left: 214px; }
.st-print-btn { position: fixed; top: 16px; right: 16px; padding: 10px 18px; background: #25d366; color: white; border: 0; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.2); }
@media print { .st-print-btn { display: none; } }
</style>
</head>
<body>
  <button type="button" class="st-print-btn" onclick="window.print()">🖨 Печать</button>

  <div class="st-header-right">
    Приложение 25<br>
    к приказу Министра финансов<br>
    Республики Казахстан<br>
    от 20 декабря 2012 года № 562
  </div>
  <div style="text-align:right;margin-bottom:14px"><span class="st-form-tag">Форма ИНВ-3</span></div>

  <div class="st-org-line">
    <span class="label">Организация (индивидуальный предприниматель)</span>
    <span class="value">${escape(org.fullName || org.shortName || "")}</span>
    <span class="label">ИИН/БИН</span>
    <span class="value" style="flex:0 0 160px;text-align:center">${escape(org.bin || "")}</span>
  </div>

  <div class="st-num-block">
    <div>
      <div class="label-row">Номер документа</div>
      <div class="cell">${escape(st.number || "")}</div>
    </div>
    <div>
      <div class="label-row">Дата составления</div>
      <div class="cell">${escape(fmtDate(st.date))}</div>
    </div>
  </div>

  <h2 class="st-title">СЛИЧИТЕЛЬНАЯ ВЕДОМОСТЬ РЕЗУЛЬТАТОВ ИНВЕНТАРИЗАЦИИ ЗАПАСОВ</h2>
  <div class="st-subtitle">${escape(subtitle)}</div>

  <div class="st-info-row">
    <div class="info"><span class="lbl">Область:</span><span class="val">${escape(scope)}</span></div>
    <div class="info"><span class="lbl">Начата:</span><span class="val">${escape(fmtDT(st.startedAt))}</span></div>
    ${st.submittedAt ? `<div class="info"><span class="lbl">Передана на согласование:</span><span class="val">${escape(fmtDT(st.submittedAt))}</span></div>` : ""}
    ${st.approvedAt ? `<div class="info"><span class="lbl">Согласована:</span><span class="val">${escape(fmtDT(st.approvedAt))}</span></div>` : ""}
  </div>

  <table class="st-table">
    <thead>
      <tr>
        <th rowspan="2" style="width:4%">№ п/п</th>
        <th rowspan="2" style="width:10%">Номенкла-<br>турный номер</th>
        <th rowspan="2">Наименование, характеристика</th>
        <th rowspan="2" style="width:6%">Ед. изм.</th>
        <th rowspan="2" style="width:10%">По данным учёта (кол-во)</th>
        <th rowspan="2" style="width:10%">Фактически (кол-во)</th>
        <th colspan="2" style="width:18%">Расхождение (Δ)</th>
        <th rowspan="2" style="width:14%">Причина</th>
      </tr>
      <tr>
        <th>кол-во</th>
        <th>сумма, ₸</th>
      </tr>
    </thead>
    <tbody>
      ${rows.length === 0 ? `
        <tr><td colspan="9" class="center" style="padding:14px">Нет позиций ${mode === "differences" ? "с расхождениями" : ""}</td></tr>
      ` : rows.map((r) => {
        const cls = !r.counted ? "row-uncounted"
                    : (Number(r.diff) < 0 ? "row-shortage"
                    : (Number(r.diff) > 0 ? "row-surplus" : ""));
        const diffStr = r.counted
          ? (Number(r.diff) > 0 ? `+${fmtNum(r.diff)}` : fmtNum(r.diff))
          : "—";
        return `
          <tr class="${cls}">
            <td class="idx">${r.idx}</td>
            <td class="center">${escape(r.sku)}</td>
            <td>${escape(r.name)}</td>
            <td class="center">${escape(r.unit)}</td>
            <td class="num">${fmtNum(r.expected)}</td>
            <td class="num">${r.counted ? fmtNum(r.actual) : "—"}</td>
            <td class="num">${diffStr}</td>
            <td class="num">${r.counted && Number(r.diff) !== 0 ? fmtMoney(r.diffMoney) : "—"}</td>
            <td>${escape(reasonLabel(r.reason))}</td>
          </tr>
        `;
      }).join("")}
    </tbody>
  </table>

  <div class="st-totals-grid">
    <div class="st-totals-box shortage">
      <div class="ttl">НЕДОСТАЧА</div>
      <div class="val">${fmtNum(t.shortageQty)} шт · ${fmtMoney(t.shortageAmount)} ₸</div>
    </div>
    <div class="st-totals-box surplus">
      <div class="ttl">ИЗЛИШКИ</div>
      <div class="val">${fmtNum(t.surplusQty)} шт · ${fmtMoney(t.surplusAmount)} ₸</div>
    </div>
  </div>

  <div class="st-signs">
    <div style="text-align:center;font-weight:700;margin-bottom:14px">Подписи комиссии</div>
    <div class="st-sign-row">
      <span class="st-sign-label">Председатель комиссии</span>
      <span class="st-sign-line"></span>
      <span class="st-sign-sep">/</span>
      <span class="st-sign-name">${escape(org.directorName || "")}</span>
      <span class="st-sign-line"></span>
    </div>
    <div class="st-sub-label">должность &nbsp;&nbsp; подпись &nbsp;&nbsp; расшифровка подписи</div>

    <div class="st-sign-row" style="margin-top:18px">
      <span class="st-sign-label">Член комиссии</span>
      <span class="st-sign-line"></span>
      <span class="st-sign-sep">/</span>
      <span class="st-sign-line"></span>
    </div>

    <div class="st-sign-row" style="margin-top:18px">
      <span class="st-sign-label">Член комиссии</span>
      <span class="st-sign-line"></span>
      <span class="st-sign-sep">/</span>
      <span class="st-sign-line"></span>
    </div>

    <div class="st-sign-row" style="margin-top:24px">
      <span class="st-sign-label">Материально-ответственное<br>лицо (МОЛ)</span>
      <span class="st-sign-line"></span>
      <span class="st-sign-sep">/</span>
      <span class="st-sign-name">${escape(org.molName || "")}</span>
      <span class="st-sign-line"></span>
    </div>
    <div class="st-sub-label">подпись &nbsp;&nbsp; расшифровка подписи</div>

    <div style="margin-top:16px;font-weight:700">М.П.</div>

    ${st.approvedAt ? `
      <div style="margin-top:18px;padding-top:10px;border-top:1px solid #000;font-size:9pt;color:#444">
        Согласовано в системе: ${escape(fmtDT(st.approvedAt))} — ${escape(st.approvedByName || "")}
        ${st.approvalComment ? `<br>Комментарий: «${escape(st.approvalComment)}»` : ""}
      </div>
    ` : ""}
  </div>

  <script>
    window.addEventListener("load", function() { setTimeout(function() { window.print(); }, 300); });
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) {
    alert("Браузер заблокировал открытие окна печати. Разреши всплывающие окна для этого сайта.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
