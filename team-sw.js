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
const SW_VERSION = 'elc-sw-v1';

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
