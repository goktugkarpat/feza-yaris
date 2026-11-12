/* İnternetsiz çalışma. index.html önce ağdan, diğer dosyalar önce önbellekten.
   Yalnız bu oyunun önbellekleri (feza-yaris-) silinir; aynı sitedeki diğer oyunlara dokunulmaz. */
const ONEK = 'feza-yaris-';
const CACHE = ONEK + 'v5';
const SESLER = ['giris', 'hazir', 'basla', 'yildiz', 'roket', 'sontur', 'bir', 'iki', 'uc', 'ovgu1', 'ovgu2', 'ovgu3', 'hop', 'tekrar', 'giris_orman', 'giris_kiyi', 'giris_kar', 'giris_seker', 'giris_uzay', 'giris_col', 'giris_gokkusagi', 'giris_dino', 'giris_sehir'];
const CORE = ['./', 'index.html', 'style.css', 'ses.js', 'cekirdek.js', 'cevre.js', 'cevre_seker.js', 'cevre_uzay.js', 'cevre_col.js', 'cevre_gokkusagi.js', 'cevre_dino.js', 'cevre_sehir.js', 'pist.js', 'araba.js', 'arayuz.js', 'oyun.js', 'vendor/three.js', 'manifest.webmanifest',
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
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try {
        const y = await fetch(r);
        if (y.ok) { try { await c.put('index.html', y.clone()); } catch (_) { /* Depolama dolu olsa da ağdaki oyun açılır. */ } return y; }
        return (await c.match('index.html')) || y;
      } catch (_) { return (await c.match('index.html')) || Response.error(); }
    })());
  } else {
    e.respondWith((async () => {
      const c = await caches.open(CACHE), o = await c.match(r, { ignoreSearch: true });
      if (o) return o;
      const y = await fetch(r);
      if (y.ok) { try { await c.put(r, y.clone()); } catch (_) { /* Depolama hatası oyunu kesmez. */ } }
      return y;
    })());
  }
});
