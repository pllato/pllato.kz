// Генератор VAPID-ключей для Web Push (RFC 8292).
// P-256 (ECDSA). Публичный ключ — uncompressed point (65 байт) в base64url:
// его кладём в воркер и фронт (applicationServerKey). Приватный — JWK,
// уходит в секрет воркера (wrangler secret put VAPID_PRIVATE_JWK).
//
// Запуск:  node gen-vapid.mjs
// Создаёт: vapid-public.txt  и  vapid-private.jwk.json  (последний — секрет, в .gitignore)
import { webcrypto as crypto } from 'node:crypto';
import { writeFileSync } from 'node:fs';

function b64url(bytes) {
  return Buffer.from(bytes).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const kp = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify']
);

// Публичный ключ — raw (0x04 || X || Y), 65 байт.
const rawPub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
const pubB64 = b64url(rawPub);

// Приватный ключ — JWK { kty, crv, d, x, y }.
const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
// чистим лишние поля, оставляем только нужные для импорта на подпись
const privJwk = { kty: jwk.kty, crv: jwk.crv, d: jwk.d, x: jwk.x, y: jwk.y };

writeFileSync(new URL('./vapid-public.txt', import.meta.url), pubB64 + '\n');
writeFileSync(new URL('./vapid-private.jwk.json', import.meta.url), JSON.stringify(privJwk));

console.log('VAPID public key (base64url, 65-byte point):');
console.log(pubB64);
console.log('\nФайлы:');
console.log('  vapid-public.txt          — публичный ключ (не секрет)');
console.log('  vapid-private.jwk.json    — ПРИВАТНЫЙ ключ → wrangler secret put VAPID_PRIVATE_JWK');
