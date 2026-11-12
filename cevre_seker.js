/* Şeker Diyarı pistinin çevresi (yalnız ?pist=seker iken yüklenir, cevre.js'ten sonra).
   cevre.js ortak tabanı kurar (gök dokusu scene.background, sis scene.fog, ışıklar cvGokIsik + gunes, zemin `zemin` + `cimDoku`, güneş `cvGunes`);
   bu dosya onları kendi temasına göre değiştirir ve süslerini ekler. cevreEkGuncelle(dt, t) her karede çağrılır.
   Bölgeler (pist boyunca): 0 kurabiye köyü · 1 lolipop ormanı · 2 pamuk şeker korusu + makaron kuleleri · 3 çikolata nehri + jöle tepecikleri
   · 4 dondurma ve pasta bahçesi · 5 baston şeker ormanı. Yeni üst düzey adlar `sk` ile başlar. */
'use strict';
let skBulut = null, skLoliDoku = null, skNehirDoku = null, skBalon = null;
function cevreEkGuncelle(dt, t) {
  if (skBulut) skBulut.rotation.y = t * 0.006;          // pamuk şeker bulutlar kayar
  if (skLoliDoku) skLoliDoku.rotation = t * 0.45;       // lolipopların sarmalı döner (tek doku, kopya başına iş yok)
  if (skNehirDoku) skNehirDoku.offset.y = -t * 0.06;    // çikolata akar
  if (skBalon) { skBalon.rotation.y = -t * 0.012; skBalon.position.y = Math.sin(t * 0.4) * 1.2; }   // kek balonlar ağır ağır süzülür
}
const skYK = (() => {   // yuvarlak köşeli, tombul kutu: köşeler yumuşak yuvarlanır, normaller yumuşak (karton gibi düz levha değil)
  const g = new T.BoxGeometry(1, 1, 1, 3, 3, 3), p = g.attributes.position, n = g.attributes.normal, r = 0.17, v = new T.Vector3(), c = new T.Vector3(), u = a => Math.abs(a) < 0.3 ? Math.sign(a) * 0.4 : a;   // ara çizgiler köşeye yakın: az üçgenle yuvarlak kenar
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.set(u(v.x), u(v.y), u(v.z)); c.set(clamp(v.x, -0.5 + r, 0.5 - r), clamp(v.y, -0.5 + r, 0.5 - r), clamp(v.z, -0.5 + r, 0.5 - r)); v.sub(c).normalize(); n.setXYZ(i, v.x, v.y, v.z); p.setXYZ(i, c.x + v.x * r, c.y + v.y * r, c.z + v.z * r); }
  return g;
})();
if (cvTema === 'seker') {
  const PEMBE = 0xff9ec7, NANE = 0x9be8c8, KREM = 0xfff0d0, LILA = 0xc9a8ff, MAVI = 0x8fd6ff, SARI = 0xffe27a, KIRMIZI = 0xff5068, CIKO = 0x7a4a2a, KURABIYE = 0xc98646, BEYAZ = 0xffffff, GOFRET = 0xe3aa5c;
  const PASTEL = [PEMBE, NANE, SARI, LILA, MAVI, 0xffb38a], CANLI = [0xff5c8a, 0x45cfa0, 0xffc93a, 0x9a6cff, 0x3fb4ff, 0xff8a3a];
  const sec = l => l[(R() * l.length) | 0];

  // ───────── gök, sis, ışık ─────────
  {
    const c = scene.background.image, g = c.getContext('2d'), h = c.height, gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#6db9f4'); gr.addColorStop(0.26, '#a5d7fb'); gr.addColorStop(0.45, '#d9d3fb'); gr.addColorStop(0.57, '#ffcde2'); gr.addColorStop(0.66, '#ffe9d6'); gr.addColorStop(1, '#fff1f6');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, h); scene.background.needsUpdate = true;
  }
  scene.fog.color.setHex(0xffe2ee);
  cvGokIsik.color.setHex(0xffffff); cvGokIsik.groundColor.setHex(0xe9bfd0); cvGokIsik.intensity = 1.2;
  gunes.color.setHex(0xfff1dc); gunes.intensity = 1.3;
  cvGunes.material.color.setHex(0xfff0f4);

  // ───────── zemin: krem üstüne şeker serpintisi; bölgeden bölgeye pembe / nane / krem / lila / buz mavisi ─────────
  {
    const c = cimDoku.image, g = c.getContext('2d'), w = c.width, h = c.height;
    g.globalAlpha = 1; g.fillStyle = '#fdf3ee'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const x = R() * w, y = R() * h, r = 22 + R() * 46; g.fillStyle = ['#ffffff', '#fbdfe9', '#fff3dc', '#eedfe0'][i % 4]; g.globalAlpha = 0.3;
      for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) { g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill(); }
    }
    g.lineCap = 'round';
    for (let i = 0; i < 110; i++) {
      const x = 8 + R() * (w - 16), y = 8 + R() * (h - 16), a = R() * 6.283, l = 2.5 + R() * 2.5;
      g.globalAlpha = 0.85; g.strokeStyle = ['#ff5c8a', '#3fc6a0', '#ffc02e', '#8f6cff', '#3fa9ff', '#ffffff', '#ff8a3a'][i % 7]; g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    for (let i = 0; i < 90; i++) { g.globalAlpha = 0.6; g.fillStyle = i % 3 ? '#ffffff' : '#ffd0e2'; g.beginPath(); g.arc(3 + R() * (w - 6), 3 + R() * (h - 6), 1 + R() * 1.4, 0, 7); g.fill(); }
    g.globalAlpha = 1; cimDoku.needsUpdate = true;
    const p = zemin.geometry.attributes.position, col = zemin.geometry.attributes.color, RK = [[0.64, 0.97, 0.80], [0.84, 0.70, 1], [0.64, 0.88, 1], [1, 0.70, 0.84], [1, 0.90, 0.62]];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = -p.getY(i) - 70, a = (Math.atan2(z + 78, x) / 6.2832 + 0.5) * 5 + 0.4 * Math.sin(x * 0.013 + z * 0.017), k = Math.floor(a);
      let f = a - k; f = f * f * (3 - 2 * f);
      const A = RK[((k % 5) + 5) % 5], B = RK[(((k + 1) % 5) + 5) % 5], v = 0.95 + 0.05 * Math.sin(x * 0.05 + z * 0.043);
      col.setXYZ(i, lerp(A[0], B[0], f) * v, lerp(A[1], B[1], f) * v, lerp(A[2], B[2], f) * v);
    }
    col.needsUpdate = true;
  }

  // birleşik süs malzemesi: cvK.y = bayrak dalgalanır, cvK.z = lolipop sapı rüzgârda tatlı tatlı sallanır (başı aynı salınımı gölgelendiricide izler)
  const skSalMod = cvHAREKET.length;
  cvHAREKET.push('float skF = position.x * 0.37 + position.z * 0.41;\ntransformed.y += cvK.y * sin(cvT * 5.5 + position.x * 1.7 + position.z * 1.3) * 0.11;\ntransformed.x += cvK.z * sin(cvT * 1.3 + skF) * position.y * 0.035; transformed.z += cvK.z * cos(cvT * 1.1 + skF) * position.y * 0.02;');
  const S = cvYapi(), golge = [], loli = [], pamuk = [], skJole = [];
  const bolge = i => { const f = (((i % N) + N) % N) / N; return f < 0.07 || f >= 0.93 ? 0 : f < 0.25 ? 1 : f < 0.42 ? 2 : f < 0.60 ? 3 : f < 0.78 ? 4 : 5; };
  const yer = (i, yan, uz, r, donuk) => {   // pist kenarında boş yer bul (yola ve başka süslere taşmaz)
    for (let k = 0; k < 8; k++) {
      const p = cvKenar(i + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 5, yan, uz, donuk || 0), x = p.x, z = p.z, ry = p.ry;
      if (yakin(x, z) > YARI + 3.6 + r && cvBos(x, z, r)) { cvYasak.push([x, z, r + 0.6]); golge.push([x - 0.5, 0.012, z + 0.4, r * 1.05, 1, r * 0.8, -0.4]); return { x, z, ry }; }
    }
    return null;
  };

  // ───────── çikolata nehri + bisküvi köprü (yolun dışında) ─────────
  {
    let a = 0, b = 0;
    for (let i = cvI(0.43); i < cvI(0.59); i += 4) for (const yan of [1, -1]) { const p = cvKenar(i, yan, YARI + 17); if (yakin(p.x, p.z) > YARI + 14) { if (yan > 0) a++; else b++; } }
    const nyan = a >= b ? 1 : -1; let en = [], cur = [];
    for (let i = cvI(0.415); i <= cvI(0.605); i += 5) {
      const p = cvKenar(i, nyan, YARI + 15.5 + Math.sin(i * 0.07) * 4.5);
      if (yakin(p.x, p.z) < YARI + 9) { if (cur.length > en.length) en = cur; cur = []; continue; }
      cur.push([p.x, p.z]);
    }
    if (cur.length > en.length) en = cur;
    if (en.length > 4) {
      const serit2 = (pts, w, y, vo) => {
        const pos = [], uv = [], kn = []; let v = 0;
        for (let j = 0; j < pts.length; j++) {
          const p0 = pts[Math.max(0, j - 1)], p1 = pts[Math.min(pts.length - 1, j + 1)]; let tx = p1[0] - p0[0], tz = p1[1] - p0[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
          if (j) v += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]);
          const ww = w * (j === 0 || j === pts.length - 1 ? 0.25 : 1);
          kn.push([pts[j][0] + tz * ww, pts[j][1] - tx * ww, 0, v / vo], [pts[j][0] - tz * ww, pts[j][1] + tx * ww, 1, v / vo]);
        }
        for (let i = 0; i < pts.length - 1; i++) for (const k of [0, 1, 3, 0, 3, 2]) { const q = kn[i * 2 + k]; pos.push(q[0], y, q[1]); uv.push(q[2], q[3]); }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
        const nn = new Float32Array(pos.length); for (let i = 1; i < nn.length; i += 3) nn[i] = 1; g.setAttribute('normal', new T.BufferAttribute(nn, 3)); return g;
      };
      skNehirDoku = tuvalDoku(128, 256, (g, w, h) => {
        g.fillStyle = '#6a3b1c'; g.fillRect(0, 0, w, h); g.lineCap = 'round';
        for (let k = 0; k < 26; k++) {
          const x = R() * w, y = R() * h; g.strokeStyle = k % 3 ? 'rgba(150,92,52,.55)' : 'rgba(205,150,100,.5)'; g.lineWidth = 2 + R() * 4;
          for (const oy of [-h, 0, h]) { g.beginPath(); g.moveTo(x, y + oy); g.bezierCurveTo(x + 9, y + oy + 14, x - 9, y + oy + 30, x + 3, y + oy + 46); g.stroke(); }
        }
        for (const x of [0, w]) { const gr = g.createLinearGradient(x ? w - 14 : 0, 0, x ? w : 14, 0); gr.addColorStop(x ? 1 : 0, 'rgba(60,30,12,.55)'); gr.addColorStop(x ? 0 : 1, 'rgba(60,30,12,0)'); g.fillStyle = gr; g.fillRect(x ? w - 14 : 0, 0, 14, h); }
      }, true);
      const kiyi = new T.Mesh(serit2(en, 4.6, 0.05, 10), new T.MeshLambertMaterial({ color: 0xf2cf9a, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); kiyi.frustumCulled = false; scene.add(kiyi);
      const nehir = new T.Mesh(serit2(en, 3.3, 0.11, 12), new T.MeshLambertMaterial({ map: skNehirDoku, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); nehir.frustumCulled = false; scene.add(nehir);
      for (const q of en) cvYasak.push([q[0], q[1], 5.6]);
      // bisküvi köprü: nehrin üstünden kavis çizer
      for (const oran_ of [0.3, 0.72]) {
        const m = Math.max(1, Math.min(en.length - 2, Math.round(en.length * oran_))), tx = en[m + 1][0] - en[m - 1][0], tz = en[m + 1][1] - en[m - 1][1];
        S.yer(en[m][0], en[m][1], Math.atan2(-tz, tx), 1);
        for (let k = -3; k <= 3; k++) {
          const u = k / 3.5, y = 0.35 + 1.25 * (1 - u * u), rx = Math.atan(0.476 * u);
          S.ekle(skYK, 0, y, k * 1.5, 3.6, 0.34, 1.62, k % 2 ? 0xe9bd78 : 0xdcab62, rx);
          for (const sx of [-1, 1]) { S.ekle(cvG.kureK, sx * 0.8, y + 0.2, k * 1.5, 0.16, 0.08, 0.16, CIKO); S.ekle(cvG.sil5, sx * 1.72, y + 0.65, k * 1.5, 0.1, 1.1, 0.1, BEYAZ); S.ekle(cvG.ufak, sx * 1.72, y + 1.3, k * 1.5, 0.22, 0.22, 0.22, CANLI[(k + 3) % 6]); }
        }
        golge.push([en[m][0], 0.13, en[m][1], 5, 1, 5, 0]);
      }
    }
  }

  // ───────── büyük süsler ─────────
  const ev = (q, renk, s) => {   // zencefilli kurabiye ev
    S.yer(q.x, q.z, q.ry, s);
    S.ekle(skYK, 0, 1.6, 0, 4.6, 3.3, 4, KURABIYE); S.ekle(cvG.cati, 0, 3.15, 0, 0.92, 1.2, 0.96, KURABIYE);
    for (const sx of [-1, 1]) S.ekle(skYK, sx * 1.42, 4.3, 0, 3.75, 0.5, 5.0, renk, 0, 0, sx * -0.66);   // kalın, saçaklı tombul çatı
    for (const sx of [-1, 1]) S.ekle(skYK, sx * 2.72, 3.28, 0, 0.5, 0.36, 5.1, BEYAZ);
    S.ekle(skYK, 0, 5.62, 0, 0.62, 0.42, 5.2, BEYAZ);
    for (let k = -2; k <= 2; k++) S.ekle(cvG.kure, 0, 5.92, k * 1.05, 0.3, 0.3, 0.3, CANLI[(k + 2) % 6]);
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) S.ekle(cvG.kureK, sx * (0.75 + k * 0.62), 4.9 - k * 0.47, 2.48, 0.2, 0.2, 0.1, k % 2 ? BEYAZ : PEMBE);
    S.ekle(skYK, 0, 0.98, 2.02, 1.15, 1.95, 0.14, CIKO); S.ekle(cvG.yarimK, 0, 1.95, 2.02, 0.575, 0.5, 0.07, CIKO); S.ekle(cvG.kureK, 0.34, 1.0, 2.12, 0.09, 0.09, 0.06, SARI);
    for (const sx of [-1, 1]) { S.ekle(skYK, sx * 1.5, 1.95, 2.0, 1.12, 1.12, 0.1, BEYAZ); S.ekle(skYK, sx * 1.5, 1.95, 2.04, 0.86, 0.86, 0.1, 0xbfeaff); S.ekle(cvG.sil5, sx * 2.38, 1.6, 2.08, 0.17, 3.2, 0.17, BEYAZ); S.ekle(cvG.kure, sx * 2.38, 3.3, 2.08, 0.3, 0.3, 0.3, KIRMIZI); }
    S.ekle(cvG.kureK, 0, 4.25, 2.46, 0.42, 0.42, 0.12, KIRMIZI); S.ekle(cvG.kureK, 0, 4.25, 2.52, 0.2, 0.2, 0.1, BEYAZ);
    S.ekle(skYK, 1.35, 4.7, -0.9, 0.75, 1.5, 0.75, KURABIYE); S.ekle(skYK, 1.35, 5.5, -0.9, 0.95, 0.24, 0.95, BEYAZ);
    S.ekle(skYK, 0, 0.12, 0, 5, 0.24, 4.4, BEYAZ);
  };
  const makaron = q => {
    S.yer(q.x, q.z, q.ry, 1);
    for (let k = 0; k < 5; k++) { const y = k * 1.12, c = PASTEL[(k + ((q.x | 0) & 3)) % 6], r = 1.55 - k * 0.14; S.ekle(cvG.sil, 0, y + 0.26, 0, r, 0.44, r, c); S.ekle(cvG.sil, 0, y + 0.56, 0, r * 0.9, 0.2, r * 0.9, BEYAZ); S.ekle(cvG.sil, 0, y + 0.86, 0, r, 0.44, r, c); }
    S.ekle(cvG.kure, 0, 5.95, 0, 0.42, 0.42, 0.42, KIRMIZI);
  };
  const pasta = q => {   // çilekli iki katlı pasta
    S.yer(q.x, q.z, q.ry, 1);
    S.ekle(cvG.sil, 0, 1, 0, 4, 2, 4, KREM); S.ekle(cvG.sil, 0, 2.15, 0, 4.15, 0.36, 4.15, PEMBE); S.ekle(cvG.sil, 0, 3.2, 0, 2.7, 1.8, 2.7, KREM); S.ekle(cvG.sil, 0, 4.2, 0, 2.85, 0.3, 2.85, BEYAZ);
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; S.ekle(cvG.kure, Math.cos(a) * 3.5, 2.55, Math.sin(a) * 3.5, 0.45, 0.4, 0.45, BEYAZ); S.ekle(cvG.kureK, Math.cos(a + 0.3) * 4.1, 1.75, Math.sin(a + 0.3) * 4.1, 0.42, 0.55 + (k % 3) * 0.2, 0.42, PEMBE); }
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; S.ekle(cvG.koni6, Math.cos(a) * 1.9, 4.72, Math.sin(a) * 1.9, 0.38, 0.7, 0.38, KIRMIZI, Math.PI); S.ekle(cvG.ufak, Math.cos(a) * 1.9, 5.1, Math.sin(a) * 1.9, 0.2, 0.08, 0.2, 0x5fc86a); }
    S.ekle(cvG.koni6, 0, 4.95, 0, 0.6, 1.1, 0.6, KIRMIZI, Math.PI); S.ekle(cvG.ufak, 0, 5.55, 0, 0.3, 0.1, 0.3, 0x5fc86a);
  };
  const skTop = new T.SphereGeometry(1, 11, 7);   // dondurma topları ve pamuk şeker: pürüzsüz, yuvarlak
  const kulah = (x, z, ry, s) => {   // dondurma külahı
    S.yer(x, z, ry, s); const c = (R() * 6) | 0;
    S.ekle(cvG.koni, 0, 1.5, 0, 0.95, 3, 0.95, GOFRET, Math.PI); S.ekle(cvG.sil, 0, 3.02, 0, 1.02, 0.16, 1.02, 0xcf9448);
    S.ekle(skTop, 0, 3.6, 0, 1.15, 1.0, 1.15, PASTEL[c]); S.ekle(skTop, 0, 4.85, 0, 0.92, 0.85, 0.92, PASTEL[(c + 2) % 6]); S.ekle(skTop, 0, 5.75, 0, 0.3, 0.3, 0.3, KIRMIZI);
  };
  const skTorus = new T.TorusGeometry(1, 0.4, 6, 12), skYarimTorus = new T.TorusGeometry(1, 0.1, 8, 20, Math.PI);
  const donut = (x, z, ry, s) => {
    S.yer(x, z, ry, s); const c = sec([PEMBE, CIKO, 0xfff3f8, NANE]);
    S.ekle(skTorus, 0, 1.38, 0, 1, 1, 1, 0xdb9c56, 0, 0, 0); S.ekle(skTorus, 0, 1.38, 0.13, 1.02, 1.02, 0.82, c);
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283 + R(); S.ekle(cvG.kutu, Math.cos(a), 1.38 + Math.sin(a), 0.47, 0.09, 0.3, 0.07, CANLI[k % 6], 0, 0, R() * 3); }
  };
  const skSil8 = new T.CylinderGeometry(1, 1, 1, 9, 1, true);   // baston şeker: daha yuvarlak gövde
  const baston = (x, z, ry, s, renk) => {   // baston şeker
    S.yer(x, z, ry, s); const r = 0.2;
    for (let k = 0; k < 7; k++) S.ekle(skSil8, 0, 0.3 + k * 0.6, 0, r, 0.6, r, k % 2 ? BEYAZ : renk);
    for (let k = 0; k < 5; k++) { const a = (k + 0.5) * Math.PI / 5; S.ekle(skSil8, 0.7 - 0.7 * Math.cos(a), 4.2 + 0.7 * Math.sin(a), 0, r, 0.52, r, k % 2 ? renk : BEYAZ, 0, 0, -a); }
    S.ekle(cvG.kureK, 1.4, 4.15, 0, r, r, r, renk);
  };
  const sakiz = (x, z) => {   // sakız topu yığını
    S.yer(x, z, R() * 6, 0.8 + R() * 0.5);
    for (let k = 0; k < 3; k++) { const a = k * 2.094; S.ekle(cvG.kure, Math.cos(a) * 0.62, 0.52, Math.sin(a) * 0.62, 0.55, 0.55, 0.55, CANLI[(k + ((x | 0) & 7)) % 6]); }
    S.ekle(cvG.kure, 0, 1.38, 0, 0.55, 0.55, 0.55, CANLI[((x | 0) & 7) % 6 === 2 ? 0 : 2]);
    golge.push([x, 0.012, z, 1.5, 1, 1.3, 0]);
  };
  const jole = (x, z) => {   // jöle tepecik
    const r = 1 + R() * 1.3, c = sec([0xff5f7a, 0x58d68a, 0xffc94a, 0xb47cff, 0xff9a4a]);
    skJole.push([x, 0, z, r / 20, r / 20, r / 20, R() * 6, c]);   // ayrı kopya: rüzgâr salınımıyla jöle gibi titrer
    golge.push([x - 0.2, 0.012, z + 0.2, r * 1.25, 1, r * 1.1, 0]);
  };
  const lolipop = (x, z, ry, s) => {   // sarmal lolipop: çubuğu sabit, başı ortak dönen dokulu kopya
    const h = (3.6 + R() * 2.8) * s, r = (1.35 + R() * 0.8) * s; S.yer(0, 0, 0);
    S.ekle(cvG.sil5, x, h / 2, z, 0.13 * s, h, 0.13 * s, BEYAZ, 0, 0, 0, 0, 0, 1);
    loli.push([x, h + r * 0.8, z, r, r, r, ry + (R() - 0.5) * 0.9, sec([0xffffff, 0xfff2a8, 0xcdf0ff, 0xd9ffd6, 0xffe0ee, 0xe9dcff])]);
    golge.push([x - 0.4, 0.012, z + 0.3, r * 1.1, 1, r * 0.8, -0.4]);
  };
  const topLoli = (x, z) => {   // top lolipop
    const h = 1.8 + R() * 1.6, r = 0.6 + R() * 0.35; S.yer(0, 0, 0);
    S.ekle(cvG.sil5, x, h / 2, z, 0.09, h, 0.09, BEYAZ, 0, 0, 0, 0, 0, 1); S.ekle(cvG.kure, x, h + r * 0.8, z, r, r, r, sec(CANLI), 0, 0, 0, 0, 0, 1); S.ekle(cvG.kureK, x - r * 0.3, h + r * 1.25, z + r * 0.3, r * 0.3, r * 0.2, r * 0.3, BEYAZ, 0, 0, 0, 0, 0, 1);
    golge.push([x - 0.2, 0.012, z + 0.2, r * 1.1, 1, r * 0.9, -0.4]);
  };

  // kurabiye köyü (başlangıç) ve son bölgede iki ev
  [[0.945, 1, 0xff8fb8], [0.972, -1, 0x8fd6ff], [0.0, 1, 0xfff3f8], [0.022, -1, 0xff8fb8], [0.048, 1, 0x9be8c8], [0.062, -1, 0xc9a8ff], [0.82, -1, 0xfff3f8], [0.9, 1, 0xffe27a]].forEach((e, k) => { const q = yer(cvI(e[0]), e[1], YARI + 9.5 + (k % 2) * 1.5, 4.2, 0.3); if (q) ev(q, e[2], 0.95 + (k % 3) * 0.08); });
  [[0.27, 1], [0.35, -1], [0.41, 1]].forEach(e => { const q = yer(cvI(e[0]), e[1], YARI + 10, 2.2); if (q) makaron(q); });
  [[0.63, 1], [0.13, -1]].forEach(e => { const q = yer(cvI(e[0]), e[1], YARI + 10.5, 4.8); if (q) pasta(q); });
  [[0.66, 1], [0.75, -1]].forEach(e => { const q = yer(cvI(e[0]), e[1], YARI + 10.5, 2.6); if (q) kulah(q.x, q.z, q.ry, 2.1); });
  // manzara anı: krema tepenin üstünde şeker şato (yoldan uzakta, kapısı yola bakar)
  const sato = q => {
    S.yer(q.x, q.z, q.ry, 1.5);
    S.ekle(cvG.yarim, 0, 0, 0, 11, 2.2, 10, 0xfff3f8); S.ekle(cvG.sil, 0, 2.4, 0, 7.2, 1.2, 7.2, KREM); S.ekle(cvG.sil, 0, 3.05, 0, 7.4, 0.3, 7.4, PEMBE);
    S.ekle(cvG.sil, 0, 6.6, 0, 2.6, 7.4, 2.6, 0xffd9e8); S.ekle(cvG.sil, 0, 10.2, 0, 2.95, 0.5, 2.95, BEYAZ); S.ekle(cvG.koni, 0, 12.7, 0, 3.1, 4.6, 3.1, LILA); S.ekle(cvG.kure, 0, 15.3, 0, 0.5, 0.5, 0.5, KIRMIZI);
    for (const [x, z, c] of [[-5, 3.6, NANE], [5, 3.6, MAVI], [-5, -3.6, SARI], [5, -3.6, PEMBE]]) {
      S.ekle(cvG.sil, x, 5.2, z, 1.5, 5.6, 1.5, KREM); for (let k = 0; k < 3; k++) S.ekle(cvG.sil, x, 3.6 + k * 1.4, z, 1.54, 0.3, 1.54, c);
      S.ekle(cvG.sil, x, 8.1, z, 1.8, 0.4, 1.8, BEYAZ); S.ekle(cvG.koni, x, 9.9, z, 1.9, 3.2, 1.9, c); S.ekle(cvG.kureK, x, 11.7, z, 0.32, 0.32, 0.32, KIRMIZI);
    }
    S.ekle(skYK, 0, 4.2, 3.9, 8.6, 2.6, 0.8, KURABIYE); S.ekle(skYK, 0, 5.6, 3.9, 9, 0.36, 1.0, BEYAZ); for (let k = -3; k <= 3; k++) S.ekle(cvG.kure, k * 1.2, 5.95, 3.9, 0.32, 0.32, 0.32, CANLI[(k + 3) % 6]);
    S.ekle(skYK, 0, 3.9, 4.34, 1.7, 2.2, 0.14, CIKO); S.ekle(cvG.yarimK, 0, 5.0, 4.34, 0.85, 0.7, 0.07, CIKO); for (const y of [6.6, 8.6]) S.ekle(cvG.kureK, 0, y, 2.55, 0.5, 0.62, 0.12, 0xbfeaff);
  };
  for (const [f, yan] of [[0.2, 1], [0.2, -1], [0.16, 1], [0.16, -1], [0.34, 1], [0.34, -1], [0.68, -1], [0.86, 1], [0.86, -1]]) { const q = yer(cvI(f), yan, YARI + 34, 14, 0.3); if (q) { sato(q);
    // şatonun önünü aç: yaklaşırken görüldüğü yol parçasından şatoya uzanan yelpazede süs konmaz (yol kenarı seyirciler kalır)
    let bi = 0, bd = 1e12; for (let i = 0; i < N; i++) { const d = (PX[i] - q.x) ** 2 + (PZ[i] - q.z) ** 2; if (d < bd) { bd = d; bi = i; } }
    for (let j = -70; j <= 12; j += 8) {
      const i = ((bi + j) % N + N) % N, dx = q.x - PX[i], dz = q.z - PZ[i], l = Math.hypot(dx, dz);
      for (let u = YARI + 7; u < l - 15; u += 4.5) { const x = PX[i] + dx / l * u, z = PZ[i] + dz / l * u; if (yakin(x, z) > YARI + 6.5) cvYasak.push([x, z, 3.2]); }
    }
    break; } }
  // baston şeker fenerler: yol boyunca eşit aralıkla, sırayla bir sağda bir solda (kancası yola doğru, ucunda sarı şeker fener)
  for (let i0 = 25, k = 0; i0 < N; i0 += 100, k++) {
    const q = yer(i0, k % 2 ? 1 : -1, YARI + 4.4, 0.5, 0); if (!q) continue;
    S.yer(q.x, q.z, q.ry, 1.15); const r = 0.17, c = k % 2 ? 0xff7fb0 : KIRMIZI;
    for (let j = 0; j < 9; j++) S.ekle(skSil8, 0, 0.3 + j * 0.6, 0, r, 0.6, r, j % 2 ? BEYAZ : c);
    for (let j = 0; j < 5; j++) { const a = (j + 0.5) * Math.PI / 5; S.ekle(skSil8, 0, 5.4 + 0.7 * Math.sin(a), 0.7 - 0.7 * Math.cos(a), r, 0.52, r, j % 2 ? c : BEYAZ, a); }
    S.ekle(skSil8, 0, 5.05, 1.4, 0.03, 0.7, 0.03, BEYAZ); S.ekle(cvG.kure, 0, 4.45, 1.4, 0.36, 0.4, 0.36, SARI); S.ekle(cvG.kureK, 0, 4.82, 1.4, 0.2, 0.1, 0.2, BEYAZ);
  }
  // donut kemerler: yolun üstünden geçer, ayakları yolun dışında
  for (const f of [0.285, 0.455, 0.755, 0.905]) {
    let i = cvI(f), tamam = false;
    for (let k = 0; k < 10 && !tamam; k++, i = (i + 4) % N) tamam = [-1, 1].every(yan => { const p = cvKenar(i, yan, 12.6); return yakin(p.x, p.z) > 12.3 && cvBos(p.x, p.z, 3); });
    if (!tamam) continue; i = (i + N - 4) % N;
    S.yer(PX[i], PZ[i], Math.atan2(TX[i], TZ[i]), 1);
    // yüksek ve ince: altından geçerken görüşü kapatmaz (tepe ~17 m, kalınlık ~2,5 m)
    S.ekle(skYarimTorus, 0, -0.3, 0, 12.6, 16.2, 12.6, 0xdb9c56); S.ekle(skYarimTorus, 0, -0.3, -0.36, 12.7, 16.35, 10.8, f < 0.4 ? PEMBE : f < 0.6 ? 0xfff3f8 : f < 0.8 ? NANE : LILA);
    for (let k = 0; k < 16; k++) { const a = 0.25 + k / 15 * (Math.PI - 0.5), r = 1 + (k % 3 - 1) * 0.045; S.ekle(cvG.kutu, Math.cos(a) * r * 12.6, Math.sin(a) * r * 16.2 - 0.3, -1.42 + Math.abs(k % 3 - 1) * 0.16, 0.22, 0.75, 0.16, CANLI[k % 6], 0, 0, a + k * 1.3); }
    for (const yan of [-1, 1]) { const p = cvKenar(i, yan, 12.6); cvYasak.push([p.x, p.z, 3.6]); golge.push([p.x, 0.012, p.z, 3.4, 1, 3.4, 0]); }
  }
  // virajlarda yazısız ok tabelaları (şeker çubuğu direkli)
  {
    const tepe = []; for (let i = 0; i < N; i++) { let k = 0; for (let j = -6; j <= 6; j++) k += KAP[(i + j + N) % N]; tepe.push(k / 13); }
    let son = -99;
    for (let i = 0; i < N; i++) {
      const k = Math.abs(tepe[i]); if (k < 0.016 || k < Math.abs(tepe[(i + 1) % N]) || k < Math.abs(tepe[(i + N - 1) % N]) || i - son < 45) continue; son = i;
      const sag = tepe[i] > 0 ? 1 : -1;
      for (const g of [-14]) {
        const q = yer(i + g, -sag, YARI + 5.3, 1.2, 2.2); if (!q) continue;
        S.yer(q.x, q.z, q.ry, 1.25);
        for (let j = 0; j < 4; j++) S.ekle(cvG.sil5, 0, 0.28 + j * 0.56, 0, 0.13, 0.56, 0.13, j % 2 ? BEYAZ : KIRMIZI);
        S.ekle(skYK, 0, 2.95, -0.03, 2.9, 1.7, 0.16, BEYAZ); S.ekle(skYK, 0, 2.95, 0.03, 2.6, 1.4, 0.16, 0xff5c9a);
        S.ekle(skYK, -sag * 0.35, 2.95, 0.13, 1.15, 0.36, 0.08, BEYAZ); S.ekle(cvG.ucgen, sag * 0.62, 2.95, 0.13, 0.56, 0.8, 0.06, BEYAZ, 0, 0, -sag * Math.PI / 2);
        for (const sx of [-1, 1]) S.ekle(cvG.kureK, sx * 1.45, 3.8, 0, 0.17, 0.17, 0.17, SARI);
      }
    }
  }
  // şeker serpintili çitler
  for (let i0 = 6; i0 < N; i0 += 58) for (const yan of [-1, 1]) {
    if ((i0 / 58 | 0) % 3 !== (yan > 0 ? 1 : 0)) continue;
    S.yer(0, 0, 0); let ox = 0, oz = 0, var_ = false;
    for (let k = 0; k <= 8; k++) {
      const p = cvKenar(i0 + k * 4, yan, YARI + 3.8), x = p.x, z = p.z;
      if (yakin(x, z) < YARI + 3.5 || !cvBos(x, z, 0.3)) { var_ = false; continue; }
      S.ekle(cvG.sil5, x, 0.6, z, 0.13, 1.2, 0.13, BEYAZ); S.ekle(cvG.ufak, x, 1.34, z, 0.24, 0.24, 0.24, CANLI[(k + i0) % 6]);
      if (var_) { const dx = x - ox, dz = z - oz, l = Math.hypot(dx, dz), ry = Math.atan2(dx, dz); S.ekle(cvG.kutu, (x + ox) / 2, 0.95, (z + oz) / 2, 0.1, 0.16, l, PEMBE, 0, ry); S.ekle(cvG.kutu, (x + ox) / 2, 0.5, (z + oz) / 2, 0.1, 0.16, l, NANE, 0, ry); }
      ox = x; oz = z; var_ = true;
    }
  }

  // başlangıç köyünde bayrak ipleri: yol kenarındaki şeker direkler arasında sarkan renkli üçgen bayraklar
  for (const yan of [-1, 1]) {
    S.yer(0, 0, 0); let ox = 0, oz = 0, var_ = false;
    for (let i = cvI(0.955), k = 0; k < 8; k++, i += 8) {
      const p = cvKenar(i, yan, YARI + 4.5), x = p.x, z = p.z;
      if (yakin(x, z) < YARI + 4.2 || !cvBos(x, z, 0.5)) { var_ = false; continue; }
      cvYasak.push([x, z, 0.7]);
      for (let j = 0; j < 4; j++) S.ekle(cvG.sil5, x, 0.6 + j * 1.2, z, 0.12, 1.2, 0.12, j % 2 ? BEYAZ : (yan > 0 ? 0xff7fb0 : 0x45cfa0));
      S.ekle(cvG.kureK, x, 4.95, z, 0.3, 0.3, 0.3, SARI);
      if (var_) {
        const dx = x - ox, dz = z - oz, ry = Math.atan2(dx, dz), l = Math.hypot(dx, dz) / 6;
        for (let j = 0; j < 6; j++) {
          const u0 = j / 6, u1 = (j + 1) / 6, y0 = 4.7 - 3.2 * u0 * (1 - u0), y1 = 4.7 - 3.2 * u1 * (1 - u1), um = (u0 + u1) / 2;
          S.ekle(cvG.kutu, ox + dx * um, (y0 + y1) / 2, oz + dz * um, 0.05, 0.05, Math.hypot(l, y1 - y0) + 0.05, BEYAZ, -Math.atan2(y1 - y0, l), ry);
          S.ekle(cvG.ucgen, ox + dx * um, (y0 + y1) / 2 - 0.42, oz + dz * um, 0.36, 0.72, 0.05, CANLI[(j + k) % 6], Math.PI, ry + Math.PI / 2, 0, 0, 1.6);
        }
      }
      ox = x; oz = z; var_ = true;
    }
  }

  // ───────── seyirciler: kurabiye adam, jöle ayıcık, marşmelov (zıplar, el sallar; hareket gölgelendiricide) ─────────
  {
    const K = cvYapi(), A = cvYapi(), M = cvYapi(), KOYU = 0x3a2416, kl = [], al = [], ml = [];
    // kurabiye adam
    for (const sx of [-1, 1]) { K.ekle(cvG.kureK, sx * 0.27, 0.36, 0, 0.23, 0.42, 0.2, KURABIYE, 0, 0, 0, 1, 1); K.ekle(cvG.ufak, sx * 0.15, 1.93, 0.27, 0.055, 0.055, 0.04, KOYU, 0, 0, 0, 0, 1); K.ekle(cvG.ufak, sx * 0.27, 1.78, 0.24, 0.075, 0.06, 0.04, PEMBE, 0, 0, 0, 0, 1); K.ekle(cvG.kutu, sx * 0.27, 0.2, 0.19, 0.3, 0.06, 0.04, BEYAZ, 0, 0, 0, 0, 1); }
    K.ekle(cvG.kure, 0, 1.0, 0, 0.5, 0.62, 0.27, KURABIYE, 0, 0, 0, 1, 1); K.ekle(cvG.kure, 0, 1.86, 0, 0.43, 0.42, 0.29, KURABIYE, 0, 0, 0, 1, 1);
    K.ekle(cvG.kureK, -0.62, 1.12, 0, 0.4, 0.17, 0.17, KURABIYE, 0, 0, 0.45, 1, 1); K.ekle(cvG.kureK, 0.6, 1.52, 0, 0.17, 0.44, 0.17, KURABIYE, 0, 0, -0.5, 1, 1, 1);
    K.ekle(cvG.ufak, 0, 1.15, 0.26, 0.08, 0.08, 0.05, BEYAZ, 0, 0, 0, 0, 1); K.ekle(cvG.ufak, 0, 0.88, 0.26, 0.08, 0.08, 0.05, BEYAZ, 0, 0, 0, 0, 1); K.ekle(cvG.kutu, 0, 1.72, 0.285, 0.2, 0.05, 0.03, BEYAZ, 0, 0, 0, 0, 1);
    K.ekle(cvG.kureK, 0, 1.47, 0.24, 0.14, 0.08, 0.06, KIRMIZI, 0, 0, 0, 0, 1);
    // jöle ayıcık
    A.ekle(cvG.kure, 0, 0.75, 0, 0.5, 0.6, 0.42, BEYAZ, 0, 0, 0, 1, 1); A.ekle(cvG.kure, 0, 1.52, 0, 0.43, 0.39, 0.38, BEYAZ, 0, 0, 0, 1, 1); A.ekle(cvG.kureK, 0, 1.44, 0.33, 0.17, 0.13, 0.11, 0xfff4e6, 0, 0, 0, 0, 1);
    A.ekle(cvG.ufak, 0, 1.5, 0.44, 0.05, 0.04, 0.03, KOYU, 0, 0, 0, 0, 1); A.ekle(cvG.ufak, -0.17, 1.74, 0.2, 0.1, 0.06, 0.06, BEYAZ, 0, 0, 0.5, 0, 1);
    for (const sx of [-1, 1]) { A.ekle(cvG.kureK, sx * 0.3, 1.86, 0, 0.15, 0.15, 0.1, BEYAZ, 0, 0, 0, 1, 1); A.ekle(cvG.ufak, sx * 0.16, 1.6, 0.35, 0.05, 0.055, 0.03, KOYU, 0, 0, 0, 0, 1); A.ekle(cvG.kureK, sx * 0.25, 0.2, 0.1, 0.2, 0.22, 0.27, BEYAZ, 0, 0, 0, 1, 1); }
    A.ekle(cvG.kureK, -0.5, 0.95, 0.1, 0.16, 0.3, 0.16, BEYAZ, 0, 0, -0.5, 1, 1); A.ekle(cvG.kureK, 0.52, 1.25, 0.1, 0.16, 0.36, 0.16, BEYAZ, 0, 0, -0.6, 1, 1, 1);
    // marşmelov
    M.ekle(cvG.sil, 0, 0.72, 0, 0.5, 1.0, 0.5, BEYAZ, 0, 0, 0, 1, 1); M.ekle(cvG.yarimK, 0, 1.22, 0, 0.5, 0.16, 0.5, BEYAZ, 0, 0, 0, 1, 1); M.ekle(cvG.kutu, 0, 0.72, 0.5, 0.17, 0.045, 0.03, KOYU, 0, 0, 0, 0, 1);
    for (const sx of [-1, 1]) { M.ekle(cvG.ufak, sx * 0.17, 0.92, 0.47, 0.06, 0.07, 0.04, KOYU, 0, 0, 0, 0, 1); M.ekle(cvG.ufak, sx * 0.3, 0.76, 0.43, 0.09, 0.06, 0.04, PEMBE, 0, 0, 0, 0, 1); M.ekle(cvG.kureK, sx * 0.2, 0.12, 0.08, 0.17, 0.12, 0.22, BEYAZ, 0, 0, 0, 1, 1); }
    M.ekle(cvG.kureK, -0.56, 0.78, 0, 0.14, 0.14, 0.14, BEYAZ, 0, 0, 0, 1, 1); M.ekle(cvG.kureK, 0.58, 1.02, 0, 0.12, 0.27, 0.12, BEYAZ, 0, 0, -0.5, 1, 1, 1);
    for (let i = 5; i < N; i += 13) for (const yan of [-1, 1]) {
      if (R() < 0.55) continue; const adet = 1 + ((R() * 2) | 0), b = bolge(i);
      for (let j = 0; j < adet; j++) {
        const p = cvKenar(i + j * 2, yan, YARI + 4.9 + R() * 1.7, 0.4), x = p.x, z = p.z, ry = p.ry;
        if (yakin(x, z) < YARI + 4.4 || !cvBos(x, z, 0.75)) continue; cvYasak.push([x, z, 0.75]);
        const s = 1.25 + R() * 0.4, tur = (b + j + (R() < 0.35 ? 1 : 0)) % 3;
        if (tur === 0) kl.push([x, 0, z, s, s, s, ry, sec([0xffffff, 0xf2d2b0, 0xffe2c2])]);
        else if (tur === 1) al.push([x, 0, z, s, s, s, ry, sec([0xff4d62, 0x49cf6c, 0xffc233, 0xff8a3a, 0xa96cff])]);
        else ml.push([x, 0, z, s * 1.1, s * 1.1, s * 1.1, ry, sec([0xffffff, 0xffd3e4, 0xfff6d8, 0xd9f0ff])]);
        golge.push([x, 0.012, z, 0.85 * s, 1, 0.7 * s, 0]);
      }
    }
    if (kl.length) cok(K.geo(), cvMalz(2), kl); if (al.length) cok(A.geo(), cvMalz(2), al); if (ml.length) cok(M.geo(), cvMalz(2), ml);
  }

  // ───────── yol boyu şekerler: bölgeye göre değişir ─────────
  for (let i = 0; i < N; i += 4) for (const yan of [-1, 1]) for (let sira = 0; sira < 3; sira++) {   // sıra 0 yol kenarı · 1 arka sıra · 2 uzaktaki iri şekerler
    if (R() < (sira === 2 ? 0.93 : sira ? 0.86 : 0.84)) continue;   // sade: yarı yarıya seyrek, yola en yakın şeritte geniş boşluk
    const b = bolge(i), p = cvKenar(i + ((R() * 4) | 0), yan, sira === 2 ? YARI + 36 + R() * 36 : sira ? YARI + 15 + R() * 17 : YARI + 9.5 + R() * 4), x = p.x, z = p.z, ry = p.ry;
    if (yakin(x, z) < (sira === 2 ? YARI + 16 : YARI + 8.5) || !cvBos(x, z, sira === 2 ? 4 : 1.7)) continue; cvYasak.push([x, z, sira === 2 ? 4 : 1.7]);
    const r = R(), s = sira === 2 ? 2 : sira ? 1.25 : 1;
    const pamukEkle = () => { const k = (0.8 + R() * 0.6) * s; pamuk.push([x, 0, z, k, k, k, R() * 6, sec([0xffa9d0, 0x9fdcff, 0xd6b8ff, 0xffc7de, 0xb4f0dc])]); golge.push([x - 0.4, 0.012, z + 0.3, 2 * k, 1, 1.6 * k, -0.4]); };
    const bastonEkle = () => { baston(x, z, ry + (R() - 0.5) * 2, (0.8 + R() * 0.6) * s, sec([KIRMIZI, KIRMIZI, 0xff7fb0, 0x45cfa0])); golge.push([x, 0.012, z, 1, 1, 0.9, 0]); };
    if (b === 0) { if (r < 0.4) lolipop(x, z, ry, s * 0.85); else if (r < 0.7) bastonEkle(); else if (r < 0.87) topLoli(x, z); else pamukEkle(); }
    else if (b === 1) { if (r < 0.72) lolipop(x, z, ry, s * (1 + R() * 0.35)); else if (r < 0.9) topLoli(x, z); else bastonEkle(); }
    else if (b === 2) { if (r < 0.72) pamukEkle(); else if (r < 0.86) topLoli(x, z); else lolipop(x, z, ry, s); }
    else if (b === 3) { if (r < 0.36) jole(x, z); else if (r < 0.54) sakiz(x, z); else if (r < 0.74) bastonEkle(); else lolipop(x, z, ry, s); }
    else if (b === 4) { if (r < 0.34) { kulah(x, z, R() * 6, (0.75 + R() * 0.5) * s); golge.push([x, 0.012, z, 1.4, 1, 1.2, 0]); } else if (r < 0.54) { donut(x, z, ry + (R() - 0.5), (0.8 + R() * 0.5) * s); golge.push([x, 0.012, z, 1.6, 1, 1, 0]); } else if (r < 0.76) pamukEkle(); else topLoli(x, z); }
    else { if (r < 0.58) bastonEkle(); else if (r < 0.78) sakiz(x, z); else if (r < 0.9) pamukEkle(); else lolipop(x, z, ry, s); }
  }
  { const g = S.geo(), p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { const k = 0.8 + 0.2 * clamp(p.getY(i) / 5, 0, 1); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); }   // ton geçişi: dipte biraz koyu, yukarı doğru açık
    const m = new T.Mesh(g, cvMalz(skSalMod)); m.frustumCulled = false; scene.add(m); }
  if (loli.length) {
    skLoliDoku = tuvalDoku(256, 256, (g, w, h) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.lineCap = 'round'; g.strokeStyle = '#ff4f93'; g.lineWidth = w / 15;
      for (let kol = 0; kol < 2; kol++) { g.beginPath(); for (let k = 0; k <= 120; k++) { const a = k / 120 * 4 * Math.PI, r = k / 120 * w * 0.56, x = w / 2 + Math.cos(a + kol * Math.PI) * r, y = h / 2 + Math.sin(a + kol * Math.PI) * r; if (k) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
    });
    skLoliDoku.center.set(0.5, 0.5);
    // tombul şeker disk (düz karton disk değil): yassılmış küre, sarmal doku iki yüze önden yansıtılır
    const g = new T.SphereGeometry(1, 18, 8), gp = g.attributes.position, gu = g.attributes.uv;
    for (let i = 0; i < gp.count; i++) { gu.setXY(i, gp.getX(i) * 0.5 + 0.5, gp.getY(i) * 0.5 + 0.5); gp.setZ(i, gp.getZ(i) * 0.3); }
    g.computeVertexNormals();
    const lm = new T.MeshLambertMaterial({ map: skLoliDoku });   // baş, sapla aynı salınımı izler (dünya konumunda)
    lm.onBeforeCompile = sh => {
      sh.uniforms.cvT = cvZ;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float cvT;')
        .replace('#include <project_vertex>', 'vec4 mvPosition = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nmvPosition = instanceMatrix * mvPosition;\nfloat skF = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.41; float skY = instanceMatrix[3].y;\nmvPosition.x += sin(cvT * 1.3 + skF) * skY * 0.035; mvPosition.z += cos(cvT * 1.1 + skF) * skY * 0.02;\n#endif\nmvPosition = modelViewMatrix * mvPosition;\ngl_Position = projectionMatrix * mvPosition;');
    };
    lm.customProgramCacheKey = () => 'skLoli';
    cok(g, lm, loli);
  }
  if (skJole.length) {   // jöle tepecik: yerel ölçü büyük tutulur ki salınım belirgin olsun (tepede ~%6)
    const J = cvYapi(); J.ekle(cvG.yarim, 0, 0, 0, 20, 17, 20, BEYAZ, 0, 0, 0, 1); J.ekle(cvG.kureK, -7.6, 12.4, 7.6, 4, 2, 2.8, BEYAZ, -0.6, 0, 0.5);
    cok(J.geo(), cvMalz(1), skJole);
  }
  if (pamuk.length) {   // pamuk şeker ağacı: kâğıt külah + kabarık toplar (rüzgârda hafif salınır)
    const B = cvYapi(), skPam = new T.SphereGeometry(1, 8, 6);
    B.ekle(cvG.koni6, 0, 1.3, 0, 0.42, 2.6, 0.42, 0xfff7ef, Math.PI); B.ekle(skPam, 0, 3.6, 0, 1.75, 1.5, 1.75, BEYAZ, 0, 0, 0, 1);
    B.ekle(skPam, -1.05, 3.15, 0.4, 1.1, 1.0, 1.1, 0xf4f4f4, 0, 0, 0, 1); B.ekle(skPam, 1.05, 3.25, -0.3, 1.15, 1.0, 1.15, 0xf4f4f4, 0, 1, 0, 1); B.ekle(skPam, 0.15, 4.65, 0.15, 1.1, 0.95, 1.1, BEYAZ, 0, 2, 0, 1); B.ekle(skPam, 0, 3.2, 1.0, 1.0, 0.9, 1.0, 0xf4f4f4, 0, 3, 0, 1);
    cok(B.geo(), cvMalz(1), pamuk);
  }

  // ───────── şekerleme tepecikler: orta uzaklıkta alçak, yumuşak krema kabartıları (tek çizim) ─────────
  {
    const l = [];
    for (let k = 0; k < 60; k++) {
      const a = R() * 6.2832, rr = 50 + R() * 240, x = Math.cos(a) * rr, z = -78 + Math.sin(a) * rr, r = 7 + R() * 12, h = r * (0.14 + R() * 0.1);
      if (yakin(x, z) < YARI + 8 + r * 1.3 || !cvBos(x, z, r * 0.8)) continue; cvYasak.push([x, z, r * 0.7]);
      l.push([x, -0.05, z, r * 1.3, h, r, R() * 3.14, sec([0xfff6f0, 0xffe3ee, 0xeafff4, 0xf3e8ff])]);
    }
    if (l.length) cok(cvG.yarim, mat(0xffffff), l);
  }
  // ───────── gökte süzülen kek balonlar (3 kopya, tek çizim; hep yüksekte) ─────────
  {
    const B = cvYapi(), l = [];
    B.ekle(cvG.tac, 0, 0, 0, 5, 5.6, 5, BEYAZ, 0, 0, 0, 1); B.ekle(cvG.yarimK, 0, 2.6, 0, 4.5, 3.15, 4.5, 0xfffaf2); B.ekle(cvG.kure, 0, 6.0, 0, 0.62, 0.62, 0.62, KIRMIZI);
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; B.ekle(cvG.kureK, Math.cos(a) * 4.35, 2.5 - (k % 2) * 0.5, Math.sin(a) * 4.35, 0.75, 0.6 + (k % 2) * 0.4, 0.75, 0xfffaf2); }
    B.ekle(cvG.koni6, 0, -5.9, 0, 1.7, 2.2, 1.7, BEYAZ, Math.PI, 0, 0, 1);
    for (let k = 0; k < 4; k++) { const a = k * 1.5708 + 0.785; B.ekle(cvG.kutu, Math.cos(a) * 1.25, -7.4, Math.sin(a) * 1.25, 0.07, 1.9, 0.07, BEYAZ); }
    B.ekle(cvG.govdeK, 0, -9.2, 0, 1.9, 1.9, 1.9, GOFRET, Math.PI); B.ekle(cvG.sil, 0, -8.2, 0, 2.0, 0.24, 2.0, 0xfffaf2);
    [[0.6, 105, 40, 1.1, 0xff9ec7], [2.7, 150, 52, 1.35, 0x9be8c8], [4.6, 125, 46, 1.2, 0xffe27a]].forEach(e => l.push([Math.cos(e[0]) * e[1], e[2], Math.sin(e[0]) * e[1], e[3], e[3], e[3], e[0], e[4]]));
    skBalon = cok(B.geo(), cvMalz(0), l); skBalon.position.set(0, 0, -78); skBalon.frustumCulled = false;
  }
  // ───────── uzak manzara: kek tepeleri, dondurma külahı dağları, pamuk şeker bulutlar ─────────
  {
    const B = cvYapi(), tepe = [];
    const skKubbe = new T.SphereGeometry(1, 18, 5, 0, 6.2832, 0, 1.5708), skDamla = new T.SphereGeometry(1, 10, 6), skTaban = new T.CylinderGeometry(1, 1, 1, 18, 1, true);
    B.ekle(skTaban, 0, 0.17, 0, 1, 0.34, 1, 0xffe6bd); B.ekle(skKubbe, 0, 0.33, 0, 1.05, 0.5, 1.05, BEYAZ, 0, 0, 0, 1); B.ekle(cvG.kure, 0, 0.88, 0, 0.11, 0.11, 0.11, KIRMIZI);
    for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283; B.ekle(skDamla, Math.cos(a) * 0.97, 0.3 - (k % 3) * 0.025, Math.sin(a) * 0.97, 0.2, 0.13 + (k % 3) * 0.05, 0.13, BEYAZ, 0, -a, 0, 1); }   // yuvarlak krema damlaları
    for (let i = 0; i < 17; i++) { const a = i / 17 * 6.283 + R() * 0.2, r = 300 + R() * 70, w = 46 + R() * 30; tepe.push([Math.cos(a) * r, -1, -78 + Math.sin(a) * r, w, w * (0.62 + R() * 0.25), w, R() * 6, [0xffa6cc, 0xa8ecd0, 0xfff0c0, 0xd2b6ff, 0xffc4a0][i % 5]]); }
    cok(B.geo(), cvMalz(0), tepe);
    const D = cvYapi(), dag = [];
    D.ekle(cvG.koni, 0, 0.5, 0, 0.42, 1, 0.42, GOFRET, Math.PI); D.ekle(cvG.sil, 0, 1.0, 0, 0.45, 0.06, 0.45, 0xcf9448);
    D.ekle(cvG.tac, 0, 1.2, 0, 0.5, 0.42, 0.5, BEYAZ, 0, 0, 0, 1); D.ekle(cvG.tac, 0, 1.66, 0, 0.38, 0.33, 0.38, 0xfff6e8); D.ekle(cvG.kure, 0, 2.02, 0, 0.1, 0.1, 0.1, KIRMIZI);
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + R() * 0.25, r = 480 + R() * 60, h = 40 + R() * 22;   // ufuk sakin kalsın: daha az ve daha küçük külah
      dag.push([Math.cos(a) * r, -4, -78 + Math.sin(a) * r, h, h, h, R() * 6, [0xff9fc6, 0x9fe3c6, 0xbfa2ff, 0xffd98a, 0x9fd4ff][i % 5]]); }
    cok(D.geo(), cvMalz(0), dag);
    const C = cvYapi(), bulut = [];
    C.ekle(cvG.ico, 0, 0, 0, 13, 8, 10, BEYAZ); C.ekle(cvG.ico, -12, -1.5, 1, 9, 5.6, 8, BEYAZ); C.ekle(cvG.ico, 12, -1, -1, 10, 6.2, 8, BEYAZ); C.ekle(cvG.ico, 5, 3.5, 2, 8, 5.5, 7, BEYAZ); C.ekle(cvG.kure, -21, -3, 0, 6, 3.4, 5.5, BEYAZ); C.ekle(cvG.kure, 21.5, -3, 0, 6, 3.4, 5.5, BEYAZ);
    const g = C.geo(), p = g.attributes.position, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) { const y = Math.max(p.getY(i), -3.6); p.setY(i, y); const t = clamp((y + 3.6) / 9, 0, 1); c.setXYZ(i, lerp(0.86, 1, t), lerp(0.72, 1, t), lerp(0.84, 1, t)); }
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + R() * 0.4, r = 130 + R() * 320, s = 0.9 + R() * 1.1; bulut.push([Math.cos(a) * r, 92 + R() * 60, Math.sin(a) * r, s, s * 0.9, s, R() * 6, [0xffffff, 0xffd0e6, 0xfff0f6, 0xd6ecff, 0xffdcec][i % 5]]); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + 0.2, r = 430 + R() * 60, s = 2.3 + R() * 0.8; bulut.push([Math.cos(a) * r, 44 + R() * 14, Math.sin(a) * r, s, s * 0.7, s, R() * 6, [0xffffff, 0xffe6f0, 0xf3ecff][i % 3]]); }   // ufka yakın krema bulut kümeleri
    skBulut = cok(g, new T.MeshBasicMaterial({ vertexColors: true, fog: false }), bulut); skBulut.position.set(0, 0, -78);
    // en uzak katman: puslu pastel tepe silueti (tek çizim)
    const U = cvYapi(); U.yer(0, -78, 0);
    const skYum = new T.SphereGeometry(1, 14, 6, 0, 6.2832, 0, Math.PI / 2);
    for (let k = 0; k < 30; k++) { const a = k / 30 * 6.2832 + 0.1, rr = 600 + (k % 3) * 18, w = 66 + ((k * 7) % 5) * 15, h = 64 + ((k * 3) % 4) * 16; U.ekle(skYum, Math.cos(a) * rr, -4, Math.sin(a) * rr, w, h, w * 0.8, [0xf0b6de, 0xd0bcf4, 0xf6c0d6][k % 3], 0, -a); }
    const um = new T.Mesh(U.geo(), new T.MeshBasicMaterial({ vertexColors: true, fog: false })); um.frustumCulled = false; scene.add(um);
  }

  // ───────── temas gölgeleri (tek çizim) ─────────
  {
    const d = tuvalDoku(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(120,58,92,.26)'); r.addColorStop(0.45, 'rgba(120,58,92,.13)'); r.addColorStop(1, 'rgba(120,58,92,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    const g = new T.PlaneGeometry(2, 2); g.rotateX(-Math.PI / 2); const sh = cok(g, new T.MeshBasicMaterial({ map: d, transparent: true, depthWrite: false }), golge); sh.renderOrder = 1;
  }

  // (serpinti pırıltısı kaldırıldı: yol kenarında yıldızlarla yarışıyordu)
}
