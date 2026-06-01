// Pllato CRM · создание документов 1С из карточки заказа (OData, Этап 2).
//
// Поддерживает два документа одним диалогом:
//   docType="invoice"     → Счёт на оплату покупателю
//   docType="realization" → Реализация товаров и услуг (отгрузка)
//
// Документ создаётся ЧЕРНОВИКОМ (Posted=false) — бухгалтер Асем проверяет, правит
// номенклатуру/серии/бухсчета и проводит в 1С. Везде пометки «на проверку Асем».
//
// Если клиент ещё не сопоставлен с 1С — прямо в диалоге кнопка «Создать клиента
// в 1С» (POST /contractors/create), после чего документ можно создать.

import { Store } from "./store.js";
import { apiFetch } from "./auth.js";

// Подтверждённые GUID базы Аминамед (ea186/263825). ⚠ На проверку Асем.
const ONE_C_KZT_REF = "9e9a6ffb-aa56-11e1-b9c4-002215ba1bbe";
const ONE_C_ORG_FALLBACK = [
  { ref: "8678efaa-9684-4325-a198-7f3c8a1bc2f3", name: "ТОО Аминамед (вариант 1)" },
  { ref: "67861586-eba3-11f0-b296-005056815627", name: "ТОО Аминамед (вариант 2)" },
];

const DOC_META = {
  invoice: {
    endpoint: "/api/crm/1c/invoices/create",
    title: "Создать счёт на оплату в 1С",
    btn: "📄 Создать счёт (черновик)",
    refField: "oneCInvoiceRef",
    numField: "oneCInvoiceNumber",
    atField: "oneCInvoiceAt",
    word: "Счёт",
  },
  realization: {
    endpoint: "/api/crm/1c/realizations/create",
    title: "Создать реализацию (отгрузку) в 1С",
    btn: "📦 Создать реализацию (черновик)",
    refField: "oneCRealizationRef",
    numField: "oneCRealizationNumber",
    atField: "oneCRealizationAt",
    word: "Реализация",
  },
};

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmtNum(n) {
  return new Intl.NumberFormat("ru-RU").format(Math.round((Number(n) || 0) * 100) / 100);
}

function listOneCOrgs() {
  let orgs = [];
  try {
    orgs = (Store.list("organizations_1c") || [])
      .filter((o) => !o.deletion_mark)
      .map((o) => ({ ref: o._1c_ref_key || o.ref_key, name: o.name || o.full_name || "(без названия)" }))
      .filter((o) => o.ref);
  } catch { orgs = []; }
  return orgs.length > 0 ? orgs : ONE_C_ORG_FALLBACK;
}

function buildLines(items) {
  const lines = [];
  const unmatched = [];
  const ambiguous = [];
  for (const it of items) {
    const qty = Number(it.qty) || 0;
    const price = Number(it.unitPrice) || 0;
    if (qty <= 0) continue;
    const product = it.productId ? Store.get("warehouse_products", it.productId) : null;
    const name = product?.name || it.name || "Позиция";
    const ref = product?._1c_ref_key || null;
    if (!ref) { unmatched.push({ name }); continue; }
    if (product?._1c_match_ambiguous) ambiguous.push(name);
    lines.push({
      productRef: ref,
      unitRef: product?._1c_unit_ref || null,
      vatRateRef: product?._1c_vat_ref || null,
      qty, price,
      sum: Math.round(qty * price * 100) / 100,
      name,
    });
  }
  return { lines, unmatched, ambiguous };
}

function closeDialog() {
  document.getElementById("onec-doc-overlay")?.remove();
}

/**
 * Универсальный диалог создания документа 1С.
 * @param {object} ctx { deal, items, contact, docType: "invoice"|"realization", onDone }
 */
export function openCreateOneCDocDialog({ deal, items, contact, docType = "invoice", onDone }) {
  if (!deal) return;
  const meta = DOC_META[docType] || DOC_META.invoice;
  closeDialog();

  const { lines, unmatched, ambiguous } = buildLines(items || []);
  const orgs = listOneCOrgs();
  const total = lines.reduce((s, l) => s + (l.sum || 0), 0);
  const activeCount = (items || []).filter((i) => (Number(i.qty) || 0) > 0).length;

  const state = { contractorRef: contact?._1c_ref_key || null, busyContractor: false, contractorMsg: "" };

  const overlay = document.createElement("div");
  overlay.id = "onec-doc-overlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px";
  document.body.appendChild(overlay);

  function render() {
    const alreadyNum = deal[meta.numField] || null;
    const hasContractor = !!state.contractorRef;
    const blockers = [];
    if (lines.length === 0) blockers.push("Ни одна позиция заказа не сопоставлена с номенклатурой 1С.");
    if (!hasContractor) blockers.push("Клиент не сопоставлен с 1С.");

    overlay.innerHTML = `
      <div style="background:var(--surface,#fff);color:var(--text,#111);border:1px solid var(--border,#ddd);border-radius:12px;max-width:680px;width:100%;max-height:88vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border,#eee);display:flex;justify-content:space-between;align-items:center">
          <strong style="font-size:16px">${esc(meta.title)}</strong>
          <button type="button" id="onec-x" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted,#888)">✕</button>
        </div>
        <div style="padding:18px 20px">
          ${alreadyNum ? `<div style="background:#e8f5e9;border:1px solid #16a34a;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:13px;color:#15803d">✓ По этому заказу уже создан документ 1С № <strong>${esc(alreadyNum)}</strong>. Повторное создание вернёт его же (без дубля).</div>` : ""}

          <div style="font-size:13px;color:var(--text-muted,#666);margin-bottom:4px">Клиент (контрагент 1С)</div>
          <div style="font-weight:600;margin-bottom:6px">${esc(contact?.name || deal.title || "—")}${hasContractor ? ` <span style="color:#16a34a">✓ в 1С</span>` : ` <span style="color:#dc2626">— не найден в 1С</span>`}</div>
          ${!hasContractor ? `<div style="margin-bottom:14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <button type="button" id="onec-find-contractor" class="btn-ghost" style="padding:6px 12px;font-size:13px" ${state.busyContractor ? "disabled" : ""}>🔍 Найти в 1С по БИН</button>
            <button type="button" id="onec-create-contractor" class="btn-ghost" style="padding:6px 12px;font-size:13px" ${state.busyContractor ? "disabled" : ""}>➕ Создать в 1С</button>
            <span style="font-size:11.5px;color:var(--text-muted,#888)">${esc(state.contractorMsg || "найдём по БИН или заведём нового")}</span>
          </div>` : `<div style="margin-bottom:14px"></div>`}

          <label style="display:block;font-size:13px;color:var(--text-muted,#666);margin-bottom:4px">Юр.лицо-отправитель (организация 1С) <span style="color:#f59e0b">⚠ проверьте</span></label>
          <select id="onec-org" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:14px;font:inherit;background:var(--surface,#fff);color:var(--text,#111)">
            ${orgs.map((o) => `<option value="${esc(o.ref)}">${esc(o.name)}</option>`).join("")}
          </select>

          <div style="font-size:13px;color:var(--text-muted,#666);margin-bottom:6px">Позиции (${lines.length} из ${activeCount})</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:6px">
            <thead><tr style="text-align:left;color:var(--text-muted,#888)">
              <th style="padding:4px 6px">Товар</th><th style="padding:4px 6px;text-align:right">Кол-во</th><th style="padding:4px 6px;text-align:right">Цена</th><th style="padding:4px 6px;text-align:right">Сумма</th>
            </tr></thead>
            <tbody>
              ${lines.map((l) => `<tr style="border-top:1px solid var(--border,#eee)">
                <td style="padding:5px 6px">${esc(l.name)}${ambiguous.includes(l.name) ? ` <span title="Артикул в 1С неоднозначен (партии) — запись представительная, проверьте" style="color:#f59e0b">⚠</span>` : ""}</td>
                <td style="padding:5px 6px;text-align:right">${fmtNum(l.qty)}</td>
                <td style="padding:5px 6px;text-align:right">${fmtNum(l.price)}</td>
                <td style="padding:5px 6px;text-align:right">${fmtNum(l.sum)}</td>
              </tr>`).join("")}
            </tbody>
            <tfoot><tr style="border-top:2px solid var(--border,#ddd);font-weight:700">
              <td style="padding:6px" colspan="3">Итого</td><td style="padding:6px;text-align:right">${fmtNum(total)} ₸</td>
            </tr></tfoot>
          </table>

          ${unmatched.length ? `<div style="background:#fff3e0;border:1px solid #f59e0b;border-radius:8px;padding:10px 12px;margin:10px 0;font-size:12.5px;color:#92400e">
            ⚠ <strong>${unmatched.length}</strong> позиц. не сопоставлены с 1С и НЕ войдут в документ: ${unmatched.slice(0, 6).map((u) => esc(u.name)).join("; ")}${unmatched.length > 6 ? "…" : ""}.
            Сопоставьте их в «1С интеграция → Сопоставить / Привязать вручную».
          </div>` : ""}

          <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:11px 13px;margin-top:8px;font-size:12.5px;color:#9a3412;line-height:1.5">
            📝 <strong>На проверку Асем:</strong> документ создаётся <strong>черновиком</strong> (не проведён). Номенклатура 1С попартийная — у части позиций представительная запись (⚠), серию/партию, бухсчета и юр.лицо проверьте и поправьте в 1С. Договор и склад не задаются.
          </div>
        </div>
        <div style="padding:14px 20px;border-top:1px solid var(--border,#eee);display:flex;justify-content:flex-end;gap:8px">
          <button type="button" id="onec-cancel" class="btn-ghost" style="padding:8px 14px">Отмена</button>
          <button type="button" id="onec-create" class="btn-primary" style="padding:8px 16px" ${blockers.length ? "disabled title='" + esc(blockers.join(" ")) + "'" : ""}>${esc(meta.btn)}</button>
        </div>
      </div>
    `;

    overlay.querySelector("#onec-x").addEventListener("click", closeDialog);
    overlay.querySelector("#onec-cancel").addEventListener("click", closeDialog);

    // Поиск контрагента в 1С по БИН (решение встречи 01.06).
    overlay.querySelector("#onec-find-contractor")?.addEventListener("click", async () => {
      if (!contact?.id) { alert("У клиента нет id в CRM."); return; }
      state.busyContractor = true; state.contractorMsg = "Ищем в 1С по БИН…"; render();
      try {
        const res = await apiFetch("/api/crm/1c/contractors/find", { method: "POST", body: { contactId: contact.id } });
        if (res?.found) {
          state.contractorRef = res.ref_key;
          try { Store.update("contacts", contact.id, { _1c_ref_key: res.ref_key }); } catch {}
          state.busyContractor = false; state.contractorMsg = "";
        } else {
          state.busyContractor = false;
          state.contractorMsg = res?.reason === "no_bin"
            ? "У клиента нет БИН в карточке — заполните или создайте нового"
            : "По БИН не найден — создайте нового";
        }
        render();
      } catch (err) {
        state.busyContractor = false; state.contractorMsg = "Ошибка поиска"; render();
        alert("Ошибка поиска по БИН: " + (err?.message || String(err)));
      }
    });

    // Создание контрагента в 1С прямо отсюда
    overlay.querySelector("#onec-create-contractor")?.addEventListener("click", async () => {
      if (!contact?.id) { alert("У клиента нет id в CRM."); return; }
      state.busyContractor = true; state.contractorMsg = "Создаём в 1С…"; render();
      try {
        const res = await apiFetch("/api/crm/1c/contractors/create", { method: "POST", body: { contactId: contact.id } });
        state.contractorRef = res?.ref_key || null;
        try { Store.update("contacts", contact.id, { _1c_ref_key: res?.ref_key || null }); } catch {}
        state.busyContractor = false; state.contractorMsg = "";
        render();
      } catch (err) {
        state.busyContractor = false; state.contractorMsg = "";
        render();
        alert("Не удалось создать контрагента в 1С: " + (err?.message || String(err)));
      }
    });

    const createBtn = overlay.querySelector("#onec-create");
    createBtn?.addEventListener("click", async () => {
      const organizationRef = overlay.querySelector("#onec-org").value;
      createBtn.disabled = true;
      createBtn.textContent = "Создаём в 1С…";
      try {
        const payload = {
          externalId: deal.id,
          organizationRef,
          currencyRef: ONE_C_KZT_REF,
          contractorRef: state.contractorRef,
          comment: "Создано из Pllato CRM (черновик). Проверить номенклатуру/серии — Асем.",
          post: false,
          lines: lines.map((l) => ({
            productRef: l.productRef, unitRef: l.unitRef, vatRateRef: l.vatRateRef,
            qty: l.qty, price: l.price, sum: l.sum, name: l.name,
          })),
        };
        const res = await apiFetch(meta.endpoint, { method: "POST", body: payload });
        const num = res?.number || "(без номера)";
        try {
          Store.update("deals", deal.id, {
            [meta.refField]: res?.ref_key || null,
            [meta.numField]: res?.number || null,
            [meta.atField]: Date.now(),
          });
        } catch {}
        closeDialog();
        alert(`✓ ${meta.word} в 1С создан(а) черновиком: № ${num}.\n\nОткройте 1С, проверьте номенклатуру/серии/юр.лицо и проведите.`);
        if (typeof onDone === "function") onDone(res);
      } catch (err) {
        createBtn.disabled = false;
        createBtn.textContent = meta.btn;
        alert("Не удалось создать документ в 1С: " + (err?.message || String(err)));
      }
    });
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeDialog(); });
  render();
}

// Обратная совместимость: счёт.
export function openCreateInvoiceDialog(ctx) {
  return openCreateOneCDocDialog({ ...ctx, docType: "invoice" });
}
