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
  let k = (Math.floor((i - 1) * n / 4) + Math.max(0, PIST_TEMALARI.indexOf(PIST_TEMA))) % n;   /* pist sırası kadar kaydır: her pistte başka rakip arabalar, on iki arabanın hepsi rakip olur */ for (const x of t) if (x && x.id !== oyArabaId && k-- === 0) return x.id;   // 8 rakip tipte eskisiyle aynı (0,2,4,6); 11'de 0,2,5,8 → yeni arabalar da rakip olur
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
// ───────── ekran akışı: açılış → seçim (pist adımı → araba adımı) → yarış. Durum hepsinde 'baslik'; hangi ekranın açık olduğu oyEkran'da. ─────────
const OY_SECIM = $('secim');
let oyEkran = 'acilis', oySec = null;   // oyEkran: 'acilis' | 'pist' | 'araba' | '' (yarış)
function oyEkranAc(ad) {
  if (durum !== 'baslik' || (ad !== 'acilis' && ad !== 'pist' && ad !== 'araba')) return;
  oyEkran = ad;
  $('baslik').classList.toggle('gizli', ad !== 'acilis');
  OY_SECIM.classList.toggle('gizli', ad === 'acilis');
  if (ad !== 'acilis') OY_SECIM.dataset.adim = ad;
  if (ad !== 'araba') oySecBirak(); else if (oySec) oySec.w = 0;
  if (ad === 'acilis') oyKamIlk = true;
  P.bitti = ad === 'acilis';   // açılışta Feza kollarını kaldırıp sevinçle sallanır (yarışta bitiş sevinci ile aynı hareket); izgarayaDiz sıfırlar
  OLAY.emit('ekran', ad);
}
// Araba adımı: seçili araba (gerçek model, Feza içinde) aynı çiziciyle, yumuşak renkli küçük bir sahnede döner tablada gösterilir.
// Araba nesnesi yalnız ödünç alınır (P.g tablaya takılır); yarışa geçerken pist sahnesine geri konur ve bu sahne bırakılır.
function oySecKur() {
  if (oySec) return oySec;
  const sahne = new T.Scene(), atik = [];
  sahne.background = tuvalDoku(512, 512, (g, w, h) => {   // gökyüzü, arabanın arkasında yumuşak ışık, uzakta sakin tepeler ve birkaç bulut (tek resim)
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8fd0ff'); gr.addColorStop(0.55, '#d8f0ff'); gr.addColorStop(1, '#fff2cf'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const ic = g.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, w * 0.42); ic.addColorStop(0, 'rgba(255,255,255,.9)'); ic.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = ic; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; for (const [x, y, r] of [[70, 92, 22], [96, 82, 28], [124, 94, 20], [392, 70, 20], [418, 60, 27], [446, 72, 19]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = '#bfe6a0'; g.beginPath(); g.moveTo(0, h * 0.74); g.quadraticCurveTo(w * 0.22, h * 0.6, w * 0.46, h * 0.72); g.quadraticCurveTo(w * 0.72, h * 0.62, w, h * 0.7); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    g.fillStyle = '#a5d987'; g.beginPath(); g.moveTo(0, h * 0.84); g.quadraticCurveTo(w * 0.3, h * 0.74, w * 0.6, h * 0.83); g.quadraticCurveTo(w * 0.82, h * 0.88, w, h * 0.8); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  });
  sahne.fog = new T.Fog(0xffffff, 600, 2400);   // pist sahnesiyle aynı ışık/sis düzeni: araba malzemeleri yeniden derlenmez
  sahne.add(new T.HemisphereLight(0xffffff, 0xcdbfae, 1.18));
  const gun = new T.DirectionalLight(0xfff2d0, 1.5); gun.position.set(7, 13, 9); sahne.add(gun);
  const ekle = (geo, malz, y) => { const m = new T.Mesh(geo, malz); m.position.y = y; sahne.add(m); atik.push(geo, malz); return m; };
  // döner tabla: üstte beyaz-yeşil yarış diski ve damalı kenar şeridi (tek resim), yanda kırmızı-beyaz bant, altta altın taban
  const tablaDk = tuvalDoku(512, 512, (g, w) => {
    const m = w / 2; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(m, m, m, 0, 7); g.fill();
    for (let i = 0; i < 48; i++) { for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#ffffff' : '#17335c'; g.beginPath(); g.arc(m, m, m - j * 13, i * Math.PI / 24, (i + 1) * Math.PI / 24); g.arc(m, m, m - (j + 1) * 13, (i + 1) * Math.PI / 24, i * Math.PI / 24, true); g.fill(); } }
    g.fillStyle = '#ffd45e'; g.beginPath(); g.arc(m, m, m - 26, 0, 7); g.fill();
    const gr = g.createRadialGradient(m, m, 0, m, m, m - 40); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.8, '#f4fbff'); gr.addColorStop(1, '#e2f1fb'); g.fillStyle = gr; g.beginPath(); g.arc(m, m, m - 40, 0, 7); g.fill();
  });
  const bantDk = tuvalDoku(256, 8, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#f0503e'; g.fillRect(i * w / 16, 0, w / 16, h); } });
  atik.push(tablaDk, bantDk);
  ekle(new T.CylinderGeometry(2.65, 2.75, 0.3, 48, 1, true, Math.PI, Math.PI * 2)   /* dikiş arkada kalsın */, new T.MeshBasicMaterial({ map: bantDk }), -0.15);
  ekle(new T.CircleGeometry(2.65, 48), new T.MeshBasicMaterial({ map: tablaDk }), 0).rotation.x = -Math.PI / 2;
  ekle(new T.CylinderGeometry(3.0, 3.12, 0.24, 48, 1, true), new T.MeshBasicMaterial({ color: 0xf5b638 }), -0.42);
  ekle(new T.RingGeometry(2.65, 3.0, 48), new T.MeshBasicMaterial({ color: 0xffd45e }), -0.3).rotation.x = -Math.PI / 2;
  const golgeDk = tuvalDoku(64, 64, g => { const gr = g.createRadialGradient(32, 32, 3, 32, 32, 32); gr.addColorStop(0, 'rgba(40,60,100,.42)'); gr.addColorStop(1, 'rgba(40,60,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const golge = ekle(new T.PlaneGeometry(4.4, 5.6), new T.MeshBasicMaterial({ map: golgeDk, transparent: true, depthWrite: false }), 0.012); golge.rotation.x = -Math.PI / 2;
  atik.push(golgeDk, sahne.background);
  const mil = new T.Group(); sahne.add(mil); mil.add(golge);
  for (const m of [...sahne.children]) if (m.material && m.material.map === tablaDk) mil.add(m);   // damalı disk arabayla birlikte döner
  oySec = { sahne, mil, kam: new T.PerspectiveCamera(30, 1, 0.5, 300), atik, w: 0, h: 0, aci: 0.6, hazir: false };
  return oySec;
}
function oySecCiz(dt, gdt) {
  const s = oySecKur(), w = innerWidth, h = innerHeight;
  arabaYerlestir(P, dt);                                   // sürücü, tekerler ve "merhaba" zıplaması aynen çalışır
  if (P.g.parent !== s.mil) s.mil.add(P.g);                // araba değiştiyse yeni model de tablaya alınır
  P.g.position.x = 0; P.g.position.z = 0;
  const yon = pist(P.yol, oyO2);
  s.aci += gdt * 0.55; s.mil.rotation.y = s.aci - Math.atan2(yon.tx, yon.tz);
  if (w !== s.w || h !== s.h) {                            // arabayı seçim ekranındaki boşluğun (#sec-sahne) ortasına sığdır
    s.w = w; s.h = h;
    const r = $('sec-sahne').getBoundingClientRect(), rw = Math.max(120, r.width), rh = Math.max(120, r.height);
    const uz = Math.max(2.3 * h / rh, 3.9 * h / rw) / Math.tan(15 * Math.PI / 180), eg = 0.24;
    s.kam.aspect = w / h; s.kam.setViewOffset(w, h, w / 2 - (r.left + rw / 2), h / 2 - (r.top + rh / 2), w, h);
    s.kam.position.set(0, 1.05 + uz * Math.sin(eg), uz * Math.cos(eg)); s.kam.lookAt(0, 1.05, 0); s.kam.updateProjectionMatrix();
  }
  renderer.render(s.sahne, s.kam);
  if (!s.hazir) { s.hazir = true; OY_SECIM.classList.add('sec-3b'); }
}
function oySecBirak(sok) {   // arabayı pist sahnesine geri koy; sok = sahneyi de bırak (yarışa geçiş)
  OY_SECIM.classList.remove('sec-3b');
  if (!oySec) return;
  oySec.hazir = false;
  if (P.g.parent === oySec.mil) { scene.add(P.g); arabaYerlestir(P, 0); }
  if (sok) { for (const x of oySec.atik) if (x && x.dispose) x.dispose(); oySec = null; }
}
// Pist kartı için küçük resim: bu pist çizicinin kendisiyle bir kez (açılışta, ilk kareden önce) küçük boyda çizilir; arayuz.js saklar ve kartta gösterir.
function oyKucukCek() {
  const W = 400, H = 300, kp = camera.position.clone(), kq = camera.quaternion.clone(), gor = [];
  try {
    for (const a of A) { gor.push(a.g.visible, a.golge ? a.golge.visible : false); a.g.visible = false; if (a.golge) a.golge.visible = false; }
    renderer.setPixelRatio(1); renderer.setSize(W, H, false);
    const p = pist(L - 46, oyO2); camera.position.set(p.x - p.tz * 2.2, 7.5, p.z + p.tx * 2.2);
    const q = pist(L - 4, oyO2); camera.lookAt(q.x, 3.4, q.z);
    camera.fov = 60; camera.aspect = W / H; camera.updateProjectionMatrix();
    pistGuncelle(0.016, 0); cevreGuncelle(0.016, 0);
    renderer.render(scene, camera);
    const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(canvas, 0, 0, W, H);
    OLAY.emit('kucuk', c.toDataURL('image/jpeg', 0.8));
  } catch (e) { console.error(e); }
  for (let i = 0; i < A.length; i++) { A[i].g.visible = gor.length > i * 2 ? gor[i * 2] : true; if (A[i].golge) A[i].golge.visible = gor.length > i * 2 ? gor[i * 2 + 1] : true; }
  camera.position.copy(kp); camera.quaternion.copy(kq); boyut();
}
// Yarış sonu sıralaması (yalnız okuma): bitişte bir kez saklanır. Rakipler ilerlemeye göre dizilir, Feza kendi `sira` yerine konur.
// Portre: her sürücünün yüzü gerçek 3B modelden aynı çiziciyle (ikinci bağlam yok) küçük bir köşeye bir kez çizilir, resim olarak saklanır.
let oySonSiralama = null, oyPortreSahne = null;
const oyPortre = {};
function oyPortreCek() {
  const boy = renderer.getSize(new T.Vector2()), pr = renderer.getPixelRatio(), S = 96, C = 128;
  try {
    if (!oyPortreSahne) {
      const s = new T.Scene(); s.background = new T.Color(0xeaf6ff); s.fog = new T.Fog(0xffffff, 600, 2400);   // pist sahnesiyle aynı ışık/sis: yeniden derleme yok
      s.add(new T.HemisphereLight(0xffffff, 0xcdbfae, 1.25)); const gun = new T.DirectionalLight(0xfff2d0, 1.5); gun.position.set(4, 9, 12); s.add(gun);
      oyPortreSahne = { s, kam: new T.PerspectiveCamera(24, 1, 0.05, 60), kutu: new T.Box3(), m: new T.Vector3(), b: new T.Vector3() };
    }
    const { s, kam, kutu, m, b } = oyPortreSahne;
    renderer.setScissorTest(true); renderer.setViewport(0, 0, S, S); renderer.setScissor(0, 0, S, S);
    for (const a of A) {
      const k = a.tur + '|' + a.tip; if (oyPortre[k] || !a.arKafa) continue;
      const ana = a.g.parent, pos = a.g.position.clone(), q = a.g.quaternion.clone(), gor = a.g.visible;
      s.add(a.g); a.g.position.set(0, 0, 0); a.g.quaternion.identity(); a.g.visible = true; a.g.updateMatrixWorld(true);
      kutu.setFromObject(a.arKafa); kutu.getCenter(m); const r = Math.max(0.2, kutu.getSize(b).length() * 0.5);
      kam.position.set(m.x + r * 0.55, m.y + r * 0.45, m.z + r * 2.75); kam.lookAt(m.x, m.y - r * 0.08, m.z); kam.near = r * 1.7; kam.updateProjectionMatrix();   // yüzün önündeki araba süsü (ör. tek boynuzlu at başı) kesilir
      renderer.render(s, kam);
      const c = document.createElement('canvas'); c.width = c.height = C;
      c.getContext('2d').drawImage(canvas, 0, canvas.height - S * pr, S * pr, S * pr, 0, 0, C, C);
      oyPortre[k] = c.toDataURL('image/png');
      if (ana) ana.add(a.g); else s.remove(a.g);
      a.g.position.copy(pos); a.g.quaternion.copy(q); a.g.visible = gor;
    }
  } catch (e) { console.warn('portre', e); }
  renderer.setScissorTest(false); renderer.setViewport(0, 0, boy.x, boy.y);
}
function oySiralamaVer() {
  if (!oySonSiralama) return [];
  return oySonSiralama.map((a, i) => ({ kim: a.tur, sira: i + 1, renk: a.renk, renk2: a.renk2, tip: a.tip, oyuncu: a === P, portre: oyPortre[a.tur + '|' + a.tip] || null }));
}
function basla() {
  SES.hazirla(); oySecBirak(true); oyEkran = ''; izgarayaDiz(); molaAyar(false);
  $('baslik').classList.add('gizli'); OY_SECIM.classList.add('gizli'); $('sonuc').classList.add('gizli'); HUD.hud.classList.remove('gizli');
  if (ilkYaris) { gec('giris'); SES.soyle(SES.CUMLE && SES.CUMLE['giris_' + PIST_TEMA] ? 'giris_' + PIST_TEMA : 'giris'); } else gec('sayim');
}
function oyBaslikDiz() { A[1].yol = A[2].yol = 3; A[3].yol = A[4].yol = -18; }   // seçim ekranında arkadaşlar biraz açılır: Feza'nın arabası rahat görünür
function basligaDon() {
  SES.sus(); izgarayaDiz(); oyBaslikDiz(); molaAyar(false);
  HUD.hud.classList.add('gizli'); $('sonuc').classList.add('gizli');
  gec('baslik'); oyEkranAc('pist');   // sonuçtan ve ev düğmesinden doğrudan seçim ekranına
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
  if (e.code === 'Space' && !e.repeat) { if (durum === 'baslik') (oyEkran === 'acilis' ? $('oyna') : $('sec-ileri')).click(); else roketDugme(); }
});
addEventListener('keyup', e => { tus[e.code] = false; });
addEventListener('contextmenu', e => e.preventDefault());
$('oyna').addEventListener('click', () => oyEkranAc('pist'));
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
// Yalnız test: ?oto=iyi|orta|zayif kendi süren Feza'nın becerisi (rakip ayarını ölçmek için). Boş ?oto = eski salınım.
const OY_OTO = OTO ? (Q.get('oto') || '') : '';
function oyOtoHedef() {
  if (OY_OTO !== 'iyi' && OY_OTO !== 'orta') return Math.sin(zaman * 0.6) * (OY_OTO === 'zayif' ? 2.6 : 3.4);
  const s = ((P.yol % L) + L) % L, tur = Math.max(0, Math.floor(P.yol / L)), iyi = OY_OTO === 'iyi';
  if (durum === 'yaris' && roketBekle <= 0 && (iyi || zaman % 14 < 0.5)) roketDugme();
  let h = null, hu = iyi ? 45 : 26;
  for (const y of YILDIZ) { const u = (((y.s - s) % L) + L) % L; if (y.var && u < hu && (iyi || (y.grup + tur) % 3)) { hu = u; h = y.d; } }
  if (h === null && iyi) for (const o of OKLAR) { const u = (((o.s - s) % L) + L) % L; if (o.tur !== tur && u < 60) h = o.d; }
  return h === null ? Math.sin(zaman * 0.6) * 2 : h;
}
function oyuncuAdim(dt) {
  const p = pist(P.yol, o1), kenar = clamp((Math.abs(P.d) - (DMAX - 0.9)) / 0.9, 0, 1);
  const hedefV = durum === 'bitis' ? 9 : OYV * (1 - 0.09 * kenar * kenar) + (roketT > 0 ? 8.5 : 0);   // kenar bandı: hafif, yumuşak yavaşlama
  P.v += (hedefV - P.v) * oyUs(dt, hedefV > P.v ? 1.6 : 1.0);
  let dv = 0, surdu = false;
  if (durum === 'bitis') dv = clamp((0 - P.d) * 1.2, -4, 4);
  else if (OTO) dv = clamp((oyOtoHedef() - P.d) * 3, -9, 9);
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
// Rakip formu: her yarışın başında iki rakip rastgele "formunda" seçilir, diğer ikisi sakin (23,4–25 m/sn). Yarış türü de rastgele:
// sakin (%15: en hızlısı 25,4–27,4) · olağan (%65: en hızlısı 27,8–31,4, ikincisi 25,2–29,8) · çetin (%20: ikisi de hızlı ve yakın).
// Birincilik böylece hak edilir: iyi sürüşte (yıldız + roket) çoğu kez birinci, ortalama sürüşte çoğu kez ikinci-üçüncü.
const RK_SAKIN = 0.15, RK_CETIN = 0.2;
function rkFormSec() {
  const r = A.slice(1), u = Math.random(), z = Math.random;
  for (const x of r) { x.gecis = false; x.gecBekle = 0; }
  for (let i = r.length - 1; i > 0; i--) { const j = (z() * (i + 1)) | 0, t = r[i]; r[i] = r[j]; r[j] = t; }
  let p1, p2;
  if (u < RK_SAKIN) { p1 = 25.4 + z() * 2; p2 = 24.6 + z() * (p1 - 25); }
  else if (u < RK_SAKIN + RK_CETIN) { p1 = 29.4 + z() * 2.2; p2 = p1 - 0.3 - z(); }
  else { p1 = 27.8 + z() * 3.6; p2 = Math.min(p1 - 0.4, 25.2 + z() * 4.6); }
  r[0].hiz = p1; r[0].form = 1; r[1].hiz = p2; r[1].form = 2;
  for (let i = 2; i < r.length; i++) { r[i].hiz = 23.4 + z() * 1.6; r[i].form = 0; }
}
OLAY.on('durum', d => { if (d === 'yaris') rkFormSec(); });
function rakipAdim(a, dt, onde, gecebilir) {
  const fark = P.yol - a.yol;   // + = rakip geride
  if (a.okT > 0) a.okT -= dt;
  if (a.hiz === undefined) rkFormSec();
  const izinli = a === gecebilir || a.onde;   // geçebilecek olan ya da bu adımın başında zaten önde olan (sıralama sırası haksız fren yaptırmasın)
  // Yumuşak lastik bant: rakip kendi hızında gider; gerideyse biraz hızlanıp yakın kalır, öndeyse biraz bekler (son turda daha sıkı: yakın kalırlar).
  // Çok geride kalan yetişir (aynada görünsün) ama 25 m'den yakına bu ekle gelmez.
  const sonTur = P.yol > (TUR - 1) * L;
  let hv = a.hiz + (fark > 0 ? clamp(fark * (sonTur ? 0.15 : 0.12), 0, sonTur ? 4 : 3.5) : clamp(fark * (sonTur ? 0.1 : 0.06), sonTur ? -3.5 : -2.5, 0))
    + clamp((fark - 25) * 0.15, 0, 6) + (a.okT > 0 ? 4 : 0);
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
  else if (fark >= 0 && !izinli) { hv = Math.min(hv, P.v + clamp((fark - 17) * 0.6, -3.5, 6)); a.gecis = false; }   // geçmeyecek olanlar kameranın arkasında bekler, görüşü kapatmaz (Feza hep ilk üçte: en çok iki rakip öne geçebilir; son düzlükte de geçiş olabilir)
  else {
    // Geçiş hamlesi: yetişen formdaki rakip Feza'nın yanında oyalanmaz, biraz hızlanıp (en çok +2,5 m/sn) 5 m öne geçer. Feza roket yakarsa vazgeçer.
    if (a.onde && fark >= 0) { a.gecBekle = 3; a.gecis = false; }   // Feza az önce geçti: 3 sn hemen karşılık vermez
    if (a.gecBekle > 0) a.gecBekle -= dt;
    else if (a === gecebilir && a.form && fark >= 0 && fark < 6) a.gecis = true;
    if (fark < -5 || fark > 10 || roketT > 0 || durum !== 'yaris') a.gecis = false;
    if (a.gecis) hv = Math.max(hv, Math.min(P.v + 2.5, a.hiz + 4));
  }
  if (durum === 'yaris' && !P.bitti && fark > -6 && fark < OY_KOR_GERI + 2) {   // Feza kenara doğru geliyor ve rakibe yer kalmıyor: sıkışmadan önce öne ya da arkaya açılır
    const yan = a.d >= P.d ? 1 : -1, pd = P.d + P.dv * 0.5;
    if (pd * yan + OY_KOR_YAN > DMAX - 0.9 && (a.d - pd) * yan < OY_KOR_YAN + 1.6) { if (fark < 1.2 && (fark < 0 || izinli)) hv = Math.max(hv, P.v + 5); else hv = Math.min(hv, P.v - 5.5); }
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
  if (!P.bitti && durum === 'yaris' && fark >= 0 && !izinli && a.yol > P.yol - 4.3) {
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
  for (const a of A) { if (a === P) continue; a.onde = a.yol > P.yol; if (a.onde) onde++; else if (!gecebilir || a.yol > gecebilir.yol) gecebilir = a; }
  for (const a of A) if (a !== P && a.yol <= P.yol && P.yol - a.yol < 60 && (a.hiz || 0) > (gecebilir.hiz || 0)) gecebilir = a;   // geçme hakkı yakındaki en formda rakibin
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
  oySonSiralama = A.filter(a => a !== P).sort((x, y) => y.yol - x.yol); oySonSiralama.splice(s - 1, 0, P);   // sıralama ekranı için (bir kez)
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
    // Açılış: kamera Feza'nın arabasının ön-yanında yakın durur, yavaşça salınır.
    const a = 1.25 + Math.sin(yT * 0.3) * 0.42, r = dik ? 9.2 : 7.6, ri = r * Math.cos(a), ry = Math.min(6.4, r * Math.sin(a));
    kamH.set(P.x + P.tx * ri - P.tz * ry, dik ? 4 : 3.1, P.z + P.tz * ri + P.tx * ry); kamB.set(P.x, dik ? -0.6 : 0.1, P.z); k = 2.5;   // açılış: araba logonun altında, yeşil düğmenin üstünde
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
      if (oyBitisAsama === 1 && durumT > 3) { oyBitisAsama = 2; oyPortreCek(); $('sonuc').classList.remove('gizli'); OLAY.emit('sonuc'); }
      if (oyBitisAsama === 2 && durumT > 7.5 && !SES.konusuyor()) { oyBitisAsama = 3; SES.soyle('tekrar'); }
    }
    const adim = Math.max(1, Math.ceil(dt / 0.034)), d1 = dt / adim, d0 = durum;   // hızlı zamanda da küçük adımlar
    for (let i = 0; i < adim && durum === d0; i++) yarisAdim(d1);
  }
  SES.motorAyar(P.v, durum === 'yaris' || durum === 'bitis');
  if (durum === 'baslik' && oyEkran === 'pist') return;                        // pist adımı tam ekranı kaplar: 3B çizilmez
  if (durum === 'baslik' && oyEkran === 'araba') { oySecCiz(dt, ham); return; }  // araba adımı: yalnız döner tabladaki araba
  sahneGuncelle(dt, ham);
  renderer.render(scene, camera);
}
dongu.n = -1;
izgarayaDiz(); oyBaslikDiz(); for (const a of A) arabaYerlestir(a, 0);
// Pist kartlarının resimleri hazır dosyalardır (icons/pist_<ad>.jpg). Yalnız ?kucuk ile açılınca (geliştirici) bu pistin resmi bir kez çizilir; oyun döngüsü başlamaz.
if (Q.has('kucuk')) oyKucukCek();
else {
  if (Q.has('atla')) basla(); else if (Q.get('adim') === 'araba') oyEkranAc('araba'); else P.bitti = true;
  // açılışta araba arada bir küçük bir "merhaba" zıplaması yapar (seçim ekranındaki selamın aynısı)
  setInterval(() => { if (durum === 'baslik' && oyEkran === 'acilis' && !document.hidden && P.ar) P.ar.mer = 0; }, 4200);
  requestAnimationFrame(dongu);
}

window.YARIS = {
  get durum() { return durum; }, get zaman() { return zaman; }, get mola() { return mola; }, pist: PIST_TEMA, P, A, L, TUR, renderer, scene, camera,
  get kareMs() { return kareOrt; }, get oran() { return oran; }, basla, basligaDon, get ekran() { return oyEkran; }, ekranAc: oyEkranAc, roket: roketDugme, get araba() { return oyArabaId; }, arabaSec: oyArabaSec,
  surukle(d) { hedefD = d; }, siralama: oySiralamaVer,
  bilgi() { return { pist: PIST_TEMA, araba: oyArabaId, durum, tur: Math.floor(Math.max(0, P.yol) / L), sira: P.sira, yildiz: yildizSay, seri: oySeriSay, seriAdet: oySeriAdet, roket: oyRoketSay, ziplama: oyHopSay, roketKalan: +roketT.toFixed(2), roketBekle: +roketBekle.toFixed(2), v: +P.v.toFixed(1), d: +P.d.toFixed(2), sure: +(durum === 'bitis' ? oySure : zaman).toFixed(1), el: oyElAcik, mola, cizim: renderer.info.render.calls, ucgen: renderer.info.render.triangles, oran, kareMs: +kareOrt.toFixed(2) }; }
};
