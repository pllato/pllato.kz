import { connect } from "cloudflare:sockets";

const ROOT_SUPER_ADMIN = "uurraa@gmail.com";
const APP_ID = "pllato_crm";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const JWT_ISSUER = "pllato-crm";
const JWT_TTL_SECONDS = 7 * 24 * 60 * 60;
const TEAM_ID = "pllato";
const STORE_COLLECTION_RE = /^[a-z0-9_]{1,64}$/;
const DEFAULT_STORE_PULL_LIMIT = 5000;
const MAX_STORE_OPS = 500;
const BUILD_ID = "2026-05-21-auth-server-side";

let googleKeysCache = {
  keys: null,
  expiresAt: 0,
};

let d1SchemaReady = false;

class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function normalizeOrigin(origin) {
  return String(origin || "").trim().toLowerCase();
}

function isAllowedOrigin(origin, env) {
  const o = normalizeOrigin(origin);
  if (!o) return false;
  if (o === "https://pllato.kz") return true;
  if (o === "https://www.pllato.kz") return true;
  if (o === "http://localhost:8080") return true;
  if (o === "http://127.0.0.1:8080") return true;
  if (o === "http://localhost:8787") return true;
  if (o === "http://127.0.0.1:8787") return true;

  const extra = String(env.CORS_ORIGINS || "")
    .split(",")
    .map((x) => normalizeOrigin(x))
    .filter(Boolean);
  return extra.includes(o);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = isAllowedOrigin(origin, env) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(request, env, data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request, env),
      ...extraHeaders,
    },
  });
}

function fail(request, env, status, error, details = null) {
  const body = { ok: false, error };
  if (details !== null && details !== undefined) body.details = details;
  return json(request, env, body, status);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseMaxAge(cacheControl) {
  const m = String(cacheControl || "").match(/max-age=(\d+)/i);
  return m ? Number(m[1]) : 3600;
}

function toBase64(bytes) {
  let binary = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i += 1) binary += String.fromCharCode(arr[i]);
  return btoa(binary);
}

function encodeBase64Utf8(text) {
  return toBase64(new TextEncoder().encode(String(text || "")));
}

function decodeBase64UrlText(b64url) {
  const base64 = String(b64url).replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function decodeBase64UrlBytes(b64url) {
  const raw = decodeBase64UrlText(b64url);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function parseJwt(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new HttpError(401, "Некорректный JWT");
  let header;
  let payload;
  try {
    header = JSON.parse(decodeBase64UrlText(parts[0]));
    payload = JSON.parse(decodeBase64UrlText(parts[1]));
  } catch (e) {
    throw new HttpError(401, "Не удалось прочитать JWT");
  }
  return {
    parts,
    header,
    payload,
    signedPart: `${parts[0]}.${parts[1]}`,
    signature: decodeBase64UrlBytes(parts[2]),
  };
}

function toBase64Url(input) {
  return toBase64(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function getGooglePublicKeys() {
  const now = Date.now();
  if (googleKeysCache.keys && now < googleKeysCache.expiresAt) return googleKeysCache.keys;

  const res = await fetch(GOOGLE_JWKS_URL, { cf: { cacheEverything: true, cacheTtl: 3600 } });
  if (!res.ok) throw new HttpError(502, "Не удалось получить Google public keys");
  const jwks = await res.json();
  if (!Array.isArray(jwks?.keys)) throw new HttpError(502, "Некорректный ответ Google public keys");

  const keys = {};
  for (const key of jwks.keys) {
    if (key?.kid) keys[key.kid] = key;
  }

  const maxAge = parseMaxAge(res.headers.get("Cache-Control"));
  googleKeysCache = {
    keys,
    expiresAt: Date.now() + maxAge * 1000,
  };
  return keys;
}

async function verifyGoogleIdToken(idToken, env) {
  const clientId = String(env.GOOGLE_CLIENT_ID || "").trim();
  if (!clientId) throw new HttpError(500, "Не задан GOOGLE_CLIENT_ID");

  const parsed = parseJwt(idToken);
  const { header, payload, signedPart, signature } = parsed;

  if (header.alg !== "RS256") throw new HttpError(401, "Неверный алгоритм Google token");
  if (!header.kid) throw new HttpError(401, "Google token без kid");

  const googleKeys = await getGooglePublicKeys();
  const jwk = googleKeys[header.kid];
  if (!jwk) throw new HttpError(401, "Неизвестный kid в Google token");

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const ok = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    signature,
    new TextEncoder().encode(signedPart),
  );
  if (!ok) throw new HttpError(401, "Подпись Google token не прошла проверку");

  const now = Math.floor(Date.now() / 1000);
  const iss = String(payload.iss || "");
  if (typeof payload.exp !== "number" || payload.exp <= now) {
    throw new HttpError(401, "Google token истек");
  }
  if (typeof payload.iat !== "number" || payload.iat > now + 60) {
    throw new HttpError(401, "Некорректный iat в Google token");
  }
  if (payload.aud !== clientId) {
    throw new HttpError(401, "Google token не для этого client_id");
  }
  if (iss !== "accounts.google.com" && iss !== "https://accounts.google.com") {
    throw new HttpError(401, "Некорректный issuer Google token");
  }
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new HttpError(401, "Некорректный sub в Google token");
  }

  const email = String(payload.email || "").toLowerCase().trim();
  if (!email) throw new HttpError(401, "Google token без email");
  if (payload.email_verified !== true) {
    throw new HttpError(401, "Google token: email не подтвержден");
  }

  return {
    sub: payload.sub,
    email,
    name: String(payload.name || payload.given_name || email.split("@")[0] || "Сотрудник"),
    claims: payload,
  };
}

async function importJwtSecret(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(secret || "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signPllatoJwt(claims, secret) {
  const key = await importJwtSecret(secret);
  const headerPart = toBase64Url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payloadPart = toBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
  const input = `${headerPart}.${payloadPart}`;
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return `${input}.${toBase64Url(new Uint8Array(signature))}`;
}

async function verifyPllatoJwt(token, secret) {
  const parsed = parseJwt(token);
  const { header, payload, signedPart, signature } = parsed;
  if (header.alg !== "HS256") throw new HttpError(401, "Неверный алгоритм сессии");

  const key = await importJwtSecret(secret);
  const ok = await crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(signedPart));
  if (!ok) throw new HttpError(401, "Подпись сессии не прошла проверку");

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) {
    throw new HttpError(401, "Сессия истекла");
  }
  if (typeof payload.iat !== "number" || payload.iat > now + 60) {
    throw new HttpError(401, "Некорректный iat в сессии");
  }
  if (payload.iss !== JWT_ISSUER) {
    throw new HttpError(401, "Некорректный issuer сессии");
  }
  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new HttpError(401, "Некорректный sub в сессии");
  }
  return payload;
}

async function loadActorContext(request, env, { strictTeamCheck = false } = {}) {
  const authHeader = request.headers.get("Authorization") || "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new HttpError(401, "Требуется Authorization: Bearer <JWT>");

  const secret = String(env.JWT_SECRET || "").trim();
  if (!secret) throw new HttpError(500, "Не задан JWT_SECRET");

  const token = m[1].trim();
  const claims = await verifyPllatoJwt(token, secret);
  const email = String(claims.email || "").toLowerCase().trim();
  const user = email ? await d1GetUserByEmail(env, email) : null;
  if (!user) {
    if (strictTeamCheck) throw new HttpError(403, "Пользователь не найден в users");
    return {
      token,
      uid: String(claims.sub || ""),
      email,
      claims,
      user: null,
      isAdmin: Boolean(claims.isAdmin || claims.isSuperAdmin),
      isRoot: email === ROOT_SUPER_ADMIN,
    };
  }

  const isAdmin = Boolean(user.isAdmin || user.isSuperAdmin);
  const deniedByApp = Boolean(user.apps && user.apps[APP_ID] === false);
  if (!isAdmin && deniedByApp) {
    throw new HttpError(403, "Нет доступа к Pllato CRM");
  }

  return {
    token,
    uid: user.id,
    email: user.email,
    claims,
    user,
    isAdmin,
    isRoot: Boolean(user.isSuperAdmin || user.email === ROOT_SUPER_ADMIN),
  };
}

async function loadChannel(env, channelId) {
  const id = String(channelId || "").trim();
  if (!id) throw new HttpError(400, "Не передан channelId");

  const d1Channel = await d1LoadChannel(env, id);
  if (d1Channel) return d1Channel;
  throw new HttpError(404, `Канал ${id} не найден`);
}

function assertChannelType(channel, expectedType) {
  if (!channel?.data) throw new HttpError(404, "Канал не найден");
  if (channel.data.type !== expectedType) {
    throw new HttpError(400, `Канал ${channel.id} не типа ${expectedType}`);
  }
  if (channel.data.active === false) {
    throw new HttpError(400, `Канал ${channel.id} выключен`);
  }
  if (channel.data.apps && channel.data.apps[APP_ID] === false) {
    throw new HttpError(400, `Канал ${channel.id} не привязан к ${APP_ID}`);
  }
}

function nowIso() {
  return new Date().toISOString();
}

async function logEvent(env, bucket, payload) {
  try {
    await d1InsertIntegrationLog(env, bucket, payload);
  } catch (e) {
    console.warn(`logEvent(${bucket}) failed:`, e?.message || e);
  }
}

async function readRequestBodyAsJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Ожидался JSON body");
  }
}

async function readRequestBodyAuto(request) {
  const contentType = String(request.headers.get("Content-Type") || "").toLowerCase();
  const raw = await request.text();
  let parsed = null;
  if (contentType.includes("application/json")) {
    try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = null; }
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(raw);
    parsed = {};
    for (const [k, v] of params.entries()) {
      const key = String(k || "");
      if (!key) continue;
      if (key.includes("[")) {
        const parts = key.replace(/\]/g, "").split("[").filter(Boolean);
        let cursor = parsed;
        for (let i = 0; i < parts.length; i += 1) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          if (isLast) {
            cursor[part] = v;
          } else {
            if (!isObject(cursor[part])) cursor[part] = {};
            cursor = cursor[part];
          }
        }
      } else {
        parsed[key] = v;
      }
    }
  }
  return { raw, parsed, contentType };
}

function requireStoreDb(env) {
  const db = env.DB || env.pllato_crm_store;
  if (!db) throw new HttpError(500, "Не настроен D1 binding `DB`");
  return db;
}

async function ensureD1Schema(env) {
  if (d1SchemaReady) return;
  const db = requireStoreDb(env);
  // В cloud D1 многострочный db.exec() иногда дает "incomplete input".
  // Выполняем схему по одному statement для стабильности.
  const schemaStatements = [
    `
      CREATE TABLE IF NOT EXISTS store (
        team_id     TEXT NOT NULL DEFAULT 'pllato',
        collection  TEXT NOT NULL,
        id          TEXT NOT NULL,
        data        TEXT NOT NULL,
        created_at  INTEGER NOT NULL,
        updated_at  INTEGER NOT NULL,
        PRIMARY KEY (team_id, collection, id)
      )
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_store_lookup
        ON store (team_id, collection, updated_at DESC)
    `,
    `
      CREATE TABLE IF NOT EXISTS integration_channels (
        id                  TEXT PRIMARY KEY,
        type                TEXT NOT NULL,
        name                TEXT NOT NULL,
        active              INTEGER NOT NULL DEFAULT 1,
        apps_json           TEXT NOT NULL DEFAULT '{}',
        config_public_json  TEXT NOT NULL DEFAULT '{}',
        config_secret_json  TEXT NOT NULL DEFAULT '{}',
        created_at          INTEGER NOT NULL,
        updated_at          INTEGER NOT NULL,
        created_by          TEXT,
        updated_by          TEXT
      )
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_integration_channels_type_active
        ON integration_channels (type, active)
    `,
    `
      CREATE TABLE IF NOT EXISTS integration_logs (
        id           TEXT PRIMARY KEY,
        bucket       TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at   INTEGER NOT NULL
      )
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_integration_logs_bucket_created
        ON integration_logs (bucket, created_at DESC)
    `,
    `
      CREATE TABLE IF NOT EXISTS call_outcomes (
        code         TEXT PRIMARY KEY,
        label        TEXT NOT NULL,
        funnel_stage TEXT NOT NULL,
        order_index  INTEGER NOT NULL DEFAULT 0,
        is_active    INTEGER NOT NULL DEFAULT 1
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS users (
        id              TEXT PRIMARY KEY,
        email           TEXT UNIQUE NOT NULL,
        name            TEXT,
        last_name       TEXT,
        position        TEXT,
        role            TEXT,
        is_admin        INTEGER NOT NULL DEFAULT 0,
        is_super_admin  INTEGER NOT NULL DEFAULT 0,
        apps            TEXT NOT NULL DEFAULT '{}',
        created_at      INTEGER NOT NULL,
        updated_at      INTEGER NOT NULL,
        created_by      TEXT
      )
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    `CREATE TABLE IF NOT EXISTS crm_passwords (
      email           TEXT PRIMARY KEY,
      password_hash   TEXT NOT NULL,
      password_salt   TEXT NOT NULL,
      iterations      INTEGER NOT NULL DEFAULT 100000,
      force_change    INTEGER NOT NULL DEFAULT 1,
      updated_at      INTEGER NOT NULL,
      updated_by      TEXT
    )
    `,
    `
      CREATE TABLE IF NOT EXISTS channels (
        id          TEXT PRIMARY KEY,
        type        TEXT NOT NULL,
        name        TEXT NOT NULL,
        config      TEXT NOT NULL DEFAULT '{}',
        apps        TEXT NOT NULL DEFAULT '{}',
        active      INTEGER NOT NULL DEFAULT 1,
        created_at  INTEGER NOT NULL,
        updated_at  INTEGER NOT NULL,
        created_by  TEXT,
        updated_by  TEXT
      )
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_channels_type ON channels(type)
    `,
    `
      CREATE TABLE IF NOT EXISTS channel_secrets (
        channel_id  TEXT PRIMARY KEY,
        secrets     TEXT NOT NULL DEFAULT '{}',
        updated_at  INTEGER NOT NULL,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS customer_sources (
        id          TEXT PRIMARY KEY,
        slug        TEXT UNIQUE,
        name        TEXT NOT NULL,
        description TEXT,
        created_at  INTEGER,
        updated_at  INTEGER
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS customers (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        phone         TEXT,
        phone_digits  TEXT,
        business_type TEXT,
        notes         TEXT,
        source_id     TEXT REFERENCES customer_sources(id),
        created_at    INTEGER,
        updated_at    INTEGER
      )
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_customers_phone_digits
        ON customers(phone_digits)
    `,
    `
      INSERT OR IGNORE INTO call_outcomes (code, label, funnel_stage, order_index, is_active) VALUES
      ('meeting_booked', 'Встреча назначена', 'meeting_booked', 10, 1),
      ('callback', 'Перезвон', 'dialed', 20, 1),
      ('rejected', 'Отказ', 'dialed', 30, 1),
      ('no_answer', 'Не ответил', 'dialed', 40, 1),
      ('wrong_number', 'Неверный номер', 'dialed', 50, 1),
      ('qualified_pending', 'Квалифицирован, ждёт решение', 'qualified', 60, 1),
      ('closed', 'Сделка закрыта', 'closed', 70, 1)
    `,
    `
      CREATE TABLE IF NOT EXISTS call_scripts (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        description TEXT,
        created_by  TEXT,
        created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        is_active   INTEGER NOT NULL DEFAULT 1
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS call_script_stages (
        id                TEXT PRIMARY KEY,
        script_id         TEXT NOT NULL REFERENCES call_scripts(id) ON DELETE CASCADE,
        order_index       INTEGER NOT NULL,
        code              TEXT NOT NULL,
        name              TEXT NOT NULL,
        goal              TEXT,
        script_text       TEXT NOT NULL,
        tip               TEXT,
        whatsapp_template TEXT,
        is_terminal       INTEGER NOT NULL DEFAULT 0,
        UNIQUE(script_id, order_index),
        UNIQUE(script_id, code)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS call_script_transitions (
        id             TEXT PRIMARY KEY,
        stage_id       TEXT NOT NULL REFERENCES call_script_stages(id) ON DELETE CASCADE,
        trigger_label  TEXT NOT NULL,
        next_stage_code TEXT,
        outcome        TEXT,
        order_index    INTEGER NOT NULL
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS call_script_objections (
        id          TEXT PRIMARY KEY,
        stage_id    TEXT NOT NULL REFERENCES call_script_stages(id) ON DELETE CASCADE,
        question    TEXT NOT NULL,
        answer      TEXT NOT NULL,
        order_index INTEGER NOT NULL
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS call_campaigns (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        script_id  TEXT NOT NULL REFERENCES call_scripts(id),
        source_id  TEXT,
        created_by TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        status     TEXT NOT NULL DEFAULT 'active'
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS call_logs (
        id               TEXT PRIMARY KEY,
        campaign_id      TEXT NOT NULL REFERENCES call_campaigns(id),
        customer_id      TEXT NOT NULL REFERENCES customers(id),
        caller_id        TEXT NOT NULL REFERENCES users(id),
        started_at       INTEGER NOT NULL,
        ended_at         INTEGER,
        final_stage_code TEXT,
        outcome          TEXT,
        meeting_at       INTEGER,
        notes            TEXT,
        duration_seconds INTEGER
      )
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_call_logs_campaign ON call_logs(campaign_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_call_logs_customer ON call_logs(customer_id)
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_call_logs_caller ON call_logs(caller_id)
    `,
    `
      CREATE TABLE IF NOT EXISTS call_assignments (
        id          TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL REFERENCES call_campaigns(id),
        customer_id TEXT NOT NULL REFERENCES customers(id),
        caller_id   TEXT NOT NULL REFERENCES users(id),
        status      TEXT NOT NULL DEFAULT 'pending',
        UNIQUE(campaign_id, customer_id)
      )
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_call_assignments_campaign_caller_status
        ON call_assignments(campaign_id, caller_id, status)
    `,
  ];

  for (const statement of schemaStatements) {
    await db.prepare(statement).run();
  }

  const safeAlter = async (sql) => {
    try { await db.prepare(sql).run(); } catch {}
  };
  await safeAlter("ALTER TABLE users ADD COLUMN last_name TEXT");
  await safeAlter("ALTER TABLE users ADD COLUMN position TEXT");
  await safeAlter("ALTER TABLE users ADD COLUMN role TEXT");
  await safeAlter("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0");
  await safeAlter("ALTER TABLE users ADD COLUMN is_super_admin INTEGER NOT NULL DEFAULT 0");
  await safeAlter("ALTER TABLE users ADD COLUMN apps TEXT NOT NULL DEFAULT '{}'");
  await safeAlter("ALTER TABLE users ADD COLUMN created_by TEXT");

  d1SchemaReady = true;
}

function safeParseJson(raw, fallback = null) {
  try { return JSON.parse(raw); }
  catch { return fallback; }
}

function normalizeCollectionName(name) {
  const out = String(name || "").trim().toLowerCase();
  if (!STORE_COLLECTION_RE.test(out)) throw new HttpError(400, `Некорректное имя коллекции: ${name}`);
  return out;
}

function normalizeCollectionList(input) {
  if (!Array.isArray(input)) return [];
  const uniq = new Set();
  for (const raw of input) {
    const value = String(raw || "").trim().toLowerCase();
    if (!value || !STORE_COLLECTION_RE.test(value)) continue;
    uniq.add(value);
  }
  return [...uniq];
}

function normalizeStoreItem(collection, value) {
  const item = isObject(value) ? { ...value } : null;
  if (!item) throw new HttpError(400, `Некорректный item для ${collection}`);
  if (!item.id) throw new HttpError(400, `У item в ${collection} отсутствует id`);
  const now = Date.now();
  const createdAt = Number(item.createdAt) || now;
  const updatedAt = Number(item.updatedAt) || now;
  return {
    ...item,
    id: String(item.id),
    createdAt,
    updatedAt,
  };
}

async function d1ListCollection(env, collection, limit = DEFAULT_STORE_PULL_LIMIT) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const cappedLimit = Math.max(1, Math.min(Number(limit) || DEFAULT_STORE_PULL_LIMIT, 10000));
  const res = await db
    .prepare(`
      SELECT data
      FROM store
      WHERE team_id = ? AND collection = ?
      ORDER BY updated_at DESC
      LIMIT ?
    `)
    .bind(TEAM_ID, collection, cappedLimit)
    .run();
  return (res.results || [])
    .map((row) => safeParseJson(row.data, null))
    .filter(Boolean);
}

async function d1UpsertDoc(env, collection, item, actorEmail = null) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const normalized = normalizeStoreItem(collection, item);
  await db
    .prepare(`
      INSERT INTO store (team_id, collection, id, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(team_id, collection, id) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at,
        created_at = MIN(store.created_at, excluded.created_at)
      WHERE excluded.updated_at >= store.updated_at
    `)
    .bind(
      TEAM_ID,
      collection,
      normalized.id,
      JSON.stringify(normalized),
      normalized.createdAt,
      normalized.updatedAt,
    )
    .run();
}

async function d1DeleteDoc(env, collection, id) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  await db
    .prepare("DELETE FROM store WHERE team_id = ? AND collection = ? AND id = ?")
    .bind(TEAM_ID, collection, String(id))
    .run();
}

async function d1GetDoc(env, collection, id) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const row = await db
    .prepare(`
      SELECT data
      FROM store
      WHERE team_id = ? AND collection = ? AND id = ?
      LIMIT 1
    `)
    .bind(TEAM_ID, collection, String(id))
    .first();
  if (!row?.data) return null;
  return safeParseJson(row.data, null);
}

async function handleStorePull(request, env, actor) {
  const body = await readRequestBodyAsJson(request);
  const collections = normalizeCollectionList(body.collections || []);
  const limit = Number(body.limitPerCollection) || DEFAULT_STORE_PULL_LIMIT;
  if (collections.length === 0) {
    throw new HttpError(400, "Передай массив collections для pull");
  }

  const data = {};
  for (const collection of collections) {
    data[collection] = await d1ListCollection(env, collection, limit);
  }

  return {
    ok: true,
    collections: data,
    pulledAt: Date.now(),
    actor: actor.email || actor.uid,
  };
}

async function handleStorePush(request, env, actor) {
  const body = await readRequestBodyAsJson(request);
  const ops = Array.isArray(body.ops) ? body.ops : [];
  if (ops.length === 0) return { ok: true, applied: 0 };
  if (ops.length > MAX_STORE_OPS) {
    throw new HttpError(400, `Слишком много операций за раз (max ${MAX_STORE_OPS})`);
  }

  let applied = 0;
  for (const op of ops) {
    if (!isObject(op)) continue;
    const collection = normalizeCollectionName(op.collection);
    const type = String(op.type || "").toLowerCase();
    if (type === "upsert") {
      await d1UpsertDoc(env, collection, op.item, actor.email);
      applied += 1;
      continue;
    }
    if (type === "delete") {
      if (!op.id) throw new HttpError(400, `Для delete в ${collection} нужен id`);
      await d1DeleteDoc(env, collection, op.id);
      applied += 1;
      continue;
    }
    throw new HttpError(400, `Неизвестный тип операции: ${op.type}`);
  }

  return {
    ok: true,
    applied,
    pushedAt: Date.now(),
    actor: actor.email || actor.uid,
  };
}

function parseJsonObject(raw, fallback = {}) {
  if (!raw) return { ...fallback };
  try {
    const parsed = JSON.parse(raw);
    return isObject(parsed) ? parsed : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function d1RowToUser(row) {
  if (!row) return null;
  return {
    id: String(row.id || ""),
    email: String(row.email || "").toLowerCase().trim(),
    name: String(row.name || "").trim(),
    lastName: String(row.last_name || "").trim(),
    position: String(row.position || "").trim(),
    role: String(row.role || "").trim(),
    isAdmin: Number(row.is_admin) === 1,
    isSuperAdmin: Number(row.is_super_admin) === 1,
    apps: parseJsonObject(row.apps, {}),
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
    createdBy: row.created_by || null,
  };
}

async function d1GetUserByEmail(env, email) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const normalizedEmail = String(email || "").toLowerCase().trim();
  if (!normalizedEmail) return null;
  const row = await db
    .prepare(`
      SELECT id, email, name, last_name, position, role, is_admin, is_super_admin, apps, created_at, updated_at, created_by
      FROM users
      WHERE email = ?
      LIMIT 1
    `)
    .bind(normalizedEmail)
    .first();
  return d1RowToUser(row);
}

async function d1GetUserById(env, id) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const row = await db
    .prepare(`
      SELECT id, email, name, last_name, position, role, is_admin, is_super_admin, apps, created_at, updated_at, created_by
      FROM users
      WHERE id = ?
      LIMIT 1
    `)
    .bind(String(id || ""))
    .first();
  return d1RowToUser(row);
}

async function d1ListUsers(env) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const res = await db
    .prepare(`
      SELECT id, email, name, last_name, position, role, is_admin, is_super_admin, apps, created_at, updated_at, created_by
      FROM users
      ORDER BY updated_at DESC
    `)
    .run();
  return (res.results || []).map(d1RowToUser).filter(Boolean);
}

async function d1UpsertUser(env, payload, actor) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const email = String(payload.email || "").toLowerCase().trim();
  if (!email) throw new HttpError(400, "Укажи email пользователя");

  const now = Date.now();
  const existingByEmail = await d1GetUserByEmail(env, email);
  const fallbackName = email.split("@")[0] || "Сотрудник";
  const id = String(payload.id || existingByEmail?.id || crypto.randomUUID()).trim();
  const isAdmin = payload.isAdmin === true || Number(payload.is_admin) === 1;
  const isSuperAdmin = payload.isSuperAdmin === true || Number(payload.is_super_admin) === 1;
  const apps = isObject(payload.apps)
    ? payload.apps
    : (existingByEmail?.apps || {});

  await db
    .prepare(`
      INSERT INTO users (
        id, email, name, last_name, position, role, is_admin, is_super_admin, apps, created_at, updated_at, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        id = COALESCE(excluded.id, users.id),
        name = excluded.name,
        last_name = excluded.last_name,
        position = excluded.position,
        role = excluded.role,
        is_admin = excluded.is_admin,
        is_super_admin = excluded.is_super_admin,
        apps = excluded.apps,
        updated_at = excluded.updated_at
    `)
    .bind(
      id,
      email,
      String(payload.name || existingByEmail?.name || fallbackName),
      String(payload.lastName || payload.last_name || existingByEmail?.lastName || ""),
      String(payload.position || existingByEmail?.position || ""),
      String(payload.role || existingByEmail?.role || ""),
      isAdmin ? 1 : 0,
      isSuperAdmin ? 1 : 0,
      JSON.stringify(apps || {}),
      Number(existingByEmail?.createdAt || now),
      now,
      actor?.email || actor?.uid || null,
    )
    .run();

  return d1GetUserByEmail(env, email);
}

async function d1DeleteUser(env, id) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  await db
    .prepare("DELETE FROM users WHERE id = ?")
    .bind(String(id || ""))
    .run();
}

function canManageUsers(actor) {
  return Boolean(actor?.isAdmin || actor?.isRoot);
}

function canDeleteUsers(actor) {
  return Boolean(actor?.isRoot || actor?.user?.isSuperAdmin);
}

async function d1InsertIntegrationLog(env, bucket, payload) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  await db
    .prepare(`
      INSERT INTO integration_logs (id, bucket, payload_json, created_at)
      VALUES (?, ?, ?, ?)
    `)
    .bind(
      crypto.randomUUID(),
      String(bucket || "misc"),
      JSON.stringify(payload || {}),
      Date.now(),
    )
    .run();
}

async function d1ListIntegrationLogs(env, buckets, limit = 100) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const normalizedBuckets = (Array.isArray(buckets) ? buckets : [])
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  if (normalizedBuckets.length === 0) return [];

  const cappedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  const placeholders = normalizedBuckets.map(() => "?").join(", ");
  const sql = `
    SELECT id, bucket, payload_json, created_at
    FROM integration_logs
    WHERE bucket IN (${placeholders})
    ORDER BY created_at DESC
    LIMIT ?
  `;
  const res = await db
    .prepare(sql)
    .bind(...normalizedBuckets, cappedLimit)
    .run();
  return res.results || [];
}

function d1RowToChannelPayload(row, { includeSecrets = false } = {}) {
  const apps = parseJsonObject(row.apps, {});
  const config = parseJsonObject(row.config, {});
  const configSecret = parseJsonObject(row.secrets, {});

  const out = {
    id: row.id,
    type: row.type,
    name: row.name,
    active: Number(row.active) !== 0,
    apps,
    config,
    public: config,
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
  };
  if (includeSecrets) out.secrets = configSecret;
  return out;
}

async function d1LoadChannel(env, channelId) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const row = await db
    .prepare(`
      SELECT c.id, c.type, c.name, c.active, c.apps, c.config, c.created_at, c.updated_at,
             cs.secrets
      FROM channels c
      LEFT JOIN channel_secrets cs ON cs.channel_id = c.id
      WHERE c.id = ?
      LIMIT 1
    `)
    .bind(String(channelId))
    .first();
  if (!row) return null;

  const payload = d1RowToChannelPayload(row, { includeSecrets: true });
  return {
    id: payload.id,
    data: {
      type: payload.type,
      name: payload.name,
      active: payload.active,
      apps: payload.apps,
      config: payload.config,
    },
    secret: payload.secrets || {},
  };
}

async function d1ListChannels(env) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const res = await db
    .prepare(`
      SELECT c.id, c.type, c.name, c.active, c.apps, c.config, c.created_at, c.updated_at,
             cs.secrets
      FROM channels c
      LEFT JOIN channel_secrets cs ON cs.channel_id = c.id
      ORDER BY c.updated_at DESC
    `)
    .run();
  return res.results || [];
}

function waChatDocId(instanceId, waChatId) {
  return `wa:${normalizeWaInstanceId(instanceId)}:${String(waChatId || "").trim()}`;
}

function waMessageDocId(instanceId, idMessage) {
  const msgId = String(idMessage || "").trim() || crypto.randomUUID();
  return `wa:${normalizeWaInstanceId(instanceId)}:${msgId}`;
}

function waReadableName(senderData, waChatId) {
  const fromPayload = pickFirstString(senderData || {}, ["chatName", "senderName", "senderContactName"]);
  if (fromPayload) return fromPayload;
  const chat = String(waChatId || "");
  if (chat.endsWith("@g.us")) return `Группа ${chat.replace("@g.us", "")}`;
  if (chat.endsWith("@c.us")) return `+${chat.replace("@c.us", "")}`;
  return chat || "WhatsApp чат";
}

function extractWaMessageText(messageData) {
  if (!isObject(messageData)) return "";
  const typeMessage = String(messageData.typeMessage || "").trim();
  if (typeMessage === "textMessage") {
    return pickFirstString(messageData.textMessageData || {}, ["textMessage"]) ||
      pickFirstString(messageData, ["textMessage"]);
  }
  if (typeMessage === "extendedTextMessage") {
    return pickFirstString(messageData.extendedTextMessageData || {}, ["text", "description"]) ||
      pickFirstString(messageData, ["text", "description"]);
  }
  return "";
}

function extractWaFileInfo(messageData) {
  if (!isObject(messageData)) return null;
  const typeMessage = String(messageData.typeMessage || "").trim();
  const f = isObject(messageData.fileMessageData) ? messageData.fileMessageData : null;
  if (!f) return null;
  const url = safeUrl(pickFirstString(f, ["downloadUrl", "urlFile", "url"]));
  const fileName = pickFirstString(f, ["fileName"]) || guessFileName(url, "file.bin");
  const mimeType = pickFirstString(f, ["mimeType"]);
  const caption = pickFirstString(f, ["caption"]);
  const mediaKind = inferMediaKind(typeMessage, mimeType, fileName);
  return {
    mediaKind,
    url,
    fileName,
    mimeType,
    caption,
    raw: f,
  };
}

function extractWaWebhookEnvelope(payload) {
  if (!isObject(payload)) return null;
  const typeWebhook = String(payload.typeWebhook || "").trim();
  if (!typeWebhook) return null;

  const senderData = isObject(payload.senderData) ? payload.senderData : {};
  const messageData = isObject(payload.messageData) ? payload.messageData : {};
  const chatId = pickFirstString(senderData, ["chatId"]) || pickFirstString(payload, ["chatId"]);
  if (!chatId) return null;

  const instanceId = normalizeWaInstanceId(payload?.instanceData?.idInstance);
  if (!instanceId) return null;

  const idMessage = pickFirstString(payload, ["idMessage"]) ||
    pickFirstString(messageData.quotedMessage || {}, ["stanzaId"]);

  const fileInfo = extractWaFileInfo(messageData);
  const text = extractWaMessageText(messageData) || fileInfo?.caption || "";
  const mediaNote = !text && fileInfo
    ? (fileInfo.mediaKind === "audio" ? "[Аудио]" :
      fileInfo.mediaKind === "video" ? "[Видео]" :
      fileInfo.mediaKind === "image" ? "[Изображение]" : "[Файл]")
    : "";
  const messageText = text || mediaNote || "[Сообщение]";

  const from = (
    typeWebhook === "outgoingMessageReceived" ||
    typeWebhook === "outgoingAPIMessageReceived"
  ) ? "me" : "them";

  return {
    instanceId,
    typeWebhook,
    typeMessage: String(messageData.typeMessage || "").trim(),
    idMessage,
    chatId,
    isGroup: chatId.endsWith("@g.us"),
    chatName: waReadableName(senderData, chatId),
    senderData,
    text: messageText,
    fileInfo,
    ts: toMsTimestamp(payload.timestamp),
    raw: payload,
    from,
  };
}

async function findGreenApiChannelByInstance(env, instanceId) {
  const rows = await d1ListChannels(env);
  const idInst = normalizeWaInstanceId(instanceId);
  for (const row of rows) {
    if (row.type !== "greenapi_wa" || Number(row.active) === 0) continue;
    const configPublic = parseJsonObject(row.config, {});
    const cid = normalizeWaInstanceId(configPublic.id_instance);
    if (cid && cid === idInst) {
      return {
        id: row.id,
        data: {
          type: row.type,
          name: row.name,
          active: Number(row.active) !== 0,
          apps: parseJsonObject(row.apps, {}),
          config: configPublic,
        },
        secret: parseJsonObject(row.secrets, {}),
      };
    }
  }
  return null;
}

async function upsertWaConversationEvent(env, actorLabel, event) {
  const chatDocId = waChatDocId(event.instanceId, event.chatId);
  const existingChat = await d1GetDoc(env, "chats", chatDocId);
  const now = Date.now();
  const lastPreview = event.fileInfo
    ? (event.fileInfo.caption || event.text || `[${event.fileInfo.mediaKind}]`)
    : event.text;
  const chatDoc = {
    id: chatDocId,
    wa: true,
    channelType: "greenapi_wa",
    waInstanceId: event.instanceId,
    waChatId: event.chatId,
    isGroup: event.isGroup,
    name: event.chatName,
    role: event.isGroup ? "Group" : "WhatsApp",
    preview: lastPreview || "",
    lastMessageAt: event.ts,
    createdAt: Number(existingChat?.createdAt) || now,
    updatedAt: event.ts || now,
  };
  await d1UpsertDoc(env, "chats", chatDoc, actorLabel);

  const msgDoc = {
    id: waMessageDocId(event.instanceId, event.idMessage),
    channelType: "greenapi_wa",
    wa: true,
    waInstanceId: event.instanceId,
    waChatId: event.chatId,
    waMessageId: String(event.idMessage || "").trim() || null,
    chatId: chatDocId,
    from: event.from,
    text: event.text || "",
    media: event.fileInfo ? {
      kind: event.fileInfo.mediaKind,
      url: event.fileInfo.url || "",
      fileName: event.fileInfo.fileName || "",
      mimeType: event.fileInfo.mimeType || "",
      caption: event.fileInfo.caption || "",
    } : null,
    ts: event.ts || now,
    createdAt: event.ts || now,
    updatedAt: event.ts || now,
  };
  await d1UpsertDoc(env, "chat_messages", msgDoc, actorLabel);
}

function canUseCrmApp(user) {
  if (!user) return false;
  if (user.isAdmin || user.isSuperAdmin) return true;
  return !(user.apps && user.apps[APP_ID] === false);
}

function publicUserPayload(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    lastName: user.lastName || "",
    position: user.position || "",
    role: user.role || "",
    isAdmin: Boolean(user.isAdmin),
    isSuperAdmin: Boolean(user.isSuperAdmin),
    apps: user.apps || {},
    createdAt: user.createdAt || 0,
    updatedAt: user.updatedAt || 0,
  };
}

async function issueSessionTokenForUser(env, user) {
  const secret = String(env.JWT_SECRET || "").trim();
  if (!secret) throw new HttpError(500, "Не задан JWT_SECRET");

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: JWT_ISSUER,
    sub: user.id,
    email: user.email,
    name: user.name || user.email.split("@")[0] || "Сотрудник",
    isAdmin: Boolean(user.isAdmin),
    isSuperAdmin: Boolean(user.isSuperAdmin),
    apps: user.apps || {},
    iat: now,
    exp: now + JWT_TTL_SECONDS,
  };
  const token = await signPllatoJwt(claims, secret);
  return { token, exp: claims.exp, claims };
}

// ============== CRM passwords (email/password auth) ==============

const CRM_PBKDF2_ITER = 100000;

function bytesToB64(bytes) {
  let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function b64ToBytes(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pbkdf2Hash(password, saltBytes, iterations = CRM_PBKDF2_ITER) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" },
    keyMaterial, 256
  );
  return bytesToB64(new Uint8Array(bits));
}

async function d1GetCrmPassword(env, email) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const normalizedEmail = String(email || "").toLowerCase().trim();
  if (!normalizedEmail) return null;
  const row = await db
    .prepare(`SELECT email, password_hash, password_salt, iterations, force_change, updated_at FROM crm_passwords WHERE email = ? LIMIT 1`)
    .bind(normalizedEmail)
    .first();
  if (!row) return null;
  return {
    email: row.email,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    iterations: Number(row.iterations) || CRM_PBKDF2_ITER,
    forceChange: Number(row.force_change) === 1,
    updatedAt: Number(row.updated_at) || 0,
  };
}

async function d1UpsertCrmPassword(env, email, passwordHash, passwordSalt, forceChange, actor) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const normalizedEmail = String(email || "").toLowerCase().trim();
  if (!normalizedEmail) throw new HttpError(400, "Email обязателен");
  const now = Date.now();
  await db
    .prepare(`
      INSERT INTO crm_passwords (email, password_hash, password_salt, iterations, force_change, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        password_hash = excluded.password_hash,
        password_salt = excluded.password_salt,
        iterations = excluded.iterations,
        force_change = excluded.force_change,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `)
    .bind(
      normalizedEmail,
      passwordHash,
      passwordSalt,
      CRM_PBKDF2_ITER,
      forceChange ? 1 : 0,
      now,
      actor?.email || actor?.uid || null,
    )
    .run();
}

async function d1HasAnyCrmPasswords(env) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const row = await db.prepare(`SELECT 1 FROM crm_passwords LIMIT 1`).first();
  return !!row;
}

// === Handler: email login (публичный) ===
async function handleAuthEmailLogin(request, env) {
  const body = await readRequestBodyAsJson(request);
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  if (!email || !password) throw new HttpError(400, "Email и пароль обязательны");

  const user = await d1GetUserByEmail(env, email);
  if (!user) throw new HttpError(403, "Пользователь не найден");
  if (!canUseCrmApp(user)) throw new HttpError(403, "Нет доступа к Pllato CRM");

  const pwRecord = await d1GetCrmPassword(env, email);
  if (!pwRecord) throw new HttpError(403, "Пароль не задан. Войди через Google или попроси администратора установить пароль.");

  const saltBytes = b64ToBytes(pwRecord.passwordSalt);
  const computed = await pbkdf2Hash(password, saltBytes, pwRecord.iterations);
  if (computed !== pwRecord.passwordHash) throw new HttpError(401, "Неверный пароль");

  const session = await issueSessionTokenForUser(env, user);
  return {
    ok: true,
    token: session.token,
    exp: session.exp,
    user: publicUserPayload(user),
    forcePasswordChange: pwRecord.forceChange,
  };
}

// === Handler: установка пароля (требует admin) ===
async function handleAuthSetPassword(request, env, actor) {
  if (!canManageUsers(actor)) throw new HttpError(403, "Только администратор может устанавливать пароли");

  const body = await readRequestBodyAsJson(request);
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  if (!email || !password) throw new HttpError(400, "Email и пароль обязательны");
  if (password.length < 6) throw new HttpError(400, "Минимум 6 символов");

  const user = await d1GetUserByEmail(env, email);
  if (!user) throw new HttpError(404, "Пользователь не найден");

  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2Hash(password, saltBytes);
  const salt = bytesToB64(saltBytes);
  await d1UpsertCrmPassword(env, email, hash, salt, /* forceChange */ true, actor);

  return { ok: true, email };
}

// === Handler: смена пароля (свой) ===
async function handleAuthChangePassword(request, env, actor) {
  const body = await readRequestBodyAsJson(request);
  const password = String(body.password || "");
  if (!password) throw new HttpError(400, "Пароль обязателен");
  if (password.length < 6) throw new HttpError(400, "Минимум 6 символов");

  const email = String(actor?.email || "").toLowerCase().trim();
  if (!email) throw new HttpError(401, "Email из токена не определён");

  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2Hash(password, saltBytes);
  const salt = bytesToB64(saltBytes);
  await d1UpsertCrmPassword(env, email, hash, salt, /* forceChange */ false, actor);

  return { ok: true, email };
}

// === Handler: проверка есть ли вообще пароли (публичный) ===
async function handleAuthHasAnyPasswords(request, env) {
  const hasAny = await d1HasAnyCrmPasswords(env);
  return { ok: true, hasAny };
}

async function handleAuthGoogle(request, env) {
  const body = await readRequestBodyAsJson(request);
  const credential = String(body.credential || "").trim();
  if (!credential) throw new HttpError(400, "Передай credential (Google ID token)");

  const verified = await verifyGoogleIdToken(credential, env);
  const user = await d1GetUserByEmail(env, verified.email);
  if (!user) throw new HttpError(403, "Пользователь не в команде");
  if (!canUseCrmApp(user)) throw new HttpError(403, "Нет доступа к Pllato CRM");

  const session = await issueSessionTokenForUser(env, user);
  return {
    ok: true,
    token: session.token,
    exp: session.exp,
    user: publicUserPayload(user),
  };
}

async function handleUsersList(request, env, actor) {
  if (!actor?.user) throw new HttpError(401, "Сессия не найдена");
  const users = await d1ListUsers(env);
  return { ok: true, users: users.map(publicUserPayload) };
}

async function handleUsersSave(request, env, actor) {
  if (!canManageUsers(actor)) throw new HttpError(403, "Нет прав на редактирование пользователей");
  const body = await readRequestBodyAsJson(request);
  const user = await d1UpsertUser(env, body, actor);
  return { ok: true, user: publicUserPayload(user) };
}

async function handleUsersDelete(request, env, actor) {
  if (!canDeleteUsers(actor)) throw new HttpError(403, "Только super-admin может удалить пользователя");
  const body = await readRequestBodyAsJson(request);
  const id = String(body.id || "").trim();
  if (!id) throw new HttpError(400, "Передай id пользователя");

  const target = await d1GetUserById(env, id);
  if (!target) return { ok: true, deleted: id };
  if (String(target.email || "").toLowerCase() === ROOT_SUPER_ADMIN) {
    throw new HttpError(400, "Нельзя удалить root super-admin");
  }
  await d1DeleteUser(env, id);
  return { ok: true, deleted: id };
}

async function handleChannelsSecret(env, actor, channelId) {
  if (!canManageChannels(actor)) throw new HttpError(403, "Нет прав на просмотр секрета канала");
  const channel = await d1LoadChannel(env, channelId);
  return {
    ok: true,
    id: channel.id,
    secrets: isObject(channel.secret) ? channel.secret : {},
  };
}

function canManageChannels(actor) {
  if (actor?.isRoot || actor?.isAdmin) return true;
  const claims = actor?.claims || {};
  if (claims.admin === true) return true;
  if (claims.isAdmin === true) return true;
  if (claims.isSuperAdmin === true) return true;
  return false;
}

function normalizeChannelType(value) {
  const type = String(value || "").trim();
  if (!type) throw new HttpError(400, "У канала должен быть type");
  return type;
}

async function d1UpsertChannel(env, payload, actor) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);

  const id = String(payload.id || crypto.randomUUID()).trim();
  const type = normalizeChannelType(payload.type);
  const name = String(payload.name || "").trim();
  if (!name) throw new HttpError(400, "Укажи название канала");

  const active = payload.active === false ? 0 : 1;
  const apps = isObject(payload.apps) ? payload.apps : {};
  const configPublic = isObject(payload.configPublic)
    ? payload.configPublic
    : (isObject(payload.config) ? payload.config : {});
  const hasSecretsField =
    Object.prototype.hasOwnProperty.call(payload, "secrets") ||
    Object.prototype.hasOwnProperty.call(payload, "secret");
  const configSecret = hasSecretsField
    ? (isObject(payload.secrets) ? payload.secrets : (isObject(payload.secret) ? payload.secret : {}))
    : null;

  const now = Date.now();
  await db
    .prepare(`
      INSERT INTO channels (
        id, type, name, active, apps, config,
        created_at, updated_at, created_by, updated_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        name = excluded.name,
        active = excluded.active,
        apps = excluded.apps,
        config = excluded.config,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `)
    .bind(
      id,
      type,
      name,
      active,
      JSON.stringify(apps),
      JSON.stringify(configPublic),
      now,
      now,
      actor?.email || actor?.uid || null,
      actor?.email || actor?.uid || null,
    )
    .run();

  if (configSecret !== null) {
    await db
      .prepare(`
        INSERT INTO channel_secrets (channel_id, secrets, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(channel_id) DO UPDATE SET
          secrets = excluded.secrets,
          updated_at = excluded.updated_at
      `)
      .bind(id, JSON.stringify(configSecret), now)
      .run();
  }

  const row = await db
    .prepare(`
      SELECT c.id, c.type, c.name, c.active, c.apps, c.config, c.created_at, c.updated_at,
             cs.secrets
      FROM channels c
      LEFT JOIN channel_secrets cs ON cs.channel_id = c.id
      WHERE c.id = ?
      LIMIT 1
    `)
    .bind(id)
    .first();

  return d1RowToChannelPayload(row, { includeSecrets: true });
}

async function d1DeleteChannel(env, channelId) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  await db
    .prepare("DELETE FROM channels WHERE id = ?")
    .bind(String(channelId || ""))
    .run();
}

async function handleChannelsList(request, env, actor, url = null) {
  let type = null;
  let onlyActive = true;
  let includeSecrets = false;

  if (request.method === "GET") {
    const ref = url || new URL(request.url);
    type = ref.searchParams.get("type") || null;
    onlyActive = ref.searchParams.get("onlyActive") !== "false";
    includeSecrets = ref.searchParams.get("includeSecrets") === "true";
  } else {
    const body = await readRequestBodyAsJson(request);
    type = body.type ? String(body.type).trim() : null;
    onlyActive = body.onlyActive !== false;
    includeSecrets = body.includeSecrets === true;
  }

  if (includeSecrets && !canManageChannels(actor)) {
    throw new HttpError(403, "Нет прав на просмотр секретов каналов");
  }

  let rows = await d1ListChannels(env);
  if (type) rows = rows.filter((r) => r.type === type);
  if (onlyActive) rows = rows.filter((r) => Number(r.active) !== 0);

  return {
    ok: true,
    channels: rows.map((row) => d1RowToChannelPayload(row, { includeSecrets })),
    source: "d1",
  };
}

async function handleChannelsUpsert(request, env, actor) {
  if (!canManageChannels(actor)) throw new HttpError(403, "Нет прав на изменение каналов");
  const body = await readRequestBodyAsJson(request);
  const channel = await d1UpsertChannel(env, body, actor);
  await logEvent(env, "channels", {
    at: nowIso(),
    action: "upsert",
    actorUid: actor.uid,
    actorEmail: actor.email,
    channelId: channel.id,
    channelType: channel.type,
    active: channel.active,
  });
  return { ok: true, channel };
}

async function handleChannelsDelete(request, env, actor) {
  if (!canManageChannels(actor)) throw new HttpError(403, "Нет прав на удаление каналов");
  const body = await readRequestBodyAsJson(request);
  const channelId = String(body.id || "").trim();
  if (!channelId) throw new HttpError(400, "Не передан id канала");
  await d1DeleteChannel(env, channelId);
  await logEvent(env, "channels", {
    at: nowIso(),
    action: "delete",
    actorUid: actor.uid,
    actorEmail: actor.email,
    channelId,
  });
  return { ok: true, deleted: channelId };
}

function normalizePhone(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withPlus = raw.startsWith("+");
  const digits = raw.replace(/[^\d]/g, "");
  return withPlus ? `+${digits}` : digits;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizeForLog(value) {
  const s = String(value || "");
  if (!s) return "";
  if (s.length <= 8) return "****";
  return `${s.slice(0, 4)}****${s.slice(-2)}`;
}

function pickSecretString(...values) {
  for (const value of values) {
    const s = String(value || "").trim();
    if (s) return s;
  }
  return "";
}

function normalizeWaChatId(to) {
  const src = String(to || "").trim();
  if (!src) return "";
  if (src.includes("@c.us") || src.includes("@g.us") || src.includes("@lid")) return src;
  const clean = normalizePhone(src).replace(/^\+/, "");
  return clean ? `${clean}@c.us` : "";
}

function normalizeWaInstanceId(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  return digits || "";
}

function sanitizeGreenApiToken(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function normalizeBinotelCallUrl(value) {
  const fallback = "https://api.binotel.com/api/4.0/calls/internal-number-to-external-number.json";
  const raw = String(value || "").trim();
  if (!raw) return fallback;

  let candidate = raw.replace(/^api_url\s*=\s*/i, "").trim();
  const embedded = candidate.match(/https?:\/\/[^\s"'`]+/i);
  if (embedded?.[0]) candidate = embedded[0];

  if (!/^https?:\/\//i.test(candidate)) {
    if (/^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(candidate)) candidate = `https://${candidate}`;
    else return fallback;
  }

  try {
    const parsed = new URL(candidate);
    const pathname = String(parsed.pathname || "");
    if (!pathname || pathname === "/") {
      parsed.pathname = "/api/4.0/calls/internal-number-to-external-number.json";
      parsed.search = "";
    }
    return parsed.toString();
  } catch {
    return fallback;
  }
}

function normalizeGreenApiBaseUrl(value, fallback = "https://api.green-api.com") {
  const fallbackUrl = trimSlash(String(fallback || "https://api.green-api.com"));
  const raw = String(value || "").trim();
  if (!raw) return fallbackUrl;

  // Частый случай: пользователь вставил "api_url = https://...."
  let candidate = raw.replace(/^api_url\s*=\s*/i, "").trim();

  // Если в строке есть URL среди лишнего текста — вытащим его.
  const embedded = candidate.match(/https?:\/\/[^\s"'`]+/i);
  if (embedded?.[0]) candidate = embedded[0];

  if (!/^https?:\/\//i.test(candidate)) {
    if (/^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(candidate)) {
      candidate = `https://${candidate}`;
    } else {
      return fallbackUrl;
    }
  }

  try {
    const parsed = new URL(candidate);
    // Для Green-API нужен именно base-origin, даже если случайно вставили /waInstance...
    return trimSlash(parsed.origin);
  } catch {
    return fallbackUrl;
  }
}

function safeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.toString();
  } catch {
    return "";
  }
}

function guessFileName(urlFile, fallback = "file.bin") {
  try {
    const u = new URL(urlFile);
    const last = u.pathname.split("/").filter(Boolean).pop() || "";
    if (!last) return fallback;
    const clean = decodeURIComponent(last).trim();
    return clean || fallback;
  } catch {
    return fallback;
  }
}

function pickFirstString(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function toMsTimestamp(value) {
  const n = Number(value) || 0;
  if (!n) return Date.now();
  // webhook обычно в секундах
  return n < 1000000000000 ? n * 1000 : n;
}

function inferMediaKind(typeMessage, mimeType, fileName) {
  const t = String(typeMessage || "").toLowerCase();
  const mime = String(mimeType || "").toLowerCase();
  const name = String(fileName || "").toLowerCase();
  if (t.includes("audio") || mime.startsWith("audio/") || /\.(ogg|mp3|wav|m4a|opus)$/.test(name)) return "audio";
  if (t.includes("video") || mime.startsWith("video/") || /\.(mp4|mov|webm|mkv)$/.test(name)) return "video";
  if (t.includes("image") || mime.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|heic)$/.test(name)) return "image";
  return "file";
}

function isBinotelProviderSuccess(body) {
  if (!isObject(body)) return true;
  const status = String(body.status || body.result || body.state || "").trim().toLowerCase();
  if (status && !["success", "ok", "true", "accepted"].includes(status)) return false;
  if (body.error || body.errors) return false;
  return true;
}

function binotelProviderErrorMessage(body) {
  if (!isObject(body)) return String(body || "").slice(0, 300);
  return String(
    body.message ||
    body.error_description ||
    body.errorMessage ||
    body.error ||
    body.errors ||
    body.description ||
    "",
  ).slice(0, 300);
}

async function callBinotelEndpoint(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();
  let providerBody = responseText;
  try { providerBody = JSON.parse(responseText); } catch {}

  return {
    ok: res.ok && isBinotelProviderSuccess(providerBody),
    status: res.status,
    body: providerBody,
    url,
    error: binotelProviderErrorMessage(providerBody),
  };
}

async function callBinotelAPI(channel, payload, env) {
  const publicConfig = channel.data.config || {};
  const secretConfig = channel.secret || {};
  const channelApiKey = pickSecretString(secretConfig.api_key, secretConfig.apiKey, publicConfig.api_key, publicConfig.apiKey);
  const channelApiSecret = pickSecretString(
    secretConfig.api_secret,
    secretConfig.apiSecret,
    secretConfig.secret,
    publicConfig.api_secret,
    publicConfig.apiSecret,
  );
  const apiKey = pickSecretString(channelApiKey, env.BINOTEL_API_KEY);
  const apiSecret = pickSecretString(channelApiSecret, env.BINOTEL_API_SECRET);
  const companyId = pickSecretString(
    publicConfig.company_id,
    publicConfig.companyId,
    secretConfig.company_id,
    secretConfig.companyId,
    env.BINOTEL_COMPANY_ID,
  );
  if (!apiKey || !apiSecret) {
    throw new HttpError(400, "У канала Binotel не заполнены api_key/api_secret", {
      hasChannelApiKey: Boolean(channelApiKey),
      hasChannelApiSecret: Boolean(channelApiSecret),
      hasEnvApiKey: Boolean(String(env.BINOTEL_API_KEY || "").trim()),
      hasEnvApiSecret: Boolean(String(env.BINOTEL_API_SECRET || "").trim()),
    });
  }

  // Binotel принимает JSON; дублируем key/apiKey для совместимости со старыми настройками.
  const providerPayload = {
    key: apiKey,
    apiKey,
    secret: apiSecret,
    externalNumber: payload.externalNumber,
    internalNumber: payload.internalNumber,
  };
  if (companyId) {
    providerPayload.companyID = companyId;
    providerPayload.companyId = companyId;
  }

  const endpointCandidates = [
    publicConfig.api_url,
    publicConfig.apiUrl,
    env.BINOTEL_CLICK_TO_CALL_URL,
    "https://api.binotel.com/api/4.0/calls/internal-number-to-external-number.json",
    "https://api.binotel.com/api/4.0/calls/click-to-call.json",
  ]
    .map((x) => normalizeBinotelCallUrl(x))
    .filter((x, i, arr) => x && arr.indexOf(x) === i);

  const attempts = [];
  let provider = null;
  for (const endpoint of endpointCandidates) {
    console.log("binotel call attempt:", JSON.stringify({
      url: endpoint,
      request: {
        apiKey: sanitizeForLog(apiKey),
        hasSecret: Boolean(apiSecret),
        companyId: companyId || null,
        externalNumber: payload.externalNumber,
        internalNumber: payload.internalNumber,
      },
    }));

    let one;
    try {
      one = await callBinotelEndpoint(endpoint, providerPayload);
    } catch (e) {
      one = {
        ok: false,
        status: 0,
        body: null,
        url: endpoint,
        error: String(e?.message || e),
      };
    }

    const attempt = {
      url: one.url,
      status: one.status,
      ok: one.ok,
      body: one.body,
      error: one.error || "",
    };
    attempts.push(attempt);
    console.log("binotel call result:", JSON.stringify(attempt));

    if (one.ok) {
      provider = one;
      break;
    }
    provider = one;
  }

  return {
    ok: Boolean(provider?.ok),
    status: Number(provider?.status || 0),
    body: provider?.body ?? null,
    url: provider?.url || endpointCandidates[0] || "",
    attempts,
    error: provider?.error || "",
    requestMask: {
      apiKey: sanitizeForLog(apiKey),
      hasSecret: Boolean(apiSecret),
      companyId: companyId || null,
      externalNumber: payload.externalNumber,
      internalNumber: payload.internalNumber,
    },
  };
}

function extractBinotelCallId(body) {
  if (!isObject(body)) return null;
  return body.callId || body.call_id || body.generalCallID || body.id || null;
}

async function handleBinotelCall(request, env, actor) {
  const body = await readRequestBodyAsJson(request);
  const channelId = body.channelId;
  const externalNumber = normalizePhone(body.externalNumber || body.to);
  if (!externalNumber) throw new HttpError(400, "externalNumber пустой");

  const channel = await loadChannel(env, channelId);
  assertChannelType(channel, "binotel");

  const internalNumber = normalizePhone(
    body.internalNumber ||
    actor.user?.binotelLine ||
    actor.user?.binotel_line ||
    actor.user?.internalNumber ||
    channel.data.config?.default_inner,
  );
  if (!internalNumber) {
    throw new HttpError(400, "Не задана линия сотрудника (internalNumber). Укажи её в Пользователях или default_inner в канале.");
  }

  const provider = await callBinotelAPI(channel, { externalNumber, internalNumber }, env);
  const callId = extractBinotelCallId(provider.body);

  await logEvent(env, "binotel_calls", {
    at: nowIso(),
    actorUid: actor.uid,
    actorEmail: actor.email,
    channelId: channel.id,
    externalNumber,
    internalNumber,
    providerStatus: provider.status,
    providerOk: provider.ok,
    providerUrl: provider.url,
    providerBody: provider.body,
    providerError: provider.error,
    providerAttempts: provider.attempts || [],
    callId,
  });

  if (!provider.ok) {
    throw new HttpError(502, provider.error || "Binotel API вернул ошибку", {
      status: provider.status,
      url: provider.url,
      body: provider.body,
      attempts: provider.attempts || [],
      request: provider.requestMask,
    });
  }

  return {
    ok: true,
    callId,
    providerStatus: provider.status,
    providerBody: provider.body,
  };
}

function extractBinotelRecordUrl(body) {
  if (!isObject(body)) return "";
  const direct = pickFirstString(body, ["url", "recordUrl", "record_url", "link"]);
  if (direct) return direct;
  if (isObject(body.result)) {
    const nested = pickFirstString(body.result, ["url", "recordUrl", "record_url", "link"]);
    if (nested) return nested;
  }
  if (isObject(body.data)) {
    const nested = pickFirstString(body.data, ["url", "recordUrl", "record_url", "link"]);
    if (nested) return nested;
  }
  return "";
}

async function callBinotelRecordingApi(channel, callId) {
  const apiKey = String(channel.data.config?.api_key || channel.secret?.api_key || "").trim();
  const apiSecret = String(channel.secret?.api_secret || channel.data.config?.api_secret || "").trim();
  if (!apiKey || !apiSecret) throw new HttpError(400, "У канала Binotel не заполнены api_key/api_secret");

  const endpoint = "https://api.binotel.com/api/4.0/stats/call-record.json";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: apiKey,
      secret: apiSecret,
      generalCallID: callId,
    }),
  });

  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text); } catch {}
  const ok = res.ok && isBinotelProviderSuccess(body);
  const recordUrl = extractBinotelRecordUrl(body);
  return {
    ok: ok && Boolean(recordUrl),
    status: res.status,
    body,
    recordUrl,
    endpoint,
  };
}

function normalizeHistoryRecord(row) {
  const payload = safeParseJson(row?.payload_json, {});
  const normalized = isObject(payload?.normalized) ? payload.normalized : payload;
  const callId = String(pickFirst(normalized, ["callId", "generalCallID", "generalCallId", "id"]) || "").trim();
  const externalNumber = normalizePhone(pickFirst(normalized, ["externalNumber", "phone", "clientPhone"]));
  const internalNumber = normalizePhone(pickFirst(normalized, ["internalNumber", "internalAdditionalData"]));
  const billsec = Number(pickFirst(normalized, ["billsec", "duration"])) || 0;
  const waitsec = Number(pickFirst(normalized, ["waitsec", "wait"])) || 0;
  const startTime = Number(pickFirst(normalized, ["startTime", "ts"])) || 0;

  return {
    id: String(row.id || ""),
    at: startTime ? toMsTimestamp(startTime) : Number(row.created_at) || Date.now(),
    source: String(row.bucket || ""),
    callId: callId || "",
    externalNumber: externalNumber || "",
    internalNumber: internalNumber || "",
    disposition: String(pickFirst(normalized, ["disposition", "status"]) || ""),
    callType: String(pickFirst(normalized, ["callType", "type"]) || ""),
    durationSeconds: billsec,
    waitSeconds: waitsec,
    companyId: String(pickFirst(normalized, ["companyID", "companyId"]) || ""),
  };
}

function parseInternalNumbersFilter(raw) {
  const src = String(raw || "").trim();
  if (!src) return [];
  const uniq = new Set();
  src.split(",").forEach((one) => {
    const line = String(one || "").replace(/[^\d]/g, "");
    if (line) uniq.add(line);
  });
  return [...uniq];
}

async function handleBinotelHistory(request, env, actor, url) {
  void actor;
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit")) || 100, 500));
  const linesFilter = parseInternalNumbersFilter(url.searchParams.get("internal_numbers"));
  const rows = await d1ListIntegrationLogs(env, ["binotel_webhooks"], limit);
  let calls = rows
    .map((row) => normalizeHistoryRecord(row))
    .filter((row) => row.callId || row.externalNumber || row.internalNumber);
  if (linesFilter.length > 0) {
    calls = calls.filter((row) => linesFilter.includes(String(row.internalNumber || "").replace(/[^\d]/g, "")));
  }

  return {
    ok: true,
    calls,
    filteredByInternalNumbers: linesFilter,
  };
}

async function handleBinotelRecording(request, env, actor) {
  const body = await readRequestBodyAsJson(request);
  const channelId = String(body.channelId || "").trim();
  const callId = String(body.callId || body.generalCallID || "").trim();
  if (!channelId) throw new HttpError(400, "Не передан channelId");
  if (!callId) throw new HttpError(400, "Не передан callId (generalCallID)");

  const channel = await loadChannel(env, channelId);
  assertChannelType(channel, "binotel");

  const provider = await callBinotelRecordingApi(channel, callId);

  await logEvent(env, "binotel_call_records", {
    at: nowIso(),
    actorUid: actor.uid,
    actorEmail: actor.email,
    channelId,
    callId,
    providerStatus: provider.status,
    providerOk: provider.ok,
    providerBody: provider.body,
    recordUrl: provider.recordUrl || null,
  });

  if (!provider.ok) {
    throw new HttpError(502, "Не удалось получить запись звонка", {
      status: provider.status,
      body: provider.body,
      callId,
    });
  }

  return {
    ok: true,
    callId,
    recordUrl: provider.recordUrl,
    expiresInMinutes: 15,
    providerStatus: provider.status,
  };
}

function pickFirst(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return null;
}

function normalizeBinotelWebhookPayload(payload) {
  if (!isObject(payload)) return null;
  const d = isObject(payload.callDetails) ? payload.callDetails : payload;
  return {
    callId: pickFirst(d, ["generalCallID", "generalCallId", "callId", "id"]),
    externalNumber: normalizePhone(pickFirst(d, ["externalNumber", "phone", "clientPhone"])),
    internalNumber: normalizePhone(pickFirst(d, ["internalNumber", "internalAdditionalData"])),
    callType: pickFirst(d, ["callType", "type"]),
    disposition: pickFirst(d, ["disposition", "status"]),
    billsec: Number(pickFirst(d, ["billsec", "duration"])) || 0,
    waitsec: Number(pickFirst(d, ["waitsec", "wait"])) || 0,
    startTime: Number(pickFirst(d, ["startTime", "ts"])) || null,
    companyID: pickFirst(d, ["companyID", "companyId"]),
  };
}

async function handleBinotelWebhook(request, env) {
  const parsedBody = await readRequestBodyAuto(request);
  const payload = isObject(parsedBody.parsed) ? parsedBody.parsed : null;
  const normalized = normalizeBinotelWebhookPayload(payload);

  const headers = {};
  for (const [k, v] of request.headers.entries()) {
    if (k.toLowerCase().startsWith("cf-") || k.toLowerCase() === "user-agent") headers[k] = v;
  }

  await logEvent(env, "binotel_webhooks", {
    at: nowIso(),
    contentType: parsedBody.contentType,
    headers,
    normalized,
    payload: payload || parsedBody.raw,
  });

  return { status: "success", ok: true, received: true, callId: normalized?.callId || null };
}

async function handleWaSend(request, env, actor) {
  const body = await readRequestBodyAsJson(request);
  const channel = await loadChannel(env, body.channelId);
  assertChannelType(channel, "greenapi_wa");

  const chatId = normalizeWaChatId(body.to || body.chatId);
  if (!chatId) throw new HttpError(400, "Некорректный chatId/номер для WhatsApp");

  const idInstance = normalizeWaInstanceId(channel.data.config?.id_instance);
  const token = sanitizeGreenApiToken(channel.secret?.api_token_instance || "");
  if (!idInstance || !token) {
    throw new HttpError(400, "У канала WhatsApp не заполнены id_instance/api_token_instance");
  }

  const apiUrl = normalizeGreenApiBaseUrl(
    channel.data.config?.api_url || env.GREEN_API_URL || "https://api.green-api.com",
    "https://api.green-api.com",
  );
  const text = String(body.text || "").trim();
  const urlFile = safeUrl(body.urlFile);
  const isFileMode = Boolean(urlFile);

  let endpoint;
  let payload;
  if (isFileMode) {
    const fileName = String(body.fileName || "").trim() || guessFileName(urlFile, "file.bin");
    const caption = String(body.caption || body.text || "").trim();
    payload = {
      chatId,
      urlFile,
      fileName,
      caption: caption || undefined,
      typingType: body.asVoice ? "recording" : undefined,
      typingTime: Number(body.typingTime) || undefined,
      quotedMessageId: String(body.quotedMessageId || "").trim() || undefined,
    };
    endpoint = `${apiUrl}/waInstance${idInstance}/sendFileByUrl/${token}`;
  } else {
    if (!text) throw new HttpError(400, "Текст сообщения пустой");
    payload = {
      chatId,
      message: text,
      quotedMessageId: String(body.quotedMessageId || "").trim() || undefined,
      linkPreview: body.linkPreview !== false,
    };
    endpoint = `${apiUrl}/waInstance${idInstance}/sendMessage/${token}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const responseText = await res.text();
  let providerBody = responseText;
  try { providerBody = JSON.parse(responseText); } catch {}

  await logEvent(env, "wa_messages", {
    at: nowIso(),
    actorUid: actor.uid,
    actorEmail: actor.email,
    channelId: channel.id,
    chatId,
    providerStatus: res.status,
    providerOk: res.ok,
    sendMode: isFileMode ? "file" : "text",
    providerBody,
  });

  if (!res.ok) throw new HttpError(502, "Green-API вернул ошибку", providerBody);

  const outgoingEvent = {
    instanceId: idInstance,
    typeWebhook: "localSend",
    typeMessage: isFileMode ? "fileMessage" : "textMessage",
    idMessage: providerBody?.idMessage || providerBody?.id || null,
    chatId,
    isGroup: chatId.endsWith("@g.us"),
    chatName: String(body.chatName || "").trim() || waReadableName({}, chatId),
    text: isFileMode ? (String(body.caption || body.text || "").trim() || `[Файл]`) : String(body.text || "").trim(),
    fileInfo: isFileMode ? {
      mediaKind: inferMediaKind("documentMessage", String(body.mimeType || ""), String(body.fileName || guessFileName(urlFile))),
      url: urlFile,
      fileName: String(body.fileName || "").trim() || guessFileName(urlFile),
      mimeType: String(body.mimeType || "").trim(),
      caption: String(body.caption || body.text || "").trim(),
      raw: null,
    } : null,
    ts: Date.now(),
    raw: providerBody,
    from: "me",
  };
  await upsertWaConversationEvent(env, actor.email || actor.uid, outgoingEvent);

  return {
    ok: true,
    mode: isFileMode ? "file" : "text",
    providerStatus: res.status,
    providerBody,
    idMessage: providerBody?.idMessage || null,
  };
}

function isAllowedGreenWebhookType(typeWebhook) {
  return typeWebhook === "incomingMessageReceived" ||
    typeWebhook === "outgoingMessageReceived" ||
    typeWebhook === "outgoingAPIMessageReceived";
}

function isGreenWebhookAuthValid(authHeader, configuredToken) {
  const incoming = String(authHeader || "").trim();
  const expected = String(configuredToken || "").trim();
  if (!expected) return true;
  if (!incoming) return false;

  // Если в настройке уже указан префикс (Bearer/Basic) — сравниваем как есть.
  if (/^(Bearer|Basic)\s+/i.test(expected)) return incoming === expected;
  // Иначе допускаем как "Bearer <token>", так и точное совпадение.
  return incoming === expected || incoming === `Bearer ${expected}`;
}

async function handleWaWebhook(request, env) {
  const parsedBody = await readRequestBodyAuto(request);
  const payload = isObject(parsedBody.parsed) ? parsedBody.parsed : null;
  if (!payload) throw new HttpError(400, "Пустой webhook payload");

  const envelope = extractWaWebhookEnvelope(payload);
  if (!envelope) {
    return { ok: true, received: true, ignored: true, reason: "unsupported_payload" };
  }

  const channel = await findGreenApiChannelByInstance(env, envelope.instanceId);
  if (!channel) {
    await logEvent(env, "wa_webhooks", {
      at: nowIso(),
      ignored: true,
      reason: "channel_not_found",
      instanceId: envelope.instanceId,
      typeWebhook: envelope.typeWebhook,
      chatId: envelope.chatId,
    });
    return { ok: true, received: true, ignored: true, reason: "channel_not_found" };
  }

  const authHeader = request.headers.get("Authorization");
  if (!isGreenWebhookAuthValid(authHeader, channel.secret?.webhook_token)) {
    throw new HttpError(401, "Неверный Authorization для Green-API webhook");
  }

  if (!isAllowedGreenWebhookType(envelope.typeWebhook)) {
    return { ok: true, received: true, ignored: true, typeWebhook: envelope.typeWebhook };
  }

  await upsertWaConversationEvent(env, "green-api-webhook", envelope);

  await logEvent(env, "wa_webhooks", {
    at: nowIso(),
    channelId: channel.id,
    instanceId: envelope.instanceId,
    typeWebhook: envelope.typeWebhook,
    typeMessage: envelope.typeMessage,
    chatId: envelope.chatId,
    isGroup: envelope.isGroup,
    idMessage: envelope.idMessage || null,
  });

  return {
    ok: true,
    received: true,
    typeWebhook: envelope.typeWebhook,
    idMessage: envelope.idMessage || null,
    chatId: envelope.chatId,
    isGroup: envelope.isGroup,
  };
}

function formatAddress(name, email) {
  const cleanEmail = String(email || "").trim();
  const cleanName = String(name || "").trim().replace(/"/g, "");
  if (!cleanName) return `<${cleanEmail}>`;
  return `"${cleanName}" <${cleanEmail}>`;
}

function encodeMimeHeader(value) {
  const s = String(value || "");
  if (!s) return "";
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  return `=?UTF-8?B?${encodeBase64Utf8(s)}?=`;
}

function createLineReader(readable) {
  const reader = readable.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return {
    async readLine() {
      while (true) {
        const idx = buffer.indexOf("\n");
        if (idx !== -1) {
          const line = buffer.slice(0, idx + 1);
          buffer = buffer.slice(idx + 1);
          return line.replace(/\r?\n$/, "");
        }
        const chunk = await reader.read();
        if (chunk.done) {
          if (!buffer) return null;
          const tail = buffer;
          buffer = "";
          return tail;
        }
        buffer += decoder.decode(chunk.value, { stream: true });
      }
    },
    async close() {
      try { await reader.cancel(); } catch {}
    },
  };
}

async function readSmtpResponse(lineReader) {
  const lines = [];
  let code = 0;
  while (true) {
    const line = await lineReader.readLine();
    if (line === null) throw new Error("SMTP: соединение закрыто");
    lines.push(line);
    const m = line.match(/^(\d{3})([\s-])(.*)$/);
    if (!m) continue;
    if (!code) code = Number(m[1]);
    if (m[2] === " ") break;
  }
  return { code, text: lines.join("\n"), lines };
}

function assertSmtpCode(resp, allowed, step) {
  if (!allowed.includes(resp.code)) {
    throw new Error(`SMTP ${step}: ${resp.text}`);
  }
}

async function smtpSend({ host, port, user, pass, fromName, fromEmail, toEmail, subject, text }) {
  const targetPort = Number(port) || 587;
  const secureMode = targetPort === 465 ? "on" : "starttls";
  const socketAddr = { hostname: host, port: targetPort };
  const encoder = new TextEncoder();

  let socket = connect(socketAddr, { secureTransport: secureMode });
  let writer = socket.writable.getWriter();
  let lineReader = createLineReader(socket.readable);

  const writeLine = async (line) => {
    await writer.write(encoder.encode(`${line}\r\n`));
  };

  const closeAll = async () => {
    try { writer.releaseLock(); } catch {}
    try { await lineReader.close(); } catch {}
    try { await socket.close(); } catch {}
  };

  try {
    const banner = await readSmtpResponse(lineReader);
    assertSmtpCode(banner, [220], "banner");

    await writeLine("EHLO pllato-crm-worker");
    let ehlo = await readSmtpResponse(lineReader);
    assertSmtpCode(ehlo, [250], "EHLO");

    if (secureMode === "starttls" && /\bSTARTTLS\b/i.test(ehlo.text)) {
      await writeLine("STARTTLS");
      const startTlsResp = await readSmtpResponse(lineReader);
      assertSmtpCode(startTlsResp, [220], "STARTTLS");

      const secureSocket = socket.startTls();
      try { writer.releaseLock(); } catch {}
      try { await lineReader.close(); } catch {}

      socket = secureSocket;
      writer = socket.writable.getWriter();
      lineReader = createLineReader(socket.readable);

      await writeLine("EHLO pllato-crm-worker");
      ehlo = await readSmtpResponse(lineReader);
      assertSmtpCode(ehlo, [250], "EHLO after STARTTLS");
    }

    if (user && pass) {
      const authLine = ehlo.text.toUpperCase();
      if (!authLine.includes("AUTH")) {
        throw new Error("SMTP сервер не поддерживает AUTH");
      }

      const plain = encodeBase64Utf8(`\u0000${user}\u0000${pass}`);
      await writeLine(`AUTH PLAIN ${plain}`);
      let authResp = await readSmtpResponse(lineReader);

      if (authResp.code !== 235) {
        await writeLine("AUTH LOGIN");
        authResp = await readSmtpResponse(lineReader);
        assertSmtpCode(authResp, [334], "AUTH LOGIN prompt");

        await writeLine(encodeBase64Utf8(user));
        authResp = await readSmtpResponse(lineReader);
        assertSmtpCode(authResp, [334], "AUTH LOGIN user");

        await writeLine(encodeBase64Utf8(pass));
        authResp = await readSmtpResponse(lineReader);
        assertSmtpCode(authResp, [235], "AUTH LOGIN pass");
      }
    }

    await writeLine(`MAIL FROM:<${fromEmail}>`);
    assertSmtpCode(await readSmtpResponse(lineReader), [250], "MAIL FROM");

    await writeLine(`RCPT TO:<${toEmail}>`);
    assertSmtpCode(await readSmtpResponse(lineReader), [250, 251], "RCPT TO");

    await writeLine("DATA");
    assertSmtpCode(await readSmtpResponse(lineReader), [354], "DATA");

    const messageId = `<${crypto.randomUUID()}@pllato-worker.local>`;
    const headers = [
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${messageId}`,
      `From: ${formatAddress(fromName, fromEmail)}`,
      `To: <${toEmail}>`,
      `Subject: ${encodeMimeHeader(subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
    ];

    const normalizedText = String(text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((line) => (line.startsWith(".") ? `.${line}` : line))
      .join("\r\n");

    const fullMessage = `${headers.join("\r\n")}${normalizedText}\r\n.\r\n`;
    await writer.write(encoder.encode(fullMessage));
    assertSmtpCode(await readSmtpResponse(lineReader), [250], "DATA submit");

    await writeLine("QUIT");
    await readSmtpResponse(lineReader).catch(() => null);
    await closeAll();

    return { messageId };
  } catch (e) {
    await closeAll();
    throw e;
  }
}

async function handleEmailSend(request, env, actor) {
  const body = await readRequestBodyAsJson(request);
  const channel = await loadChannel(env, body.channelId);
  assertChannelType(channel, "smtp");

  const toEmail = normalizeEmail(body.to);
  const subject = String(body.subject || "").trim();
  const text = String(body.text || "").trim();
  if (!toEmail) throw new HttpError(400, "Пустой email получателя");
  if (!subject) throw new HttpError(400, "Тема письма пустая");
  if (!text) throw new HttpError(400, "Текст письма пустой");

  const host = String(channel.data.config?.host || "").trim();
  const port = Number(channel.data.config?.port || 587);
  const user = String(channel.data.config?.user || "").trim();
  const pass = String(channel.secret?.pass || "").trim();
  const fromName = String(channel.data.config?.from_name || "Pllato CRM").trim();
  const fromEmail = normalizeEmail(channel.data.config?.from_email || user);

  if (!host || !user || !pass || !fromEmail) {
    throw new HttpError(400, "SMTP-канал заполнен не полностью (host/user/pass/from)");
  }

  let result;
  try {
    result = await smtpSend({
      host,
      port,
      user,
      pass,
      fromName,
      fromEmail,
      toEmail,
      subject,
      text,
    });
  } catch (e) {
    await logEvent(env, "emails", {
      at: nowIso(),
      actorUid: actor.uid,
      actorEmail: actor.email,
      channelId: channel.id,
      toEmail,
      ok: false,
      error: e?.message || String(e),
    });
    throw new HttpError(502, "SMTP отправка не удалась", e?.message || String(e));
  }

  await logEvent(env, "emails", {
    at: nowIso(),
    actorUid: actor.uid,
    actorEmail: actor.email,
    channelId: channel.id,
    toEmail,
    ok: true,
    messageId: result.messageId,
  });

  return {
    ok: true,
    messageId: result.messageId,
  };
}

function canManageCalls(actor) {
  return Boolean(actor?.isRoot || actor?.isAdmin);
}

function requireCallsAdmin(actor) {
  if (!canManageCalls(actor)) throw new HttpError(403, "Нет прав на управление звонками");
}

function makePrefixedId(prefix) {
  const clean = String(prefix || "id").replace(/[^a-z0-9_]/gi, "").toLowerCase() || "id";
  return `${clean}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function parseStageCode(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");
}

function digitsOnly(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function parseTs(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) return Math.round(n);
  const t = Date.parse(String(value));
  if (Number.isFinite(t) && t > 0) return Math.round(t);
  return null;
}

function safeDateForTemplate(ts) {
  const n = parseTs(ts);
  if (!n) return "";
  return new Date(n).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function safeTimeForTemplate(ts) {
  const n = parseTs(ts);
  if (!n) return "";
  return new Date(n).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function applyTemplate(template, vars) {
  const text = String(template || "");
  return text.replace(/\{([a-z0-9_]+)\}/gi, (_, key) => String(vars?.[key] ?? ""));
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"' && inQuotes && next === '"') {
      cur += '"';
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseCsvText(csvRaw) {
  const text = String(csvRaw || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n").map((x) => x.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const required = ["name", "phone", "business_type", "notes"];
  const hasAll = required.every((r) => headers.includes(r));
  if (!hasAll) throw new HttpError(400, "CSV должен содержать колонки: name, phone, business_type, notes");

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = String(cells[idx] || "").trim(); });
    if (!row.name && !row.phone) continue;
    rows.push(row);
  }
  return rows;
}

async function d1TableColumns(env, tableName) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const table = String(tableName || "").trim().toLowerCase();
  if (!/^[a-z0-9_]+$/.test(table)) throw new HttpError(400, `Некорректное имя таблицы: ${tableName}`);
  const res = await db.prepare(`PRAGMA table_info(${table})`).run();
  return new Set((res.results || []).map((r) => String(r.name || "").trim()).filter(Boolean));
}

function pickCol(cols, candidates) {
  for (const c of candidates) {
    if (cols.has(c)) return c;
  }
  return null;
}

async function getCustomerFieldMap(env) {
  const cols = await d1TableColumns(env, "customers");
  if (cols.size === 0) throw new HttpError(500, "Таблица customers не найдена");
  const id = pickCol(cols, ["id"]);
  const name = pickCol(cols, ["name", "full_name", "customer_name", "title"]);
  const phone = pickCol(cols, ["phone", "phone_number", "mobile"]);
  const phoneDigits = pickCol(cols, ["phone_digits", "phone_normalized", "phone_digits_only"]);
  const businessType = pickCol(cols, ["business_type", "category", "segment"]);
  const notes = pickCol(cols, ["notes", "note", "comment"]);
  const sourceId = pickCol(cols, ["source_id", "customer_source_id"]);
  const createdAt = pickCol(cols, ["created_at", "createdAt"]);
  const updatedAt = pickCol(cols, ["updated_at", "updatedAt"]);
  if (!id) throw new HttpError(500, "Таблица customers должна иметь колонку id");
  if (!name) throw new HttpError(500, "Таблица customers должна иметь колонку name/full_name");
  return { cols, id, name, phone, phoneDigits, businessType, notes, sourceId, createdAt, updatedAt };
}

function mapCustomerRow(row, m) {
  if (!row) return null;
  return {
    id: String(row[m.id] || ""),
    name: String(row[m.name] || ""),
    phone: m.phone ? String(row[m.phone] || "") : "",
    phone_digits: m.phoneDigits ? String(row[m.phoneDigits] || "") : digitsOnly(m.phone ? row[m.phone] : ""),
    business_type: m.businessType ? String(row[m.businessType] || "") : "",
    notes: m.notes ? String(row[m.notes] || "") : "",
    source_id: m.sourceId ? String(row[m.sourceId] || "") : "",
  };
}

async function d1GetOutcomeMap(env) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const res = await db
    .prepare(`
      SELECT code, label, funnel_stage, order_index, is_active
      FROM call_outcomes
      WHERE is_active = 1
      ORDER BY order_index ASC, code ASC
    `)
    .run();
  const rows = res.results || [];
  const map = new Map();
  rows.forEach((r) => {
    map.set(String(r.code), {
      code: String(r.code),
      label: String(r.label || r.code),
      funnel_stage: String(r.funnel_stage || "dialed"),
      order_index: Number(r.order_index) || 0,
      is_active: Number(r.is_active) !== 0,
    });
  });
  return map;
}

async function d1ValidateOutcome(env, outcome) {
  const code = String(outcome || "").trim();
  if (!code) return null;
  const map = await d1GetOutcomeMap(env);
  if (!map.has(code)) {
    throw new HttpError(400, `Outcome "${code}" не найден в call_outcomes`);
  }
  return code;
}

async function d1GetScript(env, scriptId) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const id = String(scriptId || "").trim();
  if (!id) throw new HttpError(400, "script_id обязателен");

  const script = await db
    .prepare(`
      SELECT id, name, description, created_by, created_at, is_active
      FROM call_scripts
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first();
  if (!script) throw new HttpError(404, "Скрипт не найден");

  const stagesRes = await db
    .prepare(`
      SELECT id, script_id, order_index, code, name, goal, script_text, tip, whatsapp_template, is_terminal
      FROM call_script_stages
      WHERE script_id = ?
      ORDER BY order_index ASC
    `)
    .bind(id)
    .run();
  const stages = stagesRes.results || [];
  const stageIds = stages.map((s) => String(s.id));

  let transitions = [];
  let objections = [];
  if (stageIds.length > 0) {
    const placeholders = stageIds.map(() => "?").join(",");
    const tRes = await db
      .prepare(`
        SELECT id, stage_id, trigger_label, next_stage_code, outcome, order_index
        FROM call_script_transitions
        WHERE stage_id IN (${placeholders})
        ORDER BY order_index ASC
      `)
      .bind(...stageIds)
      .run();
    transitions = tRes.results || [];

    const oRes = await db
      .prepare(`
        SELECT id, stage_id, question, answer, order_index
        FROM call_script_objections
        WHERE stage_id IN (${placeholders})
        ORDER BY order_index ASC
      `)
      .bind(...stageIds)
      .run();
    objections = oRes.results || [];
  }

  const byStageT = new Map();
  transitions.forEach((t) => {
    const sid = String(t.stage_id);
    if (!byStageT.has(sid)) byStageT.set(sid, []);
    byStageT.get(sid).push({
      id: String(t.id),
      trigger_label: String(t.trigger_label || ""),
      next_stage_code: t.next_stage_code ? String(t.next_stage_code) : null,
      outcome: t.outcome ? String(t.outcome) : null,
      order_index: Number(t.order_index) || 0,
    });
  });

  const byStageO = new Map();
  objections.forEach((o) => {
    const sid = String(o.stage_id);
    if (!byStageO.has(sid)) byStageO.set(sid, []);
    byStageO.get(sid).push({
      id: String(o.id),
      question: String(o.question || ""),
      answer: String(o.answer || ""),
      order_index: Number(o.order_index) || 0,
    });
  });

  return {
    id: String(script.id),
    name: String(script.name),
    description: script.description ? String(script.description) : "",
    created_by: script.created_by ? String(script.created_by) : "",
    created_at: Number(script.created_at) || 0,
    is_active: Number(script.is_active) !== 0,
    stages: stages.map((s) => ({
      id: String(s.id),
      script_id: String(s.script_id),
      order_index: Number(s.order_index) || 0,
      code: String(s.code || ""),
      name: String(s.name || ""),
      goal: s.goal ? String(s.goal) : "",
      script_text: String(s.script_text || ""),
      tip: s.tip ? String(s.tip) : "",
      whatsapp_template: s.whatsapp_template ? String(s.whatsapp_template) : "",
      is_terminal: Number(s.is_terminal) !== 0,
      transitions: byStageT.get(String(s.id)) || [],
      objections: byStageO.get(String(s.id)) || [],
    })),
  };
}

async function d1ReplaceScriptStages(env, scriptId, stagesRaw) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const stages = Array.isArray(stagesRaw) ? stagesRaw : [];
  if (stages.length === 0) throw new HttpError(400, "Скрипт должен содержать минимум одну стадию");

  await db.prepare("DELETE FROM call_script_stages WHERE script_id = ?").bind(String(scriptId)).run();
  const outcomeMap = await d1GetOutcomeMap(env);

  const seenCodes = new Set();
  for (let i = 0; i < stages.length; i += 1) {
    const src = stages[i] || {};
    const stageId = String(src.id || makePrefixedId("stage")).trim();
    const stageCode = parseStageCode(src.code || `stage_${i + 1}`);
    if (!stageCode) throw new HttpError(400, `Некорректный code стадии #${i + 1}`);
    if (seenCodes.has(stageCode)) throw new HttpError(400, `Дублирующийся code стадии: ${stageCode}`);
    seenCodes.add(stageCode);

    const stageName = String(src.name || "").trim();
    const scriptText = String(src.script_text || src.scriptText || "").trim();
    if (!stageName) throw new HttpError(400, `У стадии ${stageCode} нет name`);
    if (!scriptText) throw new HttpError(400, `У стадии ${stageCode} нет script_text`);

    const stageOrder = Number(src.order_index);
    const orderIndex = Number.isFinite(stageOrder) ? stageOrder : i + 1;

    await db
      .prepare(`
        INSERT INTO call_script_stages (
          id, script_id, order_index, code, name, goal, script_text, tip, whatsapp_template, is_terminal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        stageId,
        String(scriptId),
        orderIndex,
        stageCode,
        stageName,
        String(src.goal || ""),
        scriptText,
        String(src.tip || ""),
        String(src.whatsapp_template || src.whatsappTemplate || ""),
        src.is_terminal ? 1 : 0,
      )
      .run();

    const transitions = Array.isArray(src.transitions) ? src.transitions : [];
    for (let j = 0; j < transitions.length; j += 1) {
      const t = transitions[j] || {};
      const outcomeCode = t.outcome ? String(t.outcome).trim() : "";
      if (outcomeCode && !outcomeMap.has(outcomeCode)) {
        throw new HttpError(400, `В стадии ${stageCode} outcome "${outcomeCode}" отсутствует в call_outcomes`);
      }
      const nextStageCode = t.next_stage_code ? parseStageCode(t.next_stage_code) : "";
      await db
        .prepare(`
          INSERT INTO call_script_transitions (id, stage_id, trigger_label, next_stage_code, outcome, order_index)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(
          String(t.id || makePrefixedId("transition")),
          stageId,
          String(t.trigger_label || "").trim(),
          nextStageCode || null,
          outcomeCode || null,
          Number.isFinite(Number(t.order_index)) ? Number(t.order_index) : j + 1,
        )
        .run();
    }

    const objections = Array.isArray(src.objections) ? src.objections : [];
    for (let j = 0; j < objections.length; j += 1) {
      const o = objections[j] || {};
      const question = String(o.question || "").trim();
      const answer = String(o.answer || "").trim();
      if (!question || !answer) continue;
      await db
        .prepare(`
          INSERT INTO call_script_objections (id, stage_id, question, answer, order_index)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(
          String(o.id || makePrefixedId("objection")),
          stageId,
          question,
          answer,
          Number.isFinite(Number(o.order_index)) ? Number(o.order_index) : j + 1,
        )
        .run();
    }
  }
}

async function d1CampaignFunnel(env, campaignId) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const cid = String(campaignId || "").trim();
  const outcomeMap = await d1GetOutcomeMap(env);

  const assignedRow = await db
    .prepare(`SELECT COUNT(*) AS cnt FROM call_assignments WHERE campaign_id = ?`)
    .bind(cid)
    .first();
  const assigned = Number(assignedRow?.cnt) || 0;

  const dialedRow = await db
    .prepare(`SELECT COUNT(DISTINCT customer_id) AS cnt FROM call_logs WHERE campaign_id = ?`)
    .bind(cid)
    .first();
  const dialed = Number(dialedRow?.cnt) || 0;

  const latestRes = await db
    .prepare(`
      SELECT l.customer_id, l.outcome
      FROM call_logs l
      INNER JOIN (
        SELECT customer_id, MAX(COALESCE(ended_at, started_at, 0)) AS max_ts
        FROM call_logs
        WHERE campaign_id = ?
        GROUP BY customer_id
      ) x ON x.customer_id = l.customer_id AND COALESCE(l.ended_at, l.started_at, 0) = x.max_ts
      WHERE l.campaign_id = ?
    `)
    .bind(cid, cid)
    .run();
  const latestRows = latestRes.results || [];
  const latestByCustomer = new Map();
  latestRows.forEach((r) => {
    const c = String(r.customer_id || "");
    if (!c || latestByCustomer.has(c)) return;
    latestByCustomer.set(c, String(r.outcome || ""));
  });

  let qualified = 0;
  let meetingBooked = 0;
  let closed = 0;
  const outcomeCounts = new Map();

  for (const [, outcome] of latestByCustomer.entries()) {
    if (!outcome) continue;
    outcomeCounts.set(outcome, (outcomeCounts.get(outcome) || 0) + 1);
    const meta = outcomeMap.get(outcome);
    const funnelStage = String(meta?.funnel_stage || "dialed");
    if (funnelStage === "qualified" || funnelStage === "meeting_booked" || funnelStage === "closed") qualified += 1;
    if (funnelStage === "meeting_booked" || funnelStage === "closed") meetingBooked += 1;
    if (funnelStage === "closed") closed += 1;
  }

  const conversionPct = assigned > 0 ? Math.round((meetingBooked / assigned) * 1000) / 10 : 0;
  const outcomes = [...outcomeCounts.entries()]
    .map(([code, count]) => ({
      code,
      count,
      label: outcomeMap.get(code)?.label || code,
      funnel_stage: outcomeMap.get(code)?.funnel_stage || "dialed",
      order_index: outcomeMap.get(code)?.order_index || 999,
    }))
    .sort((a, b) => (a.order_index - b.order_index) || a.code.localeCompare(b.code));

  return {
    assigned,
    dialed,
    qualified,
    meeting_booked: meetingBooked,
    closed,
    conversion_percent: conversionPct,
    outcomes,
  };
}

async function d1CampaignContacts(env, campaignId, filters = {}) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const customerMap = await getCustomerFieldMap(env);
  const cid = String(campaignId || "").trim();

  const wheres = ["a.campaign_id = ?"];
  const binds = [cid];

  if (filters.callerId) {
    wheres.push("a.caller_id = ?");
    binds.push(String(filters.callerId));
  }
  if (filters.status) {
    wheres.push("a.status = ?");
    binds.push(String(filters.status));
  }

  const res = await db
    .prepare(`
      SELECT a.id AS assignment_id, a.campaign_id, a.customer_id, a.caller_id, a.status, c.*
      FROM call_assignments a
      LEFT JOIN customers c ON c.id = a.customer_id
      WHERE ${wheres.join(" AND ")}
      ORDER BY a.rowid DESC
      LIMIT 5000
    `)
    .bind(...binds)
    .run();
  let rows = res.results || [];

  const customerIds = rows.map((r) => String(r.customer_id || "")).filter(Boolean);
  const lastRows = new Map();
  if (customerIds.length > 0) {
    const placeholders = customerIds.map(() => "?").join(",");
    const logRes = await db
      .prepare(`
        SELECT l.customer_id, l.outcome, l.ended_at, l.started_at, l.final_stage_code
        FROM call_logs l
        INNER JOIN (
          SELECT customer_id, MAX(COALESCE(ended_at, started_at, 0)) AS mx
          FROM call_logs
          WHERE campaign_id = ?
            AND customer_id IN (${placeholders})
          GROUP BY customer_id
        ) x ON x.customer_id = l.customer_id AND COALESCE(l.ended_at, l.started_at, 0) = x.mx
        WHERE l.campaign_id = ?
      `)
      .bind(cid, ...customerIds, cid)
      .run();
    (logRes.results || []).forEach((r) => {
      const key = String(r.customer_id || "");
      if (!key || lastRows.has(key)) return;
      lastRows.set(key, {
        outcome: r.outcome ? String(r.outcome) : "",
        final_stage_code: r.final_stage_code ? String(r.final_stage_code) : "",
        at: Number(r.ended_at || r.started_at || 0),
      });
    });
  }

  const dateFrom = parseTs(filters.dateFrom);
  const dateTo = parseTs(filters.dateTo);
  const outcomeFilter = filters.outcome ? String(filters.outcome) : "";

  rows = rows
    .map((row) => {
      const customer = mapCustomerRow(row, customerMap);
      const last = lastRows.get(String(row.customer_id || "")) || null;
      return {
        assignment_id: String(row.assignment_id || ""),
        campaign_id: String(row.campaign_id || ""),
        customer_id: String(row.customer_id || ""),
        caller_id: String(row.caller_id || ""),
        status: String(row.status || "pending"),
        customer,
        last_call: last,
      };
    })
    .filter((item) => {
      if (outcomeFilter && (item.last_call?.outcome || "") !== outcomeFilter) return false;
      const at = Number(item.last_call?.at || 0);
      if (dateFrom && at && at < dateFrom) return false;
      if (dateTo && at && at > dateTo) return false;
      return true;
    });

  return rows;
}

async function d1EnsureCampaignExists(env, campaignId) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const row = await db
    .prepare(`
      SELECT c.id, c.name, c.script_id, c.source_id, c.status, c.created_by, c.created_at, s.name AS script_name
      FROM call_campaigns c
      LEFT JOIN call_scripts s ON s.id = c.script_id
      WHERE c.id = ?
      LIMIT 1
    `)
    .bind(String(campaignId || ""))
    .first();
  if (!row) throw new HttpError(404, "Кампания не найдена");
  return {
    id: String(row.id),
    name: String(row.name || ""),
    script_id: String(row.script_id || ""),
    script_name: String(row.script_name || ""),
    source_id: row.source_id ? String(row.source_id) : "",
    status: String(row.status || "active"),
    created_by: row.created_by ? String(row.created_by) : "",
    created_at: Number(row.created_at) || 0,
  };
}

async function handleCallsScriptsList(request, env) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const scriptsRes = await db
    .prepare(`
      SELECT id, name, description, created_by, created_at, is_active
      FROM call_scripts
      ORDER BY created_at DESC
    `)
    .run();
  const scripts = scriptsRes.results || [];
  const out = [];
  for (const s of scripts) {
    const stagesRes = await db
      .prepare(`
        SELECT id, script_id, order_index, code, name, goal, script_text, tip, whatsapp_template, is_terminal
        FROM call_script_stages
        WHERE script_id = ?
        ORDER BY order_index ASC
      `)
      .bind(String(s.id))
      .run();
    out.push({
      id: String(s.id),
      name: String(s.name || ""),
      description: s.description ? String(s.description) : "",
      created_by: s.created_by ? String(s.created_by) : "",
      created_at: Number(s.created_at) || 0,
      is_active: Number(s.is_active) !== 0,
      stages: (stagesRes.results || []).map((st) => ({
        id: String(st.id),
        script_id: String(st.script_id),
        order_index: Number(st.order_index) || 0,
        code: String(st.code || ""),
        name: String(st.name || ""),
        goal: st.goal ? String(st.goal) : "",
        script_text: String(st.script_text || ""),
        tip: st.tip ? String(st.tip) : "",
        whatsapp_template: st.whatsapp_template ? String(st.whatsapp_template) : "",
        is_terminal: Number(st.is_terminal) !== 0,
      })),
    });
  }
  return { ok: true, scripts: out };
}

async function handleCallsScriptsGet(request, env, scriptId) {
  const script = await d1GetScript(env, scriptId);
  return { ok: true, script };
}

async function handleCallsScriptsCreate(request, env, actor) {
  requireCallsAdmin(actor);
  const body = await readRequestBodyAsJson(request);
  const name = String(body.name || "").trim();
  if (!name) throw new HttpError(400, "name обязателен");
  const id = String(body.id || makePrefixedId("script")).trim();
  const description = String(body.description || "").trim();
  const isActive = body.is_active === false ? 0 : 1;

  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  await db
    .prepare(`
      INSERT INTO call_scripts (id, name, description, created_by, created_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      name,
      description,
      actor.uid || actor.email || null,
      Math.floor(Date.now() / 1000),
      isActive,
    )
    .run();

  await d1ReplaceScriptStages(env, id, body.stages || []);
  return { ok: true, script: await d1GetScript(env, id) };
}

async function handleCallsScriptsUpdate(request, env, actor, scriptId) {
  requireCallsAdmin(actor);
  const body = await readRequestBodyAsJson(request);
  const id = String(scriptId || "").trim();
  if (!id) throw new HttpError(400, "script_id обязателен");

  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const current = await db
    .prepare(`SELECT id, name, description, is_active FROM call_scripts WHERE id = ? LIMIT 1`)
    .bind(id)
    .first();
  if (!current) throw new HttpError(404, "Скрипт не найден");

  await db
    .prepare(`
      UPDATE call_scripts
      SET name = ?, description = ?, is_active = ?
      WHERE id = ?
    `)
    .bind(
      String(body.name || current.name || "").trim() || current.name,
      body.description !== undefined ? String(body.description || "") : String(current.description || ""),
      body.is_active === undefined ? Number(current.is_active) || 1 : (body.is_active ? 1 : 0),
      id,
    )
    .run();

  if (Array.isArray(body.stages)) {
    await d1ReplaceScriptStages(env, id, body.stages);
  }
  return { ok: true, script: await d1GetScript(env, id) };
}

async function handleCallsCampaignsList(request, env) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const campaignsRes = await db
    .prepare(`
      SELECT c.id, c.name, c.script_id, c.source_id, c.created_by, c.created_at, c.status, s.name AS script_name
      FROM call_campaigns c
      LEFT JOIN call_scripts s ON s.id = c.script_id
      ORDER BY c.created_at DESC
    `)
    .run();
  const campaigns = campaignsRes.results || [];
  const out = [];
  for (const row of campaigns) {
    const funnel = await d1CampaignFunnel(env, row.id);
    out.push({
      id: String(row.id),
      name: String(row.name || ""),
      script_id: String(row.script_id || ""),
      script_name: String(row.script_name || ""),
      source_id: row.source_id ? String(row.source_id) : "",
      created_by: row.created_by ? String(row.created_by) : "",
      created_at: Number(row.created_at) || 0,
      status: String(row.status || "active"),
      stats: funnel,
    });
  }
  return { ok: true, campaigns: out };
}

async function handleCallsCampaignCreate(request, env, actor) {
  requireCallsAdmin(actor);
  const body = await readRequestBodyAsJson(request);
  const name = String(body.name || "").trim();
  const scriptId = String(body.script_id || "").trim();
  if (!name) throw new HttpError(400, "name обязателен");
  if (!scriptId) throw new HttpError(400, "script_id обязателен");

  const id = String(body.id || makePrefixedId("cmp")).trim();
  const status = String(body.status || "active").trim() || "active";
  const sourceId = String(body.source_id || "").trim() || null;

  await ensureD1Schema(env);
  const db = requireStoreDb(env);

  const script = await db.prepare("SELECT id FROM call_scripts WHERE id = ? LIMIT 1").bind(scriptId).first();
  if (!script) throw new HttpError(400, "Указанный script_id не найден");

  await db
    .prepare(`
      INSERT INTO call_campaigns (id, name, script_id, source_id, created_by, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      name,
      scriptId,
      sourceId,
      actor.uid || actor.email || null,
      Math.floor(Date.now() / 1000),
      status,
    )
    .run();

  return { ok: true, campaign: await d1EnsureCampaignExists(env, id) };
}

async function upsertCustomerForCampaignImport(env, row, sourceId) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const m = await getCustomerFieldMap(env);
  const phoneRaw = String(row.phone || "").trim();
  const phoneDigits = digitsOnly(phoneRaw);
  if (!phoneDigits) throw new HttpError(400, `У контакта "${row.name || "без имени"}" нет валидного телефона`);

  let existing = null;
  if (m.phoneDigits) {
    existing = await db
      .prepare(`SELECT * FROM customers WHERE ${m.phoneDigits} = ? LIMIT 1`)
      .bind(phoneDigits)
      .first();
  }
  if (!existing && m.phone) {
    existing = await db
      .prepare(`SELECT * FROM customers WHERE ${m.phone} = ? LIMIT 1`)
      .bind(phoneRaw)
      .first();
  }
  if (existing) {
    return { customerId: String(existing[m.id]), created: false };
  }

  const customerId = makePrefixedId("cust");
  const now = Date.now();
  const values = {};
  values[m.id] = customerId;
  values[m.name] = String(row.name || "").trim() || "Без имени";
  if (m.phone) values[m.phone] = phoneRaw || `+${phoneDigits}`;
  if (m.phoneDigits) values[m.phoneDigits] = phoneDigits;
  if (m.businessType) values[m.businessType] = String(row.business_type || "").trim();
  if (m.notes) values[m.notes] = String(row.notes || "").trim();
  if (m.sourceId && sourceId) values[m.sourceId] = sourceId;
  if (m.createdAt) values[m.createdAt] = now;
  if (m.updatedAt) values[m.updatedAt] = now;

  const cols = Object.keys(values);
  const placeholders = cols.map(() => "?").join(", ");
  const bindValues = cols.map((c) => values[c]);
  await db
    .prepare(`INSERT INTO customers (${cols.join(", ")}) VALUES (${placeholders})`)
    .bind(...bindValues)
    .run();

  return { customerId, created: true };
}

async function handleCallsCampaignImport(request, env, actor, campaignId) {
  requireCallsAdmin(actor);
  const campaign = await d1EnsureCampaignExists(env, campaignId);

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file.text !== "function") {
    throw new HttpError(400, "Нужно передать файл в multipart поле `file`");
  }
  const csv = await file.text();
  const rows = parseCsvText(csv);
  if (rows.length === 0) return { ok: true, imported: 0, created_customers: 0, assigned: 0 };

  const callerId = String(form.get("caller_id") || actor.uid || "").trim();
  if (!callerId) throw new HttpError(400, "caller_id обязателен для создания assignments");

  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  let createdCustomers = 0;
  let assigned = 0;

  for (const row of rows) {
    const upsert = await upsertCustomerForCampaignImport(env, row, campaign.source_id || null);
    if (upsert.created) createdCustomers += 1;
    const assignmentId = makePrefixedId("asg");
    await db
      .prepare(`
        INSERT INTO call_assignments (id, campaign_id, customer_id, caller_id, status)
        VALUES (?, ?, ?, ?, 'pending')
        ON CONFLICT(campaign_id, customer_id) DO UPDATE SET
          caller_id = excluded.caller_id
      `)
      .bind(
        assignmentId,
        campaign.id,
        upsert.customerId,
        callerId,
      )
      .run();
    assigned += 1;
  }

  return {
    ok: true,
    imported: rows.length,
    created_customers: createdCustomers,
    assigned,
    campaign_id: campaign.id,
    caller_id: callerId,
  };
}

async function handleCallsCampaignAssign(request, env, actor, campaignId) {
  requireCallsAdmin(actor);
  const body = await readRequestBodyAsJson(request);
  const callerId = String(body.caller_id || "").trim();
  const customerIds = Array.isArray(body.customer_ids) ? body.customer_ids.map((x) => String(x || "").trim()).filter(Boolean) : [];
  if (!callerId) throw new HttpError(400, "caller_id обязателен");
  if (customerIds.length === 0) throw new HttpError(400, "customer_ids обязателен");

  await d1EnsureCampaignExists(env, campaignId);
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  let updated = 0;
  for (const customerId of customerIds) {
    await db
      .prepare(`
        UPDATE call_assignments
        SET caller_id = ?, status = CASE WHEN status = 'done' THEN status ELSE 'pending' END
        WHERE campaign_id = ? AND customer_id = ?
      `)
      .bind(callerId, String(campaignId), customerId)
      .run();
    updated += 1;
  }
  return { ok: true, updated, caller_id: callerId };
}

async function handleCallsCampaignDetail(request, env, campaignId, url) {
  const campaign = await d1EnsureCampaignExists(env, campaignId);
  const script = await d1GetScript(env, campaign.script_id);
  const funnel = await d1CampaignFunnel(env, campaign.id);

  const callerIdRaw = String(url.searchParams.get("caller_id") || "").trim();
  const callerId = callerIdRaw && callerIdRaw !== "all" ? callerIdRaw : "";
  const outcome = String(url.searchParams.get("outcome") || "").trim();
  const dateFrom = parseTs(url.searchParams.get("date_from"));
  const dateTo = parseTs(url.searchParams.get("date_to"));
  const contacts = await d1CampaignContacts(env, campaign.id, {
    callerId,
    outcome,
    dateFrom,
    dateTo,
  });

  const callers = [...new Set(contacts.map((x) => x.caller_id).filter(Boolean))]
    .map((id) => ({ id, name: id }));
  const outcomes = [...(await d1GetOutcomeMap(env)).values()];

  return {
    ok: true,
    campaign,
    script: {
      id: script.id,
      name: script.name,
      stages_count: script.stages.length,
    },
    funnel,
    contacts,
    callers,
    outcomes,
  };
}

async function handleCallsCampaignFunnel(request, env, campaignId) {
  await d1EnsureCampaignExists(env, campaignId);
  const funnel = await d1CampaignFunnel(env, campaignId);
  return { ok: true, campaign_id: String(campaignId), funnel };
}

async function handleCallsQueue(request, env, actor, url) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const customerMap = await getCustomerFieldMap(env);

  const callerParam = String(url.searchParams.get("caller_id") || "me").trim();
  const callerId = callerParam === "me" ? String(actor.uid || "") : callerParam;
  if (!callerId) throw new HttpError(400, "caller_id не определён");

  const status = String(url.searchParams.get("status") || "pending").trim() || "pending";
  const campaignId = String(url.searchParams.get("campaign_id") || "").trim();
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit")) || 10, 100));

  const where = ["a.caller_id = ?"];
  const binds = [callerId];
  if (status !== "all") {
    where.push("a.status = ?");
    binds.push(status);
  }
  if (campaignId) {
    where.push("a.campaign_id = ?");
    binds.push(campaignId);
  }

  const res = await db
    .prepare(`
      SELECT a.id AS assignment_id, a.campaign_id, a.customer_id, a.caller_id, a.status, c.name AS campaign_name, c.script_id, c.status AS campaign_status, cu.*
      FROM call_assignments a
      LEFT JOIN call_campaigns c ON c.id = a.campaign_id
      LEFT JOIN customers cu ON cu.id = a.customer_id
      WHERE ${where.join(" AND ")}
      ORDER BY a.rowid ASC
      LIMIT ?
    `)
    .bind(...binds, limit)
    .run();
  const rows = res.results || [];

  const out = rows.map((row) => ({
    assignment_id: String(row.assignment_id || ""),
    campaign_id: String(row.campaign_id || ""),
    campaign_name: String(row.campaign_name || ""),
    campaign_status: String(row.campaign_status || ""),
    script_id: String(row.script_id || ""),
    customer_id: String(row.customer_id || ""),
    caller_id: String(row.caller_id || ""),
    status: String(row.status || "pending"),
    customer: mapCustomerRow(row, customerMap),
  }));

  return {
    ok: true,
    caller_id: callerId,
    total: out.length,
    queue: out,
  };
}

async function handleCallsQueueItem(request, env, assignmentId) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const customerMap = await getCustomerFieldMap(env);
  const id = String(assignmentId || "").trim();

  const row = await db
    .prepare(`
      SELECT a.id AS assignment_id, a.campaign_id, a.customer_id, a.caller_id, a.status,
             c.name AS campaign_name, c.script_id, c.status AS campaign_status, c.source_id,
             cu.*
      FROM call_assignments a
      LEFT JOIN call_campaigns c ON c.id = a.campaign_id
      LEFT JOIN customers cu ON cu.id = a.customer_id
      WHERE a.id = ?
      LIMIT 1
    `)
    .bind(id)
    .first();
  if (!row) throw new HttpError(404, "Assignment не найден");

  const script = await d1GetScript(env, row.script_id);
  const logsRes = await db
    .prepare(`
      SELECT id, campaign_id, customer_id, caller_id, started_at, ended_at, final_stage_code, outcome, meeting_at, notes, duration_seconds
      FROM call_logs
      WHERE customer_id = ?
      ORDER BY COALESCE(ended_at, started_at, 0) DESC
      LIMIT 30
    `)
    .bind(String(row.customer_id || ""))
    .run();
  const outcomesMap = await d1GetOutcomeMap(env);

  return {
    ok: true,
    assignment: {
      assignment_id: String(row.assignment_id || ""),
      campaign_id: String(row.campaign_id || ""),
      campaign_name: String(row.campaign_name || ""),
      campaign_status: String(row.campaign_status || ""),
      script_id: String(row.script_id || ""),
      source_id: row.source_id ? String(row.source_id) : "",
      customer_id: String(row.customer_id || ""),
      caller_id: String(row.caller_id || ""),
      status: String(row.status || "pending"),
      customer: mapCustomerRow(row, customerMap),
    },
    script,
    previous_logs: (logsRes.results || []).map((r) => ({
      id: String(r.id),
      campaign_id: String(r.campaign_id || ""),
      customer_id: String(r.customer_id || ""),
      caller_id: String(r.caller_id || ""),
      started_at: Number(r.started_at) || 0,
      ended_at: Number(r.ended_at) || null,
      final_stage_code: r.final_stage_code ? String(r.final_stage_code) : "",
      outcome: r.outcome ? String(r.outcome) : "",
      meeting_at: parseTs(r.meeting_at),
      notes: r.notes ? String(r.notes) : "",
      duration_seconds: Number(r.duration_seconds) || 0,
    })),
    outcomes: [...outcomesMap.values()],
  };
}

async function handleCallsLogsStart(request, env, actor) {
  const body = await readRequestBodyAsJson(request);
  const campaignId = String(body.campaign_id || "").trim();
  const customerId = String(body.customer_id || "").trim();
  if (!campaignId || !customerId) throw new HttpError(400, "campaign_id и customer_id обязательны");
  const startedAt = parseTs(body.started_at) || Date.now();

  await d1EnsureCampaignExists(env, campaignId);
  await ensureD1Schema(env);
  const db = requireStoreDb(env);

  const assignment = await db
    .prepare(`
      SELECT id, caller_id
      FROM call_assignments
      WHERE campaign_id = ? AND customer_id = ?
      LIMIT 1
    `)
    .bind(campaignId, customerId)
    .first();
  if (!assignment) throw new HttpError(404, "Assignment для campaign/customer не найден");
  if (String(assignment.caller_id || "") !== String(actor.uid || "") && !canManageCalls(actor)) {
    throw new HttpError(403, "Нельзя стартовать звонок не для своей очереди");
  }

  const logId = String(body.id || makePrefixedId("call")).trim();
  await db
    .prepare(`
      INSERT INTO call_logs (
        id, campaign_id, customer_id, caller_id, started_at, ended_at, final_stage_code, outcome, meeting_at, notes, duration_seconds
      )
      VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, NULL)
    `)
    .bind(
      logId,
      campaignId,
      customerId,
      String(actor.uid || assignment.caller_id),
      startedAt,
      String(body.notes || ""),
    )
    .run();

  await db
    .prepare(`
      UPDATE call_assignments
      SET status = 'in_progress'
      WHERE campaign_id = ? AND customer_id = ?
    `)
    .bind(campaignId, customerId)
    .run();

  return { ok: true, log_id: logId, started_at: startedAt };
}

async function handleCallsLogsPatch(request, env, actor, logId) {
  const body = await readRequestBodyAsJson(request);
  const id = String(logId || "").trim();
  if (!id) throw new HttpError(400, "log_id обязателен");

  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const current = await db
    .prepare(`
      SELECT id, campaign_id, customer_id, caller_id, started_at, ended_at, final_stage_code, outcome, meeting_at, notes, duration_seconds
      FROM call_logs
      WHERE id = ?
      LIMIT 1
    `)
    .bind(id)
    .first();
  if (!current) throw new HttpError(404, "Call log не найден");
  if (String(current.caller_id || "") !== String(actor.uid || "") && !canManageCalls(actor)) {
    throw new HttpError(403, "Нельзя редактировать чужой call log");
  }

  const finalStageCode = body.final_stage_code !== undefined
    ? parseStageCode(body.final_stage_code)
    : String(current.final_stage_code || "");
  const outcome = body.outcome !== undefined
    ? await d1ValidateOutcome(env, body.outcome)
    : (current.outcome ? String(current.outcome) : null);
  const meetingAt = body.meeting_at !== undefined ? parseTs(body.meeting_at) : parseTs(current.meeting_at);
  const notes = body.notes !== undefined ? String(body.notes || "") : String(current.notes || "");
  const durationSeconds = body.duration_seconds !== undefined
    ? Math.max(0, Math.round(Number(body.duration_seconds) || 0))
    : (Number(current.duration_seconds) || null);
  const endedAt = body.ended_at !== undefined
    ? parseTs(body.ended_at)
    : (outcome ? (parseTs(current.ended_at) || Date.now()) : parseTs(current.ended_at));

  await db
    .prepare(`
      UPDATE call_logs
      SET ended_at = ?, final_stage_code = ?, outcome = ?, meeting_at = ?, notes = ?, duration_seconds = ?
      WHERE id = ?
    `)
    .bind(
      endedAt,
      finalStageCode || null,
      outcome || null,
      meetingAt,
      notes,
      durationSeconds,
      id,
    )
    .run();

  if (outcome) {
    const status = outcome === "callback" ? "pending" : "done";
    await db
      .prepare(`
        UPDATE call_assignments
        SET status = ?
        WHERE campaign_id = ? AND customer_id = ?
      `)
      .bind(status, String(current.campaign_id || ""), String(current.customer_id || ""))
      .run();
  }

  return {
    ok: true,
    log: {
      id,
      campaign_id: String(current.campaign_id || ""),
      customer_id: String(current.customer_id || ""),
      caller_id: String(current.caller_id || ""),
      started_at: Number(current.started_at) || 0,
      ended_at: endedAt,
      final_stage_code: finalStageCode || "",
      outcome: outcome || "",
      meeting_at: meetingAt,
      notes,
      duration_seconds: durationSeconds || 0,
    },
  };
}

async function handleCallsLogWhatsapp(request, env, actor, logId) {
  const body = await readRequestBodyAsJson(request);
  const id = String(logId || "").trim();
  if (!id) throw new HttpError(400, "log_id обязателен");

  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const customerMap = await getCustomerFieldMap(env);

  const row = await db
    .prepare(`
      SELECT l.id, l.campaign_id, l.customer_id, l.caller_id, l.final_stage_code, l.meeting_at,
             c.script_id, c.name AS campaign_name, cu.*
      FROM call_logs l
      LEFT JOIN call_campaigns c ON c.id = l.campaign_id
      LEFT JOIN customers cu ON cu.id = l.customer_id
      WHERE l.id = ?
      LIMIT 1
    `)
    .bind(id)
    .first();
  if (!row) throw new HttpError(404, "Call log не найден");
  if (String(row.caller_id || "") !== String(actor.uid || "") && !canManageCalls(actor)) {
    throw new HttpError(403, "Нельзя генерировать WhatsApp текст для чужого call log");
  }

  let template = String(body.template_override || "").trim();
  if (!template) {
    const stageCode = parseStageCode(body.stage_code || row.final_stage_code || "");
    if (!stageCode) throw new HttpError(400, "Укажи stage_code или заверши звонок с final_stage_code");
    const st = await db
      .prepare(`
        SELECT whatsapp_template
        FROM call_script_stages
        WHERE script_id = ? AND code = ?
        LIMIT 1
      `)
      .bind(String(row.script_id || ""), stageCode)
      .first();
    template = String(st?.whatsapp_template || "").trim();
  }
  if (!template) throw new HttpError(400, "Для этой стадии нет whatsapp_template");

  const customer = mapCustomerRow(row, customerMap);
  const meetingTs = parseTs(body.meeting_at) || parseTs(row.meeting_at);
  const vars = {
    customer_name: customer?.name || "клиент",
    caller_name: String(body.caller_name || actor.user?.name || actor.email || "менеджер"),
    meeting_date: safeDateForTemplate(meetingTs),
    meeting_time: safeTimeForTemplate(meetingTs),
  };
  const rendered = applyTemplate(template, vars);
  const waPhone = digitsOnly(customer?.phone || customer?.phone_digits || "");
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(rendered)}`
    : `https://wa.me/?text=${encodeURIComponent(rendered)}`;

  return {
    ok: true,
    rendered_text: rendered,
    wa_url: waUrl,
    variables: vars,
  };
}

async function routeCallsApi(request, env, actor, path, url) {
  const scriptsIdMatch = path.match(/^\/api\/crm\/calls\/scripts\/([^/]+)$/);
  const campaignsIdMatch = path.match(/^\/api\/crm\/calls\/campaigns\/([^/]+)$/);
  const campaignsFunnelMatch = path.match(/^\/api\/crm\/calls\/campaigns\/([^/]+)\/funnel$/);
  const campaignsImportMatch = path.match(/^\/api\/crm\/calls\/campaigns\/([^/]+)\/import$/);
  const campaignsAssignMatch = path.match(/^\/api\/crm\/calls\/campaigns\/([^/]+)\/assign$/);
  const queueItemMatch = path.match(/^\/api\/crm\/calls\/queue\/([^/]+)$/);
  const logPatchMatch = path.match(/^\/api\/crm\/calls\/logs\/([^/]+)$/);
  const logWaMatch = path.match(/^\/api\/crm\/calls\/logs\/([^/]+)\/whatsapp$/);

  if (request.method === "GET" && path === "/api/crm/calls/scripts") {
    return handleCallsScriptsList(request, env);
  }
  if (request.method === "GET" && scriptsIdMatch) {
    return handleCallsScriptsGet(request, env, decodeURIComponent(scriptsIdMatch[1]));
  }
  if (request.method === "POST" && path === "/api/crm/calls/scripts") {
    return handleCallsScriptsCreate(request, env, actor);
  }
  if (request.method === "PUT" && scriptsIdMatch) {
    return handleCallsScriptsUpdate(request, env, actor, decodeURIComponent(scriptsIdMatch[1]));
  }

  if (request.method === "GET" && path === "/api/crm/calls/campaigns") {
    return handleCallsCampaignsList(request, env);
  }
  if (request.method === "GET" && campaignsIdMatch) {
    return handleCallsCampaignDetail(request, env, decodeURIComponent(campaignsIdMatch[1]), url);
  }
  if (request.method === "GET" && campaignsFunnelMatch) {
    return handleCallsCampaignFunnel(request, env, decodeURIComponent(campaignsFunnelMatch[1]));
  }
  if (request.method === "POST" && path === "/api/crm/calls/campaigns") {
    return handleCallsCampaignCreate(request, env, actor);
  }
  if (request.method === "POST" && campaignsImportMatch) {
    return handleCallsCampaignImport(request, env, actor, decodeURIComponent(campaignsImportMatch[1]));
  }
  if (request.method === "POST" && campaignsAssignMatch) {
    return handleCallsCampaignAssign(request, env, actor, decodeURIComponent(campaignsAssignMatch[1]));
  }

  if (request.method === "GET" && path === "/api/crm/calls/queue") {
    return handleCallsQueue(request, env, actor, url);
  }
  if (request.method === "GET" && queueItemMatch) {
    return handleCallsQueueItem(request, env, decodeURIComponent(queueItemMatch[1]));
  }

  if (request.method === "POST" && path === "/api/crm/calls/logs") {
    return handleCallsLogsStart(request, env, actor);
  }
  if (request.method === "PATCH" && logPatchMatch) {
    return handleCallsLogsPatch(request, env, actor, decodeURIComponent(logPatchMatch[1]));
  }
  if (request.method === "POST" && logWaMatch) {
    return handleCallsLogWhatsapp(request, env, actor, decodeURIComponent(logWaMatch[1]));
  }

  return null;
}

async function handleMe(request, env, actor) {
  if (!actor?.email) return { ok: true, authPresent: false };
  const fresh = await d1GetUserByEmail(env, actor.email);
  const user = fresh || actor.user || null;
  return {
    ok: true,
    authPresent: true,
    user: user ? publicUserPayload(user) : null,
    claims: actor?.claims || null,
  };
}

async function health(env) {
  const out = {
    ok: true,
    ts: Date.now(),
    env: {
      hasD1: Boolean(env.DB || env.pllato_crm_store),
      hasJwtSecret: Boolean(env.JWT_SECRET),
      hasGoogleClientId: Boolean(env.GOOGLE_CLIENT_ID),
    },
  };
  try {
    await ensureD1Schema(env);
    out.schema = { ok: true };
  } catch (e) {
    out.schema = {
      ok: false,
      error: e?.message || String(e),
      details: e?.details || null,
    };
  }
  return out;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const channelSecretMatch = path.match(/^\/channels\/secret\/([^/]+)$/);

    try {
      if (request.method === "GET" && (path === "/health" || path === "/api/health")) {
        return json(request, env, await health(env));
      }
      if (request.method === "POST" && path === "/auth/google") {
        return json(request, env, await handleAuthGoogle(request, env));
      }
      if (request.method === "POST" && path === "/api/auth/email-login") {
        return json(request, env, await handleAuthEmailLogin(request, env));
      }
      if (request.method === "GET" && path === "/api/auth/has-any-passwords") {
        return json(request, env, await handleAuthHasAnyPasswords(request, env));
      }
      if (request.method === "POST" && path === "/api/auth/set-password") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleAuthSetPassword(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/auth/change-password") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleAuthChangePassword(request, env, actor));
      }
      if (request.method === "GET" && (path === "/me" || path === "/api/me")) {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleMe(request, env, actor));
      }

      if (request.method === "GET" && path === "/users/list") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleUsersList(request, env, actor));
      }

      if (request.method === "POST" && path === "/users/save") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleUsersSave(request, env, actor));
      }

      if (request.method === "POST" && path === "/users/delete") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleUsersDelete(request, env, actor));
      }

      if (path.startsWith("/api/crm/calls")) {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        const routed = await routeCallsApi(request, env, actor, path, url);
        if (routed) return json(request, env, routed);
      }

      if (request.method === "POST" && path === "/binotel/webhook") {
        return json(request, env, await handleBinotelWebhook(request, env));
      }

      if (request.method === "POST" && path === "/wa/webhook") {
        return json(request, env, await handleWaWebhook(request, env));
      }

      if ((request.method === "GET" || request.method === "POST") && path === "/channels/list") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleChannelsList(request, env, actor, url));
      }

      if (request.method === "GET" && channelSecretMatch) {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleChannelsSecret(env, actor, decodeURIComponent(channelSecretMatch[1])));
      }

      if (request.method === "POST" && (path === "/channels/save" || path === "/channels/upsert")) {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleChannelsUpsert(request, env, actor));
      }

      if (request.method === "POST" && path === "/channels/delete") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleChannelsDelete(request, env, actor));
      }

      if (request.method === "POST" && path === "/store/pull") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleStorePull(request, env, actor));
      }

      if (request.method === "POST" && path === "/store/push") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleStorePush(request, env, actor));
      }

      if (request.method === "POST" && path === "/binotel/call") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleBinotelCall(request, env, actor));
      }

      if (request.method === "GET" && path === "/binotel/history") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleBinotelHistory(request, env, actor, url));
      }

      if (request.method === "POST" && path === "/binotel/recording") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleBinotelRecording(request, env, actor));
      }

      if (request.method === "POST" && path === "/wa/send") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleWaSend(request, env, actor));
      }

      if (request.method === "POST" && path === "/email/send") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleEmailSend(request, env, actor));
      }

      return fail(request, env, 404, "Not found", { path, method: request.method });
    } catch (e) {
      if (e instanceof HttpError) return fail(request, env, e.status, e.message, e.details);
      console.error("worker error:", e);
      return fail(request, env, 500, "Internal error", String(e?.message || e));
    }
  },
};
