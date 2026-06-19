// ════════════════════════════════════════════════════════════════════════
// Chat module: внутренний чат сотрудников портала.
// Адаптация ppb-crm chat (см. docs/CHAT-MODULE-EXTRACTION.md).
//
// Экспортирует:
//   - класс ChannelRoom (Durable Object, broadcast typing/presence через WS)
//   - класс UserNotifyRoom (Durable Object, push к открытым вкладкам юзера)
//   - handleChatRequest(request, env, url, me) — диспетчер /api/chat/*
//   - handleChatWebSocket(request, env, url) — WSS-апгрейд для /api/ws/user
//
// Хранение: D1 tables team_chat_* (см. chat-schema.sql).
// Auth: ожидается уже-валидированный объект `me` ({uid, name, email, role}).
// ════════════════════════════════════════════════════════════════════════

import { sendWebPush } from "./webpush.js";

// ── Утилиты ──────────────────────────────────────────────────────────────
function uuid() {
  // Лёгкий UUID v4 — sufficient для message_id / channel_id
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function now() { return Date.now(); }

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',  // CORS обёртка снаружи перезапишет
    },
  });
}

function errRes(msg, status = 400) { return jsonRes({ error: msg }, status); }

// ── DO: UserNotifyRoom — комната юзера (push на открытые вкладки) ────────
// Один юзер = одна DO instance. Все открытые вкладки коннектятся сюда WSS.
// Сервер вызывает /push для рассылки сообщения всем коннектам.
export class UserNotifyRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // /connect?uid=X — WS upgrade от вкладки юзера
    if (url.pathname === '/connect') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected websocket', { status: 400 });
      }
      const uid = url.searchParams.get('uid') || '';
      if (!uid) return new Response('uid required', { status: 400 });
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.state.acceptWebSocket(server, [uid]);  // Hibernation API
      server.send(JSON.stringify({ kind: 'connected', user_id: uid }));
      return new Response(null, { status: 101, webSocket: client });
    }

    // /push — внутренний RPC: разослать payload всем коннектам этого юзера
    if (url.pathname === '/push') {
      const payload = await request.text();
      const wss = this.state.getWebSockets();
      for (const ws of wss) {
        try { ws.send(payload); } catch {}
      }
      return jsonRes({ ok: true, delivered: wss.length });
    }

    return new Response('Not found', { status: 404 });
  }

  // Hibernation API — вызывается когда DO просыпается на сообщение
  webSocketMessage(ws, message) {
    let msg;
    try { msg = JSON.parse(message); } catch { return; }
    if (msg.kind === 'ping') {
      ws.send(JSON.stringify({ kind: 'pong', t: msg.t || Date.now() }));
    }
    // typing_start / typing_stop / subscribe — пробрасываем в ChannelRoom если нужно
    // (минимальный MVP: оставим в UserNotifyRoom только pong; typing broadcast'ится
    //  с сервера через ChannelRoom при write)
  }

  webSocketClose(ws /* , code, reason, wasClean */) {
    // Hibernation сам очистит; ничего не делаем
  }

  webSocketError(ws /*, error */) {}
}

// ── DO: ChannelRoom — комната-канал (typing/presence broadcast) ──────────
// Используется в Phase B для typing-indicators и presence-счётчика.
// Сейчас MVP без typing — только заглушка, чтобы binding в wrangler работал.
export class ChannelRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    return jsonRes({ ok: true, note: "ChannelRoom MVP — typing in Phase B" });
  }
  webSocketMessage() {}
  webSocketClose() {}
  webSocketError() {}
}

// ── Broadcast helper — пушит payload всем участникам канала ──────────────
async function broadcastToChannel(env, channelId, payload) {
  const { results } = await env.DB.prepare(
    "SELECT user_id FROM team_chat_members WHERE channel_id = ?"
  ).bind(channelId).all();
  const text = JSON.stringify(payload);
  await Promise.all(results.map(async r => {
    try {
      const id = env.USER_NOTIFY.idFromName(r.user_id);
      const stub = env.USER_NOTIFY.get(id);
      await stub.fetch('https://do/push', { method: 'POST', body: text });
    } catch (e) { /* ignore per-user errors */ }
  }));
}

export async function broadcastToUser(env, userId, payload) {
  try {
    const id = env.USER_NOTIFY.idFromName(userId);
    const stub = env.USER_NOTIFY.get(id);
    await stub.fetch('https://do/push', { method: 'POST', body: JSON.stringify(payload) });
  } catch {}
}

// ── Уведомления о сообщениях / добавлении в чат ──────────────────────────
// Колокольчик (D1 notifications) + WS kind:'notification' в открытые вкладки +
// Web Push на устройства (телефон/десктоп даже когда чат закрыт). Инфраструктура
// та же, что у worker.createNotification, но self-contained (без circular import).
let _chatCtx = null;   // ctx текущего запроса — для фоновой рассылки Web Push
function runBg(promise) {
  const p = Promise.resolve(promise).catch(() => {});
  if (_chatCtx && typeof _chatCtx.waitUntil === 'function') { try { _chatCtx.waitUntil(p); } catch {} return Promise.resolve(); }
  return p;
}

// WA-оповещатель (sendNotify) внедряется из worker.js через setWaNotifier(),
// чтобы не делать циклический импорт worker.js → chat-module.js → worker.js.
// Сигнатура: (env, { uid, event, text, link }) => Promise. Никогда не бросает.
let _waNotify = null;
export function setWaNotifier(fn) { _waNotify = fn; }

async function pushChatToDevices(env, uid, payload) {
  if (!env.VAPID_PRIVATE_JWK) return;        // пуши не настроены — тихо выходим
  let subs = [];
  try {
    const r = await env.DB.prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE uid = ?').bind(uid).all();
    subs = r.results || [];
  } catch { return; }
  for (const sub of subs) {
    try {
      const res = await sendWebPush(env, sub, payload);
      if (res && res.gone) await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(sub.id).run();
    } catch {}
  }
}

async function authorDisplayName(env, uid) {
  try {
    const u = await env.DB.prepare('SELECT name, last_name FROM users WHERE uid = ? LIMIT 1').bind(uid).first();
    if (u) return [u.last_name, u.name].filter(Boolean).join(' ').trim() || u.name || '';
  } catch {}
  return '';
}

function msgPreview(message) {
  let p = (message && message.text) ? String(message.text) : '';
  if (!p) {
    p = message?.type === 'image' ? '📷 Фото'
      : message?.type === 'audio' ? '🎤 Голосовое'
      : message?.type === 'file'  ? '📎 Файл' : 'Вложение';
  }
  return p.slice(0, 140);
}

// Новое сообщение → уведомить участников (кроме автора и заглушённых).
// notifications-запись схлопнута: один непрочитанный «chatnt_<channel>_<uid>» на
// канал на юзера — колокольчик не флудит, при новом сообщении строка всплывает.
async function notifyChatMessage(env, channelId, authorMe, message) {
  try {
    const authorIds = new Set(meIds(authorMe));
    const ch = await env.DB.prepare('SELECT id, type, name FROM team_chat_channels WHERE id = ?').bind(channelId).first();
    if (!ch) return;
    const { results: members } = await env.DB.prepare(
      'SELECT user_id, muted FROM team_chat_members WHERE channel_id = ?'
    ).bind(channelId).all();
    let authorName = await authorDisplayName(env, authorMe.uid);
    if (!authorName) authorName = 'Сотрудник';
    const preview = msgPreview(message);
    const chName = ch.name || '';
    const title = (ch.type === 'dm' || !chName) ? authorName : `${authorName} · ${chName}`;
    const link = '/team.html?page=team-chat&channel=' + encodeURIComponent(channelId);
    const ts = message.created_at || now();
    // Кого упомянули через @ — этим людям личное уведомление приходит ДАЖE если
    // канал заглушён (mute гасит обычный шум, но не персональное обращение).
    const mentionSet = new Set(parseMentionsValue(message.mentions));
    for (const m of (members || [])) {
      const uid = m.user_id;
      if (!uid || authorIds.has(uid)) continue;
      const isMentioned = mentionSet.has(uid);

      if (isMentioned) {
        // Персональное упоминание — отдельная строка-колокольчик на сообщение,
        // отдельный пуш и WA-событие chat_mention (со своим тумблером).
        const mTitle = (chName) ? `${authorName} · ${chName}` : authorName;
        const mBody = '📣 упомянул(а) вас: ' + preview;
        const mNotifId = 'chatmention_' + message.id + '_' + uid;
        try {
          await env.DB.prepare(`
            INSERT OR IGNORE INTO notifications (id, uid, type, title, body, link, icon, actor_uid, entity_type, entity_id, created_at, read_at)
            VALUES (?, ?, 'chat_mention', ?, ?, ?, '📣', ?, 'chat_channel', ?, ?, NULL)
          `).bind(mNotifId, uid, mTitle, mBody, link, authorMe.uid, channelId, ts).run();
        } catch {}
        broadcastToUser(env, uid, {
          kind: 'notification',
          notification: { id: mNotifId, type: 'chat_mention', title: mTitle, body: mBody, link, icon: '📣', createdAt: ts, channel_id: channelId },
        });
        runBg(pushChatToDevices(env, uid, { title: mTitle, body: mBody, url: link, tag: 'chatmention_' + message.id, icon: null }));
        if (_waNotify) {
          const waText = (chName)
            ? `📣 ${authorName} упомянул(а) вас в «${chName}»: ${preview}`
            : `📣 ${authorName} упомянул(а) вас: ${preview}`;
          runBg(_waNotify(env, { uid, event: 'chat_mention', text: waText, link: 'https://pllato.kz' + link }));
        }
        continue;   // упомянутому хватит персонального — не дублируем обычным
      }

      if (m.muted) continue;   // обычный шум канала — заглушённым не шлём
      const notifId = 'chatnt_' + channelId + '_' + uid;
      try {
        await env.DB.prepare(`
          INSERT INTO notifications (id, uid, type, title, body, link, icon, actor_uid, entity_type, entity_id, created_at, read_at)
          VALUES (?, ?, 'chat_message', ?, ?, ?, '💬', ?, 'chat_channel', ?, ?, NULL)
          ON CONFLICT(id) DO UPDATE SET title=excluded.title, body=excluded.body, link=excluded.link,
            actor_uid=excluded.actor_uid, created_at=excluded.created_at, read_at=NULL
        `).bind(notifId, uid, title, preview, link, authorMe.uid, channelId, ts).run();
      } catch {}
      broadcastToUser(env, uid, {
        kind: 'notification',
        notification: { id: notifId, type: 'chat_message', title, body: preview, link, icon: '💬', createdAt: ts, channel_id: channelId },
      });
      runBg(pushChatToDevices(env, uid, { title, body: preview, url: link, tag: 'chat_' + channelId, icon: null }));
      // WA-оповещатель: продублировать в личный WhatsApp (sendNotify сам сверит
      // тумблер — chat_dm для лички, chat_message для канала/группы).
      if (_waNotify) {
        const waEvent = (ch.type === 'dm') ? 'chat_dm' : 'chat_message';
        const waText = (ch.type === 'dm' || !chName)
          ? `💬 ${authorName}: ${preview}`
          : `💬 ${authorName} в «${chName}»: ${preview}`;
        runBg(_waNotify(env, { uid, event: waEvent, text: waText, link: 'https://pllato.kz' + link }));
      }
    }
  } catch {}
}

// Добавили в групповой чат → уведомить добавленного (push + колокольчик).
async function notifyAddedToChannel(env, channelId, actorMe, addedUid) {
  try {
    if (!addedUid || meIds(actorMe).includes(addedUid)) return;
    const ch = await env.DB.prepare('SELECT type, name FROM team_chat_channels WHERE id = ?').bind(channelId).first();
    if (!ch || ch.type === 'dm') return;
    let actorName = await authorDisplayName(env, actorMe.uid);
    if (!actorName) actorName = 'Сотрудник';
    const chName = ch.name || 'групповой чат';
    const title = 'Вас добавили в чат';
    const body = `${actorName} → ${chName}`;
    const link = '/team.html?page=team-chat&channel=' + encodeURIComponent(channelId);
    const notifId = 'chatadd_' + channelId + '_' + addedUid + '_' + now();
    try {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO notifications (id, uid, type, title, body, link, icon, actor_uid, entity_type, entity_id, created_at, read_at)
        VALUES (?, ?, 'chat_added', ?, ?, ?, '➕', ?, 'chat_channel', ?, ?, NULL)
      `).bind(notifId, addedUid, title, body, link, actorMe.uid, channelId, now()).run();
    } catch {}
    broadcastToUser(env, addedUid, {
      kind: 'notification',
      notification: { id: notifId, type: 'chat_added', title, body, link, icon: '➕', createdAt: now(), channel_id: channelId },
    });
    runBg(pushChatToDevices(env, addedUid, { title, body, url: link, tag: 'chatadd_' + channelId, icon: null }));
  } catch {}
}

// ── Auth helpers ─────────────────────────────────────────────────────────
// ВАЖНО: юзер может присутствовать в team_chat_* под несколькими uid:
//  - canonical (D1, по email) — так пишет миграция Bitrix и пикер участников;
//  - firebase uid — так писали нативные сообщения/добавления до унификации;
//  - алиасы-дубли с тем же email.
// me.ids — массив всех этих идентификаторов (см. worker.js handleChatRequest).
// Членство/доступ матчим по ЛЮБОМУ из них (строго шире старого «= firebase uid»,
// поэтому никто не теряет доступ, а «потерявшиеся» — находят свои чаты).
function meIds(me) {
  const arr = (me && Array.isArray(me.ids) && me.ids.length)
    ? me.ids.filter(Boolean) : [me?.uid].filter(Boolean);
  return arr.length ? [...new Set(arr)] : ['__none__'];
}
function phList(arr) { return arr.map(() => '?').join(','); }

async function isChannelMember(env, channelId, me) {
  const ids = Array.isArray(me) ? me : meIds(me);
  const row = await env.DB.prepare(
    `SELECT 1 FROM team_chat_members WHERE channel_id = ? AND user_id IN (${phList(ids)})`
  ).bind(channelId, ...ids).first();
  return !!row;
}

// Админ канала может добавлять/убирать участников, переименовывать чат и
// назначать других админов. Матчим по ЛЮБОМУ из uid юзера (как членство).
async function isChannelAdmin(env, channelId, me) {
  // Портальный админ/директор — админ в любом чате (страховка от lockout на
  // legacy-каналах, где created_by не совпал ни с одним текущим uid).
  if (!Array.isArray(me) && (me?.role === 'admin' || me?.isDirector)) return true;
  const ids = Array.isArray(me) ? me : meIds(me);
  const row = await env.DB.prepare(
    `SELECT 1 FROM team_chat_members WHERE channel_id = ? AND user_id IN (${phList(ids)}) AND role = 'admin'`
  ).bind(channelId, ...ids).first();
  return !!row;
}

// ── Ленивая идемпотентная миграция: колонка role в team_chat_members ──────
// Воркер сам добавляет колонку через биндинг env.DB (тот же приём, что в
// /api/admin/deals/migrate-rejects). Флаг модуля гасит повтор в пределах
// изолята; сам ALTER идемпотентен (повторный падает «duplicate column» → ok).
// Бэкфилл: создатель канала становится админом.
let _rolesMigrated = false;
async function ensureRolesColumn(env) {
  if (_rolesMigrated) return;
  try {
    await env.DB.prepare("ALTER TABLE team_chat_members ADD COLUMN role TEXT").run();
  } catch (e) { /* duplicate column — колонка уже есть, это норма */ }
  try {
    await env.DB.prepare(`
      UPDATE team_chat_members SET role = 'admin'
      WHERE (role IS NULL OR role = '')
        AND channel_id IN (
          SELECT id FROM team_chat_channels c WHERE c.created_by = team_chat_members.user_id
        )
    `).run();
  } catch (e) { /* бэкфилл best-effort */ }
  _rolesMigrated = true;
}

// Ленивая миграция: колонка pinned_at в team_chat_members (закрепление чата
// каждым юзером отдельно; NULL = не закреплён).
let _pinColMigrated = false;
async function ensurePinColumn(env) {
  if (_pinColMigrated) return;
  try { await env.DB.prepare("ALTER TABLE team_chat_members ADD COLUMN pinned_at INTEGER").run(); }
  catch (e) { /* колонка уже есть — норма */ }
  _pinColMigrated = true;
}

// Ленивая миграция: колонка icon в team_chat_channels (кастомная иконка группы).
let _iconColMigrated = false;
async function ensureChannelIconColumn(env) {
  if (_iconColMigrated) return;
  try { await env.DB.prepare("ALTER TABLE team_chat_channels ADD COLUMN icon TEXT").run(); }
  catch (e) { /* колонка уже есть — норма */ }
  _iconColMigrated = true;
}

// ── Ленивая идемпотентная миграция: колонка mentions в team_chat_msgs ──────
// Хранит JSON-массив uid'ов, кого упомянули через @ в сообщении. Тот же приём
// самомиграции через биндинг env.DB (deploy-токен не имеет D1-API прав на ALTER).
let _mentionsMigrated = false;
async function ensureMentionsColumn(env) {
  if (_mentionsMigrated) return;
  try {
    await env.DB.prepare("ALTER TABLE team_chat_msgs ADD COLUMN mentions TEXT").run();
  } catch (e) { /* duplicate column — колонка уже есть, это норма */ }
  _mentionsMigrated = true;
}

// Нормализуем mentions из тела запроса / из строки БД к массиву uid'ов.
function parseMentionsValue(val) {
  if (Array.isArray(val)) return val.filter(u => typeof u === 'string' && u);
  if (typeof val === 'string' && val) {
    try { const a = JSON.parse(val); return Array.isArray(a) ? a.filter(u => typeof u === 'string' && u) : []; }
    catch { return []; }
  }
  return [];
}

async function isMessageAccessible(env, messageId, me) {
  const ids = Array.isArray(me) ? me : meIds(me);
  const row = await env.DB.prepare(`
    SELECT m.id FROM team_chat_msgs m
    JOIN team_chat_members cm ON cm.channel_id = m.channel_id
    WHERE m.id = ? AND cm.user_id IN (${phList(ids)})
  `).bind(messageId, ...ids).first();
  return !!row;
}

async function isMessageAuthor(env, messageId, me) {
  const ids = Array.isArray(me) ? me : meIds(me);
  const row = await env.DB.prepare(
    `SELECT 1 FROM team_chat_msgs WHERE id = ? AND user_id IN (${phList(ids)})`
  ).bind(messageId, ...ids).first();
  return !!row;
}

// ── REST handlers ────────────────────────────────────────────────────────

// GET /api/chat/channels?archived=1 — список каналов юзера + unread counts.
// archived=1 — показать архивные вместо активных.
async function listChannels(env, me, url) {
  const ids = meIds(me);
  const wantArchived = !!(url && (url.searchParams.get('archived') === '1' || url.searchParams.get('archived') === 'true'));
  // Derived-таблица cm схлопывает membership-строки юзера к ОДНОЙ на канал —
  // если он числится под несколькими uid (canonical+firebase), канал не
  // задвоится. Снаружи cm.* — обычные скалярные колонки (без агрегатов).
  const { results } = await env.DB.prepare(`
    SELECT
      c.id, c.type, c.name, c.description, c.created_by, c.created_at, c.archived_at, c.icon,
      cm.last_read_message_id, cm.muted, cm.is_admin, cm.pinned_at,
      (SELECT COUNT(*) FROM team_chat_msgs m
         WHERE m.channel_id = c.id
           AND m.deleted_at IS NULL
           AND (cm.last_read_message_id IS NULL
                OR m.created_at > (SELECT created_at FROM team_chat_msgs WHERE id = cm.last_read_message_id))
      ) AS unread_count,
      (SELECT created_at FROM team_chat_msgs
         WHERE channel_id = c.id ORDER BY created_at DESC LIMIT 1
      ) AS last_message_at,
      (SELECT text FROM team_chat_msgs
         WHERE channel_id = c.id ORDER BY created_at DESC LIMIT 1
      ) AS last_message_text
    FROM team_chat_channels c
    JOIN (
      SELECT channel_id, MAX(last_read_message_id) AS last_read_message_id, MAX(muted) AS muted,
             MAX(pinned_at) AS pinned_at,
             MAX(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS is_admin
      FROM team_chat_members
      WHERE user_id IN (${phList(ids)})
      GROUP BY channel_id
    ) cm ON cm.channel_id = c.id
    WHERE c.archived_at IS ${wantArchived ? 'NOT NULL' : 'NULL'}
    ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC
  `).bind(...ids).all();

  // Для DM подтянем имя собеседника. Портальному админу/директору проставим
  // is_admin=1 на всех группах — чтобы UI показывал управление даже там, где
  // он не отмечен админом в team_chat_members (legacy без admin'а).
  const portalAdmin = !!(me?.role === 'admin' || me?.isDirector);
  for (const ch of results) {
    if (ch.type === 'dm') {
      const other = await env.DB.prepare(
        `SELECT user_id FROM team_chat_members WHERE channel_id = ? AND user_id NOT IN (${phList(ids)}) LIMIT 1`
      ).bind(ch.id, ...ids).first();
      ch.other_user_id = other?.user_id || null;
    } else if (portalAdmin) {
      ch.is_admin = 1;
    }
  }
  return jsonRes({ items: results });
}

// POST /api/chat/channels — создать канал / группу
async function createChannel(env, me, body) {
  const type = body.type === 'group' ? 'group' : 'channel';
  const name = String(body.name || '').trim();
  if (!name) return errRes('name required');
  const desc = String(body.description || '').trim() || null;
  const members = Array.isArray(body.members) ? body.members.filter(u => typeof u === 'string') : [];
  if (!members.includes(me.uid)) members.push(me.uid);

  const id = uuid();
  const ts = now();
  await env.DB.prepare(`
    INSERT INTO team_chat_channels (id, type, name, description, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, type, name, desc, me.uid, ts).run();
  for (const uid of members) {
    const role = (uid === me.uid) ? 'admin' : 'member';
    await env.DB.prepare(`
      INSERT OR IGNORE INTO team_chat_members (channel_id, user_id, joined_at, role) VALUES (?, ?, ?, ?)
    `).bind(id, uid, ts, role).run();
  }
  const channel = { id, type, name, description: desc, created_by: me.uid, created_at: ts };
  // Notify всех добавленных
  for (const uid of members) {
    if (uid !== me.uid) broadcastToUser(env, uid, { kind: 'channel_added', channel });
  }
  return jsonRes({ channel });
}

// POST /api/chat/dm — открыть или создать DM с юзером
async function openDm(env, me, body) {
  const otherUid = String(body.user_id || '').trim();
  if (!otherUid || otherUid === me.uid) return errRes('user_id required');
  // Существующий DM?
  const existing = await env.DB.prepare(`
    SELECT c.id FROM team_chat_channels c
    JOIN team_chat_members m1 ON m1.channel_id = c.id AND m1.user_id = ?
    JOIN team_chat_members m2 ON m2.channel_id = c.id AND m2.user_id = ?
    WHERE c.type = 'dm' LIMIT 1
  `).bind(me.uid, otherUid).first();
  if (existing) return jsonRes({ channel_id: existing.id });
  const id = uuid();
  const ts = now();
  await env.DB.prepare(`
    INSERT INTO team_chat_channels (id, type, name, created_by, created_at)
    VALUES (?, 'dm', NULL, ?, ?)
  `).bind(id, me.uid, ts).run();
  await env.DB.prepare(`INSERT INTO team_chat_members (channel_id, user_id, joined_at) VALUES (?, ?, ?), (?, ?, ?)`)
    .bind(id, me.uid, ts, id, otherUid, ts).run();
  broadcastToUser(env, otherUid, { kind: 'channel_added', channel: { id, type: 'dm', other_user_id: me.uid } });
  return jsonRes({ channel_id: id });
}

// GET /api/chat/channels/:id/messages?before=&limit=&around=
// around=<messageId> — окно сообщений вокруг конкретного (для перехода из поиска).
async function getMessages(env, me, channelId, url) {
  if (!(await isChannelMember(env, channelId, me))) return errRes('forbidden', 403);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
  const before = url.searchParams.get('before') || null;
  const around = url.searchParams.get('around') || null;
  let results;
  if (around) {
    const tgt = await env.DB.prepare(
      "SELECT created_at FROM team_chat_msgs WHERE id = ? AND channel_id = ?"
    ).bind(around, channelId).first();
    if (!tgt) {
      results = [];
    } else {
      const half = Math.max(8, Math.floor(limit / 2));
      const { results: newer } = await env.DB.prepare(
        `SELECT * FROM team_chat_msgs WHERE channel_id = ? AND created_at > ? ORDER BY created_at DESC LIMIT ?`
      ).bind(channelId, tgt.created_at, half).all();
      const { results: older } = await env.DB.prepare(
        `SELECT * FROM team_chat_msgs WHERE channel_id = ? AND created_at <= ? ORDER BY created_at DESC LIMIT ?`
      ).bind(channelId, tgt.created_at, half + 1).all();
      results = newer.concat(older);  // общий порядок DESC (как у обычной выборки)
    }
  } else {
    let q, params;
    if (before) {
      q = `SELECT * FROM team_chat_msgs
           WHERE channel_id = ?
             AND created_at < (SELECT created_at FROM team_chat_msgs WHERE id = ?)
           ORDER BY created_at DESC LIMIT ?`;
      params = [channelId, before, limit];
    } else {
      q = `SELECT * FROM team_chat_msgs WHERE channel_id = ?
           ORDER BY created_at DESC LIMIT ?`;
      params = [channelId, limit];
    }
    const r = await env.DB.prepare(q).bind(...params).all();
    results = r.results;
  }
  // Реакции для всех сообщений
  if (results.length) {
    const ids = results.map(m => m.id);
    const ph = ids.map(() => '?').join(',');
    const { results: rx } = await env.DB.prepare(
      `SELECT message_id, emoji, user_id FROM team_chat_reactions WHERE message_id IN (${ph})`
    ).bind(...ids).all();
    const byMsg = {};
    for (const r of rx) {
      if (!byMsg[r.message_id]) byMsg[r.message_id] = {};
      if (!byMsg[r.message_id][r.emoji]) byMsg[r.message_id][r.emoji] = [];
      byMsg[r.message_id][r.emoji].push(r.user_id);
    }
    for (const m of results) {
      m.reactions = Object.entries(byMsg[m.id] || {}).map(([emoji, users]) => ({ emoji, users }));
    }
  }
  return jsonRes({ items: results.reverse() });
}

// POST /api/chat/channels/:id/messages
async function sendMessage(env, me, channelId, body) {
  if (!(await isChannelMember(env, channelId, me))) return errRes('forbidden', 403);
  const text = body.text ? String(body.text).slice(0, 4000) : null;
  const fileKey = body.file_key ? String(body.file_key) : null;
  const fileMeta = body.file_meta ? JSON.stringify(body.file_meta) : null;
  const replyTo = body.reply_to ? String(body.reply_to) : null;
  if (!text && !fileKey) return errRes('text or file_key required');
  let type = 'text';
  if (fileKey) {
    const mime = body.file_meta?.mime || '';
    if (mime.startsWith('image/')) type = 'image';
    else if (mime.startsWith('audio/')) type = 'audio';
    else type = 'file';
  }
  // @-упоминания: валидируем переданные uid'ы против реальных участников канала
  // (нельзя «упомянуть» кого попало). Дедуп + лимит 50, на каждый — 128 симв.
  await ensureMentionsColumn(env);
  let mentions = [];
  const rawMentions = [...new Set(parseMentionsValue(body.mentions).map(u => u.slice(0, 128)))].slice(0, 50);
  if (rawMentions.length) {
    const { results: mem } = await env.DB.prepare(
      'SELECT user_id FROM team_chat_members WHERE channel_id = ?'
    ).bind(channelId).all();
    const memSet = new Set((mem || []).map(x => x.user_id));
    mentions = rawMentions.filter(u => memSet.has(u));
  }
  const mentionsJson = mentions.length ? JSON.stringify(mentions) : null;
  const id = uuid();
  const ts = now();
  await env.DB.prepare(`
    INSERT INTO team_chat_msgs (id, channel_id, user_id, text, type, file_key, file_meta, reply_to, mentions, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, channelId, me.uid, text, type, fileKey, fileMeta, replyTo, mentionsJson, ts).run();
  const message = { id, channel_id: channelId, user_id: me.uid, text, type, file_key: fileKey, file_meta: fileMeta, reply_to: replyTo, mentions, created_at: ts };
  broadcastToChannel(env, channelId, { kind: 'message_new', message });
  runBg(notifyChatMessage(env, channelId, me, message));
  return jsonRes({ message });
}

// POST /api/chat/messages/:id/edit
async function editMessage(env, me, messageId, body) {
  if (!(await isMessageAuthor(env, messageId, me))) return errRes('forbidden', 403);
  const text = String(body.text || '').trim();
  if (!text) return errRes('text required');
  const prev = await env.DB.prepare("SELECT text, channel_id FROM team_chat_msgs WHERE id = ?").bind(messageId).first();
  if (!prev) return errRes('not found', 404);
  const ts = now();
  await env.DB.prepare("UPDATE team_chat_msgs SET text = ?, edited_at = ? WHERE id = ?")
    .bind(text, ts, messageId).run();
  await env.DB.prepare(`
    INSERT INTO team_chat_history (id, message_id, channel_id, author_id, action, prev_text, acted_by, acted_at)
    VALUES (?, ?, ?, ?, 'edited', ?, ?, ?)
  `).bind(uuid(), messageId, prev.channel_id, me.uid, prev.text, me.uid, ts).run();
  broadcastToChannel(env, prev.channel_id, { kind: 'message_edited', message_id: messageId, text, edited_at: ts });
  return jsonRes({ ok: true });
}

// DELETE /api/chat/messages/:id (soft)
async function deleteMessage(env, me, messageId) {
  const msg = await env.DB.prepare("SELECT user_id, channel_id, text FROM team_chat_msgs WHERE id = ?").bind(messageId).first();
  if (!msg) return errRes('not found', 404);
  // Автор сам может удалить; админ — TODO (нужна проверка role/permission в org-tree)
  if (!meIds(me).includes(msg.user_id)) return errRes('forbidden', 403);
  const ts = now();
  await env.DB.prepare("UPDATE team_chat_msgs SET deleted_at = ? WHERE id = ?").bind(ts, messageId).run();
  await env.DB.prepare(`
    INSERT INTO team_chat_history (id, message_id, channel_id, author_id, action, prev_text, acted_by, acted_at)
    VALUES (?, ?, ?, ?, 'deleted', ?, ?, ?)
  `).bind(uuid(), messageId, msg.channel_id, me.uid, msg.text, me.uid, ts).run();
  broadcastToChannel(env, msg.channel_id, { kind: 'message_deleted', message_id: messageId, channel_id: msg.channel_id });
  return jsonRes({ ok: true });
}

// POST /api/chat/messages/:id/reactions { emoji }
async function addReaction(env, me, messageId, body) {
  if (!(await isMessageAccessible(env, messageId, me))) return errRes('forbidden', 403);
  const emoji = String(body.emoji || '').slice(0, 16);
  if (!emoji) return errRes('emoji required');
  const msg = await env.DB.prepare("SELECT channel_id FROM team_chat_msgs WHERE id = ?").bind(messageId).first();
  if (!msg) return errRes('not found', 404);
  await env.DB.prepare(`
    INSERT OR IGNORE INTO team_chat_reactions (message_id, user_id, emoji, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(messageId, me.uid, emoji, now()).run();
  // Собрать актуальный набор
  const { results: rx } = await env.DB.prepare(
    "SELECT emoji, user_id FROM team_chat_reactions WHERE message_id = ?"
  ).bind(messageId).all();
  const grouped = {};
  for (const r of rx) {
    if (!grouped[r.emoji]) grouped[r.emoji] = [];
    grouped[r.emoji].push(r.user_id);
  }
  const reactions = Object.entries(grouped).map(([emoji, users]) => ({ emoji, users }));
  broadcastToChannel(env, msg.channel_id, { kind: 'reaction_changed', message_id: messageId, reactions });
  return jsonRes({ reactions });
}

// DELETE /api/chat/messages/:id/reactions { emoji }
async function removeReaction(env, me, messageId, body) {
  const emoji = String(body.emoji || '').slice(0, 16);
  if (!emoji) return errRes('emoji required');
  const msg = await env.DB.prepare("SELECT channel_id FROM team_chat_msgs WHERE id = ?").bind(messageId).first();
  if (!msg) return errRes('not found', 404);
  await env.DB.prepare(`
    DELETE FROM team_chat_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?
  `).bind(messageId, me.uid, emoji).run();
  const { results: rx } = await env.DB.prepare(
    "SELECT emoji, user_id FROM team_chat_reactions WHERE message_id = ?"
  ).bind(messageId).all();
  const grouped = {};
  for (const r of rx) { if (!grouped[r.emoji]) grouped[r.emoji] = []; grouped[r.emoji].push(r.user_id); }
  const reactions = Object.entries(grouped).map(([emoji, users]) => ({ emoji, users }));
  broadcastToChannel(env, msg.channel_id, { kind: 'reaction_changed', message_id: messageId, reactions });
  return jsonRes({ reactions });
}

// POST /api/chat/channels/:id/read { last_read_message_id }
async function markAsRead(env, me, channelId, body) {
  if (!(await isChannelMember(env, channelId, me))) return errRes('forbidden', 403);
  const lastReadId = String(body.last_read_message_id || '');
  if (!lastReadId) return errRes('last_read_message_id required');
  const ids = meIds(me);
  await env.DB.prepare(
    `UPDATE team_chat_members SET last_read_message_id = ? WHERE channel_id = ? AND user_id IN (${phList(ids)})`
  ).bind(lastReadId, channelId, ...ids).run();
  broadcastToChannel(env, channelId, { kind: 'read', channel_id: channelId, user_id: me.uid, last_read_message_id: lastReadId });
  // Открыл канал → схлопнутое уведомление «chatnt_<channel>_<uid>» считаем прочитанным,
  // колокольчик в team.html обновляем реактивно (kind:'notif_read'), без ожидания поллинга.
  try {
    const notifIds = ids.map(u => 'chatnt_' + channelId + '_' + u);
    await env.DB.prepare(
      `UPDATE notifications SET read_at = ? WHERE id IN (${phList(notifIds)}) AND read_at IS NULL`
    ).bind(now(), ...notifIds).run();
  } catch {}
  for (const u of ids) broadcastToUser(env, u, { kind: 'notif_read', channel_id: channelId });
  return jsonRes({ ok: true });
}

// POST /api/chat/channels/:id/mute { muted: bool }
async function setMuted(env, me, channelId, body) {
  if (!(await isChannelMember(env, channelId, me))) return errRes('forbidden', 403);
  const muted = body.muted ? 1 : 0;
  const ids = meIds(me);
  await env.DB.prepare(
    `UPDATE team_chat_members SET muted = ? WHERE channel_id = ? AND user_id IN (${phList(ids)})`
  ).bind(muted, channelId, ...ids).run();
  return jsonRes({ ok: true, muted: !!muted });
}

// POST /api/chat/channels/:id/leave
async function leaveChannel(env, me, channelId) {
  const ids = meIds(me);
  await env.DB.prepare(
    `DELETE FROM team_chat_members WHERE channel_id = ? AND user_id IN (${phList(ids)})`
  ).bind(channelId, ...ids).run();
  broadcastToChannel(env, channelId, { kind: 'user_left', channel_id: channelId, user_id: me.uid });
  broadcastToUser(env, me.uid, { kind: 'channel_removed', channel_id: channelId });
  return jsonRes({ ok: true });
}

// GET /api/chat/channels/:id/members
async function getMembers(env, me, channelId) {
  if (!(await isChannelMember(env, channelId, me))) return errRes('forbidden', 403);
  const { results } = await env.DB.prepare(
    "SELECT user_id, joined_at, muted, role FROM team_chat_members WHERE channel_id = ?"
  ).bind(channelId).all();
  return jsonRes({ items: results });
}

// GET /api/chat/roster — справочник сотрудников для пикеров (добавить участника /
// создать канал / DM). Берём ИЗ D1 users — это та же каноническая личность, что
// матчит членство в чате (в отличие от Firebase /users.json-зеркала, где новых/
// пересозданных людей может не быть — отсюда «не находит» в пикере). Имена и
// почты — не секрет, доступно любому авторизованному. Отдаём и uid, и email,
// чтобы фронт мог слить с зеркалом без дублей.
async function getRoster(env, me) {
  const { results } = await env.DB.prepare(
    `SELECT uid, email, name, last_name, position
       FROM users
      WHERE uid IS NOT NULL AND COALESCE(active, 1) = 1
      ORDER BY last_name COLLATE NOCASE, name COLLATE NOCASE`
  ).all();
  return jsonRes({ items: results });
}

// POST /api/chat/legacy-join-all { confirm: true }
// Добавляет вызывающего юзера ко всем legacy_* каналам (где он был в Bitrix
// но миграция не подцепила потому что он не писал в этом канале).
// На каждый канал — INSERT OR IGNORE (никаких дублей).
async function legacyJoinAll(env, me, body) {
  if (!body?.confirm) return errRes('confirm:true required');
  const ts = now();
  const r = await env.DB.prepare(`
    INSERT OR IGNORE INTO team_chat_members (channel_id, user_id, joined_at)
    SELECT id, ?, ? FROM team_chat_channels WHERE id LIKE 'legacy_%'
  `).bind(me.uid, ts).run();
  return jsonRes({ ok: true, added: r.meta?.changes || 0 });
}

// DELETE /api/chat/channels/:id/members/:user_id — убрать участника.
// Только админ канала. Создателя (created_by) убрать нельзя. Себя — через /leave.
async function removeMember(env, me, channelId, targetUid) {
  if (!(await isChannelMember(env, channelId, me))) return errRes('forbidden', 403);
  const ch = await env.DB.prepare("SELECT created_by, type FROM team_chat_channels WHERE id = ?").bind(channelId).first();
  if (ch?.type === 'dm') return errRes('в личной переписке нельзя менять участников', 400);
  if (!(await isChannelAdmin(env, channelId, me))) return errRes('только администратор может убирать участников', 403);
  if (ch?.created_by === targetUid) {
    return errRes('нельзя убрать создателя канала', 403);
  }
  await env.DB.prepare(
    "DELETE FROM team_chat_members WHERE channel_id = ? AND user_id = ?"
  ).bind(channelId, targetUid).run();
  broadcastToChannel(env, channelId, { kind: 'user_left', channel_id: channelId, user_id: targetUid });
  broadcastToUser(env, targetUid, { kind: 'channel_removed', channel_id: channelId });
  return jsonRes({ ok: true });
}

// POST /api/chat/channels/:id/members { user_ids: [...] }
// Только админ канала может добавлять участников.
async function addMembers(env, me, channelId, body) {
  if (!(await isChannelMember(env, channelId, me))) return errRes('forbidden', 403);
  const ch = await env.DB.prepare("SELECT type FROM team_chat_channels WHERE id = ?").bind(channelId).first();
  if (ch?.type === 'dm') return errRes('в личной переписке нельзя менять участников', 400);
  if (!(await isChannelAdmin(env, channelId, me))) return errRes('только администратор может добавлять участников', 403);
  const userIds = Array.isArray(body.user_ids) ? body.user_ids.filter(u => typeof u === 'string') : [];
  if (userIds.length === 0) return errRes('user_ids required');
  const ts = now();
  for (const uid of userIds) {
    const r = await env.DB.prepare(
      "INSERT OR IGNORE INTO team_chat_members (channel_id, user_id, joined_at, role) VALUES (?, ?, ?, 'member')"
    ).bind(channelId, uid, ts).run();
    broadcastToUser(env, uid, { kind: 'channel_added', channel_id: channelId });
    broadcastToChannel(env, channelId, { kind: 'user_joined', channel_id: channelId, user_id: uid });
    // Только реально добавленным (а не уже состоявшим) — колокольчик + push.
    if (r.meta?.changes) runBg(notifyAddedToChannel(env, channelId, me, uid));
  }
  return jsonRes({ ok: true });
}

// POST /api/chat/channels/:id/members/remove { user_ids: [...] } — пакетно убрать
// участников (например, целый отдел/отделение). Только админ канала. Создателя
// (created_by) убрать нельзя — молча пропускаем. Шлём по событию на каждого.
async function removeMembers(env, me, channelId, body) {
  if (!(await isChannelMember(env, channelId, me))) return errRes('forbidden', 403);
  const ch = await env.DB.prepare("SELECT created_by, type FROM team_chat_channels WHERE id = ?").bind(channelId).first();
  if (ch?.type === 'dm') return errRes('в личной переписке нельзя менять участников', 400);
  if (!(await isChannelAdmin(env, channelId, me))) return errRes('только администратор может убирать участников', 403);
  const userIds = Array.isArray(body.user_ids)
    ? body.user_ids.filter(u => typeof u === 'string' && u && u !== ch.created_by)
    : [];
  if (userIds.length === 0) return errRes('user_ids required');
  let removed = 0;
  for (const uid of userIds) {
    const r = await env.DB.prepare(
      "DELETE FROM team_chat_members WHERE channel_id = ? AND user_id = ?"
    ).bind(channelId, uid).run();
    if (r.meta?.changes) {
      removed += r.meta.changes;
      broadcastToChannel(env, channelId, { kind: 'user_left', channel_id: channelId, user_id: uid });
      broadcastToUser(env, uid, { kind: 'channel_removed', channel_id: channelId });
    }
  }
  return jsonRes({ ok: true, removed });
}

// POST /api/chat/channels/:id/rename { name } — переименовать группу/канал.
// Только админ. DM переименовать нельзя (имя берётся от собеседника).
async function renameChannel(env, me, channelId, body) {
  const ch = await env.DB.prepare("SELECT type FROM team_chat_channels WHERE id = ?").bind(channelId).first();
  if (!ch) return errRes('not found', 404);
  if (ch.type === 'dm') return errRes('личную переписку нельзя переименовать', 400);
  if (!(await isChannelAdmin(env, channelId, me))) return errRes('только администратор может переименовать чат', 403);
  const name = String(body.name || '').trim().slice(0, 120);
  if (!name) return errRes('name required');
  await env.DB.prepare("UPDATE team_chat_channels SET name = ? WHERE id = ?").bind(name, channelId).run();
  broadcastToChannel(env, channelId, { kind: 'channel_renamed', channel_id: channelId, name });
  return jsonRes({ ok: true, name });
}

// POST /api/chat/channels/:id/icon { icon } — сменить иконку группы (эмодзи).
async function setChannelIcon(env, me, channelId, body) {
  const ch = await env.DB.prepare("SELECT type FROM team_chat_channels WHERE id = ?").bind(channelId).first();
  if (!ch) return errRes('not found', 404);
  if (ch.type === 'dm') return errRes('у личной переписки нельзя менять иконку', 400);
  if (!(await isChannelAdmin(env, channelId, me))) return errRes('только администратор может менять иконку', 403);
  await ensureChannelIconColumn(env);
  const icon = String(body.icon || '').trim().slice(0, 16) || null;
  await env.DB.prepare("UPDATE team_chat_channels SET icon = ? WHERE id = ?").bind(icon, channelId).run();
  broadcastToChannel(env, channelId, { kind: 'channel_icon', channel_id: channelId, icon });
  return jsonRes({ ok: true, icon });
}

// POST /api/chat/channels/:id/icon-upload (multipart file) — иконка-картинка.
// Кладём в R2, отдаём через публичный /api/avatar/{key}, ставим icon = URL.
async function uploadChannelIcon(request, env, me, channelId) {
  const ch = await env.DB.prepare("SELECT type FROM team_chat_channels WHERE id = ?").bind(channelId).first();
  if (!ch) return errRes('not found', 404);
  if (ch.type === 'dm') return errRes('у личной переписки нельзя менять иконку', 400);
  if (!(await isChannelAdmin(env, channelId, me))) return errRes('только администратор может менять иконку', 403);
  if (!env.FILES) return errRes('R2 не настроен', 500);
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return errRes('file required');
  if (!/^image\//i.test(file.type || '')) return errRes('нужен файл-изображение', 400);
  if (file.size > 3 * 1024 * 1024) return errRes('файл слишком большой (макс 3 МБ)', 413);
  const ext = (file.type || '').includes('png') ? 'png' : (file.type || '').includes('webp') ? 'webp' : 'jpg';
  const rand = Math.random().toString(36).slice(2, 8);
  const safe = String(channelId).replace(/[^\w.\-]/g, '_').slice(0, 60);
  const key = `wa-avatars/chat-${safe}-${rand}.${ext}`;
  await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { kind: 'chat-icon' } });
  const icon = `${new URL(request.url).origin}/api/avatar/${encodeURIComponent(key)}`;
  await ensureChannelIconColumn(env);
  await env.DB.prepare("UPDATE team_chat_channels SET icon = ? WHERE id = ?").bind(icon, channelId).run();
  broadcastToChannel(env, channelId, { kind: 'channel_icon', channel_id: channelId, icon });
  return jsonRes({ ok: true, icon });
}

// POST /api/chat/channels/:id/archive { archived } — архивировать/вернуть чат.
// Только создатель чата или администратор (для групп и для личных переписок).
async function archiveChannel(env, me, channelId, body) {
  const ch = await env.DB.prepare("SELECT type, created_by FROM team_chat_channels WHERE id = ?").bind(channelId).first();
  if (!ch) return errRes('not found', 404);
  if (!(await isChannelMember(env, channelId, me))) return errRes('forbidden', 403);
  const isCreator = meIds(me).includes(ch.created_by);
  if (!isCreator && !(await isChannelAdmin(env, channelId, me))) {
    return errRes('архивировать может только создатель или администратор чата', 403);
  }
  const ts = body.archived === false ? null : Date.now();
  await env.DB.prepare("UPDATE team_chat_channels SET archived_at = ? WHERE id = ?").bind(ts, channelId).run();
  broadcastToChannel(env, channelId, { kind: ts ? 'channel_archived' : 'channel_unarchived', channel_id: channelId });
  return jsonRes({ ok: true, archived: !!ts });
}

// POST /api/chat/channels/:id/pin { pinned } — закрепить/открепить чат (для себя).
// Не больше 5 закреплённых на юзера.
const MAX_PINNED = 5;
async function pinChannel(env, me, channelId, body) {
  if (!(await isChannelMember(env, channelId, me))) return errRes('forbidden', 403);
  await ensurePinColumn(env);
  const ids = meIds(me);
  const wantPin = body.pinned !== false;
  if (wantPin) {
    const { results } = await env.DB.prepare(
      `SELECT DISTINCT channel_id FROM team_chat_members WHERE user_id IN (${phList(ids)}) AND pinned_at IS NOT NULL`
    ).bind(...ids).all();
    const already = results.some(r => r.channel_id === channelId);
    if (!already && results.length >= MAX_PINNED) {
      return errRes(`можно закрепить не больше ${MAX_PINNED} чатов`, 400);
    }
  }
  const ts = wantPin ? Date.now() : null;
  await env.DB.prepare(
    `UPDATE team_chat_members SET pinned_at = ? WHERE channel_id = ? AND user_id IN (${phList(ids)})`
  ).bind(ts, channelId, ...ids).run();
  return jsonRes({ ok: true, pinned: !!ts });
}

// POST /api/chat/channels/:id/members/:uid/role { role: 'admin'|'member' }
// Только админ может назначать/снимать админов (передавать права). Роль
// создателя канала не трогаем — он всегда остаётся админом.
async function setMemberRole(env, me, channelId, targetUid, body) {
  const ch = await env.DB.prepare("SELECT type, created_by FROM team_chat_channels WHERE id = ?").bind(channelId).first();
  if (!ch) return errRes('not found', 404);
  if (ch.type === 'dm') return errRes('в личной переписке нет ролей', 400);
  if (!(await isChannelAdmin(env, channelId, me))) return errRes('только администратор может назначать админов', 403);
  const role = body.role === 'admin' ? 'admin' : 'member';
  if (ch.created_by === targetUid && role !== 'admin') {
    return errRes('создатель чата всегда остаётся админом', 400);
  }
  const exists = await env.DB.prepare(
    "SELECT 1 FROM team_chat_members WHERE channel_id = ? AND user_id = ?"
  ).bind(channelId, targetUid).first();
  if (!exists) return errRes('пользователь не в чате', 404);
  await env.DB.prepare(
    "UPDATE team_chat_members SET role = ? WHERE channel_id = ? AND user_id = ?"
  ).bind(role, channelId, targetUid).run();
  broadcastToChannel(env, channelId, { kind: 'members_changed', channel_id: channelId });
  broadcastToUser(env, targetUid, { kind: 'role_changed', channel_id: channelId, role });
  return jsonRes({ ok: true, role });
}

// GET /api/chat/search?q=&channel_id=
async function searchMessages(env, me, url) {
  const q = (url.searchParams.get('q') || '').trim();
  const channelId = url.searchParams.get('channel_id') || null;
  if (!q) return jsonRes({ items: [] });
  // Только каналы где юзер участник (под любым из своих uid)
  const sIds = meIds(me);
  const { results: chs } = await env.DB.prepare(
    `SELECT DISTINCT channel_id FROM team_chat_members WHERE user_id IN (${phList(sIds)})`
  ).bind(...sIds).all();
  const allowedChannels = chs.map(c => c.channel_id);
  if (allowedChannels.length === 0) return jsonRes({ items: [] });
  // FTS5 MATCH
  let sql = `
    SELECT m.id, m.channel_id, m.user_id, m.text, m.created_at
    FROM team_chat_msgs_fts f
    JOIN team_chat_msgs m ON m.id = f.message_id
    WHERE team_chat_msgs_fts MATCH ?
      AND m.deleted_at IS NULL
  `;
  const params = [q];
  if (channelId) { sql += " AND m.channel_id = ?"; params.push(channelId); }
  const ph = allowedChannels.map(() => '?').join(',');
  sql += ` AND m.channel_id IN (${ph}) ORDER BY m.created_at DESC LIMIT 50`;
  params.push(...allowedChannels);
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return jsonRes({ items: results });
}

// POST /api/chat/files/upload — multipart/form-data, возвращает {file_key, file_meta}
async function uploadFile(request, env, me) {
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return errRes('file required');
  const key = `team-chat/${me.uid}/${uuid()}-${file.name}`;
  await env.FILES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });
  return jsonRes({
    file_key: key,
    file_meta: { name: file.name, size: file.size, mime: file.type },
  });
}

// GET /api/chat/files/:key — отдача файла.
// Экспортируется: worker.js перехватывает GET ДО auth-гейта /api/chat/* и
// пускает через requireAuthFlexible (?auth=token), т.к. <img src>/<a href>
// не умеют слать заголовок Authorization. 'inline' — чтобы картинки и pdf
// открывались прямо во вкладке, а не скачивались.
export async function downloadFile(request, env, fileKey) {
  const obj = await env.FILES.get(fileKey);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'Content-Disposition': 'inline',
      'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'private, max-age=86400',
    },
  });
}

// ── Главный диспетчер чат-роутов ─────────────────────────────────────────
// Вызывается из worker.js: handleChatRequest(request, env, url, me, ctx)
// где me — уже-валидированный объект юзера ({uid, name, email, role}),
// ctx — execution context запроса (для ctx.waitUntil фоновой рассылки push).
export async function handleChatRequest(request, env, url, me, ctx) {
  _chatCtx = ctx || null;
  const p = url.pathname;
  const m = request.method;

  // Идемпотентно гарантируем колонки (ленивые миграции, флаг на изолят).
  await ensureRolesColumn(env);
  await ensureChannelIconColumn(env);
  await ensurePinColumn(env);

  // Channels
  if (p === '/api/chat/channels' && m === 'GET')  return listChannels(env, me, url);
  if (p === '/api/chat/channels' && m === 'POST') return createChannel(env, me, await request.json().catch(() => ({})));
  if (p === '/api/chat/dm'       && m === 'POST') return openDm(env, me, await request.json().catch(() => ({})));
  if (p === '/api/chat/roster'   && m === 'GET')  return getRoster(env, me);

  // /api/chat/channels/:id/...
  const chMatch = p.match(/^\/api\/chat\/channels\/([^/]+)(\/[^?]*)?$/);
  if (chMatch) {
    const channelId = chMatch[1];
    const sub = chMatch[2] || '';
    if (sub === '/messages' && m === 'GET')  return getMessages(env, me, channelId, url);
    if (sub === '/messages' && m === 'POST') return sendMessage(env, me, channelId, await request.json().catch(() => ({})));
    if (sub === '/members'  && m === 'GET')  return getMembers(env, me, channelId);
    if (sub === '/members'  && m === 'POST') return addMembers(env, me, channelId, await request.json().catch(() => ({})));
    if (sub === '/members/remove' && m === 'POST') return removeMembers(env, me, channelId, await request.json().catch(() => ({})));
    if (sub === '/read'     && m === 'POST') return markAsRead(env, me, channelId, await request.json().catch(() => ({})));
    if (sub === '/mute'     && m === 'POST') return setMuted(env, me, channelId, await request.json().catch(() => ({})));
    if (sub === '/leave'    && m === 'POST') return leaveChannel(env, me, channelId);
    if (sub === '/rename'   && m === 'POST') return renameChannel(env, me, channelId, await request.json().catch(() => ({})));
    if (sub === '/icon'     && m === 'POST') return setChannelIcon(env, me, channelId, await request.json().catch(() => ({})));
    if (sub === '/icon-upload' && m === 'POST') return uploadChannelIcon(request, env, me, channelId);
    if (sub === '/archive'  && m === 'POST') return archiveChannel(env, me, channelId, await request.json().catch(() => ({})));
    if (sub === '/pin'      && m === 'POST') return pinChannel(env, me, channelId, await request.json().catch(() => ({})));
    // /api/chat/channels/:id/members/:uid/role (POST) — назначить/снять админа
    const roleMatch = sub.match(/^\/members\/(.+)\/role$/);
    if (roleMatch && m === 'POST') return setMemberRole(env, me, channelId, decodeURIComponent(roleMatch[1]), await request.json().catch(() => ({})));
    // /api/chat/channels/:id/members/:uid (DELETE)
    const memMatch = sub.match(/^\/members\/([^/]+)$/);
    if (memMatch && m === 'DELETE') return removeMember(env, me, channelId, decodeURIComponent(memMatch[1]));
  }

  // /api/chat/legacy-join-all — admin добавляет себя ко всем legacy-каналам,
  // в которые он был добавлен в Bitrix, но не остался в migrated members
  // (т.к. не писал). Полезно для директора/главы — увидеть все архивные группы.
  if (p === '/api/chat/legacy-join-all' && m === 'POST') {
    return legacyJoinAll(env, me, await request.json().catch(() => ({})));
  }

  // /api/chat/messages/:id/...
  const msgMatch = p.match(/^\/api\/chat\/messages\/([^/]+)(\/[^?]*)?$/);
  if (msgMatch) {
    const messageId = msgMatch[1];
    const sub = msgMatch[2] || '';
    if (sub === '/edit'      && m === 'POST')   return editMessage(env, me, messageId, await request.json().catch(() => ({})));
    if (sub === ''           && m === 'DELETE') return deleteMessage(env, me, messageId);
    if (sub === '/reactions' && m === 'POST')   return addReaction(env, me, messageId, await request.json().catch(() => ({})));
    if (sub === '/reactions' && m === 'DELETE') return removeReaction(env, me, messageId, await request.json().catch(() => ({})));
  }

  // Search + files
  if (p === '/api/chat/search'        && m === 'GET')  return searchMessages(env, me, url);
  if (p === '/api/chat/files/upload'  && m === 'POST') return uploadFile(request, env, me);
  const fileMatch = p.match(/^\/api\/chat\/files\/(.+)$/);
  if (fileMatch && m === 'GET') return downloadFile(request, env, decodeURIComponent(fileMatch[1]));

  return null;  // не наш роут
}

// ── WebSocket /api/ws/user — подключение вкладки юзера к UserNotifyRoom ──
// ВАЖНО: обрабатывается ДО CORS-обёртки (CORS ломает WS upgrade response).
export async function handleChatWebSocket(request, env, url) {
  const upgrade = request.headers.get('Upgrade');
  if (upgrade !== 'websocket') return new Response('Expected websocket', { status: 400 });

  // Auth: Firebase ID token в query ?token=...
  const token = url.searchParams.get('token') || '';
  if (!token) return new Response('token required', { status: 401 });
  let claims;
  try {
    // Используем тот же verify что в requireAuth (импортируется в worker.js)
    // Через env-сlosure нельзя — поэтому делегируем worker.js передать verifyIdToken
    claims = await env._verifyIdToken(token);
  } catch (e) {
    return new Response('invalid token: ' + (e?.message || e), { status: 401 });
  }
  // ВАЖНО: подключаемся под КАНОНИЧЕСКИМ uid (D1, по email) — тем же, что
  // используется в team_chat_members и broadcastToChannel. Иначе WS слушает
  // комнату firebase-uid, а пуши уходят в комнату canonical-uid → реактивности
  // нет (сообщения видны только после перезагрузки).
  let uid = null;
  if (typeof env._resolveCanonicalUid === 'function') {
    try { uid = await env._resolveCanonicalUid(claims); } catch {}
  }
  if (!uid) uid = claims?.user_id || claims?.sub || claims?.uid;
  if (!uid) return new Response('uid not in token', { status: 401 });

  // Проксируем в UserNotifyRoom
  const id = env.USER_NOTIFY.idFromName(uid);
  const stub = env.USER_NOTIFY.get(id);
  return stub.fetch(`https://do/connect?uid=${encodeURIComponent(uid)}`, {
    headers: { Upgrade: 'websocket' },
  });
}
