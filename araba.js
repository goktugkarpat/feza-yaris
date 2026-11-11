/* Arabalar ve sürücüler: araba(renk, renk2, tur) modeli kurar; arabaYerlestir(a, dt) her karede konum, yatış, teker dönüşü, gölge, sürücü canlandırması.
   a.yol = pist boyunca ilerleme (m), a.d = yanal konum, a.v = hız, a.dv = yanal hız, a.hop = zıplama sayacı. tur: feza | piril | bilbo | anne | baba
   Çizim sayısı az kalsın diye sabit parçalar tek geometride birleştirilir (köşe renkleri, tek ortak malzeme arMat):
   araba başına gövde 1 + kafa 1 + savrulan parçalar 0-2 + kollar 2 + tekerler 4 + gölge 1. */
'use strict';

const golgeDoku = tuvalDoku(64, 64, (g, w) => { const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
const golgeMat = new T.MeshBasicMaterial({ map: golgeDoku, transparent: true, depthWrite: false });
function parca(ust, geo, renk, x, y, z, sx, sy, sz) { const m = new T.Mesh(geo, typeof renk === 'number' ? mat(renk) : renk); m.position.set(x, y, z); m.scale.set(sx, sy, sz); ust.add(m); return m; }

// ───────── birleştirici: parçaları tek geometride toplar ─────────
const arMat = new T.MeshLambertMaterial({ vertexColors: true });
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
function arBitir(y, ust) { const m = new T.Mesh(arGeo(y), arMat); ust.add(m); return m; }

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
const arHap = (r, u) => new T.CapsuleGeometry(r, u, 3, 8);       // Y boyunca hap
const arLastik = new T.TorusGeometry(0.3, 0.16, 6, 16);
const arHalka = new T.TorusGeometry(1, 0.2, 5, 12);
const arGulus = new T.TorusGeometry(1, 0.2, 5, 8, Math.PI);
const arSac = new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.57);
const arYildizGeo = (() => { const s = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.52 : 1, a = i / 10 * Math.PI * 2 + Math.PI / 2; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return new T.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false }); })();
const arGovdeF = (() => { const sb = arSuper(3.2); return (u, w, o) => { sb(u, w, o); const z = o.z; let x = o.x * 0.9, y = o.y * 0.38; if (z > 0) { x *= 1 - 0.3 * z * z; if (y > 0) y *= 1 - 0.45 * Math.pow(z, 1.5); } else if (y > 0) y *= 1 + 0.22 * -z; o.set(x, y, z * 1.8); }; })();
const AR_TEN = 0xf6c9a4, AR_KOYU = 0x2b2f3a, AR_LEYLAK = 0xb79bea, AR_CIKO = 0x5b3a26;

function arGoz(y, x, yy, z, r, beyaz, iris) {   // sevimli göz: (ak) + (renkli halka) + koyu bebek + parıltı
  let o = 0;
  if (beyaz) { arKat(y, arM, 0xffffff, x, yy, z, r, r * 1.1, r * 0.6); o = r * 0.42; r *= 0.68; }
  if (iris) { arKat(y, arM, iris, x, yy, z + o, r, r * 1.1, r * 0.6); o += r * 0.4; r *= 0.62; }
  arKat(y, arM, 0x2a2230, x, yy, z + o, r, r * 1.25, r * 0.55);
  arKat(y, arM, 0xffffff, x + r * 0.3, yy + r * 0.5, z + o + r * 0.45, r * 0.34);
}
function kafa(tur) {   // yüz +Z'ye bakar; k.userData.sallan = hızla savrulan parçalar (saç, kulak)
  const k = new T.Group(), y = arYapi(); k.userData.sallan = [];
  const sal = (px, py, pz, kx, yon) => { const gr = new T.Group(); gr.position.set(px, py, pz); gr.userData.kx = kx; gr.userData.yon = yon; k.add(gr); k.userData.sallan.push(gr); return gr; };
  if (tur === 'feza' || tur === 'anne' || tur === 'baba') {
    const sac = tur === 'feza' ? 0x6b4226 : tur === 'anne' ? 0x7a4a2a : 0x2f2622;
    arKat(y, G.kure, AR_TEN, 0, 0, 0, 0.5);
    for (const x of [-1, 1]) {
      arKat(y, arM, AR_TEN, x * 0.49, -0.03, 0, 0.07, 0.1, 0.09);
      arGoz(y, x * 0.17, 0.02, 0.455, tur === 'feza' ? 0.085 : 0.075, false, 0);
      arKat(y, arM, 0xf59a9a, x * 0.31, -0.13, 0.36, 0.085, 0.055, 0.04);
    }
    if (tur === 'feza') for (const x of [-1, 1]) arKat(y, arM, sac, x * 0.17, 0.165, 0.455, 0.07, 0.017, 0.025, 0, 0, x * 0.18);              // kaşlar
    if (tur === 'anne') for (const x of [-1, 1]) arKat(y, arM, 0x2a2230, x * 0.25, 0.085, 0.425, 0.05, 0.014, 0.02, 0, 0, x * 0.7);        // kirpikler
    arKat(y, arM, 0xeeb48e, 0, -0.06, 0.5, 0.045, 0.04, 0.04);
    arKat(y, arGulus, tur === 'anne' ? 0xd8576b : 0x9a4a3a, 0, -0.14, 0.455, 0.11, 0.1, 0.1, 0.25, 0, Math.PI);
    arKat(y, arSac, sac, 0, 0.01, -0.01, 0.535, 0.535, 0.535, tur === 'baba' ? -0.68 : -0.5);
    if (tur === 'feza') {
      for (const x of [-0.2, 0, 0.2]) arKat(y, arK, sac, x, 0.31 - Math.abs(x) * 0.25, 0.38 - Math.abs(x) * 0.2, 0.15, 0.09, 0.1, -0.5);
      const t = sal(0, 0.5, -0.05, 0.9, 0), ty = arYapi(); arKat(ty, arK, sac, 0, 0.08, 0, 0.07, 0.15, 0.07); arKat(ty, arK, sac, 0.05, 0.05, -0.03, 0.05, 0.11, 0.05, 0, 0, -0.5); arBitir(ty, t);
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
      const t = sal(x * 0.42, 0.2, -0.05, 0.55, x), ty = arYapi(); arKat(ty, G.koni, 0x9fe08a, x * 0.2, 0.1, 0, 0.17, 0.46, 0.06, 0, 0, -x * 1.05); arKat(ty, G.koni, 0x6cc76a, x * 0.17, 0.09, 0.02, 0.09, 0.3, 0.05, 0, 0, -x * 1.05); arBitir(ty, t);
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
  arBitir(y, k);
  return k;
}

function arSus(y, tur) {   // küçük kişisel süs; yerel düzlemde, yüzü +Z
  if (tur === 'feza') arKat(y, arYildizGeo, 0xffc400, 0, 0, 0, 0.3, 0.3, 0.3);
  else if (tur === 'piril') { for (const x of [-0.2, 0, 0.2]) arKat(y, G.koni, 0x2f8a4a, x, x ? -0.03 : 0.04, 0.03, 0.11, x ? 0.26 : 0.34, 0.035); }
  else if (tur === 'bilbo') { arKat(y, arM, AR_CIKO, 0, -0.07, 0.02, 0.15, 0.12, 0.035); for (const x of [-1, 0, 1]) arKat(y, arM, AR_CIKO, x * 0.16, x ? 0.1 : 0.18, 0.02, 0.065, 0.075, 0.035); }
  else if (tur === 'anne') { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + Math.PI / 2; arKat(y, arM, 0xff6fa5, Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.02, 0.125, 0.125, 0.035); } arKat(y, arM, 0xffd23e, 0, 0, 0.04, 0.1, 0.1, 0.045); }
  else if (tur === 'baba') { for (const x of [-0.1, 0.1]) arKat(y, arTomb, 0xffffff, x, 0, 0.01, 0.055, 0.3, 0.025); }
}
function araba(renk, renk2, tur) {   // öne +Z
  const g = new T.Group(), govde = new T.Group(); g.add(govde);
  const y = arYapi(), alt = arKoyult(renk, 0.72), gri = 0xc9cfd9;
  // tombul gövde: üstte yarış şeridi, yanda ince şerit, altı bir ton koyu
  arKat(y, arYuzey(24, 12, arGovdeF, i => (i === 5 || i === 6 || i === 0 || i === 11) ? renk2 : i > 11 ? alt : renk), null, 0, 0.62, -0.05, 1, 1, 1);
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
  }
  arKat(y, arTomb, renk2, 0, 1.46, -1.62, 1.02, 0.055, 0.27, 0.1);                                  // arka kanat
  arKat(y, arHap(0.08, 1.2), AR_KOYU, 0, 0.4, -1.86, 1, 1, 1, 0, 0, Math.PI / 2);                     // arka tampon
  for (const z of [-1.05, 1.05]) arKat(y, G.sil, AR_KOYU, 0, 0.46, z, 0.06, 1.8, 0.06, 0, 0, Math.PI / 2);   // dingiller
  arKat(y, arHalka, AR_KOYU, 0, 0.985, -0.22, 0.5, 0.62, 0.45, Math.PI / 2);                       // kabin kenarı
  arKat(y, arTomb, AR_KOYU, 0, 1.13, -0.7, 0.45, 0.42, 0.12, -0.12);                                // koltuk
  arKat(y, arTomb, renk2, 0, 1.13, -0.83, 0.38, 0.34, 0.03, -0.12);
  arKat(y, arTomb, renk, 0, 0.97, 0.66, 0.4, 0.15, 0.2);                                            // ön kaput çıkıntısı
  arKat(y, G.sil, AR_KOYU, 0, 1.05, 0.52, 0.035, 0.3, 0.035, 0.9);                                  // direksiyon
  arKat(y, arHalka, AR_KOYU, 0, 1.13, 0.41, 0.17, 0.17, 0.17, -0.65);
  arKat(y, arM, renk2, 0, 1.13, 0.41, 0.06, 0.06, 0.03, -0.65);
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
  arBitir(y, govde);
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
    arBitir(ty, t); teker.push(t); if (z > 0) on.push(d);
  }
  const golge = new T.Mesh(new T.PlaneGeometry(3.4, 4.6), golgeMat); golge.rotation.x = -Math.PI / 2; golge.position.y = 0.07; golge.renderOrder = 2; scene.add(golge);
  scene.add(g);
  return { g, govde, teker, golge, arOn: on, arKol: kol, arKafa: kf, arSallan: kf.userData.sallan, arAlev: null,
    ar: { t: 0, v0: 0, ivme: 0, don: 0, egx: 0, egz: 0, sev: 0, sal: 0, bak: 0, havada: false, inis: 9, sek: 9, tok: 9 } };
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

function arabaYerlestir(a, dt) {
  const p = pist(a.yol, o1), x = p.x - p.tz * a.d, z = p.z + p.tx * a.d, s = a.ar;
  let y = 0, hu = 0;
  if (a.hop > 0) { a.hop -= dt; hu = 1 - clamp(a.hop / 0.95, 0, 1); y = Math.sin(hu * Math.PI) * 1.9; }
  const havada = a.hop > 0;
  if (s.havada && !havada) s.inis = 0;
  s.havada = havada; s.inis += dt; s.sek += dt; s.tok += dt; s.t += dt;
  const k = Math.min(1, dt * 8), t = s.t, hiz = Math.min(1, a.v / 26);
  const ivme = dt > 0 ? clamp((a.v - s.v0) / dt, -30, 30) : 0; s.v0 = a.v; s.ivme += (ivme - s.ivme) * Math.min(1, dt * 5);
  const don = clamp(-Math.atan2(a.dv, Math.max(8, a.v)) * 1.7 - p.k * a.v * 0.3, -0.5, 0.5); s.don += (don - s.don) * k;
  s.sev += ((a.bitti ? 1 : 0) - s.sev) * Math.min(1, dt * 4);
  a.g.position.set(x, y, z);
  a.g.rotation.y = Math.atan2(p.tx, p.tz) - Math.atan2(a.dv, Math.max(8, a.v)) * 0.9;
  // gövde: yatma, yaylanma, zıplarken gerilme, inişte ezilme, sevinç zıplaması
  const egz = clamp(a.dv * 0.014, -0.13, 0.13) + clamp(p.k * a.v * 0.05, -0.08, 0.08) + (s.tok < 0.5 ? Math.sin(s.tok * 30) * 0.06 * (1 - s.tok * 2) : 0);
  s.egz += (egz - s.egz) * k; a.govde.rotation.z = s.egz;
  const egx = havada ? -0.16 + hu * 0.3 : -s.ivme * 0.005 + (s.inis < 0.6 ? Math.sin(s.inis * 15) * 0.05 * (1 - s.inis / 0.6) : 0);
  s.egx += (egx - s.egx) * k; a.govde.rotation.x = s.egx;
  let es = havada ? 0.11 * Math.sin(Math.PI * Math.pow(hu, 0.6)) : s.inis < 0.7 ? -0.2 * Math.exp(-6 * s.inis) * Math.cos(s.inis * 15) : 0;
  const zs = Math.abs(Math.sin(t * 6.5 + a.faz));
  es += s.sev * (zs - 0.5) * 0.07 + (s.sek < 0.35 ? Math.sin(s.sek / 0.35 * Math.PI) * 0.07 : 0);
  a.govde.scale.set(1 - es * 0.5, 1 + es, 1 - es * 0.5);
  a.govde.position.y = Math.sin(t * 22 + a.faz) * 0.012 * Math.min(1, a.v / 10) + Math.sin(t * 2.6 + a.faz) * 0.012 + s.sev * zs * 0.16;
  // tekerler
  for (let i = 0; i < 4; i++) { const tk = a.teker[i]; tk.rotation.x += a.v * dt / tk.userData.r; }
  a.arOn[0].rotation.y = a.arOn[1].rotation.y = s.don * 0.9;
  // sürücü: kafa viraja bakar, kollar direksiyonu çevirir; bitişte kollar havada
  const bak = clamp(s.don * 1.5, -0.55, 0.55) + (a.v < 1 ? Math.sin(t * 0.9 + a.faz) * 0.35 * (1 - s.sev) : 0);
  s.bak += (bak - s.bak) * Math.min(1, dt * 5);
  a.arKafa.rotation.set(Math.sin(t * 2.2 + a.faz) * 0.03 - s.sev * 0.2 - (havada ? 0.18 : 0) + s.ivme * 0.003, s.bak, -s.bak * 0.22 + s.sev * Math.sin(t * 6.5 + a.faz) * 0.12);
  for (let i = 0; i < 2; i++) {
    const kg = a.arKol[i], yon = kg.userData.yon, el = Math.sin(t * 11 + i * 2.4 + a.faz);
    kg.rotation.x = lerp(0.22 + yon * s.don * 0.55 - (havada ? 0.25 : 0), -1.95 + el * 0.3, s.sev);
    kg.rotation.y = lerp(-yon * 0.28, yon * (0.45 + el * 0.12), s.sev);
  }
  // saç ve kulaklar hızla geriye savrulur
  s.sal += ((hiz * 0.6 + (havada ? 0.5 : 0)) - s.sal) * Math.min(1, dt * 6);
  for (let i = 0; i < a.arSallan.length; i++) {
    const sp = a.arSallan[i], u = sp.userData;
    sp.rotation.x = (s.sal + Math.sin(t * 13 + a.faz + i * 1.9) * 0.1 * (hiz + s.sev * 0.6)) * u.kx;
    sp.rotation.z = u.yon * (s.sal * 0.35 + s.sev * 0.2) - clamp(a.dv * 0.03, -0.3, 0.3) * u.kx;
  }
  if (a.arAlev && a.arAlev.visible) { const ic = a.arAlev.userData.ic, f = Math.sin(t * 71) * 0.5 + Math.sin(t * 43) * 0.5; ic.scale.set(0.58 + f * 0.08, 0.66 + f * 0.14, 0.58 + f * 0.08); }
  a.golge.position.set(x, 0.07, z); a.golge.rotation.z = -a.g.rotation.y; a.golge.scale.setScalar(1 - Math.min(0.45, y * 0.2));
  a.x = x; a.z = z; a.tx = p.tx; a.tz = p.tz;
}
