// Pllato CRM — shared WhatsApp dialog helpers for Contacts/Deals/Chats.

import { Store } from "./store.js";
import { listChannels } from "./channels.js";

const CHATS = "chats";
const MESSAGES = "chat_messages";

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function waCloudEnabled() {
  return Boolean(String(window.PLLATO_API_BASE || "").trim());
}

export function normalizePhoneDigits(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

export function waChatIdFromPhone(phone) {
  const digits = normalizePhoneDigits(phone);
  return digits ? `${digits}@c.us` : "";
}

function normalizeInstanceId(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

export function findActiveWaChannel() {
  return listChannels({ type: "greenapi_wa" }).find(c => c.active !== false) || null;
}

export async function syncWaCollections() {
  if (!waCloudEnabled()) return { ok: false, reason: "cloud-disabled" };
  if (typeof Store.cloudSyncCollections !== "function") return { ok: false, reason: "store-sync-missing" };
  return Store.cloudSyncCollections([CHATS, MESSAGES], { pushLocalDivergence: false });
}

export function resolveOrCreateDirectWaChat({ name, phone }) {
  const waChatId = waChatIdFromPhone(phone);
  if (!waChatId) return { chat: null, channel: null, waChatId: "" };

  const channel = findActiveWaChannel();
  const instanceId = normalizeInstanceId(channel?.public?.id_instance);
  const preferredId = instanceId ? `wa:${instanceId}:${waChatId}` : null;

  let chat = null;
  if (preferredId) chat = Store.get(CHATS, preferredId);
  if (!chat) {
    chat = Store.list(CHATS).find(c => c?.wa && !c?.isGroup && c.waChatId === waChatId) || null;
  }

  if (!chat) {
    const now = Date.now();
    const draft = {
      id: preferredId || `wa:local:${waChatId}`,
      wa: true,
      channelType: "greenapi_wa",
      waInstanceId: instanceId || "",
      waChatId,
      isGroup: false,
      name: String(name || "").trim() || `+${waChatId.replace("@c.us", "")}`,
      role: "WhatsApp",
      preview: "",
      lastMessageAt: now,
      phone: normalizePhoneDigits(phone),
      createdAt: now,
      updatedAt: now,
    };
    try {
      // Try explicit id first to stay consistent with webhook naming.
      Store.create(CHATS, draft);
      chat = Store.get(CHATS, draft.id) || Store.list(CHATS).find(x => x.id === draft.id) || null;
    } catch {
      // Fallback if Store implementation decides id itself.
      chat = Store.create(CHATS, draft);
    }
  }

  return { chat, channel, waChatId };
}

export function messagesForChat(chatId) {
  if (!chatId) return [];
  return Store.list(MESSAGES).filter(m => m.chatId === chatId).reverse();
}

export function messagePreview(m) {
  if (!m) return "";
  if (m.media?.url) {
    const kind = m.media.kind === "audio" ? "Аудио" : m.media.kind === "video" ? "Видео" : m.media.kind === "image" ? "Фото" : "Файл";
    return `[${kind}] ${m.media.caption || m.media.fileName || ""}`.trim();
  }
  return String(m.text || "");
}

export function renderMessageMedia(m) {
  const media = m?.media;
  if (!media?.url) return "";
  const url = escapeAttr(media.url);
  const fileName = escape(media.fileName || "file");
  const caption = media.caption ? `<div class="msg-media-cap">${escape(media.caption)}</div>` : "";

  if (media.kind === "audio") {
    return `<div class="msg-media-wrap"><audio controls preload="none" src="${url}"></audio>${caption}</div>`;
  }
  if (media.kind === "image") {
    return `<div class="msg-media-wrap"><a href="${url}" target="_blank" rel="noopener noreferrer"><img class="msg-media-img" src="${url}" alt="${fileName}"></a>${caption}</div>`;
  }
  if (media.kind === "video") {
    return `<div class="msg-media-wrap"><video controls preload="metadata" class="msg-media-video" src="${url}"></video>${caption}</div>`;
  }
  return `<div class="msg-media-wrap"><a class="msg-file-link" href="${url}" target="_blank" rel="noopener noreferrer">📎 ${fileName}</a>${caption}</div>`;
}

export function renderDialogMessages(messages, { timeFormatter }) {
  if (!messages || messages.length === 0) {
    return `<div class="chat-empty">Сообщений пока нет.</div>`;
  }
  return messages.map(m => `
    <div class="msg ${m.from === "me" ? "me" : "them"}">
      <div class="msg-bubble">
        ${m.text ? `<div class="msg-text">${escape(m.text).replace(/\n/g, "<br>")}</div>` : ""}
        ${renderMessageMedia(m)}
      </div>
      <div class="msg-time">${timeFormatter?.(m.ts || m.createdAt) || ""}</div>
    </div>
  `).join("");
}

async function firebaseIdToken() {
  const cfg = window.PLLATO_FIREBASE_CONFIG || {};
  if (!cfg.apiKey || !cfg.authDomain) return null;

  const appMod = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js");
  const authMod = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
  const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(cfg);
  const auth = authMod.getAuth(app);
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function workerFetch(path, payload) {
  const base = String(window.PLLATO_API_BASE || "").trim().replace(/\/+$/, "");
  if (!base) throw new Error("Не задан URL Worker");
  const token = await firebaseIdToken();
  if (!token) throw new Error("Нет активной Firebase-сессии");

  const res = await fetch(base + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload || {}),
  });

  let json = null;
  try { json = await res.json(); } catch {}
  if (!res.ok || !json?.ok) {
    const details = json?.details ? ` ${typeof json.details === "string" ? json.details : JSON.stringify(json.details)}` : "";
    throw new Error((json?.error || `HTTP ${res.status}`) + details);
  }
  return json;
}

export async function sendWaFromDialog({ chat, channel, text, urlFile, fileName, asVoice }) {
  if (!chat?.waChatId) throw new Error("У чата нет waChatId");
  if (!channel?.id) throw new Error("Нет активного WhatsApp-канала");

  const cleanText = String(text || "").trim();
  const cleanUrl = String(urlFile || "").trim();
  const cleanName = String(fileName || "").trim();
  if (!cleanText && !cleanUrl) throw new Error("Нужен текст или ссылка на файл");
  if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) throw new Error("Ссылка на файл должна начинаться с http:// или https://");

  await workerFetch("/wa/send", {
    channelId: channel.id,
    to: chat.waChatId,
    chatName: chat.name || "",
    text: cleanText || "",
    urlFile: cleanUrl || undefined,
    fileName: cleanName || undefined,
    caption: cleanUrl ? cleanText : undefined,
    asVoice: Boolean(asVoice),
  });

  const now = Date.now();
  const localMsg = Store.create(MESSAGES, {
    chatId: chat.id,
    from: "me",
    text: cleanText || "",
    media: cleanUrl ? {
      kind: asVoice ? "audio" : "file",
      url: cleanUrl,
      fileName: cleanName || "file",
      caption: cleanText || "",
    } : null,
    ts: now,
  });
  Store.update(CHATS, chat.id, {
    preview: messagePreview(localMsg),
    lastMessageAt: now,
    updatedAt: now,
  });
  return localMsg;
}
