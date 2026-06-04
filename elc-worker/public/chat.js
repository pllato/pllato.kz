// ════════════════════════════════════════════════════════════════════════
// Team chat — frontend module (UX/UI rework)
// Связь: WORKER (pllato-elc-worker.uurraa.workers.dev) /api/chat/* + /api/ws/user
// Экспорт: window.TeamChat = { mount, suspend, resume, openDmWith }
//
// Зависимости от родителя:
//   - window.currentUser = {firebaseUid, canonicalUid, email, profile:{name,...}}
//   - window.WORKER_BASE_URL (для REST)
//   - window.usersState.users (uid → {name,lastName,email,photo}) — справочник
//   - window.fbAuth (модульный Firebase) для getIdToken() (Bearer + WS ?token=)
// ════════════════════════════════════════════════════════════════════════
(function () {
  if (window.TeamChat) return;  // не подключать дважды

  const WORKER = window.WORKER_BASE_URL || 'https://pllato-elc-worker.uurraa.workers.dev';
  const WS_URL = WORKER.replace(/^http/, 'ws') + '/api/ws/user';

  // ── State ──────────────────────────────────────────────────────────────
  const state = {
    me: null,                 // {uid, name, email}
    channels: [],             // [{id, type, name, unread_count, last_message_text, ...}]
    activeChannelId: null,
    messages: [],             // последние ~50 сообщений активного канала
    members: {},              // channelId → [{user_id, joined_at}]
    usersIndex: {},           // uid → {name, email}
    ws: null,
    wsReconnectAttempts: 0,
    pingTimer: null,
    mounted: false,
    suspended: false,
    rootEl: null,
    composerDraft: '',
    replyToMsg: null,
    editingMsg: null,
    channelFilter: 'all',     // 'all' | 'channel' | 'dm'
    channelSearch: '',
    loadingMsgs: false,
  };

  // ── Auth token ─────────────────────────────────────────────────────────
  async function getAuthToken() {
    const a = window.fbAuth
      || (window.firebase && window.firebase.auth && window.firebase.auth());
    if (!a || !a.currentUser) throw new Error('Firebase auth не готов');
    return a.currentUser.getIdToken();
  }

  // ── HTTP helpers ───────────────────────────────────────────────────────
  async function api(path, opts = {}) {
    const token = await getAuthToken();
    const r = await fetch(WORKER + path, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        'Authorization': 'Bearer ' + token,
        ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (!r.ok) {
      let msg = `HTTP ${r.status}`;
      try { const d = await r.json(); msg = d.error || msg; } catch {}
      throw new Error(msg);
    }
    return r.json();
  }

  // ── User resolvers (используют window.usersState из родителя) ───────────
  function parentUser(uid) {
    return window.usersState?.users?.[uid] || window.usersState?.byUid?.[uid] || null;
  }

  function userLabel(uid) {
    if (!uid) return '—';
    if (uid === state.me?.uid) return state.me?.name || 'Я';
    const u = parentUser(uid);
    if (u) {
      return [u.lastName, u.name].filter(Boolean).join(' ').trim() || u.name || u.email || uid.slice(0, 8);
    }
    return state.usersIndex[uid]?.name || uid.slice(0, 8);
  }

  function userPhoto(uid) {
    if (!uid) return '';
    const u = parentUser(uid);
    return (u && (u.photo || u.photoURL)) || '';
  }

  function userAvatar(uid) {
    return userLabel(uid).slice(0, 2).toUpperCase();
  }

  // <div class=cls> с фото (если есть) либо инициалы на цветном фоне.
  function avatarHtml(cls, uid, fallbackText, bg) {
    const photo = userPhoto(uid);
    if (photo) {
      return `<div class="${cls}" style="background:transparent;overflow:hidden"><img src="${escapeHtml(photo)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"></div>`;
    }
    return `<div class="${cls}" style="background:${bg}">${escapeHtml(fallbackText)}</div>`;
  }

  function userColor(uid) {
    let h = 0;
    for (let i = 0; i < (uid || '').length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
    const hues = [210, 250, 290, 330, 12, 30, 95, 150, 175];
    return `hsl(${hues[h % hues.length]}, 58%, 52%)`;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }

  function formatClock(ts) {
    return new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return formatClock(ts);
    const yest = new Date(today); yest.setDate(today.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return 'вчера';
    return d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
  }

  function dayLabel(ts) {
    const today = startOfDay(Date.now());
    const day = startOfDay(ts);
    const diff = Math.round((today - day) / 86400000);
    if (diff === 0) return 'Сегодня';
    if (diff === 1) return 'Вчера';
    const d = new Date(ts);
    const opts = { day: 'numeric', month: 'long' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('ru', opts);
  }

  function formatUnread(n) { return n > 99 ? '99+' : String(n); }

  // ── WebSocket ──────────────────────────────────────────────────────────
  async function connectWs() {
    try {
      const token = await getAuthToken();
      const ws = new WebSocket(WS_URL + '?token=' + encodeURIComponent(token));
      state.ws = ws;
      ws.onopen = () => {
        state.wsReconnectAttempts = 0;
        console.log('[TeamChat] WS connected');
        if (state.pingTimer) clearInterval(state.pingTimer);
        state.pingTimer = setInterval(() => {
          try { ws.send(JSON.stringify({ kind: 'ping', t: Date.now() })); } catch {}
        }, 30000);
      };
      ws.onmessage = (ev) => {
        try { handleWsMessage(JSON.parse(ev.data)); }
        catch (e) { console.warn('[TeamChat] WS parse:', e); }
      };
      ws.onclose = () => {
        if (state.pingTimer) { clearInterval(state.pingTimer); state.pingTimer = null; }
        if (state.suspended || !state.mounted) return;
        const delay = Math.min(30000, 1000 * Math.pow(2, state.wsReconnectAttempts));
        state.wsReconnectAttempts++;
        console.log(`[TeamChat] WS reconnect in ${delay}ms`);
        setTimeout(() => { if (!state.suspended && state.mounted) connectWs(); }, delay);
      };
      ws.onerror = (e) => console.warn('[TeamChat] WS error', e);
    } catch (e) {
      console.error('[TeamChat] connectWs failed:', e);
    }
  }

  function disconnectWs() {
    if (state.pingTimer) { clearInterval(state.pingTimer); state.pingTimer = null; }
    if (state.ws) { try { state.ws.close(); } catch {} state.ws = null; }
  }

  function handleWsMessage(msg) {
    switch (msg.kind) {
      case 'connected': break;
      case 'pong': break;
      case 'message_new': onMessageNew(msg.message); break;
      case 'message_edited': onMessageEdited(msg); break;
      case 'message_deleted': onMessageDeleted(msg); break;
      case 'reaction_changed': onReactionChanged(msg); break;
      case 'channel_added': loadChannels(); break;
      case 'channel_removed': loadChannels(); break;
      case 'read': break;
      case 'notification':
        try { window.dispatchEvent(new CustomEvent('elc:notification', { detail: msg.notification || msg })); } catch (e) {}
        break;
    }
  }

  function onMessageNew(m) {
    const ch = state.channels.find(c => c.id === m.channel_id);
    if (ch) {
      ch.last_message_text = m.text || (m.type !== 'text' ? `[${m.type}]` : '');
      ch.last_message_at = m.created_at;
      if (m.channel_id !== state.activeChannelId && m.user_id !== state.me.uid) {
        ch.unread_count = (ch.unread_count || 0) + 1;
      }
    }
    if (m.channel_id === state.activeChannelId) {
      const msgsEl = state.rootEl?.querySelector('.tc-msgs');
      const atBottom = msgsEl ? isNearBottom(msgsEl, 120) : true;
      state.messages.push(m);
      renderMessages();
      if (atBottom || m.user_id === state.me.uid) markAsRead(m.id);
    }
    renderChannelList();
    updateNavBadge();
  }

  function onMessageEdited(msg) {
    const m = state.messages.find(x => x.id === msg.message_id);
    if (m) { m.text = msg.text; m.edited_at = msg.edited_at; renderMessages(); }
  }

  function onMessageDeleted(msg) {
    const m = state.messages.find(x => x.id === msg.message_id);
    if (m) { m.deleted_at = Date.now(); renderMessages(); }
  }

  function onReactionChanged(msg) {
    const m = state.messages.find(x => x.id === msg.message_id);
    if (m) { m.reactions = msg.reactions; renderMessages(); }
  }

  // ── Data ───────────────────────────────────────────────────────────────
  async function loadChannels() {
    try {
      const d = await api('/api/chat/channels');
      state.channels = d.items || [];
      renderChannelList();
      renderMainHead();
      updateNavBadge();
    } catch (e) { console.error('loadChannels:', e); }
  }

  async function loadMessages(channelId) {
    state.loadingMsgs = true;
    try {
      const d = await api(`/api/chat/channels/${channelId}/messages?limit=50`);
      if (channelId !== state.activeChannelId) return; // переключились пока грузили
      state.messages = d.items || [];
      state.loadingMsgs = false;
      renderMessages();
      scrollMsgsToBottom(false);
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg) markAsRead(lastMsg.id);
    } catch (e) {
      state.loadingMsgs = false;
      console.error('loadMessages:', e);
      renderMessages();
    }
  }

  async function markAsRead(lastMessageId) {
    if (!state.activeChannelId || !lastMessageId) return;
    try {
      await api(`/api/chat/channels/${state.activeChannelId}/read`, {
        method: 'POST',
        body: JSON.stringify({ last_read_message_id: lastMessageId }),
      });
      const ch = state.channels.find(c => c.id === state.activeChannelId);
      if (ch && ch.unread_count) { ch.unread_count = 0; renderChannelList(); updateNavBadge(); }
    } catch {}
  }

  function updateNavBadge() {
    const total = state.channels.reduce((s, c) => s + (c.unread_count || 0), 0);
    const b = document.getElementById('team-chat-nav-badge');
    if (b) {
      if (total > 0) { b.style.display = 'inline-flex'; b.textContent = total > 99 ? '99+' : total; }
      else b.style.display = 'none';
    }
  }

  // ── Scroll helpers ─────────────────────────────────────────────────────
  function isNearBottom(el, px = 80) {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= px;
  }
  function scrollMsgsToBottom(smooth) {
    const el = state.rootEl?.querySelector('.tc-msgs');
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    updateScrollBtn();
  }
  function updateScrollBtn() {
    const el = state.rootEl?.querySelector('.tc-msgs');
    const btn = state.rootEl?.querySelector('.tc-scroll-btn');
    if (!el || !btn) return;
    btn.classList.toggle('show', state.activeChannelId && !isNearBottom(el, 220));
  }

  // ── Styles ─────────────────────────────────────────────────────────────
  function ensureStyles() {
    if (document.getElementById('team-chat-styles')) return;
    const css = `
      .tc-root { --tc-ac: var(--ac, #2563eb); --tc-radius: 14px;
        flex:1; min-width:0; display:grid; grid-template-columns: 320px 1fr; height:100%;
        font-family:inherit; background:var(--bg2); color:var(--t1); position:relative; }

      /* ── Sidebar ── */
      .tc-sidebar { border-right:1px solid var(--b1); display:flex; flex-direction:column; min-height:0; background:var(--bg2); }
      .tc-sidebar-head { padding:14px 16px 10px; display:flex; gap:8px; align-items:center; }
      .tc-sidebar-head h3 { margin:0; font-size:17px; font-weight:700; flex:1; color:var(--t1); letter-spacing:-.2px; }
      .tc-hbtn { width:34px; height:34px; border:none; border-radius:9px; background:var(--bg3); color:var(--t2);
        cursor:pointer; font-size:17px; display:flex; align-items:center; justify-content:center; transition:.15s; line-height:1; }
      .tc-hbtn:hover { background:var(--tc-ac); color:#fff; }
      .tc-search { padding:0 14px 10px; position:relative; }
      .tc-search-ic { position:absolute; left:24px; top:50%; transform:translateY(-60%); font-size:13px; opacity:.5; pointer-events:none; }
      .tc-search input { width:100%; box-sizing:border-box; padding:9px 12px 9px 32px; border:1px solid transparent;
        border-radius:10px; background:var(--bg3); color:var(--t1); font-size:13.5px; outline:none; transition:.15s; }
      .tc-search input:focus { border-color:var(--tc-ac); background:var(--bg2); }
      .tc-tabs { display:flex; gap:6px; padding:0 14px 8px; }
      .tc-tab { flex:1; padding:6px 4px; border:none; border-radius:8px; background:transparent; color:var(--t3);
        cursor:pointer; font-size:12.5px; font-weight:600; transition:.15s; }
      .tc-tab:hover { background:var(--bg3); color:var(--t2); }
      .tc-tab.active { background:var(--tc-ac); color:#fff; }
      .tc-channels { flex:1; overflow-y:auto; padding:4px 8px 10px; min-height:0; }
      .tc-channel { padding:9px 10px; cursor:pointer; display:flex; gap:11px; align-items:center; border-radius:11px; transition:background .12s; }
      .tc-channel:hover { background:var(--bg3); }
      .tc-channel.active { background:color-mix(in srgb, var(--tc-ac) 14%, transparent); }
      .tc-ch-av { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        color:#fff; font-size:15px; font-weight:600; flex-shrink:0; }
      .tc-ch-body { flex:1; min-width:0; }
      .tc-ch-top { display:flex; align-items:baseline; gap:8px; }
      .tc-ch-name { font-size:14px; font-weight:600; color:var(--t1); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .tc-ch-ic { opacity:.45; font-weight:700; margin-right:3px; }
      .tc-ch-time { font-size:11px; color:var(--t3); flex-shrink:0; }
      .tc-ch-bottom { display:flex; align-items:center; gap:8px; margin-top:3px; }
      .tc-ch-last { flex:1; min-width:0; font-size:12.5px; color:var(--t3); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .tc-ch-muted { font-style:italic; opacity:.7; }
      .tc-ch-badge { flex-shrink:0; min-width:18px; height:18px; padding:0 5px; box-sizing:border-box; background:var(--tc-ac);
        color:#fff; font-size:11px; font-weight:700; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; }
      .tc-channel.active .tc-ch-badge { background:var(--tc-ac); }
      .tc-list-empty { padding:40px 20px; text-align:center; color:var(--t3); font-size:13px; line-height:1.6; }

      /* ── Main ── */
      .tc-main { display:flex; flex-direction:column; min-width:0; min-height:0; background:var(--bg); }
      .tc-main-head { min-height:62px; padding:10px 18px; border-bottom:1px solid var(--b1); display:flex;
        align-items:center; gap:12px; background:var(--bg2); }
      .tc-main-head:empty { min-height:0; padding:0; border-bottom:none; }
      .tc-back { display:none; width:32px; height:32px; border:none; background:transparent; color:var(--t2);
        font-size:24px; cursor:pointer; align-items:center; justify-content:center; border-radius:8px; flex-shrink:0; }
      .tc-back:hover { background:var(--bg3); }
      .tc-head-av { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        color:#fff; font-size:14px; font-weight:600; flex-shrink:0; }
      .tc-head-meta { min-width:0; flex:1; }
      .tc-head-name { font-size:15px; font-weight:700; color:var(--t1); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .tc-head-sub { font-size:12px; color:var(--t3); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:1px; }

      .tc-msgs-wrap { flex:1; position:relative; min-height:0; display:flex; }
      .tc-msgs { flex:1; overflow-y:auto; padding:16px 18px 10px; display:flex; flex-direction:column; gap:2px; min-height:0; }
      .tc-day { align-self:center; margin:14px 0 10px; }
      .tc-day span { background:var(--bg3); color:var(--t3); font-size:11.5px; font-weight:600; padding:3px 12px; border-radius:12px; }

      .tc-msg { position:relative; display:flex; gap:9px; align-items:flex-end; max-width:74%; margin-top:8px; }
      .tc-msg.grouped { margin-top:2px; }
      .tc-msg.own { align-self:flex-end; flex-direction:row-reverse; }
      .tc-msg-av { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        color:#fff; font-size:11px; font-weight:600; flex-shrink:0; }
      .tc-msg-av-sp { width:30px; flex-shrink:0; }
      .tc-msg-bubble { background:var(--bg2); padding:7px 11px 6px; border-radius:var(--tc-radius); border-top-left-radius:5px;
        min-width:0; box-shadow:0 1px 1.5px rgba(0,0,0,.06); }
      .tc-msg.grouped .tc-msg-bubble { border-top-left-radius:var(--tc-radius); }
      .tc-msg.own .tc-msg-bubble { background:var(--tc-ac); color:#fff; border-radius:var(--tc-radius); border-top-right-radius:5px; }
      .tc-msg.own.grouped .tc-msg-bubble { border-top-right-radius:var(--tc-radius); }
      .tc-msg-author { font-size:12px; font-weight:700; margin-bottom:2px; }
      .tc-msg-text { font-size:13.5px; line-height:1.45; word-break:break-word; white-space:pre-wrap; }
      .tc-msg-text a { color:inherit; text-decoration:underline; }
      .tc-msg-meta { font-size:10.5px; opacity:.55; margin-top:3px; text-align:right; white-space:nowrap; }
      .tc-msg.own .tc-msg-meta { opacity:.8; }
      .tc-msg-deleted { font-style:italic; opacity:.6; }
      .tc-msg-edited { margin-left:5px; opacity:.8; }
      .tc-msg-reply { border-left:3px solid currentColor; padding:3px 8px; border-radius:4px; font-size:12px;
        margin-bottom:5px; opacity:.85; background:rgba(0,0,0,.05); }
      .tc-msg.own .tc-msg-reply { background:rgba(255,255,255,.16); }
      .tc-reactions { display:flex; gap:4px; flex-wrap:wrap; margin-top:5px; }
      .tc-react { background:var(--bg3); border:1px solid var(--b1); padding:1px 7px; border-radius:11px; font-size:12px;
        cursor:pointer; display:inline-flex; gap:3px; align-items:center; line-height:1.6; }
      .tc-msg.own .tc-react { background:rgba(255,255,255,.2); border-color:transparent; color:#fff; }
      .tc-react.own { background:color-mix(in srgb, var(--tc-ac) 22%, transparent); border-color:var(--tc-ac); }
      .tc-react:hover { filter:brightness(.97); }
      .tc-msg-actions { position:absolute; top:-13px; right:6px; display:none; gap:1px; background:var(--bg2);
        border:1px solid var(--b1); border-radius:9px; padding:2px; box-shadow:0 3px 10px rgba(0,0,0,.14); z-index:2; }
      .tc-msg.own .tc-msg-actions { right:auto; left:6px; }
      .tc-msg:hover .tc-msg-actions { display:flex; }
      .tc-msg-btn { background:transparent; border:none; width:26px; height:26px; border-radius:6px; font-size:13px;
        cursor:pointer; color:var(--t2); display:flex; align-items:center; justify-content:center; }
      .tc-msg-btn:hover { background:var(--bg3); }
      .tc-file-att { display:inline-flex; align-items:center; gap:6px; padding:7px 11px; background:rgba(0,0,0,.06);
        border-radius:9px; margin-top:4px; font-size:12.5px; text-decoration:none; color:inherit; }
      .tc-msg.own .tc-file-att { background:rgba(255,255,255,.18); }
      .tc-file-att:hover { filter:brightness(.97); }
      .tc-img-att { max-width:280px; max-height:300px; border-radius:10px; margin-top:4px; cursor:pointer; display:block; }

      .tc-scroll-btn { position:absolute; right:18px; bottom:14px; width:40px; height:40px; border-radius:50%;
        border:1px solid var(--b1); background:var(--bg2); color:var(--t2); font-size:20px; cursor:pointer;
        display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,.18);
        opacity:0; transform:translateY(8px) scale(.9); pointer-events:none; transition:.18s; z-index:3; }
      .tc-scroll-btn.show { opacity:1; transform:none; pointer-events:auto; }
      .tc-scroll-btn:hover { background:var(--tc-ac); color:#fff; border-color:var(--tc-ac); }

      /* ── Empty / loading ── */
      .tc-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
        color:var(--t3); font-size:13.5px; text-align:center; padding:30px; }
      .tc-empty-ic { font-size:46px; opacity:.5; }
      .tc-empty-t { font-size:16px; font-weight:700; color:var(--t2); }
      .tc-loading { flex:1; display:flex; align-items:center; justify-content:center; }
      .tc-spinner { width:30px; height:30px; border:3px solid var(--b1); border-top-color:var(--tc-ac);
        border-radius:50%; animation:tc-spin .8s linear infinite; }
      @keyframes tc-spin { to { transform:rotate(360deg); } }

      /* ── Composer ── */
      .tc-composer { padding:12px 16px 14px; border-top:1px solid var(--b1); background:var(--bg2); }
      .tc-composer-banner { background:color-mix(in srgb, var(--tc-ac) 10%, transparent); border-left:3px solid var(--tc-ac);
        padding:7px 10px; border-radius:7px; margin-bottom:9px; font-size:12.5px; display:flex; align-items:center; gap:8px; }
      .tc-composer-banner > span { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .tc-composer-banner button { background:none; border:none; cursor:pointer; font-size:17px; color:var(--t3); padding:0 4px; line-height:1; }
      .tc-composer-row { display:flex; gap:9px; align-items:flex-end; }
      .tc-composer textarea { flex:1; min-height:42px; max-height:140px; padding:11px 14px; border:1px solid var(--b1);
        border-radius:14px; background:var(--bg3); color:var(--t1); font-size:13.5px; font-family:inherit; resize:none;
        outline:none; line-height:1.4; transition:.15s; }
      .tc-composer textarea:focus { border-color:var(--tc-ac); }
      .tc-btn-icon { width:42px; height:42px; border:none; background:var(--bg3); border-radius:50%; cursor:pointer;
        font-size:18px; color:var(--t2); display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:.15s; }
      .tc-btn-icon:hover { background:var(--b1); }
      .tc-btn-send { background:var(--tc-ac); color:#fff; }
      .tc-btn-send:hover { background:var(--tc-ac); filter:brightness(.92); }

      /* ── Modals & pickers ── */
      .tc-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:100000; display:flex;
        align-items:center; justify-content:center; padding:16px;
        --tc-ac: var(--ac, #2563eb); }
      .tc-modal { background:var(--bg2); border-radius:14px; padding:22px 24px; width:100%; max-width:440px;
        max-height:84vh; overflow:auto; box-shadow:0 18px 50px rgba(0,0,0,.35); }
      .tc-modal h3 { margin:0 0 16px; font-size:18px; }
      .tc-modal label { display:block; margin-bottom:12px; font-size:12.5px; color:var(--t2); font-weight:600; }
      .tc-modal input, .tc-modal textarea, .tc-modal select { width:100%; box-sizing:border-box; padding:9px 11px;
        border:1px solid var(--b1); border-radius:9px; background:var(--bg3); color:var(--t1); font-size:13.5px;
        font-family:inherit; margin-top:5px; outline:none; }
      .tc-modal input:focus, .tc-modal textarea:focus, .tc-modal select:focus { border-color:var(--tc-ac); }
      .tc-modal-foot { display:flex; gap:9px; justify-content:flex-end; margin-top:18px; }
      .tc-modal-foot button { padding:9px 18px; border-radius:9px; border:1px solid var(--b1); background:var(--bg3);
        cursor:pointer; font-size:13.5px; font-weight:600; color:var(--t1); }
      .tc-modal-foot button.primary { background:var(--tc-ac); color:#fff; border-color:var(--tc-ac); }
      .tc-picker-search { width:100%; box-sizing:border-box; }
      .tc-picker-list { margin-top:8px; max-height:300px; overflow-y:auto; border:1px solid var(--b1); border-radius:10px; }
      .tc-picker-row { display:flex; gap:11px; align-items:center; padding:9px 11px; cursor:pointer; border-bottom:1px solid var(--b1); }
      .tc-picker-row:last-child { border-bottom:none; }
      .tc-picker-row:hover { background:var(--bg3); }
      .tc-picker-row.selected { background:color-mix(in srgb, var(--tc-ac) 13%, transparent); }
      .tc-picker-ava { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        color:#fff; font-size:12px; font-weight:600; flex-shrink:0; }
      .tc-picker-meta { flex:1; min-width:0; }
      .tc-picker-name { font-size:13.5px; color:var(--t1); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .tc-picker-sub { font-size:11.5px; color:var(--t3); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .tc-picker-check { width:19px; height:19px; flex-shrink:0; accent-color:var(--tc-ac); cursor:pointer; }
      .tc-picker-empty { padding:22px; text-align:center; color:var(--t3); font-size:12.5px; }
      .tc-picker-count { font-size:12px; color:var(--t2); margin-top:8px; font-weight:600; }

      /* ── Responsive (tablet / narrow) ── */
      .tc-root.tc-narrow { grid-template-columns: 1fr; }
      .tc-root.tc-narrow .tc-main { display:none; }
      .tc-root.tc-narrow.tc-show-main .tc-sidebar { display:none; }
      .tc-root.tc-narrow.tc-show-main .tc-main { display:flex; }
      .tc-root.tc-narrow .tc-back { display:flex; }
      .tc-root.tc-narrow .tc-msg { max-width:86%; }

      /* ── Mobile (phone): full-screen conversation that survives the on-screen keyboard ──
         The open conversation is lifted into a position:fixed overlay whose height is driven
         in JS by window.visualViewport, so the composer is always pinned just above the
         keyboard and the message list stays scrollable/visible. */
      @media (max-width: 860px) {
        .tc-root.tc-narrow.tc-show-main .tc-main {
          position: fixed; top: 0; left: 0; right: 0; bottom: auto;
          height: 100vh; height: 100dvh; z-index: 1300;
          background: var(--bg); will-change: height;
        }
        .tc-root.tc-narrow.tc-show-main .tc-main-head {
          padding-top: calc(10px + env(safe-area-inset-top));
        }
        .tc-root.tc-narrow.tc-show-main .tc-composer {
          padding-bottom: calc(12px + env(safe-area-inset-bottom));
        }
        .tc-back { width:40px; height:40px; font-size:28px; }
        .tc-msg { max-width:90%; }
        .tc-msg-text { font-size:15px; line-height:1.5; }
        .tc-msg-bubble { padding:8px 12px 7px; }
        .tc-ch-av { width:48px; height:48px; }
        .tc-ch-name { font-size:15px; }
        .tc-ch-last { font-size:13px; }
        .tc-channel { padding:11px 10px; }
        .tc-btn-icon { width:44px; height:44px; font-size:19px; }
        .tc-composer textarea { min-height:44px; }
        /* 16px inputs prevent iOS Safari from auto-zooming the page on focus */
        .tc-composer textarea, .tc-search input { font-size:16px; }
        /* touch: reveal per-message actions on tap (no real :hover on touch) */
        .tc-msg.tc-show-actions .tc-msg-actions { display:flex; }
      }
      /* On pure-touch devices :hover sticks; rely on an explicit tap toggle instead. */
      @media (hover: none) {
        .tc-msg:hover .tc-msg-actions { display:none; }
        .tc-msg.tc-show-actions .tc-msg-actions { display:flex; }
        .tc-msg-actions { top:-15px; }
        .tc-msg-btn { width:32px; height:32px; font-size:15px; }
      }
    `;
    const st = document.createElement('style');
    st.id = 'team-chat-styles';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ── Channel helpers ────────────────────────────────────────────────────
  function channelDisplayName(ch) {
    if (ch.type === 'dm') return userLabel(ch.other_user_id);
    return ch.name || '(без имени)';
  }
  function channelAvatarBg(ch) {
    if (ch.type === 'dm') return userColor(ch.other_user_id || '');
    return ch.type === 'group' ? '#8b5cf6' : 'var(--tc-ac, #2563eb)';
  }
  function channelAvatarText(ch) {
    if (ch.type === 'dm') return userAvatar(ch.other_user_id || '');
    return '#';
  }

  function sortedChannels() {
    return state.channels.slice().sort((a, b) => {
      const ta = a.last_message_at || 0, tb = b.last_message_at || 0;
      if (tb !== ta) return tb - ta;
      return channelDisplayName(a).localeCompare(channelDisplayName(b), 'ru');
    });
  }

  // ── Render: channel list ───────────────────────────────────────────────
  function renderChannelList() {
    const root = state.rootEl;
    if (!root) return;
    const listEl = root.querySelector('.tc-channels');
    if (!listEl) return;

    let chs = sortedChannels();
    if (state.channelFilter === 'channel') chs = chs.filter(c => c.type === 'channel' || c.type === 'group');
    else if (state.channelFilter === 'dm') chs = chs.filter(c => c.type === 'dm');
    const q = state.channelSearch.trim().toLowerCase();
    if (q) chs = chs.filter(c => channelDisplayName(c).toLowerCase().includes(q));

    if (chs.length === 0) {
      let msg;
      if (q) msg = 'Ничего не найдено';
      else if (state.channels.length === 0) msg = 'Пока нет чатов.<br>Создай канал <b>＋</b> или напиши коллеге <b>✉</b>';
      else msg = 'Нет чатов в этой вкладке';
      listEl.innerHTML = `<div class="tc-list-empty">${msg}</div>`;
      return;
    }

    listEl.innerHTML = chs.map(ch => {
      const active = ch.id === state.activeChannelId ? ' active' : '';
      const unread = ch.unread_count > 0 ? `<span class="tc-ch-badge">${formatUnread(ch.unread_count)}</span>` : '';
      const time = ch.last_message_at ? formatTime(ch.last_message_at) : '';
      const last = ch.last_message_text
        ? escapeHtml(ch.last_message_text)
        : '<span class="tc-ch-muted">нет сообщений</span>';
      const prefix = ch.type === 'dm' ? ''
        : (ch.type === 'group' ? '<span class="tc-ch-ic">🔒</span>' : '<span class="tc-ch-ic">#</span>');
      return `<div class="tc-channel${active}" data-ch-id="${escapeHtml(ch.id)}">
        ${avatarHtml('tc-ch-av', ch.type === 'dm' ? ch.other_user_id : null, channelAvatarText(ch), channelAvatarBg(ch))}
        <div class="tc-ch-body">
          <div class="tc-ch-top"><span class="tc-ch-name">${prefix}${escapeHtml(channelDisplayName(ch))}</span><span class="tc-ch-time">${time}</span></div>
          <div class="tc-ch-bottom"><span class="tc-ch-last">${last}</span>${unread}</div>
        </div>
      </div>`;
    }).join('');

    listEl.querySelectorAll('.tc-channel').forEach(el => {
      el.onclick = () => openChannel(el.dataset.chId);
    });
  }

  // ── Render: messages ───────────────────────────────────────────────────
  function renderMessages() {
    const root = state.rootEl;
    if (!root) return;
    const msgsEl = root.querySelector('.tc-msgs');
    if (!msgsEl) return;

    if (!state.activeChannelId) {
      msgsEl.innerHTML = `<div class="tc-empty">
        <div class="tc-empty-ic">💬</div>
        <div class="tc-empty-t">Командные чаты</div>
        <div>Выбери канал слева или начни личную переписку</div>
      </div>`;
      updateScrollBtn();
      return;
    }
    if (state.loadingMsgs) {
      msgsEl.innerHTML = `<div class="tc-loading"><div class="tc-spinner"></div></div>`;
      return;
    }
    if (state.messages.length === 0) {
      msgsEl.innerHTML = `<div class="tc-empty">
        <div class="tc-empty-ic">✍️</div>
        <div class="tc-empty-t">Сообщений пока нет</div>
        <div>Напиши первое сообщение ниже</div>
      </div>`;
      updateScrollBtn();
      return;
    }

    const ch = state.channels.find(c => c.id === state.activeChannelId);
    const isDm = ch?.type === 'dm';
    const wasAtBottom = isNearBottom(msgsEl, 120);

    let html = '';
    let prev = null;
    for (const m of state.messages) {
      const newDay = !prev || startOfDay(prev.created_at) !== startOfDay(m.created_at);
      if (newDay) html += `<div class="tc-day"><span>${escapeHtml(dayLabel(m.created_at))}</span></div>`;
      const grouped = !newDay && prev && prev.user_id === m.user_id
        && (m.created_at - prev.created_at < 5 * 60000)
        && !prev.deleted_at && !m.deleted_at;
      html += renderMessage(m, { grouped, isDm });
      prev = m;
    }
    msgsEl.innerHTML = html;
    if (wasAtBottom) msgsEl.scrollTop = msgsEl.scrollHeight;
    updateScrollBtn();

    msgsEl.querySelectorAll('[data-msg-act]').forEach(b => {
      b.onclick = () => onMsgAction(b.dataset.msgAct, b.dataset.msgId);
    });
    msgsEl.querySelectorAll('[data-react-toggle]').forEach(b => {
      b.onclick = () => toggleReaction(b.dataset.reactToggle, b.dataset.emoji, b.dataset.own === '1');
    });

    // Touch devices have no real hover, so the reply/edit/react toolbar must be
    // summoned with a tap on the bubble (ignoring taps on links/images/reactions).
    if (window.matchMedia('(hover: none)').matches) {
      msgsEl.querySelectorAll('.tc-msg').forEach(msgEl => {
        const bubble = msgEl.querySelector('.tc-msg-bubble');
        if (!bubble) return;
        bubble.addEventListener('click', (e) => {
          if (e.target.closest('a, img, .tc-react, .tc-msg-btn')) return;
          const wasOpen = msgEl.classList.contains('tc-show-actions');
          msgsEl.querySelectorAll('.tc-msg.tc-show-actions').forEach(x => x.classList.remove('tc-show-actions'));
          if (!wasOpen) msgEl.classList.add('tc-show-actions');
        });
      });
    }
  }

  function renderMessage(m, opts) {
    const own = m.user_id === state.me.uid;
    const grouped = opts && opts.grouped;
    const isDm = opts && opts.isDm;
    const cls = `tc-msg${own ? ' own' : ''}${grouped ? ' grouped' : ''}`;

    // Avatar column (только для чужих сообщений)
    let avatarCol = '';
    if (!own) {
      avatarCol = grouped
        ? '<div class="tc-msg-av-sp"></div>'
        : avatarHtml('tc-msg-av', m.user_id, userAvatar(m.user_id), userColor(m.user_id));
    }

    if (m.deleted_at) {
      return `<div class="${cls}">${avatarCol}
        <div class="tc-msg-bubble"><div class="tc-msg-text tc-msg-deleted">Сообщение удалено</div></div>
      </div>`;
    }

    let body = '';
    if (m.reply_to) {
      const replyTo = state.messages.find(x => x.id === m.reply_to);
      if (replyTo) {
        body += `<div class="tc-msg-reply"><b>${escapeHtml(userLabel(replyTo.user_id))}</b><br>${escapeHtml((replyTo.text || '[медиа]').slice(0, 90))}</div>`;
      }
    }
    if (m.text) {
      const linkified = escapeHtml(m.text).replace(/(https?:\/\/[^\s<>"]+)/g,
        '<a href="$1" target="_blank" rel="noopener">$1</a>');
      body += `<div class="tc-msg-text">${linkified}</div>`;
    }
    if (m.file_key) {
      const meta = m.file_meta ? (typeof m.file_meta === 'string' ? JSON.parse(m.file_meta) : m.file_meta) : {};
      const fileUrl = `${WORKER}/api/chat/files/${encodeURIComponent(m.file_key)}`;
      if (m.type === 'image' || (meta.mime && meta.mime.startsWith('image/'))) {
        body += `<img class="tc-img-att" src="${fileUrl}" alt="${escapeHtml(meta.name || '')}" onclick="window.open('${fileUrl}','_blank')">`;
      } else {
        body += `<a class="tc-file-att" href="${fileUrl}" download="${escapeHtml(meta.name || 'file')}" target="_blank">📎 ${escapeHtml(meta.name || 'файл')}${meta.size ? ` <span style="opacity:.6">(${Math.round(meta.size / 1024)} КБ)</span>` : ''}</a>`;
      }
    }

    let reactionsHtml = '';
    if (m.reactions && m.reactions.length) {
      reactionsHtml = '<div class="tc-reactions">' + m.reactions.map(r => {
        const isOwn = r.users.includes(state.me.uid);
        return `<button class="tc-react${isOwn ? ' own' : ''}" data-react-toggle="${m.id}" data-emoji="${escapeHtml(r.emoji)}" data-own="${isOwn ? '1' : '0'}">${escapeHtml(r.emoji)} ${r.users.length}</button>`;
      }).join('') + '</div>';
    }

    const author = (!own && !isDm && !grouped)
      ? `<div class="tc-msg-author" style="color:${userColor(m.user_id)}">${escapeHtml(userLabel(m.user_id))}</div>`
      : '';
    const editedTag = m.edited_at ? '<span class="tc-msg-edited">(изм.)</span>' : '';

    return `<div class="${cls}">
      ${avatarCol}
      <div class="tc-msg-bubble">
        ${author}${body}${reactionsHtml}
        <div class="tc-msg-meta">${formatClock(m.created_at)}${editedTag}</div>
      </div>
      <div class="tc-msg-actions">
        <button class="tc-msg-btn" data-msg-act="reply" data-msg-id="${m.id}" title="Ответить">↩</button>
        <button class="tc-msg-btn" data-msg-act="react" data-msg-id="${m.id}" title="Реакция">😊</button>
        ${own ? `<button class="tc-msg-btn" data-msg-act="edit" data-msg-id="${m.id}" title="Изменить">✏</button>` : ''}
        ${own ? `<button class="tc-msg-btn" data-msg-act="delete" data-msg-id="${m.id}" title="Удалить">🗑</button>` : ''}
      </div>
    </div>`;
  }

  // ── Render: header ─────────────────────────────────────────────────────
  function renderMainHead() {
    const root = state.rootEl;
    if (!root) return;
    const head = root.querySelector('.tc-main-head');
    if (!head) return;
    const ch = state.channels.find(c => c.id === state.activeChannelId);
    if (!ch) { head.innerHTML = ''; return; }

    let sub;
    if (ch.type === 'dm') sub = parentUser(ch.other_user_id)?.email || 'Личная переписка';
    else if (ch.type === 'group') sub = ch.member_count ? `Закрытая группа · ${ch.member_count} ${pluralMembers(ch.member_count)}` : 'Закрытая группа';
    else sub = ch.member_count ? `Канал · ${ch.member_count} ${pluralMembers(ch.member_count)}` : 'Открытый канал';

    head.innerHTML = `
      <button class="tc-back" title="Назад">‹</button>
      ${avatarHtml('tc-head-av', ch.type === 'dm' ? ch.other_user_id : null, channelAvatarText(ch), channelAvatarBg(ch))}
      <div class="tc-head-meta">
        <div class="tc-head-name">${escapeHtml(channelDisplayName(ch))}</div>
        <div class="tc-head-sub">${escapeHtml(sub)}</div>
      </div>`;
    const back = head.querySelector('.tc-back');
    if (back) back.onclick = () => {
      state.activeChannelId = null;
      const r = state.rootEl?.querySelector('.tc-root');
      if (r) r.classList.remove('tc-show-main');
      syncViewport();
      renderChannelList();
      renderMainHead();
      renderMessages();
      renderComposer();
    };
  }

  function pluralMembers(n) {
    const n1 = n % 10, n100 = n % 100;
    if (n100 >= 11 && n100 <= 14) return 'участников';
    if (n1 === 1) return 'участник';
    if (n1 >= 2 && n1 <= 4) return 'участника';
    return 'участников';
  }

  // ── Render: composer ───────────────────────────────────────────────────
  function renderComposer(opts) {
    const wantFocus = !!(opts && opts.focus);
    const root = state.rootEl;
    if (!root) return;
    const c = root.querySelector('.tc-composer');
    if (!c) return;

    if (!state.activeChannelId) { c.style.display = 'none'; return; }
    c.style.display = '';

    let banner = '';
    if (state.replyToMsg) {
      banner = `<div class="tc-composer-banner"><span>↩ Ответ <b>${escapeHtml(userLabel(state.replyToMsg.user_id))}</b>: ${escapeHtml((state.replyToMsg.text || '[медиа]').slice(0, 70))}</span><button data-banner-cancel="reply">×</button></div>`;
    } else if (state.editingMsg) {
      banner = `<div class="tc-composer-banner"><span>✏ Редактирование сообщения</span><button data-banner-cancel="edit">×</button></div>`;
    }
    c.innerHTML = `${banner}
      <div class="tc-composer-row">
        <button class="tc-btn-icon" title="Прикрепить файл" id="tc-attach-btn">📎</button>
        <textarea id="tc-composer-input" rows="1" placeholder="Написать сообщение…">${escapeHtml(state.composerDraft)}</textarea>
        <button class="tc-btn-icon tc-btn-send" title="Отправить (Enter)" id="tc-send-btn">➤</button>
      </div>
      <input type="file" id="tc-file-input" style="display:none">`;

    const ta = c.querySelector('#tc-composer-input');
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    ta.oninput = () => { state.composerDraft = ta.value; autoresizeTa(ta); };
    ta.onkeydown = (e) => {
      // On touch keyboards Enter inserts a newline (send via the button); on
      // desktop Enter sends, Shift+Enter is a newline — standard messenger UX.
      if (e.key === 'Enter' && !e.shiftKey && !isTouch) { e.preventDefault(); sendCurrent(); }
    };
    // When the field gains focus the keyboard slides up; keep the latest
    // messages in view above it once the viewport settles.
    ta.onfocus = () => { setTimeout(() => { syncViewport(); scrollMsgsToBottom(false); }, 300); };
    autoresizeTa(ta);
    // Auto-focusing on mobile would pop the keyboard the moment a chat opens
    // (and shove the list aside); only steal focus when explicitly requested
    // or on desktop where it's expected.
    if (wantFocus || !isTouch) ta.focus();
    c.querySelector('#tc-send-btn').onclick = sendCurrent;
    c.querySelector('#tc-attach-btn').onclick = () => c.querySelector('#tc-file-input').click();
    c.querySelector('#tc-file-input').onchange = onFileSelected;
    c.querySelectorAll('[data-banner-cancel]').forEach(b => {
      b.onclick = () => {
        if (b.dataset.bannerCancel === 'reply') state.replyToMsg = null;
        if (b.dataset.bannerCancel === 'edit') { state.editingMsg = null; state.composerDraft = ''; }
        renderComposer();
      };
    });
  }

  function autoresizeTa(ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.min(140, ta.scrollHeight) + 'px';
  }

  async function sendCurrent() {
    const text = state.composerDraft.trim();
    if (!text && !state.editingMsg) return;
    if (state.editingMsg) {
      try {
        await api(`/api/chat/messages/${state.editingMsg.id}/edit`, { method: 'POST', body: JSON.stringify({ text }) });
        state.editingMsg = null; state.composerDraft = ''; renderComposer({ focus: true });
      } catch (e) { alert('Ошибка: ' + e.message); }
      return;
    }
    if (!state.activeChannelId) return;
    const body = { text };
    if (state.replyToMsg) body.reply_to = state.replyToMsg.id;
    try {
      await api(`/api/chat/channels/${state.activeChannelId}/messages`, { method: 'POST', body: JSON.stringify(body) });
      state.composerDraft = ''; state.replyToMsg = null;
      renderComposer({ focus: true });
    } catch (e) { alert('Ошибка отправки: ' + e.message); }
  }

  async function onFileSelected(ev) {
    const file = ev.target.files[0];
    if (!file || !state.activeChannelId) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await api('/api/chat/files/upload', { method: 'POST', body: fd });
      await api(`/api/chat/channels/${state.activeChannelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ file_key: up.file_key, file_meta: up.file_meta }),
      });
      ev.target.value = '';
    } catch (e) { alert('Ошибка загрузки: ' + e.message); }
  }

  function onMsgAction(action, msgId) {
    const m = state.messages.find(x => x.id === msgId);
    if (!m) return;
    if (action === 'reply') { state.replyToMsg = m; state.editingMsg = null; renderComposer({ focus: true }); }
    if (action === 'edit') { state.editingMsg = m; state.replyToMsg = null; state.composerDraft = m.text || ''; renderComposer({ focus: true }); }
    if (action === 'delete') {
      if (!confirm('Удалить сообщение?')) return;
      api(`/api/chat/messages/${msgId}`, { method: 'DELETE' }).catch(e => alert(e.message));
    }
    if (action === 'react') addReactionPrompt(msgId);
  }

  function addReactionPrompt(msgId) {
    const emoji = prompt('Эмодзи:', '👍');
    if (!emoji) return;
    api(`/api/chat/messages/${msgId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }).catch(e => alert(e.message));
  }

  function toggleReaction(msgId, emoji, isOwn) {
    const method = isOwn ? 'DELETE' : 'POST';
    api(`/api/chat/messages/${msgId}/reactions`, { method, body: JSON.stringify({ emoji }) }).catch(e => alert(e.message));
  }

  async function openChannel(channelId) {
    state.activeChannelId = channelId;
    state.replyToMsg = null;
    state.editingMsg = null;
    state.composerDraft = '';
    state.loadingMsgs = true;
    if (state.rootEl) {
      const r = state.rootEl.querySelector('.tc-root');
      if (r) r.classList.add('tc-show-main');
    }
    renderChannelList();
    renderMainHead();
    renderComposer();
    renderMessages();
    syncViewport();
    await loadMessages(channelId);
  }

  // ── Roster (справочник сотрудников из родителя) ─────────────────────────
  function getRoster() {
    const map = window.usersState?.users || window.usersState?.byUid || {};
    const meUid = state.me?.uid;
    const arr = [];
    for (const [uid, u] of Object.entries(map)) {
      if (uid === meUid) continue;
      if (u && u.active === false) continue;
      const label = [u.lastName, u.name].filter(Boolean).join(' ').trim() || u.name || u.email || uid.slice(0, 8);
      arr.push({ uid, label, sub: u.email || u.position || '' });
    }
    arr.sort((a, b) => a.label.localeCompare(b.label, 'ru'));
    return arr;
  }

  function pickerRowHtml(p, opts) {
    const checkbox = opts && opts.multi
      ? `<input type="checkbox" class="tc-picker-check" data-uid="${escapeHtml(p.uid)}">`
      : '';
    const sub = p.sub ? `<div class="tc-picker-sub">${escapeHtml(p.sub)}</div>` : '';
    return `<div class="tc-picker-row" data-uid="${escapeHtml(p.uid)}">
      ${avatarHtml('tc-picker-ava', p.uid, p.label.slice(0, 2).toUpperCase(), userColor(p.uid))}
      <div class="tc-picker-meta">
        <div class="tc-picker-name">${escapeHtml(p.label)}</div>
        ${sub}
      </div>
      ${checkbox}
    </div>`;
  }

  // ── Modals ─────────────────────────────────────────────────────────────
  function openNewChannelModal() {
    const roster = getRoster();
    const selected = new Set();
    const ov = document.createElement('div');
    ov.className = 'tc-modal-overlay';
    ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
    ov.innerHTML = `<div class="tc-modal">
      <h3>➕ Новый канал</h3>
      <label>Тип
        <select id="tc-new-type"><option value="channel">Канал (публичный)</option><option value="group">Группа (закрытая)</option></select>
      </label>
      <label>Название
        <input id="tc-new-name" placeholder="например, Разработка" maxlength="60">
      </label>
      <label>Описание (опционально)
        <textarea id="tc-new-desc" rows="2"></textarea>
      </label>
      <label>Кого добавить
        <input class="tc-picker-search" id="tc-new-search" placeholder="🔍 поиск по имени…">
      </label>
      <div class="tc-picker-list" id="tc-new-members-list"></div>
      <div class="tc-picker-count" id="tc-new-members-count">Выбрано: 0</div>
      <div class="tc-modal-foot">
        <button data-tc-cancel>Отмена</button>
        <button class="primary" data-tc-create>Создать</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    ov.querySelector('.tc-modal').onclick = (e) => e.stopPropagation();

    const listEl = ov.querySelector('#tc-new-members-list');
    const countEl = ov.querySelector('#tc-new-members-count');
    const searchEl = ov.querySelector('#tc-new-search');

    function renderList() {
      const q = searchEl.value.trim().toLowerCase();
      const filtered = q ? roster.filter(p => p.label.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q)) : roster;
      if (filtered.length === 0) {
        listEl.innerHTML = `<div class="tc-picker-empty">${roster.length === 0 ? 'Справочник сотрудников пуст' : 'Никого не найдено'}</div>`;
        return;
      }
      listEl.innerHTML = filtered.map(p => pickerRowHtml(p, { multi: true })).join('');
      listEl.querySelectorAll('.tc-picker-row').forEach(row => {
        const uid = row.getAttribute('data-uid');
        const cb = row.querySelector('.tc-picker-check');
        cb.checked = selected.has(uid);
        if (selected.has(uid)) row.classList.add('selected');
        row.onclick = (e) => {
          if (e.target !== cb) cb.checked = !cb.checked;
          if (cb.checked) { selected.add(uid); row.classList.add('selected'); }
          else { selected.delete(uid); row.classList.remove('selected'); }
          countEl.textContent = 'Выбрано: ' + selected.size;
        };
      });
    }
    searchEl.oninput = renderList;
    renderList();

    ov.querySelector('[data-tc-cancel]').onclick = () => ov.remove();
    ov.querySelector('[data-tc-create]').onclick = async () => {
      const type = ov.querySelector('#tc-new-type').value;
      const name = ov.querySelector('#tc-new-name').value.trim();
      const description = ov.querySelector('#tc-new-desc').value.trim();
      const members = Array.from(selected);
      if (!name) { alert('Введи название'); return; }
      try {
        const d = await api('/api/chat/channels', { method: 'POST', body: JSON.stringify({ type, name, description, members }) });
        ov.remove();
        await loadChannels();
        openChannel(d.channel.id);
      } catch (e) { alert(e.message); }
    };
  }

  function openNewDmModal() {
    const roster = getRoster();
    const ov = document.createElement('div');
    ov.className = 'tc-modal-overlay';
    ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
    ov.innerHTML = `<div class="tc-modal">
      <h3>✉ Личная переписка</h3>
      <label>Выбери сотрудника
        <input class="tc-picker-search" id="tc-dm-search" placeholder="🔍 поиск по имени…">
      </label>
      <div class="tc-picker-list" id="tc-dm-list"></div>
      <div class="tc-modal-foot">
        <button data-tc-cancel>Отмена</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    ov.querySelector('.tc-modal').onclick = (e) => e.stopPropagation();

    const listEl = ov.querySelector('#tc-dm-list');
    const searchEl = ov.querySelector('#tc-dm-search');

    async function startDm(uid) {
      try {
        const d = await api('/api/chat/dm', { method: 'POST', body: JSON.stringify({ user_id: uid }) });
        ov.remove();
        await loadChannels();
        openChannel(d.channel_id);
      } catch (e) { alert(e.message); }
    }

    function renderList() {
      const q = searchEl.value.trim().toLowerCase();
      const filtered = q ? roster.filter(p => p.label.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q)) : roster;
      if (filtered.length === 0) {
        listEl.innerHTML = `<div class="tc-picker-empty">${roster.length === 0 ? 'Справочник сотрудников пуст' : 'Никого не найдено'}</div>`;
        return;
      }
      listEl.innerHTML = filtered.map(p => pickerRowHtml(p, { multi: false })).join('');
      listEl.querySelectorAll('.tc-picker-row').forEach(row => {
        row.onclick = () => startDm(row.getAttribute('data-uid'));
      });
    }
    searchEl.oninput = renderList;
    renderList();
    setTimeout(() => searchEl.focus(), 50);

    ov.querySelector('[data-tc-cancel]').onclick = () => ov.remove();
  }

  // ── Responsive observer ────────────────────────────────────────────────
  function applyResponsive() {
    const el = state.rootEl;
    if (!el) return;
    const root = el.querySelector('.tc-root');
    if (!root) return;
    root.classList.toggle('tc-narrow', el.clientWidth < 720);
    syncViewport();
  }

  // ── Mobile keyboard handling ───────────────────────────────────────────
  // On phones the open conversation (.tc-main) is a position:fixed overlay.
  // We size it to window.visualViewport so the composer is pinned right above
  // the keyboard and the message list stays visible — the core mobile UX ask.
  function isOverlayMode() {
    const root = state.rootEl?.querySelector('.tc-root');
    return !!(root
      && root.classList.contains('tc-narrow')
      && root.classList.contains('tc-show-main')
      && window.matchMedia('(max-width: 860px)').matches);
  }
  function syncViewport() {
    const main = state.rootEl?.querySelector('.tc-main');
    if (!main) return;
    const overlay = isOverlayMode();
    // Полноэкранный оверлей переписки на телефоне — прячем плавающие
    // элементы портала (зелёный WA-виджет, SIP-бар), чтобы они не
    // перекрывали композер и кнопку отправки снизу. CSS-правило в team.html.
    try { document.body.classList.toggle('tc-chat-overlay', overlay); } catch {}
    if (!overlay || !window.visualViewport) {
      main.style.height = '';
      main.style.transform = '';
      return;
    }
    const vv = window.visualViewport;
    const msgs = state.rootEl?.querySelector('.tc-msgs');
    const stick = msgs ? isNearBottom(msgs, 300) : true;
    main.style.height = Math.round(vv.height) + 'px';
    main.style.transform = `translateY(${Math.round(vv.offsetTop)}px)`;
    if (stick && msgs) msgs.scrollTop = msgs.scrollHeight;
  }
  function bindViewport() {
    if (state._vvBound || !window.visualViewport) return;
    state._vvBound = true;
    const h = () => syncViewport();
    window.visualViewport.addEventListener('resize', h);
    window.visualViewport.addEventListener('scroll', h);
    window.addEventListener('orientationchange', () => setTimeout(syncViewport, 350));
  }

  // ── Mount ──────────────────────────────────────────────────────────────
  function mount(selector) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    ensureStyles();
    state.rootEl = el;
    state.me = {
      uid: window.currentUser?.canonicalUid || window.currentUser?.firebaseUid,
      name: window.currentUser?.profile?.name || (window.currentUser?.email || '').split('@')[0] || 'Я',
      email: window.currentUser?.email,
    };
    el.innerHTML = `<div class="tc-root">
      <aside class="tc-sidebar">
        <div class="tc-sidebar-head">
          <h3>Чаты</h3>
          <button class="tc-hbtn" id="tc-new-dm-btn" title="Личная переписка">✉</button>
          <button class="tc-hbtn" id="tc-new-ch-btn" title="Новый канал">＋</button>
        </div>
        <div class="tc-search"><span class="tc-search-ic">🔍</span><input id="tc-ch-search" placeholder="Поиск чата" autocomplete="off"></div>
        <div class="tc-tabs">
          <button class="tc-tab active" data-tab="all">Все</button>
          <button class="tc-tab" data-tab="channel">Каналы</button>
          <button class="tc-tab" data-tab="dm">Личные</button>
        </div>
        <div class="tc-channels"></div>
      </aside>
      <section class="tc-main">
        <div class="tc-main-head"></div>
        <div class="tc-msgs-wrap">
          <div class="tc-msgs"></div>
          <button class="tc-scroll-btn" title="Вниз">⌄</button>
        </div>
        <div class="tc-composer"></div>
      </section>
    </div>`;

    el.querySelector('#tc-new-ch-btn').onclick = openNewChannelModal;
    el.querySelector('#tc-new-dm-btn').onclick = openNewDmModal;

    const search = el.querySelector('#tc-ch-search');
    search.oninput = () => { state.channelSearch = search.value; renderChannelList(); };

    el.querySelectorAll('.tc-tab').forEach(t => {
      t.onclick = () => {
        state.channelFilter = t.dataset.tab;
        el.querySelectorAll('.tc-tab').forEach(x => x.classList.toggle('active', x === t));
        renderChannelList();
      };
    });

    const msgsEl = el.querySelector('.tc-msgs');
    msgsEl.onscroll = updateScrollBtn;
    el.querySelector('.tc-scroll-btn').onclick = () => scrollMsgsToBottom(true);

    applyResponsive();
    bindViewport();
    if (window.ResizeObserver) {
      try {
        if (state._ro) state._ro.disconnect();
        state._ro = new ResizeObserver(applyResponsive);
        state._ro.observe(el);
      } catch {}
    }

    state.mounted = true;
    state.suspended = false;
    renderMainHead();
    renderMessages();
    renderComposer();
    loadChannels();
    if (!state.ws || state.ws.readyState >= 2) connectWs();
  }

  function suspend() {
    state.suspended = true;
    // Уходим с раздела чата — вернуть плавающие элементы портала.
    try { document.body.classList.remove('tc-chat-overlay'); } catch {}
    disconnectWs();
  }
  function resume() {
    state.suspended = false;
    if (!state.ws || state.ws.readyState >= 2) connectWs();
    loadChannels();
  }

  function openDmWith(uid) {
    api('/api/chat/dm', { method: 'POST', body: JSON.stringify({ user_id: uid }) })
      .then(d => { loadChannels().then(() => openChannel(d.channel_id)); })
      .catch(e => alert(e.message));
  }

  window.TeamChat = { mount, suspend, resume, openDmWith };
})();
