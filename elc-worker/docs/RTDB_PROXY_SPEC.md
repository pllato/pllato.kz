# RTDB Proxy Endpoint Specification

## Цель

Реализовать в `worker.js` endpoint `/api/rtdb/{path}` который притворяется Firebase Realtime Database REST API. Это позволяет `team.html` работать без изменений в логике — только меняется base URL.

## URL формат

```
GET   /api/rtdb/{path}.json?<query>
PATCH /api/rtdb/{path}.json?<query>
```

`{path}` — это slash-separated путь как в RTDB, без leading slash. Примеры:
- `users.json` → коллекция users целиком
- `users/uid_xxx.json` → конкретный пользователь
- `contacts/contact_100.json` → конкретный контакт
- `timeline/deal_6060.json` → activities по сделке `deal_6060`
- `customFieldsSchema/deal.json` → схема кастомных полей сделок

## Auth

Принимать **оба** варианта (frontend сейчас использует query):

```js
// Вариант 1: query string (как Firebase RTDB)
?auth={firebaseIdToken}

// Вариант 2: header (более правильно)
Authorization: Bearer {firebaseIdToken}
```

Верификация: используй уже существующую функцию `verifyFirebaseIdToken(token, env.FIREBASE_PROJECT_ID)` из текущего worker.js. Если токен невалиден — 401.

## Query params

- `?shallow=true` — возвращает только ключи как dict с `true` (Firebase behavior):
  ```json
  {"user_1": true, "user_2": true, ...}
  ```
- `?orderBy="<field>"` — сортировка (только для `openlinesSessions`, минимальная поддержка)
- `?limitToLast=<n>` — взять последние N (только для `openlinesSessions`)

Остальные query params можно игнорировать.

## Response format

### Для коллекции (path = "users.json", "contacts.json" и т.д.)

Возвращает JSON-объект `{id1: record1, id2: record2, ...}`:

```json
{
  "uid_abc": {"name": "Иван", "lastName": "Петров", "email": "...", ...},
  "uid_def": {"name": "Анна", "lastName": "Иванова", ...}
}
```

Если коллекция пустая — `{}` (не `null`).

### Для одиночной записи (path = "users/uid_abc.json")

Возвращает запись напрямую (без обёртки):

```json
{"name": "Иван", "lastName": "Петров", "email": "...", ...}
```

Если запись не найдена — `null` (важно: именно `null`, не 404 с ошибкой! Так делает Firebase, frontend этого ожидает).

### Для PATCH

```js
PATCH /api/rtdb/deals/deal_6060.json
Body: {"stageId": "C3:WON", "bitrixDateModify": "2026-05-23T..."}
```

Делать `UPDATE deals SET stage_id=?, bitrix_date_modify=? WHERE id=?`. Маппинг camelCase в body → snake_case колонок БД. Возвращать `{"ok": true}` или 200 с пустым body.

## Маппинг path → SQL

См. подробный маппинг в `SCHEMA_MAPPING.md`. Общая логика:

| path pattern | SQL |
|---|---|
| `users.json` | `SELECT * FROM users` → dict keyed by `uid` |
| `users/{uid}.json` | `SELECT * FROM users WHERE uid = ?` → single record |
| `contacts.json` | `SELECT * FROM contacts` → dict keyed by `id` |
| `contacts/{id}.json` | `SELECT * FROM contacts WHERE id = ?` → single |
| `deals.json` | `SELECT * FROM deals` → dict keyed by `id` |
| `deals/{id}.json` | `SELECT * FROM deals WHERE id = ?` → single |
| `tasks.json` | `SELECT * FROM tasks` → dict keyed by `id` |
| `tasks/{id}.json` | `SELECT * FROM tasks WHERE id = ?` → single |
| `companies.json` | `SELECT * FROM companies` → dict keyed by `id` |
| `companies/{id}.json` | `SELECT * FROM companies WHERE id = ?` → single |
| `pipelines.json` | `SELECT * FROM pipelines` → dict keyed by `id` |
| `pipelines/{id}.json` | `SELECT * FROM pipelines WHERE id = ?` → single |
| `customFieldsSchema/{entity}.json` | `SELECT * FROM custom_fields_schema WHERE entity_type=?` → dict keyed by `field_name`, value = `{label, type, mandatory, multiple, sort, list}` (camelCase) |
| `groupChats.json` | `SELECT * FROM group_chats` → dict keyed by `id`; **ВАЖНО**: добавь nested `messages` для каждого чата (`SELECT * FROM chat_messages WHERE chat_id=?` → dict keyed by message `id`) |
| `groupChats/{id}.json` | `SELECT * FROM group_chats WHERE id=?` + nested `messages` → dict |
| `openlinesSessions.json` | `SELECT * FROM openlines_sessions ORDER BY last_message_at DESC LIMIT ?` (если orderBy + limitToLast) → dict keyed by `id` |
| `openlinesSessions/{id}.json` | `SELECT * FROM openlines_sessions WHERE id=?` + nested `messages` (из `openlines_messages`) |
| `timeline/{ownerId}.json` | `SELECT * FROM timeline_activities WHERE owner_id=?` → dict keyed by activity `id`. `ownerId` это `deal_6060`, `contact_100`, и т.д. |
| `taskReadState/{uid}.json` | `SELECT * FROM kv WHERE k = 'taskReadState/' \|\| ?` → парсить value (это dict) или `{}` если не найдено |
| `taskReadState/{uid}/{taskKey}.json` | вернуть конкретное значение из таблицы kv |
| `filesQueue/{id}.json` | вернуть `null` (миграционная служебка, не нужна frontend'у read-only) |
| `migrationState/{key}.json` | вернуть `null` (служебка) |
| `referenceLists.json` | вернуть `{}` (Firebase RTDB возвращал ничего — этот path не использовался) |

## snake_case → camelCase

В D1 все колонки snake_case (`last_name`, `bitrix_id`, `created_by_uid`). Frontend ожидает camelCase (`lastName`, `bitrixId`, `createdByUid`).

**Преобразование при ответе** — обязательно. Простое правило: replace `_X` на `X.toUpperCase()`. То есть `last_name` → `lastName`. **Исключение**: `uid` остаётся `uid` (это не "u_id").

При PATCH — наоборот: body приходит с camelCase, конвертируй в snake_case для UPDATE.

Подробный маппинг — `SCHEMA_MAPPING.md`.

## JSON-колонки

Некоторые колонки в D1 хранят сериализованный JSON (TEXT). При ответе их надо `JSON.parse`-ить:

- `users.department`, `users.apps`
- `contacts.emails`, `contacts.phones`, `contacts.messengers`, `contacts.websites`, `contacts.custom_fields`
- `companies.phones`
- `deals.custom_fields`
- `tasks.accomplices`, `tasks.auditors`, `tasks.comments_data`, `tasks.crm_links`, `tasks.bitrix_crm_links`, `tasks.bitrix_file_ids`
- `pipelines.stages`
- `timeline_activities.payload` — самая важная, спросит весь объект активности
- `openlines_sessions.users`
- `openlines_messages.payload`
- `custom_fields_schema.list`
- `kv.v`

Если JSON.parse падает — отдать как есть (string).

## Specific cases

### `groupChats.json` (включая список + сообщения)

Это самый тяжёлый эндпоинт. Frontend ожидает все 21 чат + все 82,941 сообщения в одном ответе.

Идеальный SQL:
```sql
SELECT * FROM group_chats;
SELECT * FROM chat_messages;  -- отдельно, в JS склеить
```

Затем в JS:
```js
const chatsArr = chats.results;
const msgsArr = messages.results;
const result = {};
for (const chat of chatsArr) {
  const chatRecord = toCamelCase(chat);
  chatRecord.messages = {};  // dict {msgId: msgRecord}
  result[chat.id] = chatRecord;
}
for (const msg of msgsArr) {
  if (result[msg.chat_id]) {
    result[msg.chat_id].messages[msg.id] = toCamelCase(msg);
  }
}
return result;
```

**Внимание**: 82k сообщений × ~500 bytes = ~40MB JSON. Это много, но Firebase это отдавал. Если worker лимит response body будет превышен — нужно либо не отдавать messages в листинге, либо разбить на пагинацию. Сначала попробовать как есть.

### `openlinesSessions.json` с orderBy/limitToLast

```
GET /api/rtdb/openlinesSessions.json?orderBy="lastMessageAt"&limitToLast=200
```

→ `SELECT * FROM openlines_sessions ORDER BY last_message_at ASC LIMIT 200` (последние 200 по возрастанию даты, как в Firebase).

Только этот один путь использует orderBy/limitToLast в frontend'е. Парсить query примитивно — не нужен полный Firebase Query syntax.

### `openlinesSessions/{id}.json` (с сообщениями)

```js
SELECT * FROM openlines_sessions WHERE id = ?
SELECT * FROM openlines_messages WHERE session_id = ?
// собрать sess.messages = dict из msgs
```

### `timeline/{ownerId}.json`

`ownerId` = `deal_6060`, `contact_123`, `company_5`, etc.

```js
SELECT * FROM timeline_activities WHERE owner_id = ?
```

Возвращать dict keyed by activity `id` (это `activity_XXX`). Каждый activity record включает `payload` (JSON) и плоские поля. **Внимание**: исторически в RTDB структура была `timeline/{ownerId}/{activityId}/{...activityData}`. У нас `payload` колонка содержит весь activity object. При ответе можно либо:
- Отдать плоско: `{[activityId]: {...flat fields..., ...payload contents...}}` — лучший вариант, frontend получает всё в одном
- Или просто отдать `{[activityId]: payload}` (если payload сам уже содержит все нужные поля)

Проверь `payload` JSON в БД — какие поля внутри. Если payload содержит ВСЕ поля activity — достаточно отдать `payload`. Если только часть — слепить с плоскими.

## Error handling

- Невалидный auth → 401 `{"error":"unauthorized"}`
- Неизвестный path → 404 `{"error":"unknown path"}` (это поможет debug'у frontend'а)
- D1 ошибка → 500 `{"error": "..."}` с message
- Если коллекция пустая или запись не найдена → **успешный 200** с `{}` или `null` соответственно (это Firebase behavior)

## CORS

Уже настроено в текущем worker.js. Просто переиспользуй `corsHeaders(request)` функцию.

## Производительность

D1 имеет лимиты:
- Max rows per query: проверь, по умолчанию вроде 1000-5000 в одном response. Может надо paginate с `LIMIT/OFFSET` или с cursor по `id > last_id`.
- Max response body: лимит worker'а — 100MB (на платном плане).

Для `contacts.json` (143k rows) и `tasks.json` (38k rows) — оцени, влезет ли. Если нет — лучше всего:
1. Сделать internal pagination: SELECT с LIMIT 5000, цикл до конца
2. Склеить result в JS
3. Вернуть одним response (даже если 50MB)

Если 50MB слишком много — frontend всё равно так грузил из Firebase, значит работало. Если worker задушится — добавь `?_limit=N&_offset=M` или вернёшься к этому в Phase 2.2.

## Testing

После реализации проверить через curl (см. `TESTING.md`).
