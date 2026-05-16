# Firebase RTDB Traffic Leak Investigation (May 2026)

Дата: 2026-05-16  
Репозиторий: `pllato/pllato.kz`  
Ветка расследования: `chore/firebase-traffic-investigation`

## 1. Контекст

В Firebase project `pllato-crm` за май 2026 зафиксирован download-трафик RTDB **17.39 GB** (при лимите Spark 10 GB).  
В `pllato-core-crm` realtime-подписок почти нет (разовые `get()`), поэтому расследование выполнено в `pllato.kz`.

## 2. Подготовка

- Рабочая копия создана как отдельный чистый `git worktree` от `origin/main`, чтобы не затронуть локальные незакоммиченные изменения в других worktree.
- Из-за уже занятой ветки `main` в другом worktree использован безопасный сценарий:
  - `fetch origin`
  - `switch --detach origin/main`
  - `switch -c chore/firebase-traffic-investigation`
- Проверка открытых PR через `gh pr list` недоступна локально (`gh: command not found`), использован fallback через GitHub REST API.

Открытые PR (по GitHub API на момент расследования):
- `#14` AI Worker: Исправь ai-tasks.html...
- `#13` AI Worker: Переделай /ai-tasks.html...
- `#12` AI Worker: Добавь простую форму обратной связи...

## 3. Сырые результаты сканов (обязательные команды)

### 3.1 Realtime подписки (RTDB)

Команда:

```bash
grep -rn --include="*.html" --include="*.js" --include="*.vue" \
  -E "onValue|\.on\(['\"]value['\"]|onChildAdded|onChildChanged|onChildRemoved" .
```

Вывод:

```text
./team.html:1693:  getDatabase, ref, get, set, onValue, off, push, update,
./team.html:1694:  onChildAdded, onChildChanged, onChildRemoved, query, orderByChild, limitToLast, startAt
./team.html:1720:window.dbOn = onValue;
./team.html:1724:window.dbOnChildAdded = onChildAdded;
./team.html:1725:window.dbOnChildChanged = onChildChanged;
./team.html:1726:window.dbOnChildRemoved = onChildRemoved;
./team.html:6070:  onValue(usersRef, snap => {
```

Важно: эта команда не поймала реальные вызовы `window.dbOnChildAdded/Changed/Removed(...)`, потому что alias записан как `dbOnChild...` (с заглавной `O` внутри слова).

### 3.2 Firestore подписки

Команда:

```bash
grep -rn --include="*.html" --include="*.js" --include="*.vue" \
  -E "onSnapshot" .
```

Вывод: пусто.

### 3.3 Все обращения к `ref()` по целевым узлам

Команда:

```bash
grep -rn --include="*.html" --include="*.js" --include="*.vue" \
  -E "ref\(.*db.*['\"]\/?(interviews|research|users|channels|admin_emails|deals|contacts|tasks|feed|chats|messages|calls)" .
```

Вывод:

```text
./team.html:6069:  const usersRef = ref(db, 'users');
./crm/app/channels.js:46:    const snap = await fb.dbm.get(fb.dbm.ref(fb.db, "channels"));
./crm/app.js:154:    const snap = await fb.dbm.get(fb.dbm.ref(fb.db, "users"));
./login.html:291:      get(ref(db, 'users')),
./app.html:756:    const snap = await get(ref(db, 'users'));
./app.html:773:        const newRef = push(ref(db, 'users'));
./app.html:891:    const snap = await get(ref(db, 'users'));
./app.html:942:    const snap = await get(ref(db, 'admin_emails'));
./app.html:954:    if (changed) await update(ref(db, 'admin_emails'), updates);
./app.html:1036:    const snap = await get(ref(db, 'users'));
./app.html:1124:        await update(ref(db, 'users/' + uid), { [flag]: val });
./app.html:1142:        await update(ref(db, 'users/' + uid + '/apps'), { [appId]: val });
./app.html:1163:        await update(ref(db, 'users/' + uid), { binotelLine: nextLine || null });
./app.html:1180:        await remove(ref(db, 'users/' + uid));
./app.html:1208:    const newRef = push(ref(db, 'users'));
```

### 3.4 Подписки на корень

Команда:

```bash
grep -rn --include="*.html" --include="*.js" --include="*.vue" \
  -E "ref\(\s*db\s*\)|ref\(db,\s*['\"]\/?['\"]?\)" .
```

Вывод: пусто.

## 4. Дополнительный скан (чтобы не пропустить alias-подписки)

Команда:

```bash
rg -n "\bdbOn\b|\bdbOff\b|dbOnChildAdded|dbOnChildChanged|dbOnChildRemoved|onValue\(|onChildAdded\(|onChildChanged\(|onChildRemoved\(" --glob '*.{html,js,vue}'
```

Вывод:

```text
team.html:1720:window.dbOn = onValue;
team.html:1721:window.dbOff = off;
team.html:1724:window.dbOnChildAdded = onChildAdded;
team.html:1725:window.dbOnChildChanged = onChildChanged;
team.html:1726:window.dbOnChildRemoved = onChildRemoved;
team.html:2182:  window.dbOnChildAdded(dealsRef, (snap) => {
team.html:2201:  window.dbOnChildChanged(dealsRef, (snap) => {
team.html:2216:  window.dbOnChildRemoved(dealsRef, (snap) => {
team.html:4379:  window.dbOnChildAdded(tasksRef, (snap) => {
team.html:4420:  window.dbOnChildChanged(tasksRef, (snap) => {
team.html:4445:  window.dbOnChildRemoved(tasksRef, (snap) => {
team.html:6070:  onValue(usersRef, snap => {
```

## 5. Найденные listeners (с оценкой риска)

| Подписка | Файл/строка | Путь | Query/лимиты | Где запускается | Риск |
|---|---|---|---|---|---|
| `onValue(usersRef, ...)` | `team.html:6070` | `/users` | Нет `query`, нет `limitTo*` | При открытии раздела Users (`navigate('users')`) | 🟡 |
| `dbOnChildAdded/Changed/Removed(dealsRef, ...)` | `team.html:2182`, `2201`, `2216` | `/deals` | Нет `query`, нет `limitTo*` | Автоматически после логина в `preloadInBackground()` (`team.html:1854-1859`) | 🔴 |
| `dbOnChildAdded/Changed/Removed(tasksRef, ...)` | `team.html:4379`, `4420`, `4445` | `/tasks` | Нет `query`, нет `limitTo*` | Автоматически после логина (+2 сек) в `preloadInBackground()` (`team.html:1862-1870`) | 🔴 |

Комментарий по риску:
- Для `child_added` Firebase отдаёт initial flush по каждому существующему ребёнку, то есть фактически полный проход по узлу при каждом новом подписчике.
- В коде есть комментарии о размере: `/tasks` ~30 MB, `/deals` ~3-5 MB.

## 6. Важное наблюдение вне realtime (тоже может быть major source download)

Хотя цель расследования — listeners, в `team.html` обнаружены тяжёлые полные чтения узлов через REST, которые тоже дают большой download даже без realtime:

| Чтение | Файл/строка | Триггер |
|---|---|---|
| `fetch(.../tasks.json)` | `team.html:4204`, `4348` | preload + background refresh |
| `fetch(.../deals.json)` | `team.html:2098`, `2133` | preload + background refresh |
| `fetch(.../contacts.json)` | `team.html:3702`, `3761` | preload (+5с) + background refresh |

Это не нарушает условие «утечка через listeners», но критично для общей картины download-трафика.

## 7. Команды для измерения размеров узлов (для ручного запуска pllato)

```bash
# 1. Список узлов первого уровня
curl -s 'https://pllato-crm-default-rtdb.firebaseio.com/.json?shallow=true' \
  | python3 -m json.tool

# 2. Размер каждого узла (повторить для всех корневых ключей)
for node in users channels channel_secrets admin_emails interviews research deals contacts tasks feed chats chat_messages calls messages; do
  size=$(curl -s "https://pllato-crm-default-rtdb.firebaseio.com/${node}.json" | wc -c)
  echo "${node}: ${size} bytes"
done
```

Если rules закрывают анонимный read:

```bash
# С токеном Firebase Auth
ID_TOKEN="..."   # взять из браузера: firebase.auth().currentUser.getIdToken()
curl -s "https://pllato-crm-default-rtdb.firebaseio.com/users.json?auth=${ID_TOKEN}" | wc -c
```

Или через Console:
- Realtime Database → Data → клик на узел → Export JSON → размер файла.

### Текущее состояние базы при проверке

Проверка `shallow=true` сейчас возвращает deactivated:

```json
{
  "error": "The Firebase database 'pllato-crm-default-rtdb' has been deactivated."
}
```

## 8. Шаблон таблицы размеров (заполнить после ручных замеров)

| Узел | Размер | Назначение | Принадлежность |
|---|---|---|---|
| /users | TBD | сотрудники | CRM + team |
| /channels | TBD | каналы связи | CRM + contact-center |
| /interviews | TBD | опросы | interviews-app |
| /research | TBD | исследования | research-app |
| /admin_emails | TBD | реестр админов | CRM |
| /deals | TBD | сделки | team + CRM legacy |
| /contacts | TBD | контакты | team + CRM legacy |
| /tasks | TBD | задачи | team + CRM legacy |
| /feed | TBD | лента | CRM |
| /chats | TBD | чаты | CRM |
| /chat_messages | TBD | сообщения чатов | CRM |
| /calls | TBD | звонки | CRM/call-center |
| /messages | TBD | сообщения | integrations |

## 9. Кандидаты на утечку

### Кандидат 1: realtime `/tasks` через `child_*` без query (автозапуск при каждом логине)

**Файл:** `team.html:4379`, `team.html:4420`, `team.html:4445`  
**Подписка:** `onChildAdded/onChildChanged/onChildRemoved(ref(db, '/tasks'))` (через alias `window.dbOnChild*`)  
**Размер узла:** в коде указано `~30 MB` / точный размер TBD  
**Триггер:** `preloadInBackground()` после логина, даже если пользователь не открывал страницу Tasks (`team.html:1862-1870`)  
**Оценка вклада:** **~45-65%** download-трафика (грубая оценка до замеров)  
**Почему виновен:** `child_added` делает initial flush по всем существующим задачам для каждого клиента; плюс в том же сценарии есть full `fetch('/tasks.json')` на preload/background.  

**Предлагаемый фикс:**
- вариант А: не поднимать realtime listener глобально; подключать только при входе в раздел Tasks.
- вариант Б: ограничить подписку query-диапазоном (например, по дате изменения + `limitToLast`).
- вариант В: для списка использовать только paginated REST/worker API, realtime оставить для одной активной записи.

**Риск фикса:** средний (затрагивает live-обновления задач и UX freshness).

### Кандидат 2: realtime `/deals` через `child_*` без query (автозапуск при каждом логине)

**Файл:** `team.html:2182`, `team.html:2201`, `team.html:2216`  
**Подписка:** `onChildAdded/onChildChanged/onChildRemoved(ref(db, '/deals'))` (через alias `window.dbOnChild*`)  
**Размер узла:** в коде указано `~3-5 MB` / точный размер TBD  
**Триггер:** `preloadInBackground()` после логина (`team.html:1854-1859`)  
**Оценка вклада:** **~15-30%** download-трафика (грубая оценка до замеров)  
**Почему виновен:** то же поведение initial flush на каждый клиент + параллельный full `fetch('/deals.json')`.

**Предлагаемый фикс:**
- вариант А: attach listener только при открытом разделе Deals.
- вариант Б: перейти на incremental pull (cursor по `bitrixDateModify`) вместо постоянного `child_*` на весь узел.
- вариант В: обязательный query-лимит + индексы (`indexOn`) под выбранный порядок.

**Риск фикса:** средний.

### Кандидат 3: `onValue('/users')` в разделе Users без ограничений

**Файл:** `team.html:6070`  
**Подписка:** `onValue(ref(db, '/users'))`  
**Размер узла:** ожидаемо меньше, чем deals/tasks, но TBD  
**Триггер:** открытие раздела Users (`navigate('users')`)  
**Оценка вклада:** **~3-10%** (если раздел открывается часто несколькими админами)  
**Почему может быть виновен:** `onValue` получает весь `/users` при каждом изменении в узле; подписка без query и без явного `off` при уходе со страницы.

**Предлагаемый фикс:**
- вариант А: заменить на разовый `get()` + ручной refresh.
- вариант Б: если realtime нужен, ограничить подписку жизненным циклом страницы и отписываться при `navigate`.

**Риск фикса:** низкий.

## 10. Firebase Profiler (обязательный следующий шаг перед фиксом)

Рекомендовано сделать профилирование в рабочее время команды:

1. Firebase Console → Realtime Database → **Profiler**.
2. Нажать **Start Profiling**.
3. Подождать 2-3 минуты при обычной активности (открыты `app.html`, `team.html`, CRM).
4. Сохранить `report.json` и приложить к задаче.

Что искать в отчёте:
- top paths по read/broadcast;
- пики по `/tasks`, `/deals`, `/contacts`, `/users`;
- операции realtime initial-load у `child_added`;
- неиндексированные запросы.

CLI-альтернатива:

```bash
firebase database:profile --raw --duration 180 --output profile-raw.json
```

## 11. Рекомендованный план

### Quick wins (1-2 часа)

1. Убрать глобальный автозапуск realtime listeners `/tasks` и `/deals` из `preloadInBackground()`; включать только в соответствующих разделах.
2. Для Users-страницы заменить `onValue('/users')` на `get('/users')` или сделать явный `off()` при уходе со страницы.
3. Включить временный feature-flag `TEAM_DISABLE_LIVE_LISTENERS` для быстрого rollback/rollout без массового риска.

Ожидаемый эффект: часто **>50%** снижения download при активной команде.

### Средний горизонт (1-2 дня)

1. Перевести `/tasks` и `/deals` на incremental/paginated чтение (worker API или RTDB query с курсором по дате изменения).
2. Добавить `indexOn` для ключей сортировки/фильтрации в RTDB rules.
3. Сократить full-node background refresh (`tasks.json`, `deals.json`, `contacts.json`) и перейти на дифф/батчи.

### Архитектурное

1. Если по Profiler подтверждается большой вклад `/interviews` или `/research`, выделить их в отдельный Firebase project (например, `pllato-research`) с отдельным бюджетом/лимитами.
2. Разделить billing blast-radius: CRM/команда отдельно, исследования отдельно.

## 12. TL;DR

Топ-подозреваемый в рамках realtime: `team.html` подписывает каждого залогиненного пользователя на `/tasks` и `/deals` (`onChild*` без query) сразу после логина, а не только при открытии соответствующих страниц. Это создаёт дорогой initial flush по крупным узлам и, в сочетании с full fetch этих же узлов, выглядит как ключевой источник лишнего download.
