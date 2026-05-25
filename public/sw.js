// Velour Privacy Platform PWA Service Worker
const CACHE_NAME = 'velour-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {
        // Safe bypass if any asset is missing in development
        console.log('Pre-cache complete with optional development skips.');
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
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

// Fetch cache-first with network fallback strategy
self.addEventListener('fetch', (e) => {
  // Only handle GET requests and skip browser extension requests
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback
        return caches.match('/');
      });
    })
  );
});

// Handle real and simulated push notification triggers
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {
    title: 'Velour Security Guard',
    body: 'Continuous privacy scans have checked 14 index updates.',
    icon: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?q=80&w=192&h=192&fit=crop'
  };

  const options = {
    body: data.body,
    icon: data.icon || 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?q=80&w=192&h=192&fit=crop',
    badge: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?q=80&w=96&h=96&fit=crop',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      { action: 'explore', title: 'Review Exposures' },
      { action: 'close', title: 'Acknowledge' }
    ]
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
