// Pllato CRM — Настройки v2.
// Профиль / Workspace / Внешний вид / Сотрудники / Роли / Интеграции / Опасная зона.

import { Store } from "../store.js";
import { ICONS } from "../icons.js";
import { listEmployees, getEmployee, currentEmployee, createEmployee, updateEmployee, removeEmployee, avatar, ROLES, isFirebaseSynced } from "../employees.js";
import { getDealFields, saveDealFields, newFieldId, FIELD_TYPES } from "../custom_fields.js";
import { listChannels, typeMeta, isChannelsSynced } from "../channels.js";
import { VERSION, REVISION, BUILD_DATE, COMMIT_SHORT, HISTORY } from "../version.js";

const ROLES_COLLECTION = "roles";
const PERMISSIONS = [
  { id: "dashboard", label: "Дашборд" },
  { id: "contacts",  label: "Контакты" },
  { id: "crm",       label: "CRM" },
  { id: "calls",     label: "Звонки" },
  { id: "tasks",     label: "Задачи" },
  { id: "feed",      label: "Лента" },
  { id: "chat",      label: "Чаты" },
  { id: "settings",  label: "Настройки" },
];

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function currentUser() {
  try { return JSON.parse(localStorage.getItem("pllato_demo_user") || "null"); } catch { return null; }
}
function getWorkspace() {
  try { return JSON.parse(localStorage.getItem("pllato_workspace") || "null") || { name: "Pllato", slug: "pllato" }; }
  catch { return { name: "Pllato", slug: "pllato" }; }
}
function saveWorkspace(ws) { localStorage.setItem("pllato_workspace", JSON.stringify(ws)); }

function seedRoles() {
  const existing = Store.list(ROLES_COLLECTION);
  if (existing.length === 0) {
    Store.create(ROLES_COLLECTION, { name: "Администратор", system: true, permissions: PERMISSIONS.map(p => p.id) });
    Store.create(ROLES_COLLECTION, { name: "Менеджер",      system: true, permissions: ["dashboard", "contacts", "crm", "calls", "tasks", "feed", "chat"] });
    Store.create(ROLES_COLLECTION, { name: "Наблюдатель",   system: true, permissions: ["dashboard", "feed"] });
    return;
  }
  existing.forEach((r) => {
    const perms = Array.isArray(r.permissions) ? r.permissions.slice() : [];
    if (perms.includes("crm") && !perms.includes("calls")) {
      Store.update(ROLES_COLLECTION, r.id, { permissions: [...perms, "calls"] });
    }
  });
}

const INTEGRATIONS = [
  { id: "telegram",  title: "Telegram",  desc: "Уведомления и команды через Telegram-бот.", fields: [
    { name: "bot_token", label: "Bot Token", placeholder: "От @BotFather" },
    { name: "chat_id",   label: "Chat ID",   placeholder: "ID чата или канала" },
  ]},
  { id: "whatsapp", title: "WhatsApp Business", desc: "Отправка сообщений клиентам в WhatsApp.", fields: [
    { name: "phone_id",  label: "Phone Number ID", placeholder: "Из Meta for Developers" },
    { name: "token",     label: "Access Token",    placeholder: "WhatsApp Business API token" },
  ]},
  { id: "instagram", title: "Instagram",  desc: "Чтение/ответы в Direct Messages из CRM.", fields: [
    { name: "account",   label: "Аккаунт",       placeholder: "@your_brand" },
    { name: "token",     label: "Long-lived Token", placeholder: "Meta Graph API token" },
  ]},
  { id: "facebook",  title: "Facebook",   desc: "Сообщения в Messenger и комментарии под постами.", fields: [
    { name: "page_id",   label: "Page ID",       placeholder: "ID страницы" },
    { name: "token",     label: "Page Token",    placeholder: "Page access token" },
  ]},
  { id: "telephony", title: "Телефония",  desc: "Звонки прямо из CRM через SIP/виртуальную АТС.", fields: [
    { name: "provider",  label: "Провайдер",     placeholder: "Mango, Sipuni, Telphin…" },
    { name: "api_key",   label: "API Key",       placeholder: "Из дашборда провайдера" },
  ]},
  { id: "smtp",      title: "Email / SMTP", desc: "Отправка писем клиентам и системных уведомлений.", fields: [
    { name: "smtp_host", label: "SMTP Host", placeholder: "smtp.gmail.com" },
    { name: "smtp_port", label: "Port",      placeholder: "587" },
    { name: "smtp_user", label: "User",      placeholder: "noreply@..." },
  ]},
  { id: "r2",        title: "Cloudflare R2", desc: "Хранение файлов, прикреплённых к задачам и сделкам.", fields: [
    { name: "bucket",   label: "Bucket",       placeholder: "pllato-core-crm-files" },
    { name: "endpoint", label: "Endpoint URL", placeholder: "https://...r2.cloudflarestorage.com" },
  ]},
];

function getIntegration(id) { try { return JSON.parse(localStorage.getItem("pllato_int_" + id) || "null"); } catch { return null; } }
function saveIntegration(id, data) { if (!data) localStorage.removeItem("pllato_int_" + id); else localStorage.setItem("pllato_int_" + id, JSON.stringify(data)); }

const state = {
  openIntegration: null,
  editingEmployee: null,    // id или "new"
  editingRole: null,        // id или "new"
};

export function renderSettings(container) {
  seedRoles();
  const user = currentUser();
  const ws = getWorkspace();
  const theme = document.documentElement.getAttribute("data-theme") || "dark";
  const employees = listEmployees();
  const roles = Store.list(ROLES_COLLECTION);

  container.innerHTML = `
    <div class="settings-view">

      <!-- Профиль -->
      <section class="settings-block">
        <header class="settings-head">
          <h3>Профиль</h3>
          <p>Данные текущего пользователя.</p>
        </header>
        <div class="settings-body">
          <div class="form-grid">
            <div class="field"><label>Имя</label><input value="${escape(user?.name || "")}" disabled></div>
            <div class="field"><label>Email</label><input value="${escape(user?.email || "")}" disabled></div>
            <div class="field"><label>Роль</label><input value="${escape(user?.role || "—")}" disabled></div>
          </div>
        </div>
      </section>

      <!-- Workspace -->
      <section class="settings-block">
        <header class="settings-head">
          <h3>Рабочее пространство</h3>
          <p>Название и slug организации.</p>
        </header>
        <div class="settings-body">
          <form id="workspaceForm" class="form-grid">
            <div class="field"><label>Название</label><input name="name" value="${escape(ws.name)}" placeholder="Pllato"></div>
            <div class="field"><label>Slug</label><input name="slug" value="${escape(ws.slug)}" placeholder="pllato" pattern="[a-z0-9-]+"></div>
            <div class="field field-wide">
              <button type="submit" class="btn-primary" style="width:auto;">${ICONS.check}<span>Сохранить</span></button>
              <span class="settings-saved" id="wsSaved"></span>
            </div>
          </form>
        </div>
      </section>

      <!-- Внешний вид -->
      <section class="settings-block">
        <header class="settings-head">
          <h3>Внешний вид</h3>
          <p>Тема интерфейса. Сохраняется в браузере.</p>
        </header>
        <div class="settings-body">
          <div class="theme-options">
            <button class="theme-option ${theme === "dark" ? "active" : ""}" data-theme="dark">
              <div class="theme-preview dark"></div><div>Тёмная</div>
            </button>
            <button class="theme-option ${theme === "light" ? "active" : ""}" data-theme="light">
              <div class="theme-preview light"></div><div>Светлая</div>
            </button>
          </div>
        </div>
      </section>

      <!-- Сотрудники -->
      <section class="settings-block">
        <header class="settings-head">
          <h3>Сотрудники <span style="font-weight:500;color:var(--text-muted)">(${employees.length})</span></h3>
          <p>${isFirebaseSynced()
            ? "Единая база сотрудников всех приложений Pllato. Управление — в админке на pllato.kz/app.html."
            : "Локальный список (DEMO). После входа через Google синхронизируется с pllato.kz/app.html."}</p>
        </header>
        <div class="settings-body">
          ${isFirebaseSynced() ? `
            <div class="settings-hint" style="margin-bottom:14px">
              Список сотрудников приходит из общей базы Pllato. Чтобы добавить, удалить или поменять права —
              открой <a href="https://pllato.kz/app.html" target="_blank" style="color:var(--accent)">pllato.kz/app.html</a>
              и используй раздел «⚙ Пользователи». Изменения подтянутся при следующем входе.
            </div>
          ` : ""}
          <div class="employees-list">
            ${employees.map(e => renderEmployeeRow(e, roles)).join("")}
          </div>
          ${!isFirebaseSynced() && state.editingEmployee === "new" ? renderEmployeeForm(null, roles) : ""}
          ${!isFirebaseSynced() ? `<div>
            <button class="btn-ghost" id="addEmployee">${ICONS.plus}<span>Добавить сотрудника</span></button>
          </div>` : ""}
        </div>
      </section>

      <!-- Роли -->
      <section class="settings-block">
        <header class="settings-head">
          <h3>Роли и права <span style="font-weight:500;color:var(--text-muted)">(${roles.length})</span></h3>
          <p>Кому какие разделы CRM доступны.</p>
        </header>
        <div class="settings-body">
          <div class="roles-list">
            ${roles.map(r => renderRoleRow(r)).join("")}
          </div>
          ${state.editingRole === "new" ? renderRoleForm(null) : ""}
          <div>
            <button class="btn-ghost" id="addRole">${ICONS.plus}<span>Добавить роль</span></button>
          </div>
        </div>
      </section>

      <!-- Поля сделок (custom fields) -->
      <section class="settings-block">
        <header class="settings-head">
          <h3>Поля сделок</h3>
          <p>Произвольные поля, которые появятся в форме каждой сделки.</p>
        </header>
        <div class="settings-body">
          <div class="fields-list" id="customFieldsList">
            ${renderCustomFieldsList()}
          </div>
          <div>
            <button class="btn-ghost" id="addCustomField">${ICONS.plus}<span>Добавить поле</span></button>
          </div>
        </div>
      </section>

      <!-- Каналы связи (из Контакт-центра) -->
      <section class="settings-block">
        <header class="settings-head">
          <h3>Каналы связи ${(() => { const all = listChannels({ onlyActive: false }); return all.length ? `<span style="font-weight:500;color:var(--text-muted)">(${all.length})</span>` : ''; })()}</h3>
          <p>Линии телефонии, WhatsApp, почты — подключаются в Контакт-центре, доступны во всех приложениях Pllato.</p>
        </header>
        <div class="settings-body">
          <div class="settings-hint" style="margin-bottom:14px">
            Управление линиями — в общей админке <a href="https://pllato.kz/contact-center.html" target="_blank" style="color:var(--accent)">pllato.kz/contact-center.html</a>.
            Здесь — только просмотр доступных в Pllato CRM. Создание сделок, звонки и сообщения будут идти через эти каналы (когда подключим Worker).
          </div>
          ${renderChannelsList()}
        </div>
      </section>

      <!-- Интеграции -->
      <section class="settings-block">
        <header class="settings-head">
          <h3>Интеграции <span style="font-weight:500;color:var(--text-muted)">(${INTEGRATIONS.length})</span></h3>
          <p>Подключения к внешним сервисам. Реальная отправка — после подключения Worker.</p>
        </header>
        <div class="settings-body">
          <div class="integrations-grid">
            ${INTEGRATIONS.map(it => {
              const cfg = getIntegration(it.id);
              const connected = cfg && Object.values(cfg).some(v => v);
              const isOpen = state.openIntegration === it.id;
              return `
                <div class="integration-card ${isOpen ? "open" : ""}">
                  <header class="integration-head" data-toggle="${it.id}">
                    <div>
                      <div class="integration-title">${it.title}</div>
                      <div class="integration-desc">${it.desc}</div>
                    </div>
                    <span class="integration-status ${connected ? "on" : ""}">${connected ? "Подключено" : "Не подключено"}</span>
                  </header>
                  ${isOpen ? `
                    <form class="integration-form" data-id="${it.id}">
                      ${it.fields.map(f => `
                        <div class="field">
                          <label>${f.label}</label>
                          <input name="${f.name}" value="${escape(cfg?.[f.name] || "")}" placeholder="${escape(f.placeholder)}">
                        </div>
                      `).join("")}
                      <div class="integration-actions">
                        ${connected ? `<button type="button" class="btn-ghost danger" data-clear="${it.id}">${ICONS.trash}<span>Отключить</span></button>` : ""}
                        <button type="submit" class="btn">Сохранить</button>
                      </div>
                    </form>
                  ` : ""}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </section>

      <!-- О приложении -->
      <section class="settings-block" id="aboutBlock">
        <header class="settings-head">
          <h3>О приложении</h3>
          <p>Версия, история ревизий и ссылки.</p>
        </header>
        <div class="settings-body">
          <div class="about-grid">
            <div><span class="about-label">Версия</span><strong>${VERSION}</strong></div>
            <div><span class="about-label">Ревизия</span><strong>${REVISION}</strong></div>
            <div><span class="about-label">Сборка</span><strong>${BUILD_DATE}</strong></div>
            <div><span class="about-label">Commit</span><strong><a href="https://github.com/pllato/pllato-core-crm/commit/${COMMIT_SHORT}" target="_blank" style="color:var(--accent);text-decoration:none">${COMMIT_SHORT}</a></strong></div>
          </div>
          <div class="changelog">
            <div class="settings-section-title">История ревизий</div>
            ${HISTORY.map(h => `
              <div class="changelog-item">
                <div class="changelog-tag">v${h.ver} · ${h.rev}</div>
                <div class="changelog-body">
                  <div class="changelog-title">${escape(h.title)}</div>
                  <div class="changelog-date">${h.date}</div>
                </div>
              </div>
            `).join("")}
          </div>
          <div class="settings-hint">
            <a href="https://github.com/pllato/pllato-core-crm" target="_blank" style="color:var(--accent);text-decoration:none">Открыть репозиторий на GitHub →</a>
          </div>
        </div>
      </section>

      <!-- Опасная зона -->
      <section class="settings-block danger-zone">
        <header class="settings-head">
          <h3>Опасная зона</h3>
          <p>Действия, которые нельзя отменить.</p>
        </header>
        <div class="settings-body">
          <div class="danger-row">
            <div>
              <div class="danger-title">Очистить локальные данные</div>
              <div class="danger-sub">Удалит контакты, сделки, задачи, ленту, чаты, уведомления. Профиль и тема сохранятся.</div>
            </div>
            <button class="btn-ghost danger" id="clearData">${ICONS.trash}<span>Очистить</span></button>
          </div>
        </div>
      </section>
    </div>
  `;

  wireEvents(container);
}

function renderChannelsList() {
  const list = listChannels({ onlyActive: false });
  if (list.length === 0) {
    if (!isChannelsSynced()) {
      return `<div class="tl-empty">Каналы не загружены. Войди через Google, чтобы подтянуть их из Firebase.</div>`;
    }
    return `<div class="tl-empty">Pllato CRM ещё не привязана ни к одному каналу. Открой <a href="https://pllato.kz/contact-center.html" target="_blank" style="color:var(--accent)">Контакт-центр</a> и в карточке нужного канала отметь «Pllato CRM».</div>`;
  }
  return `
    <div class="employees-list">
      ${list.map(c => {
        const meta = typeMeta(c.type);
        return `
          <div class="employee-row">
            <div class="avatar avatar-md" style="background:var(--accent-tint);color:var(--accent-hover);font-size:18px">${meta.icon}</div>
            <div class="employee-body">
              <div class="employee-name">${escape(c.name)} ${c.active === false ? '<span class="badge warn">выкл</span>' : ''}</div>
              <div class="employee-meta">${meta.label}${c.public?.phone_number ? ' · ' + escape(c.public.phone_number) : ''}${c.public?.host ? ' · ' + escape(c.public.host) : ''}${c.public?.account ? ' · ' + escape(c.public.account) : ''}</div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderCustomFieldsList() {
  const fields = getDealFields();
  if (fields.length === 0) {
    return `<div class="tl-empty">Кастомных полей пока нет. Нажми «Добавить поле».</div>`;
  }
  const optionLabels = (opts = []) =>
    (Array.isArray(opts) ? opts : [])
      .map((o) => (typeof o === "string" ? o : o?.label || o?.name || o?.value || ""))
      .filter(Boolean)
      .join(", ");
  return fields.map((f, i) => `
    <div class="custom-field-row" data-i="${i}">
      <input type="text" class="cf-label" data-i="${i}" value="${escape(f.label)}" placeholder="Название поля">
      <select class="cf-type" data-i="${i}">
        ${FIELD_TYPES.map(t => `<option value="${t.id}" ${f.type === t.id ? "selected" : ""}>${t.label}</option>`).join("")}
      </select>
      ${["select", "multi"].includes(f.type) ? `
        <input type="text" class="cf-options" data-i="${i}" value="${escape(optionLabels(f.options))}" placeholder="Варианты через запятую">
      ` : `<span></span>`}
      <button class="btn-ghost icon-only danger" data-cf-remove="${i}" title="Удалить">${ICONS.trash}</button>
    </div>
  `).join("");
}

function renderEmployeeRow(e, roles) {
  if (state.editingEmployee === e.id && !isFirebaseSynced()) return renderEmployeeForm(e, roles);
  const fbManaged = isFirebaseSynced();
  const roleLabel = e.isSuperAdmin ? "Супер-админ" : e.isAdmin ? "Админ" : (roles.find(r => r.id === e.roleId)?.name || e.role || "Сотрудник");
  return `
    <div class="employee-row" data-id="${e.id}">
      ${avatar(e, "md")}
      <div class="employee-body">
        <div class="employee-name">${escape(e.name)}${e.isCurrent ? ' <span class="badge">это вы</span>' : ""}</div>
        <div class="employee-meta">${escape(e.email)} · ${escape(roleLabel)}${e.position ? ` · ${escape(e.position)}` : ""}</div>
      </div>
      ${fbManaged ? "" : `<div class="employee-actions">
        <button class="btn-ghost icon-only" data-edit-emp="${e.id}">${ICONS.edit}</button>
        ${!e.isCurrent ? `<button class="btn-ghost icon-only danger" data-remove-emp="${e.id}">${ICONS.trash}</button>` : ""}
      </div>`}
    </div>
  `;
}

function renderEmployeeForm(e, roles) {
  const isNew = !e;
  e = e || { name: "", email: "", roleId: roles[0]?.id, role: "manager" };
  return `
    <form class="employee-form" id="employeeForm" data-id="${e.id || ""}">
      <div class="form-grid">
        <div class="field"><label>Имя *</label><input name="name" required value="${escape(e.name)}" placeholder="Имя Фамилия"></div>
        <div class="field"><label>Email *</label><input name="email" type="email" required value="${escape(e.email)}" placeholder="user@company.com"></div>
        <div class="field"><label>Роль</label>
          <select name="roleId">
            ${roles.map(r => `<option value="${r.id}" ${e.roleId === r.id ? "selected" : ""}>${escape(r.name)}</option>`).join("")}
          </select>
        </div>
        <div class="field field-wide form-buttons">
          <button type="button" class="btn-ghost" data-cancel-emp>Отмена</button>
          <button type="submit" class="btn">${isNew ? "Добавить" : "Сохранить"}</button>
        </div>
      </div>
    </form>
  `;
}

function renderRoleRow(r) {
  if (state.editingRole === r.id) return renderRoleForm(r);
  return `
    <div class="role-row" data-id="${r.id}">
      <div class="role-body">
        <div class="role-name">${escape(r.name)}${r.system ? ' <span class="badge">системная</span>' : ""}</div>
        <div class="role-perms">
          ${(r.permissions || []).map(p => {
            const perm = PERMISSIONS.find(x => x.id === p);
            return perm ? `<span class="chip-mini">${perm.label}</span>` : "";
          }).join("") || `<span style="color:var(--text-dim);font-size:12px">нет доступа</span>`}
        </div>
      </div>
      <div class="role-actions">
        <button class="btn-ghost icon-only" data-edit-role="${r.id}">${ICONS.edit}</button>
        ${!r.system ? `<button class="btn-ghost icon-only danger" data-remove-role="${r.id}">${ICONS.trash}</button>` : ""}
      </div>
    </div>
  `;
}

function renderRoleForm(r) {
  const isNew = !r;
  r = r || { name: "", permissions: [] };
  return `
    <form class="role-form" id="roleForm" data-id="${r.id || ""}">
      <div class="field"><label>Название роли *</label><input name="name" required value="${escape(r.name)}" placeholder="Например: Sales Lead"></div>
      <div class="field field-wide">
        <label>Доступ к разделам</label>
        <div class="role-perm-grid">
          ${PERMISSIONS.map(p => `
            <label class="participant-chip ${(r.permissions || []).includes(p.id) ? "on" : ""}">
              <input type="checkbox" name="permissions" value="${p.id}" ${(r.permissions || []).includes(p.id) ? "checked" : ""}>
              <span>${p.label}</span>
            </label>
          `).join("")}
        </div>
      </div>
      <div class="form-buttons">
        <button type="button" class="btn-ghost" data-cancel-role>Отмена</button>
        <button type="submit" class="btn">${isNew ? "Создать роль" : "Сохранить"}</button>
      </div>
    </form>
  `;
}

function wireEvents(container) {
  // Workspace
  container.querySelector("#workspaceForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    saveWorkspace({
      name: (fd.get("name") || "").trim() || "Pllato",
      slug: (fd.get("slug") || "").trim() || "pllato",
    });
    const saved = container.querySelector("#wsSaved");
    if (saved) { saved.textContent = "Сохранено"; setTimeout(() => saved.textContent = "", 2000); }
  });

  // Theme
  container.querySelectorAll(".theme-option").forEach(btn => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("pllato_theme", theme);
      renderSettings(container);
    });
  });

  // ----- Сотрудники -----
  container.querySelector("#addEmployee")?.addEventListener("click", () => {
    state.editingEmployee = "new";
    renderSettings(container);
  });
  container.querySelectorAll("[data-edit-emp]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.editingEmployee = btn.dataset.editEmp;
      renderSettings(container);
    });
  });
  container.querySelectorAll("[data-remove-emp]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.removeEmp;
      const e = getEmployee(id);
      if (e && confirm(`Удалить сотрудника «${e.name}»?`)) {
        removeEmployee(id);
        renderSettings(container);
      }
    });
  });
  container.querySelectorAll("[data-cancel-emp]").forEach(btn => {
    btn.addEventListener("click", () => { state.editingEmployee = null; renderSettings(container); });
  });
  container.querySelector("#employeeForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = e.target.dataset.id;
    const data = {
      name: (fd.get("name") || "").trim(),
      email: (fd.get("email") || "").trim(),
      roleId: fd.get("roleId") || null,
    };
    if (!data.name || !data.email) return;
    if (id) updateEmployee(id, data);
    else createEmployee(data);
    state.editingEmployee = null;
    renderSettings(container);
  });

  // ----- Роли -----
  container.querySelector("#addRole")?.addEventListener("click", () => { state.editingRole = "new"; renderSettings(container); });
  container.querySelectorAll("[data-edit-role]").forEach(btn => {
    btn.addEventListener("click", () => { state.editingRole = btn.dataset.editRole; renderSettings(container); });
  });
  container.querySelectorAll("[data-remove-role]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.removeRole;
      const r = Store.get(ROLES_COLLECTION, id);
      if (r && confirm(`Удалить роль «${r.name}»?`)) { Store.remove(ROLES_COLLECTION, id); renderSettings(container); }
    });
  });
  container.querySelectorAll("[data-cancel-role]").forEach(btn => {
    btn.addEventListener("click", () => { state.editingRole = null; renderSettings(container); });
  });
  container.querySelector("#roleForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = e.target.dataset.id;
    const data = {
      name: (fd.get("name") || "").trim(),
      permissions: fd.getAll("permissions"),
    };
    if (!data.name) return;
    if (id) Store.update(ROLES_COLLECTION, id, data);
    else Store.create(ROLES_COLLECTION, data);
    state.editingRole = null;
    renderSettings(container);
  });
  // Чипы прав — подсветка
  container.querySelectorAll(".role-perm-grid .participant-chip").forEach(chip => {
    chip.querySelector('input[type="checkbox"]')?.addEventListener("change", e => {
      chip.classList.toggle("on", e.target.checked);
    });
  });

  // ----- Интеграции -----
  container.querySelectorAll("[data-toggle]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.toggle;
      state.openIntegration = state.openIntegration === id ? null : id;
      renderSettings(container);
    });
  });
  container.querySelectorAll(".integration-form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const id = form.dataset.id;
      const fd = new FormData(form);
      const data = {};
      for (const [k, v] of fd.entries()) data[k] = (v || "").trim();
      saveIntegration(id, data);
      state.openIntegration = null;
      renderSettings(container);
    });
  });
  container.querySelectorAll("[data-clear]").forEach(btn => {
    btn.addEventListener("click", () => {
      saveIntegration(btn.dataset.clear, null);
      state.openIntegration = null;
      renderSettings(container);
    });
  });

  // ----- Custom fields -----
  function readFieldsFromDom() {
    return Array.from(container.querySelectorAll(".custom-field-row")).map(row => {
      const i = row.dataset.i;
      const label = container.querySelector(`.cf-label[data-i="${i}"]`)?.value || "";
      const type = container.querySelector(`.cf-type[data-i="${i}"]`)?.value || "text";
      const optionsRaw = container.querySelector(`.cf-options[data-i="${i}"]`)?.value || "";
      const options = ["select", "multi"].includes(type)
        ? optionsRaw.split(",").map(s => s.trim()).filter(Boolean)
        : [];
      const existing = getDealFields()[Number(i)];
      return {
        id: existing?.id || newFieldId(),
        label,
        type,
        options,
        order: Number.isFinite(Number(existing?.order)) ? Number(existing.order) : Number(i),
        showInKanban: Boolean(existing?.showInKanban),
        required: Boolean(existing?.required),
      };
    });
  }
  function refreshFieldsList() {
    const list = container.querySelector("#customFieldsList");
    if (list) list.innerHTML = renderCustomFieldsList();
    bindCustomFieldsEvents();
  }
  function bindCustomFieldsEvents() {
    container.querySelectorAll(".cf-label, .cf-options").forEach(el => {
      el.addEventListener("change", () => {
        saveDealFields(readFieldsFromDom());
      });
    });
    container.querySelectorAll(".cf-type").forEach(el => {
      el.addEventListener("change", () => {
        saveDealFields(readFieldsFromDom());
        refreshFieldsList();
      });
    });
    container.querySelectorAll("[data-cf-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        const fields = readFieldsFromDom();
        fields.splice(Number(btn.dataset.cfRemove), 1);
        saveDealFields(fields);
        refreshFieldsList();
      });
    });
  }
  bindCustomFieldsEvents();
  container.querySelector("#addCustomField")?.addEventListener("click", () => {
    const fields = readFieldsFromDom();
    fields.push({ id: newFieldId(), label: "Новое поле", type: "text", options: [] });
    saveDealFields(fields);
    refreshFieldsList();
  });

  // Опасная зона
  container.querySelector("#clearData")?.addEventListener("click", () => {
    if (!confirm("Удалить все локальные данные? Это нельзя отменить.")) return;
    ["contacts", "deals", "tasks", "feed", "chats", "chat_messages", "task_comments", "deal_activities", "notifications"].forEach(k => {
      localStorage.removeItem("pllato_core_" + k);
    });
    alert("Данные очищены. Демо-сидинг вернётся при заходе в разделы.");
    location.hash = "#dashboard";
    location.reload();
  });
}
