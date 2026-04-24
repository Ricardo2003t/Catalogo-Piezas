/* ════════════════════════════════════════════════════════════════
   DLG AUTOPARTES — sw.js
   Cache-First para imágenes · Network-First para shell
   Optimizado para conexiones de 16kbps
════════════════════════════════════════════════════════════════ */

const CACHE_SHELL = 'dlg-shell-v3';
const CACHE_IMGS  = 'dlg-imgs-v3';
const CACHE_FONTS = 'dlg-fonts-v1';

const SHELL_ASSETS = ['/', '/index.html', '/style.css', '/script.js', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_SHELL)
      .then(c => c.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  const valid = [CACHE_SHELL, CACHE_IMGS, CACHE_FONTS];
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

  // IMÁGENES → Cache-First (crítico para 16kbps: segunda visita instantánea)
  if (/\.(webp|png|jpg|jpeg|gif|svg|ico)$/i.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE_IMGS).then(cache =>
        cache.match(request).then(hit => {
          if (hit) return hit;
          return fetch(request).then(res => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          }).catch(() => new Response('', { status: 408 }));
        })
      )
    );
    return;
  }

  // FUENTES → Cache-First
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(
      caches.open(CACHE_FONTS).then(cache =>
        cache.match(request).then(hit => {
          if (hit) return hit;
          return fetch(request).then(res => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // SHELL (HTML/CSS/JS) → Network-First con fallback a cache
  if (/\/(index\.html|style\.css|script\.js)?$/.test(url.pathname) ||
      url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    e.respondWith(
      fetch(request).then(res => {
        if (res.ok) caches.open(CACHE_SHELL).then(c => c.put(request, res.clone()));
        return res;
      }).catch(() =>
        caches.match(request).then(hit => hit || caches.match('/index.html'))
      )
    );
    return;
  }

  // RESTO → Stale-While-Revalidate
  e.respondWith(
    caches.open(CACHE_SHELL).then(cache =>
      cache.match(request).then(hit => {
        const fresh = fetch(request).then(res => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        });
        return hit || fresh;
      })
    )
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});