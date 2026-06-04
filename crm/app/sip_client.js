// app/sip_client.js — обёртка для shared SIP module.
//
// Shared module хостится через ELC worker (pllato-elc-worker) и
// шарится между ELC team.html и Aminamed CRM. Бэкенд-эндпоинты SIP
// у Aminamed свои — в pllato-comm worker (/sip/token).
//
// Использование:
//   import { ensureSipReady, placeCall } from "./sip_client.js";
//   ensureSipReady();          // pre-warm после login
//   await placeCall(phone, { contactId, contactName });
//
// Debug: window.aminSip.{call,hangup,mute,hold,dtmf,openDialer,state}

import { apiFetch, getSession } from "./auth.js";

const SIP_CLIENT_URL = "https://pllato-elc-worker.uurraa.workers.dev/sip-client.js";

function commBase() {
  return String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
}

let _sipClientPromise = null;

async function getSipClient() {
  if (_sipClientPromise) return _sipClientPromise;
  _sipClientPromise = (async () => {
    const mod = await import(SIP_CLIENT_URL);
    const base = commBase();
    if (!base) throw new Error("PLLATO_API_BASE не задан");

    return await mod.createSipClient({
      tokenEndpoint: `${base}/sip/token`,
      // Логирование звонков и история — пока не интегрированы со схемой
      // call_logs Aminamed (она заточена под cold-call campaigns).
      // TODO: maps shared schema → existing call_logs или новая click_to_call_log таблица.
      callEventEndpoint: null,
      callLogEndpoint: null,
      getAuthToken: async () => {
        const sess = getSession();
        const token = sess?.token || sess?.accessToken;
        if (!token) throw new Error("Не авторизован — нет JWT");
        return `Bearer ${token}`;
      },
      // Богатый резолвер контакта по номеру: имя+компания + до 3 сделок + до 3 активностей.
      // Всё берём из локального Store (он уже загружен в памяти tenant'а) —
      // быстрее чем worker-запрос, и работает offline.
      resolveContact: async (phone) => {
        try {
          const { Store } = await import("./store.js");
          const digits = String(phone).replace(/\D/g, "");
          const tail10 = digits.slice(-10);
          const contacts = Store.list ? Store.list("contacts") : (Store?.state?.contacts || []);
          const found = contacts.find((c) => {
            const cd = String(c.phone || "").replace(/\D/g, "");
            return cd && (cd === digits
              || (tail10 && cd.endsWith(tail10))
              || (cd.length >= 10 && digits.endsWith(cd.slice(-10))));
          });
          if (!found) return null;

          // Активные сделки контакта (не trashed/archived) — до 3
          const deals = (Store.list ? Store.list("deals") : [])
            .filter((d) => d.contactId === found.id
              && d.deletedAt == null
              && d.status !== "archived"
              && d.status !== "trashed")
            .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
            .slice(0, 3)
            .map((d) => ({
              id: d.id,
              title: d.title || "(без названия)",
              stage: d.stage || "",
              amount: d.amount || null,
              currency: d.currency || "KZT",
              closed: d.status === "won" || d.status === "lost",
            }));

          // Активности: deal_activities (по dealId) + contact_activities (по contactId), до 3 последних
          const dealIds = new Set(deals.map((d) => d.id));
          const dealActs = (Store.list ? Store.list("deal_activities") : [])
            .filter((a) => a.dealId && dealIds.has(a.dealId));
          const directActs = (Store.list ? Store.list("contact_activities") : [])
            .filter((a) => a.contactId === found.id);
          const activities = [...dealActs, ...directActs]
            .sort((a, b) => (b.ts || b.createdAt || 0) - (a.ts || a.createdAt || 0))
            .slice(0, 3)
            .map((a) => {
              const icon = a.type === "whatsapp" ? "💬"
                : a.type === "call" ? (a.direction === "in" ? "📥" : "📤")
                : a.type === "note" ? "📝" : "•";
              const dateRaw = a.ts || a.createdAt || null;
              const date = dateRaw ? new Date(dateRaw).toISOString() : null;
              let desc = "";
              if (a.type === "whatsapp") desc = `WhatsApp: ${String(a.text || a.preview || "").slice(0, 60)}`;
              else if (a.type === "call") {
                const dur = a.durationSec > 0 ? ` ${Math.floor(a.durationSec/60)}:${String(a.durationSec%60).padStart(2,"0")}` : "";
                desc = `${a.direction === "in" ? "Входящий" : "Исходящий"}${dur}`;
              } else if (a.type === "note") desc = `Заметка: ${String(a.text || "").slice(0, 60)}`;
              else desc = a.title || a.text || a.type || "";
              return { type: a.type, icon, date, description: desc };
            });

          return {
            id: found.id,
            name: found.name || null,
            company: found.company || "",
            deals,
            activities,
          };
        } catch (e) {
          console.warn("[sip] resolveContact failed:", e);
          return null;
        }
      },
      // Открыть карточку контакта через hash-роутинг (popup звонка остаётся видимым)
      onOpenContact: (contactId) => {
        if (!contactId) return;
        try { window.location.hash = `#contacts/${contactId}`; }
        catch (e) { console.warn("[sip] open contact failed:", e); }
      },
      // Клик по сделке в popup — открыть карточку сделки
      onOpenDeal: (dealId) => {
        if (!dealId) return;
        try { window.location.hash = `#crm/${dealId}`; }
        catch (e) { console.warn("[sip] open deal failed:", e); }
      },
      debug: false,
    });
  })();
  return _sipClientPromise;
}

// Pre-warm — вызвать после успешного логина чтобы SIP UA уже был
// зарегистрирован к моменту первого звонка (мгновенный outbound).
let _preWarmStarted = false;
export function ensureSipReady() {
  if (_preWarmStarted) return;
  _preWarmStarted = true;
  getSipClient().catch((e) => {
    console.warn("[SIP] pre-warm failed:", e?.message || e);
  });
}

export async function placeCall(phone, meta = {}) {
  if (!phone) {
    alert("Нет номера телефона");
    return;
  }
  try {
    const sip = await getSipClient();
    await sip.call(phone, meta);
  } catch (e) {
    console.error("[SIP] placeCall failed:", e);
    alert("Не удалось начать звонок: " + (e?.message || e));
  }
}

// Helper для inline-кнопки 📞 рядом с phone в любом UI
export function callButtonHtml(phone, opts = {}) {
  if (!phone) return "";
  const dataset = Object.entries(opts)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `data-call-${k}="${String(v).replace(/"/g, "&quot;")}"`)
    .join(" ");
  const safePhone = String(phone).replace(/"/g, "&quot;");
  return `<button type="button" class="sipc-call-btn" data-call-phone="${safePhone}" ${dataset} title="Позвонить">📞</button>`;
}

// Делегированный listener — клик на любую .sipc-call-btn вызывает placeCall.
// Подключается один раз глобально.
let _delegateInstalled = false;
export function installCallDelegate() {
  if (_delegateInstalled) return;
  _delegateInstalled = true;
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".sipc-call-btn");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    placeCall(btn.dataset.callPhone, {
      contactId:   btn.dataset.callContactid || null,
      dealId:      btn.dataset.callDealid || null,
      contactName: btn.dataset.callContactname || null,
    });
  });
  // Минимальный стиль для кнопки (не конфликтует с темой)
  const style = document.createElement("style");
  style.textContent = `
    .sipc-call-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; padding: 0; margin-left: 6px;
      background: var(--accent, #3b82f6); color: #fff;
      border: none; border-radius: 50%; font-size: 12px; cursor: pointer;
      vertical-align: middle; line-height: 1; transition: transform .08s, opacity .08s;
    }
    .sipc-call-btn:hover { transform: scale(1.1); }
    .sipc-call-btn:active { transform: scale(.95); }
  `;
  document.head.appendChild(style);
}

// Глобальный debug API
window.aminSip = new Proxy({}, {
  get(_, prop) {
    return (...args) => getSipClient().then((c) => {
      const v = c[prop];
      return typeof v === "function" ? v.apply(c, args) : v;
    });
  },
});
