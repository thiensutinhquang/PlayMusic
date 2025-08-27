// sw.js

const STATIC_CACHE_NAME = 'mstq-static-cache-v1.3.2';
const AUDIO_CACHE_NAME = 'mstq-audio-cache-v1.3.2';
const ALL_CACHES = [STATIC_CACHE_NAME, AUDIO_CACHE_NAME];

// Note: app.js and index.html are not listed here because the service worker is now inline.
// The primary file to cache is the main HTML file itself ('./').
const urlsToCache = [
    './',
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
    self.skipWaiting(); // Ensure the new service worker activates immediately
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then(cache => {
            // We don't add all URLs here anymore as the main app is self-contained.
            // We cache the root page to enable offline startup.
            return cache.add('./'); 
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

    // Strategy for static assets and the main page: Cache-first
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            return cachedResponse || fetch(request).then(networkResponse => {
                // Cache newly fetched static assets
                if (networkResponse.ok && urlsToCache.includes(request.url)) {
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
