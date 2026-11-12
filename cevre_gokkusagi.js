/* Gökkuşağı Yolu pistinin çevresi (yalnız ?pist=gokkusagi iken yüklenir, cevre.js'ten sonra).
   cevre.js ortak tabanı kurar (gök dokusu scene.background, sis scene.fog, ışıklar cvGokIsik + gunes, zemin `zemin` + `cimDoku`, güneş `cvGunes`);
   bu dosya onları kendi temasına göre değiştirir ve süslerini ekler. cevreEkGuncelle(dt, t) her karede çağrılır.
   Tema: bulutların üstünde gökyüzü pisti. Bölgeler (pist boyunca): 0 bayraklı başlangıç + bulut kuleleri · 1 gökkuşağı bahçesi · 2 balon şenliği + uçurtmalar
   · 3 bulut şatosu krallığı · 4 şelaleli uçan adacıklar · 5 yıldız ve ay tarlası. Yeni üst düzey adlar `gk` ile başlar. Bütün yerler yol verisinden hesaplanır. */
'use strict';
let gkBulut = null, gkKus = null, gkHava = null;
function cevreEkGuncelle(dt, t) {
  if (gkBulut) gkBulut.rotation.y = t * 0.007;                         // gökteki bulutlar kayar
  if (gkKus) gkKus.rotation.y = t * 0.09;                              // kuş sürüsü süzülür
  if (gkHava) gkHava.rotation.y = t * 0.022;                           // zeplin ve uçaklar tur atar
  if (cvTema === 'gokkusagi') { cimDoku.offset.x = t * 0.0011; cimDoku.offset.y = t * 0.0006; }   // bulut denizi ağır ağır akar
}
if (cvTema === 'gokkusagi') {
  const BEYAZ = 0xffffff, PEMBE = 0xffa9cf, LILA = 0xc7a8ff, MAVI = 0x8fd0ff, SARI = 0xffe066, NANE = 0x9be8c8, KOYU = 0x4a3350, ALTIN = 0xffd24a;
  const GK = [0xff5c6c, 0xff9a3c, 0xffe14d, 0x6fdc7a, 0x4db8ff, 0x6c78ff, 0xb884ff].map(c => { const k = new T.Color(c); k.lerp(new T.Color(0xffffff), 0.14); return k.getHex(); });   // gökkuşağı (biraz pastel)
  const TON = [0xffffff, 0xffeef6, 0xfff6ea, 0xf1ecff, 0xeef8ff, 0xffffff];             // bulut tonları
  const sec = l => l[(R() * l.length) | 0];
  let mx = 0, mz = 0; for (let i = 0; i < N; i++) { mx += PX[i] / N; mz += PZ[i] / N; }   // pistin ortası

  // ───────── gök, sis, ışık, gülen güneş ─────────
  {
    const c = scene.background.image, g = c.getContext('2d'), h = c.height, gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#62b4f5'); gr.addColorStop(0.24, '#9bd3fb'); gr.addColorStop(0.42, '#cfe6ff'); gr.addColorStop(0.53, '#ffd9e8'); gr.addColorStop(0.61, '#ffe8d2'); gr.addColorStop(0.7, '#fff3ea'); gr.addColorStop(1, '#fff6fb');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, h); scene.background.needsUpdate = true;
  }
  scene.fog.color.setHex(0xffeef4);
  cvGokIsik.color.setHex(0xffffff); cvGokIsik.groundColor.setHex(0xffd6e6); cvGokIsik.intensity = 1.22;
  gunes.color.setHex(0xfff0d6); gunes.intensity = 1.3;
  {
    const c = cvGunes.material.map.image, g = c.getContext('2d'), w = c.width, m = w / 2;
    g.clearRect(0, 0, w, w);
    const gr = g.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, 'rgba(255,246,190,.9)'); gr.addColorStop(0.5, 'rgba(255,240,180,.28)'); gr.addColorStop(1, 'rgba(255,240,180,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.fillStyle = '#ffc93a';
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832; g.beginPath(); g.moveTo(m + Math.cos(a - 0.13) * 56, m + Math.sin(a - 0.13) * 56); g.lineTo(m + Math.cos(a) * 86, m + Math.sin(a) * 86); g.lineTo(m + Math.cos(a + 0.13) * 56, m + Math.sin(a + 0.13) * 56); g.fill(); }
    const d = g.createRadialGradient(m - 12, m - 14, 4, m, m, 54); d.addColorStop(0, '#fff3a8'); d.addColorStop(1, '#ffd23f');
    g.fillStyle = d; g.beginPath(); g.arc(m, m, 52, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,120,130,.55)'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(m + sx * 31, m + 13, 9, 0, 7); g.fill(); }
    g.fillStyle = '#6b3d1c'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(m + sx * 18, m - 8, 5.5, 7.5, 0, 0, 7); g.fill(); }
    g.strokeStyle = '#6b3d1c'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.arc(m, m + 3, 23, 0.16 * Math.PI, 0.84 * Math.PI); g.stroke();
    cvGunes.material.map.needsUpdate = true; cvGunes.material.color.setHex(0xffffff);
  }

  // ───────── zemin: pamuk gibi beyaz-pembe bulut denizi ─────────
  {
    const c = cimDoku.image, g = c.getContext('2d'), w = c.width, h = c.height;
    g.globalAlpha = 1; g.fillStyle = '#fff4f8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = R() * w, y = R() * h, r = 26 + R() * 50;
      for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) {
        if (x + ox < -r || x + ox > w + r || y + oy < -r || y + oy > h + r) continue;
        const gr = g.createRadialGradient(x + ox, y + oy - r * 0.25, r * 0.1, x + ox, y + oy, r);
        gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.55, 'rgba(255,255,255,.5)'); gr.addColorStop(0.82, ['rgba(255,196,224,.2)', 'rgba(214,206,255,.2)', 'rgba(255,222,200,.18)'][i % 3]); gr.addColorStop(1, 'rgba(255,230,240,0)');   // süt beyazı pofuduk tümsekler, kenarda çok hafif pastel gölge (çizgi çizgi damar yok)
        g.fillStyle = gr; g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill();
      }
    }
    for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(6 + R() * (w - 12), 6 + R() * (h - 12), 1 + R() * 1.6, 0, 7); g.fill(); }
    cimDoku.needsUpdate = true; cimDoku.repeat.set(30, 30);
    const p = zemin.geometry.attributes.position, col = zemin.geometry.attributes.color, RK = [[1, 0.955, 0.98], [0.965, 0.955, 1], [0.955, 0.98, 1], [1, 0.975, 0.95], [1, 0.965, 0.985]];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = -p.getY(i) - 70, a = (Math.atan2(z - mz, x - mx) / 6.2832 + 0.5) * 5 + 0.5 * Math.sin(x * 0.012 + z * 0.016), k = Math.floor(a);
      let f = a - k; f = f * f * (3 - 2 * f);
      const A = RK[((k % 5) + 5) % 5], B = RK[(((k + 1) % 5) + 5) % 5], v = 0.97 + 0.03 * Math.sin(x * 0.021 + z * 0.017);
      col.setXYZ(i, lerp(A[0], B[0], f) * v, lerp(A[1], B[1], f) * v, lerp(A[2], B[2], f) * v);
    }
    col.needsUpdate = true; zemin.material.emissive.setHex(0x30262b);
  }

  // ───────── hareket: bulutlar soluk alır gibi kabarır, balon ve yıldızlar süzülür (hepsi gölgelendiricide) ─────────
  const gkNefes = cvHAREKET.length;
  cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.21 + instanceMatrix[3].z * 0.17;\ntransformed.xz *= 1.0 + 0.035 * sin(cvT * 0.9 + cvF); transformed.y *= 1.0 + 0.07 * sin(cvT * 0.7 + cvF * 1.3);\n#endif');
  const gkSuz = cvHAREKET.length;
  cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.27;\ntransformed.y += sin(cvT * 0.8 + cvF) * 0.45; transformed.x += sin(cvT * 0.45 + cvF * 1.7) * 0.3;\n#endif');

  const S = cvYapi(), bulut = [], puf = [], golge = [], balon = [], ucurtma = [], yildiz = [];
  const bolge = i => { const f = (((i % N) + N) % N) / N; return f < 0.06 || f >= 0.94 ? 0 : f < 0.24 ? 1 : f < 0.42 ? 2 : f < 0.60 ? 3 : f < 0.78 ? 4 : 5; };
  const bl = (x, z, s, y) => bulut.push([x, y || 0, z, s, s * (0.85 + R() * 0.3), s, R() * 6.28, sec(TON)]);   // kabarık bulut öbeği (yarıçap ≈ 2,3·s)
  const kule = (x, z, s, kat) => { for (let k = 0; k < kat; k++) { const u = s * (1 - k * 0.2); bulut.push([x + (R() - 0.5) * s, k * s * 1.25, z + (R() - 0.5) * s, u, u * 1.05, u, R() * 6.28, sec(TON)]); } };
  const yer = (i, yan, uz, r, donuk) => {   // pist kenarında boş yer bul (yola ve başka süslere taşmaz)
    for (let k = 0; k < 8; k++) {
      const p = cvKenar(i + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 5, yan, uz, donuk || 0), x = p.x, z = p.z, ry = p.ry;
      if (yakin(x, z) > YARI + 3.4 + r && cvBos(x, z, r)) { cvYasak.push([x, z, r + 0.5]); return { x, z, ry }; }
    }
    return null;
  };

  // ───────── gökkuşağı kemeri: yedi renkli yarım halka ─────────
  // tek parça yumuşak gökkuşağı: tombul yuvarlak kesitli bant, renkler birbirine akar, kenarlar açık pastel (karton şerit değil)
  const gkYayGeo = (() => {
    const NU = 30, NV = 10, rc = 0.82, ra = 0.215, rb = 0.04, pos = [], nor = [], col = [], kk = [], c = new T.Color(), c2 = new T.Color(), ac = new T.Color(0xffffff), RK = GK.slice();
    const P = (u, v) => { const a = u / NU * Math.PI, b = v / NV * 6.2832, cv = Math.cos(b), sv = Math.sin(b), rr = rc + ra * cv; const nx = cv / ra, nz = sv / rb, l = Math.hypot(nx, nz);
      const t = (1 - (cv + 1) / 2) * 6, k = Math.min(5, Math.floor(t)); c.setHex(RK[k]); c2.setHex(RK[k + 1]); c.lerp(c2, t - k); c.lerp(ac, 0.32 * Math.pow(Math.abs(cv), 6));
      return [rr * Math.cos(a), rr * Math.sin(a), rb * sv, nx / l * Math.cos(a), nx / l * Math.sin(a), nz / l, c.r, c.g, c.b]; };
    for (let u = 0; u < NU; u++) for (let v = 0; v < NV; v++) for (const [du, dv] of [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]]) { const q = P(u + du, v + dv); pos.push(q[0], q[1], q[2]); nor.push(q[3], q[4], q[5]); col.push(q[6], q[7], q[8]); kk.push(0, 0, 0); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setAttribute('cvK', new T.Float32BufferAttribute(kk, 3)); return g;
  })();
  const gkYayL = [];
  const kemer = (x, z, ry, r, kalin, y) => gkYayL.push([x, (y || -0.2), z, r, r, r * (kalin || 2), ry]);
  // yolun üstünden geçen dev kemerler: ayaklar yolun dışında, bulutların içinde
  for (const f of [0.115, 0.44, 0.73]) {   // sade: yalnız üç dev kemer
    for (let k = 0; k < 14; k++) {
      const i = (cvI(f) + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 5 + N) % N, r = 18.5; let iyi = true;
      for (const yan of [-1, 1]) for (const u of [0.6, 0.8, 1.02]) { const p = cvKenar(i, yan, r * u); if (yakin(p.x, p.z) < YARI + 3.3) iyi = false; }
      if (!iyi) continue;
      kemer(PX[i], PZ[i], Math.atan2(-TX[i], -TZ[i]), r, 2.4);
      for (const yan of [-1, 1]) { const p = cvKenar(i, yan, r * 0.82), x = p.x, z = p.z; bl(x, z, 1.5); cvYasak.push([x, z, 5.5]); const q = cvKenar(i, yan, r * 1.02), qx = q.x, qz = q.z; bl(qx, qz, 1.25); }
      break;
    }
  }

  // ───────── bulut şatosu ─────────
  const sato = (q, s) => {
    S.yer(q.x, q.z, q.ry, s);
    const DUVAR = 0xfff3f9, PENCERE = 0x8fd0ff;
    S.ekle(cvG.sil, 0, 5, 0, 3.4, 8, 3.4, DUVAR); S.ekle(cvG.koni, 0, 11.4, 0, 4.1, 5, 4.1, PEMBE); S.ekle(cvG.kure, 0, 14.1, 0, 0.36, 0.36, 0.36, ALTIN);
    [[-6, 3.4, LILA, 9], [6, 3.4, MAVI, 9], [-5, -4, NANE, 11], [5, -4, SARI, 11]].forEach((k, n) => {
      S.ekle(cvG.sil, k[0], 1 + k[3] / 2, k[1], 1.7, k[3], 1.7, DUVAR); S.ekle(cvG.sil, k[0], 1 + k[3], k[1], 2.0, 0.5, 2.0, BEYAZ); S.ekle(cvG.koni, k[0], 3 + k[3], k[1], 2.2, 3.6, 2.2, k[2]);
      S.ekle(cvG.sil5, k[0], 5.6 + k[3], k[1], 0.07, 1.8, 0.07, BEYAZ); S.ekle(cvG.ucgen, k[0] + 0.6, 6 + k[3], k[1], 0.75, 0.42, 0.05, GK[(n * 2) % 7], 0, 0, -Math.PI / 2, 0, 1);
      S.ekle(cvG.kutu, k[0], k[3] * 0.72, k[1] + 1.68, 0.7, 1.1, 0.12, PENCERE); S.ekle(cvG.kutu, k[0], k[3] * 0.38, k[1] + 1.68, 0.7, 1.1, 0.12, PENCERE);
    });
    S.ekle(cvG.kutu, 0, 3, 3.4, 10.5, 4, 1, DUVAR); for (let k = -4; k <= 4; k += 2) S.ekle(cvG.kutu, k * 1.05, 5.3, 3.4, 0.9, 0.7, 1.05, BEYAZ);
    S.ekle(cvG.kutu, 0, 2.3, 3.95, 2.3, 2.7, 0.14, 0xff8fbd); S.ekle(cvG.sil, 0, 3.65, 3.95, 1.15, 0.14, 1.15, 0xff8fbd, Math.PI / 2); S.ekle(cvG.kureK, 0.6, 2.2, 4.08, 0.12, 0.12, 0.08, ALTIN);
    for (const sx of [-1, 1]) { S.ekle(cvG.kutu, sx * 1.3, 8.2, 3.2, 0.8, 1.3, 0.14, PENCERE); S.ekle(cvG.kutu, sx * 3.3, 3.4, 3.93, 0.9, 1.2, 0.12, PENCERE); }
    S.ekle(cvG.kutu, 0, 6.4, 3.34, 0.9, 1.4, 0.14, PENCERE);
    for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, p = S.dunya(Math.cos(a) * 8.6, Math.sin(a) * 7.4 - 0.5); bulut.push([p.x, -0.6, p.z, 2.3 * s, 1.5 * s, 2.3 * s, R() * 6, sec(TON)]); }
    for (const a of [-13, 13]) { const p = S.dunya(a, -5.5); bulut.push([p.x, 0, p.z, 2 * s, 1.6 * s, 2 * s, 0, BEYAZ]); }
    { const p = S.dunya(0, -5.5); kemer(p.x, p.z, q.ry, 15 * s, 1.6, 0.5 * s); }   // şatonun arkasından doğan gökkuşağı
  };
  {
    let en = null;
    for (const uz of [40, 34, 28]) { if (en) break; for (let i = cvI(0.45); i < cvI(0.58) && !en; i += 4) for (const yan of [1, -1]) { const p = cvKenar(i, yan, YARI + uz, 0.5); if (yakin(p.x, p.z) > YARI + uz - 6 && cvBos(p.x, p.z, 16)) { en = { x: p.x, z: p.z, ry: p.ry, s: uz / 34 }; break; } } }
    if (en) { cvYasak.push([en.x, en.z, 19 * en.s]); sato(en, Math.min(1.25, en.s * 1.1)); }
  }
  // bulut kule nöbetçileri (başlangıçta ve şato bölgesinde)
  const minikKule = (q, renk, s) => {
    S.yer(q.x, q.z, q.ry, s);
    S.ekle(cvG.sil, 0, 3, 0, 1.25, 5, 1.25, 0xfff3f9); S.ekle(cvG.sil, 0, 5.5, 0, 1.5, 0.4, 1.5, BEYAZ); S.ekle(cvG.koni, 0, 7.1, 0, 1.7, 2.8, 1.7, renk); S.ekle(cvG.kutu, 0, 3.7, 1.22, 0.6, 0.95, 0.12, 0x8fd0ff);
    S.ekle(cvG.sil5, 0, 9.2, 0, 0.06, 1.5, 0.06, BEYAZ); S.ekle(cvG.ucgen, 0.55, 9.55, 0, 0.7, 0.4, 0.05, sec(GK), 0, 0, -Math.PI / 2, 0, 1);
    for (let k = 0; k < 4; k++) { const a = k * 1.571 + 0.6, p = S.dunya(Math.cos(a) * 1.5, Math.sin(a) * 1.5); bulut.push([p.x, -0.3, p.z, 0.9 * s, 0.7 * s, 0.9 * s, R() * 6, BEYAZ]); }
  };
  [[0.975, PEMBE], [0.5, LILA]].forEach((k, n) => { for (const yan of [-1, 1]) { const q = yer(cvI(k[0]), yan, YARI + 8.5 + (n > 1 ? 6 : 0), 2.6, 0.3); if (q) minikKule(q, yan > 0 ? k[1] : GK[(n * 2 + 6) % 7], 1 + (n > 1 ? 0.25 : 0)); } });

  // ───────── gökkuşağı bayrak ipleri (bulut direkli) ─────────
  const bayrakIpi = (i0, i1, yan) => {
    S.yer(0, 0, 0, 1); let ox = 0, oz = 0, var_ = false, n = 0;
    for (let i = i0; i <= i1; i += 9) {
      const p = cvKenar(i, yan, YARI + 4.5), x = p.x, z = p.z;
      if (yakin(x, z) < YARI + 3.9 || !cvBos(x, z, 0.5)) { var_ = false; continue; }
      cvYasak.push([x, z, 0.9]);
      S.ekle(cvG.sil5, x, 1.9, z, 0.13, 3.8, 0.13, BEYAZ); S.ekle(cvG.kureK, x, 3.9, z, 0.24, 0.24, 0.24, ALTIN); bulut.push([x, -0.25, z, 0.42, 0.36, 0.42, R() * 6, BEYAZ]);
      if (var_) for (let k = 1; k <= 5; k++) { const u = k / 6, a = Math.atan2(x - ox, z - oz) + Math.PI / 2; S.ekle(cvG.ucgen, lerp(ox, x, u), 3.5 - Math.sin(u * Math.PI) * 0.75, lerp(oz, z, u), 0.42, 0.7, 0.07, GK[(n++) % 7], Math.PI, a, 0, 0, 1); }
      ox = x; oz = z; var_ = true;
    }
  };
  for (const yan of [-1, 1]) bayrakIpi(cvI(0.96), N + cvI(0.04), yan);   // sade: yalnız başlangıçta

  // ───────── virajlarda yazısız ok tabelaları (bulut direkli) ─────────
  {
    let son = -99, adet = 0;
    for (let i = 0; i < N; i += 3) {
      let k = 0; for (let j = -10; j <= 10; j += 2) k += KAP[(i + j + N) % N]; k /= 11;
      if (Math.abs(k) < 0.0125 || i - son < 60 || adet > 7) continue;
      const yon = k > 0 ? 1 : -1, q = yer(i, -yon, YARI + 5, 1.6, 3); if (!q) continue;
      son = i; adet++;
      S.yer(q.x, q.z, q.ry, 1.15);
      for (const sx of [-1, 1]) { S.ekle(cvG.sil5, sx * 1.15, 1.2, 0, 0.14, 2.4, 0.14, BEYAZ); const p = S.dunya(sx * 1.15, 0); bulut.push([p.x, -0.3, p.z, 0.5, 0.42, 0.5, R() * 6, BEYAZ]); }
      S.ekle(cvG.kutu, 0, 3, -0.03, 3.5, 1.75, 0.2, BEYAZ); S.ekle(cvG.kutu, 0, 3, 0.04, 3.2, 1.45, 0.2, [0x4aa8ff, 0xff7fb5, 0x9a7cff][adet % 3]);
      for (let c = 0; c < 3; c++) { const cx = yon * (-0.95 + c * 0.85); S.ekle(cvG.kutu, cx, 3.25, 0.17, 0.78, 0.22, 0.08, c === 2 ? SARI : BEYAZ, 0, 0, -yon * 0.75); S.ekle(cvG.kutu, cx, 2.75, 0.17, 0.78, 0.22, 0.08, c === 2 ? SARI : BEYAZ, 0, 0, yon * 0.75); }
      golge.push([q.x, 0.012, q.z, 2.2, 1, 1.1, 0]);
    }
  }

  // ───────── uçan adacık (şelaleli) ─────────
  const ada = (x, z, h, s, ry) => {
    S.yer(x, z, ry, s);
    S.ekle(cvG.sil, 0, h, 0, 4, 0.9, 4, 0x8fe07a, 0, 0, 0, 0, 0, 1); S.ekle(cvG.sil, 0, h - 0.5, 0, 4.15, 0.5, 4.15, 0xd9b384, 0, 0, 0, 0, 0, 1); S.ekle(cvG.koni, 0, h - 3.4, 0, 3.9, 5.4, 3.9, 0xc79a6c, Math.PI, 0, 0, 0, 0, 1);
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4; S.ekle(cvG.kure, Math.cos(a) * 3.4, h - 1.5, Math.sin(a) * 3.4, 1.7, 1.1, 1.7, BEYAZ, 0, 0, 0, 0, 0, 1); }
    S.ekle(cvG.sil5, -1.6, h + 1.4, -0.8, 0.22, 2, 0.22, 0xa8744a, 0, 0, 0, 0, 0, 1); S.ekle(cvG.ico, -1.6, h + 3.2, -0.8, 1.5, 1.4, 1.5, sec([0xff9ec7, 0x7fd67a, 0xffc0dc]), 0, 0, 0, 0, 0, 1);
    S.ekle(cvG.sil5, 1.4, h + 1.0, -1.6, 0.16, 1.4, 0.16, 0xa8744a, 0, 0, 0, 0, 0, 1); S.ekle(cvG.kure, 1.4, h + 2.2, -1.6, 1.0, 0.95, 1.0, 0x7fd67a, 0, 0, 0, 0, 0, 1);
    S.ekle(cvG.kutu, 0.9, h + 1.0, 1.2, 1.5, 1.2, 1.3, 0xfff3d6, 0, 0, 0, 0, 0, 1); S.ekle(cvG.cati, 0.9, h + 1.6, 1.2, 0.36, 0.5, 0.36, sec(GK), 0, 0, 0, 0, 0, 1);
    S.ekle(cvG.kutu, 0, h - 0.1, 3.3, 1.5, 0.5, 1.6, 0x9fdcff, 0, 0, 0, 0, 0, 1); S.ekle(cvG.kutu, 0, h / 2 - 0.2, 4.05, 1.4, h, 0.28, 0xaee4ff); S.ekle(cvG.kutu, 0.3, h / 2 - 0.2, 4.12, 0.3, h, 0.28, BEYAZ);
    const p = S.dunya(0, 4.2), px = p.x, pz = p.z; bulut.push([px, -0.2, pz, 0.85 * s, 0.6 * s, 0.85 * s, R() * 6, BEYAZ]); const o = S.dunya(0, 0); golge.push([o.x, 0.012, o.z, 4.6 * s, 1, 4.6 * s, 0]);
  };
  for (let i = cvI(0.605); i < cvI(0.78); i += 11) for (const yan of [-1, 1]) {
    if (R() < 0.25) continue; const s = 0.7 + R() * 0.5, q = yer(i, yan, YARI + 10 + R() * 26, 5 * s, 0.4);
    if (q) ada(q.x, q.z, 5.5 + R() * 9, s, q.ry);
  }

  // ───────── yıldız ve ay biçimleri ─────────
  const gkYildizGeo = (() => { const sh = new T.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.2832 + Math.PI / 2, r = k % 2 ? 0.46 : 1; if (k) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const g = new T.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false }); g.translate(0, 0, -0.15); return g; })();
  const gkAyGeo = (() => { const pts = []; for (let k = 0; k <= 12; k++) { const a = (58.2 + k / 12 * 243.6) * Math.PI / 180; pts.push(new T.Vector2(Math.cos(a), Math.sin(a))); } for (let k = 1; k < 9; k++) { const a = (271.9 - k / 9 * 183.8) * Math.PI / 180; pts.push(new T.Vector2(0.5275 - 0.0275 + Math.cos(a) * 0.85, Math.sin(a) * 0.85)); } const g = new T.ExtrudeGeometry(new T.Shape(pts), { depth: 0.34, bevelEnabled: false }); g.translate(0, 0, -0.17); return g; })();
  const ayl = [], ay = (x, z, y, s, ry) => ayl.push([x, y * s, z, s, s, s, ry, sec([0xffe680, 0xfff0b0, 0xffd9ea])]);
  const YRENK = [0xffd84a, 0xffe680, 0xffb0d2, 0xffd84a, 0xa8ecd0];

  // ───────── seyirciler: tek boynuzlu at, pegasus tayı, kanatlı bulut yavrusu, civciv (zıplar, kanat/kuyruk sallar) ─────────
  {
    const at = (B, boynuz) => {
      B.ekle(cvG.kure, 0, 0.95, 0, 0.42, 0.42, 0.7, BEYAZ, 0, 0, 0, 1, 1);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.ekle(cvG.sil5, sx * 0.22, 0.34, sz * 0.42, 0.09, 0.68, 0.09, BEYAZ, 0, 0, 0, 1, 1);
      B.ekle(cvG.kureK, 0, 1.45, 0.55, 0.2, 0.42, 0.22, BEYAZ, 0.5, 0, 0, 1, 1); B.ekle(cvG.kure, 0, 1.84, 0.78, 0.31, 0.3, 0.36, BEYAZ, 0.2, 0, 0, 1, 1);
      B.ekle(cvG.kureK, 0, 1.73, 1.05, 0.17, 0.15, 0.16, 0xffd3e2, 0, 0, 0, 0, 1);
      for (const sx of [-1, 1]) { B.ekle(cvG.kureK, sx * 0.19, 1.92, 0.93, 0.085, 0.11, 0.06, BEYAZ, 0, 0, 0, 0, 1); B.ekle(cvG.kureK, sx * 0.195, 1.91, 0.965, 0.065, 0.085, 0.04, KOYU, 0, 0, 0, 0, 1); B.ekle(cvG.kureK, sx * 0.17, 1.95, 0.995, 0.025, 0.028, 0.015, BEYAZ, 0, 0, 0, 0, 1); B.ekle(cvG.kutu, sx * 0.23, 2.03, 0.95, 0.06, 0.018, 0.02, KOYU, 0, 0, sx * 0.5, 0, 1); B.ekle(cvG.koni6, sx * 0.15, 2.12, 0.68, 0.07, 0.22, 0.07, BEYAZ, 0, 0, 0, 1, 1); B.ekle(cvG.ufak, sx * 0.24, 1.76, 0.95, 0.06, 0.045, 0.04, PEMBE, 0, 0, 0, 0, 1); }
      for (let k = 0; k < 4; k++) B.ekle(cvG.ufak, 0, 2.06 - k * 0.22, 0.52 - k * 0.14, 0.13, 0.16, 0.16, GK[(k * 2 + (boynuz ? 0 : 3)) % 7], 0, 0, 0, 0, 1);
      for (let k = 0; k < 3; k++) B.ekle(cvG.ufak, 0, 1.1 - k * 0.22, -0.72 - k * 0.12, 0.13, 0.18, 0.13, GK[(k * 2 + (boynuz ? 4 : 1)) % 7], 0, 0, 0, 0, 1, 1);
      if (boynuz) B.ekle(cvG.koni6, 0, 2.32, 0.86, 0.075, 0.5, 0.075, ALTIN, 0.3, 0, 0, 0, 1);
      else for (const sx of [-1, 1]) B.ekle(cvG.kure, sx * 0.55, 1.4, -0.05, 0.44, 0.1, 0.26, 0xdff2ff, 0, 0, sx * 0.6, 0, 1, 1);
    };
    const A = cvYapi(), Pg = cvYapi(), Y = cvYapi(), C = cvYapi(), al = [], pl = [], yl = [], cl = [];
    at(A, true); at(Pg, false);
    // kanatlı bulut yavrusu
    Y.ekle(cvG.ico, 0, 0.85, 0, 0.6, 0.5, 0.5, BEYAZ, 0, 0, 0, 1, 1); Y.ekle(cvG.kureK, -0.5, 0.7, 0, 0.32, 0.3, 0.32, BEYAZ, 0, 0, 0, 1, 1); Y.ekle(cvG.kureK, 0.5, 0.72, 0, 0.32, 0.3, 0.32, BEYAZ, 0, 0, 0, 1, 1); Y.ekle(cvG.kureK, 0, 1.28, 0, 0.36, 0.3, 0.34, BEYAZ, 0, 0, 0, 1, 1);
    Y.ekle(cvG.kutu, 0, 0.74, 0.5, 0.16, 0.045, 0.03, KOYU, 0, 0, 0, 0, 1);
    for (const sx of [-1, 1]) { Y.ekle(cvG.ufak, sx * 0.19, 0.93, 0.46, 0.06, 0.085, 0.04, KOYU, 0, 0, 0, 0, 1); Y.ekle(cvG.ufak, sx * 0.34, 0.78, 0.42, 0.09, 0.06, 0.04, PEMBE, 0, 0, 0, 0, 1); Y.ekle(cvG.kure, sx * 0.8, 1.1, -0.1, 0.34, 0.1, 0.2, MAVI, 0, 0, sx * 0.5, 0, 1, 1); Y.ekle(cvG.ufak, sx * 0.2, 0.3, 0.08, 0.13, 0.12, 0.17, 0xffd3e2, 0, 0, 0, 0, 1); }
    // civciv
    C.ekle(cvG.kure, 0, 0.6, 0, 0.44, 0.46, 0.44, BEYAZ, 0, 0, 0, 1, 1); C.ekle(cvG.kureK, 0, 0.5, 0.2, 0.3, 0.32, 0.28, 0xfff6e0, 0, 0, 0, 0, 1); C.ekle(cvG.koni6, 0, 0.66, 0.5, 0.09, 0.2, 0.09, 0xff9a3c, Math.PI / 2, 0, 0, 0, 1); C.ekle(cvG.ufak, 0, 1.08, 0, 0.09, 0.15, 0.09, BEYAZ, 0, 0, 0, 1, 1);
    for (const sx of [-1, 1]) { C.ekle(cvG.ufak, sx * 0.17, 0.78, 0.38, 0.055, 0.07, 0.04, KOYU, 0, 0, 0, 0, 1); C.ekle(cvG.kureK, sx * 0.46, 0.66, 0, 0.12, 0.3, 0.22, BEYAZ, 0, 0, sx * -0.4, 1, 1, 1); C.ekle(cvG.kutu, sx * 0.15, 0.08, 0.12, 0.14, 0.07, 0.24, 0xff9a3c, 0, 0, 0, 0, 1); }
    for (let i = 5; i < N; i += 13) for (const yan of [-1, 1]) {
      if (R() < 0.72) continue; const adet = 1 + ((R() * 2) | 0), b = bolge(i);
      for (let j = 0; j < adet; j++) {
        const p = cvKenar(i + j * 2, yan, YARI + 4.9 + R() * 1.6, 0.4), x = p.x, z = p.z, ry = p.ry;
        if (yakin(x, z) < YARI + 4.4 || !cvBos(x, z, 0.8)) continue; cvYasak.push([x, z, 0.8]);
        const s = 1.15 + R() * 0.35, tur = (b + j + ((R() * 2) | 0)) % 4;
        if (tur === 0) al.push([x, 0, z, s, s, s, ry, sec([0xffffff, 0xffe6f2, 0xfff4dc, 0xe8e2ff])]);
        else if (tur === 1) yl.push([x, 0.15, z, s * 1.2, s * 1.2, s * 1.2, ry, sec([0xffffff, 0xffe2ef, 0xe6f4ff, 0xfff3d8])]);
        else if (tur === 2) pl.push([x, 0, z, s * 0.82, s * 0.82, s * 0.82, ry, sec([0xffd9ea, 0xd9ecff, 0xfff0c8, 0xe6dcff])]);
        else cl.push([x, 0, z, s * 1.15, s * 1.15, s * 1.15, ry, sec([0xffe066, 0xff9ec7, 0x8fd0ff, 0xb9f0a8, 0xffb37a])]);
        golge.push([x, 0.012, z, 0.9 * s, 1, 0.8 * s, 0]);
      }
    }
    const sm = cvMalz(2, { emissive: 0x2c2429 });   // gölgede kalan yüzler de pastel kalsın
    if (al.length) cok(A.geo(), sm, al); if (pl.length) cok(Pg.geo(), sm, pl); if (yl.length) cok(Y.geo(), sm, yl); if (cl.length) cok(C.geo(), sm, cl);
  }

  // ───────── yol boyu: bulut öbekleri + bölgeye göre süsler ─────────
  for (let i = 0; i < N; i += 5) for (const yan of [-1, 1]) for (let sira = 0; sira < 3; sira++) {   // sıra 0 yol kenarı · 1 arka sıra · 2 uzaktaki iri bulutlar
    if (R() < (sira === 2 ? 0.78 : sira ? 0.7 : 0.62)) continue;   // sade: daha seyrek, yol kenarında boşluk
    const b = bolge(i), s = sira === 2 ? 2.6 + R() * 2 : sira ? 1.2 + R() * 0.9 : 0.5 + R() * 0.35, rr = 2.3 * s;
    const p = cvKenar(i + ((R() * 5) | 0), yan, sira === 2 ? YARI + 38 + R() * 40 : sira ? YARI + 16 + R() * 16 : YARI + 7 + R() * 4.5), x = p.x, z = p.z, ry = p.ry;
    if (yakin(x, z) < YARI + 3.5 + rr || !cvBos(x, z, rr * 0.8)) continue; cvYasak.push([x, z, rr * 0.8]);
    const r = R(), yEkle = (y, k) => yildiz.push([x, y, z, k, k, k, ry + (R() - 0.5), sec(YRENK)]);
    if (sira === 0) {
      bl(x, z, s);
      if (b === 1) { if (r > 0.8) yEkle(2.6 + R() * 1.5, 0.5); }
      else if (b === 2) { if (r < 0.34) { const k = 0.8 + R() * 0.3; ucurtma.push([x, 0, z, k, k, k, ry + Math.PI + (R() - 0.5) * 0.8, sec(GK)]); } }
      else if (b === 3) { if (r < 0.4) { kule(x, z, s * 0.9, 2); S.yer(x, z, ry, 1); S.ekle(cvG.sil5, 0, 2.6, 0, 0.07, 3.4, 0.07, BEYAZ); S.ekle(cvG.ucgen, 0.55, 3.95, 0, 0.7, 0.4, 0.05, sec(GK), 0, 0, -Math.PI / 2, 0, 1); } else if (r < 0.52) yEkle(3 + R(), 0.5); }
      else if (b === 4) { if (r < 0.3) kule(x, z, s * 0.9, 2); else if (r < 0.45) yEkle(3 + R(), 0.5); }
      else if (b === 5) { if (r < 0.62) yEkle(2.4 + R() * 2.4, 0.5 + R() * 0.3); else if (r < 0.85) ay(x, z, 3.3, 0.9, ry); }
      else if (r < 0.35) yEkle(3 + R(), 0.55);
    } else if (sira === 1) {
      if (r < 0.4 || b === 3) kule(x, z, s, b === 3 ? 3 : 2); else bl(x, z, s);
      const r2 = R();
      if (b === 1 && r2 < 0.2) kemer(x, z, ry + (R() - 0.5) * 0.9, 5.5 + R() * 4, 1.8);
      else if (b === 2 && r2 < 0.25) { const k = 0.85 + R() * 0.5; balon.push([x, 8 + R() * 9, z, k, k, k, R() * 6, sec(GK)]); }
      else if (b === 5 && r2 < 0.7) { if (r2 < 0.5) yEkle(7 + R() * 6, 1 + R() * 0.7); else ay(x, z, 5.5, 1.9, ry); }
      else if (r2 < 0.1) yEkle(8 + R() * 5, 1.1);
    } else {
      kule(x, z, s, r < 0.25 ? 3 : 2);
      const r2 = R();
      if (b === 1 && r2 < 0.25) kemer(x, z, ry + (R() - 0.5) * 1.2, 13 + R() * 9, 1.6);
      else if (b === 2 && r2 < 0.35) { const k = 1.5 + R() * 0.9; balon.push([x, 20 + R() * 20, z, k, k, k, R() * 6, sec(GK)]); }
      else if (b === 5 && r2 < 0.8) { if (r2 < 0.6) yEkle(16 + R() * 14, 2 + R() * 1.2); else ay(x, z, 5.2, 4, ry); }
    }
  }
  // gökte uzak balonlar
  for (let k = 0; k < 4; k++) { const a = k / 4 * 6.283 + R() * 0.5, r = 190 + R() * 110, s = 2.4 + R() * 1.4; balon.push([mx + Math.cos(a) * r, 48 + R() * 45, mz + Math.sin(a) * r, s, s, s, R() * 6, GK[k % 7]]); }
  // ───────── pofuduk bulut adaları: yolun uzağında, havada süzülen küçük adalar; üstlerinde minik gökkuşağı, yıldız ya da kulecik ─────────
  let gkT = 90210; const Rg = () => { gkT = (gkT * 1664525 + 1013904223) >>> 0; return gkT / 4294967296; }, secg = l => l[(Rg() * l.length) | 0];   // kendi sayı üreteci: eski yerleşimi kaydırmaz
  for (let k = 0; k < 8; k++) {
    const i = cvI((k + 0.5) / 8 + (Rg() - 0.5) * 0.03), yan = k % 2 ? 1 : -1, q = cvKenar(i, yan, YARI + 24 + Rg() * 24), x = q.x, z = q.z, ry = q.ry;
    const h = 8 + Rg() * 8, s = 1.4 + Rg() * 0.7, t = k % 3;
    if (yakin(x, z) < YARI + 19) continue;
    bulut.push([x, h, z, s * 1.5, s * 0.8, s * 1.3, Rg() * 6.28, BEYAZ]);
    for (let j = 0; j < 4; j++) { const a = j * 1.571 + Rg(), u = s * (0.75 + Rg() * 0.3); bulut.push([x + Math.cos(a) * s * 2.6, h - 0.3 + Rg() * 0.5, z + Math.sin(a) * s * 2.2, u, u * 0.75, u, Rg() * 6.28, secg(TON)]); }
    golge.push([x, 0.012, z, 4.2 * s, 1, 3.6 * s, 0]);
    if (t === 0) kemer(x, z, ry, 3.1 * s, 1.8, h + s * 1.1);
    else if (t === 1) { const u = s * 0.95; yildiz.push([x, h + s * 3.1, z, u, u, u, ry, secg(YRENK)]); }
    else { S.yer(x, z, ry, s * 0.75); const y = h / (s * 0.75) + 1.4; S.ekle(cvG.sil, 0, y + 1.5, 0, 1.1, 3, 1.1, 0xfff3f9); S.ekle(cvG.koni, 0, y + 4.1, 0, 1.5, 2.3, 1.5, secg([PEMBE, LILA, MAVI, NANE])); S.ekle(cvG.kutu, 0, y + 1.9, 1.06, 0.5, 0.8, 0.12, 0x8fd0ff); }
  }
  // dönen rüzgâr gülleri (başlangıç, şenlik ve adacık bölgelerinde; dönüş gölgelendiricide)
  const gkGul = [];
  for (let i = 8; i < 0; i += 14) { const b = bolge(i); if (b === 1 || b === 3 || b === 5) continue; for (const yan of [-1, 1]) {   // sade: döngü boş (i < 0), yol kenarındaki rüzgâr gülleri kaldırıldı
    if (Rg() < 0.35) continue; const p = cvKenar(i + ((Rg() * 5) | 0), yan, YARI + 4.3, 3), x = p.x, z = p.z, ry = p.ry;
    if (yakin(x, z) < YARI + 4.0 || !cvBos(x, z, 0.5)) continue; cvYasak.push([x, z, 0.7]);
    const u = 1.15 + Rg() * 0.35; gkGul.push([x, 0, z, u, u, u, ry, secg(GK)]); bulut.push([x, -0.25, z, 0.4, 0.34, 0.4, Rg() * 6, BEYAZ]);
  } }
  // bulut denizinin kabarıklıkları (alçak, yayvan tümsekler)
  for (let k = 0; k < 110; k++) {
    const a = 4 + R() * 6, q = cvKenar((R() * N) | 0, R() < 0.5 ? -1 : 1, YARI + 4.5 + a + R() * R() * 130), x = q.x, z = q.z;
    if (yakin(x, z) < YARI + 3.6 + a) continue;
    puf.push([x, -0.05, z, a, 0.5 + R() * 0.9, a * (0.7 + R() * 0.3), R() * 6.28, sec(TON)]);
  }
  // ufuktaki bulut dağları
  for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283 + R() * 0.15, r = 300 + R() * 90, s = 15 + R() * 11; bulut.push([mx + Math.cos(a) * r, -2, mz + Math.sin(a) * r, s, s * (0.75 + R() * 0.5), s, R() * 6, sec(TON)]); if (k % 3 === 0) bulut.push([mx + Math.cos(a + 0.05) * r, s * 1.1, mz + Math.sin(a + 0.05) * r, s * 0.7, s * 0.7, s * 0.7, R() * 6, BEYAZ]); }

  // ───────── ufuk silueti: çok uzakta, sise karışmış soluk dev gökkuşakları ve bulut şatosu (tek çizim) ─────────
  {
    const U = cvYapi(), sis = new T.Color(0xffeef4), soluk = (c, o) => { const k = new T.Color(c); k.lerp(sis, o); return k.getHex(); };
    [[2.95, 128]].forEach(u => { const r = 350, x = mx + Math.cos(u[0]) * r, z = mz + Math.sin(u[0]) * r; U.yer(x, z, Math.atan2(mx - x, mz - z), 1); U.ekle(gkYayGeo, 0, -8, 0, u[1], u[1], u[1] * 2, BEYAZ); });   // ilk parça: renkleri aşağıda yumuşakça soldurulur
    [[1.95, 4.6], [5.6, 4]].forEach((u, n) => {
      const r = 335, x = mx + Math.cos(u[0]) * r, z = mz + Math.sin(u[0]) * r, D = soluk(0xffdcea, 0.35); U.yer(x, z, Math.atan2(mx - x, mz - z), u[1]);
      U.ekle(cvG.sil, 0, 9, 0, 3.2, 12, 3.2, D); U.ekle(cvG.koni, 0, 17.5, 0, 3.9, 5, 3.9, soluk(n ? LILA : PEMBE, 0.45));
      for (const sx of [-1, 1]) { U.ekle(cvG.sil, sx * 5.6, 7, 0, 1.7, 9, 1.7, D); U.ekle(cvG.koni, sx * 5.6, 13.3, 0, 2.2, 3.6, 2.2, soluk(sx > 0 ? MAVI : NANE, 0.45)); U.ekle(cvG.sil, sx * 9.6, 5.5, 0, 1.3, 6.5, 1.3, D); U.ekle(cvG.koni, sx * 9.6, 10.2, 0, 1.7, 3, 1.7, soluk(SARI, 0.45)); }
      U.ekle(cvG.kutu, 0, 5, 0, 20, 5, 2, D);
      for (let k = -2; k <= 2; k++) U.ekle(cvG.ico, k * 6.5, 2.2 - Math.abs(k) * 0.4, 1.5, 5, 3.2, 4, 0xfff7fb);
    });
    const ug = U.geo(), uc = ug.attributes.color, yp = gkYayGeo.attributes.position, yc = gkYayGeo.attributes.color, k = new T.Color();
    for (let i = 0; i < yp.count; i++) {   // ufuktaki gökkuşağı: kendi yumuşak renk geçişi, kenarlara doğru pusa karışır (şerit yok)
      const e = Math.min(1, Math.abs(Math.hypot(yp.getX(i), yp.getY(i)) - 0.82) / 0.215); k.setRGB(yc.getX(i), yc.getY(i), yc.getZ(i)).lerp(sis, 0.5 + 0.38 * e * e); uc.setXYZ(i, k.r, k.g, k.b);
    }
    const m = new T.Mesh(ug, new T.MeshBasicMaterial({ vertexColors: true, fog: false })); m.frustumCulled = false; scene.add(m);
  }

  // ───────── çizim: birleşik süsler ve çoklu kopyalar ─────────
  const gkTon = (g, h) => { const p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { const k = 0.8 + 0.24 * Math.min(1, Math.max(0, p.getY(i) / h)); c.setXYZ(i, Math.min(1, c.getX(i) * k), Math.min(1, c.getY(i) * k), Math.min(1, c.getZ(i) * k)); } return g; };   // ton geçişi: dipte koyu, yukarı doğru açık (düz karton boya yerine)
  { const m = new T.Mesh(gkTon(S.geo(), 9), cvMalz(5, { emissive: 0x2a2226 })); m.frustumCulled = false; scene.add(m); }
  if (gkYayL.length) {   // gökkuşakları: çok yavaş nefes alır, kıvrılır; üzerinden yumuşak bir parıltı akar (gölgelendiricide)
    const yd = cvHAREKET.length;
    cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.05 + instanceMatrix[3].z * 0.07;\n#else\nfloat cvF = 0.0;\n#endif\nfloat cvU = atan(position.y, position.x);\ntransformed.z += sin(cvT * 0.9 + cvU * 3.0 + cvF) * 0.03; transformed.xy *= 1.0 + 0.012 * sin(cvT * 0.7 + cvF);\nvColor.rgb += vec3(0.2) * pow(max(0.0, sin(cvU * 2.0 - cvT * 0.7 + cvF)), 8.0);');
    const ym = cvMalz(yd, { emissive: 0x1a1618 }), ob = ym.onBeforeCompile;
    ym.onBeforeCompile = sh => { ob(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vColor.rgb * 0.6;'); };   // kendi renginde hafif ışıldar: canlı ama yumuşak
    ym.customProgramCacheKey = () => 'gkYay'; cok(gkYayGeo, ym, gkYayL);
  }
  if (gkGul.length) {   // rüzgâr gülü: beyaz çubuk + dönen dört kanat
    const gkDon = cvHAREKET.length;
    cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.9;\n#else\nfloat cvF = 0.0;\n#endif\nfloat cvA = (cvT * 2.2 + cvF) * cvK.z; float cvC = cos(cvA), cvS = sin(cvA); vec2 cvQ = transformed.xy - vec2(0.0, 2.6);\ntransformed.xy = vec2(cvQ.x * cvC - cvQ.y * cvS, cvQ.x * cvS + cvQ.y * cvC) + vec2(0.0, 2.6);');
    const W = cvYapi();
    W.ekle(cvG.sil5, 0, 1.3, 0, 0.06, 2.6, 0.06, BEYAZ); W.ekle(cvG.kureK, 0, 2.6, 0.16, 0.13, 0.13, 0.1, ALTIN, 0, 0, 0, 0, 0, 1);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; W.ekle(cvG.ucgen, Math.cos(a) * 0.36 - Math.sin(a) * 0.14, 2.6 + Math.sin(a) * 0.36 + Math.cos(a) * 0.14, 0.1, 0.3, 0.78, 0.05, k % 2 ? 0xfff6fb : BEYAZ, 0, 0, a - Math.PI / 2 + 0.38, k % 2 ? 0 : 1, 0, 1); }
    cok(W.geo(), cvMalz(gkDon, { emissive: 0x2a2226 }), gkGul);
  }
  {   // bulut öbeği + yayvan tümsek
    const C = cvYapi();
    C.ekle(cvG.ico, 0, 0.75, 0, 1.5, 1.15, 1.35, BEYAZ, 0, 0, 0, 1); C.ekle(cvG.kureK, -1.3, 0.45, -0.3, 1.0, 0.75, 0.95, BEYAZ, 0, 0, 0, 1); C.ekle(cvG.kureK, 1.3, 0.5, 0.35, 1.05, 0.8, 1.0, BEYAZ, 0, 0, 0, 1);
    const g = C.geo(), p = g.attributes.position, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) { const y = Math.max(p.getY(i), -0.15); p.setY(i, y); let t = clamp((y + 0.15) / 1.75, 0, 1); t = t * t * (3 - 2 * t); c.setXYZ(i, lerp(0.96, 1, t), lerp(0.88, 1, t), lerp(0.96, 1, t)); }
    const bm = cvMalz(gkNefes, { emissive: 0x6c6873 });
    cok(g, bm, bulut);
    const D = cvYapi(); D.ekle(cvG.yarimK, 0, 0, 0, 1, 1, 1, BEYAZ, 0, 0, 0, 1);
    if (puf.length) cok(D.geo(), bm, puf);
  }
  if (balon.length) {   // sıcak hava balonu: çizgili top + sepet
    const B = cvYapi();
    const top = new T.SphereGeometry(1, 16, 7); B.ekle(top, 0, 5.2, 0, 3, 3.5, 3, BEYAZ, 0, 0, 0, 1);
    const n0 = top.userData.cvD.attributes.position.count;
    B.ekle(cvG.koni6, 0, 2.1, 0, 1.75, 1.9, 1.75, BEYAZ, Math.PI, 0, 0, 1); B.ekle(cvG.sil, 0, 1.2, 0, 0.62, 0.16, 0.62, SARI);
    B.ekle(cvG.kutu, 0, 0.1, 0, 0.95, 0.75, 0.95, 0xb9824c); B.ekle(cvG.kutu, 0, 0.48, 0, 1.08, 0.14, 1.08, 0x8f5c34);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.ekle(cvG.sil5, sx * 0.44, 0.85, sz * 0.44, 0.03, 0.8, 0.03, 0x8f5c34);
    const g = B.geo(), p = g.attributes.position, kk = g.attributes.cvK;
    for (let i = 0; i < n0; i += 3) { const a = Math.atan2(p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2), p.getX(i) + p.getX(i + 1) + p.getX(i + 2)); if (Math.floor((a + Math.PI) / 6.2832 * 8 + 0.001) % 2) for (let j = 0; j < 3; j++) kk.setX(i + j, 0); }
    cok(g, cvMalz(gkSuz, { emissive: 0x2a2226 }), balon);
  }
  if (ucurtma.length) {   // uçurtma: ip + baklava + kuyruk fiyonkları (rüzgârda salınır)
    const U = cvYapi();
    U.ekle(cvG.sil5, 0, 4.5, 1.25, 0.035, 9.34, 0.035, BEYAZ, 0.27); U.ekle(cvG.okt, 0, 9.9, 2.78, 1.0, 1.35, 0.09, BEYAZ, 0.45, 0, 0, 1); U.ekle(cvG.kureK, 0, 9.9, 2.86, 0.17, 0.17, 0.1, SARI);
    for (let k = 0; k < 4; k++) U.ekle(cvG.ucgen, 0, 7.9 - k * 0.8, 2.2 - k * 0.22, 0.2, 0.34, 0.05, GK[(k * 2 + 1) % 7], 0, 0, (k % 2 ? 1 : -1) * 1.571);
    cok(U.geo(), cvMalz(1), ucurtma);
  }
  {   // yıldızlar ve hilaller kendiliğinden hafifçe parlar
    const ym = cvMalz(gkSuz, { emissive: 0x7a6a4c });
    if (yildiz.length) { const Y = cvYapi(); Y.ekle(gkYildizGeo, 0, 0, 0, 1, 1, 1, BEYAZ, 0, 0, 0, 1); cok(Y.geo(), ym, yildiz); }
    if (ayl.length) { const Y = cvYapi(); Y.ekle(gkAyGeo, 0, 0, 0, 1, 1, 1, BEYAZ, 0, 0, 0.35, 1); cok(Y.geo(), ym, ayl); }
  }

  // ───────── gökyüzü: kayan bulutlar, kuş sürüsü, zeplin ve gökkuşağı izli uçaklar ─────────
  {
    const C = cvYapi(), gb = [];
    C.ekle(cvG.ico, 0, 0, 0, 13, 8, 10, BEYAZ); C.ekle(cvG.ico, -12, -1.5, 1, 9, 5.6, 8, BEYAZ); C.ekle(cvG.ico, 12, -1, -1, 10, 6.2, 8, BEYAZ); C.ekle(cvG.ico, 5, 3.5, 2, 8, 5.5, 7, BEYAZ); C.ekle(cvG.kure, -21, -3, 0, 6, 3.4, 5.5, BEYAZ); C.ekle(cvG.kure, 21.5, -3, 0, 6, 3.4, 5.5, BEYAZ);
    const g = C.geo(), p = g.attributes.position, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) { const y = Math.max(p.getY(i), -3.6); p.setY(i, y); let t = clamp((y + 3.6) / 10, 0, 1); t = t * t * (3 - 2 * t); c.setXYZ(i, lerp(0.88, 1, t), lerp(0.84, 1, t), lerp(0.96, 1, t)); }
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + R() * 0.4, r = 150 + R() * 300, s = 0.8 + R() * 1.0; gb.push([Math.cos(a) * r, 100 + R() * 60, Math.sin(a) * r, s, s * 0.9, s, R() * 6, [0xffffff, 0xffdcea, 0xfff2e2, 0xe4eeff][i % 4]]); }
    gkBulut = cok(g, new T.MeshBasicMaterial({ vertexColors: true, fog: false }), gb); gkBulut.position.set(mx, 0, mz);
    const B = cvYapi(), kus = [];
    B.ekle(cvG.kure, 0, 0, 0, 0.2, 0.2, 0.6, BEYAZ); B.ekle(cvG.ufak, 0, 0.08, 0.6, 0.16, 0.16, 0.18, BEYAZ); B.ekle(cvG.koni, 0, 0.06, 0.85, 0.06, 0.2, 0.06, 0xffa53d, Math.PI / 2); for (const sx of [-1, 1]) { B.ekle(cvG.kureK, sx * 0.11, 0.15, 0.68, 0.045, 0.05, 0.04, KOYU); B.ekle(cvG.kureK, sx * 0.13, 0.04, 0.66, 0.05, 0.035, 0.03, PEMBE); }
    for (const sx of [-1, 1]) { B.ekle(cvG.kutu, sx * 0.55, 0.05, 0.05, 0.9, 0.05, 0.5, 0xfff2f8); B.ekle(cvG.kutu, sx * 1.3, 0.05, -0.05, 0.7, 0.05, 0.32, 0xffa9cf); }
    B.ekle(cvG.kutu, 0, 0.02, -0.7, 0.3, 0.04, 0.4, 0xffa9cf);
    for (let i = 0; i < 7; i++) { const a = (i < 7 ? 0.4 + (i % 4) * 0.13 + (i > 3 ? 0.07 : 0) : 3.5 + (i - 7) * 0.17) + R() * 0.04, r = (i < 7 ? 100 + (i > 3 ? 9 : 0) : 62) + (i % 3) * 7, s = 2.2 + R() * 0.8; kus.push([Math.cos(a) * r, 30 + (i % 4) * 4 + R() * 4, Math.sin(a) * r, s, s, s, Math.atan2(Math.sin(a), -Math.cos(a))]); }
    gkKus = cok(B.geo(), cvMalz(3), kus); gkKus.position.set(mx, 0, mz);
    const H = cvYapi(), yon = a => Math.atan2(Math.sin(a), -Math.cos(a));
    {   // zeplin
      const a = 0.6, r = 175, y = 64; H.yer(Math.cos(a) * r, Math.sin(a) * r, yon(a), 1);
      H.ekle(G.kure, 0, y, 0, 5, 5, 13, 0xff8fbd); H.ekle(cvG.sil, 0, y, 2.5, 5.0, 1.3, 5.0, BEYAZ, Math.PI / 2); H.ekle(cvG.sil, 0, y, -2.5, 4.97, 1.3, 4.97, SARI, Math.PI / 2); H.ekle(cvG.sil, 0, y, 6.5, 4.4, 1.2, 4.4, MAVI, Math.PI / 2);
      H.ekle(cvG.kutu, 0, y - 5.3, 1, 2, 1.5, 5, 0xfff3d6); H.ekle(cvG.kutu, 0, y - 5.2, 1, 2.05, 0.5, 4, MAVI);
      H.ekle(cvG.kutu, 0, y, -11.3, 0.3, 7.5, 3.6, 0x6c78ff); H.ekle(cvG.kutu, 0, y, -11.3, 7.5, 0.3, 3.6, 0x6c78ff);
    }
    [[2.7, 125, 30, 0xff5c6c], [4.6, 150, 36, 0x4db8ff]].forEach(u => {   // uçak + gökkuşağı izi
      const y = u[2]; H.yer(Math.cos(u[0]) * u[1], Math.sin(u[0]) * u[1], yon(u[0]), 1.6);
      H.ekle(cvG.kure, 0, y, 0, 0.9, 0.9, 3.2, u[3]); H.ekle(cvG.kutu, 0, y + 0.2, 0.5, 8, 0.16, 1.4, SARI); H.ekle(cvG.kutu, 0, y + 0.1, -2.8, 2.8, 0.12, 0.8, SARI); H.ekle(cvG.kutu, 0, y + 0.7, -2.8, 0.14, 1.3, 0.8, u[3]);
      H.ekle(cvG.kureK, 0, y, 3.1, 0.4, 0.4, 0.4, BEYAZ); H.ekle(cvG.kutu, 0, y, 3.45, 2.6, 0.14, 0.1, KOYU); H.ekle(cvG.kureK, 0, y + 0.7, 0.5, 0.55, 0.5, 0.85, MAVI);
      for (let k = 0; k < 7; k++) H.ekle(cvG.kutu, (k - 3) * 0.24, y, -13, 0.24, 0.06, 19, GK[k]);
    });
    gkHava = new T.Mesh(H.geo(), cvMalz(0)); gkHava.frustumCulled = false; gkHava.position.set(mx, 0, mz); scene.add(gkHava);
  }

  // ───────── temas gölgeleri (tek çizim) ─────────
  if (golge.length) {
    const d = tuvalDoku(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(150,110,190,.24)'); r.addColorStop(0.45, 'rgba(150,110,190,.12)'); r.addColorStop(1, 'rgba(150,110,190,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    const g = new T.PlaneGeometry(2, 2); g.rotateX(-Math.PI / 2); const sh = cok(g, new T.MeshBasicMaterial({ map: d, transparent: true, depthWrite: false }), golge); sh.renderOrder = 1;
  }

  // ───────── pırıltı: yol kenarında göz kırpan küçük yıldızlar (hareket tamamen GPU'da) ─────────
  {
    const n = 120, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const q = cvKenar((R() * N) | 0, R() < 0.5 ? -1 : 1, YARI + 3.6 + R() * 10); p[i * 3] = q.x; p[i * 3 + 1] = 0.3 + R() * 2.2; p[i * 3 + 2] = q.z; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3));
    const m = new T.ShaderMaterial({
      uniforms: { cvT: cvZ }, transparent: true, depthWrite: false,
      vertexShader: 'uniform float cvT;varying float cvA;varying float cvR;void main(){float f=position.x*3.1+position.z*2.3;float a=pow(max(0.0,sin(cvT*2.2+f)),5.0);vec4 mv=modelViewMatrix*vec4(position.x,position.y+sin(cvT*0.6+f)*0.25,position.z,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(170.0/max(2.0,-mv.z),1.0,10.0)*(0.45+0.55*a);cvA=a*(1.0-smoothstep(30.0,66.0,-mv.z));cvR=fract(f*0.37);}',
      fragmentShader: 'varying float cvA;varying float cvR;void main(){vec2 p=abs(gl_PointCoord-vec2(.5));float d=p.x*p.y*46.0+length(p)*1.7;vec3 c=cvR<0.34?vec3(1.0,0.97,0.7):cvR<0.67?vec3(1.0,0.8,0.92):vec3(1.0);gl_FragColor=vec4(c,cvA*(1.0-smoothstep(.15,1.0,d)));if(gl_FragColor.a<.01)discard;\n#include <colorspace_fragment>\n}'
    });
    const pts = new T.Points(g, m); pts.frustumCulled = false; scene.add(pts);
  }
}
