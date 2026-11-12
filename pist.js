/* Pist görselleri: yol, kenar bantları, başlangıç kemeri, hızlandırma okları, tümsekler, yıldızlar, konfeti ve pist üstü efektler
   (toz izi, roket pırıltısı, hız çizgileri, iniş tozu, yıldız patlaması). pistGuncelle(dt, t) her karede çağrılır.
   Bu dosyanın yeni üst düzey adları `ps` önekiyle başlar. Kare başına yeni nesne oluşturulmaz: bütün parçacıklar sabit havuzdadır. */
'use strict';

// ───────── tema tablosu: her pistin yol, bant, kemer, rampa, ok ve efekt renkleri tek yerde ─────────
function psLeke(g, w, h, n, renkler, a, b0, b1, sey) {   // dikeyde ek yeri görünmeyen yumuşak benekler; sey: her sey'inci benek çizilir (rastgele sıra aynı kalır, yerleşim değişmez)
  g.globalAlpha = a;
  for (let i = 0; i < n; i++) { const x = R() * w, y = R() * h, r = b0 + R() * (b1 - b0); if (sey && i % sey) continue; g.fillStyle = renkler[i % renkler.length]; for (const dy of [-h, 0, h]) { g.beginPath(); g.ellipse(x, y + dy, r * 0.8, r, 0, 0, 7); g.fill(); } }
  g.globalAlpha = 1;
}
function psKenarGolge(g, w, h, renk) {   // yolun iki kenarında hafif koyuluk + tekerlek izleri
  for (const x of [0, w]) { const k = g.createLinearGradient(x ? w - 46 : 0, 0, x ? w : 46, 0); k.addColorStop(x ? 1 : 0, 'rgba(' + renk + ',0.38)'); k.addColorStop(x ? 0 : 1, 'rgba(' + renk + ',0)'); g.fillStyle = k; g.fillRect(x ? w - 46 : 0, 0, 46, h); }
  for (const u of [0.2, 0.34, 0.66, 0.8]) { const x = u * w, iz = g.createLinearGradient(x - 20, 0, x + 20, 0); iz.addColorStop(0, 'rgba(' + renk + ',0)'); iz.addColorStop(0.5, 'rgba(' + renk + ',0.10)'); iz.addColorStop(1, 'rgba(' + renk + ',0)'); g.fillStyle = iz; g.fillRect(x - 20, 0, 40, h); }
}
function psOrtaCizgi(g, w, h, golge, golgeKalin, renk, oz) {   // kesikli, yuvarlak uçlu orta çizgi
  g.globalAlpha = 1; g.lineCap = 'round';
  const ciz = (r, k) => { g.strokeStyle = r; g.lineWidth = k; g.beginPath(); g.moveTo(w / 2, h * 0.14); g.lineTo(w / 2, h * 0.50); g.stroke(); };
  ciz(golge, golgeKalin); ciz(renk, 15); if (oz) ciz(oz, 5);
}
const psTEMA_ORTAK = {
  yol: null, isik: 0, parlat: 0.42, capraz: false,
  omuz: '#2f8f3e', omuzAcik: '#3fa64c', bantA: '#ff5f4d', bantB: '#fff6e6', bantGolge: 'rgba(120,40,30,0.25)',
  direkA: 0xff6f5a, direkB: 0xfff4e2, ayak: 0x4aa8ff, sus: 0xffd23f, cerUst: 0xffd23f, cerAlt: 0xff6f5a, kemerEk: null,
  rampaA: 0xffd23f, rampaB: 0xff6f5a, rampaArka: 0xe9543f, rampaYan: 0xd9482f, rampaDudak: 0xfff4e2, rampaDirek: 0x4aa8ff,
  okA: '#1596f2', okB: '#3fe0ff', okGolge: 'rgba(0,84,180,0.6)',
  hale: 0xffc533, haleA: 0.3, golgeA: 0.34, duzOmuz: false, top: false,
  toz: [0xf1dcb8], tozA: 0.34, tozB0: 0.45, tozB1: 1.25, tozOmur: 0.34, tozYc: 0, tozPiril: false, puf: 0xf6e6c8,
  piril: [0xffffff, 0xffe066, 0xffb347, 0x8fe8ff, 0xff9ad5]
};
const psTEMALAR = {
  orman: {
    kemerEk(tb, X0, H) {                                                                            // yapraklı çelenk, çiçekler, direk dibinde mantarlar
      for (let i = 0; i < 15; i++) { const u = i / 14, x = lerp(-X0 + 0.7, X0 - 0.7, u), y = H + 0.34 + Math.sin(u * Math.PI) * 0.22; psParca(tb, psKureK, i % 2 ? 0x4fb04a : 0x6cc85a, x, y, -0.12, 0.72, 0.36, 0.5, 0, 0, (i % 2 ? 0.25 : -0.25)); if (i % 3 === 1 && Math.abs(x) > 3.4) { psParca(tb, psKureK, [0xff8fc0, 0xfff4e2, 0xffd23f][i % 3], x, y + 0.3, -0.5, 0.2, 0.2, 0.14); psParca(tb, psKureK, 0xffd23f, x, y + 0.3, -0.62, 0.09, 0.09, 0.06); } }
      for (const yan of [-1, 1]) {
        const x = yan * X0;
        [[1.25, -0.5, 0.62, 0xf2553d], [-1.15, -0.75, 0.46, 0xffb13d], [1.6, 0.55, 0.4, 0xf2553d]].forEach(q => { const mx = x + yan * q[0]; psParca(tb, G.sil, 0xfff3e0, mx, q[2] * 0.5, q[1], q[2] * 0.3, q[2], q[2] * 0.3); psParca(tb, psKureK, q[3], mx, q[2] * 1.02, q[1], q[2] * 0.85, q[2] * 0.55, q[2] * 0.85); for (let k = 0; k < 3; k++) psParca(tb, psKureK, 0xfffaf0, mx + Math.cos(k * 2.1) * q[2] * 0.45, q[2] * 1.38, q[1] + Math.sin(k * 2.1) * q[2] * 0.45 - 0.05, q[2] * 0.16, q[2] * 0.1, q[2] * 0.16); });
      }
    }
  },
  kiyi: {   // Sahil yolu: açık gri-mavi asfalt, kenarda kum birikintileri, can simitli kemer
    omuz: '#ead098', omuzAcik: '#f8e2b6', toz: [0xf3deb0], puf: 0xf8e8c6, ayak: 0x2fb7c9, cerUst: 0x2fb7c9, golgeA: 0.4,
    yol(g, w, h) {
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#8f96a6'); gr.addColorStop(0.5, '#a0a7b6'); gr.addColorStop(1, '#8f96a6'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      psLeke(g, w, h, 50, ['#aab1bf', '#868d9d'], 0.16, 16, 40);
      psLeke(g, w, h, 800, ['#b2b8c5', '#868d9c', '#bec4cf'], 0.26, 0.9, 2.0, 2);                        // asfalt taneleri
      psKenarGolge(g, w, h, '70,76,92');
      g.globalAlpha = 0.85; for (let i = 0; i < 26; i++) { const sag = i % 2, y = R() * h, rx = 14 + R() * 26, ry = 16 + R() * 34; g.fillStyle = i % 3 ? '#f0d9a2' : '#f8e6ba'; for (const dy of [-h, 0, h]) { g.beginPath(); g.ellipse(sag ? w + 4 : -4, y + dy, rx, ry, 0, 0, 7); g.fill(); } }   // rüzgârın yola taşıdığı kum
      g.globalAlpha = 1; psLeke(g, w, h, 110, ['#f3deaa', '#fff0c8'], 0.4, 0.9, 2.0, 2);
      g.fillStyle = '#ffffff'; g.fillRect(40, 0, 7, h); g.fillRect(w - 47, 0, 7, h);                 // beyaz kenar çizgileri
      psOrtaCizgi(g, w, h, 'rgba(50,56,74,0.4)', 21, '#fff3c4');
    },
    kemerEk(tb, X0, H) {                                                                            // can simitleri, deniz yıldızları, direk dibinde plaj topu ve kum
      const simit = new T.TorusGeometry(0.62, 0.22, 6, 8, Math.PI / 4);
      for (const yan of [-1, 1]) {
        const x = yan * X0;
        for (let k = 0; k < 8; k++) psParca(tb, simit, k % 2 ? 0xfffaf0 : 0xf2553d, x, 3.3, -0.52, 1, 1, 1, 0, 0, k * Math.PI / 4);
        psParca(tb, psYildizGeo, 0xff9a4a, x, 5.6, -0.42, 0.42, 0.42, 1.2, 0, 0, yan * 0.3);
        psParca(tb, psKureK, 0xf4dfae, x + yan * 0.9, 0.05, -0.2, 2.0, 0.42, 1.5);
        const bx = x + yan * 1.5, C = [0xff6b6b, 0x5fd0e0, 0xffd95a]; psParca(tb, psKureK, 0xffffff, bx, 0.86, -0.5, 0.55, 0.55, 0.55); psParca(tb, G.sil, C[yan > 0 ? 0 : 1], bx, 0.86, -0.5, 0.56, 0.26, 0.56); psParca(tb, psKureK, C[2], bx, 1.27, -0.5, 0.32, 0.15, 0.32);
      }
    }
  },
  kar: {   // Kar yolu: buz mavisi sıkışmış kar, kenarda kar birikintisi, saçaklı ve kar örtülü kemer
    isik: 0.24,   // kar yolu ve bantları loş kış ışığında da ak kalsın
    yol(g, w, h) {
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#a9d2ee'); gr.addColorStop(0.5, '#c4e4f8'); gr.addColorStop(1, '#a9d2ee'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      psLeke(g, w, h, 60, ['#dcf1fd', '#9cc8e8'], 0.2, 16, 40);                                      // buz lekeleri
      for (const u of [0.2, 0.34, 0.66, 0.8]) {                                                     // kardaki teker izleri
        const x = u * w, iz = g.createLinearGradient(x - 20, 0, x + 20, 0); iz.addColorStop(0, 'rgba(84,140,190,0)'); iz.addColorStop(0.5, 'rgba(84,140,190,0.18)'); iz.addColorStop(1, 'rgba(84,140,190,0)'); g.fillStyle = iz; g.fillRect(x - 20, 0, 40, h);
      }
      g.globalAlpha = 0.95; for (let i = 0; i < 30; i++) { const sag = i % 2, y = R() * h, rx = 16 + R() * 28, ry = 16 + R() * 36; g.fillStyle = i % 3 ? '#ffffff' : '#eef8ff'; for (const dy of [-h, 0, h]) { g.beginPath(); g.ellipse(sag ? w + 4 : -4, y + dy, rx, ry, 0, 0, 7); g.fill(); } }   // kenarlardan taşan kar
      g.globalAlpha = 1; psLeke(g, w, h, 260, ['#ffffff', '#f2fbff'], 0.6, 0.9, 2.2, 2);                 // kar pırıltıları
      psOrtaCizgi(g, w, h, 'rgba(46,110,170,0.5)', 23, '#ffffff');
    },
    kemerEk(tb, X0, H) {                                                                            // üstte kar örtüsü, altta buz saçakları, direk dibinde kar yığını
      for (let i = 0; i < 13; i++) { const u = i / 12, x = lerp(-X0 + 0.5, X0 - 0.5, u); psParca(tb, psKureK, i % 2 ? 0xffffff : 0xeef7ff, x, H + 0.2, 0, 0.95, 0.3 + (i % 3) * 0.06, 0.5); }
      for (let i = 0; i < 12; i++) { const x = (i - 5.5) * 1.42, b = 0.34 + (i * 7 % 5) * 0.08; psParca(tb, G.koni, i % 2 ? 0xd4efff : 0xf2fbff, x, H - 2.13 - b / 2, 0.2, 0.12, b, 0.12, Math.PI); }   // saçaklar ampullerin arasında ve önünde: iç içe girmez
      for (const yan of [-1, 1]) { const x = yan * X0; psParca(tb, psKureK, 0xffffff, x + yan * 0.7, 0.1, 0, 2.1, 0.75, 1.7); psParca(tb, psKureK, 0xeaf5ff, x - yan * 0.9, 0.05, -0.5, 1.1, 0.5, 1.0); psParca(tb, psKureK, 0xffffff, x, H + 0.98, 0, 0.5, 0.2, 0.5); }
    }, omuz: '#d7edf9', omuzAcik: '#f4fbff', bantA: '#4f9bc8', bantB: '#fbfdff', bantGolge: 'rgba(40,80,120,0.22)', direkA: 0x72b6d7,
    okA: '#ff6a2a', okB: '#ffbf3a', okGolge: 'rgba(160,60,0,0.6)', haleA: 0.2,
    toz: [0xffffff, 0xeaf7ff, 0xffffff], tozA: 0.5, tozB0: 0.34, tozB1: 1.05, tozOmur: 0.4, puf: 0xf4fbff, piril: [0xffffff, 0xffe066, 0xbfe9ff, 0x8fe8ff, 0xffb347] },
  seker: {   // Şeker Diyarı: pembe-krem fondan yol, nane-beyaz şeker çubuğu bantlar, lolipoplu kemer
    capraz: true, top: true, omuz: '#ffd3e2', omuzAcik: '#fff1f5', bantA: '#3fcfa6', bantB: '#ffffff', bantGolge: 'rgba(190,70,120,0.22)',
    direkA: 0xff6fa8, direkB: 0xfffaf2, ayak: 0x5fd6c0, sus: 0xffd23f, cerUst: 0xff8fc0, cerAlt: 0x5fd6c0,
    rampaA: 0xfffaf2, rampaB: 0x35bfe0, rampaArka: 0x2aa3c4, rampaYan: 0x2493b3, rampaDirek: 0xff6fa8,
    okA: '#1f7df0', okB: '#49d6ff', haleA: 0.2,
    toz: [0xff6fa8, 0x49c6ff, 0xffd84a, 0x7fdc6a, 0xb98cff], tozA: 0.9, tozB0: 0.26, tozB1: 0.2, tozOmur: 0.5, tozYc: 7, puf: 0xfff0f5,
    piril: [0xffffff, 0xff9ad5, 0xffe066, 0x8fe8ff, 0xc9a6ff],
    yol(g, w, h) {
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#f6a5c8'); gr.addColorStop(0.14, '#fcc3da'); gr.addColorStop(0.5, '#ffdfe8'); gr.addColorStop(0.86, '#fcc3da'); gr.addColorStop(1, '#f6a5c8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      psLeke(g, w, h, 60, ['#fff2ea', '#f9b6d2'], 0.16, 16, 38);                                     // fondan dalgaları
      psKenarGolge(g, w, h, '214,96,150');
      const renk = ['#ff5f9e', '#3fb8f5', '#ffc93a', '#63cf6a', '#a77bf0', '#ffffff']; g.lineCap = 'round'; g.lineWidth = 4; g.globalAlpha = 0.85;
      for (let i = 0; i < 36; i++) {                                                               // şeker serpintisi
        const x = R() * w, y = R() * h, a = R() * 3.14, cx = Math.cos(a) * 3, cy = Math.sin(a) * 5; if (Math.abs(x - w / 2) < 22) continue;
        g.strokeStyle = renk[i % 6]; for (const dy of [-h, 0, h]) { g.beginPath(); g.moveTo(x - cx, y + dy - cy); g.lineTo(x + cx, y + dy + cy); g.stroke(); }
      }
      psOrtaCizgi(g, w, h, 'rgba(235,84,150,0.6)', 22, '#ffffff');
    },
    kemerEk(tb, X0, H) {                                                                            // iki yanda dev lolipop
      for (const yan of [-1, 1]) {
        const x = yan * (X0 + 1.9), y = 4.5;
        psParca(tb, G.sil, 0xfffaf2, x, 1.75, 0, 0.12, 3.5, 0.12);
        [[1.2, 0.30, 0xff6fa8], [0.88, 0.36, 0xfffaf2], [0.58, 0.42, 0x49c6ff], [0.28, 0.48, 0xffd84a]].forEach(q => psParca(tb, G.sil, q[2], x, y, 0, q[0], q[1], q[0], Math.PI / 2));
      }
    }
  },
  uzay: {   // Ay Pisti: koyu lacivert-mor parlak yol, neon çizgiler, ışıklı bantlar, uzay kapısı
    isik: 0.62, parlat: 0.8, omuz: '#6e74a6', omuzAcik: '#9aa0cc', bantA: '#3fe8ff', bantB: '#4b3cc0', bantGolge: 'rgba(10,8,50,0.35)',
    direkA: 0x3fe8ff, direkB: 0x5a48d6, ayak: 0x8a90c8, sus: 0xffe45c, cerUst: 0x3fe8ff, cerAlt: 0xffe45c,
    rampaA: 0xffe45c, rampaB: 0xff5fb8, rampaArka: 0xd948a0, rampaYan: 0xb83a8c, rampaDirek: 0x3fe8ff,
    okA: '#0fbf73', okB: '#9dff6a', okGolge: 'rgba(0,90,50,0.65)', hale: 0xffd24a, haleA: 0.32,
    toz: [0xffffff, 0x9fe8ff, 0xfff3a0], tozA: 0.85, tozB0: 0.34, tozB1: 0.06, tozOmur: 0.42, tozPiril: true, puf: 0xcfc8f2,
    piril: [0xffffff, 0x7ff0ff, 0xffe45c, 0xc9a6ff, 0xff8fd8],
    yol(g, w, h) {
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#15103c'); gr.addColorStop(0.5, '#2a226c'); gr.addColorStop(1, '#15103c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (const u of [0.27, 0.73]) { const x = u * w, p = g.createLinearGradient(x - 60, 0, x + 60, 0); p.addColorStop(0, 'rgba(120,110,240,0)'); p.addColorStop(0.5, 'rgba(120,110,240,0.20)'); p.addColorStop(1, 'rgba(120,110,240,0)'); g.fillStyle = p; g.fillRect(x - 60, 0, 120, h); }   // parlak şerit
      g.fillStyle = 'rgba(130,145,255,0.12)'; for (let y = 0; y < h; y += h / 4) g.fillRect(0, y, w, 3);       // levha ekleri
      psLeke(g, w, h, 240, ['#ffffff', '#9fe8ff', '#c9b8ff'], 0.42, 0.9, 2.1, 2);                        // yıldız tozu
      for (const x of [24, w - 24]) { const p = g.createLinearGradient(x - 16, 0, x + 16, 0); p.addColorStop(0, 'rgba(255,228,92,0)'); p.addColorStop(0.5, 'rgba(255,228,92,0.45)'); p.addColorStop(1, 'rgba(255,228,92,0)'); g.fillStyle = p; g.fillRect(x - 16, 0, 32, h); g.fillStyle = '#ffe45c'; g.fillRect(x - 3.5, 0, 7, h); }   // neon kenar çizgisi
      psOrtaCizgi(g, w, h, 'rgba(63,232,255,0.32)', 34, '#4feaff', '#ffffff');
    },
    kemerEk(tb, X0, H) {                                                                            // ışıklı kapı kemeri + direk halkaları
      psParca(tb, new T.TorusGeometry(X0, 0.42, 8, 28, Math.PI), 0x3fe8ff, 0, H + 0.15, 0, 1, 0.3, 1);
      const halka = new T.TorusGeometry(0.72, 0.13, 6, 16);
      for (const yan of [-1, 1]) for (const y of [2.6, 5.2, 7.8]) psParca(tb, halka, 0xffe45c, yan * X0, y, 0, 1, 1, 1, Math.PI / 2);
    }
  },
  col: {   // Çöl Vadisi: sıkışmış kum-taş döşeme, kiremit-krem bantlar, tahta ve halat kemer
    omuz: '#dba867', omuzAcik: '#edc48a', bantA: '#c5432c', bantB: '#f8e6c4', bantGolge: 'rgba(110,50,20,0.25)',
    direkA: 0x9c6337, direkB: 0xb9824c, ayak: 0xc9623c, sus: 0xf4dfae, cerUst: 0xb9824c, cerAlt: 0x8a5630,
    rampaA: 0xf8e6c4, rampaB: 0x22ab9e, rampaArka: 0x1c9186, rampaYan: 0x187e75, rampaDirek: 0xc5432c,
    okA: '#1280e8', okB: '#3fd6ff', haleA: 0.22,
    toz: [0xe9c48e, 0xf3d7a6, 0xdcae74], tozA: 0.42, tozB0: 0.5, tozB1: 1.4, tozOmur: 0.4, puf: 0xf0d3a2,
    piril: [0xffffff, 0xffe066, 0xffb347, 0xff8a4a, 0x8fe8ff],
    yol(g, w, h) {
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#c98549'); gr.addColorStop(0.12, '#d6975a'); gr.addColorStop(0.5, '#dea468'); gr.addColorStop(0.88, '#d6975a'); gr.addColorStop(1, '#c98549'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const sat = 8, sut = 6, sh = h / sat, sw = w / sut, ton = ['#efc48a', '#e6b478', '#f3cd97', '#e2ad70', '#ecbe82'];
      for (let r = 0; r < sat; r++) for (let c = 0; c <= sut; c++) {                                 // yuvarlak köşeli taş döşeme
        const x = (c - (r % 2 ? 0.5 : 0)) * sw, y = r * sh;
        g.fillStyle = ton[Math.floor(R() * 5)]; g.beginPath(); g.roundRect(x + 3, y + 3, sw - 6, sh - 6, 13); g.fill();
        g.fillStyle = 'rgba(255,240,205,0.35)'; g.beginPath(); g.roundRect(x + 7, y + 6, sw - 22, 7, 4); g.fill();
      }
      psLeke(g, w, h, 520, ['#f4d6a6', '#cf9a62', '#f7e0b8'], 0.28, 0.9, 2.2, 3);                        // kum taneleri
      psKenarGolge(g, w, h, '140,80,40');
      psOrtaCizgi(g, w, h, 'rgba(120,62,28,0.7)', 23, '#fffaea');
    },
    kemerEk(tb, X0, H) {                                                                            // direklerde halat sargıları
      for (const yan of [-1, 1]) for (const y of [2.3, 2.62, 2.94, 7.4, 7.72]) psParca(tb, G.sil, 0xf0dcae, yan * X0, y, 0, 0.45, 0.24, 0.45);
    }
  },
  gokkusagi: {   // Gökkuşağı Yolu: yedi renkli parlak şerit yol, beyaz-altın bantlar, gökkuşağı yaylı kemer, renkli pırıltı izi
    isik: 0.16, parlat: 0.5, duzOmuz: true, omuz: '#ffffff', omuzAcik: '#e4f1ff', bantA: '#ffcb3d', bantB: '#ffffff', bantGolge: 'rgba(150,120,200,0.25)',
    direkA: 0xffd24a, direkB: 0xffffff, ayak: 0xb98cff, sus: 0xffd24a, cerUst: 0xffffff, cerAlt: 0xffd24a,
    rampaA: 0xffffff, rampaB: 0x8a5cf0, rampaArka: 0x6f45cf, rampaYan: 0x5f3ab8, rampaDirek: 0xff6fa8,
    okA: '#d81f8c', okB: '#ff7ac8', okGolge: 'rgba(120,0,80,0.6)', hale: 0xffffff, haleA: 0.26, golgeA: 0.42,
    toz: [0xff7d8f, 0xffc45e, 0xfff07a, 0x8ff09a, 0x7fd6ff, 0xc9a6ff], tozA: 0.9, tozB0: 0.36, tozB1: 0.06, tozOmur: 0.45, tozPiril: true, puf: 0xffffff,
    piril: [0xffffff, 0xff8fb0, 0xffe066, 0x8fe8ff, 0xc9a6ff],
    yol(g, w, h) {
      const renk = ['#ff7f93', '#ffa95c', '#ffe168', '#78dc88', '#5ec4ff', '#7c8bff', '#c58bff'];
      const gr = g.createLinearGradient(0, 0, w, 0); renk.forEach((r, i) => { gr.addColorStop((i + 0.2) / 7, r); gr.addColorStop((i + 0.8) / 7, r); }); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 7; i++) { const x = (i + 0.5) / 7 * w, p = g.createLinearGradient(x - 28, 0, x + 28, 0); p.addColorStop(0, 'rgba(255,255,255,0)'); p.addColorStop(0.5, 'rgba(255,255,255,0.24)'); p.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = p; g.fillRect(x - 28, 0, 56, h); }   // şerit parlaklığı
      psLeke(g, w, h, 170, ['#ffffff', '#fffbd6'], 0.6, 1.0, 2.3, 2);                                    // pırıltı tozu
      g.fillStyle = 'rgba(255,255,255,0.92)'; g.fillRect(0, 0, 9, h); g.fillRect(w - 9, 0, 9, h);
      psOrtaCizgi(g, w, h, 'rgba(255,255,255,0.4)', 27, '#ffffff');
    },
    kemerEk(tb, X0, H) {                                                                            // kemerin üstünde gökkuşağı yayı + iki ucunda bulut
      [0xff6f86, 0xff9a4a, 0xffdc50, 0x62d47a, 0x4ab8ff, 0x6f7cf5, 0xb97cf5].forEach((r, i) => psParca(tb, new T.TorusGeometry(X0 + 0.7 - i * 0.44, 0.23, 6, 26, Math.PI), r, 0, H + 0.35, -0.7, 1, 0.46, 1));
      for (const yan of [-1, 1]) [[-0.6, 0.2, 1.25], [0.9, 0.35, 1.05], [-2.0, 0.15, 0.95], [-3.1, 0.05, 0.7]].forEach(q => psParca(tb, G.kure, 0xffffff, yan * (X0 - 0.6 + q[0]), H + 0.5 + q[1], -0.75, q[2], q[2] * 0.78, q[2] * 0.8));
    }
  },
  dino: {   // Dinozor Vadisi: kırmızımsı toprak-taş yol, ayak izleri, yeşil-krem bantlar, kütük ve yapraklı kemer
    omuz: '#5f9e3e', omuzAcik: '#8cc45c', bantA: '#3f9440', bantB: '#f7edc9', bantGolge: 'rgba(90,40,20,0.28)',
    direkA: 0x8f5c34, direkB: 0xa9733f, ayak: 0x6d4526, sus: 0x5fae45, cerUst: 0x8f5c34, cerAlt: 0x8f5c34,
    rampaA: 0xf7edc9, rampaB: 0x3f9a4a, rampaArka: 0x2f7f3c, rampaYan: 0x286e34, rampaDirek: 0x8f5c34,
    okA: '#1280e8', okB: '#45d8ff', haleA: 0.24, golgeA: 0.42,
    toz: [0xdba27c, 0xe9b993, 0xc98a66], tozA: 0.44, tozB0: 0.5, tozB1: 1.45, tozOmur: 0.4, puf: 0xe8bd9a,
    piril: [0xffffff, 0xffe066, 0xffb347, 0x9fe86a, 0x8fe8ff],
    yol(g, w, h) {
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#a4503a'); gr.addColorStop(0.13, '#b65f44'); gr.addColorStop(0.5, '#c46c4d'); gr.addColorStop(0.87, '#b65f44'); gr.addColorStop(1, '#a4503a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      psLeke(g, w, h, 80, ['#d68462', '#a34d38'], 0.13, 16, 40);                                     // toprak lekeleri
      for (let i = 0; i < 30; i++) {                                                                // yassı taşlar
        const x = R() * w, y = R() * h, rx = 9 + R() * 12, ry = 7 + R() * 9; if (Math.abs(x - w / 2) < 30) continue;
        for (const dy of [-h, 0, h]) { g.fillStyle = 'rgba(110,44,30,0.35)'; g.beginPath(); g.ellipse(x + 2, y + dy + 3, rx, ry, 0, 0, 7); g.fill(); g.fillStyle = i % 3 ? '#d99270' : '#e2a585'; g.beginPath(); g.ellipse(x, y + dy, rx, ry, 0, 0, 7); g.fill(); }
      }
      psLeke(g, w, h, 520, ['#dc9a78', '#a85540', '#e6b090'], 0.28, 0.9, 2.2, 3);                        // çakıl
      g.fillStyle = 'rgba(104,38,24,0.36)';                                                         // üç parmaklı dinozor ayak izleri
      const iz = (x, y, s) => { for (const dy of [-h, 0, h]) { g.save(); g.translate(x, y + dy); g.scale(s, s); g.beginPath(); g.ellipse(0, 9, 14, 16, 0, 0, 7); g.fill(); for (const a of [-0.62, 0, 0.62]) { g.save(); g.rotate(a); g.beginPath(); g.ellipse(0, -24, 6, 14, 0, 0, 7); g.fill(); g.restore(); } g.restore(); } };
      iz(w * 0.22, h * 0.14, 1.1); iz(w * 0.33, h * 0.47, 1.1); iz(w * 0.22, h * 0.80, 1.1); iz(w * 0.69, h * 0.30, 1.1); iz(w * 0.80, h * 0.63, 1.1); iz(w * 0.69, h * 0.96, 1.1);
      psKenarGolge(g, w, h, '104,40,26');
      psOrtaCizgi(g, w, h, 'rgba(100,38,24,0.7)', 23, '#fff5d8');
    },
    kemerEk(tb, X0, H) {                                                                            // iri kütükler + yaprak kümeleri
      for (const y of [H - 0.02, H - 1.98]) { psParca(tb, G.sil, 0x9a6638, 0, y, 0, 0.44, X0 * 2 + 2.6, 0.44, 0, 0, Math.PI / 2); for (const yan of [-1, 1]) psParca(tb, G.sil, 0xf0d9a8, yan * (X0 + 1.31), y, 0, 0.36, 0.04, 0.36, 0, 0, Math.PI / 2); }
      for (const yan of [-1, 1]) {
        const x = yan * X0;
        for (const y of [2.2, 4.6, 7.0]) psParca(tb, G.sil, 0x6d4526, x, y, 0, 0.47, 0.2, 0.47);        // kütük boğumları
        [[-0.9, H + 0.45, 0.2, 0.5], [0.9, H + 0.4, -0.2, -0.5], [0, H + 0.2, 0.75, 0], [-0.85, 1.0, 0.3, 0.4], [0.85, 0.95, 0.3, -0.4]].forEach((q, i) => psParca(tb, G.kure, i % 2 ? 0x4fa63e : 0x6cc24e, x + q[0], q[1], q[2], 1.05, 0.34, 0.6, 0, 0, q[3]));
      }
    }
  },
  sehir: {   // Oyuncak Şehir: koyu gri asfalt, beyaz kesikli çizgi, sarı-siyah oyuncak bariyer, renkli bloklardan kemer
    duzOmuz: true, omuz: '#c6ccd6', omuzAcik: '#e6eaf0', bantA: '#ffcf2e', bantB: '#2b2e36', bantGolge: 'rgba(0,0,0,0.3)',
    direkA: 0xff5f4d, direkB: 0xfff4e2, ayak: 0x4aa8ff, sus: 0xffd23f, cerUst: 0x4aa8ff, cerAlt: 0xff5f4d,
    rampaA: 0xffd23f, rampaB: 0xff5f4d, rampaArka: 0xe24a3a, rampaYan: 0xc93f31, rampaDirek: 0x4aa8ff,
    okA: '#12a05a', okB: '#7dff8a', okGolge: 'rgba(0,80,40,0.65)', haleA: 0.3, golgeA: 0.5,
    toz: [0xe6e9ef, 0xd2d6de], tozA: 0.3, tozB0: 0.42, tozB1: 1.3, tozOmur: 0.4, puf: 0xe6e9ef,
    yol(g, w, h) {
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#454a56'); gr.addColorStop(0.5, '#555a67'); gr.addColorStop(1, '#454a56'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      psLeke(g, w, h, 60, ['#565c69', '#363a44'], 0.14, 16, 40);
      psLeke(g, w, h, 900, ['#636976', '#363a44', '#717783'], 0.26, 0.9, 2.0, 3);                        // asfalt taneleri
      psKenarGolge(g, w, h, '18,20,26');
      g.fillStyle = '#ffd23f'; g.fillRect(17, 0, 8, h); g.fillRect(w - 25, 0, 8, h);                 // sarı kenar çizgileri
      psOrtaCizgi(g, w, h, 'rgba(0,0,0,0.35)', 21, '#ffffff');
    },
    kemerEk(tb, X0, H) {                                                                            // üst üste dizilmiş oyuncak bloklar
      const renk = [0xff5f4d, 0xffd23f, 0x4aa8ff, 0x62cf5a, 0xb98cff, 0xff9a3c];
      for (const yan of [-1, 1]) {
        for (let i = 0; i < 6; i++) psParca(tb, G.kutu, renk[(i + (yan > 0 ? 2 : 0)) % 6], yan * X0, 0.78 + (i + 0.5) * 1.42, 0, 1.3, 1.36, 1.3, 0, i % 2 ? 0.3 : -0.12, 0);
        [4.7, 7.0].forEach((x, i) => psParca(tb, G.kutu, renk[(i * 3 + (yan > 0 ? 1 : 4)) % 6], yan * x, H + 0.62, 0, 0.95, 0.95, 0.95, 0, yan * 0.25, 0));
      }
    }
  },
  /*SATO*/
  sato: {   // Şato ve Ejderha Vadisi: yuvarlak taşlı açık gri-bej parke, kırmızı-krem bantlar, mazgallı taş kemer
    omuz: '#5aa83e', omuzAcik: '#86c75a', bantA: '#dc4a3f', bantB: '#f8f0dc', bantGolge: 'rgba(90,60,40,0.26)',
    direkA: 0xe2d8c4, direkB: 0xcbbfa8, ayak: 0x9a8f7e, sus: 0x3f82dc, cerUst: 0xdc4a3f, cerAlt: 0x3f82dc,
    rampaA: 0xf8f0dc, rampaB: 0xdc4a3f, rampaArka: 0xbd3b32, rampaYan: 0xa8342c, rampaDirek: 0x3f82dc,
    okA: '#1280e8', okB: '#45d8ff', haleA: 0.24, golgeA: 0.4,
    toz: [0xd9cfbd, 0xe6ddca, 0xc9bda8], tozA: 0.4, tozB0: 0.5, tozB1: 1.4, tozOmur: 0.4, puf: 0xe6ddca,
    piril: [0xffffff, 0xffe066, 0xffb347, 0x8fe8ff, 0xd2b6f7],
    yol(g, w, h) {
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#9c9180'); gr.addColorStop(0.12, '#aa9f8d'); gr.addColorStop(0.5, '#b2a794'); gr.addColorStop(0.88, '#aa9f8d'); gr.addColorStop(1, '#9c9180'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const sat = 12, sut = 7, sh = h / sat, sw = w / sut, ton = ['#cbbfaa', '#c3b7a1', '#d1c6b2', '#bfb39c', '#c8bca6'];
      for (let r = 0; r < sat; r++) for (let c = 0; c <= sut; c++) {                                 // yuvarlak, kabarık parke taşları (dikeyde ek yeri yok: sat tam bölünür)
        const x = (c - (r % 2 ? 0.5 : 0)) * sw, y = r * sh, e = Math.abs(x + sw / 2 - w / 2) / (w / 2), k = 1 - 0.1 * e;
        g.fillStyle = ton[Math.floor(R() * 5)]; g.globalAlpha = k; g.beginPath(); g.roundRect(x + 3, y + 3, sw - 6, sh - 6, 16); g.fill(); g.globalAlpha = 1;
        g.fillStyle = 'rgba(255,250,236,0.32)'; g.beginPath(); g.roundRect(x + 8, y + 6, sw - 22, 6, 3); g.fill();
        g.fillStyle = 'rgba(90,76,60,0.16)'; g.beginPath(); g.roundRect(x + 6, y + sh - 12, sw - 14, 6, 3); g.fill();
      }
      psLeke(g, w, h, 420, ['#d8cdb9', '#9a8f7c', '#e2d9c6'], 0.22, 0.9, 2.0, 3);                        // ince taneler
      psKenarGolge(g, w, h, '80,66,50');
      psOrtaCizgi(g, w, h, 'rgba(90,70,50,0.55)', 23, '#fffaf0');
    },
    kemerEk(tb, X0, H) {                                                                            // üst kirişte taş mazgallar, direklerde taş halkalar
      for (let i = 0; i < 9; i++) { const x = lerp(-X0 + 0.6, X0 - 0.6, i / 8); if (Math.abs(x) > X0 - 1.2) continue; psParca(tb, G.kutu, i % 2 ? 0xe2d8c4 : 0xf0e8d6, x, H + 0.55, 0, 0.75, 0.7, 0.62); }
      for (const yan of [-1, 1]) for (const y of [2.4, 6.2]) psParca(tb, G.sil, 0xf0e8d6, yan * X0, y, 0, 0.5, 0.3, 0.5);
    }
  }
  /*/SATO*/,
  /*LUNAPARK*/
  lunapark: {   // Gece Lunaparkı: açık lila-krem taş yol, kenarda sıcak sarı ampul şeridi, pembe-krem bantlar, ampullü pembe kemer
    isik: 0.2, parlat: 0.6, omuz: '#3f8f86', omuzAcik: '#58ab9c', bantA: '#ff6fae', bantB: '#fff3dc', bantGolge: 'rgba(40,20,80,0.3)',
    direkA: 0xff6fae, direkB: 0xfff3dc, ayak: 0x3fd4d0, sus: 0xffd23f, cerUst: 0x3fd4d0, cerAlt: 0xff6fae,
    rampaA: 0xffd23f, rampaB: 0xff6fae, rampaArka: 0xe0559a, rampaYan: 0xc8488a, rampaDirek: 0x3fd4d0,
    okA: '#0fae9a', okB: '#7dffd8', okGolge: 'rgba(0,70,70,0.65)', hale: 0xffd24a, haleA: 0.32, golgeA: 0.45,
    toz: [0xfff3dc, 0xffd8ec, 0xc8fff6], tozA: 0.6, tozB0: 0.36, tozB1: 0.9, tozOmur: 0.4, tozPiril: true, puf: 0xf2e8ff,
    piril: [0xffffff, 0xffe066, 0xff9ad5, 0x8ff0e8, 0xffc0e0],
    yol(g, w, h) {
      const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#b8acd0'); gr.addColorStop(0.15, '#cbc0de'); gr.addColorStop(0.5, '#d8cfe6'); gr.addColorStop(0.85, '#cbc0de'); gr.addColorStop(1, '#b8acd0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(120,100,160,0.13)'; for (let y = 0; y < h; y += h / 8) g.fillRect(36, y, w - 72, 2);                 // taş döşeme ekleri
      psLeke(g, w, h, 60, ['#e2daee', '#b2a6ca'], 0.16, 14, 36);
      psLeke(g, w, h, 700, ['#e8e2f2', '#a99cc4', '#f2d8e6'], 0.24, 0.9, 2.0, 3);
      psKenarGolge(g, w, h, '70,50,120');
      for (const x of [22, w - 22]) {                                                                // kenarda lacivert şerit + sıcak sarı ampul noktaları
        g.fillStyle = '#3a3f8e'; g.fillRect(x - 9, 0, 18, h);
        for (let y = h / 16; y < h; y += h / 8) { const p = g.createRadialGradient(x, y, 0, x, y, 9); p.addColorStop(0, '#fffbe0'); p.addColorStop(0.5, '#ffd23f'); p.addColorStop(1, 'rgba(255,210,63,0)'); g.fillStyle = p; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); }
      }
      psOrtaCizgi(g, w, h, 'rgba(120,40,100,0.3)', 23, '#ff8cc0', '#ffffff');
    },
    kemerEk(tb, X0, H) {                                                                            // pembe yay kemer + ampul topları
      psParca(tb, new T.TorusGeometry(X0, 0.4, 8, 28, Math.PI), 0xff6fae, 0, H + 0.15, 0, 1, 0.32, 1);
      for (let k = 0; k <= 10; k++) { const a = k / 10 * Math.PI; psParca(tb, G.kure, [0xffe066, 0x8ff0e8, 0xffffff][k % 3], Math.cos(a) * X0, H + 0.15 + Math.sin(a) * X0 * 0.32 + 0.45, 0, 0.3, 0.3, 0.3); }
      for (const yan of [-1, 1]) for (const y of [2.6, 5.2, 7.8]) psParca(tb, G.kure, 0xffe066, yan * X0, y, 0, 0.55, 0.3, 0.55);
    }
  }
  /*/LUNAPARK*/,
  /*KORSAN*/
  korsan: {   // Korsan Adası: bal rengi ahşap iskele döşemesi (enine tahtalar), kırmızı-krem halat bantları, altın kum omzu, halatlı ve fıçılı kemer
    omuz: '#f0cf88', omuzAcik: '#f9e3b0', bantA: '#d8473a', bantB: '#fff3dc', bantGolge: 'rgba(110,50,20,0.25)',
    direkA: 0x8d5631, direkB: 0xc58a52, ayak: 0xd8473a, sus: 0xffcf3a, cerUst: 0xffcf3a, cerAlt: 0xd8473a,
    rampaA: 0xffcf3a, rampaB: 0xd8473a, rampaArka: 0xb93a2f, rampaYan: 0xa83328, rampaDudak: 0xfff3dc, rampaDirek: 0x8d5631,
    okA: '#0f8fd8', okB: '#3fe0ff', haleA: 0.24, golgeA: 0.4,
    toz: [0xf3deb0, 0xe9c88e], tozA: 0.38, puf: 0xf8e8c6,
    piril: [0xffffff, 0xffe066, 0xffcf3a, 0x5fe0e0, 0xff8a6a],
    yol(g, w, h) {
      const n = 10, th = h / n, ton = ['#d79c5e', '#cf9455', '#dda466', '#d39858', '#e0a96c'];
      g.fillStyle = '#b97f47'; g.fillRect(0, 0, w, h);
      for (let r = 0; r < n; r++) {                                                                 // enine tahtalar: yumuşak aralık, ton farkı
        const y = r * th, kay = (r * 37) % 3;
        g.fillStyle = ton[(r * 3 + kay) % 5]; g.beginPath(); g.roundRect(-8, y + 2.5, w + 16, th - 5, 6); g.fill();
        const gr = g.createLinearGradient(0, y, 0, y + th); gr.addColorStop(0, 'rgba(255,236,200,0.22)'); gr.addColorStop(0.35, 'rgba(255,236,200,0)'); gr.addColorStop(1, 'rgba(110,64,28,0.16)'); g.fillStyle = gr; g.fillRect(0, y + 2.5, w, th - 5);
        g.globalAlpha = 0.12; g.strokeStyle = '#8a5a30'; g.lineWidth = 1.5;                           // hafif damar
        for (let k = 0; k < 3; k++) { const yy = y + 10 + R() * (th - 20); g.beginPath(); g.moveTo(R() * w * 0.3, yy); g.bezierCurveTo(w * 0.4, yy + 3, w * 0.6, yy - 3, w * (0.7 + R() * 0.3), yy); g.stroke(); }
        g.globalAlpha = 1;
        if (r % 2 === 0) { const x = 140 + (r * 53) % 230; g.fillStyle = 'rgba(120,72,34,0.35)'; g.fillRect(x, y + 2.5, 4, th - 5); }   // seyrek ek yeri
      }
      for (const x of [0, w]) { const k = g.createLinearGradient(x ? w - 52 : 0, 0, x ? w : 52, 0); k.addColorStop(x ? 1 : 0, 'rgba(96,56,24,0.55)'); k.addColorStop(x ? 0 : 1, 'rgba(96,56,24,0)'); g.fillStyle = k; g.fillRect(x ? w - 52 : 0, 0, 52, h); }   // kenar kirişi gölgesi
      for (let r = 0; r < n; r++) for (const x of [26, w - 26]) { g.fillStyle = 'rgba(90,60,40,0.55)'; g.beginPath(); g.arc(x, r * th + th / 2, 3.2, 0, 7); g.fill(); }   // çiviler
      psOrtaCizgi(g, w, h, 'rgba(110,64,28,0.35)', 21, '#fff3dc');
    },
    kemerEk(tb, X0, H) {                                                                            // direklerde halat sargıları, dipte fıçı, üstte altın para
      for (const yan of [-1, 1]) {
        for (const y of [2.3, 2.62, 2.94, 7.4, 7.72]) psParca(tb, G.sil, 0xf0dcae, yan * X0, y, 0, 0.45, 0.24, 0.45);
        const bx = yan * (X0 + 1.4); psParca(tb, G.sil, 0xb57a45, bx, 0.6, -0.3, 0.62, 1.2, 0.62); for (const y of [0.25, 0.95]) psParca(tb, G.sil, 0xd8473a, bx, y, -0.3, 0.65, 0.12, 0.65);
        psParca(tb, G.sil, 0xffcf3a, yan * X0, H + 1.2, 0, 0.7, 0.16, 0.7, Math.PI / 2);
      }
    }
  }
  /*/KORSAN*/
};
const psTema = Object.assign({}, psTEMA_ORTAK, psTEMALAR[cvTema] || psTEMALAR.orman);
const psIsik = o => psTema.isik ? Object.assign(o, { emissive: 0xffffff, emissiveMap: o.map, emissiveIntensity: psTema.isik }) : o;   // karanlık pistte yol kendi ışığıyla seçilir

// ───────── yol ─────────
const yolDoku = tuvalDoku(512, 512, (g, w, h) => {
  if (psTema.yol) { psTema.yol(g, w, h); return; }
  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, '#cf9f66'); gr.addColorStop(0.12, '#dcb27c'); gr.addColorStop(0.5, '#e6c08c'); gr.addColorStop(0.88, '#dcb27c'); gr.addColorStop(1, '#cf9f66');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const leke = (x, y, rx, ry, renk, a) => { g.globalAlpha = a; g.fillStyle = renk; for (const dy of [-h, 0, h]) { g.beginPath(); g.ellipse(x, y + dy, rx, ry, 0, 0, 7); g.fill(); } };
  for (let i = 0; i < 90; i++) leke(R() * w, R() * h, 14 + R() * 26, 20 + R() * 40, i % 2 ? '#c99a62' : '#eccb9a', 0.10);          // yumuşak lekeler
  for (let i = 0; i < 1500; i++) { const r = 0.9 + R() * 2.2, x = R() * w, y = R() * h; if (i % 3 === 0) leke(x, y, r * 0.7, r, ['#c99a62', '#ecd0a2', '#c29360', '#e6c595'][(i / 3) % 4], 0.32); }   // seyrek çakıl (rastgele sıra korunur)   // çakıl
  for (let i = 0; i < 46; i++) { const r = 3 + R() * 3; const x = R() * w, y = R() * h; if (i % 2 || Math.abs(x - w / 2) < 16) continue; leke(x + 1, y + 2, r * 0.75, r, '#a67c4b', 0.22); leke(x, y, r * 0.7, r, i % 3 ? '#efdcbb' : '#dcc6a4', 0.75); }   // iri taşlar
  for (const u of [0.2, 0.34, 0.66, 0.8]) {   // tekerlek izleri
    const x = u * w, iz = g.createLinearGradient(x - 22, 0, x + 22, 0); iz.addColorStop(0, 'rgba(150,104,60,0)'); iz.addColorStop(0.5, 'rgba(150,104,60,0.17)'); iz.addColorStop(1, 'rgba(150,104,60,0)');
    g.globalAlpha = 1; g.fillStyle = iz; g.fillRect(x - 22, 0, 44, h);
  }
  g.globalAlpha = 1;
  for (const x of [0, w]) { const k = g.createLinearGradient(x ? w - 46 : 0, 0, x ? w : 46, 0); k.addColorStop(x ? 1 : 0, 'rgba(140,96,56,0.42)'); k.addColorStop(x ? 0 : 1, 'rgba(140,96,56,0)'); g.fillStyle = k; g.fillRect(x ? w - 46 : 0, 0, 46, h); }
  // orta çizgi (kesikli, yuvarlak uçlu)
  g.lineCap = 'round'; g.strokeStyle = 'rgba(150,104,60,0.35)'; g.lineWidth = 19; g.beginPath(); g.moveTo(w / 2 + 2, h * 0.14 + 5); g.lineTo(w / 2 + 2, h * 0.50 + 5); g.stroke();
  g.strokeStyle = '#fff8e6'; g.lineWidth = 15; g.beginPath(); g.moveTo(w / 2, h * 0.14); g.lineTo(w / 2, h * 0.50); g.stroke();
  g.globalAlpha = 0.3; g.fillStyle = '#e6c08c'; for (let i = 0; i < 26; i++) { const x = w / 2 - 7 + R() * 14, y = h * 0.14 + R() * h * 0.36, a = 1 + R() * 1.5, b = 1.5 + R() * 2; if (i % 2) continue; g.beginPath(); g.ellipse(x, y, a, b, 0, 0, 7); g.fill(); }
  g.globalAlpha = 1;
}, true);
scene.add(new T.Mesh(serit(-YARI, YARI, 0.02, 9), mat(0xffffff, psIsik({ map: yolDoku }))));

// kenar bantları + çim geçişi (iki yan tek parça)
const bantDoku = tuvalDoku(128, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = psTema.omuz; g.fillRect(w * 0.5, 0, w * 0.3, h);                                   // temaya uygun yol omzu
  if (!psTema.duzOmuz) for (let i = 0; i < 40; i++) { const y = i / 40 * h, u = 10 + R() * 22; g.beginPath(); g.moveTo(w * 0.78, y - 5); g.lineTo(w * 0.78 + u, y + 1); g.lineTo(w * 0.78, y + 7); g.fill(); }   // çim uçları
  g.fillStyle = psTema.omuzAcik; for (let i = 0; i < 60; i++) g.fillRect(w * 0.6 + R() * w * 0.2, R() * h, 3, 7);
  g.fillStyle = psTema.bantB; g.fillRect(0, 0, w * 0.58, h);
  g.fillStyle = psTema.bantA;
  if (psTema.capraz) {   // şeker çubuğu gibi çapraz çizgiler (dikeyde eksiz yinelenir)
    g.save(); g.beginPath(); g.rect(w * 0.08, 0, w * 0.50, h); g.clip();
    for (let y = -h; y < h * 2; y += h / 2) { g.beginPath(); g.moveTo(w * 0.08, y); g.lineTo(w * 0.58, y + h * 0.3); g.lineTo(w * 0.58, y + h * 0.55); g.lineTo(w * 0.08, y + h * 0.25); g.fill(); }
    g.restore();
  } else g.fillRect(w * 0.1, 0, w * 0.48, h / 2);
  g.fillStyle = psTema.bantGolge; g.fillRect(w * 0.54, 0, w * 0.04, h);
  { const k = g.createLinearGradient(w * 0.58, 0, w * 0.72, 0); k.addColorStop(0, 'rgba(0,0,0,0.16)'); k.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = k; g.fillRect(w * 0.58, 0, w * 0.14, h); }   // bant omza yumuşak gölge bırakır: yol zemine oturur
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(w * 0.1, 0, w * 0.05, psTema.capraz ? h : h / 2);
}, true);
const bantMat = mat(0xffffff, psIsik({ map: bantDoku, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
{
  const pos = [], uv = [], nor = [], idx = [];
  for (const yan of [-1, 1]) {
    const t0 = pos.length / 3, ic = yan * (YARI - 0.2), dis = yan * (YARI + 2.0);
    for (let i = 0; i <= N; i++) {
      const k = i % N, rx = -TZ[k], rz = TX[k], v = i * DS / 3, a = yan < 0 ? dis : ic, b = yan < 0 ? ic : dis;
      pos.push(PX[k] + rx * a, 0.05, PZ[k] + rz * a, PX[k] + rx * b, 0.05, PZ[k] + rz * b); nor.push(0, 1, 0, 0, 1, 0); uv.push(yan < 0 ? 1 : 0, v, yan < 0 ? 0 : 1, v);
      if (i < N) { const q = t0 + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new T.Mesh(g, bantMat); m.frustumCulled = false; scene.add(m);
}

// ───────── tek parça renkli süs kurucusu (kemer, tümsekler tek çizimde) ─────────
const psV = [], psNo = [], psC = [], psK = new T.Object3D(), psM = new T.Matrix4(), psN3 = new T.Matrix3(), psA = new T.Vector3(), psB = new T.Vector3(), psD = new T.Vector3();
function psTaban(s, d) { const p = pist(s), m = new T.Matrix4(); psK.position.set(p.x - p.tz * d, 0, p.z + p.tx * d); psK.scale.set(1, 1, 1); psK.rotation.set(0, Math.atan2(p.tx, p.tz), 0); psK.updateMatrix(); return m.copy(psK.matrix); }
function psParca(taban, geo, renk, x, y, z, sx, sy, sz, rx, ry, rz) {
  psK.position.set(x, y, z); psK.scale.set(sx, sy, sz); psK.rotation.set(rx || 0, ry || 0, rz || 0); psK.updateMatrix();
  psM.multiplyMatrices(taban, psK.matrix); psN3.getNormalMatrix(psM); renkT.setHex(renk);
  const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    psA.fromBufferAttribute(p, i).applyMatrix4(psM); psV.push(psA.x, psA.y, psA.z);
    psA.fromBufferAttribute(n, i).applyMatrix3(psN3).normalize(); psNo.push(psA.x, psA.y, psA.z); psC.push(renkT.r, renkT.g, renkT.b);
  }
}
function psYuz(taban, renk, n) {   // n: [x,y,z, x,y,z, ...] yerel köşeler (üçgen ya da dörtgen)
  renkT.setHex(renk); const k = [];
  for (let i = 0; i < n.length; i += 3) { psA.set(n[i], n[i + 1], n[i + 2]).applyMatrix4(taban); k.push(psA.x, psA.y, psA.z); }
  psA.set(k[3] - k[0], k[4] - k[1], k[5] - k[2]); psB.set(k[6] - k[0], k[7] - k[1], k[8] - k[2]); psD.crossVectors(psA, psB).normalize(); if (psD.y < 0) psD.negate();
  for (const i of (k.length > 9 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2])) { const f = 0.88 + 0.12 * clamp(n[i * 3 + 1], 0, 1); psV.push(k[i * 3], k[i * 3 + 1], k[i * 3 + 2]); psNo.push(psD.x, psD.y, psD.z); psC.push(renkT.r * f, renkT.g * f, renkT.b * f); }   // alçak köşeler hafif koyu: rampa düz karton gibi durmaz
}
function psCubuk(taban, renk, x1, y1, x2, y2, z, kalin) { const dx = x2 - x1, dy = y2 - y1; psParca(taban, G.kutu, renk, (x1 + x2) / 2, (y1 + y2) / 2, z, kalin, Math.hypot(dx, dy), kalin, 0, 0, -Math.atan2(dx, dy)); }

// yıldız biçimi (toplanan yıldızlar + kemer süsü)
const yildizSekil = new T.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - Math.PI / 2, r = i % 2 ? 0.46 : 1; yildizSekil[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, -Math.sin(a) * r); } yildizSekil.closePath();
const psYildizGeo = new T.ExtrudeGeometry(yildizSekil, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.13, bevelSize: 0.1, bevelSegments: 3 }); psYildizGeo.translate(0, 0, -0.08); psYildizGeo.computeVertexNormals();
{ // ön-arka yüz açık sarı, kenar pahı turuncu-altın: dönerken parlayan iki tonlu yıldız
  const n = psYildizGeo.attributes.normal, c = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) { const yuz = Math.abs(n.getZ(i)) > 0.9; c[i * 3] = 1; c[i * 3 + 1] = yuz ? 0.9 : 0.56; c[i * 3 + 2] = yuz ? 0.3 : 0.05; }
  psYildizGeo.setAttribute('color', new T.BufferAttribute(c, 3));
}
const psKureK = new T.SphereGeometry(1, 8, 6);   // kemer süsleri için az yüzlü küre

// ───────── başlangıç/bitiş kemeri ve çizgisi ─────────
// süsler gölgede de canlı renkli kalsın: kendi renginden biraz ışık ekler
function psParlat(m, oran) { m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n totalEmissiveRadiance += vColor.rgb * ' + oran.toFixed(2) + ';\n#endif'); }; return m; }
const psRENK = [0xff6f5a, 0xffd23f, 0x4aa8ff, 0x7ed957, 0xb98cff, 0xff8fc0];
const dama = tuvalDoku(256, 48, (g, w, h) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 3; y++) { g.fillStyle = (x + y) % 2 ? '#23262f' : '#ffffff'; g.fillRect(x * 16, y * 16, 16, 16); } });
dama.magFilter = T.NearestFilter;
const psAfis = tuvalDoku(352, 32, (g, w, h) => { for (let x = 0; x < 22; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#23262f' : '#ffffff'; g.fillRect(x * 16, y * 16, 16, 16); } });
psAfis.magFilter = T.NearestFilter;
const psBALON = [], psBalonIM = new T.InstancedMesh(G.kure, psParlat(mat(0xffffff), 0.45), 6);
{
  const tb = psTaban(0, 0), X0 = YARI + 2.6, H = 9.8;
  const cizgi = new T.Mesh(new T.PlaneGeometry(GEN - 0.3, 2.6), new T.MeshBasicMaterial({ map: dama, color: 0xf3f3f3, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); cizgi.rotation.x = -Math.PI / 2; cizgi.position.y = 0.045;
  const k = new T.Group(); k.applyMatrix4(tb); k.add(cizgi); scene.add(k);
  const pano = new T.Mesh(new T.BoxGeometry(X0 * 2 - 0.5, 1.7, 0.36), new T.MeshBasicMaterial({ map: psAfis, color: 0xf3f3f3 })); pano.position.y = H - 1.0; k.add(pano);
  const psYum = (typeof cvG === 'object' && cvG.kutuY) || G.kutu;   // tombul, yuvarlak köşeli çerçeve: afiş düz levha gibi durmaz
  psParca(tb, psYum, psTema.cerUst, 0, H + 0.02, 0, X0 * 2 + 0.6, 0.42, 0.72); psParca(tb, psYum, psTema.cerAlt, 0, H - 2.02, 0, X0 * 2 + 0.6, 0.42, 0.72);                    // afiş çerçevesi
  psParca(tb, G.kutu, 0xfff4e2, 0, 0.047, -1.42, GEN - 0.3, 0.02, 0.2); psParca(tb, G.kutu, 0xfff4e2, 0, 0.047, 1.42, GEN - 0.3, 0.02, 0.2);          // yerdeki çizginin kenarları
  for (const yan of [-1, 1]) {
    const x = yan * X0;
    psParca(tb, G.sil, psTema.ayak, x, 0.3, 0, 0.85, 0.6, 0.85); psParca(tb, G.sil, psTema.sus, x, 0.68, 0, 0.62, 0.2, 0.62);                                  // direk ayağı
    for (let i = 0; i < 9; i++) psParca(tb, G.sil, i % 2 ? psTema.direkB : psTema.direkA, x, 0.78 + (i + 0.5) * (H - 0.78) / 9, 0, 0.38, (H - 0.78) / 9, 0.38);       // şeker çubuğu direk
    psParca(tb, G.sil, psTema.sus, x, H + 0.1, 0, 0.55, 0.22, 0.55); psParca(tb, G.kure, psTema.sus, x, H + 0.55, 0, 0.42, 0.42, 0.42);
    // yan ipte renkli bayraklar (sade: kısa ip, dört bayrak)
    const x2 = yan * (X0 + 4.5), y1 = H - 0.3, y2 = 1.5; psParca(tb, G.sil, psTema.ayak, x2, 0.85, 0, 0.16, 1.7, 0.16); psParca(tb, G.kure, 0xffd23f, x2, 1.8, 0, 0.26, 0.26, 0.26);
    for (let i = 0; i < 8; i++) {
      const u0 = (i + 0.12) / 8, u1 = (i + 0.88) / 8, sark = u => lerp(y1, y2, u) - Math.sin(u * Math.PI) * 0.9, xa = lerp(x, x2, u0), xb = lerp(x, x2, u1), ya = sark(u0), yb = sark(u1);
      if (i % 2 === 0) psYuz(tb, psRENK[(i / 2 + (yan > 0 ? 3 : 0)) % 6], [xa, ya, 0, xb, yb, 0, (xa + xb) / 2, (ya + yb) / 2 - 1.05, 0]);
      psCubuk(tb, 0xfff4e2, lerp(x, x2, i / 8), sark(i / 8), lerp(x, x2, (i + 1) / 8), sark((i + 1) / 8), 0, 0.05);
    }
    // balonlar
    for (let i = 0; i < 3; i++) {
      const top = psTema.top, bx = top ? x + (i - 1) * 0.62 : x + (i - 1) * 0.95 + yan * 0.2, by = top ? H + (i === 1 ? 2.0 : 1.1) : H + 2.3 + (i === 1 ? 0.75 : 0), bz = top ? 0 : (i - 1) * 0.25;   // top: balon yerine üst üste şeker topları
      if (!top) psCubuk(tb, 0xfff4e2, x, H + 0.8, bx, by - 0.7, bz * 0.5, 0.035);
      psA.set(bx, by, bz).applyMatrix4(tb); psBALON.push(psA.x, psA.y, psA.z); psBalonIM.setColorAt(psBALON.length / 3 - 1, renkT.setHex(psRENK[(i * 2 + (yan > 0 ? 1 : 0)) % 6]));
    }
  }
  psParca(tb, psYildizGeo, 0xffd23f, 0, H + 1.05, 0, 1.0, 1.0, 1.6); psParca(tb, psYildizGeo, 0xfff4e2, -2.3, H + 0.7, 0, 0.55, 0.55, 1.4); psParca(tb, psYildizGeo, 0xfff4e2, 2.3, H + 0.7, 0, 0.55, 0.55, 1.4);
  if (psTema.kemerEk) psTema.kemerEk(tb, X0, H);
  psBalonIM.instanceColor.needsUpdate = true; psBalonIM.frustumCulled = false; scene.add(psBalonIM);
}

// ───────── tümsekler: çizgili sevimli rampa ─────────
for (const o of TUMSEK) {
  const tb = psTaban(o.s, o.d), W = RAMPA.yari, Z0 = RAMPA.bas, Z1 = RAMPA.tepe, HH = RAMPA.h, n = 6;
  for (let i = 0; i < n; i++) { const za = lerp(Z0, Z1, i / n), zb = lerp(Z0, Z1, (i + 1) / n), ya = HH * i / n, yb = HH * (i + 1) / n; psYuz(tb, i % 2 ? psTema.rampaB : psTema.rampaA, [-W, ya, za, W, ya, za, W, yb, zb, -W, yb, zb]); }
  psYuz(tb, psTema.rampaArka, [-W, HH, Z1, W, HH, Z1, W, 0, RAMPA.son, -W, 0, RAMPA.son]);
  psParca(tb, G.kutu, psTema.rampaDudak, 0, HH + 0.02, Z1 - 0.05, W * 2 + 0.3, 0.16, 0.3);                                                                  // tepedeki beyaz dudak
  for (const x of [-W, W]) {
    psYuz(tb, psTema.rampaYan, [x, 0, Z0, x, 0, Z1, x, HH, Z1]); psYuz(tb, psTema.rampaYan, [x, 0, Z1, x, 0, RAMPA.son, x, HH, Z1]);
    psYuz(tb, 0xfff4e2, [x - 0.14, 0.03, Z0, x + 0.14, 0.03, Z0, x + 0.14, HH + 0.03, Z1, x - 0.14, HH + 0.03, Z1]);                                    // beyaz kenar çizgisi
    const px = x + Math.sign(x) * 0.55; for (let i = 0; i < 4; i++) psParca(tb, G.sil, i % 2 ? 0xfff4e2 : psTema.rampaDirek, px, 0.2 + i * 0.4, Z1 - 0.2, 0.17, 0.4, 0.17);
    psParca(tb, G.kure, 0xffd23f, px, 1.95, Z1 - 0.2, 0.3, 0.3, 0.3);
  }
}
{
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(psV, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(psNo, 3)); g.setAttribute('color', new T.Float32BufferAttribute(psC, 3));
  const m = new T.Mesh(g, psParlat(new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide }), psTema.parlat)); m.frustumCulled = false; scene.add(m);
}

// ───────── hızlandırma okları: mavi parlak zemin + ileri akan oklar ─────────
const okDoku = tuvalDoku(128, 64, (g, w, h) => {   // tek ok; pist üstünde arka arkaya üç kez yinelenir ve ileri akar
  g.clearRect(0, 0, w, h); g.lineJoin = 'miter'; g.lineCap = 'round';
  const ok = (renk, kalin) => { g.strokeStyle = renk; g.lineWidth = kalin; for (const dy of [-h, 0, h]) { g.beginPath(); g.moveTo(22, 52 + dy); g.lineTo(64, 12 + dy); g.lineTo(106, 52 + dy); g.stroke(); } };
  ok(psTema.okGolge, 21); ok('#ffffff', 13); ok('#fff3a8', 4);
}, true);
const okMat = new T.MeshBasicMaterial({ map: okDoku, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
const psOkZemin = tuvalDoku(128, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  const yol = p => { g.beginPath(); g.roundRect(p, p, w - p * 2, h - p * 2, 26 - p * 0.6); };
  yol(3); g.fillStyle = '#ffffff'; g.fill();
  const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, psTema.okA); gr.addColorStop(1, psTema.okB); yol(11); g.fillStyle = gr; g.fill();
});
const psOkZeminMat = new T.MeshBasicMaterial({ map: psOkZemin, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
{
  const kur = (yw, yl, y, vTekrar) => {
    const pos = [], uv = [], idx = [];
    OKLAR.forEach((o, i) => {
      const p = pist(o.s), cx = p.x - p.tz * o.d, cz = p.z + p.tx * o.d, sx = -p.tz, sz = p.tx;
      for (const [a, b, u, v] of [[-1, -1, 1, 0], [1, -1, 0, 0], [1, 1, 0, vTekrar], [-1, 1, 1, vTekrar]]) { pos.push(cx + sx * a * yw + p.tx * b * yl, y, cz + sz * a * yw + p.tz * b * yl); uv.push(u, v); }
      idx.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4, i * 4 + 3, i * 4 + 2);
    });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
  };
  const z = new T.Mesh(kur(2.6, 3.6, 0.06, 1), psOkZeminMat), k = new T.Mesh(kur(2.0, 3.15, 0.075, 3), okMat);
  for (const m of [z, k]) { m.material.side = T.DoubleSide; m.frustumCulled = false; scene.add(m); } z.renderOrder = 1; k.renderOrder = 2;
}

// ───────── yıldızlar ─────────
const psYildizMat = new T.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, emissive: 0x9a5a00 });
psYildizMat.onBeforeCompile = sh => {   // dönen yıldızın yüzünden ara sıra çapraz bir ışıltı çizgisi geçer (parlak, yumuşak)
  sh.uniforms.psT = typeof cvZ === 'object' ? cvZ : { value: 0 };
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 psL;').replace('#include <begin_vertex>', '#include <begin_vertex>\npsL = position;\n#ifdef USE_INSTANCING\npsL.z = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;\n#endif');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float psT;\nvarying vec3 psL;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nfloat psB = mod(psT * 1.6 + psL.z, 4.0) * 1.6 - 2.4;\ntotalEmissiveRadiance += vec3(1.0, 0.95, 0.75) * 0.75 * (1.0 - smoothstep(0.0, 0.22, abs(psL.x * 0.8 + psL.y - psB)));');
};
psYildizMat.customProgramCacheKey = () => 'psYildiz';
const yildizIM = new T.InstancedMesh(psYildizGeo, psYildizMat, YILDIZ.length);
yildizIM.frustumCulled = false; scene.add(yildizIM);
// yıldızların altında yolda yumuşak küçük gölge (derinlik algısı)
const psGolgeIM = new T.InstancedMesh(new T.CircleGeometry(1, 14).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({
  map: tuvalDoku(64, 64, (g, w, h) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(20,14,30,1)'); r.addColorStop(0.5, 'rgba(20,14,30,0.7)'); r.addColorStop(1, 'rgba(20,14,30,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }),
  transparent: true, opacity: psTema.golgeA, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), YILDIZ.length);
psGolgeIM.frustumCulled = false; psGolgeIM.renderOrder = 1; scene.add(psGolgeIM);

// ───────── parçacık havuzları (toz, pırıltı, yıldız ışıltısı) ─────────
const psOlcek = { value: 600 };
const psTozDoku = tuvalDoku(64, 64, (g, w, h) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,0.75)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
const psPirilDoku = tuvalDoku(64, 64, (g, w, h) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 30); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.18, 'rgba(255,255,255,0.8)'); r.addColorStop(0.5, 'rgba(255,255,255,0.14)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, q = i % 2 ? 4 : 31; g.lineTo(32 + Math.cos(a) * q, 32 + Math.sin(a) * q); } g.fill();
});
function psNoktaMat(doku, katki) {
  return new T.ShaderMaterial({
    uniforms: { uDoku: { value: doku }, uOlcek: psOlcek }, transparent: true, depthWrite: false, blending: katki ? T.AdditiveBlending : T.NormalBlending,
    vertexShader: 'attribute vec4 aRenk; attribute float aBoy; uniform float uOlcek; varying vec4 vRenk;\nvoid main(){ vRenk = aRenk; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = min(220.0, aBoy * uOlcek / max(0.5, -mv.z)); }',
    fragmentShader: 'uniform sampler2D uDoku; varying vec4 vRenk;\nvoid main(){ vec4 t = texture2D(uDoku, gl_PointCoord); gl_FragColor = vec4(vRenk.rgb * t.rgb, vRenk.a * t.a); if (gl_FragColor.a < 0.004) discard;\n#include <colorspace_fragment>\n}'
  });
}
function psHavuz(n, doku, katki) {
  const f = k => new Float32Array(n * k), h = { n, i: 0, canli: 0, pos: f(3), hiz: f(3), renk: f(4), boy: f(1), omur: f(1), tam: f(1), b0: f(1), b1: f(1), a0: f(1), yc: f(1), sur: f(1) };
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(h.pos, 3)); g.setAttribute('aRenk', new T.BufferAttribute(h.renk, 4)); g.setAttribute('aBoy', new T.BufferAttribute(h.boy, 1));
  h.geo = g; h.pts = new T.Points(g, psNoktaMat(doku, katki)); h.pts.frustumCulled = false; h.pts.visible = false; h.pts.renderOrder = katki ? 6 : 5; scene.add(h.pts); return h;
}
function psSac(h, x, y, z, vx, vy, vz, renk, a, b0, b1, omur, yc, sur) {
  const i = h.i; h.i = (i + 1) % h.n; const j = i * 3, q = i * 4;
  h.pos[j] = x; h.pos[j + 1] = y; h.pos[j + 2] = z; h.hiz[j] = vx; h.hiz[j + 1] = vy; h.hiz[j + 2] = vz;
  renkT.setHex(renk); h.renk[q] = renkT.r; h.renk[q + 1] = renkT.g; h.renk[q + 2] = renkT.b; h.renk[q + 3] = a;
  h.a0[i] = a; h.b0[i] = b0; h.b1[i] = b1; h.boy[i] = b0; h.omur[i] = h.tam[i] = omur; h.yc[i] = yc; h.sur[i] = sur; h.canli++;
}
function psHavuzAdim(h, dt) {
  if (!h.canli) { h.pts.visible = false; return; }
  let c = 0;
  for (let i = 0; i < h.n; i++) {
    if (h.omur[i] <= 0) continue;
    const o = h.omur[i] - dt, j = i * 3;
    if (o <= 0) { h.omur[i] = 0; h.boy[i] = 0; h.renk[i * 4 + 3] = 0; continue; }
    h.omur[i] = o; c++;
    const k = 1 - o / h.tam[i], s = Math.max(0, 1 - h.sur[i] * dt);
    h.hiz[j] *= s; h.hiz[j + 1] = h.hiz[j + 1] * s - h.yc[i] * dt; h.hiz[j + 2] *= s;
    h.pos[j] += h.hiz[j] * dt; h.pos[j + 1] += h.hiz[j + 1] * dt; h.pos[j + 2] += h.hiz[j + 2] * dt;
    if (h.pos[j + 1] < 0.1) { h.pos[j + 1] = 0.1; h.hiz[j + 1] *= -0.35; }
    h.boy[i] = lerp(h.b0[i], h.b1[i], k); h.renk[i * 4 + 3] = h.a0[i] * (1 - k * k);
  }
  h.canli = c; h.pts.visible = c > 0;
  h.geo.attributes.position.needsUpdate = true; h.geo.attributes.aRenk.needsUpdate = true; h.geo.attributes.aBoy.needsUpdate = true;
}
const psToz = psHavuz(110, psTozDoku, false), psPiril = psHavuz(200, psPirilDoku, true), psHale = psHavuz(YILDIZ.length, psTozDoku, true);
{ renkT.setHex(psTema.hale); for (let i = 0; i < YILDIZ.length; i++) { psHale.renk[i * 4] = renkT.r; psHale.renk[i * 4 + 1] = renkT.g; psHale.renk[i * 4 + 2] = renkT.b; psHale.renk[i * 4 + 3] = psTema.haleA; psHale.pos[i * 3] = YILDIZ[i].x; psHale.pos[i * 3 + 2] = YILDIZ[i].z; } psHale.pts.visible = true; psHale.pts.renderOrder = 4; }
const psPIRIL_RENK = psTema.piril;

// hız çizgileri (yalnız roket sırasında)
const psCN = 16, psCizgiVeri = new Float32Array(psCN * 5);   // x, y, z, açı, boy
const psCizgiIM = (() => {
  const a = new T.PlaneGeometry(0.09, 1), b = new T.PlaneGeometry(0.09, 1); a.rotateX(-Math.PI / 2); b.rotateX(-Math.PI / 2); b.rotateZ(Math.PI / 2);
  const g = new T.BufferGeometry(), pos = new Float32Array(24); pos.set(a.attributes.position.array, 0); pos.set(b.attributes.position.array, 12);
  g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setIndex([0, 2, 1, 2, 3, 1, 4, 6, 5, 6, 7, 5]);
  const im = new T.InstancedMesh(g, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }), psCN);
  im.frustumCulled = false; im.visible = false; im.renderOrder = 3; scene.add(im); return im;
})();
// roket sırasında ekranın kenarlarında dışa akan ince hız çizgileri (tek çizim, ekranı kaplayan dörtgen; ortası boş)
const psKenarMat = new T.ShaderMaterial({
  uniforms: { uT: { value: 0 }, uA: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false,
  vertexShader: 'varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'varying vec2 vUv; uniform float uT; uniform float uA;\nvoid main(){ vec2 p = vUv - 0.5; float r = length(p) * 2.0; float s = atan(p.y, p.x) / 6.2832 * 72.0; float kim = floor(s); float f = abs(fract(s) - 0.5); float h = fract(sin(kim * 12.9898) * 43758.5453);\n float cizgi = (1.0 - smoothstep(0.0, 0.075, f)) * step(0.58, h); float q = fract(r * 1.3 - uT * 2.4 + h * 9.0); float kesik = smoothstep(0.0, 0.25, q) * (1.0 - smoothstep(0.5, 0.85, q));\n float a = uA * cizgi * kesik * smoothstep(0.74, 1.12, r); if (a < 0.004) discard; gl_FragColor = vec4(1.0, 1.0, 1.0, a); }'
});
const psKenar = new T.Mesh(new T.PlaneGeometry(2, 2), psKenarMat); psKenar.frustumCulled = false; psKenar.visible = false; psKenar.renderOrder = 30; scene.add(psKenar);
function psCizgiKoy(i, ileri) {
  const p = pist(P.yol + ileri), yer = i % 3 === 0, d = yer ? (Math.random() - 0.5) * 11 : (Math.random() < 0.5 ? -1 : 1) * (YARI + 1.5 + Math.random() * 4), q = i * 5;
  psCizgiVeri[q] = p.x - p.tz * d; psCizgiVeri[q + 1] = yer ? 0.1 : 0.8 + Math.random() * 2.6; psCizgiVeri[q + 2] = p.z + p.tx * d; psCizgiVeri[q + 3] = Math.atan2(p.tx, p.tz); psCizgiVeri[q + 4] = yer ? 1.6 + Math.random() * 1.4 : 3.5 + Math.random() * 4;
}

// ───────── konfeti (dönerek süzülen renkli kâğıtlar) ─────────
const KN = 260, kPos = new Float32Array(KN * 3), kHiz = new Float32Array(KN * 3), kRenk = new Float32Array(KN * 3), psKDon = new Float32Array(KN * 3);
const kGeo = new T.PlaneGeometry(0.3, 0.2);
const konfeti = new T.InstancedMesh(kGeo, new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide }), KN);
for (let i = 0; i < KN; i++) { renkT.setHex([0xff5a6e, 0xffd84a, 0x6fd3ff, 0x8fe07a, 0xffffff, 0xb98cff, 0xff9a3c][i % 7]); kRenk[i * 3] = renkT.r; kRenk[i * 3 + 1] = renkT.g; kRenk[i * 3 + 2] = renkT.b; konfeti.setColorAt(i, renkT); psKDon[i * 3] = Math.random() * 6.28; psKDon[i * 3 + 1] = 3 + Math.random() * 6; psKDon[i * 3 + 2] = 2 + Math.random() * 5; }
konfeti.frustumCulled = false; konfeti.visible = false; scene.add(konfeti);
function konfetiAt(x, z) {
  const p = pist(P.yol), sx = -p.tz, sz = p.tx;
  for (let i = 0; i < KN; i++) {
    const j = i * 3;
    if (i % 2) {   // iki yandan fışkıran
      const yan = i % 4 === 1 ? -1 : 1, a = Math.random() * 6.283, r = Math.random() * 2.6;
      kPos[j] = x + sx * yan * 5.5; kPos[j + 1] = 0.6 + Math.random(); kPos[j + 2] = z + sz * yan * 5.5;
      kHiz[j] = -sx * yan * (1.5 + Math.random() * 2.5) + Math.cos(a) * r; kHiz[j + 1] = 5.5 + Math.random() * 4.5; kHiz[j + 2] = -sz * yan * (1.5 + Math.random() * 2.5) + Math.sin(a) * r;
    } else {       // yukarıdan süzülen
      kPos[j] = x + (Math.random() - 0.5) * 13; kPos[j + 1] = 1.5 + Math.random() * 8; kPos[j + 2] = z + (Math.random() - 0.5) * 13;
      kHiz[j] = (Math.random() - 0.5) * 1.5; kHiz[j + 1] = -1 - Math.random() * 1.5; kHiz[j + 2] = (Math.random() - 0.5) * 1.5;
    }
  }
  konfeti.visible = true;
}

// ───────── sürpriz balonlar, patlama, izler ve güç efektleri (yaris-pist) ─────────
// İki çizim: balon gövdeleri (çoklu kopya) + tek resim paftasından beslenen dörtgen yığını (simge, ip, gölge, halka, iz, şerit).
// Deneme: window.psSurprizDene = [{s, d, tur, var}] (SURPRIZ yokken), window.psIzDene = 'kalp' (GARAJ yokken ya da izi zorlamak için).
const psSN = 8, psFQ = 184, psIN = 96, psRN = 30;
const psSRENK = { dev: 0xff7a2e, baloncuk: 0x25bfe6, gokkusagi: 0xb45cff, miknatis: 0x4fd13a };
const psSHUCRE = { dev: 0, baloncuk: 1, gokkusagi: 2, miknatis: 3 };
const psFxDoku = tuvalDoku(512, 512, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
  const hucre = (c, f) => { g.save(); g.translate((c % 4) * 128 + 64, (c >> 2) * 128 + 64); f(); g.restore(); };
  const rozet = renk => { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 54, 0, 6.2832); g.fill(); g.strokeStyle = renk; g.lineWidth = 7; g.stroke(); };
  hucre(0, () => {   // dev: kalın yukarı ok
    rozet('#e0560c'); g.fillStyle = '#ff6a1a'; g.strokeStyle = '#ff6a1a'; g.lineWidth = 8; g.beginPath();
    g.moveTo(0, -38); g.lineTo(32, -4); g.lineTo(13, -4); g.lineTo(13, 34); g.lineTo(-13, 34); g.lineTo(-13, -4); g.lineTo(-32, -4); g.closePath(); g.fill(); g.stroke();
  });
  hucre(1, () => {   // baloncuk: üç köpük
    rozet('#128fbd');
    for (const [x, y, r] of [[-14, 8, 25], [24, -16, 15], [22, 24, 10]]) {
      g.fillStyle = 'rgba(70,205,245,0.4)'; g.strokeStyle = '#149fd0'; g.lineWidth = 5; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); g.stroke();
      g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(2.5, r * 0.2); g.beginPath(); g.arc(x, y, r * 0.58, 3.5, 4.6); g.stroke();
    }
  });
  hucre(2, () => {   // gökkuşağı
    rozet('#8a3ad0'); const rk = ['#ff4a4a', '#ff9a2e', '#ffd93a', '#4fd13a', '#3a8cff', '#9a5cff'];
    for (let i = 0; i < 6; i++) { g.strokeStyle = rk[i]; g.lineWidth = 7.4; g.lineCap = 'butt'; g.beginPath(); g.arc(0, 22, 42 - i * 6.6, Math.PI, 6.2832); g.stroke(); }
  });
  hucre(3, () => {   // mıknatıs
    rozet('#2f9a22'); g.lineCap = 'butt';
    g.strokeStyle = '#ee2f3f'; g.lineWidth = 19; g.beginPath(); g.moveTo(-24, 16); g.lineTo(-24, -6); g.arc(0, -6, 24, Math.PI, 6.2832); g.lineTo(24, 16); g.stroke();
    g.strokeStyle = '#aeb6c4'; g.beginPath(); g.moveTo(-24, 16); g.lineTo(-24, 33); g.moveTo(24, 16); g.lineTo(24, 33); g.stroke();
  });
  hucre(4, () => {   // ip
    for (const [renk, kal] of [['rgba(40,44,70,0.6)', 11], ['#ffffff', 6]]) { g.strokeStyle = renk; g.lineWidth = kal; g.beginPath(); for (let y = -56; y <= 56; y += 4) g.lineTo(Math.sin((y + 56) / 112 * 8) * 9, y); g.stroke(); }
  });
  hucre(5, () => { const r = g.createRadialGradient(0, 0, 0, 0, 0, 58); r.addColorStop(0, 'rgba(20,14,30,0.62)'); r.addColorStop(0.55, 'rgba(20,14,30,0.4)'); r.addColorStop(1, 'rgba(20,14,30,0)'); g.fillStyle = r; g.fillRect(-60, -60, 120, 120); });   // gölge
  hucre(6, () => { g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.beginPath(); g.arc(0, 0, 50, 0, 6.2832); g.stroke(); });   // halka
  hucre(7, () => {   // kalp
    g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(-58, 4, -44, -48, 0, -18); g.bezierCurveTo(44, -48, 58, 4, 0, 40); g.closePath();
    g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.stroke(); g.fillStyle = '#ff4f8e'; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 6; g.beginPath(); g.arc(-20, -12, 10, 3.4, 4.7); g.stroke();
  });
  hucre(8, () => {   // yıldız
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.2832 - Math.PI / 2, r = i % 2 ? 23 : 48; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath();
    g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.stroke(); g.fillStyle = '#ffd22e'; g.fill();
  });
  hucre(9, () => {   // tek köpük
    g.fillStyle = 'rgba(190,238,255,0.3)'; g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 46, 0, 6.2832); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(40,150,210,0.55)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 50.5, 0, 6.2832); g.stroke();
    g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 30, 3.5, 4.5); g.stroke();
  });
  hucre(10, () => {   // gökkuşağı şeridi (enine altı renk, iki kenarı beyaz)
    const rk = ['#ff4a4a', '#ff9a2e', '#ffd93a', '#4fd13a', '#3a8cff', '#9a5cff'];
    g.fillStyle = '#ffffff'; g.fillRect(-56, -64, 112, 128); for (let i = 0; i < 6; i++) { g.fillStyle = rk[i]; g.fillRect(-51 + i * 17, -64, 17.5, 128); }
  });
  hucre(11, () => { const r = g.createRadialGradient(0, 0, 0, 0, 0, 54); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.6, 'rgba(255,255,255,0.95)'); r.addColorStop(0.75, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(-60, -60, 120, 120); });   // yuvarlak parça
});
// balon gövdesi: hafif uzun küre + altında düğüm
const psSBalonIM = (() => {
  const a = new T.SphereGeometry(1, 14, 10).scale(0.95, 1.12, 0.95).toNonIndexed(), b = new T.ConeGeometry(0.2, 0.26, 8).translate(0, -1.2, 0).toNonIndexed();
  const na = a.attributes.position.count, nb = b.attributes.position.count, pos = new Float32Array((na + nb) * 3), nor = new Float32Array((na + nb) * 3);
  pos.set(a.attributes.position.array, 0); pos.set(b.attributes.position.array, na * 3); nor.set(a.attributes.normal.array, 0); nor.set(b.attributes.normal.array, na * 3);
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3));
  const m = mat(0xffffff);
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )\n totalEmissiveRadiance += vColor.rgb * 0.42;\n#endif'); };
  m.customProgramCacheKey = () => 'psSurpriz';
  const im = new T.InstancedMesh(g, m, psSN); kukla.position.set(0, -50, 0); kukla.scale.setScalar(0.0001); kukla.updateMatrix();
  for (let i = 0; i < psSN; i++) { im.setMatrixAt(i, kukla.matrix); im.setColorAt(i, renkT.setHex(0xffffff)); }
  kukla.scale.set(1, 1, 1); im.frustumCulled = false; im.visible = false; scene.add(im); return im;
})();
// dörtgen yığını
const psFP = new Float32Array(psFQ * 12), psFU = new Float32Array(psFQ * 8), psFC = new Float32Array(psFQ * 16);
const psFx = (() => {
  const g = new T.BufferGeometry(), ind = new Uint16Array(psFQ * 6);
  for (let q = 0; q < psFQ; q++) ind.set([q * 4, q * 4 + 1, q * 4 + 2, q * 4 + 2, q * 4 + 1, q * 4 + 3], q * 6);
  for (const [ad, dizi, k] of [['position', psFP, 3], ['uv', psFU, 2], ['color', psFC, 4]]) { const at = new T.BufferAttribute(dizi, k); at.setUsage(T.DynamicDrawUsage); g.setAttribute(ad, at); }
  g.setIndex(new T.BufferAttribute(ind, 1)); g.setDrawRange(0, 0);
  const m = new T.Mesh(g, new T.MeshBasicMaterial({ map: psFxDoku, vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide }));
  m.frustumCulled = false; m.visible = false; m.renderOrder = 5; scene.add(m); return m;
})();
const psSag = new T.Vector3(1, 0, 0), psUst = new T.Vector3(0, 1, 0), psFR = new T.Color();
let psFn = 0;
function psFxKose(q, k, x, y, z) { const j = q * 12 + k * 3; psFP[j] = x; psFP[j + 1] = y; psFP[j + 2] = z; }
function psFxBoya(q, hucre, renk, a0, a1, uPay, vPay) {   // a0: ilk iki köşe, a1: son iki köşe
  const u0 = (hucre % 4) * 0.25 + uPay, u1 = (hucre % 4) * 0.25 + 0.25 - uPay, v1 = 1 - (hucre >> 2) * 0.25 - vPay, v0 = 1 - (hucre >> 2) * 0.25 - 0.25 + vPay, j = q * 8;
  psFU[j] = u0; psFU[j + 1] = v0; psFU[j + 2] = u1; psFU[j + 3] = v0; psFU[j + 4] = u0; psFU[j + 5] = v1; psFU[j + 6] = u1; psFU[j + 7] = v1;
  psFR.setHex(renk); for (let k = 0; k < 4; k++) { const c = q * 16 + k * 4; psFC[c] = psFR.r; psFC[c + 1] = psFR.g; psFC[c + 2] = psFR.b; psFC[c + 3] = k < 2 ? a0 : a1; }
}
function psFxBill(x, y, z, gen, yuk, hucre, renk, a, aci) {   // kameraya bakan dörtgen
  if (psFn >= psFQ) return; const q = psFn++, cs = Math.cos(aci) * 0.5, sn = Math.sin(aci) * 0.5;
  const ax = (psSag.x * cs + psUst.x * sn) * gen, ay = (psSag.y * cs + psUst.y * sn) * gen, az = (psSag.z * cs + psUst.z * sn) * gen;
  const bx = (psUst.x * cs - psSag.x * sn) * yuk, by = (psUst.y * cs - psSag.y * sn) * yuk, bz = (psUst.z * cs - psSag.z * sn) * yuk;
  psFxKose(q, 0, x - ax - bx, y - ay - by, z - az - bz); psFxKose(q, 1, x + ax - bx, y + ay - by, z + az - bz); psFxKose(q, 2, x - ax + bx, y - ay + by, z - az + bz); psFxKose(q, 3, x + ax + bx, y + ay + by, z + az + bz);
  psFxBoya(q, hucre, renk, a, a, 0.004, 0.004);
}
function psFxYer(x, y, z, boy, hucre, renk, a) {   // yere yatık dörtgen
  if (psFn >= psFQ) return; const q = psFn++, h = boy * 0.5;
  psFxKose(q, 0, x - h, y, z - h); psFxKose(q, 1, x + h, y, z - h); psFxKose(q, 2, x - h, y, z + h); psFxKose(q, 3, x + h, y, z + h); psFxBoya(q, hucre, renk, a, a, 0.004, 0.004);
}
// iz parçacıkları (yıldız, kalp, köpük, patlama parçaları, halkalar): sabit havuz
const psI = { i: 0, pos: new Float32Array(psIN * 3), hiz: new Float32Array(psIN * 3), omur: new Float32Array(psIN), tam: new Float32Array(psIN), hucre: new Uint8Array(psIN), yer: new Uint8Array(psIN), renk: new Uint32Array(psIN), a0: new Float32Array(psIN), b0: new Float32Array(psIN), b1: new Float32Array(psIN), yc: new Float32Array(psIN), aci: new Float32Array(psIN), don: new Float32Array(psIN) };
function psIzSac(x, y, z, vx, vy, vz, hucre, renk, a, b0, b1, omur, yc, yer, don) {
  const i = psI.i, j = i * 3; psI.i = (i + 1) % psIN;
  psI.pos[j] = x; psI.pos[j + 1] = y; psI.pos[j + 2] = z; psI.hiz[j] = vx; psI.hiz[j + 1] = vy; psI.hiz[j + 2] = vz;
  psI.hucre[i] = hucre; psI.renk[i] = renk; psI.a0[i] = a; psI.b0[i] = b0; psI.b1[i] = b1; psI.omur[i] = psI.tam[i] = omur; psI.yc[i] = yc; psI.yer[i] = yer ? 1 : 0; psI.don[i] = don || 0; psI.aci[i] = don ? Math.random() * 6.283 : 0;
}
// gökkuşağı şeridi: arabanın arkasında bırakılan son noktalar (halka dizi)
const psRX = new Float32Array(psRN), psRY = new Float32Array(psRN), psRZ = new Float32Array(psRN), psRSX = new Float32Array(psRN), psRSZ = new Float32Array(psRN), psRT = new Float32Array(psRN).fill(-99), psRW = new Float32Array(psRN), psRA = new Float32Array(psRN), psRKes = new Uint8Array(psRN);
const psR_OMUR = 0.95, psBT = new Float32Array(psSN).fill(1), psBTur = new Array(psSN).fill(''), psMikY = new Uint8Array(YILDIZ.length);
let psRBas = 0, psRKopuk = true, psIzSay = 0, psDevT = 0, psDevYan = 1, psGucPiril = 0;
function psIzTur() { try { if (typeof window.psIzDene === 'string') return window.psIzDene; if (typeof GARAJ !== 'undefined' && GARAJ && GARAJ.secili) return GARAJ.secili('iz') || 'yok'; } catch (e) { } return 'yok'; }
function psGucTur() { return typeof P !== 'undefined' && P.guc && P.guc.kalan > 0 ? P.guc.tur : null; }
function psSurprizAdim(dt, t, yarista) {
  psFn = 0; psSag.setFromMatrixColumn(camera.matrixWorld, 0); psUst.setFromMatrixColumn(camera.matrixWorld, 1);
  const S = typeof SURPRIZ !== 'undefined' ? SURPRIZ : window.psSurprizDene, n = S && psDurum !== 'garaj' ? Math.min(S.length, psSN) : 0;
  const sx = -P.tz, sz = P.tx, guc = yarista ? psGucTur() : null, iz = yarista ? psIzTur() : 'yok';
  // 1) balon gövdeleri + yerdeki gölgeleri
  let renkDegisti = false;
  for (let i = 0; i < psSN; i++) {
    const b = i < n ? S[i] : null;
    if (!b || b.var === false) { if (psBT[i] !== 0) { psBT[i] = 0; kukla.position.set(0, -50, 0); kukla.rotation.set(0, 0, 0); kukla.scale.setScalar(0.0001); kukla.updateMatrix(); psSBalonIM.setMatrixAt(i, kukla.matrix); } continue; }
    psBT[i] = Math.min(1, psBT[i] + dt / 0.42);
    const k = psBT[i] - 1, olcek = 1.15 * (1 + 2.70158 * k * k * k + 1.70158 * k * k), p = pist(b.s, psO), ry = rampaYukseklik(b.s, b.d), sal = Math.sin(t * 1.3 + i * 2.1);
    const x = p.x - p.tz * b.d, z = p.z + p.tx * b.d, y = 2.2 + ry + Math.sin(t * 1.9 + i * 1.7) * 0.14;
    if (psBTur[i] !== b.tur) { psBTur[i] = b.tur; psSBalonIM.setColorAt(i, renkT.setHex(psSRENK[b.tur] || 0xff7a2e)); renkDegisti = true; }
    kukla.position.set(x + sal * 0.07, y, z); kukla.rotation.set(0, 0, sal * 0.07); kukla.scale.setScalar(Math.max(0.0001, olcek)); kukla.updateMatrix(); psSBalonIM.setMatrixAt(i, kukla.matrix);
    psFxYer(x, 0.085 + ry, z, 2.3 * olcek, 5, 0xffffff, psTema.golgeA !== undefined ? Math.min(1, psTema.golgeA * 1.5) : 0.6);
  }
  psSBalonIM.visible = n > 0; psSBalonIM.instanceMatrix.needsUpdate = true; if (renkDegisti && psSBalonIM.instanceColor) psSBalonIM.instanceColor.needsUpdate = true;
  // 2) gökkuşağı şeridi (iz süsü: ince ve hafif; gökkuşağı gücü: geniş ve parlak)
  const serit = guc === 'gokkusagi' ? 2 : iz === 'gokkusagi' && guc !== 'baloncuk' ? 1 : 0, ax = P.x - P.tx * 1.15, az = P.z - P.tz * 1.15, ay = 0.11 + (P.rampaY || 0);
  if (serit && P.v > 6 && P.hop <= 0) {
    const son = (psRBas + psRN - 1) % psRN, dx = ax - psRX[son], dz = az - psRZ[son];
    if (psRKopuk || dx * dx + dz * dz > 1.3) { const i = psRBas; psRBas = (psRBas + 1) % psRN; psRX[i] = ax; psRY[i] = ay; psRZ[i] = az; psRSX[i] = sx; psRSZ[i] = sz; psRT[i] = t; psRW[i] = serit === 2 ? 1.2 : 0.72; psRA[i] = serit === 2 ? 0.95 : 0.62; psRKes[i] = psRKopuk ? 1 : 0; psRKopuk = false; }
  } else psRKopuk = true;
  for (let k = 0; k < psRN; k++) {   // en yeniden en eskiye; her parça bir önceki noktaya bağlanır
    const i = (psRBas + psRN - 1 - k) % psRN, yas = t - psRT[i]; if (yas > psR_OMUR || yas < 0) break;
    const a1 = psRA[i] * (1 - yas / psR_OMUR), w = psRW[i];
    if (k === 0 && !psRKopuk && psFn < psFQ) {   // arabaya bağlı ilk parça
      const q = psFn++; psFxKose(q, 0, psRX[i] - psRSX[i] * w, psRY[i], psRZ[i] - psRSZ[i] * w); psFxKose(q, 1, psRX[i] + psRSX[i] * w, psRY[i], psRZ[i] + psRSZ[i] * w); psFxKose(q, 2, ax - sx * w, ay, az - sz * w); psFxKose(q, 3, ax + sx * w, ay, az + sz * w); psFxBoya(q, 10, 0xffffff, a1, psRA[i], 0.012, 0.06);
    }
    if (psRKes[i] || k === psRN - 1) break;
    const j = (i + psRN - 1) % psRN, yas2 = t - psRT[j]; if (yas2 > psR_OMUR || psFn >= psFQ) break;
    const q = psFn++, w2 = psRW[j]; psFxKose(q, 0, psRX[j] - psRSX[j] * w2, psRY[j], psRZ[j] - psRSZ[j] * w2); psFxKose(q, 1, psRX[j] + psRSX[j] * w2, psRY[j], psRZ[j] + psRSZ[j] * w2); psFxKose(q, 2, psRX[i] - psRSX[i] * w, psRY[i], psRZ[i] - psRSZ[i] * w); psFxKose(q, 3, psRX[i] + psRSX[i] * w, psRY[i], psRZ[i] + psRSZ[i] * w);
    psFxBoya(q, 10, 0xffffff, psRA[j] * (1 - yas2 / psR_OMUR), a1, 0.012, 0.06);
  }
  // 3) arabadan çıkan iz parçaları ve güç efektleri
  if (yarista && P.v > 6) {
    const yk = P.hop > 0 ? 1 : 0, vx = P.tx * P.v, vz = P.tz * P.v;
    if (guc === 'baloncuk') {   // arkada minik köpükler
      psIzSay += dt * 15; while (psIzSay >= 1) { psIzSay--; const g = Math.random() - 0.5, r = Math.random(); psIzSac(P.x - P.tx * 1.6 + sx * g * 1.6, 0.7 + r * 1.3, P.z - P.tz * 1.6 + sz * g * 1.6, vx * 0.55 + sx * g, 0.5 + r * 0.9, vz * 0.55 + sz * g, 9, 0xffffff, 0.9, 0.2 + r * 0.14, 0.42 + r * 0.2, 0.6 + r * 0.25, -0.4, 0, 0); }
    } else if (guc === 'gokkusagi') {   // şeridin üstünde seyrek pırıltı
      psGucPiril += dt * 14; while (psGucPiril >= 1) { psGucPiril--; const g = Math.random() - 0.5; psSac(psPiril, P.x - P.tx * 1.8 + sx * g * 2.2, 0.35 + Math.random() * 0.5 + yk, P.z - P.tz * 1.8 + sz * g * 2.2, vx * 0.4, 0.6 + Math.random() * 1.2, vz * 0.4, psPIRIL_RENK[psPiril.i % 5], 0.9, 0.55, 0.1, 0.34, 0, 1.5); }
    } else if (iz === 'yildiz' || iz === 'kalp' || iz === 'baloncuk') {
      psIzSay += dt * (iz === 'kalp' ? 10 : 13);
      while (psIzSay >= 1) {
        psIzSay--; const g = Math.random() - 0.5, r = Math.random(), x = P.x - P.tx * 1.5 + sx * g * 1.5, z = P.z - P.tz * 1.5 + sz * g * 1.5;
        if (iz === 'yildiz') psIzSac(x, 0.45 + r * 0.35 + yk, z, vx * 0.55, 0.5 + r, vz * 0.55, 8, 0xffffff, 0.95, 0.56, 0.2, 0.62 + r * 0.2, 1.5, 0, (g > 0 ? 1 : -1) * (2 + r * 3));
        else if (iz === 'kalp') psIzSac(x, 0.5 + r * 0.3 + yk, z, vx * 0.55, 1.1 + r * 0.8, vz * 0.55, 7, 0xffffff, 0.95, 0.36, 0.56, 0.7 + r * 0.2, -0.6, 0, 0);
        else psIzSac(x, 0.4 + r * 0.4 + yk, z, vx * 0.55 + sx * g, 0.8 + r, vz * 0.55 + sz * g, 9, 0xffffff, 0.92, 0.28, 0.52, 0.65 + r * 0.25, -0.5, 0, 0);
      }
    }
    if (guc === 'dev' && P.hop <= 0) {   // dev araba: her adımda yerde genişleyen toz halkası
      psDevT -= dt;
      if (psDevT <= 0) {
        psDevT = 0.36; psDevYan = -psDevYan; const x = P.x - P.tx * 0.6 + sx * psDevYan * 1.0, z = P.z - P.tz * 0.6 + sz * psDevYan * 1.0;
        psIzSac(x, 0.13 + (P.rampaY || 0), z, vx * 0.45, 0, vz * 0.45, 6, psTema.puf, 0.8, 1.5, 4.6, 0.46, 0, 1, 0);
        for (let k = 0; k < 4; k++) { const a = k * 1.571 + Math.random(); psSac(psToz, x + Math.cos(a) * 0.7, 0.25, z + Math.sin(a) * 0.7, vx * 0.5 + Math.cos(a) * 3, 0.8 + Math.random(), vz * 0.5 + Math.sin(a) * 3, psTema.puf, 0.5, 0.6, 1.5, 0.4, 0, 2.4); }
      }
    } else psDevT = 0;
  }
  // 4) parçacık adımı; yere yatık olanlar (halkalar) önce çizilir
  for (let i = 0; i < psIN; i++) {
    if (psI.omur[i] <= 0) continue;
    const o = (psI.omur[i] -= dt), j = i * 3; if (o <= 0) { psI.omur[i] = 0; continue; }
    psI.hiz[j + 1] -= psI.yc[i] * dt; psI.pos[j] += psI.hiz[j] * dt; psI.pos[j + 1] += psI.hiz[j + 1] * dt; psI.pos[j + 2] += psI.hiz[j + 2] * dt; psI.aci[i] += psI.don[i] * dt;
    if (psI.pos[j + 1] < 0.12) psI.pos[j + 1] = 0.12;
    if (psI.yer[i]) { const k = 1 - o / psI.tam[i]; psFxYer(psI.pos[j], psI.pos[j + 1], psI.pos[j + 2], lerp(psI.b0[i], psI.b1[i], Math.sqrt(k)), psI.hucre[i], psI.renk[i], psI.a0[i] * (1 - k * k)); }
  }
  // 5) balon ipleri ve simgeleri
  for (let i = 0; i < n; i++) {
    const b = S[i]; if (b.var === false || psBT[i] <= 0) continue;
    const k = psBT[i] - 1, olcek = Math.max(0.0001, 1.15 * (1 + 2.70158 * k * k * k + 1.70158 * k * k)), p = pist(b.s, psO), sal = Math.sin(t * 1.3 + i * 2.1);
    const x = p.x - p.tz * b.d + sal * 0.07, z = p.z + p.tx * b.d, y = 2.2 + rampaYukseklik(b.s, b.d) + Math.sin(t * 1.9 + i * 1.7) * 0.14;
    psFxBill(x - sal * 0.05, y - 1.78 * olcek, z, 0.42 * olcek, 0.95 * olcek, 4, 0xffffff, 1, 0);
    let kx = camera.position.x - x, ky = camera.position.y - y, kz = camera.position.z - z; const ku = 1.06 * olcek / Math.max(0.01, Math.hypot(kx, ky, kz));
    psFxBill(x + kx * ku, y + ky * ku + 0.04, z + kz * ku, 1.22 * olcek, 1.22 * olcek, psSHUCRE[b.tur] || 0, 0xffffff, 1, sal * 0.07);
  }
  // 6) kameraya bakan parçacıklar (en üstte)
  for (let i = 0; i < psIN; i++) {
    if (psI.omur[i] <= 0 || psI.yer[i]) continue;
    const j = i * 3, k = 1 - psI.omur[i] / psI.tam[i], boy = lerp(psI.b0[i], psI.b1[i], psI.hucre[i] === 6 ? Math.sqrt(k) : k);
    psFxBill(psI.pos[j], psI.pos[j + 1], psI.pos[j + 2], boy, boy, psI.hucre[i], psI.renk[i], psI.a0[i] * (1 - k * k * k), psI.aci[i]);
  }
  psFx.visible = psFn > 0;
  if (psFn > 0) { const g = psFx.geometry; g.setDrawRange(0, psFn * 6); g.attributes.position.needsUpdate = true; g.attributes.uv.needsUpdate = true; g.attributes.color.needsUpdate = true; }
}
OLAY.on('surpriz', v => {   // balon patlaması: tek halka + renkli parçalar; arabayla birlikte ilerler, kısa sürer
  const x = v && v.x !== undefined ? v.x : P.x, z = v && v.z !== undefined ? v.z : P.z, renk = psSRENK[v && v.tur] || 0xff7a2e, vx = P.tx * P.v * 0.86, vz = P.tz * P.v * 0.86;
  psIzSac(x, 2.0, z, vx, 0, vz, 6, renk, 0.95, 1.2, 4.4, 0.42, 0, 0, 0);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * 6.283 + Math.random() * 0.3, r = 4.2 + Math.random() * 3.2, c = Math.cos(a) * r, s = Math.sin(a) * r;
    psIzSac(x, 2.0, z, vx - P.tz * c, 1.5 + s, vz + P.tx * c, i % 4 === 3 ? 8 : 11, i % 4 === 3 ? 0xffffff : i % 2 ? renk : psRENK[i % 6], 1, i % 4 === 3 ? 0.9 : 0.62, 0.3, 0.58 + Math.random() * 0.16, 7, 0, i % 4 === 3 ? 5 : 0);
  }
});
OLAY.on('yildiz', y => { if (psGucTur() === 'miknatis') { const i = YILDIZ.indexOf(y); if (i >= 0) psMikY[i] = 1; } });   // mıknatıs: toplanan yıldız arabaya uçar

// ───────── olaylar ─────────
const psKenarA = cvTema === 'kar' || cvTema === 'gokkusagi' || cvTema === 'seker' ? 0.75 : 0.5, psYanSon = psTema.isik > 0.5, psHopR = new Float32Array(12), psO = { x: 0, z: 0, tx: 0, tz: 1, k: 0 };
let psBitisT = 0, psBitisSay = 0;
let psTozYan = 1, psDurum = 'baslik', psRoketT = 0, psHopOnce = 0, psTozSay = 0, psPirilSay = 0, psCizgiHazir = false;
OLAY.on('durum', d => { psDurum = d; if (d !== 'yaris') psRoketT = 0; });
OLAY.on('roket', sure => { psRoketT = Math.max(psRoketT, sure || 1.3); });
OLAY.on('yildiz', y => {   // toplanan yıldızdan küçük pırıltı patlaması (arabayla birlikte ilerler)
  if (!y || y.x === undefined) return;
  const vx = P.tx * P.v * 0.9, vz = P.tz * P.v * 0.9;
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + Math.random() * 0.4, r = 3.2 + Math.random() * 2.2; psSac(psPiril, y.x, 1.7, y.z, vx + Math.cos(a) * r * -P.tz, 1.5 + Math.sin(a) * r, vz + Math.cos(a) * r * P.tx, i % 3 ? 0xffe066 : 0xffffff, 0.95, 0.75, 0.15, 0.42 + Math.random() * 0.14, 5, 1.2); }
});
OLAY.on('tok', () => { for (let i = 0; i < 7; i++) { const a = Math.random() * 6.283; psSac(psPiril, P.x, 1.1, P.z, P.tx * P.v * 0.8 + Math.cos(a) * 3, 1 + Math.random() * 3, P.tz * P.v * 0.8 + Math.sin(a) * 3, 0xffffff, 0.9, 0.6, 0.1, 0.32, 6, 1.5); } });
function psCizgiPirilti(n, hizV) {   // başlangıç çizgisi boyunca kısa pırıltı
  const p = pist(0);
  for (let i = 0; i < n; i++) { const d = ((i + Math.random()) / n - 0.5) * (GEN + 3); psSac(psPiril, p.x - p.tz * d + p.tx * 2, 0.4 + Math.random() * 1.2, p.z + p.tx * d + p.tz * 2, p.tx * hizV, 2.5 + Math.random() * 4.5, p.tz * hizV, psPIRIL_RENK[i % 5], 0.95, 0.9, 0.2, 0.7 + Math.random() * 0.5, 2.5, 0.8); }
}
OLAY.on('tur', n => { if (n < TUR) psCizgiPirilti(18, P.v * 0.75); });
OLAY.on('bitis', () => {   // bitiş: çizgi boyunca pırıltı + iki direğin dibinden fıskiye + kısa süre arabayla giden yan pırıltılar
  psCizgiPirilti(44, P.v * 0.3); psBitisT = 1.0; psBitisSay = 0;
  const p = pist(0, psO);
  for (let i = 0; i < 36; i++) { const yan = i % 2 ? 1 : -1, d = yan * (YARI + 1.4), a = Math.random() * 6.283, r = Math.random() * 1.6; psSac(psPiril, p.x - p.tz * d + Math.cos(a) * 0.5, 0.5 + Math.random() * 2.6, p.z + p.tx * d + Math.sin(a) * 0.5, p.tx * P.v * 0.35 + Math.cos(a) * r * 1.6 + p.tz * yan * 1.2, 4 + Math.random() * 12, p.tz * P.v * 0.35 + Math.sin(a) * r * 1.6 - p.tx * yan * 1.2, psPIRIL_RENK[i % 5], 0.85, 0.72, 0.16, 0.9 + Math.random() * 0.5, 9, 0.6); }
});
OLAY.on('seri', v => {
  if(!v || !v.odul)return;
  // Üç yıldızın ödülü arabadan ileri açılan kısa bir renk yelpazesi; görüşü kapatmaz.
  for(let i=0;i<18;i++) {
    const a=(i/17-.5)*Math.PI*1.1, yan=Math.sin(a), ileri=Math.cos(a), hiz=3+Math.random()*2;
    psSac(psPiril,P.x+P.tx*1.3,1.35,P.z+P.tz*1.3,P.tx*(P.v*.88+ileri*hiz)-P.tz*yan*hiz,1.7+Math.random()*2.6,P.tz*(P.v*.88+ileri*hiz)+P.tx*yan*hiz,psPIRIL_RENK[i%5],.92,.64,.08,.5+Math.random()*.18,5,1.5);
  }
});

function pistGuncelle(dt, t) {
  psOlcek.value = renderer.domElement.height * 0.5 / Math.tan(camera.fov * Math.PI / 360);
  // oklar: ileri akar, hafifçe parlar
  okDoku.offset.y = -((t * 1.5) % 1); okMat.opacity = 0.82 + Math.sin(t * 7) * 0.18; psOkZeminMat.color.setScalar(psYanSon ? 0.8 + Math.sin(t * 5) * 0.2 : 0.9 + Math.sin(t * 7) * 0.1);
  if (psYanSon) bantMat.emissiveIntensity = psTema.isik * (0.9 + Math.sin(t * 3.4) * 0.38);   // Ay Pisti: ışıklı bantlar hafifçe yanıp söner
  // yıldızlar: döner, süzülür; toplanınca büyüyüp yükselerek kaybolur
  for (let i = 0; i < YILDIZ.length; i++) {
    const y = YILDIZ[i], u = y.var ? 0 : clamp((0.3 - y.pat) / 0.3, 0, 1), gor = y.var || y.pat > 0;
    const yuk = 1.55 + Math.sin(t * 2.6 + i * 0.9) * 0.22 + u * 2.4, b = gor ? 0.7 * (1 + Math.sin(t * 5.2 + i) * 0.05 + u * 0.7) * (1 - u * u) : 0;
    if (psMikY[i] && (y.var || y.pat <= 0)) psMikY[i] = 0;
    if (psMikY[i]) {   // mıknatıs gücü: toplanan yıldız küçülerek arabaya uçar, ardında pırıltı bırakır
      const e = u * u * (3 - 2 * u), mx = lerp(y.x, P.x, e), my = lerp(1.55, 1.0, e) + Math.sin(u * Math.PI) * 0.9, mz = lerp(y.z, P.z, e);
      kukla.position.set(mx, my, mz); kukla.rotation.set(0, t * 2.6 + i * 0.7 + u * 14, 0); kukla.scale.setScalar(Math.max(0.0001, 0.7 * (1 - e * 0.8)));
      if (u < 0.9) psSac(psPiril, mx, my, mz, P.tx * P.v * 0.5, 0.4, P.tz * P.v * 0.5, i % 2 ? 0xffe066 : 0xffffff, 0.85, 0.5, 0.1, 0.24, 0, 1.5);
    } else { kukla.position.set(y.x, yuk, y.z); kukla.rotation.set(0, t * 2.6 + i * 0.7 + u * 9, 0); kukla.scale.setScalar(Math.max(0.0001, b)); }
    kukla.updateMatrix(); yildizIM.setMatrixAt(i, kukla.matrix);
    // Her turdaki yeni yıldız yolu aynı nesneleri taşır; hale de yıldızla birlikte yer değiştirir.
    kukla.position.set(y.x, 0.075 + rampaYukseklik(y.s, y.d), y.z); kukla.rotation.set(0, 0, 0); kukla.scale.setScalar(y.var ? 0.92 - (yuk - 1.55) * 0.5 : 0.0001); kukla.updateMatrix(); psGolgeIM.setMatrixAt(i, kukla.matrix);
    psHale.pos[i * 3] = y.x; psHale.pos[i * 3 + 1] = yuk; psHale.pos[i * 3 + 2] = y.z; psHale.boy[i] = y.var ? 3.3 + Math.sin(t * 5.2 + i) * 0.3 : 0;
  }
  yildizIM.instanceMatrix.needsUpdate = true; psGolgeIM.instanceMatrix.needsUpdate = true; psHale.geo.attributes.position.needsUpdate = true; psHale.geo.attributes.aBoy.needsUpdate = true;
  // balonlar hafifçe sallanır
  for (let i = 0; i < 6; i++) {
    if (psTema.top) { kukla.position.set(psBALON[i * 3], psBALON[i * 3 + 1], psBALON[i * 3 + 2]); kukla.rotation.set(0, 0, 0); kukla.scale.setScalar(0.6 + Math.sin(t * 2.2 + i * 1.3) * 0.025); }
    else { kukla.position.set(psBALON[i * 3] + Math.sin(t * 0.9 + i * 1.7) * 0.1, psBALON[i * 3 + 1] + Math.sin(t * 1.4 + i * 2.3) * 0.12, psBALON[i * 3 + 2]); kukla.rotation.set(0, 0, Math.sin(t * 0.9 + i * 1.7) * 0.08); kukla.scale.set(0.62, 0.8, 0.62); }
    kukla.updateMatrix(); psBalonIM.setMatrixAt(i, kukla.matrix);
  }
  psBalonIM.instanceMatrix.needsUpdate = true;

  const yarista = psDurum === 'yaris', sx = -P.tz, sz = P.tx;
  // arka tekerlerden hafif toz izi
  if (yarista && P.v > 10 && P.hop <= 0) {
    const rk = psRoketT > 0;   // roket anında: büyük gri bulut yerine birkaç küçük, açık renkli, kısa ömürlü puf
    psTozSay += dt * (rk ? 9 : 34);
    if (rk) while (psTozSay >= 1) { psTozSay--; const yan = (psTozYan = -psTozYan), g = Math.random(); psSac(psToz, P.x - P.tx * 1.25 + sx * yan * 0.98, 0.22, P.z - P.tz * 1.25 + sz * yan * 0.98, P.tx * P.v * 0.55 + sx * yan * g, 0.4 + g * 0.5, P.tz * P.v * 0.55 + sz * yan * g, 0xffffff, 0.3, 0.3, 0.55, 0.2, 0, 3); }
    while (psTozSay >= 1) { psTozSay--; const hv = psTema.tozPiril ? psPiril : psToz, yan = (psTozYan = -psTozYan), g = Math.random(); psSac(hv, P.x - P.tx * 1.25 + sx * yan * 0.98, 0.22, P.z - P.tz * 1.25 + sz * yan * 0.98, P.tx * P.v * 0.3 + sx * yan * g, 0.5 + g * (psTema.tozYc ? 2.2 : 0.8), P.tz * P.v * 0.3 + sz * yan * g, psTema.toz[hv.i % psTema.toz.length], psTema.tozA, psTema.tozB0, psTema.tozB1, psTema.tozOmur * (0.85 + g * 0.3), psTema.tozYc, 3); }
  }
  // zıplamadan iniş: toz pufu
  if (psHopOnce > 0 && P.hop <= 0 && yarista) { for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r = 3 + Math.random() * 2.5; psSac(psToz, P.x + Math.cos(a) * 0.9, 0.25, P.z + Math.sin(a) * 0.9, P.tx * P.v * 0.72 + Math.cos(a) * r, 0.6 + Math.random() * 1.2, P.tz * P.v * 0.72 + Math.sin(a) * r, psTema.puf, 0.6, 0.7, 2.0, 0.55, 0, 2.2); } }
  psHopOnce = P.hop;
  // rakipler rampadan inince küçük toz pufu (yalnız yakındakiler)
  if (yarista && typeof A !== 'undefined') for (let i = 1; i < A.length && i < 12; i++) {
    const a = A[i];
    if (psHopR[i] > 0 && a.hop <= 0 && Math.abs(a.yol - P.yol) < 70) {
      const p = pist(a.yol, psO), x = p.x - p.tz * a.d, z = p.z + p.tx * a.d;
      for (let k = 0; k < 9; k++) { const q = k / 9 * 6.283, r = 2.4 + Math.random() * 1.8; psSac(psToz, x + Math.cos(q) * 0.8, 0.25, z + Math.sin(q) * 0.8, p.tx * a.v * 0.7 + Math.cos(q) * r, 0.5 + Math.random(), p.tz * a.v * 0.7 + Math.sin(q) * r, psTema.puf, 0.5, 0.6, 1.6, 0.48, 0, 2.2); }
    }
    psHopR[i] = a.hop;
  }
  // bitişten sonra kısa süre: arabanın iki yanında yükselen pırıltılar
  if (psBitisT > 0) {
    psBitisT -= dt; psBitisSay += dt * 44;
    while (psBitisSay >= 1) { psBitisSay--; const yan = (psTozYan = -psTozYan); psSac(psPiril, P.x + P.tx * 5 + sx * yan * 6.2, 0.4, P.z + P.tz * 5 + sz * yan * 6.2, P.tx * P.v * 0.92, 4 + Math.random() * 5, P.tz * P.v * 0.92, psPIRIL_RENK[psPiril.i % 5], 0.95, 0.85, 0.15, 0.6 + Math.random() * 0.3, 6, 0.4); }
  }
  // roket: pırıltı izi + hız çizgileri
  if (psRoketT > 0) {
    psRoketT -= dt; psPirilSay += dt * 46;
    while (psPirilSay >= 1) { psPirilSay--; const g = Math.random() - 0.5; psSac(psPiril, P.x - P.tx * 1.9 + sx * g * 1.1, 0.55 + Math.random() * 0.5 + (P.hop > 0 ? 1 : 0), P.z - P.tz * 1.9 + sz * g * 1.1, P.tx * P.v * 0.45 + sx * g * 2, Math.random() * 1.6, P.tz * P.v * 0.45 + sz * g * 2, psPIRIL_RENK[psPiril.i % 5], 0.9, 0.62, 0.12, 0.3 + Math.random() * 0.14, 0, 1.5); }
    if (!psCizgiHazir) { for (let i = 0; i < psCN; i++) psCizgiKoy(i, 6 + Math.random() * 44); psCizgiHazir = true; }
    for (let i = 0; i < psCN; i++) {
      const q = i * 5; if ((psCizgiVeri[q] - P.x) * P.tx + (psCizgiVeri[q + 2] - P.z) * P.tz < -13) psCizgiKoy(i, 26 + Math.random() * 28);
      kukla.position.set(psCizgiVeri[q], psCizgiVeri[q + 1], psCizgiVeri[q + 2]); kukla.rotation.set(0, psCizgiVeri[q + 3], 0); kukla.scale.set(1, 1, psCizgiVeri[q + 4]); kukla.updateMatrix(); psCizgiIM.setMatrixAt(i, kukla.matrix);
    }
    psCizgiIM.instanceMatrix.needsUpdate = true; psCizgiIM.visible = true; psCizgiIM.material.opacity = 0.34 * clamp(psRoketT * 4, 0, 1);
    psKenar.visible = true; psKenarMat.uniforms.uT.value = t % 100; psKenarMat.uniforms.uA.value = psKenarA * clamp(psRoketT * 4, 0, 1);
  } else if (psCizgiIM.visible) { psCizgiIM.visible = false; psKenar.visible = false; psCizgiHazir = false; }
  psSurprizAdim(dt, t, yarista);
  psHavuzAdim(psToz, dt); psHavuzAdim(psPiril, dt);

  // konfeti
  if (konfeti.visible) {
    for (let i = 0; i < KN; i++) {
      const j = i * 3, f = psKDon[j] + t * psKDon[j + 2];
      kHiz[j + 1] -= 9 * dt; if (kHiz[j + 1] < -2.2) kHiz[j + 1] += (-2.2 - kHiz[j + 1]) * Math.min(1, dt * 5);
      kHiz[j] *= 1 - Math.min(1, dt * 0.9); kHiz[j + 2] *= 1 - Math.min(1, dt * 0.9);
      kPos[j] += (kHiz[j] + Math.sin(f) * 0.9) * dt; kPos[j + 1] += kHiz[j + 1] * dt; kPos[j + 2] += (kHiz[j + 2] + Math.cos(f * 0.8) * 0.9) * dt;
      if (kPos[j + 1] < 0.08) { kPos[j] = P.x + (Math.random() - 0.5) * 13; kPos[j + 1] = 6 + Math.random() * 3.5; kPos[j + 2] = P.z + (Math.random() - 0.5) * 13; kHiz[j] = 0; kHiz[j + 1] = -1.5; kHiz[j + 2] = 0; }
      kukla.position.set(kPos[j], kPos[j + 1], kPos[j + 2]); kukla.rotation.set(t * psKDon[j + 1] + psKDon[j], f, t * psKDon[j + 2]); const kx = kPos[j] - camera.position.x, ky = kPos[j + 1] - camera.position.y, kz = kPos[j + 2] - camera.position.z; kukla.scale.setScalar(clamp((kx * kx + ky * ky + kz * kz) / 30, 0.05, 1)); kukla.updateMatrix(); konfeti.setMatrixAt(i, kukla.matrix);   // kameraya çok yakın kâğıt küçülür, ekranı kapatmaz
    }
    konfeti.instanceMatrix.needsUpdate = true;
  }
  kukla.rotation.set(0, 0, 0); kukla.scale.set(1, 1, 1);
}
