/* Arayüz: ekran düğmeleri ve göstergelerle ilgili ek davranışlar (OLAY ile oyunu dinler). Oyun mantığı oyun.js'tedir;
   oyun.js şu kimlikleri kullanır, DEĞİŞTİRME: hud, .bayrak(.tamam), yildiz-say, sira-say, hizlan(.vurgu), hizlan-dolum (yükseklik %), el,
   isiklar (çocukları: kirmizi/yesil), baslik, oyna, mola, devam, dur, sonuc, kupa (sınıf: boş/iki/uc), sonuc-sira, sonuc-yildiz-say, tekrar; .gizli = görünmez.
   Buradaki her şey süs: yıldız sayacı zıplar, sıra rakamı pop yapar, roket düğmesi hazır olunca parlar. Kare başına DOM yazılmaz
   (sıra ve roket dolumu saniyede ~8 kez yalnız OKUNUR, değişince yazılır). Üst düzey adlar `ui` önekli. */
'use strict';

const uiEl = id => document.getElementById(id);
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
