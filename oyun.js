/* Oyun: sürücüler, durum akışı, girdi, yarış mantığı (rakipler, Feza hep ilk üçte), kamera, ana döngü, test kancaları (window.YARIS). */
'use strict';

const SURUCU = [
  { tur: 'feza', renk: 0xf2483a, renk2: 0xffd84a, oyuncu: true },
  { tur: 'piril', renk: 0xa98be6, renk2: 0x8fe07a, taban: 27.8 },
  { tur: 'bilbo', renk: 0x3f8fe8, renk2: 0xffffff, taban: 27.1 },
  { tur: 'anne', renk: 0x2fc4b2, renk2: 0xfff3e0, taban: 23.2 },
  { tur: 'baba', renk: 0xff9a2e, renk2: 0x39424f, taban: 22.6 }
];
const IZGARA = [[-7, 0], [-1.5, -3.6], [-1.5, 3.6], [-11, -4.1], [-11, 4.1]];   // [yol, yanal]: önde 2, ortada Feza, arkada 2 – üst üste binmez
const OYV = 23.5;   // Feza'nın düz hızı (m/sn)
// ───────── araba seçimi (araba.js: ARABA_TIPLERI, araba(renk, renk2, tur, tip), arabaSok; yoksa eski tek model) ─────────
const oyTipler = () => (typeof ARABA_TIPLERI !== 'undefined' && Array.isArray(ARABA_TIPLERI) && ARABA_TIPLERI.length ? ARABA_TIPLERI : null);
const oyTipBul = id => { const t = oyTipler(); if (t) for (const x of t) if (x && x.id === id) return x; return null; };
let oyArabaId = (() => {
  const t = oyTipler(); if (!t) return 'kart';
  let s = Q.get('araba');
  if (!oyTipBul(s)) { try { s = localStorage.getItem('feza-yaris-araba'); } catch (e) { s = null; } }
  return oyTipBul(s) ? s : t[0].id;
})();
function oyRakipTip(i) {   // rakip i (1…4): Feza'nın seçtiği dışındaki tipler listeye eşit aralıkla dağılır (yeni arabalar da görünür), her açılışta aynı düzen
  const t = oyTipler(); if (!t) return undefined;
  let n = 0; for (const x of t) if (x && x.id !== oyArabaId) n++;
  if (!n) return t[0].id;
  let k = ((i - 1) * Math.max(1, Math.floor(n / 4))) % n; for (const x of t) if (x && x.id !== oyArabaId && k-- === 0) return x.id;
  return t[0].id;
}
{ const t = oyTipBul(oyArabaId); if (t && t.renk !== undefined) { SURUCU[0].renk = t.renk; if (t.renk2 !== undefined) SURUCU[0].renk2 = t.renk2; } }
const oyIlkTip = i => (i ? oyRakipTip(i) : (oyTipler() ? oyArabaId : undefined));
const A = SURUCU.map((s, i) => Object.assign(araba(s.renk, s.renk2, s.tur, oyIlkTip(i)), s, { tip: oyIlkTip(i), okT: 0, okSon: -1, korYan: 0, korE: 0, bitYan: 0, i, yol: 0, d: 0, v: 0, dv: 0, hop: 0, hopBasY: 0, hopBasEgim: 0, hopBasYatis: 0, rampaY: 0, rampaEgim: 0, rampaYatis: 0, rampaAyak: new Float32Array(4), rampaSon: -1, rampaYolOnce: 0, faz: i * 1.7, bitti: false, sira: i + 1, it: 0, tepki: 0.04 + i * 0.05 }));
const P = A[0];
let alev = roketAlevi(P);
function oyModelYenile(a, renk, renk2, tip) {   // nesnenin kimliği aynı kalır; yalnız model alanları (g, govde, teker, golge…) yenilenir
  const yeni = araba(renk, renk2, a.tur, tip);
  if (typeof arabaSok === 'function') arabaSok(a); else { scene.remove(a.g); scene.remove(a.golge); }
  Object.assign(a, yeni); a.renk = renk; a.renk2 = renk2; a.tip = tip;
}
function oyAraba() { return oyArabaId; }
function oyArabaSec(id) {   // yalnız başlıkta: Feza'nın arabasını anında değiştirir; rakipler kalan tiplere dağılır
  const tip = oyTipBul(id); if (!tip || durum !== 'baslik') return false;
  if (id === oyArabaId) return true;
  const onceki = oyArabaId; oyArabaId = id;
  try {
    oyModelYenile(P, tip.renk !== undefined ? tip.renk : P.renk, tip.renk2 !== undefined ? tip.renk2 : P.renk2, id);
    alev = roketAlevi(P);
    for (let i = 1; i < A.length; i++) { const rt = oyRakipTip(i); if (rt !== A[i].tip) oyModelYenile(A[i], A[i].renk, A[i].renk2, rt); }
  } catch (e) { console.error(e); oyArabaId = onceki; return false; }
  for (const a of A) arabaYerlestir(a, 0);
  try { localStorage.setItem('feza-yaris-araba', id); } catch (e) { /* gizli sekmede kayıt olmayabilir */ }
  OLAY.emit('araba', id); return true;
}
const oySira = A.slice();   // sıralama için kalıcı dizi (her karede yeni dizi yok)

// ───────── durum ─────────
let durum = 'baslik', zaman = 0, durumT = 0, mola = false, yildizSay = 0, roketT = 0, roketBekle = 0, roketKullanildi = false, ilkSurus = false;
let hedefD = null, parmak = false, sonOvgu = -99, turSesi = -1, ipucu = 0, sonTok = -9, ilkYaris = true;
let oyPid = null, oyBekleyen = null, oyAra = 0, oyElAcik = false, oySonSira = 0, oyBitisAsama = 0, oySure = 0, oySars = 0, oyRoketK = 0, oyBitisSira = 0;
let oySeriAdet = 0, oySeriSay = 0, oyRoketSay = 0, oyHopSay = 0, oyGosterT = 0, oyTutucu = null;
let oyMolaCizim = -1, oyTurZum = 0, oyLiderT = -99;
const oyIlerleme = { tur: 1, oran: 0, toplam: 0, roket: false };   // 'ilerleme' olayı hep aynı nesneyi taşır (yeni nesne yok)
let oyDolumSon = -1;
let son = performance.now(), kareOrt = 16.7, yavas = 0, kare = 0;
const tus = {};
const HUD = { hud: $('hud'), turlar: [...document.querySelectorAll('.bayrak')], yildiz: $('yildiz-say'), sira: $('sira-say'), hizlan: $('hizlan'), dolum: $('hizlan-dolum'), el: $('el'), isik: $('isiklar'), isiklar: [...$('isiklar').children] };
const oyUs = (dt, k) => 1 - Math.exp(-dt * k);   // kare hızından bağımsız yumuşatma

function elGoster(a) { if (a !== oyElAcik) { oyElAcik = a; HUD.el.classList.toggle('gizli', !a); } }
function izgarayaDiz() {
  A.forEach((a, i) => { a.yol = IZGARA[i][0]; a.d = IZGARA[i][1]; a.v = 0; a.dv = 0; a.hop = 0; a.hopBasY = 0; a.hopBasEgim = 0; a.hopBasYatis = 0; a.rampaY = 0; a.rampaEgim = 0; a.rampaYatis = 0; a.rampaAyak.fill(0); a.rampaSon = -1; a.rampaYolOnce = a.yol; a.bitti = false; a.it = 0; a.okT = 0; a.okSon = -1; a.korYan = 0; a.bitYan = 0; });
  siralama();
  yildizDuzenle(0); for (const o of OKLAR) o.tur = -1; for (const o of TUMSEK) o.tur = -1;
  girdiTemizle();
  yildizSay = 0; roketT = 0; roketBekle = 0; roketKullanildi = false; turSesi = -1; ipucu = 0; konfeti.visible = false;
  zaman = 0; oyBekleyen = null; oyAra = 0; oyBitisAsama = 0; oyBitisSira = 0; oySure = 0; oySonSira = 0; oySars = 0; oyRoketK = 0; sonTok = -9; sonOvgu = -99; ilkSurus = false;
  oySeriAdet = 0; oySeriSay = 0; oyRoketSay = 0; oyHopSay = 0; oyGosterT = 0; oyTurZum = 0; oyLiderT = -99; oyDolumSon = -1;
  oyKamIlk = true; oyGeriEk = 1; const yon = pist(P.yol); kamF.set(yon.tx, 0, yon.tz);
  HUD.yildiz.textContent = '0'; HUD.sira.textContent = '3'; HUD.dolum.style.height = '0%';
  HUD.isik.classList.add('gizli'); HUD.isiklar.forEach(el => { el.className = ''; });
  HUD.turlar.forEach(b => b.classList.remove('tamam')); HUD.hizlan.classList.remove('vurgu'); elGoster(false);
  OLAY.emit('seri', { adet: 0, hedef: 3, odul: false, toplam: 0 }); ilerlemeGoster(true);
}
function gec(d) { durum = d; durumT = 0; if (d === 'sayim') dongu.n = -1; OLAY.emit('durum', d); }
function basla() {
  SES.hazirla(); izgarayaDiz(); molaAyar(false);
  $('baslik').classList.add('gizli'); $('sonuc').classList.add('gizli'); HUD.hud.classList.remove('gizli');
  if (ilkYaris) { gec('giris'); SES.soyle(SES.CUMLE && SES.CUMLE['giris_' + PIST_TEMA] ? 'giris_' + PIST_TEMA : 'giris'); } else gec('sayim');
}
function oyBaslikDiz() { A[1].yol = A[2].yol = 3; A[3].yol = A[4].yol = -18; }   // seçim ekranında arkadaşlar biraz açılır: Feza'nın arabası rahat görünür
function basligaDon() {
  SES.sus(); izgarayaDiz(); oyBaslikDiz(); molaAyar(false);
  HUD.hud.classList.add('gizli'); $('sonuc').classList.add('gizli'); $('baslik').classList.remove('gizli');
  gec('baslik');
}
function roket(sure) { if (durum !== 'yaris') return; roketT = Math.max(roketT, sure); SES.efekt.roket(); OLAY.emit('roket', sure); }
function roketDugme() { if (durum !== 'yaris' || roketBekle > 0 || mola) return; roket(1.7); roketBekle = 5; roketKullanildi = true; oyRoketSay++; HUD.hizlan.classList.remove('vurgu'); }
function anlat(k) { if (!SES.konusuyor() && oyAra <= 0) { SES.soyle(k); oyAra = 0.9; } else oyBekleyen = k; }   // cümleler üst üste binmez
function ovgu() { if (zaman - sonOvgu < 24 || SES.konusuyor() || oyBekleyen) return; sonOvgu = zaman; SES.soyle('ovgu' + (1 + ((R() * 3) | 0))); }
function ilerlemeGoster(zorla) {
  const simdi = performance.now();
  if (!zorla && simdi < oyGosterT) return;
  oyGosterT = simdi + 125;   // testte hızlandırılmış oyun zamanında da en çok saniyede 8 gösterge güncellemesi
  const toplam = clamp(P.yol / (L * TUR), 0, 1), tur = Math.min(TUR, Math.floor(Math.max(0, P.yol) / L) + 1);
  const dolum = Math.round(clamp(roketBekle / 5, 0, 1) * 200);
  if (dolum !== oyDolumSon) { oyDolumSon = dolum; HUD.dolum.style.height = (dolum / 2) + '%'; }
  oyIlerleme.tur = tur; oyIlerleme.oran = toplam >= 1 ? 1 : ((Math.max(0, P.yol) % L) / L); oyIlerleme.toplam = toplam; oyIlerleme.roket = roketT > 0;
  OLAY.emit('ilerleme', oyIlerleme);
}
function seriYildiz() {
  oySeriAdet++;
  const odul = oySeriAdet === 3;
  if (odul) { oySeriSay++; roketBekle = 0; roket(1.15); }
  OLAY.emit('seri', { adet: oySeriAdet, hedef: 3, odul, toplam: yildizSay });
  if (odul) oySeriAdet = 0;   // kaçan yıldızlar seriyi bozmaz; yeni üçlü sıradaki yıldızla başlar
}

// ───────── girdi ─────────
const dugmeMi = e => e.target && e.target.closest && e.target.closest('button');
function parmakX(e) { const dik = innerWidth < innerHeight; hedefD = clamp(((e.clientX / innerWidth) - 0.5) * 2 * DMAX * (dik ? 1.3 : 1.65), -DMAX, DMAX); }
const birak = (hedefiSil = true) => {
  const tutucu = oyTutucu, pid = oyPid;
  parmak = false; oyPid = null; oyTutucu = null; if (hedefiSil) hedefD = null;
  if (tutucu && pid !== null) { try { if (tutucu.hasPointerCapture(pid)) tutucu.releasePointerCapture(pid); } catch (e) { /* parmak zaten kalkmış olabilir */ } }
};
function girdiTemizle() { birak(); for (const k in tus) delete tus[k]; P.dv = 0; }
addEventListener('pointerdown', e => {
  if (dugmeMi(e) || (durum !== 'giris' && durum !== 'sayim' && durum !== 'yaris') || mola) return;
  if (durum === 'giris' && durumT > 0.8) { SES.sus(); gec('sayim'); }
  if (oyPid !== null) return;                       // ikinci parmak direksiyonu bozmasın
  oyPid = e.pointerId; parmak = true; parmakX(e);
  if (e.target && e.target.setPointerCapture) { try { e.target.setPointerCapture(oyPid); oyTutucu = e.target; } catch (err) { /* pencere dinleyicileri yedek */ } }
});
addEventListener('pointermove', e => { if (parmak && e.pointerId === oyPid) parmakX(e); });
const oyBirakE = e => { if (e.pointerId === oyPid) birak(); };
addEventListener('pointerup', e => { if (e.pointerId === oyPid) { if (Number.isFinite(e.clientX)) parmakX(e); birak(false); } });
addEventListener('pointercancel', oyBirakE);
addEventListener('lostpointercapture', oyBirakE);
const oyDokunBitti = e => { if (!e.touches || !e.touches.length) birak(false); };   // normal bırakış son hedefi korur; kaçan pointerup için yedek
addEventListener('touchend', oyDokunBitti, { passive: true });
addEventListener('touchcancel', e => { if (!e.touches || !e.touches.length) birak(); }, { passive: true });
addEventListener('blur', () => { girdiTemizle(); if (durum === 'giris' || durum === 'sayim' || durum === 'yaris') molaAyar(true); });
addEventListener('resize', girdiTemizle);
addEventListener('keydown', e => {
  if (dugmeMi(e) && (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter')) return;   // odaktaki düğmenin doğal tıklaması çalışsın
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) birak();
  tus[e.code] = true;
  if (e.code === 'Space' && !e.repeat) { if (durum === 'baslik') basla(); else roketDugme(); }
});
addEventListener('keyup', e => { tus[e.code] = false; });
addEventListener('contextmenu', e => e.preventDefault());
$('oyna').addEventListener('click', basla);
$('tekrar').addEventListener('click', basla);
HUD.hizlan.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); roketDugme(); });
HUD.hizlan.addEventListener('click', e => { if (e.detail === 0) roketDugme(); });   // klavyeyle Enter/Space; parmak/fare pointerdown ile bir kez çalışır
function molaAyar(m) { if (mola === m) return; mola = m; oyMolaCizim = -1; $('mola').classList.toggle('gizli', !m); SES.durdur(m); girdiTemizle(); son = performance.now(); OLAY.emit('mola', m); }
$('dur').addEventListener('click', () => molaAyar(true));
$('devam').addEventListener('click', () => molaAyar(false));
document.addEventListener('visibilitychange', () => { if (document.hidden) { girdiTemizle(); if (durum === 'yaris' || durum === 'sayim' || durum === 'giris') molaAyar(true); } son = performance.now(); });

// ───────── oyun adımı ─────────
function siralama() {   // yerinde sıralama (5 araba), yeni dizi oluşturmaz
  for (let i = 1; i < oySira.length; i++) { const a = oySira[i]; let j = i - 1; while (j >= 0 && oySira[j].yol < a.yol) { oySira[j + 1] = oySira[j]; j--; } oySira[j + 1] = a; }
  for (let i = 0; i < oySira.length; i++) oySira[i].sira = i + 1;
  return oySira;
}
function oyuncuAdim(dt) {
  const p = pist(P.yol, o1), kenar = clamp((Math.abs(P.d) - (DMAX - 0.9)) / 0.9, 0, 1);
  const hedefV = durum === 'bitis' ? 9 : OYV * (1 - 0.09 * kenar * kenar) + (roketT > 0 ? 8.5 : 0);   // kenar bandı: hafif, yumuşak yavaşlama
  P.v += (hedefV - P.v) * oyUs(dt, hedefV > P.v ? 1.6 : 1.0);
  let dv = 0, surdu = false;
  if (durum === 'bitis') dv = clamp((0 - P.d) * 1.2, -4, 4);
  else if (OTO) dv = clamp((Math.sin(zaman * 0.6) * 3.4 - P.d) * 3, -9, 9);
  else if (hedefD !== null) { const f = hedefD - P.d; dv = Math.abs(f) < 0.04 ? 0 : clamp(f * 8, -13, 13); surdu = Math.abs(f) > 0.3; }
  else if (tus.ArrowLeft || tus.KeyA) { dv = -9; surdu = true; } else if (tus.ArrowRight || tus.KeyD) { dv = 9; surdu = true; }
  if (surdu && durum === 'yaris') ilkSurus = true;
  const savrul = durum === 'yaris' ? clamp(-p.k * P.v * P.v * 0.03, -0.8, 0.8) * (parmak ? 1 : 0) : 0;   // parmak basılıyken çok hafif dışa kayma
  P.dv += (dv - P.dv) * oyUs(dt, 14);
  P.d = clamp(P.d + (P.dv + savrul) * dt, -DMAX, DMAX);
  if (!parmak && hedefD !== null && Math.abs(hedefD - P.d) < 0.06 && Math.abs(P.dv) < 0.2) { hedefD = null; P.dv = 0; }   // kısa dokunuşta da son hizaya ulaş, sonra şeritte kal
  P.yol += P.v * dt;
  roketT = Math.max(0, roketT - dt); roketBekle = Math.max(0, roketBekle - dt);
}
// Kamera koridoru: Feza'nın 0–14 m gerisinde, şeridinin ±2,65 m'sinde rakip durmaz (kamerayla Feza arasına araba girmez).
const OY_KOR_GERI = 14, OY_KOR_YAN = 2.65;
const oyOzel = [];   // rakiplerin de kullandığı oklar ve rampalar (aynı nesneler; pist.js'in çizdiği yerler)
for (const o of OKLAR) oyOzel.push({ n: o, ok: true }); for (const r of TUMSEK) oyOzel.push({ n: r, ok: false });
function oyKoridor(a, dt) {
  const ds = P.yol - a.yol;
  if (ds <= -3 || ds >= 34) return;   // yan yana gelen (3 m öndeki) rakip de yana açılır: Feza'nın arkasına düştüğünde koridor zaten boştur
  // e = rakibin kamera–Feza doğrusuna yanal uzaklığı (+ = d artı yanı). Virajda bu doğru şeritten kayar; iki ölçü de korunur.
  const kx = camera.position.x, kz = camera.position.z, dx = P.x - kx, dz = P.z - kz, uz = Math.hypot(dx, dz) || 1, cx = a.x - kx, cz = a.z - kz;
  const e = (dx * cz - dz * cx) / uz, t = (cx * dx + cz * dz) / uz;
  a.korE = e;
  if (ds >= OY_KOR_GERI + 0.6) return;
  const yan = a.d >= P.d ? 1 : -1, acik = (a.d - P.d) * yan - OY_KOR_YAN, eAcik = t < uz - 2.2 ? e * yan - 2.3 : 1;   // ikisi de Feza'ya göre aynı yana doğru ölçülür
  if (ds >= OY_KOR_GERI) {   // koridorun gerisinde: yana açılmadan yaklaşamaz
    if (acik < 0.25 || eAcik < 0.2) { a.yol = P.yol - OY_KOR_GERI - 0.6; if (a.v > P.v) a.v = P.v; }
    return;
  }
  a.korYan = yan;
  const it = Math.max(0, -acik, -eAcik) * yan;
  if (it) {
    if (a.dv * it < 0) a.dv = 0;
    if (Math.abs(a.d + it) > DMAX) {   // o yanda yer kalmadı: rakip kenarda kalıp geriye çekilir
      a.d = clamp(a.d + clamp(it, -16 * dt, 16 * dt), -DMAX, DMAX);
      if (ds > 0) { a.yol -= 22 * dt; if (a.v > P.v - 2) a.v = P.v - 2; }
    } else a.d += clamp(it, -16 * dt, 16 * dt);
  }
}
function rakipAdim(a, dt, onde, gecebilir) {
  const fark = P.yol - a.yol;   // + = rakip geride
  if (a.okT > 0) a.okT -= dt;
  let hv = a.taban + (fark > 0 ? clamp(fark * 0.1, 0, 3.2) : clamp(fark * 0.08, -4.5, 0)) + (a.okT > 0 ? 4 : 0);   // gerideyse yetişir, öndeyse bekler; ok kısa süre hızlandırır
  // sıradaki ok/rampa: rakipler de üstünden geçer (her rakip her turda başka olanları seçer)
  let oz = null, ozU = 34;
  if (durum === 'yaris') {
    const s = ((a.yol % L) + L) % L, tur = Math.max(0, Math.floor(a.yol / L));
    for (let j = 0; j < oyOzel.length; j++) {
      const n = oyOzel[j].n, u = (((n.s - s) % L) + L) % L;
      if (oyOzel[j].ok && u > L - 3.5 && Math.abs(n.d - a.d) < 2.9 && a.okSon !== tur * 8 + j) { a.okSon = tur * 8 + j; a.okT = 1.1; }
      if (u < ozU && (j + a.i + tur) % 2 === 0) { ozU = u; oz = n; }
    }
  }
  const bitisOnde = a.yol > P.yol - 3;
  if (durum === 'bitis' || P.bitti) {
    // Öndekiler ileride uzaklaşıp bekler; gerideki arkadaşlar önce geri açılır, kamera öne geçince iki sıra halinde yaklaşır.
    const kutlamaYol = bitisOnde ? P.yol + 60 : P.yol - lerp(17, 9.5, clamp((durumT - 2.2) / 2.5, 0, 1)) - Math.floor((a.i - 1) / 2) * 5.5;
    hv = clamp(9 + (kutlamaYol - a.yol) * 0.65, 1.5, bitisOnde ? 26 : 22);
  }
  else if (fark >= 0) {
    if (a !== gecebilir) hv = Math.min(hv, P.v + clamp((fark - 17) * 0.6, -3.5, 6));   // geçmeyecek olanlar kameranın arkasında bekler, görüşü kapatmaz          // Feza hep ilk üçte: en çok iki rakip öne geçebilir
    else if (P.yol > TUR * L - 170 && fark < 12) hv = Math.min(hv, P.v - 0.3);              // son düzlükte Feza'nın yeri alınmaz
  }
  if (durum === 'yaris' && !P.bitti && fark > -6 && fark < OY_KOR_GERI + 2) {   // Feza kenara doğru geliyor ve rakibe yer kalmıyor: sıkışmadan önce öne ya da arkaya açılır
    const yan = a.d >= P.d ? 1 : -1, pd = P.d + P.dv * 0.5;
    if (pd * yan + OY_KOR_YAN > DMAX - 0.9 && (a.d - pd) * yan < OY_KOR_YAN + 1.6) { if (fark < 1.2 && (fark < 0 || a === gecebilir)) hv = Math.max(hv, P.v + 5); else hv = Math.min(hv, P.v - 5.5); }
  }
  if (zaman < a.tepki) hv = 0;
  // öndeki arabanın içinden geçme: tam arkasındaysa hızını ona uydur; yandakilerden yumuşakça uzaklaş (Feza'ya yol ver)
  let it = 0;
  for (const b of A) {
    if (b === a) continue;
    const ds = b.yol - a.yol, bd = b === P && ds > 5 ? P.d * 0.7 : b.d, dd = a.d - bd, ad = Math.abs(dd);   // Feza'nın arkasında kamera hattı da boş kalsın
    if (ds > 0 && ds < 7 && Math.abs(a.d - b.d) < 2.3) hv = Math.min(hv, b.v + (ds - 4.6) * 1.5);
    const menzil = b === P ? (ds < 0 ? 13 : 18) : 6.5;
    const gen = b === P ? 3.4 : 2.8;
    if (Math.abs(ds) < menzil && ad < gen) {
      const yon = ad < 0.25 ? (b === P ? (a.d > 0 ? -1 : 1) : (a.i > b.i ? 1 : -1)) : (dd > 0 ? 1 : -1);
      it += (gen - ad) * yon * (b === P ? 2.5 : 1);
    }
  }
  a.it += (it - a.it) * oyUs(dt, 5);
  a.v += (hv - a.v) * oyUs(dt, hv < a.v ? 2.6 : 1.6);
  const gezi = clamp((zaman - 3) / 5, 0, 1);
  let serit;
  if (durum === 'bitis') {
    if (!a.bitYan) a.bitYan = a.d >= P.d ? 1 : -1;   // herkes kendi yanında kalır: kimse Feza'nın önünden/arkasından karşıya geçmez
    serit = bitisOnde ? a.d : clamp(P.d + a.bitYan * (a.i % 2 ? 3.8 : 5.6), -DMAX + 0.3, DMAX - 0.3);
  } else {
    let hat = IZGARA[a.i][1] * (1 - 0.3 * gezi) + Math.sin(zaman * 0.21 + a.faz) * 2.1 * gezi;
    if (oz && (fark < -8 || fark > 40)) hat = lerp(hat, clamp(oz.d + (a.i % 2 ? 0.7 : -0.7), -DMAX + 0.5, DMAX - 0.5), clamp((34 - ozU) / 14, 0, 1));
    if (durum === 'yaris' && fark > 0.3 && fark < 34) {   // Feza'nın gerisinde: hep yandan gelir, kamera hattına girmez
      if (fark > OY_KOR_GERI || !a.korYan) {
        let yan = Math.abs(P.d) > 1.2 ? (P.d > 0 ? -1 : 1) : a.korYan || (a.korE >= 0 ? 1 : -1);   // Feza kenara yakınsa geniş yandan gelir
        if (((a.d + yan * 3.9 - a.korE) * yan > DMAX + 0.6 || P.d * yan + 3.1 > DMAX) && (a.d - yan * 3.9 - a.korE) * -yan < DMAX + 0.6) yan = -yan;   // o yanda yer yoksa (koridorun gerisindeyken) öbür yana
        a.korYan = yan;
      }
      hat = a.d + a.korYan * 3.9 - a.korE;   // kamera doğrusundan 3,9 m yana
      if ((hat - P.d) * a.korYan < 3.3) hat = P.d + a.korYan * 3.3;
    } else if (fark <= 0.3 || fark >= 34) a.korYan = 0;
    serit = clamp(hat + a.it, -DMAX + 0.5, DMAX - 0.5);
  }
  a.dv += (clamp((serit - a.d) * 2, -3.4, 3.4) - a.dv) * oyUs(dt, 4);   // şerit değiştirme yumuşak
  a.d = clamp(a.d + a.dv * dt, -DMAX, DMAX);
  a.yol += a.v * dt;
  if (!P.bitti && durum === 'yaris' && fark >= 0 && a !== gecebilir && a.yol > P.yol - 4.3) {
    if (fark >= 4.2) { a.yol = P.yol - 4.3; if (a.v > P.v) a.v = P.v; }   // arkadan yaklaşan: 4,3 m geride tutulur
    else { if (a.v > P.v - 2) a.v = P.v - 2; if (a.yol > P.yol - 0.05) a.yol = P.yol - 0.05; }   // Feza'nın az önce geçtiği: ışınlanmadan, yavaşça geride kalır
  }
  if (!a.bitti && a.yol >= TUR * L) a.bitti = true;
}
function carpisma(dt) {   // değme: ışınlanma yok, yumuşak ayrılma; rakip daha çok kenara çekilir
  for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) {
    const a = A[i], b = A[j], ds = a.yol - b.yol, dd = a.d - b.d, ad = Math.abs(dd);
    if (Math.abs(ds) < 3.8 && ad < 2.15) {
      const ort = 2.15 - ad, yon = dd >= 0 ? 1 : -1, m = Math.min(ort, 7 * dt), pa = a === P ? 0.25 : 0.5;
      a.d = clamp(a.d + yon * m * pa, -DMAX, DMAX); b.d = clamp(b.d - yon * m * (1 - pa), -DMAX, DMAX);
      if (ort > 0.45) { const arka = ds < 0 ? a : b, on = ds < 0 ? b : a; if (arka.v > on.v) { arka.v += (on.v - arka.v) * oyUs(dt, 6); if (arka === P) on.v += 5 * dt; } }
      if (a === P && durum === 'yaris' && zaman - sonTok > 0.9) { sonTok = zaman; SES.efekt.tok(); OLAY.emit('tok'); }
    }
  }
}
function rampaAdim(a, dt) {
  const onceHop = a.hop;
  a.hop = Math.max(0, a.hop - dt); rampaZemin(a);
  if (onceHop > 0 && a.hop <= 0 && a === P) { oySars = 0.26; OLAY.emit('inis', { i: 0, v: P.v, d: P.d, tur: Math.min(TUR - 1, Math.floor(Math.max(0, P.yol) / L)) }); }
  if (durum !== 'yaris' || a.hop > 0) return;
  const tur = Math.max(0, Math.floor(a.yol / L));
  for (let j = 0; j < TUMSEK.length; j++) {
    const r = TUMSEK[j], z = a.yol - (r.s + tur * L), anahtar = tur * TUMSEK.length + j;
    if (anahtar === a.rampaSon || z < RAMPA.firlat || z >= RAMPA.son || !(a.rampaAyak[0] + a.rampaAyak[1] + a.rampaAyak[2] + a.rampaAyak[3] > 0)) continue;
    const once = a.rampaYolOnce - (r.s + tur * L), gecen = once < RAMPA.firlat ? Math.min(dt, Math.max(0, (z - RAMPA.firlat) / Math.max(1, a.v))) : 0;
    // Fırlama adımın ortasında olduysa başlangıç yüksekliğini tam dudak noktasından al.
    if (once < RAMPA.firlat) rampaZemin(a, r.s + tur * L + RAMPA.firlat);
    a.hopBasY = a.rampaY; a.hopBasEgim = a.rampaEgim; a.hopBasYatis = a.rampaYatis;
    a.hop = RAMPA.ucus - gecen; a.rampaSon = anahtar;
    if (a === P) { oyHopSay++; SES.efekt.hop(); OLAY.emit('hop', { i: 0, tur, v: P.v, d: P.d }); if (R() < 0.3 && !SES.konusuyor() && !oyBekleyen && zaman - sonOvgu > 14) { sonOvgu = zaman; SES.soyle('hop'); } }
    break;
  }
}
function toplananlar(dt) {
  const s = ((P.yol % L) + L) % L, tur = Math.max(0, Math.floor(P.yol / L));
  for (const y of YILDIZ) {
    if (!y.var) { if (y.pat > 0) y.pat -= dt; continue; }
    let ds = Math.abs(y.s - s); if (ds > L / 2) ds = L - ds;
    if (ds < 2.6 && Math.abs(y.d - P.d) < 2.3) { y.var = false; y.pat = 0.3; yildizSay++; HUD.yildiz.textContent = yildizSay; SES.efekt.yildiz(); OLAY.emit('yildiz', y); seriYildiz(); if (yildizSay % 12 === 0) ovgu(); }
  }
  for (const o of OKLAR) { const ds = s - o.s; if (o.tur !== tur && ds > 0 && ds < 3.5 && Math.abs(o.d - P.d) < 2.9) { o.tur = tur; roket(1.3); } }
}
function yarisAdim(dt) {
  zaman += dt;
  for (const a of A) a.rampaYolOnce = a.yol;
  let onde = 0, gecebilir = null;
  for (const a of A) { if (a === P) continue; if (a.yol > P.yol) onde++; else if (!gecebilir || a.yol > gecebilir.yol) gecebilir = a; }
  if (onde >= 2) gecebilir = null;   // önde iki rakip varsa başka kimse Feza'yı geçemez
  oyuncuAdim(dt); for (const a of A) if (a !== P) rakipAdim(a, dt, onde, gecebilir);
  carpisma(dt);
  if (durum === 'yaris' || durum === 'bitis') for (const a of A) if (a !== P) oyKoridor(a, dt);
  for (const a of A) rampaAdim(a, dt);
  if (durum === 'yaris') {
    const tur = Math.floor(Math.max(0, P.yol) / L);
    if (tur !== turSesi) {
      if (turSesi >= 0 && tur > turSesi) {
        HUD.turlar[turSesi] && HUD.turlar[turSesi].classList.add('tamam');
        if (tur < TUR) { yildizDuzenle(tur); SES.efekt.tur(); }
        oyTurZum = 0.7; OLAY.emit('tur', tur); if (tur === TUR - 1) anlat('sontur');
      }
      turSesi = tur;
    }
    if (P.yol >= TUR * L) { ilerlemeGoster(true); bitir(); return; }
    toplananlar(dt);
    if (SES.konusuyor()) oyAra = 0.9; else if (oyAra > 0) oyAra -= dt;
    if (oyBekleyen && oyAra <= 0 && !SES.konusuyor()) { SES.soyle(oyBekleyen); oyBekleyen = null; oyAra = 0.9; }
    if (ipucu === 0 && zaman > 4 && oyAra <= 0 && !SES.konusuyor()) { ipucu = 1; SES.soyle('yildiz'); oyAra = 0.9; }
    if (ipucu === 1 && zaman > 14 && oyAra <= 0 && !SES.konusuyor()) { ipucu = 2; if (!roketKullanildi) { SES.soyle('roket'); oyAra = 0.9; HUD.hizlan.classList.add('vurgu'); } }
    elGoster(!ilkSurus && !OTO && zaman > (ilkYaris ? 0.5 : 7) && zaman < 22);
    siralama(); if (P.sira !== oySonSira) {
      const lider = P.sira === 1 && oySonSira > 1 && zaman > 3 && zaman - oyLiderT > 8;   // öne geçiş: kısa pırıltı (en çok 8 sn'de bir)
      oySonSira = P.sira; HUD.sira.textContent = P.sira; OLAY.emit('sira', P.sira);
      if (lider) { oyLiderT = zaman; OLAY.emit('lider'); }
    }
    ilerlemeGoster(false);
  }
}
function bitir() {
  let biten = 0; for (const a of A) if (a !== P && a.bitti) biten++;
  P.bitti = true; const s = Math.min(3, biten + 1); P.sira = s; oyBitisSira = s; oySure = zaman;
  OLAY.emit('ozet', { pist: PIST_TEMA, yildiz: yildizSay, roket: oyRoketSay, ziplama: oyHopSay, seri: oySeriSay, sira: s, sure: +oySure.toFixed(1) });
  gec('bitis'); OLAY.emit('bitis', s); HUD.hud.classList.add('gizli'); elGoster(false); ilkYaris = false; oyBitisAsama = 0; oyBekleyen = null; birak();
  const p = pist(P.yol + 6); konfetiAt(p.x, p.z); SES.efekt.bitis();
  $('kupa').className = s === 1 ? '' : s === 2 ? 'iki' : 'uc'; $('sonuc-sira').textContent = s; $('sonuc-yildiz-say').textContent = yildizSay;
}

// ───────── çizim ─────────
const kamF = new T.Vector3(0, 0, 1), kamH = new T.Vector3(), kamB = new T.Vector3(), tmp = new T.Vector3(), oyBak = new T.Vector3(), oyO2 = { x: 0, z: 0, tx: 0, tz: 1, k: 0 };
let yT = 0, oyKamIlk = true, oyGeriEk = 1;
function sahneGuncelle(dt, gdt) {   // dt = oyun zamanı (ağır çekimde küçülür), gdt = gerçek kare süresi
  yT += dt;
  const bekliyor = durum === 'giris' || durum === 'sayim';
  for (const a of A) {
    arabaYerlestir(a, dt);
    if (bekliyor) { const g = durum === 'sayim' ? 1 + Math.min(2.3, durumT) * 0.6 : 0.8; a.govde.position.y = Math.sin(yT * 44 + a.faz * 3) * 0.011 * g; a.govde.rotation.z = Math.sin(yT * 31 + a.faz) * 0.006 * g; }   // motor ısıtma titreşimi
  }
  alev.visible = roketT > 0 && durum === 'yaris'; if (alev.visible) alev.scale.set(0.4, 1.1 + Math.sin(yT * 50) * 0.35, 0.4);
  pistGuncelle(dt, yT); cevreGuncelle(dt, yT);
  // kamera
  const dik = innerWidth < innerHeight;
  let k = 9, fov = dik ? 78 : 62;
  // Kamera oyun zamanıyla yumuşar (hızlı zamanda da aynı kadraj); ağır çekimde gerçek süreyle akar.
  if (dt > gdt && durum !== 'baslik') gdt = Math.min(0.25, dt);
  if (oySars > 0) oySars -= gdt;
  if (oyTurZum > 0) oyTurZum = Math.max(0, oyTurZum - gdt);
  oyRoketK += ((roketT > 0 && durum === 'yaris' ? 1 : 0) - oyRoketK) * oyUs(gdt, 3.5);
  if (durum === 'baslik') {
    // Araba seçimi: kamera Feza'nın arabasının ön-yanında yakın durur, yavaşça salınır; araba ekranın üst-ortasında (menü altta).
    const a = 1.25 + Math.sin(yT * 0.3) * 0.42, r = dik ? 9.2 : 7.6, ri = r * Math.cos(a), ry = Math.min(6.4, r * Math.sin(a));
    kamH.set(P.x + P.tx * ri - P.tz * ry, dik ? 4 : 3.1, P.z + P.tz * ri + P.tx * ry); kamB.set(P.x, dik ? -2 : -1, P.z); k = 2.5;
  } else if (durum === 'bitis') {   // bir kez öne kayan kutlama kamerası; sonra yüzleri gösteren açık kadrajda durur
    const u = clamp((durumT - 1.7) / 2.4, 0, 1), acil = u * u * (3 - 2 * u), r0 = dik ? 13 : 10.8, r1 = dik ? 11.2 : 8.7;
    // Doğrusal koridor, geniş bir yörüngeye çıkmadan sağ yandan geçer; enine uzaklık dar tutulur.
    const ri = lerp(-r0 * 0.905, r1 * 0.62, acil), ry = lerp(-r0 * 0.13, dik ? -6.6 : -r1 * 0.785, acil), yatay = Math.hypot(ri, ry), cerceve = dik ? 0 : 1.6 * acil;
    kamH.set(P.x + P.tx * ri + P.tz * ry, lerp(dik ? 6.8 : 5.6, dik ? 5.8 : 4.4, acil), P.z + P.tz * ri - P.tx * ry);
    kamB.set(P.x + (P.tz * ri - P.tx * ry) / yatay * cerceve, 1.45, P.z + (-P.tx * ri - P.tz * ry) / yatay * cerceve);
    if (dik) { const c = 3.4 * acil / yatay; kamB.x += (P.tx * ri + P.tz * ry) * c; kamB.z += (P.tz * ri - P.tx * ry) * c; kamB.y = lerp(1.45, 0.2, acil); }   // dikeyde araba ekranın üst-ortasında (kupa altta)
    fov = lerp(dik ? 78 : 62, dik ? 66 : 55, acil); k = 3.5;
    // Yumuşak takibin geride kalmasını telafi et; hareket eden araba son kadrajın ortasından kaçmasın.
    const tahmin = P.v * acil * (gdt > 0 ? Math.min(1, dt / gdt) : 1);
    kamH.x += P.tx * tahmin / k; kamH.z += P.tz * tahmin / k;
    kamB.x += P.tx * tahmin / (k * 1.4); kamB.z += P.tz * tahmin / (k * 1.4);
  } else {
    tmp.set(P.tx, 0, P.tz); kamF.lerp(tmp, oyUs(gdt, 4.5)).normalize();
    oyGeriEk += ((bekliyor ? 1 : 0) - oyGeriEk) * oyUs(gdt, 1.6);   // dizilişte biraz geriden: arkadaki arabalar da görünsün
    const geri = (dik ? 13 : 9.6) + oyRoketK * 1.5 + oyGeriEk * 3.4, yuk = (dik ? 7.2 : 4.6) + oyRoketK * 0.3 + oyGeriEk * 1.1, mx = P.x + P.tz * P.d * 0.45, mz = P.z - P.tx * P.d * 0.45;
    kamH.set(mx - kamF.x * geri, yuk, mz - kamF.z * geri);
    if (oySars > 0) kamH.y += Math.sin(yT * 46) * 0.12 * (oySars / 0.26);
    const il = pist(P.yol + 15, oyO2), ib = dik ? 10 : 9;   // virajda hafif öne bakış: yolun ilerisine doğru
    kamB.set(lerp(mx + kamF.x * ib, il.x, 0.4), 1.3, lerp(mz + kamF.z * ib, il.z, 0.4));
    k = durum === 'giris' ? 1.5 : durum === 'sayim' ? 3 : 9; fov += oyRoketK * 7;
    if (oyTurZum > 0) fov -= Math.sin((1 - oyTurZum / 0.7) * Math.PI) * 4.5;   // tur atıldı: minik zum
  }
  if (oyKamIlk) { oyKamIlk = false; camera.position.copy(kamH); oyBak.copy(kamB); }
  camera.position.lerp(kamH, oyUs(gdt, k)); oyBak.lerp(kamB, oyUs(gdt, k * 1.4)); camera.lookAt(oyBak);
  if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * oyUs(gdt, 5); camera.updateProjectionMatrix(); }
}

// ───────── ana döngü ─────────
function dongu(simdi) {
  requestAnimationFrame(dongu);
  let ham = (simdi - son) / 1000; son = simdi; if (!(ham > 0)) ham = 0.001;
  if (ham < 0.2 && !mola) { kareOrt += ((ham * 1000) - kareOrt) * 0.05; kare++; }   // sekme arkadayken geçen süre ölçüme karışmasın
  ham = Math.min(0.05, ham);
  // Donmuş 3B görüntü yalnız girişte veya boyut/bağlam yenilendiğinde çizilir; DOM düğmeleri bağımsızdır.
  if (mola) { if (!document.hidden && oyMolaCizim !== cizimSurumu) { renderer.render(scene, camera); oyMolaCizim = cizimSurumu; } return; }
  if (kare > 120 && kareOrt > 21 && oran > 1) { if (++yavas > 90) { oran = Math.max(1, oran - 0.25); boyut(); yavas = 0; kare = 0; } } else yavas = Math.max(0, yavas - 1);
  let dt = ham * ZAMAN;
  durumT += dt;
  if (durum === 'giris') { if ((durumT > 3.6 && !SES.konusuyor()) || durumT > 8) gec('sayim'); }
  else if (durum === 'sayim') {
    HUD.isik.classList.remove('gizli');
    const n = durumT < 0.7 ? 0 : durumT < 1.5 ? 1 : durumT < 2.3 ? 2 : 3;
    if (n !== dongu.n) {
      dongu.n = n; OLAY.emit('sayim', n); if (n === 0) SES.soyle('hazir');
      HUD.isiklar.forEach((el, i) => { el.className = n === 3 ? 'yesil' : i < n ? 'kirmizi' : ''; }); if (n === 1 || n === 2) SES.efekt.bip();
      if (n === 3) { SES.efekt.git(); SES.soyle('basla'); zaman = 0; oyAra = 0.9; ilkSurus = false; gec('yaris'); }
    }
  } else if (durum === 'yaris' || durum === 'bitis') {
    if (durum === 'yaris') { if (durumT > 1.1) HUD.isik.classList.add('gizli'); }
    else {
      dt *= durumT < 1.1 ? 0.35 : Math.min(1, 0.35 + (durumT - 1.1) * 1.2);   // çizgiyi geçince kısa ağır çekim
      if (oyBitisAsama === 0 && durumT > 0.9) { oyBitisAsama = 1; SES.soyle(['bir', 'iki', 'uc'][oyBitisSira - 1]); }
      if (oyBitisAsama === 1 && durumT > 3) { oyBitisAsama = 2; $('sonuc').classList.remove('gizli'); OLAY.emit('sonuc'); }
      if (oyBitisAsama === 2 && durumT > 7.5 && !SES.konusuyor()) { oyBitisAsama = 3; SES.soyle('tekrar'); }
    }
    const adim = Math.max(1, Math.ceil(dt / 0.034)), d1 = dt / adim, d0 = durum;   // hızlı zamanda da küçük adımlar
    for (let i = 0; i < adim && durum === d0; i++) yarisAdim(d1);
  }
  SES.motorAyar(P.v, durum === 'yaris' || durum === 'bitis');
  sahneGuncelle(dt, ham);
  renderer.render(scene, camera);
}
dongu.n = -1;
izgarayaDiz(); oyBaslikDiz(); for (const a of A) arabaYerlestir(a, 0);
if (Q.has('atla')) basla();
requestAnimationFrame(dongu);

window.YARIS = {
  get durum() { return durum; }, get zaman() { return zaman; }, get mola() { return mola; }, pist: PIST_TEMA, P, A, L, TUR, renderer, scene, camera,
  get kareMs() { return kareOrt; }, get oran() { return oran; }, basla, basligaDon, roket: roketDugme, get araba() { return oyArabaId; }, arabaSec: oyArabaSec,
  surukle(d) { hedefD = d; },
  bilgi() { return { pist: PIST_TEMA, araba: oyArabaId, durum, tur: Math.floor(Math.max(0, P.yol) / L), sira: P.sira, yildiz: yildizSay, seri: oySeriSay, seriAdet: oySeriAdet, roket: oyRoketSay, ziplama: oyHopSay, roketKalan: +roketT.toFixed(2), roketBekle: +roketBekle.toFixed(2), v: +P.v.toFixed(1), d: +P.d.toFixed(2), sure: +(durum === 'bitis' ? oySure : zaman).toFixed(1), el: oyElAcik, mola, cizim: renderer.info.render.calls, ucgen: renderer.info.render.triangles, oran, kareMs: +kareOrt.toFixed(2) }; }
};
