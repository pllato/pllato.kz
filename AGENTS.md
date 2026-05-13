# AGENTS.md

Это указатель для AI-агентов (Claude Code, Cursor, Copilot Workspace, любой другой).

**Перед началом работы прочитай `docs/HANDOFF.md` — это твоё главное чтение.**

## Краткая шпаргалка (если HANDOFF уже прочитан)

- **Проект:** Pllato CRM — мультитенантное CRM-ядро для команды Pllato.
- **Стек:** vanilla HTML/CSS/JS (ES modules, без сборки), Firebase RTDB, Firebase Auth (Google), GitHub Pages, Cloudflare Workers (планируются).
- **Репо-пара:** `pllato/pllato-core-crm` (этот, источник кода CRM) + `pllato/pllato.kz` (production, хостит `/crm/` + хаб приложений `app.html` + `contact-center.html`).
- **Live:** `https://pllato.kz/crm/` и `https://pllato.kz/app.html`.
- **Pllato:** uurraa@gmail.com, отвечать по-русски, simply, через кнопки (`AskUserQuestion` или эквивалент).
- **Workflow:** ВСЕГДА через PR (`gh pr create` → `gh pr merge --merge --delete-branch`).
- **Sync репо:** изменения CRM сначала в `pllato-core-crm/`, потом копируются в `pllato.kz/crm/`.

## Документы в `docs/`

| Файл | Назначение |
|---|---|
| `HANDOFF.md` | Главный документ. Архитектура, репо, доступы, состояние, правила. **Читай первым.** |
| `ARCHITECTURE.md` | Детали потоков, Firebase-схема, communicate flow. |
| `CHANGELOG.md` | История ревизий. |
| `CREDENTIALS.md` | Где какие ключи и доступы (без самих секретов). |
| `BOOTSTRAP_PROMPT.md` | Готовый промт для запуска нового AI-агента. |

## Приоритетные таски на сейчас

См. секцию «Что НЕ сделано — приоритетные таски» в `docs/HANDOFF.md`.

Топ-3:
1. **Cloudflare Worker для Binotel** — деплой `worker/`, endpoints `/binotel/webhook` и `/binotel/call`.
2. **Переход хранилища с localStorage на Firebase RTDB** — переписать `app/store.js`, сохранить API.
3. **Связка Worker'а с UI** — заменить `alert()` в `app/communicate.js` на реальный fetch к Worker.

## Чего НЕ делать

- НЕ трогать `pllato.kz/team.html` без явного запроса (отдельное приложение для команды ELC).
- НЕ переписывать на TypeScript / на фреймворки.
- НЕ заводить новые зависимости (npm-пакеты) без обсуждения.
- НЕ коммитить секреты, `.wrangler/`, `firebase-service-account.json`.
- НЕ делать прямой push в `main` — только через PR.
- НЕ переспрашивать pllato в Auto mode — действуй.
