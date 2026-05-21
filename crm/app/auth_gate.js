// Pllato CRM — Auth gate.
// Проверяет наличие любой из сессий: Google (из auth.js) или Email (из auth_local.js).
// Если ни одной — показывает login overlay.

import { isEmailAuthenticated } from "./auth_local.js";
import { listEmployees } from "./employees.js";
import { showLoginOverlay } from "./views/login.js";
import { restoreLocalEmployees } from "./local_employees.js";

async function waitForEmployees(maxWaitMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (listEmployees().length > 0) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
}

async function getGoogleSessionSafe() {
  try {
    const mod = await import("./auth.js");
    if (typeof mod.getSession === "function") return mod.getSession();
  } catch {}
  return null;
}

async function checkAuth() {
  await waitForEmployees();
  restoreLocalEmployees();

  // 1. Email session валиден?
  if (isEmailAuthenticated()) return;

  // 2. Google session валиден?
  const googleSession = await getGoogleSessionSafe();
  if (googleSession) return;

  // 3. Ни одной — показать login
  showLoginOverlay((employee) => {
    console.log("[auth] Logged in as:", employee.name || employee.email);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => setTimeout(checkAuth, 1200));
} else {
  setTimeout(checkAuth, 1200);
}
