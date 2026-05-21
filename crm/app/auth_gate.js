// Pllato CRM — Auth gate.
// Показывает login screen если нет активной session по email/password
// (но не мешает Google OAuth).

import { isAuthenticated, getSession } from "./auth.js";
import { listEmployees, currentEmployee } from "./employees.js";
import { showLoginOverlay } from "./views/login.js";

// Ждём пока данные сотрудников подгрузятся (Store sync с D1)
async function waitForEmployees(maxWaitMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (listEmployees().length > 0) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
}

async function checkAuth() {
  await waitForEmployees();

  // 1. Email/password session валиден?
  if (isAuthenticated()) {
    return; // войдено, ничего не делаем
  }

  // 2. Google OAuth уже залогинил? (currentEmployee помечен)
  const current = currentEmployee();
  if (current && (current.isCurrent || current.email === getGoogleEmail())) {
    return; // Google активен
  }

  // 3. Иначе — показать login overlay
  showLoginOverlay((employee) => {
    console.log("[auth] Logged in as:", employee.name || employee.email);
  });
}

function getGoogleEmail() {
  // Попытаться найти email из Google OAuth state (если он есть)
  try {
    const stored = localStorage.getItem("pllato_google_user");
    if (stored) return JSON.parse(stored).email;
  } catch {}
  return null;
}

// Запускаем после полной загрузки app
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => setTimeout(checkAuth, 800));
} else {
  setTimeout(checkAuth, 800);
}
