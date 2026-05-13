// Pllato CORE CRM — корневой модуль (boot, Auth, Theme, router, shell).
// Бизнес-логика по разделам — в ./app/views/*.js.

import { ICONS } from "./app/icons.js";
import { renderContacts } from "./app/views/contacts.js";
import { renderDeals, tryOpenDealFromHash } from "./app/views/deals.js";
import { renderTasks } from "./app/views/tasks.js";
import { renderFeed } from "./app/views/feed.js";
import { renderChat } from "./app/views/chat.js";
import { renderDashboard } from "./app/views/dashboard.js";
import { renderSettings } from "./app/views/settings.js";
import { listNotifications, unreadCount, markRead, markAllRead, typeMeta, seedDemoNotifications } from "./app/notifications.js";
import { hasPermission, currentPermissions } from "./app/employees.js";
import { VERSION, REVISION } from "./app/version.js";

const $app = document.getElementById("app");

// ---------- Theme ----------
const Theme = {
  get current() {
    return document.documentElement.getAttribute("data-theme") || "dark";
  },
  apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pllato_theme", theme);
  },
  init() {
    const stored = localStorage.getItem("pllato_theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    this.apply(stored || (prefersLight ? "light" : "dark"));
  },
  toggle() {
    this.apply(this.current === "light" ? "dark" : "light");
  }
};

// ---------- State ----------
const state = {
  user: null,
  route: "dashboard",
};

// ---------- Firebase (опционально) ----------
const fbConfig = window.PLLATO_FIREBASE_CONFIG || {};
const USE_FIREBASE = Boolean(fbConfig.apiKey && fbConfig.authDomain);

let firebaseAuth = null;
async function initFirebase() {
  if (!USE_FIREBASE || firebaseAuth) return;
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const auth = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
  const app = initializeApp(fbConfig);
  firebaseAuth = { app, ...auth, instance: auth.getAuth(app) };
  auth.onAuthStateChanged(firebaseAuth.instance, (u) => {
    state.user = u
      ? { uid: u.uid, email: u.email, name: u.displayName || u.email, role: "admin" }
      : null;
    render();
  });
}

// ---------- Auth ----------
const Auth = {
  current() {
    if (USE_FIREBASE) return state.user;
    try { return JSON.parse(localStorage.getItem("pllato_demo_user") || "null"); }
    catch { return null; }
  },
  async signIn(email, password) {
    if (USE_FIREBASE) {
      await initFirebase();
      await firebaseAuth.signInWithEmailAndPassword(firebaseAuth.instance, email, password);
      return;
    }
    if (!email || !password) throw new Error("Введи email и пароль");
    const user = { uid: "demo-" + btoa(email), email, name: email.split("@")[0], role: "admin" };
    localStorage.setItem("pllato_demo_user", JSON.stringify(user));
    state.user = user;
  },
  async signOut() {
    if (USE_FIREBASE) {
      await firebaseAuth.signOut(firebaseAuth.instance);
      return;
    }
    localStorage.removeItem("pllato_demo_user");
    state.user = null;
  }
};

// ---------- Router ----------
const ROUTES = [
  { id: "dashboard", title: "Дашборд",   icon: "dashboard", group: "workspace" },
  { id: "contacts",  title: "Контакты",  icon: "users",     group: "workspace" },
  { id: "crm",       title: "CRM",       icon: "deals",     group: "workspace" },
  { id: "tasks",     title: "Задачи",    icon: "tasks",     group: "workspace" },
  { id: "feed",      title: "Лента",     icon: "feed",      group: "team" },
  { id: "chat",      title: "Чаты",      icon: "chat",      group: "team" },
  { id: "settings",  title: "Настройки", icon: "settings",  group: "system" },
];

// Алиасы старых маршрутов на новые
const ROUTE_ALIASES = { deals: "crm" };

function parseRoute() {
  const h = (location.hash || "#dashboard").replace(/^#/, "");
  let id = h.split("/")[0] || "dashboard";
  if (ROUTE_ALIASES[id]) id = ROUTE_ALIASES[id];
  if (!ROUTES.find(r => r.id === id)) id = "dashboard";
  // Если нет прав на этот раздел — fallback на первый доступный
  if (!hasPermission(id)) {
    const allowed = currentPermissions();
    const first = ROUTES.find(r => allowed.includes(r.id));
    if (first) {
      location.hash = "#" + first.id;
      return first.id;
    }
  }
  return id;
}

window.addEventListener("hashchange", () => {
  state.route = parseRoute();
  render();
});

// ---------- Render ----------
function render() {
  const user = Auth.current();
  if (!user) { renderLogin(); return; }
  state.user = user;
  renderShell();
}

function renderLogin() {
  $app.innerHTML = `
    <div class="login-wrap">
      <div class="login-brand">
        <img src="./assets/pllato_icon.svg" alt="Pllato">
        <h1>Pllato CORE</h1>
        <div class="tagline">CRM Workspace</div>
      </div>
      <div class="login-card">
        <p class="sub">${USE_FIREBASE
          ? "Войди с email и паролем, зарегистрированным в Firebase."
          : "DEMO-режим: введи любой email и пароль — данные сохранятся локально. Подключим Firebase на следующем шаге."}</p>
        <form id="loginForm">
          <div class="field">
            <label>Email</label>
            <input type="email" name="email" required autocomplete="email" placeholder="you@example.com">
          </div>
          <div class="field">
            <label>Пароль</label>
            <input type="password" name="password" required autocomplete="current-password" placeholder="••••••••">
          </div>
          <button class="btn" type="submit">Войти</button>
          <div id="loginMsg" class="login-msg"></div>
        </form>
      </div>
    </div>
  `;
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMsg");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    msg.classList.remove("err");
    try {
      const fd = new FormData(form);
      await Auth.signIn(fd.get("email").trim(), fd.get("password"));
      render();
    } catch (err) {
      msg.textContent = err.message || String(err);
      msg.classList.add("err");
    }
  });
}

function renderShell() {
  const route = state.route;
  const routeMeta = ROUTES.find(r => r.id === route);
  const u = state.user;
  const initials = (u.name || u.email || "?").slice(0, 1).toUpperCase();

  const groups = [
    { id: "workspace", title: "Рабочее пространство" },
    { id: "team",      title: "Команда" },
    { id: "system",    title: "Система" },
  ];

  const allowed = currentPermissions();
  const visibleRoutes = ROUTES.filter(r => allowed.includes(r.id));
  const navHtml = groups.map(g => {
    const groupRoutes = visibleRoutes.filter(r => r.group === g.id);
    if (groupRoutes.length === 0) return "";
    return `
      <div class="nav-section">${g.title}</div>
      ${groupRoutes.map(r => `
        <a class="nav-item ${r.id === route ? "active" : ""}" href="#${r.id}">
          <span class="nav-ico">${ICONS[r.icon]}</span>${r.title}
        </a>
      `).join("")}
    `;
  }).join("");

  $app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand" id="brandTag" title="Открыть «О приложении»">
          <img src="./assets/pllato_icon.svg" alt="Pllato">
          <div class="brand-title">
            <span class="name">Pllato CORE</span>
            <span class="sub">CRM · v${VERSION} · ${REVISION}</span>
          </div>
        </div>
        ${navHtml}
        <div class="nav-spacer"></div>
        <a class="nav-item" id="logoutBtn">
          <span class="nav-ico">${ICONS.logout}</span>Выйти
        </a>
      </aside>

      <header class="topbar">
        <h2>${routeMeta.title}</h2>
        ${renderNotificationsBtn()}
        <button class="theme-toggle" id="themeToggle" title="Сменить тему" aria-label="Сменить тему">
          ${Theme.current === "light" ? ICONS.moon : ICONS.sun}
        </button>
        <div class="user">
          <span>${u.name || u.email}</span>
          <div class="user-avatar">${initials}</div>
        </div>
        ${renderNotificationsPanel()}
      </header>

      <main class="main" id="mainView"></main>
    </div>
  `;

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await Auth.signOut();
    location.hash = "";
    render();
  });
  document.getElementById("themeToggle").addEventListener("click", () => {
    Theme.toggle();
    render();
  });
  document.getElementById("brandTag")?.addEventListener("click", () => {
    location.hash = "#settings";
    setTimeout(() => {
      document.querySelector("#aboutBlock")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  });
  wireNotifications();

  renderMain(route, document.getElementById("mainView"));
}

function renderMain(route, container) {
  if (route === "dashboard") {
    renderDashboard(container);
    return;
  }
  if (route === "contacts") {
    renderContacts(container);
    return;
  }
  if (route === "crm") {
    tryOpenDealFromHash();
    renderDeals(container);
    return;
  }
  if (route === "tasks") {
    renderTasks(container);
    return;
  }
  if (route === "feed") {
    renderFeed(container);
    return;
  }
  if (route === "chat") {
    renderChat(container);
    return;
  }
  if (route === "settings") {
    renderSettings(container);
    return;
  }

  // fallback (не должно происходить — все маршруты обработаны выше)
  container.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">${ICONS.settings}</div>
      <h3>${route}</h3>
      <p>Неизвестный раздел.</p>
    </div>
  `;
}

// ---------- Notifications UI ----------
let notifOpen = false;
function renderNotificationsBtn() {
  seedDemoNotifications();
  const count = unreadCount();
  return `
    <button class="theme-toggle notif-btn" id="notifToggle" title="Уведомления" aria-label="Уведомления">
      ${ICONS.bell}
      ${count > 0 ? `<span class="notif-dot">${count}</span>` : ""}
    </button>
  `;
}
function fmtNotifRel(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин`;
  if (h < 24) return `${h} ч`;
  if (d < 30) return `${d} дн`;
  return new Date(ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}
function renderNotificationsPanel() {
  if (!notifOpen) return "";
  const items = listNotifications();
  return `
    <div class="notif-panel" id="notifPanel">
      <header class="notif-head">
        <h3>Уведомления</h3>
        <button class="btn-ghost" id="notifMarkAll">Прочитать все</button>
      </header>
      <div class="notif-list">
        ${items.length === 0
          ? `<div class="tl-empty">Уведомлений нет</div>`
          : items.map(n => {
              const t = typeMeta(n.type);
              return `
                <a class="notif-item ${!n.read ? "unread" : ""}" data-id="${n.id}" href="${n.link || "#"}">
                  <div class="notif-icon">${t.icon}</div>
                  <div class="notif-body">
                    <div class="notif-title">${escapeHtml(n.title)}</div>
                    ${n.description ? `<div class="notif-desc">${escapeHtml(n.description)}</div>` : ""}
                    <div class="notif-meta"><span>${t.label}</span><span>${fmtNotifRel(n.createdAt)}</span></div>
                  </div>
                </a>
              `;
            }).join("")}
      </div>
    </div>
  `;
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function wireNotifications() {
  const toggle = document.getElementById("notifToggle");
  toggle?.addEventListener("click", e => {
    e.stopPropagation();
    notifOpen = !notifOpen;
    render();
  });
  document.querySelectorAll(".notif-item").forEach(item => {
    item.addEventListener("click", () => {
      markRead(item.dataset.id);
      notifOpen = false;
      setTimeout(() => render(), 50);
    });
  });
  document.getElementById("notifMarkAll")?.addEventListener("click", e => {
    e.stopPropagation();
    markAllRead();
    render();
  });
  // Закрытие при клике вне панели
  if (notifOpen) {
    setTimeout(() => {
      document.addEventListener("click", function closeNotif(e) {
        if (!e.target.closest("#notifPanel") && !e.target.closest("#notifToggle")) {
          notifOpen = false;
          document.removeEventListener("click", closeNotif);
          render();
        }
      });
    }, 0);
  }
}

// ---------- Boot ----------
(async function boot() {
  Theme.init();
  state.route = parseRoute();
  if (USE_FIREBASE) {
    try { await initFirebase(); }
    catch (e) { console.error("Firebase init failed:", e); }
  }
  render();
})();
