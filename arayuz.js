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
document.querySelectorAll('.pist-kart').forEach(b => {
  const secili = b.dataset.pist === PIST_TEMA; b.setAttribute('aria-pressed', secili ? 'true' : 'false');
  uiRozetAyar(b, uiRozetOku(b.dataset.pist));
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
  const iyiSira = o.sira >= 1 && o.sira <= 3 && (!uiKayit.sira || o.sira < uiKayit.sira);
  if (yeni) uiKayit.yildiz = o.yildiz;
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
  if (d === 'baslik') { document.body.classList.remove('ui-durmus'); uiEl('hud').inert = false; uiOdak(document.querySelector('.pist-kart[aria-pressed=true]')); }
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
// Yandan görünüş (sağa bakar), 96×60. c1 = gövde, c2 = süs rengi.
function uiArabaCiz(id, c1, c2) {
  const cam = '#bfe9ff';
  let g;
  if (id === 'kart') {
    g = '<g ' + UI_CIZGI + '><rect x="11" y="27" width="13" height="12" rx="3" fill="#9aa7b8"/><path d="M27 39V25q0-5 5-5h5v19z" fill="' + c2 + '"/>' +
      '<path d="M12 39h60q11 0 13 8v2H10v-6q0-4 2-4z" fill="' + c1 + '"/><path d="M62 39 55 25" fill="none" stroke-width="3.4"/><circle cx="54" cy="23" r="5" fill="' + c2 + '"/>' +
      '<path d="M76 39l8-7h5v9" fill="' + c2 + '"/></g>' + uiTeker(24, 48, 9.5, c2) + uiTeker(70, 49, 8.5, c2);
  } else if (id === 'yaris') {
    g = '<g ' + UI_CIZGI + '><path d="M5 17h17v7H5zM11 24h6v11h-6z" fill="' + c2 + '"/>' +
      '<path d="M7 46q0-9 10-10l17-3q9-11 23-10 10 1 15 10l14 3q6 2 6 9v3H7z" fill="' + c1 + '"/><path d="M39 32q7-8 17-7 7 1 10 7z" fill="' + cam + '"/>' +
      '<path d="M7 42h85" fill="none" stroke="' + c2 + '" stroke-width="3.4"/><circle cx="50" cy="40" r="6" fill="#fff"/></g>' + uiTeker(25, 48, 9.5, c2) + uiTeker(74, 48, 9.5, c2);
  } else if (id === 'cip') {
    g = '<g ' + UI_CIZGI + '><path d="M27 21 32 7h27l8 14z" fill="' + c1 + '"/><path d="M33 19l3-8h8v8zM48 11h9l5 8H48z" fill="' + cam + '"/>' +
      '<rect x="9" y="20" width="78" height="16" rx="6" fill="' + c1 + '"/><rect x="5" y="23" width="7" height="12" rx="3" fill="#2b3550"/><path d="M80 25h7" fill="none" stroke="#ffe14d" stroke-width="5"/>' +
      '<path d="M14 30h68" fill="none" stroke="' + c2 + '" stroke-width="3.4"/><path d="M36 7V4h20v3" fill="none" stroke-width="3"/></g>' + uiTeker(25, 43, 14, c2) + uiTeker(71, 43, 14, c2);
  } else if (id === 'roket') {
    g = '<g ' + UI_CIZGI + '><path d="M20 27 3 35l17 8z" fill="#ffb53d"/><path d="M20 31l-9 4 9 4z" fill="#ffe14d" stroke="none"/>' +
      '<path d="M22 22 13 9h15l11 13zM22 46l-8 9h13l9-9z" fill="' + c2 + '"/><path d="M20 22h44q20 2 28 12-8 10-28 12H20z" fill="' + c1 + '"/>' +
      '<path d="M66 22q18 3 26 12-8 9-26 12z" fill="' + c2 + '"/><circle cx="47" cy="34" r="7.5" fill="' + cam + '"/><path d="M28 23v22" fill="none" stroke="' + c2 + '" stroke-width="3.4"/></g>' +
      uiTeker(34, 51, 6.5, c2) + uiTeker(66, 51, 6.5, c2);
  } else if (id === 'dondurma') {
    g = '<g ' + UI_CIZGI + '><path d="M30 6l7 13 7-13z" fill="#e8a95b"/><circle cx="37" cy="5" r="6.5" fill="' + c2 + '"/>' +
      '<path d="M8 23q0-5 5-5h52q4 0 4 4v25H8z" fill="' + c1 + '"/><path d="M69 26h9q10 2 11 13v8H69z" fill="' + c1 + '"/><path d="M72 29h6q6 2 7 9H72z" fill="' + cam + '"/>' +
      '<rect x="15" y="27" width="32" height="12" rx="2" fill="' + cam + '"/><path d="M12 22h38v4q-3.200 4-6.300 0-3.200 4-6.300 0-3.200 4-6.300 0-3.200 4-6.300 0-3.200 4-6.300 0-3.200 4-6.500 0z" fill="' + c2 + '"/>' +
      '<path d="M8 44h81" fill="none" stroke="' + c2 + '" stroke-width="3.4"/></g>' + uiTeker(24, 49, 8.5, c2) + uiTeker(72, 49, 8.5, c2);
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
      uiArabaIsaretle(t.id); uiZipla(b.firstElementChild, 1.22, 420, -5);
    });
    uiArabaSec.appendChild(b);
  }
  let simdi = null;
  try { if (typeof oyAraba === 'function') simdi = oyAraba(); } catch (_) { /* seçim isteğe bağlı */ }
  if (!uiArabaIsaretle(simdi)) uiArabaIsaretle(ARABA_TIPLERI[0].id);
}
// oyun.js bu dosyadan sonra yüklenir: kartlar bütün betikler hazır olunca kurulur.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', uiArabaKur); else uiArabaKur();
OLAY.on('araba', id => uiArabaIsaretle(id && id.id ? id.id : id));
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
  }, 1150);
});
OLAY.on('durum', d => { if (d !== 'bitis') uiSayDur(); });
