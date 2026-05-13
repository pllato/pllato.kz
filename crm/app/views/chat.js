// Pllato CORE CRM — модуль Чаты.
// Список собеседников + переписка. Demo-сотрудники, сообщения в localStorage.

import { Store } from "../store.js";
import { ICONS } from "../icons.js";

const CHATS = "chats";
const MESSAGES = "chat_messages";

function escape(s) {
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

function currentUser() {
  try { return JSON.parse(localStorage.getItem("pllato_demo_user") || "null"); } catch { return null; }
}

function seedDemo() {
  if (Store.list(CHATS).length > 0) return;
  const chats = [
    { name: "Айдана Бекова",  role: "Аналитик",  preview: "Презентация готова" },
    { name: "Тимур Алиев",    role: "Sales",     preview: "Клиент подтвердил демо" },
    { name: "Команда #общий", role: "Group",     preview: "Доброе утро всем!", isGroup: true },
  ];
  chats.forEach(c => Store.create(CHATS, c));

  const all = Store.list(CHATS);
  const now = Date.now();
  const seed = [
    { chatId: all[0].id, from: "them", text: "Привет! Презентация для Tech Solutions готова, скинула в общий чат.", ts: now - 90 * 60000 },
    { chatId: all[0].id, from: "me",   text: "Спасибо! Глянул, выглядит супер. Завтра показываем клиенту.", ts: now - 80 * 60000 },
    { chatId: all[1].id, from: "them", text: "Клиент подтвердил демо на пятницу 15:00.", ts: now - 3 * 3600000 },
    { chatId: all[2].id, from: "them", text: "Доброе утро всем! Сегодня релиз 1.2.", ts: now - 5 * 3600000 },
  ];
  seed.forEach(m => Store.create(MESSAGES, m));
}

const _chatSaved = (() => { try { return JSON.parse(sessionStorage.getItem("pllato_state_chat") || "null") || {}; } catch { return {}; } })();
const state = {
  activeChatId: _chatSaved.activeChatId || null,
  draft: "",
};
function saveChatState() { sessionStorage.setItem("pllato_state_chat", JSON.stringify({ activeChatId: state.activeChatId })); }

export function renderChat(container) {
  seedDemo();
  const chats = Store.list(CHATS);
  if (!state.activeChatId && chats.length) state.activeChatId = chats[0].id;

  const activeChat = state.activeChatId ? Store.get(CHATS, state.activeChatId) : null;
  const allMessages = Store.list(MESSAGES).filter(m => m.chatId === state.activeChatId).reverse();

  container.innerHTML = `
    <div class="chat-view">
      <aside class="chat-list-pane">
        <div class="chat-list-head">Беседы</div>
        <div class="chat-list">
          ${chats.map(c => {
            const last = Store.list(MESSAGES).filter(m => m.chatId === c.id)[0];
            const lastTs = last ? last.createdAt : c.createdAt;
            const lastText = last ? last.text : (c.preview || "");
            return `
              <button class="chat-row ${c.id === state.activeChatId ? "active" : ""}" data-id="${c.id}">
                <div class="avatar avatar-md ${c.isGroup ? "group" : ""}">${c.isGroup ? "#" : initialsOf(c.name)}</div>
                <div class="chat-row-body">
                  <div class="chat-row-top">
                    <span class="chat-row-name">${escape(c.name)}</span>
                    <span class="chat-row-time">${fmtChatRel(lastTs)}</span>
                  </div>
                  <div class="chat-row-preview">${escape(lastText).slice(0, 60)}</div>
                </div>
              </button>
            `;
          }).join("")}
        </div>
      </aside>

      <section class="chat-thread-pane">
        ${activeChat ? `
          <header class="chat-thread-head">
            <div class="avatar avatar-md ${activeChat.isGroup ? "group" : ""}">${activeChat.isGroup ? "#" : initialsOf(activeChat.name)}</div>
            <div>
              <div class="chat-thread-name">${escape(activeChat.name)}</div>
              <div class="chat-thread-sub">${escape(activeChat.role || "")}</div>
            </div>
          </header>

          <div class="chat-messages" id="chatMessages">
            ${allMessages.length === 0
              ? `<div class="chat-empty">Сообщений пока нет — напиши первое.</div>`
              : allMessages.map(m => `
                <div class="msg ${m.from === "me" ? "me" : "them"}">
                  <div class="msg-bubble">${escape(m.text).replace(/\n/g, "<br>")}</div>
                  <div class="msg-time">${fmtTime(m.ts || m.createdAt)}</div>
                </div>
              `).join("")}
          </div>

          <form class="chat-compose" id="chatCompose">
            <input name="text" type="text" placeholder="Напиши сообщение..." autocomplete="off" required value="${escape(state.draft)}">
            <button type="submit" class="btn-primary">${ICONS.plus}</button>
          </form>
        ` : `<div class="placeholder"><div class="placeholder-icon">${ICONS.chat}</div><h3>Выбери беседу</h3></div>`}
      </section>
    </div>
  `;

  // прокрутка вниз
  const msgs = container.querySelector("#chatMessages");
  if (msgs) msgs.scrollTop = msgs.scrollHeight;

  wireEvents(container);
}

function wireEvents(container) {
  container.querySelectorAll(".chat-row").forEach(row => {
    row.addEventListener("click", () => {
      state.activeChatId = row.dataset.id;
      state.draft = "";
      saveChatState();
      renderChat(container);
    });
  });

  const form = container.querySelector("#chatCompose");
  const input = form?.querySelector("input");
  if (input) {
    input.addEventListener("input", e => { state.draft = e.target.value; });
    setTimeout(() => input.focus(), 0);
  }
  form?.addEventListener("submit", e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || !state.activeChatId) return;
    Store.create(MESSAGES, {
      chatId: state.activeChatId,
      from: "me",
      text,
      ts: Date.now(),
    });
    state.draft = "";
    renderChat(container);
  });
}
