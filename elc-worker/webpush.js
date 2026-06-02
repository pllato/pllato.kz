// ════════════════════════════════════════════════════════════════════════
// Web Push отправитель для Cloudflare Workers — чистый WebCrypto, без либ.
//
// Реализует:
//   • VAPID JWT (ES256) — RFC 8292, авторизация перед push-сервисом.
//   • aes128gcm шифрование payload — RFC 8291 (ключевая деривация) + RFC 8188
//     (content-encoding). Тело пуша зашифровано ключами подписки (p256dh/auth).
//
// Публичный VAPID-ключ (uncompressed P-256 point, base64url) — НЕ секрет,
// уходит во фронт как applicationServerKey и в заголовок `k=` push-запроса.
// Приватный ключ — JWK в секрете воркера env.VAPID_PRIVATE_JWK.
// ════════════════════════════════════════════════════════════════════════

// Сгенерирован gen-vapid.mjs. Парный приватный ключ — в секрете VAPID_PRIVATE_JWK.
export const VAPID_PUBLIC_KEY =
  'BBDlH4MNBol3LUHPHUdADJ2JP6eS9JW7_yHdHE1zJr5eAPnMn6th2W4QXC0OLMIUG_XO05YcHVetyU4PJ4yycsk';

// ── base64url ↔ bytes ───────────────────────────────────────────────────
function b64urlToBytes(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64url(bytes) {
  let bin = '';
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function utf8(s) { return new TextEncoder().encode(s); }
function concat(...arrs) {
  let len = 0;
  for (const a of arrs) len += a.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}

// HKDF-SHA256 на одном блоке Expand (нам всегда нужно ≤32 байт).
async function hkdf(salt, ikm, info, length) {
  const saltKey = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', saltKey, ikm));
  const prkKey = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const t = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, concat(info, new Uint8Array([1]))));
  return t.slice(0, length);
}

// ── VAPID JWT (ES256) ─────────────────────────────────────────────────────
async function buildVapidJWT(audience, subject, privateKey) {
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600, // ≤24ч по спеке
    sub: subject,
  };
  const signingInput =
    bytesToB64url(utf8(JSON.stringify(header))) + '.' + bytesToB64url(utf8(JSON.stringify(payload)));
  // crypto.subtle ECDSA отдаёт подпись уже в формате IEEE-P1363 (r||s, 64 байта) —
  // ровно то, что нужно JWT ES256.
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, privateKey, utf8(signingInput)
  );
  return signingInput + '.' + bytesToB64url(new Uint8Array(sig));
}

// ── aes128gcm payload (RFC 8291 + RFC 8188) ────────────────────────────────
// export — для round-trip самотеста (test-webpush.mjs). В проде зовётся внутри sendWebPush.
export async function encryptPayload(plaintext, uaPublicB64, authB64) {
  const uaPublic = b64urlToBytes(uaPublicB64);  // 65 байт (клиентский pubkey)
  const authSecret = b64urlToBytes(authB64);    // 16 байт

  // Эфемерная серверная ECDH-пара.
  const asPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asPair.publicKey)); // 65 байт
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asPair.privateKey, 256));

  // IKM = HKDF(salt=auth, ikm=ecdh, info="WebPush: info\0"||uaPub||asPub, 32)
  const keyInfo = concat(utf8('WebPush: info'), new Uint8Array([0]), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, ecdh, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, concat(utf8('Content-Encoding: aes128gcm'), new Uint8Array([0])), 16);
  const nonce = await hkdf(salt, ikm, concat(utf8('Content-Encoding: nonce'), new Uint8Array([0])), 12);

  // Одна запись: plaintext || 0x02 (padding-delimiter финальной записи).
  const record = concat(plaintext, new Uint8Array([2]));
  const cekKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, cekKey, record)
  );

  // Заголовок aes128gcm: salt(16) | rs(4 BE) | idlen(1) | keyid(asPublic 65) | ciphertext
  const rs = 4096;
  const head = new Uint8Array(16 + 4 + 1 + asPublic.length);
  head.set(salt, 0);
  new DataView(head.buffer).setUint32(16, rs, false);
  head[20] = asPublic.length;
  head.set(asPublic, 21);
  return concat(head, ciphertext);
}

// ── Публичная функция отправки ──────────────────────────────────────────────
// sub: { endpoint, p256dh, auth }
// payloadObj: { title, body, url, tag, icon }
// Возвращает { ok, status, gone }  (gone=true → подписка протухла, удалить из БД)
export async function sendWebPush(env, sub, payloadObj) {
  if (!env.VAPID_PRIVATE_JWK) return { ok: false, status: 0, skip: true };
  let privateKey;
  try {
    const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
    privateKey = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  } catch (e) {
    return { ok: false, status: 0, error: 'bad VAPID_PRIVATE_JWK' };
  }

  const endpointUrl = new URL(sub.endpoint);
  const jwt = await buildVapidJWT(endpointUrl.origin, env.VAPID_SUBJECT || 'mailto:admin@pllato.kz', privateKey);
  const body = await encryptPayload(utf8(JSON.stringify(payloadObj)), sub.p256dh, sub.auth);

  let res;
  try {
    res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body,
    });
  } catch (e) {
    return { ok: false, status: 0, error: e && e.message };
  }
  // 404/410 — подписка больше не существует у push-сервиса.
  const gone = res.status === 404 || res.status === 410;
  return { ok: res.ok, status: res.status, gone };
}
