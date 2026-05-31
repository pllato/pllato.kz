// Обёртка над OData v3 интерфейсом 1С (autoREST в БСП).
//
// Endpoint формата: ${host}${base_path}/odata/standard.odata/<Collection>?$format=json
// Аутентификация: HTTP Basic Auth (логин/пароль технического пользователя 1С).
// Имена коллекций — Catalog_<RusName>, Document_<RusName>, AccumulationRegister_<RusName>
// и т.д. Русские буквы в URL — UTF-8, fetch() сам кодирует через encodeURI.
//
// Ретраи:
//   — 5xx и сетевые ошибки → до 3 попыток с экспоненциальной задержкой
//   — 429 (rate limit) → уважаем Retry-After если есть, иначе экспонента
//   — 4xx кроме 429 → не ретраим (это наша ошибка)
//
// API:
//   const client = new ODataClient({ host, basePath, username, password, fetchImpl? });
//   await client.ping()
//   await client.get('Catalog_Контрагенты', { top: 3, select: ['Ref_Key','Description'] })
//   await client.getByKey('Catalog_Контрагенты', 'guid', { select: [...] })
//   await client.post('Catalog_Контрагенты', { Description: 'Foo', ... })
//   await client.patch('Catalog_Контрагенты', 'guid', { ... })

function basicAuthHeader(username, password) {
  // btoa требует Latin1; пароли REST-пользователя 1С обычно ASCII.
  // На всякий случай — кодируем строку как latin1.
  const s = `${username}:${password}`;
  let bin = "";
  for (let i = 0; i < s.length; i++) bin += String.fromCharCode(s.charCodeAt(i) & 0xff);
  return "Basic " + btoa(bin);
}

function buildQuery(params) {
  const usp = new URLSearchParams();
  // Включаем JSON-формат всегда — гораздо удобнее парсить, чем Atom XML.
  usp.set("$format", "json");
  if (params?.top != null) usp.set("$top", String(params.top));
  if (params?.skip != null) usp.set("$skip", String(params.skip));
  if (params?.select?.length) usp.set("$select", params.select.join(","));
  if (params?.filter) usp.set("$filter", params.filter);
  if (params?.orderby) usp.set("$orderby", params.orderby);
  if (params?.expand?.length) usp.set("$expand", params.expand.join(","));
  if (params?.inlinecount) usp.set("$inlinecount", "allpages");
  return "?" + usp.toString();
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export class ODataError extends Error {
  constructor(httpStatus, message, details = null) {
    super(message);
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export class ODataClient {
  constructor({ host, basePath, username, password, fetchImpl = fetch, timeoutMs = 30000, maxRetries = 3 }) {
    if (!host) throw new Error("ODataClient: host is required");
    if (!basePath) throw new Error("ODataClient: basePath is required");
    if (!username) throw new Error("ODataClient: username is required");
    if (password == null) throw new Error("ODataClient: password is required");
    this.host = String(host).replace(/\/+$/, "");
    this.basePath = String(basePath).replace(/\/+$/, "");
    if (!this.basePath.startsWith("/")) this.basePath = "/" + this.basePath;
    this.username = username;
    this.password = password;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
  }

  get baseUrl() {
    return `${this.host}${this.basePath}/odata/standard.odata`;
  }

  buildUrl(collection, params, key = null) {
    const safeCollection = encodeURI(collection);
    const suffix = key ? `(guid'${encodeURIComponent(key)}')` : "";
    return `${this.baseUrl}/${safeCollection}${suffix}${buildQuery(params)}`;
  }

  async _request(method, url, body) {
    let lastError = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const headers = {
          Authorization: basicAuthHeader(this.username, this.password),
          Accept: "application/json",
        };
        if (body != null) headers["Content-Type"] = "application/json";
        const resp = await this.fetchImpl(url, {
          method,
          headers,
          body: body != null ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(t);

        // 2xx — ок
        if (resp.status >= 200 && resp.status < 300) {
          if (resp.status === 204) return null;
          const text = await resp.text();
          if (!text) return null;
          try {
            return JSON.parse(text);
          } catch (e) {
            throw new ODataError(resp.status, "Invalid JSON in OData response", { raw: text.slice(0, 500) });
          }
        }

        // 401/403 — не ретраим, это креды
        if (resp.status === 401 || resp.status === 403) {
          const text = await resp.text().catch(() => "");
          throw new ODataError(resp.status, "OData auth failed", { body: text.slice(0, 500) });
        }

        // 4xx (кроме 429) — не ретраим, это наша ошибка в запросе
        if (resp.status >= 400 && resp.status < 500 && resp.status !== 429) {
          const text = await resp.text().catch(() => "");
          throw new ODataError(resp.status, `OData ${method} ${resp.status}`, { body: text.slice(0, 500) });
        }

        // 429 или 5xx — ретраим с задержкой
        if (attempt < this.maxRetries) {
          const retryAfter = parseInt(resp.headers.get("retry-after") || "0", 10);
          const backoffMs = retryAfter > 0 ? retryAfter * 1000 : 500 * Math.pow(2, attempt);
          await sleep(backoffMs);
          lastError = new ODataError(resp.status, `OData ${method} ${resp.status}, retry ${attempt + 1}/${this.maxRetries}`);
          continue;
        }

        const text = await resp.text().catch(() => "");
        throw new ODataError(resp.status, `OData ${method} ${resp.status} after ${this.maxRetries} retries`, { body: text.slice(0, 500) });
      } catch (e) {
        clearTimeout(t);
        if (e instanceof ODataError) throw e;
        // Сетевая ошибка / таймаут — ретраим
        if (attempt < this.maxRetries) {
          const backoffMs = 500 * Math.pow(2, attempt);
          await sleep(backoffMs);
          lastError = e;
          continue;
        }
        throw new ODataError(0, `Network error: ${e?.message || e}`);
      }
    }
    throw lastError || new ODataError(0, "Unknown OData error");
  }

  /** Проверка эндпоинта: GET / возвращает service document с массивом коллекций. */
  async ping() {
    const url = `${this.baseUrl}/?$format=json`;
    const data = await this._request("GET", url);
    const collections = Array.isArray(data?.value) ? data.value.length : 0;
    return { ok: true, collections_total: collections };
  }

  /** GET коллекция с параметрами OData. */
  async get(collection, params = {}) {
    const url = this.buildUrl(collection, params);
    const data = await this._request("GET", url);
    return data;
  }

  /** GET одна запись по Ref_Key (GUID). */
  async getByKey(collection, refKey, params = {}) {
    const url = this.buildUrl(collection, params, refKey);
    const data = await this._request("GET", url);
    return data;
  }

  /** POST новой записи. */
  async post(collection, payload) {
    const url = this.buildUrl(collection);
    const data = await this._request("POST", url, payload);
    return data;
  }

  /** PATCH (частичное обновление) записи по Ref_Key. */
  async patch(collection, refKey, payload) {
    const url = this.buildUrl(collection, {}, refKey);
    const data = await this._request("PATCH", url, payload);
    return data;
  }
}
