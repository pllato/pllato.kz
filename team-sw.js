/* ELC CRM — service worker.
 *
 * Назначение: (1) установка PWA на домашний экран, (2) Web Push уведомления.
 *
 * Намеренно НЕ кэшируем team.html: это большой и часто меняющийся файл,
 * а офлайн-показ устаревшей версии CRM хуже, чем «нет сети». Поэтому fetch
 * работает как обычная сеть (passthrough) и не ломает остальной pllato.kz.
 * Пустой обработчик fetch всё же присутствует — это требование Chrome,
 * чтобы сайт считался устанавливаемым PWA.
 */
const SW_VERSION = 'elc-sw-v3';
const FORCE_REFRESH_BUILD = '2026-08-24.1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // подчистим старые кэши прежних версий, если когда-то появятся
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith('elc-') && k !== SW_VERSION).map((k) => caches.delete(k))
    );
    await self.clients.claim();
    // v1-страницы не умели реагировать на app-update и могли оставаться
    // открытыми неделями. На них Meta-лид редактировался как deal_null.
    // Один раз принудительно навигируем все открытые team.html на свежую
    // сборку. Параметр не меняет маршрут/хеш карточки и предотвращает цикл.
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      try {
        const url = new URL(client.url);
        if (url.pathname.endsWith('/team.html') && url.searchParams.get('app_build') !== FORCE_REFRESH_BUILD) {
          url.searchParams.set('app_build', FORCE_REFRESH_BUILD);
          await client.navigate(url.href);
        } else {
          client.postMessage({ type: 'app-update', version: SW_VERSION });
        }
      } catch (_) {}
    }
  })());
});

// Passthrough: ничего не перехватываем — браузер качает как обычно.
self.addEventListener('fetch', () => {});

// ── Web Push ──────────────────────────────────────────────────────────────
// Воркер шлёт зашифрованный JSON payload вида:
//   { title, body, url, tag, icon }
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; }
  catch (_) { d = { body: e.data ? e.data.text() : '' }; }

  const title = d.title || 'ELC CRM';
  const opts = {
    body: d.body || '',
    icon: d.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || '/team.html' },
    vibrate: [80, 40, 80],
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/team.html';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (c.url.includes('/team.html') && 'focus' in c) {
        try { c.postMessage({ type: 'notification-click', url }); } catch (_) {}
        return c.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
