/* Rootwork — sw.js
   Cache key đổi theo deploy để PWA Home Screen nhận code mới. */
var CACHE = 'rootwork-cache-2026-08-12';

var ASSETS = [
  './',
  './index.html',
  './domain.js',
  './store.js',
  './app.js',
  './manifest.json',
  './vendor/react.production.min.js',
  './vendor/react-dom.production.min.js',
  './brand/rootwork-mark.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-256.png',
  './icon-512.png',
  './icon-1024.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        return Promise.all(ASSETS.map(function (url) {
          return cache.add(url).catch(function () { return null; });
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

/* React nằm trong vendor/ nên không còn nhánh cross-origin nào.
   Chỉ cache response THÀNH CÔNG và cùng origin: trước đây mọi response đều
   được ghi đè vào cache, nên một lần deploy hụt file là 404 bị nướng vĩnh
   viễn và người dùng phải gỡ app khỏi Home Screen mới thoát ra được. */
function cacheable(res) {
  return res && res.ok && res.type === 'basic';
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(function (res) {
        if (cacheable(res)) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(request, copy); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(request).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
  );
});
