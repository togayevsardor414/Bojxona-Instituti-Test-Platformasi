/* Bojxona test platformasi — service worker (oflayn rejim) */
const VERSION = 'bt-v3.0.0';
const ASSETS = ['./', './index.html', './config.js', './seed.js', './manifest.webmanifest',
  './icons/logo.webp', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // Google Apps Script soʻrovlari keshlanmaydi
  if (url.pathname.indexOf('/icons/') >= 0) {            // ikonkalar: avval kesh (tez)
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return res; })));
    return;
  }
  // sahifa, config.js, seed.js: avval tarmoq (yangi versiya), oflayn boʻlsa keshdan
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req.mode === 'navigate' ? './index.html' : req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
