/* Gece Lunaparkı pistinin çevresi (yalnız ?pist=lunapark iken yüklenir, cevre.js'ten sonra).
   cevre.js ortak tabanı kurar (gök dokusu, sis, iki ışık, zemin, güneş kursu); bu dosya onları sıcak, neşeli bir akşama çevirir ve süslerini ekler.
   Sade: üç manzara anı — iç alanın ortasında yavaşça dönen büyük dönme dolap, sol yarıda dönen atlıkarınca, sağ virajın dışında çizgili sirk çadırı;
   bitiş çizgisinin ilerisinde ara sıra gökte açılan küçük havai fişek. Ampul dizileri ve fenerler yoldan uzak ve seyrek.
   Işıltı gerçek ışık değildir (2 ışık kuralı): kendinden parlayan köşe renkli malzeme. Bütün dönme ve yanıp sönme gölgelendiricide (kare başına iş yok).
   Yeni üst düzey adlar `lp` ile başlar. Renkler: lacivert gök + sıcak sarı ışık + pembe / turkuaz vurgu. */
'use strict';

let lpYildiz = null;
function cevreEkGuncelle(dt, t) {
  if (lpYildiz) lpYildiz.position.set(camera.position.x, 0, camera.position.z);   // yıldızlar kamerayla gelir (sonsuz uzak görünür)
}
// Dönen parçaların malzemesi: cvK.y = 1 → eksen çevresinde döner; 2 → döner ve asılı kalır (dolap kabinleri) ya da direğinde iner çıkar (atlıkarınca atları).
// cvK.x = parçanın açısı (kabin askısı / at evresi), cvK.z = kabin askısının yarıçapı. eksen 'xy' (dönme dolap) ya da 'xz' (atlıkarınca).
function lpDonKod(eksen, hiz, isik) {
  const rot = 'float lpU = cvT * ' + hiz.toFixed(3) + '; mat2 lpM = mat2(cos(lpU), sin(lpU), -sin(lpU), cos(lpU));\n';
  const v = eksen === 'xy'
    ? 'if (cvK.y > 0.5 && cvK.y < 1.5) transformed.xy = lpM * transformed.xy;\nelse if (cvK.y > 1.5) { vec2 lpA = vec2(cos(cvK.x), sin(cvK.x)) * cvK.z; transformed.xy += lpM * lpA - lpA; }'
    : 'if (cvK.y > 1.5) transformed.y += sin(cvT * 2.0 + cvK.x) * 0.38;\nif (cvK.y > 0.5) transformed.xz = lpM * transformed.xz;';
  return {
    n: '#include <beginnormal_vertex>\n{ ' + rot + (eksen === 'xy' ? 'if (cvK.y > 0.5 && cvK.y < 1.5) objectNormal.xy = lpM * objectNormal.xy;' : 'if (cvK.y > 0.5) objectNormal.xz = lpM * objectNormal.xz;') + ' }',
    b: '#include <begin_vertex>\n{ ' + rot + v + (isik ? '\nvColor *= 0.72 + 0.4 * smoothstep(-0.4, 0.8, sin(cvT * 2.6 - cvK.x * 2.0));' : '') + ' }'
  };
}
function lpDonMalz(eksen, hiz, isik, o) {
  const m = isik ? new T.MeshBasicMaterial({ vertexColors: true }) : new T.MeshLambertMaterial(Object.assign({ color: 0xffffff, vertexColors: true }, o || {}));
  m.onBeforeCompile = sh => {
    const k = lpDonKod(eksen, hiz, isik);
    sh.uniforms.cvT = cvZ;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float cvT;\nattribute vec3 cvK;')
      .replace('#include <beginnormal_vertex>', k.n).replace('#include <begin_vertex>', k.b);
    if (isik) sh.vertexShader = sh.vertexShader.replace('#include <color_vertex>', 'vColor = color;');
  };
  m.customProgramCacheKey = () => 'lpDon' + eksen + hiz + (isik ? 'i' : 'l');
  return m;
}

if (cvTema === 'lunapark') {
  // ───────── gök: üstte koyu lacivert, ufka doğru mor, ufukta sıcak pembe ışıltı ─────────
  {
    const c = scene.background.image, g = c.getContext('2d'), h = c.height, gr = g.createLinearGradient(0, 0, 0, h);
    [[0, '#10164a'], [0.16, '#1c2266'], [0.28, '#2f2c82'], [0.36, '#55409e'], [0.42, '#8a58b0'], [0.465, '#d27fa8'], [0.5, '#f0a6a4'], [1, '#f6b8a8']].forEach(q => gr.addColorStop(q[0], q[1]));
    g.fillStyle = gr; g.fillRect(0, 0, c.width, h); scene.background.needsUpdate = true;
  }
  scene.fog.color.setHex(0x7a5aa6); scene.fog.near = 220; scene.fog.far = 900;
  // aydınlık gece: dolgu ışığı güçlü (arabalar ve yol kararmaz), ana ışık sıcak lunapark ışığı
  cvGokIsik.color.setHex(0xf2ecff); cvGokIsik.groundColor.setHex(0xa898d8); cvGokIsik.intensity = 1.34;
  gunes.color.setHex(0xfff0dc); gunes.intensity = 1.45;

  // ───────── sevimli ay (güneş kursunun yerine): yumuşak haleli, uykulu gülen yüz ─────────
  {
    const ay = tuvalDoku(256, 256, (g, w, h) => {
      const m = w / 2, hg = g.createRadialGradient(m, m, w * 0.17, m, m, m);
      hg.addColorStop(0, 'rgba(255,240,190,0.55)'); hg.addColorStop(0.3, 'rgba(255,226,200,0.18)'); hg.addColorStop(1, 'rgba(255,220,220,0)'); g.fillStyle = hg; g.fillRect(0, 0, w, h);
      const r = w * 0.2, dg = g.createRadialGradient(m - r * 0.3, m - r * 0.35, r * 0.1, m, m, r);
      dg.addColorStop(0, '#fffbe4'); dg.addColorStop(0.7, '#fff0b0'); dg.addColorStop(1, '#ffdf8a'); g.fillStyle = dg; g.beginPath(); g.arc(m, m, r, 0, 7); g.fill();
      g.fillStyle = 'rgba(232,196,110,0.32)'; for (const q of [[0.42, -0.5, 0.17], [-0.55, 0.42, 0.13], [0.55, 0.45, 0.1], [-0.2, -0.62, 0.08]]) { g.beginPath(); g.arc(m + q[0] * r, m + q[1] * r, q[2] * r, 0, 7); g.fill(); }
      g.strokeStyle = '#b58a3a'; g.lineWidth = r * 0.06; g.lineCap = 'round';
      for (const sx of [-1, 1]) { g.beginPath(); g.arc(m + sx * r * 0.32, m - r * 0.05, r * 0.13, 0.2, Math.PI - 0.2); g.stroke(); }   // kapalı, gülen gözler
      g.beginPath(); g.arc(m, m + r * 0.18, r * 0.2, 0.35, Math.PI - 0.35); g.stroke();
      g.fillStyle = 'rgba(255,140,150,0.4)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(m + sx * r * 0.55, m + r * 0.22, r * 0.13, r * 0.08, 0, 0, 7); g.fill(); }
    });
    cvGunes.material.map = ay; cvGunes.material.needsUpdate = true; cvGunes.scale.set(190, 190, 1);
  }

  // ───────── yıldızlar: tek nokta bulutu, yumuşak kırpışma gölgelendiricide ─────────
  {
    const say = 560, p = new Float32Array(say * 3), s = new Float32Array(say), f = new Float32Array(say), c = new Float32Array(say * 3), ton = [[1, 1, 1], [1, 0.95, 0.72], [0.8, 0.95, 1], [1, 0.85, 0.95]];
    for (let i = 0; i < say; i++) {
      const y = 0.1 + Math.pow(R(), 1.3) * 0.9, a = R() * 6.2832, r = Math.sqrt(1 - y * y), q = ton[(R() * 4) | 0], b = R();
      p[i * 3] = Math.cos(a) * r * 800; p[i * 3 + 1] = y * 800; p[i * 3 + 2] = Math.sin(a) * r * 800;
      s[i] = b > 0.92 ? 7 + R() * 3 : 2.4 + R() * 3; f[i] = R() * 10; c[i * 3] = q[0]; c[i * 3 + 1] = q[1]; c[i * 3 + 2] = q[2];
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3)); g.setAttribute('lpS', new T.BufferAttribute(s, 1)); g.setAttribute('lpF', new T.BufferAttribute(f, 1)); g.setAttribute('lpC', new T.BufferAttribute(c, 3));
    const m = new T.ShaderMaterial({ uniforms: { cvT: cvZ }, transparent: true, depthWrite: false,
      vertexShader: 'attribute float lpS;attribute float lpF;attribute vec3 lpC;uniform float cvT;varying vec3 vC;varying float vA;void main(){vC=lpC;vA=0.62+0.38*sin(cvT*(0.8+fract(lpF)*2.0)+lpF*6.283);vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=lpS*1.6;}',
      fragmentShader: 'varying vec3 vC;varying float vA;void main(){vec2 q=abs(gl_PointCoord-vec2(.5))*2.0;float d=length(q);float a=(1.0-smoothstep(.12,.75,d))+0.6*(1.0-smoothstep(0.0,.16,min(q.x,q.y)))*(1.0-smoothstep(.3,1.0,max(q.x,q.y)));a=clamp(a,0.0,1.0)*vA;if(a<.01)discard;gl_FragColor=vec4(vC,a);\n#include <colorspace_fragment>\n}' });
    lpYildiz = new T.Points(g, m); lpYildiz.frustumCulled = false; lpYildiz.renderOrder = -9; scene.add(lpYildiz);
  }

  // ───────── zemin: yumuşak gece çimi (turkuaz-yeşil), yer yer açık lekeler ─────────
  {
    const c = cimDoku.image, g = c.getContext('2d'), w = c.width, h = c.height;
    const leke = (x, y, r) => { for (const ox of [0, -w, w]) for (const oy of [0, -h, h]) { if (x + ox < -r || x + ox > w + r || y + oy < -r || y + oy > h + r) continue; g.beginPath(); g.arc(x + ox, y + oy, r, 0, 7); g.fill(); } };
    g.globalAlpha = 1; g.fillStyle = '#42868a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) { g.fillStyle = ['#50a094', '#3c7e80', '#58a69a', '#447f88'][i % 4]; g.globalAlpha = 0.22; const x = R() * w, y = R() * h, r = 28 + R() * 50; leke(x, y, r); leke(x + r * 0.5, y + r * 0.3, r * 0.7); }
    for (let i = 0; i < 1600; i++) { g.fillStyle = ['#62b0a2', '#3a7c7c', '#6cbaaa', '#387478'][i % 4]; g.globalAlpha = 0.32; g.fillRect(R() * w, R() * h, 1.5, 2.5 + R() * 3); }
    for (let k = 0; k < 6; k++) { const cx = R() * w, cy = R() * h; for (let i = 0; i < 12; i++) { g.fillStyle = ['#fff4c0', '#ffb8d8', '#bff4ff'][(i + k) % 3]; g.globalAlpha = 0.85; leke(cx + (R() - 0.5) * 60, cy + (R() - 0.5) * 60, 1.4 + R() * 1.2); } }   // minik çiçekler
    g.globalAlpha = 1; cimDoku.needsUpdate = true;
    const p = zemin.geometry.attributes.position, cl = zemin.geometry.attributes.color;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), v = 0.94 + 0.06 * Math.sin(x * 0.021 + 1) * Math.cos(y * 0.017), q = 0.5 + 0.5 * Math.sin(x * 0.008 + 0.6) * Math.cos(y * 0.0065 - 0.4); cl.setXYZ(i, v * lerp(0.94, 1.0, q), v * lerp(0.98, 1.0, q), v * lerp(1.0, 0.96, q)); }
    cl.needsUpdate = true;
  }

  // ───────── uzak katman: yumuşak mor tepeler (tek çizim, sise erir) ─────────
  {
    let mx = 0, mz = 0; for (let i = 0; i < N; i++) { mx += PX[i] / N; mz += PZ[i] / N; }
    const B = cvYapi(); B.yer(0, 0, 0); const tepe = new T.SphereGeometry(1, 16, 6, 0, 6.2832, 0, Math.PI / 2);
    for (let k = 0; k < 22; k++) {
      const a = k / 22 * 6.2832 + 0.12, r = 300 + (k % 3) * 40, x = mx + Math.cos(a) * r, z = mz + Math.sin(a) * r;
      if (yakin(x, z) < 110) continue;
      const w = 50 + (k % 4) * 14, hh = 18 + (k % 5) * 7; B.ekle(tepe, x, -1, z, w, hh, w * (0.75 + (k % 3) * 0.12), [0x4a4a96, 0x55509e, 0x433f88][k % 3], 0, k * 0.8);
    }
    const g = B.geo(), bp = g.attributes.position, bc = g.attributes.color;
    for (let i = 0; i < bp.count; i++) { const t = clamp(bp.getY(i) / 50, 0, 1); bc.setXYZ(i, bc.getX(i) * (0.85 + t * 0.3), bc.getY(i) * (0.85 + t * 0.25), bc.getZ(i) * (0.9 + t * 0.2)); }
    const m = new T.Mesh(g, mat(0xffffff, { vertexColors: true })); m.frustumCulled = false; scene.add(m);
  }

  // ───────── süsler ─────────
  const S = cvYapi(), E = cvYapi(), golge = [], hale = [];
  const PEMBE = 0xff6fae, PEMBE_A = 0xffb6d6, TURKUAZ = 0x3fd4d0, TURKUAZ_A = 0xa6f0ea, SARI = 0xffd23f, KREM = 0xfff3dc, LACI = 0x2c3480, MOR = 0x8a6cd8;
  const AMPUL = [0xfff0a0, 0xffd0e6, 0xc8fff6];
  const lpYK = cvG.kutuY;   // yuvarlak köşeli tombul kutu (alttan üste ton geçişli)
  const yerVar = (x, z, r) => yakin(x, z) > YARI + 8 + r && cvBos(x, z, r);
  const iz = (x, z, rx, rz) => golge.push([x - 0.3, 0.02, z + 0.25, rx, 1, rz || rx, 0]);
  const isik = (x, z, r, renk) => hale.push([x, 0.03, z, r, 1, r, 0, renk]);
  const dilim = (n, ac) => { const g = new T.ConeGeometry(1, 1, ac, 1, true, 0, 6.2832 / n); return g; };
  const yanDilim = n => new T.CylinderGeometry(1, 1, 1, 3, 1, true, 0, 6.2832 / n);
  const ampul = new T.SphereGeometry(1, 6, 4), yuv = new T.CylinderGeometry(1, 1, 1, 40);

  // en boş iç alan noktası (dönme dolap için)
  const enBos = (x0, x1, z0, z1) => { let en = null, d = -1; for (let x = x0; x <= x1; x += 4) for (let z = z0; z <= z1; z += 4) { const y = yakin(x, z); if (y > d && cvBos(x, z, 20)) { d = y; en = [x, z]; } } return { x: en[0], z: en[1], d }; };
  let mx = 0, mz = 0; for (let i = 0; i < N; i++) { mx += PX[i] / N; mz += PZ[i] / N; }

  // ── 1) BÜYÜK DÖNME DOLAP (iç alanda, başlangıca dönük) ──
  {
    const yer = enBos(mx - 20, mx + 90, mz - 50, mz + 50), R0 = 15, HUB = 18.5;
    const ry = Math.atan2(PX[0] - 20 - yer.x, PZ[0] - yer.z);   // yüzü başlangıç düzlüğüne
    cvYasak.push([yer.x, yer.z, 20]);
    // ayaklar ve taban (sabit)
    S.yer(yer.x, yer.z, ry); E.yer(yer.x, yer.z, ry);
    S.ekle(yuv, 0, 0.04, 0, 15, 0.08, 15, 0xc8bce0); S.ekle(yuv, 0, 0.06, 0, 13.6, 0.08, 13.6, 0xe2d8f0);   // açık lila taş meydan
    S.ekle(yuv, 0, 0.35, 0, 8, 0.7, 6, LACI); S.ekle(yuv, 0, 0.78, 0, 7.4, 0.2, 5.4, TURKUAZ);
    for (const zz of [-2.6, 2.6]) for (const sx of [-1, 1]) { const a = Math.atan2(5.6, HUB); S.ekle(lpYK, sx * 2.8, HUB / 2, zz, 0.9, HUB / Math.cos(a) + 0.6, 0.9, 0xf4f2ff, 0, 0, sx * a); }
    for (const zz of [-2.6, 2.6]) {
      for (const q of [[5.5, 4.4], [11.5, 2.6]]) S.ekle(lpYK, 0, q[0], zz, q[1], 0.55, 0.55, q[0] < 6 ? PEMBE : TURKUAZ);   // ayakları bağlayan tombul çubuklar
      S.ekle(cvG.sil, 0, HUB, zz, 1.1, 0.9, 1.1, SARI, Math.PI / 2);
      for (const sx of [-1, 1]) for (let j = 1; j < 6; j++) { const u = j / 6; E.ekle(ampul, sx * 5.6 * (1 - u), HUB * u, zz + Math.sign(zz) * 0.5, 0.2, 0.2, 0.2, AMPUL[j % 3], 0, 0, 0, 0, 0, 1); }   // ayaklarda ampuller
    }
    S.ekle(lpYK, 0, 1.9, 3.6, 3.2, 2.4, 2.0, PEMBE_A); S.ekle(cvG.yarim, 0, 3.05, 3.6, 1.9, 0.8, 1.3, PEMBE);   // bilet kulübesi
    E.ekle(lpYK, 0, 1.7, 4.62, 1.6, 1.2, 0.06, 0xfff0b0);
    iz(yer.x, yer.z, 9, 7); isik(yer.x, yer.z, 16, 0xffb8e0);
    // dönen tekerlek (eksen = yerel z): göbek, iki çember, kollar, ara çubuklar
    const W = cvYapi(), WE = cvYapi(); W.yer(0, 0, 0); WE.yer(0, 0, 0);
    const cember = new T.TorusGeometry(R0, 0.32, 6, 64), ic = new T.TorusGeometry(R0 * 0.55, 0.2, 5, 40);
    W.ekle(cvG.sil, 0, 0, 0, 1.5, 4.2, 1.5, SARI, Math.PI / 2, 0, 0, 0, 1);
    for (const zz of [-1.25, 1.25]) {
      W.ekle(cember, 0, 0, zz, 1, 1, 1, PEMBE, 0, 0, 0, 0, 1); W.ekle(ic, 0, 0, zz, 1, 1, 1, KREM, 0, 0, 0, 0, 1);
      for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832; W.ekle(lpYK, Math.cos(a) * R0 / 2, Math.sin(a) * R0 / 2, zz, R0, 0.28, 0.28, KREM, 0, 0, a, 0, 1); }
    }
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832; W.ekle(cvG.sil, Math.cos(a) * R0, Math.sin(a) * R0, 0, 0.2, 2.6, 0.2, KREM, Math.PI / 2, 0, 0, 0, 1); }
    for (let k = 0; k < 48; k++) { const a = k / 48 * 6.2832, b = AMPUL[k % 3]; for (const zz of [-1.6, 1.6]) WE.ekle(ampul, Math.cos(a) * R0, Math.sin(a) * R0, zz, 0.3, 0.3, 0.3, b, 0, 0, 0, a, 1); }
    for (let k = 0; k < 12; k++) { const a = (k + 0.5) / 12 * 6.2832; for (const zz of [-1.5, 1.5]) WE.ekle(ampul, Math.cos(a) * R0 * 0.55, Math.sin(a) * R0 * 0.55, zz, 0.26, 0.26, 0.26, 0xfff0a0, 0, 0, 0, a + 1, 1); }
    WE.ekle(cvG.kure, 0, 0, 2.2, 0.8, 0.8, 0.4, 0xfff6c8, 0, 0, 0, 0, 1);
    // kabinler: askı noktası çemberde, kabin hep dik asılı (cvK.y = 2)
    const KR = [PEMBE, TURKUAZ, SARI, MOR];
    for (let k = 0; k < 12; k++) {
      const a = (k + 0.5) / 12 * 6.2832, x = Math.cos(a) * R0, y = Math.sin(a) * R0, c = KR[k % 4];
      W.ekle(cvG.sil, x, y - 0.6, 0, 0.09, 1.2, 0.09, KREM, 0, 0, 0, a, 2, R0);
      W.ekle(lpYK, x, y - 1.9, 0, 2.0, 1.4, 1.7, c, 0, 0, 0, a, 2, R0);
      W.ekle(cvG.yarim, x, y - 1.2, 0, 1.25, 0.65, 1.05, KREM, 0, 0, 0, a, 2, R0);
      W.ekle(cvG.sil, x, y - 2.6, 0, 1.0, 0.25, 0.85, 0xffffff, 0, 0, 0, a, 2, R0);
      WE.ekle(ampul, x, y - 0.7, 0, 0.18, 0.18, 0.18, 0xfff0a0, 0, 0, 0, a, 2, R0);
    }
    const wm = new T.Mesh(W.geo(), lpDonMalz('xy', 0.16, false, { emissive: 0x2a2050 })), we = new T.Mesh(WE.geo(), lpDonMalz('xy', 0.16, true));
    for (const m of [wm, we]) { m.position.set(yer.x, HUB, yer.z); m.rotation.y = ry; m.frustumCulled = false; scene.add(m); }
    // çevresinde iki ampul dizisi direği
    lpDonmeYer = yer;
  }

  // ── 2) ATLIKARINCA (sol yarıda, kendi çevresinde döner, atlar iner çıkar) ──
  {
    const yer = enBos(mx - 130, mx - 30, mz - 50, mz + 50), RR = 7;
    cvYasak.push([yer.x, yer.z, 11]);
    const K = cvYapi(), KE = cvYapi(); K.yer(0, 0, 0); KE.yer(0, 0, 0);
    // sabit taban (dönmez): basamak + turkuaz etek
    S.yer(yer.x, yer.z, 0);
    S.ekle(yuv, 0, 0.04, 0, RR + 6.5, 0.08, RR + 6.5, 0xc8bce0); S.ekle(yuv, 0, 0.06, 0, RR + 5.3, 0.08, RR + 5.3, 0xe2d8f0);
    S.ekle(yuv, 0, 0.3, 0, RR + 1.3, 0.6, RR + 1.3, LACI); S.ekle(yuv, 0, 0.62, 0, RR + 0.9, 0.12, RR + 0.9, KREM);
    iz(yer.x, yer.z, RR + 3); isik(yer.x, yer.z, RR + 6, 0xffe2a0);
    // dönen kısım: platform, orta sütun, çizgili tepe, saçak, direkler ve atlar
    K.ekle(yuv, 0, 0.95, 0, RR, 0.5, RR, PEMBE_A, 0, 0, 0, 0, 1);
    K.ekle(cvG.govdeK, 0, 4.2, 0, 1.6, 6.6, 1.6, SARI, 0, 0, 0, 0, 1);
    for (let k = 0; k < 8; k++) K.ekle(lpYK, Math.cos(k * 0.785) * 1.45, 4.2, Math.sin(k * 0.785) * 1.45, 0.25, 6.2, 0.6, k % 2 ? PEMBE : 0xffffff, 0, -k * 0.785, 0, 0, 1);
    const tepeD = dilim(16, 4), etek = yanDilim(16);
    for (let k = 0; k < 16; k++) {
      const ry = k / 16 * 6.2832, c = k % 2 ? PEMBE : KREM;
      K.ekle(tepeD, 0, 9.4, 0, RR + 0.9, 3.2, RR + 0.9, c, 0, ry, 0, 0, 1);
      K.ekle(etek, 0, 7.35, 0, RR + 0.9, 0.9, RR + 0.9, k % 2 ? KREM : TURKUAZ, 0, ry, 0, 0, 1);
      const a = -(k + 0.5) / 16 * 6.2832 + Math.PI / 2; K.ekle(cvG.yarim, Math.sin(a) * (RR + 0.85), 6.95, Math.cos(a) * (RR + 0.85), 0.62, 0.45, 0.25, k % 2 ? TURKUAZ : KREM, Math.PI, a, 0, 0, 1);
      KE.ekle(ampul, Math.sin(a) * (RR + 1.0), 7.85, Math.cos(a) * (RR + 1.0), 0.24, 0.24, 0.24, AMPUL[k % 3], 0, 0, 0, k, 1);
    }
    K.ekle(yuv, 0, 7.85, 0, RR + 0.95, 0.12, RR + 0.95, SARI, 0, 0, 0, 0, 1);
    K.ekle(cvG.sil, 0, 11.1, 0, 0.12, 0.8, 0.12, SARI, 0, 0, 0, 0, 1); KE.ekle(cvG.kure, 0, 11.6, 0, 0.45, 0.45, 0.45, 0xffe070, 0, 0, 0, 0, 1);
    // atlar: tombul gövde, yuvarlak baş, yele, eyer; direk sabit döner, at direğinde iner çıkar (cvK.y = 2)
    const AT = [0xffffff, 0xffe0ef, 0xd8fbf6, 0xfff2c8], YELE = [PEMBE, TURKUAZ, MOR, 0xff9a5a], EYER = [TURKUAZ, PEMBE, SARI, PEMBE];
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * 6.2832, r = RR - 1.6, x = Math.cos(a) * r, z = Math.sin(a) * r, ry = -a, f = k * 1.7;   // at yüzü dönme yönünde
      K.ekle(cvG.sil, x, 4.1, z, 0.1, 6.2, 0.1, SARI, 0, 0, 0, 0, 1);
      const ekle = (geo, lx, ly, lz, sx, sy, sz, renk, rx, rz) => { const ca = Math.cos(ry), sa = Math.sin(ry); K.ekle(geo, x + lx * ca + lz * sa, ly, z - lx * sa + lz * ca, sx, sy, sz, renk, rx || 0, ry, rz || 0, f, 2); };
      const c = AT[k % 4];
      ekle(cvG.kure, 0, 3.0, 0, 0.55, 0.55, 1.05, c);
      ekle(cvG.kure, 0, 3.75, 0.95, 0.32, 0.55, 0.32, c, -0.5);
      ekle(cvG.kure, 0, 4.15, 1.3, 0.34, 0.34, 0.55, c, 0.25);
      ekle(cvG.kureK, 0, 4.45, 0.95, 0.12, 0.42, 0.42, YELE[k % 4], -0.4);
      ekle(cvG.kureK, 0, 2.75, -1.1, 0.14, 0.5, 0.18, YELE[k % 4], 0.7);
      for (const sx of [-0.15, 0.15]) { ekle(cvG.kureK, sx * 1.6, 4.25, 1.75, 0.07, 0.08, 0.05, 0x2a2a48); ekle(cvG.koni, sx, 4.5, 1.15, 0.08, 0.22, 0.08, c); }
      ekle(cvG.yarim, 0, 3.42, -0.05, 0.6, 0.18, 0.55, EYER[k % 4]);
      for (const q of [[-0.28, 0.6, 0.6], [0.28, 0.6, -0.4], [-0.28, -0.55, -0.6], [0.28, -0.55, 0.5]]) ekle(lpYK, q[0], 2.35, q[1], 0.2, 0.9, 0.2, c, q[2]);
    }
    const km = new T.Mesh(K.geo(), lpDonMalz('xz', 0.42, false, { emissive: 0x2a2050 })), ke = new T.Mesh(KE.geo(), lpDonMalz('xz', 0.42, true));
    for (const m of [km, ke]) { m.position.set(yer.x, 0, yer.z); m.frustumCulled = false; scene.add(m); }
    lpKarincaYer = yer;
  }

  // ── 3) ÇİZGİLİ SİRK ÇADIRI (dışarıda, uzak bir virajın arkasında) ──
  const cadir = (x, z, s) => {
    const ry0 = Math.atan2(mx - x, mz - z); S.yer(x, z, ry0, s); E.yer(x, z, ry0, s);   // kapı iç alana (yola) bakar
    const tepeD = dilim(14, 3), duvar = yanDilim(14);
    for (let k = 0; k < 14; k++) {
      const ry = k / 14 * 6.2832;
      S.ekle(duvar, 0, 2.4, 0, 6.2, 4.8, 6.2, k % 2 ? 0xffffff : 0xff5f7e, 0, ry);
      S.ekle(tepeD, 0, 7.4, 0, 6.9, 5.2, 6.9, k % 2 ? 0xffffff : 0xff5f7e, 0, ry);
      const a = (k + 0.5) / 14 * 6.2832; S.ekle(cvG.yarim, Math.sin(a) * 6.75, 4.82, Math.cos(a) * 6.75, 0.85, 0.55, 0.32, k % 2 ? SARI : TURKUAZ, Math.PI, a);
    }
    S.ekle(yuv, 0, 4.82, 0, 6.85, 0.24, 6.85, SARI);
    S.ekle(cvG.sil, 0, 10.5, 0, 0.12, 2.4, 0.12, KREM); S.ekle(lpYK, 0.75, 11.3, 0, 1.4, 0.8, 0.08, TURKUAZ);
    S.ekle(lpYK, 0, 1.7, 6.0, 2.6, 3.4, 0.9, LACI); E.ekle(lpYK, 0, 1.6, 6.48, 1.9, 2.9, 0.06, 0xffd890);   // kapı aralığından sıcak ışık
    for (let k = 0; k < 14; k++) { const a = (k + 0.5) / 14 * 6.2832; E.ekle(ampul, Math.sin(a) * 7.0, 5.25, Math.cos(a) * 7.0, 0.22, 0.22, 0.22, AMPUL[k % 3], 0, 0, 0, 0, 0, 0.5); }
    E.ekle(cvG.kure, 0, 9.85, 0, 0.42, 0.42, 0.42, 0xfff0a0, 0, 0, 0, 0, 0, 1);
    const v = S.dunya(0, 7.5); isik(v.x, v.z, 5 * s, 0xffd890);
    iz(x, z, 8 * s); cvYasak.push([x, z, 8 * s]);
  };
  {
    const aday = []; for (let i = 0; i < N; i += 4) { const f = i / N; if (f < 0.12 || f > 0.9) continue; for (const yan of [-1, 1]) { const c = cvKenar(i, yan, YARI + 28); if (yakin(c.x, c.z) > YARI + 20 && cvBos(c.x, c.z, 12) && Math.hypot(c.x - mx, c.z - mz) > 90) aday.push([c.x, c.z, Math.hypot(c.x - mx, c.z - mz)]); } }
    aday.sort((a, b) => b[2] - a[2]); if (aday.length) cadir(aday[0][0], aday[0][1], 1.15);
  }

  // ── küçük kulübeler: pamuk şeker, balon, dondurma (tombul, çizgili tenteli) ──
  const kulube = (p, tur) => {
    S.yer(p.x, p.z, p.ry); E.yer(p.x, p.z, p.ry);
    const c1 = [PEMBE, TURKUAZ, SARI][tur], c2 = KREM;
    S.ekle(lpYK, 0, 1.0, 0, 3.4, 2.0, 2.4, [PEMBE_A, TURKUAZ_A, 0xfff0b8][tur]); S.ekle(lpYK, 0, 2.05, 0.95, 3.6, 0.3, 0.7, c2);
    for (const sx of [-1.55, 1.55]) S.ekle(cvG.sil, sx, 2.9, 0.9, 0.09, 1.8, 0.09, c2);
    for (let k = 0; k < 6; k++) S.ekle(lpYK, -1.6 + k * 0.64 + 0.32, 3.95, 0.2, 0.64, 0.32, 3.0, k % 2 ? c2 : c1, -0.32);
    for (let k = 0; k < 6; k++) S.ekle(cvG.yarim, -1.6 + k * 0.64 + 0.32, 3.55, 1.68, 0.32, 0.28, 0.14, k % 2 ? c1 : c2, Math.PI);
    S.ekle(lpYK, 0, 2.95, -1.0, 3.4, 1.9, 0.3, c1); for (const sx of [-1.58, 1.58]) S.ekle(lpYK, sx, 2.95, -0.25, 0.26, 1.9, 1.5, c1);   // arka ve yan duvarlar
    E.ekle(lpYK, 0, 2.9, -0.82, 2.7, 1.3, 0.05, 0xffe6b0);
    if (tur === 0) { S.ekle(cvG.koni, 0, 5.0, 0, 0.18, 1.2, 0.18, KREM, Math.PI); S.ekle(cvG.tacY, 0, 5.9, 0, 0.95, 0.85, 0.95, PEMBE_A); S.ekle(cvG.tacY, 0.45, 6.2, 0.1, 0.6, 0.55, 0.6, 0xffc8e2); }
    else if (tur === 1) { for (const q of [[-0.5, 6.0, PEMBE], [0.4, 6.4, TURKUAZ], [0, 6.9, SARI], [0.8, 5.7, MOR]]) { S.ekle(cvG.sil, q[0] * 0.5, 4.9, 0, 0.03, q[1] - 5.0, 0.03, KREM, 0, 0, q[0] * 0.2); S.ekle(cvG.tacY, q[0], q[1], 0, 0.5, 0.6, 0.5, q[2]); } }
    else { S.ekle(cvG.koni, 0, 4.9, 0, 0.55, 1.4, 0.55, 0xe8b070, Math.PI); S.ekle(cvG.tacY, 0, 5.85, 0, 0.62, 0.55, 0.62, PEMBE_A); S.ekle(cvG.tacY, 0, 6.35, 0, 0.5, 0.45, 0.5, 0xfff4e0); S.ekle(cvG.kureK, 0, 6.85, 0, 0.16, 0.16, 0.16, 0xff4a6a); }
    const v = S.dunya(0, 2.2); isik(v.x, v.z, 3.4, 0xffe2a0); iz(p.x, p.z, 2.6, 2);
  };
  // ── fener direkleri (yoldan ~9,5 m), sıcak yuvarlak ışıklı ──
  const fener = (x, z) => {
    S.yer(x, z, 0); E.yer(x, z, 0);
    S.ekle(cvG.sil, 0, 0.2, 0, 0.42, 0.4, 0.42, LACI); S.ekle(cvG.sil5, 0, 2.3, 0, 0.11, 4.2, 0.11, LACI); S.ekle(cvG.sil, 0, 4.35, 0, 0.36, 0.14, 0.36, SARI);
    E.ekle(cvG.kure, 0, 4.85, 0, 0.5, 0.52, 0.5, 0xfff0b8, 0, 0, 0, 0, 0, 0.5); S.ekle(cvG.yarimK, 0, 5.25, 0, 0.42, 0.24, 0.42, LACI);
    isik(x, z, 3.6, 0xffe0a0); iz(x, z, 0.8);
  };
  // ── ampul dizisi: iki direk arasında sarkan renkli ampuller ──
  const dizi = (x1, z1, x2, z2, h) => {
    for (const q of [[x1, z1], [x2, z2]]) { S.yer(q[0], q[1], 0); S.ekle(cvG.sil5, 0, h / 2, 0, 0.1, h, 0.1, KREM); S.ekle(cvG.kureK, 0, h + 0.1, 0, 0.18, 0.18, 0.18, PEMBE); iz(q[0], q[1], 0.6); }
    S.yer(0, 0, 0); E.yer(0, 0, 0);
    const l = Math.hypot(x2 - x1, z2 - z1), n = Math.max(6, Math.round(l / 1.6));
    for (let k = 1; k < n; k++) { const u = k / n, x = lerp(x1, x2, u), z = lerp(z1, z2, u), y = h - Math.sin(u * Math.PI) * Math.min(2.2, l * 0.1); E.ekle(ampul, x, y - 0.2, z, 0.3, 0.36, 0.3, AMPUL[k % 3], 0, 0, 0, 0, 0, 1); }
    for (let k = 0; k < 12; k++) { const u = (k + 0.5) / 12, u2 = (k + 1) / 12; const x = lerp(x1, x2, u), z = lerp(z1, z2, u), y = h - Math.sin(u * Math.PI) * Math.min(2.2, l * 0.1); S.ekle(cvG.kutu, x, y, z, 0.04, 0.04, l / 12 + 0.05, LACI, 0, Math.atan2(x2 - x1, z2 - z1), 0); void u2; }
  };
  // ── balon demeti (yerde ağırlıklı, sakin) ──
  const balon = (x, z) => {
    S.yer(x, z, R() * 6);
    S.ekle(lpYK, 0, 0.25, 0, 0.6, 0.5, 0.6, LACI);
    [[0, 4.2, 0, PEMBE], [0.7, 3.8, 0.2, TURKUAZ], [-0.6, 3.9, -0.1, SARI], [0.15, 4.9, -0.4, MOR], [-0.2, 3.5, 0.6, 0xff9a5a]].forEach(q => { S.ekle(cvG.sil5, q[0] / 2, q[1] / 2, q[2] / 2, 0.02, q[1] - 0.4, 0.02, KREM, q[2] * 0.25, 0, -q[0] * 0.2); S.ekle(cvG.tacY, q[0], q[1], q[2], 0.48, 0.58, 0.48, q[3]); S.ekle(cvG.koni, q[0], q[1] - 0.6, q[2], 0.1, 0.14, 0.1, q[3], Math.PI); });
    iz(x, z, 1.2);
  };
  // ── yuvarlak budanmış çalılar (turkuaz-yeşil, minik ışıklı) ──
  const cali = (x, z, s) => {
    S.yer(x, z, R() * 6, s);
    S.ekle(cvG.sil, 0, 0.35, 0, 0.9, 0.7, 0.9, 0x9a86d0); S.ekle(cvG.tacY, 0, 1.5, 0, 1.25, 1.1, 1.25, 0x3fa890); S.ekle(cvG.tacY, 0.35, 1.85, 0.2, 0.7, 0.6, 0.7, 0x56bca2);
    E.yer(x, z, 0, s); for (let k = 0; k < 5; k++) { const a = k * 1.3 + R(); E.ekle(cvG.kureK, Math.cos(a) * 1.2, 1.2 + (k % 3) * 0.35, Math.sin(a) * 1.2, 0.17, 0.17, 0.17, AMPUL[k % 3], 0, 0, 0, 0, 0, 1); }
    iz(x, z, 1.3 * s);
  };

  const koy = (f, yan, uz, r) => {
    for (const q of [[0, yan, 0], [0, yan, 5], [0.012, yan, 3], [-0.012, yan, 3], [0.024, yan, 8]]) {
      const c = cvKenar(cvI(f + q[0]), q[1], YARI + uz + q[2], 0.5), x = c.x, z = c.z, ry = c.ry;
      if (yerVar(x, z, r)) { cvYasak.push([x, z, r]); return { x, z, ry }; }
    }
    return null;
  };
  let p;
  // kulübeler: seyrek, başlangıçtan uzak
  [[0.16, 1, 0], [0.3, -1, 1], [0.45, 1, 2], [0.6, -1, 0], [0.74, 1, 1], [0.86, -1, 2]].forEach(q => { if ((p = koy(q[0], q[1], 11, 3))) kulube(p, q[2]); });
  // fenerler: seyrek, iki yanda sırayla
  { let k = 0; for (let i = 40; i < N - 30; i += 58) { const c = cvKenar(i, k % 2 ? 1 : -1, YARI + 9.5), x = c.x, z = c.z; if (yerVar(x, z, 0.6)) { cvYasak.push([x, z, 1.2]); fener(x, z); } k++; } }
  // ampul dizileri: atlıkarıncanın ve dönme dolabın çevresinde, yoldan uzak
  if (typeof lpKarincaYer !== 'undefined' && lpKarincaYer) { const y = lpKarincaYer; for (const a of [0.4, 2.5, 4.6]) { const x1 = y.x + Math.cos(a) * 12.5, z1 = y.z + Math.sin(a) * 12.5, x2 = y.x + Math.cos(a + 1.2) * 12.5, z2 = y.z + Math.sin(a + 1.2) * 12.5; if (yakin(x1, z1) > YARI + 10 && yakin(x2, z2) > YARI + 10) dizi(x1, z1, x2, z2, 4.6); } }
  if (typeof lpDonmeYer !== 'undefined' && lpDonmeYer) { const y = lpDonmeYer; for (const a of [1.2, 3.6, 5.4]) { const x1 = y.x + Math.cos(a) * 14, z1 = y.z + Math.sin(a) * 14, x2 = y.x + Math.cos(a + 0.9) * 14, z2 = y.z + Math.sin(a + 0.9) * 14; if (yakin(x1, z1) > YARI + 10 && yakin(x2, z2) > YARI + 10) dizi(x1, z1, x2, z2, 5); } }
  // balon demetleri ve çalılar: seyrek, yoldan 10 m+ uzakta
  for (const q of [[0.22, -1, 13], [0.52, 1, 14], [0.8, -1, 13], [0.38, 1, 16]]) if ((p = koy(q[0], q[1], q[2], 1.5))) balon(p.x, p.z);
  for (let i = 20; i < N; i += 26) for (const yan of [-1, 1]) { const f = i / N; if (f < 0.05 || f > 0.95 || R() < 0.55) continue; const c = cvKenar(i + ((R() * 6) | 0), yan, YARI + 12 + R() * 14), x = c.x, z = c.z, s = 0.9 + R() * 0.5; if (yerVar(x, z, 1.4 * s)) { cvYasak.push([x, z, 1.4 * s]); cali(x, z, s); } }
  // uzak çalılar ve ağaççıklar (iç ve dış alanda sakin doku)
  for (let k = 0; k < 70; k++) { const x = mx - 230 + R() * 460, z = mz - 200 + R() * 400, s = 1.1 + R() * 0.9; if (yakin(x, z) > YARI + 22 + s * 2 && cvBos(x, z, 2 * s)) { cvYasak.push([x, z, 2 * s]); S.yer(x, z, R() * 6, s); S.ekle(cvG.sil, 0, 0.9, 0, 0.25, 1.8, 0.25, 0x6a4a7a); S.ekle(cvG.tacY, 0, 2.6, 0, 1.4, 1.5, 1.4, [0x3fa890, 0x48b098, 0x379a86][k % 3]); iz(x, z, 1.4 * s);
    if (k % 3 === 0) { E.yer(x, z, 0, s); for (let j = 0; j < 7; j++) { const a = j * 0.9, y = 1.6 + j * 0.24; E.ekle(cvG.kureK, Math.cos(a) * 1.38 * Math.sqrt(1 - Math.pow((y - 2.6) / 1.55, 2)), y, Math.sin(a) * 1.38 * Math.sqrt(1 - Math.pow((y - 2.6) / 1.55, 2)), 0.17, 0.17, 0.17, AMPUL[j % 3], 0, 0, 0, 0, 0, 1); } isik(x, z, 3.2 * s, 0xffe0a0); } } }

  // ── birleşik meshler ──
  { const g = S.geo(), p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { const k = 0.82 + 0.18 * clamp(p.getY(i) / 6, 0, 1); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); }   // ton geçişi: dipte biraz koyu
    const sm = new T.Mesh(g, cvMalz(0, { side: T.DoubleSide, emissive: 0x1c1640 })); sm.frustumCulled = false; scene.add(sm); }
  const emM = new T.MeshBasicMaterial({ vertexColors: true });   // ampuller: cvK.z = 1 olanlar yumuşakça sırayla yanıp söner, 0,5 olanlar ağır nabız
  emM.onBeforeCompile = sh => {
    sh.uniforms.cvT = cvZ;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float cvT;\nattribute vec3 cvK;')
      .replace('#include <color_vertex>', 'vColor = color;\nfloat lpP = position.x * 0.53 + position.z * 0.41;\nfloat lpY = step(0.75, cvK.z) * (0.62 + 0.42 * smoothstep(-0.3, 0.7, sin(cvT * 2.4 + lpP))) + step(0.25, cvK.z) * (1.0 - step(0.75, cvK.z)) * (0.84 + 0.18 * sin(cvT * 1.3 + lpP));\nvColor *= mix(1.0, lpY, step(0.25, cvK.z));');
  };
  emM.customProgramCacheKey = () => 'lpIsik';
  { const em = new T.Mesh(E.geo(), emM); em.frustumCulled = false; scene.add(em); }
  { // yerde sıcak ışık havuzları ve yumuşak temas gölgeleri (her biri tek çizim)
    const g = new T.PlaneGeometry(2, 2); g.rotateX(-Math.PI / 2);
    const hd = tuvalDoku(64, 64, (c, w, h) => { const r = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,.62)'); r.addColorStop(0.4, 'rgba(255,255,255,.3)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); });
    const hm = cok(g, new T.MeshBasicMaterial({ map: hd, transparent: true, depthWrite: false }), hale); hm.renderOrder = 1;
    const gd = tuvalDoku(64, 64, (c, w, h) => { const r = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(30,26,80,.38)'); r.addColorStop(0.45, 'rgba(30,26,80,.2)'); r.addColorStop(1, 'rgba(30,26,80,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); });
    const gm = cok(g, new T.MeshBasicMaterial({ map: gd, transparent: true, depthWrite: false }), golge); gm.renderOrder = 2;
  }

  // ── havai fişek: bitiş çizgisinin ilerisinde, sağda gökte; ara sıra tek tek açılan küçük, yumuşak çiçekler (tek nokta bulutu) ──
  {
    const PAT = 5, NP = 72, say = PAT * NP, p = new Float32Array(say * 3), yon = new Float32Array(say * 3), ev = new Float32Array(say * 2), c = new Float32Array(say * 3);
    const RENK = [[1, 0.78, 0.2], [1, 0.35, 0.65], [0.25, 0.9, 0.9], [1, 0.55, 0.85], [0.7, 0.5, 1]];
    for (let k = 0; k < PAT; k++) {
      const ileri = 75 + k * 14 + R() * 10, yan = 40 + ((k * 37) % 45), cx = PX[0] + TX[0] * ileri - TZ[0] * yan, cz = PZ[0] + TZ[0] * ileri + TX[0] * yan, cy = 52 + (k % 3) * 9;
      const q = RENK[k % 5], q2 = RENK[(k + 2) % 5];
      for (let j = 0; j < NP; j++) {
        const i = k * NP + j, u = (j + 0.5) / NP, th = Math.acos(1 - 2 * u), ph = j * 2.39996;
        p[i * 3] = cx; p[i * 3 + 1] = cy; p[i * 3 + 2] = cz;
        yon[i * 3] = Math.sin(th) * Math.cos(ph); yon[i * 3 + 1] = Math.cos(th); yon[i * 3 + 2] = Math.sin(th) * Math.sin(ph);
        ev[i * 2] = k * 3.1; ev[i * 2 + 1] = 15.5;
        const z = j % 4 === 0 ? q2 : q; c[i * 3] = z[0]; c[i * 3 + 1] = z[1]; c[i * 3 + 2] = z[2];
      }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3)); g.setAttribute('lpY', new T.BufferAttribute(yon, 3)); g.setAttribute('lpE', new T.BufferAttribute(ev, 2)); g.setAttribute('lpC', new T.BufferAttribute(c, 3));
    const m = new T.ShaderMaterial({ uniforms: { cvT: cvZ }, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: 'attribute vec3 lpY;attribute vec2 lpE;attribute vec3 lpC;uniform float cvT;varying vec3 vC;varying float vA;void main(){float u=mod(cvT+lpE.x,lpE.y);float r=10.0*(1.0-exp(-u*2.4));vec3 q=position+lpY*r+vec3(0.0,-0.9*u*u,0.0);vA=smoothstep(0.0,0.08,u)*(1.0-smoothstep(1.0,2.1,u));vC=pow(mix(vec3(1.0,0.95,0.8),lpC,smoothstep(0.0,0.2,u)),vec3(2.2));vec4 mv=modelViewMatrix*vec4(q,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=vA>0.0?(2.2-u*0.6)*900.0/-mv.z:0.0;}',
      fragmentShader: 'varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-vec2(.5))*2.0;float a=(1.0-smoothstep(0.1,1.0,d))*vA;if(a<.01)discard;gl_FragColor=vec4(vC*a*0.85,a);\n#include <colorspace_fragment>\n}' });
    const fp = new T.Points(g, m); fp.frustumCulled = false; fp.renderOrder = 3; scene.add(fp);
  }
}
var lpDonmeYer, lpKarincaYer;   // (iki manzara anının yeri; ampul dizileri kullanır)
