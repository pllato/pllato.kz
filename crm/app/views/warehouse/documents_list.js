import { ICONS } from "../../icons.js";
import { listWarehouseDocuments } from "../../warehouse.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU");
}

function num(v) {
  return new Intl.NumberFormat("ru-RU").format(Number(v) || 0);
}

function statusLabel(status) {
  if (status === "posted") return '<span class="chip chip-success">проведён</span>';
  if (status === "cancelled") return '<span class="chip chip-danger">отменён</span>';
  return '<span class="chip chip-warning">черновик</span>';
}

function typeLabel(type) {
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

export function renderDocumentsListView(state, canEdit) {
  const items = listWarehouseDocuments({ type: state.docsType || "", status: state.docsStatus || "" });
  return `
    <section class="whm-section">
      <div class="toolbar whm-toolbar">
        <select data-wh-doc-filter="type">
          <option value="">Все типы</option>
          <option value="receipt" ${state.docsType === "receipt" ? "selected" : ""}>Приход</option>
          <option value="sale_invoice" ${state.docsType === "sale_invoice" ? "selected" : ""}>Расходная накладная</option>
          <option value="writeoff_act" ${state.docsType === "writeoff_act" ? "selected" : ""}>Списание</option>
          <option value="return_in" ${state.docsType === "return_in" ? "selected" : ""}>Возврат на склад</option>
          <option value="return_out" ${state.docsType === "return_out" ? "selected" : ""}>Возврат клиенту</option>
          <option value="transfer" ${state.docsType === "transfer" ? "selected" : ""}>Перемещение</option>
        </select>
        <select data-wh-doc-filter="status">
          <option value="">Все статусы</option>
          <option value="draft" ${state.docsStatus === "draft" ? "selected" : ""}>Черновики</option>
          <option value="posted" ${state.docsStatus === "posted" ? "selected" : ""}>Проведённые</option>
          <option value="cancelled" ${state.docsStatus === "cancelled" ? "selected" : ""}>Отменённые</option>
        </select>
        <div class="spacer"></div>
        <button type="button" class="btn-primary" data-wh-new-doc="receipt" ${canEdit ? "" : "disabled"}>${ICONS.clipboardList}<span>Новый документ</span></button>
      </div>

      <div class="whm-card">
        <table class="whm-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>№ документа</th>
              <th>Тип</th>
              <th>Контрагент</th>
              <th class="num">Сумма</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${items.length ? items.map((doc) => `
              <tr>
                <td>${escapeHtml(fmtDate(doc.date))}</td>
                <td class="mono">${escapeHtml(doc.number || "—")}</td>
                <td>${escapeHtml(typeLabel(doc.type))}</td>
                <td>${escapeHtml(doc.counterpartyText || "—")}</td>
                <td class="num">${num(doc.totalAmount || 0)} ${escapeHtml(doc.currency || "KZT")}</td>
                <td>${statusLabel(doc.status)}</td>
                <td class="num"><button type="button" class="btn-ghost btn-sm" data-wh-open-doc="${escapeAttr(doc.id)}">Открыть</button></td>
              </tr>
            `).join("") : `<tr><td colspan="7"><div class="whm-empty">Документы пока не созданы</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}
