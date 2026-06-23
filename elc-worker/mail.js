// ════════════════════════════════════════════════════════════════════════
// Почта: IMAP (чтение) + SMTP (отправка) прямо из Cloudflare Worker через
// cloudflare:sockets (TCP + TLS). Реализован практичный подмножество протоколов,
// достаточное для общего ящика: список входящих, чтение письма, отправка/ответ.
//
// Приём байтов: декодируем поток как latin1 (1 байт = 1 символ), чтобы не терять
// бинарные данные; charset конкретных MIME-частей применяем при разборе.
// ════════════════════════════════════════════════════════════════════════
import { connect } from "cloudflare:sockets";

const CRLF = "\r\n";
const enc = (s) => new TextEncoder().encode(s);                 // строка latin1/ascii → байты
function latin1ToBytes(s) {
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff;
  return b;
}
function bytesToLatin1(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

// ── низкоуровневое соединение ───────────────────────────────────────────
async function openTls(host, port) {
  const socket = connect({ hostname: host, port: Number(port) }, { secureTransport: "on", allowHalfOpen: false });
  await socket.opened;
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  return { socket, writer, reader, buf: "" };
}
async function sendLine(conn, line) {
  await conn.writer.write(enc(line + CRLF));
}
async function sendRaw(conn, str) {
  await conn.writer.write(latin1ToBytes(str));
}
async function readMore(conn) {
  const { value, done } = await conn.reader.read();
  if (done) return false;
  conn.buf += bytesToLatin1(value);
  return true;
}
async function closeConn(conn) {
  try { await conn.writer.close(); } catch {}
  try { await conn.reader.cancel(); } catch {}
  try { conn.socket.close(); } catch {}
}

// ════════════════════════ IMAP ════════════════════════
// Полное чтение ответа на тег с учётом литералов {N}.
function imapResponseEnd(buf, tag) {
  let i = 0;
  const n = buf.length;
  while (i < n) {
    let eol = buf.indexOf(CRLF, i);
    if (eol === -1) return -1;
    let line = buf.slice(i, eol);
    // литерал в конце строки: {123} или {123+}
    const m = line.match(/\{(\d+)\+?\}$/);
    if (m) {
      const litLen = parseInt(m[1], 10);
      const litStart = eol + 2;
      if (litStart + litLen > n) return -1;   // ещё не дочитали литерал
      i = litStart + litLen;
      continue;
    }
    // обычная строка
    if (line.startsWith(tag + " ")) return eol + 2;   // тегированный ответ-завершение
    i = eol + 2;
  }
  return -1;
}
async function imapCmd(conn, tag, command) {
  await sendLine(conn, `${tag} ${command}`);
  let end = -1;
  while ((end = imapResponseEnd(conn.buf, tag)) === -1) {
    if (!(await readMore(conn))) break;
  }
  if (end === -1) end = conn.buf.length;
  const resp = conn.buf.slice(0, end);
  conn.buf = conn.buf.slice(end);
  // статус из тегированной строки
  const statusM = resp.match(new RegExp(`(?:^|\\r\\n)${tag} (OK|NO|BAD)([^\\r\\n]*)`));
  const status = statusM ? statusM[1] : "BAD";
  return { resp, status, text: statusM ? statusM[2].trim() : "" };
}

async function imapLogin(acc) {
  const conn = await openTls(acc.imap_host || "imap.yandex.ru", acc.imap_port || 993);
  // приветствие
  while (conn.buf.indexOf(CRLF) === -1) { if (!(await readMore(conn))) break; }
  conn.buf = "";
  let tagN = 0;
  conn._tag = () => "A" + (++tagN);
  const login = (acc.login || acc.email || "");
  const pass = (acc.password || "");
  const r = await imapCmd(conn, conn._tag(), `LOGIN ${imapQuote(login)} ${imapQuote(pass)}`);
  if (r.status !== "OK") { await closeConn(conn); throw new Error("IMAP login failed: " + (r.text || r.status)); }
  return conn;
}
function imapQuote(s) { return '"' + String(s).replace(/([\\"])/g, "\\$1") + '"'; }

// Список писем в папке: последние `limit` (новые сверху).
export async function imapList(acc, { folder = "INBOX", limit = 30 } = {}) {
  const conn = await imapLogin(acc);
  try {
    const sel = await imapCmd(conn, conn._tag(), `SELECT ${imapQuote(folder)}`);
    if (sel.status !== "OK") throw new Error("SELECT failed: " + sel.text);
    const exM = sel.resp.match(/\* (\d+) EXISTS/);
    const total = exM ? parseInt(exM[1], 10) : 0;
    if (!total) return { total: 0, messages: [] };
    const from = Math.max(1, total - limit + 1);
    const range = `${from}:${total}`;
    const f = await imapCmd(conn, conn._tag(),
      `FETCH ${range} (UID FLAGS INTERNALDATE RFC822.SIZE BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])`);
    const messages = parseFetchList(f.resp);
    messages.sort((a, b) => b.seq - a.seq);   // новые сверху
    return { total, messages };
  } finally {
    try { await imapCmd(conn, conn._tag(), "LOGOUT"); } catch {}
    await closeConn(conn);
  }
}

// Разбор ответа FETCH со списком (заголовки в литералах).
function parseFetchList(resp) {
  const out = [];
  // Каждое сообщение: "* <seq> FETCH (....)" возможно с литералом заголовков.
  const re = /\* (\d+) FETCH \(([\s\S]*?)\{(\d+)\}\r\n/g;
  let m;
  while ((m = re.exec(resp)) !== null) {
    const seq = parseInt(m[1], 10);
    const attrs = m[2];
    const litLen = parseInt(m[3], 10);
    const litStart = re.lastIndex;
    const headerRaw = resp.slice(litStart, litStart + litLen);
    re.lastIndex = litStart + litLen;
    const uidM = attrs.match(/UID (\d+)/);
    const sizeM = attrs.match(/RFC822\.SIZE (\d+)/);
    const flagsM = attrs.match(/FLAGS \(([^)]*)\)/);
    const dateM = attrs.match(/INTERNALDATE "([^"]+)"/);
    const headers = parseHeaders(headerRaw);
    out.push({
      seq,
      uid: uidM ? parseInt(uidM[1], 10) : null,
      size: sizeM ? parseInt(sizeM[1], 10) : null,
      seen: flagsM ? /\\Seen/.test(flagsM[1]) : false,
      from: decodeWords(headers["from"] || ""),
      subject: decodeWords(headers["subject"] || "(без темы)"),
      date: headers["date"] || (dateM ? dateM[1] : ""),
    });
  }
  return out;
}

// Чтение одного письма целиком по UID.
export async function imapFetchMessage(acc, uid, { folder = "INBOX" } = {}) {
  const conn = await imapLogin(acc);
  try {
    const sel = await imapCmd(conn, conn._tag(), `SELECT ${imapQuote(folder)}`);
    if (sel.status !== "OK") throw new Error("SELECT failed: " + sel.text);
    const f = await imapCmd(conn, conn._tag(), `UID FETCH ${Number(uid)} (UID FLAGS BODY.PEEK[])`);
    // вытащить литерал с полным телом
    const m = f.resp.match(/\{(\d+)\}\r\n/);
    if (!m) throw new Error("message not found");
    const litStart = f.resp.indexOf(m[0]) + m[0].length;
    const raw = f.resp.slice(litStart, litStart + parseInt(m[1], 10));
    // отметить прочитанным (не критично если не выйдет)
    try { await imapCmd(conn, conn._tag(), `UID STORE ${Number(uid)} +FLAGS (\\Seen)`); } catch {}
    return parseMime(raw);
  } finally {
    try { await imapCmd(conn, conn._tag(), "LOGOUT"); } catch {}
    await closeConn(conn);
  }
}

// ════════════════════════ MIME ════════════════════════
function parseHeaders(raw) {
  const headers = {};
  const headPart = raw.split(/\r\n\r\n/)[0];
  const lines = headPart.split(/\r\n/);
  let cur = null;
  for (const ln of lines) {
    if (/^[ \t]/.test(ln) && cur) { headers[cur] += " " + ln.trim(); continue; }
    const idx = ln.indexOf(":");
    if (idx === -1) continue;
    cur = ln.slice(0, idx).toLowerCase().trim();
    headers[cur] = ln.slice(idx + 1).trim();
  }
  return headers;
}
function parseContentType(v) {
  const out = { type: "text/plain", params: {} };
  if (!v) return out;
  const parts = v.split(";");
  out.type = parts[0].trim().toLowerCase();
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i].trim();
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    let val = p.slice(eq + 1).trim().replace(/^"|"$/g, "");
    out.params[p.slice(0, eq).trim().toLowerCase()] = val;
  }
  return out;
}
function decodeTransfer(body, encoding, charset) {
  encoding = (encoding || "7bit").toLowerCase();
  let bytes;
  if (encoding === "base64") {
    const clean = body.replace(/[^A-Za-z0-9+/=]/g, "");
    bytes = base64ToBytes(clean);
  } else if (encoding === "quoted-printable") {
    bytes = qpToBytes(body);
  } else {
    bytes = latin1ToBytes(body);
  }
  return decodeCharset(bytes, charset);
}
function base64ToBytes(b64) {
  try {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch { return new Uint8Array(0); }
}
function qpToBytes(s) {
  s = s.replace(/=\r\n/g, "");                 // soft line breaks
  const out = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "=" && i + 2 < s.length && /[0-9A-Fa-f]{2}/.test(s.slice(i + 1, i + 3))) {
      out.push(parseInt(s.slice(i + 1, i + 3), 16)); i += 2;
    } else out.push(s.charCodeAt(i) & 0xff);
  }
  return new Uint8Array(out);
}
function decodeCharset(bytes, charset) {
  charset = (charset || "utf-8").toLowerCase();
  try { return new TextDecoder(charset).decode(bytes); }
  catch { try { return new TextDecoder("utf-8").decode(bytes); } catch { return bytesToLatin1(bytes); } }
}
// Декодирование encoded-word в заголовках: =?charset?B/Q?text?=
function decodeWords(s) {
  if (!s) return "";
  return s.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (mm, cs, enc2, txt) => {
    try {
      let bytes;
      if (enc2.toUpperCase() === "B") bytes = base64ToBytes(txt.replace(/[^A-Za-z0-9+/=]/g, ""));
      else bytes = qpToBytes(txt.replace(/_/g, " "));
      return decodeCharset(bytes, cs);
    } catch { return txt; }
  }).replace(/\?=\s+=\?/g, "");   // склейка соседних encoded-word
}

// Разбор MIME-сообщения → {from,to,subject,date,html,text,attachments[]}
function parseMime(raw) {
  const headers = parseHeaders(raw);
  const ct = parseContentType(headers["content-type"]);
  const result = {
    from: decodeWords(headers["from"] || ""),
    to: decodeWords(headers["to"] || ""),
    cc: decodeWords(headers["cc"] || ""),
    subject: decodeWords(headers["subject"] || "(без темы)"),
    date: headers["date"] || "",
    messageId: headers["message-id"] || "",
    html: "", text: "", attachments: [],
  };
  const sepIdx = raw.indexOf("\r\n\r\n");
  const body = sepIdx === -1 ? "" : raw.slice(sepIdx + 4);
  walkPart(body, ct, headers, result);
  return result;
}
function walkPart(body, ct, headers, result, depth = 0) {
  if (depth > 12) return;
  if (ct.type.startsWith("multipart/")) {
    const boundary = ct.params.boundary;
    if (!boundary) return;
    const parts = splitMultipart(body, boundary);
    // alternative: предпочесть html; иначе пройти все
    for (const p of parts) {
      const ph = parseHeaders(p);
      const pct = parseContentType(ph["content-type"]);
      const sep = p.indexOf("\r\n\r\n");
      const pbody = sep === -1 ? "" : p.slice(sep + 4);
      walkPart(pbody, pct, ph, result, depth + 1);
    }
    return;
  }
  const disp = (headers["content-disposition"] || "").toLowerCase();
  const filename = (headers["content-disposition"] || "").match(/filename\*?=("?)([^";]+)\1/i);
  const isAttach = disp.startsWith("attachment") || (filename && ct.type.indexOf("text/") !== 0);
  if (isAttach) {
    result.attachments.push({
      filename: decodeWords(filename ? filename[2] : (ct.params.name || "файл")),
      mime: ct.type,
      size: body.replace(/\s/g, "").length,
    });
    return;
  }
  const text = decodeTransfer(body, headers["content-transfer-encoding"], ct.params.charset);
  if (ct.type === "text/html") result.html += text;
  else if (ct.type === "text/plain") result.text += text;
}
function splitMultipart(body, boundary) {
  const out = [];
  const marker = "--" + boundary;
  const parts = body.split(marker);
  for (let i = 1; i < parts.length; i++) {
    let p = parts[i];
    if (p.startsWith("--")) break;          // финальная граница
    if (p.startsWith("\r\n")) p = p.slice(2);
    if (p.endsWith("\r\n")) p = p.slice(0, -2);
    out.push(p);
  }
  return out;
}

// ════════════════════════ SMTP ════════════════════════
async function smtpRead(conn) {
  // читаем многострочный ответ, пока строка вида "250 ..." (без дефиса)
  let endIdx = -1;
  while (true) {
    const lines = conn.buf.split(CRLF);
    let complete = null;
    for (const ln of lines) {
      if (/^\d{3} /.test(ln)) { complete = ln; break; }
    }
    if (complete !== null) { endIdx = 1; break; }
    if (!(await readMore(conn))) break;
  }
  const resp = conn.buf;
  conn.buf = "";
  const codeM = resp.match(/(\d{3}) [^\r\n]*\r\n?$/m) || resp.match(/(\d{3}) /);
  return { code: codeM ? parseInt(codeM[1], 10) : 0, resp };
}
async function smtpExpect(conn, okCodes) {
  const r = await smtpRead(conn);
  if (!okCodes.includes(r.code)) throw new Error(`SMTP ${r.code}: ${(r.resp || "").trim().slice(0, 200)}`);
  return r;
}

export async function smtpSend(acc, { to, cc, subject, text, html, inReplyTo, fromName } = {}) {
  const recipients = []
    .concat(splitAddrs(to))
    .concat(splitAddrs(cc));
  if (!recipients.length) throw new Error("нет получателей");
  const conn = await openTls(acc.smtp_host || "smtp.yandex.ru", acc.smtp_port || 465);
  try {
    await smtpExpect(conn, [220]);
    await sendLine(conn, "EHLO crm");
    await smtpExpect(conn, [250]);
    await sendLine(conn, "AUTH LOGIN");
    await smtpExpect(conn, [334]);
    await sendLine(conn, btoa(acc.login || acc.email));
    await smtpExpect(conn, [334]);
    await sendLine(conn, btoa(acc.password || ""));
    await smtpExpect(conn, [235]);
    await sendLine(conn, `MAIL FROM:<${acc.email}>`);
    await smtpExpect(conn, [250]);
    for (const rcpt of recipients) {
      await sendLine(conn, `RCPT TO:<${rcpt}>`);
      await smtpExpect(conn, [250, 251]);
    }
    await sendLine(conn, "DATA");
    await smtpExpect(conn, [354]);
    const msg = buildMessage(acc, { to, cc, subject, text, html, inReplyTo, fromName });
    await sendRaw(conn, msg + CRLF + "." + CRLF);
    await smtpExpect(conn, [250]);
    await sendLine(conn, "QUIT");
    return { ok: true };
  } finally {
    await closeConn(conn);
  }
}
function splitAddrs(v) {
  if (!v) return [];
  return String(v).split(/[,;]/).map(s => {
    const m = s.match(/<([^>]+)>/);
    return (m ? m[1] : s).trim();
  }).filter(Boolean);
}
function encodeHeaderWord(s) {
  if (/^[\x00-\x7F]*$/.test(s)) return s;     // ascii — как есть
  return "=?UTF-8?B?" + btoa(unescape(encodeURIComponent(s))) + "?=";
}
function buildMessage(acc, { to, cc, subject, text, html, inReplyTo, fromName }) {
  const date = new Date().toUTCString();
  const msgId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@${(acc.email || "crm").split("@")[1] || "crm"}>`;
  const fromHeader = fromName ? `${encodeHeaderWord(fromName)} <${acc.email}>` : acc.email;
  const headers = [
    `From: ${fromHeader}`,
    `To: ${to || ""}`,
    cc ? `Cc: ${cc}` : null,
    `Subject: ${encodeHeaderWord(subject || "")}`,
    `Date: ${date}`,
    `Message-ID: ${msgId}`,
    inReplyTo ? `In-Reply-To: ${inReplyTo}` : null,
    inReplyTo ? `References: ${inReplyTo}` : null,
    "MIME-Version: 1.0",
  ].filter(Boolean);
  let bodyPart;
  if (html) {
    const boundary = "b_" + Math.random().toString(36).slice(2);
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    const plain = text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    bodyPart =
      `--${boundary}${CRLF}Content-Type: text/plain; charset=UTF-8${CRLF}Content-Transfer-Encoding: base64${CRLF}${CRLF}` +
      chunk76(btoa(unescape(encodeURIComponent(plain)))) + CRLF +
      `--${boundary}${CRLF}Content-Type: text/html; charset=UTF-8${CRLF}Content-Transfer-Encoding: base64${CRLF}${CRLF}` +
      chunk76(btoa(unescape(encodeURIComponent(html)))) + CRLF +
      `--${boundary}--`;
  } else {
    headers.push("Content-Type: text/plain; charset=UTF-8");
    headers.push("Content-Transfer-Encoding: base64");
    bodyPart = chunk76(btoa(unescape(encodeURIComponent(text || ""))));
  }
  // dot-stuffing: строки, начинающиеся с точки, экранируем
  const message = headers.join(CRLF) + CRLF + CRLF + bodyPart;
  return message.split(CRLF).map(l => (l.startsWith(".") ? "." + l : l)).join(CRLF);
}
function chunk76(s) { return (s.match(/.{1,76}/g) || []).join(CRLF); }

// Проверка подключения (для кнопки «Проверить» в админке): IMAP login + SELECT.
export async function mailTestConnection(acc) {
  const conn = await imapLogin(acc);
  try {
    const sel = await imapCmd(conn, conn._tag(), `SELECT "INBOX"`);
    if (sel.status !== "OK") throw new Error("SELECT INBOX: " + sel.text);
    const exM = sel.resp.match(/\* (\d+) EXISTS/);
    return { ok: true, total: exM ? parseInt(exM[1], 10) : 0 };
  } finally {
    try { await imapCmd(conn, conn._tag(), "LOGOUT"); } catch {}
    await closeConn(conn);
  }
}
