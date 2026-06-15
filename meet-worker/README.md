# Pllato Meet — сигналинг-воркер

Cloudflare Worker + Durable Object для видеовстреч (`/meet.html`).
Видео/звук идут напрямую между участниками (WebRTC P2P) — воркер только
сводит людей, держит зал ожидания и пересылает сигналы. Никакого Firebase.

## Что внутри
- `worker.js` — воркер + Durable Object `MeetRoom` (одна комната = один объект).
  WebSocket Hibernation API → почти бесплатно даже при простое.
  Плюс архив встреч в R2 (`/archive/*`): записи `.webm` и транскрипты `.json`.
- `wrangler.toml` — конфиг (account_id уже прописан, как у других воркеров репо).

## Архив встреч (R2)
`deploy.sh` сам создаёт бакет `pllato-meet-archive` при первом запуске.
Если делаешь вручную: `wrangler r2 bucket create pllato-meet-archive`, затем deploy.
Эндпоинты: `PUT/GET /archive/rec/<owner>/<id>`, `PUT /archive/meta/...`,
`GET /archive/list/<owner>`, `DELETE /archive/<owner>/<id>`.

## Деплой
```bash
cd meet-worker
./deploy.sh        # или: WRANGLER_CONFIG= npx wrangler deploy --config ./wrangler.toml
```
⚠️ Флаг `--config ./wrangler.toml` обязателен: на машине Pllato рядом есть
перенаправляющий конфиг Cloudflare, из-за которого обычный `wrangler deploy`
деплоит чужой воркер (`loude`). Скрипт `deploy.sh` уже делает всё правильно.
Воркер появится по адресу:
```
https://pllato-meet.<твой-аккаунт>.workers.dev
```
У тебя аккаунт `uurraa`, поэтому ожидаемый адрес:
```
wss://pllato-meet.uurraa.workers.dev
```

Этот адрес уже прописан в `meet.html` (константа `MEET_WS`). Если Cloudflare
выдаст другой поддомен — поправь `MEET_WS` в начале `<script>` в `meet.html`.

## Проверка
```bash
curl https://pllato-meet.uurraa.workers.dev/health
# {"ok":true,"service":"pllato-meet",...}
```

## Стоимость
- Workers: бесплатный план — 100 000 запросов/день.
- Durable Objects (SQLite) — доступны на бесплатном плане.
- 5–10 встреч в день расходуют доли процента лимитов → фактически $0.

## Лимит размера встречи
Схема P2P (mesh): комфортно до ~4–6 участников. Для больших конференций
нужен SFU-сервер (платный) — это отдельная задача.
