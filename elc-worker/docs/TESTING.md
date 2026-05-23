# Testing — curl-команды для проверки

## Подготовка: достать idToken

Тебе понадобится валидный Firebase ID токен от какого-то пользователя ELC CRM. Способ:

1. Открой `https://pllato.kz/team.html` в Chrome
2. Залогинься через Google (если ещё не залогинен)
3. Открой DevTools → Console
4. Выполни:
   ```js
   firebase.auth().currentUser.getIdToken().then(t => console.log(t))
   // или
   fbAuth.currentUser.getIdToken().then(t => console.log(t))
   ```
5. Скопируй длинную строку (начинается с `eyJ...`)

Token живёт ~1 час, потом достанешь свежий.

Сохрани в переменную:
```bash
export TOKEN='eyJhbGc...весь_длинный_токен'
```

## Базовая проверка health (без auth)

```bash
curl https://pllato-elc-worker.uurraa.workers.dev/health
```
Ожидание:
```json
{"ok":true,"worker":"pllato-elc-worker","d1":{"binding":"DB","contacts":143751},"time":"..."}
```

## /api/me (с auth)

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://pllato-elc-worker.uurraa.workers.dev/api/me
```
Ожидание:
```json
{"ok":true,"uid":"...","email":"...","profile":{"uid":"...","email":"...","name":"...","lastName":"...","position":"...","active":true,"photo":"..."}}
```

## RTDB proxy: single record

```bash
# Один пользователь
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/users/rGNGGfbUxvhEiN72vonCtiWHbT82.json"
```
Ожидание:
```json
{"uid":"rGNGGfbUxvhEiN72vonCtiWHbT82","email":"uurraa@gmail.com","name":"...","lastName":"...",...}
```

Поля должны быть **camelCase** (lastName, bitrixId, NOT last_name, bitrix_id).

```bash
# Один контакт
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/contacts/contact_100.json"
```
Ожидание: объект с полями `name`, `lastName`, `phones` (массив или dict), `emails`, и т.д.

```bash
# Один deal с timeline
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/deals/deal_100.json"
```

```bash
# Timeline сделки (заметь — owner_id это deal_6060 для bitrixId 6060)
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/timeline/deal_6060.json"
```

```bash
# Pipelines
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/pipelines/pipeline_3.json"
```

## RTDB proxy: коллекции

```bash
# Все пользователи (86 records, должно быть быстро)
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/users.json" | head -c 500
```
Ожидание: dict `{uid_1: {...}, uid_2: {...}, ...}`, всего 86 ключей.

```bash
# Custom fields schema for deals (81 fields)
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/customFieldsSchema/deal.json" | head -c 1000
```
Ожидание: dict `{"UF_CRM_xxx": {"label":"...","type":"...","mandatory":...}, ...}`. Поле — `type`, не `dataType`.

```bash
# Group chats (21 чат + 82k сообщений — большой ответ)
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/groupChats.json" | wc -c
```
Ожидание: ~30-50 MB. Структура: `{chat_id: {title, ..., messages: {msg_id: {...}}}}`.

```bash
# Companies (20 records — маленькая, быстрая)
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/companies.json"
```

## RTDB proxy: большие коллекции (могут не уложиться сразу)

```bash
# Contacts — 143k записей. Может упасть если D1 limit или worker timeout
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/contacts.json" | wc -c
```

Если падает с ошибкой `Too many rows` или timeout — нужен paginate в worker (SELECT с LIMIT/OFFSET в цикле).

```bash
# Tasks — 38k
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/tasks.json" | wc -c
```

```bash
# Deals — 22k
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/deals.json" | wc -c
```

## RTDB proxy: query params

```bash
# Openlines с orderBy + limitToLast
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/openlinesSessions.json?orderBy=%22lastMessageAt%22&limitToLast=200"
```
Ожидание: dict с 200 записями, отсортированных по `last_message_at` ASC.

```bash
# Shallow=true
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/companies.json?shallow=true"
```
Ожидание: `{"company_10": true, "company_11": true, ...}` (только keys).

## RTDB proxy: PATCH (write)

```bash
# Изменить stage сделки
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stageId": "C3:WON", "bitrixDateModify": "2026-05-23T12:00:00.000Z"}' \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/deals/deal_100.json"
```
Ожидание: `{"ok":true}` или 200 без body.

Проверить что сохранилось:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/deals/deal_100.json" | jq .stageId
```

## RTDB proxy: edge cases

```bash
# Несуществующий id → null
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/contacts/nonexistent.json"
# Ожидание: null

# referenceLists (отсутствует) → {}
curl -H "Authorization: Bearer $TOKEN" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/referenceLists.json"
# Ожидание: {}

# Неавторизованный
curl "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/users.json"
# Ожидание: 401 {"error":"..."}

# Невалидный токен
curl -H "Authorization: Bearer invalid" \
  "https://pllato-elc-worker.uurraa.workers.dev/api/rtdb/users.json"
# Ожидание: 401
```

## После всего — проверка во фронте

После того как worker.js + apply.py отработали и были задеплоены:

1. Открыть `https://pllato.kz/team.html` в Chrome incognito (чтобы не было кеша)
2. DevTools → Network → фильтр на `pllato-elc-worker`
3. Залогиниться
4. Проверить что:
   - Sidebar заполнился (имя + email)
   - Главная показывает counts
   - Открываются разделы Контакты, Сделки, Задачи, Сотрудники, Чаты
   - В Network все запросы к `pllato-elc-worker.uurraa.workers.dev/api/rtdb/*` возвращают 200
   - В Console нет красных ошибок

Если что-то падает — Network вкладка покажет какой path/метод не работает.
