/* Ses: önceden kaydedilmiş Türkçe anlatım (sesler/*.mp3, tr-TR-EmelNeural) + kodla üretilen müzik, efektler ve motor sesi.
   ?sessiz ile her şey kapalı (AudioContext hiç kurulmaz). Cümle değişirse: python gen_voice.py
   Müzik: Do majör, 32 ölçülük A-A'-B-A'' döngüsü; ses saatine göre önceden planlanır (kare döngüsüne bağlı değil).
   Kipler: baslik (sakin) · yaris (canlı) · son (son tur: daha hızlı, bir ton yukarı) · sonuc (bitişten sonra sakin). */
const SES = (() => {
  'use strict';
  const sessiz = new URLSearchParams(location.search).has('sessiz');
  /*SESLER*/
  const CUMLE = {
    giris: 'Feza, orman yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    hazir: 'Hazır mısın?',
    basla: 'Başla!',
    yildiz: 'Yıldızları topla!',
    roket: 'Roket düğmesine bas, araban hızlansın!',
    sontur: 'Son tur! Haydi Feza!',
    bir: 'Birinci oldun! Kupa senin!',
    iki: 'İkinci oldun! Çok güzel sürdün.',
    uc: 'Üçüncü oldun! Bravo Feza.',
    ovgu1: 'Aferin Feza!',
    ovgu2: 'Ne güzel sürüyorsun!',
    ovgu3: 'Süpersin!',
    hop: 'Hop! Uçtun!',
    tekrar: 'Bir daha yarışalım mı?'
  };
  /*SESLER-SON*/
  const kayit = {};
  let simdi = null, ac = null, G = null, mola = false;

  // ---------- Müzik verisi ----------
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  // akor: [bas notası, üçlü]
  const AKOR = { C: [48, [60, 64, 67]], G: [55, [59, 62, 67]], A: [45, [57, 60, 64]], F: [53, [57, 60, 65]], E: [52, [55, 59, 64]], D: [50, [57, 62, 65]] };
  const DIZI = 'CAFGCAFG' + 'CAFGFGCC' + 'FGEADGCG' + 'CAFGFGCC';
  // ezgi: ölçü başına 8 sekizlik. küçük harf = 5. sekizli, büyük harf = 6. sekizli, xyz = sol-la-si (4), '-' uzat, '.' sus
  const MEL = [
    'eggec-e-', 'a.age-c-', 'faafC-a-', 'g-b-D-..', 'eggec-eg', 'a.aCa-e-', 'f-agf-e-', 'd-edz-d-',
    'eggec-e-', 'a.age-c-', 'faafC-a-', 'g-b-D-..', 'C-aCa-f-', 'b-gbD-b-', 'C-g-e-g-', 'C--..gab',
    'C-CaC-a-', 'b-bgb-g-', 'g-geg-e-', 'a-aCE-C-', 'f-afD-a-', 'g-bDG-D-', 'E-C-g-C-', 'D-b-g-d-',
    'eggeC-g-', 'a.age-a-', 'faafC-a-', 'g-b-D-b-', 'faCaf-a-', 'g-bDb-g-', 'C.C.E.G.', 'C-g-C---'
  ];
  const NOTA = { x: 67, y: 69, z: 71, c: 72, d: 74, e: 76, f: 77, g: 79, a: 81, b: 83, C: 84, D: 86, E: 88, F: 89, G: 91, A: 93 };
  const MOD = {
    baslik: { bpm: 96, sakin: true, tr: 0, guc: 0.6 },
    sonuc: { bpm: 100, sakin: true, tr: 0, guc: 0.5 },
    yaris: { bpm: 120, tr: 0, guc: 0.62 },
    son: { bpm: 132, tr: 2, guc: 0.66, son: true }
  };
  const ADIM = 16 * MEL.length;

  // ---------- Ses grafiği (canlı ve çevrimdışı deneme aynı kodu kullanır) ----------
  function kur(c, motorlu) {
    const g = { ctx: c };
    const kazanc = (v, hedef) => { const n = c.createGain(); n.gain.value = v; if (hedef) n.connect(hedef); return n; };
    // ana çıkış: sıkıştırıcı + yumuşak sınırlayıcı (kırpılma olmaz, tepe en çok 0,89)
    const sinir = c.createWaveShaper(), egri = new Float32Array(2049);
    for (let i = 0; i < 2049; i++) { const x = i / 1024 - 1, a = Math.abs(x); egri[i] = Math.sign(x) * (a < 0.6 ? a : 0.6 + 0.35 * Math.tanh((a - 0.6) / 0.35)); }
    sinir.curve = egri; sinir.connect(c.destination);
    const komp = c.createDynamicsCompressor();
    komp.threshold.value = -18; komp.knee.value = 10; komp.ratio.value = 5; komp.attack.value = 0.005; komp.release.value = 0.18;
    komp.connect(sinir);
    g.ana = kazanc(0.6, komp);
    g.muzikKis = kazanc(1, g.ana); g.efektKis = kazanc(1, g.ana);          // anlatıcı konuşurken kısılan katlar
    g.muzik = kazanc(0, g.muzikKis); g.efekt = kazanc(0.9, g.efektKis);
    // hafif yankı (ezgi ve çıngıraklar için)
    g.yanki = kazanc(0.3); const gec = c.createDelay(0.5), geri = kazanc(0.28), yum = c.createBiquadFilter();
    gec.delayTime.value = 0.21; yum.type = 'lowpass'; yum.frequency.value = 2600;
    g.yanki.connect(gec); gec.connect(yum); yum.connect(geri); geri.connect(gec); yum.connect(g.muzikKis);
    g.ezgi = kazanc(1, g.muzik); g.ezgi.connect(g.yanki);
    g.can = kazanc(1, g.efekt); g.can.connect(g.yanki);
    // gürültü tamponu (vurmalılar, vuuş)
    const n = c.sampleRate, tampon = c.createBuffer(1, n, n), v = tampon.getChannelData(0); let s = 12345;
    for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; v[i] = s / 0x3fffffff - 1; }
    g.gurultu = tampon;
    if (motorlu) {
      // oyuncak araba vınlaması: iki yumuşak dalga + alçak geçiren süzgeç + hafif titreşim
      const m = g.motor = { o1: c.createOscillator(), o2: c.createOscillator(), lfo: c.createOscillator(), kazanc: kazanc(0, g.muzikKis) };
      const suz = c.createBiquadFilter(), tit = kazanc(1, m.kazanc), o2k = kazanc(0.28, suz), lfoK = kazanc(0.2, tit.gain);
      suz.type = 'lowpass'; suz.frequency.value = 900; suz.Q.value = 0.6; suz.connect(tit); m.suz = suz;
      m.o1.type = 'triangle'; m.o1.frequency.value = 80; m.o1.connect(suz);
      m.o2.type = 'sine'; m.o2.frequency.value = 160; m.o2.connect(o2k);
      m.lfo.type = 'sine'; m.lfo.frequency.value = 10; m.lfo.connect(lfoK);
      m.o1.start(); m.o2.start(); m.lfo.start();
    }
    return g;
  }
  // tek nota. o: tip, guc, at (giriş süresi), tut (0 = çınlayıp söner; >0 = süre boyunca tutulur), f2 + kay (perde kayması)
  function ton(g, hedef, t, f, sure, o) {
    const c = g.ctx, os = c.createOscillator(), k = c.createGain(), at = o.at || 0.008;
    os.type = o.tip || 'sine'; os.frequency.setValueAtTime(f, t);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + (o.kay || sure));
    k.gain.setValueAtTime(0, t); k.gain.linearRampToValueAtTime(o.guc, t + at);
    let son;
    if (o.tut) { k.gain.setTargetAtTime(o.guc * o.tut, t + at, 0.06); k.gain.setTargetAtTime(0, Math.max(t + at, t + sure), 0.035); son = t + sure + 0.25; }
    else { k.gain.setTargetAtTime(0, t + at, sure / 4); son = t + at + sure * 1.5 + 0.05; }
    os.connect(k); k.connect(hedef); os.start(t); os.stop(son); os.onended = () => k.disconnect();
    return os;
  }
  // süzülmüş gürültü. o: tip (süzgeç), f, f2, q, guc, at
  function his(g, hedef, t, sure, o) {
    const c = g.ctx, kay = c.createBufferSource(), suz = c.createBiquadFilter(), k = c.createGain(), at = o.at || 0.004;
    kay.buffer = g.gurultu; kay.loop = true;
    suz.type = o.tip || 'highpass'; suz.frequency.setValueAtTime(o.f, t); if (o.f2) suz.frequency.exponentialRampToValueAtTime(o.f2, t + sure); suz.Q.value = o.q || 0.7;
    k.gain.setValueAtTime(0, t); k.gain.linearRampToValueAtTime(o.guc, t + at); k.gain.setTargetAtTime(0, t + at, sure / 4);
    kay.connect(suz); suz.connect(k); k.connect(hedef); kay.start(t, (t * 0.37) % 0.9); kay.stop(t + at + sure * 1.5 + 0.05); kay.onended = () => k.disconnect();
  }
  const davul = (g, t, guc) => ton(g, g.muzik, t, 150, 0.16, { f2: 50, kay: 0.09, guc });
  const trampet = (g, t, guc) => { his(g, g.muzik, t, 0.1, { tip: 'bandpass', f: 1900, q: 0.8, guc }); ton(g, g.muzik, t, 200, 0.06, { tip: 'triangle', guc: guc * 0.5 }); };
  const zil = (g, t, guc) => his(g, g.muzik, t, 0.035, { f: 7000, guc });

  // müziğin bir on altılık adımı: n = döngüdeki adım (0..511), t = çalma anı, sd = adım süresi
  function adim(g, m, n, t, sd) {
    const olcu = (n >> 4) % MEL.length, s = n & 15, ak = AKOR[DIZI[olcu]], tr = m.tr, bolumB = olcu >= 16 && olcu < 24;
    if (!(s & 1)) {                                                         // ezgi
      const satir = MEL[olcu], i = s >> 1, no = NOTA[satir[i]];
      if (no) {
        let u = 1; while (i + u < 8 && satir[i + u] === '-') u++;
        const f = mf(no + tr), sure = u * 2 * sd;
        if (m.sakin) { ton(g, g.ezgi, t, f, sure, { guc: 0.15, tut: 0.55, at: 0.012 }); ton(g, g.ezgi, t, f * 2, sure * 0.6, { guc: 0.03 }); }
        else { ton(g, g.ezgi, t, f, sure * 0.92, { tip: 'triangle', guc: 0.17, tut: 0.6 }); ton(g, g.ezgi, t, f * 2, sure * 0.7, { guc: m.son ? 0.06 : 0.035 }); }
      }
    }
    if (m.sakin) {
      if (s === 0) for (const a of ak[1]) ton(g, g.muzik, t, mf(a + tr), 15 * sd, { guc: 0.035, tut: 1, at: 0.18 });   // yumuşak akor
      if (!(s & 1)) ton(g, g.muzik, t, mf(ak[1][[0, 1, 2, 1][(s >> 1) & 3]] + 12 + tr), 2 * sd, { tip: 'triangle', guc: 0.04 });
      if (s === 0 || s === 8) ton(g, g.muzik, t, mf(ak[0] + (s ? 7 : 0) + tr), 6 * sd, { tip: 'triangle', guc: 0.13, tut: 0.5, at: 0.015 });
      if (s === 4 || s === 12) zil(g, t, 0.022);
      return;
    }
    if (!(s & 3)) ton(g, g.muzik, t, mf(ak[0] + ((s & 4) ? 7 : 0) + tr), 3 * sd, { tip: 'triangle', guc: 0.2, tut: 0.6 });   // zıplayan bas
    else if (s === 14) ton(g, g.muzik, t, mf(ak[0] + tr), 1.6 * sd, { tip: 'triangle', guc: 0.15, tut: 0.6 });
    if (bolumB) { if (!(s & 1)) ton(g, g.muzik, t, mf(ak[1][[0, 1, 2, 1][(s >> 1) & 3]] + 12 + tr), 2 * sd, { tip: 'triangle', guc: 0.05 }); }
    else if ((s & 3) === 2) for (const a of ak[1]) ton(g, g.muzik, t, mf(a + tr), 1.6 * sd, { tip: 'triangle', guc: 0.05 });   // ara vuruş akorları
    if (s === 0 || s === 8 || (m.son && (s === 4 || s === 12)) || (s === 10 && (olcu & 1))) davul(g, t, 0.3);
    if (s === 4 || s === 12) trampet(g, t, 0.1);
    if ((olcu & 7) === 7 && s > 12) trampet(g, t, 0.05 + (s - 12) * 0.015);   // bölüm sonu küçük geçiş
    if (!(s & 1)) zil(g, t, (s & 3) === 2 ? 0.045 : 0.025); else if (m.son) zil(g, t, 0.018);
  }

  // ---------- Efektler: E.ad(grafik, an, ...) ----------
  const YILDIZ = [84, 86, 88, 91, 93, 96];
  const E = {
    yildiz(g, t, k) {                                                       // tatlı çıngırak; k = art arda kaçıncı (0..5)
      const a = YILDIZ[Math.min(5, k || 0)], f = mf(a), z = 1 - 0.07 * (k || 0);
      ton(g, g.can, t, f, 0.28, { guc: 0.2 * z }); ton(g, g.can, t, f * 2, 0.16, { guc: 0.05 * z });
      ton(g, g.can, t + 0.075, mf(a + 7), 0.4, { guc: 0.17 * z }); ton(g, g.can, t + 0.075, mf(a + 19), 0.2, { guc: 0.03 * z });
    },
    roket(g, t) {
      his(g, g.efekt, t, 0.75, { tip: 'bandpass', f: 320, f2: 2800, q: 1.3, guc: 0.3, at: 0.22 });
      ton(g, g.efekt, t, 190, 0.6, { f2: 760, kay: 0.55, guc: 0.09, at: 0.15, tut: 0.8 });
    },
    hop(g, t) {
      const o = ton(g, g.efekt, t, 210, 0.36, { f2: 640, kay: 0.13, guc: 0.2, tut: 0.7 }); o.frequency.exponentialRampToValueAtTime(400, t + 0.38);
      ton(g, g.efekt, t, 105, 0.2, { tip: 'triangle', f2: 320, kay: 0.13, guc: 0.08 });
    },
    tok(g, t) { ton(g, g.efekt, t, 165, 0.15, { f2: 62, kay: 0.1, guc: 0.3 }); his(g, g.efekt, t, 0.07, { tip: 'lowpass', f: 520, guc: 0.16 }); },
    bip(g, t) { ton(g, g.efekt, t, 587.3, 0.2, { guc: 0.17, tut: 0.8 }); ton(g, g.efekt, t, 587.3, 0.2, { tip: 'triangle', guc: 0.05, tut: 0.8 }); },
    git(g, t) {
      ton(g, g.can, t, 1174.7, 0.5, { guc: 0.16, tut: 0.8 }); ton(g, g.can, t, 1174.7, 0.5, { tip: 'triangle', guc: 0.05, tut: 0.8 });
      ton(g, g.can, t, 880, 0.5, { guc: 0.06, tut: 0.8 }); ton(g, g.can, t, 2349.3, 0.4, { guc: 0.03 });
    },
    tur(g, t) { [79, 84, 88, 91].forEach((a, i) => ton(g, g.can, t + i * 0.085, mf(a), i === 3 ? 0.45 : 0.22, { tip: 'triangle', guc: 0.15 })); ton(g, g.can, t + 0.255, mf(103), 0.3, { guc: 0.04 }); },
    bitis(g, t) {                                                           // kısa zafer ezgisi (yaklaşık 2,5 sn)
      const u = 0.14;
      [[0, 79, 0.8], [1, 79, 0.8], [2, 79, 0.8], [3, 84, 2.8], [6, 81, 0.9], [7, 83, 0.9], [8, 88, 7]].forEach(n => {
        ton(g, g.can, t + n[0] * u, mf(n[1]), n[2] * u, { tip: 'triangle', guc: 0.17, tut: 0.7 }); ton(g, g.can, t + n[0] * u, mf(n[1] + 12), n[2] * u, { guc: 0.04, tut: 0.5 });
      });
      [[3, 76, 2.8], [6, 77, 0.9], [7, 79, 0.9], [8, 84, 7], [8, 79, 7]].forEach(n => ton(g, g.efekt, t + n[0] * u, mf(n[1]), n[2] * u, { tip: 'triangle', guc: 0.08, tut: 0.7 }));
      [[3, 48, 2.8], [6, 53, 0.9], [7, 55, 0.9], [8, 48, 7]].forEach(n => ton(g, g.efekt, t + n[0] * u, mf(n[1]), n[2] * u, { tip: 'triangle', guc: 0.16, tut: 0.7 }));
      [0, 1, 2].forEach(i => ton(g, g.efekt, t + i * u, 150, 0.14, { f2: 55, kay: 0.08, guc: 0.22 }));
      his(g, g.efekt, t + 8 * u, 0.9, { f: 5200, guc: 0.06 });
      [96, 100, 103, 108, 103, 108].forEach((a, i) => ton(g, g.can, t + 8 * u + 0.12 + i * 0.1, mf(a), 0.3, { guc: 0.05 }));
    },
    tik(g, t) { ton(g, g.efekt, t, 1100, 0.045, { f2: 780, guc: 0.12 }); }
  };

  // ---------- Canlı çalma ----------
  let mod = null, bekleyen = null, adimNo = 0, sonraki = 0, kisik = false, sonDurum = 'baslik', sonucZ = 0, roketSon = -1, yildizK = 0, yildizT = -9;
  const canli = () => !!(ac && ac.state === 'running');
  function muzikMod(ad) {
    if (!ac) return;
    if (ad === mod) { bekleyen = null; return; }
    if (ad === 'son') { if (mod === 'yaris') bekleyen = 'son'; return; }   // son tur: ölçü başında geçilir
    const t = ac.currentTime, k = G.muzik.gain;
    mod = ad; bekleyen = null;
    k.cancelScheduledValues(t); k.setTargetAtTime(0, t, 0.03);
    if (ad) { adimNo = 0; sonraki = t + 0.24; k.setValueAtTime(0, sonraki - 0.02); k.linearRampToValueAtTime(MOD[ad].guc, sonraki); }
  }
  function kisAyar() {                                                      // anlatıcı konuşurken müzik ve efektler kısılır
    const k = konusuyor(); if (k === kisik || !ac) return; kisik = k;
    const t = ac.currentTime;
    G.muzikKis.gain.setTargetAtTime(k ? 0.3 : 1, t, k ? 0.05 : 0.3); G.efektKis.gain.setTargetAtTime(k ? 0.55 : 1, t, k ? 0.05 : 0.3);
  }
  function zamanla() {                                                      // ileriye dönük planlayıcı (50 ms'de bir, 0,22 sn ileri)
    if (!canli()) return;
    kisAyar();
    if (!mod) return;
    const t = ac.currentTime;
    if (sonraki < t - 0.05) sonraki = t + 0.05;
    while (sonraki < t + 0.22) {
      if (bekleyen && !(adimNo & 15)) { mod = bekleyen; bekleyen = null; G.muzik.gain.setTargetAtTime(MOD[mod].guc, sonraki, 0.05); }
      const m = MOD[mod], sd = 15 / m.bpm;
      adim(G, m, adimNo, sonraki, sd); sonraki += sd; adimNo = (adimNo + 1) % ADIM;
    }
  }
  function durumDegisti(d) {
    sonDurum = d; clearTimeout(sonucZ);
    if (d === 'baslik' || d === 'giris') muzikMod('baslik');
    else if (d === 'yaris') muzikMod('yaris');
    else { muzikMod(null); if (d === 'bitis') sonucZ = setTimeout(() => { if (sonDurum === 'bitis') muzikMod('sonuc'); }, 3300); }
  }
  function uyandir() { if (ac && !mola && !document.hidden && ac.state !== 'running') { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); } }

  function hazirla() {
    if (sessiz || ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      G = kur(ac, true);
      uyandir();
      setInterval(zamanla, 50);
      if (typeof OLAY !== 'undefined') {
        OLAY.on('durum', durumDegisti);
        OLAY.on('tur', n => { if (n === (typeof TUR !== 'undefined' ? TUR : 3) - 1) muzikMod('son'); });
        OLAY.on('roket', sure => { roketSon = ac.currentTime + (sure > 0 ? sure : 1.5); });
      }
      muzikMod('baslik');
      document.addEventListener('visibilitychange', () => { if (document.hidden) { const p = ac.suspend(); if (p && p.catch) p.catch(() => {}); sus(); } else uyandir(); });
      document.addEventListener('click', e => { const b = e.target && e.target.closest && e.target.closest('button'); if (b && b.id !== 'hizlan') efekt.tik(); }, true);
    } catch (e) { ac = null; G = null; }
    for (const k in CUMLE) { const a = new Audio('sesler/' + k + '.mp3'); a.preload = 'auto'; kayit[k] = a; }
  }
  // iPad: ses ilk dokunuşta açılır; sonradan kesilirse (arama, kilit) bir sonraki dokunuşta geri gelir
  if (!sessiz) for (const ad of ['pointerup', 'touchend', 'click', 'keydown']) addEventListener(ad, () => { if (!ac) hazirla(); else uyandir(); }, true);

  function soyle(k) {
    if (sessiz || !kayit[k]) return;
    try { if (simdi) { simdi.pause(); simdi.currentTime = 0; } simdi = kayit[k]; simdi.currentTime = 0; const p = simdi.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ses çalınamadı */ }
    kisAyar();
  }
  function konusuyor() { return !!(simdi && !simdi.paused && !simdi.ended); }
  function sus() { if (simdi) { try { simdi.pause(); } catch (e) { /* yok */ } } kisAyar(); }
  const cal = ad => function () { if (canli()) E[ad](G, ac.currentTime + 0.012); };
  const efekt = {
    yildiz() {                                                              // art arda toplandıkça perde yükselir
      if (!canli()) return;
      const t = ac.currentTime; yildizK = t - yildizT < 1.8 ? Math.min(5, yildizK + 1) : 0; yildizT = t;
      E.yildiz(G, t + 0.012, yildizK);
    },
    roket: cal('roket'), hop: cal('hop'), tok: cal('tok'), bip: cal('bip'), git: cal('git'), tur: cal('tur'), bitis: cal('bitis'), tik: cal('tik')
  };
  function motorAyar(hiz, acik) {
    if (!canli()) return;
    const t = ac.currentTime, m = G.motor, r = Math.max(0, Math.min(1, (roketSon - t) / 0.35)), f = (82 + hiz * 3.1) * (1 + 0.3 * r);
    m.o1.frequency.setTargetAtTime(f, t, 0.1); m.o2.frequency.setTargetAtTime(f * 2.005, t, 0.1);
    m.lfo.frequency.setTargetAtTime(9 + hiz * 0.28 + 6 * r, t, 0.15); m.suz.frequency.setTargetAtTime(700 + hiz * 14 + 900 * r, t, 0.15);
    m.kazanc.gain.setTargetAtTime(acik ? 0.034 + Math.min(0.024, hiz * 0.0008) + 0.014 * r : 0, t, 0.12);
  }
  function durdur(d) {
    mola = !!d;
    if (ac) { if (d) { const p = ac.suspend(); if (p && p.catch) p.catch(() => {}); } else uyandir(); }
    if (d) sus();
  }
  return { hazirla, soyle, sus, konusuyor, efekt, motorAyar, durdur, sessiz, CUMLE, _ic: { kur, adim, E, MOD, ADIM, MEL, DIZI, NOTA } };
})();
