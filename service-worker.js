// Service Worker para notificaciones push reales de Trackear Vuelos.
// Corre en segundo plano, incluso con la app cerrada — es lo que hace
// posible que llegue una notificación como la de cualquier app nativa.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Cuando llega una notificación push del servidor, la mostramos.
self.addEventListener('push', (event) => {
  let data = { title: 'Trackear Vuelos', body: 'Tienes una nueva alerta.' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    // Si por alguna razón no viene como JSON, usamos el texto plano.
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    data: { url: data.url || '/index.html' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Trackear Vuelos', options));
});

// Al tocar la notificación, abre (o enfoca) el buscador.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/index.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
