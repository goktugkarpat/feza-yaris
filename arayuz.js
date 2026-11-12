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
let uiSeriTimer = 0, uiKayit = { yildiz: 0, sira: 0 }, uiSonOzet = null;
const uiKayitAnahtar = 'feza-yaris-anilar-v1:' + PIST_TEMA;
try { const k = JSON.parse(localStorage.getItem(uiKayitAnahtar) || '{}'); if (Number.isFinite(k.yildiz)) uiKayit.yildiz = clamp(Math.floor(k.yildiz), 0, YILDIZ.length * TUR); if (k.sira >= 1 && k.sira <= 3) uiKayit.sira = Math.floor(k.sira); } catch (_) { /* Özel gezinmede kayıt isteğe bağlı. */ }
// Pist kartındaki küçük kupa rozeti: o pistte kazanılmış en iyi sıra (1 altın, 2 gümüş, 3 bronz). Yazı yok.
function uiRozetAyar(kart, sira) {
  if (!kart) return;
  let r = kart.querySelector('.ui-rozet');
  if (!(sira >= 1 && sira <= 3)) { if (r) r.remove(); return; }
  if (!r) { r = document.createElement('i'); r.setAttribute('aria-hidden', 'true'); r.innerHTML = '<svg viewBox="0 0 120 120"><use href="#ui-kupa"/></svg>'; kart.appendChild(r); }
  r.className = 'ui-rozet r' + Math.floor(sira);
}
function uiRozetOku(pist) {
  if (pist === PIST_TEMA) return uiKayit.sira;
  try { const k = JSON.parse(localStorage.getItem('feza-yaris-anilar-v1:' + pist) || '{}'); return k.sira >= 1 && k.sira <= 3 ? Math.floor(k.sira) : 0; } catch (_) { return 0; }
}
// Kartlar pisti yalnız İŞARETLER (parlak çerçeve + zıplama + o pistin giriş cümlesi); pist, yeşil ileri düğmesiyle açılır (aşağıda: Seçim ekranı).
document.querySelectorAll('.pist-kart').forEach(b => {
  const secili = b.dataset.pist === PIST_TEMA; b.setAttribute('aria-pressed', secili ? 'true' : 'false');
  uiRozetAyar(b, uiRozetOku(b.dataset.pist));
  b.addEventListener('click', () => uiPistIsaretle(b.dataset.pist, true));
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
  uiRakipNokta();
}
// Haritada arkadaşlar: her biri kendi renginde küçük, beyaz çerçeveli nokta (gerçek pist konumundan, aynı 8 Hz güncellemeyle). Feza üstte, büyük.
const UI_KIM_RENK = { feza: '#f45744', piril: '#9a6ee6', bilbo: '#8b5a34' };
const uiKimRenk = a => UI_KIM_RENK[a.tur] || uiRenk(a.renk, '#56bdf0');
const uiRakipEl = [...uiEl('rota-rakipler').children];
let uiRakipRenkli = false;
function uiRakipNokta() {
  const Y = window.YARIS; if (!Y || !Y.A || !Y.L) return;
  for (let i = 1; i < Y.A.length && i <= uiRakipEl.length; i++) {
    const a = Y.A[i], el = uiRakipEl[i - 1];
    if (!uiRakipRenkli) el.setAttribute('fill', uiKimRenk(a));
    const j = Math.min(N - 1, Math.floor((((a.yol % Y.L) + Y.L) % Y.L) / Y.L * N));
    el.setAttribute('cx', uiMapX[j].toFixed(1)); el.setAttribute('cy', uiMapY[j].toFixed(1));
  }
  uiRakipRenkli = true;
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
  const iyiSira = o.sira >= 1 && o.sira <= 3 && (!uiKayit.sira || o.sira < uiKayit.sira);
  if (yeni) uiKayit.yildiz = o.yildiz;
  if (yeni) uiYildizRozet(document.querySelector('.pist-kart[data-pist="' + PIST_TEMA + '"]'), uiKayit.yildiz);
  if (iyiSira) { uiKayit.sira = Math.floor(o.sira); uiRozetAyar(document.querySelector('.pist-kart[data-pist="' + PIST_TEMA + '"]'), uiKayit.sira); }
  if (yeni || iyiSira) { try { localStorage.setItem(uiKayitAnahtar, JSON.stringify(uiKayit)); } catch (_) {} }
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
  if (d === 'baslik') { document.body.classList.remove('ui-durmus'); uiEl('hud').inert = false; }
  if (d === 'giris' || d === 'sayim') uiOdak(uiEl('c'));
});
OLAY.on('sonuc', () => uiOdak(uiEl('tekrar')));

// ───────── Araba seçimi: ARABA_TIPLERI'nden (araba.js) yazısız, resimli kartlar. oyArabaSec/oyAraba (oyun.js) yoksa şerit gizli kalır. ─────────
const uiArabaSec = uiEl('araba-sec');
const UI_CIZGI = 'stroke="#17335c" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
function uiRenk(r, yedek) {
  if (typeof r === 'number' && Number.isFinite(r)) return '#' + ('00000' + (r & 0xffffff).toString(16)).slice(-6);
  return typeof r === 'string' && /^(#[0-9a-f]{3,8}|rgb|hsl|[a-z]+$)/i.test(r) ? r : yedek;
}
function uiTeker(x, y, r, gobek) {
  return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#2b3550" stroke="#17335c" stroke-width="2.6"/><circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.42).toFixed(1) + '" fill="' + (gobek || '#dfe6ee') + '"/>';
}
// Sürücü (Feza): kahverengi kıvırcık saç, kırmızı saç bandı — 3B modeldeki gibi açık üstlü arabada başı görünür.
let uiSurucuYok = false;   // sıralama ekranında arkadaşların arabaları sürücüsüz çizilir (yüz ayrı portrede)
function uiSurucu(x, y) {
  if (uiSurucuYok) return '';
  return '<g stroke="#17335c" stroke-width="2.2"><circle cx="' + x + '" cy="' + y + '" r="7.5" fill="#f2c39b"/><path d="M' + (x - 8) + ' ' + (y + 1) + 'q-1-10 8-10 9 0 8 10-3-4-8-4t-8 4z" fill="#6b3f22"/></g>' +
    '<path d="M' + (x - 7.6) + ' ' + (y - 2) + 'q7.6-4 15.2 0" fill="none" stroke="#e8433a" stroke-width="2.6" stroke-linecap="round"/><circle cx="' + (x + 3.6) + '" cy="' + (y + 1.5) + '" r="1.1" fill="#17335c"/>';
}
// Yandan görünüş (sağa bakar), 96×60. c1 = gövde, c2 = süs rengi.
function uiArabaCiz(id, c1, c2) {
  const cam = '#bfe9ff';
  let g;
  if (id === 'kart') {
    g = '<g ' + UI_CIZGI + '><rect x="11" y="27" width="13" height="12" rx="3" fill="#9aa7b8"/><path d="M27 39V25q0-5 5-5h5v19z" fill="' + c2 + '"/>' +
      '</g>' + uiSurucu(42, 30) + '<g ' + UI_CIZGI + '><path d="M12 39h60q11 0 13 8v2H10v-6q0-4 2-4z" fill="' + c1 + '"/><path d="M62 39 55 25" fill="none" stroke-width="3.4"/><circle cx="54" cy="23" r="5" fill="' + c2 + '"/>' +
      '<path d="M76 39l8-7h5v9" fill="' + c2 + '"/></g>' + uiTeker(24, 48, 9.5, c2) + uiTeker(70, 49, 8.5, c2);
  } else if (id === 'yaris') {
    g = '<g ' + UI_CIZGI + '><path d="M5 17h17v7H5zM11 24h6v11h-6z" fill="' + c2 + '"/>' +
      '<path d="M7 46q0-9 10-10l17-3q9-11 23-10 10 1 15 10l14 3q6 2 6 9v3H7z" fill="' + c1 + '"/></g>' + uiSurucu(51, 28) + '<g ' + UI_CIZGI + '><path d="M40 34q11-4 22 0" fill="' + c1 + '"/>' +
      '<path d="M7 42h85" fill="none" stroke="' + c2 + '" stroke-width="3.4"/><circle cx="50" cy="40" r="6" fill="#fff"/></g>' + uiTeker(25, 48, 9.5, c2) + uiTeker(74, 48, 9.5, c2);
  } else if (id === 'cip') {
    g = uiSurucu(46, 15) + '<g ' + UI_CIZGI + '><path d="M30 21 34 6h24l6 15" fill="none" stroke-width="4"/>' +
      '<rect x="9" y="20" width="78" height="16" rx="6" fill="' + c1 + '"/><rect x="5" y="23" width="7" height="12" rx="3" fill="#2b3550"/><path d="M80 25h7" fill="none" stroke="#ffe14d" stroke-width="5"/>' +
      '<path d="M14 30h68" fill="none" stroke="' + c2 + '" stroke-width="3.4"/></g>' + uiTeker(25, 43, 14, c2) + uiTeker(71, 43, 14, c2);
  } else if (id === 'roket') {
    g = '<g ' + UI_CIZGI + '><path d="M20 27 3 35l17 8z" fill="#ffb53d"/><path d="M20 31l-9 4 9 4z" fill="#ffe14d" stroke="none"/>' +
      '<path d="M22 22 13 9h15l11 13zM22 46l-8 9h13l9-9z" fill="' + c2 + '"/><path d="M20 22h44q20 2 28 12-8 10-28 12H20z" fill="' + c1 + '"/>' +
      '<path d="M66 22q18 3 26 12-8 9-26 12z" fill="' + c2 + '"/><circle cx="47" cy="34" r="7.5" fill="' + cam + '"/><path d="M28 23v22" fill="none" stroke="' + c2 + '" stroke-width="3.4"/></g>' +
      uiTeker(34, 51, 6.5, c2) + uiTeker(66, 51, 6.5, c2);
  } else if (id === 'dondurma') {   // açık üstlü pembe-krem araba, önde ve arkada külahta top dondurma (3B modele benzer)
    g = '<g ' + UI_CIZGI + '><path d="M8 44q0-12 12-13h56q12 1 12 13z" fill="' + c1 + '"/><path d="M8 40h80" fill="none" stroke="#fff3df" stroke-width="5"/>' +
      '</g>' + uiSurucu(48, 26) + '<g ' + UI_CIZGI + '><path d="M12 31l6 14 6-14zM72 31l6 14 6-14z" fill="#e8a95b"/>' +
      '<circle cx="18" cy="26" r="8" fill="#8fe3c8"/><circle cx="78" cy="26" r="8" fill="#ff9cc8"/><circle cx="18" cy="17" r="3" fill="#ff4b5c"/><circle cx="78" cy="17" r="3" fill="#ff4b5c"/>' +
      '<path d="M48 33l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#ffd23f" stroke-width="1.6"/></g>' + uiTeker(24, 49, 8.5, c2) + uiTeker(72, 49, 8.5, c2);
  } else if (id === 'unicorn') {
    g = '<g ' + UI_CIZGI + '><path d="M15 34Q3 32 5 17q5 8 13 8z" fill="' + c2 + '"/><path d="M10 34q0-9 9-9h43l6 21H16q-6 0-6-6z" fill="' + c1 + '"/>' +
      '<path d="M79 15 86 1l2 15z" fill="#ffd23f"/><path d="M71 15l1-8 6 6z" fill="' + c1 + '"/><path d="M60 46V31q0-15 14-17 10-1 13 9l3 9q1 6-5 6h-7l-2 8z" fill="' + c1 + '"/>' +
      '<circle cx="80" cy="24" r="2" fill="#17335c" stroke="none"/><path d="M84 33q2 1 4 0" fill="none" stroke-width="2"/></g>' +
      '<g stroke="#17335c" stroke-width="2.2"><circle cx="65" cy="16" r="5.5" fill="#ff7fb5"/><circle cx="60" cy="23" r="5.500" fill="#ffd23f"/><circle cx="57" cy="31" r="5.500" fill="#6fd27a"/><circle cx="56" cy="39" r="5" fill="#56bdf0"/></g>' +
      uiTeker(26, 49, 8.5, c2) + uiTeker(62, 49, 8.5, c2);
  } else if (id === 'itfaiye') {
    g = '<g ' + UI_CIZGI + '><path d="M10 11h49M10 17h49M17 11v6M27 11v6M37 11v6M47 11v6M14 17v5M54 17v5" fill="none" stroke-width="2.4"/>' +
      '<path d="M7 46V25q0-3 3-3h50v24z" fill="' + c1 + '"/><path d="M60 46V18q0-3 3-3h13q5 0 8 6l6 11v14z" fill="' + c1 + '"/><path d="M66 20h10q3 0 5 4l4 8H66z" fill="' + cam + '"/>' +
      '<rect x="65" y="7" width="9" height="8" rx="3.5" fill="#49b6ff"/><path d="M7 39h83" fill="none" stroke="' + c2 + '" stroke-width="3.4"/><circle cx="33" cy="30" r="5.5" fill="' + c2 + '"/>' +
      '<path d="M44 26h10v9H44z" fill="#fff"/></g>' + uiTeker(23, 48, 9.5, c2) + uiTeker(73, 48, 9.5, c2);
  } else if (id === 'ejderha') {
    g = '<g ' + UI_CIZGI + '><path d="M15 37Q3 37 3 22l6 5 3-8q6 5 8 11z" fill="' + c1 + '"/><path d="M10 36q0-9 9-9h43l6 19H16q-6 0-6-6z" fill="' + c1 + '"/>' +
      '<path d="M30 29 22 7l13 9 7-10 4 23z" fill="' + c2 + '"/><path d="M48 27l3.500-7 3.500 7zM55 27l3.500-7 3.500 6z" fill="' + c2 + '"/>' +
      '<path d="M66 17 62 5l9 7zM76 16l1-11 5 10z" fill="' + c2 + '"/><path d="M58 46V30q0-14 13-15l17 4q5 2 4 8l-1 6q-1 5-6 5H72l-2 8z" fill="' + c1 + '"/>' +
      '<circle cx="78" cy="24" r="3.6" fill="#fff" stroke-width="2"/><circle cx="79" cy="24" r="1.600" fill="#17335c" stroke="none"/><circle cx="88.500" cy="25" r="1.100" fill="#17335c" stroke="none"/>' +
      '<path d="M79 33q4.500 1.500 9-1" fill="none" stroke-width="2"/><path d="M20 40h36" fill="none" stroke="' + c2 + '" stroke-width="3.4"/></g>' + uiTeker(26, 49, 8.5, c2) + uiTeker(62, 49, 8.5, c2);
  } else if (id === 'ucak') {
    g = '<g ' + UI_CIZGI + '><path d="M14 28 6 8h11l13 18z" fill="' + c2 + '"/><path d="M30 44v6M66 44v6" fill="none" stroke-width="3"/>' +
      '<path d="M7 33q0-8 11-8h44q19 0 24 10 0 9-18 9H19q-12 0-12-11z" fill="' + c1 + '"/><path d="M45 25q4-10 13-10 9 0 12 10z" fill="' + cam + '"/>' +
      '<path d="M30 33h34l-11 13H40z" fill="' + c2 + '"/><path d="M11 33h12" fill="none" stroke="' + c2 + '" stroke-width="3.4"/>' +
      '<path d="M89 34q5-10 0-20-5 10 0 20zM89 36q5 10 0 20-5-10 0-20z" fill="#dfe6ee"/><circle cx="88" cy="35" r="3.400" fill="' + c2 + '"/></g>' +
      uiTeker(30, 52, 6, c2) + uiTeker(66, 52, 6, c2);
  } else if (id === 'gemi') {   /*GEMI*/ // korsan gemisi: ahşap tekne, önde kıvrık pruva, direkte çizgili yelken ve gülen yüzlü bayrak, arkada fener
    const ah = '#6b3f22', al = '#f2c14e';
    g = '<g ' + UI_CIZGI + '><path d="M11 27V17" fill="none" stroke-width="2.2"/><rect x="7.5" y="12" width="7" height="8" rx="2.5" fill="#ffd36b" stroke-width="2"/>' +
      '<path d="M64 41V3" fill="none" stroke="' + ah + '" stroke-width="3.2"/><path d="M63 3H50q2 3 0 6h13z" fill="#2b3a67" stroke-width="2"/></g>' +
      '<circle cx="56.5" cy="6" r="2.1" fill="' + al + '"/>' + uiSurucu(40, 25) +
      '<g ' + UI_CIZGI + '><path d="M54 14h21q5 8.5 0 17H54q4-8.5 0-17z" fill="' + c2 + '"/><path d="M59 14h5.5q2 8.5 0 17H59q2-8.5 0-17zM69.5 14H75q5 8.5 0 17h-5.5q3-8.5 0-17z" fill="#e8453c" stroke="none"/>' +
      '<path d="M54 14h21q5 8.5 0 17H54q4-8.5 0-17z" fill="none"/><path d="M51 13h28" fill="none" stroke="' + ah + '" stroke-width="3"/>' +
      '<path d="M6 26h9q2 8 11 8h43q9 0 15-8l6-4q1 10-5 17-6 7-14 7H20Q8 46 6 36z" fill="' + c1 + '"/><path d="M9 39h74" fill="none" stroke="' + c2 + '" stroke-width="3"/>' +
      '<circle cx="40" cy="40" r="2.6" fill="#bfe9ff" stroke="' + al + '" stroke-width="1.8"/><circle cx="51" cy="40" r="2.6" fill="#bfe9ff" stroke="' + al + '" stroke-width="1.8"/>' +
      '<circle cx="90" cy="19" r="3" fill="' + al + '" stroke-width="2"/></g>' + uiTeker(23, 48, 9, c2) + uiTeker(70, 48, 8.5, c2);
    /*/GEMI*/
  } else if (id === 'polis') {   /*POLIS*/ // tombul polis arabası: sürücünün arkasında direk üstünde kırmızı-mavi lamba, kapı beyaz, altın yıldız rozet, damalı şerit
    g = '<path d="M34 31V19" fill="none" stroke="#17335c" stroke-width="7.5" stroke-linecap="round"/><path d="M34 31V19" fill="none" stroke="' + c2 + '" stroke-width="3.2" stroke-linecap="round"/>' +
      '<g ' + UI_CIZGI + '><rect x="22" y="15" width="24" height="5.5" rx="2.7" fill="#2b3550"/><path d="M23.5 15.5q0-7 5.25-7t5.25 7z" fill="#ff4b4b"/><path d="M34 15.5q0-7 5.25-7t5.25 7z" fill="#3a8dff"/>' +
      '<path d="M12 30 9.5 17" fill="none" stroke-width="2"/><circle cx="9.5" cy="16" r="2.4" fill="#ff4b4b" stroke-width="1.8"/></g>' + uiSurucu(54, 24) +
      '<g ' + UI_CIZGI + '><path d="M7 46v-8q0-9 9-9h52q10 0 15 5l5 4q2 2 2 8z" fill="' + c1 + '"/><path d="M31 31.5h30v14.5H31z" fill="#fff"/>' +
      '<path d="M31 41.5h4v3h-4zM39 41.5h4v3h-4zM47 41.5h4v3h-4zM55 41.5h4v3h-4z" fill="' + c1 + '" stroke="none"/>' +
      '<circle cx="46" cy="36.4" r="4.3" fill="#1d3f8f" stroke-width="1.8"/><path d="M46 33.2l.95 1.95 2.15.3-1.55 1.5.37 2.15L46 38.1l-1.92 1 .37-2.15-1.55-1.5 2.15-.3z" fill="#ffc928" stroke="none"/>' +
      '<circle cx="85" cy="37" r="3.3" fill="#fff3b0" stroke-width="2"/><path d="M84 46h7M5 46h6" fill="none" stroke-width="4"/><rect x="5.5" y="34.5" width="4" height="4.5" rx="1.5" fill="#ff4b4b" stroke-width="1.8"/></g>' +
      uiTeker(22, 48, 9.5, c2) + uiTeker(72, 48, 9.5, c2);
    /*/POLIS*/
  } else if (id === 'kedi') {   /*KEDI*/ // tombul tekir kedi: arkada kıvrık kuyruk, önde kulaklı yuvarlak yüz, krem burun ve pati
    const kz = 'stroke="#17335c" stroke-opacity=".38" stroke-width="2.6" fill="none" stroke-linecap="round"';
    g = '<path d="M15 36Q4 35 5 23q1-9 8-9" fill="none" stroke="#17335c" stroke-width="8.6" stroke-linecap="round"/><path d="M15 36Q4 35 5 23q1-9 8-9" fill="none" stroke="' + c1 + '" stroke-width="3.6" stroke-linecap="round"/>' +
      '<g ' + UI_CIZGI + '><path d="M10 38q0-10 10-10h40l9 18H16q-6 0-6-8z" fill="' + c1 + '"/><path d="M15 42.5q22 3.500 47 0" fill="none" stroke="' + c2 + '" stroke-width="3.4"/></g>' +
      '<path d="M21 29q1.500 4-.500 7.500M29 29q1.500 4-.500 7.500M37 29q1.500 3.500 0 6.500" ' + kz + '/>' + uiSurucu(46, 23) +
      '<g ' + UI_CIZGI + '><path d="M62 24 63 7l11 11zM76 17l9-10 2 16z" fill="' + c1 + '"/><path d="M65.500 18.500 66 11.500l4.500 5zM79 15.500l4.500-5 1 7z" fill="#ffa3bd" stroke="none"/>' +
      '<circle cx="74" cy="31" r="14" fill="' + c1 + '"/><ellipse cx="83" cy="36.500" rx="6.500" ry="5" fill="' + c2 + '"/>' +
      '<circle cx="79" cy="27" r="4.300" fill="#fff" stroke-width="2"/><circle cx="80" cy="27.300" r="2.700" fill="#17335c" stroke="none"/><circle cx="81" cy="26" r="1" fill="#fff" stroke="none"/>' +
      '<circle cx="88.300" cy="33" r="2.300" fill="#ff7f9f" stroke-width="1.6"/><path d="M84 38.500q2 2 4 0" fill="none" stroke-width="1.8"/>' +
      '<path d="M86 35.500l9.500-2.500M86 37.500l9.500 1" fill="none" stroke-width="1.3"/><ellipse cx="83.500" cy="47" rx="6.500" ry="3.600" fill="' + c2 + '"/></g>' +
      '<circle cx="73.500" cy="35.500" r="2.600" fill="#ff8fb0" opacity=".7"/><path d="M71 19v4M76 18.500v4" ' + kz + '/>' +
      uiTeker(26, 49, 8.5, c2) + uiTeker(62, 49, 8.5, c2);
    /*/KEDI*/
  } else {
    g = '<g ' + UI_CIZGI + '><path d="M8 46V35q0-5 6-6l12-2 9-11h24l12 12 11 2q6 1 6 7v9z" fill="' + c1 + '"/><path d="M31 27l6-8h9v8zM50 19h8l8 8H50z" fill="' + cam + '"/>' +
      '<path d="M8 40h80" fill="none" stroke="' + c2 + '" stroke-width="3.4"/></g>' + uiTeker(25, 48, 9, c2) + uiTeker(71, 48, 9, c2);
  }
  return '<svg viewBox="0 0 96 60" aria-hidden="true"><ellipse cx="48" cy="57" rx="38" ry="3" fill="#17335c" opacity=".16"/>' + g + '</svg>';
}
function uiArabaIsaretle(id) {
  let var_ = false;
  uiArabaSec.querySelectorAll('.araba-kart').forEach(b => { const s = b.dataset.araba === id; var_ = var_ || s; b.setAttribute('aria-pressed', s ? 'true' : 'false'); });
  return var_;
}
function uiArabaKur() {
  const hazir = typeof ARABA_TIPLERI !== 'undefined' && Array.isArray(ARABA_TIPLERI) && ARABA_TIPLERI.length > 1 && typeof oyArabaSec === 'function';
  uiArabaSec.classList.toggle('gizli', !hazir);
  if (!hazir || uiArabaSec.firstChild) return;
  const onay = '<i class="pist-onay"><svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></i>';
  const n = ARABA_TIPLERI.length;
  uiArabaSec.style.setProperty('--an', n); uiArabaSec.style.setProperty('--ak', Math.max(3, Math.ceil(Math.sqrt(n))));
  for (const t of ARABA_TIPLERI) {
    if (!t || !t.id) continue;
    const b = document.createElement('button');
    b.className = 'araba-kart'; b.dataset.araba = t.id; b.setAttribute('aria-label', 'Araba: ' + t.id); b.setAttribute('aria-pressed', 'false');
    b.innerHTML = uiArabaCiz(String(t.id), uiRenk(t.renk, '#f2553f'), uiRenk(t.renk2, '#ffd23f')) + onay;
    b.addEventListener('click', () => {
      try { if (oyArabaSec(t.id) === false) return; } catch (_) { return; }
      uiArabaIsaretle(t.id); uiZipla(b.firstElementChild, 1.22, 420, -5); uiSecZipla(b);
      if (typeof SES !== 'undefined' && SES.CUMLE && SES.CUMLE['araba_' + t.id]) SES.soyle('araba_' + t.id);
    });
    uiArabaSec.appendChild(b);
  }
  let simdi = null;
  try { if (typeof oyAraba === 'function') simdi = oyAraba(); } catch (_) { /* seçim isteğe bağlı */ }
  if (!uiArabaIsaretle(simdi)) uiArabaIsaretle(ARABA_TIPLERI[0].id);
}
// oyun.js bu dosyadan sonra yüklenir: kartlar bütün betikler hazır olunca kurulur.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', uiArabaKur); else uiArabaKur();
OLAY.on('araba', id => { uiArabaIsaretle(id && id.id ? id.id : id); uiSecArabaRenk(); });
OLAY.on('durum', d => { if (d === 'baslik') uiArabaKur(); });

// ───────── Sonuç: yıldız sayısı sıfırdan sayarak artar (saniyede ~18 yazma; kare başına değil). ─────────
let uiSayBekle = 0, uiSayTimer = 0;
function uiSayDur(son) {
  clearTimeout(uiSayBekle); clearInterval(uiSayTimer); uiSayBekle = uiSayTimer = 0;
  uiEl('sonuc-yildiz').classList.remove('ui-sayiyor');
  if (son !== undefined) uiEl('sonuc-yildiz-say').textContent = son;
}
OLAY.on('sonuc', () => {
  const el = uiEl('sonuc-yildiz-say'), hedef = Math.max(0, Math.floor(uiSonOzet ? uiSonOzet.yildiz : +el.textContent) || 0);
  uiSayDur();
  if (hedef < 2) return;
  const adim = Math.max(1, Math.ceil(hedef / 26)); let n = 0;
  el.textContent = '0';
  uiSayBekle = setTimeout(() => {
    uiEl('sonuc-yildiz').classList.add('ui-sayiyor');
    uiSayTimer = setInterval(() => {
      n = Math.min(hedef, n + adim); el.textContent = n;
      if (n >= hedef) { uiSayDur(hedef); uiZipla(uiEl('sonuc-yildiz'), 1.3, 460, -5); }
    }, 55);
  }, 1900);
});
OLAY.on('durum', d => { if (d !== 'bitis') uiSayDur(); });

// ───────── Seçim ekranı (ayrı, tam ekran): pist adımı → araba adımı → yeşil düğme. Ekranı oyun.js açar (oyEkranAc, 'ekran' olayı); burada kartlar, rozetler,
// küçük pist resimleri, kaydırma ve ileri/geri var. Pist değişirse sayfa o pistle yeniden açılır ve doğrudan araba adımına gelir (?adim=araba). ─────────
const uiSec = uiEl('secim'), uiSecSahne = uiEl('sec-sahne');
const UI_SON_PIST = 'feza-yaris-pist';
let uiPistSecili = PIST_TEMA, uiSecGidiyor = false;
function uiSecZipla(el) { if (!el) return; el.classList.remove('sec-zipla'); void el.offsetWidth; el.classList.add('sec-zipla'); }
function uiYildizRozet(kart, n) {   // kartın sol altında: o pistte toplanan en çok yıldız (resim + rakam)
  if (!kart) return;
  let r = kart.querySelector('.ui-yrozet');
  if (!(n > 0)) { if (r) r.remove(); return; }
  if (!r) { r = document.createElement('i'); r.className = 'ui-yrozet'; r.setAttribute('aria-hidden', 'true'); r.innerHTML = '<svg viewBox="0 0 48 48"><use href="#ui-yildiz"/></svg><b></b>'; kart.appendChild(r); }
  r.lastChild.textContent = Math.floor(n);
}
function uiYildizOku(pist) {
  if (pist === PIST_TEMA) return uiKayit.yildiz;
  try { const k = JSON.parse(localStorage.getItem('feza-yaris-anilar-v1:' + pist) || '{}'); return Number.isFinite(k.yildiz) && k.yildiz > 0 ? Math.floor(k.yildiz) : 0; } catch (_) { return 0; }
}
function uiPistResim(kart) {   // gerçek pist görüntüsü (hazır dosya: icons/pist_<ad>.jpg) çizimin üstüne konur; dosya açılmazsa çizim kalır
  if (!kart || kart.querySelector('.pist-resim')) return;
  const im = document.createElement('img'); im.className = 'pist-resim'; im.alt = ''; im.draggable = false; im.decoding = 'async';
  im.addEventListener('error', () => im.remove(), { once: true });
  im.src = 'icons/pist_' + kart.dataset.pist + '.jpg';
  kart.insertBefore(im, kart.firstElementChild.nextSibling);
}
function uiPistIsaretle(pist, dokunus) {
  if (uiSecGidiyor) return;
  uiPistSecili = pist;
  document.querySelectorAll('.pist-kart').forEach(b => { const s = b.dataset.pist === pist; b.setAttribute('aria-pressed', s ? 'true' : 'false'); if (s && dokunus) uiSecZipla(b); });
  // kısa pist adı (uzun giriş cümlesi yarışa girerken zaten söylenir; iki kez duyulmasın)
  if (dokunus && typeof SES !== 'undefined' && SES.CUMLE && SES.CUMLE['ad_' + pist]) SES.soyle('ad_' + pist);
}
function uiSecArabaRenk() {   // üstteki küçük araba simgesi seçili arabanın renginde
  try { const id = oyAraba(); for (const t of ARABA_TIPLERI) if (t && t.id === id) uiSec.style.setProperty('--ar', uiRenk(t.renk, '#f2553f')); } catch (_) { /* süs */ }
}
function uiSecIleri() {
  if (uiSecGidiyor || typeof YARIS === 'undefined' || YARIS.durum !== 'baslik') return;
  if (uiSec.dataset.adim === 'araba') { YARIS.basla(); return; }
  try { localStorage.setItem(UI_SON_PIST, uiPistSecili); } catch (_) { /* kayıt isteğe bağlı */ }
  if (uiPistSecili === PIST_TEMA) { oyEkranAc('araba'); return; }
  uiSecGidiyor = true; uiSec.classList.add('sec-cikis');   // başka pist: yumuşakça kararıp o pistle yeniden açılır
  const u = new URL(location.href); u.searchParams.set('pist', uiPistSecili); u.searchParams.set('adim', 'araba'); u.searchParams.delete('atla');
  setTimeout(() => { location.href = u.href; }, 240);
}
function uiSecGeri() {
  if (uiSecGidiyor || typeof YARIS === 'undefined' || YARIS.durum !== 'baslik') return;
  if (typeof SES !== 'undefined') SES.sus();
  oyEkranAc(uiSec.dataset.adim === 'araba' ? 'pist' : 'acilis');
}
function uiArabaKaydir(yon) {   // +1 = sonraki, -1 = önceki araba (uçtan uca döner)
  const k = [...uiArabaSec.querySelectorAll('.araba-kart')]; if (k.length < 2) return;
  let i = k.findIndex(b => b.getAttribute('aria-pressed') === 'true'); if (i < 0) i = 0;
  const b = k[(i + yon + k.length) % k.length]; b.click();
}
uiEl('sec-ileri').addEventListener('click', uiSecIleri);
uiEl('sec-geri').addEventListener('click', uiSecGeri);
{ // araba sahnesi: sağa/sola kaydır ya da yandaki oklara dokun
  let pid = null, x0 = 0, ok = null;
  uiSecSahne.addEventListener('pointerdown', e => { if (pid !== null) return; pid = e.pointerId; x0 = e.clientX; ok = e.target.closest && e.target.closest('.sec-kay'); try { uiSecSahne.setPointerCapture(pid); } catch (_) { /* yedek: pointerup yine gelir */ } });
  const bitti = e => {
    if (e.pointerId !== pid) return; pid = null;
    if (e.type !== 'pointerup' || uiSec.dataset.adim !== 'araba') return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 45) uiArabaKaydir(dx < 0 ? 1 : -1);
    else if (ok) uiArabaKaydir(ok.classList.contains('sag') ? 1 : -1);
  };
  uiSecSahne.addEventListener('pointerup', bitti); uiSecSahne.addEventListener('pointercancel', bitti);
}
document.querySelectorAll('.pist-kart').forEach(b => {
  const sv = b.querySelector('svg'); if (sv) sv.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  uiYildizRozet(b, uiYildizOku(b.dataset.pist)); uiPistResim(b);
});
// ?kucuk (yalnız geliştirici): oyun.js bu pistin resmini çizer; resim dosyası üretmek için sayfada bırakılır.
OLAY.on('kucuk', veri => { window.uiKucukVeri = veri; });
// Eski sürüm resimleri tarayıcı kaydında tutuyordu (bu oyunun kendi küçük-resim anahtarları); artık gerekmez, yer açılır.
try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.indexOf('feza-yaris-kucuk-') === 0) localStorage.removeItem(k); } } catch (_) { /* kayıt isteğe bağlı */ }
OLAY.on('ekran', ad => {
  if (ad === 'pist') { uiPistIsaretle(uiPistSecili, false); uiOdak(document.querySelector('.pist-kart[aria-pressed=true]')); }
  else if (ad === 'araba') { uiArabaKur(); uiSecArabaRenk(); uiOdak(uiEl('sec-ileri')); }
  else if (ad === 'acilis') uiOdak(uiEl('oyna'));
});
OLAY.on('durum', d => { if (d === 'giris' || d === 'sayim') { try { localStorage.setItem(UI_SON_PIST, PIST_TEMA); } catch (_) { /* kayıt isteğe bağlı */ } } });
try { const u = new URL(location.href); if (u.searchParams.has('adim')) { u.searchParams.delete('adim'); history.replaceState(null, '', u.href); } } catch (_) { /* adres aynı kalabilir */ }

// ───────── Geri sayım bayrakları, yarışa geçiş perdesi, küçük sevinç parıltıları (yalnız olaylarda; kare başına iş yok) ─────────
const uiGit = uiEl('ui-git'), uiGecis = uiEl('ui-gecis');
let uiGitZ = 0, uiGecisZ = 0;
function uiParla(el) { if (!el) return; el.classList.remove('ui-parla'); void el.offsetWidth; el.classList.add('ui-parla'); }
OLAY.on('sayim', n => {
  clearTimeout(uiGitZ);
  if (n === 3) { uiGit.classList.remove('gizli'); uiGitZ = setTimeout(() => uiGit.classList.add('gizli'), 1500); }   // yeşil: iki yanda damalı bayrak sallanır
  else uiGit.classList.add('gizli');
});
OLAY.on('durum', d => {
  if (d !== 'sayim' && d !== 'yaris') { clearTimeout(uiGitZ); uiGit.classList.add('gizli'); }
  if (d === 'bitis' || d === 'baslik') uiEl('isiklar').classList.add('gizli');
  if (d === 'giris' || (d === 'sayim' && uiGecis.dataset.son !== 'giris')) {   // seçim ekranından yarışa: damalı perde yukarı kalkar
    clearTimeout(uiGecisZ); uiGecis.classList.remove('gizli'); uiGecis.classList.remove('ui-kalk'); void uiGecis.offsetWidth; uiGecis.classList.add('ui-kalk');
    uiGecisZ = setTimeout(() => uiGecis.classList.add('gizli'), 900);
  }
  uiGecis.dataset.son = d;
});
OLAY.on('yildiz', () => uiParla(uiEl('yildiz-kutu')));
OLAY.on('tur', () => uiParla(uiEl('turlar')));
OLAY.on('sira', n => { if (n === 1) uiParla(uiSira); });
OLAY.on('seri', o => { if (o && o.odul) uiParla(uiSeri); });

// ───────── Yarış sonu sıralaması: 1–5 satır (madalya + gerçek modelden yüz + araba). Veri YARIS.siralama()'dan (bitişteki gerçek sıra). Yazı yok. ─────────
const uiSiralama = uiEl('siralama');
const UI_MADALYA = ['', 'altin', 'gumus', 'bronz'];
function uiYuzYedek(kim, renk) {   // portre çekilemezse: renkli yuvarlak üstünde sade bir yüz
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="' + renk + '"/><circle cx="32" cy="34" r="19" fill="#f6ccb2" stroke="#17335c" stroke-width="2.6"/>' +
    '<circle cx="25" cy="33" r="2.6" fill="#17335c"/><circle cx="39" cy="33" r="2.6" fill="#17335c"/><path d="M25 41q7 6 14 0" fill="none" stroke="#17335c" stroke-width="2.6" stroke-linecap="round"/></svg>';
}
function uiSiralamaKur() {
  let liste = [];
  try { liste = (window.YARIS && YARIS.siralama) ? YARIS.siralama() : []; } catch (_) { liste = []; }
  uiSiralama.textContent = '';
  uiSiralama.classList.toggle('gizli', !liste.length);
  uiEl('sonuc').classList.toggle('sirali', liste.length > 0);
  uiSurucuYok = true;
  liste.forEach((x, i) => {
    const li = document.createElement('li'), renk = uiRenk(x.renk, '#f2553f'), kimRenk = x.kim === 'feza' ? '#ffd23f' : uiKimRenk({ tur: x.kim, renk: x.renk });
    li.className = 'sr-satir' + (x.oyuncu ? ' sr-feza' : '') + (x.sira <= 3 ? ' sr-' + UI_MADALYA[x.sira] : '');
    li.style.setProperty('--i', i); li.style.setProperty('--kr', kimRenk); li.style.setProperty('--ar', renk);
    li.setAttribute('aria-label', String(x.sira));
    const yuz = x.portre ? '<img alt="" draggable="false" src="' + x.portre + '">' : uiYuzYedek(x.kim, kimRenk);
    li.innerHTML = '<span class="sr-no"><b>' + x.sira + '</b></span><span class="sr-yuz">' + yuz + '</span><span class="sr-araba">' +
      uiArabaCiz(String(x.tip || 'kart'), renk, uiRenk(x.renk2, '#ffd23f')) + '</span>';
    uiSiralama.appendChild(li);
  });
  uiSurucuYok = false;
}
OLAY.on('sonuc', uiSiralamaKur);

// ───────── GARAJ, YILDIZ KAVANOZU ve HEDİYE KUTUSU (yazısız, rakamsız) ─────────
// Veri oyun.js'teki GARAJ'dan gelir (bu dosyadan sonra yüklenir: her kullanımda typeof ile bakılır; GARAJ ya da oyGarajAc yoksa garaj düğmesi gizli kalır).
// Resimler burada çizilir: uiSusCiz(tur, id) 30 süsün her biri için ayrı bir resim verir; kilitli süs = kapalı kurdeleli kutu (uiKutuCiz).
const UI_GJ_RENK = { mavi: '#3f8fe8', kirmizi: '#f2483a', yesil: '#49c25a', sari: '#ffd23c', pembe: '#ff7fb8', turuncu: '#ff9a2e', turkuaz: '#2fc4b2' };
const UI_GJ_GOK = ['#ff5b5b', '#ffa53d', '#ffe14d', '#5fd068', '#4aa8ee', '#a77bf3'];
const UI_L = 'stroke="#17335c" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const UI_ONAY = '<i class="gj-onay" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></i>';
const uiF = v => (+v).toFixed(1);
function uiYildizYol(cx, cy, R) {
  let d = '';
  for (let i = 0; i < 10; i++) { const r = i % 2 ? R * 0.46 : R, a = -Math.PI / 2 + i * Math.PI / 5; d += (i ? 'L' : 'M') + uiF(cx + Math.cos(a) * r) + ' ' + uiF(cy + Math.sin(a) * r); }
  return d + 'Z';
}
function uiKalpYol(cx, cy, s) {
  return 'M' + uiF(cx) + ' ' + uiF(cy + s * .95) + 'C' + uiF(cx - s * 1.7) + ' ' + uiF(cy - s * .1) + ' ' + uiF(cx - s * .75) + ' ' + uiF(cy - s * 1.35) + ' ' + uiF(cx) + ' ' + uiF(cy - s * .4) +
    'C' + uiF(cx + s * .75) + ' ' + uiF(cy - s * 1.35) + ' ' + uiF(cx + s * 1.7) + ' ' + uiF(cy - s * .1) + ' ' + uiF(cx) + ' ' + uiF(cy + s * .95) + 'Z';
}
function uiKutuCiz() {   // kapalı hediye kutusu: gövde + kapak (kapak ayrı grup: açılırken havaya uçar)
  return '<svg viewBox="0 0 96 96" aria-hidden="true"><g class="hd-govde"><rect x="16" y="44" width="64" height="43" rx="7" fill="var(--hk,#ff6b8f)" ' + UI_L + '/><path d="M41 45h14v41H41z" fill="#ffd23f" stroke="#17335c" stroke-width="2.4"/>' +
    '<path d="M22 52v26" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/></g>' +
    '<g class="hd-kapak"><rect x="10" y="30" width="76" height="18" rx="7" fill="var(--hk2,#ff8fab)" ' + UI_L + '/><path d="M41 31h14v16H41z" fill="#ffd23f" stroke="#17335c" stroke-width="2.4"/>' +
    '<path d="M48 30C41 13 24 11 23 21s14 11 25 9zM48 30c7-17 24-19 25-9s-14 11-25 9z" fill="#ffd23f" ' + UI_L + '/><circle cx="48" cy="29" r="5.5" fill="#f5a623" ' + UI_L + '/></g></svg>';
}
function uiKavanozCiz() {   // yıldız kavanozu: içindeki yıldız yığını --kv (0…1) kadar yükselir
  let y = '';
  const yer = [[9, 72], [27, 75], [46, 72], [18, 58], [37, 60], [52, 56], [9, 44], [28, 45], [47, 42], [17, 30], [37, 31], [50, 27], [9, 17], [29, 16], [47, 14]];
  for (const p of yer) y += '<use href="#ui-yildiz" x="' + p[0] + '" y="' + p[1] + '" width="23" height="23"/>';
  return '<svg viewBox="0 0 80 100" aria-hidden="true"><rect x="9" y="20" width="62" height="74" rx="19" fill="#eaf7ff" opacity=".86"/><g clip-path="url(#kv-kes)"><g class="kv-dolu"><rect x="9" y="20" width="62" height="80" fill="#ffe9a0"/>' + y + '</g></g>' +
    '<rect x="9" y="20" width="62" height="74" rx="19" fill="none" stroke="#17335c" stroke-width="4"/><path d="M19 42v28" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>' +
    '<rect x="19" y="6" width="42" height="15" rx="6" fill="#ff8a5c" stroke="#17335c" stroke-width="4"/></svg>';
}
function uiGarajResim() {   // garaj: kırmızı çatılı ev, açık kapıda araba, yanında boya fırçası
  return '<svg viewBox="0 0 96 96" aria-hidden="true"><g ' + UI_L + '><path d="M12 44h72v43H12z" fill="#fff4d4"/><path d="M5 47 48 12l43 35z" fill="#f36c52"/><path d="' + uiYildizYol(48, 33, 8) + '" fill="#ffd23f" stroke-width="2"/>' +
    '<rect x="22" y="52" width="52" height="35" rx="4" fill="#2b3a67"/><path d="M22 56q0-4 4-4h44q4 0 4 4v5H22z" fill="#b9c6d8"/>' +
    '<path d="M36 70l4-7h16l4 7" fill="#bfe9ff"/><rect x="29" y="69" width="38" height="15" rx="6" fill="#f2553f"/><circle cx="36" cy="76" r="3.4" fill="#ffe27a" stroke-width="2"/><circle cx="60" cy="76" r="3.4" fill="#ffe27a" stroke-width="2"/>' +
    '<path d="M33 86v3M63 86v3" stroke-width="6"/></g>' +
    '<g transform="rotate(38 80 60)"><path d="M80 36v26" stroke="#17335c" stroke-width="10" stroke-linecap="round"/><path d="M80 36v26" stroke="#ffb53d" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M72 62h16v10q0 12-8 16-8-4-8-16z" fill="#56bdf0" ' + UI_L + '/><path d="M72 62h16v6H72z" fill="#dfe6ee" ' + UI_L + '/></g></svg>';
}
function uiBoyaResim() {   // boya kategorisi: boya kovası + fırça + renk damlaları
  return '<svg viewBox="0 0 96 96" aria-hidden="true"><g ' + UI_L + '><path d="M16 46Q41 12 66 46" fill="none" stroke-width="4"/><path d="M14 46h54l-6 40H20z" fill="#dfe6ee"/><ellipse cx="41" cy="46" rx="27" ry="8" fill="#ff5fa2"/>' +
    '<path d="M52 52v15a5.5 5.5 0 0 0 11 0V51" fill="#ff5fa2"/></g>' +
    '<g transform="rotate(35 74 40)"><path d="M74 6v30" stroke="#17335c" stroke-width="11" stroke-linecap="round"/><path d="M74 6v30" stroke="#ffb53d" stroke-width="5.5" stroke-linecap="round"/>' +
    '<path d="M65 36h18v9q0 13-9 18-9-5-9-18z" fill="#4aa8ee" ' + UI_L + '/><path d="M65 36h18v6H65z" fill="#fff" ' + UI_L + '/></g>' +
    '<circle cx="82" cy="76" r="6.5" fill="#ffd23c" ' + UI_L + '/><circle cx="72" cy="88" r="4.5" fill="#5fd068" ' + UI_L + '/></svg>';
}
function uiSusCiz(tur, id, girdi) {
  const C = 'cx="48" cy="48"';
  let g = '';
  if (tur === 'renk') {
    if (id === 'varsayilan') {   // arabanın kendi rengi: seçili arabanın küçük resmi
      try { const a = oyAraba(); for (const t of ARABA_TIPLERI) if (t && t.id === a) return uiArabaCiz(String(a), uiRenk(t.renk, '#f2553f'), uiRenk(t.renk2, '#ffd23f')); } catch (_) { /* yedek aşağıda */ }
      return uiArabaCiz('kart', '#f2553f', '#ffd23f');
    }
    const damla = 'M48 9C62 29 77 44 77 60a29 29 0 0 1-58 0C19 44 34 29 48 9z';
    if (id === 'gokkusagi') {
      g = '<g clip-path="url(#gj-damla-kes)">'; UI_GJ_GOK.forEach((c, i) => { g += '<rect x="14" y="' + (5 + i * 14.5) + '" width="68" height="15.5" fill="' + c + '"/>'; });
      g += '</g><path d="' + damla + '" fill="none" ' + UI_L + '/>';
    } else g = '<path d="' + damla + '" fill="' + uiRenk(girdi && girdi.renk, UI_GJ_RENK[id] || '#56bdf0') + '" ' + UI_L + '/>';
    g += '<path d="M32 64q-1-11 8-23" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/>';
  } else if (tur === 'teker') {
    const lastik = c => '<circle ' + C + ' r="39" fill="' + c + '" ' + UI_L + '/>', jant = c => '<circle ' + C + ' r="26" fill="' + c + '" stroke="#17335c" stroke-width="2.6"/>';
    const kol = (n, r, c, w) => { let s = ''; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; s += 'M48 48L' + uiF(48 + Math.cos(a) * r) + ' ' + uiF(48 + Math.sin(a) * r); } return '<path d="' + s + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" fill="none"/>'; };
    if (id === 'yildiz') g = lastik('#2b3550') + jant('#56bdf0') + '<path d="' + uiYildizYol(48, 49, 21) + '" fill="#ffd23f" stroke="#17335c" stroke-width="2.4" stroke-linejoin="round"/>';
    else if (id === 'cicek') {
      g = lastik('#2b3550') + jant('#c9f2a8');
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g += '<circle cx="' + uiF(48 + Math.cos(a) * 13.5) + '" cy="' + uiF(48 + Math.sin(a) * 13.5) + '" r="8.6" fill="#ff8fc0" stroke="#17335c" stroke-width="2"/>'; }
      g += '<circle ' + C + ' r="7.5" fill="#ffd23f" stroke="#17335c" stroke-width="2"/>';
    } else if (id === 'gokkusagi') { g = lastik('#2b3550'); UI_GJ_GOK.forEach((c, i) => { g += '<circle ' + C + ' r="' + (26 - i * 4.2) + '" fill="' + c + '"/>'; }); g += '<circle ' + C + ' r="26" fill="none" stroke="#17335c" stroke-width="2.6"/>'; }
    else if (id === 'altin') g = lastik('#2b3550') + jant('#ffd23f') + '<circle ' + C + ' r="18" fill="#f5a623"/>' + kol(6, 24, '#a86400', 4) + '<circle ' + C + ' r="7" fill="#fff3b0" stroke="#a86400" stroke-width="2.4"/>' +
      '<path d="M70 12l2.6 7.4 7.4 2.6-7.4 2.6-2.6 7.4-2.6-7.4-7.4-2.6 7.4-2.6z" fill="#fff" stroke="#17335c" stroke-width="2" stroke-linejoin="round"/>';
    else if (id === 'seker') {
      g = lastik('#ff7fb8') + jant('#fff');
      for (let i = 0; i < 6; i += 2) { const a = i * Math.PI / 3 - .3, b = a + Math.PI / 3; g += '<path d="M48 48L' + uiF(48 + Math.cos(a) * 25) + ' ' + uiF(48 + Math.sin(a) * 25) + 'A25 25 0 0 1 ' + uiF(48 + Math.cos(b) * 25) + ' ' + uiF(48 + Math.sin(b) * 25) + 'Z" fill="#ff4f8f"/>'; }
      g += '<circle ' + C + ' r="26" fill="none" stroke="#17335c" stroke-width="2.6"/><circle ' + C + ' r="6" fill="#fff" stroke="#17335c" stroke-width="2.4"/>';
    } else g = lastik('#2b3550') + jant('#dfe6ee') + kol(5, 23, '#8d9bb0', 5) + '<circle ' + C + ' r="7.5" fill="#9aa7b8" stroke="#17335c" stroke-width="2.4"/>';
  } else if (tur === 'bayrak') {
    g = '<ellipse cx="48" cy="90" rx="13" ry="3.6" fill="#17335c" opacity=".18"/><path d="M48 90V42" fill="none" stroke="#17335c" stroke-width="5" stroke-linecap="round"/>';
    if (id === 'yildiz') g += '<path d="' + uiYildizYol(48, 31, 25) + '" fill="#ffd23f" ' + UI_L + '/>';
    else if (id === 'kalp') g += '<path d="' + uiKalpYol(48, 31, 18) + '" fill="#ff5a7a" ' + UI_L + '/><path d="M36 24q2-6 8-6" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>';
    else if (id === 'balon') g += '<path d="M48 50l-5 7h10z" fill="#f2483a" ' + UI_L + '/><ellipse cx="48" cy="28" rx="19" ry="23" fill="#f2483a" ' + UI_L + '/><path d="M38 22q2-8 9-10" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".7"/>';
    else if (id === 'firildak') { ['#f2483a', '#ffd23c', '#49c25a', '#3f8fe8'].forEach((c, i) => { g += '<path transform="rotate(' + i * 90 + ' 48 31)" d="M48 31V5q20 5 13 26z" fill="' + c + '" ' + UI_L + '/>'; }); g += '<circle cx="48" cy="31" r="5" fill="#fff" ' + UI_L + '/>'; }
    else if (id === 'pati') g += '<g fill="#b5764f" ' + UI_L + '><ellipse cx="48" cy="39" rx="16" ry="12.5"/><circle cx="28" cy="25" r="6.5"/><circle cx="41" cy="14" r="7"/><circle cx="55" cy="14" r="7"/><circle cx="68" cy="25" r="6.5"/></g><ellipse cx="48" cy="41" rx="8" ry="5.5" fill="#ffb3c7"/>';
    else g += '<circle cx="48" cy="38" r="8" fill="#c9d3df" ' + UI_L + '/>';   // yok: yalın anten
  } else if (tur === 'iz') {
    const yer = [[21, 70, .55], [44, 53, .8], [71, 31, 1.15]];
    if (id === 'gokkusagi') UI_GJ_GOK.slice(0, 5).forEach((c, i) => { g += '<path d="M7 ' + (30 + i * 9) + 'q20-17 41 0t41 0" fill="none" stroke="' + c + '" stroke-width="9.5" stroke-linecap="round"/>'; });
    else if (id === 'yildiz') for (const p of yer) g += '<path d="' + uiYildizYol(p[0], p[1], 17 * p[2]) + '" fill="#ffd23f" ' + UI_L + '/>';
    else if (id === 'baloncuk') for (const p of yer) g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + uiF(16 * p[2]) + '" fill="#cfefff" stroke="#3f8fe8" stroke-width="3"/><path d="M' + uiF(p[0] - 9 * p[2]) + ' ' + uiF(p[1] - 2 * p[2]) + 'q1-' + uiF(7 * p[2]) + ' ' + uiF(7 * p[2]) + '-' + uiF(8 * p[2]) + '" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>';
    else if (id === 'kalp') for (const p of yer) g += '<path d="' + uiKalpYol(p[0], p[1], 12.5 * p[2]) + '" fill="#ff5a7a" ' + UI_L + '/>';
    else g = '<circle ' + C + ' r="27" fill="none" stroke="#9fb0c6" stroke-width="5" stroke-dasharray="1 12" stroke-linecap="round"/>';   // yok: boş halka
  } else if (tur === 'korna') {
    const dalga = '<path d="M83 42q5 14 0 28M90 34q8 22 0 44" fill="none" stroke="#17335c" stroke-width="3.5" stroke-linecap="round"/>';
    if (id === 'ordek') g = '<g ' + UI_L + '><path d="M18 56 6 46l16 3z" fill="#ffd23c"/><ellipse cx="44" cy="64" rx="29" ry="20" fill="#ffd23c"/><circle cx="64" cy="35" r="18" fill="#ffd23c"/><path d="M79 31l14 6-14 7z" fill="#ff8a2e"/>' +
      '<path d="M28 62q13-11 26 0-11 12-26 0z" fill="#f5b400"/></g><circle cx="68" cy="31" r="3.4" fill="#17335c"/><circle cx="60" cy="41" r="4" fill="#ff9fb5" opacity=".8"/>';
    else if (id === 'tren') g = '<g ' + UI_L + '><circle cx="29" cy="15" r="7.5" fill="#fff"/><circle cx="43" cy="9" r="5" fill="#fff"/><rect x="22" y="26" width="13" height="20" rx="2" fill="#2b3550"/>' +
      '<rect x="10" y="44" width="50" height="29" rx="7" fill="#f2483a"/><rect x="52" y="24" width="30" height="49" rx="6" fill="#3f8fe8"/><rect x="59" y="31" width="16" height="15" rx="3" fill="#bfe9ff"/><path d="M48 21h38v6H48z" fill="#ffd23c"/>' +
      '<path d="M10 73 4 82h12z" fill="#ffd23c"/></g>' + uiTeker(27, 78, 9, '#ffd23c') + uiTeker(49, 78, 9, '#ffd23c') + uiTeker(71, 78, 9, '#ffd23c');
    else if (id === 'zil') g = '<g ' + UI_L + '><circle cx="48" cy="80" r="7.5" fill="#f5a623"/><path d="M48 14c-15 0-23 12-23 27v17l-9 14h64l-9-14V41c0-15-8-27-23-27z" fill="#ffd23c"/><circle cx="48" cy="12" r="5.5" fill="#f5a623"/>' +
      '<path d="M10 28q-6 11 0 22M86 28q6 11 0 22" fill="none"/></g><path d="M35 34q2-9 9-11" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".75"/>';
    else if (id === 'fil') g = '<g ' + UI_L + '><ellipse cx="25" cy="42" rx="17" ry="23" fill="#8aa0c8"/></g><ellipse cx="26" cy="44" rx="9" ry="14" fill="#ffb3c7"/>' +
      '<path d="M58 60q4 26 20 14 9-8 7-27" fill="none" stroke="#17335c" stroke-width="20" stroke-linecap="round"/><g ' + UI_L + '><circle cx="50" cy="44" r="25" fill="#a9bcdc"/></g>' +
      '<path d="M58 60q4 26 20 14 9-8 7-27" fill="none" stroke="#a9bcdc" stroke-width="14" stroke-linecap="round"/><circle cx="55" cy="39" r="3.6" fill="#17335c"/><circle cx="44" cy="52" r="4.5" fill="#ff9fb5" opacity=".8"/>';
    else g = '<g ' + UI_L + '><circle cx="19" cy="56" r="14" fill="#e8483a"/><path d="M30 49l16-3v20l-16-3z" fill="#f5a623"/><path d="M46 44 72 28v56L46 68z" fill="#ffc531"/><ellipse cx="72" cy="56" rx="7" ry="28" fill="#ffe27a"/></g>' +
      '<path d="M12 50q3-6 9-6" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>' + dalga;   // dat: klasik lastik korna
  }
  return '<svg viewBox="0 0 96 96" aria-hidden="true">' + g + '</svg>';
}

const uiGj = uiEl('garaj'), uiGjKartlar = uiEl('garaj-kartlar'), uiGjAc = uiEl('garaj-ac'), uiGjEl = uiEl('garaj-el');
const uiHd = uiEl('hediye'), uiHdKutu = uiEl('hediye-kutu'), uiHdSus = uiEl('hediye-sus'), uiHdGaraj = uiEl('hediye-garaj'), uiSonucKv = uiEl('sonuc-kv');
const UI_GJ_EL_KAYIT = 'feza-yaris-garaj-el';
let uiGjTur = 'renk', uiGjElAnim = null, uiGjElZ = 0, uiHdZ = 0, uiKvOlay = null, uiKvZ = [];
function uiGarajVar() { return typeof GARAJ !== 'undefined' && !!GARAJ && !!GARAJ.katalog && typeof GARAJ.sec === 'function' && typeof GARAJ.sahip === 'function'; }
function uiSoyle(k) { try { if (typeof SES !== 'undefined' && SES.CUMLE && SES.CUMLE[k]) SES.soyle(k); } catch (_) { /* ses isteğe bağlı */ } }
function uiGjBekleyen() { try { return uiGarajVar() && typeof GARAJ.hediyeBekleyen === 'function' ? GARAJ.hediyeBekleyen() : 0; } catch (_) { return 0; } }
function uiKvOran() { try { return uiGarajVar() && typeof GARAJ.kavanoz === 'function' ? clamp(+GARAJ.kavanoz().oran || 0, 0, 1) : 0; } catch (_) { return 0; } }
function uiKvAyar(el, oran) { if (el) el.style.setProperty('--kv', clamp(+oran || 0, 0, 1).toFixed(3)); }
function uiYeniden(el, sinif) { if (!el) return; el.classList.remove(sinif); void el.offsetWidth; el.classList.add(sinif); }
// Başlıktaki garaj düğmesi + kavanoz: GARAJ ve oyGarajAc hazırsa görünür; bekleyen hediye varsa düğme parlar ve üstünde küçük kutu zıplar.
function uiGarajBaslikAyar() {
  const hazir = uiGarajVar() && typeof oyGarajAc === 'function';
  uiEl('garaj-kose').classList.toggle('gizli', !hazir);
  if (!hazir) return;
  uiGjAc.classList.toggle('gj-hediye', uiGjBekleyen() > 0);
  const o = uiKvOran(); uiKvAyar(uiEl('garaj-kavanoz'), o); uiKvAyar(uiEl('garaj-kv'), o);
}
function uiGjGirdiler(tur) {
  const k = uiGarajVar() ? GARAJ.katalog[tur] : null;
  return Array.isArray(k) ? k.map(x => (typeof x === 'string' ? { id: x } : x)).filter(x => x && x.id) : [];
}
function uiGarajKartlar(tur) {
  if (!uiGarajVar()) return;
  uiGjTur = tur; uiGjKartlar.dataset.tur = tur;
  uiGj.querySelectorAll('.gj-tur').forEach(b => b.setAttribute('aria-pressed', b.dataset.tur === tur ? 'true' : 'false'));
  uiGjKartlar.textContent = '';
  const secili = GARAJ.secili(tur), girdiler = uiGjGirdiler(tur), n = girdiler.length;
  uiGjKartlar.style.setProperty('--gn', Math.max(1, n)); uiGjKartlar.style.setProperty('--gn2', Math.max(1, n > 5 ? Math.ceil(n / 2) : n));   // yatayda tek sıra, dikeyde çok süs iki dengeli sıra
  girdiler.forEach((x, i) => {
    const b = document.createElement('button'), sahip = GARAJ.sahip(tur, x.id);
    b.className = 'gj-kart' + (sahip ? '' : ' kilitli'); b.dataset.id = x.id; b.style.setProperty('--i', i);
    b.setAttribute('aria-label', sahip ? tur + ' ' + x.id : 'Hediye kutusu'); b.setAttribute('aria-pressed', sahip && x.id === secili ? 'true' : 'false');
    b.innerHTML = (sahip ? uiSusCiz(tur, x.id, x) : uiKutuCiz()) + UI_ONAY;
    b.addEventListener('click', () => uiGarajDokun(b, tur, x.id));
    uiGjKartlar.appendChild(b);
  });
}
function uiGarajDokun(b, tur, id) {
  uiGjElDur(true);
  if (!GARAJ.sahip(tur, id)) {   // kapalı kutu: bekleyen hediye varsa açılır; yoksa sallanır ve anlatıcı ne yapılacağını söyler
    if (uiGjBekleyen() > 0) { uiHediyeGoster('garaj'); return; }
    if (b.animate) b.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-9deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(4deg)' }, { transform: 'rotate(0)' }], { duration: 520, easing: 'ease-in-out' });
    uiSoyle('garaj_kilit'); return;
  }
  let oldu = false;
  try { oldu = GARAJ.sec(tur, id) !== false; } catch (_) { oldu = false; }
  if (!oldu) return;
  uiGjKartlar.querySelectorAll('.gj-kart').forEach(k => k.setAttribute('aria-pressed', k === b ? 'true' : 'false'));
  uiYeniden(b, 'gj-piril'); uiZipla(b.firstElementChild, 1.25, 420, -6);
  if (tur === 'korna') { try { if (typeof SES !== 'undefined' && SES.efekt && typeof SES.efekt.korna === 'function') SES.efekt.korna(id); } catch (_) { /* önizleme isteğe bağlı */ } }
}
// İlk girişte yazısız ipucu: bir el önce seçili kategoriye, sonra takılabilecek bir karta dokunur (çocuk bir karta dokunana kadar her girişte yeniden gösterilir).
function uiGjElDur(ogrendi) {
  clearTimeout(uiGjElZ); if (uiGjElAnim) { uiGjElAnim.cancel(); uiGjElAnim = null; }
  uiGjEl.classList.add('gizli');
  if (ogrendi) { try { localStorage.setItem(UI_GJ_EL_KAYIT, '1'); } catch (_) { /* kayıt isteğe bağlı */ } }
}
function uiGjElIpucu() {
  uiGjElDur(false);
  try { if (localStorage.getItem(UI_GJ_EL_KAYIT)) return; } catch (_) { /* kayıt yoksa ipucu gösterilir */ }
  uiGjElZ = setTimeout(() => {
    const tur = uiGj.querySelector('.gj-tur[aria-pressed=true]'), kart = uiGjKartlar.querySelector('.gj-kart:not(.kilitli)[aria-pressed=false]') || uiGjKartlar.querySelector('.gj-kart');
    if (!tur || !kart || uiGj.classList.contains('gizli') || !uiGjEl.animate) return;
    const a = tur.getBoundingClientRect(), b = kart.getBoundingClientRect();
    const p = r => 'translate(' + Math.round(r.left + r.width * .5 - 30) + 'px,' + Math.round(r.top + r.height * .55 - 14) + 'px)';
    uiGjEl.classList.remove('gizli');
    uiGjElAnim = uiGjEl.animate([
      { transform: p(a) + ' scale(1.15)', opacity: 0 }, { transform: p(a) + ' scale(1.15)', opacity: 1, offset: .1 }, { transform: p(a) + ' scale(.92)', opacity: 1, offset: .2 },
      { transform: p(a) + ' scale(1.15)', opacity: 1, offset: .32 }, { transform: p(b) + ' scale(1.15)', opacity: 1, offset: .6 }, { transform: p(b) + ' scale(.92)', opacity: 1, offset: .7 },
      { transform: p(b) + ' scale(1.15)', opacity: 1, offset: .82 }, { transform: p(b) + ' scale(1.15)', opacity: 0 }], { duration: 3400, iterations: 3, easing: 'ease-in-out' });
    uiGjElAnim.onfinish = () => uiGjEl.classList.add('gizli');
  }, 1300);
}
// Hediye kutusu (sonuç ekranında ve garajda aynı): zıplar → dokununca (ya da 6 sn sonra kendiliğinden) açılır → içinden süsün resmi çıkar.
function uiHediyeKapat() { clearTimeout(uiHdZ); uiHdZ = 0; uiHd.className = 'gizli'; }
function uiHediyeGoster(yer) {
  if (!(uiGjBekleyen() > 0)) return;
  clearTimeout(uiHdZ);
  uiHd.dataset.yer = yer; uiHd.className = 'hd-bekle';
  uiHdKutu.classList.remove('gizli'); uiHdSus.classList.add('gizli'); uiHdGaraj.classList.add('gizli');
  uiSoyle('hediye_var');
  uiHdZ = setTimeout(uiHediyeAc, 6000);
}
function uiHediyeAc() {
  clearTimeout(uiHdZ);
  if (uiHd.className !== 'hd-bekle') return;
  let r = null;
  try { r = GARAJ.hediyeAc(); } catch (_) { r = null; }
  if (!r || !r.tur) { uiHediyeKapat(); uiGarajBaslikAyar(); return; }
  const yer = uiHd.dataset.yer, girdi = uiGjGirdiler(r.tur).find(x => x.id === r.id);
  uiHd.className = 'hd-aciliyor';
  uiHdSus.innerHTML = '<i class="hd-isin"></i><div class="hd-kart">' + uiSusCiz(r.tur, r.id, girdi) + '</div>';
  uiHdZ = setTimeout(() => {
    uiHd.className = 'hd-acik';
    uiHdKutu.classList.add('gizli'); uiHdSus.classList.remove('gizli'); uiHdGaraj.classList.toggle('gizli', yer !== 'sonuc' || typeof oyGarajAc !== 'function');
    uiSoyle('hediye_acildi'); uiGarajBaslikAyar();
    if (uiSonucKv.firstElementChild) uiKvAyar(uiSonucKv.firstElementChild, uiKvOran());
    if (yer === 'garaj') uiGarajKartlar(r.tur);
    uiHdZ = setTimeout(() => { if (uiGjBekleyen() > 0) uiHediyeGoster(yer); else if (yer === 'garaj') uiHediyeKapat(); }, yer === 'garaj' ? 2800 : 3600);
  }, 700);
}
// Sonuç ekranı: toplanan yıldızlar sayaçtan kavanoza uçar, kavanoz dolar; dolduysa içinden hediye kutusu çıkar.
const uiKvUcan = [];
for (let i = 0; i < 7; i++) {
  const el = document.createElement('div'); el.className = 'ui-ucan-yildiz'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<svg viewBox="0 0 48 48"><use href="#ui-yildiz"/></svg>'; document.body.appendChild(el); uiKvUcan.push({ el, anim: null });
}
function uiKvTemizle() { for (const z of uiKvZ) clearTimeout(z); uiKvZ.length = 0; for (const p of uiKvUcan) if (p.anim) { p.anim.cancel(); p.anim = null; } }
function uiKvUcur() {
  const a = uiEl('sonuc-yildiz').getBoundingClientRect(), b = uiSonucKv.getBoundingClientRect();
  if (a.width < 2 || b.width < 2) return;
  const x = a.left + Math.min(30, a.width * .3) - 20, y = a.top + a.height * .5 - 20, dx = b.left + b.width * .5 - 20 - x, dy = b.top + b.height * .45 - 20 - y;
  uiKvUcan.forEach((p, i) => {
    if (!p.el.animate) return;
    p.el.style.left = x + 'px'; p.el.style.top = y + 'px';
    p.anim = p.el.animate([{ opacity: 0, transform: 'translate(0,0) scale(.6)' }, { opacity: 1, transform: 'translate(' + uiF(dx * .12) + 'px,' + uiF(dy * .12 - 30) + 'px) scale(1.25)', offset: .15 },
      { opacity: 1, transform: 'translate(' + uiF(dx * .6) + 'px,' + uiF(dy * .6 - 90 - (i % 3) * 26) + 'px) scale(1.35) rotate(140deg)', offset: .6 },
      { opacity: 0, transform: 'translate(' + uiF(dx) + 'px,' + uiF(dy) + 'px) scale(.5) rotate(300deg)' }], { duration: 900, delay: i * 130, easing: 'ease-in-out' });
    uiKvZ.push(setTimeout(() => { try { if (typeof SES !== 'undefined' && SES.efekt && typeof SES.efekt.kavanoz === 'function') SES.efekt.kavanoz(); } catch (_) { /* ses isteğe bağlı */ } }, i * 130 + 860));   // her yıldız kavanoza düşerken tık
  });
}
OLAY.on('kavanoz', o => { if (o) uiKvOlay = { once: +o.once || 0, sonra: +o.sonra || 0, hediye: +o.hediye || 0, eklenen: +o.eklenen || 0 }; });
OLAY.on('sonuc', () => {
  uiKvTemizle(); uiHediyeKapat();
  uiSonucKv.classList.toggle('gizli', !uiGarajVar());
  if (!uiGarajVar()) return;
  const kap = uiSonucKv.firstElementChild, simdi = uiKvOran(), o = uiKvOlay || { once: simdi, sonra: simdi, hediye: 0, eklenen: 0 };
  uiKvOlay = null;
  uiKvAyar(kap, o.once);
  const ucus = o.eklenen > 0 || o.sonra !== o.once || o.hediye > 0;
  if (ucus) {
    uiKvZ.push(setTimeout(uiKvUcur, 2300));
    uiKvZ.push(setTimeout(() => { uiKvAyar(kap, o.hediye > 0 ? 1 : o.sonra); uiZipla(uiSonucKv, 1.14, 520, -3); }, 3050));
  }
  if (o.hediye > 0 || uiGjBekleyen() > 0) uiKvZ.push(setTimeout(() => { uiZipla(uiSonucKv, 1.2, 420, 4); uiHediyeGoster('sonuc'); }, ucus ? 4500 : 2600));
});
OLAY.on('hediye', () => { uiGarajBaslikAyar(); });
OLAY.on('garaj', o => {   // süs başka yerden değişirse açık kartlar güncel kalsın
  if (!o || uiGj.classList.contains('gizli') || o.tur !== uiGjTur) return;
  uiGjKartlar.querySelectorAll('.gj-kart').forEach(k => { if (!k.classList.contains('kilitli')) k.setAttribute('aria-pressed', k.dataset.id === o.id ? 'true' : 'false'); });
});
OLAY.on('durum', d => {
  const garajda = d === 'garaj';
  uiGj.classList.toggle('gizli', !garajda || !uiGarajVar()); document.body.classList.toggle('ui-garajda', garajda);
  if (d !== 'bitis') { uiKvTemizle(); uiSonucKv.classList.add('gizli'); }
  if (d !== 'bitis' && d !== 'garaj') uiHediyeKapat();
  if (garajda && uiGarajVar()) {
    uiHediyeKapat(); uiGarajKartlar(uiGjTur); uiGarajBaslikAyar(); uiOdak(uiEl('garaj-kapat'));
    if (uiGjBekleyen() > 0) { clearTimeout(uiHdZ); uiHdZ = setTimeout(() => uiHediyeGoster('garaj'), 1100); } else uiGjElIpucu();
  } else uiGjElDur(false);
  if (d === 'baslik') uiGarajBaslikAyar();
});
// kurulum: resimler bir kez yerleştirilir; düğmeler bağlanır
(function uiGarajKur() {
  uiGjAc.querySelector('.gj-resim').innerHTML = uiGarajResim(); uiGjAc.querySelector('.gj-kutucuk').innerHTML = uiKutuCiz();
  document.querySelectorAll('.kv-kap').forEach(k => { k.innerHTML = uiKavanozCiz(); });
  uiHdKutu.innerHTML = uiKutuCiz(); uiHdGaraj.innerHTML = uiGarajResim();
  const turResim = { renk: uiBoyaResim(), teker: uiSusCiz('teker', 'yildiz'), bayrak: uiSusCiz('bayrak', 'yildiz'), iz: uiSusCiz('iz', 'yildiz'), korna: uiSusCiz('korna', 'dat') };
  uiGj.querySelectorAll('.gj-tur').forEach(b => {
    b.innerHTML = turResim[b.dataset.tur] || ''; b.setAttribute('aria-pressed', b.dataset.tur === uiGjTur ? 'true' : 'false');
    b.addEventListener('click', () => { uiGjElDur(false); uiGarajKartlar(b.dataset.tur); uiZipla(b.firstElementChild, 1.2, 380, -6); });
  });
  uiGjAc.addEventListener('click', () => { if (typeof oyGarajAc === 'function') oyGarajAc(); });
  uiEl('garaj-kapat').addEventListener('click', () => { uiHediyeKapat(); if (typeof oyGarajKapat === 'function') oyGarajKapat(); });
  uiHdKutu.addEventListener('click', uiHediyeAc);
  uiHdGaraj.addEventListener('click', () => {
    if (typeof oyGarajAc !== 'function' || typeof YARIS === 'undefined') return;
    uiHediyeKapat(); YARIS.basligaDon(); oyGarajAc();
  });
  // oyun.js bu dosyadan sonra yüklenir: düğmenin görünürlüğü bütün betikler hazır olunca belirlenir
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', uiGarajBaslikAyar); else uiGarajBaslikAyar();
})();

// Etkin sürprizin kalan süresi: üst ortada azalan renkli halka (yazısız). Olaylar oyun.js'ten: surpriz {tur,sure}, surprizBitti.
(() => {
  const hud = document.getElementById('hud'); if (!hud || typeof OLAY === 'undefined') return;
  const el = document.createElement('div'); el.id = 'ui-guc'; el.className = 'gizli'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<svg viewBox="0 0 44 44"><circle class="ui-guc-zemin" cx="22" cy="22" r="20"/><circle class="ui-guc-halka" cx="22" cy="22" r="16"/><circle class="ui-guc-ic" cx="22" cy="22" r="8"/></svg>';
  hud.appendChild(el);
  const halka = el.querySelector('.ui-guc-halka'), RENK = { dev: '#ff8a2a', baloncuk: '#2fc4d6', gokkusagi: '#9a6bff', miknatis: '#3bbf5c' };
  OLAY.on('surpriz', o => { el.style.setProperty('--gr', RENK[o.tur] || '#ffb02e'); el.style.setProperty('--gs', (o.sure || 4.5) + 's'); el.classList.remove('gizli'); halka.style.animation = 'none'; void halka.getBoundingClientRect(); halka.style.animation = ''; });
  OLAY.on('surprizBitti', () => el.classList.add('gizli'));
  OLAY.on('durum', d => { if (d !== 'yaris') el.classList.add('gizli'); });
  OLAY.on('mola', m => document.body.classList.toggle('ui-mola', !!m));
})();
