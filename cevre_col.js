/* Çöl Vadisi pistinin çevresi (yalnız ?pist=col iken yüklenir, cevre.js'ten sonra).
   cevre.js ortak tabanı kurar (gök dokusu scene.background, sis scene.fog, ışıklar cvGokIsik + gunes, zemin `zemin` + `cimDoku`, güneş `cvGunes`);
   bu dosya onları kendi temasına göre değiştirir ve süslerini ekler. cevreEkGuncelle(dt, t) her karede çağrılır.
   Yeni üst düzey adlar `cl` ile başlar. Hareketin tamamı gölgelendiricide (rüzgâr, zıplama, bayrak, pırıltı); kare başına matris güncellemesi yok. */
'use strict';

const clBolge = i => { const f = (((i % N) + N) % N) / N; return f < 0.06 || f > 0.95 ? 0 : f < 0.24 ? 1 : f < 0.42 ? 2 : f < 0.6 ? 3 : f < 0.78 ? 4 : 5; };   // 0 başlangıç pazarı · 1 kaktüs bahçesi · 2 kızıl kayalar · 3 vaha · 4 eski taşlar · 5 çadır köyü
if (cvTema === 'col') {
  // ───────── gök, ışık, zemin ─────────
  { const eski = scene.background;
    scene.background = tuvalDoku(8, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#3f7fd6'); gr.addColorStop(0.2, '#79aee8'); gr.addColorStop(0.38, '#c9d2dc'); gr.addColorStop(0.5, '#ffd9a0'); gr.addColorStop(0.58, '#ffbf73'); gr.addColorStop(0.64, '#ffae62'); gr.addColorStop(1, '#f3c27c');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    if (eski && eski.dispose) eski.dispose(); }
  scene.fog.color.set(0xffcf94); scene.fog.near = 360; scene.fog.far = 1050;
  cvGokIsik.color.set(0xfff3dc); cvGokIsik.groundColor.set(0xd8a468); cvGokIsik.intensity = 1.12;
  gunes.color.set(0xffdca8); gunes.intensity = 1.5; gunes.position.set(110, 85, -50);
  cvGY.set(0.86, 0.2, -0.41).normalize(); cvGunes.material.color.set(0xffd9a0); cvGunes.scale.set(270, 270, 1);
  { // kum: sıcak sarı zemin, rüzgârın çizdiği ince dalgacıklar (karo sınırında dikişsiz)
    const c = cimDoku.image, g = c.getContext('2d'), w = c.width, h = c.height;
    g.globalAlpha = 1; g.fillStyle = '#e9bf7b'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = R() * w, y = R() * h, r = 30 + R() * 60; g.globalAlpha = 0.16; g.fillStyle = ['#f6d596', '#dcaa64', '#f2cb88', '#e2b46e'][i % 4]; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { g.beginPath(); g.ellipse(x + ox, y + oy, r, r * 0.45, 0, 0, 7); g.fill(); } }
    g.lineCap = 'round';
    for (let k = 0; k < 64; k++) {
      const y0 = (k + R() * 0.7) * h / 64, a = 2 + R() * 3.5, n = 2 + ((R() * 3) | 0), ph = R() * 6.28;
      for (const oy of [-h, 0, h]) for (const tur of [0, 1]) {
        g.globalAlpha = tur ? 0.26 : 0.5; g.strokeStyle = tur ? '#b97f43' : '#ffe9b4'; g.lineWidth = tur ? 2 : 1.6; g.beginPath();
        for (let x = -8; x <= w + 8; x += 8) { const y = y0 + oy + tur * 2.6 + a * Math.sin(x / w * 6.2832 * n + ph) + a * 0.4 * Math.sin(x / w * 6.2832 * (n * 2 + 1) + ph * 1.7); if (x < 0) g.moveTo(x, y); else g.lineTo(x, y); }
        g.stroke();
      }
    }
    for (let i = 0; i < 900; i++) { g.globalAlpha = 0.5; g.fillStyle = i % 3 ? '#fff0c4' : '#c58d50'; g.fillRect(R() * w, R() * h, 1.5, 1.5); }
    g.globalAlpha = 1; cimDoku.needsUpdate = true;
    const p = zemin.geometry.attributes.position, col = zemin.geometry.attributes.color;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), v = 0.93 + 0.07 * Math.sin(x * 0.019 + 1) * Math.cos(y * 0.016) + 0.05 * Math.sin(x * 0.047 + y * 0.041); col.setXYZ(i, v, v * (0.97 + 0.03 * Math.sin(y * 0.03)), v * 0.95); }
    col.needsUpdate = true;
  }

  // ───────── ortak parçalar ─────────
  const S = cvYapi(), W = cvYapi(), PI = Math.PI;
  const clSil = new T.CylinderGeometry(1, 1, 1, 7, 1, true), clKup = new T.ConeGeometry(1, 1, 4);
  const clBayrakMod = cvHAREKET.length;   // kumaş dalgalanması (cvK.z = ağırlık)
  cvHAREKET.push('float cvF = position.x * 1.9 + position.z * 1.3;\ntransformed.y += sin(cvT * 6.0 + cvF) * 0.13 * cvK.z; transformed.x += cos(cvT * 5.0 + cvF) * 0.07 * cvK.z; transformed.z += sin(cvT * 5.0 + cvF) * 0.07 * cvK.z;');
  const s = (g, x, y, z, sx, sy, sz, c, rx, ry, rz) => S.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz);
  const KIZIL = [0xcc5a3c, 0xdd7148, 0xb94c34, 0xe58a58], KUM = [0xf3cf8c, 0xe8bd78, 0xf8dba0, 0xe2b26c], AHSAP = 0xb07a45, KOYU = 0x8a5a34, KUMAS = [0xe9524a, 0x2fb7c9, 0xffc93c, 0x8e6fe0, 0xff8a3c, 0x4fbf6b];
  const golge = [], palmiye = [], sag = [], fici = [], kaya = [], kumul = [], ot = [], deve = [], tilki = [], mirket = [], kaplu = [], kervan = [], mesaUzak = [];
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
    s(cvG.sil, 0, 0.9, 0, 2.6, 1.8, 2.6, 0xfff3d6); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.2832 + 0.45; s(cvG.kutu, Math.sin(a) * 2.6, 0.9, Math.cos(a) * 2.6, 0.7, 1.8, 0.12, c2, 0, a); }
    s(cvG.koni, 0, 3.05, 0, 3.15, 2.6, 3.15, c1); s(cvG.sil, 0, 1.82, 0, 3.0, 0.2, 3.0, 0xffd166); s(cvG.koni, 0, 4.15, 0, 0.9, 0.75, 0.9, c2); s(cvG.kureK, 0, 4.6, 0, 0.2, 0.2, 0.2, 0xffd166);
    s(cvG.kutu, 0, 0.78, 2.58, 1.0, 1.56, 0.16, 0x6b3a2a); s(cvG.kutu, -0.62, 0.8, 2.66, 0.3, 1.6, 0.1, c1, 0, 0, 0.12); s(cvG.kutu, 0.62, 0.8, 2.66, 0.3, 1.6, 0.1, c1, 0, 0, -0.12);
    s(clSil, 0, 5.2, 0, 0.05, 1.3, 0.05, KOYU); bayrak(0, 5.55, 0, 0, c2, 1);
    hali(0, 4.6, 0, c2, c1, 1); testi(2.4, 3.4, 1); testi(3.1, 2.9, 0.7, 0xd98a4f);
  };
  const kemer = (p, b, c0) => {
    S.yer(p.x, p.z, p.ry + PI / 2, b);
    for (let k = 0; k <= 12; k++) { const a = k / 12 * PI, r = 5; s(cvG.ico, Math.cos(a) * r, Math.sin(a) * r * 1.15 + 0.4, (k % 2) * 0.35 - 0.2, 1.75 + (k % 3) * 0.2, 1.75, 2.1, KIZIL[(k + c0) % 4], 0, k * 1.3); }
    s(cvG.ico, -5.6, 0.9, 0.6, 2.5, 1.9, 2.4, KIZIL[2]); s(cvG.ico, 5.7, 0.8, -0.5, 2.4, 1.7, 2.5, KIZIL[0]); s(cvG.ico, 7.6, 0.5, 0.8, 1.3, 1.0, 1.3, KIZIL[1]);
    s(cvG.govdeK, 5.2, 6.9, 0, 1.3, 0.5, 1.5, KIZIL[3]); s(cvG.govdeK, 0, 6.75, 0, 2.2, 0.45, 1.7, KIZIL[3]);
  };
  const mesa = (x, z, r, h, ry) => {
    S.yer(x, z, ry || 0, 1);
    s(cvG.govdeK, 0, h * 0.3, 0, r, h * 0.6, r * 0.85, KIZIL[0]); s(cvG.govdeK, 0, h * 0.67, 0, r * 0.8, h * 0.14, r * 0.68, 0xf0b070); s(cvG.govdeK, 0, h * 0.87, 0, r * 0.64, h * 0.26, r * 0.545, KIZIL[2]);
    s(cvG.govdeK, r * 0.95, h * 0.22, r * 0.2, r * 0.42, h * 0.44, r * 0.42, KIZIL[1]); s(cvG.govdeK, -r * 0.8, h * 0.16, -r * 0.5, r * 0.5, h * 0.32, r * 0.45, KIZIL[3]); s(cvG.govdeK, r * 1.0, h * 0.5, r * 0.2, r * 0.3, h * 0.12, r * 0.3, 0xf0b070);
  };

  // ───────── bölge yapıları ─────────
  let p;
  // 0 · başlangıç pazarı: çadırlar ve bayrak ipleri
  if ((p = yerBul(0.03, 1, 15.5, 4))) cadir(p, KUMAS[0], KUMAS[2], 1);
  if ((p = yerBul(0.985, -1, 15.5, 4))) cadir(p, KUMAS[1], KUMAS[4], 1);
  if ((p = yerBul(0.055, -1, 15.5, 4))) cadir(p, KUMAS[3], KUMAS[2], 0.9);
  const ip = (i0, say, yan, adim) => {
    S.yer(0, 0, 0); let ox = 0, oz = 0, var_ = false, n = 0;
    for (let k = 0; k <= say; k++) {
      const q = cvKenar(i0 + k * adim, yan, YARI + 3.9), x = q.x, z = q.z;
      if (yakin(x, z) < YARI + 3.5 || !cvBos(x, z, 0.4)) { var_ = false; continue; }
      s(clSil, x, 1.9, z, 0.09, 3.8, 0.09, KOYU); s(cvG.kureK, x, 3.85, z, 0.17, 0.17, 0.17, 0xffd166);
      if (var_) { const dx = x - ox, dz = z - oz, l = Math.hypot(dx, dz), ry = Math.atan2(dx, dz); s(cvG.kutu, (x + ox) / 2, 3.62, (z + oz) / 2, 0.04, 0.04, l, 0xfff0c8, 0, ry); for (let j = 1; j < 7; j++) { const u = j / 7; W.ekle(cvG.ucgen, ox + dx * u, 3.3, oz + dz * u, 0.3, 0.56, 0.035, KUMAS[n++ % 6], PI, ry + PI / 2, 0, 0, 0, 0.8); } }
      ox = x; oz = z; var_ = true;
    }
  };
  ip(N - 30, 9, 1, 8); ip(N - 30, 9, -1, 8);
  // 1 · kaktüs bahçesi: kuyu ve küpler
  if ((p = yerBul(0.13, -1, 14.5, 3))) {
    S.yer(p.x, p.z, p.ry, 1.15);
    s(cvG.sil, 0, 0.45, 0, 1.15, 0.9, 1.15, 0xdccbab); s(cvG.sil, 0, 0.9, 0, 1.25, 0.14, 1.25, 0xefe2c6); s(cvG.sil, 0, 0.93, 0, 0.9, 0.1, 0.9, 0x39b4e6);
    for (const x of [-1.05, 1.05]) s(cvG.kutu, x, 1.6, 0, 0.18, 3.2, 0.18, AHSAP); s(cvG.sil, 0, 2.7, 0, 0.09, 2.3, 0.09, KOYU, 0, 0, PI / 2); s(cvG.kutu, 1.35, 2.7, 0, 0.08, 0.5, 0.08, KOYU);
    s(cvG.cati, 0, 3.15, 0, 0.6, 0.6, 0.55, 0xe0524a); s(clSil, 0, 2.25, 0, 0.025, 0.9, 0.025, 0xfff0c8); s(cvG.govdeK, 0, 1.65, 0, 0.26, 0.36, 0.26, 0x9a6a3c, PI);
    testi(2.1, 0.8, 1.1); testi(2.9, 0.2, 0.8, 0xd98a4f); testi(-2.2, 0.9, 0.9); hali(0, 2.9, 0, KUMAS[1], KUMAS[0], 0.9);
  }
  if ((p = yerBul(0.19, 1, 13.5, 2.5))) { S.yer(p.x, p.z, p.ry, 1.3); testi(0, 0, 1.5); testi(1.3, 0.5, 1.0, 0xd98a4f); testi(-1.2, 0.6, 0.8); testi(0.3, 1.3, 0.6, 0xe0a070); }
  // 2 · kızıl kayalar: kemerler ve masa tepeler
  if ((p = yerBul(0.3, 1, 21, 8))) kemer(p, 1.1, 0);
  if ((p = yerBul(0.36, -1, 20, 7))) kemer(p, 0.9, 1);
  if ((p = yerBul(0.4, 1, 21, 7.5))) kemer(p, 1.0, 2);
  for (const [f, yan, uz, r, h] of [[0.27, -1, 34, 13, 17], [0.33, 1, 44, 16, 24], [0.38, -1, 40, 12, 20], [0.43, 1, 46, 14, 16], [0.29, 1, 62, 18, 30]]) if ((p = yerBul(f, yan, uz, r * 1.25))) mesa(p.x, p.z, r, h, p.ry);
  // 3 · vaha: mavi su, sazlar, palmiyeler
  const vaha = (f, yan, uz, b) => {
    if (!(p = yerBul(f, yan, uz, 9.5 * b))) return;
    S.yer(p.x, p.z, p.ry, b); golge.pop();
    s(cvG.daire, 0, 0.02, 0, 8.2, 6.6, 1, 0xcf9f5c, -PI / 2); s(cvG.daire, 0, 0.035, 0, 7, 5.4, 1, 0x35b2e6, -PI / 2); s(cvG.daire, -1, 0.05, 0.4, 4.4, 3, 1, 0x74d4f4, -PI / 2); s(cvG.daire, 1.5, 0.06, -0.8, 1.3, 0.7, 1, 0xd5f4ff, -PI / 2);
    for (let k = 0; k < 16; k++) { const a = k * 2.4 + 0.5, x = Math.cos(a) * (6.6 + (k % 3) * 0.5), z = Math.sin(a) * (5 + (k % 3) * 0.5), hh = 1.5 + (k % 4) * 0.35; if (z > 2.5 && Math.abs(x) < 4) continue; s(cvG.koni, x, hh / 2, z, 0.08, hh, 0.08, k % 2 ? 0x7fbf55 : 0x5fa848, 0, 0, (k % 3 - 1) * 0.12); s(clSil, x + (k % 3 - 1) * -0.1, hh * 0.88, z, 0.1, 0.42, 0.1, 0x8a5a34); }
    for (let k = 0; k < 5; k++) { const a = k * 1.3 + 0.2; s(cvG.daire, Math.cos(a) * 3.8, 0.07, Math.sin(a) * 2.6, 0.5, 0.5, 1, 0x4fbf6b, -PI / 2); if (k % 2) s(cvG.ufak, Math.cos(a) * 3.8, 0.16, Math.sin(a) * 2.6, 0.17, 0.12, 0.17, 0xff9fcc); }
    for (let k = 0; k < 7; k++) { const a = k / 7 * 5 + 2.2, q = S.dunya(Math.cos(a) * (9 + (k % 2) * 1.6), Math.sin(a) * (7.4 + (k % 2) * 1.4)), qx = q.x, qz = q.z, bb = 0.85 + (k % 3) * 0.2; if (yakin(qx, qz) < YARI + 5.5) continue; palmiye.push([qx, 0, qz, bb, bb, bb, k * 2.1, [0x4fb85a, 0x5ec766, 0x42a650][k % 3]]); golge.push([qx - 0.9, 0.012, qz + 0.6, 2.6 * bb, 1, 1.9 * bb, -0.4]); }
    for (let k = 0; k < 6; k++) { const a = k * 1.9, q = S.dunya(Math.cos(a) * 8, Math.sin(a) * 6.4), qx = q.x, qz = q.z, r = 0.5 + (k % 3) * 0.25; if (yakin(qx, qz) > YARI + 4) kaya.push([qx, r * 0.3, qz, r, r * 0.7, r, k, KUM[k % 4]]); }
  };
  vaha(0.5, 1, 22, 1.15); vaha(0.56, -1, 20, 0.85); vaha(0.445, -1, 21, 0.8);
  // 4 · eski taşlar: sütunlar ve küçük piramit
  if ((p = yerBul(0.69, 1, 34, 13, 0))) {
    S.yer(p.x, p.z, p.ry, 1);
    for (let k = 0; k < 7; k++) { const w = 21 - k * 2.9; s(cvG.kutu, 0, (k + 0.5) * 1.75, 0, w, 1.75, w, k % 2 ? 0xf3d38e : 0xe8c079); }
    s(clKup, 0, 13.1, 0, 1.6, 1.8, 1.6, 0xffd166, 0, PI / 4); s(cvG.kutu, 0, 1.3, 10.6, 2.2, 2.6, 0.3, 0x8a6238); s(cvG.kutu, 0, 2.75, 10.6, 3, 0.4, 0.5, 0xf8dba0);
  }
  const sutun = (f, yan, uz, c0) => {
    if (!(p = yerBul(f, yan, uz, 4.6, 0))) return;
    S.yer(p.x, p.z, p.ry, 1.1); const H = [4.2, 4.2, 2.3, 4.2, 1.3];
    for (let k = 0; k < 5; k++) { const x = (k - 2) * 2.1, z = Math.abs(k - 2) * 0.5 - 1, h = H[(k + c0) % 5]; s(cvG.kutu, x, 0.2, z, 1.25, 0.4, 1.25, 0xe3d2ae); s(cvG.sil, x, 0.4 + h / 2, z, 0.42, h, 0.42, 0xf2e6c8); for (let j = 0; j < 3 && j < h; j++) s(cvG.sil, x, 0.9 + j * 1.3, z, 0.45, 0.08, 0.45, 0xd9c69c); if (h > 4) s(cvG.kutu, x, h + 0.58, z, 1.15, 0.36, 1.15, 0xe3d2ae); else s(cvG.ufak, x, h + 0.45, z, 0.4, 0.2, 0.4, 0xe3d2ae); }
    for (let k = 0; k < 4; k++) if (H[(k + c0) % 5] > 4 && H[(k + 1 + c0) % 5] > 4) s(cvG.kutu, (k - 1.5) * 2.1, 5.2, -1 + (Math.abs(k - 2) + Math.abs(k - 1)) * 0.25, 3.3, 0.5, 1.0, 0xf2e6c8);
    s(cvG.sil, 1.2, 0.42, 1.6, 0.42, 1.5, 0.42, 0xf2e6c8, 0, 0.5, PI / 2); s(cvG.sil, -2.4, 0.42, 1.2, 0.42, 0.8, 0.42, 0xe3d2ae, 0, -0.4, PI / 2); s(cvG.kutu, 3.4, 0.25, 1.5, 1.1, 0.5, 0.9, 0xe3d2ae, 0, 0.6);
  };
  sutun(0.63, -1, 16.5, 0); sutun(0.72, -1, 16.5, 3); sutun(0.76, 1, 16.5, 1);
  // 5 · çadır köyü: yel değirmeni, çadırlar, kervan
  if ((p = yerBul(0.83, 1, 15, 4.5))) {
    S.yer(p.x, p.z, p.ry, 1.15);
    s(cvG.govdeK, 0, 3, 0, 2.0, 6, 2.0, 0xf6e6c4); s(cvG.sil, 0, 0.3, 0, 2.15, 0.6, 2.15, 0xdcc49a); s(cvG.koni, 0, 6.8, 0, 2.0, 1.7, 2.0, 0xd9553f); s(cvG.kureK, 0, 7.7, 0, 0.18, 0.18, 0.18, 0xffd166);
    s(cvG.kutu, 0, 0.95, 1.86, 0.85, 1.9, 0.2, KOYU); s(cvG.kureK, 0, 3.6, 1.62, 0.34, 0.34, 0.12, 0x6b4a34); s(cvG.sil, 0, 5.3, 1.75, 0.14, 0.9, 0.14, KOYU, PI / 2);
    const B = cvYapi(); B.ekle(cvG.kureK, 0, 0, 0, 0.3, 0.3, 0.3, 0xffd166);
    for (let k = 0; k < 4; k++) { const a = k * PI / 2; B.ekle(cvG.kutu, -Math.sin(a) * 1.95, Math.cos(a) * 1.95, 0, 0.14, 3.6, 0.1, KOYU, 0, 0, a); B.ekle(cvG.kutu, -Math.sin(a) * 2.3 - Math.cos(a) * 0.45, Math.cos(a) * 2.3 - Math.sin(a) * 0.45, -0.04, 0.85, 2.6, 0.05, k % 2 ? 0xfff6e0 : 0xffd9a0, 0, 0, a); }
    const q = S.dunya(0, 2.25), rotor = new T.Group(), mesh = new T.Mesh(B.geo(), cvMalz(0, { side: T.DoubleSide })); rotor.position.set(q.x, 5.3 * 1.15, q.z); rotor.rotation.y = p.ry; rotor.scale.setScalar(1.15); rotor.add(mesh); scene.add(rotor); cvDegirmen.push({ mesh, hiz: 0.7 });
  }
  if ((p = yerBul(0.87, -1, 15.5, 4))) cadir(p, KUMAS[4], KUMAS[1], 1.05);
  if ((p = yerBul(0.9, 1, 15.5, 4))) cadir(p, KUMAS[5], KUMAS[2], 0.95);
  if ((p = yerBul(0.925, -1, 15.5, 4))) cadir(p, KUMAS[0], KUMAS[3], 0.9);
  if ((p = yerBul(0.8, -1, 15.5, 4))) cadir(p, KUMAS[2], KUMAS[0], 1);
  ip(cvI(0.855), 6, 1, 8);
  { // kervan: yüklü develer sırayla, yoldan uzakta
    dis: for (const f of [0.86, 0.9, 0.82, 0.7, 0.2, 0.6]) for (const yan of [-1, 1]) {
      const i0 = cvI(f), l = []; let ok = true;
      for (let k = 0; k < 5 && ok; k++) { const i = (i0 + k * 9) % N, q = cvKenar(i, yan, 25), x = q.x, z = q.z; if (yakin(x, z) < YARI + 12 || !cvBos(x, z, 2)) ok = false; else l.push([x, 0, z, 1.25, 1.25, 1.25, Math.atan2(TX[i], TZ[i]), [0xe3b577, 0xd9a35f, 0xf0c98d][k % 3]]); }
      if (ok) { for (const a of l) { kervan.push(a); cvYasak.push([a[0], a[2], 3]); golge.push([a[0] - 0.4, 0.012, a[2] + 0.3, 1.7, 1, 1.3, -0.4]); } break dis; }
    }
  }
  // virajlarda yazısız tahta ok tabelaları
  { let son = -999, say = 0;
    const tabela = (i, yon) => { const q = cvKenar(i, -yon, YARI + 4.3), x = q.x, z = q.z; if (yakin(x, z) < YARI + 3.6 || !cvBos(x, z, 1)) return; cvYasak.push([x, z, 1.6]);
      S.yer(x, z, Math.atan2(-TX[i], -TZ[i]), 1.15); s(cvG.kutu, 0, 1.1, 0, 0.24, 2.2, 0.24, KOYU); s(cvG.kutu, 0, 2.15, 0.14, 2.4, 1.0, 0.16, 0xe8b872); s(cvG.kutu, 0, 2.15, 0.2, 2.2, 0.8, 0.1, 0xfff0c8);
      s(cvG.kutu, -0.28 * yon, 2.15, 0.27, 1.0, 0.26, 0.07, 0xe9524a); s(cvG.ucgen, 0.5 * yon, 2.15, 0.27, 0.42, 0.62, 0.07, 0xe9524a, 0, 0, -PI / 2 * yon); golge.push([x, 0.012, z, 1.2, 1, 0.8, 0]); };
    for (let i = 30; i < N - 30 && say < 10; i++) { let k = 0; for (let j = -10; j <= 10; j++) k += KAP[(i + j + N) % N]; k /= 21; if (Math.abs(k) > 0.017 && i - son > 80) { const yon = k > 0 ? 1 : -1; tabela((i - 26 + N) % N, yon); tabela((i - 7 + N) % N, yon); son = i; say++; } }
  }

  // ───────── seyirciler: deve, çöl tilkisi, mirket ailesi, kaplumbağa ─────────
  const DEVE = [0xe3b577, 0xd9a35f, 0xf0c98d], TILKI = [0xf6d9a4, 0xf0c98d, 0xffe2b4], MIRKET = [0xd9b382, 0xcfa670, 0xe2c193], KAPLU = [0x5fae5a, 0x7fbf55, 0xa98148, 0x4fa58a];
  for (let i = 5; i < N; i += 9) for (const yan of [-1, 1]) {
    if (R() < 0.3) continue;
    const q = cvKenar(i + ((R() * 5) | 0), yan, YARI + 4.3 + R() * 2.4, 0.35), x = q.x, z = q.z, ry = q.ry, b = clBolge(i), t = R();
    if (yakin(x, z) < YARI + 3.9 || !cvBos(x, z, 1.1)) continue; cvYasak.push([x, z, 1.7]);
    const tur = b === 3 ? (t < 0.45 ? 3 : t < 0.7 ? 1 : t < 0.85 ? 2 : 0) : b === 4 ? (t < 0.4 ? 1 : t < 0.75 ? 2 : t < 0.9 ? 3 : 0) : b === 2 ? (t < 0.45 ? 2 : t < 0.75 ? 1 : t < 0.9 ? 0 : 3) : (t < 0.36 ? 0 : t < 0.6 ? 2 : t < 0.82 ? 1 : 3);
    if (tur === 0) { const k = 0.95 + R() * 0.3; deve.push([x, 0, z, k, k, k, ry, DEVE[(R() * 3) | 0]]); golge.push([x, 0.012, z, 1.3 * k, 1, 1.1 * k, 0]); }
    else if (tur === 1) { const k = 1.15 + R() * 0.35; tilki.push([x, 0, z, k, k, k, ry, TILKI[(R() * 3) | 0]]); golge.push([x, 0.012, z, 0.7 * k, 1, 0.7 * k, 0]); }
    else if (tur === 2) { const n = 2 + ((R() * 2) | 0), c = MIRKET[(R() * 3) | 0]; for (let k = 0; k < n; k++) { const o = (k - (n - 1) / 2) * 0.72, kk = [1.25, 1.05, 0.72, 0.6][k] * (0.95 + R() * 0.1); mirket.push([x + Math.cos(ry) * o, 0, z - Math.sin(ry) * o, kk, kk, kk, ry + (R() - 0.5) * 0.5, c]); } golge.push([x, 0.012, z, 0.5 + n * 0.4, 1, 0.6, -ry]); }
    else { const k = 1.1 + R() * 0.45; kaplu.push([x, 0, z, k, k, k, ry, KAPLU[(R() * 4) | 0]]); golge.push([x, 0.012, z, 0.95 * k, 1, 0.95 * k, 0]); }
  }
  const hayvan = (liste, kur) => { if (!liste.length) return; const B = cvYapi(); kur((g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt, ke) => B.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt, 1, ke)); cok(B.geo(), cvMalz(2), liste); };
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
  if (kervan.length) { const B = cvYapi(); deveKur((g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt, ke) => B.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt, 0.22, 0), true); cok(B.geo(), cvMalz(2), kervan); }

  // ───────── bitkiler, kayalar, kum tepeleri ─────────
  const YESIL = [0x4fae5c, 0x5cbf68, 0x43a052, 0x6cc76e], CICEK = [0xff6fa3, 0xffd84a, 0xffffff, 0xff9248, 0xe86fd6, 0xff8a8a], PALM = [0x4fb85a, 0x5ec766, 0x42a650, 0x6fcf5e];
  const ORAN = [[0.2, 0.25, 0.25, 0.1], [0.5, 0.3, 0.02, 0.08], [0.12, 0.14, 0.0, 0.5], [0.03, 0.12, 0.5, 0.08], [0.14, 0.16, 0.05, 0.3], [0.2, 0.2, 0.18, 0.12]];   // bölgeye göre [büyük kaktüs, fıçı kaktüs, palmiye, kaya]; kalan = kuru ot
  for (let i = 0; i < N; i += 2) for (const yan of [-1, 1]) for (let k = 0; k < 2; k++) {
    const uz = YARI + 5 + (k ? 9 + R() * R() * 70 : R() * 9), q = cvKenar(i + ((R() * 2) | 0), yan, uz), x = q.x, z = q.z, ry = q.ry, d = yakin(x, z), b = clBolge(i), o = ORAN[b], t = R();
    if (d < YARI + 4.6 || d < uz * 0.55 || R() < (k ? 0.5 : 0.45)) continue;
    if (t < o[0]) { const kk = 0.8 + R() * 0.9; if (!cvBos(x, z, 1.2 * kk)) continue; cvYasak.push([x, z, 1.4 * kk]); sag.push([x, 0, z, kk, kk * (0.9 + R() * 0.3), kk, ry + (R() - 0.5) * 0.8, YESIL[(R() * 4) | 0]]); if (d < 45) golge.push([x - 0.3 * kk, 0.012, z + 0.2 * kk, 1.5 * kk, 1, 1.1 * kk, -0.4]); }
    else if (t < o[0] + o[1]) { const kk = 0.7 + R() * 0.9; if (!cvBos(x, z, 0.8 * kk)) continue; cvYasak.push([x, z, kk]); fici.push([x, 0, z, kk, kk, kk, R() * 6.28, CICEK[(R() * 6) | 0]]); }
    else if (t < o[0] + o[1] + o[2]) { const kk = 0.8 + R() * 0.5; if (d < YARI + 6.5 || !cvBos(x, z, 2.2)) continue; cvYasak.push([x, z, 2.6]); palmiye.push([x, 0, z, kk, kk * (0.9 + R() * 0.25), kk, R() * 6.28, PALM[(R() * 4) | 0]]); if (d < 45) golge.push([x - 0.9, 0.012, z + 0.6, 2.6 * kk, 1, 1.9 * kk, -0.4]); }
    else if (t < o[0] + o[1] + o[2] + o[3]) { const kk = (b === 2 ? 0.8 + R() * R() * 3.2 : 0.4 + R() * 1.1) * (k ? 1.3 : 0.8); if (d < YARI + 4.6 + kk || !cvBos(x, z, kk)) continue; cvYasak.push([x, z, kk]); kaya.push([x, kk * 0.28, z, kk, kk * (0.6 + R() * 0.5), kk * (0.8 + R() * 0.4), R() * 6.28, b === 2 ? KIZIL[(R() * 4) | 0] : b === 4 ? [0xe3d2ae, 0xf2e6c8, 0xd9c69c][(R() * 3) | 0] : [0xd9a868, 0xcf9a5c, 0xe6bb7c][(R() * 3) | 0]]); }
    else { const kk = 0.6 + R() * 0.8; if (cvBos(x, z, 0.3)) ot.push([x, 0, z, kk, kk, kk, R() * 6.28, [0xd9c36a, 0xc9b85c, 0xe6d27e, 0xb9c26a][(R() * 4) | 0]]); }
  }
  { // büyük kaktüs: kollu, çiçekli, güler yüzlü
    const B = cvYapi(), e = (g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt) => B.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt);
    const cicek = (x, y, z, k) => { e(cvG.petal, x, y, z, 0.2 * k, 0.12 * k, 0.2 * k, 0xff7fb0); if (k > 1) e(cvG.ufak, x, y + 0.07 * k, z, 0.08 * k, 0.07 * k, 0.08 * k, 0xffe066); else e(cvG.petal, x, y + 0.05 * k, z, 0.09 * k, 0.1 * k, 0.09 * k, 0xffe066); };
    e(clSil, 0, 1.6, 0, 0.42, 3.2, 0.42, 0xffffff, 0, 0, 0, 1); e(cvG.yarimK, 0, 3.2, 0, 0.42, 0.45, 0.42, 0xffffff, 0, 0, 0, 1); cicek(0, 3.62, 0, 1.1);
    e(clSil, 0.68, 1.75, 0, 0.21, 0.7, 0.21, 0xffffff, 0, 0, PI / 2, 1); e(cvG.ufak, 1.03, 1.75, 0, 0.23, 0.23, 0.23, 0xffffff, 0, 0, 0, 1); e(clSil, 1.03, 2.3, 0, 0.21, 1.1, 0.21, 0xffffff, 0, 0, 0, 1); e(cvG.yarimK, 1.03, 2.85, 0, 0.21, 0.24, 0.21, 0xffffff, 0, 0, 0, 1); cicek(1.03, 3.06, 0, 0.75);
    e(clSil, -0.64, 1.15, 0, 0.19, 0.6, 0.19, 0xffffff, 0, 0, PI / 2, 1); e(cvG.ufak, -0.94, 1.15, 0, 0.21, 0.21, 0.21, 0xffffff, 0, 0, 0, 1); e(clSil, -0.94, 1.55, 0, 0.19, 0.8, 0.19, 0xffffff, 0, 0, 0, 1); e(cvG.yarimK, -0.94, 1.95, 0, 0.19, 0.22, 0.19, 0xffffff, 0, 0, 0, 1); cicek(-0.94, 2.14, 0, 0.7);
    for (const x of [-1, 1]) { e(cvG.ufak, x * 0.16, 2.55, 0.39, 0.055, 0.07, 0.04, GOZ); e(cvG.ufak, x * 0.27, 2.36, 0.34, 0.08, 0.05, 0.03, 0xff9fb0); }
    e(cvG.kutu, 0, 2.33, 0.41, 0.16, 0.035, 0.03, GOZ);
    if (sag.length) cok(B.geo(), cvMalz(0), sag);
  }
  { // fıçı kaktüs: dilimli top, tepesinde renkli çiçek
    const B = cvYapi(), e = (g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt) => B.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt);
    e(cvG.kureK, 0, 0.45, 0, 0.5, 0.5, 0.5, 0x58b564); for (let k = 0; k < 2; k++) e(cvG.kureK, 0, 0.45, 0, 0.1, 0.53, 0.54, 0x86d78c, 0, k * PI / 2 + 0.4);
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832; e(cvG.petal, Math.cos(a) * 0.15, 0.95, Math.sin(a) * 0.15, 0.13, 0.09, 0.13, 0xffffff, 0, 0, 0, 1); } e(cvG.ufak, 0, 1.0, 0, 0.09, 0.07, 0.09, 0xffe066);
    e(cvG.ufak, 0.55, 0.26, 0.2, 0.28, 0.28, 0.28, 0x4faa5c); e(cvG.petal, 0.55, 0.53, 0.2, 0.12, 0.09, 0.12, 0xffffff, 0, 0, 0, 1);
    if (fici.length) cok(B.geo(), cvMalz(0), fici);
  }
  { // palmiye: kıvrık gövde, sarkan yapraklar; rüzgârda salınır
    const B = cvYapi(), e = (g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt) => B.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt);
    for (let k = 0; k < 5; k++) e(cvG.govde, k * k * 0.065, 0.72 + k * 1.42, 0, 0.34 - k * 0.03, 1.5, 0.34 - k * 0.03, k % 2 ? 0xb07a45 : 0xc68f58, 0, k * 0.6, -0.085 * k);
    const tx = 1.25, ty = 7.15;
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.2832 + 0.2, egim = k % 2 ? 0.62 : 0.3, r = 1.55; e(cvG.ufak, tx + Math.cos(a) * r * Math.cos(egim), ty - Math.sin(egim) * r + 0.25, Math.sin(a) * r * Math.cos(egim), 1.75, 0.09, 0.46, 0xffffff, 0, -a, -egim, 1); }
    e(cvG.ufak, tx, ty + 0.2, 0, 0.4, 0.3, 0.4, 0xffffff, 0, 0, 0, 1); for (let k = 0; k < 2; k++) e(cvG.ufak, tx + Math.cos(k * 2.1) * 0.3, ty - 0.2, Math.sin(k * 2.1) * 0.3, 0.2, 0.2, 0.2, 0x8a5a34);
    if (palmiye.length) cok(B.geo(), cvMalz(1), palmiye);
  }
  if (kaya.length) cok(cvG.ufak, mat(0xffffff, { flatShading: true }), kaya);
  { const B = cvYapi(); for (let k = 0; k < 5; k++) { const a = k * 1.3; B.ekle(cvG.ucgen, Math.cos(a) * 0.16, 0.3, Math.sin(a) * 0.16, 0.07, 0.6 + (k % 3) * 0.15, 0.07, 0xffffff, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35, 1); } if (ot.length) cok(B.geo(), cvMalz(1), ot); }
  // kum tepeleri: yakında alçak, uzakta büyük ve yumuşak
  for (let k = 0; k < 150; k++) {
    const a = R() * 6.2832, rr = 40 + R() * 330, x = Math.cos(a) * rr, z = -70 + Math.sin(a) * rr, d = yakin(x, z), r = 7 + R() * 14 + (d > 80 ? 14 + R() * 22 : 0), h = r * (0.16 + R() * 0.14);
    if (d < YARI + 5 + r * 1.05 || !cvBos(x, z, r * 0.8)) continue;
    kumul.push([x, -0.05, z, r * 1.5, h, r, R() * 3.14, KUM[(R() * 4) | 0]]);
  }
  if (kumul.length) cok(cvG.yarim, mat(0xffffff), kumul);
  // uzak manzara: katman katman masa tepeler
  for (let k = 0; k < 30; k++) {
    const kat = k % 3, a = k / 30 * 6.2832 + R() * 0.12, rr = 320 + kat * 80 + R() * 30, r = 24 + R() * 26 + kat * 10, h = 22 + R() * 24 + kat * 13;
    mesaUzak.push([Math.cos(a) * rr, -1, -70 + Math.sin(a) * rr, r * (1 + R() * 0.8), h, r, R() * 3.14, [0xfff0e2, 0xffe2cc, 0xf8d0bc][kat]]);
  }
  { const B = cvYapi(), e = (g, y, r, h, c) => B.ekle(g, 0, y, 0, r, h, r, c, 0, 0, 0, 1);
    e(cvG.govdeK, 0.3, 1, 0.6, KIZIL[0]); e(cvG.govdeK, 0.67, 0.8, 0.14, 0xf0b070); e(cvG.govdeK, 0.87, 0.64, 0.26, KIZIL[2]); B.ekle(cvG.govdeK, 1.0, 0.2, 0.2, 0.42, 0.4, 0.42, KIZIL[1], 0, 0, 0, 1); B.ekle(cvG.govdeK, -0.85, 0.15, -0.4, 0.5, 0.3, 0.45, KIZIL[3], 0, 0, 0, 1);
    cok(B.geo(), cvMalz(0), mesaUzak); }
  { // birkaç şeftali rengi bulut
    const B = cvYapi(), l = []; B.ekle(cvG.tac, 0, 0, 0, 12, 4.5, 8, 0xfff1dc); B.ekle(cvG.tac, -9, -1, 0, 8, 3.2, 6, 0xffe6c8); B.ekle(cvG.tac, 9, -1, 1, 8, 3.2, 6, 0xffe6c8);
    for (let k = 0; k < 9; k++) { const a = k / 9 * 6.2832 + 0.3, r = 210 + (k % 3) * 70, b = 1.3 + (k % 4) * 0.4; l.push([Math.cos(a) * r, 95 + (k % 4) * 14, -70 + Math.sin(a) * r, b, b, b, -a]); }
    cok(B.geo(), new T.MeshBasicMaterial({ vertexColors: true, fog: false }), l);
  }

  // ───────── tek parça yapılar, kumaşlar, gölgeler, kum pırıltıları ─────────
  { const m = new T.Mesh(S.geo(), cvMalz(0)); m.frustumCulled = false; scene.add(m); }
  { const m = new T.Mesh(W.geo(), cvMalz(clBayrakMod, { side: T.DoubleSide })); m.frustumCulled = false; scene.add(m); }
  { const d = tuvalDoku(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(120,62,30,.30)'); r.addColorStop(0.45, 'rgba(120,62,30,.15)'); r.addColorStop(1, 'rgba(120,62,30,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    const g = new T.PlaneGeometry(2, 2); g.rotateX(-PI / 2); const sh = cok(g, new T.MeshBasicMaterial({ map: d, transparent: true, depthWrite: false }), golge); sh.renderOrder = 1; }
  { // kumda ara sıra parlayan küçük pırıltılar: sabit noktalar, hareket tamamen GPU'da
    const n = 520, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const q = cvKenar((R() * N) | 0, R() < 0.5 ? -1 : 1, YARI + 3.6 + R() * 13); pos[i * 3] = q.x + (R() - 0.5) * 2; pos[i * 3 + 1] = 0.12 + R() * 0.2; pos[i * 3 + 2] = q.z + (R() - 0.5) * 2; if (yakin(pos[i * 3], pos[i * 3 + 2]) < YARI + 3.3) pos[i * 3 + 1] = -5; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    const m = new T.ShaderMaterial({ uniforms: { cvT: cvZ }, transparent: true, depthWrite: false,
      vertexShader: 'uniform float cvT;varying float cvA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;float f=position.x*3.7+position.z*5.3;float p=pow(max(0.0,sin(cvT*1.7+f)),10.0);gl_PointSize=clamp(150.0/max(2.0,-mv.z),1.5,7.0)*(0.5+p);cvA=p*(1.0-smoothstep(30.0,70.0,-mv.z));}',
      fragmentShader: 'varying float cvA;void main(){vec2 q=abs(gl_PointCoord-vec2(.5))*2.0;float d=1.0-smoothstep(0.0,1.0,q.x+q.y+min(q.x,q.y)*2.5);gl_FragColor=vec4(vec3(1.0,0.97,0.82),cvA*d);if(gl_FragColor.a<.01)discard;\n#include <colorspace_fragment>\n}' });
    const pts = new T.Points(g, m); pts.frustumCulled = false; scene.add(pts);
  }
}

function cevreEkGuncelle(dt, t) { }   // bütün hareket gölgelendiricide (cvZ) ve cevre.js'teki cvDegirmen döngüsünde: burada kare başına iş yok
