// Pllato CRM · Раздел «Договоры». Список + форма редактирования.
// Привязка к контактам, юр.лицам и видам оплаты.

import { Store } from "../store.js";
import {
  listContracts, getContract, saveContract, deleteContract, archiveContract,
  contractsProgress,
} from "../contracts.js";
import { listPaymentTerms, getPaymentTerm, PAYMENT_KIND } from "../payment_terms.js";
import { listOrganizations, getOrganization } from "../organizations.js";

const state = {
  editingId: null, // null | "new" | "<id>"
  filterContactId: "",
  filterOrgId: "",
};

function esc(s){return String(s ?? "").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function fmtDate(s){if(!s)return"—";try{return new Date(s+"T00:00:00").toLocaleDateString("ru-RU");}catch{return s;}}

function getContactName(id) {
  if (!id) return "—";
  const c = Store.get("contacts", id);
  return c?.name || c?.company || "—";
}

export function renderContractsView() {
  if (state.editingId) {
    const contract = state.editingId === "new" ? null : getContract(state.editingId);
    return renderForm(contract);
  }

  const all = listContracts({ contactId: state.filterContactId, organizationId: state.filterOrgId });

  return `
    <section class="contracts-view" style="padding:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <div>
          <h2 style="margin:0">Договоры <span style="font-size:14px;color:var(--text-muted);font-weight:500">(${all.length})</span></h2>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">
            Привязка к клиенту, типу оплаты и юр.лицу-отправителю
          </div>
        </div>
        <button type="button" class="btn-primary" data-contracts-new>+ Новый договор</button>
      </div>

      ${all.length === 0 ? `
        <div style="background:var(--surface);border:1px dashed var(--border);border-radius:12px;padding:40px;text-align:center;color:var(--text-muted)">
          📋 Договоров пока нет.<br>
          <span style="font-size:13px">Создайте первый — он понадобится для модуля «Дебиторская задолженность» и автоматического подтягивания типа оплаты в заявку.</span>
        </div>
      ` : `
        <table class="whm-table" style="width:100%">
          <thead>
            <tr>
              <th>№ / Название</th>
              <th>Клиент</th>
              <th>Юр.лицо</th>
              <th>Тип оплаты</th>
              <th>Действует</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${all.map((c) => {
              const pt = getPaymentTerm(c.paymentTermId);
              const org = getOrganization(c.organizationId);
              return `
                <tr>
                  <td>
                    <strong>${esc(c.number || c.title || "—")}</strong>
                    ${c.number && c.title ? `<div style="font-size:12px;color:var(--text-muted)">${esc(c.title)}</div>` : ""}
                  </td>
                  <td>${esc(getContactName(c.contactId))}</td>
                  <td>${esc(org?.shortName || "—")}</td>
                  <td>${esc(pt?.label || "—")}${c.paymentDays ? `<br><small>${c.paymentDays} дней</small>` : ""}</td>
                  <td>${fmtDate(c.startDate)} — ${fmtDate(c.endDate) || "бессрочно"}</td>
                  <td>${c.status === "archived" ? "🗄 Архив" : "✓ Активен"}</td>
                  <td>
                    <button type="button" class="btn-ghost btn-sm" data-contracts-edit="${esc(c.id)}">Изм.</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      `}
    </section>
  `;
}

function renderForm(contract) {
  const c = contract || {};
  const contacts = Store.list("contacts").filter((x) => !x.deletedAt).slice(0, 1000);
  const orgs = listOrganizations();
  const terms = listPaymentTerms();
  const showCustomDays = c.paymentTermId
    ? (getPaymentTerm(c.paymentTermId)?.kind === PAYMENT_KIND.CUSTOM_DAYS)
    : false;

  return `
    <section class="contracts-form" style="padding:18px;max-width:780px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="margin:0">${contract ? "Изменить договор" : "Новый договор"}</h2>
        <button type="button" class="btn-ghost" data-contracts-cancel>← Назад</button>
      </div>

      <form data-contracts-form data-contracts-id="${esc(c.id || "")}" class="whm-card" style="padding:18px;display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div style="grid-column:1/-1">
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Клиент *</label>
          <select name="contactId" required style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px">
            <option value="">— выбери клиента —</option>
            ${contacts.map((x) => `<option value="${esc(x.id)}" ${x.id === c.contactId ? "selected" : ""}>${esc(x.name || x.company || x.email || "—")}</option>`).join("")}
          </select>
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Номер договора</label>
          <input type="text" name="number" value="${esc(c.number || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px" placeholder="напр. №42 от 15.05.2026">
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Название (опционально)</label>
          <input type="text" name="title" value="${esc(c.title || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px" placeholder="напр. Основной договор поставки">
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Юр.лицо-отправитель</label>
          <select name="organizationId" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px">
            <option value="">— не выбрано —</option>
            ${orgs.map((o) => `<option value="${esc(o.id)}" ${o.id === c.organizationId ? "selected" : ""}>${esc(o.shortName)}</option>`).join("")}
          </select>
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Тип оплаты *</label>
          <select name="paymentTermId" required style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px" data-contracts-payment-select>
            <option value="">— выбери тип —</option>
            ${terms.map((t) => `<option value="${esc(t.id)}" data-kind="${esc(t.kind)}" ${t.id === c.paymentTermId ? "selected" : ""}>${esc(t.label)}</option>`).join("")}
          </select>
        </div>

        <div style="${showCustomDays ? "" : "display:none"}" data-contracts-custom-days>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Срок (дней) для ручного варианта</label>
          <input type="number" name="paymentDays" value="${c.paymentDays || ""}" min="0" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px" placeholder="напр. 14">
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Действует с</label>
          <input type="date" name="startDate" value="${esc(c.startDate || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px">
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Действует до (пусто = бессрочно)</label>
          <input type="date" name="endDate" value="${esc(c.endDate || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px">
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Уровень цен</label>
          <select name="priceTier" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px">
            <option value="default" ${c.priceTier === "default" || !c.priceTier ? "selected" : ""}>По умолчанию</option>
            <option value="distributor" ${c.priceTier === "distributor" ? "selected" : ""}>Дистрибьюторский</option>
            <option value="hospital" ${c.priceTier === "hospital" ? "selected" : ""}>Больничный</option>
            <option value="retail" ${c.priceTier === "retail" ? "selected" : ""}>Розничный</option>
          </select>
        </div>

        <div>
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Скидка по умолчанию, %</label>
          <input type="number" name="discountPct" value="${c.discountPct || 0}" min="0" max="100" step="0.5" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px">
        </div>

        <div style="grid-column:1/-1">
          <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px">Комментарий</label>
          <textarea name="note" rows="2" style="width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-family:inherit">${esc(c.note || "")}</textarea>
        </div>

        <div style="grid-column:1/-1;display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
          ${contract ? `<button type="button" class="btn-ghost danger" data-contracts-delete="${esc(c.id)}">Удалить</button>` : ""}
          <button type="button" class="btn-ghost" data-contracts-cancel>Отмена</button>
          <button type="submit" class="btn-primary">${contract ? "Сохранить" : "Создать"}</button>
        </div>
      </form>
    </section>
  `;
}

export function wireContractsEvents(container) {
  if (container.dataset.contractsWired === "1") return;
  container.dataset.contractsWired = "1";

  container.addEventListener("click", (e) => {
    if (e.target.closest("[data-contracts-new]")) { state.editingId = "new"; rerender(container); return; }
    if (e.target.closest("[data-contracts-cancel]")) { state.editingId = null; rerender(container); return; }
    const editBtn = e.target.closest("[data-contracts-edit]");
    if (editBtn) { state.editingId = editBtn.dataset.contractsEdit; rerender(container); return; }
    const delBtn = e.target.closest("[data-contracts-delete]");
    if (delBtn) {
      if (!confirm("Удалить договор?")) return;
      deleteContract(delBtn.dataset.contractsDelete);
      state.editingId = null;
      rerender(container);
      return;
    }
  });

  container.addEventListener("change", (e) => {
    if (e.target.matches("[data-contracts-payment-select]")) {
      const opt = e.target.selectedOptions[0];
      const kind = opt?.dataset.kind;
      const box = container.querySelector("[data-contracts-custom-days]");
      if (box) box.style.display = kind === PAYMENT_KIND.CUSTOM_DAYS ? "" : "none";
    }
  });

  container.addEventListener("submit", (e) => {
    if (!e.target.matches("[data-contracts-form]")) return;
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      id: e.target.dataset.contractsId || undefined,
      contactId: fd.get("contactId") || "",
      number: fd.get("number") || "",
      title: fd.get("title") || "",
      organizationId: fd.get("organizationId") || "",
      paymentTermId: fd.get("paymentTermId") || "",
      paymentDays: fd.get("paymentDays") || null,
      startDate: fd.get("startDate") || "",
      endDate: fd.get("endDate") || "",
      priceTier: fd.get("priceTier") || "default",
      discountPct: fd.get("discountPct") || 0,
      note: fd.get("note") || "",
    };
    try {
      saveContract(payload);
      state.editingId = null;
      rerender(container);
    } catch (err) {
      alert(err?.message || String(err));
    }
  });
}

function rerender(container) {
  container.innerHTML = renderContractsView();
  // Wire больше не нужен — listener делегирован на container.
}
