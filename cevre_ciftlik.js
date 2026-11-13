/* Neşeli Çiftlik pistinin çevresi (yalnız ?pist=ciftlik iken yüklenir, cevre.js'ten sonra).
   Yol, güneşli yeşil çayırların, altın buğday tarlalarının ve sürülmüş toprakların arasından geçer.
   Zemin tek tuval dokusu (1024): çayır yeşilleri, yonca benekleri, altın buğday tarlaları, toprak karıkları, çamur birikintisi, gölet ve temas gölgeleri.
   Manzara anları: başlangıçta beyaz çerçeveli kırmızı ahır + gümüş kubbeli silo · dönen 4 kanatlı yel değirmeni
   · kırmızı traktör ve saman arabası · gölette yüzen sarı ördekler · benekli inekler, pofuduk koyunlar, pembe domuzcuklar, beyaz tavuklar
   · rüzgârda salınan altın buğday tarlaları, elma bahçesi ve kasalar, ahşap çitler, neşeli korkuluk ve ayçiçeği sıraları.
   Yeni üst düzey adlar `cf` ile başlar. Kare başına yeni nesne yok; ışık eklenmez. */
'use strict';

const cfYer = {};   // odak yerleri (deneme ve kart resmi için)
let cfPervane = null, cfBulut = null;
const cfOrdekler = [];   // [mesh, merkezX, merkezZ, yarıçap, açıBaşlangıç, hız, faz]

function cevreEkGuncelle(dt, t) {
  if (cfPervane) cfPervane.rotation.z = -t * 0.75;
  if (cfBulut) cfBulut.rotation.y = t * 0.004;
  for (let i = 0; i < cfOrdekler.length; i++) {
    const q = cfOrdekler[i], m = q[0], a = q[4] + t * q[5];
    const ca = Math.cos(a), sa = Math.sin(a);
    m.position.x = q[1] + ca * q[3];
    m.position.z = q[2] + sa * q[3] * 0.76;
    m.position.y = 0.09 + Math.sin(t * 2.6 + q[6]) * 0.055;
    m.rotation.y = Math.atan2(-sa, ca * 0.76);
    m.rotation.z = Math.sin(t * 3.2 + q[6]) * 0.055;
    m.rotation.x = Math.cos(t * 2.6 + q[6]) * 0.035;
  }
}

if (cvTema === 'ciftlik') {
  scene.fog.color.setHex(0xdef4ff); scene.fog.near = 260; scene.fog.far = 820;
  gunes.color.setHex(0xfff3d1);
  { // gök: sıcak yaz mavisi, ufukta altın güneş ışığı ve yumuşak krem-altın pus
    const eski = scene.background;
    scene.background = tuvalDoku(256, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#248ce3'); gr.addColorStop(0.18, '#54b2f4'); gr.addColorStop(0.34, '#9bd9fa');
      gr.addColorStop(0.43, '#e4f5ff'); gr.addColorStop(0.49, '#fff3d2'); gr.addColorStop(1, '#fff3d2');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);

      // Ufukta yumuşak altın yaz güneşi halesi ve hafif bulut şeritleri
      const rg = g.createRadialGradient(w * 0.72, h * 0.43, 0, w * 0.72, h * 0.43, w * 0.85);
      rg.addColorStop(0, 'rgba(255,248,214,0.34)');
      rg.addColorStop(0.45, 'rgba(255,242,196,0.12)');
      rg.addColorStop(1, 'rgba(255,242,196,0)');
      g.fillStyle = rg; g.fillRect(0, 0, w, h * 0.55);

      g.fillStyle = 'rgba(255,254,245,0.08)';
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.ellipse(w * (0.2 + k * 0.22), h * (0.14 + (k % 2) * 0.09), w * 0.26, h * 0.022, -0.06, 0, 7);
        g.fill();
      }
    });
    if (eski && eski.dispose) eski.dispose();
  }
  cvGokIsik.color.setHex(0xffffff); cvGokIsik.groundColor.setHex(0xc8c090);

  // Sıcak gün ışığı kenar vurgusu + hafif ahşap/boya parıltısı (ek ışık ve çizim yok)
  const cfCilaMalz = (mod, par, kenar, o) => {
    const m = cvMalz(mod, o);
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      if (prev) prev.call(m, sh, r);
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n{ vec3 cfV = normalize(vViewPosition); float cfN = clamp(dot(normal, cfV), 0.0, 1.0); float cfRim = pow(1.0 - cfN, 2.2); vec3 cfH = normalize(normalize(vec3(-0.35, 0.82, 0.45)) + cfV); float cfSp = pow(clamp(dot(normal, cfH), 0.0, 1.0), 24.0); totalEmissiveRadiance += vec3(1.0, 0.94, 0.78) * (cfSp * ' + par.toFixed(3) + ') + mix(diffuseColor.rgb, vec3(1.0, 0.88, 0.66), 0.46) * cfRim * ' + kenar.toFixed(3) + '; }'
      );
    };
    m.customProgramCacheKey = () => 'cfC' + mod + '_' + par + '_' + kenar;
    return m;
  };

  // Yapılarda alt-üst ve güneş yönü köşe ton geçişi
  const cfTonKontrast = (g, hRef) => {
    const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) {
      const u = clamp(p.getY(i) / hRef, 0, 1);
      const ny = n.getY(i);
      const up = clamp(ny * 0.5 + 0.5, 0, 1);
      const sun = clamp((-n.getX(i) * 0.35 + ny * 0.78 + n.getZ(i) * 0.45) * 0.5 + 0.5, 0, 1);
      const k = 0.84 + 0.12 * u + 0.07 * up;
      c.setXYZ(
        i,
        Math.min(1, c.getX(i) * k * lerp(0.93, 1.06, sun)),
        Math.min(1, c.getY(i) * k * lerp(0.95, 1.02, sun)),
        Math.min(1, c.getZ(i) * k * lerp(0.98, 0.92, sun))
      );
    }
    return g;
  };

  let cfT = 48271;
  const Rc = () => { cfT = (cfT * 1664525 + 1013904223) >>> 0; return cfT / 4294967296; };
  const cfIc = (x, z) => {
    let ic = false;
    for (let i = 0, j = N - 4; i < N; j = i, i += 4) {
      const xi = PX[i], zi = PZ[i], xj = PX[j], zj = PZ[j];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ic = !ic;
    }
    return ic;
  };
  const cfDis = i => { const p = cvKenar(i, 1, 40); return cfIc(p.x, p.z) ? -1 : 1; };

  // buğday başakları için özel rüzgâr salınım gölgelendiricisi
  const cfBugdayHar = cvHAREKET.length;
  cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.22 + instanceMatrix[3].z * 0.18;\nfloat cvW = transformed.y * transformed.y * 0.085;\ntransformed.x += sin(cvT * 2.1 + cvF) * cvW;\ntransformed.z += cos(cvT * 1.6 + cvF * 1.2) * cvW * 0.6;\ntransformed.y -= abs(sin(cvT * 2.1 + cvF)) * cvW * 0.08;\n#endif');

  const S = cvYapi(), golge = [], tarlalar = [];
  let cfGol = null, cfCamur = null;

  // yol kenarında güvenli boş yer bul (en az YARI + 9 m uzaklıkta)
  const yer = (f, dis, uz, r, bos) => {
    const minBos = Math.max(bos || YARI + r + 2, YARI + 9);
    for (let k = 0; k < 14; k++) {
      const i = cvI(f + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.006);
      const yan = cfDis(i) * dis, p = cvKenar(i, yan, Math.max(uz, YARI + 9), 0.2), d = yakin(p.x, p.z);
      if (d > minBos && cvBos(p.x, p.z, r)) {
        cvYasak.push([p.x, p.z, r]);
        return { x: p.x, z: p.z, ry: p.ry, i, yan };
      }
    }
    return null;
  };

  const KIRMIZI = 0xdc372c, KIRMIZI_K = 0x992018, KREM = 0xfff5de, AHSAP = 0x6b3d1e, AHSAP2 = 0xdc9442, ALTIN = 0xf2c444, PEMBE = 0xff9eb5;

  // ───────── 1) açılış manzarası: klasik kırmızı ahır + gümüş kubbeli silo (f ~ 0.11, daha büyük ve yakın) ─────────
  {
    const p = yer(0.11, 1, YARI + 18, 12, YARI + 14);
    if (p) {
      const sc = 1.22;
      S.yer(p.x, p.z, p.ry, sc);
      // ana gövde ve taş temel
      S.ekle(cvG.kutuY, 0, 3.0, 0, 9.6, 6.0, 12.0, KIRMIZI);
      S.ekle(cvG.kutuY, 0, 0.35, 0, 9.9, 0.7, 12.3, 0xa8a298);
      // beyaz köşe çıtaları ve çatı altı şeridi
      for (const sx of [-4.72, 4.72]) for (const sz of [-5.92, 5.92]) S.ekle(cvG.kutuY, sx, 3.0, sz, 0.34, 6.0, 0.34, KREM);
      S.ekle(cvG.kutuY, 0, 5.95, 0, 9.85, 0.3, 12.25, KREM);
      // beşik çatı + mahya + çatı kubbeciği (cupola)
      S.ekle(cvG.catiY, 0, 6.0, 0, 1.95, 2.2, 2.75, 0x592d26);
      S.ekle(cvG.kutuY, 0, 9.55, 0, 0.46, 0.35, 13.1, KREM);
      S.ekle(cvG.kutuY, 0, 10.1, 0, 1.6, 1.3, 1.6, AHSAP2);
      S.ekle(cvG.catiY, 0, 10.7, 0, 0.36, 0.55, 0.38, KIRMIZI);
      S.ekle(cvG.sil, 0, 11.7, 0, 0.05, 0.8, 0.05, ALTIN);
      S.ekle(cvG.kureK, 0, 12.1, 0, 0.16, 0.16, 0.16, ALTIN);
      // ön büyük X'li ahır kapısı
      S.ekle(cvG.kutuY, 0, 2.1, 6.06, 3.9, 3.9, 0.22, KREM);
      S.ekle(cvG.kutuY, 0, 2.1, 6.12, 3.35, 3.35, 0.14, KIRMIZI_K);
      S.ekle(cvG.kutuY, 0, 2.1, 6.18, 0.24, 3.4, 0.14, KREM);
      for (const s of [-1, 1]) {
        S.ekle(cvG.kutuY, s * 0.82, 2.1, 6.2, 0.18, 3.8, 0.12, KREM, 0, 0, s * 0.46);
        S.ekle(cvG.kutuY, s * 0.82, 2.1, 6.2, 0.18, 3.8, 0.12, KREM, 0, 0, -s * 0.46);
      }
      // açık samanlık tavan penceresi + içinden taşan saman + makara kirişi
      S.ekle(cvG.kutuY, 0, 7.1, 5.4, 2.0, 1.9, 0.3, AHSAP2);
      S.ekle(cvG.kutuY, 0, 7.1, 5.45, 1.55, 1.45, 0.25, 0x3b2114);
      S.ekle(cvG.kureK, 0, 6.65, 5.75, 0.78, 0.48, 0.55, ALTIN);
      S.ekle(cvG.kutuY, 0, 8.75, 6.45, 0.24, 0.24, 1.5, AHSAP);
      for (const s of [-1, 1]) S.ekle(cvG.kutuY, s * 1.15, 7.1, 5.58, 0.55, 1.5, 0.12, AHSAP, 0, s * 0.4);
      // yan pencereler ve çiçeklik kutuları
      for (const s of [-1, 1]) for (const z of [-3.0, 0.2, 3.2]) {
        S.ekle(cvG.kutuY, s * 4.84, 3.4, z, 0.14, 1.35, 1.25, KREM);
        S.ekle(cvG.kutuY, s * 4.88, 3.4, z, 0.1, 1.0, 0.9, 0xffe694);
        S.ekle(cvG.kutuY, s * 4.98, 2.55, z, 0.34, 0.3, 1.32, AHSAP2);
        S.ekle(cvG.kureK, s * 5.0, 2.8, z - 0.32, 0.2, 0.18, 0.22, 0xffd22e);
        S.ekle(cvG.kureK, s * 5.0, 2.82, z + 0.28, 0.2, 0.18, 0.22, 0xff6b8b);
      }
      // gümüş kubbeli çiftlik silosu (ahırın yanında)
      S.ekle(cvG.sil, 7.4, 6.4, -1.6, 2.6, 12.8, 2.6, 0xd8dfe6);
      for (const y of [2.5, 5.2, 7.9, 10.6, 12.6]) S.ekle(cvG.sil, 7.4, y, -1.6, 2.68, 0.22, 2.68, 0x9aa6b2);
      S.ekle(cvG.yarim, 7.4, 12.8, -1.6, 2.62, 2.5, 2.62, 0xc8d2dc);
      S.ekle(cvG.sil, 7.4, 15.35, -1.6, 0.4, 0.55, 0.4, 0x9aa6b2);
      // silo merdiveni
      for (const x of [7.1, 7.7]) S.ekle(cvG.kutuY, x, 6.5, 1.06, 0.1, 12.0, 0.1, 0x7c8794);
      for (let y = 1.2; y < 12.2; y += 0.9) S.ekle(cvG.kutuY, 7.4, y, 1.06, 0.65, 0.08, 0.08, 0x7c8794);

      golge.push([p.x, p.z, 13.5, 10.5, 0.30]);
      const sq = S.dunya(7.4, -1.6);
      golge.push([sq.x, sq.z, 5.0, 5.0, 0.30]);
      cfYer.ahir = [p.x, p.z, p.i];
    }
  }

  // ───────── 2) açılış manzarası: kır yel değirmeni (f ~ 0.17, karşı yanda, daha büyük) ─────────
  {
    const p = yer(0.17, -1, YARI + 18, 10, YARI + 14);
    if (p) {
      const sc = 1.22;
      S.yer(p.x, p.z, p.ry, sc);
      S.ekle(cvG.govde, 0, 2.2, 0, 3.6, 4.4, 3.6, 0xb8a898);    // taş alt kat
      S.ekle(cvG.govde, 0, 7.2, 0, 2.7, 5.8, 2.7, 0xf7f0e2);    // beyaz sıva üst kat
      S.ekle(cvG.sil, 0, 4.4, 0, 3.15, 0.34, 3.15, AHSAP2);     // ahşap kuşak
      S.ekle(cvG.koni, 0, 11.8, 0, 2.9, 3.6, 2.9, KIRMIZI);     // kırmızı konik çatı
      S.ekle(cvG.kureK, 0, 13.65, 0, 0.38, 0.38, 0.38, ALTIN);
      // kapı, taş basamak ve küçük pencere
      S.ekle(cvG.kutuY, 0, 1.25, 3.35, 1.4, 2.4, 0.35, AHSAP);
      S.ekle(cvG.kutuY, 0, 0.15, 3.65, 1.8, 0.3, 0.7, 0x9e9589);
      S.ekle(cvG.kutuY, 0, 6.2, 2.35, 0.95, 1.2, 0.28, AHSAP);
      S.ekle(cvG.kutuY, 0, 6.2, 2.42, 0.65, 0.85, 0.2, 0xffe694);
      // pervane göbeği
      S.ekle(cvG.sil, 0, 9.6, 2.1, 0.5, 1.1, 0.5, AHSAP, Math.PI / 2);

      // 4 kanatlı dönen pervane (tek birleştirilmiş geometri)
      const P = cvYapi();
      P.ekle(cvG.sil, 0, 0, 0.25, 0.55, 0.45, 0.55, KIRMIZI, Math.PI / 2);
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
        P.ekle(cvG.kutuY, ca * 3.1, sa * 3.1, 0, 6.2, 0.24, 0.2, AHSAP, 0, 0, a);
        P.ekle(cvG.kutuY, ca * 3.55 - sa * 0.55, sa * 3.55 + ca * 0.55, -0.05, 4.4, 1.1, 0.06, 0xfff5de, 0, 0, a);
        for (let r = 1.6; r <= 5.4; r += 0.95) {
          P.ekle(cvG.kutuY, ca * r - sa * 0.55, sa * r + ca * 0.55, 0.02, 0.08, 1.15, 0.08, AHSAP2, 0, 0, a);
        }
      }
      cfPervane = new T.Mesh(cfTonKontrast(P.geo(), 6.5), cfCilaMalz(0, 0.10, 0.25));
      const hub = S.dunya(0, 2.65);
      cfPervane.position.set(hub.x, 9.6 * sc, hub.z);
      cfPervane.scale.setScalar(sc);
      cfPervane.rotation.y = p.ry;
      scene.add(cfPervane);

      golge.push([p.x, p.z, 6.2, 6.2, 0.28]);
      cfYer.degirmen = [p.x, p.z, p.i];
    }
  }

  // ───────── 3) kırmızı çiftlik traktörü ve saman dolu ahşap römork (f ~ 0.24) ─────────
  {
    const p = yer(0.24, 1, YARI + 15, 6.5, YARI + 12.5);
    if (p) {
      S.yer(p.x, p.z, p.ry + 0.55, 1.15);
      // traktör gövdesi
      S.ekle(cvG.kutuY, 0, 1.05, 1.5, 1.5, 0.95, 2.2, KIRMIZI);     // motor kaputu
      S.ekle(cvG.kutuY, 0, 1.05, 2.62, 1.35, 0.8, 0.14, 0xf2c94c);   // ön ızgara
      for (const s of [-1, 1]) S.ekle(cvG.kureK, s * 0.45, 1.18, 2.68, 0.15, 0.15, 0.1, 0xfff3b0); // farlar
      S.ekle(cvG.sil, 0.42, 1.85, 2.15, 0.09, 0.75, 0.09, 0x4b525c); // egzoz bacası
      S.ekle(cvG.kutuY, 0, 1.75, -0.1, 1.65, 1.4, 1.4, KIRMIZI);     // kabin tabanı/yanlar
      S.ekle(cvG.kutuY, 0, 2.75, -0.1, 1.75, 0.18, 1.55, KREM);       // beyaz kabin tavanı
      for (const sx of [-0.72, 0.72]) for (const sz of [-0.72, 0.52]) S.ekle(cvG.sil, sx, 2.25, sz, 0.07, 1.0, 0.07, KREM);
      // tekerlekler (arka büyük, ön küçük)
      for (const s of [-1, 1]) {
        S.ekle(cvG.sil, s * 0.98, 0.82, -0.15, 0.82, 0.45, 0.82, 0x2c3038, 0, 0, Math.PI / 2);
        S.ekle(cvG.sil, s * 1.02, 0.82, -0.15, 0.42, 0.48, 0.42, ALTIN, 0, 0, Math.PI / 2);
        S.ekle(cvG.sil, s * 0.88, 0.48, 2.05, 0.48, 0.34, 0.48, 0x2c3038, 0, 0, Math.PI / 2);
        S.ekle(cvG.sil, s * 0.91, 0.48, 2.05, 0.24, 0.37, 0.24, ALTIN, 0, 0, Math.PI / 2);
      }
      // bağlantı çubuğu + ahşap saman römorku (arkada)
      S.ekle(cvG.kutuY, 0, 0.55, -1.65, 0.18, 0.12, 1.4, 0x4b525c);
      S.ekle(cvG.kutuY, 0, 0.88, -3.7, 2.2, 0.22, 3.2, AHSAP);
      for (const s of [-1, 1]) {
        S.ekle(cvG.kutuY, s * 1.05, 1.32, -3.7, 0.14, 0.72, 3.2, AHSAP2);
        for (const z of [-4.6, -2.7]) {
          S.ekle(cvG.sil, s * 1.15, 0.46, z, 0.46, 0.26, 0.46, 0x3b2c22, 0, 0, Math.PI / 2);
          S.ekle(cvG.sil, s * 1.18, 0.46, z, 0.22, 0.29, 0.22, AHSAP2, 0, 0, Math.PI / 2);
        }
      }
      S.ekle(cvG.kutuY, 0, 1.32, -5.24, 2.2, 0.72, 0.14, AHSAP2);
      S.ekle(cvG.kutuY, 0, 1.32, -2.16, 2.2, 0.72, 0.14, AHSAP2);
      // römorkta altın saman yığını ve balkabakları
      S.ekle(cvG.kureK, 0, 1.55, -3.8, 1.05, 0.75, 1.45, ALTIN);
      S.ekle(cvG.kureK, 0.4, 1.75, -2.8, 0.35, 0.28, 0.35, 0xf27d24);
      S.ekle(cvG.kureK, -0.45, 1.72, -3.1, 0.32, 0.26, 0.32, 0xe8681c);

      golge.push([p.x, p.z, 5.4, 3.6, 0.28]);
      cfYer.traktor = [p.x, p.z, p.i];
    }
  }

  // ───────── 4) çiftlik göleti ve yüzen sarı ördekler ─────────
  {
    const p = yer(0.66, 1, YARI + 20, 11, YARI + 15);
    if (p) {
      cfGol = [p.x, p.z, 8.2];
      S.yer(p.x, p.z, 0);
      // gölet kıyısında yuvarlak taşlar ve sazlıklar
      for (let k = 0; k < 10; k++) {
        const a = k * 0.63 + 0.2, rx = Math.cos(a) * 8.4, rz = Math.sin(a) * 6.4;
        S.ekle(cvG.ico, rx, 0.2, rz, 0.7 + (k % 3) * 0.25, 0.42, 0.65, k % 2 ? 0xa6a096 : 0xbcb5aa, 0, k);
        if (k % 2 === 0) {
          for (let j = 0; j < 3; j++) {
            const ox = rx + (j - 1) * 0.32, oz = rz + (j % 2) * 0.25;
            S.ekle(cvG.sil, ox, 0.7, oz, 0.06, 1.4, 0.06, 0x4f9c42);
            S.ekle(cvG.sil, ox, 1.32, oz, 0.12, 0.35, 0.12, 0x6e4427);
          }
        }
      }
      // küçük ahşap iskele
      S.ekle(cvG.kutuY, 0, 0.25, 7.2, 2.2, 0.18, 3.0, AHSAP2);
      for (const sx of [-0.9, 0.9]) for (const sz of [6.0, 8.2]) S.ekle(cvG.sil, sx, 0.2, sz, 0.16, 0.9, 0.16, AHSAP);

      // sarı ördek geometrisi (daha belirgin ve okunaklı, 6 ördek)
      const O = cvYapi();
      O.ekle(cvG.kureK, 0, 0.22, 0, 0.34, 0.28, 0.45, 0xffd83b);          // gövde
      O.ekle(cvG.kureK, 0, 0.48, 0.28, 0.22, 0.22, 0.22, 0xffd83b);       // baş
      O.ekle(cvG.koni, 0, 0.46, 0.52, 0.11, 0.22, 0.08, 0xff7a22, Math.PI / 2);   // turuncu gaga
      for (const s of [-1, 1]) {
        O.ekle(cvG.ufak, s * 0.14, 0.53, 0.42, 0.045, 0.045, 0.045, 0x222222);    // göz
        O.ekle(cvG.kureK, s * 0.3, 0.24, -0.04, 0.08, 0.16, 0.28, 0xf2c22e);      // kanat
      }
      O.ekle(cvG.koni, 0, 0.32, -0.45, 0.12, 0.24, 0.12, 0xffd83b, -0.9);         // kuyruk
      const og = cfTonKontrast(O.geo(), 0.75), om = cfCilaMalz(0, 0.08, 0.22);
      for (let k = 0; k < 6; k++) {
        const m = new T.Mesh(og, om);
        m.rotation.order = 'YXZ';
        m.scale.setScalar(1.38 + (k % 2) * 0.2);
        scene.add(m);
        cfOrdekler.push([m, p.x, p.z, 1.9 + k * 0.78, k * 1.05, 0.36 + (k % 3) * 0.08, k * 1.4]);
      }
      cfYer.golet = [p.x, p.z, p.i];
    }
  }

  // ───────── 5) sevimli çiftlik hayvanları: inekler, koyunlar, pembe domuzcuklar ve beyaz tavuklar ─────────
  { // benekli inekler (daha büyük, boyun çanlı)
    const B = cvYapi();
    B.ekle(cvG.kutuY, 0, 1.05, 0, 1.05, 0.95, 1.85, KREM);                // gövde
    B.ekle(cvG.kureK, 0.36, 1.22, 0.3, 0.34, 0.34, 0.48, 0x2b2d34);       // siyah benekler
    B.ekle(cvG.kureK, -0.34, 1.15, -0.35, 0.34, 0.32, 0.44, 0x2b2d34);
    B.ekle(cvG.kureK, 0.1, 1.5, -0.2, 0.32, 0.12, 0.36, 0x2b2d34);
    B.ekle(cvG.kutuY, 0, 1.35, 1.15, 0.68, 0.65, 0.72, KREM, 0, 0, 0, 0, 0.5, 0);   // baş
    B.ekle(cvG.kutuY, 0, 1.22, 1.52, 0.54, 0.34, 0.26, 0xffb5b5, 0, 0, 0, 0, 0.5, 0); // pembe burun
    B.ekle(cvG.sil, 0, 0.92, 0.96, 0.14, 0.18, 0.14, ALTIN, 0, 0, 0, 0, 0.3, 0);     // altın çan
    for (const s of [-1, 1]) {
      B.ekle(cvG.ufak, s * 0.2, 1.44, 1.5, 0.065, 0.065, 0.05, 0x222222, 0, 0, 0, 0, 0.5, 0);
      B.ekle(cvG.koni, s * 0.25, 1.78, 1.08, 0.09, 0.28, 0.09, 0xe8d4a2, 0, 0, -s * 0.35, 0, 0.5, 0);
      B.ekle(cvG.kureK, s * 0.42, 1.48, 1.02, 0.2, 0.09, 0.13, 0x2b2d34, 0, 0, s * 0.3, 0, 0.5, 0);
      for (const z of [-0.62, 0.62]) B.ekle(cvG.sil, s * 0.34, 0.38, z, 0.13, 0.76, 0.13, KREM);
    }
    B.ekle(cvG.sil, 0, 1.0, -0.98, 0.05, 0.7, 0.05, KREM, 0.35);
    const inekListe = [];
    for (let k = 0; k < 8; k++) {
      const p = yer(0.07 + k * 0.12, k % 2 ? -1 : 1, YARI + 12 + (k % 3) * 2.5, 2.4);
      if (p) {
        const s = 1.35 + (k % 2) * 0.1;
        inekListe.push([p.x, 0, p.z, s, s, s, p.ry + (k % 3 - 1) * 0.6]);
        golge.push([p.x, p.z, 2.6, 1.9, 0.22]);
      }
    }
    if (inekListe.length) cok(cvTon(B.geo()), cvMalz(2), inekListe);
  }

  { // pofuduk beyaz koyunlar (daha dolgun, başları hafifçe sallanır)
    const B = cvYapi();
    B.ekle(cvG.tacY, 0, 0.76, 0, 0.74, 0.64, 0.94, 0xfaf8f2);             // yün gövde
    B.ekle(cvG.kureK, 0.36, 0.8, 0.16, 0.34, 0.34, 0.4, 0xfaf8f2);
    B.ekle(cvG.kureK, -0.36, 0.8, -0.16, 0.34, 0.34, 0.4, 0xfaf8f2);
    B.ekle(cvG.kureK, 0, 0.96, 0.76, 0.33, 0.31, 0.39, 0x4a403a, 0, 0, 0, 0, 0.45, 0.4);   // baş
    B.ekle(cvG.kureK, 0, 1.15, 0.68, 0.26, 0.15, 0.24, 0xfaf8f2, 0, 0, 0, 0, 0.45, 0.4);  // alın yünü
    for (const s of [-1, 1]) {
      B.ekle(cvG.kureK, s * 0.28, 0.98, 0.68, 0.16, 0.09, 0.11, 0x4a403a, 0, 0, s * 0.35, 0, 0.45, 0.4);
      B.ekle(cvG.ufak, s * 0.14, 1.0, 1.08, 0.045, 0.045, 0.045, 0xfff8ee, 0, 0, 0, 0, 0.45, 0.4);
      for (const z of [-0.36, 0.36]) B.ekle(cvG.sil, s * 0.26, 0.25, z, 0.09, 0.5, 0.09, 0x4a403a);
    }
    const koyunListe = [];
    for (let k = 0; k < 12; k++) {
      const p = yer(0.05 + k * 0.082, k % 2 ? 1 : -1, YARI + 11 + (k % 3) * 2.5, 1.7);
      if (p) {
        const s = 1.16 + (k % 3) * 0.12;
        koyunListe.push([p.x, 0, p.z, s, s, s, p.ry + k]);
        golge.push([p.x, p.z, 1.8, 1.4, 0.2]);
      }
    }
    if (koyunListe.length) cok(cvTon(B.geo()), cvMalz(2), koyunListe);
  }

  { // pembe domuzcuklar + çamurlu ahşap ağıl (f ~ 0.36)
    const pen = yer(0.36, -1, YARI + 15.5, 6.5, YARI + 12.5);
    const domuzYerler = [];
    if (pen) {
      cfCamur = [pen.x, pen.z, 3.6];
      S.yer(pen.x, pen.z, pen.ry);
      // alçak ahşap ağıl çiti + yem teknesi
      const px = [-4.2, 0, 4.2], pz = [-3.4, 0, 3.4];
      for (const x of px) for (const z of [-3.4, 3.4]) S.ekle(cvG.kutuY, x, 0.55, z, 0.2, 1.1, 0.2, AHSAP);
      for (const z of pz) for (const x of [-4.2, 4.2]) S.ekle(cvG.kutuY, x, 0.55, z, 0.2, 1.1, 0.2, AHSAP);
      for (const y of [0.38, 0.78]) {
        for (const z of [-3.4, 3.4]) S.ekle(cvG.kutuY, 0, y, z, 8.5, 0.12, 0.1, AHSAP2);
        for (const x of [-4.2, 4.2]) S.ekle(cvG.kutuY, x, y, 0, 0.1, 0.12, 6.9, AHSAP2);
      }
      S.ekle(cvG.kutuY, -2.5, 0.25, 2.2, 1.8, 0.4, 0.7, AHSAP);   // yem teknesi
      for (let k = 0; k < 5; k++) {
        const a = k * 1.25 + 0.3, r = 1.4 + (k % 2) * 1.2;
        const w = S.dunya(Math.cos(a) * r, Math.sin(a) * r * 0.8);
        domuzYerler.push([w.x, 0, w.z, 1.05 + (k % 2) * 0.15, 1.05 + (k % 2) * 0.15, 1.05 + (k % 2) * 0.15, pen.ry + a]);
        golge.push([w.x, w.z, 1.1, 0.9, 0.2]);
      }
      cfYer.domuz = [pen.x, pen.z, pen.i];
    }
    if (domuzYerler.length) {
      const D = cvYapi();
      D.ekle(cvG.tacY, 0, 0.52, 0, 0.55, 0.48, 0.78, PEMBE);                        // gövde
      D.ekle(cvG.kureK, 0, 0.62, 0.65, 0.34, 0.32, 0.34, PEMBE, 0, 0, 0, 0, 0.4, 0.2); // baş
      D.ekle(cvG.sil, 0, 0.56, 0.96, 0.18, 0.16, 0.18, 0xff7b9c, Math.PI / 2, 0, 0, 0, 0.4, 0.2); // burun
      for (const s of [-1, 1]) {
        D.ekle(cvG.ufak, s * 0.06, 0.57, 1.05, 0.025, 0.03, 0.02, 0x6b2838, 0, 0, 0, 0, 0.4, 0.2);
        D.ekle(cvG.ufak, s * 0.15, 0.72, 0.9, 0.04, 0.04, 0.03, 0x222222, 0, 0, 0, 0, 0.4, 0.2);
        D.ekle(cvG.kureK, s * 0.25, 0.86, 0.58, 0.14, 0.08, 0.14, 0xff85a4, 0, 0, s * 0.5, 0, 0.4, 0.2);
        for (const z of [-0.36, 0.32]) D.ekle(cvG.sil, s * 0.2, 0.16, z, 0.09, 0.32, 0.09, 0xff85a4);
      }
      D.ekle(cvG.kureK, 0, 0.62, -0.78, 0.1, 0.1, 0.1, 0xff7b9c);                    // kıvrık kuyruk
      cok(cvTon(D.geo()), cvMalz(2), domuzYerler);
    }
  }

  { // ahır çevresinde gagalı beyaz tavuklar
    const T_ = cvYapi();
    T_.ekle(cvG.kureK, 0, 0.32, 0, 0.24, 0.22, 0.3, KREM, 0, 0, 0, 0, 0.25, 0);             // gövde
    T_.ekle(cvG.kureK, 0, 0.52, 0.22, 0.14, 0.14, 0.14, KREM, 0, 0, 0, 0, 0.25, 0.75);        // baş
    T_.ekle(cvG.koni, 0, 0.5, 0.38, 0.06, 0.12, 0.06, 0xff9422, Math.PI / 2, 0, 0, 0, 0.25, 0.75); // gaga
    T_.ekle(cvG.kureK, 0, 0.67, 0.22, 0.05, 0.08, 0.1, KIRMIZI, 0, 0, 0, 0, 0.25, 0.75);      // ibik
    T_.ekle(cvG.koni, 0, 0.42, -0.32, 0.12, 0.22, 0.12, KREM, -0.8);                          // kuyruk
    for (const s of [-1, 1]) {
      T_.ekle(cvG.ufak, s * 0.1, 0.55, 0.31, 0.025, 0.025, 0.025, 0x222222, 0, 0, 0, 0, 0.25, 0.75);
      T_.ekle(cvG.sil, s * 0.08, 0.1, 0, 0.025, 0.2, 0.025, 0xff9422);
    }
    const tavukListe = [];
    for (let k = 0; k < 8; k++) {
      const p = yer(0.08 + k * 0.011, 1, YARI + 10.8 + (k % 3) * 1.4, 0.8);
      if (p) {
        const s = 1.15 + (k % 2) * 0.15;
        tavukListe.push([p.x, 0, p.z, s, s, s, Rc() * 6.28]);
        golge.push([p.x, p.z, 0.65, 0.55, 0.18]);
      }
    }
    if (tavukListe.length) cok(cvTon(T_.geo()), cvMalz(2), tavukListe);
  }

  // ───────── 6) altın yuvarlak saman balyaları + rüzgârda salınan altın buğday tarlaları ─────────
  {
    const B = cvYapi();
    B.ekle(cvG.sil, 0, 0.85, 0, 0.85, 1.65, 0.85, ALTIN, 0, 0, Math.PI / 2);
    B.ekle(cvG.sil, 0, 0.85, 0, 0.87, 0.12, 0.87, 0xd49c24, 0, 0, Math.PI / 2);
    B.ekle(cvG.sil, 0, 0.85, 0, 0.65, 1.68, 0.65, 0xdca82e, 0, 0, Math.PI / 2);
    const balyaListe = [], bugdayListe = [];
    for (let k = 0; k < 18; k++) {
      const p = yer(0.05 + k * 0.053, k % 3 ? 1 : -1, YARI + 11 + (k % 4) * 3.5, 1.8);
      if (!p) continue;
      const s = 0.95 + (k % 3) * 0.15;
      balyaListe.push([p.x, 0, p.z, s, s, s, Rc() * 6.28]);
      golge.push([p.x, p.z, 1.8 * s, 1.5 * s, 0.2]);
    }
    if (balyaListe.length) cok(cvTon(B.geo()), cvMalz(0), balyaListe);

    // açılış manzarası dahil 7 altın buğday tarlası ve salınan başak kümeleri (InstancedMesh)
    const bugdayNoktalari = [0.06, 0.14, 0.28, 0.45, 0.58, 0.74, 0.90];
    for (let k = 0; k < bugdayNoktalari.length; k++) {
      const p = yer(bugdayNoktalari[k], k % 2 ? 1 : -1, YARI + 15.5, 7, YARI + 11);
      if (!p) continue;
      tarlalar.push([p.x, p.z, 13, 9, p.ry, 'bugday']);
      const ca = Math.cos(-p.ry), sa = Math.sin(-p.ry);
      for (let gx = -9.5; gx <= 9.5; gx += 3.2) {
        for (let gz = -6.0; gz <= 6.0; gz += 3.0) {
          const jx = gx + (Rc() - 0.5) * 1.4, jz = gz + (Rc() - 0.5) * 1.2;
          const wx = p.x + jx * ca - jz * sa, wz = p.z + jx * sa + jz * ca;
          if (yakin(wx, wz) < YARI + 9.5) continue;
          const s = 0.9 + Rc() * 0.35;
          bugdayListe.push([wx, 0, wz, s, s, s, Rc() * 6.28, Rc() > 0.4 ? 0xf6cf52 : 0xe5b736]);
        }
      }
    }
    if (bugdayListe.length) {
      const W = cvYapi();
      const ofset = [[-0.22, 0.14, 0.08], [0.24, -0.1, -0.07], [0.0, 0.24, -0.05], [-0.12, -0.24, 0.06]];
      for (let j = 0; j < ofset.length; j++) {
        const ox = ofset[j][0], oz = ofset[j][1], eg = ofset[j][2], h = 1.35 + (j % 2) * 0.2;
        W.ekle(cvG.sil, ox, h * 0.5, oz, 0.045, h, 0.045, 0xe8bd42, eg, 0, eg * 0.7, 1);
        W.ekle(cvG.kureK, ox + eg * 0.4, h + 0.14, oz + eg * 0.3, 0.09, 0.24, 0.09, 0xffd858, eg, 0, eg * 0.7, 1);
      }
      cok(cvTon(W.geo()), cvMalz(cfBugdayHar), bugdayListe);
    }
  }

  // ───────── 7) elma bahçesi ağaçları (parlak kırmızı elmalı, dolgun taçlı) + elma kasaları ─────────
  {
    const A = cvYapi();
    A.ekle(cvG.govde, 0, 1.5, 0, 0.45, 3.0, 0.45, 0x7d4e2d);
    A.ekle(cvG.tacY, 0, 4.2, 0, 2.5, 2.25, 2.5, 0x48a846, 0, 0, 0, 0, 1);
    A.ekle(cvG.tacY, 1.2, 3.7, 0.75, 1.5, 1.35, 1.5, 0x5ec052, 0, 0, 0, 0, 1);
    A.ekle(cvG.tacY, -1.1, 3.8, -0.65, 1.45, 1.3, 1.45, 0x3e9640, 0, 0, 0, 0, 1);
    A.ekle(cvG.tacY, 0.15, 5.1, -0.35, 1.35, 1.15, 1.35, 0x62c856, 0, 0, 0, 0, 1);
    // dallar arasında parlak kırmızı elmalar
    for (let k = 0; k < 9; k++) {
      const a = k * 0.72, r = 1.7 + (k % 2) * 0.5, y = 3.45 + (k % 3) * 0.6;
      A.ekle(cvG.kureK, Math.cos(a) * r, y, Math.sin(a) * r, 0.24, 0.24, 0.24, 0xe83630, 0, 0, 0, 0, 1);
    }
    const agacListe = [];
    for (let k = 0; k < 26; k++) {
      const p = yer(0.03 + k * 0.038, k % 2 ? 1 : -1, YARI + 13 + (k % 4) * 3.5, 2.5);
      if (!p) continue;
      const s = 0.95 + (k % 3) * 0.18;
      agacListe.push([p.x, 0, p.z, s, s, s, Rc() * 6.28]);
      golge.push([p.x + 1.0 * s, p.z, 3.0 * s, 2.4 * s, 0.22]);
    }
    if (agacListe.length) cok(cvTon(A.geo()), cvMalz(1), agacListe);

    // elma bahçesi kasaları (f ~ 0.44)
    const kasaYer = yer(0.44, 1, YARI + 12.5, 3.5);
    if (kasaYer) {
      S.yer(kasaYer.x, kasaYer.z, kasaYer.ry);
      for (let c = 0; c < 3; c++) {
        const kx = (c - 1) * 1.45, kz = (c % 2) * 0.6;
        S.ekle(cvG.kutuY, kx, 0.35, kz, 1.1, 0.68, 0.85, AHSAP2);
        S.ekle(cvG.kutuY, kx, 0.35, kz, 1.14, 0.1, 0.88, AHSAP);
        for (let a = 0; a < 6; a++) {
          const ax = kx + ((a % 3) - 1) * 0.28, az = kz + (Math.floor(a / 3) - 0.5) * 0.28;
          S.ekle(cvG.kureK, ax, 0.72, az, 0.14, 0.14, 0.14, a % 4 ? 0xe83630 : 0x7ad646);
        }
      }
      golge.push([kasaYer.x, kasaYer.z, 2.5, 1.6, 0.22]);
    }
  }

  // ───────── 8) yol boyu ahşap çiftlik çitleri (en az YARI + 9.5 m uzaklıkta) ─────────
  const cfCitNoktalari = [];
  {
    const seritler = [[0.06, 0.15, 1], [0.29, 0.38, -1], [0.54, 0.62, 1], [0.76, 0.85, -1]];
    for (const [f0, f1, dis] of seritler) {
      let ox = 0, oz = 0, var_ = false;
      for (let f = f0; f <= f1; f += 0.015) {
        const i = cvI(f), yan = cfDis(i) * dis, p = cvKenar(i, yan, YARI + 9.8);
        if (yakin(p.x, p.z) < YARI + 9.2 || !cvBos(p.x, p.z, 1.0)) { var_ = false; continue; }
        S.yer(0, 0, 0);
        S.ekle(cvG.kutuY, p.x, 0.68, p.z, 0.22, 1.36, 0.22, AHSAP, 0, p.ry);
        S.ekle(cvG.kutuY, p.x, 1.4, p.z, 0.28, 0.1, 0.28, AHSAP2, 0, p.ry);
        cfCitNoktalari.push([p.x, p.z, p.ry]);
        if (var_) {
          const dx = p.x - ox, dz = p.z - oz, l = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
          if (l < 14) {
            for (const y of [0.48, 0.98]) S.ekle(cvG.kutuY, (p.x + ox) / 2, y, (p.z + oz) / 2, 0.1, 0.16, l, AHSAP2, 0, ry);
          }
        }
        ox = p.x; oz = p.z; var_ = true;
      }
    }
  }

  // ───────── 9) neşeli korkuluk + çit boyu ayçiçeği sıraları + toprak tarla ─────────
  {
    const p = yer(0.80, 1, YARI + 15, 4);
    if (p) {
      S.yer(p.x, p.z, p.ry);
      S.ekle(cvG.sil, 0, 1.45, 0, 0.1, 2.9, 0.1, AHSAP);                   // dikey kazık
      S.ekle(cvG.sil, 0, 2.1, 0, 0.08, 2.1, 0.08, AHSAP, 0, 0, Math.PI / 2); // kollar
      S.ekle(cvG.kutuY, 0, 1.85, 0, 0.72, 0.95, 0.45, KIRMIZI);             // kırmızı gömlek
      S.ekle(cvG.kutuY, 0, 1.25, 0, 0.68, 0.45, 0.44, 0x3b74c4);            // mavi tulum
      S.ekle(cvG.kureK, 0, 2.65, 0, 0.36, 0.38, 0.34, 0xf5d48e);            // saman baş
      for (const s of [-1, 1]) S.ekle(cvG.ufak, s * 0.12, 2.7, 0.3, 0.04, 0.04, 0.04, 0x222222);
      S.ekle(cvG.sil, 0, 2.95, 0, 0.65, 0.08, 0.65, 0xe8b93c);             // hasır şapka kenarı
      S.ekle(cvG.koni, 0, 3.22, 0, 0.38, 0.5, 0.38, 0xe8b93c);             // hasır şapka tepesi
      // yanında turuncu balkabakları
      S.ekle(cvG.kureK, 1.35, 0.3, 0.6, 0.42, 0.32, 0.42, 0xf27d24);
      S.ekle(cvG.kureK, -1.2, 0.24, 0.9, 0.34, 0.26, 0.34, 0xe8681c);
      tarlalar.push([p.x, p.z, 16, 12, p.ry, 'toprak']);
      golge.push([p.x, p.z, 1.8, 1.5, 0.22]);
      cfYer.korkuluk = [p.x, p.z, p.i];
    }

    // ayçiçekleri (çit kenarları + kümeler, InstancedMesh)
    const C = cvYapi();
    C.ekle(cvG.sil, 0, 0.85, 0, 0.075, 1.7, 0.075, 0x4ca242);
    C.ekle(cvG.kureK, 0.18, 0.8, 0, 0.24, 0.06, 0.15, 0x56b648, 0, 0, 0.4);
    C.ekle(cvG.kureK, -0.16, 1.05, 0, 0.22, 0.06, 0.14, 0x56b648, 0, 0, -0.4);
    C.ekle(cvG.sil, 0, 1.72, 0.06, 0.44, 0.12, 0.44, 0xffd22e, Math.PI / 2);
    C.ekle(cvG.kureK, 0, 1.72, 0.13, 0.24, 0.24, 0.1, 0x5c3a1e);
    const cicekListe = [];
    // çit direkleri boyunca parlak ayçiçeği sıraları
    for (let k = 0; k < cfCitNoktalari.length; k++) {
      const [cx, cz, ry] = cfCitNoktalari[k];
      for (let j = 0; j < 2; j++) {
        const ox = cx + Math.cos(ry + j * 1.4) * (0.65 + j * 0.35), oz = cz + Math.sin(ry + j * 1.4) * (0.65 + j * 0.35);
        if (yakin(ox, oz) < YARI + 9.2) continue;
        const s = 0.95 + ((k + j) % 3) * 0.14;
        cicekListe.push([ox, 0, oz, s, s, s, ry + (j - 0.5) * 0.3]);
      }
    }
    // ek ayçiçeği kümeleri
    for (let k = 0; k < 20; k++) {
      const p2 = yer(0.04 + k * 0.048, k % 2 ? 1 : -1, YARI + 11.0 + (k % 3) * 1.8, 0.9);
      if (!p2) continue;
      for (let j = 0; j < 3; j++) {
        const a = j * 2.1 + k, r = 0.45 + j * 0.25;
        const s = 0.95 + (j % 2) * 0.2;
        cicekListe.push([p2.x + Math.cos(a) * r, 0, p2.z + Math.sin(a) * r, s, s, s, p2.ry + (j - 1) * 0.3]);
      }
    }
    if (cicekListe.length) cok(cvTon(C.geo()), cvMalz(1), cicekListe);
  }

  // ───────── 10) ufukta sıcak altın-yeşil kır tepeleri + pofuduk bulutlar ─────────
  {
    const D = cvYapi(), dag = cvDagY();
    D.ekle(dag, 0, 0.5, 0, 1, 1, 1, 0x78c654);
    const liste = [];
    let mx = 0, mz = 0; for (let i = 0; i < N; i++) { mx += PX[i] / N; mz += PZ[i] / N; }
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * Math.PI * 2 + 0.15, r = 260 + (k % 3) * 65;
      const x = mx + Math.cos(a) * r, z = mz + Math.sin(a) * r * 0.85, s = 30 + (k % 4) * 10;
      if (yakin(x, z) < 145) continue;
      liste.push([x, -1, z, s * 1.65, s * 0.68, s * 1.25, k, k % 3 === 0 ? 0xa7d65c : k % 3 === 1 ? 0x76c456 : 0x8ece5a]);
    }
    if (liste.length) cok(cvTon(D.geo()), cvMalz(0), liste);
  }

  {
    const l = [];
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * Math.PI * 2, r = 155 + (k % 3) * 60, s = 0.7 + (k % 4) * 0.12;
      l.push([Math.cos(a) * r, 82 + (k % 4) * 10, -70 + Math.sin(a) * r, s, s * 0.8, s, k]);
    }
    cfBulut = cok(cvBulutGeo(), new T.MeshBasicMaterial({ vertexColors: true }), l);
  }

  // tüm statik yapıları tek çizim çağrısında sahneye ekle
  { const m = new T.Mesh(S.geo(), cvMalz(0)); m.frustumCulled = false; scene.add(m); }

  // ───────── zemin dokusu (1024 tuval): güneşli çayır, yonca benekleri, altın buğday tarlası, toprak karığı, gölet ─────────
  {
    let mx = 0, mz = 0; for (let i = 0; i < N; i++) { mx += PX[i] / N; mz += PZ[i] / N; }
    const W = 560, X0 = mx - W / 2, Z0 = mz - W / 2, Q = 1024 / W, px = x => (x - X0) * Q, pz = z => (z - Z0) * Q;
    const yol = g => { g.beginPath(); for (let i = 0; i <= N; i += 2) { const k = i % N; i ? g.lineTo(px(PX[k]), pz(PZ[k])) : g.moveTo(px(PX[k]), pz(PZ[k])); } g.closePath(); };

    const doku = tuvalDoku(1024, 1024, (g, w, h) => {
      // güneşli çayır yeşili taban + altın otlak yamaları
      g.fillStyle = '#7acc52'; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 160; k++) {
        const x = Rc() * w, z = Rc() * h, r = 14 + Rc() * 34;
        g.globalAlpha = 0.24;
        g.fillStyle = k % 4 === 0 ? '#b2d85a' : k % 2 ? '#64b846' : '#92da66';
        g.beginPath(); g.arc(x, z, r, 0, 7); g.fill();
      }
      // çayır yonca ve kır çiçeği benekleri
      for (let k = 0; k < 900; k++) {
        const x = Rc() * w, z = Rc() * h;
        g.globalAlpha = k % 5 === 0 ? 0.55 : 0.35;
        g.fillStyle = k % 9 === 0 ? '#fffbe6' : k % 7 === 0 ? '#ffe566' : k % 2 ? '#59aa3e' : '#a8e474';
        g.fillRect(x, z, k % 5 === 0 ? 2.2 : 1.6, k % 5 === 0 ? 2.2 : 1.6);
      }
      g.globalAlpha = 1;

      // altın buğday tarlaları ve sürülmüş toprak karıkları
      for (const q of tarlalar) {
        const x = px(q[0]), z = pz(q[1]), rw = q[2] * Q, rh = q[3] * Q;
        g.save(); g.translate(x, z); g.rotate(-q[3 + 1]);
        if (q[5] === 'bugday') {
          g.fillStyle = '#e5be4c'; g.fillRect(-rw, -rh, rw * 2, rh * 2);
          g.fillStyle = '#f4d66c';
          for (let y = -rh + 2; y < rh; y += 4.2) g.fillRect(-rw + 2, y, rw * 2 - 4, 2.0);
        } else {
          g.fillStyle = '#b27e4c'; g.fillRect(-rw, -rh, rw * 2, rh * 2);
          g.fillStyle = '#8e5e34';
          for (let y = -rh + 2; y < rh; y += 4.8) g.fillRect(-rw + 2, y, rw * 2 - 4, 2.4);
        }
        g.restore();
      }

      // yol kenarında yumuşak açık yeşil şerit
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.globalAlpha = 0.65; g.strokeStyle = '#92d864'; g.lineWidth = 2 * (YARI + 10) * Q; yol(g); g.stroke();
      g.globalAlpha = 1;

      // domuzcuk ağılının çamur birikintisi
      if (cfCamur) {
        const x = px(cfCamur[0]), z = pz(cfCamur[1]), r = cfCamur[2] * Q;
        g.fillStyle = '#8b6343'; g.beginPath(); g.ellipse(x, z, r * 1.1, r * 0.8, 0.2, 0, 7); g.fill();
        g.fillStyle = '#734f34'; g.beginPath(); g.ellipse(x + r * 0.15, z - r * 0.1, r * 0.65, r * 0.45, 0, 0, 7); g.fill();
      }

      // çiftlik göleti
      if (cfGol) {
        const x = px(cfGol[0]), z = pz(cfGol[1]), r = cfGol[2] * Q;
        g.fillStyle = '#a89268'; g.beginPath(); g.ellipse(x, z, r * 1.12, r * 0.88, 0, 0, 7); g.fill();
        g.fillStyle = '#56c2e6'; g.beginPath(); g.ellipse(x, z, r, r * 0.76, 0, 0, 7); g.fill();
        g.fillStyle = '#9be4f8'; g.beginPath(); g.ellipse(x - r * 0.18, z - r * 0.1, r * 0.48, r * 0.32, 0, 0, 7); g.fill();
      }

      // binalar, ağaçlar, traktör ve hayvanlar altında temas gölgeleri
      for (const q of golge) {
        const x = px(q[0]), z = pz(q[1]);
        g.globalAlpha = q[4];
        const rg = g.createRadialGradient(x, z, 0, x, z, q[2] * Q);
        rg.addColorStop(0, 'rgba(48,82,28,1)'); rg.addColorStop(1, 'rgba(48,82,28,0)');
        g.fillStyle = rg;
        g.save(); g.translate(x, z); g.scale(1, q[3] / q[2]); g.translate(-x, -z);
        g.beginPath(); g.arc(x, z, q[2] * Q, 0, 7); g.fill();
        g.restore();
      }
      g.globalAlpha = 1;
    });

    doku.anisotropy = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
    doku.repeat.set(1500 / W, 1500 / W); doku.offset.set((-750 - X0) / W, 1 - (680 - Z0) / W);
    doku.wrapS = doku.wrapT = T.ClampToEdgeWrapping;
    zemin.material.map = doku; zemin.material.needsUpdate = true;
    { const p = zemin.geometry.attributes.color; for (let i = 0; i < p.count; i++) { const v = 0.96 + 0.04 * Math.sin(i * 0.37); p.setXYZ(i, v, v, v); } p.needsUpdate = true; }
  }
}
