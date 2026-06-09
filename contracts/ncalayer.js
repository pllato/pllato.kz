// Клиент NCALayer (НУЦ РК) для подписания документов ЭЦП.
// Работает с локальным приложением NCALayer по WebSocket (wss://127.0.0.1:13579).
// Использует legacy-протокол kz.gov.pki.knca.commonUtils (createCAdESFromBase64),
// который поддерживается всеми актуальными версиями NCALayer и eGov-ключами.
//
// Пользователь должен:
//   1) Установить NCALayer (pki.gov.kz → "Загрузить NCALayer") и запустить его.
//   2) Иметь ключ ЭЦП (файл RSA*.p12 / GOST*.p12, eToken, удостоверение и т.п.).

const NCALAYER_URL = "wss://127.0.0.1:13579";
const CONNECT_TIMEOUT_MS = 6000;
const RESPONSE_TIMEOUT_MS = 120000; // подписант выбирает ключ и вводит пароль вручную

export class NcaLayerError extends Error {
  constructor(message, code = "") {
    super(message);
    this.name = "NcaLayerError";
    this.code = code;
  }
}

function openSocket() {
  return new Promise((resolve, reject) => {
    let settled = false;
    let ws;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { ws && ws.close(); } catch {}
      reject(new NcaLayerError(
        "Не удалось подключиться к NCALayer. Убедитесь, что приложение NCALayer установлено и запущено.",
        "NO_CONNECTION"
      ));
    }, CONNECT_TIMEOUT_MS);
    try {
      ws = new WebSocket(NCALAYER_URL);
    } catch (e) {
      clearTimeout(timer);
      return reject(new NcaLayerError("NCALayer недоступен: " + (e?.message || e), "NO_CONNECTION"));
    }
    ws.onopen = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ws);
    };
    ws.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new NcaLayerError(
        "Не удалось подключиться к NCALayer. Запустите приложение NCALayer и обновите страницу.",
        "NO_CONNECTION"
      ));
    };
  });
}

// Рекурсивно ищем в ответе самую длинную base64-строку — это и есть подпись CMS.
// Формат ответа NCALayer заметно отличается между версиями, поэтому надёжнее
// найти саму подпись, чем угадывать имя поля.
function deepFindSignature(node, depth = 0) {
  if (depth > 6 || node == null) return "";
  if (typeof node === "string") {
    const s = node.trim();
    if (s.length > 100 && /^[A-Za-z0-9+/=\s]+$/.test(s)) return s;
    return "";
  }
  if (Array.isArray(node)) {
    let best = "";
    for (const v of node) {
      const f = deepFindSignature(v, depth + 1);
      if (f.length > best.length) best = f;
    }
    return best;
  }
  if (typeof node === "object") {
    let best = "";
    for (const v of Object.values(node)) {
      const f = deepFindSignature(v, depth + 1);
      if (f.length > best.length) best = f;
    }
    return best;
  }
  return "";
}

// Разбор ответа NCALayer (формат отличается между версиями) — толерантно.
function parseNcaMessage(raw) {
  let obj;
  try { obj = JSON.parse(raw); } catch { return { ok: false, error: "Некорректный ответ NCALayer" }; }
  try { console.debug("[NCALayer] raw response:", obj); } catch {}

  // NCALayer 1.4+ первым делом присылает приветствие { result: { version: "1.4" } }
  // — это не ответ на наш запрос, его нужно пропустить и ждать настоящий ответ.
  if (obj && obj.result && typeof obj.result === "object" && !Array.isArray(obj.result)
      && "version" in obj.result && !("responseObject" in obj.result) && !("code" in obj.result)) {
    return { ignore: true };
  }

  let o = obj;
  if (o && typeof o.result === "object" && o.result !== null && !Array.isArray(o.result)) {
    // некоторые версии оборачивают полезную нагрузку в result:{...}
    if ("code" in o.result || "responseObject" in o.result) o = o.result;
  }
  const code = o.code != null ? String(o.code) : (obj.code != null ? String(obj.code) : "");
  const message = o.message ?? obj.message ?? "";
  const errorCode = obj.errorCode ?? o.errorCode;

  // Явная ошибка / отмена пользователем.
  if (errorCode && errorCode !== "NONE") {
    return { ok: false, error: message || ("NCALayer: " + errorCode), code: errorCode };
  }
  if (obj.status === false) {
    return { ok: false, error: message || "Действие отменено в NCALayer", code: "CANCELLED" };
  }
  if (code && code !== "200") {
    if (code === "500") {
      return { ok: false, error: message || "Действие отменено в NCALayer", code };
    }
    return { ok: false, error: message || ("NCALayer вернул код " + code), code };
  }

  // Успех: достаём подпись из любого известного места, иначе ищем по всему ответу.
  const explicit = (typeof o.result === "string" && o.result)
    || (typeof obj.result === "string" && obj.result)
    || (o.responseObject ?? obj.responseObject)
    || obj?.body?.result;
  let value = Array.isArray(explicit) ? explicit[0] : explicit;
  if (typeof value !== "string" || !value.trim()) value = deepFindSignature(obj);
  if (typeof value === "string" && value.trim().length > 100) {
    return { ok: true, value: value.trim() };
  }
  const snippet = String(raw).slice(0, 200);
  return { ok: false, error: "Не удалось разобрать ответ NCALayer. Ответ: " + snippet };
}

function sendRequest(ws, payload) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new NcaLayerError("Истекло время ожидания ответа от NCALayer", "TIMEOUT"));
    }, RESPONSE_TIMEOUT_MS);
    ws.onmessage = (event) => {
      const parsed = parseNcaMessage(event.data);
      if (parsed.ignore) return; // приветствие версии NCALayer — ждём настоящий ответ
      clearTimeout(timer);
      if (parsed.ok) resolve(parsed.value);
      else reject(new NcaLayerError(parsed.error, parsed.code));
    };
    ws.onclose = () => {
      clearTimeout(timer);
      reject(new NcaLayerError("Соединение с NCALayer закрыто", "CLOSED"));
    };
    try {
      ws.send(JSON.stringify(payload));
    } catch (e) {
      clearTimeout(timer);
      reject(new NcaLayerError("Не удалось отправить запрос в NCALayer: " + (e?.message || e)));
    }
  });
}

// ---- Извлечение данных подписанта из CMS (best-effort, без внешних библиотек) ----
// CAdES/CMS содержит сертификат X.509 подписанта. Достаём CN и ИИН (serialNumber)
// субъекта простым сканированием DER по OID. Если не вышло — поля останутся пустыми,
// но сама подпись (CMS) всё равно сохраняется как юридический артефакт.
function base64ToBytes(b64) {
  const clean = String(b64 || "").replace(/\s+/g, "");
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function readDerString(bytes, pos) {
  if (pos >= bytes.length) return null;
  const tag = bytes[pos];
  const stringTags = [0x13, 0x0c, 0x16, 0x14, 0x1e]; // Printable/UTF8/IA5/Teletex/BMP
  if (!stringTags.includes(tag)) return null;
  let i = pos + 1;
  let len = bytes[i++];
  if (len & 0x80) {
    const n = len & 0x7f;
    len = 0;
    for (let k = 0; k < n; k += 1) len = (len << 8) | bytes[i++];
  }
  const slice = bytes.slice(i, i + len);
  if (tag === 0x1e) {
    // BMPString = UTF-16BE
    let s = "";
    for (let k = 0; k + 1 < slice.length; k += 2) s += String.fromCharCode((slice[k] << 8) | slice[k + 1]);
    return s;
  }
  try { return new TextDecoder("utf-8").decode(slice); } catch { return String.fromCharCode(...slice); }
}

function extractSubjectFromCms(cmsBase64) {
  const result = { cn: "", iin: "", serial: "" };
  let bytes;
  try { bytes = base64ToBytes(cmsBase64); } catch { return result; }
  const cnOid = [0x06, 0x03, 0x55, 0x04, 0x03]; // 2.5.4.3 commonName
  const snOid = [0x06, 0x03, 0x55, 0x04, 0x05]; // 2.5.4.5 serialNumber (ИИН)
  const cns = [];
  for (let i = 0; i + 5 < bytes.length; i += 1) {
    const match = (oid) => oid.every((b, k) => bytes[i + k] === b);
    if (match(cnOid)) {
      const s = readDerString(bytes, i + 5);
      if (s) cns.push(s);
    } else if (match(snOid)) {
      const s = readDerString(bytes, i + 5);
      if (s && !result.iin) {
        const digits = s.replace(/^IIN|^BIN/i, "").replace(/[^\d]/g, "");
        if (digits.length === 12) result.iin = digits;
      }
    }
  }
  // Субъект идёт в сертификате после издателя → берём последний CN, не похожий на CA.
  const caHint = /(ОРТАЛЫ|AUTHORITY|ЦЕНТР|GOST|RSA|КУӘЛАНДЫР|NCA|ҰЛТТЫҚ|TEST)/i;
  const personCns = cns.filter((c) => !caHint.test(c));
  result.cn = personCns.length ? personCns[personCns.length - 1] : (cns[cns.length - 1] || "");
  return result;
}

/**
 * Подписать данные (base64) ЭЦП через NCALayer.
 * @param {string} base64Data — данные для подписи в base64 (например, base64 файла).
 * @param {object} opts
 * @returns {Promise<{cms:string, signer:{cn:string,iin:string,serial:string}}>}
 */
export async function signBase64(base64Data, opts = {}) {
  const { storage = "PKCS12", keyType = "SIGNATURE", attach = false } = opts;
  const ws = await openSocket();
  try {
    const payload = {
      module: "kz.gov.pki.knca.commonUtils",
      method: "createCAdESFromBase64",
      args: [storage, keyType, base64Data, attach],
    };
    const cms = await sendRequest(ws, payload);
    if (!cms || typeof cms !== "string") {
      throw new NcaLayerError("NCALayer не вернул подпись");
    }
    return { cms, signer: extractSubjectFromCms(cms) };
  } finally {
    try { ws.close(); } catch {}
  }
}

// Быстрая проверка доступности NCALayer (для индикатора в UI).
export async function pingNcaLayer() {
  try {
    const ws = await openSocket();
    try { ws.close(); } catch {}
    return true;
  } catch {
    return false;
  }
}
