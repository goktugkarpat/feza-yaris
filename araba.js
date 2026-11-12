/* Arabalar ve sürücüler: araba(renk, renk2, tur) modeli kurar; arabaYerlestir(a, dt) her karede konum, yatış, teker dönüşü, gölge, sürücü canlandırması.
   a.yol = pist boyunca ilerleme (m), a.d = yanal konum, a.v = hız, a.dv = yanal hız, a.hop = zıplama sayacı. tur: feza | piril | bilbo | anne | baba
   Araba tipleri: ARABA_TIPLERI (kart, yaris, cip, roket, dondurma, unicorn, itfaiye, ejderha, ucak); araba(renk, renk2, tur, tip); arabaSok(a) eski modeli siler.
   Tipe özel gövdeler arTipGovde içinde; hareketli ekler (yele, kuyruk, dondurma, alev, kanat) a.arEk içinde ve arabaYerlestir canlandırır.
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
const arTomb = arYuzey(8, 4, arSuper(4));                       // yuvarlak köşeli kutu
const arK = new T.SphereGeometry(1, 8, 5), arM = new T.SphereGeometry(1, 6, 4);   // küçük ve minik parçalar için hafif küreler
const arYuzDetay = new T.SphereGeometry(1, 10, 6);
const arSil = new T.CylinderGeometry(1, 1, 1, 10), arKafaKure = new T.SphereGeometry(1, 16, 11);   // hafif silindir ve hayvan kafası              // yakından görünen yüz parçaları yumuşak kalır
const arHap = (r, u) => new T.CapsuleGeometry(r, u, 2, 7);       // Y boyunca hap
const arLastik = new T.TorusGeometry(0.3, 0.16, 5, 12);
const arLambaGeo = new T.SphereGeometry(1, 10, 6);
const arHalka = new T.TorusGeometry(1, 0.2, 4, 12);
const arInceHalka = new T.TorusGeometry(1, 0.07, 3, 12);
const arCivi = new T.OctahedronGeometry(1, 0);
const arCamurluk = new T.TorusGeometry(1, 0.095, 4, 9, Math.PI);
const arGulus = new T.TorusGeometry(1, 0.13, 4, 8, Math.PI);
const arSac = new T.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI * 0.57);
const arYildizGeo = (() => { const s = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.52 : 1, a = i / 10 * Math.PI * 2 + Math.PI / 2; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return new T.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.045, bevelSegments: 1, curveSegments: 1 }); })();
const arGovdeF = (() => { const sb = arSuper(3.2); return (u, w, o) => { sb(u, w, o); const z = o.z; let x = o.x * 0.9, y = o.y * 0.38; if (z > 0) { x *= 1 - 0.3 * z * z; if (y > 0) y *= 1 - 0.45 * Math.pow(z, 1.5); } else if (y > 0) y *= 1 + 0.22 * -z; o.set(x, y, z * 1.8); }; })();
const AR_TEN = 0xf6c9a4, AR_KOYU = 0x2b2f3a, AR_LEYLAK = 0xb79bea, AR_CIKO = 0x5b3a26;
const arInsanTen = (() => {
  const g = new T.SphereGeometry(1, 18, 12), p = g.attributes.position, c = [];
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
      for (const x of [-1, 1]) { arKat(y, arK, sac, x * 0.47, -0.1, 0.1, 0.1, 0.28, 0.15); arKat(y, arK, sac, x * 0.2, 0.33, 0.36, 0.2, 0.09, 0.1, -0.5, 0, -x * 0.35); }
      const t = sal(0, 0.12, -0.3, 0.75, 0), ty = arYapi(); arKat(ty, arTomb, sac, 0, -0.2, -0.13, 0.46, 0.3, 0.15); arKat(ty, arK, sac, -0.24, -0.45, -0.13, 0.19, 0.12, 0.13); arKat(ty, arK, sac, 0.24, -0.45, -0.13, 0.19, 0.12, 0.13); arKat(ty, arK, sac, 0, -0.48, -0.13, 0.2, 0.12, 0.13); arBitir(ty, t);
    } else {
      for (const x of [-1, 1]) arKat(y, arM, sac, x * 0.17, 0.15, 0.46, 0.085, 0.022, 0.03, 0, 0, -x * 0.12);
    }
  } else if (tur === 'piril') {
    arKat(y, arKafaKure, AR_LEYLAK, 0, 0, 0, 0.5);
    arKat(y, arK, 0xcdb8f5, 0, -0.11, 0.34, 0.33, 0.23, 0.3);
    for (const x of [-1, 1]) {
      arGoz(y, x * 0.2, 0.15, 0.39, 0.125, true, 0x35a852);
      arKat(y, arM, 0x7d62b8, x * 0.1, -0.03, 0.615, 0.028);
      arKat(y, G.koni, 0xffffff, x * 0.08, -0.3, 0.5, 0.04, 0.09, 0.04, Math.PI);
      arKat(y, arM, 0xe9a3d8, x * 0.33, -0.08, 0.36, 0.08, 0.05, 0.04);
    }
    { const t = sal(0, 0.2, -0.05, 0.55, 0), ty = arYapi(); t.userData.yukari = true;   // iki kulak tek parça
      for (const x of [-1, 1]) { arKat(ty, G.koni, 0x9fe08a, x * 0.62, 0.1, 0, 0.17, 0.46, 0.06, 0, 0, -x * 1.05); arKat(ty, G.koni, 0x6cc76a, x * 0.59, 0.09, 0.02, 0.09, 0.3, 0.05, 0, 0, -x * 1.05); }
      arBitir(ty, t); }
    arKat(y, arGulus, 0x7d62b8, 0, -0.17, 0.58, 0.15, 0.1, 0.1, 0.5, 0, Math.PI);
    for (let i = 0; i < 3; i++) arKat(y, arK, 0x2f8a4a, 0, 0.53 - i * i * 0.045, 0.2 - i * 0.27, 0.075, 0.2, 0.17, -0.25 - i * 0.45);
  } else if (tur === 'bilbo') {
    arKat(y, arKafaKure, AR_CIKO, 0, 0, 0, 0.5, 0.48, 0.5);
    arKat(y, arK, 0x9a7152, 0, -0.13, 0.37, 0.28, 0.21, 0.28);
    arKat(y, arK, 0x1e1410, 0, -0.04, 0.63, 0.105, 0.078, 0.07);
    { const t = sal(0, -0.2, 0.5, 0.45, 0), ty = arYapi(); t.userData.dil = true; arKat(ty, arK, 0xff7d93, 0, -0.1, 0, 0.085, 0.13, 0.035, 0.35); arKat(ty, arM, 0xe9627c, 0, -0.1, 0.03, 0.012, 0.09, 0.012, 0.35); arBitir(ty, t); }
    arKat(y, arGulus, 0x3a2418, 0, -0.2, 0.57, 0.12, 0.08, 0.08, 0.5, 0, Math.PI);
    for (const x of [-1, 1]) {
      arGoz(y, x * 0.19, 0.11, 0.42, 0.105, true, 0);
      arKat(y, arM, 0x9a7152, x * 0.2, 0.26, 0.4, 0.055, 0.03, 0.03);
    }
    { const t = sal(0, 0.3, -0.02, 1, 0), ty = arYapi(); for (const x of [-1, 1]) arKat(ty, arK, 0x432818, x * 0.48, -0.3, 0, 0.1, 0.36, 0.23, 0, 0, x * 0.15); arBitir(ty, t); }   // iki kulak tek parça
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
// ───────── seçilebilir araba tipleri ─────────
const arKoniGeo = new T.ConeGeometry(1, 1, 12); arKoniGeo.translate(0, 0.5, 0);
// Sıra = menüdeki sıra; renkler o arabanın Feza için varsayılan renkleri.
const ARABA_TIPLERI = [
  { id: 'kart', renk: 0xf2483a, renk2: 0xffd84a },
  { id: 'yaris', renk: 0x2b7de9, renk2: 0xffd84a },
  { id: 'cip', renk: 0x43b04c, renk2: 0xffa62b },
  { id: 'roket', renk: 0xf3f5fa, renk2: 0xf2483a },
  { id: 'dondurma', renk: 0xff9fc6, renk2: 0x9fe8d0 },
  { id: 'unicorn', renk: 0xfff4fb, renk2: 0xff8fc8 },
  { id: 'itfaiye', renk: 0xe5302a, renk2: 0xffd84a },
  { id: 'ejderha', renk: 0xb79bea, renk2: 0x5cc267 },
  { id: 'ucak', renk: 0xffcf33, renk2: 0xf2483a }
];
// ra/ro: arka/ön teker yarıçapı · ena/eno: lastik eni · yuk: gövdenin yükselmesi · yay: yaylanma katsayısı · sus1/sus2: kişisel süsün yeri [x, y, z, rx, ry]
const AR_TEKER = {
  kart: { ra: 0.5, ro: 0.45, ena: 1.5, eno: 1.3, yuk: 0, sus1: [0, 0.93, 0.95, -Math.PI / 2 + 0.15, 0], sus2: [0, 0.72, -1.87, 0, Math.PI] },
  yaris: { ra: 0.54, ro: 0.43, ena: 1.75, eno: 1.25, yuk: 0, sus1: [0, 0.915, 0.98, -Math.PI / 2 + 0.22, 0], sus2: [0, 0.8, -1.9, 0, Math.PI] },
  cip: { ra: 0.62, ro: 0.62, ena: 1.45, eno: 1.45, yuk: 0.24, yay: 2.4, sus1: [0, 0.995, 1.05, -Math.PI / 2 + 0.08, 0], sus2: [0, 0.92, -2.06, 0, Math.PI] },
  roket: { ra: 0.43, ro: 0.43, ena: 1.25, eno: 1.25, yuk: 0, sus1: null, sus2: [0, 1.075, -1.2, -Math.PI / 2 - 0.2, 0] },
  dondurma: { ra: 0.46, ro: 0.46, ena: 1.3, eno: 1.3, yuk: 0, jant: 0xfff1d6, sus1: [0, 0.975, 0.98, -Math.PI / 2 + 0.12, 0], sus2: [0, 0.66, -1.855, 0, Math.PI] },
  unicorn: { ra: 0.47, ro: 0.45, ena: 1.25, eno: 1.2, yuk: 0, jant: 0xffe9a8, sus1: null, sus2: [0, 1.0, -1.22, -Math.PI / 2 - 0.3, 0] },
  itfaiye: { ra: 0.52, ro: 0.52, ena: 1.4, eno: 1.4, yuk: 0, jant: 0xffe9a8, sus1: [0, 0.995, 1.05, -Math.PI / 2 + 0.08, 0], sus2: [0, 0.74, -1.845, 0, Math.PI] },
  ejderha: { ra: 0.47, ro: 0.45, ena: 1.25, eno: 1.2, yuk: 0, jant: 0xdff5c8, sus1: null, sus2: [0, 0.6, -1.71, 0.12, Math.PI] },
  ucak: { ra: 0.43, ro: 0.43, ena: 1.2, eno: 1.2, yuk: 0, sus1: [0, 1.0, 1.0, -Math.PI / 2 + 0.2, 0], sus2: null }
};
const arTipF = (() => {
  const s3 = arSuper(3), s5 = arSuper(5), s22 = arSuper(2.2), s4 = arSuper(4), s26 = arSuper(2.6);
  return {
    yaris: (u, w, o) => { s3(u, w, o); const z = o.z; let x = o.x * 0.76, y = o.y * 0.3; if (z > 0) { x *= 1 - 0.6 * z * z; y *= 1 - 0.45 * z; y -= 0.1 * z * z; } else if (y > 0) y *= 1 + 0.32 * -z; o.set(x, y, z * 1.85); },
    cip: (u, w, o) => { s5(u, w, o); const z = o.z; let y = o.y * 0.42; if (z > 0 && y > 0) y *= 1 - 0.22 * z * z; o.set(o.x * 0.8, y, z * 1.76); },
    roket: (u, w, o) => { s22(u, w, o); const z = o.z, k = z > 0 ? 1 - 0.3 * z * z * z : 1 + 0.55 * z * z; o.set(o.x * 0.8 * k, o.y * 0.46 * k, z * 1.9); },
    dondurma: (u, w, o) => { s4(u, w, o); const z = o.z; let y = o.y * 0.44; if (z > 0 && y > 0) y *= 1 - 0.3 * Math.pow(z, 1.5); o.set(o.x * 0.9, y, z * 1.78); },
    unicorn: (u, w, o) => { s26(u, w, o); const z = o.z; let y = o.y * 0.42; if (z < 0 && y > 0) y *= 1 + 0.1 * -z; o.set(o.x * 0.88, y, z * 1.8); },
    itfaiye: (u, w, o) => { s5(u, w, o); const z = o.z; let y = o.y * 0.42; if (z > 0 && y > 0) y *= 1 - 0.12 * z * z; o.set(o.x * 0.84, y, z * 1.78); },
    ejderha: (u, w, o) => { s26(u, w, o); const z = o.z; let x = o.x * 0.88; if (z < 0) x *= 1 - 0.24 * z * z; o.set(x, o.y * 0.42, z * 1.8); },
    ucak: (u, w, o) => { s22(u, w, o); const z = o.z, k = z > 0 ? 1 - 0.22 * z * z * z : 1 - 0.42 * z * z; o.set(o.x * 0.8 * k, o.y * 0.46 * k + (z < 0 ? 0.13 * z * z : 0), z * 1.9); }
  };
})();
const arAlevMat = new T.MeshBasicMaterial({ color: 0xffb02e });
function arTipGovde(y, ek, tip, renk, renk2, alt, tkr) {   // kart dışındaki gövdeler; hareketli parçalar ek[] içine (userData.ek = tür)
  const PI = Math.PI, gri = 0xc9cfd9, yuk = tkr.yuk;
  const far = (x, yy, z, r) => { arKat(y, arK, 0xfff3b0, x, yy, z, r, r * 0.95, r * 0.7); arKat(y, arM, 0xffffff, x, yy + 0.01, z + r * 0.42, r * 0.5, r * 0.47, r * 0.4); };
  const stop = (x, yy, z, r) => { arKat(y, arK, alt, x, yy - 0.02, z + 0.04, r * 1.4, r * 1.15, 0.05); arKat(y, arM, 0xff5a4a, x, yy, z - 0.01, r, r * 0.66, 0.04); arKat(y, arM, 0xffc9a5, x, yy + r * 0.25, z - 0.045, r * 0.6, r * 0.15, 0.012); };
  const hareketli = (tr, px, py, pz, kur) => { const gr = new T.Group(), yy = arYapi(); gr.position.set(px, py, pz); gr.userData.ek = tr; kur(yy); arBitir(yy, gr, arBoya); ek.push(gr); return gr; };
  const camurluk = (renkC, kalin) => { for (const x of [-1, 1]) for (const zz of [-1, 1]) { const r = (zz < 0 ? tkr.ra : tkr.ro) + 0.07; arKat(y, arCamurluk, renkC, x * 0.96, (zz < 0 ? tkr.ra : tkr.ro) - yuk, zz * 1.05, r, r, r * (kalin || 1), 0, PI / 2); } };
  for (const z of [-1, 1]) arKat(y, G.sil, AR_KOYU, 0, (z < 0 ? tkr.ra : tkr.ro) - yuk, z * 1.05, 0.06, 1.8, 0.06, 0, 0, PI / 2);   // dingiller
  if (tip === 'yaris') {
    // alçak, sivri burunlu yarış arabası: ön kanat, yan kutular, iki katlı arka kanat
    arKat(y, arYuzey(24, 12, arTipF.yaris, i => (i === 5 || i === 6) ? renk2 : i > 12 ? alt : renk), null, 0, 0.68, -0.05, 1, 1, 1);
    arKat(y, arTomb, renk2, 0, 0.34, 1.74, 1.02, 0.04, 0.2);
    arKat(y, arK, renk, 0, 0.43, 1.7, 0.17, 0.12, 0.26);
    for (const x of [-1, 1]) {
      arKat(y, arTomb, renk, x * 1.02, 0.43, 1.74, 0.035, 0.13, 0.24);
      arKat(y, arTomb, renk, x * 0.6, 0.6, -0.3, 0.24, 0.2, 0.78);
      arKat(y, arK, AR_KOYU, x * 0.6, 0.62, 0.45, 0.17, 0.13, 0.07);
      arKat(y, arTomb, renk2, x * 0.845, 0.62, -0.3, 0.012, 0.07, 0.6);
      arKat(y, G.kutu, AR_KOYU, x * 0.34, 1.22, -1.62, 0.07, 0.55, 0.14, -0.15);
      arKat(y, arTomb, renk, x * 0.98, 1.42, -1.68, 0.04, 0.24, 0.34);
      arKat(y, G.sil, gri, x * 0.42, 0.56, -1.86, 0.09, 0.3, 0.09, PI / 2);
      arKat(y, G.sil, 0x23262e, x * 0.42, 0.56, -1.875, 0.06, 0.3, 0.06, PI / 2);
      far(x * 0.27, 0.74, 1.18, 0.085); stop(x * 0.62, 0.84, -1.86, 0.085);
    }
    arKat(y, arTomb, renk2, 0, 1.5, -1.68, 0.96, 0.045, 0.27, 0.12);
    arKat(y, arTomb, renk, 0, 1.33, -1.76, 0.96, 0.03, 0.15, 0.12);
    arKat(y, arK, renk, 0, 1.12, -1.2, 0.22, 0.26, 0.5);
  } else if (tip === 'cip') {
    // yüksek arazi aracı: kocaman tekerler, koruma demiri, tepe lambaları, arkada yedek teker
    arKat(y, arYuzey(24, 12, arTipF.cip, i => (i > 12 || i === 0 || i === 12) ? alt : renk), null, 0, 0.6, -0.05, 1, 1, 1);
    for (const x of [-1, 1]) {
      arKat(y, arHap(0.06, 0.34), gri, x * 0.36, 0.68, 1.8, 1, 1, 1);
      arKat(y, arHap(0.065, 0.6), gri, x * 0.92, 0.33, 0, 1, 1, 1, PI / 2);
      far(x * 0.5, 0.8, 1.66, 0.15); stop(x * 0.66, 0.66, -1.8, 0.09);
      arKat(y, arTomb, renk2, x * 0.808, 0.72, 0, 0.012, 0.05, 0.36);
      for (const xx of [0.17, 0.5]) { arKat(y, arK, renk2, x * xx, 2.07 - xx * xx * 0.72, -1.0, 0.13, 0.13, 0.13); arKat(y, arK, 0xfff3b0, x * xx, 2.07 - xx * xx * 0.72, -0.93, 0.1, 0.1, 0.08); }
    }
    camurluk(alt, 3.4);
    arKat(y, arHap(0.07, 1.25), gri, 0, 0.52, 1.8, 1, 1, 1, 0, 0, PI / 2);
    arKat(y, arHap(0.07, 1.05), gri, 0, 0.84, 1.8, 1, 1, 1, 0, 0, PI / 2);
    arKat(y, arCamurluk, AR_KOYU, 0, 1.0, -1.0, 0.7, 1.0, 1.5);                                     // koruma demiri (kafanın çevresinde kemer)
    arKat(y, arTomb, renk2, 0, 1.03, 0.95, 0.12, 0.012, 0.62);
    arKat(y, arLastik, AR_KOYU, 0, 0.92, -1.9, 1.2, 1.2, 1.25);                                   // yedek teker
    for (let q = 0; q < 8; q++) { const an = q * PI / 4; arKat(y, G.kutu, 0x414954, Math.cos(an) * 0.53, 0.92 + Math.sin(an) * 0.53, -1.9, 0.07, 0.15, 0.4, 0, 0, an + PI / 2); }
    arKat(y, G.sil, 0xeef1f6, 0, 0.92, -1.92, 0.3, 0.3, 0.3, PI / 2);
    arKat(y, arHap(0.09, 1.3), AR_KOYU, 0, 0.36, -1.82, 1, 1, 1, 0, 0, PI / 2);
  } else if (tip === 'roket') {
    // roket: kırmızı burun, yuvarlak pencereler, kanatçıklar, arkada egzoz ve hep yanan minik alev
    arKat(y, arYuzey(24, 12, arTipF.roket, (i, j) => (j >= 9 || j === 2) ? renk2 : i > 12 ? alt : renk), null, 0, 0.6, -0.05, 1, 1, 1);
    arKat(y, arK, 0xffd84a, 0, 0.6, 1.84, 0.1, 0.1, 0.12);
    for (const x of [-1, 1]) {
      arKat(y, arTomb, renk2, x * 1.02, 0.6, -1.4, 0.36, 0.045, 0.5, 0, x * 0.5, 0);               // yan kanatçıklar
      arKat(y, arK, 0xffd84a, x * 1.3, 0.6, -1.72, 0.09, 0.09, 0.14);
      arKat(y, arTomb, renk2, x * 0.6, 1.2, -1.62, 0.045, 0.36, 0.4, -0.45, 0, -x * 0.55);         // üst kanatçıklar
      arKat(y, arK, 0xffd84a, x * 0.82, 1.52, -1.86, 0.08, 0.08, 0.12);
      arKat(y, arInceHalka, gri, x * 0.755, 0.72, 0.62, 0.19, 0.19, 0.19, 0, PI / 2 - x * 0.1);
      arKat(y, arK, 0x8fd8ff, x * 0.74, 0.72, 0.62, 0.03, 0.17, 0.17, 0, -x * 0.1);
      arKat(y, arM, 0xffffff, x * 0.765, 0.78, 0.67, 0.012, 0.05, 0.04);
      far(x * 0.3, 0.82, 1.22, 0.085);
    }
    camurluk(renk2, 1.3);
    arKat(y, G.sil, gri, 0, 0.6, -1.93, 0.44, 0.3, 0.44, PI / 2);
    arKat(y, arInceHalka, 0xeef1f6, 0, 0.6, -2.08, 0.44, 0.44, 0.44);
    arKat(y, G.sil, 0x23262e, 0, 0.6, -1.945, 0.36, 0.3, 0.36, PI / 2);
    const al = new T.Mesh(arKoniGeo, arAlevMat); al.position.set(0, 0.6, -2.02); al.rotation.x = -PI / 2; al.scale.set(0.26, 0.4, 0.26); al.userData.ek = 'alev'; ek.push(al);
  } else if (tip === 'dondurma') {
    // dondurma arabası: külah rengi alt, şeritli tente, arkada kocaman sallanan dondurma
    const kulah = 0xe2a95f, kulahK = 0xc98a45;
    arKat(y, arYuzey(24, 12, arTipF.dondurma, (i, j) => (i > 12 || i === 0 || i === 12) ? kulah : (j % 2 ? 0xfffaf2 : renk)), null, 0, 0.58, -0.05, 1, 1, 1);
    arKat(y, arHap(0.11, 1.3), kulahK, 0, 0.4, 1.76, 1, 1, 1, 0, 0, PI / 2);
    arKat(y, arHap(0.1, 1.3), kulahK, 0, 0.4, -1.84, 1, 1, 1, 0, 0, PI / 2);
    for (const x of [-1, 1]) { far(x * 0.5, 0.7, 1.64, 0.14); stop(x * 0.66, 0.84, -1.8, 0.09); arKat(y, arHap(0.05, 1.5), renk2, x * 0.905, 0.6, 0, 1, 1, 1, PI / 2); }
    camurluk(renk2, 1.5);
    arKat(y, G.koni, kulah, 0, 0.99, 1.5, 0.1, 0.26, 0.1, PI);                                     // burunda minik külah
    arKat(y, arK, renk2, 0, 1.17, 1.5, 0.13, 0.12, 0.13); arKat(y, arM, 0xf2483a, 0, 1.3, 1.5, 0.045);
    // İki külah arkada, sürücünün iki yanında durur: arkadan bakınca kafa arada açıkta kalır.
    hareketli('top', 0, 0.9, -1.3, yy => {
      const sr = [0xffd84a, 0x6fc3ff, 0xffffff, 0xff6f91, 0x8fe07a];
      for (const x of [-1, 1]) {
        const r1 = x < 0 ? renk : renk2, r2 = x < 0 ? renk2 : renk;
        kukla.position.set(x * 0.74, 0, 0); kukla.rotation.set(0, 0, -x * 0.16); kukla.scale.setScalar(0.7); kukla.updateMatrix(); yy.taban = kukla.matrix.clone();
        arKat(yy, arSil, kulah, 0, 0.06, 0, 0.5, 0.24, 0.46);
        arKat(yy, arInceHalka, kulahK, 0, 0.18, 0, 0.5, 0.46, 0.5, PI / 2);
        arKat(yy, arK, r1, 0, 0.4, 0, 0.56, 0.42, 0.52);
        for (let i = 0; i < 5; i++) { const an = i / 5 * PI * 2 + 0.3; arKat(yy, arM, r1, Math.cos(an) * 0.47, 0.15 - (i % 2) * 0.07, Math.sin(an) * 0.43, 0.13, 0.16 + (i % 2) * 0.06, 0.13); }
        arKat(yy, arK, r2, 0.02, 0.82, 0, 0.36, 0.3, 0.35);
        arKat(yy, arM, 0xf2483a, 0, 1.13, 0, 0.11);
        for (let i = 0; i < 5; i++) { const an = i * 2.4 + x, yk = 0.5 + (i % 3) * 0.08, rr = 0.52 * Math.sqrt(Math.max(0, 1 - Math.pow((yk - 0.4) / 0.42, 2))); arKat(yy, G.kutu, sr[i % 5], Math.cos(an) * rr * 1.08, yk, Math.sin(an) * rr * 1.0, 0.1, 0.035, 0.035, 0, -an + i, 0.6); }
      }
      yy.taban = null;
    });
  } else if (tip === 'unicorn') {
    // tek boynuzlu at: önde baş ve altın boynuz, savrulan gökkuşağı yele, arkada kuyruk
    const yele = [0xff8fb1, 0xffc06a, 0xfff07a, 0x9fe89a, 0x8fd0ff, 0xc7a5ff], altin = 0xffd23e;
    arKat(y, arYuzey(24, 12, arTipF.unicorn, i => i > 12 ? alt : renk), null, 0, 0.6, -0.05, 1, 1, 1);
    arKat(y, arHap(0.27, 0.72), renk, 0, 1.5, 1.2, 1, 1, 1, 0.16);                                   // uzun boyun: baş sürücünün üstünden görünür
    for (let i = 0; i < 6; i++) { const yh = 2.46 - i * 0.2; arKat(y, arK, yele[i], (i % 2 ? 0.045 : -0.045), yh, 0.97 + (yh - 1) * 0.13 + (i === 0 ? 0.12 : 0), 0.21, 0.17, 0.2, 0.3); }   // gökkuşağı yele ensede (arkadan görünür)
    arTaban(y, 0, 0.5, -0.22, 0, 0, 0);
    arKat(y, arK, renk, 0, 1.62, 1.6, 0.31, 0.31, 0.4, 0.5);                                       // baş
    arKat(y, arK, 0xffd3e6, 0, 1.47, 1.88, 0.21, 0.18, 0.21, 0.4);
    arKat(y, G.koni, altin, 0, 2.12, 1.62, 0.08, 0.52, 0.08, 0.3);                                 // boynuz
    for (let i = 0; i < 3; i++) arKat(y, arInceHalka, 0xfff3b0, 0, 1.96 + i * 0.12, 1.57 + i * 0.037, 0.075 - i * 0.02, 0.075 - i * 0.02, 0.12, PI / 2 + 0.3);
    for (const x of [-1, 1]) {
      arKat(y, G.koni, renk, x * 0.21, 1.95, 1.47, 0.095, 0.3, 0.06, 0.2, 0, -x * 0.3);            // kulaklar
      arKat(y, G.koni, 0xffb3d4, x * 0.21, 1.94, 1.495, 0.055, 0.2, 0.04, 0.2, 0, -x * 0.3);
      arKat(y, arM, 0x2a2230, x * 0.275, 1.68, 1.7, 0.035, 0.085, 0.075); arKat(y, arM, 0xffffff, x * 0.3, 1.72, 1.73, 0.015, 0.028, 0.028);
      arKat(y, arM, 0xff9fc6, x * 0.24, 1.53, 1.82, 0.035, 0.06, 0.07);
      arKat(y, arM, 0xd9769f, x * 0.08, 1.46, 2.07, 0.022, 0.03, 0.02);
    }
    y.taban = null;
    for (const x of [-1, 1]) {
      stop(x * 0.6, 0.72, -1.8, 0.09);
      for (let i = 0; i < 3; i++) arKat(y, arK, i === 1 ? 0xffe3f1 : 0xffffff, x * (0.93 + i * 0.04), 1.08 - i * 0.1, -0.5 - i * 0.2, 0.06, 0.17 - i * 0.02, 0.5 - i * 0.07, 0.5 + i * 0.16, 0, x * 0.4);   // minik kanatlar
    }
    camurluk(renk2, 1.5);
    arKat(y, arHap(0.1, 0.9), renk2, 0, 0.42, -1.8, 1, 1, 1, 0, 0, PI / 2);
    arKat(y, arHalka, renk2, 0, 1.02, 1.12, 0.3, 0.3, 0.3, PI / 2 + 0.17);                         // tasma
    arKat(y, arYildizGeo, altin, 0, 0.95, 1.46, 0.1, 0.1, 0.1, 0.3);
    hareketli('kuyruk', 0, 0.98, -1.72, yy => { for (let i = 0; i < 6; i++) arKat(yy, arK, yele[i], Math.sin(i * 1.9) * 0.06, 0.06 + i * 0.16 - i * i * 0.008, -0.08 - i * 0.09 - i * i * 0.014, 0.2 - i * 0.015, 0.18, 0.21 - i * 0.01, -0.25 - i * 0.16); arKat(yy, arK, renk2, 0, -0.03, 0, 0.19, 0.13, 0.17); });   // kabarık, yukarı kıvrık kuyruk
  } else if (tip === 'itfaiye') {
    // itfaiye: köşeli kırmızı gövde, beyaz kuşak, sağ yanda merdiven, solda hortum makarası, tepede yanıp sönen mavi lamba
    const beyaz = 0xffffff;
    arKat(y, arYuzey(24, 12, arTipF.itfaiye, i => i > 12 ? alt : (i === 0 || i === 12) ? beyaz : renk), null, 0, 0.6, -0.05, 1, 1, 1);
    arKat(y, arHap(0.1, 1.35), gri, 0, 0.4, 1.79, 1, 1, 1, 0, 0, PI / 2);
    arKat(y, arHap(0.09, 1.3), gri, 0, 0.4, -1.85, 1, 1, 1, 0, 0, PI / 2);
    arKat(y, arTomb, 0x39424f, 0, 0.7, 1.72, 0.42, 0.11, 0.04);                                    // ızgara
    for (const x of [-1, 1]) { far(x * 0.6, 0.74, 1.66, 0.14); stop(x * 0.66, 0.78, -1.8, 0.09); arKat(y, arM, 0x3aa0ff, x * 0.6, 0.97, 1.56, 0.075, 0.05, 0.075); }
    camurluk(renk2, 2.2);
    arKat(y, arTomb, renk2, 0, 1.03, 0.95, 0.12, 0.012, 0.62);
    arTaban(y, 0.82, 1.5, -0.3, -0.24, 0, 0);                                                      // merdiven: arkada alçak, öne doğru yükselir (arkadan basamakları görünür)
    for (const x of [-1, 1]) arKat(y, G.kutu, gri, x * 0.23, 0, 0, 0.07, 0.08, 3.1);
    for (let i = 0; i < 8; i++) arKat(y, G.kutu, 0xeef1f6, 0, 0, -1.4 + i * 0.4, 0.44, 0.05, 0.08);
    y.taban = null;
    arKat(y, G.kutu, AR_KOYU, 0.82, 1.42, 0.9, 0.09, 0.74, 0.09); arKat(y, G.kutu, AR_KOYU, 0.82, 1.1, -1.5, 0.09, 0.2, 0.09);
    arKat(y, arLastik, renk2, -0.76, 1.3, -1.52, 1.0, 1.0, 1.5); arKat(y, arSil, renk, -0.76, 1.3, -1.52, 0.2, 0.3, 0.2, PI / 2);   // hortum makarası
    arKat(y, arM, gri, -0.76, 1.3, -1.69, 0.09, 0.09, 0.05); arKat(y, G.kutu, AR_KOYU, -0.76, 1.08, -1.5, 0.3, 0.14, 0.12);
    arKat(y, arCamurluk, gri, 0, 1.0, -1.0, 0.62, 0.95, 1.4);                                      // lamba kemeri
    arKat(y, arSil, AR_KOYU, 0, 1.99, -1.0, 0.21, 0.08, 0.21);
    const lm = new T.Mesh(arLambaGeo, new T.MeshBasicMaterial({ color: 0x2f8dff })); lm.position.set(0, 2.1, -1.0); lm.scale.set(0.19, 0.24, 0.19); lm.userData.ek = 'lamba'; ek.push(lm);
  } else if (tip === 'ejderha') {
    // sevimli ejderha: önde gülen baş, sırtta yeşil ibik sırası, yanlarda kanatçıklar, arkada sallanan kuyruk
    const acik = 0xdccdfa, krem = 0xfff3d6;
    arKat(y, arYuzey(24, 12, arTipF.ejderha, i => i > 12 ? acik : renk), null, 0, 0.6, -0.05, 1, 1, 1);
    arKat(y, arK, renk, 0, 1.0, 1.42, 0.44, 0.38, 0.46);                                           // baş
    arKat(y, arK, acik, 0, 0.9, 1.78, 0.33, 0.24, 0.27);                                           // burun
    arKat(y, arGulus, 0x7d62b8, 0, 0.88, 1.96, 0.17, 0.1, 0.1, 0.3, 0, PI);
    for (const x of [-1, 1]) {
      arKat(y, arM, 0x7d62b8, x * 0.11, 0.99, 2.02, 0.03);
      arKat(y, arK, 0xffffff, x * 0.22, 1.2, 1.7, 0.13, 0.15, 0.1); arKat(y, arM, 0x35a852, x * 0.225, 1.2, 1.77, 0.085, 0.1, 0.06); arKat(y, arM, 0x2a2230, x * 0.23, 1.2, 1.81, 0.05, 0.065, 0.04);
      arKat(y, G.koni, krem, x * 0.22, 1.47, 1.28, 0.08, 0.26, 0.08, -0.35, 0, -x * 0.3);          // boynuzcuklar
      arKat(y, G.koni, renk2, x * 0.5, 1.12, 1.3, 0.14, 0.34, 0.05, 0, 0, -x * 1.1);               // kulak yüzgeçleri
      arKat(y, arM, 0xe9a3d8, x * 0.34, 0.98, 1.66, 0.08, 0.05, 0.05);
      // kanatçıklar: yanlarda, yukarı ve geriye açık
      arKat(y, arK, renk, x * 1.0, 1.12, -0.72, 0.1, 0.34, 0.12, 0, 0, -x * 0.5);
      for (let i = 0; i < 3; i++) arKat(y, G.koni, i === 1 ? 0x8fd87a : renk2, x * (1.2 + i * 0.1), 1.52 - i * 0.12, -0.75 - i * 0.24, 0.27, 0.66 - i * 0.1, 0.05, -0.5 - i * 0.35, 0, -x * (0.75 + i * 0.12));
      stop(x * 0.56, 0.74, -1.62, 0.085);
    }
    camurluk(renk2, 1.5);
    for (let i = 0; i < 4; i++) arKat(y, arKoniGeo, renk2, 0, 0.99 - i * i * 0.012, -1.0 - i * 0.24, 0.13, 0.34 - i * 0.03, 0.15, -0.3);   // sırt ibikleri
    hareketli('kuyruk', 0, 0.86, -1.66, yy => {
      for (let i = 0; i < 6; i++) arKat(yy, arK, i % 2 ? renk : acik, 0, 0.02 + i * 0.05 + i * i * 0.022, -0.08 - i * 0.17, 0.25 - i * 0.03, 0.23 - i * 0.027, 0.24 - i * 0.02);
      for (let i = 0; i < 4; i++) arKat(yy, arKoniGeo, renk2, 0, 0.2 + i * 0.05 + i * i * 0.022, -0.1 - i * 0.17, 0.09, 0.24 - i * 0.03, 0.11, -0.5);
      arKat(yy, G.koni, renk2, 0, 1.0, -1.08, 0.26, 0.46, 0.09, -0.9);                             // kuyruk ucunda yaprak
    });
  } else if (tip === 'ucak') {
    // küçük uçak-araba: yuvarlak gövde, iki yanda kanat, arkada kuyruk, burunda dönen pervane
    arKat(y, arYuzey(24, 12, arTipF.ucak, (i, j) => j >= 10 ? renk2 : i > 12 ? alt : (i === 5 || i === 6) ? renk2 : renk), null, 0, 0.6, -0.05, 1, 1, 1);
    for (const x of [-1, 1]) {
      arKat(y, arTomb, renk, x * 1.2, 1.02, 0.2, 0.58, 0.05, 0.42, 0, -x * 0.1, x * 0.08);         // kanat
      arKat(y, arTomb, renk2, x * 1.7, 1.065, 0.15, 0.1, 0.055, 0.4, 0, -x * 0.1, x * 0.08);
      arKat(y, arK, 0xffffff, x * 1.22, 1.075, 0.2, 0.2, 0.02, 0.2, 0, 0, x * 0.08); arKat(y, arM, 0x2b7de9, x * 1.22, 1.09, 0.2, 0.12, 0.02, 0.12, 0, 0, x * 0.08);
      arKat(y, G.kutu, AR_KOYU, x * 0.97, 0.9, 0.55, 0.05, 0.3, 0.07, 0.3); arKat(y, G.kutu, AR_KOYU, x * 0.97, 0.9, -0.1, 0.05, 0.3, 0.07, -0.3);
      arKat(y, arTomb, renk, x * 0.48, 0.98, -1.78, 0.42, 0.04, 0.2, 0, -x * 0.12, 0);             // yatay kuyruk
      arKat(y, arTomb, renk2, x * 0.86, 0.985, -1.84, 0.07, 0.045, 0.19, 0, -x * 0.12, 0);
      far(x * 0.28, 0.82, 1.2, 0.085);
    }
    arKat(y, arTomb, renk2, 0, 1.34, -1.8, 0.05, 0.42, 0.27, -0.28);                               // dikey kuyruk
    arKat(y, arTomb, renk, 0, 1.3, -1.74, 0.056, 0.2, 0.13, -0.28);
    arKat(y, arSil, gri, 0, 0.6, 1.86, 0.2, 0.1, 0.2, PI / 2);
    hareketli('pervane', 0, 0.6, 1.93, yy => {
      arKat(yy, arKoniGeo, renk2, 0, 0, 0, 0.17, 0.3, 0.17, PI / 2);
      for (let i = 0; i < 3; i++) { const an = i * PI * 2 / 3; arKat(yy, arTomb, 0x4a5260, -Math.sin(an) * 0.38, Math.cos(an) * 0.38, 0.03, 0.1, 0.36, 0.025, 0, 0, an); arKat(yy, arM, 0xffd84a, -Math.sin(an) * 0.7, Math.cos(an) * 0.7, 0.035, 0.085, 0.06, 0.028, 0, 0, an); }
    });
  }
}
function araba(renk, renk2, tur, tip) {   // öne +Z; tip: ARABA_TIPLERI içindeki id (verilmezse 'kart')
  tip = AR_TEKER[tip] ? tip : 'kart';
  const tkr = AR_TEKER[tip], yuk = tkr.yuk, ek = [];
  const g = new T.Group(), govde = new T.Group(); g.rotation.order = 'YXZ'; g.add(govde);
  const y = arYapi(), alt = arKoyult(renk, 0.72), gri = 0xc9cfd9;
  const aile = tur === 'anne' || tur === 'baba', arazi = tip === 'cip' || (tip === 'kart' && (tur === 'bilbo' || tur === 'baba'));
  if (tip !== 'kart') arTipGovde(y, ek, tip, renk, renk2, alt, tkr); else {
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
  }
  arKat(y, arHalka, AR_KOYU, 0, 0.985, -0.22, 0.5, 0.62, 0.45, Math.PI / 2);                       // kabin kenarı
  arKat(y, arTomb, AR_KOYU, 0, 1.06, -0.72, 0.45, 0.33, 0.12, -0.12);                               // koltuk (kafanın altında kalır)
  arKat(y, arTomb, renk2, 0, 1.06, -0.85, 0.38, 0.26, 0.03, -0.12);
  arKat(y, arTomb, renk, 0, 0.97, 0.66, 0.4, 0.15, 0.2);                                            // ön kaput çıkıntısı
  arKat(y, G.sil, AR_KOYU, 0, 1.05, 0.52, 0.035, 0.3, 0.035, 0.9);                                  // direksiyon
  // Renk kadar siluet de kişisel: alçak spor kanat, yapraklar, arazi tamponu, yuvarlak aile aracı.
  if (tip !== 'kart') { /* süsler arTipGovde içinde */ } else if (tur === 'feza') {
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
    { const kn = new T.Group(), ky = arYapi(); kn.position.set(0, 1.3, -0.47); kn.userData.ek = 'kanat';   // minik kanatlar (çırpar)
      for (const x of [-1, 1]) { arKat(ky, G.koni, 0x2f8a4a, x * 0.45, 0.14, -0.04, 0.2, 0.58, 0.045, -0.5, 0, -x * 0.9); arKat(ky, G.koni, 0x8fd87a, x * 0.43, 0.1, -0.075, 0.12, 0.4, 0.03, -0.5, 0, -x * 0.9); }
      arBitir(ky, kn); ek.push(kn); }
    if (tip === 'kart') for (let i = 0; i < 3; i++) arKat(y, arK, 0x2f8a4a, 0, 1.08 - i * 0.03, -1.05 - i * 0.26, 0.05, 0.16 - i * 0.02, 0.14);   // arabada ibik
  } else if (tur === 'bilbo') {
    arKat(y, arHalka, 0xe8433a, 0, 1.36, -0.24, 0.27, 0.27, 0.3, Math.PI / 2 - 0.15);
    arKat(y, arM, 0xffd23e, 0, 1.3, 0.04, 0.06, 0.06, 0.03);
    arKat(y, arK, 0x9a7152, 0, 1.08, -0.1, 0.24, 0.32, 0.18);
  } else {
    arKat(y, arHalka, tur === 'baba' ? 0xffffff : 0xffe07a, 0, 1.4, -0.24, 0.2, 0.2, 0.25, Math.PI / 2 - 0.15);   // yaka
  }
  // süs: burunda (yukarı bakar) ve arkada (geriye bakar)
  if (tkr.sus1) { arTaban(y, tkr.sus1[0], tkr.sus1[1], tkr.sus1[2], tkr.sus1[3], tkr.sus1[4], 0); arSus(y, tur); }
  if (tkr.sus2) { arTaban(y, tkr.sus2[0], tkr.sus2[1], tkr.sus2[2], tkr.sus2[3], tkr.sus2[4], 0); arSus(y, tur); }
  if (tur === 'feza' && tip === 'kart') for (const x of [-1, 1]) { arTaban(y, x * 1.055, 1.4, -1.6, 0, x * Math.PI / 2, 0); arKat(y, arYildizGeo, 0xffc400, 0, 0, -0.02, 0.15, 0.15, 0.15); }
  y.taban = null;
  arBitir(y, govde, arBoya);
  for (const e of ek) govde.add(e);
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
    const r = z < 0 ? tkr.ra : tkr.ro, s = r / 0.46, en = z < 0 ? tkr.ena : tkr.eno, of = Math.max(0, 0.16 * s * en - 0.26), d = new T.Group(), t = new T.Group(), ty = arYapi();
    d.position.set(x * 0.97, r, z * 1.05); g.add(d); d.add(t); t.userData.r = r;
    arKat(ty, arLastik, AR_KOYU, 0, 0, 0, s, s, s * en, 0, Math.PI / 2);
    arKat(ty, arSil, tkr.jant || 0xeef1f6, 0, 0, 0, 0.21 * s, 0.4 + of * 2, 0.21 * s, 0, 0, Math.PI / 2);
    arKat(ty, arM, renk2 === 0xffffff ? renk : renk2, x * (0.2 + of), 0, 0, 0.05, 0.1 * s, 0.1 * s);
    for (let q = 0; q < 3; q++) arKat(ty, G.kutu, 0x9aa3b0, x * (0.203 + of), 0, 0, 0.012, 0.38 * s, 0.06, q * Math.PI / 3);
    arKat(ty, arInceHalka, 0xf0e9db, x * (0.223 + of), 0, 0, 0.235 * s, 0.235 * s, 0.235 * s, 0, Math.PI / 2);
    // Seyrek kabartma dişler: ayrı cisim/çizim olmadan lastiğin dönüşünü okunur kılar.
    for (let q = 0; q < 8; q++) {
      const an = q * Math.PI * 2 / 8;
      arKat(ty, G.kutu, arazi ? 0x414954 : 0x363c47, 0, Math.cos(an) * (r - 0.025), Math.sin(an) * (r - 0.025), (arazi ? 0.4 : 0.3) * Math.max(1, en / 1.4), 0.052, 0.15, an);
    }
    arBitir(ty, t); teker.push(t); if (z > 0) on.push(d);
  }
  const golge = new T.Mesh(new T.PlaneGeometry(3.4, 4.6), golgeMat.clone()); golge.rotation.x = -Math.PI / 2; golge.position.y = 0.07; golge.renderOrder = 2; scene.add(golge);
  scene.add(g);
  return { g, govde, teker, golge, arTip: tip, arEk: ek, arYuk: yuk, arYayK: tkr.yay || 1, arOn: on, arKol: kol, arKafa: kf, arGoz: kf.userData.gozMesh, arSallan: kf.userData.sallan, arDireksiyon: direksiyon, arAlev: null,
    ar: { t: 0, v0: 0, ivme: 0, don: 0, egx: 0, egz: 0, sev: 0, sal: 0, bak: 0, yay: 0, ayak: new Float32Array(4), havada: false, inis: 9, sek: 9, tok: 9, mer: 9 } };
}
function roketAlevi(a) {   // iç içe iki koni; oyun.js görünürlüğü ve ölçeği ayarlar, içteki koni arabaYerlestir içinde titreşir
  const m = new T.Group(); m.position.set(0, 0.58, -1.9); m.rotation.x = -Math.PI / 2;
  const ic = new T.Mesh(arKoniGeo, new T.MeshBasicMaterial({ color: 0xfff6b0 })); ic.scale.set(0.58, 0.66, 0.58); m.add(ic);
  const dis = new T.Mesh(arKoniGeo, new T.MeshBasicMaterial({ color: 0xff7a14, transparent: true, opacity: 0.55, depthWrite: false })); dis.renderOrder = 3; m.add(dis);
  m.userData.ic = ic; m.userData.dis = dis; m.visible = false; a.govde.add(m); a.arAlev = m; return m;
}
function arabaSok(a) {   // arabayı sahneden kaldırır; yalnız o arabaya ait geometri/malzemeyi bırakır (ortak olanlara dokunmaz)
  if (!a || !a.g) return;
  const birak = o => {
    if (!o.isMesh) return;
    if (o.geometry && o.geometry !== arKoniGeo && o.geometry !== arLambaGeo) o.geometry.dispose();
    const m = o.material; if (m && m !== arMat && m !== arBoya && m !== arAlevMat && m !== golgeMat) m.dispose();
  };
  a.g.traverse(birak); if (a.g.parent) a.g.parent.remove(a.g);
  if (a.golge) { birak(a.golge); if (a.golge.parent) a.golge.parent.remove(a.golge); }
  a.arAlev = null;
}
OLAY.on('yildiz', () => { if (typeof A !== 'undefined' && A[0].ar) A[0].ar.sek = 0; });
OLAY.on('tok', () => { if (typeof A !== 'undefined' && A[0].ar) A[0].ar.tok = 0; });
OLAY.on('araba', () => { if (typeof A !== 'undefined' && A[0].ar) A[0].ar.mer = 0; });   // yeni seçilen araba zıplayıp dönerek selam verir
OLAY.on('durum', d => {
  if (d !== 'giris' && d !== 'sayim' && d !== 'baslik') return;
  // Yeniden yarışta eski kupa pozu veya iniş yaylanması taşınmasın.
  if (typeof A !== 'undefined') for (const a of A) if (a.ar) {
    const s = a.ar; s.v0 = a.v; s.ivme = 0; s.sev = 0; s.yay = 0; s.don = 0; s.egx = 0; s.egz = 0; s.bak = 0; s.sal = 0;
    s.ayak.fill(0);
    s.havada = false; s.inis = 9; s.sek = 9; s.tok = 9; if (d !== 'baslik') s.mer = 9;
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
    y = Math.sin(hu * Math.PI) * ((typeof RAMPA !== 'undefined' && RAMPA.yuk) || 1.9) + (a.hopBasY || 0) * kalan;
    egim = (a.hopBasEgim || 0) * kalan * kalan; yatis = (a.hopBasYatis || 0) * kalan * kalan;
  }
  if (s.havada && !havada) s.inis = 0;
  s.havada = havada; s.inis += dt; s.sek += dt; s.tok += dt; s.t += dt; s.mer += dt;
  // merhaba: seçim ekranında yeni araba küçük bir zıplar, kendi çevresinde bir tur döner, yumuşakça yere konar
  const merU = s.mer < 0.85 ? s.mer / 0.85 : 1, merDon = merU < 1 ? merU * merU * (3 - 2 * merU) * Math.PI * 2 : 0, merY = merU < 1 ? Math.sin(merU * Math.PI) * 0.6 : 0;
  const merEz = merU < 1 ? Math.sin(merU * Math.PI) * 0.07 : s.mer < 1.35 ? -0.08 * Math.exp(-7 * (s.mer - 0.85)) * Math.cos((s.mer - 0.85) * 16) : 0;
  const k = arYumusak(dt, 8), t = s.t, hiz = Math.min(1, a.v / 26);
  const ivme = dt > 0 ? clamp((a.v - s.v0) / dt, -30, 30) : 0; s.v0 = a.v; s.ivme += (ivme - s.ivme) * arYumusak(dt, 5);
  const don = clamp(-Math.atan2(a.dv, Math.max(8, a.v)) * 1.7 - p.k * a.v * 0.3, -0.5, 0.5); s.don += (don - s.don) * k;
  s.sev += ((a.bitti ? 1 : 0) - s.sev) * arYumusak(dt, 4);
  a.g.position.set(x, y + merY, z);
  a.g.rotation.set(-egim, Math.atan2(p.tx, p.tz) - Math.atan2(a.dv, Math.max(8, a.v)) * 0.9 + merDon, yatis, 'YXZ');
  // gövde: yatma, yaylanma, zıplarken gerilme, inişte ezilme, sevinç zıplaması
  const egz = clamp(a.dv * 0.014, -0.13, 0.13) + clamp(p.k * a.v * 0.05, -0.08, 0.08) + (s.tok < 0.5 ? Math.sin(s.tok * 30) * 0.06 * (1 - s.tok * 2) : 0);
  s.egz += (egz - s.egz) * k; a.govde.rotation.z = s.egz;
  const egx = havada ? -0.16 + hu * 0.3 : -s.ivme * 0.005 * (a.arYayK || 1) + (s.inis < 0.6 ? Math.sin(s.inis * 15) * 0.05 * (a.arYayK > 1 ? 1.7 : 1) * (1 - s.inis / 0.6) : 0)
    + (a.arYayK > 1 ? Math.sin(t * 6.1 + a.faz) * 0.014 * Math.min(1, a.v / 10) : 0);
  s.egx += (egx - s.egx) * k; a.govde.rotation.x = s.egx - s.sev * Math.max(0, Math.sin(t * 6.5 + a.faz)) * 0.06;
  a.govde.rotation.y = s.sev * Math.sin(t * 3.25 + a.faz) * 0.16;   // bitişte sağa sola dans
  let es = havada ? 0.065 * Math.sin(Math.PI * Math.pow(hu, 0.6)) : s.inis < 0.7 ? -0.095 * Math.exp(-7 * s.inis) * Math.cos(s.inis * 16) : 0;
  const zs = Math.abs(Math.sin(t * 6.5 + a.faz));
  es += s.sev * (zs - 0.5) * 0.11 + (s.sek < 0.35 ? Math.sin(s.sek / 0.35 * Math.PI) * 0.07 : 0) + merEz;
  a.govde.scale.set(1 - es * 0.5, 1 + es, 1 - es * 0.5);
  const yk = a.arYayK || 1, yayHedef = havada ? 0.035 * yk : s.inis < 0.65 * yk ? -0.1 * yk * Math.exp(-8 / yk * s.inis) * Math.cos(s.inis * (yk > 1 ? 11 : 17)) : 0;
  s.yay += (yayHedef - s.yay) * arYumusak(dt, 24);
  a.govde.position.y = Math.sin(t * 22 + a.faz) * 0.009 * Math.min(1, a.v / 10) + Math.sin(t * 2.6 + a.faz) * 0.009 + s.sev * zs * 0.22 + s.yay + (a.arYuk || 0)
    + (yk > 1 ? (Math.sin(t * 8.3 + a.faz) * 0.022 + Math.sin(t * 13.1 + a.faz * 2) * 0.012) * Math.min(1, a.v / 10) + Math.abs(s.egz) * 0.25 : 0);
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
  a.arKafa.rotation.set(Math.sin(t * 2.2 + a.faz) * 0.03 - s.sev * 0.2 - (havada ? 0.18 : 0) + s.ivme * 0.003, s.bak, -s.bak * 0.22 + s.sev * Math.sin(t * 6.5 + a.faz) * 0.2);
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
    if (s.sev > 0.001) { arSevQ.setFromEuler(arSevE.set(-1.95 + el * 0.3 + Math.sin(t * 6.5 + a.faz + i * Math.PI) * 0.35, yon * (0.5 + el * 0.16), yon * 0.1)); arKolQ.slerp(arSevQ, s.sev); }
    kg.quaternion.copy(arKolQ); kg.scale.z = lerp(uzun / 0.6, 1, s.sev);
  }
  // saç ve kulaklar hızla geriye savrulur
  s.sal += ((hiz * 0.6 + (havada ? 0.5 : 0)) - s.sal) * arYumusak(dt, 6);
  for (let i = 0; i < a.arSallan.length; i++) {
    const sp = a.arSallan[i], u = sp.userData;
    sp.rotation.x = (s.sal + Math.sin(t * 13 + a.faz + i * 1.9) * 0.1 * (hiz + s.sev * 0.6)) * u.kx * (u.yukari ? -1 : 1);
    sp.rotation.z = u.yon * (s.sal * 0.35 + s.sev * 0.2) - clamp(a.dv * 0.03, -0.3, 0.3) * u.kx;
    if (u.dil) { sp.rotation.x += Math.sin(t * 5 + a.faz) * 0.12; sp.scale.y = 1 + Math.sin(t * 5 + a.faz) * 0.12 + s.sev * 0.15; }
  }
  // tipe ve sürücüye özel hareketli parçalar: yele, kuyruk, dondurma, roket alevi, Pırıl'ın kanatları
  for (let i = 0; i < a.arEk.length; i++) {
    const e = a.arEk[i], tr = e.userData.ek, yanal = clamp(a.dv * 0.05, -0.45, 0.45);
    if (tr === 'yele') { e.rotation.x = s.sal * 0.75 + Math.sin(t * 9 + a.faz) * 0.07 * (0.3 + hiz); e.rotation.z = -yanal * 1.2 - s.don * 0.5 + Math.sin(t * 5.3 + a.faz) * 0.08; e.rotation.y = Math.sin(t * 6.7 + a.faz) * 0.12 * (0.3 + hiz); }
    else if (tr === 'kuyruk') { e.rotation.x = -(s.sal * 0.8 + (havada ? 0.3 : 0) + Math.sin(t * 8 + a.faz) * 0.1 * (0.3 + hiz) + s.sev * Math.sin(t * 13) * 0.25); e.rotation.y = -yanal * 1.5 - s.don * 0.6 + Math.sin(t * 6.1 + a.faz) * 0.2 * (0.35 + hiz); }
    else if (tr === 'top') {
      e.rotation.z = -s.egz * 1.6 - yanal * 0.35 + Math.sin(t * 3.1 + a.faz) * 0.035 + s.sev * Math.sin(t * 6.5 + a.faz) * 0.12;
      e.rotation.x = clamp(s.ivme * 0.007, -0.2, 0.2) + (s.inis < 0.7 ? Math.sin(s.inis * 17) * 0.16 * (1 - s.inis / 0.7) : 0) + Math.sin(t * 4.3 + a.faz) * 0.02 * (0.4 + hiz);
      const ez = (havada ? 0.06 : s.inis < 0.5 ? -Math.sin(s.inis / 0.5 * Math.PI) * 0.12 : 0) + Math.sin(t * 7.9 + a.faz) * 0.012; e.scale.set(1 - ez * 0.5, 1 + ez, 1 - ez * 0.5);
    } else if (tr === 'alev') { const f = Math.sin(t * 67 + a.faz) * 0.5 + Math.sin(t * 41) * 0.5, u = 0.32 + hiz * 0.75; e.visible = a.v > 0.6 && !(a.arAlev && a.arAlev.visible); e.scale.set(0.27 + f * 0.03, u * (1 + f * 0.16), 0.27 + f * 0.03); }
    else if (tr === 'lamba') { const f = Math.sin(t * 9 + a.faz) > 0 ? 1 : 0.3; e.material.color.setRGB(0.05 + 0.3 * f, 0.2 + 0.55 * f, 0.55 + 0.45 * f); e.scale.set(0.19 + f * 0.025, 0.24 + f * 0.03, 0.19 + f * 0.025); }
    else if (tr === 'pervane') e.rotation.z = (e.rotation.z + dt * (4 + a.v * 1.5)) % (Math.PI * 2);
    else if (tr === 'kanat') { const cp = Math.sin(t * (7 + hiz * 9) + a.faz); e.rotation.x = cp * (0.16 + hiz * 0.2 + s.sev * 0.25) - (havada ? 0.35 : 0); e.scale.x = 1 + cp * 0.07 + (havada ? 0.15 : 0); }
  }
  if (a.arAlev && a.arAlev.visible) { const ic = a.arAlev.userData.ic, f = Math.sin(t * 71) * 0.5 + Math.sin(t * 43) * 0.5; ic.scale.set(0.58 + f * 0.08, 0.66 + f * 0.14, 0.58 + f * 0.08); }
  a.golge.position.set(x, 0.07, z); a.golge.rotation.z = a.g.rotation.y;
  a.golge.scale.setScalar(1 + Math.min(0.32, y * 0.15)); a.golge.material.opacity = Math.max(0.55, 1 - y * 0.22);
  a.x = x; a.z = z; a.tx = p.tx; a.tz = p.tz;
}
