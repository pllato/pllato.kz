// Pllato CRM — мобильный экран для роли "field" (Менеджер по продажам в поле).
// Один экран: поиск товара по складу → добавить позицию → ввести qty → итого +
// поле комментария (адрес, контрагент) → отправить.
// Заказ сохраняется как обычная сделка в первой активной воронке.

import { Store } from "../store.js";
import { listWarehouseProducts, getWarehouseProduct, productSummary } from "../warehouse.js";
import { getStages } from "../stages.js";
import { getActivePipelineId, ensurePipelinesInitialized } from "../pipelines.js";
import { currentEmployee } from "../employees.js";
import { createDealItem } from "../deal_items.js";

const COLLECTION_DEALS = "deals";

// Локальное состояние формы (черновик).
const state = {
  items: [],       // [{ productId, name, sku, unit, qty, unitPrice, stock }]
  search: "",
  comment: "",
  submitting: false,
  lastSubmittedId: null,
};

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtAmount(n) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("ru-RU").format(v) + " ₸";
}

function totalSum() {
  return state.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
}

export function renderFieldOrder(container) {
  const me = currentEmployee();
  const name = me?.name || me?.email || "Сотрудник";

  container.innerHTML = `
    <div class="field-page">
      <header class="field-header">
        <div class="field-header-main">
          <div class="field-header-title">Новый заказ</div>
          <div class="field-header-sub">${escape(name)}</div>
        </div>
        <button type="button" class="field-header-btn" id="fieldSignOut" title="Выйти">Выйти</button>
      </header>

      ${state.lastSubmittedId ? `
        <div class="field-success">
          ✅ Заказ отправлен. <button type="button" class="field-link" id="fieldNewOrder">Новый заказ</button>
        </div>
      ` : ""}

      <section class="field-section">
        <label class="field-label">Найти товар</label>
        <input type="search" id="fieldSearch" class="field-input" placeholder="SKU или название…" value="${escape(state.search)}" autocomplete="off">
        <div class="field-search-results" id="fieldSearchResults">${renderSearchResults()}</div>
      </section>

      <section class="field-section">
        <div class="field-section-title">Состав заказа · ${state.items.length} ${pluralRu(state.items.length, "позиция", "позиции", "позиций")}</div>
        ${state.items.length === 0
          ? `<div class="field-empty">Добавь товары из списка выше.</div>`
          : `<div class="field-items">${state.items.map((it, idx) => renderItemRow(it, idx)).join("")}</div>`
        }
      </section>

      <section class="field-section">
        <label class="field-label" for="fieldComment">Комментарий (адрес, контрагент, доп. инфо)</label>
        <textarea id="fieldComment" class="field-textarea" rows="4" placeholder="Например: Алматы, Абая 12. ТОО Ромашка. Контакт Иванов +77011234567">${escape(state.comment)}</textarea>
      </section>

      <footer class="field-footer">
        <div class="field-total">Итого: <strong>${fmtAmount(totalSum())}</strong></div>
        <button type="button" class="field-submit" id="fieldSubmit" ${state.items.length === 0 || state.submitting ? "disabled" : ""}>
          ${state.submitting ? "Отправляем…" : "Отправить заказ"}
        </button>
      </footer>
    </div>
  `;

  wireEvents(container);
}

function renderSearchResults() {
  const query = String(state.search || "").trim();
  if (!query) return `<div class="field-hint">Начни вводить SKU или название товара.</div>`;
  const products = listWarehouseProducts({ query }).slice(0, 30);
  if (products.length === 0) return `<div class="field-hint">Ничего не найдено по «${escape(query)}».</div>`;
  return products.map((p) => {
    const summary = p.summary || productSummary(p.id) || { total: 0 };
    const stockCls = summary.total > 0 ? "stock-ok" : "stock-low";
    const inOrder = state.items.some((i) => i.productId === p.id);
    return `
      <button type="button" class="field-product ${inOrder ? "in-order" : ""}" data-add-product="${escape(p.id)}">
        <div class="field-product-main">
          <div class="field-product-sku">${escape(p.sku || "")}</div>
          <div class="field-product-name">${escape(p.name || "")}</div>
        </div>
        <div class="field-product-meta">
          <div class="field-product-stock ${stockCls}">${Number(summary.total) || 0} ${escape(p.unit || "шт")}</div>
          <div class="field-product-price">${fmtAmount(p.price || 0)}</div>
        </div>
      </button>
    `;
  }).join("");
}

function renderItemRow(it, idx) {
  return `
    <div class="field-item" data-item-idx="${idx}">
      <div class="field-item-head">
        <div class="field-item-name">
          ${escape(it.name || "(без названия)")}
          ${it.sku ? `<span class="field-item-sku">${escape(it.sku)}</span>` : ""}
        </div>
        <button type="button" class="field-item-remove" data-remove-item="${idx}" aria-label="Убрать">×</button>
      </div>
      <div class="field-item-stock">На складе: <strong>${Number(it.stock) || 0}</strong> ${escape(it.unit || "шт")}</div>
      <div class="field-item-controls">
        <div class="field-qty">
          <button type="button" class="field-qty-btn" data-qty-step="-1" data-item-idx="${idx}">−</button>
          <input type="number" class="field-qty-input" data-item-idx="${idx}" min="0" step="1" value="${Number(it.qty) || 0}" inputmode="numeric">
          <button type="button" class="field-qty-btn" data-qty-step="1" data-item-idx="${idx}">+</button>
          <span class="field-qty-unit">${escape(it.unit || "шт")}</span>
        </div>
        <div class="field-price-wrap">
          <input type="number" class="field-price-input" data-price-idx="${idx}" min="0" step="100" value="${Number(it.unitPrice) || 0}" inputmode="decimal">
          <span class="field-price-unit">₸</span>
        </div>
      </div>
      <div class="field-item-sum">= <strong>${fmtAmount((Number(it.qty) || 0) * (Number(it.unitPrice) || 0))}</strong></div>
    </div>
  `;
}

function pluralRu(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function wireEvents(container) {
  container.querySelector("#fieldSearch")?.addEventListener("input", (e) => {
    state.search = e.target.value || "";
    const results = container.querySelector("#fieldSearchResults");
    if (results) results.innerHTML = renderSearchResults();
  });

  container.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add-product]");
    if (addBtn) {
      const pid = addBtn.dataset.addProduct;
      addProduct(pid);
      renderFieldOrder(container);
      return;
    }
    const rmBtn = e.target.closest("[data-remove-item]");
    if (rmBtn) {
      const idx = Number(rmBtn.dataset.removeItem);
      state.items.splice(idx, 1);
      renderFieldOrder(container);
      return;
    }
    const stepBtn = e.target.closest("[data-qty-step]");
    if (stepBtn) {
      const idx = Number(stepBtn.dataset.itemIdx);
      const step = Number(stepBtn.dataset.qtyStep) || 0;
      const it = state.items[idx];
      if (!it) return;
      it.qty = Math.max(0, (Number(it.qty) || 0) + step);
      renderFieldOrder(container);
      return;
    }
    if (e.target.id === "fieldNewOrder") {
      resetForm();
      renderFieldOrder(container);
      return;
    }
    if (e.target.id === "fieldSignOut") {
      // Делегируем app.js (он подписан на pllato:auth-expired-like событие через signOut).
      window.dispatchEvent(new CustomEvent("pllato:field-signout"));
      return;
    }
  });

  container.addEventListener("input", (e) => {
    if (e.target.matches("[data-item-idx].field-qty-input")) {
      const idx = Number(e.target.dataset.itemIdx);
      const it = state.items[idx];
      if (it) {
        it.qty = Math.max(0, Number(e.target.value) || 0);
        // Обновляем только сумму строки/итого без полного re-render (чтобы не сбить фокус).
        updateRowAndTotal(container, idx);
      }
    } else if (e.target.matches("[data-price-idx].field-price-input")) {
      const idx = Number(e.target.dataset.priceIdx);
      const it = state.items[idx];
      if (it) {
        it.unitPrice = Math.max(0, Number(e.target.value) || 0);
        updateRowAndTotal(container, idx);
      }
    } else if (e.target.id === "fieldComment") {
      state.comment = e.target.value || "";
    }
  });

  container.querySelector("#fieldSubmit")?.addEventListener("click", async () => {
    if (state.submitting) return;
    if (state.items.length === 0) return;
    state.submitting = true;
    try {
      const dealId = await submitFieldOrder();
      state.lastSubmittedId = dealId;
      resetForm({ keepLast: true });
    } catch (err) {
      alert("Не удалось отправить заказ: " + (err?.message || String(err)));
    } finally {
      state.submitting = false;
      renderFieldOrder(container);
    }
  });
}

function updateRowAndTotal(container, idx) {
  const row = container.querySelector(`[data-item-idx="${idx}"].field-item`);
  if (row) {
    const it = state.items[idx];
    const sum = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0);
    const sumEl = row.querySelector(".field-item-sum strong");
    if (sumEl) sumEl.textContent = fmtAmount(sum);
  }
  const totalEl = container.querySelector(".field-total strong");
  if (totalEl) totalEl.textContent = fmtAmount(totalSum());
  const submit = container.querySelector("#fieldSubmit");
  if (submit) submit.disabled = state.items.length === 0 || state.submitting;
}

function addProduct(productId) {
  const existing = state.items.find((i) => i.productId === productId);
  if (existing) {
    existing.qty = (Number(existing.qty) || 0) + 1;
    return;
  }
  const p = getWarehouseProduct(productId);
  if (!p) return;
  const summary = productSummary(productId) || { total: 0 };
  state.items.push({
    productId,
    name: p.name || "",
    sku: p.sku || "",
    unit: p.unit || "шт",
    qty: 1,
    unitPrice: Number(p.price) || 0,
    stock: Number(summary.total) || 0,
  });
}

function resetForm({ keepLast = false } = {}) {
  state.items = [];
  state.search = "";
  state.comment = "";
  if (!keepLast) state.lastSubmittedId = null;
}

async function submitFieldOrder() {
  ensurePipelinesInitialized();
  const pipelineId = getActivePipelineId();
  const stages = getStages();
  const firstStageId = stages[0]?.id;
  if (!pipelineId || !firstStageId) {
    throw new Error("Не настроена воронка для приёма заказов.");
  }

  const me = currentEmployee();
  const now = Date.now();
  const dateLabel = new Date(now).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  const title = `Заказ ${dateLabel} от ${(me?.name || "поле").trim()}`;

  const deal = Store.create(COLLECTION_DEALS, {
    title,
    pipelineId,
    stage: firstStageId,
    amount: totalSum(),
    source: "Field",
    notes: state.comment || "",
    createdAt: now,
    ts: now,
    assigneeId: me?.id || null,
  });
  if (!deal?.id) throw new Error("Не удалось создать сделку.");

  // Позиции
  for (const it of state.items) {
    if (!it.productId || !((Number(it.qty) || 0) > 0)) continue;
    createDealItem(deal.id, {
      productId: it.productId,
      qty: Number(it.qty) || 0,
      unitPrice: Number(it.unitPrice) || 0,
    });
  }

  // Activity-запись для timeline
  Store.create("deal_activities", {
    dealId: deal.id,
    type: "deal_created",
    text: `Заказ создан полевым менеджером (${state.items.length} поз. · ${fmtAmount(totalSum())})`,
    authorId: me?.id || null,
    ts: now,
  });

  return deal.id;
}
