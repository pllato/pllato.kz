# Текущее состояние · обновлено 2026-05-23

> Каждый агент перед началом задачи читает этот файл первым.
> После создания ветки — обновляет «В работе сейчас».
> При мердже PR — переносит запись в «Замержено за последние 7 дней».

## В работе сейчас

_(пусто)_

## Замержено за последние 7 дней

| Дата | Commit | Что |
|---|---|---|
| 2026-05-23 | `a51c54f` | feat(deals): кнопка «📞 Позвонить» в action-bar карточки сделки (Pack B, backlog #1) |
| 2026-05-23 | `1e7c5ea` | chore: retrigger CF Pages deploy (после flaky build) |
| 2026-05-23 | `c95d9fb` | feat(calls): inline audio player в строке Истории звонков |
| 2026-05-23 | `07e4f69` | feat(settings): кнопка 📞 для установки линии Binotel у любого сотрудника |
| 2026-05-23 | `af5554e` | feat(employee): поле "Линия Binotel" (хранение в localStorage) |
| 2026-05-23 | `e09bb32` | fix(calls_api): убрать double JSON.stringify в request() |
| 2026-05-23 | `f33707c` | fix(calls): добавлены методы binotelCall / binotelHistory / binotelRecording в CallsApi |
| 2026-05-23 | `80f0a3f` | fix(channels): убрать double JSON.stringify в saveChannel/deleteChannel |
| 2026-05-23 | `7d66858` | feat(settings): UI каналов связи в Настройки → Интеграции (Binotel + Green-API) |
| 2026-05-23 | `eae04ca` | feat(channels): API клиент saveChannel/deleteChannel/getChannelFull |
| 2026-05-23 | `b176133` | feat(settings): табы в Настройках (Профиль/Внешний вид/Команда/Поля сделок/Интеграции/О приложении) |
| 2026-05-22 | — | Восстановление team.html (ELC CRM) из коммита `5968356` после поломки в migration-02 |
| 2026-05-22 | — | Деплой aminamed-crm на CF Pages (crm.aminamed.kz), CORS-обновление в worker |
| 2026-05-22 | — | pllato.kz/app.html: рендеринг "Aminamed CRM" вместо "Pllato CRM", удалена карточка Склад |

## Заблокировано / ждёт ответа от pllato

_(пусто)_

## Backlog (приоритизированный)

1. **Green-API настройка**: UI готов (форма в Настройки → Интеграции). Нужны креды клиента + тест отправки сообщения через `/wa/send`.
2. **SMTP канал** (Pack 3): UI формы пока не делали.
3. **UTM Phase 3**: публичный `/api/lead` для лендинга aminamed.kz.
4. **Согласование заказа Stage 2**: FIFO списание из остатков (требует уточнения у клиента).
5. **Универсальная корзина**: soft delete с TTL 30 дней.
6. **Унификация login UI**: вынести `LOGIN_HTML` в общий модуль (сейчас дублирован в `auth_gate.js` и `views/login.js`).
7. **Передача `isAdmin` при set-password** (мелкий fix).
8. **Repsly интеграция** (ждёт API key от клиента).
9. **Проверить deprecated workers**: `pllato-crm-worker`, `pllato-cpb-worker` — удалить если не используются.

## Свободные spec-задачи

См. `docs/specs/`. Перед тем как взять — проверь `git log --oneline -10` чтобы не пересечься с недавним мерджем.

## Правила обновления

- Записи в «Замержено» старше 14 дней удаляются (история хранится в `CHANGELOG.md`).
- Если ждёшь ответа pllato — обязательно укажи дату запроса.
- Конфликт двух чатов на одной фиче не разруливать самому: оставить запись в «Заблокировано» и спросить pllato.
