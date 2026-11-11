# Feza'nın Yarışı – çalışma notları

5 yaşındaki Feza için 3B araba yarışı. `../CLAUDE.md` (bütün Feza oyunlarının kuralları) geçerlidir.

- Klasik betikler (ES module yok), `vendor/three.js` (r170, `window.THREE`); `index.html`'ye çift tıklayınca da çalışır.
- Dosyalar (yükleme sırası `index.html`'de; üst düzey adlar bütün dosyalarda ortaktır, adları değiştirme):
  `ses.js` (kayıtlı anlatım, efektler, motor) · `cekirdek.js` (çizici, kamera, yardımcılar, pist matematiği `pist(s)`, `OLAY`, ortak veriler)
  · `cevre.js` (gök, ışık, zemin, ağaçlar, süsler; `cevreGuncelle`) · `pist.js` (yol, kemer, oklar, tümsekler, yıldızlar, konfeti; `pistGuncelle`)
  · `araba.js` (araba ve sürücü modelleri, `arabaYerlestir`) · `arayuz.js` + `style.css` + `index.html` (ekran düğmeleri, göstergeler)
  · `oyun.js` (durum akışı, girdi, rakipler, kamera, ana döngü, `window.YARIS`).
- Arabalar pist koordinatında tutulur (`yol` = ilerleme metre, `d` = yanal konum): pistten çıkılamaz, ters gidilemez.
- Kontrol: parmağı sağa sola sürükle, araba o hizaya gider; turuncu roket düğmesi kısa süre hızlandırır. Gaz/fren yok.
  Kısa bir sürüklemede de son hedefe yumuşakça ulaşır. İptal/odak kaybı/mola girdiyi temizler; ok/A/D tuşları kontrolü devralır.
- Kaybetmek yok: rakipler Feza'ya göre hızlanıp yavaşlar ve Feza her yarışı ilk üçte bitirir (`rakipAdim`); aynı anda en çok iki rakip
  Feza'nın önüne geçebilir, geçmeyenler kameranın arkasında bekler.
- Olaylar (`OLAY.on/emit`, cekirdek.js): durum(d) · sayim(n) · sira(n) · yildiz · tur(n) · roket · hop · tok · bitis(sira). Ses, arayüz, pist efektleri ve arabalar bunları dinler.
  Ek olaylar: `seri({adet,hedef,odul,toplam})`, `ilerleme({tur,oran,toplam,roket})` (en çok 8 Hz), `ozet({pist,yildiz,roket,ziplama,seri,sira,sure})`, `inis({i,v,d,tur})`, `mola(bool)`, `sonuc`.
  Her üç yıldızda 1,15 sn otomatik roket ve düğmenin hazır olması; kaybedilen yıldızda seri sıfırlanmaz. `roket` özeti yalnız düğmeyle kullanılanları sayar.
- Müzik ve efektler kodla üretilir (`ses.js`); düzey ayarı `MOD` içindeki `guc` değerleri ve `motorAyar` katsayıları.
  Üç ortam aynı ezgiyi farklı tempo/tınıyla çalar. Anlatım tek `Audio` öğesini kullanır; mola kalan cümleyi saklar, açık `SES.sus()` iptal eder. Sessiz testte hiçbir donanım çıkışı kurulmaz.
- Yazı yok (yalnız başlıkta oyunun adı); sıra, tur ve yıldız resim + rakamla gösterilir.
- Seslendirme: `ses.js` içindeki `/*SESLER*/` bloğu → `python gen_voice.py` → `sesler/*.mp3` (tr-TR-EmelNeural, sessizlik kırpılı).
  Yeni cümle eklenirse `sw.js` içindeki `SESLER` listesine de ekle.
- Performans hedefi: M1 iPad Pro'da 60 kare. Gölge haritası yok, süsler çoklu kopya (InstancedMesh), ışık 2 adet.
  Kare süresi uzarsa çizim oranı kendiliğinden düşer (`oran`).
- Test: `?sessiz` (her zaman), `?atla` (başlığı geç), `?hiz=4` (hızlı zaman), `?oto` (araba kendi sürer), `YARIS.bilgi()`.
- Dosya eklenince `sw.js` `CORE` listesine ekle ve `CACHE` sürümünü artır. Önek `feza-yaris-`; başka oyunların önbelleğine dokunma.
- GitHub'a yalnız ebeveyn "gönder" deyince gönder (depo: goktugkarpat/feza-yaris, `main`).
- Üç pist: `?pist=orman|kiyi|kar` (`PIST_TEMA`, doğrulanmış; varsayılan: orman). `PIST_NOKTALARI` ayrı yol geometrilerini, çevre/pist dosyaları ayrı ortamları kurar. Hepsi 3 tur ve aynı kolay kontrol / ilk üç kuralını korur.
- Rampa görseli, teker teması ve kalkış ortak `RAMPA` ölçülerini kullanır; birini diğerlerinden ayrı değiştirme. Hop süresini fizik ilerletir, model çizimi azaltmaz; P ve rakipler aynı rampayı izler.
- `YARIS.basligaDon()` mola/sonuçtan resimli seçim ekranına döner. Rekorlar yalnız `feza-yaris-anilar-v1:<pist>` anahtarlarında tutulur; başka kayıtları temizleme.
