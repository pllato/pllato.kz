// Pllato CRM — IndexedDB-хранилище для warehouse_movements.
// Зачем: импорт книги учёта содержит десятки тысяч строк (28k+ для ТОО),
// localStorage Chrome имеет лимит ~10 МБ → не помещается. IndexedDB лимит
// обычно 50+ МБ (Firefox/Chrome — до 60% дискового кэша).
//
// Контракт: все операции async, возвращают Promise.

const DB_NAME = "pllato_wh_movements";
const DB_VERSION = 1;
const STORE = "movements";

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
        // Индексы по часто используемым полям, чтобы быстро фильтровать.
        os.createIndex("productId", "productId", { unique: false });
        os.createIndex("lotId", "lotId", { unique: false });
        os.createIndex("docId", "docId", { unique: false });
        os.createIndex("date", "date", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Не удалось открыть IndexedDB"));
  });
  return openPromise;
}

/** Вставка/обновление одной записи. */
export async function putMovement(record) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Массовая вставка с прогрессом. Разбивает на батчи по 1000 записей.
 * @param {Array} items
 * @param {(done:number, total:number) => void} [onProgress]
 */
export async function putManyMovements(items, onProgress) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const db = await openDb();
  const total = items.length;
  const BATCH = 1000;
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
    // Даём UI вздохнуть между батчами.
    await new Promise((r) => setTimeout(r, 0));
  }
  return done;
}

/** Получить все движения (для маленьких наборов). */
export async function getAllMovements() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Движения по конкретному товару (через индекс productId).
 * @param {string} productId
 */
export async function getMovementsByProduct(productId) {
  if (!productId) return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).index("productId").getAll(productId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Последние N движений (по сортировке date desc, или по id если дат нет).
 * Загружает всё через cursor и сортирует — для совсем больших объёмов
 * лучше делать range-query.
 * @param {number} n
 */
export async function getRecentMovements(n = 50) {
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

/** Количество записей. */
export async function countMovements() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  });
}

/** Очистить все движения (для повторного импорта). */
export async function clearAllMovements() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
