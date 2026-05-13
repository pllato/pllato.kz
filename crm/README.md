# Pllato CRM

Мультитенантное ядро CRM для проектов Pllato. Vanilla HTML/CSS/JS на фронте, Cloudflare Worker для API, Firebase Realtime Database для данных, Cloudflare R2 для файлов.

## Текущее состояние — Этап 0 (скелет)

✅ Что работает:
- Каркас SPA: страница логина, левое меню, шапка, разделы-заглушки.
- DEMO-режим логина (любой email/пароль), пока Firebase не подключён.
- Cloudflare Worker с заглушкой `/api/health`.

⏳ Что дальше: контакты → сделки → задачи → лента/чаты → дашборд → интеграции.

## Стек

| Слой    | Технология                         | Где |
|---------|------------------------------------|-----|
| Фронт   | Vanilla HTML/CSS/JS, ES modules    | Cloudflare Pages |
| API     | Cloudflare Worker (JS, Module)     | workers.dev |
| База    | Firebase Realtime Database         | firebaseio.com |
| Файлы   | Cloudflare R2                      | подключим позже |
| Auth    | Firebase Auth (Email/Password)     | подключим позже |

## Структура

```
/
├── index.html              ← вход в SPA
├── styles.css              ← все стили
├── app.js                  ← вся клиентская логика
├── firebase.config.js      ← публичный конфиг Firebase (заполнить из консоли)
├── _headers                ← security-заголовки Cloudflare Pages
├── _redirects              ← SPA fallback для Cloudflare Pages
└── worker/
    ├── worker.js           ← Cloudflare Worker (API)
    └── wrangler.toml       ← конфиг Worker
```

## Деплой

### 1. Фронт — Cloudflare Pages

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Выбрать репозиторий `pllato/pllato-core-crm`, ветка `main`.
3. Framework preset = **None**. Build command = пусто. Output directory = `/` (корень).
4. Save and Deploy. Через ~30 сек открыть `https://pllato-core-crm.pages.dev`.

Каждый `git push origin main` будет автоматически передеплоивать фронт.

### 2. API — Cloudflare Worker

```bash
cd worker
~/.local/bin/wrangler deploy
```

После первого деплоя URL воркера будет вида `https://pllato-core-crm.<твой-cf-аккаунт>.workers.dev`.
Скопируй его в `firebase.config.js` → `window.PLLATO_API_BASE`.

### 3. Firebase (когда понадобится реальный логин)

1. https://console.firebase.google.com → **Add project** → `pllato-core-crm`.
2. **Build → Authentication → Get started → Sign-in method → Email/Password** → Enable.
3. **Build → Realtime Database → Create Database** (регион: europe-west1 или ближайший).
4. **Project settings (⚙) → General → Your apps → Web (</>)** → создать веб-приложение → скопировать `firebaseConfig`.
5. Вставить значения в `firebase.config.js`.
6. **Authentication → Settings → Authorized domains** → добавить `pllato-core-crm.pages.dev` (и свой кастомный домен, если будет).
7. Закоммитить и запушить `firebase.config.js` — фронт автоматически переключится с DEMO-режима в реальный.

### 4. Сервисный аккаунт для Worker

Чтобы Worker мог писать в Realtime Database от имени сервиса:

1. Firebase Console → **Project settings → Service accounts → Generate new private key** → скачать JSON.
2. `cd worker && ~/.local/bin/wrangler secret put FIREBASE_SERVICE_ACCOUNT` → вставить **содержимое JSON одной строкой**.
3. В Cloudflare Dashboard → Worker → Settings → Variables: установить `FIREBASE_PROJECT_ID` и `FIREBASE_RTDB_URL`.

## Локальная разработка

Фронт — просто открыть `index.html` локальным http-сервером (живёт без сборки):

```bash
cd ~/Desktop/Cloude/pllato-core-crm
python3 -m http.server 8080
# открыть http://localhost:8080
```

Worker:
```bash
cd worker && ~/.local/bin/wrangler dev
# http://localhost:8787/api/health
```

## Git workflow

Идентичность установлена per-repo: `pllato <59840270+pllato@users.noreply.github.com>`.

```bash
git add .
git commit -m "..."
git push origin main
```

Push в `main` → Cloudflare Pages автодеплоит фронт за ~30 сек.
