// Pllato CRM — UTM atribution module.
// Phase 1+2: захват UTM из URL, хранение в localStorage, обогащение сделок/контактов.
// Phase 3 (отдельно): Worker API endpoint для внешних лидов с aminamed.kz.
// Phase 4 (отдельно): UTM-аналитика как отчёт.

const STORAGE_KEY = "pllato_utm";
const STORAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней

// Поля UTM (без префикса utm_)
export const UTM_FIELDS = ["source", "medium", "campaign", "content", "term"];

// Предустановленные источники с цветами для бейджей
export const UTM_SOURCE_PRESETS = {
  google:     { label: "Google",    color: "#4285F4", icon: "G"  },
  facebook:   { label: "Facebook",  color: "#1877F2", icon: "f"  },
  instagram:  { label: "Instagram", color: "#E4405F", icon: "📷" },
  whatsapp:   { label: "WhatsApp",  color: "#25D366", icon: "💬" },
  telegram:   { label: "Telegram",  color: "#0088CC", icon: "✈"  },
  call:       { label: "Звонок",    color: "#8B5CF6", icon: "☎"  },
  repsly:     { label: "Repsly",    color: "#FF6B35", icon: "R"  },
  direct:     { label: "Прямой",    color: "#6B7280", icon: "→"  },
  referral:   { label: "Реферал",   color: "#10B981", icon: "↗"  },
  email:      { label: "Email",     color: "#F59E0B", icon: "✉"  },
  organic:    { label: "Поиск",     color: "#22C55E", icon: "🔍" },
  "":         { label: "Без метки", color: "#9CA3AF", icon: "—"  },
};

export const UTM_MEDIUM_PRESETS = {
  cpc:      "Платная реклама (CPC)",
  organic:  "Органический поиск",
  social:   "Соцсети",
  email:    "Email-рассылка",
  referral: "Реферал",
  phone:    "Телефон",
  display:  "Баннеры",
  affiliate:"Партнёры",
  "":       "—",
};

// === Capture from URL ===

export function captureUtmFromUrl() {
  try {
    // Парсим URL params + hash params (#crm?utm_source=X)
    const params = new URLSearchParams(window.location.search);
    // Также пробуем достать из hash (если ?utm_* стоят после #)
    const hashIdx = window.location.hash.indexOf("?");
    if (hashIdx >= 0) {
      const hashParams = new URLSearchParams(window.location.hash.substring(hashIdx + 1));
      for (const [k, v] of hashParams) {
        if (!params.has(k)) params.set(k, v);
      }
    }

    const captured = {};
    let hasAny = false;
    for (const field of UTM_FIELDS) {
      const v = params.get(`utm_${field}`);
      if (v) {
        captured[field] = String(v).slice(0, 200).trim();
        hasAny = true;
      }
    }

    if (!hasAny) return null;

    // Дополнительно сохраняем referrer и landing page
    captured.referrer = document.referrer || "";
    captured.landingPage = window.location.href;
    captured.capturedAt = Date.now();

    // Сохраняем — first touch не перезаписываем, last touch обновляем
    const existing = getStoredUtm();
    const merged = existing ? {
      ...captured,
      firstTouch: existing.firstTouch || existing.capturedAt,
      firstTouchSource: existing.firstTouchSource || existing.source,
    } : {
      ...captured,
      firstTouch: captured.capturedAt,
      firstTouchSource: captured.source,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn("[UTM] capture failed:", e);
    return null;
  }
}

export function getStoredUtm() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Проверка TTL — старые UTM выкидываем
    if (parsed.capturedAt && Date.now() - parsed.capturedAt > STORAGE_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

export function clearStoredUtm() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

// === Обогащение объектов ===

/**
 * Заполняет объект сделки/контакта UTM-полями из localStorage.
 * Использует префикс utmXxx для плоских полей.
 * Если у объекта уже есть utmSource — не перезаписывает (first-touch wins).
 */
export function enrichWithStoredUtm(data = {}, opts = {}) {
  const { overwrite = false } = opts;
  const stored = getStoredUtm();
  if (!stored) return data;

  const out = { ...data };
  for (const field of UTM_FIELDS) {
    const key = `utm${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    if (overwrite || !out[key]) {
      if (stored[field]) out[key] = stored[field];
    }
  }
  // Доп. поля
  if (overwrite || !out.utmReferrer) {
    if (stored.referrer) out.utmReferrer = stored.referrer;
  }
  if (overwrite || !out.utmLandingPage) {
    if (stored.landingPage) out.utmLandingPage = stored.landingPage;
  }
  if (overwrite || !out.utmFirstTouchAt) {
    if (stored.firstTouch) out.utmFirstTouchAt = stored.firstTouch;
  }
  return out;
}

/**
 * Хелпер для предустановленных источников (например когда создаём сделку из звонка).
 */
export function utmForSource(source, medium = "") {
  return {
    utmSource: source,
    utmMedium: medium,
    utmCampaign: "",
    utmContent: "",
    utmTerm: "",
  };
}

// === Helpers для UI ===

export function getUtmFromObject(obj = {}) {
  return {
    source: obj.utmSource || "",
    medium: obj.utmMedium || "",
    campaign: obj.utmCampaign || "",
    content: obj.utmContent || "",
    term: obj.utmTerm || "",
    referrer: obj.utmReferrer || "",
    landingPage: obj.utmLandingPage || "",
    firstTouchAt: obj.utmFirstTouchAt || null,
  };
}

export function hasAnyUtm(obj = {}) {
  return !!(obj.utmSource || obj.utmMedium || obj.utmCampaign);
}

export function getSourcePreset(source) {
  const key = String(source || "").toLowerCase().trim();
  return UTM_SOURCE_PRESETS[key] || { label: source || "—", color: "#6B7280", icon: "·" };
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/**
 * Компактный бейдж источника — для kanban-карточки и строки списка.
 */
export function renderUtmBadge(obj) {
  const utm = getUtmFromObject(obj);
  if (!utm.source) return "";
  const preset = getSourcePreset(utm.source);
  return `<span class="utm-badge" style="background:${preset.color}1a;color:${preset.color};border:1px solid ${preset.color}33" title="Источник: ${escapeHtml(utm.source)}${utm.campaign ? " · " + escapeHtml(utm.campaign) : ""}">
    <span class="utm-badge-icon">${preset.icon}</span>
    <span class="utm-badge-text">${escapeHtml(preset.label)}</span>
  </span>`;
}

/**
 * Полная секция «Источник» для формы сделки/контакта.
 */
export function renderUtmFormSection(obj = {}) {
  const utm = getUtmFromObject(obj);
  const sourceOptions = Object.entries(UTM_SOURCE_PRESETS)
    .filter(([k]) => k !== "")
    .map(([k, v]) => `<option value="${k}" ${utm.source === k ? "selected" : ""}>${escapeHtml(v.label)}</option>`)
    .join("");
  const mediumOptions = Object.entries(UTM_MEDIUM_PRESETS)
    .filter(([k]) => k !== "")
    .map(([k, v]) => `<option value="${k}" ${utm.medium === k ? "selected" : ""}>${escapeHtml(v)}</option>`)
    .join("");

  return `
    <div class="field field-wide utm-section">
      <div class="utm-section-header">
        <strong>📍 Источник лида</strong>
        ${utm.source ? renderUtmBadge(obj) : ""}
      </div>
      <div class="utm-grid">
        <label class="field">
          <span>Источник (utm_source)</span>
          <select name="utmSource">
            <option value="">— не указан —</option>
            ${sourceOptions}
          </select>
        </label>
        <label class="field">
          <span>Канал (utm_medium)</span>
          <select name="utmMedium">
            <option value="">— не указан —</option>
            ${mediumOptions}
          </select>
        </label>
        <label class="field">
          <span>Кампания (utm_campaign)</span>
          <input type="text" name="utmCampaign" value="${escapeHtml(utm.campaign)}" placeholder="например: summer_sale_2026">
        </label>
        <label class="field">
          <span>Креатив (utm_content)</span>
          <input type="text" name="utmContent" value="${escapeHtml(utm.content)}" placeholder="например: banner_320x100">
        </label>
        <label class="field">
          <span>Ключ (utm_term)</span>
          <input type="text" name="utmTerm" value="${escapeHtml(utm.term)}" placeholder="ключевое слово">
        </label>
      </div>
      ${utm.referrer || utm.landingPage ? `
        <details class="utm-meta">
          <summary>Дополнительно</summary>
          ${utm.referrer ? `<div class="utm-meta-row"><span class="utm-meta-label">Откуда пришёл:</span> <span>${escapeHtml(utm.referrer)}</span></div>` : ""}
          ${utm.landingPage ? `<div class="utm-meta-row"><span class="utm-meta-label">Первая страница:</span> <span>${escapeHtml(utm.landingPage)}</span></div>` : ""}
          ${utm.firstTouchAt ? `<div class="utm-meta-row"><span class="utm-meta-label">Первый контакт:</span> <span>${new Date(utm.firstTouchAt).toLocaleString("ru-RU")}</span></div>` : ""}
        </details>
      ` : ""}
    </div>
  `;
}

/**
 * Читает UTM-поля из FormData (вызывается в submit handler сделки).
 */
export function readUtmFromFormData(fd) {
  const out = {};
  for (const field of UTM_FIELDS) {
    const key = `utm${field.charAt(0).toUpperCase()}${field.slice(1)}`;
    const v = fd.get(key);
    if (v !== null) out[key] = String(v || "").trim();
  }
  return out;
}

/**
 * Список всех уникальных источников из существующих сделок (для фильтра).
 */
export function listKnownSources(deals = []) {
  const set = new Set();
  deals.forEach((d) => { if (d.utmSource) set.add(String(d.utmSource).toLowerCase()); });
  return Array.from(set).sort();
}
