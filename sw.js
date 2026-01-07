
const CACHE_NAME = 'halo-swapro-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://i.imgur.com/P7t1bQy.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
