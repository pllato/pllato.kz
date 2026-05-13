# Pllato CRM — Handoff для AI-агента

Этот документ — единая точка входа для AI-агента (Claude Code, Cursor, Copilot Workspace, Managed Agent — любой), который продолжает разработку проекта. Прочитай его целиком ОДИН раз в начале сессии, потом обращайся к секциям по мере надобности.

---

## TL;DR

- **Pllato CRM** — мультитенантное ядро CRM для команды Pllato (консалтинг по операционной отцифровке бизнеса).
- **Стек:** Vanilla HTML/CSS/JS на фронте (без сборки, ES modules), Firebase Realtime Database, Firebase Auth (Google Sign-In), Cloudflare Pages для хостинга, Cloudflare Worker для интеграций (планируется).
- **Live URLs:** `https://pllato.kz/crm/` (приложение CRM) и `https://pllato.kz/app.html` (хаб приложений Pllato + админка пользователей и каналов).
- **Главный супер-админ:** `uurraa@gmail.com` (Pllato — владелец).
- **Сейчас в работе:** Cloudflare Worker для Binotel-телефонии и других каналов связи.

---

## Кто такой Pllato (пользователь)

- **Имя:** Pllato (`uurraa@gmail.com`, GitHub `pllato`).
- **Язык:** русский — отвечай по-русски.
- **Уровень:** solo-разработчик, не профессиональный инженер. Пишет «как умеет», поэтому ему нужен код, который работает «из коробки», и развёрнутые объяснения простыми словами.
- **Стиль общения:** разговорный, по делу. Когда нужно выбрать между вариантами — **используй интерактивные кнопки** (в Claude Code — `AskUserQuestion`, в других агентах — равнозначный механизм). Не задавай длинных текстовых опросников.
- **Workflow:** «фиксим → коммит → push → деплой». Без TDD, без code-review, без церемоний. Pllato смотрит на результат в браузере и говорит «нравится / не нравится / поменяй».
- **Не любит:** длинные планы без действия, повторное переспрашивание, обходы вокруг да около.
- **Любит:** короткие итерации, видимый прогресс, чёткие команды и URL.

---

## Репозитории

### 1. `pllato/pllato-core-crm` (private)

Главный репо: исходный код Pllato CRM (всё что есть в `/crm/` на проде — копия отсюда).

```
/
├── index.html                       — вход в SPA
├── styles.css                       — все стили (~3000 строк, в одном файле)
├── app.js                           — корневой модуль (boot, Auth, Theme, router, shell)
├── firebase.config.js               — публичный конфиг Firebase (apiKey + т.д.)
├── _headers, _redirects             — конфиги Cloudflare Pages (используются и GH Pages)
├── assets/                          — SVG-лого и favicon
│   ├── pllato_icon.svg
│   ├── pllato_favicon.svg
│   ├── pllato_logo_navy.svg
│   └── pllato_logo_white.svg
├── app/                             — общие модули
│   ├── store.js                     — Store API (CRUD над localStorage; в будущем Firebase RTDB)
│   ├── employees.js                 — единая база сотрудников (синхронизируется из Firebase /users)
│   ├── channels.js                  — кэш каналов связи (из Firebase /channels)
│   ├── communicate.js               — модалка коммуникации (звонок/WA/email) с выбором канала
│   ├── stages.js                    — стадии воронки (хранятся в localStorage, редактируются)
│   ├── custom_fields.js             — кастомные поля для сделок
│   ├── notifications.js             — центр уведомлений
│   ├── icons.js                     — общие SVG-иконки (Lucide-style)
│   ├── version.js                   — VERSION, REVISION, HISTORY
│   └── views/                       — модули разделов
│       ├── dashboard.js             — Дашборд (виджеты + настраиваемый график)
│       ├── contacts.js              — Контакты (список + детали + поиск + дубликаты + merge + импорт)
│       ├── deals.js                 — CRM-воронка (Kanban + drag&drop + редактор стадий + split-view карточка)
│       ├── tasks.js                 — Задачи (подзадачи, чат-комментарии, файлы, участники)
│       ├── feed.js                  — Лента (посты с видимостью, файлы, комменты)
│       ├── chat.js                  — Чаты (личные/групповые)
│       └── settings.js              — Настройки (профиль, сотрудники, роли, каналы, custom fields, интеграции)
├── worker/
│   ├── worker.js                    — Cloudflare Worker (сейчас заглушка с /api/health)
│   └── wrangler.toml                — конфиг Worker
└── docs/                            — эта документация
```

### 2. `pllato/pllato.kz` (public)

Корпоративный сайт + хаб Pllato apps. Hosted on GitHub Pages, custom domain `pllato.kz`.

```
/
├── CNAME                            — pllato.kz
├── index.html                       — главная (лендинг)
├── app.html                         — ⚙ Хаб приложений + админка пользователей и прав
├── contact-center.html              — ⚙ Контакт-центр (каналы связи)
├── team.html                        — ⚙ CRM Команды (ELC) — отдельное приложение
├── login.html                       — Google Sign-In страница (общая для app.html, team.html, crm/)
├── crm/                             — копия pllato-core-crm (Pllato CRM)
│   └── ... всё то же что в pllato-core-crm/ ...
├── firebase-rules.json              — Firebase Realtime Database security rules (вставлять в Console)
├── pllato_*.svg, *.png              — брендинг, фавиконы, ELC ассеты
├── crm-builder.html, migrate.html,
│   assessment.html, audit.html,
│   interview-tiles.html, ...        — другие инструменты Pllato (НЕ трогать без явного запроса)
└── ... другие лендинги и страницы
```

**ВАЖНО:** изменения в `pllato.kz/crm/` всегда делаются ПОСЛЕ изменения в `pllato-core-crm/` (источник правды) и копируются. См. секцию «Workflow».

---

## Архитектура

### Фронтенд

- **Vanilla HTML/CSS/JS, ES modules.** Без сборщиков (Vite/Webpack), без фреймворков (React/Vue/Svelte), без TypeScript. Это сознательное решение — pllato хочет понимать каждую строку и редактировать без билда.
- **Inline стили в `<style>`** для отдельных страниц (`app.html`, `contact-center.html`, `team.html`), один общий `styles.css` для всего CRM.
- **Шрифт:** Inter (Google Fonts) или system-ui fallback.
- **Темы:** dark (default) и light, переключаются через `data-theme` атрибут на `<html>`. Сохраняется в localStorage.
- **Бренд-цвета:** navy `#0a1628`, bronze `#b8895a` (фирменные Pllato).

### Хранилище данных

| Сущность | Где сейчас | Куда переедет |
|---|---|---|
| Сотрудники | Firebase `/users` ✓ | — |
| Каналы связи (public) | Firebase `/channels` ✓ | — |
| Каналы связи (секреты) | Firebase `/channel_secrets` ✓ (читают только админы) | — |
| Реестр админов | Firebase `/admin_emails` ✓ (для security rules) | — |
| Контакты, сделки, задачи, лента, чаты | localStorage браузера ❌ | Firebase RTDB (в планах) |
| Файлы вложений | metadata в localStorage ❌ | Cloudflare R2 (в планах) |

**Store API** в `app/store.js` — тонкая абстракция CRUD. Сейчас бэкенд = localStorage. Когда подключим Firebase RTDB, меняется ТОЛЬКО `store.js`, остальные view-модули даже не узнают.

### Firebase

- **Project:** `pllato-crm` (используется ВСЕМИ приложениями Pllato — app.html, team.html, /crm/).
- **Public config** уже в коде:
  ```js
  apiKey: "AIzaSyC3Cw3nX6b1zpE1-lqW1whwUsPPUQ7TIhc"
  authDomain: "pllato-crm.firebaseapp.com"
  databaseURL: "https://pllato-crm-default-rtdb.firebaseio.com"
  projectId: "pllato-crm"
  storageBucket: "pllato-crm.firebasestorage.app"
  messagingSenderId: "690738857241"
  appId: "1:690738857241:web:2356e97c435656890ab188"
  ```
  Это публичные ключи Firebase Web SDK — безопасны, защита идёт через rules.
- **Authorized domains** в Firebase Console: `pllato.kz` (+ Firebase default). Если деплоить на новый домен — добавить туда.
- **Sign-in providers:** Google. Email/Password не используется.
- **Security rules:** см. `firebase-rules.json` в репо `pllato.kz` (главное правило: `/channel_secrets` читают только админы).

### Cloudflare

- **Account:** `Uurraa@gmail.com's Account`, ID `d0655e161d8fca8487f88d55c0eeb215`.
- **Cloudflare Pages:** ❌ НЕ подключён (текущий хостинг = GitHub Pages, потому что `pllato.kz` — public репо и работает по умолчанию). Если переедем — изменить хостинг в `pllato.kz` репо.
- **Cloudflare Workers:** один уже задеплоен (`pllato-research.uurraa.workers.dev` для исследований ELC). **Pllato CRM Worker ещё не задеплоен** — это один из ближайших таргетов. Каркас — в `worker/worker.js`.
- **R2:** не подключён. В планах для файлов.
- **API token** для wrangler: `~/.cloudflare-api-token` (53 байта, у pllato локально).

### Двухуровневая модель прав

1. **App-level** (управляется в `pllato.kz/app.html` → «⚙ Пользователи»):
   - Каждый сотрудник имеет `apps: { pllato_crm: true, team_crm: false, ... }`.
   - На `app.html` карточка-инструмент видна только если у юзера `apps[appId] === true` (или он `isAdmin`).
   - В каждом инструменте отдельная проверка: например, `/crm/` смотрит `apps.pllato_crm`.

2. **Tool-level** — внутри каждого приложения свои роли (например, в Pllato CRM: «Менеджер» видит сделки и контакты, «Наблюдатель» — только дашборд). Управляется в Настройках самого приложения.

**Каталог приложений** (`APPS_CATALOG` в `app.html`):
```
pllato_crm       — Pllato CRM (/crm/)
team_crm         — CRM Команды (ELC) (team.html)
robeng_crm       — RobEng CRM (внешняя ссылка)
interview_tiles  — Опросы клиентов
team_chat        — Командный чат (coming)
team_tasks       — Задачи команды (coming)
crm_builder      — Конструктор CRM (crm-builder.html)
bitrix_migrator  — Мигратор Bitrix (coming)
contact_center   — Контакт-центр (contact-center.html)
```

Чтобы добавить новое приложение: 1 строка в `APPS_CATALOG` + `data-app-id` на карточке + (опционально) в `contact-center.html` `APPS_CATALOG`.

### Главный супер-админ

- Захардкожен в коде: `ROOT_SUPER_ADMIN = "uurraa@gmail.com"`. Это `pllato.kz/app.html` и `/crm/` обе проверки.
- Всегда имеет полный доступ независимо от записей в `/users` (страховка от lock-out).
- При первом логине автоматически создаётся запись в `/users` с `isAdmin: true, isSuperAdmin: true`.
- Может назначать других супер-админов через UI на `app.html`.

---

## Workflow разработки

### Локальный setup

```bash
# Клонировать оба репо в одну директорию (стандарт pllato)
cd ~/Desktop/Cloude
git clone https://github.com/pllato/pllato-core-crm.git
git clone https://github.com/pllato/pllato.kz.git

# Установить per-repo git identity (НЕ глобальную)
cd pllato-core-crm
git config user.name "pllato"
git config user.email "59840270+pllato@users.noreply.github.com"

cd ../pllato.kz
git config user.name "pllato"
git config user.email "59840270+pllato@users.noreply.github.com"
```

### Локальный preview CRM

```bash
cd ~/Desktop/Cloude/pllato-core-crm
python3 -m http.server 8080
# открыть http://localhost:8080
```

Firebase auth (Google Sign-In) работает только с **Authorized domains** из Firebase Console: `localhost`, `pllato.kz`, `127.0.0.1`. Если нужен новый домен — pllato добавит.

### Как делать изменения (стандартный flow)

**ВАЖНО:** прямой push в `main` обоих репо может быть заблокирован harness'ом / GitHub branch protection. Используй PR-flow:

```bash
# 1. Создать feature-ветку из актуальной main
git fetch origin
git checkout -b my-feature origin/main

# 2. Сделать изменения. Если меняешь /crm/ — меняй в pllato-core-crm/,
#    потом копируй в pllato.kz/crm/.

# 3. Закоммитить
git add -A
git commit -m "Описание изменений

Что и почему. По-русски, как в существующих коммитах.

Co-Authored-By: ... <noreply@anthropic.com>"

# 4. Push + PR
git push -u origin my-feature
gh pr create --title "..." --body "..."
gh pr merge <PR-номер> --merge --delete-branch
```

`gh` CLI установлен в `~/.local/bin/gh`, авторизован под `pllato`.

### Sync между repo

Если меняешь код CRM:
1. **Сначала в `pllato-core-crm/`** (источник правды) — merge в main.
2. **Потом sync в `pllato.kz/crm/`**:
   ```bash
   cd ~/Desktop/Cloude/pllato.kz
   git fetch origin && git checkout -b sync-XXX origin/main
   cp ~/Desktop/Cloude/pllato-core-crm/app.js crm/app.js
   cp ~/Desktop/Cloude/pllato-core-crm/styles.css crm/styles.css
   cp ~/Desktop/Cloude/pllato-core-crm/app/*.js crm/app/
   cp ~/Desktop/Cloude/pllato-core-crm/app/views/*.js crm/app/views/
   # ... остальные файлы по необходимости
   git add crm/ && git commit -m "crm/: sync ..." && git push -u origin sync-XXX
   gh pr create ... && gh pr merge ...
   ```

### Деплой

- **`pllato-core-crm`** — НЕ деплоится сам по себе (это источник кода).
- **`pllato.kz`** — GitHub Pages, автодеплой при push в `main` (~30-60 сек). CNAME → `pllato.kz`.

### Версии (`app/version.js`)

При каждом merge нетривиальной ревизии:
- Поднять `VERSION` (например `0.8` → `0.9`).
- Поднять `REVISION` (`rev-7` → `rev-8`).
- Добавить запись в начало `HISTORY` с описанием на русском.

---

## Текущее состояние (на момент handoff)

Версия в `version.js`: **0.8 · rev-7** (merge `c1bf609`, 2026-05-13).

### Что работает

- ✅ Google Sign-In с проверкой `/users` в Firebase
- ✅ Двухуровневая модель прав (apps + roles)
- ✅ Контакты + поиск + дубликаты + merge + импорт (CSV/text)
- ✅ CRM-воронка (Kanban + drag&drop + редактируемые стадии + auto-scroll + URL-ссылка на сделку)
- ✅ Сделки: split-view карточка + шкала стадий + таймлайн коммуникаций (заметка/email/дело/WA/звонок)
- ✅ Задачи v2: подзадачи, чат-комментарии, файлы, участники, привязка к контактам/сделкам
- ✅ Лента: видимость (все / выбранные), файлы, комментарии, лайки
- ✅ Чаты: 1:1 и групповые (внутри команды)
- ✅ Дашборд: KPI + настраиваемый bar-chart по стадиям/интервалу/метрике
- ✅ Центр уведомлений в topbar
- ✅ Настройки: профиль, workspace, темы, сотрудники (read-only — управляются в app.html), роли с правами, custom fields, каналы (read-only из contact-center), интеграции (заглушка), опасная зона
- ✅ Кнопки коммуникации (📞 💬 ✉) в карточке сделки и контакта — открывают модалку с выбором канала
- ✅ Контакт-центр в `pllato.kz/contact-center.html`: каналы Binotel / Green-API WA / SMTP / Instagram / Facebook
- ✅ Firebase security rules (готовый JSON в `pllato.kz/firebase-rules.json`)

### Что НЕ сделано — приоритетные таски

1. **Cloudflare Worker для Binotel** — деплой `worker/worker.js`, добавление endpoints:
   - `POST /binotel/webhook` — приём событий от Binotel (звонки приходят, парсим, пишем в Firebase)
   - `POST /binotel/call` — Click-to-Call: фронт CRM → Worker → Binotel API
   - `POST /wa/send` — отправка WhatsApp через Green-API
   - `POST /email/send` — отправка email через SMTP канал
   - Worker должен читать секреты из `/channel_secrets/{channelId}` через Firebase Admin SDK (или REST + custom JWT).
   - Авторизация запросов фронта к Worker — через Firebase ID Token в `Authorization: Bearer ...`.
2. **Переход хранилища с localStorage на Firebase RTDB** — переписать `app/store.js`, оставив тот же API. Это даст мульти-юзер реально.
3. **Реальный upload файлов в R2** — сейчас сохраняется только metadata. Нужен R2 bucket + Worker endpoint `/files/upload`.
4. **Связка Worker'а с UI** — заменить `alert()` в `communicate.js` на `fetch(WORKER_URL + '/binotel/call', ...)`.

### Ожидается от Pllato

- **Ключи Binotel** (API key + secret + список внутренних номеров) — поддержка Binotel ещё не прислала.
- **Заполнение Firebase rules** — вставить `pllato.kz/firebase-rules.json` в Firebase Console → Realtime Database → Rules → Publish. (До этого `/channel_secrets` доступны всем залогиненным — небезопасно для production-кредов.)

---

## Style guide

### Код

- **JS:** ES modules, async/await, шаблонные литералы для HTML. Без сборки, без TS, без JSX.
- **CSS:** один файл `styles.css`, CSS-переменные (`--accent`, `--surface`, и т.д.) для тем. Не подключать внешние библиотеки.
- **Иконки:** `app/icons.js` — inline SVG (Lucide-style, stroke=1.75). Эмодзи только когда они уместны (например, «📞» как label кнопки звонка).
- **Имена коллекций в Store:** `snake_case` (например, `deal_activities`, `task_comments`).
- **Имена локального хранилища:** префикс `pllato_` (например, `pllato_user_cache`, `pllato_employees_fb_sync`).
- **Комментарии в коде:** на русском, кратко, объясняют «зачем», а не «что».

### Коммиты

- Сообщения на русском.
- Первая строка — короткое заглавие.
- Дальше — пустая строка и тело (что, почему, что меняет в работе).
- В конце:
  ```
  Co-Authored-By: <твоё имя> <noreply@...>
  ```

### Общение с pllato

- На русском, развёрнуто, простыми словами.
- Для выбора между вариантами — **кнопки** (если агент поддерживает).
- Когда показываешь URL или команду — копируй точно.
- В Auto mode не задавай лишних вопросов, минимизируй прерывания.

---

## Известные особенности

- **Старый pllato-crm** репозиторий — НЕ путать с `pllato-core-crm`. Старый был MVP с миграцией из Битрикс24, мы оставили его в покое.
- **`pllato.kz/team.html`** — это отдельное приложение «CRM Команды (ELC)», полностью самодостаточное (один большой HTML-файл с собственной логикой). Используется командой ELC. **Не редактировать без явного запроса.**
- **`pllato.kz/crm-builder.html`** — визуальный конструктор CRM для встреч с клиентами. Pllato часто туда коммитит сам, могут быть конфликты — всегда `git fetch && rebase or branch from origin/main`.
- **GH Pages cache** = 10 минут. После push изменения видны после hard-refresh.

---

## Безопасность

- **Никогда** не клади в репо `firebase-service-account.json`, `wrangler-account.json`, токены, пароли. Все секреты — через переменные окружения или Wrangler secrets.
- `~/.cloudflare-api-token` (у pllato локально) — не публиковать.
- Если pllato вставит токен прямо в чат — попроси его отозвать и пересоздать (рассказать только через файл).
- Firebase Web config (apiKey + т.д.) — публичная информация, можно класть в репо.

---

## Что читать дальше

- `docs/CHANGELOG.md` — история ревизий (что и когда менялось).
- `docs/ARCHITECTURE.md` — детальная архитектура с диаграммами потоков.
- `docs/CREDENTIALS.md` — где какие ключи лежат и как добавить новые.
- `docs/BOOTSTRAP_PROMPT.md` — готовый промт для первого запуска AI-агента.
- `firebase-rules.json` в `pllato.kz` репо — security rules.

---

## Контакты и доступы

- **GitHub:** `pllato` (uurraa@gmail.com).
- **Cloudflare:** account `Uurraa@gmail.com's Account`.
- **Firebase:** project `pllato-crm`.
- **Binotel:** аккаунт у Pllato; ключи API получает от поддержки (см. `docs/CREDENTIALS.md`).

— Конец HANDOFF.md —
