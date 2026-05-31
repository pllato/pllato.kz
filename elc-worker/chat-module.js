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

async function broadcastToUser(env, userId, payload) {
  try {
    const id = env.USER_NOTIFY.idFromName(userId);
    const stub = env.USER_NOTIFY.get(id);
    await stub.fetch('https://do/push', { method: 'POST', body: JSON.stringify(payload) });
  } catch {}
}

// ── Auth helpers ─────────────────────────────────────────────────────────
async function isChannelMember(env, channelId, userId) {
  const row = await env.DB.prepare(
    "SELECT 1 FROM team_chat_members WHERE channel_id = ? AND user_id = ?"
  ).bind(channelId, userId).first();
  return !!row;
}

async function isMessageAccessible(env, messageId, userId) {
  const row = await env.DB.prepare(`
    SELECT m.id FROM team_chat_msgs m
    JOIN team_chat_members cm ON cm.channel_id = m.channel_id
    WHERE m.id = ? AND cm.user_id = ?
  `).bind(messageId, userId).first();
  return !!row;
}

async function isMessageAuthor(env, messageId, userId) {
  const row = await env.DB.prepare(
    "SELECT 1 FROM team_chat_msgs WHERE id = ? AND user_id = ?"
  ).bind(messageId, userId).first();
  return !!row;
}

// ── REST handlers ────────────────────────────────────────────────────────

// GET /api/chat/channels — список каналов юзера + unread counts
async function listChannels(env, me) {
  const { results } = await env.DB.prepare(`
    SELECT
      c.id, c.type, c.name, c.description, c.created_by, c.created_at, c.archived_at,
      cm.last_read_message_id, cm.muted,
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
    JOIN team_chat_members cm ON cm.channel_id = c.id
    WHERE cm.user_id = ? AND c.archived_at IS NULL
    ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC
  `).bind(me.uid).all();

  // Для DM подтянем имя собеседника
  for (const ch of results) {
    if (ch.type === 'dm') {
      const other = await env.DB.prepare(
        "SELECT user_id FROM team_chat_members WHERE channel_id = ? AND user_id != ? LIMIT 1"
      ).bind(ch.id, me.uid).first();
      ch.other_user_id = other?.user_id || null;
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
    await env.DB.prepare(`
      INSERT OR IGNORE INTO team_chat_members (channel_id, user_id, joined_at) VALUES (?, ?, ?)
    `).bind(id, uid, ts).run();
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

// GET /api/chat/channels/:id/messages?before=&limit=
async function getMessages(env, me, channelId, url) {
  if (!(await isChannelMember(env, channelId, me.uid))) return errRes('forbidden', 403);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
  const before = url.searchParams.get('before') || null;
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
  const { results } = await env.DB.prepare(q).bind(...params).all();
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
  if (!(await isChannelMember(env, channelId, me.uid))) return errRes('forbidden', 403);
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
  const id = uuid();
  const ts = now();
  await env.DB.prepare(`
    INSERT INTO team_chat_msgs (id, channel_id, user_id, text, type, file_key, file_meta, reply_to, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, channelId, me.uid, text, type, fileKey, fileMeta, replyTo, ts).run();
  const message = { id, channel_id: channelId, user_id: me.uid, text, type, file_key: fileKey, file_meta: fileMeta, reply_to: replyTo, created_at: ts };
  broadcastToChannel(env, channelId, { kind: 'message_new', message });
  return jsonRes({ message });
}

// POST /api/chat/messages/:id/edit
async function editMessage(env, me, messageId, body) {
  if (!(await isMessageAuthor(env, messageId, me.uid))) return errRes('forbidden', 403);
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
  if (msg.user_id !== me.uid) return errRes('forbidden', 403);
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
  if (!(await isMessageAccessible(env, messageId, me.uid))) return errRes('forbidden', 403);
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
  if (!(await isChannelMember(env, channelId, me.uid))) return errRes('forbidden', 403);
  const lastReadId = String(body.last_read_message_id || '');
  if (!lastReadId) return errRes('last_read_message_id required');
  await env.DB.prepare(
    "UPDATE team_chat_members SET last_read_message_id = ? WHERE channel_id = ? AND user_id = ?"
  ).bind(lastReadId, channelId, me.uid).run();
  broadcastToChannel(env, channelId, { kind: 'read', channel_id: channelId, user_id: me.uid, last_read_message_id: lastReadId });
  return jsonRes({ ok: true });
}

// POST /api/chat/channels/:id/mute { muted: bool }
async function setMuted(env, me, channelId, body) {
  if (!(await isChannelMember(env, channelId, me.uid))) return errRes('forbidden', 403);
  const muted = body.muted ? 1 : 0;
  await env.DB.prepare(
    "UPDATE team_chat_members SET muted = ? WHERE channel_id = ? AND user_id = ?"
  ).bind(muted, channelId, me.uid).run();
  return jsonRes({ ok: true, muted: !!muted });
}

// POST /api/chat/channels/:id/leave
async function leaveChannel(env, me, channelId) {
  await env.DB.prepare(
    "DELETE FROM team_chat_members WHERE channel_id = ? AND user_id = ?"
  ).bind(channelId, me.uid).run();
  broadcastToChannel(env, channelId, { kind: 'user_left', channel_id: channelId, user_id: me.uid });
  broadcastToUser(env, me.uid, { kind: 'channel_removed', channel_id: channelId });
  return jsonRes({ ok: true });
}

// GET /api/chat/channels/:id/members
async function getMembers(env, me, channelId) {
  if (!(await isChannelMember(env, channelId, me.uid))) return errRes('forbidden', 403);
  const { results } = await env.DB.prepare(
    "SELECT user_id, joined_at, muted FROM team_chat_members WHERE channel_id = ?"
  ).bind(channelId).all();
  return jsonRes({ items: results });
}

// POST /api/chat/channels/:id/members { user_ids: [...] }
async function addMembers(env, me, channelId, body) {
  if (!(await isChannelMember(env, channelId, me.uid))) return errRes('forbidden', 403);
  const userIds = Array.isArray(body.user_ids) ? body.user_ids.filter(u => typeof u === 'string') : [];
  if (userIds.length === 0) return errRes('user_ids required');
  const ts = now();
  for (const uid of userIds) {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO team_chat_members (channel_id, user_id, joined_at) VALUES (?, ?, ?)"
    ).bind(channelId, uid, ts).run();
    broadcastToUser(env, uid, { kind: 'channel_added', channel_id: channelId });
    broadcastToChannel(env, channelId, { kind: 'user_joined', channel_id: channelId, user_id: uid });
  }
  return jsonRes({ ok: true });
}

// GET /api/chat/search?q=&channel_id=
async function searchMessages(env, me, url) {
  const q = (url.searchParams.get('q') || '').trim();
  const channelId = url.searchParams.get('channel_id') || null;
  if (!q) return jsonRes({ items: [] });
  // Только каналы где юзер участник
  const { results: chs } = await env.DB.prepare(
    "SELECT channel_id FROM team_chat_members WHERE user_id = ?"
  ).bind(me.uid).all();
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

// GET /api/chat/files/:key — отдача файла
async function downloadFile(request, env, fileKey) {
  const obj = await env.FILES.get(fileKey);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'private, max-age=86400',
    },
  });
}

// ── Главный диспетчер чат-роутов ─────────────────────────────────────────
// Вызывается из worker.js: handleChatRequest(request, env, url, me)
// где me — уже-валидированный объект юзера ({uid, name, email, role}).
export async function handleChatRequest(request, env, url, me) {
  const p = url.pathname;
  const m = request.method;

  // Channels
  if (p === '/api/chat/channels' && m === 'GET')  return listChannels(env, me);
  if (p === '/api/chat/channels' && m === 'POST') return createChannel(env, me, await request.json().catch(() => ({})));
  if (p === '/api/chat/dm'       && m === 'POST') return openDm(env, me, await request.json().catch(() => ({})));

  // /api/chat/channels/:id/...
  const chMatch = p.match(/^\/api\/chat\/channels\/([^/]+)(\/[^?]*)?$/);
  if (chMatch) {
    const channelId = chMatch[1];
    const sub = chMatch[2] || '';
    if (sub === '/messages' && m === 'GET')  return getMessages(env, me, channelId, url);
    if (sub === '/messages' && m === 'POST') return sendMessage(env, me, channelId, await request.json().catch(() => ({})));
    if (sub === '/members'  && m === 'GET')  return getMembers(env, me, channelId);
    if (sub === '/members'  && m === 'POST') return addMembers(env, me, channelId, await request.json().catch(() => ({})));
    if (sub === '/read'     && m === 'POST') return markAsRead(env, me, channelId, await request.json().catch(() => ({})));
    if (sub === '/mute'     && m === 'POST') return setMuted(env, me, channelId, await request.json().catch(() => ({})));
    if (sub === '/leave'    && m === 'POST') return leaveChannel(env, me, channelId);
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
  const uid = claims?.user_id || claims?.sub || claims?.uid;
  if (!uid) return new Response('uid not in token', { status: 401 });

  // Проксируем в UserNotifyRoom
  const id = env.USER_NOTIFY.idFromName(uid);
  const stub = env.USER_NOTIFY.get(id);
  return stub.fetch(`https://do/connect?uid=${encodeURIComponent(uid)}`, {
    headers: { Upgrade: 'websocket' },
  });
}
