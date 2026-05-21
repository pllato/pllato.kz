// Pllato CRM — Email/password authentication через серверный endpoint.
// После успешного email-login сохраняет JWT в `pllato_session` (та же что Google)
// → весь существующий Store sync + apiFetch работают как обычно.

import { apiFetch } from "./auth.js";

function apiBase() {
  return String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
}

const SESSION_KEY = "pllato_session";

function persistSession(token, user, exp) {
  const payload = {
    token,
    exp: Number(exp) || (Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60),
    user: user || null,
    via: "email",
    savedAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

/**
 * Email/password login через Worker endpoint.
 * При успехе сохраняет JWT в pllato_session — Store sync начинает работать.
 */
export async function loginByEmail(email, password) {
  if (!email || !password) return { ok: false, error: "Заполни email и пароль" };

  const base = apiBase();
  if (!base) return { ok: false, error: "API не настроен (PLLATO_API_BASE)" };

  try {
    const res = await fetch(`${base}/api/auth/email-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(email).trim().toLowerCase(),
        password: String(password),
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error || `HTTP ${res.status}` };
    }

    persistSession(data.token, data.user, data.exp);
    return {
      ok: true,
      employee: data.user,
      forcePasswordChange: !!data.forcePasswordChange,
    };
  } catch (e) {
    return { ok: false, error: e.message || "Ошибка соединения" };
  }
}

/**
 * Установка пароля сотрудника (требует Google session как admin).
 */
export async function setEmployeePassword(emailOrId, password) {
  if (!password || password.length < 6) throw new Error("Минимум 6 символов");

  // Если передали id — найдём employee object из listEmployees
  let email, employee = null;
  if (typeof emailOrId === "string" && emailOrId.includes("@")) {
    email = String(emailOrId).trim().toLowerCase();
  } else {
    const { listEmployees } = await import("./employees.js");
    employee = listEmployees().find(e => e.id === emailOrId);
    email = String(employee?.email || "").trim().toLowerCase();
  }
  if (!email) throw new Error("У сотрудника не задан email");

  // Передаём доп данные чтобы Worker мог создать user в D1 если ещё нет
  const body = { email, password };
  if (employee) {
    body.name = employee.name || "";
    body.lastName = employee.lastName || "";
    body.position = employee.position || "";
    body.role = employee.role || "";
  }

  const data = await apiFetch("/api/auth/set-password", {
    method: "POST",
    body,
  });
  if (!data?.ok) throw new Error(data?.error || "Не удалось установить пароль");
  return true;
}

/**
 * Смена своего пароля (требует свою же session).
 */
export async function changePasswordToNew(employeeId, newPassword) {
  if (!newPassword || newPassword.length < 6) throw new Error("Минимум 6 символов");
  const data = await apiFetch("/api/auth/change-password", {
    method: "POST",
    body: { password: newPassword },
  });
  if (!data?.ok) throw new Error(data?.error || "Не удалось сменить пароль");
  return true;
}

/**
 * Проверка есть ли хоть один пользователь с паролем — чтобы показать предупреждение в login.
 * Запрашиваем у Worker (публичный endpoint).
 */
export async function hasAnyPasswordsAsync() {
  try {
    const base = apiBase();
    if (!base) return true; // не показываем предупреждение если API недоступен
    const res = await fetch(`${base}/api/auth/has-any-passwords`);
    if (!res.ok) return true;
    const data = await res.json();
    return !!data?.hasAny;
  } catch {
    return true;
  }
}

// === Простой helper для логаута ===

export async function logoutAll() {
  localStorage.removeItem(SESSION_KEY);
  try {
    const { signOut } = await import("./auth.js");
    if (typeof signOut === "function") signOut();
  } catch {}
  location.reload();
}

// Совместимость со старым кодом

export function getEmailSession() {
  try {
    const raw = localStorage.getItem("pllato_session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.via === "email") return session;
    return null;
  } catch { return null; }
}

export function generateTempPassword(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const chars = new Uint8Array(len);
  crypto.getRandomValues(chars);
  return Array.from(chars).map(c => alphabet[c % alphabet.length]).join("");
}
