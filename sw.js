// ================= SERVICE WORKER ສຳລັບ PWA & BACKGROUND LOCK-SCREEN PUSH =================
const CACHE_NAME = 'online-team-v5';

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
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

// ⭐ 1. ຮັບສັນຍານຈາກ OS Push Server (Apple APNs / Google FCM) ຕອນປິດແອັບ & ປິດຈໍມືຖືสนิท
self.addEventListener('push', function(event) {
    var data = {
        title: 'Online Team - ແຈ້ງເຕືອນດ່ວນ',
        body: 'ມີລາຍການແຈ້ງເຕືອນໃໝ່ໃນລະບົບປະຈຳການ',
        tag: 'ot-push-' + Date.now()
    };

    if (event.data) {
        try {
            var parsed = event.data.json();
            data.title = parsed.title || data.title;
            data.body = parsed.body || parsed.message || data.body;
            data.tag = parsed.tag || data.tag;
        } catch (e) {
            data.body = event.data.text();
        }
    }

    var notifIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='110' fill='%23c01e2e'/%3E%3Cpath d='M256 96c-88.37 0-160 71.63-160 160v64c0 35.35 28.65 64 64 64h16V256h-48v-16c0-70.69 57.31-128 128-128s128 57.31 128 128v16h-48v128h32c8.84 0 16 7.16 16 16v16c0 8.84-7.16 16-16 16h-80v32h80c26.51 0 48-21.49 48-48v-18.72C434.59 385.19 448 366.09 448 344v-88c0-88.37-71.63-160-160-160z' fill='%23ffffff'/%3E%3C/svg%3E";

    var options = {
        body: data.body,
        tag: data.tag,
        icon: notifIcon,
        badge: notifIcon,
        renotify: true,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 400],
        data: { url: './index.html' }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ⭐ 2. ຮັບຄຳສັ່ງໂດຍກົງຈາກໜ້າເວັບຜ່ານ postMessage ເພື່ອໃຫ້ Service Worker ເປັນຄົນປຸກຈໍມືຖືສະເໝີ
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SHOW_OS_NOTIFICATION') {
        var p = event.data.payload || {};
        var notifIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='110' fill='%23c01e2e'/%3E%3Cpath d='M256 96c-88.37 0-160 71.63-160 160v64c0 35.35 28.65 64 64 64h16V256h-48v-16c0-70.69 57.31-128 128-128s128 57.31 128 128v16h-48v128h32c8.84 0 16 7.16 16 16v16c0 8.84-7.16 16-16 16h-80v32h80c26.51 0 48-21.49 48-48v-18.72C434.59 385.19 448 366.09 448 344v-88c0-88.37-71.63-160-160-160z' fill='%23ffffff'/%3E%3C/svg%3E";
        event.waitUntil(
            self.registration.showNotification(p.title || 'Online Team', {
                body: p.body || '',
                tag: p.tag || ('sw-msg-' + Date.now()),
                icon: notifIcon,
                badge: notifIcon,
                renotify: true,
                requireInteraction: true,
                vibrate: [300, 100, 300, 100, 400]
            })
        );
    }
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
