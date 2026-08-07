/* Rootwork service worker.
   ĐỔI dòng CACHE mỗi lần deploy. Không đổi thì máy đang cài sẽ kẹt bản cũ
   vĩnh viễn và không có cách nào ép cập nhật từ xa. */
const CACHE = "rootwork-v3.1-2026-07-25";

const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-256.png",
  "./icon-512.png",
  "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll fail toàn bộ nếu một file lỗi — thêm từng cái để một icon
      // thiếu không làm hỏng cả lần cài.
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

/* Network-first cho file của app: mở app khi có mạng là thấy bản mới ngay.
   Cache-first cho React trên CDN vì URL đã ghim theo phiên bản, không đổi. */
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
