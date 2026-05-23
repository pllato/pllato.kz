# Pllato CRM

CRM на Vanilla JS с backend на Cloudflare Worker + D1.

## Стек

- Frontend: HTML/CSS/ES modules
- Auth: Google Identity Services + собственный JWT Worker
- API: Cloudflare Worker (`pllato-comm`)
- DB: Cloudflare D1 (`users`, `channels`, `channel_secrets`, `store`)

## Запуск локально

```bash
python3 -m http.server 8080
# http://localhost:8080
```

## Конфиг фронта

`app.config.js`:

```js
window.PLLATO_API_BASE = "https://pllato-comm.uurraa.workers.dev";
window.PLLATO_GOOGLE_CLIENT_ID = "";
```

## Worker setup (MIGRATION-01)

1. Создать D1:
```bash
cd worker
wrangler d1 create pllato-crm-d1
```

2. Обновить `worker/wrangler.toml` значением `database_id`.

3. Применить схему:
```bash
wrangler d1 execute pllato-crm-d1 --remote --file=schema.sql
```

4. Секреты:
```bash
wrangler secret put JWT_SECRET
wrangler secret put GOOGLE_CLIENT_ID
```

5. Deploy:
```bash
wrangler deploy
```

6. Добавить root super-admin:
```bash
wrangler d1 execute pllato-crm-d1 --remote --command="
INSERT INTO users (id, email, name, is_super_admin, apps, created_at, updated_at)
VALUES ('u_root', 'uurraa@gmail.com', 'pllato', 1,
        '{\"pllato_crm\":true,\"team_crm\":true}',
        unixepoch()*1000, unixepoch()*1000);
"
```

## Основные endpoints

- `GET /health`
- `POST /auth/google`
- `GET /me`
- `POST /store/pull`
- `POST /store/push`
- `GET /users/list`
- `POST /users/save`
- `POST /users/delete`
- `GET /channels/list`
- `GET /channels/secret/:id`
- `POST /channels/save`
- `POST /channels/delete`

## Проверка миграции

```bash
grep -R -n "firebase" app.js app index.html
```

Команда не должна находить `firebase` в runtime-коде фронта.
