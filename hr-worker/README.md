# pllato-hr-worker

Серверный бэкенд HR-панели (`app/hr/admin.html`): хранение оценок кандидатов и
настроек для всей команды. Cloudflare Worker + D1, вход по Firebase (Google),
тот же проект `pllato-crm`, что и у CRM.

- Кандидатский тест (`app/hr/index.html`) сюда **не** обращается — он публичный
  и отдаёт код, который работодатель вставляет в панель.
- Доступ только у e-mail из `HR_ALLOWED_EMAILS` в `wrangler.toml` (+ владелец).

## Роуты (все требуют `Authorization: Bearer <firebase-id-token>`)

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/hr/health` | проверка (без авторизации) |
| GET | `/api/hr/candidates` | список всех кандидатов |
| GET | `/api/hr/candidate/:id` | один кандидат |
| PUT | `/api/hr/candidate/:id` | сохранить/обновить |
| DELETE | `/api/hr/candidate/:id` | удалить |
| GET | `/api/hr/settings` | настройки (веса, пороги, ключи SJT) |
| PUT | `/api/hr/settings` | сохранить настройки |

## Деплой (один раз)

Нужен доступ к Cloudflare-аккаунту Pllato (wrangler login или API-токен).

```bash
cd hr-worker
npm install

# 1. Создать базу и вписать её id в wrangler.toml (database_id):
npx wrangler d1 create pllato-hr-d1
#    → скопировать database_id из вывода в wrangler.toml

# 2. Применить схему к боевой базе:
npx wrangler d1 execute pllato-hr-d1 --remote --file=schema.sql

# 3. Развернуть воркер:
npx wrangler deploy
#    → воркер станет доступен на https://pllato-hr-worker.<subdomain>.workers.dev
```

Если workers.dev-поддомен не `uurraa`, поправьте константу `WORKER` в
`app/hr/admin.html` (строка с `const WORKER = ...`).

## Кто имеет доступ

Добавляйте e-mail сотрудников в `HR_ALLOWED_EMAILS` (через запятую) и
передеплойте (`npx wrangler deploy`). `uurraa@gmail.com` разрешён всегда.

## Локальная проверка (без деплоя)

```bash
npx wrangler d1 execute pllato-hr-d1 --local --file=schema.sql
npx wrangler dev --local
# health → 200, запросы без токена → 401
```
