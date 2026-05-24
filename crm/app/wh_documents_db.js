// Pllato CRM — IndexedDB-хранилище для warehouse_documents.
// Аналогично wh_movements_db.js: импорт книги учёта содержит ~10000+
// документов (накладные/инвентаризации), localStorage Chrome лимит ~10 МБ
// → не помещаются. IndexedDB лимит обычно 50+ МБ.

const DB_NAME = "pllato_wh_documents";
const DB_VERSION = 1;
const STORE = "documents";

let openPromise = null;

function openDb() {
  if (openPromise) return openPromise;
  openPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB не поддерживается в этом браузере"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "id" });
        os.createIndex("number", "number", { unique: false });
        os.createIndex("date", "date", { unique: false });
        os.createIndex("type", "type", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Не удалось открыть IndexedDB"));
  });
  return openPromise;
}

export async function putDocument(record) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Bulk-вставка батчами по 500. Документы тяжелее движений (есть items[]),
 * поэтому батч меньше.
 */
export async function putManyDocuments(items, onProgress) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const db = await openDb();
  const total = items.length;
  const BATCH = 500;
  let done = 0;
  for (let start = 0; start < total; start += BATCH) {
    const chunk = items.slice(start, start + BATCH);
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const os = tx.objectStore(STORE);
      for (const item of chunk) os.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    done += chunk.length;
    if (typeof onProgress === "function") onProgress(done, total);
    await new Promise((r) => setTimeout(r, 0));
  }
  return done;
}

export async function getDocumentById(id) {
  if (!id) return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getRecentDocuments(n = 50) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      all.sort((a, b) => {
        const ta = new Date(a.date || a.createdAt || 0).getTime() || 0;
        const tb = new Date(b.date || b.createdAt || 0).getTime() || 0;
        return tb - ta;
      });
      resolve(all.slice(0, n));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function countDocuments() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllDocuments() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
