# Pllato Meet — сигналинг-воркер

Cloudflare Worker + Durable Object для видеовстреч (`/meet.html`).
Видео/звук идут напрямую между участниками (WebRTC P2P) — воркер только
сводит людей, держит зал ожидания и пересылает сигналы. Никакого Firebase.

## Что внутри
- `worker.js` — воркер + Durable Object `MeetRoom` (одна комната = один объект).
  WebSocket Hibernation API → почти бесплатно даже при простое.
- `wrangler.toml` — конфиг (account_id уже прописан, как у других воркеров репо).

## Деплой (один раз)
```bash
cd meet-worker
wrangler deploy
```
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
