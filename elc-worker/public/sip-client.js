// ─────────────────────────────────────────────────────────────────────────────
// sip-client.js — shared SIP/WebRTC client для ELC team.html и Aminamed CRM.
//
// Источник правды: pllato/pllato.kz/elc-worker/public/sip-client.js
// Хостится через Cloudflare Worker pllato-elc-worker как static asset:
//   https://pllato-elc-worker.uurraa.workers.dev/sip-client.js
//
// Импорт:
//   import { createSipClient } from 'https://pllato-elc-worker.uurraa.workers.dev/sip-client.js';
//
// Использование:
//   const sip = await createSipClient({
//     tokenEndpoint:     'https://pllato-elc-worker.uurraa.workers.dev/api/sip/token',
//     callEventEndpoint: 'https://pllato-elc-worker.uurraa.workers.dev/api/call/event',
//     callLogEndpoint:   'https://pllato-elc-worker.uurraa.workers.dev/api/call/log',
//     getAuthToken: async () => 'Bearer ' + await firebase.auth().currentUser.getIdToken(),
//     resolveContact: async (phone) => ({ id, name, dealId }),
//     onCallEvent: (evt) => console.log('call', evt),
//   });
//
//   sip.call('77011239999', { contactName: 'Ivan', contactId: '123' });
//   sip.hangup();
//   sip.renderCallHistory(domElement, { contactId: '123' });
//
// ─────────────────────────────────────────────────────────────────────────────

const SIP_ESM_URL = 'https://cdn.jsdelivr.net/npm/sip.js@0.21.2/+esm';

let _sipModulePromise = null;
async function loadSipJs() {
  if (!_sipModulePromise) _sipModulePromise = import(SIP_ESM_URL);
  return _sipModulePromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles (single inject)
// ─────────────────────────────────────────────────────────────────────────────
const STYLES = `
.sipc-bottombar{position:fixed;right:16px;bottom:16px;z-index:99998;background:#1f2937;color:#fff;border-radius:999px;padding:8px 6px 8px 10px;display:flex;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,.25);font:13px/1.2 -apple-system,sans-serif;cursor:pointer;user-select:none;transition:background .2s,padding .2s}
.sipc-bottombar:hover{background:#374151}
.sipc-bottombar[data-state="established"]{background:#15803d;padding-right:4px}
.sipc-bottombar[data-state="established"]:hover{background:#166534}
.sipc-bottombar[data-state="ringing"]{background:#b91c1c}
.sipc-bottombar[data-state="ringing"]:hover{background:#991b1b}
.sipc-bottombar .sipc-dot{width:8px;height:8px;border-radius:50%;background:#9ca3af;flex:none;box-shadow:0 0 0 0 rgba(0,0,0,0)}
.sipc-bottombar[data-state="connecting"] .sipc-dot{background:#fbbf24;animation:sipc-pulse 1.2s infinite}
.sipc-bottombar[data-state="registered"] .sipc-dot{background:#10b981}
.sipc-bottombar[data-state="ringing"] .sipc-dot,.sipc-bottombar[data-state="established"] .sipc-dot{background:#fff;animation:sipc-pulse 1s infinite}
.sipc-bottombar[data-state="error"] .sipc-dot{background:#ef4444}
@keyframes sipc-pulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,.7)}70%{box-shadow:0 0 0 10px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}
.sipc-bottombar .sipc-status{font-weight:500;white-space:nowrap}
.sipc-bottombar .sipc-callinfo{opacity:.95;font-size:12px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
.sipc-bottombar .sipc-bb-act{background:transparent;border:none;color:#fff;font-size:16px;cursor:pointer;padding:4px 8px;border-radius:999px;line-height:1;transition:background .12s;display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px}
.sipc-bottombar .sipc-bb-act:hover{background:rgba(255,255,255,.2)}
.sipc-bottombar .sipc-bb-act.sipc-bb-hangup{background:#dc2626}
.sipc-bottombar .sipc-bb-act.sipc-bb-hangup:hover{background:#b91c1c}

.sipc-modal-bg{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:99999;display:flex;align-items:center;justify-content:center;animation:sipc-fade .15s ease-out}
@keyframes sipc-fade{from{opacity:0}to{opacity:1}}
.sipc-modal{background:#fff;border-radius:14px;width:340px;max-width:92vw;box-shadow:0 20px 60px rgba(0,0,0,.35);overflow:hidden;font:14px/1.4 -apple-system,sans-serif;color:#0f172a}
.sipc-modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e5e7eb}
.sipc-modal-title{font-weight:600;font-size:15px}
.sipc-modal-close{background:transparent;border:none;font-size:22px;cursor:pointer;color:#64748b;line-height:1;padding:0 4px}
.sipc-modal-close:hover{color:#0f172a}
.sipc-modal-body{padding:18px 16px 16px}

.sipc-phone{font-size:24px;font-weight:600;text-align:center;letter-spacing:.5px;color:#0f172a;margin-bottom:4px}
.sipc-cname{text-align:center;color:#475569;font-size:13px;margin-bottom:12px;min-height:18px}
.sipc-state{text-align:center;font-size:14px;color:#334155;padding:8px 10px;background:#f1f5f9;border-radius:8px;margin-bottom:14px;font-weight:500}
.sipc-state.sipc-state-talking{background:#dcfce7;color:#15803d}
.sipc-state.sipc-state-error{background:#fee2e2;color:#b91c1c}
.sipc-timer{font-variant-numeric:tabular-nums;opacity:.7;margin-left:8px}

.sipc-controls{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.sipc-ctrl{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:10px 8px;cursor:pointer;font-size:13px;text-align:center;color:#0f172a;transition:all .12s;display:flex;flex-direction:column;align-items:center;gap:4px}
.sipc-ctrl:hover:not(:disabled){background:#e2e8f0}
.sipc-ctrl:disabled{opacity:.5;cursor:not-allowed}
.sipc-ctrl.sipc-ctrl-on{background:#fef3c7;border-color:#fbbf24;color:#92400e}
.sipc-ctrl .sipc-ctrl-ico{font-size:18px}

.sipc-dtmf-wrap{display:none;border-top:1px solid #e5e7eb;padding-top:12px;margin-bottom:12px}
.sipc-dtmf-wrap.sipc-open{display:block}
.sipc-dtmf-display{height:30px;background:#0f172a;color:#10b981;font-variant-numeric:tabular-nums;font-size:18px;letter-spacing:3px;padding:4px 10px;border-radius:6px;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;margin-bottom:8px;overflow:hidden}
.sipc-dtmf-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.sipc-dtmf-key{background:#fff;border:1px solid #cbd5e1;border-radius:8px;padding:12px 0;font-size:18px;font-weight:600;cursor:pointer;color:#0f172a}
.sipc-dtmf-key:active{background:#e2e8f0;transform:scale(.96)}
.sipc-dtmf-key small{display:block;font-size:9px;color:#64748b;font-weight:400;letter-spacing:1px;margin-top:2px}

.sipc-hangup{width:100%;background:#dc2626;color:#fff;border:none;border-radius:10px;padding:14px;font-size:15px;font-weight:600;cursor:pointer;transition:background .12s}
.sipc-hangup:hover{background:#b91c1c}
.sipc-hangup:disabled{background:#94a3b8;cursor:not-allowed}
.sipc-accept{background:#10b981}
.sipc-accept:hover{background:#059669}
.sipc-twobtn{display:grid;grid-template-columns:1fr 1fr;gap:10px}

.sipc-numpad-input{width:100%;padding:11px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:18px;font-variant-numeric:tabular-nums;text-align:center;margin-bottom:12px;letter-spacing:1px;color:#0f172a;background:#f8fafc}
.sipc-numpad-input:focus{outline:none;border-color:#3b82f6;background:#fff}
.sipc-numpad-call{width:100%;background:#10b981;color:#fff;border:none;border-radius:10px;padding:12px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px}
.sipc-numpad-call:disabled{background:#94a3b8;cursor:not-allowed}

.sipc-history{font:13px/1.5 -apple-system,sans-serif}
.sipc-history-empty{padding:14px;text-align:center;color:#64748b;font-size:13px;background:#f8fafc;border-radius:6px}
.sipc-history-item{display:grid;grid-template-columns:24px 1fr auto;gap:8px;align-items:center;padding:8px 6px;border-bottom:1px solid #f1f5f9}
.sipc-history-item:last-child{border-bottom:none}
.sipc-history-dir{font-size:14px;text-align:center}
.sipc-history-info{min-width:0}
.sipc-history-phone{color:#0f172a;font-weight:500}
.sipc-history-meta{color:#64748b;font-size:11px}
.sipc-history-dur{color:#475569;font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap}
.sipc-history-item[data-status="missed"] .sipc-history-phone,.sipc-history-item[data-status="no_answer"] .sipc-history-phone{color:#dc2626}
.sipc-history-recall{background:transparent;border:none;cursor:pointer;color:#3b82f6;font-size:14px;padding:2px 6px;border-radius:4px}
.sipc-history-recall:hover{background:#eff6ff}
`;

let _stylesInjected = false;
function ensureStyles() {
  if (_stylesInjected) return;
  const s = document.createElement('style');
  s.id = '_sipc-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
  _stylesInjected = true;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
}

function fmtDuration(sec) {
  if (!sec || sec < 0) return '0:00';
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

function fmtRelTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff/60)} мин`;
  if (diff < 86400) return `${Math.floor(diff/3600)} ч`;
  return d.toLocaleDateString('ru-RU', { day:'numeric', month:'short' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main factory
// ─────────────────────────────────────────────────────────────────────────────
export async function createSipClient(config) {
  if (!config?.tokenEndpoint) throw new Error('sip-client: tokenEndpoint required');
  if (!config?.getAuthToken) throw new Error('sip-client: getAuthToken required');

  ensureStyles();

  const opts = {
    tokenEndpoint:     config.tokenEndpoint,
    callEventEndpoint: config.callEventEndpoint || null,
    callLogEndpoint:   config.callLogEndpoint || null,
    getAuthToken:      config.getAuthToken,
    onIncoming:        config.onIncoming || null,
    onCallEvent:       config.onCallEvent || null,
    resolveContact:    config.resolveContact || null,
    showBottomBar:     config.showBottomBar !== false,  // default true
    autoConnect:       config.autoConnect !== false,    // default true
    debug:             !!config.debug,
  };

  const dbg = (...a) => { if (opts.debug) console.log('[sipc]', ...a); };

  // ── Internal state ─────────
  let SIP = null;
  let ua = null;
  let registerer = null;
  let session = null;             // current in/out session
  let sessionMeta = null;         // {phone, contactName, contactId, dealId, callId, direction, startedAt, establishedAt}
  let creds = null;
  let audioEl = null;
  let bottomBar = null;
  let currentOverlay = null;
  let muted = false;
  let onHold = false;
  let timerInterval = null;

  // ── Audio element ────────────
  function getAudioEl() {
    if (audioEl) return audioEl;
    audioEl = document.createElement('audio');
    audioEl.id = '_sipc-audio';
    audioEl.autoplay = true;
    document.body.appendChild(audioEl);
    return audioEl;
  }

  // ── Auth fetch helper ────────
  async function authFetch(url, init = {}) {
    const token = await opts.getAuthToken();
    const headers = new Headers(init.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`);
    }
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type','application/json');
    return fetch(url, { ...init, headers });
  }

  // ── Call event logging ───────
  async function logCallEvent(payload) {
    if (!opts.callEventEndpoint) return null;
    try {
      const r = await authFetch(opts.callEventEndpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!r.ok) return null;
      const j = await r.json();
      opts.onCallEvent?.({ type: 'logged', payload, result: j });
      return j;
    } catch (e) { dbg('logCallEvent fail', e); return null; }
  }

  // ── Bottom-bar render ────────
  function renderBottomBar() {
    if (!opts.showBottomBar) return;
    if (bottomBar) return;
    bottomBar = document.createElement('div');
    bottomBar.className = 'sipc-bottombar';
    bottomBar.setAttribute('data-state', 'connecting');
    bottomBar.title = 'Клик — открыть диалер';
    rebuildBottomBar();
    document.body.appendChild(bottomBar);
  }
  function rebuildBottomBar() {
    if (!bottomBar) return;
    const state = bottomBar.getAttribute('data-state');
    const inCall = state === 'established' || state === 'ringing' || state === 'connecting' && !!session;
    if (inCall) {
      // Active call: имя+таймер + кнопка развернуть + кнопка hangup
      bottomBar.innerHTML = `
        <span class="sipc-dot"></span>
        <span class="sipc-callinfo" data-callinfo></span>
        <button class="sipc-bb-act" data-bb-expand title="Развернуть диалер">↗</button>
        <button class="sipc-bb-act sipc-bb-hangup" data-bb-hangup title="Завершить">📵</button>
      `;
    } else {
      // Idle: статус + кнопка набора номера
      bottomBar.innerHTML = `
        <span class="sipc-dot"></span>
        <span class="sipc-status" data-status></span>
        <span class="sipc-callinfo" data-callinfo></span>
        <button class="sipc-bb-act" data-bb-numpad title="Набрать номер">⌨</button>
      `;
    }
    bottomBar.onclick = (e) => {
      if (e.target.closest('[data-bb-hangup]')) { e.stopPropagation(); hangup(); return; }
      if (e.target.closest('[data-bb-expand]'))  { e.stopPropagation(); openCallOverlay(); return; }
      if (e.target.closest('[data-bb-numpad]'))  { e.stopPropagation(); openNumpad(); return; }
      // Клик по фону bar: если активный звонок — развернуть, иначе numpad
      if (session) openCallOverlay(); else openNumpad();
    };
  }
  function setBottomBarState(state, label, info='') {
    if (!bottomBar) return;
    const prevState = bottomBar.getAttribute('data-state');
    bottomBar.setAttribute('data-state', state);
    // При переходе между inCall ↔ idle перерисовываем структуру
    const wasInCall = prevState === 'established' || prevState === 'ringing';
    const isInCall  = state === 'established' || state === 'ringing';
    if (wasInCall !== isInCall) rebuildBottomBar();
    const $s = bottomBar.querySelector('[data-status]');
    const $i = bottomBar.querySelector('[data-callinfo]');
    if ($s) $s.textContent = label;
    if ($i) $i.textContent = info;
  }
  function updateBottomBarCallInfo() {
    if (!bottomBar || !sessionMeta) return;
    const $i = bottomBar.querySelector('[data-callinfo]');
    if (!$i) return;
    const name = sessionMeta.contactName || sessionMeta.phone;
    if (sessionMeta.establishedAt) {
      const sec = Math.round((Date.now() - sessionMeta.establishedAt) / 1000);
      $i.textContent = `${name} · ${fmtDuration(sec)}`;
    } else {
      $i.textContent = name;
    }
  }

  // ── SIP UA init + register ───
  async function fetchCreds(force=false) {
    if (creds && !force) return creds;
    const r = await authFetch(opts.tokenEndpoint);
    if (!r.ok) throw new Error(`SIP token fetch failed: ${r.status} ${await r.text()}`);
    creds = await r.json();
    return creds;
  }

  async function init() {
    if (ua && ua.state === 'Started') return ua;
    setBottomBarState('connecting', 'Подключение…');
    try {
      SIP = await loadSipJs();
      const cfg = await fetchCreds();
      ua = new SIP.UserAgent({
        uri: SIP.UserAgent.makeURI(`sip:${cfg.user}@${cfg.domain}`),
        authorizationUsername: cfg.user,
        authorizationPassword: cfg.password,
        transportOptions: { server: cfg.wss },
        sessionDescriptionHandlerFactoryOptions: {
          iceGatheringTimeout: 1500,
          peerConnectionConfiguration: {
            iceServers: cfg.iceServers || [{ urls: cfg.stun }],
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
          },
        },
        delegate: {
          onInvite: handleIncomingInvite,
        },
      });
      await ua.start();
      registerer = new SIP.Registerer(ua);
      await registerer.register();
      setBottomBarState('registered', 'Готов к звонкам');
      dbg('registered as', cfg.user, '@', cfg.domain);
      return ua;
    } catch (e) {
      setBottomBarState('error', 'Ошибка SIP', e?.message || '');
      console.error('[sipc] init failed:', e);
      throw e;
    }
  }

  // ── Incoming call handler ────
  async function handleIncomingInvite(invitation) {
    if (session) { try { invitation.reject(); } catch{} return; }
    const fromUri = invitation.remoteIdentity?.uri;
    const phone = fromUri?.user || 'неизвестно';
    let contactInfo = { phone };
    if (opts.resolveContact) {
      try { Object.assign(contactInfo, (await opts.resolveContact(phone)) || {}); } catch{}
    }
    setBottomBarState('ringing', 'Входящий…', contactInfo.name || phone);

    let callId = null;
    const ev = await logCallEvent({
      direction: 'in', phone,
      contactId: contactInfo.id || null,
      dealId: contactInfo.dealId || null,
      status: 'ringing', provider: 'sip-webrtc',
      startedAt: new Date().toISOString(),
    });
    callId = ev?.id || null;

    sessionMeta = {
      phone, contactName: contactInfo.name || '',
      contactId: contactInfo.id || null, dealId: contactInfo.dealId || null,
      callId, direction: 'in', startedAt: Date.now(),
    };
    session = invitation;

    if (opts.onIncoming) {
      try {
        opts.onIncoming(contactInfo, async () => acceptIncoming(invitation), () => rejectIncoming(invitation));
        return;
      } catch (e) { dbg('onIncoming threw', e); }
    }
    openIncomingOverlay(invitation, contactInfo);
  }

  async function acceptIncoming(invitation) {
    try {
      await invitation.accept({
        sessionDescriptionHandlerOptions: { constraints: { audio: true, video: false } },
      });
      attachAudio(invitation);
      sessionMeta.establishedAt = Date.now();
      setBottomBarState('established', 'Разговор', sessionMeta.contactName || sessionMeta.phone);
      openCallOverlay();
      bindSessionStateChange(invitation);
    } catch (e) {
      console.error('[sipc] accept failed', e);
      closeOverlays();
    }
  }
  async function rejectIncoming(invitation) {
    try { await invitation.reject(); } catch{}
    if (sessionMeta?.callId) logCallEvent({ callId: sessionMeta.callId, status: 'rejected', endedAt: new Date().toISOString() });
    session = null; sessionMeta = null;
    setBottomBarState('registered', 'Готов к звонкам');
    closeOverlays();
  }

  // ── Outgoing call ────────────
  async function call(phone, meta = {}) {
    if (!phone) throw new Error('phone required');
    phone = String(phone).replace(/\D/g, '');  // оставляем только цифры
    if (!phone) throw new Error('phone must contain digits');

    if (session) await hangup();

    let contactInfo = { name: meta.contactName, id: meta.contactId, dealId: meta.dealId };
    if (opts.resolveContact && !contactInfo.name) {
      try { Object.assign(contactInfo, (await opts.resolveContact(phone)) || {}); } catch{}
    }

    // Log attempt
    const ev = await logCallEvent({
      direction: 'out', phone,
      contactId: contactInfo.id || null,
      dealId: contactInfo.dealId || null,
      status: 'attempted', provider: 'sip-webrtc',
      startedAt: new Date().toISOString(),
    });
    const callId = ev?.id || null;

    sessionMeta = {
      phone, contactName: contactInfo.name || '',
      contactId: contactInfo.id || null, dealId: contactInfo.dealId || null,
      callId, direction: 'out', startedAt: Date.now(),
    };
    muted = false; onHold = false;

    setBottomBarState('connecting', 'Звоним…', contactInfo.name || phone);
    openCallOverlay();

    await init();
    const cfg = await fetchCreds();
    const target = SIP.UserAgent.makeURI(`sip:${phone}@${cfg.domain}`);
    if (!target) throw new Error('Invalid SIP URI: ' + phone);
    const inviter = new SIP.Inviter(ua, target, {
      sessionDescriptionHandlerOptions: { constraints: { audio: true, video: false } },
    });
    session = inviter;
    bindSessionStateChange(inviter);
    await inviter.invite();
    return inviter;
  }

  function bindSessionStateChange(s) {
    s.stateChange.addListener((state) => {
      dbg('state', state);
      updateOverlayState(state);
      if (state === SIP.SessionState.Established) {
        sessionMeta.establishedAt = Date.now();
        attachAudio(s);
        setBottomBarState('established', 'Разговор', sessionMeta.contactName || sessionMeta.phone);
        startTimer();
        // Auto-minimize: через 700ms сворачиваем overlay в bottom-bar
        // чтобы оператор мог работать с карточкой клиента. Bottom-bar
        // остаётся видимым с таймером + кнопками «Развернуть» / «📵».
        setTimeout(() => {
          if (session === s && sessionMeta && currentOverlay && !currentOverlay.dataset.keepOpen) {
            closeOverlays();
          }
        }, 700);
      }
      if (state === SIP.SessionState.Terminated) {
        finalizeCall(s);
      }
    });
  }

  function attachAudio(s) {
    const pc = s.sessionDescriptionHandler?.peerConnection;
    if (!pc) return;
    const stream = new MediaStream();
    pc.getReceivers().forEach(r => r.track && stream.addTrack(r.track));
    getAudioEl().srcObject = stream;
  }

  function finalizeCall(s) {
    stopTimer();
    if (session === s) {
      const duration = sessionMeta?.establishedAt
        ? Math.round((Date.now() - sessionMeta.establishedAt) / 1000) : 0;
      const status = sessionMeta?.establishedAt ? 'connected'
        : (sessionMeta?.direction === 'out' ? 'no_answer' : 'missed');
      if (sessionMeta?.callId) {
        logCallEvent({
          callId: sessionMeta.callId,
          status,
          endedAt: new Date().toISOString(),
          durationSec: duration,
        });
      }
      opts.onCallEvent?.({ type: 'ended', meta: sessionMeta, durationSec: duration, status });
      session = null; sessionMeta = null; muted = false; onHold = false;
      if (audioEl) { audioEl.srcObject = null; audioEl.muted = false; }
      setBottomBarState('registered', 'Готов к звонкам');
    }
  }

  async function hangup() {
    if (!session) return;
    const s = session;
    try {
      if (s.state === SIP.SessionState.Established) await s.bye();
      else if (s.state === SIP.SessionState.Establishing) await s.cancel();
      else if (s.state === SIP.SessionState.Initial) await s.cancel();
      else if (s.state === 'Initial' || s.state === 'Establishing') await s.reject?.();
    } catch (e) { dbg('hangup err', e); }
  }

  // ── Mute / Hold / DTMF ───────
  function getAudioSender() {
    const pc = session?.sessionDescriptionHandler?.peerConnection;
    if (!pc) return null;
    return pc.getSenders().find(s => s.track?.kind === 'audio') || null;
  }

  function setMute(state) {
    const sender = getAudioSender();
    if (!sender?.track) return false;
    sender.track.enabled = !state;
    muted = state;
    updateOverlayControls();
    return true;
  }
  function toggleMute() { return setMute(!muted); }

  function setHold(state) {
    // Soft hold: mute mic + mute speaker (без re-INVITE).
    // Реальный SIP hold через re-INVITE (sendonly/inactive) — TODO.
    const sender = getAudioSender();
    if (!sender?.track) return false;
    sender.track.enabled = !state;
    if (audioEl) audioEl.muted = state;
    onHold = state;
    updateOverlayControls();
    return true;
  }
  function toggleHold() { return setHold(!onHold); }

  function sendDtmf(digits) {
    const sender = getAudioSender();
    if (!sender?.dtmf) return false;
    try {
      sender.dtmf.insertDTMF(String(digits), 200, 50);
      const inp = currentOverlay?.querySelector('.sipc-dtmf-display');
      if (inp) inp.textContent = (inp.textContent + digits).slice(-20);
      return true;
    } catch (e) { dbg('dtmf err', e); return false; }
  }

  // ── Overlays ─────────────────
  function closeOverlays() {
    if (currentOverlay) { currentOverlay.remove(); currentOverlay = null; }
  }

  function openCallOverlay() {
    // Если уже открыт active session overlay — не пересоздаём (auto-minimize
    // мог закрыть, а пользователь вручную развернул через bottom-bar — в этом
    // случае ставим флаг keepOpen чтобы не закрылось повторно).
    closeOverlays();
    const bg = document.createElement('div');
    bg.className = 'sipc-modal-bg';
    // Если разговор уже идёт (Established) — пользователь явно развернул,
    // больше не auto-минимизируем
    if (session && sessionMeta?.establishedAt) bg.dataset.keepOpen = '1';
    const isIn = sessionMeta?.direction === 'in';
    bg.innerHTML = `
      <div class="sipc-modal" role="dialog" aria-label="${isIn ? 'Входящий' : 'Исходящий'} звонок">
        <div class="sipc-modal-head">
          <div class="sipc-modal-title">${isIn ? '⬅ Входящий звонок' : '➡ Исходящий звонок'}</div>
          <button class="sipc-modal-close" title="Свернуть">−</button>
        </div>
        <div class="sipc-modal-body">
          <div class="sipc-phone">${escapeHtml(sessionMeta?.phone || '')}</div>
          <div class="sipc-cname">${escapeHtml(sessionMeta?.contactName || '')}</div>
          <div class="sipc-state" data-state>Соединяемся…<span class="sipc-timer" data-timer></span></div>
          <div class="sipc-controls">
            <button class="sipc-ctrl" data-act="mute" disabled>
              <span class="sipc-ctrl-ico">🎤</span><span>Mute</span>
            </button>
            <button class="sipc-ctrl" data-act="hold" disabled>
              <span class="sipc-ctrl-ico">⏸</span><span>Hold</span>
            </button>
            <button class="sipc-ctrl" data-act="dtmf" disabled>
              <span class="sipc-ctrl-ico">⌨</span><span>Тоны</span>
            </button>
          </div>
          <div class="sipc-dtmf-wrap" data-dtmf>
            <div class="sipc-dtmf-display"></div>
            <div class="sipc-dtmf-pad">
              ${[['1',''],['2','ABC'],['3','DEF'],['4','GHI'],['5','JKL'],['6','MNO'],['7','PQRS'],['8','TUV'],['9','WXYZ'],['*',''],['0','+'],['#','']]
                .map(([k,l]) => `<button class="sipc-dtmf-key" data-d="${k}">${k}<small>${l}</small></button>`).join('')}
            </div>
          </div>
          <button class="sipc-hangup" data-act="hangup">📵 Завершить</button>
        </div>
      </div>
    `;
    document.body.appendChild(bg);
    currentOverlay = bg;

    bg.querySelector('.sipc-modal-close').onclick = () => closeOverlays();
    bg.querySelector('[data-act="hangup"]').onclick = async (e) => {
      e.target.disabled = true;
      await hangup();
    };
    bg.querySelector('[data-act="mute"]').onclick = () => toggleMute();
    bg.querySelector('[data-act="hold"]').onclick = () => toggleHold();
    bg.querySelector('[data-act="dtmf"]').onclick = () => {
      bg.querySelector('[data-dtmf]').classList.toggle('sipc-open');
    };
    bg.querySelectorAll('.sipc-dtmf-key').forEach(b => {
      b.onclick = () => sendDtmf(b.dataset.d);
    });

    if (session) updateOverlayState(session.state);
    updateOverlayControls();
  }

  function openIncomingOverlay(invitation, contactInfo) {
    closeOverlays();
    const bg = document.createElement('div');
    bg.className = 'sipc-modal-bg';
    bg.innerHTML = `
      <div class="sipc-modal">
        <div class="sipc-modal-head">
          <div class="sipc-modal-title">⬅ Входящий звонок</div>
        </div>
        <div class="sipc-modal-body">
          <div class="sipc-phone">${escapeHtml(contactInfo.phone || '')}</div>
          <div class="sipc-cname">${escapeHtml(contactInfo.name || 'неизвестный номер')}</div>
          <div class="sipc-state">Звонит…</div>
          <div class="sipc-twobtn">
            <button class="sipc-hangup sipc-accept" data-act="accept">✓ Ответить</button>
            <button class="sipc-hangup" data-act="reject">✗ Отклонить</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(bg);
    currentOverlay = bg;
    bg.querySelector('[data-act="accept"]').onclick = () => acceptIncoming(invitation);
    bg.querySelector('[data-act="reject"]').onclick = () => rejectIncoming(invitation);
  }

  function openNumpad() {
    closeOverlays();
    const bg = document.createElement('div');
    bg.className = 'sipc-modal-bg';
    bg.innerHTML = `
      <div class="sipc-modal">
        <div class="sipc-modal-head">
          <div class="sipc-modal-title">⌨ Набрать номер</div>
          <button class="sipc-modal-close">×</button>
        </div>
        <div class="sipc-modal-body">
          <input type="tel" class="sipc-numpad-input" placeholder="+7 ..." autofocus>
          <div class="sipc-dtmf-pad">
            ${['1','2','3','4','5','6','7','8','9','+','0','⌫']
              .map(k => `<button class="sipc-dtmf-key" data-k="${k}">${k}</button>`).join('')}
          </div>
          <button class="sipc-numpad-call" disabled>📞 Позвонить</button>
        </div>
      </div>
    `;
    document.body.appendChild(bg);
    currentOverlay = bg;
    const inp = bg.querySelector('.sipc-numpad-input');
    const btn = bg.querySelector('.sipc-numpad-call');
    const upd = () => { btn.disabled = !inp.value.replace(/\D/g,''); };
    inp.oninput = upd;
    bg.querySelector('.sipc-modal-close').onclick = () => closeOverlays();
    bg.querySelectorAll('.sipc-dtmf-key').forEach(b => {
      b.onclick = () => {
        const k = b.dataset.k;
        if (k === '⌫') inp.value = inp.value.slice(0, -1);
        else inp.value += k;
        upd(); inp.focus();
      };
    });
    btn.onclick = () => { closeOverlays(); call(inp.value); };
    inp.onkeydown = (e) => { if (e.key === 'Enter' && !btn.disabled) btn.click(); };
  }

  function updateOverlayState(state) {
    if (!currentOverlay) return;
    const $st = currentOverlay.querySelector('[data-state]');
    if (!$st) return;
    const map = {
      Initial:      'Соединяемся…',
      Establishing: 'Идёт вызов…',
      Established:  'Разговор',
      Terminating:  'Завершаем…',
      Terminated:   'Завершён',
    };
    const txt = map[state] || state;
    $st.firstChild && ($st.firstChild.nodeValue = txt + ' ');
    $st.classList.toggle('sipc-state-talking', state === 'Established');
    if (state === 'Terminated') {
      const hb = currentOverlay.querySelector('[data-act="hangup"]');
      if (hb) { hb.textContent = '✕ Закрыть'; hb.disabled = false; hb.onclick = () => closeOverlays(); }
      currentOverlay.querySelectorAll('.sipc-ctrl').forEach(b => b.disabled = true);
    }
  }

  function updateOverlayControls() {
    if (!currentOverlay) return;
    const active = session?.state === SIP.SessionState?.Established;
    currentOverlay.querySelectorAll('.sipc-ctrl').forEach(b => b.disabled = !active);
    const mBtn = currentOverlay.querySelector('[data-act="mute"]');
    if (mBtn) mBtn.classList.toggle('sipc-ctrl-on', muted);
    const hBtn = currentOverlay.querySelector('[data-act="hold"]');
    if (hBtn) hBtn.classList.toggle('sipc-ctrl-on', onHold);
  }

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      if (!sessionMeta?.establishedAt) return;
      const sec = Math.round((Date.now() - sessionMeta.establishedAt) / 1000);
      // Overlay таймер (если открыт)
      if (currentOverlay) {
        const $t = currentOverlay.querySelector('[data-timer]');
        if ($t) $t.textContent = fmtDuration(sec);
      }
      // Bottom-bar таймер (для свёрнутого режима)
      updateBottomBarCallInfo();
    }, 500);
  }
  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  // ── Call history renderer ────
  async function renderCallHistory(container, filter = {}) {
    if (!opts.callLogEndpoint) {
      container.innerHTML = '<div class="sipc-history-empty">История звонков недоступна</div>';
      return;
    }
    container.classList.add('sipc-history');
    container.innerHTML = '<div class="sipc-history-empty">Загружаем…</div>';
    const qs = new URLSearchParams();
    if (filter.contactId) qs.set('contactId', filter.contactId);
    if (filter.dealId) qs.set('dealId', filter.dealId);
    if (filter.phone) qs.set('phone', filter.phone);
    qs.set('limit', String(filter.limit || 20));
    try {
      const r = await authFetch(`${opts.callLogEndpoint}?${qs}`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const { items = [] } = await r.json();
      if (!items.length) {
        container.innerHTML = '<div class="sipc-history-empty">Звонков пока нет</div>';
        return;
      }
      container.innerHTML = items.map(it => {
        const dirIco = it.direction === 'in'
          ? (it.status === 'missed' || it.status === 'rejected' ? '⤺' : '↙')
          : '↗';
        const dur = it.durationSec ? fmtDuration(it.durationSec) : '—';
        const when = fmtRelTime(it.startedAt);
        const statusLabel = ({
          connected: 'разговор',
          no_answer: 'не ответил',
          missed: 'пропущен',
          rejected: 'отклонён',
          attempted: 'набран',
          failed: 'ошибка',
        })[it.status] || it.status;
        return `
          <div class="sipc-history-item" data-status="${escapeHtml(it.status)}">
            <div class="sipc-history-dir">${dirIco}</div>
            <div class="sipc-history-info">
              <div class="sipc-history-phone">${escapeHtml(it.phone)}</div>
              <div class="sipc-history-meta">${when} · ${statusLabel}</div>
            </div>
            <div class="sipc-history-dur">
              ${dur}
              <button class="sipc-history-recall" data-phone="${escapeHtml(it.phone)}" title="Перезвонить">📞</button>
            </div>
          </div>
        `;
      }).join('');
      container.querySelectorAll('.sipc-history-recall').forEach(b => {
        b.onclick = () => call(b.dataset.phone);
      });
    } catch (e) {
      container.innerHTML = `<div class="sipc-history-empty">Не удалось загрузить (${escapeHtml(e?.message||e)})</div>`;
    }
  }

  // ── Destroy ──────────────────
  async function destroy() {
    try { await hangup(); } catch{}
    try { await registerer?.unregister(); } catch{}
    try { await ua?.stop(); } catch{}
    stopTimer();
    closeOverlays();
    if (audioEl) { audioEl.remove(); audioEl = null; }
    if (bottomBar) { bottomBar.remove(); bottomBar = null; }
    ua = null; registerer = null; session = null; sessionMeta = null; creds = null;
  }

  // ── Boot ─────────────────────
  renderBottomBar();
  if (opts.autoConnect) {
    init().catch(e => console.warn('[sipc] autoConnect failed:', e?.message));
  }

  return {
    init, call, hangup,
    mute: () => setMute(true), unmute: () => setMute(false), toggleMute,
    hold: () => setHold(true), unhold: () => setHold(false), toggleHold,
    dtmf: sendDtmf,
    openDialer: openNumpad,
    openCall: openCallOverlay,
    renderCallHistory,
    destroy,
    get state() { return session?.state || (ua?.state || 'Stopped'); },
    get isMuted() { return muted; },
    get isOnHold() { return onHold; },
    get ua() { return ua; },
    get session() { return session; },
    get meta() { return sessionMeta; },
  };
}
