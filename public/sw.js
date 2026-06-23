// Minimalist Service Worker to enable Windows Standalone PWA installation
const CACHE_NAME = 'radio-pwa-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => console.log('Pre-caching assets skipped/offline:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new Date(event.request.url);
  // Do NOT cache live radio audio streams to prevent playback failures or memory leaks
  if (url.pathname.includes('/stream') || event.request.url.includes('stream') || event.request.url.includes('streamurl') || event.request.url.includes('.mp3') || event.request.url.includes('.aac') || event.request.destination === 'audio') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback or ignore
      });
    })
  );
});
