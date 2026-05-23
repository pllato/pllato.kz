# team.html Patches

Точные `old_str → new_str` замены для apply.py. Все anchor'ы проверены на уникальность в actual team.html (~8115 строк, на ветке `main` после Phase 0).

## Patch 1: добавить константу WORKER_RTDB_URL

**Find** (около line 1707):
```js
const WORKER_URL = 'https://pllato-crm-worker.uurraa.workers.dev';
```

**Replace with**:
```js
const WORKER_URL = 'https://pllato-crm-worker.uurraa.workers.dev';
const WORKER_RTDB_URL = 'https://pllato-elc-worker.uurraa.workers.dev/api/rtdb';
```

⚠️ Не трогай `WORKER_URL` — это другой worker (`pllato-comm` для Aminamed). Новый ELC worker — отдельный.

## Patch 2: заменить dbUrl в 10+ местах

**Find** (повторяется ~10 раз):
```js
const dbUrl = firebaseConfig.databaseURL.replace(/\/$/, '');
```

**Replace with**:
```js
const dbUrl = WORKER_RTDB_URL;
```

⚠️ Эта строка не уникальная — встречается несколько раз. apply.py должен:
- Либо делать `content.replace(old, new)` без `count=1` (заменит все вхождения сразу)
- Либо делать sed -i 's/.../.../g'
- Либо все 10+ замен обернуть в один цикл

Можно проще: `sed -i '' 's|const dbUrl = firebaseConfig\.databaseURL\.replace(/\\/\$/, '"'"''"'"');|const dbUrl = WORKER_RTDB_URL;|g' team.html`. Учти shell escaping.

## Patch 3: заменить inline firebaseConfig.databaseURL в 3 местах

**Find** (3 раза, разные строки):
```js
firebaseConfig.databaseURL.replace(/\/$/,'')
```
(без пробела после `,` — это вариант без пробела)

**Replace with**:
```js
WORKER_RTDB_URL
```

И ещё с пробелом — проверь обоими вариантами.

## Patch 4: закомментировать SDK update profile (line ~1815)

**Find**:
```js
  try {
    await update(ref(db, `users/${user.uid}`), profile);
    console.log('[initApp] profile saved');
  } catch (e) {
    console.warn('[initApp] profile update failed (non-fatal, continuing):', e);
  }
```

**Replace with**:
```js
  // SDK update отключён в Phase 2.1 (read-only). Профиль обновляется через worker write API (Phase 3).
  // try {
  //   await update(ref(db, `users/${user.uid}`), profile);
  //   console.log('[initApp] profile saved');
  // } catch (e) {
  //   console.warn('[initApp] profile update failed (non-fatal, continuing):', e);
  // }
  console.log('[initApp] profile save skipped (Phase 2.1 read-only)');
```

## Patch 5: заменить onValue users на одноразовый fetch (line ~6083)

**Find**:
```js
  const usersRef = ref(db, 'users');
  onValue(usersRef, snap => {
    const users = snap.val() || {};
```

**Replace with**:
```js
  // Phase 2.1: SDK onValue заменён на одноразовый fetch (no realtime needed in read-only CRM).
  const idToken = await fbAuth.currentUser.getIdToken();
  const users = await fetch(`${WORKER_RTDB_URL}/users.json?auth=${idToken}`)
    .then(r => r.ok ? r.json() : {})
    .catch(() => ({}));
  ((users) => {
```

И в конце функции (закрывающая `});` от onValue) → заменить на `})(users);`.

⚠️ Чтобы это работало — функция содержащая этот код должна быть `async`. Проверь определение функции (обычно `function renderEmployees(el) {...}` → надо `async function renderEmployees(el)`). Если она ещё не async — patch'и signature тоже.

**Alternative simpler version** — без IIFE wrapper:

**Find**:
```js
  const usersRef = ref(db, 'users');
  onValue(usersRef, snap => {
    const users = snap.val() || {};
    const arr = Object.entries(users).map(([uid, u]) => ({ uid, ...u }));
```

**Replace with**:
```js
  // Phase 2.1: SDK onValue → fetch (no realtime, archived CRM)
  const idToken = await fbAuth.currentUser.getIdToken();
  const users = await fetch(`${WORKER_RTDB_URL}/users.json?auth=${idToken}`)
    .then(r => r.ok ? r.json() : {})
    .catch(() => ({}));
  {
    const arr = Object.entries(users).map(([uid, u]) => ({ uid, ...u }));
```

И в конце (вместо `});` от onValue) → `}`.

Проверь что функция async, иначе await не сработает. Если нет — добавь `async`.

## Что **не** надо трогать

- `firebaseConfig` объект — нужен для Firebase Auth (logon через Google OAuth)
- `initializeApp`, `getAuth`, `getDatabase` импорты — Auth по-прежнему через Firebase
- Любые `auth.signInWithPopup`, `onAuthStateChanged` — Auth остаётся в Firebase
- `getIdToken()` — мы по-прежнему получаем Firebase ID токены, потому что worker их верифицирует

## Проверка после патчей

```bash
grep -n "firebaseConfig.databaseURL" team.html
# Должно остаться только в самом firebaseConfig declaration:
#   databaseURL: "https://pllato-crm-default-rtdb.firebaseio.com",

grep -n "const dbUrl" team.html
# Должно показать "const dbUrl = WORKER_RTDB_URL;" во всех местах

grep -n "ref(db," team.html
# Должно показать ТОЛЬКО закомментированные строки (или ничего)

grep -n "onValue\|onChildAdded" team.html
# Должно быть пусто (или комментарии)
```
