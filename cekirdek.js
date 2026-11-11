/* Çekirdek: yardımcılar, çizici, kamera, pist matematiği, ortak veriler. Bütün dosyalar buradaki adları kullanır.
   Klasik betikler aynı genel kapsamı paylaşır: üst düzey const/let/function adları her dosyadan görünür (adları değiştirme). */
'use strict';

const Q = new URLSearchParams(location.search);
const ZAMAN = Math.max(0.25, Math.min(12, parseFloat(Q.get('hiz')) || 1)), OTO = Q.has('oto');
const $ = id => document.getElementById(id);
const T = THREE, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
let tohum = 20261111; const R = () => { tohum = (tohum * 1664525 + 1013904223) >>> 0; return tohum / 4294967296; };

// ───────── çizici ─────────
const canvas = $('c');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = T.SRGBColorSpace;
let oran = Math.min(window.devicePixelRatio || 1, 2);
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(62, 1, 0.3, 900);
function boyut() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(oran); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = w < h ? 78 : 62; camera.updateProjectionMatrix();
}
addEventListener('resize', boyut); addEventListener('orientationchange', () => setTimeout(boyut, 250)); boyut();

function tuvalDoku(w, h, ciz, tekrar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; ciz(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  if (tekrar) { t.wrapS = t.wrapT = T.RepeatWrapping; }
  return t;
}


// ───────── pist ─────────
const GEN = 14, YARI = GEN / 2, DMAX = YARI - 1.0, TUR = 3;
const NOKTA = [[0, 0], [55, -4], [100, -30], [118, -80], [95, -128], [45, -140], [10, -112], [-25, -95], [-60, -118], [-105, -110], [-128, -65], [-105, -22], [-55, -2]];
const egri = new T.CatmullRomCurve3(NOKTA.map(p => new T.Vector3(p[0], 0, p[1])), true, 'centripetal');
const N = 800, L = egri.getLength(), DS = L / N;
const PX = new Float32Array(N), PZ = new Float32Array(N), TX = new Float32Array(N), TZ = new Float32Array(N), KAP = new Float32Array(N);
{
  const pts = egri.getSpacedPoints(N);
  for (let i = 0; i < N; i++) { PX[i] = pts[i].x; PZ[i] = pts[i].z; }
  for (let i = 0; i < N; i++) { const a = (i + N - 1) % N, b = (i + 1) % N; let x = PX[b] - PX[a], z = PZ[b] - PZ[a]; const m = Math.hypot(x, z) || 1; TX[i] = x / m; TZ[i] = z / m; }
  for (let i = 0; i < N; i++) { const b = (i + 1) % N; KAP[i] = ((TX[b] - TX[i]) * -TZ[i] + (TZ[b] - TZ[i]) * TX[i]) / DS; }   // + = sağa dönüş
}
const _o = { x: 0, z: 0, tx: 0, tz: 1, k: 0 };
function pist(s, o) {   // s (m) → merkez konum, yön, eğrilik
  o = o || _o; const u = (((s % L) + L) % L) / DS, i = Math.floor(u) % N, f = u - Math.floor(u), j = (i + 1) % N;
  o.x = lerp(PX[i], PX[j], f); o.z = lerp(PZ[i], PZ[j], f);
  let tx = lerp(TX[i], TX[j], f), tz = lerp(TZ[i], TZ[j], f); const m = Math.hypot(tx, tz) || 1; o.tx = tx / m; o.tz = tz / m; o.k = lerp(KAP[i], KAP[j], f);
  return o;
}
function serit(sol, sag, y, vOlcek) {   // pist boyunca şerit (yol, kenar bandı)
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const k = i % N, rx = -TZ[k], rz = TX[k], v = i * DS / vOlcek;
    pos.push(PX[k] + rx * sol, y, PZ[k] + rz * sol, PX[k] + rx * sag, y, PZ[k] + rz * sag); uv.push(0, v, 1, v);
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const mat = (renk, o) => new T.MeshLambertMaterial(Object.assign({ color: renk }, o || {}));

const yakin = (x, z) => { let en = 1e9; for (let i = 0; i < N; i += 2) { const d = (PX[i] - x) * (PX[i] - x) + (PZ[i] - z) * (PZ[i] - z); if (d < en) en = d; } return Math.sqrt(en); };
const kukla = new T.Object3D(), renkT = new T.Color();
function cok(geo, malzeme, liste) {   // liste: [x,y,z, sx,sy,sz, ry, renk?]
  const im = new T.InstancedMesh(geo, malzeme, liste.length);
  liste.forEach((p, i) => { kukla.position.set(p[0], p[1], p[2]); kukla.scale.set(p[3], p[4], p[5]); kukla.rotation.set(0, p[6] || 0, 0); kukla.updateMatrix(); im.setMatrixAt(i, kukla.matrix); if (p[7] !== undefined) im.setColorAt(i, renkT.setHex(p[7])); });
  im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.frustumCulled = false; scene.add(im); return im;
}
const o1 = { x: 0, z: 0, tx: 0, tz: 1, k: 0 };
// Olaylar: OLAY.on(ad, fn) / OLAY.emit(ad, veri). Adlar: durum(d) · yildiz(n) · tur(n) · roket · hop · tok · bitis(sira) · sayim(n)
const OLAY = (() => { const m = {}; return { on(a, f) { (m[a] = m[a] || []).push(f); }, emit(a, v) { const l = m[a]; if (l) for (const f of l) { try { f(v); } catch (e) { console.error(e); } } } }; })();
// Pist üstü nesnelerin verisi (görselleri pist.js'te): s = pist boyunca metre, d = yanal konum
const OKLAR = [{ s: L * 0.2, d: 2.5 }, { s: L * 0.52, d: -2.5 }, { s: L * 0.83, d: 0 }];
const TUMSEK = [{ s: L * 0.36, d: 0 }, { s: L * 0.68, d: 2 }];
const YILDIZ = []; { for (let k = 0; k < 8; k++) { const s0 = L * (0.07 + k * 0.115), d = [-3.6, 0, 3.6, 0][k % 4]; for (let j = 0; j < 3; j++) YILDIZ.push({ s: s0 + j * 7, d, var: true, pat: 0 }); } }
for (const y of YILDIZ) { const p = pist(y.s); y.x = p.x - p.tz * y.d; y.z = p.z + p.tx * y.d; }
const G = { kutu: new T.BoxGeometry(1, 1, 1), kure: new T.SphereGeometry(1, 16, 12), sil: new T.CylinderGeometry(1, 1, 1, 16), koni: new T.ConeGeometry(1, 1, 10) };
