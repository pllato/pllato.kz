// Pllato CRM — печатная форма З-2 (Накладная на отпуск запасов на сторону).
// Приложение 26 к приказу Министра финансов РК от 20.12.2012 № 562.
//
// Использование:
//   import { printInvoiceZ2 } from "./invoice_print.js";
//   printInvoiceZ2(docId);
// Открывает новое окно с готовой к печати формой A4 и автоматически
// вызывает window.print().

import { getWarehouseDocument, getLot, getWarehouseProduct } from "../../warehouse.js";
import { findOrganizationByEntity, getDefaultOrganization } from "../../organizations.js";
import { Store } from "../../store.js";

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("ru-RU");
}

function fmtAmount(v) {
  return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v) || 0);
}

function fmtQty(v) {
  return new Intl.NumberFormat("ru-RU").format(Number(v) || 0);
}

// =============================================================================
// Сумма прописью (тенге) — упрощённая русская реализация.
// =============================================================================
const ONES = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const ONES_F = ["", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const TEENS = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const HUNDREDS = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

function tripleToWords(n, female = false) {
  const arr = female ? ONES_F : ONES;
  const out = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  if (h) out.push(HUNDREDS[h]);
  if (t === 1) { out.push(TEENS[o]); }
  else {
    if (t) out.push(TENS[t]);
    if (o) out.push(arr[o]);
  }
  return out.join(" ");
}

function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function intToWords(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (n === 0) return "ноль";
  const parts = [];
  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const rest = n % 1_000;
  if (billions) parts.push(`${tripleToWords(billions)} ${plural(billions, "миллиард", "миллиарда", "миллиардов")}`);
  if (millions) parts.push(`${tripleToWords(millions)} ${plural(millions, "миллион", "миллиона", "миллионов")}`);
  if (thousands) {
    parts.push(`${tripleToWords(thousands, true)} ${plural(thousands, "тысяча", "тысячи", "тысяч")}`);
  }
  if (rest) parts.push(tripleToWords(rest));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Сумма в тенге прописью: "Восемьдесят семь тысяч сто двадцать два тенге 00 тиын"
 */
export function tengeInWords(amount) {
  const num = Number(amount) || 0;
  const tenge = Math.floor(num);
  const tiyn = Math.round((num - tenge) * 100);
  const words = intToWords(tenge);
  const cap = words.charAt(0).toUpperCase() + words.slice(1);
  return `${cap} тенге ${String(tiyn).padStart(2, "0")} тиын`;
}

/**
 * Количество прописью: "Триста двадцать четыре"
 */
export function qtyInWords(qty) {
  const num = Math.floor(Number(qty) || 0);
  const w = intToWords(num);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

// =============================================================================
// Описание позиции (наименование + серия + срок годности)
// =============================================================================
function buildItemDescription(item) {
  const productName = item.productName || (item.productId ? (getWarehouseProduct(item.productId)?.name || "") : "");
  let suffix = "";
  if (item.lotId) {
    const lot = getLot(item.lotId);
    if (lot) {
      const lotCode = lot.lotCode || item.lotCode || "";
      const exp = fmtDate(lot.expiryDate || item.expiryDate);
      if (lotCode || exp) {
        suffix = `. ${lotCode ? `Серия ${lotCode}` : ""}${lotCode && exp ? ", " : ""}${exp ? `годен до ${exp}` : ""}`;
      }
    }
  } else if (item.lotCode || item.expiryDate) {
    const exp = fmtDate(item.expiryDate);
    suffix = `. ${item.lotCode ? `Серия ${item.lotCode}` : ""}${item.lotCode && exp ? ", " : ""}${exp ? `годен до ${exp}` : ""}`;
  }
  return `${productName}${suffix}`.trim();
}

// =============================================================================
// Получатель: из counterpartyContactId или counterpartyText
// =============================================================================
function buildReceiverText(doc) {
  if (doc.counterpartyContactId) {
    const contact = Store.get("contacts", doc.counterpartyContactId);
    if (contact) {
      // Если в контакте есть компания — показываем "Компания (контактное лицо)".
      if (contact.company) {
        return contact.name ? `${contact.company} (${contact.name})` : contact.company;
      }
      return contact.name || doc.counterpartyText || "";
    }
  }
  return doc.counterpartyText || "";
}

// =============================================================================
// Главная функция: открывает окно и печатает.
// =============================================================================
export function printInvoiceZ2(docId) {
  const doc = getWarehouseDocument(docId);
  if (!doc) {
    alert("Документ не найден.");
    return;
  }
  if (doc.type !== "sale_invoice" && doc.type !== "sale_act") {
    if (!confirm("Этот документ не является расходной накладной. Печатать форму З-2 всё равно?")) return;
  }

  // Определяем организацию-отправителя.
  // Если в позициях есть товары с entity ('ТОО'/'ИП') — берём первую найденную.
  let senderOrg = null;
  for (const it of (doc.items || [])) {
    if (it.productId) {
      const p = getWarehouseProduct(it.productId);
      if (p?.entity) {
        senderOrg = findOrganizationByEntity(p.entity);
        if (senderOrg) break;
      }
    }
  }
  if (!senderOrg) senderOrg = getDefaultOrganization();
  if (!senderOrg) {
    alert("Не настроена организация для печатной формы. Зайди в Настройки → Организации.");
    return;
  }

  const items = Array.isArray(doc.items) ? doc.items : [];
  // Сумма по строкам берётся как lineAmount или qty*unitPrice (с НДС).
  let totalQty = 0;
  let totalAmountVat = 0;  // сумма с НДС
  const rows = items.map((it, idx) => {
    const qty = Number(it.qty) || 0;
    const price = Number(it.unitPrice) || 0;
    const line = Number(it.lineAmount) || qty * price;
    totalQty += qty;
    totalAmountVat += line;
    return {
      idx: idx + 1,
      desc: buildItemDescription(it),
      sku: it.productSku || (it.productId ? (getWarehouseProduct(it.productId)?.sku || "") : ""),
      unit: it.unit || (it.productId ? (getWarehouseProduct(it.productId)?.unit || "шт") : "шт"),
      qty,
      price,
      line,
    };
  });

  // НДС: ставка из организации (default 12%). НДС = total - total / (1 + rate/100).
  const vatRate = Number(senderOrg.vatRate) || 12;
  const vatFactor = vatRate > 0 ? vatRate / (100 + vatRate) : 0;
  let totalVat = 0;
  rows.forEach((r) => {
    r.vat = +(r.line * vatFactor).toFixed(2);
    totalVat += r.vat;
  });
  totalVat = +totalVat.toFixed(2);

  const receiverText = buildReceiverText(doc);
  const docNumber = doc.number || "—";
  const docDate = fmtDate(doc.date);

  // HTML формы.
  const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Накладная № ${escape(docNumber)} от ${escape(docDate)}</title>
<style>
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { font-family: "Times New Roman", Times, serif; font-size: 10pt; color: #000; margin: 0; padding: 0; }
.z2-header-right { text-align: right; font-size: 9pt; margin-bottom: 12px; }
.z2-form-tag { display: inline-block; padding: 2px 10px; border: 1px solid #000; font-weight: 700; }
.z2-org-line { display: flex; gap: 12px; margin-bottom: 6px; align-items: baseline; font-size: 10pt; }
.z2-org-line .label { color: #444; }
.z2-org-line .value { font-weight: 700; border-bottom: 1px solid #000; flex: 1; padding: 0 6px; }
.z2-num-block { display: flex; justify-content: flex-end; gap: 16px; margin: 8px 0; }
.z2-num-block .cell { border: 1px solid #000; padding: 4px 10px; text-align: center; min-width: 110px; }
.z2-num-block .label-row { font-size: 8.5pt; color: #444; padding: 2px 4px; text-align: center; }
.z2-title { text-align: center; font-size: 14pt; font-weight: 700; margin: 14px 0 12px; }
.z2-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 8px; }
.z2-table th, .z2-table td { border: 1px solid #000; padding: 3px 5px; vertical-align: middle; }
.z2-table th { font-weight: 600; text-align: center; background: #f5f5f5; }
.z2-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
.z2-table td.idx, .z2-table td.center { text-align: center; }
.z2-table tfoot td { font-weight: 700; background: #f5f5f5; }
.z2-totals-words { display: flex; gap: 10px; margin: 10px 0; font-size: 10pt; }
.z2-totals-words .label { color: #444; }
.z2-totals-words .value { border-bottom: 1px solid #000; flex: 1; padding: 0 6px; font-weight: 700; }
.z2-signs { margin-top: 18px; font-size: 10pt; }
.z2-sign-row { display: flex; gap: 14px; margin: 8px 0; align-items: baseline; }
.z2-sign-label { width: 170px; }
.z2-sign-sep { width: 12px; text-align: center; }
.z2-sign-line { flex: 1; border-bottom: 1px solid #000; min-height: 14px; padding: 0 4px; }
.z2-sign-name { white-space: nowrap; font-weight: 700; padding-bottom: 1px; }
.z2-sub-label { font-size: 8pt; color: #555; margin-top: 2px; padding-left: 184px; }
.z2-mp { margin-top: 14px; font-weight: 700; }
.z2-print-btn { position: fixed; top: 16px; right: 16px; padding: 10px 18px; background: #25d366; color: white; border: 0; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.2); }
@media print { .z2-print-btn { display: none; } }
</style>
</head>
<body>
  <button type="button" class="z2-print-btn" onclick="window.print()">🖨 Печать</button>

  <div class="z2-header-right">
    Приложение 26<br>
    к приказу Министра финансов<br>
    Республики Казахстан<br>
    от 20 декабря 2012 года № 562
  </div>
  <div style="text-align:right;margin-bottom:14px"><span class="z2-form-tag">Форма З-2</span></div>

  <div class="z2-org-line">
    <span class="label">Организация (индивидуальный предприниматель)</span>
    <span class="value">${escape(senderOrg.fullName || senderOrg.shortName || "")}</span>
    <span class="label">ИИН/БИН</span>
    <span class="value" style="flex:0 0 160px;text-align:center">${escape(senderOrg.bin || "")}</span>
  </div>

  <div class="z2-num-block">
    <div>
      <div class="label-row">Номер документа</div>
      <div class="cell">${escape(docNumber)}</div>
    </div>
    <div>
      <div class="label-row">Дата составления</div>
      <div class="cell">${escape(docDate)}</div>
    </div>
  </div>

  <h2 class="z2-title">НАКЛАДНАЯ НА ОТПУСК ЗАПАСОВ НА СТОРОНУ</h2>

  <table class="z2-table">
    <thead>
      <tr>
        <th style="width:18%">Организация (ИП) — отправитель</th>
        <th style="width:18%">Организация (ИП) — получатель</th>
        <th style="width:14%">Ответственный за поставку (Ф.И.О.)</th>
        <th style="width:14%">Транспортная организация</th>
        <th style="width:14%">Товарно-транспортная накладная (номер, дата)</th>
      </tr>
    </thead>
    <tbody>
      <tr style="height:32px">
        <td>${escape(senderOrg.shortName || senderOrg.fullName || "")}</td>
        <td>${escape(receiverText)}</td>
        <td>${escape(senderOrg.directorName || "")}</td>
        <td></td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <table class="z2-table">
    <thead>
      <tr>
        <th rowspan="2" style="width:4%">№ п/п</th>
        <th rowspan="2">Наименование, характеристика</th>
        <th rowspan="2" style="width:10%">Номенкла-<br>турный номер</th>
        <th rowspan="2" style="width:6%">Ед. изм.</th>
        <th colspan="2" style="width:14%">Количество</th>
        <th rowspan="2" style="width:9%">Цена за единицу, в KZT</th>
        <th rowspan="2" style="width:11%">Сумма с НДС, в KZT</th>
        <th rowspan="2" style="width:9%">Сумма НДС, в KZT</th>
      </tr>
      <tr>
        <th>подлежит отпуску</th>
        <th>отпущено</th>
      </tr>
      <tr style="font-size:8pt">
        <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((r) => `
        <tr>
          <td class="idx">${r.idx}</td>
          <td>${escape(r.desc)}</td>
          <td class="center">${escape(r.sku)}</td>
          <td class="center">${escape(r.unit)}</td>
          <td class="num">${fmtQty(r.qty)}</td>
          <td class="num">${fmtQty(r.qty)}</td>
          <td class="num">${fmtAmount(r.price)}</td>
          <td class="num">${fmtAmount(r.line)}</td>
          <td class="num">${fmtAmount(r.vat)}</td>
        </tr>
      `).join("")}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" class="center">Итого</td>
        <td class="num">${fmtQty(totalQty)}</td>
        <td class="num">${fmtQty(totalQty)}</td>
        <td class="center">х</td>
        <td class="num">${fmtAmount(totalAmountVat)}</td>
        <td class="num">${fmtAmount(totalVat)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="z2-totals-words">
    <span class="label">Всего отпущено количество запасов (прописью)</span>
    <span class="value">${escape(qtyInWords(totalQty))}</span>
  </div>
  <div class="z2-totals-words">
    <span class="label">на сумму (прописью), в KZT</span>
    <span class="value">${escape(tengeInWords(totalAmountVat))}</span>
  </div>

  <div class="z2-signs">
    <div style="text-align:center;margin-bottom:6px;font-weight:600">${escape(senderOrg.directorPosition || "Финансовый директор")}</div>
    <div class="z2-sign-row">
      <span class="z2-sign-label">Отпуск разрешил</span>
      <span class="z2-sign-line"></span>
      <span class="z2-sign-sep">/</span>
      <span class="z2-sign-name">${escape(senderOrg.directorName || "")}</span>
      <span class="z2-sign-line"></span>
      <span style="white-space:nowrap;font-size:9pt">По доверенности №___ от "___"___________ 20___ г.</span>
    </div>
    <div class="z2-sub-label">должность &nbsp;&nbsp; подпись &nbsp;&nbsp; расшифровка подписи</div>

    <div class="z2-sign-row" style="margin-top:18px">
      <span class="z2-sign-label">Главный бухгалтер</span>
      <span class="z2-sign-line"></span>
      <span class="z2-sign-sep">/</span>
      <span class="z2-sign-name">${escape(senderOrg.accountantName || "")}</span>
      <span class="z2-sign-line"></span>
    </div>
    <div class="z2-sub-label">подпись &nbsp;&nbsp; расшифровка подписи</div>

    <div class="z2-mp">М.П.</div>

    <div class="z2-sign-row" style="margin-top:18px">
      <span class="z2-sign-label">Отпустил</span>
      <span class="z2-sign-line"></span>
      <span class="z2-sign-sep">/</span>
      <span class="z2-sign-name">${escape(senderOrg.molName || "")}</span>
      <span class="z2-sign-line"></span>
      <span class="z2-sign-label" style="text-align:right">Запасы получил</span>
      <span class="z2-sign-line"></span>
      <span class="z2-sign-sep">/</span>
      <span class="z2-sign-line"></span>
    </div>
    <div class="z2-sub-label">подпись &nbsp;&nbsp; расшифровка подписи &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; подпись &nbsp; расшифровка подписи</div>
  </div>

  <script>
    // Авто-запуск печати через 300ms после загрузки.
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
