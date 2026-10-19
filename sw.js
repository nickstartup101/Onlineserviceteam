// Service Worker ສຳລັບ PWA (Online Team)
const CACHE_NAME = 'online-team-v2';

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request);
        })
    );
});
