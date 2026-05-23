# CHANGELOG

История ревизий Pllato CRM. Свежие сверху.

---

## 2026-05-23 · Cold-call workflow готов

- `feat(calls)`: inline audio player в строке Истории звонков (вместо открытия в новой вкладке). URL записи кешируется в `state.historyRecordUrls`.
- `feat(settings)`: кнопка 📞 в строке сотрудника — `prompt()` для установки внутренней линии Binotel. Хранение в `localStorage["pllato_emp_binotel_lines"]`.
- `feat(employee)`: поле "Линия Binotel" в форме сотрудника + fallback chain в worker `handleBinotelCall` (payload → user.binotelLine → channel.default_inner).
- `fix(calls_api)`: убран double `JSON.stringify` в `request()`. `apiFetch` уже делает stringify для `Content-Type: application/json`.
- `fix(calls)`: добавлены методы `binotelCall` / `binotelHistory` / `binotelRecording` в `CallsApi` (вызывались из `views/calls.js`, но отсутствовали).
- `fix(channels)`: тот же баг с double stringify в `saveChannel`/`deleteChannel`.

После этих изменений: Платон звонит на 1914 → Binotel принимает → история записывает → запись слушается прямо в строке. Карлыгаш (k.baimukhanova@aminamed.kz) тоже сможет, когда впишет свою линию.

## 2026-05-23 · UI каналов связи

- `feat(settings)`: табы в Настройках — 6 групп вместо одной длинной страницы. Активный таб в `localStorage["pllato_settings_active_tab"]`.
- `feat(settings)`: UI каналов связи в Настройки → Интеграции:
  - Toolbar с dropdown типа канала + кнопка "+Добавить"
  - Inline-edit / toggle active / delete
  - Формы Binotel (api_key, api_secret, default_inner) и Green-API (id_instance, api_token_instance, phone_number, api_url)
- `feat(channels)`: API клиент `saveChannel` / `deleteChannel` / `getChannelFull` + автоматический `syncChannelsFromWorker()` после save/delete.

## 2026-05-22 · Aminamed CRM запуск + восстановление ELC

- Деплой **`crm.aminamed.kz`** через Cloudflare Pages (`aminamed-crm`, git-connected к main).
  - Build command: `mkdir dist && find . -maxdepth 1 -mindepth 1 ! -name dist ! -name worker ! -name '.git' ! -name '*.md' -exec cp -r {} dist/ \;`
  - Output: `dist`
  - DNS CNAME `crm.aminamed.kz` → `aminamed-crm.pages.dev` (DNS у клиента, не в CF).
- Worker CORS обновлён (Version `1698345f-0231-41a8-a731-6ac1b1a3752e`): добавлены `aminamed-crm.pages.dev` и `crm.aminamed.kz`.
- Google Sign-In скрыт на aminamed-доменах через массив `HOSTS_WITH_GOOGLE` (правка в `app/views/login.js` и `app/auth_gate.js` — login UI задублирован, тех. долг).
- `pllato.kz/app.html`: переименование "Pllato CRM" → "Aminamed CRM", удалена карточка "Склад" из лаунчера.
- **Восстановление `team.html`** (ELC CRM) из коммита `5968356`. Был сломан коммитом `7fcc10e migration-02` (заменён stub'ом). PR `feat/restore-team-html` commit `dacb329`. **8100 строк.** Sync-action `sync-to-prod.yml` копирует только в `target/crm/` — team.html больше не затронется.

---

