# Интеграция skills.myelc.net → ELC CRM (API)

Документ для Макса (разработчик портала). Описывает, как портал шлёт отчёты
(оплаты, пропуски/опоздания, переносы, баланс, новые студенты и т.д.) в новую
CRM **вместо Bitrix**.

Идея: новая CRM воспроизводит старую модель Bitrix. Иерархия задач уже
перенесена 1:1 — родительская «Отчёты - skills портала» (ID 5486) → подзадачи‑
категории → под‑подзадачи по филиалам `[affiliate_id]` → посты в ленте задачи.
Поэтому со стороны портала меняется **только URL, формат тела и авторизация** —
бизнес‑логика `BitrixLoggerController` остаётся.

Главное упрощение: раньше было **два** вызова Bitrix
(`task.item.list` чтобы найти подзадачу филиала, потом `task.commentitem.add`
чтобы запостить). Теперь — **один** вызов: вы передаёте `parent` + `affiliate_id`,
поиск подзадачи CRM делает сама.

---

## База

```
Базовый URL:  https://pllato-elc-worker.uurraa.workers.dev
Авторизация:  токен (shared secret), выдаёт Платон.
              Шлите любым из способов:
                Authorization: Bearer <TOKEN>
                ?token=<TOKEN>
                x-skills-token: <TOKEN>
```

Токен — это аналог старого `BITRIX__API_KEY`. Firebase/OAuth не нужен.

---

## Эндпоинт: `POST /api/skills/report`

Дописывает пост в ленту подзадачи нужного филиала (аналог `task.commentitem.add`).

### Тело (JSON)

| Поле           | Тип     | Обяз. | Описание |
|----------------|---------|-------|----------|
| `parent`       | number/string | да*  | `bitrix_id` родительской задачи‑категории — **тот же номер, что вы кладёте в `PARENT_ID`** (см. `$permaTasksId`). Напр. `5494` для опозданий/пропусков. |
| `affiliate_id` | number/string | да*  | Номер филиала. Ищем подзадачу, в названии которой есть `[affiliate_id]` (напр. `[3]`). |
| `text`         | string  | да    | Текст поста — ровно то, что раньше слали в `FIELDS.POST_MESSAGE`. До 20000 символов. BB‑разметку (`[B]`, `[URL]`) можно оставить, но лучше присылать обычный текст/markdown. |
| `author`       | string  | нет   | Подпись автора. По умолчанию `SKILLS.myelc.net`. |
| `occurred_at`  | string  | нет   | ISO‑дата события (для сортировки в ленте). По умолчанию — сейчас. |
| `task_bitrix_id` | number/string | да* | **Альтернатива** `parent`+`affiliate_id`: запостить напрямую в подзадачу с этим `bitrix_id` (если он у вас уже известен). |

\* Нужно прислать **либо** `task_bitrix_id`, **либо** пару `parent` + `affiliate_id`.

### Пример

```bash
curl -X POST 'https://pllato-elc-worker.uurraa.workers.dev/api/skills/report' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "parent": 5494,
    "affiliate_id": 3,
    "text": "Имя: Иван Петров\nПропустил занятие 11.06 в 18:00\nТелефон: +7700...",
    "occurred_at": "2026-06-11T13:00:00Z"
  }'
```

### Ответ

```json
{ "ok": true, "taskId": "task_29261", "bitrixId": "29261", "commentKey": "skills_lx...", "commentsCount": 1842 }
```

### Коды ошибок

| Код | Когда |
|-----|-------|
| `401 invalid token` | неверный/отсутствует токен |
| `503 skills integration not configured` | на CRM ещё не задан секрет (до деплоя) |
| `400` | нет `text`, либо нет ни `task_bitrix_id`, ни пары `parent`+`affiliate_id` |
| `404 affiliate subtask not found` | под этим `parent` нет подзадачи с `[affiliate_id]` в названии |
| `404 task not found by task_bitrix_id` | нет задачи с таким `bitrix_id` |
| `413 text too long` | текст > 20000 символов |

---

## Соответствие `$permaTasksId` → `parent`

Шлите в `parent` тот же номер, что уже лежит в вашем `$permaTasksId` (он сохранён
в CRM как `bitrix_id` задачи). Менять ничего не нужно — просто передаёте число.

| Метод портала | `$permaTasksId` ключ | `parent` (bitrix_id) |
|---|---|---|
| Отчёты (корень) | — | `5486` |
| Результаты опросов | `poll` | `5488` |
| Завершающиеся абонементы | `subscription_expires` | `5490` |
| Опоздания/пропуски | `visiting_students` | `5494` |
| Активные студенты [график] | `chart.active_students_amount` | `5498` |
| Истёкшие подписки [график] | `chart.expired_subscription_amount` | `5506` |
| Доп. оплата | `subscription_surcharge` | `5650` |
| Новый студент | `student_created` | `25340` |
| Оплата абонемента | `subscription_payment_payed` | `25342` |
| Изменение баланса | `balance_changed` | `25344` |
| Запрос переноса | `reschedule_request` | `25382` |
| Очередь на Calls | `task_call_nofitication` | `36930` |
| Результаты тестов при найме | `myelc_test_result` | `37916` |
| Задания на проверку (staff) | `task_staff_nofitication` | `41390` |
| Affiliate accounts creds | `affiliate_accounts_creds` | `41769` |
| Отклонения в учётках | `deviations` | `42136` |
| Топ супервайзеров/рейтинги | `supervisor_ratings` | `45792` |
| Дни рождения студентов | `students_birthdays` | `59802` |

> Если для какого‑то метода вы раньше брали PARENT_ID не из этой карты, а из
> результата `task.item.list` — пришлите его как `task_bitrix_id` напрямую.

---

## Как меняется код на портале (пример)

Было (`BitrixLoggerController::eRescheduleRequest`):

```php
// 1) найти подзадачу филиала
$sub = self::sendRequest("task.item.list", [["TITLE"=>"asc"],
        ["PARENT_ID"=>self::$permaTasksId['reschedule_request'], "TITLE"=>"[".$affiliate_id."]"]]);
$id  = $sub['result'][0]['ID'];
// 2) запостить комментарий
self::sendRequest("task.commentitem.add", ["taskid"=>$id, "FIELDS"=>["POST_MESSAGE"=>$str]]);
```

Станет (один вызов в новую CRM):

```php
self::sendToCrm([
    "parent"       => self::$permaTasksId['reschedule_request'],  // 25382
    "affiliate_id" => $student->affiliate_id,
    "text"         => $str,
]);
// где sendToCrm() — curl POST на /api/skills/report с заголовком Authorization: Bearer <TOKEN>
```

Текст `$str` можно оставить как есть (включая `[URL]`/`[B]`), либо постепенно
перевести в обычный текст — CRM хранит его как комментарий ленты.

---

## Что нужно от Макса

1. **Список активных методов.** В `BitrixLoggerController` часть `e*`/`c*`
   закомментирована/отключена. Подтвердите, какие отчёты реально шлются сейчас —
   чтобы не тратить время на мёртвые.
2. **Обмен токеном.** Платон сгенерирует секрет на стороне CRM
   (`SKILLS_INGEST_SECRET`), передаст вам — пропишете его в `.env` портала
   (вместо `BITRIX__API_KEY`).
3. **Подтверждение по `parent`.** Сверьте таблицу выше со своими
   `$permaTasksId` (вдруг где‑то номер отличается).

---

## На будущее (по согласованию, не сейчас)

- `POST /api/skills/student/upsert` — заводить/обновлять студента как **контакт**
  в CRM (аналог `crm.contact.add/update`), связка по `skills_user_id`. Нужно,
  если хотим карточки студентов в CRM, а не только посты в задачах.
- Пакетный приём для кроновых сводок (`/api/skills/report/batch`), если объём
  большой.

---

### Технические заметки

- Идемпотентность: каждый вызов создаёт **новый** пост (как `commentitem.add`).
  Если портал ретраит — будет дубль. При желании добавим dedup по `external_id`.
- Лимитов жёстких нет, но без нужды не молотите параллельно тысячами — D1.
- Посты появляются в карточке задачи в разделе «Комментарии» (лента), там же,
  где видны старые перенесённые из Bitrix.
