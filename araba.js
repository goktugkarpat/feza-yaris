/* Arabalar ve sürücüler: araba(renk, renk2, tur) modeli kurar; arabaYerlestir(a, dt) her karede konum, yatış, teker dönüşü, gölge, sürücü canlandırması.
   a.yol = pist boyunca ilerleme (m), a.d = yanal konum, a.v = hız, a.dv = yanal hız, a.hop = zıplama sayacı. tur: feza | piril | bilbo | anne | baba
   Araba tipleri: ARABA_TIPLERI (kart, yaris, cip, roket, dondurma, unicorn, itfaiye, ejderha, ucak, gemi, polis, kedi); araba(renk, renk2, tur, tip); arabaSok(a) eski modeli siler.
   Tipe özel gövdeler arTipGovde içinde; hareketli ekler (yele, kuyruk, dondurma, alev, kanat, anten) a.arEk içinde ve arabaYerlestir canlandırır.
   Çizim sayısı az kalsın diye sabit parçalar tek geometride birleştirilir (köşe renkleri, tek ortak malzeme arMat):
   araba başına gövde 1 + kafa 1 + savrulan parçalar 0-2 + kollar 2 + direksiyon 1 + tekerler 4 + gölge 1 (+ tipe özel ek 0-1: anten yalnız kart ve cipte).
   Göz kırpma mevcut kafa geometrisinin tek morph hedefidir; yeni çizim veya kare başına geometri kurmaz. */
'use strict';

// Gölge: gövdenin yumuşak lekesi + dört tekerin altında daha koyu, yuvarlak temas lekesi (tek doku, ek çizim yok).
const golgeDoku = tuvalDoku(64, 88, (g, w, h) => {
  g.save(); g.translate(32, 44); g.scale(1, 1.32);
  let gr = g.createRadialGradient(0, 0, 3, 0, 0, 31); gr.addColorStop(0, 'rgba(0,0,0,.38)'); gr.addColorStop(0.55, 'rgba(0,0,0,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-32, -34, 64, 68); g.restore();
  for (const x of [13.8, 50.2]) for (const y of [24, 64]) { gr = g.createRadialGradient(x, y, 1, x, y, 9); gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 10, y - 10, 20, 20); }
});
const golgeMat = new T.MeshBasicMaterial({ map: golgeDoku, transparent: true, depthWrite: false });
function parca(ust, geo, renk, x, y, z, sx, sy, sz) { const m = new T.Mesh(geo, typeof renk === 'number' ? mat(renk) : renk); m.position.set(x, y, z); m.scale.set(sx, sy, sz); ust.add(m); return m; }

// ───────── birleştirici: parçaları tek geometride toplar ─────────
const arMat = new T.MeshLambertMaterial({ vertexColors: true });
// Tek ortak boya: plastik oyuncak hissi, küçük ve yumuşak bir ışık parıltısı.
// Yüzler mat kalır; kaportanın kıvrımları parlayarak biçimini belli eder.
const arBoya = new T.MeshPhongMaterial({ vertexColors: true, shininess: 52, specular: 0x464c56 });
// Oyuncak boyası: kenarlarda yumuşak sıcak vurgu (çizgi film parlaması), altta hafif koyulaşma (yere oturur); ek çizim yok.
// Koyu renkler (lastik, tampon, koltuk) mat kalır: parıltı ve kenar vurgusu renk açıklığıyla artar; çok açık renkler (beyaz) yanmasın diye vurgu azalır.
arBoya.onBeforeCompile = sh => {
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n' +
      'float arAc = dot(vColor, vec3(0.3, 0.59, 0.11)), arPar = smoothstep(0.1, 0.5, arAc);\n' +
      'reflectedLight.directSpecular *= arPar * (1.0 - 0.35 * smoothstep(0.75, 0.97, arAc));')
    .replace('#include <opaque_fragment>',
      'float arKen = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);\n' +
      'outgoingLight += vec3(1.0, 0.96, 0.88) * smoothstep(0.5, 1.0, arKen) * 0.4 * mix(0.2, 1.0, arPar) * (1.0 - 0.5 * smoothstep(0.7, 0.97, arAc)) * (0.55 + 0.45 * clamp(normal.y + 0.5, 0.0, 1.0));\n' +
      'float arDy = inverseTransformDirection(normalize(normal), viewMatrix).y;\n' +
      'outgoingLight *= mix(0.78, 1.0, smoothstep(-0.75, 0.1, arDy));\n' +
      '#include <opaque_fragment>');
};
arBoya.customProgramCacheKey = () => 'arBoya3';
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
// Araba gövdesi: iki kat sık örgü (pürüzsüz, tok siluet); renk düzeni eski 24x12 dilimlerine göre aynı kalır.
const arGovdeYuzey = (f, renkF) => arYuzey(48, 24, f, (i, j) => renkF(i >> 1, j >> 1));
const arKoyult = (renk, k) => new T.Color(renk).multiplyScalar(k).getHex();

// hazır küçük geometriler
const arTomb = arYuzey(8, 4, arSuper(4));                       // yuvarlak köşeli kutu
const arK = new T.SphereGeometry(1, 8, 5), arM = new T.SphereGeometry(1, 6, 4);   // küçük ve minik parçalar için hafif küreler
const arYuzDetay = new T.SphereGeometry(1, 10, 6);
const arSil = new T.CylinderGeometry(1, 1, 1, 10), arKafaKure = new T.SphereGeometry(1, 16, 11);   // hafif silindir ve hayvan kafası              // yakından görünen yüz parçaları yumuşak kalır
const arHap = (r, u) => new T.CapsuleGeometry(r, u, 2, 7);       // Y boyunca hap
const arLastik = new T.TorusGeometry(0.3, 0.16, 5, 18);   // yuvarlak siluet (köşeli görünmesin)
const arLambaGeo = new T.SphereGeometry(1, 10, 6);
const arHalka = new T.TorusGeometry(1, 0.2, 4, 12);
const arInceHalka = new T.TorusGeometry(1, 0.07, 3, 12), arJantHalka = new T.TorusGeometry(1, 0.07, 3, 18);   // jant çizgileri yakından görünür: daha yuvarlak
const arCivi = new T.OctahedronGeometry(1, 0);
const arCamurluk = new T.TorusGeometry(1, 0.095, 4, 9, Math.PI);
const arGulus = new T.TorusGeometry(1, 0.13, 4, 8, Math.PI);
const arSac = new T.SphereGeometry(1, 22, 9, 0, Math.PI * 2, 0, Math.PI * 0.57);   // sürücü saç örtüsü: köşesiz, pürüzsüz siluet
const arYildizGeo = (() => { const s = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.52 : 1, a = i / 10 * Math.PI * 2 + Math.PI / 2; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return new T.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.045, bevelSegments: 1, curveSegments: 1 }); })();
const arGovdeF = (() => { const sb = arSuper(3.2); return (u, w, o) => { sb(u, w, o); const z = o.z; let x = o.x * 0.9, y = o.y * 0.38; if (z > 0) { x *= 1 - 0.3 * z * z; if (y > 0) y *= 1 - 0.45 * Math.pow(z, 1.5); } else if (y > 0) y *= 1 + 0.22 * -z; o.set(x, y, z * 1.8); }; })();
const AR_TEN = 0xf6c9a4, AR_KOYU = 0x2b2f3a, AR_LEYLAK = 0xb79bea, AR_CIKO = 0x5b3a26;
// ───────── sürücüler: kafa, yüz, saç ─────────
// Yoğrulmuş küre: sekil(v) birim küredeki noktayı oynatır, renkF(v, renk) köşe rengini verir (v: yoğrulmadan önceki birim konum).
function arYogur(nu, nv, sekil, renkF) {
  const g = new T.SphereGeometry(1, nu, nv), p = g.attributes.position, c = [], v = new T.Vector3(), r = new T.Color(), W = nu + 1;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); renkF(v, r); c.push(r.r, r.g, r.b); sekil(v); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let j = 0; j <= nv; j++) {   // dikiş ve kutuplarda yumuşak geçiş
    const a = j * W, b = a + nu;
    if (j === 0 || j === nv) { for (let i = 0; i <= nu; i++) n.setXYZ(a + i, 0, j ? -1 : 1, 0); continue; }
    v.set(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize(); n.setXYZ(a, v.x, v.y, v.z); n.setXYZ(b, v.x, v.y, v.z);
  }
  g.setAttribute('color', new T.Float32BufferAttribute(c, 3)); return g;
}
const arKafaGeoler = {};
function arKafaGeo(tur) {   // her sürücünün kendi kafa biçimi (bir kez kurulur): tombul yanak, burun çıkıntısı, pembe yanak rengi
  if (arKafaGeoler[tur]) return arKafaGeoler[tur];
  const c1 = new T.Color(), c2 = new T.Color(), c3 = new T.Color(0xf2a3d0), on = v => clamp(v.z * 1.6 + 0.2, 0, 1);
  let g;
  if (tur === 'piril' || tur === 'bilbo') {
    const b = tur === 'bilbo'; c1.setHex(b ? 0x67432f : AR_LEYLAK); c2.setHex(b ? 0x8f6644 : 0xd9c9fa);
    const burun = v => v.z > 0 ? Math.exp(-(v.y + 0.22) * (v.y + 0.22) / (b ? 0.075 : 0.1) - v.x * v.x / (b ? 0.16 : 0.24)) * clamp(v.z * 2.2, 0, 1) : 0;
    g = arYogur(20, 14, v => { const m = burun(v); v.z += m * (b ? 0.52 : 0.4); if (b) v.y = (v.y - m * 0.04) * 0.96; else v.x *= 1 + 0.07 * Math.exp(-(v.y + 0.2) * (v.y + 0.2) / 0.1); },
      (v, r) => { r.copy(c1).lerp(c2, Math.min(1, burun(v) * (b ? 0.9 : 1.15))); if (!b) { const dx = Math.abs(v.x) - 0.66, dy = v.y + 0.12; r.lerp(c3, Math.exp(-dx * dx / 0.03 - dy * dy / 0.025) * 0.6 * on(v)); } });
  } else {
    const cocuk = tur === 'feza', anne = tur === 'anne';
    c1.setHex(tur === 'baba' ? 0xeebd95 : cocuk ? 0xf6ccb2 : AR_TEN); c2.setHex(cocuk ? 0xf78f9b : anne ? 0xf29a96 : 0xe59d85);
    g = arYogur(20, 14, v => {
      const y0 = v.y, f = on(v), yan = Math.exp(-(y0 + 0.34) * (y0 + 0.34) / 0.1) * f;
      v.x *= 1 + (cocuk ? 0.12 : anne ? 0.02 : 0.07) * yan;
      if (y0 < -0.4) v.x *= 1 - (cocuk ? 0.1 : anne ? 0.17 : 0.1) * (-0.4 - y0) / 0.6 * f;
      v.y *= cocuk ? 0.97 : 1.06;
    }, (v, r) => { const dx = Math.abs(v.x) - 0.58, dy = v.y + 0.3; r.copy(c1).lerp(c2, Math.exp(-dx * dx / 0.04 - dy * dy / 0.03) * (cocuk ? 0.8 : anne ? 0.72 : 0.35) * on(v)); if (v.y < -0.75) r.multiplyScalar(0.94); });
  }
  return (arKafaGeoler[tur] = g);
}
// saç lülesi / diken / kulak: tabanı yuvarlak, ucu sivri damla (+Y boyunca, boy 1)
const arDamla = new T.LatheGeometry([[0, -0.22], [0.72, -0.1], [1, 0.16], [0.8, 0.5], [0.42, 0.82], [0, 1]].map(q => new T.Vector2(q[0] || 0.0001, q[1])), 7);
const arBant = new T.CylinderGeometry(1, 1, 1, 18, 1, true);                                        // gözlük lastiği, toka
const arAgiz = new T.SphereGeometry(1, 10, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);            // açık gülen ağız (yarım daire)
const arKapak = new T.TorusGeometry(1, 0.07, 5, 14, Math.PI);                                         // üst kirpik çizgisi (düzgün kavis)
const arGulusY = new T.TorusGeometry(1, 0.13, 6, 14, Math.PI);                                        // sürücülerin gülüş çizgisi: köşesiz yay
const arSakal = new T.SphereGeometry(1, 22, 7, 0, Math.PI * 2, Math.PI * 0.68, Math.PI * 0.32);
// Saçta ton geçişi: [bas, son) köşelerini yüksekliğe göre (üst açık → alt koyu) boyar; parlak tepe, gölgeli ense.
function arTonla(y, bas, yAlt, yUst, kAlt, kUst) {
  for (let i = bas; i < y.p.length; i += 3) { const t = clamp((y.p[i + 1] - yAlt) / (yUst - yAlt), 0, 1), k = kAlt + (kUst - kAlt) * t * t * (3 - 2 * t); y.c[i] = Math.min(1, y.c[i] * k); y.c[i + 1] = Math.min(1, y.c[i + 1] * k); y.c[i + 2] = Math.min(1, y.c[i + 2] * k); }
}
const arLuleQ = new T.Quaternion(), arLuleE = new T.Euler(), arLuleY = new T.Vector3(0, 1, 0), arLuleD = new T.Vector3();
function arLule(y, renk, px, py, pz, dx, dy, dz, boy, en, kalin) {   // (px,py,pz) noktasından (dx,dy,dz) yönüne uzanan damla
  arLuleQ.setFromUnitVectors(arLuleY, arLuleD.set(dx, dy, dz).normalize()); arLuleE.setFromQuaternion(arLuleQ);
  arKat(y, arDamla, renk, px, py, pz, en, boy, kalin === undefined ? en : kalin, arLuleE.x, arLuleE.y, arLuleE.z);
}
const arRast = i => { const s = Math.sin(i * 127.1 + 3.7) * 43758.5453; return s - Math.floor(s); };   // hep aynı "dağınıklık"
// Feza'nın yumuşak saç tutamı: ucu yuvarlak (sivri değil), dolgun gövdeli damla; arLule gibi (px,py,pz)'den (dx,dy,dz) yönüne
const arTutamGeo = new T.LatheGeometry([[0, -0.14], [0.7, -0.08], [0.97, 0.16], [1, 0.42], [0.86, 0.68], [0.58, 0.88], [0.26, 0.98], [0, 1]].map(q => new T.Vector2(q[0] || 0.0001, q[1])), 10);
function arTutam(y, renk, px, py, pz, dx, dy, dz, boy, en, kalin, burgu) {
  arLuleQ.setFromUnitVectors(arLuleY, arLuleD.set(dx, dy, dz).normalize());
  if (burgu) arLuleQ.multiply(new T.Quaternion().setFromAxisAngle(arLuleY, burgu));   // yassı tutamı kafa yüzeyine yatırır (yalnız kurulumda)
  arLuleE.setFromQuaternion(arLuleQ);
  arKat(y, arTutamGeo, renk, px, py, pz, en, boy, kalin === undefined ? en : kalin, arLuleE.x, arLuleE.y, arLuleE.z);
}

function arGoz(y, x, yy, z, r, beyaz, iris, irisOran, ry) {   // sevimli göz: (ak) + (renkli halka) + koyu bebek + parıltı; ry = hafif dışa bakış
  ry = ry || 0; const sn = Math.sin(ry), cs = Math.cos(ry);
  const ekle = (geo, renk, xx, yz, o, sx, sy, sz, sakla) => {
    const bas = y.p.length; arKat(y, geo, renk, xx + o * sn, yz, z + o * cs, sx, sy, sz, 0, ry, 0);
    if (!y.gozler) y.gozler = [];
    y.gozler.push({ bas, son: y.p.length, yy, sakla });
  };
  let o = 0; const r0 = r;
  if (beyaz) { ekle(arYuzDetay, 0xffffff, x, yy, 0, r, r * 1.08, r * 0.42, true); o = r * 0.3; r *= irisOran || 0.68; }
  if (iris) { ekle(arYuzDetay, iris, x, yy, o, r, r * 1.05, r * 0.38, true); o += r * 0.22; r *= 0.74; }
  ekle(arYuzDetay, 0x2a2230, x, yy, o, r, r * 1.1, r * 0.3, false);
  ekle(arM, 0xfffbec, x + r0 * 0.2, yy + r0 * 0.3, o + r * 0.3, r0 * 0.17, undefined, undefined, true);
  if (beyaz) ekle(arM, 0xfffbec, x - r0 * 0.24, yy - r0 * 0.3, o + r * 0.26, r0 * 0.085, undefined, undefined, true);
}
function kafa(tur) {   // yüz +Z'ye bakar; k.userData.sallan = hızla savrulan parçalar (saç, kulak, atkı)
  const k = new T.Group(), y = arYapi(); k.userData.sallan = [];
  const sal = (px, py, pz, kx, yon) => { const gr = new T.Group(); gr.position.set(px, py, pz); gr.userData.kx = kx; gr.userData.yon = yon; k.add(gr); k.userData.sallan.push(gr); return gr; };
  arKat(y, arKafaGeo(tur), null, 0, 0, 0, 0.5);
  if (tur === 'feza' || tur === 'anne' || tur === 'baba') {
    const cocuk = tur === 'feza', anne = tur === 'anne';
    const sac = cocuk ? 0x50301a : anne ? 0x8a4f2b : 0x564a42, sacAcik = cocuk ? 0x6a4224 : anne ? 0x9c5d34 : 0x6e6661, ten = tur === 'baba' ? 0xeebd95 : AR_TEN;
    const gx = cocuk ? 0.19 : anne ? 0.182 : 0.175, gy = cocuk ? -0.03 : anne ? -0.005 : 0.035, gr = cocuk ? 0.104 : anne ? 0.097 : 0.08;
    for (const x of [-1, 1]) {
      arKat(y, arM, ten, x * 0.5, -0.04, 0, 0.07, 0.1, 0.09);                                                     // kulak
      arKat(y, arM, 0xe9a98d, x * 0.535, -0.045, 0.035, 0.018, 0.055, 0.04);
      arGoz(y, x * gx, gy, 0.45, gr, true, cocuk ? 0x7c4522 : anne ? 0x7a5230 : 0x5a3a26, cocuk ? 0.76 : 0.74, x * 0.3);
      arKat(y, arKapak, cocuk ? 0x4a2e1e : 0x2a2230, x * gx, gy + gr * 0.1, 0.474, gr * 1.03, gr * 1.02, gr * 1.6, 0, x * 0.3);   // üst kirpik çizgisi
      if (cocuk) { arKat(y, arM, 0x5b3a24, x * 0.165, 0.118, 0.476, 0.05, 0.012, 0.02, 0, 0, -x * 0.12); arKat(y, arM, 0x5b3a24, x * 0.225, 0.112, 0.468, 0.035, 0.011, 0.02, 0, 0, -x * 0.4); }   // ince, hafif kavisli kaşlar
      else if (anne) { arKat(y, arM, 0x3a2a2a, x * 0.274, 0.05, 0.43, 0.034, 0.011, 0.018, 0, x * 0.3, x * 0.6); arKat(y, arM, 0x6e3d22, x * 0.183, 0.142, 0.474, 0.068, 0.013, 0.02, 0, x * 0.2, -x * 0.06); }   // kirpik ucu, yumuşak kemer kaş
      else arKat(y, arM, 0x2a2220, x * 0.175, 0.165, 0.478, 0.09, 0.026, 0.03, 0, 0, -x * 0.1);
    }
    if (cocuk) {
      arKat(y, arYuzDetay, 0xf0b598, 0, -0.1, 0.49, 0.036, 0.03, 0.04);                                         // küçük düğme burun
      arKat(y, arAgiz, 0x8c2f3c, 0, -0.192, 0.458, 0.085, 0.066, 0.03);                                          // tatlı, küçük gülüş
      arKat(y, arM, 0xf58a98, 0, -0.235, 0.466, 0.036, 0.016, 0.016);
    } else {
      if (anne) arKat(y, arYuzDetay, 0xf2b498, 0, -0.09, 0.49, 0.036, 0.031, 0.04);                                // anne: Feza'nınki gibi küçük düğme burun
      else arKat(y, arYuzDetay, 0xe6b08a, 0, -0.05, 0.49, 0.056, 0.066, 0.056, -0.2);
      if (anne) { arKat(y, arAgiz, 0x9a3446, 0, -0.18, 0.462, 0.082, 0.058, 0.03); arKat(y, arM, 0xf2879a, 0, -0.218, 0.468, 0.034, 0.014, 0.016); }   // sıcak, tatlı gülüş
    }
    if (cocuk) {
      // Feza'nın saçı (diğer oyunlardaki gibi): yumuşak, dolgun, koyu kahverengi; alnı örten, onun sağına taranmış perçem,
      // kulakları yarıya kadar örten yanlar, ensede dalgalı uçlar. Hiç sivri diken yok: tutamların ucu yuvarlak.
      const sb = y.p.length;
      arKat(y, arSac, sac, 0, 0.005, -0.012, 0.556, 0.56, 0.556, -0.5);                                            // dolgun saç örtüsü
      arKat(y, arK, sac, 0, 0.16, -0.17, 0.5, 0.42, 0.44, -0.4);                                                    // tepe ve arka hacmi
      for (let i = 0; i < 7; i++) {                                                                                  // perçem: alnı örter, Feza'nın sağına taranır
        const x = 0.27 - i * 0.088, py = 0.4 - Math.abs(x + 0.03) * 0.28, pz = Math.sqrt(Math.max(0.02, 0.3 - x * x - py * py));
        arTutam(y, i % 2 ? sacAcik : sac, x, py, pz - 0.03, -0.42 - i * 0.03, -1, 0.42, 0.17 + (i > 2 && i < 6 ? 0.04 : 0) + arRast(i) * 0.03, 0.11, 0.05);
      }
      for (const x of [-1, 1]) for (let i = 0; i < 3; i++) {                                                         // yanlar: kulağın üstünü örter
        const a = (0.74 + i * 0.3) * x, cx = Math.sin(a), cz = Math.cos(a) * 0.9 - 0.08;   // gözün dışından başlar: göz çevresi temiz
        arTutam(y, i === 1 ? sacAcik : sac, cx * 0.5, 0.12, cz * 0.5, cx * 0.25, -1, cz * 0.12, (i === 2 ? 0.17 : 0.22) + arRast(i + 4) * 0.03, 0.11, 0.06);
      }
      for (let i = 0; i < 6; i++) {                                                                                  // ense: dalgalı, hafif dışa kıvrık uçlar
        const a = (213 + i * 22.8) * Math.PI / 180, cx = Math.cos(a), cz = Math.sin(a);
        arTutam(y, i % 2 ? sacAcik : sac, cx * 0.5, 0.0, cz * 0.5, cx * 0.7, -1, cz * 0.7, 0.15 + arRast(i + 20) * 0.04, 0.13, 0.075);
      }
      for (let i = 0; i < 6; i++) {                                                                                  // tepeden arkaya katmanlı tutamlar (yarış kamerasından görünür)
        const a = (-0.95 + i * 0.38), cx = Math.sin(a), cz = Math.cos(a);
        arTutam(y, i % 2 ? sac : sacAcik, cx * 0.2, 0.5, -0.08 - cz * 0.04, cx * 0.55, -0.35, -cz, 0.36, 0.13, 0.065);
      }
      arTonla(y, sb, -0.28, 0.56, 0.74, 1.22);                                                                      // saç: tepe ışıl, ense gölgeli
      // yarışçı gözlüğü saçın üstünde (perçem açıkta kalır): kırmızı lastik saçın çevresini dolanır, iki sarı çerçeveli cam
      arKat(y, arBant, 0xe8433a, 0, 0.13, -0.07, 0.566, 0.07, 0.566, -0.58);
      for (const x of [-1, 1]) {
        arTaban(y, x * 0.15, 0.475, 0.37, -0.6, x * 0.32, 0);
        arKat(y, arHalka, 0xffd23e, 0, 0, 0, 0.092, 0.08, 0.1); arKat(y, arK, 0x9fe3ff, 0, 0, 0.004, 0.088, 0.073, 0.03); arKat(y, arM, 0xffffff, 0.03, 0.028, 0.03, 0.026, 0.02, 0.01);
        y.taban = null;
      }
      arKat(y, arTomb, 0xffd23e, 0, 0.48, 0.405, 0.05, 0.03, 0.03, -0.6);
      const t = sal(0, 0.52, -0.1, 0.9, 0), ty = arYapi(); t.userData.yukari = true; arTutam(ty, sacAcik, 0, -0.03, 0, 0.15, 1, -0.55, 0.16, 0.075, 0.05); arTutam(ty, sac, 0.06, -0.03, -0.05, 0.6, 0.8, -0.6, 0.13, 0.065, 0.045); arBitir(ty, t);   // tepede küçük, yumuşak kıvrım
      // kırmızı atkı: hızlandıkça arkada yukarı doğru dalgalanır (ucu beyaz çizgili); krem çizgili tişörtün üstünde arkadan Feza'yı ele verir
      const at = sal(0, -0.28, -0.5, 1.7, 0), ay = arYapi();
      arKat(ay, arK, 0xe8433a, 0, 0, 0.03, 0.09, 0.075, 0.075);
      // iki uç yumuşak, dolgun kumaş gibi (yassı levha değil); arkadan bakınca keskin çatal çizmez
      arKat(ay, arK, 0xe8433a, 0.06, -0.08, -0.3, 0.13, 0.04, 0.32, -0.3, 0.12, 0.1); arKat(ay, arK, 0xfff6ea, 0.1, -0.15, -0.56, 0.11, 0.042, 0.07, -0.3, 0.12, 0.1);
      arKat(ay, arK, 0xd63a33, -0.07, -0.07, -0.22, 0.11, 0.038, 0.24, -0.32, -0.16, -0.12);
      arBitir(ay, at);
    } else if (anne) {
      // uzun kestane saç, yana taranmış kâkül, yüksek at kuyruğu (turkuaz tokalı; arkadan hemen tanınır)
      // tutamlar yuvarlak uçlu (Feza'nınki gibi yumuşak), saç üstte ışıl → altta gölgeli
      const sb = y.p.length;
      arKat(y, arSac, sac, 0, 0.02, -0.01, 0.545, 0.56, 0.545, -0.5);
      for (let i = 0; i < 4; i++) { const x = -0.26 + i * 0.16; arTutam(y, i % 2 ? sacAcik : sac, x, 0.36 - Math.abs(x) * 0.2, 0.37 - Math.abs(x) * 0.1, -0.9 + i * 0.1, -0.75, 0.25, 0.2 + i * 0.03, 0.1, 0.08); }
      for (const x of [-1, 1]) { arTutam(y, sac, x * 0.47, 0.2, 0.14, x * 0.05, -1, 0.06, 0.48, 0.1, 0.12); arTutam(y, sacAcik, x * 0.43, 0.15, -0.16, x * 0.12, -1, -0.1, 0.6, 0.13, 0.15); }
      arTutam(y, sac, 0, 0.1, -0.44, 0, -1, -0.12, 0.53, 0.3, 0.14);
      arTonla(y, sb, -0.45, 0.55, 0.74, 1.2);
      for (const x of [-1, 1]) arKat(y, arM, 0xffd23e, x * 0.525, -0.14, 0.03, 0.03);                             // küpe
      arKat(y, arK, 0x2fc4b2, 0, 0.43, -0.41, 0.175, 0.1, 0.175, 0.75);
      const t = sal(0, 0.47, -0.42, 0.8, 0), ty = arYapi();
      arTutam(ty, sac, 0, -0.5, -0.66, 0, 0.9, 1, 0.76, 0.17, 0.15); arTutam(ty, sacAcik, 0.1, -0.4, -0.5, -0.16, 1, 0.9, 0.53, 0.09); arTutam(ty, sacAcik, -0.1, -0.4, -0.5, 0.16, 1, 0.9, 0.53, 0.09);
      arTonla(ty, 0, -0.62, 0.05, 0.78, 1.12);
      arBitir(ty, t);
    } else {
      // baba: çok kısa kırçıl saç, kalın kaş, dolgun sakal ve bıyık, sıcak gülüş
      const sb = y.p.length;
      arKat(y, arSac, sac, 0, 0.03, -0.01, 0.523, 0.545, 0.523, -0.7);
      arKat(y, arSakal, 0x55463c, 0, 0.0, 0.0, 0.535, 0.56, 0.535, -0.5);
      for (const x of [-1, 1]) { arKat(y, arK, 0x55463c, x * 0.455, -0.13, 0.13, 0.07, 0.17, 0.13); arTutam(y, 0x3a2e28, x * 0.02, -0.125, 0.515, x, -0.32, -0.18, 0.16, 0.05, 0.042); }
      arKat(y, arK, 0x675a51, 0, -0.36, 0.415, 0.12, 0.085, 0.05, 0.75);
      arTonla(y, sb, -0.5, 0.5, 0.86, 1.16);                                                                         // sakal altta koyu, tepe ışıl
      arKat(y, arGulusY, 0xe0a590, 0, -0.165, 0.525, 0.085, 0.06, 0.07, 0.3, 0, Math.PI);
    }
  } else if (tur === 'piril') {
    // mor peluş ejderha: iri yeşil gözler, pembe yanak, krem boynuzlar, yeşil sırt dikenleri
    for (const x of [-1, 1]) {
      arGoz(y, x * 0.215, 0.16, 0.4, 0.145, true, 0x3fb35a, 0.74, x * 0.32);
      arKat(y, arKapak, 0x5a3f96, x * 0.215, 0.175, 0.43, 0.15, 0.148, 0.2, 0, x * 0.32);
      arKat(y, arM, 0x7d62b8, x * 0.075, -0.05, 0.675, 0.026, 0.02, 0.02);                                 // burun delikleri
      arKat(y, G.koni, 0xffffff, x * 0.07, -0.222, 0.615, 0.03, 0.06, 0.03, Math.PI);                     // minik dişler
      arLule(y, 0xfff0c8, x * 0.2, 0.41, 0.05, x * 0.4, 1, -0.2, 0.22, 0.065);                             // boynuz
    }
    for (let i = 0; i <= 14; i++) { const t = i / 7 - 1, x = t * 0.13; arKat(y, arM, 0x6a4fa6, x, -0.2 + 0.055 * t * t, 0.632 - 1.1 * x * x, 0.02, 0.015, 0.018); }   // gülüş çizgisi: yüze oturan yuvarlak uçlu yay (çıkıntı yok)
    { const t = sal(0, 0.2, -0.05, 0.55, 0), ty = arYapi(); t.userData.yukari = true;   // iki yüzgeç kulak tek parça
      for (const x of [-1, 1]) { arLule(ty, 0x8fd87a, x * 0.4, -0.05, 0, x, 0.55, -0.1, 0.42, 0.14, 0.05); arLule(ty, 0xf2a3d0, x * 0.43, -0.03, 0.03, x, 0.55, -0.1, 0.27, 0.08, 0.03); }
      arBitir(ty, t); }
    for (let i = 0; i < 5; i++) { const a = 0.45 - i * 0.52, b = [0.17, 0.24, 0.26, 0.22, 0.17][i]; arLule(y, i % 2 ? 0x6cc76a : 0x4fae37, 0, Math.cos(a) * 0.46, Math.sin(a) * 0.46 - 0.02, 0, Math.cos(a - 0.25), Math.sin(a - 0.25), b, 0.055, 0.13); }
  } else if (tur === 'bilbo') {
    // çikolata Labrador: uzun burun, ıslak parlak burun ucu, sarkık kulaklar, dışarıda dil
    arKat(y, arK, 0x1e1410, 0, -0.035, 0.715, 0.11, 0.082, 0.075);
    arKat(y, arM, 0xcfc4bd, -0.035, 0.0, 0.775, 0.032, 0.018, 0.012);                                      // ıslak burun parıltısı
    arKat(y, arTomb, 0x2a1a12, 0, -0.14, 0.722, 0.008, 0.06, 0.012, 0.25);
    { const t = sal(0, -0.235, 0.62, 0.45, 0), ty = arYapi(); t.userData.dil = true; arKat(ty, arK, 0xff7d93, 0, -0.085, 0, 0.075, 0.115, 0.03, 0.35); arKat(ty, arM, 0xe9627c, 0, -0.085, 0.026, 0.01, 0.08, 0.01, 0.35); arBitir(ty, t); }
    arKat(y, arGulus, 0x2a1a12, 0, -0.2, 0.655, 0.13, 0.07, 0.09, 0.5, 0, Math.PI);
    for (const x of [-1, 1]) {
      arGoz(y, x * 0.2, 0.13, 0.41, 0.112, true, 0xc08f45, 0.8, x * 0.32);   // kehribar gözler (diğer oyunlardaki Bilbo gibi)
      arKat(y, arKapak, 0x2e1c12, x * 0.2, 0.142, 0.434, 0.116, 0.114, 0.16, 0, x * 0.32);
      arKat(y, arM, 0x8a6244, x * 0.2, 0.295, 0.385, 0.06, 0.032, 0.03, 0, 0, x * 0.25);                   // kaş benekleri
    }
    { const t = sal(0, 0.3, -0.02, 1, 0), ty = arYapi();   // iki sarkık kulak tek parça
      for (const x of [-1, 1]) { arKat(ty, arK, 0x573929, x * 0.44, -0.13, 0.01, 0.085, 0.15, 0.2, 0, 0, x * 0.2); arLule(ty, 0x4e3222, x * 0.6, -0.56, 0.04, -x * 0.2, 1, -0.04, 0.5, 0.085, 0.23); }
      arBitir(ty, t); }
  }
  const yuz = arBitir(y, k);
  if (y.gozler && y.gozler.length) {
    const acik = yuz.geometry.attributes.position.array, kapali = new Float32Array(acik), gomuk = new Float32Array(acik);
    for (const goz of y.gozler) for (let i = goz.bas; i < goz.son; i += 3) {
      kapali[i + 1] = goz.yy + (acik[i + 1] - goz.yy) * 0.06;
      // Ak, iris ve parıltı göz kapağının arkasına çekilir; kapanırken beyaz çizgi parlamaz.
      if (goz.sakla) gomuk[i + 2] = acik[i + 2] - 0.14;   // ikinci hedef: yalnız iyice kapanınca gömülür, yarı kapalıyken göz kararmaz
    }
    yuz.geometry.morphAttributes.position = [new T.Float32BufferAttribute(kapali, 3), new T.Float32BufferAttribute(gomuk, 3)];
    yuz.updateMorphTargets(); yuz.morphTargetInfluences[0] = 0; yuz.morphTargetInfluences[1] = 0; k.userData.gozMesh = yuz;
  }
  return k;
}

let arCizgiliG = null;
function arCizgili() {   // Feza'nın çizgili tişörtü (bir kez kurulur): krem zemin, lacivert + açık mavi yatay çizgiler, köşe rengiyle
  if (arCizgiliG) return arCizgiliG;
  const kr = new T.Color(0xf3ecdf), la = new T.Color(0x2c3f6e), ma = new T.Color(0x7fb0e0);
  const g = new T.SphereGeometry(1, 14, 64), p = g.attributes.position, c = [];
  for (let i = 0; i < p.count; i++) { const t = (p.getY(i) * 5.5 + 10.3) % 1; const r = t < 0.26 ? la : t > 0.52 && t < 0.72 ? ma : kr; c.push(r.r, r.g, r.b); }
  g.setAttribute('color', new T.Float32BufferAttribute(c, 3)); return (arCizgiliG = g);
}
const arKanatGeo = [-1, 1].map(s => {   // Pırıl'ın yarasa kanadı (sol, sağ): kök → bilek → uç, arka kenar üç yuvarlak tarak
  const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(s * 0.28, 0.44); sh.lineTo(s * 0.8, 0.4);
  sh.quadraticCurveTo(s * 0.6, 0.34, s * 0.56, 0.15); sh.quadraticCurveTo(s * 0.4, 0.15, s * 0.31, -0.03); sh.quadraticCurveTo(s * 0.15, 0.02, s * 0.05, -0.13); sh.lineTo(0, 0);
  return new T.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false, curveSegments: 4 });
});
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
  { id: 'ucak', renk: 0xffcf33, renk2: 0xf2483a },
  /*GEMI*/ { id: 'gemi', renk: 0x9c5a2e, renk2: 0xfbf0d8 }, /*/GEMI*/      // korsan gemisi: ahşap kahvesi gövde, krem yelken
  /*POLIS*/ { id: 'polis', renk: 0x2f5fd0, renk2: 0xffffff }, /*/POLIS*/
  /*KEDI*/ { id: 'kedi', renk: 0xff9d3c, renk2: 0xfff1dc }, /*/KEDI*/
  { id: 'tren', renk: 0xd93b3b, renk2: 0xffd23f },
  { id: 'traktor', renk: 0x39a845, renk2: 0xffc928 },
  { id: 'ufo', renk: 0x7b61ff, renk2: 0x45f0df }
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
  ucak: { ra: 0.43, ro: 0.43, ena: 1.2, eno: 1.2, yuk: 0, sus1: [0, 1.0, 1.0, -Math.PI / 2 + 0.2, 0], sus2: null },
  // YER TUTUCU: üçü de kart tekerleri (ARABA ajanı kendi satırını ayarlar)
  /*GEMI*/ gemi: { ra: 0.5, ro: 0.46, ena: 1.45, eno: 1.3, yuk: 0, jant: 0xf6dfa4, sus1: null, sus2: [0, 0.74, -1.9, 0, Math.PI] }, /*/GEMI*/
  /*POLIS*/ polis: { ra: 0.5, ro: 0.45, ena: 1.5, eno: 1.3, yuk: 0, sus1: [0, 0.93, 0.95, -Math.PI / 2 + 0.15, 0], sus2: [0, 0.72, -1.87, 0, Math.PI] }, /*/POLIS*/
  /*KEDI*/ kedi: { ra: 0.47, ro: 0.45, ena: 1.3, eno: 1.25, yuk: 0, jant: 0xfff1dc, sus1: null, sus2: [0, 0.6, -1.86, 0, Math.PI] }, /*/KEDI*/
  tren: { tip: 'tren', ra: 0.56, ro: 0.44, ena: 1.35, eno: 1.2, yuk: 0.04, jant: 0xffd23f, sus1: [0, 1.58, 0.42, -Math.PI / 2 + 0.12, 0], sus2: [0, 0.72, -1.86, 0, Math.PI] },
  traktor: { tip: 'traktor', ra: 0.66, ro: 0.42, ena: 1.65, eno: 1.25, yuk: 0.14, yay: 2.0, jant: 0xffc928, sus1: [0, 1.32, 0.96, -Math.PI / 2 + 0.12, 0], sus2: [0, 0.82, -1.76, 0, Math.PI] },
  ufo: { ra: 0.36, ro: 0.36, ena: 1.0, eno: 1.0, yuk: 0.18, jant: 0x45f0df, sus1: [0, 1.02, 1.48, -Math.PI / 2 + 0.25, 0], sus2: [0, 0.78, -1.76, 0, Math.PI] }
};
const arTipF = (() => {
  const s3 = arSuper(3), s5 = arSuper(4.1), s35 = arSuper(3.5), s22 = arSuper(2.2), s4 = arSuper(4), s26 = arSuper(2.6);
  return {
    yaris: (u, w, o) => { s3(u, w, o); const z = o.z; let x = o.x * 0.76, y = o.y * 0.3; if (z > 0) { x *= 1 - 0.6 * z * z; y *= 1 - 0.45 * z; y -= 0.1 * z * z; } else if (y > 0) y *= 1 + 0.32 * -z; o.set(x, y, z * 1.85); },
    cip: (u, w, o) => { s5(u, w, o); const z = o.z; let y = o.y * 0.42; if (z > 0 && y > 0) y *= 1 - 0.22 * z * z; o.set(o.x * 0.8, y, z * 1.76); },
    roket: (u, w, o) => { s22(u, w, o); const z = o.z, k = z > 0 ? 1 - 0.3 * z * z * z : 1 + 0.55 * z * z; o.set(o.x * 0.8 * k, o.y * 0.46 * k, z * 1.9); },
    dondurma: (u, w, o) => { s35(u, w, o); const z = o.z; let y = o.y * 0.44; if (z > 0 && y > 0) y *= 1 - 0.3 * Math.pow(z, 1.5); o.set(o.x * 0.9, y, z * 1.78); },
    unicorn: (u, w, o) => { s26(u, w, o); const z = o.z; let y = o.y * 0.42; if (z < 0 && y > 0) y *= 1 + 0.1 * -z; o.set(o.x * 0.88, y, z * 1.8); },
    itfaiye: (u, w, o) => { s5(u, w, o); const z = o.z; let y = o.y * 0.42; if (z > 0 && y > 0) y *= 1 - 0.12 * z * z; o.set(o.x * 0.84, y, z * 1.78); },
    ejderha: (u, w, o) => { s26(u, w, o); const z = o.z; let x = o.x * 0.88; if (z < 0) x *= 1 - 0.24 * z * z; o.set(x, o.y * 0.42, z * 1.8); },
    ucak: (u, w, o) => { s22(u, w, o); const z = o.z, k = z > 0 ? 1 - 0.22 * z * z * z : 1 - 0.42 * z * z; o.set(o.x * 0.8 * k, o.y * 0.46 * k + (z < 0 ? 0.13 * z * z : 0), z * 1.9); }
  };
})();
const arAlevMat = new T.MeshBasicMaterial({ color: 0xffb02e });
const arNk = new T.Vector3(), AR_KROM = 0xe9edf3;
function arAnten(ek, x, yy, z, boy, renk) {   // ince, sallanan anten; ucunda renkli top (arabaYerlestir 'anten' olarak canlandırır)
  const gr = new T.Group(), ay = arYapi(); gr.position.set(x, yy, z); gr.userData.ek = 'anten';
  arKat(ay, G.kutu, 0x3a404c, 0, boy / 2, 0, 0.028, boy, 0.028); arKat(ay, arM, 0xc9cfd9, 0, 0.02, 0, 0.055, 0.04, 0.055); arKat(ay, arM, renk, 0, boy, 0, 0.085);
  arBitir(ay, gr, arBoya); ek.push(gr);
}
function arTipGovde(y, ek, tip, renk, renk2, alt, tkr) {   // kart dışındaki gövdeler; hareketli parçalar ek[] içine (userData.ek = tür)
  const PI = Math.PI, gri = 0xc9cfd9, yuk = tkr.yuk;
  const krom = AR_KROM;
  const far = (x, yy, z, r) => { arKat(y, arInceHalka, krom, x, yy, z + r * 0.12, r * 1.02, r * 0.98, r * 1.5); arKat(y, arK, 0xfff3b0, x, yy, z, r, r * 0.95, r * 0.7); arKat(y, arM, 0xffffff, x, yy + 0.01, z + r * 0.42, r * 0.5, r * 0.47, r * 0.4); };
  const stop = (x, yy, z, r) => { arKat(y, arK, AR_KOYU, x, yy, z + 0.03, r * 1.55, r * 1.3, 0.06); arKat(y, arK, 0xff3b30, x, yy, z - 0.015, r * 1.2, r * 0.98, 0.06); arKat(y, arM, 0xffa08c, x - r * 0.3, yy + r * 0.32, z - 0.065, r * 0.42, r * 0.24, 0.02); };
  const egzoz = (x, yy, z, r) => arKat(y, arInceHalka, krom, x, yy, z, r, r, r * 1.6);   // egzoz ağzında parlak halka
  const nokta = (f, u, w, oy) => { f(u, w, arNk); arNk.y += oy; arNk.z -= 0.05; return arNk; };   // gövde yüzeyinde bir nokta
  const hareketli = (tr, px, py, pz, kur) => { const gr = new T.Group(), yy = arYapi(); gr.position.set(px, py, pz); gr.userData.ek = tr; kur(yy); arBitir(yy, gr, arBoya); ek.push(gr); return gr; };
  const camurluk = (renkC, kalin) => { for (const x of [-1, 1]) for (const zz of [-1, 1]) { const r = (zz < 0 ? tkr.ra : tkr.ro) + 0.07; arKat(y, arCamurluk, renkC, x * 0.96, (zz < 0 ? tkr.ra : tkr.ro) - yuk, zz * 1.05, r, r, r * (kalin || 1), 0, PI / 2); } };
  for (const z of [-1, 1]) arKat(y, G.sil, AR_KOYU, 0, (z < 0 ? tkr.ra : tkr.ro) - yuk, z * 1.05, 0.06, 1.8, 0.06, 0, 0, PI / 2);   // dingiller
  if (tip === 'yaris') {
    // alçak, sivri burunlu yarış arabası: ön kanat, yan kutular, iki katlı arka kanat
    arKat(y, arGovdeYuzey(arTipF.yaris, i => (i === 5 || i === 6) ? renk2 : (i === 4 || i === 7) ? 0xffffff : i > 12 ? alt : renk), null, 0, 0.68, -0.05, 1, 1, 1);
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
      arKat(y, arM, renk2, x * 0.53, 1.03, 0.32, 0.1, 0.065, 0.05); arKat(y, G.kutu, AR_KOYU, x * 0.48, 0.96, 0.32, 0.03, 0.12, 0.03);   // aynalar
      egzoz(x * 0.42, 0.56, -2.01, 0.095);
    }
    arKat(y, arHap(0.065, 0.9), AR_KOYU, 0, 0.42, -1.84, 1, 1, 1, 0, 0, PI / 2);                    // alçak arka tampon
    arKat(y, arTomb, renk2, 0, 1.5, -1.68, 0.96, 0.045, 0.27, 0.12);
    arKat(y, arTomb, renk, 0, 1.33, -1.76, 0.96, 0.03, 0.15, 0.12);
    arKat(y, arK, renk, 0, 1.12, -1.2, 0.22, 0.26, 0.5);
  } else if (tip === 'cip') {
    // yüksek arazi aracı: kocaman tekerler, koruma demiri, tepe lambaları, arkada yedek teker
    arKat(y, arGovdeYuzey(arTipF.cip, i => (i > 12 || i === 0 || i === 12) ? alt : renk), null, 0, 0.6, -0.05, 1, 1, 1);
    for (const x of [-1, 1]) {
      arKat(y, arHap(0.06, 0.34), gri, x * 0.36, 0.68, 1.8, 1, 1, 1);
      arKat(y, arHap(0.065, 0.6), gri, x * 0.92, 0.33, 0, 1, 1, 1, PI / 2);
      far(x * 0.5, 0.8, 1.66, 0.15); stop(x * 0.66, 0.66, -1.8, 0.09);
      arKat(y, arTomb, renk2, x * 0.808, 0.72, 0, 0.012, 0.05, 0.36);
      for (const xx of [0.17, 0.5]) { arKat(y, arK, renk2, x * xx, 2.07 - xx * xx * 0.72, -1.0, 0.13, 0.13, 0.13); arKat(y, arK, 0xfff3b0, x * xx, 2.07 - xx * xx * 0.72, -0.93, 0.1, 0.1, 0.08); }
    }
    camurluk(alt, 3.4);
    arKat(y, arTomb, 0x2b3038, 0, 0.8, 1.69, 0.3, 0.13, 0.04);                                     // ızgara: dik parlak çubuklar
    for (let i = 0; i < 4; i++) arKat(y, G.kutu, krom, (i - 1.5) * 0.14, 0.8, 1.725, 0.05, 0.2, 0.02);
    arKat(y, arHap(0.065, 0.62), AR_KOYU, 0.74, 1.3, 0.62, 1, 1, 1); arKat(y, arK, AR_KOYU, 0.74, 1.68, 0.66, 0.1, 0.09, 0.13);   // şnorkel
    arAnten(ek, -0.6, 1.0, -1.5, 1.05, renk2);
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
    arKat(y, arGovdeYuzey(arTipF.roket, (i, j) => (j >= 9 || j === 2) ? renk2 : i > 12 ? alt : renk), null, 0, 0.6, -0.05, 1, 1, 1);
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
      arKat(y, arInceHalka, gri, x * 0.8, 0.7, -0.05, 0.13, 0.13, 0.13, 0, PI / 2); arKat(y, arK, 0x8fd8ff, x * 0.785, 0.7, -0.05, 0.03, 0.115, 0.115);   // ikinci küçük pencere
    }
    arKat(y, G.sil, krom, 0, 0.6, 2.0, 0.018, 0.34, 0.018, PI / 2); arKat(y, arM, renk2, 0, 0.6, 2.17, 0.05);   // burun anteni
    arKat(y, G.sil, 0xff8a2a, 0, 0.6, -2.1, 0.3, 0.05, 0.3, PI / 2);                                        // egzozun içi hep sıcak görünür
    camurluk(renk2, 1.3);
    arKat(y, G.sil, gri, 0, 0.6, -1.93, 0.44, 0.3, 0.44, PI / 2);
    arKat(y, arJantHalka, 0xeef1f6, 0, 0.6, -2.08, 0.44, 0.44, 0.44);   // arkadan hep görünür: yuvarlak ağız
    arKat(y, G.sil, 0x23262e, 0, 0.6, -1.945, 0.36, 0.3, 0.36, PI / 2);
    const al = new T.Mesh(arKoniGeo, arAlevMat); al.position.set(0, 0.6, -2.02); al.rotation.x = -PI / 2; al.scale.set(0.26, 0.4, 0.26); al.userData.ek = 'alev'; ek.push(al);
  } else if (tip === 'dondurma') {
    // dondurma arabası: külah rengi alt, şeritli tente, arkada kocaman sallanan dondurma
    const kulah = 0xe2a95f, kulahK = 0xc98a45;
    arKat(y, arGovdeYuzey(arTipF.dondurma, (i, j) => (i > 12 || i === 0 || i === 12) ? kulah : (j % 2 ? 0xfffaf2 : renk)), null, 0, 0.58, -0.05, 1, 1, 1);
    arKat(y, arHap(0.11, 1.3), kulahK, 0, 0.4, 1.76, 1, 1, 1, 0, 0, PI / 2);
    arKat(y, arHap(0.1, 1.3), kulahK, 0, 0.4, -1.84, 1, 1, 1, 0, 0, PI / 2);
    for (const x of [-1, 1]) { far(x * 0.5, 0.7, 1.64, 0.14); stop(x * 0.66, 0.84, -1.8, 0.09); arKat(y, arHap(0.05, 1.5), renk2, x * 0.905, 0.6, 0, 1, 1, 1, PI / 2); }
    camurluk(renk2, 1.5);
    {   // burunda çikolata sosu (şeker serpintisi kaldırıldı: sade)
      for (let i = 0; i < 9; i++) { const p = nokta(arTipF.dondurma, 0.07 + i * 0.045, 0.765, 0.58); arKat(y, arM, 0x7a4a2e, p.x, p.y - 0.01 - (i % 2) * 0.05, p.z + 0.01, 0.095, 0.1 + (i % 2) * 0.06, 0.07); } }
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
        arKat(yy, arSil, kulahK, x * 0.2, 0.98, -0.12, 0.06, 0.62, 0.06, 0.25, 0, -x * 0.55);       // gofret çubuğu
        for (let i = 0; i < 5; i++) { const an = i * 2.4 + x, yk = 0.5 + (i % 3) * 0.08, rr = 0.52 * Math.sqrt(Math.max(0, 1 - Math.pow((yk - 0.4) / 0.42, 2))); arKat(yy, G.kutu, sr[i % 5], Math.cos(an) * rr * 1.08, yk, Math.sin(an) * rr * 1.0, 0.1, 0.035, 0.035, 0, -an + i, 0.6); }
      }
      yy.taban = null;
    });
  } else if (tip === 'unicorn') {
    // tek boynuzlu at: önde baş ve altın boynuz, savrulan gökkuşağı yele, arkada kuyruk
    const yele = [0xff8fb1, 0xffc06a, 0xfff07a, 0x9fe89a, 0x8fd0ff, 0xc7a5ff], altin = 0xffd23e;
    arKat(y, arGovdeYuzey(arTipF.unicorn, i => i > 12 ? alt : renk), null, 0, 0.6, -0.05, 1, 1, 1);
    // Boyun yana eğik: at başını sürücünün yanından uzatır, arkadan boynuz, yele ve kulaklar görünür.
    const arUM = new T.Matrix4().makeTranslation(0.15, 1.0, 1.2).multiply(new T.Matrix4().makeRotationZ(-0.45)).multiply(new T.Matrix4().makeTranslation(0, -1.0, -1.2));
    y.taban = arUM;
    arKat(y, arHap(0.27, 0.72), renk, 0, 1.5, 1.2, 1, 1, 1, 0.16);                                   // uzun boyun: baş sürücünün üstünden görünür
    // gökkuşağı yele ensede (arkadan görünür): iki parça, ayrı ayrı dalgalanır
    for (const [bas, son, pv] of [[0, 3, [0, 1.98, 1.06]], [3, 6, [0, 1.42, 0.98]]]) {
      const pp = new T.Vector3(pv[0], pv[1], pv[2]).applyMatrix4(arUM);
      hareketli('yele2', pp.x, pp.y, pp.z, yy => {
        yy.taban = new T.Matrix4().makeTranslation(-pp.x, -pp.y, -pp.z).multiply(arUM);
        for (let i = bas; i < son; i++) { const yh = 2.46 - i * 0.2; arKat(yy, arK, yele[i], (i % 2 ? 0.045 : -0.045), yh, 0.97 + (yh - 1) * 0.13 + (i === 0 ? 0.12 : 0), 0.22, 0.18, 0.21, 0.3); arKat(yy, arM, 0xffffff, (i % 2 ? 0.045 : -0.045) * 1.6, yh + 0.07, 0.97 + (yh - 1) * 0.13 + (i === 0 ? 0.12 : 0) - 0.08, 0.06, 0.04, 0.05); }
        yy.taban = null;
      }).userData.faz = bas * 0.7;
    }
    y.taban = arUM.clone().multiply(new T.Matrix4().makeTranslation(0, 0.5, -0.22));
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
    for (let i = 0; i < 3; i++) arKat(y, arCamurluk, yele[i * 2], 0, 0.5, -1.84, 0.42 - i * 0.085, 0.42 - i * 0.085, 1.6);   // arkada gökkuşağı kemeri
    arKat(y, arHap(0.1, 0.9), renk2, 0, 0.42, -1.8, 1, 1, 1, 0, 0, PI / 2);
    arKat(y, arHalka, renk2, 0, 1.02, 1.12, 0.3, 0.3, 0.3, PI / 2 + 0.17);                         // tasma
    arKat(y, arYildizGeo, altin, 0, 0.95, 1.46, 0.1, 0.1, 0.1, 0.3);
    hareketli('kuyruk', 0, 0.98, -1.72, yy => { for (let i = 0; i < 6; i++) arKat(yy, arK, yele[i], Math.sin(i * 1.9) * 0.06, 0.06 + i * 0.16 - i * i * 0.008, -0.08 - i * 0.09 - i * i * 0.014, 0.2 - i * 0.015, 0.18, 0.21 - i * 0.01, -0.25 - i * 0.16); arKat(yy, arK, renk2, 0, -0.03, 0, 0.19, 0.13, 0.17); });   // kabarık, yukarı kıvrık kuyruk
  } else if (tip === 'itfaiye') {
    // itfaiye: köşeli kırmızı gövde, beyaz kuşak, sağ yanda merdiven, solda hortum makarası, tepede yanıp sönen mavi lamba
    const beyaz = 0xffffff;
    arKat(y, arGovdeYuzey(arTipF.itfaiye, i => i > 12 ? alt : (i === 0 || i === 12) ? beyaz : renk), null, 0, 0.6, -0.05, 1, 1, 1);
    arKat(y, arHap(0.1, 1.35), gri, 0, 0.4, 1.79, 1, 1, 1, 0, 0, PI / 2);
    arKat(y, arHap(0.09, 1.3), gri, 0, 0.4, -1.85, 1, 1, 1, 0, 0, PI / 2);
    arKat(y, arTomb, 0x39424f, 0, 0.7, 1.72, 0.42, 0.11, 0.04);                                    // ızgara
    for (const x of [-1, 1]) { far(x * 0.6, 0.74, 1.66, 0.14); stop(x * 0.66, 0.78, -1.8, 0.09); arKat(y, arM, 0x3aa0ff, x * 0.6, 0.97, 1.56, 0.075, 0.05, 0.075); }
    camurluk(renk2, 2.2);
    arKat(y, arTomb, renk2, 0, 1.03, 0.95, 0.12, 0.012, 0.62);
    for (let i = 0; i < 3; i++) arKat(y, G.kutu, krom, 0, 0.64 + i * 0.06, 1.765, 0.74, 0.02, 0.02);   // ızgara çubukları
    arKat(y, arSil, gri, -0.5, 1.06, 0.8, 0.11, 0.12, 0.11); arKat(y, arSil, renk2, -0.5, 1.22, 0.98, 0.06, 0.5, 0.06, 1.15); arKat(y, arSil, krom, -0.5, 1.33, 1.21, 0.075, 0.1, 0.075, 1.15);   // su topu
    arKat(y, arTomb, renk2, 0, 0.57, -1.835, 0.52, 0.03, 0.02);                                    // arkada sarı kuşak
    for (const x of [-1, 1]) arKat(y, arTomb, renk2, x * 0.846, 0.5, 0, 0.012, 0.035, 0.42);
    arKat(y, arInceHalka, krom, 0, 2.03, -1.0, 0.2, 0.2, 0.3, PI / 2);
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
    arKat(y, arGovdeYuzey(arTipF.ejderha, i => i > 12 ? acik : renk), null, 0, 0.6, -0.05, 1, 1, 1);
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
      stop(x * 0.56, 0.74, -1.62, 0.085);
    }
    camurluk(renk2, 1.5);
    for (const x of [-1, 1]) {
      arKat(y, G.koni, krem, x * 0.12, 0.83, 1.97, 0.035, 0.09, 0.035, PI);                        // minik dişler
      for (let i = 0; i < 3; i++) arKat(y, arKoniGeo, krem, x * (0.86 + i * 0.1), 0.4, 1.56, 0.045, 0.15, 0.045, PI / 2);   // pençeler
    }
    for (let i = 0; i < 4; i++) arKat(y, arKoniGeo, renk2, 0, 0.99 - i * i * 0.012, -1.0 - i * 0.24, 0.13, 0.34 - i * 0.03, 0.15, -0.3);   // sırt ibikleri
    hareketli('kanatcik', 0, 1.12, -0.72, yy => { for (const x of [-1, 1]) {   // yuvarlak yaprak kanatlar: yanlarda, yukarı ve geriye açık; sürüşte çırpar
      arKat(yy, arK, renk, x * 1.0, 0, 0, 0.1, 0.34, 0.12, 0, 0, -x * 0.5);
      for (let i = 0; i < 3; i++) arKat(yy, arYuzDetay, i === 1 ? 0x9be38a : renk2, x * (1.3 + i * 0.07), 0.38 - i * 0.13, -0.06 - i * 0.25, 0.2, 0.4 - i * 0.05, 0.08, -0.5 - i * 0.35, 0, -x * (0.75 + i * 0.12));
    } });
    hareketli('kuyruk', 0, 0.86, -1.66, yy => {
      for (let i = 0; i < 6; i++) arKat(yy, arK, i % 2 ? renk : acik, 0, 0.02 + i * 0.05 + i * i * 0.022, -0.08 - i * 0.17, 0.25 - i * 0.03, 0.23 - i * 0.027, 0.24 - i * 0.02);
      for (let i = 0; i < 4; i++) arKat(yy, arKoniGeo, renk2, 0, 0.2 + i * 0.05 + i * i * 0.022, -0.1 - i * 0.17, 0.09, 0.24 - i * 0.03, 0.11, -0.5);
      arKat(yy, G.koni, renk2, 0, 1.0, -1.08, 0.26, 0.46, 0.09, -0.9);                             // kuyruk ucunda yaprak
    });
  } else if (tip === 'ucak') {
    // küçük uçak-araba: yuvarlak gövde, iki yanda kanat, arkada kuyruk, burunda dönen pervane
    arKat(y, arGovdeYuzey(arTipF.ucak, (i, j) => j >= 10 ? renk2 : i > 12 ? alt : (i === 5 || i === 6) ? renk2 : renk), null, 0, 0.6, -0.05, 1, 1, 1);
    for (const x of [-1, 1]) {
      arKat(y, arTomb, renk, x * 1.2, 1.02, 0.2, 0.58, 0.05, 0.42, 0, -x * 0.1, x * 0.08);         // kanat
      arKat(y, arTomb, renk2, x * 1.7, 1.065, 0.15, 0.1, 0.055, 0.4, 0, -x * 0.1, x * 0.08);
      arKat(y, G.kutu, AR_KOYU, x * 0.97, 0.9, 0.55, 0.05, 0.3, 0.07, 0.3); arKat(y, G.kutu, AR_KOYU, x * 0.97, 0.9, -0.1, 0.05, 0.3, 0.07, -0.3);
      arKat(y, arTomb, renk, x * 0.48, 0.98, -1.78, 0.42, 0.04, 0.2, 0, -x * 0.12, 0);             // yatay kuyruk
      arKat(y, arTomb, renk2, x * 0.86, 0.985, -1.84, 0.07, 0.045, 0.19, 0, -x * 0.12, 0);
      far(x * 0.28, 0.82, 1.2, 0.085);
      arKat(y, arM, x < 0 ? 0xff3b30 : 0x3ddc6a, x * 1.82, 1.075, 0.15, 0.065);                    // kanat ucu lambaları
      arKat(y, arTomb, 0xffffff, x * 1.47, 1.047, 0.18, 0.05, 0.053, 0.41, 0, -x * 0.1, x * 0.08); // kanatta beyaz şerit
    }
    for (const x of [-1, 1]) { const p = nokta(arTipF.ucak, x > 0 ? 0.06 : 0.44, 0.1, 0.6); stop(p.x, p.y, p.z - 0.02, 0.075); }   // kuyruk altında stoplar
    arKat(y, arK, 0xa9e2ff, 0, 1.13, 0.78, 0.38, 0.2, 0.05, -0.45); arKat(y, arCamurluk, krom, 0, 1.08, 0.775, 0.38, 0.26, 1.2, -0.45);   // ön cam
    arKat(y, arHalka, renk2, 0, 0.6, 1.72, 0.3, 0.19, 0.3);                                        // motor kaportası halkası
    arKat(y, arTomb, renk2, 0, 1.34, -1.8, 0.05, 0.42, 0.27, -0.28);                               // dikey kuyruk
    arKat(y, arTomb, renk, 0, 1.3, -1.74, 0.056, 0.2, 0.13, -0.28);
    arKat(y, arSil, gri, 0, 0.6, 1.86, 0.2, 0.1, 0.2, PI / 2);
    hareketli('pervane', 0, 0.6, 1.93, yy => {
      arKat(yy, arKoniGeo, renk2, 0, 0, 0, 0.17, 0.3, 0.17, PI / 2);
      for (let i = 0; i < 3; i++) { const an = i * PI * 2 / 3; arKat(yy, arTomb, 0x4a5260, -Math.sin(an) * 0.38, Math.cos(an) * 0.38, 0.03, 0.1, 0.36, 0.025, 0, 0, an); arKat(yy, arM, 0xffd84a, -Math.sin(an) * 0.7, Math.cos(an) * 0.7, 0.035, 0.085, 0.06, 0.028, 0, 0, an); }
    });
  }
  // Yeni üç araba: her biri kendi işlevinde (aşağıda, /*GEMI*/ /*POLIS*/ /*KEDI*/). h = bu işlevin ortak yardımcıları.
  else if (tip === 'gemi') arGemiGovde(y, ek, renk, renk2, alt, tkr, { far, stop, egzoz, nokta, hareketli, camurluk });
  else if (tip === 'polis') arPolisGovde(y, ek, renk, renk2, alt, tkr, { far, stop, egzoz, nokta, hareketli, camurluk });
  else if (tip === 'kedi') arKediGovde(y, ek, renk, renk2, alt, tkr, { far, stop, egzoz, nokta, hareketli, camurluk });
  else if (tip === 'tren') arTrenGovde(y, ek, renk, renk2, alt, tkr, { far, stop, egzoz, nokta, hareketli, camurluk });
  else if (tip === 'traktor') arTraktorGovde(y, ek, renk, renk2, alt, tkr, { far, stop, egzoz, nokta, hareketli, camurluk });
  else if (tip === 'ufo') arUfoGovde(y, ek, renk, renk2, alt, tkr, { far, stop, egzoz, nokta, hareketli, camurluk });
}
// Ortak yer tutucu gövde: kart gövdesinin sade kopyası (gövde, tamponlar, farlar, stoplar, çamurluklar, arka kanat).
// Kabin, koltuk, direksiyon, sürücü ve tekerleri araba() kendisi ekler. Yeni tipler bunu kullanmak ZORUNDA DEĞİL.
function arKartKopya(y, renk, renk2, alt, h) {
  arKat(y, arGovdeYuzey(arGovdeF, i => (i === 5 || i === 6 || i === 0 || i === 12) ? renk2 : i > 11 ? alt : renk), null, 0, 0.62, -0.05, 1, 1, 1);
  arKat(y, arHap(0.11, 1.3), renk2, 0, 0.42, 1.8, 1, 1, 1, 0, 0, Math.PI / 2);                        // ön tampon
  arKat(y, arHap(0.08, 1.2), AR_KOYU, 0, 0.4, -1.86, 1, 1, 1, 0, 0, Math.PI / 2);                     // arka tampon
  arKat(y, arTomb, renk2, 0, 1.46, -1.62, 1.02, 0.055, 0.27, 0.1);                                  // arka kanat
  for (const x of [-1, 1]) {
    arKat(y, arHap(0.2, 0.55), renk2, x * 0.9, 0.5, 0, 1, 1, 1, Math.PI / 2);                         // yan yastıklar
    h.far(x * 0.4, 0.72, 1.62, 0.14);
    h.stop(x * 0.71, 0.655, -1.8, 0.1);
    arKat(y, arTomb, renk, x * 1.0, 1.4, -1.6, 0.05, 0.2, 0.32);                                    // kanat yan levhaları
  }
  h.camurluk(renk);
}
/*GEMI*/
// Korsan gemisi: tombul ahşap tekne (tahta kuşakları, pahlı küpeşte, yükselen uçlar, düz kıç aynası), önde kıvrık pruva,
// önde kısa direkte küçük dolgun çizgili yelken ve gülen yüzlü bayrak (ikisi de salınır), arkada iki fener ve dümen palası.
// Yelken sürücünün önünde ve alçak: arkadan bakan kamerada büyük kısmı Feza'nın başının arkasında kalır, yol görünür.
const arGemiYum = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const arGemiF = (() => { const sb = arSuper(3.2); return (u, w, o) => {
  sb(u, w, o);
  const sA = Math.sin(u * Math.PI * 2), sB = Math.sin(w * Math.PI), uc = arGemiYum(0.12, 0.42, sB);
  const x = o.x, yv = o.y; let z = o.z;
  if (z < 0) z = -Math.pow(-z, 0.72);                                            // kıç aynası daha dolgun ve düz
  let X = x * 0.92 * (1 + 0.1 * yv), Y = yv * 0.42;
  X *= z > 0 ? 1 - 0.6 * z * z : 1 - 0.1 * z * z;                                 // önde sivri pruva
  if (yv > 0) {
    Y += (0.2 * z * z + (z > 0 ? 0.16 * z * z * z : 0)) * Math.min(1, yv * 1.6);   // uçlara doğru yükselen küpeşte çizgisi
    Y += 0.075 * Math.exp(-Math.pow((sA - 0.78) / 0.09, 2)) * uc;                    // küpeşte kabarığı
    Y -= 0.06 * arGemiYum(0.88, 0.96, sA) * uc;                                    // güverte içeride, küpeştenin altında
  }
  o.set(X, Y, z * 1.84 + (z > 0 && yv > 0 ? 0.12 * yv * z : 0));
}; })();
// Kalınlığı olan yumuşak yastık: gen (X yarı eni), yuk (Y), kal (Z kalınlık); sis = öne doğru dolgunluk, dalga = enine dalgalanma. renkF(j) = X boyunca şerit.
// Önce düz yastık kurulur (yüz yönleri doğru kalsın), sonra köşeler ve normaller bükülür.
function arGemiYastik(gen, yuk, kal, sis, dalga, renkF, nu, nv) {
  const sb = arSuper(4), g = arYuzey(nu || 12, nv || 14, (u, w, o) => { sb(u, w, o); o.set(o.z * gen, o.y * yuk, o.x * kal); }, (i, j) => renkF(j));
  const p = g.attributes.position, n = g.attributes.normal;
  for (let k = 0; k < p.count; k++) {
    const X = p.getX(k) / gen, Yy = p.getY(k) / yuk, ax = 1 - X * X, ay = 1 - 0.55 * Yy * Yy;
    const bx = (sis * -2 * X * ay + dalga * 4.2 * Math.cos(X * 4.2)) / gen, by = sis * ax * -1.1 * Yy / yuk, nz = n.getZ(k);
    p.setZ(k, p.getZ(k) + sis * ax * ay + dalga * Math.sin(X * 4.2));
    arV.set(n.getX(k) - bx * nz, n.getY(k) - by * nz, nz).normalize(); n.setXYZ(k, arV.x, arV.y, arV.z);
  }
  return g;
}
function arGemiGovde(y, ek, renk, renk2, alt, tkr, h) {   // korsan gemisi (öne +Z)
  const PI = Math.PI, koyu = arKoyult(renk, 0.74), kuskak = arKoyult(renk, 0.86), guverte = new T.Color(renk).lerp(new T.Color(0xffd9a0), 0.45).getHex(), guverteK = arKoyult(guverte, 0.9);
  const altin = 0xf2c14e, kirmizi = 0xe8453c, lacivert = 0x2b3a67;
  // gövde: kuşak kuşak tahta, yanda renk2 kuşak, üstte açık renk güverte, altı koyu
  arKat(y, arYuzey(48, 24, arGemiF, (i, j) => { const k = i < 24 ? Math.min(i, 23 - i) : -Math.min(i - 24, 47 - i) - 1;   // k: yan (0) → tepe (11), alt (-12)
    if (k >= 10) return (i % 2) ? guverte : guverteK;                             // güverte tahtaları
    if (k >= 6) return koyu;                                                      // küpeşte
    if (k === 3) return renk2;                                                    // yan kuşak
    if (k <= -7) return alt;
    return (k & 1) ? kuskak : renk; }), null, 0, 0.6, -0.05, 1, 1, 1);
  // kıvrık pruva: önde yükselip geriye kıvrılan gövde ucu, ucunda altın sarmal
  for (let i = 0; i < 10; i++) { const a = i / 9; arKat(y, i < 9 ? arM : arK, i < 9 ? koyu : altin, 0, 0.74 + a * 0.78 - a * a * 0.08, 1.86 + a * 0.26 - a * a * a * 0.14, 0.11 - a * 0.03, 0.12, 0.12 - a * 0.025); }
  arKat(y, arHalka, altin, 0, 1.56, 2.0, 0.13, 0.13, 0.4, 0, PI / 2, 0);
  arKat(y, arM, altin, 0, 1.56, 2.0, 0.06);
  // yanlarda pirinç çerçeveli lumbuz pencereleri
  for (const x of [-1, 1]) {
    for (const z of [-0.18, 0.28]) {
      arKat(y, arInceHalka, altin, x * 0.94, 0.62, z, 0.11, 0.11, 0.6, 0, PI / 2, 0);
      arKat(y, arM, 0xbfe9ff, x * 0.925, 0.62, z, 0.03, 0.095, 0.095);
      arKat(y, arM, 0xffffff, x * 0.95, 0.66, z + 0.03, 0.01, 0.03, 0.025);
    }
  }
  h.camurluk(koyu, 1.6);
  // kıç aynası: altın kemer, iki küçük sarı pencere, stoplar, ortada dümen palası; köşelerde direkli fenerler
  arKat(y, arCamurluk, altin, 0, 0.74, -1.88, 0.74, 0.44, 1.0);
  for (const x of [-1, 1]) {
    arKat(y, arTomb, koyu, x * 0.53, 0.92, -1.86, 0.13, 0.12, 0.03);
    arKat(y, arTomb, 0xffe08a, x * 0.53, 0.92, -1.885, 0.095, 0.085, 0.02);
    arKat(y, G.kutu, koyu, x * 0.53, 0.92, -1.9, 0.015, 0.17, 0.01);
    h.stop(x * 0.62, 0.6, -1.82, 0.08);
    arKat(y, arSil, koyu, x * 0.6, 1.3, -1.62, 0.03, 0.34, 0.03);
    arKat(y, arSil, koyu, x * 0.6, 1.46, -1.62, 0.085, 0.03, 0.085);
    arKat(y, arK, 0xffd36b, x * 0.6, 1.55, -1.62, 0.075, 0.09, 0.075);
    arKat(y, arInceHalka, altin, x * 0.6, 1.55, -1.62, 0.08, 0.08, 1.4, PI / 2);
    arKat(y, G.koni, koyu, x * 0.6, 1.68, -1.62, 0.09, 0.1, 0.09);
    arKat(y, arM, altin, x * 0.6, 1.75, -1.62, 0.03);
  }
  arKat(y, arTomb, koyu, 0, 0.36, -1.9, 0.045, 0.2, 0.14);                       // dümen palası
  // direk (sürücünün önünde) ve üst seren; yelken arkadan bakınca Feza'nın başının üstünden az görünür
  const dz = 1.36, sy = 2.36;
  arKat(y, arSil, koyu, 0, 1.9, dz, 0.05, 1.9, 0.05);
  arKat(y, arSil, koyu, 0, 0.98, dz, 0.1, 0.06, 0.1);
  arKat(y, arM, altin, 0, 2.86, dz, 0.06);
  arKat(y, arHap(0.034, 1.3), koyu, 0, sy, dz, 1, 1, 1, 0, 0, PI / 2);
  for (const x of [-1, 1]) arKat(y, arM, altin, x * 0.69, sy, dz, 0.045);
  // yelken: üst serenden sarkar, öne dolgun, krem-kırmızı dikey çizgili (renk2 + kırmızı)
  const sr = renk2 === kirmizi ? 0xffffff : kirmizi;
  h.hareketli('yele2', 0, sy, dz, yy => {
    arKat(yy, arGemiYastik(0.62, 0.36, 0.035, 0.13, 0, j => (j >> 1) % 2 ? sr : renk2), null, 0, -0.4, 0.02, 1, 1, 1);
    arKat(yy, arHap(0.028, 1.12), koyu, 0, -0.78, 0.03, 1, 1, 1, 0, 0, PI / 2);
  }).userData.faz = 0.6;
  // bayrak: direk tepesinde, geriye dalgalanır; lacivert üstünde iki yanda gülen sarı yüz
  h.hareketli('yele', 0, 2.74, dz, yy => {
    arTaban(yy, 0, 0, -0.22, -0.15, PI / 2, 0);
    arKat(yy, arGemiYastik(0.21, 0.13, 0.025, 0, 0.025, () => lacivert, 8, 10), null, 0, -0.03, 0, 1, 1, 1);
    yy.taban = null;
    arTaban(yy, 0, -0.06, -0.24, -0.15, 0, 0);
    for (const s of [-1, 1]) {
      arKat(yy, arM, 0xffd23e, s * 0.03, 0, 0, 0.02, 0.08, 0.08);
      for (const e of [-1, 1]) arKat(yy, arM, lacivert, s * 0.045, 0.02, e * 0.028, 0.008, 0.016, 0.012);
      arKat(yy, arGulus, lacivert, s * 0.045, -0.006, 0, 0.035, 0.035, 0.02, 0, PI / 2, PI);
    }
    yy.taban = null;
  });
}
/*/GEMI*/
/*POLIS*/
// Polis arabası: tombul gövde, kapılarda sabit beyaz kuşak + damalı şerit + altın yıldız rozet, arkada kemer üstünde kırmızı-mavi tepe lambası.
// Beyaz kuşak, rozet ve tepe lambası renkten bağımsız: anne/baba/Pırıl renginde de "polis arabası" okunur.
const arPolisF = (() => { const s = arSuper(3.6); return (u, w, o) => { s(u, w, o); const z = o.z; let x = o.x * 0.88, y = o.y * 0.44; if (z > 0) { x *= 1 - 0.12 * z * z; if (y > 0) y *= 1 - 0.32 * Math.pow(z, 1.6); } else if (y > 0) y *= 1 + 0.08 * -z; o.set(x, y, z * 1.8); }; })();
const arPolisKemer = new T.TorusGeometry(0.62, 0.075, 6, 16, Math.PI);   // lamba kemeri (yarım halka)
const arPolisLambaRenk = [[1.0, 0.13, 0.1], [0.1, 0.42, 1.0]];   // kırmızı, mavi (parlak hâl)
function arPolisLamba(ek, x, yy, z, s, k) {   // kendinden parlayan lamba kubbesi; iki renk sırayla, yumuşakça (yaklaşık 2 sn'lik döngü) parlar
  const m = new T.Mesh(arLambaGeo, new T.MeshBasicMaterial({ color: 0xffffff })), r = arPolisLambaRenk[k], faz = k * Math.PI;
  m.position.set(x, yy, z); m.scale.set(s, s * 1.2, s); m.userData.ek = 'polisLamba';
  m.onBeforeRender = () => { const b = 0.5 + 0.5 * Math.sin(performance.now() * 0.0032 + faz), p = 0.38 + 0.62 * b * b; m.material.color.setRGB(r[0] * p, r[1] * p, r[2] * p); };
  ek.push(m);
}
function arPolisGovde(y, ek, renk, renk2, alt, tkr, h) {
  const PI = Math.PI, beyaz = 0xffffff, lacivert = 0x1d3f8f, gri = 0xc9cfd9, altin = 0xffc928;
  // gövde: yanda kapı bölgesi beyaz, ortasında damalı şerit; altı bir ton koyu
  arKat(y, arYuzey(48, 24, arPolisF, (i, j) => {
    const a = (i + 0.5) * 7.5, el = a <= 180 ? (a <= 90 ? a : 180 - a) : (a <= 270 ? 180 - a : a - 360);   // yatayın üstünde/altında açı
    if (el < -34) return alt;
    if (j >= 8 && j <= 15 && el < 36) return (el > -8 && el < 8) ? ((j + (i < 24 ? 0 : 1)) % 2 ? renk : beyaz) : beyaz;
    return renk;
  }), null, 0, 0.6, -0.05, 1, 1, 1);
  arKat(y, arHap(0.12, 1.22), renk2, 0, 0.4, 1.76, 1, 1, 1, 0, 0, PI / 2);                          // ön tampon
  arKat(y, arHap(0.11, 1.18), renk2, 0, 0.4, -1.86, 1, 1, 1, 0, 0, PI / 2);                         // arka tampon
  arKat(y, arTomb, 0x2b3038, 0, 0.6, 1.7, 0.24, 0.07, 0.05);                                        // burun ızgarası
  for (let j = 0; j < 2; j++) arKat(y, G.kutu, AR_KROM, 0, 0.578 + j * 0.045, 1.745, 0.38, 0.016, 0.01);
  for (const x of [-1, 1]) {
    // yuvarlak farlar: kaputtan taşan yuva + krem cam + krom çerçeve
    arTaban(y, x * 0.42, 0.79, 1.6, -0.62, x * 0.16, 0);
    arKat(y, arSil, beyaz, 0, 0, -0.02, 0.18, 0.13, 0.175, PI / 2);
    arKat(y, arK, 0xfff3b0, 0, 0, 0.06, 0.145, 0.14, 0.06);
    arKat(y, arInceHalka, AR_KROM, 0, 0, 0.055, 0.165, 0.16, 0.25);
    arKat(y, arM, beyaz, 0.04, 0.045, 0.105, 0.05, 0.045, 0.02);
    y.taban = null;
    h.stop(x * 0.6, 0.72, -1.83, 0.1);
    // kapıda altın yıldız rozet (lacivert yuvarlak zeminde)
    arTaban(y, x * 0.885, 0.74, 0.08, 0, x * PI / 2, 0);
    arKat(y, arSil, lacivert, 0, 0, 0, 0.2, 0.035, 0.2, PI / 2);
    arKat(y, arInceHalka, altin, 0, 0, 0.02, 0.2, 0.2, 0.25);
    arKat(y, arYildizGeo, altin, 0, 0, 0.012, 0.135, 0.135, 0.14);
    y.taban = null;
    arKat(y, arHap(0.035, 0.12), AR_KOYU, x * 0.87, 0.86, -0.42, 1, 1, 1, PI / 2);                   // kapı kolu
  }
  h.camurluk(renk, 2.0);
  // tepe lambası: sürücünün arkasında kalın kemer, üstünde koyu taban; iki ucta kırmızı ve mavi kubbe (kafanın iki yanında, yolu örtmez)
  const lz = -1.08;
  arKat(y, arPolisKemer, renk2, 0, 0.94, lz, 1, 1, 1.25);
  arKat(y, arHap(0.08, 0.98), AR_KOYU, 0, 1.58, lz, 1, 1, 1, 0, 0, PI / 2);
  for (const x of [-1, 1]) {
    arKat(y, arSil, gri, x * 0.48, 1.61, lz, 0.11, 0.06, 0.11);
    arKat(y, arInceHalka, AR_KROM, x * 0.48, 1.645, lz, 0.13, 0.13, 0.3, PI / 2);
    arKat(y, arM, 0xffffff, x * 0.48 + x * 0.03, 1.78, lz - 0.115, 0.035, 0.03, 0.02);   // lambada küçük parıltı
    arKat(y, G.sil, AR_KOYU, x * 0.6, 1.0, 0.36, 0.025, 0.16, 0.025, 0, 0, -x * 0.5);   // yan ayna sapı
    arKat(y, arK, renk2, x * 0.66, 1.08, 0.34, 0.09, 0.07, 0.05, 0, x * 0.2, 0);
    arKat(y, arM, 0xbfe9ff, x * 0.66, 1.08, 0.305, 0.065, 0.05, 0.02, 0, x * 0.2, 0);
  }
  arPolisLamba(ek, 0.48, 1.7, lz, 0.13, 0);
  arPolisLamba(ek, -0.48, 1.7, lz, 0.13, 1);
  arAnten(ek, -0.62, 0.98, -1.42, 0.85, renk2 === beyaz ? 0xff4b4b : renk2);
}
/*/POLIS*/
/*KEDI*/
// Tombul kedi gövdesi: arkası yuvarlak ve kabarık (oturan kedi), burnu kafanın altına doğru alçalır.
const arKediF = (() => { const s = arSuper(2.6); return (u, w, o) => { s(u, w, o); const z = o.z; let y = o.y * 0.44; if (y > 0) y *= z < 0 ? 1 + 0.08 * -z : 1 - 0.16 * z * z; o.set(o.x * 0.9 * (z < 0 ? 1 - 0.05 * z * z : 1), y, z * 1.78); }; })();
const arKediE = new T.Euler(), arKediV = new T.Vector3();
function arKediGovde(y, ek, renk, renk2, alt, tkr, h) {   // kedi araba: tekir gövde, önde yuvarlak kedi yüzü, kulaklar ve sallanan kuyruk hareketli
  const PI = Math.PI, c = new T.Color(renk), hsl = {}; c.getHSL(hsl);
  const ac = c.r * 0.3 + c.g * 0.59 + c.b * 0.11;
  // tekir çizgileri: aynı rengin koyusu (turuncuda sıcak koyu turuncu, griye gri; çok koyu kedide açık çizgi)
  const koyu = ac < 0.22 ? new T.Color(renk).lerp(new T.Color(0xffffff), 0.22).getHex() : new T.Color().setHSL(hsl.h - (hsl.s > 0.25 ? 0.012 : 0), Math.min(1, hsl.s * 1.08), hsl.l * 0.72).getHex();
  const krem = renk2, kremK = arKoyult(renk2, 0.9), pembe = 0xffa3bd, burun = 0xff7f9f, cizgi = 0x3d2a24;
  const biyik = ac < 0.3 ? 0xfff6ea : 0x4a3426;
  // gövde: üstte tekir çizgileri (sırt ve yanlar), altı ve göğüs krem
  arKat(y, arYuzey(48, 24, arKediF, (i, j) => {
    const alt_ = i > 25 && i < 47, ust = Math.abs(i - 12);
    if (alt_ || (j >= 21 && ust > 6)) return i > 30 && i < 42 ? kremK : krem;
    if ((j === 2 || j === 3 || j === 6 || j === 7) && ust < 10) return koyu;                 // arkada sırtı saran iki çizgi
    if ((j === 11 || j === 15 || j === 16) && ust > 4 && ust < 10) return koyu;             // yanlarda kısa çizgiler (kabinin iki yanı)
    return renk;
  }), null, 0, 0.6, -0.05, 1, 1, 1);
  // kafa: yanakları tombul yuvarlak; alt-ön (ağız çevresi) krem, alında üç tekir çizgisi, yanaklarda pembe
  const r0 = new T.Color(renk), rk = new T.Color(krem), rz = new T.Color(koyu), rp = new T.Color(pembe);
  const kg = arYogur(20, 14, v => { v.x *= 1 + 0.13 * Math.exp(-(v.y + 0.25) * (v.y + 0.25) / 0.12); v.y *= 0.93; }, (v, r) => {
    r.copy(r0);
    const ag = clamp((v.z - 0.35) * 2.6, 0, 1) * clamp((0.02 - v.y) * 3.2, 0, 1); r.lerp(rk, ag);
    if (v.y > 0.35 && v.z > -0.45) { const a = Math.atan2(v.x, v.z); let b = 0; for (const m of [-0.42, 0, 0.42]) b = Math.max(b, Math.exp(-(a - m) * (a - m) / 0.006)); r.lerp(rz, b * clamp((v.y - 0.35) * 4, 0, 1)); }
    const dx = Math.abs(v.x) - 0.6, dy = v.y + 0.1; r.lerp(rp, Math.exp(-dx * dx / 0.03 - dy * dy / 0.03) * 0.55 * clamp(v.z * 2, 0, 1));
  });
  arKat(y, kg, null, 0, 1.0, 1.35, 0.6, 0.5, 0.5); kg.dispose();
  for (const x of [-1, 1]) {
    arGoz(y, x * 0.23, 1.07, 1.785, 0.13, true, 0x63c24e, 0.74, x * 0.42);                       // büyük parlak yeşil gözler
    arKat(y, arKapak, cizgi, x * 0.23, 1.082, 1.8, 0.136, 0.136, 0.2, 0, x * 0.42);                // üst kirpik çizgisi
    arKat(y, arK, krem, x * 0.078, 0.9, 1.815, 0.1, 0.07, 0.072);                                 // bıyık yastıkları
    for (let i = 0; i <= 5; i++) { const a = PI * i / 5; arKat(y, arM, cizgi, x * (0.052 + Math.cos(a) * 0.05), 0.835 - Math.sin(a) * 0.032, 1.815 - Math.sin(a) * 0.004, 0.018, 0.016, 0.016); }   // "ω" gülüş
    for (let k = -1; k <= 1; k++) {                                                                // bıyıklar: ince ama yuvarlak, yüzden taşar (önden ve yandan görünür)
      const el = k * 0.17, L = 0.55; arKediE.set(0, x * 0.22, -x * (PI / 2 - el)); arKediV.set(0, 1, 0).applyEuler(arKediE);
      const bx = x * 0.17, by = 0.9 + k * 0.03, bz = 1.86;
      arKat(y, arSil, biyik, bx + arKediV.x * L / 2, by + arKediV.y * L / 2, bz + arKediV.z * L / 2, 0.014, L, 0.014, 0, x * 0.22, -x * (PI / 2 - el));
    }
    // ön patiler: tamponun iki yanında krem, üç parmaklı
    arKat(y, arK, krem, x * 0.5, 0.31, 1.72, 0.2, 0.13, 0.19);
    for (let k = -1; k <= 1; k++) arKat(y, arM, krem, x * 0.5 + k * 0.1, 0.33 + (k ? 0 : 0.015), 1.88, 0.06, 0.065, 0.06);
    // arkada pati biçimli stop lambaları
    arKat(y, arK, AR_KOYU, x * 0.42, 0.72, -1.665, 0.15, 0.12, 0.06); arKat(y, arK, 0xff4a3d, x * 0.42, 0.72, -1.7, 0.122, 0.095, 0.05);
    arKat(y, arM, 0xffb3a3, x * 0.42 - 0.035, 0.75, -1.745, 0.04, 0.022, 0.01);
    for (let k = -1; k <= 1; k++) { const px = x * 0.42 + k * 0.088, py = 0.85 + (k ? 0 : 0.028); arKat(y, arM, 0xff4a3d, px, py, -1.67, 0.045, 0.045, 0.045); }
  }
  arKat(y, arK, burun, 0, 0.965, 1.852, 0.068, 0.048, 0.045);                                     // pembe burun
  arKat(y, arM, 0xffd6e2, -0.02, 0.982, 1.893, 0.022, 0.012, 0.008);
  arKat(y, arHap(0.08, 0.95), kremK, 0, 0.36, -1.78, 1, 1, 1, 0, 0, PI / 2);                    // yumuşak arka tampon
  h.camurluk(renk, 1.6);
  // kulaklar: yumuşak uçlu üçgen, içi pembe; hızlanınca hafifçe geriye yatar (yele2)
  h.hareketli('yele2', 0, 1.4, 1.3, yy => {
    for (const x of [-1, 1]) {
      const dx = x * 0.52, dy = 0.86, bx = x * 0.36;
      arLule(yy, renk, bx, 0.03, 0, dx, dy, 0.04, 0.45, 0.27, 0.085);                             // geniş tabanlı, kısa kedi kulağı (tavşan kulağı gibi uzun değil)
      arLule(yy, koyu, bx + dx * 0.31, 0.03 + dy * 0.31, -0.006, dx, dy, 0.04, 0.15, 0.09, 0.08);   // koyu kulak ucu (arkadan okunur)
      arLule(yy, pembe, bx + x * 0.01, 0.06, 0.055, dx, dy, 0.1, 0.31, 0.16, 0.05);
    }
  }).userData.faz = 1.1;
  // kuyruk: arkadan yukarı kıvrık soru işareti; sürücünün sağ yanında, başından alçakta durur
  const eg = new T.CatmullRomCurve3([[0, 0, 0], [0, 0.15, -0.24], [0.02, 0.39, -0.34], [0.09, 0.58, -0.34], [0.22, 0.68, -0.3], [0.34, 0.63, -0.26], [0.39, 0.5, -0.23]].map(p => new T.Vector3(p[0], p[1], p[2])));
  h.hareketli('kuyruk', 0.36, 0.9, -1.46, yy => {   // tombul, yumuşak kuyruk: iki geniş tekir halkası, koyu uç
    // pürüzsüz tüp: uca doğru incelir, halkalar köşe rengiyle (yumuşak geçişli); boğumlu küre zinciri değil
    const N = 22, R = 8, tg = new T.TubeGeometry(eg, N, 1, R, false), tp = tg.attributes.position, renkler = [], cc = new T.Color(), cr = new T.Color(renk), ck = new T.Color(koyu), m = new T.Vector3();
    const yar = t => 0.15 - t * 0.04, bant = t => Math.max(Math.exp(-Math.pow((t - 0.36) / 0.065, 4)), Math.exp(-Math.pow((t - 0.62) / 0.065, 4)), clamp((t - 0.8) / 0.05, 0, 1));
    for (let i = 0; i <= N; i++) { const t = i / N; eg.getPointAt(t, m); for (let j = 0; j <= R; j++) { const k = i * (R + 1) + j; arKediV.fromBufferAttribute(tp, k).sub(m).multiplyScalar(yar(t)).add(m); tp.setXYZ(k, arKediV.x, arKediV.y, arKediV.z); cc.copy(cr).lerp(ck, bant(t)); renkler.push(cc.r, cc.g, cc.b); } }
    tg.setAttribute('color', new T.Float32BufferAttribute(renkler, 3));
    arKat(yy, tg, null, 0, 0, 0, 1, 1, 1); tg.dispose();
    const uc = eg.getPointAt(1); arKat(yy, arK, koyu, uc.x, uc.y, uc.z, yar(1), yar(1), yar(1));        // yuvarlak uç
    arKat(yy, arK, renk, 0, 0, 0, yar(0), yar(0), yar(0));
  });
}
/*/KEDI*/
function arTrenGovde(y, ek, renk, renk2, alt, tkr, h) {   // buharlı tren (öne +Z): kemerli lokomotif tavanı, pirinç direkler, kömürlük, fenerler, uzun baca, sallanan çan ve biyel kolları
  const PI = Math.PI, pirinc = 0xf2c14e, altin = 0xffd23f, komur = 0x262932, krem = 0xfff3d6, kirmizi = 0xd93829;
  // alt şasi, yan etek ve kırmızı tampon kirişleri (garaj bayrağı için arka sağ köşede z=-1.2, x=0.6 yüzey y≈0.98)
  arKat(y, arTomb, komur, 0, 0.48, -0.05, 0.86, 0.14, 1.78);
  arKat(y, arTomb, renk2, 0, 0.58, -0.05, 0.9, 0.045, 1.8);
  arKat(y, arTomb, kirmizi, 0, 0.44, -1.8, 0.82, 0.11, 0.08);                                       // arka kırmızı tampon kirişi
  arKat(y, arTomb, kirmizi, 0, 0.44, 1.72, 0.82, 0.11, 0.08);                                       // ön kırmızı tampon kirişi
  // arka kömürlük haznesi (heaped coal tender box) ve tepeleme parlak kömür yığını
  arKat(y, arTomb, renk, 0, 0.94, -1.42, 0.8, 0.34, 0.32);
  arKat(y, arTomb, renk2, 0, 1.29, -1.42, 0.84, 0.04, 0.35);                                        // kömürlük sarı kenar çerçevesi
  arKat(y, arTomb, alt, 0, 1.25, -1.42, 0.72, 0.06, 0.25);
  for (let i = -3; i <= 3; i++) {                                                                   // tepeleme kömür parçaları
    const kx = i * 0.17, kz = -1.42 + ((i * 7) % 3) * 0.055, ky = 1.35 + (3 - Math.abs(i)) * 0.038;
    arKat(y, i % 2 ? arK : arCivi, i % 2 ? 0x1b1e24 : 0x2d333d, kx, ky, kz, 0.14, 0.11, 0.13, i * 0.5, i * 0.7);
  }
  for (let i = -2; i <= 2; i++) arKat(y, arK, 0x232830, i * 0.21, 1.33, -1.56, 0.12, 0.09, 0.11);
  // kabin yan duvarları, pencereler ve pirinç köşe direkleri (Feza'nın başı ve yüzü tamamen görünür)
  for (const x of [-1, 1]) {
    arKat(y, arTomb, renk, x * 0.72, 1.06, -0.78, 0.12, 0.48, 0.58);                                // yan kabin duvarları
    arKat(y, arTomb, renk2, x * 0.72, 1.54, -0.78, 0.13, 0.04, 0.6);                                // sarı kabin kenar şeridi
    arKat(y, arHap(0.025, 0.9), pirinc, x * 0.84, 1.2, -0.78, 1, 1, 1, PI / 2);                     // pirinç tutamak
    arKat(y, arTomb, krem, x * 0.845, 1.22, -0.76, 0.015, 0.19, 0.24);                              // pencere çerçevesi
    arKat(y, arTomb, 0xbfe9ff, x * 0.855, 1.22, -0.76, 0.01, 0.14, 0.19);
    // pirinç tavan direkleri (4 köşe: arka ve yan-ön, sürücüyü örtmez)
    arKat(y, arSil, pirinc, x * 0.72, 1.96, -1.24, 0.042, 0.86, 0.042);
    arKat(y, arSil, pirinc, x * 0.72, 1.96, -0.36, 0.042, 0.86, 0.042);
    arKat(y, arM, altin, x * 0.72, 1.58, -1.24, 0.065); arKat(y, arM, altin, x * 0.72, 1.58, -0.36, 0.065);
    // ön silindir buhar pistonu (yanlarda gerçek buharlı lokomotif detayı)
    arKat(y, arSil, komur, x * 0.98, 0.54, 1.05, 0.14, 0.42, 0.14, PI / 2);
    arKat(y, arInceHalka, pirinc, x * 0.98, 0.54, 1.25, 0.13, 0.13, 0.35);
    h.stop(x * 0.52, 0.68, -1.8, 0.085);
  }
  // arka kabin siperliği (bel hizasında, açık kemer altı geniş)
  arKat(y, arTomb, renk, 0, 1.4, -1.24, 0.74, 0.14, 0.08);
  arKat(y, arTomb, renk2, 0, 1.55, -1.24, 0.76, 0.035, 0.1);
  // kemerli lokomotif tavanı (arched locomotive roof canopy: arkadan "çufçuf tren!" silueti)
  arKat(y, arSil, renk, 0, 2.4, -0.8, 0.88, 1.1, 0.24, PI / 2);                                     // kubbeli ana tavan
  arKat(y, arSil, krem, 0, 2.38, -0.8, 0.84, 1.04, 0.22, PI / 2);                                   // krem tavan içi
  for (const x of [-1, 1]) arKat(y, arHap(0.035, 1.1), renk2, x * 0.86, 2.4, -0.8, 1, 1, 1, PI / 2);  // yan saçak şeritleri
  for (const zz of [-1.32, -0.28]) arKat(y, arCamurluk, renk2, 0, 2.39, zz, 0.85, 0.25, 0.55);      // ön ve arka kemer çerçevesi
  arKat(y, arTomb, renk, 0, 2.64, -0.8, 0.3, 0.07, 0.24);                                           // tavan havalandırma kapağı
  arKat(y, arSil, pirinc, 0, 2.72, -0.8, 0.06, 0.12, 0.06);                                         // pirinç düdük
  arKat(y, arK, altin, 0, 2.79, -0.8, 0.08, 0.05, 0.08);
  // arkada iki sıcak parlayan pirinç tren feneri (glowing warm rear train lanterns)
  for (const x of [-1, 1]) {
    arKat(y, arSil, pirinc, x * 0.68, 1.44, -1.66, 0.09, 0.16, 0.09);
    arKat(y, arKoniGeo, komur, x * 0.68, 1.52, -1.66, 0.11, 0.1, 0.11);
    arKat(y, arInceHalka, pirinc, x * 0.68, 1.63, -1.66, 0.05, 0.05, 0.3);
    const fener = new T.Mesh(arK, new T.MeshBasicMaterial({ color: 0xffe270 }));
    fener.position.set(x * 0.68, 1.44, -1.74); fener.scale.set(0.08, 0.08, 0.05); fener.userData.ek = 'trenFener';
    fener.onBeforeRender = () => { const p = 0.82 + 0.18 * Math.sin(performance.now() * 0.005 + x); fener.material.color.setRGB(1 * p, 0.86 * p, 0.38 * p); };
    ek.push(fener);
  }
  // daha dolgun ve yüksek yuvarlak buhar kazanı (+Z)
  arKat(y, arSil, renk, 0, 1.05, 0.98, 0.52, 1.38, 0.52, PI / 2);
  arKat(y, arSil, komur, 0, 1.05, 1.58, 0.53, 0.26, 0.53, PI / 2);                                 // ön duman sandığı
  arKat(y, arK, komur, 0, 1.05, 1.69, 0.51, 0.51, 0.13);
  for (const bz of [0.58, 1.02, 1.44]) arKat(y, arInceHalka, pirinc, 0, 1.05, bz, 0.53, 0.53, 0.6); // pirinç kazan kuşakları
  // büyük pirinç buhar kubbesi
  arKat(y, arK, pirinc, 0, 1.58, 0.78, 0.24, 0.28, 0.24);
  arKat(y, arInceHalka, renk2, 0, 1.49, 0.78, 0.25, 0.25, 0.55, PI / 2);
  arKat(y, arM, altin, 0, 1.86, 0.78, 0.075, 0.05, 0.075);
  // çan askısı (yoke) ve sallanan pirinç çan (onBeforeRender ile neşeyle sallanır)
  arKat(y, arCamurluk, pirinc, 0, 1.52, 1.14, 0.17, 0.22, 0.45);
  const canGr = new T.Group(), cy = arYapi();
  canGr.position.set(0, 1.72, 1.14); canGr.userData.ek = 'trenCan';
  arKat(cy, arKoniGeo, altin, 0, -0.18, 0, 0.125, 0.18, 0.125);
  arKat(cy, arInceHalka, pirinc, 0, -0.18, 0, 0.125, 0.125, 0.45, PI / 2);
  arKat(cy, arM, komur, 0, -0.2, 0, 0.045);
  const canMesh = arBitir(cy, canGr, arBoya);
  canMesh.onBeforeRender = () => { canGr.rotation.z = Math.sin(performance.now() * 0.006) * 0.28; };
  ek.push(canGr);
  // uzun ve gösterişli konik baca
  arKat(y, arSil, komur, 0, 1.78, 1.48, 0.16, 0.54, 0.16);
  arKat(y, arKoniGeo, komur, 0, 2.08, 1.48, 0.26, 0.24, 0.26, PI);
  arKat(y, arInceHalka, pirinc, 0, 2.16, 1.48, 0.24, 0.24, 0.55, PI / 2);
  // ön ızgara (mahmuz / cowcatcher)
  arKat(y, arTomb, renk, 0, 0.36, 1.8, 0.76, 0.14, 0.18, 0.35);
  for (let i = -3; i <= 3; i++) arKat(y, G.kutu, i % 2 ? renk2 : komur, i * 0.18, 0.37, 1.9, 0.055, 0.27, 0.05, 0.42);
  // sıcak parlak ön far
  arKat(y, arSil, pirinc, 0, 1.12, 1.71, 0.21, 0.13, 0.21, PI / 2);
  arKat(y, arK, 0xfff3b0, 0, 1.12, 1.77, 0.175, 0.175, 0.09);
  arKat(y, arM, 0xffffff, 0.04, 1.15, 1.84, 0.065, 0.055, 0.02);
  // büyük puf puf beyaz baca dumanı (5 bulut, onBeforeRender ile yükselir)
  const dumanGr = new T.Group(), dumanMat = new T.MeshLambertMaterial({ color: 0xf9fbff }), dumanlar = [];
  dumanGr.position.set(0, 2.24, 1.48); dumanGr.userData.ek = 'trenDuman';
  for (let i = 0; i < 5; i++) { const pm = new T.Mesh(arK, dumanMat); dumanGr.add(pm); dumanlar.push(pm); }
  dumanlar[0].onBeforeRender = () => {
    const t = performance.now() * 0.0012;
    for (let i = 0; i < 5; i++) {
      const u = (t + i / 5) % 1, s = Math.sin(u * PI) * (0.2 + u * 0.2);
      dumanlar[i].position.set(Math.sin(u * 5.5 + i * 1.3) * 0.09, u * 0.95, -u * 0.55);
      dumanlar[i].scale.setScalar(Math.max(0.01, s));
    }
  };
  ek.push(dumanGr);
  // hareketli yan biyel kolları (onBeforeRender ile tekerlere paralel döner)
  const kolGr = new T.Group(); kolGr.userData.ek = 'trenBiyel';
  const biyelKur = x => {
    const by = arYapi(), bGr = new T.Group();
    arKat(by, arHap(0.048, 1.94), 0xe2e8f0, 0, 0, 0, 1, 1, 1, PI / 2);
    arKat(by, arHap(0.022, 1.7), kirmizi, x * 0.032, 0, 0, 1, 1, 1, PI / 2);                       // kırmızı orta oluk
    for (const pz of [-0.95, 0.95]) arKat(by, arSil, pirinc, 0, 0, pz, 0.085, 0.08, 0.085, 0, 0, PI / 2);
    arBitir(by, bGr, arBoya); bGr.position.set(x * 1.14, 0.48, 0); return bGr;
  };
  const bSol = biyelKur(-1), bSag = biyelKur(1);
  kolGr.add(bSol); kolGr.add(bSag);
  bSol.children[0].onBeforeRender = () => {
    const a = performance.now() * 0.009, dy = Math.sin(a) * 0.14, dz = Math.cos(a) * 0.14;
    bSol.position.y = 0.48 + dy; bSol.position.z = dz;
    bSag.position.y = 0.48 - dy; bSag.position.z = -dz;
  };
  ek.push(kolGr);
}
function arTraktorGovde(y, ek, renk, renk2, alt, tkr, h) {   // neşeli traktör (öne +Z): kalın arka çamurluklar, sarı tepe lambası, kapaklı uzun egzoz, güçlü ön kepçe
  const PI = Math.PI, koyu = AR_KOYU, yuk = tkr.yuk;
  // gövde, motor kaputu ve arka tampon
  arKat(y, arTomb, alt, 0, 0.56, -0.1, 0.68, 0.22, 1.48);
  arKat(y, arTomb, renk, 0, 0.96, 0.88, 0.54, 0.36, 0.66);                                         // motor kaputu
  arKat(y, arTomb, renk2, 0, 1.04, 0.88, 0.555, 0.065, 0.62);                                       // sarı yan şerit
  arKat(y, arTomb, koyu, 0, 0.94, 1.54, 0.44, 0.3, 0.05);                                           // ön radyatör ızgarası
  for (let i = -2; i <= 2; i++) arKat(y, G.kutu, 0xc9cfd9, i * 0.15, 0.94, 1.59, 0.042, 0.44, 0.02);
  arKat(y, arHap(0.08, 1.04), koyu, 0, 0.48, -1.72, 1, 1, 1, 0, 0, PI / 2);                         // arka çeki demiri / tampon
  // dev arka tekerleri saran kalın kemerli çamurluklar + yan basamaklar
  const cy = tkr.ra - yuk, cr = tkr.ra + 0.13;
  for (const x of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const a = -0.3 + k * (PI + 0.45) / 6;
      arKat(y, arTomb, renk, x * 0.98, cy + Math.sin(a) * cr, -1.05 + Math.cos(a) * cr, 0.36, 0.075, 0.22, -a);
      arKat(y, arTomb, renk2, x * 1.17, cy + Math.sin(a) * (cr + 0.01), -1.05 + Math.cos(a) * (cr + 0.01), 0.19, 0.045, 0.2, -a);
    }
    arKat(y, arTomb, koyu, x * 0.98, 0.52, -1.78, 0.34, 0.1, 0.03, 0.15);                           // arka çamurluk paçası
    arKat(y, arTomb, renk2, x * 0.78, 1.0, -1.05, 0.16, 0.05, 0.58);
    h.far(x * 0.54, 1.06, 1.46, 0.135);
    arKat(y, arSil, koyu, x * 0.47, 1.0, 1.42, 0.032, 0.15, 0.032, 0, 0, -x * 0.6);                 // far kolu
    h.stop(x * 0.98, 0.78, -1.76, 0.1);
  }
  // yüksek neşeli kabin kemeri, şapka tentesi ve arka çalışma lambaları (Feza'nın kafasını kapatmaz)
  for (const x of [-1, 1]) {
    arKat(y, arHap(0.055, 1.25), koyu, x * 0.66, 1.62, -0.96, 1, 1, 1);
    arKat(y, arSil, koyu, x * 0.54, 2.25, -1.16, 0.06, 0.08, 0.06, PI / 2);                         // arka çalışma lambası
    arKat(y, arK, 0xfff3b0, x * 0.54, 2.25, -1.21, 0.05, 0.05, 0.03);
  }
  arKat(y, arTomb, renk2, 0, 2.33, -0.92, 0.76, 0.07, 0.36);
  arKat(y, arTomb, renk, 0, 2.38, -0.92, 0.68, 0.05, 0.3);
  // tavan üstünde dönen/parlayan turuncu-kehribar tepe lambası (amber roof beacon)
  arKat(y, arSil, koyu, 0, 2.44, -0.92, 0.11, 0.07, 0.11);
  const tepe = new T.Mesh(arLambaGeo, new T.MeshBasicMaterial({ color: 0xffaa00 }));
  tepe.position.set(0, 2.53, -0.92); tepe.scale.set(0.115, 0.14, 0.115); tepe.userData.ek = 'traktorTepe';
  tepe.onBeforeRender = () => {
    const t = performance.now(), b = 0.5 + 0.5 * Math.sin(t * 0.007), p = 0.55 + 0.45 * b * b;
    tepe.material.color.setRGB(1.0 * p, (0.56 + 0.32 * b) * p, 0.08 * p);
    tepe.rotation.y = t * 0.008;
    tepe.scale.set(0.11 + b * 0.02, 0.135 + b * 0.025, 0.11 + b * 0.02);
  };
  ek.push(tepe);
  // uzun dik gümüş egzoz borusu, şapkalı sallanan yağmur kapağı ve puf puf duman
  arKat(y, arSil, koyu, 0.44, 1.32, 0.96, 0.08, 0.34, 0.08);
  arKat(y, arSil, 0xdce3ec, 0.44, 1.82, 0.96, 0.068, 0.78, 0.068);
  arKat(y, arInceHalka, 0xe9edf3, 0.44, 2.2, 0.96, 0.075, 0.075, 0.35, PI / 2);
  const kapakGr = new T.Group(), ky2 = arYapi();
  kapakGr.position.set(0.44, 2.23, 0.9); kapakGr.userData.ek = 'traktorKapak';
  arKat(ky2, arSil, 0xc9cfd9, 0, 0.015, 0.06, 0.085, 0.025, 0.085);
  arKat(ky2, arM, koyu, 0, 0.02, 0.06, 0.03, 0.02, 0.03);
  const kapakMesh = arBitir(ky2, kapakGr, arBoya);
  kapakMesh.onBeforeRender = () => { kapakGr.rotation.x = -0.25 - Math.abs(Math.sin(performance.now() * 0.007)) * 0.65; };
  ek.push(kapakGr);
  const egGr = new T.Group(), egMat = new T.MeshLambertMaterial({ color: 0xf2f6fa }), egPuf = [];
  egGr.position.set(0.44, 2.28, 0.96); egGr.userData.ek = 'traktorDuman';
  for (let i = 0; i < 3; i++) { const pm = new T.Mesh(arK, egMat); egGr.add(pm); egPuf.push(pm); }
  egPuf[0].onBeforeRender = () => {
    const t = performance.now() * 0.0015;
    for (let i = 0; i < 3; i++) {
      const u = (t + i / 3) % 1, s = Math.sin(u * PI) * (0.12 + u * 0.1);
      egPuf[i].position.set(Math.sin(u * 4 + i) * 0.04, u * 0.58, -u * 0.32);
      egPuf[i].scale.setScalar(Math.max(0.01, s));
    }
  };
  ek.push(egGr);
  // önde güçlü, kalın sarı kepçe kolları, hidrolik piston ve derin dişli kova (onBeforeRender)
  const kepGr = new T.Group(), ky = arYapi();
  kepGr.position.set(0, 0.68, 0.62); kepGr.userData.ek = 'kepce';
  for (const x of [-1, 1]) {
    arKat(ky, arHap(0.068, 1.14), renk2, x * 0.68, -0.05, 0.66, 1, 1, 1, 1.36);
    arKat(ky, arSil, 0xdce3ec, x * 0.68, 0.08, 0.56, 0.032, 0.58, 0.032, 1.15);                       // hidrolik piston
    arKat(ky, arK, koyu, x * 0.68, 0.06, 0.08, 0.095);
  }
  arKat(ky, arTomb, renk2, 0, -0.2, 1.36, 0.86, 0.08, 0.32, -0.15);                                // kova tabanı
  arKat(ky, arTomb, renk2, 0, -0.02, 1.14, 0.86, 0.24, 0.07, 0.25);                                 // kova arka duvarı
  arKat(ky, arTomb, alt, 0, 0.16, 1.14, 0.82, 0.06, 0.08, 0.1);                                     // üst dökülme siperliği
  for (const x of [-1, 1]) arKat(ky, arTomb, renk2, x * 0.84, -0.06, 1.32, 0.06, 0.22, 0.26);       // yan yanaklar
  for (let i = -2; i <= 2; i++) arKat(ky, arKoniGeo, 0xdce3ec, i * 0.32, -0.24, 1.66, 0.055, 0.18, 0.055, PI / 2);   // güçlü kepçe dişleri
  const km = arBitir(ky, kepGr, arBoya);
  km.onBeforeRender = () => { kepGr.rotation.x = Math.sin(performance.now() * 0.0024) * 0.09 - 0.04; };
  ek.push(kepGr);
}
function arUfoGovde(y, ek, renk, renk2, alt, tkr, h) {   // ışıklı uçan daire (öne +Z): alt süzülme ışığı, arka plazma motorları, parlak mücevher ışıklar, iki uzaylı anteni
  const PI = Math.PI;
  // geniş uçan daire diski (mor üst, camgöbeği kenar şeridi, koyu alt)
  const ufoF = (() => { const s = arSuper(2.4); return (u, w, o) => { s(u, w, o); o.set(o.x * 1.52, o.y * 0.28, o.z * 1.76); }; })();
  arKat(y, arYuzey(48, 24, ufoF, i => {
    const a = (i + 0.5) * 7.5, el = a <= 180 ? (a <= 90 ? a : 180 - a) : (a <= 270 ? 180 - a : a - 360);
    if (el < -22) return alt;
    if (el > -10 && el < 14) return renk2;
    return renk;
  }), null, 0, 0.76, -0.05, 1, 1, 1);
  // alt iniş takımı yuvaları (küçük tekerlerin üstünde)
  for (const z of [-1, 1]) for (const x of [-1, 1]) arKat(y, arCamurluk, alt, x * 0.96, tkr.ro - tkr.yuk, z * 1.05, 0.44, 0.44, 1.1, 0, PI / 2);
  // kubbe taban halkası ve ön/arka küçük ışıklar
  arKat(y, arInceHalka, renk2, 0, 1.0, -0.18, 0.94, 1.06, 0.9, PI / 2);
  for (const x of [-1, 1]) { h.far(x * 0.56, 0.76, 1.62, 0.095); h.stop(x * 0.44, 0.76, -1.72, 0.085); }
  // altta yumuşak parlayan yarı saydam süzülme ışığı diski ve halkası (soft glowing translucent hover-beam)
  const beamGr = new T.Group(); beamGr.position.set(0, 0.28, -0.05); beamGr.userData.ek = 'ufoBeam';
  const beamDisc = new T.Mesh(new T.CylinderGeometry(1.08, 1.38, 0.28, 24, 1, true),
    new T.MeshBasicMaterial({ color: 0x55fff0, transparent: true, opacity: 0.26, depthWrite: false, side: T.DoubleSide }));
  beamDisc.renderOrder = 3; beamGr.add(beamDisc);
  const beamRing = new T.Mesh(new T.TorusGeometry(1.22, 0.075, 6, 24),
    new T.MeshBasicMaterial({ color: 0xa8ffff, transparent: true, opacity: 0.46, depthWrite: false }));
  beamRing.rotation.x = PI / 2; beamRing.position.y = -0.1; beamRing.renderOrder = 3; beamGr.add(beamRing);
  beamDisc.onBeforeRender = () => {
    const b = 0.5 + 0.5 * Math.sin(performance.now() * 0.0042);
    beamDisc.material.opacity = 0.18 + b * 0.16;
    beamRing.material.opacity = 0.32 + b * 0.26;
    beamGr.scale.set(0.95 + b * 0.1, 1, 0.95 + b * 0.1);
  };
  ek.push(beamGr);
  // arkada çift parlayan plazma itici motor podu (twin rear glowing plasma thruster pods)
  for (const x of [-1, 1]) {
    arTaban(y, x * 0.76, 0.84, -1.48, 0, -x * 0.14, 0);
    arKat(y, arHap(0.16, 0.36), alt, 0, 0, 0, 1, 1, 1, PI / 2);
    arKat(y, arInceHalka, renk2, 0, 0, -0.12, 0.17, 0.17, 0.4);
    arKat(y, arInceHalka, AR_KROM, 0, 0, -0.26, 0.145, 0.145, 0.5);
    y.taban = null;
    const plazma = new T.Mesh(arK, new T.MeshBasicMaterial({ color: 0x66f7ff }));
    plazma.position.set(x * 0.76 - x * 0.04, 0.84, -1.78); plazma.scale.set(0.12, 0.12, 0.18); plazma.userData.ek = 'ufoPlazma';
    plazma.onBeforeRender = () => {
      const f = 0.78 + 0.22 * Math.sin(performance.now() * 0.015 + x);
      plazma.material.color.setRGB(0.35 * f, 0.95 * f, 1.0 * f);
      plazma.scale.set(0.115 * f, 0.115 * f, 0.15 + f * 0.07);
    };
    ek.push(plazma);
  }
  // şeffaf parlayan cam kubbe (Feza'nın etrafında)
  const kubbeMat = new T.MeshPhongMaterial({ color: renk2, transparent: true, opacity: 0.34, depthWrite: false, shininess: 95, specular: 0xffffff });
  const kubbe = new T.Mesh(new T.SphereGeometry(1, 20, 14, 0, PI * 2, 0, PI * 0.56), kubbeMat);
  kubbe.position.set(0, 0.98, -0.18); kubbe.scale.set(0.92, 1.36, 1.05); kubbe.renderOrder = 4; kubbe.userData.ek = 'ufoKubbe';
  ek.push(kubbe);
  // kenar çevresinde dönen 12 parlak mücevher gibi renkli ışık (12 brighter jewel-like rim lights)
  const isikGr = new T.Group(), iy = arYapi(), pastel = [0xff4fa3, 0xffe14d, 0x38f8ff, 0x7bff6b, 0xc26bff, 0xff8c3b];
  isikGr.position.set(0, 0.78, -0.05); isikGr.userData.ek = 'ufoIsik';
  for (let i = 0; i < 12; i++) {
    const a = i * PI * 2 / 12, lx = Math.sin(a) * 1.54, lz = Math.cos(a) * 1.78;
    arKat(iy, arK, pastel[i % pastel.length], lx, 0.02, lz, 0.14, 0.11, 0.14);
    arKat(iy, arM, 0xffffff, lx * 0.97, 0.075, lz * 0.97, 0.055, 0.04, 0.055);
  }
  const isikMesh = arBitir(iy, isikGr, new T.MeshBasicMaterial({ vertexColors: true }));
  isikMesh.onBeforeRender = () => { isikGr.rotation.y = performance.now() * 0.0022; };
  ek.push(isikGr);
  // arka kenarda iki sevimli sallanan uzaylı anteni (two cute wobbling alien antennae)
  arAnten(ek, -0.52, 0.96, -1.24, 0.88, 0x38f8ff);
  arAnten(ek, 0.52, 0.96, -1.24, 0.88, 0xff6fb4);
}
function araba(renk, renk2, tur, tip) {   // öne +Z; tip: ARABA_TIPLERI içindeki id (verilmezse 'kart')
  tip = AR_TEKER[tip] ? tip : 'kart';
  if (tip !== 'kart') { const c2 = new T.Color(renk2); if (c2.r * 0.3 + c2.g * 0.59 + c2.b * 0.11 < 0.2) renk2 = 0xffd97a; }   // koyu ikinci renk (baba) oyuncak arabada sönük kalmasın: sıcak sarı süs
  const tkr = AR_TEKER[tip], yuk = tkr.yuk, ek = [];
  const g = new T.Group(), govde = new T.Group(); g.rotation.order = 'YXZ'; g.add(govde);
  const y = arYapi(), alt = arKoyult(renk, 0.72), gri = 0xc9cfd9;
  const aile = tur === 'anne' || tur === 'baba', arazi = tip === 'cip' || (tip === 'kart' && (tur === 'bilbo' || tur === 'baba'));
  if (tip !== 'kart') arTipGovde(y, ek, tip, renk, renk2, alt, tkr); else {
  // tombul gövde: üstte yarış şeridi, yanda ince şerit, altı bir ton koyu
  arKat(y, arGovdeYuzey(arGovdeF, i => (i === 5 || i === 6 || i === 0 || i === 12) ? renk2 : i > 11 ? alt : renk), null, 0, 0.62, -0.05, 1, 1, 1);
  arKat(y, arHap(0.11, 1.3), renk2, 0, 0.42, 1.8, 1, 1, 1, 0, 0, Math.PI / 2);                       // ön tampon
  for (const x of [-1, 1]) {
    arKat(y, arK, renk2, x * 0.66, 0.42, 1.8, 0.16, 0.16, 0.16);
    arKat(y, arHap(0.2, 0.55), renk2, x * 0.9, 0.5, 0, 1, 1, 1, Math.PI / 2);                         // yan yastıklar
    // farlar: kaputtan taşan yuvarlak yuva + krem cam + tam daire krom çerçeve (hilal gibi gömülmez)
    arTaban(y, x * 0.4, 0.69, 1.53, -0.42, x * 0.12, 0);
    arKat(y, arSil, renk2, 0, 0, -0.02, 0.17, 0.12, 0.165, Math.PI / 2);
    arKat(y, arK, 0xfff3b0, 0, 0, 0.05, 0.135, 0.13, 0.06);
    arKat(y, arInceHalka, AR_KROM, 0, 0, 0.045, 0.155, 0.15, 0.25);
    arKat(y, arM, 0xffffff, 0.04, 0.04, 0.095, 0.045, 0.04, 0.02);
    y.taban = null;
    arKat(y, G.sil, gri, x * 0.5, 0.56, -1.8, 0.1, 0.34, 0.1, Math.PI / 2);                        // egzoz
    arKat(y, G.sil, 0x23262e, x * 0.5, 0.56, -1.81, 0.065, 0.345, 0.065, Math.PI / 2);
    arKat(y, arTomb, renk, x * 1.0, 1.4, -1.6, 0.05, 0.2, 0.32);                                   // kanat yan levhaları
    arKat(y, G.kutu, AR_KOYU, x * 0.42, 1.2, -1.55, 0.09, 0.5, 0.14, -0.2);
    arKat(y, arM, 0xff5a4a, x * 0.72, 0.66, -1.72, 0.09, 0.07, 0.05);                              // stop lambaları
    arKat(y, arK, alt, x * 0.71, 0.64, -1.72, 0.14, 0.12, 0.05);                                  // stop yuvası
    arKat(y, arK, 0xff3b30, x * 0.71, 0.655, -1.775, 0.115, 0.085, 0.04);
    arKat(y, arM, 0xffc9a5, x * 0.71, 0.683, -1.802, 0.07, 0.016, 0.01);
    // Çamurluklar tekerin üzerinde bir kemer çizer; yan şerit kaportayı toplar.
    for (const zz of [-1, 1]) arKat(y, arCamurluk, aile ? renk2 : renk, x * 0.96, zz < 0 ? 0.5 : 0.45, zz * 1.05, zz < 0 ? 0.57 : 0.52, zz < 0 ? 0.57 : 0.52, zz < 0 ? 0.57 : 0.52, 0, Math.PI / 2);
    arKat(y, arHap(0.036, 1.18), renk2, x * 0.925, 0.68, 0, 1, 1, 1, Math.PI / 2);
    arKat(y, arTomb, alt, x * 0.74, 0.6, -0.92, 0.08, 0.18, 0.35, -0.08);
    for (let j = 0; j < 3; j++) arKat(y, arTomb, 0x273340, x * 0.831, 0.62, -0.73 - j * 0.13, 0.014, 0.095, 0.023, 0, 0, x * 0.1);
  }
  arKat(y, arTomb, renk2, 0, 1.46, -1.62, 1.02, 0.055, 0.27, 0.1);                                  // arka kanat
  arKat(y, arHap(0.08, 1.2), AR_KOYU, 0, 0.4, -1.86, 1, 1, 1, 0, 0, Math.PI / 2);                     // arka tampon
  for (const x of [-1, 1]) {
    arKat(y, arInceHalka, AR_KROM, x * 0.5, 0.56, -1.975, 0.1, 0.1, 0.16);                          // egzoz ağzı
    arKat(y, arInceHalka, AR_KROM, x * 0.71, 0.655, -1.79, 0.135, 0.105, 0.13);                     // stop çerçevesi
  }
  arKat(y, arTomb, 0x2b3038, 0, 0.6, 1.69, 0.22, 0.065, 0.05);                                      // burun ızgarası
  for (let j = 0; j < 2; j++) arKat(y, G.kutu, AR_KROM, 0, 0.578 + j * 0.045, 1.742, 0.36, 0.016, 0.01);
  arAnten(ek, 0.66, 0.95, -1.12, 0.95, renk2);
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
  const ust = tur === 'feza' ? 0xf3ecdf : tur === 'anne' ? 0xff8fb1 : tur === 'baba' ? 0x6f7d48 : tur === 'piril' ? AR_LEYLAK : AR_CIKO;
  const kolRenk = tur === 'baba' ? 0xc9463c : ust, manset = tur === 'feza' ? 0x26365f : tur === 'anne' ? 0xfff3e0 : tur === 'baba' ? 0xa8362e : 0;
  const el = tur === 'piril' ? 0xcdb8f5 : tur === 'bilbo' ? 0x7b5238 : tur === 'feza' ? 0xfff1d0 : tur === 'baba' ? 0xeebd95 : AR_TEN;
  arKat(y, tur === 'feza' ? arCizgili() : arK, tur === 'feza' ? null : ust, 0, 1.1, -0.26, 0.37, 0.45, 0.31);   // Feza: gerçek tişörtü gibi krem zemin, lacivert ve açık mavi çizgiler
  for (const x of [-1, 1]) arKat(y, arM, kolRenk, x * 0.33, 1.27, -0.21, 0.13, 0.125, 0.13);   // omuzlar
  if (tur === 'piril') {
    arKat(y, arK, 0xc8ec8c, 0, 1.08, -0.1, 0.27, 0.36, 0.2);
    for (let i = 0; i < 3; i++) arKat(y, arTomb, 0x8fcf62, 0, 1.2 - i * 0.11, 0.085 - i * 0.012, 0.19 - i * 0.012, 0.022, 0.03);
    { const kn = new T.Group(), ky = arYapi(); kn.position.set(0, 1.46, -0.5); kn.userData.ek = 'kanat';   // minik yarasa kanatları (çırpar): pembe zar, mor kemik
      for (const x of [-1, 1]) {
        arTaban(ky, x * 0.2, 0, 0, -0.25, -x * 0.2, x * 0.14); ky.taban.scale(new T.Vector3(1.3, 1.3, 1.3));   // arkadan kafanın iki yanında açıkça görünsün
        arKat(ky, x < 0 ? arKanatGeo[0] : arKanatGeo[1], 0xf7a0d4, 0, 0, -0.015, 1.15, 1.15, 1);
        arKat(ky, arHap(0.032, 0.5), 0x7d62b8, x * 0.161, 0.253, 0, 1.15, 1.15, 1.15, 0, 0, -x * 0.565);
        arKat(ky, arHap(0.026, 0.46), 0x7d62b8, x * 0.62, 0.483, 0, 1.15, 1.15, 1.15, 0, 0, -x * 1.65);
        arKat(ky, arM, 0x7d62b8, x * 0.322, 0.506, 0, 0.055);
        arKat(ky, arHap(0.016, 0.3), 0xd98fc6, x * 0.48, 0.32, 0.012, 1.15, 1.15, 1.15, 0, 0, -x * 2.25);
        ky.taban = null;
      }
      arBitir(ky, kn); ek.push(kn); }
    if (tip === 'kart') for (let i = 0; i < 3; i++) arKat(y, arK, 0x2f8a4a, 0, 1.08 - i * 0.03, -1.05 - i * 0.26, 0.05, 0.16 - i * 0.02, 0.14);   // arabada ibik
  } else if (tur === 'bilbo') {
    arKat(y, arHalka, 0xe8433a, 0, 1.36, -0.24, 0.27, 0.27, 0.3, Math.PI / 2 - 0.15);
    arKat(y, arM, 0xffd23e, 0, 1.3, 0.04, 0.06, 0.06, 0.03);
    arKat(y, arK, 0x7b5238, 0, 1.08, -0.1, 0.24, 0.32, 0.18);
  } else {
    arKat(y, arHalka, tur === 'baba' ? 0x2b2f3a : tur === 'anne' ? 0xfff3e0 : tur === 'feza' ? 0xe8433a : 0xffffff, 0, 1.4, -0.24, tur === 'feza' ? 0.215 : 0.2, tur === 'feza' ? 0.215 : 0.2, tur === 'feza' ? 0.36 : 0.25, Math.PI / 2 - 0.15);   // yaka / atkı
    if (tur === 'baba') arKat(y, arTomb, 0x2b2f3a, 0, 1.14, -0.03, 0.1, 0.27, 0.07);                                 // yeleğin açık önü
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
    arKat(ky, arHap(0.085, 0.42), kolRenk, 0, 0, 0.3, 1, 1, 1, Math.PI / 2);
    if (manset) arKat(ky, arSil, manset, 0, 0, 0.5, 0.097, 0.07, 0.097, Math.PI / 2);
    if (tur === 'baba') for (const z of [0.14, 0.36]) { arKat(ky, arSil, 0x2c4a3a, 0, 0, z, 0.091, 0.05, 0.091, Math.PI / 2); arKat(ky, arSil, 0xf0c860, 0, 0, z + 0.05, 0.088, 0.012, 0.088, Math.PI / 2); }   // babanın ekose gömleği: yeşil ve sarı çizgiler
    if (tur === 'feza') for (const z of [0.16, 0.34]) { arKat(ky, arSil, 0x2c3f6e, 0, 0, z, 0.091, 0.035, 0.091, Math.PI / 2); arKat(ky, arSil, 0x7fb0e0, 0, 0, z + 0.07, 0.09, 0.025, 0.09, Math.PI / 2); }   // kolda da çizgiler
    arKat(ky, arK, el, 0, 0, 0.6, hayvan ? 0.115 : 0.1);
    if (!hayvan) arKat(ky, arM, el, -x * 0.07, 0.03, 0.6, 0.045, 0.05, 0.06);                                        // başparmak
    arBitir(ky, kg); govde.add(kg); kol.push(kg);
  }
  const kf = kafa(tur); kf.position.set(0, 1.76, -0.22); if (tur === 'baba') kf.scale.setScalar(1.04); govde.add(kf);
  if (tip === 'itfaiye' && tur === 'anne') { const ak = kf.userData.sallan[0].children[0]; ak.rotation.x = 0.7; ak.scale.setScalar(0.8); }   // itfaiyede annenin at kuyruğu lamba kemerine girmez: daha kısa ve yukarı kalkık
  // tekerler: [dönüş grubu] > [dönen grup]
  const teker = [], on = [];
  for (const z of [-1, 1]) for (const x of [-1, 1]) {
    const r = z < 0 ? tkr.ra : tkr.ro, s = r / 0.46, en = z < 0 ? tkr.ena : tkr.eno, of = Math.max(0, 0.16 * s * en - 0.26), d = new T.Group(), t = new T.Group(), ty = arYapi();
    d.position.set(x * 0.97, r, z * 1.05); g.add(d); d.add(t); t.userData.r = r;
    arTekerKur(ty, tkr, z, x, renk, renk2, arazi, 'klasik');
    arBitir(ty, t, arBoya); teker.push(t); if (z > 0) on.push(d);   // lastik mat, jant parlak (parıltı renk açıklığına göre)
  }
  const golge = new T.Mesh(new T.PlaneGeometry(3.4, 4.6), golgeMat.clone()); golge.rotation.x = -Math.PI / 2; golge.position.y = 0.07; golge.renderOrder = 2; scene.add(golge);
  scene.add(g);
  return { g, govde, teker, golge, arSus: null, arGuc: null, arTur: tur, arRenk: renk, arRenk2: renk2, arArazi: arazi, arTip: tip, arEk: ek, arYuk: yuk, arYayK: tkr.yay || 1, arOn: on, arKol: kol, arKafa: kf, arGoz: kf.userData.gozMesh, arSallan: kf.userData.sallan, arDireksiyon: direksiyon, arAlev: null,
    ar: { t: 0, v0: 0, ivme: 0, don: 0, egx: 0, egz: 0, sev: 0, sal: 0, bak: 0, yay: 0, ayak: new Float32Array(4), havada: false, inis: 9, sek: 9, tok: 9, mer: 9 } };
}
function roketAlevi(a) {   // iç içe iki koni; oyun.js görünürlüğü ve ölçeği ayarlar, içteki koni arabaYerlestir içinde titreşir
  const m = new T.Group(); m.position.set(0, 0.58, -1.9); m.rotation.x = -Math.PI / 2;
  const ic = new T.Mesh(arKoniGeo, new T.MeshBasicMaterial({ color: 0xfff6b0 })); ic.scale.set(0.58, 0.66, 0.58); m.add(ic);
  const dis = new T.Mesh(arKoniGeo, new T.MeshBasicMaterial({ color: 0xff7a14, transparent: true, opacity: 0.55, depthWrite: false })); dis.renderOrder = 3; m.add(dis);
  m.userData.ic = ic; m.userData.dis = dis; m.visible = false; a.govde.add(m); a.arAlev = m; return m;
}
// ───────── teker serpintisi (toz/kar/su), roket kıvılcımı ve hız çizgileri: tek ortak sabit havuz, 1 çizim ─────────
// Kare başına yeni nesne kurulmaz; en eski parçacık yeniden kullanılır. tur: 0 = yumuşak top, 1 = hız çizgisi, 2 = kıvılcım.
const AR_SERP_N = 40, AR_SERP_RENK = {
  orman: [0xd8bb8c, 0xeadbbd], kiyi: [0xf3e2b8, 0xc8eeff], kar: [0xffffff, 0xe6f3ff], seker: [0xffd0e6, 0xffffff], uzay: [0xd6d0ee, 0xb3bfe4],
  col: [0xf2cf93, 0xe6b877], gokkusagi: [0xffffff, 0xffe6f6], dino: [0xcfa77a, 0xb99470], sehir: [0xdde1e7, 0xc6ccd5],
  /*SATO*/ sato: [0xd9cfbd, 0xebe3d2], /*/SATO*/ /*LUNAPARK*/ lunapark: [0xefe6ff, 0xffe6c0], /*/LUNAPARK*/ /*KORSAN*/ korsan: [0xf3dca6, 0xe8c88e], /*/KORSAN*/ /*DENIZALTI*/ denizalti: [0x9ef4ff, 0xdffcff], /*/DENIZALTI*/ /*CIFTLIK*/ ciftlik: [0xe6c88c, 0xd8b272], /*/CIFTLIK*/ /*MUZIK*/ muzik: [0xffe0f4, 0xdcd0ff] /*/MUZIK*/ };   // teker serpintisi rengi
const arSerp = (() => {
  const m = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x5a5a5a }), AR_SERP_N);
  m.frustumCulled = false; m.renderOrder = 1; m.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const z = new T.Matrix4().makeScale(0, 0, 0), c = new T.Color(1, 1, 1);
  for (let i = 0; i < AR_SERP_N; i++) { m.setMatrixAt(i, z); m.setColorAt(i, c); }
  scene.add(m);
  const F = n => new Float32Array(AR_SERP_N * n);
  return { m, p: F(3), v: F(3), o: F(1), om: F(1), s: F(1), tur: new Uint8Array(AR_SERP_N), yaw: F(1), sira: 0, k: new T.Object3D(), c, renk: AR_SERP_RENK[typeof PIST_TEMA !== 'undefined' ? PIST_TEMA : 'orman'] || AR_SERP_RENK.orman };
})();
function arSerpAt(tur, x, y, z, vx, vy, vz, omur, boy, renk, yaw) {
  const S = arSerp, i = S.sira; S.sira = (i + 1) % AR_SERP_N;
  S.p[i * 3] = x; S.p[i * 3 + 1] = y; S.p[i * 3 + 2] = z; S.v[i * 3] = vx; S.v[i * 3 + 1] = vy; S.v[i * 3 + 2] = vz;
  S.o[i] = 0; S.om[i] = omur; S.s[i] = boy; S.tur[i] = tur; S.yaw[i] = yaw || 0;
  S.m.setColorAt(i, S.c.setHex(renk)); S.m.instanceColor.needsUpdate = true;
}
function arSerpAdim(dt) {   // bütün parçacıkları bir kez ilerletir (P'nin karesinde)
  const S = arSerp, k = S.k; if (!(dt > 0)) return;
  for (let i = 0; i < AR_SERP_N; i++) {
    if (S.om[i] <= 0) continue;
    S.o[i] += dt; const u = S.o[i] / S.om[i], j = i * 3;
    if (u >= 1) { S.om[i] = 0; k.scale.set(0, 0, 0); k.updateMatrix(); S.m.setMatrixAt(i, k.matrix); continue; }
    const tr = S.tur[i];
    if (tr === 0) { S.v[j + 1] -= 1.6 * dt; S.v[j] *= 1 - 1.5 * dt; S.v[j + 2] *= 1 - 1.5 * dt; }
    else if (tr === 2) S.v[j + 1] -= 6 * dt;
    S.p[j] += S.v[j] * dt; S.p[j + 1] = Math.max(0.05, S.p[j + 1] + S.v[j + 1] * dt); S.p[j + 2] += S.v[j + 2] * dt;
    k.position.set(S.p[j], S.p[j + 1], S.p[j + 2]); k.rotation.set(0, S.yaw[i], 0);
    const b = S.s[i];
    if (tr === 0) { const e = u < 0.2 ? 0.45 + u * 2.75 : 1 - (u - 0.2) * (u - 0.2) * 1.56; k.scale.set(b * e, b * e * 0.82, b * e); }   // tombul bulutçuk: çabuk kabarır, yavaşça söner
    else if (tr === 1) { const e = Math.sin(Math.PI * u); k.scale.set(0.036 * e + 0.004, 0.036 * e + 0.004, b * (0.4 + 0.6 * e)); }
    else { const e = 1 - u; k.scale.set(b * e, b * e, b * e * 2.2); }
    k.updateMatrix(); S.m.setMatrixAt(i, k.matrix);
  }
  S.m.instanceMatrix.needsUpdate = true;
}
function arSerpinti(a, x, z, yaw, havada, dt) {   // teker arkasında toz; roket anında kıvılcım ve hız çizgileri
  const s = a.ar, S = arSerp; if (!(dt > 0)) return;
  const P0 = typeof A !== 'undefined' ? A[0] : a, oyuncu = a === P0;
  if (!oyuncu && P0 && P0.x !== undefined && Math.abs(x - P0.x) + Math.abs(z - P0.z) > 45) return;
  const sn = Math.sin(yaw), cs = Math.cos(yaw), hiz = Math.min(1, a.v / 26);
  const yer = (lx, ly, lz, o) => { o[0] = x + lx * cs + lz * sn; o[1] = ly; o[2] = z - lx * sn + lz * cs; return o; }, q = arSerpQ;
  // Teker tozu kapalı: yoldaki yumuşak, piste uygun açık renkli toz izini pist.js bırakıyor; buradaki küreler gri top gibi duruyordu.
  if (false && !havada && a.v > 9 && oyuncu) {
    s.serp = (s.serp || 0) + dt * (oyuncu ? 3 + 7 * hiz : 0);
    while (s.serp >= 1) {
      s.serp -= 1; s.serpY = -(s.serpY || 1); const r1 = Math.random(), r2 = Math.random();
      yer(s.serpY * (0.98 + r1 * 0.12), 0.14 + r2 * 0.08, -1.05 - (a.teker[0].userData.r || 0.45) * 0.6, q);
      const ileri = a.v * (0.55 + r2 * 0.12), yanH = s.serpY * (0.6 + r1 * 1.1);
      arSerpAt(0, q[0], q[1], q[2], ileri * sn + yanH * cs, 1.4 + r1 * 1.4, ileri * cs - yanH * sn, 0.3 + r2 * 0.16, 0.11 + hiz * 0.1 + r1 * 0.05, S.renk[r2 < 0.55 ? 0 : 1]);
    }
  } else s.serp = 0;
  if (a.arAlev && a.arAlev.visible) {
    s.kiv = (s.kiv || 0) + dt * 16;
    while (s.kiv >= 1) {
      s.kiv -= 1; const r1 = Math.random() - 0.5, r2 = Math.random(), ileri = a.v * (0.55 - r2 * 0.25);
      if (r2 < 0.75) { yer(r1 * 0.3, 0.6 + (Math.random() - 0.5) * 0.25, -2.25, q); arSerpAt(2, q[0], q[1], q[2], ileri * sn + r1 * 3 * cs, 0.6 + r2 * 1.2, ileri * cs - r1 * 3 * sn, 0.28 + r2 * 0.15, 0.06 + r2 * 0.05, r2 < 0.3 ? 0xfff2a0 : 0xffa22e, yaw); }
      else { const yanS = r1 > 0 ? 1 : -1; yer(yanS * (1.35 + r2 * 0.9), 0.35 + Math.random() * 1.9, 2.5 + Math.random() * 3, q); arSerpAt(1, q[0], q[1], q[2], a.v * 0.25 * sn, 0, a.v * 0.25 * cs, 0.32, 1.3 + r2 * 0.8, 0xffffff, yaw); }
    }
  } else s.kiv = 0;
}
const arSerpQ = [0, 0, 0];
function arabaSok(a) {   // arabayı sahneden kaldırır; yalnız o arabaya ait geometri/malzemeyi bırakır (ortak olanlara dokunmaz)
  if (!a || !a.g) return;
  const birak = o => {
    if (!o.isMesh) return;
    if (o.geometry && o.geometry !== arKoniGeo && o.geometry !== arLambaGeo && !arOrtakGeo.has(o.geometry)) o.geometry.dispose();
    const m = o.material; if (m && m !== arMat && m !== arBoya && m !== arAlevMat && m !== golgeMat) m.dispose();
  };
  a.g.traverse(birak); if (a.g.parent) a.g.parent.remove(a.g);
  if (a.golge) { birak(a.golge); if (a.golge.parent) a.golge.parent.remove(a.golge); }
  a.arAlev = null; a.arSus = null; a.arGuc = null;
}
OLAY.on('yildiz', () => { if (typeof A !== 'undefined' && A[0].ar) A[0].ar.sek = 0; });
OLAY.on('roket', () => { if (typeof A !== 'undefined' && A[0].ar) A[0].ar.rok = 0; });   // sürücü hızlanınca geriye yaslanır
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
// ───────── GARAJ süsleri: boya, teker, anten süsü (arabaSusle) ─────────
// Teker: klasik (arabanın kendi tekeri) + beş süslü çeşit. Hepsi tek geometride kalır: ek çizim yok.
const AR_SUS_TEKER = {
  yildiz: { lastik: 0x2a3f8f, jant: 0x4aa8ff, halka: 0xffffff, cember: 0xffd23e, dis: [0xffd23e, 0xffffff] },
  cicek: { lastik: 0x49b97c, jant: 0xfff6e6, halka: 0xffffff, cember: 0xff8fc0, dis: [0xff8fc0, 0xfff2a8] },
  gokkusagi: { lastik: AR_KOYU, jant: 0xffffff, halka: 0xff4a4a, cember: 0xffd23e, dis: [0xff4a4a, 0xff9a2e, 0xffe03a, 0x4ccf5a, 0x3aa6ff, 0x9b6bff, 0xff7ac8, 0x35d6d0] },
  altin: { lastik: 0x3a2f2a, jant: 0xffc61a, halka: 0xffd84a, cember: 0xfff0a0, dis: [0xffc61a] },
  seker: { lastik: 0xfff4ee, jant: 0xffffff, halka: 0xff4f6e, cember: 0xff9fc6, dis: [0xff4f6e, 0x7fe0d0] }
};
function arTekerKur(ty, tkr, z, x, renk, renk2, arazi, stil) {   // bir tekerin bütün parçalarını ty yapısına ekler (araba() ve arabaSusle kullanır)
  const r = z < 0 ? tkr.ra : tkr.ro, s = r / 0.46, en = z < 0 ? tkr.ena : tkr.eno, of = Math.max(0, 0.16 * s * en - 0.26);
  const S = AR_SUS_TEKER[stil];
  if (!S) {
    if (tkr.tip === 'tren') {
      const kirmizi = 0xd93829, altin = 0xffd23f, celik = 0x303642;
      arKat(ty, arLastik, celik, 0, 0, 0, s, s, s * en, 0, Math.PI / 2);
      arKat(ty, arSil, kirmizi, 0, 0, 0, 0.25 * s, 0.4 + of * 2, 0.25 * s, 0, 0, Math.PI / 2);
      arKat(ty, arJantHalka, altin, x * 0.155 * s * en, 0, 0, 0.31 * s, 0.31 * s, 0.31 * s, 0, Math.PI / 2);
      arKat(ty, arJantHalka, kirmizi, x * (0.215 + of), 0, 0, 0.25 * s, 0.25 * s, 0.25 * s, 0, Math.PI / 2);
      for (let q = 0; q < 8; q++) {
        const an = q * Math.PI * 2 / 8;
        arKat(ty, G.kutu, q % 2 ? altin : kirmizi, x * (0.195 + of), Math.cos(an) * 0.135 * s, Math.sin(an) * 0.135 * s, 0.032, 0.22 * s, 0.045 * s, an);
      }
      arKat(ty, arM, altin, x * (0.22 + of), 0, 0, 0.065, 0.11 * s, 0.11 * s);
      arKat(ty, arM, 0x262932, x * (0.265 + of), 0, 0, 0.025, 0.045 * s, 0.045 * s);
      return;
    }
    arKat(ty, arLastik, AR_KOYU, 0, 0, 0, s, s, s * en, 0, Math.PI / 2);
    arKat(ty, arSil, tkr.jant || 0xeef1f6, 0, 0, 0, 0.21 * s, 0.4 + of * 2, 0.21 * s, 0, 0, Math.PI / 2);
    arKat(ty, arM, renk2 === 0xffffff ? renk : renk2, x * (0.2 + of), 0, 0, 0.06, 0.115 * s, 0.115 * s);
    arKat(ty, arM, 0x3a404c, x * (0.252 + of), 0, 0, 0.02, 0.04 * s, 0.04 * s);                    // göbek somunu
    for (let q = 0; q < 5; q++) { const an = q * Math.PI * 2 / 5; arKat(ty, G.kutu, 0xdfe5ee, x * (0.203 + of), Math.cos(an) * 0.115 * s, Math.sin(an) * 0.115 * s, 0.022, 0.19 * s, 0.075 * s, an); }   // beş kollu jant
    arKat(ty, arJantHalka, renk2 === 0xffffff ? renk : renk2, x * 0.155 * s * en, 0, 0, 0.3 * s, 0.3 * s, 0.3 * s, 0, Math.PI / 2);   // lastik yanağında renkli çizgi
    arKat(ty, arJantHalka, 0xf0e9db, x * (0.223 + of), 0, 0, 0.235 * s, 0.235 * s, 0.235 * s, 0, Math.PI / 2);
    if (tkr.tip === 'traktor' && z < 0) {
      for (let q = 0; q < 12; q++) {
        const an = q * Math.PI * 2 / 12;
        arKat(ty, G.kutu, 0x2a2f38, 0, Math.cos(an) * (r - 0.01), Math.sin(an) * (r - 0.01), 0.44 * Math.max(0.85, en / 1.5), 0.085, 0.18, an, q % 2 ? 0.22 : -0.22);
      }
      for (let q = 0; q < 6; q++) {
        const an = q * Math.PI * 2 / 6;
        arKat(ty, arM, 0x3a404c, x * (0.225 + of), Math.cos(an) * 0.14 * s, Math.sin(an) * 0.14 * s, 0.026, 0.03 * s, 0.03 * s);
      }
      return;
    }
    // Seyrek kabartma dişler: ayrı cisim/çizim olmadan lastiğin dönüşünü okunur kılar.
    for (let q = 0; q < 8; q++) {
      const an = q * Math.PI * 2 / 8;
      arKat(ty, G.kutu, arazi ? 0x414954 : 0x363c47, 0, Math.cos(an) * (r - 0.024), Math.sin(an) * (r - 0.024), (arazi ? 0.34 : 0.24) * Math.max(0.8, en / 1.5), 0.05, 0.14, an);   // lastiğin yanından köşe gibi taşmaz
    }
    return;
  }
  const PI = Math.PI, yz = x * (0.203 + of), kapak = renk2 === 0xffffff ? renk : renk2;
  arKat(ty, arLastik, S.lastik, 0, 0, 0, s, s, s * en, 0, PI / 2);
  arKat(ty, arSil, S.jant, 0, 0, 0, 0.21 * s, 0.4 + of * 2, 0.21 * s, 0, 0, PI / 2);
  arKat(ty, arJantHalka, S.halka, x * 0.155 * s * en, 0, 0, 0.3 * s, 0.3 * s, 0.3 * s, 0, PI / 2);
  arKat(ty, arJantHalka, S.cember, x * (0.223 + of), 0, 0, 0.235 * s, 0.235 * s, 0.235 * s, 0, PI / 2);
  // renkli dişler: kamera arkadan baktığı için süs en çok lastiğin sırtından seçilir
  for (let q = 0; q < 8; q++) {
    const an = q * PI * 2 / 8;
    arKat(ty, G.kutu, S.dis[q % S.dis.length], 0, Math.cos(an) * (r - 0.03), Math.sin(an) * (r - 0.03), 0.24 * Math.max(0.8, en / 1.5), 0.055, stil === 'altin' ? 0.1 : 0.2, an, stil === 'seker' ? 0.45 : 0);
  }
  if (stil === 'yildiz') {
    arKat(ty, arYildizGeo, 0xffd23e, x * (0.185 + of), 0, 0, 0.205 * s, 0.205 * s, 0.34, 0, x * PI / 2, 0);
    arKat(ty, arM, 0xffffff, x * (0.275 + of), 0, 0, 0.02, 0.05 * s, 0.05 * s);
  } else if (stil === 'cicek') {
    for (let q = 0; q < 6; q++) { const an = q * PI / 3; arKat(ty, arM, q & 1 ? 0xff8fc0 : 0xff6aa8, x * (0.21 + of), Math.cos(an) * 0.125 * s, Math.sin(an) * 0.125 * s, 0.04, 0.085 * s, 0.085 * s); }
    arKat(ty, arM, 0xffd23e, x * (0.23 + of), 0, 0, 0.045, 0.075 * s, 0.075 * s);
  } else if (stil === 'gokkusagi') {
    arKat(ty, arJantHalka, 0xff9a2e, x * (0.215 + of), 0, 0, 0.17 * s, 0.17 * s, 0.2 * s, 0, PI / 2);
    arKat(ty, arJantHalka, 0x3aa6ff, x * (0.215 + of), 0, 0, 0.105 * s, 0.105 * s, 0.2 * s, 0, PI / 2);
    arKat(ty, arM, 0x9b6bff, x * (0.2 + of), 0, 0, 0.05, 0.07 * s, 0.07 * s);
  } else if (stil === 'altin') {
    for (let q = 0; q < 5; q++) { const an = q * PI * 2 / 5; arKat(ty, G.kutu, 0xffd84a, yz, Math.cos(an) * 0.115 * s, Math.sin(an) * 0.115 * s, 0.026, 0.2 * s, 0.085 * s, an); }
    arKat(ty, arM, 0xfff0a0, x * (0.21 + of), 0, 0, 0.06, 0.1 * s, 0.1 * s);
    for (const k of [-1, 1]) arKat(ty, arJantHalka, 0xffc61a, k * 0.115 * s * en, 0, 0, r - 0.045, r - 0.045, r - 0.045, 0, PI / 2);   // lastiğin sırtında iki altın şerit
  } else {   // seker: nane şekeri gibi kırmızı-beyaz dilimler
    for (let q = 0; q < 3; q++) { const an = q * PI / 3; arKat(ty, G.kutu, 0xff4f6e, yz, 0, 0, 0.024, 0.44 * s, 0.1 * s, an); }
    arKat(ty, arM, 0xff9fc6, x * (0.215 + of), 0, 0, 0.05, 0.085 * s, 0.085 * s);
  }
  void kapak;
}
const AR_SUS_RENK = { mavi: [0x2b7de9, 0xffe27a], kirmizi: [0xf03a34, 0xffe9a8], yesil: [0x3fb552, 0xfff0a8], sari: [0xffc928, 0xfff7dc], pembe: [0xff6fb4, 0xfff0f7], turuncu: [0xff8a2b, 0xfff1c4], turkuaz: [0x1fc8c0, 0xfff4c0] };
const arSusKalpGeo = (() => {
  const h = new T.Shape(); h.moveTo(5, 5); h.bezierCurveTo(5, 5, 4, 0, 0, 0); h.bezierCurveTo(-6, 0, -6, 7, -6, 7); h.bezierCurveTo(-6, 11, -3, 15.4, 5, 19); h.bezierCurveTo(12, 15.4, 16, 11, 16, 7); h.bezierCurveTo(16, 7, 16, 0, 10, 0); h.bezierCurveTo(7, 0, 5, 5, 5, 5);
  const g = new T.ExtrudeGeometry(h, { depth: 3, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 1.1, bevelSegments: 2, curveSegments: 5 });
  g.translate(-5, -9.5, -1.5); g.rotateZ(Math.PI); g.scale(0.1, 0.1, 0.1); return g;
})();
function arSusMeshler(a) {   // boyanacak parçalar: gövde ve tipin kendi parçaları; sürücünün kafası/kolları ve garaj süsleri dışarıda kalır
  const l = [], gez = o => { if (o === a.arKafa || o.userData.arSus || (a.arKol && a.arKol.indexOf(o) >= 0)) return; if (o.isMesh && o.geometry && o.geometry.attributes.color) l.push(o); for (const c of o.children) gez(c); };
  gez(a.govde); return l;
}
const arSusC = new T.Color();
function arSusBoya(a, id) {
  const st = a.arSus; if (st.renk === id) return;
  const hedef = arSusMeshler(a);
  if (!st.ilk) st.ilk = hedef.map(m => m.geometry.attributes.color.array.slice());
  const renkler = t => arSusMeshler(t).map(m => m.geometry.attributes.color.array);
  const yaz = kaynak => hedef.forEach((m, i) => { const c = m.geometry.attributes.color; if (kaynak[i] && kaynak[i].length === c.array.length) { c.array.set(kaynak[i]); c.needsUpdate = true; } });
  // Aynı arabayı yeni renklerle bir kez kurup yalnız renklerini alırız: her tipin gölgeli/açık tonları, çizgileri kendiliğinden uyar; sürücü hiç değişmez.
  let r = a.arRenk, r2 = a.arRenk2, gecici = [];
  try {
    if (id === 'varsayilan' || (id !== 'gokkusagi' && !AR_SUS_RENK[id])) { yaz(st.ilk); id = 'varsayilan'; }
    else if (id === 'gokkusagi') {
      r2 = 0xfff1c9;
      const beyaz = araba(0xffffff, r2, a.arTur, a.arTip), maske = araba(0x3566c8, r2, a.arTur, a.arTip); gecici.push(beyaz, maske);
      const cb = renkler(beyaz), cm = renkler(maske);
      hedef.forEach((m, i) => {
        const c = m.geometry.attributes.color, p = m.geometry.attributes.position, b = cb[i], k = cm[i];
        if (!b || b.length !== c.array.length) return;
        const ox = m.parent === a.govde ? 0 : m.parent.position.x, oy = m.parent === a.govde ? 0 : m.parent.position.y, oz = m.parent === a.govde ? 0 : m.parent.position.z;
        for (let j = 0; j < c.count; j++) {
          const q = j * 3, ana = Math.abs(b[q] - k[q]) + Math.abs(b[q + 1] - k[q + 1]) + Math.abs(b[q + 2] - k[q + 2]) > 0.02;
          if (ana) {   // gövdenin ana rengi: arkadan da yandan da görünen yumuşak çapraz gökkuşağı geçişi
            let h = 0.5 + (p.getX(j) + ox) * 0.3 - (p.getZ(j) + oz) * 0.16 + (p.getY(j) + oy) * 0.14; h -= Math.floor(h);
            arSusC.setHSL(h, 0.92, 0.6);
            c.array[q] = b[q] * arSusC.r; c.array[q + 1] = b[q + 1] * arSusC.g; c.array[q + 2] = b[q + 2] * arSusC.b;
          } else { c.array[q] = b[q]; c.array[q + 1] = b[q + 1]; c.array[q + 2] = b[q + 2]; }
        }
        c.needsUpdate = true;
      });
    } else {
      const kt = typeof GARAJ !== 'undefined' && GARAJ && GARAJ.katalog && GARAJ.katalog.renk, kg = Array.isArray(kt) ? kt.find(q => q && q.id === id) : null;
      r = kg && typeof kg.renk === 'number' ? kg.renk : AR_SUS_RENK[id][0]; r2 = kg && typeof kg.renk2 === 'number' ? kg.renk2 : AR_SUS_RENK[id][1];
      const yeni = araba(r, r2, a.arTur, a.arTip); gecici.push(yeni); yaz(renkler(yeni));
    }
  } finally { for (const g of gecici) arabaSok(g); }
  st.renk = id; st.r = r; st.r2 = id === 'gokkusagi' ? 0xffd84a : r2; st.teker = null;   // teker göbeği yeni renge uysun
}
function arSusTeker(a, id) {
  const st = a.arSus; if (!AR_SUS_TEKER[id]) id = 'klasik'; if (st.teker === id) return;
  const tkr = AR_TEKER[a.arTip]; let i = 0;
  for (const z of [-1, 1]) for (const x of [-1, 1]) {
    const m = a.teker[i++].children[0], ty = arYapi(); if (!m || !m.isMesh) continue;
    arTekerKur(ty, tkr, z, x, st.r, st.r2, a.arArazi, id);
    m.geometry.dispose(); m.geometry = arGeo(ty);
  }
  st.teker = id;
}
function arSusYer(a) {   // anten yeri: arka sağ köşede gövdenin üst yüzeyi (her tipte kendiliğinden bulunur)
  const m = a.govde.children[0], p = m.geometry.attributes.position.array, X = 0.6, Z = -1.2; let en = -1;
  for (let i = 0; i < p.length; i += 9) {
    const x1 = p[i] - X, z1 = p[i + 2] - Z, x2 = p[i + 3] - X, z2 = p[i + 5] - Z, x3 = p[i + 6] - X, z3 = p[i + 8] - Z;
    const d = x1 * (z2 - z3) + x2 * (z3 - z1) + x3 * (z1 - z2); if (Math.abs(d) < 1e-9) continue;
    const w1 = (x2 * z3 - x3 * z2) / d, w2 = (x3 * z1 - x1 * z3) / d, w3 = 1 - w1 - w2; if (w1 < 0 || w2 < 0 || w3 < 0) continue;
    const y = w1 * p[i + 1] + w2 * p[i + 4] + w3 * p[i + 7]; if (y < 1.2 && y > en) en = y;
  }
  return [X, en > 0.3 ? en - 0.03 : 0.9, Z];
}
function arSusBayrak(a, id) {
  const st = a.arSus; if (['yildiz', 'kalp', 'balon', 'firildak', 'pati'].indexOf(id) < 0) id = 'yok'; if (st.bayrak === id) return;
  if (st.bayrakG) {   // eskisini kaldır: yalnız bu arabaya ait geometri bırakılır
    const i = a.arEk.indexOf(st.bayrakG); if (i >= 0) a.arEk.splice(i, 1);
    st.bayrakG.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); a.govde.remove(st.bayrakG); st.bayrakG = null;
  }
  for (const e of a.arEk) if (e.userData.ek === 'anten') e.visible = id === 'yok';   // kartın kendi anteni yerine süslü anten gelir
  st.bayrak = id; if (id === 'yok') return;
  if (!st.yer) st.yer = arSusYer(a);
  const PI = Math.PI, gr = new T.Group(), y = arYapi(), boy = 1.24, balon = id === 'balon';
  gr.position.set(st.yer[0], st.yer[1], st.yer[2]); gr.userData.ek = 'bayrak'; gr.userData.arSus = true; gr.userData.salin = balon ? 1.5 : 1; gr.rotation.y = -0.7;   // yassı süsler hem arkadan hem yandan seçilsin diye çapraz durur
  arKat(y, G.kutu, balon ? 0xf4f6fa : 0x3a404c, 0, boy / 2, 0, balon ? 0.02 : 0.032, boy, balon ? 0.02 : 0.032);
  arKat(y, arM, 0xc9cfd9, 0, 0.02, 0, 0.065, 0.045, 0.065);
  const ty = boy + 0.16;
  if (id === 'yildiz') {
    arKat(y, arYildizGeo, 0xffc928, 0, ty, -0.045, 0.3, 0.3, 0.5);
    for (const k of [-1, 1]) arKat(y, arM, 0xfff6c8, 0, ty, k * 0.075, 0.09, 0.09, 0.025);
  } else if (id === 'kalp') {
    arKat(y, arSusKalpGeo, 0xff4d7e, 0, ty + 0.02, 0, 0.26, 0.26, 0.3);
    for (const k of [-1, 1]) arKat(y, arM, 0xffc3d6, -0.13 * k, ty + 0.14, k * 0.11, 0.06, 0.045, 0.02);
  } else if (balon) {
    arKat(y, arK, 0xff5a6e, 0, ty + 0.2, 0, 0.3, 0.36, 0.3);
    arKat(y, arKoniGeo, 0xe64560, 0, ty - 0.21, 0, 0.06, 0.09, 0.06);
    for (const k of [-1, 1]) arKat(y, arM, 0xffd0d8, -0.11, ty + 0.34, k * 0.2, 0.07, 0.09, 0.05);
  } else if (id === 'pati') {
    arKat(y, arSil, 0xfff1dc, 0, ty + 0.02, 0, 0.3, 0.07, 0.3, PI / 2);
    arKat(y, arInceHalka, 0xff9d3c, 0, ty + 0.02, 0, 0.3, 0.3, 0.5);
    for (const k of [-1, 1]) {
      arKat(y, arM, 0xff7fa8, 0, ty - 0.045, k * 0.04, 0.125, 0.1, 0.03);
      for (const q of [[-0.165, 0.06], [-0.06, 0.15], [0.06, 0.15], [0.165, 0.06]]) arKat(y, arM, 0xff7fa8, q[0], ty + q[1], k * 0.04, 0.055, 0.062, 0.028);
    }
  } else {   // firildak: dört renkli kanat ayrı parçada döner
    const dn = new T.Group(), dy = arYapi(), rk = [0xff4a4a, 0xffd23e, 0x3aa6ff, 0x4ccf5a];
    dn.position.set(0, ty + 0.04, 0); dn.userData.arSus = true;
    for (let q = 0; q < 4; q++) {
      const an = q * PI / 2;
      for (const k of [-1, 1]) arKat(dy, arKoniGeo, k < 0 ? rk[q] : arKoyult(rk[q], 0.82), -Math.sin(an) * 0.03 + Math.cos(an) * 0.075, Math.cos(an) * 0.03 + Math.sin(an) * 0.075, k * 0.012, 0.15, 0.36, 0.022, 0, 0, an + 0.28);
    }
    arKat(dy, arM, 0xffffff, 0, 0, 0, 0.065, 0.065, 0.075);
    const dm = arBitir(dy, dn, arBoya); dm.userData.arSus = true; gr.add(dn); gr.userData.donen = dn;
    arKat(y, arM, 0x3a404c, 0, ty + 0.04, 0, 0.04, 0.04, 0.06);
  }
  const m = arBitir(y, gr, arBoya); m.userData.arSus = true;
  a.govde.add(gr); a.arEk.push(gr); st.bayrakG = gr;
}
function arabaSusle(a, secim) {   // garaj süslerini uygular; tekrar çağrılınca yalnız değişeni yeniler (iz ve korna başka dosyaların işi)
  if (!a || !a.g || !a.govde || !a.teker) return;
  secim = secim || {};
  if (!a.arSus) a.arSus = { renk: 'varsayilan', teker: 'klasik', bayrak: 'yok', ilk: null, bayrakG: null, yer: null, r: a.arRenk, r2: a.arRenk2 };
  try { arSusBoya(a, secim.renk || 'varsayilan'); arSusTeker(a, secim.teker || 'klasik'); arSusBayrak(a, secim.bayrak || 'yok'); } catch (e) { console.error(e); }
}

// ───────── sürpriz güç görünümleri (a.guc): dev, köpük balonu, pırıltı, mıknatıs ─────────
const arGucKopGeo = new T.SphereGeometry(1, 22, 14);
const arGucPirGeo = (() => {   // dokuz küçük dört köşeli yıldız: her yönden görünsün diye iki çapraz düzlemde
  const p = [], w = 0.17, yildiz = (cx, cy, cz, r) => {
    for (const dz of [0, 1]) for (const yat of [0, 1]) {
      const q = yat ? [[r, 0], [0, r * w], [-r, 0], [0, -r * w]] : [[0, r], [r * w, 0], [0, -r], [-r * w, 0]];
      for (const u of [[0, 1, 2], [0, 2, 3]]) for (const k of u) p.push(cx + (dz ? 0 : q[k][0]), cy + q[k][1], cz + (dz ? q[k][0] : 0));
    }
  };
  for (let i = 0; i < 9; i++) { const an = i / 9 * Math.PI * 2 + (i & 1) * 0.3; yildiz(Math.cos(an) * 1.55, 0.55 + arRast(i + 3) * 1.75, Math.sin(an) * 2.25, 0.2 + arRast(i + 11) * 0.16); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); return g;
})();
const arGucMikGeo = (() => {   // at nalı mıknatıs: kırmızı kavis, beyaz uçlar (uçlar aşağıya, arabaya bakar)
  const y = arYapi();
  arKat(y, new T.TorusGeometry(0.34, 0.115, 6, 12, Math.PI), 0xf03a34, 0, 0, 0, 1, 1, 1);
  for (const x of [-1, 1]) { arKat(y, arSil, 0xf03a34, x * 0.34, -0.1, 0, 0.115, 0.2, 0.115); arKat(y, arSil, 0xf6f8fc, x * 0.34, -0.27, 0, 0.118, 0.15, 0.118); }
  return arGeo(y);
})();
const arOrtakGeo = new Set([arGucKopGeo, arGucPirGeo, arGucMikGeo]);
const arGucKopMat = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uA: { value: 1 } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'varying vec3 vN; varying vec3 vV; uniform float uA; void main(){ vec3 n = normalize(vN); float f = 1.0 - abs(dot(n, normalize(vV))); float k = pow(f, 2.0);' +
    ' vec3 c = mix(vec3(0.62, 0.9, 1.0), vec3(1.0, 0.74, 0.95), smoothstep(0.35, 1.0, f)); float par = smoothstep(0.9, 0.97, dot(n, normalize(vec3(-0.5, 0.72, 0.48)))) + 0.5 * smoothstep(0.965, 0.99, dot(n, normalize(vec3(0.55, -0.5, 0.67))));' +
    ' gl_FragColor = vec4(c + par, clamp(0.07 + 0.75 * k + par * 0.85, 0.0, 1.0) * uA);\n#include <colorspace_fragment>\n}' });
const arGucKanatGeo = (() => {   // altın-krem şirin kanat (tek taraf, diğeri aynalanır)
  const y = arYapi();
  arKat(y, G.kutu, 0xffe478, 0.48, 0.12, 0, 0.92, 0.09, 0.56, 0, 0, 0.12);
  arKat(y, G.kutu, 0xfff8dc, 0.84, 0.22, -0.06, 0.56, 0.08, 0.42, 0, -0.18, 0.2);
  arKat(y, G.kutu, 0x7fd8ff, 0.44, 0.14, 0.12, 0.68, 0.07, 0.24, 0, 0.08, 0.08);
  return arGeo(y);
})();
const arGucTurboGeo = (() => {   // süper turbo: çift altın-turuncu itici alev
  const y = arYapi();
  for (const yan of [-1, 1]) {
    arKat(y, arKoniGeo, 0xff7a1a, yan * 0.46, 0, 0, 0.26, 0.9, 0.26, -Math.PI / 2, 0, 0);
    arKat(y, arKoniGeo, 0xffe866, yan * 0.46, 0, 0.06, 0.15, 0.58, 0.15, -Math.PI / 2, 0, 0);
  }
  return arGeo(y);
})();
function arGucKur(a) {
  const knt = [-1, 1].map(yan => { const m = new T.Mesh(arGucKanatGeo, arBoya); m.position.set(yan * 0.92, 1.05, -0.15); if (yan < 0) m.scale.x = -1; m.visible = false; a.g.add(m); return m; });
  const trb = new T.Mesh(arGucTurboGeo, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 })); trb.position.set(0, 0.72, -1.95); trb.visible = false; a.g.add(trb);
  const pir = [0xfff3a0, 0xffffff].map((c, i) => { const m = new T.Mesh(arGucPirGeo, new T.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, side: T.DoubleSide })); m.renderOrder = 5; m.visible = false; if (i) { m.rotation.y = 0.35; m.position.y = 0.25; } a.g.add(m); return m; });
  const mik = new T.Mesh(arGucMikGeo, arBoya); mik.position.set(0, 3.15, -0.2); mik.visible = false; a.g.add(mik);
  return { knt, trb, pir, mik };
}
function arGucGorunum(a, s, t, dt) {   // arabaYerlestir sonunda: etkiler yumuşakça girer/çıkar
  const tur = a.guc && a.guc.kalan > 0.3 ? a.guc.tur : null;
  if (s.gD === undefined) { s.gD = 0; s.gK = 0; s.gP = 0; s.gM = 0; }
  const k = arYumusak(dt, 6);
  s.gD += ((tur === 'turbo' ? 1 : 0) - s.gD) * k; s.gK += ((tur === 'kanat' ? 1 : 0) - s.gK) * k; s.gP += ((tur === 'gokkusagi' ? 1 : 0) - s.gP) * k; s.gM += ((tur === 'miknatis' ? 1 : 0) - s.gM) * k;
  s.gAcik = !!tur || s.gD + s.gK + s.gP + s.gM > 0.004;
  if (!s.gAcik) s.gD = s.gK = s.gP = s.gM = 0;
  if (!a.arGuc) { if (!s.gAcik) { a.g.scale.setScalar(1); return; } a.arGuc = arGucKur(a); }
  const g = a.arGuc;
  a.g.scale.setScalar(1);
  // turbo: arkada altın-turuncu çift alev nabzı
  g.trb.visible = s.gD > 0.01;
  if (g.trb.visible) { const p = 0.9 + Math.sin(t * 14) * 0.12; g.trb.scale.set(s.gD, s.gD, s.gD * p); g.trb.material.opacity = 0.9 * s.gD; }
  // kanat: iki yanda çırpınan altın-mavi kanatlar
  const kGor = s.gK > 0.01, cirp = Math.sin(t * 7.5) * 0.38;
  for (let i = 0; i < 2; i++) {
    const m = g.knt[i]; m.visible = kGor;
    if (kGor) { const yan = i ? 1 : -1; m.scale.set(yan * s.gK, s.gK, s.gK); m.rotation.z = yan * (0.1 + cirp); }
  }
  // gökkuşağı: titreşimsiz, yumuşak dönen pırıltılı yıldızlar
  for (let i = 0; i < 2; i++) {
    const m = g.pir[i]; m.visible = s.gP > 0.01;
    if (m.visible) { const f = 0.88 + 0.12 * Math.sin(t * 1.8 + i * 1.5); m.material.opacity = s.gP * f; m.rotation.y = (i ? 0.35 : 0) + t * (i ? -0.7 : 0.9); m.scale.setScalar(0.85 + 0.15 * s.gP); }
  }
  g.mik.visible = s.gM > 0.01;
  if (g.mik.visible) { const b = s.gM * (1 + Math.sin(t * 6) * 0.04); g.mik.scale.setScalar(b * 1.25); g.mik.position.y = 3.2 + Math.sin(t * 3.4) * 0.1; g.mik.rotation.z = Math.sin(t * 2.6) * 0.3; g.mik.rotation.y = Math.sin(t * 1.7) * 0.5; }
}
// rakip tepkileri ve garaj sevinci
OLAY.on('gecti', v => { if (typeof A !== 'undefined' && v && A[v.i] && v.i > 0 && A[v.i].ar) A[v.i].ar.el = 0; });
OLAY.on('gecildi', v => { if (typeof A !== 'undefined' && v && A[v.i] && v.i > 0 && A[v.i].ar) A[v.i].ar.el = 0; });
OLAY.on('garaj', () => { if (typeof A !== 'undefined' && A[0].ar) A[0].ar.gar = 0; });

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
  if (s.el === undefined) { s.el = 9; s.gar = 9; s.gK = 0; } s.el += dt; s.gar += dt;
  // garajda süs değişince küçük sevinç zıplaması; köpük balonunda araba yoldan yükselip süzülür
  const garU = s.gar < 0.5 ? s.gar / 0.5 : 1, garY = garU < 1 ? Math.sin(garU * Math.PI) * 0.42 : 0, garEz = garU < 1 ? Math.sin(garU * Math.PI * 2) * 0.09 : s.gar < 0.95 ? -0.07 * Math.exp(-8 * (s.gar - 0.5)) * Math.cos((s.gar - 0.5) * 18) : 0;
  const kopY = s.gK > 0 ? s.gK * (0.38 + Math.sin(s.t * 3.2) * 0.08) : 0;
  let elU = s.el < 1.2 ? Math.min(1, s.el / 0.18, (1.2 - s.el) / 0.28) : 0, elYaw = 0, elKol = -1; elU = elU * elU * (3 - 2 * elU);
  if (elU > 0 && typeof A !== 'undefined' && a !== A[0]) { const dd = A[0].d - a.d; let dz = A[0].yol - a.yol; if (Math.abs(dz) > 60) dz = 2; elYaw = clamp(Math.atan2(-dd, dz), -1.25, 1.25); elKol = dd > 0 ? 0 : 1; }
  // merhaba: seçim ekranında yeni araba küçük bir zıplar, kendi çevresinde bir tur döner, yumuşakça yere konar
  const merU = s.mer < 0.85 ? s.mer / 0.85 : 1, merDon = merU < 1 ? merU * merU * (3 - 2 * merU) * Math.PI * 2 : 0, merY = merU < 1 ? Math.sin(merU * Math.PI) * 0.6 : 0;
  const merEz = merU < 1 ? Math.sin(merU * Math.PI) * 0.07 : s.mer < 1.35 ? -0.08 * Math.exp(-7 * (s.mer - 0.85)) * Math.cos((s.mer - 0.85) * 16) : 0;
  const k = arYumusak(dt, 8), t = s.t, hiz = Math.min(1, a.v / 26);
  const ivme = dt > 0 ? clamp((a.v - s.v0) / dt, -30, 30) : 0; s.v0 = a.v; s.ivme += (ivme - s.ivme) * arYumusak(dt, 5);
  const don = clamp(-Math.atan2(a.dv, Math.max(8, a.v)) * 1.7 - p.k * a.v * 0.3, -0.5, 0.5); s.don += (don - s.don) * k;
  s.sev += ((a.bitti ? 1 : 0) - s.sev) * arYumusak(dt, 4);
  a.g.position.set(x, y + merY + garY + kopY, z);
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
  es += s.sev * (zs - 0.5) * 0.11 + (s.sek < 0.35 ? Math.sin(s.sek / 0.35 * Math.PI) * 0.07 : 0) + merEz + garEz;
  // oyuncak esnemesi (yalnız görsel): hızlanınca boyuna uzar, frende kısalıp kabarır, virajda hafif yayvanlaşır
  const uz = clamp(s.ivme * 0.0032, -0.055, 0.075), yayv = Math.min(0.05, Math.abs(s.egz) * 0.32);
  a.govde.scale.set((1 - es * 0.5) * (1 + yayv), (1 + es) * (1 - uz * 0.55 - yayv * 0.4), (1 - es * 0.5) * (1 + uz));
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
  // küçük sevinçler: yıldızda baş kalkar ve bir el havaya (sv), rokette baş geriye yaslanır (rk)
  if (s.rok === undefined) s.rok = 9; s.rok += dt;
  const sv = s.sek < 0.7 ? Math.sin(s.sek / 0.7 * Math.PI) ** 2 : 0, rk = s.rok < 0.8 ? Math.sin(s.rok / 0.8 * Math.PI) ** 2 : 0;   // yumuşak başlar, yumuşak biter
  a.arKafa.rotation.set(Math.sin(t * 2.2 + a.faz) * 0.03 - s.sev * 0.2 - (havada ? 0.18 : 0) + s.ivme * 0.003 - sv * 0.2 - rk * 0.24, s.bak, -s.bak * 0.22 + s.sev * Math.sin(t * 6.5 + a.faz) * 0.2 + sv * 0.1);
  a.arKafa.position.y = 1.76 + sv * 0.035 + s.sev * zs * 0.03;
  if (elU > 0) { a.arKafa.rotation.y += (elYaw - a.arKafa.rotation.y) * elU; a.arKafa.rotation.z += Math.sin(t * 9) * 0.07 * elU; }   // el sallarken Feza'ya bakar
  if (a.arGoz) {
    const dongu = 3.5 + a.i * 0.29, faz = (t + 1.3 + a.i * 0.57) % dongu;
    const kp = faz > dongu - 0.18 ? Math.sin((faz - dongu + 0.18) / 0.18 * Math.PI) : 0;
    a.arGoz.morphTargetInfluences[0] = kp; a.arGoz.morphTargetInfluences[1] = kp > 0.75 ? (kp - 0.75) * 4 : 0;
  }
  for (let i = 0; i < 2; i++) {
    const kg = a.arKol[i], yon = kg.userData.yon, el = Math.sin(t * 11 + i * 2.4 + a.faz);
    const aci = a.arDireksiyon.rotation.z, wx = yon * 0.17 * Math.cos(aci), wy = yon * 0.17 * Math.sin(aci);
    arKolYon.set(wx - kg.position.x, 1.139 + wy * 0.796084 - kg.position.y, 0.422 - wy * 0.605186 - kg.position.z);
    const uzun = arKolYon.length(); arKolYon.multiplyScalar(1 / Math.max(uzun, 0.001));
    arKolQ.setFromUnitVectors(arKolEksen, arKolYon);
    const kutla = Math.max(s.sev, i === 1 ? sv * 0.9 : 0);
    if (kutla > 0.001) { arSevQ.setFromEuler(arSevE.set(-1.95 + el * 0.3 * s.sev + Math.sin(t * 6.5 + a.faz + i * Math.PI) * 0.35 * s.sev, yon * (0.5 + el * 0.16 * s.sev), yon * 0.1)); arKolQ.slerp(arSevQ, kutla); }
    const elK = i === elKol ? elU : 0;
    if (elK > 0.001) { arSevQ.setFromEuler(arSevE.set(-1.75, yon * (0.95 + Math.sin(t * 14) * 0.45), yon * 0.12)); arKolQ.slerp(arSevQ, elK); }   // rakip el sallar
    kg.quaternion.copy(arKolQ); kg.scale.z = lerp(uzun / 0.6, 1, Math.max(kutla, elK));
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
    else if (tr === 'lamba') { const f = Math.sin(t * 9 + a.faz), b = 0.75 + 0.25 * Math.abs(f); if (f > 0) e.material.color.setRGB(0.12 * b, 0.5 * b, 1.0 * b); else e.material.color.setRGB(1.0 * b, 0.2 * b, 0.16 * b); e.scale.set(0.19 + Math.abs(f) * 0.035, 0.24 + Math.abs(f) * 0.04, 0.19 + Math.abs(f) * 0.035); e.rotation.y = t * 7; }   // mavi-kırmızı dönen tepe lambası
    else if (tr === 'anten') { e.rotation.x = -(s.sal * 0.55 + clamp(s.ivme * 0.016, -0.35, 0.35)) + Math.sin(t * 14 + a.faz) * 0.11 * (0.25 + hiz) + (s.inis < 0.7 ? Math.sin(s.inis * 20) * 0.3 * (1 - s.inis / 0.7) : 0); e.rotation.z = yanal * 0.9 - s.egz * 2.2 + Math.sin(t * 11.3 + a.faz) * 0.09 * (0.25 + hiz); }
    else if (tr === 'bayrak') {   // garaj süsü: anten hızla geriye esner, viraja yatar; fırıldak hızla döner, balon daha çok salınır
      const bk = e.userData.salin || 1;
      e.rotation.x = -(s.sal * 0.5 + clamp(s.ivme * 0.014, -0.3, 0.3)) * bk + Math.sin(t * 12 + a.faz) * 0.07 * (0.3 + hiz) * bk + (s.inis < 0.7 ? Math.sin(s.inis * 20) * 0.26 * (1 - s.inis / 0.7) : 0) - (garU < 1 ? Math.sin(garU * Math.PI * 3) * 0.3 * (1 - garU) : 0);
      e.rotation.z = (yanal * 0.8 - s.egz * 2) * bk + Math.sin(t * 9.7 + a.faz) * 0.06 * (0.3 + hiz) * bk + Math.sin(t * 1.9 + a.faz) * 0.035 * bk;
      e.scale.y = 1 + Math.sin(t * 12 + a.faz) * 0.012 * hiz - s.sal * 0.03;
      const dn = e.userData.donen; if (dn) dn.rotation.z = (dn.rotation.z + dt * (2.2 + Math.min(a.v, 30) * 0.75)) % (Math.PI * 2);
    }
    else if (tr === 'pervane') e.rotation.z = (e.rotation.z + dt * (4 + Math.min(a.v, 14) * 1.1)) % (Math.PI * 2);   // hızda bile kanatlar seçilir (çakışma titremesi olmaz)
    else if (tr === 'yele2') { const dl = e.userData.faz || 0; e.rotation.x = -s.sal * 0.3 - (havada ? 0.15 : 0) + Math.sin(t * 9 + a.faz + dl) * 0.07 * (0.35 + hiz); e.rotation.z = -yanal * 0.5 + Math.sin(t * 6.3 + a.faz + dl) * 0.06 * (0.35 + hiz); }
    else if (tr === 'kanatcik') { const cp = Math.sin(t * (5 + hiz * 7) + a.faz); e.scale.set(1 - cp * 0.06, 1 + cp * (0.2 + (havada ? 0.15 : 0)), 1); }
    else if (tr === 'kanat') { const cp = Math.sin(t * (7 + hiz * 9) + a.faz); e.rotation.x = cp * (0.16 + hiz * 0.2 + s.sev * 0.25) - (havada ? 0.35 : 0); e.scale.x = 1 + cp * 0.07 + (havada ? 0.15 : 0); }
  }
  if (a.arAlev && a.arAlev.visible) { const ic = a.arAlev.userData.ic, f = Math.sin(t * 71) * 0.5 + Math.sin(t * 43) * 0.5; ic.scale.set(0.58 + f * 0.08, 0.66 + f * 0.14, 0.58 + f * 0.08); }
  if (typeof A !== 'undefined' && a === A[0]) arSerpAdim(dt);
  arSerpinti(a, x, z, a.g.rotation.y, havada, dt);
  a.golge.position.set(x, 0.07, z); a.golge.rotation.z = a.g.rotation.y;
  a.golge.scale.setScalar(1 + Math.min(0.32, y * 0.15)); a.golge.material.opacity = Math.max(0.55, 1 - y * 0.22);
  if (a.guc || s.gAcik) arGucGorunum(a, s, t, dt);
  a.x = x; a.z = z; a.tx = p.tx; a.tz = p.tz;
}
