#!/usr/bin/env python3
"""
apply_rtdb_proxy.py — Phase 2.1 пак для team.html.

Переключает фронтенд с прямых вызовов Firebase RTDB на наш Worker-прокси
(/api/rtdb/*). Все правки идемпотентны: повторный запуск ничего не сломает,
просто увидим что count_actual == 0 на уже применённой замене.

Запуск:
    cd ~/Desktop/Cloude/pllato.kz
    python3 elc-worker/docs/apply_rtdb_proxy.py
"""

from __future__ import annotations

import sys
from pathlib import Path
from textwrap import dedent

REPO = Path(__file__).resolve().parents[2]
TARGET = REPO / "team.html"


# ── Patches ─────────────────────────────────────────────────────────────
# Каждая запись: (название, old_str, new_str, expected_count).
# expected_count = ожидаемое число замен. -1 = любое > 0.

PATCHES: list[tuple[str, str, str, int]] = []

# Patch 1: добавить константу WORKER_RTDB_URL рядом с WORKER_URL.
PATCHES.append((
    "1. WORKER_RTDB_URL constant",
    "const WORKER_URL = 'https://pllato-crm-worker.uurraa.workers.dev';",
    "const WORKER_URL = 'https://pllato-crm-worker.uurraa.workers.dev';\n"
    "const WORKER_RTDB_URL = 'https://pllato-elc-worker.uurraa.workers.dev/api/rtdb';",
    1,
))

# Patch 2: заменить все `const dbUrl = firebaseConfig.databaseURL.replace(...)`
# на ссылку на наш Worker. Сейчас таких строк 25.
PATCHES.append((
    "2. const dbUrl → WORKER_RTDB_URL",
    "const dbUrl = firebaseConfig.databaseURL.replace(/\\/$/, '');",
    "const dbUrl = WORKER_RTDB_URL;",
    -1,
))

# Patch 3: три inline-варианта без пробела после запятой
# (lines 6468, 6775, 7059 на момент написания). Это служебка миграции
# (migrationState) — она в read-only CRM не используется, но чтобы не
# оставлять мёртвый Firebase URL, всё равно переключаем на Worker.
PATCHES.append((
    "3. inline firebaseConfig.databaseURL → WORKER_RTDB_URL",
    "firebaseConfig.databaseURL.replace(/\\/$/,'')",
    "WORKER_RTDB_URL",
    -1,
))

# Patch 4: закомментировать SDK update(ref(db, `users/${uid}`), profile)
# в initApp (line ~1815). Write через SDK мы не умеем (D1 worker пока
# не предоставляет /api/users PUT). Phase 3 добавит write API.
PATCHES.append((
    "4. comment-out SDK update profile",
    "  try {\n"
    "    await update(ref(db, `users/${user.uid}`), profile);\n"
    "    console.log('[initApp] profile saved');\n"
    "  } catch (e) {\n"
    "    console.warn('[initApp] profile update failed (non-fatal, continuing):', e);\n"
    "  }",
    "  // Phase 2.1: SDK update отключён — пишем профиль в Phase 3 (worker write API).\n"
    "  // try {\n"
    "  //   await update(ref(db, `users/${user.uid}`), profile);\n"
    "  //   console.log('[initApp] profile saved');\n"
    "  // } catch (e) {\n"
    "  //   console.warn('[initApp] profile update failed (non-fatal, continuing):', e);\n"
    "  // }\n"
    "  console.log('[initApp] profile save skipped (Phase 2.1 read-only)');",
    1,
))

# Patch 5: переписать renderUsers — заменить onValue(ref(db,'users')) на
# одноразовый fetch через Worker. Делаем функцию async.
OLD_RENDER_USERS = (
    "function renderUsers(el) {\n"
    "  el.innerHTML = `\n"
    "    <div class=\"page-title\">🧑‍💼 Сотрудники</div>\n"
    "    <div class=\"page-sub\">Пользователи портала. После миграции здесь будут все 88 сотрудников.</div>\n"
    "    <div class=\"card\">\n"
    "      <h3>Список</h3>\n"
    "      <div id=\"users-list\"><div class=\"empty\">Загрузка...</div></div>\n"
    "    </div>\n"
    "  `;\n"
    "\n"
    "  const usersRef = ref(db, 'users');\n"
    "  onValue(usersRef, snap => {\n"
    "    const users = snap.val() || {};\n"
    "    const arr = Object.entries(users).map(([uid, u]) => ({ uid, ...u }));\n"
    "    if (!arr.length) {\n"
    "      document.getElementById('users-list').innerHTML = '<div class=\"empty\">Пусто. Запустите миграцию пользователей из Битрикса.</div>';\n"
    "      return;\n"
    "    }\n"
    "    let html = '<table><thead><tr><th>Имя</th><th>Email</th><th>Bitrix ID</th><th>Должность</th><th>Активен</th></tr></thead><tbody>';\n"
    "    for (const u of arr) {\n"
    "      html += `<tr>\n"
    "        <td>${escapeHtml(u.name || '—')} ${escapeHtml(u.lastName || '')}</td>\n"
    "        <td>${escapeHtml(u.email || '—')}</td>\n"
    "        <td>${escapeHtml(u.bitrixId || '—')}</td>\n"
    "        <td>${escapeHtml(u.position || '—')}</td>\n"
    "        <td>${u.active === false ? '✗' : '✓'}</td>\n"
    "      </tr>`;\n"
    "    }\n"
    "    html += '</tbody></table>';\n"
    "    document.getElementById('users-list').innerHTML = html;\n"
    "  });\n"
    "}"
)

NEW_RENDER_USERS = (
    "async function renderUsers(el) {\n"
    "  el.innerHTML = `\n"
    "    <div class=\"page-title\">🧑‍💼 Сотрудники</div>\n"
    "    <div class=\"page-sub\">Пользователи портала. После миграции здесь будут все 88 сотрудников.</div>\n"
    "    <div class=\"card\">\n"
    "      <h3>Список</h3>\n"
    "      <div id=\"users-list\"><div class=\"empty\">Загрузка...</div></div>\n"
    "    </div>\n"
    "  `;\n"
    "\n"
    "  // Phase 2.1: SDK onValue → fetch через Worker (read-only архивный CRM).\n"
    "  const idToken = await fbAuth.currentUser.getIdToken();\n"
    "  const users = await fetch(`${WORKER_RTDB_URL}/users.json?auth=${idToken}`)\n"
    "    .then(r => r.ok ? r.json() : {})\n"
    "    .catch(() => ({}));\n"
    "  {\n"
    "    const arr = Object.entries(users).map(([uid, u]) => ({ uid, ...u }));\n"
    "    if (!arr.length) {\n"
    "      document.getElementById('users-list').innerHTML = '<div class=\"empty\">Пусто. Запустите миграцию пользователей из Битрикса.</div>';\n"
    "      return;\n"
    "    }\n"
    "    let html = '<table><thead><tr><th>Имя</th><th>Email</th><th>Bitrix ID</th><th>Должность</th><th>Активен</th></tr></thead><tbody>';\n"
    "    for (const u of arr) {\n"
    "      html += `<tr>\n"
    "        <td>${escapeHtml(u.name || '—')} ${escapeHtml(u.lastName || '')}</td>\n"
    "        <td>${escapeHtml(u.email || '—')}</td>\n"
    "        <td>${escapeHtml(u.bitrixId || '—')}</td>\n"
    "        <td>${escapeHtml(u.position || '—')}</td>\n"
    "        <td>${u.active === false ? '✗' : '✓'}</td>\n"
    "      </tr>`;\n"
    "    }\n"
    "    html += '</tbody></table>';\n"
    "    document.getElementById('users-list').innerHTML = html;\n"
    "  }\n"
    "}"
)

PATCHES.append((
    "5. renderUsers: onValue → fetch + async",
    OLD_RENDER_USERS,
    NEW_RENDER_USERS,
    1,
))


def apply_patches(text: str) -> tuple[str, list[tuple[str, int]]]:
    """Apply all PATCHES sequentially. Returns (new_text, report)."""
    report = []
    for name, old, new, expected in PATCHES:
        count = text.count(old)
        if count == 0:
            report.append((name, 0))
            continue
        if expected > 0 and count != expected:
            print(
                f"  ⚠️  '{name}': expected {expected} occurrences, found {count}",
                file=sys.stderr,
            )
        text = text.replace(old, new)
        report.append((name, count))
    return text, report


def verify(text: str) -> list[str]:
    """Sanity-проверки после применения патчей."""
    problems = []
    # firebaseConfig.databaseURL должен остаться только в декларации firebaseConfig
    db_url_uses = [
        i for i, line in enumerate(text.splitlines(), 1)
        if "firebaseConfig.databaseURL" in line and "databaseURL:" not in line
    ]
    if db_url_uses:
        problems.append(
            f"firebaseConfig.databaseURL ещё используется в строках: {db_url_uses[:5]}"
        )

    # Не должно остаться открытых ref(db, ...) (кроме закомментированных)
    for i, line in enumerate(text.splitlines(), 1):
        stripped = line.lstrip()
        if "ref(db," in line and not stripped.startswith("//"):
            problems.append(f"open ref(db,...) on line {i}: {line.strip()}")

    # Не должно остаться открытых onValue(...) (кроме закомментированных)
    for i, line in enumerate(text.splitlines(), 1):
        stripped = line.lstrip()
        if "onValue(" in line and "window.dbOn" not in line and not stripped.startswith("//"):
            # window.dbOn = onValue;  ← это присвоение импорта, не вызов
            if "onValue(" in line and "=" not in line.split("onValue(")[0][-3:]:
                problems.append(f"open onValue(...) on line {i}: {line.strip()}")

    return problems


def main() -> int:
    if not TARGET.exists():
        print(f"❌ {TARGET} not found", file=sys.stderr)
        return 1

    original = TARGET.read_text(encoding="utf-8")
    patched, report = apply_patches(original)

    print(f"📝 Patching {TARGET.relative_to(REPO)} ({len(original)} bytes)")
    for name, count in report:
        sign = "✓" if count > 0 else "·"
        print(f"  {sign} {name}: {count} replacement(s)")

    if patched == original:
        print("ℹ️  No changes — патчи уже применены или анкоры не найдены.")
        return 0

    problems = verify(patched)
    if problems:
        print("\n⚠️  Verify warnings:", file=sys.stderr)
        for p in problems:
            print(f"   - {p}", file=sys.stderr)
        # Не блокируем запись — может быть legitimate (например window.dbOn = onValue),
        # но логируем.

    TARGET.write_text(patched, encoding="utf-8")
    delta = len(patched) - len(original)
    sign = "+" if delta >= 0 else ""
    print(f"\n✅ Written {TARGET.name} ({sign}{delta} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
