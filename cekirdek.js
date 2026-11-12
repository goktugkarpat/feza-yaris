/* Çekirdek: yardımcılar, çizici, kamera, pist matematiği, ortak veriler. Bütün dosyalar buradaki adları kullanır.
   Klasik betikler aynı genel kapsamı paylaşır: üst düzey const/let/function adları her dosyadan görünür (adları değiştirme). */
'use strict';

const Q = new URLSearchParams(location.search);
const PIST_TEMALARI = ['orman', 'kiyi', 'kar', 'seker', 'uzay', 'col', 'gokkusagi', 'dino', 'sehir'];   // yeni pist = buraya ad + PIST_NOKTALARI + cevre_<ad>.js + index.html kartı
const PIST_TEMA = PIST_TEMALARI.includes(Q.get('pist')) ? Q.get('pist') : 'orman';
const ZAMAN = Math.max(0.25, Math.min(12, parseFloat(Q.get('hiz')) || 1)), OTO = Q.has('oto');
const $ = id => document.getElementById(id);
const T = THREE, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
let tohum = 20261111; const R = () => { tohum = (tohum * 1664525 + 1013904223) >>> 0; return tohum / 4294967296; };

// ───────── çizici ─────────
const canvas = $('c');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = T.SRGBColorSpace;
// Renk: sakin, temiz palet için çok hafif doygunluk + yumuşak omuz (0,8'e kadar renk aynı, üstü 1'e yavaşça yaklaşır: kar/beyazlar patlamaz, ton korunur).
// Ek çizim geçişi yok; her malzemenin sonunda birkaç işlem. Sis ton eşlemeden SONRA karıştığı için ufuk/gök renkleri değişmez.
T.ShaderChunk.tonemapping_pars_fragment = T.ShaderChunk.tonemapping_pars_fragment.replace('vec3 CustomToneMapping( vec3 color ) { return color; }',
  'vec3 CustomToneMapping( vec3 color ) {\n\tcolor *= toneMappingExposure;\n\tfloat l = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );\n\tcolor = max( vec3( l ) + ( color - vec3( l ) ) * 1.06, vec3( 0.0 ) );\n\tfloat p = max( color.r, max( color.g, color.b ) );\n\tif ( p > 0.8 ) color *= ( 1.0 - 0.04 / ( p - 0.6 ) ) / p;\n\treturn color;\n}');
renderer.toneMapping = T.CustomToneMapping; renderer.toneMappingExposure = 1;
// Hacim: dik yüzlerin kenarında çok hafif açık vurgu (rim) → kutu/karton yüzler yuvarlak ve hacimli okunur. Yer ve çatı gibi yatay yüzlere değmez (uzakta yol/çimen ağarmaz).
// Lambert/Phong/Standard ortak parçası; ek ışık, doku ya da geçiş yok.
T.ShaderChunk.lights_fragment_end += '\n{\n\tfloat rimK = 1.0 - saturate( dot( geometryNormal, geometryViewDir ) );\n\tfloat rimD = 1.0 - abs( dot( geometryNormal, normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz ) ) );\n\treflectedLight.indirectDiffuse += diffuseColor.rgb * ( rimK * rimK * rimK * rimD * 0.3 );\n}\n';
// Çizim oranı: en çok 2 ve ekran başına ~4,6 milyon piksel (12,9" iPad'de ≈1,8; 11"de 2). Kare uzarsa oyun.js daha da düşürür.
const oranTavan = () => clamp(Math.sqrt(4.6e6 / Math.max(1, innerWidth * innerHeight)), 1, 2);
let oran = Math.min(window.devicePixelRatio || 1, oranTavan());
let cizimSurumu = 0;
const scene = new T.Scene();
const camera = new T.PerspectiveCamera(62, 1, 0.3, 900);
function boyut() {
  const w = innerWidth, h = innerHeight;
  oran = Math.min(oran, Math.max(oranTavan(), 1));
  renderer.setPixelRatio(oran); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = w < h ? 78 : 62; camera.updateProjectionMatrix();
  cizimSurumu++;
}
addEventListener('resize', boyut); addEventListener('orientationchange', () => setTimeout(boyut, 250)); boyut();
canvas.addEventListener('webglcontextrestored', () => { cizimSurumu++; });
// Uzak katman: hafif hava derinliği (uzak süsler gökle soluklaşır, kalabalık sakinleşir) ve kamera sınırında (900 m) kırpışma görünmesin.
// Pist dosyaları sis rengini ve uzaklığını kurar; burada yalnız yakın/uzak sınırlar daraltılır (renk aynı kalır), bir kez, yüklenince.
addEventListener('load', () => {
  const f = scene.fog; if (!f || f.isFogExp2) return;
  if (PIST_TEMA === 'uzay') { f.near = Math.min(f.near, 260); f.far = Math.min(f.far, 880); }
  else { f.near = Math.min(f.near, 90); f.far = Math.min(f.far, 820); }
  // Işık: güneş biraz daha sıcak ve biraz daha yandan (yüzler ayrışır), gök dolgusu biraz az (renk tonu değişmez: pembeler gölgede leylağa kaymasın), alt yüzler biraz koyu → karton düzlüğü yerine hacim.
  if (PIST_TEMA !== 'uzay' && typeof cvGokIsik !== 'undefined' && typeof gunes !== 'undefined') {
    gunes.color.multiply(new T.Color(0xfff3e6)); gunes.intensity *= 1.2; gunes.position.y *= 0.7;
    cvGokIsik.intensity *= 0.88; cvGokIsik.groundColor.multiplyScalar(0.8);
  }
});

function tuvalDoku(w, h, ciz, tekrar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; ciz(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  if (tekrar) { t.wrapS = t.wrapT = T.RepeatWrapping; }
  return t;
}


// ───────── pist ─────────
const GEN = 14, YARI = GEN / 2, DMAX = YARI - 1.0, TUR = 3;
const PIST_NOKTALARI = {
  orman: [[0, 0], [55, -4], [100, -30], [118, -80], [95, -128], [45, -140], [10, -112], [-25, -95], [-60, -118], [-105, -110], [-128, -65], [-105, -22], [-55, -2]],
  kiyi: [[0, 0], [65, 0], [116, -21], [139, -62], [126, -106], [82, -128], [24, -119], [-20, -91], [-66, -104], [-118, -93], [-135, -53], [-114, -12], [-59, 5]],
  seker: [[0, 0], [50, -6], [95, -28], [112, -70], [90, -108], [48, -118], [20, -150], [-30, -160], [-75, -140], [-96, -104], [-90, -70], [-112, -40], [-100, -8], [-50, 2]],
  uzay: [[0, 0], [60, 4], [115, -12], [140, -55], [120, -98], [75, -110], [40, -88], [0, -105], [-45, -128], [-100, -118], [-135, -80], [-125, -35], [-85, -10], [-45, -4]],
  col: [[0, 0], [70, 0], [125, -18], [135, -60], [100, -95], [55, -100], [25, -135], [-25, -150], [-80, -135], [-118, -100], [-120, -66], [-134, -34], [-104, -4], [-45, 4]],
  gokkusagi: [[0, 0], [55, 2], [105, -15], [130, -55], [118, -100], [78, -125], [30, -118], [-5, -96], [-40, -112], [-85, -135], [-128, -110], [-138, -62], [-110, -22], [-55, -6]],
  dino: [[0, 0], [60, -2], [108, -22], [125, -62], [108, -100], [70, -118], [38, -104], [6, -119], [-30, -145], [-78, -138], [-112, -108], [-120, -65], [-100, -28], [-52, -4]],
  sehir: [[0, 0], [70, 0], [118, -8], [132, -45], [130, -95], [105, -128], [55, -132], [20, -110], [-20, -112], [-60, -132], [-108, -125], [-130, -90], [-128, -40], [-105, -8], [-55, 0]],
  kar: [[0, 0], [48, 8], [91, -4], [121, -35], [111, -72], [77, -87], [53, -122], [4, -141], [-48, -131], [-79, -101], [-121, -83], [-137, -45], [-112, -13], [-61, -8]]
};
const NOKTA = PIST_NOKTALARI[PIST_TEMA];
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
// Olaylar: durum(d), yildiz(y), tur(n), turduzen({tur}), roket(sure), hop, inis, tok, bitis(sira), sonuc, sayim(n).
// Ek göstergeler: seri({adet,hedef,odul,toplam}), ilerleme({tur,oran,toplam,roket}), ozet({yildiz,roket,ziplama,seri,sira,sure}).
const OLAY = (() => { const m = {}; return { on(a, f) { (m[a] = m[a] || []).push(f); }, emit(a, v) { const l = m[a]; if (l) for (const f of l) { try { f(v); } catch (e) { console.error(e); } } } }; })();
// Pist üstü nesnelerin verisi (görselleri pist.js'te): s = pist boyunca metre, d = yanal konum
const OKLAR = [{ s: L * 0.2, d: 2.5, tur: -1 }, { s: L * 0.52, d: -2.5, tur: -1 }, { s: L * 0.83, d: 0, tur: -1 }];
const TUMSEK = [{ s: L * 0.36, d: 0, tur: -1 }, { s: L * 0.68, d: 2, tur: -1 }];
// Görsel rampa ve teker teması aynı ölçüleri kullanır; diğer bütün yol düzdür.
const RAMPA = { bas: -1.6, tepe: 2.3, son: 3, h: 0.92, yari: 2.9, ucus: PIST_TEMA === 'uzay' ? 1.45 : PIST_TEMA === 'gokkusagi' ? 1.15 : 0.95, yuk: PIST_TEMA === 'uzay' ? 2.5 : PIST_TEMA === 'gokkusagi' ? 2.15 : 1.9, firlat: 1.1, aks: 1.05, iz: 0.97, temas: 0.2 };   // ucus = havada kalma (sn), yuk = zıplama yüksekliği (m); Ay'da az yer çekimi, gökkuşağında hafif süzülme
function rampaYukseklik(yol, d, pay) {
  let h = 0;
  for (const r of TUMSEK) {
    if (Math.abs(d - r.d) > RAMPA.yari + (pay || 0)) continue;
    const z = (((yol - r.s + L / 2) % L) + L) % L - L / 2;
    if (z < RAMPA.bas || z > RAMPA.son) continue;
    const y = z <= RAMPA.tepe ? RAMPA.h * (z - RAMPA.bas) / (RAMPA.tepe - RAMPA.bas) : RAMPA.h * (RAMPA.son - z) / (RAMPA.son - RAMPA.tepe);
    if (y > h) h = y;
  }
  return h;
}
function rampaZemin(a, yol) {
  yol = yol === undefined ? a.yol : yol;
  const ayak = a.rampaAyak || (a.rampaAyak = new Float32Array(4));
  const beta = -Math.atan2(a.dv || 0, Math.max(8, a.v || 0)) * 0.9, cs = Math.cos(beta), sn = Math.sin(beta);
  for (let i = 0; i < 4; i++) {
    const x = i & 1 ? RAMPA.iz : -RAMPA.iz, z = i < 2 ? -RAMPA.aks : RAMPA.aks;
    ayak[i] = rampaYukseklik(yol - x * sn + z * cs, a.d - x * cs - z * sn, RAMPA.temas);
  }
  const arka = (ayak[0] + ayak[1]) * 0.5, on = (ayak[2] + ayak[3]) * 0.5, xEksi = (ayak[0] + ayak[2]) * 0.5, xArti = (ayak[1] + ayak[3]) * 0.5;
  a.rampaY = (arka + on) * 0.5; a.rampaEgim = Math.atan2(on - arka, RAMPA.aks * 2); a.rampaYatis = Math.atan2(xArti - xEksi, RAMPA.iz * 2);
  return a;
}
const YILDIZ = [];
{
  for (let k = 0; k < 8; k++) {
    const s0 = L * (0.07 + k * 0.115);
    for (let j = 0; j < 3; j++) YILDIZ.push({ s: s0 + j * 7, d: 0, grup: k, j, var: true, pat: 0 });
  }
}
// Aynı ormanda üç küçük keşif: düz yıldız sıraları, yumuşak kıvrımlar, karşı şeritte yeni sıralar.
// Nesneler yerinde güncellenir; pist.js aynı yıldızları çizdiği için yeni ağ/model oluşturulmaz.
function yildizDuzenle(tur) {
  const merkezler = tur === 2 ? [0, 3.4, 0, -3.4, 3.4, 0, -3.4, 0] : [-3.6, 0, 3.6, 0, -3.6, 0, 3.6, 0];
  for (const y of YILDIZ) {
    const egim = tur === 1 ? (y.j - 1) * (y.grup % 2 ? -1 : 1) * 1.0 : tur === 2 ? Math.sin(y.j * Math.PI / 2) * (y.grup % 2 ? -0.65 : 0.65) : 0;
    y.d = clamp(merkezler[y.grup] + egim, -4.5, 4.5);
    y.var = true; y.pat = 0;
    const p = pist(y.s); y.x = p.x - p.tz * y.d; y.z = p.z + p.tx * y.d;
  }
  OLAY.emit('turduzen', { tur });
}
yildizDuzenle(0);
const G = { kutu: new T.BoxGeometry(1, 1, 1), kure: new T.SphereGeometry(1, 16, 12), sil: new T.CylinderGeometry(1, 1, 1, 16), koni: new T.ConeGeometry(1, 1, 10) };
