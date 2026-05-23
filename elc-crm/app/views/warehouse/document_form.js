import { ICONS } from "../../icons.js";
import {
  listWarehouseProducts,
  listLotsForProduct,
  DOCUMENT_TYPES,
} from "../../warehouse.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return `line_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function documentTypeLabel(type) {
  return {
    receipt: "Приход",
    sale_invoice: "Расходная накладная",
    sale_act: "Акт продажи",
    writeoff_act: "Акт списания",
    damage_act: "Акт брака",
    return_in: "Возврат на склад",
    return_out: "Возврат клиенту",
    transfer: "Перемещение",
  }[type] || type;
}

export function isOutType(type) {
  return ["sale_invoice", "sale_act", "writeoff_act", "damage_act", "return_out", "transfer"].includes(type);
}

export function isInType(type) {
  return ["receipt", "return_in"].includes(type);
}

export function newWarehouseDocumentDraft(type = "receipt", prefill = {}) {
  return {
    id: null,
    type,
    number: "",
    date: todayIso(),
    counterpartyContactId: null,
    counterpartyText: "",
    dealId: null,
    items: [
      {
        lineId: uid(),
        splitFromLineId: null,
        productId: prefill.productId || null,
        lotId: null,
        lotCode: "",
        expiryDate: "",
        qty: prefill.qty || 0,
        unitPrice: 0,
        lineAmount: 0,
      },
    ],
    totalAmount: 0,
    currency: "KZT",
    status: "draft",
    note: "",
    attachedFiles: [],
  };
}

export function draftFromDocument(doc) {
  return {
    id: doc.id,
    type: doc.type,
    number: doc.number || "",
    date: doc.date || todayIso(),
    counterpartyContactId: doc.counterpartyContactId || null,
    counterpartyText: doc.counterpartyText || "",
    dealId: doc.dealId || null,
    items: (Array.isArray(doc.items) && doc.items.length
      ? doc.items
      : [{ lineId: uid(), productId: null, lotId: null, lotCode: "", expiryDate: "", qty: 0, unitPrice: 0, lineAmount: 0, splitFromLineId: null }])
      .map((x, idx) => ({
        lineId: x.lineId || `line_${idx + 1}`,
        splitFromLineId: x.splitFromLineId || null,
        productId: x.productId || null,
        lotId: x.lotId || null,
        lotCode: x.lotCode || "",
        expiryDate: x.expiryDate || "",
        qty: toNum(x.qty, 0),
        unitPrice: toNum(x.unitPrice, 0),
        lineAmount: toNum(x.lineAmount, toNum(x.qty, 0) * toNum(x.unitPrice, 0)),
      })),
    totalAmount: toNum(doc.totalAmount, 0),
    currency: doc.currency || "KZT",
    status: doc.status || "draft",
    note: doc.note || "",
    attachedFiles: Array.isArray(doc.attachedFiles) ? doc.attachedFiles : [],
  };
}

function renderLineRow(line, idx, products, readOnly, type) {
  const product = products.find((p) => p.id === line.productId) || null;
  const lots = line.productId ? listLotsForProduct(line.productId, { activeOnly: true }) : [];
  const hasManualLot = Boolean(line.lotId);

  return `
    <tr class="${line.splitFromLineId ? "split" : ""}" data-line-id="${escapeAttr(line.lineId || uid())}" data-split-from="${escapeAttr(line.splitFromLineId || "")}">
      <td>
        <select data-wh-line="product" data-index="${idx}" ${readOnly ? "disabled" : ""}>
          <option value="">Выбери товар</option>
          ${products.map((p) => `<option value="${escapeAttr(p.id)}" ${p.id === line.productId ? "selected" : ""}>${escapeHtml(p.sku || "—")} · ${escapeHtml(p.name)}</option>`).join("")}
        </select>
      </td>
      <td>
        <select data-wh-line="lot" data-index="${idx}" ${readOnly ? "disabled" : ""}>
          <option value="">${isOutType(type) ? "FIFO авто" : "Новая/существующая"}</option>
          ${lots.map((lot) => `<option value="${escapeAttr(lot.id)}" ${lot.id === line.lotId ? "selected" : ""}>LOT ${escapeHtml(lot.lotCode)} · ост ${escapeHtml(String(lot.currentQty || 0))}</option>`).join("")}
        </select>
        ${isInType(type) && !hasManualLot ? `
          <div class="whm-lot-inline">
            <input data-wh-line="lotCode" data-index="${idx}" value="${escapeAttr(line.lotCode || "")}" placeholder="LOT">
            <input data-wh-line="expiryDate" data-index="${idx}" type="date" value="${escapeAttr(line.expiryDate || "")}" title="Срок годности">
          </div>
        ` : ""}
      </td>
      <td class="num"><input data-wh-line="qty" data-index="${idx}" type="number" min="0" step="0.01" value="${escapeAttr(line.qty)}" ${readOnly ? "disabled" : ""}></td>
      <td class="num"><input data-wh-line="unitPrice" data-index="${idx}" type="number" min="0" step="0.01" value="${escapeAttr(line.unitPrice)}" ${readOnly ? "disabled" : ""}></td>
      <td class="num"><strong>${new Intl.NumberFormat("ru-RU").format(toNum(line.lineAmount, toNum(line.qty, 0) * toNum(line.unitPrice, 0)))}</strong></td>
      <td class="num">
        <button type="button" class="btn-ghost btn-icon btn-sm" data-wh-line-remove="${idx}" ${readOnly ? "disabled" : ""}>${ICONS.x}</button>
      </td>
    </tr>
  `;
}

function calcTotals(items) {
  return (items || []).reduce((acc, line) => {
    const qty = toNum(line.qty, 0);
    const amount = toNum(line.lineAmount, qty * toNum(line.unitPrice, 0));
    acc.qty += qty;
    acc.total += amount;
    return acc;
  }, { qty: 0, total: 0 });
}

export function renderWarehouseDocumentModal(state, canEdit) {
  if (!state.docModal?.open) return "";
  const draft = state.docModal.draft || newWarehouseDocumentDraft();
  const products = listWarehouseProducts({ includeArchived: false });
  const readOnly = !canEdit || draft.status === "cancelled" || draft.status === "posted";
  const totals = calcTotals(draft.items || []);

  return `
    <div class="modal-backdrop" data-wh-doc-backdrop>
      <div class="modal wh-modal" role="dialog" aria-modal="true" style="max-width:1180px">
        <header class="modal-header">
          <h2>${draft.id ? "Документ" : "Новый документ"}</h2>
          <div class="spacer"></div>
          <span class="doc-status ${escapeAttr(draft.status)}">${escapeHtml(draft.status)}</span>
          <button type="button" class="btn-ghost icon-only" data-wh-doc-close>${ICONS.x}</button>
        </header>

        <div class="modal-body">
          <div class="modal-left">
            <div class="field">
              <label>Тип документа</label>
              <select class="select" data-wh-doc-field="type" ${readOnly ? "disabled" : ""}>
                ${DOCUMENT_TYPES.map((type) => `<option value="${type}" ${type === draft.type ? "selected" : ""}>${documentTypeLabel(type)}</option>`).join("")}
              </select>
            </div>
            <div class="field"><label>Номер</label><input class="input" data-wh-doc-field="number" value="${escapeAttr(draft.number || "")}" ${readOnly ? "disabled" : ""}></div>
            <div class="field"><label>Дата</label><input class="input" type="date" data-wh-doc-field="date" value="${escapeAttr(draft.date || "")}" ${readOnly ? "disabled" : ""}></div>
            <div class="field"><label>Контрагент / куда</label><input class="input" data-wh-doc-field="counterpartyText" value="${escapeAttr(draft.counterpartyText || "")}" ${readOnly ? "disabled" : ""}></div>
            <div class="field"><label>Сделка (id)</label><input class="input" data-wh-doc-field="dealId" value="${escapeAttr(draft.dealId || "")}" ${readOnly ? "disabled" : ""}></div>
            <div class="field"><label>Комментарий</label><textarea class="input" rows="3" data-wh-doc-field="note" ${readOnly ? "disabled" : ""}>${escapeHtml(draft.note || "")}</textarea></div>
          </div>

          <div class="modal-right">
            ${isOutType(draft.type) ? `<div class="fifo-hint"><span class="icon">↳</span><div><strong>FIFO:</strong> для расходных документов при пустом поле LOT система распределит количество по партиям автоматически.</div></div>` : ""}
            <table class="items-table">
              <thead>
                <tr><th>Товар</th><th>Партия (LOT)</th><th class="num">Кол-во</th><th class="num">Цена</th><th class="num">Сумма</th><th></th></tr>
              </thead>
              <tbody data-wh-lines>
                ${(draft.items || []).map((line, idx) => renderLineRow(line, idx, products, readOnly, draft.type)).join("")}
              </tbody>
            </table>
            <div class="row" style="gap:8px;flex-wrap:wrap">
              <button type="button" class="btn-ghost btn-sm" data-wh-line-add ${readOnly ? "disabled" : ""}>${ICONS.plus}<span>Строка</span></button>
              <button type="button" class="btn-ghost btn-sm" data-wh-doc-autosplit ${readOnly ? "disabled" : ""}>${ICONS.merge}<span>Автосплит FIFO</span></button>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <div class="totals">
            <div class="total-pair"><span class="total-label">Позиций</span><span class="total-value">${(draft.items || []).length}</span></div>
            <div class="total-pair"><span class="total-label">Кол-во</span><span class="total-value">${new Intl.NumberFormat("ru-RU").format(totals.qty)}</span></div>
            <div class="total-pair"><span class="total-label">Сумма</span><span class="total-value">${new Intl.NumberFormat("ru-RU").format(totals.total)} ${escapeHtml(draft.currency || "KZT")}</span></div>
          </div>
          <div class="row" style="gap:8px;flex-wrap:wrap;justify-content:flex-end">
            <span class="muted" data-wh-doc-error style="min-width:240px;text-align:right">${escapeHtml(state.docModal.error || "")}</span>
            <button type="button" class="btn-ghost" data-wh-doc-save ${readOnly ? "disabled" : ""}>Сохранить черновик</button>
            <button type="button" class="btn-primary" data-wh-doc-post ${readOnly ? "disabled" : ""}>Провести</button>
            ${draft.id && draft.status === "posted" && canEdit ? `<button type="button" class="btn-ghost" data-wh-doc-cancel>Отменить</button>` : ""}
          </div>
        </footer>
      </div>
    </div>
  `;
}

export function readDraftFromModal(root) {
  const modal = root.querySelector("[data-wh-doc-backdrop]");
  if (!modal) return null;

  const draft = {
    id: root.querySelector("[data-wh-doc-id]")?.value || null,
    type: root.querySelector('[data-wh-doc-field="type"]')?.value || "receipt",
    number: root.querySelector('[data-wh-doc-field="number"]')?.value || "",
    date: root.querySelector('[data-wh-doc-field="date"]')?.value || todayIso(),
    counterpartyText: root.querySelector('[data-wh-doc-field="counterpartyText"]')?.value || "",
    dealId: root.querySelector('[data-wh-doc-field="dealId"]')?.value || null,
    note: root.querySelector('[data-wh-doc-field="note"]')?.value || "",
    currency: "KZT",
    status: "draft",
    items: [],
  };

  const rows = Array.from(root.querySelectorAll("tbody[data-wh-lines] > tr"));
  draft.items = rows.map((row, idx) => {
    const get = (key) => row.querySelector(`[data-wh-line="${key}"]`);
    const productId = get("product")?.value || null;
    const lotId = get("lot")?.value || null;
    const qty = toNum(get("qty")?.value, 0);
    const unitPrice = toNum(get("unitPrice")?.value, 0);
    const lotCode = get("lotCode")?.value || "";
    const expiryDate = get("expiryDate")?.value || "";

    return {
      lineId: row.dataset.lineId || `line_${idx + 1}`,
      splitFromLineId: row.classList.contains("split") ? row.dataset.splitFrom || null : null,
      productId,
      lotId: lotId || null,
      lotCode,
      expiryDate,
      qty,
      unitPrice,
      lineAmount: qty * unitPrice,
    };
  }).filter((line) => line.productId && line.qty > 0);

  return draft;
}
