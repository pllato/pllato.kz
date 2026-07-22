# pllato-hr-worker

Полностью **отдельный** серверный бэкенд HR-панели найма (`app/hr/admin.html`):
своя база (Cloudflare D1 `pllato-hr-d1`), свой воркер, свой Firebase-проект для
входа. Никак не связан с CRM.

- Кандидатский тест (`app/hr/index.html`) сюда **не** обращается — он публичный,
  без входа, и отдаёт код, который работодатель вставляет в панель.
- Доступ к панели — только у сотрудников из таблицы `team` (+ владелец
  `HR_OWNER_EMAIL`). Владелец и админы заводят остальных **прямо в панели**
  (Настройки → Команда), без правки конфигов.

Пока не настроено — панель работает в **локальном режиме** (данные в браузере).

## Роуты (все требуют `Authorization: Bearer <firebase-id-token>`, кроме health)

| Метод | Путь | Кто | Назначение |
|---|---|---|---|
| GET | `/api/hr/health` | все | проверка (без авторизации) |
| GET | `/api/hr/me` | команда | кто я, админ ли |
| GET | `/api/hr/candidates` | команда | список кандидатов |
| GET/PUT/DELETE | `/api/hr/candidate/:id` | команда | кандидат |
| GET/PUT | `/api/hr/settings` | команда | настройки (веса, пороги, ключи SJT) |
| GET | `/api/hr/team` | команда | список команды |
| POST | `/api/hr/team` | админ | добавить сотрудника |
| DELETE | `/api/hr/team/:email` | админ | убрать сотрудника |

## Настройка (один раз)

### A. Свой Firebase-проект (вход через Google)

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
   (например `pllato-hr`). Google Analytics можно отключить.
2. **Build → Authentication → Get started → Sign-in method → Google → включить**,
   выбрать support email, Save.
3. **Project settings (⚙️) → General → Your apps → Web (`</>`)** — зарегистрировать
   веб-приложение (`hr-panel`). Скопировать объект `firebaseConfig`.
4. Вписать значения в **`app/hr/hr-config.js`** (`apiKey`, `authDomain`,
   `projectId`, `appId`, `messagingSenderId`).
5. **Authentication → Settings → Authorized domains** — добавить домен, где живёт
   панель (`pllato.kz`; `localhost` уже есть для локальной проверки).

### B. Воркер и база (Cloudflare)

Нужен доступ к Cloudflare-аккаунту (wrangler login или API-токен).

```bash
cd hr-worker
npm install

# 1. Создать базу и вписать database_id в wrangler.toml:
npx wrangler d1 create pllato-hr-d1

# 2. Применить схему:
npx wrangler d1 execute pllato-hr-d1 --remote --file=schema.sql

# 3. В wrangler.toml выставить:
#    FIREBASE_PROJECT_ID = "<projectId из шага A, напр. pllato-hr>"
#    HR_OWNER_EMAIL      = "<ваш рабочий gmail>"

# 4. Развернуть:
npx wrangler deploy
#    → адрес вида https://pllato-hr-worker.<subdomain>.workers.dev
```

6. Скопировать адрес воркера в **`app/hr/hr-config.js`** → `workerUrl`.

Готово: откройте `admin.html`, войдите Google-аккаунтом владельца, затем
**Настройки → Команда** — добавьте сотрудников найма (участник или админ).

## Модель доступа

- `HR_OWNER_EMAIL` — владелец: разрешён всегда, всегда админ, удалить нельзя.
- Таблица `team` (в `pllato-hr-d1`): `email`, `name`, `role` (`admin`|`member`).
- `admin` — может добавлять/удалять сотрудников и менять настройки; `member` —
  работать с кандидатами.

## Локальная проверка (без деплоя)

```bash
npx wrangler d1 execute pllato-hr-d1 --local --file=schema.sql
npx wrangler dev --local
# health → 200, запросы без токена → 401
```

Панель без заполненного `hr-config.js` сама предложит локальный режим.
