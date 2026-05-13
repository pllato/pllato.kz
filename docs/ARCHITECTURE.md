# Архитектура Pllato CRM

Дополнение к `HANDOFF.md`. Детали потоков и схем данных.

---

## Boot flow (что происходит при загрузке `/crm/`)

```
1. index.html подгружает firebase.config.js и app.js (type=module)
2. app.js → Theme.init() (читает 'pllato_theme' из localStorage)
3. app.js → state.route = parseRoute() (читает hash)
4. app.js → если USE_FIREBASE = true:
     initFirebase() → подгружает SDK через ESM из gstatic.com
     onAuthStateChanged(...):
       - если auth.currentUser → checkUserInTeam(user)
         - читает /users из Firebase, ищет email
         - root super (uurraa@) → always OK
         - не root + apps.pllato_crm === false → DENY (показывает экран ошибки)
         - иначе → OK
       - если OK:
         - replaceEmployeesFromFirebase(users, email)
           — заменяет локальную коллекцию employees, миграция assigneeId по email
         - syncChannelsFromFirebase(fb) [async, не блокирует]
         - render() → renderShell или renderLogin
5. Если не залогинен → renderLogin (с кнопкой «Войти через Google»)
6. Если залогинен → renderShell + renderMain (текущий route)
```

---

## Firebase RTDB схема

```
pllato-crm-default-rtdb/
├── users/                           — все сотрудники Pllato
│   └── {pushId}/
│       ├── email                    — "user@example.com"
│       ├── name                     — "Имя"
│       ├── lastName                 — "Фамилия"
│       ├── position                 — "должность"
│       ├── isAdmin                  — bool (admin приложений)
│       ├── isSuperAdmin             — bool (может назначать других admin'ов)
│       ├── apps                     — { pllato_crm: true, team_crm: false, ... }
│       ├── createdAt                — timestamp
│       └── createdBy                — email того кто добавил
│
├── admin_emails/                    — реестр email-ов админов (для security rules)
│   └── {emailWithCommas}: true      — ключ = email с заменой . на , (Firebase не пускает точки в ключах)
│
├── channels/                        — публичные данные каналов связи
│   └── {pushId}/
│       ├── type                     — "binotel" | "greenapi_wa" | "smtp" | "instagram" | "facebook"
│       ├── name                     — "Binotel — главная линия"
│       ├── config                   — { default_inner: "101", host: "smtp...", phone_number: "..." }
│       │                              (БЕЗ секретов, только публичные поля!)
│       ├── apps                     — { pllato_crm: true, team_crm: false, ... }
│       ├── active                   — bool
│       ├── createdAt, updatedAt
│       └── createdBy, updatedBy
│
├── channel_secrets/                 — креды каналов (читают/пишут ТОЛЬКО админы)
│   └── {pushId}/                    — id совпадает с channels.{pushId}
│       ├── api_secret               — Binotel API secret
│       ├── api_token_instance       — Green-API token
│       ├── pass                     — SMTP password
│       ├── access_token             — Instagram/Facebook
│       └── page_token               — Facebook page token
│
├── deals/                           — [НЕ создано пока, в планах] сделки
├── contacts/                        — [НЕ создано пока, в планах] контакты
├── tasks/                           — [НЕ создано пока, в планах] задачи
├── feed/                            — [НЕ создано пока, в планах] лента
├── chats/, chat_messages/           — [НЕ создано пока, в планах] чаты
├── calls/                           — [планируется] события звонков от Binotel
├── messages/                        — [планируется] входящие/исходящие WA-сообщения
└── interviews/, research/           — данные опросов (используется другим приложением)
```

**Сейчас** (на момент handoff) `deals/`, `contacts/` и т.д. живут в localStorage браузера. Когда сделаем переход — нужно:
1. Переписать `app/store.js` чтобы вызывал Firebase вместо localStorage.
2. Сохранить тот же API: `list, get, create, update, remove, seed`.
3. Добавить onChange-listener'ы для live-обновлений между сессиями.
4. Миграция: при первом подключении выкатить локальные данные в Firebase (одноразовый seeder).

---

## Communicate flow (звонок / WA / email из CRM)

```
1. Пользователь в карточке сделки нажимает кнопку 📞 рядом с телефоном контакта.
2. openCommunicate({ type: "call", to: phone, contactName, context: {...} })
3. Модалка показывает выпадающий список каналов типа binotel
   (отфильтрованный через listChannels({ type: 'binotel' }) — из локального кэша,
    заполненного в bootе функцией syncChannelsFromFirebase).
4. Пользователь выбирает канал, нажимает «Звонить».
5. ТЕКУЩАЯ РЕАЛИЗАЦИЯ:
   - addActivity({ type: "call", channelId, channelName, to, ...})
   - alert(...) с подтверждением
6. БУДУЩАЯ РЕАЛИЗАЦИЯ (после деплоя Worker):
   - fetch(WORKER_URL + "/binotel/call", {
       method: "POST",
       headers: { Authorization: "Bearer " + idToken },
       body: JSON.stringify({ channelId, externalNumber: to, internalNumber: assigneeInner })
     })
   - Worker проверяет ID token через Firebase Admin SDK
   - Worker читает api_secret из /channel_secrets/{channelId}
   - Worker вызывает Binotel REST API (/api/4.0/calls/click-to-call.json)
   - Worker возвращает { ok: true, callId } или { ok: false, error }
   - При успехе CRM пишет activity и закрывает модалку
```

---

## Channels: где какие поля

### binotel
```
config (public):       { default_inner }
channel_secrets:       { api_key, api_secret }
```

### greenapi_wa
```
config (public):       { id_instance, phone_number }
channel_secrets:       { api_token_instance }
```

### smtp
```
config (public):       { host, port, user, from_name }
channel_secrets:       { pass }
```

### instagram
```
config (public):       { account }
channel_secrets:       { access_token }
```

### facebook
```
config (public):       { page_id }
channel_secrets:       { page_token }
```

Разделение задаётся массивом `SECRET_FIELD_NAMES` в `contact-center.html`:
```js
const SECRET_FIELD_NAMES = ["api_secret", "api_token_instance", "pass", "access_token", "page_token"];
```

---

## Маршруты SPA (`/crm/`)

| Hash | Раздел | Файл |
|---|---|---|
| `#dashboard` | Дашборд | `app/views/dashboard.js` |
| `#contacts` | Контакты | `app/views/contacts.js` |
| `#crm` (или `#deals` алиас) | CRM-воронка | `app/views/deals.js` |
| `#crm/<dealId>` | Открыть конкретную сделку | `app/views/deals.js::tryOpenDealFromHash` |
| `#tasks` | Задачи | `app/views/tasks.js` |
| `#feed` | Лента | `app/views/feed.js` |
| `#chat` | Чаты | `app/views/chat.js` |
| `#settings` | Настройки | `app/views/settings.js` |

Меню фильтруется по правам пользователя через `currentPermissions()` из `app/employees.js`.

---

## Локальный кэш в браузере (localStorage)

```
pllato_user_cache          — кэш текущего залогиненного юзера (TTL ~1 час)
pllato_demo_user           — DEMO-режим (когда firebase.config пустой)
pllato_theme               — "dark" / "light"
pllato_workspace           — { name, slug } — настройки workspace
pllato_employees_fb_sync   — флаг "уже синхронизировано из Firebase" (отключает demo-seed)
pllato_channels_cache      — кэш каналов (массив)
pllato_channels_fb_sync    — флаг
pllato_dashboard_chart     — настройки графика дашборда
pllato_stages              — стадии воронки
pllato_deal_fields         — кастомные поля сделок
pllato_int_<id>            — настройки старых интеграций (legacy)

pllato_core_contacts       — коллекция контактов
pllato_core_deals          — коллекция сделок
pllato_core_tasks          — коллекция задач
pllato_core_feed           — посты ленты
pllato_core_chats          — список бесед
pllato_core_chat_messages  — сообщения чатов
pllato_core_notifications  — уведомления
pllato_core_employees      — кэш сотрудников (после Firebase sync)
pllato_core_roles          — роли (созданные в настройках CRM)
pllato_core_deal_activities — активности по сделкам (заметки, звонки, письма)
pllato_core_task_comments  — комментарии к задачам
pllato_core_contact_activities — активности по контактам

sessionStorage:
  pllato_state_contacts    — selectedId / search / mode
  pllato_state_tasks       — filter / modalTaskId
  pllato_state_chat        — activeChatId
```

---

## Diagram: модель доступа

```
Pllato Google Account
       │ (login.html — Google Sign-In)
       ▼
  Firebase Auth
       │
       ▼
  /users/{uid} запись существует?
   ├── НЕТ + email = ROOT_SUPER → ОК (с auto-create записи)
   ├── НЕТ + не root → REJECT (нет в команде)
   └── ДА → проверка apps
            ├── isAdmin || isSuperAdmin → ОК (видит всё)
            ├── apps.<appId> === false → REJECT (нет доступа к приложению)
            └── apps.<appId> !== false → ОК (legacy users тоже пускаются)
```

---

— Конец ARCHITECTURE.md —
