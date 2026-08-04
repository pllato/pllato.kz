// Service worker — ТОЛЬКО пуш-уведомления.
// Намеренно НЕТ обработчика 'fetch' → SW не перехватывает запросы и не кэширует,
// значит на загрузку/работу приложения не влияет никак.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; }
  catch (e) { d = { title: 'CRM «Зубная аптека»', body: (event.data && event.data.text()) || '' }; }
  const title = d.title || 'CRM «Зубная аптека»';
  const options = {
    body: d.body || '',
    icon: d.icon || '/favicon.svg',
    badge: '/favicon.svg',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || '/' },
    vibrate: [90, 40, 90]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) {
        await c.focus();
        try { if (url && url !== '/' && c.navigate) await c.navigate(url); } catch (e) {}
        return;
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
