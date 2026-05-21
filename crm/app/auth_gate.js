// Pllato CRM — Auth gate (синхронный, без зависимостей).
// Показывает login overlay немедленно при загрузке если нет session.
// Lazy-импортирует функции login только когда пользователь нажимает кнопку.

const SESSION_KEY = "pllato_session";

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.exp && session.exp * 1000 < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch { return null; }
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const LOGIN_HTML = `
  <div class="login-card">
    <div class="login-brand">
      <img src="./assets/aminamed_logo.png" alt="Aminamed" class="login-logo" onerror="this.style.display='none'">
      <h1>Aminamed CRM</h1>
      <p class="login-sub">Вход в систему</p>
    </div>
    <form class="login-form" id="loginForm">
      <label class="login-field">
        <span>Email</span>
        <input type="email" id="loginEmail" autocomplete="email" required placeholder="ivan@aminamed.kz">
      </label>
      <label class="login-field">
        <span>Пароль</span>
        <input type="password" id="loginPassword" autocomplete="current-password" required placeholder="••••••••">
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

function buildChangePasswordHTML(employee) {
  return `
    <div class="login-card">
      <div class="login-brand">
        <h1>Смена пароля</h1>
        <p class="login-sub">Здравствуй, ${escapeHtml(employee.name || employee.email)}!<br>Установи новый постоянный пароль.</p>
      </div>
      <form class="login-form" id="cpForm">
        <label class="login-field"><span>Новый пароль (мин. 6 символов)</span>
          <input type="password" id="cpNewPassword" autocomplete="new-password" required minlength="6"></label>
        <label class="login-field"><span>Повтор</span>
          <input type="password" id="cpRepeat" autocomplete="new-password" required minlength="6"></label>
        <div class="login-error" id="cpError" hidden></div>
        <button type="submit" class="login-submit">Сохранить и войти</button>
      </form>
    </div>
  `;
}

function mountOverlay() {
  if (document.getElementById("loginOverlay")) return;
  // Если body ещё нет — создаём элемент в html, переместим в body когда появится
  const overlay = document.createElement("div");
  overlay.id = "loginOverlay";
  overlay.className = "login-overlay";
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 999999;
    background: linear-gradient(135deg, rgba(15, 20, 25, .96) 0%, rgba(31, 156, 77, .12) 100%);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; backdrop-filter: blur(8px);
  `;
  overlay.innerHTML = LOGIN_HTML;
  if (document.body) {
    document.body.appendChild(overlay);
  } else {
    document.documentElement.appendChild(overlay);
    document.addEventListener("DOMContentLoaded", () => {
      if (overlay.parentNode !== document.body) {
        document.body.appendChild(overlay);
      }
    });
  }
  wireLoginForm(overlay);
  return overlay;
}

function wireLoginForm(overlay) {
  const form = overlay.querySelector("#loginForm");
  const errEl = overlay.querySelector("#loginError");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = overlay.querySelector("#loginEmail").value;
    const password = overlay.querySelector("#loginPassword").value;
    errEl.hidden = true;
    const submitBtn = form.querySelector(".login-submit");
    submitBtn.disabled = true; submitBtn.textContent = "Проверка…";

    try {
      const { loginByEmail } = await import("./auth_local.js");
      const result = await loginByEmail(email, password);
      if (!result.ok) {
        errEl.textContent = result.error || "Ошибка"; errEl.hidden = false;
        submitBtn.disabled = false; submitBtn.textContent = "Войти"; return;
      }
      if (result.forcePasswordChange) {
        overlay.innerHTML = buildChangePasswordHTML(result.employee);
        wireChangePasswordForm(overlay, result.employee); return;
      }
      overlay.remove();
      location.reload();
    } catch (e) {
      errEl.textContent = e.message || "Ошибка"; errEl.hidden = false;
      submitBtn.disabled = false; submitBtn.textContent = "Войти";
    }
  });
  overlay.querySelector("#loginGoogleBtn")?.addEventListener("click", () => {
    overlay.remove();
    location.reload();
  });
}

function wireChangePasswordForm(overlay, employee) {
  const form = overlay.querySelector("#cpForm");
  const errEl = overlay.querySelector("#cpError");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPw = overlay.querySelector("#cpNewPassword").value;
    const repeat = overlay.querySelector("#cpRepeat").value;
    errEl.hidden = true;
    if (newPw !== repeat) { errEl.textContent = "Пароли не совпадают"; errEl.hidden = false; return; }
    if (newPw.length < 6) { errEl.textContent = "Минимум 6 символов"; errEl.hidden = false; return; }
    const submitBtn = form.querySelector(".login-submit");
    submitBtn.disabled = true; submitBtn.textContent = "Сохранение…";
    try {
      const { changePasswordToNew } = await import("./auth_local.js");
      await changePasswordToNew(employee.id, newPw);
      overlay.remove();
      location.reload();
    } catch (e) {
      errEl.textContent = e.message || "Ошибка"; errEl.hidden = false;
      submitBtn.disabled = false; submitBtn.textContent = "Сохранить и войти";
    }
  });
}

// === Запуск ===
// Синхронно при загрузке модуля — без задержек, без waitForEmployees, без зависимостей
if (!getSession()) {
  mountOverlay();
}
