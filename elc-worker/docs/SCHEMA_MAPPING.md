# Schema Mapping (D1 ↔ Frontend)

В D1 — snake_case. В frontend (team.html) — camelCase. Маппинг колонка-к-колонке для каждой таблицы.

**Универсальное правило** snake → camel: replace `_X` → `X.toUpperCase()`. Должно работать для всех колонок ниже. Этот документ — для верификации и для тех колонок где есть особенности.

## `users`

D1 колонки (`schema.sql`):
```
uid, email, name, last_name, position, photo, active,
bitrix_id, created_from_bitrix, department, binotel_line,
apps, last_login, provider, photo_url, migrated_at
```

camelCase для frontend:
```
uid, email, name, lastName, position, photo, active,
bitrixId, createdFromBitrix, department, binotelLine,
apps, lastLogin, provider, photoURL, migratedAt
```

⚠️ **Особенность**: `photoURL` (всё caps URL), а не `photoUrl`. Универсальное правило отработает правильно: `photo_url` → `photoURL` если использовать `.toUpperCase()` целиком после `_`. Проверь, или сделай явный override.

JSON-колонки (нужен JSON.parse при response): `department`, `apps`.

Key field: `uid` (это и есть Firebase Auth UID).

## `contacts`

D1:
```
id, name, second_name, last_name, position, honorific,
birthdate, comments, type, source_id, source_description,
lead_id, company_id, responsible_uid, created_by_uid,
modify_by_uid, opened, export, bitrix_id, bitrix_company_id,
bitrix_created_by_id, bitrix_responsible_id, bitrix_date_create,
bitrix_date_modify, emails, phones, messengers, websites,
custom_fields, migrated_at
```

camelCase:
```
id, name, secondName, lastName, position, honorific, birthdate,
comments, type, sourceId, sourceDescription, leadId, companyId,
responsibleUid, createdByUid, modifyByUid, opened, export,
bitrixId, bitrixCompanyId, bitrixCreatedById, bitrixResponsibleId,
bitrixDateCreate, bitrixDateModify, emails, phones, messengers,
websites, customFields, migratedAt
```

JSON-колонки: `emails`, `phones`, `messengers`, `websites`, `custom_fields`.

⚠️ В RTDB `emails`/`phones`/`messengers`/`websites` могли быть pseudo-arrays (`{0: ..., 1: ...}`). При миграции мы хранили их как JSON массив. Frontend может ожидать массив или dict. Если что-то ломается — конвертируй array обратно в dict с числовыми ключами при ответе.

Key field: `id` (например `contact_100`).

## `deals`

D1:
```
id, title, opportunity, currency, pipeline_id, stage_id, closed,
begin_date, close_date, comments, contact_id, company_id,
responsible_uid, created_by_uid, modify_by_uid, source_id,
source_description, bitrix_id, bitrix_category_id, bitrix_contact_id,
bitrix_company_id, bitrix_created_by_id, bitrix_responsible_id,
bitrix_date_create, bitrix_date_modify, custom_fields, migrated_at
```

camelCase: тот же паттерн (replace `_X` → `X`-upper).

JSON-колонки: `custom_fields`.

Key field: `id` (`deal_6060`).

## `tasks`

D1:
```
id, title, description, status, priority, deadline,
start_date_plan, end_date_plan, parent_id, group_id, stage_id,
responsible_uid, created_by_uid, changed_by_uid, task_control,
add_in_report, allow_change_deadline, time_estimate, time_spent,
mark, has_files, files_migrated, comments_count, comments_actual_count,
comments_migrated, comments_migration_failed, comments_migration_error,
bitrix_id, bitrix_parent_id, bitrix_created_by, bitrix_responsible_id,
bitrix_created_date, bitrix_closed_date, bitrix_changed_date,
bitrix_status_changed_date, accomplices, auditors, comments_data,
crm_links, bitrix_crm_links, bitrix_file_ids, migrated_at
```

JSON-колонки: `accomplices`, `auditors`, `comments_data`, `crm_links`, `bitrix_crm_links`, `bitrix_file_ids`.

⚠️ В RTDB `comments` (поле) хранило либо string либо dict. Мы при миграции:
- если был dict → положили в `comments_data` (TEXT/JSON)
- если был string → положили в `description` (?) или вообще опустили

При ответе frontend ожидает `comments` (camelCase). Если `comments_data` не пуст — отдать его как `comments`. Иначе — пустой dict `{}` (как было в RTDB).

Key field: `id` (`task_XXX`).

## `companies`

D1:
```
id, title, company_type, industry, employees, revenue, currency,
comments, opened, responsible_uid, created_by_uid, modify_by_uid,
bitrix_id, bitrix_created_by_id, bitrix_responsible_id,
bitrix_date_create, bitrix_date_modify, phones, migrated_at
```

JSON-колонки: `phones`.

Key field: `id` (`company_10`).

## `pipelines`

D1:
```
id, name, is_active, bitrix_category_id, stages, stages_count, migrated_at
```

camelCase: `id, name, isActive, bitrixCategoryId, stages, stagesCount, migratedAt`.

JSON-колонки: `stages` (это dict `{stageId: {name, sort, ...}}`).

Frontend запрашивает `pipelines/pipeline_3.json` — только этот один. Возвращай как single record.

## `group_chats`

D1:
```
id, title, avatar, color, member_count, message_count, last_message_text,
bitrix_date_create, bitrix_date_message, owner_bitrix_id, owner_firebase_uid,
migration_status, last_migrated_at, added_at
```

camelCase: `id, title, avatar, color, memberCount, messageCount, lastMessageText, bitrixDateCreate, bitrixDateMessage, ownerBitrixId, ownerFirebaseUid, migrationStatus, lastMigratedAt, addedAt`.

⚠️ При ответе **добавь nested `messages`** (dict из `chat_messages` таблицы, см. RTDB_PROXY_SPEC.md).

Key field: `id`.

## `chat_messages`

D1:
```
chat_id, id, bitrix_message_id, sender_id, sender_firebase_uid,
sender_name, text, date, raw_params
```

camelCase: `chatId, id, bitrixMessageId, senderId, senderFirebaseUid, senderName, text, date, rawParams`.

⚠️ Frontend сообщения видит как nested в group chat: `{messages: {msgId: {...}}}`. То есть `chatId` НЕ нужно отдавать обратно (это лишнее, и так понятно из родителя). Можно опустить.

JSON-колонки: `raw_params`.

## `timeline_activities`

D1:
```
id, owner_type, owner_id, activity_type, author_uid, bitrix_author_id,
bitrix_id, bitrix_created, bitrix_last_updated, payload, created_at
```

⚠️ **Важно**: `payload` колонка содержит весь оригинальный объект activity из RTDB как JSON. Плоские колонки (activity_type, author_uid, и т.д.) дублируют поля из payload для индексирования.

При ответе **отдай payload как есть** (JSON.parse), не нужно дублировать плоские поля:

```js
// SELECT * FROM timeline_activities WHERE owner_id = ?
// Для каждого row: result[row.id] = JSON.parse(row.payload);
```

JSON-колонки: `payload`.

## `openlines_sessions`

D1:
```
id, subject, provider, user_code, owner_type, owner_key, responsible_uid,
message_count, first_message_at, last_message_at, bitrix_session_id,
bitrix_chat_id, bitrix_activity_id, bitrix_owner_id, bitrix_owner_type,
bitrix_provider_type_id, bitrix_responsible_id, bitrix_created, users,
migrated_at
```

camelCase по правилу.

⚠️ При ответе `openlinesSessions/{id}.json` **добавь nested `messages`** из `openlines_messages` таблицы.

JSON-колонки: `users`.

## `openlines_messages`

D1:
```
session_id, id, payload
```

⚠️ Аналогично timeline: `payload` содержит весь message object. При ответе как nested в session — `result[id] = JSON.parse(payload)`.

## `custom_fields_schema`

D1:
```
entity_type, field_name, label, data_type, mandatory, multiple, sort, list
```

⚠️ **Особый формат ответа**: frontend запрашивает `customFieldsSchema/deal.json` и ожидает dict keyed by field_name:

```json
{
  "UF_CRM_1549583934187": {"label": "Учитель", "type": "enumeration", "mandatory": false, ...},
  "UF_CRM_1704485459305": {"label": "Уровень", "type": "string", ...},
  ...
}
```

SQL:
```sql
SELECT field_name, label, data_type AS type, mandatory, multiple, sort, list
FROM custom_fields_schema WHERE entity_type = ?
```

Затем в JS:
```js
const result = {};
for (const row of results) {
  result[row.field_name] = {
    label: row.label,
    type: row.type,            // <- БЫЛО data_type, переименуй обратно в type для frontend
    mandatory: row.mandatory,
    multiple: row.multiple,
    sort: row.sort,
    list: row.list ? JSON.parse(row.list) : null,
  };
}
```

JSON-колонки: `list`.

⚠️ Frontend поле — `type`, в БД — `data_type` (потому что `type` это SQL reserved keyword). Маппинг **не универсальный** — нужен явный override.

## `kv`

D1:
```
k, v
```

`v` всегда JSON. Используется для:
- `admin_emails/<email>` — флаги админов
- `migrationCache/...` — кеш миграции (служебка)
- `migrationState/...` — состояние миграции (служебка)
- `userMapping/...` — мэппинг bitrix → firebase
- `taskReadState/<uid>/<taskKey>` — read state задач

Для frontend:
- `taskReadState/{uid}.json` → собрать все строки с `k LIKE 'taskReadState/' || uid || '/%'`, вернуть dict
- `taskReadState/{uid}/{taskKey}.json` → одна строка
- Остальные kv можно не отдавать (frontend их не запрашивает)

## camelCase override table (для тех колонок где правило `_X → X-upper` не идеально)

| snake_case | camelCase | таблица |
|---|---|---|
| `photo_url` | `photoURL` | users (URL должен быть all-caps) |
| `data_type` | `type` | custom_fields_schema (переименование) |

Для остальных — универсальный алгоритм работает.
