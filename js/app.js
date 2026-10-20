// ================= SERVICE WORKER ສຳລັບ PWA & PHONE PUSH NOTIFICATIONS =================
const CACHE_NAME = 'online-team-v4';

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
    // ຂ້າມການດັກຈັບ Request ທີ່ບໍ່ແມ່ນ GET ຫຼື ເປັນ External CDN/Supabase ເພື່ອບໍ່ໃຫ້ເກີດ Response Error
    if (event.request.method !== 'GET') return;
    var url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request).catch(function() {
            return caches.match(event.request).then(function(cachedRes) {
                return cachedRes || new Response('Offline', { status: 503, statusText: 'Offline' });
            });
        })
    );
});

self.addEventListener('push', function(event) {
    var data = {
        title: 'Online Team - ແຈ້ງເຕືອນ',
        body: 'ມີລາຍການອັບເດດໃໝ່ໃນລະບົບປະຈຳການ',
        tag: 'ot-push-' + Date.now()
    };

    if (event.data) {
        try {
            var parsed = event.data.json();
            data.title = parsed.title || data.title;
            data.body = parsed.body || data.body;
            data.tag = parsed.tag || data.tag;
        } catch (e) {
            data.body = event.data.text();
        }
    }

    var options = {
        body: data.body,
        tag: data.tag,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        data: { url: './index.html' }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('./index.html');
        })
    );
});
