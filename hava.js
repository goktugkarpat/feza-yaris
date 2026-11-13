'use strict';
/* hava.js — pist başına hafif, çizgi film tarzı hava parçacıkları (yalnız görünüş; oynanışa dokunmaz).
   Tek THREE.Points (sabit havuz), kameranın önünde dolaşan bir kutu içinde sarılır; bütün hareket gölgelendiricide.
   Kare başına yeni nesne yok. Orman pistinde yarışın ortasında kısa bir yağmur, sonra gökkuşağı (+1 çizim).
   Güncelleme kendi onBeforeRender kancasıyla olur (oyun.js'e dokunmaz). Deneme: ?yagmur (ormanda yağmuru hep açar). */
const HAVA = (() => {
  const TUR = { kar: 0, yagmur: 1, yaprak: 2, konfeti: 3, isilti: 4, baloncuk: 5, kum: 6, duman: 7, bocek: 8, ucak: 9, tuy: 10, kayan: 11, halka: 12, cali: 13, kopuk: 14, nota: 15 };
  // grup: [tür, adet, boy (m) [en az, en çok], düşüş/yükseliş hızı [en az, en çok] (+ aşağı), sallanma (m), renkler]
  // Sade: yalnız karda kar ve ormanda ara ara yağmur belirgin; diğer pistlerde tek tür, seyrek ve sakin (şehirde hiç yok).
  const PLAN = {
    kar: { kutu: [50, 18, 50], ruzgar: [0.55, 0.2], gruplar: [[TUR.kar, 460, [0.20, 0.64], [0.75, 1.55], 0.78, [0xffffff, 0xf4f9ff, 0xe8f3ff]]] },
    orman: { kutu: [40, 16, 40], ruzgar: [1.7, 0.3], gruplar: [
      [TUR.yagmur, 430, [0.95, 1.38], [17, 20], 0, [0xf0f7ff, 0xdcecff]],
      [TUR.halka, 30, [0.85, 1.25], [0, 0], 0, [0xf2f9ff]]] },
    kiyi: { kutu: [60, 16, 60], ruzgar: [1.6, 0.5], gruplar: [[TUR.tuy, 22, [0.46, 0.68], [0.26, 0.50], 1.4, [0xffffff, 0xfff8ec, 0xf2f7ff]]] },
    seker: { kutu: [60, 18, 60], ruzgar: [0.3, 0.15], gruplar: [[TUR.isilti, 40, [0.42, 0.68], [-0.08, 0.28], 0.65, [0xfff2a6, 0xffbce2, 0xbcf4ff, 0xffffff]]] },
    uzay: { kutu: [70, 24, 70], ruzgar: [0.15, 0.1], gruplar: [
      [TUR.isilti, 60, [0.28, 0.74], [-0.14, 0.14], 0.55, [0xfff6d2, 0xd8e8ff, 0xc7d2ff, 0xffe0f8, 0xb8f4ff]],
      [TUR.kayan, 1, [10, 10], [0, 0], 0, [0xfff8dc]]] },
    col: { kutu: [64, 8, 64], ruzgar: [6, 1.0], gruplar: [
      [TUR.kum, 28, [1.8, 3.0], [0, 0.04], 0.35, [0xffe8c2, 0xffd5a2, 0xfff1d6]],
      [TUR.bocek, 12, [0.28, 0.48], [-0.05, 0.08], 0.8, [0xffe49c, 0xfff3c8]]] },
    gokkusagi: { kutu: [60, 18, 60], ruzgar: [0.2, 0.15], gruplar: [[TUR.isilti, 45, [0.40, 0.68], [-0.12, 0.22], 0.72, [0xffffff, 0xffe694, 0xffbedf, 0xb2e8ff, 0xd8c2ff]]] },
    dino: { kutu: [60, 12, 60], ruzgar: [0.25, 0.15], gruplar: [[TUR.bocek, 36, [0.46, 0.72], [-0.12, 0.12], 1.15, [0xffe664, 0xe8ff82, 0xffcc4d]]] },
    sehir: { kutu: [60, 18, 60], ruzgar: [0, 0], gruplar: [] },
    /*SATO*/ sato: { kutu: [60, 16, 60], ruzgar: [0.3, 0.15], gruplar: [
      [TUR.bocek, 24, [0.42, 0.68], [-0.12, 0.14], 1.15, [0xffe066, 0xffc857, 0xfff3b0, 0xd8ff9c]],
      [TUR.isilti, 8, [0.34, 0.54], [-0.08, 0.16], 0.7, [0xfff4c2, 0xffffff]]] }, /*/SATO*/            // masal vadisi ateş böcekleri + altın ışıltı
    /*LUNAPARK*/ lunapark: { kutu: [60, 18, 60], ruzgar: [0.2, 0.15], gruplar: [[TUR.isilti, 24, [0.36, 0.62], [-0.12, 0.12], 0.75, [0xffe885, 0xff9ed6, 0x8ef8f0, 0xffc878]]] }, /*/LUNAPARK*/
    /*KORSAN*/ korsan: { kutu: [60, 18, 60], ruzgar: [0.9, 0.3], gruplar: [
      [TUR.isilti, 18, [0.34, 0.56], [-0.08, 0.14], 0.7, [0xffe88a, 0xffd466, 0xffffff]],
      [TUR.tuy, 10, [0.40, 0.58], [0.20, 0.42], 1.3, [0xffffff, 0xfff4dc, 0xffe8c8]]] }, /*/KORSAN*/
    /*DENIZALTI*/ denizalti: { kutu: [56, 18, 56], ruzgar: [0.15, 0.1], gruplar: [
      [TUR.baloncuk, 64, [0.30, 0.72], [-1.45, -0.70], 0.80, [0xffffff, 0xd8fbff, 0xa8f2ff, 0xffe8f6]],
      [TUR.isilti, 20, [0.34, 0.56], [-0.12, 0.12], 0.80, [0xe6ffff, 0xfff5c4, 0xa8f8ff]]] }, /*/DENIZALTI*/
    /*CIFTLIK*/ ciftlik: { kutu: [60, 16, 60], ruzgar: [1.0, 0.35], gruplar: [
      [TUR.bocek, 34, [0.34, 0.58], [-0.06, 0.12], 1.10, [0xffe27a, 0xffd25a, 0xfff4b8]],
      [TUR.tuy, 12, [0.38, 0.58], [0.14, 0.32], 1.35, [0xffffff, 0xfff4d6]]] }, /*/CIFTLIK*/
    /*MUZIK*/ muzik: { kutu: [60, 18, 60], ruzgar: [0.2, 0.15], gruplar: [
      [TUR.isilti, 28, [0.38, 0.62], [-0.14, 0.16], 0.80, [0xffe885, 0xff9ed6, 0x8ef0ff]],
      [TUR.nota, 16, [0.54, 0.86], [-0.36, 0.04], 0.85, [0xffe066, 0xff8ac8, 0x7ceeff, 0xc9a6ff]]] } /*/MUZIK*/
  };
  const plan = PLAN[PIST_TEMA] || PLAN.orman;
  let sayi = 0; for (const g of plan.gruplar) sayi += g[1];
  const poz = new Float32Array(sayi * 3), tohumA = new Float32Array(sayi * 4), hizA = new Float32Array(sayi * 3), turA = new Float32Array(sayi), boyA = new Float32Array(sayi), renkA = new Float32Array(sayi * 3);
  let r = 7331; const Rh = () => { r = (r * 1664525 + 1013904223) >>> 0; return r / 4294967296; };   // oyunun R()'sini bozmamak için ayrı tohum
  const c = new T.Color(); let i = 0;
  for (const [tur, adet, boy, dus, sal, renkler] of plan.gruplar) {
    for (let k = 0; k < adet; k++, i++) {
      poz[i * 3] = Rh(); poz[i * 3 + 1] = Rh(); poz[i * 3 + 2] = Rh();
      tohumA[i * 4] = Rh(); tohumA[i * 4 + 1] = Rh(); tohumA[i * 4 + 2] = sal * (0.6 + Rh() * 0.6); tohumA[i * 4 + 3] = Rh();
      const yer = tur === TUR.halka || tur === TUR.cali, ru = yer && tur === TUR.halka ? 0 : 1;
      const sap = tur === TUR.yagmur ? 0.08 : 0.6;   // yağmurda bütün çizgiler aynı eğimde düşer
      hizA[i * 3] = plan.ruzgar[0] * ru * (1 - sap / 2 + Rh() * sap); hizA[i * 3 + 1] = -lerp(dus[0], dus[1], Rh()); hizA[i * 3 + 2] = plan.ruzgar[1] * ru * (1 - sap / 2 + Rh() * sap);
      turA[i] = tur; boyA[i] = lerp(boy[0], boy[1], Rh());
      c.setHex(renkler[(Rh() * renkler.length) | 0]); renkA[i * 3] = c.r; renkA[i * 3 + 1] = c.g; renkA[i * 3 + 2] = c.b;
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(poz, 3));
  geo.setAttribute('aTohum', new T.BufferAttribute(tohumA, 4));
  geo.setAttribute('aHiz', new T.BufferAttribute(hizA, 3));
  geo.setAttribute('aTur', new T.BufferAttribute(turA, 1));
  geo.setAttribute('aBoy', new T.BufferAttribute(boyA, 1));
  geo.setAttribute('aRenk', new T.BufferAttribute(renkA, 3));
  const U = {
    uZ: { value: 0 }, uMerkez: { value: new T.Vector3() }, uKutu: { value: new T.Vector3().fromArray(plan.kutu) },
    uOlcek: { value: 600 }, uMaxPx: { value: 48 }, uYagmur: { value: 0 }, uGuc: { value: 1 }
  };
  const KOYU_GOK = PIST_TEMA === 'uzay' || PIST_TEMA === 'lunapark';
  const malzeme = new T.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, fog: false,
    vertexShader: `
      uniform float uZ, uOlcek, uMaxPx, uYagmur, uGuc; uniform vec3 uMerkez, uKutu;
      attribute vec4 aTohum; attribute vec3 aHiz, aRenk; attribute float aTur, aBoy;
      varying vec3 vRenk; varying float vTur, vAlfa, vDon, vFaz, vYak, vPx;
      float hs(float n) { return fract(sin(n) * 43758.5453); }
      void main() {
        vTur = aTur; vRenk = aRenk; vFaz = 0.0; vAlfa = uGuc; vYak = 0.0;
        vDon = aTohum.x * 6.283 + uZ * (aTohum.y - 0.5) * 2.8;
        float boy = aBoy, t = aTur;
        vec4 mv;
        if (t > 10.5 && t < 11.5) {               // kayan yıldız: kameraya göre gökte çapraz kayar
          float per = 7.0 + aTohum.x * 5.0, ph = fract(uZ / per + aTohum.w);
          float sira = floor(uZ / per + aTohum.w);
          vec3 v = vec3(-28.0 + hs(sira + aTohum.y * 9.0) * 60.0, 14.0 + hs(sira * 1.7 + 3.0) * 12.0, -70.0);
          float u = ph / 0.09; v.x -= u * 26.0; v.y -= u * 11.0;
          vAlfa *= step(ph, 0.09) * sin(clamp(u, 0.0, 1.0) * 3.1416);
          mv = vec4(v, 1.0);
        } else {
          vec3 p = position * uKutu + aHiz * uZ;
          float sal = aTohum.z, fq = t < 0.5 ? 0.48 : 0.92;   // kar daha sakin salınır
          p.x += sin(uZ * (0.5 + aTohum.x) * fq + aTohum.y * 6.283) * sal;
          p.z += cos(uZ * (0.4 + aTohum.w) * fq + aTohum.x * 6.283) * sal;
          if (t < 0.5) p.x += sin(uZ * 0.11) * 1.6 + sin(uZ * 0.23 + 1.0) * 0.6;   // ara ara hafif rüzgâr: bütün taneler birlikte yatar
          if ((t > 7.5 && t < 8.5) || t > 14.5) p.y += sin(uZ * (1.1 + aTohum.x * 0.8) + aTohum.w * 6.283) * 0.35;   // böcek ve notalarda yumuşak süzülme
          vec3 rel = mod(p - uMerkez + 0.5 * uKutu, uKutu) - 0.5 * uKutu;
          vec3 w = vec3(uMerkez.x + rel.x, mod(p.y, uKutu.y) - 1.0, uMerkez.z + rel.z);
          float kenar = max(abs(rel.x) / uKutu.x, abs(rel.z) / uKutu.z);
          vAlfa *= 1.0 - smoothstep(0.34, 0.5, kenar);
          if (t > 11.5 && t < 12.5) {             // yağmur damlası halkası: yerde genişleyen ince elips
            float n = uZ * 1.3 + aTohum.w, ph = fract(n), s = floor(n);
            vec3 q = vec3(hs(s + aTohum.x * 17.0), 0.0, hs(s * 1.3 + aTohum.y * 11.0)) * uKutu * 0.6 - uKutu * 0.3;
            w = vec3(uMerkez.x + q.x, 0.07, uMerkez.z + q.z);
            vFaz = ph; vAlfa *= uYagmur * (1.0 - ph) * smoothstep(0.0, 0.12, ph);
          } else if (t > 12.5 && t < 13.5) {      // dönen çalı: yerde yuvarlanır, hafif sekerek
            w.y = boy * 0.45 + abs(sin(uZ * 3.0 + aTohum.x * 6.0)) * 0.5;
            vDon = -uZ * 4.0 + aTohum.x * 6.283;
          } else if (t > 6.5 && t < 7.5) {        // duman halkası: gökte yükselir, büyür, solar
            float y = mod(p.y, 22.0); w.y = 4.0 + y; boy *= 1.0 + y / 22.0 * 1.4;
            vAlfa *= smoothstep(0.0, 3.0, y) * (1.0 - smoothstep(15.0, 22.0, y)) * 0.8;
          } else if (t > 0.5 && t < 1.5) {        // yağmur
            vAlfa *= uYagmur; boy *= step(0.01, uYagmur);
          } else if (t > 5.5 && t < 8.5 || t > 13.5) {
            vAlfa *= smoothstep(-1.0, 1.5, w.y);
          } else {
            vAlfa *= smoothstep(-0.8, 1.4, w.y);   // yere değince yumuşakça kaybolur
          }
          if (t < 6.5 || t > 7.5) vAlfa *= 1.0 - smoothstep(uKutu.y - 4.5, uKutu.y - 1.0, w.y + 1.0);   // kutu tavanında yumuşak kaybolma
          if (t < 0.5) vAlfa *= 0.80 + 0.20 * sin(uZ * (1.8 + aTohum.x * 2.2) + aTohum.w * 6.283);       // kar tanesinde ince buz parıltısı
          if (t > 3.5 && t < 4.5) {                // ışıltı: elmas gibi göz kırpar
            float tw = 0.5 + 0.5 * sin(uZ * (1.6 + aTohum.x * 2.4) + aTohum.w * 6.283);
            vFaz = tw;
            vAlfa *= ${KOYU_GOK ? '0.22 + 0.78' : '0.34 + 0.66'} * tw * tw;
          }
          if (t > 4.5 && t < 5.5) {                // baloncuk: yükselirken hafif nefes alır
            boy *= 0.90 + 0.12 * sin(uZ * 2.1 + aTohum.w * 6.283);
            vAlfa *= 0.78 + 0.22 * sin(uZ * 1.4 + aTohum.x * 6.283);
          }
          if (t > 7.5 && t < 8.5) {                // ateş böceği / polen yumuşak nabızla yanıp söner
            float bz = 0.5 + 0.5 * sin(uZ * (1.4 + aTohum.x * 1.8) + aTohum.w * 6.283);
            vAlfa *= 0.38 + 0.62 * bz * (0.65 + 0.35 * bz);
          }
          if (t > 9.5 && t < 10.5) {               // martı tüyü: havada sallanarak süzülür
            vDon = (aTohum.x - 0.5) * 1.1 + sin(uZ * (1.1 + aTohum.y * 0.8) + aTohum.w * 6.283) * 0.72;
          }
          if (t > 14.5) {                          // müzik notası: ritmik süzülme ve parıltı
            float np = 0.5 + 0.5 * sin(uZ * (2.2 + aTohum.x * 1.2) + aTohum.w * 6.283);
            vFaz = np;
            vAlfa *= 0.70 + 0.30 * np;
            vDon = sin(uZ * (1.5 + aTohum.y) + aTohum.w * 6.283) * 0.20;
          }
          mv = viewMatrix * vec4(w, 1.0);
        }
        float uz = max(0.5, -mv.z);
        vYak = 1.0 - smoothstep(8.0, 26.0, uz);   // derinlik: yakındakiler iri ve yumuşak, uzaktakiler küçük ve net
        if (t < 10.5 || t > 11.5) vAlfa *= smoothstep(4.2, 10.0, uz);   // kameranın dibinde iri kare/leke oluşmasın
        gl_Position = projectionMatrix * mv;
        if (uz < 17.0 && (t < 10.5 || t > 11.5)) {   // ön cam ve aracın ön görüş alanı (ekran orta-altı) temiz kalır
          vec2 ek = gl_Position.xy / gl_Position.w - vec2(0.0, -0.25);
          vAlfa *= mix(0.18, 1.0, smoothstep(0.20, 0.56, length(vec2(ek.x * 0.72, ek.y))));
        }
        gl_PointSize = vAlfa < 0.01 ? 0.0 : min(uMaxPx * (t > 10.5 && t < 11.5 ? 3.0 : 1.0), boy * uOlcek / uz);
        vPx = max(1.0, gl_PointSize);
      }`,
    fragmentShader: `
      varying vec3 vRenk; varying float vTur, vAlfa, vDon, vFaz, vYak, vPx;
      vec2 don(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
      void main() {
        vec2 c = gl_PointCoord * 2.0 - 1.0; c.y = -c.y;
        float t = vTur, a = 0.0, d = length(c); vec3 col = vRenk;
        float kenarYum = smoothstep(0.98, 0.76, d);   // kare point-sprite sınırında asla keskin kenar çıkmasın
        if (t < 0.5 || (t > 13.5 && t < 14.5)) {                 // kar / köpük: yumuşak tombul tane
          a = smoothstep(0.95, mix(0.45, 0.0, vYak), d) * mix(0.92, 0.45, vYak);
          col = mix(vRenk * 0.90, vec3(1.0), smoothstep(0.82, 0.0, d));
        } else if (t < 1.5) {                                    // yağmur çizgisi: ince, uçlara doğru incelen, hep aynı eğim
          float x = c.x + c.y * 0.09, g = max(mix(0.045, 0.095, vYak), 2.4 / vPx);   // en az ~1 piksel kalınlık
          a = smoothstep(g, g * 0.22, abs(x)) * smoothstep(0.96, 0.18, abs(c.y)) * mix(0.85, 0.34, vYak) * kenarYum;
          col = mix(col, vec3(0.96, 0.98, 1.0), 0.38);
        } else if (t < 2.5) {                                    // yaprak: döner, takla atar
          vec2 q = don(c, vDon); q.x /= max(0.25, abs(cos(vDon * 1.7)));
          float e = length(vec2(q.x * 1.12, q.y * 2.1)); a = smoothstep(0.92, 0.76, e) * kenarYum;
          col *= 1.0 - 0.25 * smoothstep(0.08, 0.0, abs(q.y)) * smoothstep(0.82, 0.65, abs(q.x));
        } else if (t < 3.5) {                                    // konfeti / şeker serpintisi
          vec2 q = don(c, vDon); float gx = 0.68 * max(0.2, abs(cos(vDon * 1.3)));
          a = smoothstep(gx + 0.06, gx - 0.06, abs(q.x)) * smoothstep(0.36, 0.24, abs(q.y)) * kenarYum;
          col *= 0.85 + 0.15 * smoothstep(-0.08, 0.08, q.y);
        } else if (t < 4.5) {                                    // ışıltı: yumuşak hale + zarif dört/sekiz köşeli yıldız
          float par = 0.75 + 0.35 * vFaz;
          float halo = exp(-d * d * mix(7.5, 4.5, vYak)) * ${KOYU_GOK ? '0.55' : '0.46'};
          float rX = smoothstep(0.14, 0.0, abs(c.x)) * pow(max(0.0, 1.0 - abs(c.y) * 1.08), 1.65);
          float rY = smoothstep(0.14, 0.0, abs(c.y)) * pow(max(0.0, 1.0 - abs(c.x) * 1.08), 1.65);
          vec2 cd = don(c, 0.7854);
          float rD = (smoothstep(0.10, 0.0, abs(cd.x)) * pow(max(0.0, 1.0 - abs(cd.y) * 1.35), 2.0)
                    + smoothstep(0.10, 0.0, abs(cd.y)) * pow(max(0.0, 1.0 - abs(cd.x) * 1.35), 2.0)) * 0.30;
          float oz = exp(-d * d * 22.0);
          a = clamp((rX + rY + rD) * par * mix(0.88, 0.35, vYak) + halo + oz * 0.85, 0.0, 1.0) * mix(0.96, 0.52, vYak) * kenarYum;
          col = mix(col, vec3(1.0), clamp(oz * 0.85 + (rX + rY) * 0.35, 0.0, 1.0));
        } else if (t < 5.5) {                                    // inci kabarcık: sedef halka + yumuşak iç hacim + çift parlama
          float cember = smoothstep(0.11, 0.015, abs(d - 0.78)) * 0.82;
          float disHal = smoothstep(0.94, 0.76, d) * 0.14;
          float ic = smoothstep(0.80, 0.20, d) * 0.12;
          float p1 = smoothstep(0.24, 0.08, length(c - vec2(-0.30, 0.30)));
          float p2 = smoothstep(0.14, 0.04, length(c - vec2(0.28, -0.28))) * 0.42;
          float inci = clamp(c.x * 0.5 + 0.5, 0.0, 1.0);
          col = mix(col, mix(vec3(0.82, 1.0, 0.98), vec3(1.0, 0.90, 0.98), inci), 0.32 * smoothstep(0.4, 0.85, d));
          col = mix(col, vec3(1.0), clamp(p1 + p2 * 0.6 + cember * 0.35, 0.0, 1.0));
          a = clamp(cember + disHal + ic + p1 * 0.92 + p2, 0.0, 1.0) * mix(0.90, 0.46, vYak) * kenarYum;
        } else if (t < 6.5) {                                    // rüzgârla savrulan yumuşak kum tülü
          float y = (c.y + c.x * 0.08) / 0.17, u = max(0.0, 1.0 - c.x * c.x * 1.15);
          a = exp(-y * y) * u * u * mix(0.30, 0.12, vYak) * kenarYum;
          col *= 0.94 + 0.10 * c.y;
        } else if (t < 7.5) {                                    // sevimli duman halkası
          a = smoothstep(0.22, 0.04, abs(d - 0.58)) * mix(0.9, 0.5, vYak) * kenarYum; col *= 0.92 + 0.08 * c.y;
        } else if (t < 8.5) {                                    // ateş böceği / polen: sıcak hale + parlak çekirdek
          float halo = exp(-d * d * mix(3.4, 2.4, vYak)) * 0.40;
          float oz = exp(-d * d * 12.0) * 0.88;
          a = clamp(halo + oz, 0.0, 1.0) * mix(0.96, 0.54, vYak) * kenarYum;
          col = mix(col, vec3(1.0, 0.99, 0.88), smoothstep(0.45, 0.0, d));
        } else if (t < 9.5) {                                    // kâğıt uçak
          vec2 q = don(c, sin(vDon) * 0.25);
          float kanat = smoothstep(-0.80, -0.70, q.x) * smoothstep(0.86, 0.76, q.x) * smoothstep((0.85 - q.x) * 0.32 + 0.05, (0.85 - q.x) * 0.32 - 0.04, abs(q.y));
          a = kanat * kenarYum;
          col *= 1.0 - 0.18 * smoothstep(0.04, -0.04, q.y);
        } else if (t < 10.5) {                                   // martı tüyü: ucu yumuşak, kenarı asla kesilmez
          vec2 q = don(c, vDon);
          float gen = mix(0.32, 0.11, smoothstep(-0.80, 0.80, q.x)), e = length(vec2(q.x * 1.18, q.y * 1.05 / gen));
          a = smoothstep(0.92, 0.48, e) * mix(0.84, 0.46, vYak) * kenarYum;
          float sap = smoothstep(0.05, 0.0, abs(q.y)) * smoothstep(0.78, 0.55, abs(q.x));
          col *= 1.0 - 0.12 * sap - 0.08 * smoothstep(0.0, 0.25, q.y);
        } else if (t < 11.5) {                                   // kayan yıldız: baş sol altta, kuyruk sağ üste
          vec2 yon = normalize(vec2(1.0, 0.42)); vec2 h = c - yon * -0.72;
          float u = dot(h, yon), v = abs(dot(h, vec2(-yon.y, yon.x)));
          float kuyruk = smoothstep(-0.06, 0.05, u) * (1.0 - smoothstep(0.0, 1.45, u)) * smoothstep(0.075 + 0.04 * (1.0 - u), 0.0, v);
          float basPar = exp(-dot(h, h) * 52.0) + exp(-dot(h, h) * 14.0) * 0.42;
          a = clamp(kuyruk + basPar, 0.0, 1.0) * kenarYum;
          col = mix(col, vec3(0.85, 0.94, 1.0), smoothstep(0.1, 1.2, u) * 0.55);
          col = mix(col, vec3(1.0), clamp(exp(-dot(h, h) * 30.0) + 0.25, 0.0, 1.0));
        } else if (t < 12.5) {                                   // yerde damla halkası (çift dalga yassı elips)
          float e = length(vec2(c.x * 1.12, c.y * 3.4));
          float r1 = smoothstep(0.065, 0.01, abs(e - (0.12 + vFaz * 0.72)));
          float r2 = smoothstep(0.05, 0.01, abs(e - (0.06 + vFaz * 0.48))) * 0.35;
          a = clamp(r1 + r2, 0.0, 1.0) * 0.38 * kenarYum;
        } else if (t < 13.5) {                                   // dönen çalı
          vec2 q = don(c, vDon); float an = atan(q.y, q.x);
          a = smoothstep(0.92, 0.78, d) * clamp(smoothstep(0.1, 0.0, abs(d - 0.80)) + smoothstep(0.1, 0.0, abs(sin(an * 3.0 + d * 7.0))) * 0.85, 0.0, 1.0) * kenarYum;
          col *= 0.8 + 0.3 * d;
        } else {                                                 // parlayan müzik notası
          vec2 q = don(c, vDon);
          vec2 h = don(q - vec2(-0.12, -0.30), -0.38);
          float dBas = length(vec2(h.x * 0.82, h.y * 1.18));
          float bas = smoothstep(0.28, 0.18, dBas);
          float sapY = smoothstep(-0.34, -0.25, q.y) * smoothstep(0.54, 0.45, q.y);
          float sap = smoothstep(0.08, 0.025, abs(q.x - 0.06)) * sapY;
          float bayX = smoothstep(0.02, 0.10, q.x) * smoothstep(0.48, 0.39, q.x);
          float bayrak = smoothstep(0.095, 0.025, abs(q.y - (0.48 - (q.x - 0.06) * 0.62))) * bayX;
          float sekil = clamp(max(bas, max(sap, bayrak)), 0.0, 1.0);
          float glow = max(exp(-dBas * dBas * 6.0), max(exp(-abs(q.x - 0.06) * 6.5) * sapY, exp(-abs(q.y - (0.48 - (q.x - 0.06) * 0.62)) * 6.5) * bayX)) * (0.34 + 0.16 * vFaz);
          a = clamp(sekil * 0.94 + glow * 0.72, 0.0, 1.0) * mix(0.95, 0.56, vYak) * kenarYum;
          col = mix(col * (1.04 + 0.10 * vFaz), vec3(1.0), clamp(sekil * 0.24 + glow * 0.45, 0.0, 1.0));
        }
        a *= vAlfa;
        if (a < 0.012) discard;
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`
  });
  const nokta = new T.Points(geo, malzeme);
  nokta.frustumCulled = false; nokta.renderOrder = 5; nokta.visible = sayi > 0;
  scene.add(nokta);

  // Gökkuşağı (yalnız ormanda, yağmurdan sonra): uzakta, gökte ince yay; kamerayla birlikte yatayda kayar.
  // Renkler şerit şerit değil, birbirine yumuşakça akar; kenarları göğe karışır, ayakları ufukta silinir, çok yavaş nefes alır.
  let gok = null; const gokU = { uA: { value: 0 }, uZ: { value: 0 } };
  const GOK_I = 150, GOK_D = 176;   // iç / dış yarıçap (520 m uzakta; tepesi ekranın üst üçte birinde)
  if (PIST_TEMA === 'orman') {
    const g = new T.RingGeometry(GOK_I - 6, GOK_D + 6, 64, 1, 0, Math.PI);
    gok = new T.Mesh(g, new T.ShaderMaterial({
      uniforms: gokU, transparent: true, depthWrite: false, fog: false, side: T.DoubleSide,
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uA, uZ; varying vec2 vP;
        vec3 ton(float h) { return clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
        void main(){
          float r = (length(vP) - ${GOK_I}.0) / ${GOK_D - GOK_I}.0;            // 0 = iç (mor), 1 = dış (kırmızı)
          vec3 k = mix(vec3(1.0), ton(clamp(1.0 - r, 0.0, 1.0) * 0.76), 0.6);   // pastel, yumuşak geçişli tayf
          float kenar = smoothstep(-0.12, 0.2, r) * smoothstep(1.12, 0.8, r);  // kenarlar göğe karışır
          float ayak = smoothstep(4.0, 60.0, vP.y);                            // ufka yaklaştıkça silinir
          float nefes = 0.9 + 0.1 * sin(uZ * 0.5 + vP.x * 0.012);
          gl_FragColor = vec4(k, uA * 0.55 * kenar * ayak * nefes);
        }`
    }));
    gok.frustumCulled = false; gok.renderOrder = -2; gok.visible = false;
    scene.add(gok);
  }

  // Ormanda yağmur: yarışın %28–%62'si arası (yumuşak başlar/biter), ardından güneş ve gökkuşağı.
  const ZORLA = Q.has('yagmur'), GOK_ZORLA = Q.has('gokkusagi');
  // Yağmurda gök tarafına çok hafif serin gri-mavi perde (CSS; yalnız üst yarı, en çok %12; yol ve göstergeler etkilenmez).
  let perde = null, perdeSon = -1;
  if (PIST_TEMA === 'orman' && canvas && canvas.parentNode) {
    perde = document.createElement('div');
    perde.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;background:linear-gradient(to bottom,rgb(78,96,124) 0%,rgba(78,96,124,.75) 30%,rgba(78,96,124,0) 62%)';
    canvas.parentNode.insertBefore(perde, canvas.nextSibling);   // tuvalin hemen üstü, düğme ve göstergelerin altı
  }
  let sesTur = null, toplam = 0, yagHedef = 0, gokHedef = 0, molada = false, sonT = 0;
  OLAY.on('ilerleme', o => { toplam = o.toplam; });
  OLAY.on('mola', m => { molada = !!m; });
  OLAY.on('durum', d => { if (d === 'giris' || d === 'baslik') toplam = 0; if (d === 'baslik') sesTur = null; });
  const ileri = new T.Vector3(), boyV = new T.Vector2();
  // Yağmurda gök hafif kararır: cevre.js'in iki ışığının o anki değeri yalnız çarpanla kısılır (ışık sayısı/ayarı değişmez).
  const isiklar = [typeof cvGokIsik !== 'undefined' ? cvGokIsik : null, typeof gunes !== 'undefined' ? gunes : null].filter(Boolean);
  const isikTaban = isiklar.map(l => l.intensity), isikSon = isiklar.map(l => l.intensity);
  function isikAyar(k) {
    for (let j = 0; j < isiklar.length; j++) {
      const l = isiklar[j];
      if (Math.abs(l.intensity - isikSon[j]) > 1e-4) isikTaban[j] = l.intensity;   // başka biri değiştirdiyse yeni taban o
      l.intensity = isikSon[j] = isikTaban[j] * k;
    }
  }
  function sesAyar(tur, guc) {
    if (tur === sesTur) return; sesTur = tur;
    if (typeof SES !== 'undefined' && SES.hava) { try { SES.hava(tur, guc); } catch (e) { console.error(e); } }
  }
  const SES_TUR = { kar: ['kar', 0.7], col: ['ruzgar', 0.5], kiyi: ['ruzgar', 0.45] };
  function havaGuncelle(dt) {
    U.uZ.value += dt;
    const dr = typeof durum !== 'undefined' ? durum : 'baslik', yarista = dr === 'yaris' || dr === 'bitis';
    if (PIST_TEMA === 'orman') {
      yagHedef = ZORLA ? 1 : yarista && toplam > 0.28 && toplam < 0.62 ? 1 : 0;
      gokHedef = GOK_ZORLA || (!ZORLA && yarista && toplam >= 0.62) ? 1 : 0;
      U.uYagmur.value += (yagHedef - U.uYagmur.value) * Math.min(1, dt * 0.38);   // ~5 sn'de yavaşça gelir/gider
      isikAyar(1 - 0.36 * U.uYagmur.value);
      if (perde && Math.abs(U.uYagmur.value - perdeSon) > 0.004) { perdeSon = U.uYagmur.value; perde.style.opacity = (0.12 * perdeSon).toFixed(3); }
      sesAyar(yarista && U.uYagmur.value > 0.15 ? 'yagmur' : null, 0.8);
      if (gok) {
        gokU.uA.value += (gokHedef - gokU.uA.value) * Math.min(1, dt * 0.25);
        gokU.uZ.value = U.uZ.value;
        gok.visible = gokU.uA.value > 0.01;
        if (gok.visible) {
          camera.getWorldDirection(ileri); ileri.y = 0; ileri.normalize();
          gok.position.set(camera.position.x + ileri.x * 520, camera.position.y - 8, camera.position.z + ileri.z * 520);
          gok.rotation.set(0, Math.atan2(ileri.x, ileri.z), 0);
        }
      }
    }
    else if (SES_TUR[PIST_TEMA]) sesAyar(dr !== 'baslik' ? SES_TUR[PIST_TEMA][0] : null, SES_TUR[PIST_TEMA][1]);
    camera.getWorldDirection(ileri); ileri.y = 0; if (ileri.lengthSq() < 1e-6) ileri.set(0, 0, 1); ileri.normalize();
    U.uMerkez.value.set(camera.position.x + ileri.x * plan.kutu[2] * 0.36, 0, camera.position.z + ileri.z * plan.kutu[2] * 0.36);
  }
  nokta.onBeforeRender = (rnd, sc, cam) => {
    const simdi = performance.now(), dt = sonT ? Math.min(0.05, (simdi - sonT) / 1000) : 0.016; sonT = simdi;
    if (!molada) havaGuncelle(dt);
    rnd.getDrawingBufferSize(boyV);
    U.uOlcek.value = boyV.y * 0.5 / Math.tan(cam.fov * Math.PI / 360);
    U.uMaxPx.value = 46 * rnd.getPixelRatio();
  };
  return { nokta, gok, U, gokU, havaGuncelle };
})();
