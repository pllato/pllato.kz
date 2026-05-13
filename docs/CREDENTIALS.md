# Credentials & Доступы

Где какие ключи лежат и как с ними работать. **Сами секреты сюда не клади** — только пути и инструкции.

---

## 1. GitHub

- **Аккаунт:** `pllato` (uurraa@gmail.com, ID `59840270`)
- **CLI:** `gh` установлен в `~/.local/bin/gh`, авторизован через keychain.
- **Token scopes:** `repo`, `read:org`, `gist`.
- **Git identity per-repo:**
  ```
  user.name = pllato
  user.email = 59840270+pllato@users.noreply.github.com
  ```

---

## 2. Firebase

- **Project:** `pllato-crm`
- **Console:** https://console.firebase.google.com/project/pllato-crm/overview
- **Public config** (apiKey, authDomain, и т.д.) лежит **в коде**:
  - `pllato-core-crm/firebase.config.js`
  - `pllato.kz/crm/firebase.config.js`
  - `pllato.kz/app.html` (inline)
  - `pllato.kz/contact-center.html` (inline)
  - `pllato.kz/team.html` (inline)
  
  Это публичные ключи Firebase Web SDK — безопасны. Защита идёт через Auth + Security Rules.

- **Authorized domains** (Firebase Console → Authentication → Settings → Authorized domains):
  - `localhost`
  - `pllato.kz`
  - + Firebase defaults
  
  Если нужно добавить новый домен (например, новый поддомен или preview-URL) — pllato делает это в Console.

- **Security Rules:** `pllato.kz/firebase-rules.json` — готовый JSON. Вставляется в Firebase Console → Realtime Database → Rules → Publish.

- **Service account JSON** (для Cloudflare Worker, чтобы писать в RTDB от имени сервиса):
  - **НЕ создан пока.**
  - Когда понадобится: Firebase Console → Project Settings → Service Accounts → Generate new private key.
  - Скачать JSON.
  - Положить **локально** где-то вне репо (например, `~/firebase-service-account.json`).
  - В Worker задать через `wrangler secret put FIREBASE_SERVICE_ACCOUNT` (значение — содержимое JSON одной строкой).

---

## 3. Cloudflare

- **Аккаунт:** `Uurraa@gmail.com's Account`
- **Account ID:** `d0655e161d8fca8487f88d55c0eeb215`
- **API token** — у pllato локально: `~/.cloudflare-api-token` (53 байта).
- **Scopes у токена:** не задокументировано — нужно проверить через `wrangler whoami`. Для Worker деплоя должны быть как минимум `Workers Scripts:Edit` и `Account Settings:Read`.

Использование в командной строке:
```bash
export CLOUDFLARE_API_TOKEN=$(cat ~/.cloudflare-api-token)
~/.local/bin/wrangler whoami       # проверить
~/.local/bin/wrangler deploy       # из директории worker/
```

Если токен скомпрометирован — отозвать в [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens), создать новый, перезаписать файл:
```bash
pbpaste > ~/.cloudflare-api-token && chmod 600 ~/.cloudflare-api-token
```

---

## 4. Binotel (телефония)

- **Аккаунт:** у pllato.
- **API key + secret:** **ОЖИДАЕТСЯ от поддержки Binotel** (запрос отправлен).
- **Куда положить когда придут:**
  - В `pllato.kz/contact-center.html` (UI Контакт-центра) добавить канал типа Binotel.
  - Поля `api_key` → лежит в `/channels/{id}/config` (public, не критично).
  - Поле `api_secret` → автоматически записывается в `/channel_secrets/{id}` (защищено rules).
- **Worker:** будет читать креды из `/channel_secrets` через Firebase Admin SDK.

Чек-лист что запросить у поддержки Binotel:
1. Включить REST API на аккаунте.
2. API key + secret.
3. Список внутренних номеров сотрудников (innerNumber).
4. Включить запись разговоров.
5. Включить webhook callback URL (URL Worker'а — пришлём после деплоя).
6. Включить Click-to-Call API.
7. IP-whitelist (если есть фильтр) — добавить Cloudflare Workers диапазоны.
8. Список trunk-ов / городских номеров.
9. Формат external номера (с + или без).
10. Тестовый звонок после получения ключей.

---

## 5. Green-API (WhatsApp)

- **Не настроен.**
- При необходимости: [green-api.com](https://green-api.com) → кабинет → создать instance → получить `idInstance` + `apiTokenInstance`.
- Куда положить — аналогично Binotel: в Контакт-центр, тип `greenapi_wa`.

---

## 6. SMTP (email)

- **Не настроен.**
- Например, можно использовать Gmail-почту pllato или отдельный SMTP-сервис (SendGrid, Postmark).
- В Контакт-центре, тип `smtp`: host, port, user, password.

---

## 7. Instagram / Facebook

- **Не настроены.**
- Требуют создания приложения в Meta for Developers, Long-lived Access Token, верификации страницы.

---

## ⚠️ Правила безопасности

1. **Никогда** не публикуй секреты в чате / в issue / в коммите.
2. Перед коммитом проверяй `git diff --cached` — нет ли там случайно `.env`, `wrangler-account.json`, `firebase-service-account.json` и т.д.
3. В `.gitignore` оба репо уже добавлены:
   ```
   .wrangler/
   .dev.vars
   firebase-service-account.json
   *.serviceAccount.json
   .env
   CLAUDE.md (локальный, не должен попадать в репо)
   ```
4. Если случайно запушил секрет — НЕМЕДЛЕННО отзови его (Cloudflare/Firebase/etc), создай новый. Затем подумай, нужно ли удалить из git-истории (`git filter-repo` или `bfg-repo-cleaner`).
5. Если Pllato (или кто-то) пришлёт токен прямо в чат — попроси отозвать и пересоздать. Никогда не используй скомпрометированный токен.
