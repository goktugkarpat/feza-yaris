/* Arayüz: ekran düğmeleri ve göstergelerle ilgili ek davranışlar (OLAY ile oyunu dinler). Oyun mantığı oyun.js'tedir;
   oyun.js şu kimlikleri kullanır, DEĞİŞTİRME: hud, .bayrak(.tamam), yildiz-say, sira-say, hizlan(.vurgu), hizlan-dolum (yükseklik %), el,
   isiklar (çocukları: kirmizi/yesil), baslik, oyna, mola, devam, dur, sonuc, kupa (sınıf: boş/iki/uc), sonuc-sira, sonuc-yildiz-say, tekrar; .gizli = görünmez.
   Buradaki her şey süs: yıldız sayacı zıplar, sıra rakamı pop yapar, roket düğmesi hazır olunca parlar. Kare başına DOM yazılmaz
   (sıra ve roket dolumu saniyede ~8 kez yalnız OKUNUR, değişince yazılır). Üst düzey adlar `ui` önekli. */
'use strict';

const uiEl = id => document.getElementById(id);
document.body.dataset.pist = PIST_TEMA;
const uiSira = uiEl('sira'), uiSiraSay = uiEl('sira-say'), uiHizlan = uiEl('hizlan'), uiDolum = uiEl('hizlan-dolum');
let uiSonSira = 0, uiHazir = null, uiSayac = 0;

// kısa "zıpla" hareketi (yalnız transform; sınıf kurcalamadan yeniden başlatılabilir)
function uiZipla(el, kat, sure, don) {
  if (!el || !el.animate) return;
  el.animate([{ transform: 'scale(1)' }, { transform: 'scale(' + kat + ') rotate(' + (don || 0) + 'deg)', offset: 0.35 }, { transform: 'scale(1)' }],
    { duration: sure || 380, easing: 'ease-out' });
}

// logo: harfleri tek tek sar (renk + dalga hareketi için)
(function uiLogo() {
  const h = document.querySelector('#baslik h1'); if (!h) return;
  let n = 0;
  h.querySelectorAll('span').forEach(s => {
    const yazi = s.textContent; s.textContent = '';
    for (const c of yazi) { const b = document.createElement('b'); b.textContent = c; b.className = 'ui-h' + (n % 6); b.style.setProperty('--i', n); n++; s.appendChild(b); }
  });
})();

function uiYokla() {
  const s = +uiSiraSay.textContent || 0;
  if (s !== uiSonSira) {
    if (uiSonSira) uiZipla(uiSiraSay, s < uiSonSira ? 1.9 : 1.45, 460, s < uiSonSira ? -12 : 0);
    uiSonSira = s; uiSira.className = 'ui-kart s' + Math.min(4, Math.max(1, s));
  }
  const hazir = (parseFloat(uiDolum.style.height) || 0) < 0.5;
  if (hazir !== uiHazir) { uiHazir = hazir; uiHizlan.classList.toggle('ui-hazir', hazir); if (hazir) uiZipla(uiHizlan, 1.2, 480); }
}

if (typeof OLAY !== 'undefined') {
  OLAY.on('durum', d => {
    clearInterval(uiSayac); uiSayac = 0;
    if (d === 'giris' || d === 'sayim') { uiDolum.style.height = '0%'; uiHazir = true; uiHizlan.classList.add('ui-hazir'); uiSonSira = 0; }
    if (d === 'yaris') uiSayac = setInterval(uiYokla, 120);
  });
  OLAY.on('yildiz', () => { uiZipla(uiEl('yildiz-kutu'), 1.28, 340, -6); });
  OLAY.on('tur', () => { uiZipla(uiEl('turlar'), 1.18, 520); });
  OLAY.on('roket', () => { uiZipla(uiHizlan, 0.88, 300); });
}

// Üç yıldız → roket: okumadan anlaşılan, kaçırınca sıfırlanmayan küçük bir ödül yolu.
const uiSeri = uiEl('seri'), uiSeriYildiz = [...uiSeri.querySelectorAll('.seri-yildiz')];
const uiRotaNokta = uiEl('rota-konum'), uiRotaGolge = uiEl('rota-konum-golge'), uiRotaIz = uiEl('rota-ilerleme');
let uiSeriTimer = 0, uiKayit = { yildiz: 0 }, uiSonOzet = null;
const uiKayitAnahtar = 'feza-yaris-anilar-v1:' + PIST_TEMA;
try { const k = JSON.parse(localStorage.getItem(uiKayitAnahtar) || '{}'); if (Number.isFinite(k.yildiz)) uiKayit.yildiz = clamp(Math.floor(k.yildiz), 0, YILDIZ.length * TUR); } catch (_) { /* Özel gezinmede kayıt isteğe bağlı. */ }
document.querySelectorAll('.pist-kart').forEach(b => {
  const secili = b.dataset.pist === PIST_TEMA; b.setAttribute('aria-pressed', secili ? 'true' : 'false');
  b.addEventListener('click', () => { if (b.dataset.pist === PIST_TEMA) return; const u = new URL(location.href); u.searchParams.set('pist', b.dataset.pist); location.href = u.href; });
});
for (const id of ['sonuc-ev', 'mola-ev']) uiEl(id).addEventListener('click', () => YARIS.basligaDon());

// Pist çizgisi gerçek pistin örneklerinden bir kez yapılır; hareket yalnızca 8 Hz olayında güncellenir.
const uiMapX = new Float32Array(N), uiMapY = new Float32Array(N);
let uiMapUz = 0;
{
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < N; i++) { x0 = Math.min(x0, PX[i]); x1 = Math.max(x1, PX[i]); z0 = Math.min(z0, PZ[i]); z1 = Math.max(z1, PZ[i]); }
  const s = Math.min(134 / (x1 - x0), 88 / (z1 - z0)), ox = 80 - (x0 + x1) * s / 2, oy = 58 - (z0 + z1) * s / 2;
  let d = '';
  for (let i = 0; i < N; i++) { uiMapX[i] = PX[i] * s + ox; uiMapY[i] = PZ[i] * s + oy; if (!(i % 4)) d += (i ? 'L' : 'M') + uiMapX[i].toFixed(2) + ',' + uiMapY[i].toFixed(2); }
  d += 'Z';
  for (const id of ['rota-kenar', 'rota-yol', 'rota-ilerleme']) uiEl(id).setAttribute('d', d);
  uiMapUz = uiRotaIz.getTotalLength(); uiRotaIz.style.strokeDasharray = uiMapUz; uiRotaIz.style.strokeDashoffset = uiMapUz;
  uiEl('rota-baslangic').setAttribute('cx', uiMapX[0]); uiEl('rota-baslangic').setAttribute('cy', uiMapY[0]);
}
function uiRotaAyar(o) {
  const u = clamp(o.oran, 0, 1), i = Math.min(N - 1, Math.floor(u * N));
  for (const el of [uiRotaNokta, uiRotaGolge]) { el.setAttribute('cx', uiMapX[i].toFixed(1)); el.setAttribute('cy', uiMapY[i].toFixed(1)); }
  uiRotaIz.style.strokeDashoffset = (uiMapUz * (1 - u)).toFixed(1);
  uiEl('rota').classList.toggle('roketli', !!o.roket);
}

// Küçük bir havuz: yıldızlar toplandığı yerden sayaca uçar; sürekli DOM oluşturulmaz.
const uiUcusan = [], uiProj = new T.Vector3(); let uiUcusNo = 0;
for (let i = 0; i < 6; i++) {
  const el = document.createElement('div'); el.className = 'ui-ucan-yildiz'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<svg viewBox="0 0 48 48"><use href="#ui-yildiz"/></svg>'; document.body.appendChild(el); uiUcusan.push({ el, anim: null });
}
function uiYildizUcur(y) {
  if (!y || !Number.isFinite(y.x) || !Number.isFinite(y.z)) return;
  uiProj.set(y.x, 1.4, y.z).project(camera);
  if (uiProj.z > 1 || Math.abs(uiProj.x) > 1.3 || Math.abs(uiProj.y) > 1.3) return;
  const p = uiUcusan[uiUcusNo++ % uiUcusan.length], hedef = uiEl('yildiz-kutu').getBoundingClientRect();
  const x = (uiProj.x * .5 + .5) * innerWidth - 20, y0 = (-uiProj.y * .5 + .5) * innerHeight - 20;
  const dx = hedef.left + hedef.width * .5 - 20 - x, dy = hedef.top + hedef.height * .5 - 20 - y0;
  if (p.anim) p.anim.cancel(); p.el.style.left = x + 'px'; p.el.style.top = y0 + 'px';
  p.anim = p.el.animate([{ opacity: 1, transform: 'translate(0,0) scale(1.2)' }, { opacity: 1, transform: 'translate(' + dx * .4 + 'px,' + (dy * .55 - 55) + 'px) scale(1.5)', offset: .45 }, { opacity: 0, transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.45)' }], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' });
}

function uiAnilar(o) {
  uiSonOzet = o;
  for (const [id, n] of [['ani-seri', o.seri], ['ani-roket', o.roket], ['ani-hop', o.ziplama]]) {
    const el = uiEl(id); el.querySelector('b').textContent = n || 0; el.classList.toggle('kazanildi', n > 0);
  }
  const yeni = o.yildiz > uiKayit.yildiz;
  uiEl('rekor').classList.toggle('gizli', !yeni); uiEl('rekor-say').textContent = o.yildiz;
  if (yeni) { uiKayit.yildiz = o.yildiz; try { localStorage.setItem(uiKayitAnahtar, JSON.stringify(uiKayit)); } catch (_) {} }
}
OLAY.on('yildiz', uiYildizUcur);
OLAY.on('ilerleme', uiRotaAyar);
OLAY.on('seri', o => {
  clearTimeout(uiSeriTimer); uiSeri.classList.toggle('odul', !!o.odul);
  uiSeriYildiz.forEach((el, i) => el.classList.toggle('dolu', i < o.adet));
  if (o.adet) uiZipla(uiSeriYildiz[Math.min(2, o.adet - 1)], 1.35, 350);
  if (o.odul) { uiZipla(uiSeri, 1.16, 600); uiSeriTimer = setTimeout(() => { uiSeri.classList.remove('odul'); uiSeriYildiz.forEach(el => el.classList.remove('dolu')); }, 1300); }
});
OLAY.on('ozet', uiAnilar);
OLAY.on('durum', d => {
  if (d === 'baslik' || d === 'giris' || d === 'sayim') { clearTimeout(uiSeriTimer); uiSeri.classList.remove('odul'); uiSeriYildiz.forEach(el => el.classList.remove('dolu')); uiRotaAyar({ oran: 0 }); uiSonOzet = null; }
  if (d === 'bitis') { uiRotaAyar({ oran: 1 }); uiEl('rota').classList.remove('roketli'); }
});

function uiUcusTemizle() { for (const p of uiUcusan) if (p.anim) { p.anim.cancel(); p.anim = null; } }
function uiOdak(el) { if (el && !document.hidden) { try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); } } }
OLAY.on('mola', m => {
  document.body.classList.toggle('ui-durmus', m);
  uiEl('hud').inert = m;
  if (m) { uiUcusTemizle(); uiOdak(uiEl('devam')); }
  else if (!uiEl('hud').classList.contains('gizli')) uiOdak(uiEl('c'));
});
OLAY.on('durum', d => {
  if (d !== 'yaris') uiUcusTemizle();
  if (d === 'baslik') { document.body.classList.remove('ui-durmus'); uiEl('hud').inert = false; uiOdak(document.querySelector('.pist-kart[aria-pressed=true]')); }
  if (d === 'giris' || d === 'sayim') uiOdak(uiEl('c'));
});
OLAY.on('sonuc', () => uiOdak(uiEl('tekrar')));
