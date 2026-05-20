import { ICONS } from "../../icons.js";
import {
  getWarehouseProduct,
  listLotsForProduct,
  listGroupedMovementsByLot,
  productSummary,
  getWarehouseDocument,
} from "../../warehouse.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function num(v) {
  return new Intl.NumberFormat("ru-RU").format(Number(v) || 0);
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU");
}

function daysLeft(iso) {
  if (!iso) return Infinity;
  const d = new Date(`${iso}T00:00:00`).getTime();
  if (!Number.isFinite(d)) return Infinity;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((d - now.getTime()) / 86400000);
}

function renderLotHead(group) {
  const lot = group.lot || {};
  const left = daysLeft(lot.expiryDate);
  let badge = `<span class="chip">Активна</span>`;
  if ((lot.currentQty || 0) <= 0) badge = `<span class="chip chip-danger">Закрыта</span>`;
  else if (left < 0) badge = `<span class="chip chip-danger">Просрочена</span>`;
  else if (left <= 30) badge = `<span class="chip chip-warning">Истекает</span>`;

  return `
    <div class="whm-lot-head">
      <strong>LOT ${escapeHtml(lot.lotCode || "—")}</strong>
      <span>срок: ${escapeHtml(fmtDate(lot.expiryDate))}</span>
      <span>· остаток: <b>${num(lot.currentQty || 0)}</b></span>
      <div class="spacer"></div>
      ${badge}
    </div>
  `;
}

function renderMovementRow(row) {
  const doc = row.docId ? getWarehouseDocument(row.docId) : null;
  const docNo = doc?.number || "—";
  return `
    <tr class="${row.splitFromLineId ? "split-row" : ""}">
      <td>${escapeHtml(fmtDate(row.date))}</td>
      <td><button type="button" class="btn-link" data-wh-open-doc="${escapeAttr(row.docId || "")}" ${row.docId ? "" : "disabled"}>${escapeHtml(docNo)}</button></td>
      <td class="num ${row.direction === "in" ? "col-in" : "dim"}">${row.direction === "in" ? num(row.qty) : "—"}</td>
      <td class="num ${row.direction === "out" ? "col-out" : "dim"}">${row.direction === "out" ? num(row.qty) : "—"}</td>
      <td class="num col-bal">${num(row.balanceAfter || 0)}</td>
      <td class="dest-cell">${escapeHtml(row.counterpartyText || "—")}</td>
    </tr>
  `;
}

export function renderProductCardView(productId, canEdit) {
  const product = getWarehouseProduct(productId);
  if (!product) {
    return `
      <div class="placeholder whm-placeholder">
        <div class="placeholder-icon">${ICONS.package}</div>
        <h3>Товар не найден</h3>
        <p>Выбери товар из каталога.</p>
        <a class="btn-ghost" href="#warehouse/products">Назад к каталогу</a>
      </div>
    `;
  }

  const summary = productSummary(productId);
  const lots = listLotsForProduct(productId, { activeOnly: false });
  const grouped = listGroupedMovementsByLot(productId);

  return `
    <section class="whm-section">
      <div class="product-head whm-product-head">
        <div>
          <div class="product-title-row">
            <span class="product-name">${escapeHtml(product.name)}</span>
            <span class="chip mono">${escapeHtml(product.sku)}</span>
            <span class="chip chip-accent">${escapeHtml(product.entity || "—")}</span>
          </div>
          <div class="product-meta">
            <span>Категория: <strong>${escapeHtml(product.category || "—")}</strong></span>
            <span>Фасовка: <strong>${escapeHtml(product.pack || "—")}</strong></span>
            <span>Ед.: <strong>${escapeHtml(product.unit || "шт")}</strong></span>
          </div>
          <div class="product-actions">
            <button type="button" class="btn" data-wh-new-doc="receipt" ${canEdit ? "" : "disabled"}>${ICONS.truckIn}<span>Приход</span></button>
            <button type="button" class="btn-ghost" data-wh-new-doc="sale_invoice" ${canEdit ? "" : "disabled"}>${ICONS.truckOut}<span>Расход</span></button>
            <button type="button" class="btn-ghost" data-wh-new-doc="writeoff_act" ${canEdit ? "" : "disabled"}>${ICONS.alertTriangle}<span>Списать</span></button>
            <a class="btn-ghost" href="#warehouse/products">Назад</a>
          </div>
        </div>
        <div class="product-kpis">
          <div class="product-kpi"><div class="product-kpi-label">Общий остаток</div><div class="product-kpi-value">${num(summary.total)}</div></div>
          <div class="product-kpi"><div class="product-kpi-label">Партий с остатком</div><div class="product-kpi-value">${num(summary.activeLots)}</div></div>
          <div class="product-kpi"><div class="product-kpi-label">Всего LOT</div><div class="product-kpi-value">${num(lots.length)}</div></div>
        </div>
      </div>

      <div class="whm-card movements-card">
        ${grouped.length ? grouped.map((group) => `
          ${renderLotHead(group)}
          <table class="mov-table">
            <thead>
              <tr><th>Дата</th><th>№ документа</th><th class="num">Приход</th><th class="num">Расход</th><th class="num">Остаток</th><th>Куда</th></tr>
            </thead>
            <tbody>
              ${group.rows.map((row) => renderMovementRow(row)).join("")}
            </tbody>
          </table>
        `).join("") : `<div class="whm-empty">По товару пока нет движений.</div>`}
      </div>
    </section>
  `;
}
