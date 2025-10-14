/* sw.js – MSTQ Music PWA Service Worker
 * Chiến lược:
 * - cache-first cho file tĩnh nội bộ (HTML/CSS/JS/manifest/icon)
 * - network-first cho metadata Archive.org (giảm lỗi khi nền)
 * - KHÔNG can thiệp streaming audio (Range request) để trình duyệt xử lý
 */
const STATIC_CACHE = 'mstq-static-v1';
const META_CACHE   = 'mstq-meta-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll([
        './',
        './index.html',
        './manifest.webmanifest',
        './images/icon-192.png',
        './images/icon-512.png'
      ]).catch(() => {})
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // dọn cache cũ nếu đổi version
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, META_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bỏ qua non-GET
  if (req.method !== 'GET') return;

  // Nội bộ: cache-first cho tĩnh
  if (url.origin === location.origin) {
    // Không cache audio
    if (/\.(mp3|m4a|aac|opus|ogg)$/i.test(url.pathname)) return;

    if (/\.(html|webmanifest|png|jpg|jpeg|gif|svg|ico|js|css)$/i.test(url.pathname) || url.pathname === '/' ) {
      event.respondWith(
        caches.match(req).then((hit) =>
          hit ||
          fetch(req).then((res) => {
            const resClone = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, resClone));
            return res;
          }).catch(() => hit) // nếu network fail, dùng cache nếu có
        )
      );
      return;
    }
  }

  // Archive.org:
  if (url.hostname.endsWith('archive.org')) {
    // Stream audio: để nguyên cho trình duyệt (Range requests)
    if (url.pathname.includes('/download/')) return;

    // Metadata/API: network-first, fallback cache
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(META_CACHE).then((c) => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Mặc định: pass-through
});
