/* Oyun: sürücüler, durum akışı, girdi, yarış mantığı (rakipler, Feza hep ilk üçte), kamera, ana döngü, test kancaları (window.YARIS). */
'use strict';

const SURUCU = [
  { tur: 'feza', renk: 0xf2483a, renk2: 0xffd84a, oyuncu: true },
  { tur: 'piril', renk: 0xa98be6, renk2: 0x8fe07a, taban: 25.6 },
  { tur: 'bilbo', renk: 0x3f8fe8, renk2: 0xffffff, taban: 25.1 },
  { tur: 'anne', renk: 0x2fc4b2, renk2: 0xfff3e0, taban: 23.2 },
  { tur: 'baba', renk: 0xff9a2e, renk2: 0x39424f, taban: 22.6 }
];
const IZGARA = [[-7, 0], [-1.5, -3.6], [-1.5, 3.6], [-11, -4.1], [-11, 4.1]];   // [yol, yanal]: önde 2, ortada Feza, arkada 2 – üst üste binmez
const OYV = 23.5;   // Feza'nın düz hızı (m/sn)
const A = SURUCU.map((s, i) => Object.assign(araba(s.renk, s.renk2, s.tur), s, { i, yol: 0, d: 0, v: 0, dv: 0, hop: 0, faz: i * 1.7, bitti: false, sira: i + 1, it: 0, tepki: 0.04 + i * 0.05 }));
const P = A[0];
const alev = roketAlevi(P);
const oySira = A.slice();   // sıralama için kalıcı dizi (her karede yeni dizi yok)

// ───────── durum ─────────
let durum = 'baslik', zaman = 0, durumT = 0, mola = false, yildizSay = 0, roketT = 0, roketBekle = 0, roketKullanildi = false, ilkSurus = false;
let hedefD = null, parmak = false, sonOvgu = -99, turSesi = -1, ipucu = 0, sonTok = -9, ilkYaris = true;
let oyPid = null, oyBekleyen = null, oyAra = 0, oyElAcik = false, oySonSira = 0, oyBitisAsama = 0, oySure = 0, oySars = 0, oyHopOnce = 0, oyRoketK = 0, oyBitisSira = 0;
let son = performance.now(), kareOrt = 16.7, yavas = 0, kare = 0;
const tus = {};
const HUD = { hud: $('hud'), turlar: [...document.querySelectorAll('.bayrak')], yildiz: $('yildiz-say'), sira: $('sira-say'), hizlan: $('hizlan'), dolum: $('hizlan-dolum'), el: $('el'), isik: $('isiklar'), isiklar: [...$('isiklar').children] };
const oyUs = (dt, k) => 1 - Math.exp(-dt * k);   // kare hızından bağımsız yumuşatma

function elGoster(a) { if (a !== oyElAcik) { oyElAcik = a; HUD.el.classList.toggle('gizli', !a); } }
function izgarayaDiz() {
  A.forEach((a, i) => { a.yol = IZGARA[i][0]; a.d = IZGARA[i][1]; a.v = 0; a.dv = 0; a.hop = 0; a.bitti = false; a.it = 0; });
  for (const y of YILDIZ) { y.var = true; y.pat = 0; }
  yildizSay = 0; roketT = 0; roketBekle = 0; roketKullanildi = false; hedefD = null; oyPid = null; parmak = false; turSesi = -1; ipucu = 0; konfeti.visible = false;
  zaman = 0; oyBekleyen = null; oyBitisAsama = 0; oySonSira = 0; oySars = 0; oyHopOnce = 0; sonTok = -9; sonOvgu = -99; ilkSurus = false;
  HUD.yildiz.textContent = '0'; HUD.sira.textContent = '3'; HUD.dolum.style.height = '0%';
  HUD.turlar.forEach(b => b.classList.remove('tamam')); HUD.hizlan.classList.remove('vurgu'); elGoster(false);
}
function gec(d) { durum = d; durumT = 0; if (d === 'sayim') dongu.n = -1; OLAY.emit('durum', d); }
function basla() {
  SES.hazirla(); izgarayaDiz(); molaAyar(false);
  $('baslik').classList.add('gizli'); $('sonuc').classList.add('gizli'); HUD.hud.classList.remove('gizli');
  if (ilkYaris) { gec('giris'); SES.soyle('giris'); } else gec('sayim');
}
function roket(sure) { if (durum !== 'yaris') return; roketT = Math.max(roketT, sure); SES.efekt.roket(); OLAY.emit('roket', sure); }
function roketDugme() { if (durum !== 'yaris' || roketBekle > 0 || mola) return; roket(1.7); roketBekle = 5; roketKullanildi = true; HUD.hizlan.classList.remove('vurgu'); }
function anlat(k) { if (!SES.konusuyor() && oyAra <= 0) { SES.soyle(k); oyAra = 0.9; } else oyBekleyen = k; }   // cümleler üst üste binmez
function ovgu() { if (zaman - sonOvgu < 24 || SES.konusuyor() || oyBekleyen) return; sonOvgu = zaman; SES.soyle('ovgu' + (1 + ((R() * 3) | 0))); }

// ───────── girdi ─────────
const dugmeMi = e => e.target && e.target.closest && e.target.closest('button');
function parmakX(e) { const dik = innerWidth < innerHeight; hedefD = clamp(((e.clientX / innerWidth) - 0.5) * 2 * DMAX * (dik ? 1.3 : 1.65), -DMAX, DMAX); }
const birak = () => { parmak = false; oyPid = null; hedefD = null; };
addEventListener('pointerdown', e => {
  if (dugmeMi(e) || durum === 'baslik' || mola) return;
  if (durum === 'giris' && durumT > 0.8) { SES.sus(); gec('sayim'); }
  if (oyPid !== null) return;                       // ikinci parmak direksiyonu bozmasın
  oyPid = e.pointerId; parmak = true; parmakX(e);
});
addEventListener('pointermove', e => { if (parmak && e.pointerId === oyPid) parmakX(e); });
const oyBirakE = e => { if (e.pointerId === oyPid) birak(); };
addEventListener('pointerup', oyBirakE); addEventListener('pointercancel', oyBirakE);
const oyDokunBitti = e => { if (!e.touches || !e.touches.length) birak(); };   // kaçan "parmak kalktı" olayına karşı yedek
addEventListener('touchend', oyDokunBitti, { passive: true }); addEventListener('touchcancel', oyDokunBitti, { passive: true });
addEventListener('blur', birak); addEventListener('resize', birak);
addEventListener('keydown', e => { tus[e.code] = true; if (e.code === 'Space') { e.preventDefault(); if (durum === 'baslik') basla(); else roketDugme(); } });
addEventListener('keyup', e => { tus[e.code] = false; });
addEventListener('contextmenu', e => e.preventDefault());
$('oyna').addEventListener('click', basla);
$('tekrar').addEventListener('click', basla);
HUD.hizlan.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); roketDugme(); });
function molaAyar(m) { if (mola === m) return; mola = m; $('mola').classList.toggle('gizli', !m); SES.durdur(m); birak(); son = performance.now(); }
$('dur').addEventListener('click', () => molaAyar(true));
$('devam').addEventListener('click', () => molaAyar(false));
document.addEventListener('visibilitychange', () => { if (document.hidden && (durum === 'yaris' || durum === 'sayim' || durum === 'giris')) molaAyar(true); son = performance.now(); });

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
  const savrul = durum === 'yaris' ? clamp(-p.k * P.v * P.v * 0.03, -0.8, 0.8) * (hedefD !== null ? 1 : 0) : 0;   // virajda çok hafif dışa kayma; parmak kalkınca araba şeridinde kalır
  P.dv += (dv - P.dv) * oyUs(dt, 14);
  P.d = clamp(P.d + (P.dv + savrul) * dt, -DMAX, DMAX);
  P.yol += P.v * dt;
  if (roketT > 0) roketT -= dt; if (roketBekle > 0) roketBekle -= dt;
}
function rakipAdim(a, dt, onde, gecebilir) {
  const fark = P.yol - a.yol;   // + = rakip geride
  let hv = a.taban + (fark > 0 ? clamp(fark * 0.1, 0, 3.2) : clamp(fark * 0.08, -4.5, 0));   // gerideyse yetişir, öndeyse bekler
  if (durum === 'bitis' || P.bitti) hv = a.bitti ? 9 : Math.max(hv, 24);
  else if (fark >= 0) {
    if (a !== gecebilir) hv = Math.min(hv, P.v + clamp((fark - 17) * 0.6, -3.5, 6));   // geçmeyecek olanlar kameranın arkasında bekler, görüşü kapatmaz          // Feza hep ilk üçte: en çok iki rakip öne geçebilir
    else if (P.yol > TUR * L - 170 && fark < 12) hv = Math.min(hv, P.v - 0.3);              // son düzlükte Feza'nın yeri alınmaz
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
  const gezi = clamp((zaman - 3) / 5, 0, 1), serit = clamp(IZGARA[a.i][1] * (1 - 0.3 * gezi) + Math.sin(zaman * 0.21 + a.faz) * 2.1 * gezi + a.it, -DMAX + 0.5, DMAX - 0.5);
  a.dv += (clamp((serit - a.d) * 2, -3.4, 3.4) - a.dv) * oyUs(dt, 4);   // şerit değiştirme yumuşak
  a.d = clamp(a.d + a.dv * dt, -DMAX, DMAX);
  a.yol += a.v * dt;
  if (!P.bitti && durum === 'yaris' && fark >= 0 && a !== gecebilir && a.yol > P.yol - 4.3) { a.yol = P.yol - 4.3; if (a.v > P.v) a.v = P.v; }
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
function toplananlar(dt) {
  const s = ((P.yol % L) + L) % L;
  for (const y of YILDIZ) {
    if (!y.var) { if (y.pat > 0) y.pat -= dt; continue; }
    let ds = Math.abs(y.s - s); if (ds > L / 2) ds = L - ds;
    if (ds < 2.6 && Math.abs(y.d - P.d) < 2.3) { y.var = false; y.pat = 0.3; yildizSay++; HUD.yildiz.textContent = yildizSay; SES.efekt.yildiz(); OLAY.emit('yildiz', y); if (yildizSay % 12 === 0) ovgu(); }
  }
  for (const o of OKLAR) { const ds = s - o.s; if (ds > 0 && ds < 3.5 && Math.abs(o.d - P.d) < 2.9 && roketT < 0.9) roket(1.3); }
  for (const o of TUMSEK) { const ds = s - o.s; if (ds > 0 && ds < 2.5 && Math.abs(o.d - P.d) < 3.1 && P.hop <= 0) { P.hop = 0.95; SES.efekt.hop(); OLAY.emit('hop'); if (R() < 0.3 && !SES.konusuyor() && !oyBekleyen && zaman - sonOvgu > 14) { sonOvgu = zaman; SES.soyle('hop'); } } }
}
function yarisAdim(dt) {
  zaman += dt;
  let onde = 0, gecebilir = null;
  for (const a of A) { if (a === P) continue; if (a.yol > P.yol) onde++; else if (!gecebilir || a.yol > gecebilir.yol) gecebilir = a; }
  if (onde >= 2) gecebilir = null;   // önde iki rakip varsa başka kimse Feza'yı geçemez
  oyuncuAdim(dt); for (const a of A) if (a !== P) rakipAdim(a, dt, onde, gecebilir);
  carpisma(dt);
  if (durum === 'yaris') {
    toplananlar(dt);
    const tur = Math.floor(Math.max(0, P.yol) / L);
    if (tur !== turSesi) {
      if (turSesi >= 0 && tur > turSesi) { HUD.turlar[turSesi] && HUD.turlar[turSesi].classList.add('tamam'); for (const y of YILDIZ) { y.var = true; y.pat = 0; } if (tur < TUR) SES.efekt.tur(); OLAY.emit('tur', tur); if (tur === TUR - 1) anlat('sontur'); }
      turSesi = tur;
    }
    if (SES.konusuyor()) oyAra = 0.9; else if (oyAra > 0) oyAra -= dt;
    if (oyBekleyen && oyAra <= 0 && !SES.konusuyor()) { SES.soyle(oyBekleyen); oyBekleyen = null; oyAra = 0.9; }
    if (ipucu === 0 && zaman > 4 && oyAra <= 0 && !SES.konusuyor()) { ipucu = 1; SES.soyle('yildiz'); oyAra = 0.9; }
    if (ipucu === 1 && zaman > 14 && oyAra <= 0 && !SES.konusuyor()) { ipucu = 2; if (!roketKullanildi) { SES.soyle('roket'); oyAra = 0.9; HUD.hizlan.classList.add('vurgu'); } }
    elGoster(!ilkSurus && !OTO && zaman > (ilkYaris ? 0.5 : 7) && zaman < 22);
    siralama(); if (P.sira !== oySonSira) { oySonSira = P.sira; HUD.sira.textContent = P.sira; OLAY.emit('sira', P.sira); }
    HUD.dolum.style.height = (clamp(roketBekle / 5, 0, 1) * 100) + '%';
    if (P.yol >= TUR * L) bitir();
  }
}
function bitir() {
  let biten = 0; for (const a of A) if (a !== P && a.bitti) biten++;
  P.bitti = true; const s = Math.min(3, biten + 1); P.sira = s; oyBitisSira = s; oySure = zaman;
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
  const dik = innerWidth < innerHeight, ba = Math.atan2(P.tx, P.tz);
  let k = 9, fov = dik ? 78 : 62;
  if (oyHopOnce > 0 && P.hop <= 0) oySars = 0.32; oyHopOnce = P.hop; if (oySars > 0) oySars -= gdt;
  oyRoketK += ((roketT > 0 && durum === 'yaris' ? 1 : 0) - oyRoketK) * oyUs(gdt, 3.5);
  if (durum === 'baslik') {
    const a = yT * 0.2 + 0.75, ri = (dik ? 16 : 12.5) * Math.cos(a), ry = 6.2 * Math.sin(a);   // oval dönüş: kamera yolun üstünde kalır, ağaçlara girmez
    kamH.set(P.x + P.tx * ri + P.tz * ry, dik ? 8 : 5.2, P.z + P.tz * ri - P.tx * ry); kamB.set(P.x + P.tx * 2, 1.1, P.z + P.tz * 2); k = 2.5;
  } else if (durum === 'bitis') {   // Feza'nın çevresinde kutlama dönüşü (arkadan başlar)
    const a = Math.PI + Math.min(durumT, 1.2) * 0.5 + Math.max(0, durumT - 1.2) * 0.32, r = (dik ? 12 : 9.5) - Math.min(1.5, durumT * 0.8), ri = r * Math.cos(a), ry = Math.min(r, 6) * Math.sin(a);
    kamH.set(P.x + P.tx * ri + P.tz * ry, dik ? 5.4 : 3.7, P.z + P.tz * ri - P.tx * ry); kamB.set(P.x, 1.3, P.z); k = 5;
  } else {
    tmp.set(P.tx, 0, P.tz); kamF.lerp(tmp, oyUs(gdt, 4.5)).normalize();
    oyGeriEk += ((bekliyor ? 1 : 0) - oyGeriEk) * oyUs(gdt, 1.6);   // dizilişte biraz geriden: arkadaki arabalar da görünsün
    const geri = (dik ? 13 : 9.6) + oyRoketK * 1.5 + oyGeriEk * 3.4, yuk = (dik ? 7.2 : 4.6) + oyRoketK * 0.3 + oyGeriEk * 1.1, mx = P.x + P.tz * P.d * 0.45, mz = P.z - P.tx * P.d * 0.45;
    kamH.set(mx - kamF.x * geri, yuk, mz - kamF.z * geri);
    if (oySars > 0) kamH.y += Math.sin(yT * 46) * 0.16 * (oySars / 0.32);
    const il = pist(P.yol + 15, oyO2), ib = dik ? 10 : 9;   // virajda hafif öne bakış: yolun ilerisine doğru
    kamB.set(lerp(mx + kamF.x * ib, il.x, 0.4), 1.3, lerp(mz + kamF.z * ib, il.z, 0.4));
    k = durum === 'giris' ? 1.5 : durum === 'sayim' ? 3 : 9; fov += oyRoketK * 7;
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
  if (kare > 120 && kareOrt > 21 && oran > 1) { if (++yavas > 90) { oran = Math.max(1, oran - 0.25); boyut(); yavas = 0; kare = 0; } } else yavas = Math.max(0, yavas - 1);
  if (mola) { if (!document.hidden) renderer.render(scene, camera); return; }
  let dt = ham * ZAMAN;
  durumT += dt;
  if (durum === 'giris') { if (durumT > 5.2) gec('sayim'); }
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
      if (oyBitisAsama === 1 && durumT > 3) { oyBitisAsama = 2; $('sonuc').classList.remove('gizli'); }
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
izgarayaDiz(); for (const a of A) arabaYerlestir(a, 0);
if (Q.has('atla')) basla();
requestAnimationFrame(dongu);

window.YARIS = {
  get durum() { return durum; }, get zaman() { return zaman; }, get mola() { return mola; }, P, A, L, TUR, renderer, scene, camera,
  get kareMs() { return kareOrt; }, get oran() { return oran; }, basla, roket: roketDugme,
  surukle(d) { hedefD = d; },
  bilgi() { return { durum, tur: Math.floor(Math.max(0, P.yol) / L), sira: P.sira, yildiz: yildizSay, v: +P.v.toFixed(1), d: +P.d.toFixed(2), sure: +(durum === 'bitis' ? oySure : zaman).toFixed(1), el: oyElAcik, mola, cizim: renderer.info.render.calls, ucgen: renderer.info.render.triangles, oran, kareMs: +kareOrt.toFixed(2) }; }
};
