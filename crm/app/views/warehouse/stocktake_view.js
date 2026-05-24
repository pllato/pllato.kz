// Pllato CRM — UI инвентаризации.
//
// Маршруты:
//   #warehouse/stocktakes              — канбан из 3 колонок (draft/pending/approved)
//   #warehouse/stocktakes/new          — мастер создания (выбрать юр.лицо/категорию)
//   #warehouse/stocktakes/<id>         — карточка инвентаризации (заполнить факт)
//
// Состояние модуля живёт между рендерами через `state`.

import {
  listStocktakes,
  getStocktake,
  createStocktake,
  setActualQty,
  setItemReason,
  submitStocktake,
  recallStocktake,
  approveStocktake,
  rejectStocktake,
  deleteStocktake,
  listShortages,
  listSurpluses,
  listOk,
  computeTotals,
  STOCKTAKE_STATUS,
  SHORTAGE_REASONS,
} from "../../stocktake.js";
import { WAREHOUSE_ENTITIES, listWarehouseCategories } from "../../warehouse.js";

const state = {
  // Для экрана списка позиций — фильтр по статусу подсчёта.
  itemFilter: "all",  // all | counted | uncounted | shortage | surplus
  itemSearch: "",
  // Для модального диалога подтверждения согласования.
  confirmDialog: null, // { type: 'approve' | 'reject', stocktakeId }
};

function escape(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function escapeAttr(s) { return escape(s); }
function num(v) { return new Intl.NumberFormat("ru-RU").format(Number(v) || 0); }
function money(v) { return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(v) || 0); }
function fmtDate(iso) { if (!iso) return "—"; const d = new Date(`${iso}T00:00:00`); return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString("ru-RU"); }
function fmtDT(ts) { if (!ts) return "—"; return new Date(ts).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }); }

// ============================================================================
// Парсинг маршрута
// ============================================================================
export function parseStocktakeSubroute(parts) {
  // parts = ['stocktakes', ...rest]
  if (parts.length === 1) return { page: "list" };
  if (parts[1] === "new") return { page: "new" };
  return { page: "card", stocktakeId: parts[1] };
}

// ============================================================================
// Главный рендер (вызывается из warehouse/index.js)
// ============================================================================
export function renderStocktakeView(subroute) {
  if (subroute.page === "new") return renderNewWizard();
  if (subroute.page === "card") return renderCard(subroute.stocktakeId);
  return renderList();
}

export function wireStocktakeEvents(container, subroute) {
  if (container.dataset.stWired === "1") return;
  container.dataset.stWired = "1";
  container.addEventListener("click", (e) => handleClick(e, container));
  container.addEventListener("input", (e) => handleInput(e, container));
  container.addEventListener("change", (e) => handleChange(e, container));
  container.addEventListener("submit", (e) => handleSubmit(e, container));
}

// ============================================================================
// 1. СПИСОК — канбан из 3 колонок
// ============================================================================
function renderList() {
  const drafts = listStocktakes({ status: STOCKTAKE_STATUS.DRAFT });
  const pending = listStocktakes({ status: STOCKTAKE_STATUS.PENDING });
  const approved = listStocktakes({ status: STOCKTAKE_STATUS.APPROVED });
  const rejected = listStocktakes({ status: STOCKTAKE_STATUS.REJECTED });

  return `
    <section class="whm-section st-view">
      <div class="st-header">
        <div>
          <h2>Инвентаризация</h2>
          <div class="st-sub">Регулярная сверка фактических остатков с системными. При согласовании создаются документы корректировки.</div>
        </div>
        <a class="btn-primary" href="#warehouse/stocktakes/new">+ Новая инвентаризация</a>
      </div>

      <div class="st-kanban">
        ${renderColumn("Черновики", drafts, "#6366f1", "draft")}
        ${renderColumn("На согласовании", pending, "#f59e0b", "pending")}
        ${renderColumn("Проведены", approved, "#16a34a", "approved")}
        ${rejected.length > 0 ? renderColumn("Отклонены", rejected, "#ef4444", "rejected") : ""}
      </div>
    </section>
  `;
}

function renderColumn(title, list, color, kind) {
  return `
    <div class="st-col">
      <div class="st-col-head">
        <span class="st-col-dot" style="background:${color}"></span>
        <span class="st-col-title">${escape(title)}</span>
        <span class="st-col-count">${list.length}</span>
      </div>
      <div class="st-col-body">
        ${list.length === 0
          ? `<div class="st-empty">Пусто</div>`
          : list.map((s) => renderStocktakeCard(s, kind)).join("")}
      </div>
    </div>
  `;
}

function renderStocktakeCard(s, kind) {
  const t = s.totals || computeTotals(s.items);
  const scope = s.scope === "category" && s.scopeFilter
    ? `Категория: ${escape(s.scopeFilter)}`
    : (s.entity ? `Юр.лицо: ${escape(s.entity)}` : "Весь склад");
  return `
    <a class="st-card" href="#warehouse/stocktakes/${escapeAttr(s.id)}">
      <div class="st-card-head">
        <strong class="st-card-num">${escape(s.number)}</strong>
        <span class="st-card-date">${escape(fmtDate(s.date))}</span>
      </div>
      <div class="st-card-scope">${scope}</div>
      <div class="st-card-stats">
        <div>Посчитано: <strong>${num(t.productsCounted)}</strong> из ${num(t.productsTotal)}</div>
        ${t.shortageQty > 0 ? `<div class="st-stat-shortage">Недостача: <strong>${num(t.shortageQty)} шт · ${money(t.shortageAmount)} ₸</strong></div>` : ""}
        ${t.surplusQty > 0 ? `<div class="st-stat-surplus">Излишки: <strong>${num(t.surplusQty)} шт · ${money(t.surplusAmount)} ₸</strong></div>` : ""}
      </div>
      <div class="st-card-foot">
        ${kind === "draft" ? `Создал: ${escape(s.createdByName || "—")}` : ""}
        ${kind === "pending" ? `Отправил: ${escape(s.submittedByName || "—")} · ${escape(fmtDT(s.submittedAt))}` : ""}
        ${kind === "approved" ? `Согласовал: ${escape(s.approvedByName || "—")} · ${escape(fmtDT(s.approvedAt))}` : ""}
        ${kind === "rejected" ? `Отклонил: ${escape(s.rejectionReason || "—")}` : ""}
      </div>
    </a>
  `;
}

// ============================================================================
// 2. МАСТЕР СОЗДАНИЯ
// ============================================================================
function renderNewWizard() {
  const cats = listWarehouseCategories();
  return `
    <section class="whm-section st-view">
      <div class="st-header">
        <h2>Новая инвентаризация</h2>
        <a class="btn-ghost" href="#warehouse/stocktakes">← Назад</a>
      </div>
      <form class="whm-card" data-st-new style="padding:18px;max-width:640px">
        <div class="st-field">
          <label>Юр.лицо</label>
          <select name="entity">
            <option value="">Все</option>
            ${WAREHOUSE_ENTITIES.map((e) => `<option value="${e}">${e}</option>`).join("")}
          </select>
        </div>
        <div class="st-field">
          <label>Категория (необязательно)</label>
          <select name="scopeFilter">
            <option value="">Все категории</option>
            ${cats.map((c) => `<option value="${escapeAttr(c)}">${escape(c)}</option>`).join("")}
          </select>
        </div>
        <div class="st-field">
          <label>Комментарий (необязательно)</label>
          <textarea name="notes" rows="2" placeholder="Например: плановая ежемесячная инвентаризация"></textarea>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button type="submit" class="btn-primary">Начать инвентаризацию</button>
          <a class="btn-ghost" href="#warehouse/stocktakes">Отмена</a>
        </div>
        <div class="st-hint" style="margin-top:10px;font-size:12px;color:var(--text-muted)">
          Система зафиксирует системные остатки на этот момент. Дальше менеджер заполняет факт.
        </div>
      </form>
    </section>
  `;
}

// ============================================================================
// 3. КАРТОЧКА — заполнение факта / согласование
// ============================================================================
function renderCard(stocktakeId) {
  const st = getStocktake(stocktakeId);
  if (!st) {
    return `
      <section class="whm-section st-view">
        <div class="st-header">
          <h2>Инвентаризация не найдена</h2>
          <a class="btn-ghost" href="#warehouse/stocktakes">← К списку</a>
        </div>
      </section>
    `;
  }

  const t = st.totals || computeTotals(st.items);
  const isDraft = st.status === STOCKTAKE_STATUS.DRAFT;
  const isPending = st.status === STOCKTAKE_STATUS.PENDING;
  const isApproved = st.status === STOCKTAKE_STATUS.APPROVED;
  const isRejected = st.status === STOCKTAKE_STATUS.REJECTED;

  const filteredItems = filterStocktakeItems(st.items, state.itemFilter, state.itemSearch);

  return `
    <section class="whm-section st-view">
      <div class="st-header">
        <div>
          <h2>${escape(st.number)} <span class="st-status-badge st-status-${st.status}">${escape(statusLabel(st.status))}</span></h2>
          <div class="st-sub">
            ${escape(fmtDate(st.date))} ·
            ${st.scope === "category" && st.scopeFilter ? `категория «${escape(st.scopeFilter)}»` : "весь склад"}
            ${st.entity ? ` · ${escape(st.entity)}` : ""}
            · Создал: ${escape(st.createdByName || "—")}
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn-ghost" href="#warehouse/stocktakes">← Назад</a>
          ${isDraft ? `<button type="button" class="btn-ghost danger" data-st-delete="${escapeAttr(st.id)}">Удалить</button>` : ""}
          ${isDraft ? `<button type="button" class="btn-primary" data-st-submit="${escapeAttr(st.id)}">📨 На согласование</button>` : ""}
          ${isPending ? `<button type="button" class="btn-ghost" data-st-recall="${escapeAttr(st.id)}">↶ Отозвать</button>` : ""}
          ${isPending ? `<button type="button" class="btn-ghost danger" data-st-reject="${escapeAttr(st.id)}">✗ Отклонить</button>` : ""}
          ${isPending ? `<button type="button" class="btn-primary" data-st-approve="${escapeAttr(st.id)}">✓ Согласовать</button>` : ""}
        </div>
      </div>

      ${isApproved ? `
        <div class="st-banner ok">
          ✅ Инвентаризация проведена ${escape(fmtDT(st.approvedAt))} (${escape(st.approvedByName || "—")}).
          ${st.approvalComment ? ` Комментарий: «${escape(st.approvalComment)}»` : ""}
          ${(st.appliedDocumentIds || []).length > 0 ? `<br>Корректирующих документов создано: <strong>${(st.appliedDocumentIds || []).length}</strong>` : ""}
          ${st.applyErrors && st.applyErrors.length ? `<br>⚠ Ошибки: ${escape(st.applyErrors.join("; "))}` : ""}
        </div>
      ` : ""}
      ${isRejected ? `<div class="st-banner err">✗ Отклонено: ${escape(st.rejectionReason || "—")}</div>` : ""}
      ${isPending ? `<div class="st-banner pending">⏳ Ждёт согласования директора. Менеджер уже не может редактировать. Если нужно поправить — отзови в черновик.</div>` : ""}

      <div class="st-totals">
        <div class="st-total">
          <div class="st-total-label">Посчитано</div>
          <div class="st-total-value">${num(t.productsCounted)} <span class="st-total-of">/ ${num(t.productsTotal)}</span></div>
        </div>
        <div class="st-total st-total-shortage">
          <div class="st-total-label">Недостача</div>
          <div class="st-total-value">${num(t.shortageQty)} <span class="st-total-of">шт</span></div>
          <div class="st-total-sub">${money(t.shortageAmount)} ₸</div>
        </div>
        <div class="st-total st-total-surplus">
          <div class="st-total-label">Излишки</div>
          <div class="st-total-value">${num(t.surplusQty)} <span class="st-total-of">шт</span></div>
          <div class="st-total-sub">${money(t.surplusAmount)} ₸</div>
        </div>
      </div>

      <div class="whm-card" style="padding:14px 16px">
        <div class="st-toolbar">
          <input type="search" class="st-search" placeholder="Поиск по SKU / названию…" value="${escape(state.itemSearch)}" data-st-search>
          <div class="st-filter-chips">
            ${renderFilterChip("all", "Все", st.items.length)}
            ${renderFilterChip("uncounted", "Не посчитано", st.items.filter((i) => !i.counted).length)}
            ${renderFilterChip("counted", "Посчитано", st.items.filter((i) => i.counted).length)}
            ${renderFilterChip("shortage", "Недостача", st.items.filter((i) => i.counted && Number(i.diff) < 0).length)}
            ${renderFilterChip("surplus", "Излишки", st.items.filter((i) => i.counted && Number(i.diff) > 0).length)}
          </div>
        </div>

        <table class="st-table">
          <thead>
            <tr>
              <th style="width:10%">SKU</th>
              <th>Товар</th>
              <th style="width:8%" class="num">Системный</th>
              <th style="width:14%" class="num">Факт</th>
              <th style="width:8%" class="num">Δ</th>
              <th style="width:18%">Причина</th>
            </tr>
          </thead>
          <tbody>
            ${filteredItems.length === 0
              ? `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">По фильтру ничего не найдено</td></tr>`
              : filteredItems.map((it) => renderItemRow(it, st.id, isDraft)).join("")
            }
          </tbody>
        </table>
      </div>
    </section>

    ${state.confirmDialog ? renderConfirmDialog(st) : ""}
  `;
}

function filterStocktakeItems(items, filter, search) {
  let arr = items || [];
  if (filter === "counted") arr = arr.filter((i) => i.counted);
  else if (filter === "uncounted") arr = arr.filter((i) => !i.counted);
  else if (filter === "shortage") arr = arr.filter((i) => i.counted && Number(i.diff) < 0);
  else if (filter === "surplus") arr = arr.filter((i) => i.counted && Number(i.diff) > 0);
  const q = String(search || "").trim().toLowerCase();
  if (q) {
    arr = arr.filter((i) => `${i.sku || ""} ${i.name || ""}`.toLowerCase().includes(q));
  }
  return arr;
}

function renderFilterChip(value, label, count) {
  const active = state.itemFilter === value;
  return `<button type="button" class="st-chip ${active ? "active" : ""}" data-st-filter="${value}">${escape(label)}<span class="st-chip-count">${num(count)}</span></button>`;
}

function renderItemRow(it, stocktakeId, editable) {
  const diff = Number(it.diff);
  const diffClass = !it.counted ? "" : diff < 0 ? "diff-neg" : diff > 0 ? "diff-pos" : "diff-zero";
  const diffStr = !it.counted ? "—" : (diff > 0 ? `+${num(diff)}` : num(diff));
  return `
    <tr class="${it.counted ? "is-counted" : ""}">
      <td class="mono">${escape(it.sku || "—")}</td>
      <td>${escape(it.name || "—")}</td>
      <td class="num">${num(it.expectedQty)}</td>
      <td class="num">
        ${editable
          ? `<input type="number" inputmode="numeric" class="st-actual-input" min="0" step="1" value="${it.actualQty == null ? "" : it.actualQty}" data-st-actual="${escapeAttr(it.productId)}" data-st-id="${escapeAttr(stocktakeId)}" placeholder="—">`
          : `<strong>${it.counted ? num(it.actualQty) : "—"}</strong>`
        }
      </td>
      <td class="num ${diffClass}"><strong>${diffStr}</strong></td>
      <td>
        ${editable && it.counted && diff < 0
          ? `<select class="st-reason-select" data-st-reason="${escapeAttr(it.productId)}" data-st-id="${escapeAttr(stocktakeId)}">
              <option value="">— выбери причину —</option>
              ${SHORTAGE_REASONS.map((r) => `<option value="${r.id}" ${it.reason === r.id ? "selected" : ""}>${escape(r.label)}</option>`).join("")}
            </select>`
          : (it.reason ? escape(SHORTAGE_REASONS.find((r) => r.id === it.reason)?.label || it.reason) : "—")
        }
      </td>
    </tr>
  `;
}

function statusLabel(s) {
  switch (s) {
    case STOCKTAKE_STATUS.DRAFT: return "Черновик";
    case STOCKTAKE_STATUS.PENDING: return "На согласовании";
    case STOCKTAKE_STATUS.APPROVED: return "Проведена";
    case STOCKTAKE_STATUS.REJECTED: return "Отклонена";
    case STOCKTAKE_STATUS.CANCELLED: return "Отменена";
    default: return s;
  }
}

// ============================================================================
// Подтверждающий диалог (Согласовать / Отклонить)
// ============================================================================
function renderConfirmDialog(st) {
  const c = state.confirmDialog;
  if (!c || c.stocktakeId !== st.id) return "";
  if (c.type === "approve") {
    return `
      <div class="st-modal-bg" data-st-modal-close>
        <div class="st-modal" onclick="event.stopPropagation()">
          <h3>Согласовать инвентаризацию ${escape(st.number)}?</h3>
          <p>После согласования будут созданы документы корректировки остатков (этап 2). Сейчас (этап 1) — фиксируется факт согласования директором, остатки корректируются вручную.</p>
          <form data-st-approve-form data-st-id="${escapeAttr(st.id)}">
            <label>Комментарий (необязательно)</label>
            <textarea name="comment" rows="2" placeholder="например: списать на естественную убыль"></textarea>
            <div class="st-modal-actions">
              <button type="button" class="btn-ghost" data-st-modal-close>Отмена</button>
              <button type="submit" class="btn-primary">✓ Согласовать</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
  if (c.type === "reject") {
    return `
      <div class="st-modal-bg" data-st-modal-close>
        <div class="st-modal" onclick="event.stopPropagation()">
          <h3>Отклонить инвентаризацию ${escape(st.number)}?</h3>
          <form data-st-reject-form data-st-id="${escapeAttr(st.id)}">
            <label>Причина (обязательно)</label>
            <textarea name="reason" rows="2" required placeholder="например: перечислены неверные позиции, пересчитать"></textarea>
            <div class="st-modal-actions">
              <button type="button" class="btn-ghost" data-st-modal-close>Отмена</button>
              <button type="submit" class="btn-primary danger">✗ Отклонить</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
  return "";
}

// ============================================================================
// HANDLERS
// ============================================================================
function handleClick(e, container) {
  // Кнопки внутри карточки/листа.
  const action = (sel) => e.target.closest(sel);

  const filterBtn = action("[data-st-filter]");
  if (filterBtn) {
    state.itemFilter = filterBtn.dataset.stFilter;
    refresh(container);
    return;
  }

  const delBtn = action("[data-st-delete]");
  if (delBtn) {
    if (!confirm("Удалить черновик инвентаризации?")) return;
    try { deleteStocktake(delBtn.dataset.stDelete); location.hash = "#warehouse/stocktakes"; }
    catch (err) { alert(err?.message || err); }
    return;
  }

  const submitBtn = action("[data-st-submit]");
  if (submitBtn) {
    try { submitStocktake(submitBtn.dataset.stSubmit); refresh(container); }
    catch (err) { alert(err?.message || err); }
    return;
  }

  const recallBtn = action("[data-st-recall]");
  if (recallBtn) {
    if (!confirm("Отозвать инвентаризацию в черновик?")) return;
    try { recallStocktake(recallBtn.dataset.stRecall); refresh(container); }
    catch (err) { alert(err?.message || err); }
    return;
  }

  const approveBtn = action("[data-st-approve]");
  if (approveBtn) {
    state.confirmDialog = { type: "approve", stocktakeId: approveBtn.dataset.stApprove };
    refresh(container);
    return;
  }

  const rejectBtn = action("[data-st-reject]");
  if (rejectBtn) {
    state.confirmDialog = { type: "reject", stocktakeId: rejectBtn.dataset.stReject };
    refresh(container);
    return;
  }

  if (e.target.matches("[data-st-modal-close]") || e.target.closest("[data-st-modal-close]")) {
    state.confirmDialog = null;
    refresh(container);
    return;
  }
}

function handleInput(e, container) {
  if (e.target.matches("[data-st-search]")) {
    state.itemSearch = e.target.value || "";
    // Re-render только tbody — чтобы не сбить фокус инпута.
    const tbody = container.querySelector(".st-table tbody");
    if (tbody) {
      const stocktakeId = container.querySelector("[data-st-actual]")?.dataset.stId
        || container.querySelector(".st-view h2")?.textContent;
      // Проще — полный refresh, но с восстановлением фокуса.
      refreshKeepFocus(container, "[data-st-search]");
    }
  }
}

function handleChange(e, container) {
  if (e.target.matches("[data-st-actual]")) {
    const productId = e.target.dataset.stActual;
    const stocktakeId = e.target.dataset.stId;
    const value = e.target.value === "" ? null : Number(e.target.value);
    try {
      setActualQty(stocktakeId, productId, value);
      refreshKeepFocus(container, `[data-st-actual="${cssEscape(productId)}"]`);
    } catch (err) {
      alert(err?.message || err);
    }
  } else if (e.target.matches("[data-st-reason]")) {
    const productId = e.target.dataset.stReason;
    const stocktakeId = e.target.dataset.stId;
    try {
      setItemReason(stocktakeId, productId, e.target.value || "");
    } catch (err) { alert(err?.message || err); }
  }
}

function handleSubmit(e, container) {
  if (e.target.matches("[data-st-new]")) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const doc = createStocktake({
        entity: fd.get("entity") || "",
        scope: fd.get("scopeFilter") ? "category" : "all",
        scopeFilter: fd.get("scopeFilter") || "",
        notes: fd.get("notes") || "",
      });
      location.hash = `#warehouse/stocktakes/${doc.id}`;
    } catch (err) {
      alert(err?.message || err);
    }
    return;
  }
  if (e.target.matches("[data-st-approve-form]")) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = e.target.dataset.stId;
    try {
      const updated = approveStocktake(id, fd.get("comment") || "");
      state.confirmDialog = null;
      // Сводка для менеджера: что произошло.
      const docs = (updated.appliedDocumentIds || []).length;
      const errs = updated.applyErrors;
      const t = updated.totals || {};
      const lines = [];
      lines.push(`✅ Инвентаризация ${updated.number} согласована.`);
      if (t.shortageQty > 0) lines.push(`• Списано (недостача): ${t.shortageQty} шт на ${t.shortageAmount.toLocaleString("ru-RU")} ₸`);
      if (t.surplusQty > 0) lines.push(`• Оприходовано (излишки): ${t.surplusQty} шт на ${t.surplusAmount.toLocaleString("ru-RU")} ₸`);
      if (docs > 0) lines.push(`Создано документов корректировки: ${docs}.`);
      if (errs && errs.length > 0) lines.push(`⚠ Ошибки: ${errs.join("; ")}`);
      alert(lines.join("\n"));
      refresh(container);
    } catch (err) { alert(err?.message || err); }
    return;
  }
  if (e.target.matches("[data-st-reject-form]")) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = e.target.dataset.stId;
    try {
      rejectStocktake(id, fd.get("reason") || "");
      state.confirmDialog = null;
      refresh(container);
    } catch (err) { alert(err?.message || err); }
    return;
  }
}

function refresh(container) {
  window.dispatchEvent(new CustomEvent("pllato:warehouse-refresh"));
}

function refreshKeepFocus(container, focusSelector) {
  // После полного re-render элемент будет другой — восстановим фокус по селектору.
  window.dispatchEvent(new CustomEvent("pllato:warehouse-refresh"));
  setTimeout(() => {
    const el = document.querySelector(focusSelector);
    if (el) {
      el.focus();
      try { el.setSelectionRange?.(el.value.length, el.value.length); } catch {}
    }
  }, 30);
}

function cssEscape(s) {
  return String(s || "").replace(/["\\]/g, "\\$&");
}
