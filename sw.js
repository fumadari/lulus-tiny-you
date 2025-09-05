// Service Worker for Lulu's Tiny You — v1.17.0 cache reset
// Network-first strategy with complete cache wipe on activate

const CACHE_NAME = 'lulu-tiny-you-nuke-v1.17.0';

// Install: activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: delete ALL caches and force clients to reload
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          try { client.navigate(client.url); } catch (_) {}
        });
      });
    })
  );
});

// Fetch: always try network first, fallback to cache if offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => caches.match(event.request))
  );
});
