// Pllato CRM — корневой модуль (boot, Auth, Theme, router, shell).
// Бизнес-логика по разделам — в ./app/views/*.js.

import { ICONS } from "./app/icons.js";
import { renderContacts } from "./app/views/contacts.js";
import { renderDeals, tryOpenDealFromHash } from "./app/views/deals.js";
import { renderTasks } from "./app/views/tasks.js";
import { renderFeed } from "./app/views/feed.js";
import { renderChat } from "./app/views/chat.js";
import { renderCalls } from "./app/views/calls.js";
import { renderDashboard } from "./app/views/dashboard.js";
import { renderSettings } from "./app/views/settings.js";
import { renderFieldOrder } from "./app/views/field_order.js";
import { renderDocs } from "./app/views/docs.js";
import { renderWarehouse } from "./app/views/warehouse/index.js";
import { listNotifications, unreadCount, markRead, markAllRead, typeMeta, seedDemoNotifications } from "./app/notifications.js";
import { getSession, mountGoogleButton, signOut as authSignOut } from "./app/auth.js";
import { hasPermission, currentPermissions, replaceEmployeesFromWorker } from "./app/employees.js";
import { syncChannelsFromWorker } from "./app/channels.js";
import { VERSION, REVISION } from "./app/version.js";
import { Store } from "./app/store.js";

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
let authError = null;

// ---------- Auth ----------
const Auth = {
  current() {
    return getSession()?.user || null;
  },
  async signOut() {
    authSignOut();
    state.user = null;
  },
};

async function hydrateAfterSignIn({ syncStore = true } = {}) {
  const tasks = [
    replaceEmployeesFromWorker(),
    syncChannelsFromWorker(),
  ];
  if (syncStore) tasks.push(Store.cloudBootstrap());
  const results = await Promise.allSettled(tasks);
  results.forEach((r, index) => {
    if (r.status === "rejected") {
      const target = index === 0 ? "employees" : index === 1 ? "channels" : "store";
      console.warn(`${target} bootstrap failed:`, r.reason);
    }
  });
  // После того как данные подтянулись из облака — синхронизируем статусы заказов
  // с фактическим состоянием склада (накладные ↔ orderStatus). Это разовый
  // проход, идемпотентный — чинит данные, созданные до внедрения авто-проводки.
  try {
    const { reconcileOrderStatuses } = await import("./app/deal_items.js");
    reconcileOrderStatuses();
  } catch (e) {
    console.warn("[boot] reconcileOrderStatuses failed:", e);
  }
}

// ---------- Router ----------
const ROUTES = [
  { id: "dashboard", title: "Дашборд",   icon: "dashboard", group: "workspace" },
  { id: "contacts",  title: "Контакты",  icon: "users",     group: "workspace" },
  { id: "crm",       title: "CRM",       icon: "deals",     group: "workspace" },
  { id: "warehouse", title: "Склад",     icon: "warehouse", group: "workspace" },
  { id: "calls",     title: "Звонки",    icon: "phone",     group: "workspace", hiddenInNav: true },
  { id: "tasks",     title: "Задачи",    icon: "tasks",     group: "workspace" },
  { id: "docs",      title: "Документы", icon: "book",      group: "workspace" },
  { id: "feed",      title: "Лента",     icon: "feed",      group: "team" },
  { id: "chat",      title: "Чаты",      icon: "chat",      group: "team" },
  { id: "settings",  title: "Настройки", icon: "settings",  group: "system" },
  { id: "field",     title: "Полевой заказ", icon: "warehouse", group: "workspace" },
];

// Алиасы старых маршрутов на новые
const ROUTE_ALIASES = { deals: "crm", calls: "crm" };

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
        <img src="./assets/pllato_icon.svg" alt="Aminamed">
        <h1>Aminamed CRM</h1>
      </div>
      <div class="login-card">
        <p class="sub">Войди через Google — тот же аккаунт, что и для других приложений Pllato.</p>
        <div id="googleSignInMount" style="display:flex;justify-content:center;margin:8px 0 14px"></div>
        <div id="loginMsg" class="login-msg ${authError ? "err" : ""}">${authError || ""}</div>
        <p class="login-footer-hint">Доступ выдаёт администратор в Настройках Pllato.kz</p>
      </div>
    </div>
  `;
  const msg = document.getElementById("loginMsg");
  const mount = document.getElementById("googleSignInMount");
  mountGoogleButton(mount, {
    onStatus(text) {
      msg.textContent = text || "";
      msg.classList.toggle("err", false);
    },
    async onDone(session) {
      authError = null;
      state.user = session?.user || Auth.current();
      await hydrateAfterSignIn({ syncStore: true });
      state.route = parseRoute();
      render();
    },
    onError(err) {
      authError = err?.message || String(err);
      msg.textContent = authError;
      msg.classList.add("err");
    },
  }).catch((e) => {
    authError = e?.message || String(e);
    msg.textContent = authError;
    msg.classList.add("err");
  });
}

function renderShell() {
  const route = state.route;
  const routeMeta = ROUTES.find(r => r.id === route);
  const u = state.user;
  const initials = (u.name || u.email || "?").slice(0, 1).toUpperCase();

  const allowed = currentPermissions();

  // Если у юзера доступен только field-экран — рендерим минимальный мобильный shell
  // (без sidebar, без topbar). Проверяем строже: должно быть 'field' и НЕ должно
  // быть ни одного «полноценного» CRM-права (даже если warehouse случайно
  // auto-добавился старой миграцией).
  const FULL_PERMS = ["crm", "contacts", "dashboard", "tasks", "feed", "chat", "settings", "calls"];
  const isFieldOnly = allowed.includes("field") && !allowed.some((p) => FULL_PERMS.includes(p));
  if (isFieldOnly) {
    if (route !== "field") {
      location.hash = "#field";
      state.route = "field";
    }
    $app.innerHTML = `<div class="shell shell-field"><main class="main main-field" id="mainView"></main></div>`;
    renderMain("field", document.getElementById("mainView"));
    return;
  }

  const groups = [
    { id: "workspace", title: "Рабочее пространство" },
    { id: "team",      title: "Команда" },
    { id: "system",    title: "Система" },
  ];

  const visibleRoutes = ROUTES.filter(r => allowed.includes(r.id) && !r.hiddenInNav);
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
          <img src="./assets/pllato_icon.svg" alt="Aminamed">
          <div class="brand-title">
            <span class="name">Aminamed CRM</span>
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
  if (route === "warehouse") {
    renderWarehouse(container);
    return;
  }
  if (route === "tasks") {
    renderTasks(container);
    return;
  }
  if (route === "docs") {
    renderDocs(container);
    return;
  }
  if (route === "calls") {
    renderCalls(container);
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
  if (route === "field") {
    renderFieldOrder(container);
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
  window.addEventListener("pllato:auth-expired", () => {
    authError = "Сессия истекла. Войди снова.";
    state.user = null;
    render();
  });
  // Logout из field-экрана (там нет sidebar с #logoutBtn).
  window.addEventListener("pllato:field-signout", async () => {
    await Auth.signOut();
    location.hash = "";
    render();
  });

  render();
  if (Auth.current()) {
    try { await hydrateAfterSignIn({ syncStore: true }); }
    catch (e) { console.warn("boot hydrate failed:", e); }
    render();
  }
})();
