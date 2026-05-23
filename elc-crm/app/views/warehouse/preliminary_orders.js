// Pllato CRM — Предварительные заказы на складе.
// Это сделки в статусе orderStatus="preliminary" со своими позициями (deal_items).
// Списания не происходят — товары только зарезервированы для будущего согласования.

import { ICONS } from "../../icons.js";
import { Store } from "../../store.js";
import { listPreliminaryDealOrders, listDealItems, dealItemsTotal, recallDealOrder } from "../../deal_items.js";
import { productSummary, getWarehouseProduct } from "../../warehouse.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(s) { return escapeHtml(s); }

function fmtNum(n) {
  return new Intl.NumberFormat("ru-RU").format(Number(n) || 0);
}

function fmtDateTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function getContactName(contactId) {
  if (!contactId) return "—";
  const c = Store.get("contacts", contactId);
  if (!c) return "—";
  return c.name || c.company || c.email || "—";
}

function getManagerName(employeeId) {
  if (!employeeId) return "—";
  const emp = Store.get("employees", employeeId);
  return emp?.name || emp?.email || "—";
}

function renderOrderDetailItems(dealId) {
  const items = listDealItems(dealId);
  if (items.length === 0) return `<div class="po-detail-empty">Позиции отсутствуют</div>`;

  return `
    <table class="po-items-table">
      <thead>
        <tr>
          <th>SKU</th>
          <th>Товар</th>
          <th class="num">Кол-во</th>
          <th class="num">Остаток</th>
          <th class="num">Цена, ₸</th>
          <th class="num">Сумма, ₸</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item) => {
          const stock = item.productId ? (productSummary(item.productId)?.total || 0) : 0;
          const shortage = item.qty > stock && item.productId;
          return `
            <tr>
              <td>${escapeHtml(item.productSku || "—")}</td>
              <td>${escapeHtml(item.productName || "—")}</td>
              <td class="num">${fmtNum(item.qty)} ${escapeHtml(item.unit || "шт")}</td>
              <td class="num ${shortage ? "stock-low" : ""}">${fmtNum(stock)}</td>
              <td class="num">${fmtNum(item.unitPrice)}</td>
              <td class="num"><strong>${fmtNum(item.lineAmount)}</strong></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

export function renderPreliminaryOrdersView() {
  const orders = listPreliminaryDealOrders();

  return `
    <section class="whm-section po-view">
      <div class="po-header">
        <h2>Предварительные заказы</h2>
        <div class="po-meta">Всего: <strong>${orders.length}</strong></div>
      </div>

      ${orders.length === 0 ? `
        <div class="po-empty">
          <div class="po-empty-icon">📦</div>
          <div class="po-empty-title">Нет предварительных заказов</div>
          <div class="po-empty-text">Заказы появляются здесь когда менеджер нажимает «Сформировать заказ» в карточке сделки.</div>
        </div>
      ` : `
        <div class="po-list">
          ${orders.map((deal) => {
            const items = listDealItems(deal.id);
            const total = dealItemsTotal(deal.id);
            const hasShortage = items.some((it) => {
              if (!it.productId) return false;
              const stock = productSummary(it.productId)?.total || 0;
              return it.qty > stock;
            });
            return `
              <div class="po-card ${hasShortage ? "has-shortage" : ""}" data-deal-id="${escapeAttr(deal.id)}">
                <div class="po-card-head">
                  <div class="po-card-title">
                    <a href="#crm/${escapeAttr(deal.id)}" class="po-deal-link">
                      ${escapeHtml(deal.title || "Без названия")}
                    </a>
                    <div class="po-card-sub">
                      Контакт: ${escapeHtml(getContactName(deal.contactId))} ·
                      Менеджер: ${escapeHtml(getManagerName(deal.assigneeId))}
                    </div>
                  </div>
                  <div class="po-card-meta">
                    <div class="po-card-total">${fmtNum(total)} ₸</div>
                    <div class="po-card-date">Отправлен: ${fmtDateTime(deal.orderSubmittedAt)}</div>
                    ${deal.orderSubmittedByName ? `<div class="po-card-by">от ${escapeHtml(deal.orderSubmittedByName)}</div>` : ""}
                  </div>
                </div>
                <details class="po-card-details">
                  <summary>
                    ${items.length} ${items.length === 1 ? "позиция" : (items.length >= 2 && items.length <= 4 ? "позиции" : "позиций")}
                    ${hasShortage ? `<span class="po-warning-tag">⚠ Не хватает на складе</span>` : ""}
                  </summary>
                  <div class="po-card-body">
                    ${renderOrderDetailItems(deal.id)}
                  </div>
                </details>
              </div>
            `;
          }).join("")}
        </div>
      `}
    </section>
  `;
}

export function wirePreliminaryOrdersEvents(container) {
  // Здесь пока нет действий — drill-down работает через нативный <details>.
  // На следующем этапе добавим кнопки "Согласовать" → создание warehouse_document.
}
