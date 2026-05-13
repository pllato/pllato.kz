// Pllato CRM — каналы связи.
// Источник правды — Firebase /channels (управляется в pllato.kz/contact-center.html).
// Здесь — кэш + синхронный API для view.

const COLLECTION = "pllato_channels_cache";
const FB_SYNC_FLAG = "pllato_channels_fb_sync";

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
  return localStorage.getItem(FB_SYNC_FLAG) === "1";
}

/**
 * Полная синхронизация из Firebase.
 * @param {object} fb — { db, dbm } из app.js (инициализированный Firebase)
 */
export async function syncChannelsFromFirebase(fb) {
  if (!fb?.db || !fb?.dbm) return;
  try {
    const snap = await fb.dbm.get(fb.dbm.ref(fb.db, "channels"));
    const data = snap.exists() ? snap.val() : {};
    // Фильтруем то, что доступно нашему приложению (pllato_crm)
    const arr = Object.entries(data)
      .filter(([id, ch]) => ch && ch.apps && ch.apps[APP_ID])
      .map(([id, ch]) => ({
        id,
        type: ch.type,
        name: ch.name || "",
        active: ch.active !== false,
        // ВАЖНО: config.api_secret/pass/tokens НЕ кэшируем во frontend.
        // Здесь оставляем только публичные/безопасные поля.
        public: pickPublic(ch.type, ch.config || {}),
        apps: ch.apps,
      }));
    localStorage.setItem(COLLECTION, JSON.stringify(arr));
    localStorage.setItem(FB_SYNC_FLAG, "1");
  } catch (e) {
    // тихо — пользоваться кэшем если есть
    console.warn("channels sync failed:", e);
  }
}

// Возвращает только безопасные поля для отображения в UI (без секретов)
function pickPublic(type, config) {
  if (type === "binotel") {
    return { default_inner: config.default_inner || null };
  }
  if (type === "greenapi_wa") {
    return { phone_number: config.phone_number || null };
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
