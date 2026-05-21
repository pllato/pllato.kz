// Pllato CRM — Auth gate.
// Если нет валидной session (Google или email) — показывает login overlay.

import { showLoginOverlay } from "./views/login.js";

function getSession() {
  try {
    const raw = localStorage.getItem("pllato_session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.exp && session.exp * 1000 < Date.now()) {
      localStorage.removeItem("pllato_session");
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

async function checkAuth() {
  if (getSession()) return;
  showLoginOverlay((employee) => {
    console.log("[auth] Logged in as:", employee?.name || employee?.email);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => setTimeout(checkAuth, 600));
} else {
  setTimeout(checkAuth, 600);
}
