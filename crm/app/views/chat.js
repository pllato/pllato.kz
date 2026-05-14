// Pllato CRM — модуль Чаты.
// Локальные беседы + синхронизация WhatsApp (Green-API) через Cloudflare Worker.

import { Store } from "../store.js";
import { ICONS } from "../icons.js";
import { listChannels } from "../channels.js";

const CHATS = "chats";
const MESSAGES = "chat_messages";

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function initialsOf(name) {
  const parts = (name || "").trim().split(/\s+/);
  return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
}
function fmtTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}
function fmtChatRel(ts) {
  if (!ts) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tsDay = new Date(ts); tsDay.setHours(0, 0, 0, 0);
  if (tsDay.getTime() === today.getTime()) return fmtTime(ts);
  return new Date(ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}
function cloudEnabled() {
  return Boolean(String(window.PLLATO_API_BASE || "").trim());
}

const _chatSaved = (() => { try { return JSON.parse(sessionStorage.getItem("pllato_state_chat") || "null") || {}; } catch { return {}; } })();
const state = {
  activeChatId: _chatSaved.activeChatId || null,
  draft: "",
  fileUrl: "",
  fileName: "",
  asVoice: false,
  syncing: false,
  syncTimer: null,
};
function saveChatState() {
  sessionStorage.setItem("pllato_state_chat", JSON.stringify({ activeChatId: state.activeChatId }));
}

function seedDemo() {
  if (cloudEnabled()) return;
  if (Store.list(CHATS).length > 0) return;

  const chats = [
    { name: "Айдана Бекова", role: "Аналитик", preview: "Презентация готова" },
    { name: "Тимур Алиев", role: "Sales", preview: "Клиент подтвердил демо" },
    { name: "Команда #общий", role: "Group", preview: "Доброе утро всем!", isGroup: true },
  ];
  chats.forEach(c => Store.create(CHATS, c));

  const all = Store.list(CHATS);
  const now = Date.now();
  const seed = [
    { chatId: all[0].id, from: "them", text: "Привет! Презентация для Tech Solutions готова, скинула в общий чат.", ts: now - 90 * 60000 },
    { chatId: all[0].id, from: "me", text: "Спасибо! Глянул, выглядит супер. Завтра показываем клиенту.", ts: now - 80 * 60000 },
    { chatId: all[1].id, from: "them", text: "Клиент подтвердил демо на пятницу 15:00.", ts: now - 3 * 3600000 },
    { chatId: all[2].id, from: "them", text: "Доброе утро всем! Сегодня релиз 1.2.", ts: now - 5 * 3600000 },
  ];
  seed.forEach(m => Store.create(MESSAGES, m));
}

function messagePreview(m) {
  if (!m) return "";
  if (m.media?.url) {
    const kind = m.media.kind === "audio" ? "Аудио" : m.media.kind === "video" ? "Видео" : m.media.kind === "image" ? "Фото" : "Файл";
    return `[${kind}] ${m.media.caption || m.media.fileName || ""}`.trim();
  }
  return String(m.text || "");
}

function renderMediaBlock(m) {
  const media = m?.media;
  if (!media?.url) return "";
  const url = escapeAttr(media.url);
  const fileName = escape(media.fileName || "file");
  const caption = media.caption ? `<div class="msg-media-cap">${escape(media.caption)}</div>` : "";

  if (media.kind === "audio") {
    return `
      <div class="msg-media-wrap">
        <audio controls preload="none" src="${url}"></audio>
        ${caption}
      </div>
    `;
  }
  if (media.kind === "image") {
    return `
      <div class="msg-media-wrap">
        <a href="${url}" target="_blank" rel="noopener noreferrer">
          <img class="msg-media-img" src="${url}" alt="${fileName}">
        </a>
        ${caption}
      </div>
    `;
  }
  if (media.kind === "video") {
    return `
      <div class="msg-media-wrap">
        <video controls preload="metadata" class="msg-media-video" src="${url}"></video>
        ${caption}
      </div>
    `;
  }

  return `
    <div class="msg-media-wrap">
      <a class="msg-file-link" href="${url}" target="_blank" rel="noopener noreferrer">📎 ${fileName}</a>
      ${caption}
    </div>
  `;
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

async function syncCloudChats(container) {
  if (!cloudEnabled()) return;
  if (state.syncing) return;
  if (typeof Store.cloudSyncCollections !== "function") return;

  state.syncing = true;
  try {
    await Store.cloudSyncCollections([CHATS, MESSAGES], { pushLocalDivergence: false });
    if (container?.isConnected) renderChat(container, { skipSyncKick: true });
  } catch (e) {
    console.warn("chat cloud sync failed:", e);
  } finally {
    state.syncing = false;
  }
}

function ensureSyncLoop(container) {
  if (!cloudEnabled() || state.syncTimer) return;
  state.syncTimer = setInterval(() => {
    if (!container?.isConnected) {
      clearInterval(state.syncTimer);
      state.syncTimer = null;
      return;
    }
    syncCloudChats(container);
  }, 12000);
}

function findWaChannelForChat(chat) {
  const channels = listChannels({ type: "greenapi_wa" }).filter(c => c.active !== false);
  if (channels.length === 0) return null;

  const instance = String(chat?.waInstanceId || "").replace(/\D/g, "");
  if (!instance) return channels[0];

  const exact = channels.find(c => String(c.public?.id_instance || "").replace(/\D/g, "") === instance);
  return exact || channels[0];
}

function normalizeWaRecipient(to) {
  const src = String(to || "").trim();
  if (!src) return "";
  if (src.includes("@c.us") || src.includes("@g.us") || src.includes("@lid")) return src;
  const digits = src.replace(/[^\d]/g, "");
  return digits ? `${digits}@c.us` : "";
}

function phoneDigitsFromWaChatId(value) {
  const raw = String(value || "").trim();
  const direct = raw.match(/^(\d+)@c\.us$/i);
  if (direct?.[1]) return direct[1];
  return raw.replace(/[^\d]/g, "");
}

export function renderChat(container, opts = {}) {
  seedDemo();

  const chats = Store.list(CHATS);
  if (!state.activeChatId && chats.length) state.activeChatId = chats[0].id;
  if (state.activeChatId && !Store.get(CHATS, state.activeChatId)) {
    state.activeChatId = chats[0]?.id || null;
  }

  const activeChat = state.activeChatId ? Store.get(CHATS, state.activeChatId) : null;
  const activePhoneDigits = phoneDigitsFromWaChatId(activeChat?.waChatId || activeChat?.phone || "");
  const activeWaHref = activePhoneDigits ? `https://wa.me/${activePhoneDigits}` : "";
  const activeTelHref = activePhoneDigits ? `tel:+${activePhoneDigits}` : "";
  const allMessages = Store.list(MESSAGES)
    .filter(m => m.chatId === state.activeChatId)
    .reverse();

  container.innerHTML = `
    <div class="chat-view">
      <aside class="chat-list-pane">
        <div class="chat-list-head">Беседы</div>
        <div class="chat-list">
          ${chats.map(c => {
            const last = Store.list(MESSAGES).find(m => m.chatId === c.id);
            const lastTs = (last?.ts || last?.createdAt || c.updatedAt || c.createdAt);
            const lastText = messagePreview(last) || c.preview || "";
            return `
              <button class="chat-row ${c.id === state.activeChatId ? "active" : ""}" data-id="${c.id}">
                <div class="avatar avatar-md ${c.isGroup ? "group" : ""}">${c.isGroup ? "#" : initialsOf(c.name)}</div>
                <div class="chat-row-body">
                  <div class="chat-row-top">
                    <span class="chat-row-name">${escape(c.name)}</span>
                    <span class="chat-row-time">${fmtChatRel(lastTs)}</span>
                  </div>
                  <div class="chat-row-preview">${escape(lastText).slice(0, 80)}</div>
                </div>
              </button>
            `;
          }).join("")}
        </div>
      </aside>

      <section class="chat-thread-pane">
        ${activeChat ? `
          <header class="chat-thread-head">
            <div class="wa-dialog-user">
              <div class="avatar avatar-md ${activeChat.isGroup ? "group" : ""}">${activeChat.isGroup ? "#" : initialsOf(activeChat.name)}</div>
              <div>
                <div class="chat-thread-name">${escape(activeChat.name)}</div>
                <div class="chat-thread-sub">${escape(activeChat.role || (activeChat.wa ? "WhatsApp" : ""))}</div>
              </div>
            </div>
            <div class="wa-dialog-actions">
              ${activeTelHref && !activeChat.isGroup ? `<a class="wa-action-link" href="${escapeAttr(activeTelHref)}">Позвонить</a>` : ""}
              ${activeWaHref && activeChat.wa ? `<a class="wa-action-link" href="${escapeAttr(activeWaHref)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>` : ""}
            </div>
          </header>

          <div class="chat-messages" id="chatMessages">
            ${allMessages.length === 0
              ? `<div class="chat-empty">Сообщений пока нет — напиши первое.</div>`
              : allMessages.map(m => `
                <div class="msg ${m.from === "me" ? "me" : "them"}">
                  <div class="msg-bubble">
                    ${m.text ? `<div class="msg-text">${escape(m.text).replace(/\n/g, "<br>")}</div>` : ""}
                    ${renderMediaBlock(m)}
                  </div>
                  <div class="msg-time">${fmtTime(m.ts || m.createdAt)}</div>
                </div>
              `).join("")}
          </div>

          <form class="chat-compose" id="chatCompose">
            <input name="text" type="text" placeholder="Напиши сообщение..." autocomplete="off" value="${escape(state.draft)}">
            <button type="submit" class="btn-primary" title="Отправить">${ICONS.send}</button>
          </form>
          <form class="chat-compose chat-compose-media" id="chatComposeMedia">
            <input name="fileUrl" type="url" placeholder="Ссылка на файл (опц.)" value="${escape(state.fileUrl)}">
            <input name="fileName" type="text" placeholder="Имя файла (опц.)" value="${escape(state.fileName)}">
            <label class="chat-voice-opt"><input name="asVoice" type="checkbox" ${state.asVoice ? "checked" : ""}> voice</label>
          </form>
        ` : `<div class="placeholder"><div class="placeholder-icon">${ICONS.chat}</div><h3>Выбери беседу</h3></div>`}
      </section>
    </div>
  `;

  const msgs = container.querySelector("#chatMessages");
  if (msgs) msgs.scrollTop = msgs.scrollHeight;

  wireEvents(container);

  ensureSyncLoop(container);
  if (!opts.skipSyncKick) {
    setTimeout(() => { syncCloudChats(container); }, 0);
  }
}

function wireEvents(container) {
  container.querySelectorAll(".chat-row").forEach(row => {
    row.addEventListener("click", () => {
      state.activeChatId = row.dataset.id;
      state.draft = "";
      state.fileUrl = "";
      state.fileName = "";
      state.asVoice = false;
      saveChatState();
      renderChat(container, { skipSyncKick: true });
    });
  });

  const compose = container.querySelector("#chatCompose");
  const media = container.querySelector("#chatComposeMedia");
  const textInput = compose?.querySelector("input[name='text']");
  const fileUrlInput = media?.querySelector("input[name='fileUrl']");
  const fileNameInput = media?.querySelector("input[name='fileName']");
  const asVoiceInput = media?.querySelector("input[name='asVoice']");

  textInput?.addEventListener("input", (e) => { state.draft = e.target.value; });
  fileUrlInput?.addEventListener("input", (e) => { state.fileUrl = e.target.value; });
  fileNameInput?.addEventListener("input", (e) => { state.fileName = e.target.value; });
  asVoiceInput?.addEventListener("change", (e) => { state.asVoice = !!e.target.checked; });

  compose?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.activeChatId) return;

    const chat = Store.get(CHATS, state.activeChatId);
    if (!chat) return;

    const text = String(textInput?.value || "").trim();
    const fileUrl = String(fileUrlInput?.value || "").trim();
    const fileName = String(fileNameInput?.value || "").trim();
    const asVoice = !!asVoiceInput?.checked;

    if (!text && !fileUrl) return;

    if (chat.wa) {
      const waChannel = findWaChannelForChat(chat);
      if (!waChannel) {
        alert("Нет активного WhatsApp-канала в Контакт-центре.");
        return;
      }
      const to = normalizeWaRecipient(chat.waChatId || chat.phone || chat.chatId);
      if (!to) {
        alert("У чата не найден WhatsApp chatId.");
        return;
      }

      try {
        compose.querySelector("button[type='submit']")?.setAttribute("disabled", "disabled");
        await workerFetch("/wa/send", {
          channelId: waChannel.id,
          to,
          chatName: chat.name || "",
          text,
          urlFile: fileUrl || undefined,
          fileName: fileName || undefined,
          caption: fileUrl ? text : undefined,
          asVoice,
        });
      } catch (err) {
        alert(err?.message || String(err));
        compose.querySelector("button[type='submit']")?.removeAttribute("disabled");
        return;
      }
      compose.querySelector("button[type='submit']")?.removeAttribute("disabled");
    }

    // Локальный optimistic-upsert для мгновенного UX
    const created = Store.create(MESSAGES, {
      chatId: state.activeChatId,
      from: "me",
      text,
      media: fileUrl ? {
        kind: asVoice ? "audio" : "file",
        url: fileUrl,
        fileName: fileName || "file",
        caption: text || "",
      } : null,
      ts: Date.now(),
    });

    Store.update(CHATS, state.activeChatId, {
      preview: messagePreview(created),
      lastMessageAt: created.ts,
    });

    state.draft = "";
    state.fileUrl = "";
    state.fileName = "";
    state.asVoice = false;
    renderChat(container, { skipSyncKick: true });

    if (chat.wa && cloudEnabled()) {
      setTimeout(() => { syncCloudChats(container); }, 600);
    }
  });
}
