/* sw.js */
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open('mstq-static-v1').then((c) =>
      c.addAll([
        './',
        './index.html',
        './manifest.webmanifest'
      ]).catch(()=>{})
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Cache-first cho file tĩnh; network-first cho JSON/metadata
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    if (/\.(html|webmanifest|png|jpg|jpeg|gif|svg)$/.test(url.pathname)) {
      e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
      return;
    }
  }
  if (url.hostname.endsWith('archive.org')) {
    // Audio stream nên luôn network (Range), để yên cho browser xử lý.
    if (url.pathname.includes('/download/')) return; // không chặn stream
    // metadata → network-first (fallback cache)
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open('mstq-meta-v1').then(c => c.put(e.request, clone));
        return res;
      }).catch(()=>caches.match(e.request))
    );
  }
});
