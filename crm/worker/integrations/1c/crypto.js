// AES-GCM шифрование пароля OData-пользователя 1С.
//
// Ключ: env.ONE_C_ENCRYPTION_KEY — base64 строка длиной 32 байта после декода
// (256-битный AES). Создаётся один раз и хранится через `wrangler secret put`.
//
// Формат encrypted-значения в БД: base64(iv | ciphertext+tag).
// IV — 12 байт (рекомендация для AES-GCM), генерируется при каждом шифровании.

function base64Decode(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function base64Encode(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

async function importKey(env) {
  const raw = String(env.ONE_C_ENCRYPTION_KEY || "");
  if (!raw) {
    throw new Error("ONE_C_ENCRYPTION_KEY secret is not configured");
  }
  let keyBytes;
  try {
    keyBytes = base64Decode(raw);
  } catch {
    throw new Error("ONE_C_ENCRYPTION_KEY must be base64");
  }
  if (keyBytes.length !== 32) {
    throw new Error(`ONE_C_ENCRYPTION_KEY must decode to 32 bytes, got ${keyBytes.length}`);
  }
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptPassword(env, plaintext) {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    throw new Error("plaintext must be a non-empty string");
  }
  const key = await importKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  const out = new Uint8Array(iv.length + cipher.length);
  out.set(iv, 0);
  out.set(cipher, iv.length);
  return base64Encode(out);
}

export async function decryptPassword(env, encrypted) {
  if (typeof encrypted !== "string" || encrypted.length === 0) {
    throw new Error("encrypted must be a non-empty string");
  }
  const key = await importKey(env);
  const blob = base64Decode(encrypted);
  if (blob.length < 13) {
    throw new Error("encrypted blob too short");
  }
  const iv = blob.slice(0, 12);
  const cipher = blob.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return new TextDecoder().decode(plain);
}
