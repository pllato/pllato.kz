// Pllato CRM — действия коммуникации (звонок, WhatsApp, письмо).
// Открывает мини-модалку с выбором канала и логирует активность в Store.
// Реальный вызов через Worker — будет позже, пока пишет alert + activity.

import { Store } from "./store.js";
import { listChannels, typeMeta } from "./channels.js";
import { currentEmployee } from "./employees.js";

const TYPES = {
  call:     { channelType: "binotel",     title: "Позвонить",       activityType: "call",     icon: "📞", verb: "позвонить" },
  whatsapp: { channelType: "greenapi_wa", title: "WhatsApp",        activityType: "whatsapp", icon: "💬", verb: "написать в WhatsApp" },
  email:    { channelType: "smtp",        title: "Отправить письмо", activityType: "email",   icon: "✉",  verb: "отправить письмо" },
};

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
  form?.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(form);
    const channelId = fd.get("channel");
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;
    const text = (fd.get("text") || "").trim();
    const subject = (fd.get("subject") || "").trim();

    // Запись активности (если контекст передан)
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
        authorId: me?.id,
        ts: Date.now(),
      });
    }

    // Простой alert вместо реального API-вызова (Worker появится позже)
    const human = `${cfg.icon} ${cfg.verb} ${opts.contactName || opts.to}\n\nКанал: ${channel.name}\nКуда: ${opts.to}${subject ? "\nТема: " + subject : ""}${text ? "\n\n" + text : ""}\n\n(Реальная отправка появится после деплоя Worker)`;
    alert(human);

    wrap.remove();
    opts.onDone?.();
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
  return `
    <div class="comm-modal">
      <header><h3>${cfg.icon} ${cfg.title}</h3><button type="button" data-close aria-label="Закрыть">×</button></header>
      <form>
        <div class="comm-body">
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
          ${showSubject ? `<div class="comm-field"><label>Тема</label><input type="text" name="subject" placeholder="Тема письма"></div>` : ""}
          ${showText ? `<div class="comm-field"><label>${cfg.activityType === "email" ? "Текст письма" : "Сообщение"}</label><textarea name="text" rows="${cfg.activityType === "email" ? 5 : 3}" placeholder="${cfg.activityType === "whatsapp" ? "Текст сообщения..." : "Содержание..."}"></textarea></div>` : ""}
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
    .comm-empty { color:var(--text-muted); margin-bottom:12px; }
    .comm-field { margin-bottom:14px; }
    .comm-field label { display:block; font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.08em; margin-bottom:5px; }
    .comm-field input, .comm-field select, .comm-field textarea { width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--surface-2); color:var(--text); font:inherit; font-size:13.5px; }
    .comm-field input[readonly] { background:var(--surface); color:var(--text-muted); cursor:default; }
    .comm-field input:focus, .comm-field select:focus, .comm-field textarea:focus { outline:none; border-color:var(--accent); }
    .comm-hint { font-size:11.5px; color:var(--text-dim); margin-top:4px; }
    .comm-modal footer { display:flex; justify-content:flex-end; gap:10px; padding:12px 18px; border-top:1px solid var(--border-soft); background:var(--surface-2); }
    .comm-modal footer button { padding:9px 16px; border-radius:var(--radius-sm); font:inherit; font-size:13px; font-weight:600; cursor:pointer; border:1px solid var(--border); background:transparent; color:var(--text); }
    .comm-modal footer button.primary { background:var(--accent); color:var(--brand-navy); border-color:var(--accent); }
    .comm-modal footer button.primary:hover { background:var(--accent-hover); }
    .comm-modal footer button.ghost:hover { background:var(--surface-hover); }
    .comm-btn-group { display:inline-flex; gap:4px; margin-left:6px; vertical-align:middle; }
    .comm-btn { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border:1px solid var(--border); background:var(--surface-2); border-radius:6px; color:var(--text-muted); font-size:11px; cursor:pointer; padding:0; }
    .comm-btn:hover { border-color:var(--accent); color:var(--accent); }
  `;
  document.head.appendChild(s);
}
