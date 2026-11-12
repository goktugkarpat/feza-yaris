"""Seslendirme: ses.js içindeki /*SESLER*/ bloğundaki cümleleri tr-TR-EmelNeural ile sesler/<anahtar>.mp3 olarak kaydeder,
baştaki ve sondaki sessizliği ffmpeg ile kırpar. Kullanım: python gen_voice.py [anahtar ...]  (anahtar verilmezse hepsi)"""
import asyncio
import os
import re
import subprocess
import sys
import tempfile

import edge_tts
import edge_tts.communicate as _etc

# Eski okuma sunucusu bazı bölgelerde 403 veriyor; aynı anahtar Edge'in yeni sunucusunda çalışıyor (2D oyundaki çözümle aynı).
_ANAHTAR = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"
_etc.WSS_URL = "wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1?Ocp-Apim-Subscription-Key=" + _ANAHTAR
_etc.WSS_HEADERS["Ocp-Apim-Subscription-Key"] = _ANAHTAR

KOK = os.path.dirname(os.path.abspath(__file__))
SES = "tr-TR-EmelNeural"
blok = re.search(r"/\*SESLER\*/(.*?)/\*SESLER-SON\*/", open(os.path.join(KOK, "ses.js"), encoding="utf-8").read(), re.S).group(1)
cumleler = dict(re.findall(r"(\w+):\s*'((?:[^'\\]|\\.)*)'", blok))
secim = sys.argv[1:] or list(cumleler)
os.makedirs(os.path.join(KOK, "sesler"), exist_ok=True)


async def kaydet(anahtar, metin):
    ham = os.path.join(tempfile.gettempdir(), "feza_yaris_" + anahtar + ".mp3")   # Dropbox klasörü dışında (kilitlenmesin)
    son = os.path.join(KOK, "sesler", anahtar + ".mp3")
    await edge_tts.Communicate(metin, SES, rate="+4%").save(ham)
    # baştaki sessizlik kırpılır; cümle aralarındaki uzun duraklar (ör. "Hop! ... Uçtun!") kısa, doğal bir ara olur; sondaki sessizlik kırpılır
    kirp = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,silenceremove=stop_periods=-1:stop_duration=0.2:stop_threshold=-45dB:stop_silence=0.1,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", ham, "-af", kirp, "-ac", "1", "-b:a", "64k", son], check=True,
                   creationflags=0x08000000 if os.name == "nt" else 0)
    try:
        os.remove(ham)
    except OSError:
        pass
    print(anahtar, os.path.getsize(son) // 1024, "KB")


async def main():
    for a in secim:
        if not sys.argv[1:] and os.path.exists(os.path.join(KOK, "sesler", a + ".mp3")):
            continue   # hepsi istenince var olanı yeniden kaydetme (yenilemek için anahtarı adıyla ver)
        for deneme in range(6):   # sunucu "çok hızlı" derse bekleyip yeniden dene
            try:
                await kaydet(a, cumleler[a].replace("\'", "'"))
                break
            except Exception as hata:
                print(a, "bekleniyor:", str(hata)[:60])
                await asyncio.sleep(8 + deneme * 6)
        await asyncio.sleep(1.5)


asyncio.run(main())
