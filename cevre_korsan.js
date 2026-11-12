/* Korsan Adası pistinin çevresi (yalnız ?pist=korsan iken yüklenir, cevre.js'ten sonra).
   Yol, turkuaz bir lagünün ortasındaki altın kumlu adanın kıyısını dolaşır; adanın içi koyu yeşil orman tepeleri.
   Zemin tek tuval dokusu (1024): lagün, sığ su halkası, köpük, kum, orman lekeleri ve temas gölgeleri üstten çizilir (saydam yüzey yok).
   Manzara anları: koyda demirli tombul korsan gemisi (hafif sallanır, bayrakta gülen yüz) · kumda açık hazine sandığı (yumuşak altın ışıltı)
   · lagünde kaya kemer · adanın üstünde uçan iki papağan. Palmiyeler seyrek; yola en yakın ~9 m boş, başlangıç çevresi sade.
   Yeni üst düzey adlar `kr` ile başlar. Kare başına yeni nesne yok; ışık eklenmez. */
'use strict';

const krYer = {};   // odak yerleri (deneme ve kart resmi için)
let krSelale = null, krGemi = null, krHale = null, krPapagan = null, krBulut = null;
function cevreEkGuncelle(dt, t) {
  if (krGemi) { krGemi.rotation.z = Math.sin(t * 0.8) * 0.045; krGemi.rotation.x = Math.sin(t * 0.6 + 1) * 0.02; krGemi.position.y = Math.sin(t * 1.1) * 0.12 - 0.15; }
  if (krHale) { const s = 1 + Math.sin(t * 2.2) * 0.08; krHale.scale.set(5.6 * s, 5.6 * s, 1); krHale.material.opacity = 0.5 + Math.sin(t * 2.2) * 0.12; }
  if (krPapagan) krPapagan.rotation.y = -t * 0.28;
  if (krBulut) krBulut.rotation.y = t * 0.004;
  if (krSelale) krSelale.offset.y = t * 0.9;
}
if (cvTema === 'korsan') {
  scene.fog.color.setHex(0xd4f3f4); scene.fog.near = 300; scene.fog.far = 950;
  gunes.color.setHex(0xfff1cf);
  { // gök: yukarıda canlı tropik mavi, ufukta turkuaz-krem sıcak pus
    const c = scene.background.image, g = c.getContext('2d'), h = c.height, gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#1f86e0'); gr.addColorStop(0.16, '#3ea5ee'); gr.addColorStop(0.31, '#7fd0f4'); gr.addColorStop(0.41, '#c4f0f2'); gr.addColorStop(0.48, '#fff4d6'); gr.addColorStop(1, '#fff4d6');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, h); scene.background.needsUpdate = true;
  }
  cvGokIsik.color.setHex(0xffffff); cvGokIsik.groundColor.setHex(0xd8c8a0);
  let krT = 90210; const Rk = () => { krT = (krT * 1664525 + 1013904223) >>> 0; return krT / 4294967296; };
  const KUM = YARI + 22, SIG = YARI + 44;   // kumsal ve sığ su sınırı (yol ekseninden)
  // yol çokgeninin içi mi? (ada içi)
  const krIc = (x, z) => { let ic = false; for (let i = 0, j = N - 4; i < N; j = i, i += 4) { const xi = PX[i], zi = PZ[i], xj = PX[j], zj = PZ[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ic = !ic; } return ic; };
  const krDis = i => { const p = cvKenar(i, 1, 40); return krIc(p.x, p.z) ? -1 : 1; };   // yolun dış (deniz) yanı
  const S = cvYapi(), golge = [], koyuSu = [], parilti = [];
  const yer = (f, dis, uz, r, bos) => {   // yol kenarında boş yer ara (dis: 1 deniz yanı, -1 ada içi)
    for (let k = 0; k < 12; k++) { const i = cvI(f + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.006), yan = krDis(i) * dis, p = cvKenar(i, yan, uz, 0.2), d = yakin(p.x, p.z);
      if (d > (bos || YARI + r + 2) && cvBos(p.x, p.z, r)) { cvYasak.push([p.x, p.z, r]); return { x: p.x, z: p.z, ry: p.ry, i, yan }; } }
    return null;
  };
  const AHSAP = 0x9a6438, AHSAP2 = 0xc58a52, KIRMIZI = 0xe0483c, ALTIN = 0xffcf3a, KREM = 0xfffaf0;

  // ───────── 1) korsan gemisi: koyda demirli, tombul, dolgun yelkenli; ayrı çizim (sallanır) ─────────
  { const p = yer(0.27, 1, YARI + 47, 15, YARI + 39);
    if (p) {
      const B = cvYapi(), e = (g, x, y, z, sx, sy, sz, r, rx, ry, rz, dalga) => B.ekle(g, x, y, z, sx, sy, sz, r, rx || 0, ry || 0, rz || 0, 0, dalga || 0, 0);
      const govde = new T.SphereGeometry(1, 18, 9, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); govde.userData.cvTon = true;
      e(govde, 0, 2.2, 0, 3.1, 2.7, 6.6, 0xa66a3c);                   // tombul gövde (kase)
      e(cvG.sil, 0, 2.2, 0, 3.12, 0.42, 6.62, KIRMIZI);                 // kırmızı küpeşte şeridi
      e(cvG.sil, 0, 1.55, 0, 2.95, 0.22, 6.3, 0xffd76a);                // altın ince şerit
      e(cvG.sil, 0, 2.08, 0, 2.86, 0.12, 6.32, 0xd8a468);               // güverte
      for (const yan of [-1, 1]) for (let k = 0; k < 3; k++) { const z = -2.4 + k * 2.4, x = yan * 3.1 * Math.sqrt(Math.max(0, 1 - (z / 6.6) ** 2 - 0.06)); e(cvG.sil, x, 1.05, z, 0.5, 0.1, 0.5, 0xffd76a, 0, 0, Math.PI / 2); e(cvG.sil, x + yan * 0.04, 1.05, z, 0.38, 0.06, 0.38, 0xfff4c8, 0, 0, Math.PI / 2); }   // sarı yuvarlak pencereler
      e(cvG.kutuY, 0, 3.0, -4.3, 4.2, 2.0, 2.6, 0xa8703f);              // kıç köşkü
      e(cvG.kutuY, 0, 4.1, -4.3, 4.5, 0.35, 2.9, KIRMIZI);
      for (const x of [-1.1, 0, 1.1]) e(cvG.kutuY, x, 3.0, -2.98, 0.6, 0.8, 0.12, 0xffe48a);
      e(cvG.kutuY, 0, 3.0, -5.62, 2.6, 1.0, 0.12, 0xffe48a);
      e(cvG.sil5, 0, 3.0, 7.0, 0.13, 4.2, 0.13, AHSAP, 1.15);           // baş direği
      e(cvG.kureK, 0, 2.75, 6.25, 0.55, 0.55, 0.5, ALTIN);              // pruvada altın top süs
      const yelken = new T.SphereGeometry(1, 10, 8, Math.PI / 2 - 0.75, 1.5, Math.PI / 2 - 0.62, 1.24);
      for (const [z, h, s] of [[1.4, 13, 1], [-1.9, 10.5, 0.82]]) {
        e(cvG.sil, 0, h / 2 + 2, z, 0.2, h, 0.2, AHSAP);                // direk
        const b = 0.6, sb = Math.sin(b), cb = Math.cos(b);   // serenler ve yelkenler yana çevrik: yandan bakınca da dolgun görünür
        e(cvG.sil, 0, h * 0.45 + 2.3, z, 0.12, 7.2 * s, 0.12, AHSAP2, 0, b, Math.PI / 2); e(cvG.sil, 0, h * 0.82 + 2.1, z, 0.1, 5.4 * s, 0.1, AHSAP2, 0, b, Math.PI / 2);
        e(yelken, -1.3 * s * sb, h * 0.45 + 0.1, z - 1.3 * s * cb, 3.9 * s, 2.7 * s, 1.5 * s, KREM, 0, b);          // dolgun alt yelken
        e(yelken, -1.0 * s * sb, h * 0.82 - 0.8, z - 1.0 * s * cb, 2.5 * s, 1.75 * s, 1.15 * s, KIRMIZI, 0, b);    // kırmızı üst yelken
      }
      e(cvG.sil, 0, 12.6, 1.4, 0.75, 0.6, 0.75, 0xa8703f); e(cvG.sil, 0, 12.92, 1.4, 0.8, 0.12, 0.8, KIRMIZI);   // gözcü sepeti
      { // bayrak: lacivert zemin, gülen sarı yüz (dalgalanır)
        const fy = 15.0, fz = 0.3;
        e(cvG.kutu, 0, fy, fz, 0.06, 1.45, 2.2, 0x2c3a66, 0, 0, 0, 1);
        for (const s of [-1, 1]) {
          e(cvG.sil, s * 0.05, fy, fz, 0.5, 0.06, 0.5, ALTIN, 0, 0, Math.PI / 2, 1);
          for (const zz of [-0.17, 0.17]) e(cvG.kureK, s * 0.09, fy + 0.13, fz + zz, 0.03, 0.09, 0.07, 0x2c3a66, 0, 0, 0, 1);
          e(new T.TorusGeometry(0.22, 0.045, 4, 10, Math.PI), s * 0.09, fy - 0.03, fz, 1, 1, 1, 0x2c3a66, 0, Math.PI / 2, Math.PI, 1);
        }
        e(cvG.sil, 0, 14.6, 1.4, 0.06, 2.4, 0.06, AHSAP);
      }
      for (const yan of [-1, 1]) for (const z of [1.4, -1.9]) { const a = cvG.kutu; e(a, yan * 1.5, 7.5, z - 0.6, 0.04, 11, 0.04, 0x6b4126, 0, 0, -yan * 0.26); }   // halatlar
      const geo = B.geo(); krGemi = new T.Group(); krGemi.position.set(0, 0, 0);
      const m = new T.Mesh(geo, cvMalz(5, { side: T.DoubleSide, emissive: 0x2a2216 })); m.scale.setScalar(2.05); m.frustumCulled = false;
      krGemi.add(m); const kab = new T.Group(); kab.position.set(p.x, 0, p.z); kab.rotation.y = p.ry - 1.0; kab.add(krGemi); scene.add(kab);
      koyuSu.push([p.x, p.z, 17, 'koy']); krYer.gemi = [p.x, p.z, p.i];
      // gemiye uzanan ahşap iskele (kumdan suya)
      const ix = PX[p.i] - TZ[p.i] * (KUM - 6) * p.yan, iz = PZ[p.i] + TX[p.i] * (KUM - 6) * p.yan, dx = p.x - ix, dz = p.z - iz, l = Math.hypot(dx, dz), ry = Math.atan2(dx, dz), boy = l - 12;
      S.yer(ix, iz, ry);
      for (let k = 0; k < boy / 0.9; k++) S.ekle(cvG.kutuY, 0, 0.62 + (k % 2) * 0.02, 0.45 + k * 0.9, 3.0, 0.2, 0.8, k % 3 ? AHSAP2 : 0xb57a45);
      for (let k = 0; k <= boy / 3.2; k++) for (const x of [-1.45, 1.45]) { S.ekle(cvG.sil, x, 0.55, k * 3.2 + 0.4, 0.2, 1.6, 0.2, AHSAP); S.ekle(cvG.sil, x, 1.38, k * 3.2 + 0.4, 0.24, 0.1, 0.24, 0xd8a468); }
      for (const x of [-1.45, 1.45]) S.ekle(cvG.kutu, x, 1.2, boy / 2, 0.06, 0.06, boy, 0xe7cf9c);   // halat korkuluk
      for (let k = 0; k < 2; k++) { S.ekle(cvG.sil, 0.8 - k * 1.6, 1.15, boy - 1.2 - k * 0.4, 0.5, 0.95, 0.5, AHSAP2); S.ekle(cvG.sil, 0.8 - k * 1.6, 1.15, boy - 1.2 - k * 0.4, 0.53, 0.12, 0.53, KIRMIZI); }   // fıçılar
    }
  }

  // ───────── 2) hazine sandığı: kumda açık, içi altın; yumuşak ışıltı ─────────
  { const p = yer(0.6, -1, YARI + 11, 5);
    if (p) {
      S.yer(p.x, p.z, p.ry, 1.7);
      S.ekle(cvG.kutuY, 0, 0.62, 0, 2.2, 1.25, 1.45, 0x8d5631);                       // gövde
      for (const x of [-0.75, 0.75]) S.ekle(cvG.kutuY, x, 0.62, 0, 0.18, 1.3, 1.5, 0xf2b730);   // altın kuşaklar
      S.ekle(cvG.kutuY, 0, 1.22, 0, 2.28, 0.14, 1.52, 0xf2b730);
      S.ekle(cvG.kutuY, 0, 0.75, 0.74, 0.32, 0.4, 0.1, 0xf2b730); S.ekle(cvG.ufak, 0, 0.72, 0.8, 0.07, 0.07, 0.04, 0x6b4126);   // kilit
      // açık kapak: arkaya devrik yarım silindir
      S.ekle(cvG.kutuY, 0, 1.95, -0.92, 2.2, 1.45, 0.34, 0x9d6338, -0.3);
      for (const x of [-0.75, 0.75]) S.ekle(cvG.kutuY, x, 1.95, -0.92, 0.18, 1.5, 0.4, 0xf2b730, -0.3);
      // kumda dağılmış birkaç altın para, kürek ve kırmızı X (zemin dokusunda)
      for (let k = 0; k < 7; k++) { const a = k * 2.1 + 0.4, r = 1.6 + (k % 3) * 0.45; S.ekle(cvG.sil, Math.cos(a) * r, 0.05, Math.sin(a) * r * 0.8 + 0.6, 0.17, 0.05, 0.17, 0xffcf3a, 0.12 * (k % 2), 0, 0.1); }
      for (const a of [0.8, -0.8]) S.ekle(cvG.kutuY, -0.4, 0.03, 2.3, 1.7, 0.06, 0.32, KIRMIZI, 0, a);   // kumda kırmızı X
      S.ekle(cvG.sil, 2.0, 0.85, -0.6, 0.06, 1.7, 0.06, AHSAP, 0, 0, -0.25); S.ekle(cvG.kutuY, 2.28, 0.05, -0.6, 0.45, 0.6, 0.1, 0xb8c3cc, 0, 0.3, -0.25);
      S.yer(p.x, p.z, p.ry);
      // altın (ışıksız parlak malzeme, ayrı çizim) + yumuşak hale (küçük sprite) + pırıltılar
      const A = cvYapi(); A.yer(p.x, p.z, p.ry, 1.7);
      for (let k = 0; k < 16; k++) { const x = -0.8 + (k % 6) * 0.32, z = -0.45 + Math.floor(k / 6) * 0.36; A.ekle(cvG.kureK, x, 1.28 + Math.sin(k * 1.7) * 0.06, z, 0.24, 0.13, 0.24, k % 3 ? 0xffd84a : 0xffe98a); }
      A.ekle(cvG.kureK, -0.2, 1.42, 0.0, 0.55, 0.22, 0.4, 0xffe066); A.ekle(cvG.kureK, 0.45, 1.4, -0.2, 0.45, 0.2, 0.35, 0xffd84a);
      A.ekle(cvG.okt, -0.55, 1.52, 0.1, 0.16, 0.2, 0.16, 0xff5f7a); A.ekle(cvG.okt, 0.3, 1.56, 0.25, 0.15, 0.19, 0.15, 0x5fd8ff); A.ekle(cvG.okt, 0.75, 1.5, -0.1, 0.14, 0.18, 0.14, 0x7ff08a);
      for (let k = 0; k < 9; k++) A.ekle(cvG.kureK, -0.9 + k * 0.22, 1.35 + Math.sin(k) * 0.05, 0.62 - Math.abs(k - 4) * 0.03, 0.07, 0.07, 0.07, 0xfff4c0);   // inci kolye
      const am = new T.Mesh(A.geo(), new T.MeshBasicMaterial({ vertexColors: true })); am.frustumCulled = false; scene.add(am);
      krHale = new T.Sprite(new T.SpriteMaterial({ map: tuvalDoku(128, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,236,140,0.85)'); r.addColorStop(0.35, 'rgba(255,220,110,0.35)'); r.addColorStop(1, 'rgba(255,220,110,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
      krHale.position.set(p.x, 2.6, p.z); scene.add(krHale);
      for (let k = 0; k < 9; k++) { const a = k * 0.7, r = 0.6 + (k % 3) * 0.5; parilti.push([p.x + Math.cos(a) * r, 2.6 + (k % 4) * 0.55, p.z + Math.sin(a) * r, 0.14, 0.22, 0.14, a]); }
      golge.push([p.x, p.z, 3.4, 2.6, 0.32]); krYer.sandik = [p.x, p.z, p.i]; 
    }
  }

  // ───────── 3) lagünde kaya kemer (yumuşak, sıcak kaya; üstünde yeşillik) ─────────
  { const p = yer(0.84, 1, YARI + 36, 10, YARI + 30);
    if (p) {
      S.yer(p.x, p.z, p.ry + 0.35);
      S.ekle(new T.TorusGeometry(1, 0.4, 8, 18, Math.PI), 0, 0, 0, 6.5, 7.5, 4.6, 0xd2ad7e);
      S.ekle(new T.TorusGeometry(1, 0.2, 6, 18, Math.PI), 0, 0.3, 0.9, 6.9, 7.9, 3.2, 0xe3c294);
      for (const s of [-1, 1]) { S.ekle(cvG.ico, s * 6.6, 0.4, 0, 2.6, 1.6, 2.4, 0xc29a6c, 0, s); S.ekle(cvG.ico, s * 7.6, 0.2, 1.4, 1.4, 0.9, 1.3, 0xd2ad7e, 0, s * 2); }
      S.ekle(cvG.kureK, -1.2, 9.85, 0, 2.6, 0.9, 2.0, 0x3f9a4c); S.ekle(cvG.kureK, 1.5, 9.6, 0.2, 2.0, 0.8, 1.7, 0x52ad55); S.ekle(cvG.kureK, 3.6, 8.3, 0, 1.4, 0.7, 1.3, 0x3f9a4c);
      for (let k = 0; k < 3; k++) S.ekle(cvG.okt, -2 + k * 1.7, 10.4 + (k % 2) * 0.2, 0.6, 0.25, 0.2, 0.25, [0xff7a9a, 0xffe066, 0xff9a4a][k]);
      koyuSu.push([p.x, p.z, 11, 'kopuk']); krYer.kemer = [p.x, p.z, p.i];
    }
  }

  // ───────── ada içinde küçük şelale: yuvarlak kayalık, akan su (doku kayar), önünde turkuaz gölcük ─────────
  { const p = yer(0.45, -1, YARI + 30, 9, YARI + 22);
    if (p) {
      S.yer(p.x, p.z, p.ry);
      const KAYA = [0xc9a77c, 0xb8946a, 0xd8b88c];
      S.ekle(cvG.ico, 0, 3.2, -3.2, 6.2, 6.6, 4.4, KAYA[1], 0, 0.3); S.ekle(cvG.ico, -4.6, 2.2, -2.2, 3.6, 4.4, 3.4, KAYA[0], 0, 1.1); S.ekle(cvG.ico, 4.8, 2.0, -2.4, 3.4, 4.0, 3.2, KAYA[2], 0, 2.0);
      S.ekle(cvG.ico, 0, 7.4, -3.6, 4.6, 2.6, 3.6, KAYA[0], 0, 0.8);
      S.ekle(cvG.tacY, -1, 9.6, -3.8, 4.4, 1.6, 3.4, 0x3f9a4c); S.ekle(cvG.tacY, 3.4, 8.2, -3.2, 2.6, 1.3, 2.4, 0x52ad55); S.ekle(cvG.tacY, -4.8, 6.2, -2.4, 2.4, 1.2, 2.2, 0x3a8c49);
      for (let k = 0; k < 6; k++) { const a = -0.9 + k * 0.36; S.ekle(cvG.ico, Math.sin(a) * 5.4, 0.3, 2.4 + Math.cos(a) * 3.4 - 3.4, 0.8 + (k % 2) * 0.3, 0.6, 0.8, KAYA[k % 3], 0, k); }
      for (let k = 0; k < 3; k++) S.ekle(cvG.okt, -2.2 + k * 2.1, 10.5 + (k % 2) * 0.2, -3.2, 0.3, 0.24, 0.3, [0xff7a9a, 0xffe066, 0xffffff][k]);
      krSelale = tuvalDoku(64, 256, (g, w, h) => { g.fillStyle = '#7fdcf0'; g.fillRect(0, 0, w, h); for (let k = 0; k < 40; k++) { const x = Rk() * w, y = Rk() * h, l = 20 + Rk() * 50; g.fillStyle = k % 3 ? 'rgba(255,255,255,0.75)' : 'rgba(190,240,250,0.9)'; for (const dy of [-h, 0, h]) g.fillRect(x, y + dy, 3 + Rk() * 4, l); } }, true);
      krSelale.repeat.set(1, 1.6);
      const geo = new T.CylinderGeometry(1.5, 1.9, 8.2, 10, 1, true, -1.2, 2.4); geo.translate(0, 4.1, 0);
      const sm = new T.Mesh(geo, new T.MeshBasicMaterial({ map: krSelale, color: 0xeefcff })); const q = S.dunya(0, 0.5);
      sm.position.set(q.x, 0.2, q.z); sm.rotation.y = p.ry; sm.scale.set(1, 1, 0.55); scene.add(sm);
      for (let k = 0; k < 5; k++) S.ekle(cvG.kureK, -1.2 + k * 0.6, 0.35, 1.1 + (k % 2) * 0.3, 0.55, 0.32, 0.45, 0xffffff);   // köpük
      koyuSu.push([q.x, q.z, 6, 'golcuk']); krYer.selale = [p.x, p.z, p.i];
    }
  }

  // ───────── kumda birkaç küçük ayrıntı (seyrek): kayık, fıçı-sandık yığını, deniz yıldızları ─────────
  { const kayik = yer(0.13, 1, YARI + 15, 3);
    if (kayik) { S.yer(kayik.x, kayik.z, kayik.ry + 1.2);
      S.ekle(cvG.kureK, 0, 0.35, 0, 1.15, 0.5, 2.5, 0xe0483c); S.ekle(cvG.sil, 0, 0.62, 0, 0.98, 0.07, 2.2, 0xfff3dc); S.ekle(cvG.sil, 0, 0.66, 0, 0.82, 0.06, 1.95, 0xc58a52);
      for (const z of [-0.8, 0.5]) S.ekle(cvG.kutuY, 0, 0.72, z, 1.7, 0.1, 0.35, 0x9a6438);
      S.ekle(cvG.kutuY, 1.3, 0.12, 0.4, 0.18, 0.08, 2.6, 0xc58a52, 0, 0.3); S.ekle(cvG.kutuY, 1.3, 0.12, 1.75, 0.45, 0.06, 0.6, 0xc58a52, 0, 0.3);   // kürek
      golge.push([kayik.x, kayik.z, 3.2, 2.2, 0.28]); }
    const yigin = yer(0.7, -1, YARI + 12, 3);
    if (yigin) { S.yer(yigin.x, yigin.z, yigin.ry);
      for (const [x, z, y] of [[-0.8, 0, 0.65], [0.6, 0.2, 0.65], [-0.1, 0.1, 1.95]]) { S.ekle(cvG.sil, x, y, z, 0.6, 1.25, 0.6, 0xb57a45); S.ekle(cvG.sil, x, y + 0.36, z, 0.63, 0.12, 0.63, 0xe0483c); S.ekle(cvG.sil, x, y - 0.36, z, 0.63, 0.12, 0.63, 0xe0483c); }
      S.ekle(cvG.kutuY, 1.9, 0.5, -0.6, 1.1, 1.0, 1.1, 0xc58a52, 0, 0.4); S.ekle(cvG.kutuY, 1.9, 0.5, -0.6, 1.14, 0.14, 1.14, 0x9a6438, 0, 0.4);
      golge.push([yigin.x, yigin.z, 2.6, 2, 0.28]); }
    for (let k = 0; k < 6; k++) { const p = yer(0.08 + k * 0.15, k % 2 ? 1 : -1, YARI + 9.5 + (k % 3), 1); if (!p) continue; S.yer(p.x, p.z, p.ry + k);
      for (let j = 0; j < 5; j++) { const a = j / 5 * Math.PI * 2; S.ekle(cvG.kureK, Math.sin(a) * 0.32, 0.05, Math.cos(a) * 0.32, 0.13, 0.07, 0.34, k % 2 ? 0xff8a5a : 0xff6f8a, 0, a); }
      S.ekle(cvG.kureK, 0, 0.08, 0, 0.2, 0.09, 0.2, k % 2 ? 0xff9a6a : 0xff7f98); S.ekle(cvG.yarimK, 0.9, 0.02, 0.5, 0.22, 0.12, 0.27, 0xfff3e6, 0, k); }
  }

  // ───────── kumda alçak tropik çalılar (kırmızı-sarı çiçekli), seyrek ─────────
  for (let k = 0; k < 14; k++) { const p = yer(0.04 + k * 0.069, k % 3 ? 1 : -1, YARI + 11 + (k % 4) * 2.5, 2.2); if (!p) continue; S.yer(p.x, p.z, p.ry + k);
    S.ekle(cvG.tacY, 0, 0.1, 0, 1.6, 0.9, 1.3, 0x3f9a4c); S.ekle(cvG.tacY, 1.1, 0.05, 0.4, 1.0, 0.65, 0.9, 0x52ad55); S.ekle(cvG.tacY, -1.0, 0.0, 0.3, 0.9, 0.55, 0.8, 0x46a04f);
    for (let j = 0; j < 4; j++) { const a = j * 1.7 + k, x = Math.cos(a) * 0.9, z = Math.sin(a) * 0.7; S.ekle(cvG.okt, x, 0.85 - Math.abs(x) * 0.2, z, 0.2, 0.13, 0.2, j % 2 ? 0xff5f6a : 0xffd84a); }
    golge.push([p.x, p.z, 2.2, 1.7, 0.2]); }

  // ───────── palmiyeler: tek geometri, çoklu kopya (tepeler rüzgârda salınır) ─────────
  { const P = cvYapi(), ust = new T.Vector3();
    let x = 0, y = 0;
    for (let k = 0; k < 9; k++) { const a = 0.12 + k * 0.035, dy = 0.78; P.ekle(cvG.sil, x + Math.sin(a) * dy / 2, y + dy / 2, 0, 0.27 - k * 0.012, dy * 1.06, 0.27 - k * 0.012, k % 2 ? 0xb88a5a : 0xa77a4c, 0, 0, -a); x += Math.sin(a) * dy; y += Math.cos(a) * dy; }
    ust.set(x, y, 0);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), u = 1.55; P.ekle(cvG.kureK, ust.x + c * u, ust.y - 0.3, s * u, 1.9, 0.14, 0.5, k % 2 ? 0x2f8f45 : 0x46a84f, 0, -a, -0.38, 1); P.ekle(cvG.kureK, ust.x + c * u * 1.9, ust.y - 0.95, s * u * 1.9, 0.9, 0.1, 0.38, k % 2 ? 0x2f8f45 : 0x3d9e4c, 0, -a, -0.75, 1); }
    for (let k = 0; k < 3; k++) { const a = k * 2.1; P.ekle(cvG.kureK, ust.x + Math.cos(a) * 0.32, ust.y - 0.25, Math.sin(a) * 0.32, 0.26, 0.26, 0.26, 0x7a5230); }
    P.ekle(cvG.kureK, ust.x, ust.y, 0, 0.45, 0.3, 0.45, 0x3d9e4c);
    const liste = [];
    const ekle = (f, dis, uz, s) => { const p = yer(f, dis, uz, 2.2); if (p) { liste.push([p.x, 0, p.z, s, s, s, Rk() * 6.28]); golge.push([p.x + 1.2 * s, p.z, 2.4 * s, 1.8 * s, 0.22]); } };
    [[0.1, 1, 10], [0.15, -1, 13], [0.21, 1, 11], [0.33, -1, 12], [0.4, 1, 11], [0.47, -1, 10], [0.55, 1, 12], [0.63, -1, 14], [0.66, -1, 18], [0.71, 1, 11], [0.77, -1, 12], [0.9, -1, 11]].forEach((q, k) => ekle(q[0], q[1], YARI + q[2], 0.95 + (k % 3) * 0.15));
    // ada içinde, ormanın önünde birkaç palmiye kümesi
    for (let k = 0; k < 10; k++) { const i = cvI(0.05 + k * 0.1), p = cvKenar(i, -krDis(i), YARI + 24 + (k % 3) * 4); if (krIc(p.x, p.z) && yakin(p.x, p.z) > YARI + 18 && cvBos(p.x, p.z, 2)) { cvYasak.push([p.x, p.z, 2]); liste.push([p.x, 0, p.z, 1.1, 1.1 + (k % 2) * 0.2, 1.1, k]); } }
    cok(cvTon(P.geo()), cvMalz(1), liste);
  }

  // ───────── koyu yeşil orman tepeleri (ada içi) + ufukta küçük adalar ─────────
  { const D = cvYapi(), dag = cvDagY();
    D.ekle(dag, 0, 0.5, 0, 1, 1, 1, 0x3c8a48);
    for (let k = 0; k < 14; k++) { const a = k * 2.399, r = 0.22 + (k % 4) * 0.17, y = Math.max(0.05, (1 - r / 0.95)) * 0.85; D.ekle(cvG.tacY, Math.cos(a) * r, y, Math.sin(a) * r, 0.2, 0.15, 0.2, [0x2f7d45, 0x4a9e4f, 0x3a8c49, 0x5cae55][k % 4], 0, a, 0, 1); }
    const g = cvTon(D.geo()), c = g.attributes.color, p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const f = 0.78 + 0.3 * clamp(p.getY(i), 0, 1); c.setXYZ(i, c.getX(i) * f, Math.min(1, c.getY(i) * f), c.getZ(i) * f); }
    const liste = [];
    let mx = 0, mz = 0; for (let i = 0; i < N; i++) { mx += PX[i] / N; mz += PZ[i] / N; }
    for (let k = 0; k < 160 && liste.length < 11; k++) { const x = mx + (Rk() - 0.5) * 240, z = mz + (Rk() - 0.5) * 150, s = 15 + Rk() * 15; if (!krIc(x, z) || yakin(x, z) < s * 0.85 + YARI + 16 || !cvBos(x, z, s * 0.7)) continue; cvYasak.push([x, z, s * 0.7]); liste.push([x, 0, z, s, s * (0.75 + Rk() * 0.35), s, Rk() * 6]); golge.push([x, z, 0, 0, 0, 'orman', s * 1.15]); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2 + 0.2, r = 330 + (k % 3) * 70, x = mx + Math.cos(a) * r, z = mz + Math.sin(a) * r * 0.85, s = 22 + (k % 4) * 9; if (yakin(x, z) < 160) continue; liste.push([x, -1, z, s * 1.4, s * 0.6, s, k]); }
    cok(g, cvMalz(0), liste);
  }

  // ───────── papağanlar: adanın üstünde geniş daire çizerek uçar (kanat çırpar) ─────────
  { const B = cvYapi();
    B.ekle(cvG.kure, 0, 0, 0, 0.42, 0.4, 0.95, 0xffffff, 0, 0, 0, 1); B.ekle(cvG.kure, 0, 0.25, 0.8, 0.36, 0.36, 0.36, 0xffffff, 0, 0, 0, 1);
    B.ekle(cvG.koni, 0, 0.18, 1.18, 0.14, 0.3, 0.14, 0xffe066, Math.PI / 2 + 0.5); for (const s of [-1, 1]) { B.ekle(cvG.kureK, s * 0.26, 0.35, 0.92, 0.1, 0.12, 0.08, 0xffffff); B.ekle(cvG.ufak, s * 0.3, 0.36, 0.96, 0.05, 0.06, 0.04, 0x222222); }
    for (const s of [-1, 1]) { B.ekle(cvG.kureK, s * 0.95, 0.05, 0.05, 0.95, 0.07, 0.48, 0xffd23f, 0, 0, 0); B.ekle(cvG.kureK, s * 1.55, 0.04, -0.05, 0.5, 0.05, 0.36, 0x3fa0f0); }
    B.ekle(cvG.kureK, 0, -0.05, -1.25, 0.18, 0.06, 0.75, 0x3fa0f0); B.ekle(cvG.kureK, 0, -0.03, -1.0, 0.26, 0.07, 0.5, 0xffd23f);
    let mx = 0, mz = 0; for (let i = 0; i < N; i++) { mx += PX[i] / N; mz += PZ[i] / N; }
    krPapagan = cok(B.geo(), cvMalz(3), [[58, 15, 0, 2.3, 2.3, 2.3, 0, 0xf0503c], [-44, 13, 26, 2.1, 2.1, 2.1, Math.PI, 0x4cc35a]]);
    krPapagan.position.set(mx, 0, mz);
  }

  // ───────── bulutlar ─────────
  { const l = []; for (let k = 0; k < 11; k++) { const a = k / 11 * Math.PI * 2, r = 150 + (k % 3) * 60, s = 0.7 + (k % 4) * 0.12; l.push([Math.cos(a) * r, 80 + (k % 4) * 10, -70 + Math.sin(a) * r, s, s * 0.8, s, k]); }
    krBulut = cok(cvBulutGeo(), new T.MeshBasicMaterial({ vertexColors: true }), l); }

  // ───────── lagün pırıltıları (yanıp söner) + hazine pırıltıları ─────────
  { let mx = 0, mz = 0; for (let i = 0; i < N; i++) { mx += PX[i] / N; mz += PZ[i] / N; }
    for (let k = 0, n = 0; k < 400 && n < 90; k++) { const a = Rk() * 6.283, r = 60 + Rk() * 200, x = mx + Math.cos(a) * r * 1.3, z = mz + Math.sin(a) * r; const d = yakin(x, z); if (krIc(x, z) || d < KUM + 4 || d > 150) continue; n++; parilti.push([x, 0.06, z, 0.9 + Rk() * 0.8, 0.02, 0.12, Rk() * 3]); }
    const m = cvMalz(6, { emissive: 0xfff6d0, emissiveIntensity: 0.9 }); cok(cvG.okt, m, parilti); }

  { const m = new T.Mesh(S.geo(), cvMalz(5)); m.frustumCulled = false; scene.add(m); }

  // ───────── zemin: lagün + ada tek dokuda (1024 tuval, ~0,55 m/piksel) ─────────
  { let mx = 0, mz = 0; for (let i = 0; i < N; i++) { mx += PX[i] / N; mz += PZ[i] / N; }
    const W = 560, X0 = mx - W / 2, Z0 = mz - W / 2, Q = 1024 / W, px = x => (x - X0) * Q, pz = z => (z - Z0) * Q;
    const yol = g => { g.beginPath(); for (let i = 0; i <= N; i += 2) { const k = i % N; i ? g.lineTo(px(PX[k]), pz(PZ[k])) : g.moveTo(px(PX[k]), pz(PZ[k])); } g.closePath(); };
    const doku = tuvalDoku(1024, 1024, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.72); gr.addColorStop(0, '#22b9c8'); gr.addColorStop(1, '#1a9fc4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.lineJoin = 'round'; g.lineCap = 'round';
      const halka = (r, renk, a) => { g.globalAlpha = a; g.strokeStyle = renk; g.lineWidth = 2 * r * Q; yol(g); g.stroke(); g.fillStyle = renk; g.fill(); };
      for (let k = 0; k < 10; k++) halka(SIG - k * 2.2, k < 5 ? '#43cfcf' : '#6be0d6', 0.22 + k * 0.03);   // sığ su: kıyıya doğru açılan turkuaz
      g.globalAlpha = 1;
      for (const q of koyuSu) { if (q[3] === 'golcuk') continue; const x = px(q[0]), z = pz(q[1]), r = q[2] * Q;   // gemi ve kemer çevresinde sığ su + köpük halkası
        const rg = g.createRadialGradient(x, z, 0, x, z, r * 1.6); rg.addColorStop(0, 'rgba(120,232,222,0.75)'); rg.addColorStop(0.6, 'rgba(90,214,214,0.35)'); rg.addColorStop(1, 'rgba(90,214,214,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, z, r * 1.6, 0, 7); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, z, r * 0.62, r * 0.48, 0.5, 0, 7); g.stroke(); }
      halka(KUM + 2.2, '#e9fbf6', 0.85);   // köpük çizgisi
      halka(KUM + 0.9, '#d9c08a', 1);       // ıslak kum
      halka(KUM, '#f3d48f', 1);             // altın kum
      { // ada içi: yoldan uzaklaştıkça kum yumuşakça tropik çimene döner
        g.save(); yol(g); g.clip(); g.globalAlpha = 1; g.fillStyle = '#7cbf5a'; g.fillRect(0, 0, w, h);
        for (let k = 0; k < 120; k++) { const x = Rk() * w, z = Rk() * h; g.globalAlpha = 0.25; g.fillStyle = k % 2 ? '#62a84c' : '#93cf68'; g.beginPath(); g.arc(x, z, 8 + Rk() * 22, 0, 7); g.fill(); }
        for (let k = 0; k < 9; k++) { g.globalAlpha = k ? 0.32 : 1; g.strokeStyle = k < 4 ? '#f3d48f' : '#e6d08a'; g.lineWidth = 2 * (YARI + 13 + k * 1.6) * Q; yol(g); g.stroke(); }
        g.restore();
      }
      for (let k = 0; k < 2600; k++) { const x = Rk() * w, z = Rk() * h, wx = X0 + x / Q, wz = Z0 + z / Q, d = yakin(wx, wz); if (d > (krIc(wx, wz) ? YARI + 16 : KUM - 1)) continue; g.globalAlpha = 0.4; g.fillStyle = k % 3 ? '#e6c27a' : '#fff0c2'; g.fillRect(x, z, 1 + Rk() * 1.5, 1 + Rk() * 1.5); }
      // ada içi: orman tepelerinin altında koyu yeşil, kenarı yumuşak
      for (const q of golge) if (q[5] === 'orman') { const x = px(q[0]), z = pz(q[1]), r = q[6] * Q; const rg = g.createRadialGradient(x, z, r * 0.3, x, z, r * 1.25); rg.addColorStop(0, 'rgba(62,140,72,1)'); rg.addColorStop(0.75, 'rgba(98,170,86,0.85)'); rg.addColorStop(1, 'rgba(150,190,100,0)'); g.globalAlpha = 1; g.fillStyle = rg; g.beginPath(); g.arc(x, z, r * 1.25, 0, 7); g.fill(); }
      for (const q of golge) { if (q[5]) continue; const x = px(q[0]), z = pz(q[1]); g.globalAlpha = q[4]; const rg = g.createRadialGradient(x, z, 0, x, z, q[2] * Q); rg.addColorStop(0, 'rgba(120,86,40,1)'); rg.addColorStop(1, 'rgba(120,86,40,0)'); g.fillStyle = rg; g.save(); g.translate(x, z); g.scale(1, q[3] / q[2]); g.translate(-x, -z); g.beginPath(); g.arc(x, z, q[2] * Q, 0, 7); g.fill(); g.restore(); }
      for (const q of golge) if (q[5] === 'x') { const x = px(q[0]) + 6, z = pz(q[1]) + 5; g.globalAlpha = 0.9; g.strokeStyle = '#d8473a'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x - 3, z - 3); g.lineTo(x + 3, z + 3); g.moveTo(x + 3, z - 3); g.lineTo(x - 3, z + 3); g.stroke(); }
      for (const q of koyuSu) if (q[3] === 'golcuk') { const x = px(q[0]), z = pz(q[1]), r = q[2] * Q; g.globalAlpha = 1;
        g.fillStyle = '#e6d08a'; g.beginPath(); g.ellipse(x, z, r * 1.25, r * 1.0, 0, 0, 7); g.fill(); g.fillStyle = '#5fd6e0'; g.beginPath(); g.ellipse(x, z, r, r * 0.78, 0, 0, 7); g.fill();
        g.fillStyle = '#9ff0f0'; g.beginPath(); g.ellipse(x - r * 0.2, z - r * 0.1, r * 0.5, r * 0.35, 0, 0, 7); g.fill(); }
      // lagünde hafif dalga çizgileri
      g.globalAlpha = 0.28; g.strokeStyle = '#c8f6f2'; g.lineWidth = 1.6;
      for (let k = 0; k < 260; k++) { const x = Rk() * w, z = Rk() * h, wx = X0 + x / Q, wz = Z0 + z / Q; if (krIc(wx, wz) || yakin(wx, wz) < KUM + 5) continue; g.beginPath(); g.moveTo(x, z); g.quadraticCurveTo(x + 5, z - 2.5, x + 10, z); g.stroke(); }
      g.globalAlpha = 1;
    });
    doku.anisotropy = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
    doku.repeat.set(1500 / W, 1500 / W); doku.offset.set((-750 - X0) / W, 1 - (680 - Z0) / W);
    doku.wrapS = doku.wrapT = T.ClampToEdgeWrapping;
    zemin.material.map = doku; zemin.material.needsUpdate = true;
    { const p = zemin.geometry.attributes.color; for (let i = 0; i < p.count; i++) { const v = 0.96 + 0.04 * Math.sin(i * 0.37); p.setXYZ(i, v, v, v); } p.needsUpdate = true; }
  }
}
