#!/bin/bash
# Çift tıkla: bu klasördeki tüm değişiklikleri GitHub'a gönderir (ilk seferde depoyu oluşturup GitHub Pages'ı açar).
cd "$(dirname "$0")" || exit 1
DEPO='goktugkarpat/feza-yaris'
if [ ! -d .git ]; then
  git init -q -b main
fi
git config user.name "goktugkarpat"
git config user.email "goktugkarpat@users.noreply.github.com"
if git remote get-url origin >/dev/null 2>&1 && [ "$(git remote get-url origin)" != "https://github.com/$DEPO.git" ]; then
  echo "Gönderim durduruldu: bu oyun yalnızca kendi deposuna gönderilebilir."
  exit 1
fi
git add -A
if git diff --cached --quiet; then
  echo "Yeni değişiklik yok."
else
  git commit -q -m "Güncelleme: $(date '+%Y-%m-%d %H:%M')" -m "Co-Authored-By: Claude <noreply@anthropic.com>" && echo "Değişiklikler kaydedildi."
fi
if ! git remote get-url origin >/dev/null 2>&1; then
  if gh repo create "$DEPO" --public --source . --remote origin --push; then
    gh api -X POST "repos/$DEPO/pages" -f 'source[branch]=main' -f 'source[path]=/' >/dev/null 2>&1
    echo "Tamam! Oyun GitHub'a yüklendi: https://goktugkarpat.github.io/feza-yaris/"
    echo "(İlk yayın birkaç dakika sürebilir.)"
  else
    echo "Gönderilemedi. İnternet bağlantısını ve 'gh auth login' girişini kontrol edin."
  fi
elif git push -q -u origin main; then
  echo "Tamam! GitHub güncellendi."
else
  echo "Gönderilemedi. İnternet bağlantısını ve 'gh auth login' girişini kontrol edin."
fi
sleep 4
