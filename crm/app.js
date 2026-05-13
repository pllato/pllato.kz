// Pllato CRM — корневой модуль (boot, Auth, Theme, router, shell).
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
import { hasPermission, currentPermissions, replaceEmployeesFromFirebase } from "./app/employees.js";
import { syncChannelsFromFirebase } from "./app/channels.js";
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
const USER_CACHE_KEY = "pllato_user_cache";

let fb = null;
let authError = null;
async function initFirebase() {
  if (!USE_FIREBASE || fb) return;
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js");
  const auth = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
  const dbm = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js");
  const app = initializeApp(fbConfig);
  fb = { app, auth, dbm, authInstance: auth.getAuth(app), db: dbm.getDatabase(app) };

  auth.onAuthStateChanged(fb.authInstance, async (u) => {
    if (!u) {
      // Не залогинен — но кэш мог остаться от прежней сессии. Кэш чистим только при явном logout.
      // Если кэша нет, просто покажем login screen.
      if (!localStorage.getItem(USER_CACHE_KEY)) {
        state.user = null;
        render();
      }
      return;
    }
    // Залогинен в Google — проверяем что в команде /users
    const result = await checkUserInTeam(u);
    if (result.ok) {
      const cached = {
        email: u.email,
        name: u.displayName || result.user.name || u.email.split("@")[0],
        photoURL: u.photoURL || "",
        authUid: u.uid,
        crmUid: result.crmUid,
        role: result.user.role || result.user.position || "user",
        cachedAt: Date.now(),
      };
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cached));
      state.user = cached;
      authError = null;
      // Синхронизируем общий список сотрудников из Firebase
      try { replaceEmployeesFromFirebase(result.allUsers, u.email); } catch (e) { console.warn("emp sync failed:", e); }
      // Параллельно тянем каналы связи (Контакт-центр)
      syncChannelsFromFirebase(fb).catch(e => console.warn("ch sync failed:", e));
      render();
    } else {
      // Залогинен в Google, но не в команде — выходим
      await auth.signOut(fb.authInstance);
      localStorage.removeItem(USER_CACHE_KEY);
      state.user = null;
      authError = result.message;
      render();
    }
  });
}

const ROOT_SUPER_ADMIN = "uurraa@gmail.com";

async function checkUserInTeam(user) {
  try {
    const snap = await fb.dbm.get(fb.dbm.ref(fb.db, "users"));
    const users = snap.exists() ? snap.val() : {};
    const userEmail = (user.email || "").toLowerCase().trim();
    const isRoot = userEmail === ROOT_SUPER_ADMIN;
    let found = null, foundUid = null;
    for (const [uid, u] of Object.entries(users)) {
      if (u && u.email && u.email.toLowerCase().trim() === userEmail) {
        found = u; foundUid = uid;
        break;
      }
    }
    // Главный супер-админ — пускаем всегда, даже если записи в /users нет
    if (isRoot) {
      if (!found) {
        // Виртуальная запись для текущей сессии (реальная создастся в app.html)
        found = { email: userEmail, name: user.displayName || "Pllato Admin", isAdmin: true, isSuperAdmin: true };
      }
      return { ok: true, user: found, crmUid: foundUid, allUsers: users };
    }
    if (!found) {
      return { ok: false, message: `Email <code>${userEmail}</code> не найден в команде. Попроси админа добавить тебя в <a href="https://pllato.kz/app.html" target="_blank">pllato.kz/app.html</a>.` };
    }
    // Доступ к Pllato CRM: admin → всегда; иначе пускаем, кроме случая когда apps.pllato_crm === false (явно отключено).
    const isAdmin = found.isAdmin || found.isSuperAdmin;
    const explicitDeny = found.apps && found.apps.pllato_crm === false;
    if (!isAdmin && explicitDeny) {
      return { ok: false, message: `У тебя нет доступа к Pllato CRM. Попроси админа включить приложение в <a href="https://pllato.kz/app.html" target="_blank">pllato.kz/app.html</a>.` };
    }
    return { ok: true, user: found, crmUid: foundUid, allUsers: users };
  } catch (e) {
    const isPermission = String(e.code || e.message || "").includes("permission");
    return {
      ok: false,
      message: isPermission
        ? "Нет прав на чтение базы. Нужно настроить Firebase rules."
        : "Ошибка чтения базы: " + (e.message || e),
    };
  }
}

// ---------- Auth ----------
const Auth = {
  current() {
    if (USE_FIREBASE) {
      if (state.user) return state.user;
      try {
        const cached = JSON.parse(localStorage.getItem(USER_CACHE_KEY) || "null");
        if (cached && cached.email) { state.user = cached; return cached; }
      } catch {}
      return null;
    }
    try { return JSON.parse(localStorage.getItem("pllato_demo_user") || "null"); }
    catch { return null; }
  },
  async signInGoogle() {
    if (!USE_FIREBASE) throw new Error("Google-вход недоступен в DEMO-режиме");
    await initFirebase();
    const provider = new fb.auth.GoogleAuthProvider();
    await fb.auth.signInWithPopup(fb.authInstance, provider);
    // дальше — onAuthStateChanged обработает
  },
  async signInDemo(email, password) {
    if (!email || !password) throw new Error("Введи email и пароль");
    const user = { uid: "demo-" + btoa(email), email, name: email.split("@")[0], role: "admin" };
    localStorage.setItem("pllato_demo_user", JSON.stringify(user));
    state.user = user;
  },
  async signOut() {
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem("pllato_demo_user");
    state.user = null;
    if (USE_FIREBASE && fb) {
      await fb.auth.signOut(fb.authInstance);
    }
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
  if (USE_FIREBASE) {
    $app.innerHTML = `
      <div class="login-wrap">
        <div class="login-brand">
          <img src="./assets/pllato_icon.svg" alt="Pllato">
          <h1>Pllato CRM</h1>
        </div>
        <div class="login-card">
          <p class="sub">Войди через Google — тот же аккаунт, что и для других приложений Pllato.</p>
          <button class="btn google-btn" id="googleSignIn">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            <span>Войти через Google</span>
          </button>
          <div id="loginMsg" class="login-msg ${authError ? "err" : ""}">${authError || ""}</div>
          <p class="login-footer-hint">Доступ выдаёт администратор в Настройках Pllato.kz</p>
        </div>
      </div>
    `;
    const msg = document.getElementById("loginMsg");
    document.getElementById("googleSignIn").addEventListener("click", async () => {
      msg.textContent = "Открываем окно Google...";
      msg.classList.remove("err");
      authError = null;
      try {
        await Auth.signInGoogle();
        // ждём onAuthStateChanged
      } catch (err) {
        const code = err.code || "";
        let text = err.message || String(err);
        if (code.includes("popup-closed-by-user")) text = "Окно Google было закрыто.";
        else if (code.includes("popup-blocked")) text = "Браузер заблокировал всплывающее окно. Разреши popups для pllato.kz.";
        else if (code.includes("network-request-failed")) text = "Нет интернета. Проверь подключение.";
        msg.textContent = text;
        msg.classList.add("err");
      }
    });
    return;
  }

  // DEMO-режим (когда firebase.config.js пустой) — для локальной разработки
  $app.innerHTML = `
    <div class="login-wrap">
      <div class="login-brand">
        <img src="./assets/pllato_icon.svg" alt="Pllato">
        <h1>Pllato CRM</h1>
      </div>
      <div class="login-card">
        <p class="sub">DEMO-режим: введи любой email и пароль — данные сохранятся локально.</p>
        <form id="loginForm">
          <div class="field"><label>Email</label><input type="email" name="email" required placeholder="you@example.com"></div>
          <div class="field"><label>Пароль</label><input type="password" name="password" required placeholder="••••••••"></div>
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
      await Auth.signInDemo(fd.get("email").trim(), fd.get("password"));
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
            <span class="name">Pllato CRM</span>
            <span class="sub">v${VERSION} · ${REVISION}</span>
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
  // Если есть кэш — рендерим shell сразу, не дожидаясь Firebase (UX: без мигания login screen)
  render();
  if (USE_FIREBASE) {
    try { await initFirebase(); }
    catch (e) { console.error("Firebase init failed:", e); }
  }
})();
