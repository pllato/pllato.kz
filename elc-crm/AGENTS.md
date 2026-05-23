# AGENTS.md

Указатель для AI-агентов (Claude Code, Cursor, Copilot Workspace и др.).

## Перед началом любой задачи (обязательный чек-лист)

1. `git fetch origin && git pull --rebase origin main`
2. Прочитать `docs/STATE.md` — что сейчас в работе у других чатов.
3. `gh pr list --state open` — что уже в ревью.
4. Если задача уже значится в `STATE.md` как «в работе» — не браться, спросить pllato.

Полный workflow: `docs/WORKFLOW.md`.

## Что читать

1. `docs/HANDOFF.md` — быстрый обзор проекта.
2. `docs/STATE.md` — актуальная координация.
3. `docs/WORKFLOW.md` — правила разработки и PR.
4. `docs/ARCHITECTURE.md` — технические детали.
5. `docs/specs/` — feature-specs.

## Базовые правила

- Отвечать pllato (`uurraa@gmail.com`) по-русски, просто и по делу.
- Работать только через PR (ветка -> push -> PR -> merge).
- Не коммитить секреты и локальные конфиги.
- Не трогать `pllato.kz/team.html` без явного запроса.
- Не переводить проект на TypeScript/фреймворки и не добавлять новые зависимости без согласования.
