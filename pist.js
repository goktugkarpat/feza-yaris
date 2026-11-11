/* Pist görselleri: yol, kenar bantları, başlangıç kemeri, hızlandırma okları, tümsekler, yıldızlar, konfeti ve pist üstü efektler
   (toz izi, roket pırıltısı, hız çizgileri, iniş tozu, yıldız patlaması). pistGuncelle(dt, t) her karede çağrılır.
   Bu dosyanın yeni üst düzey adları `ps` önekiyle başlar. Kare başına yeni nesne oluşturulmaz: bütün parçacıklar sabit havuzdadır. */
'use strict';

// ───────── yol ─────────
const yolDoku = tuvalDoku(512, 512, (g, w, h) => {
  if(cvTema!=='orman') {
    const kar=cvTema==='kar',gr=g.createLinearGradient(0,0,w,0);
    gr.addColorStop(0,kar?'#abc9db':'#ddb979');gr.addColorStop(.5,kar?'#c9dfec':'#edd09a');gr.addColorStop(1,kar?'#abc9db':'#ddb979');g.fillStyle=gr;g.fillRect(0,0,w,h);
    for(let k=0;k<900;k++){g.fillStyle=kar?(k%3?'#dcecf5':'#8fb6cf'):(k%3?'#f5dfb4':'#c89e61');g.globalAlpha=.28;g.beginPath();g.ellipse(R()*w,R()*h,1+R()*2,1+R()*3,0,0,7);g.fill();}
    for(const u of [.2,.34,.66,.8]){const x=u*w,iz=g.createLinearGradient(x-19,0,x+19,0);iz.addColorStop(0,'rgba(100,115,125,0)');iz.addColorStop(.5,kar?'rgba(96,137,163,.20)':'rgba(143,104,60,.18)');iz.addColorStop(1,'rgba(100,115,125,0)');g.globalAlpha=1;g.fillStyle=iz;g.fillRect(x-19,0,38,h);}
    g.lineCap='round';g.strokeStyle=kar?'#f8fdff':'#fff6de';g.lineWidth=15;g.beginPath();g.moveTo(w/2,h*.14);g.lineTo(w/2,h*.50);g.stroke();g.globalAlpha=1;return;
  }
  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, '#cf9f66'); gr.addColorStop(0.12, '#dcb27c'); gr.addColorStop(0.5, '#e6c08c'); gr.addColorStop(0.88, '#dcb27c'); gr.addColorStop(1, '#cf9f66');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const leke = (x, y, rx, ry, renk, a) => { g.globalAlpha = a; g.fillStyle = renk; for (const dy of [-h, 0, h]) { g.beginPath(); g.ellipse(x, y + dy, rx, ry, 0, 0, 7); g.fill(); } };
  for (let i = 0; i < 90; i++) leke(R() * w, R() * h, 14 + R() * 26, 20 + R() * 40, i % 2 ? '#c99a62' : '#eccb9a', 0.10);          // yumuşak lekeler
  for (let i = 0; i < 1500; i++) { const r = 0.8 + R() * 2.4; leke(R() * w, R() * h, r * 0.7, r, ['#c39258', '#f0d3a4', '#b98a55', '#e9c795'][i % 4], 0.5); }   // çakıl
  for (let i = 0; i < 46; i++) { const r = 3 + R() * 3; const x = R() * w, y = R() * h; leke(x + 1, y + 2, r * 0.7, r, '#a67c4b', 0.35); leke(x, y, r * 0.7, r, i % 3 ? '#f4e2c2' : '#d8c1a0', 0.9); }   // iri taşlar
  for (const u of [0.2, 0.34, 0.66, 0.8]) {   // tekerlek izleri
    const x = u * w, iz = g.createLinearGradient(x - 22, 0, x + 22, 0); iz.addColorStop(0, 'rgba(150,104,60,0)'); iz.addColorStop(0.5, 'rgba(150,104,60,0.26)'); iz.addColorStop(1, 'rgba(150,104,60,0)');
    g.globalAlpha = 1; g.fillStyle = iz; g.fillRect(x - 22, 0, 44, h);
    g.globalAlpha = 0.10; g.fillStyle = '#8a5c33'; for (let y = 0; y < h; y += 16) g.fillRect(x - 9, y, 18, 5);
  }
  g.globalAlpha = 1;
  for (const x of [0, w]) { const k = g.createLinearGradient(x ? w - 46 : 0, 0, x ? w : 46, 0); k.addColorStop(x ? 1 : 0, 'rgba(140,96,56,0.42)'); k.addColorStop(x ? 0 : 1, 'rgba(140,96,56,0)'); g.fillStyle = k; g.fillRect(x ? w - 46 : 0, 0, 46, h); }
  // orta çizgi (kesikli, yuvarlak uçlu)
  g.lineCap = 'round'; g.strokeStyle = 'rgba(150,104,60,0.35)'; g.lineWidth = 19; g.beginPath(); g.moveTo(w / 2 + 2, h * 0.14 + 5); g.lineTo(w / 2 + 2, h * 0.50 + 5); g.stroke();
  g.strokeStyle = '#fff8e6'; g.lineWidth = 15; g.beginPath(); g.moveTo(w / 2, h * 0.14); g.lineTo(w / 2, h * 0.50); g.stroke();
  g.globalAlpha = 0.5; g.fillStyle = '#e6c08c'; for (let i = 0; i < 26; i++) g.fillRect(w / 2 - 9 + R() * 18, h * 0.12 + R() * h * 0.4, 2 + R() * 3, 2 + R() * 5);
  g.globalAlpha = 1;
}, true);
scene.add(new T.Mesh(serit(-YARI, YARI, 0.02, 9), mat(0xffffff, { map: yolDoku })));

// kenar bantları + çim geçişi (iki yan tek parça)
const bantDoku = tuvalDoku(128, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = cvTema==='kar'?'#d7edf9':cvTema==='kiyi'?'#ead098':'#2f8f3e'; g.fillRect(w * 0.5, 0, w * 0.3, h);                                   // temaya uygun yol omzu
  for (let i = 0; i < 40; i++) { const y = i / 40 * h, u = 10 + R() * 22; g.beginPath(); g.moveTo(w * 0.78, y - 5); g.lineTo(w * 0.78 + u, y + 1); g.lineTo(w * 0.78, y + 7); g.fill(); }   // çim uçları
  g.fillStyle = cvTema==='kar'?'#f4fbff':cvTema==='kiyi'?'#f8e2b6':'#3fa64c'; for (let i = 0; i < 60; i++) g.fillRect(w * 0.6 + R() * w * 0.2, R() * h, 3, 7);
  g.fillStyle = '#fff6e6'; g.fillRect(0, 0, w * 0.58, h);
  g.fillStyle = cvTema==='kar'?'#589fc6':'#ff5f4d'; g.fillRect(w * 0.1, 0, w * 0.48, h / 2);
  g.fillStyle = 'rgba(120,40,30,0.25)'; g.fillRect(w * 0.54, 0, w * 0.04, h);
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(w * 0.1, 0, w * 0.05, h / 2);
}, true);
const bantMat = mat(0xffffff, { map: bantDoku, alphaTest: 0.5 });
{
  const pos = [], uv = [], nor = [], idx = [];
  for (const yan of [-1, 1]) {
    const t0 = pos.length / 3, ic = yan * (YARI - 0.2), dis = yan * (YARI + 2.0);
    for (let i = 0; i <= N; i++) {
      const k = i % N, rx = -TZ[k], rz = TX[k], v = i * DS / 3, a = yan < 0 ? dis : ic, b = yan < 0 ? ic : dis;
      pos.push(PX[k] + rx * a, 0.05, PZ[k] + rz * a, PX[k] + rx * b, 0.05, PZ[k] + rz * b); nor.push(0, 1, 0, 0, 1, 0); uv.push(yan < 0 ? 1 : 0, v, yan < 0 ? 0 : 1, v);
      if (i < N) { const q = t0 + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new T.Mesh(g, bantMat); m.frustumCulled = false; scene.add(m);
}

// ───────── tek parça renkli süs kurucusu (kemer, tümsekler tek çizimde) ─────────
const psV = [], psNo = [], psC = [], psK = new T.Object3D(), psM = new T.Matrix4(), psN3 = new T.Matrix3(), psA = new T.Vector3(), psB = new T.Vector3(), psD = new T.Vector3();
function psTaban(s, d) { const p = pist(s), m = new T.Matrix4(); psK.position.set(p.x - p.tz * d, 0, p.z + p.tx * d); psK.scale.set(1, 1, 1); psK.rotation.set(0, Math.atan2(p.tx, p.tz), 0); psK.updateMatrix(); return m.copy(psK.matrix); }
function psParca(taban, geo, renk, x, y, z, sx, sy, sz, rx, ry, rz) {
  psK.position.set(x, y, z); psK.scale.set(sx, sy, sz); psK.rotation.set(rx || 0, ry || 0, rz || 0); psK.updateMatrix();
  psM.multiplyMatrices(taban, psK.matrix); psN3.getNormalMatrix(psM); renkT.setHex(renk);
  const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    psA.fromBufferAttribute(p, i).applyMatrix4(psM); psV.push(psA.x, psA.y, psA.z);
    psA.fromBufferAttribute(n, i).applyMatrix3(psN3).normalize(); psNo.push(psA.x, psA.y, psA.z); psC.push(renkT.r, renkT.g, renkT.b);
  }
}
function psYuz(taban, renk, n) {   // n: [x,y,z, x,y,z, ...] yerel köşeler (üçgen ya da dörtgen)
  renkT.setHex(renk); const k = [];
  for (let i = 0; i < n.length; i += 3) { psA.set(n[i], n[i + 1], n[i + 2]).applyMatrix4(taban); k.push(psA.x, psA.y, psA.z); }
  psA.set(k[3] - k[0], k[4] - k[1], k[5] - k[2]); psB.set(k[6] - k[0], k[7] - k[1], k[8] - k[2]); psD.crossVectors(psA, psB).normalize(); if (psD.y < 0) psD.negate();
  for (const i of (k.length > 9 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2])) { psV.push(k[i * 3], k[i * 3 + 1], k[i * 3 + 2]); psNo.push(psD.x, psD.y, psD.z); psC.push(renkT.r, renkT.g, renkT.b); }
}
function psCubuk(taban, renk, x1, y1, x2, y2, z, kalin) { const dx = x2 - x1, dy = y2 - y1; psParca(taban, G.kutu, renk, (x1 + x2) / 2, (y1 + y2) / 2, z, kalin, Math.hypot(dx, dy), kalin, 0, 0, -Math.atan2(dx, dy)); }

// yıldız biçimi (toplanan yıldızlar + kemer süsü)
const yildizSekil = new T.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - Math.PI / 2, r = i % 2 ? 0.46 : 1; yildizSekil[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, -Math.sin(a) * r); } yildizSekil.closePath();
const psYildizGeo = new T.ExtrudeGeometry(yildizSekil, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 1 }); psYildizGeo.translate(0, 0, -0.08); psYildizGeo.computeVertexNormals();

// ───────── başlangıç/bitiş kemeri ve çizgisi ─────────
// süsler gölgede de canlı renkli kalsın: kendi renginden biraz ışık ekler
function psParlat(m, oran) { m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance += vColor.rgb * ' + oran.toFixed(2) + ';\n#endif'); }; return m; }
const psRENK = [0xff6f5a, 0xffd23f, 0x4aa8ff, 0x7ed957, 0xb98cff, 0xff8fc0];
const dama = tuvalDoku(256, 48, (g, w, h) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 3; y++) { g.fillStyle = (x + y) % 2 ? '#23262f' : '#ffffff'; g.fillRect(x * 16, y * 16, 16, 16); } });
dama.magFilter = T.NearestFilter;
const psAfis = tuvalDoku(352, 32, (g, w, h) => { for (let x = 0; x < 22; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#23262f' : '#ffffff'; g.fillRect(x * 16, y * 16, 16, 16); } });
psAfis.magFilter = T.NearestFilter;
const psBALON = [], psBalonIM = new T.InstancedMesh(G.kure, psParlat(mat(0xffffff), 0.45), 6);
{
  const tb = psTaban(0, 0), X0 = YARI + 2.6, H = 9.8;
  const cizgi = new T.Mesh(new T.PlaneGeometry(GEN - 0.3, 2.6), new T.MeshBasicMaterial({ map: dama, color: 0xf3f3f3 })); cizgi.rotation.x = -Math.PI / 2; cizgi.position.y = 0.045;
  const k = new T.Group(); k.applyMatrix4(tb); k.add(cizgi); scene.add(k);
  const pano = new T.Mesh(new T.BoxGeometry(X0 * 2 - 0.5, 1.7, 0.36), new T.MeshBasicMaterial({ map: psAfis, color: 0xf3f3f3 })); pano.position.y = H - 1.0; k.add(pano);
  psParca(tb, G.kutu, 0xffd23f, 0, H - 0.02, 0, X0 * 2 + 0.3, 0.3, 0.6); psParca(tb, G.kutu, 0xff6f5a, 0, H - 1.98, 0, X0 * 2 + 0.3, 0.3, 0.6);                    // afiş çerçevesi
  psParca(tb, G.kutu, 0xfff4e2, 0, 0.047, -1.42, GEN - 0.3, 0.02, 0.2); psParca(tb, G.kutu, 0xfff4e2, 0, 0.047, 1.42, GEN - 0.3, 0.02, 0.2);          // yerdeki çizginin kenarları
  for (const yan of [-1, 1]) {
    const x = yan * X0;
    psParca(tb, G.sil, 0x4aa8ff, x, 0.3, 0, 0.85, 0.6, 0.85); psParca(tb, G.sil, 0xffd23f, x, 0.68, 0, 0.62, 0.2, 0.62);                                  // direk ayağı
    for (let i = 0; i < 9; i++) psParca(tb, G.sil, i % 2 ? 0xfff4e2 : cvTema==='kar'?0x72b6d7:0xff6f5a, x, 0.78 + (i + 0.5) * (H - 0.78) / 9, 0, 0.38, (H - 0.78) / 9, 0.38);       // şeker çubuğu direk
    psParca(tb, G.sil, 0xffd23f, x, H + 0.1, 0, 0.55, 0.22, 0.55); psParca(tb, G.kure, 0xffd23f, x, H + 0.55, 0, 0.42, 0.42, 0.42);
    // yan ipte renkli bayraklar
    const x2 = yan * (X0 + 7.5), y1 = H - 0.3, y2 = 1.5; psParca(tb, G.sil, 0x4aa8ff, x2, 0.85, 0, 0.16, 1.7, 0.16); psParca(tb, G.kure, 0xffd23f, x2, 1.8, 0, 0.26, 0.26, 0.26);
    for (let i = 0; i < 8; i++) {
      const u0 = (i + 0.12) / 8, u1 = (i + 0.88) / 8, sark = u => lerp(y1, y2, u) - Math.sin(u * Math.PI) * 0.9, xa = lerp(x, x2, u0), xb = lerp(x, x2, u1), ya = sark(u0), yb = sark(u1);
      psYuz(tb, psRENK[(i + (yan > 0 ? 3 : 0)) % 6], [xa, ya, 0, xb, yb, 0, (xa + xb) / 2, (ya + yb) / 2 - 1.05, 0]);
      psCubuk(tb, 0xfff4e2, lerp(x, x2, i / 8), sark(i / 8), lerp(x, x2, (i + 1) / 8), sark((i + 1) / 8), 0, 0.05);
    }
    // balonlar
    for (let i = 0; i < 3; i++) {
      const bx = x + (i - 1) * 0.95 + yan * 0.2, by = H + 2.3 + (i === 1 ? 0.75 : 0), bz = (i - 1) * 0.25;
      psCubuk(tb, 0xfff4e2, x, H + 0.8, bx, by - 0.7, bz * 0.5, 0.035);
      psA.set(bx, by, bz).applyMatrix4(tb); psBALON.push(psA.x, psA.y, psA.z); psBalonIM.setColorAt(psBALON.length / 3 - 1, renkT.setHex(psRENK[(i * 2 + (yan > 0 ? 1 : 0)) % 6]));
    }
  }
  psParca(tb, psYildizGeo, 0xffd23f, 0, H + 1.05, 0, 1.0, 1.0, 1.6); psParca(tb, psYildizGeo, 0xfff4e2, -2.3, H + 0.7, 0, 0.55, 0.55, 1.4); psParca(tb, psYildizGeo, 0xfff4e2, 2.3, H + 0.7, 0, 0.55, 0.55, 1.4);
  psBalonIM.instanceColor.needsUpdate = true; psBalonIM.frustumCulled = false; scene.add(psBalonIM);
}

// ───────── tümsekler: çizgili sevimli rampa ─────────
for (const o of TUMSEK) {
  const tb = psTaban(o.s, o.d), W = RAMPA.yari, Z0 = RAMPA.bas, Z1 = RAMPA.tepe, HH = RAMPA.h, n = 6;
  for (let i = 0; i < n; i++) { const za = lerp(Z0, Z1, i / n), zb = lerp(Z0, Z1, (i + 1) / n), ya = HH * i / n, yb = HH * (i + 1) / n; psYuz(tb, i % 2 ? 0xff6f5a : 0xffd23f, [-W, ya, za, W, ya, za, W, yb, zb, -W, yb, zb]); }
  psYuz(tb, 0xe9543f, [-W, HH, Z1, W, HH, Z1, W, 0, RAMPA.son, -W, 0, RAMPA.son]);
  psParca(tb, G.kutu, 0xfff4e2, 0, HH + 0.02, Z1 - 0.05, W * 2 + 0.3, 0.16, 0.3);                                                                  // tepedeki beyaz dudak
  for (const x of [-W, W]) {
    psYuz(tb, 0xd9482f, [x, 0, Z0, x, 0, Z1, x, HH, Z1]); psYuz(tb, 0xd9482f, [x, 0, Z1, x, 0, RAMPA.son, x, HH, Z1]);
    psYuz(tb, 0xfff4e2, [x - 0.14, 0.03, Z0, x + 0.14, 0.03, Z0, x + 0.14, HH + 0.03, Z1, x - 0.14, HH + 0.03, Z1]);                                    // beyaz kenar çizgisi
    const px = x + Math.sign(x) * 0.55; for (let i = 0; i < 4; i++) psParca(tb, G.sil, i % 2 ? 0xfff4e2 : 0x4aa8ff, px, 0.2 + i * 0.4, Z1 - 0.2, 0.17, 0.4, 0.17);
    psParca(tb, G.kure, 0xffd23f, px, 1.95, Z1 - 0.2, 0.3, 0.3, 0.3);
  }
}
{
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(psV, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(psNo, 3)); g.setAttribute('color', new T.Float32BufferAttribute(psC, 3));
  const m = new T.Mesh(g, psParlat(new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide }), 0.42)); m.frustumCulled = false; scene.add(m);
}

// ───────── hızlandırma okları: mavi parlak zemin + ileri akan oklar ─────────
const okDoku = tuvalDoku(128, 64, (g, w, h) => {   // tek ok; pist üstünde arka arkaya üç kez yinelenir ve ileri akar
  g.clearRect(0, 0, w, h); g.lineJoin = 'miter'; g.lineCap = 'round';
  const ok = (renk, kalin) => { g.strokeStyle = renk; g.lineWidth = kalin; for (const dy of [-h, 0, h]) { g.beginPath(); g.moveTo(22, 52 + dy); g.lineTo(64, 12 + dy); g.lineTo(106, 52 + dy); g.stroke(); } };
  ok('rgba(0,84,180,0.6)', 21); ok('#ffffff', 13); ok('#fff3a8', 4);
}, true);
const okMat = new T.MeshBasicMaterial({ map: okDoku, transparent: true, depthWrite: false });
const psOkZemin = tuvalDoku(128, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  const yol = p => { g.beginPath(); g.roundRect(p, p, w - p * 2, h - p * 2, 26 - p * 0.6); };
  yol(3); g.fillStyle = '#ffffff'; g.fill();
  const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#1596f2'); gr.addColorStop(1, '#3fe0ff'); yol(11); g.fillStyle = gr; g.fill();
});
const psOkZeminMat = new T.MeshBasicMaterial({ map: psOkZemin, transparent: true, depthWrite: false });
{
  const kur = (yw, yl, y, vTekrar) => {
    const pos = [], uv = [], idx = [];
    OKLAR.forEach((o, i) => {
      const p = pist(o.s), cx = p.x - p.tz * o.d, cz = p.z + p.tx * o.d, sx = -p.tz, sz = p.tx;
      for (const [a, b, u, v] of [[-1, -1, 1, 0], [1, -1, 0, 0], [1, 1, 0, vTekrar], [-1, 1, 1, vTekrar]]) { pos.push(cx + sx * a * yw + p.tx * b * yl, y, cz + sz * a * yw + p.tz * b * yl); uv.push(u, v); }
      idx.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4, i * 4 + 3, i * 4 + 2);
    });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
  };
  const z = new T.Mesh(kur(2.6, 3.6, 0.06, 1), psOkZeminMat), k = new T.Mesh(kur(2.0, 3.15, 0.075, 3), okMat);
  for (const m of [z, k]) { m.material.side = T.DoubleSide; m.frustumCulled = false; scene.add(m); } z.renderOrder = 1; k.renderOrder = 2;
}

// ───────── yıldızlar ─────────
const yildizIM = new T.InstancedMesh(psYildizGeo, new T.MeshLambertMaterial({ color: 0xffd633, emissive: 0xb86f00 }), YILDIZ.length);
yildizIM.frustumCulled = false; scene.add(yildizIM);

// ───────── parçacık havuzları (toz, pırıltı, yıldız ışıltısı) ─────────
const psOlcek = { value: 600 };
const psTozDoku = tuvalDoku(64, 64, (g, w, h) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,0.75)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
const psPirilDoku = tuvalDoku(64, 64, (g, w, h) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 30); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.18, 'rgba(255,255,255,0.8)'); r.addColorStop(0.5, 'rgba(255,255,255,0.14)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, q = i % 2 ? 4 : 31; g.lineTo(32 + Math.cos(a) * q, 32 + Math.sin(a) * q); } g.fill();
});
function psNoktaMat(doku, katki) {
  return new T.ShaderMaterial({
    uniforms: { uDoku: { value: doku }, uOlcek: psOlcek }, transparent: true, depthWrite: false, blending: katki ? T.AdditiveBlending : T.NormalBlending,
    vertexShader: 'attribute vec4 aRenk; attribute float aBoy; uniform float uOlcek; varying vec4 vRenk;\nvoid main(){ vRenk = aRenk; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = min(220.0, aBoy * uOlcek / max(0.5, -mv.z)); }',
    fragmentShader: 'uniform sampler2D uDoku; varying vec4 vRenk;\nvoid main(){ vec4 t = texture2D(uDoku, gl_PointCoord); gl_FragColor = vec4(vRenk.rgb * t.rgb, vRenk.a * t.a); if (gl_FragColor.a < 0.004) discard;\n#include <colorspace_fragment>\n}'
  });
}
function psHavuz(n, doku, katki) {
  const f = k => new Float32Array(n * k), h = { n, i: 0, canli: 0, pos: f(3), hiz: f(3), renk: f(4), boy: f(1), omur: f(1), tam: f(1), b0: f(1), b1: f(1), a0: f(1), yc: f(1), sur: f(1) };
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(h.pos, 3)); g.setAttribute('aRenk', new T.BufferAttribute(h.renk, 4)); g.setAttribute('aBoy', new T.BufferAttribute(h.boy, 1));
  h.geo = g; h.pts = new T.Points(g, psNoktaMat(doku, katki)); h.pts.frustumCulled = false; h.pts.visible = false; h.pts.renderOrder = katki ? 6 : 5; scene.add(h.pts); return h;
}
function psSac(h, x, y, z, vx, vy, vz, renk, a, b0, b1, omur, yc, sur) {
  const i = h.i; h.i = (i + 1) % h.n; const j = i * 3, q = i * 4;
  h.pos[j] = x; h.pos[j + 1] = y; h.pos[j + 2] = z; h.hiz[j] = vx; h.hiz[j + 1] = vy; h.hiz[j + 2] = vz;
  renkT.setHex(renk); h.renk[q] = renkT.r; h.renk[q + 1] = renkT.g; h.renk[q + 2] = renkT.b; h.renk[q + 3] = a;
  h.a0[i] = a; h.b0[i] = b0; h.b1[i] = b1; h.boy[i] = b0; h.omur[i] = h.tam[i] = omur; h.yc[i] = yc; h.sur[i] = sur; h.canli++;
}
function psHavuzAdim(h, dt) {
  if (!h.canli) { h.pts.visible = false; return; }
  let c = 0;
  for (let i = 0; i < h.n; i++) {
    if (h.omur[i] <= 0) continue;
    const o = h.omur[i] - dt, j = i * 3;
    if (o <= 0) { h.omur[i] = 0; h.boy[i] = 0; h.renk[i * 4 + 3] = 0; continue; }
    h.omur[i] = o; c++;
    const k = 1 - o / h.tam[i], s = Math.max(0, 1 - h.sur[i] * dt);
    h.hiz[j] *= s; h.hiz[j + 1] = h.hiz[j + 1] * s - h.yc[i] * dt; h.hiz[j + 2] *= s;
    h.pos[j] += h.hiz[j] * dt; h.pos[j + 1] += h.hiz[j + 1] * dt; h.pos[j + 2] += h.hiz[j + 2] * dt;
    if (h.pos[j + 1] < 0.1) { h.pos[j + 1] = 0.1; h.hiz[j + 1] *= -0.35; }
    h.boy[i] = lerp(h.b0[i], h.b1[i], k); h.renk[i * 4 + 3] = h.a0[i] * (1 - k * k);
  }
  h.canli = c; h.pts.visible = c > 0;
  h.geo.attributes.position.needsUpdate = true; h.geo.attributes.aRenk.needsUpdate = true; h.geo.attributes.aBoy.needsUpdate = true;
}
const psToz = psHavuz(110, psTozDoku, false), psPiril = psHavuz(200, psPirilDoku, true), psHale = psHavuz(YILDIZ.length, psTozDoku, true);
{ renkT.setHex(0xffc533); for (let i = 0; i < YILDIZ.length; i++) { psHale.renk[i * 4] = renkT.r; psHale.renk[i * 4 + 1] = renkT.g; psHale.renk[i * 4 + 2] = renkT.b; psHale.renk[i * 4 + 3] = 0.3; psHale.pos[i * 3] = YILDIZ[i].x; psHale.pos[i * 3 + 2] = YILDIZ[i].z; } psHale.pts.visible = true; psHale.pts.renderOrder = 4; }
const psPIRIL_RENK = [0xffffff, 0xffe066, 0xffb347, 0x8fe8ff, 0xff9ad5];

// hız çizgileri (yalnız roket sırasında)
const psCN = 16, psCizgiVeri = new Float32Array(psCN * 5);   // x, y, z, açı, boy
const psCizgiIM = (() => {
  const a = new T.PlaneGeometry(0.09, 1), b = new T.PlaneGeometry(0.09, 1); a.rotateX(-Math.PI / 2); b.rotateX(-Math.PI / 2); b.rotateZ(Math.PI / 2);
  const g = new T.BufferGeometry(), pos = new Float32Array(24); pos.set(a.attributes.position.array, 0); pos.set(b.attributes.position.array, 12);
  g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setIndex([0, 2, 1, 2, 3, 1, 4, 6, 5, 6, 7, 5]);
  const im = new T.InstancedMesh(g, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }), psCN);
  im.frustumCulled = false; im.visible = false; im.renderOrder = 3; scene.add(im); return im;
})();
function psCizgiKoy(i, ileri) {
  const p = pist(P.yol + ileri), yer = i % 3 === 0, d = yer ? (Math.random() - 0.5) * 11 : (Math.random() < 0.5 ? -1 : 1) * (YARI + 1.5 + Math.random() * 4), q = i * 5;
  psCizgiVeri[q] = p.x - p.tz * d; psCizgiVeri[q + 1] = yer ? 0.1 : 0.8 + Math.random() * 2.6; psCizgiVeri[q + 2] = p.z + p.tx * d; psCizgiVeri[q + 3] = Math.atan2(p.tx, p.tz); psCizgiVeri[q + 4] = yer ? 1.6 + Math.random() * 1.4 : 3.5 + Math.random() * 4;
}

// ───────── konfeti (dönerek süzülen renkli kâğıtlar) ─────────
const KN = 260, kPos = new Float32Array(KN * 3), kHiz = new Float32Array(KN * 3), kRenk = new Float32Array(KN * 3), psKDon = new Float32Array(KN * 3);
const kGeo = new T.PlaneGeometry(0.3, 0.2);
const konfeti = new T.InstancedMesh(kGeo, new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide }), KN);
for (let i = 0; i < KN; i++) { renkT.setHex([0xff5a6e, 0xffd84a, 0x6fd3ff, 0x8fe07a, 0xffffff, 0xb98cff, 0xff9a3c][i % 7]); kRenk[i * 3] = renkT.r; kRenk[i * 3 + 1] = renkT.g; kRenk[i * 3 + 2] = renkT.b; konfeti.setColorAt(i, renkT); psKDon[i * 3] = Math.random() * 6.28; psKDon[i * 3 + 1] = 3 + Math.random() * 6; psKDon[i * 3 + 2] = 2 + Math.random() * 5; }
konfeti.frustumCulled = false; konfeti.visible = false; scene.add(konfeti);
function konfetiAt(x, z) {
  const p = pist(P.yol), sx = -p.tz, sz = p.tx;
  for (let i = 0; i < KN; i++) {
    const j = i * 3;
    if (i % 2) {   // iki yandan fışkıran
      const yan = i % 4 === 1 ? -1 : 1, a = Math.random() * 6.283, r = Math.random() * 2.6;
      kPos[j] = x + sx * yan * 5.5; kPos[j + 1] = 0.6 + Math.random(); kPos[j + 2] = z + sz * yan * 5.5;
      kHiz[j] = -sx * yan * (1.5 + Math.random() * 2.5) + Math.cos(a) * r; kHiz[j + 1] = 5.5 + Math.random() * 4.5; kHiz[j + 2] = -sz * yan * (1.5 + Math.random() * 2.5) + Math.sin(a) * r;
    } else {       // yukarıdan süzülen
      kPos[j] = x + (Math.random() - 0.5) * 13; kPos[j + 1] = 1.5 + Math.random() * 8; kPos[j + 2] = z + (Math.random() - 0.5) * 13;
      kHiz[j] = (Math.random() - 0.5) * 1.5; kHiz[j + 1] = -1 - Math.random() * 1.5; kHiz[j + 2] = (Math.random() - 0.5) * 1.5;
    }
  }
  konfeti.visible = true;
}

// ───────── olaylar ─────────
let psDurum = 'baslik', psRoketT = 0, psHopOnce = 0, psTozSay = 0, psPirilSay = 0, psCizgiHazir = false;
OLAY.on('durum', d => { psDurum = d; if (d !== 'yaris') psRoketT = 0; });
OLAY.on('roket', sure => { psRoketT = Math.max(psRoketT, sure || 1.3); });
OLAY.on('yildiz', y => {   // toplanan yıldızdan küçük pırıltı patlaması (arabayla birlikte ilerler)
  if (!y || y.x === undefined) return;
  const vx = P.tx * P.v * 0.9, vz = P.tz * P.v * 0.9;
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + Math.random() * 0.4, r = 3.2 + Math.random() * 2.2; psSac(psPiril, y.x, 1.7, y.z, vx + Math.cos(a) * r * -P.tz, 1.5 + Math.sin(a) * r, vz + Math.cos(a) * r * P.tx, i % 3 ? 0xffe066 : 0xffffff, 0.95, 0.75, 0.15, 0.42 + Math.random() * 0.14, 5, 1.2); }
});
OLAY.on('tok', () => { for (let i = 0; i < 7; i++) { const a = Math.random() * 6.283; psSac(psPiril, P.x, 1.1, P.z, P.tx * P.v * 0.8 + Math.cos(a) * 3, 1 + Math.random() * 3, P.tz * P.v * 0.8 + Math.sin(a) * 3, 0xffffff, 0.9, 0.6, 0.1, 0.32, 6, 1.5); } });
function psCizgiPirilti(n, hizV) {   // başlangıç çizgisi boyunca kısa pırıltı
  const p = pist(0);
  for (let i = 0; i < n; i++) { const d = ((i + Math.random()) / n - 0.5) * (GEN + 3); psSac(psPiril, p.x - p.tz * d + p.tx * 2, 0.4 + Math.random() * 1.2, p.z + p.tx * d + p.tz * 2, p.tx * hizV, 2.5 + Math.random() * 4.5, p.tz * hizV, psPIRIL_RENK[i % 5], 0.95, 0.9, 0.2, 0.7 + Math.random() * 0.5, 2.5, 0.8); }
}
OLAY.on('tur', n => { if (n < TUR) psCizgiPirilti(18, P.v * 0.75); });
OLAY.on('bitis', () => psCizgiPirilti(44, P.v * 0.3));
OLAY.on('seri', v => {
  if(!v || !v.odul)return;
  // Üç yıldızın ödülü arabadan ileri açılan kısa bir renk yelpazesi; görüşü kapatmaz.
  for(let i=0;i<18;i++) {
    const a=(i/17-.5)*Math.PI*1.1, yan=Math.sin(a), ileri=Math.cos(a), hiz=3+Math.random()*2;
    psSac(psPiril,P.x+P.tx*1.3,1.35,P.z+P.tz*1.3,P.tx*(P.v*.88+ileri*hiz)-P.tz*yan*hiz,1.7+Math.random()*2.6,P.tz*(P.v*.88+ileri*hiz)+P.tx*yan*hiz,psPIRIL_RENK[i%5],.92,.64,.08,.5+Math.random()*.18,5,1.5);
  }
});

function pistGuncelle(dt, t) {
  psOlcek.value = renderer.domElement.height * 0.5 / Math.tan(camera.fov * Math.PI / 360);
  // oklar: ileri akar, hafifçe parlar
  okDoku.offset.y = -((t * 1.5) % 1); okMat.opacity = 0.82 + Math.sin(t * 7) * 0.18; psOkZeminMat.color.setScalar(0.9 + Math.sin(t * 7) * 0.1);
  // yıldızlar: döner, süzülür; toplanınca büyüyüp yükselerek kaybolur
  for (let i = 0; i < YILDIZ.length; i++) {
    const y = YILDIZ[i], u = y.var ? 0 : clamp((0.3 - y.pat) / 0.3, 0, 1), gor = y.var || y.pat > 0;
    const yuk = 1.55 + Math.sin(t * 2.6 + i * 0.9) * 0.22 + u * 2.4, b = gor ? 0.7 * (1 + Math.sin(t * 5.2 + i) * 0.05 + u * 0.7) * (1 - u * u) : 0;
    kukla.position.set(y.x, yuk, y.z); kukla.rotation.set(0, t * 2.6 + i * 0.7 + u * 9, 0); kukla.scale.setScalar(Math.max(0.0001, b)); kukla.updateMatrix(); yildizIM.setMatrixAt(i, kukla.matrix);
    // Her turdaki yeni yıldız yolu aynı nesneleri taşır; hale de yıldızla birlikte yer değiştirir.
    psHale.pos[i * 3] = y.x; psHale.pos[i * 3 + 1] = yuk; psHale.pos[i * 3 + 2] = y.z; psHale.boy[i] = y.var ? 3.3 + Math.sin(t * 5.2 + i) * 0.3 : 0;
  }
  yildizIM.instanceMatrix.needsUpdate = true; psHale.geo.attributes.position.needsUpdate = true; psHale.geo.attributes.aBoy.needsUpdate = true;
  // balonlar hafifçe sallanır
  for (let i = 0; i < 6; i++) { kukla.position.set(psBALON[i * 3] + Math.sin(t * 0.9 + i * 1.7) * 0.1, psBALON[i * 3 + 1] + Math.sin(t * 1.4 + i * 2.3) * 0.12, psBALON[i * 3 + 2]); kukla.rotation.set(0, 0, Math.sin(t * 0.9 + i * 1.7) * 0.08); kukla.scale.set(0.62, 0.8, 0.62); kukla.updateMatrix(); psBalonIM.setMatrixAt(i, kukla.matrix); }
  psBalonIM.instanceMatrix.needsUpdate = true;

  const yarista = psDurum === 'yaris', sx = -P.tz, sz = P.tx;
  // arka tekerlerden hafif toz izi
  if (yarista && P.v > 10 && P.hop <= 0) {
    psTozSay += dt * 34;
    while (psTozSay >= 1) { psTozSay--; const yan = psToz.i % 2 ? 1 : -1, g = Math.random(); psSac(psToz, P.x - P.tx * 1.25 + sx * yan * 0.98, 0.22, P.z - P.tz * 1.25 + sz * yan * 0.98, P.tx * P.v * 0.3 + sx * yan * g, 0.5 + g * 0.8, P.tz * P.v * 0.3 + sz * yan * g, (cvTema==='kar'?0xeff9ff:0xf1dcb8), 0.34, 0.45, 1.25, 0.34, 0, 3); }
  }
  // zıplamadan iniş: toz pufu
  if (psHopOnce > 0 && P.hop <= 0 && yarista) { for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = 3 + Math.random() * 2.5; psSac(psToz, P.x + Math.cos(a) * 0.9, 0.25, P.z + Math.sin(a) * 0.9, P.tx * P.v * 0.72 + Math.cos(a) * r, 0.6 + Math.random() * 1.2, P.tz * P.v * 0.72 + Math.sin(a) * r, (cvTema==='kar'?0xf4fbff:0xf6e6c8), 0.6, 0.7, 2.0, 0.55, 0, 2.2); } }
  psHopOnce = P.hop;
  // roket: pırıltı izi + hız çizgileri
  if (psRoketT > 0) {
    psRoketT -= dt; psPirilSay += dt * 46;
    while (psPirilSay >= 1) { psPirilSay--; const g = Math.random() - 0.5; psSac(psPiril, P.x - P.tx * 1.9 + sx * g * 1.1, 0.55 + Math.random() * 0.5 + (P.hop > 0 ? 1 : 0), P.z - P.tz * 1.9 + sz * g * 1.1, P.tx * P.v * 0.45 + sx * g * 2, Math.random() * 1.6, P.tz * P.v * 0.45 + sz * g * 2, psPIRIL_RENK[psPiril.i % 5], 0.9, 0.62, 0.12, 0.3 + Math.random() * 0.14, 0, 1.5); }
    if (!psCizgiHazir) { for (let i = 0; i < psCN; i++) psCizgiKoy(i, 6 + Math.random() * 44); psCizgiHazir = true; }
    for (let i = 0; i < psCN; i++) {
      const q = i * 5; if ((psCizgiVeri[q] - P.x) * P.tx + (psCizgiVeri[q + 2] - P.z) * P.tz < -13) psCizgiKoy(i, 26 + Math.random() * 28);
      kukla.position.set(psCizgiVeri[q], psCizgiVeri[q + 1], psCizgiVeri[q + 2]); kukla.rotation.set(0, psCizgiVeri[q + 3], 0); kukla.scale.set(1, 1, psCizgiVeri[q + 4]); kukla.updateMatrix(); psCizgiIM.setMatrixAt(i, kukla.matrix);
    }
    psCizgiIM.instanceMatrix.needsUpdate = true; psCizgiIM.visible = true; psCizgiIM.material.opacity = 0.34 * clamp(psRoketT * 4, 0, 1);
  } else if (psCizgiIM.visible) { psCizgiIM.visible = false; psCizgiHazir = false; }
  psHavuzAdim(psToz, dt); psHavuzAdim(psPiril, dt);

  // konfeti
  if (konfeti.visible) {
    for (let i = 0; i < KN; i++) {
      const j = i * 3, f = psKDon[j] + t * psKDon[j + 2];
      kHiz[j + 1] -= 9 * dt; if (kHiz[j + 1] < -2.2) kHiz[j + 1] += (-2.2 - kHiz[j + 1]) * Math.min(1, dt * 5);
      kHiz[j] *= 1 - Math.min(1, dt * 0.9); kHiz[j + 2] *= 1 - Math.min(1, dt * 0.9);
      kPos[j] += (kHiz[j] + Math.sin(f) * 0.9) * dt; kPos[j + 1] += kHiz[j + 1] * dt; kPos[j + 2] += (kHiz[j + 2] + Math.cos(f * 0.8) * 0.9) * dt;
      if (kPos[j + 1] < 0.08) { kPos[j] = P.x + (Math.random() - 0.5) * 13; kPos[j + 1] = 6 + Math.random() * 3.5; kPos[j + 2] = P.z + (Math.random() - 0.5) * 13; kHiz[j] = 0; kHiz[j + 1] = -1.5; kHiz[j + 2] = 0; }
      kukla.position.set(kPos[j], kPos[j + 1], kPos[j + 2]); kukla.rotation.set(t * psKDon[j + 1] + psKDon[j], f, t * psKDon[j + 2]); const kx = kPos[j] - camera.position.x, ky = kPos[j + 1] - camera.position.y, kz = kPos[j + 2] - camera.position.z; kukla.scale.setScalar(clamp((kx * kx + ky * ky + kz * kz) / 30, 0.05, 1)); kukla.updateMatrix(); konfeti.setMatrixAt(i, kukla.matrix);   // kameraya çok yakın kâğıt küçülür, ekranı kapatmaz
    }
    konfeti.instanceMatrix.needsUpdate = true;
  }
  kukla.rotation.set(0, 0, 0); kukla.scale.set(1, 1, 1);
}
