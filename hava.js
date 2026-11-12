'use strict';
/* hava.js — pist başına hafif, çizgi film tarzı hava parçacıkları (yalnız görünüş; oynanışa dokunmaz).
   Tek THREE.Points (sabit havuz), kameranın önünde dolaşan bir kutu içinde sarılır; bütün hareket gölgelendiricide.
   Kare başına yeni nesne yok. Orman pistinde yarışın ortasında kısa bir yağmur, sonra gökkuşağı (+1 çizim).
   Güncelleme kendi onBeforeRender kancasıyla olur (oyun.js'e dokunmaz). Deneme: ?yagmur (ormanda yağmuru hep açar). */
const HAVA = (() => {
  const TUR = { kar: 0, yagmur: 1, yaprak: 2, konfeti: 3, isilti: 4, baloncuk: 5, kum: 6, duman: 7, bocek: 8, ucak: 9, tuy: 10, kayan: 11, halka: 12, cali: 13, kopuk: 14 };
  // grup: [tür, adet, boy (m) [en az, en çok], düşüş/yükseliş hızı [en az, en çok] (+ aşağı), sallanma (m), renkler]
  // Sade: yalnız karda kar ve ormanda ara ara yağmur belirgin; diğer pistlerde tek tür, seyrek ve sakin (şehirde hiç yok).
  const PLAN = {
    kar: { kutu: [50, 18, 50], ruzgar: [0.55, 0.2], gruplar: [[TUR.kar, 460, [0.22, 0.66], [0.8, 1.6], 0.75, [0xffffff, 0xf6faff, 0xedf4ff]]] },
    orman: { kutu: [40, 16, 40], ruzgar: [1.7, 0.3], gruplar: [
      [TUR.yagmur, 430, [1.0, 1.4], [17, 20], 0, [0xeef6ff, 0xdcecff]],
      [TUR.halka, 30, [0.9, 1.3], [0, 0], 0, [0xf2f9ff]]] },
    kiyi: { kutu: [60, 16, 60], ruzgar: [1.6, 0.5], gruplar: [[TUR.tuy, 22, [0.5, 0.7], [0.3, 0.55], 1.4, [0xffffff, 0xf6f3ec]]] },
    seker: { kutu: [60, 18, 60], ruzgar: [0.3, 0.15], gruplar: [[TUR.isilti, 40, [0.45, 0.65], [0.15, 0.35], 0.6, [0xfff3c4, 0xffe0f0]]] },
    uzay: { kutu: [70, 24, 70], ruzgar: [0.15, 0.1], gruplar: [
      [TUR.isilti, 60, [0.4, 0.65], [-0.15, 0.15], 0.6, [0xfff6d8, 0xe0e8ff]],
      [TUR.kayan, 1, [10, 10], [0, 0], 0, [0xfff8e0]]] },
    col: { kutu: [64, 8, 64], ruzgar: [6, 1.0], gruplar: [[TUR.kum, 40, [2.4, 3.6], [0, 0.05], 0.3, [0xfff0d4]]] },
    gokkusagi: { kutu: [60, 18, 60], ruzgar: [0.2, 0.15], gruplar: [[TUR.isilti, 45, [0.45, 0.65], [-0.1, 0.25], 0.7, [0xffffff, 0xfff1b8]]] },
    dino: { kutu: [60, 12, 60], ruzgar: [0.25, 0.15], gruplar: [[TUR.bocek, 36, [0.5, 0.7], [-0.12, 0.12], 1.1, [0xffe86a, 0xf0ff9a]]] },
    sehir: { kutu: [60, 18, 60], ruzgar: [0, 0], gruplar: [] },
    /*SATO*/ sato: { kutu: [60, 16, 60], ruzgar: [0.3, 0.15], gruplar: [[TUR.isilti, 32, [0.45, 0.65], [-0.1, 0.2], 0.7, [0xfff3c4, 0xffffff]]] }, /*/SATO*/            // seyrek, sıcak altın ışıltı
    /*LUNAPARK*/ lunapark: { kutu: [60, 18, 60], ruzgar: [0.2, 0.15], gruplar: [[TUR.isilti, 24, [0.32, 0.5], [-0.12, 0.12], 0.7, [0xfff0b0, 0xffd0e8, 0xc8fff6]]] }, /*/LUNAPARK*/
    /*KORSAN*/ korsan: { kutu: [60, 18, 60], ruzgar: [0, 0], gruplar: [] } /*/KORSAN*/
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
  const malzeme = new T.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, fog: false,
    vertexShader: `
      uniform float uZ, uOlcek, uMaxPx, uYagmur, uGuc; uniform vec3 uMerkez, uKutu;
      attribute vec4 aTohum; attribute vec3 aHiz, aRenk; attribute float aTur, aBoy;
      varying vec3 vRenk; varying float vTur, vAlfa, vDon, vFaz, vYak, vPx;
      float hs(float n) { return fract(sin(n) * 43758.5453); }
      void main() {
        vTur = aTur; vRenk = aRenk; vFaz = 0.0; vAlfa = uGuc; vYak = 0.0;
        vDon = aTohum.x * 6.283 + uZ * (aTohum.y - 0.5) * 3.0;
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
          float sal = aTohum.z, fq = t < 0.5 ? 0.5 : 1.0;   // kar daha sakin salınır
          p.x += sin(uZ * (0.5 + aTohum.x) * fq + aTohum.y * 6.283) * sal;
          p.z += cos(uZ * (0.4 + aTohum.w) * fq + aTohum.x * 6.283) * sal;
          if (t < 0.5) p.x += sin(uZ * 0.11) * 1.6 + sin(uZ * 0.23 + 1.0) * 0.6;   // ara ara hafif rüzgâr: bütün taneler birlikte yatar
          vec3 rel = mod(p - uMerkez + 0.5 * uKutu, uKutu) - 0.5 * uKutu;
          vec3 w = vec3(uMerkez.x + rel.x, mod(p.y, uKutu.y) - 1.0, uMerkez.z + rel.z);
          float kenar = max(abs(rel.x) / uKutu.x, abs(rel.z) / uKutu.z);
          vAlfa *= 1.0 - smoothstep(0.36, 0.5, kenar);
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
            vAlfa *= smoothstep(-0.8, 1.2, w.y);   // yere değince yumuşakça kaybolur
          }
          vAlfa *= 1.0 - smoothstep(uKutu.y - 4.0, uKutu.y - 1.0, w.y + 1.0) * step(t, 6.5);
          if (t > 7.5 && t < 8.5) vAlfa *= 0.55 + 0.45 * sin(uZ * (1.5 + aTohum.x * 2.0) + aTohum.w * 6.283);   // ateş böceği yanıp söner
          if (t > 3.5 && t < 4.5) vAlfa *= 0.5 + 0.5 * sin(uZ * (2.0 + aTohum.x * 3.0) + aTohum.w * 6.283);    // ışıltı göz kırpar
          mv = viewMatrix * vec4(w, 1.0);
        }
        float uz = max(0.5, -mv.z);
        vYak = 1.0 - smoothstep(7.0, 24.0, uz);   // derinlik: yakındakiler iri ve bulanık, uzaktakiler küçük ve net
        if (t < 10.5 || t > 11.5) vAlfa *= smoothstep(3.0, 7.0, uz);   // kameranın dibindekiler kocaman görünmesin
        gl_Position = projectionMatrix * mv;
        if (uz < 16.0 && (t < 10.5 || t > 11.5)) {   // Feza'nın arabasının önünde (ekranın alt ortası) yakın parçacıklar silikleşir
          vec2 ek = gl_Position.xy / gl_Position.w - vec2(0.0, -0.4);
          vAlfa *= mix(0.25, 1.0, smoothstep(0.22, 0.5, length(vec2(ek.x * 0.8, ek.y))));
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
        if (t < 0.5 || t > 13.5) {                               // kar / köpük: yumuşak tombul tane
          // uzak tane: küçük, net kenarlı; yakın tane: iri, kenarı yumuşak dağılan ve biraz saydam
          a = smoothstep(1.0, mix(0.5, 0.0, vYak), d) * mix(0.95, 0.6, vYak);
          col = mix(vRenk * 0.92, vec3(1.0), smoothstep(0.85, 0.0, d));
        } else if (t < 1.5) {                                    // yağmur çizgisi: ince, uçlara doğru incelen, hep aynı eğim
          float x = c.x + c.y * 0.09, g = max(mix(0.045, 0.085, vYak), 2.4 / vPx);   // en az ~1 piksel kalınlık
          a = smoothstep(g, g * 0.25, abs(x)) * smoothstep(1.0, 0.15, abs(c.y)) * mix(0.9, 0.42, vYak);
          col = mix(col, vec3(1.0), 0.35);
        } else if (t < 2.5) {                                    // yaprak: döner, takla atar
          vec2 q = don(c, vDon); q.x /= max(0.25, abs(cos(vDon * 1.7)));
          float e = length(vec2(q.x, q.y * 1.9)); a = smoothstep(0.92, 0.8, e);
          col *= 1.0 - 0.25 * smoothstep(0.08, 0.0, abs(q.y)) * step(abs(q.x), 0.8);
        } else if (t < 3.5) {                                    // konfeti / şeker serpintisi
          vec2 q = don(c, vDon); float gx = 0.75 * max(0.2, abs(cos(vDon * 1.3)));
          a = step(abs(q.x), gx) * step(abs(q.y), 0.32); col *= 0.85 + 0.15 * step(0.0, q.y);
        } else if (t < 4.5) {                                    // ışıltı: dört köşeli yıldızcık
          float y = smoothstep(0.16, 0.0, abs(c.x)) * (1.0 - abs(c.y)) + smoothstep(0.16, 0.0, abs(c.y)) * (1.0 - abs(c.x));
          a = clamp(y + smoothstep(0.45, 0.0, d), 0.0, 1.0); col = mix(col, vec3(1.0), smoothstep(0.4, 0.0, d));
        } else if (t < 5.5) {                                    // baloncuk: halka + parıltı
          a = smoothstep(0.1, 0.02, abs(d - 0.84)) * 0.85 + step(d, 0.86) * 0.12;
          float p = smoothstep(0.24, 0.1, length(c - vec2(-0.36, 0.36))); a = max(a, p); col = mix(col, vec3(1.0), p);
        } else if (t < 6.5) {                                    // rüzgârla savrulan kum çizgisi
          float y = (c.y + c.x * 0.08) / 0.1, u = 1.0 - c.x * c.x;      // yumuşak, kuma karışan ince toz tülü
          a = exp(-y * y) * u * u * 0.38;
        } else if (t < 7.5) {                                    // sevimli duman halkası
          a = smoothstep(0.2, 0.06, abs(d - 0.62)); col *= 0.92 + 0.08 * c.y;
        } else if (t < 8.5) {                                    // ateş böceği / polen: parlak nokta
          a = exp(-d * d * 7.0); col = mix(col, vec3(1.0, 1.0, 0.9), smoothstep(0.35, 0.0, d));
        } else if (t < 9.5) {                                    // kâğıt uçak
          vec2 q = don(c, sin(vDon) * 0.25);
          a = step(-0.8, q.x) * step(q.x, 0.85) * step(abs(q.y), (0.85 - q.x) * 0.32);
          col *= 1.0 - 0.18 * step(q.y, 0.0);
        } else if (t < 10.5) {                                   // martı tüyü
          vec2 q = don(c, vDon * 0.5 + 0.6);                     // ucu sivri, kenarı yumuşak tüy; ortasında ince sap
          float gen = mix(0.34, 0.12, smoothstep(-0.9, 0.9, q.x)), e = length(vec2(q.x * 0.95, q.y * 0.9 / gen));
          a = smoothstep(0.95, 0.55, e) * 0.85;
          col *= 1.0 - 0.12 * smoothstep(0.05, 0.0, abs(q.y)) * step(abs(q.x), 0.85) - 0.1 * step(0.0, q.y);
        } else if (t < 11.5) {                                   // kayan yıldız: baş sol altta, kuyruk sağ üste
          vec2 yon = normalize(vec2(1.0, 0.42)); vec2 h = c - yon * -0.8;
          float u = dot(h, yon), v = abs(dot(h, vec2(-yon.y, yon.x)));
          a = step(0.0, u) * (1.0 - smoothstep(0.0, 1.6, u)) * smoothstep(0.07 + 0.04 * (1.0 - u), 0.0, v) + exp(-dot(h, h) * 60.0);
          col = mix(col, vec3(1.0), 0.5);
        } else if (t < 12.5) {                                   // yerde damla halkası (yassı elips)
          float e = length(vec2(c.x, c.y * 3.2)); a = smoothstep(0.05, 0.0, abs(e - 0.15 - vFaz * 0.8)) * 0.4;
        } else {                                                 // dönen çalı
          vec2 q = don(c, vDon); float an = atan(q.y, q.x);
          a = step(d, 0.95) * clamp(smoothstep(0.1, 0.0, abs(d - 0.82)) + smoothstep(0.1, 0.0, abs(sin(an * 3.0 + d * 7.0))) * 0.85, 0.0, 1.0);
          col *= 0.8 + 0.3 * d;
        }
        a *= vAlfa;
        if (a < 0.02) discard;
        gl_FragColor = vec4(col, a);
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
