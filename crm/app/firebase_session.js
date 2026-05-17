// Pllato CRM — helper для получения Firebase ID token.
// Нужен для Worker API (звонки/WA/email/cloud store), чтобы избежать гонки auth.currentUser на старте.

const DEFAULT_WAIT_MS = 8000;

let runtimePromise = null;

function firebaseConfig() {
  return window.PLLATO_FIREBASE_CONFIG || {};
}

export function firebaseEnabled() {
  const cfg = firebaseConfig();
  return Boolean(cfg.apiKey && cfg.authDomain);
}

function noSessionMessage() {
  if (!firebaseEnabled()) {
    return "CRM запущена в DEMO-режиме (пустой firebase.config.js). Звонки, WhatsApp и почта работают только после входа через Google с настроенным Firebase.";
  }
  return "Нет активной Firebase-сессии. Перелогинься в CRM и повтори.";
}

async function loadRuntime() {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      const cfg = firebaseConfig();
      const appMod = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js");
      const authMod = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
      const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(cfg);
      const auth = authMod.getAuth(app);
      return { auth, authMod };
    })();
  }
  return runtimePromise;
}

async function waitForUser(auth, authMod, waitMs = DEFAULT_WAIT_MS) {
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve) => {
    let done = false;
    let unsubscribe = null;
    let timer = null;
    const finish = (user) => {
      if (done) return;
      done = true;
      try { unsubscribe?.(); } catch {}
      clearTimeout(timer);
      resolve(user || null);
    };
    unsubscribe = authMod.onAuthStateChanged(auth, (user) => finish(user || auth.currentUser || null));
    timer = setTimeout(() => finish(auth.currentUser || null), Math.max(300, Number(waitMs) || DEFAULT_WAIT_MS));
  });
}

async function tryInteractiveSignIn(auth, authMod) {
  if (typeof authMod?.GoogleAuthProvider !== "function" || typeof authMod?.signInWithPopup !== "function") return null;
  const provider = new authMod.GoogleAuthProvider();
  await authMod.signInWithPopup(auth, provider);
  return auth.currentUser || null;
}

function isPopupAbortError(err) {
  const text = String(err?.code || err?.message || err || "").toLowerCase();
  return text.includes("popup") || text.includes("cancel");
}

function popupRecoveryMessage(err) {
  const code = String(err?.code || "").toLowerCase();
  if (code.includes("popup-blocked")) {
    return "Браузер заблокировал окно входа Google. Разреши pop-up для pllato.kz и повтори.";
  }
  if (code.includes("popup-closed-by-user")) {
    return "Окно входа Google закрыто. Повтори действие и заверши вход.";
  }
  return "Сессия Firebase истекла. Повтори действие и подтверди вход в Google.";
}

export async function firebaseIdToken({ waitMs = DEFAULT_WAIT_MS, forceRefresh = false, interactive = false } = {}) {
  if (!firebaseEnabled()) return null;
  const { auth, authMod } = await loadRuntime();
  if (auth.currentUser) return auth.currentUser.getIdToken(Boolean(forceRefresh));

  let user = await waitForUser(auth, authMod, interactive ? 350 : waitMs);
  if (!user && interactive) {
    let popupErr = null;
    try {
      user = await tryInteractiveSignIn(auth, authMod);
    } catch (err) {
      if (isPopupAbortError(err)) popupErr = err;
      else throw err;
    }
    if (!user) user = await waitForUser(auth, authMod, waitMs);
    if (!user && popupErr) throw new Error(popupRecoveryMessage(popupErr));
  }
  if (!user) return null;
  return user.getIdToken(Boolean(forceRefresh));
}

export async function requireFirebaseIdToken(opts = {}) {
  const token = await firebaseIdToken(opts);
  if (!token) throw new Error(noSessionMessage());
  return token;
}
