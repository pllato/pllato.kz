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
import { listDeliveryPointsForContact, saveDeliveryPoint, getDeliveryPoint } from "./delivery_points.js";

// Подтверждённые GUID базы Аминамед (ea186/263825). ⚠ На проверку Асем.
const ONE_C_KZT_REF = "9e9a6ffb-aa56-11e1-b9c4-002215ba1bbe";
// Ставка НДС по умолчанию 5% (Асем: 99% товаров — 5%). Если у товара есть своя
// ставка из 1С (_1c_vat_ref) — берём её, иначе этот дефолт.
export const ONE_C_VAT_5 = "34dffed7-e9fb-11f0-b296-005056815627";
// Справочник ставок НДС из 1С (разведано 04.06 inspect Catalog_СтавкиНДС).
// GUID-ы ОДИНАКОВЫ во всех 3 базах (проверено Аминамед/Алишерова/Баймуханова).
// Дефолт 5%; выбор document-level (применяется ко всем позициям).
export const ONE_C_VAT_RATES = [
  { ref: "34dffed7-e9fb-11f0-b296-005056815627", label: "5%" },
  { ref: "c4d32414-aa56-11e1-b9c4-002215ba1bbe", label: "0%" },
  { ref: "fecafe35-ec4d-11f0-b2a3-005056818aec", label: "10%" },
  { ref: "2aac9ae8-aa57-11e1-b9c4-002215ba1bbe", label: "12%" },
  { ref: "c4d32415-aa56-11e1-b9c4-002215ba1bbe", label: "13%" },
  { ref: "fecafe34-ec4d-11f0-b2a3-005056818aec", label: "16%" },
  { ref: "2aac9ae9-aa57-11e1-b9c4-002215ba1bbe", label: "Без НДС" },
];
// Юр.лица = базы 1С. Выбор базы роутит документ/контрагента/номенклатуру в неё
// (сервер сам подставит организацию-отправителя этой базы).
export const ONE_C_BASES_UI = [
  { key: "aminamed", label: "ТОО Аминамед" },
  { key: "alisherova", label: "ИП Алишерова" },
  { key: "baymukhanova", label: "ИП Баймуханова К.А." },
];

// Код назначения платежа (встреча Асем 04.06): 710 — товар (почти всегда),
// 859 — услуга (редко, бывает у Алишеровой). Дефолт 710.
export const PAYMENT_PURPOSE_OPTS = [
  { code: "710", label: "710 — реализация товаров" },
  { code: "859", label: "859 — реализация услуг" },
];

// Схема оплаты (встреча Асем 04.06): хранится на сделке, статус оплаты тянется
// из 1С опросом оплат. Постоплата — с конкретной датой (сроки у клиентов разные).
export const PAYMENT_SCHEMES = [
  { key: "prepay", label: "100% предоплата" },
  { key: "consignment", label: "Консигнация (оплата по факту продажи)" },
  { key: "postpay", label: "Постоплата (к дате)" },
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
  // Простая (бумажная) счёт-фактура выданная — на основании реализации.
  // Асем формирует на их основе ЭСФ вручную (по субботам).
  facture: {
    endpoint: "/api/crm/1c/factures/create",
    title: "Создать счёт-фактуру в 1С",
    btn: "🧾 Создать СФ (черновик)",
    refField: "oneCFactureRef",
    numField: "oneCFactureNumber",
    atField: "oneCFactureAt",
    word: "Счёт-фактура",
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

// Договоры 1С для выбранного контрагента (из импортированных contracts_1c).
export function listContractsFor(contractorRef) {
  if (!contractorRef) return [];
  try {
    return (Store.list("contracts_1c") || [])
      .filter((c) => !c.deletion_mark && !c.is_folder && c.contractor_ref === contractorRef)
      .map((c) => ({ ref: c._1c_ref_key || c.ref_key, label: [c.name, c.code].filter(Boolean).join(" · ") || "Договор" }))
      .filter((c) => c.ref);
  } catch { return []; }
}

// Поиск клиента (контакта CRM) по имени/БИН — для привязки заказа «на месте».
export function searchClientContacts(query) {
  const q = String(query || "").trim().toLowerCase();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, "");
  let list = [];
  try { list = Store.list("contacts") || []; } catch { list = []; }
  const out = [];
  for (const c of list) {
    if (c.deleted || c.trashed) continue;
    const name = String(c.name || "").toLowerCase();
    const note = String(c.note || "").toLowerCase();
    if (name.includes(q) || (digits.length >= 4 && note.replace(/\D/g, "").includes(digits))) out.push(c);
    if (out.length >= 20) break;
  }
  return out;
}
export function clientBinHint(c) {
  const m = String(c?.note || "").match(/\b\d{12}\b/);
  return m ? "БИН/ИИН " + m[0] : "";
}
function clientResultsHTML(results, query) {
  if (results.length) {
    return results.map((c) => `<button type="button" class="onec-client-pick" data-cid="${esc(c.id)}" style="display:flex;justify-content:space-between;gap:10px;width:100%;text-align:left;border:none;border-bottom:1px solid var(--border,#f0f0f0);background:none;padding:8px 10px;cursor:pointer;color:var(--text,#111);font:inherit"><span>${esc(c.name || "(без названия)")}</span><span style="color:var(--text-muted,#888);font-size:11.5px;white-space:nowrap">${esc(clientBinHint(c))}</span></button>`).join("");
  }
  return `<div style="padding:8px 10px;font-size:12px;color:var(--text-muted,#888)">${String(query || "").trim().length >= 2 ? "Не найдено — проверьте написание или заведите контакт в CRM." : ""}</div>`;
}

// Адрес доставки по умолчанию: первичная точка доставки контакта, иначе адрес из 1С.
function defaultDeliveryAddress(contact) {
  try {
    const pts = (Store.list("delivery_points") || []).filter((p) => p.contactId === contact?.id && !p.deleted);
    const primary = pts.find((p) => p.isPrimary) || pts[0];
    if (primary) return [primary.city, primary.address].filter(Boolean).join(", ");
  } catch {}
  return contact?._1c_address || contact?.address || "";
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
    if (!ref) { unmatched.push({ name, productId: it.productId || null, sku: product?.sku || "" }); continue; }
    if (product?._1c_match_ambiguous) ambiguous.push(name);
    lines.push({
      productRef: ref,
      unitRef: product?._1c_unit_ref || null,
      vatRateRef: product?._1c_vat_ref || ONE_C_VAT_5,
      qty, price,
      sum: Math.round(qty * price * 100) / 100,
      name,
    });
  }
  return { lines, unmatched, ambiguous };
}

/**
 * Headless-создание документа 1С (без диалога). Используется единым окном «Заказ»
 * (deal_items.js), а также внутренне диалогом ниже. Собирает payload ИДЕНТИЧНО
 * диалоговой кнопке «Создать», POST'ит в DOC_META[docType].endpoint и при успехе
 * сохраняет ref/num/at + CRM-поля (схема оплаты, НДС, комментарий) на сделке.
 *
 * @returns {Promise<{ ok:true, res:any, number:string|null, unmatched:Array }>}
 */
export async function submitOneCDocument({
  deal,
  items,
  contact,
  docType = "invoice",
  base = "aminamed",
  contractRef = null,
  deliveryAddress = null,
  paymentPurposeCode = "710",
  vatRef = ONE_C_VAT_5,
  comment = "",
  paymentScheme = null,
  postpayDueDate = null,
}) {
  if (!deal) throw new Error("Сделка не передана");
  const meta = DOC_META[docType] || DOC_META.invoice;
  const built = buildLines(items || []);
  if (!built.lines.length) throw new Error("Нет сопоставленных с 1С позиций");
  // Ставка НДС — document-level (применяется ко всем позициям), как в диалоге.
  const lines = built.lines.map((l) => ({
    productRef: l.productRef,
    unitRef: l.unitRef,
    vatRateRef: vatRef,
    qty: l.qty,
    price: l.price,
    sum: l.sum,
    name: l.name,
  }));
  // Маркер Pllato + комментарий менеджера через запятую (как в диалоге).
  const fullComment = ["Создано из Pllato CRM (черновик)", comment].filter(Boolean).join(", ");
  const payload = {
    externalId: deal.id,
    base,
    contactId: contact?.id || null,
    currencyRef: ONE_C_KZT_REF,
    contractorRef: base === "aminamed" ? (contact?._1c_ref_key || null) : null,
    contractRef,
    deliveryAddress,
    paymentPurposeCode: docType === "invoice" ? paymentPurposeCode : null,
    comment: fullComment,
    post: false,
    lines,
  };
  // Сначала фиксируем CRM-сторону (схема оплаты, НДС, комментарий) — как в диалоге.
  try {
    Store.update("deals", deal.id, {
      oneCPaymentPurpose: paymentPurposeCode,
      oneCVatRef: vatRef,
      oneCComment: comment || null,
      ...(docType === "invoice"
        ? { paymentScheme: paymentScheme || null, postpayDueDate: paymentScheme === "postpay" ? (postpayDueDate || null) : null }
        : {}),
    });
  } catch {}
  const res = await apiFetch(meta.endpoint, { method: "POST", body: payload });
  try {
    Store.update("deals", deal.id, {
      [meta.refField]: res?.ref_key || null,
      [meta.numField]: res?.number || null,
      [meta.atField]: Date.now(),
    });
  } catch {}
  return { ok: true, res, number: res?.number || null, unmatched: built.unmatched };
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

  let { lines, unmatched, ambiguous } = buildLines(items || []);
  let total = lines.reduce((s, l) => s + (l.sum || 0), 0);
  const activeCount = (items || []).filter((i) => (Number(i.qty) || 0) > 0).length;
  // Пересчёт после привязки несопоставленной позиции «на месте».
  function recomputeLines() {
    const r = buildLines(items || []);
    lines = r.lines; unmatched = r.unmatched; ambiguous = r.ambiguous;
    total = lines.reduce((s, l) => s + (l.sum || 0), 0);
  }

  const state = { contractorRef: contact?._1c_ref_key || null, busyContractor: false, contractorMsg: "", base: "aminamed", contact: contact || null, clientSearch: "" };
  const currentBase = () => overlay.querySelector("#onec-base")?.value || state.base || "aminamed";

  const overlay = document.createElement("div");
  overlay.id = "onec-doc-overlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px";
  document.body.appendChild(overlay);

  function render() {
    const alreadyNum = deal[meta.numField] || null;
    const hasContractor = !!state.contractorRef;
    const hasClient = !!state.contact?.id;
    const contracts = listContractsFor(state.contractorRef);
    const defaultDelivery = defaultDeliveryAddress(state.contact);
    const deliveryPoints = state.contact?.id ? listDeliveryPointsForContact(state.contact.id) : [];
    const primaryPoint = deliveryPoints.find((p) => p.isPrimary) || deliveryPoints[0] || null;
    const clientResults = hasClient ? [] : searchClientContacts(state.clientSearch);
    const blockers = [];
    if (!hasClient) blockers.push("Не выбран клиент — выберите его выше.");
    if (lines.length === 0) blockers.push("Ни одна позиция заказа не сопоставлена с номенклатурой 1С.");

    overlay.innerHTML = `
      <div style="background:var(--surface,#fff);color:var(--text,#111);border:1px solid var(--border,#ddd);border-radius:12px;max-width:680px;width:100%;max-height:88vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border,#eee);display:flex;justify-content:space-between;align-items:center">
          <strong style="font-size:16px">${esc(meta.title)}</strong>
          <button type="button" id="onec-x" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted,#888)">✕</button>
        </div>
        <div style="padding:18px 20px">
          ${alreadyNum ? `<div style="background:#e8f5e9;border:1px solid #16a34a;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:13px;color:#15803d">✓ По этому заказу уже создан документ 1С № <strong>${esc(alreadyNum)}</strong>. Повторное создание вернёт его же (без дубля).</div>` : ""}

          <label style="display:block;font-size:13px;color:var(--text-muted,#666);margin-bottom:4px">Юр.лицо-отправитель (база 1С)</label>
          <select id="onec-base" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:14px;font:inherit;background:var(--surface,#fff);color:var(--text,#111)">
            ${ONE_C_BASES_UI.map((b) => `<option value="${esc(b.key)}"${state.base === b.key ? " selected" : ""}>${esc(b.label)}</option>`).join("")}
          </select>

          <div style="font-size:13px;color:var(--text-muted,#666);margin-bottom:4px">Клиент (контрагент 1С)</div>
          ${hasClient ? `
          <div style="font-weight:600;margin-bottom:6px">${esc(state.contact?.name || deal.title || "—")}${hasContractor ? ` <span style="color:#16a34a">✓ есть в Аминамед</span>` : ""} <button type="button" id="onec-client-change" class="btn-ghost" style="padding:2px 8px;font-size:12px">сменить</button></div>
          <div style="margin-bottom:14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <button type="button" id="onec-find-contractor" class="btn-ghost" style="padding:6px 12px;font-size:13px" ${state.busyContractor ? "disabled" : ""}>🔍 Найти в 1С по БИН</button>
            <button type="button" id="onec-create-contractor" class="btn-ghost" style="padding:6px 12px;font-size:13px" ${state.busyContractor ? "disabled" : ""}>➕ Создать в 1С</button>
            <span style="font-size:11.5px;color:var(--text-muted,#888)">${esc(state.contractorMsg || "если клиента нет в выбранной базе — найдём по БИН или заведём; при создании счёта сервер тоже резолвит по БИН")}</span>
          </div>
          ` : `
          <div style="background:#fff3e0;border:1px solid #f59e0b;border-radius:8px;padding:9px 11px;margin-bottom:8px;font-size:12.5px;color:#92400e">⚠ Заказ не привязан к клиенту в CRM. Выберите клиента — без него счёт в 1С не создать.</div>
          <input id="onec-client-search" type="text" value="${esc(state.clientSearch)}" placeholder="Найти клиента по названию или БИН…" autocomplete="off" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:6px;font:inherit;background:var(--surface,#fff);color:var(--text,#111)">
          <div id="onec-client-results" style="max-height:180px;overflow:auto;margin-bottom:14px;border:1px solid var(--border,#eee);border-radius:8px;${clientResults.length || String(state.clientSearch||'').trim().length>=2 ? '' : 'display:none'}">
            ${clientResultsHTML(clientResults, state.clientSearch)}
          </div>
          `}

          <label style="display:block;font-size:13px;color:var(--text-muted,#666);margin-bottom:4px">Договор (1С)</label>
          <select id="onec-contract" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:14px;font:inherit;background:var(--surface,#fff);color:var(--text,#111)">
            <option value="">— без договора —</option>
            ${contracts.map((c) => `<option value="${esc(c.ref)}">${esc(c.label)}</option>`).join("")}
          </select>
          ${state.contractorRef && contracts.length === 0 ? `<div style="font-size:11.5px;color:var(--text-muted,#888);margin:-8px 0 12px">Договоров клиента не найдено в загруженных. Обновите «Договоры» в «1С интеграция».</div>` : ""}

          <label style="display:block;font-size:13px;color:var(--text-muted,#666);margin-bottom:4px">Адрес доставки</label>
          ${deliveryPoints.length ? `
          <select id="onec-delivery-select" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:6px;font:inherit;background:var(--surface,#fff);color:var(--text,#111)">
            ${deliveryPoints.map((p) => `<option value="${esc(p.id)}"${primaryPoint && p.id === primaryPoint.id ? " selected" : ""}>${esc(p.label || [p.city, p.address].filter(Boolean).join(", "))}</option>`).join("")}
            <option value="__manual__">➕ Другой адрес (ввести вручную)</option>
          </select>
          <input id="onec-delivery" type="text" value="" placeholder="город, адрес" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:14px;font:inherit;background:var(--surface,#fff);color:var(--text,#111);display:none">
          ` : `
          <input id="onec-delivery" type="text" value="${esc(defaultDelivery)}" placeholder="город, адрес — запомнится для клиента" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:14px;font:inherit;background:var(--surface,#fff);color:var(--text,#111)">
          `}

          ${docType === "invoice" ? `
          <label style="display:block;font-size:13px;color:var(--text-muted,#666);margin-bottom:4px">Код назначения платежа</label>
          <select id="onec-paypurpose" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:14px;font:inherit;background:var(--surface,#fff);color:var(--text,#111)">
            ${PAYMENT_PURPOSE_OPTS.map((p) => `<option value="${esc(p.code)}"${p.code === (deal.oneCPaymentPurpose || "710") ? " selected" : ""}>${esc(p.label)}</option>`).join("")}
          </select>

          <label style="display:block;font-size:13px;color:var(--text-muted,#666);margin-bottom:4px">Схема оплаты</label>
          <select id="onec-payscheme" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:${(deal.paymentScheme || "") === "postpay" ? "8px" : "14px"};font:inherit;background:var(--surface,#fff);color:var(--text,#111)">
            <option value="">— не указана —</option>
            ${PAYMENT_SCHEMES.map((s) => `<option value="${esc(s.key)}"${s.key === (deal.paymentScheme || "") ? " selected" : ""}>${esc(s.label)}</option>`).join("")}
          </select>
          <input id="onec-postpay-date" type="date" value="${esc(deal.postpayDueDate || "")}" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:14px;font:inherit;background:var(--surface,#fff);color:var(--text,#111);display:${(deal.paymentScheme || "") === "postpay" ? "block" : "none"}" title="Дата, до которой клиент должен оплатить (постоплата)">
          ` : ""}

          <label style="display:block;font-size:13px;color:var(--text-muted,#666);margin-bottom:4px">Ставка НДС (на весь документ)</label>
          <select id="onec-vat" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:14px;font:inherit;background:var(--surface,#fff);color:var(--text,#111)">
            ${ONE_C_VAT_RATES.map((v) => `<option value="${esc(v.ref)}"${v.ref === (deal.oneCVatRef || ONE_C_VAT_5) ? " selected" : ""}>${esc(v.label)}</option>`).join("")}
          </select>

          <label style="display:block;font-size:13px;color:var(--text-muted,#666);margin-bottom:4px">Комментарий (попадёт в 1С)</label>
          <textarea id="onec-comment" rows="2" placeholder="необязательно — добавится к пометке Pllato CRM" style="width:100%;padding:8px 10px;border:1px solid var(--border,#ccc);border-radius:8px;margin-bottom:14px;font:inherit;background:var(--surface,#fff);color:var(--text,#111);resize:vertical">${esc(deal.oneCComment || "")}</textarea>

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
            ⚠ <strong>${unmatched.length}</strong> позиц. не сопоставлены с 1С — без привязки они <strong>не войдут</strong> в документ. Найдите товар в 1С (по названию или коду) и нажмите «Привязать»:
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">
              ${unmatched.map((u) => `
                <div class="onec-um-row" data-pid="${esc(u.productId || "")}" style="background:var(--surface,#fff);border:1px solid #fde68a;border-radius:8px;padding:8px 10px">
                  <div style="font-weight:600;color:var(--text,#111);margin-bottom:5px">${esc(u.name)}${u.sku ? ` <span style="opacity:.5;font-weight:400">${esc(u.sku)}</span>` : ""}</div>
                  ${u.productId ? `
                    <div style="display:flex;gap:6px">
                      <input type="search" class="onec-um-q" placeholder="Поиск в номенклатуре 1С…" value="${esc(u.name)}" style="flex:1;padding:6px 8px;border:1px solid var(--border,#ccc);border-radius:6px;font:inherit;background:var(--surface,#fff);color:var(--text,#111)">
                      <button type="button" class="onec-um-search btn-ghost" style="padding:6px 10px;font-size:13px;white-space:nowrap">Искать</button>
                    </div>
                    <div class="onec-um-results" style="margin-top:6px"></div>
                  ` : `<div style="font-size:11.5px;color:#92400e">Нет товара на складе — привязать нельзя.</div>`}
                </div>
              `).join("")}
            </div>
          </div>` : ""}

          <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:11px 13px;margin-top:8px;font-size:12.5px;color:#9a3412;line-height:1.5">
            📝 <strong>На проверку Асем:</strong> документ создаётся <strong>черновиком</strong> (не проведён). Номенклатура 1С попартийная — у части позиций представительная запись (⚠), серию/партию проверьте и поправьте в 1С. Бухсчета (товар 1330, дебиторка 1230) и банковский счёт 1С проставит при проведении автоматически.
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

    // Привязка клиента «на месте», если заказ не привязан к контакту CRM.
    const bindClientPicks = () => {
      overlay.querySelectorAll(".onec-client-pick").forEach((btn) => {
        btn.addEventListener("click", () => {
          const c = Store.get("contacts", btn.dataset.cid);
          if (!c) return;
          state.contact = c;
          state.contractorRef = c._1c_ref_key || null;
          state.clientSearch = "";
          try { Store.update("deals", deal.id, { contactId: c.id, contactName: c.name || null }); } catch {}
          render();
        });
      });
    };
    bindClientPicks();
    overlay.querySelector("#onec-client-search")?.addEventListener("input", (e) => {
      state.clientSearch = e.target.value || "";
      const box = overlay.querySelector("#onec-client-results");
      if (box) {
        const results = searchClientContacts(state.clientSearch);
        box.style.display = (results.length || state.clientSearch.trim().length >= 2) ? "" : "none";
        box.innerHTML = clientResultsHTML(results, state.clientSearch);
        bindClientPicks();
      }
    });
    overlay.querySelector("#onec-client-change")?.addEventListener("click", () => {
      state.contact = null; state.contractorRef = null; state.clientSearch = "";
      render();
    });

    // Привязка несопоставленных позиций «на месте» (поиск номенклатуры 1С + Привязать).
    overlay.querySelectorAll(".onec-um-row").forEach((row) => {
      const pid = row.dataset.pid;
      if (!pid) return;
      const q = row.querySelector(".onec-um-q");
      const btn = row.querySelector(".onec-um-search");
      const res = row.querySelector(".onec-um-results");
      const doSearch = async () => {
        const text = (q.value || "").trim();
        if (text.length < 2) { res.innerHTML = '<span style="font-size:11.5px;color:#888">Введите минимум 2 символа</span>'; return; }
        res.innerHTML = '<span style="font-size:11.5px;color:#888">Ищем в 1С…</span>';
        try {
          // Поиск по базе Аминамед: _1c_ref_key — аминамедовский реф (для др. баз
          // воркер резолвит номенклатуру вживую по артикулу из названия).
          const r = await apiFetch("/api/crm/1c/nomenclature/search?q=" + encodeURIComponent(text));
          const found = r?.results || [];
          if (!found.length) { res.innerHTML = '<span style="font-size:11.5px;color:#888">Ничего не найдено в 1С</span>'; return; }
          res.innerHTML = found.map((x) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:4px 0;border-top:1px solid var(--border,#f0f0f0)"><span style="font-size:12.5px;color:var(--text,#111)">${esc(x.name)} <span style="opacity:.5">${esc(x.code || "")}</span></span><button type="button" class="onec-um-pick btn-ghost" data-ref="${esc(x.ref)}" data-unit="${esc(x.unit || "")}" data-vat="${esc(x.vat || "")}" style="padding:4px 10px;font-size:12px;white-space:nowrap">Привязать</button></div>`).join("");
          res.querySelectorAll(".onec-um-pick").forEach((b) => b.addEventListener("click", async () => {
            b.disabled = true; b.textContent = "…";
            try {
              await apiFetch("/api/crm/1c/products/map", { method: "POST", body: { productId: pid, refKey: b.dataset.ref, unitRef: b.dataset.unit || null, vatRef: b.dataset.vat || null } });
              try { Store.update("warehouse_products", pid, { _1c_ref_key: b.dataset.ref, _1c_unit_ref: b.dataset.unit || null, _1c_vat_ref: b.dataset.vat || null, _1c_match_method: "manual", _1c_match_ambiguous: false }); } catch {}
              recomputeLines();
              render();
            } catch (e) { b.disabled = false; b.textContent = "Привязать"; alert("Ошибка привязки: " + (e?.message || String(e))); }
          }));
        } catch (e) { res.innerHTML = '<span style="color:#dc2626;font-size:11.5px">Ошибка: ' + esc(e?.message || String(e)) + '</span>'; }
      };
      btn?.addEventListener("click", doSearch);
      q?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doSearch(); } });
    });

    // Поиск контрагента в 1С по БИН (решение встречи 01.06).
    overlay.querySelector("#onec-find-contractor")?.addEventListener("click", async () => {
      if (!state.contact?.id) { alert("Сначала выберите клиента выше."); return; }
      const base = currentBase();
      state.base = base; state.busyContractor = true; state.contractorMsg = "Ищем в 1С по БИН…"; render();
      try {
        const res = await apiFetch("/api/crm/1c/contractors/find", { method: "POST", body: { contactId: state.contact.id, base } });
        if (res?.found) {
          if (base === "aminamed") {
            state.contractorRef = res.ref_key;
            try { Store.update("contacts", state.contact.id, { _1c_ref_key: res.ref_key }); } catch {}
          }
          state.busyContractor = false; state.contractorMsg = "✓ найден в выбранной базе";
        } else {
          state.busyContractor = false;
          state.contractorMsg = res?.reason === "no_bin"
            ? "У клиента нет БИН в карточке — заполните или создайте нового"
            : "По БИН не найден в этой базе — создайте нового";
        }
        render();
      } catch (err) {
        state.busyContractor = false; state.contractorMsg = "Ошибка поиска"; render();
        alert("Ошибка поиска по БИН: " + (err?.message || String(err)));
      }
    });

    // Создание контрагента в 1С прямо отсюда
    overlay.querySelector("#onec-create-contractor")?.addEventListener("click", async () => {
      if (!state.contact?.id) { alert("Сначала выберите клиента выше."); return; }
      const base = currentBase();
      state.base = base; state.busyContractor = true; state.contractorMsg = "Создаём в 1С…"; render();
      try {
        const res = await apiFetch("/api/crm/1c/contractors/create", { method: "POST", body: { contactId: state.contact.id, base } });
        if (base === "aminamed") {
          state.contractorRef = res?.ref_key || null;
          try { Store.update("contacts", state.contact.id, { _1c_ref_key: res?.ref_key || null }); } catch {}
        }
        state.busyContractor = false; state.contractorMsg = res?.already_exists ? "✓ уже есть в базе (привязан)" : "✓ создан в выбранной базе";
        render();
      } catch (err) {
        state.busyContractor = false; state.contractorMsg = "";
        render();
        alert("Не удалось создать контрагента в 1С: " + (err?.message || String(err)));
      }
    });

    // Постоплата → показать поле даты (без перерисовки, чтобы не терять ввод).
    overlay.querySelector("#onec-payscheme")?.addEventListener("change", (e) => {
      const dateEl = overlay.querySelector("#onec-postpay-date");
      if (dateEl) dateEl.style.display = e.target.value === "postpay" ? "block" : "none";
    });

    // Адрес доставки: «Другой адрес» → показать поле ручного ввода.
    overlay.querySelector("#onec-delivery-select")?.addEventListener("change", (e) => {
      const inp = overlay.querySelector("#onec-delivery");
      if (inp) { inp.style.display = e.target.value === "__manual__" ? "block" : "none"; if (e.target.value === "__manual__") inp.focus(); }
    });

    const createBtn = overlay.querySelector("#onec-create");
    createBtn?.addEventListener("click", async () => {
      const base = currentBase();
      const contractRef = overlay.querySelector("#onec-contract")?.value || null;
      // Адрес доставки: из выбранной точки клиента или ручной ввод (новый — запомним).
      let deliveryAddress = null;
      const deliverySel = overlay.querySelector("#onec-delivery-select");
      const deliveryManual = (overlay.querySelector("#onec-delivery")?.value || "").trim();
      if (deliverySel && deliverySel.value && deliverySel.value !== "__manual__") {
        const pt = getDeliveryPoint(deliverySel.value);
        deliveryAddress = pt ? (pt.label || [pt.city, pt.address].filter(Boolean).join(", ")) : null;
      } else if (deliveryManual) {
        deliveryAddress = deliveryManual;
        // Запоминаем новый адрес как точку доставки клиента (для будущих заказов).
        if (state.contact?.id) { try { saveDeliveryPoint({ contactId: state.contact.id, address: deliveryManual }); } catch {} }
      }
      const payPurpose = overlay.querySelector("#onec-paypurpose")?.value || "710";
      const payScheme = overlay.querySelector("#onec-payscheme")?.value || "";
      const postpayDue = overlay.querySelector("#onec-postpay-date")?.value || "";
      const vatRef = overlay.querySelector("#onec-vat")?.value || ONE_C_VAT_5;
      const userComment = (overlay.querySelector("#onec-comment")?.value || "").trim();
      createBtn.disabled = true;
      createBtn.textContent = "Создаём в 1С…";
      try {
        // Единый headless-путь — payload собирается в submitOneCDocument (без дублей).
        // Контрагент-реф берётся из contact._1c_ref_key, поэтому синхронизируем его
        // с state.contractorRef (мог быть найден/создан «на месте» в этом диалоге).
        const contactForSubmit = state.contact
          ? { ...state.contact, _1c_ref_key: state.contractorRef || state.contact._1c_ref_key || null }
          : null;
        const { res, number } = await submitOneCDocument({
          deal,
          items: items || [],
          contact: contactForSubmit,
          docType,
          base,
          contractRef,
          deliveryAddress,
          paymentPurposeCode: payPurpose,
          vatRef,
          comment: userComment,
          paymentScheme: payScheme,
          postpayDueDate: postpayDue,
        });
        const num = number || "(без номера)";
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
