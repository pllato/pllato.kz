import { ICONS } from "../../icons.js";
import { listWarehouseProducts, listWarehouseCategories } from "../../warehouse.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function num(n) {
  return new Intl.NumberFormat("ru-RU").format(Number(n) || 0);
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU");
}

function productStatus(summary, minStock) {
  if (!summary) return { cls: "", text: "—" };
  if (summary.total <= 0) return { cls: "is-danger", text: "нет остатка" };
  if (summary.expiredCount > 0) return { cls: "is-danger", text: "есть просрочка" };
  if (summary.total < (Number(minStock) || 0)) return { cls: "is-warning", text: "ниже min" };
  return { cls: "is-ok", text: summary.nearestExpiry ? `до ${fmtDate(summary.nearestExpiry)}` : "в норме" };
}

function renderProductModal(state) {
  if (!state.productFormOpen) return "";
  const d = state.productDraft || {};
  const editing = Boolean(d.id);

  return `
    <div class="modal-backdrop" data-wh-product-backdrop>
      <div class="modal wh-modal" role="dialog" aria-modal="true" style="max-width:680px">
        <header class="modal-header">
          <h2>${editing ? "Редактирование товара" : "Новый товар"}</h2>
          <button type="button" class="btn-ghost icon-only" data-wh-close-product>${ICONS.x}</button>
        </header>
        <form class="form-grid wh-form-grid" data-wh-product-form>
          <input type="hidden" name="id" value="${escapeAttr(d.id || "")}">
          <div class="field"><label class="flbl">SKU</label><input name="sku" required value="${escapeAttr(d.sku || "")}" placeholder="WHS-..."></div>
          <div class="field"><label class="flbl">Название</label><input name="name" required value="${escapeAttr(d.name || "")}" placeholder="Название товара"></div>
          <div class="field"><label class="flbl">Категория</label><input name="category" value="${escapeAttr(d.category || "")}" placeholder="Категория"></div>
          <div class="field"><label class="flbl">Юр.лицо</label>
            <select name="entity" required>
              <option value="">Выбери</option>
              <option value="ИП" ${d.entity === "ИП" ? "selected" : ""}>ИП</option>
              <option value="ТОО" ${d.entity === "ТОО" ? "selected" : ""}>ТОО</option>
            </select>
          </div>
          <div class="field"><label class="flbl">Единица</label><input name="unit" value="${escapeAttr(d.unit || "шт")}" placeholder="шт"></div>
          <div class="field"><label class="flbl">Фасовка</label><input name="pack" value="${escapeAttr(d.pack || "")}" placeholder="24шт/кор"></div>
          <div class="field"><label class="flbl">Минимальный остаток</label><input name="minStock" type="number" min="0" step="1" value="${escapeAttr(d.minStock ?? 0)}"></div>
          <div class="field field-wide"><label class="flbl">Описание</label><textarea name="description" rows="2" placeholder="Описание">${escapeHtml(d.description || "")}</textarea></div>
        </form>
        <footer class="modal-footer">
          <div class="muted" data-wh-product-error>${escapeHtml(state.productFormError || "")}</div>
          <div class="row">
            <button type="button" class="btn-ghost" data-wh-close-product>Отмена</button>
            <button type="button" class="btn-primary" data-wh-save-product>${ICONS.check}<span>Сохранить</span></button>
          </div>
        </footer>
      </div>
    </div>
  `;
}

export function renderProductsListView(state, canEdit) {
  const items = listWarehouseProducts({
    query: state.productQuery || "",
    entity: state.productEntity || "",
    category: state.productCategory || "",
    includeArchived: false,
  });
  const categories = listWarehouseCategories();

  return `
    <section class="whm-section">
      <div class="toolbar whm-toolbar">
        <label class="search-input whm-search">
          <span class="search-ico">${ICONS.search}</span>
          <input type="search" data-wh-filter="query" value="${escapeAttr(state.productQuery || "")}" placeholder="Поиск по SKU или названию">
        </label>
        <select data-wh-filter="entity">
          <option value="">Все юр.лица</option>
          <option value="ИП" ${state.productEntity === "ИП" ? "selected" : ""}>ИП</option>
          <option value="ТОО" ${state.productEntity === "ТОО" ? "selected" : ""}>ТОО</option>
        </select>
        <select data-wh-filter="category">
          <option value="">Все категории</option>
          ${categories.map((c) => `<option value="${escapeAttr(c)}" ${state.productCategory === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}
        </select>
        <div class="spacer"></div>
        <button type="button" class="btn-ghost" data-wh-open-import ${canEdit ? "" : "disabled"}>${ICONS.calendarClock}<span>Импорт</span></button>
        <button type="button" class="btn-primary" data-wh-open-product-form ${canEdit ? "" : "disabled"}>${ICONS.plus}<span>Новый товар</span></button>
      </div>

      <div class="whm-card">
        <table class="whm-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Товар</th>
              <th>Категория</th>
              <th>Юр.лицо</th>
              <th class="num">Остаток</th>
              <th class="num">Партии</th>
              <th>Срок/статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${items.length ? items.map((p) => {
              const st = productStatus(p.summary, p.minStock);
              return `
                <tr>
                  <td class="mono dim">${escapeHtml(p.sku || "—")}</td>
                  <td>
                    <div class="whm-product-name">${escapeHtml(p.name || "—")}</div>
                    <div class="whm-product-sub">min: ${num(p.minStock || 0)} ${escapeHtml(p.unit || "шт")}</div>
                  </td>
                  <td>${escapeHtml(p.category || "—")}</td>
                  <td><span class="chip">${escapeHtml(p.entity || "—")}</span></td>
                  <td class="num"><strong>${num(p.summary?.total || 0)}</strong></td>
                  <td class="num">${num(p.summary?.activeLots || 0)}</td>
                  <td><span class="whm-badge ${st.cls}">${escapeHtml(st.text)}</span></td>
                  <td class="num"><button type="button" class="btn-ghost btn-sm" data-wh-open-product="${escapeAttr(p.id)}">Открыть</button></td>
                </tr>
              `;
            }).join("") : `<tr><td colspan="8"><div class="whm-empty">Товары не найдены</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
    ${renderProductModal(state)}
  `;
}
