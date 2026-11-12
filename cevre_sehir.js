/* Oyuncak Şehir pistinin çevresi (yalnız ?pist=sehir iken yüklenir, cevre.js'ten sonra).
   cevre.js ortak tabanı kurar (gök dokusu scene.background, sis scene.fog, ışıklar cvGokIsik + gunes, zemin `zemin` + `cimDoku`, güneş `cvGunes`);
   bu dosya onları kendi temasına göre değiştirir ve süslerini ekler. cevreEkGuncelle(dt, t) her karede çağrılır.
   Bölgeler (pist boyunca): 0 konut mahallesi · 1 çarşı (itfaiye, pastane, dondurmacı, oyuncakçı, okul, saat kulesi) · 2 park · 3 lunapark · 4 istasyon.
   Pistin ortasındaki boş alanda oyuncak tren kendi yuvarlak rayında döner. Yeni üst düzey adlar `sh` ile başlar. Hiçbir koordinat elle verilmez: hepsi yol verisinden. */
'use strict';
let shDolap = null, shAtli = null, shTren = null, shHava = null, shBulut = null;
function cevreEkGuncelle(dt, t) {
  if (shDolap) shDolap.rotation.z = t * 0.22;     // dönme dolap yavaş döner
  if (shAtli) shAtli.rotation.y = t * 0.7;        // atlıkarınca
  if (shTren) shTren.rotation.y = t * 0.11;       // tren rayında ilerler (tek ağ)
  if (shHava) shHava.rotation.y = -t * 0.035;     // zeplin ve uçak
  if (shBulut) shBulut.rotation.y = t * 0.005;
}
if (cvTema === 'sehir') {
  const KIRMIZI = 0xf04a3c, SARI = 0xffd23e, MAVI = 0x3f9bf0, YESIL = 0x4fc264, TURUNCU = 0xff9838, MOR = 0x9a6ae8, PEMBE = 0xff8fbd, BEYAZ = 0xffffff, KREM = 0xfff1d6, AHSAP = 0xd9a566, KAHVE = 0x9a6238, GRI = 0xaab2bd, KOYU = 0x3c4654, CAM = 0xbfe9ff, CATI = 0xe5483a;
  const BLOK = [KIRMIZI, SARI, MAVI, KIRMIZI, SARI, MAVI], PASTEL = [0xffb3a8, 0xffe89a, 0xa8d8ff, KREM, 0xffe89a, 0xa8d8ff, KREM, 0xffb3a8];   // sade: 3 ana renk (kırmızı, sarı, mavi) + krem; yeşil zeminde
  const sec = l => l[(R() * l.length) | 0], PI = Math.PI;
  const shDaire = new T.CircleGeometry(1, 10), shTorus = new T.TorusGeometry(1, 0.36, 6, 14), shRay = new T.TorusGeometry(1, 0.004, 4, 72), shCember = new T.TorusGeometry(1, 0.028, 5, 28);
  const shBoru = new T.CylinderGeometry(1, 1, 1, 10, 1, true);   // pencere çerçevesinin duvardan taşan kalınlığı
  const shPiramit = new T.ConeGeometry(0.72, 1, 4); shPiramit.rotateY(PI / 4);
  const shKutu = (() => {   // yuvarlak köşeli, pahlı tombul kutu (bina gövdeleri karton gibi durmasın); birim boyut
    const sh = new T.Shape(), r = 0.22, w = 0.5 - 0.07; sh.moveTo(-w + r, -w); sh.lineTo(w - r, -w); sh.quadraticCurveTo(w, -w, w, -w + r); sh.lineTo(w, w - r); sh.quadraticCurveTo(w, w, w - r, w); sh.lineTo(-w + r, w); sh.quadraticCurveTo(-w, w, -w, w - r); sh.lineTo(-w, -w + r); sh.quadraticCurveTo(-w, -w, -w + r, -w);
    const g = new T.ExtrudeGeometry(sh, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 2, curveSegments: 3 }); g.rotateX(-PI / 2); g.computeBoundingBox();
    const b = g.boundingBox; g.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, -(b.min.z + b.max.z) / 2); g.scale(1 / (b.max.x - b.min.x), 1 / (b.max.y - b.min.y), 1 / (b.max.z - b.min.z)); g.deleteAttribute('uv'); g.computeVertexNormals(); g.userData.cvTon = true; return g;
  })();
  const shCati = (() => {   // kalın, saçaklı, tepesi yuvarlatılmış çatı (karton üçgen değil); cvG.cati ile aynı ölçü
    const sh = new T.Shape(); sh.moveTo(-2.62, 0.05); sh.lineTo(2.62, 0.05); sh.lineTo(0.3, 1.43); sh.quadraticCurveTo(0, 1.6, -0.3, 1.43); sh.lineTo(-2.62, 0.05);
    const g = new T.ExtrudeGeometry(sh, { depth: 4.5, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.16, bevelSegments: 2, curveSegments: 3 }); g.translate(0, 0, -2.25); g.deleteAttribute('uv'); g.computeVertexNormals(); g.userData.cvTon = true; return g;
  })();

  // ───────── ışık: neşeli, aydınlık öğle ─────────
  scene.fog.color.setHex(0xe2f4ff); cvGokIsik.groundColor.setHex(0xc4c8b4); cvGokIsik.intensity = 1.2; gunes.intensity = 1.4;

  { // gök: yukarıda parlak mavi, ufka doğru süt mavisi
    const c = scene.background.image, g = c.getContext('2d'), h = c.height, gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#3b9df0'); gr.addColorStop(0.3, '#6dbcf7'); gr.addColorStop(0.45, '#b3e1fb'); gr.addColorStop(0.52, '#e2f4ff'); gr.addColorStop(0.6, '#f3faff'); gr.addColorStop(1, '#f3faff');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, h); scene.background.needsUpdate = true;
  }
  let shT = 31337; const Rs = () => { shT = (shT * 1664525 + 1013904223) >>> 0; return shT / 4294967296; };   // yeni süslerin kendi sayı üreteci: eski yerleşimi kaydırmaz
  // ───────── zemin: oyun halısı gibi açık yeşil kareli çimen ─────────
  {
    const c = cimDoku.image, g = c.getContext('2d'), w = c.width, h = c.height, k = w / 4;
    g.globalAlpha = 1; g.fillStyle = '#8ed868'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) { g.fillStyle = '#9bdf74'; g.fillRect(i * k + 4, j * k + 4, k - 8, k - 8); }
    for (let i = 0; i < 900; i++) { g.globalAlpha = 0.3; g.fillStyle = ['#7bcb58', '#b4ec8e', '#84d262', '#c0f09a'][i % 4]; g.fillRect(R() * w, R() * h, 1.6, 3 + R() * 4); }
    for (let i = 0; i < 70; i++) { g.globalAlpha = 0.95; g.fillStyle = ['#ffffff', '#ffe46b', '#ffb3d6', '#ffffff'][i % 4]; g.beginPath(); g.arc(4 + R() * (w - 8), 4 + R() * (h - 8), 1.6 + R() * 1.4, 0, 7); g.fill(); }
    g.globalAlpha = 1; cimDoku.needsUpdate = true;
    const p = zemin.geometry.attributes.position, col = zemin.geometry.attributes.color;   // geniş, yumuşak ton geçişi: yol çevresi taze açık yeşil, uzak çimen serin ve sakin
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = -p.getY(i) - 70, d = yakin(x, z), u = clamp((d - YARI - 6) / 60, 0, 1), y = clamp((d - 90) / 240, 0, 1), v = 0.975 + 0.03 * Math.sin(x * 0.017 + z * 0.021);
      col.setXYZ(i, lerp(lerp(1.03, 0.95, u), 0.92, y) * v, lerp(1.01, 0.99, u) * v, lerp(lerp(0.9, 0.95, u), 1.0, y) * v);
    }
    col.needsUpdate = true;
  }
  // ───────── kaldırım: yolun iki yanında gri karo şerit (ortası saydam, yolun altında kalır) ─────────
  {
    const W = YARI + 4.5, kd = tuvalDoku(256, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h); const px = w / (2 * W), ic = Math.round((YARI + 0.4) * px), n = 16, kh = h / n;
      for (const sag of [0, 1]) {
        const x0 = sag ? w / 2 + ic : 0, gen = w / 2 - ic, kw = gen / 4;
        for (let i = 0; i < 4; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? '#d3d8df' : '#c3c9d2'; g.fillRect(x0 + i * kw, j * kh, kw, kh); g.strokeStyle = '#aeb5c0'; g.lineWidth = 1.5; g.strokeRect(x0 + i * kw + 0.5, j * kh + 0.5, kw - 1, kh - 1); }
        g.fillStyle = '#eef1f5'; g.fillRect(sag ? w - 4 : 0, 0, 4, h);
      }
    }, true);
    const ks = new T.Mesh(serit(-W, W, 0, L / Math.round(L / (2 * W))), new T.MeshLambertMaterial({ map: kd, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    ks.renderOrder = -1; ks.frustumCulled = false; scene.add(ks);
  }

  const S = cvYapi(), golge = [], agac = [], shIsik = [];
  const bolge = i => { const f = (((i % N) + N) % N) / N; return f < 0.1 || f >= 0.9 ? 0 : f < 0.3 ? 1 : f < 0.5 ? 2 : f < 0.7 ? 3 : 4; };
  const yer = (i, yan, uz, r, donuk) => {   // pist kenarında boş yer bul (yola ve başka süslere taşmaz); gerekirse karşı yanı dener
    for (let k = 0; k < 18; k++) {
      const y2 = k < 9 ? yan : -yan, kk = k % 9, p = cvKenar(i + (kk % 2 ? -1 : 1) * Math.ceil(kk / 2) * 5, y2, uz, donuk || 0), x = p.x, z = p.z, ry = p.ry;
      if (yakin(x, z) > YARI + 3.4 + r && cvBos(x, z, r)) { cvYasak.push([x, z, r + 0.6]); golge.push([x - 0.5, 0.014, z + 0.4, r * 1.1, 1, r * 0.85, -0.4]); return { x, z, ry }; }
    }
    return null;
  };
  const pencere = (B, x, y, z, r) => { B.ekle(shBoru, x, y, z, r, 0.1, r, BEYAZ, PI / 2); B.ekle(shDaire, x, y, z + 0.05, r, r, 1, BEYAZ); B.ekle(shDaire, x, y, z + 0.065, r * 0.72, r * 0.72, 1, 0xffdf8f); B.ekle(cvG.kutu, x, y, z + 0.085, r * 1.44, r * 0.13, 0.03, BEYAZ); B.ekle(cvG.kutu, x, y, z + 0.085, r * 0.13, r * 1.44, 0.03, BEYAZ); B.ekle(cvG.kutu, x, y - r * 1.02, z + 0.06, r * 1.7, r * 0.2, 0.22, BEYAZ); };   // artı çerçeveli yuvarlak pencere + denizlik
  const kapi = (B, x, z, c) => { const k = new T.Color(c).multiplyScalar(0.86).getHex(); B.ekle(cvG.kutu, x, 0.95, z, 1.1, 1.9, 0.14, k); B.ekle(cvG.sil, x, 1.9, z, 0.55, 0.14, 0.55, k, PI / 2); B.ekle(cvG.kureK, x + 0.33, 1.0, z + 0.1, 0.08, 0.08, 0.06, SARI); };

  // ───────── oyuncak tren: pistin ortasındaki boşlukta, kendi yuvarlak rayında ─────────
  const lok = (B, c) => {
    B.ekle(cvG.sil, 0, 1.55, 0.55, 0.85, 2.7, 0.85, c, PI / 2); B.ekle(cvG.sil, 0, 1.55, 1.95, 0.92, 0.16, 0.92, SARI, PI / 2); B.ekle(cvG.kureK, 0, 1.55, 2.05, 0.3, 0.3, 0.12, BEYAZ);
    B.ekle(cvG.kutu, 0, 1.9, -1.45, 1.9, 2.4, 1.5, KIRMIZI); B.ekle(cvG.kutu, 0, 3.18, -1.45, 2.2, 0.2, 1.9, SARI); B.ekle(cvG.kutu, 0, 0.72, 0, 1.7, 0.36, 4.6, KOYU);
    for (const sx of [-1, 1]) { B.ekle(cvG.sil, sx * 0.96, 2.3, -1.45, 0.42, 0.06, 0.42, CAM, 0, 0, PI / 2); for (const z of [-1.5, 0, 1.4]) { B.ekle(cvG.sil, sx * 0.9, 0.6, z, 0.6, 0.24, 0.6, KOYU, 0, 0, PI / 2); B.ekle(cvG.sil, sx * 1.04, 0.6, z, 0.3, 0.06, 0.3, SARI, 0, 0, PI / 2); } }
    B.ekle(cvG.sil, 0, 2.75, 1.2, 0.3, 0.9, 0.3, KOYU); B.ekle(cvG.sil, 0, 3.25, 1.2, 0.46, 0.22, 0.46, SARI); B.ekle(cvG.kure, 0, 2.5, 0.2, 0.36, 0.3, 0.36, SARI);
    B.ekle(cvG.kure, 0.1, 4.0, 1.0, 0.5, 0.42, 0.5, BEYAZ, 0, 0, 0, 0, 0, 1); B.ekle(cvG.kure, -0.2, 4.9, 0.5, 0.72, 0.6, 0.72, BEYAZ, 0, 0, 0, 0, 0, 1);
    B.ekle(cvG.kutu, 0, 0.5, 2.5, 1.7, 0.5, 0.3, KIRMIZI, 0.5);
  };
  const vagon = (B, c, k) => {
    B.ekle(cvG.kutu, 0, 0.72, 0, 1.7, 0.36, 4.2, KOYU); B.ekle(cvG.kutu, 0, 1.75, 0, 1.95, 1.75, 3.9, c);
    if (k % 2) { B.ekle(cvG.sil, 0, 2.62, 0, 1.0, 3.9, 0.45, BEYAZ, PI / 2); for (const sx of [-1, 1]) for (const z of [-1.1, 0, 1.1]) B.ekle(cvG.sil, sx * 0.99, 1.95, z, 0.4, 0.05, 0.4, CAM, 0, 0, PI / 2); }
    else { B.ekle(cvG.kutu, 0, 2.66, 0, 1.6, 0.1, 3.5, KOYU); for (let j = 0; j < 3; j++) B.ekle(cvG.kure, (j - 1) * 0.3, 2.85, (j - 1) * 1.1, 0.62, 0.55, 0.62, BLOK[(j + k) % 6]); }
    for (const sx of [-1, 1]) for (const z of [-1.3, 1.3]) { B.ekle(cvG.sil, sx * 0.9, 0.5, z, 0.5, 0.24, 0.5, KOYU, 0, 0, PI / 2); B.ekle(cvG.sil, sx * 1.04, 0.5, z, 0.24, 0.06, 0.24, SARI, 0, 0, PI / 2); }
    B.ekle(cvG.kutu, 0, 0.75, 2.35, 0.3, 0.2, 0.7, KOYU);
  };
  {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < N; i++) { x0 = Math.min(x0, PX[i]); x1 = Math.max(x1, PX[i]); z0 = Math.min(z0, PZ[i]); z1 = Math.max(z1, PZ[i]); }
    const icinde = (x, z) => { let c = false; for (let i = 0, j = N - 8; i < N; j = i, i += 8) if ((PZ[i] > z) !== (PZ[j] > z) && x < (PX[j] - PX[i]) * (z - PZ[i]) / (PZ[j] - PZ[i]) + PX[i]) c = !c; return c; };
    let cx = 0, cz = 0, en = 0;
    for (let x = x0; x <= x1; x += 5) for (let z = z0; z <= z1; z += 5) { if (!icinde(x, z)) continue; const d = yakin(x, z); if (d > en) { en = d; cx = x; cz = z; } }
    const rr = Math.min(40, en - (YARI + 11));
    if (rr > 13) {
      const s = 1.5; S.yer(0, 0, 0);
      for (const d of [-1.35, 1.35]) S.ekle(shRay, cx, 0.3, cz, rr + d, rr + d, rr + d, GRI, PI / 2);
      const n = Math.round(rr * 6.283 / 2.4);
      for (let k = 0; k < n; k++) { const a = k / n * 6.283; S.ekle(cvG.kutu, cx + Math.cos(a) * rr, 0.1, cz + Math.sin(a) * rr, 4, 0.2, 0.7, k % 2 ? KAHVE : AHSAP, 0, -a); if (k % 2 === 0) cvYasak.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, 4.2]); }
      const Tr = cvYapi(), adim = 7.4 / rr;
      for (let k = 0; k < 6; k++) { const a = k * adim; Tr.yer(Math.cos(a) * rr, Math.sin(a) * rr, PI - a, s); if (k) vagon(Tr, BLOK[(k + 1) % 6], k); else lok(Tr, MAVI); }
      shTren = new T.Mesh(Tr.geo(), cvMalz(5)); shTren.position.set(cx, 0.3, cz); shTren.frustumCulled = false; scene.add(shTren);
      // ortada dev halka kulesi (oyuncak) + küçük duraklar
      S.yer(cx, cz, 0, 1); cvYasak.push([cx, cz, 12]); golge.push([cx - 1.5, 0.014, cz + 1.2, 14, 1, 11, -0.4]);
      S.ekle(cvG.sil, 0, 0.4, 0, 9.5, 0.8, 9.5, KREM); S.ekle(cvG.sil, 0, 8, 0, 0.9, 16, 0.9, SARI); S.ekle(cvG.kure, 0, 16.6, 0, 1.7, 1.7, 1.7, KIRMIZI);
      for (let k = 0; k < 5; k++) { const r = 7.4 - k * 1.15; S.ekle(shTorus, 0, 2.6 + k * 2.75, 0, r, r, 3.7, [KIRMIZI, TURUNCU, SARI, YESIL, MAVI][k], PI / 2); }
      for (let k = 0; k < 4; k++) {
        const a = k * PI / 2 + 0.6, r2 = rr - 6.5, px = cx + Math.cos(a) * r2, pz = cz + Math.sin(a) * r2; S.yer(px, pz, -a + PI / 2, 1); cvYasak.push([px, pz, 4.5]);
        S.ekle(cvG.kutu, 0, 0.3, 0, 8, 0.6, 3, GRI); S.ekle(cvG.kutu, 0, 3.3, 0, 7, 0.24, 3.2, k % 2 ? KIRMIZI : MAVI); for (const sx of [-1, 1]) S.ekle(cvG.sil5, sx * 3, 1.9, 0, 0.14, 2.8, 0.14, BEYAZ); S.ekle(cvG.kutu, 0, 1.0, -0.6, 2.4, 0.16, 0.7, AHSAP);
      }
    }
  }

  // ───────── yapılar ─────────
  const ev = (q, c, cati, s) => {   // blok ev: kırmızı çatı, yuvarlak pencereler
    S.yer(q.x, q.z, q.ry, s);
    S.ekle(cvG.kutu, 0, 0.12, 0, 5.2, 0.24, 4.6, KREM); S.ekle(shKutu, 0, 1.7, 0, 4.6, 3.2, 4, c); S.ekle(cvG.kutu, 0, 3.24, 0, 4.75, 0.16, 4.15, new T.Color(c).multiplyScalar(0.78).getHex()); S.ekle(shCati, 0, 3.3, 0, 1.02, 1.18, 1.0, cati);
    kapi(S, 0, 2.02, c === KREM ? MAVI : KAHVE); for (const sx of [-1, 1]) pencere(S, sx * 1.5, 2.15, 2.02, 0.56);
    pencere(S, 0, 4.1, 2.47, 0.42); S.ekle(cvG.kutu, 1.35, 4.7, -0.9, 0.75, 1.5, 0.75, KREM); S.ekle(cvG.kutu, 1.35, 5.5, -0.9, 0.95, 0.22, 0.95, cati);
  };
  const apartman = (q, kat, s) => {   // üst üste renkli bloklar
    S.yer(q.x, q.z, q.ry, s); const h = (R() * 6) | 0;
    for (let k = 0; k < kat; k++) {
      const y = 1.25 + k * 2.5, g = 5 - k * 0.25; S.ekle(shKutu, 0, y, 0, g, 2.5, 4.4 - k * 0.2, k % 2 ? PASTEL[(h + k) % 8] : BLOK[(h + k) % 6]);
      for (const sx of [-1, 0, 1]) { if (!k && !sx) kapi(S, 0, 2.22, KREM); else pencere(S, sx * 1.55, y + 0.15, 2.21 - k * 0.1, 0.5); }
    }
    const y = kat * 2.5; if ((h + kat) % 2) { S.ekle(shCati, 0, y, 0, 0.9 - kat * 0.03, 1, 0.95 - kat * 0.03, CATI); } else { S.ekle(cvG.kutu, 0, y + 0.15, 0, 5.3 - kat * 0.25, 0.3, 4.7 - kat * 0.2, BEYAZ); S.ekle(shPiramit, 0, y + 1, 0, 2.4, 1.5, 2.4, CATI); }
  };
  const dukkan = (q, c, t1, isaret) => {   // tenteli dükkân, çatısında resimli işaret
    S.yer(q.x, q.z, q.ry, 1.1);
    S.ekle(cvG.kutu, 0, 0.1, 0.4, 6.4, 0.2, 5.6, GRI); S.ekle(shKutu, 0, 1.8, 0, 5.6, 3.4, 4.2, c); S.ekle(cvG.kutu, 0, 3.65, 0, 6, 0.32, 4.6, BEYAZ);
    for (let k = 0; k < 6; k++) S.ekle(cvG.kutu, -2.5 + k, 2.75, 2.6, 1, 0.14, 1.5, k % 2 ? BEYAZ : t1, 0.5);
    S.ekle(cvG.kutu, -1.1, 1.45, 2.12, 2.6, 1.5, 0.1, BEYAZ); S.ekle(cvG.kutu, -1.1, 1.45, 2.16, 2.3, 1.2, 0.1, CAM); kapi(S, 1.6, 2.12, t1);
    if (isaret === 0) { S.ekle(cvG.sil, 0, 4.4, 0, 1.5, 1.1, 1.5, KREM); S.ekle(cvG.sil, 0, 5.05, 0, 1.58, 0.3, 1.58, PEMBE); S.ekle(cvG.sil, 0, 5.6, 0, 1, 0.8, 1, KREM); S.ekle(cvG.sil, 0, 6.05, 0, 1.06, 0.22, 1.06, BEYAZ); S.ekle(cvG.kure, 0, 6.4, 0, 0.32, 0.32, 0.32, KIRMIZI); for (let k = 0; k < 6; k++) S.ekle(cvG.kureK, Math.cos(k * 1.047) * 1.3, 5.3, Math.sin(k * 1.047) * 1.3, 0.2, 0.2, 0.2, KIRMIZI); }
    else if (isaret === 1) { S.ekle(cvG.koni, 0, 4.9, 0, 0.9, 2.3, 0.9, 0xe3aa5c, PI); S.ekle(cvG.kure, 0, 6.5, 0, 1.1, 1, 1.1, PEMBE); S.ekle(cvG.kure, 0, 7.6, 0, 0.88, 0.8, 0.88, KREM); S.ekle(cvG.kureK, 0, 8.45, 0, 0.28, 0.28, 0.28, KIRMIZI); }
    else { S.ekle(cvG.kutu, -0.9, 4.5, 0, 1.4, 1.4, 1.4, KIRMIZI, 0, 0.3); S.ekle(cvG.kutu, 0.7, 4.5, 0.1, 1.4, 1.4, 1.4, MAVI, 0, -0.2); S.ekle(cvG.kutu, -0.1, 5.9, 0, 1.4, 1.4, 1.4, SARI, 0, 0.5); S.ekle(cvG.kure, 0, 7.2, 0, 0.7, 0.7, 0.7, YESIL); S.ekle(cvG.kure, 2.1, 4.4, 0.6, 0.6, 0.6, 0.6, TURUNCU); }
  };
  const itfaiye = q => {
    S.yer(q.x, q.z, q.ry, 1.1);
    S.ekle(cvG.kutu, 0, 0.1, 0.6, 9.4, 0.2, 6.4, GRI); S.ekle(shKutu, 0, 2, 0, 7.4, 4, 4.6, KIRMIZI); S.ekle(cvG.kutu, 0, 4.15, 0, 7.8, 0.34, 5, BEYAZ);
    for (const sx of [-1, 1]) { S.ekle(cvG.kutu, sx * 1.8, 1.5, 2.32, 2.8, 3, 0.1, BEYAZ); for (let k = 0; k < 4; k++) S.ekle(cvG.kutu, sx * 1.8, 0.5 + k * 0.7, 2.36, 2.5, 0.1, 0.1, GRI); pencere(S, sx * 1.8, 3.5, 2.32, 0.34); }
    S.ekle(shKutu, -4.6, 3.6, -0.8, 2.2, 7.2, 2.2, 0xd63a2e); S.ekle(cvG.kutu, -4.6, 7.3, -0.8, 2.6, 0.3, 2.6, BEYAZ); S.ekle(shPiramit, -4.6, 8.2, -0.8, 2.3, 1.6, 2.3, SARI); pencere(S, -4.6, 6, 0.31, 0.6); S.ekle(cvG.kure, -4.6, 9.2, -0.8, 0.36, 0.36, 0.36, SARI);
    // itfaiye arabası (oyuncak)
    S.ekle(cvG.kutu, 5.6, 1.15, 1.2, 1.9, 1.3, 4.2, KIRMIZI); S.ekle(cvG.kutu, 5.6, 2.1, 2.5, 1.8, 0.9, 1.4, KIRMIZI); S.ekle(cvG.kutu, 5.6, 2.15, 3.22, 1.5, 0.6, 0.06, CAM); S.ekle(cvG.kutu, 5.6, 2.05, 0.4, 0.5, 0.14, 3.6, BEYAZ, -0.12); S.ekle(cvG.kureK, 5.6, 2.7, 2.5, 0.2, 0.2, 0.2, MAVI);
    for (const sx of [-1, 1]) for (const z of [-0.2, 2.5]) S.ekle(cvG.sil, 5.6 + sx * 0.95, 0.5, z, 0.5, 0.3, 0.5, KOYU, 0, 0, PI / 2);
  };
  const okul = q => {
    S.yer(q.x, q.z, q.ry, 1.1);
    S.ekle(cvG.kutu, 0, 0.1, 0.5, 10.4, 0.2, 6, GRI); S.ekle(shKutu, 0, 1.9, 0, 9, 3.6, 4.4, SARI); S.ekle(shCati, 0, 3.7, 0, 1.72, 1, 1, CATI);
    S.ekle(shKutu, 0, 3.4, 0.6, 2.6, 6.8, 3.4, 0xffe27a); S.ekle(shPiramit, 0, 7.9, 0.6, 2.9, 2.2, 3.6, CATI); S.ekle(cvG.kure, 0, 9.15, 0.6, 0.3, 0.3, 0.3, SARI);
    kapi(S, 0, 2.32, MAVI); pencere(S, 0, 5.4, 2.31, 0.8); S.ekle(cvG.kutu, 0, 5.6, 2.37, 0.09, 0.56, 0.04, KOYU); S.ekle(cvG.kutu, 0.2, 5.4, 2.37, 0.44, 0.09, 0.04, KOYU);
    for (const sx of [-1, 1]) for (const k of [0, 1]) pencere(S, sx * (2.1 + k * 1.5), 2.2, 2.22, 0.52);
    S.ekle(cvG.sil5, 4, 3, 2.8, 0.08, 6, 0.08, BEYAZ); S.ekle(cvG.kutu, 4.75, 5.5, 2.8, 1.4, 0.9, 0.06, KIRMIZI, 0, 0, 0, 0, 1); S.ekle(cvG.kureK, 4, 6.05, 2.8, 0.16, 0.16, 0.16, SARI);
  };
  const saatKulesi = q => {
    S.yer(q.x, q.z, q.ry, 1.15);
    S.ekle(cvG.kutu, 0, 1, 0, 3.6, 2, 3.6, KREM); S.ekle(shKutu, 0, 3.4, 0, 2.8, 2.8, 2.8, MAVI); S.ekle(shKutu, 0, 6, 0, 2.6, 2.4, 2.6, SARI); S.ekle(shKutu, 0, 8.6, 0, 3, 2.8, 3, KREM); S.ekle(cvG.kutu, 0, 10.1, 0, 3.4, 0.3, 3.4, BEYAZ);
    S.ekle(shPiramit, 0, 11.6, 0, 3.2, 2.8, 3.2, CATI); S.ekle(cvG.kure, 0, 13.2, 0, 0.34, 0.34, 0.34, SARI); kapi(S, 0, 1.82, KAHVE);
    for (let k = 0; k < 4; k++) { S.yer(q.x, q.z, q.ry + k * PI / 2, 1.15); S.ekle(shDaire, 0, 8.6, 1.52, 1.2, 1.2, 1, KIRMIZI); S.ekle(shDaire, 0, 8.6, 1.55, 1, 1, 1, BEYAZ); S.ekle(cvG.kutu, 0, 8.95, 1.58, 0.12, 0.8, 0.04, KOYU); S.ekle(cvG.kutu, 0.25, 8.6, 1.58, 0.56, 0.12, 0.04, KOYU); pencere(S, 0, 6, 1.31, 0.5); if (k) pencere(S, 0, 3.5, 1.41, 0.55); }
  };
  const cesme = q => {
    S.yer(q.x, q.z, q.ry, 1.15);
    S.ekle(cvG.sil, 0, 0.35, 0, 3, 0.7, 3, 0xe6e9ee); S.ekle(cvG.sil, 0, 0.6, 0, 2.6, 0.3, 2.6, 0x6fc8ff); S.ekle(cvG.sil, 0, 1.3, 0, 0.4, 1.6, 0.4, BEYAZ); S.ekle(cvG.sil, 0, 2.1, 0, 1.4, 0.3, 1.4, 0xe6e9ee); S.ekle(cvG.sil, 0, 2.24, 0, 1.15, 0.1, 1.15, 0x6fc8ff);
    S.ekle(cvG.sil, 0, 2.8, 0, 0.2, 1, 0.2, BEYAZ); S.ekle(cvG.kure, 0, 3.5, 0, 0.5, 0.5, 0.5, 0x9adcff, 0, 0, 0, 0, 1);
    for (let k = 0; k < 6; k++) { const a = k * 1.047; S.ekle(cvG.kureK, Math.cos(a) * 1.6, 1.6, Math.sin(a) * 1.6, 0.16, 0.5, 0.16, 0xc8eeff, 0, 0, 0, 0, 1); S.ekle(cvG.kureK, Math.cos(a) * 2.1, 0.95, Math.sin(a) * 2.1, 0.16, 0.26, 0.16, 0xc8eeff, 0, 0, 0, 0, 1); }
  };
  const salincak = q => {
    S.yer(q.x, q.z, q.ry + PI / 2, 1.2); S.ekle(cvG.kutu, 0, 3.2, 0, 4.6, 0.2, 0.2, KIRMIZI);
    for (const sx of [-1, 1]) for (const r of [-1, 1]) S.ekle(cvG.kutu, sx * 2.2, 1.6, r * 0.6, 0.18, 3.4, 0.18, KIRMIZI, r * 0.36);
    for (const sx of [-1, 1]) { const e = sx * 0.3; for (const d of [-0.4, 0.4]) S.ekle(cvG.kutu, sx * 1 + d, 2.0, e * 1.2, 0.05, 2.5, 0.05, BEYAZ, -e); S.ekle(cvG.kutu, sx * 1, 0.8, e * 2.4, 1, 0.1, 0.45, sx > 0 ? SARI : MAVI, -e); }
  };
  const kaydirak = q => {
    S.yer(q.x, q.z, q.ry + PI / 2, 1.2);
    for (const sx of [-1, 1]) for (const z of [-0.7, 0.7]) S.ekle(cvG.kutu, sx * 0.7, 1.2, z, 0.16, 2.4, 0.16, MAVI);
    S.ekle(cvG.kutu, 0, 2.3, 0, 1.7, 0.16, 1.7, MAVI); S.ekle(cvG.kutu, 0, 1.25, 2.6, 1.2, 0.12, 4.2, SARI, 0.52); for (const sx of [-1, 1]) S.ekle(cvG.kutu, sx * 0.62, 1.42, 2.6, 0.1, 0.4, 4.2, KIRMIZI, 0.52);
    S.ekle(shPiramit, 0, 4.1, 0, 1.9, 1.2, 1.9, KIRMIZI); for (const sx of [-1, 1]) for (const z of [-0.7, 0.7]) S.ekle(cvG.kutu, sx * 0.7, 3, z, 0.1, 1.3, 0.1, MAVI);
    for (let k = 0; k < 5; k++) S.ekle(cvG.kutu, 0, 0.35 + k * 0.42, -0.9 - (4 - k) * 0.22, 1.1, 0.1, 0.16, AHSAP);
  };
  const tahterevalli = q => {
    S.yer(q.x, q.z, q.ry + PI / 2, 1.2); S.ekle(cvG.ucgen, 0, 0.35, 0, 0.5, 0.7, 0.6, MAVI); S.ekle(cvG.kutu, 0, 0.78, 0, 4.6, 0.14, 0.5, SARI, 0, 0, 0.2);
    for (const sx of [-1, 1]) { S.ekle(cvG.kutu, sx * 1.9, 0.86 + sx * 0.38, 0, 0.5, 0.1, 0.56, KIRMIZI, 0, 0, 0.2); S.ekle(cvG.kutu, sx * 1.4, 1.1 + sx * 0.28, 0, 0.08, 0.5, 0.4, KIRMIZI); }
  };
  const bank = (x, z, ry) => { S.yer(x, z, ry, 1.1); S.ekle(cvG.kutu, 0, 0.55, 0, 2.2, 0.12, 0.6, AHSAP); S.ekle(cvG.kutu, 0, 1.0, -0.3, 2.2, 0.5, 0.1, AHSAP); for (const sx of [-1, 1]) S.ekle(cvG.kutu, sx * 0.9, 0.28, 0, 0.14, 0.56, 0.56, YESIL); };
  const golet = q => {   // küçük gölet, kavisli köprü, yüzen ördekler
    S.yer(q.x, q.z, q.ry, 1); golge.pop();
    S.ekle(shDaire, 0, 0.03, 0, 7.4, 6, 1, 0xf2e2b4, -PI / 2); S.ekle(shDaire, 0, 0.06, 0, 6.6, 5.2, 1, 0x58c0f2, -PI / 2); S.ekle(shDaire, -1.5, 0.08, 1, 2.4, 1.5, 1, 0x86d6fa, -PI / 2);
    for (let k = -3; k <= 3; k++) { const u = k / 3.5, y = 0.3 + 1.5 * (1 - u * u), rx = Math.atan(0.5 * u); S.ekle(cvG.kutu, 0, y, k * 1.6, 2.8, 0.26, 1.72, k % 2 ? AHSAP : 0xe9bd78, rx); for (const sx of [-1, 1]) { S.ekle(cvG.sil5, sx * 1.35, y + 0.6, k * 1.6, 0.08, 1, 0.08, KIRMIZI); S.ekle(cvG.ufak, sx * 1.35, y + 1.15, k * 1.6, 0.17, 0.17, 0.17, SARI); } }
    for (const d of [[-4, 0.5, 1], [3.6, -1.4, 2.5], [4.2, 1.8, -1]]) { S.ekle(cvG.kure, d[0], 0.3, d[1], 0.42, 0.34, 0.55, SARI, 0, d[2], 0, 0, 0, 1); S.ekle(cvG.kureK, d[0] + Math.sin(d[2]) * 0.4, 0.75, d[1] + Math.cos(d[2]) * 0.4, 0.26, 0.26, 0.26, SARI, 0, 0, 0, 0, 0, 1); S.ekle(cvG.kureK, d[0] + Math.sin(d[2]) * 0.7, 0.72, d[1] + Math.cos(d[2]) * 0.7, 0.12, 0.06, 0.12, TURUNCU, 0, 0, 0, 0, 0, 1); }
  };
  const cadir = (x, z, s, c) => {
    S.yer(x, z, R() * 6, s); S.ekle(cvG.sil, 0, 1, 0, 1.7, 2, 1.7, BEYAZ); for (let k = 0; k < 5; k++) S.ekle(cvG.kutu, Math.cos(k * 1.257) * 1.68, 1, Math.sin(k * 1.257) * 1.68, 0.7, 2, 0.1, c, 0, -k * 1.257 + PI / 2);
    S.ekle(cvG.koni, 0, 2.9, 0, 2.2, 1.8, 2.2, c); S.ekle(cvG.sil5, 0, 4.2, 0, 0.05, 1, 0.05, BEYAZ); S.ekle(cvG.kutu, 0.35, 4.5, 0, 0.7, 0.4, 0.04, SARI, 0, 0, 0, 0, 1);
  };
  const balon = (x, z, n) => {
    S.yer(x, z, R() * 6, 1); S.ekle(cvG.kutu, 0, 0.2, 0, 0.5, 0.4, 0.5, KAHVE);
    for (let k = 0; k < n; k++) { const a = k * 2.1, d = 0.5 + (k % 2) * 0.3, y = 3.1 + (k % 3) * 0.7; S.ekle(cvG.kutu, Math.cos(a) * d * 0.5, y / 2, Math.sin(a) * d * 0.5, 0.03, y, 0.03, BEYAZ, 0, 0, 0, 0, 0, 0.5); S.ekle(cvG.kure, Math.cos(a) * d, y + 0.5, Math.sin(a) * d, 0.5, 0.62, 0.5, BLOK[(k + ((x | 0) & 7)) % 6], 0, 0, 0, 0, 0, 1); }
  };
  const lamba = (x, z, ry) => { S.yer(x, z, ry, 1); S.ekle(cvG.sil5, 0, 2.1, 0, 0.09, 4.2, 0.09, KOYU); S.ekle(cvG.sil, 0, 0.15, 0, 0.24, 0.3, 0.24, KOYU); S.ekle(cvG.kutu, 0, 4.2, 0.4, 0.09, 0.09, 0.9, KOYU); S.ekle(cvG.kureK, 0, 4.0, 0.85, 0.3, 0.3, 0.3, 0xfff0a0); S.ekle(cvG.sil, 0, 4.26, 0.85, 0.36, 0.1, 0.36, KOYU); };
  const trafik = (x, z, ry) => { S.yer(x, z, ry, 1.15); S.ekle(cvG.sil5, 0, 1.6, 0, 0.1, 3.2, 0.1, KOYU); S.ekle(cvG.kutu, 0, 3.7, 0, 0.6, 1.6, 0.44, KOYU); S.ekle(cvG.kutu, 0, 4.62, 0.24, 0.66, 0.08, 0.3, KOYU); [KIRMIZI, SARI, 0x44d264].forEach((c, k) => { const q = S.dunya(0, 0.2); shIsik.push([q.x, (4.2 - k * 0.5) * 1.15, q.z, 0.23, 0.23, 0.16, ry, c]); }); };   // lambalar sırayla yanar (gölgelendiricide)
  const suKulesi = q => { S.yer(q.x, q.z, q.ry, 1.2); for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.ekle(cvG.kutu, sx * 1, 2, sz * 1, 0.18, 4, 0.18, KAHVE); S.ekle(cvG.sil, 0, 5, 0, 1.7, 2.2, 1.7, KIRMIZI); S.ekle(cvG.sil, 0, 5, 0, 1.75, 0.3, 1.75, SARI); S.ekle(cvG.koni, 0, 6.6, 0, 1.9, 1, 1.9, KOYU); S.ekle(cvG.kutu, 0, 4.4, 1.9, 0.2, 0.2, 1.6, GRI, 0.5); };
  const sinyal = (x, z, ry) => { S.yer(x, z, ry, 1.2); for (let k = 0; k < 5; k++) S.ekle(cvG.sil5, 0, 0.35 + k * 0.7, 0, 0.1, 0.7, 0.1, k % 2 ? BEYAZ : KIRMIZI); S.ekle(cvG.kutu, 0.7, 3.4, 0, 1.6, 0.34, 0.08, KIRMIZI, 0, 0, 0.5); S.ekle(cvG.kutu, 1.25, 3.7, 0.02, 0.3, 0.36, 0.1, BEYAZ, 0, 0, 0.5); S.ekle(cvG.kureK, 0, 3.75, 0, 0.2, 0.2, 0.2, SARI); };
  const istasyon = q => {
    S.yer(q.x, q.z, q.ry, 1.1);
    S.ekle(cvG.kutu, 0, 0.25, 0.6, 12, 0.5, 6.4, GRI); S.ekle(shKutu, 0, 2.2, -0.4, 8, 3.4, 3.6, KREM); S.ekle(shCati, 0, 3.9, -0.4, 1.56, 1.1, 0.86, CATI);
    S.ekle(cvG.kutu, 0, 3.5, 2.3, 10.4, 0.2, 2.6, YESIL, 0.12); for (const sx of [-1, 0, 1]) S.ekle(cvG.sil5, sx * 4.6, 1.9, 3.2, 0.12, 2.9, 0.12, BEYAZ);
    kapi(S, 0, 1.42, YESIL); for (const sx of [-1, 1]) for (const k of [0, 1]) pencere(S, sx * (1.7 + k * 1.5), 2.5, 1.42, 0.5);
    S.ekle(shDaire, 0, 4.9, 1.69, 0.72, 0.72, 1, KOYU); S.ekle(shDaire, 0, 4.9, 1.72, 0.6, 0.6, 1, BEYAZ); S.ekle(cvG.kutu, 0, 5.1, 1.75, 0.08, 0.45, 0.04, KOYU); S.ekle(cvG.kutu, 0.15, 4.9, 1.75, 0.34, 0.08, 0.04, KOYU);
    S.ekle(cvG.kutu, -3.6, 1.05, 2.4, 2.2, 0.12, 0.6, AHSAP); S.ekle(cvG.kutu, -3.6, 0.8, 2.4, 1.9, 0.5, 0.14, AHSAP); S.ekle(cvG.kutu, 3.4, 0.9, 2.6, 0.9, 0.8, 0.7, KAHVE); S.ekle(cvG.kutu, 4.3, 0.8, 2.5, 0.7, 0.6, 0.5, MAVI);
  };

  // ── bölge simgeleri (yerleri yol verisinden) ──
  const kur = (f, yan, uz, r, fn) => { const q = yer(cvI(f), yan, uz, r, 0.25); if (q) fn(q); return q; };
  [[0.905, 1, KREM], [0.94, -1, 0xffe89a], [0.975, 1, 0xa8d8ff], [0.01, -1, 0xffb3a8], [0.045, 1, KREM], [0.08, -1, 0xa8d8ff]].forEach((e, k) => kur(e[0], e[1], YARI + 11.5 + (k % 2) * 1.5, 4.2, q => ev(q, e[2], k % 3 === 1 ? 0x4f8fe0 : CATI, 0.95 + (k % 3) * 0.08)));
  kur(0.118, 1, YARI + 12.5, 7.5, itfaiye);
  kur(0.15, -1, YARI + 11.5, 4.6, q => dukkan(q, 0xffb3a8, KIRMIZI, 0));
  kur(0.182, 1, YARI + 11.5, 4.6, q => dukkan(q, 0xa8d8ff, MAVI, 1));
  kur(0.214, -1, YARI + 11.5, 4.6, q => dukkan(q, 0xffe89a, KIRMIZI, 2));
  kur(0.246, 1, YARI + 12, 6.4, okul);
  kur(0.278, -1, YARI + 12, 3.4, saatKulesi);
  kur(0.325, 1, YARI + 12, 3.8, cesme); kur(0.36, -1, YARI + 12, 3.4, salincak); kur(0.4, 1, YARI + 12, 3.6, kaydirak);   // sade: tahterevalli ve ikinci salıncak/kaydırak kaldırıldı
  kur(0.448, 1, YARI + 14, 7.8, golet);
  { // dönme dolap: ayaklar sabit, teker ayrı ağ
    const q = yer(cvI(0.565), 1, YARI + 17, 9.5, 0);
    if (q) {
      S.yer(q.x, q.z, q.ry, 1); S.ekle(cvG.kutu, 0, 0.3, 0, 13, 0.6, 5.4, KREM);
      for (const z of [-1.7, 1.7]) for (const sx of [-1, 1]) S.ekle(cvG.kutu, sx * 2.5, 6.2, z, 0.4, 12.6, 0.4, MAVI, 0, 0, sx * 0.39);
      S.ekle(cvG.sil, 0, 12, 0, 0.6, 4.2, 0.6, SARI, PI / 2); S.ekle(cvG.kutu, 5, 1.6, 2, 1.8, 2.2, 1.8, KIRMIZI); S.ekle(shPiramit, 5, 3.3, 2, 2, 1.2, 2, SARI);
      const D = cvYapi(), RD = 9.2;
      for (const z of [-1, 1]) { D.ekle(shCember, 0, 0, z, RD, RD, RD, KIRMIZI); D.ekle(shCember, 0, 0, z, RD * 0.55, RD * 0.55, RD * 0.55, SARI); D.ekle(cvG.sil, 0, 0, z * 1.1, 1.1, 0.2, 1.1, SARI, PI / 2); for (let k = 0; k < 4; k++) D.ekle(cvG.kutu, 0, 0, z, 0.2, RD * 2, 0.2, BEYAZ, 0, 0, k * PI / 4); }
      for (let k = 0; k < 8; k++) { const a = k * PI / 4 + 0.39, x = Math.cos(a) * RD, y = Math.sin(a) * RD; D.ekle(cvG.kure, x, y, 0, 1.15, 1.05, 0.95, BLOK[k % 6]); D.ekle(cvG.sil, x, y, 0, 0.62, 2, 0.62, CAM, PI / 2); D.ekle(cvG.sil, x, y, 0, 0.1, 2.2, 0.1, KOYU, PI / 2); }
      shDolap = new T.Mesh(D.geo(), cvMalz(0)); shDolap.position.set(q.x, 12, q.z); shDolap.rotation.y = q.ry; shDolap.frustumCulled = false; scene.add(shDolap);
    }
  }
  { // atlıkarınca
    const q = yer(cvI(0.625), -1, YARI + 10.5, 5.2, 0);
    if (q) {
      S.yer(q.x, q.z, q.ry, 1); S.ekle(cvG.sil, 0, 0.25, 0, 5, 0.5, 5, KIRMIZI);
      const A = cvYapi(); A.ekle(cvG.sil, 0, 0.6, 0, 4.6, 0.2, 4.6, KREM); A.ekle(cvG.sil, 0, 2.8, 0, 0.5, 4.4, 0.5, SARI); A.ekle(cvG.sil, 0, 5, 0, 5, 0.5, 5, SARI); A.ekle(cvG.koni, 0, 6.2, 0, 5.1, 1.9, 5.1, KIRMIZI); A.ekle(cvG.kure, 0, 7.4, 0, 0.45, 0.45, 0.45, SARI);
      for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283; A.ekle(cvG.kure, Math.cos(a) * 5, 4.7, Math.sin(a) * 5, 0.36, 0.36, 0.36, BLOK[k % 6]); }
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283, y = 1.7 + (k % 2) * 0.7; A.yer(Math.cos(a) * 3.3, Math.sin(a) * 3.3, -a, 1.15); A.ekle(cvG.sil5, 0, 2.2, 0, 0.06, 3.4, 0.06, BEYAZ); A.ekle(cvG.kure, 0, y, 0, 0.36, 0.42, 0.85, PASTEL[k]); A.ekle(cvG.kureK, 0, y + 0.55, 0.75, 0.24, 0.3, 0.4, PASTEL[k], 0.5); A.ekle(cvG.kureK, 0, y + 0.2, -0.85, 0.1, 0.36, 0.12, SARI, -0.5); A.ekle(cvG.kutu, 0, y + 0.42, 0, 0.5, 0.12, 0.5, KIRMIZI); for (const z of [-0.5, 0.5]) for (const sx of [-1, 1]) A.ekle(cvG.kutu, sx * 0.2, y - 0.6, z, 0.12, 0.6, 0.12, PASTEL[k]); }
      shAtli = new T.Mesh(A.geo(), cvMalz(0)); shAtli.position.set(q.x, 0.3, q.z); shAtli.frustumCulled = false; scene.add(shAtli);
    }
  }
  [[0.52, -1, KIRMIZI], [0.6, -1, MAVI], [0.675, 1, SARI]].forEach(e => kur(e[0], e[1], YARI + 12, 3.6, q => cadir(q.x, q.z, 1.7, e[2])));
  kur(0.785, 1, YARI + 12.5, 7.6, istasyon); kur(0.735, -1, YARI + 9.5, 2.6, suKulesi); kur(0.86, 1, YARI + 9.5, 2.6, suKulesi);
  [[0.72, 1], [0.86, -1]].forEach(e => kur(e[0], e[1], YARI + 6.5, 1, q => sinyal(q.x, q.z, q.ry)));
  { // istasyon yanında park etmiş vagonlar (kısa düz ray üstünde)
    const q = yer(cvI(0.835), -1, YARI + 11, 6.5, 0);
    if (q) for (const k of [-1, 0, 1]) { S.yer(q.x, q.z, q.ry + PI / 2, 1.25); S.yer(0, k * 4.9, 0, 1, true); if (k === 1) lok(S, YESIL); else vagon(S, k ? TURUNCU : MOR, k + 2); for (let j = -2; j <= 2; j++) S.ekle(cvG.kutu, 0, 0.08, j * 1, 3, 0.16, 0.5, KAHVE); for (const sx of [-1, 1]) S.ekle(cvG.kutu, sx * 0.9, 0.2, 0, 0.14, 0.1, 4.9, GRI); }
  }

  // ───────── yan sokaklar: yaya geçidi çizgili kısa sokak + trafik ışığı (yolun dışında) ─────────
  for (const f of [0.165, 0.3, 0.7, 0.945]) for (const yan of [1, -1]) {   // sade: yarısı
    const i = cvI(f), p = cvKenar(i, yan, YARI + 11.5), x = p.x, z = p.z, ry = p.ry; let ok = cvBos(x, z, 6);
    for (const u of [4.6, 9, 14, 18]) for (const v of [-4, 4]) { const a = cvKenar(i, yan, YARI + u); if (yakin(a.x + TX[i] * v, a.z + TZ[i] * v) < YARI + 3.4) ok = false; }
    if (!ok) continue;
    for (const u of [8, 13, 17]) { const a = cvKenar(i, yan, YARI + u); cvYasak.push([a.x, a.z, 4.4]); }
    S.yer(x, z, ry, 1); S.ekle(cvG.kutu, 0, 0.03, 0, 6.6, 0.06, 14, 0x7c8592); for (const sx of [-1, 1]) S.ekle(cvG.kutu, sx * 3.7, 0.06, 0, 0.8, 0.12, 14, 0xd3d8df);
    for (let k = -2; k <= 2; k++) S.ekle(cvG.kutu, k * 1.2, 0.07, 4.6, 0.7, 0.04, 2.8, BEYAZ); for (let k = 0; k < 3; k++) S.ekle(cvG.kutu, 0, 0.07, 0.5 - k * 2.6, 0.24, 0.04, 1.4, BEYAZ);
    const a = cvKenar(i - 6, yan, YARI + 4.2, 2.2), ax = a.x, az = a.z, ary = a.ry; if (yakin(ax, az) > YARI + 3.6) { cvYasak.push([ax, az, 0.9]); trafik(ax, az, ary); }
    break;
  }
  // ───────── sokak lambaları ─────────
  for (let i = 10; i < N; i += 84) { const yan = (i / 84 | 0) % 2 ? 1 : -1, p = cvKenar(i, yan, YARI + 4), x = p.x, z = p.z, ry = p.ry; if (yakin(x, z) > YARI + 3.7 && cvBos(x, z, 0.5)) { cvYasak.push([x, z, 0.9]); lamba(x, z, ry); } }
  // ───────── virajlarda yazısız renkli ok tabelaları ─────────
  {
    const tepe = []; for (let i = 0; i < N; i++) { let k = 0; for (let j = -6; j <= 6; j++) k += KAP[(i + j + N) % N]; tepe.push(k / 13); }
    let son = -99, n = 0;
    for (let i = 0; i < N; i++) {
      const k = Math.abs(tepe[i]); if (k < 0.014 || k < Math.abs(tepe[(i + 1) % N]) || k < Math.abs(tepe[(i + N - 1) % N]) || i - son < 90) continue; son = i; n++;
      const sag = tepe[i] > 0 ? 1 : -1, c = [MAVI, KIRMIZI][n % 2];
      for (const g of [-14]) {
        const q = yer(i + g + N, -sag, YARI + 5.3, 1.2, 2.2); if (!q) continue;
        S.yer(q.x, q.z, q.ry, 1.25);
        for (let j = 0; j < 4; j++) S.ekle(cvG.sil5, 0, 0.28 + j * 0.56, 0, 0.13, 0.56, 0.13, j % 2 ? BEYAZ : KIRMIZI);
        S.ekle(cvG.kutu, 0, 2.95, -0.03, 2.9, 1.7, 0.16, SARI); S.ekle(cvG.kutu, 0, 2.95, 0.03, 2.6, 1.4, 0.16, c);
        S.ekle(cvG.kutu, -sag * 0.35, 2.95, 0.13, 1.15, 0.36, 0.08, BEYAZ); S.ekle(cvG.ucgen, sag * 0.62, 2.95, 0.13, 0.56, 0.8, 0.06, BEYAZ, 0, 0, -sag * PI / 2);
      }
    }
  }
  // (lunaparktaki bayrak ipleri sadelik için kaldırıldı)

  // ───────── oyuncak kutusu: dev oyuncak ayı, şekilli tahta küp yığınları, dönen rüzgâr gülleri ─────────
  const shAyi = [], shGul = [];
  for (const [f, yan] of [[0.41, -1], [0.6, 1], [0.76, -1], [0.2, 1], [0.05, -1]]) { const q = yer(cvI(f), yan, YARI + 25, 8.5, 0.35); if (q) { shAyi.push([q.x, 0, q.z, 4.2, 4.2, 4.2, q.ry, 0xc98a52]); golge[golge.length - 1] = [q.x, 0.014, q.z, 8, 1, 7, 0]; break; } }
  [[0.135, -1], [0.635, 1]].forEach((e, k) => {
    const q = yer(cvI(e[0]), e[1], YARI + 18, 4.6, 0.3); if (!q) return; const bx = q.x, bz = q.z, bry = q.ry;
    [[-1.75, 1.5, 0.2, 0.15], [1.75, 1.5, -0.2, -0.2], [0.1, 4.5, 0, 0.45], [3.9, 1, 2.6, 0.9]].forEach((u, j) => {
      if (j === 3 && k % 2) return; const b = j === 3 ? 2 : 3, c = BLOK[(k + j * 2) % 6], c2 = BLOK[(k + j * 2 + 3) % 6];
      S.yer(bx, bz, bry, 1); S.yer(u[0], u[2], u[3], 1, true); S.ekle(cvG.kutu, 0, u[1], 0, b, b, b, c);
      for (let d = 0; d < 4; d++) { const a = d * PI / 2, x = Math.sin(a) * b / 2, z = Math.cos(a) * b / 2, t = (k + j + d) % 3;
        S.ekle(cvG.kutu, x, u[1], z, b * 0.78, b * 0.78, 0.08, KREM, 0, a);
        if (t === 0) S.ekle(cvG.sil, x * 1.04, u[1], z * 1.04, b * 0.25, 0.06, b * 0.25, c2, PI / 2, a); else if (t === 1) S.ekle(cvG.kutu, x * 1.04, u[1], z * 1.04, b * 0.36, b * 0.36, 0.06, c2, 0, a, PI / 4); else S.ekle(cvG.ucgen, x * 1.04, u[1], z * 1.04, b * 0.3, b * 0.46, 0.05, c2, 0, a); }
    });
  });
  for (let i = 6; i < N; i += 30) { const b = bolge(i); if (b === 1) continue; for (const yan of [-1, 1]) {   // iri, renkli kanatlı; gelen arabaya bakar
    if (Rs() < 0.8) continue; let p = null;
    for (const uz of [9, 10.5]) { const q = cvKenar(i + ((Rs() * 5) | 0), yan, YARI + uz, 3); if (yakin(q.x, q.z) > YARI + 8.4 && cvBos(q.x, q.z, 0.6)) { p = { x: q.x, z: q.z, ry: q.ry }; break; } }
    if (!p) continue; cvYasak.push([p.x, p.z, 0.8]);
    const u = 1.6 + Rs() * 0.25; shGul.push([p.x, 0, p.z, u, u, u, p.ry, BLOK[(Rs() * 6) | 0]]); golge.push([p.x, 0.014, p.z, 0.5 * u, 1, 0.5 * u, 0]);
  } }
  // ───────── seyirciler: oyuncak ayı, robot, bez bebek, ördek (zıplar, el sallar; hareket gölgelendiricide) ─────────
  {
    const A = cvYapi(), Rb = cvYapi(), Bb = cvYapi(), O = cvYapi(), GOZ = 0x2a2420, al = [], rl = [], bl = [], ol = [];
    // ayı
    A.ekle(cvG.kure, 0, 0.75, 0, 0.5, 0.6, 0.42, BEYAZ, 0, 0, 0, 1, 1); A.ekle(cvG.kure, 0, 1.52, 0, 0.43, 0.39, 0.38, BEYAZ, 0, 0, 0, 1, 1); A.ekle(cvG.kureK, 0, 1.44, 0.33, 0.17, 0.13, 0.11, 0xfff0d8, 0, 0, 0, 0, 1); A.ekle(cvG.kureK, 0, 0.75, 0.33, 0.3, 0.36, 0.14, 0xfff0d8, 0, 0, 0, 0, 1);
    A.ekle(cvG.kureK, 0, 1.5, 0.44, 0.05, 0.04, 0.03, GOZ, 0, 0, 0, 0, 1); A.ekle(cvG.kutu, 0, 1.12, 0.3, 0.3, 0.1, 0.1, KIRMIZI, 0, 0, 0, 0, 1);
    for (const sx of [-1, 1]) { A.ekle(cvG.kureK, sx * 0.3, 1.86, 0, 0.15, 0.15, 0.1, BEYAZ, 0, 0, 0, 1, 1); A.ekle(cvG.kureK, sx * 0.16, 1.6, 0.35, 0.05, 0.055, 0.03, GOZ, 0, 0, 0, 0, 1); A.ekle(cvG.kure, sx * 0.25, 0.2, 0.1, 0.2, 0.22, 0.27, BEYAZ, 0, 0, 0, 1, 1); }
    A.ekle(cvG.kure, -0.5, 0.95, 0.1, 0.16, 0.3, 0.16, BEYAZ, 0, 0, -0.5, 1, 1); A.ekle(cvG.kure, 0.52, 1.25, 0.1, 0.16, 0.36, 0.16, BEYAZ, 0, 0, -0.6, 1, 1, 1);
    // robot
    Rb.ekle(cvG.kutu, 0, 0.9, 0, 0.85, 0.8, 0.55, BEYAZ, 0, 0, 0, 1, 1); Rb.ekle(cvG.kutu, 0, 1.68, 0, 0.66, 0.55, 0.52, BEYAZ, 0, 0, 0, 1, 1); Rb.ekle(cvG.kutu, 0, 1.34, 0, 0.3, 0.14, 0.3, GRI, 0, 0, 0, 0, 1);
    Rb.ekle(cvG.kutu, 0, 0.95, 0.29, 0.5, 0.36, 0.04, KOYU, 0, 0, 0, 0, 1); for (let k = 0; k < 3; k++) Rb.ekle(cvG.kureK, (k - 1) * 0.15, 0.95, 0.31, 0.055, 0.055, 0.04, [KIRMIZI, SARI, 0x44d264][k], 0, 0, 0, 0, 1);
    Rb.ekle(cvG.kutu, 0, 1.52, 0.27, 0.3, 0.05, 0.03, GOZ, 0, 0, 0, 0, 1); Rb.ekle(cvG.sil5, 0, 2.1, 0, 0.03, 0.3, 0.03, GRI, 0, 0, 0, 0, 1); Rb.ekle(cvG.kureK, 0, 2.3, 0, 0.09, 0.09, 0.09, KIRMIZI, 0, 0, 0, 0, 1);
    for (const sx of [-1, 1]) { Rb.ekle(cvG.kureK, sx * 0.16, 1.74, 0.27, 0.09, 0.09, 0.04, SARI, 0, 0, 0, 0, 1); Rb.ekle(cvG.kutu, sx * 0.22, 0.26, 0, 0.24, 0.52, 0.3, GRI, 0, 0, 0, 0, 1); Rb.ekle(cvG.kureK, sx * 0.38, 1.7, 0, 0.08, 0.12, 0.12, GRI, 0, 0, 0, 0, 1); }
    Rb.ekle(cvG.kutu, -0.56, 0.85, 0, 0.16, 0.6, 0.18, GRI, 0, 0, -0.15, 0, 1); Rb.ekle(cvG.kutu, 0.6, 1.36, 0, 0.16, 0.66, 0.18, GRI, 0, 0, -0.5, 0, 1, 1); Rb.ekle(cvG.kureK, 0.8, 1.74, 0, 0.13, 0.13, 0.13, KIRMIZI, 0, 0, 0, 0, 1, 1);
    // bez bebek
    Bb.ekle(cvG.koni, 0, 0.8, 0, 0.56, 1.3, 0.5, BEYAZ, 0, 0, 0, 1, 1); Bb.ekle(cvG.kure, 0, 1.6, 0, 0.36, 0.36, 0.34, 0xffdcc0, 0, 0, 0, 0, 1); Bb.ekle(cvG.kure, 0, 1.72, -0.07, 0.39, 0.33, 0.35, 0xe8582e, 0, 0, 0, 0, 1);
    for (const sx of [-1, 1]) { Bb.ekle(cvG.kureK, sx * 0.44, 1.56, -0.05, 0.14, 0.24, 0.14, 0xe8582e, 0, 0, sx * 0.3, 0, 1); Bb.ekle(cvG.kureK, sx * 0.13, 1.63, 0.31, 0.045, 0.055, 0.03, GOZ, 0, 0, 0, 0, 1); Bb.ekle(cvG.kureK, sx * 0.22, 1.5, 0.28, 0.07, 0.05, 0.03, PEMBE, 0, 0, 0, 0, 1); Bb.ekle(cvG.kutu, sx * 0.17, 0.14, 0.04, 0.16, 0.28, 0.26, KIRMIZI, 0, 0, 0, 0, 1); }
    Bb.ekle(cvG.kureK, 0, 1.47, 0.32, 0.08, 0.03, 0.02, KIRMIZI, 0, 0, 0, 0, 1); Bb.ekle(cvG.kure, -0.46, 0.95, 0, 0.11, 0.3, 0.11, 0xffdcc0, 0, 0, -0.6, 0, 1); Bb.ekle(cvG.kure, 0.5, 1.3, 0, 0.11, 0.33, 0.11, 0xffdcc0, 0, 0, -0.7, 0, 1, 1); Bb.ekle(cvG.kureK, 0, 1.22, 0.2, 0.3, 0.07, 0.2, BEYAZ, 0, 0, 0, 0, 1);
    // ördek
    O.ekle(cvG.kure, 0, 0.55, 0, 0.44, 0.4, 0.56, BEYAZ, 0, 0, 0, 1, 1); O.ekle(cvG.kure, 0, 1.15, 0.24, 0.3, 0.3, 0.3, BEYAZ, 0, 0, 0, 1, 1); O.ekle(cvG.kureK, 0, 1.1, 0.56, 0.15, 0.07, 0.17, TURUNCU, 0, 0, 0, 0, 1); O.ekle(cvG.kureK, 0, 0.75, -0.55, 0.16, 0.14, 0.2, BEYAZ, 0.6, 0, 0, 1, 1);
    for (const sx of [-1, 1]) { O.ekle(cvG.kureK, sx * 0.14, 1.26, 0.48, 0.045, 0.055, 0.03, GOZ, 0, 0, 0, 0, 1); O.ekle(cvG.kureK, sx * 0.18, 0.07, 0.12, 0.14, 0.06, 0.2, TURUNCU, 0, 0, 0, 0, 1); O.ekle(cvG.kureK, sx * 0.44, 0.62, -0.02, 0.1, 0.24, 0.36, BEYAZ, 0, 0, sx * -0.3, 1, 1, sx > 0 ? 1 : 0); }
    for (let i = 5; i < N; i += 12) for (const yan of [-1, 1]) {
      if (R() < 0.84) continue; const adet = 1, b = bolge(i);   // sade: seyirci azaldı, tek tek
      for (let j = 0; j < adet; j++) {
        const p = cvKenar(i + j * 2, yan, YARI + 8.5 + R() * 1.6, 0.4), x = p.x, z = p.z, ry = p.ry;
        if (yakin(x, z) < YARI + 8 || !cvBos(x, z, 0.75)) continue; cvYasak.push([x, z, 0.75]);
        const s = 1.25 + R() * 0.4, tur = (b + j + (R() < 0.4 ? 1 : 0)) % 4;
        if (tur === 0) al.push([x, 0, z, s, s, s, ry, sec([0xc98a4e, 0xe0b070])]);
        else if (tur === 1) rl.push([x, 0, z, s, s, s, ry, sec([0x6fc3ff, 0xff7f6a])]);
        else if (tur === 2) bl.push([x, 0, z, s, s, s, ry, sec([0xff7f6a, 0x5fb4ff])]);
        else ol.push([x, 0, z, s, s, s, ry, sec([0xffd93a])]);
        golge.push([x, 0.014, z, 0.85 * s, 1, 0.7 * s, 0]);
      }
    }
    if (al.length) cok(A.geo(), cvMalz(2), al); if (rl.length) cok(Rb.geo(), cvMalz(2), rl); if (bl.length) cok(Bb.geo(), cvMalz(2), bl); if (ol.length) cok(O.geo(), cvMalz(2), ol);
  }

  // ───────── yol boyu dolgu: bölgeye göre evler, apartmanlar, lolipop ağaçlar, balonlar ─────────
  const agacEkle = (x, z, s, renkler) => { agac.push([x, 0, z, s, s * (0.9 + R() * 0.3), s, R() * 6, sec(renkler)]); golge.push([x - 0.4, 0.014, z + 0.3, 1.7 * s, 1, 1.35 * s, -0.4]); };
  const YESILLER = [0x4fc264, 0x6fd45a, 0x56c878], CICEKLI = [0x4fc264, 0x6fd45a, 0x56c878, 0xffb3a8];
  for (let i = 0; i < N; i += 4) for (const yan of [-1, 1]) for (let sira = 0; sira < 3; sira++) {
    if (R() < (sira === 2 ? 0.88 : sira ? 0.8 : 0.93)) continue;   // sade: yarıdan az; yola en yakın şerit boş
    const b = bolge(i), rad = sira === 2 ? 6 : sira ? 4 : 1.5, p = cvKenar(i + ((R() * 4) | 0), yan, sira === 2 ? YARI + 38 + R() * 42 : sira ? YARI + 14 + R() * 15 : YARI + 10 + R() * 3), x = p.x, z = p.z, ry = p.ry;
    if (yakin(x, z) < (sira === 2 ? YARI + 20 : sira ? YARI + 10 : YARI + 9.4) || !cvBos(x, z, rad)) continue; cvYasak.push([x, z, rad]);
    const r = R(), q = { x, z, ry }, s = sira === 2 ? 1.5 : 1, g = () => golge.push([x - 0.5, 0.014, z + 0.4, 4.4 * s, 1, 3.6 * s, -0.4]);
    if (sira === 0) {   // sade: ilk sırada yalnız yuvarlak ağaç, arada bank
      if (r < 0.85) agacEkle(x, z, 0.8 + R() * 0.4, b === 2 ? CICEKLI : YESILLER); else bank(x, z, ry);
    } else {
      const agacB = () => agacEkle(x, z, (1.2 + R() * 0.8) * s, b === 2 ? CICEKLI : YESILLER);
      if (b === 0) { if (r < 0.6) { ev(q, sec(PASTEL), r < 0.15 ? 0x4f8fe0 : CATI, (0.9 + R() * 0.25) * s); g(); } else if (r < 0.7) { apartman(q, 2, s); g(); } else agacB(); }
      else if (b === 1) { if (r < 0.6) { apartman(q, 2 + ((R() * (sira === 2 ? 3 : 2)) | 0), s); g(); } else if (r < 0.75) { ev(q, sec(PASTEL), CATI, s); g(); } else agacB(); }
      else if (b === 2) { if (r < 0.85) agacB(); else { ev(q, sec(PASTEL), CATI, s); g(); } }
      else if (b === 3) { if (r < 0.45) { cadir(x, z, (1.3 + R() * 0.8) * s, sec(BLOK)); g(); } else if (r < 0.7) { apartman(q, 2, s); g(); } else agacB(); }
      else { if (r < 0.4) { apartman(q, 2 + ((R() * 2) | 0), s); g(); } else if (r < 0.62) { ev(q, sec(PASTEL), CATI, s); g(); } else agacB(); }
    }
  }
  const shTon = (g, h) => { const p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { const k = 0.8 + 0.24 * Math.min(1, Math.max(0, p.getY(i) / h)); c.setXYZ(i, Math.min(1, c.getX(i) * k), Math.min(1, c.getY(i) * k), Math.min(1, c.getZ(i) * k)); } return g; };   // ton geçişi: dipte koyu, yukarı doğru açık (düz karton boya yerine)
  { const m = new T.Mesh(shTon(S.geo(), 8), cvMalz(5)); m.frustumCulled = false; scene.add(m); }
  if (agac.length) {   // lolipop gibi yuvarlak ağaçlar (rüzgârda hafif salınır)
    const B = cvYapi(); B.ekle(cvG.sil5, 0, 1.2, 0, 0.17, 2.4, 0.17, KAHVE); B.ekle(cvG.ico, 0, 3.5, 0, 1.6, 1.6, 1.6, BEYAZ, 0, 0, 0, 1); B.ekle(cvG.kureK, -0.5, 4.3, 0.7, 0.5, 0.36, 0.5, 0xf2ffe0, 0, 0, 0, 1);
    cok(B.geo(), cvMalz(1), agac);
  }

  {   // dev oyuncak ayı (yakında bir tane oturur; ikisi ufukta tepelerin ardından bakar)
    const A = cvYapi(), K = new T.SphereGeometry(1, 14, 10), GOZ = 0x2a2420, IC = 0xfff0d8;
    A.ekle(K, 0, 1.25, 0, 1.05, 1.2, 0.95, BEYAZ, 0, 0, 0, 1); A.ekle(K, 0, 1.2, 0.42, 0.72, 0.85, 0.6, IC); A.ekle(K, 0, 2.75, 0.1, 0.92, 0.85, 0.85, BEYAZ, 0, 0, 0, 1); A.ekle(K, 0, 2.55, 0.78, 0.42, 0.32, 0.3, IC);
    A.ekle(cvG.kureK, 0, 2.66, 1.05, 0.13, 0.1, 0.08, GOZ); A.ekle(cvG.kutu, 0, 2.44, 1.06, 0.2, 0.045, 0.05, GOZ);
    for (const sx of [-1, 1]) {
      A.ekle(cvG.kureK, sx * 0.34, 2.95, 0.84, 0.09, 0.115, 0.06, GOZ); A.ekle(cvG.kureK, sx * 0.31, 2.99, 0.895, 0.03, 0.035, 0.02, BEYAZ); A.ekle(cvG.kureK, sx * 0.6, 2.62, 0.7, 0.15, 0.1, 0.06, PEMBE); A.ekle(cvG.kutu, sx * 0.14, 2.47, 1.05, 0.12, 0.045, 0.05, GOZ, 0, 0, sx * 0.6);
      A.ekle(K, sx * 0.68, 3.42, 0, 0.3, 0.3, 0.16, BEYAZ, 0, 0, 0, 1); A.ekle(cvG.kureK, sx * 0.68, 3.42, 0.1, 0.17, 0.17, 0.1, IC);
      A.ekle(K, sx * 0.62, 0.4, 0.85, 0.4, 0.38, 0.75, BEYAZ, 0, 0, 0, 1); A.ekle(cvG.sil, sx * 0.62, 0.42, 1.59, 0.26, 0.04, 0.26, IC, PI / 2);
      A.ekle(cvG.ucgen, sx * 0.26, 2.02, 0.8, 0.2, 0.36, 0.1, KIRMIZI, 0, 0, sx * PI / 2);
    }
    A.ekle(cvG.kureK, 0, 2.02, 0.84, 0.1, 0.1, 0.08, SARI);
    A.ekle(K, -1.05, 1.5, 0.3, 0.3, 0.62, 0.3, BEYAZ, 0, 0, -0.5, 1); A.ekle(K, 1.12, 2.0, 0.25, 0.3, 0.62, 0.3, BEYAZ, 0, 0, -0.95, 1);
    for (const [a, c, k] of [[1.15, 0xc98a52, 24], [4.25, 0xe7b98a, 20]]) { const r = 452, x = Math.cos(a) * r, z = -70 + Math.sin(a) * r; shAyi.push([x, -14, z, k, k, k, Math.atan2(-x, -70 - z), c]); }
    cok(A.geo(), cvMalz(0), shAyi);
  }
  if (shGul.length) {   // rüzgâr gülü: beyaz çubuk + dönen dört kanat (dönüş gölgelendiricide)
    const don = cvHAREKET.length;
    cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.9;\n#else\nfloat cvF = 0.0;\n#endif\nfloat cvA = (cvT * 2.2 + cvF) * cvK.z; float cvC = cos(cvA), cvS = sin(cvA); vec2 cvQ = transformed.xy - vec2(0.0, 2.6);\ntransformed.xy = vec2(cvQ.x * cvC - cvQ.y * cvS, cvQ.x * cvS + cvQ.y * cvC) + vec2(0.0, 2.6);');
    const W = cvYapi();
    W.ekle(cvG.sil5, 0, 1.3, 0, 0.07, 2.6, 0.07, BEYAZ); W.ekle(cvG.sil, 0, 0.08, 0, 0.3, 0.16, 0.3, BEYAZ, 0, 0, 0, 1); W.ekle(cvG.kureK, 0, 2.6, 0.16, 0.16, 0.16, 0.12, SARI, 0, 0, 0, 0, 0, 1);
    for (let k = 0; k < 4; k++) { const a = k * PI / 2; W.ekle(cvG.ucgen, Math.cos(a) * 0.4 - Math.sin(a) * 0.16, 2.6 + Math.sin(a) * 0.4 + Math.cos(a) * 0.16, 0.1, 0.36, 0.9, 0.06, k % 2 ? BEYAZ : 0xffffff, 0, 0, a - PI / 2 + 0.38, k % 2 ? 0 : 1, 0, 1); }
    cok(W.geo(), cvMalz(don), shGul);
  }
  {   // elden kaçmış balonlar: gökte ağır ağır süzülür
    const suz = cvHAREKET.length, B = cvYapi(), l = [];
    cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.27;\ntransformed.y += sin(cvT * 0.7 + cvF) * 0.6; transformed.x += sin(cvT * 0.4 + cvF * 1.7) * 0.4;\n#endif');
    B.ekle(new T.SphereGeometry(1, 10, 8), 0, 0, 0, 0.8, 1, 0.8, BEYAZ, 0, 0, 0, 1); B.ekle(cvG.koni6, 0, -1.05, 0, 0.14, 0.2, 0.14, BEYAZ, 0, 0, 0, 1); B.ekle(cvG.kutu, 0, -2.1, 0, 0.03, 2, 0.03, BEYAZ); B.ekle(cvG.kureK, -0.3, 0.42, 0.52, 0.16, 0.24, 0.1, BEYAZ);
    for (let k = 0; k < 4; k++) { const q = cvKenar((Rs() * N) | 0, k % 2 ? 1 : -1, YARI + 20 + Rs() * 40), u = 1 + Rs() * 0.7; l.push([q.x, 13 + Rs() * 24, q.z, u, u, u, Rs() * 6, BLOK[k % 6]]); }
    cok(B.geo(), cvMalz(suz), l);
  }
  {   // ufukta oyuncak kutusundan çıkmış gibi: dev küp piramitleri, çizgili toplar, boya kalemleri (tek çizim)
    const U = cvYapi(), K = new T.SphereGeometry(1, 16, 10), koy = (a, r, s) => { const x = Math.cos(a) * r, z = -70 + Math.sin(a) * r; U.yer(x, z, Math.atan2(-x, -70 - z), s); };
    [0.35, 4.45].forEach((a, n) => { koy(a, 262, 1); let c = n; for (let kat = 0; kat < 3; kat++) for (let j = 0; j < 3 - kat; j++) { const x = (j - (2 - kat) / 2) * 11.4, y = 5.5 + kat * 11; U.ekle(cvG.kutu, x, y, 0, 11, 11, 11, BLOK[c % 6]); U.ekle(cvG.kutu, x, y, 5.55, 8.2, 8.2, 0.4, KREM); c += 2; } });   // dik duran, orta boy küp piramidi
    [[1.5, KIRMIZI, MAVI], [3.45, MAVI, SARI]].forEach(e => { koy(e[0], 250, 1); U.ekle(K, 0, 13, 0, 14, 14, 14, e[1]); U.ekle(K, 0, 13, 0, 14.25, 5.2, 14.25, BEYAZ); U.ekle(K, 0, 13, 0, 14.45, 1.9, 14.45, e[2]); });
    [1.95].forEach((a, n) => { koy(a, 275, 1); for (let k = 0; k < 3; k++) { const x = (k - 1) * 11, h = 44 + ((k + n) % 3) * 9, c = BLOK[(k * 2 + n * 3 + 1) % 6]; U.ekle(cvG.sil, x, h / 2, 0, 4, h, 4, c, 0, 0, (k - 1) * 0.06); U.ekle(cvG.sil, x - (k - 1) * h * 0.03, h * 0.5 + h / 2 - 1.5, 0, 4.1, 3, 4.1, KREM, 0, 0, (k - 1) * 0.06); U.ekle(cvG.koni, x - (k - 1) * h * 0.034, h + 4, 0, 4, 9, 4, 0xf0d2a4, 0, 0, (k - 1) * 0.06); U.ekle(cvG.koni, x - (k - 1) * h * 0.037, h + 7, 0, 1.4, 3.2, 1.4, c, 0, 0, (k - 1) * 0.06); } });
    const m = new T.Mesh(U.geo(), cvMalz(0)); m.frustumCulled = false; scene.add(m);
  }

  // ───────── uzak manzara: renkli blok kuleler, yeşil tepeler, pamuk bulutlar, zeplin ve uçak ─────────
  {
    const B = cvYapi(), kule = [];
    B.ekle(shKutu, 0, 0.5, 0, 1, 1, 1, BEYAZ, 0, 0, 0, 1); B.ekle(cvG.kutu, 0, 0.99, 0, 1.04, 0.03, 1.04, 0xc8c0b0); B.ekle(shCati, 0, 1.0, 0, 0.215, 0.3, 0.25, CATI);   // tombul gövde + kalın saçaklı çatı (karton kutu değil)
    for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) B.ekle(shDaire, (j - 0.5) * 0.44, 0.22 + k * 0.28, 0.505, 0.1, 0.07, 1, KREM);
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + R() * 0.15, r = 290 + R() * 90, w = 20 + R() * 16, x = Math.cos(a) * r, z = -70 + Math.sin(a) * r; kule.push([x, 0, z, w, w * (0.9 + R() * 1.0), w, Math.atan2(-x, -70 - z), sec([0xff9a8a, 0xffd86a, 0x8ac0f5, 0xf3e6cc])]); }
    cok(B.geo(), cvMalz(0), kule);
    const H = cvYapi(), tepe = []; H.ekle(cvG.yarim, 0, 0, 0, 1, 1, 1, BEYAZ, 0, 0, 0, 1);
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + R() * 0.2, r = 430 + R() * 80, w = 70 + R() * 50; tepe.push([Math.cos(a) * r, -2, -70 + Math.sin(a) * r, w, w * (0.4 + R() * 0.2), w, R() * 6, sec([0x7fd070, 0x93da7c, 0x6cc468])]); }
    cok(H.geo(), cvMalz(0), tepe);
    const C = cvYapi(), bulut = [];
    C.ekle(cvG.ico, 0, 0, 0, 13, 8, 10, BEYAZ); C.ekle(cvG.ico, -12, -1.5, 1, 9, 5.6, 8, BEYAZ); C.ekle(cvG.ico, 12, -1, -1, 10, 6.2, 8, BEYAZ); C.ekle(cvG.ico, 5, 3.5, 2, 8, 5.5, 7, BEYAZ); C.ekle(cvG.kure, -21, -3, 0, 6, 3.4, 5.5, BEYAZ); C.ekle(cvG.kure, 21.5, -3, 0, 6, 3.4, 5.5, BEYAZ);
    const g = C.geo(), p = g.attributes.position, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) { const y = Math.max(p.getY(i), -3.6); p.setY(i, y); const t = clamp((y + 3.6) / 9, 0, 1); c.setXYZ(i, lerp(0.8, 1, t), lerp(0.88, 1, t), lerp(0.97, 1, t)); }
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + R() * 0.4, r = 130 + R() * 320, s = 0.9 + R() * 1.1; bulut.push([Math.cos(a) * r, 95 + R() * 60, Math.sin(a) * r, s, s * 0.9, s, R() * 6]); }
    shBulut = cok(g, new T.MeshBasicMaterial({ vertexColors: true, fog: false }), bulut); shBulut.position.set(0, 0, -70);
    // zeplin + pervaneli uçak (tek ağ, yavaşça döner)
    const Z = cvYapi(); let a = 0.6, r = 150;
    Z.yer(Math.cos(a) * r, Math.sin(a) * r, -a, 1.5);
    Z.ekle(cvG.kure, 0, 62, 0, 4.6, 4.6, 12, KIRMIZI); Z.ekle(cvG.kure, 0, 62, 0, 4.75, 4.75, 5, BEYAZ); Z.ekle(cvG.kure, 0, 62, 0, 4.85, 4.85, 1.8, SARI); Z.ekle(cvG.kutu, 0, 57, 0.5, 2, 1.6, 5, MAVI); for (const k of [-1, 0, 1]) for (const sx of [-1, 1]) Z.ekle(cvG.sil, sx * 1.02, 57.2, 0.5 + k * 1.4, 0.45, 0.06, 0.45, CAM, 0, 0, PI / 2);
    Z.ekle(cvG.kutu, 0, 62, -10, 0.3, 7, 3.4, SARI); Z.ekle(cvG.kutu, 0, 62, -10, 7, 0.3, 3.4, SARI);
    a = 3.4; r = 105; Z.yer(Math.cos(a) * r, Math.sin(a) * r, -a, 1.6);
    Z.ekle(cvG.kure, 0, 44, 0, 1.3, 1.3, 4.6, SARI); Z.ekle(cvG.kutu, 0, 44.2, 0.8, 11, 0.24, 2.2, KIRMIZI); Z.ekle(cvG.kutu, 0, 44.4, -3.8, 4.2, 0.2, 1.2, KIRMIZI); Z.ekle(cvG.kutu, 0, 45.3, -3.9, 0.2, 2, 1.2, KIRMIZI); Z.ekle(cvG.kure, 0, 45, 1.2, 0.9, 0.7, 1.2, CAM); Z.ekle(cvG.kureK, 0, 44, 4.6, 0.4, 0.4, 0.5, KIRMIZI); Z.ekle(cvG.kutu, 0, 44, 4.8, 3.6, 0.3, 0.08, KOYU, 0, 0, 0.6);
    for (let k = 1; k < 7; k++) Z.ekle(cvG.kutu, 0, 44 - Math.sin(k) * 0.4, -5.2 - k * 1.5, 0.06, 1.2, 1.2, BLOK[k % 6], PI / 4, 0, 0, 0, 1);
    shHava = new T.Mesh(Z.geo(), cvMalz(5)); shHava.position.set(0, 0, -70); shHava.frustumCulled = false; scene.add(shHava);
  }

  if (shIsik.length) {   // trafik ışıkları: yeşil → sarı → kırmızı; sönük lamba kutunun içine çekilir
    const yan = cvHAREKET.length, B = cvYapi();
    cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvKk = floor((4.83 - instanceMatrix[3].y) / 0.575 + 0.5); float cvOn = 1.0 - step(0.5, abs(2.0 - mod(floor(cvT * 0.55), 3.0) - cvKk));\ntransformed *= 0.55 + 0.65 * cvOn; transformed.z -= (1.0 - cvOn) * 0.9;\n#endif');
    B.ekle(cvG.kureK, 0, 0, 0, 1, 1, 1, BEYAZ, 0, 0, 0, 1);
    cok(B.geo(), cvMalz(yan, { emissive: 0x9a9a9a }), shIsik);
  }
  // ───────── temas gölgeleri (tek çizim) ─────────
  {
    const d = tuvalDoku(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(40,70,60,.28)'); r.addColorStop(0.45, 'rgba(40,70,60,.14)'); r.addColorStop(1, 'rgba(40,70,60,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    const g = new T.PlaneGeometry(2, 2); g.rotateX(-PI / 2); const sh = cok(g, new T.MeshBasicMaterial({ map: d, transparent: true, depthWrite: false }), golge); sh.renderOrder = 1;
  }
}
