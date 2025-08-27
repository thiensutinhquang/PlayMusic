// sw.js

const STATIC_CACHE_NAME = 'mstq-static-cache-v1.3.0';
const AUDIO_CACHE_NAME = 'mstq-audio-cache-v1.3.0';
const ALL_CACHES = [STATIC_CACHE_NAME, AUDIO_CACHE_NAME];

const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/@phosphor-icons/web',
    'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap',
    'https://raw.githubusercontent.com/thiensutinhquang/GiaoLy/main/logo%20Thien%20Su%20Tinh%20Quang.png',
    // Add paths to your icons if they are local
    // './images/icons/icon-192x192.png',
    // './images/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    console.log('ServiceWorker: Installing new version...');
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        }).catch(error => console.error('ServiceWorker: Failed to cache static resources during install:', error))
    );
});

self.addEventListener('activate', event => {
    console.log('ServiceWorker: Activating new version.');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!ALL_CACHES.includes(cacheName)) {
                        console.log('ServiceWorker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Strategy for audio streams: Stale-While-Revalidate
    if (url.pathname.includes('/v1/tracks/') && url.pathname.includes('/stream')) {
        event.respondWith(
            caches.open(AUDIO_CACHE_NAME).then(cache => {
                return cache.match(request).then(cachedResponse => {
                    const fetchPromise = fetch(request).then(networkResponse => {
                        // If the fetch is successful, clone it and update the cache.
                        if (networkResponse.ok) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    });

                    // Return the cached response immediately if it exists, otherwise wait for the network.
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // Strategy for API calls (non-stream): Network-first
    if (url.hostname.includes('audius.co')) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // Strategy for static assets: Cache-first
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            return cachedResponse || fetch(request).then(networkResponse => {
                // Cache newly fetched static assets
                if (networkResponse.ok) {
                    const responseToCache = networkResponse.clone();
                    caches.open(STATIC_CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            });
        })
    );
});
