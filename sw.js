var CACHE_NAME = 'metis-v2';
var ASSETS = [
    '/metis-demo/',
    '/metis-demo/index.html',
    '/metis-demo/manifest.json',
    '/metis-demo/icons/icon-192x192.png',
    '/metis-demo/icons/icon-512x512.png'
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
        caches.keys().then(function(names) {
            return Promise.all(
                names.filter(function(name) { return name !== CACHE_NAME; })
                     .map(function(name) { return caches.delete(name); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(e) {
    var url = e.request.url;
    // Bypass external API calls
    if (url.includes('va.gov') || url.includes('epic.com') || url.includes('fhir') ||
        url.includes('cms.gov') || url.includes('bluebutton') || url.includes('oura')) {
        return;
    }
    // Network-first strategy
    e.respondWith(
        fetch(e.request).then(function(response) {
            if (response && response.status === 200) {
                var clone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(e.request, clone);
                });
            }
            return response;
        }).catch(function() {
            return caches.match(e.request);
        })
    );
});
