/* Rootwork service worker — v4 concept UI. */
const CACHE = "rootwork-v4.4-2026-08-07";

const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json?v=4.4.0",
  "./rootwork-mark.svg",
  "./icon-180.png?v=4.4.0",
  "./icon-192.png?v=4.4.0",
  "./icon-256.png?v=4.4.0",
  "./icon-512.png?v=4.4.0",
  "./icon-maskable-512.png?v=4.4.0",
  "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(ASSETS.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  if (new URL(request.url).hostname === "unpkg.com") {
    event.respondWith(
      caches.match(request).then(hit => hit || fetch(request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
        return res;
      }))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request).then(hit => hit || caches.match("./index.html")))
  );
});
