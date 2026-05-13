// Pllato CRM — версия и ревизия.
// При каждом merge ревизии обновляй здесь VERSION и REVISION.

export const VERSION = "0.8";
export const REVISION = "rev-7";
export const BUILD_DATE = "2026-05-13";
export const COMMIT_SHORT = "";  // обновится после merge

export const HISTORY = [
  { ver: "0.8", rev: "rev-7", date: "2026-05-13", title: "Кнопки коммуникации (📞 / 💬 / ✉) в карточке сделки и контакта; модалка выбора канала; запись активности при отправке. Реальная отправка через Worker — следующим шагом" },
  { ver: "0.7", rev: "rev-6", date: "2026-05-13", title: "Контакт-центр в app.html (общие каналы связи — Binotel/Green-API/SMTP/Insta/FB) + read-only блок «Каналы» в Настройках CRM" },
  { ver: "0.6", rev: "rev-5", date: "2026-05-13", title: "Единая база сотрудников из Firebase /users (общая для app.html и всех приложений Pllato); проверка доступа к pllato_crm; раздел «Сотрудники» в настройках стал read-only" },
  { ver: "0.5", rev: "rev-4", date: "2026-05-13", title: "Google Sign-In с проверкой /users; searchable селекты + quick-create контакта в сделке; умный импорт контактов (CSV/текст) с опцией создания сделок" },
  { ver: "0.4", rev: "rev-3", date: "2026-05-13", title: "Переименование «Pllato CORE CRM» → «Pllato CRM», деплой на pllato.kz/crm/, подключён общий Firebase pllato-crm" },
  { ver: "0.3", rev: "rev-2", date: "2026-05-13", title: "Роли фильтруют меню, custom fields, сохранение позиции" },
  { ver: "0.2", rev: "rev-1", date: "2026-05-13", title: "Сотрудники, редактируемые стадии, задачи v2, лента v2, контакты v2, графики, уведомления, настройки v2" },
  { ver: "0.1", rev: "mvp",   date: "2026-05-13", title: "Этапы 0-6: скелет, контакты, сделки, задачи, лента+чаты, дашборд, настройки" },
];
