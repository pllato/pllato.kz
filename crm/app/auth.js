const SESSION_KEY = "pllato_session";
const SESSION_SKEW_SEC = 15;
const GIS_WAIT_MS = 10000;

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function apiBase() {
  return String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
}

function ensureApiBase() {
  const base = apiBase();
  if (!base) throw new Error("Не задан window.PLLATO_API_BASE в app.config.js");
  return base;
}

function decodeBase64UrlJson(raw) {
  const base64 = String(raw || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const txt = atob(pad);
  return JSON.parse(txt);
}

function decodeJwtPayload(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  try { return decodeBase64UrlJson(parts[1]); }
  catch { return null; }
}

function readJsonSafe(raw) {
  try { return JSON.parse(raw); }
  catch { return null; }
}

function buildApiError(status, payload, fallback) {
  const message = payload?.error || fallback || `HTTP ${status}`;
  const err = new Error(message);
  err.status = status;
  err.details = payload?.details || null;
  return err;
}

// Форматирует ошибку API для показа пользователю: message + краткие детали (если есть).
export function formatApiError(err) {
  const msg = err?.message || String(err);
  const d = err?.details;
  if (!d) return msg;
  let detailStr = "";
  if (typeof d === "string") detailStr = d;
  else if (d && typeof d === "object") {
    // Достаём наиболее информативные поля Green-API/Binotel:
    // { invokeStatus, ... } | { error, ... } | { message, ... }
    detailStr = d.invokeStatus
      || d.statusReason
      || d.message
      || d.error
      || (() => { try { return JSON.stringify(d).slice(0, 500); } catch { return String(d); } })();
  }
  return detailStr ? `${msg}\n\nДетали: ${detailStr}` : msg;
}

function dispatchAuthExpired() {
  try {
    window.dispatchEvent(new CustomEvent("pllato:auth-expired"));
  } catch {}
}

function saveSessionFromAuthResponse(data) {
  const payload = decodeJwtPayload(data?.token);
  const exp = Number(data?.exp || payload?.exp || 0);
  const user = data?.user && typeof data.user === "object"
    ? data.user
    : {
      id: payload?.sub || null,
      email: payload?.email || "",
      name: payload?.name || "",
      isAdmin: Boolean(payload?.isAdmin),
      isSuperAdmin: Boolean(payload?.isSuperAdmin),
      apps: payload?.apps || {},
    };
  const session = {
    token: String(data?.token || ""),
    exp,
    user,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function validateSession(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  const token = String(candidate.token || "").trim();
  const exp = Number(candidate.exp || 0);
  const user = candidate.user && typeof candidate.user === "object" ? candidate.user : null;
  if (!token || !exp || !user) return null;
  if (exp <= nowSec() + SESSION_SKEW_SEC) return null;
  return { token, exp, user };
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  const parsed = readJsonSafe(raw);
  const session = validateSession(parsed);
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return session;
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  try { window.google?.accounts?.id?.disableAutoSelect(); } catch {}
}

export async function apiFetch(path, {
  method = "GET",
  body = undefined,
  headers = {},
  auth = true,
} = {}) {
  const base = ensureApiBase();
  const finalHeaders = { ...headers };
  if (auth) {
    const session = getSession();
    if (!session?.token) throw new Error("Сессия не найдена. Выполни вход снова.");
    finalHeaders.Authorization = `Bearer ${session.token}`;
  }

  let payloadBody = body;
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
    payloadBody = finalHeaders["Content-Type"].includes("application/json")
      ? JSON.stringify(body)
      : body;
  }

  const res = await fetch(base + path, {
    method,
    headers: finalHeaders,
    body: payloadBody,
  });

  const text = await res.text();
  const data = text ? readJsonSafe(text) : null;

  if (!res.ok) {
    if (auth && res.status === 401) {
      signOut();
      dispatchAuthExpired();
    }
    throw buildApiError(res.status, data, `HTTP ${res.status}`);
  }
  if (data && data.ok === false) {
    if (auth && res.status === 401) {
      signOut();
      dispatchAuthExpired();
    }
    throw buildApiError(res.status || 400, data, "Ошибка API");
  }
  return data || { ok: true };
}

async function waitForGoogleIdentity(timeoutMs = GIS_WAIT_MS) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (window.google?.accounts?.id) return window.google.accounts.id;
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  throw new Error("Google Identity Services не загрузился. Обнови страницу и попробуй снова.");
}

async function exchangeGoogleCredential(credential) {
  const data = await apiFetch("/auth/google", {
    method: "POST",
    body: { credential },
    auth: false,
  });
  if (!data?.token) throw new Error(data?.error || "Worker не вернул токен");
  return saveSessionFromAuthResponse(data);
}

export async function mountGoogleButton(target, {
  onStatus = null,
  onDone = null,
  onError = null,
} = {}) {
  if (!target) throw new Error("Не передан контейнер для кнопки Google");
  const clientId = String(window.PLLATO_GOOGLE_CLIENT_ID || "").trim();
  if (!clientId) throw new Error("Не задан window.PLLATO_GOOGLE_CLIENT_ID в app.config.js");

  onStatus?.("Подготавливаем вход Google...");
  const accountsId = await waitForGoogleIdentity();

  let consumed = false;
  const finish = async (response) => {
    if (consumed) return;
    consumed = true;
    try {
      onStatus?.("Проверяем доступ...");
      const session = await exchangeGoogleCredential(response.credential);
      onDone?.(session);
    } catch (e) {
      consumed = false;
      onError?.(e);
    }
  };

  accountsId.initialize({
    client_id: clientId,
    callback: finish,
    auto_select: false,
    cancel_on_tap_outside: true,
  });
  target.innerHTML = "";
  accountsId.renderButton(target, {
    theme: "outline",
    size: "large",
    text: "signin_with",
    shape: "pill",
    width: 320,
    locale: "ru",
  });
  onStatus?.("");
}
