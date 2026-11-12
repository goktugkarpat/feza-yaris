/* Ses: önceden kaydedilmiş Türkçe anlatım (sesler/*.mp3, tr-TR-EmelNeural) + kodla üretilen müzik, efektler ve motor sesi.
   ?sessiz ile her şey kapalı (AudioContext hiç kurulmaz). Cümle değişirse: python gen_voice.py
   Müzik: Do majör, 32 ölçülük A-A'-B-A'' döngüsü; ses saatine göre önceden planlanır (kare döngüsüne bağlı değil).
   Dokuz pistin her birinin temposu, çalgısı, vurmalı düzeni ve B bölümü ayrıdır (SES_BPM, SES_B, adim içindeki tema dalları).
   Kipler: baslik (sakin) · yaris (canlı) · son (son tur: daha hızlı, bir ton yukarı) · sonuc (bitişten sonra sakin). */
const SES = (() => {
  'use strict';
  const sessiz = new URLSearchParams(location.search).has('sessiz');
  const sesPist = new URLSearchParams(location.search).get('pist');
  const SES_TEMALAR = ['orman', 'kiyi', 'kar', 'seker', 'uzay', 'col', 'gokkusagi', 'dino', 'sehir'];   // cekirdek.js'teki PIST_TEMALARI ile aynı adlar (ses.js ondan önce yüklenir)
  const sesTema = SES_TEMALAR.indexOf(sesPist) >= 0 ? sesPist : 'orman';
  /*SESLER*/
  const CUMLE = {
    giris: 'Parmağını sağa sola sürükle, araban oraya gitsin.',
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
    tekrar: 'Bir daha yarışalım mı?',
    giris_orman: 'Feza, orman yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_kiyi: 'Feza, sahil yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_kar: 'Feza, kar yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_seker: 'Feza, şeker diyarı yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_uzay: 'Feza, ay yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_col: 'Feza, çöl yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_gokkusagi: 'Feza, gökkuşağı yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_dino: 'Feza, dinozor yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_sehir: 'Feza, şehir yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.'
  };
  /*SESLER-SON*/
  const kayit = {};
  let simdi = null, oynatici = null, sesKaynak = '', devamKayit = null, ac = null, G = null, mola = false;

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
  // Pist başına B bölümü (17–24. ölçüler): [akor dizisi, ezgi]. Orman özgün B bölümünü çalar.
  const SES_B = {
    kiyi: ['FCFCDGCG', ['a--C--a-', 'g--e--c-', 'a--C--D-', 'E--C--g-', 'f--a--D-', 'D--b--g-', 'e-gC-ge-', 'd-g-b-D-']],     // kalipso: kayık ritim
    kar: ['AEFCAEFG', ['e---c-e-', 'g---e-g-', 'a---f-a-', 'g-----e-', 'C---a-e-', 'b---g-e-', 'f-a-C-a-', 'g-b-D---']],      // uzun, sakin sesler
    seker: ['CFCGCFGC', ['cegCgCge', 'faCFCFCa', 'egCECEge', 'dgbDbDbg', 'CgCgEgCg', 'CaCaFaCa', 'DbgbDbgD', 'CEGEC-g-']],    // müzik kutusu: koşan sekizlikler
    uzay: ['FCGAFCGG', ['C---a---', 'g---E---', 'D---b---', 'C---e-a-', 'F---C---', 'E---g---', 'D-b-g-b-', 'D-----..']],     // süzülen geniş aralıklar
    col: ['FCGCFCDG', ['f-fga-f-', 'e-efg-e-', 'd-dgb-g-', 'C-bCg-e-', 'a-aCa-f-', 'g-gag-e-', 'f-fed-f-', 'g-abD-b-']],      // tekrar eden vuruşlu ezgi
    gokkusagi: ['CFGCAFGC', ['cegCEGEC', 'faCFAFCa', 'gbDGDbgd', 'egCEG-E-', 'eaCEAECa', 'aCFAFCaf', 'gbDGbDGD', 'C-E-G---']],   // gökkuşağı kemeri gibi çıkıp inen arp
    dino: ['CFCGCFGC', ['c-c-e-g-', 'f-f-a-C-', 'e-e-g-C-', 'd-g-b-D-', 'C-g-e-c-', 'a-f-a-C-', 'b-g-b-D-', 'C-..C---']],        // koca adımlar: ağır, tekrar eden vuruşlar
    sehir: ['GCGCFCDG', ['D-b-g-b-', 'C-g-e-g-', 'D-D-b-g-', 'E-C-g---', 'a-C-F-C-', 'g-C-E-C-', 'f-a-D-a-', 'g-b-D-..']]        // bando: borazan çağrısı gibi akor sesleri
  };
  const SES_BPM = { orman: 120, kiyi: 126, kar: 108, seker: 138, uzay: 100, col: 114, gokkusagi: 146, dino: 104, sehir: 118 };
  const SES_Z = { seker: 1.4, uzay: 0.8, col: 1.08, gokkusagi: 0.95, dino: 1.15, sehir: 1, orman: 1, kiyi: 1, kar: 1 };   // pistler arası düzey dengesi
  const sesModlar = tema => {
    const b = SES_BPM[tema] || 120, z = SES_Z[tema] || 1;
    return {
      baslik: { bpm: 96, sakin: true, tr: 0, guc: 0.6 * (1 + (z - 1) * 0.5), tema },
      sonuc: { bpm: 100, sakin: true, tr: 0, guc: 0.5 * (1 + (z - 1) * 0.5), tema },
      yaris: { bpm: b, tr: 0, guc: 0.62 * z, tema },
      son: { bpm: b + 12, tr: 2, guc: 0.66 * z, son: true, tema }
    };
  };
  const MOD = sesModlar(sesTema);
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
    os.connect(k); k.connect(hedef); os.start(t); os.stop(son); os.onended = () => { os.disconnect(); k.disconnect(); };
    return os;
  }
  // süzülmüş gürültü. o: tip (süzgeç), f, f2, q, guc, at
  function his(g, hedef, t, sure, o) {
    const c = g.ctx, kay = c.createBufferSource(), suz = c.createBiquadFilter(), k = c.createGain(), at = o.at || 0.004;
    kay.buffer = g.gurultu; kay.loop = true;
    suz.type = o.tip || 'highpass'; suz.frequency.setValueAtTime(o.f, t); if (o.f2) suz.frequency.exponentialRampToValueAtTime(o.f2, t + sure); suz.Q.value = o.q || 0.7;
    k.gain.setValueAtTime(0, t); k.gain.linearRampToValueAtTime(o.guc, t + at); k.gain.setTargetAtTime(0, t + at, sure / 4);
    kay.connect(suz); suz.connect(k); k.connect(hedef); kay.start(t, (t * 0.37) % 0.9); kay.stop(t + at + sure * 1.5 + 0.05); kay.onended = () => { kay.disconnect(); suz.disconnect(); k.disconnect(); };
  }
  const davul = (g, t, guc) => ton(g, g.muzik, t, 150, 0.16, { f2: 50, kay: 0.09, guc });
  const trampet = (g, t, guc) => { his(g, g.muzik, t, 0.1, { tip: 'bandpass', f: 1900, q: 0.8, guc }); ton(g, g.muzik, t, 200, 0.06, { tip: 'triangle', guc: guc * 0.5 }); };
  const zil = (g, t, guc) => his(g, g.muzik, t, 0.035, { f: 7000, guc });
  const cingirak = (g, hedef, t, guc) => { his(g, hedef, t, 0.05, { tip: 'bandpass', f: 8200, q: 2.5, guc }); ton(g, hedef, t, 4400, 0.05, { guc: guc * 0.3, at: 0.002 }); };

  // müziğin bir on altılık adımı: n = döngüdeki adım (0..511), t = çalma anı, sd = adım süresi
  function adim(g, m, n, t, sd) {
    const olcu = (n >> 4) % MEL.length, s = n & 15, tr = m.tr, bolumB = olcu >= 16 && olcu < 24;
    if (m.tema === 'dino' && !m.sakin && (s & 1)) t += sd * 0.3;             // dinozor: sallanarak yürüyen ritim
    const ozelB = bolumB && SES_B[m.tema], ak = AKOR[ozelB ? ozelB[0][olcu - 16] : DIZI[olcu]];
    if (!(s & 1)) {                                                         // ezgi
      const satir = ozelB ? ozelB[1][olcu - 16] : MEL[olcu], i = s >> 1, no = NOTA[satir[i]];
      if (no) {
        let u = 1; while (i + u < 8 && satir[i + u] === '-') u++;
        const f = mf(no + tr), sure = u * 2 * sd;
        if (m.sakin && m.tema === 'orman') { ton(g, g.ezgi, t, f, sure, { guc: 0.15, tut: 0.55, at: 0.012 }); ton(g, g.ezgi, t, f * 2, sure * 0.6, { guc: 0.03 }); }
        else if (m.tema === 'kiyi') { // Aynı tanıdık ezgi, plajda sıcak çelik davul tınısı.
          ton(g, g.ezgi, t, f, sure * .8, { guc: .17, tut: .25, at: .004 });
          ton(g, g.ezgi, t, f * 2, sure * .47, { guc: .075 }); ton(g, g.ezgi, t, f * 3, sure * .26, { guc: .02 }); ton(g, g.ezgi, t, f * 4.02, sure * .16, { guc: .014, at: .003 });
        } else if (m.tema === 'kar') { // Karda kısa kristal/celesta vuruşları; sert tizler yerine yumuşak çınlama.
          ton(g, g.ezgi, t, f * 2, sure * .9, { guc: .1, at: .006 }); ton(g, g.ezgi, t, f, sure * .9, { guc: .075, at: .01 });   // bir sekizli yukarıda çan
          ton(g, g.ezgi, t, f * 4, sure * .3, { guc: .012, at: .004 });
        } else if (m.tema === 'seker') { // Müzik kutusu: kısa, parlak çınlama; üstünde minik çan.
          ton(g, g.ezgi, t, f, Math.min(sure, .34), { guc: .13, at: .003 });
          ton(g, g.ezgi, t, f * 2, .16, { guc: .06, at: .003 }); ton(g, g.ezgi, t, f * 4, .07, { guc: .02, at: .002 });
        } else if (m.tema === 'uzay') { // Yumuşak sentezleyici: bir sekizli aşağıda, yavaş giriş, hafif akortsuz çift dalga, bol yankı.
          ton(g, g.ezgi, t, f * .5, sure, { guc: .13, tut: .85, at: .05 }); ton(g, g.ezgi, t, f * .5025, sure, { tip: 'triangle', guc: .05, tut: .85, at: .07 });
          ton(g, g.ezgi, t, f, sure, { guc: .03, tut: .6, at: .05 }); ton(g, g.yanki, t, f * .5, sure, { guc: .09, tut: .8, at: .05 });
        } else if (m.tema === 'col') { // Sıcak, kamış benzeri ses: bir sekizli aşağıda.
          ton(g, g.ezgi, t, f * .5, sure * .9, { tip: 'triangle', guc: .15, tut: .7, at: .014 });
          ton(g, g.ezgi, t, f * .5, sure * .9, { tip: 'square', guc: .03, tut: .6, at: .02 }); ton(g, g.ezgi, t, f * 1.5, sure * .5, { guc: .018, at: .014 });
        } else if (m.tema === 'gokkusagi') { // Flüt: yumuşak giriş, hafif titreyen çift ses, minik nefes.
          ton(g, g.ezgi, t, f, sure * .95, { guc: .13, tut: .8, at: .03 }); ton(g, g.ezgi, t, f * 1.006, sure * .95, { guc: .045, tut: .8, at: .04 });
          ton(g, g.ezgi, t, f * 2, sure * .6, { guc: .022, at: .03 }); his(g, g.ezgi, t, Math.min(sure, .12), { tip: 'bandpass', f: f * 2, q: 3, guc: .02, at: .015 });
        } else if (m.tema === 'dino') { // Tahta marimba: bir sekizli aşağıda, tok ve kısa.
          ton(g, g.ezgi, t, f * .5, Math.min(sure, .3), { guc: .2, at: .003 }); ton(g, g.ezgi, t, f * 2, .05, { guc: .05, at: .002 });
        } else if (m.tema === 'sehir') { // Oyuncak korna/borazan: kısa, nefesli, kesik kesik.
          ton(g, g.ezgi, t, f, sure * .62, { tip: 'square', guc: .055, tut: .9, at: .012 }); ton(g, g.ezgi, t, f, sure * .62, { tip: 'triangle', guc: .09, tut: .9, at: .012 });
          ton(g, g.ezgi, t, f * .5, sure * .62, { tip: 'triangle', guc: .05, tut: .9, at: .012 });
        } else { // Orman: sıcak tahta flüt (altında bir sekizli aşağı gölge)
          ton(g, g.ezgi, t, f, sure * 0.92, { tip: 'triangle', guc: 0.17, tut: 0.6 }); ton(g, g.ezgi, t, f * 2, sure * 0.7, { guc: m.son ? 0.06 : 0.035 });
          ton(g, g.ezgi, t, f * .5, sure * .8, { guc: .1, tut: .6 }); ton(g, g.ezgi, t, f * 3, sure * .3, { guc: .012 });
        }
      }
    }
    if (m.sakin) {
      if (s === 0) for (const a of ak[1]) ton(g, g.muzik, t, mf(a + tr), 15 * sd, { guc: 0.035, tut: 1, at: 0.18 });   // yumuşak akor
      if (!(s & 1)) ton(g, g.muzik, t, mf(ak[1][[0, 1, 2, 1][(s >> 1) & 3]] + 12 + tr), 2 * sd, { tip: 'triangle', guc: 0.04 });
      if (s === 0 || s === 8) ton(g, g.muzik, t, mf(ak[0] + (s ? 7 : 0) + tr), 6 * sd, { tip: 'triangle', guc: 0.13, tut: 0.5, at: 0.015 });
      if (s === 4 || s === 12) zil(g, t, 0.022);
      const tm = m.tema;                                                    // sakin kiplerde de pistin küçük imzası
      if (tm === 'gokkusagi') { const ar = [0, 1, 2, 3, 4, 5, 4, 3, 2, 3, 4, 5, 4, 3, 2, 1][s]; ton(g, g.muzik, t, mf(ak[1][ar % 3] + 12 * (ar / 3 | 0) + 12 + tr), .2, { tip: 'triangle', guc: .05, at: .003 }); }
      else if (tm === 'kar') { if (!(s & 3)) his(g, g.muzik, t, .06, { tip: 'bandpass', f: 7400, q: 4, guc: .022 }); }
      else if (tm === 'kiyi') { if (s === 3 || s === 6 || s === 11 || s === 14) { const f = (s === 6 || s === 14) ? 392 : 294; ton(g, g.muzik, t, f, .08, { f2: f * .82, kay: .06, guc: .05, at: .003 }); } }
      else if (tm === 'dino') { if (s === 0 || s === 8) ton(g, g.muzik, t, 105, .2, { f2: 44, kay: .11, guc: .17 }); if (s === 6 || s === 14) ton(g, g.muzik, t, 940, .028, { guc: .04, at: .0015 }); }
      else if (tm === 'sehir') { if (!(olcu & 1) && (s === 0 || s === 3)) ton(g, g.yanki, t, 2637, .3, { guc: .028, at: .002 }); if (s === 12 || s === 14) trampet(g, t, .028); }
      else if (tm === 'seker') { if ((s & 3) === 2) cingirak(g, g.muzik, t, .014); }
      else if (tm === 'uzay') { if (s === 6 || s === 14) ton(g, g.yanki, t, mf(ak[1][s === 6 ? 2 : 0] + 24 + tr), 1.5 * sd, { guc: .035 }); }
      else if (tm === 'col') { if (s === 0) ton(g, g.muzik, t, 135, .14, { f2: 68, kay: .07, guc: .13 }); if ((s & 3) === 3) his(g, g.muzik, t, .03, { tip: 'bandpass', f: 6800, q: 3, guc: .016 }); }
      return;
    }
    if (m.tema === 'seker') {                                               // "um-pa" eşlik; davul yerine tahta tık ve çıngırak
      if (!(s & 3)) ton(g, g.muzik, t, mf(ak[0] + ((s & 4) ? 7 : 0) + 12 + tr), 1.4 * sd, { guc: .17, at: .004 });
      if ((s & 3) === 2) for (const a of ak[1]) ton(g, g.muzik, t, mf(a + 12 + tr), 1.1 * sd, { guc: .034, at: .003 });
      if (s === 0 || s === 8) ton(g, g.muzik, t, 190, .07, { f2: 90, kay: .05, guc: .15 });
      if (s === 4 || s === 12) ton(g, g.muzik, t, 1050, .035, { guc: .07, at: .002 });
      if (s === 6 || s === 14) ton(g, g.muzik, t, 790, .03, { guc: .045, at: .002 });
      if ((s & 3) === 2 || (m.son && (s & 1))) cingirak(g, g.muzik, t, (s & 1) ? .016 : .032);
      if ((olcu & 7) === 7 && s >= 12) ton(g, g.ezgi, t, mf([84, 88, 91, 96][s - 12] + tr), .2, { guc: .05 });   // bölüm sonu: minik çan merdiveni
      return;
    }
    if (m.tema === 'uzay') {                                                // uzun akor yastığı, sakin bas, yankılı pırıltılar; trampet yok
      if (s === 0) {
        for (const a of ak[1]) { ton(g, g.muzik, t, mf(a + tr), 15 * sd, { guc: .04, tut: 1, at: .25 }); ton(g, g.muzik, t, mf(a + tr) * 1.004, 15 * sd, { tip: 'triangle', guc: .013, tut: 1, at: .3 }); }
        ton(g, g.muzik, t, mf(ak[0] + tr), 7 * sd, { guc: .2, tut: .8, at: .03 });
      }
      if (s === 8) ton(g, g.muzik, t, mf(ak[0] + 7 + tr), 6 * sd, { guc: .15, tut: .8, at: .03 });
      if (!(s & 1)) { const f = mf(ak[1][[0, 2, 1, 2, 0, 1, 2, 1][s >> 1]] + 24 + tr); ton(g, g.yanki, t, f, 1.5 * sd, { guc: .05 }); ton(g, g.muzik, t, f, 1.5 * sd, { guc: .02 }); }
      if (s === 0 || s === 8 || (m.son && (s === 4 || s === 12))) ton(g, g.muzik, t, 110, .2, { f2: 48, kay: .12, guc: .2 });
      if (s === 4 || s === 12) his(g, g.muzik, t, .22, { tip: 'bandpass', f: 1200, f2: 2600, q: 1.2, guc: .035, at: .05 });
      if ((s & 3) === 2 || (m.son && !(s & 1))) zil(g, t, .012);
      return;
    }
    if (m.tema === 'col') {                                                 // darbuka (düm tek . tek düm . tek .) + tef pulları + tıngırtı
      const dum = s === 0 || s === 8 || (m.son && s === 10), tek = s === 2 || s === 6 || s === 12 || ((olcu & 1) && s === 14) || ((olcu & 7) === 7 && s > 12);
      if (dum) { ton(g, g.muzik, t, 135, .14, { f2: 68, kay: .07, guc: .3 }); his(g, g.muzik, t, .05, { tip: 'lowpass', f: 420, guc: .07 }); }
      if (tek) { his(g, g.muzik, t, .045, { tip: 'bandpass', f: 2600, q: 2.2, guc: .15 }); ton(g, g.muzik, t, 560, .03, { tip: 'triangle', guc: .06, at: .002 }); }
      if (s === 3 || s === 11) his(g, g.muzik, t, .03, { tip: 'bandpass', f: 3400, q: 2, guc: .05 });
      if (s & 1) his(g, g.muzik, t, .03, { tip: 'bandpass', f: 6800, q: 3, guc: (s & 3) === 3 ? .034 : .02 });
      if (s === 4 || s === 12) his(g, g.muzik, t, .07, { tip: 'bandpass', f: 6800, q: 3, guc: .045 });
      if (s === 0 || s === 8) ton(g, g.muzik, t, mf(ak[0] + (s ? 7 : 0) + tr), 2.5 * sd, { tip: 'triangle', guc: .2, tut: .6 });
      if (s === 6) ton(g, g.muzik, t, mf(ak[0] + tr), 1.5 * sd, { tip: 'triangle', guc: .14, tut: .6 });
      if (s === 4 || s === 10 || s === 12) ak[1].forEach((a, i) => { ton(g, g.muzik, t + i * .018, mf(a + tr), .2, { tip: 'triangle', guc: .045, at: .003 }); ton(g, g.muzik, t + i * .018, mf(a + tr), .12, { tip: 'sawtooth', guc: .014, at: .003 }); });
      return;
    }
    if (m.tema === 'gokkusagi') {                                           // arp: on altılık akor merdiveni çıkar iner; davul neredeyse yok
      const ar = [0, 1, 2, 3, 4, 5, 4, 3, 2, 3, 4, 5, 4, 3, 2, 1][s], no = ak[1][ar % 3] + 12 * (ar / 3 | 0) + tr;
      ton(g, g.muzik, t, mf(no), .22, { tip: 'triangle', guc: (s & 3) ? .05 : .075, at: .003 }); ton(g, g.yanki, t, mf(no + 12), .12, { guc: .014, at: .003 });
      if (s === 0) ton(g, g.muzik, t, mf(ak[0] + tr), 7 * sd, { guc: .16, tut: .7, at: .02 });
      if (s === 8) ton(g, g.muzik, t, mf(ak[0] + 19 + tr), 6 * sd, { guc: .11, tut: .7, at: .02 });
      if ((s & 3) === 2) his(g, g.muzik, t, .05, { tip: 'bandpass', f: 5200, q: 1.5, guc: .022, at: .008 });   // yumuşak sallama
      if (m.son && !(s & 3)) ton(g, g.muzik, t, 170, .08, { f2: 80, kay: .05, guc: .12 });
      if (s === 12 && (olcu & 1)) { ton(g, g.yanki, t, 3136, .5, { guc: .035, at: .002 }); ton(g, g.muzik, t, 3136, .3, { guc: .02, at: .002 }); }   // üçgen zil
      if ((olcu & 7) === 7 && s >= 8 && !(s & 1)) { const i = (s - 8) >> 1; ton(g, g.ezgi, t, mf(ak[1][i % 3] + 24 + 12 * (i / 3 | 0) + tr), .3, { guc: .04 }); }   // bölüm sonu: yukarı süzülüş
      return;
    }
    if (m.tema === 'dino') {                                                // koca adımlar: tok davul + kalın bas + tahta blok (zil yok)
      if (s === 0 || s === 8) {
        ton(g, g.muzik, t, 105, .2, { f2: 44, kay: .11, guc: .34 }); his(g, g.muzik, t, .09, { tip: 'lowpass', f: 300, guc: .12 });
        const f = mf(ak[0] + (s ? 7 : 0) + tr); ton(g, g.muzik, t, f, 3 * sd, { tip: 'triangle', guc: .2, tut: .7, at: .012 }); ton(g, g.muzik, t, f, 3 * sd, { tip: 'sawtooth', guc: .02, tut: .6, at: .02 });
      }
      if (s === 4 || s === 12) { for (const a of ak[1]) ton(g, g.muzik, t, mf(a + tr), 1.2 * sd, { tip: 'triangle', guc: .045, tut: .6 }); ton(g, g.muzik, t, 210, .09, { f2: 130, kay: .06, guc: .15 }); }
      if (s === 14 || (s === 15 && (olcu & 1)) || (m.son && s === 6)) ton(g, g.muzik, t, s === 15 ? 150 : 170, .09, { f2: 95, kay: .06, guc: .14 });   // küçük adımlar
      if (s === 2 || s === 3 || s === 6 || s === 10 || s === 11) { const f = (s === 3 || s === 11) ? 1250 : 940; ton(g, g.muzik, t, f, .028, { guc: .075, at: .0015 }); ton(g, g.muzik, t, f * 2.7, .012, { guc: .02, at: .001 }); }   // tahta blok
      if ((s & 3) === 2) his(g, g.muzik, t, .05, { tip: 'bandpass', f: 2400, q: 1.2, guc: .02 });   // marakas
      if ((olcu & 7) === 7 && s >= 8 && !(s & 1)) ton(g, g.muzik, t, [230, 190, 150, 115][(s - 8) >> 1], .12, { f2: 70, kay: .09, guc: .2 });   // bölüm sonu: inen tomlar
      return;
    }
    if (m.tema === 'sehir') {                                               // oyuncak bando: um-pa yürüyüşü, trampet, bisiklet zili, ara sıra korna
      if (s === 0 || s === 8) { const f = mf(ak[0] + (s ? 7 : 0) + tr); ton(g, g.muzik, t, f, 2.2 * sd, { tip: 'triangle', guc: .2, tut: .7 }); ton(g, g.muzik, t, f, 2.2 * sd, { tip: 'square', guc: .022, tut: .7, at: .012 }); davul(g, t, .24); }
      if (s === 4 || s === 12) { for (const a of ak[1]) { ton(g, g.muzik, t, mf(a + tr), 1.3 * sd, { tip: 'triangle', guc: .05, tut: .8 }); ton(g, g.muzik, t, mf(a + tr), 1.3 * sd, { tip: 'square', guc: .009, tut: .8, at: .01 }); } trampet(g, t, .085); }
      if (s === 10 || s === 14 || s === 15 || (m.son && s === 6) || ((olcu & 7) === 7 && s > 8)) trampet(g, t, s === 15 ? .035 : .045);   // yürüyüş trampeti
      if (!(s & 1)) zil(g, t, (s & 3) === 2 ? .03 : .016);
      if (!(olcu & 3) && (s === 0 || s === 3)) { ton(g, g.yanki, t, 2637, .35, { guc: .04, at: .002 }); ton(g, g.muzik, t, 2637, .25, { guc: .03, at: .002 }); ton(g, g.muzik, t, 3951, .12, { guc: .012, at: .002 }); }   // bisiklet zili: çın çın
      if ((olcu & 7) === 3 && (s === 12 || s === 14)) for (const f of [392, 494]) ton(g, g.muzik, t, f * (tr ? 1.1225 : 1), 1.3 * sd, { tip: 'square', guc: .03, tut: .9, at: .01 });   // oyuncak korna
      return;
    }
    if (m.tema === 'kiyi') { if (s === 0 || s === 6 || s === 12) { ton(g, g.muzik, t, mf(ak[0] + (s === 6 ? 19 : 12) + tr), 3 * sd, { guc: 0.2, tut: 0.6 }); if (!s) ton(g, g.muzik, t, mf(ak[0] + tr), 3 * sd, { tip: 'triangle', guc: 0.07, tut: 0.6 }); } }   // sahilde 3-3-2 kayık bas: bir sekizli yukarıda, yuvarlak
    else if (!(s & 3)) ton(g, g.muzik, t, mf(ak[0] + ((s & 4) ? 7 : 0) + tr), 3 * sd, { tip: m.tema === 'kar' ? 'sine' : 'triangle', guc: m.tema === 'kar' ? .17 : 0.2, tut: 0.6 });   // zıplayan bas
    else if (s === 14) ton(g, g.muzik, t, mf(ak[0] + tr), 1.6 * sd, { tip: 'triangle', guc: 0.15, tut: 0.6 });
    if (bolumB) { if (!(s & 1)) ton(g, g.muzik, t, mf(ak[1][[0, 1, 2, 1][(s >> 1) & 3]] + 12 + tr), 2 * sd, { tip: 'triangle', guc: 0.05 }); }
    else if (m.tema === 'kar') { if (s === 0) for (const a of ak[1]) ton(g, g.muzik, t, mf(a + 12 + tr), 15 * sd, { guc: 0.026, tut: 1, at: 0.16 }); }   // karda uzun, yumuşak akor
    else if ((s & 3) === 2) for (const a of ak[1]) {                        // ara vuruş akorları: sahilde bir sekizli yukarıda parlak, ormanda telli tıngırtı
      if (m.tema === 'kiyi') ton(g, g.muzik, t, mf(a + 12 + tr), 1.3 * sd, { guc: .06, at: .004 });
      else { ton(g, g.muzik, t, mf(a + tr), 1.6 * sd, { tip: 'triangle', guc: 0.05 }); if (m.tema === 'orman') ton(g, g.muzik, t, mf(a - 12 + tr), .14, { tip: 'sawtooth', guc: .016, at: .003 }); }
    }
    const ritimGuc = m.tema === 'kar' ? .58 : m.tema === 'kiyi' ? .7 : 1;
    if (s === 0 || s === 8 || (m.son && (s === 4 || s === 12)) || (s === 10 && (olcu & 1) && m.tema !== 'kar')) { if (m.tema === 'kiyi') ton(g, g.muzik, t, 205, .12, { f2: 140, kay: .08, guc: .2 }); else davul(g, t, 0.3 * ritimGuc); }   // sahilde kalın davul yerine konga
    if (s === 4 || s === 12) { if (m.tema === 'kar') his(g, g.muzik, t, 0.12, { tip: 'bandpass', f: 4600, q: 0.5, guc: 0.03, at: 0.02 }); else trampet(g, t, 0.1 * ritimGuc); }   // karda fırça
    if ((olcu & 7) === 7 && s > 12) trampet(g, t, 0.05 + (s - 12) * 0.015);   // bölüm sonu küçük geçiş
    if (m.tema !== 'kar') { if (!(s & 1)) zil(g, t, ((s & 3) === 2 ? 0.045 : 0.025) * (m.tema === 'orman' ? .55 : ritimGuc)); else if (m.son) zil(g, t, 0.018 * ritimGuc); }   // karda zil yok: yalnız kızak çıngırağı
    if (m.tema === 'kiyi' && (s & 1) && !m.son) his(g, g.muzik, t, .04, { tip: 'bandpass', f: 3800, q: .65, guc: .034 });
    if (m.tema === 'kiyi' && (s === 3 || s === 6 || s === 11 || s === 14)) { const f = (s === 6 || s === 14) ? 392 : 294; ton(g, g.muzik, t, f, .08, { f2: f * .82, kay: .06, guc: .1, at: .003 }); }   // el davulu
    if (m.tema === 'kar' && !(s & 3)) his(g, g.muzik, t, .06, { tip: 'bandpass', f: 7400, q: 4, guc: .03 });              // kızak çıngırağı
    if (m.tema === 'orman' && (s === 6 || s === 14)) ton(g, g.muzik, t, s === 6 ? 880 : 660, .035, { guc: .05, at: .002 });   // tahta tık
  }

  // ---------- Efektler: E.ad(grafik, an, ...) ----------
  const YILDIZ = [84, 86, 88, 91, 93, 96];
  const E = {
    yildiz(g, t, k, tm) {                                                       // tatlı çıngırak; k = art arda kaçıncı (0..5)
      const a = YILDIZ[Math.min(5, k || 0)], f = mf(a), z = 1 - 0.07 * (k || 0);
      ton(g, g.can, t, f, 0.28, { guc: 0.2 * z }); ton(g, g.can, t, f * 2, 0.16, { guc: 0.05 * z });
      ton(g, g.can, t + 0.075, mf(a + 7), 0.4, { guc: 0.17 * z }); ton(g, g.can, t + 0.075, mf(a + 19), 0.2, { guc: 0.03 * z });
      tm = tm || sesTema;
      if (tm === 'seker') cingirak(g, g.can, t + 0.03, 0.03 * z);                                    // şekerde çıngıraklı
      else if (tm === 'uzay') ton(g, g.yanki, t + 0.16, mf(a + 12), 0.5, { guc: 0.07 * z });         // uzayda yankılı kuyruk
    },
    roket(g, t) {
      his(g, g.efekt, t, 0.75, { tip: 'bandpass', f: 320, f2: 2800, q: 1.3, guc: 0.3, at: 0.22 });
      ton(g, g.efekt, t, 190, 0.6, { f2: 760, kay: 0.55, guc: 0.09, at: 0.15, tut: 0.8 });
    },
    hop(g, t, tm) {
      tm = tm || sesTema;
      if (tm === 'uzay') {                                                  // süzülen: yavaşça yükselir, yankıda asılı kalır
        const u = ton(g, g.can, t, 170, 0.62, { f2: 520, kay: 0.34, guc: 0.15, tut: 0.75, at: 0.04 }); u.frequency.exponentialRampToValueAtTime(390, t + 0.7);
        ton(g, g.can, t + 0.1, 1040, 0.5, { f2: 1320, kay: 0.4, guc: 0.03, at: 0.08 });
        return;
      }
      const z = tm === 'kar' ? 0.7 : 1;                                     // karda yumuşak
      const o = ton(g, g.efekt, t, 210, 0.36, { f2: 640, kay: 0.13, guc: 0.2 * z, tut: 0.7 }); o.frequency.exponentialRampToValueAtTime(400, t + 0.38);
      ton(g, g.efekt, t, 105, 0.2, { tip: 'triangle', f2: 320, kay: 0.13, guc: 0.08 * z });
      if (tm === 'kar') his(g, g.efekt, t, 0.18, { tip: 'lowpass', f: 900, f2: 300, guc: 0.06, at: 0.02 });
      else if (tm === 'seker') [91, 96, 100].forEach((a, i) => ton(g, g.can, t + 0.05 + i * 0.05, mf(a), 0.16, { guc: 0.05 }));   // şekerde minik çanlar
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
    seri(g, t) { // Üç yıldız ödülü: kısa, yumuşak bir yükselen akor; konuşma eklenmez.
      [79, 84, 88, 91].forEach((n, i) => ton(g, g.can, t + i * .065, mf(n), .24 + i * .025, { guc: .11, tip: 'triangle' }));
      ton(g, g.can, t + .2, mf(96), .38, { guc: .045 });
    },
    inis(g, t, tm) { tm = tm || sesTema; const z = tm === 'uzay' ? .5 : tm === 'kar' ? .65 : 1; ton(g, g.efekt, t, 110, .13, { f2: 48, kay: .09, guc: .16 * z }); his(g, g.efekt, t, .11, { tip: 'lowpass', f: 700, f2: 250, guc: .07 * z }); },
    secim(g, t, tm) {                                                       // araba seçildi: kısa neşeli yükseliş
      [84, 88, 91, 96].forEach((a, i) => ton(g, g.can, t + i * .055, mf(a), i === 3 ? .3 : .15, { tip: 'triangle', guc: .12 }));
      ton(g, g.can, t + .165, mf(108), .22, { guc: .035 });
      if ((tm || sesTema) === 'seker') cingirak(g, g.can, t + .165, .028);
    },
    inisRakip(g, t) { ton(g, g.efekt, t, 100, .09, { f2: 52, kay: .07, guc: .045 }); },   // rakip inişi: çok kısık tok
    lider(g, t) {                                                           // Feza öne geçti: parlak iki nota
      [[0, 91], [.1, 96]].forEach(n => { ton(g, g.can, t + n[0], mf(n[1]), n[0] ? .34 : .16, { tip: 'triangle', guc: .11 }); ton(g, g.can, t + n[0], mf(n[1] + 12), .2, { guc: .035 }); });
    },
    araba(g, t, id) {                                                       // her arabanın kısa, yumuşak kendi sesi (< 0,8 sn)
      const korna = (an, fa, fb, sure, guc) => [fa, fb].forEach(f => { ton(g, g.efekt, an, f, sure, { tip: 'triangle', guc, tut: .9, at: .012 }); ton(g, g.efekt, an, f, sure, { tip: 'square', guc: guc * .16, tut: .9, at: .015 }); });
      if (id === 'itfaiye') [0, 1, 2, 3].forEach(i => ton(g, g.efekt, t + i * .16, i & 1 ? 880 : 660, .13, { guc: .1, tut: .9, at: .03 }));   // iki notalı yumuşak siren
      else if (id === 'dondurma') [88, 84, 91, 88, 96].forEach((a, i) => { ton(g, g.can, t + i * .075, mf(a), .16, { guc: .09, at: .003 }); ton(g, g.can, t + i * .075, mf(a + 12), .08, { guc: .03, at: .003 }); });   // müzik kutusu
      else if (id === 'roket') { his(g, g.efekt, t, .5, { tip: 'bandpass', f: 380, f2: 3000, q: 1.4, guc: .16, at: .16 }); ton(g, g.efekt, t, 220, .42, { f2: 900, kay: .42, guc: .05, at: .12, tut: .8 }); }   // vuuş
      else if (id === 'unicorn') { [96, 103, 100, 108, 105, 112].forEach((a, i) => ton(g, g.can, t + i * .06, mf(a), .22, { guc: .06, at: .002 })); cingirak(g, g.can, t + .1, .022); cingirak(g, g.can, t + .3, .016); }   // pırıltı
      else if (id === 'cip') { korna(t, 196, 247, .13, .11); korna(t + .2, 196, 247, .2, .11); }   // tok korna
      else if (id === 'ejderha') { his(g, g.efekt, t, .5, { tip: 'bandpass', f: 500, f2: 1900, q: 1.1, guc: .13, at: .2 }); ton(g, g.efekt, t, 233, .45, { f2: 466, kay: .45, guc: .05, at: .15, tut: .8 }); }   // yumuşak yükselen üfleme
      else if (id === 'ucak') { ton(g, g.efekt, t, 128, .5, { tip: 'triangle', f2: 190, kay: .5, guc: .11, at: .08, tut: .9 }); ton(g, g.efekt, t, 141, .5, { tip: 'triangle', f2: 209, kay: .5, guc: .09, at: .08, tut: .9 }); his(g, g.efekt, t, .4, { tip: 'lowpass', f: 600, f2: 1100, guc: .035, at: .15 }); }   // pervane vınlaması
      else if (id === 'yaris') { korna(t, 523, 659, .07, .085); korna(t + .13, 523, 659, .15, .085); }   // bi-bip
      else if (id === 'kart') korna(t, 440, 554, .2, .09);   // kısa korna
    },
    kart(g, t) { ton(g, g.efekt, t, 660, .05, { guc: .13 }); ton(g, g.efekt, t + .045, 990, .07, { guc: .1 }); },   // pist kartı: iki sesli düğme tıkı
    gecis(g, t) { [79, 84].forEach((n, i) => ton(g, g.can, t + i * .085, mf(n), .19, { guc: .075 })); },
    tik(g, t) { ton(g, g.efekt, t, 1100, 0.045, { f2: 780, guc: 0.12 }); }
  };

  // ---------- Canlı çalma ----------
  let mod = null, bekleyen = null, adimNo = 0, sonraki = 0, kisik = false, sonDurum = 'baslik', sonucZ = 0, roketSon = -1, yildizK = 0, yildizT = -9, oncekiSira = 0, gecisT = -9, liderT = -9, rakipInisT = -9;
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
    if (d === 'baslik' || d === 'giris' || d === 'sayim') sus();
    if (d === 'giris' || d === 'sayim') { yildizK = 0; yildizT = -9; oncekiSira = 0; gecisT = -9; liderT = -9; roketSon = -1; }
    if (d === 'baslik' || d === 'giris') muzikMod('baslik');
    else if (d === 'yaris') muzikMod('yaris');
    else { muzikMod(null); if (d === 'bitis') sonucZ = setTimeout(() => { if (sonDurum === 'bitis') muzikMod('sonuc'); }, 3300); }
  }
  function uyandir() { if (ac && !mola && !document.hidden && ac.state !== 'running') { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); } }
  function anlatimBeklet() {
    if (konusuyor()) devamKayit = simdi;
    if (simdi) { try { simdi.pause(); } catch (_) {} }
    kisAyar();
  }
  function anlatimSurdur() {
    if (mola || document.hidden || !devamKayit) return;
    const a = devamKayit; devamKayit = null;
    if (a !== simdi || a.ended) return;
    try { const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (_) {}
    kisAyar();
  }

  function hazirla() {
    if (sessiz) return;
    // Tek anlatım oynatıcısı ilk dokunuşta açılır; sonraki cümleler aynı oynatıcıyı kullanır.
    // Safari'de her cümle için ayrı bir medya öğesini yeniden açma ihtiyacı kalmaz.
    if (!oynatici) {
      for (const k in CUMLE) kayit[k] = 'sesler/' + k + '.mp3';
      sesKaynak = kayit.giris; oynatici = new Audio(sesKaynak); oynatici.preload = 'auto';
    }
    if (ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      G = kur(ac, true);
      uyandir();
      setInterval(zamanla, 50);
      if (typeof OLAY !== 'undefined') {
        OLAY.on('durum', durumDegisti);
        OLAY.on('tur', n => { if (n === (typeof TUR !== 'undefined' ? TUR : 3) - 1) muzikMod('son'); });
        OLAY.on('roket', sure => { roketSon = ac.currentTime + (sure > 0 ? sure : 1.5); });
        OLAY.on('seri', o => { if (o.odul && canli()) E.seri(G, ac.currentTime + .012); });
        OLAY.on('inis', o => {
          if (!canli()) return; const t = ac.currentTime;
          if (!o || o.i === 0) E.inis(G, t + .012); else if (t - rakipInisT > .2) { rakipInisT = t; E.inisRakip(G, t + .012); }
        });
        OLAY.on('araba', id => { if (canli()) { E.secim(G, ac.currentTime + .012); E.araba(G, ac.currentTime + .3, id); } });
        OLAY.on('lider', () => { if (canli() && sonDurum === 'yaris' && ac.currentTime - liderT > 4) { liderT = gecisT = ac.currentTime; E.lider(G, liderT + .1); } });
        OLAY.on('sira', n => {
          if (oncekiSira && n < oncekiSira && canli() && ac.currentTime - gecisT > 4) { E.gecis(G, ac.currentTime + .012); gecisT = ac.currentTime; }
          oncekiSira = n;
        });
      }
      muzikMod('baslik');
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { const p = ac.suspend(); if (p && p.catch) p.catch(() => {}); anlatimBeklet(); }
        else { uyandir(); anlatimSurdur(); }
      });
      document.addEventListener('click', e => { const b = e.target && e.target.closest && e.target.closest('button'); if (b && b.id !== 'hizlan') { if (b.classList.contains('pist-kart')) efekt.kart(); else efekt.tik(); } }, true);
    } catch (e) { ac = null; G = null; }
  }
  // iPad: ses ilk dokunuşta açılır; sonradan kesilirse (arama, kilit) bir sonraki dokunuşta geri gelir
  if (!sessiz) for (const ad of ['pointerup', 'touchend', 'click', 'keydown']) addEventListener(ad, () => { if (!ac) hazirla(); else uyandir(); }, true);

  function soyle(k) {
    if (sessiz || !kayit[k]) return;
    devamKayit = null;
    try {
      if (simdi) simdi.pause();
      simdi = oynatici;
      if (sesKaynak !== kayit[k]) { sesKaynak = kayit[k]; simdi.src = sesKaynak; }
      simdi.currentTime = 0;
      if (mola || document.hidden) devamKayit = simdi;
      else { const p = simdi.play(); if (p && p.catch) p.catch(() => {}); }
    } catch (e) { /* ses çalınamadı */ }
    kisAyar();
  }
  function konusuyor() { return !!(simdi && !simdi.paused && !simdi.ended); }
  function sus() { devamKayit = null; if (simdi) { try { simdi.pause(); } catch (e) { /* yok */ } } kisAyar(); }
  const cal = ad => function () { if (canli()) E[ad](G, ac.currentTime + 0.012); };
  const efekt = {
    yildiz() {                                                              // art arda toplandıkça perde yükselir
      if (!canli()) return;
      const t = ac.currentTime; yildizK = t - yildizT < 1.8 ? Math.min(5, yildizK + 1) : 0; yildizT = t;
      E.yildiz(G, t + 0.012, yildizK);
    },
    roket: cal('roket'), hop: cal('hop'), tok: cal('tok'), bip: cal('bip'), git: cal('git'), tur: cal('tur'), bitis: cal('bitis'), tik: cal('tik'), secim: cal('secim'), kart: cal('kart')
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
    if (d) anlatimBeklet(); else anlatimSurdur();
  }
  return { hazirla, soyle, sus, konusuyor, efekt, motorAyar, durdur, sessiz, CUMLE, _ic: { kur, adim, E, MOD, ADIM, MEL, DIZI, NOTA, SES_B, SES_BPM, SES_Z, SES_TEMALAR, sesModlar, tema: sesTema } };
})();
