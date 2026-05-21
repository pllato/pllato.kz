// Pllato CRM — Local email/password authentication v2.
// Пароли хранятся в ОТДЕЛЬНОЙ коллекции "passwords" (Store), 
// чтобы synchronizация employees не затирала их.

import { Store } from "./store.js";
import { listEmployees } from "./employees.js";

const EMAIL_SESSION_KEY = "pllato_email_session";
const PASSWORDS_COLLECTION = "passwords";
const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

// === Hashing ===
function bytesToBase64(bytes) {
  let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
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
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial, 256
  );
  return { hash: bytesToBase64(new Uint8Array(bits)), salt: bytesToBase64(salt) };
}

export async function verifyPassword(password, hashBase64, saltBase64) {
  if (!hashBase64 || !saltBase64) return false;
  try {
    const result = await hashPassword(password, saltBase64);
    return result.hash === hashBase64;
  } catch { return false; }
}

export function generateTempPassword(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const chars = new Uint8Array(len);
  crypto.getRandomValues(chars);
  return Array.from(chars).map(c => alphabet[c % alphabet.length]).join("");
}

// === Passwords storage (отдельная коллекция, не employees!) ===

function getPasswordRecord(employeeId) {
  return Store.list(PASSWORDS_COLLECTION).find(p => p.employeeId === employeeId);
}

export function hasPasswordSet(employeeId) {
  const rec = getPasswordRecord(employeeId);
  return !!(rec && rec.passwordHash);
}

// === Email session ===

export function getEmailSession() {
  try {
    const raw = localStorage.getItem(EMAIL_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() - session.createdAt > SESSION_TTL_MS) {
      clearEmailSession(); return null;
    }
    return session;
  } catch { return null; }
}

export function setEmailSession(employee) {
  localStorage.setItem(EMAIL_SESSION_KEY, JSON.stringify({
    employeeId: employee.id, email: employee.email, name: employee.name,
    createdAt: Date.now(),
  }));
}

export function clearEmailSession() {
  localStorage.removeItem(EMAIL_SESSION_KEY);
}

export function isEmailAuthenticated() {
  const session = getEmailSession();
  if (!session) return false;
  const employees = listEmployees();
  return employees.some(e => e.id === session.employeeId);
}

// === Login ===

export async function loginByEmail(email, password) {
  if (!email || !password) return { ok: false, error: "Заполни email и пароль" };

  const employees = listEmployees();
  const employee = employees.find(e =>
    String(e.email || "").toLowerCase().trim() === String(email).toLowerCase().trim()
  );
  if (!employee) return { ok: false, error: "Пользователь не найден" };

  const pwRecord = getPasswordRecord(employee.id);
  if (!pwRecord || !pwRecord.passwordHash) {
    return { ok: false, error: "У этого пользователя пароль не задан. Войди через Google или попроси администратора." };
  }

  const valid = await verifyPassword(password, pwRecord.passwordHash, pwRecord.passwordSalt);
  if (!valid) return { ok: false, error: "Неверный пароль" };

  setEmailSession(employee);
  return { ok: true, employee, forcePasswordChange: !!pwRecord.forcePasswordChange };
}

// === Set / change password ===

export async function setEmployeePassword(employeeId, password) {
  if (!password || password.length < 6) throw new Error("Минимум 6 символов");
  const { hash, salt } = await hashPassword(password);
  const data = {
    employeeId, passwordHash: hash, passwordSalt: salt,
    forcePasswordChange: true, passwordChangedAt: Date.now(),
  };
  const existing = getPasswordRecord(employeeId);
  if (existing) Store.update(PASSWORDS_COLLECTION, existing.id, data);
  else Store.create(PASSWORDS_COLLECTION, data);
}

export async function changePasswordToNew(employeeId, newPassword) {
  if (!newPassword || newPassword.length < 6) throw new Error("Минимум 6 символов");
  const { hash, salt } = await hashPassword(newPassword);
  const data = {
    employeeId, passwordHash: hash, passwordSalt: salt,
    forcePasswordChange: false, passwordChangedAt: Date.now(),
  };
  const existing = getPasswordRecord(employeeId);
  if (existing) Store.update(PASSWORDS_COLLECTION, existing.id, data);
  else Store.create(PASSWORDS_COLLECTION, data);
}

export async function removeEmployeePassword(employeeId) {
  const existing = getPasswordRecord(employeeId);
  if (existing) Store.remove(PASSWORDS_COLLECTION, existing.id);
}

// === Logout (комбинированный) ===

export async function logoutAll() {
  clearEmailSession();
  try {
    const { signOut } = await import("./auth.js");
    if (typeof signOut === "function") signOut();
  } catch {}
  location.reload();
}
