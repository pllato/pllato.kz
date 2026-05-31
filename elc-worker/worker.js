// ── ELC CRM Worker ───────────────────────────────────────
// Phase 0: CORS + Firebase Auth verification + /health + /api/me
// Phase 2.1: RTDB-proxy endpoint /api/rtdb/{path}.json (read + PATCH)

import { jwtVerify, createRemoteJWKSet } from "jose";

// Allowed origins for CORS
const ALLOWED_ORIGINS = new Set([
  "https://pllato.kz",
  "https://www.pllato.kz",
  "https://crm.aminamed.kz",          // Aminamed CRM (та же кодовая база pllato-core-crm)
  "https://aminamed-crm.pages.dev",   // CF Pages preview deploys
  "https://pllato-core-crm.pages.dev",// CF Pages preview deploys (старое имя)
  "http://localhost:8080",
  "http://localhost:3000",
  "http://localhost:5173",            // Vite dev
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

// Email-based identity: Firebase Auth uid у новых юзеров не совпадает с uid'ами
// которые лежат в D1 (мигрированы из Bitrix). Email — единственный надёжный
// ключ. Эта функция по auth-токену достаёт email → ищет user в D1 → возвращает
// canonical (D1) uid + роль. Кешируется на уровне запроса.
async function resolveCanonicalUser(env, claims) {
  const email = (claims.email || '').toLowerCase().trim();
  if (!email) return { firebaseUid: claims.user_id || claims.sub, email: '', canonicalUid: null, role: 'agent', userRecord: null };

  // Найти запись в users по email (case-insensitive)
  const userRow = await env.DB.prepare(
    "SELECT uid, email, name, last_name, position, photo, active FROM users WHERE LOWER(email) = ? LIMIT 1"
  ).bind(email).first();

  const canonicalUid = userRow?.uid || (claims.user_id || claims.sub);

  // Найти роль (default agent если нет записи)
  const roleRow = await env.DB.prepare(
    "SELECT role, department FROM user_roles WHERE uid = ?"
  ).bind(canonicalUid).first();

  // Hardcoded admin для Платона (защита если запись в user_roles потеряется)
  const isPlatonByEmail = email === "uurraa@gmail.com";
  let role = roleRow?.role || (isPlatonByEmail ? "admin" : "agent");

  // Phase 2: ORG-структура определяет права. Director = super-admin.
  // Computed permissions: {pipelineIds (null=all), dealScope (own|team|all), teamUids}
  const orgPerms = await resolveOrgPermissions(env, canonicalUid);
  // Если user является Директором (top of org), эскалируем до admin
  if (orgPerms.isDirector) role = 'admin';

  return {
    firebaseUid: claims.user_id || claims.sub,
    email,
    canonicalUid,
    role,
    department: roleRow?.department || null,
    userRecord: userRow || null,
    orgPerms,
  };
}

// Phase 2: вычисляет права юзера через дерево org:structure.
// Юзер может быть в нескольких узлах (member/head). Эффективные права —
// UNION прав всех узлов где он состоит + всех их потомков (inheritance).
// Возвращает {isDirector, pipelineIds (null=все), dealScope, teamUids (Set)}.
async function resolveOrgPermissions(env, uid) {
  const defaults = { isDirector: false, pipelineIds: null, dealScope: 'own', teamUids: new Set(), hasAnyNode: false };
  if (!uid) return defaults;
  let structure = null;
  try {
    const row = await env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind('org:structure').first();
    if (row?.v) structure = JSON.parse(row.v);
  } catch (e) { console.warn('[orgPerms] parse failed:', e); return defaults; }
  if (!structure) return defaults;

  // Director?
  if (structure.director?.uid === uid) {
    return { isDirector: true, pipelineIds: null, dealScope: 'all', teamUids: new Set(), hasAnyNode: true };
  }

  // Обход дерева — собираем узлы где user в memberUids/headUid + их descendants
  const userNodes = [];  // ноды куда явно входит юзер
  const allNodes = [];   // плоский список всех узлов с reference на родителя для inheritance
  function walk(node, parents) {
    allNodes.push({ node, parents });
    const isUserHere = node.headUid === uid || (node.memberUids || []).includes(uid);
    if (isUserHere) userNodes.push({ node, parents });
    const children = node.subDepartments || node.departments || [];
    for (const child of children) walk(child, [...parents, node]);
  }
  for (const branch of (structure.branches || [])) walk(branch, []);
  if (!userNodes.length) return defaults;

  // Эффективные права = UNION node.permissions всех userNodes + всех их descendants
  // (потому что user, состоящий в верхнем узле, должен видеть всё что нижние видят)
  const relevantNodes = new Set();
  function addWithDescendants(n) {
    if (relevantNodes.has(n)) return;
    relevantNodes.add(n);
    const ch = n.subDepartments || n.departments || [];
    for (const c of ch) addWithDescendants(c);
  }
  for (const { node } of userNodes) addWithDescendants(node);

  // Агрегируем permissions
  let pipelineAccess = 'specific';
  const pipelineIdsSet = new Set();
  let dealScope = 'own';
  for (const node of relevantNodes) {
    const perms = node.permissions;
    if (!perms) continue;
    if (perms.pipelineAccess === 'all') pipelineAccess = 'all';
    else if (Array.isArray(perms.pipelineIds)) for (const pid of perms.pipelineIds) pipelineIdsSet.add(pid);
    // dealScope precedence: all > team(department) > own
    if (perms.dealScope === 'all') dealScope = 'all';
    else if (perms.dealScope === 'department' && dealScope !== 'all') dealScope = 'team';
  }

  // teamUids = uids всех людей из релевантных узлов (для dealScope='team')
  const teamUids = new Set();
  for (const node of relevantNodes) {
    if (node.headUid) teamUids.add(node.headUid);
    for (const u of (node.memberUids || [])) if (u) teamUids.add(u);
  }

  return {
    isDirector: false,
    pipelineIds: pipelineAccess === 'all' ? null : Array.from(pipelineIdsSet),
    dealScope,
    teamUids,
    hasAnyNode: true,
  };
}

// ── Audit log helper ──────────────────────────────────────
// Best-effort запись события (если падает — не блокируем основной запрос).
async function auditLog(env, me, action, targetType, targetId, meta) {
  try {
    await env.DB.prepare(`
      INSERT INTO audit_log (actor_uid, actor_email, action, target_type, target_id, meta, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      me.canonicalUid || me.firebaseUid || 'unknown',
      me.email || null,
      action,
      targetType || null,
      targetId || null,
      meta ? JSON.stringify(meta) : null,
    ).run();
  } catch (e) {
    console.error('[audit_log] write failed:', e.message);
  }
}

// Может ли юзер me редактировать конкретную запись?
// admin   → всегда true
// manager → если запись принадлежит кому-то из его отдела (включая его самого)
// agent   → только если запись принадлежит ему (responsible/created_by/changed_by/accomplices/auditors)
async function canEditRecord(env, me, tableName, recordId) {
  if (me.role === 'admin') return true;
  if (!me.canonicalUid) return false;

  // Какие поля считаем "принадлежностью" в каждой таблице
  const ownerFields = {
    deals:    ['responsible_uid', 'created_by_uid', 'modify_by_uid'],
    tasks:    ['responsible_uid', 'created_by_uid', 'changed_by_uid'],
    contacts: ['responsible_uid', 'created_by_uid', 'modify_by_uid'],
    companies:['responsible_uid', 'created_by_uid', 'modify_by_uid'],
  };
  const jsonOwnerFields = {
    tasks: ['accomplices', 'auditors'],
  };
  // Pipelines / users редактирует только admin (для users есть отдельный admin endpoint)
  const lookup = ownerFields[tableName];
  if (!lookup) return me.role === 'admin';

  const keyCol = 'id'; // все эти таблицы используют id (users — uid, но он не сюда)
  const cols = [...lookup, ...(jsonOwnerFields[tableName] || [])].join(', ');
  const row = await env.DB.prepare(
    `SELECT ${cols} FROM ${tableName} WHERE ${keyCol} = ? LIMIT 1`
  ).bind(recordId).first();
  if (!row) return false; // не существует — пусть write пройдёт как INSERT? Нет, INSERT через PUT — отдельный кейс.

  // Собираем uid'ы которые "владеют" этой записью
  const ownerUids = new Set();
  for (const f of lookup) if (row[f]) ownerUids.add(row[f]);
  for (const f of (jsonOwnerFields[tableName] || [])) {
    if (typeof row[f] === 'string' && row[f].startsWith('[')) {
      try {
        const arr = JSON.parse(row[f]);
        if (Array.isArray(arr)) for (const u of arr) if (u) ownerUids.add(String(u));
      } catch {}
    }
  }

  // agent — только если он сам в списке
  if (me.role === 'agent') return ownerUids.has(me.canonicalUid);

  // manager — если кто-то из его отдела (включая его) в списке
  if (me.role === 'manager') {
    if (!me.department) return ownerUids.has(me.canonicalUid);
    const { results: deptRows } = await env.DB.prepare(
      "SELECT uid FROM user_roles WHERE department = ?"
    ).bind(me.department).all();
    const deptUids = new Set(deptRows.map(r => r.uid));
    deptUids.add(me.canonicalUid);
    for (const u of ownerUids) if (deptUids.has(u)) return true;
    return false;
  }

  return false;
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
  deals: new Set(["custom_fields", "mirrored_in"]),
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
      const me = await resolveCanonicalUser(env, auth.claims);
      return await handleRtdbWrite(env, request, parts, me);
    }
    if (method === "DELETE") {
      const me = await resolveCanonicalUser(env, auth.claims);
      return await handleRtdbDelete(env, request, parts, me);
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
      // Возвращаем metadata о файле из files_queue таблицы (после миграции в R2).
      // Frontend (loadFilesIntoContainer) ждёт fileName / fileSize / contentType /
      // migrated / permanentlyFailed.
      if (rest.length === 0) return json({}, 200, request);
      return respondFilesQueueMeta(env, request, rest[0]);

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

async function respondFilesQueueMeta(env, request, fileId) {
  const { results } = await env.DB.prepare(
    "SELECT id, file_name, file_size, content_type, migrated, permanently_failed, error_message FROM files_queue WHERE id = ?"
  ).bind(fileId).all();
  if (!results || results.length === 0) return json(null, 200, request);
  const row = results[0];
  return json({
    fileName: row.file_name,
    fileSize: row.file_size,
    contentType: row.content_type,
    migrated: !!row.migrated,
    permanentlyFailed: !!row.permanently_failed,
    errorMessage: row.error_message || null,
  }, 200, request);
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
async function handleRtdbDelete(env, request, parts, me) {
  const [head, ...rest] = parts;
  const deletableTables = { pipelines: "id", deals: "id", tasks: "id", contacts: "id", companies: "id" };
  if (!deletableTables[head] || rest.length !== 1) {
    return json({ error: "delete not supported for this path", path: parts.join("/") }, 405, request);
  }
  const tableName = head;
  const keyCol = deletableTables[head];
  const id = rest[0];

  // Permissions: pipelines удаляет только admin; остальные — по canEditRecord
  if (tableName === "pipelines") {
    if (me?.role !== "admin") {
      return json({ error: "only admin can delete pipelines" }, 403, request);
    }
  } else {
    const allowed = await canEditRecord(env, me, tableName, id);
    if (!allowed) {
      return json({
        error: `you don't have permission to delete this ${tableName.slice(0, -1)}`,
        role: me?.role,
      }, 403, request);
    }
  }

  // Safety для pipelines — нельзя удалять если есть сделки в этой воронке
  if (tableName === "pipelines") {
    const linked = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM deals WHERE pipeline_id = ?"
    ).bind(id).first();
    if (linked && linked.n > 0) {
      return json({
        error: `cannot delete pipeline ${id}: ${linked.n} deals still reference it`,
        dealsCount: linked.n,
      }, 409, request);
    }
  }

  await env.DB.prepare(`DELETE FROM ${tableName} WHERE ${keyCol} = ?`).bind(id).run();
  await auditLog(env, me, "record_delete", tableName, id, null);
  return json({ ok: true, deleted: true }, 200, request);
}

async function handleRtdbWrite(env, request, parts, me) {
  const [head, ...rest] = parts;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json body" }, 400, request);
  }

  // Точечные UPDATE'ы по ключу. PUT работает как upsert (Firebase RTDB-style):
  // если записи нет — INSERT, иначе UPDATE по перечисленным полям.
  const updatableTables = {
    deals: "id", tasks: "id", contacts: "id", companies: "id",
    users: "uid", pipelines: "id",
  };
  if (updatableTables[head] && rest.length === 1) {
    const tableName = head;
    const keyCol = updatableTables[head];
    const id = rest[0];
    const jsonCols = JSON_COLS[tableName] || new Set();

    // Permissions:
    //   pipelines / users — только admin
    //   deals / tasks / contacts / companies — canEditRecord (admin/manager/agent
    //   по принадлежности). При INSERT через PUT не блокируем (agent может
    //   создать сделку — он становится owner'ом сам по responsible).
    if (tableName === "pipelines" || tableName === "users") {
      if (me?.role !== "admin") {
        return json({ error: `only admin can modify ${tableName}` }, 403, request);
      }
    } else {
      // Если запись существует — проверяем canEditRecord. Если нет (PUT-INSERT) — пропускаем.
      const existsRow = await env.DB.prepare(
        `SELECT ${keyCol} FROM ${tableName} WHERE ${keyCol} = ? LIMIT 1`
      ).bind(id).first();
      if (existsRow) {
        const allowed = await canEditRecord(env, me, tableName, id);
        if (!allowed) {
          return json({
            error: `you don't have permission to edit this ${tableName.slice(0, -1)}`,
            role: me?.role,
          }, 403, request);
        }
      }
      // PATCH несуществующей записи — раньше молча no-op; оставим так чтобы
      // не сломать legacy фронт. PUT-INSERT обработается ниже отдельной веткой.
      // PUT-INSERT — agent может создать; не-admin'у форсим owner-поля чтобы не подсовывал чужой uid
      if (!existsRow && request.method === "PUT" && me?.role !== "admin" && me?.canonicalUid) {
        const ownerForce = {
          deals:    ['responsible_uid', 'created_by_uid'],
          tasks:    ['responsible_uid', 'created_by_uid'],
          contacts: ['responsible_uid', 'created_by_uid'],
          companies:['responsible_uid', 'created_by_uid'],
        }[tableName] || [];
        for (const f of ownerForce) {
          const camel = toCamel(f);
          if (body[camel] && body[camel] !== me.canonicalUid) {
            // Не даём не-admin'у поставить чужой uid в owner. Молча подменяем.
            body[camel] = me.canonicalUid;
          } else if (!body[camel]) {
            body[camel] = me.canonicalUid;
          }
        }
      }
    }

    // Подготовим columns/values из body (с snake_case + JSON-stringify)
    const cols = [];
    const vals = [];
    for (const [k, v] of Object.entries(body)) {
      const snake = toSnake(k);
      let value = v;
      if (jsonCols.has(snake) && value !== null && typeof value !== "string") {
        value = JSON.stringify(value);
      }
      cols.push(snake);
      vals.push(value);
    }

    // PUT — upsert. PATCH — только UPDATE существующих полей.
    const isPut = request.method === "PUT";
    if (isPut) {
      // Проверяем существование
      const existing = await env.DB.prepare(
        `SELECT ${keyCol} FROM ${tableName} WHERE ${keyCol} = ?`
      ).bind(id).first();
      if (!existing) {
        // INSERT — добавляем keyCol если его нет в body
        const allCols = [...cols];
        const allVals = [...vals];
        if (!cols.includes(keyCol)) {
          allCols.unshift(keyCol);
          allVals.unshift(id);
        }
        const placeholders = allCols.map(() => "?").join(", ");
        const sql = `INSERT INTO ${tableName} (${allCols.join(", ")}) VALUES (${placeholders})`;
        await env.DB.prepare(sql).bind(...allVals).run();
        await auditLog(env, me, "record_create", tableName, id, { fields: cols });
        return json({ ok: true, created: true }, 200, request);
      }
    }

    if (cols.length === 0) return json({ ok: true }, 200, request);
    const setSQL = cols.map(c => `${c} = ?`).join(", ");
    const sql = `UPDATE ${tableName} SET ${setSQL} WHERE ${keyCol} = ?`;
    await env.DB.prepare(sql).bind(...vals, id).run();
    // В meta лишь имена полей — без значений (PII safety + размер audit_log)
    await auditLog(env, me, "record_patch", tableName, id, { fields: cols });
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
    searchFields: ["name", "last_name", "second_name", "phones", "emails"],
    // Для scope=mine — где я хоть как-то связан с контактом
    mineFields: ["responsible_uid", "created_by_uid", "modify_by_uid"],
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
    // scope=mine: responsible OR created_by OR changed_by OR accomplices(JSON LIKE) OR auditors(JSON LIKE)
    mineFields: ["responsible_uid", "created_by_uid", "changed_by_uid"],
    mineJsonFields: ["accomplices", "auditors"],
    sorts: {
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
    pipelineField: "pipeline_id",
    mineFields: ["responsible_uid", "created_by_uid", "modify_by_uid"],
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

  // Resolve canonical uid + role для scope-фильтрации
  const me = await resolveCanonicalUser(env, auth.claims);

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(200, Math.max(10, parseInt(url.searchParams.get("pageSize") || "50", 10) || 50));
  const q = (url.searchParams.get("q") || "").trim();
  const sortKey = url.searchParams.get("sort") || "";
  const status = (url.searchParams.get("status") || "").trim();
  const assignee = (url.searchParams.get("assignee") || "").trim();
  const stage = (url.searchParams.get("stage") || "").trim();
  const closed = (url.searchParams.get("closed") || "").trim();
  const pipeline = (url.searchParams.get("pipeline") || "").trim();
  // scope: mine | team | all
  //   agent   — только mine (всё остальное downgrade'ится)
  //   manager — mine | team (свой отдел); default team если есть department, иначе mine
  //   admin   — mine | team | all; default all; может смотреть произвольный отдел через ?department=X
  let scope = (url.searchParams.get("scope") || "").trim();
  if (!scope) {
    if (me.role === "admin") scope = "all";
    else if (me.role === "manager") scope = me.department ? "team" : "mine";
    else scope = "mine";
  }
  // Downgrade недозволенных scope'ов:
  if (scope === "all" && me.role !== "admin") scope = "mine";
  if (scope === "team" && me.role === "agent") scope = "mine";

  // Какой department целевой для scope=team?
  // - manager: всегда свой
  // - admin: может явно передать ?department=X (peek в чужой отдел); если не передал — свой
  let targetDepartment = me.department || null;
  if (scope === "team" && me.role === "admin") {
    const requested = (url.searchParams.get("department") || "").trim();
    if (requested) targetDepartment = requested;
  }
  // Если manager без department попросил team — downgrade в mine
  if (scope === "team" && me.role === "manager" && !targetDepartment) {
    scope = "mine";
  }

  const whereParts = [];
  const whereParams = [];

  if (q) {
    // SQLite LOWER() работает только с ASCII — для кириллицы возвращает
    // строку без изменений. Поэтому делаем case-insensitive вручную:
    // три варианта LIKE — как ввёл + всё малыми + Capitalize первой буквы.
    // Покрывает 95% случаев ("Кодекс", "кодекс", "КОДЕКС" → найдут "Кодекс").
    // Для tasks (1 search field) → 3 LIKE; для contacts (5 fields) → 15.
    const variants = new Set();
    variants.add("%" + q + "%");
    variants.add("%" + q.toLowerCase() + "%");
    if (q.length > 0) {
      const capitalized = q[0].toUpperCase() + q.slice(1).toLowerCase();
      variants.add("%" + capitalized + "%");
    }
    const variantList = [...variants];
    const clauses = cfg.searchFields.flatMap(f => variantList.map(_ => `${f} LIKE ?`));
    whereParts.push("(" + clauses.join(" OR ") + ")");
    for (let i = 0; i < cfg.searchFields.length; i++) {
      for (const v of variantList) whereParams.push(v);
    }
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

  if (pipeline && pipeline !== "all" && cfg.pipelineField) {
    // Для deals также включаем "зеркала": сделки чей основной pipeline_id не
    // совпадает, но в mirrored_in JSON содержат этот pipelineId как ключ.
    // mirrored_in хранится как {"pipeline_yrs00p":"STAGE_X", ...}.
    if (entity === "deals") {
      whereParts.push(`(${cfg.pipelineField} = ? OR mirrored_in LIKE ?)`);
      whereParams.push(pipeline, `%"${pipeline}":%`);
    } else {
      whereParts.push(`${cfg.pipelineField} = ?`);
      whereParams.push(pipeline);
    }
  }

  // scope=mine — фильтр на принадлежность записи юзеру
  // (responsible/created/changed/modify по any field в mineFields + LIKE
  // в JSON-полях accomplices/auditors)
  if (scope === "mine" && me.canonicalUid) {
    const orClauses = [];
    for (const f of (cfg.mineFields || [])) {
      orClauses.push(`${f} = ?`);
      whereParams.push(me.canonicalUid);
    }
    for (const f of (cfg.mineJsonFields || [])) {
      // accomplices: '["uid1","uid2",...]' → ищем '"uid"' substring (с кавычками
      // чтобы не матчилось частично)
      orClauses.push(`${f} LIKE ?`);
      whereParams.push(`%"${me.canonicalUid}"%`);
    }
    if (orClauses.length) {
      whereParts.push("(" + orClauses.join(" OR ") + ")");
    }
  }

  // scope=team — все записи, в которых задействован любой участник отдела
  // targetDepartment. Список uid'ов отдела достаём из user_roles одним запросом.
  // Если в отделе никого нет (или отдел не задан) — пустой результат
  // (вместо downgrade в "all", чтобы случайно не открыть admin'у чужие данные).
  let teamMembers = null;
  if (scope === "team") {
    if (!targetDepartment) {
      // Не должно случиться (manager без dept → mine уже выше), но на всякий
      whereParts.push("1 = 0");
    } else {
      const { results: deptRows } = await env.DB.prepare(
        "SELECT uid FROM user_roles WHERE department = ?"
      ).bind(targetDepartment).all();
      teamMembers = deptRows.map(r => r.uid);
      if (teamMembers.length === 0) {
        whereParts.push("1 = 0");
      } else {
        const placeholders = teamMembers.map(() => "?").join(",");
        const orClauses = [];
        for (const f of (cfg.mineFields || [])) {
          orClauses.push(`${f} IN (${placeholders})`);
          for (const uid of teamMembers) whereParams.push(uid);
        }
        // JSON-поля: для каждого uid отдельный LIKE — иначе IN не работает на JSON-substring.
        // На отделе из ~10 человек × 2 JSON-поля = 20 LIKE-веток. Приемлемо.
        for (const f of (cfg.mineJsonFields || [])) {
          for (const uid of teamMembers) {
            orClauses.push(`${f} LIKE ?`);
            whereParams.push(`%"${uid}"%`);
          }
        }
        if (orClauses.length) {
          whereParts.push("(" + orClauses.join(" OR ") + ")");
        }
      }
    }
  }

  if (closed !== "" && closed !== "all" && cfg.closedField) {
    const n = parseInt(closed, 10);
    if (!Number.isNaN(n)) {
      whereParts.push(`${cfg.closedField} = ?`);
      whereParams.push(n);
    }
  }

  // Фильтр диапазона дедлайнов — нужен Календарю (tasks). Без него /api/list/tasks
  // выдаёт первые 500 по deadline ASC, где новая task с future-deadline теряется
  // среди тысяч старых тасков с просроченными дедлайнами.
  // Поля принимают ISO-строки или 'YYYY-MM-DD'. Сравниваем как строки —
  // ISO формат сортируется корректно лексикографически.
  if (entity === "tasks") {
    const dlFrom = (url.searchParams.get("deadlineFrom") || "").trim();
    const dlTo = (url.searchParams.get("deadlineTo") || "").trim();
    if (dlFrom) { whereParts.push("deadline >= ?"); whereParams.push(dlFrom); }
    if (dlTo)   { whereParts.push("deadline <= ?"); whereParams.push(dlTo); }
  }

  // archived фильтр (только для deals — у contacts/tasks колонки нет).
  // По умолчанию архив скрыт. ?archived=1 — только архив, ?archived=all — все.
  if (entity === "deals") {
    const arch = (url.searchParams.get("archived") || "").trim();
    if (arch === "1" || arch === "true") {
      whereParts.push("archived = 1");
    } else if (arch === "all") {
      // не добавляем фильтр — показываем все
    } else {
      // default — скрываем архив
      whereParts.push("(archived IS NULL OR archived = 0)");
    }
  }

  // ──── Phase 2 + A: применение прав из ORG STRUCTURE ────
  // me.orgPerms = {isDirector, pipelineIds, dealScope, teamUids}
  // Если юзер админ или Директор — никаких доп. ограничений (видит всё).
  // Иначе применяем как HARD LIMIT поверх scope-фильтра фронта:
  //   * pipelineIds — список разрешённых воронок (если null = все, только deals)
  //   * dealScope (юзер изменил решение — теперь применяется И к контактам):
  //       own  → responsible/created = uid
  //       team → responsible/created IN teamUids
  //       all  → без доп. фильтра
  // Применяется к: deals, tasks, contacts. Не применяется к: pipelines, users (мета).
  if (me.role !== 'admin' && me.orgPerms && (entity === 'deals' || entity === 'tasks' || entity === 'contacts')) {
    const op = me.orgPerms;
    // Pipeline whitelist (только для deals — у tasks нет pipeline_id)
    if (entity === 'deals' && Array.isArray(op.pipelineIds)) {
      if (op.pipelineIds.length === 0) {
        whereParts.push("1 = 0");
      } else {
        const ph = op.pipelineIds.map(() => "?").join(",");
        whereParts.push(`pipeline_id IN (${ph})`);
        for (const pid of op.pipelineIds) whereParams.push(pid);
      }
    }
    // Deal-scope из org perms
    if (op.dealScope !== 'all') {
      const fields = cfg.mineFields || [];
      const jsonFields = cfg.mineJsonFields || [];
      const uids = op.dealScope === 'team' ? Array.from(op.teamUids || []) : [me.canonicalUid].filter(Boolean);
      if (uids.length === 0) {
        whereParts.push("1 = 0");
      } else if (fields.length || jsonFields.length) {
        const ph = uids.map(() => "?").join(",");
        const orC = [];
        for (const f of fields) {
          orC.push(`${f} IN (${ph})`);
          for (const u of uids) whereParams.push(u);
        }
        for (const f of jsonFields) {
          for (const u of uids) {
            orC.push(`${f} LIKE ?`);
            whereParams.push(`%"${u}"%`);
          }
        }
        if (orC.length) whereParts.push("(" + orC.join(" OR ") + ")");
      }
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

  // Для зеркал в /api/list/deals — подменяем stageId на стадию из mirrored_in
  // если основная воронка сделки не совпадает с запрошенной. Также проставляем
  // флаг _mirror=true чтобы фронт знал что drag-drop здесь обновляет зеркало.
  if (entity === "deals" && pipeline && pipeline !== "all") {
    for (const it of items) {
      if (it.pipelineId !== pipeline) {
        const mir = it.mirroredIn || {};
        if (mir[pipeline]) {
          it._mirror = true;
          it._primaryStageId = it.stageId;
          it._primaryPipelineId = it.pipelineId;
          it.stageId = mir[pipeline];
          it._viewPipelineId = pipeline; // в какой воронке смотрим
        }
      }
    }
  }

  return new Response(JSON.stringify({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasMore: offset + items.length < total,
    meta: {
      scope,                     // mine|team|all (применённый)
      role: me.role,             // текущая роль юзера
      canonicalUid: me.canonicalUid,
      department: me.department, // отдел текущего юзера
      targetDepartment: scope === "team" ? targetDepartment : null,
      teamSize: teamMembers ? teamMembers.length : null,
    },
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

// ── /api/files/{id} — streaming-отдача мигрированного файла из R2 ──
// auth: Authorization Bearer ИЛИ ?auth=token (для прямого <a href download>)
async function handleFileDownload(request, env, fileId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const meta = await env.DB.prepare(
    "SELECT id, file_name, file_size, content_type, r2_key, migrated FROM files_queue WHERE id = ?"
  ).bind(fileId).first();
  if (!meta) return json({ error: "file not found in queue", id: fileId }, 404, request);
  if (!meta.migrated || !meta.r2_key) {
    return json({ error: "file not migrated yet", id: fileId }, 409, request);
  }

  if (!env.FILES) {
    return json({ error: "R2 binding FILES not configured" }, 500, request);
  }

  const obj = await env.FILES.get(meta.r2_key);
  if (!obj) {
    return json({ error: "file missing in R2", id: fileId, r2_key: meta.r2_key }, 410, request);
  }

  const headers = new Headers();
  headers.set("Content-Type", meta.content_type || "application/octet-stream");
  if (meta.file_size) headers.set("Content-Length", String(meta.file_size));
  // attachment с filename* в UTF-8 — корректно для кириллицы
  const safeName = encodeURIComponent(meta.file_name || `file-${fileId}`);
  headers.set("Content-Disposition", `attachment; filename*=UTF-8''${safeName}`);
  // Файлы — immutable, можно кешировать долго
  headers.set("Cache-Control", "private, max-age=86400");
  const cors = corsHeaders(request);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);

  return new Response(obj.body, { status: 200, headers });
}

// ── /api/call/* — лог звонков ────────────────────────────────────────────
// Заполняется фронтом при инициировании/завершении звонка. Пока provider
// = 'tel-link' (заглушка). Когда подключим SIP — провайдер запишет
// recording_url + status автоматом.

async function handleCallEvent(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  let body;
  try { body = await request.json(); } catch {
    return json({ error: "invalid json body" }, 400, request);
  }

  // Если передан callId — апдейтим существующий (например, завершение звонка)
  if (body.callId) {
    const updates = [];
    const vals = [];
    for (const [k, v] of Object.entries(body)) {
      if (k === "callId") continue;
      const col = ({
        endedAt: "ended_at",
        durationSec: "duration_sec",
        status: "status",
        recordingUrl: "recording_url",
        recordingR2Key: "recording_r2_key",
        note: "note",
      })[k];
      if (!col) continue;
      updates.push(`${col} = ?`);
      vals.push(v);
    }
    if (!updates.length) return json({ ok: true, noop: true }, 200, request);
    vals.push(body.callId);
    await env.DB.prepare(
      `UPDATE call_log SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...vals).run();
    return json({ ok: true, id: body.callId }, 200, request);
  }

  // Иначе — INSERT нового события
  const direction = body.direction === "in" ? "in" : "out";
  const phone = String(body.phone || "").trim();
  if (!phone) return json({ error: "phone required" }, 400, request);

  const result = await env.DB.prepare(
    `INSERT INTO call_log (caller_uid, direction, phone, contact_id, deal_id,
      started_at, status, provider, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    auth.uid,
    direction,
    phone,
    body.contactId || null,
    body.dealId || null,
    body.startedAt || new Date().toISOString(),
    body.status || "attempted",
    body.provider || "tel-link",
    body.note || null,
  ).run();
  return json({ ok: true, id: result.meta?.last_row_id }, 200, request);
}

async function handleCallLog(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const url = new URL(request.url);
  const contactId = (url.searchParams.get("contactId") || "").trim();
  const dealId = (url.searchParams.get("dealId") || "").trim();
  const phone = (url.searchParams.get("phone") || "").trim();
  const limit = Math.min(200, parseInt(url.searchParams.get("limit") || "50", 10) || 50);

  const where = [];
  const params = [];
  if (contactId) { where.push("contact_id = ?"); params.push(contactId); }
  if (dealId)    { where.push("deal_id = ?");    params.push(dealId); }
  if (phone)     { where.push("phone LIKE ?");   params.push("%" + phone + "%"); }
  const whereSQL = where.length ? " WHERE " + where.join(" AND ") : "";

  const { results } = await env.DB.prepare(
    `SELECT * FROM call_log${whereSQL} ORDER BY started_at DESC LIMIT ?`
  ).bind(...params, limit).all();

  return json({
    items: results.map(r => ({
      id: r.id,
      callerUid: r.caller_uid,
      direction: r.direction,
      phone: r.phone,
      contactId: r.contact_id,
      dealId: r.deal_id,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      durationSec: r.duration_sec,
      status: r.status,
      recordingUrl: r.recording_url,
      provider: r.provider,
      note: r.note,
    })),
  }, 200, request);
}

// ── /api/sip/token — SIP-креды для browser WebRTC клиента ────────────────
// Секреты живут в Worker env (wrangler secret put SIP_PASSWORD ...).
// Frontend (team.html) fetch'ит этот endpoint вместо хардкода в HTML.
// Сейчас все авторизованные юзеры используют shared endpoint `100` —
// в будущем можно расширить до per-user PJSIP endpoints с разными creds.
async function handleSipToken(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const domain = env.SIP_DOMAIN || "130-61-243-44.nip.io";
  const user = env.SIP_USER || "100";
  const password = env.SIP_PASSWORD;
  if (!password) {
    return json({
      error: "SIP_PASSWORD secret not set on worker. Run: wrangler secret put SIP_PASSWORD",
    }, 500, request);
  }
  // ICE-серверы для WebRTC: STUN + TURN relay.
  // Primary: external metered.ca TURN (бесплатные 50GB/мес) — обходит hairpin
  // NAT loop (наш coturn на той же VM что Asterisk → Oracle Cloud не делает
  // hairpin для пакетов на собственный public IP).
  // Fallback: локальный coturn на VM (если metered не доступен).
  const iceServers = [
    // STUN от metered (если есть TURN) или наш локальный
    { urls: env.METERED_TURN_URL ? "stun:stun.relay.metered.ca:80" : `stun:${domain}:3478` },
  ];
  // metered TURN — primary (несколько портов/протоколов для max reliability)
  if (env.METERED_TURN_URL && env.METERED_TURN_USERNAME && env.METERED_TURN_PASSWORD) {
    // Извлекаем host из METERED_TURN_URL (формат "turn:host:port")
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
  // local coturn — fallback (только если metered не настроен)
  const localTurnUser = env.TURN_USER || "webrtc";
  const localTurnPass = env.TURN_PASSWORD;
  if (!env.METERED_TURN_URL && localTurnPass) {
    iceServers.push({
      urls: [`turn:${domain}:3478?transport=udp`, `turn:${domain}:3478?transport=tcp`],
      username: localTurnUser,
      credential: localTurnPass,
    });
  }
  return json({
    user,
    password,
    domain,
    wss: `wss://${domain}:8089/ws`,
    stun: `stun:${domain}:3478`,
    iceServers,
  }, 200, request);
}

// ── /api/admin/* — управление командой ───────────────────────────────────
// Все endpoint'ы требуют role=admin. Проверка через resolveCanonicalUser.

async function requireAdmin(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return { error: auth.error, status: auth.status };
  const me = await resolveCanonicalUser(env, auth.claims);
  if (me.role !== "admin") {
    return { error: "admin role required", status: 403 };
  }
  return { me };
}

// ── Deal-card handlers: archive, comments, timeline ──────────────────
// Архивация = soft-delete (deals.archived=1). Сделка остаётся в БД, но
// не показывается в канбане/списках. Можно восстановить.

async function handleDealArchive(request, env, dealId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);

  // Permission — может ли юзер редактировать сделку
  const allowed = await canEditRecord(env, me, "deals", dealId);
  if (!allowed) return json({ error: "no permission to archive this deal", role: me.role }, 403, request);

  let archived = 1;
  try {
    const body = await request.json();
    if (body.archived === false || body.archived === 0) archived = 0;
  } catch {}

  const nowIso = new Date().toISOString();
  await env.DB.prepare(`
    UPDATE deals SET archived = ?, archived_at = ?, archived_by = ?, bitrix_date_modify = ?
    WHERE id = ?
  `).bind(archived, archived ? nowIso : null, archived ? (me.canonicalUid || me.firebaseUid) : null, nowIso, dealId).run();

  // Audit log
  await auditLog(env, me, archived ? "deal_archive" : "deal_restore", "deal", dealId, null);

  // Авто-событие в timeline (чтобы видно было в ленте)
  await env.DB.prepare(`
    INSERT INTO timeline_activities (id, owner_type, owner_id, activity_type, author_uid, payload, created_at)
    VALUES (?, 'deal', ?, ?, ?, ?, datetime('now'))
  `).bind(
    'tl_arch_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    dealId,
    archived ? 'archived' : 'restored',
    me.canonicalUid || me.firebaseUid,
    JSON.stringify({ by: me.email || me.canonicalUid }),
  ).run();

  return json({ ok: true, dealId, archived }, 200, request);
}

// POST /api/deals/{id}/comments  { text }
async function handleDealComment(request, env, dealId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);

  // Чтение даём всем кто может видеть; запись — кто может редактировать.
  const allowed = await canEditRecord(env, me, "deals", dealId);
  if (!allowed) return json({ error: "no permission to comment on this deal", role: me.role }, 403, request);

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }
  const text = (body.text || '').trim();
  if (!text) return json({ error: "text required" }, 400, request);

  const id = 'tl_cmt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const nowIso = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO timeline_activities (id, owner_type, owner_id, activity_type, author_uid, bitrix_created, payload, created_at)
    VALUES (?, 'deal', ?, 'comment', ?, ?, ?, datetime('now'))
  `).bind(
    id, dealId, me.canonicalUid || me.firebaseUid, nowIso,
    JSON.stringify({ text, authorEmail: me.email, authorName: [me.userRecord?.last_name, me.userRecord?.name].filter(Boolean).join(' ').trim() || me.email }),
  ).run();

  // Bump deal modify time (чтобы поднялось в канбане)
  await env.DB.prepare(
    "UPDATE deals SET bitrix_date_modify = ? WHERE id = ?"
  ).bind(nowIso, dealId).run();

  return json({ ok: true, id, dealId, ts: nowIso }, 200, request);
}

// PATCH /api/deals/{id}/stage { pipelineId, stageId }
// Универсальный endpoint для перемещения сделки между стадиями. Если pipelineId
// совпадает с deal.pipeline_id — обновляет основную stage_id. Иначе обновляет
// "зеркало" в mirrored_in[pipelineId] (без затрагивания основной воронки).
async function handleDealStageChange(request, env, dealId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const allowed = await canEditRecord(env, me, "deals", dealId);
  if (!allowed) return json({ error: "no permission to edit this deal", role: me.role }, 403, request);

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }
  const pipelineId = String(body.pipelineId || '').trim();
  const stageId = String(body.stageId || '').trim();
  if (!pipelineId || !stageId) return json({ error: "pipelineId and stageId required" }, 400, request);

  const deal = await env.DB.prepare(
    "SELECT id, pipeline_id, stage_id, mirrored_in FROM deals WHERE id = ? LIMIT 1"
  ).bind(dealId).first();
  if (!deal) return json({ error: "deal not found", id: dealId }, 404, request);

  const nowIso = new Date().toISOString();
  if (deal.pipeline_id === pipelineId) {
    // Основная воронка — обычное обновление stage_id
    await env.DB.prepare(
      "UPDATE deals SET stage_id = ?, bitrix_date_modify = ? WHERE id = ?"
    ).bind(stageId, nowIso, dealId).run();
  } else {
    // Зеркало — обновляем mirrored_in[pipelineId]
    let mir = {};
    try { mir = deal.mirrored_in ? JSON.parse(deal.mirrored_in) : {}; } catch {}
    if (!mir || typeof mir !== 'object' || Array.isArray(mir)) mir = {};
    mir[pipelineId] = stageId;
    await env.DB.prepare(
      "UPDATE deals SET mirrored_in = ?, bitrix_date_modify = ? WHERE id = ?"
    ).bind(JSON.stringify(mir), nowIso, dealId).run();
  }

  await auditLog(env, me, "deal_stage_change", "deal", dealId, { pipelineId, stageId, isMirror: deal.pipeline_id !== pipelineId });

  // ── Auto-mirror triggers ───────────────────────────────────────────
  // Если у стадии есть autoMirrorTo: {pipelineId, stageId} — автоматически
  // создаём зеркало (если ещё нет). Срабатывает только когда сделка ВПЕРВЫЕ
  // попадает в стадию-с-триггером (не на каждый PATCH в той же стадии).
  const autoMirrored = [];
  try {
    const pip = await env.DB.prepare("SELECT stages FROM pipelines WHERE id = ?").bind(pipelineId).first();
    if (pip?.stages) {
      const stages = JSON.parse(pip.stages);
      const targetStage = stages?.[stageId];
      const trigger = targetStage?.autoMirrorTo;
      if (trigger && trigger.pipelineId && trigger.stageId) {
        // Не делаем зеркало в собственную воронку
        if (trigger.pipelineId !== deal.pipeline_id && trigger.pipelineId !== pipelineId) {
          // Перезагрузим mirrored_in (мог измениться выше)
          const fresh = await env.DB.prepare("SELECT mirrored_in FROM deals WHERE id = ?").bind(dealId).first();
          let mir = {};
          try { mir = fresh?.mirrored_in ? JSON.parse(fresh.mirrored_in) : {}; } catch {}
          if (!mir || typeof mir !== 'object' || Array.isArray(mir)) mir = {};
          // Срабатывает только если зеркала в этой воронке ещё нет — не перезатираем
          if (!mir[trigger.pipelineId]) {
            mir[trigger.pipelineId] = trigger.stageId;
            await env.DB.prepare(
              "UPDATE deals SET mirrored_in = ?, bitrix_date_modify = ? WHERE id = ?"
            ).bind(JSON.stringify(mir), nowIso, dealId).run();
            await auditLog(env, me, "deal_auto_mirror", "deal", dealId, {
              triggeredByStage: stageId,
              triggeredByPipeline: pipelineId,
              targetPipeline: trigger.pipelineId,
              targetStage: trigger.stageId,
            });
            autoMirrored.push({ pipelineId: trigger.pipelineId, stageId: trigger.stageId });
          }
        }
      }
    }
  } catch (e) {
    console.warn('[auto-mirror] failed:', e.message);
  }

  return json({
    ok: true, dealId, pipelineId, stageId,
    isMirror: deal.pipeline_id !== pipelineId,
    autoMirrored,
  }, 200, request);
}

// POST /api/deals/{id}/mirror { pipelineId, stageId } — добавить зеркало
// в другую воронку. Если stageId не указан — первая стадия воронки.
async function handleDealAddMirror(request, env, dealId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const allowed = await canEditRecord(env, me, "deals", dealId);
  if (!allowed) return json({ error: "no permission", role: me.role }, 403, request);

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }
  const pipelineId = String(body.pipelineId || '').trim();
  let stageId = String(body.stageId || '').trim();
  if (!pipelineId) return json({ error: "pipelineId required" }, 400, request);

  const deal = await env.DB.prepare(
    "SELECT id, pipeline_id, mirrored_in FROM deals WHERE id = ? LIMIT 1"
  ).bind(dealId).first();
  if (!deal) return json({ error: "deal not found", id: dealId }, 404, request);
  if (deal.pipeline_id === pipelineId) {
    return json({ error: "сделка уже в этой воронке как основной" }, 409, request);
  }

  // Если stageId не задан — берём первую стадию по sort из pipelines.stages
  if (!stageId) {
    const pip = await env.DB.prepare(
      "SELECT stages FROM pipelines WHERE id = ?"
    ).bind(pipelineId).first();
    if (!pip) return json({ error: "pipeline not found" }, 404, request);
    try {
      const stages = JSON.parse(pip.stages || '{}');
      const arr = Object.values(stages).sort((a, b) => (a.sort || 0) - (b.sort || 0));
      stageId = arr[0]?.statusId || arr[0]?.id || '';
    } catch {}
  }
  if (!stageId) return json({ error: "stageId required (no stages in pipeline)" }, 400, request);

  let mir = {};
  try { mir = deal.mirrored_in ? JSON.parse(deal.mirrored_in) : {}; } catch {}
  if (!mir || typeof mir !== 'object' || Array.isArray(mir)) mir = {};
  mir[pipelineId] = stageId;

  await env.DB.prepare(
    "UPDATE deals SET mirrored_in = ?, bitrix_date_modify = ? WHERE id = ?"
  ).bind(JSON.stringify(mir), new Date().toISOString(), dealId).run();

  await auditLog(env, me, "deal_mirror_add", "deal", dealId, { pipelineId, stageId });
  return json({ ok: true, dealId, pipelineId, stageId }, 200, request);
}

// DELETE /api/deals/{id}/mirror/{pipelineId} — убрать зеркало.
async function handleDealRemoveMirror(request, env, dealId, pipelineId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const allowed = await canEditRecord(env, me, "deals", dealId);
  if (!allowed) return json({ error: "no permission", role: me.role }, 403, request);

  const deal = await env.DB.prepare(
    "SELECT mirrored_in FROM deals WHERE id = ? LIMIT 1"
  ).bind(dealId).first();
  if (!deal) return json({ error: "deal not found" }, 404, request);
  let mir = {};
  try { mir = deal.mirrored_in ? JSON.parse(deal.mirrored_in) : {}; } catch {}
  if (mir && typeof mir === 'object') delete mir[pipelineId];
  await env.DB.prepare(
    "UPDATE deals SET mirrored_in = ?, bitrix_date_modify = ? WHERE id = ?"
  ).bind(Object.keys(mir).length ? JSON.stringify(mir) : null, new Date().toISOString(), dealId).run();

  await auditLog(env, me, "deal_mirror_remove", "deal", dealId, { pipelineId });
  return json({ ok: true, dealId, removedFrom: pipelineId }, 200, request);
}

// GET /api/deals/{id}/timeline — единая лента: timeline_activities + call_log + wa_messages
// (для сводного отображения в карточке сделки: комменты, события, звонки, WA-сообщения).
// Сортировка по времени desc.
async function handleDealTimeline(request, env, dealId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const url = new URL(request.url);
  const limit = Math.min(500, Math.max(20, parseInt(url.searchParams.get("limit") || "200", 10) || 200));

  // 1. timeline_activities — comments, archived, и пр.
  const tlRes = await env.DB.prepare(`
    SELECT id, activity_type, author_uid, bitrix_created, payload, created_at
    FROM timeline_activities
    WHERE owner_type='deal' AND owner_id=?
    ORDER BY COALESCE(bitrix_created, created_at) DESC
    LIMIT ?
  `).bind(dealId, limit).all();

  // 2. call_log — звонки по сделке
  const callRes = await env.DB.prepare(`
    SELECT id, caller_uid, direction, phone, started_at, ended_at, duration_sec, status, recording_url, recording_r2_key, provider, note
    FROM call_log
    WHERE deal_id = ?
    ORDER BY started_at DESC
    LIMIT 50
  `).bind(dealId).all();

  // 3. WA сообщения по сделке (последние 50)
  const waRes = await env.DB.prepare(`
    SELECT m.id, m.chat_id, m.direction, m.text, m.media_kind, m.media_url, m.media_file_name, m.ts
    FROM wa_messages m
    JOIN wa_chats c ON c.id = m.chat_id
    WHERE c.deal_id = ?
    ORDER BY m.ts DESC
    LIMIT 50
  `).bind(dealId).all();

  // Объединяем в общий список с типом
  const events = [];
  for (const r of (tlRes.results || [])) {
    const payload = r.payload ? tryParseJson(r.payload) : null;
    events.push({
      kind: r.activity_type === 'comment' ? 'comment' : (r.activity_type || 'event'),
      id: r.id,
      ts: r.bitrix_created || r.created_at,
      authorUid: r.author_uid,
      payload,
    });
  }
  for (const r of (callRes.results || [])) {
    events.push({
      kind: 'call',
      id: 'call_' + r.id,
      ts: r.started_at,
      authorUid: r.caller_uid,
      payload: {
        direction: r.direction,
        phone: r.phone,
        durationSec: r.duration_sec,
        status: r.status,
        recordingUrl: r.recording_url,
        provider: r.provider,
        note: r.note,
      },
    });
  }
  for (const r of (waRes.results || [])) {
    events.push({
      kind: 'wa',
      id: 'wa_' + r.id,
      ts: new Date(r.ts).toISOString(),
      authorUid: null,
      payload: {
        direction: r.direction,
        text: r.text,
        mediaKind: r.media_kind,
        mediaUrl: r.media_url,
        mediaFileName: r.media_file_name,
      },
    });
  }
  // Сортировка desc
  events.sort((a, b) => String(b.ts || '').localeCompare(String(a.ts || '')));

  return json({ items: events.slice(0, limit), total: events.length }, 200, request);
}

// ── Контакт: лента событий + комментарии (по образцу сделки) ─────────

// POST /api/contacts/{id}/comments { text }
async function handleContactComment(request, env, contactId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const allowed = await canEditRecord(env, me, "contacts", contactId);
  if (!allowed) return json({ error: "no permission to comment on this contact", role: me.role }, 403, request);

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }
  const text = (body.text || '').trim();
  if (!text) return json({ error: "text required" }, 400, request);

  const id = 'tl_cmt_c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const nowIso = new Date().toISOString();
  await env.DB.prepare(`
    INSERT INTO timeline_activities (id, owner_type, owner_id, activity_type, author_uid, bitrix_created, payload, created_at)
    VALUES (?, 'contact', ?, 'comment', ?, ?, ?, datetime('now'))
  `).bind(
    id, contactId, me.canonicalUid || me.firebaseUid, nowIso,
    JSON.stringify({ text, authorEmail: me.email, authorName: [me.userRecord?.last_name, me.userRecord?.name].filter(Boolean).join(' ').trim() || me.email }),
  ).run();
  await env.DB.prepare("UPDATE contacts SET bitrix_date_modify = ? WHERE id = ?").bind(nowIso, contactId).run();
  return json({ ok: true, id, contactId, ts: nowIso }, 200, request);
}

// GET /api/contacts/{id}/timeline — лента: timeline_activities + call_log + wa_messages
async function handleContactTimeline(request, env, contactId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const url = new URL(request.url);
  const limit = Math.min(500, Math.max(20, parseInt(url.searchParams.get("limit") || "200", 10) || 200));

  const tlRes = await env.DB.prepare(`
    SELECT id, activity_type, author_uid, bitrix_created, payload, created_at
    FROM timeline_activities
    WHERE owner_type='contact' AND owner_id=?
    ORDER BY COALESCE(bitrix_created, created_at) DESC
    LIMIT ?
  `).bind(contactId, limit).all();

  const callRes = await env.DB.prepare(`
    SELECT id, caller_uid, direction, phone, started_at, ended_at, duration_sec, status, recording_url, provider, note
    FROM call_log
    WHERE contact_id = ?
    ORDER BY started_at DESC
    LIMIT 50
  `).bind(contactId).all();

  const waRes = await env.DB.prepare(`
    SELECT m.id, m.chat_id, m.direction, m.text, m.media_kind, m.media_url, m.media_file_name, m.ts
    FROM wa_messages m
    JOIN wa_chats c ON c.id = m.chat_id
    WHERE c.contact_id = ?
    ORDER BY m.ts DESC
    LIMIT 50
  `).bind(contactId).all();

  const events = [];
  for (const r of (tlRes.results || [])) {
    const payload = r.payload ? tryParseJson(r.payload) : null;
    events.push({
      kind: r.activity_type === 'comment' ? 'comment' : (r.activity_type || 'event'),
      id: r.id, ts: r.bitrix_created || r.created_at,
      authorUid: r.author_uid, payload,
    });
  }
  for (const r of (callRes.results || [])) {
    events.push({
      kind: 'call', id: 'call_' + r.id, ts: r.started_at, authorUid: r.caller_uid,
      payload: { direction: r.direction, phone: r.phone, durationSec: r.duration_sec, status: r.status, recordingUrl: r.recording_url, provider: r.provider, note: r.note },
    });
  }
  for (const r of (waRes.results || [])) {
    events.push({
      kind: 'wa', id: 'wa_' + r.id, ts: new Date(r.ts).toISOString(), authorUid: null,
      payload: { direction: r.direction, text: r.text, mediaKind: r.media_kind, mediaUrl: r.media_url, mediaFileName: r.media_file_name },
    });
  }
  events.sort((a, b) => String(b.ts || '').localeCompare(String(a.ts || '')));
  return json({ items: events.slice(0, limit), total: events.length }, 200, request);
}

// ── Custom fields schema CRUD ────────────────────────────────────────
// GET /api/cf-schema/{entity}  → список всех полей сущности
// POST /api/cf-schema/{entity} { fieldName, label, dataType, multiple, sort, list }
// PATCH /api/cf-schema/{entity}/{fieldName}
// DELETE /api/cf-schema/{entity}/{fieldName}

async function handleCfSchemaList(request, env, entity) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  if (!['deal', 'contact', 'company'].includes(entity)) {
    return json({ error: "entity must be deal|contact|company" }, 400, request);
  }
  const { results } = await env.DB.prepare(`
    SELECT id, entity_type, field_name, label, data_type, mandatory, multiple, sort, list
    FROM custom_fields_schema
    WHERE entity_type = ?
    ORDER BY sort, id
  `).bind(entity).all();
  const items = (results || []).map(r => ({
    id: r.id,
    entityType: r.entity_type,
    fieldName: r.field_name,
    label: r.label,
    dataType: r.data_type,
    mandatory: !!r.mandatory,
    multiple: !!r.multiple,
    sort: r.sort,
    list: r.list ? tryParseJson(r.list) : null,
  }));
  return json({ items }, 200, request);
}

async function handleCfSchemaUpsert(request, env, entity, fieldName) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  if (!['deal', 'contact', 'company'].includes(entity)) {
    return json({ error: "entity must be deal|contact|company" }, 400, request);
  }
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }

  const fn = fieldName || (body.fieldName || '').trim();
  if (!fn) return json({ error: "fieldName required" }, 400, request);
  // sanitize fieldName: только латиница/цифры/_
  if (!/^[a-zA-Z0-9_]+$/.test(fn)) return json({ error: "fieldName must be a-z 0-9 _ only" }, 400, request);

  const label = (body.label || fn).trim();
  const dataType = (body.dataType || 'string').toLowerCase();
  const validTypes = ['string', 'text', 'integer', 'double', 'date', 'datetime', 'enumeration', 'boolean'];
  if (!validTypes.includes(dataType)) return json({ error: `dataType must be one of: ${validTypes.join(',')}` }, 400, request);

  const multiple = body.multiple ? 1 : 0;
  const mandatory = body.mandatory ? 1 : 0;
  const sort = body.sort != null ? parseInt(body.sort, 10) || 0 : 100;
  const listJson = body.list ? JSON.stringify(body.list) : null;

  // Идентификатор — entity:field
  const id = `${entity}:${fn}`;
  await env.DB.prepare(`
    INSERT INTO custom_fields_schema (id, entity_type, field_name, label, data_type, mandatory, multiple, sort, list)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      data_type = excluded.data_type,
      mandatory = excluded.mandatory,
      multiple = excluded.multiple,
      sort = excluded.sort,
      list = excluded.list
  `).bind(id, entity, fn, label, dataType, mandatory, multiple, sort, listJson).run();

  await auditLog(env, guard.me, "cf_schema_upsert", entity + "_cf", fn, { label, dataType, multiple });
  return json({ ok: true, id, entity, fieldName: fn, label, dataType, multiple: !!multiple, mandatory: !!mandatory, sort, list: body.list || null }, 200, request);
}

async function handleCfSchemaDelete(request, env, entity, fieldName) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  const id = `${entity}:${fieldName}`;
  await env.DB.prepare("DELETE FROM custom_fields_schema WHERE id = ?").bind(id).run();
  await auditLog(env, guard.me, "cf_schema_delete", entity + "_cf", fieldName, null);
  return json({ ok: true, id }, 200, request);
}

async function handleAdminListUsers(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);

  // LEFT JOIN users + user_roles + COUNT задач (для удобства видеть нагрузку)
  const { results } = await env.DB.prepare(`
    SELECT
      u.uid, u.email, u.name, u.last_name, u.position, u.photo, u.active,
      u.bitrix_id, u.last_login, u.migrated_at,
      r.role, r.department,
      (SELECT COUNT(*) FROM tasks WHERE responsible_uid = u.uid) AS tasks_count,
      (SELECT COUNT(*) FROM deals WHERE responsible_uid = u.uid) AS deals_count,
      (SELECT COUNT(*) FROM contacts WHERE responsible_uid = u.uid) AS contacts_count
    FROM users u
    LEFT JOIN user_roles r ON r.uid = u.uid
    ORDER BY r.role, u.last_name, u.name
  `).all();

  const items = results.map(r => ({
    uid: r.uid,
    email: r.email,
    name: r.name,
    lastName: r.last_name,
    position: r.position,
    photo: r.photo,
    active: r.active,
    bitrixId: r.bitrix_id,
    lastLogin: r.last_login,
    migratedAt: r.migrated_at,
    role: r.role || 'agent',           // default agent если нет в user_roles
    department: r.department || null,
    tasksCount: r.tasks_count || 0,
    dealsCount: r.deals_count || 0,
    contactsCount: r.contacts_count || 0,
  }));

  return json({ items, total: items.length }, 200, request);
}

async function handleAdminUpdateRole(request, env, targetUid) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);

  let body;
  try { body = await request.json(); } catch {
    return json({ error: "invalid json body" }, 400, request);
  }

  const role = (body.role || '').trim();
  if (!['admin', 'manager', 'agent'].includes(role)) {
    return json({ error: "role must be admin|manager|agent" }, 400, request);
  }
  const department = body.department ? String(body.department).trim() : null;

  // Защита: не даём admin'у downgrade'нуть самого себя (последний admin)
  if (guard.me.canonicalUid === targetUid && role !== 'admin') {
    const { results } = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM user_roles WHERE role = 'admin'"
    ).all();
    if ((results[0]?.n || 0) <= 1) {
      return json({ error: "cannot remove last admin role from yourself" }, 409, request);
    }
  }

  // Старая запись для audit (old vs new)
  const before = await env.DB.prepare(
    "SELECT role, department FROM user_roles WHERE uid = ?"
  ).bind(targetUid).first();

  await env.DB.prepare(`
    INSERT INTO user_roles (uid, role, department, granted_by, granted_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(uid) DO UPDATE SET
      role = excluded.role,
      department = excluded.department,
      granted_by = excluded.granted_by,
      granted_at = excluded.granted_at
  `).bind(targetUid, role, department, guard.me.canonicalUid).run();

  await auditLog(env, guard.me, "role_grant", "user", targetUid, {
    old: before ? { role: before.role, department: before.department } : null,
    new: { role, department },
  });

  return json({ ok: true, uid: targetUid, role, department }, 200, request);
}

// PATCH /api/admin/users/{uid}/active — soft delete (active=0) или восстановление.
// Не позволяет деактивировать последнего admin'а.
async function handleAdminSetUserActive(request, env, targetUid) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);

  let body;
  try { body = await request.json(); } catch {
    return json({ error: "invalid json body" }, 400, request);
  }
  const active = body.active === true || body.active === 1 ? 1 : 0;

  // Защита: нельзя деактивировать последнего admin'а
  if (active === 0) {
    const targetRole = await env.DB.prepare(
      "SELECT role FROM user_roles WHERE uid = ?"
    ).bind(targetUid).first();
    if (targetRole?.role === 'admin') {
      const { results } = await env.DB.prepare(
        `SELECT COUNT(*) AS n FROM user_roles r
         JOIN users u ON u.uid = r.uid
         WHERE r.role = 'admin' AND u.active = 1`
      ).all();
      if ((results[0]?.n || 0) <= 1) {
        return json({ error: "cannot deactivate last active admin" }, 409, request);
      }
    }
  }

  const before = await env.DB.prepare(
    "SELECT active FROM users WHERE uid = ?"
  ).bind(targetUid).first();
  if (!before) return json({ error: "user not found", uid: targetUid }, 404, request);

  await env.DB.prepare(
    "UPDATE users SET active = ? WHERE uid = ?"
  ).bind(active, targetUid).run();

  await auditLog(env, guard.me, active === 1 ? "user_activate" : "user_deactivate", "user", targetUid, {
    old: { active: before.active },
    new: { active },
  });

  return json({ ok: true, uid: targetUid, active }, 200, request);
}

// GET /api/admin/audit?limit=100&action=role_grant&targetType=user&targetId=X
async function handleAdminAuditLog(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);

  const url = new URL(request.url);
  const limit = Math.min(500, Math.max(10, parseInt(url.searchParams.get("limit") || "100", 10) || 100));
  const action = (url.searchParams.get("action") || "").trim();
  const targetType = (url.searchParams.get("targetType") || "").trim();
  const targetId = (url.searchParams.get("targetId") || "").trim();
  const actorUid = (url.searchParams.get("actorUid") || "").trim();

  const where = [];
  const params = [];
  if (action) { where.push("action = ?"); params.push(action); }
  if (targetType) { where.push("target_type = ?"); params.push(targetType); }
  if (targetId) { where.push("target_id = ?"); params.push(targetId); }
  if (actorUid) { where.push("actor_uid = ?"); params.push(actorUid); }
  const whereSQL = where.length ? "WHERE " + where.join(" AND ") : "";

  const { results } = await env.DB.prepare(`
    SELECT id, actor_uid, actor_email, action, target_type, target_id, meta, created_at
    FROM audit_log
    ${whereSQL}
    ORDER BY id DESC
    LIMIT ?
  `).bind(...params, limit).all();

  const items = results.map(r => ({
    id: r.id,
    actorUid: r.actor_uid,
    actorEmail: r.actor_email,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    meta: r.meta ? tryParseJson(r.meta) : null,
    createdAt: r.created_at,
  }));
  return json({ items, total: items.length }, 200, request);
}

// GET /api/admin/departments — список отделов с числом участников.
// Используется фронтом как datalist подсказок (manager dept editing) +
// в admin UI как фильтр "посмотреть отдел X".
async function handleAdminListDepartments(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);

  const { results } = await env.DB.prepare(`
    SELECT department, COUNT(*) AS member_count
    FROM user_roles
    WHERE department IS NOT NULL AND department != ''
    GROUP BY department
    ORDER BY department
  `).all();

  const items = results.map(r => ({
    department: r.department,
    memberCount: r.member_count || 0,
  }));

  return json({ items, total: items.length }, 200, request);
}

async function handleAdminCreateUser(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);

  let body;
  try { body = await request.json(); } catch {
    return json({ error: "invalid json body" }, 400, request);
  }

  const email = (body.email || '').toLowerCase().trim();
  const name = (body.name || '').trim();
  const lastName = (body.lastName || '').trim();
  const role = (body.role || 'agent').trim();
  if (!email) return json({ error: "email required" }, 400, request);
  if (!name) return json({ error: "name required" }, 400, request);
  if (!['admin', 'manager', 'agent'].includes(role)) {
    return json({ error: "role must be admin|manager|agent" }, 400, request);
  }

  // Проверяем дубликат email
  const existing = await env.DB.prepare(
    "SELECT uid FROM users WHERE LOWER(email) = ? LIMIT 1"
  ).bind(email).first();
  if (existing) {
    return json({ error: "user with this email already exists", uid: existing.uid }, 409, request);
  }

  // Генерируем uid типа local_xxxxx — отличается от Firebase Auth uid'ов.
  // Когда сотрудник залогинится через Google, его Firebase uid не совпадёт,
  // но email-matching в /api/me найдёт эту запись по email.
  const uid = 'local_' + Math.random().toString(36).slice(2, 12);
  const nowIso = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO users (uid, email, name, last_name, position, active, created_from_bitrix, last_login, migrated_at)
    VALUES (?, ?, ?, ?, ?, 1, 0, NULL, ?)
  `).bind(uid, email, name, lastName, body.position || null, nowIso).run();

  await env.DB.prepare(`
    INSERT INTO user_roles (uid, role, department, granted_by)
    VALUES (?, ?, ?, ?)
  `).bind(uid, role, body.department || null, guard.me.canonicalUid).run();

  await auditLog(env, guard.me, "user_create", "user", uid, {
    email, name, role, department: body.department || null,
  });

  return json({ ok: true, uid, email, name, role }, 200, request);
}

// ── WhatsApp Green-API ─────────────────────────────────────────────────
// Канал = один Green-API instance. Реквизиты в D1 (wa_channels), а не
// в Worker Secrets — admin может пере-привязать инстанс без редеплоя.
//
// Поток входящего: Green-API → POST /api/wa/webhook?token=...
//   (query-token т.к. Green-API не умеет Authorization Bearer)
//   → апсёртим wa_chats + wa_messages, находим/создаём контакта по phone,
//   автосоздаём сделку в default_pipeline (если нет открытой),
//   bumpим last_message_at + bitrix_date_modify сделки.
//
// Поток исходящего: Frontend → POST /api/wa/send → Green-API sendMessage,
// апсёртим wa_messages с direction='out'.

function normalizeWaPhone(input) {
  if (!input) return '';
  let digits = String(input).replace(/\D/g, '');
  // 8XXXXXXXXXX → 7XXXXXXXXXX (КЗ/РФ)
  if (digits.startsWith('8') && digits.length === 11) digits = '7' + digits.slice(1);
  return digits;
}

function waChatIdFromPhone(phone) {
  const digits = normalizeWaPhone(phone);
  return digits ? `${digits}@c.us` : null;
}

function waChatDocId(instanceId, chatId) { return `wa:${instanceId}:${chatId}`; }
function waMessageDocId(instanceId, waMessageId) { return `wa:${instanceId}:${waMessageId}`; }

async function getWaChannel(env, channelId) {
  return await env.DB.prepare("SELECT * FROM wa_channels WHERE id = ? LIMIT 1").bind(channelId).first();
}

async function getWaChannelByInstance(env, instanceId) {
  return await env.DB.prepare("SELECT * FROM wa_channels WHERE id_instance = ? LIMIT 1").bind(String(instanceId)).first();
}

// Найти / создать contact по phone (нормализованному).
async function findOrCreateContactByPhone(env, phone, name) {
  const digits = normalizeWaPhone(phone);
  if (!digits) return null;
  // SQLite LIKE по JSON-строке phones (контакты хранят JSON-массив)
  const variants = [`%"${digits}"%`, `%${digits}%`, `%+${digits}%`];
  for (const v of variants) {
    const row = await env.DB.prepare("SELECT id FROM contacts WHERE phones LIKE ? LIMIT 1").bind(v).first();
    if (row) return row.id;
  }
  const newId = 'contact_wa_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const nowIso = new Date().toISOString();
  const phonesJson = JSON.stringify([{ value: '+' + digits, valueType: 'WORK' }]);
  // FIX: contacts.last_name — NOT NULL. WA-контакт обычно даёт одно поле
  // senderName ("Гаухар🇰🇿…") без разделения. Кладём первое слово в name,
  // остальное — в last_name. Если только одно слово — last_name = ''.
  const display = (name || '+' + digits).trim();
  const parts = display.split(/\s+/);
  const firstName = parts[0] || display;
  const lastName = parts.slice(1).join(' ') || '';
  await env.DB.prepare(`
    INSERT INTO contacts (id, name, last_name, phones, source_description, bitrix_date_create, bitrix_date_modify)
    VALUES (?, ?, ?, ?, 'WhatsApp', ?, ?)
  `).bind(newId, firstName, lastName, phonesJson, nowIso, nowIso).run();
  return newId;
}

// Возвращаем ВСЕ сделки в воронке с этим телефоном из Fail-стадии в Новую.
// Юзер: «если в воронке к которой прикреплен Whatsapp есть несколько сделок
// в которых один и тот же номер, то все сделки должны либо подниматься
// вверх с бейджем непрочитанных и/или если в Центральном файле — уходить
// в Новые».
async function maybeReviveDealsFromFailByPhone(env, pipelineId, phone) {
  if (!pipelineId || !phone) return 0;
  const phoneDigits = String(phone).replace(/\D/g, '');
  if (!phoneDigits) return 0;
  // Все сделки в воронке у которых хоть один контакт с этим телефоном
  const { results: deals } = await env.DB.prepare(`
    SELECT d.id, d.stage_id, d.closed FROM deals d
    JOIN contacts c ON c.id = d.contact_id
    WHERE d.pipeline_id = ? AND c.phones LIKE ?
  `).bind(pipelineId, `%${phoneDigits}%`).all();
  if (!deals.length) return 0;
  const pipeline = await env.DB.prepare("SELECT stages FROM pipelines WHERE id = ?").bind(pipelineId).first();
  if (!pipeline?.stages) return 0;
  let stagesObj;
  try { stagesObj = JSON.parse(pipeline.stages); } catch { return 0; }
  const stages = Array.isArray(stagesObj) ? stagesObj : Object.values(stagesObj || {});
  if (stages.length === 0) return 0;
  stages.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  const firstStage = stages.find(s => s.semantics !== 'F' && s.semantics !== 'S') || stages[0];
  if (!firstStage) return 0;
  const newStageId = firstStage.statusId || firstStage.id;
  let revived = 0;
  for (const deal of deals) {
    const currentStage = stages.find(s => (s.statusId || s.id) === deal.stage_id);
    if (currentStage && currentStage.semantics === 'F') {
      await env.DB.prepare(`
        UPDATE deals SET stage_id = ?, closed = 0, bitrix_date_modify = ? WHERE id = ?
      `).bind(newStageId, new Date().toISOString(), deal.id).run();
      console.log('[wa-webhook] revived deal', deal.id, 'from', deal.stage_id, '→', newStageId);
      revived++;
    }
  }
  return revived;
}

// Создать сделку в default_pipeline канала, если по этому контакту нет открытой.
// FIX: убран `OR contact_ids LIKE ?` — в схеме deals нет колонки contact_ids
// (только contact_id). Падал D1_ERROR на каждом входящем webhook → все
// входящие сообщения терялись.
//
// FIX2: ищем сделки не только по точному contact_id, но и по ЛЮБОМУ контакту
// с тем же телефоном (когда есть дубли контактов — мигрированный из Bitrix +
// вручную созданный — без этого worker создавал бы новую сделку игнорируя
// существующую). Учитываем все стадии (включая closed=1) чтобы revive потом
// мог их вернуть из «Провал» в «Новые».
async function ensureDealForWaContact(env, channel, contactId, contactName, phone) {
  if (!channel.default_pipeline_id) return null;
  // 1) Точный поиск по contactId (быстрый путь — если 1 контакт = 1 сделка)
  let existing = await env.DB.prepare(`
    SELECT id FROM deals
    WHERE pipeline_id = ? AND contact_id = ?
    ORDER BY (closed = 0) DESC, bitrix_date_modify DESC LIMIT 1
  `).bind(channel.default_pipeline_id, contactId).first();
  // 2) Если не нашли — ищем по всем контактам с этим телефоном
  //    (защита от дублей контактов с одним номером)
  if (!existing && phone) {
    const phoneDigits = String(phone).replace(/\D/g, '');
    // contacts.phones — JSON массив [{type, value}], ищем substring
    existing = await env.DB.prepare(`
      SELECT id FROM deals
      WHERE pipeline_id = ?
        AND contact_id IN (SELECT id FROM contacts WHERE phones LIKE ?)
      ORDER BY (closed = 0) DESC, bitrix_date_modify DESC LIMIT 1
    `).bind(channel.default_pipeline_id, `%${phoneDigits}%`).first();
  }
  if (existing) return existing.id;
  // FIX: устанавливаем bitrix_id равным "wa_<rand>" — без него карточка
  // не открывается из канбана (data-deal-id="" если bitrix_id NULL),
  // и deep-link `#deal/...` не работает. Convention: deals.id = 'deal_' + bitrix_id.
  const bitrixKey = 'wa_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const newId = 'deal_' + bitrixKey;
  const nowIso = new Date().toISOString();
  const title = `WhatsApp: ${contactName || 'Новый клиент'}`;
  // Phase C: round-robin распределение по списку участников канала.
  // Если пул настроен (kv['wa:distribution:{channelId}']) — берём следующего uid.
  // Иначе fallback на channel.responsible_uid (как раньше).
  let responsibleUid = channel.responsible_uid || null;
  try {
    const rrUid = await pickNextRoundRobinUid(env, channel.id);
    if (rrUid) responsibleUid = rrUid;
  } catch (e) { /* fallback ok */ }
  await env.DB.prepare(`
    INSERT INTO deals (
      id, title, pipeline_id, stage_id, responsible_uid,
      contact_id, source_description, closed, bitrix_id,
      bitrix_date_create, bitrix_date_modify
    ) VALUES (?, ?, ?, ?, ?, ?, 'WhatsApp', 0, ?, ?, ?)
  `).bind(
    newId, title,
    channel.default_pipeline_id, channel.default_stage_id || null,
    responsibleUid,
    contactId, bitrixKey, nowIso, nowIso,
  ).run();
  return newId;
}

// Извлечь данные из Green-API webhook envelope (поддерживаем incoming +
// echo исходящих, чтобы синхронизировать наши же отправки через приложение
// Green-API на телефоне).
function extractWaWebhookEnvelope(body) {
  const type = body?.typeWebhook;
  if (!type) return null;
  const isIncoming = type === 'incomingMessageReceived';
  const isOutgoing = type === 'outgoingMessageReceived' || type === 'outgoingAPIMessageReceived';
  if (!isIncoming && !isOutgoing) return null;
  const instance = String(body?.instanceData?.idInstance || body?.idInstance || '');
  const chatId = body?.senderData?.chatId || body?.recipientData?.chatId;
  // Для индивидуальных чатов phone это номер; для групп — group-id, не показываем как телефон
  const isGroup = chatId?.endsWith('@g.us') || false;
  const phone = chatId && !isGroup ? chatId.split('@')[0] : null;
  // Для групп: chatName = имя группы (важно!), senderName = имя автора сообщения
  // Для индивидуальных: senderName = имя контакта
  const senderName = body?.senderData?.senderName || null;
  const chatName = body?.senderData?.chatName || null;  // имя группы для @g.us
  // displayName используется для wa_chats.name.
  // FIX: для ИСХОДЯЩИХ senderData.senderName = это МЫ САМИ (отправитель), не получатель.
  // Если использовать его как имя чата — затирается реальное имя контакта нашим
  // собственным номером (видно по 77011238888/9999, обоим записано "77066423098").
  // Поэтому для outgoing берём только chatName (если есть), иначе null — обработчик
  // выше использует contact.name или '+phone' как fallback и не перезатирает existing.
  let displayName;
  if (isGroup) {
    displayName = chatName || 'Группа';
  } else if (isIncoming) {
    displayName = senderName || chatName || null;
  } else {
    // outgoing — chatName это иногда имя получателя у Green-API; senderName = мы сами.
    displayName = chatName || null;
  }
  const waMessageId = body?.idMessage;
  const ts = (body?.timestamp || Math.floor(Date.now() / 1000)) * 1000;

  const md = body?.messageData || {};
  let text = '', mediaKind = null, mediaUrl = null, mediaFileName = null, mediaMimeType = null, caption = null;
  if (md.typeMessage === 'textMessage' || md.typeMessage === 'extendedTextMessage') {
    text = md.textMessageData?.textMessage || md.extendedTextMessageData?.text || '';
  } else if (md.typeMessage === 'imageMessage' || md.fileMessageData?.mimeType?.startsWith?.('image/')) {
    mediaKind = 'image';
    mediaUrl = md.fileMessageData?.downloadUrl || null;
    mediaFileName = md.fileMessageData?.fileName || null;
    mediaMimeType = md.fileMessageData?.mimeType || null;
    caption = md.fileMessageData?.caption || null;
  } else if (md.typeMessage === 'videoMessage' || md.fileMessageData?.mimeType?.startsWith?.('video/')) {
    mediaKind = 'video';
    mediaUrl = md.fileMessageData?.downloadUrl || null;
    mediaFileName = md.fileMessageData?.fileName || null;
    mediaMimeType = md.fileMessageData?.mimeType || null;
    caption = md.fileMessageData?.caption || null;
  } else if (md.typeMessage === 'audioMessage' || md.fileMessageData?.mimeType?.startsWith?.('audio/')) {
    mediaKind = 'audio';
    mediaUrl = md.fileMessageData?.downloadUrl || null;
    mediaMimeType = md.fileMessageData?.mimeType || null;
  } else if (md.typeMessage === 'documentMessage' || md.fileMessageData) {
    mediaKind = 'document';
    mediaUrl = md.fileMessageData?.downloadUrl || null;
    mediaFileName = md.fileMessageData?.fileName || null;
    mediaMimeType = md.fileMessageData?.mimeType || null;
    caption = md.fileMessageData?.caption || null;
  }
  return { direction: isIncoming ? 'in' : 'out', instanceId: instance, chatId, phone, senderName, chatName, displayName, isGroup, waMessageId, ts, text, mediaKind, mediaUrl, mediaFileName, mediaMimeType, caption };
}

// POST /api/wa/webhook?token=XXX — приёмник от Green-API.
// Без Firebase auth — Green-API не умеет Bearer.
async function handleWaWebhook(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }
  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get("token") || '';

  const evt = extractWaWebhookEnvelope(body);
  if (!evt) return json({ ok: true, ignored: true, type: body?.typeWebhook }, 200, request);
  const channel = await getWaChannelByInstance(env, evt.instanceId);
  if (!channel) return json({ error: "unknown instance", instance: evt.instanceId }, 404, request);
  if (channel.webhook_token && channel.webhook_token !== tokenFromQuery) {
    return json({ error: "invalid webhook token" }, 401, request);
  }
  if (!channel.active) return json({ ok: true, ignored: true, reason: "channel inactive" }, 200, request);

  const isGroup = evt.chatId?.endsWith('@g.us') || false;
  let contactId = null;
  if (!isGroup && evt.phone) contactId = await findOrCreateContactByPhone(env, evt.phone, evt.senderName);
  let dealId = null;
  if (evt.direction === 'in' && contactId && channel.default_pipeline_id) {
    dealId = await ensureDealForWaContact(env, channel, contactId, evt.senderName, evt.phone);
    // Auto-routing: ВСЕ сделки в воронке с этим телефоном (не только dealId)
    // — если в Fail-стадии, переводим в первую активную. Несколько сделок
    // на один номер допустимы: все они должны «оживать».
    if (evt.phone) {
      try { await maybeReviveDealsFromFailByPhone(env, channel.default_pipeline_id, evt.phone); }
      catch (e) { console.warn('[wa-webhook] revive failed:', e); }
    }
  }

  const chatDocId = waChatDocId(evt.instanceId, evt.chatId);
  const fromKind = evt.direction === 'in' ? 'them' : 'me';
  const incrUnread = evt.direction === 'in' ? 1 : 0;
  const preview = (evt.text || evt.caption || (evt.mediaKind ? `[${evt.mediaKind}]` : '')).slice(0, 200);

  const existingChat = await env.DB.prepare("SELECT id FROM wa_chats WHERE id = ?").bind(chatDocId).first();
  if (existingChat) {
    await env.DB.prepare(`
      UPDATE wa_chats SET
        last_message_text = ?, last_message_at = ?, last_message_from = ?,
        unread_count = COALESCE(unread_count, 0) + ?,
        contact_id = COALESCE(?, contact_id),
        deal_id = COALESCE(?, deal_id),
        name = COALESCE(NULLIF(?, ''), name),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(preview, evt.ts, fromKind, incrUnread, contactId, dealId, evt.displayName || evt.senderName || '', chatDocId).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO wa_chats (
        id, instance_id, chat_id, phone, is_group, name, contact_id, deal_id,
        last_message_text, last_message_at, last_message_from, unread_count, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      chatDocId, evt.instanceId, evt.chatId, evt.phone, isGroup ? 1 : 0,
      // Для группы — её имя из chatName, для контакта — senderName или +phone
      evt.displayName || evt.senderName || (isGroup ? 'Группа' : ('+' + (evt.phone || ''))),
      contactId, dealId, preview, evt.ts, fromKind, incrUnread,
    ).run();
  }

  if (evt.waMessageId) {
    const msgDocId = waMessageDocId(evt.instanceId, evt.waMessageId);
    await env.DB.prepare(`
      INSERT OR IGNORE INTO wa_messages (
        id, chat_id, wa_message_id, direction, text,
        media_kind, media_url, media_file_name, media_mime_type, caption, ts
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      msgDocId, chatDocId, evt.waMessageId, evt.direction, evt.text || null,
      evt.mediaKind, evt.mediaUrl, evt.mediaFileName, evt.mediaMimeType, evt.caption, evt.ts,
    ).run();
  }

  // Поднять сделку в канбане — обновим bitrix_date_modify (renderDeals
  // сортирует по нему, плюс это "свежая" сделка наверху списка).
  if (dealId) {
    const isoTs = new Date(evt.ts).toISOString();
    await env.DB.prepare("UPDATE deals SET bitrix_date_modify = ? WHERE id = ?").bind(isoTs, dealId).run();
  }

  return json({ ok: true, dealId, contactId, chatId: chatDocId }, 200, request);
}

// POST /api/wa/send { channelId, chatId, phone, text, mediaUrl, fileName }
async function handleWaSend(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }
  const channelId = body.channelId || '';
  let chatId = body.chatId || '';
  const phone = body.phone || '';
  const text = (body.text || '').trim();
  const mediaUrl = body.mediaUrl || '';
  const fileName = body.fileName || 'file';

  if (!chatId && phone) chatId = waChatIdFromPhone(phone);
  if (!chatId) return json({ error: "chatId or phone required" }, 400, request);

  let channel = channelId ? await getWaChannel(env, channelId) : null;
  if (!channel) {
    channel = await env.DB.prepare("SELECT * FROM wa_channels WHERE active = 1 ORDER BY created_at ASC LIMIT 1").first();
  }
  if (!channel) return json({ error: "no active WhatsApp channel configured" }, 503, request);

  const baseUrl = `${channel.api_url}/waInstance${channel.id_instance}`;
  const apiToken = channel.api_token_instance;
  let apiResp;
  try {
    if (mediaUrl) {
      const r = await fetch(`${baseUrl}/sendFileByUrl/${apiToken}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, urlFile: mediaUrl, fileName, caption: text || undefined }),
      });
      apiResp = await r.json().catch(() => ({ error: 'parse failed', status: r.status }));
    } else if (text) {
      const r = await fetch(`${baseUrl}/sendMessage/${apiToken}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: text }),
      });
      apiResp = await r.json().catch(() => ({ error: 'parse failed', status: r.status }));
    } else {
      return json({ error: "text or mediaUrl required" }, 400, request);
    }
  } catch (e) {
    return json({ error: "green-api fetch failed: " + e.message }, 502, request);
  }

  const waMessageId = apiResp?.idMessage || null;
  if (!waMessageId) return json({ error: "green-api did not return idMessage", apiResp }, 502, request);

  const chatDocId = waChatDocId(channel.id_instance, chatId);
  const nowMs = Date.now();
  const preview = (text || (mediaUrl ? `[file] ${fileName}` : '')).slice(0, 200);

  const existing = await env.DB.prepare("SELECT id FROM wa_chats WHERE id = ?").bind(chatDocId).first();
  if (existing) {
    await env.DB.prepare(`
      UPDATE wa_chats SET last_message_text = ?, last_message_at = ?, last_message_from = 'me', updated_at = datetime('now')
      WHERE id = ?
    `).bind(preview, nowMs, chatDocId).run();
  } else {
    const phoneDigits = chatId.split('@')[0];
    await env.DB.prepare(`
      INSERT INTO wa_chats (id, instance_id, chat_id, phone, name, last_message_text, last_message_at, last_message_from, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'me', datetime('now'))
    `).bind(chatDocId, channel.id_instance, chatId, phoneDigits, '+' + phoneDigits, preview, nowMs).run();
  }

  const msgDocId = waMessageDocId(channel.id_instance, waMessageId);
  await env.DB.prepare(`
    INSERT OR IGNORE INTO wa_messages (id, chat_id, wa_message_id, direction, text, media_kind, media_url, media_file_name, ts)
    VALUES (?, ?, ?, 'out', ?, ?, ?, ?, ?)
  `).bind(msgDocId, chatDocId, waMessageId, text || null, mediaUrl ? 'document' : null, mediaUrl || null, fileName, nowMs).run();

  await auditLog(env, me, "wa_send", "wa_chat", chatDocId, { hasMedia: !!mediaUrl });
  return json({ ok: true, idMessage: waMessageId, chatId: chatDocId }, 200, request);
}

// GET /api/wa/chats?scope=mine|team|all&limit=200
async function handleWaListChats(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);

  const url = new URL(request.url);
  const limit = Math.min(500, Math.max(10, parseInt(url.searchParams.get("limit") || "200", 10) || 200));
  let scope = (url.searchParams.get("scope") || "").trim();
  if (!scope) scope = me.role === "admin" ? "all" : "mine";
  if (scope === "all" && me.role !== "admin") scope = "mine";

  let whereSQL = "";
  const params = [];
  if (scope === "mine" && me.canonicalUid) {
    whereSQL = `WHERE (
      c.contact_id IN (SELECT id FROM contacts WHERE responsible_uid = ?)
      OR c.deal_id  IN (SELECT id FROM deals    WHERE responsible_uid = ?)
    )`;
    params.push(me.canonicalUid, me.canonicalUid);
  } else if (scope === "team" && me.department) {
    const { results: deptRows } = await env.DB.prepare(
      "SELECT uid FROM user_roles WHERE department = ?"
    ).bind(me.department).all();
    const uids = deptRows.map(r => r.uid);
    if (uids.length === 0) return json({ items: [], total: 0, scope, meta: { teamSize: 0 } }, 200, request);
    const ph = uids.map(() => "?").join(",");
    whereSQL = `WHERE (
      c.contact_id IN (SELECT id FROM contacts WHERE responsible_uid IN (${ph}))
      OR c.deal_id  IN (SELECT id FROM deals    WHERE responsible_uid IN (${ph}))
    )`;
    for (const u of uids) params.push(u);
    for (const u of uids) params.push(u);
  }

  const { results } = await env.DB.prepare(`
    SELECT c.* FROM wa_chats c ${whereSQL}
    ORDER BY c.last_message_at DESC LIMIT ?
  `).bind(...params, limit).all();

  const items = results.map(r => ({
    id: r.id, instanceId: r.instance_id, chatId: r.chat_id, phone: r.phone,
    isGroup: !!r.is_group, name: r.name, contactId: r.contact_id, dealId: r.deal_id,
    lastMessageText: r.last_message_text, lastMessageAt: r.last_message_at,
    lastMessageFrom: r.last_message_from, lastReadAt: r.last_read_at,
    unreadCount: r.unread_count || 0,
  }));
  return json({ items, total: items.length, scope }, 200, request);
}

// GET /api/wa/messages?chatId=X&limit=200&before=ts&since=ts
// since=ts — реактивный polling: вернуть только сообщения СВЕЖЕЕ ts.
// before=ts — пагинация вверх (история).
async function handleWaListMessages(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const url = new URL(request.url);
  const chatId = (url.searchParams.get("chatId") || "").trim();
  if (!chatId) return json({ error: "chatId required" }, 400, request);
  const limit = Math.min(500, Math.max(10, parseInt(url.searchParams.get("limit") || "200", 10) || 200));
  const before = parseInt(url.searchParams.get("before") || "0", 10) || 0;
  const since = parseInt(url.searchParams.get("since") || "0", 10) || 0;

  const where = ["chat_id = ?"];
  const params = [chatId];
  if (before > 0) { where.push("ts < ?"); params.push(before); }
  if (since > 0) { where.push("ts > ?"); params.push(since); }
  const { results } = await env.DB.prepare(`
    SELECT * FROM wa_messages WHERE ${where.join(" AND ")}
    ORDER BY ts DESC LIMIT ?
  `).bind(...params, limit).all();
  // Возвращаем в хронологическом порядке (старые → новые)
  const items = results.reverse().map(r => ({
    id: r.id, chatId: r.chat_id, waMessageId: r.wa_message_id,
    direction: r.direction, text: r.text,
    mediaKind: r.media_kind, mediaUrl: r.media_url,
    mediaFileName: r.media_file_name, mediaMimeType: r.media_mime_type,
    caption: r.caption, ts: r.ts,
  }));
  return json({ items, total: items.length, chatId }, 200, request);
}

// POST /api/wa/mark-read { chatId }
async function handleWaMarkRead(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }
  const chatId = body.chatId;
  if (!chatId) return json({ error: "chatId required" }, 400, request);
  await env.DB.prepare(`
    UPDATE wa_chats SET unread_count = 0, last_read_at = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(Date.now(), chatId).run();
  return json({ ok: true }, 200, request);
}

// GET /api/wa/deals-activity?pipeline=X
// Bulk indicator для канбана: возвращает по каждой сделке которая привязана
// к WA-чату — { unreadCount, lastIncomingTs, lastReadAt }. Используется для
// зелёных бейджей на канбан-карточках и сортировки сделок с непрочитанными
// наверх в колонке. ОДИН запрос для всей воронки, экономит трафик.
async function handleWaDealsActivity(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const url = new URL(request.url);
  const pipeline = (url.searchParams.get("pipeline") || "").trim();

  // Новая логика: JOIN через contacts.phones — активность применяется ко
  // ВСЕМ сделкам в воронке у которых контакт с телефоном из wa_chats.
  // Раньше группировали по wa_chats.deal_id (одной сделке) → если у клиента
  // несколько сделок с одним номером, бейдж был только на одной.
  // Юзер: «если в воронке есть несколько сделок с одним номером, ВСЕ они
  // должны подсвечиваться непрочитанным».
  const sql = `
    SELECT d.id AS deal_id,
           MAX(w.last_message_at) AS last_message_at,
           MAX(w.last_read_at) AS last_read_at,
           SUM(COALESCE(w.unread_count, 0)) AS unread_count,
           MAX(CASE WHEN w.last_message_from = 'them' THEN w.last_message_at ELSE 0 END) AS last_incoming_at
    FROM deals d
    INNER JOIN contacts c ON c.id = d.contact_id
    INNER JOIN wa_chats w ON w.phone IS NOT NULL AND w.phone != '' AND c.phones LIKE '%' || w.phone || '%'
    ${pipeline ? 'WHERE d.pipeline_id = ?' : ''}
    GROUP BY d.id
    HAVING unread_count > 0 OR last_message_at IS NOT NULL
  `;
  const params = pipeline ? [pipeline] : [];
  const { results } = await env.DB.prepare(sql).bind(...params).all();

  const items = results.map(r => ({
    dealId: r.deal_id,
    unreadCount: r.unread_count || 0,
    lastMessageAt: r.last_message_at,
    lastIncomingAt: r.last_incoming_at,
    lastReadAt: r.last_read_at,
  }));
  return json({ items, total: items.length }, 200, request);
}

// GET /api/call/missed-by-deal?pipeline=X
// Bulk: количество пропущенных входящих звонков по каждой сделке.
// Считаем "пропущенными" — direction='in' AND status IN ('no_answer','missed','cancelled')
// AND created_at > NOW() - 7 days (свежие, неделя). Старые игнорим, чтобы
// бейдж не висел вечно.
async function handleCallMissedByDeal(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const url = new URL(request.url);
  const pipeline = (url.searchParams.get("pipeline") || "").trim();
  const where = [
    "deal_id IS NOT NULL", "deal_id != ''",
    "direction = 'in'",
    "status IN ('no_answer','missed','cancelled','busy')",
    "datetime(started_at) > datetime('now', '-7 days')",
  ];
  const params = [];
  if (pipeline) {
    where.push("deal_id IN (SELECT id FROM deals WHERE pipeline_id = ?)");
    params.push(pipeline);
  }
  const { results } = await env.DB.prepare(`
    SELECT deal_id, COUNT(*) AS missed_count, MAX(started_at) AS last_missed_at
    FROM call_log
    WHERE ${where.join(" AND ")}
    GROUP BY deal_id
  `).bind(...params).all();

  const items = results.map(r => ({
    dealId: r.deal_id,
    missedCount: r.missed_count || 0,
    lastMissedAt: r.last_missed_at,
  }));
  return json({ items, total: items.length }, 200, request);
}

// POST /api/wa/mark-read-by-deal { dealId }
// Помечает все WA-чаты сделки как прочитанные одним запросом.
async function handleWaMarkReadByDeal(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }
  const dealId = body.dealId;
  if (!dealId) return json({ error: "dealId required" }, 400, request);
  await env.DB.prepare(`
    UPDATE wa_chats SET unread_count = 0, last_read_at = ?, updated_at = datetime('now')
    WHERE deal_id = ?
  `).bind(Date.now(), dealId).run();
  return json({ ok: true }, 200, request);
}

// ── WhatsApp admin: каналы ────────────────────────────────────────
async function handleWaListChannels(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  const { results } = await env.DB.prepare(
    "SELECT id, id_instance, api_url, display_name, active, default_pipeline_id, default_stage_id, responsible_uid, webhook_token, created_at FROM wa_channels ORDER BY created_at"
  ).all();
  return json({ items: results }, 200, request);
}

// GET /api/wa/channels/public — нужен фронт-виджету (любому юзеру) чтобы
// группировать чаты по каналам с человечным названием канала + воронки.
// Без api_token/webhook_token. Фильтр по orgPerms: если у юзера белый список
// pipelineIds — показываем только каналы с default_pipeline_id из этого списка.
async function handleWaListChannelsPublic(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);

  const { results } = await env.DB.prepare(
    "SELECT id, id_instance, display_name, active, default_pipeline_id FROM wa_channels WHERE active = 1 ORDER BY display_name, created_at"
  ).all();

  // Подтянем названия воронок одним запросом.
  const pipelineIds = [...new Set(results.map(r => r.default_pipeline_id).filter(Boolean))];
  let pipelineNames = {};
  if (pipelineIds.length > 0) {
    const ph = pipelineIds.map(() => "?").join(",");
    const { results: pipes } = await env.DB.prepare(
      `SELECT id, name FROM pipelines WHERE id IN (${ph})`
    ).bind(...pipelineIds).all();
    for (const p of pipes) pipelineNames[p.id] = p.name;
  }

  // Permission filter — если у юзера whitelist pipelineIds (orgPerms), скрываем
  // каналы которые routing на чужие воронки. Admin/director — видит всё.
  let allowed = results;
  if (me.role !== 'admin' && me.orgPerms && Array.isArray(me.orgPerms.pipelineIds)) {
    const whitelist = new Set(me.orgPerms.pipelineIds);
    allowed = results.filter(r => !r.default_pipeline_id || whitelist.has(r.default_pipeline_id));
  }

  const items = allowed.map(r => ({
    id: r.id,
    idInstance: r.id_instance,
    displayName: r.display_name || ('Канал ' + r.id_instance),
    pipelineId: r.default_pipeline_id,
    pipelineName: r.default_pipeline_id ? (pipelineNames[r.default_pipeline_id] || '—') : null,
  }));
  return json({ items, total: items.length }, 200, request);
}

// Автонастройка webhook URL и нужных событий в Green-API через метод setSettings.
// Возвращает {ok, configured, response, error}. Не бросает — caller разбирает.
async function applyWaWebhookSetupToGreenApi({ apiUrl, idInstance, apiToken, webhookUrl }) {
  try {
    const url = `${apiUrl}/waInstance${idInstance}/setSettings/${apiToken}`;
    const settingsBody = {
      webhookUrl,
      webhookUrlToken: '',  // мы используем query-token внутри webhookUrl
      outgoingWebhook: 'yes',
      outgoingMessageWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
      incomingWebhook: 'yes',
      stateWebhook: 'yes',
      deviceWebhook: 'yes',
      markIncomingMessagesReaded: 'no',
    };
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsBody),
    });
    const respData = await r.json().catch(() => ({}));
    return {
      ok: r.ok,
      configured: r.ok && (respData.saveSettings === true || respData.saveSettings === 1),
      response: respData,
      status: r.status,
    };
  } catch (e) {
    return { ok: false, configured: false, error: e.message };
  }
}

async function handleWaCreateChannel(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const idInstance = String(body.idInstance || '').trim();
  const apiToken = String(body.apiTokenInstance || '').trim();
  if (!idInstance || !apiToken) return json({ error: "idInstance and apiTokenInstance required" }, 400, request);
  const id = 'wa_' + idInstance;
  // КРИТИЧНО: если канал уже существует — переиспользуем его webhook_token.
  // Если генерить новый при каждом save, в Green-API остаётся прописан старый
  // URL → webhook с новым токеном после auto-setup пройдёт, а до setup
  // приходящие callback'и с СТАРЫМ токеном будут отбиваться нашим
  // 401-валидатором. Старый баг: канал был создан с whk_9w1axp8i7bu в
  // Green-API, потом пересоздан → в D1 стал whk_w10aqw8azrk → все входящие
  // отбивались с 401 «invalid webhook token». Найдено и руками исправлено
  // 2026-05-30.
  const existing = await env.DB.prepare("SELECT webhook_token FROM wa_channels WHERE id = ?").bind(id).first();
  const webhookToken = body.webhookToken
    || existing?.webhook_token
    || ('whk_' + Math.random().toString(36).slice(2, 14));
  const apiUrl = body.apiUrl || 'https://api.green-api.com';
  await env.DB.prepare(`
    INSERT INTO wa_channels (
      id, id_instance, api_url, api_token_instance, webhook_token,
      display_name, active, default_pipeline_id, default_stage_id, responsible_uid, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      api_token_instance = excluded.api_token_instance,
      display_name       = excluded.display_name,
      default_pipeline_id= excluded.default_pipeline_id,
      default_stage_id   = excluded.default_stage_id,
      responsible_uid    = excluded.responsible_uid,
      updated_at         = datetime('now')
      -- webhook_token НЕ обновляем — сохраняем тот что прописан в Green-API
  `).bind(
    id, idInstance, apiUrl, apiToken, webhookToken,
    body.displayName || ('Green-API ' + idInstance),
    body.defaultPipelineId || null, body.defaultStageId || null, body.responsibleUid || null,
  ).run();
  await auditLog(env, guard.me, "wa_channel_upsert", "wa_channel", id, { idInstance, reusedToken: !!existing });

  // Автонастройка webhook в Green-API кабинете — чтобы юзеру не пришлось
  // вручную вставлять URL и включать события. Если не получилось —
  // не падаем, просто возвращаем флаг + остаётся ручной режим как fallback.
  const webhookUrl = `https://pllato-elc-worker.uurraa.workers.dev/api/wa/webhook?token=${webhookToken}`;
  const setup = await applyWaWebhookSetupToGreenApi({ apiUrl, idInstance, apiToken, webhookUrl });

  return json({
    ok: true, id, webhookToken, webhookUrl,
    webhookConfigured: setup.configured,
    webhookSetupResponse: setup.response,
    webhookSetupError: setup.error || null,
  }, 200, request);
}

// POST /api/wa/channels/{id}/setup-webhook
// Для уже существующих каналов — повторно применить настройки webhook в Green-API.
async function handleWaChannelSetupWebhook(request, env, channelId) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  const channel = await getWaChannel(env, channelId);
  if (!channel) return json({ error: "channel not found" }, 404, request);
  const webhookUrl = `https://pllato-elc-worker.uurraa.workers.dev/api/wa/webhook?token=${channel.webhook_token || ''}`;
  const setup = await applyWaWebhookSetupToGreenApi({
    apiUrl: channel.api_url,
    idInstance: channel.id_instance,
    apiToken: channel.api_token_instance,
    webhookUrl,
  });
  await auditLog(env, guard.me, "wa_webhook_setup", "wa_channel", channelId, { configured: setup.configured });
  return json({
    ok: setup.configured,
    webhookConfigured: setup.configured,
    webhookUrl,
    response: setup.response,
    error: setup.error || null,
  }, setup.configured ? 200 : 502, request);
}

async function handleWaUpdateChannel(request, env, channelId) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const allowedFields = {
    display_name: body.displayName,
    api_url: body.apiUrl,
    api_token_instance: body.apiTokenInstance,
    webhook_token: body.webhookToken,
    active: body.active === false ? 0 : (body.active === true ? 1 : undefined),
    default_pipeline_id: body.defaultPipelineId,
    default_stage_id: body.defaultStageId,
    responsible_uid: body.responsibleUid,
  };
  const sets = [], params = [];
  for (const [col, val] of Object.entries(allowedFields)) {
    if (val === undefined) continue;
    sets.push(`${col} = ?`); params.push(val);
  }
  if (!sets.length) return json({ error: "no fields to update" }, 400, request);
  sets.push("updated_at = datetime('now')");
  params.push(channelId);
  await env.DB.prepare(`UPDATE wa_channels SET ${sets.join(", ")} WHERE id = ?`).bind(...params).run();
  await auditLog(env, guard.me, "wa_channel_update", "wa_channel", channelId, {
    fields: Object.keys(allowedFields).filter(k => allowedFields[k] !== undefined),
  });
  return json({ ok: true, id: channelId }, 200, request);
}

async function handleWaChannelState(request, env, channelId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const channel = await getWaChannel(env, channelId);
  if (!channel) return json({ error: "channel not found" }, 404, request);
  try {
    const r = await fetch(`${channel.api_url}/waInstance${channel.id_instance}/getStateInstance/${channel.api_token_instance}`);
    const data = await r.json().catch(() => ({}));
    return json({ ok: true, ...data }, 200, request);
  } catch (e) {
    return json({ error: "green-api fetch failed: " + e.message }, 502, request);
  }
}

async function handleWaChannelQr(request, env, channelId) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  const channel = await getWaChannel(env, channelId);
  if (!channel) return json({ error: "channel not found" }, 404, request);
  try {
    const r = await fetch(`${channel.api_url}/waInstance${channel.id_instance}/qr/${channel.api_token_instance}`);
    const data = await r.json().catch(() => ({}));
    return json({ ok: true, ...data }, 200, request);
  } catch (e) {
    return json({ error: "green-api fetch failed: " + e.message }, 502, request);
  }
}

// ── Org structure (иерархия компании: Директор → Отделения → Отделы → Подотделы) ──
// Хранится одним JSON-блобом в kv['org:structure']. Доступ — admin для PUT,
// auth для GET (любой залогиненный смотрит read-only).
function defaultOrgStructure() {
  const branches = [];
  for (let i = 1; i <= 7; i++) {
    branches.push({
      id: `br_${i}`,
      name: `Отделение ${i}`,
      headUid: null,
      memberUids: [],
      departments: [],
    });
  }
  return {
    director: { uid: null, title: 'Директор' },
    branches,
    updatedAt: null,
    updatedBy: null,
  };
}

// Normalize director: в старой БД мог сохраниться как строка (uid) вместо
// объекта {uid, title}. Это ломало frontend: dropdown в карточке директора
// показывал «не назначен» после reload. Нормализуем при чтении И записи.
function normalizeOrgDirector(d) {
  if (!d) return { uid: null, title: 'Директор' };
  if (typeof d === 'string') return { uid: d, title: 'Директор' };
  if (typeof d === 'object') {
    return {
      uid: d.uid != null ? d.uid : null,
      title: d.title || 'Директор',
      notes: d.notes || undefined,
    };
  }
  return { uid: null, title: 'Директор' };
}

async function handleOrgStructureGet(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const row = await env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind('org:structure').first();
  let structure = defaultOrgStructure();
  if (row && row.v) {
    try {
      const parsed = JSON.parse(row.v);
      // Нормализация director — может быть строкой из-за старого бага
      parsed.director = normalizeOrgDirector(parsed.director);
      if (!Array.isArray(parsed.branches) || parsed.branches.length === 0) {
        parsed.branches = defaultOrgStructure().branches;
      }
      structure = parsed;
    } catch (e) {
      console.warn('[org] failed to parse stored structure, using default:', e);
    }
  }
  return json({ ok: true, structure }, 200, request);
}

async function handleOrgStructurePut(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }
  const incoming = body.structure;
  if (!incoming || typeof incoming !== 'object') {
    return json({ error: "structure object required" }, 400, request);
  }
  // Простая валидация + нормализация: director может прилететь строкой
  incoming.director = normalizeOrgDirector(incoming.director);
  if (!Array.isArray(incoming.branches)) {
    return json({ error: "structure.branches[] required" }, 400, request);
  }
  incoming.updatedAt = new Date().toISOString();
  incoming.updatedBy = guard.me?.canonicalUid || guard.me?.email || null;
  const v = JSON.stringify(incoming);
  await env.DB.prepare(`
    INSERT INTO kv (k, v) VALUES (?, ?)
    ON CONFLICT(k) DO UPDATE SET v = excluded.v
  `).bind('org:structure', v).run();
  return json({ ok: true, structure: incoming }, 200, request);
}

// ── Permissions (виды прав, хранятся как JSON в kv['org:permissions']) ──
// Сейчас сохраняем только определения ролей; применение к запросам
// (фильтр воронок/стадий) — следующая фаза. Структура совместима с будущим
// расширением: stageRestrictions — карта {pipelineId: [stageId, ...]}.
function defaultPermissions() {
  const mk = (id, name, description) => ({
    id, name, description,
    scope: 'all',               // own | team | all
    pipelineAccess: 'all',      // all | specific
    pipelineIds: [],            // когда pipelineAccess === 'specific'
    stageRestrictions: {},      // {pipelineId: [stageId, ...]} (пусто = все)
  });
  return {
    roles: [
      mk('id', 'ИД', 'Исполнительный директор'),
      mk('reg_6', 'Рег 6', 'Регистратор 6'),
      mk('reg_2', 'Рег 2', 'Регистратор 2'),
      mk('head_teachers', 'Глава преподавателей', 'Руководитель отдела преподавания'),
      mk('teacher', 'Преподаватель', 'Преподаватель'),
      mk('reception', 'Ресепшн', 'Сотрудник ресепшна'),
      mk('head_promo', 'Глава Продвижения', 'Руководитель отдела продвижения/маркетинга'),
    ],
    updatedAt: null,
    updatedBy: null,
  };
}

async function handlePermissionsGet(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const row = await env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind('org:permissions').first();
  let perms = defaultPermissions();
  if (row && row.v) {
    try {
      const parsed = JSON.parse(row.v);
      if (Array.isArray(parsed.roles)) perms = parsed;
    } catch (e) {
      console.warn('[perms] failed to parse stored, using default:', e);
    }
  }
  return json({ ok: true, permissions: perms }, 200, request);
}

async function handlePermissionsPut(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }
  const incoming = body.permissions;
  if (!incoming || !Array.isArray(incoming.roles)) {
    return json({ error: "permissions.roles[] required" }, 400, request);
  }
  // Базовая валидация ролей
  for (const r of incoming.roles) {
    if (!r.id || typeof r.id !== 'string') return json({ error: "role.id required" }, 400, request);
    if (!r.name || typeof r.name !== 'string') return json({ error: "role.name required" }, 400, request);
    if (!['own', 'team', 'all'].includes(r.scope)) r.scope = 'all';
    if (!['all', 'specific'].includes(r.pipelineAccess)) r.pipelineAccess = 'all';
    if (!Array.isArray(r.pipelineIds)) r.pipelineIds = [];
    if (typeof r.stageRestrictions !== 'object' || !r.stageRestrictions) r.stageRestrictions = {};
  }
  incoming.updatedAt = new Date().toISOString();
  incoming.updatedBy = guard.me?.canonicalUid || guard.me?.email || null;
  const v = JSON.stringify(incoming);
  await env.DB.prepare(`
    INSERT INTO kv (k, v) VALUES (?, ?)
    ON CONFLICT(k) DO UPDATE SET v = excluded.v
  `).bind('org:permissions', v).run();
  return json({ ok: true, permissions: incoming }, 200, request);
}

// ── WhatsApp media upload + public serve ──
// Upload через нашу CRM: POST /api/wa/upload (auth) сохраняет в R2,
// возвращает publicUrl который сразу можно передать в Green-API sendFileByUrl.
// Serve через /api/wa/file/{key} — БЕЗ auth, чтобы Green-API мог скачать
// и переотправить в WhatsApp.
async function handleWaUpload(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  if (!env.FILES) return json({ error: "R2 binding FILES not configured" }, 500, request);
  const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
  // Имя файла берём из X-File-Name (URI-encoded), иначе генерим
  let fileName = 'file';
  const xfn = request.headers.get('X-File-Name');
  if (xfn) { try { fileName = decodeURIComponent(xfn); } catch { fileName = xfn; } }
  // Уникальный R2 key с префиксом wa-upload/<date>/<rand>-<name>
  const rand = Math.random().toString(36).slice(2, 10);
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = fileName.replace(/[^\w.\-]/g, '_').slice(0, 80);
  const r2Key = `wa-upload/${dateStr}/${rand}-${safeName}`;
  // Размер из Content-Length для подсчёта (R2 сам возьмёт)
  const body = await request.arrayBuffer();
  await env.FILES.put(r2Key, body, {
    httpMetadata: { contentType },
    customMetadata: { uploadedBy: auth.claims?.email || auth.claims?.sub || 'unknown', originalName: fileName },
  });
  const url = new URL(request.url);
  const publicUrl = `${url.origin}/api/wa/file/${encodeURIComponent(r2Key)}`;
  return json({ ok: true, r2Key, publicUrl, fileName, size: body.byteLength, contentType }, 200, request);
}

async function handleWaFileServe(request, env, r2Key) {
  if (!env.FILES) return new Response('R2 not configured', { status: 500 });
  const obj = await env.FILES.get(r2Key);
  if (!obj) return new Response('not found', { status: 404 });
  const headers = new Headers();
  const ct = obj.httpMetadata?.contentType || 'application/octet-stream';
  headers.set('Content-Type', ct);
  if (obj.size) headers.set('Content-Length', String(obj.size));
  const orig = obj.customMetadata?.originalName || r2Key.split('/').pop();
  const safeName = encodeURIComponent(orig);
  // Inline для media (image/audio/video), attachment для остального — чтобы
  // Green-API мог сам решить как класть в WhatsApp (а превью отображалось).
  const disposition = /^(image|audio|video)\//.test(ct) ? 'inline' : 'attachment';
  headers.set('Content-Disposition', `${disposition}; filename*=UTF-8''${safeName}`);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Access-Control-Allow-Origin', '*');  // публично для Green-API
  return new Response(obj.body, { headers });
}

// ── Per-pipeline custom fields config (hidden + pinned) ──
// kv['org:fieldConfig'] = { [pipelineId]: { hidden: [...], pinned: [...] } }
async function handleFieldConfigGet(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const row = await env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind('org:fieldConfig').first();
  let config = {};
  if (row && row.v) {
    try { config = JSON.parse(row.v) || {}; } catch {}
  }
  return json({ ok: true, config }, 200, request);
}

async function handleFieldConfigPut(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const incoming = body.config;
  if (!incoming || typeof incoming !== 'object') {
    return json({ error: "config object required" }, 400, request);
  }
  // Лёгкая нормализация: для каждой воронки гарантируем массивы hidden/pinned
  for (const [pid, cfg] of Object.entries(incoming)) {
    if (!cfg || typeof cfg !== 'object') { incoming[pid] = { hidden: [], pinned: [] }; continue; }
    if (!Array.isArray(cfg.hidden)) cfg.hidden = [];
    if (!Array.isArray(cfg.pinned)) cfg.pinned = [];
  }
  const v = JSON.stringify(incoming);
  await env.DB.prepare(`
    INSERT INTO kv (k, v) VALUES (?, ?)
    ON CONFLICT(k) DO UPDATE SET v = excluded.v
  `).bind('org:fieldConfig', v).run();
  return json({ ok: true, config: incoming }, 200, request);
}

// ── User channels (SIP endpoint + WhatsApp channel per user) ──
// Phase B: каждому сотруднику можно назначить свой SIP endpoint + WA канал.
// Хранение: kv['user:channels'] = { [uid]: { sipEndpoint, waChannelId } }.
// Глава отдела управляет сотрудниками своего узла и ниже (frontend сам
// фильтрует — worker отдаёт всё; полная защита будет в Phase следующий).
async function handleUserChannelsGet(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const row = await env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind('user:channels').first();
  let map = {};
  if (row?.v) { try { map = JSON.parse(row.v) || {}; } catch {} }
  return json({ ok: true, channels: map }, 200, request);
}

async function handleUserChannelsPut(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const channels = body.channels;
  if (!channels || typeof channels !== 'object') return json({ error: "channels object required" }, 400, request);
  const v = JSON.stringify(channels);
  await env.DB.prepare(`
    INSERT INTO kv (k, v) VALUES (?, ?)
    ON CONFLICT(k) DO UPDATE SET v = excluded.v
  `).bind('user:channels', v).run();
  return json({ ok: true, channels }, 200, request);
}

// Phase C: распределение ответственных по каналу (round-robin).
// Хранение: kv[`wa:distribution:${channelId}`] = { uids: [...], pointer: 0 }
async function getWaDistribution(env, channelId) {
  const k = `wa:distribution:${channelId}`;
  const row = await env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind(k).first();
  if (row?.v) {
    try { return JSON.parse(row.v); } catch {}
  }
  return { uids: [], pointer: 0 };
}

async function setWaDistribution(env, channelId, data) {
  const k = `wa:distribution:${channelId}`;
  await env.DB.prepare(`
    INSERT INTO kv (k, v) VALUES (?, ?)
    ON CONFLICT(k) DO UPDATE SET v = excluded.v
  `).bind(k, JSON.stringify(data)).run();
}

async function handleWaDistributionGet(request, env, channelId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const data = await getWaDistribution(env, channelId);
  return json({ ok: true, channelId, distribution: data }, 200, request);
}

async function handleWaDistributionPut(request, env, channelId) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const uids = Array.isArray(body.uids) ? body.uids.filter(u => typeof u === 'string') : [];
  await setWaDistribution(env, channelId, { uids, pointer: 0 });
  return json({ ok: true, channelId, distribution: { uids, pointer: 0 } }, 200, request);
}

// Round-robin: выбирает следующий uid из пула участников распределения
// канала. Если пула нет — null (используется channel.responsible_uid дефолт).
async function pickNextRoundRobinUid(env, channelId) {
  const data = await getWaDistribution(env, channelId);
  if (!data.uids || data.uids.length === 0) return null;
  const idx = (data.pointer || 0) % data.uids.length;
  const uid = data.uids[idx];
  const newData = { uids: data.uids, pointer: (idx + 1) % data.uids.length };
  await setWaDistribution(env, channelId, newData);
  return uid;
}

// Батч телефонов для канбана. До этого endpoint'а phones подгружались только
// при открытии карточки → кнопки 💬/📞 в канбане были disabled до первого
// захода в детали сделки. Теперь рендер деталки → POST 200 ids → готово.
// Чтобы не валить SQL `IN (?,?,?,…)` тысячами параметров, режем на 200 за раз.
async function handleContactsPhonesBulk(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const url = new URL(request.url);
  const raw = (url.searchParams.get("ids") || "").trim();
  if (!raw) return json({ items: {} }, 200, request);
  const ids = raw.split(",").map(s => s.trim()).filter(Boolean).slice(0, 200);
  if (ids.length === 0) return json({ items: {} }, 200, request);
  const ph = ids.map(() => "?").join(",");
  const { results } = await env.DB.prepare(
    `SELECT id, phones FROM contacts WHERE id IN (${ph})`
  ).bind(...ids).all();
  const items = {};
  for (const r of results) {
    if (!r.phones) continue;
    try {
      const arr = JSON.parse(r.phones);
      if (Array.isArray(arr) && arr.length > 0 && arr[0]?.value) {
        items[r.id] = arr[0].value;
      }
    } catch {}
  }
  return json({ items, total: Object.keys(items).length }, 200, request);
}

// Батч: для каждой сделки вернуть ближайшее активное дело с дедлайном.
// Чтобы на канбане отображать «📋 Дело: DD.MM HH:MM».
// POST /api/tasks/by-deals  { ids: ["deal_X", "deal_Y", ...] }
// Response: { items: { "deal_X": { taskId, title, deadline }, ... } }
//
// Поиск: tasks.crm_links — JSON {"0":"deal_X"}, фильтруем LIKE '%deal_X%'.
// «Активное» = status NOT IN (5=completed, 6=deferred, 7=declined).
// Чанкуем dealIds по 50 в OR-цепочке, иначе SQL слишком длинный.
async function handleTasksByDeals(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const ids = Array.isArray(body.ids) ? body.ids.filter(s => typeof s === 'string').slice(0, 500) : [];
  if (ids.length === 0) return json({ items: {} }, 200, request);

  // Канонизируем формат: ожидаем "deal_X"; если frontend прислал "X" — добавим префикс
  const dealIds = ids.map(s => s.startsWith('deal_') ? s : 'deal_' + s);

  const items = {};
  const chunkSize = 50;
  for (let i = 0; i < dealIds.length; i += chunkSize) {
    const chunk = dealIds.slice(i, i + chunkSize);
    const orClauses = chunk.map(() => "crm_links LIKE ?").join(" OR ");
    const params = chunk.map(d => `%"${d}"%`);
    // Тянем все потенциально-релевантные задачи. JS отфильтрует точно (LIKE даёт
    // ложные срабатывания, например deal_1 матчит deal_10).
    const { results } = await env.DB.prepare(
      `SELECT id, title, deadline, crm_links FROM tasks
       WHERE status NOT IN (5, 6, 7) AND deadline IS NOT NULL
         AND (${orClauses})
       ORDER BY deadline ASC`
    ).bind(...params).all();
    for (const t of results) {
      let links;
      try { links = JSON.parse(t.crm_links || '{}'); } catch { continue; }
      const linkedDealIds = Object.values(links).filter(v => typeof v === 'string' && v.startsWith('deal_'));
      for (const dealId of linkedDealIds) {
        if (!chunk.includes(dealId)) continue;
        // Для этой сделки запоминаем ПЕРВУЮ найденную задачу — она с минимальным
        // deadline т.к. сортировка ORDER BY deadline ASC. Чтобы не перезаписать.
        if (!items[dealId]) {
          items[dealId] = { taskId: t.id, title: t.title, deadline: t.deadline };
        }
      }
    }
  }

  return json({ items, total: Object.keys(items).length }, 200, request);
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

  const me = await resolveCanonicalUser(env, auth.claims);
  return json({
    ok: true,
    firebaseUid: me.firebaseUid,
    canonicalUid: me.canonicalUid,   // используется как responsible_uid в filters
    email: me.email,
    role: me.role,                   // admin | manager | agent
    department: me.department,
    profile: me.userRecord ? {
      uid: me.userRecord.uid,
      email: me.userRecord.email,
      name: me.userRecord.name,
      lastName: me.userRecord.last_name,
      position: me.userRecord.position,
      active: me.userRecord.active,
      photo: me.userRecord.photo,
    } : null,
    isLinked: !!me.userRecord,        // false если email не нашёлся в users
    // Phase 2: effective permissions из org structure для frontend
    orgPerms: me.orgPerms ? {
      isDirector: me.orgPerms.isDirector,
      hasAnyNode: me.orgPerms.hasAnyNode,
      pipelineIds: me.orgPerms.pipelineIds,  // null = все воронки
      dealScope: me.orgPerms.dealScope,      // own | team | all
      teamSize: me.orgPerms.teamUids ? me.orgPerms.teamUids.size : 0,
    } : null,
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

    // /api/contacts/phones?ids=id1,id2,... — батч телефонов для канбана.
    // Чтобы кнопки 💬/📞 в карточках были активны сразу, без открытия деталки.
    if (path === "/api/contacts/phones" && request.method === "GET") {
      return handleContactsPhonesBulk(request, env);
    }

    // /api/tasks/by-deals — батч ближайших активных дел для канбан-плашки «📋 Дело».
    if (path === "/api/tasks/by-deals" && request.method === "POST") {
      return handleTasksByDeals(request, env);
    }

    // /api/files/{id} — отдача мигрированного файла из R2
    const fileMatch = path.match(/^\/api\/files\/([^/]+)$/);
    if (fileMatch && request.method === "GET") {
      return handleFileDownload(request, env, fileMatch[1]);
    }

    // /api/call/event — POST: write call_log row или update существующего
    if (path === "/api/call/event" && request.method === "POST") {
      return handleCallEvent(request, env);
    }
    // /api/call/log — GET: список последних звонков (?contactId, ?dealId, ?limit)
    if (path === "/api/call/log" && request.method === "GET") {
      return handleCallLog(request, env);
    }

    // /api/sip/token — auth-gated выдача SIP-кредов для браузерного SIP.js клиента.
    // Креды живут в Cloudflare Worker secrets (SIP_PASSWORD, etc.), а не в HTML.
    if (path === "/api/sip/token" && request.method === "GET") {
      return handleSipToken(request, env);
    }

    // /api/admin/* — управление ролями (только для admin'а)
    if (path === "/api/admin/users" && request.method === "GET") {
      return handleAdminListUsers(request, env);
    }
    if (path === "/api/admin/users" && request.method === "POST") {
      return handleAdminCreateUser(request, env);
    }
    if (path === "/api/admin/departments" && request.method === "GET") {
      return handleAdminListDepartments(request, env);
    }
    if (path === "/api/admin/audit" && request.method === "GET") {
      return handleAdminAuditLog(request, env);
    }
    const userRoleMatch = path.match(/^\/api\/admin\/user-roles\/([^/]+)$/);
    if (userRoleMatch && request.method === "PATCH") {
      return handleAdminUpdateRole(request, env, userRoleMatch[1]);
    }
    const userActiveMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/active$/);
    if (userActiveMatch && request.method === "PATCH") {
      return handleAdminSetUserActive(request, env, userActiveMatch[1]);
    }

    // /api/deals/{id}/* — карточка сделки (архив, комментарии, лента)
    const dealArchiveMatch = path.match(/^\/api\/deals\/([^/]+)\/archive$/);
    if (dealArchiveMatch && request.method === "POST") {
      return handleDealArchive(request, env, dealArchiveMatch[1]);
    }
    const dealCommentMatch = path.match(/^\/api\/deals\/([^/]+)\/comments$/);
    if (dealCommentMatch && request.method === "POST") {
      return handleDealComment(request, env, dealCommentMatch[1]);
    }
    const dealTimelineMatch = path.match(/^\/api\/deals\/([^/]+)\/timeline$/);
    if (dealTimelineMatch && request.method === "GET") {
      return handleDealTimeline(request, env, dealTimelineMatch[1]);
    }
    // /api/deals/{id}/stage — менять стадию (учитывает зеркала)
    const dealStageMatch = path.match(/^\/api\/deals\/([^/]+)\/stage$/);
    if (dealStageMatch && request.method === "PATCH") {
      return handleDealStageChange(request, env, dealStageMatch[1]);
    }
    // /api/deals/{id}/mirror — добавить зеркало в другую воронку
    const dealMirrorAddMatch = path.match(/^\/api\/deals\/([^/]+)\/mirror$/);
    if (dealMirrorAddMatch && request.method === "POST") {
      return handleDealAddMirror(request, env, dealMirrorAddMatch[1]);
    }
    // /api/deals/{id}/mirror/{pipelineId} — убрать зеркало
    const dealMirrorRemoveMatch = path.match(/^\/api\/deals\/([^/]+)\/mirror\/([^/]+)$/);
    if (dealMirrorRemoveMatch && request.method === "DELETE") {
      return handleDealRemoveMirror(request, env, dealMirrorRemoveMatch[1], dealMirrorRemoveMatch[2]);
    }
    // /api/contacts/{id}/comments|timeline
    const contactCommentMatch = path.match(/^\/api\/contacts\/([^/]+)\/comments$/);
    if (contactCommentMatch && request.method === "POST") {
      return handleContactComment(request, env, contactCommentMatch[1]);
    }
    const contactTimelineMatch = path.match(/^\/api\/contacts\/([^/]+)\/timeline$/);
    if (contactTimelineMatch && request.method === "GET") {
      return handleContactTimeline(request, env, contactTimelineMatch[1]);
    }

    // /api/cf-schema/{entity}[/{fieldName}] — custom fields CRUD
    const cfListMatch = path.match(/^\/api\/cf-schema\/([a-z]+)$/);
    if (cfListMatch && request.method === "GET") {
      return handleCfSchemaList(request, env, cfListMatch[1]);
    }
    if (cfListMatch && request.method === "POST") {
      return handleCfSchemaUpsert(request, env, cfListMatch[1], null);
    }
    const cfItemMatch = path.match(/^\/api\/cf-schema\/([a-z]+)\/([a-zA-Z0-9_]+)$/);
    if (cfItemMatch && request.method === "PATCH") {
      return handleCfSchemaUpsert(request, env, cfItemMatch[1], cfItemMatch[2]);
    }
    if (cfItemMatch && request.method === "DELETE") {
      return handleCfSchemaDelete(request, env, cfItemMatch[1], cfItemMatch[2]);
    }

    // /api/wa/* — WhatsApp Green-API
    if (path === "/api/wa/webhook" && request.method === "POST") {
      return handleWaWebhook(request, env);
    }
    if (path === "/api/wa/send" && request.method === "POST") {
      return handleWaSend(request, env);
    }
    if (path === "/api/wa/chats" && request.method === "GET") {
      return handleWaListChats(request, env);
    }
    if (path === "/api/wa/messages" && request.method === "GET") {
      return handleWaListMessages(request, env);
    }
    if (path === "/api/wa/mark-read" && request.method === "POST") {
      return handleWaMarkRead(request, env);
    }
    if (path === "/api/wa/mark-read-by-deal" && request.method === "POST") {
      return handleWaMarkReadByDeal(request, env);
    }
    if (path === "/api/wa/deals-activity" && request.method === "GET") {
      return handleWaDealsActivity(request, env);
    }
    if (path === "/api/call/missed-by-deal" && request.method === "GET") {
      return handleCallMissedByDeal(request, env);
    }
    if (path === "/api/wa/upload" && request.method === "POST") {
      return handleWaUpload(request, env);
    }
    const waFileMatch = path.match(/^\/api\/wa\/file\/(.+)$/);
    if (waFileMatch && request.method === "GET") {
      return handleWaFileServe(request, env, decodeURIComponent(waFileMatch[1]));
    }
    if (path === "/api/wa/channels/public" && request.method === "GET") {
      return handleWaListChannelsPublic(request, env);
    }
    if (path === "/api/wa/channels" && request.method === "GET") {
      return handleWaListChannels(request, env);
    }
    if (path === "/api/wa/channels" && request.method === "POST") {
      return handleWaCreateChannel(request, env);
    }
    const waChannelMatch = path.match(/^\/api\/wa\/channels\/([^/]+)$/);
    if (waChannelMatch && request.method === "PATCH") {
      return handleWaUpdateChannel(request, env, waChannelMatch[1]);
    }
    const waChannelStateMatch = path.match(/^\/api\/wa\/channels\/([^/]+)\/state$/);
    if (waChannelStateMatch && request.method === "GET") {
      return handleWaChannelState(request, env, waChannelStateMatch[1]);
    }
    const waChannelQrMatch = path.match(/^\/api\/wa\/channels\/([^/]+)\/qr$/);
    if (waChannelQrMatch && request.method === "GET") {
      return handleWaChannelQr(request, env, waChannelQrMatch[1]);
    }
    const waChannelSetupMatch = path.match(/^\/api\/wa\/channels\/([^/]+)\/setup-webhook$/);
    if (waChannelSetupMatch && request.method === "POST") {
      return handleWaChannelSetupWebhook(request, env, waChannelSetupMatch[1]);
    }

    // ── /api/org/structure — иерархия компании ────────────────────────
    if (path === "/api/org/structure" && request.method === "GET") {
      return handleOrgStructureGet(request, env);
    }
    if (path === "/api/org/structure" && request.method === "PUT") {
      return handleOrgStructurePut(request, env);
    }
    // ── /api/admin/permissions — виды прав (роли) ─────────────────────
    if (path === "/api/admin/permissions" && request.method === "GET") {
      return handlePermissionsGet(request, env);
    }
    if (path === "/api/admin/permissions" && request.method === "PUT") {
      return handlePermissionsPut(request, env);
    }
    if (path === "/api/admin/field-config" && request.method === "GET") {
      return handleFieldConfigGet(request, env);
    }
    if (path === "/api/admin/field-config" && request.method === "PUT") {
      return handleFieldConfigPut(request, env);
    }
    if (path === "/api/admin/user-channels" && request.method === "GET") {
      return handleUserChannelsGet(request, env);
    }
    if (path === "/api/admin/user-channels" && request.method === "PUT") {
      return handleUserChannelsPut(request, env);
    }
    const waDistMatch = path.match(/^\/api\/wa\/channels\/([^/]+)\/distribution$/);
    if (waDistMatch && request.method === "GET") {
      return handleWaDistributionGet(request, env, waDistMatch[1]);
    }
    if (waDistMatch && request.method === "PUT") {
      return handleWaDistributionPut(request, env, waDistMatch[1]);
    }

    return json({ ok: false, error: "not found", path }, 404, request);
  },
};
