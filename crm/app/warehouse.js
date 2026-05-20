import { Store } from "./store.js";
import { currentEmployee } from "./employees.js";

export const WH = {
  products: "warehouse_products",
  lots: "warehouse_lots",
  movements: "warehouse_movements",
  documents: "warehouse_documents",
};

export const WAREHOUSE_ENTITIES = ["ИП", "ТОО"];
export const DOCUMENT_TYPES = [
  "receipt",
  "sale_invoice",
  "sale_act",
  "writeoff_act",
  "damage_act",
  "return_in",
  "return_out",
  "transfer",
];

const OUT_DOC_TYPES = new Set(["sale_invoice", "sale_act", "writeoff_act", "damage_act", "return_out", "transfer"]);
const IN_DOC_TYPES = new Set(["receipt", "return_in"]);

const MOVEMENT_TYPE_BY_DOC = {
  receipt: "receipt",
  sale_invoice: "sale",
  sale_act: "sale",
  writeoff_act: "writeoff",
  damage_act: "damage",
  return_in: "return_in",
  return_out: "return_out",
  transfer: "transfer",
};

function nowTs() {
  return Date.now();
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asText(v) {
  return String(v || "").trim();
}

function dayIso(input, fallback = "") {
  if (!input && fallback) return fallback;
  if (!input) return "";
  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{2}\.\d{2}\.\d{4}(г\.)?$/.test(s)) {
      const clean = s.replace("г.", "");
      const [dd, mm, yyyy] = clean.split(".");
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function safeList(collection) {
  return Store.list(collection) || [];
}

function meActor() {
  const me = currentEmployee();
  return {
    id: me?.id || null,
    email: me?.email || "",
    name: me?.name || me?.email || "system",
  };
}

function compareDateAsc(a, b) {
  const at = new Date(`${a || "1900-01-01"}T00:00:00`).getTime() || 0;
  const bt = new Date(`${b || "1900-01-01"}T00:00:00`).getTime() || 0;
  return at - bt;
}

function sortLotsFifo(a, b) {
  const byInDate = compareDateAsc(a.inDate, b.inDate);
  if (byInDate !== 0) return byInDate;
  const byExpiry = compareDateAsc(a.expiryDate, b.expiryDate);
  if (byExpiry !== 0) return byExpiry;
  return String(a.id).localeCompare(String(b.id));
}

function movementDateTs(m) {
  const base = new Date(`${m.date || "1900-01-01"}T00:00:00`).getTime() || 0;
  return base + (Number(m.createdAt) || 0) % 86400000;
}

export function canEditWarehouse() {
  const me = currentEmployee();
  if (!me) return false;
  if (me.isSuperAdmin || me.isAdmin || me.role === "admin") return true;
  if (me.role === "viewer") return false;
  if (me.role === "manager") return true;
  return true;
}

export function ensureWarehouseSeed() {
  const products = safeList(WH.products);
  if (products.length > 0) return;

  const p1 = Store.create(WH.products, {
    sku: "WHS-1530-0",
    name: "1530-0 Микропор 1,25см×9,1м",
    category: "Перевязочные материалы",
    entity: "ТОО",
    unit: "шт",
    pack: "24шт/кор",
    description: "Демо-товар для проверки FIFO",
    minStock: 80,
    isArchived: false,
  });

  const p2 = Store.create(WH.products, {
    sku: "WHS-CLN-03",
    name: "Универсальный очиститель 3л",
    category: "Биокосметика",
    entity: "ИП",
    unit: "шт",
    pack: "1 канистра",
    description: "Демо-товар",
    minStock: 10,
    isArchived: false,
  });

  const lot1 = Store.create(WH.lots, {
    productId: p1.id,
    lotCode: "10214147",
    expiryDate: dayIso("2026-06-10"),
    expiryRaw: "10.06.2026",
    inDate: dayIso("2026-01-10"),
    initialQty: 70,
    currentQty: 70,
    supplierDocId: null,
    supplierContactId: null,
    note: "Демо остаток",
  });

  const lot2 = Store.create(WH.lots, {
    productId: p1.id,
    lotCode: "10292483",
    expiryDate: dayIso("2026-07-15"),
    expiryRaw: "15.07.2026",
    inDate: dayIso("2026-02-20"),
    initialQty: 50,
    currentQty: 50,
    supplierDocId: null,
    supplierContactId: null,
    note: "Демо остаток",
  });

  const actor = meActor();
  Store.create(WH.movements, {
    productId: p1.id,
    lotId: lot1.id,
    date: dayIso("2026-01-10"),
    qty: 70,
    direction: "in",
    type: "opening",
    docId: null,
    counterpartyContactId: null,
    counterpartyText: "Остаток на старт",
    dealId: null,
    note: "Стартовый остаток",
    balanceAfter: 70,
    createdBy: actor.id,
  });
  Store.create(WH.movements, {
    productId: p1.id,
    lotId: lot2.id,
    date: dayIso("2026-02-20"),
    qty: 50,
    direction: "in",
    type: "opening",
    docId: null,
    counterpartyContactId: null,
    counterpartyText: "Остаток на старт",
    dealId: null,
    note: "Стартовый остаток",
    balanceAfter: 50,
    createdBy: actor.id,
  });

  Store.create(WH.products, {
    sku: "WHS-DEMO-COUNT",
    name: `Демо остатки: ${p2.name}`,
    category: "Демо",
    entity: "ИП",
    unit: "шт",
    pack: "",
    description: "Служебная запись для демо списка",
    minStock: 1,
    isArchived: true,
  });
}

export function migrateWarehouseLegacyCollections() {
  const flagKey = "pllato_warehouse_rename_v1";
  if (localStorage.getItem(flagKey) === "1") return;
  // В этой ветке legacy-коллекции уже не используются.
  // Оставляем idempotent-хук, чтобы не падал импорт в renderWarehouse.
  localStorage.setItem(flagKey, "1");
}

export function listWarehouseProducts(filters = {}) {
  const query = asText(filters.query).toLowerCase();
  const entity = asText(filters.entity);
  const category = asText(filters.category);
  const includeArchived = Boolean(filters.includeArchived);

  return safeList(WH.products)
    .filter((p) => includeArchived || !p.isArchived)
    .filter((p) => !query || `${p.sku || ""} ${p.name || ""}`.toLowerCase().includes(query))
    .filter((p) => !entity || p.entity === entity)
    .filter((p) => !category || p.category === category)
    .map((p) => ({ ...p, summary: productSummary(p.id) }))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ru"));
}

export function listWarehouseCategories() {
  const set = new Set();
  safeList(WH.products).forEach((p) => {
    const c = asText(p.category);
    if (c) set.add(c);
  });
  return [...set].sort((a, b) => a.localeCompare(b, "ru"));
}

export function getWarehouseProduct(productId) {
  return productId ? Store.get(WH.products, productId) : null;
}

export function saveWarehouseProduct(payload = {}) {
  const data = {
    sku: asText(payload.sku),
    name: asText(payload.name),
    category: asText(payload.category),
    entity: asText(payload.entity),
    unit: asText(payload.unit) || "шт",
    pack: asText(payload.pack),
    description: asText(payload.description),
    minStock: Math.max(0, toNum(payload.minStock, 0)),
    isArchived: Boolean(payload.isArchived),
  };

  if (!data.sku) throw new Error("Укажи SKU");
  if (!data.name) throw new Error("Укажи название");
  if (!data.entity) throw new Error("Укажи юр.лицо");

  const duplicate = safeList(WH.products).find((p) => p.sku?.toLowerCase() === data.sku.toLowerCase() && p.id !== payload.id);
  if (duplicate) throw new Error("SKU уже используется");

  if (payload.id) {
    return Store.update(WH.products, payload.id, data);
  }
  return Store.create(WH.products, data);
}

export function listLotsForProduct(productId, opts = {}) {
  const activeOnly = Boolean(opts.activeOnly);
  return safeList(WH.lots)
    .filter((l) => l.productId === productId)
    .filter((l) => !activeOnly || toNum(l.currentQty, 0) > 0)
    .sort(sortLotsFifo);
}

export function getLot(lotId) {
  return lotId ? Store.get(WH.lots, lotId) : null;
}

export function saveLot(payload = {}) {
  if (!payload.productId) throw new Error("productId обязателен");
  const data = {
    productId: payload.productId,
    lotCode: asText(payload.lotCode),
    expiryDate: dayIso(payload.expiryDate),
    expiryRaw: asText(payload.expiryRaw || payload.expiryDate),
    inDate: dayIso(payload.inDate) || dayIso(new Date()),
    initialQty: Math.max(0, toNum(payload.initialQty, 0)),
    currentQty: Math.max(0, toNum(payload.currentQty, payload.initialQty || 0)),
    supplierDocId: payload.supplierDocId || null,
    supplierContactId: payload.supplierContactId || null,
    note: asText(payload.note),
  };
  if (!data.lotCode) throw new Error("LOT обязателен");

  if (payload.id) return Store.update(WH.lots, payload.id, data);
  return Store.create(WH.lots, data);
}

export function listWarehouseMovements(filters = {}) {
  const productId = filters.productId || null;
  const lotId = filters.lotId || null;
  const docId = filters.docId || null;
  return safeList(WH.movements)
    .filter((m) => !productId || m.productId === productId)
    .filter((m) => !lotId || m.lotId === lotId)
    .filter((m) => !docId || m.docId === docId)
    .sort((a, b) => movementDateTs(a) - movementDateTs(b));
}

export function listGroupedMovementsByLot(productId) {
  const lots = listLotsForProduct(productId, { activeOnly: false });
  const lotMap = new Map(lots.map((l) => [l.id, l]));
  const grouped = new Map();

  listWarehouseMovements({ productId }).forEach((m) => {
    const key = m.lotId || "_unknown";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(m);
  });

  const out = [];
  grouped.forEach((rows, lotId) => {
    out.push({
      lotId,
      lot: lotMap.get(lotId) || null,
      rows: rows.sort((a, b) => movementDateTs(a) - movementDateTs(b)),
    });
  });

  out.sort((a, b) => sortLotsFifo(a.lot || {}, b.lot || {}));
  return out;
}

export function productSummary(productId) {
  const lots = listLotsForProduct(productId, { activeOnly: false });
  const total = lots.reduce((sum, l) => sum + Math.max(0, toNum(l.currentQty, 0)), 0);
  const activeLots = lots.filter((l) => toNum(l.currentQty, 0) > 0);

  const nearest = activeLots
    .filter((l) => l.expiryDate)
    .sort((a, b) => compareDateAsc(a.expiryDate, b.expiryDate))[0] || null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiredCount = activeLots.filter((l) => {
    if (!l.expiryDate) return false;
    const t = new Date(`${l.expiryDate}T00:00:00`).getTime();
    return Number.isFinite(t) && t < now.getTime();
  }).length;

  return {
    total,
    activeLots: activeLots.length,
    nearestExpiry: nearest?.expiryDate || "",
    expiredCount,
  };
}

function nextDocNumber(prefix = "DOC") {
  const all = safeList(WH.documents);
  return `${prefix}-${all.length + 1}`;
}

function normalizeDocItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item, idx) => {
      const qty = Math.max(0, toNum(item.qty, 0));
      const unitPrice = Math.max(0, toNum(item.unitPrice, 0));
      const lineAmount = item.lineAmount == null ? qty * unitPrice : Math.max(0, toNum(item.lineAmount, 0));
      return {
        lineId: item.lineId || `line_${idx + 1}_${Math.random().toString(36).slice(2, 7)}`,
        splitFromLineId: item.splitFromLineId || null,
        productId: item.productId || null,
        lotId: item.lotId || null,
        lotCode: asText(item.lotCode),
        expiryDate: dayIso(item.expiryDate),
        qty,
        unitPrice,
        lineAmount,
      };
    })
    .filter((line) => line.productId && line.qty > 0);
}

export function listWarehouseDocuments(filters = {}) {
  const type = asText(filters.type);
  const status = asText(filters.status);
  return safeList(WH.documents)
    .filter((d) => !type || d.type === type)
    .filter((d) => !status || d.status === status)
    .sort((a, b) => {
      const byDate = compareDateAsc(b.date, a.date);
      if (byDate !== 0) return byDate;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
}

export function getWarehouseDocument(docId) {
  return docId ? Store.get(WH.documents, docId) : null;
}

export function createWarehouseDocument(payload = {}) {
  const actor = meActor();
  const type = payload.type || "receipt";
  const date = dayIso(payload.date) || dayIso(new Date());

  const doc = {
    type,
    number: asText(payload.number) || nextDocNumber(type.toUpperCase()),
    date,
    counterpartyContactId: payload.counterpartyContactId || null,
    counterpartyText: asText(payload.counterpartyText),
    dealId: payload.dealId || null,
    items: normalizeDocItems(payload.items),
    totalAmount: Math.max(0, toNum(payload.totalAmount, 0)),
    currency: asText(payload.currency) || "KZT",
    status: payload.status || "draft",
    note: asText(payload.note),
    attachedFiles: Array.isArray(payload.attachedFiles) ? payload.attachedFiles : [],
    createdBy: actor.id,
  };

  if (!DOCUMENT_TYPES.includes(doc.type)) throw new Error("Неизвестный тип документа");
  return Store.create(WH.documents, doc);
}

export function updateWarehouseDocument(docId, patch = {}) {
  const doc = getWarehouseDocument(docId);
  if (!doc) throw new Error("Документ не найден");
  if (doc.status === "cancelled") throw new Error("Отменённый документ нельзя редактировать");
  if (doc.status === "posted") throw new Error("Проведённый документ нельзя редактировать");

  const next = {
    type: patch.type || doc.type,
    number: patch.number == null ? doc.number : asText(patch.number),
    date: patch.date == null ? doc.date : dayIso(patch.date, doc.date),
    counterpartyContactId: patch.counterpartyContactId === undefined ? doc.counterpartyContactId : (patch.counterpartyContactId || null),
    counterpartyText: patch.counterpartyText === undefined ? doc.counterpartyText : asText(patch.counterpartyText),
    dealId: patch.dealId === undefined ? doc.dealId : (patch.dealId || null),
    items: patch.items === undefined ? normalizeDocItems(doc.items) : normalizeDocItems(patch.items),
    totalAmount: patch.totalAmount == null ? doc.totalAmount : Math.max(0, toNum(patch.totalAmount, 0)),
    currency: patch.currency == null ? doc.currency : asText(patch.currency || "KZT"),
    note: patch.note == null ? doc.note : asText(patch.note),
    attachedFiles: patch.attachedFiles === undefined ? (Array.isArray(doc.attachedFiles) ? doc.attachedFiles : []) : (Array.isArray(patch.attachedFiles) ? patch.attachedFiles : []),
  };

  if (!DOCUMENT_TYPES.includes(next.type)) throw new Error("Неизвестный тип документа");
  if (!next.number) throw new Error("Укажи номер документа");
  if (!next.date) throw new Error("Укажи дату документа");

  return Store.update(WH.documents, docId, next);
}

function stockMapByLot() {
  const map = new Map();
  safeList(WH.lots).forEach((lot) => {
    map.set(lot.id, {
      lot,
      qty: Math.max(0, toNum(lot.currentQty, 0)),
    });
  });
  return map;
}

function pickFifoLots(productId, qty, lotStateMap) {
  const openLots = listLotsForProduct(productId, { activeOnly: true });
  let remaining = Math.max(0, toNum(qty, 0));
  const picked = [];

  for (const lot of openLots) {
    if (remaining <= 0) break;
    const state = lotStateMap.get(lot.id);
    if (!state || state.qty <= 0) continue;
    const take = Math.min(state.qty, remaining);
    if (take <= 0) continue;
    picked.push({ lotId: lot.id, qty: take });
    state.qty -= take;
    remaining -= take;
  }

  return { picked, remaining };
}

export function autoSplitDocumentItems(type, items = []) {
  if (!OUT_DOC_TYPES.has(type)) return normalizeDocItems(items);
  const input = normalizeDocItems(items);
  const lotStateMap = stockMapByLot();
  const out = [];

  for (const line of input) {
    if (line.lotId) {
      out.push({ ...line, splitFromLineId: line.splitFromLineId || null });
      const state = lotStateMap.get(line.lotId);
      if (state) state.qty = Math.max(0, state.qty - line.qty);
      continue;
    }

    const { picked, remaining } = pickFifoLots(line.productId, line.qty, lotStateMap);
    if (picked.length === 0) {
      out.push({ ...line });
      continue;
    }

    picked.forEach((part, idx) => {
      out.push({
        ...line,
        lineId: idx === 0 ? line.lineId : `${line.lineId}_split_${idx}`,
        lotId: part.lotId,
        qty: part.qty,
        lineAmount: part.qty * line.unitPrice,
        splitFromLineId: idx === 0 ? null : line.lineId,
      });
    });

    if (remaining > 0) {
      out.push({
        ...line,
        lineId: `${line.lineId}_shortage`,
        lotId: null,
        qty: remaining,
        lineAmount: remaining * line.unitPrice,
        splitFromLineId: line.lineId,
        shortage: true,
      });
    }
  }

  return out;
}

function movementTypeForDoc(type) {
  return MOVEMENT_TYPE_BY_DOC[type] || "adjustment";
}

function documentDirection(type) {
  if (OUT_DOC_TYPES.has(type)) return "out";
  if (IN_DOC_TYPES.has(type)) return "in";
  return "out";
}

function buildPostingPlan(doc) {
  const direction = documentDirection(doc.type);
  const movementType = movementTypeForDoc(doc.type);
  const actor = meActor();
  const lotState = stockMapByLot();
  const lotUpdates = [];
  const lotCreates = [];
  const movementCreates = [];
  const finalItems = [];

  const rows = direction === "out" ? autoSplitDocumentItems(doc.type, doc.items) : normalizeDocItems(doc.items);
  if (!rows.length) throw new Error("Добавь хотя бы одну позицию");

  for (const row of rows) {
    const product = getWarehouseProduct(row.productId);
    if (!product) throw new Error("Товар в документе не найден");
    if (row.qty <= 0) continue;

    if (direction === "out") {
      if (!row.lotId) throw new Error(`Недостаточно остатка по товару «${product.name}»`);
      const state = lotState.get(row.lotId);
      if (!state || state.qty < row.qty) throw new Error(`Недостаточно остатка в партии для «${product.name}»`);
      state.qty -= row.qty;

      lotUpdates.push({ lotId: row.lotId, currentQty: state.qty });
      movementCreates.push({
        productId: row.productId,
        lotId: row.lotId,
        lineRef: row.lineId,
        date: doc.date,
        qty: row.qty,
        direction: "out",
        type: movementType,
        docId: doc.id,
        counterpartyContactId: doc.counterpartyContactId || null,
        counterpartyText: doc.counterpartyText || "",
        dealId: doc.dealId || null,
        note: doc.note || "",
        balanceAfter: state.qty,
        createdBy: actor.id,
        splitFromLineId: row.splitFromLineId || null,
      });
      finalItems.push({ ...row, shortage: false });
      continue;
    }

    let lotId = row.lotId;
    if (lotId) {
      const state = lotState.get(lotId);
      if (!state) throw new Error("Выбранная партия не найдена");
      state.qty += row.qty;
      lotUpdates.push({ lotId, currentQty: state.qty });
      movementCreates.push({
        productId: row.productId,
        lotId,
        lineRef: row.lineId,
        date: doc.date,
        qty: row.qty,
        direction: "in",
        type: movementType,
        docId: doc.id,
        counterpartyContactId: doc.counterpartyContactId || null,
        counterpartyText: doc.counterpartyText || "",
        dealId: doc.dealId || null,
        note: doc.note || "",
        balanceAfter: state.qty,
        createdBy: actor.id,
        splitFromLineId: row.splitFromLineId || null,
      });
      finalItems.push({ ...row });
    } else {
      const lotCode = row.lotCode || `${doc.number}-${finalItems.length + 1}`;
      const createdLot = {
        productId: row.productId,
        lotCode,
        expiryDate: dayIso(row.expiryDate),
        expiryRaw: row.expiryDate || "",
        inDate: dayIso(doc.date),
        initialQty: row.qty,
        currentQty: row.qty,
        supplierDocId: doc.id,
        supplierContactId: doc.counterpartyContactId || null,
        note: doc.note || "",
      };
      lotCreates.push(createdLot);
      const tempLotKey = `__new_${lotCreates.length - 1}`;
      finalItems.push({ ...row, lotId: tempLotKey });
      movementCreates.push({
        productId: row.productId,
        lotId: tempLotKey,
        lineRef: row.lineId,
        date: doc.date,
        qty: row.qty,
        direction: "in",
        type: movementType,
        docId: doc.id,
        counterpartyContactId: doc.counterpartyContactId || null,
        counterpartyText: doc.counterpartyText || "",
        dealId: doc.dealId || null,
        note: doc.note || "",
        balanceAfter: row.qty,
        createdBy: actor.id,
        splitFromLineId: row.splitFromLineId || null,
      });
    }
  }

  return { direction, rows: finalItems, lotUpdates, lotCreates, movementCreates, actor };
}

export function postWarehouseDocument(docId) {
  const doc = getWarehouseDocument(docId);
  if (!doc) throw new Error("Документ не найден");
  if (doc.status !== "draft") throw new Error("Провести можно только черновик");

  const plan = buildPostingPlan(doc);

  const createdLotIds = [];
  plan.lotCreates.forEach((lotPayload) => {
    const created = Store.create(WH.lots, lotPayload);
    createdLotIds.push(created.id);
  });

  plan.lotUpdates.forEach((patch) => {
    const lot = getLot(patch.lotId);
    if (!lot) throw new Error("Партия не найдена в момент проведения");
    Store.update(WH.lots, lot.id, { currentQty: patch.currentQty });
  });

  const resolveTempLotId = (lotId) => {
    if (!lotId) return null;
    if (typeof lotId === "string" && lotId.startsWith("__new_")) {
      const idx = Number(lotId.replace("__new_", ""));
      return createdLotIds[idx] || null;
    }
    return lotId;
  };

  const rows = plan.rows.map((row) => ({ ...row, lotId: resolveTempLotId(row.lotId) }));

  const now = nowTs();
  let movementIndex = 0;
  plan.movementCreates.forEach((movement) => {
    let lotId = resolveTempLotId(movement.lotId);
    if (!lotId && movement.lineRef) {
      const line = rows.find((x) => x.lineId === movement.lineRef);
      lotId = resolveTempLotId(line?.lotId || null);
    }
    Store.create(WH.movements, {
      ...movement,
      lotId,
      createdAt: now + movementIndex,
    });
    movementIndex += 1;
  });

  const totalAmount = rows.reduce((sum, x) => sum + Math.max(0, toNum(x.lineAmount, x.qty * x.unitPrice)), 0);
  return Store.update(WH.documents, doc.id, {
    status: "posted",
    postedAt: now,
    items: rows,
    totalAmount,
  });
}

function buildCancelPlan(doc) {
  const direction = documentDirection(doc.type);
  const reverseDirection = direction === "out" ? "in" : "out";
  const movementType = movementTypeForDoc(doc.type);
  const actor = meActor();
  const lotState = stockMapByLot();
  const lotUpdates = [];
  const movementCreates = [];

  const rows = normalizeDocItems(doc.items);
  for (const row of rows) {
    if (!row.lotId) continue;
    const state = lotState.get(row.lotId);
    if (!state) throw new Error("Партия из документа не найдена");

    if (reverseDirection === "out") {
      if (state.qty < row.qty) {
        throw new Error("Нельзя отменить: в одной из партий не хватает остатка для сторно");
      }
      state.qty -= row.qty;
    } else {
      state.qty += row.qty;
    }

    lotUpdates.push({ lotId: row.lotId, currentQty: state.qty });
    movementCreates.push({
      productId: row.productId,
      lotId: row.lotId,
      date: dayIso(new Date()),
      qty: row.qty,
      direction: reverseDirection,
      type: movementType,
      docId: doc.id,
      counterpartyContactId: doc.counterpartyContactId || null,
      counterpartyText: doc.counterpartyText || "",
      dealId: doc.dealId || null,
      note: `Сторно документа ${doc.number}`,
      balanceAfter: state.qty,
      createdBy: actor.id,
      isStorno: true,
      splitFromLineId: row.splitFromLineId || null,
    });
  }

  return { lotUpdates, movementCreates };
}

export function cancelWarehouseDocument(docId) {
  const doc = getWarehouseDocument(docId);
  if (!doc) throw new Error("Документ не найден");
  if (doc.status !== "posted") throw new Error("Отменить можно только проведённый документ");

  const plan = buildCancelPlan(doc);
  plan.lotUpdates.forEach((patch) => {
    Store.update(WH.lots, patch.lotId, { currentQty: patch.currentQty });
  });
  plan.movementCreates.forEach((mv) => {
    Store.create(WH.movements, mv);
  });

  return Store.update(WH.documents, doc.id, {
    status: "cancelled",
    cancelledAt: nowTs(),
  });
}

export function listWarehouseKpis() {
  const products = listWarehouseProducts({ includeArchived: false });
  const lots = safeList(WH.lots);
  const activeLots = lots.filter((l) => toNum(l.currentQty, 0) > 0);
  const docs = safeList(WH.documents);

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const in30 = now.getTime() + 30 * 86400000;
  const expiringSoon = activeLots.filter((l) => {
    if (!l.expiryDate) return false;
    const ts = new Date(`${l.expiryDate}T00:00:00`).getTime();
    return Number.isFinite(ts) && ts >= now.getTime() && ts <= in30;
  });
  const expired = activeLots.filter((l) => {
    if (!l.expiryDate) return false;
    const ts = new Date(`${l.expiryDate}T00:00:00`).getTime();
    return Number.isFinite(ts) && ts < now.getTime();
  });

  return {
    products: products.length,
    activeLots: activeLots.length,
    expiringSoon: expiringSoon.length,
    expired: expired.length,
    docsMonth: docs.filter((d) => {
      if (!d.date) return false;
      const dt = new Date(`${d.date}T00:00:00`);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length,
  };
}

export function listWarehouseAlerts() {
  const alerts = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const in30 = now.getTime() + 30 * 86400000;

  safeList(WH.lots).forEach((lot) => {
    const qty = Math.max(0, toNum(lot.currentQty, 0));
    if (qty <= 0 || !lot.expiryDate) return;
    const ts = new Date(`${lot.expiryDate}T00:00:00`).getTime();
    if (!Number.isFinite(ts)) return;
    if (ts < now.getTime()) {
      alerts.push({ level: "danger", lotId: lot.id, message: `LOT ${lot.lotCode} просрочена`, expiryDate: lot.expiryDate });
    } else if (ts <= in30) {
      alerts.push({ level: "warning", lotId: lot.id, message: `LOT ${lot.lotCode} истекает в 30 дней`, expiryDate: lot.expiryDate });
    }
  });

  return alerts.slice(0, 12);
}

export function listWarehouseDocumentsByContact(contactId, limit = 5) {
  return listWarehouseDocuments({})
    .filter((d) => d.counterpartyContactId === contactId)
    .sort((a, b) => compareDateAsc(b.date, a.date))
    .slice(0, Math.max(1, limit));
}

export function buildBalancesOnDate(reportDateIso) {
  const endTs = new Date(`${reportDateIso}T23:59:59`).getTime();
  if (!Number.isFinite(endTs)) return [];

  const products = safeList(WH.products).filter((p) => !p.isArchived);
  const lotById = new Map(safeList(WH.lots).map((lot) => [lot.id, lot]));

  const balances = new Map();
  safeList(WH.movements)
    .filter((m) => {
      const ts = new Date(`${m.date || "1900-01-01"}T00:00:00`).getTime();
      return Number.isFinite(ts) && ts <= endTs;
    })
    .sort((a, b) => movementDateTs(a) - movementDateTs(b))
    .forEach((m) => {
      const key = `${m.productId}::${m.lotId || "_none"}`;
      const prev = balances.get(key) || 0;
      const delta = m.direction === "out" ? -Math.abs(toNum(m.qty, 0)) : Math.abs(toNum(m.qty, 0));
      balances.set(key, prev + delta);
    });

  const out = [];
  balances.forEach((qty, key) => {
    if (qty <= 0) return;
    const [productId, lotId] = key.split("::");
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const lot = lotById.get(lotId);
    out.push({
      productId,
      sku: product.sku,
      name: product.name,
      entity: product.entity,
      unit: product.unit || "шт",
      lotCode: lot?.lotCode || "—",
      expiryDate: lot?.expiryDate || "",
      qty,
    });
  });

  return out.sort((a, b) => a.name.localeCompare(b.name, "ru") || a.lotCode.localeCompare(b.lotCode, "ru"));
}

export function parseExpiryValue(value) {
  if (value == null || value === "") return { expiryDate: null, expiryRaw: "" };

  if (typeof value === "number" && value > 40000) {
    const date = new Date((value - 25569) * 86400 * 1000);
    if (!Number.isNaN(date.getTime())) {
      return { expiryDate: date.toISOString().slice(0, 10), expiryRaw: String(value) };
    }
  }

  const text = String(value).trim();
  if (!text) return { expiryDate: null, expiryRaw: "" };

  if (/^\d{2}\.\d{2}\.\d{4}(г\.)?$/.test(text)) {
    const clean = text.replace("г.", "");
    const [dd, mm, yyyy] = clean.split(".");
    return { expiryDate: `${yyyy}-${mm}-${dd}`, expiryRaw: text };
  }

  const monthMap = {
    январ: 0,
    феврал: 1,
    март: 2,
    апрел: 3,
    май: 4,
    маи: 4,
    июн: 5,
    июл: 6,
    август: 7,
    сентябр: 8,
    октябр: 9,
    ноябр: 10,
    декабр: 11,
  };

  const lower = text.toLowerCase();
  const yearMatch = lower.match(/(19|20)\d{2}/);
  if (yearMatch) {
    const year = Number(yearMatch[0]);
    const monthEntry = Object.entries(monthMap).find(([k]) => lower.includes(k));
    if (monthEntry) {
      const month = monthEntry[1];
      const end = new Date(year, month + 1, 0);
      return { expiryDate: end.toISOString().slice(0, 10), expiryRaw: text };
    }
  }

  return { expiryDate: null, expiryRaw: text };
}

export function importSummaryConflict(expectedBalance, actualBalance) {
  const expected = Math.abs(toNum(expectedBalance, 0));
  const actual = Math.abs(toNum(actualBalance, 0));
  const diff = Math.abs(expected - actual);
  if (diff <= 0) return { conflict: false, diff: 0 };
  const byPercent = expected > 0 ? diff / expected : diff > 0 ? 1 : 0;
  const conflict = byPercent > 0.01 || diff > 5;
  return { conflict, diff, byPercent };
}
