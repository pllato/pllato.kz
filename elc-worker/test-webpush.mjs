// ════════════════════════════════════════════════════════════════════════
// Round-trip самотест шифрования Web Push (RFC 8291 + RFC 8188).
//
// Логика: encryptPayload() из webpush.js — ОТПРАВИТЕЛЬ. Здесь пишем
// независимый ПОЛУЧАТЕЛЬ (расшифровщик) на голом node:crypto, НЕ переиспользуя
// хелперы из webpush.js. Если payload, зашифрованный отправителем, корректно
// расшифровывается независимым кодом — значит деривация ключей и AES-GCM верны,
// и реальный push-сервис (FCM/Mozilla/Apple) тоже расшифрует.
//
// Запуск:  node test-webpush.mjs
// ════════════════════════════════════════════════════════════════════════
import { webcrypto } from 'node:crypto';
import { encryptPayload } from './webpush.js';

// Подменяем глобальный crypto, чтобы webpush.js (писан под Workers/WebCrypto)
// работал в Node без изменений.
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const crypto = webcrypto;

// ── base64url helpers (независимая реализация для приёмника) ──────────────
function b64url(bytes) {
  return Buffer.from(bytes).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function concat(...arrs) {
  return Buffer.concat(arrs.map((a) => Buffer.from(a)));
}

// HKDF-SHA256 (один блок Expand) — независимо от webpush.js.
async function hkdf(salt, ikm, info, length) {
  const saltKey = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', saltKey, ikm));
  const prkKey = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const t = new Uint8Array(await crypto.subtle.sign('HMAC', prkKey, concat(info, Buffer.from([1]))));
  return t.slice(0, length);
}

async function main() {
  // ── 1. Клиент (UA) генерит свою ECDH-пару + auth-секрет ────────────────
  const uaPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const uaPublicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', uaPair.publicKey)); // 65 байт
  const authSecret = crypto.getRandomValues(new Uint8Array(16));

  const uaPublicB64 = b64url(uaPublicRaw);
  const authB64 = b64url(authSecret);

  // ── 2. ОТПРАВИТЕЛЬ шифрует payload ─────────────────────────────────────
  const message = JSON.stringify({ title: 'Тест', body: 'Привет, мир! 👋', url: '/?page=notifications' });
  const plaintext = new TextEncoder().encode(message);
  const body = await encryptPayload(plaintext, uaPublicB64, authB64);

  // ── 3. ПОЛУЧАТЕЛЬ парсит aes128gcm-заголовок ───────────────────────────
  // salt(16) | rs(4 BE) | idlen(1) | keyid(asPublic) | ciphertext
  const buf = Buffer.from(body);
  const salt = buf.subarray(0, 16);
  const rs = buf.readUInt32BE(16);
  const idlen = buf[20];
  const asPublicRaw = new Uint8Array(buf.subarray(21, 21 + idlen)); // серверный pubkey
  const ciphertext = new Uint8Array(buf.subarray(21 + idlen));

  if (idlen !== 65) throw new Error(`idlen ожидался 65, получено ${idlen}`);
  if (rs !== 4096) throw new Error(`rs ожидался 4096, получено ${rs}`);

  // ── 4. ECDH(uaPrivate, asPublic) — общий секрет ────────────────────────
  const asKey = await crypto.subtle.importKey('raw', asPublicRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, uaPair.privateKey, 256));

  // ── 5. Деривация IKM → CEK / NONCE по RFC 8291 ─────────────────────────
  // ВАЖНО: keyInfo = "WebPush: info\0" || uaPublic || asPublic (порядок: получатель, потом отправитель)
  const keyInfo = concat(new TextEncoder().encode('WebPush: info'), Buffer.from([0]), uaPublicRaw, asPublicRaw);
  const ikm = await hkdf(authSecret, ecdh, keyInfo, 32);

  const cek = await hkdf(salt, ikm, concat(new TextEncoder().encode('Content-Encoding: aes128gcm'), Buffer.from([0])), 16);
  const nonce = await hkdf(salt, ikm, concat(new TextEncoder().encode('Content-Encoding: nonce'), Buffer.from([0])), 12);

  // ── 6. AES-128-GCM расшифровка ─────────────────────────────────────────
  const cekKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['decrypt']);
  let record;
  try {
    record = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, cekKey, ciphertext));
  } catch (e) {
    console.error('❌ AES-GCM decrypt FAILED — ключи не сошлись:', e.message);
    process.exit(1);
  }

  // ── 7. Снимаем padding-delimiter 0x02 финальной записи ─────────────────
  // Последний ненулевой байт должен быть 0x02 (одна запись, нет паддинга).
  let end = record.length;
  while (end > 0 && record[end - 1] === 0) end--;
  if (end === 0 || record[end - 1] !== 2) {
    console.error('❌ delimiter ожидался 0x02, структура записи неверна');
    process.exit(1);
  }
  const decrypted = new TextDecoder().decode(record.subarray(0, end - 1));

  // ── 8. Сверка ──────────────────────────────────────────────────────────
  console.log('Отправлено :', message);
  console.log('Получено   :', decrypted);
  if (decrypted === message) {
    console.log('\n✅ ROUND-TRIP OK — шифрование RFC 8291/8188 корректно.');
    console.log(`   header: salt=16B, rs=${rs}, keyid=${idlen}B, ciphertext=${ciphertext.length}B`);
  } else {
    console.error('\n❌ MISMATCH — расшифрованный текст не совпал с исходным.');
    process.exit(1);
  }
}

main().catch((e) => { console.error('❌ Тест упал:', e); process.exit(1); });
