// Share short-lived list reads between the floating widget and full chat UI.
// Memory only; Authorization + full URL isolate users, scopes and archives.
export function createTeamReadCache(fetchImpl, { origin, baseURL = origin, now = Date.now, maxEntries = 32 } = {}) {
  const entries = new Map();
  let generation = 0;
  const ttlByPath = new Map([
    ['/api/chat/channels', 30000],
    ['/api/wa/chats', 15000],
    ['/api/notifications/count', 60000],
  ]);
  const invalidate = () => { generation++; entries.clear(); };
  async function cachedFetch(input, init = {}) {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, baseURL);
    if (url.origin !== origin) return fetchImpl(input, init);
    const method = (init.method || input.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      // Delivery/typing receipts do not change list data; read receipts do.
      const affectsLists = !/\/(delivered|typing)$/.test(url.pathname);
      if (affectsLists) invalidate();
      try { return await fetchImpl(input, init); }
      finally { if (affectsLists) invalidate(); }
    }
    const ttl = ttlByPath.get(url.pathname);
    const headers = new Headers(init.headers || input.headers);
    const auth = headers.get('Authorization');
    // AbortSignal callers retain independent cancellation semantics.
    if (method !== 'GET' || !ttl || !auth || init.signal || input.signal ||
        init.cache === 'no-store' || init.cache === 'reload') return fetchImpl(input, init);
    const key = auth + '\n' + url.href;
    const found = entries.get(key);
    if (found && (found.pending || found.expires > now())) return (await found.promise).clone();
    if (entries.size >= maxEntries) entries.delete(entries.keys().next().value);
    const version = generation;
    const entry = { pending: true, expires: 0, promise: null };
    entry.promise = Promise.resolve().then(() => fetchImpl(input, init)).then(async response => {
      // Buffer these bounded JSON lists once so each caller gets its own body.
      // Never cache errors, opaque responses, redirects, or non-JSON content.
      if (!response.ok || response.redirected || !/application\/json/i.test(response.headers.get('Content-Type') || '')) {
        if (entries.get(key) === entry) entries.delete(key);
        return response;
      }
      const copy = new Response(await response.arrayBuffer(), { status: response.status, statusText: response.statusText, headers: response.headers });
      entry.pending = false;
      entry.expires = now() + ttl;
      if (version !== generation && entries.get(key) === entry) entries.delete(key);
      return copy;
    }).catch(error => {
      if (entries.get(key) === entry) entries.delete(key);
      throw error;
    });
    entries.set(key, entry);
    return (await entry.promise).clone();
  }
  return { fetch: cachedFetch, invalidate };
}
