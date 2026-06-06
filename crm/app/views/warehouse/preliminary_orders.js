// Pllato CRM — Заказы со склада (Block 4: бронь + счёт + логика по схеме оплаты).
//
// Доска (orderStatus → колонка):
//   preliminary                  — Предварительные (менеджер сформировал заказ)
//   reserved + payment_pending   — Бронь · ждём оплату (одна колонка): бронь на
//                                  складе + счёт, ждём деньги. Сюда попадает только
//                                  предоплата.
//   approved                     — Согласованы на отгрузку (накладная готова)
//   shipped                      — Отгружены (накладная проведена, товар списан)
//   archived                     — Архив (после проведения «Реализации в 1С»)
//
// Логика по схеме оплаты при «✓ Согласовать заказ»:
//   • предоплата           → «Бронь · ждём оплату» (ждём поступления денег)
//   • постоплата/консигнация → оплату не ждём: сразу формируется накладная и
//                              заказ уходит в «Согласованы на отгрузку».
//
// Списание со склада (FIFO/партия) происходит ТОЛЬКО при «Отгружено по
// накладной». До этого товар держится бронью.

import { Store } from "../../store.js";
import {
  listPreliminaryDealOrders, listReservedDealOrders, listApprovedDealOrders,
  listShippedDealOrders, listPaymentPendingDealOrders, listArchivedDealOrders,
  listDealItems, dealItemsTotal,
  approveDealOrder, revokeDealOrderApproval,
  markDealOrderAwaitingPayment, confirmDealOrderPayment,
  formAndApproveWaybill, shipOrderByWaybill, setOrderReservationExpiry,
  archiveDealOrder, unarchiveDealOrder,
  getOrderPaymentScheme,
} from "../../deal_items.js";
import { productSummary } from "../../warehouse.js";

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

// ISO YYYY-MM-DD → DD.MM.YYYY
function fmtDmy(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
}
function isExpiredIso(iso) {
  const s = String(iso || "").slice(0, 10);
  return s && s < new Date().toISOString().slice(0, 10);
}
function schemeLabel(s) {
  return s === "postpay" ? "постоплата" : s === "consignment" ? "консигнация" : "100% предоплата";
}

// Склонение «день/дня/дней» по числу.
function pluralDays(n) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return "дней";
  if (b > 1 && b < 5) return "дня";
  if (b === 1) return "день";
  return "дней";
}

// Сколько полных дней прошло с момента ts (timestamp ms). null → 0.
function daysSince(ts) {
  if (!ts) return 0;
  const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  return Math.max(0, Math.round((startOfDay(Date.now()) - startOfDay(ts)) / 86400000));
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
    <div class="po-items">
      ${items.map((item) => {
        const stock = item.productId ? (productSummary(item.productId)?.total || 0) : 0;
        const shortage = item.qty > stock && item.productId;
        return `
          <div class="po-item">
            <div class="po-item-info">
              <div class="po-item-name">${escapeHtml(item.productName || "—")}</div>
              <div class="po-item-meta">
                <span class="po-item-sku">${escapeHtml(item.productSku || "—")}</span>
                <span class="po-item-qty${shortage ? " is-short" : ""}">${fmtNum(item.qty)} ${escapeHtml(item.unit || "шт")}${shortage ? ` · на складе ${fmtNum(stock)}` : ""}</span>
                ${item.lotId ? `<span class="po-item-lot" style="color:#0369a1">🏷 партия № ${escapeHtml(item.lotCode || "—")}</span>` : ""}
              </div>
            </div>
            <div class="po-item-sum">${fmtNum(item.lineAmount)} ₸</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function hasShortage(items) {
  return items.some((it) => {
    if (!it.productId) return false;
    const stock = productSummary(it.productId)?.total || 0;
    return it.qty > stock;
  });
}

// Срок брони/счёта с возможностью корректировки (стадии reserved/payment_pending).
function renderExpiryEditor(deal) {
  const exp = deal.reservationExpiresAt || "";
  const expired = isExpiredIso(exp);
  return `
    <div class="po-resv" style="display:flex;align-items:center;gap:6px;margin:6px 0;font-size:12px;flex-wrap:wrap">
      <span style="color:var(--text-muted,#888)">Бронь${getOrderPaymentScheme(deal) === "prepay" ? " и счёт" : ""} до:</span>
      <input type="date" value="${escapeAttr(exp)}" data-po-resv-date="${escapeAttr(deal.id)}"
        style="padding:3px 6px;border:1px solid var(--border,#d8d8d8);border-radius:6px;font:inherit;font-size:12px;background:var(--surface,#fff);color:${expired ? "#dc2626" : "var(--text,#111)"}">
      ${expired ? `<span style="color:#dc2626">⚠ просрочена</span>` : ""}
    </div>`;
}

function renderOrderCard(deal, kind) {
  const items = listDealItems(deal.id);
  const total = dealItemsTotal(deal.id);
  const shortage = hasShortage(items);
  const scheme = getOrderPaymentScheme(deal);
  const positionsLabel = `${items.length} ${items.length === 1 ? "позиция" : (items.length >= 2 && items.length <= 4 ? "позиции" : "позиций")}`;

  // Индикатор залежавшихся заказов: «Согласовано на отгрузку», но не отгружено.
  // Жёлтая отметка с 1-го дня, красная подсветка карточки с 2-го дня.
  const agingDays = kind === "approved" ? daysSince(deal.orderApprovedAt) : 0;
  const isAging = kind === "approved" && agingDays >= 1;
  const isStale = kind === "approved" && agingDays >= 2;

  // Метаданные по стадии (правый верхний угол).
  let metaHtml = "";
  if (kind === "preliminary") {
    metaHtml = `<div class="po-card-date">Отправлен: ${fmtDateTime(deal.orderSubmittedAt)}</div>
                ${deal.orderSubmittedByName ? `<div class="po-card-by">от ${escapeHtml(deal.orderSubmittedByName)}</div>` : ""}`;
  } else if (kind === "reserved") {
    metaHtml = `<div class="po-card-date">Бронь: ${fmtDateTime(deal.orderReservedAt)}</div>
                <div class="po-card-by">${escapeHtml(schemeLabel(scheme))}</div>`;
  } else if (kind === "payment_pending") {
    metaHtml = `<div class="po-card-date">Ждём оплату с ${fmtDateTime(deal.orderAwaitingPaymentAt)}</div>
                ${deal.orderInvoiceForPaymentNumber ? `<div class="po-card-by">счёт ${escapeHtml(deal.orderInvoiceForPaymentNumber)}</div>` : ""}`;
  } else if (kind === "approved") {
    const agingBadge = isAging
      ? `<div class="po-aging-badge${isStale ? " is-stale" : ""}" title="Накладная готова, но заказ ещё не отгружен">${isStale ? "⚠ " : "⏳ "}висит ${agingDays} ${pluralDays(agingDays)}</div>`
      : "";
    metaHtml = `<div class="po-card-date">Согласовано: ${fmtDateTime(deal.orderApprovedAt)}</div>
                ${deal.orderInvoiceNumber ? `<div class="po-card-by">накладная № ${escapeHtml(deal.orderInvoiceNumber)}</div>` : ""}
                ${agingBadge}`;
  } else if (kind === "archived") {
    metaHtml = `<div class="po-card-date">В архиве: ${fmtDateTime(deal.orderArchivedAt)}</div>
                ${deal.oneCRealizationNumber ? `<div class="po-card-by">реализация № ${escapeHtml(deal.oneCRealizationNumber)}</div>` : (deal.orderInvoiceNumber ? `<div class="po-card-by">накладная № ${escapeHtml(deal.orderInvoiceNumber)}</div>` : "")}`;
  } else {
    metaHtml = `<div class="po-card-date">Отгружено: ${fmtDateTime(deal.orderShippedAt)}</div>
                ${deal.orderInvoiceNumber ? `<div class="po-card-by">накладная № ${escapeHtml(deal.orderInvoiceNumber)}</div>` : ""}`;
  }

  // Кнопки действий по стадии.
  let actionsHtml = "";
  if (kind === "preliminary") {
    actionsHtml = `<button type="button" class="btn-primary" data-po-approve="${escapeAttr(deal.id)}" title="${scheme === "prepay" ? "Забронировать товар и выставить счёт; заказ перейдёт в «Бронь · ждём оплату»" : "Постоплата/консигнация — оплату не ждём: сразу формируется накладная, заказ перейдёт в «Согласованы на отгрузку»"}">✓ Согласовать заказ${scheme === "prepay" ? " (бронь)" : ""}</button>`;
  } else if (kind === "reserved") {
    // Легаси/возврат: бронь без выставленного счёта. Для предоплаты — выставить
    // счёт и ждать оплату (в той же колонке); для постоплаты — сформировать накладную.
    if (scheme === "prepay") {
      actionsHtml = `
        <button type="button" class="btn-ghost" data-po-onec-invoice="${escapeAttr(deal.id)}" title="Создать «Счёт на оплату покупателю» в 1С (черновик)">🧾 Счёт в 1С${deal.oneCInvoiceNumber ? " ✓" : ""}</button>
        <button type="button" class="btn-primary" data-po-await-payment="${escapeAttr(deal.id)}" title="Счёт выставлен клиенту — ждём оплату">⏳ Ждать оплату</button>
        <button type="button" class="btn-ghost" data-po-revoke="${escapeAttr(deal.id)}" title="Снять бронь и вернуть в «Предварительные»">↶ Отозвать</button>`;
    } else {
      actionsHtml = `
        <button type="button" class="btn-primary" data-po-form-waybill="${escapeAttr(deal.id)}" title="Сформировать и согласовать накладную (без списания). Заказ перейдёт в «Согласованы на отгрузку»">🧾 Сформировать накладную</button>
        <button type="button" class="btn-ghost" data-po-revoke="${escapeAttr(deal.id)}" title="Снять бронь и вернуть в «Предварительные»">↶ Отозвать</button>`;
    }
  } else if (kind === "payment_pending") {
    actionsHtml = `
      <button type="button" class="btn-ghost" data-po-onec-invoice="${escapeAttr(deal.id)}" title="Создать «Счёт на оплату покупателю» в 1С (черновик)">🧾 Счёт в 1С${deal.oneCInvoiceNumber ? " ✓" : ""}</button>
      <button type="button" class="btn-ghost" data-po-revoke="${escapeAttr(deal.id)}" title="Снять бронь и вернуть в «Предварительные»">↶ Отозвать</button>
      <button type="button" class="btn-primary" data-po-confirm-payment="${escapeAttr(deal.id)}" title="Оплата получена → сформируется накладная, заказ перейдёт в «Согласованы»">💰 Оплата получена</button>`;
  } else if (kind === "approved") {
    actionsHtml = `
      ${deal.orderInvoiceId ? `<button type="button" class="btn-ghost" data-po-print="${escapeAttr(deal.orderInvoiceId)}" title="Открыть накладную для печати/PDF">📄 Накладная</button>` : ""}
      <button type="button" class="btn-ghost" data-po-revoke="${escapeAttr(deal.id)}" title="Снять бронь и вернуть в «Предварительные»">↶ Отозвать</button>
      <button type="button" class="btn-primary" data-po-ship="${escapeAttr(deal.id)}" title="Списать товар со склада (FIFO/партия) и закрыть заказ">📦 Отгружено по накладной</button>`;
  } else if (kind === "archived") {
    actionsHtml = `
      <span class="po-shipped-label">📁 В архиве${deal.oneCRealizationNumber ? ` · реализация № ${escapeHtml(deal.oneCRealizationNumber)}` : ""}</span>
      ${deal.orderInvoiceId ? `<button type="button" class="btn-ghost" data-po-print="${escapeAttr(deal.orderInvoiceId)}" title="Открыть для печати/сохранения в PDF">📄 Открыть накладную</button>` : ""}
      <button type="button" class="btn-ghost" data-po-unarchive="${escapeAttr(deal.id)}" title="Вернуть заказ в «Отгружены»">↩ Из архива</button>`;
  } else {
    // shipped: после проведения «Реализации в 1С» появляется кнопка «В архив».
    actionsHtml = `
      <span class="po-shipped-label">✅ Отгружено${deal.orderInvoiceNumber ? ` · № ${escapeHtml(deal.orderInvoiceNumber)}` : ""}</span>
      <button type="button" class="btn-ghost" data-po-onec-invoice="${escapeAttr(deal.id)}" title="Создать «Счёт на оплату покупателю» в 1С (черновик)">🧾 Счёт в 1С${deal.oneCInvoiceNumber ? " ✓" : ""}</button>
      <button type="button" class="btn-ghost" data-po-onec-realization="${escapeAttr(deal.id)}" title="Создать «Реализацию товаров и услуг» в 1С (черновик)">📦 Реализация в 1С${deal.oneCRealizationNumber ? " ✓" : ""}</button>
      ${deal.orderInvoiceId ? `<button type="button" class="btn-ghost" data-po-print="${escapeAttr(deal.orderInvoiceId)}" title="Открыть для печати/сохранения в PDF">📄 Открыть накладную</button>` : ""}
      ${deal.oneCRealizationNumber ? `<button type="button" class="btn-primary" data-po-archive="${escapeAttr(deal.id)}" title="Реализация в 1С проведена — отправить заказ в архив">📁 В архив</button>` : ""}`;
  }

  // Срок брони (редактор) на стадиях reserved/payment_pending.
  const expiryHtml = (kind === "reserved" || kind === "payment_pending") ? renderExpiryEditor(deal) : "";

  return `
    <div class="po-card ${shortage ? "has-shortage" : ""} ${kind === "approved" ? "is-approved" : ""} ${isStale ? "is-stale" : ""} ${kind === "reserved" ? "is-reserved" : ""} ${kind === "payment_pending" ? "is-awaiting-payment" : ""} ${kind === "shipped" ? "is-shipped" : ""} ${kind === "archived" ? "is-archived" : ""}" data-deal-id="${escapeAttr(deal.id)}">
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
          ${metaHtml}
        </div>
      </div>
      ${expiryHtml}
      <details class="po-card-details" open>
        <summary>
          ${positionsLabel}
          ${shortage && kind !== "shipped" ? `<span class="po-warning-tag">⚠ Не хватает на складе</span>` : ""}
        </summary>
        <div class="po-card-body">
          ${renderOrderDetailItems(deal.id)}
        </div>
      </details>
      <div class="po-card-actions">
        <button type="button" class="btn-ghost po-act-open" data-po-open="${escapeAttr(deal.id)}" title="Открыть заказ: реквизиты 1С, договор, адрес, партии, согласование — в одном окне">📋 Открыть заказ</button>
        ${actionsHtml}
      </div>
    </div>
  `;
}

// kind может быть строкой (одна стадия на колонку) или функцией (deal) => kind,
// если в одной колонке смешаны статусы (например, «Бронь · ждём оплату»).
function renderColumn(title, dot, list, kind, emptyText) {
  const kindOf = typeof kind === "function" ? kind : () => kind;
  return `
    <div class="po-col">
      <div class="po-col-head">
        <span class="po-col-dot" style="--col:${dot}"></span>
        <span class="po-col-title">${title}</span>
        <span class="po-col-count">${list.length}</span>
      </div>
      <div class="po-col-body">
        ${list.length === 0
          ? `<div class="po-empty"><div class="po-empty-text">${emptyText}</div></div>`
          : list.map((d) => renderOrderCard(d, kindOf(d))).join("")
        }
      </div>
    </div>`;
}

export function renderPreliminaryOrdersView() {
  const preliminary = listPreliminaryDealOrders();
  const reserved = listReservedDealOrders();
  const awaitingPayment = listPaymentPendingDealOrders();
  // «Бронь · ждём оплату» — одна колонка: предоплата (ждут оплату) + легаси-бронь.
  const waitingPay = [...awaitingPayment, ...reserved]
    .sort((a, b) => (b.orderAwaitingPaymentAt || b.orderReservedAt || 0) - (a.orderAwaitingPaymentAt || a.orderReservedAt || 0));
  const approved = listApprovedDealOrders();
  const shippedAll = listShippedDealOrders();
  const shipped = shippedAll.slice(0, 20);
  const archivedAll = listArchivedDealOrders();
  const archived = archivedAll.slice(0, 20);

  return `
    <section class="whm-section po-view">
      <div class="po-header">
        <h2>Заказы со склада</h2>
        <div class="po-meta">
          Предварительные: <strong>${preliminary.length}</strong> ·
          Бронь · ждём оплату: <strong>${waitingPay.length}</strong> ·
          Согласованы: <strong>${approved.length}</strong> ·
          Отгружены: <strong>${shipped.length}${shippedAll.length > 20 ? "+" : ""}</strong> ·
          Архив: <strong>${archived.length}${archivedAll.length > 20 ? "+" : ""}</strong>
        </div>
      </div>

      <div class="po-kanban">
        ${renderColumn("Предварительные заказы", "#6366f1", preliminary, "preliminary",
          "Пусто. Заказы появятся когда менеджер нажмёт «Сформировать заказ» в сделке.")}
        ${renderColumn("Бронь · ждём оплату", "#a855f7", waitingPay,
          (d) => d.orderStatus === "payment_pending" ? "payment_pending" : "reserved",
          "Пусто. Сюда попадает предоплата после «✓ Согласовать заказ»: товар забронирован, счёт выставлен — ждём деньги. Постоплата/консигнация эту колонку минуют.")}
        ${renderColumn("Согласованы на отгрузку", "#f59e0b", approved, "approved",
          "Пусто. Сюда попадают после оплаты (предоплата) или сразу после согласования (постоплата/консигнация) — накладная сформирована.")}
        ${renderColumn("Отгружены", "#16a34a", shipped, "shipped",
          "Пусто. Заказы попадают сюда после «📦 Отгружено по накладной».")}
        ${renderColumn("Архив", "#64748b", archived, "archived",
          "Пусто. Заказы уходят сюда после «📁 В архив» (когда проведена «Реализация в 1С»).")}
      </div>
    </section>
  `;
}

export function wirePreliminaryOrdersEvents(container) {
  if (!container || container.dataset.poWired === "1") return;
  container.dataset.poWired = "1";

  const refresh = () => window.dispatchEvent(new CustomEvent("pllato:warehouse-refresh"));

  // Срок брони/счёта — корректировка даты (не всплывает к click-делегату ниже).
  container.addEventListener("change", (e) => {
    const dateEl = e.target.closest("[data-po-resv-date]");
    if (!dateEl) return;
    const dealId = dateEl.dataset.poResvDate;
    const val = dateEl.value || "";
    if (!val) return;
    try {
      setOrderReservationExpiry(dealId, val);
      refresh();
    } catch (err) {
      alert(err?.message || String(err));
    }
  });

  container.addEventListener("click", (e) => {
    // Открыть единое окно заказа (полный жизненный цикл + реквизиты 1С).
    const openBtn = e.target.closest("[data-po-open]");
    if (openBtn) {
      e.preventDefault();
      const dealId = openBtn.dataset.poOpen;
      import("../../deal_items.js").then((mod) => {
        mod.openDealItemsModal(dealId, "warehouse");
      }).catch((err) => {
        alert("Не удалось открыть окно заказа: " + (err?.message || String(err)));
      });
      return;
    }

    // Согласовать заказ. Предоплата → «Бронь · ждём оплату». Постоплата/
    // консигнация → оплату не ждём: сразу формируем накладную → «Согласованы».
    const approveBtn = e.target.closest("[data-po-approve]");
    if (approveBtn) {
      e.preventDefault();
      const dealId = approveBtn.dataset.poApprove;
      const deal = Store.get("deals", dealId);
      const scheme = getOrderPaymentScheme(deal);
      const btn = approveBtn;
      btn.disabled = true;
      (async () => {
        try {
          approveDealOrder(dealId);
          if (scheme !== "prepay") {
            await formAndApproveWaybill(dealId);
          }
          refresh();
        } catch (err) {
          btn.disabled = false;
          alert(err?.message || String(err));
        }
      })();
      return;
    }

    // Отозвать (снять бронь) → preliminary.
    const revokeBtn = e.target.closest("[data-po-revoke]");
    if (revokeBtn) {
      e.preventDefault();
      if (!confirm("Отозвать заказ? Бронь будет снята, заказ вернётся в «Предварительные».")) return;
      try {
        revokeDealOrderApproval(revokeBtn.dataset.poRevoke);
        refresh();
      } catch (err) { alert(err?.message || String(err)); }
      return;
    }

    // Сформировать и согласовать накладную (postpay/consignment) → approved.
    const formWaybillBtn = e.target.closest("[data-po-form-waybill]");
    if (formWaybillBtn) {
      e.preventDefault();
      const btn = formWaybillBtn;
      btn.disabled = true;
      (async () => {
        try {
          await formAndApproveWaybill(btn.dataset.poFormWaybill);
          refresh();
        } catch (err) {
          btn.disabled = false;
          alert("Не удалось сформировать накладную: " + (err?.message || String(err)));
        }
      })();
      return;
    }

    // Документы 1С (счёт / реализация / простая СФ).
    const oneCBtn = e.target.closest("[data-po-onec-invoice], [data-po-onec-realization], [data-po-onec-facture]");
    if (oneCBtn) {
      e.preventDefault();
      const docType = oneCBtn.hasAttribute("data-po-onec-facture")
        ? "facture"
        : oneCBtn.hasAttribute("data-po-onec-realization")
        ? "realization"
        : "invoice";
      const dealId = oneCBtn.dataset.poOnecFacture || oneCBtn.dataset.poOnecRealization || oneCBtn.dataset.poOnecInvoice;
      (async () => {
        try {
          const deal = Store.get("deals", dealId);
          if (!deal) return;
          if (docType === "facture" && !deal.oneCRealizationRef) {
            alert("Сначала создайте «Реализацию в 1С» — простая счёт-фактура выписывается на её основании.");
            return;
          }
          const items = listDealItems(dealId);
          const contact = deal.contactId ? Store.get("contacts", deal.contactId) : null;
          const mod = await import("../../one_c_invoice.js");
          mod.openCreateOneCDocDialog({
            deal, items, contact, docType,
            onDone: () => refresh(),
          });
        } catch (err) {
          alert("Не удалось открыть форму документа 1С: " + (err?.message || String(err)));
        }
      })();
      return;
    }

    // Отгружено по накладной → проводка FIFO + списание брони → shipped.
    const shipBtn = e.target.closest("[data-po-ship]");
    if (shipBtn) {
      e.preventDefault();
      const dealId = shipBtn.dataset.poShip;
      const deal = Store.get("deals", dealId);
      if (!deal) return;
      if (listDealItems(dealId).length === 0) { alert("В заказе нет позиций."); return; }
      if (!confirm("Отгрузить по накладной? Товар будет списан со склада (FIFO/партия), заказ перейдёт в «Отгружены».")) return;
      const btn = shipBtn;
      btn.disabled = true;
      (async () => {
        try {
          const { doc, posted, postError } = await shipOrderByWaybill(dealId);
          refresh();
          if (!posted) {
            alert(`⚠ Накладная № ${doc.number} НЕ проведена (FIFO-списание):\n\n${postError}\n\nЗаказ остаётся в «Согласованы». Докомплектуйте остаток/партию и повторите отгрузку.`);
          }
        } catch (err) {
          btn.disabled = false;
          alert("Не удалось отгрузить: " + (err?.message || String(err)));
        }
      })();
      return;
    }

    // Перевод в «Ждут оплату» (предоплата).
    const awaitBtn = e.target.closest("[data-po-await-payment]");
    if (awaitBtn) {
      e.preventDefault();
      const dealId = awaitBtn.dataset.poAwaitPayment;
      const deal = Store.get("deals", dealId);
      if (!deal) return;
      try {
        markDealOrderAwaitingPayment(dealId, {
          invoiceNumber: deal.orderInvoiceForPaymentNumber || "",
          amount: deal.orderExpectedAmount || dealItemsTotal(dealId),
        });
        refresh();
      } catch (err) { alert(err?.message || String(err)); }
      return;
    }

    // Отправить в архив (после проведённой «Реализации в 1С») → archived.
    const archiveBtn = e.target.closest("[data-po-archive]");
    if (archiveBtn) {
      e.preventDefault();
      const dealId = archiveBtn.dataset.poArchive;
      if (!confirm("Отправить заказ в архив? Он уйдёт из «Отгружены» в «Архив».")) return;
      try {
        archiveDealOrder(dealId);
        refresh();
      } catch (err) { alert(err?.message || String(err)); }
      return;
    }

    // Вернуть из архива → shipped.
    const unarchiveBtn = e.target.closest("[data-po-unarchive]");
    if (unarchiveBtn) {
      e.preventDefault();
      const dealId = unarchiveBtn.dataset.poUnarchive;
      try {
        unarchiveDealOrder(dealId);
        refresh();
      } catch (err) { alert(err?.message || String(err)); }
      return;
    }

    // Подтвердить оплату → формируется накладная → «Согласованы».
    const confirmPaymentBtn = e.target.closest("[data-po-confirm-payment]");
    if (confirmPaymentBtn) {
      e.preventDefault();
      const dealId = confirmPaymentBtn.dataset.poConfirmPayment;
      const deal = Store.get("deals", dealId);
      if (!deal) return;
      const expected = Number(deal.orderExpectedAmount) || dealItemsTotal(dealId);
      const amountStr = prompt(`Подтвердить получение оплаты от клиента.\n\nСумма (₸):`, String(expected));
      if (amountStr === null) return;
      const amount = Number(amountStr.replace(/\s/g, "")) || 0;
      if (amount <= 0) { alert("Укажи корректную сумму"); return; }
      const note = prompt("Комментарий (необязательно):", "") || "";
      const btn = confirmPaymentBtn;
      btn.disabled = true;
      (async () => {
        try {
          await confirmDealOrderPayment(dealId, {
            amount, paidAt: new Date().toISOString().slice(0, 10), note,
          });
          refresh();
          alert(`✅ Оплата ${amount.toLocaleString("ru-RU")} ₸ зафиксирована. Накладная сформирована — заказ в «Согласованы на отгрузку».`);
        } catch (err) {
          btn.disabled = false;
          alert(err?.message || String(err));
        }
      })();
      return;
    }

    // Открыть/распечатать накладную.
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
