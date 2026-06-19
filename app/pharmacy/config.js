// ────────────────────────────────────────────────────────────────
//  КОНФИГ КЛИЕНТА — единственный файл, который меняется при передаче.
//  Подключается ПЕРЕД app.js. После переноса на аккаунты клиента —
//  заменить значения на их Worker URL и Google OAuth client id.
// ────────────────────────────────────────────────────────────────
window.PHARMA_CONFIG = {
  // URL воркера клиента (Cloudflare Worker) — куда фронт шлёт /api/*
  API_BASE: 'https://pharmacy-crm-worker.uurraa.workers.dev',
  // Google OAuth client id (вход через Google) — из Google Cloud Console клиента
  GOOGLE_CLIENT_ID: '773798066647-jg137in0mum92famuml70kauonp7amgg.apps.googleusercontent.com',
};
