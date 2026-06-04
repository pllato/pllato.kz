// ════════════════════════════════════════════════════════════════════════
// Team chat — frontend module (PR Phase B)
// Связь: WORKER (pllato-elc-worker.uurraa.workers.dev) /api/chat/* + /api/ws/user
// Экспорт: window.TeamChat = { mount, suspend, resume, openDmWith }
//
// Зависимости от родителя:
//   - window.currentUser = {firebaseUid, canonicalUid, email, profile:{name,...}}
//   - window.WORKER_BASE_URL (для REST)
//   - firebase.auth() для getIdToken() (для Bearer + WS ?token=)
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
    usersIndex: {},           // uid → {name, email} (для рендера имён)
    ws: null,
    wsReconnectAttempts: 0,
    pingTimer: null,
    mounted: false,
    suspended: false,
    rootEl: null,
    composerDraft: '',
    replyToMsg: null,         // {id, text, user_id} если отвечаем
    editingMsg: null,         // {id, text} если редактируем
  };

  // ── Auth token (родитель отдаёт модульный Firebase через window.fbAuth;
  //    старый compat window.firebase оставлен как fallback) ───────────────
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

  // ── User name resolver (использует org structure + users из родителя) ──
  // Родитель отдаёт карту window.usersState.users (uid → {name,lastName,email,photo}).
  function parentUser(uid) {
    return window.usersState?.users?.[uid] || window.usersState?.byUid?.[uid] || null;
  }

  function userLabel(uid) {
    if (!uid) return '—';
    if (uid === state.me?.uid) return state.me?.name || 'Я';
    const u = parentUser(uid);
    if (u) {
      return [u.lastName, u.name].filter(Boolean).join(' ').trim() || u.email || uid.slice(0, 8);
    }
    return state.usersIndex[uid]?.name || uid.slice(0, 8);
  }

  function userPhoto(uid) {
    if (!uid) return '';
    const u = parentUser(uid);
    return (u && (u.photo || u.photoURL)) || '';
  }

  function userAvatar(uid) {
    const label = userLabel(uid);
    return label.slice(0, 2).toUpperCase();
  }

  // Возвращает <div class=cls> с фото (если есть) либо инициалы на цветном фоне.
  function avatarHtml(cls, uid, fallbackText, bg) {
    const photo = userPhoto(uid);
    if (photo) {
      return `<div class="${cls}" style="background:transparent;overflow:hidden"><img src="${escapeHtml(photo)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"></div>`;
    }
    return `<div class="${cls}" style="background:${bg}">${escapeHtml(fallbackText)}</div>`;
  }

  function userColor(uid) {
    // Hash uid → стабильный цвет
    let h = 0;
    for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
    const hues = [200, 250, 310, 0, 30, 90, 150, 170, 280];
    return `hsl(${hues[h % hues.length]}, 60%, 55%)`;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
  }

  function pluralize(n, a, b, c) {
    n = Math.abs(n) % 100; const n1 = n % 10;
    if (n > 10 && n < 20) return c;
    if (n1 > 1 && n1 < 5) return b;
    if (n1 === 1) return a;
    return c;
  }

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
        try {
          const msg = JSON.parse(ev.data);
          handleWsMessage(msg);
        } catch (e) { console.warn('[TeamChat] WS parse:', e); }
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
      case 'message_new':
        onMessageNew(msg.message);
        break;
      case 'message_edited':
        onMessageEdited(msg);
        break;
      case 'message_deleted':
        onMessageDeleted(msg);
        break;
      case 'reaction_changed':
        onReactionChanged(msg);
        break;
      case 'channel_added':
        loadChannels();
        break;
      case 'channel_removed':
        loadChannels();
        break;
      case 'read':
        // другой юзер прочитал — обновить indicators (минимум: noop пока)
        break;
      case 'notification':
        // глобальное уведомление портала — пробрасываем в team.html (колокольчик)
        try { window.dispatchEvent(new CustomEvent('elc:notification', { detail: msg.notification || msg })); } catch (e) {}
        break;
    }
  }

  function onMessageNew(m) {
    // Обновить unread count на канале, поднять канал наверх
    const ch = state.channels.find(c => c.id === m.channel_id);
    if (ch) {
      ch.last_message_text = m.text || (m.type !== 'text' ? `[${m.type}]` : '');
      ch.last_message_at = m.created_at;
      if (m.channel_id !== state.activeChannelId && m.user_id !== state.me.uid) {
        ch.unread_count = (ch.unread_count || 0) + 1;
      }
    }
    // Если активный канал — добавить и проскроллить
    if (m.channel_id === state.activeChannelId) {
      state.messages.push(m);
      renderMessages();
      markAsRead(m.id);
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
      updateNavBadge();
    } catch (e) { console.error('loadChannels:', e); }
  }

  async function loadMessages(channelId) {
    try {
      const d = await api(`/api/chat/channels/${channelId}/messages?limit=50`);
      state.messages = d.items || [];
      renderMessages();
      // Mark as read — последнее сообщение
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg) markAsRead(lastMsg.id);
    } catch (e) { console.error('loadMessages:', e); }
  }

  async function markAsRead(lastMessageId) {
    if (!state.activeChannelId || !lastMessageId) return;
    try {
      await api(`/api/chat/channels/${state.activeChannelId}/read`, {
        method: 'POST',
        body: JSON.stringify({ last_read_message_id: lastMessageId }),
      });
      // локально обнуляем unread
      const ch = state.channels.find(c => c.id === state.activeChannelId);
      if (ch) { ch.unread_count = 0; renderChannelList(); updateNavBadge(); }
    } catch {}
  }

  function updateNavBadge() {
    const total = state.channels.reduce((s, c) => s + (c.unread_count || 0), 0);
    const b = document.getElementById('team-chat-nav-badge');
    if (b) {
      if (total > 0) { b.style.display = 'inline-flex'; b.textContent = total; }
      else b.style.display = 'none';
    }
  }

  // ── UI Rendering ───────────────────────────────────────────────────────
  function ensureStyles() {
    if (document.getElementById('team-chat-styles')) return;
    const css = `
      .tc-root { display:grid; grid-template-columns: 280px 1fr; height:100%; font-family:inherit; }
      .tc-sidebar { border-right:1px solid var(--b1); display:flex; flex-direction:column; background:var(--bg1); }
      .tc-sidebar-head { padding:12px 16px; border-bottom:1px solid var(--b1); display:flex; gap:8px; align-items:center; }
      .tc-sidebar-head h3 { margin:0; font-size:14px; flex:1; color:var(--t1) }
      .tc-search { padding:10px 16px; border-bottom:1px solid var(--b1); }
      .tc-search input { width:100%; padding:6px 10px; border:1px solid var(--b1); border-radius:6px; background:var(--bg2); color:var(--t1); font-size:13px }
      .tc-channels { flex:1; overflow-y:auto }
      .tc-channel { padding:10px 16px; cursor:pointer; display:flex; gap:10px; align-items:center; border-bottom:1px solid var(--b1) }
      .tc-channel:hover { background:var(--bg2) }
      .tc-channel.active { background:var(--acbg); }
      .tc-channel-av { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:600; flex-shrink:0 }
      .tc-channel-body { flex:1; min-width:0 }
      .tc-channel-name { font-size:13px; font-weight:600; color:var(--t1); display:flex; align-items:center; gap:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
      .tc-channel-last { font-size:11px; color:var(--t3); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:2px }
      .tc-channel-unread { background:#22c55e; color:#fff; font-size:10px; padding:1px 6px; border-radius:8px; font-weight:700 }
      .tc-channel-time { font-size:10px; color:var(--t3); flex-shrink:0 }
      .tc-main { display:flex; flex-direction:column; background:var(--bg1) }
      .tc-main-head { padding:14px 18px; border-bottom:1px solid var(--b1); display:flex; align-items:center; gap:10px }
      .tc-main-head h3 { margin:0; font-size:14px; color:var(--t1); flex:1 }
      .tc-msgs { flex:1; overflow-y:auto; padding:14px 18px; display:flex; flex-direction:column; gap:8px }
      .tc-msg { display:flex; gap:10px; align-items:flex-start; max-width:75%; padding:6px 0 }
      .tc-msg.own { align-self:flex-end; flex-direction:row-reverse }
      .tc-msg-av { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:600; flex-shrink:0 }
      .tc-msg-bubble { background:var(--bg2); padding:8px 12px; border-radius:12px; max-width:100% }
      .tc-msg.own .tc-msg-bubble { background:#22c55e; color:#fff }
      .tc-msg-author { font-size:11px; font-weight:700; margin-bottom:2px; opacity:0.8 }
      .tc-msg-text { font-size:13px; line-height:1.4; word-wrap:break-word; white-space:pre-wrap }
      .tc-msg-time { font-size:10px; opacity:0.6; margin-top:3px; text-align:right }
      .tc-msg-deleted { font-style:italic; opacity:0.6 }
      .tc-msg-edited { font-size:9px; opacity:0.5; margin-left:6px }
      .tc-msg-actions { display:none; gap:4px; margin-top:4px }
      .tc-msg:hover .tc-msg-actions { display:flex }
      .tc-msg-btn { background:transparent; border:1px solid transparent; padding:2px 6px; border-radius:4px; font-size:11px; cursor:pointer; color:var(--t2) }
      .tc-msg-btn:hover { background:rgba(0,0,0,0.05); border-color:var(--b1) }
      .tc-msg.own .tc-msg-btn:hover { background:rgba(255,255,255,0.15) }
      .tc-msg-reply { background:rgba(0,0,0,0.05); border-left:3px solid #22c55e; padding:4px 8px; border-radius:4px; font-size:11px; margin-bottom:4px; opacity:0.8 }
      .tc-msg.own .tc-msg-reply { background:rgba(255,255,255,0.15); border-left-color:#fff }
      .tc-reactions { display:flex; gap:4px; flex-wrap:wrap; margin-top:4px }
      .tc-react { background:rgba(0,0,0,0.06); border:1px solid var(--b1); padding:1px 6px; border-radius:10px; font-size:11px; cursor:pointer; display:inline-flex; gap:3px; align-items:center }
      .tc-react.own { background:rgba(34,197,94,0.15); border-color:#22c55e }
      .tc-react:hover { background:rgba(0,0,0,0.1) }
      .tc-composer { padding:12px 16px; border-top:1px solid var(--b1); background:var(--bg2) }
      .tc-composer-banner { background:rgba(34,197,94,0.1); border:1px solid #22c55e; padding:6px 10px; border-radius:5px; margin-bottom:8px; font-size:11px; display:flex; align-items:center; gap:8px }
      .tc-composer-banner button { background:none; border:none; cursor:pointer; font-size:14px; color:var(--t3); padding:0 4px }
      .tc-composer-row { display:flex; gap:8px; align-items:flex-end }
      .tc-composer textarea { flex:1; min-height:36px; max-height:120px; padding:8px 12px; border:1px solid var(--b1); border-radius:6px; background:var(--bg1); color:var(--t1); font-size:13px; font-family:inherit; resize:none }
      .tc-composer-actions { display:flex; gap:6px }
      .tc-btn-icon { width:36px; height:36px; border:1px solid var(--b1); background:var(--bg1); border-radius:6px; cursor:pointer; font-size:16px; color:var(--t2); display:flex; align-items:center; justify-content:center }
      .tc-btn-icon:hover { background:var(--bg3) }
      .tc-btn-send { background:#22c55e; color:#fff; border:none }
      .tc-btn-send:hover { background:#16a34a }
      .tc-empty { flex:1; display:flex; align-items:center; justify-content:center; color:var(--t3); font-size:13px }
      .tc-modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:1000; display:flex; align-items:center; justify-content:center }
      .tc-modal { background:var(--bg1); border-radius:8px; padding:20px 24px; min-width:380px; max-width:500px; max-height:80vh; overflow:auto }
      .tc-modal h3 { margin:0 0 14px }
      .tc-modal label { display:block; margin-bottom:10px; font-size:13px; color:var(--t2) }
      .tc-modal input, .tc-modal textarea, .tc-modal select { width:100%; padding:8px 10px; border:1px solid var(--b1); border-radius:5px; background:var(--bg2); color:var(--t1); font-size:13px; font-family:inherit; margin-top:4px }
      .tc-modal-foot { display:flex; gap:8px; justify-content:flex-end; margin-top:16px }
      .tc-modal-foot button { padding:8px 16px; border-radius:5px; border:1px solid var(--b1); background:var(--bg2); cursor:pointer; font-size:13px }
      .tc-modal-foot button.primary { background:#22c55e; color:#fff; border-color:#22c55e }
      .tc-file-att { display:inline-block; padding:6px 10px; background:rgba(0,0,0,0.05); border-radius:5px; margin-top:4px; font-size:11px; text-decoration:none; color:inherit }
      .tc-file-att:hover { background:rgba(0,0,0,0.1) }
      .tc-img-att { max-width:100%; max-height:300px; border-radius:6px; margin-top:4px; cursor:pointer; display:block }
      .tc-picker-search { width:100%; padding:8px 10px; border:1px solid var(--b1); border-radius:5px; background:var(--bg2); color:var(--t1); font-size:13px; font-family:inherit; margin-top:4px; box-sizing:border-box }
      .tc-picker-list { margin-top:8px; max-height:320px; overflow-y:auto; border:1px solid var(--b1); border-radius:6px; background:var(--bg2) }
      .tc-picker-row { display:flex; gap:10px; align-items:center; padding:8px 10px; cursor:pointer; border-bottom:1px solid var(--b1) }
      .tc-picker-row:last-child { border-bottom:none }
      .tc-picker-row:hover { background:var(--bg3) }
      .tc-picker-row.selected { background:rgba(34,197,94,0.12) }
      .tc-picker-ava { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:600; flex-shrink:0 }
      .tc-picker-meta { flex:1; min-width:0 }
      .tc-picker-name { font-size:13px; color:var(--t1); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
      .tc-picker-sub { font-size:11px; color:var(--t3); overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
      .tc-picker-check { width:18px; height:18px; flex-shrink:0; accent-color:#22c55e; cursor:pointer }
      .tc-picker-empty { padding:20px; text-align:center; color:var(--t3); font-size:12px }
      .tc-picker-count { font-size:11px; color:var(--t2); margin-top:6px }
    `;
    const st = document.createElement('style');
    st.id = 'team-chat-styles';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function channelDisplayName(ch) {
    if (ch.type === 'dm') return userLabel(ch.other_user_id);
    return ch.name || '(без имени)';
  }

  function channelAvatarBg(ch) {
    if (ch.type === 'dm') return userColor(ch.other_user_id || '');
    return '#22c55e';
  }

  function channelAvatarText(ch) {
    if (ch.type === 'dm') return userAvatar(ch.other_user_id || '');
    return ch.type === 'group' ? '#' : '#';
  }

  function renderChannelList() {
    const root = state.rootEl;
    if (!root) return;
    const listEl = root.querySelector('.tc-channels');
    if (!listEl) return;
    if (state.channels.length === 0) {
      listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--t3);font-size:12px">Нет каналов.<br><br>Создай первый ➕</div>';
      return;
    }
    listEl.innerHTML = state.channels.map(ch => {
      const active = ch.id === state.activeChannelId ? ' active' : '';
      const unread = (ch.unread_count > 0) ? `<span class="tc-channel-unread">${ch.unread_count}</span>` : '';
      const time = ch.last_message_at ? formatTime(ch.last_message_at) : '';
      const last = ch.last_message_text || '<span style="color:var(--t3);font-style:italic">пусто</span>';
      const typeIcon = ch.type === 'dm' ? '' : (ch.type === 'group' ? '🔒' : '#');
      return `<div class="tc-channel${active}" data-ch-id="${ch.id}">
        ${avatarHtml('tc-channel-av', ch.type === 'dm' ? ch.other_user_id : null, channelAvatarText(ch), channelAvatarBg(ch))}
        <div class="tc-channel-body">
          <div class="tc-channel-name">
            ${ch.type !== 'dm' && typeIcon ? `<span style="font-size:10px;opacity:0.6">${typeIcon}</span>` : ''}
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis">${escapeHtml(channelDisplayName(ch))}</span>
            <span class="tc-channel-time">${time}</span>
          </div>
          <div class="tc-channel-last">${escapeHtml(last)} ${unread}</div>
        </div>
      </div>`;
    }).join('');
    listEl.querySelectorAll('.tc-channel').forEach(el => {
      el.onclick = () => openChannel(el.dataset.chId);
    });
  }

  function renderMessages() {
    const root = state.rootEl;
    if (!root) return;
    const msgsEl = root.querySelector('.tc-msgs');
    if (!msgsEl) return;
    if (!state.activeChannelId) {
      msgsEl.innerHTML = '<div class="tc-empty">Выбери канал слева</div>';
      return;
    }
    if (state.messages.length === 0) {
      msgsEl.innerHTML = '<div class="tc-empty">Сообщений нет. Напиши первое ↓</div>';
      return;
    }
    const wasAtBottom = msgsEl.scrollTop + msgsEl.clientHeight >= msgsEl.scrollHeight - 50;
    msgsEl.innerHTML = state.messages.map(m => renderMessage(m)).join('');
    if (wasAtBottom) msgsEl.scrollTop = msgsEl.scrollHeight;
    // Click handlers для actions
    msgsEl.querySelectorAll('[data-msg-act]').forEach(b => {
      b.onclick = () => onMsgAction(b.dataset.msgAct, b.dataset.msgId);
    });
    msgsEl.querySelectorAll('[data-react-add]').forEach(b => {
      b.onclick = () => addReactionPrompt(b.dataset.reactAdd);
    });
    msgsEl.querySelectorAll('[data-react-toggle]').forEach(b => {
      b.onclick = () => toggleReaction(b.dataset.reactToggle, b.dataset.emoji, b.dataset.own === '1');
    });
  }

  function renderMessage(m) {
    if (m.deleted_at) {
      return `<div class="tc-msg ${m.user_id === state.me.uid ? 'own' : ''}">
        ${avatarHtml('tc-msg-av', m.user_id, userAvatar(m.user_id), userColor(m.user_id))}
        <div class="tc-msg-bubble"><div class="tc-msg-text tc-msg-deleted">Сообщение удалено</div></div>
      </div>`;
    }
    const own = m.user_id === state.me.uid;
    let body = '';
    // Reply preview
    if (m.reply_to) {
      const replyTo = state.messages.find(x => x.id === m.reply_to);
      if (replyTo) {
        body += `<div class="tc-msg-reply"><b>${escapeHtml(userLabel(replyTo.user_id))}:</b> ${escapeHtml((replyTo.text || '[медиа]').slice(0, 80))}</div>`;
      }
    }
    // Text
    if (m.text) {
      // Parse URLs simple
      const linkified = escapeHtml(m.text).replace(/(https?:\/\/[^\s<>"]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">$1</a>');
      body += `<div class="tc-msg-text">${linkified}</div>`;
    }
    // File attachment
    if (m.file_key) {
      const meta = m.file_meta ? (typeof m.file_meta === 'string' ? JSON.parse(m.file_meta) : m.file_meta) : {};
      const fileUrl = `${WORKER}/api/chat/files/${encodeURIComponent(m.file_key)}`;
      if (m.type === 'image' || meta.mime?.startsWith('image/')) {
        body += `<img class="tc-img-att" src="${fileUrl}" alt="${escapeHtml(meta.name || '')}" onclick="window.open('${fileUrl}', '_blank')">`;
      } else {
        body += `<a class="tc-file-att" href="${fileUrl}" download="${escapeHtml(meta.name || 'file')}" target="_blank">📎 ${escapeHtml(meta.name || 'файл')} ${meta.size ? `<span style="opacity:0.6">(${Math.round(meta.size / 1024)} КБ)</span>` : ''}</a>`;
      }
    }
    // Reactions
    let reactionsHtml = '';
    if (m.reactions && m.reactions.length) {
      reactionsHtml = '<div class="tc-reactions">';
      for (const r of m.reactions) {
        const isOwn = r.users.includes(state.me.uid);
        reactionsHtml += `<button class="tc-react${isOwn ? ' own' : ''}" data-react-toggle="${m.id}" data-emoji="${escapeHtml(r.emoji)}" data-own="${isOwn ? '1' : '0'}">${escapeHtml(r.emoji)} ${r.users.length}</button>`;
      }
      reactionsHtml += '</div>';
    }
    const author = own ? '' : `<div class="tc-msg-author" style="color:${userColor(m.user_id)}">${escapeHtml(userLabel(m.user_id))}</div>`;
    const editedTag = m.edited_at ? `<span class="tc-msg-edited">(изменено)</span>` : '';
    const time = formatTime(m.created_at);

    return `<div class="tc-msg ${own ? 'own' : ''}">
      ${avatarHtml('tc-msg-av', m.user_id, userAvatar(m.user_id), userColor(m.user_id))}
      <div class="tc-msg-bubble">
        ${author}
        ${body}
        ${reactionsHtml}
        <div class="tc-msg-time">${time} ${editedTag}</div>
        <div class="tc-msg-actions">
          <button class="tc-msg-btn" data-msg-act="reply" data-msg-id="${m.id}" title="Ответить">↩</button>
          <button class="tc-msg-btn" data-msg-act="react" data-msg-id="${m.id}" title="Реакция">😀</button>
          ${own ? `<button class="tc-msg-btn" data-msg-act="edit" data-msg-id="${m.id}" title="Изменить">✏</button>` : ''}
          ${own ? `<button class="tc-msg-btn" data-msg-act="delete" data-msg-id="${m.id}" title="Удалить">🗑</button>` : ''}
        </div>
      </div>
    </div>`;
  }

  function renderMainHead() {
    const root = state.rootEl;
    if (!root) return;
    const head = root.querySelector('.tc-main-head h3');
    if (!head) return;
    if (!state.activeChannelId) { head.textContent = ''; return; }
    const ch = state.channels.find(c => c.id === state.activeChannelId);
    if (!ch) return;
    head.innerHTML = `${escapeHtml(channelDisplayName(ch))} ${ch.type === 'channel' ? '<span style="font-size:10px;opacity:0.6;font-weight:normal">канал</span>' : ch.type === 'group' ? '<span style="font-size:10px;opacity:0.6;font-weight:normal">группа</span>' : ''}`;
  }

  function renderComposer() {
    const root = state.rootEl;
    if (!root) return;
    const c = root.querySelector('.tc-composer');
    if (!c) return;
    let banner = '';
    if (state.replyToMsg) {
      banner = `<div class="tc-composer-banner">↩ Ответ: <b>${escapeHtml(userLabel(state.replyToMsg.user_id))}</b>: <span style="opacity:0.7">${escapeHtml((state.replyToMsg.text || '[медиа]').slice(0, 60))}</span><button data-banner-cancel="reply">×</button></div>`;
    } else if (state.editingMsg) {
      banner = `<div class="tc-composer-banner">✏ Редактируем сообщение<button data-banner-cancel="edit">×</button></div>`;
    }
    c.innerHTML = `${banner}
      <div class="tc-composer-row">
        <textarea id="tc-composer-input" placeholder="Сообщение...">${escapeHtml(state.composerDraft)}</textarea>
        <div class="tc-composer-actions">
          <button class="tc-btn-icon" title="Прикрепить файл" id="tc-attach-btn">📎</button>
          <button class="tc-btn-icon tc-btn-send" title="Отправить (Enter)" id="tc-send-btn">➤</button>
        </div>
      </div>
      <input type="file" id="tc-file-input" style="display:none">
    `;
    const ta = document.getElementById('tc-composer-input');
    ta.oninput = () => { state.composerDraft = ta.value; autoresizeTa(ta); };
    ta.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendCurrent();
      }
    };
    autoresizeTa(ta);
    ta.focus();
    document.getElementById('tc-send-btn').onclick = sendCurrent;
    document.getElementById('tc-attach-btn').onclick = () => document.getElementById('tc-file-input').click();
    document.getElementById('tc-file-input').onchange = onFileSelected;
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
    ta.style.height = Math.min(120, ta.scrollHeight) + 'px';
  }

  async function sendCurrent() {
    const text = state.composerDraft.trim();
    if (!text && !state.editingMsg) return;
    if (state.editingMsg) {
      try {
        await api(`/api/chat/messages/${state.editingMsg.id}/edit`, { method: 'POST', body: JSON.stringify({ text }) });
        state.editingMsg = null; state.composerDraft = ''; renderComposer();
      } catch (e) { alert('Ошибка: ' + e.message); }
      return;
    }
    if (!state.activeChannelId) return;
    const body = { text };
    if (state.replyToMsg) body.reply_to = state.replyToMsg.id;
    try {
      await api(`/api/chat/channels/${state.activeChannelId}/messages`, { method: 'POST', body: JSON.stringify(body) });
      state.composerDraft = ''; state.replyToMsg = null;
      renderComposer();
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
    if (action === 'reply') { state.replyToMsg = m; state.editingMsg = null; renderComposer(); }
    if (action === 'edit')  { state.editingMsg = m; state.replyToMsg = null; state.composerDraft = m.text || ''; renderComposer(); }
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
    renderChannelList();
    renderMainHead();
    renderComposer();
    await loadMessages(channelId);
  }

  // ── Roster (справочник сотрудников из родителя team.html) ───────────────
  // window.usersState.byUid: uid → { uid, name, lastName, email }.
  function getRoster() {
    const byUid = window.usersState?.byUid || {};
    const meUid = state.me?.uid;
    const arr = [];
    for (const [uid, u] of Object.entries(byUid)) {
      if (uid === meUid) continue;
      const label = [u.lastName, u.name].filter(Boolean).join(' ').trim() || u.email || uid.slice(0, 8);
      arr.push({ uid, label, sub: u.email || '' });
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
      <div class="tc-picker-ava" style="background:${userColor(p.uid)}">${escapeHtml(p.label.slice(0, 2).toUpperCase())}</div>
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
    ov.innerHTML = `<div class="tc-modal" onclick="event.stopPropagation()">
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
    ov.innerHTML = `<div class="tc-modal" onclick="event.stopPropagation()">
      <h3>✉ Личная переписка</h3>
      <label>Выбери сотрудника
        <input class="tc-picker-search" id="tc-dm-search" placeholder="🔍 поиск по имени…" autofocus>
      </label>
      <div class="tc-picker-list" id="tc-dm-list"></div>
      <div class="tc-modal-foot">
        <button data-tc-cancel>Отмена</button>
      </div>
    </div>`;
    document.body.appendChild(ov);

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
      <div class="tc-sidebar">
        <div class="tc-sidebar-head">
          <h3>💬 Каналы</h3>
          <button class="tc-btn-icon" id="tc-new-ch-btn" title="Новый канал" style="width:28px;height:28px;font-size:14px">➕</button>
          <button class="tc-btn-icon" id="tc-new-dm-btn" title="Новый DM" style="width:28px;height:28px;font-size:14px">✉</button>
        </div>
        <div class="tc-channels"></div>
      </div>
      <div class="tc-main">
        <div class="tc-main-head"><h3></h3></div>
        <div class="tc-msgs"></div>
        <div class="tc-composer"></div>
      </div>
    </div>`;
    document.getElementById('tc-new-ch-btn').onclick = openNewChannelModal;
    document.getElementById('tc-new-dm-btn').onclick = openNewDmModal;

    state.mounted = true;
    state.suspended = false;
    renderMessages();
    renderComposer();
    loadChannels();
    if (!state.ws || state.ws.readyState >= 2) connectWs();
  }

  function suspend() {
    state.suspended = true;
    disconnectWs();
  }
  function resume() {
    state.suspended = false;
    if (!state.ws || state.ws.readyState >= 2) connectWs();
    loadChannels();
  }

  function openDmWith(uid) {
    // Внешний API — открыть DM с юзером (вызывается из других модулей)
    api('/api/chat/dm', { method: 'POST', body: JSON.stringify({ user_id: uid }) })
      .then(d => { loadChannels().then(() => openChannel(d.channel_id)); })
      .catch(e => alert(e.message));
  }

  window.TeamChat = { mount, suspend, resume, openDmWith };
})();
