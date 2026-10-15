// Service Worker cho Nam PHONE PWA
const CACHE_NAME = 'nam-phone-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Chỉ fetch thông thường qua network để đảm bảo game nhiều người chơi luôn cập nhật mới nhất
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
