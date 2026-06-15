/**
 * Pllato Meet — сигналинг-воркер (Cloudflare Worker + Durable Object).
 *
 * Видео/звук идут НАПРЯМУЮ между участниками (WebRTC P2P), воркер их не видит.
 * Воркер только: сводит участников, держит зал ожидания и пересылает
 * WebRTC-сигналы (offer/answer/ICE) + чат + транскрипт.
 *
 * Один Durable Object = одна комната (по имени = roomId).
 * WebSocket Hibernation API → почти бесплатно даже при простое.
 *
 * Маршруты:
 *   GET /room/:id   (Upgrade: websocket) — подключиться к комнате
 *   GET /health     — проверка
 *
 * Деплой:  cd meet-worker && wrangler deploy
 * Адрес:   wss://pllato-meet.<account>.workers.dev/room/<roomId>
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};
const SAFE = /^[A-Za-z0-9_.-]{1,80}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, service: 'pllato-meet', ts: Date.now(), archive: !!env.ARCHIVE }), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // ===== Архив встреч (Cloudflare R2) =====
    const aRec = url.pathname.match(/^\/archive\/rec\/([^/]+)\/([^/]+)$/);
    const aMeta = url.pathname.match(/^\/archive\/meta\/([^/]+)\/([^/]+)$/);
    const aList = url.pathname.match(/^\/archive\/list\/([^/]+)$/);
    const aDel = url.pathname.match(/^\/archive\/([^/]+)\/([^/]+)$/);
    if (aRec || aMeta || aList || (aDel && request.method === 'DELETE')) {
      if (!env.ARCHIVE) return json({ error: 'R2 не подключён. Создай бакет и добавь binding ARCHIVE.' }, 501);
      try { return await handleArchive(request, env, { aRec, aMeta, aList, aDel }); }
      catch (e) { return json({ error: String(e && e.message || e) }, 500); }
    }

    const m = url.pathname.match(/^\/room\/([A-Za-z0-9_-]{1,64})$/);
    if (m) {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }
      const roomId = m[1].toLowerCase();
      const id = env.MEET_ROOM.idFromName(roomId);
      const stub = env.MEET_ROOM.get(id);
      return stub.fetch(request);
    }

    return new Response('Pllato Meet signaling', { status: 200, headers: CORS });
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}

// Архив в R2: rec/<owner>/<id>.webm  +  meta/<owner>/<id>.json
async function handleArchive(request, env, { aRec, aMeta, aList, aDel }) {
  if (aList && request.method === 'GET') {
    const owner = aList[1]; if (!SAFE.test(owner)) return json({ error: 'bad owner' }, 400);
    const listed = await env.ARCHIVE.list({ prefix: `meta/${owner}/`, limit: 1000 });
    const items = [];
    for (const o of listed.objects) {
      const obj = await env.ARCHIVE.get(o.key);
      if (obj) { try { items.push(JSON.parse(await obj.text())); } catch {} }
    }
    return json(items);
  }
  if (aRec) {
    const [, owner, id] = aRec; if (!SAFE.test(owner) || !SAFE.test(id)) return json({ error: 'bad key' }, 400);
    const key = `rec/${owner}/${id}.webm`;
    if (request.method === 'PUT') {
      await env.ARCHIVE.put(key, request.body, { httpMetadata: { contentType: request.headers.get('Content-Type') || 'video/webm' } });
      return json({ ok: true });
    }
    if (request.method === 'GET') {
      const obj = await env.ARCHIVE.get(key);
      if (!obj) return json({ error: 'not found' }, 404);
      return new Response(obj.body, { headers: { 'Content-Type': 'video/webm', 'Access-Control-Allow-Origin': '*' } });
    }
  }
  if (aMeta && request.method === 'PUT') {
    const [, owner, id] = aMeta; if (!SAFE.test(owner) || !SAFE.test(id)) return json({ error: 'bad key' }, 400);
    await env.ARCHIVE.put(`meta/${owner}/${id}.json`, request.body, { httpMetadata: { contentType: 'application/json' } });
    return json({ ok: true });
  }
  if (aDel && request.method === 'DELETE') {
    const [, owner, id] = aDel; if (!SAFE.test(owner) || !SAFE.test(id)) return json({ error: 'bad key' }, 400);
    await env.ARCHIVE.delete(`rec/${owner}/${id}.webm`);
    await env.ARCHIVE.delete(`meta/${owner}/${id}.json`);
    return json({ ok: true });
  }
  return json({ error: 'unsupported' }, 405);
}

export class MeetRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server); // hibernatable
    return new Response(null, { status: 101, webSocket: client });
  }

  /* ---- room-level persistent state (survives hibernation/eviction) ---- */
  async getRoom() {
    let r = await this.ctx.storage.get('room');
    if (!r) r = { status: 'waiting', locked: false, hostKey: null };
    return r;
  }
  async saveRoom(r) { await this.ctx.storage.put('room', r); }

  /* ---- helpers over live sockets ---- */
  attOf(ws) { try { return ws.deserializeAttachment() || null; } catch { return null; } }
  setAtt(ws, a) { ws.serializeAttachment(a); }
  sockets() { return this.ctx.getWebSockets(); }
  sockFor(peer) {
    for (const s of this.sockets()) { const a = this.attOf(s); if (a && a.peer === peer) return s; }
    return null;
  }
  peersList(excludePeer) {
    const out = [];
    for (const s of this.sockets()) {
      const a = this.attOf(s);
      if (a && a.peer && a.peer !== excludePeer) out.push({ peer: a.peer, info: a.info });
    }
    return out;
  }
  send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch {} }
  broadcast(obj, excludePeer) {
    const str = JSON.stringify(obj);
    for (const s of this.sockets()) {
      const a = this.attOf(s);
      if (a && a.peer && a.peer !== excludePeer) { try { s.send(str); } catch {} }
    }
  }

  async webSocketMessage(ws, raw) {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    const self = this.attOf(ws);

    switch (m.t) {
      case 'join': return this.onJoin(ws, m);
      case 'signal': {
        if (!self) return;
        const target = this.sockFor(m.to);
        if (target) this.send(target, { t: 'signal', from: self.peer, data: m.data });
        return;
      }
      case 'presence': {
        if (!self) return;
        self.info = { ...self.info, ...(m.patch || {}) };
        this.setAtt(ws, self);
        this.broadcast({ t: 'peer-update', peer: self.peer, info: self.info }, self.peer);
        return;
      }
      case 'chat': {
        if (!self || !self.info.admitted) return;
        this.broadcast({ t: 'chat', from: self.peer, name: self.info.name, text: String(m.text || '').slice(0, 1000), ts: Date.now() }, null);
        return;
      }
      case 'transcript': {
        if (!self || !self.info.admitted) return;
        this.broadcast({ t: 'transcript', from: self.peer, name: self.info.name, text: String(m.text || '').slice(0, 2000), ts: Date.now() }, null);
        return;
      }
      case 'admit': {
        if (!self || self.info.role !== 'host') return;
        return this.admit(m.target);
      }
      case 'open': {
        if (!self || self.info.role !== 'host') return;
        return this.openAll();
      }
      case 'lock': {
        if (!self || self.info.role !== 'host') return;
        const room = await this.getRoom();
        room.locked = !!m.val; await this.saveRoom(room);
        this.broadcast({ t: 'room-update', status: room.status, locked: room.locked }, null);
        return;
      }
      case 'bye': {
        try { ws.close(1000, 'bye'); } catch {}
        return;
      }
    }
  }

  async onJoin(ws, m) {
    const room = await this.getRoom();
    const peer = String(m.peer || '').slice(0, 40);
    if (!peer) { this.send(ws, { t: 'error', msg: 'no peer id' }); return; }

    // host claim: first valid hostKey owns the room
    let isHost = false;
    if (m.hostKey) {
      if (!room.hostKey) room.hostKey = String(m.hostKey).slice(0, 80);
      isHost = room.hostKey === String(m.hostKey);
    }
    // organiser presence opens the room for everyone (unless manually locked)
    if (isHost && !room.locked) room.status = 'open';
    await this.saveRoom(room);

    const admitted = isHost || (room.status === 'open' && !room.locked);
    const info = {
      name: String(m.name || 'Гость').slice(0, 60),
      role: isHost ? 'host' : 'guest',
      admitted,
      micOn: m.micOn !== false,
      camOn: m.camOn !== false,
    };
    this.setAtt(ws, { peer, info });

    // welcome the newcomer with the current roster
    this.send(ws, {
      t: 'welcome',
      self: { peer, role: info.role, admitted, isHost },
      room: { status: room.status, locked: room.locked },
      peers: this.peersList(peer),
    });
    // tell everyone else
    this.broadcast({ t: 'peer-join', peer, info }, peer);

    // if a host just arrived and room is open → admit anyone waiting
    if (isHost && room.status === 'open' && !room.locked) this.openAll();
  }

  admit(target) {
    const s = this.sockFor(target);
    if (!s) return;
    const a = this.attOf(s);
    if (!a || a.info.admitted) return;
    a.info.admitted = true;
    this.setAtt(s, a);
    this.send(s, { t: 'you-admitted' });
    this.broadcast({ t: 'peer-update', peer: a.peer, info: a.info }, null);
  }

  async openAll() {
    const room = await this.getRoom();
    room.status = 'open'; await this.saveRoom(room);
    for (const s of this.sockets()) {
      const a = this.attOf(s);
      if (a && a.info && !a.info.admitted) {
        a.info.admitted = true;
        this.setAtt(s, a);
        this.send(s, { t: 'you-admitted' });
        this.broadcast({ t: 'peer-update', peer: a.peer, info: a.info }, null);
      }
    }
    this.broadcast({ t: 'room-update', status: room.status, locked: room.locked }, null);
  }

  async webSocketClose(ws) { this.onGone(ws); }
  async webSocketError(ws) { this.onGone(ws); }
  onGone(ws) {
    const a = this.attOf(ws);
    if (a && a.peer) this.broadcast({ t: 'peer-leave', peer: a.peer }, a.peer);
  }
}
