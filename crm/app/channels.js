// Pllato CRM — каналы связи.
// Источник правды: Cloudflare Worker (/channels/*), fallback: Firebase.
// Здесь — кэш + синхронный API для view.

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

/**
 * Полная синхронизация каналов.
 * Сначала пытаемся читать из Cloudflare Worker, fallback — Firebase.
 * @param {object} fb — { db, dbm } из app.js (инициализированный Firebase)
 */
export async function syncChannelsFromFirebase(fb) {
  const fromWorker = await syncChannelsFromWorker(fb);
  if (fromWorker) return;

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
    localStorage.setItem(SYNC_FLAG, "1");
  } catch (e) {
    // тихо — пользоваться кэшем если есть
    console.warn("channels sync failed:", e);
  }
}

async function syncChannelsFromWorker(fb) {
  const base = String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
  if (!base) return false;

  try {
    const user = fb?.authInstance?.currentUser;
    if (!user) return false;
    const token = await user.getIdToken();

    const res = await fetch(base + "/channels/list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ onlyActive: false }),
    });
    const json = await res.json();
    if (!res.ok || !json?.ok || !Array.isArray(json.channels)) return false;

    const arr = json.channels
      .filter((ch) => ch && ch.apps && ch.apps[APP_ID])
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
