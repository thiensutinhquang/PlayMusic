// PWA Service Worker V21 - MSTQ Music Edition
// Phiên bản: Hỗ trợ manifest.webmanifest và cấu trúc thư mục gốc
const CACHE_NAME = 'mstq-pwa-v21-webmanifest';

// [QUAN TRỌNG] Tên repo của dự án
const BASE = '/PlayMusic'; 

const STATIC_ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  // Cache đúng tên file manifest gốc của bạn
  `${BASE}/manifest.webmanifest`,
  // Cache đúng đường dẫn icon trong thư mục images/icons/
  `${BASE}/images/icons/icon-192x192.png`,
  `${BASE}/images/icons/icon-512x512.png`,
  // Cache luôn các thư viện CDN để chạy Offline cơ bản
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'
];

// 1. INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('[SW] Caching assets...');
      await Promise.all(STATIC_ASSETS.map(url => 
        fetch(url, { cache: 'reload' }).then(res => {
          if (res.ok) return cache.put(url, res);
          console.warn('[SW] Skip:', url);
        }).catch(() => {})
      ));
    })
  );
});

// 2. ACTIVATE (Tự động dọn cache cũ)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 3. FETCH (Chiến lược Network First an toàn cho MSTQ Music)
self.addEventListener('fetch', event => {
  const req = event.request;
  
  // Chỉ xử lý GET request
  if (req.method !== 'GET') return;

  // Streaming Audio (Range Requests): Luôn ưu tiên mạng để tua/phát ổn định
  if (req.headers.get('range') || /\.(mp3|m4a|aac|opus|ogg)$/i.test(req.url)) {
    return; // Để trình duyệt tự xử lý streaming
  }

  // HTML & Manifest: Luôn ưu tiên mạng để lấy nội dung mới nhất, Fallback về cache
  // Đã cập nhật để kiểm tra đúng tên file manifest.webmanifest
  if (req.mode === 'navigate' || req.url.includes('manifest.webmanifest') || req.url.includes('index.html')) {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Assets (Ảnh/CSS/JS): Ưu tiên Cache cho nhanh
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});
