/* Dinozor Vadisi pistinin çevresi (yalnız ?pist=dino iken yüklenir, cevre.js'ten sonra).
   cevre.js ortak tabanı kurar (gök dokusu scene.background, sis scene.fog, ışıklar cvGokIsik + gunes, zemin `zemin` + `cimDoku`, güneş `cvGunes`);
   bu dosya onları kendi temasına göre değiştirir ve süslerini ekler. cevreEkGuncelle(dt, t) her karede çağrılır.
   Yeni üst düzey adlar `dn` ile başlar. Bütün yerler yol verisinden (PX/PZ/TX/TZ, cvKenar) hesaplanır; elle koordinat yok.
   Hareket gölgelendiricide (boyun/kuyruk/eğrelti salınımı, seyirci zıplaması, kanat); kare başına yalnız duman (9 kopya), şelale dokusu ve uçan sürü dönüşü. */
'use strict';

const dnBolge = i => { const f = (((i % N) + N) % N) / N; return f < 0.06 || f > 0.94 ? 0 : f < 0.24 ? 1 : f < 0.42 ? 2 : f < 0.6 ? 3 : f < 0.78 ? 4 : 5; };   // 0 taş köy · 1 eğrelti ormanı · 2 yuva vadisi · 3 göl ve şelale · 4 mantar çayırı · 5 yanardağ eteği
let dnDuman = null, dnSuDoku = null, dnUcan = null;
const dnTepe = { x: 0, y: 0, z: 0 };
if (cvTema === 'dino') {
  scene.fog.color.set(0xe2f6e4); scene.fog.near = 340; scene.fog.far = 980;
  gunes.color.set(0xfff0c8);
  { // gök: yukarıda masmavi, ufka doğru açık yeşil-krem sıcak pus
    const c = scene.background.image, g = c.getContext('2d'), h = c.height, gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#2f8fe6'); gr.addColorStop(0.26, '#63b4f2'); gr.addColorStop(0.42, '#a9dcf6'); gr.addColorStop(0.5, '#dff4e0'); gr.addColorStop(0.56, '#fff4cf'); gr.addColorStop(0.7, '#fff7df'); gr.addColorStop(1, '#fff7df');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, h); scene.background.needsUpdate = true;
  }
  let dnT = 48151; const Rd = () => { dnT = (dnT * 1664525 + 1013904223) >>> 0; return dnT / 4294967296; };   // yeni süslerin kendi sayı üreteci: eski yerleşimi kaydırmaz
  { // zemin: yosunlu tarih öncesi eğrelti çayırı ve ince kehribar/volkanik toprak dokunuşları (dikişsiz)
    const c = cimDoku.image, g = c.getContext('2d'), w = c.width, h = c.height;
    g.globalAlpha = 0.34; g.fillStyle = '#69bf4c'; g.fillRect(0, 0, w, h);   // ince benekler sakinleşir, çim tek tonda boğulmaz
    for (let i = 0; i < 26; i++) { const x = R() * w, y = R() * h, r = 16 + R() * 30; g.globalAlpha = 1; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r * 1.3); gr.addColorStop(0, i % 3 ? 'rgba(63,154,58,.16)' : 'rgba(217,194,122,.14)'); gr.addColorStop(1, 'rgba(63,154,58,0)'); g.fillStyle = gr; g.fillRect(x + ox - r * 1.3, y + oy - r * 1.3, r * 2.6, r * 2.6); } }
    for (let i = 0; i < 28; i++) {   // yosunlu eğrelti çayırı derinliği: zümrüt yosun, parlak filiz ve ince kehribar toprak
      const x = Rd() * w, y = Rd() * h, r = 24 + Rd() * 44, tur = i % 5;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        if (x + ox < -r || x + ox > w + r || y + oy < -r || y + oy > h + r) continue;
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        gr.addColorStop(0, tur === 0 ? 'rgba(42,138,54,.22)' : tur === 1 ? 'rgba(164,226,94,.18)' : tur === 4 ? 'rgba(224,148,60,.13)' : 'rgba(84,186,68,.18)');
        gr.addColorStop(0.65, tur === 4 ? 'rgba(202,126,52,.05)' : 'rgba(72,168,62,.07)');
        gr.addColorStop(1, 'rgba(90,180,70,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill();
      }
    }
    g.lineCap = 'round';
    for (let i = 0; i < 36; i++) {   // narin eğrelti yaprağı izleri ve yosun kümeleri
      const x = Rd() * w, y = Rd() * h, a = Rd() * 6.2832, boy = 12 + Rd() * 14, ca = Math.cos(a), sa = Math.sin(a);
      g.strokeStyle = i % 2 ? 'rgba(46,142,56,.24)' : 'rgba(148,220,92,.22)'; g.lineWidth = 1.6;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        if (x + ox < -24 || x + ox > w + 24 || y + oy < -24 || y + oy > h + 24) continue;
        const bx = x + ox, by = y + oy;
        g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + ca * boy, by + sa * boy); g.stroke();
        for (let k = 1; k <= 4; k++) { const u = k / 5, px = bx + ca * boy * u, py = by + sa * boy * u, wj = (1 - u * 0.5) * 4.2; g.beginPath(); g.moveTo(px - sa * wj, py + ca * wj); g.lineTo(px + sa * wj, py - ca * wj); g.stroke(); }
      }
    }
    for (let i = 0; i < 45; i++) {   // minik kehribar çakılları ve sıcak fosil parıltıları
      const x = Rd() * w, y = Rd() * h, r = 1.0 + Rd() * 1.4;
      g.globalAlpha = i % 3 ? 0.42 : 0.62; g.fillStyle = i % 3 === 0 ? '#ffd778' : i % 3 === 1 ? '#e89b44' : '#b8683a';
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { if (x + ox < -3 || x + ox > w + 3 || y + oy < -3 || y + oy > h + 3) continue; g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1; cimDoku.needsUpdate = true;
    // geniş ton geçişi: yol kenarında ılık toprak-yeşili, uzakta serin, derin yeşil + çayır dalgası (köşe renkleri; ek çizim yok)
    const p = zemin.geometry.attributes.position, col = zemin.geometry.attributes.color;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = -p.getY(i) - 70, d = yakin(x, z), u = clamp((d - YARI - 4) / 34, 0, 1), y = clamp((d - 60) / 260, 0, 1);
      const v = 0.96 + 0.05 * Math.sin(x * 0.019 + z * 0.023), yosun = 0.5 + 0.5 * Math.sin(x * 0.024 - 0.6) * Math.cos(z * 0.021 + 0.4);
      col.setXYZ(i, lerp(lerp(1.06, 0.93 + 0.05 * yosun, u), 0.89, y) * v, lerp(lerp(0.98, 0.99 + 0.03 * yosun, u), 0.98, y) * v, lerp(lerp(0.80, 0.88, u), 0.96, y) * v);
    }
    col.needsUpdate = true;
  }

  // ───────── ortak parçalar ─────────
  const dnTon = (g, h) => {   // yükseklik ve normal kontrastı: dipte serin orman gölgesi, üstte sıcak gün ışığı
    const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) {
      const k = 0.80 + 0.23 * Math.min(1, Math.max(0, p.getY(i) / h)), ust = n ? clamp(n.getY(i) * 0.5 + 0.5, 0, 1) : 0.5;
      c.setXYZ(i, Math.min(1, c.getX(i) * k * lerp(0.90, 1.03, ust)), Math.min(1, c.getY(i) * k * lerp(0.93, 1.02, ust)), Math.min(1, c.getZ(i) * k * lerp(0.94, 0.95, ust)));
    }
    c.needsUpdate = true; return g;
  };
  function dnCila(m, par, kenar) {   // yumuşak yüzey parlaklığı ve tropik kenar ışıması (ek ışık / çizim yok)
    const o = m.onBeforeCompile, ok = m.customProgramCacheKey.call(m);
    m.onBeforeCompile = (sh, r) => {
      if (o) o.call(m, sh, r);
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ vec3 cV = normalize(vViewPosition); float cN = clamp(dot(normal, cV), 0.0, 1.0); vec3 cH = normalize(normalize(vec3(-0.35, 0.8, 0.5)) + cV);'
        + ' float cS = pow(clamp(dot(normal, cH), 0.0, 1.0), 28.0); totalEmissiveRadiance += vec3(cS * ' + par.toFixed(3) + ') + diffuseColor.rgb * vec3(1.0, 0.95, 0.84) * pow(1.0 - cN, 2.5) * ' + kenar.toFixed(3) + '; }');
    };
    m.customProgramCacheKey = () => ok + '|dnCila' + par + '_' + kenar;
    return m;
  }
  const S = cvYapi(), PI = Math.PI;
  const s = (g, x, y, z, sx, sy, sz, c, rx, ry, rz, kz, ke) => S.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz, 0, kz || 0, ke || 0);
  const dnSal = cvHAREKET.length;   // yumuşak salınım: cvK.z = yana, cvK.y = yukarı aşağı (boyun, kuyruk, yaprak, yavru başı)
  cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.53;\n#else\nfloat cvF = position.x * 0.21 + position.z * 0.17;\n#endif\ntransformed.x += sin(cvT * 1.25 + cvF) * cvK.z; transformed.y += sin(cvT * 1.6 + cvF * 1.3) * cvK.y;');
  const dnDuvar = (() => { const g = new T.CylinderGeometry(1, 1, 1, 20, 3), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = 1 + 0.06 * (1 - 4 * y * y) - 0.04 * (y + 0.5); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.computeVertexNormals(); g.userData.cvTon = true; return g; })();   // taş ev duvarı: bombeli, yuvarlak
  const dnBacak = new T.CylinderGeometry(1, 1, 1, 8, 1, true);   // dinozor bacağı: beş köşeli değil, yuvarlak
  const dnCati = new T.ConeGeometry(1, 1, 16, 2), dnKoni = new T.CylinderGeometry(0.72, 1, 1, 16, 1, true), dnSil = new T.CylinderGeometry(1, 1, 1, 7, 1, true);
  const GOZ = 0x2a2030, BEYAZ = 0xffffff, KREM = 0xfff3d0, YANAK = 0xff9fb5, AHSAP = 0xb9824c, KOYU = 0x8f5c34, SU = 0x3fb6e8;
  const TAS = [0xb9b3a6, 0xcbc4b4, 0xa7a196, 0xd8d0be], TAS_VOL = [0xb9b3a6, 0xc99668, 0xa7a196, 0xd8a868], YESIL = [0x4fb85a, 0x5ec766, 0x42a650, 0x6fcf5e, 0x3f9f58], PASTEL = [0x7fd08a, 0xffa25e, 0x7cc4f0, 0xf59ac0, 0xc9a6f0, 0xffd166];
  const golge = [], egrelti = [], palmiye = [], mantar = [], cicek = [], kaya = [], tepe = [], bronto = [], stego = [], tri = [];
  const sRex = [], sBronto = [], sTri = [], sStego = [];
  const yerBul = (f, yan, uz, r, donuk) => {
    for (let k = 0; k < 13; k++) {
      const i = cvI(f + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.006), p = cvKenar(i, yan, uz, donuk === undefined ? 0.25 : donuk), x = p.x, z = p.z, ry = p.ry;
      if (yakin(x, z) > YARI + 3.4 + r && cvBos(x, z, r)) { cvYasak.push([x, z, r + 1]); golge.push([x - 0.5, 0.012, z + 0.4, r * 0.95, 1, r * 0.7, -0.4]); return { x, z, ry, i }; }
    }
    return null;
  };
  // iri göz, gülümseme ve pembe yanak: bütün dinozorlar aynı sevimli yüzü taşır (diş yok)
  const yuz = (e, x, y, z, r, kz, ke, aw) => {
    for (const q of [-1, 1]) {
      e(cvG.kureK, q * x, y, z, r, r * 1.12, r * 0.7, BEYAZ, 0, 0, 0, 0, kz, ke); e(cvG.kureK, q * x, y, z + r * 0.5, r * 0.56, r * 0.66, r * 0.4, GOZ, 0, 0, 0, 0, kz, ke);
      e(cvG.okt, q * x + r * 0.16, y + r * 0.26, z + r * 0.86, r * 0.27, r * 0.27, r * 0.14, BEYAZ, 0, 0, 0, 0, kz, ke); e(cvG.okt, q * x - r * 0.18, y - r * 0.2, z + r * 0.84, r * 0.12, r * 0.12, r * 0.08, BEYAZ, 0, 0, 0, 0, kz, ke);
      e(cvG.okt, q * (x + r * 0.9), y - r * 1.5, z + r * 0.35, r * 0.62, r * 0.36, r * 0.3, YANAK, 0, 0, 0, 0, kz, ke);
      e(cvG.kutu, q * aw * 0.55, y - r * 1.72, z + r * 1.52, aw * 0.34, r * 0.24, r * 0.2, GOZ, 0, 0, q * 0.75, 0, kz, ke);
    }
    e(cvG.kutu, 0, y - r * 1.9, z + r * 1.55, aw * 0.9, r * 0.24, r * 0.2, GOZ, 0, 0, 0, 0, kz, ke);
  };
  // benek: gövdeye gömülü küçük küre, kopya renginin koyu tonu (köşe rengi gri × kopya rengi)
  const BENEK = 0xa8a8a8;
  const benek = (e, cx, cy, cz, rx, ry, rz, n, r, h) => { for (let k = 0; k < n; k++) { const a = (k / n) * 6.2832 + 0.7, el = 0.35 + (k % 3) * 0.28, sx = Math.cos(a) * Math.cos(el), sy = Math.sin(el), sz = Math.sin(a) * Math.cos(el) * 0.85; e(cvG.okt, cx + sx * (rx - r * 0.12), cy + sy * (ry - r * 0.12), cz + sz * (rz - r * 0.12), r, r * 0.5, r, BENEK, 0, a, 0, 1, h, 0); } };
  const tirnak = (e, x, z, r, h) => { e(cvG.okt, x, 0.08, z + r * 0.85, r * 0.75, r * 0.22, r * 0.3, KREM, 0, 0, 0, 0, h, 0); };
  // uzun boyunlu: h = zıplama payı (seyirci yavru 1), sw = salınım (yetişkin), wg = kuyruk sallama, nb = boyun boyu, hs = baş büyüklüğü
  const brontoKur = (e, h, sw, wg, nb, hs) => {
    for (const x of [-0.62, 0.62]) for (const z of [-0.95, 0.95]) e(dnBacak, x, 0.8, z, 0.36, 1.6, 0.36, BEYAZ, 0, 0, 0, 1, h, 0);
    e(cvG.kure, 0, 2.15, 0, 1.15, 1.0, 1.85, BEYAZ, 0, 0, 0, 1, h, 0); e(cvG.kureK, 0, 1.9, 0.12, 0.98, 0.8, 1.62, KREM, 0, 0, 0, 0, h, 0);
    benek(e, 0, 2.15, 0, 1.15, 1.0, 1.85, 9, 0.3, h); for (const x of [-0.62, 0.62]) for (const z of [-0.95, 0.95]) tirnak(e, x, z, 0.36, h);
    for (let k = 0; k < 5; k++) e(cvG.okt, (k % 2 - 0.5) * 0.95, 2.98 - Math.abs(k - 2) * 0.1, -1 + k * 0.5, 0.24, 0.1, 0.24, 0xfff3a0, 0, 0, 0, 0, h, 0);
    for (let k = 0; k <= 8; k++) { const u = k / 8, r = (0.64 - 0.27 * u) * (hs > 1.5 ? 1.2 : 1); e(cvG.kureK, 0, 2.7 + u * 3.6 * nb, 1.4 + u * 1.5 * nb, r, 0.6, r, BEYAZ, 0.35, 0, 0, 1, h + sw * 0.25 * u, sw * u); }
    const hy = 2.7 + 3.6 * nb + 0.32 * hs, hz = 1.4 + 1.5 * nb + 0.3 * hs, kz = h + sw * 0.25, ke = sw;
    e(cvG.kure, 0, hy, hz, 0.5 * hs, 0.44 * hs, 0.6 * hs, BEYAZ, 0, 0, 0, 1, kz, ke); e(cvG.kureK, 0, hy - 0.1 * hs, hz + 0.45 * hs, 0.4 * hs, 0.32 * hs, 0.42 * hs, BEYAZ, 0, 0, 0, 1, kz, ke);
    yuz(e, 0.3 * hs, hy + 0.16 * hs, hz + 0.34 * hs, 0.15 * hs, kz, ke, 0.3 * hs);
    if (sw) e(cvG.okt, 0.16, hy - 0.3 * hs, hz + 0.86 * hs, 0.3, 0.05, 0.16, 0x5ec766, 0, 0.5, 0, 0, kz, ke);
    for (let k = 0; k <= 5; k++) { const u = k / 5, r = 0.62 - 0.47 * u; e(cvG.ufak, 0, 2.1 - u * 1.5, -1.6 - u * 2.6, r, r, 0.7, BEYAZ, 0, 0, 0, 1, h, -sw * u * u * 1.1 + (wg && u > 0.4 ? 1 : 0)); }
  };
  // sırtı plakalı
  const stegoKur = (e, h, sw, wg, hs) => {
    for (const x of [-0.55, 0.55]) for (const z of [-0.8, 0.8]) e(dnBacak, x, 0.5, z, 0.32, 1.0, 0.32, BEYAZ, 0, 0, 0, 1, h, 0);
    e(cvG.kure, 0, 1.55, 0, 1.0, 0.95, 1.7, BEYAZ, 0, 0, 0, 1, h, 0); e(cvG.kureK, 0, 1.3, 0.1, 0.86, 0.72, 1.5, KREM, 0, 0, 0, 0, h, 0);
    e(cvG.ufak, 0, 1.35, 1.5, 0.52, 0.5, 0.6, BEYAZ, 0, 0, 0, 1, h, 0);
    benek(e, 0, 1.55, 0, 1.0, 0.95, 1.7, 8, 0.26, h); for (const x of [-0.55, 0.55]) for (const z of [-0.8, 0.8]) tirnak(e, x, z, 0.32, h);
    const hy = 1.2, hz = 1.95 + 0.2 * hs, sk = h + sw * 0.35, se = sw * 0.3; e(cvG.kure, 0, hy, hz, 0.5 * hs, 0.43 * hs, 0.56 * hs, BEYAZ, 0, 0, 0, 1, sk, se); e(cvG.kureK, 0, hy - 0.08 * hs, hz + 0.4 * hs, 0.38 * hs, 0.3 * hs, 0.36 * hs, BEYAZ, 0, 0, 0, 1, sk, se);
    yuz(e, 0.29 * hs, hy + 0.17 * hs, hz + 0.3 * hs, 0.15 * hs, sk, se, 0.28 * hs);
    for (let k = 0; k <= 4; k++) { const u = k / 4, r = 0.58 - 0.42 * u; e(cvG.ufak, 0, 1.5 - u * 0.75, -1.5 - u * 2.0, r, r, 0.62, BEYAZ, 0, 0, 0, 1, h, -sw * u * u + (wg && u > 0.4 ? 1 : 0)); }
    for (const x of [-1, 1]) for (const z of [-3.1, -3.45]) e(cvG.koni, x * 0.24, 0.92, z, 0.09, 0.42, 0.09, KREM, 0, 0, -x * 0.9, 0, h, -sw + (wg ? 1 : 0));
    for (let k = 0; k < 7; k++) { const a = Math.sin(k / 6 * PI), b = 0.3 + 0.28 * a; e(cvG.okt, 0, 2.25 + a * 0.28 + b * 0.55, -1.5 + k * 0.5, 0.1, b, b * 0.8, k % 2 ? 0xffc24a : 0xff8a4a, 0, 0, 0, 0, h, 0); }
  };
  // üç boynuzlu
  const triKur = (e, h, sw, wg, hs) => {
    for (const x of [-0.55, 0.55]) for (const z of [-0.7, 0.7]) e(dnBacak, x, 0.45, z, 0.32, 0.9, 0.32, BEYAZ, 0, 0, 0, 1, h, 0);
    e(cvG.kure, 0, 1.3, 0, 0.95, 0.9, 1.45, BEYAZ, 0, 0, 0, 1, h, 0); e(cvG.kureK, 0, 1.08, 0.1, 0.82, 0.7, 1.28, KREM, 0, 0, 0, 0, h, 0);
    benek(e, 0, 1.3, 0, 0.95, 0.9, 1.45, 7, 0.24, h); for (const x of [-0.55, 0.55]) for (const z of [-0.7, 0.7]) tirnak(e, x, z, 0.32, h);
    for (let k = 0; k <= 2; k++) { const u = k / 2; e(cvG.ufak, 0, 1.25 - u * 0.4, -1.3 - u * 0.75, 0.5 - 0.3 * u, 0.48 - 0.28 * u, 0.5, BEYAZ, 0, 0, 0, 1, h, -sw * u + (wg && u > 0.4 ? 1 : 0)); }
    const hy = 1.4, hz = 1.55 + 0.1 * hs, kz = h + sw * 0.12, ke = sw * 0.25;
    e(cvG.kure, 0, hy + 0.42 * hs, hz - 0.42 * hs, 1.02 * hs, 0.95 * hs, 0.22 * hs, BEYAZ, -0.35, 0, 0, 1, kz, ke); e(cvG.kureK, 0, hy + 0.4 * hs, hz - 0.33 * hs, 0.8 * hs, 0.74 * hs, 0.2 * hs, KREM, -0.35, 0, 0, 0, kz, ke);
    for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.62; e(cvG.okt, Math.sin(a) * 0.98 * hs, hy + 0.48 * hs + Math.cos(a) * 0.86 * hs, hz - 0.72 * hs + Math.cos(a) * 0.1, 0.13 * hs, 0.13 * hs, 0.1 * hs, 0xffd166, 0, 0, 0, 0, kz, ke); }
    e(cvG.kure, 0, hy, hz, 0.62 * hs, 0.58 * hs, 0.7 * hs, BEYAZ, 0, 0, 0, 1, kz, ke); e(cvG.kureK, 0, hy - 0.16 * hs, hz + 0.6 * hs, 0.32 * hs, 0.28 * hs, 0.32 * hs, KREM, 0, 0, 0, 0, kz, ke);
    for (const x of [-1, 1]) e(cvG.koni, x * 0.3 * hs, hy + 0.66 * hs, hz + 0.34 * hs, 0.1 * hs, 0.6 * hs, 0.1 * hs, KREM, 0.55, 0, -x * 0.2, 0, kz, ke);
    e(cvG.koni, 0, hy + 0.2 * hs, hz + 0.78 * hs, 0.1 * hs, 0.3 * hs, 0.1 * hs, KREM, 0.5, 0, 0, 0, kz, ke);
    yuz(e, 0.36 * hs, hy + 0.14 * hs, hz + 0.5 * hs, 0.14 * hs, kz, ke, 0.2 * hs);
  };
  // ayakta duran tombul yavru (el sallar, kuyruk sallar)
  const rexKur = e => {
    for (const x of [-1, 1]) { e(cvG.ufak, x * 0.22, 0.08, 0.14, 0.2, 0.1, 0.28, KREM, 0, 0, 0, 0, 1, 0); e(cvG.kureK, x * 0.22, 0.3, 0, 0.19, 0.3, 0.22, BEYAZ, 0, 0, 0, 1, 1, 0); }
    e(cvG.kure, 0, 0.78, 0, 0.46, 0.56, 0.43, BEYAZ, 0, 0, 0, 1, 1, 0); e(cvG.kureK, 0, 0.72, 0.15, 0.34, 0.42, 0.32, KREM, 0, 0, 0, 0, 1, 0);
    e(cvG.kure, 0, 1.52, 0.12, 0.47, 0.41, 0.46, BEYAZ, 0, 0, 0, 1, 1, 0); e(cvG.kureK, 0, 1.4, 0.48, 0.33, 0.25, 0.3, BEYAZ, 0, 0, 0, 1, 1, 0);
    yuz(e, 0.21, 1.64, 0.45, 0.13, 1, 0, 0.2);
    for (const q of [[1.96, -0.02], [1.74, -0.32], [1.2, -0.42], [0.86, -0.46]]) e(cvG.koni, 0, q[0], q[1], 0.08, 0.2, 0.13, 0xffd166, -0.6, 0, 0, 0, 1, 0);
    e(cvG.koni, 0, 0.42, -0.72, 0.25, 0.95, 0.25, BEYAZ, -1.75, 0, 0, 1, 1, 1);
    e(cvG.ufak, 0.46, 1.08, 0.1, 0.08, 0.24, 0.08, BEYAZ, 0, 0, -0.9, 1, 1, 1); e(cvG.ufak, -0.42, 0.88, 0.16, 0.08, 0.2, 0.08, BEYAZ, 0, 0, 0.5, 1, 1, 0);
  };

  // ───────── yapılar ─────────
  const tasEv = (p, b, c) => {
    S.yer(p.x, p.z, p.ry, b);
    s(dnDuvar, 0, 1.1, 0, 2.7, 2.2, 2.7, TAS[1]); for (let k = 0; k < 11; k++) { const a = k / 11 * 6.2832 + 0.28; if (Math.abs(Math.sin(a)) < 0.3 && Math.cos(a) > 0) continue; s(cvG.kureK, Math.sin(a) * 2.75, 0.45 + (k % 2) * 0.85, Math.cos(a) * 2.75, 0.7, 0.5, 0.4, TAS[k % 4], 0, a); }
    s(dnCati, 0, 3.25, 0, 3.4, 2.3, 3.4, 0xe3c26a); s(dnCati, 0, 4.0, 0, 2.2, 1.7, 2.2, 0xd2ad55); s(cvG.sil, 0, 2.2, 0, 3.0, 0.22, 3.0, 0xc9a44e); s(cvG.okt, 0.2, 5.1, 0, 0.6, 0.12, 0.3, c, 0, 0.4, 0.5); s(cvG.okt, -0.2, 5.05, 0, 0.6, 0.12, 0.3, c, 0, -0.5, -0.5);
    s(cvG.kutu, 0, 0.8, 2.6, 1.2, 1.6, 0.3, 0x5a4636); s(cvG.kureK, 0, 1.6, 2.6, 0.6, 0.6, 0.16, 0x5a4636); for (const x of [-1, 1]) { s(cvG.kureK, x * 0.85, 0.5, 2.75, 0.34, 0.5, 0.3, TAS[3]); s(cvG.kureK, x * 0.8, 1.45, 2.75, 0.32, 0.45, 0.3, TAS[0]); } s(cvG.kureK, 0, 2.15, 2.72, 0.75, 0.3, 0.3, TAS[3]);
    s(cvG.kureK, 1.75, 1.45, 2.02, 0.36, 0.36, 0.14, 0x5a4636, 0, 0.72);
    s(cvG.ufak, 3.4, 0.4, 1.6, 0.6, 0.45, 0.6, TAS[2]); s(cvG.sil, 3.4, 0.86, 1.6, 0.75, 0.14, 0.75, TAS[3]); s(cvG.kureK, 3.4, 1.12, 1.6, 0.28, 0.24, 0.28, 0xff8a4a); s(cvG.kureK, 3.0, 1.08, 1.75, 0.2, 0.18, 0.2, 0xffd166);
  };
  const kemer = (p, b, c0) => {
    S.yer(p.x, p.z, p.ry + PI / 2, b);
    for (let k = 0; k <= 12; k++) { const a = k / 12 * PI, r = 5; s(cvG.ico, Math.cos(a) * r, Math.sin(a) * r * 1.15 + 0.4, (k % 2) * 0.35 - 0.2, 1.75 + (k % 3) * 0.2, 1.75, 2.1, TAS[(k + c0) % 4], 0, k * 1.3); }
    s(cvG.ico, -5.6, 0.9, 0.6, 2.5, 1.9, 2.4, TAS[2]); s(cvG.ico, 5.7, 0.8, -0.5, 2.4, 1.7, 2.5, TAS[0]); s(cvG.ico, 7.6, 0.5, 0.8, 1.3, 1.0, 1.3, TAS[1]);
    s(cvG.tac, 0, 7.6, 0, 2.6, 0.6, 2.0, YESIL[1]); s(cvG.tac, -3.6, 5.9, 0.2, 1.5, 0.5, 1.6, YESIL[3]); s(cvG.tac, 4.2, 5.2, -0.2, 1.3, 0.45, 1.5, YESIL[0]);
    for (let k = 0; k < 4; k++) s(dnSil, -1.5 + k * 1.0, 5.6 - (k % 2) * 0.5, 1.2, 0.06, 1.6 + (k % 2), 0.06, YESIL[2], 0, 0, 0, 0, 0.12);
  };
  let ryY = 0;
  const yumurta = (lx, lz, k, c, catlak, yavru) => {
    const q = S.dunya(lx, lz), wx = q.x, wz = q.z, ry = ryY; return () => {
      S.yer(wx, wz, ry, k);
      s(cvG.kure, 0, 0.72, 0, 0.6, 0.78, 0.6, KREM); for (let j = 0; j < 5; j++) { const a = j * 1.9 + lx, y = 0.45 + (j % 3) * 0.3, r = 0.6 * Math.sqrt(Math.max(0.05, 1 - Math.pow((y - 0.72) / 0.78, 2))); s(cvG.okt, Math.sin(a) * r, y, Math.cos(a) * r, 0.13, 0.13, 0.13, c); }
      if (!catlak) return;
      for (let j = 0; j < 7; j++) { const a = j / 7 * 6.2832; s(cvG.koni, Math.sin(a) * 0.46, 1.36, Math.cos(a) * 0.46, 0.17, 0.34, 0.17, KREM, 0.25, a); }
      const E = (g, x, y, z, sx, sy, sz, cc, rx, ry2, rz, kt, kz, ke) => S.ekle(g, x, y, z, sx, sy, sz, cc === BEYAZ && kt ? yavru : cc, rx, ry2, rz, 0, kz, ke);
      E(cvG.kure, 0, 1.7, 0, 0.44, 0.4, 0.44, BEYAZ, 0, 0, 0, 1, 0.1, 0); E(cvG.kureK, 0, 1.6, 0.34, 0.3, 0.23, 0.27, BEYAZ, 0, 0, 0, 1, 0.1, 0); yuz(E, 0.2, 1.82, 0.3, 0.125, 0.1, 0, 0.18);
      s(cvG.yarimK, 0, 2.02, -0.05, 0.36, 0.3, 0.36, KREM, 0, 0, 0, 0.1);
    };
  };
  const yuva = (p, b, n, cat) => {
    S.yer(p.x, p.z, p.ry, b); ryY = p.ry;
    const is = []; for (let k = 0; k < n; k++) { const a = k / n * 6.2832 + 0.6, r = n > 1 ? 0.85 : 0; is.push(yumurta(Math.sin(a) * r, Math.cos(a) * r, b * (0.9 + (k % 3) * 0.12), PASTEL[(k + cat) % 6], (cat && k === 0) || (cat > 1 && k === 2), PASTEL[(k * 2 + cat) % 5])); }
    s(cvG.daire, 0, 0.03, 0, 2.3, 2.3, 1, 0xd9bd7a, -PI / 2);
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.2832; s(cvG.ufak, Math.sin(a) * 2.0, 0.28, Math.cos(a) * 2.0, 0.62, 0.34, 0.36, k % 2 ? AHSAP : 0xa06b3c, 0, a + 0.3); if (k % 3 === 0) s(cvG.okt, Math.sin(a) * 2.2, 0.5, Math.cos(a) * 2.2, 0.5, 0.06, 0.2, YESIL[k % 5], 0, a, 0.4); }
    for (const f of is) f();
  };
  const golcuk = (f, yan, uz, b, ana) => {
    const p = yerBul(f, yan, uz, 10 * b, 0); if (!p) return;
    S.yer(p.x, p.z, p.ry, b); golge.pop();
    s(cvG.daire, 0, 0.02, 0, 9.2, 7.2, 1, 0xdcc88e, -PI / 2); s(cvG.daire, 0, 0.035, 0, 8, 6, 1, SU, -PI / 2); s(cvG.daire, -1, 0.05, 0.4, 5, 3.4, 1, 0x74d4f4, -PI / 2); s(cvG.daire, 1.8, 0.06, -0.8, 1.5, 0.8, 1, 0xd5f4ff, -PI / 2);
    for (let k = 0; k < 16; k++) { const a = k * 2.4 + 0.5, x = Math.cos(a) * (7.6 + (k % 3) * 0.5), z = Math.sin(a) * (5.6 + (k % 3) * 0.5), hh = 1.5 + (k % 4) * 0.35; if (z > 2.5 && Math.abs(x) < 4) continue; s(cvG.koni, x, hh / 2, z, 0.09, hh, 0.09, k % 2 ? 0x7fbf55 : 0x5fa848, 0, 0, (k % 3 - 1) * 0.12, 0, 0.1); s(dnSil, x, hh * 0.9, z, 0.11, 0.42, 0.11, KOYU, 0, 0, 0, 0, 0.1); }
    for (let k = 0; k < 6; k++) { const a = k * 1.3 + 0.2; s(cvG.daire, Math.cos(a) * 4.6, 0.07, Math.sin(a) * 3.0 + 1, 0.55, 0.55, 1, 0x4fbf6b, -PI / 2); if (k % 2) s(cvG.petal, Math.cos(a) * 4.6, 0.1, Math.sin(a) * 3.0 + 1, 0.2, 0.16, 0.2, 0xff9fcc); }
    for (let k = 0; k < 7; k++) { const a = k * 1.9, q = S.dunya(Math.cos(a) * 9, Math.sin(a) * 7), qx = q.x, qz = q.z, r = 0.6 + (k % 3) * 0.3; if (yakin(qx, qz) > YARI + 4.5) kaya.push([qx, r * 0.3, qz, r, r * 0.7, r, k, TAS[k % 4]]); }
    if (!ana) return;
    for (let k = 0; k < 12; k++) { const j = (k / 5) | 0, x = (k % 5 - 2) * 2.5 + (j % 2) * 1.2 - (j === 2 ? 1.2 : 0); if (j === 2 && k % 5 > 1) continue; s(cvG.ico, x, 1.7 + j * 3.1, -7 - j * 0.5, 2.3, 2.1, 1.9, TAS[(k + j) % 4], 0, k * 1.1); }
    s(cvG.tac, -3.6, 9.3, -7.6, 3.0, 0.7, 2.2, YESIL[1]); s(cvG.tac, 4.0, 6.6, -7.4, 2.6, 0.6, 2.0, YESIL[3]); s(cvG.kureK, 0, 8.25, -6.2, 1.7, 0.45, 1.4, 0x74d4f4);
    for (let k = 0; k < 5; k++) s(cvG.ufak, (k - 2) * 0.8, 0.3, -4.5 + (k % 2) * 0.5, 0.75, 0.5, 0.7, BEYAZ, 0, k, 0, 0.14);
    dnSuDoku = tuvalDoku(64, 128, (g, w, h) => {
      g.fillStyle = '#58c4f2'; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 46; k++) { const x = R() * w, y = R() * h, l = 14 + R() * 40; g.fillStyle = k % 3 ? 'rgba(255,255,255,.55)' : 'rgba(190,236,255,.8)'; for (const oy of [-h, 0, h]) g.fillRect(x, y + oy, 2 + R() * 3, l); }
      for (let k = 0; k < 28; k++) { const x = Rd() * w, y = Rd() * h, l = 16 + Rd() * 34; g.fillStyle = k % 2 ? 'rgba(255,255,255,.68)' : 'rgba(122,232,248,.48)'; for (const oy of [-h, 0, h]) g.fillRect(x, y + oy, 1.5 + Rd() * 2.5, l); }
    }, true);
    const pl = new T.Mesh(new T.PlaneGeometry(3.3 * b, 8.3 * b), new T.MeshBasicMaterial({ map: dnSuDoku })), q = S.dunya(0, -4.95);
    pl.position.set(q.x, 4.15 * b, q.z); pl.rotation.order = 'YXZ'; pl.rotation.set(-0.12, p.ry, 0); scene.add(pl);
    const q2 = S.dunya(-2.6, 1.2); bronto.push([q2.x, -2.3, q2.z, 1.15, 1.15, 1.15, p.ry + 1.9, PASTEL[2]]);
  };
  const kopru = p => {
    S.yer(p.x, p.z, p.ry + PI / 2, 1.1);
    s(cvG.kutu, 0, 0.02, 0, 12.5, 0.03, 3.4, 0xdcc88e); s(cvG.kutu, 0, 0.035, 0, 12, 0.03, 2.5, SU); for (const x of [-6, 6]) { s(cvG.daire, x, 0.03, 0, 1.75, 1.75, 1, 0xdcc88e, -PI / 2); s(cvG.daire, x, 0.055, 0, 1.25, 1.25, 1, SU, -PI / 2); } s(cvG.kutu, 1, 0.05, 0.2, 7, 0.03, 0.9, 0x74d4f4);
    for (let k = -5; k <= 5; k++) s(cvG.kutu, 0, 0.95 - k * k * 0.032, k * 0.48, 2.3, 0.13, 0.44, k % 2 ? AHSAP : 0xcf9a5e, k * 0.065);
    for (const x of [-1.1, 1.1]) { for (const z of [-2.5, 0, 2.5]) { s(cvG.kutu, x, 0.9 - z * z * 0.03, z, 0.2, 1.7 + (z ? 0 : 0.5), 0.2, KOYU); s(cvG.kureK, x, 1.82 - z * z * 0.03 + (z ? 0 : 0.25), z, 0.17, 0.17, 0.17, 0xffd166); } for (const q of [-1, 1]) s(cvG.kutu, x, 1.48, q * 1.25, 0.1, 0.12, 2.6, AHSAP, q * 0.14); }
    for (let k = 0; k < 4; k++) s(cvG.ufak, (k % 2 ? 1 : -1) * (3.2 + k * 0.7), 0.25, (k < 2 ? 1 : -1) * 1.5, 0.6, 0.4, 0.5, TAS[k]);
  };

  // ───────── bölgeler ─────────
  let p;
  // 0 · taş köy
  if ((p = yerBul(0.03, 1, 15.5, 4.2))) tasEv(p, 1, YESIL[1]);
  if ((p = yerBul(0.985, -1, 15.5, 4.2))) tasEv(p, 1.05, YESIL[3]);
  if ((p = yerBul(0.96, 1, 16, 4.2))) tasEv(p, 0.95, YESIL[1]);
  // 1 · eğrelti ormanı
  if ((p = yerBul(0.15, 1, 21, 8))) kemer(p, 1.05, 0);
  // 2 · yuva vadisi
  if ((p = yerBul(0.3, 1, 17, 2.9))) yuva(p, 1.1, 3, 1);   // sade: tek yuva (+ büyük yumurta)
  if ((p = yerBul(0.335, -1, 24, 4))) yuva(p, 2.2, 1, 1);
  // 3 · göl ve şelale
  golcuk(0.5, 1, 26, 1.2, true); golcuk(0.56, -1, 23, 0.8, false);
  if ((p = yerBul(0.47, -1, 20.2, 7, 0))) kopru(p); else if ((p = yerBul(0.58, 1, 20.2, 7, 0))) kopru(p);
  // 4 · mantar çayırı
  if ((p = yerBul(0.74, 1, 21, 8))) kemer(p, 0.9, 2);
  if ((p = yerBul(0.7, 1, 17, 2.8))) yuva(p, 1, 3, 1);
  // 5 · yanardağ eteği
  if ((p = yerBul(0.88, -1, 15.5, 4.2))) tasEv(p, 1, YESIL[0]);
  { // sevimli yanardağ: uzakta, pistin dışında; tepesinde sıcak kehribar parıltısı ve pamuk gibi duman
    let ox = 0, oz = 0; for (let i = 0; i < N; i++) { ox += PX[i] / N; oz += PZ[i] / N; }
    let en = null; for (const f of [0.86, 0.82, 0.9, 0.76, 0.7, 0.3]) { for (const yan of [-1, 1]) { const q = cvKenar(cvI(f), yan, 150), d = yakin(q.x, q.z); if (d > 120 && (!en || d > en.d)) en = { x: q.x, z: q.z, d }; } if (en) break; }
    if (en) {
      cvYasak.push([en.x, en.z, 58]); S.yer(en.x, en.z, Math.atan2(ox - en.x, oz - en.z), 1);
      const Rr = y => y < 20 ? 50 - y * 0.7 : y < 40 ? 36 - (y - 20) * 0.504 : 25.9 - (y - 40) * 0.4, fz = (x, y) => Math.sqrt(Math.max(1, Rr(y) * Rr(y) - x * x));
      s(dnKoni, 0, 10, 0, 50, 20, 50, 0x86c96e); s(dnKoni, 0, 30, 0, 36, 20, 36, 0xc9a67c); s(dnKoni, 0, 49, 0, 25.9, 18, 25.9, 0xb98a64); s(cvG.sil, 0, 58.6, 0, 19.6, 2.6, 19.6, 0xe0bd96); s(cvG.sil, 0, 59.6, 0, 16, 1, 16, 0xf58434);
      for (let k = 0; k < 9; k++) { const a = k / 9 * 6.2832; s(cvG.tac, Math.sin(a) * 47, 2, Math.cos(a) * 47, 12, 7, 9, YESIL[k % 5], 0, a); s(cvG.kure, Math.sin(a + 0.3) * 19, 57.6, Math.cos(a + 0.3) * 19, 4.4, 2.6, 3, k % 2 ? 0xe0bd96 : 0xd48e62, 0, a); }
      for (const q of [-1, 1]) { s(cvG.kure, q * 8.5, 37, fz(8.5, 37) - 0.6, 4.2, 5.2, 2.4, BEYAZ); s(cvG.kure, q * 8.3, 36.6, fz(8.5, 37) + 1.2, 2.4, 3.1, 1.5, GOZ); s(cvG.kureK, q * 8.3 + 0.9, 38.2, fz(8.5, 37) + 2.3, 0.85, 0.85, 0.5, BEYAZ); s(cvG.kure, q * 15.5, 29.5, fz(15.5, 29.5) - 0.5, 3.6, 2.2, 1.6, YANAK); }
      for (let k = -4; k <= 4; k++) s(cvG.kureK, k * 1.9, 26.6 + k * k * 0.3, fz(k * 1.9, 26.6 + k * k * 0.3), 1.45, 0.85, 1.1, GOZ);
      const q = S.dunya(0, 0); dnTepe.x = q.x; dnTepe.y = 61; dnTepe.z = q.z;
      const zp = zemin.geometry.attributes.position, zc = zemin.geometry.attributes.color;   // yanardağ eteğinde hafif sıcak kehribar toprak ışıması
      for (let i = 0; i < zp.count; i++) {
        const dx = zp.getX(i) - q.x, dz = (-zp.getY(i) - 70) - q.z, t = Math.max(0, 1 - Math.hypot(dx, dz) / 140), w = t * t * 0.18;
        if (w > 0.001) zc.setXYZ(i, Math.min(1, zc.getX(i) * (1 + w * 0.7)), zc.getY(i) * (1 - w * 0.15), zc.getZ(i) * (1 - w * 0.65));
      }
      zc.needsUpdate = true;
      const l = []; for (let k = 0; k < 9; k++) l.push([q.x, 61, q.z, 1, 1, 1, 0]);
      dnDuman = cok(cvG.tac, new T.MeshBasicMaterial({ color: 0xf7f8fa, fog: false }), l);
    }
  }

  // ───────── büyük dinozorlar (yoldan uzakta, sakin sakin durur; kimse kimseyi kovalamaz) ─────────
  const koy = (liste, f, yan, uz, r, k, c, don) => { const q = yerBul(f, yan, uz, r, 0); if (!q) return null; golge[golge.length - 1] = [q.x, 0.012, q.z, r * 0.8, 1, r * 0.8, 0]; liste.push([q.x, 0, q.z, k, k, k, q.ry + don, c]); return q; };
  koy(bronto, 0.12, -1, 34, 9, 2.2, PASTEL[0], 1.2); koy(bronto, 0.65, 1, 36, 9, 2.3, PASTEL[2], 1.0); koy(bronto, 0.4, 1, 40, 9, 2.4, PASTEL[3], 0.9);
  koy(stego, 0.08, 1, 22, 5, 1.5, PASTEL[1], 1.1); koy(stego, 0.71, -1, 22, 5, 1.45, PASTEL[3], 1.3);
  { let k = 0; for (const [f, yan] of [[0.365, 1], [0.6, -1]]) { const q = koy(tri, f, yan, 22 + (k % 2) * 2, 4.5, 1.5 + (k % 3) * 0.15, PASTEL[[2, 1, 3, 0, 4, 5][k]], k % 2 ? 0.9 : -0.9);
      if (q) for (let j = 0; j < 2; j++) { const x = q.x + Math.cos(j * 2.4 + k) * 4.6, z = q.z + Math.sin(j * 2.4 + k) * 4.6; if (yakin(x, z) > YARI + 6 && cvBos(x, z, 1.2)) { cvYasak.push([x, z, 2]); tri.push([x, 0, z, 0.62, 0.62, 0.62, q.ry + j * 1.3 - 0.5, PASTEL[(k + j + 1) % 6]]); golge.push([x, 0.012, z, 1.2, 1, 1.2, 0]); } } k++; } }

  // uzun boyunlular yaprak yiyor: her birinin başının hizasında yüksek bir palmiye
  for (const b of bronto) { if (b[1] < 0) continue; const k = b[3], ry = b[6], kk = k * 0.93, x = b[0] + Math.sin(ry) * 5.3 * k - Math.cos(ry) * 0.4 * k - kk, z = b[2] + Math.cos(ry) * 5.3 * k + Math.sin(ry) * 0.4 * k;
    if (yakin(x + kk, z) > YARI + 9) { cvYasak.push([x, z, 2.6]); palmiye.push([x, 0, z, kk, kk, kk, 0, YESIL[1]]); golge.push([x - 0.9, 0.012, z + 0.6, 2.6 * kk, 1, 1.9 * kk, -0.4]); } }
  // yolun üstünden geçen yosunlu dev taş kemerler (ayaklar yolun dışında; sarmaşıklar kısa, yolu örtmez)
  for (const f of [0.255, 0.785]) {
    for (let k = 0; k < 16; k++) {
      const i = (cvI(f) + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 5 + N) % N, r = 17.5; let iyi = true;
      for (const yan of [-1, 1]) for (const u of [0.72, 0.86, 1, 1.2]) { const q = cvKenar(i, yan, r * u); if (yakin(q.x, q.z) < YARI + 3.4 + (u < 0.8 ? 0 : 2.4) || (u === 1 && !cvBos(q.x, q.z, 3.6))) iyi = false; }
      if (!iyi) continue;
      S.yer(PX[i], PZ[i], Math.atan2(-TX[i], -TZ[i]), 1);
      for (let j = 0; j <= 18; j++) { const a = j / 18 * PI, kal = 2.2 + 0.9 * Math.abs(Math.cos(a)) + (j % 3) * 0.2; s(cvG.ico, Math.cos(a) * r, Math.sin(a) * 15.5 + 0.6, (j % 2) * 0.5 - 0.25, kal, kal * 0.95, kal * 1.1, TAS[(j + (f > 0.5 ? 1 : 0)) % 4], 0, j * 1.3); }
      for (const yan of [-1, 1]) { s(cvG.ico, yan * (r + 2.4), 1.1, 0.8, 2.6, 2.1, 2.5, TAS[2]); s(cvG.ico, yan * (r - 0.4), 0.8, -2.2, 1.8, 1.5, 1.9, TAS[0]); s(cvG.tac, yan * (r + 0.4), 5.2, 0.3, 2.6, 0.7, 2.6, YESIL[yan > 0 ? 1 : 3]); const q = cvKenar(i, yan, r + 0.6); cvYasak.push([q.x, q.z, 5.2]); golge.push([q.x, 0.012, q.z, 5, 1, 4.2, 0]); }
      s(cvG.tac, 0, 18.3, 0, 4.6, 0.9, 2.8, YESIL[1]); s(cvG.tac, -8.5, 16, 0.2, 2.6, 0.7, 2.4, YESIL[3]); s(cvG.tac, 9.5, 15.2, -0.2, 2.4, 0.6, 2.3, YESIL[0]);
      for (let j = 0; j < 7; j++) { const x = -9 + j * 3, a = Math.acos(clamp(x / r, -1, 1)), y = Math.sin(a) * 15.5 - 1.6, u = 1.4 + (j % 3) * 0.7; s(dnSil, x, y - u / 2, 0.9, 0.07, u, 0.07, YESIL[2], 0, 0, 0, 0, 0.14); s(cvG.okt, x, y - u, 0.9, 0.3, 0.3, 0.12, j % 2 ? 0xff8fc0 : 0xffd84a, 0, 0, 0, 0, 0.14); }
      break;
    }
  }
  // dev eğrelti öbekleri: arka sırada, insan boyundan büyük
  for (let i = 3; i < N; i += 7) for (const yan of [-1, 1]) {
    if (Rd() < 0.87) continue; const b = dnBolge(i), uz = YARI + 16 + Rd() * 22, q = cvKenar(i + ((Rd() * 4) | 0), yan, uz), x = q.x, z = q.z, kk = (b === 1 ? 3.2 : 2.4) + Rd() * 1.4;
    if (yakin(x, z) < uz * 0.8 || !cvBos(x, z, 1.5 * kk)) continue; cvYasak.push([x, z, 1.3 * kk]);
    egrelti.push([x, 0, z, kk, kk * (0.9 + Rd() * 0.3), kk, Rd() * 6.28, [0x4fb85a, 0x5ec766, 0x6fcf5e][(Rd() * 3) | 0]]); golge.push([x, 0.012, z, 1.7 * kk, 1, 1.7 * kk, 0]);
  }

  // virajlarda yazısız tahta ok tabelaları (taş ayaklı)
  { let son = -999, say = 0;
    const tabela = (i, yon) => { const q = cvKenar(i, -yon, YARI + 5.6), x = q.x, z = q.z; if (yakin(x, z) < YARI + 5.4 || !cvBos(x, z, 1)) return; cvYasak.push([x, z, 1.6]);
      S.yer(x, z, Math.atan2(-TX[i], -TZ[i]), 1.15); s(cvG.kutu, 0, 1.1, 0, 0.26, 2.2, 0.26, KOYU); s(cvG.ufak, 0.25, 0.22, 0, 0.5, 0.32, 0.45, TAS[0]); s(cvG.ufak, -0.3, 0.18, 0.1, 0.4, 0.26, 0.4, TAS[3]);
      s(cvG.kutu, 0, 2.15, 0.14, 2.4, 1.0, 0.16, AHSAP); s(cvG.kutu, 0, 2.15, 0.2, 2.2, 0.8, 0.1, 0xf3dba6);
      s(cvG.kutu, -0.28 * yon, 2.15, 0.27, 1.0, 0.26, 0.07, 0xff7a3c); s(cvG.ucgen, 0.5 * yon, 2.15, 0.27, 0.42, 0.62, 0.07, 0xff7a3c, 0, 0, -PI / 2 * yon); s(cvG.okt, 0, 2.75, 0.1, 0.5, 0.08, 0.2, YESIL[1], 0, 0.3, 0.3); golge.push([x, 0.012, z, 1.2, 1, 0.8, 0]); };
    for (let i = 30; i < N - 30 && say < 3; i++) { let k = 0; for (let j = -10; j <= 10; j++) k += KAP[(i + j + N) % N]; k /= 21; if (Math.abs(k) > 0.017 && i - son > 160) { const yon = k > 0 ? 1 : -1; tabela((i - 14 + N) % N, yon); son = i; say++; } }
  }

  // ───────── seyirci yavrular ─────────
  for (let i = 5; i < N; i += 9) for (const yan of [-1, 1]) {
    if (R() < 0.86) continue;   // sade: seyirci azaldı, yoldan uzak
    const q = cvKenar(i + ((R() * 5) | 0), yan, YARI + 8.5 + R() * 2, 0.35), x = q.x, z = q.z, ry = q.ry, b = dnBolge(i), t = R(), c = PASTEL[(R() * 6) | 0];
    if (yakin(x, z) < YARI + 8 || !cvBos(x, z, 1.2)) continue; cvYasak.push([x, z, 1.8]);
    const tur = b === 2 ? (t < 0.45 ? 2 : t < 0.75 ? 0 : t < 0.9 ? 1 : 3) : b === 3 ? (t < 0.5 ? 1 : t < 0.8 ? 0 : 2) : b === 5 ? (t < 0.45 ? 3 : t < 0.75 ? 0 : 2) : (t < 0.45 ? 0 : t < 0.65 ? 1 : t < 0.83 ? 2 : 3);
    if (tur === 0) { const k = 1.0 + R() * 0.35; sRex.push([x, 0, z, k, k, k, ry, c]); golge.push([x, 0.012, z, 0.8 * k, 1, 0.8 * k, 0]); }
    else if (tur === 1) { const k = 0.42 + R() * 0.1; sBronto.push([x, 0, z, k, k, k, ry + 0.5, c]); golge.push([x, 0.012, z, 2.6 * k, 1, 2.6 * k, 0]); }
    else if (tur === 2) { const k = 0.62 + R() * 0.14; sTri.push([x, 0, z, k, k, k, ry + 0.3, c]); golge.push([x, 0.012, z, 1.9 * k, 1, 1.9 * k, 0]); }
    else { const k = 0.55 + R() * 0.12; sStego.push([x, 0, z, k, k, k, ry + 0.5, c]); golge.push([x, 0.012, z, 2.2 * k, 1, 2.2 * k, 0]); }
  }
  const hayvan = (liste, mod, kur) => { if (!liste.length) return; const B = cvYapi(); kur(B.ekle); const g = B.geo(); g.computeBoundingBox(); cok(dnTon(g, g.boundingBox.max.y * 0.8), dnCila(cvMalz(mod, { emissive: 0x1c1a14 }), 0.09, 0.13), liste); };   // deri: dipte hafif koyu, sırtta açık; kenar ışıması her açıdan okunur
  hayvan(bronto, dnSal, e => brontoKur(e, 0, 0.42, 0, 1, 1)); hayvan(stego, dnSal, e => stegoKur(e, 0, 0.4, 0, 1)); hayvan(tri, dnSal, e => triKur(e, 0, 0.3, 0, 1.15));
  hayvan(sRex, 2, rexKur); hayvan(sBronto, 2, e => brontoKur(e, 1, 0, 1, 0.55, 1.9)); hayvan(sTri, 2, e => triKur(e, 1, 0, 1, 1.25)); hayvan(sStego, 2, e => stegoKur(e, 1, 0, 1, 1.5));

  // ───────── bitkiler, mantarlar, çiçekler, kayalar ─────────
  const MANTAR = [0xff5a5a, 0xffa23c, 0xff5a5a, 0xffa23c, 0xff5a5a], CICEK = [0xffffff, 0xffd84a, 0xff8fb8, 0xffffff, 0xffd84a, 0xffffff];   // sade: az renk
  const ORAN = [[0.25, 0.15, 0.05, 0.25, 0.1], [0.5, 0.3, 0.03, 0.07, 0.04], [0.3, 0.12, 0.06, 0.25, 0.15], [0.3, 0.25, 0.04, 0.22, 0.1], [0.12, 0.05, 0.45, 0.3, 0.04], [0.22, 0.1, 0.08, 0.12, 0.4]];   // bölgeye göre [eğrelti, ağaç, mantar, çiçek, kaya]
  for (let i = 0; i < N; i += 2) for (const yan of [-1, 1]) for (let k = 0; k < 2; k++) {
    const uz = YARI + 10 + (k ? 9 + R() * R() * 70 : R() * 6), q = cvKenar(i + ((R() * 2) | 0), yan, uz), x = q.x, z = q.z, d = yakin(x, z), b = dnBolge(i), o = ORAN[b], t = R();
    if (d < YARI + 9.5 || d < uz * 0.55 || R() < (k ? 0.72 : 0.86)) continue;   // sade: bitkiler yarıdan az, yola en yakın şerit boş
    if (t < o[0]) { const kk = (0.7 + R() * 0.9) * (k ? 1.5 : 1); if (!cvBos(x, z, 1.1 * kk)) continue; cvYasak.push([x, z, 1.2 * kk]); egrelti.push([x, 0, z, kk, kk * (0.85 + R() * 0.3), kk, R() * 6.28, [0x5ec766, 0x7ad66a, 0x4fb85a, 0x8fdc6e][(R() * 4) | 0]]); }
    else if (t < o[0] + o[1]) { const kk = 0.8 + R() * 0.55; if (d < YARI + 7 || !cvBos(x, z, 2.2)) continue; cvYasak.push([x, z, 2.6]); palmiye.push([x, 0, z, kk, kk * (0.9 + R() * 0.25), kk, R() * 6.28, YESIL[(R() * 5) | 0]]); if (d < 45) golge.push([x - 0.9, 0.012, z + 0.6, 2.6 * kk, 1, 1.9 * kk, -0.4]); }
    else if (t < o[0] + o[1] + o[2]) { const kk = (0.6 + R() * 0.9) * (k ? 1 + R() * 2.2 : 1); if (d < YARI + 4.8 + kk * 1.6 || !cvBos(x, z, 1.2 * kk)) continue; cvYasak.push([x, z, 1.4 * kk]); mantar.push([x, 0, z, kk, kk * (0.85 + R() * 0.4), kk, R() * 6.28, MANTAR[(R() * 5) | 0]]); if (d < 45) golge.push([x - 0.2 * kk, 0.012, z + 0.15 * kk, 1.3 * kk, 1, 1.0 * kk, -0.4]); }
    else if (t < o[0] + o[1] + o[2] + o[3]) { const kk = (0.7 + R() * 0.8) * (k ? 1.4 : 1); if (!cvBos(x, z, 0.6)) continue; cvYasak.push([x, z, 0.7]); cicek.push([x, 0, z, kk, kk, kk, R() * 6.28, CICEK[(R() * 6) | 0]]); }
    else if (t < o[0] + o[1] + o[2] + o[3] + o[4]) { const kk = (b === 5 ? 0.7 + R() * R() * 2.6 : 0.4 + R() * 1.0) * (k ? 1.3 : 0.8); if (d < YARI + 4.6 + kk || !cvBos(x, z, kk)) continue; cvYasak.push([x, z, kk]); kaya.push([x, kk * 0.28, z, kk, kk * (0.6 + R() * 0.5), kk * (0.8 + R() * 0.4), R() * 6.28, (b === 5 ? TAS_VOL : TAS)[(R() * 4) | 0]]); }
  }
  { // dev eğrelti: iki kat kavisli yaprak, hafifçe salınır
    const B = cvYapi(), e = B.ekle;
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.2832; e(cvG.okt, Math.sin(a) * 1.0, 0.62, Math.cos(a) * 1.0, 0.52, 0.1, 1.3, BEYAZ, -0.42, a, 0, 1, 0.05, 0.1); }
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832 + 0.4; e(cvG.okt, Math.sin(a) * 0.5, 1.15, Math.cos(a) * 0.5, 0.4, 0.08, 1.05, 0xb4ec84, -1.0, a, 0, 0, 0.03, 0.16); }
    e(cvG.ufak, 0, 0.25, 0, 0.3, 0.3, 0.3, 0x8a5a34);
    if (egrelti.length) cok(dnTon(B.geo(), 1.5), dnCila(cvMalz(dnSal), 0.08, 0.12), egrelti);
  }
  { // tarih öncesi palmiye: kalın halkalı gövde, geniş yaprak tacı
    const B = cvYapi(), e = B.ekle;
    for (let k = 0; k < 5; k++) e(cvG.govde, k * k * 0.05, 0.72 + k * 1.42, 0, 0.44 - k * 0.04, 1.5, 0.44 - k * 0.04, k % 2 ? 0xb07a45 : 0xc68f58, 0, k * 0.6, -0.07 * k);
    const tx = 1.0, ty = 7.15;
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832 + 0.2, egim = k % 2 ? 0.62 : 0.28, r = 1.7; e(cvG.okt, tx + Math.cos(a) * r * Math.cos(egim), ty - Math.sin(egim) * r + 0.25, Math.sin(a) * r * Math.cos(egim), 1.95, 0.1, 0.55, k % 2 ? BEYAZ : 0x8ddc6c, 0, -a, -egim, k % 2); }
    e(cvG.ufak, tx, ty + 0.2, 0, 0.45, 0.34, 0.45, BEYAZ, 0, 0, 0, 1); for (let k = 0; k < 3; k++) e(cvG.ufak, tx + Math.cos(k * 2.1) * 0.34, ty - 0.22, Math.sin(k * 2.1) * 0.34, 0.2, 0.22, 0.2, 0xffa23c);
    if (palmiye.length) cok(dnTon(B.geo(), 7.5), dnCila(cvMalz(1), 0.08, 0.12), palmiye);
  }
  { // dev mantar: benekli şapka
    const B = cvYapi(), e = B.ekle;
    e(cvG.sil5, 0, 0.6, 0, 0.3, 1.2, 0.3, KREM); e(cvG.sil5, 0, 0.12, 0, 0.4, 0.24, 0.4, KREM); e(cvG.yarimK, 0, 1.05, 0, 1.05, 0.8, 1.05, BEYAZ, 0, 0, 0, 1); e(cvG.daire, 0, 1.06, 0, 1.03, 1.03, 1, 0xffe9c4, PI / 2);
    for (let k = 0; k < 6; k++) { const a = k * 1.9, r = k ? 0.62 : 0, y = 1.05 + 0.8 * Math.sqrt(1 - r * r / 1.1); e(cvG.okt, Math.sin(a) * r, y - 0.02, Math.cos(a) * r, 0.17, 0.07, 0.17, KREM); }
    e(cvG.sil5, 0.75, 0.25, 0.3, 0.13, 0.5, 0.13, KREM); e(cvG.yarimK, 0.75, 0.45, 0.3, 0.42, 0.34, 0.42, BEYAZ, 0, 0, 0, 1);
    if (mantar.length) cok(dnTon(B.geo(), 1.9), dnCila(cvMalz(0), 0.08, 0.12), mantar);
  }
  { // dev çiçek
    const B = cvYapi(), e = B.ekle;
    e(cvG.sil5, 0, 0.7, 0, 0.06, 1.4, 0.06, 0x5fb24a, 0, 0, 0, 0, 0, 0.04); e(cvG.okt, 0.28, 0.5, 0, 0.32, 0.05, 0.14, 0x6fcf5e, 0, 0, 0.5, 0, 0, 0.03); e(cvG.okt, -0.28, 0.75, 0, 0.32, 0.05, 0.14, 0x6fcf5e, 0, 0, -0.5, 0, 0, 0.05);
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832; e(cvG.okt, Math.sin(a) * 0.36, 1.45, Math.cos(a) * 0.36, 0.2, 0.07, 0.3, BEYAZ, -0.3, a, 0, 1, 0.02, 0.1); }
    e(cvG.ufak, 0, 1.5, 0, 0.2, 0.15, 0.2, 0xffd84a, 0, 0, 0, 0, 0.02, 0.1);
    if (cicek.length) cok(dnTon(B.geo(), 1.6), dnCila(cvMalz(dnSal), 0.08, 0.12), cicek);
  }
  if (kaya.length) {   // kayalar: üstü güneşli, dibi serin yosun gölgeli
    const kg = cvG.ufak.clone(), kp = kg.attributes.position, kc = new Float32Array(kp.count * 3);
    for (let i = 0; i < kp.count; i++) { const u = clamp(kp.getY(i) * 0.5 + 0.5, 0, 1); kc[i * 3] = lerp(0.78, 1.04, u); kc[i * 3 + 1] = lerp(0.80, 1.02, u); kc[i * 3 + 2] = lerp(0.82, 0.94, u); }
    kg.setAttribute('color', new T.BufferAttribute(kc, 3));
    cok(kg, dnCila(mat(0xffffff, { flatShading: true, vertexColors: true }), 0.08, 0.12), kaya);
  }
  // yumuşak yeşil tepeler: yakında alçak, uzakta büyük
  for (let k = 0; k < 50; k++) {
    const a = R() * 6.2832, rr = 45 + R() * 330, x = Math.cos(a) * rr, z = -70 + Math.sin(a) * rr, d = yakin(x, z), r = 8 + R() * 14 + (d > 80 ? 14 + R() * 24 : 0), h = r * (0.2 + R() * 0.18);
    if (d < YARI + 6 + r * 1.05 || !cvBos(x, z, r * 0.8)) continue;
    tepe.push([x, -0.05, z, r * 1.4, h, r, R() * 3.14, [0x7fd06a, 0x6cc45c, 0x8fd878, 0x62bb58][(R() * 4) | 0]]);
  }
  for (let k = 0; k < 28; k++) { const kat = k % 3, a = k / 28 * 6.2832 + R() * 0.12, rr = 330 + kat * 70 + R() * 30, r = 40 + R() * 30 + kat * 12, h = 26 + R() * 26 + kat * 16; tepe.push([Math.cos(a) * rr, -1, -70 + Math.sin(a) * rr, r * 1.5, h, r, R() * 3.14, [0x9fdc9a, 0xa9dcc0, 0xbfe6d8][kat]]); }
  if (tepe.length) {   // yeşil tepeler: sırtlarda güneşli eğrelti tonu, eteklerde derin yosun gölgesi
    const tg = cvG.yarim.clone(), tp = tg.attributes.position, tn = tg.attributes.normal, tc = new Float32Array(tp.count * 3);
    for (let i = 0; i < tp.count; i++) { const u = clamp(tp.getY(i) * 0.65 + tn.getY(i) * 0.35, 0, 1); tc[i * 3] = lerp(0.82, 1.04, u); tc[i * 3 + 1] = lerp(0.86, 1.02, u); tc[i * 3 + 2] = lerp(0.86, 0.94, u); }
    tg.setAttribute('color', new T.BufferAttribute(tc, 3));
    cok(tg, dnCila(mat(0xffffff, { vertexColors: true }), 0.04, 0.12), tepe);
  }
  { // ufuk silueti: çok uzakta, pusun içinde otlayan dev uzun boyunlular ve sivri dağlar (soluk tek renk; boyunlar ağır ağır salınır)
    const PUS = 0xa6d6c6, B = cvYapi(), l = [], D = cvYapi(), dl = [];
    brontoKur((g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt, kz, ke) => B.ekle(g, x, y, z, sx, sy, sz, PUS, rx, ry, rz, 0, kz, ke), 0, 0.5, 0, 1.1, 1);
    for (const [a, r, k, d] of [[0.5, 300, 6.5, 1.4], [0.72, 318, 4.2, -1.2], [4.1, 300, 7, 1.3]]) l.push([Math.cos(a) * r, 8, -70 + Math.sin(a) * r, k, k, k, d - a]);
    const bm = cvMalz(dnSal, { fog: false }); cok(B.geo(), bm, l);
    D.ekle(cvG.koni, 0, 0.5, 0, 1, 1, 1, 0xb9dcd6); D.ekle(cvG.koni, 0, 0.86, 0, 0.3, 0.3, 0.3, 0xe4f3ec); D.ekle(cvG.koni, 0.8, 0.3, 0.2, 0.7, 0.6, 0.7, 0xc4e2da);
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.2832 + 0.2 + Rd() * 0.2, r = 470 + Rd() * 40, w = 60 + Rd() * 40; dl.push([Math.cos(a) * r, 0, -70 + Math.sin(a) * r, w, 70 + Rd() * 55, w, Rd() * 6]); }
    cok(D.geo(), new T.MeshBasicMaterial({ vertexColors: true, fog: false }), dl);
  }
  { // pamuk bulutlar
    const B = cvYapi(), l = []; B.ekle(cvG.tac, 0, 0, 0, 12, 4.5, 8, 0xffffff); B.ekle(cvG.tac, -9, -1, 0, 8, 3.2, 6, 0xf4fbff); B.ekle(cvG.tac, 9, -1, 1, 8, 3.2, 6, 0xf4fbff);
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.2832 + 0.3, r = 210 + (k % 3) * 70, b = 1.3 + (k % 4) * 0.4; l.push([Math.cos(a) * r, 100 + (k % 4) * 14, -70 + Math.sin(a) * r, b, b, b, -a]); }
    const g = B.geo(), p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { let t = clamp((p.getY(i) + 3.6) / 7.5, 0, 1); t = t * t * (3 - 2 * t); c.setXYZ(i, lerp(0.84, 1, t), lerp(0.9, 1, t), lerp(0.97, 1, t)); }   // pofuduk: altı yumuşak gölgeli
    cok(g, new T.MeshBasicMaterial({ vertexColors: true, fog: false }), l);
  }
  { // gökte süzülen pterozorlar: geniş bir çemberde yavaşça döner, kanat çırpar
    let ox = 0, oz = 0; for (let i = 0; i < N; i++) { ox += PX[i] / N; oz += PZ[i] / N; }
    const B = cvYapi(), e = B.ekle, l = [];
    e(cvG.ufak, 0, 0, 0, 0.5, 0.42, 1.3, BEYAZ, 0, 0, 0, 1); e(cvG.kureK, 0, 0.35, 1.3, 0.42, 0.38, 0.5, BEYAZ, 0, 0, 0, 1); e(cvG.koni, 0, 0.3, 2.2, 0.16, 1.1, 0.2, 0xffd166, PI / 2); e(cvG.koni, 0, 0.75, 0.75, 0.14, 0.9, 0.22, 0xff8a4a, -1.9);
    for (const x of [-1, 1]) { e(cvG.okt, x * 2.0, 0.05, 0.1, 2.0, 0.06, 0.95, BEYAZ, 0, 0, 0, 1); e(cvG.okt, x * 3.7, 0.05, -0.2, 1.3, 0.05, 0.6, 0xfff3d0); e(cvG.okt, x * 0.3, 0.5, 1.62, 0.1, 0.12, 0.07, GOZ); }
    e(cvG.koni, 0, 0, -1.6, 0.14, 1.0, 0.3, BEYAZ, -PI / 2, 0, 0, 1);
    for (let k = 0; k < 2; k++) { const a = k / 2 * 6.2832 + 0.35, r = 70 + (k % 3) * 38, b = 1.5 + (k % 3) * 0.3; l.push([Math.cos(a) * r, 34 + (k % 3) * 9, Math.sin(a) * r, b, b, b, Math.atan2(Math.sin(a), -Math.cos(a)), PASTEL[k % 6]]); }
    dnUcan = cok(B.geo(), cvMalz(3), l); dnUcan.position.set(ox, 0, oz);
  }

  // ───────── tek parça yapılar ve gölgeler ─────────
  { const m = new T.Mesh(dnTon(S.geo(), 6), dnCila(cvMalz(dnSal), 0.08, 0.12)); m.frustumCulled = false; scene.add(m); }
  { const d = tuvalDoku(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(30,70,40,.30)'); r.addColorStop(0.45, 'rgba(30,70,40,.15)'); r.addColorStop(1, 'rgba(30,70,40,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    const g = new T.PlaneGeometry(2, 2); g.rotateX(-PI / 2); const sh = cok(g, new T.MeshBasicMaterial({ map: d, transparent: true, depthWrite: false }), golge); sh.renderOrder = 1; }
}

function cevreEkGuncelle(dt, t) {
  if (dnSuDoku) dnSuDoku.offset.y = (t * 0.5) % 1;
  if (dnUcan) dnUcan.rotation.y = t * 0.045;
  if (dnDuman) {   // pamuk duman: dokuz top yükselir, büyür, rüzgârla kayar ve sönerken küçülür
    for (let k = 0; k < 9; k++) {
      const u = (t * 0.028 + k / 9) % 1, b = (5 + u * 15) * Math.min(1, u * 7) * Math.min(1, (1 - u) * 4);
      kukla.position.set(dnTepe.x + u * u * 46 + Math.sin(k * 2.1 + t * 0.2) * 3 * u, dnTepe.y + u * 52, dnTepe.z + u * 12 + Math.cos(k * 1.7) * 3 * u);
      kukla.scale.set(b * 1.25, b, b * 1.1); kukla.rotation.set(0, k, 0); kukla.updateMatrix(); dnDuman.setMatrixAt(k, kukla.matrix);
    }
    dnDuman.instanceMatrix.needsUpdate = true;
  }
}
