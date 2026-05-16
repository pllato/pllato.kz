import { Store } from "./store.js";
import { currentEmployee } from "./employees.js";

export const WH_COLLECTIONS = {
  products: "products",
  categories: "product_categories",
  batches: "batches",
  movements: "stock_movements",
  dealItems: "deal_items",
};

const DAY_MS = 86400000;
const DEFAULT_UNIT = "шт.";
const DEFAULT_CATEGORIES = [
  "Пластыри",
  "Перевязка",
  "Шприцы и иглы",
  "Антисептики",
  "СИЗ",
  "Прочее",
];

function nowTs() {
  return Date.now();
}

function startOfDay(ts = Date.now()) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dateToIso(dateLike) {
  if (!dateLike) return "";
  if (typeof dateLike === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateLike)) return dateLike;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function parseNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function safeText(v) {
  return String(v || "").trim();
}

function pick(value, fallback) {
  return value == null ? fallback : value;
}

function daysLeftByIso(isoDate) {
  if (!isoDate) return Number.POSITIVE_INFINITY;
  const expiry = new Date(`${isoDate}T00:00:00`).getTime();
  if (!Number.isFinite(expiry)) return Number.POSITIVE_INFINITY;
  return Math.floor((expiry - startOfDay()) / DAY_MS);
}

function batchSortByExpiry(a, b) {
  const da = daysLeftByIso(a.expiryDate);
  const db = daysLeftByIso(b.expiryDate);
  if (da !== db) return da - db;
  const ra = new Date(`${a.receivedAt || "1900-01-01"}T00:00:00`).getTime() || 0;
  const rb = new Date(`${b.receivedAt || "1900-01-01"}T00:00:00`).getTime() || 0;
  return ra - rb;
}

function formatCategoryId(name, index = 0) {
  const slug = String(name || "cat")
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");
  return slug ? `cat_${slug}` : `cat_${index + 1}`;
}

export function listProductCategories() {
  return Store.list(WH_COLLECTIONS.categories)
    .filter((x) => !x.archived)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function ensureCategoriesSeeded() {
  const existing = Store.list(WH_COLLECTIONS.categories);
  if (existing.length > 0) return;
  DEFAULT_CATEGORIES.forEach((name, index) => {
    Store.create(WH_COLLECTIONS.categories, {
      name,
      parentId: null,
      order: index,
      key: formatCategoryId(name, index),
    });
  });
}

function normalizeProductInput(data = {}, existing = null) {
  const regExpiryRaw = pick(data.regExpiry, existing?.regExpiry);
  const regExpiry = regExpiryRaw === "" ? "" : dateToIso(regExpiryRaw);
  return {
    sku: safeText(pick(data.sku, existing?.sku)),
    barcode: safeText(pick(data.barcode, existing?.barcode)),
    name: safeText(pick(data.name, existing?.name)),
    categoryId: safeText(pick(data.categoryId, existing?.categoryId)),
    unit: safeText(pick(data.unit, existing?.unit || DEFAULT_UNIT)) || DEFAULT_UNIT,
    costPrice: parseNum(data.costPrice, parseNum(existing?.costPrice, 0)),
    sellPrice: parseNum(data.sellPrice, parseNum(existing?.sellPrice, 0)),
    minStock: Math.max(0, parseNum(data.minStock, parseNum(existing?.minStock, 0))),
    trackBatches: data.trackBatches == null ? (existing?.trackBatches ?? true) : Boolean(data.trackBatches),
    regNumber: safeText(pick(data.regNumber, existing?.regNumber)),
    regExpiry,
    photoUrl: data.photoUrl == null ? (existing?.photoUrl ?? null) : data.photoUrl,
    description: safeText(pick(data.description, existing?.description)),
    archived: data.archived == null ? Boolean(existing?.archived) : Boolean(data.archived),
  };
}

function assertProductUniqueSku(sku, currentId = null) {
  const skuNorm = safeText(sku).toLowerCase();
  if (!skuNorm) throw new Error("Укажи артикул (SKU)");
  const hasDup = Store.list(WH_COLLECTIONS.products).some((p) => {
    if (currentId && p.id === currentId) return false;
    return safeText(p.sku).toLowerCase() === skuNorm;
  });
  if (hasDup) throw new Error("Товар с таким SKU уже существует");
}

function createMovement({
  productId,
  batchId = null,
  type,
  qty,
  reason,
  dealId = null,
  note = "",
}) {
  const me = currentEmployee();
  return Store.create(WH_COLLECTIONS.movements, {
    productId,
    batchId,
    type,
    qty: Math.abs(parseNum(qty, 0)),
    reason: safeText(reason || "manual"),
    dealId: dealId || null,
    note: safeText(note),
    userId: me?.id || null,
    ts: nowTs(),
  });
}

export function getProduct(id) {
  return id ? Store.get(WH_COLLECTIONS.products, id) : null;
}

export function saveProduct(data = {}) {
  ensureCategoriesSeeded();

  const id = data.id || null;
  const existing = id ? getProduct(id) : null;
  const payload = normalizeProductInput(data, existing);

  if (!payload.name) throw new Error("Укажи название товара");
  assertProductUniqueSku(payload.sku, id);

  if (existing) {
    return Store.update(WH_COLLECTIONS.products, id, payload);
  }

  return Store.create(WH_COLLECTIONS.products, {
    ...payload,
    trackBatches: payload.trackBatches ?? true,
  });
}

export function archiveProduct(id) {
  const product = getProduct(id);
  if (!product) return null;
  const summary = stockSummary(id);
  if (summary.total > 0) {
    throw new Error("Нельзя архивировать товар с остатком. Сначала спишите остаток.");
  }
  return Store.update(WH_COLLECTIONS.products, id, { archived: true });
}

export function listBatchesForProduct(productId, opts = {}) {
  const includeArchived = Boolean(opts.includeArchived);
  return Store.list(WH_COLLECTIONS.batches)
    .filter((b) => b.productId === productId)
    .filter((b) => includeArchived || !b.archived)
    .sort(batchSortByExpiry);
}

function normalizeBatchInput(product, data = {}, existing = null) {
  const initialQtyRaw = data.initialQty == null ? (existing?.initialQty ?? data.qty ?? 0) : data.initialQty;
  const qtyRaw = data.qty == null ? (existing?.qty ?? initialQtyRaw) : data.qty;
  const expiryRaw = pick(data.expiryDate, existing?.expiryDate);
  const manufactureRaw = pick(data.manufactureDate, existing?.manufactureDate);
  const receivedRaw = pick(data.receivedAt, existing?.receivedAt || Date.now());

  return {
    productId: product.id,
    batchNumber: safeText(pick(data.batchNumber, existing?.batchNumber)),
    manufactureDate: manufactureRaw === "" ? "" : dateToIso(manufactureRaw),
    expiryDate: expiryRaw === "" ? "" : dateToIso(expiryRaw),
    initialQty: Math.max(0, parseNum(initialQtyRaw, 0)),
    qty: Math.max(0, parseNum(qtyRaw, 0)),
    costPrice: Math.max(0, parseNum(data.costPrice, parseNum(existing?.costPrice, product.costPrice || 0))),
    supplierName: safeText(pick(data.supplierName, existing?.supplierName)),
    receivedAt: receivedRaw === "" ? "" : dateToIso(receivedRaw),
    note: safeText(pick(data.note, existing?.note)),
    onSale: data.onSale == null ? Boolean(existing?.onSale) : Boolean(data.onSale),
    archived: data.archived == null ? Boolean(existing?.archived) : Boolean(data.archived),
  };
}

export function addBatch(productId, data = {}) {
  const product = getProduct(productId);
  if (!product || product.archived) throw new Error("Товар не найден");

  const payload = normalizeBatchInput(product, data);
  if (!payload.batchNumber) throw new Error("Укажи номер партии");
  if (product.trackBatches && !payload.expiryDate) throw new Error("Для этого товара обязателен срок годности");

  const created = Store.create(WH_COLLECTIONS.batches, {
    ...payload,
    archived: payload.qty <= 0,
  });

  if (payload.initialQty > 0) {
    createMovement({
      productId,
      batchId: created.id,
      type: "in",
      qty: payload.initialQty,
      reason: "purchase",
      note: payload.note,
    });
  }

  Store.update(WH_COLLECTIONS.products, productId, { costPrice: payload.costPrice });
  return created;
}

export function writeOffBatch(batchId, qty, reason = "expired", note = "") {
  const batch = Store.get(WH_COLLECTIONS.batches, batchId);
  if (!batch) throw new Error("Партия не найдена");
  if (batch.qty <= 0) throw new Error("Партия уже пуста");

  const amount = Math.max(0, parseNum(qty, 0));
  if (amount <= 0) throw new Error("Количество для списания должно быть больше нуля");
  if (amount > batch.qty) throw new Error("Нельзя списать больше, чем есть в партии");

  const nextQty = Math.max(0, batch.qty - amount);
  const updated = Store.update(WH_COLLECTIONS.batches, batch.id, {
    qty: nextQty,
    archived: nextQty <= 0,
  });

  createMovement({
    productId: batch.productId,
    batchId: batch.id,
    type: "writeoff",
    qty: amount,
    reason,
    note,
  });

  return updated;
}

export function adjustBatch(batchId, newQty, note = "") {
  const batch = Store.get(WH_COLLECTIONS.batches, batchId);
  if (!batch) throw new Error("Партия не найдена");

  const nextQty = Math.max(0, parseNum(newQty, 0));
  if (nextQty === batch.qty) return batch;

  const delta = Math.abs(nextQty - batch.qty);
  const updated = Store.update(WH_COLLECTIONS.batches, batch.id, {
    qty: nextQty,
    archived: nextQty <= 0,
  });

  createMovement({
    productId: batch.productId,
    batchId: batch.id,
    type: "adjust",
    qty: delta,
    reason: "inventory_correction",
    note,
  });

  return updated;
}

export function setBatchOnSale(batchId, onSale = true) {
  const batch = Store.get(WH_COLLECTIONS.batches, batchId);
  if (!batch) throw new Error("Партия не найдена");
  return Store.update(WH_COLLECTIONS.batches, batch.id, { onSale: Boolean(onSale) });
}

export function stockSummary(productId) {
  const product = getProduct(productId);
  if (!product) return { total: 0, reserved: 0, available: 0, batches: [] };

  const batches = listBatchesForProduct(productId, { includeArchived: false })
    .map((b) => ({ ...b, qty: Math.max(0, parseNum(b.qty, 0)) }));

  const total = batches.reduce((sum, batch) => sum + batch.qty, 0);

  // PR-1: deal_items ещё не используются — резерв = 0.
  const reserved = 0;
  const available = Math.max(0, total - reserved);

  return { total, reserved, available, batches };
}

export function listProducts(filter = {}) {
  const query = safeText(filter.query || filter.search).toLowerCase();
  const categoryId = safeText(filter.categoryId);
  const stockStatus = safeText(filter.stockStatus || "all");
  const expiringOnly = Boolean(filter.expiringOnly);
  const includeArchived = Boolean(filter.includeArchived);

  const expiredSet = new Set(expiredBatches().map((x) => x.batch.id));

  const products = Store.list(WH_COLLECTIONS.products)
    .filter((p) => includeArchived || !p.archived)
    .map((product) => {
      const summary = stockSummary(product.id);
      const nearestBatch = summary.batches.find((b) => b.qty > 0 && b.expiryDate) || null;
      const nearestDaysLeft = nearestBatch ? daysLeftByIso(nearestBatch.expiryDate) : Number.POSITIVE_INFINITY;
      const hasExpired = summary.batches.some((b) => expiredSet.has(b.id));
      return {
        ...product,
        summary,
        nearestBatch,
        nearestDaysLeft,
        hasExpired,
      };
    })
    .filter((product) => {
      if (query) {
        const blob = `${product.sku || ""} ${product.barcode || ""} ${product.name || ""}`.toLowerCase();
        if (!blob.includes(query)) return false;
      }
      if (categoryId && product.categoryId !== categoryId) return false;

      if (stockStatus === "in" && product.summary.total <= 0) return false;
      if (stockStatus === "low") {
        const low = product.minStock > 0 && product.summary.total > 0 && product.summary.total < product.minStock;
        if (!low) return false;
      }
      if (stockStatus === "out" && product.summary.total > 0) return false;

      if (expiringOnly) {
        const near = Number.isFinite(product.nearestDaysLeft) && product.nearestDaysLeft >= 0 && product.nearestDaysLeft <= 30;
        const exp = product.hasExpired;
        if (!near && !exp) return false;
      }

      return true;
    })
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ru"));

  return products;
}

export function expiringBatches(daysAhead = 90) {
  const productsById = new Map(Store.list(WH_COLLECTIONS.products).map((p) => [p.id, p]));
  return Store.list(WH_COLLECTIONS.batches)
    .filter((b) => !b.archived)
    .filter((b) => parseNum(b.qty, 0) > 0)
    .map((batch) => {
      const daysLeft = daysLeftByIso(batch.expiryDate);
      return { batch, product: productsById.get(batch.productId) || null, daysLeft };
    })
    .filter((row) => Number.isFinite(row.daysLeft) && row.daysLeft >= 0 && row.daysLeft <= daysAhead)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function expiredBatches() {
  const productsById = new Map(Store.list(WH_COLLECTIONS.products).map((p) => [p.id, p]));
  return Store.list(WH_COLLECTIONS.batches)
    .filter((b) => !b.archived)
    .filter((b) => parseNum(b.qty, 0) > 0)
    .map((batch) => {
      const daysLeft = daysLeftByIso(batch.expiryDate);
      return { batch, product: productsById.get(batch.productId) || null, daysLeft };
    })
    .filter((row) => Number.isFinite(row.daysLeft) && row.daysLeft < 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function lowStockProducts() {
  return Store.list(WH_COLLECTIONS.products)
    .filter((p) => !p.archived)
    .map((p) => ({ product: p, summary: stockSummary(p.id) }))
    .filter((row) => row.product.minStock > 0 && row.summary.total < row.product.minStock);
}

export function listStockRows(opts = {}) {
  const includeArchived = Boolean(opts.includeArchived);
  const rows = Store.list(WH_COLLECTIONS.products)
    .filter((p) => !p.archived)
    .map((product) => {
      const batches = listBatchesForProduct(product.id, { includeArchived })
        .map((batch) => ({
          ...batch,
          daysLeft: daysLeftByIso(batch.expiryDate),
          value: parseNum(batch.qty, 0) * parseNum(batch.costPrice, 0),
        }));
      const total = batches.reduce((sum, b) => sum + parseNum(b.qty, 0), 0);
      return { product, batches, total };
    })
    .filter((row) => row.batches.length > 0 || row.total > 0);

  return rows;
}

export function listStockMovements(filter = {}) {
  const type = safeText(filter.type || "all");
  const days = parseNum(filter.days, 0);
  const fromTs = days > 0 ? nowTs() - days * DAY_MS : 0;

  return Store.list(WH_COLLECTIONS.movements)
    .filter((m) => !type || type === "all" || m.type === type)
    .filter((m) => !fromTs || (m.ts || m.createdAt || 0) >= fromTs)
    .sort((a, b) => (b.ts || b.createdAt || 0) - (a.ts || a.createdAt || 0));
}

export function stockValuation() {
  return Store.list(WH_COLLECTIONS.batches)
    .filter((b) => !b.archived)
    .reduce((sum, b) => sum + parseNum(b.qty, 0) * parseNum(b.costPrice, 0), 0);
}

export function pickBatchForDeal(productId, qty) {
  const product = getProduct(productId);
  if (!product) return null;

  const requestedQty = Math.max(0, parseNum(qty, 0));
  if (requestedQty <= 0) {
    return { batchId: null, availableInBatch: 0, enough: false, warning: "Количество должно быть больше нуля" };
  }

  if (!product.trackBatches) {
    const summary = stockSummary(productId);
    return {
      batchId: null,
      availableInBatch: summary.available,
      enough: summary.available >= requestedQty,
      warning: summary.available >= requestedQty ? "" : "Недостаточно доступного остатка",
    };
  }

  const candidates = listBatchesForProduct(productId, { includeArchived: false })
    .filter((b) => parseNum(b.qty, 0) > 0)
    .filter((b) => daysLeftByIso(b.expiryDate) >= 0)
    .sort(batchSortByExpiry);

  if (candidates.length === 0) {
    return { batchId: null, availableInBatch: 0, enough: false, warning: "Нет доступных партий" };
  }

  const exact = candidates.find((b) => parseNum(b.qty, 0) >= requestedQty);
  if (exact) {
    return {
      batchId: exact.id,
      availableInBatch: parseNum(exact.qty, 0),
      enough: true,
      warning: "",
    };
  }

  const fallback = candidates
    .slice()
    .sort((a, b) => parseNum(b.qty, 0) - parseNum(a.qty, 0))[0];

  return {
    batchId: fallback.id,
    availableInBatch: parseNum(fallback.qty, 0),
    enough: false,
    warning: "Не хватает в одной партии, разбейте позицию вручную",
  };
}

export function listDealItems(dealId) {
  return Store.list(WH_COLLECTIONS.dealItems).filter((x) => x.dealId === dealId);
}

export function seedWarehouseDemo() {
  ensureCategoriesSeeded();
  if (Store.list(WH_COLLECTIONS.products).length > 0) return false;

  const categories = listProductCategories();
  const byName = (name) => categories.find((c) => c.name === name)?.id || categories[0]?.id || null;

  const products = [
    {
      sku: "SKU-001247",
      barcode: "4607010691234",
      name: "Пластырь Hartmann Cosmos Strips 5×7,2 см",
      categoryId: byName("Пластыри"),
      unit: "уп.",
      costPrice: 1200,
      sellPrice: 1850,
      minStock: 50,
      trackBatches: true,
      regNumber: "КЗ.05.07.2022",
    },
    {
      sku: "SKU-001248",
      barcode: "4607010691235",
      name: "Пластырь бактерицидный Master Uni 20 шт",
      categoryId: byName("Пластыри"),
      unit: "уп.",
      costPrice: 980,
      sellPrice: 1490,
      minStock: 40,
      trackBatches: true,
      regNumber: "КЗ.11.03.2023",
    },
    {
      sku: "SKU-003001",
      barcode: "4607101000001",
      name: "Бинт марлевый стерильный 7×14",
      categoryId: byName("Перевязка"),
      unit: "шт.",
      costPrice: 210,
      sellPrice: 288,
      minStock: 120,
      trackBatches: true,
      regNumber: "КЗ.14.08.2021",
    },
    {
      sku: "SKU-004201",
      barcode: "4607101000002",
      name: "Салфетки спиртовые 100 шт",
      categoryId: byName("Антисептики"),
      unit: "уп.",
      costPrice: 760,
      sellPrice: 1090,
      minStock: 35,
      trackBatches: true,
      regNumber: "КЗ.21.10.2020",
    },
    {
      sku: "SKU-005777",
      barcode: "4607101000003",
      name: "Шприц 3-компонентный 5 мл",
      categoryId: byName("Шприцы и иглы"),
      unit: "шт.",
      costPrice: 190,
      sellPrice: 310,
      minStock: 300,
      trackBatches: true,
      regNumber: "КЗ.09.01.2024",
    },
    {
      sku: "SKU-005778",
      barcode: "4607101000004",
      name: "Игла инъекционная 21G",
      categoryId: byName("Шприцы и иглы"),
      unit: "шт.",
      costPrice: 85,
      sellPrice: 140,
      minStock: 400,
      trackBatches: true,
      regNumber: "КЗ.09.01.2024",
    },
    {
      sku: "SKU-007000",
      barcode: "4607101000005",
      name: "Антисептик 70% 100 мл",
      categoryId: byName("Антисептики"),
      unit: "фл.",
      costPrice: 340,
      sellPrice: 560,
      minStock: 90,
      trackBatches: true,
      regNumber: "КЗ.17.02.2022",
    },
    {
      sku: "SKU-008401",
      barcode: "4607101000006",
      name: "Перчатки нитриловые M, 100 шт",
      categoryId: byName("СИЗ"),
      unit: "уп.",
      costPrice: 1980,
      sellPrice: 2750,
      minStock: 25,
      trackBatches: true,
      regNumber: "КЗ.30.11.2023",
    },
    {
      sku: "SKU-009302",
      barcode: "4607101000007",
      name: "Маска медицинская 3-слойная",
      categoryId: byName("СИЗ"),
      unit: "уп.",
      costPrice: 640,
      sellPrice: 980,
      minStock: 45,
      trackBatches: true,
      regNumber: "КЗ.05.05.2021",
    },
    {
      sku: "SKU-010110",
      barcode: "4607101000008",
      name: "Перекись водорода 3%",
      categoryId: byName("Антисептики"),
      unit: "фл.",
      costPrice: 210,
      sellPrice: 360,
      minStock: 70,
      trackBatches: true,
      regNumber: "КЗ.07.07.2020",
    },
  ];

  const created = products.map((item) => saveProduct(item));

  const today = startOfDay();
  const addDemoBatch = (product, idx, qty1, qty2, cost) => {
    const exp1 = dateToIso(today + (60 + idx * 7) * DAY_MS);
    const exp2 = dateToIso(today + (180 + idx * 9) * DAY_MS);
    const recv1 = dateToIso(today - (40 + idx) * DAY_MS);
    const recv2 = dateToIso(today - (15 + idx) * DAY_MS);

    addBatch(product.id, {
      batchNumber: `B-${1000 + idx}`,
      manufactureDate: dateToIso(today - (180 + idx * 5) * DAY_MS),
      expiryDate: exp1,
      initialQty: qty1,
      qty: qty1,
      costPrice: cost,
      supplierName: "Медтехсервис",
      receivedAt: recv1,
    });

    addBatch(product.id, {
      batchNumber: `B-${2000 + idx}`,
      manufactureDate: dateToIso(today - (130 + idx * 3) * DAY_MS),
      expiryDate: exp2,
      initialQty: qty2,
      qty: qty2,
      costPrice: Math.max(1, cost + 15),
      supplierName: "КазМедПоставка",
      receivedAt: recv2,
    });
  };

  created.forEach((p, idx) => {
    const baseQty = 30 + idx * 8;
    addDemoBatch(p, idx, baseQty, baseQty + 20, p.costPrice || 100);
  });

  const gloves = created.find((x) => x.sku === "SKU-008401");
  if (gloves) {
    addBatch(gloves.id, {
      batchNumber: "N-0824",
      manufactureDate: dateToIso(today - 300 * DAY_MS),
      expiryDate: dateToIso(today - 5 * DAY_MS),
      initialQty: 40,
      qty: 40,
      costPrice: 1820,
      supplierName: "MedLine",
      receivedAt: dateToIso(today - 120 * DAY_MS),
      note: "Просрочка для демо",
    });
  }

  return true;
}
