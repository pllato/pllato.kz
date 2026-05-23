// ELC CRM config (изолированный от Aminamed).
// PLLATO_API_BASE — переключен на наш ELC worker. Этот worker НЕ поддерживает
// /store/* API из коробки (Aminamed store-pattern), будем адаптировать в Этапе 1.
window.PLLATO_API_BASE = "https://pllato-elc-worker.uurraa.workers.dev";

// Тот же Firebase project (pllato-crm) — auth-токены общие с team.html.
// Google Client ID берём тот же что у Aminamed (привязан к pllato-crm project).
window.PLLATO_GOOGLE_CLIENT_ID =
  "690738857241-oechm85eio8np7hepafta8opn9jev6uj.apps.googleusercontent.com";

// ELC-tenant маркер для будущей multi-tenant логики в воркере.
window.PLLATO_TENANT = "elc";
window.PLLATO_APP_NAME = "ELC CRM";
