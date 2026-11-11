/* İnternetsiz çalışma. index.html önce ağdan, diğer dosyalar önce önbellekten.
   Yalnız bu oyunun önbellekleri (feza-yaris-) silinir; aynı sitedeki diğer oyunlara dokunulmaz. */
const ONEK = 'feza-yaris-';
const CACHE = ONEK + 'v1';
const SESLER = ['giris', 'hazir', 'basla', 'yildiz', 'roket', 'sontur', 'bir', 'iki', 'uc', 'ovgu1', 'ovgu2', 'ovgu3', 'hop', 'tekrar'];
const CORE = ['./', 'index.html', 'style.css', 'ses.js', 'cekirdek.js', 'cevre.js', 'pist.js', 'araba.js', 'arayuz.js', 'oyun.js', 'vendor/three.js', 'manifest.webmanifest',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'].concat(SESLER.map(s => 'sesler/' + s + '.mp3'));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(p => new Request(p, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(ONEK) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const sayfa = r.mode === 'navigate' || r.url.endsWith('/index.html') || r.url.endsWith('/');
  if (sayfa) {
    e.respondWith(fetch(r).then(y => { const k = y.clone(); caches.open(CACHE).then(c => c.put('index.html', k)); return y; }).catch(() => caches.match('index.html')));
  } else {
    e.respondWith(caches.match(r, { ignoreSearch: true }).then(o => o || fetch(r).then(y => { if (y.ok) { const k = y.clone(); caches.open(CACHE).then(c => c.put(r, k)); } return y; })));
  }
});
