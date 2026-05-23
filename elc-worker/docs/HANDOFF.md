# ELC CRM — Phase 2 Handoff

> Это handoff для Claude Code. Прочитай этот файл первым, остальные документы укажут детали.

## Контекст

ELC CRM (English Lifestyle Communication) — внутренний CRM, монолитный `team.html` (8115 строк) на `pllato.kz/team.html`. Изначально использовал Firebase RTDB как backend. RTDB деактивировалась без явной причины, поэтому проект мигрируется на Cloudflare D1 + Worker.

**Phase 0 уже завершена:**
- ✅ D1 база `pllato-elc-d1` создана, schema из 13 таблиц применена
- ✅ Все данные мигрированы из Firebase RTDB backup (`data.json.gz` 40MB → 479MB raw → залит в D1):
  - 143,751 contacts, 22,609 deals, 38,637 tasks, ~146k timeline activities,
    82,941 chat messages, 30,685 openlines messages, 86 users, 20 companies,
    21 group chats, 780 openline sessions, 81 custom fields schema, 17 kv pairs
- ✅ Worker `pllato-elc-worker` задеплоен на `https://pllato-elc-worker.uurraa.workers.dev`
- ✅ Health endpoint `/health` отвечает с `{"ok":true, "d1":{"contacts":143751}}`
- ✅ Auth verification через Firebase Auth (jose + JWKS) уже реализована в worker.js
- ✅ CORS для `https://pllato.kz` настроен

**Сейчас Phase 2.1: добавить RTDB-proxy endpoint в worker, чтобы team.html заработал без Firebase RTDB.**

## Ключевое архитектурное решение

В `team.html` практически все обращения к Firebase RTDB идут через **REST API** — это паттерн:
```js
fetch(`${dbUrl}/${path}.json?auth=${idToken}`)
```
где `dbUrl = firebaseConfig.databaseURL.replace(/\/$/, '')` = `https://pllato-crm-default-rtdb.firebaseio.com`.

Всего ~40 таких вызовов на ~22 уникальных путях. **Если worker притворится Firebase RTDB на одном универсальном endpoint** `GET/PATCH /api/rtdb/{path}.json`, то фронтенд почти не меняется — нужно только заменить переменную `dbUrl`.

## Задача Phase 2.1

### 1. Расширить worker.js

Добавить universal endpoint `/api/rtdb/{path}` который:
- Парсит path (например `users.json`, `contacts/contact_100.json`, `timeline/deal_X.json`)
- Маппит на D1 SELECT (или UPDATE для PATCH)
- Возвращает JSON в формате Firebase RTDB (dict {key:record} для коллекций, record для одиночного)
- Конвертирует snake_case (БД) → camelCase (frontend) — критично, иначе frontend не найдёт поля типа `lastName`, `bitrixId`
- Принимает `?auth=idToken` (query) **и** `Authorization: Bearer` (header) — для backward-compat
- Поддерживает `?shallow=true` (возвращает только keys как `{key: true}`)
- Поддерживает `?orderBy=` и `?limitToLast=` (минимально, только для `openlinesSessions`)

Спецификация со всеми деталями — см. `docs/RTDB_PROXY_SPEC.md`.
Маппинг колонок таблиц — см. `docs/SCHEMA_MAPPING.md`.
Полный список путей frontend'а — см. `docs/RTDB_PATHS_INVENTORY.md`.

### 2. Запатчить team.html

Через `apply.py` (стиль pak'ов Platon) сделать 5 точечных замен:
1. Добавить константу `WORKER_RTDB_URL` сразу после `WORKER_URL`
2. Заменить 10× `const dbUrl = firebaseConfig.databaseURL.replace(/\/$/, '')` → `const dbUrl = WORKER_RTDB_URL`
3. Заменить 3× прямых `firebaseConfig.databaseURL.replace(/\/$/,'')` → `WORKER_RTDB_URL`
4. Закомментировать `await update(ref(db, ...))` на ~line 1815 (это write через SDK, у нас пока нет write API)
5. Заменить `onValue(usersRef, ...)` на одноразовый fetch (это listener на users, в read-only CRM не нужен)

Точные тексты для replace — см. `docs/TEAM_HTML_PATCHES.md`.

### 3. Тестирование

После каждого изменения проверять curl-командами (см. `docs/TESTING.md`). Не двигаться дальше пока endpoint не возвращает корректный JSON.

## Workflow

Platon работает по паттерну "apply.py-пак":
1. Claude Code пишет код (worker.js, apply.py)
2. Создаёт feature branch (`feat/elc-rtdb-proxy`)
3. Коммитит, пушит, создаёт PR
4. Platon merge-ит через web UI
5. Если что-то ломается — Claude Code откатывает или пишет fix-пак

Все коммиты, PR, merge — через git CLI. Wrangler уже залогинен и готов к `wrangler deploy`.

## Файлы окружения

- `~/Desktop/Cloude/pllato.kz/` — git repo, main branch
- `~/Desktop/Cloude/pllato.kz/elc-worker/` — worker code (worker.js, schema.sql, wrangler.toml, package.json)
- `~/Desktop/Cloude/pllato.kz/team.html` — frontend
- `~/elc-migration/` — миграционные скрипты Phase 0 (можно игнорировать, миграция data уже завершена)

## Стиль

- Все объяснения и комментарии — на **русском**, как привык Platon
- Код — на английском (стандарт)
- Никаких лишних абстракций — минимальный путь к работающему результату
- Если что-то непонятно — спросить Platon, не угадывать

---

**Старт работы:** прочитай `docs/RTDB_PROXY_SPEC.md`, затем `docs/SCHEMA_MAPPING.md`, затем начни писать worker.js.
