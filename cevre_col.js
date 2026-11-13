/* Çöl Vadisi pistinin çevresi (yalnız ?pist=col iken yüklenir, cevre.js'ten sonra).
   cevre.js ortak tabanı kurar (gök dokusu scene.background, sis scene.fog, ışıklar cvGokIsik + gunes, zemin `zemin` + `cimDoku`, güneş `cvGunes`);
   bu dosya onları kendi temasına göre değiştirir ve süslerini ekler. cevreEkGuncelle(dt, t) her karede çağrılır.
   Yeni üst düzey adlar `cl` ile başlar. Hareketin tamamı gölgelendiricide (rüzgâr, zıplama, bayrak, pırıltı); kare başına matris güncellemesi yok. */
'use strict';

let clKervan = null, clKervanYol = null, clKus = null;
const clYK = (() => {   // yuvarlak köşeli, tombul kutu: köşeler yumuşak yuvarlanır, normaller yumuşak (karton gibi düz levha değil)
  const g = new T.BoxGeometry(1, 1, 1, 3, 3, 3), p = g.attributes.position, n = g.attributes.normal, r = 0.17, v = new T.Vector3(), c = new T.Vector3(), u = a => Math.abs(a) < 0.3 ? Math.sign(a) * 0.4 : a;   // ara çizgiler köşeye yakın: az üçgenle yuvarlak kenar
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.set(u(v.x), u(v.y), u(v.z)); c.set(clamp(v.x, -0.5 + r, 0.5 - r), clamp(v.y, -0.5 + r, 0.5 - r), clamp(v.z, -0.5 + r, 0.5 - r)); v.sub(c).normalize(); n.setXYZ(i, v.x, v.y, v.z); p.setXYZ(i, c.x + v.x * r, c.y + v.y * r, c.z + v.z * r); }
  return g;
})();
const clBolge = i => { const f = (((i % N) + N) % N) / N; return f < 0.06 || f > 0.95 ? 0 : f < 0.24 ? 1 : f < 0.42 ? 2 : f < 0.6 ? 3 : f < 0.78 ? 4 : 5; };   // 0 başlangıç pazarı · 1 kaktüs bahçesi · 2 kızıl kayalar · 3 vaha · 4 eski taşlar · 5 çadır köyü
function clCila(m, par, kenar) {   // yumuşak yüzey: Lambert'e ucuz, sabit yönlü küçük parlama + gün batımı kenar ışıması (ek ışık / çizim yok)
  const o = m.onBeforeCompile, ok = m.customProgramCacheKey.call(m);
  m.onBeforeCompile = (sh, r) => {
    if (o) o.call(m, sh, r);
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ vec3 cV = normalize(vViewPosition); float cN = clamp(dot(normal, cV), 0.0, 1.0); vec3 cH = normalize(normalize(vec3(-0.35, 0.8, 0.5)) + cV);'
      + ' float cS = pow(clamp(dot(normal, cH), 0.0, 1.0), 30.0); totalEmissiveRadiance += vec3(cS * ' + par.toFixed(3) + ') + diffuseColor.rgb * vec3(1.0, 0.9, 0.8) * pow(1.0 - cN, 2.5) * ' + kenar.toFixed(3) + '; }');
  };
  m.customProgramCacheKey = () => ok + '|clCila' + par + '_' + kenar;
  return m;
}
if (cvTema === 'col') {
  // ───────── gök, ışık, zemin ─────────
  { const eski = scene.background;
    scene.background = tuvalDoku(8, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#6460b0'); gr.addColorStop(0.16, '#9a70bc'); gr.addColorStop(0.3, '#dc82a6'); gr.addColorStop(0.4, '#f89c80'); gr.addColorStop(0.48, '#ffbc70'); gr.addColorStop(0.56, '#ffd98a'); gr.addColorStop(0.64, '#ffc470'); gr.addColorStop(1, '#f3c27c');   // sıcak gün batımı: mor → gül → turuncu → altın
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    if (eski && eski.dispose) eski.dispose(); }
  scene.fog.color.set(0xffc88c); scene.fog.near = 360; scene.fog.far = 1050;
  cvGokIsik.color.set(0xffeedd); cvGokIsik.groundColor.set(0xdca074); cvGokIsik.intensity = 1.14;
  gunes.color.set(0xffd29a); gunes.intensity = 1.5; gunes.position.set(110, 85, -50);
  cvGY.set(0.86, 0.13, -0.41).normalize(); cvGunes.material.color.set(0xffc988); cvGunes.scale.set(340, 340, 1);   // güneş ufka yakın, iri ve sıcak
  { // kum: sıcak sarı zemin, rüzgârın çizdiği ince dalgacıklar ve kanyon sıcaklığı (karo sınırında dikişsiz)
    const c = cimDoku.image, g = c.getContext('2d'), w = c.width, h = c.height;
    let clS = 83291; const rc = () => { clS = (clS * 1664525 + 1013904223) >>> 0; return clS / 4294967296; };   // ortak R() sırasını bozmadan doku zenginliği
    g.globalAlpha = 1; g.fillStyle = '#e9bf7b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = R() * w, y = R() * h, r = 30 + R() * 60; g.globalAlpha = 0.16; g.fillStyle = ['#f6d596', '#dcaa64', '#f2cb88', '#e2b46e'][i % 4]; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { g.beginPath(); g.ellipse(x + ox, y + oy, r, r * 0.45, 0, 0, 7); g.fill(); } }
    g.globalAlpha = 1;
    for (let i = 0; i < 22; i++) {   // güneşli altın kumul lekeleri ve sıcak kanyon kayısı/terakota çukurları
      const x = rc() * w, y = rc() * h, r = 38 + rc() * 54, acik = i % 2 === 0;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        if (x + ox < -r || x + ox > w + r || y + oy < -r || y + oy > h + r) continue;
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        gr.addColorStop(0, acik ? 'rgba(255,234,178,.24)' : 'rgba(206,124,66,.18)');
        gr.addColorStop(0.65, acik ? 'rgba(248,216,144,.10)' : 'rgba(198,118,62,.08)');
        gr.addColorStop(1, 'rgba(233,191,123,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill();
      }
    }
    g.lineCap = 'round';
    for (let k = 0; k < 64; k++) {
      const y0 = (k + R() * 0.7) * h / 64, a = 2 + R() * 3.5, n = 2 + ((R() * 3) | 0), ph = R() * 6.28;
      for (const oy of [-h, 0, h]) for (const tur of [0, 1]) {
        g.globalAlpha = tur ? 0.26 : 0.5; g.strokeStyle = tur ? '#b97f43' : '#ffe9b4'; g.lineWidth = tur ? 2 : 1.6; g.beginPath();
        for (let x = -8; x <= w + 8; x += 8) { const y = y0 + oy + tur * 2.6 + a * Math.sin(x / w * 6.2832 * n + ph) + a * 0.4 * Math.sin(x / w * 6.2832 * (n * 2 + 1) + ph * 1.7); if (x < 0) g.moveTo(x, y); else g.lineTo(x, y); }
        g.stroke();
      }
    }
    for (let k = 0; k < 18; k++) {   // güneşli kumul sırtları: üstte sıcak krem-altın ışık, altında yumuşak kanyon gölgesi
      const y0 = (k + 0.35 + rc() * 0.35) * h / 18, a = 4 + rc() * 5, n = 1 + ((rc() * 2) | 0), ph = rc() * 6.28;
      for (const oy of [-h, 0, h]) for (const tur of [0, 1]) {
        g.globalAlpha = tur ? 0.16 : 0.34; g.strokeStyle = tur ? '#ae6434' : '#fff5ce'; g.lineWidth = tur ? 5.2 : 3.2; g.beginPath();
        for (let x = -8; x <= w + 8; x += 8) { const y = y0 + oy + tur * 4.0 + a * Math.sin(x / w * 6.2832 * n + ph); if (x < 0) g.moveTo(x, y); else g.lineTo(x, y); }
        g.stroke();
      }
    }
    for (let i = 0; i < 900; i++) { g.globalAlpha = 0.3; g.fillStyle = i % 3 ? '#fff0c4' : '#c58d50'; g.fillRect(R() * w, R() * h, 1.5, 1.5); }
    for (let i = 0; i < 140; i++) {   // ince kanyon çakılları ve kuvars pırıltıları
      const x = rc() * w, y = rc() * h, r = 0.9 + rc() * 1.3;
      g.globalAlpha = i % 3 ? 0.34 : 0.55; g.fillStyle = i % 3 === 0 ? '#fff7d6' : i % 3 === 1 ? '#c87340' : '#ad5c32';
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { if (x + ox < -3 || x + ox > w + 3 || y + oy < -3 || y + oy > h + 3) continue; g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill(); }
    }
    g.globalAlpha = 1; cimDoku.needsUpdate = true;
    const p = zemin.geometry.attributes.position, col = zemin.geometry.attributes.color;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = -y - 70, d = yakin(x, z), kenar = 1 - clamp((d - YARI - 3) / 26, 0, 1);
      const v = 0.93 + 0.07 * Math.sin(x * 0.019 + 1) * Math.cos(y * 0.016) + 0.05 * Math.sin(x * 0.047 + y * 0.041);
      const q = 0.5 + 0.5 * Math.sin(x * 0.0068 - 0.3) * Math.cos(y * 0.0057 + 0.8), sicak = 0.5 + 0.5 * Math.sin(x * 0.011 + y * 0.009);
      const rK = lerp(lerp(1.01, 1.04, q), 1.04, kenar), gK = lerp(lerp(0.91, 0.985, q), 0.99, kenar) * (0.97 + 0.03 * sicak), bK = lerp(lerp(0.82, 0.93, q), 0.93, kenar);
      col.setXYZ(i, Math.min(1, v * rK), Math.min(1, v * gK * (0.985 + 0.015 * Math.sin(y * 0.03))), Math.min(1, v * bK));
    }   // çok geniş, yumuşak sıcak ton dalgası: altın kum ↔ sıcak kanyon kayısı/terakota
    col.needsUpdate = true;
  }

  // ───────── ortak parçalar ─────────
  const S = cvYapi(), W = cvYapi(), PI = Math.PI;
  const clSil = new T.CylinderGeometry(1, 1, 1, 7, 1, true), clKup = new T.ConeGeometry(1, 1, 4), clGovde = new T.LatheGeometry([[1, -0.5], [1.02, -0.1], [0.88, 0.32], [0.66, 0.5], [0, 0.53]].map(q => new T.Vector2(q[0], q[1])), 9); clGovde.userData.cvTon = true;   // ton geçişi: alt hafif koyu, üst açık · masa tepeler: hafif bombeli gövde, yuvarlak omuz (karton gibi düz kesik değil)
  const clBayrakMod = cvHAREKET.length;   // kumaş dalgalanması (cvK.z = ağırlık)
  cvHAREKET.push('float cvF = position.x * 1.9 + position.z * 1.3;\ntransformed.y += sin(cvT * 6.0 + cvF) * 0.13 * cvK.z; transformed.x += cos(cvT * 5.0 + cvF) * 0.07 * cvK.z; transformed.z += sin(cvT * 5.0 + cvF) * 0.07 * cvK.z;');
  const clKaktusMod = cvHAREKET.length;   // kaktüs: neşeyle hafifçe sallanır, tepesindeki çiçekler (cvK.z) küçük küçük hoplar
  cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.23;\ntransformed.x += sin(cvT * 1.5 + cvF) * transformed.y * transformed.y * 0.0045; transformed.y += cvK.z * max(0.0, sin(cvT * 3.2 + cvF * 2.0)) * 0.09;\n#endif');
  const s = (g, x, y, z, sx, sy, sz, c, rx, ry, rz) => S.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz);
  const clTon = (g, h, altR, altG, altB) => {   // yükseklik ve normal kontrastı: her açıdan okunan sıcak güneş / serin kanyon gölgesi
    const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) {
      const k = 0.80 + 0.22 * clamp(p.getY(i) / h, 0, 1), ny = n ? n.getY(i) : 0, ust = clamp(ny * 0.5 + 0.5, 0, 1);
      c.setXYZ(i, Math.min(1, c.getX(i) * k * lerp(altR || 0.91, 1.03, ust)), Math.min(1, c.getY(i) * k * lerp(altG || 0.85, 1.00, ust)), Math.min(1, c.getZ(i) * k * lerp(altB || 0.90, 0.94, ust)));
    }
    c.needsUpdate = true; return g;
  };
  const KIZIL = [0xcc5a3c, 0xdd7148, 0xb94c34, 0xe58a58], KUM = [0xf3cf8c, 0xe8bd78, 0xf8dba0, 0xe2b26c], AHSAP = 0xb07a45, KOYU = 0x8a5a34, KUMAS = [0xe9524a, 0x2fb7c9, 0xffc93c, 0x8e6fe0, 0xff8a3c, 0x4fbf6b];
  const golge = [], palmiye = [], sag = [], fici = [], kaya = [], kumul = [], ot = [], deve = [], tilki = [], mirket = [], kaplu = [], kervan = [], mesaUzak = [], clPiril = [];
  const yerBul = (f, yan, uz, r, donuk) => {
    for (let k = 0; k < 13; k++) {
      const i = cvI(f + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.006), p = cvKenar(i, yan, uz, donuk === undefined ? 0.25 : donuk), x = p.x, z = p.z, ry = p.ry;
      if (yakin(x, z) > YARI + 3.4 + r && cvBos(x, z, r)) { cvYasak.push([x, z, r + 1]); golge.push([x - 0.5, 0.012, z + 0.4, r * 0.95, 1, r * 0.7, -0.4]); return { x, z, ry, i }; }
    }
    return null;
  };
  const bayrak = (x, y, z, ry, c, b) => { for (let k = 0; k < 3; k++) W.ekle(cvG.kutu, x + Math.cos(ry) * (0.2 + k * 0.36) * b, y - k * 0.03 * b, z - Math.sin(ry) * (0.2 + k * 0.36) * b, 0.37 * b, (0.5 - k * 0.1) * b, 0.04, c, 0, ry, 0, 0, 0, 0.25 + k * 0.4); };
  const testi = (x, z, k, c) => { s(cvG.kureK, x, 0.42 * k, z, 0.4 * k, 0.45 * k, 0.4 * k, c || 0xc9713f); s(clSil, x, 0.92 * k, z, 0.19 * k, 0.3 * k, 0.19 * k, 0xb85f33); s(cvG.sil, x, 1.08 * k, z, 0.26 * k, 0.07 * k, 0.26 * k, 0xe59a62); s(clSil, x, 0.46 * k, z, 0.405 * k, 0.09 * k, 0.405 * k, 0xfff0c8); };
  const hali = (x, z, ry, c1, c2, k) => { s(cvG.kutu, x, 0.035, z, 2.7 * k, 0.05, 1.7 * k, c1, 0, ry); s(cvG.kutu, x, 0.05, z, 2.2 * k, 0.05, 1.2 * k, 0xfff0c8, 0, ry); s(cvG.kutu, x, 0.065, z, 1.8 * k, 0.05, 0.85 * k, c2, 0, ry); s(clKup, x, 0.08, z, 0.42 * k, 0.03, 0.3 * k, 0xffd166, 0, ry); };
  const cadir = (p, c1, c2, b) => {
    S.yer(p.x, p.z, p.ry, b);
    s(cvG.sil, 0, 0.9, 0, 2.6, 1.8, 2.6, 0xfff3d6); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.2832 + 0.45; s(clYK, Math.sin(a) * 2.6, 0.9, Math.cos(a) * 2.6, 0.7, 1.8, 0.12, c2, 0, a); }
    s(cvG.koni, 0, 3.05, 0, 3.15, 2.6, 3.15, c1); s(cvG.sil, 0, 1.82, 0, 3.0, 0.2, 3.0, 0xffd166); s(cvG.koni, 0, 4.15, 0, 0.9, 0.75, 0.9, c2); s(cvG.kureK, 0, 4.6, 0, 0.2, 0.2, 0.2, 0xffd166);
    s(clYK, 0, 0.78, 2.58, 1.0, 1.56, 0.16, 0x6b3a2a); s(clYK, -0.62, 0.8, 2.66, 0.3, 1.6, 0.1, c1, 0, 0, 0.12); s(clYK, 0.62, 0.8, 2.66, 0.3, 1.6, 0.1, c1, 0, 0, -0.12);
    s(clSil, 0, 5.2, 0, 0.05, 1.3, 0.05, KOYU); W.yer(p.x, p.z, p.ry, b); bayrak(0, 5.55, 0, 0, c2, 1); W.yer(0, 0, 0);
    hali(0, 3.85, 0, c2, c1, 1); testi(2.4, 3.4, 1); testi(3.1, 2.9, 0.7, 0xd98a4f);
  };
  const kemer = (p, b, c0) => {
    S.yer(p.x, p.z, p.ry, b);   // yerBul(…, donuk = 1): açıklığı gelen arabalara yarı dönük, yandan geçerken de kemer gibi görünür
    for (let k = 0; k <= 12; k++) { const a = k / 12 * PI, r = 5; s(cvG.ico, Math.cos(a) * r, Math.sin(a) * r * 1.15 + 0.4, (k % 2) * 0.35 - 0.2, 1.75 + (k % 3) * 0.2, 1.75, 2.1, KIZIL[(k + c0) % 4], 0, k * 1.3); }
    s(cvG.ico, -5.6, 0.9, 0.6, 2.5, 1.9, 2.4, KIZIL[2]); s(cvG.ico, 5.7, 0.8, -0.5, 2.4, 1.7, 2.5, KIZIL[0]); s(cvG.ico, 7.6, 0.5, 0.8, 1.3, 1.0, 1.3, KIZIL[1]);
    s(cvG.govdeK, 5.2, 6.9, 0, 1.3, 0.5, 1.5, KIZIL[3]); s(cvG.govdeK, 0, 6.75, 0, 2.2, 0.45, 1.7, KIZIL[3]);
  };
  const mesa = (x, z, r, h, ry) => {
    S.yer(x, z, ry || 0, 1);
    s(clGovde, 0, h * 0.3, 0, r, h * 0.6, r * 0.85, KIZIL[0]); s(clGovde, 0, h * 0.67, 0, r * 0.8, h * 0.14, r * 0.68, 0xf0b070); s(clGovde, 0, h * 0.87, 0, r * 0.64, h * 0.26, r * 0.545, KIZIL[2]);
    s(clGovde, 0, h * 0.2, 0, r * 0.95, h * 0.045, r * 0.808, 0xe58a58); s(clGovde, 0, h * 0.42, 0, r * 0.876, h * 0.04, r * 0.745, 0xa8402e); s(clGovde, 0, h * 0.9, 0, r * 0.59, h * 0.04, r * 0.503, 0xe58a58);   // ince katman çizgileri
    s(clGovde, r * 0.95, h * 0.22, r * 0.2, r * 0.42, h * 0.44, r * 0.42, KIZIL[1]); s(clGovde, -r * 0.8, h * 0.16, -r * 0.5, r * 0.5, h * 0.32, r * 0.45, KIZIL[3]); s(clGovde, r * 1.0, h * 0.5, r * 0.2, r * 0.3, h * 0.12, r * 0.3, 0xf0b070);
  };

  // ───────── bölge yapıları ─────────
  let p;
  // 0 · başlangıç pazarı: çadırlar ve bayrak ipleri
  if ((p = yerBul(0.03, 1, 17.2, 4))) cadir(p, KUMAS[0], KUMAS[2], 1);
  if ((p = yerBul(0.985, -1, 17.2, 4))) cadir(p, KUMAS[1], KUMAS[4], 1);
  if ((p = yerBul(0.055, -1, 17.2, 4))) cadir(p, KUMAS[3], KUMAS[2], 0.9);
  const ip = (i0, say, yan, adim) => {
    S.yer(0, 0, 0); let ox = 0, oz = 0, var_ = false, n = 0;
    for (let k = 0; k <= say; k++) {
      const q = cvKenar(i0 + k * adim, yan, YARI + 4.5), x = q.x, z = q.z;
      if (yakin(x, z) < YARI + 4.3 || !cvBos(x, z, 0.4)) { var_ = false; continue; }
      s(clSil, x, 1.9, z, 0.09, 3.8, 0.09, KOYU); s(cvG.kureK, x, 3.85, z, 0.17, 0.17, 0.17, 0xffd166);
      if (var_) { const dx = x - ox, dz = z - oz, l = Math.hypot(dx, dz), ry = Math.atan2(dx, dz); s(cvG.kutu, (x + ox) / 2, 3.62, (z + oz) / 2, 0.04, 0.04, l, 0xfff0c8, 0, ry); for (let j = 1; j < 7; j++) { const u = j / 7; W.ekle(cvG.ucgen, ox + dx * u, 3.3, oz + dz * u, 0.3, 0.56, 0.035, KUMAS[n++ % 6], PI, ry + PI / 2, 0, 0, 0, 0.8); } }
      ox = x; oz = z; var_ = true;
    }
  };
  ip(N - 30, 9, 1, 8); ip(N - 30, 9, -1, 8);
  // 1 · kaktüs bahçesi: kuyu ve küpler
  if ((p = yerBul(0.13, -1, 17.2, 3.4))) {
    S.yer(p.x, p.z, p.ry, 1.4);
    s(cvG.sil, 0, 0.45, 0, 1.15, 0.9, 1.15, 0xdccbab); s(cvG.sil, 0, 0.9, 0, 1.25, 0.14, 1.25, 0xefe2c6); s(cvG.sil, 0, 0.93, 0, 0.9, 0.1, 0.9, 0x39b4e6);
    for (const x of [-1.05, 1.05]) s(clYK, x, 1.6, 0, 0.18, 3.2, 0.18, AHSAP); s(cvG.sil, 0, 2.7, 0, 0.09, 2.3, 0.09, KOYU, 0, 0, PI / 2); s(clYK, 1.35, 2.7, 0, 0.08, 0.5, 0.08, KOYU);
    s(cvG.cati, 0, 3.15, 0, 0.6, 0.6, 0.55, 0xe0524a); s(clSil, 0, 2.25, 0, 0.025, 0.9, 0.025, 0xfff0c8); s(cvG.govdeK, 0, 1.65, 0, 0.26, 0.36, 0.26, 0x9a6a3c, PI);
    testi(2.1, 0.8, 1.1); testi(2.9, 0.2, 0.8, 0xd98a4f); testi(-2.2, 0.9, 0.9); hali(0, 2.6, 0, KUMAS[1], KUMAS[0], 0.9);
  }
  if ((p = yerBul(0.19, 1, 13.5, 2.9))) { S.yer(p.x, p.z, p.ry, 1.6); testi(0, 0, 1.5); testi(1.3, 0.5, 1.0, 0xd98a4f); testi(-1.2, 0.6, 0.8); testi(0.3, 1.3, 0.6, 0xe0a070); }
  // 2 · kızıl kayalar: kemerler ve masa tepeler
  if ((p = yerBul(0.3, 1, 21, 8, 1))) kemer(p, 1.1, 0);
  if ((p = yerBul(0.36, -1, 20, 7, 1))) kemer(p, 0.9, 1);
  if ((p = yerBul(0.4, 1, 21, 7.5, 1))) kemer(p, 1.0, 2);
  for (const [f, yan, uz, r, h] of [[0.27, -1, 45, 13, 17], [0.33, 1, 56, 16, 24], [0.38, -1, 51, 12, 20], [0.43, 1, 57, 14, 16], [0.29, 1, 76, 18, 30]]) if ((p = yerBul(f, yan, uz, r * 1.25))) mesa(p.x, p.z, r, h, p.ry);
  // 3 · vaha: mavi su, sazlar, palmiyeler
  const vaha = (f, yan, uz, b) => {
    if (!(p = yerBul(f, yan, uz, 9.5 * b))) return;
    S.yer(p.x, p.z, p.ry, b); golge.pop();
    s(cvG.daire, 0, 0.02, 0, 8.2, 6.6, 1, 0xcf9f5c, -PI / 2); s(cvG.daire, 0, 0.035, 0, 7, 5.4, 1, 0x35b2e6, -PI / 2); s(cvG.daire, -1, 0.05, 0.4, 4.4, 3, 1, 0x74d4f4, -PI / 2); s(cvG.daire, 1.5, 0.06, -0.8, 1.3, 0.7, 1, 0xd5f4ff, -PI / 2);
    for (let k = 0; k < 16; k++) { const a = k * 2.4 + 0.5, x = Math.cos(a) * (6.6 + (k % 3) * 0.5), z = Math.sin(a) * (5 + (k % 3) * 0.5), hh = 1.5 + (k % 4) * 0.35; if (z > 2.5 && Math.abs(x) < 4) continue; s(cvG.koni, x, hh / 2, z, 0.08, hh, 0.08, k % 2 ? 0x7fbf55 : 0x5fa848, 0, 0, (k % 3 - 1) * 0.12); s(clSil, x + (k % 3 - 1) * -0.1, hh * 0.88, z, 0.1, 0.42, 0.1, 0x8a5a34); }
    for (let k = 0; k < 18; k++) { const a = k * 2.4, r = 0.25 + ((k * 0.37) % 0.7), q = S.dunya(Math.cos(a) * r * 6.4, Math.sin(a) * r * 4.9); clPiril.push(q.x, q.z); }   // su üstünde pırıltı
    for (let k = 0; k < 5; k++) { const a = k * 1.3 + 0.2; s(cvG.daire, Math.cos(a) * 3.8, 0.07, Math.sin(a) * 2.6, 0.5, 0.5, 1, 0x4fbf6b, -PI / 2); if (k % 2) s(cvG.ufak, Math.cos(a) * 3.8, 0.16, Math.sin(a) * 2.6, 0.17, 0.12, 0.17, 0xff9fcc); }
    for (let k = 0; k < 7; k++) { const a = k / 7 * 5 + 2.2, q = S.dunya(Math.cos(a) * (9 + (k % 2) * 1.6), Math.sin(a) * (7.4 + (k % 2) * 1.4)), qx = q.x, qz = q.z, bb = 0.85 + (k % 3) * 0.2; if (yakin(qx, qz) < YARI + 5.5) continue; palmiye.push([qx, 0, qz, bb, bb, bb, k * 2.1, [0x4fb85a, 0x5ec766, 0x42a650][k % 3]]); golge.push([qx - 0.9, 0.012, qz + 0.6, 2.6 * bb, 1, 1.9 * bb, -0.4]); }
    for (let k = 0; k < 6; k++) { const a = k * 1.9, q = S.dunya(Math.cos(a) * 8, Math.sin(a) * 6.4), qx = q.x, qz = q.z, r = 0.5 + (k % 3) * 0.25; if (yakin(qx, qz) > YARI + 4) kaya.push([qx, r * 0.3, qz, r, r * 0.7, r, k, KUM[k % 4]]); }
  };
  vaha(0.5, 1, 22, 1.15); vaha(0.56, -1, 20, 0.85); vaha(0.445, -1, 21, 0.8);
  // 4 · eski taşlar: sütunlar ve küçük piramit
  if ((p = yerBul(0.69, 1, 34, 13, 0))) {
    S.yer(p.x, p.z, p.ry, 1);
    for (let k = 0; k < 7; k++) { const w = 21 - k * 2.9; s(clYK, 0, (k + 0.5) * 1.75, 0, w, 1.75, w, k % 2 ? 0xf3d38e : 0xe8c079); }
    s(clKup, 0, 13.1, 0, 1.6, 1.8, 1.6, 0xffd166, 0, PI / 4); s(clYK, 0, 1.3, 10.6, 2.2, 2.6, 0.3, 0x8a6238); s(clYK, 0, 2.75, 10.6, 3, 0.4, 0.5, 0xf8dba0);
    for (const x of [-6.5, 6.5]) { s(clYK, x, 0.3, 13.5, 1.9, 0.6, 1.9, 0xe3d2ae); s(cvG.govdeK, x, 3.6, 13.5, 0.62, 6, 0.62, 0xf2e6c8, 0, PI / 4); s(clKup, x, 7.15, 13.5, 0.7, 1.1, 0.7, 0xffd166, 0, PI / 4); s(clYK, x, 3.2, 13.5, 0.82, 0.14, 0.82, 0xd9c69c, 0, PI / 4); s(clYK, x, 4.6, 13.5, 0.74, 0.14, 0.74, 0xd9c69c, 0, PI / 4); }   // kapının iki yanında dikilitaş
  }
  const sutun = (f, yan, uz, c0) => {
    if (!(p = yerBul(f, yan, uz, 4.6, 0))) return;
    S.yer(p.x, p.z, p.ry, 1.1); const H = [4.2, 4.2, 2.3, 4.2, 1.3];
    for (let k = 0; k < 5; k++) { const x = (k - 2) * 2.1, z = Math.abs(k - 2) * 0.5 - 1, h = H[(k + c0) % 5]; s(clYK, x, 0.2, z, 1.25, 0.4, 1.25, 0xe3d2ae); s(cvG.sil, x, 0.4 + h / 2, z, 0.42, h, 0.42, 0xf2e6c8); for (let j = 0; j < 3 && j < h; j++) s(cvG.sil, x, 0.9 + j * 1.3, z, 0.45, 0.08, 0.45, 0xd9c69c); if (h > 4) s(clYK, x, h + 0.58, z, 1.15, 0.36, 1.15, 0xe3d2ae); else s(cvG.ufak, x, h + 0.45, z, 0.4, 0.2, 0.4, 0xe3d2ae); }
    for (let k = 0; k < 4; k++) if (H[(k + c0) % 5] > 4 && H[(k + 1 + c0) % 5] > 4) s(clYK, (k - 1.5) * 2.1, 5.2, -1 + (Math.abs(k - 2) + Math.abs(k - 1)) * 0.25, 3.3, 0.5, 1.0, 0xf2e6c8);
    s(cvG.sil, 1.2, 0.42, 1.6, 0.42, 1.5, 0.42, 0xf2e6c8, 0, 0.5, PI / 2); s(cvG.sil, -2.4, 0.42, 1.2, 0.42, 0.8, 0.42, 0xe3d2ae, 0, -0.4, PI / 2); s(cvG.kutu, 3.4, 0.25, 1.5, 1.1, 0.5, 0.9, 0xe3d2ae, 0, 0.6);
  };
  const clKab = new T.TorusGeometry(1, 0.075, 5, 10, PI), KEMIK = 0xfff1d8, KEMIK2 = 0xeedcb8;
  const fosil = q => {   // kazı alanı: kumdan çıkmış büyük, güler yüzlü fosil iskeleti (yola yandan bakar)
    S.yer(q.x, q.z, q.ry, 1.2);
    s(cvG.daire, 0, 0.03, 0, 8.6, 4.4, 1, 0xd6a362, -PI / 2); s(cvG.daire, 0, 0.045, 0, 7.4, 3.5, 1, 0xdfb070, -PI / 2);
    for (let k = 0; k < 15; k++) { const x = -6.4 + k * 0.7, y = x < -2 ? lerp(0.25, 1.85, (x + 6.4) / 4.4) : 1.85; s(cvG.ufak, x, y, 0, 0.3, 0.27, 0.3, k % 2 ? KEMIK : KEMIK2, 0, k); }
    [1.0, 1.25, 1.35, 1.3, 1.1, 0.85].forEach((r, k) => s(clKab, -1.8 + k * 0.75, 0.1, 0, r, 1.72, 1.2, KEMIK, 0, PI / 2));
    for (let k = 1; k <= 4; k++) s(cvG.ufak, 3.4 + k * 0.42, 1.85 + k * 0.27, 0, 0.27, 0.25, 0.27, k % 2 ? KEMIK : KEMIK2, 0, k);
    s(cvG.ico, 5.9, 3.1, 0, 0.95, 0.62, 0.62, KEMIK); s(cvG.ico, 6.85, 2.92, 0, 0.72, 0.4, 0.46, KEMIK); s(cvG.kutu, 6.6, 2.42, 0, 1.35, 0.13, 0.62, KEMIK2, 0, 0, -0.16);
    for (const z of [-1, 1]) { s(cvG.ufak, 5.95, 3.22, z * 0.5, 0.17, 0.2, 0.14, 0x6b4a34); s(cvG.sil, 1.9, 0.75, z * 1.45, 0.13, 1.5, 0.13, KEMIK2, 0, 0, 0.18); s(cvG.ufak, 2.1, 0.12, z * 1.45, 0.3, 0.14, 0.24, KEMIK); s(cvG.sil, -1.7, 0.75, z * 1.5, 0.15, 1.5, 0.15, KEMIK2, 0, 0, -0.2); s(cvG.ufak, -1.5, 0.12, z * 1.5, 0.32, 0.14, 0.26, KEMIK); }
    s(clYK, 4.5, 1.25, 0, 0.16, 2.5, 0.16, AHSAP); s(clYK, 4.5, 2.5, 0, 0.16, 0.14, 0.9, AHSAP);
    for (const x of [-8.2, 8.2]) for (const z of [-4, 4]) { s(clSil, x, 0.55, z, 0.08, 1.1, 0.08, KOYU); s(cvG.ufak, x, 1.15, z, 0.13, 0.13, 0.13, 0xe9524a); }
    for (const z of [-4, 4]) s(cvG.kutu, 0, 0.85, z, 16.4, 0.05, 0.05, 0xfff0c8); for (const x of [-8.2, 8.2]) s(cvG.kutu, x, 0.85, 0, 0.05, 0.05, 8, 0xfff0c8);
    s(cvG.kutu, -6.6, 0.4, 2.9, 0.95, 0.8, 0.95, AHSAP); s(cvG.kutu, -6.6, 0.82, 2.9, 1.05, 0.08, 1.05, KOYU); testi(-5.3, 3.0, 0.75); s(cvG.sil, 6.2, 0.2, 2.8, 0.2, 1.3, 0.2, KEMIK, 0, 0.5, PI / 2); s(cvG.ufak, 5.6, 0.2, 2.5, 0.27, 0.22, 0.22, KEMIK); s(cvG.ufak, 6.8, 0.2, 3.1, 0.27, 0.22, 0.22, KEMIK);
  };
  for (const [f, yan] of [[0.665, 1], [0.745, -1], [0.605, 1], [0.78, -1]]) if ((p = yerBul(f, yan, 20, 9.5, 0))) { golge.pop(); fosil(p); break; }
  sutun(0.63, -1, 16.5, 0); sutun(0.72, -1, 16.5, 3); sutun(0.76, 1, 16.5, 1);
  // 5 · çadır köyü: yel değirmeni, çadırlar, kervan
  if ((p = yerBul(0.83, 1, 15, 4.5))) {
    S.yer(p.x, p.z, p.ry, 1.15);
    s(cvG.govdeK, 0, 3, 0, 2.0, 6, 2.0, 0xf6e6c4); s(cvG.sil, 0, 0.3, 0, 2.15, 0.6, 2.15, 0xdcc49a); s(cvG.koni, 0, 6.8, 0, 2.0, 1.7, 2.0, 0xd9553f); s(cvG.kureK, 0, 7.7, 0, 0.18, 0.18, 0.18, 0xffd166);
    s(clYK, 0, 0.95, 1.86, 0.85, 1.9, 0.2, KOYU); s(cvG.kureK, 0, 3.6, 1.62, 0.34, 0.34, 0.12, 0x6b4a34); s(cvG.sil, 0, 5.3, 1.75, 0.14, 0.9, 0.14, KOYU, PI / 2);
    const B = cvYapi(); B.ekle(cvG.kureK, 0, 0, 0, 0.3, 0.3, 0.3, 0xffd166);
    for (let k = 0; k < 4; k++) { const a = k * PI / 2; B.ekle(cvG.kutu, -Math.sin(a) * 1.95, Math.cos(a) * 1.95, 0, 0.14, 3.6, 0.1, KOYU, 0, 0, a); B.ekle(cvG.kutu, -Math.sin(a) * 2.3 - Math.cos(a) * 0.45, Math.cos(a) * 2.3 - Math.sin(a) * 0.45, -0.04, 0.85, 2.6, 0.05, k % 2 ? 0xfff6e0 : 0xffd9a0, 0, 0, a); }
    const q = S.dunya(0, 2.25), rotor = new T.Group(), mesh = new T.Mesh(B.geo(), cvMalz(0, { side: T.DoubleSide })); rotor.position.set(q.x, 5.3 * 1.15, q.z); rotor.rotation.y = p.ry; rotor.scale.setScalar(1.15); rotor.add(mesh); scene.add(rotor); cvDegirmen.push({ mesh, hiz: 0.7 });
  }
  if ((p = yerBul(0.87, -1, 17.2, 4))) cadir(p, KUMAS[4], KUMAS[1], 1.05);
  if ((p = yerBul(0.9, 1, 17.2, 4))) cadir(p, KUMAS[5], KUMAS[2], 0.95);
  if ((p = yerBul(0.925, -1, 17.2, 4))) cadir(p, KUMAS[0], KUMAS[3], 0.9);
  if ((p = yerBul(0.8, -1, 17.2, 4))) cadir(p, KUMAS[2], KUMAS[0], 1);
  ip(cvI(0.855), 6, 1, 8);
  { // kervan: yüklü develer yol kenarından 9,5 m uzakta, boş bir şeritte sırayla ağır ağır yürür (konumları cevreEkGuncelle'de)
    dis: for (const uzun of [120, 90, 64]) for (const f of [0.84, 0.88, 0.62, 0.7, 0.2, 0.08, 0.5, 0.3, 0.96]) for (const yan of [-1, 1]) {
      const i0 = cvI(f); let ok = true;
      for (let k = 0; k <= uzun && ok; k += 4) { const q = cvKenar(i0 + k, yan, YARI + 9.5); if (yakin(q.x, q.z) < YARI + 8.6 || !cvBos(q.x, q.z, 2.2)) ok = false; }
      if (!ok) continue;
      for (let k = 0; k <= uzun; k += 4) { const q = cvKenar(i0 + k, yan, YARI + 9.5); cvYasak.push([q.x, q.z, 2.5]); }
      for (let k = 0; k < 3; k++) kervan.push([0, -50, 0, 1.5, 1.5, 1.5, 0, [0xe3b577, 0xd9a35f, 0xf0c98d][k % 3]]);
      clKervanYol = { i0, yan, uzun }; break dis;
    }
  }
  // virajlarda yazısız tahta ok tabelaları
  { let son = -999, say = 0;
    const tabela = (i, yon) => { const q = cvKenar(i, -yon, YARI + 5.6), x = q.x, z = q.z; if (yakin(x, z) < YARI + 5.4 || !cvBos(x, z, 1)) return; cvYasak.push([x, z, 1.6]);
      S.yer(x, z, Math.atan2(-TX[i], -TZ[i]), 1.15); s(clYK, 0, 1.1, 0, 0.24, 2.2, 0.24, KOYU); s(clYK, 0, 2.15, 0.14, 2.4, 1.0, 0.16, 0xe8b872); s(clYK, 0, 2.15, 0.2, 2.2, 0.8, 0.1, 0xfff0c8);
      s(clYK, -0.28 * yon, 2.15, 0.27, 1.0, 0.26, 0.07, 0xe9524a); s(cvG.ucgen, 0.5 * yon, 2.15, 0.27, 0.42, 0.62, 0.07, 0xe9524a, 0, 0, -PI / 2 * yon); golge.push([x, 0.012, z, 1.2, 1, 0.8, 0]); };
    for (let i = 30; i < N - 30 && say < 10; i++) { let k = 0; for (let j = -10; j <= 10; j++) k += KAP[(i + j + N) % N]; k /= 21; if (Math.abs(k) > 0.017 && i - son > 80) { const yon = k > 0 ? 1 : -1; tabela((i - 15 + N) % N, yon); son = i; say++; } }
  }

  // ───────── seyirciler: deve, çöl tilkisi, mirket ailesi, kaplumbağa ─────────
  const DEVE = [0xe3b577, 0xd9a35f, 0xf0c98d], TILKI = [0xf6d9a4, 0xf0c98d, 0xffe2b4], MIRKET = [0xd9b382, 0xcfa670, 0xe2c193], KAPLU = [0x5fae5a, 0x7fbf55, 0xa98148, 0x4fa58a];
  for (let i = 5; i < N; i += 9) for (const yan of [-1, 1]) {
    if (R() < 0.55) continue;   // sade: daha az seyirci
    const q = cvKenar(i + ((R() * 5) | 0), yan, YARI + 5.7 + R() * 2.4, 0.35), x = q.x, z = q.z, ry = q.ry, b = clBolge(i), t = R();
    if (yakin(x, z) < YARI + 5.2 || !cvBos(x, z, 1.1)) continue; cvYasak.push([x, z, 1.7]);
    const tur = b === 3 ? (t < 0.45 ? 3 : t < 0.7 ? 1 : t < 0.85 ? 2 : 0) : b === 4 ? (t < 0.4 ? 1 : t < 0.75 ? 2 : t < 0.9 ? 3 : 0) : b === 2 ? (t < 0.45 ? 2 : t < 0.75 ? 1 : t < 0.9 ? 0 : 3) : (t < 0.36 ? 0 : t < 0.6 ? 2 : t < 0.82 ? 1 : 3);
    if (tur === 0) { const k = 0.95 + R() * 0.3; deve.push([x, 0, z, k, k, k, ry, DEVE[(R() * 3) | 0]]); golge.push([x, 0.012, z, 1.3 * k, 1, 1.1 * k, 0]); }
    else if (tur === 1) { const k = 1.15 + R() * 0.35; tilki.push([x, 0, z, k, k, k, ry, TILKI[(R() * 3) | 0]]); golge.push([x, 0.012, z, 0.7 * k, 1, 0.7 * k, 0]); }
    else if (tur === 2) { const n = 2 + ((R() * 2) | 0), c = MIRKET[(R() * 3) | 0]; for (let k = 0; k < n; k++) { const o = (k - (n - 1) / 2) * 0.72, kk = [1.25, 1.05, 0.72, 0.6][k] * (0.95 + R() * 0.1); mirket.push([x + Math.cos(ry) * o, 0, z - Math.sin(ry) * o, kk, kk, kk, ry + (R() - 0.5) * 0.5, c]); } golge.push([x, 0.012, z, 0.5 + n * 0.4, 1, 0.6, -ry]); }
    else { const k = 1.1 + R() * 0.45; kaplu.push([x, 0, z, k, k, k, ry, KAPLU[(R() * 4) | 0]]); golge.push([x, 0.012, z, 0.95 * k, 1, 0.95 * k, 0]); }
  }
  const hayvan = (liste, kur) => { if (!liste.length) return; const B = cvYapi(); kur((g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt, ke) => B.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt, 1, ke)); const g = B.geo(); g.computeBoundingBox(); cok(clTon(g, Math.max(1, g.boundingBox.max.y)), clCila(cvMalz(2), 0.09, 0.13), liste); };
  const GOZ = 0x2a2018;
  const deveKur = (e, yuk) => {
    for (const x of [-0.3, 0.3]) for (const z of [-0.55, 0.55]) { e(clSil, x, 0.6, z, 0.11, 1.2, 0.11, 0xffffff, 0, 0, 0, 1); e(cvG.ufak, x, 0.08, z + 0.03, 0.15, 0.09, 0.18, 0x9a6a3c); }
    e(cvG.kure, 0, 1.5, 0, 0.5, 0.48, 0.92, 0xffffff, 0, 0, 0, 1); e(cvG.kureK, 0, 2.0, -0.08, 0.34, 0.42, 0.42, 0xffffff, 0, 0, 0, 1);
    e(cvG.kureK, 0, 1.78, -0.08, 0.545, 0.2, 0.52, 0xe9524a); e(cvG.kureK, 0, 1.7, -0.08, 0.56, 0.07, 0.55, 0xffd166);
    e(clSil, 0, 2.0, 0.92, 0.16, 1.15, 0.16, 0xffffff, 0.38, 0, 0, 1); e(cvG.kure, 0, 2.62, 1.2, 0.26, 0.25, 0.36, 0xffffff, 0.15, 0, 0, 1); e(cvG.kureK, 0, 2.54, 1.48, 0.19, 0.16, 0.2, 0xfff0d2);
    for (const x of [-1, 1]) { e(cvG.ufak, x * 0.21, 2.86, 1.06, 0.07, 0.13, 0.05, 0xffffff, 0, 0, x * -0.4, 1, 0.25); e(cvG.ufak, x * 0.18, 2.7, 1.42, 0.055, 0.065, 0.055, GOZ); }
    e(clSil, 0, 1.45, -0.98, 0.04, 0.6, 0.04, 0xffffff, -0.5, 0, 0, 1); e(cvG.ufak, 0, 1.18, -1.13, 0.08, 0.1, 0.08, 0x9a6a3c);
    if (yuk) { for (const x of [-1, 1]) { e(cvG.kutu, x * 0.62, 1.55, -0.1, 0.42, 0.55, 0.75, x > 0 ? 0x2fb7c9 : 0x8e6fe0, 0, 0, x * 0.12); e(cvG.kutu, x * 0.64, 1.56, -0.1, 0.44, 0.12, 0.77, 0xffd166, 0, 0, x * 0.12); e(cvG.kureK, x * 0.6, 1.3, 0.6, 0.2, 0.24, 0.2, 0xc9713f); } e(cvG.sil, 0, 2.45, -0.08, 0.3, 0.26, 0.3, 0xffc93c, 0, 0, PI / 2); }
  };
  hayvan(deve, e => deveKur(e, false));
  hayvan(tilki, e => {
    e(cvG.kureK, 0, 0.46, 0, 0.3, 0.44, 0.32, 0xffffff, 0, 0, 0, 1); e(cvG.kureK, 0, 0.43, 0.16, 0.2, 0.3, 0.2, 0xfff8ea); e(cvG.kure, 0, 1.02, 0.08, 0.31, 0.27, 0.29, 0xffffff, 0, 0, 0, 1);
    for (const x of [-1, 1]) { e(cvG.koni, x * 0.25, 1.5, 0.03, 0.17, 0.62, 0.08, 0xffffff, 0, 0, x * -0.32, 1, 0.12); e(cvG.koni, x * 0.25, 1.47, 0.07, 0.1, 0.44, 0.05, 0xffb9a6, 0, 0, x * -0.32, 0, 0.12); e(cvG.ufak, x * 0.125, 1.08, 0.32, 0.05, 0.06, 0.04, GOZ); e(cvG.ufak, x * 0.2, 0.96, 0.27, 0.07, 0.045, 0.03, 0xffb9a6); e(cvG.ufak, x * 0.16, 0.06, 0.2, 0.1, 0.06, 0.14, 0xfff8ea); }
    e(cvG.koni, 0, 0.96, 0.4, 0.11, 0.22, 0.1, 0xfff8ea, PI / 2); e(cvG.ufak, 0, 0.97, 0.51, 0.045, 0.04, 0.04, GOZ);
    e(cvG.kureK, 0.32, 0.24, -0.26, 0.15, 0.15, 0.36, 0xffffff, 0, 0.8, 0, 1); e(cvG.ufak, 0.5, 0.26, -0.44, 0.11, 0.11, 0.14, 0x6b4a34);
    e(cvG.ufak, 0.34, 0.8, 0.1, 0.07, 0.2, 0.07, 0xffffff, 0, 0, -0.7, 1, 1); e(cvG.ufak, -0.3, 0.55, 0.14, 0.07, 0.17, 0.07, 0xffffff, 0, 0, 0.3, 1);
  });
  hayvan(mirket, e => {
    e(cvG.kureK, 0, 0.62, 0, 0.2, 0.6, 0.2, 0xffffff, 0, 0, 0, 1); e(cvG.kureK, 0, 0.62, 0.08, 0.14, 0.46, 0.14, 0xf6e6c6); e(cvG.kureK, 0, 1.32, 0.03, 0.2, 0.19, 0.21, 0xffffff, 0, 0, 0, 1);
    e(cvG.ufak, 0, 1.27, 0.21, 0.09, 0.08, 0.1, 0xf6e6c6); e(cvG.ufak, 0, 1.29, 0.31, 0.035, 0.03, 0.03, GOZ);
    for (const x of [-1, 1]) { e(cvG.ufak, x * 0.09, 1.36, 0.16, 0.065, 0.07, 0.05, 0x5a4029); e(cvG.ufak, x * 0.185, 1.42, 0, 0.05, 0.05, 0.03, 0x5a4029); e(cvG.ufak, x * 0.1, 0.05, 0.08, 0.08, 0.05, 0.14, 0x8a6a48); }
    e(cvG.ufak, -0.2, 0.82, 0.1, 0.05, 0.2, 0.05, 0xffffff, 0, 0, 0.45, 1); e(cvG.ufak, 0.24, 0.98, 0.08, 0.05, 0.2, 0.05, 0xffffff, 0, 0, -0.9, 1, 1);
    e(clSil, 0, 0.22, -0.28, 0.04, 0.6, 0.04, 0x8a6a48, -1.0);
  });
  hayvan(kaplu, e => {
    e(cvG.yarimK, 0, 0.26, 0, 0.56, 0.52, 0.66, 0xffffff, 0, 0, 0, 1); e(cvG.sil, 0, 0.25, 0, 0.6, 0.09, 0.7, 0xf0dc96);
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832; e(cvG.ufak, Math.sin(a) * 0.3, 0.6, Math.cos(a) * 0.36, 0.13, 0.06, 0.13, 0xf8e9a8); } e(cvG.ufak, 0, 0.77, 0, 0.15, 0.05, 0.15, 0xf8e9a8);
    e(clSil, 0, 0.42, 0.62, 0.11, 0.42, 0.11, 0xa5d873, 0.85); e(cvG.kure, 0, 0.62, 0.8, 0.21, 0.2, 0.23, 0xa5d873);
    for (const x of [-1, 1]) { e(cvG.ufak, x * 0.11, 0.7, 0.96, 0.045, 0.05, 0.035, GOZ); e(cvG.ufak, x * 0.17, 0.58, 0.95, 0.05, 0.03, 0.02, 0xffa9b8); e(cvG.ufak, x * 0.47, 0.12, -0.42, 0.14, 0.12, 0.17, 0xa5d873); }
    e(cvG.ufak, -0.5, 0.12, 0.42, 0.14, 0.12, 0.17, 0xa5d873); e(cvG.ufak, 0.56, 0.4, 0.46, 0.11, 0.2, 0.11, 0xa5d873, 0, 0, -0.8, 0, 1); e(cvG.ufak, 0, 0.16, -0.7, 0.06, 0.05, 0.1, 0xa5d873);
  });
  if (kervan.length) { const B = cvYapi(); deveKur((g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt, ke) => B.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt, 0.22, 0), true); B.ekle(cvG.daire, -0.2, 0.03, 0.1, 0.95, 1.55, 1, 0xc9995a, -PI / 2); clKervan = cok(clTon(B.geo(), 2.8), clCila(cvMalz(2), 0.09, 0.13), kervan); }

  // ───────── bitkiler, kayalar, kum tepeleri ─────────
  const YESIL = [0x4fae5c, 0x5cbf68, 0x43a052, 0x6cc76e], CICEK = [0xff6fa3, 0xffd84a, 0xffffff, 0xff9248, 0xe86fd6, 0xff8a8a], PALM = [0x4fb85a, 0x5ec766, 0x42a650, 0x6fcf5e];
  const ORAN = [[0.2, 0.25, 0.25, 0.1], [0.5, 0.3, 0.02, 0.08], [0.12, 0.14, 0.0, 0.5], [0.03, 0.12, 0.5, 0.08], [0.14, 0.16, 0.05, 0.3], [0.2, 0.2, 0.18, 0.12]];   // bölgeye göre [büyük kaktüs, fıçı kaktüs, palmiye, kaya]; kalan = kuru ot
  for (let i = 0; i < N; i += 2) for (const yan of [-1, 1]) for (let k = 0; k < 2; k++) {
    const uz = YARI + 5 + (k ? 9 + R() * R() * 70 : R() * 9), q = cvKenar(i + ((R() * 2) | 0), yan, uz), x = q.x, z = q.z, ry = q.ry, d = yakin(x, z), b = clBolge(i), o = ORAN[b], t = R();
    if (d < YARI + (k ? 4.6 : 6.2) || d < uz * 0.55 || R() < (k ? 0.62 : 0.66)) continue;   // sade: seyrek, yola en yakın şeritte boşluk
    if (t < o[0]) { const kk = 0.8 + R() * 0.9; if (!cvBos(x, z, 1.2 * kk)) continue; cvYasak.push([x, z, 1.4 * kk]); sag.push([x, 0, z, kk, kk * (0.9 + R() * 0.3), kk, ry + (R() - 0.5) * 0.8, YESIL[(R() * 4) | 0]]); if (d < 45) golge.push([x - 0.3 * kk, 0.012, z + 0.2 * kk, 1.5 * kk, 1, 1.1 * kk, -0.4]); }
    else if (t < o[0] + o[1]) { const kk = 0.7 + R() * 0.9; if (!cvBos(x, z, 0.8 * kk)) continue; cvYasak.push([x, z, kk]); fici.push([x, 0, z, kk, kk, kk, R() * 6.28, CICEK[(R() * 6) | 0]]); }
    else if (t < o[0] + o[1] + o[2]) { const kk = 0.8 + R() * 0.5; if (d < YARI + 6.5 || !cvBos(x, z, 2.2)) continue; cvYasak.push([x, z, 2.6]); palmiye.push([x, 0, z, kk, kk * (0.9 + R() * 0.25), kk, R() * 6.28, PALM[(R() * 4) | 0]]); if (d < 45) golge.push([x - 0.9, 0.012, z + 0.6, 2.6 * kk, 1, 1.9 * kk, -0.4]); }
    else if (t < o[0] + o[1] + o[2] + o[3]) { const kk = (b === 2 ? 0.8 + R() * R() * 3.2 : 0.4 + R() * 1.1) * (k ? 1.3 : 0.8); if (d < YARI + 4.6 + kk || !cvBos(x, z, kk)) continue; cvYasak.push([x, z, kk]); kaya.push([x, kk * 0.28, z, kk, kk * (0.6 + R() * 0.5), kk * (0.8 + R() * 0.4), R() * 6.28, b === 2 ? KIZIL[(R() * 4) | 0] : b === 4 ? [0xe3d2ae, 0xf2e6c8, 0xd9c69c][(R() * 3) | 0] : [0xd9a868, 0xcf9a5c, 0xe6bb7c][(R() * 3) | 0]]); }
    else { const kk = 0.6 + R() * 0.8; if (cvBos(x, z, 0.3)) ot.push([x, 0, z, kk, kk, kk, R() * 6.28, [0xd9c36a, 0xc9b85c, 0xe6d27e, 0xb9c26a][(R() * 4) | 0]]); }
  }
  { // büyük kaktüs: kollu, çiçekli, güler yüzlü
    const clKSil = new T.CylinderGeometry(1, 1, 1, 12, 1, true), B = cvYapi(), e = (g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt) => B.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt);
    const cicek = (x, y, z, k) => { B.ekle(cvG.petal, x, y, z, 0.24 * k, 0.14 * k, 0.24 * k, 0xff7fb0, 0, 0, 0, 0, 0, 1); B.ekle(cvG.petal, x, y + 0.03 * k, z, 0.17 * k, 0.12 * k, 0.17 * k, 0xffa8cf, 0, 0.6, 0, 0, 0, 1); B.ekle(cvG.ufak, x, y + 0.08 * k, z, 0.08 * k, 0.07 * k, 0.08 * k, 0xffe066, 0, 0, 0, 0, 0, 1); };
    e(clKSil, 0, 1.6, 0, 0.42, 3.2, 0.42, 0xffffff, 0, 0, 0, 1); e(cvG.yarimK, 0, 3.2, 0, 0.42, 0.45, 0.42, 0xffffff, 0, 0, 0, 1); cicek(0, 3.62, 0, 1.1);
    e(clKSil, 0.68, 1.75, 0, 0.21, 0.7, 0.21, 0xffffff, 0, 0, PI / 2, 1); e(cvG.ufak, 1.03, 1.75, 0, 0.23, 0.23, 0.23, 0xffffff, 0, 0, 0, 1); e(clKSil, 1.03, 2.3, 0, 0.21, 1.1, 0.21, 0xffffff, 0, 0, 0, 1); e(cvG.yarimK, 1.03, 2.85, 0, 0.21, 0.24, 0.21, 0xffffff, 0, 0, 0, 1); cicek(1.03, 3.06, 0, 0.75);
    e(clKSil, -0.64, 1.15, 0, 0.19, 0.6, 0.19, 0xffffff, 0, 0, PI / 2, 1); e(cvG.ufak, -0.94, 1.15, 0, 0.21, 0.21, 0.21, 0xffffff, 0, 0, 0, 1); e(clKSil, -0.94, 1.55, 0, 0.19, 0.8, 0.19, 0xffffff, 0, 0, 0, 1); e(cvG.yarimK, -0.94, 1.95, 0, 0.19, 0.22, 0.19, 0xffffff, 0, 0, 0, 1); cicek(-0.94, 2.14, 0, 0.7);
    for (const x of [-1, 1]) { e(cvG.ufak, x * 0.16, 2.55, 0.39, 0.055, 0.07, 0.04, GOZ); e(cvG.ufak, x * 0.27, 2.36, 0.34, 0.08, 0.05, 0.03, 0xff9fb0); }
    e(cvG.kutu, 0, 2.33, 0.41, 0.16, 0.035, 0.03, GOZ);
    if (sag.length) cok(clTon(B.geo(), 3.6), clCila(cvMalz(clKaktusMod), 0.09, 0.13), sag);
  }
  { // fıçı kaktüs: dilimli top, tepesinde renkli çiçek
    const B = cvYapi(), e = (g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt) => B.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt);
    e(cvG.kureK, 0, 0.45, 0, 0.5, 0.5, 0.5, 0x58b564); for (let k = 0; k < 2; k++) e(cvG.kureK, 0, 0.45, 0, 0.1, 0.53, 0.54, 0x86d78c, 0, k * PI / 2 + 0.4);
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832; e(cvG.petal, Math.cos(a) * 0.15, 0.95, Math.sin(a) * 0.15, 0.13, 0.09, 0.13, 0xffffff, 0, 0, 0, 1); } e(cvG.ufak, 0, 1.0, 0, 0.09, 0.07, 0.09, 0xffe066);
    e(cvG.ufak, 0.55, 0.26, 0.2, 0.28, 0.28, 0.28, 0x4faa5c); e(cvG.petal, 0.55, 0.53, 0.2, 0.12, 0.09, 0.12, 0xffffff, 0, 0, 0, 1);
    if (fici.length) cok(clTon(B.geo(), 1.0), clCila(cvMalz(0), 0.09, 0.13), fici);
  }
  { // palmiye: kıvrık gövde, sarkan yapraklar; rüzgârda salınır
    const B = cvYapi(), e = (g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt) => B.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt);
    for (let k = 0; k < 5; k++) e(cvG.govde, k * k * 0.065, 0.72 + k * 1.42, 0, 0.34 - k * 0.03, 1.5, 0.34 - k * 0.03, k % 2 ? 0xb07a45 : 0xc68f58, 0, k * 0.6, -0.085 * k);
    const tx = 1.25, ty = 7.15;
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.2832 + 0.2, egim = k % 2 ? 0.62 : 0.3, r = 1.55; e(cvG.ufak, tx + Math.cos(a) * r * Math.cos(egim), ty - Math.sin(egim) * r + 0.25, Math.sin(a) * r * Math.cos(egim), 1.75, 0.09, 0.46, 0xffffff, 0, -a, -egim, 1); }
    e(cvG.ufak, tx, ty + 0.2, 0, 0.4, 0.3, 0.4, 0xffffff, 0, 0, 0, 1); for (let k = 0; k < 2; k++) e(cvG.ufak, tx + Math.cos(k * 2.1) * 0.3, ty - 0.2, Math.sin(k * 2.1) * 0.3, 0.2, 0.2, 0.2, 0x8a5a34);
    if (palmiye.length) cok(clTon(B.geo(), 7.5), clCila(cvMalz(1), 0.09, 0.13), palmiye);
  }
  if (kaya.length) {   // yuvarlak, çakıl gibi yumuşak kayalar: üstte gün ışığı, dipte sıcak kanyon gölgesi
    const kg = new T.SphereGeometry(1, 9, 6), kp = kg.attributes.position, kn = kg.attributes.normal, kc = new Float32Array(kp.count * 3);
    for (let i = 0; i < kp.count; i++) { const u = clamp(kn.getY(i) * 0.5 + 0.5, 0, 1); kc[i * 3] = lerp(0.78, 1.04, u); kc[i * 3 + 1] = lerp(0.70, 1.00, u); kc[i * 3 + 2] = lerp(0.74, 0.92, u); }
    kg.setAttribute('color', new T.BufferAttribute(kc, 3));
    cok(kg, clCila(mat(0xffffff, { vertexColors: true }), 0.09, 0.13), kaya);
  }
  { const B = cvYapi(); for (let k = 0; k < 5; k++) { const a = k * 1.3; B.ekle(cvG.ucgen, Math.cos(a) * 0.16, 0.3, Math.sin(a) * 0.16, 0.07, 0.6 + (k % 3) * 0.15, 0.07, 0xffffff, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35, 1); } if (ot.length) cok(clTon(B.geo(), 0.7), clCila(cvMalz(1), 0.09, 0.13), ot); }
  // kum tepeleri: yakında alçak, uzakta büyük ve yumuşak
  for (let k = 0; k < 150; k++) {
    const a = R() * 6.2832, rr = 40 + R() * 330, x = Math.cos(a) * rr, z = -70 + Math.sin(a) * rr, d = yakin(x, z), r = 7 + R() * 14 + (d > 80 ? 14 + R() * 22 : 0), h = r * (0.16 + R() * 0.14);
    if (d < YARI + 5 + r * 1.05 || !cvBos(x, z, r * 0.8)) continue;
    kumul.push([x, -0.05, z, r * 1.5, h, r, R() * 3.14, KUM[(R() * 4) | 0]]);
  }
  if (kumul.length) {   // kum tepeleri: sırtlarda güneş parıltısı, eteklerde sıcak gölge
    const kg = cvG.yarim.clone(), kp = kg.attributes.position, kn = kg.attributes.normal, kc = new Float32Array(kp.count * 3);
    for (let i = 0; i < kp.count; i++) { const u = clamp(kp.getY(i) * 0.65 + kn.getY(i) * 0.35, 0, 1); kc[i * 3] = lerp(0.86, 1.04, u); kc[i * 3 + 1] = lerp(0.77, 1.01, u); kc[i * 3 + 2] = lerp(0.71, 0.94, u); }
    kg.setAttribute('color', new T.BufferAttribute(kc, 3));
    cok(kg, clCila(mat(0xffffff, { vertexColors: true }), 0.04, 0.15), kumul);
  }
  // uzak manzara: katman katman masa tepeler
  for (let k = 0; k < 30; k++) {
    const kat = k % 3, a = k / 30 * 6.2832 + R() * 0.12, rr = 320 + kat * 80 + R() * 30, r = 24 + R() * 26 + kat * 10, h = 22 + R() * 24 + kat * 13;
    mesaUzak.push([Math.cos(a) * rr, -1, -70 + Math.sin(a) * rr, r * (1 + R() * 0.8), h, r, R() * 3.14, [0xfff0e2, 0xffe2cc, 0xf8d0bc][kat]]);
  }
  { const B = cvYapi(), e = (g, y, r, h, c) => B.ekle(g, 0, y, 0, r, h, r, c, 0, 0, 0, 1);
    e(clGovde, 0.3, 1, 0.6, KIZIL[0]); e(clGovde, 0.67, 0.8, 0.14, 0xf0b070); e(clGovde, 0.87, 0.64, 0.26, KIZIL[2]); e(clGovde, 0.2, 0.95, 0.045, 0xe58a58); e(clGovde, 0.42, 0.876, 0.04, 0xa8402e); e(clGovde, 0.9, 0.59, 0.04, 0xe58a58); B.ekle(clGovde, 1.0, 0.2, 0.2, 0.42, 0.4, 0.42, KIZIL[1], 0, 0, 0, 1); B.ekle(clGovde, -0.85, 0.15, -0.4, 0.5, 0.3, 0.45, KIZIL[3], 0, 0, 0, 1);
    cok(clTon(B.geo(), 1.0, 0.88, 0.82, 0.86), clCila(cvMalz(0), 0.04, 0.16), mesaUzak); }   // katmanlı masa tepe: kenarlarda sıcak, yumuşak gün batımı ışıması
  { // en uzak katman: gün batımına karşı puslu siluetler (masa tepeler, kaya kuleleri) ve güneşin önünde üç büyük piramit; tek çizim
    const B = cvYapi(), az = Math.atan2(-0.41, 0.86); B.yer(0, -70, 0);
    const clSilY = new T.CylinderGeometry(0.86, 1, 1, 14, 1, true), clKapak = new T.SphereGeometry(1, 14, 3, 0, 6.2832, 0, PI / 2), clTepe = new T.SphereGeometry(1, 14, 4, 0, 6.2832, 0, PI / 2);
    for (let k = 0; k < 26; k++) {   // yumuşak köşeli siluetler: yuvarlak omuzlu masa tepeler, kubbe başlı kaya kuleleri, aralarda tatlı tepecikler
      const a = k / 26 * 6.2832 + 0.1, rr = 590 + (k % 3) * 16, x = Math.cos(a) * rr, z = Math.sin(a) * rr, c = k % 2 ? 0xd08a8e : 0xc27a8c;
      let fark = Math.abs(a - az) % 6.2832; if (fark > PI) fark = 6.2832 - fark; if (fark < 0.3) continue;
      if (k % 4 === 1) { B.ekle(clSilY, x, 26, z, 18, 52, 15, c, 0, -a); B.ekle(clKapak, x, 52, z, 15.5, 8, 13, c, 0, -a); B.ekle(clTepe, x, 0, z, 46, 20, 32, c, 0, -a); }
      else { const w = 50 + (k % 5) * 12, h = 46 + (k % 3) * 16; B.ekle(clSilY, x, h / 2, z, w, h, w * 0.7, c, 0, -a); B.ekle(clKapak, x, h, z, w * 0.86, 9, w * 0.6, c, 0, -a); B.ekle(clTepe, x, 0, z, w * 1.55, h * 0.4, w * 1.05, c, 0, -a); }
    }
    for (const [da, h] of [[-0.1, 105], [0.015, 150], [0.125, 88]]) { const a = az + da; B.ekle(clKup, Math.cos(a) * 600, h / 2 - 2, Math.sin(a) * 600, h * 0.78, h, h * 0.78, da === 0.015 ? 0xcf8580 : 0xc67a84, 0, PI / 4 - a); }
    const bg = B.geo(), bp = bg.attributes.position, bc = bg.attributes.color;   // dibi ufkun sıcak pusuna erir: uzak katman sakin ve soluk
    for (let i = 0; i < bp.count; i++) { const t = 0.1 + 0.5 * (1 - clamp((bp.getY(i) + 2) / 75, 0, 1)); bc.setXYZ(i, lerp(bc.getX(i), 0.95, t), lerp(bc.getY(i), 0.6, t), lerp(bc.getZ(i), 0.36, t)); }
    const m = new T.Mesh(bg, new T.MeshBasicMaterial({ vertexColors: true, fog: false })); m.frustumCulled = false; scene.add(m);
  }
  { // gün batımı bulutları: yassı, uzun; altı gül-mor, üstü altın şeftali
    // yumuşak, kabarık çizgi film bulutu: düz alt, üstte yuvarlak tepecikler (pürüzsüz küre, köşesiz)
    const B = cvYapi(), l = [], yuv = new T.SphereGeometry(1, 12, 6);
    B.ekle(yuv, 0, 0, 0, 17, 3.6, 7, 0xffffff); B.ekle(yuv, -12, -0.3, 0, 9, 3.0, 5.5, 0xffffff); B.ekle(yuv, 12, -0.3, 0.5, 10, 3.2, 5.5, 0xffffff);
    B.ekle(yuv, -5, 2.2, 0, 6.5, 4.4, 4.6, 0xffffff); B.ekle(yuv, 4, 2.8, -0.5, 7.5, 5.2, 5, 0xffffff);
    const g = B.geo(), q = g.attributes.position, c = g.attributes.color, alt = new T.Color(0xf4a8a0), ust = new T.Color(0xfff6e4);
    for (let i = 0; i < q.count; i++) { const y = Math.max(q.getY(i), -1.6); q.setY(i, y); const u = clamp((y + 1.6) / 7.5, 0, 1); c.setXYZ(i, lerp(alt.r, ust.r, u), lerp(alt.g, ust.g, u), lerp(alt.b, ust.b, u)); }
    for (let k = 0; k < 13; k++) { const a = k / 13 * 6.2832 + 0.3, r = 250 + (k % 3) * 85, b = 1.2 + (k % 4) * 0.35; l.push([Math.cos(a) * r, 62 + (k % 4) * 17, -70 + Math.sin(a) * r, b * 1.15, b * 0.8, b, -a + PI / 2]); }
    cok(g, new T.MeshBasicMaterial({ vertexColors: true, fog: false }), l);
  }

  { // gökte süzülen birkaç kuş (kanat çırpışı gölgelendiricide; sürü yavaşça döner)
    const B = cvYapi(), l = []; B.ekle(cvG.kure, 0, 0, 0, 0.2, 0.2, 0.6, 0xfff6e6); B.ekle(cvG.ufak, 0, 0.08, 0.6, 0.16, 0.16, 0.18, 0xfff6e6); B.ekle(cvG.koni, 0, 0.06, 0.85, 0.06, 0.2, 0.06, 0xffa53d, PI / 2);
    for (const x of [-1, 1]) { B.ekle(cvG.kutu, x * 0.55, 0.05, 0.05, 0.9, 0.05, 0.5, 0xf6e6cc); B.ekle(cvG.kutu, x * 1.3, 0.05, -0.05, 0.7, 0.05, 0.32, 0x9a7650); }
    B.ekle(cvG.kutu, 0, 0.02, -0.7, 0.3, 0.04, 0.4, 0x9a7650);
    for (let i = 0; i < 8; i++) { const a = (i < 5 ? 0.5 + i * 0.15 : 3.5 + (i - 5) * 0.2) + R() * 0.05, r = (i < 5 ? 100 : 62) + (i % 3) * 9 + R() * 6, b = 2.4 + R() * 0.8; l.push([Math.cos(a) * r, 30 + (i % 4) * 4 + R() * 5, Math.sin(a) * r, b, b, b, Math.atan2(Math.sin(a), -Math.cos(a))]); }
    clKus = cok(B.geo(), cvMalz(3), l); clKus.position.set(0, 0, -70);
  }

  // ───────── tek parça yapılar, kumaşlar, gölgeler, kum pırıltıları ─────────
  { const m = new T.Mesh(clTon(S.geo(), 5, 0.90, 0.84, 0.89), clCila(cvMalz(0), 0.09, 0.13)); m.frustumCulled = false; scene.add(m); }
  { const m = new T.Mesh(W.geo(), cvMalz(clBayrakMod, { side: T.DoubleSide })); m.frustumCulled = false; scene.add(m); }
  { const d = tuvalDoku(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(120,62,30,.30)'); r.addColorStop(0.45, 'rgba(120,62,30,.15)'); r.addColorStop(1, 'rgba(120,62,30,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    const g = new T.PlaneGeometry(2, 2); g.rotateX(-PI / 2); const sh = cok(g, new T.MeshBasicMaterial({ map: d, transparent: true, depthWrite: false }), golge); sh.renderOrder = 1; }
  { // kumda ara sıra parlayan küçük pırıltılar: sabit noktalar, hareket tamamen GPU'da
    const n0 = 240, n = n0 + clPiril.length / 2, pos = new Float32Array(n * 3);
    for (let i = n0; i < n; i++) { pos[i * 3] = clPiril[(i - n0) * 2]; pos[i * 3 + 1] = 0.2; pos[i * 3 + 2] = clPiril[(i - n0) * 2 + 1]; }
    for (let i = 0; i < n0; i++) { const q = cvKenar((R() * N) | 0, R() < 0.5 ? -1 : 1, YARI + 4.2 + R() * 13); pos[i * 3] = q.x + (R() - 0.5) * 2; pos[i * 3 + 1] = 0.12 + R() * 0.2; pos[i * 3 + 2] = q.z + (R() - 0.5) * 2; if (yakin(pos[i * 3], pos[i * 3 + 2]) < YARI + 4.0) pos[i * 3 + 1] = -5; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    const m = new T.ShaderMaterial({ uniforms: { cvT: cvZ }, transparent: true, depthWrite: false,
      vertexShader: 'uniform float cvT;varying float cvA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;float f=position.x*3.7+position.z*5.3;float p=pow(max(0.0,sin(cvT*1.7+f)),10.0);gl_PointSize=clamp(150.0/max(2.0,-mv.z),1.5,7.0)*(0.5+p);cvA=p*(1.0-smoothstep(30.0,70.0,-mv.z));}',
      fragmentShader: 'varying float cvA;void main(){vec2 q=abs(gl_PointCoord-vec2(.5))*2.0;float d=1.0-smoothstep(0.0,1.0,q.x+q.y+min(q.x,q.y)*2.5);gl_FragColor=vec4(vec3(1.0,0.97,0.82),cvA*d);if(gl_FragColor.a<.01)discard;\n#include <colorspace_fragment>\n}' });
    const pts = new T.Points(g, m); pts.frustumCulled = false; scene.add(pts);
  }
}

function cevreEkGuncelle(dt, t) {   // kuş sürüsü döner, kervan yürür; gerisi gölgelendiricide (cvZ) ve cevre.js'teki cvDegirmen döngüsünde
  if (clKus) clKus.rotation.y = t * 0.09;
  if (clKervan && clKervanYol) {
    const y = clKervanYol, bas = 30 + (t * 0.6) % (y.uzun - 30), uz = (YARI + 9.5) * y.yan;
    for (let k = 0; k < 3; k++) {
      const u = y.i0 + bas - k * 13, i = Math.floor(u), f = u - i, a = ((i % N) + N) % N, b = (a + 1) % N, tx = TX[a] + (TX[b] - TX[a]) * f, tz = TZ[a] + (TZ[b] - TZ[a]) * f;
      kukla.position.set(PX[a] + (PX[b] - PX[a]) * f - tz * uz, 0, PZ[a] + (PZ[b] - PZ[a]) * f + tx * uz);
      kukla.scale.set(1.5, 1.5, 1.5); kukla.rotation.set(0, Math.atan2(tx, tz), 0); kukla.updateMatrix(); clKervan.setMatrixAt(k, kukla.matrix);
    }
    clKervan.instanceMatrix.needsUpdate = true;
  }
}
