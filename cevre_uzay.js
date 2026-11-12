/* Ay Pisti pistinin çevresi (yalnız ?pist=uzay iken yüklenir, cevre.js'ten sonra).
   cevre.js ortak tabanı kurar (gök dokusu scene.background, sis scene.fog, ışıklar cvGokIsik + gunes, zemin `zemin` + `cimDoku`, güneş `cvGunes`);
   bu dosya onları kendi temasına göre değiştirir ve süslerini ekler. cevreEkGuncelle(dt, t) her karede çağrılır.
   Yeni üst düzey adlar `uz` ile başlar. Bölgeler (pist boyunca): 0 başlangıç tribünü · 1 krater ovası · 2 kristal vadisi · 3 ay üssü · 4 roket rampası · 5 uzaylı köyü. */
'use strict';

let uzKubbe = null, uzYildiz = null, uzDunya = null, uzHalkali = null, uzUydu = null, uzUfo = null, uzUfoYer = null;
const uzKayanAz = [0, 0], uzKayanN = [-1, -1], uzGezgin = [];
let uzBuyukKrater = null;
const uzKayan = [], uzV1 = new T.Vector3(), uzV2 = new T.Vector3(), uzYukari = new T.Vector3(0, 1, 0);
const uzBolge = i => { const f = i / N; return f < 0.07 || f > 0.95 ? 0 : f < 0.26 ? 1 : f < 0.44 ? 2 : f < 0.62 ? 3 : f < 0.80 ? 4 : 5; };

const uzYK = (() => {   // yuvarlak köşeli, tombul kutu: köşeler yumuşak yuvarlanır, normaller yumuşak (karton gibi düz levha değil)
  const g = new T.BoxGeometry(1, 1, 1, 3, 3, 3), p = g.attributes.position, n = g.attributes.normal, r = 0.17, v = new T.Vector3(), c = new T.Vector3(), u = a => Math.abs(a) < 0.3 ? Math.sign(a) * 0.4 : a;   // ara çizgiler köşeye yakın: az üçgenle yuvarlak kenar
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.set(u(v.x), u(v.y), u(v.z)); c.set(clamp(v.x, -0.5 + r, 0.5 - r), clamp(v.y, -0.5 + r, 0.5 - r), clamp(v.z, -0.5 + r, 0.5 - r)); v.sub(c).normalize(); n.setXYZ(i, v.x, v.y, v.z); p.setXYZ(i, c.x + v.x * r, c.y + v.y * r, c.z + v.z * r); }
  return g;
})();
function uzMalz(o) {   // seyirci malzemesi: ağır çekim ay zıplaması (cvK.y) ve el sallama (cvK.z); kopya rengi cvK.x = 1 olan parçaları boyar
  const m = new T.MeshLambertMaterial(Object.assign({ color: 0xffffff, vertexColors: true }, o || {}));
  m.onBeforeCompile = sh => {
    sh.uniforms.cvT = cvZ;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float cvT;\nattribute vec3 cvK;')
      .replace('#include <color_vertex>', 'vColor = color;\n#ifdef USE_INSTANCING_COLOR\nvColor *= mix(vec3(1.0), instanceColor.xyz, cvK.x);\n#endif')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat uzF = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 2.3;\nfloat uzH = abs(sin(cvT * 1.15 + uzF)) * smoothstep(-0.35, 0.35, sin(cvT * 0.33 + uzF * 0.37));\ntransformed.y += cvK.y * uzH * 0.85; transformed.x += cvK.z * sin(cvT * 3.2 + uzF) * 0.2; transformed.y += cvK.z * cos(cvT * 3.2 + uzF) * 0.06;\n#endif');
  };
  m.customProgramCacheKey = () => 'uzSeyirci';
  return m;
}

{
  // ───────── gök: lacivert-mor, bulutsulu, ışıl ışıl ─────────
  scene.background = tuvalDoku(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a0f3d'); gr.addColorStop(0.5, '#3b2c8c'); gr.addColorStop(1, '#8a66c8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.fog.color.setHex(0x8672c4); scene.fog.near = 430; scene.fog.far = 2100;
  cvGokIsik.color.setHex(0xf3f1ff); cvGokIsik.groundColor.setHex(0xa59ad2); cvGokIsik.intensity = 1.32;
  gunes.color.setHex(0xffffff); gunes.intensity = 1.5;
  cvGunes.scale.set(170, 170, 1);

  const kubbeDoku = tuvalDoku(512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#080c38'); gr.addColorStop(0.2, '#121a60'); gr.addColorStop(0.34, '#2a2380'); gr.addColorStop(0.44, '#4b35a0'); gr.addColorStop(0.485, '#8a62cc'); gr.addColorStop(0.498, '#c59ae6'); gr.addColorStop(0.505, '#b2add0'); gr.addColorStop(1, '#b2add0');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    const renk = ['255,90,200', '60,200,255', '150,100,255', '255,150,90', '90,255,200'];
    for (let k = 0; k < 34; k++) {
      const x = R() * w, y = h * (0.05 + R() * 0.36), r = 26 + R() * 64, c = renk[k % 5], a = 0.14 + R() * 0.2;
      for (const ox of [-w, 0, w]) {
        if (x + ox < -r * 2 || x + ox > w + r * 2) continue;
        g.save(); g.translate(x + ox, y); g.scale(1.9, 0.75);
        const rg = g.createRadialGradient(0, 0, 0, 0, 0, r); rg.addColorStop(0, 'rgba(' + c + ',' + a.toFixed(3) + ')'); rg.addColorStop(0.5, 'rgba(' + c + ',' + (a * 0.45).toFixed(3) + ')'); rg.addColorStop(1, 'rgba(' + c + ',0)');
        g.fillStyle = rg; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.restore();
      }
    }
    for (let k = 0; k < 520; k++) { R(); R(); R(); }   // (eski bulanık yıldız lekeleri kaldırıldı; yıldızlar yalnız keskin, kırpışan noktalar. Rastgele sıra korunur.)
    g.globalCompositeOperation = 'source-over';
  });
  kubbeDoku.wrapS = T.RepeatWrapping;
  uzKubbe = new T.Mesh(new T.SphereGeometry(830, 24, 16), new T.MeshBasicMaterial({ map: kubbeDoku, side: T.BackSide, fog: false, depthWrite: false }));
  uzKubbe.renderOrder = -10; uzKubbe.frustumCulled = false; scene.add(uzKubbe);

  { // kırpışan yıldızlar: tek nokta bulutu, kırpışma gölgelendiricide
    const say = 900, p = new Float32Array(say * 3), s = new Float32Array(say), f = new Float32Array(say), c = new Float32Array(say * 3), ton = [[1, 1, 1], [1, 0.95, 0.7], [0.75, 0.9, 1], [1, 0.8, 0.95], [0.8, 1, 0.9]];
    for (let i = 0; i < say; i++) {
      const y = 0.03 + Math.pow(R(), 1.5) * 0.97, a = R() * 6.2832, r = Math.sqrt(1 - y * y), q = ton[(R() * 5) | 0], b = R();
      p[i * 3] = Math.cos(a) * r * 800; p[i * 3 + 1] = y * 800; p[i * 3 + 2] = Math.sin(a) * r * 800;
      s[i] = b > 0.93 ? 7 + R() * 3 : 2.2 + R() * 3.2; f[i] = R() * 10; c[i * 3] = q[0]; c[i * 3 + 1] = q[1]; c[i * 3 + 2] = q[2];
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3)); g.setAttribute('uzS', new T.BufferAttribute(s, 1)); g.setAttribute('uzF', new T.BufferAttribute(f, 1)); g.setAttribute('uzC', new T.BufferAttribute(c, 3));
    const m = new T.ShaderMaterial({ uniforms: { cvT: cvZ }, transparent: true, depthWrite: false,
      vertexShader: 'attribute float uzS;attribute float uzF;attribute vec3 uzC;uniform float cvT;varying vec3 vC;varying float vA;void main(){vC=uzC;vA=0.62+0.38*sin(cvT*(1.0+fract(uzF)*2.6)+uzF*6.283);vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=uzS*1.6;}',
      fragmentShader: 'varying vec3 vC;varying float vA;void main(){vec2 q=abs(gl_PointCoord-vec2(.5))*2.0;float d=length(q);float a=(1.0-smoothstep(.12,.75,d))+0.6*(1.0-smoothstep(0.0,.16,min(q.x,q.y)))*(1.0-smoothstep(.3,1.0,max(q.x,q.y)));a=clamp(a,0.0,1.0)*vA;if(a<.01)discard;gl_FragColor=vec4(vC,a);\n#include <colorspace_fragment>\n}' });
    uzYildiz = new T.Points(g, m); uzYildiz.frustumCulled = false; uzYildiz.renderOrder = -9; scene.add(uzYildiz);
  }

  // ───────── gezegenler ─────────
  const buyukKure = new T.SphereGeometry(1, 22, 14), halka = new T.TorusGeometry(1, 0.1, 4, 36), kusak = new T.TorusGeometry(1, 0.05, 4, 22);
  const dunyaDoku = tuvalDoku(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3f9bf2'); gr.addColorStop(0.5, '#2278e6'); gr.addColorStop(1, '#3f9bf2'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const leke = (x, y, rx, ry, a) => { for (const ox of [-w, 0, w]) { g.beginPath(); g.ellipse(x + ox, y, rx, ry, a, 0, 7); g.fill(); } };
    for (let k = 0; k < 6; k++) { const cx = (k + R() * 0.6) * w / 6, cy = h * (0.25 + R() * 0.5); for (let j = 0; j < 6; j++) { g.fillStyle = ['#58c96a', '#7ddc6c', '#49b862', '#a6e07a', '#e8d58a'][(j + k) % 5]; leke(cx + (R() - 0.5) * 50, cy + (R() - 0.5) * 44, 8 + R() * 15, 6 + R() * 12, R() * 3); } }
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14); for (let k = 0; k < 16; k++) { leke(R() * w, 14, 20 + R() * 20, 7, 0); leke(R() * w, h - 14, 20 + R() * 20, 7, 0); }
    g.fillStyle = 'rgba(255,255,255,.78)'; for (let k = 0; k < 30; k++) leke(R() * w, h * (0.15 + R() * 0.7), 14 + R() * 30, 3 + R() * 5, (R() - 0.5) * 0.5);
  });
  dunyaDoku.wrapS = T.RepeatWrapping;
  uzDunya = new T.Mesh(new T.SphereGeometry(1, 36, 22), new T.MeshLambertMaterial({ map: dunyaDoku, emissive: 0xffffff, emissiveMap: dunyaDoku, emissiveIntensity: 0.22, fog: false }));
  uzDunya.scale.setScalar(58); uzDunya.position.set(470, 150, 270); uzDunya.rotation.z = 0.35; scene.add(uzDunya);
  { // Dünya'nın çevresinde yumuşak mavi hale (küçük, uzak tek sprite)
    const hd = tuvalDoku(128, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(150,215,255,.75)'); r.addColorStop(0.35, 'rgba(120,190,255,.32)'); r.addColorStop(1, 'rgba(120,190,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    const sp = new T.Sprite(new T.SpriteMaterial({ map: hd, transparent: true, depthWrite: false, fog: false })); sp.scale.set(170, 170, 1); sp.position.copy(uzDunya.position); scene.add(sp);
  }
  { // en uzak katman: sivri ay sıradağları, puslu mor siluet (tek çizim)
    const B = cvYapi(); B.yer(0, -65, 0);
    for (let k = 0; k < 44; k++) { const a = k / 44 * 6.2832, rr = 600 + (k % 3) * 22, h = 46 + ((k * 7) % 5) * 15 + (k % 2) * 10, w = 50 + ((k * 3) % 4) * 14; B.ekle(cvG.koni, Math.cos(a) * rr, h / 2 - 2, Math.sin(a) * rr, w, h, w, k % 2 ? 0x8f79c6 : 0x7f69ba, 0, k * 1.7); }
    const m = new T.Mesh(B.geo(), new T.MeshBasicMaterial({ vertexColors: true, fog: false })); m.frustumCulled = false; scene.add(m);
  }
  {
    const H = cvYapi(); H.yer(0, 0, 0);
    H.ekle(buyukKure, 0, 0, 0, 1, 1, 1, 0xffc463);
    for (const b of [[0.55, 0xffa94d], [0.2, 0xffdf8e], [-0.25, 0xf59a4a], [-0.6, 0xffd27a]]) { const r = Math.sqrt(1 - b[0] * b[0]); H.ekle(kusak, 0, b[0], 0, r * 0.985, r * 0.985, 2.4, b[1], Math.PI / 2); }
    H.ekle(halka, 0, 0, 0, 1.75, 1.75, 0.25, 0xffb3de, Math.PI / 2); H.ekle(halka, 0, 0, 0, 2.15, 2.15, 0.2, 0xcfe6ff, Math.PI / 2);
    uzHalkali = new T.Mesh(H.geo(), cvMalz(0, { fog: false, emissive: 0x3a2a40 })); uzHalkali.scale.setScalar(40); uzHalkali.position.set(-260, 185, -520); uzHalkali.rotation.set(0.42, 0, 0.3); scene.add(uzHalkali);
    const D = cvYapi(); D.yer(0, 0, 0);
    const gezegen = (x, y, z, r, renk, kusaklar, ay) => {
      D.ekle(buyukKure, x, y, z, r, r, r, renk);
      for (const b of kusaklar) { const q = Math.sqrt(1 - b[0] * b[0]) * r * 0.985; D.ekle(kusak, x, y + b[0] * r, z, q, q, r * 2.4, b[1], Math.PI / 2); }
      if (ay) D.ekle(cvG.tac, x + r * 1.7, y + r * 0.6, z + r * 0.4, r * 0.24, r * 0.24, r * 0.24, ay);
    };
    gezegen(-520, 130, 120, 30, 0xff8fc7, [[0.4, 0xffc2e2], [-0.3, 0xf06fae]], 0xfff0a8);
    gezegen(150, 260, -560, 24, 0x62e0c8, [[0.1, 0xa8f5e6], [-0.5, 0x3fc4ae]], 0);
    gezegen(560, 210, -260, 17, 0xb58cff, [[0.3, 0xd9c2ff]], 0xffffff);
    gezegen(-120, 300, 480, 20, 0x7fb6ff, [[0.5, 0xc6e0ff], [-0.2, 0x5a96ee]], 0xffd0e8);
    gezegen(-430, 250, -250, 12, 0xffe066, [[0, 0xfff3b0]], 0);
    const dm = new T.Mesh(D.geo(), cvMalz(0, { fog: false, emissive: 0x2c2440 })); dm.frustumCulled = false; scene.add(dm);
  }
  { // yavaş dönen uydular (tek geometri, merkez çevresinde döner)
    const U = cvYapi();
    for (let k = 0; k < 3; k++) {
      const a = k * 2.094 + 0.5; U.yer(Math.cos(a) * (190 + k * 25), Math.sin(a) * (190 + k * 25), a * 1.3, 3.2);
      const y = 20 + k * 3;
      U.ekle(cvG.kutu, 0, y, 0, 1.2, 1.2, 1.6, 0xf2c14e); U.ekle(cvG.kutu, 0, y, 0, 6.4, 0.08, 1.1, 0x4a84f0); U.ekle(cvG.kutu, 0, y, 0, 1.6, 0.14, 0.2, 0xe8ecff);
      U.ekle(cvG.yarimK, 0, y + 0.95, 0, 0.7, 0.35, 0.7, 0xf4f6ff, Math.PI); U.ekle(cvG.kureK, 0, y + 0.9, 0, 0.16, 0.16, 0.16, 0xff5a6e);
    }
    uzUydu = new T.Mesh(U.geo(), cvMalz(0, { fog: false, side: T.DoubleSide })); uzUydu.position.set(0, 0, -65); uzUydu.frustumCulled = false; scene.add(uzUydu);
  }
  { // kayan yıldızlar: iki ince koni, ucu sönük
    const g = new T.ConeGeometry(1, 1, 6, 1, true), p = g.attributes.position, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const v = p.getY(i) < 0 ? 1 : 0; c[i * 3] = v; c[i * 3 + 1] = v; c[i * 3 + 2] = v * 0.92; }
    g.setAttribute('color', new T.BufferAttribute(c, 3));
    const m = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, fog: false, side: T.DoubleSide });
    for (let k = 0; k < 2; k++) { const s = new T.Mesh(g, m); s.scale.set(3.2, 95, 3.2); s.visible = false; s.frustumCulled = false; scene.add(s); uzKayan.push(s); }
  }

  // ───────── ay toprağı ─────────
  const ayDoku = tuvalDoku(512, 512, (g, w, h) => {
    g.fillStyle = '#bcb8d6'; g.fillRect(0, 0, w, h);
    const leke = (x, y, r) => { for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) { if (x + ox < -r || x + ox > w + r || y + oy < -r || y + oy > h + r) continue; g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill(); } };
    for (let i = 0; i < 44; i++) { g.fillStyle = ['#cdc9e4', '#aeaaca', '#d4d0ea', '#a9a4c8', '#c4bfe0'][i % 5]; g.globalAlpha = 0.24; const x = R() * w, y = R() * h, r = 26 + R() * 54; leke(x, y, r); leke(x + r * 0.5, y + r * 0.3, r * 0.7); }
    for (let i = 0; i < 46; i++) {   // küçük kraterler: koyu çukur + açık kenar
      const x = R() * w, y = R() * h, r = 4 + R() * 11;
      g.globalAlpha = 0.5; g.fillStyle = '#e2dff4'; leke(x, y, r * 1.18); g.globalAlpha = 0.55; g.fillStyle = '#9f9ac0'; leke(x, y, r); g.globalAlpha = 0.5; g.fillStyle = '#b7b2d3'; leke(x + r * 0.22, y + r * 0.22, r * 0.72);
    }
    for (let i = 0; i < 1500; i++) { g.fillStyle = ['#d8d5ec', '#a09bc0', '#e4e1f5', '#9892ba'][i % 4]; g.globalAlpha = 0.5; g.fillRect(R() * w, R() * h, 1.5 + R() * 1.5, 1.5 + R() * 1.5); }
    g.globalAlpha = 1;
  }, true); ayDoku.repeat.set(40, 40);
  zemin.material.map = ayDoku; zemin.material.needsUpdate = true;
  { const p = zemin.geometry.attributes.position, c = zemin.geometry.attributes.color; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), v = 0.92 + 0.08 * Math.sin(x * 0.021 + 1) * Math.cos(y * 0.017) + 0.05 * Math.sin(x * 0.05 + y * 0.043); c.setXYZ(i, v * 0.98, v * 0.97, v); } c.needsUpdate = true; }

  // ───────── süsler ─────────
  const S = cvYapi(), E = cvYapi(), golge = [], hale = [], astro = [], uzayli = [], krater = [];
  const GRI = 0x8d89ad, ACIK = 0xdfe3f2, BEYAZ = 0xf6f7ff, MAVI = 0x3b6fe0, CANLI = [0xff5a6e, 0xffb23c, 0xffe14d, 0x5fe38a, 0x4fd6ff, 0xb58cff, 0xff8fd0];
  const KRISTAL = [0x5ff0ff, 0xff7ad9, 0xb58cff, 0x8fd8ff, 0xff9be6];   // uyumlu üç ton: camgöbeği, pembe, lila
  const yerVar = (x, z, r) => yakin(x, z) > YARI + 3 + r && cvBos(x, z, r);
  const koy = (f, yan, uz, r) => {   // pist kenarında boş yer arar; bulursa ayırır
    for (const q of [[0, yan, 0], [0, yan, 6], [0.012, yan, 3], [-0.012, yan, 3], [0, -yan, 0], [0, -yan, 6], [0.02, -yan, 10], [0.02, yan, 12]]) {
      const p = cvKenar(cvI(f + q[0]), q[1], YARI + uz + q[2]), x = p.x, z = p.z, ry = p.ry;
      if (yerVar(x, z, r)) { cvYasak.push([x, z, r]); return { x, z, ry }; }
    }
    return null;
  };
  const yer2 = (x, z, ry, s) => { S.yer(x, z, ry, s); E.yer(x, z, ry, s); };
  const iz = (lx, lz, rx, rz) => { const v = S.dunya(lx, lz); golge.push([v.x - 0.4, 0.02, v.z + 0.35, rx, 1, rz || rx, 0]); };
  const isik = (lx, lz, r, renk) => { const v = S.dunya(lx, lz); hale.push([v.x, 0.03, v.z, r, 1, r, 0, renk]); };

  const uzYuvar = new T.SphereGeometry(1, 14, 8);   // düzgün yuvarlak pencereler için
  const kubbeEv = (p, r, renk, kapi) => {
    yer2(p.x, p.z, p.ry);
    S.ekle(cvG.sil, 0, 0.3, 0, r * 1.05, 0.6, r * 1.05, GRI); S.ekle(cvG.yarim, 0, 0.55, 0, r, r * 0.9, r, renk);
    S.ekle(cvG.sil, 0, 0.55 + r * 0.9, 0, r * 0.14, 0.4, r * 0.14, GRI); E.ekle(cvG.kureK, 0, 0.95 + r * 0.9, 0, r * 0.11, r * 0.11, r * 0.11, 0xff6a7c, 0, 0, 0, 0, 0, 1);
    S.ekle(uzYK, 0, 1.05, r * 0.92, 1.7, 2.0, 1.0, 0x7d79a3); E.ekle(uzYK, 0, 0.95, r * 0.92 + 0.51, 1.1, 1.6, 0.05, kapi);
    for (const a of [-2.3, -1.45, -0.75, 0.75, 1.45, 2.3]) { const e = 0.5, x = Math.sin(a) * Math.cos(e) * r, z = Math.cos(a) * Math.cos(e) * r, y = 0.55 + Math.sin(e) * r * 0.9; E.ekle(uzYuvar, x * 0.97, 0.55 + (y - 0.55) * 0.97, z * 0.97, r * 0.16, r * 0.16, r * 0.16, 0xffe27a); }
    iz(0, 0, r * 1.45, r * 1.25); isik(0, r + 1.6, 2.4, kapi);
  };
  const anten = (p, s) => {
    yer2(p.x, p.z, p.ry, s);
    S.ekle(cvG.sil, 0, 0.2, 0, 0.9, 0.4, 0.9, GRI); S.ekle(cvG.sil, 0, 1.6, 0, 0.16, 2.8, 0.16, ACIK);
    S.ekle(cvG.yarim, 0, 4.0, 0.25, 1.8, 0.7, 1.8, BEYAZ, Math.PI + 0.75); S.ekle(cvG.sil, 0, 4.0, 0.25, 0.05, 1.5, 0.05, GRI, 0.75);
    E.ekle(cvG.kureK, 0, 4.0 + Math.cos(0.75) * 0.8, 0.25 + Math.sin(0.75) * 0.8, 0.17, 0.17, 0.17, 0xff5a6e, 0, 0, 0, 0, 0, 1);
    iz(0, 0, 1.6 * (s || 1));
  };
  const inisAraci = p => {
    yer2(p.x, p.z, p.ry, 1.25);
    S.ekle(cvG.sil, 0, 1.75, 0, 1.5, 1.3, 1.5, 0xf2c14e); S.ekle(cvG.sil, 0, 2.85, 0, 1.0, 0.9, 1.0, ACIK); S.ekle(cvG.yarimK, 0, 3.3, 0, 1, 0.6, 1, ACIK); S.ekle(cvG.koni, 0, 0.8, 0, 0.7, 0.8, 0.7, 0x55516f);
    E.ekle(cvG.kureK, 0, 2.85, 0.95, 0.33, 0.33, 0.15, 0x7fe9ff); E.ekle(cvG.kureK, 0, 3.95, 0, 0.13, 0.13, 0.13, 0xff5a6e, 0, 0, 0, 0, 0, 1);
    for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, sx = Math.sin(a), cz = Math.cos(a); S.ekle(cvG.kutu, sx * 1.9, 0.95, cz * 1.9, 0.16, 2.2, 0.16, 0xb9bdd4, -0.5, a); S.ekle(cvG.sil, sx * 2.45, 0.08, cz * 2.45, 0.45, 0.16, 0.45, 0xb9bdd4); }
    S.ekle(cvG.kutu, 0, 0.9, 1.75, 0.6, 1.8, 0.08, 0xb9bdd4, -0.35);
    iz(0, 0, 4.2);
  };
  const ayArabasi = p => {
    yer2(p.x, p.z, p.ry + 0.9, 1.15);
    S.ekle(uzYK, 0, 1.0, 0, 1.8, 0.5, 3.0, BEYAZ); S.ekle(uzYK, 0, 1.3, 0.2, 1.5, 0.12, 2.2, 0xffb23c);
    for (const x of [-1.1, 1.1]) for (const z of [-1.1, 0, 1.1]) S.ekle(cvG.sil, x, 0.45, z, 0.45, 0.35, 0.45, 0x4b4868, 0, 0, Math.PI / 2);
    S.ekle(uzYK, 0, 1.85, -0.6, 2.4, 0.08, 1.5, MAVI, 0.25); S.ekle(cvG.sil, 0.5, 1.95, 1.1, 0.07, 1.4, 0.07, ACIK); S.ekle(uzYK, 0.5, 2.7, 1.1, 0.7, 0.36, 0.4, BEYAZ);
    E.ekle(cvG.kureK, 0.33, 2.7, 1.32, 0.12, 0.12, 0.06, 0x7fe9ff); E.ekle(cvG.kureK, 0.67, 2.7, 1.32, 0.12, 0.12, 0.06, 0x7fe9ff);
    S.ekle(cvG.yarimK, -0.55, 1.75, 1.0, 0.5, 0.25, 0.5, BEYAZ, Math.PI + 0.5);
    iz(0, 0, 2.6, 3.2);
  };
  const bayrak = p => {
    yer2(p.x, p.z, p.ry);
    S.ekle(cvG.sil, 0, 2.3, 0, 0.07, 4.6, 0.07, BEYAZ); S.ekle(cvG.kutu, 0.95, 3.9, 0, 1.8, 1.1, 0.07, 0xff5a6e); E.ekle(cvG.okt, 0.95, 3.9, 0, 0.36, 0.36, 0.1, 0xffe14d); S.ekle(cvG.kureK, 0, 4.65, 0, 0.14, 0.14, 0.14, 0xffe14d);
    iz(0, 0, 0.8);
  };
  const roket = (p, s, renk, kule) => {
    yer2(p.x, p.z, p.ry, s);
    S.ekle(cvG.sil, 0, 0.25, 0, 5.2, 0.5, 5.2, GRI); S.ekle(cvG.sil, 0, 0.52, 0, 4.2, 0.06, 4.2, 0xa9a5c6);
    S.ekle(cvG.govdeK, 0, 5.6, 0, 1.5, 8, 1.5, BEYAZ); S.ekle(cvG.koni, 0, 11.1, 0, 1.22, 3, 1.22, renk);
    S.ekle(cvG.sil, 0, 7.6, 0, 1.36, 0.5, 1.36, renk); S.ekle(cvG.sil, 0, 3.2, 0, 1.5, 0.5, 1.5, 0x4aa3ff); S.ekle(cvG.koni, 0, 1.15, 0, 1.1, 1.3, 1.1, 0x55516f);
    for (const a of [0.5, 2.6, 4.7]) { S.ekle(uzYK, Math.sin(a) * 1.75, 2.3, Math.cos(a) * 1.75, 0.22, 1.9, 1.0, renk, 0.28, a); S.ekle(uzYK, Math.sin(a) * 2.15, 1.75, Math.cos(a) * 2.15, 0.22, 1.1, 0.6, renk, 0.28, a); }
    E.ekle(cvG.kureK, 0, 6.1, 1.32, 0.48, 0.48, 0.2, 0x7fe9ff); E.ekle(cvG.kureK, 0, 4.6, 1.42, 0.3, 0.3, 0.14, 0x7fe9ff);
    if (kule) {
      S.ekle(uzYK, -3.7, 5.5, 0, 0.9, 10, 0.9, 0xff9a3c); for (const y of [2.5, 5, 7.5, 10]) S.ekle(uzYK, -3.7, y, 0, 1.15, 0.25, 1.15, BEYAZ);
      S.ekle(uzYK, -2.4, 8.3, 0, 2.2, 0.3, 0.45, 0xff9a3c); S.ekle(uzYK, -2.4, 4.2, 0, 2.2, 0.3, 0.45, 0xff9a3c); E.ekle(cvG.kureK, -3.7, 10.85, 0, 0.36, 0.36, 0.36, 0xff5a6e, 0, 0, 0, 0, 0, 1);
      for (const a of [1.2, 2.2, 3.4, 4.4, 5.6]) E.ekle(cvG.kureK, Math.sin(a) * 4.7, 0.6, Math.cos(a) * 4.7, 0.22, 0.22, 0.22, 0xffe14d, 0, 0, 0, 0, 0, 1);
    }
    E.ekle(cvG.koni, 0, 0.62, 0, 0.62, 0.7, 0.62, 0xffb23c, Math.PI); E.ekle(cvG.kureK, 0, 0.72, 0, 0.42, 0.3, 0.42, 0xfff0a0);   // motor altında sıcak parıltı
    for (let k = 0; k < 7; k++) { const a = k * 0.9 + 0.3, d = 1.5 + (k % 3) * 0.55, b = 0.55 + (k % 3) * 0.2; S.ekle(cvG.kure, Math.sin(a) * d, 0.62 + b * 0.55, Math.cos(a) * d, b, b * 0.8, b, k % 2 ? 0xf6f7ff : 0xdfe3f2); }   // duman topları
    iz(0, 0, 6.5 * s); isik(0, 0, 5.4, 0xffc070);
  };
  const tank = p => { yer2(p.x, p.z, p.ry); S.ekle(cvG.tac, 0, 1.9, 0, 1.7, 1.7, 1.7, BEYAZ); S.ekle(cvG.sil, 0, 1.9, 0, 1.73, 0.4, 1.73, 0x4aa3ff); for (const a of [0.4, 2.5, 4.6]) S.ekle(cvG.kutu, Math.sin(a) * 1.2, 0.5, Math.cos(a) * 1.2, 0.18, 1.0, 0.18, GRI); iz(0, 0, 2.3); };
  const panel = p => {
    yer2(p.x, p.z, p.ry);
    for (const x of [-4, 0, 4]) { S.ekle(cvG.sil, x, 1, 0, 0.12, 2, 0.12, 0xb9bdd4); S.ekle(cvG.kutu, x, 2.2, 0, 3.5, 0.1, 2.1, MAVI, 0.6); S.ekle(cvG.kutu, x, 2.23, 0.03, 3.6, 0.06, 0.09, BEYAZ, 0.6); S.ekle(cvG.kutu, x, 2.23, 0.03, 0.09, 0.06, 2.15, BEYAZ, 0.6); }
    iz(0, 0, 6.5, 2);
  };
  const direk = (x, z, renk) => {
    yer2(x, z, 0);
    S.ekle(cvG.sil5, 0, 2.1, 0, 0.1, 4.2, 0.1, ACIK); S.ekle(cvG.sil, 0, 0.15, 0, 0.35, 0.3, 0.35, GRI); E.ekle(cvG.tac, 0, 4.4, 0, 0.42, 0.42, 0.42, renk, 0, 0, 0, 0, 0, 0.5); S.ekle(cvG.sil, 0, 4.05, 0, 0.3, 0.12, 0.3, GRI);
    hale.push([x, 0.03, z, 2.6, 1, 2.6, 0, renk]);
  };
  const kristal = (x, z, s) => {
    S.yer(x, z, R() * 6);
    const renk = KRISTAL[(R() * 5) | 0], say = 3 + ((R() * 3) | 0);
    for (let k = 0; k < say; k++) { const a = k * 2.2 + R(), d = k ? 0.5 + R() * 0.5 : 0, h = (k ? 0.9 + R() * 1.1 : 2.1 + R() * 0.9) * s, w = (0.3 + R() * 0.2) * s; S.ekle(cvG.okt, Math.cos(a) * d * s, h * 0.42, Math.sin(a) * d * s, w, h * 0.6, w, k % 2 ? renk : KRISTAL[(R() * 5) | 0], (R() - 0.5) * 0.5, R() * 3, (R() - 0.5) * 0.5); }
    hale.push([x, 0.03, z, 3.1 * s, 1, 3.1 * s, 0, renk]);
  };
  const uzayliEvi = (p, r, renk) => {   // saplı, yuvarlak uzaylı evi
    yer2(p.x, p.z, p.ry);
    S.ekle(cvG.govdeK, 0, 1.1, 0, r * 0.42, 2.2, r * 0.42, 0xe9e4ff); S.ekle(cvG.tac, 0, 2.6 + r * 0.45, 0, r, r * 0.62, r, renk); S.ekle(cvG.sil, 0, 2.6 + r * 0.3, 0, r * 1.12, 0.22, r * 1.12, BEYAZ);
    E.ekle(cvG.kutu, 0, 0.8, r * 0.4, 0.8, 1.3, 0.12, 0xffe27a);
    for (let k = 0; k < 6; k++) { const a = k * 1.047 + 0.5; E.ekle(cvG.kureK, Math.sin(a) * r * 0.86, 2.6 + r * 0.62, Math.cos(a) * r * 0.86, r * 0.14, r * 0.14, r * 0.14, 0xfff2a0, 0, 0, 0, 0, 0, 1); }
    S.ekle(cvG.sil5, 0, 2.6 + r * 1.2, 0, 0.05, r * 0.5, 0.05, BEYAZ); E.ekle(cvG.kureK, 0, 2.6 + r * 1.5, 0, 0.22, 0.22, 0.22, 0xff8fd0, 0, 0, 0, 0, 0, 1);
    iz(0, 0, r * 1.3); isik(0, r * 0.4 + 1.5, 2, renk);
  };
  const ufoGovde = (Y, y) => {
    Y.ekle(cvG.tac, 0, y, 0, 3.2, 0.62, 3.2, 0xd9def2); Y.ekle(cvG.sil, 0, y - 0.05, 0, 3.3, 0.16, 3.3, 0xb58cff); Y.ekle(cvG.yarim, 0, y + 0.3, 0, 1.5, 1.35, 1.5, 0x7fe9ff); Y.ekle(cvG.sil, 0, y - 0.55, 0, 1.2, 0.3, 1.2, 0x8d89ad);
    for (let k = 0; k < 8; k++) { const a = k * 0.7854; Y.ekle(cvG.kureK, Math.sin(a) * 2.5, y - 0.2, Math.cos(a) * 2.5, 0.3, 0.3, 0.3, CANLI[k % 7]); }
  };
  const tribun = p => {
    yer2(p.x, p.z, p.ry);
    for (let k = 0; k < 3; k++) {
      S.ekle(uzYK, 0, 0.3 * (k + 1), -k * 1.5, 13, 0.6 * (k + 1), 1.5, k % 2 ? 0xa9a5c6 : 0x8d89ad); E.ekle(uzYK, 0, 0.6 * (k + 1) - 0.1, -k * 1.5 + 0.76, 13, 0.14, 0.04, CANLI[k * 2 + 1]);
      for (let x = -5.6; x <= 5.7; x += 1.4) { const v = S.dunya(x + (R() - 0.5) * 0.3, -k * 1.5), s = 0.74 + R() * 0.12; astro.push([v.x, 0.6 * (k + 1), v.z, s, s, s, p.ry + (R() - 0.5) * 0.5, CANLI[(R() * 7) | 0]]); }
    }
    S.ekle(uzYK, 0, 2.6, -3.1, 13, 5.2, 0.3, 0x5b56a8); for (let k = 0; k < 7; k++) E.ekle(cvG.okt, -5.4 + k * 1.8, 4.3, -2.9, 0.5, 0.5, 0.1, CANLI[k], 0, 0, 0, 0, 0, 1);
    for (const x of [-6.6, 6.6]) { S.ekle(cvG.sil5, x, 3.2, -3.1, 0.12, 6.4, 0.12, BEYAZ); E.ekle(cvG.tac, x, 6.6, -3.1, 0.4, 0.4, 0.4, 0x4fd6ff); }
    iz(0, -1.5, 8, 4);
  };
  const tabela = (i, yon) => {   // viraj oku: yazısız, üç ışıklı ok
    const yan = -yon, j = ((i - 18) % N + N) % N;
    for (const uz of [5.4, 7.5, 10]) {
      const k = (i + 5) % N, x = PX[k] - TZ[k] * (YARI + uz) * yan, z = PZ[k] + TX[k] * (YARI + uz) * yan;
      if (!yerVar(x, z, 1.6)) continue;
      cvYasak.push([x, z, 2.2]); yer2(x, z, Math.atan2(-TX[j], -TZ[j]));
      for (const px of [-1.45, 1.45]) S.ekle(cvG.sil5, px, 1.0, 0, 0.1, 2.0, 0.1, ACIK);
      S.ekle(uzYK, 0, 2.75, 0, 3.9, 1.7, 0.16, 0x2b2f78); S.ekle(uzYK, 0, 2.75, -0.03, 4.1, 1.9, 0.12, BEYAZ);
      for (let c = -1; c <= 1; c++) for (const u of [-1, 1]) E.ekle(cvG.kutu, c * 1.15 + yon * 0.1, 2.75 + u * 0.3, 0.1, 0.92, 0.24, 0.06, c === 0 ? 0xffe14d : 0x7fe9ff, 0, 0, -u * yon * 0.785);
      iz(0, 0, 2.2, 0.7); return;
    }
  };

  // ── viraj okları ──
  { let son = -99; for (let i = 0; i < N; i++) { let k = 0; for (let q = -4; q <= 4; q++) k += KAP[(i + q + N) % N]; k /= 9; let tepe = Math.abs(k) > 0.0115; for (let q = -14; q <= 14 && tepe; q++) { let m = 0; for (let w = -4; w <= 4; w++) m += KAP[(i + q + w + 2 * N) % N]; if (Math.abs(m / 9) > Math.abs(k) + 1e-9) tepe = false; } if (tepe && i - son > 45) { tabela(i, k > 0 ? 1 : -1); son = i; } } }

  // ── 0: başlangıç ──
  let p;
  if ((p = koy(0.012, 1, 9, 7.5))) tribun(p);
  if ((p = koy(0.012, -1, 9, 7.5))) tribun(p);
  if ((p = koy(0.045, -1, 7, 1.5))) bayrak(p);
  if ((p = koy(0.975, 1, 17, 5))) inisAraci(p);
  if ((p = koy(0.965, -1, 12, 3))) anten(p, 1.1);
  // ── 1: krater ovası ──
  if ((p = koy(0.12, 1, 11, 3.6))) ayArabasi(p);
  if ((p = koy(0.2, -1, 13, 3))) anten(p, 1.3);
  if ((p = koy(0.16, -1, 9, 1.5))) bayrak(p);
  for (const q of [[0.09, 1, 22, 9], [0.15, -1, 24, 11], [0.22, 1, 20, 8], [0.25, -1, 30, 10], [0.18, 1, 34, 12]]) {
    if (!(p = koy(q[0], q[1], q[2], q[3] * 0.75))) continue; cvYasak.pop();
    krater.push([p.x, 0.012, p.z, q[3], 1, q[3], R() * 6]); S.yer(p.x, p.z, R() * 6); S.ekle(halka, 0, 0.05, 0, q[3] * 0.8, q[3] * 0.8, 3.2, 0xcfcbe6, Math.PI / 2);
  }
  // ── 2: kristal vadisi ──
  for (let k = 0; k < 18; k++) { const f = 0.265 + R() * 0.17, c = cvKenar(cvI(f), k % 2 ? 1 : -1, YARI + 5 + R() * R() * 30), x = c.x, z = c.z, s = 0.8 + R() * 1.0; if (yerVar(x, z, 1.6 * s)) { cvYasak.push([x, z, 1.5 * s]); kristal(x, z, s); } }
  for (const f of [0.07, 0.52, 0.71, 0.9, 0.99]) { const c = cvKenar(cvI(f), 1, YARI + 9 + R() * 8), x = c.x, z = c.z; if (yerVar(x, z, 2)) { cvYasak.push([x, z, 2]); kristal(x, z, 1.1); } }
  // ── 3: ay üssü ──
  { const ren = [BEYAZ, 0xe6ecff, BEYAZ, 0xffeede, BEYAZ], kap = [0x4fd6ff, 0xffb23c, 0x5fe38a, 0xff8fd0, 0xb58cff]; let k = 0;
    for (const q of [[0.47, 1, 12, 4.6], [0.5, -1, 11, 3.8], [0.535, 1, 13, 5.2], [0.565, -1, 12, 4.2], [0.6, 1, 11, 3.6]]) { if ((p = koy(q[0], q[1], q[2], q[3] + 1.5))) kubbeEv(p, q[3], ren[k], kap[k]); k++; } }
  if ((p = koy(0.485, -1, 22, 6.5))) panel(p);
  if ((p = koy(0.55, 1, 27, 6.5))) panel(p);
  if ((p = koy(0.515, 1, 25, 3))) anten(p, 1.6);
  if ((p = koy(0.585, -1, 22, 3))) anten(p, 1.2);
  // ── 4: roket rampası ──
  if ((p = koy(0.7, 1, 19, 8))) roket(p, 1.25, 0xff5a5a, true);
  if ((p = koy(0.655, 1, 12, 2.6))) tank(p);
  if ((p = koy(0.67, 1, 9, 2.6))) tank(p);
  if ((p = koy(0.76, -1, 14, 5))) roket(p, 0.7, 0xffb23c, false);
  if ((p = koy(0.735, -1, 10, 3))) anten(p, 1);
  if ((p = koy(0.64, -1, 14, 6.5))) panel(p);
  // ── 5: uzaylı köyü ──
  { const ren = [0x62e0c8, 0xff8fd0, 0xb6f26a, 0x7fb6ff, 0xffb23c, 0xb58cff, 0x62e0c8]; let k = 0;
    for (const q of [[0.815, 1, 10, 2.6], [0.835, -1, 9, 2.2], [0.855, 1, 12, 3.2], [0.875, -1, 11, 2.6], [0.895, 1, 9, 2.2], [0.915, -1, 12, 3], [0.935, 1, 11, 2.4]]) { if ((p = koy(q[0], q[1], q[2], q[3] + 1.2))) uzayliEvi(p, q[3], ren[k]); k++; } }
  if ((p = koy(0.885, 1, 21, 5))) { yer2(p.x, p.z, p.ry); ufoGovde(S, 1.6); for (const a of [0.5, 2.6, 4.7]) S.ekle(cvG.kutu, Math.sin(a) * 1.6, 0.6, Math.cos(a) * 1.6, 0.12, 1.3, 0.12, GRI, -0.4, a); iz(0, 0, 4); isik(0, 0, 4.5, 0x7dffb0); }

  // ── manzara anları: ay üssü merkezi (büyük kubbe, tüneller, kule) ve içinde kristaller ışıldayan büyük krater ──
  for (const q of [[0.53, -1], [0.56, -1], [0.5, 1], [0.58, 1], [0.47, -1], [0.6, -1]]) {
    if (!(p = koy(q[0], q[1], 34, 15))) continue;
    yer2(p.x, p.z, p.ry);
    S.ekle(cvG.sil, 0, 0.4, 0, 9.4, 0.8, 9.4, GRI); S.ekle(cvG.yarim, 0, 0.75, 0, 8.6, 7.6, 8.6, BEYAZ); S.ekle(cvG.sil, 0, 2.2, 0, 8.45, 0.7, 8.45, 0x4aa3ff); S.ekle(cvG.sil, 0, 8.5, 0, 1.3, 0.8, 1.3, GRI);
    S.ekle(cvG.sil5, 0, 12.4, 0, 0.16, 7.4, 0.16, ACIK); for (const y of [10.6, 12.6, 14.4]) S.ekle(cvG.sil, 0, y, 0, 0.6, 0.12, 0.6, ACIK); E.ekle(cvG.kureK, 0, 16.3, 0, 0.5, 0.5, 0.5, 0xff5a6e, 0, 0, 0, 0, 0, 1);
    S.ekle(cvG.yarim, 1.6, 10.4, 0, 2.2, 0.85, 2.2, BEYAZ, Math.PI + 0.9, 0, 0);
    for (let k = 0; k < 9; k++) { const a = -1.4 + k * 0.35, e = 0.42; E.ekle(uzYuvar, Math.sin(a) * Math.cos(e) * 8.45, 0.75 + Math.sin(e) * 7.5, Math.cos(a) * Math.cos(e) * 8.45, 0.95, 0.95, 0.95, 0xffe27a); }
    S.ekle(uzYK, 0, 1.7, 8.6, 3.2, 3.4, 1.6, 0x7d79a3); E.ekle(uzYK, 0, 1.55, 9.42, 2.2, 2.8, 0.06, 0x4fd6ff);
    for (const sx of [-1, 1]) { S.ekle(cvG.sil, sx * 10.6, 1.5, 0, 1.3, 5, 1.3, ACIK, 0, 0, Math.PI / 2); S.ekle(cvG.sil, sx * 14.4, 0.3, 0, 3.6, 0.6, 3.6, GRI); S.ekle(cvG.yarim, sx * 14.4, 0.55, 0, 3.3, 3.0, 3.3, sx > 0 ? 0xe6ecff : 0xffeede); S.ekle(cvG.sil, sx * 14.4, 1.5, 0, 3.25, 0.4, 3.25, sx > 0 ? 0xffb23c : 0x5fe38a); for (const a of [-0.7, 0, 0.7]) E.ekle(uzYuvar, sx * 14.4 + Math.sin(a) * 2.75, 2.35, Math.cos(a) * 2.75, 0.5, 0.5, 0.5, 0xffe27a); }
    iz(0, 0, 13, 11); iz(-14.4, 0, 5); iz(14.4, 0, 5); isik(0, 11.5, 4.5, 0x4fd6ff);
    break;
  }
  for (const q of [[0.2, 1], [0.16, 1], [0.12, -1], [0.23, -1], [0.3, 1], [0.35, -1], [0.4, 1]]) {
    if (!(p = koy(q[0], q[1], 30, 13))) continue;
    uzBuyukKrater = [p.x, 0, p.z, 13, 13, 13, 0, 0xd6d2ea]; krater.push([p.x, 0.012, p.z, 14.5, 1, 14.5, 0]);
    yer2(p.x, p.z, 0.6);
    // ortada iri kristal demeti (dışa doğru açılan, ışık yüzlü), çevresinde küçük kristaller; kenarda yuvarlak kaya sırtı
    const KR = [0x5ff0ff, 0xff7ad9, 0xb58cff, 0x8fd8ff, 0xff9be6], ACK = [0xd4fdff, 0xffd6f3, 0xe6dcff, 0xdcf2ff, 0xffe0f6];
    const tas = (x, z, h, w, rx, rz, c) => {
      S.ekle(cvG.okt, x, h * 0.42, z, w, h * 0.6, w, KR[c], rx, 0.3, rz);
      S.ekle(cvG.okt, x - w * 0.18, h * 0.47, z + w * 0.22, w * 0.55, h * 0.42, w * 0.55, ACK[c], rx, 0.3, rz);   // açık renk parlak yüz
      if (!rx && !rz) E.ekle(cvG.okt, x, h * 0.42 + h * 0.6 * 0.86, z, w * 0.3, w * 0.42, w * 0.3, 0xffffff, 0, 0.3, 0, 0, 0, 0.5);   // tepede nabız gibi ışıltı
    };
    tas(0, 0, 8.2, 1.7, 0, 0, 0); tas(1.5, 0.6, 5.6, 1.2, 0.1, -0.32, 1); tas(-1.3, 0.9, 6.0, 1.25, 0.25, 0.3, 2); tas(0.2, -1.5, 5.0, 1.1, -0.35, 0.05, 3);
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + 0.3, d = 4.2 + (k % 2) * 1.6, h = 2.2 + (k % 3) * 0.9; tas(Math.cos(a) * d, Math.sin(a) * d, h, 0.6 + (k % 3) * 0.12, Math.sin(a) * 0.35, -Math.cos(a) * 0.35, (k + 1) % 5); }
    const uzTop = new T.SphereGeometry(1, 10, 6); for (let k = 0; k < 18; k++) { const a = k / 18 * 6.2832, r = 11.6 + (k % 3) * 0.5, b = 1.1 + ((k * 7) % 4) * 0.3; S.ekle(uzTop, Math.cos(a) * r, b * 0.35, Math.sin(a) * r, b * 1.3, b * 0.7, b, [0xbab6d4, 0xa9a5c6, 0xc8c4de][k % 3], 0, a); S.ekle(cvG.yarimK, Math.cos(a) * r, b * 0.68, Math.sin(a) * r, b * 0.9, b * 0.28, b * 0.7, 0xeceaf8, 0, a); }
    hale.push([p.x, 0.03, p.z, 11, 1, 11, 0, 0x7ff4ff]); hale.push([p.x, 0.035, p.z, 5, 1, 5, 0, 0xff9be6]);
    break;
  }

  // ── renkli ışık direkleri ──
  { let k = 0; for (let i = 14; i < N; i += 40) { const c = cvKenar(i, k % 2 ? 1 : -1, YARI + 3.9), x = c.x, z = c.z; if (yerVar(x, z, 0.7)) { cvYasak.push([x, z, 1]); direk(x, z, CANLI[k % 7]); } k++; } }

  // ── seyirciler: astronotlar ve küçük uzaylılar ──
  const UZR = [0x6fe36a, 0x58d8f0, 0x9af07a, 0x5aa8ff, 0x58e0b0, 0xb0f060];
  for (let i = 3; i < N; i += 5) for (const yan of [-1, 1]) {
    const grup = ((i / 5) | 0) % 7; if (grup > 2 || R() < 0.3) continue;
    const b = uzBolge(i), c = cvKenar(i + ((R() * 3) | 0), yan, YARI + 4.6 + R() * 3.4, 0.5), x = c.x, z = c.z, ry = c.ry;
    if (!yerVar(x, z, 0.8)) continue;
    const yabanci = b === 5 ? R() < 0.85 : b === 2 ? R() < 0.7 : b === 1 ? R() < 0.4 : R() < 0.15;
    if (yabanci) { const s = 0.7 + R() * 0.3; uzayli.push([x, 0, z, s, s, s, ry + (R() - 0.5) * 0.5, UZR[(R() * 6) | 0]]); golge.push([x - 0.2, 0.02, z + 0.15, 0.75 * s, 1, 0.6 * s, 0]); }
    else { const s = 0.78 + R() * 0.16; astro.push([x, 0, z, s, s, s, ry + (R() - 0.5) * 0.5, CANLI[(R() * 7) | 0]]); golge.push([x - 0.2, 0.02, z + 0.15, 0.85 * s, 1, 0.7 * s, 0]); }
  }

  // ── yol boyu ön plan: ışıldayan kristal öbekleri, iri ay kayaları, arada bayrak (boş gri alan kalmasın) ──
  for (let i = 7; i < N; i += 8) for (const yan of [-1, 1]) {
    if (R() < 0.6) continue;   // sade: daha seyrek, yola en yakın şeritte boşluk
    const yakinSira = R() < 0.5, c = cvKenar(i + ((R() * 4) | 0), yan, YARI + (yakinSira ? 7.2 + R() * 4 : 13 + R() * 10)), x = c.x, z = c.z, ry = c.ry, r = R(), s = yakinSira ? 0.9 + R() * 0.5 : 1.3 + R() * 0.9;
    if (!yerVar(x, z, 1.5 * s)) continue; cvYasak.push([x, z, 1.5 * s]);
    if (r < 0.5) { kristal(x, z, s * 1.05); golge.push([x - 0.3, 0.02, z + 0.25, 1.5 * s, 1, 1.2 * s, 0]); }
    else if (r < 0.9) {
      S.yer(x, z, R() * 6, s); const rk = [0x9a96b8, 0xaaa6c6, 0x8985aa, 0xb8b4d0];
      S.ekle(cvG.ico, 0, 0.55, 0, 1.15, 0.85, 1.0, rk[(r * 40) & 3], 0.2, 0, 0.15); S.ekle(cvG.ufak, 0.95, 0.3, 0.5, 0.6, 0.45, 0.55, rk[(r * 70) & 3], 0.3, 1); S.ekle(cvG.ufak, -0.8, 0.22, -0.6, 0.42, 0.32, 0.4, rk[(r * 90) & 3], 0, 2, 0.3);
      S.ekle(cvG.yarimK, 0.1, 1.05, 0.1, 0.7, 0.16, 0.6, 0xe9e7f6, 0.15);   // tepesinde ay tozu
      golge.push([x - 0.4, 0.02, z + 0.3, 2.0 * s, 1, 1.6 * s, 0]);
    }
    else bayrak({ x, z, ry });
  }

  // ── ay kayaları, kraterler, ufuk tepeleri ──
  { const ren = [0x9a96b8, 0xaaa6c6, 0x8985aa, 0xb8b4d0];
    for (let k = 0; k < 140; k++) { const x = -215 + R() * 430, z = -205 + R() * 265, s = 0.35 + R() * R() * 2.2; if (!yerVar(x, z, s)) continue; S.yer(x, z, R() * 6); S.ekle(cvG.ufak, 0, s * 0.3, 0, s, s * (0.55 + R() * 0.4), s * (0.7 + R() * 0.5), ren[k % 4], R() * 0.5, 0, R() * 0.5); if (s > 0.9) golge.push([x - 0.3, 0.02, z + 0.25, s * 1.5, 1, s * 1.2, 0]); }
    for (let k = 0; k < 95; k++) { const x = -230 + R() * 460, z = -220 + R() * 295, r = 1.6 + R() * R() * 6; if (yerVar(x, z, r * 0.9)) krater.push([x, 0.012, z, r, 1, r, R() * 6]); }
    S.yer(0, -65, 0); const uzTepe = new T.SphereGeometry(1, 16, 6, 0, 6.2832, 0, Math.PI / 2);
    for (let k = 0; k < 20; k++) { const a = k / 20 * 6.2832 + 0.15, r = 285 + (k % 3) * 38, x = Math.cos(a) * r, z = Math.sin(a) * r, w = 40 + (k % 4) * 12, h = 16 + (k % 5) * 6; S.ekle(uzTepe, x, -1, z, w, h * 0.92, w * (0.7 + (k % 3) * 0.14), [0xa7a2c8, 0x9893bd, 0xb4b0d2][k % 3], 0, k * 0.8); }
  }

  { // büyük kraterlerin kabarık kenarları: ışık alan alçak halkalar (tek çizim)
    const g = new T.TorusGeometry(0.82, 0.1, 5, 22); g.rotateX(Math.PI / 2); const l = [];
    for (const k of krater) if (k[3] > 3.4 && k[3] < 14) l.push([k[0], 0, k[2], k[3], k[3] * 0.55, k[3], k[6], [0xd9d6ee, 0xcfcbe6, 0xe2dff4][l.length % 3]]);
    if (uzBuyukKrater) l.push(uzBuyukKrater);
    if (l.length) cok(g, mat(0xffffff), l);
  }
  { const g = S.geo(), p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { const k = 0.8 + 0.2 * clamp(p.getY(i) / 5, 0, 1); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); }   // ton geçişi: dipte biraz koyu, yukarı doğru açık
    const sm = new T.Mesh(g, cvMalz(0, { side: T.DoubleSide })); sm.frustumCulled = false; scene.add(sm); }
  const emM = new T.MeshBasicMaterial({ vertexColors: true });   // ışıklar: cvK.z = 1 olan işaret lambaları sırayla yanıp söner, 0,5 olanlar yavaşça nabız atar
  emM.onBeforeCompile = sh => {
    sh.uniforms.cvT = cvZ;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float cvT;\nattribute vec3 cvK;')
      .replace('#include <color_vertex>', 'vColor = color;\nfloat uzP = position.x * 0.37 + position.z * 0.29;\nfloat uzY = step(0.75, cvK.z) * (0.35 + 0.85 * smoothstep(0.2, 0.6, sin(cvT * 3.4 + uzP))) + step(0.25, cvK.z) * (1.0 - step(0.75, cvK.z)) * (0.78 + 0.28 * sin(cvT * 1.6 + uzP));\nvColor *= mix(1.0, uzY, step(0.25, cvK.z));');
  };
  emM.customProgramCacheKey = () => 'uzIsik';
  const em = new T.Mesh(E.geo(), emM); em.frustumCulled = false; scene.add(em);

  { // yerdeki krater çıkartmaları, renkli ışık havuzları ve temas gölgeleri (her biri tek çizim)
    const g = new T.PlaneGeometry(2, 2); g.rotateX(-Math.PI / 2);
    const kd = tuvalDoku(128, 128, (c, w, h) => { const r = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(92,84,140,.34)'); r.addColorStop(0.55, 'rgba(92,84,140,.40)'); r.addColorStop(0.7, 'rgba(120,112,165,.30)'); r.addColorStop(0.78, 'rgba(250,248,255,.75)'); r.addColorStop(0.9, 'rgba(250,248,255,.25)'); r.addColorStop(1, 'rgba(250,248,255,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); const q = c.createRadialGradient(w * 0.4, h * 0.4, 0, w * 0.4, h * 0.4, w * 0.32); q.addColorStop(0, 'rgba(60,52,110,.30)'); q.addColorStop(1, 'rgba(60,52,110,0)'); c.fillStyle = q; c.fillRect(0, 0, w, h); });
    const km = cok(g, new T.MeshBasicMaterial({ map: kd, transparent: true, depthWrite: false }), krater); km.renderOrder = 0;
    const hd = tuvalDoku(64, 64, (c, w, h) => { const r = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,.75)'); r.addColorStop(0.35, 'rgba(255,255,255,.42)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); });
    const hm = cok(g, new T.MeshBasicMaterial({ map: hd, transparent: true, depthWrite: false }), hale); hm.renderOrder = 1;
    const gd = tuvalDoku(64, 64, (c, w, h) => { const r = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(52,44,104,.36)'); r.addColorStop(0.45, 'rgba(52,44,104,.2)'); r.addColorStop(1, 'rgba(52,44,104,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); });
    const gm = cok(g, new T.MeshBasicMaterial({ map: gd, transparent: true, depthWrite: false }), golge); gm.renderOrder = 2;
  }

  { // astronot (ön yüzü +z); kopya rengi: göğüs şeridi, eldiven, çizme
    const A = cvYapi(); A.yer(0, 0, 0);
    for (const x of [-0.2, 0.2]) { A.ekle(cvG.kureK, x, 0.42, 0, 0.19, 0.4, 0.21, 0xf2f3fb, 0, 0, 0, 0, 1); A.ekle(cvG.kureK, x, 0.1, 0.06, 0.2, 0.12, 0.27, 0xffffff, 0, 0, 0, 1, 1); }
    A.ekle(cvG.kure, 0, 1.0, 0, 0.45, 0.5, 0.38, 0xf6f7ff, 0, 0, 0, 0, 1); A.ekle(cvG.kutu, 0, 1.08, -0.36, 0.58, 0.66, 0.26, 0xcfd3e6, 0, 0, 0, 0, 1);
    A.ekle(cvG.kutu, 0, 1.06, 0.35, 0.36, 0.2, 0.1, 0xffffff, 0, 0, 0, 1, 1);
    A.ekle(cvG.kure, 0, 1.74, 0, 0.44, 0.42, 0.44, 0xffffff, 0, 0, 0, 0, 1); A.ekle(cvG.kure, 0, 1.74, 0.2, 0.33, 0.27, 0.28, 0x34508f, 0, 0, 0, 0, 1); A.ekle(cvG.kureK, 0.12, 1.84, 0.43, 0.08, 0.05, 0.04, 0xcfe6ff, 0, 0, 0, 0, 1);
    A.ekle(cvG.kureK, -0.56, 1.02, 0, 0.14, 0.36, 0.15, 0xf2f3fb, 0, 0, 0.3, 0, 1); A.ekle(cvG.kureK, -0.67, 0.7, 0, 0.14, 0.14, 0.14, 0xffffff, 0, 0, 0, 1, 1);
    A.ekle(cvG.kureK, 0.6, 1.5, 0, 0.14, 0.36, 0.15, 0xf2f3fb, 0, 0, -0.55, 0, 1, 0.6); A.ekle(cvG.kureK, 0.8, 1.85, 0, 0.15, 0.15, 0.15, 0xffffff, 0, 0, 0, 1, 1, 1);
    cok(A.geo(), uzMalz(), astro);
    // küçük uzaylı; kopya rengi: gövde ve baş
    const U = cvYapi(); U.yer(0, 0, 0);
    for (const x of [-0.17, 0.17]) U.ekle(cvG.kureK, x, 0.1, 0.05, 0.16, 0.11, 0.22, 0xcccccc, 0, 0, 0, 1, 1);
    U.ekle(cvG.kure, 0, 0.55, 0, 0.34, 0.46, 0.3, 0xffffff, 0, 0, 0, 1, 1); U.ekle(cvG.kureK, 0, 0.5, 0.2, 0.2, 0.26, 0.14, 0xf4fff0, 0, 0, 0, 0, 1);
    U.ekle(cvG.kure, 0, 1.25, 0, 0.52, 0.42, 0.44, 0xffffff, 0, 0, 0, 1, 1);
    for (const x of [-0.21, 0.21]) { U.ekle(cvG.kureK, x, 1.3, 0.33, 0.17, 0.19, 0.12, 0xffffff, 0, 0, 0, 0, 1); U.ekle(cvG.kureK, x, 1.29, 0.42, 0.085, 0.1, 0.05, 0x23264a, 0, 0, 0, 0, 1); U.ekle(cvG.kutu, x * 1.1, 1.82, 0, 0.04, 0.4, 0.04, 0xdddddd, 0, 0, -x * 1.5, 1, 1); U.ekle(cvG.kureK, x * 1.5, 2.02, 0, 0.09, 0.09, 0.09, 0xffe14d, 0, 0, 0, 0, 1); }
    for (const x of [-1, 1]) { U.ekle(cvG.kutu, x * 0.06, 1.07, 0.41, 0.13, 0.045, 0.04, 0x23264a, 0, 0, x * 0.42, 0, 1); U.ekle(cvG.ufak, x * 0.33, 1.13, 0.33, 0.08, 0.05, 0.03, 0xff9ec8, 0, 0, 0, 0, 1); }   // gülen ağız, pembe yanak
    U.ekle(cvG.kureK, -0.42, 0.6, 0, 0.1, 0.26, 0.1, 0xeeeeee, 0, 0, 0.5, 1, 1); U.ekle(cvG.kureK, 0.5, 0.95, 0, 0.1, 0.3, 0.1, 0xeeeeee, 0, 0, -0.7, 1, 1, 0.7); U.ekle(cvG.kureK, 0.7, 1.2, 0, 0.11, 0.11, 0.11, 0xffffff, 0, 0, 0, 1, 1, 1);
    cok(U.geo(), uzMalz(), uzayli);
  }

  { // boşlukta ağır ağır süzülen iki astronot (ipli, sırt çantalı); yolun yanında ve yüksekte, yolu örtmez
    const A = cvYapi(); A.yer(0, 0, 0);
    A.ekle(cvG.kure, 0, 0, 0, 0.5, 0.56, 0.42, 0xf6f7ff); A.ekle(cvG.kutu, 0, 0.08, -0.42, 0.68, 0.8, 0.34, 0xcfd3e6); A.ekle(cvG.kutu, 0, 0.06, 0.4, 0.4, 0.22, 0.1, 0xff8a3c);
    A.ekle(cvG.tac, 0, 0.82, 0, 0.5, 0.48, 0.5, 0xffffff); A.ekle(cvG.tac, 0, 0.82, 0.22, 0.38, 0.31, 0.32, 0x34508f); A.ekle(cvG.kureK, 0.14, 0.94, 0.5, 0.09, 0.06, 0.04, 0xcfe6ff);
    A.ekle(cvG.kureK, -0.66, 0.3, 0.05, 0.16, 0.42, 0.17, 0xf2f3fb, 0, 0, 0.9); A.ekle(cvG.kureK, -0.98, 0.52, 0.05, 0.17, 0.17, 0.17, 0xff8a3c);
    A.ekle(cvG.kureK, 0.62, 0.36, 0.05, 0.16, 0.42, 0.17, 0xf2f3fb, 0, 0, -0.6); A.ekle(cvG.kureK, 0.84, 0.72, 0.05, 0.17, 0.17, 0.17, 0xff8a3c);
    A.ekle(cvG.kureK, -0.26, -0.72, 0.1, 0.2, 0.44, 0.22, 0xf2f3fb, 0.35, 0, -0.2); A.ekle(cvG.kureK, -0.34, -1.12, 0.3, 0.2, 0.13, 0.28, 0xff8a3c);
    A.ekle(cvG.kureK, 0.26, -0.74, -0.06, 0.2, 0.44, 0.22, 0xf2f3fb, -0.3, 0, 0.2); A.ekle(cvG.kureK, 0.34, -1.14, -0.24, 0.2, 0.13, 0.28, 0xff8a3c);
    for (let k = 0; k < 6; k++) A.ekle(cvG.kutu, -0.5 - k * 0.5, -0.1 - Math.sin(k / 5 * Math.PI) * 0.5, -0.7 - k * 0.25, 0.56, 0.05, 0.05, 0xffe14d, 0, 0.45, (k - 2.5) * 0.18);
    const g = A.geo(), m = cvMalz(0, { emissive: 0x2a2640 });
    for (const q of [[0.105, 1, 13, 10.5, 2.3], [0.665, -1, 13, 11.5, 2.1]]) {
      const c = cvKenar(cvI(q[0]), q[1], YARI + q[2]), o = new T.Mesh(g, m); o.position.set(c.x, q[3], c.z); o.scale.setScalar(q[4]); o.rotation.order = 'YXZ'; o.frustumCulled = false; scene.add(o);
      uzGezgin.push({ o, x: c.x, y: q[3], z: c.z, ry: c.ry, f: uzGezgin.length * 2.4 });
    }
  }

  { // süzülen uçan daire
    const Y = cvYapi(); Y.yer(0, 0, 0); ufoGovde(Y, 0);
    uzUfo = new T.Mesh(Y.geo(), cvMalz(0, { emissive: 0x252040 })); uzUfo.scale.setScalar(1.5); uzUfo.frustumCulled = false; scene.add(uzUfo);
    // altından yere inen ince, soluk ışık hüzmesi (üstü hafif, yere doğru söner) + yerde ışık halkası
    const hg = new T.CylinderGeometry(0.7, 2.1, 11, 14, 1, true), hp = hg.attributes.position, hc = new Float32Array(hp.count * 3);
    for (let i = 0; i < hp.count; i++) { const v = hp.getY(i) > 0 ? 0.035 : 0.0; hc[i * 3] = v * 0.6; hc[i * 3 + 1] = v; hc[i * 3 + 2] = v * 0.78; }
    hg.setAttribute('color', new T.BufferAttribute(hc, 3));
    const hm = new T.Mesh(hg, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
    hm.position.y = -6.1; hm.frustumCulled = false; uzUfo.add(hm);
    const yd = tuvalDoku(64, 64, (c, w, h) => { const r = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(150,255,200,.25)'); r.addColorStop(0.5, 'rgba(150,255,200,.12)'); r.addColorStop(1, 'rgba(150,255,200,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); });
    const yg = new T.PlaneGeometry(2, 2); yg.rotateX(-Math.PI / 2);
    uzUfoYer = new T.Mesh(yg, new T.MeshBasicMaterial({ map: yd, transparent: true, depthWrite: false })); uzUfoYer.scale.setScalar(3.8); uzUfoYer.renderOrder = 2; uzUfoYer.frustumCulled = false; scene.add(uzUfoYer);
  }
}

function cevreEkGuncelle(dt, t) {
  const c = camera.position;
  uzKubbe.position.set(c.x, 0, c.z); uzYildiz.position.set(c.x, 0, c.z);
  uzDunya.rotation.y = t * 0.035; uzHalkali.rotation.y = t * 0.05; uzUydu.rotation.y = t * 0.018;
  const a = t * 0.11; uzUfo.position.set(8 + Math.cos(a) * 30, 17 + Math.sin(t * 0.9) * 1.3, -52 + Math.sin(a) * 22); uzUfo.rotation.set(Math.sin(t * 0.7) * 0.05, t * 0.6, Math.cos(t * 0.6) * 0.05);
  if (uzUfoYer) uzUfoYer.position.set(uzUfo.position.x, 0.05, uzUfo.position.z);
  for (let k = 0; k < uzGezgin.length; k++) { const q = uzGezgin[k], u = t * 0.22 + q.f; q.o.position.set(q.x + Math.sin(u) * 2.2, q.y + Math.sin(u * 1.7) * 1.1, q.z + Math.cos(u * 0.8) * 2.2); q.o.rotation.set(Math.sin(u * 0.9) * 0.35, q.ry + Math.sin(u * 0.5) * 0.6, 0.25 + Math.sin(u * 0.7) * 0.3); }
  for (let k = 0; k < 2; k++) {
    const s = uzKayan[k], sure = 4.6 + k * 2.3, tt = t + k * 2.9, u = (tt % sure) / 1.5;
    if (u >= 1) { s.visible = false; continue; }
    const n = Math.floor(tt / sure);
    if (uzKayanN[k] !== n) {   // her kayan yıldız, başladığı anda bakılan yönün biraz sağında ya da solunda doğar (hep ekranda görünür)
      uzKayanN[k] = n; camera.getWorldDirection(uzV2);
      uzKayanAz[k] = Math.atan2(uzV2.z, uzV2.x) + (((n * 0.618 + k * 0.37) % 1) - 0.5) * 1.1;
    }
    const az = uzKayanAz[k], yon = (n + k) % 2 ? 1 : -1;
    uzV1.set((-Math.sin(az) * 0.85 - Math.cos(az) * 0.3) * yon, -0.34, (Math.cos(az) * 0.85 - Math.sin(az) * 0.3) * yon).normalize();
    s.position.set(c.x + Math.cos(az) * 560 + uzV1.x * (u - 0.5) * 300, 300 + uzV1.y * u * 300, c.z + Math.sin(az) * 560 + uzV1.z * (u - 0.5) * 300);
    uzV2.copy(uzV1).negate(); s.quaternion.setFromUnitVectors(uzYukari, uzV2); s.visible = true;
  }
}
