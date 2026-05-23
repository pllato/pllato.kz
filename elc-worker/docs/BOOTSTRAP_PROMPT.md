# Bootstrap Prompt для Claude Code

Скопируй и вставь это в первое сообщение Claude Code когда откроешь сессию в этом репо.

---

```
Продолжаем ELC CRM миграцию на Cloudflare D1+Worker. Phase 0 завершена (D1 база
заполнена, worker отвечает на /health). Сейчас Phase 2.1: реализовать
RTDB-proxy endpoint в worker.js и запатчить team.html.

ВАЖНО: Прочитай документы в `elc-worker/docs/` ПЕРЕД тем как писать код:

1. `elc-worker/docs/HANDOFF.md` — общий контекст и стартовая точка
2. `elc-worker/docs/RTDB_PROXY_SPEC.md` — полная спецификация endpoint'а
3. `elc-worker/docs/SCHEMA_MAPPING.md` — маппинг колонок snake_case↔camelCase
4. `elc-worker/docs/RTDB_PATHS_INVENTORY.md` — все пути которые надо поддержать
5. `elc-worker/docs/TEAM_HTML_PATCHES.md` — точные правки в team.html
6. `elc-worker/docs/TESTING.md` — curl-команды для проверки

Workflow:
- Все объяснения на РУССКОМ языке
- Сделай работу в feature branch `feat/elc-rtdb-proxy`
- Реализуй endpoint в worker.js (расширяй существующий файл, не переписывай)
- Сделай apply.py для патчей team.html (анкоры в TEAM_HTML_PATCHES.md уже выверены)
- Деплой через `wrangler deploy` из папки elc-worker/
- Тестируй curl-командами из TESTING.md ПОСЛЕ КАЖДОГО deploy
- Когда всё работает — git commit, push, открой PR

Используй мою привычку — apply.py-стиль паков для team.html. Для worker.js
можно править файл напрямую.

Текущее состояние:
- ~/Desktop/Cloude/pllato.kz/ — это git repo (main branch)
- ~/Desktop/Cloude/pllato.kz/elc-worker/ — worker code (worker.js, schema.sql,
  wrangler.toml, package.json уже есть и работают)
- ~/Desktop/Cloude/pllato.kz/team.html — frontend (8115 строк)
- wrangler авторизован, npm установлен
- D1 база pllato-elc-d1 заполнена, worker pllato-elc-worker задеплоен
- Health endpoint работает: curl https://pllato-elc-worker.uurraa.workers.dev/health

Начни с чтения HANDOFF.md.
```

---

## Что Claude Code должен сделать после bootstrap

1. **Прочитать все 6 документов** в порядке указанном выше
2. **Найти и прочитать worker.js** чтобы понять текущую структуру
3. **Создать feature branch** `git checkout -b feat/elc-rtdb-proxy`
4. **Расширить worker.js** с rtdb-proxy endpoint (одна большая функция или модуль)
5. **Deploy** через `wrangler deploy`
6. **Прогнать тесты** из TESTING.md
7. **Создать apply.py** для team.html и применить
8. **Локально посмотреть** что patch чистый: `git diff team.html | head -100`
9. **Commit + push**
10. **Открыть PR** через web UI или через `gh pr create`

## Stop conditions (когда Claude Code должен спросить пользователя)

- Если SELECT с большой коллекции (contacts.json) превышает лимиты D1 — не угадывай как paginate, спроси какой подход взять
- Если что-то ломается в team.html так что не запускается — спроси прежде чем хакать
- Если найдёшь логическую неясность в маппинге полей — спроси (например, поле в БД отсутствует но frontend его ждёт)
- Если PR упал на каком-то check'е — не пытайся обойти, разберись и доложи

## Что делать после PR merge

1. Сразу сходить на `https://pllato.kz/team.html` (incognito) и проверить что CRM открывается
2. Заглянуть во все 5 разделов (Главная, Контакты, Сделки, Задачи, Сотрудники, Чаты)
3. Если что-то ломается — fix pack, не повторно delete/recreate

После успешного Phase 2.1 — следующий шаг Phase 3 (Write API), но это отдельный handoff.
