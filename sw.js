
const CACHE_NAME = 'penjualan-catatan-titipan-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Simpan aset inti aplikasi saat service worker terpasang
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch((err) => {
      console.warn('Gagal cache aset inti:', err);
    })
  );
  self.skipWaiting();
});

// Bersihkan cache versi lama saat versi baru aktif
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Strategi cache-first dengan pembaruan latar belakang & fallback aman saat offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || caches.match('./index.html'));

      return cachedResponse || fetchPromise;
    })
  );
});
