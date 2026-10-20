// ================= ⭐ SERVICE WORKER ສຳລັບ PWA & PHONE PUSH NOTIFICATIONS =================
const CACHE_NAME = 'online-team-v3';

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

// ⭐ ຮັບສັນຍານ Background Web Push ຈາກ Server (ເວລາປິດແອັບຢູ່)
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

// ⭐ ເມື່ອ User ແຕະໃສ່ແຈ້ງເຕືອນຢູ່ໜ້າຈໍໂທລະສັບ ໃຫ້ເປີດແອັບຂຶ້ນມາທັນທີ
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
