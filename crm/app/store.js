// Pllato CRM — Store API.
// Local-first хранилище с cloud-sync в Cloudflare Worker (/store/*).
// Интерфейс Store сохранен синхронным для совместимости со всеми view.
import { apiFetch } from "./auth.js";

const NS = "pllato_core_";
const QUEUE_KEY = "pllato_store_sync_queue_v1";
const SYNC_TS_KEY = "pllato_store_last_sync_ts";
const FLUSH_BATCH_SIZE = 200;
const AUTO_COLLECTIONS = [
  "contacts",
  "deals",
  "tasks",
  "feed",
  "chats",
  "chat_messages",
  "notifications",
  "employees",
  "roles",
  "organizations",
  "documents",
  "deal_activities",
  "task_comments",
  "contact_activities",
  "products",
  "product_categories",
  "batches",
  "stock_movements",
  "deal_items",
  "warehouse_products",
  "warehouse_lots",
  // 'warehouse_movements' исключён из cloud-sync: после импорта книги учёта
  // там десятки тысяч записей → pull через /store/pull сломает localStorage.
  // Движения хранятся в IndexedDB (см. app/wh_movements_db.js).
  "warehouse_documents",
];

const syncState = {
  bootstrapped: false,
  bootstrapping: null,
  flushTimer: null,
  flushing: false,
};

function cloudBase() {
  return String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
}

function cloudEnabled() {
  return Boolean(cloudBase());
}

function read(collection) {
  try {
    const parsed = JSON.parse(localStorage.getItem(NS + collection) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function write(collection, items) {
  localStorage.setItem(NS + collection, JSON.stringify(items));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function queueRead() {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function queueWrite(items) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

function enqueue(op) {
  const q = queueRead();
  q.push(op);
  queueWrite(q);
}

function sortByUpdatedDesc(items) {
  return [...items].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function extractCollectionsFromLocal() {
  const out = new Set(AUTO_COLLECTIONS);
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && k.startsWith(NS)) out.add(k.slice(NS.length));
  }
  return [...out].filter(Boolean);
}

function safeJson(obj) {
  try { return JSON.parse(JSON.stringify(obj)); }
  catch { return null; }
}

function normalizeItem(item) {
  if (!item || typeof item !== "object") return null;
  if (!item.id) return null;
  const now = Date.now();
  return {
    ...item,
    id: String(item.id),
    createdAt: Number(item.createdAt) || now,
    updatedAt: Number(item.updatedAt) || now,
  };
}

async function workerCall(path, payload) {
  if (!cloudBase()) throw new Error("Cloud store is disabled");
  return apiFetch(path, { method: "POST", body: payload || {} });
}

function scheduleFlush(delayMs = 800) {
  if (!cloudEnabled()) return;
  if (syncState.flushTimer) return;
  syncState.flushTimer = setTimeout(() => {
    syncState.flushTimer = null;
    flushQueue().catch((e) => console.warn("store flush failed:", e));
  }, delayMs);
}

async function flushQueue() {
  if (!cloudEnabled()) return false;
  if (syncState.flushing) return false;

  syncState.flushing = true;
  try {
    while (true) {
      const q = queueRead();
      if (q.length === 0) break;

      const batch = q.slice(0, FLUSH_BATCH_SIZE);
      await workerCall("/store/push", { ops: batch });
      queueWrite(q.slice(batch.length));
      localStorage.setItem(SYNC_TS_KEY, String(Date.now()));
    }
    return true;
  } finally {
    syncState.flushing = false;
  }
}

function mergeRemoteIntoLocal(collection, remoteItems) {
  const localItems = read(collection);
  const safeLocal = Array.isArray(localItems) ? localItems : [];
  const safeRemote = Array.isArray(remoteItems) ? remoteItems : [];
  const localMap = new Map(safeLocal.map((x) => [x.id, normalizeItem(x)]).filter((x) => x[1]));
  const remoteMap = new Map(safeRemote.map((x) => [x.id, normalizeItem(x)]).filter((x) => x[1]));

  const merged = new Map();
  const toPush = [];
  const ids = new Set([...localMap.keys(), ...remoteMap.keys()]);
  for (const id of ids) {
    const l = localMap.get(id);
    const r = remoteMap.get(id);
    if (l && r) {
      if ((l.updatedAt || 0) >= (r.updatedAt || 0)) {
        merged.set(id, l);
        if ((l.updatedAt || 0) > (r.updatedAt || 0)) {
          toPush.push({ type: "upsert", collection, item: safeJson(l) });
        }
      } else {
        merged.set(id, r);
      }
      continue;
    }
    if (l && !r) {
      merged.set(id, l);
      toPush.push({ type: "upsert", collection, item: safeJson(l) });
      continue;
    }
    if (!l && r) merged.set(id, r);
  }

  write(collection, sortByUpdatedDesc([...merged.values()]));
  return toPush.filter((x) => x.item);
}

async function cloudBootstrapInternal({ collections } = {}) {
  if (!cloudEnabled()) return { ok: false, reason: "cloud-disabled" };
  const list = (Array.isArray(collections) && collections.length > 0)
    ? collections
    : extractCollectionsFromLocal();

  const pull = await workerCall("/store/pull", { collections: list, limitPerCollection: 10000 });
  const toPush = [];
  for (const collection of list) {
    const remoteItems = Array.isArray(pull.collections?.[collection]) ? pull.collections[collection] : [];
    toPush.push(...mergeRemoteIntoLocal(collection, remoteItems));
  }

  if (toPush.length > 0) {
    const q = queueRead();
    queueWrite([...toPush, ...q]);
  }

  await flushQueue();
  localStorage.setItem(SYNC_TS_KEY, String(Date.now()));
  return { ok: true };
}

async function cloudSyncCollectionsInternal(collections, { pushLocalDivergence = true } = {}) {
  if (!cloudEnabled()) return { ok: false, reason: "cloud-disabled" };
  const list = (Array.isArray(collections) && collections.length > 0)
    ? collections.filter(Boolean)
    : extractCollectionsFromLocal();
  if (list.length === 0) return { ok: true, collections: [], pulled: 0 };

  const pull = await workerCall("/store/pull", { collections: list, limitPerCollection: 10000 });
  const toPush = [];
  let pulled = 0;
  for (const collection of list) {
    const remoteItems = Array.isArray(pull.collections?.[collection]) ? pull.collections[collection] : [];
    pulled += remoteItems.length;
    toPush.push(...mergeRemoteIntoLocal(collection, remoteItems));
  }

  if (pushLocalDivergence && toPush.length > 0) {
    const q = queueRead();
    queueWrite([...toPush, ...q]);
    await flushQueue();
  }

  localStorage.setItem(SYNC_TS_KEY, String(Date.now()));
  return { ok: true, collections: list, pulled };
}

export const Store = {
  list(collection) {
    return sortByUpdatedDesc(read(collection));
  },

  get(collection, id) {
    return read(collection).find((x) => x.id === id) || null;
  },

  create(collection, data) {
    const items = read(collection);
    const now = Date.now();
    const item = { ...data, id: uid(), createdAt: now, updatedAt: now };
    items.unshift(item);
    write(collection, items);

    enqueue({ type: "upsert", collection, item: safeJson(item) });
    scheduleFlush();
    return item;
  },

  update(collection, id, patch) {
    const items = read(collection);
    const i = items.findIndex((x) => x.id === id);
    if (i < 0) return null;
    items[i] = { ...items[i], ...patch, updatedAt: Date.now() };
    write(collection, items);

    enqueue({ type: "upsert", collection, item: safeJson(items[i]) });
    scheduleFlush();
    return items[i];
  },

  remove(collection, id) {
    const items = read(collection).filter((x) => x.id !== id);
    write(collection, items);

    enqueue({ type: "delete", collection, id: String(id) });
    scheduleFlush();
    return true;
  },

  seed(collection, items) {
    // В cloud-режиме не сидим демо-данные, пока не завершен bootstrap,
    // иначе можно размножить тестовые записи между устройствами.
    if (cloudEnabled() && !syncState.bootstrapped) return;
    if (read(collection).length > 0) return;
    const now = Date.now();
    const seeded = items.map((x, i) => ({
      ...x,
      id: uid(),
      createdAt: now - i * 60000,
      updatedAt: now - i * 60000,
    }));
    write(collection, seeded);

    for (const item of seeded) {
      enqueue({ type: "upsert", collection, item: safeJson(item) });
    }
    scheduleFlush(1200);
  },

  isBootstrapped() { return syncState.bootstrapped === true; },

  async cloudBootstrap(opts = {}) {
    if (syncState.bootstrapped) return { ok: true, cached: true };
    if (syncState.bootstrapping) return syncState.bootstrapping;

    syncState.bootstrapping = cloudBootstrapInternal(opts)
      .catch((e) => {
        console.warn("Store cloudBootstrap failed:", e);
        return { ok: false, error: e?.message || String(e) };
      })
      .finally(() => {
        syncState.bootstrapped = true;
        syncState.bootstrapping = null;
      });
    return syncState.bootstrapping;
  },

  async cloudFlushNow() {
    return flushQueue();
  },

  async cloudSyncCollections(collections, opts = {}) {
    return cloudSyncCollectionsInternal(collections, opts);
  },
};
