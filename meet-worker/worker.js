import {crmMeeting,authorizeCrmArchive,indexCrmArchive} from './crm-archive.js';
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
  'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
const SAFE = /^[A-Za-z0-9_.-]{1,80}$/;

// База auth-воркера (pllato-comm) — тот же аккаунт. Проверяем сессии через его GET /me.
const AUTH_BASE = 'https://pllato-comm.uurraa.workers.dev';

// slug личного видеокабинета менеджера из email — ДОЛЖЕН совпадать с клиентом (meet.html)
function meetSlug(email) {
  return 'u-' + String(email || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

// Проверка Gmail-сессии по JWT: дергаем /me auth-воркера (server-to-server, без CORS).
// Возвращает { email, name, isAdmin } или null.
async function verifyUser(token) {
  if (!token) return null;
  try {
    const r = await fetch(`${AUTH_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    const j = await r.json();
    const u = j && j.authPresent && j.user;
    if (!u || !u.email) return null;
    return { email: String(u.email), name: String(u.name || ''), isAdmin: !!(u.isAdmin || u.isSuperAdmin) };
  } catch { return null; }
}

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
    // потоковая запись (R2 multipart) — чтобы в браузере не копилась вся запись в памяти
    const aRecInit = url.pathname.match(/^\/archive\/rec-init\/([^/]+)\/([^/]+)$/);
    const aRecPart = url.pathname.match(/^\/archive\/rec-part\/([^/]+)\/([^/]+)\/([^/]+)\/(\d+)$/);
    const aRecDone = url.pathname.match(/^\/archive\/rec-complete\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (aRec || aMeta || aList || aRecInit || aRecPart || aRecDone || (aDel && request.method === 'DELETE')) {
      if (!env.ARCHIVE) return json({ error: 'R2 не подключён. Создай бакет и добавь binding ARCHIVE.' }, 501);
      try { return await handleArchive(request, env, { aRec, aMeta, aList, aDel, aRecInit, aRecPart, aRecDone }); }
      catch (e) { return json({ error: String(e && e.message || e) }, 500); }
    }

    // Командный архив: все встречи всех менеджеров (только для админа) — группировка на клиенте
    if (url.pathname === '/archive/all' && request.method === 'GET') {
      if (!env.ARCHIVE) return json({ error: 'R2 не подключён' }, 501);
      const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      const me = await verifyUser(token);
      if (!me) return json({ error: 'unauthorized' }, 401);
      if (!me.isAdmin) return json({ error: 'forbidden' }, 403);
      try {
        const listed = await env.ARCHIVE.list({ prefix: 'meta/', limit: 1000 });
        const items = [];
        for (const o of listed.objects) {
          const obj = await env.ARCHIVE.get(o.key);
          if (obj) { try { items.push(JSON.parse(await obj.text())); } catch {} }
        }
        return json(items);
      } catch (e) { return json({ error: String(e && e.message || e) }, 500); }
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
async function handleArchive(request, env, { aRec, aMeta, aList, aDel, aRecInit, aRecPart, aRecDone }) {
  const match=aRec||aMeta||aList||aDel||aRecInit||aRecPart||aRecDone;
  let linkedMeeting=null;
  if(match?.[1]==='crm'){
    // CRM media is private. Reads/deletes go through CRM deal access checks.
    if(aList || request.method==='GET' || request.method==='DELETE') return json({error:'Use CRM archive'},403);
    linkedMeeting=await authorizeCrmArchive(request,env,match[2]);
    if(!linkedMeeting || !env.CRM_FILES) return json({error:'forbidden'},403);
    env={...env,ARCHIVE:env.CRM_FILES};
  }

  // ---- потоковая запись через R2 multipart ----
  if (aRecInit && request.method === 'POST') {
    const [, owner, id] = aRecInit; if (!SAFE.test(owner) || !SAFE.test(id)) return json({ error: 'bad key' }, 400);
    const up = await env.ARCHIVE.createMultipartUpload(`rec/${owner}/${id}.webm`, { httpMetadata: { contentType: request.headers.get('Content-Type') || 'video/webm' } });
    return json({ uploadId: up.uploadId });
  }
  if (aRecPart && request.method === 'PUT') {
    const [, owner, id, uploadId, pn] = aRecPart; if (!SAFE.test(owner) || !SAFE.test(id)) return json({ error: 'bad key' }, 400);
    const up = env.ARCHIVE.resumeMultipartUpload(`rec/${owner}/${id}.webm`, uploadId);
    const body = await request.arrayBuffer(); // одна часть ~5 МБ — держим в памяти воркера кратко
    const part = await up.uploadPart(Number(pn), body);
    return json({ partNumber: part.partNumber, etag: part.etag });
  }
  if (aRecDone && request.method === 'POST') {
    const [, owner, id, uploadId] = aRecDone; if (!SAFE.test(owner) || !SAFE.test(id)) return json({ error: 'bad key' }, 400);
    const parts = await request.json(); // [{partNumber, etag}]
    if (!Array.isArray(parts) || !parts.length) return json({ error: 'no parts' }, 400);
    // Повтор complete после потери ответа не должен ломать сохранённое видео.
    const key = `rec/${owner}/${id}.webm`;
    const existing = await env.ARCHIVE.head(key);
    if (existing) return json({ ok: true, size: existing.size });
    const up = env.ARCHIVE.resumeMultipartUpload(key, uploadId);
    const obj = await up.complete(parts);
    return json({ ok: true, size: obj.size });
  }
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
      return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType || 'video/webm', 'Access-Control-Allow-Origin': '*' } });
    }
  }
  if (aMeta && (request.method === 'PUT' || request.method === 'POST')) {
    // POST — чтобы navigator.sendBeacon (только POST) мог сохранить метаданные при закрытии вкладки
    const [, owner, id] = aMeta; if (!SAFE.test(owner) || !SAFE.test(id)) return json({ error: 'bad key' }, 400);
    const raw=await request.text();
    if(raw.length>2_000_000)return json({error:'metadata too large'},413);
    if(linkedMeeting) await indexCrmArchive(env,linkedMeeting,id,JSON.parse(raw));
    await env.ARCHIVE.put(`meta/${owner}/${id}.json`, raw, { httpMetadata: { contentType: 'application/json' } });
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
    // запоминаем roomId из URL (нужен для сверки личности хоста), переживает гибернацию
    const rid = new URL(request.url).pathname.match(/\/room\/([A-Za-z0-9_-]{1,64})/)?.[1]?.toLowerCase();
    if (rid) { this._roomId = rid; try { await this.ctx.storage.put('roomId', rid); } catch {} }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server); // hibernatable
    return new Response(null, { status: 101, webSocket: client });
  }
  async roomId() { return this._roomId || (this._roomId = await this.ctx.storage.get('roomId')) || null; }

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
        if (!self?.info.admitted) return;
        const target = this.sockFor(m.to);
        if (target && this.attOf(target)?.info.admitted) this.send(target, { t: 'signal', from: self.peer, data: m.data });
        return;
      }
      case 'presence': {
        if (!self) return;
        const patch = m.patch || {};
        for (const key of ['micOn','camOn','sharing']) if (typeof patch[key] === 'boolean') self.info[key] = patch[key];
        for (const key of ['camStreamId','screenStreamId']) if (patch[key] === null || typeof patch[key] === 'string') self.info[key] = patch[key];
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
        if((await this.getRoom()).endAt)return;
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
      case 'end-meeting': {
        if(self?.info.role==='host')await this.scheduleEnd(true);
        return;
      }
      case 'bye': {
        try { ws.close(1000, 'bye'); } catch {}
        return;
      }
    }
  }

  async onJoin(ws, m) {
    const me = m.token ? await verifyUser(m.token) : null;
    let room = await this.getRoom();
    if(room.endAt && room.endAt<=Date.now()){await this.alarm();room=await this.getRoom();}
    const crmRoom=(await this.roomId())?.startsWith('crm-');
    if(crmRoom){
      const linked=await crmMeeting(this.env,await this.roomId());
      if(!linked){this.send(ws,{t:'error',msg:'Встреча отменена или не найдена'});ws.close(1008,'Meeting unavailable');return;}
      room.hostKey=linked.host_key;
    }
    const peer = String(m.peer || '').slice(0, 40);
    if (!peer) { this.send(ws, { t: 'error', msg: 'no peer id' }); return; }

    // 1) СТРОГО: хост по личности — Gmail-владелец персональной комнаты (u-<slug email>)
    let isHost = false;
    let verifiedName = '';
    if (me && !crmRoom) {
      const rid = await this.roomId();
      if (rid && (meetSlug(me.email) === rid || room.hostEmail === me.email.toLowerCase())) { isHost = true; verifiedName = me.name; }
    }
    // 2) fallback для ad-hoc комнат (Новая встреча): первый валидный hostKey владеет комнатой
    const rid = await this.roomId();
    if(crmRoom) isHost=!!m.hostKey && m.hostKey===room.hostKey;
    if (!crmRoom && !isHost && m.hostKey && !room.hostEmail && !rid?.startsWith('u-')) {
      if (!room.hostKey) room.hostKey = String(m.hostKey).slice(0, 80);
      isHost = room.hostKey === String(m.hostKey);
    }
    if(isHost && me) room.hostEmail=me.email.toLowerCase();
    const hostPresent=this.sockets().some(s=>this.attOf(s)?.info.role==='host' && s.readyState===1);
    if(isHost && room.endAt && !room.explicitEnd){
      room.endAt=null;await this.ctx.storage.deleteAlarm();
      this.broadcast({t:'meeting-resumed'},null);
    }
    if(!hostPresent && !isHost && !room.endAt)room.status='waiting';
    if(isHost && !room.explicitEnd){room.status='open';room.locked=false;}

    await this.saveRoom(room);

    const admitted = !room.explicitEnd && (isHost || (hostPresent && room.status === 'open' && !room.locked));
    const info = {
      name: String((isHost && verifiedName) || m.name || 'Гость').slice(0, 60),
      role: isHost ? 'host' : 'guest',
      admitted,
      mobileMedia: m.mobileMedia === true,
      micOn: m.micOn !== false,
      camOn: m.camOn !== false,
      camStreamId: typeof m.camStreamId === 'string' ? m.camStreamId : null,
      screenStreamId: typeof m.screenStreamId === 'string' ? m.screenStreamId : null,
      sharing: m.sharing === true,
    };
    this.setAtt(ws, { peer, info });

    // welcome the newcomer with the current roster
    this.send(ws, {
      t: 'welcome',
      self: { peer, role: info.role, admitted, isHost },
      room: { status: room.status, locked: room.locked },
      peers: this.peersList(peer),
    });
    if(room.endAt)this.send(ws,{t:'meeting-ending',endAt:room.endAt});
    // tell everyone else
    this.broadcast({ t: 'peer-join', peer, info }, peer);

    // if a host just arrived and room is open → admit anyone waiting
    if (isHost && room.status === 'open' && !room.locked) await this.openAll();
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
    if(room.endAt)return;
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

  async scheduleEnd(explicit){
    const room=await this.getRoom();
    room.status='waiting';
    room.endAt=room.endAt||Date.now()+30000;
    room.explicitEnd=room.explicitEnd||explicit;
    await this.saveRoom(room);
    await this.ctx.storage.setAlarm(room.endAt);
    this.broadcast({t:'meeting-ending',endAt:room.endAt},null);
  }
  async alarm(){
    const room=await this.getRoom();
    if(!room.endAt)return;
    if(room.endAt>Date.now()){await this.ctx.storage.setAlarm(room.endAt);return;}
    this.broadcast({t:'meeting-ended'},null);
    for(const socket of this.sockets()){
      if(!this.attOf(socket)?.peer)continue;
      this.setAtt(socket,null);
      try{socket.close(1000,'Meeting ended');}catch{}
    }
    room.status='waiting';room.locked=false;room.endAt=null;room.explicitEnd=false;
    await this.saveRoom(room);
  }

  async webSocketClose(ws) { await this.onGone(ws); }
  async webSocketError(ws) { await this.onGone(ws); }
  async onGone(ws) {
    const a = this.attOf(ws);
    if (!a?.peer) return;
    this.setAtt(ws, null);
    this.broadcast({ t: 'peer-leave', peer: a.peer }, a.peer);
    if (a.info.role==='host' && !this.sockets().some(s => this.attOf(s)?.info.role === 'host' && s.readyState===1)) await this.scheduleEnd(false);
  }
}
