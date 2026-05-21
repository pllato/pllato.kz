// Pllato CRM — Email/password authentication.
// PBKDF2-SHA256 хеширование через Web Crypto API, session в localStorage,
// интеграция с существующими employees.

import { Store } from "./store.js";
import { listEmployees } from "./employees.js";

const SESSION_KEY = "pllato_session";
const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 дней

// === Hashing ===

function bytesToBase64(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function hashPassword(password, saltBase64 = null) {
  if (!password || password.length < 4) throw new Error("Пароль слишком короткий");
  const enc = new TextEncoder();
  const salt = saltBase64 ? base64ToBytes(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial, 256
  );
  return {
    hash: bytesToBase64(new Uint8Array(bits)),
    salt: bytesToBase64(salt),
  };
}

export async function verifyPassword(password, hashBase64, saltBase64) {
  if (!hashBase64 || !saltBase64) return false;
  try {
    const result = await hashPassword(password, saltBase64);
    return result.hash === hashBase64;
  } catch (e) {
    return false;
  }
}

// === Generate temporary password ===

export function generateTempPassword(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const chars = new Uint8Array(len);
  crypto.getRandomValues(chars);
  return Array.from(chars).map(c => alphabet[c % alphabet.length]).join("");
}

// === Session ===

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() - session.createdAt > SESSION_TTL_MS) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setSession(employee) {
  const session = {
    employeeId: employee.id,
    email: employee.email,
    name: employee.name,
    createdAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated() {
  const session = getSession();
  if (!session) return false;
  // Проверяем что сотрудник всё ещё существует в Store
  const employees = listEmployees();
  return employees.some(e => e.id === session.employeeId);
}

// === Login by email ===

export async function loginByEmail(email, password) {
  if (!email || !password) return { ok: false, error: "Заполни email и пароль" };

  const employees = listEmployees();
  const employee = employees.find(e =>
    String(e.email || "").toLowerCase().trim() === String(email).toLowerCase().trim()
  );
  if (!employee) return { ok: false, error: "Пользователь не найден" };
  if (!employee.passwordHash || !employee.passwordSalt) {
    return { ok: false, error: "У этого пользователя не задан пароль" };
  }

  const valid = await verifyPassword(password, employee.passwordHash, employee.passwordSalt);
  if (!valid) return { ok: false, error: "Неверный пароль" };

  // Обновляем lastLoginAt и помечаем isCurrent
  Store.update("employees", employee.id, {
    lastLoginAt: Date.now(),
  });

  setSession(employee);
  return { ok: true, employee, forcePasswordChange: !!employee.forcePasswordChange };
}

// === Change password ===

export async function changePassword(employeeId, oldPassword, newPassword) {
  const employee = Store.get("employees", employeeId);
  if (!employee) return { ok: false, error: "Сотрудник не найден" };

  if (employee.passwordHash) {
    const valid = await verifyPassword(oldPassword, employee.passwordHash, employee.passwordSalt);
    if (!valid) return { ok: false, error: "Старый пароль неверен" };
  }

  if (newPassword.length < 6) return { ok: false, error: "Минимум 6 символов" };

  const { hash, salt } = await hashPassword(newPassword);
  Store.update("employees", employeeId, {
    passwordHash: hash,
    passwordSalt: salt,
    forcePasswordChange: false,
    passwordChangedAt: Date.now(),
  });

  return { ok: true };
}

// === Helper для создания сотрудника с паролем ===

export async function setEmployeePassword(employeeId, password) {
  const { hash, salt } = await hashPassword(password);
  Store.update("employees", employeeId, {
    passwordHash: hash,
    passwordSalt: salt,
    forcePasswordChange: true,
    passwordChangedAt: Date.now(),
  });
}

export function logout() {
  clearSession();
  location.reload();
}
