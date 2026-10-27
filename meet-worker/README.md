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

## Надёжность записи (октябрь 2026)

- Организатор входит через `/login.html?next=%2Fmeet.html`; гости входят по ссылке без аккаунта.
- Сервер проверяет аккаунт владельца личной комнаты. Для новых разовых комнат аккаунт создателя также сохраняется, чтобы вернуть роль на другом устройстве.
- `meet-recording.js` сохраняет фрагменты видео и снимок чата/расшифровки в IndexedDB. Облачная загрузка использует одинаковые части по 5 MiB, повторяет ошибки и проверяет завершение видео и метаданных.
- Выход ожидает сохранения, затем открывает архив. При сбое остаётся на странице; повторный выход повторяет сохранение. После перезагрузки незавершённая локальная копия появляется в архиве с кнопками восстановления и скачивания.
- Для штатного завершения использовать «Выйти» и дождаться архива. Принудительное закрытие вкладки/браузера может потерять последний ещё не выданный MediaRecorder фрагмент. Удаление данных браузера удаляет несохранённые локальные копии.
- Расшифровка зависит от SpeechRecognition браузера и его внешнего сервиса; приложение сохраняет полученный текст, но не выполняет серверное распознавание аудио. В панели текста показан статус и доступен повторный запуск.
- Регрессии загрузки и роли: `node meet-worker/verify.mjs` (без зависимостей).

## CRM / app integration (2026-10-27)

New online calendar events and first meetings use Pllato Meet. Existing Zoom
meetings and archive remain accessible. The existing `/api/zoom` contract and
`zoom_meetings` / `zoom_files` tables are retained for compatibility; a
`crm-<uuid>` meeting ID identifies Pllato Meet. No Zoom API call is needed to
create or host new meetings. Guest invitation never contains host access.
The authorized CRM host-access endpoint returns a secret in the URL fragment;
Meet stores it locally and immediately removes the fragment. CRM room ownership
is checked against the server-issued key, never claimed by the first guest.

Meet binds the existing CRM D1 as `CRM_DB` and private R2 as `CRM_FILES`.
CRM recording owner is `crm`; upload authorization checks the issued host key
and active room. Public CRM archive reads/lists/deletes are rejected. Existing
CRM file routes enforce deal permissions and supply range playback.
Final metadata indexes the completed video, nonempty transcript, and chat JSON
against the SERVER's deal binding. Repeated saves use stable IDs. Failed uploads
remain in local IndexedDB and can be retried from Meet archive on the same
browser. Canceled meetings reject new joins/uploads.

Card UI in `app/pllato-crm.html` and `team.html` shares `app/zoom-crm.js`;
`app/deal-transcripts.js` and the app transcript task feed identify Pllato Meet.
App card refreshes materials on return to the window. Online task discriminator
`zoom_meeting` and `firstZoomAt` stay unchanged to preserve calendars/automation.

Transcription is browser SpeechRecognition, automatically started per participant;
this integration does NOT add server-side transcription or guarantee complete
text in unsupported/denied browsers. Metadata reports unavailable transcription.
Video is still recorded locally by the organizer, with multipart and local
recovery. Organizer should leave through «Выйти» and wait for saving.

Validation: `node --test elc-worker/zoom.test.mjs tests/deal-transcripts.test.mjs`
from repository root; four Meet Node suites; both Wrangler dry-run builds.
Tests cover private host access, first-guest takeover rejection, canceled rooms,
private media reads, exact deal binding, no publication before video exists,
idempotent indexing, absent transcript, legacy Zoom, and cross-deal denial.
Chromium mock API smoke verifies invitation, host action, WEBM player, transcript,
provider label and chat control. No invitations were sent during tests.
