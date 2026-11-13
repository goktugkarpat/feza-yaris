/* Mercan Sualtı pistinin çevresi (yalnız ?pist=denizalti iken yüklenir, cevre.js'ten sonra).
   Yol, güneş ışınlarının süzüldüğü turkuaz-kumlu deniz tabanında kıvrılır.
   Zemin tek tuval dokusu (1024): inci kumu, kostik ışık ağları, renkli çakıllar, denizyıldızları ve temas gölgeleri üstten çizilir.
   Manzara anları:
   (1) Başlangıç manzarasında parlayan incili dev Mercan Atlantis Sarayı, batık tapınak ve canlı mercan-yosun resifi;
   (2) Başımızın üstünde yavrusuyla birlikte süzülen dev, gülen mavi balina (kuyruk ve yüzgeç çırpar);
   (3) Daire ve sekiz çizen 3 renkli tropikal balık sürüsü + sevimli deniz kaplumbağaları;
   (4) Açılıp kapanan parlayan incili dev istiridyeler, ışıldayan deniz şakayıkları ve denizanaları;
   (5) Pembe-mor-turuncu mercan kemerler, batık mermer kemer, altın hazine sandıkları ve yükselen kabarcıklar.
   Yeni üst düzey adlar `da` ile başlar. Kare başına yeni nesne yok; ışık ve gölge haritası eklenmez. */
'use strict';

let daBalina = null, daBalinaKuyruk = null, daBalinaSolYuzgec = null, daBalinaSagYuzgec = null;
let daYavruBalina = null, daYavruKuyruk = null, daYavruSol = null, daYavruSag = null;
let daBalinaMx = 0, daBalinaMz = 0, daBalinaFaz = 0;
const daKaplumbagalar = [];

let daBalikIM = null, daBalikObj = null;
const daBalikVeri = [], daOkullar = [];

function cevreEkGuncelle(dt, t) {
  if (daBalina) {
    const a = t * 0.105 + daBalinaFaz, rx = 88, rz = 62;
    const x = daBalinaMx + Math.cos(a) * rx;
    const z = daBalinaMz + Math.sin(a) * rz;
    const dx = -Math.sin(a) * rx, dz = Math.cos(a) * rz;
    daBalina.position.set(x, 20.5 + Math.sin(t * 0.65) * 1.8, z);
    daBalina.rotation.y = Math.atan2(dx, dz);
    daBalina.rotation.x = -Math.cos(t * 0.65) * 0.085;
    daBalina.rotation.z = -0.07 + Math.sin(t * 0.45) * 0.035;
    if (daBalinaKuyruk) daBalinaKuyruk.rotation.x = Math.sin(t * 2.2) * 0.28;
    const f = Math.sin(t * 1.6) * 0.18;
    if (daBalinaSolYuzgec) daBalinaSolYuzgec.rotation.z = 0.24 + f;
    if (daBalinaSagYuzgec) daBalinaSagYuzgec.rotation.z = -0.24 - f;
  }
  if (daYavruBalina) {
    const ab = t * 0.105 + daBalinaFaz - 0.15, rxb = 75, rzb = 53;
    const bx = daBalinaMx + Math.cos(ab) * rxb;
    const bz = daBalinaMz + Math.sin(ab) * rzb;
    const bdx = -Math.sin(ab) * rxb, bdz = Math.cos(ab) * rzb;
    daYavruBalina.position.set(bx, 18.0 + Math.sin(t * 1.15 + 0.9) * 1.3, bz);
    daYavruBalina.rotation.y = Math.atan2(bdx, bdz);
    daYavruBalina.rotation.x = -Math.cos(t * 1.15 + 0.9) * 0.095;
    daYavruBalina.rotation.z = -0.05 + Math.sin(t * 0.8 + 0.5) * 0.04;
    if (daYavruKuyruk) daYavruKuyruk.rotation.x = Math.sin(t * 2.9 + 0.7) * 0.34;
    const fb = Math.sin(t * 2.3 + 0.5) * 0.22;
    if (daYavruSol) daYavruSol.rotation.z = 0.26 + fb;
    if (daYavruSag) daYavruSag.rotation.z = -0.26 - fb;
  }
  for (let i = 0; i < daKaplumbagalar.length; i++) {
    const k = daKaplumbagalar[i];
    const a = t * k.hiz + k.faz;
    const ca = Math.cos(a), sa = Math.sin(a);
    k.mesh.position.set(k.cx + ca * k.rx, k.y0 + Math.sin(t * 1.4 + k.faz) * 0.45, k.cz + sa * k.rz);
    k.mesh.rotation.y = Math.atan2(-sa * k.rx * k.hiz, ca * k.rz * k.hiz);
    k.mesh.rotation.x = -Math.cos(t * 1.4 + k.faz) * 0.055;
    k.mesh.rotation.z = Math.sin(t * 1.8 + k.faz) * 0.065;
  }
  if (daBalikIM && daBalikObj) {
    for (let i = 0; i < daBalikVeri.length; i++) {
      const b = daBalikVeri[i];
      const ok = daOkullar[b.okul];
      const a = t * ok.hiz + b.faz;
      let x, z, dx, dz;
      if (ok.sekil === 0) {
        const ca = Math.cos(a), sa = Math.sin(a);
        x = ok.cx + ca * b.rx;
        z = ok.cz + sa * b.rz;
        dx = -sa * b.rx * ok.hiz;
        dz = ca * b.rz * ok.hiz;
      } else {
        const sa = Math.sin(a), ca = Math.cos(a);
        const s2 = Math.sin(a * 2.0), c2 = Math.cos(a * 2.0);
        x = ok.cx + sa * b.rx;
        z = ok.cz + s2 * b.rz;
        dx = ca * b.rx * ok.hiz;
        dz = 2.0 * c2 * b.rz * ok.hiz;
      }
      const y = ok.y0 + b.yOfs + Math.sin(t * 2.2 + b.faz * 2.0) * 0.42;
      daBalikObj.position.set(x, y, z);
      daBalikObj.rotation.set(-Math.cos(t * 2.2 + b.faz * 2.0) * 0.09, Math.atan2(dx, dz), Math.sin(a * (ok.sekil ? 2 : 1)) * 0.14);
      daBalikObj.scale.setScalar(b.s);
      daBalikObj.updateMatrix();
      daBalikIM.setMatrixAt(i, daBalikObj.matrix);
    }
    daBalikIM.instanceMatrix.needsUpdate = true;
  }
}

if (cvTema === 'denizalti') {
  // ───────── sualtı sisi, ışık ve derin turkuaz-kobalt gök geçişi ─────────
  scene.fog.color.setHex(0x6bdbe6);
  scene.fog.near = 180;
  scene.fog.far = 780;
  gunes.color.setHex(0xc4f8ff);
  cvGokIsik.color.setHex(0xdafcff);
  cvGokIsik.groundColor.setHex(0x88d4cc);
  {
    const eski = scene.background;
    scene.background = tuvalDoku(256, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#08437d');
      gr.addColorStop(0.16, '#106ab0');
      gr.addColorStop(0.30, '#249ad0');
      gr.addColorStop(0.41, '#52d0df');
      gr.addColorStop(0.48, '#80eaee');
      gr.addColorStop(1, '#a2f3f2');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);

      // Yüzeyden süzülen yumuşak güneş huzmeleri ve sualtı ışık parıltıları
      const rg = g.createRadialGradient(w * 0.72, h * 0.04, 0, w * 0.72, h * 0.14, w * 0.9);
      rg.addColorStop(0, 'rgba(232,255,250,0.28)');
      rg.addColorStop(0.45, 'rgba(170,248,252,0.10)');
      rg.addColorStop(1, 'rgba(170,248,252,0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, w, h * 0.55);

      for (let k = 0; k < 6; k++) {
        const x0 = w * (0.14 + k * 0.155);
        const bw = w * (0.06 + (k % 2) * 0.04);
        const ray = g.createLinearGradient(x0, 0, x0 - w * 0.24, h * 0.52);
        ray.addColorStop(0, 'rgba(236,255,252,0.11)');
        ray.addColorStop(0.55, 'rgba(200,252,250,0.05)');
        ray.addColorStop(1, 'rgba(200,252,250,0)');
        g.fillStyle = ray;
        g.beginPath();
        g.moveTo(x0, 0);
        g.lineTo(x0 + bw, 0);
        g.lineTo(x0 + bw * 1.9 - w * 0.24, h * 0.52);
        g.lineTo(x0 - w * 0.24, h * 0.52);
        g.closePath();
        g.fill();
      }
    });
    if (eski && eski.dispose) eski.dispose();
  }

  let daT = 48271;
  const Rd = () => { daT = (daT * 1664525 + 1013904223) >>> 0; return daT / 4294967296; };

  let mx = 0, mz = 0;
  for (let i = 0; i < N; i++) { mx += PX[i] / N; mz += PZ[i] / N; }
  daBalinaMx = mx; daBalinaMz = mz;
  // Başlangıç kamerasının önündeki ufukta görünmeleri için başlangıç açısını ayarla
  daBalinaFaz = Math.atan2((PZ[0] + TZ[0] * 78) - mz, (PX[0] + TX[0] * 78) - mx);

  // Başlangıç çizgisi çevresini temiz tut
  cvYasak.push([PX[0], PZ[0], YARI + 14]);

  const S = cvYapi(); // statik normal süsler
  const G = cvYapi(); // kendinden parlayan inciler, altınlar ve saray kubbeleri
  const daGolge = [], kabarcikYer = [];

  const yer = (f, yan, uz, r) => {
    for (let k = 0; k < 12; k++) {
      const i = cvI(f + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.006);
      const ff = i / N;
      if (ff < 0.045 || ff > 0.955) continue;
      const p = cvKenar(i, yan, uz, 0.25);
      const d = yakin(p.x, p.z);
      if (d > YARI + 8.5 + r && cvBos(p.x, p.z, r)) {
        cvYasak.push([p.x, p.z, r + 0.7]);
        return { x: p.x, z: p.z, ry: p.ry, i };
      }
    }
    return null;
  };

  // ───────── özel gölgelendiriciler (kare başına sıfır ayırma) ─────────
  const daYosunHar = cvHAREKET.length;
  cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.19 + instanceMatrix[3].z * 0.23;\nfloat cvW = max(0.0, transformed.y) * 0.11;\ntransformed.x += sin(cvT * 1.35 + cvF + transformed.y * 0.35) * cvW;\ntransformed.z += cos(cvT * 1.05 + cvF * 1.3 + transformed.y * 0.28) * cvW * 0.8;\n#endif');

  const daDenizAnasiHar = cvHAREKET.length;
  cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.47;\nfloat cvP = sin(cvT * 2.2 + cvF);\nif (transformed.y > 0.0) { transformed.xz *= 1.0 + cvP * 0.14; transformed.y *= 1.0 - cvP * 0.08; }\nelse { float cvD = -transformed.y; transformed.x += sin(cvT * 2.6 + cvF + cvD * 1.8) * cvD * 0.18; transformed.z += cos(cvT * 2.1 + cvF * 1.2 + cvD * 1.6) * cvD * 0.18; }\ntransformed.y += sin(cvT * 1.1 + cvF) * 0.85;\n#endif');

  const daKaplumbagaHar = cvHAREKET.length;
  cvHAREKET.push('float cvFlap = max(0.0, abs(transformed.x) - 0.52);\ntransformed.y += cvFlap * sin(cvT * 3.4 + cvK.z) * 0.46;');

  const daKabarcikHar = cvHAREKET.length;
  cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.73 + instanceMatrix[3].z * 0.91;\nfloat cvH = mod(cvT * 1.55 + cvF * 3.1, 15.0);\ntransformed.y += cvH;\ntransformed.x += sin(cvT * 2.3 + cvF + cvH * 0.5) * 0.26;\ntransformed.z += cos(cvT * 1.9 + cvF + cvH * 0.4) * 0.26;\ntransformed *= smoothstep(0.0, 1.4, cvH) * (1.0 - smoothstep(12.2, 15.0, cvH));\n#endif');

  // İstiridye üst kabuğunu menteşeden (y=0.45, z=-1.15) yavaşça açıp kapayan gölgelendirici
  const daIstiridyeHar = cvHAREKET.length;
  cvHAREKET.push('#ifdef USE_INSTANCING\nif (cvK.y > 0.5) {\nfloat cvF = instanceMatrix[3].x * 0.41 + instanceMatrix[3].z * 0.53;\nfloat cvA = 0.14 + (0.5 + 0.5 * sin(cvT * 1.15 + cvF)) * 0.76;\nvec2 cvQ = transformed.yz - vec2(0.45, -1.15);\nfloat cvC = cos(cvA), cvS = sin(cvA);\ntransformed.y = 0.45 + cvQ.x * cvC + cvQ.y * cvS;\ntransformed.z = -1.15 - cvQ.x * cvS + cvQ.y * cvC;\n}\n#endif');

  // Tropikal balıkların yüzerken kuyruk sallaması
  const daBalikHar = cvHAREKET.length;
  cvHAREKET.push('#ifdef USE_INSTANCING\nfloat cvF = instanceMatrix[3].x * 0.5 + instanceMatrix[3].z * 0.7;\nfloat cvKuy = max(0.0, -transformed.z - 0.15);\ntransformed.x += sin(cvT * 9.5 + cvF) * cvKuy * 0.28;\n#endif');

  const daParlakMalz = (mod, parlak, o, kenar) => {
    const m = cvMalz(mod, o);
    const prev = m.onBeforeCompile;
    const kr = kenar || 0;
    m.onBeforeCompile = (sh, r) => {
      if (prev) prev.call(m, sh, r);
      const rimKod = kr > 0
        ? '\n{ vec3 daV = normalize(vViewPosition); float daN = clamp(dot(normal, daV), 0.0, 1.0); float daRim = pow(1.0 - daN, 2.1); totalEmissiveRadiance += mix(diffuseColor.rgb, vec3(1.0, 0.89, 0.78), 0.52) * daRim * ' + kr.toFixed(3) + '; }'
        : '';
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance += vColor.rgb * ' + parlak.toFixed(2) + ';\n#endif' + rimKod
      );
    };
    m.customProgramCacheKey = () => 'da' + mod + '_' + parlak + '_' + kr;
    return m;
  };

  // Saray ve mercan kenarlarında sıcak pastel güneş parıltısı ve yumuşak sualtı kenar ışıması (ek ışık/çizim yok)
  const daCilaMalz = (mod, par, kenar, o) => {
    const m = cvMalz(mod, o);
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      if (prev) prev.call(m, sh, r);
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n{ vec3 daV = normalize(vViewPosition); float daN = clamp(dot(normal, daV), 0.0, 1.0); float daRim = pow(1.0 - daN, 2.1); vec3 daH = normalize(normalize(vec3(-0.35, 0.82, 0.45)) + daV); float daSp = pow(clamp(dot(normal, daH), 0.0, 1.0), 26.0); totalEmissiveRadiance += vec3(1.0, 0.92, 0.80) * (daSp * ' + par.toFixed(3) + ') + mix(diffuseColor.rgb, vec3(1.0, 0.87, 0.78), 0.50) * daRim * ' + kenar.toFixed(3) + '; }'
      );
    };
    m.customProgramCacheKey = () => 'daC' + mod + '_' + par + '_' + kenar;
    return m;
  };

  // Alt yüzeylerde serin sualtı gölgesi, üst ve güneşe bakan kenarlarda sıcak pastel kontrast
  const daPastelKontrast = (g, hRef) => {
    const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) {
      const u = clamp(p.getY(i) / hRef, 0, 1);
      const ny = n.getY(i);
      const up = clamp(ny * 0.5 + 0.5, 0, 1);
      const sun = clamp((-n.getX(i) * 0.35 + ny * 0.78 + n.getZ(i) * 0.45) * 0.5 + 0.5, 0, 1);
      const k = 0.83 + 0.13 * u + 0.07 * up;
      c.setXYZ(
        i,
        Math.min(1, c.getX(i) * k * lerp(0.91, 1.07, sun)),
        Math.min(1, c.getY(i) * k * lerp(0.96, 1.02, sun)),
        Math.min(1, c.getZ(i) * k * lerp(1.03, 0.94, sun))
      );
    }
    return g;
  };

  // ───────── 1) Dev gülen mavi balina + sevimli yavrusu ─────────
  {
    const balMat = cvMalz(0);
    const balinaKur = (olcek) => {
      const grp = new T.Group();
      const B = cvYapi();
      B.ekle(cvG.kureY, 0, 0.2, 0.3, 3.6, 2.9, 6.8, 0x3b96e0);
      B.ekle(cvG.kureY, 0, -0.75, 0.4, 3.05, 2.1, 6.0, 0xd8f4ff);
      for (let k = -2; k <= 2; k++) {
        B.ekle(cvG.sil5, k * 0.55, -2.55 + Math.abs(k) * 0.12, 0.7, 0.08, 4.4, 0.08, 0xa9def5, Math.PI / 2);
      }
      B.ekle(cvG.koni, 0, 3.0, -1.6, 0.55, 1.3, 1.1, 0x2f82cc, -0.45);
      B.ekle(cvG.kure, 0, 1.35, 3.3, 2.4, 1.75, 2.5, 0x4aa3eb);
      for (const s of [-1, 1]) {
        B.ekle(cvG.kureK, s * 2.55, 0.35, 3.6, 0.45, 0.5, 0.38, 0xffffff);
        B.ekle(cvG.ufak, s * 2.75, 0.35, 3.72, 0.24, 0.28, 0.2, 0x162238);
        B.ekle(cvG.ufak, s * 2.86, 0.48, 3.82, 0.1, 0.1, 0.08, 0xffffff);
        B.ekle(cvG.kureK, s * 2.52, -0.45, 3.3, 0.6, 0.38, 0.48, 0xff9ec4);
      }
      for (let k = -3; k <= 3; k++) {
        const a = k * 0.22;
        B.ekle(cvG.ufak, Math.sin(a) * 1.9, -0.85 + (k * k) * 0.07, 4.9 + Math.cos(a) * 1.5, 0.14, 0.12, 0.14, 0x1e3554);
      }
      for (const s of [-1, 1]) {
        B.ekle(cvG.kureK, s * 0.35, 3.3, 2.8, 0.3, 0.65, 0.3, 0xe8fcff, 0, 0, -s * 0.35);
        B.ekle(cvG.ufak, s * 0.72, 3.9, 2.8, 0.22, 0.22, 0.22, 0xffffff);
      }
      grp.add(new T.Mesh(cvTon(B.geo()), balMat));

      const kuyruk = new T.Group();
      kuyruk.position.set(0, 0.1, -5.6);
      const K = cvYapi();
      K.ekle(cvG.kureY, 0, 0, -1.6, 1.35, 1.15, 2.5, 0x3b96e0);
      for (const s of [-1, 1]) {
        K.ekle(cvG.kureK, s * 1.65, 0.05, -3.5, 1.9, 0.22, 1.05, 0x2f82cc, 0, s * 0.35, 0);
      }
      kuyruk.add(new T.Mesh(cvTon(K.geo()), balMat));
      grp.add(kuyruk);

      const yuzgecYap = yan => {
        const g = new T.Group();
        g.position.set(yan * 2.85, -0.75, 1.3);
        const Y = cvYapi();
        Y.ekle(cvG.kureK, yan * 1.45, -0.15, -0.35, 1.75, 0.2, 0.85, 0x388fd8, 0, -yan * 0.32, 0);
        g.add(new T.Mesh(cvTon(Y.geo()), balMat));
        return g;
      };
      const sol = yuzgecYap(-1), sag = yuzgecYap(1);
      grp.add(sol, sag);
      grp.scale.setScalar(olcek);
      scene.add(grp);
      return { grp, kuyruk, sol, sag };
    };

    const anne = balinaKur(1.38);
    daBalina = anne.grp; daBalinaKuyruk = anne.kuyruk; daBalinaSolYuzgec = anne.sol; daBalinaSagYuzgec = anne.sag;

    const yavru = balinaKur(0.64);
    daYavruBalina = yavru.grp; daYavruKuyruk = yavru.kuyruk; daYavruSol = yavru.sol; daYavruSag = yavru.sag;
  }

  // ───────── 2) Açılış manzarası: Dev Mercan Atlantis Sarayı & Batık Tapınak ─────────
  {
    const MERMER = 0xfff5e8, MERMER2 = 0xb8dcd8, MERCAN_P = 0xff7fa3, MERCAN_M = 0xc982ff, ALTIN = 0xffcf4a, INCI = 0xfff8e6;

    // 2a) Dev Mercan Atlantis Sarayı (f ~ 0.145)
    {
      const p = yer(0.145, 1, YARI + 31, 11) || cvKenar(cvI(0.145), 1, YARI + 31, 0.25);
      S.yer(p.x, p.z, p.ry, 1.15);
      G.yer(p.x, p.z, p.ry, 1.15);

      // Kademeli mermer-mercan kaide
      S.ekle(cvG.kutuY, 0, 0.6, 0, 18.0, 1.2, 13.0, MERMER2);
      S.ekle(cvG.kutuY, 0, 1.6, 0, 15.2, 0.9, 10.6, MERMER);
      S.ekle(cvG.kutuY, 0, 2.25, 0, 13.4, 0.45, 9.2, MERCAN_P);

      // Ön merdiven basamakları
      for (let k = 0; k < 3; k++) {
        S.ekle(cvG.kutuY, 0, 0.35 + k * 0.55, 6.2 - k * 0.85, 6.4 - k * 0.5, 0.5, 1.4, MERMER);
      }

      // Ana sütun dizisi (6 büyük sütun) + taç
      for (const sx of [-5.2, -2.6, 2.6, 5.2]) {
        for (const sz of [-3.2, 3.2]) {
          S.ekle(cvG.kutuY, sx, 2.7, sz, 1.25, 0.55, 1.25, MERMER2);
          S.ekle(cvG.sil, sx, 6.2, sz, 0.52, 6.6, 0.52, MERMER);
          S.ekle(cvG.kutuY, sx, 9.7, sz, 1.35, 0.55, 1.35, ALTIN);
        }
      }
      // Arka ve yan duvar kemer gövdesi
      S.ekle(cvG.kutuY, 0, 6.0, -1.2, 9.6, 7.0, 5.2, MERMER2);
      S.ekle(cvG.kutuY, 0, 10.4, 0, 13.8, 1.1, 8.8, MERMER);
      S.ekle(cvG.kutuY, 0, 11.15, 0, 14.3, 0.45, 9.3, MERCAN_P);

      // Merkez büyük parlayan inci kubbe + altın alem
      G.ekle(cvG.yarim, 0, 11.2, -0.4, 4.4, 4.6, 4.4, INCI);
      S.ekle(cvG.sil, 0, 11.2, -0.4, 4.7, 0.5, 4.7, ALTIN);
      S.ekle(cvG.koni, 0, 16.5, -0.4, 0.5, 1.8, 0.5, ALTIN);
      G.ekle(cvG.kureK, 0, 17.6, -0.4, 0.52, 0.52, 0.52, 0xa8f8ff);

      // İki yan kule ve parlayan küçük inci kubbeler
      for (const s of [-1, 1]) {
        S.ekle(cvG.sil, s * 6.8, 6.6, 0.5, 1.75, 8.8, 1.75, MERMER);
        S.ekle(cvG.sil, s * 6.8, 11.1, 0.5, 2.05, 0.55, 2.05, MERCAN_M);
        G.ekle(cvG.yarim, s * 6.8, 11.3, 0.5, 1.85, 2.2, 1.85, 0xd8f8ff);
        S.ekle(cvG.koni, s * 6.8, 14.1, 0.5, 0.35, 1.2, 0.35, ALTIN);
        // Ön kemerde parlayan pencereler
        G.ekle(cvG.kureK, s * 3.8, 6.2, 1.5, 0.72, 1.15, 0.25, 0x9cf8ff);
      }
      // Orta giriş kemeri ve denizyıldızı arması
      G.ekle(cvG.kureK, 0, 5.4, 1.5, 1.4, 2.2, 0.35, 0xffeaa8);
      S.ekle(cvG.koni6, 0, 11.4, 4.65, 1.1, 0.35, 1.1, 0xff7052, Math.PI / 2, 0, 0);

      // Saray etrafına renkli mercan kümeleri ve kabarcıklar
      for (const s of [-1, 1]) {
        S.ekle(cvG.kureK, s * 8.6, 1.2, 4.2, 1.6, 1.1, 1.4, s > 0 ? MERCAN_P : 0x45e0d0);
        S.ekle(cvG.kureK, s * 7.8, 0.9, -4.5, 1.4, 1.0, 1.3, 0xff9a54);
        kabarcikYer.push([p.x + s * 5.0, 1.5, p.z + 2.0]);
      }
      kabarcikYer.push([p.x, 2.0, p.z]);
      daGolge.push([p.x, p.z, 12.5, 9.5, 0.32]);
    }

    // 2b) Yolun karşı tarafında Batık Tapınak Köşkü (f ~ 0.095)
    {
      const p = yer(0.095, -1, YARI + 21, 6.5);
      if (p) {
        S.yer(p.x, p.z, p.ry, 1.0);
        G.yer(p.x, p.z, p.ry, 1.0);
        S.ekle(cvG.kutuY, 0, 0.45, 0, 8.2, 0.9, 8.2, MERMER2);
        S.ekle(cvG.kutuY, 0, 1.05, 0, 6.8, 0.4, 6.8, MERCAN_P);
        for (const sx of [-2.4, 2.4]) {
          for (const sz of [-2.4, 2.4]) {
            S.ekle(cvG.sil, sx, 3.6, sz, 0.42, 4.8, 0.42, MERMER);
            S.ekle(cvG.kutuY, sx, 6.1, sz, 1.05, 0.4, 1.05, ALTIN);
          }
        }
        S.ekle(cvG.kutuY, 0, 6.6, 0, 7.2, 0.75, 7.2, MERMER);
        G.ekle(cvG.yarim, 0, 6.95, 0, 2.7, 2.6, 2.7, INCI);
        S.ekle(cvG.koni, 0, 10.1, 0, 0.35, 1.1, 0.35, ALTIN);
        daGolge.push([p.x, p.z, 6.0, 6.0, 0.28]);
        kabarcikYer.push([p.x, 1.2, p.z]);
      }
    }
  }

  // ───────── 3) Sevimli renkli deniz kaplumbağaları ─────────
  {
    const K = cvYapi();
    K.ekle(cvG.yarim, 0, 0.05, 0, 0.92, 0.62, 1.15, 0x2cb588);
    K.ekle(cvG.sil, 0, 0.02, 0, 0.98, 0.14, 1.2, 0xf2d16b);
    for (const [x, z] of [[0, 0.25], [0.42, -0.1], [-0.42, -0.1], [0, -0.5]]) {
      K.ekle(cvG.kureK, x, 0.56 - (x * x + z * z) * 0.22, z, 0.24, 0.12, 0.26, 0x1b8a6b);
    }
    K.ekle(cvG.kure, 0, 0.16, 1.38, 0.34, 0.3, 0.42, 0x7ae582);
    for (const s of [-1, 1]) {
      K.ekle(cvG.ufak, s * 0.22, 0.28, 1.56, 0.09, 0.1, 0.08, 0x182230);
      K.ekle(cvG.ufak, s * 0.25, 0.31, 1.60, 0.035, 0.035, 0.035, 0xffffff);
      K.ekle(cvG.kureK, s * 1.18, 0.02, 0.52, 0.78, 0.09, 0.34, 0x52d681, 0, -s * 0.38, 0);
      K.ekle(cvG.kureK, s * 0.65, -0.02, -1.05, 0.38, 0.08, 0.45, 0x52d681, 0, s * 0.42, 0);
    }
    const kapGeo = cvTon(K.geo()), kapMat = cvMalz(daKaplumbagaHar);
    const yerler = [
      [0.12, -1, 18, 12, 8, 0.24, 5.0],
      [0.29, 1, 20, 14, 9, -0.21, 5.6],
      [0.48, -1, 18, 12, 11, 0.19, 6.2],
      [0.72, 1, 22, 15, 10, -0.17, 5.4],
      [0.89, -1, 19, 11, 12, 0.21, 6.5]
    ];
    for (let idx = 0; idx < yerler.length; idx++) {
      const [f, yan, uz, rx, rz, hiz, y0] = yerler[idx];
      const p = cvKenar(cvI(f), yan, YARI + uz, 0);
      const m = new T.Mesh(kapGeo, kapMat);
      m.scale.setScalar(1.35 + (idx % 2) * 0.25);
      m.position.set(p.x, y0, p.z);
      scene.add(m);
      daKaplumbagalar.push({ mesh: m, cx: p.x, cz: p.z, rx, rz, hiz, faz: idx * 1.4, y0 });
    }
  }

  // ───────── 4) Yüzen renkli tropikal balık sürüleri (3 sürü, 36 balık, 1 InstancedMesh) ─────────
  {
    const F = cvYapi();
    // Tombul balık gövdesi (+Z'ye bakar, cvK.x = 1 ile sürüdeki her balık ayrı renge boyanır)
    F.ekle(cvG.kureY, 0, 0, 0.05, 0.26, 0.32, 0.56, 0xffffff, 0, 0, 0, 1);
    F.ekle(cvG.koni, 0, 0.34, -0.05, 0.06, 0.26, 0.24, 0xffffff, -0.3, 0, 0, 1);
    F.ekle(cvG.ucgen, 0, 0.02, -0.62, 0.05, 0.44, 0.32, 0xffffff, -Math.PI / 2, 0, 0, 1);
    for (const s of [-1, 1]) {
      F.ekle(cvG.kureK, s * 0.2, 0.08, 0.34, 0.06, 0.07, 0.06, 0xffffff);
      F.ekle(cvG.ufak, s * 0.23, 0.08, 0.36, 0.035, 0.04, 0.035, 0x162238);
      F.ekle(cvG.kureK, s * 0.24, -0.06, 0.06, 0.14, 0.04, 0.12, 0xffffff, 0, -s * 0.4, 0, 1);
    }
    const balikRenk = [0xff7a48, 0xffd23f, 0x3ef0ff, 0xff6ec4, 0x6ef7a8, 0xff9b42];
    const okulAyar = [
      [0.08, 1, YARI + 17.5, 4.5, 0.68, 1, 8.5, 6.5],
      [0.50, -1, YARI + 18.5, 5.4, 0.55, 0, 9.5, 8.0],
      [0.77, 1, YARI + 18.0, 4.8, 0.62, 1, 8.5, 6.5]
    ];
    const toplamBalik = 36;
    daBalikIM = new T.InstancedMesh(cvTon(F.geo()), cvMalz(daBalikHar), toplamBalik);
    daBalikIM.frustumCulled = false;
    daBalikObj = new T.Object3D();
    daBalikObj.rotation.order = 'YXZ';
    const rc = new T.Color();
    let bIdx = 0;
    for (let o = 0; o < okulAyar.length; o++) {
      const [f, yan, uz, y0, hiz, sekil, rx, rz] = okulAyar[o];
      const p = cvKenar(cvI(f), yan, uz, 0);
      daOkullar.push({ cx: p.x, cz: p.z, y0, hiz, sekil });
      for (let k = 0; k < 12; k++) {
        daBalikVeri.push({
          okul: o,
          faz: (k / 12) * Math.PI * 2 + Rd() * 0.4,
          rx: rx + (Rd() - 0.5) * 3.5,
          rz: rz + (Rd() - 0.5) * 3.0,
          yOfs: (Rd() - 0.5) * 2.2,
          s: 0.95 + Rd() * 0.55
        });
        rc.setHex(balikRenk[(o * 2 + k) % balikRenk.length]);
        daBalikIM.setColorAt(bIdx, rc);
        bIdx++;
      }
    }
    daBalikIM.instanceColor.needsUpdate = true;
    scene.add(daBalikIM);
  }

  // ───────── 5) Parlayan renkli denizanaları ─────────
  {
    const D = cvYapi();
    D.ekle(cvG.yarim, 0, 0, 0, 1.0, 0.78, 1.0, 0xffffff, 0, 0, 0, 1);
    D.ekle(cvG.yarimK, 0, -0.05, 0, 0.72, 0.5, 0.72, 0xffffff);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2, r = 0.48;
      D.ekle(cvG.sil5, Math.cos(a) * r, -1.05, Math.sin(a) * r, 0.055, 2.0, 0.055, 0xffffff, 0, 0, 0, 1);
    }
    D.ekle(cvG.sil5, 0, -0.85, 0, 0.08, 1.6, 0.08, 0xffffff, 0, 0, 0, 1);
    const renkler = [0xff7eb9, 0x4ef2ff, 0xc59bff, 0xff9ad5, 0x6ef7e8];
    const liste = [];
    for (let k = 0; k < 28; k++) {
      const f = 0.06 + (k / 28) * 0.88;
      const yan = k % 2 ? 1 : -1;
      const p = cvKenar(cvI(f), yan, YARI + 13 + (k % 4) * 6.5, 0);
      if (yakin(p.x, p.z) < YARI + 11) continue;
      const s = 0.95 + (k % 3) * 0.35;
      liste.push([p.x, 4.5 + (k % 5) * 1.9, p.z, s, s, s, Rd() * 6.28, renkler[k % renkler.length]]);
    }
    cok(D.geo(), daParlakMalz(daDenizAnasiHar, 0.45, { transparent: true, opacity: 0.86 }), liste);
  }

  // ───────── 6) Salınan dev yosun ormanları (açılış manzarasında yola daha yakın ve gür) ─────────
  {
    const Y = cvYapi();
    for (let k = 0; k < 3; k++) {
      const ox = (k - 1) * 0.45, oz = (k % 2 ? 0.32 : -0.28), h = 4.8 + (k % 2) * 2.0;
      Y.ekle(cvG.sil5, ox, h * 0.5, oz, 0.14, h, 0.14, 0xffffff, 0, 0, 0, 1);
      for (let j = 1; j <= 4; j++) {
        const yy = j * (h * 0.21), s = j % 2 ? 1 : -1;
        Y.ekle(cvG.kureK, ox + s * 0.38, yy, oz, 0.44, 0.13, 0.24, 0xffffff, 0, j * 0.8, s * 0.35, 1);
      }
    }
    const yListe = [];
    const yRenk = [0x2ec47a, 0x3ed984, 0x20a88e, 0x54e07e];
    // Açılış manzarası (f ~ 0.055..0.24) için yola yakın dev yosun kümeleri
    for (let k = 0; k < 22; k++) {
      const f = 0.055 + (k / 22) * 0.185;
      const yan = k % 2 ? 1 : -1;
      const p = yer(f, yan, YARI + 10.5 + (k % 4) * 3.5, 1.5);
      if (!p) continue;
      const s = 1.15 + Rd() * 0.65;
      yListe.push([p.x, 0, p.z, s, s * (1.05 + Rd() * 0.45), s, Rd() * 6.28, yRenk[k % yRenk.length]]);
      daGolge.push([p.x, p.z, 2.0 * s, 1.7 * s, 0.22]);
    }
    // Pistin geri kalanı
    for (let k = 0; k < 54; k++) {
      const f = 0.25 + (k / 54) * 0.69;
      const yan = (k % 3 === 0) ? -1 : 1;
      const p = yer(f, yan, YARI + 11.5 + (k % 5) * 4.2, 1.7);
      if (!p) continue;
      const s = 0.95 + Rd() * 0.7;
      yListe.push([p.x, 0, p.z, s, s * (0.9 + Rd() * 0.45), s, Rd() * 6.28, yRenk[k % yRenk.length]]);
      daGolge.push([p.x, p.z, 1.9 * s, 1.6 * s, 0.22]);
    }
    cok(cvTon(Y.geo()), cvMalz(daYosunHar), yListe);
  }

  // ───────── 7) Canlı mercan resifleri, ışıldayan şakayıklar ve açılan incili dev istiridyeler ─────────
  {
    // 7a) Uzun dallı geyikboynuzu mercanı
    const M = cvYapi();
    M.ekle(cvG.sil, 0, 0.9, 0, 0.26, 1.8, 0.26, 0xffffff, 0, 0, 0, 1);
    for (let k = 0; k < 5; k++) {
      const a = k * 1.256 + 0.2;
      M.ekle(cvG.sil, Math.cos(a) * 0.48, 1.8, Math.sin(a) * 0.48, 0.18, 1.35, 0.18, 0xffffff, Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55, 1);
      M.ekle(cvG.kureK, Math.cos(a) * 0.82, 2.38, Math.sin(a) * 0.82, 0.22, 0.22, 0.22, 0xffffff, 0, 0, 0, 1);
    }
    const mListe = [];
    const mRenk = [0xff6e7a, 0xff9854, 0xeb73d8, 0x42dfd0, 0xffcf58];
    for (let k = 0; k < 20; k++) {
      const f = 0.055 + (k / 20) * 0.19;
      const p = yer(f, k % 2 ? -1 : 1, YARI + 10.5 + (k % 3) * 4.0, 1.7);
      if (!p) continue;
      const s = 1.25 + Rd() * 0.65;
      mListe.push([p.x, 0, p.z, s, s, s, Rd() * 6.28, mRenk[k % mRenk.length]]);
      daGolge.push([p.x, p.z, 2.2 * s, 1.9 * s, 0.24]);
    }
    for (let k = 0; k < 38; k++) {
      const f = 0.25 + (k / 38) * 0.69;
      const p = yer(f, k % 2 ? 1 : -1, YARI + 12.0 + (k % 4) * 4.8, 1.9);
      if (!p) continue;
      const s = 1.0 + Rd() * 0.75;
      mListe.push([p.x, 0, p.z, s, s, s, Rd() * 6.28, mRenk[k % mRenk.length]]);
      daGolge.push([p.x, p.z, 2.1 * s, 1.8 * s, 0.24]);
    }
    cok(daPastelKontrast(cvTon(M.geo()), 2.4), daCilaMalz(0, 0.09, 0.28), mListe);

    // 7b) Beyin mercanı
    const B = cvYapi();
    B.ekle(cvG.yarim, 0, 0, 0, 1.35, 0.95, 1.35, 0xffffff, 0, 0, 0, 1);
    for (let k = 0; k < 5; k++) {
      const a = k * 1.256;
      B.ekle(cvG.kureK, Math.cos(a) * 0.65, 0.35, Math.sin(a) * 0.65, 0.55, 0.45, 0.55, 0xffffff, 0, 0, 0, 1);
    }
    const bListe = [];
    const bRenk = [0xff8aa8, 0xffb26b, 0xce8eff, 0x76e8bc];
    for (let k = 0; k < 14; k++) {
      const f = 0.06 + (k / 14) * 0.19;
      const p = yer(f, k % 2 ? 1 : -1, YARI + 11.5 + (k % 3) * 4.5, 2.0);
      if (!p) continue;
      const s = 1.25 + Rd() * 0.7;
      bListe.push([p.x, 0, p.z, s, s * 0.85, s, Rd() * 6.28, bRenk[k % bRenk.length]]);
      daGolge.push([p.x, p.z, 2.5 * s, 2.2 * s, 0.25]);
    }
    for (let k = 0; k < 24; k++) {
      const f = 0.26 + (k / 24) * 0.68;
      const p = yer(f, k % 2 ? -1 : 1, YARI + 13 + (k % 3) * 5.5, 2.1);
      if (!p) continue;
      const s = 1.1 + Rd() * 0.8;
      bListe.push([p.x, 0, p.z, s, s * 0.85, s, Rd() * 6.28, bRenk[k % bRenk.length]]);
      daGolge.push([p.x, p.z, 2.5 * s, 2.2 * s, 0.25]);
    }
    cok(daPastelKontrast(cvTon(B.geo()), 1.0), daCilaMalz(0, 0.09, 0.28), bListe);

    // 7c) Işıldayan deniz şakayıkları (canlı pembe, camgöbeği, turuncu, mor)
    const A = cvYapi();
    A.ekle(cvG.govde, 0, 0.35, 0, 0.65, 0.7, 0.65, 0xdf66a8);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      A.ekle(cvG.sil5, Math.cos(a) * 0.42, 1.05, Math.sin(a) * 0.42, 0.11, 0.95, 0.11, 0xffffff, Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25, 1);
      A.ekle(cvG.ufak, Math.cos(a) * 0.55, 1.55, Math.sin(a) * 0.55, 0.16, 0.16, 0.16, 0xffffff, 0, 0, 0, 1);
    }
    const aListe = [];
    const aRenk = [0xff6ed5, 0x5ef2ff, 0xff9a4a, 0xc88aff];
    for (let k = 0; k < 34; k++) {
      const f = 0.055 + (k / 34) * 0.88;
      const p = yer(f, k % 2 ? 1 : -1, YARI + 11 + (k % 3) * 3.8, 1.5);
      if (!p) continue;
      const s = 0.95 + Rd() * 0.5;
      aListe.push([p.x, 0, p.z, s, s, s, Rd() * 6.28, aRenk[k % aRenk.length]]);
      daGolge.push([p.x, p.z, 1.6 * s, 1.5 * s, 0.2]);
    }
    cok(cvTon(A.geo()), daParlakMalz(daYosunHar, 0.42), aListe);

    // 7d) Açılıp kapanan parlayan incili dev pastel istiridyeler (InstancedMesh + shader)
    const C = cvYapi();
    // Alt kabuk (cvK.x = 1 renk alır, cvK.y = 0 sabit)
    C.ekle(cvG.yarim, 0, 0.42, 0, 2.2, 0.55, 1.85, 0xffffff, Math.PI, 0, 0, 1, 0);
    // Üst kabuk (cvK.x = 1 renk alır, cvK.y = 1 menteşeden açılır)
    C.ekle(cvG.yarim, 0, 0.46, 0, 2.15, 0.58, 1.82, 0xffffff, 0, 0, 0, 1, 1);
    // İçindeki parlayan dev beyaz inci (cvK.x = 0 saf beyaz kalır)
    C.ekle(cvG.kureY, 0, 0.72, 0.12, 0.64, 0.64, 0.64, 0xffffff, 0, 0, 0, 0, 0);
    const cListe = [];
    const cRenk = [0xf5b8e2, 0xd8b8ff, 0xa8f2de, 0xffcfb3];
    const cFler = [0.08, 0.16, 0.24, 0.34, 0.43, 0.53, 0.62, 0.71, 0.80, 0.88, 0.93];
    for (let k = 0; k < cFler.length; k++) {
      const p = yer(cFler[k], k % 2 ? 1 : -1, YARI + 12.5 + (k % 2) * 3.8, 2.8);
      if (!p) continue;
      const s = 1.2 + (k % 3) * 0.16;
      cListe.push([p.x, 0, p.z, s, s, s, p.ry, cRenk[k % cRenk.length]]);
      daGolge.push([p.x, p.z, 3.4 * s, 2.8 * s, 0.28]);
      kabarcikYer.push([p.x, 0.9, p.z]);
    }
    cok(daPastelKontrast(cvTon(C.geo()), 1.1), daParlakMalz(daIstiridyeHar, 0.30, null, 0.22), cListe);
  }

  // ───────── 8) Canlı mercan kemerler, batık mermer kemer, hazine sandıkları ve kabarcıklar ─────────
  {
    const MERMER = 0xfff3e4, MERMER2 = 0xbeded8, YOSUN = 0x4db88a, AMFORA = 0xd87b52;

    // 8a) Yolun üstünden geçen canlı pembe-mor-turuncu mercan kemer (f = 0.22)
    {
      const idx = cvI(0.22);
      const p = cvKenar(idx, 1, 0, 0);
      const kemerRy = Math.atan2(TX[idx], TZ[idx]);
      S.yer(p.x, p.z, kemerRy, 1);
      G.yer(p.x, p.z, kemerRy, 1);
      const mRenk = [0xff6ca8, 0xc476ff, 0xff924c];
      for (const yan of [-1, 1]) {
        const px = yan * 14.3;
        S.ekle(cvG.kureK, px, 0.8, 0, 2.4, 1.5, 2.4, 0xc476ff);
        for (let k = 0; k < 5; k++) {
          S.ekle(cvG.kureK, px + Math.sin(k * 1.4) * 0.5, 2.2 + k * 1.45, Math.cos(k * 1.1) * 0.4, 1.35 - k * 0.08, 1.25, 1.35 - k * 0.08, mRenk[k % 3]);
        }
        G.ekle(cvG.ufak, px - yan * 1.2, 5.2, 0.8, 0.45, 0.45, 0.45, 0x7ef8ff);
        daGolge.push([p.x + Math.cos(kemerRy) * px, p.z - Math.sin(kemerRy) * px, 3.0, 3.0, 0.28]);
        kabarcikYer.push([p.x + Math.cos(kemerRy) * px, 1.2, p.z - Math.sin(kemerRy) * px]);
      }
      for (let j = 0; j <= 12; j++) {
        const a = Math.PI - (j / 12) * Math.PI;
        const ax = Math.cos(a) * 14.3, ay = 8.8 + Math.sin(a) * 4.8;
        S.ekle(cvG.kureK, ax, ay, Math.sin(j * 1.3) * 0.35, 1.55, 1.15, 1.55, mRenk[j % 3]);
        if (j % 3 === 1) G.ekle(cvG.ufak, ax, ay + 0.95, 0, 0.35, 0.35, 0.35, 0xffe48a);
      }
    }

    // 8b) Yol kenarında iki renkli mercan kemeri (f = 0.37, 0.71)
    for (const [f, yan, c1, c2] of [[0.37, -1, 0xff6ea8, 0xff9452], [0.71, 1, 0xc072ff, 0xff6ea8]]) {
      const p = yer(f, yan, YARI + 17, 5.5);
      if (!p) continue;
      S.yer(p.x, p.z, p.ry + 0.35, 1);
      G.yer(p.x, p.z, p.ry + 0.35, 1);
      for (let j = 0; j <= 10; j++) {
        const a = Math.PI - (j / 10) * Math.PI;
        const x = Math.cos(a) * 4.2, y = 0.6 + Math.sin(a) * 5.8;
        S.ekle(cvG.kureK, x, y, 0, 1.05, 1.05, 1.05, j % 2 ? c1 : c2);
        if (j % 2 === 0) G.ekle(cvG.ufak, x, y + 0.85, 0.4, 0.26, 0.26, 0.26, 0x8ef8ff);
      }
      daGolge.push([p.x, p.z, 5.6, 2.8, 0.26]);
      kabarcikYer.push([p.x, 1.0, p.z]);
    }

    // 8c) Yolun üstünden geçen büyük batık mermer kemer (f = 0.56)
    {
      const p = cvKenar(cvI(0.56), 1, 0, 0);
      const kemerRy = Math.atan2(TX[cvI(0.56)], TZ[cvI(0.56)]);
      S.yer(p.x, p.z, kemerRy, 1);
      for (const yan of [-1, 1]) {
        const px = yan * 13.5;
        S.ekle(cvG.kutuY, px, 0.55, 0, 3.0, 1.1, 3.0, MERMER2);
        S.ekle(cvG.sil, px, 4.9, 0, 1.05, 8.2, 1.05, MERMER);
        S.ekle(cvG.kutuY, px, 9.2, 0, 2.6, 0.85, 2.6, MERMER2);
        S.ekle(cvG.kureK, px + yan * 0.9, 1.2, 0.9, 0.85, 0.6, 0.7, YOSUN);
        daGolge.push([p.x + Math.cos(kemerRy) * px, p.z - Math.sin(kemerRy) * px, 3.2, 3.2, 0.3]);
        kabarcikYer.push([p.x + Math.cos(kemerRy) * px, 1.2, p.z - Math.sin(kemerRy) * px]);
      }
      for (let j = 0; j <= 10; j++) {
        const a = Math.PI - (j / 10) * Math.PI;
        S.ekle(cvG.kutuY, Math.cos(a) * 13.5, 9.5 + Math.sin(a) * 4.2, 0, 2.4, 1.4, 2.1, j % 2 ? MERMER : MERMER2, 0, 0, a - Math.PI / 2);
      }
      S.ekle(cvG.kureK, -4.5, 13.5, 0.6, 1.2, 0.65, 0.9, 0xff7eb9);
      S.ekle(cvG.kureK, 5.2, 13.1, -0.5, 1.0, 0.7, 0.85, 0x45d8c8);
    }

    // 8d) Batık hazine sandıkları (açık kapaklı, parlayan altın ve mücevherli + kabarcık)
    for (const [f, yan] of [[0.18, -1], [0.43, 1], [0.65, -1], [0.86, 1]]) {
      const p = yer(f, yan, YARI + 13.5, 3.2);
      if (!p) continue;
      S.yer(p.x, p.z, p.ry, 1.45);
      G.yer(p.x, p.z, p.ry, 1.45);
      S.ekle(cvG.kutuY, 0, 0.62, 0, 2.2, 1.25, 1.45, 0x8d5631);
      for (const x of [-0.75, 0.75]) S.ekle(cvG.kutuY, x, 0.62, 0, 0.18, 1.3, 1.5, 0xf2b730);
      S.ekle(cvG.kutuY, 0, 1.22, 0, 2.28, 0.14, 1.52, 0xf2b730);
      S.ekle(cvG.kutuY, 0, 0.75, 0.74, 0.32, 0.4, 0.1, 0xf2b730);
      S.ekle(cvG.kutuY, 0, 1.92, -0.92, 2.2, 1.4, 0.34, 0x9d6338, -0.32);
      for (const x of [-0.75, 0.75]) S.ekle(cvG.kutuY, x, 1.92, -0.92, 0.18, 1.45, 0.4, 0xf2b730, -0.32);
      // Parlayan altın sikkeler ve mücevherler
      for (let k = 0; k < 10; k++) {
        const x = -0.75 + (k % 5) * 0.37, z = -0.35 + Math.floor(k / 5) * 0.42;
        G.ekle(cvG.kureK, x, 1.28 + (k % 2) * 0.08, z, 0.25, 0.14, 0.25, k % 2 ? 0xffd84a : 0xffe98a);
      }
      G.ekle(cvG.okt, -0.45, 1.5, 0.1, 0.18, 0.22, 0.18, 0xff5f8a);
      G.ekle(cvG.okt, 0.35, 1.54, 0.2, 0.17, 0.21, 0.17, 0x5fe8ff);
      S.ekle(cvG.koni6, 1.5, 0.08, 0.9, 0.48, 0.12, 0.48, 0xff7052);
      daGolge.push([p.x, p.z, 3.0, 2.4, 0.3]);
      kabarcikYer.push([p.x, 1.4, p.z]);
    }

    // 8e) Eğik batık amforalar + denizyıldızları
    for (let k = 0; k < 12; k++) {
      const f = 0.07 + k * 0.078;
      const p = yer(f, k % 2 ? -1 : 1, YARI + 12.0 + (k % 3) * 3.5, 2.0);
      if (!p) continue;
      S.yer(p.x, p.z, p.ry + k * 0.9, 1);
      S.ekle(cvG.kureY, 0, 0.65, 0, 0.62, 0.95, 0.62, AMFORA, 0.55, 0.2, 0.35);
      S.ekle(cvG.sil, 0, 1.45, 0.48, 0.28, 0.55, 0.28, AMFORA, 0.55, 0.2, 0.35);
      S.ekle(cvG.sil, 0, 1.7, 0.64, 0.42, 0.14, 0.42, 0xe8946b, 0.55, 0.2, 0.35);
      S.ekle(cvG.koni6, 1.0, 0.08, 0.5, 0.46, 0.12, 0.46, k % 2 ? 0xff7052 : 0xffaa44);
      daGolge.push([p.x, p.z, 2.2, 1.8, 0.24]);
      kabarcikYer.push([p.x, 1.5, p.z]);
    }

    // 8f) Yükselen inci-turkuaz kabarcıklar (InstancedMesh + shader)
    const kabListe = [];
    for (let i = 0; i < kabarcikYer.length; i++) {
      const [x, y, z] = kabarcikYer[i];
      for (let j = 0; j < 4; j++) {
        const s = 0.22 + ((i + j) % 3) * 0.11;
        kabListe.push([x + (Rd() - 0.5) * 1.4, y + j * 1.2, z + (Rd() - 0.5) * 1.4, s, s, s, 0, 0xe6ffff]);
      }
    }
    if (kabListe.length) {
      cok(cvG.kureK, daParlakMalz(daKabarcikHar, 0.58, { transparent: true, opacity: 0.74 }), kabListe);
    }
  }

  // ───────── 9) Uzak resif tepeleri (derin teal-aqua renk geçişli 2 katman) ─────────
  {
    const RTepe = cvYapi();
    RTepe.yer(0, 0, 0);
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2 + 0.14;
      const kat = k % 2;
      const r = kat ? 290 + (k % 3) * 38 : 225 + (k % 3) * 32;
      const x = mx + Math.cos(a) * r, z = mz + Math.sin(a) * r * 0.86;
      if (yakin(x, z) < YARI + 62) continue;
      const s = kat ? 34 + (k % 4) * 11 : 24 + (k % 4) * 8;
      const renk = kat ? (k % 4 === 1 ? 0x155b75 : 0x1a6f88) : (k % 4 === 0 ? 0x2a97ab : 0x38b4be);
      RTepe.ekle(cvG.yarim, x, -0.5, z, s * 1.35, s * 0.85, s, renk, 0, k * 0.7);
      RTepe.ekle(cvG.yarim, x + Math.cos(k) * s * 0.45, -0.5, z + Math.sin(k) * s * 0.45, s * 0.75, s * 0.58, s * 0.75, 0x45c8cc, 0, k * 1.1);
    }
    const tg = RTepe.geo();
    const tp = tg.attributes.position, tc = tg.attributes.color;
    // Dipte koyu okyanus teali, tepede parlak aqua geçişi
    for (let i = 0; i < tp.count; i++) {
      const u = clamp(tp.getY(i) / 36, 0, 1);
      tc.setXYZ(i, tc.getX(i) * (0.62 + u * 0.62), tc.getY(i) * (0.72 + u * 0.48), tc.getZ(i) * (0.78 + u * 0.38));
    }
    const tm = new T.Mesh(tg, cvMalz(0));
    tm.frustumCulled = false;
    scene.add(tm);
  }

  // Statik süs yığınını ve kendinden parlayan inci-altın yığınını sahneye ekle
  {
    const m = new T.Mesh(daPastelKontrast(cvTon(S.geo()), 11.0), daCilaMalz(0, 0.11, 0.26));
    m.frustumCulled = false;
    scene.add(m);
    const gm = new T.Mesh(daPastelKontrast(G.geo(), 14.0), daParlakMalz(0, 0.52, null, 0.20));
    gm.frustumCulled = false;
    scene.add(gm);
  }

  // ───────── 10) Deniz tabanı: 1024x1024 zenginleştirilmiş kostik ışık kurdeleli tuval dokusu ─────────
  {
    const W = 560, X0 = mx - W / 2, Z0 = mz - W / 2, Q = 1024 / W;
    const px = x => (x - X0) * Q, pz = z => (z - Z0) * Q;
    const yol = g => {
      g.beginPath();
      for (let i = 0; i <= N; i += 2) {
        const k = i % N;
        i ? g.lineTo(px(PX[k]), pz(PZ[k])) : g.moveTo(px(PX[k]), pz(PZ[k]));
      }
      g.closePath();
    };
    const doku = tuvalDoku(1024, 1024, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, w * 0.10, w / 2, h / 2, w * 0.72);
      gr.addColorStop(0, '#a2eee4');
      gr.addColorStop(0.50, '#7bd2d0');
      gr.addColorStop(1, '#50a6b6');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);

      // Deniz tabanında yumuşak turkuaz akıntı dalgaları ve inci kumu kuşakları
      for (let k = 0; k < 14; k++) {
        const y0 = (k + 0.5) * (h / 14);
        g.strokeStyle = k % 2 ? 'rgba(222,250,232,0.16)' : 'rgba(66,184,196,0.16)';
        g.lineWidth = 28 + (k % 3) * 14;
        g.beginPath();
        for (let x = 0; x <= w; x += 24) {
          const y = y0 + Math.sin(x * 0.014 + k * 0.9) * 16;
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }

      // Yol kenarı açık inci-kum şeridi ve sıcak güneşli kum çizgileri
      g.lineJoin = 'round'; g.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        g.globalAlpha = 0.28 + k * 0.1;
        g.strokeStyle = k < 2 ? '#b6efe0' : '#e2f4d8';
        g.lineWidth = 2 * (YARI + 16 - k * 2.2) * Q;
        yol(g);
        g.stroke();
      }
      g.globalAlpha = 0.24;
      g.strokeStyle = '#fff5d4';
      g.lineWidth = 2 * (YARI + 7.5) * Q;
      yol(g);
      g.stroke();
      g.globalAlpha = 1;

      // Yumuşak inci kumu ve turkuaz derinlik lekeleri
      for (let k = 0; k < 95; k++) {
        const x = Rd() * w, y = Rd() * h, r = 16 + Rd() * 34;
        const rg = g.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, k % 2 ? 'rgba(238,249,218,0.34)' : 'rgba(84,200,206,0.28)');
        rg.addColorStop(1, 'rgba(84,200,206,0)');
        g.fillStyle = rg;
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      }

      // 1. Katman: Yumuşak parlak turkuaz kostik ışık kurdeleleri (geniş ışıltılı bantlar)
      for (let k = 0; k < 22; k++) {
        const dik = k % 2;
        const base = (k / 22) * (dik ? w : h);
        const ph = k * 1.15;
        g.strokeStyle = k % 3 === 0 ? 'rgba(255,252,222,0.14)' : 'rgba(182,255,250,0.16)';
        g.lineWidth = 9 + (k % 3) * 2.5;
        g.beginPath();
        for (let t = 0; t <= w; t += 18) {
          const wv = Math.sin(t * 0.021 + ph) * 20 + Math.cos(t * 0.043 - ph * 0.7) * 8;
          const x = dik ? base + wv + (t - h * 0.5) * 0.24 : t;
          const y = dik ? t : base + wv + (t - w * 0.5) * 0.22;
          t === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }

      // 2. Katman: Keskin, örülü kostik ışık kurdeleleri ve sıcak güneş parıltısı ağları
      for (let k = 0; k < 38; k++) {
        const dik = k % 2;
        const base = (k / 38) * (dik ? w : h) + (Rd() - 0.5) * 18;
        const ph = Rd() * 6.28;
        g.strokeStyle = k % 4 === 0 ? 'rgba(255,250,214,0.30)' : 'rgba(238,255,252,0.36)';
        g.lineWidth = 2.0 + (k % 3) * 0.65;
        g.beginPath();
        for (let t = 0; t <= w; t += 16) {
          const wv = Math.sin(t * 0.025 + ph) * 16 + Math.sin(t * 0.056 + ph * 1.6) * 7;
          const x = dik ? base + wv + (t - h * 0.5) * 0.22 : t;
          const y = dik ? t : base + wv + (t - w * 0.5) * 0.20;
          t === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }

      // 3. Katman: Birbirine bağlanan kostik ışık hücreleri ve kesişim parıltıları
      g.strokeStyle = 'rgba(242,255,252,0.28)';
      g.lineWidth = 2.0;
      for (let k = 0; k < 110; k++) {
        const x = Rd() * w, y = Rd() * h, rx = 11 + Rd() * 19, ry = 7 + Rd() * 13, ang = Rd() * 3.14;
        g.beginPath();
        g.ellipse(x, y, rx, ry, ang, 0, 7);
        g.stroke();
        if (k % 3 === 0) {
          const rg = g.createRadialGradient(x, y, 0, x, y, rx * 0.65);
          rg.addColorStop(0, 'rgba(255,254,234,0.26)');
          rg.addColorStop(1, 'rgba(255,254,234,0)');
          g.fillStyle = rg;
          g.beginPath(); g.arc(x, y, rx * 0.65, 0, 7); g.fill();
        }
      }

      // Renkli deniz çakılı kümeleri
      const cakilRenk = ['#f4a8be', '#9ce6d8', '#d4b4f8', '#f8d894', '#7cc4d4'];
      for (let k = 0; k < 38; k++) {
        const cx = Rd() * w, cy = Rd() * h;
        for (let j = 0; j < 5; j++) {
          g.globalAlpha = 0.72;
          g.fillStyle = cakilRenk[(k + j) % cakilRenk.length];
          g.beginPath();
          g.ellipse(cx + (Rd() - 0.5) * 14, cy + (Rd() - 0.5) * 14, 1.8 + Rd() * 2.2, 1.3 + Rd() * 1.6, Rd() * 3.14, 0, 7);
          g.fill();
        }
      }

      // Deniz tabanına çizilmiş sevimli denizyıldızları
      const yildizRenk = ['#ff7462', '#ffaa4e', '#e47be0'];
      for (let k = 0; k < 18; k++) {
        const sx = Rd() * w, sy = Rd() * h, rr = 4.5 + Rd() * 3.0, rot = Rd() * 6.28;
        g.globalAlpha = 0.78;
        g.fillStyle = yildizRenk[k % yildizRenk.length];
        g.beginPath();
        for (let j = 0; j < 10; j++) {
          const a = rot + (j / 10) * Math.PI * 2;
          const r = j % 2 === 0 ? rr : rr * 0.42;
          const pxj = sx + Math.cos(a) * r, pyj = sy + Math.sin(a) * r;
          j === 0 ? g.moveTo(pxj, pyj) : g.lineTo(pxj, pyj);
        }
        g.closePath();
        g.fill();
      }

      // İnce kum ve sedef tanecikleri
      for (let k = 0; k < 2000; k++) {
        g.globalAlpha = 0.35;
        g.fillStyle = k % 3 ? '#eafae6' : '#7ed2cc';
        g.fillRect(Rd() * w, Rd() * h, 1.5, 1.5);
      }

      // Süslerin altında yumuşak temas gölgeleri
      for (const q of daGolge) {
        const x = px(q[0]), z = pz(q[1]), r = q[2] * Q;
        g.globalAlpha = q[4];
        const rg = g.createRadialGradient(x, z, 0, x, z, r);
        rg.addColorStop(0, 'rgba(28,88,102,1)');
        rg.addColorStop(1, 'rgba(28,88,102,0)');
        g.fillStyle = rg;
        g.save();
        g.translate(x, z);
        g.scale(1, q[3] / q[2]);
        g.translate(-x, -z);
        g.beginPath(); g.arc(x, z, r, 0, 7); g.fill();
        g.restore();
      }
      g.globalAlpha = 1;
    });

    doku.anisotropy = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
    doku.repeat.set(1500 / W, 1500 / W);
    doku.offset.set((-750 - X0) / W, 1 - (680 - Z0) / W);
    doku.wrapS = doku.wrapT = T.ClampToEdgeWrapping;
    zemin.material.map = doku;
    zemin.material.needsUpdate = true;
    {
      const zp = zemin.geometry.attributes.position, p = zemin.geometry.attributes.color;
      for (let i = 0; i < p.count; i++) {
        const x = zp.getX(i), y = zp.getY(i);
        const v = 0.94 + 0.05 * Math.sin(x * 0.019 + 0.8) * Math.cos(y * 0.016);
        const q = 0.5 + 0.5 * Math.sin(x * 0.008 - 0.5) * Math.cos(y * 0.007 + 0.4);
        p.setXYZ(i, v * lerp(0.92, 1.02, q), v * lerp(0.97, 1.01, q), v * lerp(1.03, 0.96, q));
      }
      p.needsUpdate = true;
    }
  }
}
