// ── ELC CRM Worker ───────────────────────────────────────
// Phase 0: CORS + Firebase Auth verification + /health + /api/me
// Phase 2.1: RTDB-proxy endpoint /api/rtdb/{path}.json (read + PATCH)

import { jwtVerify, createRemoteJWKSet } from "jose";
import { ChannelRoom, UserNotifyRoom, handleChatRequest, handleChatWebSocket, broadcastToUser, downloadFile as downloadChatFile, setWaNotifier } from "./chat-module.js";
import { sendWebPush, VAPID_PUBLIC_KEY } from "./webpush.js";
import { imapList, imapFetchMessage, imapFetchAttachment, smtpSend, mailTestConnection, imapFolders, imapUnreadCount } from "./mail.js";

// ctx последнего fetch/scheduled — чтобы фоновую рассылку пушей (несколько
// сетевых запросов к FCM/Mozilla/Apple) повесить на ctx.waitUntil и не держать
// HTTP-ответ. Воркер живёт в одном изоляте, переустанавливается на каждый вход.
let CURRENT_CTX = null;

// Ре-экспорт DO классов — wrangler.toml ссылается на них по имени класса.
// Должны быть top-level export'ы скрипта main.
export { ChannelRoom, UserNotifyRoom };

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
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-File-Name",
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

async function verifyPllatoAppToken(token, env) {
  const appBackend = env.PLLATO_COMM || { fetch };
  const response = await appBackend.fetch("https://pllato-comm.uurraa.workers.dev/api/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`App session rejected (${response.status})`);
  const payload = await response.json();
  const user = payload?.user;
  const canUseCrm = Boolean(user?.isAdmin || user?.isSuperAdmin || user?.apps?.pllato_sales_crm);
  if (!user?.id || !user?.email || !canUseCrm) throw new Error("CRM access is not granted");
  return {
    sub: String(user.id),
    user_id: String(user.id),
    email: String(user.email),
    name: String(user.name || user.email),
    app_session: true,
    crm_access: user.crmAccess || { pipelines: ["start", "production"], dealScope: "own" },
    app_is_admin: Boolean(user.isAdmin || user.isSuperAdmin),
  };
}

async function verifySupportedToken(token, env) {
  try {
    return await verifyFirebaseIdToken(token, env.FIREBASE_PROJECT_ID);
  } catch (firebaseError) {
    try {
      return await verifyPllatoAppToken(token, env);
    } catch (appError) {
      throw new Error(`${firebaseError.message}; ${appError.message}`);
    }
  }
}

async function requireAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { error: "missing Bearer token", status: 401 };
  try {
    const claims = await verifySupportedToken(token, env);
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
  const fbUid = claims.user_id || claims.sub || null;

  if (!email) {
    // Нет email в токене — матчим в org-структуре по firebase uid.
    const matchUids = new Set();
    if (fbUid) matchUids.add(fbUid);
    const orgPerms = await resolveOrgPermissions(env, fbUid, matchUids);
    let role = orgPerms.isDirector ? 'admin' : 'agent';
    return { firebaseUid: fbUid, email: '', canonicalUid: fbUid, role, department: null, userRecord: null, orgPerms, matchUids: [...matchUids] };
  }

  // Все записи users с этим email (обычно одна; >1 = дубли после миграции
  // Bitrix/Firebase→D1). Первую берём канонической, ОСТАЛЬНЫЕ uid'ы сохраняем
  // как алиасы — под любым из них юзер мог попасть в org-структуру.
  const { results: userRows } = await env.DB.prepare(
    "SELECT uid, email, name, last_name, position, photo, active, phone, phones FROM users WHERE LOWER(email) = ?"
  ).bind(email).all();
  const userRow = (userRows && userRows[0]) ? userRows[0] : null;

  const canonicalUid = userRow?.uid || fbUid;

  // Найти роль (default agent если нет записи)
  const roleRow = await env.DB.prepare(
    "SELECT role, department FROM user_roles WHERE uid = ?"
  ).bind(canonicalUid).first();

  // Hardcoded admin для Платона (защита если запись в user_roles потеряется)
  const isPlatonByEmail = email === "uurraa@gmail.com";
  let role = roleRow?.role || (isPlatonByEmail ? "admin" : "agent");

  // matchUids — ВСЕ идентификаторы, под которыми юзер мог быть добавлен в
  // org-структуру: канонический D1 uid + uid'ы всех дублей с тем же email +
  // firebase uid из токена. Когда идентификатор один — поведение не меняется.
  const matchUids = new Set();
  if (canonicalUid) matchUids.add(canonicalUid);
  for (const r of (userRows || [])) if (r.uid) matchUids.add(r.uid);
  if (fbUid) matchUids.add(fbUid);

  // Phase 2: ORG-структура определяет права. Director = super-admin.
  // Computed permissions: {pipelineIds (null=all), dealScope (own|team|all), teamUids}
  let orgPerms = await resolveOrgPermissions(env, canonicalUid, matchUids);
  if (claims.app_session) {
    const access = claims.crm_access || {};
    const requested = Array.isArray(access.pipelines) ? access.pipelines : ["start", "production"];
    const pipelineNames = [];
    if (requested.includes("start")) pipelineNames.push("Pllato Старт");
    if (requested.includes("production")) pipelineNames.push("Pllato Производство");
    let pipelineIds = [];
    if (pipelineNames.length) {
      const placeholders = pipelineNames.map(() => "?").join(",");
      const { results } = await env.DB.prepare(
        `SELECT id FROM pipelines WHERE name IN (${placeholders})`
      ).bind(...pipelineNames).all();
      pipelineIds = (results || []).map((row) => row.id).filter(Boolean);
    }
    orgPerms = {
      isDirector: false,
      pipelineIds,
      dealScope: access.dealScope === "all" ? "all" : "own",
      teamUids: new Set(),
      hasAnyNode: true,
    };
    role = claims.app_is_admin ? "admin" : "agent";
  }
  // Если user является Директором (top of org), эскалируем до admin
  if (orgPerms.isDirector) role = 'admin';

  return {
    firebaseUid: fbUid,
    email,
    canonicalUid,
    role,
    department: roleRow?.department || null,
    userRecord: userRow || null,
    orgPerms,
    matchUids: [...matchUids],
  };
}

// Phase 2: вычисляет права юзера через дерево org:structure.
// Юзер может быть в нескольких узлах (member/head). Эффективные права —
// UNION прав всех узлов где он состоит + всех их потомков (inheritance).
// Возвращает {isDirector, pipelineIds (null=все), dealScope, teamUids (Set)}.
async function resolveOrgPermissions(env, uid, matchUids) {
  const defaults = { isDirector: false, pipelineIds: null, dealScope: 'own', teamUids: new Set(), hasAnyNode: false };
  // ids — множество идентификаторов юзера (canonical + алиасы-дубли + firebase uid).
  // Если не передали — матчим только по uid (старое поведение).
  const ids = (matchUids && matchUids.size) ? matchUids : new Set([uid].filter(Boolean));
  if (ids.size === 0) return defaults;
  let structure = null;
  try {
    const row = await env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind('org:structure').first();
    if (row?.v) structure = JSON.parse(row.v);
  } catch (e) { console.warn('[orgPerms] parse failed:', e); return defaults; }
  if (!structure) return defaults;

  // Director?
  if (structure.director?.uid && ids.has(structure.director.uid)) {
    return { isDirector: true, pipelineIds: null, dealScope: 'all', teamUids: new Set(), hasAnyNode: true };
  }

  // Обход дерева — собираем узлы где user в memberUids/headUid + их descendants
  const userNodes = [];  // ноды куда явно входит юзер
  const allNodes = [];   // плоский список всех узлов с reference на родителя для inheritance
  function walk(node, parents) {
    allNodes.push({ node, parents });
    const isUserHere = (node.headUid && ids.has(node.headUid)) || (node.memberUids || []).some(u => ids.has(u));
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

// Может ли me УПРАВЛЯТЬ задачей (сменить ответственного / удалить)?
// Строже чем canEditRecord: только admin, постановщик (created_by_uid) или
// текущий ответственный (responsible_uid). Соисполнители/наблюдатели —
// НЕ могут (они правят только описание/состав через canEditRecord).
// Матчим по всем идентификаторам юзера (canonical + дубли по email + firebase uid).
async function canManageTask(env, me, taskId) {
  if (me?.role === 'admin') return true;
  const ids = new Set([me?.canonicalUid, me?.firebaseUid, ...(me?.matchUids || [])].filter(Boolean));
  if (ids.size === 0) return false;
  const row = await env.DB.prepare(
    "SELECT responsible_uid, created_by_uid FROM tasks WHERE id = ? LIMIT 1"
  ).bind(taskId).first();
  if (!row) return false;
  return (row.responsible_uid && ids.has(row.responsible_uid)) ||
         (row.created_by_uid && ids.has(row.created_by_uid));
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
    const claims = await verifySupportedToken(token, env);
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
  // JSON-колонки почти всегда хранят объект/массив ({...}/[...]) — отдаём verbatim
  // дёшево, без парсинга (горячий путь для contacts/tasks/deals).
  const c0 = v.charCodeAt(0);
  if (c0 === 123 /* { */ || c0 === 91 /* [ */) return v;
  // Иначе колонка хранит СЫРОЙ скаляр-текст (напр. users.department="Отделение 6"
  // или "6 Отделение") — это НЕ валидный JSON и ломает ВЕСЬ ответ коллекции
  // (users.json → .json() падает → пустые воронки/сотрудники у ВСЕХ). Валидируем
  // и при провале эмитим как корректную JSON-строку.
  try { JSON.parse(v); return v; } catch { return JSON.stringify(v); }
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
      const me = await resolveCanonicalUser(env, auth.claims);
      return await handleRtdbGet(env, request, parts, opts, me);
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

async function handleRtdbGet(env, request, parts, opts, me) {
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
        ? respondDealsForUser(env, request, opts, me)
        : respondDealForUser(env, request, rest[0], me);

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

function dealAccessSql(me) {
  if (me?.role === "admin") return { where: "", params: [] };
  const permissions = me?.orgPerms || {};
  const clauses = [];
  const params = [];
  if (Array.isArray(permissions.pipelineIds)) {
    if (!permissions.pipelineIds.length) clauses.push("1 = 0");
    else {
      clauses.push(`pipeline_id IN (${permissions.pipelineIds.map(() => "?").join(",")})`);
      params.push(...permissions.pipelineIds);
    }
  }
  if (permissions.dealScope !== "all") {
    const uid = String(me?.canonicalUid || "");
    if (!uid) clauses.push("1 = 0");
    else {
      clauses.push("(responsible_uid = ? OR created_by_uid = ? OR modify_by_uid = ?)");
      params.push(uid, uid, uid);
    }
  }
  return { where: clauses.length ? ` AND ${clauses.join(" AND ")}` : "", params };
}

async function* streamDealsForUser(env, me, chunkSize = 2000) {
  yield "{";
  let lastKey = "";
  let first = true;
  const access = dealAccessSql(me);
  while (true) {
    const { results } = await env.DB.prepare(
      `SELECT * FROM deals WHERE id > ?${access.where} ORDER BY id LIMIT ?`
    ).bind(lastKey, ...access.params, chunkSize).all();
    if (!results?.length) break;
    let buffer = "";
    for (const row of results) {
      buffer += (first ? "" : ",") + JSON.stringify(row.id) + ":" + serializeRowFast(row, "deals");
      first = false;
    }
    yield buffer;
    if (results.length < chunkSize) break;
    lastKey = results[results.length - 1].id;
  }
  yield "}";
}

async function respondDealsForUser(env, request, opts, me) {
  const access = dealAccessSql(me);
  if (opts.shallow) {
    const { results } = await env.DB.prepare(
      `SELECT id FROM deals WHERE 1 = 1${access.where}`
    ).bind(...access.params).all();
    return json(Object.fromEntries((results || []).map((row) => [row.id, true])), 200, request);
  }
  return streamingJsonResponse(request, () => streamDealsForUser(env, me));
}

async function respondDealForUser(env, request, id, me) {
  const access = dealAccessSql(me);
  const { results } = await env.DB.prepare(
    `SELECT * FROM deals WHERE id = ?${access.where} LIMIT 1`
  ).bind(id, ...access.params).all();
  if (!results?.length) return json(null, 200, request);
  return json(rowToCamel(results[0], "deals"), 200, request);
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

  // Permissions: pipelines удаляет только admin; задачи — только постановщик/
  // ответственный/admin (строже canEditRecord, соисполнитель НЕ удаляет);
  // остальные — по canEditRecord.
  if (tableName === "pipelines") {
    if (me?.role !== "admin") {
      return json({ error: "only admin can delete pipelines" }, 403, request);
    }
  } else if (tableName === "tasks") {
    const allowed = await canManageTask(env, me, id);
    if (!allowed) {
      return json({
        error: "only the task creator, assignee, or admin can delete this task",
        role: me?.role,
      }, 403, request);
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

// ── /api/import/bulk — массовый upsert через D1 batch транзакцию ──
// Body: { entity: "contacts"|"deals"|"users"|"pipelines", items: [{...}, ...] }
// Возвращает: { ok, entity, inserted, errors? }
//
// Преимущества над PUT /api/rtdb/{...}.json по одной:
//   • 1 worker-request вместо N (важно при ~100k записей за импорт)
//   • 1 D1 транзакция вместо N (атомарность + скорость)
//   • INSERT OR REPLACE — idempotent upsert по PK
//
// Limits: max 1000 items per batch (соответствует D1 batch limit).
// Auth: только admin. Audit log — суммарный, не по каждой записи.
async function handleBulkImport(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const canonical = await resolveCanonicalUser(env, auth.claims);
  const me = {
    uid: canonical.canonicalUid || auth.uid,
    email: auth.email,
    role: canonical.role,
    canonicalUid: canonical.canonicalUid,
  };
  if (me.role !== "admin") {
    return json({ error: "bulk import is admin-only" }, 403, request);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "invalid json body" }, 400, request); }

  const allowedEntities = { contacts: "id", deals: "id", users: "uid", pipelines: "id" };
  const requiredFields = {
    contacts: ["name", "last_name"],
    deals: ["title", "pipeline_id", "stage_id"],
    users: ["uid"],
    pipelines: ["name"],
  };
  const { entity, items } = body || {};
  if (!entity || !allowedEntities[entity]) {
    return json({ error: "entity must be one of: " + Object.keys(allowedEntities).join(", ") }, 400, request);
  }
  if (!Array.isArray(items) || items.length === 0) {
    return json({ error: "items must be a non-empty array" }, 400, request);
  }
  if (items.length > 1000) {
    return json({ error: "max 1000 items per batch (got " + items.length + ")" }, 400, request);
  }

  const keyCol = allowedEntities[entity];
  const jsonCols = JSON_COLS[entity] || new Set();
  const required = requiredFields[entity] || [];

  // 1. Соберём union всех колонок из всех items (camelCase → snake_case).
  //    items могут быть sparse — у одних есть фразы emails, у других нет.
  //    Для INSERT OR REPLACE все строки идут через одинаковый набор колонок;
  //    отсутствующие в item значения подставим как NULL.
  const allColsSet = new Set();
  for (const it of items) {
    if (!it || typeof it !== "object") {
      return json({ error: "each item must be an object" }, 400, request);
    }
    for (const k of Object.keys(it)) allColsSet.add(toSnake(k));
  }
  if (!allColsSet.has(keyCol)) allColsSet.add(keyCol);
  // Гарантируем что NOT NULL колонки в наборе, иначе ERROR раньше будет понятнее
  for (const f of required) {
    if (!allColsSet.has(f)) allColsSet.add(f);
  }

  const allCols = [...allColsSet];
  const placeholders = allCols.map(() => "?").join(", ");
  const sql = `INSERT OR REPLACE INTO ${entity} (${allCols.join(", ")}) VALUES (${placeholders})`;

  // 2. Готовим bind values для каждого item.
  //    Валидация: все required-поля должны быть заполнены непустыми значениями.
  const stmt = env.DB.prepare(sql);
  const batch = [];
  const validationErrors = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    // Required check (NOT NULL columns в D1 схеме упадут на batch иначе)
    for (const f of required) {
      const camel = toCamel(f);
      const val = it[camel] !== undefined ? it[camel] : it[f];
      if (val === undefined || val === null || val === "") {
        validationErrors.push({ index: i, missing: f, id: it[keyCol] || it[toCamel(keyCol)] || null });
        break;
      }
    }
    if (validationErrors.length >= 10) break;  // не больше 10 ошибок в ответе

    const vals = [];
    for (const col of allCols) {
      const camel = toCamel(col);
      let v = it[camel] !== undefined ? it[camel] : it[col];
      if (v === undefined) v = null;
      if (jsonCols.has(col) && v !== null && typeof v !== "string") {
        v = JSON.stringify(v);
      }
      vals.push(v);
    }
    batch.push(stmt.bind(...vals));
  }

  if (validationErrors.length) {
    return json({
      error: "validation failed for some items (NOT NULL required)",
      first_errors: validationErrors,
    }, 400, request);
  }

  // 3. Один D1 batch — атомарная транзакция. Если упадёт — откатывается всё.
  try {
    await env.DB.batch(batch);
  } catch (e) {
    return json({
      error: "D1 batch failed",
      message: String(e?.message || e).slice(0, 800),
      entity,
      items_count: items.length,
    }, 500, request);
  }

  // 4. Один audit log на весь batch (вместо N записей).
  try {
    await auditLog(env, me, "bulk_import", entity, null, {
      count: items.length,
      cols_count: allCols.length,
    });
  } catch { /* audit не должен ломать импорт */ }

  return json({ ok: true, entity, inserted: items.length }, 200, request);
}

// ── /api/admin/deals/archive-bulk — массовая архивация сделок ──
// Принимает фильтры (pipelineId, stages, olderThanDays) и:
//   - dryRun=true → возвращает только COUNT того что попадёт под фильтр
//   - dryRun=false → выполняет UPDATE archived=1 (или restore=true → archived=0)
// Один UPDATE = одна D1 операция = один worker request. Admin-only.
async function handleBulkArchiveDeals(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const canonical = await resolveCanonicalUser(env, auth.claims);
  const me = {
    uid: canonical.canonicalUid || auth.uid,
    email: auth.email,
    role: canonical.role,
    canonicalUid: canonical.canonicalUid,
  };
  if (me.role !== "admin") {
    return json({ error: "admin only" }, 403, request);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "invalid json body" }, 400, request); }

  const { pipelineId = null, stages = null, olderThanDays = null, dryRun = true, restore = false } = body || {};

  const whereParts = [];
  const binds = [];
  if (pipelineId) { whereParts.push("pipeline_id = ?"); binds.push(pipelineId); }
  if (Array.isArray(stages) && stages.length) {
    whereParts.push(`stage_id IN (${stages.map(() => "?").join(", ")})`);
    for (const s of stages) binds.push(s);
  }
  if (typeof olderThanDays === "number" && olderThanDays > 0) {
    whereParts.push(`COALESCE(bitrix_date_create, begin_date) < datetime('now', '-${olderThanDays | 0} days')`);
  }
  if (restore) whereParts.push("archived = 1");
  else whereParts.push("(archived IS NULL OR archived = 0)");
  if (whereParts.length <= 1) return json({ error: "at least one filter required" }, 400, request);
  const whereSQL = whereParts.join(" AND ");

  const countRow = await env.DB.prepare(`SELECT COUNT(*) as n FROM deals WHERE ${whereSQL}`).bind(...binds).first();
  const count = countRow?.n || 0;
  if (dryRun) return json({ ok: true, dryRun: true, would_affect: count, restore }, 200, request);

  const nowIso = new Date().toISOString();
  let updateSQL, updateBinds;
  if (restore) {
    updateSQL = `UPDATE deals SET archived = 0, archived_at = NULL, archived_by = NULL, bitrix_date_modify = ? WHERE ${whereSQL}`;
    updateBinds = [nowIso, ...binds];
  } else {
    updateSQL = `UPDATE deals SET archived = 1, archived_at = ?, archived_by = ?, bitrix_date_modify = ? WHERE ${whereSQL}`;
    updateBinds = [nowIso, me.canonicalUid || me.uid, nowIso, ...binds];
  }
  await env.DB.prepare(updateSQL).bind(...updateBinds).run();
  try { await auditLog(env, me, restore ? "bulk_unarchive" : "bulk_archive", "deals", null, { count, pipelineId, stages, olderThanDays }); }
  catch { /* audit не блокирует */ }
  return json({ ok: true, dryRun: false, affected: count, restore }, 200, request);
}

// ── /api/admin/deals/migrate-rejects ──
// Один раз: добавляет колонку deals.reject_reason, объединяет 5 REJECT_* стадий
// в одну REJECT (подпричина уходит в reject_reason), обновляет JSON воронки.
// Идемпотентно: повторный вызов не сломает ничего (ALTER через try/catch,
// UPDATE мимо уже мигрированных).
//
// Body: { pipelineId, dryRun? } — обязателен pipelineId чтобы не зацепить
// чужие воронки (Pllato Старт и др.). Admin-only.
//
// После миграции worker возвращает поле reject_reason в обычной сериализации
// (SELECT *), фронт может читать его как deal.rejectReason (через toCamel).
async function handleMigrateRejectReasons(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const canonical = await resolveCanonicalUser(env, auth.claims);
  const me = {
    uid: canonical.canonicalUid || auth.uid, email: auth.email,
    role: canonical.role, canonicalUid: canonical.canonicalUid,
  };
  if (me.role !== "admin") return json({ error: "admin only" }, 403, request);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "invalid json body" }, 400, request); }
  const { pipelineId, dryRun = true } = body || {};
  if (!pipelineId) return json({ error: "pipelineId required" }, 400, request);

  // 1. ALTER TABLE — добавить колонку (idempotent через try/catch)
  let alterApplied = false;
  if (!dryRun) {
    try {
      await env.DB.prepare("ALTER TABLE deals ADD COLUMN reject_reason TEXT").run();
      alterApplied = true;
    } catch (e) {
      // SQLite кидает "duplicate column name" если колонка уже есть — это ок
      if (!/duplicate column|already exists/i.test(String(e?.message || e))) {
        return json({ error: "ALTER TABLE failed", message: String(e?.message || e) }, 500, request);
      }
    }
  }

  // 2. Подсчитать сколько deals под миграцию
  const rejectStages = ["REJECT_NOT_INTERESTED", "REJECT_WRONG_CITY", "REJECT_DISCONNECTED", "REJECT_WANTED_ONLINE", "REJECT_INVALID_NUMBER"];
  const placeholders = rejectStages.map(() => "?").join(", ");
  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) as n FROM deals WHERE pipeline_id = ? AND stage_id IN (${placeholders})`
  ).bind(pipelineId, ...rejectStages).first();
  const wouldUpdate = countRow?.n || 0;

  if (dryRun) {
    // Также покажем preview pipeline stages — что станет
    const pipeRow = await env.DB.prepare("SELECT stages FROM pipelines WHERE id = ?").bind(pipelineId).first();
    let stages = null;
    try { stages = pipeRow?.stages ? JSON.parse(pipeRow.stages) : null; } catch {}
    return json({
      ok: true, dryRun: true, would_update_deals: wouldUpdate,
      pipelineId, current_reject_stages_in_pipeline: stages ? Object.keys(stages).filter(k => k.startsWith("REJECT_")) : [],
    }, 200, request);
  }

  // 3. Миграция данных: stage_id → reject_reason (отрезаем префикс "REJECT_"),
  //    после чего stage_id = 'REJECT'.
  // Можно одним UPDATE через CASE, но проще двумя:
  await env.DB.prepare(
    `UPDATE deals SET reject_reason = SUBSTR(stage_id, 8) WHERE pipeline_id = ? AND stage_id IN (${placeholders})`
  ).bind(pipelineId, ...rejectStages).run();
  await env.DB.prepare(
    `UPDATE deals SET stage_id = 'REJECT' WHERE pipeline_id = ? AND stage_id IN (${placeholders})`
  ).bind(pipelineId, ...rejectStages).run();

  // 4. Обновляем pipeline.stages: удаляем 5 REJECT_*, добавляем одну REJECT.
  //    Сохраняем sort=40 (на месте бывшего REJECT_NOT_INTERESTED).
  const pipeRow = await env.DB.prepare("SELECT stages FROM pipelines WHERE id = ?").bind(pipelineId).first();
  if (pipeRow?.stages) {
    let stages = {};
    try { stages = JSON.parse(pipeRow.stages); } catch {}
    for (const k of rejectStages) delete stages[k];
    stages.REJECT = { name: "Отказ", sort: 40, statusId: "REJECT", semantics: "F", color: null };
    await env.DB.prepare("UPDATE pipelines SET stages = ?, stages_count = ? WHERE id = ?")
      .bind(JSON.stringify(stages), Object.keys(stages).length, pipelineId).run();
  }

  try { await auditLog(env, me, "migrate_reject_reasons", "deals", null, { pipelineId, updated: wouldUpdate, alterApplied }); }
  catch { /* */ }
  return json({ ok: true, dryRun: false, updated_deals: wouldUpdate, alter_applied: alterApplied, pipelineId }, 200, request);
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
    // event_public — ленивая колонка (общий календарь); гарантируем перед записью.
    if (tableName === "tasks") await ensureEventPublicColumn(env);

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
        // Смена ответственного по задаче — только постановщик/ответственный/admin.
        // Соисполнитель может править описание/состав, но не «передать» задачу.
        // Если поля нет права менять — молча убираем его из body (остальные
        // правки применяются), чтобы не ломать совмещённый PATCH.
        if (tableName === "tasks" && ("responsibleUid" in body || "responsible_uid" in body)) {
          const canMng = await canManageTask(env, me, id);
          if (!canMng) {
            delete body.responsibleUid;
            delete body.responsible_uid;
          }
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

  // ──── ORG-структура — источник истины для видимости deals/tasks/contacts ────
  // Если юзер состоит в оргструктуре (hasAnyNode), реальные границы видимости
  // задаёт блок orgPerms ниже (dealScope own|team|all + whitelist pipelineIds).
  // Legacy scope='mine'/'team' тогда НЕ применяем — иначе dealScope='all'/'team'
  // из структуры перетирался бы жёстким responsible=me, и сотрудник с правом
  // «Все сделки» видел бы только свои (а при отсутствии своих — пустую воронку).
  // Касается только deals/tasks/contacts (их покрывает orgPerms-блок); для
  // прочих сущностей legacy scope остаётся как есть.
  if (me.role !== 'admin' && me.orgPerms && me.orgPerms.hasAnyNode &&
      (entity === 'deals' || entity === 'tasks' || entity === 'contacts')) {
    scope = 'all';
  }

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
    // Поиск по СЛОВАМ: запрос бьём на токены (по пробелам) и каждое слово ищем
    // по всем полям — все слова должны совпасть (AND между словами, OR внутри
    // слова по полям). Так «Иван Петров» найдёт контакт с name=Иван,
    // last_name=Петров (раньше искалось одним куском и не находилось), а
    // «Петров 705» — фамилия + фрагмент телефона.
    //
    // SQLite LOWER() работает только с ASCII — для кириллицы не меняет регистр.
    // Поэтому case-insensitive делаем вручную: 3 варианта каждого слова —
    // как ввёл + всё малыми + Capitalize первой буквы.
    const tokens = q.trim().split(/\s+/).filter(Boolean);
    for (const tok of tokens) {
      const variants = new Set();
      variants.add("%" + tok + "%");
      variants.add("%" + tok.toLowerCase() + "%");
      variants.add("%" + (tok[0].toUpperCase() + tok.slice(1).toLowerCase()) + "%");
      const orClauses = [];
      for (const f of cfg.searchFields) {
        for (const v of variants) { orClauses.push(`${f} LIKE ?`); whereParams.push(v); }
      }
      // Телефон: если в слове есть цифры — нормализуем и матчим по «хвосту»
      // (до 10 цифр). Телефоны хранятся сплошными цифрами в каноне "+7XXXXXXXXXX",
      // а пользователь вводит в любом виде ("+7 705 123-45-67", "8(705)…", "705…").
      const digits = tok.replace(/\D/g, '');
      if (digits.length >= 4) {
        const tail = digits.slice(-10);
        if (entity === 'deals') {
          orClauses.push(`contact_id IN (SELECT id FROM contacts WHERE phones LIKE ?)`);
          whereParams.push('%' + tail + '%');
        } else if (cfg.searchFields.includes('phones')) {
          orClauses.push(`phones LIKE ?`);
          whereParams.push('%' + tail + '%');
        }
      }
      // Каждое слово — отдельное условие (whereParts соединяются через AND).
      if (orClauses.length) whereParts.push("(" + orClauses.join(" OR ") + ")");
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

  // tasks: archived_at — общая архивация. По умолчанию IS NULL.
  // ?archived=1 — только архив, ?archived=all — все.
  // dealLinked — разделение Задачи vs Дела:
  //   ?dealLinked=1 — только с привязкой к сделке (Дела вкладка)
  //   ?dealLinked=0 — только без привязки (Задачи вкладка)
  //   не указан — оба варианта (для backward-compat и универсальных endpoint'ов)
  if (entity === "tasks") {
    const arch = (url.searchParams.get("archived") || "").trim();
    if (arch === "1") whereParts.push("archived_at IS NOT NULL");
    else if (arch !== "all") whereParts.push("archived_at IS NULL");
    const dealLinked = (url.searchParams.get("dealLinked") || "").trim();
    if (dealLinked === "1") whereParts.push("(crm_links LIKE '%deal_%' OR bitrix_crm_links LIKE '%D_%')");
    else if (dealLinked === "0") whereParts.push("(crm_links IS NULL OR crm_links NOT LIKE '%deal_%') AND (bitrix_crm_links IS NULL OR bitrix_crm_links NOT LIKE '%D_%')");
    // Разделение «текущие» (созданные в портале, bitrix_id пуст) vs «Битрикс Архив»
    // (импортированные из Битрикса, bitrix_id заполнен).
    const src = (url.searchParams.get("source") || "").trim();
    if (src === "new") whereParts.push("(bitrix_id IS NULL OR bitrix_id = '')");
    else if (src === "bitrix") whereParts.push("(bitrix_id IS NOT NULL AND bitrix_id != '')");
    // Видимость задач: ТОЛЬКО свои — постановщик / ответственный / изменивший /
    // соисполнитель / наблюдатель. Без исключений (даже для админов/директоров).
    // Исключение: события общего календаря (event_public=1) видны всем — но
    // только когда явно запрошены (?includePublic=1), чтобы не засорять доски задач.
    await ensureEventPublicColumn(env);
    const includePublic = url.searchParams.get("includePublic") === "1";
    // allEvents=1 — обзор ВСЕХ встреч/событий (для календаря). Разрешено только
    // админам/директорам: они видят все задачи-события без ограничения «только свои».
    const allEvents = url.searchParams.get("allEvents") === "1";
    const isPrivileged = me.role === 'admin' || (me.orgPerms && me.orgPerms.isDirector);
    if (allEvents && isPrivileged) {
      // без фильтра видимости — показываем все задачи набора
    } else {
      const vuid = me.canonicalUid || '';
      const orC = [];
      if (vuid) {
        for (const f of (cfg.mineFields || [])) { orC.push(`${f} = ?`); whereParams.push(vuid); }
        for (const f of (cfg.mineJsonFields || [])) { orC.push(`${f} LIKE ?`); whereParams.push(`%"${vuid}"%`); }
      }
      if (includePublic) orC.push("event_public = 1");
      if (orC.length) whereParts.push("(" + orC.join(" OR ") + ")");
      else whereParts.push("1 = 0");
    }
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
  // Применяется к: deals, contacts. Не применяется к: pipelines, users (мета).
  // tasks — исключены: у задач своя строгая видимость «только свои» (см. блок выше),
  // org-perms не должен ANDить её и терять соисполнителей/наблюдателей.
  if (me.role !== 'admin' && me.orgPerms && (entity === 'deals' || entity === 'contacts')) {
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

  // ──── countsOnly=1 — дешёвые per-stage счётчики для канбана ────
  // Возвращает { counts: {stageId: n}, total } одним GROUP BY-запросом, БЕЗ
  // выборки строк. Нужно для точных бейджей колонок на огромных воронках
  // (ELC ~33k, UniqBook ~22k), где грузить все сделки в канбан нельзя —
  // фронт грузит только N свежих карточек, а истинные итоги колонок берёт здесь.
  // Переиспользует весь whereSQL/whereParams (scope, orgPerms, archived, pipeline).
  // ВАЖНО про зеркала: mirror-сделки группируются по своему ПЕРВИЧНОМУ stage_id,
  // поэтому в чужой воронке могут не попасть ни в одну колонку (их stage там нет).
  // На огромных воронках зеркал практически нет → бейджи точны. total всегда верен.
  if (url.searchParams.get("countsOnly") === "1" && cfg.stageField) {
    const { results: cntRows } = await env.DB.prepare(
      `SELECT ${cfg.stageField} AS k, COUNT(*) AS n FROM ${entity}${whereSQL} GROUP BY ${cfg.stageField}`
    ).bind(...whereParams).all();
    const counts = {};
    let total = 0;
    for (const r of (cntRows || [])) {
      if (r.k != null) counts[r.k] = r.n;
      total += r.n;
    }
    return new Response(JSON.stringify({
      counts,
      total,
      meta: { scope, role: me.role, canonicalUid: me.canonicalUid },
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...corsHeaders(request),
      },
    });
  }

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

// ── /api/contact-card-by-phone — rich контакт-карточка для popup звонка ─
// Возвращает: { contact: {id, fullName, company}, deals: [...], activities: [...] }
// Если контакт не найден — { found:false }.
async function handleContactCardByPhone(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const url = new URL(request.url);
  const phoneRaw = (url.searchParams.get("phone") || "").trim();
  const digits = String(phoneRaw).replace(/\D/g, "");
  if (!digits) return json({ found: false, error: "phone required" }, 200, request);

  // Поиск контакта по нескольким вариантам формата номера в JSON-массиве phones
  const tail10 = digits.slice(-10); // последние 10 цифр без кода страны
  const variants = [
    `%"${digits}"%`,
    `%"+${digits}"%`,
    `%"${tail10}"%`,
    `%${tail10}%`,
  ];
  let contact = null;
  for (const v of variants) {
    contact = await env.DB.prepare(
      "SELECT id, name, last_name, second_name, phones, emails, company_id, position FROM contacts WHERE phones LIKE ? LIMIT 1"
    ).bind(v).first();
    if (contact) break;
  }
  if (!contact) return json({ found: false }, 200, request);

  const fullName = [contact.last_name, contact.name, contact.second_name]
    .filter(s => s && String(s).trim()).join(" ").trim() || "(без имени)";

  // Компания (если есть)
  let companyTitle = "";
  if (contact.company_id) {
    try {
      const comp = await env.DB.prepare(
        "SELECT title FROM companies WHERE id = ? LIMIT 1"
      ).bind(contact.company_id).first();
      if (comp?.title) companyTitle = String(comp.title);
    } catch { /* companies table may not exist; ok */ }
  }

  // Последние 3 сделки контакта (открытые приоритетнее закрытых, потом по дате)
  let deals = [];
  try {
    const dealsRes = await env.DB.prepare(`
      SELECT id, bitrix_id, title, opportunity, currency, stage_id, pipeline_id, closed, bitrix_date_modify
      FROM deals
      WHERE contact_id = ?
      ORDER BY closed ASC, COALESCE(bitrix_date_modify, '') DESC
      LIMIT 3
    `).bind(contact.id).all();
    deals = (dealsRes.results || []).map(d => ({
      id: d.bitrix_id || d.id,
      title: d.title || "(без названия)",
      stageId: d.stage_id,
      pipelineId: d.pipeline_id,
      amount: d.opportunity || null,
      currency: d.currency || "KZT",
      closed: !!d.closed,
    }));
  } catch { /* deals failure ok */ }

  // Последние 3 активности контакта: звонки + WA-сообщения + комментарии в timeline
  let activities = [];
  try {
    // Звонки по контакту
    const callsRes = await env.DB.prepare(`
      SELECT direction, phone, started_at, duration_sec, status
      FROM call_log
      WHERE contact_id = ?
      ORDER BY started_at DESC
      LIMIT 3
    `).bind(contact.id).all();
    for (const c of (callsRes.results || [])) {
      const dur = c.duration_sec > 0 ? `${Math.floor(c.duration_sec/60)}:${String(c.duration_sec%60).padStart(2,'0')}` : "";
      const statusLabel = ({ connected: "разговор", no_answer: "не ответил", missed: "пропущен", failed: "ошибка" })[c.status] || c.status || "";
      activities.push({
        type: "call",
        icon: c.direction === "in" ? "📥" : "📤",
        date: c.started_at,
        description: `${c.direction === "in" ? "Входящий" : "Исходящий"}${dur ? " " + dur : ""}${statusLabel ? " · " + statusLabel : ""}`,
      });
    }
    // WhatsApp — последние сообщения по телефону
    try {
      const waRes = await env.DB.prepare(`
        SELECT m.direction, m.text, m.ts
        FROM wa_messages m
        JOIN wa_chats c ON c.id = m.chat_id
        WHERE c.phone LIKE ?
        ORDER BY m.ts DESC
        LIMIT 3
      `).bind(`%${tail10}%`).all();
      for (const w of (waRes.results || [])) {
        const preview = String(w.text || "").slice(0, 60);
        activities.push({
          type: "wa",
          icon: "💬",
          date: w.ts,
          description: `WA${w.direction === "in" ? " ⬅" : " ➡"}: ${preview || "(без текста)"}`,
        });
      }
    } catch { /* wa tables may not exist */ }
    // Сортировка по дате убывающе, обрезаем до 3
    activities.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    activities = activities.slice(0, 3);
  } catch { /* activities failure ok */ }

  return json({
    found: true,
    contact: {
      id: contact.id,
      fullName,
      company: companyTitle,
      position: contact.position || "",
    },
    deals,
    activities,
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
  // Персональная линия: если сотруднику назначен свой endpoint — отдаём его
  // креды (он регистрируется на наш Asterisk как отдельный пользователь, звонит
  // и принимает через свою линию Бинотел). Иначе — общий endpoint 100 (как было).
  let user = env.SIP_USER || "100";
  let password = env.SIP_PASSWORD;
  try {
    const me = await resolveCanonicalUser(env, auth.claims);
    const creds = await sipAgentCreds(env, me.canonicalUid);
    if (creds) { user = creds.user; password = creds.password; }
  } catch (e) { /* fallback на общий endpoint */ }
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

// Idempotent self-migration: колонка stage_changed_at в deals — отметка времени,
// когда сделка попала на ТЕКУЩУЮ (основную) стадию. Нужна для «N дней на этапе»
// и подсветки залежавшихся сделок в канбане. Мемоизируем на изолят, чтобы не
// дёргать ALTER на каждый запрос. "duplicate column" — норма (колонка уже есть).
let _stageChangedAtEnsured = false;
async function ensureStageChangedAtColumn(env) {
  if (_stageChangedAtEnsured) return;
  try {
    await env.DB.prepare("ALTER TABLE deals ADD COLUMN stage_changed_at TEXT").run();
  } catch (e) {
    if (!/duplicate column|already exists/i.test(String(e?.message || e))) {
      console.warn('[migrate] stage_changed_at ALTER failed:', e?.message || e);
    }
  }
  _stageChangedAtEnsured = true;
}

// ── Журнал входов сделок в стадии (для графиков «количество обращений/стартов») ─
// Каждый раз, когда сделка ВХОДИТ в стадию (создание или переход) — пишем строку.
// Так можно считать «сколько сделок попало на стадию X за период», даже если
// сделка потом ушла дальше. Историю до запуска бэкфиллим текущими занятыми.
let _stageEventsEnsured = false;
async function ensureStageEventsTable(env) {
  if (_stageEventsEnsured) return;
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS deal_stage_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, deal_id TEXT, pipeline_id TEXT, stage_id TEXT, entered_at TEXT
    )`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_dse_pipe_stage_time ON deal_stage_events(pipeline_id, stage_id, entered_at)`).run();
  } catch (e) {}
  _stageEventsEnsured = true;
}
async function logStageEvent(env, dealId, pipelineId, stageId, iso) {
  if (!dealId || !pipelineId || !stageId) return;
  try {
    await ensureStageEventsTable(env);
    await env.DB.prepare("INSERT INTO deal_stage_events (deal_id, pipeline_id, stage_id, entered_at) VALUES (?, ?, ?, ?)")
      .bind(String(dealId), String(pipelineId), String(stageId), iso || new Date().toISOString()).run();
  } catch (e) {}
}
// Разовый бэкфилл: по текущему состоянию сделок создаём по событию «вход в текущую
// стадию» (stage_changed_at или дата создания). Флаг в kv, чтобы не повторять.
async function ensureStageEventsBackfill(env) {
  try {
    await ensureStageEventsTable(env);
    const flag = await env.DB.prepare("SELECT v FROM kv WHERE k = 'deal_stage_events:backfilled'").first();
    if (flag && flag.v) return;
    await env.DB.prepare(`
      INSERT INTO deal_stage_events (deal_id, pipeline_id, stage_id, entered_at)
      SELECT id, pipeline_id, stage_id, COALESCE(stage_changed_at, bitrix_date_create)
        FROM deals WHERE pipeline_id IS NOT NULL AND stage_id IS NOT NULL
          AND COALESCE(stage_changed_at, bitrix_date_create) IS NOT NULL
    `).run();
    await env.DB.prepare("INSERT INTO kv (k, v) VALUES ('deal_stage_events:backfilled', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v")
      .bind(new Date().toISOString()).run();
  } catch (e) { console.warn('[stage-events backfill]', e?.message || e); }
}

// ── Форма квалификации сделки (бриф первого звонка) ─────────────────────────
// Хранение — одной JSON-строкой в deal_qualification.data; плюс отдельные
// колонки meta (кто/когда квалифицировал) для аудита.
let _qualTableEnsured = false;
async function ensureQualificationTable(env) {
  if (_qualTableEnsured) return;
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS deal_qualification (
      deal_id TEXT PRIMARY KEY, data TEXT, qual_by TEXT, qual_at TEXT, updated_at TEXT
    )`).run();
  } catch (e) {}
  _qualTableEnsured = true;
}
async function handleDealQualificationGet(request, env, dealId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureQualificationTable(env);
  const row = await env.DB.prepare("SELECT data, qual_by, qual_at, updated_at FROM deal_qualification WHERE deal_id = ?").bind(dealId).first();
  let data = {}; try { data = row && row.data ? JSON.parse(row.data) : {}; } catch { data = {}; }
  const recordings = await qualRecordingsFor(env, dealId);
  return json({ ok: true, qualification: data, qualBy: row ? row.qual_by : null, qualAt: row ? row.qual_at : null, recordings }, 200, request);
}
async function handleDealQualificationPut(request, env, dealId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  await ensureQualificationTable(env);
  let body; try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const data = (body && typeof body.qualification === 'object' && body.qualification) ? body.qualification : {};
  const dataStr = JSON.stringify(data).slice(0, 60000);
  const nowIso = new Date().toISOString();
  const existing = await env.DB.prepare("SELECT qual_by, qual_at FROM deal_qualification WHERE deal_id = ?").bind(dealId).first();
  // qual_by/qual_at фиксируются при ПЕРВОМ сохранении.
  const qualBy = existing && existing.qual_by ? existing.qual_by : (me.canonicalUid || me.uid || '');
  const qualAt = existing && existing.qual_at ? existing.qual_at : nowIso;
  await env.DB.prepare(`
    INSERT INTO deal_qualification (deal_id, data, qual_by, qual_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(deal_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).bind(dealId, dataStr, qualBy, qualAt, nowIso).run();
  return json({ ok: true, qualBy, qualAt }, 200, request);
}

// ── Записи звонков к брифу квалификации ───────────────────────────────────
// Загрузка файла (запись звонка) с компьютера в сделку. Файл → R2, метаданные
// → таблица deal_qual_recordings. Отдача — с авторизацией (?auth=token тоже ок).
let _qualRecTableEnsured = false;
async function ensureQualRecordingsTable(env) {
  if (_qualRecTableEnsured) return;
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS deal_qual_recordings (
      id TEXT PRIMARY KEY, deal_id TEXT, r2_key TEXT, name TEXT, size INTEGER,
      content_type TEXT, uploaded_by TEXT, uploaded_at TEXT
    )`).run();
    try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_qual_rec_deal ON deal_qual_recordings(deal_id)`).run(); } catch {}
    // kind: 'recording' (запись звонка) | 'logo' (логотип клиента) — материалы для демо.
    try { await env.DB.prepare(`ALTER TABLE deal_qual_recordings ADD COLUMN kind TEXT DEFAULT 'recording'`).run(); } catch {}
  } catch (e) {}
  _qualRecTableEnsured = true;
}

async function qualRecordingsFor(env, dealId) {
  await ensureQualRecordingsTable(env);
  const { results } = await env.DB.prepare(
    "SELECT id, name, size, content_type, uploaded_by, uploaded_at, COALESCE(kind,'recording') AS kind FROM deal_qual_recordings WHERE deal_id = ? ORDER BY uploaded_at DESC"
  ).bind(dealId).all();
  return (results || []).map(r => ({
    id: r.id, name: r.name, size: r.size, contentType: r.content_type,
    uploadedBy: r.uploaded_by, uploadedAt: r.uploaded_at, kind: r.kind || 'recording',
    url: `/api/deals/${encodeURIComponent(dealId)}/qualification/recording/${encodeURIComponent(r.id)}`,
  }));
}

async function handleQualRecordingUpload(request, env, dealId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  if (!env.FILES) return json({ error: "R2 binding FILES not configured" }, 500, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  await ensureQualRecordingsTable(env);
  const url = new URL(request.url);
  const kind = (url.searchParams.get('kind') === 'logo') ? 'logo' : 'recording';
  const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
  let fileName = kind === 'logo' ? 'logo' : 'recording';
  const xfn = request.headers.get('X-File-Name');
  if (xfn) { try { fileName = decodeURIComponent(xfn); } catch { fileName = xfn; } }
  const body = await request.arrayBuffer();
  if (!body || body.byteLength === 0) return json({ error: "empty file" }, 400, request);
  const maxBytes = kind === 'logo' ? 15 * 1024 * 1024 : 200 * 1024 * 1024;
  if (body.byteLength > maxBytes) return json({ error: `file too large (max ${Math.round(maxBytes/1024/1024)}MB)` }, 413, request);
  const rand = Math.random().toString(36).slice(2, 10);
  const safeName = fileName.replace(/[^\w.\-]/g, '_').slice(0, 80);
  const r2Key = `qual-rec/${dealId}/${kind}-${Date.now().toString(36)}-${rand}-${safeName}`;
  await env.FILES.put(r2Key, body, {
    httpMetadata: { contentType },
    customMetadata: { kind: 'qual-' + kind, dealId, originalName: fileName },
  });
  const id = 'qr_' + Date.now().toString(36) + rand;
  const nowIso = new Date().toISOString();
  const by = me.canonicalUid || me.uid || '';
  await env.DB.prepare(
    "INSERT INTO deal_qual_recordings (id, deal_id, r2_key, name, size, content_type, uploaded_by, uploaded_at, kind) VALUES (?,?,?,?,?,?,?,?,?)"
  ).bind(id, dealId, r2Key, fileName, body.byteLength, contentType, by, nowIso, kind).run();
  return json({ ok: true, recording: {
    id, name: fileName, size: body.byteLength, contentType, uploadedBy: by, uploadedAt: nowIso, kind,
    url: `/api/deals/${encodeURIComponent(dealId)}/qualification/recording/${encodeURIComponent(id)}`,
  } }, 200, request);
}

async function handleQualRecordingsList(request, env, dealId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  return json({ ok: true, recordings: await qualRecordingsFor(env, dealId) }, 200, request);
}

async function handleQualRecordingServe(request, env, dealId, recId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  if (!env.FILES) return new Response('R2 not configured', { status: 500 });
  await ensureQualRecordingsTable(env);
  const row = await env.DB.prepare("SELECT r2_key, name, content_type FROM deal_qual_recordings WHERE id = ? AND deal_id = ?").bind(recId, dealId).first();
  if (!row) return new Response('not found', { status: 404 });
  const obj = await env.FILES.get(row.r2_key);
  if (!obj) return new Response('file missing in R2', { status: 410 });
  const headers = new Headers(corsHeaders(request));
  const ct = row.content_type || obj.httpMetadata?.contentType || 'application/octet-stream';
  headers.set('Content-Type', ct);
  if (obj.size) headers.set('Content-Length', String(obj.size));
  const safeName = encodeURIComponent(row.name || 'recording');
  const disposition = /^(audio|video|image)\//.test(ct) ? 'inline' : 'attachment';
  headers.set('Content-Disposition', `${disposition}; filename*=UTF-8''${safeName}`);
  headers.set('Cache-Control', 'private, max-age=3600');
  headers.set('Accept-Ranges', 'bytes');
  return new Response(obj.body, { headers });
}

async function handleQualRecordingDelete(request, env, dealId, recId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureQualRecordingsTable(env);
  const row = await env.DB.prepare("SELECT r2_key FROM deal_qual_recordings WHERE id = ? AND deal_id = ?").bind(recId, dealId).first();
  if (!row) return json({ error: "not found" }, 404, request);
  try { if (env.FILES) await env.FILES.delete(row.r2_key); } catch {}
  await env.DB.prepare("DELETE FROM deal_qual_recordings WHERE id = ? AND deal_id = ?").bind(recId, dealId).run();
  return json({ ok: true }, 200, request);
}

// Ленивая колонка event_public: 1 = событие видно всем (общий календарь).
let _eventPublicColEnsured = false;
async function ensureEventPublicColumn(env) {
  if (_eventPublicColEnsured) return;
  try { await env.DB.prepare("ALTER TABLE tasks ADD COLUMN event_public INTEGER DEFAULT 0").run(); } catch (e) {}
  _eventPublicColEnsured = true;
}

// POST /api/tasks — создать НОВУЮ задачу в портале (bitrix_id пуст → «текущие»,
// не в «Битрикс Архив»). Постановщик = текущий пользователь.
async function handleCreateTask(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const uid = me.canonicalUid || me.uid || '';
  if (!uid) return json({ error: "no canonical user" }, 403, request);
  let body; try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const title = String(body.title || '').trim();
  if (!title) return json({ error: "title required" }, 400, request);
  const status = Number.isFinite(+body.status) ? Math.max(1, Math.min(6, Math.round(+body.status))) : 2;
  const priority = Number.isFinite(+body.priority) ? Math.max(0, Math.min(3, Math.round(+body.priority))) : 1;
  const description = body.description != null ? String(body.description).slice(0, 20000) : null;
  const deadline = body.deadline ? String(body.deadline) : null;
  const responsible = body.responsibleUid ? String(body.responsibleUid) : uid;
  const accomplices = Array.isArray(body.accomplices) ? [...new Set(body.accomplices.filter(Boolean).map(String))] : [];
  const auditors = Array.isArray(body.auditors) ? [...new Set(body.auditors.filter(Boolean).map(String))] : [];
  // Поля события календаря (mark='zoom_meeting' → показывается как встреча):
  const mark = body.mark ? String(body.mark).slice(0, 40) : null;
  const startDatePlan = body.startDatePlan ? String(body.startDatePlan) : null;
  const endDatePlan = body.endDatePlan ? String(body.endDatePlan) : null;
  // Привязка к сделке: crmLinks = ['deal_<bitrixId>'].
  let crmLinks = null;
  if (Array.isArray(body.crmLinks) && body.crmLinks.length) {
    crmLinks = JSON.stringify(body.crmLinks.filter(Boolean).map(String));
  }
  const eventPublic = body.eventPublic ? 1 : 0;   // 1 = общий календарь (видно всем)
  await ensureEventPublicColumn(env);
  const nowIso = new Date().toISOString();
  const id = 'task_local_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await env.DB.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, deadline,
      start_date_plan, end_date_plan, mark, crm_links,
      responsible_uid, created_by_uid, changed_by_uid, accomplices, auditors,
      event_public, bitrix_created_date, bitrix_changed_date, bitrix_status_changed_date, comments_count)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)
  `).bind(id, title, description, status, priority, deadline,
    startDatePlan, endDatePlan, mark, crmLinks,
    responsible, uid, uid, JSON.stringify(accomplices), JSON.stringify(auditors),
    eventPublic, nowIso, nowIso, nowIso).run();
  return json({ ok: true, id, task: {
    id, title, description, status, priority, deadline,
    startDatePlan, endDatePlan, mark,
    responsibleUid: responsible, createdByUid: uid, accomplices, auditors,
  } }, 200, request);
}

// ═══════════════════════════════════════════════════════════════════════
//  ДЕМО-КОНСТРУКТОР: авто-сборка демо при входе сделки в «Создание Демо».
//  Плашки-демо живут на pllato.kz/app (Канбан Новые/В работе/Итоговые),
//  доступ к демо — по временной токен-ссылке со сроком действия.
// ═══════════════════════════════════════════════════════════════════════
const DEMO_BUILD_STAGE_RE = /создани\w*\s*демо/i;
const DEMO_TOKEN_TTL_DAYS = 30;

let _demosTableEnsured = false;
async function ensureDemosTable(env) {
  if (_demosTableEnsured) return;
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS demos (
      id TEXT PRIMARY KEY, deal_id TEXT, client_name TEXT, title TEXT,
      status TEXT DEFAULT 'new', is_new INTEGER DEFAULT 1,
      website TEXT, brief_snapshot TEXT, token TEXT, token_expires TEXT,
      sort_order INTEGER DEFAULT 0, created_by TEXT, created_at TEXT, updated_at TEXT
    )`).run();
    try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_demos_deal ON demos(deal_id)`).run(); } catch {}
    try { await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_demos_status ON demos(status)`).run(); } catch {}
  } catch (e) {}
  _demosTableEnsured = true;
}

function genDemoToken() {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Полнота материалов для демо: логотип + запись звонка + сайт клиента.
async function demoBriefCompleteness(env, dealId) {
  await ensureQualificationTable(env);
  const row = await env.DB.prepare("SELECT data FROM deal_qualification WHERE deal_id = ?").bind(dealId).first();
  let qual = {}; try { qual = row && row.data ? JSON.parse(row.data) : {}; } catch { qual = {}; }
  const recs = await qualRecordingsFor(env, dealId);
  const hasLogo = recs.some(r => r.kind === 'logo');
  const hasRecording = recs.some(r => r.kind !== 'logo');
  const hasWebsite = !!(qual.client_website && String(qual.client_website).trim());
  const missing = [];
  if (!hasLogo) missing.push('логотип');
  if (!hasRecording) missing.push('запись звонка');
  if (!hasWebsite) missing.push('сайт клиента');
  return { complete: missing.length === 0, missing, qual, recordings: recs };
}

// Авто-создание демо-записи из брифа (идемпотентно: один демо на сделку).
async function createDemoForDeal(env, dealId, me) {
  await ensureDemosTable(env);
  const existing = await env.DB.prepare("SELECT id FROM demos WHERE deal_id = ? LIMIT 1").bind(dealId).first();
  if (existing) {
    // Уже есть — просто снова помечаем «новая» и обновляем срок ссылки.
    await env.DB.prepare("UPDATE demos SET is_new = 1, updated_at = ? WHERE id = ?").bind(new Date().toISOString(), existing.id).run();
    return existing.id;
  }
  const bc = await demoBriefCompleteness(env, dealId);
  const deal = await env.DB.prepare("SELECT title FROM deals WHERE id = ? LIMIT 1").bind(dealId).first();
  const clientName = (deal && deal.title) ? deal.title : 'Клиент';
  const nowIso = new Date().toISOString();
  const expIso = new Date(Date.now() + DEMO_TOKEN_TTL_DAYS * 864e5).toISOString();
  const snapshot = { qual: bc.qual, recordings: bc.recordings.map(r => ({ id: r.id, kind: r.kind, name: r.name })) };
  const id = 'demo_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const token = genDemoToken();
  await env.DB.prepare(`
    INSERT INTO demos (id, deal_id, client_name, title, status, is_new, website, brief_snapshot, token, token_expires, sort_order, created_by, created_at, updated_at)
    VALUES (?,?,?,?,'new',1,?,?,?,?,0,?,?,?)
  `).bind(id, dealId, clientName, clientName + ' — демо',
    (bc.qual.client_website || ''), JSON.stringify(snapshot), token, expIso,
    (me && (me.canonicalUid || me.uid)) || '', nowIso, nowIso).run();
  return id;
}

// GET /api/demos — список плашек для Канбана (auth).
async function handleDemosList(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureDemosTable(env);
  const { results } = await env.DB.prepare(
    "SELECT id, deal_id, client_name, title, status, is_new, website, token, token_expires, sort_order, created_at, updated_at FROM demos ORDER BY sort_order ASC, created_at DESC"
  ).all();
  const origin = new URL(request.url).origin;
  const items = (results || []).map(d => ({
    id: d.id, dealId: d.deal_id, clientName: d.client_name, title: d.title,
    status: d.status || 'new', isNew: !!d.is_new, website: d.website,
    tokenExpires: d.token_expires, createdAt: d.created_at, updatedAt: d.updated_at,
    link: `${origin}/api/demo/${encodeURIComponent(d.id)}?t=${encodeURIComponent(d.token || '')}`,
  }));
  return json({ ok: true, items }, 200, request);
}

// PATCH /api/demos/:id — статус / метка новая / заголовок / порядок (auth).
async function handleDemoUpdate(request, env, id) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureDemosTable(env);
  let body; try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const sets = [], binds = [];
  if (body.status && ['new', 'in_work', 'final'].includes(body.status)) { sets.push("status = ?"); binds.push(body.status); }
  if (body.isNew != null) { sets.push("is_new = ?"); binds.push(body.isNew ? 1 : 0); }
  if (typeof body.title === 'string') { sets.push("title = ?"); binds.push(body.title.slice(0, 200)); }
  if (Number.isFinite(+body.sortOrder)) { sets.push("sort_order = ?"); binds.push(Math.round(+body.sortOrder)); }
  if (!sets.length) return json({ error: "nothing to update" }, 400, request);
  sets.push("updated_at = ?"); binds.push(new Date().toISOString());
  binds.push(id);
  await env.DB.prepare(`UPDATE demos SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();
  return json({ ok: true }, 200, request);
}

// POST /api/demos/:id/relink — перегенерировать токен и продлить срок (auth).
async function handleDemoRelink(request, env, id) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureDemosTable(env);
  const token = genDemoToken();
  const expIso = new Date(Date.now() + DEMO_TOKEN_TTL_DAYS * 864e5).toISOString();
  const res = await env.DB.prepare("UPDATE demos SET token = ?, token_expires = ?, updated_at = ? WHERE id = ?")
    .bind(token, expIso, new Date().toISOString(), id).run();
  if (!res.meta || res.meta.changes === 0) return json({ error: "not found" }, 404, request);
  const origin = new URL(request.url).origin;
  return json({ ok: true, link: `${origin}/api/demo/${encodeURIComponent(id)}?t=${token}`, tokenExpires: expIso }, 200, request);
}

async function handleDemoDelete(request, env, id) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureDemosTable(env);
  await env.DB.prepare("DELETE FROM demos WHERE id = ?").bind(id).run();
  return json({ ok: true }, 200, request);
}

// Правила сбора систем (свободный текст) — kv 'demo:rules'. Правят админы.
async function handleDemoRulesGet(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const row = await env.DB.prepare("SELECT v FROM kv WHERE k = 'demo:rules'").first();
  let rules = ''; try { rules = row && row.v ? JSON.parse(row.v) : ''; } catch { rules = row?.v || ''; }
  return json({ ok: true, rules: typeof rules === 'string' ? rules : '' }, 200, request);
}
async function handleDemoRulesPut(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  if (me.role !== 'admin') return json({ error: "admin only" }, 403, request);
  let body; try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const rules = String(body.rules || '').slice(0, 100000);
  await env.DB.prepare("INSERT INTO kv (k, v) VALUES ('demo:rules', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(JSON.stringify(rules)).run();
  return json({ ok: true }, 200, request);
}

// Публичная отдача демо по временной ссылке: /api/demo/:id?t=token
async function handleDemoServe(request, env, id) {
  await ensureDemosTable(env);
  const url = new URL(request.url);
  const token = url.searchParams.get('t') || '';
  const d = await env.DB.prepare("SELECT * FROM demos WHERE id = ?").bind(id).first();
  const expiredHtml = (msg) => new Response(demoStubHtml(msg), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  if (!d) return expiredHtml('Демо не найдено.');
  if (!token || token !== d.token) return expiredHtml('Ссылка недействительна.');
  if (d.token_expires && new Date(d.token_expires) < new Date()) return expiredHtml('Срок действия ссылки истёк. Запросите новую у менеджера.');
  let snap = {}; try { snap = d.brief_snapshot ? JSON.parse(d.brief_snapshot) : {}; } catch {}
  let rules = ''; try { const rr = await env.DB.prepare("SELECT v FROM kv WHERE k = 'demo:rules'").first(); rules = rr && rr.v ? JSON.parse(rr.v) : ''; } catch {}
  const html = genDemoHtml(d, snap, rules, url.origin, token);
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

// Публичная отдача логотипа демо (в контексте валидного токена): /api/demo/:id/logo?t=
async function handleDemoLogoServe(request, env, id) {
  await ensureDemosTable(env);
  const url = new URL(request.url);
  const token = url.searchParams.get('t') || '';
  const d = await env.DB.prepare("SELECT deal_id, token, token_expires FROM demos WHERE id = ?").bind(id).first();
  if (!d || !token || token !== d.token) return new Response('forbidden', { status: 403 });
  if (d.token_expires && new Date(d.token_expires) < new Date()) return new Response('expired', { status: 410 });
  if (!env.FILES) return new Response('no storage', { status: 500 });
  const rec = await env.DB.prepare("SELECT r2_key, content_type FROM deal_qual_recordings WHERE deal_id = ? AND kind = 'logo' ORDER BY uploaded_at DESC LIMIT 1").bind(d.deal_id).first();
  if (!rec) return new Response('no logo', { status: 404 });
  const obj = await env.FILES.get(rec.r2_key);
  if (!obj) return new Response('missing', { status: 410 });
  const headers = new Headers();
  headers.set('Content-Type', rec.content_type || 'image/png');
  headers.set('Cache-Control', 'public, max-age=3600');
  return new Response(obj.body, { headers });
}

function demoStubHtml(msg) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Демо Pllato</title></head>
<body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0f1226;color:#e7ecff;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px">
<div><div style="font-size:44px;margin-bottom:12px">🔒</div><h1 style="font-size:22px;margin:0 0 8px">${escapeHtml(msg)}</h1>
<p style="color:#9aa3d0;max-width:420px;margin:0 auto">Pllato — конструктор кастомных систем.</p></div></body></html>`;
}

// Генерация полноценной демо-страницы из брифа + правил сборки.
function genDemoHtml(demo, snap, rules, origin, token) {
  const q = (snap && snap.qual) || {};
  const esc = (s) => escapeHtml(String(s == null ? '' : s));
  const client = esc(demo.client_name || 'Клиент');
  const logoUrl = `${origin}/api/demo/${encodeURIComponent(demo.id)}/logo?t=${encodeURIComponent(token)}`;
  const arr = (v) => Array.isArray(v) ? v : (v ? [v] : []);
  const modules = [];
  if (q.need_1c === 'Да') modules.push(['🔗', 'Интеграция с 1С', 'Синхронизация товаров, остатков и оплат с 1С']);
  if (q.need_warehouse === 'Да') modules.push(['📦', 'Склад и остатки', 'Учёт остатков в реальном времени по точкам']);
  for (const m of arr(q.need_messengers)) modules.push(['💬', m, `Общение с клиентами прямо из системы через ${esc(m)}`]);
  for (const s of arr(q.ch_sources)) modules.push(['📥', 'Источник: ' + esc(s), `Все обращения из ${esc(s)} автоматически в воронке`]);
  modules.push(['📊', 'Воронки и аналитика', 'Сделки по этапам, конверсия, отчёты по менеджерам']);
  modules.push(['✅', 'Задачи команды', 'Постановка задач, дедлайны, контроль исполнения']);
  const moduleCards = modules.slice(0, 9).map(m =>
    `<div class="mod"><div class="mi">${m[0]}</div><div class="mt">${esc(m[1])}</div><div class="md">${esc(m[2])}</div></div>`
  ).join('');
  const pain = esc(q.pain_main || q.pain_money || '');
  const bizWhat = esc(q.biz_what || '');
  const rulesNote = rules && String(rules).trim()
    ? `<!-- Правила сборки (внутреннее ТЗ):\n${String(rules).replace(/--+>/g, '')}\n-->` : '';
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Демо для ${client} · Pllato</title>${rulesNote}
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,Segoe UI,Roboto,Inter,sans-serif;background:#0c1030;color:#eaf0ff;line-height:1.55}
.wrap{max-width:1040px;margin:0 auto;padding:0 20px}
header{padding:26px 0;display:flex;align-items:center;gap:16px;border-bottom:1px solid rgba(255,255,255,.08)}
header img{height:52px;width:auto;max-width:180px;object-fit:contain;background:#fff;border-radius:10px;padding:6px}
header .h-t{font-weight:800;font-size:20px}
header .h-s{color:#9aa6e0;font-size:13px}
.hero{padding:64px 0 40px;text-align:center}
.hero h1{font-size:clamp(28px,5vw,46px);font-weight:850;letter-spacing:-.02em;margin-bottom:14px;background:linear-gradient(90deg,#7c9cff,#c9a6ff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.hero p{color:#b9c2ee;font-size:17px;max-width:680px;margin:0 auto}
.badge{display:inline-block;background:rgba(124,156,255,.16);border:1px solid rgba(124,156,255,.4);color:#a9beff;font-size:12px;font-weight:700;padding:5px 12px;border-radius:99px;margin-bottom:18px;text-transform:uppercase;letter-spacing:.05em}
.pain{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:22px 24px;margin:28px 0}
.pain .l{color:#8b95c9;font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.pain .v{font-size:18px;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin:26px 0 60px}
.mod{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:18px}
.mod .mi{font-size:26px;margin-bottom:8px}
.mod .mt{font-weight:700;font-size:15px;margin-bottom:4px}
.mod .md{color:#9aa6e0;font-size:13px}
.sec-t{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#8b95c9;margin:40px 0 6px;text-align:center}
footer{border-top:1px solid rgba(255,255,255,.08);padding:24px 0 50px;text-align:center;color:#7a83b5;font-size:13px}
.cta{display:inline-block;margin-top:8px;background:linear-gradient(135deg,#5b6dff,#8a5cff);color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:12px}
</style></head>
<body><div class="wrap">
<header><img src="${logoUrl}" alt="logo" onerror="this.style.display='none'"><div><div class="h-t">${client}</div><div class="h-s">Кастомная система · демо от Pllato</div></div></header>
<section class="hero"><div class="badge">Персональная демка</div>
<h1>Система под ${client}</h1>
<p>${bizWhat ? bizWhat + '. ' : ''}Собрано на основе вашего запроса — под ваши процессы, а не типовая коробка.</p></section>
${pain ? `<div class="pain"><div class="l">Задача, которую решаем</div><div class="v">${pain}</div></div>` : ''}
<div class="sec-t">Что будет в системе</div>
<div class="grid">${moduleCards}</div>
<div style="text-align:center;margin-bottom:50px"><a class="cta" href="#">Обсудить внедрение →</a></div>
</div>
<footer>Демо подготовлено Pllato · ${client}<br>Это предварительная демонстрация. Финальный состав уточняется на встрече.</footer>
</body></html>`;
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
  // Опциональная подпричина отказа. Передаётся UI'ем при drag-drop в REJECT
  // или при выборе из селектора в карточке. Допустимые значения:
  // NOT_INTERESTED|WRONG_CITY|DISCONNECTED|WANTED_ONLINE|INVALID_NUMBER
  const REJECT_REASONS = new Set(["NOT_INTERESTED","WRONG_CITY","DISCONNECTED","WANTED_ONLINE","INVALID_NUMBER"]);
  let rejectReason = body.rejectReason != null ? String(body.rejectReason).trim() : null;
  if (rejectReason && !REJECT_REASONS.has(rejectReason)) {
    return json({ error: "invalid rejectReason (allowed: " + [...REJECT_REASONS].join(", ") + ")" }, 400, request);
  }
  if (!pipelineId || !stageId) return json({ error: "pipelineId and stageId required" }, 400, request);

  const deal = await env.DB.prepare(
    "SELECT id, pipeline_id, stage_id, mirrored_in FROM deals WHERE id = ? LIMIT 1"
  ).bind(dealId).first();
  if (!deal) return json({ error: "deal not found", id: dealId }, 404, request);

  const nowIso = new Date().toISOString();
  await ensureStageChangedAtColumn(env);
  // stage_changed_at сбрасываем только когда стадия РЕАЛЬНО меняется (а не при
  // повторном PATCH в ту же стадию). stageTs=null → COALESCE сохраняет прежнее
  // значение. Так «N дней на этапе» считается от момента фактического перехода.
  const stageActuallyChanged = String(deal.stage_id) !== stageId;
  const stageTs = stageActuallyChanged ? nowIso : null;

  // ── Гейт «Создание Демо»: не пускаем сделку на стадию без материалов ──
  // Определяем, называется ли целевая стадия «Создание Демо».
  let isDemoBuildStage = false;
  try {
    const pipRow = await env.DB.prepare("SELECT stages FROM pipelines WHERE id = ?").bind(pipelineId).first();
    if (pipRow && pipRow.stages) {
      const st = JSON.parse(pipRow.stages);
      const nm = (st && st[stageId] && st[stageId].name) || '';
      if (DEMO_BUILD_STAGE_RE.test(nm)) isDemoBuildStage = true;
    }
  } catch {}
  const isMainMove = deal.pipeline_id === pipelineId;
  if (isDemoBuildStage && isMainMove && stageActuallyChanged) {
    const bc = await demoBriefCompleteness(env, dealId);
    if (!bc.complete) {
      return json({
        error: "Нельзя перевести на «Создание Демо»: не заполнены материалы для демо — " + bc.missing.join(', ') + ". Откройте Бриф в карточке сделки и добавьте их.",
        demoGate: true, missing: bc.missing,
      }, 422, request);
    }
  }

  // Логика reject_reason: при переходе в REJECT — записываем. При переходе
  // из REJECT в любую другую стадию — обнуляем (причина больше не релевантна).
  // Применяется ТОЛЬКО для основной воронки (deal.pipeline_id === pipelineId);
  // для зеркал — игнорируется (зеркало — это другая воронка, своя стадия,
  // причина отказа не имеет смысла кросс-pipeline'но).
  if (deal.pipeline_id === pipelineId) {
    if (stageId === "REJECT") {
      await env.DB.prepare(
        "UPDATE deals SET stage_id = ?, reject_reason = ?, bitrix_date_modify = ?, stage_changed_at = COALESCE(?, stage_changed_at) WHERE id = ?"
      ).bind(stageId, rejectReason || null, nowIso, stageTs, dealId).run();
    } else {
      await env.DB.prepare(
        "UPDATE deals SET stage_id = ?, reject_reason = NULL, bitrix_date_modify = ?, stage_changed_at = COALESCE(?, stage_changed_at) WHERE id = ?"
      ).bind(stageId, nowIso, stageTs, dealId).run();
    }
    // Журнал входа в стадию — только при реальной смене (для графиков).
    if (stageActuallyChanged) await logStageEvent(env, dealId, pipelineId, stageId, nowIso);
  } else {
    // Зеркало — обновляем mirrored_in[pipelineId]
    let mir = {};
    try { mir = deal.mirrored_in ? JSON.parse(deal.mirrored_in) : {}; } catch {}
    if (!mir || typeof mir !== 'object' || Array.isArray(mir)) mir = {};
    const prevMir = mir[pipelineId];
    mir[pipelineId] = stageId;
    await env.DB.prepare(
      "UPDATE deals SET mirrored_in = ?, bitrix_date_modify = ? WHERE id = ?"
    ).bind(JSON.stringify(mir), nowIso, dealId).run();
    if (prevMir !== stageId) await logStageEvent(env, dealId, pipelineId, stageId, nowIso);
  }

  await auditLog(env, me, "deal_stage_change", "deal", dealId, { pipelineId, stageId, isMirror: deal.pipeline_id !== pipelineId });

  // ── Авто-сборка демо при входе в «Создание Демо» ────────────────────
  // Гейт выше уже гарантировал полноту материалов. Создаём плашку-демо
  // (идемпотентно) + временную токен-ссылку. Ошибку не пробрасываем, чтобы
  // не сорвать смену стадии.
  let demoCreatedId = null;
  if (isDemoBuildStage && isMainMove && stageActuallyChanged) {
    try { demoCreatedId = await createDemoForDeal(env, dealId, me); } catch (e) { console.error('createDemoForDeal:', e); }
  }

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
    demoCreated: demoCreatedId || null,
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
  // 'user' — выбор сотрудника (значение = uid), 'checklist' — to-do список
  // (значение = JSON {itemId:bool}, список пунктов хранится в колонке list).
  const validTypes = ['string', 'text', 'integer', 'double', 'date', 'datetime', 'enumeration', 'boolean', 'user', 'checklist'];
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

  await ensureUserPhonesColumn(env);
  // LEFT JOIN users + user_roles + COUNT задач (для удобства видеть нагрузку)
  const { results } = await env.DB.prepare(`
    SELECT
      u.uid, u.email, u.name, u.last_name, u.position, u.phone, u.phones, u.photo, u.active,
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
    phone: r.phone,
    phones: userPhoneList(r),
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
  // При активации сбрасываем метку авто-приостановки и «последнего захода»,
  // иначе сотрудника снова заблокирует на ближайшем /api/me.
  if (active === 1) {
    try { await ensureLastSeenColumn(env); await env.DB.prepare("UPDATE users SET last_seen_at = ?, auto_suspended_at = NULL WHERE uid = ?").bind(Date.now(), targetUid).run(); } catch (e) {}
  }

  await auditLog(env, guard.me, active === 1 ? "user_activate" : "user_deactivate", "user", targetUid, {
    old: { active: before.active },
    new: { active },
  });

  return json({ ok: true, uid: targetUid, active }, 200, request);
}

// PATCH /api/admin/users/{uid}/profile — редактирование профиля сотрудника:
// name, lastName, email, position, phone. Меняем только переданные поля.
async function handleAdminUpdateProfile(request, env, targetUid) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);

  let body;
  try { body = await request.json(); } catch {
    return json({ error: "invalid json body" }, 400, request);
  }

  await ensureUserPhonesColumn(env);
  const before = await env.DB.prepare(
    "SELECT uid, email, name, last_name, position, phone, phones FROM users WHERE uid = ?"
  ).bind(targetUid).first();
  if (!before) return json({ error: "user not found", uid: targetUid }, 404, request);

  const sets = [];
  const params = [];
  const changed = {};

  if (body.name !== undefined) {
    const name = String(body.name || '').trim();
    if (!name) return json({ error: "name cannot be empty" }, 400, request);
    sets.push("name = ?"); params.push(name); changed.name = name;
  }
  if (body.lastName !== undefined) {
    const lastName = String(body.lastName || '').trim() || null;
    sets.push("last_name = ?"); params.push(lastName); changed.lastName = lastName;
  }
  if (body.position !== undefined) {
    const position = String(body.position || '').trim() || null;
    sets.push("position = ?"); params.push(position); changed.position = position;
  }
  // phones (массив) имеет приоритет над legacy phone. Нормализуем, пишем
  // и phones (JSON), и phone (основной = первый) для обратной совместимости.
  if (body.phones !== undefined) {
    const list = normalizePhoneListInput(body.phones);
    const primary = list.length ? list[0] : null;
    const phonesJson = list.length ? JSON.stringify(list) : null;
    sets.push("phones = ?"); params.push(phonesJson);
    sets.push("phone = ?");  params.push(primary);
    changed.phones = list; changed.phone = primary;
  } else if (body.phone !== undefined) {
    const phone = String(body.phone || '').trim() || null;
    sets.push("phone = ?"); params.push(phone); changed.phone = phone;
  }
  if (body.email !== undefined) {
    const email = String(body.email || '').toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "invalid email" }, 400, request);
    }
    // Дубликат email у другого сотрудника?
    const dup = await env.DB.prepare(
      "SELECT uid FROM users WHERE LOWER(email) = ? AND uid != ? LIMIT 1"
    ).bind(email, targetUid).first();
    if (dup) return json({ error: "email уже используется другим сотрудником", uid: dup.uid }, 409, request);
    sets.push("email = ?"); params.push(email); changed.email = email;
  }

  if (sets.length === 0) return json({ error: "nothing to update" }, 400, request);

  params.push(targetUid);
  await env.DB.prepare(
    `UPDATE users SET ${sets.join(", ")} WHERE uid = ?`
  ).bind(...params).run();

  await auditLog(env, guard.me, "user_update_profile", "user", targetUid, {
    old: { email: before.email, name: before.name, lastName: before.last_name, position: before.position, phone: before.phone, phones: userPhoneList(before) },
    new: changed,
  });

  return json({ ok: true, uid: targetUid, ...changed }, 200, request);
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
  await ensureStageChangedAtColumn(env);
  let revived = 0;
  for (const deal of deals) {
    const currentStage = stages.find(s => (s.statusId || s.id) === deal.stage_id);
    if (currentStage && currentStage.semantics === 'F') {
      const nowIso = new Date().toISOString();
      await env.DB.prepare(`
        UPDATE deals SET stage_id = ?, closed = 0, bitrix_date_modify = ?, stage_changed_at = ? WHERE id = ?
      `).bind(newStageId, nowIso, nowIso, deal.id).run();
      console.log('[wa-webhook] revived deal', deal.id, 'from', deal.stage_id, '→', newStageId);
      revived++;
    }
  }
  return revived;
}

// Первая активная стадия воронки (не Fail/Success), по порядку sort.
// Нужна когда у канала не задана default_stage_id — иначе новая WA-сделка
// создаётся с stage_id = NULL, в канбане висит «orphan» (доклеивается в первую
// колонку лишь визуально) и ведёт себя нестабильно. Возвращаем реальный
// statusId «Новой», чтобы сделка прочно лежала в первой стадии.
async function getFirstStageId(env, pipelineId) {
  if (!pipelineId) return null;
  const pipeline = await env.DB.prepare("SELECT stages FROM pipelines WHERE id = ?").bind(pipelineId).first();
  if (!pipeline?.stages) return null;
  let stagesObj;
  try { stagesObj = JSON.parse(pipeline.stages); } catch { return null; }
  const stages = Array.isArray(stagesObj) ? stagesObj : Object.values(stagesObj || {});
  if (!stages.length) return null;
  stages.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  const first = stages.find(s => s.semantics !== 'F' && s.semantics !== 'S') || stages[0];
  return first ? (first.statusId || first.id) : null;
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
  // Стадия: заданная у канала, иначе — первая активная стадия воронки
  // (чтобы сделка не создавалась с stage_id = NULL и прочно легла в «Новую»).
  let stageId = channel.default_stage_id || null;
  if (!stageId) {
    try { stageId = await getFirstStageId(env, channel.default_pipeline_id); } catch {}
  }
  await ensureStageChangedAtColumn(env);
  await env.DB.prepare(`
    INSERT INTO deals (
      id, title, pipeline_id, stage_id, responsible_uid,
      contact_id, source_description, closed, bitrix_id,
      bitrix_date_create, bitrix_date_modify, stage_changed_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'WhatsApp', 0, ?, ?, ?, ?)
  `).bind(
    newId, title,
    channel.default_pipeline_id, stageId,
    responsibleUid,
    contactId, bitrixKey, nowIso, nowIso, nowIso,
  ).run();
  await logStageEvent(env, newId, channel.default_pipeline_id, stageId, nowIso);
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

// Ленивая идемпотентная миграция: колонка sender_name в wa_messages (для показа
// автора в групповых чатах). Флаг на изолят — ALTER выполняется один раз.
let _waSenderColEnsured = false;
async function ensureWaSenderColumn(env) {
  if (_waSenderColEnsured) return;
  try { await env.DB.prepare("ALTER TABLE wa_messages ADD COLUMN sender_name TEXT").run(); }
  catch (e) { /* колонка уже есть — ок */ }
  _waSenderColEnsured = true;
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
    await ensureWaSenderColumn(env);
    // Для групп сохраняем автора входящего сообщения, чтобы в истории было видно,
    // кто из участников написал. Для 1:1 и исходящих — null (не нужно/это мы сами).
    const senderForRow = (isGroup && evt.direction === 'in') ? (evt.senderName || null) : null;
    await env.DB.prepare(`
      INSERT OR IGNORE INTO wa_messages (
        id, chat_id, wa_message_id, direction, text,
        media_kind, media_url, media_file_name, media_mime_type, caption, sender_name, ts
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      msgDocId, chatDocId, evt.waMessageId, evt.direction, evt.text || null,
      evt.mediaKind, evt.mediaUrl, evt.mediaFileName, evt.mediaMimeType, evt.caption, senderForRow, evt.ts,
    ).run();
  }

  // Поднять сделку в канбане — обновим bitrix_date_modify (renderDeals
  // сортирует по нему, плюс это "свежая" сделка наверху списка).
  if (dealId) {
    const isoTs = new Date(evt.ts).toISOString();
    await env.DB.prepare("UPDATE deals SET bitrix_date_modify = ? WHERE id = ?").bind(isoTs, dealId).run();
  }

  // Уведомление ответственному о входящем WhatsApp (для индивидуальных чатов).
  if (evt.direction === 'in' && dealId && !isGroup) {
    try {
      // АНТИ-БОМБАРДИРОВКА. Раньше уведомление слалось на КАЖДЫЙ вебхук без
      // дедупа/троттла, из-за чего сотрудника заваливало сотнями WhatsApp:
      //  1) бэклог Green-API: если вебхук был недоступен, очередь копит вебхуки
      //     и при восстановлении разом присылает сотни старых — фильтруем по
      //     свежести (старые входящие просто пишем в историю, но не пингуем);
      //  2) редоставка/рапид-флуд одного чата: не чаще 1 уведомления на чат
      //     раз в WA_NOTIF_THROTTLE_MS (умножалось ещё и на multi-phone).
      const WA_NOTIF_FRESH_MS = 10 * 60 * 1000;   // старше 10 мин — не пингуем
      const WA_NOTIF_THROTTLE_MS = 5 * 60 * 1000; // ≤ 1 пинг на чат / 5 мин
      const ageMs = Date.now() - (evt.ts || 0);
      if (ageMs < WA_NOTIF_FRESH_MS) {
        const d = await env.DB.prepare("SELECT responsible_uid FROM deals WHERE id = ?").bind(dealId).first();
        if (d?.responsible_uid) {
          const recent = await env.DB.prepare(
            "SELECT created_at FROM notifications WHERE uid = ? AND type = 'wa_incoming' AND entity_id = ? ORDER BY created_at DESC LIMIT 1"
          ).bind(d.responsible_uid, dealId).first();
          const sinceLast = Date.now() - (recent?.created_at || 0);
          if (sinceLast >= WA_NOTIF_THROTTLE_MS) {
            const who = evt.displayName || evt.senderName || ('+' + (evt.phone || ''));
            await createNotification(env, {
              uid: d.responsible_uid, type: 'wa_incoming',
              title: '💬 WhatsApp: ' + who,
              body: preview || '[сообщение]',
              link: '/team.html?page=deals&deal=' + dealId,
              icon: '💬', entityType: 'deal', entityId: dealId,
            });
          }
        }
      }
    } catch (e) { console.warn('[notif] wa failed:', e && e.message); }
  }

  return json({ ok: true, dealId, contactId, chatId: chatDocId }, 200, request);
}

// POST /api/wa/send { channelId, chatId, phone, text, mediaUrl, fileName }
// Доставка одного WA-сообщения через Green-API + апсёрт wa_chats/wa_messages.
// Общий код для живой отправки (handleWaSend) и отложенной (cron scheduled()).
// Бросает Error при сбое Green-API, чтобы вызывающий мог пометить failed.
// Возвращает { idMessage, chatDocId }.
async function deliverWaMessage(env, { channel, chatId, text, mediaUrl, fileName }) {
  const baseUrl = `${channel.api_url}/waInstance${channel.id_instance}`;
  const apiToken = channel.api_token_instance;
  text = (text || '').trim();
  fileName = fileName || 'file';

  let apiResp;
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
    throw new Error('text or mediaUrl required');
  }

  const waMessageId = apiResp?.idMessage || null;
  if (!waMessageId) throw new Error('green-api did not return idMessage: ' + JSON.stringify(apiResp).slice(0, 300));

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

  return { idMessage: waMessageId, chatDocId };
}

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
  if (!text && !mediaUrl) return json({ error: "text or mediaUrl required" }, 400, request);

  let channel = channelId ? await getWaChannel(env, channelId) : null;
  if (!channel) {
    channel = await env.DB.prepare("SELECT * FROM wa_channels WHERE active = 1 ORDER BY created_at ASC LIMIT 1").first();
  }
  if (!channel) return json({ error: "no active WhatsApp channel configured" }, 503, request);

  let result;
  try {
    result = await deliverWaMessage(env, { channel, chatId, text, mediaUrl, fileName });
  } catch (e) {
    return json({ error: "green-api send failed: " + e.message }, 502, request);
  }

  await auditLog(env, me, "wa_send", "wa_chat", result.chatDocId, { hasMedia: !!mediaUrl });
  return json({ ok: true, idMessage: result.idMessage, chatId: result.chatDocId }, 200, request);
}

// ── Отложенные WhatsApp-сообщения ──────────────────────────────────────
// Сотрудник пишет сообщение и ставит время → строка в wa_scheduled_messages
// со status='pending'. Cron (каждую минуту) находит due и отправляет.
function genScheduleId() {
  return 'sch_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// POST /api/wa/schedule { chatId|phone, text, scheduledAt (unix ms), channelId?, mediaUrl?, fileName? }
async function handleWaScheduleCreate(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }
  let channelId = body.channelId || null;
  const instanceId = body.instanceId || null;
  let chatId = body.chatId || '';
  const phone = body.phone || '';
  const text = (body.text || '').trim();
  const mediaUrl = body.mediaUrl || null;
  const fileName = body.fileName || null;
  const scheduledAt = parseInt(body.scheduledAt, 10);

  if (!chatId && phone) chatId = waChatIdFromPhone(phone);
  if (!chatId) return json({ error: "chatId or phone required" }, 400, request);
  if (!text && !mediaUrl) return json({ error: "text or mediaUrl required" }, 400, request);
  if (!scheduledAt || isNaN(scheduledAt)) return json({ error: "scheduledAt (unix ms) required" }, 400, request);
  if (scheduledAt < Date.now() - 60000) return json({ error: "scheduledAt is in the past" }, 400, request);

  // Если фронт прислал instanceId (Green-API instance чата) — резолвим в wa_channels.id,
  // чтобы отложенное ушло с того же канала, что и сам чат. Иначе cron возьмёт active.
  if (!channelId && instanceId) {
    const ch = await getWaChannelByInstance(env, instanceId);
    if (ch) channelId = ch.id;
  }

  const id = genScheduleId();
  const now = Date.now();
  const phoneDigits = chatId.split('@')[0];

  await env.DB.prepare(`
    INSERT INTO wa_scheduled_messages
      (id, channel_id, chat_id, phone, text, media_url, file_name, scheduled_at, status, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).bind(id, channelId, chatId, phone || phoneDigits, text || null, mediaUrl, fileName, scheduledAt, me.canonicalUid || me.uid || 'unknown', now).run();

  await auditLog(env, me, "wa_schedule_create", "wa_scheduled", id, { scheduledAt, hasMedia: !!mediaUrl });
  return json({ ok: true, id, scheduledAt, status: 'pending' }, 200, request);
}

// GET /api/wa/schedule?chatId=...&status=pending  — список отложенных по чату
async function handleWaScheduleList(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  const url = new URL(request.url);
  const chatId = (url.searchParams.get("chatId") || "").trim();
  const status = (url.searchParams.get("status") || "pending").trim();

  const where = [];
  const params = [];
  if (chatId) { where.push("chat_id = ?"); params.push(chatId); }
  if (status && status !== 'all') { where.push("status = ?"); params.push(status); }
  const whereSQL = where.length ? "WHERE " + where.join(" AND ") : "";

  const { results } = await env.DB.prepare(`
    SELECT id, channel_id, chat_id, phone, text, media_url, file_name, scheduled_at, status, error, sent_message_id, created_by, created_at, sent_at
    FROM wa_scheduled_messages ${whereSQL}
    ORDER BY scheduled_at ASC LIMIT 200
  `).bind(...params).all();

  const items = (results || []).map(r => ({
    id: r.id, channelId: r.channel_id, chatId: r.chat_id, phone: r.phone,
    text: r.text, mediaUrl: r.media_url, fileName: r.file_name,
    scheduledAt: r.scheduled_at, status: r.status, error: r.error,
    sentMessageId: r.sent_message_id, createdBy: r.created_by,
    createdAt: r.created_at, sentAt: r.sent_at,
  }));
  return json({ items, total: items.length }, 200, request);
}

// DELETE /api/wa/schedule/:id  — отмена отложенного (только pending)
async function handleWaScheduleCancel(request, env, id) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);

  const row = await env.DB.prepare("SELECT id, status FROM wa_scheduled_messages WHERE id = ?").bind(id).first();
  if (!row) return json({ error: "not found" }, 404, request);
  if (row.status !== 'pending') return json({ error: "already " + row.status }, 409, request);

  await env.DB.prepare("UPDATE wa_scheduled_messages SET status = 'cancelled' WHERE id = ?").bind(id).run();
  await auditLog(env, me, "wa_schedule_cancel", "wa_scheduled", id, {});
  return json({ ok: true, id, status: 'cancelled' }, 200, request);
}

// Cron-обработчик: найти все due pending и отправить. Вызывается из scheduled().
async function processScheduledWaMessages(env) {
  const now = Date.now();
  const { results } = await env.DB.prepare(`
    SELECT * FROM wa_scheduled_messages
    WHERE status = 'pending' AND scheduled_at <= ?
    ORDER BY scheduled_at ASC LIMIT 50
  `).bind(now).all();

  if (!results || results.length === 0) return { processed: 0, sent: 0, failed: 0 };

  let sent = 0, failed = 0;
  for (const row of results) {
    try {
      let channel = row.channel_id ? await getWaChannel(env, row.channel_id) : null;
      if (!channel) {
        channel = await env.DB.prepare("SELECT * FROM wa_channels WHERE active = 1 ORDER BY created_at ASC LIMIT 1").first();
      }
      if (!channel) throw new Error("no active WhatsApp channel configured");

      const result = await deliverWaMessage(env, {
        channel, chatId: row.chat_id,
        text: row.text, mediaUrl: row.media_url, fileName: row.file_name,
      });

      await env.DB.prepare(`
        UPDATE wa_scheduled_messages SET status = 'sent', sent_message_id = ?, sent_at = ?, error = NULL WHERE id = ?
      `).bind(result.idMessage, Date.now(), row.id).run();
      sent++;
    } catch (e) {
      await env.DB.prepare(`
        UPDATE wa_scheduled_messages SET status = 'failed', error = ?, sent_at = ? WHERE id = ?
      `).bind(String(e.message || e).slice(0, 500), Date.now(), row.id).run();
      failed++;
    }
  }
  return { processed: results.length, sent, failed };
}

// Ленивая миграция: колонка archived в wa_chats (архив групповых/личных чатов).
let _waArchivedColEnsured = false;
async function ensureWaArchivedColumn(env) {
  if (_waArchivedColEnsured) return;
  try { await env.DB.prepare("ALTER TABLE wa_chats ADD COLUMN archived INTEGER DEFAULT 0").run(); }
  catch (e) { /* колонка уже есть — ок */ }
  _waArchivedColEnsured = true;
}

// Ленивая миграция: колонка avatar в wa_chats (кастомная иконка группы/чата).
let _waAvatarColEnsured = false;
async function ensureWaAvatarColumn(env) {
  if (_waAvatarColEnsured) return;
  try { await env.DB.prepare("ALTER TABLE wa_chats ADD COLUMN avatar TEXT").run(); }
  catch (e) { /* колонка уже есть — ок */ }
  _waAvatarColEnsured = true;
}

// POST /api/wa/chat-avatar?chatId=X (raw image body) — кастомная иконка чата
// (в основном для групп). Кладём в R2, ставим wa_chats.avatar, отдаём URL.
async function handleWaChatAvatarUpload(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  if (!env.FILES) return json({ error: "R2 binding FILES not configured" }, 500, request);
  const url = new URL(request.url);
  const chatId = (url.searchParams.get("chatId") || "").trim();
  if (!chatId) return json({ error: "chatId required" }, 400, request);
  const contentType = request.headers.get('Content-Type') || '';
  if (!/^image\//i.test(contentType)) return json({ error: "Нужен файл-изображение" }, 400, request);
  const body = await request.arrayBuffer();
  if (body.byteLength === 0) return json({ error: "Пустой файл" }, 400, request);
  if (body.byteLength > 3 * 1024 * 1024) return json({ error: "Файл слишком большой (макс 3 МБ)" }, 413, request);
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const rand = Math.random().toString(36).slice(2, 8);
  const safe = String(chatId).replace(/[^\w.\-]/g, '_').slice(0, 80);
  const r2Key = `wa-avatars/${safe}-${rand}.${ext}`;
  await env.FILES.put(r2Key, body, { httpMetadata: { contentType }, customMetadata: { kind: 'wa-chat-avatar' } });
  const publicUrl = `${url.origin}/api/avatar/${encodeURIComponent(r2Key)}`;
  await ensureWaAvatarColumn(env);
  await env.DB.prepare("UPDATE wa_chats SET avatar = ?, updated_at = datetime('now') WHERE id = ?").bind(publicUrl, chatId).run();
  return json({ ok: true, url: publicUrl }, 200, request);
}

// POST /api/wa/chats/archive { chatId, archived } — архивировать/вернуть чат.
async function handleWaArchiveChat(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const chatId = body.chatId;
  if (!chatId) return json({ error: "chatId required" }, 400, request);
  await ensureWaArchivedColumn(env);
  const archived = body.archived === false ? 0 : 1;
  await env.DB.prepare(
    "UPDATE wa_chats SET archived = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(archived, chatId).run();
  return json({ ok: true, archived: !!archived }, 200, request);
}

// GET /api/wa/chats?scope=mine|team|all&limit=200&archived=0|1
async function handleWaListChats(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  await ensureWaArchivedColumn(env);
  await ensureWaAvatarColumn(env);

  const url = new URL(request.url);
  const limit = Math.min(500, Math.max(10, parseInt(url.searchParams.get("limit") || "200", 10) || 200));
  let scope = (url.searchParams.get("scope") || "").trim();
  if (!scope) scope = me.role === "admin" ? "all" : "mine";
  if (scope === "all" && me.role !== "admin") scope = "mine";
  // По умолчанию архивные чаты скрыты; ?archived=1 — показать только архив.
  const archivedParam = (url.searchParams.get("archived") || "").trim();
  const wantArchived = (archivedParam === "1" || archivedParam === "true");

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

  const archivedCond = `COALESCE(c.archived, 0) = ${wantArchived ? 1 : 0}`;
  const finalWhere = whereSQL ? `${whereSQL} AND ${archivedCond}` : `WHERE ${archivedCond}`;
  const { results } = await env.DB.prepare(`
    SELECT c.* FROM wa_chats c ${finalWhere}
    ORDER BY c.last_message_at DESC LIMIT ?
  `).bind(...params, limit).all();

  const items = results.map(r => ({
    id: r.id, instanceId: r.instance_id, chatId: r.chat_id, phone: r.phone,
    isGroup: !!r.is_group, name: r.name, contactId: r.contact_id, dealId: r.deal_id,
    lastMessageText: r.last_message_text, lastMessageAt: r.last_message_at,
    lastMessageFrom: r.last_message_from, lastReadAt: r.last_read_at,
    unreadCount: r.unread_count || 0, archived: !!r.archived, avatar: r.avatar || null,
  }));
  return json({ items, total: items.length, scope, archived: wantArchived }, 200, request);
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
  const q = (url.searchParams.get("q") || "").trim();

  const where = ["chat_id = ?"];
  const params = [chatId];
  if (before > 0) { where.push("ts < ?"); params.push(before); }
  if (since > 0) { where.push("ts > ?"); params.push(since); }
  // q — поиск по всей истории чата (текст + подпись к медиа), не только по
  // загруженным сообщениям. Используется строкой поиска в окне переписки.
  if (q) { where.push("(text LIKE ? OR caption LIKE ?)"); params.push('%' + q + '%', '%' + q + '%'); }
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
    caption: r.caption, senderName: r.sender_name || null, ts: r.ts,
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

  // Активность WA-чатов по сделкам воронки. Джойн по contact_id (он
  // проиндексирован и в deals, и в wa_chats) — это O(сделки) с индексным
  // поиском, а не перебор 230k контактов.
  //
  // ВАЖНО (перф): раньше тут был `contacts.phones LIKE '%'||w.phone||'%'` —
  // он не использовал индексы и сканировал ВСЕ контакты на каждый опрос
  // канбана, что перегружало D1 ("D1 DB is overloaded"). Несколько сделок с
  // одним клиентом всё равно подсвечиваются: они ссылаются на один contact_id.
  const sql = `
    SELECT d.id AS deal_id,
           MAX(w.last_message_at) AS last_message_at,
           MAX(w.last_read_at) AS last_read_at,
           SUM(COALESCE(w.unread_count, 0)) AS unread_count,
           MAX(CASE WHEN w.last_message_from = 'them' THEN w.last_message_at ELSE 0 END) AS last_incoming_at
    FROM deals d
    INNER JOIN wa_chats w ON w.contact_id = d.contact_id AND w.contact_id IS NOT NULL
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

// POST /api/wa/mark-all-read { instanceId? }
// Обнуляет unread_count у всех чатов (или одного инстанса). Для тестов/чистки
// «непрочитанных», чтобы новые входящие были заметны. Стадии сделок не трогаем.
async function handleWaMarkAllRead(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  let body = {};
  try { body = await request.json(); } catch {}
  const instanceId = body.instanceId ? String(body.instanceId) : null;
  const now = Date.now();
  let res;
  if (instanceId) {
    res = await env.DB.prepare(
      "UPDATE wa_chats SET unread_count = 0, last_read_at = ?, updated_at = datetime('now') WHERE instance_id = ? AND COALESCE(unread_count, 0) > 0"
    ).bind(now, instanceId).run();
  } else {
    res = await env.DB.prepare(
      "UPDATE wa_chats SET unread_count = 0, last_read_at = ?, updated_at = datetime('now') WHERE COALESCE(unread_count, 0) > 0"
    ).bind(now).run();
  }
  return json({ ok: true, updated: res?.meta?.changes ?? null }, 200, request);
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

// POST /api/wa/channels/{id}/backfill-deals
// Создаёт сделки в воронке канала по УЖЕ накопленным 1:1 чатам этого инстанса.
// Нужно после привязки воронки к каналу, который раньше копил переписки без
// сделок (default_pipeline_id был пуст или указывал на другую воронку): новые
// входящие создают сделки сами через webhook, а старые чаты иначе бы потерялись.
// Идемпотентно: если по контакту/телефону в этой воронке сделка уже есть —
// не дублируем, только до-привязываем chat.contact_id/deal_id.
async function handleWaChannelBackfillDeals(request, env, channelId) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  const channel = await getWaChannel(env, channelId);
  if (!channel) return json({ error: "channel not found" }, 404, request);
  if (!channel.default_pipeline_id) {
    return json({ error: "у канала не задана воронка — сначала привяжите её" }, 400, request);
  }
  let chats = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, phone, name, contact_id, deal_id FROM wa_chats WHERE instance_id = ? AND COALESCE(is_group, 0) = 0"
    ).bind(channel.id_instance).all();
    chats = results || [];
  } catch (e) {
    return json({ error: "db error: " + e.message }, 500, request);
  }
  let created = 0, linked = 0, skipped = 0, failed = 0;
  for (const chat of chats) {
    try {
      if (!chat.phone) { skipped++; continue; }
      const phoneDigits = String(chat.phone).replace(/\D/g, '');
      let contactId = chat.contact_id;
      if (!contactId) contactId = await findOrCreateContactByPhone(env, chat.phone, chat.name);
      if (!contactId) { skipped++; continue; }
      // Дедуп: сделка в этой воронке по контакту ИЛИ по любому контакту с тем же номером.
      const existing = await env.DB.prepare(`
        SELECT id FROM deals
        WHERE pipeline_id = ?
          AND (contact_id = ? OR contact_id IN (SELECT id FROM contacts WHERE phones LIKE ?))
        ORDER BY (closed = 0) DESC, bitrix_date_modify DESC LIMIT 1
      `).bind(channel.default_pipeline_id, contactId, `%${phoneDigits}%`).first();
      let dealId;
      if (existing) {
        dealId = existing.id;
      } else {
        dealId = await ensureDealForWaContact(env, channel, contactId, chat.name, chat.phone);
        if (dealId) created++;
      }
      if (dealId && (chat.contact_id !== contactId || chat.deal_id !== dealId)) {
        await env.DB.prepare(
          "UPDATE wa_chats SET contact_id = COALESCE(contact_id, ?), deal_id = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(contactId, dealId, chat.id).run();
        linked++;
      }
    } catch (e) {
      failed++;
      console.warn('[wa-backfill] chat', chat.id, 'failed:', e?.message || e);
    }
  }
  await auditLog(env, guard.me, "wa_channel_backfill", "wa_channel", channelId, {
    pipelineId: channel.default_pipeline_id, totalChats: chats.length, created, linked, skipped, failed,
  });
  return json({ ok: true, totalChats: chats.length, created, linked, skipped, failed }, 200, request);
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

// ═══════════════════════════════════════════════════════════════════════════
// МОНИТОРИНГ СВЯЗИ КАНАЛОВ (channel health)
// Крон раз в минуту опрашивает Green-API getStateInstance у всех активных
// каналов клиентов (wa_channels) и системного нотификатора (wa_notifier).
// «Отвалился» = stateInstance ≠ 'authorized' или запрос упал. Чтобы не ловить
// краткие сбои — ставим down только после CONN_FAIL_THRESHOLD неудач подряд.
// На переходе up→down шлём web-push всем админам (один раз). Баннер во фронте
// читает состояние через /api/wa/channels/health (дёшево, из БД).
// ═══════════════════════════════════════════════════════════════════════════
const CONN_FAIL_THRESHOLD = 2;

let _channelConnColsEnsured = false;
async function ensureChannelConnColumns(env) {
  if (_channelConnColsEnsured) return;
  const alters = [
    "ALTER TABLE wa_channels ADD COLUMN conn_state TEXT",
    "ALTER TABLE wa_channels ADD COLUMN conn_raw TEXT",
    "ALTER TABLE wa_channels ADD COLUMN conn_checked_at TEXT",
    "ALTER TABLE wa_channels ADD COLUMN conn_down_since TEXT",
    "ALTER TABLE wa_channels ADD COLUMN conn_fail_count INTEGER DEFAULT 0",
    "ALTER TABLE wa_notifier ADD COLUMN conn_state TEXT",
    "ALTER TABLE wa_notifier ADD COLUMN conn_raw TEXT",
    "ALTER TABLE wa_notifier ADD COLUMN conn_checked_at TEXT",
    "ALTER TABLE wa_notifier ADD COLUMN conn_down_since TEXT",
    "ALTER TABLE wa_notifier ADD COLUMN conn_fail_count INTEGER DEFAULT 0",
  ];
  for (const sql of alters) {
    try { await env.DB.prepare(sql).run(); }
    catch (e) { if (!/duplicate column|already exists/i.test(String(e?.message || e))) console.warn('[migrate conn]', e?.message || e); }
  }
  _channelConnColsEnsured = true;
}

async function getAdminUids(env) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT u.uid FROM user_roles r JOIN users u ON u.uid = r.uid WHERE r.role = 'admin' AND u.active = 1`
    ).all();
    return (results || []).map(r => r.uid).filter(Boolean);
  } catch { return []; }
}

// Опрос состояния одного Green-API инстанса. Возвращает {up, raw}.
async function probeGreenApiState(apiUrl, idInstance, apiToken) {
  const base = apiUrl || 'https://api.green-api.com';
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 10000);
    let r;
    try {
      r = await fetch(`${base}/waInstance${idInstance}/getStateInstance/${apiToken}`, { signal: ctrl.signal });
    } finally { clearTimeout(to); }
    if (!r.ok) return { up: false, raw: `http_${r.status}` };
    const data = await r.json().catch(() => ({}));
    const state = String(data.stateInstance || data.state || '').trim();
    return { up: state === 'authorized', raw: state || 'unknown' };
  } catch (e) {
    return { up: false, raw: 'fetch_error' };
  }
}

async function checkChannelsHealth(env, ctx) {
  await ensureChannelConnColumns(env);
  const nowIso = new Date().toISOString();
  const newlyDown = [];
  const recovered = [];

  // 1) Клиентские каналы
  let channels = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, display_name, id_instance, api_url, api_token_instance, conn_state, conn_fail_count, conn_down_since FROM wa_channels WHERE active = 1"
    ).all();
    channels = results || [];
  } catch { channels = []; }

  for (const ch of channels) {
    if (!ch.id_instance || !ch.api_token_instance) continue;
    const probe = await probeGreenApiState(ch.api_url, ch.id_instance, ch.api_token_instance);
    const prevFail = ch.conn_fail_count || 0;
    const prevDown = ch.conn_state === 'down';
    const fail = probe.up ? 0 : prevFail + 1;
    const down = fail >= CONN_FAIL_THRESHOLD;
    const downSince = down ? (prevDown ? ch.conn_down_since : nowIso) : null;
    await env.DB.prepare(
      "UPDATE wa_channels SET conn_state = ?, conn_raw = ?, conn_checked_at = ?, conn_fail_count = ?, conn_down_since = ? WHERE id = ?"
    ).bind(down ? 'down' : 'up', probe.raw, nowIso, fail, downSince, ch.id).run();
    if (down && !prevDown) newlyDown.push(ch.display_name || ch.id_instance);
    if (!down && prevDown) recovered.push(ch.display_name || ch.id_instance);
  }

  // 2) Системный нотификатор (синглтон id=1)
  let notif = null;
  try {
    notif = await env.DB.prepare(
      "SELECT id_instance, api_url, api_token_instance, active, display_name, conn_state, conn_fail_count, conn_down_since FROM wa_notifier WHERE id = 1"
    ).first();
  } catch {}
  if (notif && notif.active && notif.id_instance && notif.api_token_instance) {
    const probe = await probeGreenApiState(notif.api_url, notif.id_instance, notif.api_token_instance);
    const prevFail = notif.conn_fail_count || 0;
    const prevDown = notif.conn_state === 'down';
    const fail = probe.up ? 0 : prevFail + 1;
    const down = fail >= CONN_FAIL_THRESHOLD;
    const downSince = down ? (prevDown ? notif.conn_down_since : nowIso) : null;
    await env.DB.prepare(
      "UPDATE wa_notifier SET conn_state = ?, conn_raw = ?, conn_checked_at = ?, conn_fail_count = ?, conn_down_since = ? WHERE id = 1"
    ).bind(down ? 'down' : 'up', probe.raw, nowIso, fail, downSince).run();
    if (down && !prevDown) newlyDown.push((notif.display_name || 'Системный нотификатор') + ' (системный)');
    if (!down && prevDown) recovered.push(notif.display_name || 'Системный нотификатор');
  }

  // Пуш «на каждое падение» УБРАН по просьбе: админов дёргало слишком часто.
  // Теперь — только состояние в БД (для Настройки → Каналы) + еженедельная
  // сводка (maybeWeeklyChannelDigest). newlyDown/recovered оставляем в возврате
  // для логов.
  return { checked: channels.length + (notif && notif.active ? 1 : 0), newlyDown: newlyDown.length, recovered: recovered.length };
}

// Раз в неделю: если есть отключённые WhatsApp-каналы — одно системное
// уведомление админам (web push). Гейт по kv-таймстампу, чтобы не чаще недели.
async function maybeWeeklyChannelDigest(env, ctx) {
  let last = 0;
  try {
    const row = await env.DB.prepare("SELECT v FROM kv WHERE k = 'channel_health:last_weekly'").first();
    if (row && row.v) { try { last = Date.parse(JSON.parse(row.v)); } catch { last = Date.parse(row.v) || 0; } }
  } catch {}
  const now = Date.now();
  if (last && (now - last) < 7 * 864e5) return { sent: false, reason: 'not_due' };

  // Собираем отключённые каналы из БД (без живых запросов — состояние уже
  // обновил checkChannelsHealth).
  const down = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT display_name, id_instance FROM wa_channels WHERE active = 1 AND conn_state = 'down'"
    ).all();
    for (const c of (results || [])) down.push(c.display_name || c.id_instance || 'канал');
  } catch {}
  try {
    const n = await env.DB.prepare("SELECT display_name, active, conn_state FROM wa_notifier WHERE id = 1").first();
    if (n && n.active && n.conn_state === 'down') down.push((n.display_name || 'Системный нотификатор') + ' (системный)');
  } catch {}

  // Таймстамп обновляем в любом случае — чтобы следующая сводка была не раньше
  // чем через неделю, даже если сейчас всё в порядке.
  try {
    await env.DB.prepare("INSERT INTO kv (k, v) VALUES ('channel_health:last_weekly', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v")
      .bind(JSON.stringify(new Date(now).toISOString())).run();
  } catch {}

  if (!down.length) return { sent: false, reason: 'all_ok' };

  const admins = await getAdminUids(env);
  const names = down.join(', ');
  const payload = {
    title: '⚠ Проверьте WhatsApp-каналы',
    body: `Не на связи: ${names}. Настройки → Каналы — переподключите (пересканируйте QR).`,
    url: '/team.html',
    tag: 'channel-weekly',
  };
  for (const uid of admins) {
    const job = pushToUserDevices(env, uid, payload);
    if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(job); else await job;
  }
  return { sent: true, down: down.length, admins: admins.length };
}

// GET /api/wa/channels/health — состояние связи каналов (из БД, без живых
// запросов к Green-API). Источник для баннера во фронте.
async function handleWaChannelsHealth(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureChannelConnColumns(env);
  let channels = [];
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, display_name, conn_state, conn_raw, conn_checked_at, conn_down_since FROM wa_channels WHERE active = 1"
    ).all();
    channels = (results || []).map(c => ({
      id: c.id, name: c.display_name || c.id,
      state: c.conn_state || 'unknown', raw: c.conn_raw || null,
      down: c.conn_state === 'down', downSince: c.conn_down_since || null,
      checkedAt: c.conn_checked_at || null,
    }));
  } catch {}
  let notifier = null;
  try {
    const n = await env.DB.prepare(
      "SELECT display_name, active, conn_state, conn_raw, conn_down_since, conn_checked_at FROM wa_notifier WHERE id = 1"
    ).first();
    if (n && n.active) notifier = {
      name: n.display_name || 'Системный нотификатор',
      state: n.conn_state || 'unknown', raw: n.conn_raw || null, down: n.conn_state === 'down',
      downSince: n.conn_down_since || null, checkedAt: n.conn_checked_at || null,
    };
  } catch {}
  const down = channels.filter(c => c.down);
  if (notifier && notifier.down) down.push({ id: 'notifier', name: notifier.name, raw: notifier.raw, down: true, downSince: notifier.downSince });
  return json({ ok: true, anyDown: down.length > 0, down, channels, notifier }, 200, request);
}

// ═══════════════════════════════════════════════════════════════════════════
// СИСТЕМНЫЙ WHATSAPP-ОПОВЕЩАТЕЛЬ (portal notifier)
// Отдельный Green-API инстанс, который рассылает сотрудникам в ЛИЧНЫЙ WhatsApp
// (users.phone) системные события портала: сообщения в чатах, звонки, задачи,
// приглашения, доступ к порталу. Конфиг — синглтон в wa_notifier (id=1).
// Отправка идёт мимо wa_chats/wa_messages, чтобы не засорять клиентский inbox.
// ═══════════════════════════════════════════════════════════════════════════

// Все типы событий + дефолтное состояние (вкл/выкл). UI рисует тумблеры по
// этому списку; фактическую рассылку по каждому хуку включаем постепенно.
const NOTIFIER_EVENTS = [
  { key: 'invite',        label: 'Приглашение нового сотрудника',        def: true },
  { key: 'access',        label: 'Повторная высылка доступа к порталу',  def: true },
  { key: 'chat_dm',       label: 'Личное сообщение в командном чате',     def: true },
  { key: 'chat_mention',  label: 'Упоминание (@) в чате',                 def: true },
  { key: 'chat_message',  label: 'Новое сообщение в канале',             def: false },
  { key: 'wa_incoming',   label: 'Новая переписка клиента (WhatsApp)',    def: true },
  { key: 'call_missed',   label: 'Пропущенный звонок',                    def: true },
  { key: 'call_incoming', label: 'Входящий звонок',                       def: false },
  { key: 'task_assigned', label: 'Назначена задача',                      def: true },
  { key: 'task_updated',  label: 'Изменения в задаче',                    def: false },
  { key: 'task_comment',  label: 'Комментарий к задаче',                  def: true },
  { key: 'deal_assigned', label: 'Назначена сделка',                      def: true },
  // feed_post (Лента) намеренно НЕ дублируется в WhatsApp — только in-app + web push.
  // Лента — это широковещалка, рассылка её в личный WhatsApp всем сотрудникам
  // выглядит как спам и грозит баном Green-API. См. NOTIF_TYPE_TO_EVENT ниже.
];
function notifierDefaultEvents() {
  const o = {};
  for (const e of NOTIFIER_EVENTS) o[e.key] = e.def;
  return o;
}

// Карта тип-уведомления (createNotification opts.type) → ключ события оповещателя.
// Любое уведомление, проходящее через createNotification, чей type есть в карте,
// автоматически дублируется в личный WhatsApp (с проверкой тумблера в sendNotify).
// Чат-сообщения (chat_dm/chat_message) идут отдельным путём через chat-module.
const NOTIF_TYPE_TO_EVENT = {
  wa_incoming:   'wa_incoming',
  // feed_post НЕ маппится → посты Ленты не уходят в WhatsApp (только in-app + push).
  call_missed:   'call_missed',
  call_incoming: 'call_incoming',
  task_assigned: 'task_assigned',
  task_updated:  'task_updated',
  task_comment:  'task_comment',
  deal_assigned: 'deal_assigned',
};
function safeJsonParse(s, fallback) {
  if (s == null) return fallback;
  if (typeof s === 'object') return s;
  try { return JSON.parse(s); } catch { return fallback; }
}

// Возвращает рабочий конфиг отправителя системных уведомлений. Предпочитает
// активный wa_notifier; если он не настроен — откатывается на первый активный
// wa_channel (чтобы приглашения/доступ уходили ещё до подключения оповещателя).
async function getNotifierConfig(env) {
  let n = null;
  try { n = await env.DB.prepare("SELECT * FROM wa_notifier WHERE id = 1").first(); } catch {}
  if (n && n.active && n.id_instance && n.api_token_instance) {
    return {
      source: 'notifier',
      api_url: n.api_url || 'https://api.green-api.com',
      id_instance: n.id_instance,
      api_token_instance: n.api_token_instance,
      events: safeJsonParse(n.events_json, null) || notifierDefaultEvents(),
      portal_url: n.portal_url || 'https://pllato.kz/team.html',
      display_name: n.display_name || 'Портал-оповещатель',
    };
  }
  let ch = null;
  try { ch = await env.DB.prepare("SELECT * FROM wa_channels WHERE active = 1 ORDER BY created_at ASC LIMIT 1").first(); } catch {}
  if (ch) {
    return {
      source: 'channel',
      api_url: ch.api_url || 'https://api.green-api.com',
      id_instance: ch.id_instance,
      api_token_instance: ch.api_token_instance,
      events: notifierDefaultEvents(),
      portal_url: 'https://pllato.kz/team.html',
      display_name: ch.display_name || 'WhatsApp',
    };
  }
  return null;
}

// Низкоуровневая отправка через Green-API. НЕ пишет в wa_chats/wa_messages.
async function deliverNotifierRaw(cfg, phone, text) {
  const chatId = waChatIdFromPhone(phone);
  const url = `${cfg.api_url}/waInstance${cfg.id_instance}/sendMessage/${cfg.api_token_instance}`;
  const r = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message: text }),
  });
  const data = await r.json().catch(() => null);
  if (!data || !data.idMessage) throw new Error('green-api: ' + JSON.stringify(data).slice(0, 200));
  return data.idMessage;
}

async function logNotify(env, row) {
  try {
    await env.DB.prepare(
      `INSERT INTO notify_log (uid, phone, event, text, link, status, error, wa_message_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      row.uid || null, row.phone || null, row.event || null,
      (row.text || '').slice(0, 500), row.link || null,
      row.status, row.error || null, row.wa_message_id || null,
    ).run();
  } catch {}
  return { ok: row.status === 'sent', status: row.status, error: row.error || null, wa_message_id: row.wa_message_id || null };
}

// Высокоуровневый хелпер: уведомить сотрудника (по uid или phone) с учётом
// тумблера события. Никогда не бросает — всё пишется в notify_log.
async function sendNotify(env, { uid, phone, event, text, link }) {
  try {
    const cfg = await getNotifierConfig(env);
    if (!cfg) return logNotify(env, { uid, phone, event, text, link, status: 'skipped', error: 'no_notifier' });
    if (event && cfg.events && cfg.events[event] === false) {
      return logNotify(env, { uid, phone, event, text, link, status: 'skipped', error: 'event_off' });
    }
    let targetPhones = [];        // все номера получателя (1..N)
    let targetUid = uid || null;
    let firstName = null;
    if (phone) {
      // Явно переданный номер — приоритет (не лезем в БД).
      const n = normalizePhoneKZ(phone);
      targetPhones = n ? [n] : [String(phone)];
    } else if (uid) {
      await ensureUserPhonesColumn(env);
      const u = await env.DB.prepare("SELECT phone, phones, active, name FROM users WHERE uid = ?").bind(uid).first();
      if (!u) return logNotify(env, { uid, phone: null, event, text, link, status: 'skipped', error: 'no_user' });
      if (u.active === 0) return logNotify(env, { uid, phone: u.phone, event, text, link, status: 'skipped', error: 'inactive' });
      targetPhones = userPhoneList(u);                 // ← все телефоны сотрудника
      firstName = (u.name || '').trim().split(/\s+/)[0] || null;
    }
    if (!targetPhones.length) return logNotify(env, { uid: targetUid, phone: null, event, text, link, status: 'skipped', error: 'no_phone' });
    // Персонализация (анти-бан Green-API): обращение по имени делает каждое
    // сообщение уникальным, даже если событие рассылается нескольким получателям
    // с одинаковым текстом. Идентичные массовые сообщения = спам-паттерн → бан.
    const greeting = firstName ? `${firstName},\n` : '';
    const body = greeting + text;
    const full = link ? `${body}\n\n${link}` : body;
    // Шлём на ВСЕ номера сотрудника, логируем каждый отдельно.
    let lastLog = null;
    for (const tp of targetPhones) {
      try {
        const idMessage = await deliverNotifierRaw(cfg, tp, full);
        lastLog = await logNotify(env, { uid: targetUid, phone: tp, event, text, link, status: 'sent', wa_message_id: idMessage });
      } catch (e) {
        lastLog = await logNotify(env, { uid: targetUid, phone: tp, event, text, link, status: 'failed', error: String(e && e.message || e) });
      }
    }
    return lastLog;
  } catch (e) {
    return logNotify(env, { uid: uid || null, phone: phone || null, event, text, link, status: 'failed', error: String(e && e.message || e) });
  }
}

// Внедряем sendNotify в chat-module (чат-сообщения дублируются в WhatsApp).
// Делается через сеттер, чтобы не плодить циклический импорт между модулями.
try { setWaNotifier(sendNotify); } catch {}

// GET /api/notifier — конфиг (токен замаскирован).
async function handleNotifierGet(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  let n = null;
  try { n = await env.DB.prepare("SELECT * FROM wa_notifier WHERE id = 1").first(); } catch (e) {
    return json({ error: "notifier table missing — примените миграцию", detail: e.message }, 500, request);
  }
  return json({
    ok: true,
    events: NOTIFIER_EVENTS,
    defaultEvents: notifierDefaultEvents(),
    notifier: n ? {
      idInstance: n.id_instance || '',
      apiUrl: n.api_url || 'https://api.green-api.com',
      displayName: n.display_name || 'Портал-оповещатель',
      active: !!n.active,
      hasToken: !!n.api_token_instance,
      events: safeJsonParse(n.events_json, null) || notifierDefaultEvents(),
      portalUrl: n.portal_url || 'https://pllato.kz/team.html',
      updatedAt: n.updated_at || null,
    } : null,
  }, 200, request);
}

// PUT /api/notifier — сохранить конфиг (upsert id=1). Токен перезаписываем
// только если прислан непустой (чтобы не затереть существующий маской).
async function handleNotifierSave(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }

  const idInstance = body.idInstance != null ? String(body.idInstance).trim() : undefined;
  const apiToken = body.apiTokenInstance != null ? String(body.apiTokenInstance).trim() : '';
  const apiUrl = body.apiUrl != null ? String(body.apiUrl).trim() : undefined;
  const displayName = body.displayName != null ? String(body.displayName).trim() : undefined;
  const portalUrl = body.portalUrl != null ? String(body.portalUrl).trim() : undefined;
  const active = body.active === true ? 1 : (body.active === false ? 0 : undefined);
  let eventsJson;
  if (body.events && typeof body.events === 'object') {
    const merged = notifierDefaultEvents();
    for (const e of NOTIFIER_EVENTS) if (e.key in body.events) merged[e.key] = !!body.events[e.key];
    eventsJson = JSON.stringify(merged);
  }

  const existing = await env.DB.prepare("SELECT id FROM wa_notifier WHERE id = 1").first();
  if (!existing) {
    await env.DB.prepare(
      `INSERT INTO wa_notifier (id, id_instance, api_url, api_token_instance, display_name, active, events_json, portal_url, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      idInstance || null,
      apiUrl || 'https://api.green-api.com',
      apiToken || null,
      displayName || 'Портал-оповещатель',
      active != null ? active : 0,
      eventsJson || JSON.stringify(notifierDefaultEvents()),
      portalUrl || 'https://pllato.kz/team.html',
    ).run();
  } else {
    const sets = [], params = [];
    if (idInstance !== undefined) { sets.push("id_instance = ?"); params.push(idInstance || null); }
    if (apiUrl !== undefined) { sets.push("api_url = ?"); params.push(apiUrl || 'https://api.green-api.com'); }
    if (apiToken) { sets.push("api_token_instance = ?"); params.push(apiToken); }  // только непустой
    if (displayName !== undefined) { sets.push("display_name = ?"); params.push(displayName || 'Портал-оповещатель'); }
    if (active !== undefined) { sets.push("active = ?"); params.push(active); }
    if (eventsJson !== undefined) { sets.push("events_json = ?"); params.push(eventsJson); }
    if (portalUrl !== undefined) { sets.push("portal_url = ?"); params.push(portalUrl || 'https://pllato.kz/team.html'); }
    sets.push("updated_at = datetime('now')");
    await env.DB.prepare(`UPDATE wa_notifier SET ${sets.join(", ")} WHERE id = 1`).bind(...params).run();
  }
  await auditLog(env, guard.me, "notifier_save", "wa_notifier", "1", {
    idInstance, tokenChanged: !!apiToken, active, eventsChanged: eventsJson !== undefined,
  });
  return json({ ok: true }, 200, request);
}

// Резолвит конфиг ТОЛЬКО notifier-инстанса (без fallback на wa_channels) —
// для state/qr/test, которые относятся именно к оповещателю.
async function getNotifierRow(env) {
  try { return await env.DB.prepare("SELECT * FROM wa_notifier WHERE id = 1").first(); } catch { return null; }
}

// GET /api/notifier/state — статус авторизации инстанса в Green-API.
async function handleNotifierState(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  const n = await getNotifierRow(env);
  if (!n || !n.id_instance || !n.api_token_instance) return json({ error: "notifier not configured" }, 400, request);
  try {
    const r = await fetch(`${n.api_url || 'https://api.green-api.com'}/waInstance${n.id_instance}/getStateInstance/${n.api_token_instance}`);
    const data = await r.json().catch(() => ({}));
    return json({ ok: true, ...data }, 200, request);
  } catch (e) {
    return json({ error: "green-api fetch failed: " + e.message }, 502, request);
  }
}

// GET /api/notifier/qr — QR для привязки телефона-оповещателя.
async function handleNotifierQr(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  const n = await getNotifierRow(env);
  if (!n || !n.id_instance || !n.api_token_instance) return json({ error: "notifier not configured" }, 400, request);
  try {
    const r = await fetch(`${n.api_url || 'https://api.green-api.com'}/waInstance${n.id_instance}/qr/${n.api_token_instance}`);
    const data = await r.json().catch(() => ({}));
    return json({ ok: true, ...data }, 200, request);
  } catch (e) {
    return json({ error: "green-api fetch failed: " + e.message }, 502, request);
  }
}

// POST /api/notifier/test { phone? } — тестовое сообщение (по умолчанию себе).
async function handleNotifierTest(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  let body = {};
  try { body = await request.json(); } catch {}
  let phone = body.phone ? String(body.phone).replace(/\D/g, '') : '';
  if (!phone) {
    const me = await env.DB.prepare("SELECT phone FROM users WHERE uid = ?").bind(guard.me.uid).first();
    phone = me && me.phone ? String(me.phone).replace(/\D/g, '') : '';
  }
  if (!phone) return json({ error: "укажите номер или заполните свой телефон в профиле" }, 400, request);
  const cfg = await getNotifierConfig(env);
  if (!cfg) return json({ error: "оповещатель не настроен" }, 400, request);
  try {
    const id = await deliverNotifierRaw(cfg, phone, '✅ Тест портального оповещателя pllato.kz\n\nЕсли вы видите это сообщение — системные уведомления настроены и работают.');
    await logNotify(env, { uid: guard.me.uid, phone, event: 'test', text: 'test', status: 'sent', wa_message_id: id });
    return json({ ok: true, idMessage: id, phone, via: cfg.source }, 200, request);
  } catch (e) {
    await logNotify(env, { uid: guard.me.uid, phone, event: 'test', text: 'test', status: 'failed', error: e.message });
    return json({ error: "green-api send failed: " + e.message }, 502, request);
  }
}

// POST /api/notifier/access { uid } — повторно выслать сотруднику доступ к
// порталу (ссылка + email для входа через Google) в личный WhatsApp.
async function handleNotifierAccess(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const uid = String(body.uid || '').trim();
  if (!uid) return json({ error: "uid required" }, 400, request);
  const u = await env.DB.prepare("SELECT uid, name, last_name, email, phone FROM users WHERE uid = ?").bind(uid).first();
  if (!u) return json({ error: "user not found" }, 404, request);
  if (!u.phone) return json({ error: "у сотрудника не указан личный телефон" }, 400, request);
  const cfg = await getNotifierConfig(env);
  if (!cfg) return json({ error: "оповещатель не настроен" }, 400, request);
  const portal = cfg.portal_url || 'https://pllato.kz/team.html';
  const fname = (u.name || '').trim() || 'коллега';
  const text = `🔑 Доступ к порталу pllato.kz\n\nЗдравствуйте, ${fname}!\n\nВход в портал — по ссылке ниже. Авторизуйтесь через Google${u.email ? ` под почтой ${u.email}` : ''}.\n\n${portal}`;
  try {
    const id = await deliverNotifierRaw(cfg, String(u.phone).replace(/\D/g, ''), text);
    await logNotify(env, { uid, phone: u.phone, event: 'access', text: 'portal access', link: portal, status: 'sent', wa_message_id: id });
    await auditLog(env, guard.me, "notifier_access_sent", "user", uid, { phone: u.phone });
    return json({ ok: true, idMessage: id }, 200, request);
  } catch (e) {
    await logNotify(env, { uid, phone: u.phone, event: 'access', text: 'portal access', status: 'failed', error: e.message });
    return json({ error: "green-api send failed: " + e.message }, 502, request);
  }
}

// GET /api/notifier/log?limit=50 — последние отправки (диагностика).
async function handleNotifierLog(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);
  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
  let rows = [];
  try {
    const r = await env.DB.prepare(
      "SELECT uid, phone, event, status, error, wa_message_id, created_at FROM notify_log ORDER BY id DESC LIMIT ?"
    ).bind(limit).all();
    rows = r.results || [];
  } catch {}
  return json({ ok: true, items: rows }, 200, request);
}

// POST /api/wa/sync-groups { channelId? }
// Подтягиваем список WhatsApp-групп напрямую из Green-API (getContacts) и
// заводим/обновляем их в wa_chats. Нужно чтобы группа появилась в портале
// БЕЗ ожидания первого сообщения (вебхук приходит только при активности).
async function handleWaSyncGroups(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);

  let body = {};
  try { body = await request.json(); } catch {}
  const channelId = body.channelId || null;

  let channels;
  if (channelId) {
    const ch = await getWaChannel(env, channelId);
    if (!ch) return json({ error: "channel not found" }, 404, request);
    channels = [ch];
  } else {
    const { results } = await env.DB.prepare(
      "SELECT * FROM wa_channels WHERE active = 1 ORDER BY created_at ASC"
    ).all();
    channels = results || [];
  }
  if (!channels.length) return json({ error: "no active WhatsApp channel configured" }, 503, request);

  let created = 0, updated = 0, totalGroups = 0;
  const errors = [];
  for (const channel of channels) {
    try {
      const r = await fetch(`${channel.api_url}/waInstance${channel.id_instance}/getContacts/${channel.api_token_instance}`);
      if (!r.ok) { errors.push(`channel ${channel.id_instance}: HTTP ${r.status}`); continue; }
      const contacts = await r.json().catch(() => []);
      if (!Array.isArray(contacts)) { errors.push(`channel ${channel.id_instance}: bad response`); continue; }

      const groups = contacts.filter(c => c && typeof c.id === 'string' && c.id.endsWith('@g.us'));
      totalGroups += groups.length;

      for (const g of groups) {
        const chatId = g.id;
        const groupName = (g.name || g.contactName || '').trim() || 'Группа';
        const chatDocId = waChatDocId(channel.id_instance, chatId);
        const existing = await env.DB.prepare("SELECT id, name FROM wa_chats WHERE id = ?").bind(chatDocId).first();
        if (existing) {
          // Обновляем только имя (last_message_at не трогаем — там реальная активность)
          await env.DB.prepare(
            "UPDATE wa_chats SET name = ?, is_group = 1, updated_at = datetime('now') WHERE id = ?"
          ).bind(groupName, chatDocId).run();
          updated++;
        } else {
          // Новая группа: ставим last_message_at = now, чтобы сразу была видна вверху списка
          await env.DB.prepare(`
            INSERT INTO wa_chats (id, instance_id, chat_id, phone, is_group, name, last_message_text, last_message_at, last_message_from, updated_at)
            VALUES (?, ?, ?, NULL, 1, ?, '', ?, NULL, datetime('now'))
          `).bind(chatDocId, channel.id_instance, chatId, groupName, Date.now()).run();
          created++;
        }
      }
    } catch (e) {
      errors.push(`channel ${channel.id_instance}: ${e.message}`);
    }
  }

  await auditLog(env, me, "wa_sync_groups", "wa_channel", channelId || 'all', { created, updated, totalGroups });
  return json({ ok: true, created, updated, totalGroups, errors }, 200, request);
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

// ── GET /api/admin/diag/orgperms?email=...|uid=... ──────────────────────
// Диагностика «почему сотрудник видит не то, что ожидаешь».
// Read-only, admin-only. Показывает ЭФФЕКТИВНЫЕ права, как их видит worker:
//   • в каких узлах структуры найден юзер (по всем его uid-алиасам)
//   • итоговый dealScope / доступ к воронкам
//   • дубли учёток с тем же email (частая причина mismatch после миграции)
async function handleAdminDiagOrgPerms(request, env) {
  const guard = await requireAdmin(request, env);
  if (guard.error) return json({ error: guard.error }, guard.status, request);

  const url = new URL(request.url);
  const email = (url.searchParams.get('email') || '').toLowerCase().trim();
  let uid = url.searchParams.get('uid') || null;

  // Резолвим по email все учётки (могут быть дубли) → канон + алиасы
  let userRows = [];
  if (email) {
    const r = await env.DB.prepare(
      "SELECT uid, email, name, last_name FROM users WHERE LOWER(email) = ?"
    ).bind(email).all();
    userRows = r.results || [];
    if (userRows[0]) uid = userRows[0].uid;
  } else if (uid) {
    const u = await env.DB.prepare(
      "SELECT uid, email, name, last_name FROM users WHERE uid = ? LIMIT 1"
    ).bind(uid).first();
    if (u) userRows = [u];
  }
  if (!uid) return json({ error: "pass ?email= or ?uid=" }, 400, request);

  const matchUids = new Set();
  if (uid) matchUids.add(uid);
  for (const r of userRows) if (r.uid) matchUids.add(r.uid);

  const perms = await resolveOrgPermissions(env, uid, matchUids);

  // Где в структуре встречается любой из uid юзера
  let structure = null;
  try {
    const row = await env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind('org:structure').first();
    if (row?.v) structure = JSON.parse(row.v);
  } catch {}
  const foundInStructure = [];
  const allStructUids = new Set();
  if (structure) {
    if (structure.director?.uid) {
      allStructUids.add(structure.director.uid);
      if (matchUids.has(structure.director.uid)) foundInStructure.push({ path: 'director', name: 'Директор', as: 'director', perms: null });
    }
    const walk = (node, path) => {
      const nm = node.name || node.title || '(без имени)';
      if (node.headUid) {
        allStructUids.add(node.headUid);
        if (matchUids.has(node.headUid)) foundInStructure.push({ path, name: nm, as: 'head', perms: node.permissions || null });
      }
      for (const m of (node.memberUids || [])) {
        if (m) allStructUids.add(m);
        if (matchUids.has(m)) foundInStructure.push({ path, name: nm, as: 'member', perms: node.permissions || null });
      }
      const ch = node.subDepartments || node.departments || [];
      ch.forEach((c, i) => walk(c, path + ' > ' + (c.name || c.title || ('#' + i))));
    };
    (structure.branches || []).forEach((b, i) => walk(b, b.name || ('branch#' + i)));
  }

  // Дубли учёток с тем же email, но другим uid (типичная причина mismatch)
  let duplicateAccounts = [];
  if (email && userRows.length > 1) {
    duplicateAccounts = userRows.map(r => r.uid);
  }

  // Структурные uid'ы, которых нет в таблице users (осиротевшие / неверный формат)
  let orphanUidsInStructure = [];
  if (allStructUids.size) {
    const list = [...allStructUids];
    const ph = list.map(() => '?').join(',');
    const known = await env.DB.prepare(`SELECT uid FROM users WHERE uid IN (${ph})`).bind(...list).all();
    const knownSet = new Set((known.results || []).map(r => r.uid));
    orphanUidsInStructure = list.filter(u => !knownSet.has(u));
  }

  // Человекочитаемый вывод
  let diagnosis;
  if (perms.isDirector) {
    diagnosis = 'Юзер — Директор: видит всё.';
  } else if (foundInStructure.length === 0) {
    diagnosis = duplicateAccounts.length
      ? `НЕ найден в структуре под каноническим uid. Есть дубли учёток с этим email (${duplicateAccounts.join(', ')}) — вероятно, в структуру добавлен под другим uid. Передеплоенный worker теперь матчит по всем uid — проверь, исчезла ли проблема. Если нет — пере-добавь сотрудника в узел заново.`
      : 'НЕ найден ни в одном узле структуры под своими uid → права откатились на «только свои». Добавь его в нужный узел в Структуре.';
  } else {
    const scopeRu = { all: 'Все сделки', team: 'Свой отдел', own: 'Только свои' }[perms.dealScope] || perms.dealScope;
    diagnosis = `Найден в ${foundInStructure.length} узл(е/ах). Итоговая видимость: «${scopeRu}», воронки: ${perms.pipelineIds === null ? 'все' : perms.pipelineIds.length + ' шт'}.` +
      (perms.dealScope !== 'all' ? ' Если ожидаешь «Все сделки» — выставь dealScope=all именно на узле, где он состоит (права родителя вниз НЕ наследуются).' : '');
  }

  return json({
    ok: true,
    input: { email: email || null, uid },
    user: userRows[0] ? { uid: userRows[0].uid, email: userRows[0].email, name: [userRows[0].last_name, userRows[0].name].filter(Boolean).join(' ') } : null,
    matchUids: [...matchUids],
    resolvedPerms: {
      isDirector: perms.isDirector,
      hasAnyNode: perms.hasAnyNode,
      dealScope: perms.dealScope,
      pipelineIds: perms.pipelineIds,
      teamSize: perms.teamUids ? perms.teamUids.size : 0,
    },
    foundInStructure,
    duplicateAccounts,
    orphanUidsInStructure,
    structureUidCount: allStructUids.size,
    diagnosis,
  }, 200, request);
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

// ── Аватар сотрудника (self-service) ──────────────────────────
// POST /api/me/avatar (auth, raw image body) — сохраняет фото в R2 и
// проставляет users.photo / photo_url ВСЕМ строкам с email юзера (на случай
// дублей после миграции). Возвращает публичный URL. Картинка уже ужата на
// клиенте до ~256px, поэтому лимит небольшой.
// Serve — через тот же /api/avatar/{key} (без auth, чтобы <img> грузился).
async function handleMyAvatarUpload(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  if (!env.FILES) return json({ error: "R2 binding FILES not configured" }, 500, request);

  const me = await resolveCanonicalUser(env, auth.claims);
  const email = (me.email || '').toLowerCase().trim();
  if (!email || !me.userRecord) {
    return json({ error: "Твой аккаунт не привязан к сотруднику" }, 403, request);
  }

  const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
  if (!/^image\//i.test(contentType)) {
    return json({ error: "Нужен файл-изображение" }, 400, request);
  }
  const body = await request.arrayBuffer();
  if (body.byteLength === 0) return json({ error: "Пустой файл" }, 400, request);
  if (body.byteLength > 3 * 1024 * 1024) {
    return json({ error: "Файл слишком большой (макс 3 МБ)" }, 413, request);
  }

  const ext = contentType.includes('png') ? 'png'
    : contentType.includes('webp') ? 'webp'
    : contentType.includes('gif') ? 'gif' : 'jpg';
  const rand = Math.random().toString(36).slice(2, 8);
  const safeUid = String(me.userRecord.uid).replace(/[^\w.\-]/g, '_').slice(0, 64);
  const r2Key = `avatars/${safeUid}-${rand}.${ext}`;
  await env.FILES.put(r2Key, body, {
    httpMetadata: { contentType },
    customMetadata: { uploadedBy: email, kind: 'avatar' },
  });

  const url = new URL(request.url);
  const publicUrl = `${url.origin}/api/avatar/${encodeURIComponent(r2Key)}`;

  // Проставляем фото ВСЕМ строкам с этим email (канон + дубли) — чтобы аватар
  // показывался под любым uid, под которым юзер попал в данные/структуру.
  await env.DB.prepare(
    "UPDATE users SET photo = ?, photo_url = ? WHERE LOWER(email) = ?"
  ).bind(publicUrl, publicUrl, email).run();

  return json({ ok: true, url: publicUrl, uid: me.userRecord.uid }, 200, request);
}

// ── Профиль сотрудника ───────────────────────────────────────────────
// Карточка сотрудника: контакты + отдел + руководитель (из оргструктуры) +
// «примечание» (bio), которое сотрудник правит сам. Фото — через /api/me/avatar.
let _usersBioColEnsured = false;
async function ensureUsersBioColumn(env) {
  if (_usersBioColEnsured) return;
  try { await env.DB.prepare("ALTER TABLE users ADD COLUMN bio TEXT").run(); }
  catch (e) { /* колонка уже есть — ок */ }
  _usersBioColEnsured = true;
}

// Найти в оргструктуре отдел и руководителя сотрудника.
// Структура: { director:{uid}, branches:[ {name,headUid,memberUids[],departments:[
//   {name,headUid,memberUids[],subDepartments:[…]} ]} ] }. Руководитель = headUid
// узла, в memberUids которого состоит uid; если uid сам глава узла — берём главу
// родителя (выше по дереву), на верхнем уровне — директора.
function resolveOrgPlacement(structure, uid) {
  if (!structure || !uid) return { departmentName: null, managerUid: null };
  const directorUid = structure.director && structure.director.uid || null;
  if (uid === directorUid) return { departmentName: 'Дирекция', managerUid: null };
  function visit(node, parentHeadUid, parentName) {
    const members = node.memberUids || [];
    if (node.headUid === uid) {
      return { departmentName: node.name || parentName || null, managerUid: parentHeadUid || directorUid || null };
    }
    if (members.includes(uid)) {
      return { departmentName: node.name || null, managerUid: node.headUid || parentHeadUid || directorUid || null };
    }
    const children = node.departments || node.subDepartments || [];
    for (const ch of children) {
      const r = visit(ch, node.headUid || parentHeadUid, node.name || parentName);
      if (r) return r;
    }
    return null;
  }
  for (const br of (structure.branches || [])) {
    const r = visit(br, directorUid, null);
    if (r) return r;
  }
  return { departmentName: null, managerUid: null };
}

// GET /api/users/{uid}/profile — карточка сотрудника (любому авторизованному).
async function handleUserProfileGet(request, env, uid) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  await ensureUsersBioColumn(env);
  const u = await env.DB.prepare(
    "SELECT uid, email, name, last_name, position, phone, phones, photo, photo_url, bio, active FROM users WHERE uid = ? LIMIT 1"
  ).bind(uid).first();
  if (!u) return json({ error: "user not found" }, 404, request);

  let departmentName = null, managerUid = null, managerName = null;
  try {
    const row = await env.DB.prepare("SELECT v FROM kv WHERE k = 'org:structure'").first();
    if (row?.v) {
      const pl = resolveOrgPlacement(JSON.parse(row.v), uid);
      departmentName = pl.departmentName; managerUid = pl.managerUid;
    }
  } catch {}
  if (managerUid) {
    const m = await env.DB.prepare("SELECT name, last_name FROM users WHERE uid = ? LIMIT 1").bind(managerUid).first();
    if (m) managerName = [m.name, m.last_name].filter(Boolean).join(' ').trim() || null;
  }
  let phones = [];
  try { phones = u.phones ? JSON.parse(u.phones) : []; } catch { phones = []; }
  if (!phones.length && u.phone) phones = [u.phone];

  return json({
    ok: true,
    profile: {
      uid: u.uid, name: u.name, lastName: u.last_name, position: u.position,
      email: u.email, phones, photoUrl: u.photo_url || u.photo || null,
      department: departmentName, managerUid, managerName,
      bio: u.bio || '', active: !!u.active,
    },
    canEdit: me.canonicalUid === uid || me.role === 'admin',
    isSelf: me.canonicalUid === uid,
  }, 200, request);
}

// PUT /api/users/{uid}/profile { bio } — правка примечания (сам сотрудник/admin).
async function handleUserProfilePut(request, env, uid) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  if (me.canonicalUid !== uid && me.role !== 'admin') {
    return json({ error: "можно редактировать только свой профиль" }, 403, request);
  }
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  await ensureUsersBioColumn(env);
  if (typeof body.bio === 'string') {
    await env.DB.prepare("UPDATE users SET bio = ? WHERE uid = ?").bind(body.bio.slice(0, 4000), uid).run();
  }
  // Имя и фамилию может менять администратор ИЛИ сам сотрудник (свой профиль).
  if (me.role === 'admin' || me.canonicalUid === uid) {
    const before = await env.DB.prepare("SELECT name, last_name FROM users WHERE uid = ?").bind(uid).first();
    let changed = false; const upd = {};
    if (typeof body.name === 'string') { upd.name = body.name.trim().slice(0, 120); changed = true; }
    if (typeof body.lastName === 'string') { upd.last_name = body.lastName.trim().slice(0, 120); changed = true; }
    if (changed) {
      const sets = Object.keys(upd).map(k => `${k} = ?`).join(', ');
      await env.DB.prepare(`UPDATE users SET ${sets} WHERE uid = ?`).bind(...Object.values(upd), uid).run();
      try { await auditLog(env, me, "user_rename", "user", uid, { old: before, new: upd }); } catch {}
    }
  }
  return json({ ok: true }, 200, request);
}

// ── Лента (корпоративный фид, как в Битрикс24) ───────────────
// Посты + комментарии + лайки. Аудитория: audience_uids NULL = всем;
// иначе JSON-массив uid (автор всегда включён). admin видит всё.
function genFeedId(prefix) {
  return (prefix || 'fp_') + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function feedNormalizeAttachments(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 20).map(a => ({
    url: String(a.url || ''),
    name: String(a.name || 'file'),
    contentType: String(a.contentType || ''),
    size: (typeof a.size === 'number') ? a.size : null,
    kind: String(a.kind || ''),
  })).filter(a => a.url);
}

function feedSafeJson(str, fallback) {
  if (str == null) return fallback;
  try { const v = JSON.parse(str); return v == null ? fallback : v; } catch { return fallback; }
}

function feedPostToCamel(r) {
  return {
    id: r.id,
    authorUid: r.author_uid,
    text: r.text,
    attachments: feedSafeJson(r.attachments, []),
    audience: feedSafeJson(r.audience, null),
    audienceUids: r.audience_uids ? feedSafeJson(r.audience_uids, null) : null,
    pinned: !!r.pinned,
    commentCount: r.comment_count || 0,
    likeCount: r.like_count || 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function feedCommentToCamel(r) {
  return {
    id: r.id,
    postId: r.post_id,
    authorUid: r.author_uid,
    text: r.text,
    attachments: feedSafeJson(r.attachments, []),
    createdAt: r.created_at,
  };
}

// Загрузить пост и проверить видимость для текущего юзера.
async function feedLoadVisiblePost(env, me, postId) {
  const row = await env.DB.prepare("SELECT * FROM feed_posts WHERE id = ? AND deleted_at IS NULL").bind(postId).first();
  if (!row) return { error: "not found", status: 404 };
  const myUid = me.canonicalUid || me.firebaseUid;
  if (me.role !== 'admin' && row.author_uid !== myUid && row.audience_uids) {
    const uids = feedSafeJson(row.audience_uids, []);
    if (!Array.isArray(uids) || !uids.includes(myUid)) return { error: "forbidden", status: 403 };
  }
  return { row, myUid };
}

// POST /api/feed/posts { text, attachments[], audience{users,nodes}, audienceUids[] }
async function handleFeedCreate(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const text = (body.text || '').trim();
  const attachments = feedNormalizeAttachments(body.attachments);
  if (!text && attachments.length === 0) return json({ error: "text or attachments required" }, 400, request);

  const authorUid = me.canonicalUid || me.firebaseUid;
  const audienceRaw = (body.audience && typeof body.audience === 'object') ? body.audience : null;
  let audienceUids = Array.isArray(body.audienceUids) ? body.audienceUids.filter(Boolean).map(String) : [];
  audienceUids = Array.from(new Set(audienceUids));
  let audienceUidsJson = null;
  if (audienceUids.length) {
    if (!audienceUids.includes(authorUid)) audienceUids.push(authorUid);
    audienceUidsJson = JSON.stringify(audienceUids);
  }

  const id = genFeedId('fp_');
  const now = Date.now();
  await env.DB.prepare(`
    INSERT INTO feed_posts (id, author_uid, text, attachments, audience, audience_uids, pinned, comment_count, like_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?)
  `).bind(
    id, authorUid, text || null,
    attachments.length ? JSON.stringify(attachments) : null,
    audienceRaw ? JSON.stringify(audienceRaw) : null,
    audienceUidsJson, now
  ).run();

  await auditLog(env, me, "feed_post_create", "feed_post", id, { hasMedia: attachments.length > 0, targeted: !!audienceUidsJson });

  // Уведомить аудиторию о новом посте (адресно или всех активных, кроме автора).
  try {
    let recipients;
    if (audienceUids.length) {
      recipients = audienceUids;
    } else {
      const { results } = await env.DB.prepare(
        "SELECT uid FROM users WHERE uid IS NOT NULL AND COALESCE(active,1) = 1"
      ).all();
      recipients = (results || []).map(u => u.uid);
    }
    await createNotificationFor(env, recipients, {
      type: 'feed_post', actorUid: authorUid,
      title: notifActorName(me) + ' опубликовал пост в Ленте',
      body: (text || '[вложение]').slice(0, 160),
      link: '/team.html?page=feed', icon: '📰',
      entityType: 'feed_post', entityId: id,
    });
  } catch (e) { console.warn('[notif] feed post failed:', e && e.message); }

  const row = await env.DB.prepare("SELECT * FROM feed_posts WHERE id = ?").bind(id).first();
  return json({ ok: true, post: feedPostToCamel(row) }, 200, request);
}

// GET /api/feed/posts?limit=&before=  — лента видимых постов
async function handleFeedList(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const myUid = me.canonicalUid || me.firebaseUid;

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "30", 10) || 30, 100);
  const before = parseInt(url.searchParams.get("before") || "0", 10) || 0;

  const where = ["deleted_at IS NULL"];
  const params = [];
  if (before) { where.push("created_at < ?"); params.push(before); }
  if (me.role !== 'admin') {
    where.push("(audience_uids IS NULL OR author_uid = ? OR audience_uids LIKE ?)");
    params.push(myUid, '%"' + myUid + '"%');
  }
  const whereSQL = "WHERE " + where.join(" AND ");

  const { results } = await env.DB.prepare(`
    SELECT * FROM feed_posts ${whereSQL}
    ORDER BY pinned DESC, created_at DESC LIMIT ?
  `).bind(...params, limit).all();

  const posts = (results || []).map(feedPostToCamel);
  if (posts.length) {
    const ids = posts.map(p => p.id);
    const ph = ids.map(() => '?').join(',');
    const { results: rx } = await env.DB.prepare(
      `SELECT post_id, uid, kind FROM feed_reactions WHERE post_id IN (${ph})`
    ).bind(...ids).all();
    // Агрегируем счётчики реакций и собственную реакцию по каждому посту.
    const byPost = {};
    for (const r of (rx || [])) {
      const k = normReactionKind(r.kind) || '👍';
      let agg = byPost[r.post_id];
      if (!agg) agg = byPost[r.post_id] = { counts: {}, mine: null, total: 0 };
      agg.counts[k] = (agg.counts[k] || 0) + 1;
      agg.total += 1;
      if (r.uid === myUid) agg.mine = k;
    }
    for (const p of posts) {
      const agg = byPost[p.id];
      p.reactions = agg ? agg.counts : {};
      p.myReaction = agg ? agg.mine : null;
      p.likedByMe = !!(agg && agg.mine);
      p.likeCount = agg ? agg.total : 0;
    }
  }
  return json({ posts, total: posts.length }, 200, request);
}

// PATCH /api/feed/posts/:id  { text?, pinned? }  — автор или admin
async function handleFeedUpdate(request, env, postId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const myUid = me.canonicalUid || me.firebaseUid;

  const row = await env.DB.prepare("SELECT * FROM feed_posts WHERE id = ? AND deleted_at IS NULL").bind(postId).first();
  if (!row) return json({ error: "not found" }, 404, request);
  if (row.author_uid !== myUid && me.role !== 'admin') return json({ error: "forbidden" }, 403, request);

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const sets = [], params = [];
  if (typeof body.text === 'string') { sets.push("text = ?"); params.push(body.text.trim() || null); }
  if (typeof body.pinned === 'boolean') {
    if (me.role !== 'admin') return json({ error: "only admin can pin" }, 403, request);
    sets.push("pinned = ?"); params.push(body.pinned ? 1 : 0);
  }
  if (!sets.length) return json({ error: "nothing to update" }, 400, request);
  sets.push("updated_at = ?"); params.push(Date.now());
  await env.DB.prepare(`UPDATE feed_posts SET ${sets.join(", ")} WHERE id = ?`).bind(...params, postId).run();
  await auditLog(env, me, "feed_post_update", "feed_post", postId, {});
  const updated = await env.DB.prepare("SELECT * FROM feed_posts WHERE id = ?").bind(postId).first();
  return json({ ok: true, post: feedPostToCamel(updated) }, 200, request);
}

// DELETE /api/feed/posts/:id  — автор или admin (soft delete)
async function handleFeedDelete(request, env, postId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const myUid = me.canonicalUid || me.firebaseUid;

  const row = await env.DB.prepare("SELECT author_uid FROM feed_posts WHERE id = ? AND deleted_at IS NULL").bind(postId).first();
  if (!row) return json({ error: "not found" }, 404, request);
  if (row.author_uid !== myUid && me.role !== 'admin') return json({ error: "forbidden" }, 403, request);
  await env.DB.prepare("UPDATE feed_posts SET deleted_at = ? WHERE id = ?").bind(Date.now(), postId).run();
  await auditLog(env, me, "feed_post_delete", "feed_post", postId, {});
  return json({ ok: true, id: postId }, 200, request);
}

// GET /api/feed/posts/:id/comments
async function handleFeedCommentList(request, env, postId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const vis = await feedLoadVisiblePost(env, me, postId);
  if (vis.error) return json({ error: vis.error }, vis.status, request);

  const { results } = await env.DB.prepare(`
    SELECT * FROM feed_comments WHERE post_id = ? AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 500
  `).bind(postId).all();
  return json({ comments: (results || []).map(feedCommentToCamel) }, 200, request);
}

// POST /api/feed/posts/:id/comments  { text, attachments[] }
async function handleFeedCommentCreate(request, env, postId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const vis = await feedLoadVisiblePost(env, me, postId);
  if (vis.error) return json({ error: vis.error }, vis.status, request);

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const text = (body.text || '').trim();
  const attachments = feedNormalizeAttachments(body.attachments);
  if (!text && attachments.length === 0) return json({ error: "text or attachments required" }, 400, request);

  const id = genFeedId('fc_');
  const now = Date.now();
  await env.DB.prepare(`
    INSERT INTO feed_comments (id, post_id, author_uid, text, attachments, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, postId, vis.myUid, text || null, attachments.length ? JSON.stringify(attachments) : null, now).run();
  await env.DB.prepare("UPDATE feed_posts SET comment_count = comment_count + 1 WHERE id = ?").bind(postId).run();
  await auditLog(env, me, "feed_comment_create", "feed_post", postId, { commentId: id });

  // Уведомить автора поста о комментарии.
  try {
    if (vis.row.author_uid && vis.row.author_uid !== vis.myUid) {
      await createNotification(env, {
        uid: vis.row.author_uid, type: 'feed_comment', actorUid: vis.myUid,
        title: notifActorName(me) + ' прокомментировал ваш пост',
        body: (text || '[вложение]').slice(0, 160),
        link: '/team.html?page=feed', icon: '💬',
        entityType: 'feed_post', entityId: postId,
      });
    }
  } catch (e) { console.warn('[notif] feed comment failed:', e && e.message); }

  const row = await env.DB.prepare("SELECT * FROM feed_comments WHERE id = ?").bind(id).first();
  return json({ ok: true, comment: feedCommentToCamel(row) }, 200, request);
}

// DELETE /api/feed/comments/:id  — автор комментария или admin
async function handleFeedCommentDelete(request, env, commentId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const myUid = me.canonicalUid || me.firebaseUid;

  const row = await env.DB.prepare("SELECT post_id, author_uid FROM feed_comments WHERE id = ? AND deleted_at IS NULL").bind(commentId).first();
  if (!row) return json({ error: "not found" }, 404, request);
  if (row.author_uid !== myUid && me.role !== 'admin') return json({ error: "forbidden" }, 403, request);
  await env.DB.prepare("UPDATE feed_comments SET deleted_at = ? WHERE id = ?").bind(Date.now(), commentId).run();
  await env.DB.prepare("UPDATE feed_posts SET comment_count = MAX(0, comment_count - 1) WHERE id = ?").bind(row.post_id).run();
  await auditLog(env, me, "feed_comment_delete", "feed_comment", commentId, {});
  return json({ ok: true, id: commentId }, 200, request);
}

// POST /api/feed/posts/:id/like  — toggle лайк
async function handleFeedLikeToggle(request, env, postId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const vis = await feedLoadVisiblePost(env, me, postId);
  if (vis.error) return json({ error: vis.error }, vis.status, request);

  const existing = await env.DB.prepare("SELECT post_id FROM feed_reactions WHERE post_id = ? AND uid = ?").bind(postId, vis.myUid).first();
  let liked;
  if (existing) {
    await env.DB.prepare("DELETE FROM feed_reactions WHERE post_id = ? AND uid = ?").bind(postId, vis.myUid).run();
    await env.DB.prepare("UPDATE feed_posts SET like_count = MAX(0, like_count - 1) WHERE id = ?").bind(postId).run();
    liked = false;
  } else {
    await env.DB.prepare("INSERT INTO feed_reactions (post_id, uid, kind, created_at) VALUES (?, ?, 'like', ?)").bind(postId, vis.myUid, Date.now()).run();
    await env.DB.prepare("UPDATE feed_posts SET like_count = like_count + 1 WHERE id = ?").bind(postId).run();
    liked = true;
    // Уведомить автора поста о лайке (только при постановке лайка).
    try {
      if (vis.row.author_uid && vis.row.author_uid !== vis.myUid) {
        await createNotification(env, {
          uid: vis.row.author_uid, type: 'feed_like', actorUid: vis.myUid,
          title: notifActorName(me) + ' оценил ваш пост 👍',
          link: '/team.html?page=feed', icon: '👍',
          entityType: 'feed_post', entityId: postId,
        });
      }
    } catch (e) { console.warn('[notif] feed like failed:', e && e.message); }
  }
  const row = await env.DB.prepare("SELECT like_count FROM feed_posts WHERE id = ?").bind(postId).first();
  return json({ ok: true, liked, likeCount: row?.like_count || 0 }, 200, request);
}

// Набор реакций (как в Facebook): одна на пользователя на пост.
const FEED_REACTION_KINDS = ['👍', '❤️', '😂', '🎉', '😮', '😢'];
// Привести значение kind к канону: legacy 'like'→👍, валидный эмодзи как есть, иначе null.
function normReactionKind(k) {
  if (k === 'like' || k == null || k === '') return '👍';
  return FEED_REACTION_KINDS.includes(k) ? k : null;
}

// POST /api/feed/posts/:id/react { kind }  — поставить/сменить/снять реакцию (1 на юзера).
async function handleFeedReact(request, env, postId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const vis = await feedLoadVisiblePost(env, me, postId);
  if (vis.error) return json({ error: vis.error }, vis.status, request);

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const kind = normReactionKind(body.kind);
  if (!kind) return json({ error: `kind must be one of: ${FEED_REACTION_KINDS.join(',')}` }, 400, request);

  const existing = await env.DB.prepare("SELECT kind FROM feed_reactions WHERE post_id = ? AND uid = ?").bind(postId, vis.myUid).first();
  const prevKind = existing ? normReactionKind(existing.kind) : null;
  let myReaction;
  if (existing && prevKind === kind) {
    // тот же эмодзи — снимаем реакцию
    await env.DB.prepare("DELETE FROM feed_reactions WHERE post_id = ? AND uid = ?").bind(postId, vis.myUid).run();
    await env.DB.prepare("UPDATE feed_posts SET like_count = MAX(0, like_count - 1) WHERE id = ?").bind(postId).run();
    myReaction = null;
  } else if (existing) {
    // другая реакция — меняем эмодзи (счётчик не трогаем)
    await env.DB.prepare("UPDATE feed_reactions SET kind = ?, created_at = ? WHERE post_id = ? AND uid = ?").bind(kind, Date.now(), postId, vis.myUid).run();
    myReaction = kind;
  } else {
    // новой реакции не было — добавляем
    await env.DB.prepare("INSERT INTO feed_reactions (post_id, uid, kind, created_at) VALUES (?, ?, ?, ?)").bind(postId, vis.myUid, kind, Date.now()).run();
    await env.DB.prepare("UPDATE feed_posts SET like_count = like_count + 1 WHERE id = ?").bind(postId).run();
    myReaction = kind;
    // Уведомить автора поста (только при первой постановке реакции).
    try {
      if (vis.row.author_uid && vis.row.author_uid !== vis.myUid) {
        await createNotification(env, {
          uid: vis.row.author_uid, type: 'feed_like', actorUid: vis.myUid,
          title: notifActorName(me) + ' отреагировал на ваш пост ' + kind,
          link: '/team.html?page=feed', icon: kind,
          entityType: 'feed_post', entityId: postId,
        });
      }
    } catch (e) { console.warn('[notif] feed react failed:', e && e.message); }
  }

  // Агрегируем реакции по посту для ответа.
  const { results: rx } = await env.DB.prepare("SELECT kind FROM feed_reactions WHERE post_id = ?").bind(postId).all();
  const reactions = {};
  for (const r of (rx || [])) {
    const k = normReactionKind(r.kind) || '👍';
    reactions[k] = (reactions[k] || 0) + 1;
  }
  const total = (rx || []).length;
  return json({ ok: true, myReaction, reactions, total, likeCount: total }, 200, request);
}

// ════════════════════════════════════════════════════════════════════════
// Центр уведомлений — единая лента событий портала для каждого сотрудника.
// Продюсеры: лента (пост/коммент/лайк), WhatsApp (входящее), напоминания о делах.
// ════════════════════════════════════════════════════════════════════════
function genNotifId(prefix) {
  return (prefix || 'nt_') + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function notifActorName(me) {
  const r = me && me.userRecord;
  if (r) {
    const n = [r.name, r.last_name].filter(Boolean).join(' ').trim();
    if (n) return n;
  }
  return (me && me.email) || 'Коллега';
}

function notifRowToCamel(r) {
  return {
    id: r.id, type: r.type, title: r.title, body: r.body,
    link: r.link, icon: r.icon, actorUid: r.actor_uid,
    entityType: r.entity_type, entityId: r.entity_id,
    createdAt: r.created_at, readAt: r.read_at, read: !!r.read_at,
  };
}

// Создать уведомление + best-effort real-time push в открытые вкладки юзера.
// Никогда не бросает — всё в try/catch, чтобы не ломать основной запрос.
// opts: { uid, type, title, body, link, icon, actorUid, entityType, entityId, id? }
// Если передан id — INSERT OR IGNORE (дедуп, напр. для напоминаний).
async function createNotification(env, opts) {
  try {
    const uid = opts.uid;
    if (!uid) return null;
    if (opts.actorUid && opts.actorUid === uid) return null; // не уведомляем себя
    const id = opts.id || genNotifId('nt_');
    const now = Date.now();
    const ins = await env.DB.prepare(`
      INSERT OR IGNORE INTO notifications
        (id, uid, type, title, body, link, icon, actor_uid, entity_type, entity_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, uid, opts.type || 'system', (opts.title || '').slice(0, 300),
      (opts.body || '').slice(0, 500) || null, opts.link || null, opts.icon || null,
      opts.actorUid || null, opts.entityType || null, opts.entityId || null, now
    ).run();
    // КРИТИЧНО: для дедуп-уведомлений (передан opts.id, напр. напоминания из cron)
    // INSERT OR IGNORE может НИЧЕГО не вставить. В этом случае строка уже была —
    // значит push/broadcast/WhatsApp по ней уже слали. Повторно НЕ слать, иначе
    // cron-напоминание бомбит сотрудника каждую минуту (~30 раз на одно событие).
    const inserted = !!(ins && ins.meta && ins.meta.changes > 0);
    if (!inserted) return id; // дубль — колокольчик уже есть, побочки не повторяем
    // real-time: бамп колокольчика в открытых вкладках (chat.js слушает kind:'notification')
    try {
      await broadcastToUser(env, uid, {
        kind: 'notification',
        notification: { id, type: opts.type || 'system', title: opts.title || '', body: opts.body || '', link: opts.link || null, icon: opts.icon || null, createdAt: now },
      });
    } catch {}
    // Web Push на смартфон — фоном (waitUntil), чтобы не тормозить ответ.
    try {
      const job = pushToUserDevices(env, uid, {
        title: opts.title || 'ELC CRM',
        body: opts.body || '',
        url: opts.link || '/team.html',
        tag: opts.type || 'system',
        icon: opts.icon || null,
      });
      if (CURRENT_CTX && typeof CURRENT_CTX.waitUntil === 'function') CURRENT_CTX.waitUntil(job);
      else await job;
    } catch (e) { console.warn('[push] schedule failed:', e && e.message); }
    // WA-оповещатель: дублируем уведомление в личный WhatsApp, если для этого
    // типа есть событие в карте. sendNotify сам проверит тумблер и наличие телефона.
    try {
      const waEvent = NOTIF_TYPE_TO_EVENT[opts.type];
      if (waEvent) {
        const waText = (opts.title || '') + (opts.body ? `\n${opts.body}` : '');
        const waLink = opts.link ? (opts.link.startsWith('http') ? opts.link : 'https://pllato.kz' + opts.link) : null;
        const waJob = sendNotify(env, { uid, event: waEvent, text: waText, link: waLink }).catch(() => {});
        if (CURRENT_CTX && typeof CURRENT_CTX.waitUntil === 'function') CURRENT_CTX.waitUntil(waJob);
        else await waJob;
      }
    } catch (e) { console.warn('[notif] wa relay failed:', e && e.message); }
    return id;
  } catch (e) {
    console.warn('[notif] create failed:', e && e.message);
    return null;
  }
}

// SHA-256 → hex (для детерминированного id подписки из endpoint).
async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Разослать Web Push на все устройства пользователя. Протухшие (404/410) чистим.
async function pushToUserDevices(env, uid, payload) {
  try {
    if (!env.VAPID_PRIVATE_JWK) return; // пуши не настроены — тихо выходим
    const { results } = await env.DB.prepare(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE uid = ?'
    ).bind(uid).all();
    for (const sub of (results || [])) {
      try {
        const r = await sendWebPush(env, sub, payload);
        if (r.gone) {
          await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(sub.id).run();
        } else if (r.ok) {
          await env.DB.prepare('UPDATE push_subscriptions SET last_ok_at = ? WHERE id = ?').bind(Date.now(), sub.id).run();
        }
      } catch (e) { console.warn('[push] send failed:', e && e.message); }
    }
  } catch (e) { console.warn('[push] fanout failed:', e && e.message); }
}

// GET /api/push/vapid-public — публичный VAPID-ключ для applicationServerKey.
function handlePushVapidPublic(request) {
  return json({ key: VAPID_PUBLIC_KEY }, 200, request);
}

// POST /api/push/subscribe  { endpoint, keys:{p256dh, auth} }  (PushSubscription.toJSON())
async function handlePushSubscribe(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const uid = me.canonicalUid || me.firebaseUid;
  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400, request); }
  const sub = body.subscription || body;
  const endpoint = sub.endpoint;
  const p256dh = (sub.keys && sub.keys.p256dh) || sub.p256dh;
  const authKey = (sub.keys && sub.keys.auth) || sub.auth;
  if (!endpoint || !p256dh || !authKey) return json({ error: 'endpoint, p256dh, auth required' }, 400, request);

  const id = 'ps_' + (await sha256hex(endpoint)).slice(0, 32); // детерминированный — дедуп на устройство
  const now = Date.now();
  const ua = request.headers.get('User-Agent') || null;
  // ON CONFLICT(id): то же устройство переподписалось (ротация ключей) — обновляем.
  await env.DB.prepare(`
    INSERT INTO push_subscriptions (id, uid, endpoint, p256dh, auth, ua, created_at, last_ok_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
    ON CONFLICT(id) DO UPDATE SET uid=excluded.uid, p256dh=excluded.p256dh, auth=excluded.auth, ua=excluded.ua
  `).bind(id, uid, endpoint, p256dh, authKey, ua, now).run();
  return json({ ok: true, id }, 200, request);
}

// POST /api/push/unsubscribe  { endpoint }
async function handlePushUnsubscribe(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400, request); }
  const endpoint = body.endpoint || (body.subscription && body.subscription.endpoint);
  if (!endpoint) return json({ error: 'endpoint required' }, 400, request);
  await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run();
  return json({ ok: true }, 200, request);
}

// Уведомить нескольких получателей (uids[]) — последовательно, best-effort.
async function createNotificationFor(env, uids, baseOpts) {
  const seen = new Set();
  for (const uid of (uids || [])) {
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    await createNotification(env, { ...baseOpts, uid });
  }
}

// GET /api/notifications?limit=&before=&unreadOnly=1
async function handleNotificationsList(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const uid = me.canonicalUid || me.firebaseUid;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '40', 10) || 40, 100);
  const before = parseInt(url.searchParams.get('before') || '0', 10) || 0;
  const unreadOnly = url.searchParams.get('unreadOnly') === '1';

  const where = ['uid = ?']; const params = [uid];
  if (before) { where.push('created_at < ?'); params.push(before); }
  if (unreadOnly) where.push('read_at IS NULL');
  const { results } = await env.DB.prepare(
    `SELECT * FROM notifications WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ?`
  ).bind(...params, limit).all();

  const unreadRow = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM notifications WHERE uid = ? AND read_at IS NULL'
  ).bind(uid).first();

  return json({ notifications: (results || []).map(notifRowToCamel), unread: unreadRow?.c || 0 }, 200, request);
}

// GET /api/notifications/count — лёгкий поллинг бэйджа
async function handleNotificationsCount(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const uid = me.canonicalUid || me.firebaseUid;
  const row = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM notifications WHERE uid = ? AND read_at IS NULL'
  ).bind(uid).first();
  return json({ unread: row?.c || 0 }, 200, request);
}

// POST /api/notifications/read { ids:[...] }
async function handleNotificationsRead(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const uid = me.canonicalUid || me.firebaseUid;
  let body; try { body = await request.json(); } catch { body = {}; }
  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean).map(String).slice(0, 200) : [];
  if (!ids.length) return json({ ok: true, updated: 0 }, 200, request);
  const ph = ids.map(() => '?').join(',');
  await env.DB.prepare(
    `UPDATE notifications SET read_at = ? WHERE uid = ? AND read_at IS NULL AND id IN (${ph})`
  ).bind(Date.now(), uid, ...ids).run();
  return json({ ok: true }, 200, request);
}

// POST /api/notifications/read-all
async function handleNotificationsReadAll(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  const uid = me.canonicalUid || me.firebaseUid;
  await env.DB.prepare('UPDATE notifications SET read_at = ? WHERE uid = ? AND read_at IS NULL').bind(Date.now(), uid).run();
  return json({ ok: true }, 200, request);
}

// Cron-продюсер: напоминания о делах/задачах с приближающимся дедлайном (≤30 мин).
// Дедуп — детерминированный id с bucket'ом по часу дедлайна (перенос даёт новый id).
// Формат deadline варьируется → широкое окно по TEXT + точный фильтр через Date.parse.
async function produceDeedReminders(env) {
  const now = Date.now();
  const LEAD = 30 * 60 * 1000;
  const wideLo = new Date(now - 6 * 3600e3).toISOString();
  const wideHi = new Date(now + 6 * 3600e3).toISOString();
  let rows;
  try {
    const r = await env.DB.prepare(`
      SELECT id, title, deadline, responsible_uid, crm_links
      FROM tasks
      WHERE deadline IS NOT NULL AND status < 5 AND deadline >= ? AND deadline <= ?
      LIMIT 300
    `).bind(wideLo, wideHi).all();
    rows = r.results || [];
  } catch (e) { console.warn('[deedRemind] query failed:', e && e.message); return { reminded: 0 }; }

  let reminded = 0;
  for (const t of rows) {
    if (!t.responsible_uid) continue;
    const dl = Date.parse(t.deadline);
    if (isNaN(dl)) continue;
    const diff = dl - now;
    if (diff > LEAD || diff < -60 * 1000) continue;      // окно [сейчас-1мин, +30мин]
    const isDeed = typeof t.crm_links === 'string' && t.crm_links.includes('deal_');
    const id = 'nt_deedremind_' + t.id + '_' + Math.floor(dl / 3600000);
    await createNotification(env, {
      id, uid: t.responsible_uid, type: 'deed_reminder',
      title: isDeed ? '⏰ Скоро дедлайн дела' : '⏰ Скоро дедлайн задачи',
      body: t.title || (isDeed ? 'Дело' : 'Задача'),
      link: isDeed ? '/team.html?page=deeds' : '/team.html?page=tasks',
      icon: '⏰', entityType: 'task', entityId: t.id,
    });
    reminded++;
  }
  return { reminded };
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

// ── SIP-extensions: карта uid → внутренний номер для Asterisk ───────────
// Хранение: kv['org:extensions'] = { [uid]: '101', [uid2]: '102', ... }
// UI в Структуре (ресепшн филиала сам вписывает свой extension'ам).
async function handleSipExtensionsGet(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const row = await env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind('org:extensions').first();
  let map = {};
  if (row?.v) { try { map = JSON.parse(row.v) || {}; } catch {} }
  return json({ ok: true, extensions: map }, 200, request);
}

async function handleSipExtensionsPut(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  // TODO: per-node permission check (главе отдела можно править только своих).
  // Пока — admin или любой с правом редактировать структуру.
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const ext = body.extensions;
  if (!ext || typeof ext !== 'object') return json({ error: "extensions object required" }, 400, request);
  // Sanitize: только uid (string) → extension (digit string)
  const clean = {};
  for (const [uid, val] of Object.entries(ext)) {
    if (typeof uid !== 'string') continue;
    const v = String(val || '').replace(/\D/g, '').slice(0, 6);
    if (v) clean[uid] = v;
  }
  await env.DB.prepare(`
    INSERT INTO kv (k, v) VALUES (?, ?)
    ON CONFLICT(k) DO UPDATE SET v = excluded.v
  `).bind('org:extensions', JSON.stringify(clean)).run();
  return json({ ok: true, extensions: clean }, 200, request);
}

// ════════════════════════════════════════════════════════════════════════
// ПЕРСОНАЛЬНЫЕ ЛИНИИ БИНОТЕЛ
// Модель: каждая «внутренняя линия Бинотел» (напр. 1906) = транк со своими
// SIP-кредами. Каждый сотрудник = свой endpoint на нашем Asterisk + назначенная
// линия. Браузер сотрудника регистрируется на наш Asterisk своим endpoint'ом;
// исходящие идут через назначенную линию (его Caller ID), входящие на линию —
// звонят его браузеру. Пароли линий (Asterisk↔Бинотел) браузеру не отдаются —
// только генератору конфига под секретом. Пароль endpoint'а — лично сотруднику.
// ════════════════════════════════════════════════════════════════════════
let _sipTablesReady = false;
async function ensureSipTables(env) {
  if (_sipTablesReady) return;
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sip_lines (
      id TEXT PRIMARY KEY, number TEXT, label TEXT, sip_server TEXT, sip_port TEXT,
      sip_user TEXT, sip_password TEXT, caller_id TEXT, enabled INTEGER DEFAULT 1,
      created_at INTEGER, updated_at INTEGER
    )`).run();
  } catch (e) {}
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sip_agents (
      uid TEXT PRIMARY KEY, extension TEXT, endpoint_password TEXT, line_id TEXT,
      enabled INTEGER DEFAULT 1, updated_at INTEGER
    )`).run();
  } catch (e) {}
  _sipTablesReady = true;
}

function sipRandomPassword(len = 20) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < len; i++) out += chars[buf[i] % chars.length];
  return out;
}

async function sipRequireAdmin(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return { error: json({ error: auth.error }, auth.status, request) };
  const me = await resolveCanonicalUser(env, auth.claims);
  if (me.role !== "admin") return { error: json({ error: "admin only" }, 403, request) };
  return { me };
}

// GET /api/sip/lines — список линий (пароли скрыты, отдаём только наличие).
async function handleSipLinesGet(request, env) {
  const g = await sipRequireAdmin(request, env);
  if (g.error) return g.error;
  await ensureSipTables(env);
  const { results } = await env.DB.prepare(
    `SELECT id, number, label, sip_server, sip_port, sip_user, caller_id, enabled,
            (sip_password IS NOT NULL AND sip_password != '') AS has_password
       FROM sip_lines ORDER BY number`
  ).all();
  return json({ ok: true, lines: results || [] }, 200, request);
}

// POST /api/sip/lines — создать/обновить линию. Если пароль не передан при
// обновлении — старый сохраняется (не затираем пустым).
async function handleSipLinesPut(request, env) {
  const g = await sipRequireAdmin(request, env);
  if (g.error) return g.error;
  await ensureSipTables(env);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const number = String(body.number || '').replace(/\D/g, '').slice(0, 12);
  if (!number) return json({ error: "number required" }, 400, request);
  const id = body.id ? String(body.id) : crypto.randomUUID();
  const label = String(body.label || '').slice(0, 80);
  const sipServer = String(body.sip_server || '').slice(0, 200);
  const sipPort = String(body.sip_port || '5060').replace(/\D/g, '').slice(0, 6) || '5060';
  const sipUser = String(body.sip_user || '').slice(0, 120);
  const callerId = String(body.caller_id || '').slice(0, 40);
  const enabled = body.enabled === false ? 0 : 1;
  const now = Date.now();
  const existing = await env.DB.prepare(`SELECT id, sip_password FROM sip_lines WHERE id = ?`).bind(id).first();
  // Пароль: берём новый если передан, иначе сохраняем существующий.
  let sipPassword = (body.sip_password != null && String(body.sip_password) !== '')
    ? String(body.sip_password) : (existing ? existing.sip_password : '');
  await env.DB.prepare(`
    INSERT INTO sip_lines (id, number, label, sip_server, sip_port, sip_user, sip_password, caller_id, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET number=excluded.number, label=excluded.label, sip_server=excluded.sip_server,
      sip_port=excluded.sip_port, sip_user=excluded.sip_user, sip_password=excluded.sip_password,
      caller_id=excluded.caller_id, enabled=excluded.enabled, updated_at=excluded.updated_at
  `).bind(id, number, label, sipServer, sipPort, sipUser, sipPassword, callerId, enabled, now, now).run();
  return json({ ok: true, id }, 200, request);
}

// DELETE /api/sip/lines/:id
async function handleSipLineDelete(request, env, id) {
  const g = await sipRequireAdmin(request, env);
  if (g.error) return g.error;
  await ensureSipTables(env);
  await env.DB.prepare(`DELETE FROM sip_lines WHERE id = ?`).bind(id).run();
  // Снимаем назначение у агентов, у кого была эта линия.
  await env.DB.prepare(`UPDATE sip_agents SET line_id = NULL WHERE line_id = ?`).bind(id).run();
  return json({ ok: true }, 200, request);
}

// GET /api/sip/agents — назначения сотрудник→(extension, линия). Без паролей.
async function handleSipAgentsGet(request, env) {
  const g = await sipRequireAdmin(request, env);
  if (g.error) return g.error;
  await ensureSipTables(env);
  const { results } = await env.DB.prepare(
    `SELECT uid, extension, line_id, enabled,
            (endpoint_password IS NOT NULL AND endpoint_password != '') AS has_password
       FROM sip_agents`
  ).all();
  return json({ ok: true, agents: results || [] }, 200, request);
}

// POST /api/sip/agents — назначить сотруднику extension и линию. Пароль
// endpoint'а генерим автоматически при первом сохранении (или по запросу regen).
async function handleSipAgentsPut(request, env) {
  const g = await sipRequireAdmin(request, env);
  if (g.error) return g.error;
  await ensureSipTables(env);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const uid = String(body.uid || '').trim();
  if (!uid) return json({ error: "uid required" }, 400, request);
  const extension = String(body.extension || '').replace(/\D/g, '').slice(0, 6);
  const lineId = body.line_id ? String(body.line_id) : null;
  const enabled = body.enabled === false ? 0 : 1;
  const now = Date.now();
  const existing = await env.DB.prepare(`SELECT endpoint_password FROM sip_agents WHERE uid = ?`).bind(uid).first();
  let pwd = existing && existing.endpoint_password ? existing.endpoint_password : '';
  if (!pwd || body.regen_password) pwd = sipRandomPassword();
  await env.DB.prepare(`
    INSERT INTO sip_agents (uid, extension, endpoint_password, line_id, enabled, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(uid) DO UPDATE SET extension=excluded.extension, endpoint_password=excluded.endpoint_password,
      line_id=excluded.line_id, enabled=excluded.enabled, updated_at=excluded.updated_at
  `).bind(uid, extension, pwd, lineId, enabled, now).run();
  return json({ ok: true, uid }, 200, request);
}

// DELETE /api/sip/agents/:uid — снять телефонию у сотрудника (вернётся к общему 100).
async function handleSipAgentDelete(request, env, uid) {
  const g = await sipRequireAdmin(request, env);
  if (g.error) return g.error;
  await ensureSipTables(env);
  await env.DB.prepare(`DELETE FROM sip_agents WHERE uid = ?`).bind(uid).run();
  return json({ ok: true }, 200, request);
}

// Возвращает персональные SIP-креды сотрудника, если он настроен; иначе null.
async function sipAgentCreds(env, uid) {
  if (!uid) return null;
  try {
    await ensureSipTables(env);
    const row = await env.DB.prepare(
      `SELECT extension, endpoint_password, enabled FROM sip_agents WHERE uid = ?`
    ).bind(uid).first();
    if (row && row.enabled && row.extension && row.endpoint_password) {
      return { user: String(row.extension), password: String(row.endpoint_password) };
    }
  } catch (e) {}
  return null;
}

// GET /api/sip/asterisk-config?secret=XXX — генерирует pjsip.conf + extensions.conf
// из линий и назначений в CRM. Защищён тем же секретом, что /api/sip/route
// (Asterisk не умеет Firebase Auth). Сервер тянет это curl'ом и применяет.
// Это БЕЗОПАСНО: пароли линий уходят только сюда (под секретом), не в браузер.
async function handleSipAsteriskConfig(request, env) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret') || request.headers.get('x-sip-route-secret') || '';
  if (!env.SIP_ROUTE_SECRET || secret !== env.SIP_ROUTE_SECRET) {
    return new Response("invalid secret", { status: 401 });
  }
  await ensureSipTables(env);
  const domain = env.SIP_DOMAIN || "your-domain.nip.io";
  const certDir = url.searchParams.get('cert_dir') || `/etc/letsencrypt/live/${domain}`;
  const sharedPwd = env.SIP_PASSWORD || "changeme_set_strong_password";

  const { results: linesRaw } = await env.DB.prepare(
    `SELECT * FROM sip_lines WHERE enabled = 1 ORDER BY number`).all();
  const lines = linesRaw || [];
  const { results: agentsRaw } = await env.DB.prepare(
    `SELECT * FROM sip_agents WHERE enabled = 1 AND extension != '' AND endpoint_password != ''`).all();
  const agents = agentsRaw || [];

  const lineById = {};
  for (const l of lines) lineById[l.id] = l;
  const defaultLine = lines[0] || null;
  const lineCtx = (l) => `from-agent-${l.number}`;     // исходящий контекст линии
  const lineIn = (l) => `from-line-${l.number}`;        // входящий контекст линии
  const agentCtx = (a) => {
    const l = a.line_id && lineById[a.line_id] ? lineById[a.line_id] : defaultLine;
    return l ? lineCtx(l) : 'from-internal';
  };

  // ── pjsip.conf ──
  let pjsip = `; ===========================================================================
; СГЕНЕРИРОВАНО CRM (/api/sip/asterisk-config). Не редактируйте вручную —
; меняйте линии/назначения в CRM и перегенерируйте. Линий: ${lines.length}, агентов: ${agents.length}.
; ВАЖНО: проверьте сопоставление ВХОДЯЩИХ (секция identify/registration) под
; поведение вашего Бинотел — если все линии на одном SIP-сервере, может
; потребоваться различать вызовы по набранному номеру (DID) в dialplan.
; ===========================================================================
[global]
type=global
endpoint_identifier_order=username,ip

[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0:8089
cert_file=${certDir}/fullchain.pem
priv_key_file=${certDir}/privkey.pem

[transport-udp]
type=transport
protocol=udp
bind=0.0.0.0:5060
`;

  // Транки линий Бинотел
  for (const l of lines) {
    const server = l.sip_server || 'sip.binotel.com';
    const port = l.sip_port || '5060';
    pjsip += `
;=== Линия ${l.number}${l.label ? ' ('+l.label+')' : ''} ===
[line-${l.number}-auth]
type=auth
auth_type=userpass
username=${l.sip_user || l.number}
password=${l.sip_password || ''}

[line-${l.number}]
type=endpoint
transport=transport-udp
context=${lineIn(l)}
disallow=all
allow=alaw,ulaw
outbound_auth=line-${l.number}-auth
aors=line-${l.number}
from_user=${l.sip_user || l.number}
from_domain=${server}
direct_media=no

[line-${l.number}]
type=aor
contact=sip:${server}:${port}

[line-${l.number}]
type=identify
endpoint=line-${l.number}
match=${server}

[line-${l.number}-reg]
type=registration
outbound_auth=line-${l.number}-auth
server_uri=sip:${server}:${port}
client_uri=sip:${l.sip_user || l.number}@${server}
retry_interval=60
`;
  }

  // Общий endpoint 100 (fallback для несконфигурированных сотрудников)
  pjsip += `
;=== Общий браузерный endpoint 100 (fallback) ===
[100-auth]
type=auth
auth_type=userpass
username=100
password=${sharedPwd}

[100]
type=endpoint
transport=transport-wss
context=${defaultLine ? lineCtx(defaultLine) : 'from-internal'}
disallow=all
allow=alaw,ulaw
auth=100-auth
aors=100
webrtc=yes
dtls_cert_file=${certDir}/fullchain.pem
dtls_private_key=${certDir}/privkey.pem
dtls_setup=actpass
dtls_verify=fingerprint
ice_support=yes
media_use_received_transport=yes
rtcp_mux=yes

[100]
type=aor
max_contacts=5
remove_existing=yes
`;

  // Персональные endpoint'ы сотрудников
  for (const a of agents) {
    pjsip += `
;=== Сотрудник ext ${a.extension} → ${a.line_id && lineById[a.line_id] ? 'линия '+lineById[a.line_id].number : 'линия по умолчанию'} ===
[${a.extension}-auth]
type=auth
auth_type=userpass
username=${a.extension}
password=${a.endpoint_password}

[${a.extension}]
type=endpoint
transport=transport-wss
context=${agentCtx(a)}
disallow=all
allow=alaw,ulaw
auth=${a.extension}-auth
aors=${a.extension}
webrtc=yes
dtls_cert_file=${certDir}/fullchain.pem
dtls_private_key=${certDir}/privkey.pem
dtls_setup=actpass
dtls_verify=fingerprint
ice_support=yes
media_use_received_transport=yes
rtcp_mux=yes

[${a.extension}]
type=aor
max_contacts=3
remove_existing=yes
`;
  }

  // ── extensions.conf ──
  let ext = `; ===========================================================================
; СГЕНЕРИРОВАНО CRM. extensions.conf
; ===========================================================================
[general]
static=yes
writeprotect=no
`;
  // Исходящие: контекст на линию → набор через её транк с её Caller ID
  for (const l of lines) {
    const cid = (l.caller_id || l.number || '').replace(/[^\d+]/g, '');
    ext += `
;=== Исходящие через линию ${l.number} ===
[${lineCtx(l)}]
exten => _X.,1,NoOp(Out via line ${l.number}: \${EXTEN})
${cid ? ` same => n,Set(CALLERID(num)=${cid})\n` : ''} same => n,Dial(PJSIP/\${EXTEN}@line-${l.number},60)
 same => n,Hangup()
`;
  }
  // Входящие: на каждую линию → звоним назначенным сотрудникам (или 100)
  for (const l of lines) {
    const ringAgents = agents.filter(a => a.line_id === l.id && a.extension);
    const dialStr = ringAgents.length
      ? ringAgents.map(a => `PJSIP/${a.extension}`).join('&')
      : 'PJSIP/100';
    ext += `
;=== Входящие на линию ${l.number} → ${ringAgents.length ? ringAgents.map(a=>a.extension).join(', ') : '100 (никто не назначен)'} ===
[${lineIn(l)}]
exten => _X.,1,NoOp(In on line ${l.number} to \${EXTEN})
 same => n,Dial(${dialStr},30)
 same => n,Hangup()
`;
  }
  // Legacy fallback-контекст (если 100 без линий)
  ext += `
[from-internal]
exten => _X.,1,NoOp(Outbound legacy: \${EXTEN})
${defaultLine ? ` same => n,Dial(PJSIP/\${EXTEN}@line-${defaultLine.number},60)` : ' same => n,Hangup()'}
 same => n,Hangup()
`;

  // ?file=pjsip | extensions → отдаём только один файл (удобно для tee на сервере).
  const file = (url.searchParams.get('file') || '').toLowerCase();
  let body;
  if (file === 'pjsip') body = pjsip + '\n';
  else if (file === 'extensions' || file === 'ext') body = ext + '\n';
  else body = `; ##### /etc/asterisk/pjsip.conf (file=pjsip) #####\n${pjsip}\n\n; ##### /etc/asterisk/extensions.conf (file=extensions) #####\n${ext}\n`;
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

// ════════════════════════════════════════════════════════════════════════
// ПОЧТА — общие ящики (Яндекс и др.). Этап 1: конфиг ящика + назначение
// сотрудников. Админ вводит данные сервера (IMAP/SMTP) и пароль приложения,
// указывает, кто из сотрудников работает с ящиком. Все админы управляют.
// Чтение (IMAP) и отправка (SMTP) — следующие этапы.
// ════════════════════════════════════════════════════════════════════════
let _mailTablesReady = false;
async function ensureMailTables(env) {
  if (_mailTablesReady) return;
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS mail_accounts (
      id TEXT PRIMARY KEY, email TEXT, label TEXT,
      imap_host TEXT, imap_port TEXT, smtp_host TEXT, smtp_port TEXT,
      login TEXT, password TEXT, assigned_uids TEXT, enabled INTEGER DEFAULT 1,
      created_at INTEGER, updated_at INTEGER
    )`).run();
  } catch (e) {}
  _mailTablesReady = true;
}

async function mailRequireAdmin(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return { error: json({ error: auth.error }, auth.status, request) };
  const me = await resolveCanonicalUser(env, auth.claims);
  if (me.role !== "admin") return { error: json({ error: "admin only" }, 403, request) };
  return { me };
}

function mailParseAssigned(v) {
  if (!v) return [];
  try { const a = JSON.parse(v); return Array.isArray(a) ? a.filter(Boolean) : []; } catch { return []; }
}

// GET /api/mail/accounts — admin: все ящики (пароль скрыт).
async function handleMailAccountsGet(request, env) {
  const g = await mailRequireAdmin(request, env);
  if (g.error) return g.error;
  await ensureMailTables(env);
  const { results } = await env.DB.prepare(
    `SELECT id, email, label, imap_host, imap_port, smtp_host, smtp_port, login, assigned_uids, enabled,
            (password IS NOT NULL AND password != '') AS has_password
       FROM mail_accounts ORDER BY email`).all();
  const accounts = (results || []).map(a => ({ ...a, assigned_uids: mailParseAssigned(a.assigned_uids) }));
  return json({ ok: true, accounts }, 200, request);
}

// POST /api/mail/accounts — admin: создать/обновить ящик.
async function handleMailAccountsPut(request, env) {
  const g = await mailRequireAdmin(request, env);
  if (g.error) return g.error;
  await ensureMailTables(env);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const email = String(body.email || '').trim().slice(0, 200);
  if (!email) return json({ error: "email required" }, 400, request);
  const id = body.id ? String(body.id) : crypto.randomUUID();
  const label = String(body.label || '').slice(0, 80);
  const imapHost = String(body.imap_host || 'imap.yandex.ru').slice(0, 200);
  const imapPort = String(body.imap_port || '993').replace(/\D/g, '').slice(0, 6) || '993';
  const smtpHost = String(body.smtp_host || 'smtp.yandex.ru').slice(0, 200);
  const smtpPort = String(body.smtp_port || '465').replace(/\D/g, '').slice(0, 6) || '465';
  const login = String(body.login || email).trim().slice(0, 200);
  const assigned = Array.isArray(body.assigned_uids) ? body.assigned_uids.filter(Boolean).map(String).slice(0, 200) : [];
  const enabled = body.enabled === false ? 0 : 1;
  const now = Date.now();
  const existing = await env.DB.prepare(`SELECT password FROM mail_accounts WHERE id = ?`).bind(id).first();
  const password = (body.password != null && String(body.password) !== '')
    ? String(body.password) : (existing ? existing.password : '');
  await env.DB.prepare(`
    INSERT INTO mail_accounts (id, email, label, imap_host, imap_port, smtp_host, smtp_port, login, password, assigned_uids, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET email=excluded.email, label=excluded.label, imap_host=excluded.imap_host,
      imap_port=excluded.imap_port, smtp_host=excluded.smtp_host, smtp_port=excluded.smtp_port,
      login=excluded.login, password=excluded.password, assigned_uids=excluded.assigned_uids,
      enabled=excluded.enabled, updated_at=excluded.updated_at
  `).bind(id, email, label, imapHost, imapPort, smtpHost, smtpPort, login, password, JSON.stringify(assigned), enabled, now, now).run();
  return json({ ok: true, id }, 200, request);
}

// DELETE /api/mail/accounts/:id — admin.
async function handleMailAccountDelete(request, env, id) {
  const g = await mailRequireAdmin(request, env);
  if (g.error) return g.error;
  await ensureMailTables(env);
  await env.DB.prepare(`DELETE FROM mail_accounts WHERE id = ?`).bind(id).run();
  return json({ ok: true }, 200, request);
}

// GET /api/mail/my — ящики, доступные текущему сотруднику (admin → все).
async function handleMailMy(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureMailTables(env);
  const me = await resolveCanonicalUser(env, auth.claims);
  const { results } = await env.DB.prepare(
    `SELECT id, email, label, assigned_uids, enabled FROM mail_accounts WHERE enabled = 1 ORDER BY email`).all();
  const isAdmin = me.role === 'admin';
  const myUid = me.canonicalUid;
  const accounts = (results || [])
    .filter(a => isAdmin || mailParseAssigned(a.assigned_uids).includes(myUid))
    .map(a => ({ id: a.id, email: a.email, label: a.label }));
  return json({ ok: true, accounts, isAdmin }, 200, request);
}

// Загружает ящик с паролем и проверяет доступ (admin ИЛИ назначенный сотрудник).
// Возвращает { acc } или { error: Response }.
async function mailAccountForUser(request, env, id) {
  const auth = await requireAuth(request, env);
  if (auth.error) return { error: json({ error: auth.error }, auth.status, request) };
  await ensureMailTables(env);
  const me = await resolveCanonicalUser(env, auth.claims);
  const acc = await env.DB.prepare("SELECT * FROM mail_accounts WHERE id = ?").bind(id).first();
  if (!acc) return { error: json({ error: "mailbox not found" }, 404, request) };
  const allowed = me.role === 'admin' || mailParseAssigned(acc.assigned_uids).includes(me.canonicalUid);
  if (!allowed) return { error: json({ error: "forbidden" }, 403, request) };
  return { acc, me };
}

// GET /api/mail/:id/folders — список папок ящика.
async function handleMailFolders(request, env, id) {
  const g = await mailAccountForUser(request, env, id);
  if (g.error) return g.error;
  try {
    const r = await imapFolders(g.acc);
    return json({ ok: true, ...r }, 200, request);
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) }, 502, request);
  }
}

// GET /api/mail/:id/messages?folder=INBOX&limit=30&beforeSeq=N — список писем.
async function handleMailMessages(request, env, id) {
  const g = await mailAccountForUser(request, env, id);
  if (g.error) return g.error;
  const url = new URL(request.url);
  const folder = url.searchParams.get('folder') || 'INBOX';
  const limit = Math.min(50, Math.max(5, parseInt(url.searchParams.get('limit') || '30', 10) || 30));
  const beforeSeq = parseInt(url.searchParams.get('beforeSeq') || '0', 10) || null;
  try {
    const r = await imapList(g.acc, { folder, limit, beforeSeq });
    return json({ ok: true, ...r }, 200, request);
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) }, 502, request);
  }
}

// GET /api/mail/:id/message/:uid — одно письмо целиком.
async function handleMailMessage(request, env, id, uid) {
  const g = await mailAccountForUser(request, env, id);
  if (g.error) return g.error;
  const url = new URL(request.url);
  const folder = url.searchParams.get('folder') || 'INBOX';
  try {
    const msg = await imapFetchMessage(g.acc, uid, { folder });
    return json({ ok: true, message: msg }, 200, request);
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) }, 502, request);
  }
}

// GET /api/mail/:id/message/:uid/attachment/:index — скачать/просмотреть вложение.
// Гибкая авторизация (?auth=token) — чтобы работать по прямой ссылке <a>/нового окна.
async function handleMailAttachment(request, env, id, uid, index) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureMailTables(env);
  const me = await resolveCanonicalUser(env, auth.claims);
  const acc = await env.DB.prepare("SELECT * FROM mail_accounts WHERE id = ?").bind(id).first();
  if (!acc) return json({ error: "mailbox not found" }, 404, request);
  const allowed = me.role === 'admin' || mailParseAssigned(acc.assigned_uids).includes(me.canonicalUid);
  if (!allowed) return json({ error: "forbidden" }, 403, request);
  const url = new URL(request.url);
  const folder = url.searchParams.get('folder') || 'INBOX';
  try {
    const att = await imapFetchAttachment(acc, uid, index, { folder });
    const ct = att.mime || 'application/octet-stream';
    // Картинки/PDF — inline (просмотр в браузере); остальное — attachment (скачивание).
    const inline = /^image\//.test(ct) || ct === 'application/pdf' || url.searchParams.get('view') === '1';
    const headers = new Headers(corsHeaders(request));
    headers.set('Content-Type', ct);
    headers.set('Content-Length', String(att.bytes.length));
    const safeName = encodeURIComponent(att.filename || 'attachment');
    headers.set('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${safeName}`);
    headers.set('Cache-Control', 'private, max-age=600');
    return new Response(att.bytes, { status: 200, headers });
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) }, 502, request);
  }
}

// POST /api/mail/:id/send { to, cc, subject, text, html, inReplyTo } — отправка.
async function handleMailSend(request, env, id) {
  const g = await mailAccountForUser(request, env, id);
  if (g.error) return g.error;
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  if (!body.to || !String(body.to).trim()) return json({ error: "recipient required" }, 400, request);
  const fromName = g.me && g.me.userRecord ? [g.me.userRecord.name, g.me.userRecord.last_name].filter(Boolean).join(' ') : '';
  // Вложения: [{filename, mime, b64}]. Ограничим суммарный размер ~20 МБ.
  let attachments = Array.isArray(body.attachments) ? body.attachments : [];
  let totalB64 = 0;
  for (const a of attachments) totalB64 += (a && a.b64 ? String(a.b64).length : 0);
  if (totalB64 > 27 * 1024 * 1024) return json({ error: "вложения слишком большие (макс ~20 МБ)" }, 413, request);
  try {
    await smtpSend(g.acc, {
      to: String(body.to), cc: body.cc ? String(body.cc) : '',
      subject: String(body.subject || ''), text: String(body.text || ''),
      html: body.html ? String(body.html) : '', inReplyTo: body.inReplyTo || '', fromName, attachments,
    });
    return json({ ok: true }, 200, request);
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) }, 502, request);
  }
}

// POST /api/mail/:id/test — проверка подключения (admin/назначенный).
async function handleMailTest(request, env, id) {
  const g = await mailAccountForUser(request, env, id);
  if (g.error) return g.error;
  try {
    const r = await mailTestConnection(g.acc);
    return json({ ok: true, ...r }, 200, request);
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) }, 502, request);
  }
}

// GET /api/mail/:id/unread — кол-во непрочитанных во входящих (для бейджа).
async function handleMailUnread(request, env, id) {
  const g = await mailAccountForUser(request, env, id);
  if (g.error) return g.error;
  try {
    const r = await imapUnreadCount(g.acc, 'INBOX');
    return json({ ok: true, ...r }, 200, request);
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) }, 502, request);
  }
}

// GET /api/mail/unread-summary — суммарно непрочитанных по доступным ящикам.
async function handleMailUnreadSummary(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureMailTables(env);
  const me = await resolveCanonicalUser(env, auth.claims);
  const { results } = await env.DB.prepare("SELECT * FROM mail_accounts WHERE enabled = 1").all();
  const mine = (results || []).filter(a => me.role === 'admin' || mailParseAssigned(a.assigned_uids).includes(me.canonicalUid));
  let total = 0; const perBox = {};
  for (const a of mine) {
    try { const r = await imapUnreadCount(a, 'INBOX'); perBox[a.id] = r.unseen; total += r.unseen; }
    catch (e) { perBox[a.id] = 0; }
  }
  return json({ ok: true, total, perBox }, 200, request);
}

// ════════════════════════════════════════════════════════════════════════
// ОНБОРДИНГ — обучение новых сотрудников + итоговый тест. Прогресс в D1.
// ════════════════════════════════════════════════════════════════════════
let _onbTableReady = false;
async function ensureOnboardingTable(env) {
  if (_onbTableReady) return;
  try {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS onboarding_progress (
      uid TEXT PRIMARY KEY, completed_lessons TEXT, test_score INTEGER,
      test_passed INTEGER DEFAULT 0, completed_at INTEGER, updated_at INTEGER
    )`).run();
  } catch (e) {}
  _onbTableReady = true;
}
function onbParseLessons(v) { try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; } }

async function handleOnboardingMe(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureOnboardingTable(env);
  const me = await resolveCanonicalUser(env, auth.claims);
  const row = await env.DB.prepare("SELECT * FROM onboarding_progress WHERE uid = ?").bind(me.canonicalUid).first();
  return json({
    ok: true,
    progress: {
      completedLessons: row ? onbParseLessons(row.completed_lessons) : [],
      testScore: row ? row.test_score : null,
      testPassed: row ? !!row.test_passed : false,
      completedAt: row ? row.completed_at : null,
    },
  }, 200, request);
}

async function handleOnboardingProgress(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureOnboardingTable(env);
  const me = await resolveCanonicalUser(env, auth.claims);
  let body; try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const ex = await env.DB.prepare("SELECT * FROM onboarding_progress WHERE uid = ?").bind(me.canonicalUid).first();
  let completed = ex ? onbParseLessons(ex.completed_lessons) : [];
  if (Array.isArray(body.completedLessons)) completed = [...new Set([...completed, ...body.completedLessons.map(String)])];
  let testScore = ex ? ex.test_score : null;
  let testPassed = ex ? ex.test_passed : 0;
  let completedAt = ex ? ex.completed_at : null;
  if (typeof body.testScore === 'number') {
    testScore = body.testScore; testPassed = body.testPassed ? 1 : 0;
    if (testPassed && !completedAt) completedAt = Date.now();
  }
  const now = Date.now();
  await env.DB.prepare(`
    INSERT INTO onboarding_progress (uid, completed_lessons, test_score, test_passed, completed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(uid) DO UPDATE SET completed_lessons=excluded.completed_lessons, test_score=excluded.test_score,
      test_passed=excluded.test_passed, completed_at=excluded.completed_at, updated_at=excluded.updated_at
  `).bind(me.canonicalUid, JSON.stringify(completed), testScore, testPassed, completedAt, now).run();
  return json({ ok: true }, 200, request);
}

async function handleOnboardingStatus(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  if (me.role !== 'admin') return json({ error: "admin only" }, 403, request);
  await ensureOnboardingTable(env);
  const { results } = await env.DB.prepare(`
    SELECT u.uid, u.name, u.last_name, u.email, o.test_passed, o.test_score, o.completed_at, o.completed_lessons
      FROM users u LEFT JOIN onboarding_progress o ON o.uid = u.uid
     WHERE u.active = 1 ORDER BY u.last_name, u.name`).all();
  const items = (results || []).map(r => ({
    uid: r.uid,
    name: [r.name, r.last_name].filter(Boolean).join(' ') || r.email,
    email: r.email,
    testPassed: !!r.test_passed,
    testScore: r.test_score,
    completedAt: r.completed_at,
    lessonsCount: onbParseLessons(r.completed_lessons).length,
  }));
  return json({ ok: true, items }, 200, request);
}

// ════════════════════════════════════════════════════════════════════════
// ГРАФИКИ НА ГЛАВНОЙ — количество обращений/стартов по воронке и стадии.
// Конфиг графиков — глобальный (kv 'dashboard:charts'), правят админы.
// Данные: «новые сделки» (по дате создания) либо «вход в стадию» (по журналу).
// ════════════════════════════════════════════════════════════════════════
function _ymd(d) { return d.toISOString().slice(0, 10); }
// Якорь недели: четверг 14:00 Алматы (UTC+5) = четверг 09:00 UTC.
// Возвращает старт ТЕКУЩЕЙ (ещё не завершённой) недели — ближайший прошлый
// четверг-09:00-UTC, не позже now.
function weekAnchorThuUTC(now) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 9, 0, 0, 0));
  const back = (d.getUTCDay() - 4 + 7) % 7; // 4 = четверг
  d.setUTCDate(d.getUTCDate() - back);
  if (d.getTime() > now.getTime()) d.setUTCDate(d.getUTCDate() - 7);
  return d;
}
function buildChartBuckets(period, points) {
  const now = new Date();
  const RU_MON = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const buckets = [];
  if (period === 'week') {
    // Неделя: четверг 14:00 → следующий четверг 14:00 (Алматы). Последний бакет —
    // текущая незавершённая неделя (partial), её линией не соединяем на графике.
    const anchor = weekAnchorThuUTC(now);
    for (let i = points - 1; i >= 0; i--) {
      const ws = new Date(anchor); ws.setUTCDate(anchor.getUTCDate() - i * 7);
      const we = new Date(ws); we.setUTCDate(ws.getUTCDate() + 7);
      // Подпись — дата ОКОНЧАНИЯ недели (чт 14:00 Алматы). Так «16.07» = неделя,
      // завершившаяся 16.07 (завершена, в линии), а текущая = «23.07» (точка).
      const weAlm = new Date(we.getTime() + 5 * 3600 * 1000);
      const label = String(weAlm.getUTCDate()).padStart(2, '0') + '.' + String(weAlm.getUTCMonth() + 1).padStart(2, '0');
      buckets.push({ key: ws.toISOString(), start: ws.toISOString().slice(0, 10), startMs: ws.getTime(), endMs: we.getTime(), label, partial: i === 0 });
    }
  } else if (period === 'month') {
    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = d.toISOString().slice(0, 7);
      buckets.push({ key, start: key + '-01', label: RU_MON[d.getUTCMonth()], partial: i === 0 });
    }
  } else {
    for (let i = points - 1; i >= 0; i--) {
      const d = new Date(now); d.setUTCDate(d.getUTCDate() - i);
      const key = _ymd(d);
      buckets.push({ key, start: key, label: key.slice(8, 10) + '.' + key.slice(5, 7), partial: i === 0 });
    }
  }
  return buckets;
}
function countIntoBuckets(dates, buckets, period) {
  const counts = buckets.map(() => 0);
  for (const ds of dates) {
    if (!ds) continue;
    let idx = -1;
    if (period === 'month') idx = buckets.findIndex(b => b.key === ds.slice(0, 7));
    else if (period === 'week') {
      const t = Date.parse(ds);
      if (!isNaN(t)) idx = buckets.findIndex(b => t >= b.startMs && t < b.endMs);
    } else idx = buckets.findIndex(b => b.key === ds.slice(0, 10));
    if (idx >= 0) counts[idx]++;
  }
  return buckets.map((b, i) => ({ label: b.label, value: counts[i], partial: !!b.partial }));
}

async function handleChartsConfigGet(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const row = await env.DB.prepare("SELECT v FROM kv WHERE k = 'dashboard:charts'").first();
  let charts = []; try { charts = row && row.v ? JSON.parse(row.v) : []; } catch {}
  return json({ ok: true, charts }, 200, request);
}
async function handleChartsConfigPut(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  if (me.role !== 'admin') return json({ error: "admin only" }, 403, request);
  let body; try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const charts = Array.isArray(body.charts) ? body.charts.slice(0, 30).map(c => ({
    id: String(c.id || crypto.randomUUID()),
    name: String(c.name || 'График').slice(0, 80),
    pipeline: String(c.pipeline || ''),
    stage: String(c.stage || '__new__'),
    period: ['day', 'week', 'month'].includes(c.period) ? c.period : 'day',
    max: Math.max(0, parseInt(c.max, 10) || 0),
  })) : [];
  await env.DB.prepare("INSERT INTO kv (k, v) VALUES ('dashboard:charts', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(JSON.stringify(charts)).run();
  return json({ ok: true, charts }, 200, request);
}
async function handleChartsSeries(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await ensureStageEventsBackfill(env);
  const url = new URL(request.url);
  const pipeline = (url.searchParams.get('pipeline') || '').trim();
  const stage = (url.searchParams.get('stage') || '__new__').trim();
  const period = ['day', 'week', 'month'].includes(url.searchParams.get('period')) ? url.searchParams.get('period') : 'day';
  const points = Math.min(24, Math.max(2, parseInt(url.searchParams.get('points') || '7', 10) || 7));
  if (!pipeline) return json({ ok: false, error: "pipeline required" }, 400, request);
  // Первая стадия воронки — для неё «вход» эквивалентен созданию (точная история).
  let firstStage = null;
  try {
    const pr = await env.DB.prepare("SELECT stages FROM pipelines WHERE id = ?").bind(pipeline).first();
    if (pr && pr.stages) {
      const st = JSON.parse(pr.stages);
      const arr = Object.entries(st).map(([id, v]) => ({ id, sort: (v && v.sort) || 0 })).sort((a, b) => a.sort - b.sort);
      firstStage = arr.length ? arr[0].id : null;
    }
  } catch {}
  const usesCreated = stage === '__new__' || (firstStage && stage === firstStage);
  const buckets = buildChartBuckets(period, points);
  const minDate = buckets[0].start;
  let rows = [];
  try {
    // Полный таймстамп (не substr): для недельных бакетов нужна точность до
    // времени (граница четверг 14:00). Для day/month countIntoBuckets режет сам.
    if (usesCreated) {
      const r = await env.DB.prepare("SELECT bitrix_date_create AS d FROM deals WHERE pipeline_id = ? AND bitrix_date_create >= ?").bind(pipeline, minDate).all();
      rows = r.results || [];
    } else {
      const r = await env.DB.prepare("SELECT entered_at AS d FROM deal_stage_events WHERE pipeline_id = ? AND stage_id = ? AND entered_at >= ?").bind(pipeline, stage, minDate).all();
      rows = r.results || [];
    }
  } catch (e) { return json({ ok: false, error: String(e && e.message || e) }, 500, request); }
  const series = countIntoBuckets(rows.map(x => x.d), buckets, period);
  return json({ ok: true, series, period, usesCreated }, 200, request);
}

// Публичная агрегированная серия для внутреннего App Pllato.
// Возвращает только недельные количества созданных сделок — без названий,
// контактов, ответственных и любых других персональных данных.
async function handlePublicPllatoInquiries(request, env) {
  const url = new URL(request.url);
  const points = Math.min(16, Math.max(4, parseInt(url.searchParams.get('points') || '8', 10) || 8));
  const pipeline = await env.DB.prepare(
    "SELECT id FROM pipelines WHERE name = ? LIMIT 1"
  ).bind("Pllato Старт").first();
  if (!pipeline?.id) return json({ ok: false, error: "pipeline not found" }, 404, request);
  const buckets = buildChartBuckets('week', points);
  const minDate = buckets[0].start;
  const result = await env.DB.prepare(
    "SELECT bitrix_date_create AS d FROM deals WHERE pipeline_id = ? AND bitrix_date_create >= ?"
  ).bind(pipeline.id, minDate).all();
  const series = countIntoBuckets((result.results || []).map((row) => row.d), buckets, 'week');
  return json({
    ok: true,
    series,
    period: 'week',
    boundary: { weekday: 4, hour: 14, timeZone: 'Asia/Almaty' },
  }, 200, request);
}

// Публичная обезличенная серия для КЭП: уникальная сделка учитывается один раз
// по первому входу в «Создание Демо» или «Показ Демо».
async function handlePublicPllatoKep(request, env) {
  const url = new URL(request.url);
  const points = Math.min(16, Math.max(4, parseInt(url.searchParams.get('points') || '8', 10) || 8));
  await ensureStageEventsBackfill(env);
  const pipeline = await env.DB.prepare(
    "SELECT id, stages FROM pipelines WHERE name = ? LIMIT 1"
  ).bind("Pllato Старт").first();
  if (!pipeline?.id) return json({ ok: false, error: "pipeline not found" }, 404, request);
  let stages = {};
  try { stages = JSON.parse(pipeline.stages || '{}'); } catch {}
  const targetNames = new Set(['создание демо', 'показ демо']);
  const stageIds = Object.entries(stages)
    .filter(([, stage]) => targetNames.has(String(stage?.name || '').trim().toLowerCase()))
    .map(([id]) => id);
  if (stageIds.length !== 2) return json({ ok: false, error: "KEP stages not found" }, 404, request);
  const buckets = buildChartBuckets('week', points);
  const minDate = buckets[0].start;
  const result = await env.DB.prepare(`
    SELECT first_entered_at AS d FROM (
      SELECT deal_id, MIN(entered_at) AS first_entered_at
      FROM deal_stage_events
      WHERE pipeline_id = ? AND stage_id IN (?, ?)
      GROUP BY deal_id
    )
    WHERE first_entered_at >= ?
  `).bind(pipeline.id, stageIds[0], stageIds[1], minDate).all();
  const series = countIntoBuckets((result.results || []).map((row) => row.d), buckets, 'week');
  return json({
    ok: true,
    series,
    period: 'week',
    stages: ['Создание Демо', 'Показ Демо'],
    boundary: { weekday: 4, hour: 14, timeZone: 'Asia/Almaty' },
  }, 200, request);
}

// GET /api/sip/route?phone=77073320409 — Asterisk дёргает при входящем.
// Возвращает: { extensions: ["101","102"], mobile: "+7...", fallbackSeconds: 30 }
// Логика: phone → contact → recent open deal → responsible_uid → org-tree node →
// node.callDistribution rules.
//
// Без сделки — корневое правило (директора), либо ring-all всех зарегистрированных.
async function handleSipRoute(request, env) {
  // Asterisk не умеет Firebase Auth → shared secret в query или header
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret') || request.headers.get('x-sip-route-secret') || '';
  if (!env.SIP_ROUTE_SECRET || secret !== env.SIP_ROUTE_SECRET) {
    return json({ error: "invalid secret" }, 401, request);
  }
  const phoneRaw = url.searchParams.get('phone') || '';
  const phone = phoneRaw.replace(/\D/g, '');
  if (!phone) return json({ error: "phone required" }, 400, request);

  // 1) Найти контакт по phone (LIKE по JSON-полю phones)
  const contact = await env.DB.prepare(
    "SELECT id FROM contacts WHERE phones LIKE ? LIMIT 1"
  ).bind(`%${phone}%`).first();
  let responsibleUid = null;
  let dealInfo = null;
  if (contact) {
    // 2) Самая свежая открытая сделка с этим контактом
    const deal = await env.DB.prepare(
      "SELECT id, responsible_uid, pipeline_id FROM deals WHERE contact_id = ? AND closed = 0 ORDER BY bitrix_date_modify DESC LIMIT 1"
    ).bind(contact.id).first();
    if (deal) {
      responsibleUid = deal.responsible_uid || null;
      dealInfo = { id: deal.id, pipelineId: deal.pipeline_id };
    }
  }

  // 3) Загрузить org structure и extensions
  const [structRow, extRow] = await Promise.all([
    env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind('org:structure').first(),
    env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind('org:extensions').first(),
  ]);
  let structure = null, extensions = {};
  try { structure = structRow?.v ? JSON.parse(structRow.v) : null; } catch {}
  try { extensions = extRow?.v ? JSON.parse(extRow.v) : {}; } catch {}

  // 4) Найти узел где ответственный — головной или участник
  let nodeRule = null;
  if (responsibleUid && structure) {
    nodeRule = findCallDistributionForUid(structure, responsibleUid);
  }
  // Fallback: корневое правило (на директоре)
  if (!nodeRule && structure) {
    nodeRule = structure.callDistribution || null;
  }

  // 5) Применить правило: mode = responsible | list | mobile | ring-all
  const mode = nodeRule?.mode || (responsibleUid ? 'responsible' : 'ring-all');
  let extsToRing = [];
  let mobile = nodeRule?.mobile || null;
  const fallbackSeconds = nodeRule?.fallbackSeconds || 30;

  if (mode === 'responsible') {
    if (responsibleUid && extensions[responsibleUid]) extsToRing.push(extensions[responsibleUid]);
    if (extsToRing.length === 0) {
      // Нет extension у ответственного → fallback на список или ring-all
      if (Array.isArray(nodeRule?.listUids)) {
        extsToRing = nodeRule.listUids.map(u => extensions[u]).filter(Boolean);
      }
      if (extsToRing.length === 0) extsToRing = Object.values(extensions);
    }
  } else if (mode === 'list') {
    extsToRing = (nodeRule?.listUids || []).map(u => extensions[u]).filter(Boolean);
  } else if (mode === 'mobile') {
    // Не звоним внутри, только переадресация на мобильный
    extsToRing = [];
  } else {
    // ring-all
    extsToRing = Object.values(extensions);
  }

  return json({
    ok: true,
    phone,
    responsibleUid,
    dealId: dealInfo?.id || null,
    mode,
    extensions: [...new Set(extsToRing)],
    mobile,
    fallbackSeconds,
  }, 200, request);
}

// Walk org tree до узла где uid = headUid или есть в memberUids.
// Возвращает callDistribution этого узла или null (тогда применяется родительский /
// корневой default).
function findCallDistributionForUid(structure, uid) {
  if (!structure || !uid) return null;
  let found = null;
  function walk(node) {
    if (found) return;
    const isHere = node.headUid === uid || (node.memberUids || []).includes(uid);
    if (isHere && node.callDistribution) {
      found = node.callDistribution;
      return;
    }
    const children = node.subDepartments || node.departments || [];
    for (const c of children) walk(c);
  }
  for (const branch of (structure.branches || [])) walk(branch);
  return found;
}

// ── Приглашения новых сотрудников ──────────────────────────────────────
// Идемпотентная миграция: колонка name появилась позже (приглашение по
// телефону+имени без обязательного email). Применяем через D1-binding, т.к.
// деплой-токен не имеет прав на D1 API (wrangler d1 execute → 7403).
let _inviteNameColEnsured = false;
async function ensureInviteNameColumn(env) {
  if (_inviteNameColEnsured) return;
  try { await env.DB.prepare("ALTER TABLE team_invites ADD COLUMN name TEXT").run(); }
  catch (e) { /* колонка уже есть — ок */ }
  _inviteNameColEnsured = true;
}

// users.phones — JSON-массив доп. телефонов сотрудника ["+7...","+7..."].
// users.phone остаётся «основным» (первый из списка) для обратной совместимости.
// Self-миграция через D1-биндинг (деплой-токен не имеет прав на D1 API → 7403).
let _userPhonesColEnsured = false;
async function ensureUserPhonesColumn(env) {
  if (_userPhonesColEnsured) return;
  try { await env.DB.prepare("ALTER TABLE users ADD COLUMN phones TEXT").run(); }
  catch (e) { /* колонка уже есть — ок */ }
  _userPhonesColEnsured = true;
}

// POST /api/invites { phone, name, email, dept_path, head_uid, role }
// → создаёт row в team_invites + отправляет WA с invite-ссылкой.
// Ссылка: https://pllato.kz/team.html#invite/<token>
async function handleInviteCreate(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  if (me.role !== 'admin' && !me.orgPerms?.isDirector && !me.orgPerms?.hasAnyNode) {
    return json({ error: "forbidden — только admin/глава отдела" }, 403, request);
  }
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const phone = String(body.phone || '').replace(/\D/g, '');
  // Email теперь НЕОБЯЗАТЕЛЕН: приглашающий вводит только телефон+имя, а сотрудник
  // сам войдёт своим Google-аккаунтом (его почта станет рабочей). Если админ всё
  // же знает Gmail — впишет, тогда приём строго сверит email (как раньше).
  const email = String(body.email || '').toLowerCase().trim();
  const name = String(body.name || '').trim().slice(0, 80);
  const deptPath = String(body.dept_path || '').trim();
  const headUid = body.head_uid || null;
  const role = ['admin', 'manager', 'agent'].includes(body.role) ? body.role : 'agent';
  if (!phone || phone.length < 10) return json({ error: "phone required (10+ digits)" }, 400, request);
  if (email && !email.includes('@')) return json({ error: "email указан неверно" }, 400, request);
  if (!deptPath) return json({ error: "dept_path required" }, 400, request);

  // Если email указан — проверим что такого сотрудника ещё нет. Без email
  // дедуп произойдёт при приёме по фактической Google-почте.
  if (email) {
    const existing = await env.DB.prepare("SELECT uid FROM users WHERE LOWER(email) = ?").bind(email).first();
    if (existing) return json({ error: `сотрудник с email ${email} уже есть` }, 409, request);
  }

  // Token: 22 base64url-like chars
  const token = 'inv_' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join('');
  const ts = Date.now();
  const expires = ts + 7 * 24 * 3600 * 1000;

  await ensureInviteNameColumn(env);
  await env.DB.prepare(`
    INSERT INTO team_invites (token, phone, email, name, dept_path, head_uid, role, invited_by, status, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).bind(token, phone, email, name, deptPath, headUid, role, me.canonicalUid || me.firebaseUid, ts, expires).run();

  // Отправляем WA
  const inviteUrl = `https://pllato.kz/team.html#invite/${token}`;
  const portalUrl = `https://pllato.kz/team.html`;
  const inviterName = me.userRecord?.name ? `${me.userRecord.name} ${me.userRecord.last_name || ''}`.trim() : 'Pllato CRM';
  const greet = name ? `👋 Привет, ${name.split(/\s+/)[0]}!` : '👋 Привет!';
  const loginNote = email
    ? `войди через свой Google-аккаунт ${email}`
    : `войди через свой Google-аккаунт (он станет твоей рабочей почтой)`;
  const text =
`${greet}

${inviterName} приглашает тебя в команду на платформу pllato.kz 🎉

1️⃣ Открой ссылку-приглашение и ${loginNote}:
${inviteUrl}

2️⃣ После входа добавь своё фото — и всё, ты в системе, в своём отделе.

📲 Заходить в портал дальше — всегда по этой ссылке (тем же Google-аккаунтом):
${portalUrl}
Совет: открой её в браузере телефона и «Добавить на главный экран» — будет как приложение.

⏳ Ссылка-приглашение действует 7 дней.`;

  let waMessageId = null;
  let waError = null;
  // Предпочитаем системный оповещатель (если подключён), иначе — первый активный
  // inbox-канал. getNotifierConfig инкапсулирует оба варианта.
  try {
    const cfg = await getNotifierConfig(env);
    if (cfg) {
      waMessageId = await deliverNotifierRaw(cfg, phone, text);
      await logNotify(env, { uid: null, phone, event: 'invite', text: 'invite', link: inviteUrl, status: 'sent', wa_message_id: waMessageId });
    } else {
      waError = "Нет активного WhatsApp канала — ссылка создана, отправь вручную";
    }
  } catch (e) {
    waError = "Ошибка отправки WA: " + e.message;
    await logNotify(env, { uid: null, phone, event: 'invite', text: 'invite', link: inviteUrl, status: 'failed', error: e.message });
  }

  if (waMessageId) {
    await env.DB.prepare("UPDATE team_invites SET wa_message_id = ? WHERE token = ?")
      .bind(waMessageId, token).run();
  }

  return json({
    ok: true, token, inviteUrl,
    waMessageId,
    waError,  // если есть — фронт покажет fallback
  }, 200, request);
}

// GET /api/invites/:token — публично (без auth), возвращает мета приёмнику
async function handleInviteGet(request, env, token) {
  await ensureInviteNameColumn(env);
  const row = await env.DB.prepare(`
    SELECT token, phone, email, name, dept_path, head_uid, role, status, expires_at
    FROM team_invites WHERE token = ?
  `).bind(token).first();
  if (!row) return json({ error: "invite not found" }, 404, request);
  if (row.status !== 'pending') return json({ error: `invite ${row.status}`, status: row.status }, 410, request);
  if (Date.now() > row.expires_at) {
    await env.DB.prepare("UPDATE team_invites SET status = 'expired' WHERE token = ?").bind(token).run();
    return json({ error: "invite expired" }, 410, request);
  }
  // Резолвим имена отдела + руководителя
  let deptLabel = 'отдел';
  let headLabel = null;
  try {
    const structRow = await env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind('org:structure').first();
    if (structRow?.v) {
      const structure = JSON.parse(structRow.v);
      const node = getOrgNodeByPath(structure, row.dept_path);
      if (node) deptLabel = node.name || node.title || 'отдел';
    }
    if (row.head_uid) {
      const u = await env.DB.prepare("SELECT name, last_name FROM users WHERE uid = ?").bind(row.head_uid).first();
      if (u) headLabel = [u.name, u.last_name].filter(Boolean).join(' ').trim() || null;
    }
  } catch (e) { /* ignore */ }
  return json({
    ok: true,
    email: row.email || null,
    hasEmail: !!(row.email && String(row.email).trim()),
    name: row.name || null,
    role: row.role,
    deptLabel,
    headLabel,
    expiresAt: row.expires_at,
  }, 200, request);
}

// Walk org tree по path-strings типа "branches.0.departments.1"
function getOrgNodeByPath(structure, path) {
  if (!structure || !path) return null;
  const parts = path.split('.');
  let cur = structure;
  for (const p of parts) {
    if (cur == null) return null;
    cur = cur[p];
  }
  return cur;
}

// POST /api/invites/:token/accept (auth required)
// Юзер уже вошёл в Firebase, его email должен совпасть с invite.email
async function handleInviteAccept(request, env, token) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const userEmail = (auth.email || '').toLowerCase().trim();
  const firebaseUid = auth.uid;

  const inv = await env.DB.prepare(`
    SELECT * FROM team_invites WHERE token = ? AND status = 'pending'
  `).bind(token).first();
  if (!inv) return json({ error: "invite not found or already used" }, 404, request);
  if (Date.now() > inv.expires_at) return json({ error: "invite expired" }, 410, request);
  // Если в invite задана почта — должна совпасть с залогиненным аккаунтом.
  // Если почты нет (приглашение по телефону+имени) — принимаем любой Google-аккаунт,
  // его email становится рабочей почтой сотрудника.
  const presetEmail = (inv.email || '').toLowerCase().trim();
  if (presetEmail && userEmail !== presetEmail) {
    return json({ error: `этот invite для ${inv.email}, ты вошёл как ${userEmail}` }, 403, request);
  }

  let body = {};
  try { body = await request.json(); } catch {}
  const name = (String(body.name || '').trim() || String(inv.name || '').trim()).slice(0, 80);
  const photo = String(body.photo || '').trim().slice(0, 500) || null;
  // Телефон из приглашения — для WhatsApp-оповещений сотруднику (нотификатор
  // шлёт на users.phone/phones). Без него WA-уведомления не доходят.
  const invPhoneNorm = inv.phone ? normalizePhoneKZ(inv.phone) : null;
  const invPhonesJson = invPhoneNorm ? JSON.stringify([invPhoneNorm]) : null;

  // 1) Создаём / апдейтим users (canonical uid = firebase uid для новых)
  // Если случайно есть запись с этим email — переиспользуем её uid
  const existing = await env.DB.prepare("SELECT uid FROM users WHERE LOWER(email) = ?").bind(userEmail).first();
  const canonicalUid = existing?.uid || firebaseUid;
  if (!existing) {
    const parts = name.split(/\s+/);
    const firstName = parts[0] || name || userEmail.split('@')[0];
    const lastName = parts.slice(1).join(' ') || '';
    await env.DB.prepare(`
      INSERT INTO users (uid, email, name, last_name, photo, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).bind(firebaseUid, userEmail, firstName, lastName, photo).run();
  } else if (name || photo) {
    const parts = name.split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ');
    await env.DB.prepare(`
      UPDATE users SET name = COALESCE(NULLIF(?, ''), name),
                       last_name = COALESCE(NULLIF(?, ''), last_name),
                       photo = COALESCE(NULLIF(?, ''), photo)
      WHERE uid = ?
    `).bind(firstName, lastName, photo, canonicalUid).run();
  }

  // 1.5) Телефон из приглашения → карточка сотрудника, если ещё не задан. Без
  // него нотификатор не шлёт WhatsApp-оповещения, а фронт держит модалку
  // «введите телефон», которая глушит запрос пушей. Ставим оба поля.
  if (invPhoneNorm) {
    try {
      await env.DB.prepare(
        "UPDATE users SET phone = COALESCE(NULLIF(phone,''), ?), phones = COALESCE(phones, ?) WHERE uid = ?"
      ).bind(invPhoneNorm, invPhonesJson, canonicalUid).run();
    } catch (e) { console.warn('[invite] set phone failed:', e.message); }
  }

  // 2) user_roles
  await env.DB.prepare(`
    INSERT INTO user_roles (uid, role, granted_by, granted_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(uid) DO UPDATE SET role = excluded.role
  `).bind(canonicalUid, inv.role, inv.invited_by, new Date().toISOString()).run();

  // 3) Добавляем в org-structure node.memberUids[]
  const structRow = await env.DB.prepare("SELECT v FROM kv WHERE k = ?").bind('org:structure').first();
  if (structRow?.v) {
    try {
      const structure = JSON.parse(structRow.v);
      const node = getOrgNodeByPath(structure, inv.dept_path);
      if (node) {
        if (!Array.isArray(node.memberUids)) node.memberUids = [];
        if (!node.memberUids.includes(canonicalUid)) node.memberUids.push(canonicalUid);
        await env.DB.prepare(`
          INSERT INTO kv (k, v) VALUES ('org:structure', ?)
          ON CONFLICT(k) DO UPDATE SET v = excluded.v
        `).bind(JSON.stringify(structure)).run();
        // Текстовое поле «Отдел» у пользователя — чтобы при принятии он сразу
        // показывался в нужном отделе и в списке «Сотрудники» (а не «без отдела»).
        if (node.name) {
          try {
            await env.DB.prepare("UPDATE users SET department = ? WHERE uid = ?")
              .bind(String(node.name), canonicalUid).run();
          } catch (e2) { console.warn('[invite] set users.department failed:', e2.message); }
        }
      } else {
        console.warn('[invite] dept_path node not found:', inv.dept_path);
      }
    } catch (e) { console.warn('[invite] org tree update failed:', e); }
  }

  // 4) Помечаем invite принятым
  await env.DB.prepare(`
    UPDATE team_invites SET status = 'accepted', accepted_uid = ?, accepted_at = ? WHERE token = ?
  `).bind(canonicalUid, Date.now(), token).run();

  return json({ ok: true, canonicalUid, email: userEmail, role: inv.role }, 200, request);
}

// GET /api/invites — список invites (admin/глава отдела)
async function handleInvitesList(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  if (me.role !== 'admin' && !me.orgPerms?.hasAnyNode) {
    return json({ error: "forbidden" }, 403, request);
  }
  const { results } = await env.DB.prepare(`
    SELECT token, phone, email, dept_path, role, status, created_at, expires_at, accepted_at
    FROM team_invites ORDER BY created_at DESC LIMIT 100
  `).all();
  return json({ items: results }, 200, request);
}

// POST /api/invites/:token/revoke
async function handleInviteRevoke(request, env, token) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  await env.DB.prepare("UPDATE team_invites SET status = 'revoked' WHERE token = ? AND status = 'pending'")
    .bind(token).run();
  return json({ ok: true }, 200, request);
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
// POST /api/deals/comments-preview  { ids: ["deal_X", "deal_Y", ...] }
// Response: { items: { "deal_X": [{ text, authorName, authorUid, ts }, ...до 3 свежих], ... } }
// Для канбан-карточки: показать последние 3 комментария не открывая сделку.
// Источник — timeline_activities (activity_type='comment'). Окно ROW_NUMBER
// берёт 3 новейших на сделку. authorName из payload (fallback на uid фронт сам
// резолвит через getUserById).
async function handleDealsCommentsPreview(request, env) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const ids = Array.isArray(body.ids) ? body.ids.filter(s => typeof s === 'string').slice(0, 500) : [];
  if (ids.length === 0) return json({ items: {} }, 200, request);
  const dealIds = ids.map(s => s.startsWith('deal_') ? s : 'deal_' + s);

  const items = {};
  const chunkSize = 50;
  for (let i = 0; i < dealIds.length; i += chunkSize) {
    const chunk = dealIds.slice(i, i + chunkSize);
    const ph = chunk.map(() => "?").join(",");
    const { results } = await env.DB.prepare(
      `SELECT owner_id, author_uid AS authorUid, payload, ts FROM (
         SELECT owner_id, author_uid, payload,
           COALESCE(bitrix_created, created_at) AS ts,
           ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY COALESCE(bitrix_created, created_at) DESC) AS rn
         FROM timeline_activities
         WHERE owner_type='deal' AND activity_type='comment' AND owner_id IN (${ph})
       ) WHERE rn <= 3
       ORDER BY owner_id, ts DESC`
    ).bind(...chunk).all();
    for (const r of (results || [])) {
      const p = r.payload ? tryParseJson(r.payload) : null;
      const text = (p && p.text != null) ? String(p.text) : "";
      if (!text.trim()) continue;
      const authorName = (p && (p.authorName || p.authorEmail)) ? String(p.authorName || p.authorEmail) : "";
      (items[r.owner_id] || (items[r.owner_id] = [])).push({
        text, authorName, authorUid: r.authorUid || null, ts: r.ts,
      });
    }
  }
  return json({ items, total: Object.keys(items).length }, 200, request);
}

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

// GET /api/tasks/:id/full — полная карточка задачи. Гарантированно парсит
// все JSON-поля (comments_data, accomplices, crm_links, …) ✓ возвращает
// subtasks (где parent_id = id или bitrix_parent_id = bitrix_id) и files.
async function handleTaskFull(request, env, taskId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);

  // 1) Сама задача
  const row = await env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(taskId).first();
  if (!row) return json({ error: "task not found" }, 404, request);

  // Парсим все JSON-поля явно
  const safeParseObj = (s) => {
    if (!s || typeof s !== 'string') return s || null;
    try { return JSON.parse(s); } catch { return null; }
  };
  const task = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (['comments_data','accomplices','auditors','crm_links','bitrix_crm_links','bitrix_file_ids'].includes(k)) {
      task[camel] = safeParseObj(v);
    } else {
      task[camel] = v;
    }
  }

  // 2) Subtasks (по parent_id или bitrix_parent_id)
  const { results: subRows } = await env.DB.prepare(`
    SELECT id, title, status, priority, deadline, responsible_uid, comments_count
    FROM tasks
    WHERE (parent_id = ? OR (bitrix_parent_id IS NOT NULL AND bitrix_parent_id = ?))
      AND id != ?
    ORDER BY bitrix_created_date ASC LIMIT 200
  `).bind(taskId, row.bitrix_id || '', taskId).all();
  const subtasks = subRows.map(r => ({
    id: r.id, title: r.title, status: String(r.status || '1'),
    priority: String(r.priority || '1'), deadline: r.deadline,
    responsibleUid: r.responsible_uid, commentsCount: r.comments_count || 0,
  }));

  // 3) Files metadata (если есть)
  let files = [];
  const fileIds = task.bitrixFileIds;
  if (Array.isArray(fileIds) && fileIds.length > 0) {
    const ph = fileIds.map(() => '?').join(',');
    const { results: fRows } = await env.DB.prepare(
      `SELECT file_id, file_name, file_size, content_type, migrated FROM files_queue WHERE file_id IN (${ph})`
    ).bind(...fileIds.map(String)).all();
    files = fRows.map(f => ({
      fileId: f.file_id, fileName: f.file_name, fileSize: f.file_size,
      contentType: f.content_type, migrated: !!f.migrated,
    }));
  }

  // 4) Comments — преобразуем object → отсортированный массив + парсим files каждого
  const commentsObj = task.commentsData || {};
  const comments = Object.values(commentsObj)
    .filter(c => c && typeof c === 'object')
    .map(c => ({
      bitrixId: c.bitrixId,
      authorUid: c.authorUid,
      authorName: c.authorName,
      bitrixAuthorId: c.bitrixAuthorId,
      bitrixPostDate: c.bitrixPostDate,
      text: c.text || '',
      attachedFileIds: c.attachedFileIds || [],
      hasFiles: !!c.hasFiles,
    }))
    .sort((a, b) => (a.bitrixPostDate || '').localeCompare(b.bitrixPostDate || ''));

  return json({ ok: true, task, subtasks, files, comments }, 200, request);
}

// ── Интеграция с порталом skills.myelc.net ──────────────────────────────
// POST /api/skills/report — портал постит отчёт (оплата, пропуск, перенос,
// баланс, новый студент …) в ленту подзадачи нужного филиала. Воспроизводит
// старую связку Bitrix `task.item.list` + `task.commentitem.add` из
// BitrixLoggerController.php:
//   parent      = bitrix_id родительской задачи-категории (напр. 5494 «Опоздания/пропуски»),
//                 ровно тот номер, что у портала уже прописан в $permaTasksId;
//   affiliate_id= номер филиала → ищем подзадачу с "[affiliate_id]" в названии;
//   text        = тот же текст поста, что слался в Bitrix.
//   (либо task_bitrix_id — напрямую в конкретную подзадачу, без поиска).
// Пост дописывается в tasks.comments_data в том же формате, что читает /full,
// поэтому появляется в карточке задачи как обычный комментарий ленты.
// Авторизация: shared-secret env.SKILLS_INGEST_SECRET (портал не умеет Firebase).
// Токен принимаем в Authorization: Bearer / ?token= / x-skills-token.
async function handleSkillsReport(request, env) {
  const url = new URL(request.url);
  const hdr = request.headers.get('Authorization') || '';
  const bearer = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
  const token = bearer || url.searchParams.get('token') || request.headers.get('x-skills-token') || '';
  if (!env.SKILLS_INGEST_SECRET) {
    return json({ error: "skills integration not configured (set SKILLS_INGEST_SECRET secret)" }, 503, request);
  }
  if (!token || token !== env.SKILLS_INGEST_SECRET) {
    return json({ error: "invalid token" }, 401, request);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }

  const text = String(body.text || '').trim();
  if (!text) return json({ error: "text required" }, 400, request);
  if (text.length > 20000) return json({ error: "text too long (max 20000)" }, 413, request);
  const author = String(body.author || 'SKILLS.myelc.net').slice(0, 200);
  const occurredAt = body.occurred_at ? String(body.occurred_at).slice(0, 40) : new Date().toISOString();

  // Найти целевую подзадачу: либо напрямую по bitrix_id, либо по (parent + филиал).
  // Включаем title + responsible_uid в SELECT — нужны для нотификации после.
  let task = null;
  const directBitrixId = body.task_bitrix_id != null ? String(body.task_bitrix_id).trim() : '';
  if (directBitrixId) {
    task = await env.DB.prepare(
      "SELECT id, bitrix_id, title, responsible_uid, comments_data, comments_count FROM tasks WHERE bitrix_id = ? LIMIT 1"
    ).bind(directBitrixId).first();
    if (!task) return json({ error: "task not found by task_bitrix_id", task_bitrix_id: directBitrixId }, 404, request);
  } else {
    const parent = body.parent != null ? String(body.parent).trim() : '';
    const affiliateId = body.affiliate_id != null ? String(body.affiliate_id).trim() : '';
    if (!parent || !affiliateId) {
      return json({ error: "provide task_bitrix_id, or both parent and affiliate_id" }, 400, request);
    }
    // Подзадача филиала: bitrix_parent_id = parent, в названии "[affiliate_id]"
    // (LIKE-экранирование не нужно — affiliate_id числовой).
    task = await env.DB.prepare(
      "SELECT id, bitrix_id, title, responsible_uid, comments_data, comments_count FROM tasks WHERE bitrix_parent_id = ? AND title LIKE ? ORDER BY bitrix_created_date DESC LIMIT 1"
    ).bind(parent, `%[${affiliateId}]%`).first();
    if (!task) {
      return json({ error: "affiliate subtask not found", parent, affiliate_id: affiliateId }, 404, request);
    }
  }

  // Дописать пост в comments_data (тот же формат, что читает handleTaskFull).
  let comments = {};
  try { comments = task.comments_data ? JSON.parse(task.comments_data) : {}; } catch { comments = {}; }
  if (!comments || typeof comments !== 'object' || Array.isArray(comments)) comments = {};
  const key = 'skills_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  comments[key] = {
    bitrixId: key,
    authorUid: null,
    authorName: author,
    bitrixAuthorId: null,
    bitrixPostDate: occurredAt,
    text,
    attachedFileIds: [],
    hasFiles: false,
    source: 'skills_portal',
  };
  const newCount = Object.keys(comments).length;
  await env.DB.prepare(
    "UPDATE tasks SET comments_data = ?, comments_count = ?, comments_actual_count = ? WHERE id = ?"
  ).bind(JSON.stringify(comments), newCount, newCount, task.id).run();

  await auditLog(env, { canonicalUid: 'skills_portal', email: author }, "skills_report", "task", task.id, { commentKey: key, occurredAt });

  // Уведомление ответственному за подзадачу — чтобы он сразу видел что портал
  // прислал событие, а не узнавал случайно открыв задачу. Использует общую
  // систему createNotification: D1 запись + real-time broadcast в открытые
  // вкладки + Web Push на смартфон + дублирование в WhatsApp (если настроено).
  // Не блокируем основной ответ — ошибки логируем но не возвращаем.
  if (task.responsible_uid) {
    try {
      // Превью текста: первые 200 символов, без markdown-разметки в превью.
      const preview = text.replace(/\s+/g, ' ').slice(0, 200).trim();
      await createNotification(env, {
        uid: task.responsible_uid,
        type: 'skills_report',
        title: `📥 ${author}: новое событие в «${(task.title || '').slice(0, 80)}»`,
        body: preview,
        link: `/team.html?page=tasks&task=${encodeURIComponent(task.id)}`,
        icon: '📥',
        actorUid: null,  // системный источник, не реальный пользователь
        entityType: 'task',
        entityId: task.id,
      });
    } catch (e) {
      console.warn('[skills_report] notification failed:', e && e.message);
    }
  }

  return json({ ok: true, taskId: task.id, bitrixId: task.bitrix_id, commentKey: key, commentsCount: newCount }, 200, request);
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

// ── /api/analytics/funnels — агрегаты для дашборда на «Главной» ────────────
// По каждой активной воронке: распределение по стадиям (count + выручка),
// приток новых по неделям (8 нед) и за 7 дней, список won/lost-стадий и
// средний цикл выигранной сделки (дни create→текущая стадия). Архивные
// исключаются (ELC: 100k→33k). Не-админ видит только разрешённые воронки.
function _wonLostFromStages(stagesJson) {
  const won = [], lost = [];
  try {
    const st = JSON.parse(stagesJson || '{}');
    for (const k of Object.keys(st)) {
      const sem = st[k] && st[k].semantics;
      if (sem === 'S') won.push(k);
      else if (sem === 'F') lost.push(k);
    }
  } catch {}
  return { won, lost };
}

async function handleAnalyticsFunnels(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);

  let allowed = null;
  if (me.role !== 'admin' && me.orgPerms && Array.isArray(me.orgPerms.pipelineIds)) {
    allowed = new Set(me.orgPerms.pipelineIds);
  }

  const { results: pipes } = await env.DB.prepare(
    "SELECT id, name, stages FROM pipelines WHERE is_active = 1 ORDER BY name"
  ).all();

  const ARCHF = "(archived IS NULL OR archived = 0)";
  const since8w = new Date(Date.now() - 8 * 7 * 86400000).toISOString();
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const out = {};
  for (const p of (pipes || [])) {
    if (allowed && !allowed.has(p.id)) continue;
    // распределение по стадиям + выручка
    const { results: rows } = await env.DB.prepare(
      `SELECT stage_id AS s, COUNT(*) AS n, COALESCE(SUM(opportunity),0) AS rev FROM deals WHERE pipeline_id = ? AND ${ARCHF} GROUP BY stage_id`
    ).bind(p.id).all();
    const stages = {}; let total = 0;
    for (const r of (rows || [])) { stages[r.s] = { count: r.n, rev: r.rev }; total += r.n; }
    // приток новых по неделям (для спарклайна)
    const { results: wk } = await env.DB.prepare(
      `SELECT strftime('%Y-%W', substr(bitrix_date_create,1,10)) AS wk, COUNT(*) AS n FROM deals WHERE pipeline_id = ? AND ${ARCHF} AND bitrix_date_create >= ? GROUP BY wk ORDER BY wk`
    ).bind(p.id, since8w).all();
    // новые за 7 дней
    const nw = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM deals WHERE pipeline_id = ? AND ${ARCHF} AND bitrix_date_create >= ?`
    ).bind(p.id, since7).first();
    // средний цикл по выигранным
    const { won, lost } = _wonLostFromStages(p.stages);
    let avgCycleDays = null;
    if (won.length) {
      const ph = won.map(() => '?').join(',');
      const cyc = await env.DB.prepare(
        `SELECT AVG(julianday(substr(COALESCE(stage_changed_at, bitrix_date_modify),1,19)) - julianday(substr(bitrix_date_create,1,19))) AS d
         FROM deals WHERE pipeline_id = ? AND ${ARCHF} AND stage_id IN (${ph}) AND bitrix_date_create IS NOT NULL`
      ).bind(p.id, ...won).first();
      if (cyc && cyc.d != null && cyc.d >= 0) avgCycleDays = Math.round(cyc.d * 10) / 10;
    }
    out[p.id] = {
      name: p.name, total, stages,
      newByWeek: (wk || []).map(x => ({ wk: x.wk, n: x.n })),
      newLast7: (nw && nw.n) || 0,
      wonStages: won, lostStages: lost, avgCycleDays,
    };
  }
  return json({ ok: true, pipelines: out, generatedAt: new Date().toISOString() }, 200, request);
}

// Ленивая идемпотентная миграция: метка последнего захода + метка авто-приостановки.
let _lastSeenColReady = false;
async function ensureLastSeenColumn(env) {
  if (_lastSeenColReady) return;
  try { await env.DB.prepare("ALTER TABLE users ADD COLUMN last_seen_at INTEGER").run(); }
  catch (e) { /* колонка уже есть — норма */ }
  try { await env.DB.prepare("ALTER TABLE users ADD COLUMN auto_suspended_at INTEGER").run(); }
  catch (e) { /* колонка уже есть — норма */ }
  _lastSeenColReady = true;
}

async function handleMe(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ ok: false, error: auth.error }, auth.status, request);

  const me = await resolveCanonicalUser(env, auth.claims);

  // Авто-приостановка доступа (БЕЗОПАСНЫЙ вариант): блокируем ТОЛЬКО тех, кого
  // реально авто-приостановило за простой > 3 недель (метка auto_suspended_at).
  // Никогда не трогаем админов/директора и НЕ блокируем аккаунты, отключённые
  // вручную (active=0 без auto_suspended_at) — они входят как раньше.
  let suspended = false;
  if (me.userRecord && me.userRecord.uid) {
    try {
      await ensureLastSeenColumn(env);
      const row = await env.DB.prepare("SELECT last_seen_at, active, auto_suspended_at FROM users WHERE uid = ?").bind(me.userRecord.uid).first();
      const now = Date.now();
      const THREE_WEEKS = 21 * 24 * 60 * 60 * 1000;
      const lastSeen = row && row.last_seen_at ? Number(row.last_seen_at) : null;
      const isPrivileged = me.role === 'admin' || (me.orgPerms && me.orgPerms.isDirector);
      if (row && row.auto_suspended_at) {
        suspended = true;                       // уже авто-приостановлен — держим до ручной реактивации
      } else if (!isPrivileged && row && row.active === 1 && lastSeen && (now - lastSeen) > THREE_WEEKS) {
        await env.DB.prepare("UPDATE users SET active = 0, auto_suspended_at = ? WHERE uid = ?").bind(now, me.userRecord.uid).run();
        suspended = true;
        try { await auditLog(env, me, "user_auto_suspend", "user", me.userRecord.uid, { reason: "inactive_over_21d", lastSeen }); } catch {}
      } else {
        await env.DB.prepare("UPDATE users SET last_seen_at = ? WHERE uid = ?").bind(now, me.userRecord.uid).run();
      }
    } catch (e) { /* не блокируем вход из-за сбоя метки */ }
  }

  return json({
    ok: true,
    suspended,                       // всегда false, пока фича отключена
    firebaseUid: me.firebaseUid,
    canonicalUid: me.canonicalUid,   // используется как responsible_uid в filters
    email: me.email,
    role: me.role,                   // admin | manager | agent
    department: me.department,
    matchUids: me.matchUids || [],   // canonical + дубли по email + firebase uid (для gating правок)
    profile: me.userRecord ? {
      uid: me.userRecord.uid,
      email: me.userRecord.email,
      name: me.userRecord.name,
      lastName: me.userRecord.last_name,
      position: me.userRecord.position,
      active: me.userRecord.active,
      photo: me.userRecord.photo,
      phone: me.userRecord.phone || null,            // основной (legacy)
      phones: userPhoneList(me.userRecord),          // все номера сотрудника
    } : null,
    // Признак для фронта: нужно ли требовать заполнить телефон (для нотифаера).
    needsPhone: !!me.userRecord && userPhoneList(me.userRecord).length === 0,
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

// Строгая нормализация телефона КЗ/РФ → канонический "+7XXXXXXXXXX" или null.
// Принимает любой ввод с пробелами/скобками/дефисами; 8XXXXXXXXXX и 10-значный
// локальный приводит к +7. Возвращает null если номер невалиден.
function normalizePhoneKZ(raw) {
  let d = String(raw == null ? '' : raw).replace(/\D/g, '');
  if (!d) return null;
  if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);   // 8XXXXXXXXXX → 7XXXXXXXXXX
  if (d.length === 10) d = '7' + d;                            // локальный без кода страны
  if (d.length === 11 && d[0] === '7') return '+' + d;         // канон
  return null;
}

// Нормализует список введённых телефонов → массив канонических "+7..." без
// дублей. Принимает массив строк/объектов {value} ИЛИ одну строку. Невалидные
// номера отбрасываются.
function normalizePhoneListInput(raw) {
  const arr = Array.isArray(raw) ? raw : (raw == null ? [] : [raw]);
  const out = []; const seen = new Set();
  for (const r of arr) {
    const v = (r && typeof r === 'object') ? (r.value || r.phone || r.number) : r;
    const n = normalizePhoneKZ(v);
    if (n && !seen.has(n)) { seen.add(n); out.push(n); }
  }
  return out;
}

// Собирает все телефоны сотрудника из users.phones (JSON-массив) + legacy
// users.phone в единый нормализованный список без дублей. Порядок: phones[…],
// затем legacy phone как fallback (дубль отсеется).
function userPhoneList(row) {
  if (!row) return [];
  const out = []; const seen = new Set();
  const push = (raw) => { const n = normalizePhoneKZ(raw); if (n && !seen.has(n)) { seen.add(n); out.push(n); } };
  if (row.phones) {
    try {
      const arr = JSON.parse(row.phones);
      if (Array.isArray(arr)) for (const p of arr) push(typeof p === 'string' ? p : (p && (p.value || p.phone || p.number)));
    } catch {}
  }
  if (row.phone) push(row.phone);
  return out;
}

// POST /api/me/phone — сотрудник сам сохраняет свой телефон (для нотифаера).
// Body: { phone }. Валидирует +7 формат, пишет в users.phone своей строки.
async function handleSetMyPhone(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  const me = await resolveCanonicalUser(env, auth.claims);
  if (!me.canonicalUid) return json({ error: "no canonical user" }, 400, request);

  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json body" }, 400, request); }

  // Принимаем массив phones (новый формат) ИЛИ единичный phone (legacy).
  const list = normalizePhoneListInput(
    (body && Array.isArray(body.phones)) ? body.phones : (body && body.phone)
  );
  if (!list.length) {
    return json({ error: "invalid_phone", message: "Введите корректный номер в формате +7XXXXXXXXXX" }, 400, request);
  }

  await ensureUserPhonesColumn(env);
  const primary = list[0];
  const phonesJson = JSON.stringify(list);
  const res = await env.DB.prepare(
    "UPDATE users SET phone = ?, phones = ? WHERE uid = ?"
  ).bind(primary, phonesJson, me.canonicalUid).run();

  const changed = res && res.meta ? (res.meta.changes || 0) : 0;
  try {
    await auditLog(env, me, "user_set_own_phone", "user", me.canonicalUid, { phone: primary, phones: list });
  } catch {}

  return json({ ok: true, phone: primary, phones: list, linked: changed > 0 }, 200, request);
}

// ══════════════════════════════════════════════════════════════════════════
// ELC Placement Test → CRM
// Публичные эндпоинты для теста на уровень (студент без логина в CRM).
// Защита: работает только валидный код филиала; submit пишет только в контакт,
// чей responsible_uid принадлежит менеджерам этого филиала.
// ══════════════════════════════════════════════════════════════════════════

// Маскировка телефона: видны первые 2 и последние 2 цифры, остальное «*».
function maskPhone(p) {
  if (!p) return "";
  const s = String(p);
  const n = s.replace(/\D/g, "").length;
  let i = 0;
  return s.replace(/\d/g, (d) => { const keep = i < 2 || i >= n - 2; i++; return keep ? d : "*"; });
}

function firstPhoneValue(phonesJson) {
  try {
    const arr = JSON.parse(phonesJson || "[]");
    if (Array.isArray(arr) && arr.length) return arr[0].value || arr[0].VALUE || (typeof arr[0] === "string" ? arr[0] : "");
  } catch {}
  return "";
}

async function getBranch(env, code) {
  if (!code) return null;
  const row = await env.DB.prepare(
    "SELECT code,label,manager_uids,active FROM placement_branches WHERE code=?"
  ).bind(code).first();
  if (!row || !row.active) return null;
  let mgr = [];
  try { mgr = JSON.parse(row.manager_uids); } catch {}
  return { code: row.code, label: row.label, managers: Array.isArray(mgr) ? mgr : [] };
}

// GET /api/placement/branch/{code} — проверка филиала + название
async function handlePlacementBranch(request, env, code) {
  const b = await getBranch(env, code);
  if (!b) return json({ ok: false, error: "branch not found" }, 404, request);
  return json({ ok: true, code: b.code, label: b.label }, 200, request);
}

// GET /api/placement/roster?branch=CODE&q=... — поиск студента (телефоны замаскированы)
async function handlePlacementRoster(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("branch") || "";
  const q = (url.searchParams.get("q") || "").trim();
  const b = await getBranch(env, code);
  if (!b) return json({ ok: false, error: "branch not found" }, 404, request);
  if (q.length < 2) return json({ ok: true, results: [], hint: "min 2 chars" }, 200, request);
  if (!b.managers.length) return json({ ok: true, results: [] }, 200, request);

  const inPh = b.managers.map(() => "?").join(",");
  // SQLite LOWER() не понимает кириллицу → 3 варианта регистра (как в основном поиске)
  const variants = [...new Set([q, q.toLowerCase(), q.charAt(0).toUpperCase() + q.slice(1)])];
  const likeConds = [];
  const binds = [...b.managers];
  for (const v of variants) {
    likeConds.push("(name LIKE ? OR last_name LIKE ? OR phones LIKE ?)");
    binds.push("%" + v + "%", "%" + v + "%", "%" + v + "%");
  }
  const sql = `SELECT id,name,last_name,phones,emails,birthdate FROM contacts
    WHERE responsible_uid IN (${inPh}) AND (${likeConds.join(" OR ")})
    ORDER BY last_name, name LIMIT 20`;
  const rs = await env.DB.prepare(sql).bind(...binds).all();
  const results = (rs.results || []).map((r) => {
    const ph = firstPhoneValue(r.phones);
    let hasEmail = false;
    try { const e = JSON.parse(r.emails || "[]"); hasEmail = Array.isArray(e) && e.length > 0; } catch {}
    return {
      id: r.id,
      name: [r.last_name, r.name].filter(Boolean).join(" ").trim() || "(без имени)",
      maskedPhone: maskPhone(ph),
      hasPhone: !!ph,
      hasEmail,
      hasBirthdate: !!r.birthdate,
    };
  });
  return json({ ok: true, results, capped: results.length >= 20 }, 200, request);
}

// POST /api/placement/submit — создать результат + подшить в карточку контакта
async function handlePlacementSubmit(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, request); }
  const code = (body.branch || "").trim();
  const contactId = (body.contactId || "").trim();
  const b = await getBranch(env, code);
  if (!b) return json({ ok: false, error: "branch not found" }, 404, request);
  if (!contactId) return json({ ok: false, error: "contactId required" }, 400, request);

  // Контакт обязан принадлежать менеджерам филиала (защита от записи в чужие карточки)
  const contact = await env.DB.prepare(
    "SELECT id,name,last_name,phones,emails,birthdate,responsible_uid FROM contacts WHERE id=?"
  ).bind(contactId).first();
  if (!contact) return json({ ok: false, error: "contact not found" }, 404, request);
  if (!b.managers.includes(contact.responsible_uid)) {
    return json({ ok: false, error: "contact not in this branch" }, 403, request);
  }

  const st = body.student || {};
  const th = body.theory || {};
  const resultId = "pr_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const nowIso = new Date().toISOString();

  // — обновляем карточку контакта (имя/фамилия/ДР перезаписываем, телефон/email до-бавляем)
  const newName = (st.name || "").trim() || contact.name;
  const newLast = (st.lastName || "").trim() || contact.last_name;
  const newBirth = (st.birthdate || "").trim() || contact.birthdate;
  // phones merge
  let phones = []; try { phones = JSON.parse(contact.phones || "[]"); if (!Array.isArray(phones)) phones = []; } catch { phones = []; }
  const inPhone = (st.phone || "").trim();
  if (inPhone) {
    const norm = (s) => String(s).replace(/\D/g, "");
    if (!phones.some((p) => norm(p.value || p.VALUE || p) === norm(inPhone))) {
      phones.push({ type: "MOBILE", value: inPhone });
    }
  }
  // emails merge
  let emails = []; try { emails = JSON.parse(contact.emails || "[]"); if (!Array.isArray(emails)) emails = []; } catch { emails = []; }
  const inEmail = (st.email || "").trim();
  if (inEmail) {
    const lc = (s) => String(s).toLowerCase();
    if (!emails.some((e) => lc(e.value || e.VALUE || e) === lc(inEmail))) {
      emails.push({ type: "WORK", value: inEmail });
    }
  }
  await env.DB.prepare(
    "UPDATE contacts SET name=?, last_name=?, birthdate=?, phones=?, emails=?, bitrix_date_modify=? WHERE id=?"
  ).bind(newName, newLast, newBirth || null, JSON.stringify(phones), JSON.stringify(emails), nowIso, contactId).run();

  // — пишем структурированный результат
  const levelN = th.levelN != null ? th.levelN : null;
  const graduated = th.graduated ? 1 : 0;
  await env.DB.prepare(`
    INSERT INTO placement_results (id, contact_id, branch_code, level_n, level_name, cefr, graduated,
      theory_correct, theory_total, breakdown, speaking_topic,
      student_name, student_last_name, student_phone, student_email, student_birthdate, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    resultId, contactId, code, levelN, th.levelName || null, th.cefr || null, graduated,
    th.correct != null ? th.correct : null, th.total != null ? th.total : null,
    th.breakdown ? JSON.stringify(th.breakdown) : null, th.speakingTopic || null,
    newName, newLast, inPhone || null, inEmail || null, newBirth || null, nowIso
  ).run();

  // — подшиваем событие в таймлайн карточки контакта (видно в team.html)
  const authorUid = b.managers[0] || null;
  const tlId = "tl_plc_" + resultId.slice(3);
  await env.DB.prepare(`
    INSERT INTO timeline_activities (id, owner_type, owner_id, activity_type, author_uid, bitrix_created, payload, created_at)
    VALUES (?, 'contact', ?, 'placement_test', ?, ?, ?, datetime('now'))
  `).bind(
    tlId, contactId, authorUid, nowIso,
    JSON.stringify({
      kind: "placement_test", resultId, branch: code, branchLabel: b.label,
      levelN, levelName: th.levelName || null, cefr: th.cefr || null, graduated: !!graduated,
      theory: { correct: th.correct, total: th.total }, breakdown: th.breakdown || null,
      speakingTopic: th.speakingTopic || null,
      student: { name: newName, lastName: newLast, phone: inPhone, email: inEmail, birthdate: newBirth },
      audioKey: null,
    })
  ).run();

  return json({ ok: true, resultId, contactId, audioUpload: `/api/placement/audio/${resultId}` }, 200, request);
}

// POST /api/placement/audio/{resultId} — заливка записи монолога в R2 (публичная)
async function handlePlacementAudioUpload(request, env, resultId) {
  if (!env.FILES) return json({ error: "R2 not configured" }, 500, request);
  const res = await env.DB.prepare("SELECT id, contact_id FROM placement_results WHERE id=?").bind(resultId).first();
  if (!res) return json({ ok: false, error: "result not found" }, 404, request);
  const ctype = request.headers.get("Content-Type") || "audio/webm";
  const secs = parseInt(request.headers.get("X-Audio-Secs") || "0", 10) || null;
  const key = "placement/" + resultId + ".webm";
  await env.FILES.put(key, request.body, { httpMetadata: { contentType: ctype } });
  await env.DB.prepare(
    "UPDATE placement_results SET audio_key=?, audio_mime=?, audio_secs=? WHERE id=?"
  ).bind(key, ctype, secs, resultId).run();
  // дописываем audioKey в payload таймлайна
  const tl = await env.DB.prepare(
    "SELECT id,payload FROM timeline_activities WHERE owner_id=? AND activity_type='placement_test' AND payload LIKE ? LIMIT 1"
  ).bind(res.contact_id, "%" + resultId + "%").first();
  if (tl) {
    let pl = {}; try { pl = JSON.parse(tl.payload || "{}"); } catch {}
    pl.audioKey = key; pl.audioSecs = secs;
    await env.DB.prepare("UPDATE timeline_activities SET payload=? WHERE id=?").bind(JSON.stringify(pl), tl.id).run();
  }
  return json({ ok: true, resultId, audioKey: key }, 200, request);
}

// GET /api/placement/audio/{resultId} — отдача записи (для CRM, с авторизацией)
async function handlePlacementAudioDownload(request, env, resultId) {
  const auth = await requireAuthFlexible(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status, request);
  if (!env.FILES) return new Response("R2 not configured", { status: 500 });
  const res = await env.DB.prepare("SELECT audio_key, audio_mime FROM placement_results WHERE id=?").bind(resultId).first();
  if (!res || !res.audio_key) return new Response("not found", { status: 404 });
  const obj = await env.FILES.get(res.audio_key);
  if (!obj) return new Response("not found", { status: 404 });
  const h = new Headers(corsHeaders(request));
  h.set("Content-Type", res.audio_mime || "audio/webm");
  h.set("Cache-Control", "private, max-age=3600");
  return new Response(obj.body, { status: 200, headers: h });
}

// ── Main dispatcher ─────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    CURRENT_CTX = ctx; // для фоновой рассылки Web Push из createNotification
    const url = new URL(request.url);
    const path = url.pathname;

    // ── WS upgrade ДО CORS-обёртки ───────────────────────────────────────
    // Стандартный new Response(body, {headers}) ломает webSocket: client
    // свойство. /api/ws/user обязательно тут, не в общем потоке.
    // Auth: Firebase ID token в query ?token=… (передаём verify через env-шим).
    if (path === "/api/ws/user") {
      env._verifyIdToken = (t) => verifyFirebaseIdToken(t, env.FIREBASE_PROJECT_ID);
      // Канонический uid (D1, по email) — ТОТ ЖЕ, что пишется в team_chat_members
      // и используется в broadcastToChannel. Без этого WS подключается под
      // firebase-uid, а пуши шлются под canonical-uid → сообщения не доходят.
      env._resolveCanonicalUid = async (claims) => {
        try { return (await resolveCanonicalUser(env, claims)).canonicalUid; }
        catch { return claims?.user_id || claims?.sub || claims?.uid || null; }
      };
      return handleChatWebSocket(request, env, url);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (path === "/health" && request.method === "GET") {
      return handleHealth(request, env);
    }

    if (path === "/api/me" && request.method === "GET") {
      return handleMe(request, env);
    }
    if (path === "/api/analytics/funnels" && request.method === "GET") {
      return handleAnalyticsFunnels(request, env);
    }
    if (path === "/api/me/phone" && request.method === "POST") {
      return handleSetMyPhone(request, env);
    }

    // ── /api/placement/* — тест на уровень (студент без логина в CRM) ──────
    const plBranchMatch = path.match(/^\/api\/placement\/branch\/([^/]+)$/);
    if (plBranchMatch && request.method === "GET") {
      return handlePlacementBranch(request, env, decodeURIComponent(plBranchMatch[1]));
    }
    if (path === "/api/placement/roster" && request.method === "GET") {
      return handlePlacementRoster(request, env);
    }
    if (path === "/api/placement/submit" && request.method === "POST") {
      return handlePlacementSubmit(request, env);
    }
    const plAudioMatch = path.match(/^\/api\/placement\/audio\/([^/]+)$/);
    if (plAudioMatch && request.method === "POST") {
      return handlePlacementAudioUpload(request, env, plAudioMatch[1]);
    }
    if (plAudioMatch && request.method === "GET") {
      return handlePlacementAudioDownload(request, env, plAudioMatch[1]);
    }

    if (path.startsWith("/api/rtdb/") || path === "/api/rtdb") {
      return handleRtdb(request, env);
    }

    // /api/import/bulk — массовый upsert (1 HTTP-запрос = 1 D1 batch транзакция,
    // вместо тысяч PUT /api/rtdb/{collection}/{id}.json при миграциях).
    // Снижает worker-requests в 100-1000 раз. Только admin.
    if (path === "/api/import/bulk" && request.method === "POST") {
      return handleBulkImport(request, env);
    }

    // /api/admin/deals/archive-bulk — массовая архивация сделок по фильтрам.
    // Body: { pipelineId?, stages?, olderThanDays?, dryRun?, restore? }
    if (path === "/api/admin/deals/archive-bulk" && request.method === "POST") {
      return handleBulkArchiveDeals(request, env);
    }

    // /api/admin/deals/migrate-rejects — один раз: объединение 5 REJECT_*
    // стадий в одну REJECT с подпричиной в новой колонке reject_reason.
    // Body: { pipelineId, dryRun? }
    if (path === "/api/admin/deals/migrate-rejects" && request.method === "POST") {
      return handleMigrateRejectReasons(request, env);
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

    // /api/tasks — создать новую задачу в портале
    if (path === "/api/tasks" && request.method === "POST") {
      return handleCreateTask(request, env);
    }

    // ── Демо-конструктор ──────────────────────────────────────────────
    // Публичная отдача демо по временной ссылке (без auth — токен в ?t=).
    const demoLogoMatch = path.match(/^\/api\/demo\/([^/]+)\/logo$/);
    if (demoLogoMatch && request.method === "GET") {
      return handleDemoLogoServe(request, env, decodeURIComponent(demoLogoMatch[1]));
    }
    const demoServeMatch = path.match(/^\/api\/demo\/([^/]+)$/);
    if (demoServeMatch && request.method === "GET") {
      return handleDemoServe(request, env, decodeURIComponent(demoServeMatch[1]));
    }
    // Управление демо (auth).
    if (path === "/api/demos" && request.method === "GET") {
      return handleDemosList(request, env);
    }
    if (path === "/api/demos/rules" && request.method === "GET") {
      return handleDemoRulesGet(request, env);
    }
    if (path === "/api/demos/rules" && request.method === "PUT") {
      return handleDemoRulesPut(request, env);
    }
    const demoRelinkMatch = path.match(/^\/api\/demos\/([^/]+)\/relink$/);
    if (demoRelinkMatch && request.method === "POST") {
      return handleDemoRelink(request, env, decodeURIComponent(demoRelinkMatch[1]));
    }
    const demoOneMatch = path.match(/^\/api\/demos\/([^/]+)$/);
    if (demoOneMatch && request.method === "PATCH") {
      return handleDemoUpdate(request, env, decodeURIComponent(demoOneMatch[1]));
    }
    if (demoOneMatch && request.method === "DELETE") {
      return handleDemoDelete(request, env, decodeURIComponent(demoOneMatch[1]));
    }

    // /api/tasks/by-deals — батч ближайших активных дел для канбан-плашки «📋 Дело».
    if (path === "/api/tasks/by-deals" && request.method === "POST") {
      return handleTasksByDeals(request, env);
    }

    // /api/tasks/:id/full — полная карточка задачи: все поля + parsed comments
    // + subtasks + files. Гарантированный формат (rtdb-proxy иногда не парсит JSON).
    const taskFullMatch = path.match(/^\/api\/tasks\/([^/]+)\/full$/);
    if (taskFullMatch && request.method === "GET") {
      return handleTaskFull(request, env, taskFullMatch[1]);
    }

    // /api/skills/report — приём отчёта от портала skills.myelc.net в ленту
    // подзадачи филиала. Своя токен-авторизация (env.SKILLS_INGEST_SECRET),
    // НЕ Firebase — перехватываем до общего auth-гейта.
    if (path === "/api/skills/report" && request.method === "POST") {
      return handleSkillsReport(request, env);
    }

    // ── Chat-файлы — отдача через <img src>/<a href> ─────────────────────
    // Эти теги не умеют слать Authorization, поэтому токен принимаем в ?auth=
    // (requireAuthFlexible). Перехватываем GET ДО общего auth-гейта /api/chat/*.
    const chatFileGet = path.match(/^\/api\/chat\/files\/(.+)$/);
    if (chatFileGet && request.method === "GET") {
      const auth = await requireAuthFlexible(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status, request);
      const res = await downloadChatFile(request, env, decodeURIComponent(chatFileGet[1]));
      const h = new Headers(res.headers);
      Object.entries(corsHeaders(request)).forEach(([k, v]) => h.set(k, v));
      return new Response(res.body, { status: res.status, headers: h });
    }

    // ── /api/chat/* — внутренний чат сотрудников ─────────────────────────
    if (path.startsWith("/api/chat/")) {
      const auth = await requireAuth(request, env);
      if (auth.error) return json({ error: auth.error }, auth.status, request);
      // Канонический uid (D1, по email) + все алиасы (canonical + дубли + firebase).
      // Чат-модуль матчит членство/доступ по ЛЮБОМУ из ids (см. meIds в chat-module),
      // а пишет под каноническим me.uid — единая личность с остальной CRM.
      const canonical = await resolveCanonicalUser(env, auth.claims);
      const ids = (canonical.matchUids && canonical.matchUids.length)
        ? canonical.matchUids : [canonical.canonicalUid || auth.uid];
      const me = {
        uid: canonical.canonicalUid || auth.uid,
        email: auth.email,
        claims: auth.claims,
        ids,
        // role — портальная роль (admin = директор/администратор). Чат-модуль
        // даёт такому юзеру права админа в ЛЮБОМ чате (страховка от lockout на
        // legacy-каналах, где created_by не совпал ни с одним текущим uid).
        role: canonical.role,
        isDirector: !!canonical.orgPerms?.isDirector,
      };
      const res = await handleChatRequest(request, env, url, me, ctx);
      if (res) {
        // Применить CORS к ответу чата
        const h = new Headers(res.headers);
        Object.entries(corsHeaders(request)).forEach(([k, v]) => h.set(k, v));
        return new Response(res.body, { status: res.status, headers: h });
      }
      return json({ error: "chat route not found" }, 404, request);
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
    // /api/contact-card-by-phone — GET: rich contact + deals + activities для popup звонка
    if (path === "/api/contact-card-by-phone" && request.method === "GET") {
      return handleContactCardByPhone(request, env);
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
    const userProfileMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/profile$/);
    if (userProfileMatch && request.method === "PATCH") {
      return handleAdminUpdateProfile(request, env, userProfileMatch[1]);
    }

    // /api/deals/comments-preview — батч последних 3 комментариев на сделку (для канбана)
    if (path === "/api/deals/comments-preview" && request.method === "POST") {
      return handleDealsCommentsPreview(request, env);
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
    // /api/deals/{id}/qualification — форма квалификации (бриф первого звонка)
    const dealQualMatch = path.match(/^\/api\/deals\/([^/]+)\/qualification$/);
    if (dealQualMatch && request.method === "GET") {
      return handleDealQualificationGet(request, env, decodeURIComponent(dealQualMatch[1]));
    }
    if (dealQualMatch && request.method === "PUT") {
      return handleDealQualificationPut(request, env, decodeURIComponent(dealQualMatch[1]));
    }
    // /api/deals/{id}/qualification/recording/{recId} — отдать/удалить запись звонка
    const qualRecOneMatch = path.match(/^\/api\/deals\/([^/]+)\/qualification\/recording\/([^/]+)$/);
    if (qualRecOneMatch && request.method === "GET") {
      return handleQualRecordingServe(request, env, decodeURIComponent(qualRecOneMatch[1]), decodeURIComponent(qualRecOneMatch[2]));
    }
    if (qualRecOneMatch && request.method === "DELETE") {
      return handleQualRecordingDelete(request, env, decodeURIComponent(qualRecOneMatch[1]), decodeURIComponent(qualRecOneMatch[2]));
    }
    // /api/deals/{id}/qualification/recording — загрузить запись звонка (raw body)
    const qualRecUpMatch = path.match(/^\/api\/deals\/([^/]+)\/qualification\/recording$/);
    if (qualRecUpMatch && request.method === "POST") {
      return handleQualRecordingUpload(request, env, decodeURIComponent(qualRecUpMatch[1]));
    }
    // /api/deals/{id}/qualification/recordings — список записей звонков
    const qualRecListMatch = path.match(/^\/api\/deals\/([^/]+)\/qualification\/recordings$/);
    if (qualRecListMatch && request.method === "GET") {
      return handleQualRecordingsList(request, env, decodeURIComponent(qualRecListMatch[1]));
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
    // /api/wa/schedule — отложенные сообщения
    if (path === "/api/wa/schedule" && request.method === "POST") {
      return handleWaScheduleCreate(request, env);
    }
    if (path === "/api/wa/schedule" && request.method === "GET") {
      return handleWaScheduleList(request, env);
    }
    const waSchedMatch = path.match(/^\/api\/wa\/schedule\/([^/]+)$/);
    if (waSchedMatch && request.method === "DELETE") {
      return handleWaScheduleCancel(request, env, waSchedMatch[1]);
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
    if (path === "/api/wa/mark-all-read" && request.method === "POST") {
      return handleWaMarkAllRead(request, env);
    }
    if (path === "/api/wa/chats/archive" && request.method === "POST") {
      return handleWaArchiveChat(request, env);
    }
    if (path === "/api/wa/chat-avatar" && request.method === "POST") {
      return handleWaChatAvatarUpload(request, env);
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
    if (path === "/api/wa/sync-groups" && request.method === "POST") {
      return handleWaSyncGroups(request, env);
    }
    const empProfileMatch = path.match(/^\/api\/users\/([^/]+)\/profile$/);
    if (empProfileMatch && request.method === "GET") {
      return handleUserProfileGet(request, env, decodeURIComponent(empProfileMatch[1]));
    }
    if (empProfileMatch && request.method === "PUT") {
      return handleUserProfilePut(request, env, decodeURIComponent(empProfileMatch[1]));
    }
    // ── Аватар сотрудника (self-service) ──
    if (path === "/api/me/avatar" && request.method === "POST") {
      return handleMyAvatarUpload(request, env);
    }
    const avatarFileMatch = path.match(/^\/api\/avatar\/(.+)$/);
    if (avatarFileMatch && request.method === "GET") {
      return handleWaFileServe(request, env, decodeURIComponent(avatarFileMatch[1]));
    }
    // ── Лента (корпоративный фид) ──
    if (path === "/api/feed/posts" && request.method === "POST") {
      return handleFeedCreate(request, env);
    }
    if (path === "/api/feed/posts" && request.method === "GET") {
      return handleFeedList(request, env);
    }
    const feedCommentsMatch = path.match(/^\/api\/feed\/posts\/([^/]+)\/comments$/);
    if (feedCommentsMatch && request.method === "GET") {
      return handleFeedCommentList(request, env, feedCommentsMatch[1]);
    }
    if (feedCommentsMatch && request.method === "POST") {
      return handleFeedCommentCreate(request, env, feedCommentsMatch[1]);
    }
    const feedLikeMatch = path.match(/^\/api\/feed\/posts\/([^/]+)\/like$/);
    if (feedLikeMatch && request.method === "POST") {
      return handleFeedLikeToggle(request, env, feedLikeMatch[1]);
    }
    const feedReactMatch = path.match(/^\/api\/feed\/posts\/([^/]+)\/react$/);
    if (feedReactMatch && request.method === "POST") {
      return handleFeedReact(request, env, feedReactMatch[1]);
    }
    const feedPostMatch = path.match(/^\/api\/feed\/posts\/([^/]+)$/);
    if (feedPostMatch && request.method === "PATCH") {
      return handleFeedUpdate(request, env, feedPostMatch[1]);
    }
    if (feedPostMatch && request.method === "DELETE") {
      return handleFeedDelete(request, env, feedPostMatch[1]);
    }
    const feedCommentDelMatch = path.match(/^\/api\/feed\/comments\/([^/]+)$/);
    if (feedCommentDelMatch && request.method === "DELETE") {
      return handleFeedCommentDelete(request, env, feedCommentDelMatch[1]);
    }
    // ── Центр уведомлений ──
    if (path === "/api/notifications" && request.method === "GET") {
      return handleNotificationsList(request, env);
    }
    if (path === "/api/notifications/count" && request.method === "GET") {
      return handleNotificationsCount(request, env);
    }
    if (path === "/api/notifications/read" && request.method === "POST") {
      return handleNotificationsRead(request, env);
    }
    if (path === "/api/notifications/read-all" && request.method === "POST") {
      return handleNotificationsReadAll(request, env);
    }
    // ── Web Push (VAPID) ──
    if (path === "/api/push/vapid-public" && request.method === "GET") {
      return handlePushVapidPublic(request);
    }
    if (path === "/api/push/subscribe" && request.method === "POST") {
      return handlePushSubscribe(request, env);
    }
    if (path === "/api/push/unsubscribe" && request.method === "POST") {
      return handlePushUnsubscribe(request, env);
    }
    if (path === "/api/wa/channels/public" && request.method === "GET") {
      return handleWaListChannelsPublic(request, env);
    }
    if (path === "/api/wa/channels" && request.method === "GET") {
      return handleWaListChannels(request, env);
    }
    // Состояние связи каналов (для баннера). До :id-роутов — точный путь.
    if (path === "/api/wa/channels/health" && request.method === "GET") {
      return handleWaChannelsHealth(request, env);
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
    const waChannelBackfillMatch = path.match(/^\/api\/wa\/channels\/([^/]+)\/backfill-deals$/);
    if (waChannelBackfillMatch && request.method === "POST") {
      return handleWaChannelBackfillDeals(request, env, waChannelBackfillMatch[1]);
    }

    // ── /api/notifier — системный WhatsApp-оповещатель портала ──────────
    if (path === "/api/notifier" && request.method === "GET") {
      return handleNotifierGet(request, env);
    }
    if (path === "/api/notifier" && request.method === "PUT") {
      return handleNotifierSave(request, env);
    }
    if (path === "/api/notifier/state" && request.method === "GET") {
      return handleNotifierState(request, env);
    }
    if (path === "/api/notifier/qr" && request.method === "GET") {
      return handleNotifierQr(request, env);
    }
    if (path === "/api/notifier/test" && request.method === "POST") {
      return handleNotifierTest(request, env);
    }
    if (path === "/api/notifier/access" && request.method === "POST") {
      return handleNotifierAccess(request, env);
    }
    if (path === "/api/notifier/log" && request.method === "GET") {
      return handleNotifierLog(request, env);
    }

    // ── /api/org/structure — иерархия компании ────────────────────────
    if (path === "/api/org/structure" && request.method === "GET") {
      return handleOrgStructureGet(request, env);
    }
    if (path === "/api/org/structure" && request.method === "PUT") {
      return handleOrgStructurePut(request, env);
    }
    // ── /api/admin/diag/orgperms — диагностика эффективных прав сотрудника ──
    if (path === "/api/admin/diag/orgperms" && request.method === "GET") {
      return handleAdminDiagOrgPerms(request, env);
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

    // ── /api/invites — приглашения новых сотрудников ────────────────────
    if (path === "/api/invites" && request.method === "POST") {
      return handleInviteCreate(request, env);
    }
    if (path === "/api/invites" && request.method === "GET") {
      return handleInvitesList(request, env);
    }
    const inviteMatch = path.match(/^\/api\/invites\/([a-zA-Z0-9_]+)(\/(accept|revoke))?$/);
    if (inviteMatch) {
      const token = inviteMatch[1];
      const action = inviteMatch[3];
      if (!action && request.method === "GET") return handleInviteGet(request, env, token);
      if (action === 'accept' && request.method === "POST") return handleInviteAccept(request, env, token);
      if (action === 'revoke' && request.method === "POST") return handleInviteRevoke(request, env, token);
    }

    // ── /api/sip/extensions — карта uid → SIP extension (для Asterisk routing) ─
    if (path === "/api/sip/extensions" && request.method === "GET") {
      return handleSipExtensionsGet(request, env);
    }
    if (path === "/api/sip/extensions" && request.method === "PUT") {
      return handleSipExtensionsPut(request, env);
    }
    // ── /api/mail — почтовые ящики ──────────────────────────────────────
    if (path === "/api/mail/accounts" && request.method === "GET") {
      return handleMailAccountsGet(request, env);
    }
    if (path === "/api/mail/accounts" && request.method === "POST") {
      return handleMailAccountsPut(request, env);
    }
    const mailAccDelMatch = path.match(/^\/api\/mail\/accounts\/([^/]+)$/);
    if (mailAccDelMatch && request.method === "DELETE") {
      return handleMailAccountDelete(request, env, decodeURIComponent(mailAccDelMatch[1]));
    }
    if (path === "/api/mail/my" && request.method === "GET") {
      return handleMailMy(request, env);
    }
    if (path === "/api/mail/unread-summary" && request.method === "GET") {
      return handleMailUnreadSummary(request, env);
    }
    // ── Онбординг (обучение + тест) ─────────────────────────────────────
    if (path === "/api/onboarding/me" && request.method === "GET") {
      return handleOnboardingMe(request, env);
    }
    if (path === "/api/onboarding/progress" && request.method === "POST") {
      return handleOnboardingProgress(request, env);
    }
    if (path === "/api/onboarding/status" && request.method === "GET") {
      return handleOnboardingStatus(request, env);
    }
    // ── Графики на главной ──────────────────────────────────────────────
    if (path === "/api/charts/config" && request.method === "GET") {
      return handleChartsConfigGet(request, env);
    }
    if (path === "/api/charts/config" && request.method === "PUT") {
      return handleChartsConfigPut(request, env);
    }
    if (path === "/api/charts/series" && request.method === "GET") {
      return handleChartsSeries(request, env);
    }
    if (path === "/api/public/pllato-inquiries" && request.method === "GET") {
      return handlePublicPllatoInquiries(request, env);
    }
    if (path === "/api/public/pllato-kep" && request.method === "GET") {
      return handlePublicPllatoKep(request, env);
    }
    // Работа с письмами конкретного ящика
    const mailUnreadMatch = path.match(/^\/api\/mail\/([^/]+)\/unread$/);
    if (mailUnreadMatch && request.method === "GET") {
      return handleMailUnread(request, env, decodeURIComponent(mailUnreadMatch[1]));
    }
    const mailFoldersMatch = path.match(/^\/api\/mail\/([^/]+)\/folders$/);
    if (mailFoldersMatch && request.method === "GET") {
      return handleMailFolders(request, env, decodeURIComponent(mailFoldersMatch[1]));
    }
    const mailMsgsMatch = path.match(/^\/api\/mail\/([^/]+)\/messages$/);
    if (mailMsgsMatch && request.method === "GET") {
      return handleMailMessages(request, env, decodeURIComponent(mailMsgsMatch[1]));
    }
    const mailAttMatch = path.match(/^\/api\/mail\/([^/]+)\/message\/([^/]+)\/attachment\/([^/]+)$/);
    if (mailAttMatch && request.method === "GET") {
      return handleMailAttachment(request, env, decodeURIComponent(mailAttMatch[1]), decodeURIComponent(mailAttMatch[2]), decodeURIComponent(mailAttMatch[3]));
    }
    const mailMsgMatch = path.match(/^\/api\/mail\/([^/]+)\/message\/([^/]+)$/);
    if (mailMsgMatch && request.method === "GET") {
      return handleMailMessage(request, env, decodeURIComponent(mailMsgMatch[1]), decodeURIComponent(mailMsgMatch[2]));
    }
    const mailSendMatch = path.match(/^\/api\/mail\/([^/]+)\/send$/);
    if (mailSendMatch && request.method === "POST") {
      return handleMailSend(request, env, decodeURIComponent(mailSendMatch[1]));
    }
    const mailTestMatch = path.match(/^\/api\/mail\/([^/]+)\/test$/);
    if (mailTestMatch && request.method === "POST") {
      return handleMailTest(request, env, decodeURIComponent(mailTestMatch[1]));
    }
    // ── /api/sip/lines — линии Бинотел (admin) ─────────────────────────
    if (path === "/api/sip/lines" && request.method === "GET") {
      return handleSipLinesGet(request, env);
    }
    if (path === "/api/sip/lines" && request.method === "POST") {
      return handleSipLinesPut(request, env);
    }
    const sipLineDelMatch = path.match(/^\/api\/sip\/lines\/([^/]+)$/);
    if (sipLineDelMatch && request.method === "DELETE") {
      return handleSipLineDelete(request, env, decodeURIComponent(sipLineDelMatch[1]));
    }
    // ── /api/sip/agents — назначения сотрудник→линия (admin) ────────────
    if (path === "/api/sip/agents" && request.method === "GET") {
      return handleSipAgentsGet(request, env);
    }
    if (path === "/api/sip/agents" && request.method === "POST") {
      return handleSipAgentsPut(request, env);
    }
    const sipAgentDelMatch = path.match(/^\/api\/sip\/agents\/([^/]+)$/);
    if (sipAgentDelMatch && request.method === "DELETE") {
      return handleSipAgentDelete(request, env, decodeURIComponent(sipAgentDelMatch[1]));
    }
    // ── /api/sip/asterisk-config — генератор конфига (секрет, для сервера) ─
    if (path === "/api/sip/asterisk-config" && request.method === "GET") {
      return handleSipAsteriskConfig(request, env);
    }
    // ── /api/sip/route?phone=X — Asterisk запрашивает кому звонить ─────
    // Auth: shared secret env.SIP_ROUTE_SECRET (Asterisk не умеет Firebase Auth)
    if (path === "/api/sip/route" && request.method === "GET") {
      return handleSipRoute(request, env);
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

  // ── Cron (каждую минуту) ──────────────────────────────────────────────
  // Обрабатываем отложенные WA-сообщения которые пора слать.
  async scheduled(event, env, ctx) {
    CURRENT_CTX = ctx; // для фоновой рассылки Web Push из produceDeedReminders
    ctx.waitUntil((async () => {
      try {
        const res = await processScheduledWaMessages(env);
        if (res.processed > 0) {
          console.log(`[cron] wa_scheduled processed=${res.processed} sent=${res.sent} failed=${res.failed}`);
        }
      } catch (e) {
        console.error("[cron] processScheduledWaMessages failed:", e.message);
      }
      try {
        const rem = await produceDeedReminders(env);
        if (rem.reminded > 0) console.log(`[cron] deed_reminders sent=${rem.reminded}`);
      } catch (e) {
        console.error("[cron] produceDeedReminders failed:", e.message);
      }
      try {
        const h = await checkChannelsHealth(env, ctx);
        if (h.newlyDown > 0 || h.recovered > 0) {
          console.log(`[cron] channel_health newlyDown=${h.newlyDown} recovered=${h.recovered} checked=${h.checked}`);
        }
      } catch (e) {
        console.error("[cron] checkChannelsHealth failed:", e.message);
      }
      try {
        const w = await maybeWeeklyChannelDigest(env, ctx);
        if (w && w.sent) console.log(`[cron] channel_health weekly digest sent down=${w.down} admins=${w.admins}`);
      } catch (e) {
        console.error("[cron] maybeWeeklyChannelDigest failed:", e.message);
      }
    })());
  },
};
