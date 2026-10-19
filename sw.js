// Service Worker ສຳລັບ PWA
const CACHE_NAME = 'online-team-v1';

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
    // ດຶງຂໍ້ມູນ Network-First ເພື່ອໃຫ້ຂໍ້ມູນ Realtime ຈາກ Supabase ອັບເດດສົດສະເໝີ
    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request);
        })
    );
});
