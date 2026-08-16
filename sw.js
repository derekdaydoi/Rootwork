/* Rootwork — sw.js
   Cache key đổi theo deploy để PWA Home Screen nhận code mới. */
var CACHE = 'rootwork-cache-2026-08-16-menu-fix-1';

var ASSETS = [
  './',
  './index.html',
  './domain.js',
  './store.js',
  './app.js',
  './ui-fixes.css',
  './ui-fixes.js',
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

function cacheable(res) {
  return res && res.ok && res.type === 'basic';
}

function isNavigation(request) {
  return request.mode === 'navigate' || /\/index\.html(?:$|\?)/.test(request.url);
}

function decorateHtml(res) {
  if (!res) return Promise.resolve(res);
  return res.text().then(function (html) {
    if (html.indexOf('ui-fixes.css') === -1) {
      html = html.replace('</head>', '<link rel="stylesheet" href="ui-fixes.css" />\n</head>');
    }
    if (html.indexOf('ui-fixes.js') === -1) {
      html = html.replace('</body>', '<script src="ui-fixes.js"></script>\n</body>');
    }
    var headers = new Headers(res.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.delete('content-length');
    return new Response(html, { status: res.status, statusText: res.statusText, headers: headers });
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (isNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then(function (res) {
          if (!cacheable(res)) return res;
          return decorateHtml(res).then(function (decorated) {
            var copy = decorated.clone();
            caches.open(CACHE).then(function (c) { c.put(request, copy); });
            return decorated;
          });
        })
        .catch(function () {
          return caches.match(request)
            .then(function (hit) { return hit || caches.match('./index.html'); })
            .then(decorateHtml);
        })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(function (res) {
        if (cacheable(res)) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(request, copy); });
        }
        return res;
      })
      .catch(function () { return caches.match(request); })
  );
});
