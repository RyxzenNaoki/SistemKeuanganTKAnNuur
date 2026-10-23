/* Service worker notifikasi push SINAU (Firebase Cloud Messaging).
   Konfigurasi Firebase dikirim lewat parameter URL saat didaftarkan (lihat
   src/services/pushService.ts), jadi file ini tidak perlu diedit. */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const params = new URL(self.location.href).searchParams;

firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
});

const messaging = firebase.messaging();

// Pesan data-only dari server: tampilkan sebagai notifikasi sistem
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  self.registration.showNotification(data.title || 'SINAU', {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/favicon-48.png',
    tag: data.tag || undefined,
    data: { link: data.link || '/' },
  });
});

// Klik notifikasi: fokus ke tab SINAU yang sudah terbuka, atau buka halaman tujuan
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';
  const url = new URL(link, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
