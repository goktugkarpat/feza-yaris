/* Müzik Diyarı pistinin çevresi (yalnız ?pist=muzik iken yüklenir, cevre.js'ten sonra).
   Zemin tek tuval dokusu (1024): sıcak nane ve tereyağı kremi çayır, koyu mor dizek şeritleri, plak meydanları ve temas gölgeleri.
   Manzara anları: dev kuyruklu piyano sahnesi · gökkuşağı ksilofon kemerleri · bagetli ve titreşen derili dev davullar ·
   altın pirinç trompet kemerleri · dev arp ve sarkaçlı metronomlar · gökkuşağı etiketli ve hareketli kollu dev plak meydanları ·
   yakın ve parlak 3B notalar / altın sol anahtarları · derin lavanta tepeler ve parlayan çan ağaçları.
   Yeni üst düzey adlar `mz` ile başlar. Kare başına yeni nesne yok; ışık eklenmez; gölge haritası yok. */
'use strict';

const mzYer = {};
let mzBulut = null;
const mzDavul = [];   // { g, head, b1, b2, y0, f, s }
const mzNota = [];    // { m, y0, f }
const mzSol = [];     // { m, y0, f }
const mzSarkac = [];  // { m, f }
const mzPlak = [];    // { m, kol, ry0, f, yon }

function cevreEkGuncelle(dt, t) {
  if (mzBulut) mzBulut.rotation.y = t * 0.004;
  for (let i = 0; i < mzDavul.length; i++) {
    const d = mzDavul[i];
    const s1 = Math.sin(t * 4.4 + d.f);
    const s2 = Math.sin(t * 4.4 + d.f + Math.PI);
    const hit1 = s1 > 0 ? s1 : 0;
    const hit2 = s2 > 0 ? s2 : 0;
    const p = Math.pow(hit1 > hit2 ? hit1 : hit2, 4);
    d.g.position.y = d.y0 + p * 0.48;
    d.g.scale.set(d.s * (1 + p * 0.07), d.s * (1 - p * 0.06), d.s * (1 + p * 0.07));
    d.head.scale.y = 1 + p * 0.55;
    d.b1.rotation.z = -0.32 + hit1 * 0.62;
    d.b2.rotation.z = 0.32 - hit2 * 0.62;
  }
  for (let i = 0; i < mzNota.length; i++) {
    const n = mzNota[i];
    n.m.position.y = n.y0 + Math.sin(t * 1.9 + n.f) * 0.85;
    n.m.rotation.y = n.f + t * 0.55;
    n.m.rotation.z = Math.sin(t * 1.3 + n.f) * 0.14;
  }
  for (let i = 0; i < mzSol.length; i++) {
    const g = mzSol[i];
    g.m.position.y = g.y0 + Math.sin(t * 1.4 + g.f) * 0.72;
    g.m.rotation.y = g.f + Math.sin(t * 0.7 + g.f) * 0.45 + t * 0.24;
  }
  for (let i = 0; i < mzSarkac.length; i++) {
    const s = mzSarkac[i];
    s.m.rotation.z = Math.sin(t * 2.8 + s.f) * 0.46;
  }
  for (let i = 0; i < mzPlak.length; i++) {
    const p = mzPlak[i];
    p.m.rotation.y = t * 0.52 * p.yon;
    if (p.kol) p.kol.rotation.y = p.ry0 + Math.sin(t * 0.85 + p.f) * 0.13;
  }
}

if (cvTema === 'muzik') {
  scene.fog.color.setHex(0xdad0ff); scene.fog.near = 250; scene.fog.far = 860;
  gunes.color.setHex(0xfff1d4); gunes.intensity = 1.38;
  { // gök: canlı gök mavisinden derin periwinkle-lavantaya ve sıcak şeftali-tereyağı ufka geçiş
    const c = scene.background.image, g = c.getContext('2d'), h = c.height, gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#3b8eea');
    gr.addColorStop(0.16, '#6ab5f8');
    gr.addColorStop(0.30, '#aba2ff');
    gr.addColorStop(0.42, '#f0b6df');
    gr.addColorStop(0.50, '#ffe0c2');
    gr.addColorStop(1, '#ffe0c2');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, h); scene.background.needsUpdate = true;
  }
  cvGokIsik.color.setHex(0xffffff); cvGokIsik.groundColor.setHex(0xc8bae8); cvGokIsik.intensity = 1.16;

  let mzT = 51423;
  const Rm = () => { mzT = (mzT * 1664525 + 1013904223) >>> 0; return mzT / 4294967296; };

  let mx = 0, mz = 0;
  for (let i = 0; i < N; i++) { mx += PX[i] / N; mz += PZ[i] / N; }
  const mzIc = (x, z) => {
    let ic = false;
    for (let i = 0, j = N - 4; i < N; j = i, i += 4) {
      const xi = PX[i], zi = PZ[i], xj = PX[j], zj = PZ[j];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) ic = !ic;
    }
    return ic;
  };
  const mzDis = i => { const p = cvKenar(i, 1, 40); return mzIc(p.x, p.z) ? -1 : 1; };

  const yer = (f, dis, uz, r, bos) => {
    for (let k = 0; k < 14; k++) {
      const i = cvI(f + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.007);
      const yan = mzDis(i) * dis;
      const p = cvKenar(i, yan, uz, 0.25);
      const d = yakin(p.x, p.z);
      if (d > (bos || YARI + r + 2) && cvBos(p.x, p.z, r)) {
        cvYasak.push([p.x, p.z, r]);
        return { x: p.x, z: p.z, ry: p.ry, i, yan };
      }
    }
    return null;
  };

  const S = cvYapi();
  const golge = [];    // [x, z, rx, rz, alpha]
  const meydan = [];   // [x, z, r, renk]

  const GOKKUSAGI = [0xff5e73, 0xff9a44, 0xffd94a, 0x52d681, 0x45bfff, 0x7284ff, 0xb878ff, 0xff85c8];
  const ALTIN = 0xffcf42, PIRINC = 0xf0b22e, KREM = 0xfff8ea, AHSAP = 0xbe7f4a, KOYU = 0x462f59, LAVANTA = 0xa988ff, NANE = 0x6cdba8;
  const PIYANO_SIYAH = 0x1e182e, TUS_BEYAZ = 0xfffdf8, TUS_SIYAH = 0x14101f;

  // ───────── 1) Dev Kuyruklu Piyano Sahnesi (erken virajlarda başkahraman anıt) ─────────
  {
    const p = yer(0.095, 1, YARI + 18, 13.5, YARI + 11);
    if (p) {
      const sc = 1.25;
      S.yer(p.x, p.z, p.ry, sc);
      // Yükseltilmiş tereyağı-lavanta sahne platformu + altın çerçeve + merdiven
      S.ekle(cvG.sil, 0, 0.38, 0, 9.8, 0.76, 9.8, 0xf7ebd2);
      S.ekle(cvG.sil, 0, 0.79, 0, 10.1, 0.14, 10.1, ALTIN);
      S.ekle(cvG.sil, 0, 0.14, 0, 10.4, 0.28, 10.4, 0x7e64c4);
      S.ekle(cvG.kutuY, 0, 0.22, 9.9, 5.2, 0.44, 1.8, 0xffe4a8);
      S.ekle(cvG.kutuY, 0, 0.46, 9.2, 4.6, 0.46, 1.2, 0xfff3d8);

      // Piyano ayakları ve altın pedal liri
      for (const [lx, lz] of [[-3.1, 2.2], [3.1, 2.2], [0.6, -3.5]]) {
        S.ekle(cvG.sil, lx, 1.85, lz, 0.34, 2.1, 0.34, PIYANO_SIYAH);
        S.ekle(cvG.kureK, lx, 0.92, lz, 0.32, 0.24, 0.32, ALTIN);
      }
      S.ekle(cvG.kutuY, 0, 1.75, 1.8, 0.9, 1.7, 0.22, ALTIN);
      for (let pd = -1; pd <= 1; pd++) S.ekle(cvG.kutu, pd * 0.25, 0.94, 2.05, 0.14, 0.1, 0.42, PIRINC);

      // Kuyruklu piyano gövdesi (ön klavye kutusu + kıvrımlı kuyruk)
      S.ekle(cvG.kutuY, 0, 3.35, 1.6, 7.2, 1.15, 2.9, PIYANO_SIYAH);
      S.ekle(cvG.sil, -1.0, 3.35, -1.2, 3.1, 1.15, 3.1, PIYANO_SIYAH);
      S.ekle(cvG.sil, 0.9, 3.35, -2.9, 2.35, 1.15, 2.35, PIYANO_SIYAH);
      S.ekle(cvG.kutuY, -2.55, 3.35, -0.4, 2.1, 1.15, 2.6, PIYANO_SIYAH);
      // Altın iç ses tahtası ve teller
      S.ekle(cvG.sil, -0.4, 3.94, -1.1, 2.6, 0.08, 2.7, 0xe8b948);
      for (let st = 0; st < 7; st++) {
        S.ekle(cvG.sil3, -2.2 + st * 0.7, 4.02, -0.7, 0.03, 4.0 - st * 0.22, 0.03, ALTIN, Math.PI / 2, 0.12);
      }

      // Parlak beyaz ve siyah tuşlar (14 beyaz + 10 siyah)
      S.ekle(cvG.kutuY, 0, 3.05, 3.05, 6.8, 0.28, 1.35, PIYANO_SIYAH);
      for (let k = 0; k < 14; k++) {
        const kx = -3.0 + k * 0.46;
        S.ekle(cvG.kutu, kx, 3.24, 3.22, 0.4, 0.18, 1.05, TUS_BEYAZ);
        const mod = k % 7;
        if (k < 13 && mod !== 2 && mod !== 6) {
          S.ekle(cvG.kutu, kx + 0.23, 3.36, 2.95, 0.24, 0.2, 0.62, TUS_SIYAH);
        }
      }

      // Nota sehpası ve açık nota defteri
      S.ekle(cvG.kutuY, 0, 4.45, 2.15, 3.2, 1.25, 0.14, PIYANO_SIYAH, -0.22);
      S.ekle(cvG.kutu, -0.72, 4.52, 2.24, 1.25, 0.95, 0.06, KREM, -0.22, 0.08);
      S.ekle(cvG.kutu, 0.72, 4.52, 2.24, 1.25, 0.95, 0.06, KREM, -0.22, -0.08);
      for (let ln = 0; ln < 3; ln++) {
        S.ekle(cvG.kutu, -0.72, 4.35 + ln * 0.18, 2.28, 0.9, 0.04, 0.03, KOYU, -0.22, 0.08);
        S.ekle(cvG.kutu, 0.72, 4.35 + ln * 0.18, 2.28, 0.9, 0.04, 0.03, KOYU, -0.22, -0.08);
      }

      // Açık duran dev piyano kapağı + altın destek çubuğu
      S.ekle(cvG.kutuY, -0.8, 5.15, -0.2, 5.4, 0.18, 4.8, PIYANO_SIYAH, 0, 0, -0.46);
      S.ekle(cvG.sil, -1.0, 5.05, -0.2, 2.8, 0.16, 2.8, PIYANO_SIYAH, 0, 0, -0.46);
      S.ekle(cvG.sil, 1.65, 4.95, 1.0, 0.09, 2.4, 0.09, ALTIN, 0, 0, -0.18);

      // Piyano taburesi (koyu mor + pembe minder)
      S.ekle(cvG.kutuY, 0, 1.85, 4.85, 2.6, 0.25, 1.25, 0xff6f7d);
      S.ekle(cvG.kutuY, 0, 1.68, 4.85, 2.7, 0.16, 1.35, KOYU);
      for (const [bx, bz] of [[-1.1, 4.35], [1.1, 4.35], [-1.1, 5.35], [1.1, 5.35]]) {
        S.ekle(cvG.sil, bx, 1.25, bz, 0.14, 0.85, 0.14, KOYU);
      }

      golge.push([p.x, p.z, 12.2 * sc, 12.2 * sc, 0.28]);
      meydan.push([p.x, p.z, 11.2 * sc, 0xa988ff]);
      mzYer.piyano = [p.x, p.z, p.i];
    }
  }

  // ───────── 2) Dev Gökkuşağı Ksilofon Kemerleri (erken virajda görkemli köprü) ─────────
  {
    const spots = [
      [0.165, -1, YARI + 16, 1.32],
      [0.40, 1, YARI + 17, 1.24],
      [0.65, -1, YARI + 17, 1.22],
      [0.88, 1, YARI + 16, 1.18]
    ];
    for (let idx = 0; idx < spots.length; idx++) {
      const [f, dis, uz, sc] = spots[idx];
      const p = yer(f, dis, uz, 13 * sc, YARI + 11);
      if (!p) continue;
      S.yer(p.x, p.z, p.ry, sc);
      S.ekle(cvG.yarim, 0, -0.3, 0, 11.2, 2.6, 6.4, idx % 2 ? 0x92e3be : 0xb5a8ff);
      // Kemer ayakları ve kavisli ahşap raylar
      for (const z of [-2.25, 2.25]) {
        S.ekle(cvG.kutuY, -3.9, 2.25, z, 8.4, 0.56, 0.5, AHSAP, 0, 0, 0.32);
        S.ekle(cvG.kutuY, 3.9, 2.25, z, 8.4, 0.56, 0.5, AHSAP, 0, 0, -0.32);
        S.ekle(cvG.kutuY, -7.2, 0.85, z, 0.72, 1.8, 0.75, KOYU);
        S.ekle(cvG.kutuY, 7.2, 0.85, z, 0.72, 1.8, 0.75, KOYU);
      }
      // 8 gökkuşağı tuşu + alt rezonatör boruları
      for (let k = 0; k < 8; k++) {
        const u = (k - 3.5) / 3.5;
        const x = u * 6.0;
        const y = 3.7 - u * u * 2.15;
        const rz = -u * 0.28;
        const len = 5.2 - k * 0.14;
        S.ekle(cvG.kutuY, x, y, 0, 1.24, 0.38, len, GOKKUSAGI[k], 0, 0, rz);
        // Altta altın rezonatör borusu
        const tubH = 1.65 - k * 0.1;
        S.ekle(cvG.sil, x, y - 0.25 - tubH * 0.5, 0, 0.28, tubH, 0.28, ALTIN);
        for (const pz of [-len * 0.36, len * 0.36]) S.ekle(cvG.sil, x, y + 0.22, pz, 0.14, 0.1, 0.14, KREM);
      }
      // İki dev renkli ksilofon tokmağı
      for (const [mx0, mz0, ry0, col] of [[-2.4, 3.5, 0.45, 0xff5e73], [2.5, -3.5, -2.55, 0x45bfff]]) {
        S.ekle(cvG.sil, mx0, 3.4, mz0, 0.15, 5.2, 0.15, KREM, 0.48, ry0, 0.26);
        S.ekle(cvG.kure, mx0 - 0.35, 5.45, mz0 - 0.95, 0.68, 0.68, 0.68, col);
      }
      golge.push([p.x, p.z, 12.6 * sc, 7.6 * sc, 0.25]);
      if (!idx) mzYer.ksilofon = [p.x, p.z, p.i];
    }
  }

  // ───────── 3) Bagetli, Zıplayan ve Titreşen Derili Dev Davullar ─────────
  {
    // Paylaşımlı baget geometrisi (orijin tutma ucunda; +X yönüne uzanır)
    const B = cvYapi();
    B.ekle(cvG.sil, 1.25, 0, 0, 0.085, 2.5, 0.085, AHSAP, 0, 0, Math.PI / 2);
    B.ekle(cvG.kureK, 2.52, 0, 0, 0.22, 0.22, 0.22, 0xff5e73);
    const bagetGeo = B.geo();
    const bagetMat = cvMalz(0);

    // Paylaşımlı titreşen davul derisi (orijin tam deri merkezinde)
    const H = cvYapi();
    H.ekle(cvG.sil, 0, 0.03, 0, 2.15, 0.08, 2.15, KREM);
    H.ekle(cvG.sil, 0, 0.075, 0, 0.85, 0.02, 0.85, ALTIN);
    const headGeo = H.geo();

    const davulRenk = [0xff5e73, 0x45bfff, 0xb878ff, 0xffd94a, 0x52d681, 0xff85c8];
    const davulF = [0.12, 0.28, 0.46, 0.59, 0.75, 0.91];
    for (let k = 0; k < davulF.length; k++) {
      const p = yer(davulF[k], k % 2 ? 1 : -1, YARI + 11.5 + (k % 3) * 2.5, 6.2);
      if (!p) continue;
      const sc = 1.48 + (k % 3) * 0.16;
      const renk = davulRenk[k % davulRenk.length];

      // Her davulun gövdesi kendi saf renginde + parlak pirinç kasnaklar (renk karışması yok)
      const D = cvYapi();
      D.ekle(cvG.sil, 0, 1.35, 0, 2.25, 2.4, 2.25, renk);
      D.ekle(cvG.sil, 0, 2.56, 0, 2.34, 0.2, 2.34, PIRINC);
      D.ekle(cvG.sil, 0, 0.16, 0, 2.34, 0.2, 2.34, PIRINC);
      for (let j = 0; j < 8; j++) {
        const a = j / 8 * Math.PI * 2;
        D.ekle(cvG.sil5, Math.cos(a) * 2.3, 1.35, Math.sin(a) * 2.3, 0.08, 2.35, 0.08, KREM, 0.12 * Math.sin(a), 0, -0.12 * Math.cos(a));
      }
      const g = new T.Group();
      g.position.set(p.x, 0, p.z);
      g.rotation.y = p.ry;
      g.scale.setScalar(sc);

      const body = new T.Mesh(cvTon(D.geo()), cvMalz(0));
      g.add(body);

      const head = new T.Mesh(headGeo, bagetMat);
      head.position.set(0, 2.62, 0);
      g.add(head);

      const b1 = new T.Mesh(bagetGeo, bagetMat);
      b1.position.set(-2.55, 3.15, 0.38);
      b1.rotation.y = -0.18;
      g.add(b1);

      const b2 = new T.Mesh(bagetGeo, bagetMat);
      b2.position.set(2.55, 3.15, -0.38);
      b2.rotation.y = Math.PI - 0.18;
      g.add(b2);

      scene.add(g);
      mzDavul.push({ g, head, b1, b2, y0: 0, f: k * 1.15, s: sc });
      golge.push([p.x, p.z, 3.6 * sc, 3.6 * sc, 0.28]);
      if (!k) mzYer.davul = [p.x, p.z, p.i];
    }
  }

  // ───────── 4) Altın Pirinç Trompet Kemerleri ve Sütunları ─────────
  {
    const kemerF = [0.23, 0.54, 0.80];
    for (let idx = 0; idx < kemerF.length; idx++) {
      const p = yer(kemerF[idx], idx % 2 ? -1 : 1, YARI + 13, 8.5, YARI + 9);
      if (!p) continue;
      S.yer(p.x, p.z, p.ry, 1.24);
      for (const yan of [-1, 1]) {
        const x = yan * 3.2;
        S.ekle(cvG.sil, x, 0.4, 0, 1.15, 0.8, 1.15, LAVANTA);
        S.ekle(cvG.sil, x, 3.6, 0, 0.36, 6.2, 0.36, ALTIN);
        S.ekle(cvG.koni, x, 6.9, 0, 1.5, 1.95, 1.5, PIRINC, Math.PI);
        S.ekle(cvG.sil, x, 7.85, 0, 1.56, 0.2, 1.56, ALTIN);
        for (let v = 0; v < 3; v++) {
          S.ekle(cvG.sil, x - yan * 0.5, 3.2 + v * 0.65, 0, 0.17, 0.52, 0.17, KREM, 0, 0, Math.PI / 2);
          S.ekle(cvG.kureK, x - yan * 0.8, 3.2 + v * 0.65, 0, 0.16, 0.16, 0.16, GOKKUSAGI[v * 2]);
        }
      }
      const kemer = new T.TorusGeometry(3.2, 0.26, 7, 16, Math.PI);
      S.ekle(kemer, 0, 7.7, 0, 1, 1, 1, ALTIN);
      S.ekle(cvG.okt, 0, 11.25, 0, 0.95, 1.2, 0.95, GOKKUSAGI[idx * 2 % 8]);
      golge.push([p.x - 3.2, p.z, 2.3, 2.3, 0.24]);
      golge.push([p.x + 3.2, p.z, 2.3, 2.3, 0.24]);
    }
  }

  // ───────── 5) Dev Arp ve Sallanan Sarkaçlı Metronom Anıtları ─────────
  {
    for (const [f, dis] of [[0.34, 1], [0.71, -1]]) {
      const p = yer(f, dis, YARI + 14, 7.5);
      if (!p) continue;
      S.yer(p.x, p.z, p.ry + 0.3, 1.32);
      S.ekle(cvG.kutuY, 0, 0.35, 0, 4.9, 0.7, 2.3, KOYU);
      S.ekle(cvG.sil, -1.9, 4.4, 0, 0.3, 7.8, 0.3, ALTIN);
      S.ekle(cvG.kutuY, 1.35, 3.7, 0, 0.58, 7.4, 0.92, AHSAP, 0, 0, 0.33);
      S.ekle(cvG.kutuY, -0.05, 8.1, 0, 4.2, 0.5, 0.48, ALTIN, 0, 0, -0.18);
      S.ekle(cvG.kureK, -1.9, 8.5, 0, 0.52, 0.52, 0.52, PIRINC);
      for (let t = 0; t < 7; t++) {
        const tx = -1.35 + t * 0.48;
        const h = 7.4 - t * 0.42;
        S.ekle(cvG.sil3, tx, 0.7 + h * 0.5, 0, 0.035, h, 0.035, KREM);
      }
      golge.push([p.x, p.z, 5.8, 3.6, 0.25]);
      mzYer.arp = [p.x, p.z, p.i];
    }

    const M = cvYapi();
    M.ekle(cvG.sil, 0, 3.4, 0, 0.11, 6.8, 0.11, ALTIN);
    M.ekle(cvG.kutuY, 0, 5.1, 0.08, 0.9, 1.0, 0.3, 0xff5e73);
    M.ekle(cvG.kureK, 0, 6.85, 0, 0.28, 0.28, 0.28, ALTIN);
    const sarkacGeo = M.geo();
    const sarkacMat = cvMalz(0);
    for (let k = 0; k < 3; k++) {
      const p = yer(0.19 + k * 0.31, k % 2 ? 1 : -1, YARI + 13, 6.5);
      if (!p) continue;
      const sc = 1.32;
      S.yer(p.x, p.z, p.ry, sc);
      S.ekle(cvG.kutuY, 0, 0.35, 0, 3.6, 0.7, 2.8, KOYU);
      S.ekle(cvG.govde, 0, 3.9, 0, 1.85, 6.6, 1.4, 0x8767dc);
      S.ekle(cvG.kutuY, 0, 3.7, 0.62, 1.35, 4.8, 0.22, KREM);
      S.ekle(cvG.kutu, 0, 4.0, 0.74, 0.1, 4.2, 0.04, KOYU);
      const sm = new T.Mesh(sarkacGeo, sarkacMat);
      sm.position.set(p.x, 1.2 * sc, p.z);
      sm.rotation.y = p.ry;
      sm.scale.setScalar(sc);
      sm.position.x += Math.sin(p.ry) * 0.95 * sc;
      sm.position.z += Math.cos(p.ry) * 0.95 * sc;
      scene.add(sm);
      mzSarkac.push({ m: sm, f: k * 1.4 });
      golge.push([p.x, p.z, 3.8 * sc, 3.2 * sc, 0.25]);
    }
  }

  // ───────── 6) Gökkuşağı Etiketli ve Hareketli Kollu Dev Plak Meydanları ─────────
  {
    const K = cvYapi();
    K.ekle(cvG.sil, 0, 0.55, 0, 0.75, 1.1, 0.75, ALTIN);
    K.ekle(cvG.sil, -2.5, 1.05, 0, 0.16, 5.2, 0.16, KREM, 0, 0, Math.PI / 2);
    K.ekle(cvG.kutuY, -5.0, 0.92, 0, 1.05, 0.38, 0.72, 0xff5e73);
    const kolGeo = K.geo();
    const plakMat = cvMalz(0);
    const plakEtiketRenk = [0xff6ca8, 0x45bfff, 0xb878ff];

    for (let k = 0; k < 3; k++) {
      const p = yer(0.11 + k * 0.34, k % 2 ? -1 : 1, YARI + 16.5, 11.5, YARI + 11);
      if (!p) continue;
      const sc = 1.52;
      const P = cvYapi();
      P.ekle(cvG.sil, 0, 0.14, 0, 6.2, 0.26, 6.2, 0x1d1930);          // derin lacivert-siyah plak
      P.ekle(cvG.sil, 0, 0.28, 0, 5.2, 0.03, 5.2, 0x342d56);          // oluk halkası
      P.ekle(cvG.sil, 0, 0.30, 0, 4.0, 0.03, 4.0, 0x262040);
      // Gökkuşağı merkez etiketi (3 canlı halka)
      P.ekle(cvG.sil, 0, 0.32, 0, 2.35, 0.04, 2.35, GOKKUSAGI[(k * 2) % 8]);
      P.ekle(cvG.sil, 0, 0.34, 0, 1.72, 0.04, 1.72, GOKKUSAGI[(k * 2 + 2) % 8]);
      P.ekle(cvG.sil, 0, 0.36, 0, 1.12, 0.04, 1.12, GOKKUSAGI[(k * 2 + 4) % 8]);
      P.ekle(cvG.sil, 0, 0.42, 0, 0.28, 0.16, 0.28, ALTIN);           // merkez mili
      // Plak üstünde dönmeyi vurgulayan parlak işaret çizgileri
      P.ekle(cvG.kutu, 3.6, 0.31, 0, 2.2, 0.05, 0.36, 0xffd94a);
      P.ekle(cvG.kutu, -3.6, 0.31, 0, 2.0, 0.05, 0.32, 0x45bfff);
      P.ekle(cvG.kutu, 0, 0.31, 3.6, 0.32, 0.05, 2.0, 0xff85c8);

      const pm = new T.Mesh(P.geo(), plakMat);
      pm.position.set(p.x, 0.03, p.z);
      pm.scale.setScalar(sc);
      scene.add(pm);

      // Dönen pikap kolu
      const kol = new T.Mesh(kolGeo, plakMat);
      const ka = p.ry + 0.55;
      kol.position.set(p.x + Math.cos(ka) * 6.5 * sc, 0.04, p.z + Math.sin(ka) * 6.5 * sc);
      const ry0 = -ka + 0.32;
      kol.rotation.y = ry0;
      kol.scale.setScalar(sc);
      scene.add(kol);

      // Köşede nostaljik altın gramofon borusu
      S.yer(p.x, p.z, p.ry, sc);
      S.ekle(cvG.kutuY, -5.8, 0.5, -3.8, 1.7, 1.0, 1.7, AHSAP);
      S.ekle(cvG.sil, -5.8, 1.4, -3.8, 0.25, 1.2, 0.25, ALTIN);
      S.ekle(cvG.koni, -4.8, 2.1, -3.2, 1.35, 1.8, 1.35, PIRINC, 0.55, 0.6, -1.05);

      mzPlak.push({ m: pm, kol, ry0, f: k * 1.7, yon: k % 2 ? 1 : -1 });
      meydan.push([p.x, p.z, 8.8 * sc, plakEtiketRenk[k]]);
      if (!k) mzYer.plak = [p.x, p.z, p.i];
    }
  }

  // ───────── 7) Yola Yakın, Büyük ve Parlak Altın Sol Anahtarları & 3B Notalar ─────────
  {
    const G = cvYapi();
    G.ekle(cvG.sil, 0, 0, 0, 0.28, 6.0, 0.28, ALTIN, 0, 0, -0.06);
    G.ekle(cvG.kure, -0.48, -2.95, 0, 0.62, 0.62, 0.62, ALTIN);
    const ustHalka = new T.TorusGeometry(0.92, 0.25, 6, 12, Math.PI * 1.4);
    G.ekle(ustHalka, 0.36, 2.1, 0, 1, 1, 1, ALTIN, 0, 0, -0.5);
    const altSpiral = new T.TorusGeometry(1.42, 0.27, 6, 16, Math.PI * 1.65);
    G.ekle(altSpiral, 0.1, -0.55, 0, 1, 1, 1, ALTIN, 0, 0, 0.4);
    const solGeo = G.geo();
    const solMat = cvMalz(0, { emissive: 0xffaa00, emissiveIntensity: 0.42 });

    for (let k = 0; k < 8; k++) {
      const f = 0.06 + k * 0.118;
      const p = cvKenar(cvI(f), (k % 2 ? 1 : -1) * mzDis(cvI(f)), YARI + 10.5 + (k % 3) * 3.5);
      if (yakin(p.x, p.z) < YARI + 7.5) continue;
      const m = new T.Mesh(solGeo, solMat);
      const y0 = 7.6 + (k % 3) * 1.5;
      m.position.set(p.x, y0, p.z);
      m.scale.setScalar(1.55 + (k % 2) * 0.35);
      scene.add(m);
      mzSol.push({ m, y0, f: k * 1.1 });
      golge.push([p.x, p.z, 2.6, 2.6, 0.16]);
    }

    const N4 = cvYapi();
    N4.ekle(cvG.kure, -0.55, -1.2, 0, 0.9, 0.68, 0.68, 0xffffff, 0, 0, 0.35);
    N4.ekle(cvG.sil, 0.14, 0.4, 0, 0.18, 3.3, 0.18, 0xffffff);
    const n4Geo = N4.geo();

    const N8 = cvYapi();
    N8.ekle(cvG.kure, -0.85, -1.2, 0, 0.84, 0.64, 0.64, 0xffffff, 0, 0, 0.35);
    N8.ekle(cvG.kure, 0.78, -0.9, 0, 0.84, 0.64, 0.64, 0xffffff, 0, 0, 0.35);
    N8.ekle(cvG.sil, -0.22, 0.4, 0, 0.17, 3.2, 0.17, 0xffffff);
    N8.ekle(cvG.sil, 1.4, 0.7, 0, 0.17, 3.2, 0.17, 0xffffff);
    N8.ekle(cvG.kutuY, 0.6, 2.1, 0, 1.9, 0.42, 0.22, 0xffffff, 0, 0, 0.18);
    const n8Geo = N8.geo();

    const notaMatleri = GOKKUSAGI.map(c => new T.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.26 }));
    for (let k = 0; k < 20; k++) {
      const f = 0.04 + k * 0.046;
      const p = cvKenar(cvI(f), (k % 2 ? -1 : 1) * mzDis(cvI(f)), YARI + 9.2 + (k % 4) * 2.8);
      if (yakin(p.x, p.z) < YARI + 6.8) continue;
      const geo = k % 2 ? n8Geo : n4Geo;
      const m = new T.Mesh(geo, notaMatleri[k % notaMatleri.length]);
      const y0 = 5.6 + (k % 3) * 1.65;
      m.position.set(p.x, y0, p.z);
      m.scale.setScalar(1.45 + (k % 3) * 0.25);
      scene.add(m);
      mzNota.push({ m, y0, f: k * 0.85 });
    }
  }

  // ───────── 8) Derin Lavanta-Periwinkle Tepeler & Parlayan Çan Ağaçları ─────────
  {
    const D = cvYapi();
    D.ekle(cvG.dagY ? cvG.dagY : cvDagY(), 0, 0.5, 0, 1, 1, 1, 0xffffff, 0, 0, 0, 1);
    const g = cvTon(D.geo()), c = g.attributes.color, p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const f = 0.76 + 0.34 * clamp(p.getY(i), 0, 1);
      c.setXYZ(i, Math.min(1, c.getX(i) * f), Math.min(1, c.getY(i) * f), Math.min(1, c.getZ(i) * f));
    }
    const tepeler = [];
    const tepeRenk = [0x665ec4, 0x826ed8, 0x52b092, 0x9b6ed2];
    for (let k = 0; k < 20; k++) {
      const a = k / 20 * Math.PI * 2 + 0.15;
      const r = 265 + (k % 4) * 52;
      const x = mx + Math.cos(a) * r, z = mz + Math.sin(a) * r * 0.88;
      if (yakin(x, z) < 125) continue;
      const s = 24 + (k % 4) * 11;
      tepeler.push([x, -1, z, s * 1.48, s * 0.68, s, k * 0.7, tepeRenk[k % tepeRenk.length]]);
    }
    for (let k = 0; k < 6; k++) {
      const x = mx + (Rm() - 0.5) * 175, z = mz + (Rm() - 0.5) * 125, s = 12 + Rm() * 8;
      if (!mzIc(x, z) || yakin(x, z) < s + YARI + 16 || !cvBos(x, z, s * 0.7)) continue;
      cvYasak.push([x, z, s * 0.7]);
      tepeler.push([x, -0.5, z, s, s * 0.55, s, Rm() * 6, tepeRenk[k % tepeRenk.length]]);
    }
    if (tepeler.length) cok(g, cvMalz(0), tepeler);
  }

  // Tepeler ve dış çayır boyunca parlayan müzikli çan ağaçları (InstancedMesh, rüzgârda salınır)
  {
    const A = cvYapi();
    A.ekle(cvG.sil, 0, 2.4, 0, 0.36, 4.8, 0.36, AHSAP);
    A.ekle(cvG.kure, 0, 5.8, 0, 2.25, 1.95, 2.25, 0xffffff, 0, 0, 0, 1);
    A.ekle(cvG.kure, -1.4, 4.8, 0.6, 1.4, 1.25, 1.4, 0xffffff, 0, 0, 0, 1);
    A.ekle(cvG.kure, 1.4, 4.9, -0.5, 1.35, 1.2, 1.35, 0xffffff, 0, 0, 0, 1);
    // Dal altlarından sarkan parlayan altın çan boruları
    for (const [cx, cy, cz, ch] of [[-1.6, 3.6, 0.7, 1.0], [1.5, 3.7, -0.5, 1.15], [0.2, 3.4, 1.6, 0.9]]) {
      A.ekle(cvG.sil, cx, cy, cz, 0.1, ch, 0.1, ALTIN);
      A.ekle(cvG.kureK, cx, cy - ch * 0.55, cz, 0.24, 0.24, 0.24, 0xffe47a);
    }
    const agaclar = [];
    const agacRenk = [0x6fd9af, 0xa288ff, 0xff94c6, 0x76c7ff];
    for (let k = 0; k < 44; k++) {
      const f = 0.04 + (k / 44) * 0.92;
      const i = cvI(f), yan = (k % 2 ? 1 : -1) * mzDis(i);
      const p = cvKenar(i, yan, YARI + 24 + (k % 4) * 11);
      if (yakin(p.x, p.z) < YARI + 16 || !cvBos(p.x, p.z, 4.8)) continue;
      cvYasak.push([p.x, p.z, 4.5]);
      const s = 1.05 + (k % 3) * 0.28;
      agaclar.push([p.x, 0, p.z, s, s, s, k * 1.1, agacRenk[k % agacRenk.length]]);
      golge.push([p.x, p.z, 3.2 * s, 3.2 * s, 0.22]);
    }
    if (agaclar.length) cok(cvTon(A.geo()), cvMalz(1, { emissive: 0x261c42, emissiveIntensity: 0.26 }), agaclar);
  }

  // Yol kenarı renkli zil-çiçekler (InstancedMesh)
  {
    const Z = cvYapi();
    Z.ekle(cvG.sil, 0, 0.68, 0, 0.09, 1.36, 0.09, 0x4eb578);
    Z.ekle(cvG.koni, 0, 1.5, 0, 0.54, 0.58, 0.54, 0xffffff, Math.PI, 0, 0, 1);
    Z.ekle(cvG.kureK, 0, 1.2, 0, 0.18, 0.18, 0.18, ALTIN);
    const ziller = [];
    for (let k = 0; k < 90; k++) {
      const f = 0.04 + (k / 90) * 0.92;
      const i = cvI(f), yan = (k % 2 ? 1 : -1) * mzDis(i);
      const p = cvKenar(i, yan, YARI + 4.4 + (k % 3) * 2.1);
      if (yakin(p.x, p.z) < YARI + 3.4 || !cvBos(p.x, p.z, 1.2)) continue;
      const s = 1.05 + (k % 3) * 0.22;
      ziller.push([p.x, 0, p.z, s, s, s, k * 0.9, GOKKUSAGI[k % GOKKUSAGI.length]]);
    }
    if (ziller.length) cok(Z.geo(), cvMalz(0), ziller);
  }

  // ───────── Bulutlar ─────────
  {
    const l = [];
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2, r = 155 + (k % 3) * 58, s = 0.72 + (k % 4) * 0.12;
      l.push([Math.cos(a) * r, 82 + (k % 4) * 10, -70 + Math.sin(a) * r, s, s * 0.8, s, k]);
    }
    mzBulut = cok(cvBulutGeo(), new T.MeshBasicMaterial({ vertexColors: true }), l);
  }

  // Tek birleşik statik sahne geometrisi
  {
    const m = new T.Mesh(S.geo(), cvMalz(0));
    m.frustumCulled = false;
    scene.add(m);
  }

  // ───────── Zemin: Sıcak Nane & Tereyağı Kremi Çayır + Koyu Mor Dizek Şeritleri (1024 tuval) ─────────
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
      // Sıcak nane-tereyağı kremi temel çayır (soluk değil, canlı ve sıcak)
      const gr = g.createRadialGradient(w / 2, h / 2, w * 0.08, w / 2, h / 2, w * 0.72);
      gr.addColorStop(0, '#c8f2cf');
      gr.addColorStop(0.52, '#9ce0bb');
      gr.addColorStop(1, '#82cda8');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);

      // Tereyağı kremi, lavanta ve canlı nane çayır lekeleri
      for (let k = 0; k < 95; k++) {
        const x = Rm() * w, y = Rm() * h, r = 20 + Rm() * 48;
        g.globalAlpha = 0.34;
        g.fillStyle = ['#fff0be', '#d6c6ff', '#6fc89c', '#ffd6e7'][k % 4];
        g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      }

      // Dev müzikal dizek şeritleri (krem alt şerit + belirgin koyu mor 5 çizgi)
      for (const yBase of [h * 0.28, h * 0.72]) {
        g.globalAlpha = 0.38;
        g.strokeStyle = '#fff8e4';
        g.lineWidth = 58;
        g.beginPath();
        for (let x = 0; x <= w; x += 16) {
          const yy = yBase + Math.sin(x * 0.012 + yBase) * 26;
          x ? g.lineTo(x, yy) : g.moveTo(x, yy);
        }
        g.stroke();

        g.globalAlpha = 0.72;
        g.strokeStyle = '#4d3378';
        g.lineWidth = 3.0;
        for (let line = -2; line <= 2; line++) {
          g.beginPath();
          for (let x = 0; x <= w; x += 16) {
            const yy = yBase + line * 11 + Math.sin(x * 0.012 + yBase) * 26;
            x ? g.lineTo(x, yy) : g.moveTo(x, yy);
          }
          g.stroke();
        }
      }

      // Pist kenarında belirgin tereyağı kremi ve lavanta şerit
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.globalAlpha = 0.78; g.strokeStyle = '#fff5da'; g.lineWidth = 2 * (YARI + 7) * Q;
      yol(g); g.stroke();
      g.globalAlpha = 0.92; g.strokeStyle = '#ede6ff'; g.lineWidth = 2 * (YARI + 3) * Q;
      yol(g); g.stroke();

      // Plak ve piyano meydanları için canlı halkalar
      for (const m of meydan) {
        const x = px(m[0]), z = pz(m[1]), r = m[2] * Q;
        g.globalAlpha = 0.48; g.fillStyle = '#fff6e2';
        g.beginPath(); g.arc(x, z, r, 0, 7); g.fill();
        g.globalAlpha = 0.72; g.strokeStyle = '#6c50a8'; g.lineWidth = 2.8;
        for (const k of [0.96, 0.8, 0.64]) {
          g.beginPath(); g.arc(x, z, r * k, 0, 7); g.stroke();
        }
      }

      // Çalgıların ve tepelerin altında yumuşak temas gölgeleri
      for (const q of golge) {
        const x = px(q[0]), z = pz(q[1]);
        g.globalAlpha = q[4];
        const rg = g.createRadialGradient(x, z, 0, x, z, q[2] * Q);
        rg.addColorStop(0, 'rgba(72, 52, 110, 1)');
        rg.addColorStop(1, 'rgba(72, 52, 110, 0)');
        g.fillStyle = rg;
        g.save();
        g.translate(x, z); g.scale(1, q[3] / q[2]); g.translate(-x, -z);
        g.beginPath(); g.arc(x, z, q[2] * Q, 0, 7); g.fill();
        g.restore();
      }
      g.globalAlpha = 1;
    });
    doku.anisotropy = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
    doku.repeat.set(1500 / W, 1500 / W);
    doku.offset.set((-750 - X0) / W, 1 - (680 - Z0) / W);
    doku.wrapS = doku.wrapT = T.ClampToEdgeWrapping;
    zemin.material.map = doku; zemin.material.needsUpdate = true;
    {
      const p = zemin.geometry.attributes.color;
      for (let i = 0; i < p.count; i++) {
        const v = 0.94 + 0.06 * Math.sin(i * 0.37);
        p.setXYZ(i, v, v, v);
      }
      p.needsUpdate = true;
    }
  }
}
