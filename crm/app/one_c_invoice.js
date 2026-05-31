// Pllato CRM · создание «Счёта на оплату покупателю» в 1С из карточки заказа.
//
// Этап 2 интеграции с 1С (OData). Счёт создаётся ЧЕРНОВИКОМ (Posted=false) —
// бухгалтер Асем проверяет и проводит в 1С. Везде, где есть неоднозначность
// (номенклатура попартийная, выбор юр.лица), стоят пометки «на проверку Асем».
//
// Резолв ссылок 1С (GUID Ref_Key):
//   — контрагент  ← contact._1c_ref_key (контакт, импортированный из 1С)
//   — номенклатура← warehouse_product._1c_ref_key (проставлен матчингом sku↔1С)
//   — юр.лицо     ← выбор из organizations_1c (или дефолт, на проверку)
//   — валюта      ← KZT (константа базы Аминамед)
//
// Бэкенд идемпотентен по externalId (=dealId): повторный вызов вернёт уже
// созданный счёт, дубля не будет.

import { Store } from "./store.js";
import { apiFetch } from "./auth.js";

// Подтверждённые GUID базы Аминамед (ea186/263825). ⚠ На проверку Асем.
const ONE_C_KZT_REF = "9e9a6ffb-aa56-11e1-b9c4-002215ba1bbe";
const ONE_C_ORG_FALLBACK = [
  { ref: "8678efaa-9684-4325-a198-7f3c8a1bc2f3", name: "ТОО Аминамед (вариант 1)" },
  { ref: "67861586-eba3-11f0-b296-005056815627", name: "ТОО Аминамед (вариант 2)" },
];

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmtNum(n) {
  return new Intl.NumberFormat("ru-RU").format(Math.round((Number(n) || 0) * 100) / 100);
}

// Список организаций 1С для выбора юр.лица-отправителя.
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

// Готовит строки счёта из позиций заказа, помечая сопоставленность с 1С.
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
    if (!ref) {
      unmatched.push({ name, sku: product?.sku || "" });
      continue;
    }
    if (product?._1c_match_ambiguous) ambiguous.push(name);
    lines.push({
      productRef: ref,
      unitRef: product?._1c_unit_ref || null,
      vatRateRef: product?._1c_vat_ref || null,
      qty,
      price,
      sum: Math.round(qty * price * 100) / 100,
      name,
    });
  }
  return { lines, unmatched, ambiguous };
}

function closeDialog() {
  document.getElementById("onec-invoice-overlay")?.remove();
}

/**
 * Открывает диалог создания счёта в 1С.
 * @param {object} ctx { deal, items, contact, onDone }
 */
export function openCreateInvoiceDialog({ deal, items, contact, onDone }) {
  if (!deal) return;
  closeDialog();

  const contractorRef = contact?._1c_ref_key || null;
  const { lines, unmatched, ambiguous } = buildLines(items || []);
  const orgs = listOneCOrgs();
  const total = lines.reduce((s, l) => s + (l.sum || 0), 0);
  const alreadyNum = deal.oneCInvoiceNumber || null;

  const blockers = [];
  if (!contractorRef) blockers.push("Клиент не сопоставлен с 1С (нет ссылки на контрагента). Импортируйте контрагентов из 1С или создайте клиента в 1С.");
  if (lines.length === 0) blockers.push("Ни одна позиция заказа не сопоставлена с номенклатурой 1С.");

  const overlay = document.createElement("div");
  overlay.id = "onec-invoice-overlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px";
  overlay.innerHTML = `
    <div style="background:var(--surface,#fff);color:var(--text,#111);border:1px solid var(--border,#ddd);border-radius:12px;max-width:680px;width:100%;max-height:88vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border,#eee);display:flex;justify-content:space-between;align-items:center">
        <strong style="font-size:16px">Создать счёт на оплату в 1С</strong>
        <button type="button" id="onec-x" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted,#888)">✕</button>
      </div>
      <div style="padding:18px 20px">
        ${alreadyNum ? `<div style="background:#e8f5e9;border:1px solid #16a34a;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:13px;color:#15803d">✓ По этому заказу уже создан счёт 1С № <strong>${esc(alreadyNum)}</strong>. Повторное создание вернёт его же (без дубля).</div>` : ""}

        <div style="font-size:13px;color:var(--text-muted,#666);margin-bottom:4px">Клиент (контрагент 1С)</div>
        <div style="font-weight:600;margin-bottom:14px">${esc(contact?.name || deal.title || "—")}${contractorRef ? "" : ` <span style="color:#dc2626">— не найден в 1С</span>`}</div>

        <label style="display:block;font-size:13px;color:var(--text-muted,#666);margin-bottom:4px">Юр.лицо-отправитель (организация 1С) <span style="color:#f59e0b">⚠ проверьте</span></label>
        <select id="onec-org" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:14px;font:inherit;background:var(--surface,#fff);color:var(--text,#111)">
          ${orgs.map((o) => `<option value="${esc(o.ref)}">${esc(o.name)}</option>`).join("")}
        </select>

        <div style="font-size:13px;color:var(--text-muted,#666);margin-bottom:6px">Позиции (${lines.length} из ${(items || []).filter((i) => (Number(i.qty) || 0) > 0).length})</div>
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
          ⚠ <strong>${unmatched.length}</strong> позиц. не сопоставлены с 1С и НЕ войдут в счёт: ${unmatched.slice(0, 6).map((u) => esc(u.name)).join("; ")}${unmatched.length > 6 ? "…" : ""}.
          Сопоставьте их в «1С интеграция → Сопоставить» или добавьте в 1С.
        </div>` : ""}

        <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:11px 13px;margin-top:8px;font-size:12.5px;color:#9a3412;line-height:1.5">
          📝 <strong>На проверку Асем:</strong> счёт создаётся <strong>черновиком</strong> (не проведён). Номенклатура 1С ведётся попартийно — для части позиций подставлена представительная запись (⚠), серию/партию и юр.лицо проверьте и поправьте в 1С. Договор и склад не задаются — при необходимости укажите вручную.
        </div>

        ${blockers.length ? `<div style="background:#ffebee;border:1px solid #dc2626;border-radius:8px;padding:10px 12px;margin-top:12px;font-size:12.5px;color:#b91c1c">
          ${blockers.map((b) => `• ${esc(b)}`).join("<br>")}
        </div>` : ""}
      </div>
      <div style="padding:14px 20px;border-top:1px solid var(--border,#eee);display:flex;justify-content:flex-end;gap:8px">
        <button type="button" id="onec-cancel" class="btn-ghost" style="padding:8px 14px">Отмена</button>
        <button type="button" id="onec-create" class="btn-primary" style="padding:8px 16px" ${blockers.length ? "disabled" : ""}>📄 Создать счёт (черновик)</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector("#onec-x").addEventListener("click", closeDialog);
  overlay.querySelector("#onec-cancel").addEventListener("click", closeDialog);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeDialog(); });

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
        contractorRef,
        comment: "Создано из Pllato CRM (черновик). Проверить номенклатуру/серии — Асем.",
        post: false,
        lines: lines.map((l) => ({
          productRef: l.productRef,
          unitRef: l.unitRef,
          vatRateRef: l.vatRateRef,
          qty: l.qty,
          price: l.price,
          sum: l.sum,
          name: l.name,
        })),
      };
      const res = await apiFetch("/api/crm/1c/invoices/create", { method: "POST", body: payload });
      const num = res?.number || "(без номера)";
      try {
        Store.update("deals", deal.id, {
          oneCInvoiceRef: res?.ref_key || null,
          oneCInvoiceNumber: res?.number || null,
          oneCInvoiceAt: Date.now(),
        });
      } catch {}
      closeDialog();
      alert(`✓ Счёт в 1С создан (черновик): № ${num}.\n\nОткройте 1С, проверьте номенклатуру/серии и юр.лицо, затем проведите.`);
      if (typeof onDone === "function") onDone(res);
    } catch (err) {
      createBtn.disabled = false;
      createBtn.textContent = "📄 Создать счёт (черновик)";
      alert("Не удалось создать счёт в 1С: " + (err?.message || String(err)));
    }
  });
}
