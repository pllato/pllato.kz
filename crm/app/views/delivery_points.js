// Pllato CRM · Раздел «Точки доставки». Список + форма.
// Привязка к клиенту, обязательное поле в заявке.

import { Store } from "../store.js";
import {
  listDeliveryPoints, getDeliveryPoint, saveDeliveryPoint, deleteDeliveryPoint,
} from "../delivery_points.js";

const state = { editingId: null, filterContactId: "" };

function esc(s){return String(s ?? "").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

function getContactName(id) {
  if (!id) return "—";
  const c = Store.get("contacts", id);
  return c?.name || c?.company || "—";
}

export function renderDeliveryPointsView() {
  if (state.editingId) {
    const point = state.editingId === "new" ? null : getDeliveryPoint(state.editingId);
    return renderForm(point);
  }
  const all = listDeliveryPoints({ contactId: state.filterContactId });

  return `
    <section style="padding:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <div>
          <h2 style="margin:0">Точки доставки <span style="font-size:14px;color:var(--text-muted);font-weight:500">(${all.length})</span></h2>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">
            Адреса доставки клиентов. Одно юр.лицо — много точек (аптечные сети).
          </div>
        </div>
        <button type="button" class="btn-primary" data-dp-new>+ Новая точка</button>
      </div>

      ${all.length === 0 ? `
        <div style="background:var(--surface);border:1px dashed var(--border);border-radius:12px;padding:40px;text-align:center;color:var(--text-muted)">
          📍 Точек доставки пока нет.<br>
          <span style="font-size:13px">Добавьте точки чтобы при создании заявки можно было выбрать адрес фактической доставки.</span>
        </div>
      ` : `
        <table class="whm-table" style="width:100%">
          <thead>
            <tr>
              <th>Название / ориентир</th>
              <th>Клиент</th>
              <th>Адрес</th>
              <th>Контактное лицо</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${all.map((p) => `
              <tr>
                <td>
                  <strong>${esc(p.label || "—")}</strong>
                  ${p.isPrimary ? `<span style="color:var(--accent);font-size:11px;margin-left:6px">★ основная</span>` : ""}
                  ${p.landmark ? `<div style="font-size:12px;color:var(--text-muted)">${esc(p.landmark)}</div>` : ""}
                </td>
                <td>${esc(getContactName(p.contactId))}</td>
                <td>
                  ${p.city ? `<div>${esc(p.city)}${p.district ? `, ${esc(p.district)}` : ""}</div>` : ""}
                  <div>${esc(p.address || "—")}</div>
                </td>
                <td>
                  ${p.contactPersonName ? esc(p.contactPersonName) : "—"}
                  ${p.contactPersonPhone ? `<br><small>${esc(p.contactPersonPhone)}</small>` : ""}
                </td>
                <td>
                  <button type="button" class="btn-ghost btn-sm" data-dp-edit="${esc(p.id)}">Изм.</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `}
    </section>
  `;
}

function renderForm(point) {
  const p = point || {};
  const contacts = Store.list("contacts").filter((x) => !x.deletedAt).slice(0, 1000);

  return `
    <section style="padding:18px;max-width:680px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="margin:0">${point ? "Изменить точку доставки" : "Новая точка доставки"}</h2>
        <button type="button" class="btn-ghost" data-dp-cancel>← Назад</button>
      </div>

      <form data-dp-form data-dp-id="${esc(p.id || "")}" class="whm-card" style="padding:18px;display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div style="grid-column:1/-1">
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Клиент *</label>
          <select name="contactId" required style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px">
            <option value="">— выбери клиента —</option>
            ${contacts.map((x) => `<option value="${esc(x.id)}" ${x.id === p.contactId ? "selected" : ""}>${esc(x.name || x.company || x.email || "—")}</option>`).join("")}
          </select>
        </div>

        <div style="grid-column:1/-1">
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Название точки / ориентир</label>
          <input type="text" name="label" value="${esc(p.label || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px" placeholder="напр. Аптека «Талды», у Саши">
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Город</label>
          <input type="text" name="city" value="${esc(p.city || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px" placeholder="напр. Алматы">
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Район</label>
          <input type="text" name="district" value="${esc(p.district || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px" placeholder="напр. Бостандыкский">
        </div>

        <div style="grid-column:1/-1">
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Адрес * (улица, дом)</label>
          <input type="text" name="address" required value="${esc(p.address || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px" placeholder="напр. ул. Жароков 181">
        </div>

        <div style="grid-column:1/-1">
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Ориентир для водителя</label>
          <input type="text" name="landmark" value="${esc(p.landmark || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px" placeholder="напр. вход со стороны парковки, у Саши, 2-я точка">
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Контактное лицо</label>
          <input type="text" name="contactPersonName" value="${esc(p.contactPersonName || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px" placeholder="напр. Айгуль">
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Телефон точки</label>
          <input type="tel" name="contactPersonPhone" value="${esc(p.contactPersonPhone || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px" placeholder="+7 (727) 000-00-00">
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Часы работы</label>
          <input type="text" name="workHours" value="${esc(p.workHours || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px" placeholder="напр. 9:00-21:00">
        </div>

        <div>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin-top:20px">
            <input type="checkbox" name="isPrimary" ${p.isPrimary ? "checked" : ""}>
            ★ Основная точка клиента
          </label>
        </div>

        <div style="grid-column:1/-1">
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Комментарий</label>
          <textarea name="note" rows="2" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-family:inherit">${esc(p.note || "")}</textarea>
        </div>

        <div style="grid-column:1/-1;display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
          ${point ? `<button type="button" class="btn-ghost danger" data-dp-delete="${esc(p.id)}">Удалить</button>` : ""}
          <button type="button" class="btn-ghost" data-dp-cancel>Отмена</button>
          <button type="submit" class="btn-primary">${point ? "Сохранить" : "Создать"}</button>
        </div>
      </form>
    </section>
  `;
}

export function wireDeliveryPointsEvents(container) {
  if (container.dataset.dpWired === "1") return;
  container.dataset.dpWired = "1";

  container.addEventListener("click", (e) => {
    if (e.target.closest("[data-dp-new]")) { state.editingId = "new"; rerender(container); return; }
    if (e.target.closest("[data-dp-cancel]")) { state.editingId = null; rerender(container); return; }
    const editBtn = e.target.closest("[data-dp-edit]");
    if (editBtn) { state.editingId = editBtn.dataset.dpEdit; rerender(container); return; }
    const delBtn = e.target.closest("[data-dp-delete]");
    if (delBtn) {
      if (!confirm("Удалить точку доставки?")) return;
      deleteDeliveryPoint(delBtn.dataset.dpDelete);
      state.editingId = null;
      rerender(container);
      return;
    }
  });

  container.addEventListener("submit", (e) => {
    if (!e.target.matches("[data-dp-form]")) return;
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      id: e.target.dataset.dpId || undefined,
      contactId: fd.get("contactId") || "",
      label: fd.get("label") || "",
      city: fd.get("city") || "",
      district: fd.get("district") || "",
      address: fd.get("address") || "",
      landmark: fd.get("landmark") || "",
      contactPersonName: fd.get("contactPersonName") || "",
      contactPersonPhone: fd.get("contactPersonPhone") || "",
      workHours: fd.get("workHours") || "",
      note: fd.get("note") || "",
      isPrimary: fd.get("isPrimary") === "on",
    };
    try {
      saveDeliveryPoint(payload);
      state.editingId = null;
      rerender(container);
    } catch (err) {
      alert(err?.message || String(err));
    }
  });
}

function rerender(container) {
  container.innerHTML = renderDeliveryPointsView();
}
