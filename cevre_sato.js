/* Şato ve Ejderha Vadisi pistinin çevresi (yalnız ?pist=sato iken yüklenir, cevre.js'ten sonra).
   cevre.js ortak tabanı kurar (gök dokusu, sis, ışıklar cvGokIsik + gunes, zemin `zemin` + `cimDoku`); bu dosya onları masal vadisine çevirir.
   Üç "manzara anı": (1) iç tepede tombul kuleli, konik çatılı, bayrakları dalgalanan şato; (2) şatonun yanında oturan peluş ejderha Pırıl
   (yavaşça kanat çırpar, kuyruk sallar) ve şatonun çevresinde ağır ağır süzülen küçük kardeşi; (3) yolun üstünden geçilen iki kuleli taş kemer.
   Renkler: yeşil çimen, taş grisi-krem, kırmızı/mavi bayrak ve çatılar (+ Pırıl'ın moru). Yola en yakın şerit (YARI + ~9,5 m) boş.
   Yeni üst düzey adlar `st` ile başlar. Bütün yerler yol verisinden hesaplanır. Hareket gölgelendiricide; kare başına yalnız uçan ejderhanın dönüşü. */
'use strict';

let stUcan = null;
function cevreEkGuncelle(dt, t) {
  if (stUcan) stUcan.rotation.y = -t * 0.07;
}
if (cvTema === 'sato') {
  scene.fog.color.set(0xf1f2dc); scene.fog.near = 320; scene.fog.far = 960;
  gunes.color.set(0xffe9bf);
  { // gök: yukarıda masmavi, ufka doğru yumuşak altın pus
    const c = scene.background.image, g = c.getContext('2d'), h = c.height, gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#2f86e0'); gr.addColorStop(0.24, '#5eacee'); gr.addColorStop(0.4, '#a6d6f4'); gr.addColorStop(0.49, '#e6f2e2'); gr.addColorStop(0.56, '#fff0c8'); gr.addColorStop(0.72, '#fff5dc'); gr.addColorStop(1, '#fff5dc');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, h); scene.background.needsUpdate = true;
  }
  let stT = 70913; const Rs = () => { stT = (stT * 1664525 + 1013904223) >>> 0; return stT / 4294967296; };   // kendi sayı üreteci: ortak R() sırası bozulmaz
  { // zemin: sıcak, sarıya çalan yumuşak yeşil çimen
    const c = cimDoku.image, g = c.getContext('2d'), w = c.width, h = c.height;
    g.globalAlpha = 0.3; g.fillStyle = '#7cc650'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 24; i++) { const x = Rs() * w, y = Rs() * h, r = 18 + Rs() * 30; g.globalAlpha = 1; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r * 1.3); gr.addColorStop(0, i % 3 ? 'rgba(70,160,60,.14)' : 'rgba(230,214,120,.16)'); gr.addColorStop(1, 'rgba(70,160,60,0)'); g.fillStyle = gr; g.fillRect(x + ox - r * 1.3, y + oy - r * 1.3, r * 2.6, r * 2.6); } }
    g.globalAlpha = 1; cimDoku.needsUpdate = true;
    const p = zemin.geometry.attributes.position, col = zemin.geometry.attributes.color;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = -p.getY(i) - 70, d = yakin(x, z), u = clamp((d - YARI - 4) / 34, 0, 1), y = clamp((d - 60) / 260, 0, 1), v = 0.97 + 0.04 * Math.sin(x * 0.019 + z * 0.023);
      col.setXYZ(i, lerp(lerp(1.07, 0.98, u), 0.92, y) * v, lerp(lerp(1.0, 1.01, u), 0.99, y) * v, lerp(lerp(0.8, 0.86, u), 0.94, y) * v);
    }
    col.needsUpdate = true;
  }

  // ───────── ortak parçalar ─────────
  const S = cvYapi(), PI = Math.PI;
  const s = (g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt, kz, ke) => S.ekle(g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt || 0, kz || 0, ke || 0);
  // hareket: cvK.x = kanat çırpma (yalnız yukarı, yavaş), cvK.y = bayrak dalgası, cvK.z = kuyruk sallama / hafif salınım (metre)
  const stHar = cvHAREKET.length;
  cvHAREKET.push('transformed.y += cvK.x * (0.5 + 0.5 * sin(cvT * 2.1)); transformed.y += cvK.y * sin(cvT * 5.0 + position.x * 0.9 + position.z * 0.8) * 0.2;\ntransformed.x += cvK.z * sin(cvT * 1.7); transformed.z += cvK.z * cos(cvT * 1.7) * 0.4;');
  const stUcHar = cvHAREKET.length;   // uçan ejderha (kopya): kanat uçları ağır ağır iner kalkar, gövde hafifçe süzülür
  cvHAREKET.push('#ifdef USE_INSTANCING\ntransformed.y += max(0.0, abs(position.x) - 0.7) * sin(cvT * 3.0) * 0.5 + sin(cvT * 1.1) * 0.25;\n#endif');
  // bombeli kule gövdesi (alttan üste ton geçişi), hafif içe kıvrık konik çatı, saçak halkası
  const kule = (() => { const g = new T.CylinderGeometry(1, 1, 1, 18, 4), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = 1 + 0.05 * (1 - 4 * y * y) + 0.04 * (0.5 - y) * 0.6; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.computeVertexNormals(); g.userData.cvTon = true; return g; })();
  const cati = (() => { const g = new T.ConeGeometry(1, 1, 18, 5), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = p.getY(i) + 0.5, k = t < 1 ? Math.pow(1 - t, 1.35) / (1 - t) : 0; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.computeVertexNormals(); g.userData.cvTon = true; return g; })();
  const halka = new T.CylinderGeometry(1, 1, 1, 18, 1); halka.userData.cvTon = true;
  const yuvarlak = cvG.kutuY;
  const stTepeGeo = (() => { const g = cvG.yarim.clone(), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.min(1, Math.hypot(x, z)); p.setY(i, 0.5 + 0.5 * Math.cos(PI * r)); } g.computeVertexNormals(); return g; })();   // yumuşak, çan biçimli tümsek (dipte sert kenar yok)
  const tepeY = (d, R, H) => H * (0.5 + 0.5 * Math.cos(PI * Math.min(1, d / R)));   // yuvarlak köşeli tombul kutu
  const TAS = [0xe9e0cc, 0xdcd2bd, 0xd0c5ae, 0xf2ebdb], KIRMIZI = 0xe0483e, MAVI = 0x3f82dc, ALTIN = 0xffd23f, AHSAP = 0xa8743f, PENCERE = 0x4b3f5c, KREM = 0xfaf3e2;
  const MOR = 0xb28ae6, MORA = 0xd2b6f7, MORK = 0x8660c4, LIME = 0xc9ea52, IBIK = 0x46a83e, GOZ = 0x1c1228, IRIS = 0x4fae37, YANAK = 0xff8cc6, BEYAZ = 0xffffff;
  const golge = [], agac = [], servi = [], cali = [], tepe = [], kaya = [];
  const yerBul = (f, yan, uz, r) => {
    for (let k = 0; k < 13; k++) {
      const i = cvI(f + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.006), p = cvKenar(i, yan, uz, 0.25), x = p.x, z = p.z, ry = p.ry;
      if (yakin(x, z) > YARI + 3.4 + r && cvBos(x, z, r)) { cvYasak.push([x, z, r + 1]); return { x, z, ry, i }; }
    }
    return null;
  };
  // kuyruklu bayrak: üç parçalı (uca doğru daha çok dalgalanır), direk + altın top
  const bayrak = (x, y, z, b, c, ry) => {
    s(cvG.sil, x, y + 1.3 * b, z, 0.07 * b, 2.6 * b, 0.07 * b, KREM); s(cvG.kure, x, y + 2.68 * b, z, 0.16 * b, 0.16 * b, 0.16 * b, ALTIN);
    const ca = Math.cos(ry || 0), sa = Math.sin(ry || 0);
    for (let k = 0; k < 3; k++) { const u = (k + 0.5) / 3, l = 0.5 * b, hh = (0.9 - 0.22 * k) * b; s(yuvarlak, x + ca * (0.08 * b + u * 1.5 * b), y + 2.2 * b - k * 0.04 * b, z - sa * (0.08 * b + u * 1.5 * b), l + 0.04 * b, hh, 0.09 * b, c, 0, ry || 0, 0, 0, 0.25 + 0.55 * u * b); }
  };
  // tombul taş kule: taban halkası, bombeli gövde, mazgallı üst halka, konik çatı, bayrak
  const kuleKur = (x, y0, z, r, h, renk, bry, pencere) => {
    s(halka, x, y0 + 0.6, z, r * 1.12, 1.2, r * 1.12, TAS[2]);
    s(kule, x, y0 + h / 2, z, r, h, r, TAS[0]);
    s(halka, x, y0 + h + 0.35, z, r * 1.18, 0.9, r * 1.18, TAS[3]);
    const n = Math.max(6, Math.round(r * 3)); for (let k = 0; k < n; k++) { const a = k / n * PI * 2; s(yuvarlak, x + Math.sin(a) * r * 1.08, y0 + h + 1.1, z + Math.cos(a) * r * 1.08, r * 0.42, 0.85, 0.55, TAS[k % 2 ? 3 : 1], 0, a); }
    s(cati, x, y0 + h + 1.0 + r * 1.05, z, r * 1.3, r * 2.1, r * 1.3, renk);
    s(halka, x, y0 + h + 1.05, z, r * 1.32, 0.3, r * 1.32, renk === KIRMIZI ? 0xc23a32 : 0x346fc0);
    s(cvG.kure, x, y0 + h + 1.0 + r * 2.1 + 0.15, z, 0.3, 0.3, 0.3, ALTIN);
    bayrak(x, y0 + h + 1.0 + r * 2.1 + 0.2, z, Math.max(1, r * 0.45), renk === KIRMIZI ? MAVI : KIRMIZI, bry);
    if (pencere) for (const [a, yy] of pencere) { const px = x + Math.sin(a) * r * 1.02, pz = z + Math.cos(a) * r * 1.02, w = Math.min(0.8, r * 0.28); s(yuvarlak, px, y0 + yy, pz, w * 1.5, w * 2.6, 0.5, KREM, 0, a); s(yuvarlak, px + Math.sin(a) * 0.12, y0 + yy, pz + Math.cos(a) * 0.12, w, w * 2.0, 0.4, PENCERE, 0, a); s(cvG.kure, px + Math.sin(a) * 0.14, y0 + yy + w, pz + Math.cos(a) * 0.14, w * 0.5, w * 0.5, 0.22, PENCERE, 0, a); }
  };
  // ejderha (yerel: +z ileri, oturma boyu ~2,9). e = ekle, k = dünya ölçeği (hareket metre cinsinden), kanatAc: kanat açıklığı
  const ejderKur = (e, k, ana, acik, koyu, karin, kanatAc, kuyrukSal) => {
    e(cvG.tacY, 0, 1.05, 0, 0.98, 1.08, 0.88, ana); e(cvG.tacY, 0, 1.0, 0.4, 0.7, 0.85, 0.52, karin);   // armut gövde + açık karın
    for (let j = 0; j < 4; j++) e(cvG.kureK, 0, 0.55 + j * 0.3, 0.86 - Math.abs(j - 1.5) * 0.04, 0.5 - Math.abs(j - 1.5) * 0.08, 0.05, 0.1, 0xb5d93e);   // karın çizgileri
    for (const q of [-1, 1]) {
      e(cvG.tacY, q * 0.55, 0.45, 0.15, 0.42, 0.42, 0.55, ana); e(cvG.tacY, q * 0.5, 0.17, 0.62, 0.32, 0.2, 0.4, ana);   // oturan bacaklar + ayaklar
      for (let j = -1; j <= 1; j++) e(cvG.kureK, q * 0.5 + j * 0.13, 0.12, 0.98, 0.07, 0.07, 0.06, KREM);
      e(cvG.tacY, q * 0.74, 1.2, 0.42, 0.18, 0.34, 0.2, ana, 0.5, 0, -q * 0.35);   // kısa kollar
    }
    // baş: yuvarlak, kocaman gözler, gülümseme, pembe yanak, krem boynuzlar
    const hy = 2.32;
    e(cvG.tacY, 0, hy, 0.12, 0.8, 0.7, 0.74, ana); e(cvG.tacY, 0, hy - 0.2, 0.62, 0.52, 0.38, 0.4, acik);
    for (const q of [-1, 1]) {
      e(cvG.kureK, q * 0.17, hy - 0.12, 1.0, 0.05, 0.04, 0.03, koyu);   // burun delikleri
      e(cvG.tacY, q * 0.32, hy + 0.14, 0.64, 0.21, 0.25, 0.12, BEYAZ); e(cvG.tacY, q * 0.33, hy + 0.12, 0.72, 0.14, 0.17, 0.06, IRIS); e(cvG.tacY, q * 0.33, hy + 0.11, 0.76, 0.08, 0.1, 0.04, GOZ);
      e(cvG.kureK, q * 0.33 + 0.05, hy + 0.2, 0.79, 0.045, 0.045, 0.02, BEYAZ);
      e(cvG.tacY, q * 0.56, hy - 0.12, 0.6, 0.13, 0.08, 0.05, YANAK, 0, q * 0.6);
      e(cvG.koni, q * 0.3, hy + 0.66, -0.05, 0.11, 0.42, 0.11, KREM, -0.25, 0, -q * 0.3); e(cvG.kureK, q * 0.37, hy + 0.86, -0.1, 0.07, 0.07, 0.07, KREM);
    }
    for (let j = 0; j < 7; j++) { const a = (j - 3) * 0.2; e(cvG.kureK, Math.sin(a) * 0.34, hy - 0.4 + (1 - Math.cos(a)) * 0.55, 1.0 - (1 - Math.cos(a)) * 0.45, 0.07, 0.045, 0.04, koyu); }   // gülümseme
    // ibik: başın tepesinden sırta yeşil yuvarlak dikenler
    for (let j = 0; j < 7; j++) { const u = j / 6, y = hy + 0.62 - u * 1.9, z = -0.15 - Math.sin(u * 2.4) * 0.7, b = 0.2 - u * 0.06; e(cvG.koni, 0, y, z, b * 0.7, b * 1.6, b, IBIK, -0.6 - u * 0.9, 0, 0); }
    // kanatlar: üç parmaklı, açık mor zar + koyu kemik; uçlara doğru daha çok çırpar
    for (const q of [-1, 1]) for (let j = 0; j < 3; j++) {
      const a = 0.25 + j * 0.42, L = (1.15 - j * 0.18) * kanatAc;
      e(cvG.tacY, q * (0.6 + Math.cos(a) * L * 0.55), 1.65 + Math.sin(a) * L * 0.55, -0.5, L * 0.55, 0.26, 0.07, acik, 0, 0, q * a, (0.12 + 0.25 * j) * k * kanatAc * 0.5);
      e(cvG.kure, q * (0.6 + Math.cos(a) * L * 0.55), 1.68 + Math.sin(a) * L * 0.55, -0.47, L * 0.55, 0.05, 0.05, koyu, 0, 0, q * a, (0.12 + 0.25 * j) * k * kanatAc * 0.5);
    }
    // kuyruk: kalınlıktan inceye kıvrılır, ucunda yeşil kalp-maça
    for (let j = 0; j <= 7; j++) { const u = j / 7, x = Math.sin(u * 2.2) * 1.3, z = -0.7 - Math.sin(u * 1.6) * 1.1, r = 0.36 - u * 0.24; e(cvG.tacY, x, 0.28 + u * 0.15, z, r, r * 0.9, r, ana, 0, 0, 0, 0, 0, kuyrukSal * u * u * k); }
    e(cvG.okt, Math.sin(2.2) * 1.3 + 0.25, 0.48, -0.7 - Math.sin(1.6) * 1.1, 0.26, 0.08, 0.22, IBIK, 0, 0.6, 0, 0, 0, kuyrukSal * k);
  };

  // ───────── 1 · iç tepedeki şato ─────────
  let mx = 0, mz = 0; for (let i = 0; i < N; i++) { mx += PX[i] / N; mz += PZ[i] / N; }
  const icinde = (x, z) => { let ic = false; for (let i = 0, j = N - 1; i < N; j = i++) if ((PZ[i] > z) !== (PZ[j] > z) && x < (PX[j] - PX[i]) * (z - PZ[i]) / (PZ[j] - PZ[i]) + PX[i]) ic = !ic; return ic; };
  let sx0 = mx, sz0 = mz, sd = 0;
  for (let x = mx - 120; x <= mx + 120; x += 4) for (let z = mz - 90; z <= mz + 90; z += 4) { if (!icinde(x, z)) continue; const d = yakin(x, z); if (d > sd) { sd = d; sx0 = x; sz0 = z; } }
  { // tepe: geniş, yumuşak çimen tümsek; şato tepede, kapısı en yakın yola bakar
    let en = 1e9, ni = 0; for (let i = 0; i < N; i++) { const d = Math.hypot(PX[i] - sx0, PZ[i] - sz0); if (d < en) { en = d; ni = i; } }
    const ry = Math.atan2(PX[ni] - sx0, PZ[ni] - sz0), HR = Math.max(30, sd - 10), HH = 8, SK = 1.35, Y = (HH - 0.25) / SK;
    cvYasak.push([sx0, sz0, HR + 2]);
    tepe.push([sx0, -0.2, sz0, HR, HH, HR * 0.95, ry, 0x7fca5c]);
    tepe.push([sx0 + Math.sin(ry + 2.4) * HR * 0.55, -0.2, sz0 + Math.cos(ry + 2.4) * HR * 0.55, HR * 0.55, HH * 0.75, HR * 0.5, ry, 0x74c254]);
    S.yer(sx0, sz0, ry, SK);
    // sur duvarları (dört köşe kulesi arası) + mazgallar
    const A = 9.5, DH = 7.5;
    for (const [x1, z1, x2, z2] of [[-A, A, A, A], [A, A, A, -A], [A, -A, -A, -A], [-A, -A, -A, A]]) {
      const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, L = Math.hypot(x2 - x1, z2 - z1), a = Math.atan2(x2 - x1, z2 - z1);
      s(yuvarlak, cx, Y + DH / 2 - 0.4, cz, 2.4, DH, L, TAS[1], 0, a);
      for (let k = 0; k < 7; k++) { const u = (k + 0.5) / 7 - 0.5, ox = Math.sin(a) * u * L * 0.86, oz = Math.cos(a) * u * L * 0.86, nx = Math.cos(a), nz = -Math.sin(a); for (const q of [-1, 1]) s(yuvarlak, cx + ox + nx * q * 0.85, Y + DH + 0.05, cz + oz + nz * q * 0.85, 0.7, 1.0, 1.1, TAS[(k + (q > 0 ? 1 : 0)) % 2 ? 3 : 0], 0, a); }
    }
    // kapı (yola bakan duvarda): taş çerçeve, kemerli tahta kapı, üstünde kırmızı-mavi flama
    s(yuvarlak, 0, Y + 2.6, A + 0.9, 5.4, 5.6, 0.9, TAS[3]); s(cvG.sil, 0, Y + 5.3, A + 0.9, 2.7, 0.9, 2.7, TAS[3], PI / 2);
    s(yuvarlak, 0, Y + 2.0, A + 1.25, 3.4, 4.0, 0.5, AHSAP); s(cvG.sil, 0, Y + 4.0, A + 1.25, 1.7, 0.5, 1.7, AHSAP, PI / 2);
    for (const q of [-0.6, 0.6]) s(yuvarlak, q, Y + 2.5, A + 1.55, 0.12, 4.4, 0.12, 0x8a5c30);
    s(cvG.kure, 0.95, Y + 2.2, A + 1.55, 0.16, 0.16, 0.12, ALTIN);
    for (const q of [-1, 1]) { s(yuvarlak, q * 3.6, Y + 4.4, A + 1.35, 1.5, 3.4, 0.25, q > 0 ? MAVI : KIRMIZI, 0, 0, 0, 0, 0.12); s(cvG.ucgen, q * 3.6, Y + 2.35, A + 1.35, 0.75, 0.9, 0.18, q > 0 ? MAVI : KIRMIZI, PI, 0, 0, 0, 0.12); s(cvG.kure, q * 3.6, Y + 4.6, A + 1.5, 0.35, 0.35, 0.12, ALTIN); }
    // köşe kuleleri (öndekiler kırmızı, arkadakiler mavi çatılı) + iç kule (ana kule ve ince yan kule)
    const bry = 1.2;
    kuleKur(-A, Y, A, 3.0, 11.5, KIRMIZI, bry, [[0, 6.5], [0.9, 9]]); kuleKur(A, Y, A, 3.0, 11.5, KIRMIZI, bry, [[0, 6.5], [-0.9, 9]]);
    kuleKur(-A, Y, -A, 2.8, 12.5, MAVI, bry, [[-0.8, 8]]); kuleKur(A, Y, -A, 2.8, 12.5, MAVI, bry, [[0.8, 8]]);
    kuleKur(0, Y, -1.5, 5.0, 17, MAVI, bry, [[0, 10.5], [0.75, 13.5], [-0.75, 13.5]]);
    kuleKur(4.3, Y, 2.8, 2.0, 21.5, KIRMIZI, bry, [[0.3, 17]]);
    // ana kulenin önünde asılı uzun kırmızı-mavi pankart
    for (let k = 0; k < 3; k++) s(yuvarlak, -0.2, Y + 13.8 - k * 1.4, 3.65, 2.2, 1.45, 0.2, k === 1 ? MAVI : KIRMIZI, -0.1, 0, 0, 0, 0.1 + k * 0.15);
    s(cvG.ucgen, -0.2, Y + 9.5, 3.85, 1.1, 1.2, 0.2, KIRMIZI, PI + 0.1, 0, 0, 0, 0.5); s(cvG.kure, -0.2, Y + 12.4, 3.9, 0.42, 0.42, 0.15, ALTIN);
    // tepeden yola inen yassı taş patika
    for (let k = 0; k < 14; k++) { const u = k / 13, z = A + 2.5 + u * (HR / SK - A - 1), x = Math.sin(u * 3) * 2.2, y = (tepeY(Math.hypot(x, z * 1.05) * SK, HR, HH) + 0.1) / SK; s(cvG.daire, x + (k % 2 - 0.5) * 0.6, y, z, 1.0, 0.8, 1, TAS[k % 3], -PI / 2 + Math.sin(PI * Math.min(1, z * SK / HR)) * HH * PI / 2 / HR); }
    // 2 · Pırıl: şatonun yanında, yola dönük oturur; yavaşça kanat çırpar, kuyruğunu sallar
    { const k = 4.3, ox = 11, oz = 16.5, yy = tepeY(Math.hypot(ox, oz * 1.05) * SK, HR, HH) - 0.2, w = S.dunya(ox, oz), wx = w.x, wz = w.z;
      S.yer(wx, wz, ry + 0.45, k); const Y0 = yy / k;
      ejderKur((g, x, y, z, sx, sy, sz, c, rx, ry2, rz, kt, kz, ke) => S.ekle(g, x, y + Y0, z, sx, sy, sz, c, rx, ry2, rz, kt || 0, kz || 0, ke || 0), k, MOR, MORA, MORK, LIME, 1.5, 0.5);
      golge.push([wx, yy + 0.05, wz, 2.6 * k * 0.6, 1, 2.2 * k * 0.6, 0]);
    }
    // birkaç yuvarlak ağaç tepenin eteğinde
    for (let k = 0; k < 9; k++) { const a = ry + PI * 0.55 + k * 0.5 + Rs() * 0.2, r = HR * (0.82 + Rs() * 0.25), x = sx0 + Math.sin(a) * r, z = sz0 + Math.cos(a) * r, b = 1.0 + Rs() * 0.5; if (yakin(x, z) < YARI + 11) continue; (k % 3 ? agac : servi).push([x, 0, z, b, b * (0.9 + Rs() * 0.3), b, Rs() * 6.28, [0x5cbf4e, 0x4fb04a, 0x6fcb58][k % 3]]); }
  }
  { // küçük kardeş: şatonun çevresinde geniş bir çemberde ağır ağır süzülür (yalnız dönüş kare başına güncellenir)
    const B = cvYapi(), l = [];
    ejderKur((g, x, y, z, sx, sy, sz, c, rx, ry, rz) => B.ekle(g, x, y - 1.2, z, sx, sy, sz, c, rx, ry, rz, 0, 0, 0), 1, 0x62bdf6, 0xb4e2ff, 0x3a7fc0, 0xfff0a0, 1.8, 0);
    l.push([31, 34, 0, 2.1, 2.1, 2.1, 0, 0xffffff]);
    const ug = B.geo(); ug.rotateX(PI / 2);   // uçuş duruşu: karnı aşağıda, başı ileride, kanatlar yatay
    stUcan = cok(ug, cvMalz(stUcHar, { emissive: 0x1c1a14 }), l); stUcan.position.set(sx0, 0, sz0);
  }

  // ───────── 3 · yolun üstünden geçilen iki kuleli taş kemer ─────────
  const kemerGeo = (() => {   // tek parça, kalın, pahlı: ortası kemerli açıklık (birim kutuya sığdırılır: ton geçişi alttan üste)
    const W = 14, a = 10.6, sp = 5.6, ev = 6.4, Ht = 15, sh = new T.Shape();
    sh.moveTo(-W, 0); sh.lineTo(-a, 0); sh.lineTo(-a, sp);
    for (let k = 1; k <= 16; k++) { const t = PI - k / 16 * PI; sh.lineTo(Math.cos(t) * a, sp + Math.sin(t) * ev); }
    sh.lineTo(a, 0); sh.lineTo(W, 0); sh.lineTo(W, Ht); sh.lineTo(-W, Ht); sh.lineTo(-W, 0);
    const g = new T.ExtrudeGeometry(sh, { depth: 2.6, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.35, bevelSegments: 2, curveSegments: 4 });
    g.translate(0, -Ht / 2, -1.3); g.scale(1 / (2 * W), 1 / Ht, 1); g.computeVertexNormals(); g.userData.cvTon = true; return g;
  })();
  {
    const r = 14;
    for (const f of [0.52, 0.36, 0.68, 0.2, 0.8]) {
      let bulundu = false;
      for (let k = 0; k < 16 && !bulundu; k++) {
        const i = (cvI(f) + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 5 + N) % N; let iyi = true;
        let kk = 0; for (let j = -24; j <= 24; j++) kk += Math.abs(KAP[(i + j + N) % N]); if (kk / 49 > 0.012) continue;
        for (const yan of [-1, 1]) for (const u of [0.8, 1, 1.25, 1.5]) { const q = cvKenar(i, yan, r * u); if (yakin(q.x, q.z) < r * u - 1.5 || (u === 1 && !cvBos(q.x, q.z, 4))) iyi = false; }
        if (!iyi) continue;
        bulundu = true;
        S.yer(PX[i], PZ[i], Math.atan2(-TX[i], -TZ[i]), 1);
        s(kemerGeo, 0, 7.5, 0, 28, 15, 1, TAS[1]);
        for (let j = 0; j <= 12; j++) { const t = PI - j / 12 * PI; for (const z of [-1.75, 1.75]) s(yuvarlak, Math.cos(t) * 10.75, 5.6 + Math.sin(t) * 6.55, z, 1.45, 0.95, 0.5, j % 2 ? TAS[3] : KREM, 0, 0, t - PI / 2); }   // kemer taşları (krem halka)
        s(yuvarlak, 0, 12.65, 1.75, 1.6, 1.9, 0.6, KREM); s(cvG.kure, 0, 12.75, 2.05, 0.65, 0.65, 0.25, ALTIN);   // kilit taşı
        for (let j = 0; j < 10; j++) { const x = -11.7 + j * 2.6; for (const z of [-1.15, 1.15]) s(yuvarlak, x, 15.8, z, 1.25, 1.4, 0.9, TAS[j % 2 ? 3 : 0]); }   // mazgallar
        for (let j = 0; j < 9; j++) { const x = (Rs() - 0.5) * 22, y = 1.5 + Rs() * 12; if (Math.abs(x) < 11.4 && y < 5.6 + 6.55 * Math.sqrt(Math.max(0, 1 - x * x / 112)) + 1.6) continue; for (const z of [-1.7, 1.7]) s(yuvarlak, x, y, z, 1.5 + Rs(), 0.85, 0.4, TAS[(j + 2) % 4]); }   // birkaç kabarık taş
        for (const yan of [-1, 1]) {
          kuleKur(yan * r, 0, 0, 3.3, 16.5, yan > 0 ? MAVI : KIRMIZI, PI / 2, [[0, 11]]);
          for (const z of [-1, 1]) { s(yuvarlak, yan * (r - 3.7), 8.5, z * 2.0, 1.1, 5.5, 0.18, yan > 0 ? MAVI : KIRMIZI, 0, 0, 0, 0, 0.08); s(cvG.ucgen, yan * (r - 3.7), 5.4, z * 2.0, 0.55, 0.75, 0.14, yan > 0 ? MAVI : KIRMIZI, PI, 0, 0, 0, 0.1); }   // kule yüzünde asılı flamalar
          const q = cvKenar(i, yan, r); cvYasak.push([q.x, q.z, 6]); golge.push([q.x, 0.012, q.z, 5.2, 1, 5.2, 0]);
        }
      }
      if (bulundu) break;
    }
  }

  { // ufukta ikinci, küçük şato: başlangıç düzlüğünün tam karşısında, yüksek bir tepede (pusun içinde; kart resminde de görünür)
    let en = null; for (const u of [240, 270, 210, 300]) for (const yn of [0, -0.25, 0.25, -0.5, 0.5]) { const x = PX[0] + (TX[0] + TZ[0] * yn) * u, z = PZ[0] + (TZ[0] - TX[0] * yn) * u; const d = yakin(x, z); if (d > 120 && !icinde(x, z) && (!en || Math.abs(yn) < Math.abs(en.yn) - 0.01)) en = { x, z, yn }; if (en && en.yn === 0) break; }
    if (en) {
      const HR2 = 66, HH2 = 22, k = 2.3, ry = Math.atan2(PX[0] - en.x, PZ[0] - en.z), Y2 = (HH2 - 0.5) / k;
      tepe.push([en.x, -0.3, en.z, HR2, HH2, HR2, 0, 0x8fd27a]); cvYasak.push([en.x, en.z, HR2]);
      S.yer(en.x, en.z, ry, k);
      for (const [x1, z1, x2, z2] of [[-7, 5, 7, 5], [7, 5, 7, -5], [7, -5, -7, -5], [-7, -5, -7, 5]]) { const L = Math.hypot(x2 - x1, z2 - z1), a = Math.atan2(x2 - x1, z2 - z1); s(yuvarlak, (x1 + x2) / 2, Y2 + 2.6, (z1 + z2) / 2, 2, 6, L, TAS[1], 0, a); }
      s(yuvarlak, 0, Y2 + 2.0, 6.0, 2.6, 3.6, 0.4, AHSAP);
      kuleKur(-7, Y2, 5, 2.4, 9, KIRMIZI, 1.2); kuleKur(7, Y2, 5, 2.4, 9, KIRMIZI, 1.2); kuleKur(0, Y2, -1.5, 3.8, 14, MAVI, 1.2, [[0, 10]]); kuleKur(-7, Y2, -5, 2.2, 10.5, MAVI, 1.2);
    }
  }

  // ───────── yol boyunca seyrek uzun flamalar (başlangıçtan uzakta) ─────────
  for (const [f, yan] of [[0.14, 1], [0.27, -1], [0.43, 1], [0.6, -1], [0.74, 1], [0.86, -1]]) {
    const p = yerBul(f, yan, YARI + 10, 1.2); if (!p) continue;
    S.yer(p.x, p.z, p.ry, 1.25); const c = Rs() < 0.5 ? KIRMIZI : MAVI;
    s(cvG.sil, 0, 2.6, 0, 0.12, 5.2, 0.12, KREM); s(cvG.kure, 0, 5.3, 0, 0.24, 0.24, 0.24, ALTIN); s(yuvarlak, 0.95, 4.95, 0, 2.0, 0.16, 0.16, AHSAP);
    for (let k = 0; k < 3; k++) s(yuvarlak, 0.95, 4.35 - k * 0.95, 0.05, 1.5, 1.0, 0.14, k === 1 ? (c === KIRMIZI ? MAVI : KIRMIZI) : c, 0, 0, 0, 0, 0.12 + k * 0.18);
    s(cvG.ucgen, 0.95, 1.7, 0.05, 0.75, 0.7, 0.14, c, PI, 0, 0, 0, 0.6);
    s(cvG.ufak, 0.25, 0.25, 0.1, 0.5, 0.35, 0.45, TAS[2]); s(cvG.ufak, -0.3, 0.2, -0.1, 0.4, 0.3, 0.4, TAS[1]);
    golge.push([p.x, 0.012, p.z, 1.4, 1, 1.0, 0]);
  }

  // ───────── 2b · yavru ejderha: dış virajda küçük bir tümsekte oturur, el sallar ─────────
  { let p = null; for (const f of [0.31, 0.66, 0.9, 0.12]) { p = yerBul(f, -1, 21, 4); if (p) break; p = yerBul(f, 1, 21, 4); if (p) break; }
    if (p) { tepe.push([p.x, -0.15, p.z, 7, 1.6, 7, 0, 0x7fca5c]); const k = 1.45; S.yer(p.x, p.z, p.ry, k);
      ejderKur((g, x, y, z, sx, sy, sz, c, rx, ry, rz, kt, kz, ke) => S.ekle(g, x, y + 1.35 / k, z, sx, sy, sz, c, rx, ry, rz, kt || 0, kz || 0, ke || 0), k, 0xff9fb8, 0xffd0de, 0xe0708f, 0xfff0a0, 1.0, 0.7);
      golge.push([p.x, 1.5, p.z, 2.6, 1, 2.2, 0]); }
  }

  // ───────── ağaçlar, çalılar, taşlar: seyrek, yola en yakın şerit boş ─────────
  for (let i = 0; i < N; i += 3) for (const yan of [-1, 1]) for (let k = 0; k < 2; k++) {
    const uz = YARI + 11 + (k ? 10 + Rs() * Rs() * 70 : Rs() * 6), q = cvKenar(i + ((Rs() * 3) | 0), yan, uz), x = q.x, z = q.z, d = yakin(x, z), t = Rs();
    if (d < YARI + 10 || d < uz * 0.55 || Rs() < (k ? 0.74 : 0.88)) continue;
    const f = i / N; if ((f < 0.05 || f > 0.95) && d < YARI + 22) continue;   // başlangıç çevresi sade
    if (t < 0.42) { const b = 0.8 + Rs() * 0.6; if (!cvBos(x, z, 2.4 * b)) continue; cvYasak.push([x, z, 2.6 * b]); agac.push([x, 0, z, b, b * (0.9 + Rs() * 0.3), b, Rs() * 6.28, [0x5cbf4e, 0x4fb04a, 0x6fcb58, 0x63c452][(Rs() * 4) | 0]]); if (d < 50) golge.push([x - 0.6, 0.012, z + 0.4, 2.6 * b, 1, 2.2 * b, -0.4]); }
    else if (t < 0.62) { const b = 0.8 + Rs() * 0.5; if (!cvBos(x, z, 1.4 * b)) continue; cvYasak.push([x, z, 1.5 * b]); servi.push([x, 0, z, b, b * (0.9 + Rs() * 0.4), b, Rs() * 6.28, [0x3f9a48, 0x48a64c][(Rs() * 2) | 0]]); if (d < 50) golge.push([x - 0.4, 0.012, z + 0.3, 1.5 * b, 1, 1.3 * b, -0.4]); }
    else if (t < 0.88) { const b = 0.7 + Rs() * 0.6; if (!cvBos(x, z, 1.2 * b)) continue; cvYasak.push([x, z, 1.2 * b]); cali.push([x, 0, z, b, b, b, Rs() * 6.28, [0x5cbf4e, 0x6fcb58, 0x55b84a][(Rs() * 3) | 0]]); }
    else { const b = 0.5 + Rs() * 0.9; if (!cvBos(x, z, b)) continue; cvYasak.push([x, z, b]); kaya.push([x, b * 0.25, z, b, b * (0.6 + Rs() * 0.4), b * (0.8 + Rs() * 0.4), Rs() * 6.28, TAS[(Rs() * 4) | 0]]); }
  }
  { // yuvarlak taçlı ağaç: tombul taç, üstü açık; rüzgârda hafif salınır
    const B = cvYapi(), e = B.ekle;
    e(cvG.govdeK, 0, 1.2, 0, 0.32, 2.4, 0.32, 0x9a6a3c); e(cvG.tacY, 0, 3.6, 0, 2.0, 1.8, 2.0, BEYAZ, 0, 0, 0, 1); e(cvG.tacY, 0.8, 4.4, 0.3, 1.2, 1.1, 1.2, BEYAZ, 0, 0, 0, 1); e(cvG.tacY, -0.7, 4.3, -0.4, 1.1, 1.0, 1.1, BEYAZ, 0, 0, 0, 1);
    for (let k = 0; k < 4; k++) { const a = k * 1.7 + 0.4; e(cvG.kureK, Math.sin(a) * 1.75, 3.4 + (k % 2) * 0.9, Math.cos(a) * 1.75, 0.2, 0.2, 0.2, k % 2 ? KIRMIZI : 0xfff1a8); }   // birkaç elma / çiçek
    if (agac.length) cok(cvTon(B.geo()), cvMalz(1), agac);
  }
  { // servi: uzun, ince, yuvarlak uçlu
    const B = cvYapi(), e = B.ekle;
    e(cvG.govdeK, 0, 0.5, 0, 0.22, 1.0, 0.22, 0x8a5c34); e(cvG.tacY, 0, 3.0, 0, 1.1, 2.9, 1.1, BEYAZ, 0, 0, 0, 1); e(cvG.tacY, 0, 5.2, 0, 0.7, 1.3, 0.7, BEYAZ, 0, 0, 0, 1);
    if (servi.length) cok(cvTon(B.geo()), cvMalz(1), servi);
  }
  { // çalı: iki kabarık top, birkaç beyaz-sarı çiçek
    const B = cvYapi(), e = B.ekle;
    e(cvG.tacY, 0, 0.45, 0, 0.95, 0.75, 0.85, BEYAZ, 0, 0, 0, 1); e(cvG.tacY, 0.75, 0.35, 0.3, 0.6, 0.5, 0.55, BEYAZ, 0, 0, 0, 1);
    for (let k = 0; k < 4; k++) { const a = k * 1.6; e(cvG.kureK, Math.sin(a) * 0.82, 0.62 + (k % 2) * 0.2, Math.cos(a) * 0.7, 0.13, 0.13, 0.13, k % 2 ? 0xfff1a8 : 0xffffff); }
    if (cali.length) cok(cvTon(B.geo()), cvMalz(0), cali);
  }
  if (kaya.length) cok(cvG.ufak, mat(0xffffff, { flatShading: true }), kaya);
  // sakin uzak tepeler: yakında alçak yeşil, uzakta büyük ve puslu mavi-yeşil
  for (let k = 0; k < 40; k++) {
    const a = Rs() * 6.2832, rr = 60 + Rs() * 300, x = mx + Math.cos(a) * rr, z = mz + Math.sin(a) * rr, d = yakin(x, z), r = 9 + Rs() * 14 + (d > 80 ? 14 + Rs() * 22 : 0), h = r * (0.18 + Rs() * 0.16);
    if (d < YARI + 8 + r * 1.05 || icinde(x, z) || !cvBos(x, z, r * 0.8)) continue;
    tepe.push([x, -0.05, z, r * 1.4, h, r, Rs() * 3.14, [0x86d06a, 0x78c860, 0x92d676][(Rs() * 3) | 0]]);
  }
  for (let k = 0; k < 26; k++) { const kat = k % 3, a = k / 26 * 6.2832 + Rs() * 0.12, rr = 340 + kat * 70 + Rs() * 30, r = 50 + Rs() * 30 + kat * 14, h = 16 + Rs() * 12 + kat * 9; tepe.push([mx + Math.cos(a) * rr, -1, mz + Math.sin(a) * rr, r * 1.5, h, r, Rs() * 3.14, [0xa2d88e, 0xaedcb4, 0xc2e4d2][kat]]); }
  if (tepe.length) cok(stTepeGeo, mat(0xffffff), tepe);
  { // pamuk bulutlar
    const B = cvYapi(), l = []; B.ekle(cvG.tac, 0, 0, 0, 12, 4.5, 8, 0xffffff); B.ekle(cvG.tac, -9, -1, 0, 8, 3.2, 6, 0xf4fbff); B.ekle(cvG.tac, 9, -1, 1, 8, 3.2, 6, 0xf4fbff);
    for (let k = 0; k < 9; k++) { const a = k / 9 * 6.2832 + 0.5, r = 220 + (k % 3) * 70, b = 1.3 + (k % 4) * 0.4; l.push([mx + Math.cos(a) * r, 100 + (k % 4) * 14, mz + Math.sin(a) * r, b, b, b, -a]); }
    const g = B.geo(), p = g.attributes.position, c = g.attributes.color; for (let i = 0; i < p.count; i++) { let t = clamp((p.getY(i) + 3.6) / 7.5, 0, 1); t = t * t * (3 - 2 * t); c.setXYZ(i, lerp(0.86, 1, t), lerp(0.88, 1, t), lerp(0.95, 1, t)); }
    cok(g, new T.MeshBasicMaterial({ vertexColors: true, fog: false }), l);
  }

  // ───────── tek parça yapılar ve gölgeler ─────────
  { const m = new T.Mesh(S.geo(), cvMalz(stHar, { emissive: 0x141210 })); m.frustumCulled = false; scene.add(m); }
  if (golge.length) { const d = tuvalDoku(64, 64, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(30,70,40,.30)'); r.addColorStop(0.45, 'rgba(30,70,40,.15)'); r.addColorStop(1, 'rgba(30,70,40,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    const g = new T.PlaneGeometry(2, 2); g.rotateX(-PI / 2); const sh = cok(g, new T.MeshBasicMaterial({ map: d, transparent: true, depthWrite: false }), golge); sh.renderOrder = 1; }
}
