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
    composerMentions: [],     // [{uid, label}] — выбранные через @ в текущем черновике
    replyToMsg: null,
    editingMsg: null,
    channelFilter: 'all',     // 'all' | 'channel' | 'dm'
    channelSearch: '',
    showArchived: false,      // показывать архивные чаты вместо активных
    loadingMsgs: false,
  };

  // ── Auth token ─────────────────────────────────────────────────────────
  // Кешируем последний токен, чтобы строить URL файлов синхронно при рендере
  // (<img src>/<a href> не умеют слать заголовок Authorization → токен в ?auth=).
  let _authToken = '';
  async function getAuthToken() {
    const a = window.fbAuth
      || (window.firebase && window.firebase.auth && window.firebase.auth());
    if (!a || !a.currentUser) throw new Error('Firebase auth не готов');
    const t = await a.currentUser.getIdToken();
    _authToken = t;
    return t;
  }
  function fileUrl(fileKey) {
    const tk = _authToken ? `?auth=${encodeURIComponent(_authToken)}` : '';
    return `${WORKER}/api/chat/files/${encodeURIComponent(fileKey)}${tk}`;
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
      return [u.lastName, u.name].filter(Boolean).join(' ').trim() || u.name || u.email || 'Сотрудник';
    }
    return state.usersIndex[uid]?.name || 'Сотрудник';
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

  // Реконнект WS при возврате на вкладку / в приложение. Мобильный Safari (iPhone)
  // убивает WebSocket при блокировке экрана или сворачивании, а таймер ws.onclose
  // заморожен — поэтому без этого новые сообщения не приходят, пока сотрудник сам
  // не перезагрузит страницу. По возвращении реконнектим и подтягиваем пропущенное.
  function ensureWsAlive() {
    if (!state.mounted || state.suspended) return;
    const rs = state.ws ? state.ws.readyState : 3;
    if (rs === 0 || rs === 1) return; // CONNECTING / OPEN — соединение живо
    state.wsReconnectAttempts = 0;
    connectWs();
    loadChannels(); // подтянуть сообщения, пришедшие пока WS был мёртв
  }

  function handleWsMessage(msg) {
    switch (msg.kind) {
      case 'connected': break;
      case 'pong': break;
      case 'message_new': onMessageNew(msg.message); break;
      case 'message_edited': onMessageEdited(msg); break;
      case 'message_deleted': onMessageDeleted(msg); break;
      case 'reaction_changed': onReactionChanged(msg); break;
      case 'channel_added':
        chatNotify('Вас добавили в чат', true);
        loadChannels();
        break;
      case 'channel_removed': loadChannels(); break;
      case 'channel_renamed': onChannelRenamed(msg); break;
      case 'channel_icon': { const c = state.channels.find(x => x.id === msg.channel_id); if (c) { c.icon = msg.icon; renderMainHead(); renderChannelList(); } break; }
      case 'channel_archived': case 'channel_unarchived': loadChannels(); break;
      case 'members_changed': state.members = {}; loadChannels(); break;
      case 'role_changed': loadChannels(); break;
      case 'user_joined': state.members = {}; loadChannels(); break;
      case 'user_left': state.members = {}; loadChannels(); break;
      case 'read': break;
      case 'notif_read':
        // Прочитали канал на другом устройстве/вкладке → реактивно обновить
        // колокольчик в team.html (без ожидания 25-сек поллинга).
        try { window.dispatchEvent(new CustomEvent('elc:notif-read', { detail: { channel_id: msg.channel_id } })); } catch (e) {}
        break;
      case 'notification': {
        const n = msg.notification || msg;
        // Сообщение чата при открытом и видимом окне чата уже покрыто тостом +
        // бэйджем канала — не дублируем в колокольчик. Остальное (добавили в чат,
        // прочие типы) и случай фоновой вкладки — отдаём в центр уведомлений.
        if (n && n.type === 'chat_message' && state.mounted && document.visibilityState === 'visible') break;
        try { window.dispatchEvent(new CustomEvent('elc:notification', { detail: n })); } catch (e) {}
        break;
      }
    }
  }

  // Лёгкое всплывающее уведомление внутри портала (переиспользуем showToast из
  // team.html, если доступен) + короткий звуковой сигнал. Тихо деградирует.
  function chatNotify(text, withSound) {
    try { if (typeof window.showToast === 'function') window.showToast(text); } catch (e) {}
    if (withSound) { try { if (typeof window.playMessageBeep === 'function') window.playMessageBeep(); } catch (e) {} }
  }

  function onMessageNew(m) {
    if (!m || !m.id) return;
    // Дедуп: сообщение уже в активном канале (оптимистичный append + WS-эхо,
    // либо дубликат пуша). Без этого свои сообщения двоятся.
    if (m.channel_id === state.activeChannelId && state.messages.some(x => x.id === m.id)) return;
    const ch = state.channels.find(c => c.id === m.channel_id);
    if (ch) {
      ch.last_message_text = m.text || (m.type !== 'text' ? `[${m.type}]` : '');
      ch.last_message_at = m.created_at;
      if (m.channel_id !== state.activeChannelId && m.user_id !== state.me.uid) {
        ch.unread_count = (ch.unread_count || 0) + 1;
        // «Кто когда пишет»: тост + звук, если канал не заглушён и вкладка видима.
        if (!ch.muted && document.visibilityState === 'visible') {
          const who = userLabel(m.user_id);
          const chName = (ch.type === 'dm') ? '' : (ch.name ? ` · ${ch.name}` : '');
          const preview = m.text ? String(m.text).slice(0, 80)
            : (m.type === 'image' ? '📷 Фото' : m.type === 'audio' ? '🎤 Голосовое' : m.type === 'file' ? '📎 Файл' : 'Вложение');
          chatNotify(`💬 ${who}${chName}: ${preview}`, true);
        }
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

  function onChannelRenamed(msg) {
    const ch = state.channels.find(c => c.id === msg.channel_id);
    if (ch) { ch.name = msg.name; renderChannelList(); if (msg.channel_id === state.activeChannelId) renderMainHead(); }
  }

  // ── Data ───────────────────────────────────────────────────────────────
  // Канал, который попросили открыть снаружи (deep-link из WhatsApp/push), но
  // список ещё не загрузился — откроем его, как только loadChannels вернётся.
  let _pendingOpenChannel = null;

  async function loadChannels() {
    try {
      const d = await api('/api/chat/channels' + (state.showArchived ? '?archived=1' : ''));
      state.channels = d.items || [];
      renderChannelList();
      renderMainHead();
      updateNavBadge();
      if (_pendingOpenChannel) {
        const ch = state.channels.find(c => c.id === _pendingOpenChannel);
        if (ch) { const id = _pendingOpenChannel; _pendingOpenChannel = null; openChannel(id); }
      }
    } catch (e) { console.error('loadChannels:', e); }
  }

  // Публичный вход для deep-link: открыть конкретный чат по id. Если канал уже в
  // списке — открываем сразу; иначе запоминаем и догружаем список.
  function openChannelExternal(channelId) {
    if (!channelId) return;
    if (!state.mounted) { _pendingOpenChannel = channelId; return; }
    const ch = state.channels.find(c => c.id === channelId);
    if (ch) { _pendingOpenChannel = null; openChannel(channelId); }
    else { _pendingOpenChannel = channelId; loadChannels(); }
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
      /* Непрочитанный канал (в т.ч. ни разу не открытый, но с сообщениями):
         жирное имя + контрастный превью + точка-маркер слева. */
      .tc-channel.unread .tc-ch-name { font-weight:800; color:var(--t1); }
      .tc-channel.unread .tc-ch-last { color:var(--t1); font-weight:600; }
      .tc-channel.unread .tc-ch-av::after { content:''; position:absolute; top:-1px; right:-1px; width:11px; height:11px;
        border-radius:50%; background:var(--tc-ac); border:2px solid var(--bg2); box-sizing:border-box; }
      .tc-channel.unread .tc-ch-av { position:relative; }
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
      .tc-head-members, .tc-head-rename { width:36px; height:36px; border:none; background:transparent; color:var(--t2);
        font-size:18px; cursor:pointer; border-radius:9px; flex-shrink:0; }
      .tc-head-members:hover, .tc-head-rename:hover { background:var(--bg3); }
      .tc-head-rename { font-size:15px; }
      .tc-members-list { display:flex; flex-direction:column; max-height:220px; overflow-y:auto;
        border:1px solid var(--b1); border-radius:11px; }
      .tc-mem-row { display:flex; gap:11px; align-items:center; padding:8px 11px; border-bottom:1px solid var(--b1); }
      .tc-mem-row:last-child { border-bottom:none; }
      .tc-mem-badge { font-size:10.5px; font-weight:600; color:var(--tc-ac);
        background:color-mix(in srgb, var(--tc-ac) 14%, transparent); padding:1px 7px; border-radius:8px; margin-left:6px; }
      .tc-mem-rm { width:28px; height:28px; border:none; background:transparent; color:var(--t3);
        font-size:15px; cursor:pointer; border-radius:7px; flex-shrink:0; }
      .tc-mem-rm:hover { background:color-mix(in srgb, #e5484d 16%, transparent); color:#e5484d; }
      .tc-mem-rm:disabled { opacity:.4; cursor:default; }
      .tc-mem-admin { border:1px solid var(--b1); background:transparent; color:var(--t2);
        font-size:11px; font-weight:600; cursor:pointer; border-radius:7px; padding:4px 8px; flex-shrink:0; white-space:nowrap; }
      .tc-mem-admin:hover { background:var(--bg3); border-color:var(--tc-ac); color:var(--tc-ac); }
      .tc-mem-admin:disabled { opacity:.4; cursor:default; }
      .tc-mem-badge.admin { color:#f59e0b; background:color-mix(in srgb, #f59e0b 15%, transparent); }
      .tc-mem-actions { display:flex; gap:6px; align-items:center; margin-left:auto; flex-shrink:0; }

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
      .tc-mention { color:var(--tc-ac); font-weight:700; }
      .tc-msg.own .tc-mention { color:#fff; text-decoration:underline; }
      .tc-mention.me { background:color-mix(in srgb, var(--tc-ac) 22%, transparent); border-radius:4px; padding:0 3px; }
      .tc-msg.mentions-me .tc-msg-bubble { box-shadow:0 0 0 2px var(--tc-ac); }
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
      /* @-упоминания: выпадашка над композером */
      .tc-composer { position:relative; }
      .tc-mention-pop { position:absolute; left:16px; right:16px; bottom:100%; margin-bottom:6px; background:var(--bg2);
        border:1px solid var(--b1); border-radius:12px; box-shadow:0 6px 22px rgba(0,0,0,.18); max-height:230px; overflow-y:auto;
        z-index:6; display:none; }
      .tc-mention-pop.open { display:block; }
      .tc-mention-item { display:flex; align-items:center; gap:9px; padding:8px 12px; cursor:pointer; font-size:13.5px; }
      .tc-mention-item:hover, .tc-mention-item.active { background:var(--bg3); }
      .tc-mention-av { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        color:#fff; font-size:11px; font-weight:600; flex-shrink:0; }
      .tc-mention-name { font-weight:600; color:var(--t1); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

      /* ── Modals & pickers ── */
      .tc-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:100000; display:flex;
        align-items:center; justify-content:center; padding:16px;
        --tc-ac: var(--ac, #2563eb); }
      .tc-modal { background:var(--bg2); border-radius:14px; padding:22px 24px; width:100%; max-width:440px;
        max-height:84vh; overflow:auto; box-shadow:0 18px 50px rgba(0,0,0,.35); }
      .tc-modal h3 { margin:0 0 16px; font-size:18px; }
      .tc-newchat-hint { margin:-6px 0 14px; font-size:12.5px; color:var(--t3); line-height:1.45; }
      .tc-modal label { display:block; margin-bottom:12px; font-size:12.5px; color:var(--t2); font-weight:600; }
      .tc-modal input:not([type=checkbox]), .tc-modal textarea, .tc-modal select { width:100%; box-sizing:border-box; padding:9px 11px;
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
      /* ── Picker mode switch + org-structure tree ── */
      .tc-pick-modes { display:flex; gap:6px; margin:6px 0; }
      .tc-pick-mode { flex:1; padding:6px 8px; border:1px solid var(--b1); border-radius:8px; background:var(--bg3);
        cursor:pointer; font-size:12.5px; color:var(--t2); text-align:center; user-select:none; }
      .tc-pick-mode.active { background:color-mix(in srgb, var(--tc-ac) 15%, transparent); color:var(--t1);
        border-color:var(--tc-ac); font-weight:600; }
      .tc-org-row { display:flex; gap:9px; align-items:center; padding:8px 11px; border-bottom:1px solid var(--b1); }
      .tc-org-row:last-child { border-bottom:none; }
      .tc-org-name { flex:1; min-width:0; font-size:13px; color:var(--t1); font-weight:600;
        overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .tc-org-cnt { font-size:11px; color:var(--t3); flex-shrink:0; }
      .tc-org-rm { flex-shrink:0; border:none; background:transparent; color:#ef4444; cursor:pointer;
        font-size:12px; font-weight:600; padding:3px 7px; border-radius:6px; }
      .tc-org-rm:hover { background:color-mix(in srgb,#ef4444 14%,transparent); }
      .tc-org-rm:disabled { opacity:.4; cursor:default; }

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

  // Дефолтные «картинки» групп: эмодзи на красивом градиенте, детерминированно по id.
  const GROUP_EMOJIS = ['👥', '💬', '🚀', '⭐', '🔥', '🎯', '💡', '📌', '🎨', '🛠️', '📊', '🌈', '⚡', '🍀', '🎉', '🌟'];
  const GROUP_GRADIENTS = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fb6a4f)',
    'linear-gradient(135deg,#30cfd0,#5a4fcf)',
    'linear-gradient(135deg,#ff9a9e,#d46fb0)',
    'linear-gradient(135deg,#5ee7df,#b06ab3)',
    'linear-gradient(135deg,#f6a04d,#ee5a6f)',
    'linear-gradient(135deg,#3a8dde,#6f42c1)',
  ];
  function strHash(s) {
    let h = 0;
    for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function groupEmoji(ch) { return GROUP_EMOJIS[strHash(ch.id || ch.name || '') % GROUP_EMOJIS.length]; }
  function groupGradient(ch) { return GROUP_GRADIENTS[strHash((ch.id || '') + 'g') % GROUP_GRADIENTS.length]; }

  // Аватар канала: для DM — фото/инициалы сотрудника, для группы — эмодзи на градиенте.
  function channelAvatarHtml(cls, ch) {
    if (ch.type === 'dm') {
      return avatarHtml(cls, ch.other_user_id, userAvatar(ch.other_user_id || ''), userColor(ch.other_user_id || ''));
    }
    if (ch.icon && /^(https?:|\/)/.test(ch.icon)) {
      return `<div class="${cls}" style="overflow:hidden"><img src="${escapeHtml(ch.icon)}" alt="" style="width:100%;height:100%;object-fit:cover"></div>`;
    }
    return `<div class="${cls}" style="background:${groupGradient(ch)};color:#fff"><span style="font-size:1.4em;line-height:1">${escapeHtml(ch.icon || groupEmoji(ch))}</span></div>`;
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
    // Счётчики на вкладках — сразу видно, сколько чатов в каждой категории.
    // Убирает путаницу «видно только Все»: пустая вкладка = реально нет чатов,
    // а не сломанный фильтр.
    const nGroups = chs.filter(c => c.type === 'channel' || c.type === 'group').length;
    const nDm = chs.filter(c => c.type === 'dm').length;
    const setTab = (tab, base, n) => { const t = root.querySelector(`.tc-tab[data-tab="${tab}"]`); if (t) t.textContent = base + (n ? ' ' + n : ''); };
    setTab('all', 'Все', chs.length); setTab('channel', 'Группы', nGroups); setTab('dm', 'Личные', nDm);

    if (state.channelFilter === 'channel') chs = chs.filter(c => c.type === 'channel' || c.type === 'group');
    else if (state.channelFilter === 'dm') chs = chs.filter(c => c.type === 'dm');
    const q = state.channelSearch.trim().toLowerCase();
    if (q) chs = chs.filter(c => channelDisplayName(c).toLowerCase().includes(q));

    if (chs.length === 0) {
      let msg;
      if (q) msg = 'Ничего не найдено';
      else if (state.channels.length === 0) msg = 'Пока нет чатов.<br>Нажми <b>＋</b>, чтобы начать переписку.';
      else msg = 'Нет чатов в этой вкладке';
      listEl.innerHTML = `<div class="tc-list-empty">${msg}</div>`;
      return;
    }

    listEl.innerHTML = chs.map(ch => {
      const active = ch.id === state.activeChannelId ? ' active' : '';
      const hasUnread = ch.unread_count > 0 ? ' unread' : '';
      const unread = ch.unread_count > 0 ? `<span class="tc-ch-badge">${formatUnread(ch.unread_count)}</span>` : '';
      const time = ch.last_message_at ? formatTime(ch.last_message_at) : '';
      const last = ch.last_message_text
        ? escapeHtml(ch.last_message_text)
        : '<span class="tc-ch-muted">нет сообщений</span>';
      return `<div class="tc-channel${active}${hasUnread}" data-ch-id="${escapeHtml(ch.id)}">
        ${channelAvatarHtml('tc-ch-av', ch)}
        <div class="tc-ch-body">
          <div class="tc-ch-top"><span class="tc-ch-name">${escapeHtml(channelDisplayName(ch))}</span><span class="tc-ch-time">${time}</span></div>
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
    const msgMentions = parseMsgMentions(m);
    const mentionsMe = !own && msgMentions.includes(state.me?.uid);
    const cls = `tc-msg${own ? ' own' : ''}${grouped ? ' grouped' : ''}${mentionsMe ? ' mentions-me' : ''}`;

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
      let html = escapeHtml(m.text).replace(/(https?:\/\/[^\s<>"]+)/g,
        '<a href="$1" target="_blank" rel="noopener">$1</a>');
      // Подсветить «@Имя» упомянутых. Один проход с альтернацией (длинные имена
      // раньше) — «@Иван» не съест «@Иван Петров», и нет вложенных span'ов.
      if (msgMentions.length) {
        const byLabel = new Map();
        for (const uid of msgMentions) {
          const label = userLabel(uid);
          if (!label) continue;
          const esc = escapeHtml('@' + label);
          if (!byLabel.has(esc)) byLabel.set(esc, uid);
        }
        const escLabels = [...byLabel.keys()].sort((a, b) => b.length - a.length);
        if (escLabels.length) {
          const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const re = new RegExp(escLabels.map(reEsc).join('|'), 'g');
          html = html.replace(re, (mt) => {
            const meCls = (byLabel.get(mt) === state.me?.uid) ? ' me' : '';
            return `<span class="tc-mention${meCls}">${mt}</span>`;
          });
        }
      }
      body += `<div class="tc-msg-text">${html}</div>`;
    }
    if (m.file_key) {
      const meta = m.file_meta ? (typeof m.file_meta === 'string' ? JSON.parse(m.file_meta) : m.file_meta) : {};
      const furl = fileUrl(m.file_key);
      if (m.type === 'image' || (meta.mime && meta.mime.startsWith('image/'))) {
        body += `<img class="tc-img-att" src="${furl}" alt="${escapeHtml(meta.name || '')}" loading="lazy" onclick="window.open('${furl}','_blank')">`;
      } else {
        body += `<a class="tc-file-att" href="${furl}" target="_blank" rel="noopener">📎 ${escapeHtml(meta.name || 'файл')}${meta.size ? ` <span style="opacity:.6">(${Math.round(meta.size / 1024)} КБ)</span>` : ''}</a>`;
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
    else sub = ch.member_count ? `Группа · ${ch.member_count} ${pluralMembers(ch.member_count)}` : 'Группа';

    const isAdmin = !!ch.is_admin;
    const searchBtn = `<button class="tc-head-rename tc-head-searchbtn" title="Поиск в переписке">🔎</button>`;
    const renameBtn = (ch.type !== 'dm' && isAdmin) ?
      `<button class="tc-head-rename" title="Переименовать чат">✏️</button>` : '';
    const iconBtn = (ch.type !== 'dm' && isAdmin) ?
      `<button class="tc-head-rename tc-head-iconbtn" title="Сменить иконку">🎨</button>` : '';
    // Архивировать может только создатель/админ (у них is_admin=1).
    const canArchive = isAdmin;
    const archiveBtn = canArchive ?
      `<button class="tc-head-rename tc-head-archbtn" title="${state.showArchived ? 'Вернуть из архива' : 'Архивировать чат'}">${state.showArchived ? '📤' : '🗄'}</button>` : '';
    const membersBtn = ch.type === 'dm' ? '' :
      `<button class="tc-head-members" title="Участники">👥</button>`;
    head.innerHTML = `
      <button class="tc-back" title="Назад">‹</button>
      ${channelAvatarHtml('tc-head-av', ch)}
      <div class="tc-head-meta">
        <div class="tc-head-name">${escapeHtml(channelDisplayName(ch))}</div>
        <div class="tc-head-sub">${escapeHtml(sub)}</div>
      </div>
      ${searchBtn}
      ${renameBtn}
      ${iconBtn}
      ${archiveBtn}
      ${membersBtn}`;
    const sb = head.querySelector('.tc-head-searchbtn');
    if (sb) sb.onclick = () => openChatSearch(ch);
    const rb = head.querySelector('.tc-head-rename:not(.tc-head-iconbtn):not(.tc-head-searchbtn):not(.tc-head-archbtn)');
    if (rb) rb.onclick = () => renameChannelPrompt(ch);
    const ib = head.querySelector('.tc-head-iconbtn');
    if (ib) ib.onclick = () => openIconPicker(ch);
    const ab = head.querySelector('.tc-head-archbtn');
    if (ab) ab.onclick = async () => {
      const toArchive = !state.showArchived;
      if (toArchive && !confirm('Архивировать этот чат? Он уйдёт из списка (вернуть можно через 🗄 «Архив» в шапке списка).')) return;
      try {
        await api(`/api/chat/channels/${ch.id}/archive`, { method: 'POST', body: JSON.stringify({ archived: toArchive }) });
        state.channels = state.channels.filter(c => c.id !== ch.id);
        state.activeChannelId = null;
        const r = state.rootEl && state.rootEl.querySelector('.tc-root');
        if (r) r.classList.remove('tc-show-main');
        syncViewport();
        renderChannelList(); renderMainHead(); renderMessages(); renderComposer();
      } catch (e) { alert('Ошибка: ' + (e.message || e)); }
    };
    const mb = head.querySelector('.tc-head-members');
    if (mb) mb.onclick = () => openMembersModal(ch.id);
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
  // ── @-упоминания в композере ───────────────────────────────────────────
  // Печатаешь @ в групповом чате → выпадашка участников → выбор подставляет
  // «@Имя Фамилия» и запоминает uid. На отправке шлём body.mentions = [uid…];
  // воркер уведомит упомянутых лично (колокольчик+пуш+WA) даже в muted-канале.
  const _mention = { items: [], index: 0, start: -1, end: -1, ta: null, pop: null };

  // Лениво тянем участников активного канала в state.members[channelId].
  function ensureChannelMembers(channelId) {
    if (!channelId) return Promise.resolve([]);
    if (state.members[channelId]) return Promise.resolve(state.members[channelId]);
    return api(`/api/chat/channels/${channelId}/members`)
      .then(d => { state.members[channelId] = (d.items || []); return state.members[channelId]; })
      .catch(() => { state.members[channelId] = []; return []; });
  }

  // Контекст @-токена под курсором: {query, start, end} либо null.
  function getMentionContext(ta) {
    if (!ta || ta.selectionStart == null) return null;
    const pos = ta.selectionStart;
    const m = ta.value.slice(0, pos).match(/(?:^|\s)@([^\s@]*)$/);
    if (!m) return null;
    return { query: m[1], start: pos - m[1].length - 1, end: pos };
  }

  function mentionCandidates(channelId, query) {
    const members = state.members[channelId] || [];
    const q = (query || '').toLowerCase();
    const out = [], seen = new Set();
    for (const mem of members) {
      const uid = mem.user_id;
      if (!uid || uid === state.me?.uid || seen.has(uid)) continue;
      const label = userLabel(uid);
      if (q && !label.toLowerCase().includes(q)) continue;
      seen.add(uid);
      out.push({ uid, label });
      if (out.length >= 8) break;
    }
    return out;
  }

  function closeMentionPop() {
    _mention.items = []; _mention.index = 0; _mention.start = -1; _mention.end = -1;
    if (_mention.pop) { _mention.pop.classList.remove('open'); _mention.pop.innerHTML = ''; }
  }

  function renderMentionPop() {
    const pop = _mention.pop;
    if (!pop) return;
    if (!_mention.items.length) { closeMentionPop(); return; }
    pop.innerHTML = _mention.items.map((it, i) => `
      <div class="tc-mention-item${i === _mention.index ? ' active' : ''}" data-mi="${i}">
        <div class="tc-mention-av" style="background:${userColor(it.uid)}">${escapeHtml(userAvatar(it.uid))}</div>
        <div class="tc-mention-name">${escapeHtml(it.label)}</div>
      </div>`).join('');
    pop.classList.add('open');
    pop.querySelectorAll('.tc-mention-item').forEach(el => {
      // mousedown (не click) + preventDefault — чтобы textarea не потеряла фокус.
      el.onmousedown = (e) => { e.preventDefault(); applyMention(_mention.items[Number(el.dataset.mi)]); };
    });
  }

  function applyMention(item) {
    const ta = _mention.ta;
    if (!ta || !item || _mention.start < 0) return;
    const before = ta.value.slice(0, _mention.start);
    const after = ta.value.slice(_mention.end);
    const insert = '@' + item.label + ' ';
    ta.value = before + insert + after;
    state.composerDraft = ta.value;
    const newPos = (before + insert).length;
    try { ta.selectionStart = ta.selectionEnd = newPos; } catch {}
    if (!state.composerMentions.some(m => m.uid === item.uid && m.label === item.label)) {
      state.composerMentions.push({ uid: item.uid, label: item.label });
    }
    closeMentionPop();
    autoresizeTa(ta);
    ta.focus();
  }

  function onComposerInputMention(ta) {
    const ch = state.channels.find(c => c.id === state.activeChannelId);
    if (!ch || ch.type === 'dm') { closeMentionPop(); return; }
    if (!getMentionContext(ta)) { closeMentionPop(); return; }
    ensureChannelMembers(state.activeChannelId).then(() => {
      const ctx = getMentionContext(ta);   // курсор мог сместиться за время запроса
      if (!ctx) { closeMentionPop(); return; }
      _mention.start = ctx.start; _mention.end = ctx.end;
      _mention.items = mentionCandidates(state.activeChannelId, ctx.query);
      _mention.index = 0;
      renderMentionPop();
    });
  }

  // true если клавиша «съедена» выпадашкой (навигация/выбор/закрытие).
  function onComposerKeyMention(e) {
    if (!_mention.items.length) return false;
    if (e.key === 'ArrowDown') { e.preventDefault(); _mention.index = (_mention.index + 1) % _mention.items.length; renderMentionPop(); return true; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); _mention.index = (_mention.index - 1 + _mention.items.length) % _mention.items.length; renderMentionPop(); return true; }
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); applyMention(_mention.items[_mention.index]); return true; }
    if (e.key === 'Escape')    { e.preventDefault(); closeMentionPop(); return true; }
    return false;
  }

  // Финальный список uid'ов для отправки: только те, чьё «@Имя» осталось в тексте.
  function collectComposerMentions(text) {
    const out = [], seen = new Set();
    for (const m of state.composerMentions) {
      if (seen.has(m.uid)) continue;
      if (text.includes('@' + m.label)) { out.push(m.uid); seen.add(m.uid); }
    }
    return out;
  }

  // mentions сообщения → массив uid'ов (приходят массивом по WS или строкой из БД).
  function parseMsgMentions(m) {
    const v = m && m.mentions;
    if (Array.isArray(v)) return v.filter(Boolean);
    if (typeof v === 'string' && v) { try { const a = JSON.parse(v); return Array.isArray(a) ? a.filter(Boolean) : []; } catch { return []; } }
    return [];
  }

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
      <div class="tc-mention-pop" id="tc-mention-pop"></div>
      <div class="tc-composer-row">
        <button class="tc-btn-icon" title="Прикрепить файл" id="tc-attach-btn">📎</button>
        <textarea id="tc-composer-input" rows="1" placeholder="Написать сообщение…">${escapeHtml(state.composerDraft)}</textarea>
        <button class="tc-btn-icon tc-btn-send" title="Отправить (Enter)" id="tc-send-btn">➤</button>
      </div>
      <input type="file" id="tc-file-input" style="display:none">`;

    const ta = c.querySelector('#tc-composer-input');
    _mention.ta = ta;
    _mention.pop = c.querySelector('#tc-mention-pop');
    closeMentionPop();   // композер пересобран — старая выпадашка/индексы недействительны
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    ta.oninput = () => { state.composerDraft = ta.value; autoresizeTa(ta); onComposerInputMention(ta); };
    ta.onkeydown = (e) => {
      // Сначала отдаём клавишу выпадашке @-упоминаний (стрелки/Enter/Tab/Esc).
      if (onComposerKeyMention(e)) return;
      // On touch keyboards Enter inserts a newline (send via the button); on
      // desktop Enter sends, Shift+Enter is a newline — standard messenger UX.
      if (e.key === 'Enter' && !e.shiftKey && !isTouch) { e.preventDefault(); sendCurrent(); }
    };
    // When the field gains focus the keyboard slides up; keep the latest
    // messages in view above it once the viewport settles.
    ta.onfocus = () => { setTimeout(() => { syncViewport(); scrollMsgsToBottom(false); }, 300); };
    ta.onblur = () => setTimeout(closeMentionPop, 150);   // даём mousedown по пункту успеть
    ta.onpaste = onComposerPaste;
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
        if (b.dataset.bannerCancel === 'edit') { state.editingMsg = null; state.composerDraft = ''; state.composerMentions = []; }
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
        state.editingMsg = null; state.composerDraft = ''; state.composerMentions = []; renderComposer({ focus: true });
      } catch (e) { alert('Ошибка: ' + e.message); }
      return;
    }
    if (!state.activeChannelId) return;
    const body = { text };
    if (state.replyToMsg) body.reply_to = state.replyToMsg.id;
    const mentions = collectComposerMentions(text);
    if (mentions.length) body.mentions = mentions;
    try {
      const resp = await api(`/api/chat/channels/${state.activeChannelId}/messages`, { method: 'POST', body: JSON.stringify(body) });
      state.composerDraft = ''; state.replyToMsg = null; state.composerMentions = [];
      closeMentionPop();
      renderComposer({ focus: true });
      // Оптимистично показываем сразу, не дожидаясь WS-эха (дедуп по id).
      if (resp && resp.message) onMessageNew(resp.message);
    } catch (e) { alert('Ошибка отправки: ' + e.message); }
  }

  // Загрузить файл в R2 и сразу отправить сообщением-вложением.
  // Используется и кнопкой 📎 (onFileSelected), и вставкой из буфера (onPaste).
  async function uploadAndSendFile(file) {
    if (!file || !state.activeChannelId) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await api('/api/chat/files/upload', { method: 'POST', body: fd });
      const resp = await api(`/api/chat/channels/${state.activeChannelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ file_key: up.file_key, file_meta: up.file_meta }),
      });
      if (resp && resp.message) onMessageNew(resp.message);
    } catch (e) { alert('Ошибка загрузки: ' + e.message); }
  }

  async function onFileSelected(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    await uploadAndSendFile(file);
    ev.target.value = '';
  }

  // Cmd/Ctrl+V в поле ввода: если в буфере картинка/файл — загрузить и отправить
  // как вложение (работает и на десктопе, и на мобильном long-press → Вставить).
  // Обычный текст пропускаем в textarea стандартным поведением (oninput обновит
  // composerDraft), поэтому preventDefault зовём ТОЛЬКО когда нашли файл.
  async function onComposerPaste(e) {
    if (!state.activeChannelId) return;
    const dt = e.clipboardData;
    if (!dt) return;
    const files = [];
    if (dt.items && dt.items.length) {
      for (const it of dt.items) {
        if (it.kind === 'file') { const f = it.getAsFile(); if (f) files.push(f); }
      }
    }
    if (!files.length && dt.files && dt.files.length) {
      for (const f of dt.files) files.push(f);
    }
    if (!files.length) return;   // только текст — пусть вставляется как обычно
    e.preventDefault();
    for (const f of files) await uploadAndSendFile(f);
  }

  function onMsgAction(action, msgId) {
    const m = state.messages.find(x => x.id === msgId);
    if (!m) return;
    if (action === 'reply') { state.replyToMsg = m; state.editingMsg = null; renderComposer({ focus: true }); }
    if (action === 'edit') { state.editingMsg = m; state.replyToMsg = null; state.composerDraft = m.text || ''; state.composerMentions = []; renderComposer({ focus: true }); }
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

  // ── Roster (справочник сотрудников) ─────────────────────────────────────
  // Два источника: (1) D1 /api/chat/roster — та же каноническая личность, что
  // матчит членство в чате; (2) window.usersState — зеркало Firebase /users.json.
  // Сливаем оба по email, чтобы пикер видел ВСЕХ (новые/пересозданные есть в D1,
  // но могут отсутствовать в зеркале — отсюда «не находит при добавлении»).
  let _roster = null;     // [{uid, email, label, sub}] из D1, null = ещё не грузили
  async function loadRoster() {
    try {
      const d = await api('/api/chat/roster');
      _roster = (d.items || []).map(u => ({
        uid: u.uid,
        email: (u.email || '').toLowerCase(),
        label: [u.last_name, u.name].filter(Boolean).join(' ').trim() || u.name || u.email || String(u.uid).slice(0, 8),
        sub: u.email || u.position || '',
      }));
    } catch { /* остаёмся на usersState-зеркале */ }
    return _roster;
  }

  function getRoster() {
    const meUid = state.me?.uid;
    const meEmail = (state.me?.email || '').toLowerCase();
    const seenUid = new Set();
    const seenEmail = new Set();
    const arr = [];
    // 1) Канонический справочник из D1 (если загрузился)
    for (const r of (_roster || [])) {
      if (!r.uid || r.uid === meUid) continue;
      if (r.email && r.email === meEmail) continue;
      if (seenUid.has(r.uid) || (r.email && seenEmail.has(r.email))) continue;
      arr.push({ uid: r.uid, label: r.label, sub: r.sub });
      seenUid.add(r.uid); if (r.email) seenEmail.add(r.email);
    }
    // 2) Дополняем зеркалом — людьми, которых нет в D1-ростере (по email/uid)
    const map = window.usersState?.users || window.usersState?.byUid || {};
    for (const [uid, u] of Object.entries(map)) {
      if (uid === meUid) continue;
      if (u && u.active === false) continue;
      const email = (u.email || '').toLowerCase();
      if (seenUid.has(uid) || (email && seenEmail.has(email))) continue;
      if (email && email === meEmail) continue;
      const label = [u.lastName, u.name].filter(Boolean).join(' ').trim() || u.name || u.email || uid.slice(0, 8);
      arr.push({ uid, label, sub: u.email || u.position || '' });
      seenUid.add(uid); if (email) seenEmail.add(email);
    }
    arr.sort((a, b) => a.label.localeCompare(b.label, 'ru'));
    return arr;
  }

  // ── Оргструктура (для пакетного добавления/удаления по отделам) ─────────
  // kv['org:structure'] → плоский список узлов с рекурсивным набором uid'ов
  // (head + members узла И всех его потомков), чтобы галка на отделении
  // выбирала всех людей внутри, включая подотделы.
  let _orgNodes = null;   // [{id, name, depth, uids:[...]}], null = ещё не грузили
  async function loadOrgStructure() {
    try {
      const d = await api('/api/org/structure');
      _orgNodes = buildOrgNodes(d.structure);
    } catch { _orgNodes = []; }
    return _orgNodes;
  }
  function buildOrgNodes(structure) {
    const out = [];
    if (!structure) return out;
    function collectUids(node) {
      const set = new Set();
      if (node.headUid) set.add(node.headUid);
      for (const u of (node.memberUids || [])) if (u) set.add(u);
      const children = node.subDepartments || node.departments || [];
      for (const c of children) for (const u of collectUids(c)) set.add(u);
      return set;
    }
    function walk(node, depth) {
      out.push({
        id: node.id || node.name || ('n' + out.length),
        name: node.name || 'Без названия',
        depth,
        uids: Array.from(collectUids(node)),
      });
      const children = node.subDepartments || node.departments || [];
      for (const c of children) walk(c, depth + 1);
    }
    for (const branch of (structure.branches || [])) walk(branch, 0);
    return out;
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
  // Единое окно создания: 1 сотрудник → личная переписка, 2+ → группа.
  function openNewChatModal() {
    const roster = getRoster();
    const selected = new Set();
    const ov = document.createElement('div');
    ov.className = 'tc-modal-overlay';
    ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
    ov.innerHTML = `<div class="tc-modal">
      <h3>➕ Новый чат</h3>
      <div class="tc-newchat-hint">Выбери одного — будет личная переписка, нескольких — группа.</div>
      <label id="tc-new-name-wrap" style="display:none">Название группы
        <input id="tc-new-name" placeholder="например, Разработка" maxlength="60">
      </label>
      <div style="font-size:12px;color:var(--t2);font-weight:600">Кого добавить</div>
      <div class="tc-pick-modes">
        <div class="tc-pick-mode active" data-mode="name">🔍 По имени</div>
        <div class="tc-pick-mode" data-mode="org">🏢 По структуре</div>
      </div>
      <input class="tc-picker-search" id="tc-new-search" placeholder="🔍 поиск по имени…">
      <div class="tc-picker-list" id="tc-new-members-list"></div>
      <div class="tc-modal-foot">
        <span class="tc-picker-count" id="tc-new-members-count" style="margin-right:auto">Выбрано: 0</span>
        <button data-tc-cancel>Отмена</button>
        <button class="primary" data-tc-create disabled>Создать</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    ov.querySelector('.tc-modal').onclick = (e) => e.stopPropagation();

    const listEl = ov.querySelector('#tc-new-members-list');
    const countEl = ov.querySelector('#tc-new-members-count');
    const searchEl = ov.querySelector('#tc-new-search');
    const nameWrap = ov.querySelector('#tc-new-name-wrap');
    const createBtn = ov.querySelector('[data-tc-create]');
    const modeBtns = ov.querySelectorAll('.tc-pick-mode');
    let pickMode = 'name';   // 'name' | 'org'

    function refreshState() {
      const n = selected.size;
      countEl.textContent = 'Выбрано: ' + n;
      nameWrap.style.display = n >= 2 ? '' : 'none';
      createBtn.disabled = n === 0;
      createBtn.textContent = n >= 2 ? 'Создать группу' : (n === 1 ? 'Написать' : 'Создать');
    }

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
          refreshState();
        };
      });
    }
    // Дерево структуры: галка на отделе → выбрать всех его людей (рекурсивно),
    // кроме себя (создатель добавляется автоматически).
    function renderOrgList() {
      const nodes = _orgNodes || [];
      if (!nodes.length) {
        listEl.innerHTML = `<div class="tc-picker-empty">${_orgNodes === null ? 'Загрузка структуры…' : 'Структура компании не заполнена'}</div>`;
        return;
      }
      const meUid = state.me?.uid;
      listEl.innerHTML = nodes.map(n => {
        const uids = n.uids.filter(u => u !== meUid);
        const allSel = uids.length > 0 && uids.every(u => selected.has(u));
        const pad = 11 + n.depth * 16;
        return `<div class="tc-org-row" style="padding-left:${pad}px">
          <input type="checkbox" class="tc-picker-check" data-org-add="${escapeHtml(n.id)}" ${allSel ? 'checked' : ''} ${uids.length === 0 ? 'disabled' : ''}>
          <div class="tc-org-name">${escapeHtml(n.name)}</div>
          <span class="tc-org-cnt">${uids.length} чел.</span>
        </div>`;
      }).join('');
      listEl.querySelectorAll('[data-org-add]').forEach(cb => {
        cb.onclick = (e) => {
          e.stopPropagation();
          const node = (_orgNodes || []).find(n => n.id === cb.getAttribute('data-org-add'));
          if (!node) return;
          const uids = node.uids.filter(u => u !== meUid);
          if (cb.checked) uids.forEach(u => selected.add(u));
          else uids.forEach(u => selected.delete(u));
          refreshState();
        };
      });
    }
    function renderActiveList() {
      if (pickMode === 'org') renderOrgList();
      else renderList();
    }
    modeBtns.forEach(b => {
      b.onclick = () => {
        const mode = b.getAttribute('data-mode');
        if (mode === pickMode) return;
        pickMode = mode;
        modeBtns.forEach(x => x.classList.toggle('active', x === b));
        searchEl.style.display = (mode === 'name') ? '' : 'none';
        if (mode === 'org' && _orgNodes === null) loadOrgStructure().then(() => { if (pickMode === 'org') renderActiveList(); });
        renderActiveList();
      };
    });

    searchEl.oninput = renderList;
    renderList();
    refreshState();
    loadRoster().then(() => renderActiveList());
    loadOrgStructure().then(() => { if (pickMode === 'org') renderActiveList(); });

    ov.querySelector('[data-tc-cancel]').onclick = () => ov.remove();
    createBtn.onclick = async () => {
      const members = Array.from(selected);
      if (members.length === 0) return;
      createBtn.disabled = true;
      try {
        if (members.length === 1) {
          // Один сотрудник → личная переписка
          const d = await api('/api/chat/dm', { method: 'POST', body: JSON.stringify({ user_id: members[0] }) });
          ov.remove();
          await loadChannels();
          openChannel(d.channel_id);
        } else {
          // Несколько → группа. Имя необязательно — соберём из участников.
          let name = ov.querySelector('#tc-new-name').value.trim();
          if (!name) {
            const labels = members.map(uid => (roster.find(r => r.uid === uid) || {}).label).filter(Boolean);
            name = labels.slice(0, 3).join(', ') + (labels.length > 3 ? ` +${labels.length - 3}` : '');
          }
          const d = await api('/api/chat/channels', { method: 'POST', body: JSON.stringify({ type: 'group', name, members }) });
          ov.remove();
          await loadChannels();
          openChannel(d.channel.id);
        }
      } catch (e) { alert(e.message); createBtn.disabled = false; }
    };
  }

  // Переименование группы/канала (только админ — кнопка показывается им).
  async function renameChannelPrompt(ch) {
    if (!ch) return;
    const cur = channelDisplayName(ch);
    const name = prompt('Новое название чата:', cur);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === cur) return;
    try {
      await api(`/api/chat/channels/${ch.id}/rename`, { method: 'POST', body: JSON.stringify({ name: trimmed }) });
      ch.name = trimmed;
      renderMainHead();
      renderChannelList();
    } catch (e) { alert(e.message); }
  }

  // Поиск по сообщениям внутри открытого чата (вся история, через FTS-бэкенд).
  function openChatSearch(ch) {
    if (!ch) return;
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:100000;display:flex;align-items:flex-start;justify-content:center;padding-top:8vh';
    ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
    ov.innerHTML = `<div style="background:var(--bg2,#fff);border-radius:14px;padding:16px;max-width:480px;width:94vw;box-shadow:0 10px 40px rgba(0,0,0,.25);max-height:80vh;display:flex;flex-direction:column">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
        <input id="tc-msrch-inp" placeholder="🔎 Поиск по сообщениям…" style="flex:1;padding:9px 12px;border:1px solid var(--b1,#e3e5ea);border-radius:8px;font-size:14px">
        <button id="tc-msrch-close" style="padding:8px 12px;border:none;background:var(--bg3,#eee);border-radius:8px;cursor:pointer">✕</button>
      </div>
      <div id="tc-msrch-res" style="overflow:auto;font-size:13px"></div>
    </div>`;
    document.body.appendChild(ov);
    const inp = ov.querySelector('#tc-msrch-inp');
    const res = ov.querySelector('#tc-msrch-res');
    ov.querySelector('#tc-msrch-close').onclick = () => ov.remove();
    inp.focus();
    let t;
    inp.oninput = () => {
      clearTimeout(t);
      const q = inp.value.trim();
      if (q.length < 2) { res.innerHTML = '<div style="color:var(--t3,#888);padding:10px">Введите минимум 2 символа…</div>'; return; }
      t = setTimeout(async () => {
        res.innerHTML = '<div style="color:var(--t3,#888);padding:10px">⏳ Ищу…</div>';
        try {
          const d = await api(`/api/chat/search?channel_id=${encodeURIComponent(ch.id)}&q=${encodeURIComponent(q)}`);
          const items = d.items || [];
          if (!items.length) { res.innerHTML = '<div style="color:var(--t3,#888);padding:10px">Ничего не найдено</div>'; return; }
          res.innerHTML = items.map(m => {
            const who = escapeHtml(userLabel(m.user_id));
            const when = m.created_at ? formatTime(m.created_at) : '';
            return `<div style="padding:9px 10px;border-bottom:1px solid var(--b1,#eee)">
              <div style="font-size:12px"><b style="color:var(--ac2,#4f46e5)">${who}</b> <span style="color:var(--t3,#999)">${when}</span></div>
              <div style="color:var(--t1,#222);margin-top:2px;white-space:pre-wrap">${escapeHtml(m.text || '')}</div>
            </div>`;
          }).join('');
        } catch (e) { res.innerHTML = '<div style="color:#dc2626;padding:10px">Ошибка: ' + (e.message || e) + '</div>'; }
      }, 300);
    };
  }

  // Ужать картинку до квадрата maxSize (cover-кроп по центру) → JPEG Blob.
  function downscaleImageBlob(file, maxSize) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
          const out = Math.min(maxSize, side) || maxSize;
          const cv = document.createElement('canvas');
          cv.width = out; cv.height = out;
          cv.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, out, out);
          cv.toBlob(b => b ? resolve(b) : reject(new Error('не удалось сжать')), 'image/jpeg', 0.85);
        } catch (e) { reject(e); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('не удалось прочитать изображение')); };
      img.src = url;
    });
  }

  // Сменить иконку группы — фото с компьютера, либо эмодзи, либо сброс к авто.
  function openIconPicker(ch) {
    if (!ch) return;
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:100000;display:flex;align-items:center;justify-content:center';
    ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
    const grid = GROUP_EMOJIS.map(e =>
      `<button class="tc-icon-pick" data-e="${e}" style="font-size:24px;width:46px;height:46px;border:1px solid var(--b1,#e3e5ea);background:var(--bg2,#fff);border-radius:10px;cursor:pointer">${e}</button>`
    ).join('');
    ov.innerHTML = `<div style="background:var(--bg2,#fff);border-radius:14px;padding:18px;max-width:360px;width:92vw;box-shadow:0 10px 40px rgba(0,0,0,.25)">
      <div style="font-weight:700;margin-bottom:12px;color:var(--t1,#111)">🎨 Иконка группы</div>
      <button id="tc-icon-photo" style="width:100%;padding:10px;border:none;background:#25D366;color:#fff;border-radius:9px;cursor:pointer;font-weight:600;margin-bottom:14px">📷 Загрузить фото с компьютера</button>
      <input type="file" id="tc-icon-file" accept="image/*" style="display:none">
      <div style="font-size:12px;color:var(--t3,#888);margin-bottom:6px">или выбери эмодзи:</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">${grid}</div>
      <div id="tc-icon-status" style="font-size:12px;margin-top:10px;min-height:14px"></div>
      <div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end">
        <button id="tc-icon-reset" style="padding:8px 12px;border:1px solid var(--b1,#e3e5ea);background:none;border-radius:8px;cursor:pointer">Сбросить</button>
        <button id="tc-icon-close" style="padding:8px 12px;border:none;background:var(--bg3,#eee);border-radius:8px;cursor:pointer">Закрыть</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    const status = ov.querySelector('#tc-icon-status');
    const apply = async (icon) => {
      try {
        await api(`/api/chat/channels/${ch.id}/icon`, { method: 'POST', body: JSON.stringify({ icon }) });
        ch.icon = icon || null;
        ov.remove();
        renderMainHead();
        renderChannelList();
      } catch (e) { alert('Ошибка: ' + (e.message || e)); }
    };
    ov.querySelectorAll('.tc-icon-pick').forEach(b => { b.onclick = () => apply(b.dataset.e); });
    ov.querySelector('#tc-icon-reset').onclick = () => apply('');
    ov.querySelector('#tc-icon-close').onclick = () => ov.remove();
    const fileInput = ov.querySelector('#tc-icon-file');
    ov.querySelector('#tc-icon-photo').onclick = () => fileInput.click();
    fileInput.onchange = async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file || !/^image\//.test(file.type)) return;
      status.textContent = '⏳ Загружаю…';
      try {
        const blob = await downscaleImageBlob(file, 256);
        const fd = new FormData();
        fd.append('file', blob, 'icon.jpg');
        const res = await api(`/api/chat/channels/${ch.id}/icon-upload`, { method: 'POST', body: fd });
        ch.icon = res.icon;
        ov.remove();
        renderMainHead();
        renderChannelList();
      } catch (e) { status.innerHTML = '<span style="color:#dc2626">Ошибка: ' + (e.message || e) + '</span>'; }
      finally { fileInput.value = ''; }
    };
  }

  // Управление участниками канала: список ролей + добавление (для админов).
  async function openMembersModal(channelId) {
    const ch = state.channels.find(c => c.id === channelId);
    const iAmAdmin = !!ch?.is_admin;
    const ov = document.createElement('div');
    ov.className = 'tc-modal-overlay';
    ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
    const addSection = iAmAdmin ? `
      <div style="margin-top:10px;font-size:12px;color:var(--t2);font-weight:600">Добавить сотрудников</div>
      <div class="tc-pick-modes">
        <div class="tc-pick-mode active" data-mode="name">🔍 По имени</div>
        <div class="tc-pick-mode" data-mode="org">🏢 По структуре</div>
      </div>
      <input class="tc-picker-search" id="tc-mem-search" placeholder="🔍 поиск по имени…">
      <div class="tc-picker-list" id="tc-mem-picker"></div>` : '';
    const footAdd = iAmAdmin ? `<button class="primary" data-tc-add disabled>Добавить</button>` : '';
    const footCount = iAmAdmin
      ? `<span class="tc-picker-count" id="tc-mem-count" style="margin-right:auto">Выбрано: 0</span>`
      : `<span style="margin-right:auto"></span>`;
    ov.innerHTML = `<div class="tc-modal">
      <h3>👥 Участники</h3>
      <div class="tc-members-list" id="tc-mem-list"><div class="tc-picker-empty">Загрузка…</div></div>
      ${addSection}
      <div class="tc-modal-foot">
        ${footCount}
        <button data-tc-close>Закрыть</button>
        ${footAdd}
      </div>
    </div>`;
    document.body.appendChild(ov);
    ov.querySelector('.tc-modal').onclick = (e) => e.stopPropagation();

    const memListEl = ov.querySelector('#tc-mem-list');
    const pickerEl = ov.querySelector('#tc-mem-picker');
    const searchEl = ov.querySelector('#tc-mem-search');
    const countEl = ov.querySelector('#tc-mem-count');
    const addBtn = ov.querySelector('[data-tc-add]');
    const modeBtns = ov.querySelectorAll('.tc-pick-mode');
    const selected = new Set();
    let memberUids = new Set();
    let pickMode = 'name';   // 'name' (поиск по ростеру) | 'org' (дерево структуры)

    function renderMembers(items) {
      if (!items.length) { memListEl.innerHTML = `<div class="tc-picker-empty">Нет участников</div>`; return; }
      const createdBy = ch?.created_by;
      const meUid = state.me?.uid;
      memListEl.innerHTML = items.map(m => {
        const uid = m.user_id;
        const isCreator = uid === createdBy;
        const isMe = uid === meUid;
        const isAdminRole = m.role === 'admin' || isCreator;
        const label = userLabel(uid) + (isMe ? ' (вы)' : '');
        let badge = '';
        if (isCreator) badge = `<span class="tc-mem-badge admin">создатель</span>`;
        else if (isAdminRole) badge = `<span class="tc-mem-badge admin">админ</span>`;
        let actions = '';
        if (iAmAdmin && !isMe && !isCreator) {
          const roleBtn = isAdminRole
            ? `<button class="tc-mem-admin" data-role-set="member" data-uid="${escapeHtml(uid)}">Снять админа</button>`
            : `<button class="tc-mem-admin" data-role-set="admin" data-uid="${escapeHtml(uid)}">Сделать админом</button>`;
          const rmBtn = `<button class="tc-mem-rm" data-rm="${escapeHtml(uid)}" title="Убрать из чата">✕</button>`;
          actions = `<div class="tc-mem-actions">${roleBtn}${rmBtn}</div>`;
        }
        return `<div class="tc-mem-row">
          ${avatarHtml('tc-picker-ava', uid, userLabel(uid).slice(0, 2).toUpperCase(), userColor(uid))}
          <div class="tc-picker-meta"><div class="tc-picker-name">${escapeHtml(label)} ${badge}</div></div>
          ${actions}
        </div>`;
      }).join('');
      memListEl.querySelectorAll('[data-rm]').forEach(btn => {
        btn.onclick = async () => {
          const uid = btn.getAttribute('data-rm');
          if (!confirm('Убрать «' + userLabel(uid) + '» из чата?')) return;
          btn.disabled = true;
          try {
            await api(`/api/chat/channels/${channelId}/members/${encodeURIComponent(uid)}`, { method: 'DELETE' });
            await loadMembers();
            await loadChannels();
            renderMainHead();
          } catch (e) { btn.disabled = false; alert(e.message); }
        };
      });
      memListEl.querySelectorAll('[data-role-set]').forEach(btn => {
        btn.onclick = async () => {
          const uid = btn.getAttribute('data-uid');
          const role = btn.getAttribute('data-role-set');
          btn.disabled = true;
          try {
            await api(`/api/chat/channels/${channelId}/members/${encodeURIComponent(uid)}/role`, {
              method: 'POST', body: JSON.stringify({ role }),
            });
            await loadMembers();
          } catch (e) { btn.disabled = false; alert(e.message); }
        };
      });
    }

    function renderPicker() {
      if (!iAmAdmin || !pickerEl) return;
      const roster = getRoster().filter(p => !memberUids.has(p.uid));
      const q = searchEl.value.trim().toLowerCase();
      const filtered = q ? roster.filter(p => p.label.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q)) : roster;
      if (!filtered.length) {
        pickerEl.innerHTML = `<div class="tc-picker-empty">${roster.length === 0 ? 'Все уже добавлены' : 'Никого не найдено'}</div>`;
        return;
      }
      pickerEl.innerHTML = filtered.map(p => pickerRowHtml(p, { multi: true })).join('');
      pickerEl.querySelectorAll('.tc-picker-row').forEach(row => {
        const uid = row.getAttribute('data-uid');
        const cb = row.querySelector('.tc-picker-check');
        cb.checked = selected.has(uid);
        if (selected.has(uid)) row.classList.add('selected');
        row.onclick = (e) => {
          if (e.target !== cb) cb.checked = !cb.checked;
          if (cb.checked) { selected.add(uid); row.classList.add('selected'); }
          else { selected.delete(uid); row.classList.remove('selected'); }
          countEl.textContent = 'Выбрано: ' + selected.size;
          addBtn.disabled = selected.size === 0;
        };
      });
    }

    // Дерево структуры: галка на отделе → добавить всех его людей (рекурсивно);
    // ✕ N → пакетно убрать тех из них, кто уже в чате (кроме создателя).
    function renderOrgPicker() {
      if (!iAmAdmin || !pickerEl) return;
      const nodes = _orgNodes || [];
      if (!nodes.length) {
        pickerEl.innerHTML = `<div class="tc-picker-empty">${_orgNodes === null ? 'Загрузка структуры…' : 'Структура компании не заполнена'}</div>`;
        return;
      }
      pickerEl.innerHTML = nodes.map(n => {
        const total = n.uids.length;
        const inChat = n.uids.filter(u => memberUids.has(u)).length;
        const toAdd = n.uids.filter(u => !memberUids.has(u)).length;
        const allSel = toAdd > 0 && n.uids.every(u => memberUids.has(u) || selected.has(u));
        const pad = 11 + n.depth * 16;
        const rmBtn = inChat > 0
          ? `<button class="tc-org-rm" data-org-rm="${escapeHtml(n.id)}" title="Убрать всех из чата">✕ ${inChat}</button>`
          : '';
        return `<div class="tc-org-row" style="padding-left:${pad}px">
          <input type="checkbox" class="tc-picker-check" data-org-add="${escapeHtml(n.id)}" ${allSel ? 'checked' : ''} ${toAdd === 0 ? 'disabled' : ''}>
          <div class="tc-org-name">${escapeHtml(n.name)}</div>
          <span class="tc-org-cnt">${inChat}/${total} в чате</span>
          ${rmBtn}
        </div>`;
      }).join('');
      pickerEl.querySelectorAll('[data-org-add]').forEach(cb => {
        cb.onclick = (e) => {
          e.stopPropagation();
          const node = (_orgNodes || []).find(n => n.id === cb.getAttribute('data-org-add'));
          if (!node) return;
          const addable = node.uids.filter(u => !memberUids.has(u));
          if (cb.checked) addable.forEach(u => selected.add(u));
          else addable.forEach(u => selected.delete(u));
          countEl.textContent = 'Выбрано: ' + selected.size;
          addBtn.disabled = selected.size === 0;
        };
      });
      pickerEl.querySelectorAll('[data-org-rm]').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const node = (_orgNodes || []).find(n => n.id === btn.getAttribute('data-org-rm'));
          if (!node) return;
          const rmUids = node.uids.filter(u => memberUids.has(u) && u !== ch?.created_by);
          if (!rmUids.length) { alert('В этом отделе некого убирать (или остался только создатель).'); return; }
          if (!confirm(`Убрать ${rmUids.length} чел. из «${node.name}» из этого чата?`)) return;
          btn.disabled = true;
          try {
            await api(`/api/chat/channels/${channelId}/members/remove`, { method: 'POST', body: JSON.stringify({ user_ids: rmUids }) });
            await loadMembers();
            await loadChannels();
            renderMainHead();
          } catch (err) { btn.disabled = false; alert(err.message); }
        };
      });
    }

    function renderActivePicker() {
      if (pickMode === 'org') renderOrgPicker();
      else renderPicker();
    }

    async function loadMembers() {
      try {
        const d = await api(`/api/chat/channels/${channelId}/members`);
        memberUids = new Set((d.items || []).map(m => m.user_id));
        renderMembers(d.items || []);
        renderActivePicker();
      } catch (e) {
        memListEl.innerHTML = `<div class="tc-picker-empty">${escapeHtml(e.message)}</div>`;
      }
    }

    // Переключение режима пикера: По имени ↔ По структуре.
    modeBtns.forEach(b => {
      b.onclick = () => {
        const mode = b.getAttribute('data-mode');
        if (mode === pickMode) return;
        pickMode = mode;
        modeBtns.forEach(x => x.classList.toggle('active', x === b));
        if (searchEl) searchEl.style.display = (mode === 'name') ? '' : 'none';
        if (mode === 'org' && _orgNodes === null) loadOrgStructure().then(() => { if (pickMode === 'org') renderActivePicker(); });
        renderActivePicker();
      };
    });

    if (searchEl) searchEl.oninput = renderPicker;
    if (addBtn) addBtn.onclick = async () => {
      const user_ids = Array.from(selected);
      if (!user_ids.length) return;
      addBtn.disabled = true;
      try {
        await api(`/api/chat/channels/${channelId}/members`, { method: 'POST', body: JSON.stringify({ user_ids }) });
        selected.clear();
        countEl.textContent = 'Выбрано: 0';
        await loadMembers();
        await loadChannels();
        renderMainHead();
      } catch (e) { addBtn.disabled = false; alert(e.message); }
    };
    ov.querySelector('[data-tc-close]').onclick = () => ov.remove();
    loadMembers();
    // Обновить справочник из D1 и перерисовать пикер, когда подъедет.
    if (iAmAdmin) {
      loadRoster().then(() => renderActivePicker());
      loadOrgStructure().then(() => { if (pickMode === 'org') renderActivePicker(); });
    }
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
          <button class="tc-hbtn" id="tc-archive-toggle" title="Архив чатов">🗄</button>
          <button class="tc-hbtn" id="tc-new-ch-btn" title="Новый чат">＋</button>
        </div>
        <div class="tc-search"><span class="tc-search-ic">🔍</span><input id="tc-ch-search" placeholder="Поиск чата" autocomplete="off"></div>
        <div class="tc-tabs">
          <button class="tc-tab active" data-tab="all">Все</button>
          <button class="tc-tab" data-tab="channel">Группы</button>
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

    el.querySelector('#tc-new-ch-btn').onclick = openNewChatModal;

    const archToggle = el.querySelector('#tc-archive-toggle');
    if (archToggle) archToggle.onclick = () => {
      state.showArchived = !state.showArchived;
      archToggle.style.background = state.showArchived ? 'var(--tc-ac,#2563eb)' : '';
      archToggle.style.color = state.showArchived ? '#fff' : '';
      const h = el.querySelector('.tc-sidebar-head h3');
      if (h) h.textContent = state.showArchived ? 'Архив' : 'Чаты';
      state.activeChannelId = null;
      loadChannels();
    };

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
    // Прогреть токен (для URL файлов) + держать свежим (Firebase токен живёт ~1ч).
    getAuthToken().catch(() => {});
    if (!state._tokenTimer) {
      state._tokenTimer = setInterval(() => getAuthToken().catch(() => {}), 25 * 60 * 1000);
    }
    renderMainHead();
    renderMessages();
    renderComposer();
    loadChannels();
    loadRoster();   // прогреть справочник сотрудников для пикеров
    if (!state.ws || state.ws.readyState >= 2) connectWs();
    // Один раз вешаем слушатели «проснулись» — реконнект при возврате на вкладку,
    // фокусе окна и восстановлении сети. Критично для мобильных (iOS усыпляет WS).
    if (!state._wakeListeners) {
      state._wakeListeners = true;
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ensureWsAlive(); });
      window.addEventListener('focus', ensureWsAlive);
      window.addEventListener('online', ensureWsAlive);
    }
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

  window.TeamChat = { mount, suspend, resume, openDmWith, openChannel: openChannelExternal };
})();
