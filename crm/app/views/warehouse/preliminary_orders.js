// Pllato CRM — Предварительные заказы на складе.
// Это сделки в статусе orderStatus="preliminary" со своими позициями (deal_items).
// Списания не происходят — товары только зарезервированы для будущего согласования.

import { ICONS } from "../../icons.js";
import { Store } from "../../store.js";
import { listPreliminaryDealOrders, listApprovedDealOrders, listShippedDealOrders, listPaymentPendingDealOrders, listDealItems, dealItemsTotal, recallDealOrder, approveDealOrder, revokeDealOrderApproval, markDealOrderShipped, markDealOrderAwaitingPayment, confirmDealOrderPayment } from "../../deal_items.js";
import { productSummary, getWarehouseProduct, createInvoiceFromDeal } from "../../warehouse.js";

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

function hasShortage(items) {
  return items.some((it) => {
    if (!it.productId) return false;
    const stock = productSummary(it.productId)?.total || 0;
    return it.qty > stock;
  });
}

function renderOrderCard(deal, kind) {
  const items = listDealItems(deal.id);
  const total = dealItemsTotal(deal.id);
  const shortage = hasShortage(items);
  const positionsLabel = `${items.length} ${items.length === 1 ? "позиция" : (items.length >= 2 && items.length <= 4 ? "позиции" : "позиций")}`;
  return `
    <div class="po-card ${shortage ? "has-shortage" : ""} ${kind === "approved" ? "is-approved" : ""} ${kind === "awaiting_payment" ? "is-awaiting-payment" : ""} ${kind === "shipped" ? "is-shipped" : ""}" data-deal-id="${escapeAttr(deal.id)}">
      <div class="po-card-head">
        <div class="po-card-title">
          <a href="#crm/${escapeAttr(deal.id)}" class="po-deal-link">
            ${escapeHtml(deal.title || "Без названия")}
          </a>
          <div class="po-card-sub">
            Контакт: ${escapeHtml(getContactName(deal.contactId))} · Менеджер: ${escapeHtml(getManagerName(deal.assigneeId))}
          </div>
        </div>
        <div class="po-card-meta">
          <div class="po-card-total">${fmtNum(total)} ₸</div>
          ${kind === "preliminary"
            ? `<div class="po-card-date">Отправлен: ${fmtDateTime(deal.orderSubmittedAt)}</div>
               ${deal.orderSubmittedByName ? `<div class="po-card-by">от ${escapeHtml(deal.orderSubmittedByName)}</div>` : ""}`
            : kind === "approved"
            ? `<div class="po-card-date">Согласовано: ${fmtDateTime(deal.orderApprovedAt)}</div>
               ${deal.orderApprovedByName ? `<div class="po-card-by">${escapeHtml(deal.orderApprovedByName)}</div>` : ""}`
            : kind === "awaiting_payment"
            ? `<div class="po-card-date">Ждём оплату с ${fmtDateTime(deal.orderAwaitingPaymentAt)}</div>
               ${deal.orderInvoiceForPaymentNumber ? `<div class="po-card-by">счёт № ${escapeHtml(deal.orderInvoiceForPaymentNumber)}</div>` : ""}`
            : `<div class="po-card-date">Отгружено: ${fmtDateTime(deal.orderShippedAt)}</div>
               ${deal.orderInvoiceNumber ? `<div class="po-card-by">накладная № ${escapeHtml(deal.orderInvoiceNumber)}</div>` : ""}`
          }
        </div>
      </div>
      <details class="po-card-details">
        <summary>
          ${positionsLabel}
          ${shortage && kind !== "shipped" ? `<span class="po-warning-tag">⚠ Не хватает на складе</span>` : ""}
        </summary>
        <div class="po-card-body">
          ${renderOrderDetailItems(deal.id)}
          <div class="po-card-actions" style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
            ${kind === "preliminary"
              ? `<button type="button" class="btn-primary" data-po-approve="${escapeAttr(deal.id)}">✓ Согласовать на отгрузку</button>`
              : kind === "approved"
              ? `<button type="button" class="btn-ghost" data-po-revoke="${escapeAttr(deal.id)}">↶ Отозвать</button>
                 <button type="button" class="btn-ghost" data-po-onec-invoice="${escapeAttr(deal.id)}" title="Создать «Счёт на оплату покупателю» в 1С (черновик)">🧾 Счёт в 1С${deal.oneCInvoiceNumber ? " ✓" : ""}</button>
                 <button type="button" class="btn-ghost" data-po-await-payment="${escapeAttr(deal.id)}" title="Перевести в «Ждут оплату» (для 100% предоплаты)">⏳ Ждать оплату</button>
                 <button type="button" class="btn-primary" data-po-ship="${escapeAttr(deal.id)}" title="Заказ перейдёт в «Отгружены», сформируется расходная накладная З-2">📦 Отгрузить и сформировать накладную</button>`
              : kind === "awaiting_payment"
              ? `<button type="button" class="btn-ghost" data-po-cancel-await="${escapeAttr(deal.id)}" title="Вернуть в «Согласованы»">↶ Вернуть в согласованы</button>
                 <button type="button" class="btn-ghost" data-po-onec-invoice="${escapeAttr(deal.id)}" title="Создать «Счёт на оплату покупателю» в 1С (черновик)">🧾 Счёт в 1С${deal.oneCInvoiceNumber ? " ✓" : ""}</button>
                 <button type="button" class="btn-primary" data-po-confirm-payment="${escapeAttr(deal.id)}" title="Подтвердить получение оплаты">💰 Оплата получена</button>`
              : `<span class="po-shipped-label">✅ Отгружено${deal.orderInvoiceNumber ? ` · № ${escapeHtml(deal.orderInvoiceNumber)}` : ""}</span>
                 <button type="button" class="btn-ghost" data-po-onec-invoice="${escapeAttr(deal.id)}" title="Создать «Счёт на оплату покупателю» в 1С (черновик)">🧾 Счёт в 1С${deal.oneCInvoiceNumber ? " ✓" : ""}</button>
                 <button type="button" class="btn-ghost" data-po-onec-realization="${escapeAttr(deal.id)}" title="Создать «Реализацию товаров и услуг» в 1С (черновик)">📦 Реализация в 1С${deal.oneCRealizationNumber ? " ✓" : ""}</button>
                 ${deal.orderInvoiceId ? `<button type="button" class="btn-ghost" data-po-print="${escapeAttr(deal.orderInvoiceId)}" title="Открыть для печати/сохранения в PDF">📄 Открыть накладную</button>` : ""}`
            }
          </div>
        </div>
      </details>
    </div>
  `;
}

export function renderPreliminaryOrdersView() {
  const preliminary = listPreliminaryDealOrders();
  const approved = listApprovedDealOrders();
  const awaitingPayment = listPaymentPendingDealOrders();
  const shipped = listShippedDealOrders().slice(0, 20);

  // Колонку «Ожидание оплаты» показываем только если она реально используется
  // (есть заказы в статусе) — иначе канбан не перегружаем.
  const showPaymentCol = awaitingPayment.length > 0;

  return `
    <section class="whm-section po-view">
      <div class="po-header">
        <h2>Заказы со склада</h2>
        <div class="po-meta">
          Предварительные: <strong>${preliminary.length}</strong> ·
          Согласованы: <strong>${approved.length}</strong>
          ${showPaymentCol ? ` · Ждут оплату: <strong>${awaitingPayment.length}</strong>` : ""} ·
          Отгружены: <strong>${shipped.length}${listShippedDealOrders().length > 20 ? "+" : ""}</strong>
        </div>
      </div>

      <div class="po-kanban">
        <div class="po-col">
          <div class="po-col-head">
            <span class="po-col-dot" style="--col:#6366f1"></span>
            <span class="po-col-title">Предварительные заказы</span>
            <span class="po-col-count">${preliminary.length}</span>
          </div>
          <div class="po-col-body">
            ${preliminary.length === 0
              ? `<div class="po-empty"><div class="po-empty-icon">📦</div><div class="po-empty-text">Пусто. Заказы появятся когда менеджер нажмёт «Сформировать заказ» в сделке.</div></div>`
              : preliminary.map((d) => renderOrderCard(d, "preliminary")).join("")
            }
          </div>
        </div>

        <div class="po-col">
          <div class="po-col-head">
            <span class="po-col-dot" style="--col:#f59e0b"></span>
            <span class="po-col-title">Согласованы на отгрузку</span>
            <span class="po-col-count">${approved.length}</span>
          </div>
          <div class="po-col-body">
            ${approved.length === 0
              ? `<div class="po-empty"><div class="po-empty-icon">✅</div><div class="po-empty-text">Пусто. Нажми «✓ Согласовать на отгрузку» в карточке предзаказа, чтобы перевести сюда.</div></div>`
              : approved.map((d) => renderOrderCard(d, "approved")).join("")
            }
          </div>
        </div>

        ${showPaymentCol ? `
        <div class="po-col">
          <div class="po-col-head">
            <span class="po-col-dot" style="--col:#a855f7"></span>
            <span class="po-col-title">Ждут оплату</span>
            <span class="po-col-count">${awaitingPayment.length}</span>
          </div>
          <div class="po-col-body">
            ${awaitingPayment.map((d) => renderOrderCard(d, "awaiting_payment")).join("")}
          </div>
        </div>
        ` : ""}

        <div class="po-col">
          <div class="po-col-head">
            <span class="po-col-dot" style="--col:#16a34a"></span>
            <span class="po-col-title">Отгружены</span>
            <span class="po-col-count">${shipped.length}</span>
          </div>
          <div class="po-col-body">
            ${shipped.length === 0
              ? `<div class="po-empty"><div class="po-empty-icon">📤</div><div class="po-empty-text">Пусто. Сюда заказы попадают автоматически после формирования накладной из карточки сделки.</div></div>`
              : shipped.map((d) => renderOrderCard(d, "shipped")).join("")
            }
          </div>
        </div>
      </div>
    </section>
  `;
}

export function wirePreliminaryOrdersEvents(container) {
  if (!container || container.dataset.poWired === "1") return;
  container.dataset.poWired = "1";
  container.addEventListener("click", (e) => {
    const approveBtn = e.target.closest("[data-po-approve]");
    if (approveBtn) {
      e.preventDefault();
      const dealId = approveBtn.dataset.poApprove;
      try {
        approveDealOrder(dealId);
        // Триггерим re-render через смену hash (warehouse re-renders on hashchange).
        // Простой способ: вызвать window event, которое перерисует warehouse view.
        window.dispatchEvent(new CustomEvent("pllato:warehouse-refresh"));
      } catch (err) {
        alert(err?.message || String(err));
      }
      return;
    }
    const revokeBtn = e.target.closest("[data-po-revoke]");
    if (revokeBtn) {
      e.preventDefault();
      const dealId = revokeBtn.dataset.poRevoke;
      if (!confirm("Отозвать согласование? Заказ вернётся в «Предварительные».")) return;
      try {
        revokeDealOrderApproval(dealId);
        window.dispatchEvent(new CustomEvent("pllato:warehouse-refresh"));
      } catch (err) {
        alert(err?.message || String(err));
      }
      return;
    }
    const oneCBtn = e.target.closest("[data-po-onec-invoice], [data-po-onec-realization]");
    if (oneCBtn) {
      e.preventDefault();
      const isRealization = oneCBtn.hasAttribute("data-po-onec-realization");
      const dealId = isRealization ? oneCBtn.dataset.poOnecRealization : oneCBtn.dataset.poOnecInvoice;
      (async () => {
        try {
          const deal = Store.get("deals", dealId);
          if (!deal) return;
          const items = listDealItems(dealId);
          const contact = deal.contactId ? Store.get("contacts", deal.contactId) : null;
          const mod = await import("../../one_c_invoice.js");
          mod.openCreateOneCDocDialog({
            deal, items, contact,
            docType: isRealization ? "realization" : "invoice",
            onDone: () => window.dispatchEvent(new CustomEvent("pllato:warehouse-refresh")),
          });
        } catch (err) {
          alert("Не удалось открыть форму документа 1С: " + (err?.message || String(err)));
        }
      })();
      return;
    }
    const shipBtn = e.target.closest("[data-po-ship]");
    if (shipBtn) {
      e.preventDefault();
      const dealId = shipBtn.dataset.poShip;
      const deal = Store.get("deals", dealId);
      if (!deal) return;
      const items = listDealItems(dealId);
      if (items.length === 0) { alert("В заказе нет позиций."); return; }
      if (!confirm("Сформировать расходную накладную и закрыть заказ? Заказ перейдёт в «Отгружены».")) return;
      try {
        const contact = deal.contactId ? Store.get("contacts", deal.contactId) : null;
        const counterpartyText = contact?.name
          ? `${contact.name} · ${deal.title || ""}`
          : (deal.title || "");
        const result = createInvoiceFromDeal(dealId, {
          counterpartyContactId: deal.contactId || null,
          counterpartyText,
          items: items.map((i) => ({
            productId: i.productId,
            qty: Number(i.qty) || 0,
            unitPrice: Number(i.unitPrice) || 0,
          })),
          totalAmount: dealItemsTotal(dealId),
          note: `Накладная по сделке «${deal.title || ""}»`,
        });
        const { doc, posted, postError } = result;
        // Синхронно переводим заказ в «отгружен».
        markDealOrderShipped(dealId, { invoiceId: doc.id, invoiceNumber: doc.number });
        window.dispatchEvent(new CustomEvent("pllato:warehouse-refresh"));
        if (!posted) {
          alert(`⚠ Накладная № ${doc.number} создана как ЧЕРНОВИК — не удалось провести (FIFO-списание):\n\n${postError}\n\nОткрой документ и проведи вручную после докомплекта остатка.`);
        }
      } catch (err) {
        alert("Не удалось сформировать накладную: " + (err?.message || String(err)));
      }
      return;
    }
    // Перевод в стадию «Ожидание оплаты» (C.5)
    const awaitBtn = e.target.closest("[data-po-await-payment]");
    if (awaitBtn) {
      e.preventDefault();
      const dealId = awaitBtn.dataset.poAwaitPayment;
      const deal = Store.get("deals", dealId);
      if (!deal) return;
      const total = dealItemsTotal(dealId);
      const invNum = prompt(
        `Перевести в «Ждут оплату»?\n\nЕсли уже выставлен счёт — укажи его номер (необязательно).\nСумма по позициям: ${fmtNum(total)} ₸`,
        ""
      );
      if (invNum === null) return; // отмена
      try {
        markDealOrderAwaitingPayment(dealId, {
          invoiceNumber: invNum.trim(),
          amount: total,
        });
        window.dispatchEvent(new CustomEvent("pllato:warehouse-refresh"));
      } catch (err) {
        alert(err?.message || String(err));
      }
      return;
    }
    // Вернуть из «Ждут оплату» обратно в «Согласованы»
    const cancelAwaitBtn = e.target.closest("[data-po-cancel-await]");
    if (cancelAwaitBtn) {
      e.preventDefault();
      const dealId = cancelAwaitBtn.dataset.poCancelAwait;
      if (!confirm("Вернуть заказ в «Согласованы»? Статус «Ожидание оплаты» снимется.")) return;
      try {
        const deal = Store.get("deals", dealId);
        if (deal) {
          Store.update("deals", dealId, {
            orderStatus: "approved",
            orderAwaitingPaymentAt: null,
          });
          window.dispatchEvent(new CustomEvent("pllato:warehouse-refresh"));
        }
      } catch (err) {
        alert(err?.message || String(err));
      }
      return;
    }
    // Подтвердить оплату (C.6)
    const confirmPaymentBtn = e.target.closest("[data-po-confirm-payment]");
    if (confirmPaymentBtn) {
      e.preventDefault();
      const dealId = confirmPaymentBtn.dataset.poConfirmPayment;
      const deal = Store.get("deals", dealId);
      if (!deal) return;
      const expected = Number(deal.orderExpectedAmount) || dealItemsTotal(dealId);
      const amountStr = prompt(
        `Подтвердить получение оплаты от клиента.\n\nСумма (₸):`,
        String(expected)
      );
      if (amountStr === null) return; // отмена
      const amount = Number(amountStr.replace(/\s/g, "")) || 0;
      if (amount <= 0) { alert("Укажи корректную сумму"); return; }
      const note = prompt("Комментарий (необязательно):", "") || "";
      try {
        confirmDealOrderPayment(dealId, {
          amount,
          paidAt: new Date().toISOString().slice(0, 10),
          note,
        });
        window.dispatchEvent(new CustomEvent("pllato:warehouse-refresh"));
        alert(`✅ Оплата ${amount.toLocaleString("ru-RU")} ₸ зафиксирована. Заказ вернулся в «Согласованы» — теперь можно отгружать.`);
      } catch (err) {
        alert(err?.message || String(err));
      }
      return;
    }
    // Открыть/распечатать накладную для уже отгруженного заказа.
    const printBtn = e.target.closest("[data-po-print]");
    if (printBtn) {
      e.preventDefault();
      const docId = printBtn.dataset.poPrint;
      if (!docId) return;
      import("./invoice_print.js").then((mod) => {
        mod.printInvoiceZ2(docId);
      }).catch((err) => {
        alert("Не удалось открыть накладную: " + (err?.message || String(err)));
      });
    }
  });
}
