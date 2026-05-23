// ── ELC CRM Worker ───────────────────────────────────────
// Phase 0: CORS + Firebase Auth verification + /health + /api/me
// Phase 2.1: RTDB-proxy endpoint /api/rtdb/{path}.json (read + PATCH)

import { jwtVerify, createRemoteJWKSet } from "jose";

// Allowed origins for CORS
const ALLOWED_ORIGINS = new Set([
  "https://pllato.kz",
  "https://www.pllato.kz",
  "http://localhost:8080",
  "http://localhost:3000",
]);

// Firebase public keys (JWKS), кэшируются автоматически
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

// ── Helpers ──────────────────────────────────────────────
function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://pllato.kz";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(data, status = 200, request = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(request ? corsHeaders(request) : {}),
    },
  });
}

async function verifyFirebaseIdToken(token, projectId) {
  const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  return payload; // { user_id, email, ... }
}

async function requireAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { error: "missing Bearer token", status: 401 };
  try {
    const claims = await verifyFirebaseIdToken(token, env.FIREBASE_PROJECT_ID);
    return { uid: claims.user_id || claims.sub, email: claims.email, claims };
  } catch (e) {
    return { error: `invalid token: ${e.message}`, status: 401 };
  }
}

// Auth flexible: принимает Authorization Bearer ИЛИ ?auth=token (Firebase RTDB совместимость)
async function requireAuthFlexible(request, env) {
  const hdr = request.headers.get("Authorization") || "";
  let token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) {
    const url = new URL(request.url);
    token = url.searchParams.get("auth");
  }
  if (!token) return { error: "missing auth token", status: 401 };
  try {
    const claims = await verifyFirebaseIdToken(token, env.FIREBASE_PROJECT_ID);
    return { uid: claims.user_id || claims.sub, email: claims.email, claims };
  } catch (e) {
    return { error: `invalid token: ${e.message}`, status: 401 };
  }
}

// ── snake_case ↔ camelCase ──────────────────────────────
const CAMEL_OVERRIDES = {
  photo_url: "photoURL", // users — URL остаётся all-caps
};
const SNAKE_OVERRIDES = {
  photoURL: "photo_url",
};

function toCamel(key) {
  if (CAMEL_OVERRIDES[key]) return CAMEL_OVERRIDES[key];
  return key.replace(/_([a-z0-9])/g, (_, ch) => ch.toUpperCase());
}

function toSnake(key) {
  if (SNAKE_OVERRIDES[key]) return SNAKE_OVERRIDES[key];
  return key.replace(/([A-Z])/g, (_, ch) => "_" + ch.toLowerCase());
}

// JSON-decoded columns per table — нужно JSON.parse при ответе, JSON.stringify при PATCH
const JSON_COLS = {
  users: new Set(["department", "apps"]),
  contacts: new Set(["emails", "phones", "messengers", "websites", "custom_fields"]),
  companies: new Set(["phones"]),
  deals: new Set(["custom_fields"]),
  tasks: new Set(["accomplices", "auditors", "comments_data", "crm_links", "bitrix_crm_links", "bitrix_file_ids"]),
  pipelines: new Set(["stages"]),
  timeline_activities: new Set(["payload"]),
  openlines_sessions: new Set(["users"]),
  openlines_messages: new Set(["payload"]),
  chat_messages: new Set(["raw_params"]),
  custom_fields_schema: new Set(["list"]),
  kv: new Set(["v"]),
};

function tryParseJson(v) {
  if (typeof v !== "string" || v === "") return v;
  try { return JSON.parse(v); } catch { return v; }
}

function rowToCamel(row, tableName) {
  if (!row) return null;
  const jsonCols = JSON_COLS[tableName] || new Set();
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    let value = v;
    if (jsonCols.has(k)) value = tryParseJson(value);
    out[toCamel(k)] = value;
  }
  return out;
}

// Cursor-пагинация для больших коллекций (contacts ~143k, tasks ~38k, timeline ~146k).
// D1 ограничивает rows-per-query — выбираем чанками через `WHERE keyCol > ?`.
async function fetchAllRows(env, tableName, keyCol, chunkSize = 2000) {
  const out = [];
  let lastKey = "";
  while (true) {
    const { results } = await env.DB.prepare(
      `SELECT * FROM ${tableName} WHERE ${keyCol} > ? ORDER BY ${keyCol} LIMIT ?`
    ).bind(lastKey, chunkSize).all();
    if (!results || results.length === 0) break;
    out.push(...results);
    if (results.length < chunkSize) break;
    lastKey = results[results.length - 1][keyCol];
  }
  return out;
}

// Streaming JSON-response для больших коллекций.
// Без этого worker упирается в memory/CPU при >20k записях с JSON-колонками
// (tasks 38k, contacts 143k, timeline 146k, chat_messages 82k).
function streamingJsonResponse(request, generator) {
  const { readable, writable } = new TransformStream();
  const encoder = new TextEncoder();
  const writer = writable.getWriter();
  (async () => {
    try {
      for await (const chunk of generator()) {
        await writer.write(encoder.encode(chunk));
      }
      await writer.close();
    } catch (e) {
      try {
        await writer.write(encoder.encode(
          `\n/* stream error: ${String(e.message).replace(/\*\//g, "*\\/")} */`
        ));
      } catch {}
      try { await writer.abort(e); } catch {}
    }
  })();
  return new Response(readable, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Браузер кеширует коллекции на 60s (per-user) — спасает от дублирующих
      // fetch'ей при быстром переключении вкладок/разделов CRM. IndexedDB-кеш
      // на стороне фронта живёт дольше (24h); это второй слой защиты.
      "Cache-Control": "private, max-age=60",
      ...corsHeaders(request),
    },
  });
}

// Кеш per-table: precompute два варианта prefix — с ведущей запятой и без.
// Sparse-сериализация пропускает null-поля, поэтому "первый" префикс
// (без запятой) может выпасть на любую колонку.
const TABLE_SERIALIZE_CACHE = {};
function getSerializeSchema(row, tableName) {
  let schema = TABLE_SERIALIZE_CACHE[tableName];
  if (!schema) {
    const jsonCols = JSON_COLS[tableName] || new Set();
    schema = Object.keys(row).map((snake) => {
      const camelKeyEncoded = JSON.stringify(toCamel(snake));
      return {
        snake,
        keyHead: camelKeyEncoded + ":",
        keyHeadComma: "," + camelKeyEncoded + ":",
        isJson: jsonCols.has(snake),
      };
    });
    TABLE_SERIALIZE_CACHE[tableName] = schema;
  }
  return schema;
}

// Сериализация JSON-колонки. По умолчанию эмитим verbatim — DB хранит готовый JSON.
// Известная порча из миграции — маркер `[TRUNCATED original_len=...]` в строках
// (chunks comments_data в tasks). Если маркер найден — валидируем через JSON.parse
// и при провале отдаём null. indexOf — O(n), но в V8 это копеечная стоимость
// по сравнению с полным JSON.parse каждой записи.
function safeJsonVerbatim(v) {
  if (v == null || v === "") return "null";
  if (typeof v !== "string") return JSON.stringify(v);
  if (v.indexOf("[TRUNCATED") >= 0) {
    try { JSON.parse(v); return v; } catch { return "null"; }
  }
  return v;
}

// Sparse-режим только для очень крупных таблиц где экономия CPU реально важна.
// Для маленьких reference-таблиц (users 86, companies 20, pipelines, openlines)
// выгоднее отдать полную schema — фронт где-то сортирует по `lastName.localeCompare`
// без null-guard'а и падает на undefined.
const SPARSE_TABLES = new Set([
  "contacts",            // 143k
  "tasks",               // 38k
  "deals",               // 22k
  "timeline_activities", // 146k
  "chat_messages",       // 82k
]);

function serializeRowFast(row, tableName) {
  const schema = getSerializeSchema(row, tableName);
  const sparse = SPARSE_TABLES.has(tableName);
  let out = "{";
  let first = true;
  for (let i = 0; i < schema.length; i++) {
    const fld = schema[i];
    const v = row[fld.snake];
    if (sparse && (v === null || v === undefined)) continue;
    out += first ? fld.keyHead : fld.keyHeadComma;
    first = false;
    if (v === null || v === undefined) {
      out += "null";
    } else if (fld.isJson) {
      out += safeJsonVerbatim(v);
    } else if (typeof v === "number") {
      out += v;
    } else {
      out += JSON.stringify(v);
    }
  }
  return out + "}";
}

async function* streamCollection(env, tableName, keyCol, chunkSize = 2000) {
  yield "{";
  let lastKey = "";
  let first = true;
  while (true) {
    const { results } = await env.DB.prepare(
      `SELECT * FROM ${tableName} WHERE ${keyCol} > ? ORDER BY ${keyCol} LIMIT ?`
    ).bind(lastKey, chunkSize).all();
    if (!results || results.length === 0) break;
    let buf = "";
    for (const row of results) {
      buf += (first ? "" : ",") + JSON.stringify(row[keyCol]) + ":" + serializeRowFast(row, tableName);
      first = false;
    }
    yield buf;
    if (results.length < chunkSize) break;
    lastKey = results[results.length - 1][keyCol];
  }
  yield "}";
}

// ── /api/rtdb/{path}.json — Firebase RTDB совместимый эндпоинт ──
function parseRtdbPath(pathname) {
  const stripped = pathname.replace(/^\/api\/rtdb\/?/, "").replace(/\.json$/, "");
  return stripped ? stripped.split("/").filter(Boolean) : [];
}

async function handleRtdb(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const url = new URL(request.url);
  const parts = parseRtdbPath(url.pathname);
  if (parts.length === 0) {
    return json({ error: "empty path" }, 400, request);
  }

  const orderByRaw = url.searchParams.get("orderBy");
  const orderBy = orderByRaw ? orderByRaw.replace(/^"|"$/g, "") : null;
  const opts = {
    shallow: url.searchParams.get("shallow") === "true",
    orderBy,
    limitToLast: parseInt(url.searchParams.get("limitToLast") || "0", 10) || 0,
  };

  try {
    const method = request.method;
    if (method === "GET") {
      return await handleRtdbGet(env, request, parts, opts);
    }
    if (method === "PATCH" || method === "PUT") {
      return await handleRtdbWrite(env, request, parts);
    }
    return json({ error: `method ${method} not supported` }, 405, request);
  } catch (e) {
    return json({ error: e.message, stack: e.stack }, 500, request);
  }
}

async function handleRtdbGet(env, request, parts, opts) {
  const [head, ...rest] = parts;

  switch (head) {
    case "users":
      return rest.length === 0
        ? respondCollection(env, request, "users", "uid", opts)
        : respondSingle(env, request, "users", "uid", rest[0]);

    case "contacts":
      return rest.length === 0
        ? respondCollection(env, request, "contacts", "id", opts)
        : respondSingle(env, request, "contacts", "id", rest[0]);

    case "deals":
      return rest.length === 0
        ? respondCollection(env, request, "deals", "id", opts)
        : respondSingle(env, request, "deals", "id", rest[0]);

    case "tasks":
      return rest.length === 0
        ? respondCollection(env, request, "tasks", "id", opts)
        : respondSingle(env, request, "tasks", "id", rest[0]);

    case "companies":
      return rest.length === 0
        ? respondCollection(env, request, "companies", "id", opts)
        : respondSingle(env, request, "companies", "id", rest[0]);

    case "pipelines":
      return rest.length === 0
        ? respondCollection(env, request, "pipelines", "id", opts)
        : respondSingle(env, request, "pipelines", "id", rest[0]);

    case "customFieldsSchema":
      return respondCustomFieldsSchema(env, request, rest, opts);

    case "groupChats":
      return rest.length === 0
        ? respondGroupChatsCollection(env, request, opts)
        : respondGroupChatsSingle(env, request, rest[0]);

    case "openlinesSessions":
      return rest.length === 0
        ? respondOpenlinesCollection(env, request, opts)
        : respondOpenlinesSingle(env, request, rest[0]);

    case "timeline":
      if (rest.length === 0) return json({}, 200, request);
      return respondTimeline(env, request, rest[0]);

    case "taskReadState":
      return respondTaskReadState(env, request, rest);

    case "referenceLists":
      return json({}, 200, request);

    case "filesQueue":
    case "migrationState":
    case "migrationCache":
      return json(null, 200, request);

    default:
      return json({ error: "unknown path", path: parts.join("/") }, 404, request);
  }
}

async function respondCollection(env, request, tableName, keyCol, opts) {
  if (opts.shallow) {
    const { results } = await env.DB.prepare(
      `SELECT ${keyCol} AS k FROM ${tableName}`
    ).all();
    const out = {};
    for (const r of results) out[r.k] = true;
    return json(out, 200, request);
  }
  return streamingJsonResponse(request, () => streamCollection(env, tableName, keyCol));
}

async function respondSingle(env, request, tableName, keyCol, id) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM ${tableName} WHERE ${keyCol} = ?`
  ).bind(id).all();
  if (!results || results.length === 0) return json(null, 200, request);
  return json(rowToCamel(results[0], tableName), 200, request);
}

async function respondCustomFieldsSchema(env, request, rest, opts) {
  if (rest.length === 0) return json({}, 200, request);
  const entity = rest[0]; // 'deal' | 'contact' | 'company'
  const { results } = await env.DB.prepare(
    "SELECT field_name, label, data_type, mandatory, multiple, sort, list " +
    "FROM custom_fields_schema WHERE entity_type = ?"
  ).bind(entity).all();
  const out = {};
  for (const row of results) {
    out[row.field_name] = {
      label: row.label,
      type: row.data_type,             // явное переименование data_type → type
      mandatory: !!row.mandatory,
      multiple: !!row.multiple,
      sort: row.sort,
      list: tryParseJson(row.list),
    };
  }
  return json(out, 200, request);
}

async function* streamGroupChats(env) {
  yield "{";
  const { results: chats } = await env.DB.prepare(
    "SELECT * FROM group_chats ORDER BY id"
  ).all();
  let firstChat = true;
  for (const chat of chats) {
    // chat header: открываем объект чата, сериализуем все поля чата
    // (кроме служебных) + начинаем nested "messages":{
    let header = (firstChat ? "" : ",") + JSON.stringify(chat.id) + ":";
    // встроенно: убираем закрывающую `}` от serializeRowFast и продолжаем
    const chatSerialized = serializeRowFast(chat, "group_chats");
    // chatSerialized = '{...}', режем последний `}` и приклеиваем messages
    header += chatSerialized.slice(0, -1) + ",\"messages\":{";
    yield header;

    let lastMsgId = "";
    let firstMsg = true;
    while (true) {
      const { results: msgs } = await env.DB.prepare(
        "SELECT * FROM chat_messages WHERE chat_id = ? AND id > ? ORDER BY id LIMIT 5000"
      ).bind(chat.id, lastMsgId).all();
      if (!msgs || msgs.length === 0) break;
      let buf = "";
      for (const m of msgs) {
        buf += (firstMsg ? "" : ",") + JSON.stringify(m.id) + ":" + serializeRowFast(m, "chat_messages");
        firstMsg = false;
      }
      yield buf;
      if (msgs.length < 5000) break;
      lastMsgId = msgs[msgs.length - 1].id;
    }
    yield "}}"; // закрываем messages, закрываем chat
    firstChat = false;
  }
  yield "}";
}

async function respondGroupChatsCollection(env, request, opts) {
  if (opts.shallow) {
    const { results } = await env.DB.prepare("SELECT id FROM group_chats").all();
    const out = {};
    for (const r of results) out[r.id] = true;
    return json(out, 200, request);
  }
  return streamingJsonResponse(request, () => streamGroupChats(env));
}

async function respondGroupChatsSingle(env, request, chatId) {
  const chats = await env.DB.prepare("SELECT * FROM group_chats WHERE id = ?")
    .bind(chatId).all();
  if (!chats.results || chats.results.length === 0) return json(null, 200, request);
  const rec = rowToCamel(chats.results[0], "group_chats");
  rec.messages = {};
  const msgs = await env.DB.prepare("SELECT * FROM chat_messages WHERE chat_id = ?")
    .bind(chatId).all();
  for (const m of msgs.results) {
    const mrec = rowToCamel(m, "chat_messages");
    delete mrec.chatId;
    rec.messages[m.id] = mrec;
  }
  return json(rec, 200, request);
}

async function respondOpenlinesCollection(env, request, opts) {
  if (opts.shallow) {
    const { results } = await env.DB.prepare("SELECT id FROM openlines_sessions").all();
    const out = {};
    for (const r of results) out[r.id] = true;
    return json(out, 200, request);
  }
  let results;
  if (opts.orderBy === "lastMessageAt" && opts.limitToLast > 0) {
    const r = await env.DB.prepare(
      "SELECT * FROM openlines_sessions ORDER BY last_message_at DESC LIMIT ?"
    ).bind(opts.limitToLast).all();
    results = r.results;
  } else {
    results = await fetchAllRows(env, "openlines_sessions", "id");
  }
  const out = {};
  for (const row of results) {
    out[row.id] = rowToCamel(row, "openlines_sessions");
  }
  return json(out, 200, request);
}

async function respondOpenlinesSingle(env, request, sessionId) {
  const sess = await env.DB.prepare("SELECT * FROM openlines_sessions WHERE id = ?")
    .bind(sessionId).all();
  if (!sess.results || sess.results.length === 0) return json(null, 200, request);
  const rec = rowToCamel(sess.results[0], "openlines_sessions");
  rec.messages = {};
  const msgs = await env.DB.prepare(
    "SELECT id, payload FROM openlines_messages WHERE session_id = ?"
  ).bind(sessionId).all();
  for (const m of msgs.results) {
    rec.messages[m.id] = tryParseJson(m.payload);
  }
  return json(rec, 200, request);
}

async function respondTimeline(env, request, ownerId) {
  const { results } = await env.DB.prepare(
    "SELECT id, payload FROM timeline_activities WHERE owner_id = ?"
  ).bind(ownerId).all();
  const out = {};
  for (const row of results) {
    out[row.id] = tryParseJson(row.payload);
  }
  return json(out, 200, request);
}

async function respondTaskReadState(env, request, rest) {
  if (rest.length === 0) return json({}, 200, request);
  const uid = rest[0];
  if (rest.length === 1) {
    const prefix = `taskReadState/${uid}/`;
    const { results } = await env.DB.prepare(
      "SELECT k, v FROM kv WHERE k LIKE ?"
    ).bind(prefix + "%").all();
    const out = {};
    for (const row of results) {
      const taskKey = row.k.slice(prefix.length);
      out[taskKey] = tryParseJson(row.v);
    }
    return json(out, 200, request);
  }
  const taskKey = rest[1];
  const { results } = await env.DB.prepare(
    "SELECT v FROM kv WHERE k = ?"
  ).bind(`taskReadState/${uid}/${taskKey}`).all();
  if (!results || results.length === 0) return json(null, 200, request);
  return json(tryParseJson(results[0].v), 200, request);
}

// ── PATCH/PUT ──
async function handleRtdbWrite(env, request, parts) {
  const [head, ...rest] = parts;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json body" }, 400, request);
  }

  // Точечные UPDATE'ы по ключу
  const updatableTables = { deals: "id", tasks: "id", contacts: "id", companies: "id", users: "uid" };
  if (updatableTables[head] && rest.length === 1) {
    const tableName = head;
    const keyCol = updatableTables[head];
    const id = rest[0];
    const jsonCols = JSON_COLS[tableName] || new Set();
    const updates = [];
    const values = [];
    for (const [k, v] of Object.entries(body)) {
      const snake = toSnake(k);
      let value = v;
      if (jsonCols.has(snake) && value !== null && typeof value !== "string") {
        value = JSON.stringify(value);
      }
      updates.push(`${snake} = ?`);
      values.push(value);
    }
    if (updates.length === 0) return json({ ok: true }, 200, request);
    values.push(id);
    const sql = `UPDATE ${tableName} SET ${updates.join(", ")} WHERE ${keyCol} = ?`;
    await env.DB.prepare(sql).bind(...values).run();
    return json({ ok: true }, 200, request);
  }

  // taskReadState writes — upsert в kv
  if (head === "taskReadState" && rest.length >= 1) {
    const uid = rest[0];
    if (rest.length === 1) {
      // body — это словарь {taskKey: value, ...}; делаем batch upsert
      if (body && typeof body === "object") {
        const stmt = env.DB.prepare("INSERT OR REPLACE INTO kv(k, v) VALUES(?, ?)");
        const batch = [];
        for (const [taskKey, value] of Object.entries(body)) {
          const v = typeof value === "string" ? value : JSON.stringify(value);
          batch.push(stmt.bind(`taskReadState/${uid}/${taskKey}`, v));
        }
        if (batch.length) await env.DB.batch(batch);
      }
      return json({ ok: true }, 200, request);
    }
    // rest.length === 2: одиночный taskKey
    const taskKey = rest[1];
    const v = typeof body === "string" ? body : JSON.stringify(body);
    await env.DB.prepare("INSERT OR REPLACE INTO kv(k, v) VALUES(?, ?)")
      .bind(`taskReadState/${uid}/${taskKey}`, v).run();
    return json({ ok: true }, 200, request);
  }

  return json(
    { error: "write not supported for this path", path: parts.join("/") },
    405,
    request
  );
}

// ── /api/list/{entity} — пагинированный список с поиском и сортировкой ──
// GET ?page=1&pageSize=50&q=text&sort=key&status=val&assignee=uid
// Возвращает { items: [...], total, page, pageSize, totalPages, hasMore }.
//
// SQL-injection защита: entity и sort-ключи берутся из whitelist'а в LIST_CONFIG.
// Только числовые/идентификаторные значения подставляются через bind() параметры.

const LIST_CONFIG = {
  contacts: {
    keyCol: "id",
    // Поля для LIKE-поиска. phones/emails — JSON-колонки, но LIKE по substring
    // подмножества JSON-текста работает (например `%+7700%` найдёт телефон).
    searchFields: ["name", "last_name", "second_name", "phones", "emails"],
    sorts: {
      created: "bitrix_date_create DESC",
      name: "last_name ASC, name ASC",
    },
    defaultSort: "bitrix_date_create DESC",
  },
  tasks: {
    keyCol: "id",
    searchFields: ["title"],
    statusField: "status",
    assigneeField: "responsible_uid",
    sorts: {
      // "новые с активностью вверх": сначала по changed_date, fallback на
      // status_changed, далее created.
      activity: "COALESCE(bitrix_changed_date, bitrix_status_changed_date, bitrix_created_date) DESC",
      deadline: "deadline IS NULL, deadline ASC",
      created: "bitrix_created_date DESC",
    },
    defaultSort: "COALESCE(bitrix_changed_date, bitrix_status_changed_date, bitrix_created_date) DESC",
  },
  deals: {
    keyCol: "id",
    searchFields: ["title"],
    assigneeField: "responsible_uid",
    stageField: "stage_id",
    closedField: "closed",
    sorts: {
      modified: "bitrix_date_modify DESC",
      created: "bitrix_date_create DESC",
      opportunity: "opportunity DESC",
    },
    defaultSort: "bitrix_date_modify DESC",
  },
};

async function handleList(request, env, entity) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const cfg = LIST_CONFIG[entity];
  if (!cfg) return json({ error: "unknown entity", entity }, 404, request);

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(200, Math.max(10, parseInt(url.searchParams.get("pageSize") || "50", 10) || 50));
  const q = (url.searchParams.get("q") || "").trim();
  const sortKey = url.searchParams.get("sort") || "";
  const status = (url.searchParams.get("status") || "").trim();
  const assignee = (url.searchParams.get("assignee") || "").trim();
  const stage = (url.searchParams.get("stage") || "").trim();
  const closed = (url.searchParams.get("closed") || "").trim();

  const whereParts = [];
  const whereParams = [];

  if (q) {
    const like = "%" + q.toLowerCase() + "%";
    const clauses = cfg.searchFields.map(f => `LOWER(${f}) LIKE ?`);
    whereParts.push("(" + clauses.join(" OR ") + ")");
    for (let i = 0; i < cfg.searchFields.length; i++) whereParams.push(like);
  }

  if (status && status !== "all" && cfg.statusField) {
    if (status === "active") {
      whereParts.push(`${cfg.statusField} IN (1,2,3)`);
    } else {
      const n = parseInt(status, 10);
      if (!Number.isNaN(n)) {
        whereParts.push(`${cfg.statusField} = ?`);
        whereParams.push(n);
      }
    }
  }

  if (assignee && assignee !== "all" && cfg.assigneeField) {
    whereParts.push(`${cfg.assigneeField} = ?`);
    whereParams.push(assignee);
  }

  if (stage && stage !== "all" && cfg.stageField) {
    whereParts.push(`${cfg.stageField} = ?`);
    whereParams.push(stage);
  }

  if (closed !== "" && closed !== "all" && cfg.closedField) {
    const n = parseInt(closed, 10);
    if (!Number.isNaN(n)) {
      whereParts.push(`${cfg.closedField} = ?`);
      whereParams.push(n);
    }
  }

  const whereSQL = whereParts.length ? " WHERE " + whereParts.join(" AND ") : "";
  const orderSQL = " ORDER BY " + (cfg.sorts[sortKey] || cfg.defaultSort);
  const offset = (page - 1) * pageSize;

  // COUNT отдельным запросом — нужен для пагинатора. Под LIKE на 143k contacts ~50ms.
  const totalRow = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM ${entity}${whereSQL}`
  ).bind(...whereParams).first();
  const total = totalRow?.n ?? 0;

  const { results } = await env.DB.prepare(
    `SELECT * FROM ${entity}${whereSQL}${orderSQL} LIMIT ? OFFSET ?`
  ).bind(...whereParams, pageSize, offset).all();

  const items = results.map(row => rowToCamel(row, entity));

  return new Response(JSON.stringify({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: offset + items.length < total,
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // /api/list — пагинированный, не имеет смысла кешировать в браузере
      // (страницы и фильтры меняются). IDB-кеш фронта тоже не трогает их.
      "Cache-Control": "no-store",
      ...corsHeaders(request),
    },
  });
}

// ── Phase 0 routes ──────────────────────────────────────
async function handleHealth(request, env) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM contacts"
    ).all();
    return json({
      ok: true,
      worker: "pllato-elc-worker",
      d1: { binding: "DB", contacts: results[0]?.n ?? null },
      time: new Date().toISOString(),
    }, 200, request);
  } catch (e) {
    return json({ ok: false, error: e.message }, 500, request);
  }
}

async function handleMe(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ ok: false, error: auth.error }, auth.status, request);
  const { results } = await env.DB.prepare(
    "SELECT uid, email, name, last_name, position, active, photo FROM users WHERE uid = ?"
  ).bind(auth.uid).all();
  return json({
    ok: true,
    uid: auth.uid,
    email: auth.email,
    profile: results[0] ?? null,
  }, 200, request);
}

// ── Main dispatcher ─────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/health" && request.method === "GET") {
      return handleHealth(request, env);
    }

    if (path === "/api/me" && request.method === "GET") {
      return handleMe(request, env);
    }

    if (path.startsWith("/api/rtdb/") || path === "/api/rtdb") {
      return handleRtdb(request, env);
    }

    // /api/list/contacts, /api/list/tasks, /api/list/deals
    const listMatch = path.match(/^\/api\/list\/([a-z_]+)\/?$/);
    if (listMatch && request.method === "GET") {
      return handleList(request, env, listMatch[1]);
    }

    return json({ ok: false, error: "not found", path }, 404, request);
  },
};
