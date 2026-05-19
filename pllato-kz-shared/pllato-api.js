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

function parseJsonSafe(raw) {
  try { return JSON.parse(raw); }
  catch { return null; }
}

function decodeBase64UrlJson(raw) {
  const base64 = String(raw || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const text = atob(padded);
  return JSON.parse(text);
}

function decodeJwtPayload(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  try { return decodeBase64UrlJson(parts[1]); }
  catch { return null; }
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

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  const parsed = parseJsonSafe(raw);
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

export function requireSession({ redirectTo = "login.html" } = {}) {
  const session = getSession();
  if (session) return session;
  if (redirectTo) {
    window.location.href = redirectTo;
  }
  return null;
}

export function requireAdmin({ redirectTo = "login.html" } = {}) {
  const session = requireSession({ redirectTo });
  if (!session) return null;
  if (session.user?.isAdmin || session.user?.isSuperAdmin) return session;
  if (redirectTo) window.location.href = redirectTo;
  return null;
}

export function requireSuperAdmin({ redirectTo = "login.html" } = {}) {
  const session = requireSession({ redirectTo });
  if (!session) return null;
  if (session.user?.isSuperAdmin) return session;
  if (redirectTo) window.location.href = redirectTo;
  return null;
}

function buildApiError(status, payload, fallback = "") {
  const message = payload?.error || fallback || `HTTP ${status}`;
  const err = new Error(message);
  err.status = status;
  err.details = payload?.details || null;
  return err;
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
    if (!session?.token) throw new Error("Сессия не найдена. Выполни вход заново.");
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
  const data = text ? parseJsonSafe(text) : null;
  if (!res.ok) {
    if (auth && res.status === 401) {
      signOut();
    }
    throw buildApiError(res.status, data, `HTTP ${res.status}`);
  }
  if (data && data.ok === false) {
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
