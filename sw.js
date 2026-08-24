/* Rootwork V2 — local-first PWA shell. */
var CACHE = 'rootwork-v2-2026-08-24-11';
var ASSETS = [
  './',
  './index.html',
  './styles.css',
  './domain.js',
  './store.js',
  './app.js',
  './manifest.json',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './brand/rootwork-mark.svg',
  './brand/rootwork-symbol.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-256.png',
  './icon-512.png',
  './icon-1024.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (key) { return key !== CACHE; })
          .map(function (key) { return caches.delete(key); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

function cacheable(response) {
  return response && response.ok && response.type === 'basic';
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          if (cacheable(response)) {
            var copy = response.clone();
            caches.open(CACHE).then(function (cache) { cache.put('./index.html', copy); });
          }
          return response;
        })
        .catch(function () { return caches.match('./index.html'); })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (cacheable(response)) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      });
    })
  );
});
