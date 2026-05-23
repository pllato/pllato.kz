#!/usr/bin/env python3
"""
apply_idb_cache.py — Phase 2.2 пак для team.html.

Вставляет IndexedDB-кеш fetch-интерсептор сразу после декларации
`const WORKER_RTDB_URL`. Кеширует ответы на коллекции
(/api/rtdb/users.json, /api/rtdb/contacts.json, ...) на 24 часа.
На PATCH/PUT — инвалидирует соответствующую коллекцию.

Минимально-инвазивно: ничего в существующем коде не меняем, просто
оборачиваем window.fetch. Все вызовы `fetch(${dbUrl}/...)` теперь
проходят через кеш-слой автоматически.

Запуск:
    cd ~/Desktop/Cloude/pllato.kz
    python3 elc-worker/docs/apply_idb_cache.py
"""

from __future__ import annotations

import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
TARGET = REPO / "team.html"

ANCHOR = (
    "const WORKER_RTDB_URL = 'https://pllato-elc-worker.uurraa.workers.dev/api/rtdb';"
)

# Маркер, по которому понимаем — уже применено или нет.
APPLIED_MARKER = "// === ELC IndexedDB RTDB cache ==="

IDB_MODULE = """
// === ELC IndexedDB RTDB cache ===
// Monkey-patch window.fetch для WORKER_RTDB_URL: коллекции (users.json, contacts.json,
// deals.json, tasks.json, groupChats.json, customFieldsSchema/*.json, pipelines/*.json)
// кешируются в IndexedDB на 24 часа. PATCH/PUT/DELETE инвалидируют соответствующую
// коллекцию. Цель — после первого захода (8 секунд на contacts) не дёргать worker
// при каждом переключении раздела.
(function installElcRtdbCache() {
  const IDB_NAME = 'elc-rtdb-cache';
  const IDB_STORE = 'responses';
  const IDB_VERSION = 1;
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  // Коллекции, которые имеет смысл кешировать (большие/часто запрашиваемые).
  // Одиночные записи и служебные (referenceLists, migrationState) не трогаем.
  const CACHEABLE_PATHS = new Set([
    'users.json',
    'contacts.json',
    'deals.json',
    'tasks.json',
    'companies.json',
    'groupChats.json',
    'openlinesSessions.json',
  ]);
  // Префиксы (для path вида customFieldsSchema/deal.json, pipelines/pipeline_3.json)
  const CACHEABLE_PREFIXES = ['customFieldsSchema/', 'pipelines/'];

  let dbPromise = null;
  function idbOpen() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function idbGet(key) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbSet(key, val) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbDelByPrefix(prefix) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const range = IDBKeyRange.bound(prefix, prefix + '\\uffff');
      const req = store.openKeyCursor(range);
      req.onsuccess = () => {
        const c = req.result;
        if (c) { store.delete(c.key); c.continue(); }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function idbClear() {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function parseRtdbPath(url) {
    try {
      const u = new URL(url);
      if (!url.startsWith(WORKER_RTDB_URL)) return null;
      const p = u.pathname.replace(/^\\/api\\/rtdb\\//, '');
      return { path: p, search: u.search };
    } catch { return null; }
  }

  function isCacheable(path) {
    if (CACHEABLE_PATHS.has(path)) return true;
    for (const pref of CACHEABLE_PREFIXES) {
      if (path.startsWith(pref)) return true;
    }
    return false;
  }

  function collectionRoot(path) {
    // 'deals/deal_100.json' → 'deals.json'
    // 'tasks.json' → 'tasks.json'
    // 'customFieldsSchema/deal.json' → 'customFieldsSchema/deal.json'
    const head = path.split('/')[0];
    return head + '.json';
  }

  function buildCacheKey(path) {
    // Без query (auth/_v) — стабильный ключ для одной коллекции
    return '/api/rtdb/' + path;
  }

  const _origFetch = window.fetch.bind(window);
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url);
    if (!url || !url.startsWith(WORKER_RTDB_URL)) {
      return _origFetch(input, init);
    }
    const method = ((init && init.method) || 'GET').toUpperCase();
    const parsed = parseRtdbPath(url);

    // PATCH/PUT/DELETE — инвалидируем кеш коллекции при успехе
    if (method === 'PATCH' || method === 'PUT' || method === 'DELETE') {
      const resp = await _origFetch(input, init);
      if (resp && resp.ok && parsed) {
        const rootKey = buildCacheKey(collectionRoot(parsed.path));
        idbDelByPrefix(rootKey).catch(e => console.warn('[idb] invalidate fail', e));
      }
      return resp;
    }

    if (method !== 'GET' || !parsed || !isCacheable(parsed.path)) {
      return _origFetch(input, init);
    }

    const cacheKey = buildCacheKey(parsed.path);

    // Попытка отдать из кеша
    try {
      const cached = await idbGet(cacheKey);
      if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
        const ageSec = Math.round((Date.now() - cached.fetchedAt) / 1000);
        console.log('[idb-cache] hit', parsed.path, ageSec + 's', cached.body.length + 'B');
        return new Response(cached.body, {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Elc-Cache': 'hit' },
        });
      }
    } catch (e) {
      console.warn('[idb-cache] read fail (network fallback)', e);
    }

    // Network + сохраняем в кеш.
    // ВАЖНО: читаем тело ОДИН раз и возвращаем фронту новый Response из строки.
    // Старый вариант с resp.clone().text() — tee'д ReadableStream — на больших
    // ответах (80MB contacts) даёт race/truncation, и `r.json()` падает в фронте
    // с "Expected ',' or '}' at position ...".
    const t0 = performance.now();
    const resp = await _origFetch(input, init);
    if (!resp || !resp.ok) return resp;
    let body;
    try {
      body = await resp.text();
    } catch (e) {
      console.warn('[idb-cache] body read fail', e);
      throw e; // resp уже частично consumed — нечего вернуть, пусть фронт увидит ошибку
    }
    idbSet(cacheKey, { body, fetchedAt: Date.now() })
      .catch(e => console.warn('[idb-cache] write fail', e));
    const ms = Math.round(performance.now() - t0);
    console.log('[idb-cache] stored', parsed.path, ms + 'ms', body.length + 'B');
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Elc-Cache': 'fresh' },
    });
  };

  // Экспонируем минимальный API для debug/ручной очистки
  window.elcRtdbCache = {
    clear: idbClear,
    purge: idbDelByPrefix,
    get: idbGet,
  };

  console.log('[elc-rtdb-cache] installed (IDB, 24h TTL)');
})();
// === /ELC IndexedDB RTDB cache ===
"""


def apply(text: str) -> tuple[str, bool]:
    if APPLIED_MARKER in text:
        return text, False
    if ANCHOR not in text:
        raise RuntimeError(f"anchor not found in {TARGET.name}: {ANCHOR!r}")
    return text.replace(ANCHOR, ANCHOR + IDB_MODULE, 1), True


def main() -> int:
    if not TARGET.exists():
        print(f"❌ {TARGET} not found", file=sys.stderr)
        return 1

    original = TARGET.read_text(encoding="utf-8")
    patched, changed = apply(original)

    if not changed:
        print("ℹ️  IDB-кеш уже установлен — изменений нет.")
        return 0

    TARGET.write_text(patched, encoding="utf-8")
    delta = len(patched) - len(original)
    print(f"✅ Inserted ELC IDB cache module into {TARGET.name} (+{delta} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
