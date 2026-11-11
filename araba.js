/* Arabalar ve sürücüler: araba(renk, renk2, tur) modeli kurar; arabaYerlestir(a, dt) her karede konum, yatış, teker dönüşü, gölge, sürücü canlandırması.
   a.yol = pist boyunca ilerleme (m), a.d = yanal konum, a.v = hız, a.dv = yanal hız, a.hop = zıplama sayacı. tur: feza | piril | bilbo | anne | baba
   Çizim sayısı az kalsın diye sabit parçalar tek geometride birleştirilir (köşe renkleri, tek ortak malzeme arMat):
   araba başına gövde 1 + kafa 1 + savrulan parçalar 0-2 + kollar 2 + direksiyon 1 + tekerler 4 + gölge 1.
   Göz kırpma mevcut kafa geometrisinin tek morph hedefidir; yeni çizim veya kare başına geometri kurmaz. */
'use strict';

const golgeDoku = tuvalDoku(64, 64, (g, w) => { const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
const golgeMat = new T.MeshBasicMaterial({ map: golgeDoku, transparent: true, depthWrite: false });
function parca(ust, geo, renk, x, y, z, sx, sy, sz) { const m = new T.Mesh(geo, typeof renk === 'number' ? mat(renk) : renk); m.position.set(x, y, z); m.scale.set(sx, sy, sz); ust.add(m); return m; }

// ───────── birleştirici: parçaları tek geometride toplar ─────────
const arMat = new T.MeshLambertMaterial({ vertexColors: true });
// Tek ortak boya: plastik oyuncak hissi, küçük ve yumuşak bir ışık parıltısı.
// Yüzler mat kalır; kaportanın kıvrımları parlayarak biçimini belli eder.
const arBoya = new T.MeshPhongMaterial({ vertexColors: true, shininess: 34, specular: 0x242a32 });
const arM4 = new T.Matrix4(), arN3 = new T.Matrix3(), arV = new T.Vector3(), arRenk = new T.Color();
function arYapi() { return { p: [], n: [], c: [], taban: null }; }
function arTaban(y, x, yy, z, rx, ry, rz) { kukla.position.set(x, yy, z); kukla.scale.set(1, 1, 1); kukla.rotation.set(rx || 0, ry || 0, rz || 0); kukla.updateMatrix(); y.taban = kukla.matrix.clone(); }
function arKat(y, geo, renk, x, yy, z, sx, sy, sz, rx, ry, rz) {   // renk === null → geometrinin kendi renkleri
  kukla.position.set(x, yy, z); kukla.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz); kukla.rotation.set(rx || 0, ry || 0, rz || 0); kukla.updateMatrix();
  arM4.copy(kukla.matrix); if (y.taban) arM4.premultiply(y.taban);
  arN3.getNormalMatrix(arM4);
  const gp = geo.attributes.position, gn = geo.attributes.normal, gc = geo.attributes.color, ix = geo.index, say = ix ? ix.count : gp.count;
  if (renk !== null) arRenk.setHex(renk);
  for (let i = 0; i < say; i++) {
    const k = ix ? ix.getX(i) : i;
    arV.fromBufferAttribute(gp, k).applyMatrix4(arM4); y.p.push(arV.x, arV.y, arV.z);
    arV.fromBufferAttribute(gn, k).applyMatrix3(arN3).normalize(); y.n.push(arV.x, arV.y, arV.z);
    if (renk === null) y.c.push(gc.getX(k), gc.getY(k), gc.getZ(k)); else y.c.push(arRenk.r, arRenk.g, arRenk.b);
  }
}
function arGeo(y) { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(y.p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(y.n, 3)); g.setAttribute('color', new T.Float32BufferAttribute(y.c, 3)); return g; }
function arBitir(y, ust, malzeme) { const m = new T.Mesh(arGeo(y), malzeme || arMat); ust.add(m); return m; }

// kapalı yumuşak yüzey: f(u, w, o) konum verir (u çevre, w uçtan uca); renkF(i, j) dilim rengi
function arYuzey(nu, nv, f, renkF) {
  const P = [], Nr = [], W = nu + 1, v = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), d = new T.Vector3();
  let cx = 0, cy = 0, cz = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { f((i % nu) / nu, j / nv, v); P.push(v.x, v.y, v.z); cx += v.x; cy += v.y; cz += v.z; }
  const ad = (nv + 1) * W; cx /= ad; cy /= ad; cz /= ad;
  const al = (i, j, o) => { const k = (j * W + ((i + nu) % nu)) * 3; return o.set(P[k], P[k + 1], P[k + 2]); };
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    al(i, j, v);
    if (j === 0 || j === nv) { a.set(0, 0, 0); for (let q = 0; q < nu; q++) a.add(al(q, j === 0 ? 1 : nv - 1, b)); a.multiplyScalar(1 / nu); c.copy(v).sub(a); }
    else { al(i + 1, j, a).sub(al(i - 1, j, b)); al(i, j + 1, c).sub(al(i, j - 1, b)); c.crossVectors(a, c); }
    if (c.lengthSq() < 1e-12) c.set(v.x - cx, v.y - cy, v.z - cz);
    c.normalize(); if (c.x * (v.x - cx) + c.y * (v.y - cy) + c.z * (v.z - cz) < 0) c.negate();
    Nr.push(c.x, c.y, c.z);
  }
  const y = arYapi(), nn = (i, j, o) => { const k = (j * W + ((i + nu) % nu)) * 3; return o.set(Nr[k], Nr[k + 1], Nr[k + 2]); };
  const ucgen = (i0, j0, i1, j1, i2, j2, renk) => {
    al(i0, j0, a); al(i1, j1, b); al(i2, j2, c);
    v.copy(b).sub(a); d.copy(c).sub(a); v.cross(d); if (v.lengthSq() < 1e-14) return;
    nn(i0, j0, d); let t = v.dot(d); t += v.dot(nn(i1, j1, d)); t += v.dot(nn(i2, j2, d));
    const sira = t < 0 ? [i0, j0, i2, j2, i1, j1] : [i0, j0, i1, j1, i2, j2];
    arRenk.setHex(renk);
    for (let q = 0; q < 6; q += 2) { al(sira[q], sira[q + 1], a); nn(sira[q], sira[q + 1], d); y.p.push(a.x, a.y, a.z); y.n.push(d.x, d.y, d.z); y.c.push(arRenk.r, arRenk.g, arRenk.b); }
  };
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const r = renkF ? renkF(i, j) : 0xffffff; ucgen(i, j, i + 1, j, i + 1, j + 1, r); ucgen(i, j, i + 1, j + 1, i, j + 1, r); }
  return arGeo(y);
}
const arSuper = pw => (u, w, o) => { const A = u * Math.PI * 2, B = w * Math.PI, sx = Math.sin(B) * Math.cos(A), sy = Math.sin(B) * Math.sin(A), sz = -Math.cos(B), r = Math.pow(Math.pow(Math.abs(sx), pw) + Math.pow(Math.abs(sy), pw) + Math.pow(Math.abs(sz), pw), -1 / pw); o.set(sx * r, sy * r, sz * r); };
const arKoyult = (renk, k) => new T.Color(renk).multiplyScalar(k).getHex();

// hazır küçük geometriler
const arTomb = arYuzey(12, 6, arSuper(4));                       // yuvarlak köşeli kutu
const arK = new T.SphereGeometry(1, 10, 7), arM = new T.SphereGeometry(1, 7, 5);   // küçük ve minik parçalar için hafif küreler
const arYuzDetay = new T.SphereGeometry(1, 16, 10);              // yakından görünen yüz parçaları yumuşak kalır
const arHap = (r, u) => new T.CapsuleGeometry(r, u, 3, 8);       // Y boyunca hap
const arLastik = new T.TorusGeometry(0.3, 0.16, 6, 16);
const arHalka = new T.TorusGeometry(1, 0.2, 5, 12);
const arInceHalka = new T.TorusGeometry(1, 0.07, 4, 12);
const arCivi = new T.OctahedronGeometry(1, 0);
const arCamurluk = new T.TorusGeometry(1, 0.095, 5, 14, Math.PI);
const arGulus = new T.TorusGeometry(1, 0.13, 5, 16, Math.PI);
const arSac = new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.57);
const arYildizGeo = (() => { const s = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.52 : 1, a = i / 10 * Math.PI * 2 + Math.PI / 2; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return new T.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.045, bevelSegments: 2, curveSegments: 2 }); })();
const arGovdeF = (() => { const sb = arSuper(3.2); return (u, w, o) => { sb(u, w, o); const z = o.z; let x = o.x * 0.9, y = o.y * 0.38; if (z > 0) { x *= 1 - 0.3 * z * z; if (y > 0) y *= 1 - 0.45 * Math.pow(z, 1.5); } else if (y > 0) y *= 1 + 0.22 * -z; o.set(x, y, z * 1.8); }; })();
const AR_TEN = 0xf6c9a4, AR_KOYU = 0x2b2f3a, AR_LEYLAK = 0xb79bea, AR_CIKO = 0x5b3a26;
const arInsanTen = (() => {
  const g = new T.SphereGeometry(1, 24, 16), p = g.attributes.position, c = [];
  const taban = new T.Color(AR_TEN), allik = new T.Color(0xf0aa99), renk = new T.Color();
  for (let i = 0; i < p.count; i++) {
    const dx = Math.abs(p.getX(i)) - 0.6, dy = p.getY(i) + 0.26;
    const on = clamp((p.getZ(i) - 0.25) * 2.5, 0, 1), k = Math.exp(-dx * dx / 0.035 - dy * dy / 0.025) * 0.62 * on;
    renk.copy(taban).lerp(allik, k); c.push(renk.r, renk.g, renk.b);
  }
  g.setAttribute('color', new T.Float32BufferAttribute(c, 3)); return g;
})();

function arGoz(y, x, yy, z, r, beyaz, iris) {   // sevimli göz: (ak) + (renkli halka) + koyu bebek + parıltı
  const ekle = (geo, renk, xx, yz, zz, sx, sy, sz, sakla) => {
    const bas = y.p.length; arKat(y, geo, renk, xx, yz, zz, sx, sy, sz);
    if (!y.gozler) y.gozler = [];
    y.gozler.push({ bas, son: y.p.length, yy, sakla });
  };
  let o = 0;
  if (beyaz) { ekle(arYuzDetay, 0xffffff, x, yy, z, r, r * 1.08, r * 0.42, true); o = r * 0.3; r *= 0.68; }
  if (iris) { ekle(arYuzDetay, iris, x, yy, z + o, r, r * 1.05, r * 0.38, true); o += r * 0.22; r *= 0.78; }
  ekle(arYuzDetay, 0x2a2230, x, yy, z + o, r, r * 1.1, r * 0.3, false);
  ekle(arM, 0xfffbec, x + r * 0.26, yy + r * 0.42, z + o + r * 0.285, r * 0.23, undefined, undefined, true);
}
function kafa(tur) {   // yüz +Z'ye bakar; k.userData.sallan = hızla savrulan parçalar (saç, kulak)
  const k = new T.Group(), y = arYapi(); k.userData.sallan = [];
  const sal = (px, py, pz, kx, yon) => { const gr = new T.Group(); gr.position.set(px, py, pz); gr.userData.kx = kx; gr.userData.yon = yon; k.add(gr); k.userData.sallan.push(gr); return gr; };
  if (tur === 'feza' || tur === 'anne' || tur === 'baba') {
    const sac = tur === 'feza' ? 0x6b4226 : tur === 'anne' ? 0x7a4a2a : 0x2f2622;
    arKat(y, arInsanTen, null, 0, 0, 0, 0.5);
    for (const x of [-1, 1]) {
      arKat(y, arM, AR_TEN, x * 0.49, -0.03, 0, 0.07, 0.1, 0.09);
      arKat(y, arM, 0xe9a98d, x * 0.525, -0.035, 0.035, 0.018, 0.055, 0.04);
      // Küçük, sıcak bakış; kocaman beyaz gözler yerine yumuşak badem biçimi.
      arGoz(y, x * 0.17, 0.02, 0.455, tur === 'feza' ? 0.078 : 0.07, false, 0x684334);
    }
    if (tur === 'feza') for (const x of [-1, 1]) arKat(y, arM, sac, x * 0.17, 0.165, 0.455, 0.07, 0.017, 0.025, 0, 0, x * 0.18);              // kaşlar
    if (tur === 'anne') for (const x of [-1, 1]) arKat(y, arM, 0x2a2230, x * 0.25, 0.085, 0.425, 0.05, 0.014, 0.02, 0, 0, x * 0.7);        // kirpikler
    arKat(y, arYuzDetay, 0xf3bd96, 0, -0.055, 0.481, 0.048, 0.071, 0.06, -0.25);
    arKat(y, arGulus, tur === 'anne' ? 0xbf6370 : 0x945644, 0, -0.14, 0.455, 0.108, 0.083, 0.075, 0.25, 0, Math.PI);
    arKat(y, arSac, sac, 0, 0.01, -0.01, 0.535, 0.535, 0.535, tur === 'baba' ? -0.68 : -0.5);
    if (tur === 'feza') {
      for (const x of [-0.2, 0, 0.2]) arKat(y, arK, sac, x, 0.31 - Math.abs(x) * 0.25, 0.38 - Math.abs(x) * 0.2, 0.15, 0.09, 0.1, -0.5);
      const t = sal(0, 0.5, -0.05, 0.9, 0), ty = arYapi(); t.userData.yukari = true; arKat(ty, arK, sac, 0, 0.08, 0, 0.07, 0.15, 0.07); arKat(ty, arK, sac, 0.05, 0.05, -0.03, 0.05, 0.11, 0.05, 0, 0, -0.5); arBitir(ty, t);
    } else if (tur === 'anne') {
      for (const x of [-1, 1]) { arKat(y, arK, sac, x * 0.47, -0.16, 0.1, 0.1, 0.34, 0.15); arKat(y, arK, sac, x * 0.2, 0.33, 0.36, 0.2, 0.09, 0.1, -0.5, 0, -x * 0.35); }
      const t = sal(0, 0.12, -0.3, 0.75, 0), ty = arYapi(); arKat(ty, arTomb, sac, 0, -0.42, -0.08, 0.47, 0.5, 0.17); arKat(ty, arK, sac, -0.24, -0.86, -0.08, 0.2, 0.14, 0.14); arKat(ty, arK, sac, 0.24, -0.86, -0.08, 0.2, 0.14, 0.14); arKat(ty, arK, sac, 0, -0.9, -0.08, 0.2, 0.14, 0.14); arBitir(ty, t);
    } else {
      for (const x of [-1, 1]) arKat(y, arM, sac, x * 0.17, 0.15, 0.46, 0.085, 0.022, 0.03, 0, 0, -x * 0.12);
    }
  } else if (tur === 'piril') {
    arKat(y, G.kure, AR_LEYLAK, 0, 0, 0, 0.5);
    arKat(y, arK, 0xcdb8f5, 0, -0.11, 0.34, 0.33, 0.23, 0.3);
    for (const x of [-1, 1]) {
      arGoz(y, x * 0.2, 0.15, 0.39, 0.125, true, 0x35a852);
      arKat(y, arM, 0x7d62b8, x * 0.1, -0.03, 0.615, 0.028);
      arKat(y, G.koni, 0xffffff, x * 0.08, -0.3, 0.5, 0.04, 0.09, 0.04, Math.PI);
      arKat(y, arM, 0xe9a3d8, x * 0.33, -0.08, 0.36, 0.08, 0.05, 0.04);
      const t = sal(x * 0.42, 0.2, -0.05, 0.55, x), ty = arYapi(); t.userData.yukari = true; arKat(ty, G.koni, 0x9fe08a, x * 0.2, 0.1, 0, 0.17, 0.46, 0.06, 0, 0, -x * 1.05); arKat(ty, G.koni, 0x6cc76a, x * 0.17, 0.09, 0.02, 0.09, 0.3, 0.05, 0, 0, -x * 1.05); arBitir(ty, t);
    }
    arKat(y, arGulus, 0x7d62b8, 0, -0.17, 0.58, 0.15, 0.1, 0.1, 0.5, 0, Math.PI);
    for (let i = 0; i < 3; i++) arKat(y, arK, 0x2f8a4a, 0, 0.53 - i * i * 0.045, 0.2 - i * 0.27, 0.075, 0.2, 0.17, -0.25 - i * 0.45);
  } else if (tur === 'bilbo') {
    arKat(y, G.kure, AR_CIKO, 0, 0, 0, 0.5, 0.48, 0.5);
    arKat(y, arK, 0x9a7152, 0, -0.13, 0.37, 0.28, 0.21, 0.28);
    arKat(y, arK, 0x1e1410, 0, -0.04, 0.63, 0.105, 0.078, 0.07);
    arKat(y, arK, 0xff7d93, 0, -0.3, 0.5, 0.085, 0.13, 0.035, 0.35);
    arKat(y, arGulus, 0x3a2418, 0, -0.2, 0.57, 0.12, 0.08, 0.08, 0.5, 0, Math.PI);
    for (const x of [-1, 1]) {
      arGoz(y, x * 0.19, 0.11, 0.42, 0.105, true, 0);
      arKat(y, arM, 0x9a7152, x * 0.2, 0.26, 0.4, 0.055, 0.03, 0.03);
      const t = sal(x * 0.4, 0.3, -0.02, 1, x), ty = arYapi(); arKat(ty, arK, 0x432818, x * 0.08, -0.3, 0, 0.1, 0.36, 0.23, 0, 0, x * 0.15); arBitir(ty, t);
    }
  }
  const yuz = arBitir(y, k);
  if (y.gozler && y.gozler.length) {
    const acik = yuz.geometry.attributes.position.array, kapali = new Float32Array(acik);
    for (const goz of y.gozler) for (let i = goz.bas; i < goz.son; i += 3) {
      kapali[i + 1] = goz.yy + (acik[i + 1] - goz.yy) * 0.06;
      // Ak, iris ve parıltı göz kapağının arkasına çekilir; kapanırken beyaz çizgi parlamaz.
      if (goz.sakla) kapali[i + 2] = acik[i + 2] - 0.14;
    }
    yuz.geometry.morphAttributes.position = [new T.Float32BufferAttribute(kapali, 3)];
    yuz.updateMorphTargets(); yuz.morphTargetInfluences[0] = 0; k.userData.gozMesh = yuz;
  }
  return k;
}

function arSus(y, tur) {   // küçük kişisel süs; yerel düzlemde, yüzü +Z
  arKat(y, arK, 0xf6e3aa, 0, 0, 0, 0.37, 0.33, 0.05);
  arKat(y, arK, tur === 'feza' ? 0xb93629 : tur === 'piril' ? 0x665092 : tur === 'bilbo' ? 0x2460a5 : tur === 'anne' ? 0x188e84 : 0xad601a, 0, 0, 0.04, 0.325, 0.285, 0.018);
  if (tur === 'feza') arKat(y, arYildizGeo, 0xffd53e, 0, 0, 0.09, 0.27, 0.27, 0.27);
  else if (tur === 'piril') { for (const x of [-0.2, 0, 0.2]) arKat(y, G.koni, 0x8dde78, x, x ? -0.03 : 0.04, 0.095, 0.11, x ? 0.26 : 0.34, 0.035); }
  else if (tur === 'bilbo') { arKat(y, arM, 0xf9e1bd, 0, -0.07, 0.085, 0.15, 0.12, 0.035); for (const x of [-1, 0, 1]) arKat(y, arM, 0xf9e1bd, x * 0.16, x ? 0.1 : 0.18, 0.085, 0.065, 0.075, 0.035); }
  else if (tur === 'anne') { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + Math.PI / 2; arKat(y, arM, 0xff6fa5, Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.085, 0.125, 0.125, 0.035); } arKat(y, arM, 0xffd23e, 0, 0, 0.105, 0.1, 0.1, 0.045); }
  else if (tur === 'baba') { for (const x of [-0.1, 0.1]) arKat(y, arTomb, 0xffffff, x, 0, 0.075, 0.055, 0.3, 0.025); }
}
function araba(renk, renk2, tur) {   // öne +Z
  const g = new T.Group(), govde = new T.Group(); g.rotation.order = 'YXZ'; g.add(govde);
  const y = arYapi(), alt = arKoyult(renk, 0.72), gri = 0xc9cfd9;
  const aile = tur === 'anne' || tur === 'baba', arazi = tur === 'bilbo' || tur === 'baba';
  // tombul gövde: üstte yarış şeridi, yanda ince şerit, altı bir ton koyu
  arKat(y, arYuzey(24, 12, arGovdeF, i => (i === 5 || i === 6 || i === 0 || i === 12) ? renk2 : i > 11 ? alt : renk), null, 0, 0.62, -0.05, 1, 1, 1);
  arKat(y, arHap(0.11, 1.3), renk2, 0, 0.42, 1.8, 1, 1, 1, 0, 0, Math.PI / 2);                       // ön tampon
  for (const x of [-1, 1]) {
    arKat(y, arK, renk2, x * 0.66, 0.42, 1.8, 0.16, 0.16, 0.16);
    arKat(y, arHap(0.2, 0.55), renk2, x * 0.9, 0.5, 0, 1, 1, 1, Math.PI / 2);                         // yan yastıklar
    arKat(y, arK, 0xfff3b0, x * 0.4, 0.68, 1.5, 0.14, 0.13, 0.1);                                  // farlar
    arKat(y, arM, 0xffffff, x * 0.4, 0.69, 1.56, 0.07, 0.065, 0.06);
    arKat(y, G.sil, gri, x * 0.5, 0.56, -1.8, 0.1, 0.34, 0.1, Math.PI / 2);                        // egzoz
    arKat(y, G.sil, 0x23262e, x * 0.5, 0.56, -1.81, 0.065, 0.345, 0.065, Math.PI / 2);
    arKat(y, arTomb, renk, x * 1.0, 1.4, -1.6, 0.05, 0.2, 0.32);                                   // kanat yan levhaları
    arKat(y, G.kutu, AR_KOYU, x * 0.42, 1.2, -1.55, 0.09, 0.5, 0.14, -0.2);
    arKat(y, arM, 0xff5a4a, x * 0.72, 0.66, -1.72, 0.09, 0.07, 0.05);                              // stop lambaları
    arKat(y, arK, alt, x * 0.71, 0.64, -1.72, 0.14, 0.12, 0.05);                                  // stop yuvası
    arKat(y, arM, 0xff7d66, x * 0.71, 0.66, -1.78, 0.105, 0.065, 0.025);
    arKat(y, arM, 0xffc9a5, x * 0.71, 0.683, -1.802, 0.07, 0.016, 0.01);
    // Çamurluklar tekerin üzerinde bir kemer çizer; yan şerit kaportayı toplar.
    for (const zz of [-1, 1]) arKat(y, arCamurluk, aile ? renk2 : renk, x * 0.96, zz < 0 ? 0.5 : 0.45, zz * 1.05, zz < 0 ? 0.57 : 0.52, zz < 0 ? 0.57 : 0.52, zz < 0 ? 0.57 : 0.52, 0, Math.PI / 2);
    arKat(y, arHap(0.036, 1.18), renk2, x * 0.925, 0.68, 0, 1, 1, 1, Math.PI / 2);
    arKat(y, arTomb, alt, x * 0.74, 0.6, -0.92, 0.08, 0.18, 0.35, -0.08);
    for (let j = 0; j < 3; j++) arKat(y, arTomb, 0x273340, x * 0.831, 0.62, -0.73 - j * 0.13, 0.014, 0.095, 0.023, 0, 0, x * 0.1);
  }
  arKat(y, arTomb, renk2, 0, 1.46, -1.62, 1.02, 0.055, 0.27, 0.1);                                  // arka kanat
  arKat(y, arHap(0.08, 1.2), AR_KOYU, 0, 0.4, -1.86, 1, 1, 1, 0, 0, Math.PI / 2);                     // arka tampon
  for (const z of [-1.05, 1.05]) arKat(y, G.sil, AR_KOYU, 0, 0.46, z, 0.06, 1.8, 0.06, 0, 0, Math.PI / 2);   // dingiller
  arKat(y, arHalka, AR_KOYU, 0, 0.985, -0.22, 0.5, 0.62, 0.45, Math.PI / 2);                       // kabin kenarı
  arKat(y, arTomb, AR_KOYU, 0, 1.13, -0.7, 0.45, 0.42, 0.12, -0.12);                                // koltuk
  arKat(y, arTomb, renk2, 0, 1.13, -0.83, 0.38, 0.34, 0.03, -0.12);
  arKat(y, arTomb, renk, 0, 0.97, 0.66, 0.4, 0.15, 0.2);                                            // ön kaput çıkıntısı
  arKat(y, G.sil, AR_KOYU, 0, 1.05, 0.52, 0.035, 0.3, 0.035, 0.9);                                  // direksiyon
  // Renk kadar siluet de kişisel: alçak spor kanat, yapraklar, arazi tamponu, yuvarlak aile aracı.
  if (tur === 'feza') {
    for (const x of [-1, 1]) {
      arKat(y, arTomb, renk2, x * 0.59, 0.93, 0.73, 0.16, 0.07, 0.64, -0.18, 0, x * 0.08);
      arKat(y, arTomb, alt, x * 0.82, 0.44, -0.23, 0.1, 0.1, 0.62);
      arKat(y, arTomb, renk2, x * 0.79, 1.46, -1.58, 0.055, 0.1, 0.24, 0, 0, x * 0.3);
    }
    arKat(y, arTomb, 0xffe995, 0, 1.53, -1.62, 0.48, 0.012, 0.23, 0.1);
  } else if (tur === 'piril') {
    for (const x of [-1, 1]) {
      arKat(y, arK, 0x8ace71, x * 0.7, 0.91, 0.64, 0.22, 0.15, 0.6, -0.18, x * 0.22, x * 0.1);
      arKat(y, arK, 0x4f9f55, x * 0.77, 1.53, -1.58, 0.36, 0.075, 0.26, 0.12, 0, x * 0.22);
      arKat(y, arK, 0xb8e993, x * 0.77, 1.56, -1.54, 0.28, 0.02, 0.17, 0.12, 0, x * 0.22);
    }
  } else if (tur === 'bilbo') {
    // Büyük ama alçak macera tamponu; iki kemik ucu arkadan kolayca ayırt edilir.
    arKat(y, arHap(0.09, 1.02), 0xf0e3c8, 0, 0.42, -1.96, 1, 1, 1, 0, 0, Math.PI / 2);
    for (const x of [-1, 1]) for (const yy of [-1, 1]) arKat(y, arM, 0xffedce, x * 0.64, 0.42 + yy * 0.085, -1.96, 0.12, 0.115, 0.1);
    arKat(y, arTomb, renk2, 0, 1.51, -1.62, 0.81, 0.018, 0.19, 0.1);
  } else if (tur === 'anne') {
    for (const x of [-1, 1]) {
      arKat(y, arK, renk2, x * 0.72, 0.68, 1.03, 0.17, 0.22, 0.48);
      arKat(y, arK, 0xffdb9e, x * 0.67, 0.75, 1.36, 0.14, 0.14, 0.04);
      arKat(y, arK, renk, x * 0.67, 0.75, 1.4, 0.103, 0.103, 0.024);
    }
    arKat(y, arTomb, 0xffeaca, 0, 1.53, -1.62, 0.88, 0.025, 0.23, 0.1);
    for (const x of [-1, 1]) {
      arKat(y, arM, 0xff8fb1, x * 0.49, 1.55, -1.63, 0.1, 0.027, 0.075, 0.1);
      arKat(y, arM, 0xffd953, x * 0.49, 1.574, -1.63, 0.038, 0.012, 0.034);
    }
  } else if (tur === 'baba') {
    arKat(y, arHap(0.08, 1.28), gri, 0, 0.37, -1.96, 1, 1, 1, 0, 0, Math.PI / 2);
    for (const x of [-1, 1]) {
      arKat(y, arHap(0.07, 0.22), gri, x * 0.61, 0.52, -1.94, 1, 1, 1, -0.15);
      arKat(y, arK, alt, x * 0.58, 0.94, 0.77, 0.22, 0.15, 0.5, -0.15);
    }
    for (let j = 0; j < 3; j++) arKat(y, arTomb, renk2, (j - 1) * 0.22, 1.53, -1.62, 0.07, 0.025, 0.25, 0.1);
  }
  // sürücü gövdesi
  const hayvan = tur === 'piril' || tur === 'bilbo';
  const ust = tur === 'feza' ? 0x3b82e0 : tur === 'anne' ? 0xff8fb1 : tur === 'baba' ? 0x4f6fd0 : tur === 'piril' ? AR_LEYLAK : AR_CIKO;
  const el = tur === 'piril' ? 0xcdb8f5 : tur === 'bilbo' ? 0x9a7152 : AR_TEN;
  arKat(y, arK, ust, 0, 1.1, -0.26, 0.37, 0.45, 0.31);
  if (tur === 'piril') {
    arKat(y, arK, 0xc8ec8c, 0, 1.08, -0.1, 0.27, 0.36, 0.2);
    for (let i = 0; i < 3; i++) arKat(y, arTomb, 0x8fcf62, 0, 1.2 - i * 0.11, 0.085 - i * 0.012, 0.19 - i * 0.012, 0.022, 0.03);
    for (const x of [-1, 1]) arKat(y, G.koni, 0x2f8a4a, x * 0.42, 1.42, -0.5, 0.16, 0.5, 0.04, -0.5, 0, -x * 0.9);   // minik kanatlar
    for (let i = 0; i < 3; i++) arKat(y, arK, 0x2f8a4a, 0, 1.08 - i * 0.03, -1.05 - i * 0.26, 0.05, 0.16 - i * 0.02, 0.14);   // arabada ibik
  } else if (tur === 'bilbo') {
    arKat(y, arHalka, 0xe8433a, 0, 1.36, -0.24, 0.27, 0.27, 0.3, Math.PI / 2 - 0.15);
    arKat(y, arM, 0xffd23e, 0, 1.3, 0.04, 0.06, 0.06, 0.03);
    arKat(y, arK, 0x9a7152, 0, 1.08, -0.1, 0.24, 0.32, 0.18);
  } else {
    arKat(y, arHalka, tur === 'baba' ? 0xffffff : 0xffe07a, 0, 1.4, -0.24, 0.2, 0.2, 0.25, Math.PI / 2 - 0.15);   // yaka
  }
  // süs: burunda (yukarı bakar) ve arkada (geriye bakar)
  arTaban(y, 0, 0.93, 0.95, -Math.PI / 2 + 0.15, 0, 0); arSus(y, tur);
  arTaban(y, 0, 0.72, -1.87, 0, Math.PI, 0); arSus(y, tur);
  if (tur === 'feza') for (const x of [-1, 1]) { arTaban(y, x * 1.055, 1.4, -1.6, 0, x * Math.PI / 2, 0); arKat(y, arYildizGeo, 0xffc400, 0, 0, -0.02, 0.15, 0.15, 0.15); }
  y.taban = null;
  arBitir(y, govde, arBoya);
  // Direksiyon ayrı tek parça: el ile aynı yönde döner, sürüşte donuk kalmaz.
  const direksiyon = new T.Group(), dy = arYapi(); direksiyon.position.set(0, 1.13, 0.41); direksiyon.rotation.x = -0.65;
  arKat(dy, arHalka, AR_KOYU, 0, 0, 0, 0.17, 0.17, 0.17);
  for (let i = 0; i < 3; i++) arKat(dy, arTomb, 0xc4cbd3, 0, 0, 0.012, 0.022, 0.14, 0.015, 0, 0, i * Math.PI * 2 / 3);
  arKat(dy, arM, renk2, 0, 0, 0.03, 0.06, 0.06, 0.035); arBitir(dy, direksiyon, arBoya); govde.add(direksiyon);
  // kollar (omuzdan döner, eller direksiyonda)
  const kol = [];
  for (const x of [-1, 1]) {
    const kg = new T.Group(), ky = arYapi(); kg.position.set(x * 0.34, 1.27, -0.2); kg.rotation.set(0.22, -x * 0.28, 0); kg.userData.yon = x;
    arKat(ky, arHap(0.085, 0.42), ust, 0, 0, 0.3, 1, 1, 1, Math.PI / 2);
    arKat(ky, arK, el, 0, 0, 0.6, hayvan ? 0.115 : 0.1);
    arBitir(ky, kg); govde.add(kg); kol.push(kg);
  }
  const kf = kafa(tur); kf.position.set(0, 1.76, -0.22); if (tur === 'baba') kf.scale.setScalar(1.04); govde.add(kf);
  // tekerler: [dönüş grubu] > [dönen grup]
  const teker = [], on = [];
  for (const z of [-1, 1]) for (const x of [-1, 1]) {
    const r = z < 0 ? 0.5 : 0.45, s = r / 0.46, d = new T.Group(), t = new T.Group(), ty = arYapi();
    d.position.set(x * 0.97, r, z * 1.05); g.add(d); d.add(t); t.userData.r = r;
    arKat(ty, arLastik, AR_KOYU, 0, 0, 0, s, s, s * (z < 0 ? 1.5 : 1.3), 0, Math.PI / 2);
    arKat(ty, G.sil, 0xeef1f6, 0, 0, 0, 0.21 * s, 0.4, 0.21 * s, 0, 0, Math.PI / 2);
    arKat(ty, arM, renk2 === 0xffffff ? renk : renk2, x * 0.2, 0, 0, 0.05, 0.1 * s, 0.1 * s);
    for (let q = 0; q < 3; q++) arKat(ty, G.kutu, 0x9aa3b0, x * 0.203, 0, 0, 0.012, 0.38 * s, 0.06, q * Math.PI / 3);
    arKat(ty, arInceHalka, 0xf0e9db, x * 0.223, 0, 0, 0.235 * s, 0.235 * s, 0.235 * s, 0, Math.PI / 2);
    for (let q = 0; q < 5; q++) {
      const an = q * Math.PI * 2 / 5;
      arKat(ty, arCivi, 0xf1d386, x * 0.244, Math.cos(an) * 0.122 * s, Math.sin(an) * 0.122 * s, 0.017, 0.02, 0.02);
    }
    // Seyrek kabartma dişler: ayrı cisim/çizim olmadan lastiğin dönüşünü okunur kılar.
    for (let q = 0; q < 12; q++) {
      const an = q * Math.PI * 2 / 12;
      arKat(ty, G.kutu, arazi ? 0x414954 : 0x363c47, 0, Math.cos(an) * (r - 0.025), Math.sin(an) * (r - 0.025), arazi ? 0.4 : 0.3, 0.052, 0.124, an);
    }
    arBitir(ty, t); teker.push(t); if (z > 0) on.push(d);
  }
  const golge = new T.Mesh(new T.PlaneGeometry(3.4, 4.6), golgeMat.clone()); golge.rotation.x = -Math.PI / 2; golge.position.y = 0.07; golge.renderOrder = 2; scene.add(golge);
  scene.add(g);
  return { g, govde, teker, golge, arOn: on, arKol: kol, arKafa: kf, arGoz: kf.userData.gozMesh, arSallan: kf.userData.sallan, arDireksiyon: direksiyon, arAlev: null,
    ar: { t: 0, v0: 0, ivme: 0, don: 0, egx: 0, egz: 0, sev: 0, sal: 0, bak: 0, yay: 0, ayak: new Float32Array(4), havada: false, inis: 9, sek: 9, tok: 9 } };
}
const arKoniGeo = new T.ConeGeometry(1, 1, 12); arKoniGeo.translate(0, 0.5, 0);
function roketAlevi(a) {   // iç içe iki koni; oyun.js görünürlüğü ve ölçeği ayarlar, içteki koni arabaYerlestir içinde titreşir
  const m = new T.Group(); m.position.set(0, 0.58, -1.9); m.rotation.x = -Math.PI / 2;
  const ic = new T.Mesh(arKoniGeo, new T.MeshBasicMaterial({ color: 0xfff6b0 })); ic.scale.set(0.58, 0.66, 0.58); m.add(ic);
  const dis = new T.Mesh(arKoniGeo, new T.MeshBasicMaterial({ color: 0xff7a14, transparent: true, opacity: 0.55, depthWrite: false })); dis.renderOrder = 3; m.add(dis);
  m.userData.ic = ic; m.userData.dis = dis; m.visible = false; a.govde.add(m); a.arAlev = m; return m;
}
OLAY.on('yildiz', () => { if (typeof A !== 'undefined' && A[0].ar) A[0].ar.sek = 0; });
OLAY.on('tok', () => { if (typeof A !== 'undefined' && A[0].ar) A[0].ar.tok = 0; });
OLAY.on('durum', d => {
  if (d !== 'giris' && d !== 'sayim' && d !== 'baslik') return;
  // Yeniden yarışta eski kupa pozu veya iniş yaylanması taşınmasın.
  if (typeof A !== 'undefined') for (const a of A) if (a.ar) {
    const s = a.ar; s.v0 = a.v; s.ivme = 0; s.sev = 0; s.yay = 0; s.don = 0; s.egx = 0; s.egz = 0; s.bak = 0; s.sal = 0;
    s.ayak.fill(0);
    s.havada = false; s.inis = 9; s.sek = 9; s.tok = 9;
  }
});
const arKolYon = new T.Vector3(), arKolEksen = new T.Vector3(0, 0, 1), arKolQ = new T.Quaternion(), arSevQ = new T.Quaternion(), arSevE = new T.Euler();
const arYumusak = (dt, hiz) => 1 - Math.exp(-Math.max(0, dt) * hiz);

function arabaYerlestir(a, dt) {
  if (typeof rampaZemin === 'function') rampaZemin(a);
  const p = pist(a.yol, o1), x = p.x - p.tz * a.d, z = p.z + p.tx * a.d, s = a.ar;
  const yerY = Number.isFinite(a.rampaY) ? a.rampaY : 0, yerEgim = Number.isFinite(a.rampaEgim) ? a.rampaEgim : 0, yerYatis = Number.isFinite(a.rampaYatis) ? a.rampaYatis : 0;
  const havada = a.hop > 0, ucus = typeof RAMPA !== 'undefined' ? RAMPA.ucus : 0.95;
  let y = yerY, hu = 0, egim = yerEgim, yatis = yerYatis;
  if (havada) {
    hu = 1 - clamp(a.hop / ucus, 0, 1); const kalan = 1 - hu;
    // Sayacı fizik ilerletir. Rampa yüksekliği kalkışta korunur, yere inişte kesintisiz sıfıra iner.
    y = Math.sin(hu * Math.PI) * 1.9 + (a.hopBasY || 0) * kalan;
    egim = (a.hopBasEgim || 0) * kalan * kalan; yatis = (a.hopBasYatis || 0) * kalan * kalan;
  }
  if (s.havada && !havada) s.inis = 0;
  s.havada = havada; s.inis += dt; s.sek += dt; s.tok += dt; s.t += dt;
  const k = arYumusak(dt, 8), t = s.t, hiz = Math.min(1, a.v / 26);
  const ivme = dt > 0 ? clamp((a.v - s.v0) / dt, -30, 30) : 0; s.v0 = a.v; s.ivme += (ivme - s.ivme) * arYumusak(dt, 5);
  const don = clamp(-Math.atan2(a.dv, Math.max(8, a.v)) * 1.7 - p.k * a.v * 0.3, -0.5, 0.5); s.don += (don - s.don) * k;
  s.sev += ((a.bitti ? 1 : 0) - s.sev) * arYumusak(dt, 4);
  a.g.position.set(x, y, z);
  a.g.rotation.set(-egim, Math.atan2(p.tx, p.tz) - Math.atan2(a.dv, Math.max(8, a.v)) * 0.9, yatis, 'YXZ');
  // gövde: yatma, yaylanma, zıplarken gerilme, inişte ezilme, sevinç zıplaması
  const egz = clamp(a.dv * 0.014, -0.13, 0.13) + clamp(p.k * a.v * 0.05, -0.08, 0.08) + (s.tok < 0.5 ? Math.sin(s.tok * 30) * 0.06 * (1 - s.tok * 2) : 0);
  s.egz += (egz - s.egz) * k; a.govde.rotation.z = s.egz;
  const egx = havada ? -0.16 + hu * 0.3 : -s.ivme * 0.005 + (s.inis < 0.6 ? Math.sin(s.inis * 15) * 0.05 * (1 - s.inis / 0.6) : 0);
  s.egx += (egx - s.egx) * k; a.govde.rotation.x = s.egx;
  let es = havada ? 0.065 * Math.sin(Math.PI * Math.pow(hu, 0.6)) : s.inis < 0.7 ? -0.095 * Math.exp(-7 * s.inis) * Math.cos(s.inis * 16) : 0;
  const zs = Math.abs(Math.sin(t * 6.5 + a.faz));
  es += s.sev * (zs - 0.5) * 0.07 + (s.sek < 0.35 ? Math.sin(s.sek / 0.35 * Math.PI) * 0.07 : 0);
  a.govde.scale.set(1 - es * 0.5, 1 + es, 1 - es * 0.5);
  const yayHedef = havada ? 0.035 : s.inis < 0.65 ? -0.1 * Math.exp(-8 * s.inis) * Math.cos(s.inis * 17) : 0;
  s.yay += (yayHedef - s.yay) * arYumusak(dt, 24);
  a.govde.position.y = Math.sin(t * 22 + a.faz) * 0.009 * Math.min(1, a.v / 10) + Math.sin(t * 2.6 + a.faz) * 0.009 + s.sev * zs * 0.13 + s.yay;
  // tekerler
  const aks = typeof RAMPA !== 'undefined' ? RAMPA.aks : 1.05, yan = typeof RAMPA !== 'undefined' ? RAMPA.iz : 0.97;
  const boyEgim = Math.sin(yerEgim), yanEgim = Math.cos(yerEgim) * Math.sin(yerYatis), dikPay = Math.max(0.65, Math.cos(yerEgim) * Math.cos(yerYatis));
  const havaYay = havada ? Math.exp(-hu * 14) : 0, havaSarkma = havada ? 0.045 * Math.sin(hu * Math.PI) : 0;
  for (let i = 0; i < 4; i++) {
    const tk = a.teker[i]; tk.rotation.x = (tk.rotation.x + a.v * dt / tk.userData.r) % (Math.PI * 2);
    const tx = i & 1 ? yan : -yan, tz = i < 2 ? -aks : aks;
    const zeminFarki = !havada && a.rampaAyak ? clamp((a.rampaAyak[i] - (yerY + boyEgim * tz + yanEgim * tx)) / dikPay, -0.35, 0.35) : 0;
    if (!havada) s.ayak[i] = zeminFarki;
    // Havadayken süspansiyon açılır; karada lastikler zeminden kopmaz.
    const ayakY = havada ? s.ayak[i] * havaYay - havaSarkma : zeminFarki;
    tk.parent.position.y = tk.userData.r + ayakY;
  }
  a.arOn[0].rotation.y = a.arOn[1].rotation.y = s.don * 0.9;
  a.arDireksiyon.rotation.z = -s.don * 1.15;
  // sürücü: kafa viraja bakar, kollar direksiyonu çevirir; bitişte kollar havada
  const bak = clamp(s.don * 1.5, -0.55, 0.55) + (a.v < 1 ? Math.sin(t * 0.9 + a.faz) * 0.35 * (1 - s.sev) : 0);
  s.bak += (bak - s.bak) * arYumusak(dt, 5);
  a.arKafa.rotation.set(Math.sin(t * 2.2 + a.faz) * 0.03 - s.sev * 0.2 - (havada ? 0.18 : 0) + s.ivme * 0.003, s.bak, -s.bak * 0.22 + s.sev * Math.sin(t * 6.5 + a.faz) * 0.12);
  if (a.arGoz) {
    const dongu = 3.5 + a.i * 0.29, faz = (t + 1.3 + a.i * 0.57) % dongu;
    a.arGoz.morphTargetInfluences[0] = faz > dongu - 0.18 ? Math.sin((faz - dongu + 0.18) / 0.18 * Math.PI) : 0;
  }
  for (let i = 0; i < 2; i++) {
    const kg = a.arKol[i], yon = kg.userData.yon, el = Math.sin(t * 11 + i * 2.4 + a.faz);
    const aci = a.arDireksiyon.rotation.z, wx = yon * 0.17 * Math.cos(aci), wy = yon * 0.17 * Math.sin(aci);
    arKolYon.set(wx - kg.position.x, 1.139 + wy * 0.796084 - kg.position.y, 0.422 - wy * 0.605186 - kg.position.z);
    const uzun = arKolYon.length(); arKolYon.multiplyScalar(1 / Math.max(uzun, 0.001));
    arKolQ.setFromUnitVectors(arKolEksen, arKolYon);
    if (s.sev > 0.001) { arSevQ.setFromEuler(arSevE.set(-1.95 + el * 0.24, yon * (0.42 + el * 0.1), yon * 0.1)); arKolQ.slerp(arSevQ, s.sev); }
    kg.quaternion.copy(arKolQ); kg.scale.z = lerp(uzun / 0.6, 1, s.sev);
  }
  // saç ve kulaklar hızla geriye savrulur
  s.sal += ((hiz * 0.6 + (havada ? 0.5 : 0)) - s.sal) * arYumusak(dt, 6);
  for (let i = 0; i < a.arSallan.length; i++) {
    const sp = a.arSallan[i], u = sp.userData;
    sp.rotation.x = (s.sal + Math.sin(t * 13 + a.faz + i * 1.9) * 0.1 * (hiz + s.sev * 0.6)) * u.kx * (u.yukari ? -1 : 1);
    sp.rotation.z = u.yon * (s.sal * 0.35 + s.sev * 0.2) - clamp(a.dv * 0.03, -0.3, 0.3) * u.kx;
  }
  if (a.arAlev && a.arAlev.visible) { const ic = a.arAlev.userData.ic, f = Math.sin(t * 71) * 0.5 + Math.sin(t * 43) * 0.5; ic.scale.set(0.58 + f * 0.08, 0.66 + f * 0.14, 0.58 + f * 0.08); }
  a.golge.position.set(x, 0.07, z); a.golge.rotation.z = a.g.rotation.y;
  a.golge.scale.setScalar(1 + Math.min(0.32, y * 0.15)); a.golge.material.opacity = Math.max(0.55, 1 - y * 0.22);
  a.x = x; a.z = z; a.tx = p.tx; a.tz = p.tz;
}
