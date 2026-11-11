/* Çevre: gök, ışık, zemin, ağaçlar ve süsler, uzak tepeler, bulutlar. cevreGuncelle(dt, t) her karede çağrılır.
   Buradaki yeni üst düzey adlar `cv` ile başlar. Hareket (rüzgâr, zıplama, kanat) gölgelendiricide yapılır: kare başına matris güncellemesi yok. */
'use strict';

// ───────── gök, ışık ─────────
scene.background = tuvalDoku(8, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#2f8fe6'); gr.addColorStop(0.22, '#58b2f3'); gr.addColorStop(0.42, '#9ad6fb'); gr.addColorStop(0.55, '#d3f0ff'); gr.addColorStop(0.63, '#fff6df'); gr.addColorStop(1, '#eafaff');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
scene.fog = new T.Fog(0xdaf2ff, 330, 950);
scene.add(new T.HemisphereLight(0xffffff, 0x8fd06a, 1.25));
const gunes = new T.DirectionalLight(0xfff2d0, 1.5); gunes.position.set(95, 120, -45); scene.add(gunes);

const cvZ = { value: 0 };   // ortak zaman (gölgelendiriciler için)
const cvHAREKET = [
  '',
  // 1: ağaç tepeleri rüzgârda hafifçe salınır
  '#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.13 + instanceMatrix[3].z * 0.17; float cvW = transformed.y * transformed.y * 0.0034;\ntransformed.x += sin(cvT * 1.4 + cvF) * cvW; transformed.z += cos(cvT * 1.1 + cvF * 1.3) * cvW * 0.7;\n#endif',
  // 2: hayvanlar zıplar (cvK.y) ve el sallar (cvK.z)
  '#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 2.3;\nfloat cvH = abs(sin(cvT * 3.4 + cvF)) * smoothstep(-0.3, 0.3, sin(cvT * 0.7 + cvF * 0.37));\ntransformed.y += cvK.y * cvH * 0.5; transformed.x += cvK.z * sin(cvT * 9.0 + cvF) * 0.2; transformed.y += cvK.z * cos(cvT * 9.0 + cvF) * 0.05;\n#endif',
  // 3: kuşlar kanat çırpar
  '#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.7;\ntransformed.y += abs(position.x) * sin(cvT * 6.5 + cvF) * 0.55;\n#endif'
];
function cvMalz(mod, o) {   // köşe renkli malzeme; kopya rengi yalnız cvK.x = 1 olan parçaları boyar
  const m = new T.MeshLambertMaterial(Object.assign({ color: 0xffffff, vertexColors: true }, o || {}));
  m.onBeforeCompile = sh => {
    sh.uniforms.cvT = cvZ;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float cvT;\nattribute vec3 cvK;')
      .replace('#include <color_vertex>', 'vColor = color;\n#ifdef USE_INSTANCING_COLOR\nvColor *= mix(vec3(1.0), instanceColor.xyz, cvK.x);\n#endif')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + cvHAREKET[mod]);
  };
  m.customProgramCacheKey = () => 'cv' + mod;
  return m;
}
function cvYapi() {   // birçok basit parçayı tek geometride toplar (tek çizim çağrısı)
  const pos = [], nor = [], col = [], kk = [], taban = new T.Matrix4(), m = new T.Matrix4(), nm = new T.Matrix3(), o = new T.Object3D(), v = new T.Vector3(), c = new T.Color();
  o.rotation.order = 'YXZ';
  return {
    yer(x, z, ry, s, ust) { o.position.set(x, 0, z); o.rotation.set(0, ry || 0, 0); o.scale.setScalar(s || 1); o.updateMatrix(); if (ust) taban.multiply(o.matrix); else taban.copy(o.matrix); },
    ekle(geo, x, y, z, sx, sy, sz, renk, rx, ry, rz, kt, kz, ke) {
      o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx || 0, ry || 0, rz || 0); o.updateMatrix();
      m.multiplyMatrices(taban, o.matrix); nm.getNormalMatrix(m); c.setHex(renk);
      const g = geo.userData.cvD || (geo.userData.cvD = geo.index ? geo.toNonIndexed() : geo), p = g.attributes.position, n = g.attributes.normal;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(m); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
        col.push(c.r, c.g, c.b); kk.push(kt || 0, kz || 0, ke || 0);
      }
    },
    dunya(x, z) { return v.set(x, 0, z).applyMatrix4(taban); },
    geo() {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setAttribute('cvK', new T.Float32BufferAttribute(kk, 3));
      return g;
    }
  };
}
const cvG = {
  kure: new T.SphereGeometry(1, 7, 5), kureK: new T.SphereGeometry(1, 6, 4), cicek: new T.ConeGeometry(1, 1, 6), sil3: new T.CylinderGeometry(1, 1, 1, 3, 1, true), ico: new T.IcosahedronGeometry(1, 1), ufak: new T.IcosahedronGeometry(1, 0), okt: new T.OctahedronGeometry(1, 0),
  sil: new T.CylinderGeometry(1, 1, 1, 10), sil5: new T.CylinderGeometry(1, 1, 1, 5, 1, true), govde: new T.CylinderGeometry(0.7, 1, 1, 5, 1, true), govdeK: new T.CylinderGeometry(0.8, 1, 1, 10),
  koni: new T.ConeGeometry(1, 1, 7), koni6: new T.ConeGeometry(1, 1, 6), ucgen: new T.ConeGeometry(1, 1, 3), yarim: new T.SphereGeometry(1, 12, 4, 0, 6.2832, 0, 1.5708), yarimK: new T.SphereGeometry(1, 8, 3, 0, 6.2832, 0, 1.5708),
  daire: new T.CircleGeometry(1, 16), kutu: G.kutu
};
function cvSerit(pts, w) {   // yerde kıvrılan şerit (dere)
  const pos = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const q = [];
    for (const j of [i, i + 1]) { const a = pts[Math.max(0, j - 1)], b = pts[Math.min(pts.length - 1, j + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; q.push([pts[j][0] + tz * w, pts[j][1] - tx * w], [pts[j][0] - tz * w, pts[j][1] + tx * w]); }
    for (const k of [0, 1, 3, 0, 3, 2]) pos.push(q[k][0], 0, q[k][1]);
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return g;
}
const cvYasak = [];   // [x, z, yarıçap]: ağaç ve çiçek dikilmeyecek yerler
const cvBos = (x, z, r) => { for (const y of cvYasak) { const dx = x - y[0], dz = z - y[1], rr = r + y[2]; if (dx * dx + dz * dz < rr * rr) return false; } return true; };
const cvI = f => ((Math.round(f * N) % N) + N) % N;
const cvK = { x: 0, z: 0, ry: 0 };
function cvKenar(i, yan, uz, donuk) {   // pist kenarında yer; ry: yola (donuk>0 ise biraz da gelen arabalara) bakar
  i = ((i % N) + N) % N; cvK.x = PX[i] - TZ[i] * uz * yan; cvK.z = PZ[i] + TX[i] * uz * yan;
  const k = donuk || 0; cvK.ry = Math.atan2(TZ[i] * yan - TX[i] * k, -TX[i] * yan - TZ[i] * k); return cvK;
}
const cvBolge = i => { const f = i / N; return f < 0.08 || f > 0.94 ? 0 : f < 0.1 ? 6 : f < 0.28 ? 1 : f < 0.47 ? 2 : f < 0.63 ? 3 : f < 0.83 ? 4 : 5; };   // 0 başlangıç · 1 çayır · 2 mantar köyü · 3 göl · 4 çam ormanı · 5 huş korusu · 6 karışık

// ───────── zemin ─────────
const cimDoku = tuvalDoku(512, 512, (g, w, h) => {
  g.fillStyle = '#6cc24a'; g.fillRect(0, 0, w, h);
  const leke = (x, y, r) => { for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) { if (x + ox < -r || x + ox > w + r || y + oy < -r || y + oy > h + r) continue; g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill(); } };
  for (let i = 0; i < 46; i++) { g.fillStyle = ['#84d45c', '#5db443', '#93dc68', '#58ad40', '#7ccb50'][i % 5]; g.globalAlpha = 0.2; const x = R() * w, y = R() * h, r = 28 + R() * 52; leke(x, y, r); leke(x + r * 0.5, y + r * 0.3, r * 0.7); }
  for (let i = 0; i < 520; i++) { g.fillStyle = ['#7ccd58', '#63b643', '#86d662', '#5fb040'][i % 4]; g.globalAlpha = 0.38; leke(R() * w, R() * h, 3 + R() * 9); }
  for (let i = 0; i < 2600; i++) { g.fillStyle = ['#9be070', '#55a83c', '#b0e884', '#4fa038'][i % 4]; g.globalAlpha = 0.55; const x = R() * w, y = R() * h; g.fillRect(x, y, 1.5, 3 + R() * 4); }
  for (let k = 0; k < 7; k++) { const cx = R() * w, cy = R() * h; for (let i = 0; i < 16; i++) { g.fillStyle = ['#ffffff', '#ffe46b', '#ffb3d6', '#ffffff'][(i + k) % 4]; g.globalAlpha = 0.9; leke(cx + (R() - 0.5) * 70, cy + (R() - 0.5) * 70, 1.5 + R() * 1.3); } }
  g.globalAlpha = 1;
}, true); cimDoku.repeat.set(46, 46);
const zemin = new T.Mesh(new T.PlaneGeometry(1500, 1500, 44, 44), mat(0xffffff, { map: cimDoku, vertexColors: true }));
{
  const p = zemin.geometry.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), v = 0.9 + 0.1 * Math.sin(x * 0.021 + 1) * Math.cos(y * 0.017) + 0.07 * Math.sin(x * 0.05 + y * 0.043); c[i * 3] = v * (0.96 + 0.06 * Math.sin(y * 0.03)); c[i * 3 + 1] = v; c[i * 3 + 2] = v * 0.92; }
  zemin.geometry.setAttribute('color', new T.BufferAttribute(c, 3));
}
zemin.rotation.x = -Math.PI / 2; zemin.position.set(0, -0.02, -70); scene.add(zemin);
{ // yol kenarına doğru açılan çim ve ince toprak şeridi
  const W = YARI + 9, kenarDoku = tuvalDoku(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let x = 0; x < w; x++) {
      const d = Math.abs(x + 0.5 - w / 2) / (w / 2) * W; if (d < YARI + 0.5) continue; const t = clamp((W - d) / (W - YARI - 0.9), 0, 1), s = clamp((t - 0.72) / 0.28, 0, 1);
      g.fillStyle = 'rgba(' + Math.round(lerp(176, 232, s)) + ',' + Math.round(lerp(232, 214, s)) + ',' + Math.round(lerp(118, 150, s)) + ',' + (Math.pow(t, 1.25) * lerp(0.5, 0.8, s)).toFixed(3) + ')'; g.fillRect(x, 0, 1, h);
    }
    for (let i = 0; i < 900; i++) {
      const x = R() * w, y = R() * h, d = Math.abs(x - w / 2) / (w / 2) * W; if (d < YARI + 0.9) continue; const t = clamp((W - d) / (W - YARI - 0.9), 0, 1), r = R();
      g.globalAlpha = t * 0.7; g.fillStyle = r < 0.1 ? '#ffffff' : r < 0.18 ? '#ffe46b' : r < 0.6 ? '#8ed65f' : t > 0.7 ? '#cdb37a' : '#c6ee8c';
      if (r < 0.18) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); } else g.fillRect(x, y, 1.5 + R() * 2, 2 + R() * 5);
    }
    g.globalAlpha = 1;
  }, true);
  const km = new T.MeshLambertMaterial({ map: kenarDoku, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const ks = new T.Mesh(serit(-W, W, 0, L / Math.round(L / 18)), km); ks.renderOrder = -1; scene.add(ks);
}

// ───────── güneş ─────────
const cvGunes = new T.Sprite(new T.SpriteMaterial({
  map: tuvalDoku(256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,254,240,1)'); gr.addColorStop(0.13, 'rgba(255,248,200,1)'); gr.addColorStop(0.17, 'rgba(255,240,165,0.6)'); gr.addColorStop(0.45, 'rgba(255,244,190,0.16)'); gr.addColorStop(1, 'rgba(255,244,190,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }), transparent: true, depthWrite: false, fog: false
}));
cvGunes.scale.set(230, 230, 1); scene.add(cvGunes);
const cvGY = new T.Vector3(0.86, 0.3, -0.41).normalize();

let cvBulut = null, cvKus = null;
{
  const beyaz = mat(0xffffff), S = cvYapi(), AHSAP = 0xb9824c, KOYU = 0x8f5c34, BAYRAK = [0xff6b6b, 0xffe066, 0x7fd6ff, 0x9af08f, 0xffb0dc, 0xcda8ff];
  const tavsan = [], sincap = [], geyik = [], baykus = [];

  // ── tahta çit ──
  const cit = (i0, say, yan) => {
    S.yer(0, 0, 0); let ox = 0, oz = 0, var_ = false;
    for (let k = 0; k <= say; k++) {
      const p = cvKenar(i0 + k * 4, yan, YARI + 3.7), x = p.x, z = p.z;
      if (yakin(x, z) < YARI + 3.2) { var_ = false; continue; }
      S.ekle(cvG.kutu, x, 0.65, z, 0.3, 1.3, 0.3, KOYU, 0, p.ry); S.ekle(cvG.kutu, x, 1.34, z, 0.38, 0.1, 0.38, 0xd9a566, 0, p.ry);
      if (var_) { const dx = x - ox, dz = z - oz, l = Math.hypot(dx, dz), ry = Math.atan2(dx, dz); for (const y of [0.5, 0.98]) S.ekle(cvG.kutu, (x + ox) / 2, y, (z + oz) / 2, 0.11, 0.2, l, AHSAP, 0, ry); }
      ox = x; oz = z; var_ = true;
    }
  };
  // ── renkli bayrak ipi ──
  const bayrak = (i0, say, yan) => {
    S.yer(0, 0, 0); let ox = 0, oz = 0, var_ = false, n = 0;
    for (let k = 0; k <= say; k++) {
      const p = cvKenar(i0 + k * 13, yan, YARI + 4.5), x = p.x, z = p.z;
      if (yakin(x, z) < YARI + 3.4) { var_ = false; continue; }
      S.ekle(cvG.sil5, x, 2.7, z, 0.1, 5.4, 0.1, 0xfff6e6); S.ekle(cvG.ufak, x, 5.55, z, 0.24, 0.24, 0.24, 0xffc93d);
      if (var_) {
        const dx = x - ox, dz = z - oz, l = Math.hypot(dx, dz), ryI = Math.atan2(dx, dz), ryB = Math.atan2(-dz, dx);
        for (let j = 0; j < 8; j++) {
          const u = (j + 0.5) / 8, y = 5.3 - 1.0 * 4 * u * (1 - u);
          S.ekle(cvG.kutu, ox + dx * u, y + 0.02, oz + dz * u, 0.04, 0.04, l / 8 + 0.3, 0xffffff, 0, ryI);
          S.ekle(cvG.ucgen, ox + dx * u, y - 0.42, oz + dz * u, 0.42, 0.85, 0.05, BAYRAK[n++ % 6], Math.PI, ryB);
        }
      }
      ox = x; oz = z; var_ = true;
    }
  };
  // ── ok tabelası (yazısız) ──
  const tabela = (i, sag) => {
    const p = cvKenar(i, -sag, YARI + 5.2); if (yakin(p.x, p.z) < YARI + 4.2) return;
    S.yer(p.x, p.z, Math.atan2(-TX[i] - TZ[i] * sag * 0.35, -TZ[i] + TX[i] * sag * 0.35), 1.35); cvYasak.push([p.x, p.z, 3.2]);
    for (const x of [-0.85, 0.85]) S.ekle(cvG.kutu, x, 1.3, -0.1, 0.2, 2.6, 0.2, KOYU);
    S.ekle(cvG.kutu, 0, 2.35, -0.02, 2.7, 1.35, 0.1, KOYU); S.ekle(cvG.kutu, 0, 2.35, 0.03, 2.45, 1.1, 0.1, 0xffeeb0);
    S.ekle(cvG.kutu, -0.32 * sag, 2.35, 0.09, 1.05, 0.32, 0.06, 0xf0503c); S.ekle(cvG.ucgen, 0.52 * sag, 2.35, 0.09, 0.5, 0.75, 0.05, 0xf0503c, 0, 0, -sag * Math.PI / 2);
  };
  // ── mantar ev ──
  const mantarEv = (x, z, ry, s, renk) => {
    S.yer(x, z, ry, s); cvYasak.push([x, z, 6.2 * s]);
    S.ekle(cvG.govdeK, 0, 1.3, 0, 1.75, 2.6, 1.75, 0xfff1d6); S.ekle(cvG.sil, 0, 2.6, 0, 3.0, 0.3, 3.0, 0xf3d9b4); S.ekle(cvG.yarim, 0, 2.7, 0, 3.3, 2.5, 3.3, renk);
    for (let k = 0; k < 8; k++) { const fi = k < 2 ? 0.25 : 0.62 + (k % 2) * 0.42, a = k * 2.4 + 0.5, b = 0.5 - (k % 3) * 0.1; S.ekle(cvG.ufak, 3.3 * Math.sin(fi) * Math.sin(a), 2.72 + 2.5 * Math.cos(fi), 3.3 * Math.sin(fi) * Math.cos(a), b, 0.16, b, 0xffffff, fi * 0.8, a); }
    S.ekle(cvG.kutu, 0, 0.72, 1.58, 0.95, 1.45, 0.22, 0xa5673a); S.ekle(cvG.sil, 0, 1.45, 1.56, 0.475, 0.22, 0.475, 0xa5673a, Math.PI / 2); S.ekle(cvG.ufak, 0.27, 0.8, 1.72, 0.08, 0.08, 0.08, 0xffd84a);
    S.ekle(cvG.kutu, 0, 0.08, 2.0, 1.4, 0.16, 0.7, 0xc9ccd4);
    for (const a of [-1.0, 1.0]) {
      const wx = Math.sin(a) * 1.5, wz = Math.cos(a) * 1.5;
      S.ekle(cvG.sil, wx, 1.6, wz, 0.5, 0.2, 0.5, 0xa5673a, Math.PI / 2, a); S.ekle(cvG.sil, wx, 1.6, wz, 0.38, 0.26, 0.38, 0xffe27a, Math.PI / 2, a);
      S.ekle(cvG.kutu, wx, 1.6, wz, 0.76, 0.07, 0.3, 0xa5673a, 0, a); S.ekle(cvG.kutu, wx, 1.6, wz, 0.07, 0.76, 0.3, 0xa5673a, 0, a);
    }
    S.ekle(cvG.kutu, -1.4, 4.9, -0.6, 0.5, 1.3, 0.5, 0xe08a62); S.ekle(cvG.kutu, -1.4, 5.6, -0.6, 0.68, 0.18, 0.68, KOYU);
    for (let k = 0; k < 3; k++) S.ekle(cvG.sil, (k % 2 ? 0.35 : -0.3), 0.04, 3.1 + k * 1.15, 0.5, 0.08, 0.42, 0xd6d9df);
  };
  // ── kütük yığını ──
  const kutuk = (x, z, ry, s) => {
    S.yer(x, z, ry, s); cvYasak.push([x, z, 3.6 * s]);
    const sira = [[-1.12, 0.55], [0, 0.55], [1.12, 0.55], [-0.56, 1.5], [0.56, 1.5], [0, 2.45]];
    sira.forEach((q, k) => { const u = (k * 0.37) % 0.5 - 0.25; S.ekle(cvG.sil, u, q[1], q[0], 0.56, 4.2, 0.56, k % 2 ? 0x9b6a3f : 0xa8744a, 0, 0, Math.PI / 2); S.ekle(cvG.sil, u, q[1], q[0], 0.45, 4.26, 0.45, 0xf3d49c, 0, 0, Math.PI / 2); });
    S.ekle(cvG.govdeK, 3.4, 0.4, 0.8, 0.7, 0.8, 0.7, 0x9b6a3f); S.ekle(cvG.sil, 3.4, 0.8, 0.8, 0.5, 0.04, 0.5, 0xf3d49c);
  };
  // ── göl, dere ve tahta köprü ──
  {
    let en = -1, ei = 0, ey = 1;
    for (let i = cvI(0.5); i <= cvI(0.61); i += 6) for (const yan of [-1, 1]) { const p = cvKenar(i, yan, YARI + 18), d = Math.min(yakin(p.x, p.z), 26) + (yan > 0 ? 0.01 : 0); if (d > en) { en = d; ei = i; ey = yan; } }
    const p = cvKenar(ei, ey, YARI + 18), gx = p.x, gz = p.z, gry = p.ry, yat = -Math.PI / 2;
    S.yer(gx, gz, gry); cvYasak.push([gx, gz, 14.5]);
    S.ekle(cvG.daire, 0, 0.03, 0, 12.6, 10.4, 1, 0xf2e2a6, yat); S.ekle(cvG.daire, 0, 0.07, 0, 11.2, 9.0, 1, 0x4bbcf3, yat); S.ekle(cvG.daire, -2, 0.09, 1, 6.5, 4.6, 1, 0x7ad6fb, yat);
    for (let k = 0; k < 6; k++) S.ekle(cvG.daire, -6 + k * 2.3, 0.11, -3 + (k * 37 % 7), 1.1 + (k % 2) * 0.5, 0.14, 1, 0xe8f9ff, yat);
    for (let k = 0; k < 7; k++) { const a = k * 0.9 + 0.3, r = 0.45 + (k % 3) * 0.16, x = Math.cos(a) * 11.2 * r, z = Math.sin(a) * 9 * r; S.ekle(cvG.daire, x, 0.12, z, 0.75, 0.75, 1, k % 2 ? 0x3fae55 : 0x58c267, yat); if (k % 2 === 0) { S.ekle(cvG.ufak, x, 0.26, z, 0.3, 0.2, 0.3, 0xff8fc0); S.ekle(cvG.okt, x, 0.42, z, 0.12, 0.1, 0.12, 0xffe46b); } }
    for (let k = 0; k < 14; k++) { const a = k * 0.449 + 0.2, x = Math.cos(a) * 11.6, z = Math.sin(a) * 9.4; if (k % 3 === 2) S.ekle(cvG.ufak, x, 0.3, z, 0.9, 0.6, 0.8, 0xbfc3cc, 0, a); else for (let j = 0; j < 3; j++) { const hx = x + j * 0.35 - 0.3, hz = z + (j % 2) * 0.3, hh = 1.6 + j * 0.4; S.ekle(cvG.sil5, hx, hh / 2, hz, 0.06, hh, 0.06, 0x5dbb4f); S.ekle(cvG.sil5, hx, hh, hz, 0.13, 0.5, 0.13, 0x8f5c34); } }
    for (let k = 0; k < 3; k++) { const x = -4 + k * 3.6, z = 2.5 - k * 2.2, a = k * 2.1 + 0.6, c = Math.cos(a), s = Math.sin(a); S.ekle(cvG.kure, x, 0.38, z, 0.5, 0.42, 0.72, k ? 0xffe14f : 0xffffff, 0, a); S.ekle(cvG.kure, x + s * 0.45, 0.9, z + c * 0.45, 0.3, 0.3, 0.3, k ? 0xffe14f : 0xffffff); S.ekle(cvG.koni, x + s * 0.82, 0.86, z + c * 0.82, 0.12, 0.3, 0.07, 0xff9a3c, Math.PI / 2, a); for (const e of [-1, 1]) S.ekle(cvG.ufak, x + s * 0.62 + c * 0.2 * e, 1.0, z + c * 0.62 - s * 0.2 * e, 0.05, 0.05, 0.05, 0x222222); }
    // dere: gölden yol boyunca kıvrılarak uzaklaşır
    for (const yon of [1, -1]) {
      const pts = [];
      for (let j = 0; j < 17; j++) { const lx = yon * (8 + j * 3.2), lz = -1.5 + 3.4 * Math.sin(j * 0.6 + (yon > 0 ? 0 : 2)) - j * 0.55, w = S.dunya(lx, lz); if (j > 1 && yakin(w.x, w.z) < YARI + 7.5) break; pts.push([lx, lz]); if (j > 1) cvYasak.push([w.x, w.z, 3.6]); }
      if (pts.length < 6) continue;
      const kum = cvSerit(pts, 2.9), su = cvSerit(pts, 1.8); S.ekle(kum, 0, 0.04, 0, 1, 1, 1, 0xf2e2a6); S.ekle(su, 0, 0.08, 0, 1, 1, 1, 0x4bbcf3);
      if (yon > 0 || pts.length > 8) {
        const j = Math.min(5, pts.length - 2), a = pts[j - 1], b = pts[j + 1], q = pts[j]; S.yer(q[0], q[1], Math.atan2(-(b[1] - a[1]), b[0] - a[0]), 1.15, true);
        const yb = z => 0.22 + 1.05 * Math.cos(z / 4.1 * Math.PI / 2), eg = z => -Math.atan((yb(z + 0.1) - yb(z - 0.1)) / 0.2);
        for (let k = 0; k < 10; k++) { const z = -4.1 + (k + 0.5) * 0.82; S.ekle(cvG.kutu, 0, yb(z), z, 2.7, 0.16, 0.78, k % 2 ? 0xd29a5c : 0xc48a4c, eg(z)); }
        for (const x of [-1.32, 1.32]) for (let k = 0; k < 4; k++) {
          const z = -3.9 + k * 2.6; S.ekle(cvG.kutu, x, yb(z) + 0.6, z, 0.2, 1.3, 0.2, KOYU); S.ekle(cvG.ufak, x, yb(z) + 1.33, z, 0.17, 0.17, 0.17, 0xffc93d);
          if (k < 3) { const z2 = z + 2.6, dy = yb(z2) - yb(z); S.ekle(cvG.kutu, x, (yb(z) + yb(z2)) / 2 + 1.08, z + 1.3, 0.13, 0.14, Math.hypot(2.6, dy), AHSAP, -Math.atan(dy / 2.6)); S.ekle(cvG.kutu, x, (yb(z) + yb(z2)) / 2 + 0.6, z + 1.3, 0.1, 0.1, Math.hypot(2.6, dy), AHSAP, -Math.atan(dy / 2.6)); }
        }
        S.yer(gx, gz, gry);
      }
    }
    for (let k = 0; k < 3; k++) { const q = cvKenar(ei - 22 + k * 20, ey, YARI + 5 + (k % 2) * 1.2, 0.7); if (cvBos(q.x, q.z, 1.2)) { geyik.push([q.x, 0, q.z, 1.5, 1.5, 1.5, q.ry, [0xd9a066, 0xc98d55, 0xe2b07a][k]]); cvYasak.push([q.x, q.z, 1.6]); } }
  }
  // ── mantar köyü ──
  {
    const KAPAK = [0xf2553d, 0xffa53d, 0xe85aa0, 0x9b7be8, 0xf2553d, 0x38b8d8, 0xffa53d, 0xe85aa0];
    for (let k = 0; k < 8; k++) {
      const yan = k % 2 ? 1 : -1, i = cvI(0.305 + k * 0.021), s = 1.0 + ((k * 7) % 5) * 0.11, p = cvKenar(i, yan, YARI + 5.6 + 3.5 * s + (k % 3) * 1.6, 0.6);
      if (yakin(p.x, p.z) < YARI + 3.6 + 3.4 * s || !cvBos(p.x, p.z, 4 * s)) continue;
      mantarEv(p.x, p.z, p.ry, s, KAPAK[k]);
    }
    for (const yan of [-1, 1]) { cit(cvI(0.31), 26, yan); bayrak(cvI(0.325), 6, yan); }
  }
  // ── başlangıç alanı: çit, bayraklar, seyirciler ──
  const hayvan = (p, tur, s, k) => {
    cvYasak.push([p.x, p.z, 1.7]);
    if (tur === 0) tavsan.push([p.x, 0, p.z, s, s, s, p.ry, [0xffffff, 0xe9e2d8, 0xd6c6b4][k % 3]]);
    else if (tur === 1) sincap.push([p.x, 0, p.z, s, s, s, p.ry, [0xe08a45, 0xc9713a][k % 2]]);
    else if (tur === 2) geyik.push([p.x, 0, p.z, s, s, s, p.ry, [0xd9a066, 0xc98d55][k % 2]]);
    else baykus.push([p.x, 0, p.z, s, s, s, p.ry, [0xb98a5e, 0xa9a2b8][k % 2]]);
  };
  for (const yan of [-1, 1]) {
    cit(N - 44, 24, yan); bayrak(N - 39, 7, yan); cit(cvI(0.86), 14, yan);
    for (let k = 0; k < 11; k++) {
      const p = cvKenar(N - 40 + k * 8 + (yan > 0 ? 3 : 0), yan, YARI + 5.6 + (k % 3) * 0.9, 0.8); if (yakin(p.x, p.z) < YARI + 4.6 || !cvBos(p.x, p.z, 1.3)) continue;
      hayvan(p, (k + (yan > 0 ? 2 : 0)) % 4, 1.45 + (k % 3) * 0.15, k);
    }
  }
  // ── kütük yığınları ve bölge hayvanları ──
  for (let k = 0; k < 7; k++) { const yan = k % 2 ? -1 : 1, p = cvKenar(cvI(0.655 + k * 0.026), yan, YARI + 7.5 + (k % 3) * 1.5); if (yakin(p.x, p.z) > YARI + 6.5 && cvBos(p.x, p.z, 3.5)) kutuk(p.x, p.z, p.ry + 1.2 + k * 0.5, 0.95 + (k % 3) * 0.12); }
  {
    const F = [0.13, 0.16, 0.19, 0.22, 0.25, 0.33, 0.37, 0.41, 0.45, 0.52, 0.6, 0.66, 0.69, 0.72, 0.75, 0.78, 0.81, 0.85, 0.88, 0.91, 0.115, 0.205, 0.29, 0.48, 0.635, 0.835];
    for (let k = 0; k < F.length; k++) {
      const i = cvI(F[k]), yan = (k * 5) % 3 === 0 ? -1 : 1, p = cvKenar(i, yan, YARI + 5.3 + (k % 4) * 0.8, 0.8); if (yakin(p.x, p.z) < YARI + 4.6 || !cvBos(p.x, p.z, 1.3)) continue;
      const b = cvBolge(i); hayvan(p, b === 1 ? (k % 3 === 2 ? 2 : 0) : b === 4 ? (k % 2 ? 3 : 1) : b === 2 ? (k % 2 ? 0 : 1) : k % 4, 1.4 + (k % 3) * 0.17, k);
    }
  }
  // ── virajlarda ok tabelaları ──
  {
    let son = -999, say = 0;
    for (let i = 30; i < N - 30 && say < 9; i++) {
      let k = 0; for (let j = -10; j <= 10; j++) k += KAP[(i + j + N) % N]; k /= 21;
      if (Math.abs(k) > 0.017 && i - son > 85) { const sag = k > 0 ? 1 : -1; tabela((i - 26 + N) % N, sag); tabela((i - 6 + N) % N, sag); son = i; say++; }
    }
  }
  const statik = new T.Mesh(S.geo(), cvMalz(0)); statik.frustumCulled = false; scene.add(statik);

  // ── seyirci hayvanlar (ön = +Z) ──
  const SIYAH = 0x2b2b33;
  { // tavşan
    const B = cvYapi(), e = (g, x, y, z, sx, sy, sz, r, rx, rz, kt, ke) => B.ekle(g, x, y, z, sx, sy, sz, r, rx || 0, 0, rz || 0, kt, 1, ke);
    e(cvG.kure, 0, 0.62, 0, 0.5, 0.62, 0.45, 0xffffff, 0, 0, 1); e(cvG.kure, 0, 0.56, 0.2, 0.34, 0.42, 0.3, 0xffffff); e(cvG.kure, 0, 1.42, 0.02, 0.42, 0.38, 0.4, 0xffffff, 0, 0, 1);
    for (const s of [-1, 1]) { e(cvG.kureK, s * 0.18, 2.05, 0, 0.11, 0.46, 0.08, 0xffffff, 0, -s * 0.16, 1); e(cvG.kureK, s * 0.18, 2.05, 0.06, 0.055, 0.32, 0.03, 0xffa9c6, 0, -s * 0.16); e(cvG.ufak, s * 0.17, 1.5, 0.35, 0.065, 0.075, 0.05, SIYAH); e(cvG.kureK, s * 0.22, 0.1, 0.25, 0.17, 0.1, 0.27, 0xffffff, 0, 0, 1); e(cvG.ufak, s * 0.2, 1.33, 0.33, 0.1, 0.08, 0.06, 0xffc2d6); }
    e(cvG.ufak, 0, 1.38, 0.41, 0.06, 0.05, 0.05, 0xff7fa8); e(cvG.ufak, 0, 0.42, -0.45, 0.17, 0.17, 0.17, 0xffffff);
    e(cvG.kureK, -0.5, 0.82, 0.1, 0.1, 0.27, 0.1, 0xffffff, 0, 0.5, 1); e(cvG.kureK, 0.58, 1.22, 0.05, 0.1, 0.32, 0.1, 0xffffff, 0, -0.65, 1, 1);
    cok(B.geo(), cvMalz(2), tavsan);
  }
  { // sincap
    const B = cvYapi(), e = (g, x, y, z, sx, sy, sz, r, rx, rz, kt, ke) => B.ekle(g, x, y, z, sx, sy, sz, r, rx || 0, 0, rz || 0, kt, 1, ke);
    e(cvG.kure, 0, 0.52, 0, 0.38, 0.5, 0.36, 0xffffff, 0, 0, 1); e(cvG.kureK, 0, 0.5, 0.17, 0.25, 0.36, 0.22, 0xfff0d2); e(cvG.kure, 0, 1.17, 0.03, 0.34, 0.31, 0.33, 0xffffff, 0, 0, 1);
    e(cvG.kureK, 0, 0.8, -0.52, 0.27, 0.52, 0.27, 0xffffff, -0.3, 0, 1); e(cvG.kure, 0, 1.42, -0.66, 0.32, 0.36, 0.32, 0xffffff, 0, 0, 1); e(cvG.ufak, 0, 1.6, -0.6, 0.2, 0.2, 0.2, 0xfff0d2);
    for (const s of [-1, 1]) { e(cvG.koni, s * 0.19, 1.5, 0, 0.09, 0.22, 0.07, 0xffffff, 0, -s * 0.2, 1); e(cvG.ufak, s * 0.15, 1.23, 0.3, 0.06, 0.07, 0.05, SIYAH); e(cvG.kureK, s * 0.19, 0.08, 0.2, 0.13, 0.08, 0.22, 0xffffff, 0, 0, 1); e(cvG.ufak, s * 0.17, 1.08, 0.26, 0.12, 0.1, 0.08, 0xfff0d2); }
    e(cvG.ufak, 0, 1.13, 0.36, 0.055, 0.045, 0.045, SIYAH);
    e(cvG.kureK, -0.38, 0.68, 0.12, 0.08, 0.22, 0.08, 0xffffff, 0, 0.5, 1); e(cvG.kureK, 0.46, 1.0, 0.05, 0.08, 0.27, 0.08, 0xffffff, 0, -0.65, 1, 1);
    cok(B.geo(), cvMalz(2), sincap);
  }
  { // geyik yavrusu
    const B = cvYapi(), e = (g, x, y, z, sx, sy, sz, r, rx, rz, kt) => B.ekle(g, x, y, z, sx, sy, sz, r, rx || 0, 0, rz || 0, kt, 0.6, 0);
    e(cvG.kure, 0, 1.0, 0, 0.37, 0.4, 0.72, 0xffffff, 0, 0, 1); e(cvG.kureK, 0, 0.9, 0.05, 0.3, 0.3, 0.55, 0xfff0d2);
    for (const s of [-1, 1]) { for (const z of [-0.42, 0.42]) { e(cvG.sil5, s * 0.2, 0.38, z, 0.075, 0.76, 0.075, 0xcfcfcf, 0, 0, 1); e(cvG.sil5, s * 0.2, 0.06, z, 0.085, 0.12, 0.085, 0x5a4034); } e(cvG.ufak, s * 0.18, 1.98, 0.9, 0.065, 0.08, 0.05, SIYAH); e(cvG.kureK, s * 0.32, 2.14, 0.62, 0.07, 0.22, 0.12, 0xffffff, 0, -s * 0.9, 1); }
    e(cvG.kureK, 0, 1.5, 0.55, 0.19, 0.42, 0.19, 0xffffff, 0.5, 0, 1); e(cvG.kureK, 0, 1.9, 0.76, 0.27, 0.25, 0.32, 0xffffff, 0, 0, 1); e(cvG.kureK, 0, 1.82, 1.02, 0.15, 0.13, 0.17, 0xfff0d2); e(cvG.ufak, 0, 1.85, 1.18, 0.06, 0.05, 0.05, SIYAH);
    e(cvG.ufak, 0, 1.2, -0.72, 0.14, 0.14, 0.14, 0xffffff);
    for (let k = 0; k < 7; k++) e(cvG.ufak, ((k % 3) - 1) * 0.17, 1.36 - Math.abs((k % 3) - 1) * 0.05, -0.45 + k * 0.13, 0.07, 0.035, 0.07, 0xffffff);
    cok(B.geo(), cvMalz(2), geyik);
  }
  { // baykuş (kütüğün üstünde)
    const B = cvYapi(), e = (g, x, y, z, sx, sy, sz, r, rx, rz, kt, ke) => B.ekle(g, x, y, z, sx, sy, sz, r, rx || 0, 0, rz || 0, kt, 0.3, ke);
    B.ekle(cvG.govdeK, 0, 0.36, 0, 0.56, 0.72, 0.56, 0x9b6a3f); B.ekle(cvG.sil, 0, 0.73, 0, 0.42, 0.04, 0.42, 0xf3d49c);
    e(cvG.kure, 0, 1.28, 0, 0.44, 0.55, 0.4, 0xffffff, 0, 0, 1); e(cvG.kureK, 0, 1.16, 0.2, 0.3, 0.36, 0.24, 0xfff0d2);
    for (const s of [-1, 1]) { e(cvG.kureK, s * 0.17, 1.5, 0.3, 0.17, 0.17, 0.09, 0xffffff); e(cvG.ufak, s * 0.17, 1.5, 0.38, 0.075, 0.085, 0.04, SIYAH); e(cvG.koni, s * 0.25, 1.86, 0, 0.1, 0.24, 0.08, 0xffffff, 0, -s * 0.35, 1); e(cvG.ufak, s * 0.13, 0.76, 0.22, 0.08, 0.05, 0.12, 0xff9a3c); }
    e(cvG.koni, 0, 1.4, 0.42, 0.07, 0.16, 0.07, 0xff9a3c, 2.3); e(cvG.kureK, -0.43, 1.2, 0, 0.12, 0.38, 0.27, 0xcccccc, 0, 0.15, 1); e(cvG.kureK, 0.47, 1.3, 0, 0.12, 0.38, 0.27, 0xcccccc, 0, -0.5, 1, 0.7);
    cok(B.geo(), cvMalz(2), baykus);
  }

  // ───────── ağaçlar ─────────
  const camN = [], camF = [], yuvN = [], yuvF = [], hus = [], cali = [], cicek = [], kaya = [], mantar = [];
  const YESIL = [0x2f9e4f, 0x3bb25a, 0x278a45, 0x45bf63], ACIK = [0x7fd35a, 0x93dd66, 0x6cc74e, 0xa6e36f, 0x58b84a, 0x8fd95c], PEMBE = [0xffb3d9, 0xffd0e6, 0xffe9f4, 0xff9fcc, 0xffdcee, 0xffc2e0], HUS = [0xc8e86a, 0xd9ef7a, 0xb5e060, 0xf0e267];
  const CICEK = [0xff6fa3, 0xffd84a, 0xffffff, 0xff9248, 0xb98cff, 0x6fd3ff];
  const ORAN = [[0.3, 0.14, 0.26], [0.08, 0.14, 0.5], [0.22, 0.1, 0.22], [0.2, 0.45, 0.1], [0.8, 0.05, 0.02], [0.2, 0.5, 0.1], [0.4, 0.12, 0.15]];   // bölgeye göre [çam, huş, çiçekli]
  const agac = (x, z, b, i, yakinMi) => {
    const o = ORAN[cvBolge(((i % N) + N) % N)], t = R(), ry = R() * 6.28, h = b * (0.9 + R() * 0.3);
    if (t < o[0]) (yakinMi ? camN : camF).push([x, 0, z, b, h, b, ry, YESIL[(R() * 4) | 0]]);
    else if (t < o[0] + o[1]) { if (yakinMi) hus.push([x, 0, z, b, h, b, ry, HUS[(R() * 4) | 0]]); else yuvF.push([x, 0, z, b * 0.85, h * 1.1, b * 0.85, ry, HUS[(R() * 4) | 0]]); }
    else if (t < o[0] + o[1] + o[2]) (yakinMi ? yuvN : yuvF).push([x, 0, z, b, h, b, ry, PEMBE[(R() * 6) | 0]]);
    else (yakinMi ? yuvN : yuvF).push([x, 0, z, b, h, b, ry, R() < 0.04 ? 0xffe07a : ACIK[(R() * 6) | 0]]);
  };
  // yol kenarında düzenli büyük ağaçlar (hız hissi)
  for (let i = 0; i < N; i += 11) for (const yan of [-1, 1]) {
    const b = 1.25 + R() * 0.55, p = cvKenar(i + ((R() * 5) | 0), yan, YARI + 5.2 + b * 2.4 + R() * 2);
    if (yakin(p.x, p.z) < YARI + 4.6 + b * 2 || !cvBos(p.x, p.z, 2.6)) continue;
    cvYasak.push([p.x, p.z, 2.2]); agac(p.x, p.z, b, i, true);
  }
  // ormanın içi: yola yakın seyrek, uzakta sık
  for (let i = 0; i < N; i += 3) for (const yan of [-1, 1]) for (let k = 0; k < 2; k++) {
    const uz = YARI + 13 + R() * R() * 62, x = PX[i] - TZ[i] * uz * yan + (R() - 0.5) * 6, z = PZ[i] + TX[i] * uz * yan + (R() - 0.5) * 6, ya = yakin(x, z);
    if (ya < YARI + 10 || !cvBos(x, z, 2.2)) continue;
    agac(x, z, 0.85 + R() * 0.95 + (ya > 40 ? 0.3 : 0), i, ya < YARI + 19);
  }
  // çiçek, çalı, mantar, kaya
  for (let i = 0; i < 1750; i++) {
    const cayir = i < 520, k = cayir ? cvI(0.1 + R() * 0.18) : (R() * N) | 0, b = cvBolge(k), yan = R() < 0.5 ? -1 : 1, uz = YARI + 3.2 + (cayir ? R() * 26 : R() * R() * 20), x = PX[k] - TZ[k] * uz * yan + (R() - 0.5) * 2, z = PZ[k] + TX[k] * uz * yan + (R() - 0.5) * 2;
    if (yakin(x, z) < YARI + 3.1 || !cvBos(x, z, cayir ? 0.2 : 0.9)) continue;
    const t = R(), s = 0.7 + R() * 0.6;
    if (cayir || t < 0.6) cicek.push([x, 0, z, s, s * (0.8 + R() * 0.5), s, R() * 6, CICEK[(R() * 6) | 0]]);
    else if (t < 0.76) cali.push([x, 0.4, z, 0.9 + R() * 0.9, 0.65 + R() * 0.5, 0.9 + R() * 0.9, R() * 6, b === 1 && R() < 0.4 ? PEMBE[(R() * 6) | 0] : R() < 0.45 ? ACIK[(R() * 6) | 0] : YESIL[(R() * 4) | 0]]);
    else if (t < (b === 2 ? 0.97 : 0.88)) { const m = (b === 2 ? 1.1 : 0.7) + R() * (b === 2 ? 1.5 : 0.9); mantar.push([x, 0, z, m, m, m, R() * 6, [0xf2553d, 0xffb13d, 0xf2553d, 0xe85aa0, 0x9b7be8][(R() * (b === 2 ? 5 : 3)) | 0]]); }
    else kaya.push([x, 0.25, z, 0.6 + R() * 0.8, 0.5 + R() * 0.5, 0.6 + R() * 0.8, R() * 6, R() < 0.5 ? 0xb9bcc4 : 0xcfd2d8]);
  }
  const ruzgar = cvMalz(1);
  { const B = cvYapi(); B.ekle(cvG.govde, 0, 1.1, 0, 0.42, 2.2, 0.42, 0x8a5a36); B.ekle(cvG.koni, 0, 3.3, 0, 2.35, 3.3, 2.35, 0xd0d0d0, 0, 0, 0, 1); B.ekle(cvG.koni, 0, 5.0, 0, 1.85, 2.9, 1.85, 0xe6e6e6, 0, 0.4, 0, 1); B.ekle(cvG.koni, 0, 6.6, 0, 1.3, 2.5, 1.3, 0xffffff, 0, 0.9, 0, 1); cok(B.geo(), ruzgar, camN); }
  { const B = cvYapi(); B.ekle(cvG.govde, 0, 1.0, 0, 0.42, 2.0, 0.42, 0x8a5a36); B.ekle(cvG.koni6, 0, 3.5, 0, 2.3, 3.8, 2.3, 0xd6d6d6, 0, 0, 0, 1); B.ekle(cvG.koni6, 0, 5.8, 0, 1.55, 3.0, 1.55, 0xf4f4f4, 0, 0.5, 0, 1); cok(B.geo(), ruzgar, camF); }
  { const B = cvYapi(); B.ekle(cvG.govde, 0, 1.6, 0, 0.46, 3.2, 0.46, 0x9a6a40); B.ekle(cvG.ico, 0.1, 5.0, 0, 2.45, 2.3, 2.45, 0xffffff, 0, 0, 0, 1); B.ekle(cvG.kure, 1.6, 3.95, 0.5, 1.65, 1.45, 1.65, 0xdedede, 0, 0, 0, 1); B.ekle(cvG.kure, -1.4, 4.15, -0.8, 1.6, 1.4, 1.6, 0xe8e8e8, 0, 1, 0, 1); cok(B.geo(), ruzgar, yuvN); }
  { const B = cvYapi(); B.ekle(cvG.govde, 0, 1.4, 0, 0.5, 2.8, 0.5, 0x9a6a40); B.ekle(cvG.kure, 0, 4.4, 0, 2.5, 2.3, 2.5, 0xf6f6f6, 0, 0, 0, 1); cok(B.geo(), ruzgar, yuvF); }
  { const B = cvYapi(); B.ekle(cvG.sil5, 0, 2.6, 0, 0.24, 5.2, 0.24, 0xf7f4ec); for (let k = 0; k < 3; k++) B.ekle(cvG.sil5, 0, 0.9 + k * 1.3, 0, 0.255, 0.18, 0.255, 0x4a4a4a, 0, k * 1.3); B.ekle(cvG.kure, 0, 6.3, 0, 1.7, 2.0, 1.7, 0xffffff, 0, 0, 0, 1); B.ekle(cvG.kure, 0.95, 5.0, 0.3, 1.2, 1.3, 1.2, 0xe2e2e2, 0, 0, 0, 1); B.ekle(cvG.kure, -0.85, 5.4, -0.4, 1.1, 1.2, 1.1, 0xececec, 0, 1, 0, 1); cok(B.geo(), ruzgar, hus); }
  { const B = cvYapi(); B.ekle(cvG.sil3, 0, 0.26, 0, 0.045, 0.52, 0.045, 0x4caf50); B.ekle(cvG.ufak, 0, 0.6, 0, 0.42, 0.19, 0.42, 0xffffff, 0, 0, 0, 1); B.ekle(cvG.okt, 0, 0.76, 0, 0.17, 0.1, 0.17, 0xffd84a); cok(B.geo(), cvMalz(0), cicek); }
  { const B = cvYapi(); B.ekle(cvG.govde, 0, 0.3, 0, 0.24, 0.6, 0.24, 0xfff3e0); B.ekle(cvG.yarimK, 0, 0.5, 0, 0.62, 0.48, 0.62, 0xffffff, 0, 0, 0, 1); for (let k = 0; k < 2; k++) { const a = k * 2.6 + 0.4; B.ekle(cvG.okt, Math.sin(a) * 0.36, 0.86, Math.cos(a) * 0.36, 0.11, 0.05, 0.11, 0xffffff, 0.6, a); } cok(B.geo(), cvMalz(0), mantar); }
  cok(cvG.kure, beyaz, cali); cok(new T.DodecahedronGeometry(1, 0), beyaz, kaya);

  // ───────── uzak tepeler, dağlar, bulutlar, kuşlar ─────────
  const tepe = [], dag = [], bulut = [], kus = [];
  for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283 + R() * 0.2, r = 300 + R() * 60; tepe.push([Math.cos(a) * r, -8, -70 + Math.sin(a) * r, 70 + R() * 45, 30 + R() * 26, 70 + R() * 45, 0, [0x57b55a, 0x6cc56a, 0x4aa757][i % 3]]); }
  for (let i = 0; i < 15; i++) { const a = i / 15 * 6.283 + R() * 0.3, r = 410 + R() * 50; tepe.push([Math.cos(a) * r, -8, -70 + Math.sin(a) * r, 100 + R() * 60, 55 + R() * 35, 100 + R() * 60, 0, [0x7fc98f, 0x8fd3a2, 0x74c088][i % 3]]); }
  cok(new T.SphereGeometry(1, 16, 8, 0, 6.3, 0, 1.6), beyaz, tepe);
  {
    const g = new T.ConeGeometry(1, 1, 7, 4).toNonIndexed(), p = g.attributes.position, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i += 3) { const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, kar = y > 0.14; for (let j = 0; j < 3; j++) { c[(i + j) * 3] = kar ? 1 : 0.62; c[(i + j) * 3 + 1] = kar ? 1 : 0.72; c[(i + j) * 3 + 2] = kar ? 1 : 0.95; } }
    g.setAttribute('color', new T.BufferAttribute(c, 3)); g.computeVertexNormals();
    for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283 + R() * 0.2, r = 520 + R() * 50, h = 110 + R() * 90, w = 95 + R() * 60; dag.push([Math.cos(a) * r, h / 2 - 6, -70 + Math.sin(a) * r, w, h, w, R() * 6, [0xffffff, 0xe8e4ff, 0xdff0ff][i % 3]]); }
    cok(g, new T.MeshLambertMaterial({ vertexColors: true, flatShading: true }), dag);
  }
  {
    const B = cvYapi(); B.ekle(cvG.ico, 0, 0, 0, 13, 8, 10, 0xffffff); B.ekle(cvG.ico, -12, -1.5, 1, 9, 5.6, 8, 0xffffff); B.ekle(cvG.ico, 12, -1, -1, 10, 6.2, 8, 0xffffff); B.ekle(cvG.ico, 5, 3.5, 2, 8, 5.5, 7, 0xffffff); B.ekle(cvG.ico, -21, -3, 0, 6, 3.4, 5.5, 0xffffff); B.ekle(cvG.ico, 21.5, -3, 0, 6, 3.4, 5.5, 0xffffff);
    const g = B.geo(), p = g.attributes.position, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) { const y = Math.max(p.getY(i), -3.6); p.setY(i, y); const t = clamp((y + 3.6) / 9, 0, 1); c.setXYZ(i, lerp(0.68, 1, t), lerp(0.84, 1, t), lerp(0.97, 1, t)); }
    for (let i = 0; i < 15; i++) { const a = i / 15 * 6.283 + R() * 0.5, r = 120 + R() * 330, s = 0.9 + R() * 1.1; bulut.push([Math.cos(a) * r, 95 + R() * 60, Math.sin(a) * r, s, s * 0.9, s, R() * 6]); }
    cvBulut = cok(g, new T.MeshBasicMaterial({ vertexColors: true, fog: false }), bulut); cvBulut.position.set(0, 0, -70);
  }
  {
    const B = cvYapi(); B.ekle(cvG.kure, 0, 0, 0, 0.2, 0.2, 0.6, 0xffffff); B.ekle(cvG.ufak, 0, 0.08, 0.6, 0.16, 0.16, 0.18, 0xffffff); B.ekle(cvG.koni, 0, 0.06, 0.85, 0.06, 0.2, 0.06, 0xffa53d, Math.PI / 2);
    for (const s of [-1, 1]) { B.ekle(cvG.kutu, s * 0.55, 0.05, 0.05, 0.9, 0.05, 0.5, 0xf2f6ff); B.ekle(cvG.kutu, s * 1.3, 0.05, -0.05, 0.7, 0.05, 0.32, 0x8fa3c8); }
    B.ekle(cvG.kutu, 0, 0.02, -0.7, 0.3, 0.04, 0.4, 0x8fa3c8);
    for (let i = 0; i < 9; i++) { const a = (i < 5 ? 0.4 + i * 0.16 : 3.4 + (i - 5) * 0.2) + R() * 0.05, r = (i < 5 ? 95 : 60) + (i % 3) * 9 + R() * 6, s = 2.3 + R() * 0.8; kus.push([Math.cos(a) * r, 30 + (i % 4) * 4 + R() * 5, Math.sin(a) * r, s, s, s, Math.atan2(Math.sin(a), -Math.cos(a))]); }
    cvKus = cok(B.geo(), cvMalz(3), kus); cvKus.position.set(0, 0, -70);
  }
}

function cevreGuncelle(dt, t) {
  cvZ.value = t;
  cvBulut.rotation.y = t * 0.004; cvKus.rotation.y = t * 0.1;
  cvGunes.position.set(camera.position.x + cvGY.x * 640, cvGY.y * 640, camera.position.z + cvGY.z * 640);
}
