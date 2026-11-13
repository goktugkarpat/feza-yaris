/* Ses: önceden kaydedilmiş Türkçe anlatım (sesler/*.mp3, tr-TR-EmelNeural) + kodla üretilen müzik, efektler ve motor sesi.
   ?sessiz ile her şey kapalı (AudioContext hiç kurulmaz). Cümle değişirse: python gen_voice.py
   Müzik: Do majör, 32 ölçülük A-A'-B-A'' döngüsü; ses saatine göre önceden planlanır (kare döngüsüne bağlı değil).
   Dokuz pistin her birinin temposu, çalgısı, vurmalı düzeni ve B bölümü ayrıdır (SES_BPM, SES_B, adim içindeki tema dalları).
   Kipler: baslik (sakin) · yaris (canlı) · son (son tur: daha hızlı, bir ton yukarı) · sonuc (bitişten sonra sakin). */
const SES = (() => {
  'use strict';
  const sessiz = new URLSearchParams(location.search).has('sessiz');
  const sesPist = new URLSearchParams(location.search).get('pist');
  const SES_TEMALAR = ['orman', 'kiyi', 'kar', 'seker', 'uzay', 'col', 'gokkusagi', 'dino', 'sehir', 'sato', 'lunapark', 'korsan', 'denizalti', 'ciftlik', 'muzik'];   // cekirdek.js'teki PIST_TEMALARI ile aynı adlar (ses.js ondan önce yüklenir)
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
    giris_sehir: 'Feza, şehir yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    /*YENI-GIRIS*/   // Şato ve Ejderha Vadisi, Gece Lunaparkı, Korsan Adası (aynı tanıdık kalıp)
    giris_sato: 'Feza, şato yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_lunapark: 'Feza, lunapark yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_korsan: 'Feza, korsan adası yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_denizalti: 'Feza, mercan sualtı yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_ciftlik: 'Feza, neşeli çiftlik yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    giris_muzik: 'Feza, müzik diyarı yarışı başlıyor! Parmağını sağa sola sürükle, araban oraya gitsin.',
    /*/YENI-GIRIS*/
    // seçim ekranı: kısa pist ve araba adları
    ad_orman: 'Orman Yolu!',
    ad_kiyi: 'Deniz Kıyısı!',
    ad_kar: 'Karlı Dağlar!',
    ad_seker: 'Şeker Diyarı!',
    ad_uzay: 'Ay Yolu!',
    ad_col: 'Sıcak Çöl!',
    ad_gokkusagi: 'Gökkuşağı Yolu!',
    ad_dino: 'Dinozor Vadisi!',
    ad_sehir: 'Neşeli Şehir!',
    /*YENI-AD*/ ad_sato: 'Şato ve Ejderha Vadisi!', ad_lunapark: 'Gece Lunaparkı!', ad_korsan: 'Korsan Adası!', ad_denizalti: 'Mercan Sualtı!', ad_ciftlik: 'Neşeli Çiftlik!', ad_muzik: 'Müzik Diyarı!', /*/YENI-AD*/
    araba_kart: 'Küçük kart arabası!',
    araba_yaris: 'Hızlı yarış arabası!',
    araba_cip: 'Koca tekerli cip!',
    araba_roket: 'Roket araba!',
    araba_dondurma: 'Dondurma arabası!',
    araba_unicorn: 'Yunikorn arabası!',
    araba_itfaiye: 'İtfaiye arabası!',
    araba_ejderha: 'Ejderha arabası!',
    araba_ucak: 'Uçan araba!',
    /*YENI-ARABA*/ araba_gemi: 'Korsan gemisi!', araba_polis: 'Polis arabası!', araba_kedi: 'Kedi araba!', araba_tren: 'Çufçuf tren!', araba_traktor: 'Neşeli traktör!', araba_ufo: 'Uçan daire!', /*/YENI-ARABA*/
    // çeşitlilik: aynı yerde sırayla farklı cümleler (soyle içindeki CESIT)
    yildiz2: 'Feza, parlak yıldızları topla!',
    ovgu4: 'Harikasın Feza!',
    ovgu5: 'Ne çok yıldız topladın Feza!',
    ovgu6: 'Çok güzel gidiyorsun Feza!',
    ovgu7: 'Vay, ne hızlısın!',
    hop2: 'Hop! Havada uçtun Feza!',
    hop3: 'Yukarı zıpladın!',
    sontur2: 'Son tura geldik! Haydi Feza, bitişe!',
    sontur3: 'Bu son tur Feza! Bitiş çok yakın!',
    tur1: 'Bir tur bitti! Devam Feza!',
    tur2: 'Süper bir tur! Haydi bir tur daha!',
    roket2: 'Roketle uçuyorsun Feza!',
    roket3: 'Vay, ne hızlı gittin!',
    bir2: 'Birinci oldun Feza! Altın kupa senin!',
    iki2: 'İkinci oldun Feza! Harika yarıştın.',
    uc2: 'Üçüncü oldun! Çok güzel yarıştın Feza.',
    tekrar2: 'Feza, yine yarışalım mı?',
    /*YENI-GARAJ*/   // garaj, yıldız kavanozu, hediye kutusu ve sürpriz balonlar
    garaj_gir: 'Burası senin garajın! Arabanı istediğin gibi süsle.',
    garaj_kilit: 'Bu süs hediye kutusunda. Yarışıp yıldız topla, kutu açılsın!',
    hediye_var: 'Yıldız kavanozun doldu! Hediye kutusuna dokun.',
    hediye_acildi: 'Yeni bir süs kazandın! Garajda arabana takabilirsin.',
    surpriz: 'Renkli balonların içinden geç, sürprizi gör!'
    /*/YENI-GARAJ*/
  };
  // Aynı anahtar istenince havuzdan, son çalınanlardan farklı biri seçilir (bıktırmasın).
  const CESIT = {
    yildiz: ['yildiz', 'yildiz2'], hop: ['hop', 'hop2', 'hop3'], sontur: ['sontur', 'sontur2', 'sontur3'],
    bir: ['bir', 'bir2'], iki: ['iki', 'iki2'], uc: ['uc', 'uc2'], tekrar: ['tekrar', 'tekrar2'],
    ovgu: ['ovgu1', 'ovgu2', 'ovgu3', 'ovgu4', 'ovgu5', 'ovgu6', 'ovgu7']
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
    sehir: ['GCGCFCDG', ['D-b-g-b-', 'C-g-e-g-', 'D-D-b-g-', 'E-C-g---', 'a-C-F-C-', 'g-C-E-C-', 'f-a-D-a-', 'g-b-D-..']],        // bando: borazan çağrısı gibi akor sesleri
    /*SES-SATO*/ sato: ['FCGCAFDG', ['a-C-F---', 'g-e-C---', 'g-b-D-b-', 'C-g-e---', 'C-a-e-a-', 'C-a-f-a-', 'D-a-f-a-', 'g-b-D---']], /*/SES-SATO*/   // masal alayı: borazan çağrısı gibi geniş, ağır adımlı ezgi
    /*SES-LUNAPARK*/ lunapark: ['CGCGFCGC', ['e-g-C-g-', 'f-g-a-b-', 'C-E-G-E-', 'D-C-b-g-', 'a-C-F-C-', 'e-g-C-E-', 'D-b-g-b-', 'C-G-C---']], /*/SES-LUNAPARK*/   // atlıkarınca: dönüp duran, çıkıp inen neşeli ezgi
    /*SES-KORSAN*/ korsan: ['ADCGADEG', ['a-aCE-C-', 'D-a-f-a-', 'e-g-C-g-', 'b-a-g-D-', 'C-a-e-a-', 'f-a-D-C-', 'b-g-e-g-', 'g-b-D---']], /*/SES-KORSAN*/   // denizci havası: sallanan, hafif hüzünlü değil neşeli dönüş
    denizalti: ['FCGAFCGC', ['e-g-C-g-', 'f-a-C-a-', 'g-b-D-b-', 'C-a-e---', 'f-a-C-a-', 'e-g-C-g-', 'd-g-b-g-', 'C-g-e---']],         // mercan sualtı: süzülen, köpüklü sualtı ezgisi
    ciftlik: ['CGFCGFCG', ['c-egC-g-', 'b-dgD-b-', 'a-cfC-a-', 'g-b-D-..', 'e-gCE-C-', 'd-gbD-b-', 'f-aCF-C-', 'g-b-C---']],           // neşeli çiftlik: zıplayan kır ezgisi
    muzik: ['CFCGFCGC', ['C-E-G-E-', 'F-C-a-C-', 'C-g-e-g-', 'D-b-g-b-', 'a-C-F-C-', 'C-g-E-C-', 'd-g-b-D-', 'C-E-G---']]               // müzik diyarı: parlak ksilofon ve üflemeli ezgi
  };
  const SES_BPM = { orman: 120, kiyi: 126, kar: 108, seker: 138, uzay: 100, col: 114, gokkusagi: 146, dino: 104, sehir: 118, /*SES-YENI*/ sato: 108, lunapark: 132, korsan: 116, /*/SES-YENI*/ denizalti: 112, ciftlik: 124, muzik: 130 };
  const SES_Z = { seker: 1.22, uzay: 0.7, col: 1.04, gokkusagi: 0.98, dino: 1.1, sehir: 0.98, orman: 0.94, kiyi: 1.02, kar: 1.04, /*SES-YENI*/ sato: 1, lunapark: 0.98, korsan: 1.04, /*/SES-YENI*/ denizalti: 1, ciftlik: 0.96, muzik: 0.96 };   // pistler arası düzey dengesi
  const sesModlar = tema => {
    const b = SES_BPM[tema] || 120, z = SES_Z[tema] || 1;
    return {
      baslik: { bpm: 96, sakin: true, tr: 0, guc: 0.6 * (1 + (z - 1) * 0.5), tema },
      sonuc: { bpm: 100, sakin: true, tr: 0, guc: 0.5 * (1 + (z - 1) * 0.5), tema },
      yaris: { bpm: b, tr: 0, guc: 0.56 * z, tema },   // müzik anlatımın altında kalsın
      son: { bpm: b + 12, tr: 2, guc: 0.6 * z, son: true, tema },
      garaj: { bpm: 106, sakin: true, tr: -5, guc: 0.56 * (1 + (z - 1) * 0.5), tema, atolye: true }   // garaj: başlık müziğinin sakin, neşeli "atölye" çeşitlemesi
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
    // müzik rengi: altta hafif sıcaklık, tizde yumuşatma (kulak yormasın, anlatımın yerini açık bıraksın)
    const sicak = c.createBiquadFilter(), yumusak = c.createBiquadFilter();
    sicak.type = 'lowshelf'; sicak.frequency.value = 220; sicak.gain.value = 2;
    yumusak.type = 'highshelf'; yumusak.frequency.value = 5400; yumusak.gain.value = -4.5;
    sicak.connect(yumusak); yumusak.connect(g.muzikKis);
    g.muzik = kazanc(0, sicak); g.efekt = kazanc(0.9, g.efektKis);
    g.hava = kazanc(1, g.muzikKis);                                         // hava sesleri (yağmur, rüzgâr, kar) müzikle birlikte kısılır
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
      // oyuncak araba vınlaması: iki yumuşak dalga + alçak geçiren süzgeç + hafif titreşim + yumuşak rüzgâr akışı
      const m = g.motor = { o1: c.createOscillator(), o2: c.createOscillator(), lfo: c.createOscillator(), kazanc: kazanc(0, g.muzikKis) };
      const suz = c.createBiquadFilter(), tit = kazanc(1, m.kazanc), o2k = kazanc(0.34, suz), lfoK = kazanc(0.2, tit.gain);
      suz.type = 'lowpass'; suz.frequency.value = 900; suz.Q.value = 0.68; suz.connect(tit); m.suz = suz; m.lfoK = lfoK;
      m.o1.type = 'triangle'; m.o1.frequency.value = 86; m.o1.connect(suz);
      m.o2.type = 'sine'; m.o2.frequency.value = 172; m.o2.connect(o2k);
      m.lfo.type = 'sine'; m.lfo.frequency.value = 10; m.lfo.connect(lfoK);
      m.o1.start(); m.o2.start(); m.lfo.start();
      // zıplama ve kanat süzülüşünde rüzgâr akışı: kare başına yeni düğüm açılmaz
      const rKay = c.createBufferSource(), rSuz = c.createBiquadFilter(), rAlt = c.createBiquadFilter(), rK = kazanc(0, g.muzikKis);
      rKay.buffer = g.gurultu; rKay.loop = true;
      rSuz.type = 'bandpass'; rSuz.frequency.value = 540; rSuz.Q.value = 0.95;
      rAlt.type = 'lowpass'; rAlt.frequency.value = 2400;
      rKay.connect(rSuz); rSuz.connect(rAlt); rAlt.connect(rK); rKay.start();
      m.ruzgar = { kay: rKay, suz: rSuz, k: rK };
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
    if (o.tut) { k.gain.setTargetAtTime(o.guc * o.tut, t + at, 0.06); k.gain.setTargetAtTime(0, Math.max(t + at, t + sure), 0.035); son = Math.max(t + at, t + sure) + 0.25; }
    else { k.gain.setTargetAtTime(0, t + at, sure / 4); son = t + at + sure * 1.7 + 0.06; }
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
  const cingirak = (g, hedef, t, guc) => { his(g, hedef, t, 0.05, { tip: 'bandpass', f: 6400, q: 1.8, guc }); ton(g, hedef, t, 3200, 0.05, { guc: guc * 0.28, at: 0.002 }); };

  // müziğin bir on altılık adımı: n = döngüdeki adım (0..511), t = çalma anı, sd = adım süresi
  function adim(g, m, n, t, sd) {
    const olcu = (n >> 4) % MEL.length, s = n & 15, tr = m.tr, bolumB = olcu >= 16 && olcu < 24;
    if (m.tema === 'dino' && !m.sakin && (s & 1)) t += sd * 0.3;             // dinozor: sallanarak yürüyen ritim
    if (m.tema === 'korsan' && !m.sakin && (s & 1)) t += sd * 0.33;          // korsan: gemi gibi sallanan ritim
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
          ton(g, g.ezgi, t, f * 2, sure * .9, { guc: .088, at: .006 }); ton(g, g.ezgi, t, f, sure * .9, { guc: .095, at: .01 });   // bir sekizli yukarıda çan
          ton(g, g.ezgi, t, f * 4, sure * .3, { guc: .008, at: .006 });
        } else if (m.tema === 'seker') { // Müzik kutusu: kısa, parlak çınlama; üstünde minik çan.
          ton(g, g.ezgi, t, f, Math.min(sure, .36), { guc: .16, tut: .25, at: .003 });
          ton(g, g.ezgi, t, f * 2, .16, { guc: .065, at: .003 }); ton(g, g.ezgi, t, f * 4, .07, { guc: .018, at: .002 });
        } else if (m.tema === 'uzay') { // Yumuşak sentezleyici: bir sekizli aşağıda, yavaş giriş, hafif akortsuz çift dalga, bol yankı.
          ton(g, g.ezgi, t, f * .5, sure, { guc: .13, tut: .85, at: .05 }); ton(g, g.ezgi, t, f * .5025, sure, { tip: 'triangle', guc: .05, tut: .85, at: .07 });
          ton(g, g.ezgi, t, f, sure, { guc: .03, tut: .6, at: .05 }); ton(g, g.yanki, t, f * .5, sure, { guc: .09, tut: .8, at: .05 });
        } else if (m.tema === 'col') { // Sıcak, kamış benzeri ses: bir sekizli aşağıda.
          ton(g, g.ezgi, t, f * .5, sure * .9, { tip: 'triangle', guc: .155, tut: .7, at: .014 });
          ton(g, g.ezgi, t, f * .5, sure * .9, { tip: 'square', guc: .024, tut: .6, at: .022 }); ton(g, g.ezgi, t, f * 1.5, sure * .5, { guc: .018, at: .014 });
        } else if (m.tema === 'gokkusagi') { // Flüt: yumuşak giriş, hafif titreyen çift ses, minik nefes.
          ton(g, g.ezgi, t, f, sure * .95, { guc: .13, tut: .8, at: .03 }); ton(g, g.ezgi, t, f * 1.006, sure * .95, { guc: .045, tut: .8, at: .04 });
          ton(g, g.ezgi, t, f * 2, sure * .6, { guc: .022, at: .03 }); his(g, g.ezgi, t, Math.min(sure, .12), { tip: 'bandpass', f: f * 2, q: 3, guc: .02, at: .015 });
        } else if (m.tema === 'dino') { // Tahta marimba: bir sekizli aşağıda, tok ve kısa.
          ton(g, g.ezgi, t, f * .5, Math.min(sure, .3), { guc: .2, at: .003 }); ton(g, g.ezgi, t, f * 2, .05, { guc: .05, at: .002 });
        } else if (m.tema === 'sehir') { // Oyuncak korna/borazan: kısa, nefesli, kesik kesik.
          ton(g, g.ezgi, t, f, sure * .62, { tip: 'square', guc: .036, tut: .9, at: .014 }); ton(g, g.ezgi, t, f, sure * .62, { tip: 'triangle', guc: .115, tut: .9, at: .012 });
          ton(g, g.ezgi, t, f * .5, sure * .62, { tip: 'triangle', guc: .05, tut: .9, at: .012 });
        } else if (m.tema === 'sato') { // Masal borazanı: yumuşak nefesli giriş, altında sıcak gölge, vuruş başlarında ince çan.
          ton(g, g.ezgi, t, f, sure * .85, { tip: 'triangle', guc: .15, tut: .75, at: .03 }); ton(g, g.ezgi, t, f, sure * .85, { tip: 'sawtooth', guc: .014, tut: .7, at: .045 });
          ton(g, g.ezgi, t, f * .5, sure * .8, { guc: .06, tut: .6, at: .03 });
          if (!(i & 1)) { ton(g, g.ezgi, t, f * 2, Math.min(sure, .4), { guc: .028, at: .003 }); ton(g, g.ezgi, t, f * 5.4, .06, { guc: .004, at: .002 }); }
        } else if (m.tema === 'lunapark') { // Laterna: iki hafif akortsuz borulu ses (dalgalanan, sıcak), üstünde ince oktav.
          ton(g, g.ezgi, t, f, sure * .8, { guc: .12, tut: .8, at: .015 }); ton(g, g.ezgi, t, f * 1.008, sure * .8, { guc: .06, tut: .8, at: .02 });
          ton(g, g.ezgi, t, f * 2, sure * .7, { guc: .028, tut: .7, at: .015 }); ton(g, g.ezgi, t, f * .5, sure * .7, { tip: 'triangle', guc: .05, tut: .7, at: .012 });
        } else if (m.tema === 'korsan') { // Akordeon: iki kamış (biri hafif akortsuz, titreşimli), altında yumuşak alt kamış.
          ton(g, g.ezgi, t, f, sure * .9, { tip: 'triangle', guc: .13, tut: .8, at: .02 }); ton(g, g.ezgi, t, f * 1.006, sure * .9, { tip: 'square', guc: .016, tut: .8, at: .025 });
          ton(g, g.ezgi, t, f * .5, sure * .9, { tip: 'triangle', guc: .06, tut: .75, at: .02 }); ton(g, g.ezgi, t, f * .996, sure * .9, { tip: 'sawtooth', guc: .009, tut: .8, at: .03 });
        } else if (m.tema === 'denizalti') { // Mercan sualtı: yumuşak kalimba/marimba ve hafif sualtı yankısı.
          ton(g, g.ezgi, t, f, Math.min(sure, .45), { guc: .16, tut: .4, at: .006 });
          ton(g, g.ezgi, t, f * 2, Math.min(sure, .25), { guc: .045, at: .005 });
          ton(g, g.yanki, t, f, sure * .9, { guc: .048, tut: .6, at: .015 });
        } else if (m.tema === 'ciftlik') { // Neşeli çiftlik: canlı banjo/keman tıngırtısı.
          ton(g, g.ezgi, t, f, Math.min(sure, .36), { tip: 'triangle', guc: .16, tut: .45, at: .004 });
          ton(g, g.ezgi, t, f * 2, Math.min(sure, .18), { tip: 'sawtooth', guc: .014, at: .004 });
          ton(g, g.ezgi, t, f * .5, sure * .7, { tip: 'triangle', guc: .06, tut: .5, at: .008 });
        } else if (m.tema === 'muzik') { // Müzik diyarı: parlak ksilofon/glokenşpil ve sıcak üflemeli gölge.
          ton(g, g.ezgi, t, f, Math.min(sure, .42), { guc: .15, at: .003 });
          ton(g, g.ezgi, t, f * 2, Math.min(sure, .26), { guc: .05, at: .003 });
          ton(g, g.ezgi, t, f * .5, sure * .75, { tip: 'triangle', guc: .06, tut: .7, at: .015 });
        } else { // Orman: sıcak tahta flüt (altında bir sekizli aşağı gölge)
          ton(g, g.ezgi, t, f, sure * 0.92, { tip: 'triangle', guc: 0.17, tut: 0.6, at: 0.015 }); ton(g, g.ezgi, t, f * 2, sure * 0.7, { guc: m.son ? 0.06 : 0.035 });
          ton(g, g.ezgi, t, f * .5, sure * .8, { guc: .1, tut: .6, at: .015 }); ton(g, g.ezgi, t, f * 3, sure * .3, { guc: .012 });
        }
        // yarışta ikinci ses: ezginin altında, akorun bir notası (üçlü/altılı aralık); uzun notalarda ve vuruş başlarında
        if (!m.sakin && (u > 1 || !(i & 1)) && m.tema !== 'uzay') {
          let h = 0; for (let o = -24; o <= 0; o += 12) for (const a of ak[1]) { const x = a + o; if (x <= no - 3 && x >= no - 9 && x > h) h = x; }
          if (h) ton(g, g.muzik, t + .004, mf(h + tr), sure * .85, { tip: 'triangle', guc: m.tema === 'seker' || m.tema === 'dino' ? .03 : .038, tut: .55, at: .02 });
        }
      }
    }
    // yarışta yumuşak akor yastığı (ölçü başında): boşlukları doldurur, ses dolgun ve neşeli olur
    if (!m.sakin && s === 0 && m.tema !== 'uzay' && m.tema !== 'kar')
      for (const a of ak[1]) ton(g, g.muzik, t, mf(a + tr), 15 * sd, { guc: m.tema === 'gokkusagi' ? .012 : .016, tut: .9, at: .25 });
    if (m.sakin) {
      if (s === 0) for (const a of ak[1]) ton(g, g.muzik, t, mf(a + tr), 15 * sd, { guc: 0.035, tut: 1, at: 0.18 });   // yumuşak akor
      if (!(s & 1)) ton(g, g.muzik, t, mf(ak[1][[0, 1, 2, 1][(s >> 1) & 3]] + 12 + tr), 2 * sd, { tip: 'triangle', guc: 0.04 });
      if (s === 0 || s === 8) ton(g, g.muzik, t, mf(ak[0] + (s ? 7 : 0) + tr), 6 * sd, { tip: 'triangle', guc: 0.13, tut: 0.5, at: 0.015 });
      if (s === 4 || s === 12) zil(g, t, 0.022);
      if (m.atolye) {                                                       // atölye: tahta tık-tak, ara sıra minik çekiç "tın"ı ve cırcır anahtar
        if (s === 2 || s === 10) ton(g, g.muzik, t, s === 2 ? 820 : 640, .035, { guc: .05, at: .002 });
        if (s === 6 || s === 14) ton(g, g.muzik, t, 1040, .03, { guc: .035, at: .002 });
        if ((olcu & 1) && s === 12) { ton(g, g.yanki, t, mf(ak[1][2] + 24 + tr), .35, { guc: .03, at: .002 }); ton(g, g.muzik, t, mf(ak[1][2] + 24 + tr), .25, { guc: .02, at: .002 }); }
        if ((olcu & 3) === 3 && s >= 12) his(g, g.muzik, t, .025, { tip: 'bandpass', f: 3000 + (s - 12) * 260, q: 4, guc: .03 });
      }
      const tm = m.tema;                                                   // sakin kiplerde de pistin küçük imzası
      if (tm === 'gokkusagi') { const ar = [0, 1, 2, 3, 4, 5, 4, 3, 2, 3, 4, 5, 4, 3, 2, 1][s]; ton(g, g.muzik, t, mf(ak[1][ar % 3] + 12 * (ar / 3 | 0) + 12 + tr), .2, { tip: 'triangle', guc: .05, at: .003 }); }
      else if (tm === 'kar') { if (!(s & 3)) his(g, g.muzik, t, .06, { tip: 'bandpass', f: 7400, q: 4, guc: .022 }); }
      else if (tm === 'kiyi') { if (s === 3 || s === 6 || s === 11 || s === 14) { const f = (s === 6 || s === 14) ? 392 : 294; ton(g, g.muzik, t, f, .08, { f2: f * .82, kay: .06, guc: .05, at: .003 }); } }
      else if (tm === 'dino') { if (s === 0 || s === 8) ton(g, g.muzik, t, 105, .2, { f2: 44, kay: .11, guc: .17 }); if (s === 6 || s === 14) ton(g, g.muzik, t, 940, .028, { guc: .04, at: .0015 }); }
      else if (tm === 'sehir') { if (!(olcu & 1) && (s === 0 || s === 3)) ton(g, g.yanki, t, 2637, .3, { guc: .028, at: .002 }); if (s === 12 || s === 14) trampet(g, t, .028); }
      else if (tm === 'seker') { if ((s & 3) === 2) cingirak(g, g.muzik, t, .014); }
      else if (tm === 'uzay') { if (s === 6 || s === 14) ton(g, g.yanki, t, mf(ak[1][s === 6 ? 2 : 0] + 24 + tr), 1.5 * sd, { guc: .035 }); }
      else if (tm === 'col') { if (s === 0) ton(g, g.muzik, t, 135, .14, { f2: 68, kay: .07, guc: .13 }); if ((s & 3) === 3) his(g, g.muzik, t, .03, { tip: 'bandpass', f: 6800, q: 3, guc: .016 }); }
      else if (tm === 'sato') { if (!(olcu & 1) && s === 0) { ton(g, g.yanki, t, mf(ak[1][0] + 24 + tr), 1, { guc: .025, at: .002 }); ton(g, g.muzik, t, 98, .3, { f2: 62, kay: .2, guc: .1 }); } }   // uzak kule çanı + yumuşak timpani
      else if (tm === 'lunapark') { if ((s & 3) === 2) { const f = mf(ak[1][(s >> 2) % 3] + 24 + tr); ton(g, g.muzik, t, f, .18, { guc: .02, at: .003 }); ton(g, g.muzik, t, f * 1.008, .18, { guc: .01, at: .003 }); } }   // laterna pırıltısı
      else if (tm === 'korsan') { if (s === 0 || s === 8) ton(g, g.muzik, t, 120, .16, { f2: 60, kay: .1, guc: .1 }); if (!(olcu & 3) && s === 0) his(g, g.muzik, t, 1.2, { tip: 'lowpass', f: 300, f2: 1300, guc: .02, at: .5 }); }   // fıçı + dalga
      else if (tm === 'denizalti') { if ((s & 3) === 2) { const f = 420 + ((s >> 2) % 3) * 140; ton(g, g.yanki, t, f, .08, { f2: f * 1.45, kay: .07, guc: .028, at: .004 }); } }   // su kabarcığı
      else if (tm === 'ciftlik') { if (s === 6 || s === 14) ton(g, g.muzik, t, 860, .025, { guc: .035, at: .002 }); }   // tahta tık
      else if (tm === 'muzik') { if ((s & 3) === 2) ton(g, g.yanki, t, mf(ak[1][(s >> 2) % 3] + 24 + tr), .22, { guc: .025, at: .002 }); }   // glokenşpil pırıltısı
      return;
    }
    if (m.tema === 'seker') {                                               // "um-pa" eşlik; davul yerine tahta tık ve çıngırak
      if (!(s & 3)) ton(g, g.muzik, t, mf(ak[0] + ((s & 4) ? 7 : 0) + 12 + tr), 1.4 * sd, { guc: .2, at: .004 });
      if ((s & 3) === 2) for (const a of ak[1]) ton(g, g.muzik, t, mf(a + 12 + tr), 1.1 * sd, { guc: .042, at: .003 });
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
      if (dum) { ton(g, g.muzik, t, 135, .14, { f2: 68, kay: .07, guc: .26 }); his(g, g.muzik, t, .05, { tip: 'lowpass', f: 420, guc: .07 }); }
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
        ton(g, g.muzik, t, 105, .2, { f2: 52, kay: .11, guc: .28 }); his(g, g.muzik, t, .09, { tip: 'lowpass', f: 300, guc: .11 });
        const f = mf(ak[0] + (s ? 7 : 0) + tr); ton(g, g.muzik, t, f, 3 * sd, { tip: 'triangle', guc: .2, tut: .7, at: .012 }); ton(g, g.muzik, t, f, 3 * sd, { tip: 'sawtooth', guc: .018, tut: .6, at: .02 });
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
      if ((olcu & 7) === 3 && (s === 12 || s === 14)) for (const f of [392, 494]) { const hz = f * (tr ? 1.1225 : 1); ton(g, g.muzik, t, hz, 1.3 * sd, { tip: 'triangle', guc: .028, tut: .9, at: .01 }); ton(g, g.muzik, t, hz, 1.3 * sd, { tip: 'square', guc: .016, tut: .9, at: .012 }); }   // oyuncak korna
      return;
    }
    if (m.tema === 'sato') {                                                // masal alayı: geniş bas + yumuşak timpani, telli arp, kule çanı, bölüm sonunda küçük borazan çağrısı
      if (s === 0 || s === 8) { const f = mf(ak[0] + (s ? 7 : 0) + tr); ton(g, g.muzik, t, f, 6 * sd, { tip: 'triangle', guc: .19, tut: .6, at: .015 }); ton(g, g.muzik, t, 98, .3, { f2: 62, kay: .2, guc: .22 }); }
      if (m.son && (s === 4 || s === 12)) ton(g, g.muzik, t, 98, .2, { f2: 62, kay: .15, guc: .14 });
      if (s & 1) { if (s === 13 && (olcu & 1)) ton(g, g.muzik, t, 110, .14, { f2: 66, kay: .1, guc: .1 }); }   // timpani "ta-tam"
      else if (s) { const no = ak[1][[0, 1, 2, 1, 0, 1, 2][(s >> 1) - 1]] + 12 + tr; ton(g, g.muzik, t, mf(no), 1.6 * sd, { tip: 'triangle', guc: .042, at: .004 }); ton(g, g.yanki, t, mf(no + 12), .1, { guc: .008, at: .003 }); }   // telli arp
      if (s === 4 || s === 12) his(g, g.muzik, t, .18, { tip: 'bandpass', f: 4800, q: .7, guc: .02, at: .03 });   // fırçalı zil
      if ((s & 3) === 2) zil(g, t, .014);
      if (!(olcu & 3) && s === 0) { const f = mf(ak[1][0] + 24 + tr); ton(g, g.yanki, t, f, 1.2, { guc: .035, at: .002 }); ton(g, g.muzik, t, f, .9, { guc: .025, at: .002 }); ton(g, g.muzik, t, f * 2.76, .25, { guc: .005, at: .002 }); }   // kule çanı
      if ((olcu & 7) === 7 && s >= 8 && !(s & 1)) ak[1].concat(ak[1][0] + 12).slice((s - 8) >> 1, ((s - 8) >> 1) + 1).forEach(a => { ton(g, g.muzik, t, mf(a + tr), 2 * sd, { tip: 'triangle', guc: .07, tut: .7, at: .02 }); ton(g, g.muzik, t, mf(a + tr), 2 * sd, { tip: 'sawtooth', guc: .01, tut: .7, at: .03 }); });   // bölüm sonu: çıkan borazan
      return;
    }
    if (m.tema === 'lunapark') {                                            // atlıkarınca: her vuruşta bas (kök–beşli), arada "pa" akorları, tahta tık, glokenşpil, bölüm sonunda kayan düdük
      if (!(s & 3)) ton(g, g.muzik, t, mf(ak[0] + ((s & 4) ? 7 : 0) + tr), 2 * sd, { tip: 'triangle', guc: .2, tut: .6, at: .008 });
      if ((s & 3) === 2) for (const a of ak[1]) { ton(g, g.muzik, t, mf(a + tr), 1.2 * sd, { guc: .042, tut: .7, at: .006 }); ton(g, g.muzik, t, mf(a + tr) * 1.006, 1.2 * sd, { guc: .018, tut: .7, at: .008 }); }
      if (s === 0 || s === 8 || (m.son && (s === 4 || s === 12))) davul(g, t, .2);
      if (s === 4 || s === 12) his(g, g.muzik, t, .08, { tip: 'bandpass', f: 5200, q: 1.2, guc: .03 });
      if (s === 6 || s === 14) ton(g, g.muzik, t, s === 6 ? 1180 : 880, .03, { guc: .055, at: .0015 });   // tahta tık
      if (s & 1) { if (m.son) zil(g, t, .012); }
      if ((olcu & 3) === 3 && s >= 8 && !(s & 1)) ton(g, g.yanki, t, mf(ak[1][((s - 8) >> 1) % 3] + 24 + tr), .3, { guc: .04, at: .002 });   // glokenşpil
      if ((olcu & 7) === 7 && s === 12) ton(g, g.muzik, t, 600, .45, { f2: 1050, kay: .4, guc: .035, tut: .8, at: .05 });   // kayan düdük (yumuşak)
      return;
    }
    if (m.tema === 'korsan') {                                              // denizci havası: sallanan bas + fıçı davulu, akordeon nefes akorları, tahta tokmak, tef, gemi çanı, dalga
      if (s === 0 || s === 8) { ton(g, g.muzik, t, mf(ak[0] + (s ? 7 : 0) + tr), 3 * sd, { tip: 'triangle', guc: .21, tut: .6, at: .01 }); ton(g, g.muzik, t, 120, .16, { f2: 60, kay: .1, guc: .24 }); }
      if (s === 4 || s === 12) for (const a of ak[1]) { ton(g, g.muzik, t, mf(a + tr), 1.6 * sd, { tip: 'triangle', guc: .045, tut: .7, at: .015 }); ton(g, g.muzik, t, mf(a + tr) * 1.005, 1.6 * sd, { tip: 'square', guc: .006, tut: .7, at: .02 }); }
      if (s === 6 || s === 14 || (s === 10 && (olcu & 1)) || (m.son && s === 2)) ton(g, g.muzik, t, 520, .05, { f2: 400, kay: .04, guc: .07, at: .002 });   // tahta tokmak
      if ((s & 3) === 2 || (m.son && (s & 1))) his(g, g.muzik, t, .05, { tip: 'bandpass', f: 6000, q: 2, guc: (s & 1) ? .012 : .024 });   // tef
      if (!(olcu & 7) && (s === 0 || s === 4)) { const f = mf(79 + tr); ton(g, g.yanki, t, f, .6, { guc: .035, at: .002 }); ton(g, g.muzik, t, f, .4, { guc: .025, at: .002 }); ton(g, g.muzik, t, f * 2.76, .15, { guc: .005, at: .002 }); }   // gemi çanı: çın çın
      if ((olcu & 7) === 4 && s === 0) his(g, g.muzik, t, 1.2, { tip: 'lowpass', f: 300, f2: 1400, guc: .03, at: .5 });   // dalga
      if ((olcu & 7) === 7 && s > 12) ton(g, g.muzik, t, 120, .12, { f2: 64, kay: .08, guc: .12 });
      return;
    }
    if (m.tema === 'denizalti') {                                           // mercan sualtı: süzülen bas, arp dalgası, kabarcık "blup"ları, yumuşak sualtı vuruşu
      if (s === 0 || s === 8) { ton(g, g.muzik, t, mf(ak[0] + (s ? 7 : 0) + tr), 5 * sd, { guc: .18, tut: .65, at: .015 }); ton(g, g.muzik, t, 130, .15, { f2: 65, kay: .1, guc: .18 }); }
      if (!(s & 1)) { const no = ak[1][[0, 1, 2, 1, 0, 1, 2, 1][s >> 1]] + 12 + tr; ton(g, g.muzik, t, mf(no), 1.6 * sd, { guc: .04, at: .005 }); ton(g, g.yanki, t, mf(no + 12), .14, { guc: .014, at: .004 }); }
      if (s === 3 || s === 11 || (m.son && s === 7)) { const f = s === 3 ? 480 : s === 11 ? 640 : 760; ton(g, g.yanki, t, f, .07, { f2: f * 1.55, kay: .06, guc: .05, at: .004 }); }   // kabarcık
      if (s === 4 || s === 12) his(g, g.muzik, t, .1, { tip: 'bandpass', f: 3400, q: 1.1, guc: .025, at: .01 });
      if ((olcu & 7) === 7 && s >= 8 && !(s & 1)) { const f = 520 + ((s - 8) >> 1) * 140; ton(g, g.yanki, t, f, .07, { f2: f * 1.5, kay: .06, guc: .045, at: .003 }); }
      return;
    }
    if (m.tema === 'ciftlik') {                                             // neşeli çiftlik: um-pa bas, tıngırdayan akor, tahta tık ve fırçalı ritim
      if (!(s & 3)) ton(g, g.muzik, t, mf(ak[0] + ((s & 4) ? 7 : 0) + tr), 2 * sd, { tip: 'triangle', guc: .2, tut: .55, at: .006 });
      if ((s & 3) === 2) for (const a of ak[1]) { ton(g, g.muzik, t, mf(a + tr), 1.1 * sd, { tip: 'triangle', guc: .045, at: .004 }); ton(g, g.muzik, t, mf(a + tr), .14, { tip: 'sawtooth', guc: .008, at: .003 }); }
      if (s === 0 || s === 8 || (m.son && (s === 4 || s === 12))) davul(g, t, .22);
      if (s === 4 || s === 12) { trampet(g, t, .07); ton(g, g.muzik, t, 980, .028, { guc: .06, at: .0015 }); }
      if (s === 6 || s === 14) ton(g, g.muzik, t, 760, .025, { guc: .045, at: .0015 });   // tahta tık
      if (!(s & 1)) his(g, g.muzik, t, .04, { tip: 'bandpass', f: 5600, q: 1.4, guc: (s & 3) === 2 ? .026 : .014 });
      if ((olcu & 7) === 7 && s > 12) ton(g, g.muzik, t, 880 + (s - 12) * 120, .025, { guc: .05, at: .0015 });
      return;
    }
    if (m.tema === 'muzik') {                                               // müzik diyarı: canlı bas, parlak akor, trampet, üçgen zil ve ksilofon geçişi
      if (!(s & 3)) ton(g, g.muzik, t, mf(ak[0] + ((s & 4) ? 7 : 0) + tr), 2 * sd, { tip: 'triangle', guc: .19, tut: .65, at: .006 });
      if ((s & 3) === 2) for (const a of ak[1]) { ton(g, g.muzik, t, mf(a + tr), 1.2 * sd, { tip: 'triangle', guc: .048, tut: .75 }); ton(g, g.muzik, t, mf(a + tr), 1.2 * sd, { tip: 'square', guc: .007, tut: .75, at: .008 }); }
      if (s === 0 || s === 8 || (m.son && (s === 4 || s === 12))) davul(g, t, .22);
      if (s === 4 || s === 12 || ((olcu & 1) && (s === 14 || s === 15))) trampet(g, t, s > 12 ? .045 : .08);
      if (!(s & 1)) zil(g, t, (s & 3) === 2 ? .026 : .014);
      if (!(olcu & 3) && s === 0) { ton(g, g.yanki, t, 3136, .45, { guc: .025, at: .002 }); ton(g, g.muzik, t, 3136, .25, { guc: .015, at: .002 }); }   // üçgen zil
      if ((olcu & 7) === 7 && s >= 12) ton(g, g.ezgi, t, mf([84, 88, 91, 96][s - 12] + tr), .2, { guc: .05, at: .002 });   // ksilofon merdiveni
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
  const YILDIZ = [84, 88, 91, 93, 96, 100];
  const YILDIZ_UST = [88, 91, 96, 98, 100, 103];
  const E = {
    yildiz(g, t, k, tm, mik) {                                                // 3'lü seri boyunca Do majör yükselen melodi (k = 0..2)
      const idx = Math.min(5, Math.max(0, k || 0)), a = YILDIZ[idx], ust = YILDIZ_UST[idx], f = mf(a), z = 1 - 0.06 * idx;
      ton(g, g.can, t, f, 0.26, { guc: 0.19 * z }); ton(g, g.can, t, f * 2, 0.15, { guc: 0.045 * z });
      ton(g, g.can, t + 0.072, mf(ust), 0.38, { guc: 0.17 * z }); ton(g, g.can, t + 0.072, mf(ust + 12), 0.18, { guc: 0.024 * z });
      ton(g, g.efekt, t, f / 2, 0.12, { tip: 'triangle', guc: 0.075 * z });     // tok bir alt ses: iPad hoparlöründe sıcak gövde
      ton(g, g.can, t + 0.072, mf(ust) * 1.003, 0.34, { guc: 0.038 * z });      // hafif çift ses: çan gibi parıltı
      if (mik) ton(g, g.yanki, t + 0.03, mf(a + 12), 0.28, { guc: 0.03 * z, at: 0.01 });   // mıknatısla çekilen yıldızda hafif pırıltı
      tm = tm || sesTema;
      if (tm === 'seker') cingirak(g, g.can, t + 0.03, 0.028 * z);                                    // şekerde çıngıraklı
      else if (tm === 'uzay') ton(g, g.yanki, t + 0.16, mf(ust + 12), 0.48, { guc: 0.06 * z });       // uzayda yankılı kuyruk
    },
    roket(g, t) {
      his(g, g.efekt, t, 0.72, { tip: 'bandpass', f: 340, f2: 2400, q: 1.1, guc: 0.25, at: 0.08 });
      ton(g, g.efekt, t, 200, 0.58, { f2: 780, kay: 0.52, guc: 0.095, at: 0.06, tut: 0.8 });
      ton(g, g.efekt, t, 98, 0.28, { f2: 60, kay: 0.24, guc: 0.12, at: 0.01 });           // tok kalkış gümbürtüsü
      [84, 88, 91, 96].forEach((a, i) => ton(g, g.can, t + 0.07 + i * 0.055, mf(a), i === 3 ? 0.28 : 0.18, { tip: 'triangle', guc: 0.068 }));   // neşeli yükselen dört nota
      ton(g, g.can, t + 0.235, mf(108), 0.2, { guc: 0.022, at: 0.004 });
    },
    hop(g, t, tm, kanat) {
      tm = tm || sesTema;
      if (tm === 'uzay') {                                                  // süzülen: yavaşça yükselir, yankıda asılı kalır
        const u = ton(g, g.can, t, 170, 0.62, { f2: 520, kay: 0.34, guc: 0.15, tut: 0.75, at: 0.04 }); u.frequency.exponentialRampToValueAtTime(390, t + 0.7);
        ton(g, g.can, t + 0.1, 1040, 0.5, { f2: 1320, kay: 0.4, guc: 0.03, at: 0.08 });
        if (kanat) {
          his(g, g.efekt, t, 0.3, { tip: 'bandpass', f: 520, f2: 1900, q: 0.9, guc: 0.055, at: 0.05 });
          [91, 96, 100, 103].forEach((a, i) => ton(g, g.can, t + 0.04 + i * 0.055, mf(a), 0.24, { guc: 0.042, at: 0.005 }));
        }
        return;
      }
      const z = tm === 'kar' ? 0.7 : 1;                                     // karda yumuşak
      const o = ton(g, g.efekt, t, 210, 0.36, { f2: 640, kay: 0.13, guc: 0.2 * z, tut: 0.7 }); o.frequency.exponentialRampToValueAtTime(400, t + 0.38);
      ton(g, g.efekt, t, 105, 0.2, { tip: 'triangle', f2: 320, kay: 0.13, guc: 0.08 * z });
      if (tm === 'kar') his(g, g.efekt, t, 0.18, { tip: 'lowpass', f: 900, f2: 300, guc: 0.06, at: 0.02 });
      else {
        his(g, g.efekt, t, 0.22, { tip: 'bandpass', f: 450, f2: 1250, q: 0.95, guc: 0.05 * z, at: 0.025 });
        if (tm === 'seker') [91, 96, 100].forEach((a, i) => ton(g, g.can, t + 0.05 + i * 0.05, mf(a), 0.16, { guc: 0.05 }));   // şekerde minik çanlar
      }
      if (kanat) {                                                          // kanatlıyken rampa kalkışında yumuşak havadar pırıltı
        his(g, g.efekt, t + 0.02, 0.28, { tip: 'bandpass', f: 560, f2: 2100, q: 0.85, guc: 0.065 * z, at: 0.04 });
        [91, 96, 100, 103].forEach((a, i) => {
          ton(g, g.can, t + 0.04 + i * 0.05, mf(a), i === 3 ? 0.32 : 0.18, { guc: 0.046 * z, at: 0.004 });
          ton(g, g.yanki, t + 0.06 + i * 0.05, mf(a + 12), 0.18, { guc: 0.012 * z, at: 0.005 });
        });
      }
    },
    tok(g, t) { ton(g, g.efekt, t, 165, 0.15, { f2: 62, kay: 0.1, guc: 0.3 }); his(g, g.efekt, t, 0.07, { tip: 'lowpass', f: 520, guc: 0.16 }); },
    bip(g, t) {                                                             // geri sayım: yuvarlak, tok "dın"
      ton(g, g.efekt, t, 587.3, 0.2, { guc: 0.16, tut: 0.8 }); ton(g, g.efekt, t, 587.3, 0.2, { tip: 'triangle', guc: 0.05, tut: 0.8 });
      ton(g, g.efekt, t, 293.7, 0.16, { tip: 'triangle', guc: 0.07, tut: 0.6 }); ton(g, g.can, t, 1174.7, 0.12, { guc: 0.02 });
    },
    git(g, t) {                                                             // "Başla!" çanı: parlak akor + tok alt ses
      ton(g, g.can, t, 1174.7, 0.5, { guc: 0.15, tut: 0.8 }); ton(g, g.can, t, 1174.7, 0.5, { tip: 'triangle', guc: 0.05, tut: 0.8 });
      ton(g, g.can, t, 880, 0.5, { guc: 0.06, tut: 0.8 }); ton(g, g.can, t, 1480, 0.45, { guc: 0.045, tut: 0.7 }); ton(g, g.can, t, 2349.3, 0.4, { guc: 0.025 });
      ton(g, g.efekt, t, 146.8, 0.35, { tip: 'triangle', guc: 0.12, tut: 0.5 }); ton(g, g.efekt, t, 150, 0.16, { f2: 55, kay: 0.09, guc: 0.16 });
    },
    tur(g, t) {                                                             // tur tamam: yükselen dört nota + alt ses + minik çan
      [79, 84, 88, 91].forEach((a, i) => ton(g, g.can, t + i * 0.085, mf(a), i === 3 ? 0.45 : 0.22, { tip: 'triangle', guc: 0.14 }));
      ton(g, g.can, t + 0.255, mf(103), 0.3, { guc: 0.04 }); ton(g, g.can, t + 0.255, mf(96), 0.4, { guc: 0.055 });
      ton(g, g.can, t + 0.255, mf(88), 0.38, { tip: 'triangle', guc: 0.045 });
      ton(g, g.efekt, t + 0.255, mf(48), 0.4, { tip: 'triangle', guc: 0.075, tut: 0.5 }); ton(g, g.efekt, t + 0.255, 150, 0.14, { f2: 55, kay: 0.08, guc: 0.08 });
    },
    bitis(g, t) {                                                           // kısa zafer ezgisi (yaklaşık 2,5 sn)
      const u = 0.14;
      [[0, 79, 0.8], [1, 79, 0.8], [2, 79, 0.8], [3, 84, 2.8], [6, 81, 0.9], [7, 83, 0.9], [8, 88, 7]].forEach(n => {
        ton(g, g.can, t + n[0] * u, mf(n[1]), n[2] * u, { tip: 'triangle', guc: 0.17, tut: 0.7 }); ton(g, g.can, t + n[0] * u, mf(n[1] + 12), n[2] * u, { guc: 0.04, tut: 0.5 });
      });
      [[3, 76, 2.8], [6, 77, 0.9], [7, 79, 0.9], [8, 84, 7], [8, 79, 7]].forEach(n => ton(g, g.efekt, t + n[0] * u, mf(n[1]), n[2] * u, { tip: 'triangle', guc: 0.08, tut: 0.7 }));
      [[3, 48, 2.8], [6, 53, 0.9], [7, 55, 0.9], [8, 48, 7]].forEach(n => ton(g, g.efekt, t + n[0] * u, mf(n[1]), n[2] * u, { tip: 'triangle', guc: 0.16, tut: 0.7 }));
      [0, 1, 2].forEach(i => ton(g, g.efekt, t + i * u, 150, 0.14, { f2: 55, kay: 0.08, guc: 0.22 }));
      his(g, g.efekt, t + 8 * u, 0.9, { f: 5200, guc: 0.05 });
      his(g, g.efekt, t + 6 * u, 0.5, { tip: 'bandpass', f: 1800, f2: 5200, q: 0.8, guc: 0.035, at: 0.2 });   // zile doğru yumuşak kabarış
      [[8, 72], [8, 76], [8, 79]].forEach(n => ton(g, g.efekt, t + n[0] * u + 0.05, mf(n[1]), 1.1, { guc: 0.03, tut: 0.8, at: 0.12 }));   // altta sıcak akor yastığı
      ton(g, g.efekt, t + 8 * u, 120, 0.25, { f2: 48, kay: 0.15, guc: 0.2 });                  // son vuruşta tok davul
      [96, 100, 103, 108, 103, 108].forEach((a, i) => ton(g, g.can, t + 8 * u + 0.12 + i * 0.1, mf(a), 0.3, { guc: 0.038 }));
    },
    seri(g, t) { // Üç yıldız ödülü: yıldızlardan yukarı devam eden parlak pırıltı; konuşma eklenmez.
      [84, 88, 91, 96].forEach((n, i) => {
        ton(g, g.can, t + i * .058, mf(n), .2 + i * .035, { guc: .115, tip: 'triangle', at: .004 });
        if (i >= 2) ton(g, g.can, t + i * .058, mf(n + 12), .18, { guc: .022, at: .004 });
      });
      ton(g, g.yanki, t + .18, mf(100), .32, { guc: .028, at: .006 });
    },
    inis(g, t, tm, kanat) {
      tm = tm || sesTema;
      const z = (tm === 'uzay' ? .5 : tm === 'kar' ? .65 : 1) * (kanat ? .75 : 1);
      ton(g, g.efekt, t, 118, .14, { f2: 56, kay: .09, guc: .15 * z });
      ton(g, g.efekt, t, 175, .11, { tip: 'triangle', f2: 82, kay: .08, guc: .12 * z });   // iPad hoparlöründe sıcak ve tok iniş gövdesi
      his(g, g.efekt, t, .11, { tip: 'lowpass', f: 680, f2: 240, guc: .065 * z });
      if (kanat) his(g, g.efekt, t, .14, { tip: 'bandpass', f: 850, f2: 420, q: .8, guc: .035, at: .015 });
    },
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
      else if (id === 'gemi') {                                             // tahta gıcırtısı + gemi çanı "çın çın"
        ton(g, g.efekt, t, 170, .22, { tip: 'triangle', f2: 235, kay: .2, guc: .1, tut: .8, at: .03 }); his(g, g.efekt, t, .2, { tip: 'bandpass', f: 700, f2: 950, q: 7, guc: .07, at: .04 });
        [.26, .44].forEach(d => { ton(g, g.can, t + d, 988, .45, { guc: .13, at: .002 }); ton(g, g.can, t + d, 988 * 2.76, .12, { guc: .014, at: .002 }); ton(g, g.efekt, t + d, 494, .3, { tip: 'triangle', guc: .045, at: .003 }); });
      } else if (id === 'polis') [[0, 784, .1], [.15, 587, .18]].forEach(n => { ton(g, g.efekt, t + n[0], n[1], n[2], { tip: 'triangle', guc: .1, tut: .85, at: .02 }); ton(g, g.efekt, t + n[0], n[1], n[2], { guc: .05, tut: .85, at: .02 }); });   // kısa, yumuşak "di-dat" (siren değil)
      else if (id === 'kedi') {                                             // sevimli "miyav": yükselip inen kayan nota
        const o = ton(g, g.efekt, t, 560, .42, { tip: 'triangle', f2: 860, kay: .13, guc: .15, tut: .8, at: .03 }); o.frequency.exponentialRampToValueAtTime(520, t + .44);
        const u = ton(g, g.efekt, t, 1120, .38, { f2: 1720, kay: .13, guc: .035, tut: .7, at: .04 }); u.frequency.exponentialRampToValueAtTime(1040, t + .42);
      } else if (id === 'tren') {                                           // buharlı tren: çift düdük "çuuf çuuf!"
        [0, .14].forEach(d => his(g, g.efekt, t + d, .06, { tip: 'bandpass', f: 1100, f2: 750, q: .9, guc: .11, at: .01 }));
        [.24, .46].forEach((d, i) => {
          [659.3, 784].forEach(f => { ton(g, g.efekt, t + d, f, i ? .24 : .15, { tip: 'triangle', guc: .085, tut: .9, at: .02 }); ton(g, g.efekt, t + d, f * 1.004, i ? .24 : .15, { guc: .042, tut: .9, at: .025 }); });
          his(g, g.efekt, t + d, i ? .18 : .1, { tip: 'bandpass', f: 2200, q: 1, guc: .014, at: .02 });
        });
      } else if (id === 'traktor') {                                        // neşeli traktör: tok "pat-pat" + kalın korna
        [0, .13].forEach(d => { ton(g, g.efekt, t + d, 96, .08, { tip: 'sawtooth', f2: 64, kay: .06, guc: .048, at: .006 }); ton(g, g.efekt, t + d, 144, .07, { tip: 'triangle', f2: 96, kay: .05, guc: .085, at: .005 }); });
        korna(t + .26, 174.6, 220, .13, .1); korna(t + .44, 174.6, 220, .2, .1);
      } else if (id === 'ufo') {                                            // uçan daire: sevimli uzaylı titreşimi
        const o = ton(g, g.efekt, t, 540, .52, { tip: 'triangle', guc: .12, tut: .85, at: .03 });
        [680, 480, 760, 520, 880].forEach((f, i) => o.frequency.exponentialRampToValueAtTime(f, t + .09 * (i + 1)));
        const u = ton(g, g.can, t + .04, 810, .44, { guc: .045, tut: .7, at: .04 });
        [1020, 720, 1140, 780, 1320].forEach((f, i) => u.frequency.exponentialRampToValueAtTime(f, t + .04 + .085 * (i + 1)));
      }
    },
    kart(g, t) { ton(g, g.efekt, t, 660, .05, { guc: .13 }); ton(g, g.efekt, t + .045, 990, .07, { guc: .1 }); },   // pist kartı: iki sesli düğme tıkı
    gecis(g, t) { [79, 84].forEach((n, i) => ton(g, g.can, t + i * .085, mf(n), .19, { guc: .075 })); },
    tik(g, t) { ton(g, g.efekt, t, 700, 0.06, { f2: 1050, kay: 0.04, guc: 0.11, at: 0.003 }); ton(g, g.efekt, t, 330, 0.05, { tip: 'triangle', guc: 0.06, at: 0.002 }); },   // düğme: yumuşak "pıt"
    /*SES-GARAJ*/   // ---- garaj ve sürprizler ----
    balon(g, t, tur) {                                                      // sürpriz balon: yumuşak "pat" + türe özgü kısa ezgi
      his(g, g.efekt, t, .05, { tip: 'bandpass', f: 1500, f2: 500, q: .9, guc: .15, at: .002 }); ton(g, g.efekt, t, 430, .06, { f2: 150, kay: .05, guc: .15, at: .002 });
      const b = t + .08;
      if (tur === 'turbo') {                                                // süper turbo: jet vuuş + üç yükselen güç notası
        his(g, g.efekt, b, .55, { tip: 'bandpass', f: 360, f2: 2800, q: 1.2, guc: .22, at: .12 });
        ton(g, g.efekt, b, 160, .48, { tip: 'triangle', f2: 680, kay: .44, guc: .1, tut: .7, at: .06 });
        [79, 84, 91].forEach((a, i) => ton(g, g.can, b + .08 + i * .07, mf(a), .18, { tip: 'triangle', guc: .07 }));
      } else if (tur === 'kanat') {                                         // kanatlar: yumuşak kanat çırpışı + havadar yükselen pırıltı
        his(g, g.efekt, b, .26, { tip: 'bandpass', f: 420, f2: 1850, q: .85, guc: .11, at: .05 });
        his(g, g.efekt, b + .16, .16, { tip: 'bandpass', f: 650, f2: 1650, q: .9, guc: .08, at: .035 });
        [84, 88, 91, 96].forEach((a, i) => {
          ton(g, g.can, b + i * .06, mf(a), i === 3 ? .38 : .18, { guc: .075, at: .005 });
          ton(g, g.can, b + i * .06 + .015, mf(a + 12), .16, { guc: .02, at: .006 });
        });
      } else if (tur === 'miknatis') {                                      // mıknatıs: çeken "vuup" + uyumlu çınlama
        ton(g, g.efekt, b, 261.6, .28, { f2: 523.3, kay: .24, guc: .11, tut: .8, at: .03 });
        ton(g, g.efekt, b, 264, .28, { tip: 'triangle', f2: 526, kay: .24, guc: .055, tut: .8, at: .03 });
        [88, 91, 96].forEach((a, i) => ton(g, g.can, b + .22 + i * .065, mf(a), i === 2 ? .28 : .18, { guc: .07 }));
      } else if (tur === 'dev') { [60, 55, 48].forEach((a, i) => { ton(g, g.efekt, b + i * .1, mf(a), i === 2 ? .3 : .12, { tip: 'triangle', guc: .12, tut: .7, at: .01 }); ton(g, g.efekt, b + i * .1, mf(a + 12), .1, { guc: .04 }); }); ton(g, g.efekt, b + .2, 110, .2, { f2: 54, kay: .12, guc: .11 }); }   // büyüyen: inen kalın adımlar
      else if (tur === 'baloncuk') [520, 660, 830, 1050].forEach((f, i) => ton(g, g.can, b + i * .075, f, .07, { f2: f * 1.7, kay: .06, guc: .09, at: .004 }));   // köpük: yükselen "blup"lar
      else [84, 88, 91, 96, 100, 103].forEach((a, i) => { ton(g, g.can, b + i * .055, mf(a), i === 5 ? .34 : .15, { tip: 'triangle', guc: .08 }); ton(g, g.can, b + i * .055, mf(a + 12), .11, { guc: .025 }); });   // gökkuşağı: yükselen pırıltılı arpej
    },
    guc(g, t, tur, n) {                                                     // güç boyunca hafif süren tını: bir adım (aralık sesGUC_ARA)
      if (tur === 'turbo') {                                                // jet akışı + yumuşak türbin uğultusu
        his(g, g.efekt, t, .22, { tip: 'bandpass', f: 620, f2: 1220, q: .9, guc: .042, at: .06 });
        ton(g, g.efekt, t, 196, .24, { f2: 261.6, kay: .2, guc: .024, tut: .8, at: .05 });
      } else if (tur === 'kanat') {                                         // havadar kanat çırpışı + yumuşak gök pırıltısı
        const yukari = (n & 1) === 0;
        his(g, g.efekt, t, .17, { tip: 'bandpass', f: yukari ? 460 : 620, f2: yukari ? 1280 : 940, q: .9, guc: yukari ? .042 : .028, at: .04 });
        if (yukari) {
          const a = [91, 96, 100, 103][(n >> 1) & 3];
          ton(g, g.can, t + .03, mf(a), .2, { guc: .028, at: .006 });
          ton(g, g.yanki, t + .05, mf(a + 12), .22, { guc: .01, at: .008 });
        }
      } else if (tur === 'miknatis') {                                      // yumuşak mıknatıs vınlaması + Do majör çınlama
        ton(g, g.efekt, t, 196, .34, { f2: 261.6, kay: .3, guc: .028, tut: .9, at: .08 });
        ton(g, g.efekt, t, 293.7, .34, { tip: 'triangle', f2: 392, kay: .3, guc: .014, tut: .9, at: .08 });
        if (!(n & 1)) ton(g, g.can, t + .04, mf([91, 96, 100, 96][(n >> 1) & 3]), .22, { guc: .022, at: .004 });
      } else if (tur === 'dev') { ton(g, g.efekt, t, 98, .13, { f2: 50, kay: .09, guc: n & 1 ? .08 : .1 }); his(g, g.efekt, t, .05, { tip: 'lowpass', f: 320, guc: .03 }); }   // tok adım
      else if (tur === 'baloncuk') { const f = [700, 930, 790, 1050][n & 3]; ton(g, g.can, t, f, .06, { f2: f * 1.6, kay: .05, guc: .04, at: .004 }); }   // su damlası
      else { const a = [96, 100, 103, 108, 103, 100][n % 6]; ton(g, g.can, t, mf(a), .14, { guc: .03, at: .004 }); ton(g, g.can, t, mf(a + 12), .08, { guc: .007, at: .004 }); }   // gökkuşağı pırıltısı
    },
    gucBitti(g, t, tur) {                                                   // güç bitti: yumuşak, kısa iniş
      if (tur === 'turbo') { his(g, g.efekt, t, .24, { tip: 'bandpass', f: 1600, f2: 380, q: 1.0, guc: .1, at: .02 }); ton(g, g.efekt, t, 420, .22, { tip: 'triangle', f2: 140, kay: .2, guc: .06, tut: .7, at: .02 }); }
      else if (tur === 'kanat') { his(g, g.efekt, t, .16, { tip: 'bandpass', f: 1100, f2: 420, q: .8, guc: .07, at: .02 }); [96, 91, 88].forEach((a, i) => ton(g, g.can, t + i * .065, mf(a), .15, { guc: .038 })); }
      else if (tur === 'miknatis') ton(g, g.efekt, t, 261.6, .22, { f2: 164.8, kay: .19, guc: .05, tut: .8, at: .03 });
      else if (tur === 'dev') ton(g, g.efekt, t, 300, .2, { tip: 'triangle', f2: 150, kay: .18, guc: .07, tut: .7, at: .02 });
      else if (tur === 'baloncuk') { his(g, g.efekt, t, .04, { tip: 'bandpass', f: 2400, q: 1.2, guc: .06, at: .002 }); ton(g, g.can, t, 900, .06, { f2: 500, kay: .05, guc: .05, at: .003 }); }   // köpük "pıt"
      else [100, 96, 91, 84].forEach((a, i) => ton(g, g.can, t + i * .06, mf(a), .14, { guc: .04 }));
    },
    korna(g, t, id, z) {                                                    // Feza'nın kornaları: sevimli ve kısa (< 0,9 sn); z = düzey çarpanı
      z = z || 1;
      const suzgec = (f, q) => { const s = g.ctx.createBiquadFilter(); s.type = 'bandpass'; s.frequency.value = f; s.Q.value = q; s.connect(g.efekt); return s; };
      const birak = (os, s) => os.addEventListener('ended', () => s.disconnect());
      if (id === 'ordek') {                                                 // "vak vak": genizden, aşağı kayan iki kısa ses
        const s = suzgec(1500, 2.2); let son;
        [0, .2].forEach(d => { son = ton(g, s, t + d, 640, .1, { tip: 'sawtooth', f2: 370, kay: .1, guc: .3 * z, tut: .9, at: .008 }); ton(g, g.efekt, t + d, 320, .1, { tip: 'triangle', f2: 185, kay: .1, guc: .05 * z, tut: .9, at: .008 }); });
        birak(son, s);
      } else if (id === 'tren') {                                           // "çuf çuf" + iki sesli düdük
        [0, .15].forEach(d => his(g, g.efekt, t + d, .07, { tip: 'bandpass', f: 1000, f2: 700, q: .8, guc: .13 * z, at: .012 }));
        [659.3, 784].forEach(f => { ton(g, g.efekt, t + .32, f, .3, { tip: 'triangle', guc: .088 * z, tut: .9, at: .03 }); ton(g, g.efekt, t + .32, f * 1.004, .3, { guc: .045 * z, tut: .9, at: .04 }); });
        his(g, g.efekt, t + .32, .2, { tip: 'bandpass', f: 2400, q: 1, guc: .012 * z, at: .03 });
      } else if (id === 'zil') {                                            // bisiklet zili: "çın çın"
        [0, .2].forEach(d => { ton(g, g.efekt, t + d, 2637, .3, { guc: .088 * z, at: .003 }); ton(g, g.efekt, t + d, 3951, .14, { guc: .02 * z, at: .003 }); ton(g, g.efekt, t + d, 1318.5, .12, { tip: 'triangle', guc: .042 * z, at: .003 }); });
      } else if (id === 'fil') {                                            // minik fil "trompeti": yükselip hafifçe inen nefesli ses
        const s = suzgec(1250, 1.4);
        const o = ton(g, s, t, 330, .5, { tip: 'sawtooth', f2: 640, kay: .15, guc: .2 * z, tut: .85, at: .03 }); o.frequency.exponentialRampToValueAtTime(590, t + .34); o.frequency.exponentialRampToValueAtTime(440, t + .55);
        const u = ton(g, g.efekt, t, 330, .5, { tip: 'triangle', f2: 640, kay: .15, guc: .05 * z, tut: .85, at: .03 }); u.frequency.exponentialRampToValueAtTime(590, t + .34); u.frequency.exponentialRampToValueAtTime(440, t + .55);
        birak(o, s);
      } else [[0, .08], [.14, .17]].forEach(n => [392, 494].forEach(f => { ton(g, g.efekt, t + n[0], f, n[1], { tip: 'triangle', guc: .1 * z, tut: .9, at: .012 }); ton(g, g.efekt, t + n[0], f, n[1], { tip: 'square', guc: .016 * z, tut: .9, at: .015 }); }));   // "dat dat": oyuncak korna
    },
    rakipKorna(g, t) { [330, 415].forEach(f => ton(g, g.efekt, t, f, .1, { tip: 'triangle', guc: .045, tut: .9, at: .012 })); },   // rakip geçerken: kısık, kısa selam
    kavanoz(g, t, k) {                                                      // yıldız kavanoza düştü: cam "tık-çın"; k arttıkça perde yükselir
      const f = mf([84, 86, 88, 91, 93, 96, 98, 100][(k || 0) & 7]);
      ton(g, g.efekt, t, f, .16, { guc: .1, at: .002 }); ton(g, g.efekt, t, f * 2.76, .05, { guc: .018, at: .002 });
      his(g, g.efekt, t, .015, { tip: 'bandpass', f: 5200, q: 2, guc: .04, at: .001 });
    },
    hediye(g, t) {                                                          // hediye kutusu açıldı: kısa, parlak fanfar (~1,2 sn)
      his(g, g.efekt, t, .06, { tip: 'bandpass', f: 1300, f2: 600, q: .9, guc: .1, at: .002 }); ton(g, g.efekt, t, 380, .07, { f2: 160, kay: .05, guc: .1, at: .002 });   // kapak "pat"
      [72, 76, 79, 84].forEach((a, i) => { ton(g, g.can, t + .07 + i * .075, mf(a), .14, { tip: 'triangle', guc: .11 }); ton(g, g.can, t + .07 + i * .075, mf(a + 12), .1, { guc: .03 }); });
      [84, 88, 91].forEach(a => ton(g, g.can, t + .4, mf(a), .5, { tip: 'triangle', guc: .075, tut: .7, at: .01 }));
      ton(g, g.efekt, t + .4, mf(48), .45, { tip: 'triangle', guc: .08, tut: .6 }); ton(g, g.efekt, t + .4, 140, .16, { f2: 55, kay: .09, guc: .1 });
      [96, 100, 103, 108].forEach((a, i) => ton(g, g.can, t + .5 + i * .085, mf(a), .26, { guc: .04 }));
      his(g, g.efekt, t + .4, .5, { f: 5600, guc: .025 });
    },
    sus(g, t, tur) {                                                        // garajda süs takıldı: türe göre küçük, neşeli ses
      if (tur === 'renk') { his(g, g.efekt, t, .2, { tip: 'bandpass', f: 900, f2: 3200, q: 1.1, guc: .09, at: .06 }); [88, 93].forEach((a, i) => ton(g, g.can, t + .14 + i * .08, mf(a), .2, { guc: .08 })); }   // fırça "fış" + iki çın
      else if (tur === 'teker') { [0, .05, .1].forEach((d, i) => ton(g, g.efekt, t + d, 900 + i * 160, .025, { guc: .07, at: .002 })); ton(g, g.can, t + .17, mf(91), .25, { tip: 'triangle', guc: .09 }); }   // cırcır anahtar + tın
      else if (tur === 'bayrak') { his(g, g.efekt, t, .16, { tip: 'bandpass', f: 600, f2: 1500, q: .8, guc: .07, at: .05 }); [91, 96].forEach((a, i) => ton(g, g.can, t + .1 + i * .07, mf(a), .22, { guc: .075 })); }   // dalgalanma + çın
      else if (tur === 'iz') [96, 100, 103, 108, 112].forEach((a, i) => ton(g, g.can, t + i * .05, mf(a), .2, { guc: .05, at: .002 }));   // pırıltı
      else [84, 88, 91].forEach((a, i) => ton(g, g.can, t + i * .06, mf(a), i === 2 ? .28 : .14, { tip: 'triangle', guc: .1 }));
    }
    /*/SES-GARAJ*/
  };
  const sesGUC_ARA = { turbo: .36, kanat: .32, dev: .44, baloncuk: .37, gokkusagi: .25, miknatis: .46 };

  // ---------- Canlı çalma ----------
  let sesGuc = null, sesKornaT = -9, sesRakipT = -9, sesHediyeT = -9, sesSusT = -9, sesKavanozT = -9, sesKavanozK = 0, sesKavanozZ = 0, sesSira = null;
  let mod = null, bekleyen = null, adimNo = 0, sonraki = 0, kisik = false, sonDurum = 'baslik', sonucZ = 0, roketSon = -1, yildizK = 0, yildizSonAn = -9, oncekiSira = 0, gecisT = -9, liderT = -9, rakipInisT = -9;
  let hopBas = -9, hopSon = -9, hopSesT = -9, inisT = -9;
  const canli = () => !!(ac && ac.state === 'running');
  function muzikMod(ad) {
    if (!ac) return;
    if (ad === mod) { bekleyen = null; return; }
    if (ad === 'son') { if (mod === 'yaris') bekleyen = 'son'; return; }   // son tur: ölçü başında geçilir
    const t = ac.currentTime, k = G.muzik.gain;
    mod = ad; bekleyen = null;
    k.cancelScheduledValues(t); k.setValueAtTime(k.value, t); k.setTargetAtTime(0, t, 0.07);   // yumuşak sönüş
    if (ad) { adimNo = 0; sonraki = t + 0.34; k.setValueAtTime(0.0001, sonraki - 0.02); k.linearRampToValueAtTime(MOD[ad].guc * 0.35, sonraki + 0.05); k.linearRampToValueAtTime(MOD[ad].guc, sonraki + 0.9); }   // yumuşak giriş
  }
  function kisAyar() {                                                      // anlatıcı konuşurken müzik ve efektler yumuşakça kısılır
    const k = konusuyor(); if (k === kisik || !ac) return; kisik = k;
    const t = ac.currentTime, mk = G.muzikKis.gain, ek = G.efektKis.gain;
    mk.cancelScheduledValues(t); mk.setValueAtTime(mk.value, t);
    ek.cancelScheduledValues(t); ek.setValueAtTime(ek.value, t);
    mk.setTargetAtTime(k ? 0.25 : 1, t, k ? 0.06 : 0.35);
    ek.setTargetAtTime(k ? 0.5 : 1, t, k ? 0.06 : 0.3);
  }
  function zamanla() {                                                      // ileriye dönük planlayıcı (50 ms'de bir, 0,22 sn ileri)
    if (!canli()) return;
    kisAyar();
    if (sesGuc) {                                                           // etkin sürprizin süren tınısı (bitince ya da yarış dışında kendiliğinden susar)
      const t = ac.currentTime, ara = sesGUC_ARA[sesGuc.tur] || .3;
      if (sonDurum !== 'yaris' || t > sesGuc.son) sesGuc = null;
      else { if (sesGuc.an < t) sesGuc.an = t + .03; while (sesGuc.an < t + .22 && sesGuc.an < sesGuc.son) { E.guc(G, sesGuc.an, sesGuc.tur, sesGuc.n++); sesGuc.an += ara; } }
    }
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
    if (d === 'baslik') hava(null);                                          // seçim ekranında hava sesi yok
    if (d === 'baslik' || d === 'giris' || d === 'sayim') {
      yildizK = 0; yildizSonAn = -9; oncekiSira = 0; gecisT = -9; liderT = -9; roketSon = -1;
      hopBas = -9; hopSon = -9; hopSesT = -9; inisT = -9;
    }
    if (d !== 'yaris') { sesGuc = null; if (d === 'bitis') roketSon = -1; }
    if (d === 'garaj') muzikMod('garaj');
    else if (d === 'baslik' || d === 'giris') muzikMod('baslik');
    else if (d === 'yaris') muzikMod('yaris');
    else { muzikMod(null); if (d === 'bitis') sonucZ = setTimeout(() => { if (sonDurum === 'bitis') muzikMod('sonuc'); }, 3300); }
  }
  const hopSuresi = () => (typeof RAMPA !== 'undefined' && RAMPA.ucus) ? RAMPA.ucus : (sesTema === 'uzay' ? 1.45 : sesTema === 'gokkusagi' ? 1.15 : 0.95);
  function uyandir() { if (ac && !mola && !document.hidden && ac.state !== 'running') { try { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); } catch (_) {} } }
  function anlatimBeklet() {
    if (konusuyor()) devamKayit = simdi;
    if (simdi) { try { simdi.pause(); } catch (_) {} }
    kisAyar();
  }
  function anlatimSurdur() {
    if (mola || document.hidden || !devamKayit) return;
    const a = devamKayit; devamKayit = null;
    if (a !== simdi || a.ended) return;
    try { const p = a.play(); if (p && p.catch) p.catch(() => kisAyar()); } catch (_) {}
    kisAyar();
  }

  function hazirla() {
    if (sessiz) return;
    // Tek anlatım oynatıcısı ilk dokunuşta açılır; sonraki cümleler aynı oynatıcıyı kullanır.
    // Safari'de her cümle için ayrı bir medya öğesini yeniden açma ihtiyacı kalmaz.
    if (!oynatici) {
      for (const k in CUMLE) kayit[k] = 'sesler/' + k + '.mp3';
      sesKaynak = kayit.giris; oynatici = new Audio(sesKaynak); oynatici.preload = 'auto';
      oynatici.addEventListener('ended', () => { const k = sesSira; sesSira = null; if (k) soyle(k); else kisAyar(); });   // sırada bekleyen cümle yoksa müziği geri aç
      oynatici.addEventListener('playing', kisAyar);
      oynatici.addEventListener('pause', kisAyar);
      oynatici.addEventListener('error', () => { const k = sesSira; sesSira = null; if (k) soyle(k); else kisAyar(); });
    }
    if (ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      G = kur(ac, true);
      uyandir();
      setInterval(zamanla, 50);
      if (typeof OLAY !== 'undefined') {
        OLAY.on('durum', durumDegisti);
        OLAY.on('tur', n => {
          const son = (typeof TUR !== 'undefined' ? TUR : 3) - 1;
          if (n === son) muzikMod('son');
          else if (n > 0 && n < son) araSoz(['tur1', 'tur2'], 0.6, 0);         // ara turda bazen kısa bir tezahürat
        });
        OLAY.on('roket', sure => { roketSon = Math.max(roketSon, ac.currentTime + (sure > 0 ? sure : 1.5)); araSoz(['roket2', 'roket3'], 0.25, 25); });
        OLAY.on('seri', o => {
          if (!o) return;
          const hedef = o.hedef > 0 ? o.hedef : 3;
          yildizK = o.odul ? 0 : ((o.adet || 0) % hedef);
          if (o.odul && canli()) {
            const t = ac.currentTime;
            const bas = Math.min(t + 0.28, Math.max(t + 0.012, yildizSonAn + 0.21));
            E.seri(G, bas);
          }
        });
        OLAY.on('hop', o => {
          if (!canli() || (o && o.i !== undefined && o.i !== 0)) return;
          const t = ac.currentTime;
          hopBas = t; hopSon = t + hopSuresi();
          if (t - hopSesT > 0.08) {
            hopSesT = t;
            E.hop(G, t + 0.012, sesTema, !!(sesGuc && sesGuc.tur === 'kanat'));
          }
        });
        OLAY.on('inis', o => {
          if (!canli()) return; const t = ac.currentTime;
          if (!o || o.i === 0) {
            hopSon = t; inisT = t;
            E.inis(G, t + .012, sesTema, !!(sesGuc && sesGuc.tur === 'kanat'));
          } else if (t - rakipInisT > .2) { rakipInisT = t; E.inisRakip(G, t + .012); }
        });
        OLAY.on('araba', id => { if (canli()) { E.secim(G, ac.currentTime + .012); E.araba(G, ac.currentTime + .3, id); } });
        OLAY.on('lider', () => { if (canli() && sonDurum === 'yaris' && ac.currentTime - liderT > 4) { liderT = gecisT = ac.currentTime; E.lider(G, liderT + .1); } });
        OLAY.on('sira', n => {
          if (oncekiSira && n < oncekiSira && canli() && ac.currentTime - gecisT > 4) { E.gecis(G, ac.currentTime + .012); gecisT = ac.currentTime; }
          oncekiSira = n;
        });
        // ---- garaj ve sürprizler (olay hiç gelmese de sorun olmaz) ----
        OLAY.on('surpriz', o => {
          if (!canli() || !o) return; const t = ac.currentTime, sure = o.sure > 0 ? o.sure : 4.5;
          E.balon(G, t + .012, o.tur); sesGuc = { tur: o.tur, bas: t, an: t + .62, son: t + sure - .25, n: 0 };
        });
        OLAY.on('surprizBitti', o => { const vardi = sesGuc; sesGuc = null; if (canli() && vardi && sonDurum === 'yaris') E.gucBitti(G, ac.currentTime + .012, (o && o.tur) || vardi.tur); });
        OLAY.on('gecti', () => {                                              // Feza bir rakibi geçti: Feza'nın seçili kornası
          if (!canli() || sonDurum !== 'yaris' || ac.currentTime - sesKornaT < 1.5) return;
          let id = 'dat'; try { if (typeof GARAJ !== 'undefined') id = GARAJ.secili('korna') || 'dat'; } catch (_) {}
          sesKornaT = gecisT = ac.currentTime; E.korna(G, sesKornaT + .05, id);
        });
        OLAY.on('gecildi', () => { if (canli() && sonDurum === 'yaris' && ac.currentTime - sesRakipT > 2 && ac.currentTime - sesKornaT > .9) { sesRakipT = ac.currentTime; E.rakipKorna(G, sesRakipT + .05); } });
        OLAY.on('garaj', o => { if (o) { if (o.tur === 'korna') efekt.korna(o.id); else efekt.sus(o.tur); } });
        OLAY.on('hediye', () => efekt.hediye());
        OLAY.on('kavanoz', o => {                                             // arayüz yıldız başına SES.efekt.kavanoz() çağırmazsa: sonuç ekranı gelince kısa bir dolma sesi
          if (!o || !(o.sonra > o.once || o.hediye)) return;
          const isaret = sesKavanozT; clearTimeout(sesKavanozZ);
          sesKavanozZ = setTimeout(() => {
            if (!canli() || sesKavanozT !== isaret || sonDurum !== 'bitis') return;
            const t = ac.currentTime, n = 3 + Math.round(4 * Math.max(0, Math.min(1, o.hediye ? 1 : o.sonra - o.once)));
            for (let i = 0; i < n; i++) E.kavanoz(G, t + .02 + i * .1, i);
            sesKavanozT = t;
          }, 3600);
        });
      }
      muzikMod('baslik');
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { try { const p = ac.suspend(); if (p && p.catch) p.catch(() => {}); } catch (_) {} anlatimBeklet(); }
        else { uyandir(); anlatimSurdur(); }
      });
      document.addEventListener('click', e => { const b = e.target && e.target.closest && e.target.closest('button'); if (b && b.id !== 'hizlan') { if (b.classList.contains('pist-kart')) efekt.kart(); else efekt.tik(); } }, true);
    } catch (e) { ac = null; G = null; }
  }
  // iPad: ses ilk dokunuşta açılır; sonradan kesilirse (arama, kilit) bir sonraki dokunuşta geri gelir
  if (!sessiz) for (const ad of ['pointerup', 'touchend', 'click', 'keydown']) addEventListener(ad, () => { if (!ac) hazirla(); else uyandir(); }, true);

  const sesSIRALI = { garaj_gir: 1, hediye_var: 1, hediye_acildi: 1, surpriz: 1 };
  const sonCesit = {};
  function cesit(k) {                                                       // havuzdan son çalınandan farklı bir cümle
    const ad = /^ovgu\d$/.test(k) ? 'ovgu' : k, h = CESIT[ad];
    if (!h) return k;
    const once = sonCesit[ad] || [], uygun = h.filter(x => once.indexOf(x) < 0 && kayit[x]);
    const sec = uygun.length ? uygun[(Math.random() * uygun.length) | 0] : k;
    sonCesit[ad] = once.concat(sec).slice(-Math.min(3, h.length - 1));
    return sec;
  }
  function soyle(k) {
    if (sessiz) return;
    k = cesit(k);
    if (!kayit[k]) return;
    // Garaj/hediye/sürpriz cümleleri konuşan cümleyi kesmez: sıraya girer (tek yer), önceki bitince söylenir.
    const suren = konusuyor() || !!devamKayit;
    if (k === 'garaj_kilit' && suren && sesKaynak === kayit[k]) return;       // kilitli kutuya art arda dokunma: cümle baştan başlamasın
    if (sesSIRALI[k] && suren && !(k === 'hediye_acildi' && sesKaynak === kayit.hediye_var)) { sesSira = k; return; }
    sesSira = null;
    devamKayit = null;
    try {
      if (simdi) simdi.pause();
      simdi = oynatici;
      if (sesKaynak !== kayit[k]) { sesKaynak = kayit[k]; simdi.src = sesKaynak; }
      simdi.currentTime = 0;
      if (mola || document.hidden) devamKayit = simdi;
      else { const p = simdi.play(); if (p && p.catch) p.catch(() => kisAyar()); }
    } catch (e) { /* ses çalınamadı */ }
    kisAyar();
  }
  // Ara sıra söylenen kısa söz: yalnız yarışta, kimse konuşmuyorken, olasılıkla ve en az `ara` sn arayla (övgü her seferinde değil).
  let araSozT = -99;
  function araSoz(liste, olasilik, ara) {
    if (sessiz || !ac || sonDurum !== 'yaris' || konusuyor() || mola || document.hidden) return;
    const t = ac.currentTime;
    if (t - araSozT < Math.max(ara, 12) || Math.random() > olasilik) return;
    araSozT = t; const k = liste[(Math.random() * liste.length) | 0];
    if (kayit[k]) soyle(k);
  }
  function konusuyor() { return !!(simdi && !simdi.paused && !simdi.ended); }
  function sus() { devamKayit = null; sesSira = null; if (simdi) { try { simdi.pause(); } catch (e) { /* yok */ } } kisAyar(); }
  const cal = ad => function () { if (canli()) E[ad](G, ac.currentTime + 0.012); };
  const efekt = {
    yildiz() {                                                              // 3'lü seri boyunca yükselen melodi (1 -> 2 -> 3)
      if (!canli()) return;
      const simdiT = ac.currentTime;
      const t = Math.min(simdiT + 0.13, Math.max(simdiT + 0.012, yildizSonAn + 0.06));
      yildizSonAn = t;
      const adim = yildizK % 3;
      yildizK = (adim + 1) % 3;
      E.yildiz(G, t, adim, sesTema, !!(sesGuc && sesGuc.tur === 'miknatis'));
    },
    roket() {
      if (!canli()) return;
      const simdiT = ac.currentTime;
      const t = yildizSonAn > simdiT + 0.02 ? Math.min(simdiT + 0.15, yildizSonAn + 0.04) : simdiT + 0.012;
      E.roket(G, t);
    },
    hop() {
      if (!canli()) return;
      const t = ac.currentTime;
      hopBas = t; hopSon = t + hopSuresi(); hopSesT = t;
      E.hop(G, t + 0.012, sesTema, !!(sesGuc && sesGuc.tur === 'kanat'));
    },
    balon(tur) { if (canli()) E.balon(G, ac.currentTime + .012, tur); },
    korna(id) {                                                             // id verilmezse Feza'nın seçili kornası
      if (!canli()) return; const t = ac.currentTime; if (t - sesKornaT < .25) return;
      if (!id) { id = 'dat'; try { if (typeof GARAJ !== 'undefined') id = GARAJ.secili('korna') || 'dat'; } catch (_) {} }
      sesKornaT = t; E.korna(G, t + .012, id);
    },
    kavanoz() {                                                             // art arda düşen yıldızlarda perde yükselir
      if (!canli()) return; const t = ac.currentTime; if (t - sesKavanozT < .04) return;
      sesKavanozK = t - sesKavanozT < 1.2 ? sesKavanozK + 1 : 0; sesKavanozT = t; E.kavanoz(G, t + .012, sesKavanozK);
    },
    hediye() { if (!canli()) return; const t = ac.currentTime; if (t - sesHediyeT < .6) return; sesHediyeT = t; E.hediye(G, t + .012); },
    sus(tur) { if (!canli()) return; const t = ac.currentTime; if (t - sesSusT < .15 || t - sesHediyeT < 1.3) return; sesSusT = t; E.sus(G, t + .012, tur); },   // hediye fanfarının üstüne binmez
    tok: cal('tok'), bip: cal('bip'), git: cal('git'), tur: cal('tur'), bitis: cal('bitis'), tik: cal('tik'), secim: cal('secim'), kart: cal('kart')
  };
  function motorAyar(hiz, acik) {
    if (!canli() || !G || !G.motor) return;
    const t = ac.currentTime, m = G.motor, v = Math.max(0, Number.isFinite(hiz) ? hiz : 0);
    const r = Math.max(0, Math.min(1, (roketSon - t) / 0.35));
    const gAktif = sesGuc && t >= sesGuc.bas && t <= sesGuc.son;
    const gZarf = gAktif ? Math.min(1, Math.max(0, (t - sesGuc.bas) / 0.25), Math.max(0, (sesGuc.son - t) / 0.35)) : 0;
    const turbo = gAktif && sesGuc.tur === 'turbo' ? gZarf : 0;
    const kanat = gAktif && sesGuc.tur === 'kanat' ? gZarf : 0;
    const gok = gAktif && sesGuc.tur === 'gokkusagi' ? gZarf : 0;
    const boost = Math.max(r, turbo, gok * 0.7);
    const havada = hopSon > t && hopSon > hopBas;
    const havaU = havada ? Math.max(0, Math.min(1, (t - hopBas) / (hopSon - hopBas))) : 0;
    const havaYay = havada ? Math.sin(havaU * Math.PI) : 0;
    const inisK = inisT > 0 && t >= inisT ? Math.max(0, Math.min(1, 1 - (t - inisT) / 0.32)) : 0;

    // Sıcak oyuncak motor mırıltısı: hız, havalanma, turbo ve inişte yumuşak ve dolgun geçişler
    const f = (86 + v * 3.05) * (1 + 0.26 * boost + 0.14 * havaYay + 0.06 * kanat - 0.06 * inisK);
    const kayma = havada ? 0.08 : 0.09;
    m.o1.frequency.setTargetAtTime(f, t, kayma);
    m.o2.frequency.setTargetAtTime(f * 2.004, t, kayma);
    m.lfo.frequency.setTargetAtTime(Math.max(4, 9 + v * 0.26 + 5.5 * boost - 2.5 * kanat * (1 - boost)), t, 0.14);
    if (m.lfoK) m.lfoK.gain.setTargetAtTime(0.22 * (1 - 0.55 * havaYay - 0.35 * kanat + 0.18 * inisK), t, 0.1);
    m.suz.frequency.setTargetAtTime(580 + v * 10.5 + 560 * boost + 220 * havaYay + 260 * inisK, t, 0.11);   // tizi yumuşak: iPad hoparlörünü yormaz
    m.suz.Q.setTargetAtTime(0.68 + 0.26 * boost + 0.28 * inisK, t, 0.12);
    const motorGuc = acik
      ? (0.032 + Math.min(0.022, v * 0.00075) + 0.015 * boost + 0.008 * inisK) * (1 - 0.16 * havaYay)
      : 0;
    m.kazanc.gain.setTargetAtTime(motorGuc, t, inisK > 0.5 ? 0.04 : 0.11);

    // Zıplama ve kanat süzülüşünde yumuşak rüzgâr akışı modülasyonu
    if (m.ruzgar) {
      const ruzgarF = 440 + v * 12 + 720 * havaYay + 320 * kanat + 380 * boost;
      const ruzgarGuc = acik
        ? (havaYay * (0.024 + 0.018 * kanat + 0.012 * boost) + kanat * 0.012 + turbo * 0.01)
        : 0;
      m.ruzgar.suz.frequency.setTargetAtTime(ruzgarF, t, 0.07);
      m.ruzgar.k.gain.setTargetAtTime(ruzgarGuc, t, havada ? 0.06 : 0.12);
    }
  }
  // Hava sesi: hafif, sürekli hışırtı (gürültü + süzgeç, düşük düzey). tur: 'yagmur' | 'ruzgar' | 'kar' | null (kapat); guc 0..1.
  // Kare başına çağrılabilir: düğümler bir kez kurulur, yalnız düzey yumuşakça değişir.
  const HAVA = { yagmur: { tip: 'bandpass', f: 2600, q: 0.45, d: 0.05, lfo: 0.3, lfoD: 500 }, ruzgar: { tip: 'bandpass', f: 520, q: 1.6, d: 0.06, lfo: 0.13, lfoD: 260 }, kar: { tip: 'bandpass', f: 4200, q: 0.7, d: 0.018, lfo: 0.09, lfoD: 900 } };
  let havaDugum = null, havaTur = null;
  function hava(tur, guc) {
    if (sessiz || !ac || !G) return;
    const t = ac.currentTime, o = HAVA[tur];
    if (havaDugum && (havaTur !== tur || !o)) {                             // eskisini yavaşça söndür
      const h = havaDugum; havaDugum = null; havaTur = null;
      h.k.gain.setTargetAtTime(0, t, 0.4); setTimeout(() => { try { h.kay.stop(); h.lfo.stop(); h.kay.disconnect(); h.k.disconnect(); } catch (_) {} }, 2500);
    }
    if (!o) return;
    if (!havaDugum) {
      const kay = ac.createBufferSource(), suz = ac.createBiquadFilter(), alt = ac.createBiquadFilter(), k = ac.createGain(), lfo = ac.createOscillator(), lk = ac.createGain();
      kay.buffer = G.gurultu; kay.loop = true; suz.type = o.tip; suz.frequency.value = o.f; suz.Q.value = o.q;
      alt.type = 'lowpass'; alt.frequency.value = tur === 'ruzgar' ? 1400 : 7000;
      lfo.frequency.value = o.lfo; lk.gain.value = o.lfoD; lfo.connect(lk); lk.connect(suz.frequency);   // rüzgâr gibi yavaş dalgalanma
      k.gain.value = 0; kay.connect(suz); suz.connect(alt); alt.connect(k); k.connect(G.hava);
      kay.start(); lfo.start(); havaDugum = { kay, lfo, k }; havaTur = tur;
    }
    havaDugum.k.gain.setTargetAtTime(o.d * Math.max(0, Math.min(1, guc == null ? 1 : guc)), t, 0.5);
  }
  function durdur(d) {
    mola = !!d;
    if (ac) { if (d) { try { const p = ac.suspend(); if (p && p.catch) p.catch(() => {}); } catch (_) {} } else uyandir(); }
    if (d) anlatimBeklet(); else anlatimSurdur();
  }
  return { hazirla, soyle, sus, konusuyor, efekt, motorAyar, durdur, hava, sessiz, CUMLE, _ic: { kur, adim, E, HAVA, MOD, ADIM, MEL, DIZI, NOTA, SES_B, SES_BPM, SES_Z, SES_TEMALAR, sesModlar, tema: sesTema, sesGUC_ARA } };
})();
