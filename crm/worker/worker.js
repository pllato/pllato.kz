import { connect } from "cloudflare:sockets";
import { ODataClient, ODataError } from "./integrations/1c/odata-client.js";
import { encryptPassword, decryptPassword } from "./integrations/1c/crypto.js";
import {
  contractorFromOData,
  contractorToOData,
  productFromOData,
  contractFromOData,
  organizationFromOData,
  invoiceToOData,
  invoiceFromOData,
} from "./integrations/1c/mapper.js";

const ROOT_SUPER_ADMIN = "uurraa@gmail.com";
const APP_ID = "pllato_crm";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const JWT_ISSUER = "pllato-crm";
const JWT_TTL_SECONDS = 7 * 24 * 60 * 60;
const TEAM_ID = "pllato";
const STORE_COLLECTION_RE = /^[a-z0-9_]{1,64}$/;
const DEFAULT_STORE_PULL_LIMIT = 5000;
const MAX_STORE_OPS = 500;
const PRIVATE_PROJECT_FINANCE_COLLECTION = "_project_finance_private";
const PRIVATE_PROJECT_FINANCE_ID = "global";
const BUILD_ID = "2026-07-24-project-finance-week-end-labels-v1";

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
  if (o === "https://aminamed-crm.pages.dev") return true;
  if (o === "https://crm.aminamed.kz") return true;
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
  // Членство в команде = доступ в портал. Видимость отдельных приложений
  // решается по user.apps на фронте, поэтому здесь по плиткам не гейтим.

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
        crm_access      TEXT NOT NULL DEFAULT '{}',
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
    `
      CREATE TABLE IF NOT EXISTS field_tg_notifications (
        deal_id     TEXT PRIMARY KEY,
        notified_at INTEGER NOT NULL
      )
    `,
    // ─── 1С:Фреш OData integration (migration 005) ──────────────────────
    `
      CREATE TABLE IF NOT EXISTS one_c_settings (
        tenant_id                 TEXT PRIMARY KEY,
        host                      TEXT NOT NULL,
        base_path                 TEXT NOT NULL,
        odata_username            TEXT NOT NULL,
        odata_password_encrypted  TEXT NOT NULL,
        config_type               TEXT,
        config_version            TEXT,
        enabled                   INTEGER NOT NULL DEFAULT 1,
        last_sync_at              INTEGER,
        last_test_at              INTEGER,
        last_test_ok              INTEGER,
        last_test_error           TEXT,
        created_at                INTEGER NOT NULL,
        updated_at                INTEGER NOT NULL
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS one_c_id_map (
        tenant_id           TEXT NOT NULL,
        entity_type         TEXT NOT NULL,
        pllato_id           TEXT NOT NULL,
        one_c_ref_key       TEXT NOT NULL,
        one_c_data_version  TEXT,
        synced_at           INTEGER NOT NULL,
        PRIMARY KEY (tenant_id, entity_type, pllato_id)
      )
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_one_c_id_map_ref
        ON one_c_id_map(tenant_id, entity_type, one_c_ref_key)
    `,
    `
      CREATE TABLE IF NOT EXISTS one_c_sync_log (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id         TEXT NOT NULL,
        ts                INTEGER NOT NULL,
        direction         TEXT NOT NULL,
        entity_type       TEXT NOT NULL,
        operation         TEXT NOT NULL,
        status            TEXT NOT NULL,
        http_status       INTEGER,
        error_code        TEXT,
        error_message     TEXT,
        records_processed INTEGER,
        duration_ms       INTEGER
      )
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_one_c_sync_log_tenant_ts
        ON one_c_sync_log(tenant_id, ts DESC)
    `,
    // Зеркало номенклатуры 1С — справочник прайс-листов читает его БЕЗ захода в 1С.
    // Живой OData нужен только чтобы обновить зеркало («Обновить из 1С»). Ключ позиции
    // в карте цен прайса = "<base>:<ref_key>", поэтому base входит в первичный ключ.
    `
      CREATE TABLE IF NOT EXISTS nomenclature_mirror (
        team_id      TEXT NOT NULL,
        base         TEXT NOT NULL,
        ref_key      TEXT NOT NULL,
        code         TEXT,
        name         TEXT,
        article      TEXT,
        unit         TEXT,
        vat_rate_ref TEXT,
        updated_at   INTEGER NOT NULL,
        PRIMARY KEY (team_id, base, ref_key)
      )
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_nomen_mirror_base
        ON nomenclature_mirror(team_id, base)
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
  await safeAlter("ALTER TABLE users ADD COLUMN crm_access TEXT NOT NULL DEFAULT '{}'");
  await safeAlter("ALTER TABLE users ADD COLUMN created_by TEXT");
  await safeAlter("ALTER TABLE users ADD COLUMN role_id TEXT");

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

async function d1ListCollection(env, collection, limit = DEFAULT_STORE_PULL_LIMIT, updatedSince = null) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const cappedLimit = Math.max(1, Math.min(Number(limit) || DEFAULT_STORE_PULL_LIMIT, 10000));
  const sinceTs = (updatedSince != null && Number.isFinite(Number(updatedSince)) && Number(updatedSince) > 0)
    ? Number(updatedSince) : null;
  const res = sinceTs != null
    ? await db.prepare(`SELECT data FROM store WHERE team_id=? AND collection=? AND updated_at>? ORDER BY updated_at DESC LIMIT ?`).bind(TEAM_ID, collection, sinceTs, cappedLimit).run()
    : await db.prepare(`SELECT data FROM store WHERE team_id=? AND collection=? ORDER BY updated_at DESC LIMIT ?`).bind(TEAM_ID, collection, cappedLimit).run();
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
  const updatedSince = body.updatedSince != null ? Number(body.updatedSince) : null;
  if (collections.length === 0) {
    throw new HttpError(400, "Передай массив collections для pull");
  }
  if (collections.includes(PRIVATE_PROJECT_FINANCE_COLLECTION) && !canAccessProjectFinance(actor)) {
    throw new HttpError(403, "Финансы проектов доступны только Super Admin");
  }

  const data = {};
  for (const collection of collections) {
    data[collection] = await d1ListCollection(env, collection, limit, updatedSince);
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
  const fieldDealsToNotify = []; // собираем — пошлём после всех upsert'ов
  for (const op of ops) {
    if (!isObject(op)) continue;
    const collection = normalizeCollectionName(op.collection);
    if (collection === PRIVATE_PROJECT_FINANCE_COLLECTION && !canAccessProjectFinance(actor)) {
      throw new HttpError(403, "Финансы проектов доступны только Super Admin");
    }
    const type = String(op.type || "").toLowerCase();
    if (type === "upsert") {
      // FIX: pipelines не синхронизируются между клиентами — у каждого
      // ensurePipelinesInitialized() свой seed с уникальными id. Field-юзер
      // отправляет deal с локальным pipelineId, который у админа отсутствует
      // → сделка невидима в его воронке. Подменяем pipelineId/stage на canonical
      // значения из env-переменных FIELD_PIPELINE_ID / FIELD_STAGE_ID.
      if (
        collection === "deals" &&
        isObject(op.item) &&
        String(op.item.source || "").toLowerCase() === "field" &&
        env.FIELD_PIPELINE_ID
      ) {
        const origPid = op.item.pipelineId;
        const origStage = op.item.stage;
        op.item.pipelineId = env.FIELD_PIPELINE_ID;
        if (env.FIELD_STAGE_ID) op.item.stage = env.FIELD_STAGE_ID;
        if (origPid !== op.item.pipelineId || origStage !== op.item.stage) {
          console.log(`[field-pipeline] override deal=${op.item.id} pipeline ${origPid}→${op.item.pipelineId} stage ${origStage}→${op.item.stage}`);
        }
      }
      await d1UpsertDoc(env, collection, op.item, actor.email);
      applied += 1;
      // Хук: новая полевая сделка — собираем для Telegram-уведомления.
      // Принимаем источники Field / field (case-insensitive). Раньше требовали
      // orderStatus=preliminary, но при первом push'е статус ещё может быть draft
      // (autoPromote в frontend срабатывает в порядке Store.update'ов). Достаточно
      // что сделка от поля и не завершена.
      if (
        collection === "deals" &&
        isObject(op.item) &&
        String(op.item.source || "").toLowerCase() === "field" &&
        op.item.id &&
        op.item.orderStatus !== "shipped" &&
        op.item.orderStatus !== "approved" &&
        !op.item.isDeleted
      ) {
        console.log(`[tg-notify] queue deal id=${op.item.id} status=${op.item.orderStatus || "(draft)"} title=${JSON.stringify(op.item.title || "")}`);
        fieldDealsToNotify.push(op.item);
      } else if (collection === "deals" && isObject(op.item) && String(op.item.source || "").toLowerCase() === "field") {
        // Сделка от поля но условие отсева сработало — лог для диагностики.
        console.log(`[tg-notify] SKIP deal id=${op.item.id} reason: status=${op.item.orderStatus} isDeleted=${op.item.isDeleted}`);
      }
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

  // Telegram-нотификации — AWAIT обязательно. Cloudflare Workers терминируют
  // isolate как только Response уходит клиенту; без await фоновая async-задача
  // обрывается (виделось по логам: после "[tg-notify] entry" выполнение
  // прекращалось, fetch к Telegram даже не начинался). Альтернатива — ctx.waitUntil,
  // но ctx не прокинут в handleStorePush. Задержка ~1-2 сек на /store/push приемлема.
  if (fieldDealsToNotify.length > 0) {
    try {
      await notifyFieldDealsToTelegram(env, fieldDealsToNotify);
    } catch (e) {
      console.warn("[tg-notify] failed:", e?.message || e);
    }
  }

  return {
    ok: true,
    applied,
    pushedAt: Date.now(),
    actor: actor.email || actor.uid,
  };
}

// ============================================================================
// Согласование документов (agreement) — публичный shared state без JWT.
// Используется HTML-страницами на pllato.kz/agreements/*.html для интерактивного
// согласования работ между Pllato и клиентом. Все участники видят голоса друг
// друга и комментарии в реальном времени (через polling).
// ============================================================================

async function ensureAgreementsTable(env) {
  const db = requireStoreDb(env);
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS agreements (
      id          TEXT PRIMARY KEY,
      data        TEXT NOT NULL,
      updated_at  INTEGER NOT NULL
    )
  `).run();
}

async function handleAgreementGet(env, id) {
  await ensureAgreementsTable(env);
  const db = requireStoreDb(env);
  const row = await db.prepare(`SELECT data, updated_at FROM agreements WHERE id = ?`).bind(id).first();
  if (!row) {
    return { ok: true, id, state: { votes: {}, comments: [] }, updatedAt: 0 };
  }
  let state;
  try { state = JSON.parse(row.data); } catch { state = { votes: {}, comments: [] }; }
  return { ok: true, id, state, updatedAt: Number(row.updated_at) || 0 };
}

async function handleAgreementPost(env, id, request) {
  await ensureAgreementsTable(env);
  const body = await readRequestBodyAsJson(request);
  const event = body?.event;
  if (!event || typeof event !== "object") {
    throw new HttpError(400, "Поле 'event' обязательно");
  }
  const user = String(event.user || "").trim().toLowerCase();
  if (!user || !["karlygash", "asem", "pllato", "alla", "aikyn", "manager", "warehouse", "guest"].includes(user)) {
    throw new HttpError(400, "Неизвестный пользователь");
  }

  const db = requireStoreDb(env);
  // Загружаем текущее состояние
  const row = await db.prepare(`SELECT data FROM agreements WHERE id = ?`).bind(id).first();
  let state;
  try { state = row ? JSON.parse(row.data) : { votes: {}, comments: [] }; }
  catch { state = { votes: {}, comments: [] }; }
  if (!state.votes || typeof state.votes !== "object") state.votes = {};
  if (!Array.isArray(state.comments)) state.comments = [];
  if (!Array.isArray(state.customItems)) state.customItems = [];

  // Обрабатываем событие
  const now = Date.now();
  if (event.type === "addItem") {
    const sectionNum = String(event.sectionNum || "").trim();
    const name = String(event.name || "").trim();
    const desc = String(event.desc || "").trim();
    if (!sectionNum || !name) throw new HttpError(400, "sectionNum и name обязательны");
    if (name.length > 200) throw new HttpError(400, "Название слишком длинное");
    if (desc.length > 500) throw new HttpError(400, "Описание слишком длинное");
    // Генерируем id вида "addedN.M" где N — раздел, M — порядковый
    const sectionItems = state.customItems.filter((it) => it.sectionNum === sectionNum);
    const itemId = `${sectionNum}.add${sectionItems.length + 1}_${now.toString(36).slice(-4)}`;
    state.customItems.push({ id: itemId, sectionNum, name, desc, addedBy: user, at: now });
  } else if (event.type === "removeItem") {
    const itemId = String(event.itemId || "").trim();
    const idx = state.customItems.findIndex((it) => it.id === itemId);
    if (idx < 0) throw new HttpError(404, "Пункт не найден");
    const item = state.customItems[idx];
    // Удалить может только автор пункта или pllato
    if (item.addedBy !== user && user !== "pllato") {
      throw new HttpError(403, "Удалять может только автор пункта или Pllato");
    }
    state.customItems.splice(idx, 1);
    // Заодно подчистим голоса по этому пункту
    if (state.votes[itemId]) delete state.votes[itemId];
    state.comments = state.comments.filter((c) => c.itemId !== itemId);
  } else if (event.type === "vote") {
    const itemId = String(event.itemId || "").trim();
    const vote = String(event.vote || "").toLowerCase(); // approved | clarify | rejected | null (сброс)
    if (!itemId) throw new HttpError(400, "itemId обязателен");
    if (vote && !["approved", "clarify", "rejected"].includes(vote)) {
      throw new HttpError(400, "Неизвестный vote");
    }
    if (!state.votes[itemId]) state.votes[itemId] = {};
    if (vote) {
      state.votes[itemId][user] = { vote, at: now };
    } else {
      delete state.votes[itemId][user];
    }
  } else if (event.type === "comment") {
    const text = String(event.text || "").trim();
    const itemId = String(event.itemId || "").trim() || null;
    if (!text) throw new HttpError(400, "Пустой комментарий");
    if (text.length > 2000) throw new HttpError(400, "Комментарий слишком длинный");
    state.comments.push({ id: `c${now}_${Math.random().toString(36).slice(2, 8)}`, user, text, itemId, at: now });
    // Не храним больше 500 комментариев — отсекаем старые.
    if (state.comments.length > 500) state.comments = state.comments.slice(-500);
  } else if (event.type === "finalize") {
    state.finalized = { by: user, at: now };
  } else if (event.type === "unfinalize") {
    state.finalized = null;
  } else if (event.type === "setTaskStatus") {
    // Изменение статуса задачи онбординга: new | in_progress | done | blocked
    const itemId = String(event.itemId || "").trim();
    const status = String(event.status || "").trim();
    if (!itemId) throw new HttpError(400, "itemId обязателен");
    if (!["new", "in_progress", "done", "blocked"].includes(status)) {
      throw new HttpError(400, "Неизвестный статус");
    }
    if (!state.taskStatuses || typeof state.taskStatuses !== "object") state.taskStatuses = {};
    state.taskStatuses[itemId] = { status, user, at: now };
  } else if (event.type === "claimTask") {
    // Назначить себя ответственным за задачу
    const itemId = String(event.itemId || "").trim();
    if (!itemId) throw new HttpError(400, "itemId обязателен");
    if (!state.taskAssignees || typeof state.taskAssignees !== "object") state.taskAssignees = {};
    state.taskAssignees[itemId] = { user, at: now };
  } else if (event.type === "unclaimTask") {
    const itemId = String(event.itemId || "").trim();
    if (!itemId) throw new HttpError(400, "itemId обязателен");
    if (state.taskAssignees && state.taskAssignees[itemId]) {
      delete state.taskAssignees[itemId];
    }
  } else if (event.type === "attachLink") {
    // Прикрепить URL-ссылку к задаче (Google Drive / WhatsApp файл / Dropbox …)
    const itemId = String(event.itemId || "").trim();
    const url = String(event.url || "").trim();
    const label = String(event.label || "").trim();
    if (!itemId) throw new HttpError(400, "itemId обязателен");
    if (!url) throw new HttpError(400, "url обязателен");
    if (!/^https?:\/\//.test(url)) throw new HttpError(400, "URL должен начинаться с http(s)://");
    if (url.length > 2000) throw new HttpError(400, "URL слишком длинный");
    if (!Array.isArray(state.attachments)) state.attachments = [];
    state.attachments.push({
      id: `att_${now}_${Math.random().toString(36).slice(2, 6)}`,
      itemId, url, label: label || url, user, at: now,
    });
    if (state.attachments.length > 500) state.attachments = state.attachments.slice(-500);
  } else if (event.type === "removeAttachment") {
    const attId = String(event.attId || "").trim();
    if (!Array.isArray(state.attachments)) state.attachments = [];
    state.attachments = state.attachments.filter((a) => {
      if (a.id !== attId) return true;
      // Удалить может только автор или pllato
      return a.user !== user && user !== "pllato";
    });
  } else if (event.type === "migrate") {
    // Миграция: переименование itemId и удаление пунктов.
    // Только pllato может вызвать.
    if (user !== "pllato") throw new HttpError(403, "Только Pllato может мигрировать");
    const renames = (event.renames && typeof event.renames === "object") ? event.renames : {};
    const deletes = Array.isArray(event.deletes) ? event.deletes : [];
    const sectionRenames = (event.sectionRenames && typeof event.sectionRenames === "object") ? event.sectionRenames : {};

    // Удаляем
    for (const id of deletes) {
      delete state.votes[id];
      state.comments = state.comments.filter((c) => c.itemId !== id);
      state.customItems = state.customItems.filter((it) => it.id !== id);
    }
    // Переименовываем itemId в votes
    const newVotes = {};
    for (const [oldId, v] of Object.entries(state.votes)) {
      newVotes[renames[oldId] || oldId] = v;
    }
    state.votes = newVotes;
    // Переименовываем itemId в comments
    state.comments = state.comments.map((c) => ({
      ...c,
      itemId: c.itemId ? (renames[c.itemId] || c.itemId) : c.itemId,
    }));
    // Переименовываем sectionNum в customItems + их id
    state.customItems = state.customItems.map((it) => ({
      ...it,
      id: renames[it.id] || it.id,
      sectionNum: sectionRenames[it.sectionNum] || it.sectionNum,
    }));
  } else {
    throw new HttpError(400, `Неизвестный тип события: ${event.type}`);
  }

  // Сохраняем
  const dataStr = JSON.stringify(state);
  await db.prepare(`
    INSERT INTO agreements (id, data, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).bind(id, dataStr, now).run();

  return { ok: true, id, state, updatedAt: now };
}

// ===========================================================================
// Реестр договоров с ЭЦП (НУЦ РК / NCALayer)
// ---------------------------------------------------------------------------
// Владелец загружает договор, подписывает своей ЭЦП внутри портала, добавляет
// сотрудников-подписантов. Каждому сотруднику выдаётся персональная ссылка
// (sign.html?t=<token>) — он открывает её без логина и подписывает своей ЭЦП.
// Оригинал и CMS-подписи (CAdES, detached) хранятся в R2; метаданные — в D1.
// ===========================================================================

let contractsTablesReady = false;
async function ensureContractsTables(env) {
  if (contractsTablesReady) return;
  const db = requireStoreDb(env);
  const stmts = [
    `CREATE TABLE IF NOT EXISTS contracts (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      note        TEXT,
      file_key    TEXT NOT NULL,
      file_name   TEXT NOT NULL,
      file_mime   TEXT NOT NULL,
      file_size   INTEGER NOT NULL DEFAULT 0,
      file_hash   TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'draft',
      public_token TEXT,
      link_mode   TEXT NOT NULL DEFAULT 'universal',
      created_by  TEXT,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_contracts_updated ON contracts(updated_at DESC)`,
    `CREATE TABLE IF NOT EXISTS contract_signers (
      id             TEXT PRIMARY KEY,
      contract_id    TEXT NOT NULL,
      role           TEXT NOT NULL DEFAULT 'employee',
      full_name      TEXT NOT NULL,
      iin            TEXT,
      contact        TEXT,
      token          TEXT,
      order_index    INTEGER NOT NULL DEFAULT 0,
      status         TEXT NOT NULL DEFAULT 'pending',
      sig_key        TEXT,
      signer_cn      TEXT,
      signer_iin     TEXT,
      signer_serial  TEXT,
      signer_type    TEXT,
      requisites     TEXT,
      signed_at      INTEGER,
      signed_ip      TEXT,
      decline_reason TEXT,
      created_at     INTEGER NOT NULL,
      updated_at     INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_contract_signers_contract ON contract_signers(contract_id)`,
    `CREATE INDEX IF NOT EXISTS idx_contract_signers_token ON contract_signers(token)`,
  ];
  for (const s of stmts) await db.prepare(s).run();
  // Миграция для ранее созданных таблиц: добавить недостающие колонки (SQLite без IF NOT EXISTS).
  for (const col of ["signer_type TEXT", "requisites TEXT"]) {
    try { await db.prepare(`ALTER TABLE contract_signers ADD COLUMN ${col}`).run(); }
    catch (_e) { /* колонка уже есть */ }
  }
  try { await db.prepare(`ALTER TABLE contracts ADD COLUMN public_token TEXT`).run(); }
  catch (_e) { /* колонка уже есть */ }
  try { await db.prepare(`ALTER TABLE contracts ADD COLUMN link_mode TEXT NOT NULL DEFAULT 'universal'`).run(); }
  catch (_e) { /* колонка уже есть */ }
  try { await db.prepare(`CREATE INDEX IF NOT EXISTS idx_contracts_public_token ON contracts(public_token)`).run(); }
  catch (_e) { /* индекс уже есть */ }
  contractsTablesReady = true;
}

const REQUISITE_FIELDS = ["name", "iinBin", "idNumber", "idDate", "address", "contact", "bank", "iban"];

// Нормализовать реквизиты подписанта в безопасный объект (ИП или физлицо).
function normalizeRequisites(input, signerType) {
  const type = signerType === "ip" ? "ip" : signerType === "individual" ? "individual" : "";
  if (!input || typeof input !== "object") return { type, data: null };
  const data = {};
  for (const f of REQUISITE_FIELDS) {
    const v = String(input[f] ?? "").trim().slice(0, 300);
    if (v) data[f] = v;
  }
  return { type, data: Object.keys(data).length ? data : null };
}

function parseRequisites(row) {
  if (!row?.requisites) return null;
  try { return JSON.parse(row.requisites); } catch (_e) { return null; }
}

function requireContractsBucket(env) {
  const r2 = env.CONTRACTS_R2;
  if (!r2) throw new HttpError(500, "Не настроен R2 binding `CONTRACTS_R2` (создай бакет: wrangler r2 bucket create pllato-contracts)");
  return r2;
}

function genId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function genToken(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function base64ToBytes(b64) {
  const clean = String(b64 || "").replace(/^data:[^,]*,/, "").replace(/\s+/g, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "";
}

const CONTRACT_MAX_BYTES = 15 * 1024 * 1024;
const CONTRACT_STATUSES = ["draft", "in_progress", "completed", "declined", "cancelled"];

function contractRowToDto(row) {
  return {
    id: row.id,
    title: row.title,
    note: row.note || "",
    fileName: row.file_name,
    fileMime: row.file_mime,
    fileSize: Number(row.file_size) || 0,
    fileHash: row.file_hash,
    status: row.status,
    publicToken: row.public_token || "",
    linkMode: row.link_mode === "named" ? "named" : "universal",
    createdBy: row.created_by || "",
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
  };
}

// Гарантировать у договора единую публичную ссылку (общий токен для всех подписантов).
async function ensureContractPublicToken(env, row) {
  if (row.public_token) return row.public_token;
  const token = genToken();
  const db = requireStoreDb(env);
  await db.prepare(`UPDATE contracts SET public_token = ? WHERE id = ?`).bind(token, row.id).run();
  row.public_token = token;
  return token;
}

function signerRowToDto(row, { includeToken = false } = {}) {
  const dto = {
    id: row.id,
    role: row.role,
    fullName: row.full_name,
    iin: row.iin || "",
    contact: row.contact || "",
    orderIndex: Number(row.order_index) || 0,
    status: row.status,
    signerCn: row.signer_cn || "",
    signerIin: row.signer_iin || "",
    signerSerial: row.signer_serial || "",
    signerType: row.signer_type || "",
    requisites: parseRequisites(row),
    signedAt: Number(row.signed_at) || 0,
    declineReason: row.decline_reason || "",
    hasSignature: Boolean(row.sig_key),
  };
  if (includeToken) dto.token = row.token || "";
  return dto;
}

function computeContractStatus(prevStatus, signers) {
  if (signers.some((s) => s.status === "declined")) return "declined";
  const hasEmployee = signers.some((s) => s.role === "employee");
  if (hasEmployee && signers.every((s) => s.status === "signed")) return "completed";
  if (prevStatus === "cancelled") return "cancelled";
  if (signers.some((s) => s.status === "signed")) return "in_progress";
  return prevStatus === "in_progress" ? "in_progress" : "draft";
}

async function loadContractSigners(env, contractId) {
  const db = requireStoreDb(env);
  const res = await db
    .prepare(`SELECT * FROM contract_signers WHERE contract_id = ? ORDER BY order_index ASC, created_at ASC`)
    .bind(contractId)
    .all();
  return res.results || [];
}

async function loadContractOr404(env, contractId) {
  const db = requireStoreDb(env);
  const row = await db.prepare(`SELECT * FROM contracts WHERE id = ?`).bind(contractId).first();
  if (!row) throw new HttpError(404, "Договор не найден");
  return row;
}

async function syncContractStatus(env, contractRow) {
  const signers = await loadContractSigners(env, contractRow.id);
  const next = computeContractStatus(contractRow.status, signers);
  if (next !== contractRow.status) {
    const db = requireStoreDb(env);
    await db
      .prepare(`UPDATE contracts SET status = ?, updated_at = ? WHERE id = ?`)
      .bind(next, Date.now(), contractRow.id)
      .run();
    contractRow.status = next;
  }
  return signers;
}

async function handleContractsList(env, actor) {
  await ensureContractsTables(env);
  const db = requireStoreDb(env);
  const cRes = await db.prepare(`SELECT * FROM contracts ORDER BY updated_at DESC LIMIT 500`).all();
  const contracts = cRes.results || [];
  if (!contracts.length) return { ok: true, contracts: [] };
  const sRes = await db.prepare(`SELECT * FROM contract_signers ORDER BY order_index ASC`).all();
  const byContract = {};
  for (const s of sRes.results || []) {
    (byContract[s.contract_id] = byContract[s.contract_id] || []).push(s);
  }
  const isAdmin = Boolean(actor?.isAdmin);
  for (const c of contracts) {
    if (!c.public_token) await ensureContractPublicToken(env, c);
  }
  return {
    ok: true,
    contracts: contracts.map((c) => {
      const signers = byContract[c.id] || [];
      return {
        ...contractRowToDto(c),
        signersTotal: signers.length,
        signersSigned: signers.filter((s) => s.status === "signed").length,
        signers: signers.map((s) => signerRowToDto(s, { includeToken: isAdmin })),
      };
    }),
  };
}

async function handleContractGet(env, id, actor) {
  await ensureContractsTables(env);
  const row = await loadContractOr404(env, id);
  await ensureContractPublicToken(env, row);
  const signers = await syncContractStatus(env, row);
  return {
    ok: true,
    contract: contractRowToDto(row),
    signers: signers.map((s) => signerRowToDto(s, { includeToken: true })),
  };
}

async function handleContractCreate(request, env, actor) {
  await ensureContractsTables(env);
  const body = await readRequestBodyAsJson(request);
  const title = String(body?.title || "").trim();
  const note = String(body?.note || "").trim().slice(0, 2000);
  const fileName = String(body?.fileName || "").trim() || "contract.pdf";
  const fileMime = String(body?.fileMime || "").trim() || "application/octet-stream";
  if (!title) throw new HttpError(400, "Укажите название договора");
  if (title.length > 300) throw new HttpError(400, "Слишком длинное название");
  if (!body?.fileBase64) throw new HttpError(400, "Файл договора обязателен");

  const bytes = base64ToBytes(body.fileBase64);
  if (!bytes.length) throw new HttpError(400, "Пустой файл");
  if (bytes.length > CONTRACT_MAX_BYTES) throw new HttpError(400, "Файл больше 15 МБ");

  const signersInput = Array.isArray(body?.signers) ? body.signers : [];
  const employees = signersInput
    .map((s) => ({
      fullName: String(s?.fullName || "").trim(),
      iin: String(s?.iin || "").replace(/[^\d]/g, "").slice(0, 12),
      contact: String(s?.contact || "").trim().slice(0, 200),
    }))
    .filter((s) => s.fullName);

  const id = genId("ct");
  const now = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
  const fileKey = `contracts/${id}/original_${safeName}`;
  const fileHash = await sha256Hex(bytes);

  const r2 = requireContractsBucket(env);
  await r2.put(fileKey, bytes, { httpMetadata: { contentType: fileMime } });

  const publicToken = genToken();
  const db = requireStoreDb(env);
  await db
    .prepare(
      `INSERT INTO contracts (id, title, note, file_key, file_name, file_mime, file_size, file_hash, status, public_token, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(id, title, note, fileKey, fileName, fileMime, bytes.length, fileHash, "draft", publicToken, actor?.email || "", now, now)
    .run();

  // Подписант-владелец (подписывает внутри портала, без токена).
  const ownerName = String(body?.ownerName || actor?.user?.name || actor?.email || "Владелец").trim();
  const ownerIin = String(body?.ownerIin || "").replace(/[^\d]/g, "").slice(0, 12);
  const ownerSignerId = genId("sg");
  await db
    .prepare(
      `INSERT INTO contract_signers (id, contract_id, role, full_name, iin, contact, token, order_index, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(ownerSignerId, id, "owner", ownerName, ownerIin, actor?.email || "", null, 0, "pending", now, now)
    .run();

  // Подписанты-сотрудники: у каждого свой токен для персональной ссылки.
  let idx = 1;
  for (const emp of employees) {
    await db
      .prepare(
        `INSERT INTO contract_signers (id, contract_id, role, full_name, iin, contact, token, order_index, status, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      )
      .bind(genId("sg"), id, "employee", emp.fullName, emp.iin, emp.contact, genToken(), idx, "pending", now, now)
      .run();
    idx += 1;
  }

  const row = await loadContractOr404(env, id);
  const signers = await loadContractSigners(env, id);
  return {
    ok: true,
    contract: contractRowToDto(row),
    signers: signers.map((s) => signerRowToDto(s, { includeToken: true })),
  };
}

async function handleContractAddSigners(request, env, id, actor) {
  await ensureContractsTables(env);
  const row = await loadContractOr404(env, id);
  const body = await readRequestBodyAsJson(request);
  // Можно передать готовых подписантов или просто запросить N пустых ссылок (count).
  let list = (Array.isArray(body?.signers) ? body.signers : [])
    .map((s) => ({
      fullName: String(s?.fullName || "").trim(),
      iin: String(s?.iin || "").replace(/[^\d]/g, "").slice(0, 12),
      contact: String(s?.contact || "").trim().slice(0, 200),
    }));
  if (!list.length) {
    const count = Math.max(1, Math.min(20, Number(body?.count) || 1));
    list = Array.from({ length: count }, () => ({ fullName: "", iin: "", contact: "" }));
  }
  const db = requireStoreDb(env);
  const maxRow = await db.prepare(`SELECT MAX(order_index) AS m FROM contract_signers WHERE contract_id = ?`).bind(id).first();
  let idx = (Number(maxRow?.m) || 0) + 1;
  const now = Date.now();
  for (const emp of list) {
    const name = emp.fullName || `Подписант ${idx}`;
    await db
      .prepare(
        `INSERT INTO contract_signers (id, contract_id, role, full_name, iin, contact, token, order_index, status, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      )
      .bind(genId("sg"), id, "employee", name, emp.iin, emp.contact, genToken(), idx, "pending", now, now)
      .run();
    idx += 1;
  }
  await db.prepare(`UPDATE contracts SET updated_at = ? WHERE id = ?`).bind(now, id).run();
  const signers = await loadContractSigners(env, id);
  return { ok: true, contract: contractRowToDto(row), signers: signers.map((s) => signerRowToDto(s, { includeToken: true })) };
}

async function handleContractSetMode(request, env, id) {
  await ensureContractsTables(env);
  const row = await loadContractOr404(env, id);
  const body = await readRequestBodyAsJson(request);
  const mode = body?.mode === "named" ? "named" : "universal";
  const db = requireStoreDb(env);
  const now = Date.now();
  await db.prepare(`UPDATE contracts SET link_mode = ?, updated_at = ? WHERE id = ?`).bind(mode, now, id).run();
  row.link_mode = mode;
  await ensureContractPublicToken(env, row);
  const signers = await loadContractSigners(env, id);
  return { ok: true, contract: contractRowToDto(row), signers: signers.map((s) => signerRowToDto(s, { includeToken: true })) };
}

async function handleContractSend(env, id) {
  await ensureContractsTables(env);
  const row = await loadContractOr404(env, id);
  if (row.status === "draft") {
    const db = requireStoreDb(env);
    await db.prepare(`UPDATE contracts SET status = 'in_progress', updated_at = ? WHERE id = ?`).bind(Date.now(), id).run();
    row.status = "in_progress";
  }
  const signers = await loadContractSigners(env, id);
  return { ok: true, contract: contractRowToDto(row), signers: signers.map((s) => signerRowToDto(s, { includeToken: true })) };
}

async function handleContractDelete(env, id) {
  await ensureContractsTables(env);
  const row = await loadContractOr404(env, id);
  const db = requireStoreDb(env);
  const r2 = env.CONTRACTS_R2;
  if (r2) {
    try {
      await r2.delete(row.file_key);
      const signers = await loadContractSigners(env, id);
      for (const s of signers) if (s.sig_key) await r2.delete(s.sig_key);
    } catch (e) {
      console.error("contract R2 cleanup failed:", e);
    }
  }
  await db.prepare(`DELETE FROM contract_signers WHERE contract_id = ?`).bind(id).run();
  await db.prepare(`DELETE FROM contracts WHERE id = ?`).bind(id).run();
  return { ok: true, id };
}

function fileResponse(request, env, bytes, mime, fileName, { download = false } = {}) {
  const disp = `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(fileName || "file")}`;
  return new Response(bytes, {
    status: 200,
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": mime || "application/octet-stream",
      "Content-Disposition": disp,
      "Cache-Control": "private, no-store",
    },
  });
}

async function handleContractFile(request, env, id) {
  await ensureContractsTables(env);
  const row = await loadContractOr404(env, id);
  const r2 = requireContractsBucket(env);
  const obj = await r2.get(row.file_key);
  if (!obj) throw new HttpError(404, "Файл не найден в хранилище");
  const buf = await obj.arrayBuffer();
  const download = new URL(request.url).searchParams.get("download") === "1";
  return fileResponse(request, env, buf, row.file_mime, row.file_name, { download });
}

// Скачать ЭЦП-подпись (detached CMS / .p7s) конкретного подписанта.
async function handleContractSignatureFile(request, env, id, signerId) {
  await ensureContractsTables(env);
  const row = await loadContractOr404(env, id);
  const db = requireStoreDb(env);
  const signer = await db.prepare(`SELECT * FROM contract_signers WHERE id = ? AND contract_id = ?`).bind(signerId, id).first();
  if (!signer || !signer.sig_key) throw new HttpError(404, "Подпись не найдена");
  const r2 = requireContractsBucket(env);
  const obj = await r2.get(signer.sig_key);
  if (!obj) throw new HttpError(404, "Файл подписи не найден в хранилище");
  const buf = await obj.arrayBuffer();
  const base = (row.file_name || "contract").replace(/\.[^.]+$/, "");
  const who = (signer.full_name || "signer").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40);
  return fileResponse(request, env, buf, "application/pkcs7-signature", `${base}__${who}.p7s`, { download: true });
}

// Применить подпись к строке подписанта (общая логика для владельца и сотрудника).
async function applySignature(env, request, contractRow, signerRow, body) {
  if (signerRow.status === "signed") throw new HttpError(409, "Этот подписант уже подписал договор");
  if (contractRow.status === "cancelled") throw new HttpError(409, "Договор отменён");

  const now = Date.now();
  const db = requireStoreDb(env);

  if (body?.decline) {
    const reason = String(body?.reason || "").trim().slice(0, 500);
    await db
      .prepare(`UPDATE contract_signers SET status = 'declined', decline_reason = ?, signed_ip = ?, updated_at = ? WHERE id = ?`)
      .bind(reason, clientIp(request), now, signerRow.id)
      .run();
  } else {
    const cmsB64 = String(body?.cmsBase64 || "").trim();
    if (!cmsB64) throw new HttpError(400, "Нет данных подписи (cmsBase64)");
    const cmsBytes = base64ToBytes(cmsB64);
    if (!cmsBytes.length) throw new HttpError(400, "Пустая подпись");
    if (cmsBytes.length > CONTRACT_MAX_BYTES) throw new HttpError(400, "Подпись слишком большая");
    const sigKey = `contracts/${contractRow.id}/sig_${signerRow.id}.p7s`;
    const r2 = requireContractsBucket(env);
    await r2.put(sigKey, cmsBytes, { httpMetadata: { contentType: "application/pkcs7-signature" } });
    const cn = String(body?.signer?.cn || "").trim().slice(0, 200);
    const iin = String(body?.signer?.iin || "").replace(/[^\d]/g, "").slice(0, 12);
    const serial = String(body?.signer?.serial || "").trim().slice(0, 120);
    const req = normalizeRequisites(body?.requisites, body?.signerType);
    const reqJson = req.data || req.type ? JSON.stringify(req) : (signerRow.requisites || null);
    const reqType = req.type || signerRow.signer_type || null;
    const fullName = req.data?.name ? req.data.name.slice(0, 200) : signerRow.full_name;
    await db
      .prepare(
        `UPDATE contract_signers SET status = 'signed', full_name = ?, sig_key = ?, signer_cn = ?, signer_iin = ?, signer_serial = ?, signer_type = ?, requisites = ?, signed_at = ?, signed_ip = ?, updated_at = ? WHERE id = ?`
      )
      .bind(fullName, sigKey, cn, iin, serial, reqType, reqJson, now, clientIp(request), now, signerRow.id)
      .run();
  }

  await db.prepare(`UPDATE contracts SET updated_at = ? WHERE id = ?`).bind(now, contractRow.id).run();
  const refreshed = await loadContractOr404(env, contractRow.id);
  const signers = await syncContractStatus(env, refreshed);
  return { contract: refreshed, signers };
}

async function handleContractSignOwner(request, env, id) {
  await ensureContractsTables(env);
  const row = await loadContractOr404(env, id);
  const signers = await loadContractSigners(env, id);
  const owner = signers.find((s) => s.role === "owner");
  if (!owner) throw new HttpError(404, "У договора нет подписанта-владельца");
  const body = await readRequestBodyAsJson(request);
  const out = await applySignature(env, request, row, owner, body);
  return {
    ok: true,
    contract: contractRowToDto(out.contract),
    signers: out.signers.map((s) => signerRowToDto(s, { includeToken: true })),
  };
}

async function loadSignerByTokenOr404(env, token) {
  await ensureContractsTables(env);
  const db = requireStoreDb(env);
  const signer = await db.prepare(`SELECT * FROM contract_signers WHERE token = ?`).bind(token).first();
  if (!signer) throw new HttpError(404, "Ссылка недействительна");
  const contract = await db.prepare(`SELECT * FROM contracts WHERE id = ?`).bind(signer.contract_id).first();
  if (!contract) throw new HttpError(404, "Договор не найден");
  return { signer, contract };
}

// Публичный просмотр договора по персональной ссылке (без логина).
async function handleSignGet(env, token) {
  const { signer, contract } = await loadSignerByTokenOr404(env, token);
  const others = await loadContractSigners(env, contract.id);
  return {
    ok: true,
    contract: {
      title: contract.title,
      note: contract.note || "",
      fileName: contract.file_name,
      fileMime: contract.file_mime,
      fileSize: Number(contract.file_size) || 0,
      fileHash: contract.file_hash,
      status: contract.status,
    },
    signer: {
      fullName: signer.full_name,
      iin: signer.iin || "",
      status: signer.status,
      signedAt: Number(signer.signed_at) || 0,
      signerCn: signer.signer_cn || "",
      declineReason: signer.decline_reason || "",
      signerType: signer.signer_type || "",
      requisites: parseRequisites(signer),
    },
    parties: others.map((s) => ({ fullName: s.full_name, role: s.role, status: s.status })),
  };
}

async function handleSignFile(request, env, token) {
  const { contract } = await loadSignerByTokenOr404(env, token);
  const r2 = requireContractsBucket(env);
  const obj = await r2.get(contract.file_key);
  if (!obj) throw new HttpError(404, "Файл не найден в хранилище");
  const buf = await obj.arrayBuffer();
  const download = new URL(request.url).searchParams.get("download") === "1";
  return fileResponse(request, env, buf, contract.file_mime, contract.file_name, { download });
}

// Сохранить реквизиты подписанта (отдельный шаг до подписания ЭЦП).
async function saveSignerRequisites(env, signerRow, body) {
  if (signerRow.status === "signed") throw new HttpError(409, "Договор уже подписан — реквизиты изменить нельзя");
  const req = normalizeRequisites(body?.requisites, body?.signerType);
  const db = requireStoreDb(env);
  const name = req.data?.name ? req.data.name.slice(0, 200) : signerRow.full_name;
  await db
    .prepare(`UPDATE contract_signers SET full_name = ?, signer_type = ?, requisites = ?, updated_at = ? WHERE id = ?`)
    .bind(name, req.type || null, req.data || req.type ? JSON.stringify(req) : null, Date.now(), signerRow.id)
    .run();
  return db.prepare(`SELECT * FROM contract_signers WHERE id = ?`).bind(signerRow.id).first();
}

async function handleSignPost(request, env, token) {
  const { signer, contract } = await loadSignerByTokenOr404(env, token);
  const body = await readRequestBodyAsJson(request);

  if (body?.saveRequisites) {
    const fresh = await saveSignerRequisites(env, signer, body);
    return {
      ok: true,
      saved: true,
      signer: {
        fullName: fresh.full_name,
        status: fresh.status,
        signerType: fresh.signer_type || "",
        requisites: parseRequisites(fresh),
      },
    };
  }

  const out = await applySignature(env, request, contract, signer, body);
  const fresh = out.signers.find((s) => s.id === signer.id) || signer;
  return {
    ok: true,
    contractStatus: out.contract.status,
    signer: {
      fullName: fresh.full_name,
      status: fresh.status,
      signedAt: Number(fresh.signed_at) || 0,
      signerCn: fresh.signer_cn || "",
      declineReason: fresh.decline_reason || "",
      signerType: fresh.signer_type || "",
      requisites: parseRequisites(fresh),
    },
  };
}

// ---- Универсальная ссылка: один общий токен договора, каждый подписант заводит себя сам ----
async function loadContractByPublicTokenOr404(env, token) {
  await ensureContractsTables(env);
  const db = requireStoreDb(env);
  const contract = await db.prepare(`SELECT * FROM contracts WHERE public_token = ?`).bind(token).first();
  if (!contract) throw new HttpError(404, "Ссылка недействительна");
  return contract;
}

// Публичный просмотр договора по общей ссылке (без логина): показываем сам документ
// и список уже подписавших сторон. Форма реквизитов на фронте пустая.
async function handleSignGetByContract(env, token) {
  const contract = await loadContractByPublicTokenOr404(env, token);
  if (contract.link_mode === "named") throw new HttpError(409, "Этот договор подписывается по именным ссылкам — запросите персональную ссылку у отправителя");
  const others = await loadContractSigners(env, contract.id);
  return {
    ok: true,
    universal: true,
    contract: {
      title: contract.title,
      note: contract.note || "",
      fileName: contract.file_name,
      fileMime: contract.file_mime,
      fileSize: Number(contract.file_size) || 0,
      fileHash: contract.file_hash,
      status: contract.status,
    },
    signer: { fullName: "", iin: "", status: "pending", signerType: "", requisites: { data: {} } },
    parties: others
      .filter((s) => s.status === "signed")
      .map((s) => ({ fullName: s.full_name, role: s.role, status: s.status, signedAt: Number(s.signed_at) || 0 })),
  };
}

async function handleSignFileByContract(request, env, token) {
  const contract = await loadContractByPublicTokenOr404(env, token);
  const r2 = requireContractsBucket(env);
  const obj = await r2.get(contract.file_key);
  if (!obj) throw new HttpError(404, "Файл не найден в хранилище");
  const buf = await obj.arrayBuffer();
  const download = new URL(request.url).searchParams.get("download") === "1";
  return fileResponse(request, env, buf, contract.file_mime, contract.file_name, { download });
}

// Подписание по общей ссылке: создаём новую строку-подписанта прямо в момент подписи.
async function handleSignPostByContract(request, env, token) {
  const contract = await loadContractByPublicTokenOr404(env, token);
  if (contract.link_mode === "named") throw new HttpError(409, "Этот договор подписывается по именным ссылкам");
  if (contract.status === "cancelled") throw new HttpError(409, "Договор отменён");
  const body = await readRequestBodyAsJson(request);
  const cmsB64 = String(body?.cmsBase64 || "").trim();
  if (!cmsB64) throw new HttpError(400, "Нет данных подписи (cmsBase64)");

  const db = requireStoreDb(env);
  const now = Date.now();
  const maxRow = await db.prepare(`SELECT MAX(order_index) AS m FROM contract_signers WHERE contract_id = ?`).bind(contract.id).first();
  const idx = (Number(maxRow?.m) || 0) + 1;
  const newId = genId("sg");
  const name = (body?.requisites?.data?.name ? String(body.requisites.data.name) : `Подписант ${idx}`).slice(0, 200);
  await db
    .prepare(
      `INSERT INTO contract_signers (id, contract_id, role, full_name, iin, contact, token, order_index, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(newId, contract.id, "employee", name, "", "", genToken(), idx, "pending", now, now)
    .run();
  const signerRow = await db.prepare(`SELECT * FROM contract_signers WHERE id = ?`).bind(newId).first();

  let out;
  try {
    out = await applySignature(env, request, contract, signerRow, body);
  } catch (e) {
    await db.prepare(`DELETE FROM contract_signers WHERE id = ?`).bind(newId).run();
    throw e;
  }
  const fresh = out.signers.find((s) => s.id === newId) || signerRow;
  return {
    ok: true,
    contractStatus: out.contract.status,
    signer: {
      fullName: fresh.full_name,
      status: fresh.status,
      signedAt: Number(fresh.signed_at) || 0,
      signerCn: fresh.signer_cn || "",
      signerType: fresh.signer_type || "",
      requisites: parseRequisites(fresh),
    },
  };
}

/**
 * Отправить уведомление в Telegram-группу о новой полевой сделке.
 * Идемпотентно: для каждого deal_id вставка в field_tg_notifications с
 * INSERT OR IGNORE — если запись уже есть, пропускаем.
 *
 * Требуемые secrets/vars в worker (через wrangler secret put):
 *   TELEGRAM_BOT_TOKEN          — токен бота от @BotFather
 *   TELEGRAM_FIELD_CHAT_ID      — id группы (отрицательное число для group/supergroup)
 *
 * Если хотя бы одна из переменных не задана — функция тихо выходит,
 * чтобы worker не падал на проде без секретов.
 */
async function notifyFieldDealsToTelegram(env, deals) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_FIELD_CHAT_ID;
  console.log(`[tg-notify] entry deals=${deals.length} hasToken=${Boolean(token)} hasChatId=${Boolean(chatId)} chatIdLen=${chatId ? String(chatId).length : 0}`);
  if (!token || !chatId) {
    console.warn(`[tg-notify] missing secrets — token=${Boolean(token)} chatId=${Boolean(chatId)}`);
    return;
  }
  const db = requireStoreDb(env);

  for (const deal of deals) {
    // Проверяем + резервируем место (insert idempotent).
    let inserted = false;
    try {
      const result = await db
        .prepare(`INSERT OR IGNORE INTO field_tg_notifications (deal_id, notified_at) VALUES (?, ?)`)
        .bind(String(deal.id), Date.now())
        .run();
      // d1 .run() возвращает meta.changes — 1 если вставили, 0 если уже было.
      inserted = (result?.meta?.changes ?? 0) > 0;
      console.log(`[tg-notify] insert deal=${deal.id} inserted=${inserted}`);
    } catch (e) {
      console.warn("[tg-notify] insert failed:", e?.message || e);
      continue;
    }
    if (!inserted) {
      console.log(`[tg-notify] skip deal=${deal.id} — already notified earlier`);
      continue;
    }

    // Формируем сообщение.
    const title = String(deal.title || "Заказ").slice(0, 200);
    const manager = String(deal.orderSubmittedByName || deal.assigneeName || "—").slice(0, 80);
    const amount = Number(deal.amount) || 0;
    const amountStr = new Intl.NumberFormat("ru-RU").format(Math.round(amount));
    const dealUrl = `https://crm.aminamed.kz/#crm/${encodeURIComponent(deal.id)}`;
    const lines = [
      "🆕 *Новый заказ от поля*",
      "",
      `📦 ${title.replace(/[*_`]/g, " ")}`,
      `👤 Менеджер: ${manager.replace(/[*_`]/g, " ")}`,
      `💰 Сумма: ${amountStr} ₸`,
      "",
      `🔗 Открыть в CRM: ${dealUrl}`,
    ];

    // Telegram Bot API sendMessage. parse_mode Markdown для жирного шрифта.
    // Токен НЕ кодируем encodeURIComponent — ":" в нём валидный.
    try {
      // Чистим токен от whitespace/CRLF — wrangler secret put мог сохранить
      // лишние символы при копи-пасте из BotFather.
      const cleanToken = String(token).trim();
      const tgUrl = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
      // chatId — тоже trim.
      const cleanChatId = String(chatId).trim();
      // Диагностика без раскрытия секрета — длина и крайние 4 символа.
      const tokenPrefix = cleanToken.slice(0, 4);
      const tokenSuffix = cleanToken.slice(-4);
      const tokenHasColon = cleanToken.includes(":");
      const tokenLen = cleanToken.length;
      console.log(`[tg-notify] sending deal=${deal.id} chatId=${cleanChatId} tokenLen=${tokenLen} colon=${tokenHasColon} prefix=${tokenPrefix} suffix=${tokenSuffix}`);
      const resp = await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: lines.join("\n"),
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      });
      const respText = await resp.text();
      if (!resp.ok) {
        console.warn(`[tg-notify] sendMessage failed ${resp.status}:`, respText.slice(0, 500));
        // Откатим запись чтобы дать шанс на retry при следующем push.
        try {
          await db.prepare(`DELETE FROM field_tg_notifications WHERE deal_id = ?`).bind(String(deal.id)).run();
        } catch {}
      } else {
        console.log(`[tg-notify] sent deal=${deal.id} response=${respText.slice(0, 120)}`);
      }
    } catch (e) {
      console.warn("[tg-notify] fetch error:", e?.message || e);
      try {
        await db.prepare(`DELETE FROM field_tg_notifications WHERE deal_id = ?`).bind(String(deal.id)).run();
      } catch {}
    }
  }
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
    roleId: String(row.role_id || "").trim(),
    isAdmin: Number(row.is_admin) === 1,
    isSuperAdmin: Number(row.is_super_admin) === 1,
    apps: parseJsonObject(row.apps, {}),
    crmAccess: parseJsonObject(row.crm_access, {}),
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
      SELECT id, email, name, last_name, position, role, role_id, is_admin, is_super_admin, apps, crm_access, created_at, updated_at, created_by
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
      SELECT id, email, name, last_name, position, role, role_id, is_admin, is_super_admin, apps, crm_access, created_at, updated_at, created_by
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
      SELECT id, email, name, last_name, position, role, role_id, is_admin, is_super_admin, apps, crm_access, created_at, updated_at, created_by
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
  const crmAccess = isObject(payload.crmAccess)
    ? {
        pipelines: Array.from(new Set(
          (Array.isArray(payload.crmAccess.pipelines) ? payload.crmAccess.pipelines : [])
            .map((value) => String(value || "").trim())
            .filter((value) => value === "start" || value === "production")
        )),
        dealScope: payload.crmAccess.dealScope === "all" ? "all" : "own",
      }
    : (existingByEmail?.crmAccess || { pipelines: ["start", "production"], dealScope: "own" });

  // roleId — id кастомной роли из pllato_core_roles (Settings → Роли).
  // Если payload.roleId передан (даже пустая строка для сброса) — используем,
  // иначе сохраняем существующее значение из БД.
  const roleId = (payload.roleId !== undefined)
    ? String(payload.roleId || "").trim()
    : String(existingByEmail?.roleId || "");

  await db
    .prepare(`
      INSERT INTO users (
        id, email, name, last_name, position, role, role_id, is_admin, is_super_admin, apps, crm_access, created_at, updated_at, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        id = COALESCE(excluded.id, users.id),
        name = excluded.name,
        last_name = excluded.last_name,
        position = excluded.position,
        role = excluded.role,
        role_id = excluded.role_id,
        is_admin = excluded.is_admin,
        is_super_admin = excluded.is_super_admin,
        apps = excluded.apps,
        crm_access = excluded.crm_access,
        updated_at = excluded.updated_at
    `)
    .bind(
      id,
      email,
      String(payload.name || existingByEmail?.name || fallbackName),
      String(payload.lastName || payload.last_name || existingByEmail?.lastName || ""),
      String(payload.position || existingByEmail?.position || ""),
      String(payload.role || existingByEmail?.role || ""),
      roleId,
      isAdmin ? 1 : 0,
      isSuperAdmin ? 1 : 0,
      JSON.stringify(apps || {}),
      JSON.stringify(crmAccess),
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

function canAccessProjectFinance(actor) {
  return Boolean(actor?.isRoot || actor?.user?.isSuperAdmin);
}

function requireProjectFinanceAccess(actor) {
  if (!canAccessProjectFinance(actor)) {
    throw new HttpError(403, "Финансы проектов доступны только Super Admin");
  }
}

function normalizeProjectFinance(payload) {
  const source = isObject(payload?.money) ? payload.money : {};
  const money = {};
  const projectIds = Object.keys(source).slice(0, 500);
  for (const rawId of projectIds) {
    const id = String(rawId || "").trim();
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) continue;
    const item = isObject(source[rawId]) ? source[rawId] : {};
    const deal = Math.max(0, Math.min(Number(item.deal) || 0, 1_000_000_000_000));
    const cur = item.cur === "USD" ? "USD" : "KZT";
    const pays = (Array.isArray(item.pays) ? item.pays : []).slice(0, 1000).map((p) => ({
      d: /^\d{4}-\d{2}-\d{2}$/.test(String(p?.d || "")) ? String(p.d) : "",
      sum: Math.max(0, Math.min(Number(p?.sum) || 0, 1_000_000_000_000)),
      at: Number.isFinite(Number(p?.at)) ? Math.max(0, Number(p.at)) : 0,
    })).filter((p) => p.sum > 0);
    const orderCreatedAt = Number.isFinite(Number(item.orderCreatedAt))
      ? Math.max(0, Number(item.orderCreatedAt))
      : 0;
    const completedAt = Number.isFinite(Number(item.completedAt))
      ? Math.max(0, Number(item.completedAt))
      : 0;
    money[id] = { deal, cur, pays, orderCreatedAt, completedAt };
  }
  const rawVisibility = isObject(payload?.chartVisibility) ? payload.chartVisibility : {};
  const rawOverrides = isObject(payload?.chartOverrides) ? payload.chartOverrides : {};
  const rawScale = isObject(payload?.chartScale) ? payload.chartScale : {};
  const normalizeViewers = (value) => [...new Set((Array.isArray(value) ? value : [])
    .map((email) => String(email || "").trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    .slice(0, 200))];
  const chartOverrides = {};
  Object.entries(rawOverrides).slice(0, 100).forEach(([week, value]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || !isObject(value)) return;
    const one = {};
    if (Number.isFinite(Number(value.orders))) one.orders = Math.max(0, Math.round(Number(value.orders)));
    if (Number.isFinite(Number(value.cash))) one.cash = Math.max(0, Math.round(Number(value.cash)));
    if (Number.isFinite(Number(value.releases))) one.releases = Math.max(0, Math.round(Number(value.releases)));
    if (Number.isFinite(Number(value.kep))) one.kep = Math.max(0, Math.round(Number(value.kep)));
    if (Object.keys(one).length) chartOverrides[week] = one;
  });
  return {
    money,
    rate: Math.max(1, Math.min(Number(payload?.rate) || 530, 1_000_000)),
    chartVisibility: {
      inquiries: normalizeViewers(
        Object.prototype.hasOwnProperty.call(rawVisibility, "inquiries")
          ? rawVisibility.inquiries
          : rawVisibility.orders
      ),
      kep: normalizeViewers(
        Object.prototype.hasOwnProperty.call(rawVisibility, "kep")
          ? rawVisibility.kep
          : rawVisibility.inquiries
      ),
      orders: normalizeViewers(rawVisibility.orders),
      cash: normalizeViewers(rawVisibility.cash),
      releases: normalizeViewers(rawVisibility.releases),
    },
    chartOverrides,
    chartScale: {
      inquiries: Math.max(0, Math.round(Number(rawScale.inquiries) || 0)),
      kep: Math.max(0, Math.round(Number(rawScale.kep) || 0)),
      orders: Math.max(0, Math.round(Number(rawScale.orders) || 0)),
      cash: Math.max(0, Math.round(Number(rawScale.cash) || 0)),
      releases: Math.max(0, Math.round(Number(rawScale.releases) || 0)),
    },
  };
}

async function handleProjectFinanceGet(env, actor) {
  requireProjectFinanceAccess(actor);
  const stored = await d1GetDoc(env, PRIVATE_PROJECT_FINANCE_COLLECTION, PRIVATE_PROJECT_FINANCE_ID);
  if (!stored) return { ok: true, exists: false, money: {}, rate: 530 };
  const normalized = normalizeProjectFinance(stored);
  return { ok: true, exists: true, ...normalized, updatedAt: stored.updatedAt || null };
}

async function handleProjectFinancePut(request, env, actor) {
  requireProjectFinanceAccess(actor);
  const body = await readRequestBodyAsJson(request);
  const stored = await d1GetDoc(env, PRIVATE_PROJECT_FINANCE_COLLECTION, PRIVATE_PROJECT_FINANCE_ID);
  const normalized = normalizeProjectFinance({
    ...body,
    chartVisibility: body.chartVisibility ?? stored?.chartVisibility,
    chartOverrides: body.chartOverrides ?? stored?.chartOverrides,
    chartScale: body.chartScale ?? stored?.chartScale,
  });
  const now = Date.now();
  await d1UpsertDoc(env, PRIVATE_PROJECT_FINANCE_COLLECTION, {
    id: PRIVATE_PROJECT_FINANCE_ID,
    ...normalized,
    createdAt: Number(stored?.createdAt) || now,
    updatedAt: now,
  }, actor.email);
  return { ok: true, ...normalized, updatedAt: now };
}

function projectFinanceEventTime(pay) {
  const exact = Number(pay?.at) || 0;
  if (exact > 0) return exact;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(pay?.d || "")) ? pay.d : "";
  // Старые платежи не содержат времени. Полдень Алматы сохраняет их дату и
  // предсказуемо относит четверг к завершающейся в 14:00 неделе.
  return date ? Date.parse(`${date}T12:00:00+05:00`) : 0;
}

function almatyThursdayWeekStart(timestamp) {
  const shiftMs = 5 * 60 * 60 * 1000;
  const local = new Date(timestamp + shiftMs);
  const day = local.getUTCDay();
  const daysSinceThursday = (day - 4 + 7) % 7;
  const startLocal = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() - daysSinceThursday,
    14, 0, 0, 0,
  );
  let startUtc = startLocal - shiftMs;
  if (timestamp < startUtc) startUtc -= 7 * 86400000;
  return startUtc;
}

function financeChartAllowed(actor, viewers) {
  if (canAccessProjectFinance(actor)) return true;
  const email = String(actor?.email || "").trim().toLowerCase();
  return Boolean(email && viewers.includes(email));
}

function projectFinanceChartSeries(finance, points = 8) {
  const count = Math.max(4, Math.min(Number(points) || 8, 16));
  const weekMs = 7 * 86400000;
  const currentStart = almatyThursdayWeekStart(Date.now());
  const starts = Array.from({ length: count }, (_, i) => currentStart - (count - 1 - i) * weekMs);
  const orders = starts.map(() => 0);
  const cash = starts.map(() => 0);
  const releases = starts.map(() => 0);
  const startIndex = starts[0];
  const toIndex = (timestamp) => Math.floor((almatyThursdayWeekStart(timestamp) - startIndex) / weekMs);
  const label = (start) => new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Almaty",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(start));

  Object.values(finance.money || {}).forEach((item) => {
    const firstPayTime = (item.pays || []).map(projectFinanceEventTime).filter(Boolean).sort((a, b) => a - b)[0] || 0;
    const orderTime = Number(item.orderCreatedAt) || firstPayTime;
    if (Number(item.deal) > 0 && firstPayTime && orderTime) {
      const index = toIndex(orderTime);
      if (index >= 0 && index < count) orders[index] += 1;
    }
    (item.pays || []).forEach((pay) => {
      const timestamp = projectFinanceEventTime(pay);
      const index = timestamp ? toIndex(timestamp) : -1;
      if (index >= 0 && index < count) {
        const amount = item.cur === "USD" ? Number(pay.sum || 0) * finance.rate : Number(pay.sum || 0);
        cash[index] += Math.round(amount);
      }
    });
    let releaseTime = Number(item.completedAt) || 0;
    if (!releaseTime && Number(item.deal) > 0) {
      let received = 0;
      const sortedPays = (item.pays || [])
        .map((pay) => ({ pay, timestamp: projectFinanceEventTime(pay) }))
        .filter(({ timestamp }) => timestamp > 0)
        .sort((a, b) => a.timestamp - b.timestamp);
      for (const entry of sortedPays) {
        received += Number(entry.pay.sum) || 0;
        if (received >= Number(item.deal)) {
          releaseTime = entry.timestamp;
          break;
        }
      }
    }
    const releaseIndex = releaseTime ? toIndex(releaseTime) : -1;
    if (releaseIndex >= 0 && releaseIndex < count) releases[releaseIndex] += 1;
  });

  return starts.map((start, index) => {
    const end = start + weekMs;
    // Точка подписывается датой закрытия недели. Например, период
    // 16.07 14:00 → 23.07 14:00 отображается как «23.07».
    const weekKey = new Date(end + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const override = finance.chartOverrides?.[weekKey] || {};
    return {
      start,
      end,
      label: label(end),
      partial: start === currentStart,
      orders: Number.isFinite(Number(override.orders)) ? Number(override.orders) : orders[index],
      cash: Number.isFinite(Number(override.cash)) ? Number(override.cash) : cash[index],
      releases: Number.isFinite(Number(override.releases)) ? Number(override.releases) : releases[index],
    };
  });
}

async function handleProjectFinanceChartsGet(env, actor, url) {
  const stored = await d1GetDoc(env, PRIVATE_PROJECT_FINANCE_COLLECTION, PRIVATE_PROJECT_FINANCE_ID);
  const finance = normalizeProjectFinance(stored || {});
  const visible = {
    inquiries: financeChartAllowed(actor, finance.chartVisibility.inquiries),
    kep: financeChartAllowed(actor, finance.chartVisibility.kep),
    orders: financeChartAllowed(actor, finance.chartVisibility.orders),
    cash: financeChartAllowed(actor, finance.chartVisibility.cash),
    releases: financeChartAllowed(actor, finance.chartVisibility.releases),
  };
  const allSeries = projectFinanceChartSeries(finance, url.searchParams.get("points"));
  const charts = {};
  if (visible.inquiries) {
    try {
      const pointCount = Math.max(4, Math.min(Number(url.searchParams.get("points")) || 8, 16));
      const upstream = await fetch(`https://pllato-elc-worker.uurraa.workers.dev/api/public/pllato-inquiries?points=${pointCount}`);
      if (upstream.ok) {
        const payload = await upstream.json();
        if (Array.isArray(payload?.series)) charts.inquiries = payload.series;
      }
    } catch (error) {
      console.warn("pllato inquiries chart unavailable", error?.message || error);
    }
  }
  if (visible.kep) {
    try {
      const pointCount = Math.max(4, Math.min(Number(url.searchParams.get("points")) || 8, 16));
      const upstream = await fetch(`https://pllato-elc-worker.uurraa.workers.dev/api/public/pllato-kep?points=${pointCount}`);
      if (upstream.ok) {
        const payload = await upstream.json();
        if (Array.isArray(payload?.series)) {
          charts.kep = payload.series.map((point, index) => {
            const base = allSeries[index];
            if (!base?.end) return point;
            const weekKey = new Date(base.end + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const override = finance.chartOverrides?.[weekKey];
            return Number.isFinite(Number(override?.kep))
              ? { ...point, value: Number(override.kep) }
              : point;
          });
        }
      }
    } catch (error) {
      console.warn("pllato KEP chart unavailable", error?.message || error);
    }
  }
  if (visible.orders) charts.orders = allSeries.map(({ start, end, label, partial, orders }) => ({ start, end, label, partial, value: orders }));
  if (visible.cash) charts.cash = allSeries.map(({ start, end, label, partial, cash }) => ({ start, end, label, partial, value: cash }));
  if (visible.releases) charts.releases = allSeries.map(({ start, end, label, partial, releases }) => ({ start, end, label, partial, value: releases }));
  const visibleKinds = Object.keys(visible).filter((kind) => visible[kind]);
  return {
    ok: true,
    charts,
    visible,
    chartVisibility: Object.fromEntries(visibleKinds.map((kind) => [kind, finance.chartVisibility[kind]])),
    chartScale: Object.fromEntries(visibleKinds.map((kind) => [kind, finance.chartScale[kind]])),
    boundary: { weekday: 4, hour: 14, timeZone: "Asia/Almaty" },
  };
}

async function handleProjectFinanceChartsPut(request, env, actor) {
  const body = await readRequestBodyAsJson(request);
  const stored = await d1GetDoc(env, PRIVATE_PROJECT_FINANCE_COLLECTION, PRIVATE_PROJECT_FINANCE_ID);
  const current = normalizeProjectFinance(stored || {});
  const kind = String(body.kind || "").trim();
  const validKinds = new Set(["inquiries", "kep", "orders", "cash", "releases"]);
  if (!canAccessProjectFinance(actor)) {
    if (!validKinds.has(kind) || !financeChartAllowed(actor, current.chartVisibility[kind])) {
      throw new HttpError(403, "Нет доступа к настройкам этого графика");
    }
  }
  const nextVisibility = canAccessProjectFinance(actor)
    ? body.chartVisibility
    : { ...current.chartVisibility, [kind]: body.chartVisibility?.[kind] };
  const nextScale = canAccessProjectFinance(actor)
    ? body.chartScale
    : { ...current.chartScale, [kind]: body.chartScale?.[kind] };
  const normalized = normalizeProjectFinance({
    ...(stored || {}),
    chartVisibility: nextVisibility,
    chartScale: nextScale,
  });
  const now = Date.now();
  await d1UpsertDoc(env, PRIVATE_PROJECT_FINANCE_COLLECTION, {
    id: PRIVATE_PROJECT_FINANCE_ID,
    ...normalized,
    createdAt: Number(stored?.createdAt) || now,
    updatedAt: now,
  }, actor.email);
  return {
    ok: true,
    chartVisibility: normalized.chartVisibility,
    chartScale: normalized.chartScale,
    updatedAt: now,
  };
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

function publicUserPayload(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    lastName: user.lastName || "",
    position: user.position || "",
    role: user.role || "",
    roleId: user.roleId || "",
    isAdmin: Boolean(user.isAdmin),
    isSuperAdmin: Boolean(user.isSuperAdmin),
    apps: user.apps || {},
    crmAccess: user.crmAccess || { pipelines: ["start", "production"], dealScope: "own" },
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
    crmAccess: user.crmAccess || { pipelines: ["start", "production"], dealScope: "own" },
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
  // Доступ в портал = членство в команде; видимость плиток — по user.apps на фронте.

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

  // Автосоздание/обновление user в D1: при создании — заводим, при существующем —
  // обновляем roleId если он передан (admin может менять роль сотрудника прямо
  // через форму set-password, которая вызывается при создании/редактировании
  // сотрудника в Настройки → Команда).
  let user = await d1GetUserByEmail(env, email);
  const hasRoleId = Object.prototype.hasOwnProperty.call(body || {}, "roleId");
  if (!user) {
    user = await d1UpsertUser(env, {
      email,
      name: String(body.name || "").trim() || email.split("@")[0],
      lastName: String(body.lastName || "").trim(),
      position: String(body.position || "").trim(),
      role: String(body.role || "").trim(),
      roleId: hasRoleId ? String(body.roleId || "").trim() : "",
      apps: { [APP_ID]: true },
    }, actor);
  } else if (hasRoleId) {
    user = await d1UpsertUser(env, {
      id: user.id,
      email,
      name: user.name,
      lastName: user.lastName,
      position: user.position,
      role: user.role,
      roleId: String(body.roleId || "").trim(),
      apps: user.apps,
    }, actor);
  }

  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2Hash(password, saltBytes);
  const salt = bytesToB64(saltBytes);
  await d1UpsertCrmPassword(env, email, hash, salt, /* forceChange */ true, actor);

  return { ok: true, email, userCreated: !!body.name };
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
  // Доступ в портал = членство в команде. Что именно видит сотрудник —
  // фильтруется по плиткам (user.apps) на фронте, а не гейтит весь вход.

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
  // Группы и lid оставляем как есть.
  if (src.includes("@g.us") || src.includes("@lid")) return src;
  // Для @c.us извлекаем цифры, нормализуем (8→7 для KZ/RU), собираем заново.
  // Это нужно, потому что фронт может прислать уже сформированный chatId с ведущей 8.
  const m = src.match(/^(\d+)@c\.us$/i);
  let clean;
  if (m) {
    clean = m[1];
  } else {
    clean = normalizePhone(src).replace(/^\+/, "");
  }
  if (/^8\d{10}$/.test(clean)) clean = "7" + clean.slice(1);
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

// ── SIP / WebRTC token ───────────────────────────────────────────────────
// Выдаёт креды для браузерного SIP-клиента (shared module sip-client.js).
// Все авторизованные операторы шарят SIP-endpoint "100" на Asterisk
// Hetzner. Pаспределение по операторам — отдельная задача (per-user
// endpoints), пока MVP shared.
async function handleSipToken(request, env) {
  const domain = env.SIP_DOMAIN || "178-105-90-157.nip.io";
  const user = env.SIP_USER || "100";
  const password = env.SIP_PASSWORD;
  if (!password) {
    throw new HttpError(500, "SIP_PASSWORD secret не задан на pllato-comm worker");
  }
  const iceServers = [
    { urls: env.METERED_TURN_URL ? "stun:stun.relay.metered.ca:80" : `stun:${domain}:3478` },
  ];
  if (env.METERED_TURN_URL && env.METERED_TURN_USERNAME && env.METERED_TURN_PASSWORD) {
    const m = env.METERED_TURN_URL.match(/^turns?:([^:]+)(?::\d+)?/);
    const meteredHost = m ? m[1] : "standard.relay.metered.ca";
    iceServers.push({
      urls: [
        `turn:${meteredHost}:80`,
        `turn:${meteredHost}:80?transport=tcp`,
        `turn:${meteredHost}:443`,
        `turns:${meteredHost}:443?transport=tcp`,
      ],
      username: env.METERED_TURN_USERNAME,
      credential: env.METERED_TURN_PASSWORD,
    });
  }
  return {
    user,
    password,
    domain,
    wss: `wss://${domain}:8089/ws`,
    stun: `stun:${domain}:3478`,
    iceServers,
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

async function handleWaQr(request, env, actor, url) {
  void actor;
  const channelId = String(url.searchParams.get("channelId") || "").trim();
  if (!channelId) throw new HttpError(400, "Не передан channelId");

  const channel = await loadChannel(env, channelId);
  assertChannelType(channel, "greenapi_wa");

  const idInstance = normalizeWaInstanceId(channel.data.config?.id_instance);
  const token = sanitizeGreenApiToken(channel.secret?.api_token_instance || "");
  if (!idInstance || !token) {
    throw new HttpError(400, "У канала WhatsApp не заполнены id_instance/api_token_instance");
  }

  const apiUrl = normalizeGreenApiBaseUrl(
    channel.data.config?.api_url || env.GREEN_API_URL || "https://api.green-api.com",
    "https://api.green-api.com",
  );
  const endpoint = `${apiUrl}/waInstance${idInstance}/qr/${token}`;
  const res = await fetch(endpoint, { method: "GET" });
  const responseText = await res.text();
  let providerBody = responseText;
  try { providerBody = JSON.parse(responseText); } catch {}

  if (!res.ok) throw new HttpError(502, "Green-API вернул ошибку при запросе QR", providerBody);

  // Green-API возвращает { type: "qrCode" | "alreadyLogged" | "error", message: string }
  // Для type="qrCode" message — base64 PNG (без data:image префикса).
  return {
    ok: true,
    type: providerBody?.type || null,
    qrBase64: providerBody?.type === "qrCode" ? String(providerBody.message || "") : null,
    message: providerBody?.message || null,
  };
}

async function handleWaState(request, env, actor, url) {
  void actor;
  const channelId = String(url.searchParams.get("channelId") || "").trim();
  if (!channelId) throw new HttpError(400, "Не передан channelId");

  const channel = await loadChannel(env, channelId);
  assertChannelType(channel, "greenapi_wa");

  const idInstance = normalizeWaInstanceId(channel.data.config?.id_instance);
  const token = sanitizeGreenApiToken(channel.secret?.api_token_instance || "");
  if (!idInstance || !token) {
    throw new HttpError(400, "У канала WhatsApp не заполнены id_instance/api_token_instance");
  }

  const apiUrl = normalizeGreenApiBaseUrl(
    channel.data.config?.api_url || env.GREEN_API_URL || "https://api.green-api.com",
    "https://api.green-api.com",
  );
  const endpoint = `${apiUrl}/waInstance${idInstance}/getStateInstance/${token}`;
  const res = await fetch(endpoint, { method: "GET" });
  const responseText = await res.text();
  let providerBody = responseText;
  try { providerBody = JSON.parse(responseText); } catch {}

  if (!res.ok) throw new HttpError(502, "Green-API вернул ошибку при запросе статуса", providerBody);

  // stateInstance: "authorized" | "notAuthorized" | "starting" | "blocked" | "sleepMode" | "yellowCard"
  return {
    ok: true,
    stateInstance: providerBody?.stateInstance || null,
    raw: providerBody,
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

// ─── 1С:Фреш OData integration ─────────────────────────────────────────
//
// Один тенант на сейчас (пилот Аминамед). Расширим позже, когда CRM станет
// мультитенантной. ID тенанта определяем из контекста актора или дефолтом.
const ONE_C_DEFAULT_TENANT = "aminamed";

function resolve1cTenantId(_actor) {
  // TODO: когда появится несколько тенантов — определять по actor.tenantId.
  return ONE_C_DEFAULT_TENANT;
}

// ─── Мультибаза: 3 юр.лица Аминамед = 3 отдельные базы 1С:Фреш ──────────
// Креды общие (берутся из one_c_settings: host/username/password), варьируется
// только base_path. Организация-отправитель (Организация_Key) у каждой своя.
const ONE_C_BASES = {
  aminamed: {
    label: "ТОО Аминамед",
    basePath: "/a/ea186/263825",
    orgRef: "8678efaa-9684-4325-a198-7f3c8a1bc2f3",
    currencyRef: "9e9a6ffb-aa56-11e1-b9c4-002215ba1bbe", // KZT
    warehouseRef: "c4d32421-aa56-11e1-b9c4-002215ba1bbe", // Основной склад
    bin: "060540006532",
  },
  alisherova: {
    label: "ИП Алишерова",
    basePath: "/a/ea189/264981",
    orgRef: "d0455782-d295-11e5-bf5f-001a4d5d6b30",
    currencyRef: "d0455781-d295-11e5-bf5f-001a4d5d6b30", // KZT
    warehouseRef: "d0455949-d295-11e5-bf5f-001a4d5d6b30", // Основной склад
    bin: "470927401685",
  },
  baymukhanova: {
    label: "ИП Баймуханова К.А.",
    basePath: "/a/ea68/264980",
    orgRef: "f9f0a501-a9ed-11ee-9866-f8b15698efb3",
    currencyRef: "dda1de7d-a9ed-11ee-9866-f8b15698efb3", // KZT
    warehouseRef: "f9f0a504-a9ed-11ee-9866-f8b15698efb3", // Основной склад
    bin: "730330400012",
  },
};
const ONE_C_DEFAULT_BASE = "aminamed";

// Бухгалтерская аналитика строк реализации для базы Аминамед. GUID-ы плана счетов
// и субконто СВОИ у каждой базы, поэтому блок применяется ТОЛЬКО для aminamed.
// Значения сверены по 51 строке реальных проведённых реализаций (все идентичны):
//   счёт учёта/доходов/себестоимости/НДС, статья доходов «Доход от реализации
//   товара», номенклатурная группа «Товары», статья затрат «Себестоимость товаров».
// Через OData 1С не заполняет аналитику строки сама — иначе у Асем «не садится».
const ONE_C_AMINAMED_REAL_LINE_ACCOUNTS = {
  СчетУчетаБУ_Key: "f0f0c706-e37a-4156-b430-0d4a6fbdecc3",
  СчетУчетаНУ_Key: "b7a16180-2cf5-4920-af55-a0c8e37f9356",
  СчетДоходовБУ_Key: "ac7aab45-1127-4549-8d0c-659cedbab312",
  СчетДоходовНУ_Key: "5501ffb4-1f90-46eb-ba21-cf05a2763550",
  СчетСписанияСебестоимостиБУ_Key: "46c23ea9-3e23-4666-b28e-ac56d15305ba",
  СчетСписанияСебестоимостиНУ_Key: "6e52e195-7efc-4f2a-ba4b-65cdcd8c09f3",
  СчетУчетаНДСПоРеализации_Key: "05c0dc58-5cfc-4f6f-a37b-66ee68a56966",
  НДСВидОперацииРеализации_Key: "0fbefb02-5c4e-4169-9fff-c159a570092b",
  СубконтоДоходовБУ1: "b3d07cd4-9e79-11e7-b969-1c1b0dc9a089",
  СубконтоДоходовБУ1_Type: "StandardODATA.Catalog_Доходы",
  СубконтоДоходовБУ2: "c4d3242b-aa56-11e1-b9c4-002215ba1bbe",
  СубконтоДоходовБУ2_Type: "StandardODATA.Catalog_НоменклатурныеГруппы",
  СубконтоДоходовНУ1: "b3d07cd4-9e79-11e7-b969-1c1b0dc9a089",
  СубконтоДоходовНУ1_Type: "StandardODATA.Catalog_Доходы",
  СубконтоСписанияСебестоимостиБУ1: "cafb169d-aa56-11e1-b9c4-002215ba1bbe",
  СубконтоСписанияСебестоимостиБУ1_Type: "StandardODATA.Catalog_СтатьиЗатрат",
  СубконтоСписанияСебестоимостиБУ2: "c4d3242b-aa56-11e1-b9c4-002215ba1bbe",
  СубконтоСписанияСебестоимостиБУ2_Type: "StandardODATA.Catalog_НоменклатурныеГруппы",
  СубконтоСписанияСебестоимостиНУ1: "cafb169d-aa56-11e1-b9c4-002215ba1bbe",
  СубконтоСписанияСебестоимостиНУ1_Type: "StandardODATA.Catalog_СтатьиЗатрат",
  СубконтоСписанияСебестоимостиНУ2: "c4d3242b-aa56-11e1-b9c4-002215ba1bbe",
  СубконтоСписанияСебестоимостиНУ2_Type: "StandardODATA.Catalog_НоменклатурныеГруппы",
};

function resolve1cBaseKey(value) {
  const k = String(value || "").trim();
  return ONE_C_BASES[k] ? k : ONE_C_DEFAULT_BASE;
}

function require1cAdmin(actor) {
  if (!canManageUsers(actor)) {
    throw new HttpError(403, "Только администратор может управлять интеграцией с 1С");
  }
}

async function d1Get1cSettings(env, tenantId) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const row = await db
    .prepare(`
      SELECT tenant_id, host, base_path, odata_username, odata_password_encrypted,
             config_type, config_version, enabled,
             last_sync_at, last_test_at, last_test_ok, last_test_error,
             created_at, updated_at
        FROM one_c_settings
       WHERE tenant_id = ?
    `)
    .bind(tenantId)
    .first();
  return row || null;
}

async function d1Save1cSettings(env, tenantId, payload, encryptedPassword) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(`
      INSERT INTO one_c_settings (
        tenant_id, host, base_path, odata_username, odata_password_encrypted,
        config_type, config_version, enabled, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(tenant_id) DO UPDATE SET
        host                     = excluded.host,
        base_path                = excluded.base_path,
        odata_username           = excluded.odata_username,
        odata_password_encrypted = excluded.odata_password_encrypted,
        config_type              = excluded.config_type,
        config_version           = excluded.config_version,
        enabled                  = excluded.enabled,
        updated_at               = excluded.updated_at
    `)
    .bind(
      tenantId,
      payload.host,
      payload.base_path,
      payload.odata_username,
      encryptedPassword,
      payload.config_type || null,
      payload.config_version || null,
      payload.enabled === false ? 0 : 1,
      now,
      now
    )
    .run();
}

async function d1Save1cTestResult(env, tenantId, ok, errorMessage) {
  const db = requireStoreDb(env);
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(`
      UPDATE one_c_settings
         SET last_test_at = ?, last_test_ok = ?, last_test_error = ?
       WHERE tenant_id = ?
    `)
    .bind(now, ok ? 1 : 0, errorMessage || null, tenantId)
    .run();
}

async function d1Save1cSyncMark(env, tenantId) {
  const db = requireStoreDb(env);
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(`UPDATE one_c_settings SET last_sync_at = ? WHERE tenant_id = ?`)
    .bind(now, tenantId)
    .run();
}

async function d1Insert1cSyncLog(env, entry) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  await db
    .prepare(`
      INSERT INTO one_c_sync_log (
        tenant_id, ts, direction, entity_type, operation, status,
        http_status, error_code, error_message, records_processed, duration_ms
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `)
    .bind(
      entry.tenantId,
      Math.floor(Date.now() / 1000),
      entry.direction,
      entry.entityType,
      entry.operation,
      entry.status,
      entry.httpStatus ?? null,
      entry.errorCode ?? null,
      entry.errorMessage ?? null,
      entry.recordsProcessed ?? null,
      entry.durationMs ?? null
    )
    .run();
}

// ─── 1С ID-map (Pllato.id ↔ 1С.Ref_Key) ─────────────────────────────────

async function d1Get1cIdByRefKey(env, tenantId, entityType, refKey) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const row = await db
    .prepare(`
      SELECT pllato_id, one_c_data_version
        FROM one_c_id_map
       WHERE tenant_id = ? AND entity_type = ? AND one_c_ref_key = ?
    `)
    .bind(tenantId, entityType, refKey)
    .first();
  return row || null;
}

/**
 * Bulk-upsert контрагентов из 1С в store(contacts) + one_c_id_map.
 * Использует D1 batch API — все INSERT за 2 round trip к D1 вместо N*3.
 * Returns { created, updated, skipped }.
 */
async function bulk1cUpsertContacts(env, tenantId, contractors) {
  const db = requireStoreDb(env);
  const refKeys = contractors.map((c) => c.ref_key).filter(Boolean);
  if (refKeys.length === 0) return { created: 0, updated: 0, skipped: contractors.length };
  const existingByRef = await fetchExistingIdMap(db, tenantId, "contractor", refKeys);

  // 2) Готовим payload-ы.
  const now = Date.now();
  const nowSec = Math.floor(now / 1000);
  const storeStmts = [];
  const mapStmts = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const c of contractors) {
    const existingId = existingByRef.get(c.ref_key);
    const contact = contractorToCrmContact(c, existingId);
    if (!contact) { skipped++; continue; }
    const data = JSON.stringify({ ...contact, createdAt: now, updatedAt: now });
    storeStmts.push(
      db.prepare(`
        INSERT INTO store (team_id, collection, id, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(team_id, collection, id) DO UPDATE SET
          data = excluded.data,
          updated_at = excluded.updated_at
      `).bind(TEAM_ID, "contacts", contact.id, data, now, now)
    );
    mapStmts.push(
      db.prepare(`
        INSERT INTO one_c_id_map (tenant_id, entity_type, pllato_id, one_c_ref_key, one_c_data_version, synced_at)
        VALUES (?,?,?,?,?,?)
        ON CONFLICT(tenant_id, entity_type, pllato_id) DO UPDATE SET
          one_c_ref_key      = excluded.one_c_ref_key,
          one_c_data_version = excluded.one_c_data_version,
          synced_at          = excluded.synced_at
      `).bind(tenantId, "contractor", contact.id, c.ref_key, c.data_version || null, nowSec)
    );
    if (existingId) updated++; else created++;
  }

  // 3) Bulk batch с чанками по 50 — D1 имеет лимит на размер batch и индивидуального запроса.
  const CHUNK = 50;
  for (let i = 0; i < storeStmts.length; i += CHUNK) {
    await db.batch(storeStmts.slice(i, i + CHUNK));
  }
  for (let i = 0; i < mapStmts.length; i += CHUNK) {
    await db.batch(mapStmts.slice(i, i + CHUNK));
  }
  return { created, updated, skipped };
}

/**
 * Bulk-upsert сырых сущностей (продуктов/договоров/организаций) в store + one_c_id_map.
 * Returns { created, updated }.
 */
/**
 * Получает существующие маппинги Ref_Key → pllato_id чанками,
 * чтобы не упереться в лимит D1 на 100 параметров в одном запросе.
 */
async function fetchExistingIdMap(db, tenantId, entityType, refKeys) {
  const out = new Map();
  // tenant_id + entity_type занимают 2 параметра, оставляем по 90 для IN ().
  const CHUNK = 90;
  for (let i = 0; i < refKeys.length; i += CHUNK) {
    const chunk = refKeys.slice(i, i + CHUNK);
    const placeholders = chunk.map(() => "?").join(",");
    const rows = await db
      .prepare(`SELECT one_c_ref_key, pllato_id FROM one_c_id_map WHERE tenant_id = ? AND entity_type = ? AND one_c_ref_key IN (${placeholders})`)
      .bind(tenantId, entityType, ...chunk)
      .all();
    for (const r of rows?.results || []) out.set(r.one_c_ref_key, r.pllato_id);
  }
  return out;
}

async function bulk1cUpsertStore(env, tenantId, entityType, storeCollection, items) {
  const db = requireStoreDb(env);
  const refKeys = items.map((x) => x.ref_key).filter(Boolean);
  if (refKeys.length === 0) return { created: 0, updated: 0 };
  const existingByRef = await fetchExistingIdMap(db, tenantId, entityType, refKeys);

  const now = Date.now();
  const nowSec = Math.floor(now / 1000);
  const storeStmts = [];
  const mapStmts = [];
  let created = 0;
  let updated = 0;

  for (const item of items) {
    const existingId = existingByRef.get(item.ref_key);
    const id = existingId || crypto.randomUUID();
    const doc = { id, ...item, _1c_ref_key: item.ref_key, _1c_data_version: item.data_version, createdAt: now, updatedAt: now };
    const data = JSON.stringify(doc);
    storeStmts.push(
      db.prepare(`
        INSERT INTO store (team_id, collection, id, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(team_id, collection, id) DO UPDATE SET
          data = excluded.data,
          updated_at = excluded.updated_at
      `).bind(TEAM_ID, storeCollection, id, data, now, now)
    );
    mapStmts.push(
      db.prepare(`
        INSERT INTO one_c_id_map (tenant_id, entity_type, pllato_id, one_c_ref_key, one_c_data_version, synced_at)
        VALUES (?,?,?,?,?,?)
        ON CONFLICT(tenant_id, entity_type, pllato_id) DO UPDATE SET
          one_c_ref_key      = excluded.one_c_ref_key,
          one_c_data_version = excluded.one_c_data_version,
          synced_at          = excluded.synced_at
      `).bind(tenantId, entityType, id, item.ref_key, item.data_version || null, nowSec)
    );
    if (existingId) updated++; else created++;
  }

  const CHUNK = 50;
  for (let i = 0; i < storeStmts.length; i += CHUNK) {
    await db.batch(storeStmts.slice(i, i + CHUNK));
  }
  for (let i = 0; i < mapStmts.length; i += CHUNK) {
    await db.batch(mapStmts.slice(i, i + CHUNK));
  }
  return { created, updated };
}

async function d1Upsert1cIdMap(env, tenantId, entityType, pllatoId, refKey, dataVersion) {
  const db = requireStoreDb(env);
  const now = Math.floor(Date.now() / 1000);
  await db
    .prepare(`
      INSERT INTO one_c_id_map (tenant_id, entity_type, pllato_id, one_c_ref_key, one_c_data_version, synced_at)
      VALUES (?,?,?,?,?,?)
      ON CONFLICT(tenant_id, entity_type, pllato_id) DO UPDATE SET
        one_c_ref_key      = excluded.one_c_ref_key,
        one_c_data_version = excluded.one_c_data_version,
        synced_at          = excluded.synced_at
    `)
    .bind(tenantId, entityType, pllatoId, refKey, dataVersion || null, now)
    .run();
}

async function build1cClient(env, tenantId, baseKey) {
  const settings = await d1Get1cSettings(env, tenantId);
  if (!settings) {
    throw new HttpError(404, "Настройки 1С для этого тенанта не заданы");
  }
  if (!settings.enabled) {
    throw new HttpError(400, "Интеграция с 1С отключена для этого тенанта");
  }
  const password = await decryptPassword(env, settings.odata_password_encrypted);
  // Мультибаза: при baseKey берём base_path выбранного юр.лица, креды общие.
  let basePath = settings.base_path;
  let resolvedBase = ONE_C_DEFAULT_BASE;
  if (baseKey && ONE_C_BASES[baseKey]) {
    basePath = ONE_C_BASES[baseKey].basePath;
    resolvedBase = baseKey;
  }
  const client = new ODataClient({
    host: settings.host,
    basePath,
    username: settings.odata_username,
    password,
  });
  return { client, settings, baseKey: resolvedBase };
}

function settingsToPublicView(row) {
  if (!row) return null;
  return {
    tenant_id: row.tenant_id,
    host: row.host,
    base_path: row.base_path,
    odata_username: row.odata_username,
    config_type: row.config_type,
    config_version: row.config_version,
    enabled: Number(row.enabled) === 1,
    last_sync_at: row.last_sync_at,
    last_test_at: row.last_test_at,
    last_test_ok: row.last_test_ok == null ? null : Number(row.last_test_ok) === 1,
    last_test_error: row.last_test_error,
    created_at: row.created_at,
    updated_at: row.updated_at,
    has_password: Boolean(row.odata_password_encrypted),
  };
}

// Мини-страница для смены пароля OData 1С без консоли (в интерфейсе CRM такой
// формы нет). Открывается на origin воркера, поэтому fetch к /api/crm/1c/* идёт
// тем же origin. Авторизация — токен сессии CRM (вставляется из Local Storage),
// все вызовы проверяются require1cAdmin на бэке. noindex.
const ONE_C_SETUP_PAGE_HTML = `<!doctype html>
<html lang="ru"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>1С: обновить пароль OData</title>
<style>
 body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:24px auto;padding:0 16px;color:#1f2937}
 h1{font-size:20px} h2{font-size:15px;margin-top:6px}
 label{display:block;font-size:13px;color:#6b7280;margin:12px 0 4px}
 input,textarea{width:100%;box-sizing:border-box;padding:10px;border:1px solid #d1d5db;border-radius:8px;font:inherit}
 textarea{height:84px}
 button{margin-top:14px;padding:10px 16px;border:0;border-radius:8px;background:#16a34a;color:#fff;font:inherit;cursor:pointer}
 .box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-top:14px}
 .ok{color:#16a34a} .err{color:#dc2626} .muted{color:#6b7280;font-size:13px}
 ol{font-size:13px;color:#374151;padding-left:18px;line-height:1.55} code{background:#eef;padding:1px 4px;border-radius:4px}
 #step2{display:none}
</style></head><body>
<h1>1С:Фреш — обновить пароль OData</h1>
<p class="muted">Меняет пароль технического подключения 1С в CRM. Нужен доступ администратора.</p>

<div class="box">
<h2>Шаг 1. Вставь ключ сессии</h2>
<ol>
<li>На вкладке <b>crm.aminamed.kz</b>: DevTools → вкладка <b>Application</b> (Приложение).</li>
<li>Слева: <b>Local Storage</b> → <code>https://crm.aminamed.kz</code>.</li>
<li>Ключ <code>pllato_session</code> → справа скопируй <b>Value</b> целиком.</li>
<li>Вставь сюда (в поле вставка Cmd+V работает):</li>
</ol>
<textarea id="sess" placeholder='значение pllato_session (начинается с {&quot;token&quot;:...)'></textarea>
<button id="connect">Подключиться</button>
<div id="connres" class="muted" style="margin-top:8px"></div>
</div>

<div class="box" id="step2">
<h2>Шаг 2. Новый пароль OData</h2>
<div class="muted">Логин 1С: <b id="uname"></b><br>Сервер: <span id="host"></span></div>
<label>Новый пароль для этого логина</label>
<input id="pwd" type="text" autocomplete="off" placeholder="новый пароль 1С">
<button id="save">Сохранить и проверить связь</button>
<div id="saveres" style="margin-top:8px"></div>
</div>

<script>
 var B=location.origin, TOKEN=null;
 function el(id){return document.getElementById(id);}
 function tok(raw){raw=(raw||'').trim();if(raw.charAt(0)==='{'){try{return JSON.parse(raw).token||'';}catch(e){return '';}}return raw;}
 function hdr(){return {'Content-Type':'application/json','Authorization':'Bearer '+TOKEN};}
 el('connect').onclick=async function(){
   TOKEN=tok(el('sess').value);
   if(!TOKEN){el('connres').innerHTML='<span class=err>Не нашёл token. Скопируй значение pllato_session целиком.</span>';return;}
   el('connres').textContent='Проверяю...';
   try{
     var r=await fetch(B+'/api/crm/1c/settings',{headers:hdr()});
     var d=await r.json();
     if(!r.ok||!d.settings){el('connres').innerHTML='<span class=err>'+(d.error||('HTTP '+r.status))+'</span>';return;}
     el('uname').textContent=d.settings.odata_username||'(не задан)';
     el('host').textContent=(d.settings.host||'')+(d.settings.base_path||'');
     el('connres').innerHTML='<span class=ok>Подключено. Проверь логин и впиши новый пароль ниже.</span>';
     el('step2').style.display='block';
   }catch(e){el('connres').innerHTML='<span class=err>'+e.message+'</span>';}
 };
 el('save').onclick=async function(){
   var p=el('pwd').value;
   if(!p){el('saveres').innerHTML='<span class=err>Впиши пароль.</span>';return;}
   el('saveres').textContent='Сохраняю...';
   try{
     var cur=(await (await fetch(B+'/api/crm/1c/settings',{headers:hdr()})).json()).settings;
     var sv=await fetch(B+'/api/crm/1c/settings',{method:'POST',headers:hdr(),body:JSON.stringify({host:cur.host,base_path:cur.base_path,odata_username:cur.odata_username,odata_password:p})});
     var sd=await sv.json();
     if(!sv.ok){el('saveres').innerHTML='<span class=err>Не сохранил: '+(sd.error||sv.status)+'</span>';return;}
     el('saveres').textContent='Сохранено. Проверяю связь с 1С...';
     var t=await fetch(B+'/api/crm/1c/test-connection',{method:'POST',headers:hdr()});
     var td=await t.json();
     var R=(td&&td.result)?td.result:td; // ответ может быть {ok,...} или {result:{ok,...}}
     if(t.ok&&R&&R.ok){
       el('saveres').innerHTML='<div class=box><span class=ok><b>Готово. Связь с 1С есть.</b></span><br>Коллекций в 1С: '+(R.collections_total||'?')+'<br>Вернись в CRM и нажми «Синхронизировать из 1С».</div>';
     }else{
       el('saveres').innerHTML='<div class=box><span class=err><b>Пароль сохранён, но связь не прошла.</b></span><br>'+JSON.stringify(td.error||td)+'<br>Скорее всего пароль не тот или не тот логин 1С.</div>';
     }
   }catch(e){el('saveres').innerHTML='<span class=err>'+e.message+'</span>';}
 };
</script>
</body></html>`;

async function handle1cGetSettings(_request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const row = await d1Get1cSettings(env, tenantId);
  return { settings: settingsToPublicView(row) };
}

async function handle1cSaveSettings(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const body = await readRequestBodyAsJson(request);

  const host = String(body?.host || "").trim().replace(/\/+$/, "");
  const basePath = String(body?.base_path || "").trim();
  const username = String(body?.odata_username || "").trim();
  const password = body?.odata_password;
  const enabled = body?.enabled !== false;

  if (!host || !/^https?:\/\//i.test(host)) {
    throw new HttpError(400, "host должен начинаться с http(s)://");
  }
  if (!basePath || !basePath.startsWith("/")) {
    throw new HttpError(400, "base_path должен начинаться с /");
  }
  if (!username) {
    throw new HttpError(400, "odata_username не задан");
  }

  // Пароль необязателен при апдейте — если не прислали, оставляем существующий.
  let encryptedPassword;
  if (typeof password === "string" && password.length > 0) {
    encryptedPassword = await encryptPassword(env, password);
  } else {
    const existing = await d1Get1cSettings(env, tenantId);
    if (!existing) {
      throw new HttpError(400, "Пароль OData-пользователя обязателен при первом сохранении");
    }
    encryptedPassword = existing.odata_password_encrypted;
  }

  await d1Save1cSettings(
    env,
    tenantId,
    {
      host,
      base_path: basePath,
      odata_username: username,
      config_type: body?.config_type || null,
      config_version: body?.config_version || null,
      enabled,
    },
    encryptedPassword
  );
  const row = await d1Get1cSettings(env, tenantId);
  return { settings: settingsToPublicView(row), ok: true };
}

async function handle1cTestConnection(_request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const started = Date.now();
  let result;
  try {
    const { client } = await build1cClient(env, tenantId);
    const ping = await client.ping();
    result = { ok: true, collections_total: ping.collections_total };
    await d1Save1cTestResult(env, tenantId, true, null);
    await d1Insert1cSyncLog(env, {
      tenantId,
      direction: "test",
      entityType: "_root",
      operation: "test_connection",
      status: "ok",
      httpStatus: 200,
      recordsProcessed: ping.collections_total,
      durationMs: Date.now() - started,
    });
  } catch (e) {
    const httpStatus = e instanceof ODataError ? e.httpStatus : null;
    const message = e?.message || String(e);
    result = { ok: false, error: message, http_status: httpStatus };
    await d1Save1cTestResult(env, tenantId, false, message);
    await d1Insert1cSyncLog(env, {
      tenantId,
      direction: "test",
      entityType: "_root",
      operation: "test_connection",
      status: "error",
      httpStatus,
      errorMessage: message,
      durationMs: Date.now() - started,
    });
  }
  return result;
}

// Маппит нормализованного контрагента из 1С в CRM-контакт (коллекция `contacts`).
// Пропускает группы (IsFolder) и помеченные на удаление.
function contractorToCrmContact(c, existingId) {
  if (!c || c.is_folder || c.deletion_mark) return null;
  const name = c.name || c.full_name || "Без названия";
  const company = c.full_name && c.full_name !== name ? c.full_name : (c.is_individual_entrepreneur ? "" : name);
  const noteParts = [];
  if (c.iin) noteParts.push(`ИИН: ${c.iin}`);
  if (c.bin) noteParts.push(`БИН: ${c.bin}`);
  if (c.kbe) noteParts.push(`КБЕ: ${c.kbe}`);
  if (c.code) noteParts.push(`Код 1С: ${c.code}`);
  if (c.comment) noteParts.push(c.comment);
  return {
    id: existingId || crypto.randomUUID(),
    name,
    company,
    phone: "",
    email: "",
    position: c.is_individual_entrepreneur ? "ИП" : "",
    source: "1c",
    tags: ["1С", c.is_individual_entrepreneur ? "ИП" : "ЮЛ"],
    note: noteParts.join(" | "),
    // 1С-специфичные поля для traceability
    _1c_ref_key: c.ref_key,
    _1c_data_version: c.data_version,
    _1c_iin: c.iin || null,
    _1c_bin: c.bin || null,
    _1c_kbe: c.kbe || null,
    _1c_code: c.code || null,
  };
}

async function handle1cPullContractors(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const url = new URL(request.url);
  const top = Math.min(Math.max(parseInt(url.searchParams.get("top") || "20", 10), 1), 500);
  const persist = url.searchParams.get("persist") !== "false"; // по умолчанию сохраняем
  const started = Date.now();
  try {
    const { client } = await build1cClient(env, tenantId);
    const data = await client.get("Catalog_Контрагенты", {
      top,
      select: [
        "Ref_Key",
        "DataVersion",
        "Code",
        "Description",
        "НаименованиеПолное",
        "DeletionMark",
        "IsFolder",
        "Parent_Key",
        "ГоловнойКонтрагент_Key",
        "ИдентификационныйКодЛичности",
        "НомерНалоговойРегистрацииВСтранеРезидентства",
        "РНН",
        "КБЕ",
        "ИндивидуальныйПредпринимательАдвокатЧастныйНотариус",
        "ДатаСвидетельстваПоНДС",
        "НомерСвидетельстваПоНДС",
        "СерияСвидетельстваПоНДС",
        "СИК",
        "КодПоОКПО",
        "Комментарий",
        "ОсновноеКонтактноеЛицо_Key",
        "ОсновнойБанковскийСчет_Key",
        "ОсновнойДоговорКонтрагента_Key",
        "СтранаРезидентства_Key",
      ],
      orderby: "Description",
    });
    const raw = Array.isArray(data?.value) ? data.value : [];
    const contractors = raw.map(contractorFromOData).filter(Boolean);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    if (persist && contractors.length > 0) {
      const stats = await bulk1cUpsertContacts(env, tenantId, contractors);
      created = stats.created;
      updated = stats.updated;
      skipped = stats.skipped;
    }

    await d1Save1cSyncMark(env, tenantId);
    await d1Insert1cSyncLog(env, {
      tenantId,
      direction: "pull",
      entityType: "contractor",
      operation: persist ? "upsert" : "read",
      status: "ok",
      httpStatus: 200,
      recordsProcessed: contractors.length,
      durationMs: Date.now() - started,
    });
    return {
      ok: true,
      count: contractors.length,
      created,
      updated,
      skipped,
      persisted: persist,
      contractors,
    };
  } catch (e) {
    const httpStatus = e instanceof ODataError ? e.httpStatus : null;
    const message = e?.message || String(e);
    await d1Insert1cSyncLog(env, {
      tenantId,
      direction: "pull",
      entityType: "contractor",
      operation: "read",
      status: "error",
      httpStatus,
      errorMessage: message,
      durationMs: Date.now() - started,
    });
    if (e instanceof HttpError) throw e;
    throw new HttpError(httpStatus && httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502, message);
  }
}

// Универсальная фабрика "тянем из OData коллекцию + сохраняем как сырое в store".
// Поддерживает постраничный пул ($skip/$top) для больших справочников
// (номенклатура ~7700 позиций). Upsert идемпотентен по Ref_Key — при таймауте
// середине повторный запуск безопасно до-докачивает. Возвращает
// { ok, count, created, updated, pages }.
async function pull1cToStore({ env, tenantId, collection1c, entityType, storeCollection, mapper, pageSize = 500, maxPages = 1 }) {
  const started = Date.now();
  try {
    const { client } = await build1cClient(env, tenantId);
    // Не используем $select/$orderby — в нетиповых конфигурациях (1С-Рейтинг и т.п.)
    // имена полей могут отличаться от стандартных, что даёт 400. Берём все поля,
    // маппер выберет нужное и игнорирует лишнее.
    let skip = 0;
    let page = 0;
    let totalMapped = 0;
    let created = 0;
    let updated = 0;
    while (page < maxPages) {
      const data = await client.get(collection1c, { top: pageSize, skip });
      const raw = Array.isArray(data?.value) ? data.value : [];
      if (raw.length === 0) break;
      const mapped = raw.map(mapper).filter((x) => x && !x.is_folder && !x.deletion_mark);
      if (mapped.length > 0) {
        const stats = await bulk1cUpsertStore(env, tenantId, entityType, storeCollection, mapped);
        created += stats.created;
        updated += stats.updated;
      }
      totalMapped += mapped.length;
      page += 1;
      if (raw.length < pageSize) break; // последняя страница
      skip += pageSize;
    }

    await d1Save1cSyncMark(env, tenantId);
    await d1Insert1cSyncLog(env, {
      tenantId,
      direction: "pull",
      entityType,
      operation: "upsert",
      status: "ok",
      httpStatus: 200,
      recordsProcessed: totalMapped,
      durationMs: Date.now() - started,
    });
    return { ok: true, count: totalMapped, created, updated, pages: page };
  } catch (e) {
    const httpStatus = e instanceof ODataError ? e.httpStatus : null;
    const message = e?.message || String(e);
    await d1Insert1cSyncLog(env, {
      tenantId,
      direction: "pull",
      entityType,
      operation: "upsert",
      status: "error",
      httpStatus,
      errorMessage: message,
      durationMs: Date.now() - started,
    });
    if (e instanceof HttpError) throw e;
    throw new HttpError(httpStatus && httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502, message);
  }
}

async function handle1cPullProducts(_request, env, actor) {
  require1cAdmin(actor);
  // Номенклатура ~7700. $skip в этой базе 1С ненадёжен (окна перекрываются),
  // зато один большой $top отдаёт всё разом — тянем одним запросом.
  return pull1cToStore({
    env,
    tenantId: resolve1cTenantId(actor),
    collection1c: "Catalog_Номенклатура",
    entityType: "product",
    storeCollection: "products_1c",
    mapper: productFromOData,
    pageSize: 10000,
    maxPages: 1,
  });
}

async function handle1cPullContracts(_request, env, actor) {
  require1cAdmin(actor);
  // Договоров ~3700 — тянем все одним большим $top ($skip ненадёжен).
  return pull1cToStore({
    env,
    tenantId: resolve1cTenantId(actor),
    collection1c: "Catalog_ДоговорыКонтрагентов",
    entityType: "contract",
    storeCollection: "contracts_1c",
    mapper: contractFromOData,
    pageSize: 10000,
    maxPages: 1,
  });
}

/**
 * Тянет регистр сведений КонтактнаяИнформация — там лежат телефоны/email/адреса
 * для контрагентов, контактных лиц, организаций. Обогащает уже импортированные
 * контакты (контрагенты в коллекции `contacts`) полями phone и email.
 *
 * Структура записи в регистре (типовая БСП):
 *   Объект_Key  — GUID владельца (контрагент / контактное лицо / организация)
 *   Тип         — "Телефон" / "АдресЭлектроннойПочты" / "Адрес" / "ВебСтраница"
 *   Вид_Key     — конкретный вид (рабочий, основной и т.д.)
 *   Представление — текстовое значение (форматированное)
 *   НомерТелефона — отдельное поле для типа Телефон
 *   АдресЭП       — отдельное поле для типа Email
 */
// Читает весь регистр сведений постранично ($skip), т.к. в нём бывает > 1000 строк,
// а $filter в этой БП (1С-Рейтинг) ломает OData. Возвращает массив строк.
async function fetch1cRegisterAllRows(client, collection, pageSize = 1000, maxPages = 50) {
  const all = [];
  let skip = 0;
  for (let page = 0; page < maxPages; page++) {
    const data = await client.get(collection, { top: pageSize, skip });
    const rows = Array.isArray(data?.value) ? data.value : [];
    all.push(...rows);
    if (rows.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

function uniqPush(arr, value) {
  const v = String(value || "").trim();
  if (v && !arr.includes(v)) arr.push(v);
}

async function handle1cPullContactInfo(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const started = Date.now();
  const url = new URL(request.url);
  const baseParam = url.searchParams.get("base");
  // По умолчанию обходим все юр.лица: контрагент может быть импортирован из любой базы,
  // совпадение идёт по _1c_ref_key, лишние строки просто не находят пары.
  const baseKeys = baseParam ? [resolve1cBaseKey(baseParam)] : Object.keys(ONE_C_BASES);
  try {
    // Группируем контактные данные по Объект (Ref_Key владельца) из всех баз.
    // Реальная структура регистра в этой БП:
    //   Объект        — GUID владельца (контрагент / контактное лицо / организация)
    //   Объект_Type   — "StandardODATA.Catalog_Контрагенты" и т.п.
    //   Тип           — "Адрес" / "Телефон" / "АдресЭлектроннойПочты" / "ВебСтраница"
    //   Представление — текстовое значение (адрес/телефон/email одной строкой)
    const byObject = new Map();
    const perBase = [];
    let rawTotal = 0;
    for (const baseKey of baseKeys) {
      const { client } = await build1cClient(env, tenantId, baseKey);
      const raw = await fetch1cRegisterAllRows(client, "InformationRegister_КонтактнаяИнформация");
      rawTotal += raw.length;
      let objs = 0;
      for (const r of raw) {
        const objType = String(r.Объект_Type || "");
        // Интересуют только контрагенты — их Ref_Key хранится в contact._1c_ref_key.
        if (!/Контрагенты/i.test(objType)) continue;
        const key = r.Объект || r.Объект_Key || r.Object;
        if (!key) continue;
        if (!byObject.has(key)) { byObject.set(key, { phones: [], emails: [], addresses: [] }); objs++; }
        const bucket = byObject.get(key);
        const type = String(r.Тип || r.Type || "").toLowerCase();
        const presentation = String(r.Представление || "").trim();
        if (!presentation) continue;
        if (type.includes("телефон") || type.includes("phone")) {
          uniqPush(bucket.phones, presentation);
        } else if (type.includes("электрон") || type.includes("email") || type.includes("почт") || type.includes("эп")) {
          if (presentation.includes("@")) uniqPush(bucket.emails, presentation);
        } else if (type.includes("адрес") || type.includes("address")) {
          uniqPush(bucket.addresses, presentation);
        }
      }
      perBase.push({ base: baseKey, info_records: raw.length, objects: objs });
    }

    // Берём все contacts из CRM, у которых _1c_ref_key выставлен, и обогащаем
    // телефон/email/адрес. Заполнение неразрушающее: существующие phone/email не
    // перезатираем, но всегда сохраняем полные списки из 1С в служебных полях.
    const db = requireStoreDb(env);
    const contactRows = await db
      .prepare(`SELECT id, data FROM store WHERE team_id = ? AND collection = ?`)
      .bind(TEAM_ID, "contacts")
      .all();

    let matched = 0;
    let enriched = 0;
    const updateStmts = [];
    const now = Date.now();
    for (const row of contactRows?.results || []) {
      let contact;
      try { contact = JSON.parse(row.data); } catch { continue; }
      const refKey = contact?._1c_ref_key;
      if (!refKey) continue;
      const bucket = byObject.get(refKey);
      if (!bucket) continue;
      matched++;
      const newPhone = bucket.phones[0] || "";
      const newEmail = bucket.emails[0] || "";
      const newAddress = bucket.addresses[0] || "";
      const fillPhone = !contact.phone && newPhone;
      const fillEmail = !contact.email && newEmail;
      const arrChanged =
        JSON.stringify(contact._1c_phones_all || []) !== JSON.stringify(bucket.phones) ||
        JSON.stringify(contact._1c_emails_all || []) !== JSON.stringify(bucket.emails) ||
        JSON.stringify(contact._1c_addresses_all || []) !== JSON.stringify(bucket.addresses);
      const addrChanged = newAddress && contact._1c_address !== newAddress;
      if (!fillPhone && !fillEmail && !arrChanged && !addrChanged) continue;
      const updated = {
        ...contact,
        phone: contact.phone || newPhone || "",
        email: contact.email || newEmail || "",
        _1c_address: newAddress || contact._1c_address || "",
        _1c_phones_all: bucket.phones,
        _1c_emails_all: bucket.emails,
        _1c_addresses_all: bucket.addresses,
        updatedAt: now,
      };
      updateStmts.push(
        db.prepare(`
          UPDATE store SET data = ?, updated_at = ?
           WHERE team_id = ? AND collection = ? AND id = ?
        `).bind(JSON.stringify(updated), now, TEAM_ID, "contacts", row.id)
      );
      enriched++;
    }

    const CHUNK = 50;
    for (let i = 0; i < updateStmts.length; i += CHUNK) {
      await db.batch(updateStmts.slice(i, i + CHUNK));
    }

    await d1Save1cSyncMark(env, tenantId);
    await d1Insert1cSyncLog(env, {
      tenantId,
      direction: "pull",
      entityType: "contact_info",
      operation: "enrich",
      status: "ok",
      httpStatus: 200,
      recordsProcessed: rawTotal,
      durationMs: Date.now() - started,
    });
    return {
      ok: true,
      bases: perBase,
      info_records: rawTotal,
      objects_with_info: byObject.size,
      contacts_matched: matched,
      contacts_enriched: enriched,
    };
  } catch (e) {
    const httpStatus = e instanceof ODataError ? e.httpStatus : null;
    const message = e?.message || String(e);
    await d1Insert1cSyncLog(env, {
      tenantId,
      direction: "pull",
      entityType: "contact_info",
      operation: "enrich",
      status: "error",
      httpStatus,
      errorMessage: message,
      durationMs: Date.now() - started,
    });
    if (e instanceof HttpError) throw e;
    throw new HttpError(httpStatus && httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502, message);
  }
}

async function handle1cPullOrganizations(_request, env, actor) {
  require1cAdmin(actor);
  return pull1cToStore({
    env,
    tenantId: resolve1cTenantId(actor),
    collection1c: "Catalog_Организации",
    entityType: "organization",
    storeCollection: "organizations_1c",
    mapper: organizationFromOData,
  });
}

async function handle1cSyncLog(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10), 1), 500);
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const result = await db
    .prepare(`
      SELECT id, ts, direction, entity_type, operation, status,
             http_status, error_code, error_message, records_processed, duration_ms
        FROM one_c_sync_log
       WHERE tenant_id = ?
       ORDER BY ts DESC
       LIMIT ?
    `)
    .bind(tenantId, limit)
    .all();
  return { ok: true, entries: result?.results || [] };
}

// ─── 1С push: создание счёта на оплату из сделки CRM ─────────────────────

/** Обратный к d1Get1cIdByRefKey: pllato_id → Ref_Key (GUID 1С). */
async function d1Get1cRefByPllatoId(env, tenantId, entityType, pllatoId) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const row = await db
    .prepare(`
      SELECT one_c_ref_key, one_c_data_version
        FROM one_c_id_map
       WHERE tenant_id = ? AND entity_type = ? AND pllato_id = ?
    `)
    .bind(tenantId, entityType, String(pllatoId))
    .first();
  return row || null;
}

function oneCBool(v) {
  return v === true || v === "true" || v === 1;
}

// Ведущий «артикул» в начале наименования товара: «1610 Тегадерм…» → «1610»,
// «4-100 Стери-Газ» → «4-100», «R1540 стери-стрип» → «R1540». Берём первый токен
// до пробела, в верхнем регистре, без хвостовой пунктуации. Используется как
// второй ключ матчинга склад↔1С (sku у части товаров = AUTO_…, артикул в названии).
function oneCLeadingToken(s) {
  const t = String(s || "").trim();
  if (!t) return "";
  const m = t.match(/^[^\s]+/);
  if (!m) return "";
  return m[0].toUpperCase().replace(/[.,;:]+$/, "");
}

/**
 * POST /api/crm/1c/invoices/create — создаёт Document_СчетНаОплатуПокупателю в 1С.
 *
 * Тело запроса:
 *   externalId* | dealId*  — id сделки/заказа Pllato (идемпотентность)
 *   organizationRef*       — Организация_Key (наше юр.лицо, GUID 1С)
 *   currencyRef*           — ВалютаДокумента_Key (GUID 1С)
 *   contractorRef | contactId* — клиент (GUID 1С или id контакта CRM → резолв)
 *   contractRef, warehouseRef, priceTypeRef, responsibleRef — опц. GUID-ы
 *   date, vatIncluded, accountForVat, comment, total — опц.
 *   post: bool             — провести документ (PATCH Posted=true) после создания
 *   lines*: [ { productRef | productId, unitRef, qty*, price*, sum, vatRateRef, vatSum, name } ]
 *
 * Идемпотентность: external_id вшивается в Комментарий + проверяется one_c_id_map
 * (entity_type='invoice', pllato_id=externalId) до создания — повтор не дублирует.
 */
// ─── Хелперы живого резолва в выбранной базе (мультибаза) ────────────────

// БИН/ИИН контакта CRM (из явного значения, поля или из note).
async function getContactBin(env, contactId, binFromBody) {
  const direct = String(binFromBody || "").trim();
  if (direct) return direct;
  if (!contactId) return "";
  const db = requireStoreDb(env);
  const row = await db.prepare(`SELECT data FROM store WHERE team_id=? AND collection=? AND id=?`)
    .bind(TEAM_ID, "contacts", String(contactId)).first();
  if (!row) return "";
  let c;
  try { c = JSON.parse(row.data); } catch { return ""; }
  return String(c._1c_bin || c.bin || extractIdFromNote(c.note, "БИН") || extractIdFromNote(c.note, "ИИН") || "").trim();
}

// ВАЖНО: стандартный OData-интерфейс 1С НЕ поддерживает $filter по строковым
// функциям (substringof/startswith/like → 400) и нестабилен по eq. Поэтому любой
// поиск делаем ВЫГРУЗКОЙ всей коллекции (top=10000, без $filter — это работает
// надёжно, как в матчинге) и фильтрацией в памяти. Объёмы (сотни–тысячи) ОК.

// Поиск контрагента в подключённой базе по БИН/ИИН (сверка по цифрам).
async function oneCFindContractorByBin(client, bin) {
  const target = String(bin).replace(/\D/g, "");
  if (!target) return null;
  const data = await client.get("Catalog_Контрагенты", { top: 10000 });
  const rows = Array.isArray(data?.value) ? data.value : [];
  for (const raw of rows) {
    const c = contractorFromOData(raw);
    if (!c || c.is_folder || c.deletion_mark) continue;
    const digits = [c.bin, c.iin, c.rnn_legacy].map((x) => String(x || "").replace(/\D/g, ""));
    if (digits.includes(target)) return c;
  }
  return null;
}

// Основной договор контрагента — для автоподстановки ДоговорКонтрагента_Key, когда
// в заказе договор не выбран («договор не сел» у Асем).
async function oneCContractorPrimaryContract(client, contractorRef) {
  if (!contractorRef) return null;
  try {
    const c = await client.getByKey("Catalog_Контрагенты", contractorRef, {
      select: ["ОсновнойДоговорКонтрагента_Key"],
    });
    const ref = c?.ОсновнойДоговорКонтрагента_Key;
    if (ref && ref !== "00000000-0000-0000-0000-000000000000") return ref;
  } catch { /* у контрагента может не быть основного договора — не критично */ }
  return null;
}

// Адрес контрагента из регистра контактной информации — фолбэк, когда в заказе
// адрес доставки не задан («адрес поставки не сел» у Асем). Берём первый непустой
// адрес контрагента.
async function oneCContractorAddress(client, contractorRef) {
  if (!contractorRef) return null;
  try {
    const rows = await fetch1cRegisterAllRows(client, "InformationRegister_КонтактнаяИнформация");
    const isAddr = (r) => String(r?.Тип || r?.Type || "").toLowerCase().includes("адрес");
    const objOf = (r) => r?.Объект || r?.Объект_Key || r?.Object;
    for (const r of rows) {
      if (isAddr(r) && objOf(r) === contractorRef) {
        const repr = String(r?.Представление || "").trim();
        if (repr) return repr;
      }
    }
  } catch { /* нет адреса — не критично */ }
  return null;
}

// Нормализация кода каталога/«Артикул»/«Код» для матчинга (трим + верхний регистр).
function normCatalogCode(s) {
  return String(s || "").trim().toUpperCase();
}

// Единый индекс номенклатуры выбранной базы 1С (один проход по Catalog_Номенклатура):
//   byArticle — «Артикул» → {ref,unit,vat} (полный новый код карточки, напр. NEW-ТОО-0018);
//   byCode    — «Код»      → {ref,unit,vat} (короткий код карточки, напр. ТОО-0018);
//   byToken   — ведущий числовой токен названия → {ref,unit,vat} (старый фолбэк-резолв).
// Первая запись на ключ — представительная. Общий ключ нового каталога — «Артикул».
async function build1cNomenIndex(client) {
  const data = await client.get("Catalog_Номенклатура", { top: 10000 });
  const rows = Array.isArray(data?.value) ? data.value : [];
  const byArticle = new Map();
  const byCode = new Map();
  const byToken = new Map();
  for (const raw of rows) {
    const p = productFromOData(raw);
    if (!p || p.is_folder || p.deletion_mark || !p.ref_key) continue;
    const rec = { ref: p.ref_key, unit: p.unit_ref || null, vat: p.vat_rate_ref || null };
    const art = normCatalogCode(p.article);
    const code = normCatalogCode(p.code);
    if (art && !byArticle.has(art)) byArticle.set(art, rec);
    if (code && !byCode.has(code)) byCode.set(code, rec);
    const tok = oneCLeadingToken(p.name);
    if (tok && /\d/.test(tok) && !byToken.has(tok)) byToken.set(tok, rec);
  }
  return { byArticle, byCode, byToken };
}

// Резолв строки заказа из нового каталога → карточка 1С по «Артикул» (новый код).
// Гочи: в 1С «Код» = «Артикул» без префикса NEW- (макс 11 символов), поэтому
// пробуем код как есть, без NEW- и с NEW-, и по «Артикул», и по «Код».
function resolveCatalogNomenRef(index, code) {
  const norm = normCatalogCode(code);
  if (!norm) return null;
  const stripped = norm.replace(/^NEW-/, "");
  for (const c of [norm, stripped, `NEW-${stripped}`]) {
    const hit = index.byArticle.get(c) || index.byCode.get(c);
    if (hit) return hit;
  }
  return null;
}

// Общий механизм создания «торгового» документа в 1С (счёт / реализация).
// МУЛЬТИБАЗА: body.base выбирает юр.лицо/базу. Контрагент резолвится по БИН, а
// номенклатура — по артикулу ВЖИВУЮ в выбранной базе (внутр. коды у баз разные).
// Документ создаётся ЧЕРНОВИКОМ. opts = { collection, entityType, idPrefix, paymentPurposeCode }.
async function create1cSalesDocument(request, env, actor, opts) {
  const { collection, entityType, idPrefix, paymentPurposeCode } = opts;
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const body = await readRequestBodyAsJson(request);
  const externalId = String(body?.externalId || body?.dealId || "").trim();
  if (!externalId) {
    throw new HttpError(400, "externalId (id сделки/заказа Pllato) обязателен для идемпотентности");
  }
  const baseKey = resolve1cBaseKey(body?.base);
  const baseLabel = ONE_C_BASES[baseKey].label;
  // Ключ id_map с суффиксом базы (кроме aminamed — обратная совместимость).
  const mapEntity = baseKey === ONE_C_DEFAULT_BASE ? entityType : `${entityType}@${baseKey}`;
  const doPost = oneCBool(body?.post) || oneCBool(body?.posted);
  const started = Date.now();

  const { client } = await build1cClient(env, tenantId, baseKey);

  // 1) Идемпотентность — документ для этого externalId в этой базе уже создан?
  const existing = await d1Get1cRefByPllatoId(env, tenantId, mapEntity, externalId);
  if (existing?.one_c_ref_key) {
    try {
      let posted = null;
      if (doPost) {
        await client.patch(collection, existing.one_c_ref_key, { Posted: true });
        posted = true;
      }
      const re = await client.getByKey(collection, existing.one_c_ref_key, {
        select: ["Ref_Key", "Number", "Date", "Posted", "СуммаДокумента"],
      });
      const norm = invoiceFromOData(re);
      return {
        ok: true, already_exists: true, ref_key: existing.one_c_ref_key,
        number: norm?.number || null, posted: posted ?? Boolean(norm?.posted),
        total: norm?.total ?? null, base: baseKey,
      };
    } catch (e) {
      return { ok: true, already_exists: true, ref_key: existing.one_c_ref_key, base: baseKey };
    }
  }

  // 2) Контрагент — в выбранной базе. Для aminamed сперва сохранённый маппинг,
  // иначе/для остальных баз — живой поиск по БИН.
  let contractorRef = null;
  if (baseKey === ONE_C_DEFAULT_BASE) {
    contractorRef = String(body?.contractorRef || "").trim() || null;
    if (!contractorRef && body?.contactId) {
      const m = await d1Get1cRefByPllatoId(env, tenantId, "contractor", String(body.contactId));
      contractorRef = m?.one_c_ref_key || null;
    }
  }
  if (!contractorRef) {
    const bin = await getContactBin(env, body?.contactId, body?.bin);
    if (bin) {
      const hit = await oneCFindContractorByBin(client, bin);
      contractorRef = hit?.ref_key || null;
    }
  }
  if (!contractorRef) {
    throw new HttpError(400, `Клиент не найден в базе «${baseLabel}» по БИН. Создайте контрагента в этой базе (кнопка в диалоге).`);
  }

  // 3) Строки — номенклатура в выбранной базе.
  const rawLines = Array.isArray(body?.lines) ? body.lines : [];
  if (rawLines.length === 0) throw new HttpError(400, "lines пуст — нужна хотя бы одна позиция");
  const lines = [];
  const skipped = [];
  let nomenIndex = null; // индекс номенклатуры базы; строится один раз при первой необходимости
  for (const ln of rawLines) {
    let productRef = null;
    let unitRef = ln?.unitRef || null;
    let vatRateRef = ln?.vatRateRef || null;
    // 1) Новый каталог: строка несёт «Артикул» (новый код) → резолвим Ref_Key
    //    карточки 1С по «Артикул» (документы садятся на новые карточки).
    const article = String(ln?.article || ln?.catalogRef || ln?.productCode || "").trim();
    if (article) {
      if (!nomenIndex) nomenIndex = await build1cNomenIndex(client);
      const hit = resolveCatalogNomenRef(nomenIndex, article);
      if (hit) { productRef = hit.ref; unitRef = unitRef || hit.unit; vatRateRef = vatRateRef || hit.vat; }
    }
    // 2) Сохранённый прямой матч (старый путь warehouse_products, только Аминамед).
    if (!productRef && baseKey === ONE_C_DEFAULT_BASE && ln?.productRef) {
      productRef = String(ln.productRef).trim();
    }
    // 3) Фолбэк: живой резолв по ведущему числовому токену названия.
    if (!productRef) {
      if (!nomenIndex) nomenIndex = await build1cNomenIndex(client);
      const tok = oneCLeadingToken(ln?.name);
      const hit = tok ? nomenIndex.byToken.get(tok) : null;
      if (hit) { productRef = hit.ref; unitRef = unitRef || hit.unit; vatRateRef = vatRateRef || hit.vat; }
    }
    if (!productRef) { skipped.push(ln?.name || ln?.productId || "?"); continue; }
    lines.push({
      productRef, unitRef,
      qty: Number(ln?.qty) || 0,
      price: Number(ln?.price) || 0,
      sum: ln?.sum != null ? Number(ln.sum) : undefined,
      vatRateRef,
      vatSum: ln?.vatSum != null ? Number(ln.vatSum) : undefined,
    });
  }
  if (lines.length === 0) {
    throw new HttpError(400, `Ни одна позиция не сопоставлена с номенклатурой базы «${baseLabel}». Не найдено: ${skipped.slice(0, 8).join("; ")}`);
  }

  // 4) Шапка. Организация/валюта/склад по умолчанию — из конфига выбранной базы.
  // Валюту берём ИЗ КОНФИГА БАЗЫ (у каждой базы свой GUID KZT; фронт знает только
  // Аминамедовский), фронтовый currencyRef — только запасной.
  const organizationRef = String(body?.organizationRef || "").trim() || ONE_C_BASES[baseKey].orgRef;
  const currencyRef = ONE_C_BASES[baseKey].currencyRef || String(body?.currencyRef || "").trim();
  if (!currencyRef) throw new HttpError(400, "currencyRef (валюта документа, GUID 1С) обязателен");

  // Договор и адрес доставки: берём из заказа, иначе автоподстановка из 1С (основной
  // договор контрагента / его адрес). СФ этих полей не имеет → не трогаем.
  // Закрывает замечания Асем «договор не сел» и «адрес поставки не сел».
  let contractRef = String(body?.contractRef || "").trim() || null;
  let deliveryAddress = entityType === "facture" ? null : (String(body?.deliveryAddress || "").trim() || null);
  if (entityType !== "facture") {
    if (!contractRef) contractRef = await oneCContractorPrimaryContract(client, contractorRef);
    if (!deliveryAddress) deliveryAddress = await oneCContractorAddress(client, contractorRef);
  }

  try {
    const payload = invoiceToOData({
      date: body?.date,
      organizationRef,
      contractorRef,
      currencyRef,
      contractRef,
      // Простая СФ (Document_СчетФактураВыданный) НЕ имеет поля Склад_Key → пропускаем.
      warehouseRef: entityType === "facture"
        ? null
        : (body?.warehouseRef || ONE_C_BASES[baseKey].warehouseRef || null),
      priceTypeRef: body?.priceTypeRef || null,
      responsibleRef: body?.responsibleRef || null,
      vatIncluded: body?.vatIncluded,
      accountForVat: body?.accountForVat,
      externalId,
      externalIdPrefix: idPrefix,
      // СФ не имеет полей КодНазначенияПлатежа и АдресДоставки → принудительно null,
      // иначе OData вернёт 400 на неизвестное поле.
      paymentPurposeCode: entityType === "facture" ? null : (body?.paymentPurposeCode || paymentPurposeCode || null),
      deliveryAddress,
      comment: body?.comment || "",
      total: body?.total,
      lines,
    });

    // Реализация: притянуть ранее созданный счёт (в той же базе) как основание.
    if (entityType === "realization") {
      const invEntity = baseKey === ONE_C_DEFAULT_BASE ? "invoice" : `invoice@${baseKey}`;
      const invMap = await d1Get1cRefByPllatoId(env, tenantId, invEntity, externalId);
      if (invMap?.one_c_ref_key) {
        payload.ДокументОснование = invMap.one_c_ref_key;
        payload.ДокументОснование_Type = "StandardODATA.Document_СчетНаОплатуПокупателю";
      }
      // КЗ-учёт: флаг КПН + бухгалтерская аналитика строк (доходы/себестоимость).
      // Только база Аминамед — GUID-ы плана счетов/субконто у баз разные.
      if (baseKey === ONE_C_DEFAULT_BASE) {
        payload.УчитыватьКПН = true;
        for (const row of (payload.Товары || [])) {
          Object.assign(row, ONE_C_AMINAMED_REAL_LINE_ACCOUNTS);
          // НУ-субконто2 доходов = сама номенклатура строки (per-product).
          row.СубконтоДоходовНУ2 = row.Номенклатура_Key;
          row.СубконтоДоходовНУ2_Type = "StandardODATA.Catalog_Номенклатура";
        }
      }
    }

    // Простая СФ (Счёт-фактура выданный): выписывается СТРОГО на основании
    // реализации в той же базе. Реализация обязана существовать.
    if (entityType === "facture") {
      const realEntity = baseKey === ONE_C_DEFAULT_BASE ? "realization" : `realization@${baseKey}`;
      const realMap = await d1Get1cRefByPllatoId(env, tenantId, realEntity, externalId);
      if (!realMap?.one_c_ref_key) {
        throw new HttpError(400, "Сначала создайте реализацию в 1С — простая счёт-фактура выписывается на её основании.");
      }
      payload.ДокументОснование = realMap.one_c_ref_key;
      payload.ДокументОснование_Type = "StandardODATA.Document_РеализацияТоваровУслуг";
      payload.ВидСчетаФактуры = "Обычный";
      payload.СпособВыставления = "Бумажно";
      payload.ДатаСовершенияОборотаПоРеализации = payload.Date;
      // У СФ табличная часть требует ОборотПоРеализации = Сумма строки.
      if (Array.isArray(payload.Товары)) {
        for (const row of payload.Товары) row.ОборотПоРеализации = row.Сумма;
      }
    }

    const created = await client.post(collection, payload);
    const refKey = created?.Ref_Key;
    if (!refKey) throw new HttpError(502, "1С не вернула Ref_Key созданного документа");
    await d1Upsert1cIdMap(env, tenantId, mapEntity, externalId, refKey, created?.DataVersion || null);

    let posted = oneCBool(created?.Posted);
    if (doPost && !posted) {
      try {
        await client.patch(collection, refKey, { Posted: true });
        posted = true;
      } catch (pe) {
        await d1Insert1cSyncLog(env, {
          tenantId, direction: "push", entityType: mapEntity, operation: "post", status: "error",
          httpStatus: pe instanceof ODataError ? pe.httpStatus : null,
          errorMessage: pe?.message || String(pe), durationMs: Date.now() - started,
        });
      }
    }

    await d1Insert1cSyncLog(env, {
      tenantId, direction: "push", entityType: mapEntity, operation: "create", status: "ok",
      httpStatus: 200, recordsProcessed: lines.length, durationMs: Date.now() - started,
    });
    return {
      ok: true, ref_key: refKey, number: (created?.Number || "").trim() || null,
      posted, lines: lines.length, total: payload.СуммаДокумента, base: baseKey,
      skipped: skipped.length,
    };
  } catch (e) {
    const httpStatus = e instanceof ODataError ? e.httpStatus : null;
    const message = e?.message || String(e);
    await d1Insert1cSyncLog(env, {
      tenantId, direction: "push", entityType: mapEntity, operation: "create", status: "error",
      httpStatus, errorMessage: message, durationMs: Date.now() - started,
    });
    if (e instanceof HttpError) throw e;
    throw new HttpError(httpStatus && httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502, message);
  }
}

function handle1cCreateInvoice(request, env, actor) {
  return create1cSalesDocument(request, env, actor, {
    collection: "Document_СчетНаОплатуПокупателю", entityType: "invoice", idPrefix: "PLLATO-INV",
    paymentPurposeCode: "710", // по указанию Асем
  });
}

function handle1cCreateRealization(request, env, actor) {
  return create1cSalesDocument(request, env, actor, {
    collection: "Document_РеализацияТоваровУслуг", entityType: "realization", idPrefix: "PLLATO-REAL",
  });
}

// Простая (бумажная) счёт-фактура выданная — на основании реализации.
// Асем формирует на их основе ЭСФ вручную (по субботам).
function handle1cCreateFacture(request, env, actor) {
  return create1cSalesDocument(request, env, actor, {
    collection: "Document_СчетФактураВыданный", entityType: "facture", idPrefix: "PLLATO-SF",
  });
}

/**
 * GET /api/crm/1c/inspect?collection=&top=&filter=&select= — read-only диагностика.
 * Нужна для подбора GUID-ов справочников (валюта KZT, ставки НДС, склад, единицы)
 * без записи в базу. Только чтение, только админ.
 */
// GET /api/crm/1c/collections?base=&q= — список ИМЁН всех коллекций OData
// (дискавери регистров: остатки, контактная информация и т.п.). Только чтение.
async function handle1cListCollections(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const url = new URL(request.url);
  const { client } = await build1cClient(env, tenantId, resolve1cBaseKey(url.searchParams.get("base")));
  const names = await client.listCollections();
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const filtered = (q ? names.filter((n) => n.toLowerCase().includes(q)) : names).sort();
  return { ok: true, total: names.length, count: filtered.length, collections: filtered };
}

async function handle1cInspect(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const url = new URL(request.url);
  const collection = (url.searchParams.get("collection") || "").trim();
  if (!collection || !/^[A-Za-zА-Яа-яЁё0-9_]+$/.test(collection)) {
    throw new HttpError(400, "collection обязателен (имя коллекции OData, напр. Catalog_Валюты)");
  }
  const top = Math.min(Math.max(parseInt(url.searchParams.get("top") || "5", 10), 1), 50);
  const filter = url.searchParams.get("filter") || undefined;
  const select = url.searchParams.get("select") || undefined;
  try {
    const { client } = await build1cClient(env, tenantId);
    const params = { top };
    if (filter) params.filter = filter;
    if (select) params.select = select.split(",").map((s) => s.trim()).filter(Boolean);
    const data = await client.get(collection, params);
    const value = Array.isArray(data?.value) ? data.value : [];
    return { ok: true, collection, count: value.length, value };
  } catch (e) {
    const httpStatus = e instanceof ODataError ? e.httpStatus : null;
    if (e instanceof HttpError) throw e;
    throw new HttpError(httpStatus && httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502, e?.message || String(e));
  }
}

/**
 * POST /api/crm/1c/sync/products/match?offset=&limit= — сопоставляет товары
 * склада CRM с номенклатурой 1С по коду (sku ↔ Code, формат «Т0000002188»).
 *
 * Источник кодов 1С — коллекция products_1c (нужно сперва «Загрузить
 * номенклатуру 1С»). Матчинг идёт СЕРВЕРНО по D1, курсором по warehouse_products
 * (offset/limit) — чтобы не упереться в лимиты воркера на больших каталогах.
 * На совпавший товар штампуется _1c_ref_key / _1c_unit_ref / _1c_vat_ref и
 * пишется one_c_id_map(entity='product', pllato_id=warehouse_product.id).
 *
 * Артикул в этой базе пустой → матч только по коду. Доп. нормализация: если
 * точного совпадения нет, сверяем по цифрам кода (на случай Кириллица/Латиница Т).
 */
async function handle1cMatchProducts(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const url = new URL(request.url);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "2000", 10), 1), 5000);
  const started = Date.now();
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  try {
    // 1) Карта Code → { ref, unit, vat } напрямую из 1С. $skip в этой базе
    // ненадёжен (окна перекрываются), но один большой $top отдаёт все ~7700
    // разом — берём так. Матчинг самодостаточен, products_1c не нужен.
    const { client } = await build1cClient(env, tenantId);
    const nomenData = await client.get("Catalog_Номенклатура", { top: 10000 });
    const nomenRaw = Array.isArray(nomenData?.value) ? nomenData.value : [];
    const byCode = new Map();
    const byDigits = new Map();
    const byNameToken = new Map();   // ведущий артикул → entry, ТОЛЬКО уникальные (надёжно)
    const nameTokenSeen = new Map(); // токен → сколько раз встретился
    let nomenclatureCount = 0;
    for (const raw of nomenRaw) {
      const p = productFromOData(raw);
      if (!p || p.is_folder || p.deletion_mark) continue;
      const code = String(p.code || "").trim();
      const ref = p.ref_key;
      if (!code || !ref) continue;
      nomenclatureCount += 1;
      const entry = { ref, unit: p.unit_ref || null, vat: p.vat_rate_ref || null };
      byCode.set(code, entry);
      const digits = code.replace(/\D/g, "");
      if (digits) byDigits.set(digits, entry);
      // Ведущий артикул в наименовании — индексируем ТОЛЬКО уникальные. Решение
      // встречи 01.06: номенклатура 1С задвоена по сериям/датам, надёжен только КОД;
      // задвоенные артикулы автоматически НЕ матчим (их привязывает Асем вручную).
      const tok = oneCLeadingToken(p.name);
      if (tok && /\d/.test(tok)) {
        const seen = (nameTokenSeen.get(tok) || 0) + 1;
        nameTokenSeen.set(tok, seen);
        if (seen === 1) byNameToken.set(tok, entry);
        else byNameToken.delete(tok); // стал неоднозначным — убираем
      }
    }
    if (nomenclatureCount === 0) {
      throw new HttpError(502, "1С вернула пустую номенклатуру");
    }

    // 2) Срез товаров склада.
    const whRows = await db
      .prepare(`SELECT id, data FROM store WHERE team_id = ? AND collection = ? ORDER BY id LIMIT ? OFFSET ?`)
      .bind(TEAM_ID, "warehouse_products", limit, offset)
      .all();
    const rows = whRows?.results || [];

    const now = Date.now();
    const nowSec = Math.floor(now / 1000);
    const updateStmts = [];
    const mapStmts = [];
    const sampleUnmatched = [];
    let matched = 0;
    let matchedByCode = 0;
    let matchedByName = 0;
    let matchedByRepr = 0;
    let unmatched = 0;
    for (const row of rows) {
      let prod;
      try { prod = JSON.parse(row.data); } catch { continue; }
      const sku = String(prod.sku || "").trim();
      let method = null;
      // 1) точный код 1С (sku = «Т0000…») — самый надёжный
      let hit = sku ? byCode.get(sku) : null;
      if (!hit && sku) {
        const d = sku.replace(/\D/g, "");
        if (d) hit = byDigits.get(d);
      }
      if (hit) method = "code";
      // 2) ведущий артикул в названии — только если уникален в 1С (см. выше).
      // Задвоенные сериями НЕ матчим автоматически → попадут в ручную привязку.
      if (!hit) {
        const tok = oneCLeadingToken(prod.name);
        if (tok && /\d/.test(tok)) {
          hit = byNameToken.get(tok);
          if (hit) method = "article";
        }
      }
      if (!hit) {
        unmatched += 1;
        if (sampleUnmatched.length < 15) sampleUnmatched.push({ sku: sku || "(пусто)", name: String(prod.name || "").slice(0, 50) });
        continue;
      }
      if (method === "code") matchedByCode += 1;
      else if (method === "article") matchedByName += 1;
      else matchedByRepr += 1;
      const updated = {
        ...prod,
        _1c_ref_key: hit.ref,
        _1c_unit_ref: hit.unit,
        _1c_vat_ref: hit.vat,
        _1c_match_method: method,
        _1c_match_ambiguous: method === "article_repr",
        _1c_matched_at: now,
        updatedAt: now,
      };
      updateStmts.push(
        db.prepare(`UPDATE store SET data = ?, updated_at = ? WHERE team_id = ? AND collection = ? AND id = ?`)
          .bind(JSON.stringify(updated), now, TEAM_ID, "warehouse_products", row.id)
      );
      mapStmts.push(
        db.prepare(`
          INSERT INTO one_c_id_map (tenant_id, entity_type, pllato_id, one_c_ref_key, one_c_data_version, synced_at)
          VALUES (?,?,?,?,?,?)
          ON CONFLICT(tenant_id, entity_type, pllato_id) DO UPDATE SET
            one_c_ref_key = excluded.one_c_ref_key,
            synced_at     = excluded.synced_at
        `).bind(tenantId, "product", row.id, hit.ref, null, nowSec)
      );
      matched += 1;
    }

    const CHUNK = 50;
    for (let i = 0; i < updateStmts.length; i += CHUNK) await db.batch(updateStmts.slice(i, i + CHUNK));
    for (let i = 0; i < mapStmts.length; i += CHUNK) await db.batch(mapStmts.slice(i, i + CHUNK));

    const nextOffset = rows.length < limit ? null : offset + rows.length;
    await d1Insert1cSyncLog(env, {
      tenantId, direction: "pull", entityType: "product_match", operation: "match", status: "ok",
      httpStatus: 200, recordsProcessed: rows.length, durationMs: Date.now() - started,
    });
    return {
      ok: true,
      nomenclature_total: nomenclatureCount,
      processed: rows.length,
      matched,
      matched_by_code: matchedByCode,
      matched_by_name: matchedByName,
      matched_by_repr: matchedByRepr,
      unmatched,
      offset,
      next_offset: nextOffset,
      sample_unmatched: sampleUnmatched,
      sample_1c_codes: [...byCode.keys()].slice(0, 5),
    };
  } catch (e) {
    const message = e?.message || String(e);
    await d1Insert1cSyncLog(env, {
      tenantId, direction: "pull", entityType: "product_match", operation: "match", status: "error",
      errorMessage: message, durationMs: Date.now() - started,
    });
    if (e instanceof HttpError) throw e;
    throw new HttpError(502, message);
  }
}

// Достаёт ИИН/БИН из текстового поля note контакта («ИИН: 123 | БИН: 456»).
function extractIdFromNote(note, label) {
  if (!note) return null;
  const m = String(note).match(new RegExp(label + "\\s*[:：]\\s*([0-9A-Za-z]+)"));
  return m ? m[1] : null;
}

// POST /api/crm/1c/contractors/create — создаёт контрагента в 1С из контакта CRM.
async function handle1cCreateContractor(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const body = await readRequestBodyAsJson(request);
  const contactId = String(body?.contactId || "").trim();
  if (!contactId) throw new HttpError(400, "contactId обязателен");
  const baseKey = resolve1cBaseKey(body?.base);
  const mapEntity = baseKey === ONE_C_DEFAULT_BASE ? "contractor" : `contractor@${baseKey}`;
  const started = Date.now();

  const existing = await d1Get1cRefByPllatoId(env, tenantId, mapEntity, contactId);
  if (existing?.one_c_ref_key) {
    return { ok: true, already_exists: true, ref_key: existing.one_c_ref_key, base: baseKey };
  }

  const db = requireStoreDb(env);
  const row = await db.prepare(`SELECT data FROM store WHERE team_id=? AND collection=? AND id=?`)
    .bind(TEAM_ID, "contacts", contactId).first();
  if (!row) throw new HttpError(404, "Контакт не найден в CRM");
  let contact;
  try { contact = JSON.parse(row.data); } catch { throw new HttpError(500, "Битые данные контакта"); }

  const customer = {
    name: contact.name || contact.company || "Клиент",
    full_name: contact.company || contact.name || "",
    iin: contact._1c_iin || extractIdFromNote(contact.note, "ИИН") || null,
    bin: contact._1c_bin || extractIdFromNote(contact.note, "БИН") || null,
    comment: "Создан из Pllato CRM",
  };
  try {
    const { client } = await build1cClient(env, tenantId, baseKey);
    // Если контрагент с таким БИН уже есть в этой базе — не плодим дубль, привязываем.
    let refKey = null;
    let foundExisting = false;
    const binToFind = customer.bin || customer.iin;
    if (binToFind) {
      const found = await oneCFindContractorByBin(client, binToFind);
      if (found?.ref_key) { refKey = found.ref_key; foundExisting = true; }
    }
    if (!refKey) {
      const created = await client.post("Catalog_Контрагенты", contractorToOData(customer));
      refKey = created?.Ref_Key;
    }
    if (!refKey) throw new HttpError(502, "1С не вернула Ref_Key контрагента");
    await d1Upsert1cIdMap(env, tenantId, mapEntity, contactId, refKey, null);
    // _1c_ref_key на контакте храним только для базы по умолчанию (Аминамед).
    if (baseKey === ONE_C_DEFAULT_BASE) {
      const now = Date.now();
      const updated = { ...contact, _1c_ref_key: refKey, updatedAt: now };
      await db.prepare(`UPDATE store SET data=?, updated_at=? WHERE team_id=? AND collection=? AND id=?`)
        .bind(JSON.stringify(updated), now, TEAM_ID, "contacts", contactId).run();
    }
    await d1Insert1cSyncLog(env, { tenantId, direction: "push", entityType: mapEntity, operation: foundExisting ? "link" : "create", status: "ok", httpStatus: 200, recordsProcessed: 1, durationMs: Date.now() - started });
    return { ok: true, ref_key: refKey, name: customer.name, base: baseKey, already_exists: foundExisting };
  } catch (e) {
    const httpStatus = e instanceof ODataError ? e.httpStatus : null;
    const message = e?.message || String(e);
    await d1Insert1cSyncLog(env, { tenantId, direction: "push", entityType: mapEntity, operation: "create", status: "error", httpStatus, errorMessage: message, durationMs: Date.now() - started });
    if (e instanceof HttpError) throw e;
    throw new HttpError(httpStatus && httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502, message);
  }
}

// POST /api/crm/1c/contacts/add-address — записать новый адрес доставки в карточку
// контрагента 1С (регистр сведений КонтактнаяИнформация).
//
// КОНСЕРВАТИВНО И БЕЗОПАСНО (БП 1С-Рейтинг — нетиповая конфигурация):
//   • структуру записи берём из РЕАЛЬНОГО образца адресной строки регистра
//     (ничего не выдумываем — клонируем поля, которые 1С уже принимает);
//   • пишем ТОЛЬКО под СВОБОДНЫМ видом адреса этого контрагента — никогда не
//     перезатираем уже существующий (юридический/фактический) адрес;
//   • дубликат адреса не добавляем повторно;
//   • при любой неудаче адрес остаётся сохранён в CRM (источник истины), а ответ
//     содержит понятную причину.
async function handle1cAddContractorAddress(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const body = await readRequestBodyAsJson(request);
  const contactId = String(body?.contactId || "").trim();
  const address = String(body?.address || "").trim();
  if (!contactId) throw new HttpError(400, "contactId обязателен");
  if (!address) throw new HttpError(400, "address обязателен");
  if (address.length > 500) throw new HttpError(400, "Слишком длинный адрес (макс. 500 символов)");
  const baseKey = resolve1cBaseKey(body?.base);
  const mapEntity = baseKey === ONE_C_DEFAULT_BASE ? "contractor" : `contractor@${baseKey}`;
  const started = Date.now();

  // 1) Контакт CRM + Ref_Key контрагента в 1С.
  const db = requireStoreDb(env);
  const row = await db.prepare(`SELECT data FROM store WHERE team_id=? AND collection=? AND id=?`)
    .bind(TEAM_ID, "contacts", contactId).first();
  if (!row) throw new HttpError(404, "Контакт не найден в CRM");
  let contact;
  try { contact = JSON.parse(row.data); } catch { throw new HttpError(500, "Битые данные контакта"); }

  let refKey = baseKey === ONE_C_DEFAULT_BASE ? (contact._1c_ref_key || null) : null;
  if (!refKey) {
    const m = await d1Get1cRefByPllatoId(env, tenantId, mapEntity, contactId);
    refKey = m?.one_c_ref_key || null;
  }
  if (!refKey) {
    throw new HttpError(400, "Контрагент не привязан к 1С в этой базе — сначала найдите/создайте его в 1С.");
  }

  // Хелперы чтения полей регистра (имена полей варьируются между конфигурациями).
  const isAddrType = (r) => String(r?.Тип || r?.Type || "").toLowerCase().includes("адрес");
  const objOf = (r) => r?.Объект || r?.Объект_Key || r?.Object;
  const vidKeyOf = (r) => r?.Вид_Key || r?.ВидКонтактнойИнформации_Key || r?.Вид || r?.ВидКонтактнойИнформации || null;
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();

  try {
    const { client } = await build1cClient(env, tenantId, baseKey);
    // 2) Все строки регистра (фильтруем в памяти — $filter в этой БП ломает OData).
    const rows = await fetch1cRegisterAllRows(client, "InformationRegister_КонтактнаяИнформация");
    const addrRows = rows.filter(isAddrType);
    const mineAddr = addrRows.filter((r) => objOf(r) === refKey);

    // Уже есть точно такой адрес — не дублируем, обновляем CRM-кеш и выходим.
    if (mineAddr.some((r) => norm(r.Представление) === norm(address))) {
      await cacheContactAddress(db, contactId, contact, address);
      return { ok: true, already_exists: true, ref_key: refKey, base: baseKey, address };
    }

    // 3) Образец строки-адреса — для точной структуры полей.
    const template = mineAddr[0]
      || addrRows.find((r) => /Контрагент/i.test(String(r.Объект_Type || "")))
      || addrRows[0]
      || null;
    if (!template) {
      throw new HttpError(422, "В 1С нет ни одной адресной строки-образца — вид адреса не настроен в базе. Обратитесь к 1С-партнёру для настройки «Вида контактной информации» (адрес).");
    }

    // 4) Свободный вид адреса (не перезатираем существующие у этого контрагента).
    const usedVids = new Set(mineAddr.map(vidKeyOf).filter(Boolean));
    const score = (n) => {
      const s = String(n || "").toLowerCase();
      if (/доставк/.test(s)) return 3;
      if (/фактическ/.test(s)) return 2;
      if (/прочий|прочая|почтов/.test(s)) return 1;
      return 0;
    };
    let chosenVidKey = null;
    let chosenVidType = template.Вид_Type || "StandardODATA.Catalog_ВидыКонтактнойИнформации";

    // 4a) Из справочника видов (если он так называется в этой конфигурации).
    try {
      const vids = await client.get("Catalog_ВидыКонтактнойИнформации", { top: 200 });
      const list = (Array.isArray(vids?.value) ? vids.value : [])
        .filter((v) => String(v.Тип || "").toLowerCase().includes("адрес"))
        .filter((v) => !usedVids.has(v.Ref_Key));
      list.sort((a, b) => score(b.Description || b.Наименование) - score(a.Description || a.Наименование));
      if (list[0]) chosenVidKey = list[0].Ref_Key;
    } catch { /* справочник может называться иначе — деградируем на виды из строк регистра */ }

    // 4b) Запасной источник видов — те, что реально встречаются в адресных строках.
    if (!chosenVidKey) {
      const byVid = new Map();
      for (const r of addrRows) {
        const vk = vidKeyOf(r);
        if (vk && !usedVids.has(vk) && !byVid.has(vk)) byVid.set(vk, r);
      }
      const cands = [...byVid.values()];
      cands.sort((a, b) => score(b.Вид) - score(a.Вид));
      if (cands[0]) { chosenVidKey = vidKeyOf(cands[0]); chosenVidType = cands[0].Вид_Type || chosenVidType; }
    }
    if (!chosenVidKey) {
      throw new HttpError(409, "Все виды адреса у контрагента уже заняты — нет свободного вида, чтобы добавить адрес без перезаписи существующего. Добавьте новый «Вид контактной информации» (адрес) в 1С.");
    }

    // 5) Клонируем образец, переопределяем владельца / вид / представление.
    const record = { ...template };
    delete record["@odata.etag"];
    delete record["@odata.context"];
    if ("Объект" in record) record.Объект = refKey; else record.Объект_Key = refKey;
    if (template.Объект_Type) record.Объект_Type = template.Объект_Type;
    if ("Вид_Key" in record) record.Вид_Key = chosenVidKey;
    else if ("ВидКонтактнойИнформации_Key" in record) record.ВидКонтактнойИнформации_Key = chosenVidKey;
    else record.Вид = chosenVidKey;
    if ("Вид_Type" in record) record.Вид_Type = chosenVidType;
    record.Тип = template.Тип || "Адрес";
    record.Представление = address;
    // Структурные поля адреса обнуляем — чтобы не тащить координаты чужого адреса.
    for (const f of ["ЗначенияПолей", "Значение", "КодРегиона", "Страна", "Страна_Key", "Поле1", "Поле2"]) {
      if (f in record && typeof record[f] === "string") record[f] = "";
    }

    await client.post("InformationRegister_КонтактнаяИнформация", record);

    // 6) Обновляем кеш адресов в CRM-контакте.
    await cacheContactAddress(db, contactId, contact, address);
    await d1Insert1cSyncLog(env, { tenantId, direction: "push", entityType: "contact_address", operation: "create", status: "ok", httpStatus: 200, recordsProcessed: 1, durationMs: Date.now() - started });
    return { ok: true, ref_key: refKey, base: baseKey, address, vid_key: chosenVidKey };
  } catch (e) {
    const httpStatus = e instanceof ODataError ? e.httpStatus : null;
    const message = e?.message || String(e);
    await d1Insert1cSyncLog(env, { tenantId, direction: "push", entityType: "contact_address", operation: "create", status: "error", httpStatus, errorMessage: message, durationMs: Date.now() - started });
    if (e instanceof HttpError) throw e;
    throw new HttpError(httpStatus && httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502, message);
  }
}

// Дописывает адрес в служебный кеш контакта CRM (_1c_addresses_all) без перезаписи.
async function cacheContactAddress(db, contactId, contact, address) {
  const now = Date.now();
  const all = Array.isArray(contact._1c_addresses_all) ? contact._1c_addresses_all.slice() : [];
  if (!all.includes(address)) all.push(address);
  const updated = { ...contact, _1c_addresses_all: all, _1c_address: contact._1c_address || address, updatedAt: now };
  await db.prepare(`UPDATE store SET data=?, updated_at=? WHERE team_id=? AND collection=? AND id=?`)
    .bind(JSON.stringify(updated), now, TEAM_ID, "contacts", contactId).run();
}

// POST /api/crm/1c/contractors/find — найти контрагента в 1С ПО БИН/ИИН и привязать.
// Решение встречи 01.06: искать клиента в 1С по БИН (не по номеру/телефону).
async function handle1cFindContractorByBin(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const body = await readRequestBodyAsJson(request);
  const contactId = String(body?.contactId || "").trim();
  const baseKey = resolve1cBaseKey(body?.base);
  const mapEntity = baseKey === ONE_C_DEFAULT_BASE ? "contractor" : `contractor@${baseKey}`;
  let bin = String(body?.bin || "").trim();
  const db = requireStoreDb(env);
  let contact = null;
  if (contactId) {
    const row = await db.prepare(`SELECT data FROM store WHERE team_id=? AND collection=? AND id=?`)
      .bind(TEAM_ID, "contacts", contactId).first();
    if (row) { try { contact = JSON.parse(row.data); } catch {} }
  }
  if (!bin && contact) {
    bin = String(contact._1c_bin || contact.bin || extractIdFromNote(contact.note, "БИН") || extractIdFromNote(contact.note, "ИИН") || "").trim();
  }
  if (!bin) return { ok: true, found: false, reason: "no_bin" };
  try {
    const { client } = await build1cClient(env, tenantId, baseKey);
    const hit = await oneCFindContractorByBin(client, bin);
    if (!hit) return { ok: true, found: false, base: baseKey };
    if (contactId) {
      await d1Upsert1cIdMap(env, tenantId, mapEntity, contactId, hit.ref_key, hit.data_version || null);
      if (contact && baseKey === ONE_C_DEFAULT_BASE) {
        const now = Date.now();
        const updated = { ...contact, _1c_ref_key: hit.ref_key, _1c_bin: hit.bin || contact._1c_bin || null, updatedAt: now };
        await db.prepare(`UPDATE store SET data=?, updated_at=? WHERE team_id=? AND collection=? AND id=?`)
          .bind(JSON.stringify(updated), now, TEAM_ID, "contacts", contactId).run();
      }
    }
    return { ok: true, found: true, ref_key: hit.ref_key, name: hit.name || hit.full_name, bin: hit.bin, code: hit.code, base: baseKey };
  } catch (e) {
    const httpStatus = e instanceof ODataError ? e.httpStatus : null;
    if (e instanceof HttpError) throw e;
    throw new HttpError(httpStatus && httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502, e?.message || String(e));
  }
}

// GET /api/crm/1c/contractors/search?q=&base= — поиск контрагентов 1С по названию/БИН
// (для «выбрать из похожих», когда по БИН не нашёлся). Выгрузка-в-память + фильтр.
async function handle1cContractorSearch(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (q.length < 2) return { ok: true, results: [] };
  try {
    const { client } = await build1cClient(env, tenantId, resolve1cBaseKey(url.searchParams.get("base")));
    const data = await client.get("Catalog_Контрагенты", { top: 10000 });
    const raw = Array.isArray(data?.value) ? data.value : [];
    const ql = q.toLowerCase();
    const digits = ql.replace(/\D/g, "");
    const results = raw.map(contractorFromOData)
      .filter((c) => c && !c.is_folder && !c.deletion_mark && (
        String(c.name || c.full_name || "").toLowerCase().includes(ql) ||
        (digits.length >= 4 && [c.bin, c.iin, c.rnn_legacy].some((x) => String(x || "").replace(/\D/g, "").includes(digits)))
      ))
      .slice(0, 20)
      .map((c) => ({ ref: c.ref_key, name: c.name || c.full_name, bin: c.bin || c.iin || null, code: c.code }));
    return { ok: true, results };
  } catch (e) {
    const httpStatus = e instanceof ODataError ? e.httpStatus : null;
    if (e instanceof HttpError) throw e;
    throw new HttpError(httpStatus && httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502, e?.message || String(e));
  }
}

// POST /api/crm/1c/contractors/map {contactId, refKey, base} — привязать контакт CRM
// к выбранному контрагенту 1С (из «похожих»). Штампует id_map + (Аминамед) _1c_ref_key.
async function handle1cMapContractor(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const body = await readRequestBodyAsJson(request);
  const contactId = String(body?.contactId || "").trim();
  const refKey = String(body?.refKey || "").trim();
  const baseKey = resolve1cBaseKey(body?.base);
  if (!contactId || !refKey) throw new HttpError(400, "contactId и refKey обязательны");
  const mapEntity = baseKey === ONE_C_DEFAULT_BASE ? "contractor" : `contractor@${baseKey}`;
  await d1Upsert1cIdMap(env, tenantId, mapEntity, contactId, refKey, null);
  if (baseKey === ONE_C_DEFAULT_BASE) {
    const db = requireStoreDb(env);
    const row = await db.prepare(`SELECT data FROM store WHERE team_id=? AND collection=? AND id=?`)
      .bind(TEAM_ID, "contacts", contactId).first();
    if (row) {
      try {
        const contact = JSON.parse(row.data);
        const now = Date.now();
        const updated = { ...contact, _1c_ref_key: refKey, updatedAt: now };
        await db.prepare(`UPDATE store SET data=?, updated_at=? WHERE team_id=? AND collection=? AND id=?`)
          .bind(JSON.stringify(updated), now, TEAM_ID, "contacts", contactId).run();
      } catch {}
    }
  }
  return { ok: true, ref_key: refKey, base: baseKey };
}

// GET /api/crm/1c/nomenclature/search?q= — поиск номенклатуры 1С по названию.
async function handle1cNomenclatureSearch(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (q.length < 2) return { ok: true, results: [] };
  try {
    const { client } = await build1cClient(env, tenantId, resolve1cBaseKey(url.searchParams.get("base")));
    // $filter по подстроке в 1С OData не работает → тянем всё и фильтруем в памяти.
    const data = await client.get("Catalog_Номенклатура", { top: 10000 });
    const raw = Array.isArray(data?.value) ? data.value : [];
    const ql = q.toLowerCase();
    const results = raw.map(productFromOData)
      .filter((p) => p && !p.is_folder && !p.deletion_mark &&
        (String(p.name || "").toLowerCase().includes(ql) || String(p.code || "").toLowerCase().includes(ql)))
      .slice(0, 30)
      .map((p) => ({ ref: p.ref_key, code: p.code, name: p.name, unit: p.unit_ref, vat: p.vat_rate_ref }));
    return { ok: true, results };
  } catch (e) {
    const httpStatus = e instanceof ODataError ? e.httpStatus : null;
    if (e instanceof HttpError) throw e;
    throw new HttpError(httpStatus && httpStatus >= 400 && httpStatus < 600 ? httpStatus : 502, e?.message || String(e));
  }
}

// Обновляет зеркало номенклатуры одной базы: тянет Catalog_Номенклатура (+ имена
// единиц измерения для показа «шт» вместо GUID) и полностью переписывает строки
// этой базы в nomenclature_mirror. Возвращает число записанных позиций.
async function pullNomenclatureMirrorForBase(env, tenantId, baseKey) {
  const { client } = await build1cClient(env, tenantId, baseKey);

  // Номенклатуру тянем ПОСТРАНИЧНО и только нужные поля ($select). Один запрос на
  // 10 000 строк со всеми полями выбивал у 1С:Фреш защитный лимит (HTTP 402 →
  // кулдаун всего аккаунта). Лёгкие страницы с паузой держат нагрузку низкой.
  // У Catalog_Номенклатура единица — это БазоваяЕдиницаИзмерения_Key; поля
  // ЕдиницаИзмерения_Key тут НЕТ, и его наличие в $select даёт 400 OData.
  const NOMEN_SELECT = ["Ref_Key", "Code", "Description", "НаименованиеПолное", "Артикул",
    "БазоваяЕдиницаИзмерения_Key", "СтавкаНДС_Key", "IsFolder", "DeletionMark"];
  const PAGE = 2000;
  const raw = [];
  for (let skip = 0, page = 0; page < 40; page += 1) {
    const data = await client.get("Catalog_Номенклатура", { top: PAGE, skip, select: NOMEN_SELECT, orderby: "Ref_Key" });
    const chunk = Array.isArray(data?.value) ? data.value : [];
    raw.push(...chunk);
    if (chunk.length < PAGE) break;
    skip += PAGE;
    await new Promise((r) => setTimeout(r, 500)); // пауза между страницами — не давить на лимит
  }
  const now = Date.now();
  const rows = [];
  for (const r of raw) {
    const p = productFromOData(r);
    if (!p || p.is_folder || p.deletion_mark || !p.ref_key) continue;
    rows.push({
      id: p.ref_key, ref_key: p.ref_key, base: baseKey,
      code: p.code || null, name: p.name || null, article: p.article || null,
      unit_ref: p.unit_ref || null, vat_rate_ref: p.vat_rate_ref || null,
      is_folder: false, deletion_mark: false, stock: 0,
      createdAt: now, updatedAt: now,
    });
  }

  // Пишем в store-коллекцию nomenclature_1c_<base> — это «сырое зеркало 1С», ФОЛБЭК
  // для каталога. Утверждённый каталог (catalog_approved_*, ручные коды/Excel) НЕ
  // трогаем. Полная замена: старое чистим, новое пишем пачками (лимиты D1).
  const db = requireStoreDb(env);
  const collection = `nomenclature_1c_${baseKey}`;
  await db.prepare(`DELETE FROM store WHERE team_id=? AND collection=?`).bind(TEAM_ID, collection).run();
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK).map((x) =>
      db.prepare(`INSERT OR REPLACE INTO store (team_id, collection, id, data, created_at, updated_at) VALUES (?,?,?,?,?,?)`)
        .bind(TEAM_ID, collection, x.id, JSON.stringify(x), x.createdAt, x.updatedAt));
    if (batch.length) await db.batch(batch);
  }
  return rows.length;
}

// POST /api/crm/1c/nomenclature/catalog/pull — обновляет зеркало номенклатуры из
// ВСЕХ баз 1С (только админ). Ответ: { total, bases:[{ key,label,count,error? }] }.
async function handle1cPullNomenclatureCatalog(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const started = Date.now();
  const bases = [];
  let total = 0;
  const baseKeys = Object.keys(ONE_C_BASES);
  for (let i = 0; i < baseKeys.length; i += 1) {
    const baseKey = baseKeys[i];
    const label = ONE_C_BASES[baseKey].label;
    // Пауза между базами: 1С:Фреш ограничивает число одновременных сеансов/обращений
    // OData и отдаёт 402 при превышении. Разносим базы во времени, чтобы сессии
    // предыдущей базы успели закрыться по таймауту и пик не выбивал лимит.
    if (i > 0) await new Promise((r) => setTimeout(r, 3000));
    try {
      const count = await pullNomenclatureMirrorForBase(env, tenantId, baseKey);
      total += count;
      bases.push({ key: baseKey, label, count });
    } catch (e) {
      const msg = e instanceof ODataError ? `${e.httpStatus || ""} ${e.message}`.trim() : (e?.message || String(e));
      bases.push({ key: baseKey, label, count: 0, error: msg });
    }
  }
  await d1Insert1cSyncLog(env, {
    tenantId, direction: "pull", entityType: "nomenclature_mirror", operation: "pull",
    status: bases.some((b) => b.error) ? "error" : "ok", httpStatus: 200,
    recordsProcessed: total, durationMs: Date.now() - started,
  });
  return { ok: true, total, bases };
}

// GET /api/crm/1c/nomenclature/catalog — отдаёт позиции зеркала (БЕЗ захода в 1С) с
// ценами выбранного прайса. Параметры: base, q, priceListId, sort, offset, limit,
// onlyPriced/onlyUnpriced. Ответ: { items, total, counts:{all,priced,unpriced}, source }.
// Позиция: { ref, base, code, name, article, unit, stock, price } — ключ цены = base:ref.
async function handle1cReadNomenclatureCatalog(request, env, actor) {
  const url = new URL(request.url);
  const baseParam = (url.searchParams.get("base") || "").trim();
  const baseKey = baseParam && ONE_C_BASES[baseParam] ? baseParam : null;
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const priceListId = (url.searchParams.get("priceListId") || "").trim();
  const sort = (url.searchParams.get("sort") || "name_asc").trim();
  const onlyPriced = url.searchParams.get("onlyPriced") === "1";
  const onlyUnpriced = url.searchParams.get("onlyUnpriced") === "1";
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  // Фронт запрашивает страницами по 200 и циклится оффсетом — для «Все юр.лица»
  // это ~115 запросов, каждый перечитывает всё зеркало (очень долгая загрузка).
  // Отдаём весь отфильтрованный набор за один ответ (фронт корректно завершит
  // цикл: получит items.length >= total и остановится). Кап на всякий случай.
  const MAX_ITEMS = 50000;

  const db = requireStoreDb(env);
  const baseList = baseKey ? [baseKey] : Object.keys(ONE_C_BASES);

  // Карта цен выбранного прайса (своя копия в store). Ключ позиции = "<base>:<ref>",
  // где ref у утверждённого каталога — это НОВЫЙ КОД (к нему привязаны цены).
  let priceMap = {};
  if (priceListId) {
    const plRow = await db.prepare(`SELECT data FROM store WHERE team_id=? AND collection=? AND id=?`)
      .bind(TEAM_ID, "price_lists", priceListId).first();
    if (plRow?.data) {
      try { const pl = JSON.parse(plRow.data); if (pl && !pl.isDeleted) priceMap = pl.prices || {}; } catch { /* битый прайс — без цен */ }
    }
  }

  // Источник каталога по каждому юр.лицу: УТВЕРЖДЁННЫЙ список (catalog_approved_*,
  // ref = новый код — к нему привязаны цены прайсов) приоритетнее. Если его нет —
  // сырое зеркало 1С (nomenclature_1c_*, ref = Ref_Key). Остаток — сумма серий из
  // партий (catalog_lots_*). Pull обновляет только зеркало 1С, утверждённый каталог
  // (ручные коды/Excel) НЕ трогает.
  let usedApproved = false;
  const items = [];
  for (const base of baseList) {
    const approved = await d1ListCollection(env, `catalog_approved_${base}`, 50000);
    const approvedLive = approved.filter((a) => a && !a.isDeleted);
    if (approvedLive.length) {
      usedApproved = true;
      const lots = await d1ListCollection(env, `catalog_lots_${base}`, 50000);
      const stockByCode = new Map();
      for (const l of lots) {
        if (!l || !l.code) continue;
        const tot = Array.isArray(l.series)
          ? l.series.reduce((s, x) => s + (Number(x.stock) || 0), 0)
          : (Number(l.stock) || 0);
        stockByCode.set(l.code, tot);
      }
      for (const a of approvedLive) {
        const code = a.code || a.id;
        const pv = priceMap[`${base}:${code}`];
        items.push({
          ref: code, base, code,
          name: a.name || null,
          article: a.oldCode || null,
          unit: a.unit || null,
          stock: stockByCode.has(code) ? stockByCode.get(code) : (Number(a.stock) || 0),
          price: (pv == null || pv === "") ? null : Number(pv),
        });
      }
    } else {
      const nomen = await d1ListCollection(env, `nomenclature_1c_${base}`, 50000);
      for (const n of nomen) {
        if (!n || n.is_folder || n.deletion_mark) continue;
        const ref = n.ref_key || n.id;
        const pv = priceMap[`${base}:${ref}`];
        items.push({
          ref, base,
          code: n.code || null,
          name: n.name || null,
          article: n.article || null,
          unit: null,
          stock: Number(n.stock) || 0,
          price: (pv == null || pv === "") ? null : Number(pv),
        });
      }
    }
  }

  // Текстовый фильтр (код / название / артикул).
  const list = q
    ? items.filter((it) =>
        String(it.name || "").toLowerCase().includes(q) ||
        String(it.code || "").toLowerCase().includes(q) ||
        String(it.article || "").toLowerCase().includes(q))
    : items;

  // Счётчики — по всему набору (base+q), ДО фильтра по наличию цены.
  const counts = { all: list.length, priced: 0, unpriced: 0 };
  for (const it of list) { if (it.price != null) counts.priced += 1; else counts.unpriced += 1; }

  let filtered = list;
  if (onlyPriced) filtered = list.filter((it) => it.price != null);
  else if (onlyUnpriced) filtered = list.filter((it) => it.price == null);

  const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ru");
  const sorters = {
    name_asc: byName,
    name_desc: (a, b) => byName(b, a),
    price_desc: (a, b) => ((b.price == null ? -1 : b.price) - (a.price == null ? -1 : a.price)) || byName(a, b),
    price_asc: (a, b) => ((a.price == null ? Infinity : a.price) - (b.price == null ? Infinity : b.price)) || byName(a, b),
    stock_desc: (a, b) => (b.stock - a.stock) || byName(a, b),
    stock_asc: (a, b) => (a.stock - b.stock) || byName(a, b),
  };
  filtered.sort(sorters[sort] || byName);

  const total = filtered.length;
  const page = filtered.slice(offset, offset + MAX_ITEMS);
  return { ok: true, items: page, total, counts, source: usedApproved ? "approved" : "1c" };
}

// GET /api/crm/catalog/approved/lots?base=&code= — серии/партии товара утверждённого
// каталога. Данные в store-коллекции catalog_lots_<base>: { code, series:[{lot,srok,stock}] }.
// Ответ: { series:[...] } (фронт раскрывает партии под строкой каталога).
async function handleCatalogApprovedLots(request, env, actor) {
  const url = new URL(request.url);
  const base = (url.searchParams.get("base") || "").trim();
  const code = (url.searchParams.get("code") || "").trim();
  if (!base || !code || !/^[a-z0-9_]+$/.test(base)) return { ok: true, series: [] };
  const db = requireStoreDb(env);
  const collection = `catalog_lots_${base}`;
  // id строки = код товара (так пишет импорт), поэтому прямой lookup; с фолбэком на скан.
  let row = await db.prepare(`SELECT data FROM store WHERE team_id=? AND collection=? AND id=? LIMIT 1`)
    .bind(TEAM_ID, collection, code).first();
  if (!row?.data) {
    const res = await db.prepare(`SELECT data FROM store WHERE team_id=? AND collection=?`).bind(TEAM_ID, collection).run();
    for (const r of (res.results || [])) {
      try { const o = JSON.parse(r.data); if (o && o.code === code) { row = { data: r.data }; break; } } catch { /* skip */ }
    }
  }
  if (!row?.data) return { ok: true, series: [] };
  let obj; try { obj = JSON.parse(row.data); } catch { return { ok: true, series: [] }; }
  return { ok: true, series: Array.isArray(obj.series) ? obj.series : [] };
}

// ─── Вкладка «Каталог»: управление утверждённым каталогом (catalog_approved_*) и
//     партиями (catalog_lots_*). Все ручки — только админ. base — ключ юр.лица.

// Валидирует ключ базы для имён коллекций catalog_*_<base> (строго из ONE_C_BASES).
function requireCatalogBase(value) {
  const base = String(value || "").trim();
  if (!ONE_C_BASES[base]) throw new HttpError(400, `Неизвестная база каталога: «${base}»`);
  return base;
}

// GET /api/crm/catalog/price-lists — лёгкий список прайс-листов для выпадашки в заказе
// (без тяжёлой карты цен). Ответ: { ok, lists:[{id,name,count}] }. Цены применяются
// на сервере в /api/crm/1c/nomenclature/catalog по priceListId.
async function handleCatalogPriceLists(request, env, actor) {
  const rows = await d1ListCollection(env, "price_lists", 1000);
  const lists = rows
    .filter((r) => r && !r.isDeleted)
    .map((r) => ({
      id: String(r.id),
      name: r.name || "(без названия)",
      count: r.prices && typeof r.prices === "object" ? Object.keys(r.prices).length : 0,
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "ru"));
  return { ok: true, lists };
}

// POST /api/crm/catalog/approved/receipt {base, code, lot, srok, qty} — приход партии
// в утверждённый каталог: добавляет/увеличивает серию {lot,srok,stock} в
// catalog_lots_<base> для товара code. Остаток товара пересчитывается из серий
// (см. handle1cReadNomenclatureCatalog), поэтому отдельно его не храним.
async function handleCatalogApprovedReceipt(request, env, actor) {
  require1cAdmin(actor);
  const body = await readRequestBodyAsJson(request);
  const base = requireCatalogBase(body?.base);
  const code = String(body?.code || "").trim();
  if (!code) throw new HttpError(400, "code (код товара каталога) обязателен");
  const lot = String(body?.lot || "").trim();
  const srok = String(body?.srok || "").trim();
  const qty = Number(body?.qty);
  if (!Number.isFinite(qty)) throw new HttpError(400, "qty (количество) должно быть числом");

  const collection = `catalog_lots_${base}`;
  const existing = await d1GetDoc(env, collection, code);
  const series = Array.isArray(existing?.series) ? existing.series.map((s) => ({ ...s })) : [];
  // Серия идентифицируется парой (номер партии, срок). Пустой lot → одна «безпартийная».
  const idx = series.findIndex((s) => String(s.lot || "") === lot && String(s.srok || "") === srok);
  if (idx >= 0) series[idx].stock = (Number(series[idx].stock) || 0) + qty;
  else series.push({ lot, srok, stock: qty });
  // Чистим нулевые/отрицательные серии (расход в ноль убирает партию).
  const cleaned = series.filter((s) => (Number(s.stock) || 0) > 0);
  const stock = cleaned.reduce((s, x) => s + (Number(x.stock) || 0), 0);

  await d1UpsertDoc(env, collection, {
    id: code, code, base, series: cleaned, stock,
    createdAt: existing?.createdAt || Date.now(), updatedAt: Date.now(),
  });
  return { ok: true, base, code, stock, series: cleaned };
}

// POST /api/crm/catalog/approved/update {base, items:[{code, name?, unit?, oldCode?, stock?}]}
// — точечный апдейт полей строк утверждённого каталога. Обновляются только
// переданные поля; пропущенные сохраняются. Несуществующие коды игнорируются.
async function handleCatalogApprovedUpdate(request, env, actor) {
  require1cAdmin(actor);
  const body = await readRequestBodyAsJson(request);
  const base = requireCatalogBase(body?.base);
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) throw new HttpError(400, "items пуст");
  const collection = `catalog_approved_${base}`;
  let updated = 0;
  const missing = [];
  for (const it of items) {
    const code = String(it?.code || it?.id || "").trim();
    if (!code) continue;
    const existing = await d1GetDoc(env, collection, code);
    if (!existing) { missing.push(code); continue; }
    const next = { ...existing };
    if (it.name !== undefined) next.name = it.name == null ? null : String(it.name);
    if (it.unit !== undefined) next.unit = it.unit == null ? null : String(it.unit);
    if (it.oldCode !== undefined) next.oldCode = it.oldCode == null ? null : String(it.oldCode);
    if (it.stock !== undefined) next.stock = Number(it.stock) || 0;
    next.id = code; next.code = code; next.base = base; next.updatedAt = Date.now();
    await d1UpsertDoc(env, collection, next);
    updated += 1;
  }
  return { ok: true, base, updated, missing };
}

// POST /api/crm/catalog/approved/delete {base, codes:[]} — мягкое удаление строк
// каталога (isDeleted=true; каталог-эндпоинт их отфильтровывает). Партии не трогаем.
async function handleCatalogApprovedDelete(request, env, actor) {
  require1cAdmin(actor);
  const body = await readRequestBodyAsJson(request);
  const base = requireCatalogBase(body?.base);
  const codes = Array.isArray(body?.codes) ? body.codes.map((c) => String(c || "").trim()).filter(Boolean) : [];
  if (!codes.length) throw new HttpError(400, "codes пуст");
  const collection = `catalog_approved_${base}`;
  let deleted = 0;
  for (const code of codes) {
    const existing = await d1GetDoc(env, collection, code);
    if (!existing) continue;
    await d1UpsertDoc(env, collection, { ...existing, id: code, isDeleted: true, updatedAt: Date.now() });
    deleted += 1;
  }
  return { ok: true, base, deleted };
}

// POST /api/crm/catalog/approved/import {base, items:[{code, name, unit, oldCode, stock}], replace}
// — массовый импорт строк утверждённого каталога. replace=true: коды, отсутствующие
// в импорте, помечаются isDeleted=true (полная замена набора). Ключ цены прайсов —
// «<base>:<code>», поэтому code здесь = новый код карточки.
async function handleCatalogApprovedImport(request, env, actor) {
  require1cAdmin(actor);
  const body = await readRequestBodyAsJson(request);
  const base = requireCatalogBase(body?.base);
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) throw new HttpError(400, "items пуст");
  const replace = oneCBool(body?.replace);
  const collection = `catalog_approved_${base}`;

  const now = Date.now();
  const seen = new Set();
  let imported = 0;
  for (const it of items) {
    const code = String(it?.code || it?.id || "").trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    const existing = await d1GetDoc(env, collection, code);
    await d1UpsertDoc(env, collection, {
      ...(existing || {}),
      id: code, code, base,
      name: it.name == null ? (existing?.name || null) : String(it.name),
      unit: it.unit == null ? (existing?.unit ?? null) : String(it.unit),
      oldCode: it.oldCode == null ? (existing?.oldCode ?? null) : String(it.oldCode),
      stock: it.stock === undefined ? (Number(existing?.stock) || 0) : (Number(it.stock) || 0),
      isDeleted: false,
      createdAt: existing?.createdAt || now, updatedAt: now,
    });
    imported += 1;
  }

  let removed = 0;
  if (replace) {
    const all = await d1ListCollection(env, collection, 50000);
    for (const row of all) {
      if (!row || row.isDeleted) continue;
      const code = String(row.code || row.id || "");
      if (seen.has(code)) continue;
      await d1UpsertDoc(env, collection, { ...row, id: code, isDeleted: true, updatedAt: now });
      removed += 1;
    }
  }
  return { ok: true, base, imported, removed, replace };
}

// POST /api/crm/1c/products/map — ручная привязка товара склада к номенклатуре 1С.
async function handle1cMapProduct(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  const body = await readRequestBodyAsJson(request);
  const productId = String(body?.productId || "").trim();
  const refKey = String(body?.refKey || "").trim();
  if (!productId || !refKey) throw new HttpError(400, "productId и refKey обязательны");
  const db = requireStoreDb(env);
  const row = await db.prepare(`SELECT data FROM store WHERE team_id=? AND collection=? AND id=?`)
    .bind(TEAM_ID, "warehouse_products", productId).first();
  if (!row) throw new HttpError(404, "Товар склада не найден");
  let prod;
  try { prod = JSON.parse(row.data); } catch { throw new HttpError(500, "Битые данные товара"); }
  const now = Date.now();
  const updated = {
    ...prod,
    _1c_ref_key: refKey,
    _1c_unit_ref: body?.unitRef || prod._1c_unit_ref || null,
    _1c_vat_ref: body?.vatRef || prod._1c_vat_ref || null,
    _1c_match_method: "manual",
    _1c_match_ambiguous: false,
    _1c_matched_at: now,
    updatedAt: now,
  };
  await db.prepare(`UPDATE store SET data=?, updated_at=? WHERE team_id=? AND collection=? AND id=?`)
    .bind(JSON.stringify(updated), now, TEAM_ID, "warehouse_products", productId).run();
  await d1Upsert1cIdMap(env, tenantId, "product", productId, refKey, null);
  return { ok: true, productId, refKey };
}

// GET /api/crm/1c/products/unmatched — товары склада без ссылки на 1С.
async function handle1cListUnmatchedProducts(request, env, actor) {
  require1cAdmin(actor);
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "100", 10), 1), 500);
  const db = requireStoreDb(env);
  const rows = await db.prepare(`SELECT id, data FROM store WHERE team_id=? AND collection=? ORDER BY id`)
    .bind(TEAM_ID, "warehouse_products").all();
  const out = [];
  let totalUnmatched = 0;
  for (const r of rows?.results || []) {
    let p;
    try { p = JSON.parse(r.data); } catch { continue; }
    if (p.archived) continue;
    const ambiguous = p._1c_match_ambiguous === true;
    // Показываем без ссылки на 1С ИЛИ с черновой (неоднозначной) привязкой — её
    // тоже надо проверить вручную и привязать по коду.
    if (p._1c_ref_key && !ambiguous) continue;
    totalUnmatched += 1;
    if (out.length < limit) out.push({ id: p.id || r.id, sku: p.sku || "", name: p.name || "", status: ambiguous ? "ambiguous" : "none" });
  }
  return { ok: true, count: out.length, total_unmatched: totalUnmatched, products: out };
}

// Список маппингов id_map по типу сущности (наши созданные документы).
async function d1List1cIdMap(env, tenantId, entityType) {
  await ensureD1Schema(env);
  const db = requireStoreDb(env);
  const rows = await db
    .prepare(`SELECT pllato_id, one_c_ref_key FROM one_c_id_map WHERE tenant_id=? AND entity_type=?`)
    .bind(tenantId, entityType).all();
  return rows?.results || [];
}

// POST /api/crm/1c/payments/pull — опрос регистра «ОплатаСчетов» по базам.
// Read-only: сверяет оплаты с НАШИМИ созданными счетами (one_c_id_map invoice@base)
// и проставляет на сделке oneCPaidAmount/oneCPaidAt. Закрытие петли (бронь/стадия)
// — отдельно, после обкатки. Регистр небольшой (~1200), тянем целиком (фильтры 1С
// по dimension не работают).
async function handle1cPullPayments(request, env, actor) {
  require1cAdmin(actor);
  const tenantId = resolve1cTenantId(actor);
  let body = {};
  try { body = await readRequestBodyAsJson(request); } catch {}
  const bk = String(body?.base || "").trim();
  const baseKeys = ONE_C_BASES[bk] ? [bk] : Object.keys(ONE_C_BASES);
  const started = Date.now();
  const db = requireStoreDb(env);
  const result = { ok: true, bases: {}, updated: 0 };

  for (const baseKey of baseKeys) {
    const invEntity = baseKey === ONE_C_DEFAULT_BASE ? "invoice" : `invoice@${baseKey}`;
    const ourInvoices = await d1List1cIdMap(env, tenantId, invEntity);
    if (ourInvoices.length === 0) { result.bases[baseKey] = { our_invoices: 0, paid: 0 }; continue; }
    const refToDeal = new Map(ourInvoices.map((r) => [r.one_c_ref_key, r.pllato_id]));
    try {
      const { client } = await build1cClient(env, tenantId, baseKey);
      const data = await client.get("AccumulationRegister_ОплатаСчетов", { top: 10000 });
      const rows = Array.isArray(data?.value) ? data.value : [];
      const paidByRef = new Map(); // ref → { sum, last }
      for (const row of rows) {
        const set = Array.isArray(row?.RecordSet) ? row.RecordSet : [];
        for (const rec of set) {
          const ref = rec?.СчетНаОплату;
          if (!ref || !refToDeal.has(ref)) continue;
          const cur = paidByRef.get(ref) || { sum: 0, last: null };
          cur.sum += Number(rec?.Сумма) || 0;
          const p = rec?.Period;
          if (p && (!cur.last || p > cur.last)) cur.last = p;
          paidByRef.set(ref, cur);
        }
      }
      let paidCount = 0;
      for (const [ref, info] of paidByRef) {
        const dealId = refToDeal.get(ref);
        const drow = await db.prepare(`SELECT data FROM store WHERE team_id=? AND collection=? AND id=?`)
          .bind(TEAM_ID, "deals", dealId).first();
        if (!drow) continue;
        let deal;
        try { deal = JSON.parse(drow.data); } catch { continue; }
        const now = Date.now();
        const updated = { ...deal, oneCPaidAmount: Math.round(info.sum * 100) / 100, oneCPaidAt: now, oneCPaidPeriod: info.last || null, updatedAt: now };
        await db.prepare(`UPDATE store SET data=?, updated_at=? WHERE team_id=? AND collection=? AND id=?`)
          .bind(JSON.stringify(updated), now, TEAM_ID, "deals", dealId).run();
        paidCount += 1;
      }
      result.bases[baseKey] = { our_invoices: ourInvoices.length, paid: paidCount };
      result.updated += paidCount;
    } catch (e) {
      result.bases[baseKey] = { error: e?.message || String(e) };
    }
  }
  await d1Insert1cSyncLog(env, { tenantId, direction: "pull", entityType: "payments", operation: "match", status: "ok", recordsProcessed: result.updated, durationMs: Date.now() - started });
  return result;
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
      // Согласование документов (HTML на pllato.kz/agreements/*) — публичный доступ
      // без JWT. Доступ к конкретному документу по ID. Используется для интерактивного
      // согласования работ между Pllato и клиентом (например, аминамед-1c).
      const agreementMatch = path.match(/^\/agreement\/([a-zA-Z0-9_-]+)$/);
      if (agreementMatch) {
        const agreementId = agreementMatch[1];
        if (request.method === "GET") return json(request, env, await handleAgreementGet(env, agreementId));
        if (request.method === "POST") return json(request, env, await handleAgreementPost(env, agreementId, request));
      }
      // Страница смены пароля OData 1С (в UI CRM формы нет) — публичный HTML,
      // но любые действия требуют admin-токен сессии CRM.
      if (request.method === "GET" && path === "/1c-setup") {
        return new Response(ONE_C_SETUP_PAGE_HTML, {
          headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" },
        });
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

      if (request.method === "GET" && path === "/project-finance") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleProjectFinanceGet(env, actor));
      }

      if (request.method === "PUT" && path === "/project-finance") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleProjectFinancePut(request, env, actor));
      }

      if (request.method === "GET" && path === "/project-finance/charts") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleProjectFinanceChartsGet(env, actor, url));
      }

      if (request.method === "PUT" && path === "/project-finance/charts") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleProjectFinanceChartsPut(request, env, actor));
      }

      if (request.method === "POST" && path === "/store/pull") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleStorePull(request, env, actor));
      }

      if (request.method === "POST" && path === "/store/push") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleStorePush(request, env, actor));
      }

      // 1С:Фреш интеграция (OData) — только для админов тенанта
      if (request.method === "GET" && path === "/api/crm/1c/settings") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cGetSettings(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/settings") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cSaveSettings(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/test-connection") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cTestConnection(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/sync/contractors/pull") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cPullContractors(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/sync/products/pull") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cPullProducts(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/sync/contracts/pull") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cPullContracts(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/sync/organizations/pull") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cPullOrganizations(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/sync/products/match") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cMatchProducts(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/sync/contact-info/pull") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cPullContactInfo(request, env, actor));
      }
      if (request.method === "GET" && path === "/api/crm/1c/sync-log") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cSyncLog(request, env, actor));
      }
      if (request.method === "GET" && path === "/api/crm/1c/inspect") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cInspect(request, env, actor));
      }
      if (request.method === "GET" && path === "/api/crm/1c/collections") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cListCollections(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/invoices/create") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cCreateInvoice(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/realizations/create") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cCreateRealization(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/factures/create") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cCreateFacture(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/contractors/create") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cCreateContractor(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/contractors/find") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cFindContractorByBin(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/contacts/add-address") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cAddContractorAddress(request, env, actor));
      }
      if (request.method === "GET" && path === "/api/crm/1c/contractors/search") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cContractorSearch(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/contractors/map") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cMapContractor(request, env, actor));
      }
      if (request.method === "GET" && path === "/api/crm/1c/nomenclature/search") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cNomenclatureSearch(request, env, actor));
      }
      if (request.method === "GET" && path === "/api/crm/1c/nomenclature/catalog") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cReadNomenclatureCatalog(request, env, actor));
      }
      if (request.method === "GET" && path === "/api/crm/catalog/approved/lots") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleCatalogApprovedLots(request, env, actor));
      }
      if (request.method === "GET" && path === "/api/crm/catalog/price-lists") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleCatalogPriceLists(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/catalog/approved/receipt") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleCatalogApprovedReceipt(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/catalog/approved/update") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleCatalogApprovedUpdate(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/catalog/approved/delete") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleCatalogApprovedDelete(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/catalog/approved/import") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleCatalogApprovedImport(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/nomenclature/catalog/pull") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cPullNomenclatureCatalog(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/products/map") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cMapProduct(request, env, actor));
      }
      if (request.method === "GET" && path === "/api/crm/1c/products/unmatched") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cListUnmatchedProducts(request, env, actor));
      }
      if (request.method === "POST" && path === "/api/crm/1c/payments/pull") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handle1cPullPayments(request, env, actor));
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

      // SIP-креды для shared sip-client.js (browser WebRTC через Asterisk
      // на Hetzner → Binotel trunk). Любой авторизованный оператор.
      if (request.method === "GET" && (path === "/sip/token" || path === "/api/sip/token")) {
        await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleSipToken(request, env));
      }

      if (request.method === "POST" && path === "/wa/send") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleWaSend(request, env, actor));
      }

      if (request.method === "GET" && path === "/wa/qr") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleWaQr(request, env, actor, url));
      }

      if (request.method === "GET" && path === "/wa/state") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleWaState(request, env, actor, url));
      }

      if (request.method === "POST" && path === "/email/send") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleEmailSend(request, env, actor));
      }

      // ===== Реестр договоров с ЭЦП =====
      // Внутренние ручки (только авторизованный сотрудник портала):
      if (request.method === "GET" && path === "/api/contracts") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleContractsList(env, actor));
      }
      if (request.method === "POST" && path === "/api/contracts") {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleContractCreate(request, env, actor));
      }
      const contractFileMatch = path.match(/^\/api\/contracts\/([a-zA-Z0-9_-]+)\/file$/);
      if (request.method === "GET" && contractFileMatch) {
        await loadActorContext(request, env, { strictTeamCheck: true });
        return await handleContractFile(request, env, contractFileMatch[1]);
      }
      const contractSignMatch = path.match(/^\/api\/contracts\/([a-zA-Z0-9_-]+)\/sign$/);
      if (request.method === "POST" && contractSignMatch) {
        await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleContractSignOwner(request, env, contractSignMatch[1]));
      }
      const contractSendMatch = path.match(/^\/api\/contracts\/([a-zA-Z0-9_-]+)\/send$/);
      if (request.method === "POST" && contractSendMatch) {
        await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleContractSend(env, contractSendMatch[1]));
      }
      const contractModeMatch = path.match(/^\/api\/contracts\/([a-zA-Z0-9_-]+)\/mode$/);
      if (request.method === "POST" && contractModeMatch) {
        await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleContractSetMode(request, env, contractModeMatch[1]));
      }
      const contractSignersMatch = path.match(/^\/api\/contracts\/([a-zA-Z0-9_-]+)\/signers$/);
      if (request.method === "POST" && contractSignersMatch) {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleContractAddSigners(request, env, contractSignersMatch[1], actor));
      }
      const contractSigFileMatch = path.match(/^\/api\/contracts\/([a-zA-Z0-9_-]+)\/signature\/([a-zA-Z0-9_-]+)$/);
      if (request.method === "GET" && contractSigFileMatch) {
        await loadActorContext(request, env, { strictTeamCheck: true });
        return await handleContractSignatureFile(request, env, contractSigFileMatch[1], contractSigFileMatch[2]);
      }
      const contractIdMatch = path.match(/^\/api\/contracts\/([a-zA-Z0-9_-]+)$/);
      if (request.method === "GET" && contractIdMatch) {
        const actor = await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleContractGet(env, contractIdMatch[1], actor));
      }
      if (request.method === "DELETE" && contractIdMatch) {
        await loadActorContext(request, env, { strictTeamCheck: true });
        return json(request, env, await handleContractDelete(env, contractIdMatch[1]));
      }

      // Публичные ручки подписания по общей ссылке договора (без логина):
      const signCFileMatch = path.match(/^\/api\/sign\/c\/([a-zA-Z0-9_-]+)\/file$/);
      if (request.method === "GET" && signCFileMatch) {
        return await handleSignFileByContract(request, env, signCFileMatch[1]);
      }
      const signCMatch = path.match(/^\/api\/sign\/c\/([a-zA-Z0-9_-]+)$/);
      if (request.method === "GET" && signCMatch) {
        return json(request, env, await handleSignGetByContract(env, signCMatch[1]));
      }
      if (request.method === "POST" && signCMatch) {
        return json(request, env, await handleSignPostByContract(request, env, signCMatch[1]));
      }

      // Публичные ручки подписания по персональной ссылке (без логина):
      const signTokenFileMatch = path.match(/^\/api\/sign\/([a-zA-Z0-9_-]+)\/file$/);
      if (request.method === "GET" && signTokenFileMatch) {
        return await handleSignFile(request, env, signTokenFileMatch[1]);
      }
      const signTokenMatch = path.match(/^\/api\/sign\/([a-zA-Z0-9_-]+)$/);
      if (request.method === "GET" && signTokenMatch) {
        return json(request, env, await handleSignGet(env, signTokenMatch[1]));
      }
      if (request.method === "POST" && signTokenMatch) {
        return json(request, env, await handleSignPost(request, env, signTokenMatch[1]));
      }

      return fail(request, env, 404, "Not found", { path, method: request.method });
    } catch (e) {
      if (e instanceof HttpError) return fail(request, env, e.status, e.message, e.details);
      console.error("worker error:", e);
      return fail(request, env, 500, "Internal error", String(e?.message || e));
    }
  },
};
