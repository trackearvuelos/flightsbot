// Service Worker para notificaciones push reales de Trackear Vuelos.
// Corre en segundo plano, incluso con la app cerrada — es lo que hace
// posible que llegue una notificación como la de cualquier app nativa.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// IMPORTANTE: nunca "cacheamos" el sitio — cada vez que la app se abre
// (con internet disponible), buscamos la versión más reciente en el
// servidor en vez de usar una copia vieja guardada. Así, cuando
// agreguemos botones o cambios nuevos, cualquiera que abra la app
// instalada los ve de inmediato, sin tener que reinstalarla.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
    );
  }
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

// Al tocar la notificación, abre el link correspondiente. Si es un link
// de reserva externo (Aviasales), lo abre directo — si es de nuestra
// propia app, primero intenta enfocar una pestaña ya abierta.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/index.html';
  const isExternalLink = /^https?:\/\//.test(targetUrl) && !targetUrl.includes(self.location.hostname);

  event.waitUntil(
    (async () => {
      if (isExternalLink) {
        // Un link externo (ej. reservar en Aviasales) siempre se abre
        // directo, sin importar si la app ya está abierta en otra pestaña.
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
        return;
      }
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })()
  );
});
