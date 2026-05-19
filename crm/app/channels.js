// Pllato CRM — каналы связи.
// Источник правды: Cloudflare Worker (/channels/*).
// Здесь — кэш + синхронный API для view.
import { apiFetch } from "./auth.js";

const COLLECTION = "pllato_channels_cache";
const SYNC_FLAG = "pllato_channels_sync";

// Этот app — pllato_crm (для фильтрации каналов по apps[pllato_crm])
const APP_ID = "pllato_crm";

const TYPE_META = {
  binotel:     { icon: "📞", label: "Телефония (Binotel)" },
  greenapi_wa: { icon: "💬", label: "WhatsApp (Green-API)" },
  smtp:        { icon: "✉",  label: "Email (SMTP)" },
  instagram:   { icon: "📷", label: "Instagram" },
  facebook:    { icon: "f",  label: "Facebook" },
};

export function typeMeta(type) {
  return TYPE_META[type] || { icon: "•", label: type };
}

export function listChannels({ onlyActive = true, type = null } = {}) {
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem(COLLECTION) || "[]"); } catch {}
  if (onlyActive) arr = arr.filter(c => c.active !== false);
  if (type) arr = arr.filter(c => c.type === type);
  return arr;
}

export function isChannelsSynced() {
  return localStorage.getItem(SYNC_FLAG) === "1";
}

export async function syncChannelsFromWorker() {
  const base = String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
  if (!base) return false;

  try {
    const json = await apiFetch("/channels/list?onlyActive=false", { method: "GET" });
    if (!json?.ok || !Array.isArray(json.channels)) return false;

    const arr = json.channels
      .filter((ch) => ch && !(ch.apps && ch.apps[APP_ID] === false))
      .map((ch) => ({
        id: ch.id,
        type: ch.type,
        name: ch.name || "",
        active: ch.active !== false,
        public: pickPublic(ch.type, ch.config || ch.public || {}),
        apps: ch.apps || {},
      }));

    localStorage.setItem(COLLECTION, JSON.stringify(arr));
    localStorage.setItem(SYNC_FLAG, "1");
    return true;
  } catch {
    return false;
  }
}

// Возвращает только безопасные поля для отображения в UI (без секретов)
function pickPublic(type, config) {
  if (type === "binotel") {
    return { default_inner: config.default_inner || null };
  }
  if (type === "greenapi_wa") {
    return {
      phone_number: config.phone_number || null,
      api_url: config.api_url || null,
      id_instance: config.id_instance || null,
    };
  }
  if (type === "smtp") {
    return { host: config.host || null, port: config.port || null, user: config.user || null, from_name: config.from_name || null };
  }
  if (type === "instagram") {
    return { account: config.account || null };
  }
  if (type === "facebook") {
    return { page_id: config.page_id || null };
  }
  return {};
}
