# Pllato CRM — Handoff

Обзорный документ для AI-агента / Claude Code / нового разработчика.

## Что это за проект

**Pllato CRM** — мультитенантное CRM-ядро для Pllato. Один код, два frontend-домена:

| Домен | Назначение | Кому |
|---|---|---|
| `pllato.kz/crm/` | Внутренний CRM команды Pllato | Сотрудники Pllato |
| `crm.aminamed.kz` | White-label CRM для клиента Aminamed | Карлыгаш и команда Aminamed |

Различия минимальные:
- Google Sign-In скрыт на aminamed-доменах (только email/password)
- В app.html (лаунчер на pllato.kz) карточки приложений отличаются

Backend (worker + D1) **общий** для обоих доменов.

## Стек

| Слой | Что |
|---|---|
| Frontend | Vanilla HTML/CSS/JS, ES modules, без сборки |
| Auth | JWT (email/password) + Google OAuth (только pllato.kz) |
| Storage | localStorage (UI state) + Cloudflare D1 (canonical) |
| Worker | `pllato-comm` (3800+ строк, монолит) |
| DB | D1 `pllato-crm-d1` |
| Integrations | Binotel (звонки), Green-API (WA), SMTP |
| Frontend hosting | CF Pages `aminamed-crm` (для crm.aminamed.kz) + GitHub Pages (для pllato.kz) |
| Sync | GitHub Action `sync-to-prod.yml` копирует main → `pllato/pllato.kz/crm/` |

## Архитектура (упрощённо)

```
   pllato-core-crm/main
          │
          ├─→ CF Pages: aminamed-crm.pages.dev → crm.aminamed.kz
          │
          └─→ sync-to-prod.yml → pllato/pllato.kz repo → pllato.kz/crm/

   Любой фронтенд ─→ worker pllato-comm.<account>.workers.dev
                          │
                          └─→ D1 pllato-crm-d1
```

## Что читать дальше

1. `CLAUDE.md` — entry point для Claude Code (содержит критичные gotchas)
2. `STATE.md` — что сейчас в работе
3. `ARCHITECTURE.md` — детали приложения и схема БД
4. `WORKFLOW.md` — обязательные чек-листы ветки/PR/merge
5. `DECISIONS.md` — ADR
6. `ROADMAP.md` — план на 2-24 недели
7. `STYLE_GUIDE.md` — стиль кода
8. `CREDENTIALS.md` — где доступы
9. `CHANGELOG.md` — история ревизий
10. `docs/specs/` — активные task-specs

## Контакты

- Владелец: pllato (`uurraa@gmail.com`, GitHub `pllato`)
- Repos:
  - `https://github.com/pllato/pllato-core-crm` (главный)
  - `https://github.com/pllato/pllato.kz` (deploy target + лаунчер + ELC team.html)
- CF account: `Uurraa@gmail.com's Account` (id `d0655e161d8fca8487f88d55c0eeb215`)
- Worker: `pllato-comm`, D1: `pllato-crm-d1`

## Правила работы

- Все ответы pllato — по-русски.
- Только через PR: ветка → commit → push → merge --no-ff в main.
- Прямой push в main допустим только для merge или для retrigger CF Pages (empty commit).
- Не коммить секреты, `.env`, токены, service accounts.
- Перед стартом задачи — проверь `STATE.md` и `git log` чтобы не дублировать другую сессию.
- При неоднозначном решении или конфликте — спросить pllato и зафиксировать в `STATE.md`.

## Quick reference

```bash
# Старт задачи
git fetch origin && git pull --rebase origin main
git checkout -b feat/<short-name>

# Деплой worker
cd worker && npx --yes wrangler deploy

# Проверить актуальность кода на проде
curl -s "https://crm.aminamed.kz/app/views/<file>.js?v=$(date +%s)" | grep -c "<marker>"

# Retrigger CF Pages если build залип
git commit --allow-empty -m "chore: retrigger deploy" && git push origin main
```
