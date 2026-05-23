# RTDB Paths Inventory (team.html)

Полный список Firebase RTDB путей, которые использует frontend. Все паттерны типа `fetch(\`${dbUrl}/...\`)`.

## Уникальные пути (22 шт.)

| # | Path | Method | Контекст |
|---|---|---|---|
| 1 | `users.json` | GET | Список сотрудников (несколько мест) |
| 2 | `users/{uid}` | PUT (SDK) | Сохранение профиля при логине (closed in try/catch) |
| 3 | `contacts.json` | GET | Список контактов |
| 4 | `contacts/{id}.json` | GET | Карточка контакта, контакт сделки |
| 5 | `deals.json` | GET | Список сделок |
| 6 | `deals/{id}.json` | PATCH | Изменение stageId при drag-and-drop |
| 7 | `tasks.json` | GET | Список задач |
| 8 | `tasks/{id}.json` | GET, PATCH | Карточка задачи, изменение полей |
| 9 | `companies/{id}.json` | GET | Компания сделки |
| 10 | `pipelines/pipeline_3.json` | GET | Воронка (только pipeline_3) |
| 11 | `customFieldsSchema/deal.json` | GET | Схема кастомных полей сделок |
| 12 | `timeline/deal_{bitrixId}.json` | GET | Активности по сделке |
| 13 | `taskReadState/{uid}.json` | GET, PUT | Read state задач юзера |
| 14 | `taskReadState/{uid}/{taskKey}.json` | PUT | Mark task as read |
| 15 | `groupChats.json` | GET | Список чатов с сообщениями |
| 16 | `groupChats/{id}.json` | GET | Чат с сообщениями |
| 17 | `openlinesSessions.json` | GET (with orderBy, limitToLast) | Список openlines сессий |
| 18 | `openlinesSessions/{id}.json` | GET | Конкретная сессия с сообщениями |
| 19 | `referenceLists.json` | GET | (frontend запрашивает но в RTDB этого не было — вернуть `{}`) |
| 20 | `filesQueue/{id}.json` | GET | (служебка миграции — `null`) |
| 21 | `migrationState/{key}.json` | GET | (служебка миграции — `null`) |
| 22 | `migrationState/contacts.json` etc. | GET | (служебка) |

## Точные строки в team.html

Используй эти line numbers чтобы найти конкретное использование в коде и понять контекст:

```
1815: SDK update(ref(db, `users/${user.uid}`), profile)  ← PUT профиля при логине
1980-1982: migrationState/openlines, /groupChats, /files  ← background preload
2022: shallow=true ping endpoint
2112-2115: deals.json, pipelines/pipeline_3.json, customFieldsSchema/deal.json, users.json
2147-2150: те же 4 (другой блок renderDeals)
2616: PATCH deals/${dealKey}.json {stageId, bitrixDateModify}
2757: contacts/${deal.contactId}.json
2762: companies/${deal.companyId}.json
2766: timeline/deal_${deal.bitrixId}.json
3213: openlinesSessions/${sessionId}.json
3531, 3551: users.json
3587: referenceLists.json
3716, 3775: contacts.json
3904: contacts/${key}.json
4021: taskReadState/${uid}.json
4043: PATCH/PUT taskReadState/${uid}/${taskKey}.json
4067: PUT taskReadState/${uid}.json
4218, 4362: tasks.json
5241: PATCH tasks/${taskKey}.json
5263, 5295: tasks/${key}.json
5489, 5585: filesQueue/${id}.json
5885: groupChats.json
5934: groupChats/${chatId}.json
5987: openlinesSessions.json?orderBy="lastMessageAt"&limitToLast=200
6033: openlinesSessions/${sessionId}.json
6083: SDK onValue(ref(db, 'users'), ...)  ← realtime listener users
6468, 6775, 7059: migrationState/* (служебка)
```

## Грубая статистика чтения

В обычной сессии работы (без админских действий типа миграции) frontend запрашивает:
- `users.json` — каждый раз при заходе на "Сотрудники" + сразу при логине (для sidebar)
- `contacts.json` — при заходе на "Контакты" (143k записей → ~50MB JSON)
- `deals.json` — при заходе на "Сделки" + при заходе на "Главную" (22k → ~10MB)
- `tasks.json` — при заходе на "Задачи" (38k → ~20MB)
- `contacts/{id}.json`, `deals/{id}.json` etc — при открытии карточек
- `timeline/deal_X.json` — при открытии сделки
- `groupChats.json` — при заходе на "Чаты" (21 чат + 82k сообщений → ~40MB)

⚠️ Большие выборки могут не уложиться в D1 лимит (max rows per response). Если SELECT возвращает > N rows — D1 обрежет. Worker должен либо paginate (LIMIT/OFFSET в цикле и склейка), либо честно сказать клиенту "слишком много".

Для Phase 2.1 — сначала попробовать "одним SELECT с возможно большим LIMIT", если падает → fallback на paginate.

## Что НЕ используется (можно стабить null/{}/error)

Эти эндпоинты в коде есть, но в реальной работе read-only CRM их трогать не будут:
- `filesQueue/*` — служебная очередь миграции файлов
- `migrationState/*` — служебное состояние
- Все SDK calls которые мы закомментируем (line 1815, 6083)

Для них достаточно возвращать `null` или `{}` — frontend проверяет `.then(r => r.ok ? r.json() : null).catch(() => null)` и работает с null.
