const CACHE_NAME = 'autoledger-dynamic-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
           if (cacheName !== CACHE_NAME) {
             return caches.delete(cacheName);
           }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Handle Chrome extension schemes or other non-http
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Try to get from cache first (Cache First Strategy for performance & offline)
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Network fetch if not in cache
      try {
        const networkResponse = await fetch(event.request);
        
        // Check if valid response
        if (networkResponse && networkResponse.status === 200) {
             // Cache local resources and specific CDNs
             if (event.request.url.startsWith(self.location.origin) || 
                 event.request.url.includes('cdn.tailwindcss.com') || 
                 event.request.url.includes('aistudiocdn.com') || 
                 event.request.url.includes('api.iconify.design')) {
                 
                 cache.put(event.request, networkResponse.clone());
             }
        }

        return networkResponse;
      } catch (error) {
         // Offline fallback: if request is for index.html (navigation), return index.html from cache
         // This is crucial for SPA offline support
         if (event.request.mode === 'navigate') {
             return cache.match('./index.html');
         }
         throw error;
      }
    })
  );
});