# ELC CRM — Handoff для следующей сессии

> Документ для Claude Code следующей сессии. Прочитай в первую очередь.

## Где мы

ELC CRM (English Lifestyle Communication) — внутренняя CRM `pllato.kz/team.html` (~10k строк HTML+JS). Изначально Firebase RTDB → деактивировалось → мигрировано на Cloudflare D1 + Worker. Bitrix24 тоже отключается (файлы уже спасены в R2).

В этой сессии прошли путь:
- **Phase 2-3**: миграция RTDB → D1+Worker (proxy endpoint, sparse-serialization, pagination)
- **Phase 4**: миграция файлов задач из Bitrix → R2 (1300/1314 файлов, 1.19 GB)
- **Aminamed-style refresh** канбана + multi-pipeline + quick-add сделки + call-skeleton

Сейчас в работе: **браузерные SIP-звонки** (Oracle Cloud Free Tier + Asterisk). Платон зарегистрировал Oracle Cloud — **ждём от него VM с public IP и установленным SSH-доступом**.

## Архитектура

```
Browser (team.html on pllato.kz)
  │
  ├─ HTTP/JSON ──→ Cloudflare Worker: pllato-elc-worker.uurraa.workers.dev
  │                  │
  │                  ├─ D1 binding DB → pllato-elc-d1 (16 таблиц, ~450k записей)
  │                  └─ R2 binding FILES → pllato-elc-files (1300 файлов, 1.19GB)
  │
  ├─ Firebase Auth (Google Sign-In) → project pllato-crm (token sharing с Aminamed CRM)
  │
  └─ [WIP] SIP-WebRTC gateway → Oracle Cloud VM → Binotel-trunk → PSTN
```

### D1 таблицы (16)

`companies`, `contacts`, `pipelines`, `deals`, `tasks`, `timeline_activities`, `users`, `group_chats`, `chat_messages`, `openlines_sessions`, `openlines_messages`, `custom_fields_schema`, `kv`, `files_queue` (R2 meta), `call_log` (звонки), `migration_log`.

Schema — `elc-worker/schema.sql`.

### Worker endpoints

| Endpoint | Описание |
|---|---|
| `GET /health` | public ping |
| `GET /api/me` | auth: профиль текущего юзера |
| `GET/PATCH/PUT/DELETE /api/rtdb/{path}.json` | Firebase RTDB-совместимый прокси для legacy кода. Stream collection, sparse-serialization для крупных таблиц, upsert через PUT, safety на DELETE |
| `GET /api/list/{contacts\|tasks\|deals}` | Серверная пагинация: `?page&pageSize&q&sort&status&assignee&stage&pipeline&closed` |
| `GET /api/files/{id}` | Streaming-отдача из R2, auth, content-disposition с UTF-8 |
| `POST /api/call/event` | INSERT/UPDATE строки в `call_log` |
| `GET /api/call/log?contactId&dealId&phone&limit` | История звонков |

### Frontend (`team.html`)

- `WORKER_RTDB_URL` `WORKER_LIST_URL` `WORKER_FILES_URL` `WORKER_CALL_URL` — endpoint константы
- IndexedDB-кеш fetch-interceptor (`elc-rtdb-cache`, CACHE_VERSION='v4', 24h TTL, query-aware ключи)
- Helper'ы: `asArray()` (pseudo-array safe), `escapeHtml()`, `buildPagerHtml()`, `callButtonHtml()`, `placeCall()`
- localStorage ключи:
  - `elc:activePipelineId` — выбранная воронка
  - `elc:dealsView` — kanban/list
  - `elc:pipelineOrder` — порядок табов воронок

## Что работает (по разделам)

| Раздел | Состояние |
|---|---|
| **Главная** | Дашборд счётчиков через `/api/rtdb/{entity}.json?shallow=true` |
| **Контакты** (143k) | Серверная пагинация 50/стр, поиск по name/lastName/phones/emails (case-insensitive с 3 вариантами для кириллицы) |
| **Сделки** (22k) | Hybrid: kanban (default) с full-load + drag-and-drop через PATCH; list paginated через `/api/list/deals`. **Multi-pipeline tabs** с drag-reorder. **Quick-add сделки** в каждой колонке kanban с typeahead контакта |
| **Задачи** (38k) | Hybrid: list (default) paginated; kanban lazy-load. Sort by activity DESC. 3 фильтра. markAllRead. |
| **Сотрудники** (86) | Full schema (НЕ sparse) — фронт ломается на `lastName.localeCompare(undefined)` если sparse |
| **Чаты** (21+82k msgs) | Full-load 30MB, без пагинации |
| **Файлы задач** | 1300 в R2, кнопка «↓ Скачать» работает через worker `/api/files/{id}` |
| **Звонки** | UI-каркас (placeCall + dialer overlay + история в карточке контакта). Реальная телефония **wait**: ждём Oracle Cloud VM + Asterisk |

## Конвенции

### Деплой
```bash
# Worker
cd ~/Desktop/Cloude/pllato.kz/elc-worker
wrangler deploy --config ~/Desktop/Cloude/pllato.kz/elc-worker/wrangler.toml

# ВАЖНО: всегда --config с полным путём, иначе wrangler ловит чужой wrangler.toml
# из родительских папок (см. ~/.claude/.../memory/feedback_wrangler_config.md)
```

Frontend деплоится автоматически через Cloudflare Pages при push в `main`.

### Git workflow
1. `git checkout -b feat/elc-<feature>` от свежего `origin/main`
2. Изменения → commit с подробным message (на русском, с Co-Authored-By)
3. `git push -u origin feat/elc-<feature>`
4. `gh pr create --base main --title ... --body ...`
5. `gh pr merge <num> --merge --repo pllato/pllato.kz` — мерджу сам (Platon разрешил)
6. CF Pages деплоит через 1-2 мин

### Commit-стиль
Conventional commits на русском:
- `feat(elc): ...`
- `fix(elc): ...`
- `revert(elc): ...`

Body: симптом, причина, фикс, что не сделано. Co-Authored-By в конце.

## Платон (pllato) — про юзера

- Solo dev, русскоязычный, работает на macOS (zsh)
- Предпочитает vanilla HTML/CSS/JS (никаких bundlers/React)
- Не хочет вставлять секреты в чат — кладёт в `~/.secrets/<name>.txt`
- gh CLI в `~/.local/bin/gh` (не на PATH), git identity per-repo
- Wrangler в `~/.local/bin/wrangler`, авторизован
- Управляет Bitrix24 admin, Cloudflare account `d0655e161d8fca8487f88d55c0eeb215`
- Firebase project `pllato-crm` (общий с Aminamed CRM)

См. `~/.claude/projects/-Users-platontsay-Desktop-Cloude/memory/`:
- `user_profile.md`
- `setup_workspace.md`
- `feedback_secrets.md`
- `feedback_wrangler_config.md`
- `elc_crm_migration.md`

## Известные quirks

1. **`Array.isArray()` на Firebase pseudo-arrays** → используй `asArray(v)` helper. RTDB сохраняла arrays как `{0:val,1:val}`.
2. **SQLite `LOWER()` не работает для кириллицы** → в search использую 3 LIKE-варианта (original / lowercase / Capitalize first).
3. **Sparse-сериализация только для крупных таблиц** (`SPARSE_TABLES` в worker.js): contacts/tasks/deals/timeline_activities/chat_messages. Для users/companies/pipelines — full schema (иначе фронт ломается).
4. **IDB-кеш query-aware**: shallow и full запросы кешируются под разными ключами. `buildCacheKey(path, search)` исключает `auth`/`_v` из ключа.
5. **CACHE_VERSION bump** в team.html — единственный способ инвалидации старого IDB-кеша после format-breaking изменений. Сейчас v4.
6. **Wrangler без `--config` дёргает чужой wrangler.toml** из родительских папок (например elc-landing). Всегда `--config /full/path`.
7. **Auto-sync коммиты из pllato-core-crm** проходят через main параллельно — не пугаться `sync: auto-sync ...` коммитов в логе.

## Открытые задачи (WIP)

### 1. SIP-звонки в браузере (текущая работа)

**Состояние:** Платон выбрал Oracle Cloud Free Tier + Asterisk. Сейчас регистрируется на Oracle.

**Ждём от него:**
- Public IP созданной VM
- SSH-доступ (он принял sсhemа: даёт IP, я даю install script)
- Binotel SIP credentials (login/password/server для line 1914) — он запросит у Binotel support

**Следующие шаги когда VM готова:**
1. Дать Платону скрипт установки Asterisk + coturn + Let's Encrypt (через SSH-инструкции)
2. Дать конфиг `pjsip.conf` с Binotel-trunk + WebRTC endpoint
3. DNS: `sip.pllato.kz` → IP VM (Cloudflare DNS, proxy OFF)
4. Frontend: подключить SIP.js в team.html, заменить `tel:` в `placeCall()` на SIP invite
5. Тестовый звонок

Каркас в team.html (`placeCall`, `dialer-overlay`, `callButtonHtml`) — готов. Внутрь `placeCall` встроить SIP.js.

### 2. Запись разговоров

После Asterisk — конфиг `Monitor` или `MixMonitor` пишет WAV. Cron каждую ночь конвертит → загружает в R2 (бакет уже есть). Подвязка к `call_log.recording_url`.

### 3. Входящие на экран

Asterisk через `ARI` (Asterisk REST Interface) пушит event «incoming call» → Cloudflare Worker через WebSocket / SSE → браузер показывает Web Notification + открывает диалер.

## Что отложено (можно сделать когда будет время)

- **Write API для контактов/задач** — сейчас полноценно работает только для deals (PATCH stageId через kanban drag). Создание/редактирование других сущностей в UI ограничено.
- **Tasks-канбан только active** (status 1-3) — сейчас грузит full 52MB, можно ~5MB
- **Чаты пагинация** — 30MB full load
- **Полная миграция Aminamed CRM** — Платон сначала хотел но потом передумал (см. PR #53 откат). Сейчас взят только визуал kanban'а
- **Custom fields editable из карточки сделки** — UI есть, write — нет
- **Quick-add сделки в list-view** — сейчас только в kanban

## Quick commands cheat sheet

```bash
# Branch + deploy worker + curl-test
cd ~/Desktop/Cloude/pllato.kz
git fetch origin && git checkout -b feat/elc-<name> origin/main
# ... edits ...
cd elc-worker
wrangler deploy --config ~/Desktop/Cloude/pllato.kz/elc-worker/wrangler.toml
cd ..
git add team.html elc-worker/worker.js
git commit -m "feat(elc): ..."
git push -u origin feat/elc-<name>
~/.local/bin/gh pr create --base main --title "..." --body "..."
~/.local/bin/gh pr merge $(~/.local/bin/gh pr list --head feat/elc-<name> --repo pllato/pllato.kz --json number --jq '.[0].number') --merge --repo pllato/pllato.kz

# Проверить состояние БД
wrangler d1 execute pllato-elc-d1 --remote --config elc-worker/wrangler.toml --command="SELECT COUNT(*) FROM <table>"

# Список R2 файлов
wrangler r2 object list pllato-elc-files --config elc-worker/wrangler.toml | head

# JS-syntax-check team.html
python3 -c "import re; t=open('team.html').read(); m=re.search(r'<script type=\"module\">(.*?)</script>', t, re.DOTALL); open('/tmp/s.js','w').write(m.group(1))" && node --check /tmp/s.js
```

## Files in repo

```
pllato.kz/
├── team.html                  ← Основной фронт (8500+ строк)
├── team-legacy.html           ← Backup до Aminamed-refresh (можно удалить позже)
├── elc-crm/                   ← Копия Aminamed CRM (РЕФЕРЕНС — для заимствования kanban/contact-typeahead UI/JS логики)
├── crm/                       ← Aminamed CRM оригинал (НЕ ТРОГАТЬ — продакшен Aminamed)
├── elc-worker/
│   ├── worker.js              ← CF Worker (D1+R2)
│   ├── schema.sql             ← D1 schema (16 таблиц)
│   ├── wrangler.toml          ← с bindings DB и FILES
│   ├── docs/
│   │   ├── HANDOFF.md         ← оригинальный handoff (Phase 2.1)
│   │   ├── SESSION_HANDOFF.md ← ЭТОТ ДОКУМЕНТ — handoff текущей сессии
│   │   ├── RTDB_PROXY_SPEC.md ← спека RTDB-proxy
│   │   ├── SCHEMA_MAPPING.md  ← snake↔camel
│   │   ├── TEAM_HTML_PATCHES.md
│   │   ├── TESTING.md
│   │   ├── BOOTSTRAP_PROMPT.md
│   │   ├── apply_rtdb_proxy.py ← Phase 2.1 пак
│   │   └── apply_idb_cache.py  ← Phase 2.2 пак (CACHE_VERSION='v4' внутри)
│   └── scripts/
│       ├── migrate_tasks_files.mjs ← Bitrix → R2 (для повторного запуска)
│       └── migration-report.json   ← результат миграции (untracked)
```

## Memory updates

После этой сессии обновлены:
- `~/.claude/.../memory/elc_crm_migration.md` — текущее состояние (multi-pipeline, quick-add, call-skeleton)

## Контакты / репозитории

- Repo: `https://github.com/pllato/pllato.kz` (main branch)
- Worker URL: `https://pllato-elc-worker.uurraa.workers.dev`
- Frontend: `https://pllato.kz/team.html`
- D1: `pllato-elc-d1` (Cloudflare account `d0655e161d8fca8487f88d55c0eeb215`)
- R2 bucket: `pllato-elc-files`
- Firebase project: `pllato-crm` (shared with Aminamed)

## Что делать новому Claude в первую очередь

1. Прочитать этот файл
2. Прочитать `~/.claude/.../memory/MEMORY.md` + `elc_crm_migration.md` + `user_profile.md`
3. `cd ~/Desktop/Cloude/pllato.kz && git fetch origin && git status` — убедиться что main свежий
4. Спросить Платона: «Где остановились? VM Oracle Cloud готова или другая задача?»
5. **НЕ** начинать большой рефактор без явного запроса Платона. Скоп должен быть согласован.
