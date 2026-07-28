/* Web push service worker — shared pattern across product sites (t128). */
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: 'Update', body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Update', {
    body: d.body || '',
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: { url: d.url || '/' }
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.openWindow(url));
});
