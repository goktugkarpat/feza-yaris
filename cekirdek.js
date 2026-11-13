/* Çekirdek: yardımcılar, çizici, kamera, pist matematiği, ortak veriler. Bütün dosyalar buradaki adları kullanır.
   Klasik betikler aynı genel kapsamı paylaşır: üst düzey const/let/function adları her dosyadan görünür (adları değiştirme). */
'use strict';

const Q = new URLSearchParams(location.search);
const PIST_TEMALARI = ['orman', 'kiyi', 'kar', 'seker', 'uzay', 'col', 'gokkusagi', 'dino', 'sehir', 'sato', 'lunapark', 'korsan', 'denizalti', 'ciftlik', 'muzik'];   // yeni pist = buraya ad + PIST_NOKTALARI + cevre_<ad>.js + index.html kartı
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
// Pist başına renk eğrisi (ışık karakteri): doy = doygunluk, gol = gölgelere çok hafif renk (koyular biraz kalkar: yüz/arka yüzler kararmaz),
// isk = aydınlık yerlerin tonu (sıcak/serin), poz = pozlama. Değerler bilerek küçük; gök dokusu ve sis bundan etkilenmez.
const ISIK_TON = {
  orman:     { doy: 1.08, gol: [0.004, 0.018, 0.010], isk: [1.04, 1.0, 0.94], poz: 1.0, kenar: 0.32 },    // sıcak sabah, yeşil dolgu
  kiyi:      { doy: 1.10, gol: [0.000, 0.018, 0.024], isk: [1.01, 1.0, 0.985], poz: 1.02, kenar: 0.28 },    // parlak öğle, turkuaz gölge
  kar:       { doy: 1.07, gol: [0.000, 0.012, 0.040], isk: [1.03, 1.0, 0.95], poz: 0.97, kenar: 0.32 },     // serin mavi gölge, sıcak güneş
  seker:     { doy: 1.07, gol: [0.024, 0.006, 0.018], isk: [1.01, 0.99, 0.99], poz: 0.97, kenar: 0.24 },    // yumuşak pastel, pembe
  uzay:      { doy: 1.07, gol: [0.014, 0.004, 0.030], isk: [0.975, 0.995, 1.035], poz: 1.04, kenar: 0.4 },   // serin ana ışık, mor dolgu
  col:       { doy: 1.08, gol: [0.016, 0.004, 0.020], isk: [1.035, 1.0, 0.93], poz: 1.0, kenar: 0.45 },     // altın gün batımı, menekşe gölge
  gokkusagi: { doy: 1.03, gol: [0.024, 0.022, 0.030], isk: [1.0, 1.0, 1.0], poz: 1.0, kenar: 0.22 },        // süt gibi yumuşak, aydınlık
  dino:      { doy: 1.10, gol: [0.006, 0.014, 0.004], isk: [1.04, 1.0, 0.94], poz: 1.0, kenar: 0.32 },      // sıcak tropik
  sehir:     { doy: 1.10, gol: [0.002, 0.008, 0.020], isk: [1.01, 1.0, 0.98], poz: 1.02, kenar: 0.28 },     // canlı, temiz gündüz
  /*SATO*/ sato:         { doy: 1.08, gol: [0.006, 0.012, 0.016], isk: [1.045, 1.0, 0.93], poz: 1.0, kenar: 0.3 }, /*/SATO*/   // altın masal gündüzü, serin mavi-yeşil gölge
  /*LUNAPARK*/ lunapark: { doy: 1.08, gol: [0.016, 0.006, 0.034], isk: [1.03, 1.0, 0.97], poz: 1.06, kenar: 0.42 }, /*/LUNAPARK*/   // sıcak akşam: mor dolgu, sıcak ışık, aydınlık (arabalar kararmaz)
  /*KORSAN*/ korsan:     { doy: 1.10, gol: [0.002, 0.016, 0.018], isk: [1.035, 1.0, 0.95], poz: 1.01, kenar: 0.3 }, /*/KORSAN*/   // sıcak tropik öğle, turkuaz gölge
  /*DENIZALTI*/ denizalti: { doy: 1.12, gol: [0.005, 0.024, 0.032], isk: [0.94, 1.03, 1.06], poz: 1.02, kenar: 0.32 }, /*/DENIZALTI*/
  /*CIFTLIK*/ ciftlik:   { doy: 1.12, gol: [0.010, 0.014, 0.004], isk: [1.04, 1.02, 0.94], poz: 1.02, kenar: 0.28 }, /*/CIFTLIK*/
  /*MUZIK*/   muzik:     { doy: 1.14, gol: [0.014, 0.008, 0.022], isk: [1.03, 0.99, 1.02], poz: 1.02, kenar: 0.30 } /*/MUZIK*/
}[PIST_TEMA];
const glV = a => 'vec3( ' + a.map(v => v.toFixed(4)).join(', ') + ' )';
T.ShaderChunk.tonemapping_pars_fragment = T.ShaderChunk.tonemapping_pars_fragment.replace('vec3 CustomToneMapping( vec3 color ) { return color; }',
  'vec3 CustomToneMapping( vec3 color ) {\n\tcolor *= toneMappingExposure;\n\tfloat l = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );\n\tcolor = max( vec3( l ) + ( color - vec3( l ) ) * ' + ISIK_TON.doy.toFixed(3) + ', vec3( 0.0 ) );\n' +
  '\tcolor += ' + glV(ISIK_TON.gol) + ' * ( 1.0 - smoothstep( 0.0, 0.6, l ) );\n\tcolor *= mix( vec3( 1.0 ), ' + glV(ISIK_TON.isk) + ', smoothstep( 0.25, 0.85, l ) );\n' +
  '\tfloat p = max( color.r, max( color.g, color.b ) );\n\tif ( p > 0.8 ) color *= ( 1.0 - 0.04 / ( p - 0.6 ) ) / p;\n\treturn color;\n}');
renderer.toneMapping = T.CustomToneMapping; renderer.toneMappingExposure = ISIK_TON.poz;
// Hacim: dik yüzlerin kenarında çok hafif açık vurgu (rim) → kutu/karton yüzler yuvarlak ve hacimli okunur. Yer ve çatı gibi yatay yüzlere değmez (uzakta yol/çimen ağarmaz).
// Güneş kenarı: güneş nesnenin arkasındayken (yarış kamerasında çoğu zaman) silüete güneş renginde ince bir parlaklık → arabalar/sürücüler zeminden ayrışır.
// Lambert/Phong/Standard ortak parçası; ek ışık, doku ya da geçiş yok.
T.ShaderChunk.lights_fragment_end += '\n{\n\tfloat rimK = 1.0 - saturate( dot( geometryNormal, geometryViewDir ) );\n\tfloat rimD = 1.0 - abs( dot( geometryNormal, normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz ) ) );\n\treflectedLight.indirectDiffuse += diffuseColor.rgb * ( rimK * rimK * rimK * rimD * 0.3 );\n#if NUM_DIR_LIGHTS > 0\n\tfloat rimS = saturate( dot( directionalLights[ 0 ].direction, - geometryViewDir ) * 0.7 + 0.3 );\n\treflectedLight.directDiffuse += diffuseColor.rgb * directionalLights[ 0 ].color * ( rimK * rimK * rimD * rimS * ' + ISIK_TON.kenar.toFixed(3) + ' );\n#endif\n}\n';
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
  const A = ISIK_AYAR[PIST_TEMA];
  f.near = Math.min(f.near, A.sis[0]); f.far = Math.min(f.far, A.sis[1]);
  // Işık karakteri: pist dosyasının güneş/gök ayarının üstüne yumuşak bir dokunuş (tonu çevirir, yerine geçmez). Işık sayısı aynı (2).
  // Güneşin yönü (yatay) gökteki güneşle aynı kalır; yalnız yüksekliği değişir. Gök dolgusu yüksek tutulur: arabaların arkası ve yüzler kararmaz.
  if (typeof cvGokIsik !== 'undefined' && typeof gunes !== 'undefined') {
    gunes.color.multiply(new T.Color(A.gr)); gunes.intensity *= A.gi; gunes.position.y *= A.gy;
    cvGokIsik.color.lerp(new T.Color(A.ust), 0.5); cvGokIsik.groundColor.lerp(new T.Color(A.alt), 0.5).multiplyScalar(A.altK); cvGokIsik.intensity *= A.di;
  }
});
// gr = güneş rengi çarpanı, gi = güneş gücü çarpanı, gy = güneş yüksekliği çarpanı, ust/alt = gök/zemin dolgu renk hedefi (yarı yarıya), altK = alt dolgu koyuluğu,
// di = dolgu gücü çarpanı, sis = [yakın, uzak] en çok (renk pist dosyasının).
const ISIK_AYAR = {
  orman:     { gr: 0xffe8c8, gi: 1.2,  gy: 0.62, ust: 0xfff6e2, alt: 0xa9bd8c, altK: 0.85, di: 0.9,  sis: [90, 820] },
  kiyi:      { gr: 0xfffaf0, gi: 1.22, gy: 0.8,  ust: 0xeafcff, alt: 0xb4dcd2, altK: 0.9,  di: 0.92, sis: [120, 860] },
  kar:       { gr: 0xffe2bc, gi: 1.2,  gy: 0.6,  ust: 0xd8e6ff, alt: 0xa6bedf, altK: 0.85, di: 0.9,  sis: [90, 820] },
  seker:     { gr: 0xfff0e8, gi: 1.12, gy: 0.75, ust: 0xfff2f8, alt: 0xf2b4cc, altK: 0.88, di: 0.93, sis: [90, 800] },
  uzay:      { gr: 0xccdcff, gi: 1.02, gy: 0.8,  ust: 0xe8e6ff, alt: 0xa490d6, altK: 0.9,  di: 1.0,  sis: [260, 880] },
  col:       { gr: 0xffe0b0, gi: 1.15, gy: 0.72, ust: 0xffecd8, alt: 0xd49470, altK: 0.85, di: 0.9,  sis: [80, 780] },
  gokkusagi: { gr: 0xfff8f0, gi: 1.05, gy: 0.9,  ust: 0xffffff, alt: 0xf6dcea, altK: 0.95, di: 1.0,  sis: [70, 720] },
  dino:      { gr: 0xffe6b4, gi: 1.2,  gy: 0.7,  ust: 0xf6ffe8, alt: 0xb4bc86, altK: 0.85, di: 0.9,  sis: [90, 820] },
  sehir:     { gr: 0xfff6ea, gi: 1.2,  gy: 0.8,  ust: 0xf4faff, alt: 0xc8c8bc, altK: 0.85, di: 0.9,  sis: [100, 840] },
  /*SATO*/ sato:         { gr: 0xffe4b8, gi: 1.22, gy: 0.68, ust: 0xfff6e0, alt: 0xb2bc8e, altK: 0.86, di: 0.9,  sis: [100, 840] }, /*/SATO*/
  /*LUNAPARK*/ lunapark: { gr: 0xffe6c8, gi: 1.08, gy: 0.8,  ust: 0xeee8ff, alt: 0xa894d8, altK: 0.92, di: 1.0,  sis: [220, 880] }, /*/LUNAPARK*/   // lunapark ışığı: sıcak ana ışık, lila dolgu
  /*KORSAN*/ korsan:     { gr: 0xfff0d4, gi: 1.2,  gy: 0.72, ust: 0xf2fcf6, alt: 0xc8c49a, altK: 0.88, di: 0.92, sis: [110, 860] }, /*/KORSAN*/   // sıcak güneş, kum yansıması
  /*DENIZALTI*/ denizalti: { gr: 0xc8fbff, gi: 1.05, gy: 0.78, ust: 0x9ef4ff, alt: 0x52a8b8, altK: 0.92, di: 0.98, sis: [120, 740] }, /*/DENIZALTI*/
  /*CIFTLIK*/ ciftlik:   { gr: 0xfff4d6, gi: 1.24, gy: 0.76, ust: 0xf4fbff, alt: 0xc8c88c, altK: 0.86, di: 0.94, sis: [130, 880] }, /*/CIFTLIK*/
  /*MUZIK*/   muzik:     { gr: 0xfff0ff, gi: 1.18, gy: 0.78, ust: 0xf6f0ff, alt: 0xd0c4e8, altK: 0.90, di: 0.96, sis: [130, 860] } /*/MUZIK*/
};

function tuvalDoku(w, h, ciz, tekrar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; ciz(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  if (tekrar) { t.wrapS = t.wrapT = T.RepeatWrapping; }
  return t;
}


// ───────── pist ─────────
const GEN = 14, YARI = GEN / 2, DMAX = YARI - 1.0, TUR = 3;
const PIST_NOKTALARI = {
  orman:     [[0, 0], [55, -4], [100, -30], [118, -80], [95, -128], [45, -140], [10, -112], [-25, -95], [-60, -118], [-105, -110], [-128, -65], [-105, -22], [-55, -2]],
  kiyi:      [[0, 0], [68, 4], [124, -18], [146, -68], [118, -118], [58, -134], [0, -112], [-52, -130], [-112, -112], [-140, -60], [-112, -12], [-56, 6]],
  kar:       [[0, 0], [62, 4], [118, -16], [124, -72], [88, -120], [36, -112], [-2, -148], [-54, -158], [-106, -128], [-126, -72], [-98, -24], [-50, -2]],
  seker:     [[0, 0], [60, -10], [112, -46], [112, -102], [62, -136], [10, -118], [-34, -96], [-78, -126], [-126, -106], [-130, -48], [-88, -8], [-44, 2]],
  uzay:      [[0, 0], [66, 8], [122, -18], [132, -74], [86, -116], [36, -104], [-2, -148], [-60, -156], [-112, -120], [-124, -62], [-104, -8], [-52, 8]],
  col:       [[0, 0], [76, 0], [132, -16], [142, -68], [98, -112], [44, -108], [4, -146], [-54, -154], [-112, -120], [-128, -62], [-94, -16], [-46, 0]],
  gokkusagi: [[0, 0], [64, 12], [122, 4], [152, -38], [130, -88], [74, -116], [12, -124], [-56, -116], [-114, -86], [-136, -36], [-102, 8], [-48, 10]],
  dino:      [[0, 0], [58, -6], [112, -28], [132, -76], [94, -118], [42, -112], [6, -146], [-52, -154], [-104, -124], [-124, -70], [-90, -28], [-46, -4]],
  sehir:     [[0, 0], [76, 0], [126, -10], [134, -54], [132, -104], [92, -134], [36, -134], [0, -108], [-38, -134], [-94, -134], [-132, -102], [-132, -46], [-112, -8], [-58, 0]],
  /*SATO*/ sato: [[0, 0], [66, 0], [124, -20], [144, -72], [112, -126], [48, -148], [-22, -148], [-92, -128], [-134, -78], [-118, -22], [-60, 2]], /*/SATO*/
  /*LUNAPARK*/ lunapark: [[0, 0], [68, -6], [124, -34], [136, -88], [90, -130], [34, -118], [-12, -92], [-60, -124], [-114, -122], [-136, -68], [-106, -16], [-54, 0]], /*/LUNAPARK*/
  /*KORSAN*/ korsan: [[0, 0], [64, 12], [122, -8], [138, -62], [102, -112], [48, -120], [6, -94], [-38, -124], [-92, -136], [-132, -96], [-124, -36], [-78, 4], [-38, 4]], /*/KORSAN*/
  /*DENIZALTI*/ denizalti: [[0, 0], [62, -14], [118, -2], [142, 48], [108, 102], [50, 120], [-6, 94], [-56, 124], [-114, 108], [-136, 54], [-106, 4], [-52, -14]], /*/DENIZALTI*/
  /*CIFTLIK*/ ciftlik: [[0, 0], [76, 4], [136, -14], [148, -70], [108, -118], [50, -116], [4, -88], [-44, -120], [-98, -128], [-134, -82], [-118, -22], [-68, 8], [-34, 4]], /*/CIFTLIK*/
  /*MUZIK*/ muzik: [[0, 0], [62, -10], [118, 8], [140, 60], [102, 110], [48, 118], [4, 92], [-42, 122], [-98, 124], [-132, 76], [-116, 18], [-72, -16], [-36, -12]] /*/MUZIK*/
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
  oySurprizDuzenle(tur);
  OLAY.emit('turduzen', { tur });
}
// Sürpriz balonlar: tur başına 3 balon (yıldız sıraları, oklar ve rampalarla çakışmayan boş yerlerde). s = pist boyunca metre, d = yanal konum,
// tur = balonun türü ('dev' | 'baloncuk' | 'gokkusagi' | 'miknatis'), var = duruyor mu. Her turda yeniden çıkar; türler ve şeritler sırayla değişir.
// Nesneler yerinde güncellenir (yeni nesne yok); görselleri pist.js çizer, toplama mantığı oyun.js'te.
const SURPRIZ_TURLER = ['turbo', 'kanat', 'gokkusagi', 'miknatis'];
const SURPRIZ = [0.25, 0.598, 0.94].map((u, j) => ({ s: L * u, d: 0, tur: SURPRIZ_TURLER[j], var: true, j, x: 0, z: 0 }));
function oySurprizDuzenle(tur) {   // tur = kaçıncı tur (0, 1, 2)
  const yan = [-2.2, 2.2, 0];
  for (const b of SURPRIZ) {
    b.tur = SURPRIZ_TURLER[(tur * 3 + b.j) % SURPRIZ_TURLER.length]; b.d = yan[(b.j + tur) % 3]; b.var = true;
    const p = pist(b.s); b.x = p.x - p.tz * b.d; b.z = p.z + p.tx * b.d;
  }
}
yildizDuzenle(0);
const G = { kutu: new T.BoxGeometry(1, 1, 1), kure: new T.SphereGeometry(1, 16, 12), sil: new T.CylinderGeometry(1, 1, 1, 16), koni: new T.ConeGeometry(1, 1, 10) };
