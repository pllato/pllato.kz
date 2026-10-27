// Подтверждение конкретного файла кодом WhatsApp. Это не CMS/ЭЦП.
const TTL = 10 * 60 * 1000;
export const OTP_CONSENT = 'Я ознакомился с договором и согласен с его условиями. Подтверждаю согласие одноразовым кодом, отправленным на мой номер WhatsApp.';
export function otpPhone(value) {
  let n = String(value || '').replace(/[\s()+-]/g, '');
  if (/^8\d{10}$/.test(n)) n = '7' + n.slice(1);
  if (!/^[1-9]\d{9,14}$/.test(n)) throw new Error('Укажите телефон с кодом страны, например +7 777 123 45 67');
  return n;
}
export function otpMessage(title, name, code, hash) {
  return `Pllato · Подтверждение договора\n\n${name}, вы запросили подтверждение договора «${title}».\nВерсия документа: ${hash.slice(0, 12)}.\n\nКод: ${code}\n\nВведите код на странице договора pllato.kz, чтобы подтвердить согласие с его условиями. Код действует 10 минут. Никому не сообщайте его, в том числе менеджеру. Если вы не запрашивали код, проигнорируйте сообщение.`;
}
const enc = new TextEncoder();
async function key(env) {
  if (!env.CONTRACT_OTP_SECRET) throw new Error('Подтверждение WhatsApp пока не настроено');
  return crypto.subtle.importKey('raw', enc.encode(env.CONTRACT_OTP_SECRET), {name:'HMAC',hash:'SHA-256'}, false, ['sign','verify']);
}
async function digest(env, text) { return new Uint8Array(await crypto.subtle.sign('HMAC', await key(env), enc.encode(text))); }
const hex = bytes => Array.from(bytes, x => x.toString(16).padStart(2,'0')).join('');
const unhex = text => Uint8Array.from(text.match(/../g) || [], x => parseInt(x,16));
const proof = (r,code) => JSON.stringify([r.id,r.contract_id,r.scope,r.file_hash,r.name,r.phone,code]);
function randomCode() {
  const b = new Uint32Array(1); do { crypto.getRandomValues(b); } while (b[0] >= 4294000000);
  return String(b[0] % 1000000).padStart(6,'0');
}
export async function ensureOtpSchema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS contract_otp (id TEXT PRIMARY KEY, contract_id TEXT NOT NULL, scope TEXT NOT NULL, file_hash TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, code_hash TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL, signer_id TEXT NOT NULL, provider_id TEXT, accepted_at INTEGER, evidence TEXT)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS contract_otp_scope ON contract_otp(contract_id,scope,phone,created_at)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS contract_otp_limits (id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL)`),
  ]);
  for (const col of ['signature_method TEXT','confirmation_json TEXT']) {
    try { await db.prepare(`ALTER TABLE contract_signers ADD COLUMN ${col}`).run(); }
    catch (e) { if (!/duplicate column/i.test(String(e.message))) throw e; }
  }
}
async function quota(db, id, max, expires, fail) {
  const row = await db.prepare(`INSERT INTO contract_otp_limits(id,count,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count`).bind(id,expires,max).first();
  if (!row) throw fail(429,'Слишком много запросов кода. Подождите и повторите позже.');
}
export async function handleContractOtp(request, env, {contract, signer, scope, action}, deps) {
  const {db,fail,send,sync} = deps;
  if (contract.status === 'cancelled') throw fail(409,'Договор отменён');
  if (scope === 'universal' && contract.link_mode === 'named') throw fail(409,'Нужна персональная ссылка');
  await ensureOtpSchema(db);
  let body; try { body = await request.json(); } catch { throw fail(400,'Некорректный запрос'); }
  const now = Date.now();
  const name = String(body.name || '').trim().replace(/[\r\n]/g,' ').slice(0,200);
  let phone; try { phone = otpPhone(body.phone); } catch(e) { throw fail(400,e.message); }
  if (!name) throw fail(400,'Укажите имя подписанта');
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (action === 'request') {
    if (signer && signer.status !== 'pending') throw fail(409,'Этот участник уже завершил подписание');
    if (body.fileHash !== contract.file_hash) throw fail(409,'Документ изменился. Обновите страницу.');
    // HMAC-секрет только на сервере; в БД нет кода в открытом виде.
    const ipKey = hex(await digest(env, 'ip:'+ip));
    const phoneKey = hex(await digest(env, 'phone:'+phone));
    const day = Math.floor(now/86400000), minute = Math.floor(now/60000);
    for (const [id,max,end] of [[`ip:${ipKey}:${day}`,30,(day+1)*86400000],[`phone:${phoneKey}:${day}`,10,(day+1)*86400000],[`contract:${contract.id}:${day}`,30,(day+1)*86400000],[`minute:${phoneKey}:${minute}`,1,(minute+1)*60000]]) await quota(db,id,max,end,deps.fail);
    const recent = await db.prepare(`SELECT created_at FROM contract_otp WHERE contract_id=? AND scope=? AND phone=? ORDER BY created_at DESC LIMIT 1`).bind(contract.id,scope,phone).first();
    if (recent && now - recent.created_at < 60000) throw fail(429,'Повторный код можно запросить через минуту.');
    const code = randomCode();
    const row = {id:crypto.randomUUID(),contract_id:contract.id,scope,file_hash:contract.file_hash,name,phone};
    const signerId = signer?.id || 'sg_otp_' + row.id.replaceAll('-','');
    const codeHash = hex(await digest(env,proof(row,code)));
    await db.batch([
      db.prepare(`UPDATE contract_otp SET status='superseded' WHERE contract_id=? AND scope=? AND phone=? AND status IN ('ready','sending')`).bind(contract.id,scope,phone),
      db.prepare(`INSERT INTO contract_otp(id,contract_id,scope,file_hash,name,phone,code_hash,created_at,expires_at,status,signer_id) VALUES (?,?,?,?,?,?,?,?,?,'sending',?)`).bind(row.id,contract.id,scope,contract.file_hash,name,phone,codeHash,now,now+TTL,signerId),
    ]);
    let messageId;
    try { messageId = await send(phone,otpMessage(contract.title,name,code,contract.file_hash)); }
    catch { await db.prepare(`UPDATE contract_otp SET status='failed' WHERE id=?`).bind(row.id).run(); throw fail(502,'Не удалось отправить код в WhatsApp. Проверьте номер и повторите через минуту.'); }
    await db.prepare(`UPDATE contract_otp SET status='ready',provider_id=? WHERE id=? AND status='sending'`).bind(messageId,row.id).run();
    // Ограниченные по времени служебные записи; подтверждения остаются в договоре.
    await db.batch([db.prepare(`DELETE FROM contract_otp_limits WHERE expires_at < ?`).bind(now-86400000),db.prepare(`DELETE FROM contract_otp WHERE expires_at < ? AND status != 'used'`).bind(now-86400000)]);
    return {ok:true,challengeId:row.id,expiresAt:now+TTL,retryAfter:60,phone:'+'+phone};
  }
  if (body.consent !== true) throw fail(400,'Подтвердите согласие с условиями договора');
  const code = String(body.code || '');
  if (!/^\d{6}$/.test(code)) throw fail(400,'Введите шестизначный код');
  let row = await db.prepare(`SELECT * FROM contract_otp WHERE id=? AND contract_id=? AND scope=?`).bind(String(body.challengeId || ''),contract.id,scope).first();
  if (!row || row.name !== name || row.phone !== phone || row.file_hash !== contract.file_hash || body.fileHash !== contract.file_hash) throw fail(409,'Данные изменились. Запросите новый код.');
  if (row.status !== 'used') {
    row = await db.prepare(`UPDATE contract_otp SET attempts=attempts+1 WHERE id=? AND status='ready' AND expires_at>? AND attempts<5 RETURNING *`).bind(row.id,now).first();
    if (!row) throw fail(409,'Код истёк или попытки закончились. Запросите новый код.');
  }
  if (!(await crypto.subtle.verify('HMAC',await key(env),unhex(row.code_hash),enc.encode(proof(row,code))))) throw fail(400,'Неверный код');
  if (row.status !== 'used') {
    const evidence = JSON.stringify({method:'whatsapp_otp',consent:OTP_CONSENT,contractId:contract.id,fileHash:row.file_hash,name,phone:'+'+phone,requestedAt:row.created_at,acceptedAt:now,ip,userAgent:(request.headers.get('User-Agent') || '').slice(0,500),providerMessageId:row.provider_id,challengeId:row.id});
    // Все записи фиксируются одной транзакцией. Повторный запрос не создаёт второго подписанта.
    const guard = `EXISTS(SELECT 1 FROM contract_otp o JOIN contracts c ON c.id=o.contract_id WHERE o.id=? AND o.status='ready' AND c.status!='cancelled' AND c.file_hash=o.file_hash)`;
    const statements = [];
    if (signer) {
      statements.push(db.prepare(`UPDATE contract_signers SET status='signed',full_name=?,contact=?,signature_method='whatsapp_otp',confirmation_json=?,signed_at=?,signed_ip=?,updated_at=? WHERE id=? AND status='pending' AND ${guard}`).bind(name,'+'+phone,evidence,now,ip,now,signer.id,row.id));
    } else {
      statements.push(db.prepare(`INSERT OR IGNORE INTO contract_signers(id,contract_id,role,full_name,contact,token,order_index,status,signature_method,confirmation_json,signed_at,signed_ip,created_at,updated_at) SELECT ?,?,'employee',?,?,?,(SELECT COALESCE(MAX(order_index),0)+1 FROM contract_signers WHERE contract_id=?),'signed','whatsapp_otp',?,?,?,?,? WHERE ${guard}`).bind(row.signer_id,contract.id,name,'+'+phone,crypto.randomUUID(),contract.id,evidence,now,ip,now,now,row.id));
    }
    statements.push(db.prepare(`UPDATE contract_otp SET status='used',accepted_at=?,evidence=? WHERE id=? AND status='ready' AND EXISTS(SELECT 1 FROM contract_signers WHERE id=? AND signature_method='whatsapp_otp' AND confirmation_json=?)`).bind(now,evidence,row.id,row.signer_id,evidence));
    await db.batch(statements);
  }
  const fresh = await db.prepare(`SELECT * FROM contract_signers WHERE id=?`).bind(row.signer_id).first();
  const consumed = await db.prepare(`SELECT status FROM contract_otp WHERE id=?`).bind(row.id).first();
  if (consumed?.status !== 'used' || fresh?.signature_method !== 'whatsapp_otp') throw fail(409,'Договор изменился. Обновите страницу.');
  await sync();
  return {ok:true,signer:{fullName:fresh.full_name,status:'signed',signedAt:fresh.signed_at,signatureMethod:'whatsapp_otp',phoneMasked:'+'+phone.slice(0,2)+'•••••'+phone.slice(-4)}};
}
