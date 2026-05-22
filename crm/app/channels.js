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

// =============================================================================
// CRUD API клиент: создание / редактирование / удаление каналов.
// Все мутации идут через Worker (/channels/save, /channels/delete), после чего
// локальный кеш обновляется через syncChannelsFromWorker().
// =============================================================================

/**
 * Создать или обновить канал. Если payload.id не передан — будет создан новый.
 * @param {Object} payload
 * @param {string}  [payload.id]            — id канала (для update)
 * @param {string}  payload.type            — "binotel" | "greenapi_wa" | "smtp" | ...
 * @param {string}  payload.name            — имя канала
 * @param {boolean} [payload.active=true]   — включён ли
 * @param {Object}  [payload.configPublic]  — публичные настройки
 * @param {Object}  [payload.secrets]       — секреты (api_key, api_token_instance, etc.)
 * @param {Object}  [payload.apps]          — { pllato_crm: true }
 * @returns {Promise<Object>}
 */
export async function saveChannel(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("saveChannel: payload обязателен");
  }
  if (!payload.type) throw new Error("saveChannel: укажите type канала");
  if (!payload.name || !String(payload.name).trim()) {
    throw new Error("saveChannel: укажите name канала");
  }

  const apps = { [APP_ID]: true, ...(payload.apps || {}) };

  const body = {
    type: String(payload.type),
    name: String(payload.name).trim(),
    active: payload.active !== false,
    apps,
    configPublic: payload.configPublic || {},
  };
  if (payload.id) body.id = String(payload.id);
  if (payload.secrets && typeof payload.secrets === "object") {
    body.secrets = payload.secrets;
  }

  const json = await apiFetch("/channels/save", {
    method: "POST",
    body,
  });
  if (!json?.ok) {
    const err = json?.error || json?.message || "Не удалось сохранить канал";
    throw new Error(err);
  }
  try { await syncChannelsFromWorker(); } catch {}
  return json.channel || json;
}

/**
 * Удалить канал по id.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteChannel(id) {
  if (!id) throw new Error("deleteChannel: id обязателен");
  const json = await apiFetch("/channels/delete", {
    method: "POST",
    body: { id: String(id) },
  });
  if (!json?.ok) {
    const err = json?.error || json?.message || "Не удалось удалить канал";
    throw new Error(err);
  }
  try { await syncChannelsFromWorker(); } catch {}
  return true;
}

/**
 * Получить полный объект канала по id (включая секреты, если есть права).
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getChannelFull(id) {
  if (!id) return null;
  const json = await apiFetch("/channels/list?onlyActive=false", { method: "GET" });
  if (!json?.ok || !Array.isArray(json.channels)) return null;
  return json.channels.find((c) => c && c.id === id) || null;
}
