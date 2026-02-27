var CACHE_NAME = 'metis-v1';
var ASSETS = [
    '/MetisKS/',
    '/MetisKS/index.html',
    '/MetisKS/manifest.json'
];

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(e) {
    e.respondWith(
        caches.match(e.request).then(function(cached) {
            if (cached) return cached;
            return fetch(e.request).then(function(response) {
                if (response && response.status === 200) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(e.request, clone);
                    });
                }
                return response;
            }).catch(function() {
                return caches.match('/MetisKS/index.html');
            });
        })
    );
});

// Background sync for weekly analysis
self.addEventListener('sync', function(e) {
    if (e.tag === 'weekly-health-analysis') {
        e.waitUntil(
            self.clients.matchAll().then(function(clients) {
                clients.forEach(function(client) {
                    client.postMessage({ type: 'analysis-sync', status: 'started', timestamp: new Date().toISOString() });
                });
            })
        );
    }
});

// Push notification handler
self.addEventListener('push', function(e) {
    if (e.data) {
        var data = e.data.json();
        self.registration.showNotification(data.title || 'MÉTIS Health Alert', {
            body: data.body || 'New health insight available',
            icon: '/MetisKS/icon-192.png',
            badge: '/MetisKS/icon-192.png',
            tag: 'metis-health-' + Date.now()
        });
    }
});
