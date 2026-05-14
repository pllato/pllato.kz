// Pllato CRM — действия коммуникации (звонок, WhatsApp, письмо).
// Открывает мини-модалку с выбором канала и отправляет через Cloudflare Worker.
// Activity пишется только после успешной отправки/инициации.

import { Store } from "./store.js";
import { listChannels, typeMeta } from "./channels.js";
import { currentEmployee } from "./employees.js";

const TYPES = {
  call:     { channelType: "binotel",     title: "Позвонить",        activityType: "call",     icon: "📞", verb: "позвонить",       endpoint: "/binotel/call" },
  whatsapp: { channelType: "greenapi_wa", title: "WhatsApp",         activityType: "whatsapp", icon: "💬", verb: "написать в WhatsApp", endpoint: "/wa/send" },
  email:    { channelType: "smtp",        title: "Отправить письмо", activityType: "email",    icon: "✉",  verb: "отправить письмо", endpoint: "/email/send" },
};

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function workerBase() {
  return String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
}

function normalizeInternalLine(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

async function firebaseIdToken() {
  const cfg = window.PLLATO_FIREBASE_CONFIG || {};
  if (!cfg.apiKey || !cfg.authDomain) return null;

  const appMod = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js");
  const authMod = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");

  const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(cfg);
  const auth = authMod.getAuth(app);
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function workerFetch(path, payload) {
  const base = workerBase();
  if (!base) throw new Error("Не задан URL Worker (`window.PLLATO_API_BASE` в firebase.config.js).");

  const token = await firebaseIdToken();
  if (!token) throw new Error("Нет активной Firebase-сессии. Перелогинься в CRM и повтори.");

  const res = await fetch(base + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok || !data?.ok) {
    const msg = data?.error || `Ошибка API (${res.status})`;
    const details = data?.details ? ` ${typeof data.details === "string" ? data.details : JSON.stringify(data.details)}` : "";
    throw new Error(msg + details);
  }
  return data;
}

function setFormMsg(host, text, kind = "err") {
  if (!host) return;
  host.textContent = text || "";
  host.className = "comm-msg" + (text ? ` ${kind}` : "");
}

function buildPayload(cfg, channel, opts, { text, subject, waFileUrl, waFileName, waAsVoice }) {
  if (cfg.activityType === "call") {
    const me = currentEmployee();
    const personalLine = normalizeInternalLine(me?.binotelLine || me?.binotel_line || "");
    const channelDefaultLine = normalizeInternalLine(channel.public?.default_inner || "");
    return {
      channelId: channel.id,
      externalNumber: opts.to,
      internalNumber: personalLine || channelDefaultLine || "",
    };
  }
  if (cfg.activityType === "whatsapp") {
    const fileUrl = String(waFileUrl || "").trim();
    const fileName = String(waFileName || "").trim();
    return {
      channelId: channel.id,
      to: opts.to,
      text: text || "",
      chatName: opts.contactName || "",
      urlFile: fileUrl || undefined,
      fileName: fileName || undefined,
      caption: fileUrl ? (text || "") : undefined,
      asVoice: Boolean(waAsVoice),
    };
  }
  return {
    channelId: channel.id,
    to: opts.to,
    subject,
    text,
  };
}

/**
 * Открыть модалку коммуникации.
 * @param {object} opts
 *   - type: "call" | "whatsapp" | "email"
 *   - to: string (номер или email)
 *   - contactName: string (для лога)
 *   - context: { collection, id }  — куда писать активность (например, { collection: "deal_activities", dealId })
 *   - onDone: callback после успешного действия
 */
export function openCommunicate(opts) {
  const cfg = TYPES[opts.type];
  if (!cfg) return;
  const channels = listChannels({ type: cfg.channelType });

  // Удаляем существующие открытые экземпляры
  document.querySelectorAll(".comm-overlay").forEach(el => el.remove());

  const wrap = document.createElement("div");
  wrap.className = "comm-overlay";
  wrap.innerHTML = renderModal(cfg, channels, opts);
  document.body.appendChild(wrap);

  // События
  wrap.querySelector("[data-close]")?.addEventListener("click", () => wrap.remove());
  wrap.addEventListener("click", e => { if (e.target === wrap) wrap.remove(); });

  if (channels.length === 0) {
    wrap.querySelector("[data-open-cc]")?.addEventListener("click", () => {
      window.open("https://pllato.kz/contact-center.html", "_blank");
      wrap.remove();
    });
    return;
  }

  const form = wrap.querySelector("form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const channelId = fd.get("channel");
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;
    const text = (fd.get("text") || "").trim();
    const subject = (fd.get("subject") || "").trim();
    const waFileUrl = (fd.get("wa_file_url") || "").trim();
    const waFileName = (fd.get("wa_file_name") || "").trim();
    const waAsVoice = fd.get("wa_as_voice") === "on";
    const msgEl = wrap.querySelector("[data-comm-msg]");
    const submitBtn = form.querySelector("button[type='submit']");
    const initialBtnText = submitBtn?.textContent || "";

    if (cfg.activityType === "email" && (!subject || !text)) {
      setFormMsg(msgEl, "Для письма нужны тема и текст.", "err");
      return;
    }
    if (cfg.activityType === "whatsapp" && !text && !waFileUrl) {
      setFormMsg(msgEl, "Для WhatsApp укажи текст или ссылку на файл.", "err");
      return;
    }
    if (cfg.activityType === "whatsapp" && waFileUrl && !/^https?:\/\//i.test(waFileUrl)) {
      setFormMsg(msgEl, "Ссылка на файл должна начинаться с http:// или https://", "err");
      return;
    }

    setFormMsg(msgEl, "", "err");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = cfg.activityType === "call" ? "Инициализируем звонок..." : "Отправляем...";
    }

    try {
      await workerFetch(cfg.endpoint, buildPayload(cfg, channel, opts, {
        text,
        subject,
        waFileUrl,
        waFileName,
        waAsVoice,
      }));

      // Запись активности (только после успешного ответа Worker)
      if (opts.context) {
        const me = currentEmployee();
        Store.create(opts.context.collection, {
          ...opts.context.fk,
          type: cfg.activityType,
          channelId: channel.id,
          channelName: channel.name,
          to: opts.to,
          text,
          subject,
          waFileUrl: waFileUrl || null,
          waFileName: waFileName || null,
          waAsVoice: waAsVoice || false,
          authorId: me?.id,
          ts: Date.now(),
        });
      }

      wrap.remove();
      opts.onDone?.();
    } catch (err) {
      setFormMsg(msgEl, err?.message || String(err), "err");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = initialBtnText;
      }
    }
  });
}

function renderModal(cfg, channels, opts) {
  if (channels.length === 0) {
    return `
      <div class="comm-modal">
        <header><h3>${cfg.icon} ${cfg.title}</h3><button data-close aria-label="Закрыть">×</button></header>
        <div class="comm-body">
          <p class="comm-empty">Не настроен ни один канал типа <strong>«${typeMeta(cfg.channelType).label}»</strong> для Pllato CRM.</p>
          <p>Открой <strong>Контакт-центр</strong> и добавь нужный канал (или попроси админа).</p>
        </div>
        <footer>
          <button class="ghost" data-close>Закрыть</button>
          <button class="primary" data-open-cc>Открыть Контакт-центр</button>
        </footer>
      </div>
    `;
  }
  const showSubject = cfg.activityType === "email";
  const showText = cfg.activityType !== "call";
  const showWaMedia = cfg.activityType === "whatsapp";
  return `
    <div class="comm-modal">
      <header><h3>${cfg.icon} ${cfg.title}</h3><button type="button" data-close aria-label="Закрыть">×</button></header>
      <form>
        <div class="comm-body">
          <div class="comm-msg" data-comm-msg></div>
          <div class="comm-field">
            <label>Кому</label>
            <input type="text" value="${escape(opts.to || "")}" readonly>
            ${opts.contactName ? `<div class="comm-hint">${escape(opts.contactName)}</div>` : ""}
          </div>
          <div class="comm-field">
            <label>Канал</label>
            <select name="channel" required>
              ${channels.map(c => `<option value="${c.id}">${escape(c.name)}</option>`).join("")}
            </select>
          </div>
          ${showSubject ? `<div class="comm-field"><label>Тема</label><input type="text" name="subject" required placeholder="Тема письма"></div>` : ""}
          ${showText ? `<div class="comm-field"><label>${cfg.activityType === "email" ? "Текст письма" : "Сообщение"}</label><textarea name="text" rows="${cfg.activityType === "email" ? 5 : 3}" ${cfg.activityType === "email" ? "required" : ""} placeholder="${cfg.activityType === "whatsapp" ? "Текст сообщения (или оставь пустым и укажи ссылку на файл)..." : "Содержание..."}"></textarea></div>` : ""}
          ${showWaMedia ? `
            <div class="comm-field">
              <label>Ссылка на файл (опционально)</label>
              <input type="url" name="wa_file_url" placeholder="https://.../file.mp4">
              <div class="comm-hint">Фото/видео/аудио/документы до 100MB. Для больших файлов отправляй внешнюю ссылку.</div>
            </div>
            <div class="comm-field">
              <label>Имя файла (опционально)</label>
              <input type="text" name="wa_file_name" placeholder="voice.ogg / photo.jpg / file.pdf">
            </div>
            <div class="comm-field">
              <label><input type="checkbox" name="wa_as_voice"> Отправить как голосовое (recording)</label>
            </div>
          ` : ""}
        </div>
        <footer>
          <button type="button" class="ghost" data-close>Отмена</button>
          <button type="submit" class="primary">${cfg.icon} ${cfg.activityType === "call" ? "Звонить" : "Отправить"}</button>
        </footer>
      </form>
    </div>
  `;
}

// Стили инжектируются один раз
const STYLE_ID = "pllato-comm-style";
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .comm-overlay { position:fixed; inset:0; background:rgba(10,22,40,.6); backdrop-filter:blur(4px); display:grid; place-items:center; padding:24px; z-index:200; }
    .comm-modal { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); box-shadow:0 20px 60px rgba(0,0,0,.4); width:100%; max-width:480px; max-height:90vh; overflow:hidden; display:flex; flex-direction:column; }
    .comm-modal header { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--border-soft); }
    .comm-modal header h3 { margin:0; font-size:15px; font-weight:700; }
    .comm-modal header button[data-close] { width:30px; height:30px; border:0; background:transparent; font-size:20px; line-height:1; color:var(--text-muted); cursor:pointer; border-radius:6px; }
    .comm-modal header button[data-close]:hover { background:var(--surface-2); color:var(--text); }
    .comm-body { padding:18px; overflow-y:auto; flex:1; }
    .comm-msg { display:none; margin:0 0 10px; padding:10px 12px; border-radius:10px; font-size:12.5px; line-height:1.35; }
    .comm-msg.err { display:block; background:rgba(239,68,68,.11); color:#fecaca; border:1px solid rgba(239,68,68,.35); }
    .comm-msg.ok  { display:block; background:rgba(34,197,94,.11); color:#bbf7d0; border:1px solid rgba(34,197,94,.35); }
    .comm-empty { color:var(--text-muted); margin-bottom:12px; }
    .comm-field { margin-bottom:14px; }
    .comm-field label { display:block; font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.08em; margin-bottom:5px; }
    .comm-field input, .comm-field select, .comm-field textarea { width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--surface-2); color:var(--text); font:inherit; font-size:13.5px; }
    .comm-field input[readonly] { background:var(--surface); color:var(--text-muted); cursor:default; }
    .comm-field input:focus, .comm-field select:focus, .comm-field textarea:focus { outline:none; border-color:var(--accent); }
    .comm-hint { font-size:11.5px; color:var(--text-dim); margin-top:4px; }
    .comm-modal footer { display:flex; justify-content:flex-end; gap:10px; padding:12px 18px; border-top:1px solid var(--border-soft); background:var(--surface-2); }
    .comm-modal footer button { padding:9px 16px; border-radius:var(--radius-sm); font:inherit; font-size:13px; font-weight:600; cursor:pointer; border:1px solid var(--border); background:transparent; color:var(--text); }
    .comm-modal footer button:disabled { opacity:.65; cursor:not-allowed; }
    .comm-modal footer button.primary { background:var(--accent); color:var(--brand-navy); border-color:var(--accent); }
    .comm-modal footer button.primary:hover { background:var(--accent-hover); }
    .comm-modal footer button.ghost:hover { background:var(--surface-hover); }
    .comm-btn-group { display:inline-flex; gap:4px; margin-left:6px; vertical-align:middle; }
    .comm-btn { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border:1px solid var(--border); background:var(--surface-2); border-radius:6px; color:var(--text-muted); font-size:11px; cursor:pointer; padding:0; }
    .comm-btn:hover { border-color:var(--accent); color:var(--accent); }
  `;
  document.head.appendChild(s);
}
