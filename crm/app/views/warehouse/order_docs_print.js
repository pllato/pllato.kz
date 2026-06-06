// Pllato CRM — печатные формы документов заказа из карточки сделки:
//   • printOrderInvoiceForPayment({ deal, items, contact }) — «Счёт на оплату покупателю»
//   • printOrderRealization({ deal, items, contact })        — «Реализация товаров и услуг (накладная)»
//
// Накладная на отпуск (форма З-2) печатается отдельно через invoice_print.js
// (она строится из складского документа). Эти две формы строятся из состава
// заказа сделки (deal_items) + реквизитов организации-отправителя — чтобы можно
// было распечатать счёт/реализацию даже пока 1С-документ ещё черновик.

import { getWarehouseProduct } from "../../warehouse.js";
import { findOrganizationByEntity, getDefaultOrganization } from "../../organizations.js";
import { tengeInWords, qtyInWords } from "./invoice_print.js";

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtAmount(v) {
  return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v) || 0);
}

function fmtQty(v) {
  return new Intl.NumberFormat("ru-RU").format(Number(v) || 0);
}

// Дата: принимает ISO «YYYY-MM-DD», timestamp (ms) или Date. Пусто → сегодня.
function fmtDate(value) {
  let d;
  if (value == null || value === "") d = new Date();
  else if (typeof value === "number") d = new Date(value);
  else if (value instanceof Date) d = value;
  else d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) d = new Date();
  return d.toLocaleDateString("ru-RU");
}

// =============================================================================
// Общие билдеры
// =============================================================================

// Организация-отправитель: по entity первого товара, иначе дефолтная.
function resolveSenderOrg(items) {
  for (const it of items || []) {
    if (it.productId) {
      const p = getWarehouseProduct(it.productId);
      if (p?.entity) {
        const org = findOrganizationByEntity(p.entity);
        if (org) return org;
      }
    }
  }
  return getDefaultOrganization();
}

// Описание позиции: наше наименование (+ через слэш — для клиента) + серия/срок.
function itemDescription(item) {
  const product = item.productId ? getWarehouseProduct(item.productId) : null;
  const ourName = item.productName || product?.name || "Позиция";
  const customerName = product?.customerName || product?.customerProductName || "";
  const name = customerName ? `${ourName} / ${customerName}` : ourName;
  let suffix = "";
  const code = item.lotCode || "";
  const exp = item.expiryDate ? fmtDate(item.expiryDate) : "";
  if (code || exp) {
    suffix = `. ${code ? `Серия ${code}` : ""}${code && exp ? ", " : ""}${exp ? `годен до ${exp}` : ""}`;
  }
  return `${name}${suffix}`.trim();
}

function buildRows(items) {
  return (items || []).map((it, idx) => {
    const product = it.productId ? getWarehouseProduct(it.productId) : null;
    const qty = Number(it.qty) || 0;
    const price = Number(it.unitPrice) || 0;
    const sum = qty * price;
    return {
      idx: idx + 1,
      desc: itemDescription(it),
      sku: product?.sku || "",
      unit: it.unit || product?.unit || "шт",
      qty,
      price,
      sum,
    };
  });
}

function buyerText(deal, contact) {
  if (contact) {
    if (contact.company) return contact.name ? `${contact.company} (${contact.name})` : contact.company;
    if (contact.name) return contact.name;
  }
  return deal?.title || "—";
}

function buyerBin(contact) {
  return contact?.bin || contact?.iinBin || contact?.binIin || "";
}

function openPrintWindow(html) {
  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) {
    alert("Браузер заблокировал окно печати. Разреши всплывающие окна для этого сайта.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// Общий <style> для обеих форм (A4, Times).
const SHARED_STYLE = `
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { font-family: "Times New Roman", Times, serif; font-size: 10pt; color: #000; margin: 0; padding: 0; }
.doc-title { text-align: center; font-size: 14pt; font-weight: 700; margin: 12px 0; }
.doc-sub { font-size: 9pt; color: #333; margin: 4px 0; }
.doc-party { margin: 6px 0; font-size: 10pt; }
.doc-party .label { color: #444; }
.doc-party .value { font-weight: 700; }
.req-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 10px; }
.req-table td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
.req-table td.k { width: 26%; color: #333; }
.tbl { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 8px 0; }
.tbl th, .tbl td { border: 1px solid #000; padding: 3px 5px; vertical-align: middle; }
.tbl th { font-weight: 600; text-align: center; background: #f5f5f5; }
.tbl td.num { text-align: right; font-variant-numeric: tabular-nums; }
.tbl td.center { text-align: center; }
.tbl tfoot td { font-weight: 700; background: #f5f5f5; }
.totals-words { margin: 10px 0; font-size: 10pt; }
.totals-words .value { font-weight: 700; border-bottom: 1px solid #000; }
.signs { margin-top: 22px; font-size: 10pt; }
.sign-row { display: flex; gap: 14px; margin: 14px 0 4px; align-items: flex-end; }
.sign-label { width: 190px; }
.sign-line { flex: 1; border-bottom: 1px solid #000; min-height: 16px; position: relative; }
.sign-name { white-space: nowrap; font-weight: 700; }
.sign-sub { font-size: 8pt; color: #555; padding-left: 204px; }
.stamp { position: absolute; right: 30px; bottom: -6px; max-height: 110px; opacity: .92; }
.sign-img { position: absolute; left: 20px; bottom: 0; max-height: 46px; }
.mp { margin-top: 12px; font-weight: 700; }
.print-btn { position: fixed; top: 16px; right: 16px; padding: 10px 18px; background: #25d366; color: #fff; border: 0; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.2); }
@media print { .print-btn { display: none; } }
`;

const AUTO_PRINT = `<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},300);});</script>`;

// =============================================================================
// 1) Счёт на оплату покупателю
// =============================================================================
export function printOrderInvoiceForPayment({ deal, items, contact }) {
  if (!deal) { alert("Сделка не найдена."); return; }
  items = Array.isArray(items) ? items : [];
  if (!items.length) { alert("В заказе нет позиций — счёт печатать нечего."); return; }
  const org = resolveSenderOrg(items);
  if (!org) { alert("Не настроена организация. Зайди в Настройки → Организации."); return; }

  const rows = buildRows(items);
  const total = rows.reduce((s, r) => s + r.sum, 0);
  const vatRate = Number(org.vatRate) || 12;
  const vat = vatRate > 0 ? +(total * (vatRate / (100 + vatRate))).toFixed(2) : 0;

  const number = deal.oneCInvoiceNumber || deal.orderInvoiceForPaymentNumber || `СЧ-${String(deal.id || "").slice(-6)}`;
  const date = fmtDate(deal.orderReservedAt || deal.orderAwaitingPaymentAt || Date.now());

  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<title>Счёт на оплату № ${escape(number)}</title>
<style>${SHARED_STYLE}</style></head><body>
  <button type="button" class="print-btn" onclick="window.print()">🖨 Печать</button>

  <table class="req-table">
    <tr><td class="k">Бенефициар:<br><b>${escape(org.fullName || org.shortName || "")}</b></td>
        <td>ИИК<br><b>${escape(org.iik || "—")}</b></td>
        <td class="k">БИН<br><b>${escape(org.bin || "—")}</b></td></tr>
    <tr><td class="k">Банк бенефициара:<br><b>${escape(org.bank || "—")}</b></td>
        <td>БИК<br><b>${escape(org.bik || "—")}</b></td>
        <td class="k">Кбе<br><b>17</b></td></tr>
  </table>

  <h2 class="doc-title">Счёт на оплату № ${escape(number)} от ${escape(date)}</h2>

  <div class="doc-party"><span class="label">Поставщик:</span> <span class="value">${escape(org.fullName || org.shortName || "")}</span>, БИН ${escape(org.bin || "—")}${org.address ? `, ${escape(org.address)}` : ""}${org.phone ? `, тел. ${escape(org.phone)}` : ""}</div>
  <div class="doc-party"><span class="label">Покупатель:</span> <span class="value">${escape(buyerText(deal, contact))}</span>${buyerBin(contact) ? `, БИН ${escape(buyerBin(contact))}` : ""}</div>

  <table class="tbl">
    <thead><tr>
      <th style="width:4%">№</th>
      <th>Наименование</th>
      <th style="width:11%">Код</th>
      <th style="width:7%">Ед.</th>
      <th style="width:9%">Кол-во</th>
      <th style="width:12%">Цена, ₸</th>
      <th style="width:13%">Сумма, ₸</th>
    </tr></thead>
    <tbody>
      ${rows.map((r) => `<tr>
        <td class="center">${r.idx}</td>
        <td>${escape(r.desc)}</td>
        <td class="center">${escape(r.sku)}</td>
        <td class="center">${escape(r.unit)}</td>
        <td class="num">${fmtQty(r.qty)}</td>
        <td class="num">${fmtAmount(r.price)}</td>
        <td class="num">${fmtAmount(r.sum)}</td>
      </tr>`).join("")}
    </tbody>
    <tfoot>
      <tr><td colspan="6" class="num">Итого:</td><td class="num">${fmtAmount(total)}</td></tr>
      <tr><td colspan="6" class="num">В том числе НДС (${vatRate}%):</td><td class="num">${fmtAmount(vat)}</td></tr>
    </tfoot>
  </table>

  <div class="totals-words">Всего наименований ${rows.length}, на сумму <span class="value">${fmtAmount(total)} ₸</span></div>
  <div class="totals-words">Всего к оплате: <span class="value">${escape(tengeInWords(total))}</span></div>

  <div class="signs">
    <div class="sign-row">
      <span class="sign-label">Руководитель</span>
      <span class="sign-line">${org.signatureUrl ? `<img class="sign-img" src="${escape(org.signatureUrl)}" alt="">` : ""}${org.stampUrl ? `<img class="stamp" src="${escape(org.stampUrl)}" alt="">` : ""}</span>
      <span class="sign-sep">/</span>
      <span class="sign-name">${escape(org.directorName || "")}</span>
    </div>
    <div class="sign-sub">подпись &nbsp;&nbsp; расшифровка подписи</div>
    <div class="sign-row">
      <span class="sign-label">Главный бухгалтер</span>
      <span class="sign-line"></span>
      <span class="sign-sep">/</span>
      <span class="sign-name">${escape(org.accountantName || "")}</span>
    </div>
    <div class="sign-sub">подпись &nbsp;&nbsp; расшифровка подписи</div>
    <div class="mp">М.П.</div>
  </div>
  ${AUTO_PRINT}
</body></html>`;

  openPrintWindow(html);
}

// =============================================================================
// 2) Реализация товаров и услуг (накладная)
// =============================================================================
export function printOrderRealization({ deal, items, contact }) {
  if (!deal) { alert("Сделка не найдена."); return; }
  items = Array.isArray(items) ? items : [];
  if (!items.length) { alert("В заказе нет позиций — реализацию печатать нечего."); return; }
  const org = resolveSenderOrg(items);
  if (!org) { alert("Не настроена организация. Зайди в Настройки → Организации."); return; }

  const rows = buildRows(items);
  const total = rows.reduce((s, r) => s + r.sum, 0);
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const vatRate = Number(org.vatRate) || 12;
  const vatFactor = vatRate > 0 ? vatRate / (100 + vatRate) : 0;
  rows.forEach((r) => { r.vat = +(r.sum * vatFactor).toFixed(2); });
  const totalVat = +rows.reduce((s, r) => s + r.vat, 0).toFixed(2);

  const number = deal.oneCRealizationNumber || deal.orderInvoiceNumber || `Р-${String(deal.id || "").slice(-6)}`;
  const date = fmtDate(deal.orderShippedAt || Date.now());

  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<title>Реализация № ${escape(number)}</title>
<style>${SHARED_STYLE}</style></head><body>
  <button type="button" class="print-btn" onclick="window.print()">🖨 Печать</button>

  <h2 class="doc-title">РЕАЛИЗАЦИЯ ТОВАРОВ И УСЛУГ (накладная)<br>№ ${escape(number)} от ${escape(date)}</h2>

  <div class="doc-party"><span class="label">Поставщик:</span> <span class="value">${escape(org.fullName || org.shortName || "")}</span>, БИН ${escape(org.bin || "—")}${org.address ? `, ${escape(org.address)}` : ""}</div>
  <div class="doc-party"><span class="label">Покупатель:</span> <span class="value">${escape(buyerText(deal, contact))}</span>${buyerBin(contact) ? `, БИН ${escape(buyerBin(contact))}` : ""}</div>

  <table class="tbl">
    <thead><tr>
      <th style="width:4%">№</th>
      <th>Наименование, характеристика</th>
      <th style="width:10%">Код</th>
      <th style="width:6%">Ед.</th>
      <th style="width:9%">Кол-во</th>
      <th style="width:11%">Цена, ₸</th>
      <th style="width:12%">Сумма с НДС, ₸</th>
      <th style="width:11%">в т.ч. НДС, ₸</th>
    </tr></thead>
    <tbody>
      ${rows.map((r) => `<tr>
        <td class="center">${r.idx}</td>
        <td>${escape(r.desc)}</td>
        <td class="center">${escape(r.sku)}</td>
        <td class="center">${escape(r.unit)}</td>
        <td class="num">${fmtQty(r.qty)}</td>
        <td class="num">${fmtAmount(r.price)}</td>
        <td class="num">${fmtAmount(r.sum)}</td>
        <td class="num">${fmtAmount(r.vat)}</td>
      </tr>`).join("")}
    </tbody>
    <tfoot>
      <tr><td colspan="4" class="center">Итого</td>
          <td class="num">${fmtQty(totalQty)}</td>
          <td class="center">х</td>
          <td class="num">${fmtAmount(total)}</td>
          <td class="num">${fmtAmount(totalVat)}</td></tr>
    </tfoot>
  </table>

  <div class="totals-words">Всего наименований ${rows.length}, количество ${fmtQty(totalQty)}</div>
  <div class="totals-words">на сумму: <span class="value">${escape(tengeInWords(total))}</span></div>

  <div class="signs">
    <div class="sign-row">
      <span class="sign-label">Отпустил</span>
      <span class="sign-line">${org.signatureUrl ? `<img class="sign-img" src="${escape(org.signatureUrl)}" alt="">` : ""}${org.stampUrl ? `<img class="stamp" src="${escape(org.stampUrl)}" alt="">` : ""}</span>
      <span class="sign-sep">/</span>
      <span class="sign-name">${escape(org.molName || org.directorName || "")}</span>
    </div>
    <div class="sign-sub">подпись &nbsp;&nbsp; расшифровка подписи</div>
    <div class="sign-row">
      <span class="sign-label">Главный бухгалтер</span>
      <span class="sign-line"></span>
      <span class="sign-sep">/</span>
      <span class="sign-name">${escape(org.accountantName || "")}</span>
    </div>
    <div class="sign-sub">подпись &nbsp;&nbsp; расшифровка подписи</div>
    <div class="mp">М.П.</div>
    <div class="sign-row" style="margin-top:18px">
      <span class="sign-label">Получил</span>
      <span class="sign-line"></span>
      <span class="sign-sep">/</span>
      <span class="sign-line"></span>
    </div>
    <div class="sign-sub">подпись &nbsp;&nbsp; расшифровка подписи</div>
  </div>
  ${AUTO_PRINT}
</body></html>`;

  openPrintWindow(html);
}
