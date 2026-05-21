// Pllato CRM — Login overlay (email/password + Google).

import { loginByEmail, changePasswordToNew } from "../auth_local.js";
import { listEmployees } from "../employees.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function showLoginOverlay(onSuccess) {
  const existing = document.getElementById("loginOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "loginOverlay";
  overlay.className = "login-overlay";
  overlay.innerHTML = renderLoginHTML();
  document.body.appendChild(overlay);

  wireLogin(overlay, onSuccess);
}

function renderLoginHTML() {
  const employees = listEmployees();
  const hasAnyEmail = employees.some(e => e.email && e.passwordHash);

  return `
    <div class="login-card">
      <div class="login-brand">
        <img src="./assets/aminamed_logo.png" alt="Aminamed" class="login-logo" onerror="this.style.display='none'">
        <h1>Aminamed CRM</h1>
        <p class="login-sub">Вход в систему</p>
      </div>

      ${!hasAnyEmail ? `
        <div class="login-warn">
          ⚠ В системе пока нет ни одного сотрудника с email-паролем.
          <br>Войди через Google и добавь сотрудников в <strong>Настройки → Сотрудники</strong>.
        </div>
      ` : ""}

      <form class="login-form" id="loginForm">
        <label class="login-field">
          <span>Email</span>
          <input type="email" id="loginEmail" placeholder="ivan@aminamed.kz" autocomplete="email" required>
        </label>
        <label class="login-field">
          <span>Пароль</span>
          <input type="password" id="loginPassword" placeholder="••••••••" autocomplete="current-password" required>
        </label>
        <div class="login-error" id="loginError" hidden></div>
        <button type="submit" class="login-submit">Войти</button>
      </form>

      <div class="login-divider"><span>или</span></div>

      <div class="login-google">
        <button type="button" class="login-google-btn" id="loginGoogleBtn">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.6 9.2c0-.6 0-1.2-.1-1.7H9v3.3h4.9c-.2 1.1-.8 2-1.8 2.7v2.2h2.9c1.7-1.6 2.6-3.9 2.6-6.5z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 15.9 5.5 18 9 18z"/><path fill="#FBBC05" d="M3.9 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.9C.3 6.2 0 7.5 0 9s.3 2.8.9 4l3-2.3z"/><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6C13.5.9 11.4 0 9 0 5.5 0 2.4 2.1.9 5l3 2.3C4.6 5.1 6.6 3.6 9 3.6z"/></svg>
          <span>Войти через Google</span>
        </button>
      </div>

      <div class="login-footer">
        <small>Пароль установлен администратором при добавлении сотрудника</small>
      </div>
    </div>
  `;
}

function renderChangePasswordHTML(employee) {
  return `
    <div class="login-card">
      <div class="login-brand">
        <h1>Смена пароля</h1>
        <p class="login-sub">Здравствуй, ${escapeHtml(employee.name || employee.email)}!<br>Установи новый постоянный пароль.</p>
      </div>

      <form class="login-form" id="cpForm">
        <label class="login-field">
          <span>Новый пароль (мин. 6 символов)</span>
          <input type="password" id="cpNewPassword" placeholder="••••••••" autocomplete="new-password" required minlength="6">
        </label>
        <label class="login-field">
          <span>Повтор</span>
          <input type="password" id="cpRepeat" placeholder="••••••••" autocomplete="new-password" required minlength="6">
        </label>
        <div class="login-error" id="cpError" hidden></div>
        <button type="submit" class="login-submit">Сохранить и войти</button>
      </form>
    </div>
  `;
}

function wireLogin(overlay, onSuccess) {
  const form = overlay.querySelector("#loginForm");
  const errEl = overlay.querySelector("#loginError");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = overlay.querySelector("#loginEmail").value;
    const password = overlay.querySelector("#loginPassword").value;
    errEl.hidden = true;

    const submitBtn = form.querySelector(".login-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Проверка…";

    try {
      const result = await loginByEmail(email, password);
      if (!result.ok) {
        errEl.textContent = result.error || "Ошибка входа";
        errEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = "Войти";
        return;
      }

      if (result.forcePasswordChange) {
        overlay.innerHTML = renderChangePasswordHTML(result.employee);
        wireChangePassword(overlay, result.employee, onSuccess);
        return;
      }

      overlay.remove();
      if (onSuccess) onSuccess(result.employee);
      else location.reload();
    } catch (e) {
      errEl.textContent = e.message || "Ошибка";
      errEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Войти";
    }
  });

  overlay.querySelector("#loginGoogleBtn")?.addEventListener("click", () => {
    overlay.remove();
    location.reload();
  });
}

function wireChangePassword(overlay, employee, onSuccess) {
  const form = overlay.querySelector("#cpForm");
  const errEl = overlay.querySelector("#cpError");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPw = overlay.querySelector("#cpNewPassword").value;
    const repeat = overlay.querySelector("#cpRepeat").value;
    errEl.hidden = true;

    if (newPw !== repeat) {
      errEl.textContent = "Пароли не совпадают";
      errEl.hidden = false;
      return;
    }
    if (newPw.length < 6) {
      errEl.textContent = "Минимум 6 символов";
      errEl.hidden = false;
      return;
    }

    const submitBtn = form.querySelector(".login-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Сохранение…";

    try {
      await changePasswordToNew(employee.id, newPw);
      overlay.remove();
      if (onSuccess) onSuccess(employee);
      else location.reload();
    } catch (e) {
      errEl.textContent = e.message || "Ошибка";
      errEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Сохранить и войти";
    }
  });
}
