const CACHE_NAME = 'backpack-pwa-cache-v3';
const URLS_TO_CACHE = [
  '/rando-matos/index.html',
  '/rando-matos/icons/icon-192x192.png',
  '/rando-matos/icons/icon-512x512.png',
  '/rando-matos/manifest.json',
  '/rando-matos/app.js'
];

// Install event: Open cache and add core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Fetch event: Serve cached content if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - fetch from network
        return fetch(event.request);
      })
  );
});

// Activate event: Clean up old caches (optional for this simple case, but good practice)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
