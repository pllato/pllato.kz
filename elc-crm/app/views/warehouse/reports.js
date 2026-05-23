import { ICONS } from "../../icons.js";
import { buildBalancesOnDate } from "../../warehouse.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function num(v) {
  return new Intl.NumberFormat("ru-RU").format(Number(v) || 0);
}

export function renderWarehouseReportsView(state) {
  const date = state.reportDate;
  const rows = date ? buildBalancesOnDate(date) : [];

  return `
    <section class="whm-section">
      <div class="whm-card whm-pad">
        <div class="row" style="gap:12px;align-items:flex-end;flex-wrap:wrap">
          <div class="field" style="min-width:220px;margin:0">
            <label class="flbl">Остатки на дату</label>
            <input type="date" class="input" value="${escapeAttr(date || "")}" data-wh-report-date>
          </div>
          <button type="button" class="btn-ghost" disabled>${ICONS.clipboardList}<span>Экспорт xlsx (скоро)</span></button>
        </div>
      </div>

      <div class="whm-card">
        <table class="whm-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Товар</th>
              <th>LOT</th>
              <th>Юр.лицо</th>
              <th>Срок</th>
              <th class="num">Остаток</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length ? rows.map((r) => `
              <tr>
                <td class="mono dim">${escapeHtml(r.sku || "—")}</td>
                <td>${escapeHtml(r.name || "—")}</td>
                <td class="mono">${escapeHtml(r.lotCode || "—")}</td>
                <td>${escapeHtml(r.entity || "—")}</td>
                <td>${escapeHtml(r.expiryDate || "—")}</td>
                <td class="num"><strong>${num(r.qty)}</strong> ${escapeHtml(r.unit || "шт")}</td>
              </tr>
            `).join("") : `<tr><td colspan="6"><div class="whm-empty">Выбери дату для построения отчёта.</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}
