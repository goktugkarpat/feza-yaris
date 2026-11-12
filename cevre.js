/* Çevre: gök, ışık, zemin, ağaçlar ve süsler, uzak tepeler, bulutlar. cevreGuncelle(dt, t) her karede çağrılır.
   Buradaki yeni üst düzey adlar `cv` ile başlar. Hareket (rüzgâr, zıplama, kanat) gölgelendiricide yapılır: kare başına matris güncellemesi yok. */
'use strict';
const cvTema = typeof PIST_TEMA === 'string' ? PIST_TEMA : 'orman';

// ───────── gök, ışık ─────────
scene.background = tuvalDoku(8, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  // Gök dokusu ekrana sabittir; ufuk çizgisi ekranın ~%40'ında olduğundan açık ve sıcak tonlar oraya denk getirilir.
  const d = cvTema==='kiyi' ? ['#1b8fdc', '#3fa9ec', '#86d3f6', '#c9f0fb', '#fff0cf'] : cvTema==='kar' ? ['#4388d2', '#69a9e6', '#a6d0f4', '#dcecff', '#ffe6ec'] : ['#2a84e2', '#4ea6f1', '#8fcff9', '#cfeeff', '#fff2d2'];
  [0, 0.14, 0.29, 0.39, 0.47].forEach((u, i) => gr.addColorStop(u, d[i])); gr.addColorStop(1, d[4]);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
scene.fog = new T.Fog(0xdaf2ff, 330, 950);
// Yeşil zemin ışığı yüzleri yeşertmesin; ten ve beyazlar nötr, ortam yine aydınlık kalır.
const cvGokIsik = new T.HemisphereLight(0xffffff, cvTema==='kiyi'?0xd1bda0:cvTema==='kar'?0xc4dbe4:0xb8aa94, cvTema==='kar'?1.0:1.18); scene.add(cvGokIsik);   // seker/uzay/col pistleri kendi dosyalarında (cevre_<ad>.js) gök, ışık ve zemini değiştirir
const gunes = new T.DirectionalLight(0xfff2d0, cvTema==='kar'?1.15:1.5); gunes.position.set(95, 120, -45); scene.add(gunes);

const cvZ = { value: 0 };   // ortak zaman (gölgelendiriciler için)
const cvOyuncu = { value: new T.Vector2(0,0) };
const cvHAREKET = [
  '',
  // 1: ağaç tepeleri rüzgârda hafifçe salınır
  '#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.13 + instanceMatrix[3].z * 0.17; float cvW = transformed.y * transformed.y * 0.0034;\ntransformed.x += sin(cvT * 1.4 + cvF) * cvW; transformed.z += cos(cvT * 1.1 + cvF * 1.3) * cvW * 0.7;\n#endif',
  // 2: hayvanlar zıplar (cvK.y) ve el sallar (cvK.z)
  '#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 2.3;\nfloat cvYakin = 1.0 - smoothstep(8.0, 31.0, distance(instanceMatrix[3].xz, cvP));\nfloat cvH = abs(sin(cvT * 3.4 + cvF)) * smoothstep(-0.3, 0.3, sin(cvT * 0.7 + cvF * 0.37));\ntransformed.y += cvK.y * cvH * (0.10 + cvYakin * 0.42); transformed.x += cvK.z * sin(cvT * 9.0 + cvF) * (0.035 + cvYakin * 0.20); transformed.y += cvK.z * cos(cvT * 9.0 + cvF) * 0.05;\n#endif',
  // 3: kuşlar kanat çırpar
  '#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.7;\ntransformed.y += abs(position.x) * sin(cvT * 6.5 + cvF) * 0.55;\n#endif',
  // 4: çiçeklerin üstündeki kelebekler, kanat uçları çırpar; gövde sakin süzülür
  '#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.73 + instanceMatrix[3].z * 1.13;\ntransformed.y += abs(position.x) * sin(cvT * 10.0 + cvF) * 0.9 + sin(cvT * 1.7 + cvF) * 0.17;\ntransformed.x += sin(cvT * 0.9 + cvF) * 0.35; transformed.z += cos(cvT * 0.7 + cvF) * 0.3;\n#endif',
  // 5: birleşik süs geometrisi: bayraklar dalgalanır (cvK.y), kayık ve şamandıralar suda sallanır (cvK.z)
  'transformed.y += cvK.y * sin(cvT * 5.5 + position.x * 1.7 + position.z * 1.3) * 0.11 + cvK.z * sin(cvT * 1.5 + position.x * 0.03 + position.z * 0.04) * 0.14;',
  // 6: su parıltıları yanıp söner
  '#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 1.3 + instanceMatrix[3].z * 2.1;\ntransformed.xz *= max(0.0, sin(cvT * 1.7 + cvF));\n#endif',
  // 7: yunuslar yay çizerek sudan sıçrar
  '#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.9; float cvA = cvT * 1.3 + cvF; float cvE = cos(cvA) * 0.95; float cvCe = cos(cvE), cvSe = sin(cvE);\nvec2 cvQ = vec2(transformed.z * cvCe - transformed.y * cvSe, transformed.z * cvSe + transformed.y * cvCe);\ntransformed.z = cvQ.x - cos(cvA) * 2.4; transformed.y = cvQ.y + sin(cvA) * 2.5 - 1.5;\n#endif'
];
function cvMalz(mod, o) {   // köşe renkli malzeme; kopya rengi yalnız cvK.x = 1 olan parçaları boyar
  const m = new T.MeshLambertMaterial(Object.assign({ color: 0xffffff, vertexColors: true }, o || {}));
  m.onBeforeCompile = sh => {
    sh.uniforms.cvT = cvZ; sh.uniforms.cvP = cvOyuncu;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float cvT;\nuniform vec2 cvP;\nattribute vec3 cvK;')
      .replace('#include <color_vertex>', 'vColor = color;\n#ifdef USE_INSTANCING_COLOR\nvColor *= mix(vec3(1.0), instanceColor.xyz, cvK.x);\n#endif')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + cvHAREKET[mod]);
    if (cvTema === 'kar') sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance += vColor.rgb * 0.30 * smoothstep(0.80, 0.93, min(vColor.r, min(vColor.g, vColor.b)));\n#endif');   // karlı parçalar (çatı, yığın, dal üstü) zemindeki kar gibi ak kalsın
  };
  m.customProgramCacheKey = () => 'cv' + mod + cvTema;
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
      const tn = geo.userData.cvTon;   // yumuşak biçimlerde alttan üste ton geçişi (alt hafif koyu, üst açık)
      for (let i = 0; i < p.count; i++) {
        const f = tn ? 0.84 + 0.24 * clamp(p.getY(i) + 0.5, 0, 1) : 1;
        v.fromBufferAttribute(p, i).applyMatrix4(m); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
        col.push(Math.min(1, c.r * f), Math.min(1, c.g * f), Math.min(1, c.b * f)); kk.push(kt || 0, kz || 0, ke || 0);
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
  sil: new T.CylinderGeometry(1, 1, 1, 10), sil5: new T.CylinderGeometry(1, 1, 1, 5, 1, true), govde: new T.CylinderGeometry(0.7, 1, 1, 6, 1, true), govdeK: new T.CylinderGeometry(0.8, 1, 1, 10),
  koni: new T.ConeGeometry(1, 1, 7), koni6: new T.ConeGeometry(1, 1, 6), ucgen: new T.ConeGeometry(1, 1, 3), yarim: new T.SphereGeometry(1, 16, 6, 0, 6.2832, 0, 1.5708), yarimK: new T.SphereGeometry(1, 8, 3, 0, 6.2832, 0, 1.5708),
  daire: new T.CircleGeometry(1, 16), tac: new T.SphereGeometry(1, 8, 5), tacY: new T.SphereGeometry(1, 10, 7), kureY: new T.SphereGeometry(1, 8, 5), kutu: G.kutu
};
{ // Yerdeki çiçeklerde görünmeyen alt yüzler çizilmez; üstteki kabarık taç yaprağı korunur.
  const g=cvG.okt.index?cvG.okt.toNonIndexed():cvG.okt,p=g.attributes.position,n=g.attributes.normal,pos=[],nor=[];
  for(let i=0;i<p.count;i+=3)if(p.getY(i)+p.getY(i+1)+p.getY(i+2)>0.01)for(let j=0;j<3;j++){pos.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));nor.push(n.getX(i+j),n.getY(i+j),n.getZ(i+j));}
  cvG.petal=new T.BufferGeometry();cvG.petal.setAttribute('position',new T.Float32BufferAttribute(pos,3));cvG.petal.setAttribute('normal',new T.Float32BufferAttribute(nor,3));
  const catilar=[-2.8,0,2.4,0,1.7,2.4,-2.8,0,-2.4,0,1.7,2.4,0,1.7,-2.4,-2.8,0,-2.4,0,1.7,2.4,2.8,0,2.4,0,1.7,-2.4,2.8,0,2.4,2.8,0,-2.4,0,1.7,-2.4,-2.8,0,2.4,2.8,0,2.4,0,1.7,2.4,2.8,0,-2.4,-2.8,0,-2.4,0,1.7,-2.4];
  cvG.cati=new T.BufferGeometry();cvG.cati.setAttribute('position',new T.Float32BufferAttribute(catilar,3));cvG.cati.computeVertexNormals();
  cvG.semsiye=new T.BufferGeometry();cvG.semsiye.setAttribute('position',new T.Float32BufferAttribute([0,.6,0,Math.SQRT1_2,0,Math.SQRT1_2,1,0,0],3));cvG.semsiye.computeVertexNormals();
}
function cvTon(g) {   // çizgi film gölgesi: tacın altı koyu-serin, üstü açık-sıcak (yalnız boyanan taç parçaları, cvK.x = 1)
  const n = g.attributes.normal, c = g.attributes.color, k = g.attributes.cvK;
  for (let i = 0; i < n.count; i++) if (k.getX(i) > 0.5) { const u = n.getY(i), f = u > 0 ? 1 + u * 0.07 : 1 + u * 0.13; c.setXYZ(i, Math.min(1, c.getX(i) * f), Math.min(1, c.getY(i) * f), Math.min(1, c.getZ(i) * f)); }
  return g;
}
let cvDagYG = null;
function cvDagY() {   // yumuşak omuzlu, yuvarlak doruklu çizgi film dağı (kendine benzer: üst %40'ı aynı biçimde kar başlığı olur)
  if (cvDagYG) return cvDagYG;
  const g = new T.ConeGeometry(1, 1, 16, 6), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const t = p.getY(i) + .5, k = t < 1 ? Math.pow(1 - t, .62) / (1 - t) : 0; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  g.computeVertexNormals(); return (cvDagYG = g);
}
function cvBulutGeo() {   // pofuduk çizgi film bulutu: düz taban, üstte yuvarlak kümeler; alt yüz hafif mavi gölgeli, üst bembeyaz
  const B = cvYapi(), k = new T.SphereGeometry(1, 9, 6);
  for (const q of [[0, 1, 0, 11, 8.5, 9], [-10, -.5, 1, 8.5, 6.5, 7.5], [10.5, -.3, -1, 9, 6.8, 7.5], [4.5, 5, 1.5, 7.5, 6.5, 6.5], [-4.5, 4, -1, 6.5, 5.5, 6], [-18, -2.5, 0, 5.5, 4, 5], [18.5, -2.5, .5, 5.5, 4, 5], [0, -1.5, 5, 9, 5, 4.5]]) B.ekle(k, q[0], q[1], q[2], q[3], q[4], q[5], 0xffffff);
  const g = B.geo(), p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
  for (let i = 0; i < p.count; i++) { const y = Math.max(p.getY(i), -3.4); p.setY(i, y); const t = clamp((y + 3.4) / 7, 0, 1) * .6 + clamp(n.getY(i) * .5 + .5, 0, 1) * .4, r = 1 - .05 * Math.max(0, n.getX(i)); c.setXYZ(i, lerp(.74, 1, t) * r, lerp(.83, 1, t) * r, lerp(.97, 1, t)); }
  return g;
}
{ // Karton gibi durmasın: yuvarlak köşeli tombul kutu ve kalın, saçaklı, kabarık çatı (yumuşak normaller + ton geçişi)
  const g = new T.BoxGeometry(1, 1, 1, 2, 2, 2), p = g.attributes.position, n = g.attributes.normal, r = 0.2, q = new T.Vector3(), c = new T.Vector3();
  for (let i = 0; i < p.count; i++) { q.fromBufferAttribute(p, i); c.set(clamp(q.x, -.5 + r, .5 - r), clamp(q.y, -.5 + r, .5 - r), clamp(q.z, -.5 + r, .5 - r)); q.sub(c).normalize(); n.setXYZ(i, q.x, q.y, q.z); q.multiplyScalar(r).add(c); p.setXYZ(i, q.x, q.y, q.z); }
  g.userData.cvTon = true; cvG.kutuY = g;
  const sk = new T.Shape(); sk.moveTo(-2.55, 0); sk.quadraticCurveTo(-1.3, 1.05, -0.2, 1.62); sk.quadraticCurveTo(0, 1.72, 0.2, 1.62); sk.quadraticCurveTo(1.3, 1.05, 2.55, 0); sk.quadraticCurveTo(0, 0.55, -2.55, 0);
  const cg = new T.ExtrudeGeometry(sk, { depth: 4.5, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.16, bevelSegments: 2, curveSegments: 6 }); cg.translate(0, 0, -2.25); cg.computeVertexNormals();
  cg.userData.cvTon = true; cvG.catiY = cg;   // cati ile aynı ölçü (x ±2.8, y 0..1.7, z ±2.4), ama kalın ve kubbemsi
}
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
  if(cvTema==='kiyi') {
    g.fillStyle='#2bb8d4';g.fillRect(0,0,w,h);g.lineCap='round';
    for(let k=0;k<85;k++){const x=R()*w,y=R()*h;g.strokeStyle=k%3?'rgba(160,242,245,.25)':'rgba(237,255,246,.50)';g.lineWidth=1+R()*3;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+10,y-4,x+21,y+4,x+34,y);g.stroke();}
    return;
  }
  if(cvTema==='kar') {
    g.fillStyle='#e9f5ff';g.fillRect(0,0,w,h);
    for(let k=0;k<100;k++){const x=R()*w,y=R()*h,r=10+R()*42;g.fillStyle=k%3?'rgba(169,207,235,.20)':'rgba(255,255,255,.65)';for(const ox of [-w,0,w])for(const oy of [-h,0,h]){g.beginPath();g.ellipse(x+ox,y+oy,r,r*.35,-.35,0,7);g.fill();}}
    for(let k=0;k<360;k++){g.fillStyle=k%2?'#ffffff':'#d5e9fa';g.fillRect(R()*w,R()*h,1.5,1.5);}return;
  }
  g.fillStyle = '#6cc24a'; g.fillRect(0, 0, w, h);
  const leke = (x, y, r) => { for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) { if (x + ox < -r || x + ox > w + r || y + oy < -r || y + oy > h + r) continue; g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill(); } };
  for (let i = 0; i < 46; i++) { g.fillStyle = ['#84d45c', '#5db443', '#93dc68', '#58ad40', '#7ccb50'][i % 5]; g.globalAlpha = 0.2; const x = R() * w, y = R() * h, r = 28 + R() * 52; leke(x, y, r); leke(x + r * 0.5, y + r * 0.3, r * 0.7); }
  for (let i = 0; i < 520; i++) { g.fillStyle = ['#7ccd58', '#63b643', '#86d662', '#5fb040'][i % 4]; g.globalAlpha = 0.38; leke(R() * w, R() * h, 3 + R() * 9); }
  for (let i = 0; i < 2600; i++) { g.fillStyle = ['#9be070', '#55a83c', '#b0e884', '#4fa038'][i % 4]; g.globalAlpha = 0.55; const x = R() * w, y = R() * h; g.fillRect(x, y, 1.5, 3 + R() * 4); }
  for (let k = 0; k < 7; k++) { const cx = R() * w, cy = R() * h; for (let i = 0; i < 16; i++) { g.fillStyle = ['#ffffff', '#ffe46b', '#ffb3d6', '#ffffff'][(i + k) % 4]; g.globalAlpha = 0.9; leke(cx + (R() - 0.5) * 70, cy + (R() - 0.5) * 70, 1.5 + R() * 1.3); } }
  g.globalAlpha = 1;
}, true); cimDoku.repeat.set(cvTema==='kiyi'?27:46,cvTema==='kiyi'?27:46);
const zemin = new T.Mesh(new T.PlaneGeometry(1500, 1500, 44, 44), mat(0xffffff, { map: cimDoku, vertexColors: true }));
{
  const p = zemin.geometry.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), v = 0.9 + 0.1 * Math.sin(x * 0.021 + 1) * Math.cos(y * 0.017) + 0.07 * Math.sin(x * 0.05 + y * 0.043); c[i * 3] = v * (0.96 + 0.06 * Math.sin(y * 0.03)); c[i * 3 + 1] = v; c[i * 3 + 2] = v * 0.92; if (cvTema === 'kar') { const k = 0.95 + (v - 0.9) * 0.35; c[i * 3] = k * 0.95; c[i * 3 + 1] = k * 0.985; c[i * 3 + 2] = Math.min(1, k * 1.04); } }
  zemin.geometry.setAttribute('color', new T.BufferAttribute(c, 3));
}
if (cvTema === 'kar') { zemin.material.emissive.setHex(0xffffff); zemin.material.emissiveMap = cimDoku; zemin.material.emissiveIntensity = 0.26; }   // kar loş ışıkta grileşmesin
zemin.rotation.x = -Math.PI / 2; zemin.position.set(0, -0.02, -70); scene.add(zemin);
if(cvTema==='orman') { // yol kenarına doğru açılan çim ve ince toprak şeridi
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
    gr.addColorStop(0, 'rgba(255,254,240,1)'); gr.addColorStop(0.13, 'rgba(255,248,200,1)'); gr.addColorStop(0.17, 'rgba(255,246,196,0.6)'); gr.addColorStop(0.45, 'rgba(255,252,232,0.16)'); gr.addColorStop(1, 'rgba(255,252,232,0)');   // hale açık renk: soluk gökte koyu halka yapmaz
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }), transparent: true, depthWrite: false, fog: false
}));
cvGunes.scale.set(230, 230, 1); scene.add(cvGunes);
const cvGY = new T.Vector3(0.86, 0.3, -0.41).normalize();

let cvBulut = null, cvKus = null, cvSahilDoku = null, cvTel = null, cvKayan = null;
const cvDegirmen = [], cvOdak = [], cvGolgeler = [];
if(cvTema==='orman') {
  const beyaz = mat(0xffffff), S = cvYapi(), AHSAP = 0xb9824c, KOYU = 0x8f5c34, BAYRAK = [0xff6b6b, 0xffe066, 0x7fd6ff, 0x9af08f, 0xffb0dc, 0xcda8ff];
  const tavsan = [], sincap = [], geyik = [], baykus = [];

  // ── tahta çit ──
  const cit = (i0, say, yan) => {
    S.yer(0, 0, 0); let ox = 0, oz = 0, var_ = false;
    for (let k = 0; k <= say; k++) {
      const p = cvKenar(i0 + k * 4, yan, YARI + 3.7), x = p.x, z = p.z;
      if (yakin(x, z) < YARI + 3.2) { var_ = false; continue; }
      S.ekle(cvG.kutuY, x, 0.65, z, 0.3, 1.3, 0.3, KOYU, 0, p.ry); S.ekle(cvG.kutu, x, 1.34, z, 0.38, 0.1, 0.38, 0xd9a566, 0, p.ry);
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
    for (const x of [-0.85, 0.85]) S.ekle(cvG.kutuY, x, 1.3, -0.1, 0.2, 2.6, 0.2, KOYU);
    S.ekle(cvG.kutuY, 0, 2.35, -0.02, 2.7, 1.35, 0.1, KOYU); S.ekle(cvG.kutuY, 0, 2.35, 0.03, 2.45, 1.1, 0.1, 0xffeeb0);
    S.ekle(cvG.kutuY, -0.32 * sag, 2.35, 0.09, 1.05, 0.32, 0.06, 0xf0503c); S.ekle(cvG.ucgen, 0.52 * sag, 2.35, 0.09, 0.5, 0.75, 0.05, 0xf0503c, 0, 0, -sag * Math.PI / 2);
  };
  // ── mantar ev ──
  const mantarEv = (x, z, ry, s, renk) => {
    S.yer(x, z, ry, s); cvYasak.push([x, z, 6.2 * s]);
    S.ekle(cvG.govdeK, 0, 1.3, 0, 1.75, 2.6, 1.75, 0xfff1d6); S.ekle(cvG.sil, 0, 2.6, 0, 3.0, 0.3, 3.0, 0xf3d9b4); S.ekle(cvG.yarim, 0, 2.7, 0, 3.3, 2.5, 3.3, renk);
    for (let k = 0; k < 8; k++) { const fi = k < 2 ? 0.25 : 0.62 + (k % 2) * 0.42, a = k * 2.4 + 0.5, b = 0.5 - (k % 3) * 0.1; S.ekle(cvG.ufak, 3.3 * Math.sin(fi) * Math.sin(a), 2.72 + 2.5 * Math.cos(fi), 3.3 * Math.sin(fi) * Math.cos(a), b, 0.16, b, 0xffffff, fi * 0.8, a); }
    S.ekle(cvG.kutuY, 0, 0.72, 1.58, 0.95, 1.45, 0.22, 0xa5673a); S.ekle(cvG.sil, 0, 1.45, 1.56, 0.475, 0.22, 0.475, 0xa5673a, Math.PI / 2); S.ekle(cvG.ufak, 0.27, 0.8, 1.72, 0.08, 0.08, 0.08, 0xffd84a);
    S.ekle(cvG.kutuY, 0, 0.08, 2.0, 1.4, 0.16, 0.7, 0xc9ccd4);
    for (const a of [-1.0, 1.0]) {
      const wx = Math.sin(a) * 1.5, wz = Math.cos(a) * 1.5;
      S.ekle(cvG.sil, wx, 1.6, wz, 0.5, 0.2, 0.5, 0xa5673a, Math.PI / 2, a); S.ekle(cvG.sil, wx, 1.6, wz, 0.38, 0.26, 0.38, 0xffe27a, Math.PI / 2, a);
      S.ekle(cvG.kutuY, wx, 1.6, wz, 0.76, 0.07, 0.3, 0xa5673a, 0, a); S.ekle(cvG.kutuY, wx, 1.6, wz, 0.07, 0.76, 0.3, 0xa5673a, 0, a);
    }
    S.ekle(cvG.kutuY, -1.4, 4.9, -0.6, 0.5, 1.3, 0.5, 0xe08a62); S.ekle(cvG.kutuY, -1.4, 5.6, -0.6, 0.68, 0.18, 0.68, KOYU);
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
  // ── yol üstünde ahşap köprü görünümü: tahta döşeme, korkuluk, altından geçen dere (yalnız görünüş; yol düzdür) ──
  {
    const i0 = cvI(0.585), n = 9, SU = 0x4bbcf3;
    S.yer(0, 0, 0);
    for (let k = -n; k <= n; k++) { const i = (i0 + k + N) % N; S.ekle(cvG.kutu, PX[i], 0.035, PZ[i], GEN - 0.7, 0.04, DS * 0.97, k % 2 ? 0xd4a062 : 0xca9656, 0, Math.atan2(TX[i], TZ[i])); }
    for (const yan of [-1, 1]) {
      let ox = 0, oz = 0, var_ = false;
      for (let k = -n; k <= n; k += 3) {
        const p = cvKenar(i0 + k, yan, YARI + 1.5), x = p.x, z = p.z;
        S.ekle(cvG.kutuY, x, 0.85, z, 0.32, 1.7, 0.32, KOYU, 0, p.ry); S.ekle(cvG.ufak, x, 1.82, z, 0.25, 0.25, 0.25, 0xffc93d);
        if (var_) { const dx = x - ox, dz = z - oz, l = Math.hypot(dx, dz), ry = Math.atan2(dx, dz); for (const y of [0.68, 1.3]) S.ekle(cvG.kutuY, (x + ox) / 2, y, (z + oz) / 2, 0.14, 0.2, l, AHSAP, 0, ry); }
        ox = x; oz = z; var_ = true; cvYasak.push([x + (x - PX[(i0 + k + N) % N]) * 0.3, z + (z - PZ[(i0 + k + N) % N]) * 0.3, 2.6]);
      }
      const a = cvKenar(i0, yan, YARI + 1.1), ax = a.x, az = a.z, b = cvKenar(i0, yan, YARI + 15), dx = b.x - ax, dz = b.z - az, l = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
      S.ekle(cvG.kutu, (ax + b.x) / 2, 0.03, (az + b.z) / 2, 7.2, 0.02, l, 0xf2e2a6, 0, ry); S.ekle(cvG.kutu, (ax + b.x) / 2, 0.06, (az + b.z) / 2, 4.6, 0.02, l, SU, 0, ry);
      S.ekle(cvG.daire, b.x, 0.045, b.z, 5.2, 5.2, 1, 0xf2e2a6, -Math.PI / 2); S.ekle(cvG.daire, b.x, 0.075, b.z, 3.9, 3.9, 1, SU, -Math.PI / 2);
      for (let j = 0; j < 4; j++) { const u = 0.2 + j * 0.2; S.ekle(cvG.kutu, ax + dx * u, 0.085, az + dz * u, 1.3 + (j % 2) * 0.6, 0.012, 0.14, 0xe8f9ff, 0, ry + 1.2); cvYasak.push([ax + dx * (u + 0.1), az + dz * (u + 0.1), 4.6]); }
      cvYasak.push([b.x, b.z, 6]);
    }
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
    cit(N - 44, 24, yan); cit(cvI(0.86), 14, yan);   // başlangıçta bayrak ipi yok: kemerin kendi süsü yeter
    for (let k = 0; k < 11; k += 2) {
      const p = cvKenar(N - 40 + k * 8 + (yan > 0 ? 3 : 0), yan, YARI + 5.6 + (k % 3) * 0.9, 0.8); if (yakin(p.x, p.z) < YARI + 4.6 || !cvBos(p.x, p.z, 1.3)) continue;
      hayvan(p, (k + (yan > 0 ? 2 : 0)) % 4, 1.45 + (k % 3) * 0.15, k);
    }
  }
  // ── kütük yığınları ve bölge hayvanları ──
  for (let k = 0; k < 7; k++) { const yan = k % 2 ? -1 : 1, p = cvKenar(cvI(0.655 + k * 0.026), yan, YARI + 7.5 + (k % 3) * 1.5); if (yakin(p.x, p.z) > YARI + 6.5 && cvBos(p.x, p.z, 3.5)) kutuk(p.x, p.z, p.ry + 1.2 + k * 0.5, 0.95 + (k % 3) * 0.12); }
  {
    const F = [0.13, 0.16, 0.19, 0.22, 0.25, 0.33, 0.37, 0.41, 0.45, 0.52, 0.6, 0.66, 0.69, 0.72, 0.75, 0.78, 0.81, 0.85, 0.88, 0.91, 0.115, 0.205, 0.29, 0.48, 0.635, 0.835];
    for (let k = 0; k < F.length; k += 2) {
      const i = cvI(F[k]), yan = (k * 5) % 3 === 0 ? -1 : 1, p = cvKenar(i, yan, YARI + 5.3 + (k % 4) * 0.8, 0.8); if (yakin(p.x, p.z) < YARI + 4.6 || !cvBos(p.x, p.z, 1.3)) continue;
      const b = cvBolge(i); hayvan(p, b === 1 ? (k % 3 === 2 ? 2 : 0) : b === 4 ? (k % 2 ? 3 : 1) : b === 2 ? (k % 2 ? 0 : 1) : k % 4, 1.4 + (k % 3) * 0.17, k);
    }
  }
  // ── virajlarda ok tabelaları ──
  {
    let son = -999, say = 0;
    for (let i = 30; i < N - 30 && say < 6; i++) {
      let k = 0; for (let j = -10; j <= 10; j++) k += KAP[(i + j + N) % N]; k /= 21;
      if (Math.abs(k) > 0.017 && i - son > 85) { const sag = k > 0 ? 1 : -1; tabela((i - 14 + N) % N, sag); son = i; say++; }   // sade: her virajda tek tabela
    }
  }
  // ── bölge simgeleri: uzaktan seçilen, yolun dışına yerleşen küçük masal yapıları ──
  // Birkaç büyük, okunaklı odak; süsler bütün parkura rastgele yığılmaz.
  const odakYeri = (f, yan, uz, r) => {
    for (let k = 0; k < 9; k++) {
      const i = cvI(f + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.008), p = cvKenar(i, yan, uz, 0.25);
      const aciklik=yakin(p.x,p.z);
      if (aciklik > YARI + r + 1.2 && cvBos(p.x, p.z, r)) { cvYasak.push([p.x, p.z, r + 0.8]);cvOdak.push({bolge:f,x:p.x,z:p.z,ry:p.ry,yaricap:r,yola:aciklik});return { x:p.x, z:p.z, ry:p.ry, i }; }
    }
    return null;
  };
  { // çayırda dönen yel değirmeni; palet rengi pastel değil, sıcak ve belirgin
    const p = odakYeri(0.18, -1, YARI + 13.5, 5.3);
    if (p) {
      S.yer(p.x, p.z, p.ry);
      S.ekle(cvG.sil, 0, 0.1, 0, 3.4, 0.2, 3.4, 0xd8b377);
      S.ekle(cvG.govdeK, 0, 3.2, 0, 2.2, 6.4, 2.2, 0xfff0cf);
      S.ekle(cvG.sil, 0, 0.35, 0, 2.3, 0.4, 2.3, 0xd9a26b);
      S.ekle(cvG.koni, 0, 7.35, 0, 2.7, 2.5, 2.7, 0xe96d57, 0, 0.3);
      S.ekle(cvG.kureK, 0, 8.6, 0, 0.22, 0.3, 0.22, 0xffd13e);
      S.ekle(cvG.kutu, 0, 1.1, 2.03, 1.0, 2.15, 0.18, 0x6eaab4);
      S.ekle(cvG.sil, 0, 2.17, 2.03, 0.5, 0.18, 0.5, 0x6eaab4, Math.PI/2);
      S.ekle(cvG.ufak, 0.29, 1.1, 2.17, 0.08, 0.08, 0.08, 0xffd13e);
      for (const x of [-1.22,1.22]) { S.ekle(cvG.sil, x, 3.55, 1.65, 0.42, 0.16, 0.42, 0x94613c, Math.PI/2); S.ekle(cvG.sil,x,3.55,1.74,0.31,0.05,0.31,0x84d9e8,Math.PI/2); }
      for(let k=0;k<5;k++) S.ekle(cvG.sil,(k%2?-.17:.18),0.055,3.0+k*.74,.5,.09,.3,0xe8d1a1);
      const B=cvYapi();
      for(let k=0;k<4;k++) {
        const a=k*Math.PI/2, ca=Math.cos(a), sa=Math.sin(a);
        B.ekle(cvG.kutu,-sa*2.0,ca*2.0,0,0.13,4.2,0.16,0x9d7044,0,0,a);
        B.ekle(cvG.kutu,-sa*2.8+ca*.43,ca*2.8+sa*.43,.06,.9,2.5,.1,0xfff8e5,0,0,a);
        for(let j=0;j<4;j++) { const d=1.77+j*.63;B.ekle(cvG.kutu,-sa*d+ca*.43,ca*d+sa*.43,.13,.96,.055,.07,0xd3a76c,0,0,a); }
      }
      B.ekle(cvG.kureK,0,0,.14,.36,.36,.2,0xffc13c);
      const q=S.dunya(0,2.3), rotor=new T.Group(), mesh=new T.Mesh(B.geo(),cvMalz(0)); rotor.position.set(q.x,5.55,q.z);rotor.rotation.y=p.ry;rotor.add(mesh);scene.add(rotor);cvDegirmen.push({mesh,hiz:.48});
      // Değirmenin dibindeki ayçiçekleri ve çiçek kasaları da aynı sabit çizimde.
      S.yer(p.x,p.z,p.ry);
      for(const x of [-3.3,3.3]) { S.ekle(cvG.kutu,x,.28,1.8,1.4,.5,.8,0xbc804a);for(let k=0;k<3;k++){const xx=x+(k-1)*.4;S.ekle(cvG.sil5,xx,1.1,1.8,.035,1.6,.035,0x418d45);for(let j=0;j<7;j++){const a=j/7*Math.PI*2;S.ekle(cvG.kureK,xx+Math.sin(a)*.31,1.8+Math.cos(a)*.31,1.82,.15,.19,.08,0xffd842,0,0,-a);}S.ekle(cvG.kureK,xx,1.8,1.91,.2,.2,.07,0x805333);} }
    }
  }
  { // göl kenarında ahşap yarış köprüsü: araç yüzeyi düz kalır, raylar şeridin dışındadır
    const s=L*.565, bas=s-7.2;
    for(let k=0;k<12;k++) {
      const q=pist(bas+(k+.5)*1.2), ry=Math.atan2(q.tx,q.tz); S.yer(q.x,q.z,ry);
      S.ekle(cvG.kutu,0,.057,0,GEN-.25,.035,1.12,k%2?0xd6a86b:0xe4bc81);
      // Plakaların kenarında renkli ince kaplama; bütün araçlar geçebilir.
      for(const x of [-YARI-.9,YARI+.9]) {
        S.ekle(cvG.kutu,x,.16,0,.28,.3,1.22,0x9b6a3f);
        if(k%3===0 || k===11) { S.ekle(cvG.kutu,x,.74,0,.28,1.5,.28,0x9b6a3f);S.ekle(cvG.kureK,x,1.52,0,.19,.16,.19,0xf1cd85); }
        for(const y of [.67,1.18])S.ekle(cvG.kutu,x,y,0,.13,.13,1.22,0xc58d51);
      }
    }
    const q=pist(s),ry=Math.atan2(q.tx,q.tz);S.yer(q.x,q.z,ry);
    for(const yan of [-1,1]) {
      for(let k=0;k<6;k++) {
        const x=yan*(YARI+4+k*3.2),z=Math.sin(k*.7)*2.3;
        const w=S.dunya(x,z); if(yakin(w.x,w.z)<YARI+2.5)continue;
        cvYasak.push([w.x,w.z,4.5]);
        S.ekle(cvG.daire,x,.022,z,4.0,2.8,1,0xead69b,-Math.PI/2);
        S.ekle(cvG.daire,x,.034,z,3.5,2.3,1,k%2?0x4cc6df:0x55cdee,-Math.PI/2);
        S.ekle(cvG.daire,x,.038,z+.5,1.8,.12,1,0xc4f4ff,-Math.PI/2);
      }
    }
  }
  { // mantar köyünün girişinde pencere gibi iki büyük mantar: yol üstünde kapak yok
    for(const yan of [-1,1]) {
      const p=odakYeri(.29,yan,YARI+7.0,2.9);if(!p)continue;S.yer(p.x,p.z,p.ry,1.15);
      S.ekle(cvG.govdeK,0,1.6,0,.72,3.2,.72,0xfff1d7);
      S.ekle(cvG.yarim,0,3.0,0,2.15,1.5,2.15,yan<0?0xe96387:0xa27be0);
      S.ekle(cvG.sil,0,3.04,0,2.13,.16,2.13,0xffe4c4);
      for(let k=0;k<6;k++){const a=k*1.047;S.ekle(cvG.kureK,Math.cos(a)*1.4,3.8,Math.sin(a)*1.4,.28,.08,.28,0xfffbeb,.4,a);}
      S.ekle(cvG.kutu,0,1.7,.7,.66,.8,.1,0x78c8e3); S.ekle(cvG.kutu,0,1.7,.77,.07,.82,.08,0xfff1d7);S.ekle(cvG.kutu,0,1.7,.77,.66,.07,.08,0xfff1d7);
    }
  }
  // ── cv3: şelaleli kayalık, ağaç ev, piknik alanı, başlangıç balonları ──
  { const p = odakYeri(0.73, 1, YARI + 12.5, 5.4);
    if (p) { S.yer(p.x, p.z, p.ry);
      S.ekle(cvG.ufak,0,2.6,-1.6,3.6,3.4,2.6,0xaab0ba,0,.4); S.ekle(cvG.ufak,-2.9,1.5,-.9,2.3,2.1,2.0,0xbfc4cc,0,1.1); S.ekle(cvG.ufak,2.8,1.7,-1.0,2.4,2.4,2.0,0x9da4af,0,2.0); S.ekle(cvG.ufak,0,5.2,-1.0,2.3,1.5,1.9,0xc7ccd3,0,.9);
      S.ekle(cvG.kureK,-1.3,6.5,-1.2,1.5,.8,1.3,0x58b84a); S.ekle(cvG.kureK,1.5,6.2,-1.1,1.2,.7,1.1,0x7fd35a); S.ekle(cvG.kureK,-3.4,3.2,-.8,1.0,.6,.9,0x7fd35a);
      S.ekle(cvG.kutu,0,3.3,1.12,1.5,5.4,.14,0x6fd0f2,-.1);
      S.ekle(cvG.daire,0,.03,3.1,3.7,2.4,1,0xead69b,-Math.PI/2); S.ekle(cvG.daire,0,.045,3.1,3.2,1.95,1,0x55cdee,-Math.PI/2);
      for (let k = 0; k < 4; k++) { const a = k * 1.05; S.ekle(cvG.ufak, Math.cos(a) * 3.5, .25, 3.3 + Math.sin(a) * 2.2, .5, .38, .45, k % 2 ? 0xb9bcc4 : 0xcfd2d8, 0, a); }
      const W = cvYapi(); W.yer(p.x, p.z, p.ry);
      for (const x of [-.45, .05, .5]) W.ekle(cvG.kutu, x, 3.3, 1.21, .2, 4.6, .06, 0xdff7ff, -.1, 0, 0, 0, 1);
      for (let k = 0; k < 5; k++) W.ekle(cvG.kureK, (k - 2) * .5, .3, 1.75 + (k % 2) * .35, .5, .34, .5, 0xffffff, 0, 0, 0, 0, 1);
      const wm = new T.Mesh(W.geo(), cvMalz(5)); wm.frustumCulled = false; scene.add(wm);
    } }
  { const p = odakYeri(0.885, -1, YARI + 10.5, 3.9);
    if (p) { S.yer(p.x, p.z, p.ry);
      S.ekle(cvG.govdeK,0,3.6,0,.95,7.2,.95,KOYU); S.ekle(cvG.sil,0,3.3,0,2.8,.22,2.8,AHSAP);
      S.ekle(cvG.kutuY,0,4.5,-.2,2.6,2.2,2.3,0xf2d49c); S.ekle(cvG.catiY,0,5.6,-.2,.62,.9,.62,0xe96d57);
      S.ekle(cvG.kutuY,.55,4.15,.96,.7,1.5,.08,0x7a4a2a); S.ekle(cvG.kutuY,-.6,4.75,.96,.6,.6,.08,0xffe28a); S.ekle(cvG.ufak,.33,4.15,1.02,.06,.06,.06,0xffd13e);
      for (const a of [-1, 1]) S.ekle(cvG.kutu, a * .38, 1.7, 2.85, .1, 3.5, .1, AHSAP, .17);
      for (let k = 0; k < 6; k++) { const y = .45 + k * .5; S.ekle(cvG.kutu, 0, y, 3.14 - y * .17, .8, .08, .1, 0xe4bc81); }
      for (let k = 0; k < 8; k++) { const a = k * .785; S.ekle(cvG.kutu, Math.cos(a) * 2.6, 3.8, Math.sin(a) * 2.6, .1, .8, .1, AHSAP); }
      S.ekle(cvG.tac,0,9.1,-.3,3.7,2.5,3.5,0x45bf63); S.ekle(cvG.kureK,-2.5,7.9,-.9,2.2,1.6,2.1,0x3bb25a); S.ekle(cvG.kureK,2.4,8.1,.3,2.1,1.5,2.0,0x58b84a);
      S.ekle(cvG.sil5,1.5,6.5,-.2,.04,1.3,.04,0xffffff); S.ekle(cvG.ucgen,1.85,6.85,-.2,.28,.7,.04,0xffe066,0,0,-Math.PI/2);
    } }
  { const p = odakYeri(0.235, 1, YARI + 8.5, 3.3);
    if (p) { S.yer(p.x, p.z, p.ry);
      for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) S.ekle(cvG.kutu, (a - 1.5) * .8, .04, (b - 1.5) * .8, .8, .05, .8, (a + b) % 2 ? 0xffffff : 0xf0503c);
      S.ekle(cvG.sil,-.6,.38,-.3,.5,.6,.5,AHSAP); S.ekle(cvG.sil,-.6,.7,-.3,.54,.08,.54,KOYU); S.ekle(cvG.kutu,-.6,.95,-.3,1.0,.07,.12,KOYU);
      for (let k = 0; k < 3; k++) S.ekle(cvG.kureK, .3 + k * .32, .24, -.7 + (k % 2) * .25, .17, .17, .17, k % 2 ? 0x8fd95c : 0xf0503c);
      S.ekle(cvG.sil,.6,.2,.5,.48,.28,.48,0xfff3d0); S.ekle(cvG.sil,.6,.37,.5,.5,.08,.5,0xff9ac2); S.ekle(cvG.ufak,.6,.5,.5,.1,.1,.1,0xf0503c);
      S.ekle(cvG.sil,-.5,.12,.8,.3,.06,.3,0xffffff); S.ekle(cvG.sil,.0,.2,1.1,.12,.3,.12,0x7fd6ff);
      const w = S.dunya(2.3, .2), a = { x: w.x, z: w.z, ry: p.ry - 1.5 }; hayvan(a, 0, 1.5, 0);
      const w2 = S.dunya(-2.3, .1), b = { x: w2.x, z: w2.z, ry: p.ry + 1.5 }; hayvan(b, 1, 1.5, 1);
    } }
  for (const yan of [-1, 1]) for (let k = 1; k < 4; k += 2) {   // başlangıçta balon demetleri (seyrek)
    const p = cvKenar(N - 26 + k * 17, yan, YARI + 7.6 + (k % 2) * 1.2); if (yakin(p.x, p.z) < YARI + 6 || !cvBos(p.x, p.z, 1.1)) continue;
    cvYasak.push([p.x, p.z, 1.2]); S.yer(p.x, p.z, p.ry); S.ekle(cvG.kutu, 0, .25, 0, .5, .5, .5, BAYRAK[(k + 3) % 6]);
    for (let j = 0; j < 3; j++) { const x = (j - 1) * .75, y = 4.2 + (j % 2) * .9; S.ekle(cvG.kutu, x * .55, y / 2 + .1, 0, .035, y - .4, .035, 0xffffff, 0, 0, -x * .13); S.ekle(cvG.kure, x, y + .5, 0, .62, .75, .62, BAYRAK[(k * 2 + j) % 6]); }
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
  const YESIL = [0x2f9e4f, 0x3bb25a, 0x278a45, 0x45bf63], ACIK = [0x7fd35a, 0x93dd66, 0x6cc74e, 0xa6e36f, 0x58b84a, 0x8fd95c], PEMBE = [0xffa6cc, 0xffbcd8, 0xffcadf, 0xff96c2, 0xffc0d9, 0xffb1d1], HUS = [0x8fd95c, 0x7fd35a, 0x93dd66, 0x6cc74e]   // sade: huş tacı da yeşil (renk kalabalığı yok);
  const CICEK = [0xffffff, 0xffd84a, 0xffffff, 0xff8fbf, 0xffffff, 0xffd84a];   // sade: beyaz-sarı, tek pembe vurgu
  const ORAN = [[0.3, 0.08, 0.12], [0.08, 0.08, 0.24], [0.22, 0.06, 0.1], [0.2, 0.22, 0.05], [0.8, 0.04, 0.01], [0.2, 0.26, 0.05], [0.4, 0.07, 0.07]];   // sade: pembe/huş az, yeşil çoğunluk   // bölgeye göre [çam, huş, çiçekli]
  const agac = (x, z, b, i, yakinMi) => {
    const o = ORAN[cvBolge(((i % N) + N) % N)], t = R(), ry = R() * 6.28, h = b * (0.9 + R() * 0.3);
    if (t < o[0]) (yakinMi ? camN : camF).push([x, 0, z, b, h, b, ry, YESIL[(R() * 4) | 0]]);
    else if (t < o[0] + o[1]) { if (yakinMi) hus.push([x, 0, z, b, h, b, ry, HUS[(R() * 4) | 0]]); else yuvF.push([x, 0, z, b * 0.85, h * 1.1, b * 0.85, ry, HUS[(R() * 4) | 0]]); }
    else if (t < o[0] + o[1] + o[2]) (yakinMi ? yuvN : yuvF).push([x, 0, z, b, h, b, ry, PEMBE[(R() * 6) | 0]]);
    else (yakinMi ? yuvN : yuvF).push([x, 0, z, b, h, b, ry, ACIK[(R() * 6) | 0]]);
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
  for (let i = 0; i < 1100; i++) {   // sade: çiçek/çalı yarıya yakın azaltıldı
    const cayir = i < 330, k = cayir ? cvI(0.1 + R() * 0.18) : (R() * N) | 0, b = cvBolge(k), yan = R() < 0.5 ? -1 : 1, uz = YARI + 3.2 + (cayir ? R() * 26 : R() * R() * 20), x = PX[k] - TZ[k] * uz * yan + (R() - 0.5) * 2, z = PZ[k] + TX[k] * uz * yan + (R() - 0.5) * 2;
    if (yakin(x, z) < YARI + 3.1 || !cvBos(x, z, cayir ? 0.2 : 0.9)) continue;
    const t = R(), s = 0.7 + R() * 0.6;
    if (cayir || t < 0.6) cicek.push([x, 0, z, s, s * (0.8 + R() * 0.5), s, R() * 6, CICEK[(R() * 6) | 0]]);
    else if (t < 0.76) cali.push([x, 0.4, z, 0.9 + R() * 0.9, 0.65 + R() * 0.5, 0.9 + R() * 0.9, R() * 6, R() < 0.45 ? ACIK[(R() * 6) | 0] : YESIL[(R() * 4) | 0]]);
    else if (t < (b === 2 ? 0.97 : 0.88)) { const m = (b === 2 ? 1.1 : 0.7) + R() * (b === 2 ? 1.5 : 0.9); mantar.push([x, 0, z, m, m, m, R() * 6, [0xf2553d, 0xffb13d, 0xf2553d, 0xe85aa0, 0x9b7be8][(R() * (b === 2 ? 5 : 3)) | 0]]); }
    else kaya.push([x, 0.25, z, 0.6 + R() * 0.8, 0.5 + R() * 0.5, 0.6 + R() * 0.8, R() * 6, R() < 0.5 ? 0xb9bcc4 : 0xcfd2d8]);
  }
  for (const l of [camF, yuvF]) for (let k = l.length - 1; k >= 0; k--) if (k % 2 === 1 && yakin(l[k][0], l[k][2]) > YARI + 36) l.splice(k, 1);   // cv3: arkada kalan, görünmeyen ağaçlar ayıklanır
  const ruzgar = cvMalz(1);
  { const B = cvYapi(); B.ekle(cvG.govde, 0, 1.1, 0, 0.42, 2.2, 0.42, 0x8a5a36); B.ekle(cvG.koni, 0, 3.3, 0, 2.35, 3.3, 2.35, 0xd0d0d0, 0, 0, 0, 1); B.ekle(cvG.koni, 0, 5.0, 0, 1.85, 2.9, 1.85, 0xe6e6e6, 0, 0.4, 0, 1); B.ekle(cvG.koni, 0, 6.6, 0, 1.3, 2.5, 1.3, 0xffffff, 0, 0.9, 0, 1); cok(cvTon(B.geo()), ruzgar, camN); }
  { const B = cvYapi(); B.ekle(cvG.govde, 0, 1.0, 0, 0.42, 2.0, 0.42, 0x8a5a36); B.ekle(cvG.koni6, 0, 3.5, 0, 2.3, 3.8, 2.3, 0xd6d6d6, 0, 0, 0, 1); B.ekle(cvG.koni6, 0, 5.8, 0, 1.55, 3.0, 1.55, 0xf4f4f4, 0, 0.5, 0, 1); cok(cvTon(B.geo()), ruzgar, camF); }
  { const B = cvYapi(); B.ekle(cvG.govde, 0, 1.6, 0, 0.5, 3.2, 0.5, 0x9a6a40); B.ekle(cvG.govde,.45,2.65,.18,.22,1.65,.22,0xad7946,0,0,-.55);B.ekle(cvG.govde,-.42,2.9,-.2,.19,1.5,.19,0xa87342,0,0,.6);B.ekle(cvG.tacY, 0.1, 5.0, 0, 2.45, 2.3, 2.45, 0xffffff, 0, 0, 0, 1); B.ekle(cvG.kureK, 1.6, 3.95, 0.5, 1.65, 1.45, 1.65, 0xd9e1d5, 0, 0, 0, 1); B.ekle(cvG.kureK, -1.4, 4.15, -0.8, 1.6, 1.4, 1.6, 0xe5eadc, 0, 1, 0, 1); B.ekle(cvG.kureK, -0.3, 6.35, 0.5, 1.25, 1.05, 1.25, 0xffffff, 0, 0, 0, 1); cok(cvTon(B.geo()), ruzgar, yuvN); }
  { const B = cvYapi(); B.ekle(cvG.govde, 0, 1.4, 0, 0.5, 2.8, 0.5, 0x9a6a40); B.ekle(cvG.tac, 0, 4.4, 0, 2.5, 2.4, 2.5, 0xf6f6f6, 0, 0, 0, 1); cok(cvTon(B.geo()), ruzgar, yuvF); }
  { const B = cvYapi(); B.ekle(cvG.sil5, 0, 2.6, 0, 0.24, 5.2, 0.24, 0xf7f4ec); for (let k = 0; k < 3; k++) B.ekle(cvG.sil5, 0, 0.9 + k * 1.3, 0, 0.255, 0.18, 0.255, 0x4a4a4a, 0, k * 1.3); B.ekle(cvG.kure, 0, 6.3, 0, 1.7, 2.0, 1.7, 0xffffff, 0, 0, 0, 1); B.ekle(cvG.kureK, 0.95, 5.0, 0.3, 1.2, 1.3, 1.2, 0xe2e2e2, 0, 0, 0, 1); B.ekle(cvG.kureK, -0.85, 5.4, -0.4, 1.1, 1.2, 1.1, 0xececec, 0, 1, 0, 1); cok(cvTon(B.geo()), ruzgar, hus); }
  { const B = cvYapi(); B.ekle(cvG.sil3, 0, 0.3, 0, 0.038, 0.6, 0.038, 0x4caf50);B.ekle(cvG.petal,.13,.27,.06,.2,.045,.08,0x5bbf56,0,0,.42);for(let k=0;k<5;k++){const a=k/5*Math.PI*2;B.ekle(cvG.petal,Math.sin(a)*.25,.66,Math.cos(a)*.25,.23,.10,.22,0xffffff,0,0,0,1);}B.ekle(cvG.petal,0,.73,0,.17,.085,.17,0xffcf39);cok(B.geo(),cvMalz(0),cicek); }
  { const B = cvYapi(); B.ekle(cvG.govde, 0, 0.3, 0, 0.24, 0.6, 0.24, 0xfff3e0); B.ekle(cvG.yarimK, 0, 0.5, 0, 0.62, 0.48, 0.62, 0xffffff, 0, 0, 0, 1); for (let k = 0; k < 2; k++) { const a = k * 2.6 + 0.4; B.ekle(cvG.okt, Math.sin(a) * 0.36, 0.86, Math.cos(a) * 0.36, 0.11, 0.05, 0.11, 0xffffff, 0.6, a); } cok(B.geo(), cvMalz(0), mantar); }
  cok(cvG.kureK, beyaz, cali); cok(new T.IcosahedronGeometry(1, 1), beyaz, kaya);   // yuvarlak çakıl (köşeli karton taş değil)
  for(const liste of [camN,yuvN,hus])for(const a of liste)cvGolgeler.push([a[0]-.6*a[3],.008,a[2]+.3*a[3],2.5*a[3],1,1.7*a[3],-.4]);
  for(const a of cvOdak)cvGolgeler.push([a.x-.5,.008,a.z+.4,a.yaricap*.9,1,a.yaricap*.65,-.4]);

  // ───────── uzak tepeler, dağlar, bulutlar, kuşlar ─────────
  const tepe = [], dag = [], bulut = [], kus = [];
  for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283 + R() * 0.2, r = 300 + R() * 60; tepe.push([Math.cos(a) * r, -8, -70 + Math.sin(a) * r, 70 + R() * 45, 30 + R() * 26, 70 + R() * 45, 0, [0x57b55a, 0x6cc56a, 0x4aa757][i % 3]]); }
  for (let i = 0; i < 15; i++) { const a = i / 15 * 6.283 + R() * 0.3, r = 410 + R() * 50; tepe.push([Math.cos(a) * r, -8, -70 + Math.sin(a) * r, 100 + R() * 60, 55 + R() * 35, 100 + R() * 60, 0, [0x7fc98f, 0x8fd3a2, 0x74c088][i % 3]]); }
  {
    const g=new T.SphereGeometry(1,16,8,0,Math.PI*2,0,1.6),p=g.attributes.position,c=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),v=clamp(y,0,1);p.setY(i,y*(.88+.12*Math.sin(x*2.8+z*1.7)));const k=.84+.16*v;c[i*3]=k;c[i*3+1]=.93+.07*v;c[i*3+2]=.89+.11*(1-v);}
    g.setAttribute('color',new T.BufferAttribute(c,3));g.computeVertexNormals();cok(g,new T.MeshLambertMaterial({vertexColors:true}),tepe);
  }
  {
    // Çizgi film dağı: yuvarlatılmış doruk, dalgalı kar başlığı, eteğe doğru göğe karışan mavi-lila ton (atmosfer).
    const g = new T.ConeGeometry(1, 1, 16, 8), p = g.attributes.position, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {const x=p.getX(i),z=p.getZ(i),y=p.getY(i),a=Math.atan2(z,x),t=y+.5,yu=Math.pow(1-t,.62)/Math.max(1e-4,1-t);p.setX(i,x*yu*(1+.10*Math.sin(a*3+.8)*(1-t)));p.setZ(i,z*yu*(1+.08*Math.cos(a*2-.7)*(1-t)));p.setY(i,y-.06*t*t);const neige=clamp((t-.72+.05*Math.sin(a*4)+.03*Math.cos(a*7))/.04,0,1),e=clamp(t*1.4,0,1);c[i*3]=lerp(lerp(.47,.60,e),1,neige);c[i*3+1]=lerp(lerp(.60,.66,e),1,neige);c[i*3+2]=lerp(lerp(.84,.88,e),1,neige);}
    g.setAttribute('color', new T.BufferAttribute(c, 3)); g.computeVertexNormals();
    for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283 + R() * 0.2, r = 520 + R() * 50, h = 110 + R() * 90, w = 95 + R() * 60; dag.push([Math.cos(a) * r, h / 2 - 6, -70 + Math.sin(a) * r, w, h, w, R() * 6, [0xffffff, 0xf1edff, 0xe9f5ff][i % 3]]); }
    const dm = new T.MeshLambertMaterial({ vertexColors: true }); dm.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance += vColor.rgb * 0.16;\n#endif'); }; dm.customProgramCacheKey = () => 'cvDag';
    cok(g, dm, dag);
  }
  {
    const g = cvBulutGeo();
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
} else if (cvTema === 'kiyi' || cvTema === 'kar') {
  // Yeni pistlerin coğrafyası ayrı kurulur: kıyıda gerçek su/ada, karda buzlu çamlık.
  const S=cvYapi(), beyaz=mat(0xffffff), kisin=cvTema==='kar', agaclar=[], seyirci=[], daglar=[], bulutlar=[];
  const koy=(f,yan,uz,r)=>{
    for(let k=0;k<10;k++){const i=cvI(f+(k%2?-1:1)*Math.ceil(k/2)*.008),p=cvKenar(i,yan,uz,.25),d=yakin(p.x,p.z);if(d>YARI+r+1.2&&cvBos(p.x,p.z,r)){cvYasak.push([p.x,p.z,r+1]);cvOdak.push({bolge:f,x:p.x,z:p.z,ry:p.ry,yaricap:r,yola:d});return {x:p.x,z:p.z,ry:p.ry};}}return null;
  };
  const Sb=(g,x,y,z,sx,sy,sz,r,rx,ry,rz)=>S.ekle(g,x,y,z,sx,sy,sz,r,rx,ry,rz,0,0,1);   // suda sallanan parça
  const cvE=B=>(g,x,y,z,sx,sy,sz,r,kt,ke,rx,ry,rz)=>B.ekle(g,x,y,z,sx,sy,sz,r,rx||0,ry||0,rz||0,kt||0,1,ke||0);
  const cvKayik=r=>{Sb(cvG.kureK,0,.22,0,.95,.25,2.1,r);Sb(cvG.sil,0,.46,0,.74,.05,1.7,0xf7e3b8);for(const z of [-.6,.5])Sb(cvG.kutu,0,.53,z,1.4,.07,.3,0xc48a4c);};
  const cvSezlong=(x,z,r)=>{S.ekle(cvG.kutuY,x,.36,z+.2,.8,.09,1.3,r);S.ekle(cvG.kutuY,x,.66,z-.72,.8,.09,.85,r,.95);S.ekle(cvG.kutuY,x,.37,z+.2,.82,.05,.2,0xffffff);for(const a of [-.33,.33])for(const b of [-.3,.7])S.ekle(cvG.kutuY,x+a,.16,z+b,.07,.32,.07,0xc9a06a);};
  const cvTop=(x,z,k)=>{const C=[0xff6b6b,0x5fd0e0,0xffd95a,0x8fe39a];S.ekle(cvG.kure,x,.5,z,.5,.5,.5,0xffffff);S.ekle(cvG.sil,x,.5,z,.5,.24,.5,C[k%4]);S.ekle(cvG.kureK,x,.87,z,.3,.14,.3,C[(k+1)%4]);};
  if(!kisin) {
    const kum=tuvalDoku(256,256,(g,w,h)=>{g.fillStyle='#f4db9f';g.fillRect(0,0,w,h);for(let k=0;k<700;k++){g.fillStyle=k%3?'#e7c789':'#ffedc3';g.globalAlpha=.5;g.fillRect(R()*w,R()*h,1+R()*2,1+R()*2);}g.globalAlpha=1;},true);
    const ada=new T.Mesh(serit(-18,18,.006,22),mat(0xffffff,{map:kum}));ada.frustumCulled=false;scene.add(ada);
    // Daracık beyaz köpük yerine geniş turkuaz kıyı çizgisi, yarış yolunun dışında.
    cvSahilDoku=tuvalDoku(512,512,(g,w,h)=>{
      const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(124,229,226,0)');gr.addColorStop(.045,'rgba(124,229,226,1)');gr.addColorStop(.955,'rgba(124,229,226,1)');gr.addColorStop(1,'rgba(124,229,226,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);g.lineCap='round';
      for(const yan of [-1,1])for(let k=0;k<6;k++)for(let kat=0;kat<2;kat++){g.beginPath();for(let j=0;j<=12;j++){const y=(k+j/12*.74)/6*h,a=y/h*Math.PI*6,x=10+Math.sin(a)*3+Math.sin(a*2)*1.5;const xx=yan<0?x:w-x;j?g.lineTo(xx,y):g.moveTo(xx,y);}g.strokeStyle=kat?'rgba(249,255,244,.68)':'rgba(235,255,248,.23)';g.lineWidth=kat?3:9;g.stroke();}
    },true);
    const dis=new T.Mesh(serit(-19.5,19.5,.001,L/Math.round(L/25)),mat(0xffffff,{map:cvSahilDoku,transparent:true,depthWrite:false}));dis.frustumCulled=false;scene.add(dis);
    const p=koy(.42,1,YARI+14,6.2);
    if(p){S.yer(p.x,p.z,p.ry);S.ekle(cvG.daire,0,.012,0,11,11,1,0xf6dda6,-Math.PI/2);S.ekle(cvG.sil,0,.22,0,4.0,.42,4.0,0xddbc83);for(let k=0;k<7;k++)S.ekle(cvG.govdeK,0,.55+(k+.5)*1.2,0,2.25-k*.13,1.22,2.25-k*.13,k%2?0xfff7e3:0xef7664);S.ekle(cvG.sil,0,9.2,0,2.25,.35,2.25,0x7d9aab);S.ekle(cvG.sil,0,10.05,0,1.38,1.45,1.38,0xa8e6f2);S.ekle(cvG.koni,0,11.35,0,2.0,1.3,2.0,0xe8705b);S.ekle(cvG.kureK,0,12.05,0,.19,.25,.19,0xffd957);for(let k=0;k<6;k++){const a=k/6*Math.PI*2;S.ekle(cvG.sil5,Math.sin(a)*1.4,10.0,Math.cos(a)*1.4,.07,1.6,.07,0xfff5dc);}S.ekle(cvG.kutu,0,1.35,2.15,.9,1.65,.13,0x4590ad);for(let k=0;k<3;k++)S.ekle(cvG.kutu,0,.1+k*.075,2.9-k*.3,1.6,.15,.8,0xdbc394);}
    // Deniz fenerinin çevresinde yelkenliler: yolun dışındaki suya demirli.
    for(let k=0;k<5;k++){const q=cvKenar(cvI(.12+k*.17),k%2?-1:1,YARI+32+k%3*3);if(yakin(q.x,q.z)<YARI+27)continue;S.yer(q.x,q.z,q.ry+.6,1.7);Sb(cvG.kureK,0,.35,0,1.2,.32,2.1,[0xff8670,0x6cbbdb,0xffd261][k%3]);Sb(cvG.sil5,0,2.3,0,.055,4.4,.055,0xe7c595);Sb(cvG.ucgen,-.65,2.8,.05,.75,2.6,.055,0xfff7e6,0,0,-.25);Sb(cvG.ucgen,.5,2.7,.05,.5,2.3,.055,0xffb972,0,0,.2);}
    // Kumsaldaki renkli güneş şemsiyeleri, örtüler ve deniz kabukları.
    for(let k=0;k<10;k++){const p=koy(.06+k*.085,k%2?-1:1,YARI+10+(k%3)*1.5,2.3);if(!p)continue;S.yer(p.x,p.z,p.ry);S.ekle(cvG.daire,0,.012,0,3.1,3.1,1,0xf4db9f,-Math.PI/2);S.ekle(cvG.kutu,0,.03,0,2.8,.03,2.0,k%2?0xfaa9a0:0x93d5e9);cvSezlong(-1.25,.3,k%2?0xfff5df:0xffd27a);cvSezlong(1.85,.2,k%2?0x9fe0ea:0xfff5df);if(k%2===0)cvTop(.9,1.7,k);S.ekle(cvG.sil5,.3,1.8,0,.065,3.6,.065,0xf4edda);for(let j=0;j<8;j++)S.ekle(cvG.semsiye,.3,3.35,0,1.8,1,1.8,j%2?0xfff5df:[0xffb753,0x79c6d4,0xf18e99,0xa496d6][k%4],0,j*Math.PI/4);}
    // Alçak kum tepeleri bir çiçek/deniz kabuğu kompozisyonu oluşturur; yol boş kalır.
    for(let k=0;k<15;k++){
      const p=koy(.025+k*.064,k%2?-1:1,YARI+6.8+(k%3)*1.5,2.8);if(!p)continue;S.yer(p.x,p.z,p.ry);
      S.ekle(cvG.tac,0,-.3,0,3.3,.9,2.6,k%2?0xf6dc9b:0xf0d294);
      for(let j=0;j<5;j++){
        const a=j/5*Math.PI*2,xx=Math.cos(a)*1.75,zz=Math.sin(a)*1.3,h=-.3+.9*Math.sqrt(Math.max(0,1-xx*xx/10.89-zz*zz/6.76));
        S.ekle(cvG.sil3,xx,h+.23,zz,.035,.46,.035,0x59a36b);
        for(const yan of [-1,1])S.ekle(cvG.petal,xx+yan*.17,h+.22,zz,.22,.055,.1,0x54aa6e,0,yan*.5,yan*.4);
        for(let q=0;q<5;q++){const b=q/5*Math.PI*2;S.ekle(cvG.petal,xx+Math.sin(b)*.23,h+.52,zz+Math.cos(b)*.23,.22,.085,.22,[0xf58283,0xffc75b,0xd2a1df][(k+j)%3]);}
        S.ekle(cvG.okt,xx,h+.59,zz,.12,.075,.12,0xffe5a4);
      }
      for(let j=0;j<4;j++){const xx=(j%2?-1:1)*(2.6+(j%3)*.1),zz=(j-1.5)*.6;S.ekle(cvG.yarimK,xx,.035,zz,.24,.12,.29,j%2?0xffe9d5:0xfff7e7,0,j*.7);}
      S.ekle(cvG.sil,1.4,.18,.9,.17,1.65,.17,0xba9972,0,0,1.1);S.ekle(cvG.sil,1.4,.18,.9,.135,1.68,.135,0xe2c89a,0,0,1.1);
    }
  } else {
    // Kar köyü: ahşap dağ evleri, kalın kar saçakları ve amber pencereler.
    const chalet=(p,k,s)=>{
      S.yer(p.x,p.z,p.ry,s||1);S.ekle(cvG.tacY,0,0,0,3.6,.32,3.2,0xf2f8ff);S.ekle(cvG.kutuY,0,1.7,0,4.5,3.4,3.7,k%2?0xb88459:0xc59a72);S.ekle(cvG.catiY,0,3.35,0,1,1,1,0xf9fdff);S.ekle(cvG.kutuY,0,.85,1.94,.9,1.7,.16,0x785843);
      for(const x of [-1.4,1.4]){S.ekle(cvG.kutuY,x,1.9,1.93,.9,1.1,.13,0x795b45);S.ekle(cvG.kutuY,x,1.9,2.02,.66,.85,.05,0xffd685);S.ekle(cvG.kutuY,x,1.9,2.07,.07,.87,.06,0xffffff);S.ekle(cvG.kutuY,x,1.9,2.07,.68,.07,.06,0xffffff);}
      for(let j=0;j<5;j++)S.ekle(cvG.kutu,0,.6+j*.56,1.87,3.5,.06,.06,0x966b49);
      
      S.ekle(cvG.sil5,2.6,1.0,2.6,.06,1.6,.06,0x6b4a36);S.ekle(cvG.kutuY,2.6,1.95,2.6,.34,.42,.34,0xffd24f);S.ekle(cvG.koni6,2.6,2.3,2.6,.34,.28,.34,0x6b4a36);S.ekle(cvG.kureK,2.6,2.52,2.6,.2,.1,.2,0xffffff);   // kapı feneriS.ekle(cvG.kutuY,-1.2,4.8,-.7,.55,1.8,.65,0xba8e7b);S.ekle(cvG.kutuY,-1.2,5.72,-.7,.83,.18,.84,0xffffff);
      for(let j=0;j<9;j++){const x=(j-4)*.48,y=3.26-.23*(1-x*x/4);S.ekle(cvG.kureK,x,y,2.13,.095,.095,.075,[0xf4c572,0xe99482,0x99d3da,0xf7dfa3][j%4]);if(j<8)S.ekle(cvG.kutuY,x+.24,y+.02,2.10,.5,.035,.035,0x9a7e64);}
    };
    for(let k=0;k<5;k++){const p=koy(.13+k*.16,k%2?-1:1,YARI+12,4.3);if(p)chalet(p,k,1);}
    // İlk dağ evinin komşuları: tek bir sıcak küçük köy, yeni rastgele ev sırası değil.
    for(let k=0;k<2;k++){const p=koy(k?.145:.115,1,YARI+16.5,3.9);if(p)chalet(p,k,.87+k*.05);}
    // Açık mavi donmuş göletler; ince kar halkası ve gökyüzü yansımaları.
    for(const f of [.36,.71]){const p=koy(f,1,YARI+15,7.2);if(!p)continue;S.yer(p.x,p.z,p.ry);S.ekle(cvG.daire,0,.009,0,8.8,6.4,1,0xffffff,-Math.PI/2);S.ekle(cvG.daire,0,.021,0,7.6,5.2,1,0x9edbea,-Math.PI/2);S.ekle(cvG.daire,-1,.026,1,5,2.7,1,0xbdeafa,-Math.PI/2);for(let k=0;k<5;k++)S.ekle(cvG.kutu,-4+k*2.0,.031,-1.8+(k%2)*1.5,1.5,.012,.09,0xe6fbff,0,k*.5);}
    // Küçük kar yığınları boşluğu biçimlendirir; araç çizgisine ve teker temasına girmez.
    for(let k=0;k<18;k++){const p=koy(.02+k*.054,k%2?-1:1,YARI+7.5+(k%3)*2.2,3.1);if(!p)continue;S.yer(p.x,p.z,p.ry);S.ekle(cvG.tac,0,-.35,0,4.0,1.35,2.6,0xf5fbff);S.ekle(cvG.tac,-1.6,-.15,.6,2.1,.9,1.8,0xe2eff9);for(let j=0;j<3;j++)S.ekle(cvG.kureK,2.3-j*.6,.15+(j%2)*.07,-1.0+j*.7,.55,.3,.35,0xd6e8f5);}
    {
      const p=koy(.53,-1,YARI+16,6.2);
      if(p){S.yer(p.x,p.z,p.ry);S.ekle(cvG.daire,0,.013,0,7.3,5.0,1,0xffffff,-Math.PI/2);S.ekle(cvG.daire,0,.026,0,6.2,4.0,1,0xb0deef,-Math.PI/2);S.ekle(new T.TorusGeometry(1,.18,7,20,Math.PI),0,.3,0,4.6,5.2,1.9,0xa7d7e8);S.ekle(new T.TorusGeometry(1,.08,5,20,Math.PI),0,.42,.2,4.6,5.2,1.9,0xeafaff);for(const x of [-4.6,4.6])S.ekle(cvG.tac,x,.35,0,1.25,.75,1.1,0xd6eff8);for(let j=0;j<9;j++){const a=j/9*Math.PI*2;S.ekle(cvG.ico,Math.cos(a)*5.8,.2,Math.sin(a)*3.6,.45,.35+(j%3)*.13,.5,j%2?0xc2e3f2:0xf1fbff,0,j*.8);}}
    }
  }
  // ───────── cv3: ok tabelaları, bayrak ipleri, seyirci hayvanlar ve bölge süsleri (ağaçlardan önce yer tutar) ─────────
  const cvKOYU=kisin?0x7a5a46:0xa87a4e, cvBAYRAK=kisin?[0xff6b6b,0xffffff,0x5fc4f0,0xffd95a,0xff9ac2,0x8fe0c0]:[0xff7b6b,0xffe066,0x5fd0e0,0xffffff,0xffa64d,0x8fe39a];
  const cvTabela=(i,sag)=>{
    const p=cvKenar(i,-sag,YARI+5.2);if(yakin(p.x,p.z)<YARI+4.2||!cvBos(p.x,p.z,1.4))return;
    S.yer(p.x,p.z,Math.atan2(-TX[i]-TZ[i]*sag*.35,-TZ[i]+TX[i]*sag*.35),1.35);cvYasak.push([p.x,p.z,3.0]);
    for(const x of [-.85,.85])S.ekle(cvG.kutuY,x,1.3,-.1,.2,2.6,.2,cvKOYU);
    S.ekle(cvG.kutuY,0,2.35,-.02,2.7,1.35,.1,cvKOYU);S.ekle(cvG.kutuY,0,2.35,.03,2.45,1.1,.1,kisin?0xfdfdf2:0xfff1c4);
    S.ekle(cvG.kutuY,-.32*sag,2.35,.09,1.05,.32,.06,0xf0503c);S.ekle(cvG.ucgen,.52*sag,2.35,.09,.5,.75,.05,0xf0503c,0,0,-sag*Math.PI/2);
    if(kisin)S.ekle(cvG.kureK,0,3.06,-.02,1.45,.16,.2,0xffffff);
  };
  { let son=-999,say=0;
    for(let i=30;i<N-30&&say<6;i++){let k=0;for(let j=-10;j<=10;j++)k+=KAP[(i+j+N)%N];k/=21;
      if(Math.abs(k)>.017&&i-son>85){const sag=k>0?1:-1;cvTabela((i-14+N)%N,sag);son=i;say++;}}
  }
  const cvIp=(i0,say,yan)=>{   // renkli bayrak ipi; bayraklar rüzgârda dalgalanır (cvK.y)
    S.yer(0,0,0);let ox=0,oz=0,var_=false,n=0;
    for(let k=0;k<=say;k++){
      const p=cvKenar(i0+k*13,yan,YARI+4.4),x=p.x,z=p.z;if(yakin(x,z)<YARI+3.5){var_=false;continue;}
      cvYasak.push([x,z,.8]);S.ekle(cvG.sil5,x,2.7,z,.1,5.4,.1,kisin?0xb9d4e6:0xfff6e6);S.ekle(cvG.ufak,x,5.55,z,.24,.24,.24,0xffc93d);
      if(var_){const dx=x-ox,dz=z-oz,l=Math.hypot(dx,dz),ryI=Math.atan2(dx,dz),ryB=Math.atan2(-dz,dx);
        for(let j=0;j<8;j++){const u=(j+.5)/8,y=5.3-1.0*4*u*(1-u);S.ekle(cvG.kutu,ox+dx*u,y+.02,oz+dz*u,.04,.04,l/8+.3,0xffffff,0,ryI);S.ekle(cvG.ucgen,ox+dx*u,y-.42,oz+dz*u,.42,.85,.05,cvBAYRAK[n++%6],Math.PI,ryB,0,0,1);}}
      ox=x;oz=z;var_=true;
    }
  };
  for(const yan of [-1,1])cvIp(N-30,4,yan);   // sade: kısa bayrak ipi
  const cvHay=[[],[],[],[]], cvHRENK=kisin?[[0xe8503c,0x3f8fe0,0xffc23d],[0xffffff,0xf6efe4,0xeef4fa],[0xffffff,0xf4f1ea,0xfafcff],[0xc98d55,0xd9a066,0xb87a4a]]:[[0x5fbf7a,0x7ac86a,0x4fae8c],[0xffffff,0xffffff,0xffffff],[0x5fbf7a,0x8fce6a,0x4fae8c],[0xffffff,0xffffff,0xffffff]];
  const cvYer=(i,yan,uz,r)=>{const p=cvKenar(i,yan,uz,.8);if(yakin(p.x,p.z)<YARI+4.3||!cvBos(p.x,p.z,r))return null;cvYasak.push([p.x,p.z,r+.5]);return p;};
  const cvHayKoy=(p,tur,s,k)=>{if(!kisin)s*=tur%2?1:1.15;cvHay[tur].push([p.x,0,p.z,s,s,s,p.ry,cvHRENK[tur][k%3]]);};
  for(const yan of [-1,1])for(let k=0;k<12;k+=2){const p=cvYer(N-42+k*8+(yan>0?4:0),yan,YARI+5.6+(k%3)*1.0,1.0);if(p)cvHayKoy(p,(k+(yan>0?2:0))%4,1.25+(k%3)*.12,k);}
  for(let k=0;k<28;k+=2){const f=.1+k*.03,p=cvYer(cvI(f+.006),(k*5)%3===0?-1:1,YARI+5.3+(k%4)*.7,1.0);if(!p)continue;
    cvHayKoy(p,kisin?(f<.33?1+(k%2):f<.44?0:f<.62?2:f<.82?3:0):(k%3===2?1:k%2?2:0),1.2+(k%3)*.14,k);}
  if(!kisin){
    const KUM=0xedc986;
    { // tahta iskele: kumdan suya uzanır, yanında kayıklar
      const p=koy(.6,-1,YARI+13,3.2)||koy(.5,1,YARI+13,3.2);
      if(p){S.yer(p.x,p.z,p.ry);let son=3;
        for(let k=0;k<22;k++){const z=3-k*.95,w=S.dunya(0,z);if(k>3&&yakin(w.x,w.z)<YARI+6)break;son=z;
          S.ekle(cvG.kutu,0,.62,z,2.7,.14,.85,k%2?0xd29a5c:0xc48a4c);
          if(k%3===0)for(const x of [-1.4,1.4]){S.ekle(cvG.sil,x,.45,z,.14,1.9,.14,0x8f5c34);S.ekle(cvG.kureK,x,1.42,z,.19,.12,.19,0xfff3d6);if(k%6===3){const q=S.dunya(x,z);cvHay[1].push([q.x,1.5,q.z,1,1,1,p.ry+x,0xffffff]);}}
        }
        for(const x of [-1.4,1.4])S.ekle(cvG.kutu,x,1.15,(3+son)/2,.07,.07,3-son,0xfff3d6);
        S.yer(2.9,son+1.5,.3,1,true);cvKayik(0xff8670);S.yer(p.x,p.z,p.ry);S.yer(-3.1,son+4,-.5,1,true);cvKayik(0x6cbbdb);
      }
    }
    // kumdan kaleler: kova ve kürekle
    for(let k=0;k<6;k++){const p=koy(.84+k*.018,k%2?-1:1,YARI+6.6+(k%2)*1.6,2.4);if(!p)continue;S.yer(p.x,p.z,p.ry+.4,.9+(k%3)*.15);
      S.ekle(cvG.tac,0,-.1,0,3,.5,3,0xf3d696);S.ekle(cvG.kutu,0,.6,0,2.6,1.0,2.6,KUM);
      for(const x of [-1.3,1.3])for(const z of [-1.3,1.3]){S.ekle(cvG.sil,x,.85,z,.55,1.7,.55,0xf2d391);S.ekle(cvG.koni,x,2.1,z,.7,.8,.7,0xe2bb74);}
      for(let j=-1;j<=1;j++)for(const z of [-1.3,1.3]){S.ekle(cvG.kutu,j*.62,1.22,z,.3,.26,.3,0xf2d391);S.ekle(cvG.kutu,z,1.22,j*.62,.3,.26,.3,0xf2d391);}
      S.ekle(cvG.sil,0,1.5,0,.75,1.8,.75,0xf6dba0);S.ekle(cvG.koni,0,2.9,0,.95,1.0,.95,0xe2bb74);S.ekle(cvG.sil5,0,3.9,0,.035,1.1,.035,0xffffff);S.ekle(cvG.kutu,.3,4.2,0,.6,.36,.03,[0xff6b6b,0x5fd0e0,0xffd95a][k%3],0,0,0,0,1);
      S.ekle(cvG.sil,0,.55,1.31,.38,.06,.38,0x9a7a4c,Math.PI/2);
      S.ekle(cvG.govdeK,2.3,.3,1.2,.32,.6,.32,0xf0603c,Math.PI);S.ekle(cvG.kutu,2.3,.08,2.0,.12,.06,.9,0x5fd0e0,0,.6);S.ekle(cvG.kutu,2.55,.08,2.38,.3,.06,.34,0x5fd0e0,0,.6);
    }
    // sörf tahtası askıları
    for(let k=0;k<5;k++){const p=koy(.69+k*.028,k%2?1:-1,YARI+7.5,2.2);if(!p)continue;S.yer(p.x,p.z,p.ry);
      for(const x of [-1.7,1.7])S.ekle(cvG.kutu,x,.8,0,.14,1.6,.14,0xb9824c);S.ekle(cvG.kutu,0,1.5,0,3.6,.12,.12,0xb9824c);
      for(let j=0;j<4;j++){const x=-1.2+j*.8,r=[0xff7b6b,0x5fd0e0,0xffd95a,0x8fe39a,0xffa64d][(j+k)%5];S.ekle(cvG.kureK,x,1.5,.3,.36,1.5,.07,r,-.2);S.ekle(cvG.kutu,x,1.5,.36,.08,2.4,.03,0xffffff,-.2);}
    }
    // sudaki kayalık burunlar: çevresinde köpük, tepesinde martı
    for(let k=0;k<8;k++){const q=cvKenar(cvI(.03+k*.123),k%2?-1:1,YARI+17+(k%3)*3),x=q.x,z=q.z,ry=q.ry;if(yakin(x,z)<YARI+15)continue;S.yer(x,z,k*1.3);
      S.ekle(cvG.daire,0,.03,0,5.2,4.2,1,0xe9fbff,-Math.PI/2);
      for(let j=0;j<5;j++){const a=j*1.4+k,r=j?2.2:0,s=j?1.1+(j%3)*.45:2.4;S.ekle(cvG.ufak,Math.cos(a)*r,s*.35,Math.sin(a)*r,s,s*.8,s*.9,[0xb9ab98,0xa89a8a,0xc9bba6][j%3],0,a);}
      if(k%2===0)cvHay[3].push([x,2.42,z,1.1,1.1,1.1,ry,0xffffff]);cvYasak.push([x,z,5]);
    }
    // sudaki küçük kum adacıkları: üstünde palmiyeler
    for(let k=0;k<10;k++){const q=cvKenar(cvI(.06+k*.095),k%2?1:-1,YARI+27+(k%3)*5),x=q.x,z=q.z;if(yakin(x,z)<YARI+22||!cvBos(x,z,7))continue;cvYasak.push([x,z,7]);S.yer(x,z,k*.8);
      S.ekle(cvG.daire,0,.03,0,7.6,6.2,1,0xe9fbff,-Math.PI/2);S.ekle(cvG.tac,0,-.3,0,6.5,1.1,5.2,0xf4db9f);S.ekle(cvG.ufak,-3.6,.3,1.5,1.0,.7,.9,0xb9ab98);
      for(let j=0;j<2+(k%2);j++){const w=S.dunya(-1.8+j*2.2,(j%2)*1.4-.6),s=.85+j*.2;agaclar.push([w.x,.45,w.z,s,s*1.05,s,k+j*2,[0x46af75,0x64bf76,0x59b96f][(k+j)%3]]);}
    }
    // şamandıralar ve kayıklar suyla birlikte hafifçe sallanır
    for(let k=0;k<14;k++){const q=cvKenar(cvI(.04+k*.07),k%2?1:-1,YARI+14.5);if(yakin(q.x,q.z)<YARI+13)continue;S.yer(q.x,q.z,0);Sb(cvG.kure,0,.3,0,.5,.45,.5,k%2?0xff6b5a:0xffc23d);Sb(cvG.sil,0,.42,0,.52,.14,.52,0xffffff);Sb(cvG.sil5,0,1.0,0,.05,.9,.05,0xffffff);Sb(cvG.ufak,0,1.5,0,.13,.13,.13,0xffe066);}
    for(let k=0;k<6;k++){const q=cvKenar(cvI(.09+k*.16),k%2?-1:1,YARI+19+(k%2)*3);if(yakin(q.x,q.z)<YARI+16)continue;S.yer(q.x,q.z,q.ry+1.2);cvKayik([0xff8670,0x6cbbdb,0xffd261,0x8fe39a][k%4]);}
    // kum üstünde deniz yıldızları ve kabuklar
    for(let k=0;k<44;k++){const q=cvKenar(cvI(k/44+.011),k%2?1:-1,YARI+3.9+(k%4)*.5),x=q.x,z=q.z;if(yakin(x,z)<YARI+3.3||!cvBos(x,z,.5))continue;S.yer(x,z,k*1.7);
      if(k%3===0)for(let j=0;j<5;j++){const a=j/5*6.283;S.ekle(cvG.petal,Math.sin(a)*.26,.03,Math.cos(a)*.26,.13,.1,.32,0xff8a5c,0,a);}
      else S.ekle(cvG.yarimK,0,.03,0,.28,.15,.32,k%3===1?0xffe9d5:0xf7b8c4);}
    { // kaplumbağa
      const B=cvYapi(),e=cvE(B);
      e(cvG.sil,0,.24,0,.66,.14,.78,0xf0dfa5);e(cvG.yarimK,0,.26,0,.6,.5,.72,0xffffff,1);for(let k=0;k<5;k++){const a=k/5*6.283;e(cvG.kureK,Math.sin(a)*.3,.56,Math.cos(a)*.38,.15,.08,.17,0xd9f2b4);}
      e(cvG.kure,0,.55,.85,.27,.26,.27,0xa9dc94);e(cvG.koni,0,.2,-.82,.08,.2,.05,0xa9dc94,0,0,-Math.PI/2);
      for(const s of [-1,1]){e(cvG.ufak,s*.13,.63,1.06,.05,.06,.04,0x2c3742);e(cvG.kureK,s*.2,.5,1.03,.06,.04,.03,0xf5b8bd);e(cvG.kureK,s*.72,.2,.4,.34,.07,.2,0xa9dc94,0,s>0?1:0,0,s*.5);e(cvG.kureK,s*.55,.14,-.5,.22,.06,.16,0xa9dc94);}
      cok(B.geo(),cvMalz(2),cvHay[0].concat(cvHay[2]));
    }
    { // martı (yerde, iskelede ve kayalarda)
      const B=cvYapi(),e=cvE(B);
      e(cvG.kure,0,.62,0,.27,.27,.45,0xffffff);e(cvG.kure,0,1.0,.3,.2,.2,.2,0xffffff);e(cvG.koni,0,.97,.56,.06,.2,.06,0xffa53d,0,0,Math.PI/2);e(cvG.kureK,0,.66,-.45,.14,.06,.2,0xb5bfcc);
      for(const s of [-1,1]){e(cvG.ufak,s*.1,1.06,.44,.04,.045,.03,0x2c3742);e(cvG.sil5,s*.1,.2,0,.025,.4,.025,0xffa53d);e(cvG.kureK,s*.27,.66,-.05,.07,.2,.36,0xb5bfcc,0,1);}
      for(const a of cvHay[1]){a[3]*=1.25;a[4]*=1.25;a[5]*=1.25;}cok(B.geo(),cvMalz(2),cvHay[1].concat(cvHay[3]));
    }
    { // uçan martılar
      const B=cvYapi(),kus=[];B.ekle(cvG.kure,0,0,0,.2,.2,.6,0xffffff);B.ekle(cvG.ufak,0,.08,.6,.16,.16,.18,0xffffff);B.ekle(cvG.koni,0,.06,.85,.06,.2,.06,0xffa53d,Math.PI/2);
      for(const s of [-1,1]){B.ekle(cvG.kutu,s*.55,.05,.05,.9,.05,.5,0xffffff);B.ekle(cvG.kutu,s*1.3,.05,-.05,.7,.05,.32,0xb5bfcc);}B.ekle(cvG.kutu,0,.02,-.7,.3,.04,.4,0xb5bfcc);
      for(let i=0;i<10;i++){const a=(i<6?.3+i*.2:3.3+(i-6)*.25),r=(i<6?105:70)+(i%3)*10,s=2.2+(i%3)*.4;kus.push([Math.cos(a)*r,33+(i%4)*4,Math.sin(a)*r,s,s,s,Math.atan2(Math.sin(a),-Math.cos(a))]);}
      cvKus=cok(B.geo(),cvMalz(3),kus);cvKus.position.set(0,0,-70);
    }
    { // sudan sıçrayan yunuslar
      const B=cvYapi(),l=[];B.ekle(cvG.kure,0,0,0,.4,.42,1.3,0x6fa8d6);B.ekle(cvG.kureK,0,-.13,.1,.33,.3,1.05,0xeaf6ff);B.ekle(cvG.koni,0,-.03,1.42,.15,.5,.13,0x6fa8d6,Math.PI/2);B.ekle(cvG.ucgen,0,.52,-.1,.07,.5,.34,0x5c97c8);B.ekle(cvG.kureK,0,0,-1.45,.55,.06,.26,0x5c97c8);
      for(const s of [-1,1]){B.ekle(cvG.kureK,s*.42,-.2,.4,.3,.05,.16,0x5c97c8,0,0,s*.4);B.ekle(cvG.ufak,s*.3,.1,.95,.05,.05,.05,0x22323c);}
      for(let k=0;k<10;k++){const q=cvKenar(cvI(.05+k*.097),k%2?1:-1,YARI+22+(k%3)*4);if(yakin(q.x,q.z)<YARI+18||!cvBos(q.x,q.z,3))continue;l.push([q.x,0,q.z,1.5,1.5,1.5,q.ry+Math.PI/2*(k%2?1:-1)]);}
      if(l.length)cok(B.geo(),cvMalz(7),l);
    }
    { // su parıltıları
      const B=cvYapi(),l=[];B.ekle(new T.PlaneGeometry(1,1),0,0,0,1,1,1,0xffffff,-Math.PI/2,0,Math.PI/4);
      for(let k=0;k<320;k++){const q=cvKenar((R()*N)|0,R()<.5?1:-1,YARI+13.5+R()*R()*34);if(yakin(q.x,q.z)<YARI+13||!cvBos(q.x,q.z,.5))continue;const s=.7+R()*.9;l.push([q.x,.035,q.z,s*3.0,1,s*.75,R()*.6]);}
      const m=cok(B.geo(),cvMalz(6,{transparent:true,opacity:.9,depthWrite:false}),l);m.renderOrder=2;
    }
  }else{
    // iglolar
    for(let k=0;k<5;k++){const p=koy(.835+k*.022,k%2?-1:1,YARI+9.5+(k%2)*2,3.8);if(!p)continue;S.yer(p.x,p.z,p.ry,.95+(k%3)*.1);
      S.ekle(cvG.yarim,0,0,0,3,2.6,3,0xf4faff);for(const y of [.65,1.3,1.9]){const r=3*Math.sqrt(1-y*y/6.76);S.ekle(cvG.sil,0,y,0,r,.05,r,0xcfe3f1,0,.26);}
      S.ekle(cvG.sil,0,.55,3.0,1.15,1.7,1.25,0xe6f2fb,Math.PI/2);S.ekle(cvG.daire,0,.6,3.87,.8,.95,1,0x456a86);S.ekle(cvG.kureK,0,1.85,3.0,1.25,.16,.95,0xffffff);
      S.ekle(cvG.sil5,0,3.2,0,.05,1.4,.05,0x967d66);S.ekle(cvG.kutu,.36,3.65,0,.7,.4,.03,[0xe8503c,0x3f8fe0,0xffc23d][k%3],0,0,0,0,1);
      for(const x of [-1.9,1.9])S.ekle(cvG.kureK,x,.2,3.3,.6,.4,.6,0xf4faff);
    }
    // buz kristali öbekleri
    for(let k=0;k<14;k++){const p=koy(.44+k*.0135,k%2?1:-1,YARI+6.5+(k%3)*2.4,2.0);if(!p)continue;S.yer(p.x,p.z,k*.9,.8+(k%4)*.22);
      S.ekle(cvG.tac,0,-.2,0,2.2,.6,2.0,0xf2f9ff);
      for(let j=0;j<5;j++){const a=j*1.26+k,r=j?.95:0,h=j?1.1+(j%3)*.5:2.7;S.ekle(cvG.okt,Math.cos(a)*r,h*.75,Math.sin(a)*r,h*.26,h,h*.26,[0x8fdcf5,0xbff0ff,0x6fc6ee,0xd9f7ff][(j+k)%4],j?Math.sin(a)*.3:0,j,j?-Math.cos(a)*.3:0);}
    }
    // kayak pisti kapıları: kırmızı ve mavi bayraklar
    for(let k=0;k<12;k+=2)for(const yan of [-1,1]){const q=cvKenar(cvI(.635+k*.014),yan,YARI+4.3),x=q.x,z=q.z;if(yakin(x,z)<YARI+3.6||!cvBos(x,z,.6))continue;cvYasak.push([x,z,.9]);S.yer(x,z,q.ry);
      const r=k%2?0xe8503c:0x3f8fe0;S.ekle(cvG.sil5,0,1.4,0,.07,2.8,.07,r);S.ekle(cvG.kutu,0,2.3,-.55,.05,.7,1.0,r,0,0,0,0,1);S.ekle(cvG.kutu,0,2.3,-.55,.06,.24,1.02,0xffffff,0,0,0,0,1);S.ekle(cvG.kureK,0,.1,0,.4,.2,.4,0xf4faff);}
    // köy yolunda fenerler
    for(let k=0;k<14;k+=2){const q=cvKenar(cvI(.095+k*.016),k%2?1:-1,YARI+4.2),x=q.x,z=q.z;if(yakin(x,z)<YARI+3.6||!cvBos(x,z,.6))continue;cvYasak.push([x,z,.9]);S.yer(x,z,q.ry);
      S.ekle(cvG.sil5,0,1.6,0,.09,3.2,.09,0x5a4a44);S.ekle(cvG.kutu,0,3.1,.3,.09,.09,.8,0x5a4a44);S.ekle(cvG.kureK,0,2.75,.62,.26,.3,.26,0xffd97a);S.ekle(cvG.koni,0,3.03,.62,.36,.24,.36,0xffffff);}
    // kızaklar
    for(let k=0;k<6;k++){const p=cvYer(cvI(.115+k*.045),k%2?1:-1,YARI+5.4,1.3);if(!p)continue;const r=[0xe8503c,0x3fb37a,0xffc23d][k%3];S.yer(p.x,p.z,p.ry+1.1);
      for(const x of [-.4,.4]){S.ekle(cvG.kutu,x,.1,0,.08,.1,1.9,0xcfd8e0);S.ekle(cvG.kutu,x,.28,-.5,.07,.3,.07,0x9a6a40);S.ekle(cvG.kutu,x,.28,.5,.07,.3,.07,0x9a6a40);S.ekle(cvG.kutu,x,.3,1.05,.08,.1,.5,0xcfd8e0,-.8);}
      S.ekle(cvG.kutu,0,.46,0,1.0,.1,1.5,r);S.ekle(cvG.kutu,0,.52,0,.3,.1,1.52,0xffffff);}
    { // teleferik: iki direk, tel ve gidip gelen iki kabin (tek grup hareketi)
      const a=koy(.66,1,YARI+17,2.5),b=koy(.79,1,YARI+17,2.5);
      if(a&&b){const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz),ry=Math.atan2(dx,dz);
        for(const q of [a,b]){S.yer(q.x,q.z,ry);S.ekle(cvG.kutu,0,6,0,.6,12,.6,0x8fa3b5);S.ekle(cvG.kutu,0,12,0,3.2,.3,.5,0x8fa3b5);S.ekle(cvG.kureK,0,12.2,0,1.7,.22,.4,0xffffff);S.ekle(cvG.tac,0,-.2,0,2,.8,2,0xf4faff);}
        S.yer((a.x+b.x)/2,(a.z+b.z)/2,ry);S.ekle(cvG.kutu,0,11.8,0,.08,.08,l,0x4c5a68);
        const B=cvYapi();for(const s of [-1,1]){const z=s*l*.2,r=s>0?0xe8503c:0xffc23d;B.ekle(cvG.kutu,0,-.6,z,.08,1.2,.08,0x4c5a68);B.ekle(cvG.kutu,0,-2.0,z,1.5,1.6,2.0,r);B.ekle(cvG.kutu,0,-1.8,z,1.54,.6,1.6,0xbfe9fa);B.ekle(cvG.kutu,0,-1.8,z,1.2,.6,2.04,0xbfe9fa);B.ekle(cvG.kutu,0,-1.15,z,1.7,.14,2.2,0xffffff);}
        const grup=new T.Group(),mesh=new T.Mesh(B.geo(),cvMalz(0));mesh.frustumCulled=false;grup.position.set((a.x+b.x)/2,11.8,(a.z+b.z)/2);grup.rotation.y=ry;grup.add(mesh);scene.add(grup);cvTel={mesh,g:l*.26};
      }
    }
    // yumuşak kar tepecikleri ve uzak çam sıraları: boş düzlüğü doldurur
    for(let k=0;k<26;k++){const q=cvKenar(cvI(k/26+.017),k%2?1:-1,YARI+24+(k%4)*9),x=q.x,z=q.z;if(yakin(x,z)<YARI+20)continue;S.yer(x,z,k*1.1);S.ekle(cvG.tacY,0,-1.2,0,13+(k%3)*4,3.4+(k%4)*.9,10+(k%2)*4,k%2?0xf3f9ff:0xe8f3fc);}
    for(let k=0;k<120;k++){const q=cvKenar((R()*N)|0,R()<.5?1:-1,YARI+15+R()*34),x=q.x,z=q.z;if(yakin(x,z)<YARI+13.5||!cvBos(x,z,2.4))continue;const s=1+R()*.8;agaclar.push([x,0,z,s,s*(.9+R()*.3),s,R()*6.28,[0x4d9b89,0x4a948b,0x6fb3a6,0x3f8a7c][k%4]]);}
    { // penguen
      const B=cvYapi(),e=cvE(B);
      e(cvG.kure,0,.72,0,.5,.72,.46,0x3b4d63);e(cvG.kure,0,.66,.13,.4,.58,.38,0xffffff);e(cvG.kure,0,1.5,.02,.37,.36,.36,0x3b4d63);e(cvG.kureK,0,1.44,.2,.27,.24,.2,0xffffff);
      e(cvG.koni,0,1.45,.45,.09,.26,.07,0xffa53d,0,0,Math.PI/2);e(cvG.sil,0,1.16,.02,.4,.13,.38,0xffffff,1);e(cvG.kutu,.22,.95,.36,.16,.4,.07,0xffffff,1);
      for(const s of [-1,1]){e(cvG.ufak,s*.14,1.56,.33,.05,.06,.04,0x1f2a36);e(cvG.kureK,s*.2,.07,.22,.2,.07,.28,0xffa53d);e(cvG.kureK,s*.52,.8,0,.09,.42,.24,0x3b4d63,0,s>0?1:0,0,0,s*.3);}
      if(cvHay[0].length)cok(B.geo(),cvMalz(2),cvHay[0]);
    }
    { // kutup ayısı yavrusu
      const B=cvYapi(),e=cvE(B);
      e(cvG.kure,0,.62,0,.6,.62,.55,0xffffff,1);e(cvG.kure,0,1.45,.08,.48,.45,.45,0xffffff,1);e(cvG.kureK,0,1.34,.47,.2,.15,.16,0xfff0dd);e(cvG.ufak,0,1.4,.62,.065,.05,.05,0x2c3742);e(cvG.sil,0,1.06,.04,.44,.14,.42,0xe8503c);
      for(const s of [-1,1]){e(cvG.kureK,s*.34,1.86,.05,.16,.16,.1,0xffffff,1);e(cvG.ufak,s*.17,1.55,.46,.05,.06,.04,0x2c3742);e(cvG.kureK,s*.25,1.36,.41,.08,.05,.04,0xf5b8bd);e(cvG.kure,s*.66,1.0,.08,.17,.36,.18,0xffffff,1,s>0?1:0,0,0,-s*.7);e(cvG.kure,s*.3,.16,.22,.22,.16,.3,0xffffff,1);}
      if(cvHay[1].length)cok(B.geo(),cvMalz(2),cvHay[1]);
    }
    { // kar tavşanı
      const B=cvYapi(),e=cvE(B);
      e(cvG.kure,0,.46,0,.42,.46,.5,0xffffff,1);e(cvG.kure,0,1.05,.2,.34,.33,.33,0xffffff,1);e(cvG.kureK,0,.4,-.5,.17,.17,.17,0xffffff);e(cvG.ufak,0,1.02,.52,.05,.04,.04,0xf28aa0);e(cvG.sil,0,.8,.12,.3,.1,.3,0x5fc4f0);
      for(const s of [-1,1]){e(cvG.kureK,s*.15,1.62,.14,.09,.4,.07,0xffffff,1,0,0,0,-s*.15);e(cvG.kureK,s*.15,1.62,.18,.05,.3,.04,0xf7b6c2,0,0,0,0,-s*.15);e(cvG.ufak,s*.14,1.13,.48,.045,.055,.035,0x2c3742);e(cvG.kureK,s*.22,.1,.3,.14,.1,.24,0xffffff,1);e(cvG.kureK,s*.36,.62,.3,.1,.2,.1,0xffffff,1,s>0?1:0);}
      for(const a of cvHay[2]){a[3]*=1.2;a[4]*=1.2;a[5]*=1.2;}if(cvHay[2].length)cok(B.geo(),cvMalz(2),cvHay[2]);
    }
    { // ren geyiği
      const B=cvYapi(),e=cvE(B);
      e(cvG.kure,0,1.2,0,.45,.48,.85,0xffffff,1);e(cvG.kureK,0,1.05,.1,.36,.3,.6,0xf3e2c8);e(cvG.govde,0,1.85,.72,.26,.9,.26,0xffffff,1,0,.5);e(cvG.kure,0,2.35,1.0,.3,.3,.42,0xffffff,1);
      e(cvG.ufak,0,2.3,1.42,.1,.1,.1,0xff4d4d);e(cvG.kureK,0,1.35,-.85,.14,.14,.12,0xffffff);e(cvG.sil,0,1.72,.62,.3,.12,.3,0x3fb37a,0,0,.5);
      for(const s of [-1,1]){for(const z of [-.5,.5])e(cvG.sil5,s*.24,.45,z,.085,.9,.085,0x7a5236);e(cvG.ufak,s*.17,2.45,1.28,.05,.06,.04,0x2c3742);e(cvG.kureK,s*.3,2.55,.85,.07,.16,.1,0xffffff,1,0,0,0,-s*.8);
        e(cvG.kutu,s*.28,2.95,.85,.07,.7,.07,0x8a6a4a,0,0,0,0,-s*.35);e(cvG.kutu,s*.5,3.1,.85,.3,.07,.07,0x8a6a4a,0,0,0,0,s*.5);e(cvG.kutu,s*.2,3.25,.85,.26,.07,.07,0x8a6a4a,0,0,0,0,-s*.6);}
      for(const a of cvHay[3]){a[3]*=.9;a[4]*=.9;a[5]*=.9;}if(cvHay[3].length)cok(B.geo(),cvMalz(2),cvHay[3]);
    }
  }
  // ───────── cv3 ikinci tur: şenlikli başlangıç, büyük ön plan süsleri, köpük, kayan penguenler, uzak katman ─────────
  { const BAL=[0xff5d5d,0xffd23f,0x4fc3f7,0x7be07b,0xff8fc7,0xb48cff];
    for(const yan of [-1,1])for(let k=1;k<4;k+=2){const p=cvYer(N-26+k*17,yan,YARI+7.2+(k%2)*1.3,1.1);if(!p)continue;S.yer(p.x,p.z,p.ry);
      S.ekle(cvG.kutu,0,.25,0,.5,.5,.5,BAL[(k+3)%6]);
      for(let j=0;j<3;j++){const x=(j-1)*.75,y=4.2+(j%2)*.9;S.ekle(cvG.kutu,x*.55,y/2+.1,0,.035,y-.4,.035,0xffffff,0,0,-x*.13);S.ekle(cvG.kure,x,y+.5,0,.62,.75,.62,BAL[(k*2+j)%6],0,0,0,0,0,1);}}
    if(!kisin){
      for(let k=0;k<26;k++){const p=cvYer(cvI(.045+k*.0365),k%2?1:-1,YARI+8.5+(k%3)*1.6,3.2);if(!p)continue;S.yer(p.x,p.z,p.ry,1.25);const r=BAL[k%6];
        if(k%3===0){   // dev şemsiye, şezlonglar, top
          S.ekle(cvG.sil5,0,1.9,0,.09,3.8,.09,0xffffff);S.ekle(cvG.yarim,0,3.3,0,2.6,.9,2.6,r);S.ekle(cvG.yarim,0,3.36,0,1.3,.78,1.3,0xffffff);S.ekle(cvG.ufak,0,4.25,0,.14,.14,.14,0xffd23f);
          cvSezlong(-1.3,.6,BAL[(k+2)%6]);cvSezlong(1.3,.6,BAL[(k+4)%6]);cvTop(0,2.4,k);
        }else if(k%3===1){   // cankurtaran kulesi
          for(const a of [-1,1])for(const b of [-1,1])S.ekle(cvG.kutuY,a*1.0,1.3,b*1.0,.16,2.6,.16,0xffffff);
          S.ekle(cvG.kutuY,0,2.65,0,2.8,.16,2.8,0xf7e3b8);S.ekle(cvG.kutuY,0,3.6,-.2,2.2,1.8,2.0,0xffffff);S.ekle(cvG.kutuY,0,3.7,.82,1.3,.8,.06,0x7fd6ff);
          S.ekle(cvG.catiY,0,4.5,-.2,.5,.6,.55,0xf0503c);S.ekle(cvG.kutuY,0,3.0,-.2,2.24,.3,2.04,0xf0503c);
          S.ekle(cvG.sil5,1.2,5.6,-1.0,.04,1.6,.04,0xffffff);S.ekle(cvG.ucgen,1.55,6.0,-1.0,.3,.7,.04,0xffd23f,0,0,-Math.PI/2,0,1);
          for(let j=0;j<5;j++)S.ekle(cvG.kutu,0,.4+j*.5,2.0-j*.12,.9,.07,.12,0xc9a06a);for(const a of [-1,1])S.ekle(cvG.kutu,a*.45,1.35,1.72,.08,2.8,.08,0xc9a06a,.22);
          S.ekle(cvG.sil,-1.9,.5,1.2,.55,.3,.55,0xff8a3d,Math.PI/2);S.ekle(cvG.sil,-1.9,.5,1.2,.25,.32,.25,0xffffff,Math.PI/2);
        }else{   // dondurma arabası
          S.ekle(cvG.kutu,0,1.0,0,2.6,1.3,1.5,0xffffff);S.ekle(cvG.kutu,0,.9,.02,2.64,.35,1.54,r);
          for(const a of [-1,1]){S.ekle(cvG.sil,a*1.0,.42,.8,.42,.14,.42,0x4c5a68,Math.PI/2);S.ekle(cvG.kutu,a*1.2,2.3,0,.07,1.4,.07,0xffffff);}
          for(let j=0;j<5;j++)S.ekle(cvG.kutu,(j-2)*.56,3.05,0,.56,.12,1.9,j%2?0xffffff:r);
          S.ekle(cvG.koni,0,3.75,0,.42,1.1,.42,0xe9b872,Math.PI);S.ekle(cvG.kure,0,4.5,0,.5,.5,.5,0xff9ac2);S.ekle(cvG.kure,0,5.05,0,.4,.4,.4,0xfff3d0);S.ekle(cvG.ufak,0,5.5,0,.13,.13,.13,0xf0503c);
        }
        cvGolgeler.push([p.x-.4,.019,p.z+.3,3.2,1,2.4,-.4]);
      }
      // dalga köpüğü: kıyı çizgisinde beyaz köpükler suyla birlikte kıyıya vurup çekilir
      for(let i=0;i<N;i+=5)for(const yan of [-1,1]){const p=cvKenar(i,yan,18.3);if(yakin(p.x,p.z)<17.6)continue;S.yer(p.x,p.z,p.ry);S.ekle(cvG.daire,0,-.02,0,2.9,.8,1,0xffffff,-Math.PI/2,0,0,0,0,1);}
      // orta uzaklıkta yeşil tepeli adalar
      for(let k=0;k<7;k++){const a=k/7*6.283+.4,r=215+(k%3)*38,x=Math.cos(a)*r,z=-70+Math.sin(a)*r;if(yakin(x,z)<75)continue;S.yer(x,z,k*1.3);
        S.ekle(cvG.tac,0,-1,0,34,3.2,26,0xf2dba2);S.ekle(cvG.tac,-4,2,0,20,11+(k%3)*4,16,0x58b877);S.ekle(cvG.tac,11,1,3,11,7,10,0x79c986);
        for(let j=0;j<3;j++){S.ekle(cvG.sil5,-19+j*3.5,5,11+j*2,.5,10,.5,0xa87a4e);S.ekle(cvG.tac,-19+j*3.5,10.5,11+j*2,4.5,1.6,4.5,0x46af75);}}
    }else{
      for(let k=0;k<26;k++){const p=cvYer(cvI(.04+k*.0365),k%2?-1:1,YARI+8.5+(k%3)*1.6,3.2);if(!p)continue;S.yer(p.x,p.z,p.ry,1.25);const r=BAL[k%6];
        if(k%3===0){   // süslü büyük çam
          S.ekle(cvG.govdeK,0,.6,0,.45,1.2,.45,0x947552);
          for(let j=0;j<3;j++){const y=2.3+j*1.75,w=2.7-j*.7;S.ekle(cvG.koni,0,y,0,w,2.6,w,0x3f9a78,0,j*.6);S.ekle(cvG.koni,0,y+.75,0,w*.5,1.15,w*.5,0xffffff,0,j*.6);
            for(let q=0;q<4;q++){const a=q*1.571+j*.8;S.ekle(cvG.ufak,Math.cos(a)*w*.86,y-1.12,Math.sin(a)*w*.86,.22,.22,.22,BAL[(q+j*2)%6]);}}
          S.ekle(cvG.okt,0,7.45,0,.42,.5,.16,0xffd23f);
        }else if(k%3===1){   // buz kalesi
          for(const a of [-1,1]){S.ekle(cvG.sil,a*1.9,1.7,0,.95,3.4,.95,0xbfe6f7);S.ekle(cvG.koni,a*1.9,4.2,0,1.15,1.6,1.15,0x6fb8e6);S.ekle(cvG.kureK,a*1.9,3.42,0,1.05,.2,1.05,0xffffff);S.ekle(cvG.kutu,a*1.9,2.2,.92,.5,.7,.1,0xffd76a);}
          S.ekle(cvG.kutu,0,1.25,-.1,2.6,2.5,.8,0xd4effa);S.ekle(cvG.kutu,0,.9,.32,1.1,1.8,.1,0x7a5a46);S.ekle(cvG.sil,0,1.8,.32,.55,.1,.55,0x7a5a46,Math.PI/2);
          for(let j=-2;j<=2;j++)S.ekle(cvG.kutu,j*.56,2.7,-.1,.34,.4,.8,0xd4effa);
          S.ekle(cvG.sil5,0,3.9,-.1,.05,2.2,.05,0xffffff);S.ekle(cvG.ucgen,.42,4.7,-.1,.3,.8,.04,r,0,0,-Math.PI/2,0,1);
        }else{   // hediye dolu kızak
          for(const a of [-1,1]){S.ekle(cvG.kutu,a*.8,.12,0,.12,.12,3.4,0xe8503c);S.ekle(cvG.kutu,a*.8,.4,1.75,.12,.6,.12,0xe8503c,-.6);for(const b of [-1,1])S.ekle(cvG.kutu,a*.8,.4,b*.9,.1,.5,.1,0x7a5a46);}
          S.ekle(cvG.kutu,0,.7,0,1.9,.14,2.9,0xc98d55);
          S.ekle(cvG.kutu,-.35,1.3,-.6,1.0,1.0,1.0,BAL[k%6]);S.ekle(cvG.kutu,-.35,1.3,-.6,1.04,1.04,.2,0xffffff);S.ekle(cvG.kutu,.45,1.15,.5,.75,.75,.75,BAL[(k+2)%6]);S.ekle(cvG.kutu,.45,1.15,.5,.2,.79,.79,0xffffff);S.ekle(cvG.kutu,-.3,2.1,-.6,.6,.6,.6,BAL[(k+4)%6]);S.ekle(cvG.kure,.45,1.75,.5,.3,.3,.3,0xffd23f);
        }
        cvGolgeler.push([p.x-.4,.012,p.z+.3,3.2,1,2.4,-.4]);
      }
      { // donmuş gölde daire çizerek kayan üç penguen
        let p=null;for(let q=0;q<60&&!p;q++)p=cvYer(cvI(.5+(q%2?-1:1)*Math.ceil(q/2)*.011),q%4<2?-1:1,YARI+10.8,5.0);
        if(p){const px=p.x,pz=p.z;S.yer(px,pz,0);S.ekle(cvG.daire,0,.03,0,5.4,5.4,1,0xffffff,-Math.PI/2);S.ekle(cvG.daire,0,.045,0,4.8,4.8,1,0x9fdcf5,-Math.PI/2);S.ekle(cvG.daire,-1.2,.055,-1,1.9,.45,1,0xd9f4ff,-Math.PI/2);S.ekle(cvG.daire,1.4,.055,1.3,1.3,.35,1,0xd9f4ff,-Math.PI/2);
          const B=cvYapi();for(let j=0;j<3;j++){const a=j*2.094;B.yer(Math.cos(a)*3,Math.sin(a)*3,Math.PI-a);
            B.ekle(cvG.kure,0,.72,0,.5,.72,.46,0x3b4d63);B.ekle(cvG.kure,0,.66,.13,.4,.58,.38,0xffffff);B.ekle(cvG.kure,0,1.5,.02,.37,.36,.36,0x3b4d63);B.ekle(cvG.kureK,0,1.44,.2,.27,.24,.2,0xffffff);B.ekle(cvG.koni,0,1.45,.45,.09,.26,.07,0xffa53d,Math.PI/2);
            for(const q of [-1,1]){B.ekle(cvG.ufak,q*.14,1.56,.33,.05,.06,.04,0x1f2a36);B.ekle(cvG.kureK,q*.2,.07,.22,.2,.07,.28,0xffa53d);B.ekle(cvG.kureK,q*.62,.98,0,.09,.42,.24,0x3b4d63,0,0,q*1.1);}
            B.ekle(cvG.sil,0,1.16,.02,.41,.13,.39,[0xe8503c,0xffc23d,0x4fc3f7][j]);}
          const g=new T.Group(),m=new T.Mesh(B.geo(),cvMalz(0));g.position.set(px,.05,pz);g.add(m);scene.add(g);cvKayan=g;}
      }
      // orta uzaklıkta karlı sivri tepeler
      const cvKarDag=[];   // yuvarlak doruklu karlı tepeler: dalgalı kar başlığı köşe renginde, karlı ışıkta grileşmez (tek çizim)
      for(let k=0;k<8;k++){const a=k/8*6.283+.2,r=230+(k%3)*40,x=Math.cos(a)*r,z=-70+Math.sin(a)*r;if(yakin(x,z)<90)continue;S.yer(x,z,k*1.7);const H=46+(k%3)*12,h=H*.4;
        const w=S.dunya(0,0),wx=w.x,wz=w.z,w2=S.dunya(24,6);cvKarDag.push([wx,H/2-1,wz,36,H,30,k*1.7,0xffffff],[w2.x,12,w2.z,24,26,20,k*1.7+.5,0xf2f7ff]);}
      {const g=cvDagY().clone(),p=g.attributes.position,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const t=p.getY(i)+.5,a=Math.atan2(p.getZ(i),p.getX(i)),f=clamp((t-.58+.05*Math.sin(a*5)+.025*Math.cos(a*9))/.04,0,1);c[i*3]=lerp(.66,1,f);c[i*3+1]=lerp(.76,1,f);c[i*3+2]=lerp(.95,1,f);}g.setAttribute('color',new T.BufferAttribute(c,3));
        const m=new T.MeshLambertMaterial({vertexColors:true});m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance += vColor.rgb * 0.42;\n#endif');};m.customProgramCacheKey=()=>'cvKarDag';if(cvKarDag.length)cok(g,m,cvKarDag);}
    }
  }
  // Yol boyunca direkler ve bayraklar; kapıyı daraltan rastgele dekor yok.
  for(let i=0;i<N;i+=24)for(const yan of [-1,1]){const p=cvKenar(i,yan,YARI+3.2);if(yakin(p.x,p.z)<YARI+2.8)continue;S.yer(p.x,p.z,p.ry);S.ekle(cvG.sil5,0,.56,0,.12,1.1,.12,kisin?0x967d66:0xf7f3dc);S.ekle(cvG.kureK,0,1.17,0,.16,.14,.16,kisin?0xeb8d67:0x61c8cf);}
  for(let i=0;i<N;i+=9)for(const yan of [-1,1]){if((!kisin&&((i/9|0)%7===3||(i/9|0)%7===4))||(kisin&&((i/9|0)%9===3||(i/9|0)%9===4)))continue;const p=cvKenar(i+((R()*7)|0),yan,YARI+(kisin?6:6.5)+R()*(kisin?8:3));if(yakin(p.x,p.z)<YARI+(kisin?5:6)||!cvBos(p.x,p.z,2.7))continue;const s=.8+R()*.5;agaclar.push([p.x,0,p.z,s,s*(.85+R()*.35),s,R()*6.28,kisin?[0x4d9b89,0x4a948b,0x6fb3a6][i%3]:[0x46af75,0x64bf76,0x59b96f][i%3]]);cvYasak.push([p.x,p.z,2.0]);cvGolgeler.push([p.x-.5,.012,p.z+.3,2.2*s,1,1.4*s,-.4]);}
  if(kisin){
    const B=cvYapi();B.ekle(cvG.govdeK,0,.85,0,.28,1.7,.28,0x947552);
    for(let k=0;k<3;k++){
      const y=2.05+k*1.45,r=2.15-k*.50;B.ekle(cvG.koni6,0,y,0,r,2.3-k*.17,r,0xffffff,0,k*.7,0,1);
      B.ekle(cvG.kureK,.10*(k%2?1:-1),y+.62,.04,r*.77,.53,r*.78,0xf8fcff);
      for(let j=0;j<3;j++){const a=j/3*Math.PI*2+k*.8;B.ekle(cvG.kureK,Math.cos(a)*r*.47,y+.34+(j%2)*.10,Math.sin(a)*r*.47,r*.50,.31,r*.49,j%2?0xe4f1fa:0xf4fbff);}
      for(const s of [-1,1])B.ekle(cvG.govde,s*r*.34,y-.52,0,.09,r*.85,.09,0x759283,0,0,s*.93);
    }
    cok(cvTon(B.geo()),cvMalz(1),agaclar);
  }else{
    // Yapraklar düz şerit değil: kavisli omurga, ortada kıvrım ve yan yaprakçıklar.
    const pos=[],ind=[];
    for(let k=0;k<6;k++){const z=k*.78,y=Math.sin(k/5*Math.PI)*.62-k*.15,w=Math.sin(k/5*Math.PI)*.62+.025;pos.push(-w,y-.1,z,0,y+.06,z,w,y-.1,z);if(k<5){const a=k*3;ind.push(a,a+3,a+1,a+1,a+3,a+4,a+1,a+4,a+2,a+2,a+4,a+5);}}
    const yaprak=new T.BufferGeometry();yaprak.setAttribute('position',new T.Float32BufferAttribute(pos,3));yaprak.setIndex(ind);yaprak.computeVertexNormals();const B=cvYapi();
    for(let k=0;k<3;k++){B.ekle(cvG.govdeK,k*.12,.8+k*1.5,0,.3-k*.025,1.65,.3-k*.025,0xb58a56,0,0,-.08);B.ekle(cvG.sil,k*.12,1.45+k*1.5,0,.3-k*.025,.1,.3-k*.025,0xcdaa78);}
    for(let k=0;k<7;k++){const a=k/7*Math.PI*2;B.ekle(yaprak,.32,5.2,0,1,1,1,0xffffff,0,a,0,1);for(let j=1;j<=4;j++)for(const yan of [-1,1]){const d=.55+j*.58,xx=yan*.42,yy=5.2+Math.sin(d/3.9*Math.PI)*.62-d*.192;B.ekle(cvG.petal,.32+Math.cos(a)*xx+Math.sin(a)*d,yy,-Math.sin(a)*xx+Math.cos(a)*d,.26,.055,.62,j%2?0xf1f5e9:0xe2ebd8,0,a+yan*.95,0,1);}}
    B.ekle(cvG.kureK,.35,4.9,.1,.26,.3,.26,0x946b42);B.ekle(cvG.kureK,-.05,4.9,.2,.24,.29,.24,0xa07948);cok(B.geo(),cvMalz(1,{side:T.DoubleSide}),agaclar);
  }
  // Kardan adamlar veya kıyı fokları, yüzü yola dönük, sıcak gülümseyen seyirciler.
  for(let k=0;k<22;k++){const p=cvKenar(cvI(.025+k*.044),k%2?-1:1,YARI+4.7+(k%3)*.8,.8);if(yakin(p.x,p.z)<YARI+4.1||!cvBos(p.x,p.z,1.0))continue;seyirci.push([p.x,0,p.z,1.2,1.2,1.2,p.ry,kisin?[0xf0a184,0x85c5d1,0xb9a7d9][k%3]:[0x9fc7ce,0xb1d8d5,0x9bb9cf][k%3]]);}
  {
    const B=cvYapi(), e=(g,x,y,z,sx,sy,sz,r,kt,ke)=>B.ekle(g,x,y,z,sx,sy,sz,r,0,0,0,kt,1,ke);
    if(kisin){e(cvG.kure,0,.65,0,.65,.65,.60,0xffffff);e(cvG.kure,0,1.5,0,.45,.45,.43,0xffffff);B.ekle(cvG.koni,0,1.5,.49,.08,.35,.08,0xf1a34d,Math.PI/2);B.ekle(cvG.sil,0,2.0,0,.5,.11,.5,0x5e8197);B.ekle(cvG.sil,0,2.23,0,.31,.4,.31,0x6e92a5);B.ekle(cvG.sil,0,1.2,0,.45,.18,.45,0xffffff,0,0,0,1);B.ekle(cvG.kutu,.25,.96,.42,.18,.45,.07,0xffffff,0,0,0,1);for(let k=0;k<3;k++)e(cvG.ufak,0,.45+k*.23,.57,.055,.055,.04,0x58738b);for(const s of [-1,1]){B.ekle(cvG.kutu,s*.75,1.05,0,.55,.08,.08,0x947552,0,0,s*.45,0,1,s>0?1:0);e(cvG.ufak,s*.15,1.6,.4,.05,.06,.04,0x42647b);}}
    else{e(cvG.kure,0,.44,0,.62,.45,.80,0xffffff,1);e(cvG.kure,0,1.0,.5,.44,.42,.4,0xffffff,1);e(cvG.kureK,0,.9,.85,.28,.17,.14,0xffedda);for(const s of [-1,1]){e(cvG.kureK,s*.62,.25,0,.3,.1,.5,0xe8f6ef);e(cvG.ufak,s*.16,1.08,.85,.065,.08,.05,0x3c5864);e(cvG.kureK,s*.21,.95,.85,.08,.05,.04,0xf0b4af);}e(cvG.ufak,0,.99,.96,.08,.05,.05,0x506d77);e(cvG.kureK,0,.14,-.8,.40,.1,.30,0xcbdfe1);}
    if(kisin){for(let j=-2;j<=2;j++)e(cvG.ufak,j*.065,1.30+Math.abs(j)*.025,.41,.027,.027,.023,0x628095);for(const s of [-1,1])e(cvG.kureK,s*.29,1.42,.34,.065,.04,.025,0xeebcc2);}
    cok(B.geo(),cvMalz(2),seyirci);
  }
  // Hacimli, farklı doruklu arka plan. Kar pistinde dağ etekleri bile karla kaplıdır.
  if(kisin){
    // Bir sıradağ: aynı koniyi çoğaltmak yerine kıvrımlı, çok doruklu bir yükseklik ağı.
    const nx=32,nz=12,pos=[],col=[],idx=[];
    for(let j=0;j<=nz;j++)for(let k=0;k<=nx;k++){
      const x=k/nx*2-1,z=j/nz*2-1,yan=Math.pow(Math.max(0,1-z*z),.70),p1=(1-Math.pow(Math.min(1,Math.abs(x+.52)/.45),1.25))*.72,p2=1-Math.pow(Math.min(1,Math.abs(x-.02)/.40),1.25),p3=(1-Math.pow(Math.min(1,Math.abs(x-.54)/.42),1.25))*.79,h=yan*Math.max(p1,p2,p3)*(1+.04*Math.sin(z*3+x*5)),f0=clamp((h-.2)/.22,0,1),f=f0*f0*(3-2*f0),golge=.06*Math.exp(-(x+.28)*(x+.28)*75)+.05*Math.exp(-(x-.30)*(x-.30)*70);
      pos.push(x,h,z);col.push(lerp(.60,1,f)-golge*.4,lerp(.68,1,f)-golge*.25,lerp(.92,1,f)-golge*.10);if(j<nz&&k<nx){const a=j*(nx+1)+k;idx.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
    for(let k=0;k<12;k++){const a=k/12*Math.PI*2,r=390+(k%3)*50,x=Math.cos(a)*r,z=-65+Math.sin(a)*r,w=72+(k%3)*16,h=44+(k%4)*9;if(yakin(x,z)<YARI+w+25)continue;daglar.push([x,-.6,z,w,h,60+(k%3)*12,k*.73,0xffffff]);}
    const karDagMat=new T.MeshLambertMaterial({vertexColors:true});karDagMat.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance += vColor.rgb * 0.46;\n#endif');};karDagMat.customProgramCacheKey=()=> 'cvSnowRidge';cok(g,karDagMat,daglar);
  }else{
    // Kıyı silueti dağ konileri değil: sıcak kumtaşı katmanları ve yeşil tepeli adacıklar.
    const pos=[],col=[],idx=[],kat=[[0,1.00],[.16,1.08],[.22,1.02],[.23,1.00],[.255,1.035],[.265,1.03],[.44,.90],[.45,.89],[.475,.925],[.49,.92],[.67,.81],[.69,.84],[.77,.79]],renk=[0xbe946a,0xd6b17e,0xe7c89a,0xb28860,0xb28860,0xe2be8a,0xe3c28e,0xaf815c,0xaf815c,0xe3c18b,0xe7c99a,0x669b6a,0x7ab679],dilim=14,c=new T.Color();
    for(let j=0;j<kat.length;j++)for(let k=0;k<=dilim;k++){const a=k/dilim*Math.PI*2,r=kat[j][1]*(1+.1*Math.sin(a*3+.5)+.06*Math.cos(a*5)),y=kat[j][0]+(j?Math.sin(a*3+1)*.025:0);pos.push(Math.cos(a)*r,y,Math.sin(a)*r);c.setHex(renk[j]);col.push(c.r,c.g,c.b);if(j<kat.length-1&&k<dilim){const b=j*(dilim+1)+k;idx.push(b,b+dilim+1,b+1,b+1,b+dilim+1,b+dilim+2);}}
    const top=pos.length/3;pos.push(0,.78,0);c.setHex(0x8ac57f);col.push(c.r,c.g,c.b);for(let k=0;k<dilim;k++)idx.push(top,(kat.length-1)*(dilim+1)+k+1,(kat.length-1)*(dilim+1)+k);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
    // Alçak bitki başlıkları ayrı çizim açmaz; ada geometrisine üç farklı tümsek eklenir.
    const V=cvYapi();V.ekle(cvG.tac,-.33,.80,.18,.21,.07,.15,0x6fa66f);V.ekle(cvG.tac,.12,.81,-.2,.26,.09,.17,0x83b77c);V.ekle(cvG.tac,.42,.80,.2,.17,.06,.14,0x60996b);
    const a=g.toNonIndexed(),b=V.geo(),bir=new T.BufferGeometry();for(const ad of ['position','normal','color']){const v=new Float32Array(a.attributes[ad].array.length+b.attributes[ad].array.length);v.set(a.attributes[ad].array);v.set(b.attributes[ad].array,a.attributes[ad].array.length);bir.setAttribute(ad,new T.BufferAttribute(v,3));}
    for(let k=0;k<11;k++){const a=k/11*Math.PI*2+.25,r=230+(k%3)*45,x=Math.cos(a)*r,z=-65+Math.sin(a)*r,w=34+(k%4)*9,h=19+(k%4)*7;if(yakin(x,z)<YARI+w+35)continue;daglar.push([x,-.4,z,w,h,w*(.65+(k%3)*.12),k*.8,0xffffff]);}cok(bir,new T.MeshLambertMaterial({vertexColors:true}),daglar);
    const p=koy(.75,1,YARI+73,18);if(p){S.yer(p.x,p.z,p.ry);S.ekle(new T.TorusGeometry(1,.24,6,18,Math.PI),0,.3,0,13,12,4.5,0xe7c995);for(const x of [-13,13])S.ekle(cvG.tac,x,.1,0,4.6,2.2,5.5,0xe1bd86);}
  }
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2,r=140+(k%3)*60,s=.75+(k%4)*.12;bulutlar.push([Math.cos(a)*r,75+(k%4)*11,Math.sin(a)*r,s,s*.85,s,k]);}cvBulut=cok(cvBulutGeo(),new T.MeshBasicMaterial({vertexColors:true}),bulutlar);
  const m=new T.Mesh(S.geo(),cvMalz(5));m.frustumCulled=false;scene.add(m);
  for(const p of cvOdak)cvGolgeler.push([p.x-.5,.012,p.z+.4,p.yaricap*.8,1,p.yaricap*.55,-.4]);
}

{ // Yalnız yakın ağaç ve yapıların altında yumuşak temas gölgesi: tek çizim, gölge haritası yok.
  if(cvTema==='kiyi')for(const a of cvGolgeler)a[1]=.019; // Kumsal çıkıntısının .012 m yüzeyiyle aynı düzleme düşmesin.
  const d=tuvalDoku(64,64,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(36,66,61,.26)');r.addColorStop(.4,'rgba(36,66,61,.14)');r.addColorStop(1,'rgba(36,66,61,0)');g.fillStyle=r;g.fillRect(0,0,w,h);});
  const g=new T.PlaneGeometry(2,2);g.rotateX(-Math.PI/2);const m=new T.MeshBasicMaterial({map:d,transparent:true,depthWrite:false});const sh=cok(g,m,cvGolgeler);sh.renderOrder=1;
}
if(cvTema==='kar' && typeof HAVA === 'undefined' && !document.querySelector('script[src*="hava.js"]')) { // Sakin, küçük kar taneleri (yalnız hava.js yoksa; kar yağışı artık hava.js'te: iki kat kar olmasın)
  const p=new Float32Array(96*3);for(let i=0;i<96;i++){p[i*3]=(R()-.5)*76;p[i*3+1]=R()*20;p[i*3+2]=(R()-.5)*76;}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));
  const m=new T.ShaderMaterial({uniforms:{cvT:cvZ,cvP:cvOyuncu},transparent:true,depthWrite:false,
    vertexShader:'uniform float cvT;uniform vec2 cvP;varying float cvA;void main(){vec3 p=position;p.y=mod(p.y-cvT*.65,20.0)+.3;p.xz+=cvP+vec2(sin(cvT*.3+position.z)*.3,cos(cvT*.25+position.x)*.2);vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(34.0/max(2.0,-mv.z),1.0,2.6);cvA=(1.0-smoothstep(16.0,43.0,-mv.z))*.55;}',
    fragmentShader:'varying float cvA;void main(){float d=length(gl_PointCoord-vec2(.5))*2.0;gl_FragColor=vec4(vec3(1.0),cvA*(1.0-smoothstep(.2,1.0,d)));if(gl_FragColor.a<.008)discard;\n#include <colorspace_fragment>\n}' });
  const pts=new T.Points(g,m);pts.frustumCulled=false;scene.add(pts);
}

function cevreGuncelle(dt, t) {
  cvZ.value = t;
  cvOyuncu.value.set(P.x,P.z);
  if(cvTema==='kiyi'){cimDoku.offset.x=t*.0018;cimDoku.offset.y=t*.0008;if(cvSahilDoku)cvSahilDoku.offset.y=t*.012;}
  if(cvTel)cvTel.mesh.position.z=Math.sin(t*.2)*cvTel.g;if(cvKayan)cvKayan.rotation.y=t*.55;
  for(let i=0;i<cvDegirmen.length;i++)cvDegirmen[i].mesh.rotation.z=t*cvDegirmen[i].hiz;
  if(cvBulut)cvBulut.rotation.y = t * 0.004;if(cvKus)cvKus.rotation.y = t * 0.1;
  cvGunes.position.set(camera.position.x + cvGY.x * 640, cvGY.y * 640, camera.position.z + cvGY.z * 640);
  if (typeof cevreEkGuncelle === 'function') cevreEkGuncelle(dt, t);   // cevre_<ad>.js (seker, uzay, col) kendi hareketli süslerini burada günceller
}
