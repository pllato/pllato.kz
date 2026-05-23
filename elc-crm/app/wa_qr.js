// Pllato CRM — модалка привязки WhatsApp по QR (Green-API).
// Воркер проксирует /wa/qr и /wa/state — креды (apiToken) на фронт не уходят.
import { getWaQr, getWaState } from "./channels.js";

const STYLE_ID = "pllato-wa-qr-style";
const POLL_STATE_MS = 3000;     // как часто опрашиваем статус инстанса
const REFRESH_QR_MS = 25000;    // QR живёт ~20 сек, перезапрашиваем с запасом

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .waqr-overlay { position:fixed; inset:0; background:rgba(10,22,40,.6); backdrop-filter:blur(4px); display:grid; place-items:center; padding:24px; z-index:250; }
    .waqr-modal { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); box-shadow:0 20px 60px rgba(0,0,0,.4); width:100%; max-width:420px; max-height:90vh; overflow:hidden; display:flex; flex-direction:column; }
    .waqr-head { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--border-soft); }
    .waqr-head h3 { margin:0; font-size:15px; font-weight:700; }
    .waqr-head button { width:30px; height:30px; border:0; background:transparent; font-size:20px; line-height:1; color:var(--text-muted); cursor:pointer; border-radius:6px; }
    .waqr-head button:hover { background:var(--surface-2); color:var(--text); }
    .waqr-body { padding:18px; overflow-y:auto; flex:1; text-align:center; }
    .waqr-image { width:260px; height:260px; margin:0 auto 12px; display:grid; place-items:center; background:#fff; border:1px solid var(--border); border-radius:8px; padding:10px; }
    .waqr-image img { display:block; width:100%; height:100%; image-rendering:pixelated; }
    .waqr-spinner { width:36px; height:36px; border:3px solid var(--border); border-top-color:#25d366; border-radius:50%; animation:waqrSpin 1s linear infinite; }
    @keyframes waqrSpin { to { transform:rotate(360deg); } }
    .waqr-status { font-size:13px; color:var(--text-muted); margin-top:8px; line-height:1.4; }
    .waqr-status.ok { color:#25d366; font-weight:600; }
    .waqr-status.err { color:#ef4444; }
    .waqr-hint { font-size:12.5px; color:var(--text-muted); margin-top:14px; line-height:1.5; text-align:left; padding:10px 12px; background:var(--surface-2); border-radius:8px; }
    .waqr-foot { display:flex; justify-content:flex-end; gap:10px; padding:12px 18px; border-top:1px solid var(--border-soft); background:var(--surface-2); }
    .waqr-foot button { padding:9px 16px; border-radius:var(--radius-sm); font:inherit; font-size:13px; font-weight:600; cursor:pointer; border:1px solid var(--border); background:transparent; color:var(--text); }
    .waqr-foot button:hover { background:var(--surface-hover); }
  `;
  document.head.appendChild(s);
}

const STATE_LABEL = {
  authorized: "✅ Подключено",
  notAuthorized: "Отсканируй QR-код с телефона",
  starting: "Инстанс запускается…",
  blocked: "⚠️ Инстанс заблокирован",
  sleepMode: "💤 Инстанс в спящем режиме",
  yellowCard: "⚠️ Yellow Card (ограничения Green-API)",
};

/**
 * Открыть модалку привязки WhatsApp.
 * @param {Object} opts
 * @param {string}   opts.channelId       — id Green-API канала
 * @param {string}  [opts.channelName]    — имя канала (для заголовка)
 * @param {Function}[opts.onAuthorized]   — callback при успешной авторизации
 */
export function openWaQrModal(opts) {
  const { channelId, channelName = "", onAuthorized } = opts || {};
  if (!channelId) return;

  ensureStyles();
  document.querySelectorAll(".waqr-overlay").forEach(el => el.remove());

  const wrap = document.createElement("div");
  wrap.className = "waqr-overlay";
  wrap.innerHTML = `
    <div class="waqr-modal">
      <header class="waqr-head">
        <h3>📱 Привязка WhatsApp${channelName ? ` · ${escape(channelName)}` : ""}</h3>
        <button type="button" data-close aria-label="Закрыть">×</button>
      </header>
      <div class="waqr-body">
        <div class="waqr-image" data-qr-host>
          <div class="waqr-spinner"></div>
        </div>
        <div class="waqr-status" data-status>Запрашиваем QR-код…</div>
        <div class="waqr-hint">
          1. Открой WhatsApp на телефоне<br>
          2. Меню → <b>Связанные устройства</b><br>
          3. Нажми <b>Привязать устройство</b> и отсканируй код
        </div>
      </div>
      <footer class="waqr-foot">
        <button type="button" data-close>Закрыть</button>
      </footer>
    </div>
  `;
  document.body.appendChild(wrap);

  const qrHost = wrap.querySelector("[data-qr-host]");
  const statusEl = wrap.querySelector("[data-status]");

  let stateTimer = null;
  let qrTimer = null;
  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    if (stateTimer) clearInterval(stateTimer);
    if (qrTimer) clearInterval(qrTimer);
    wrap.remove();
  }

  function setStatus(text, kind = "") {
    if (!statusEl) return;
    statusEl.textContent = text || "";
    statusEl.className = "waqr-status" + (kind ? ` ${kind}` : "");
  }

  async function refreshQr() {
    try {
      const res = await getWaQr(channelId);
      if (closed) return;
      if (res?.type === "qrCode" && res.qrBase64) {
        qrHost.innerHTML = `<img alt="QR-код WhatsApp" src="data:image/png;base64,${res.qrBase64}">`;
        setStatus("Отсканируй QR-код с телефона");
      } else if (res?.type === "alreadyLogged") {
        qrHost.innerHTML = "<div style='font-size:48px;'>✅</div>";
        setStatus("WhatsApp уже привязан", "ok");
        onAuthorized?.();
        setTimeout(close, 1200);
      } else {
        qrHost.innerHTML = "<div style='font-size:36px;'>⚠️</div>";
        setStatus(res?.message || "Не удалось получить QR-код", "err");
      }
    } catch (err) {
      if (closed) return;
      qrHost.innerHTML = "<div style='font-size:36px;'>⚠️</div>";
      setStatus(err?.message || "Ошибка запроса QR", "err");
    }
  }

  async function pollState() {
    try {
      const res = await getWaState(channelId);
      if (closed) return;
      const state = res?.stateInstance;
      if (state === "authorized") {
        qrHost.innerHTML = "<div style='font-size:48px;'>✅</div>";
        setStatus(STATE_LABEL.authorized, "ok");
        onAuthorized?.();
        setTimeout(close, 1500);
        return;
      }
      const label = STATE_LABEL[state];
      if (label) setStatus(label);
    } catch {
      // poll silently — пользователь видит ошибку из refreshQr
    }
  }

  // Старт: сразу QR + статус, потом таймеры
  refreshQr().then(() => pollState());
  stateTimer = setInterval(pollState, POLL_STATE_MS);
  qrTimer = setInterval(refreshQr, REFRESH_QR_MS);

  // Закрытие
  wrap.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", close));
  wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
  document.addEventListener("keydown", function onEsc(e) {
    if (e.key === "Escape") { document.removeEventListener("keydown", onEsc); close(); }
  });
}
