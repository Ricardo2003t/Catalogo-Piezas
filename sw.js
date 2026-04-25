/* DLG AUTOPARTES - sw.js
   Cache-First para conexiones 5-14kbps */

const CACHE_SHELL = 'dlg-shell-v7';
const CACHE_IMGS = 'dlg-imgs-v7';

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js?v=2',
  '/manifest.json',
  '/logo_dlg_clean.webp'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_SHELL)
      .then(c => c.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  const valid = [CACHE_SHELL, CACHE_IMGS];
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !valid.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // IMÁGENES → Cache-First con timeout corto
  if (/\.(webp|png|jpg|jpeg|gif|svg|ico)$/i.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE_IMGS).then(cache =>
        cache.match(request).then(hit => {
          if (hit) return hit;
          return fetch(request).then(res => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          }).catch(() => new Response('', { status: 408, statusText: 'Offline' }));
        })
      )
    );
    return;
  }

  // JS → Network-First (siempre obtener versión nueva)
  if (url.pathname.endsWith('.js')) {
    e.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // SHELL → Stale-While-Revalidate (más rápido que Network-First)
  if (url.pathname === '/' || 
      url.pathname.endsWith('.css') || 
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('.webp')) {
    e.respondWith(
      caches.open(CACHE_SHELL).then(cache =>
        cache.match(request).then(hit => {
          const fresh = fetch(request).then(res => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          }).catch(() => {});
          return hit || fresh;
        })
      )
    );
    return;
  }

  // RESTO → Solo cache paraoffline
  e.respondWith(caches.match(request));
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});