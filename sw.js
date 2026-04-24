const CACHE_NAME = 'dlg-imgs-v1';
const OFFLINE_URL = 'index.html';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([
      OFFLINE_URL,
      'style.css',
      'script.js'
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.protocol === 'file:' || url.origin === location.origin) {
    if (url.pathname.endsWith('.webp')) {
      e.respondWith(
        caches.open(CACHE_NAME).then(cache =>
          cache.match(e.request).then(res => res || fetch(e.request))
        )
      );
      return;
    }
  }
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});