#!/usr/bin/env bash
# Ждёт, пока GitHub Pages начнёт отдавать новые файлы: сравнивает md5 локального файла и https://pllato.kz/<файл>.
# Использование (запускать фоном после push в main):
#   bash tools/sales-kit/scripts/live-check.sh app/kp-x.html app/x.html app/x.js app.html
# Обычно сайт обновляется за 1–3 минуты (5–10 проверок по 15 секунд).
cd "$(dirname "$0")/../../.." || exit 1
[ $# -gt 0 ] || { echo "Нужно: список файлов от корня репозитория"; exit 1; }
for i in $(seq 1 40); do
  ok=1
  for f in "$@"; do
    l=$(md5sum < "$f" | cut -d' ' -f1)
    r=$(curl -s "https://pllato.kz/$f?nc=$RANDOM$i" | md5sum | cut -d' ' -f1)
    [ "$l" = "$r" ] || { ok=0; break; }
  done
  if [ $ok = 1 ]; then echo "на сайте после $i проверок"; for f in "$@"; do echo "$f OK"; done; exit 0; fi
  sleep 15
done
echo "за 10 минут не обновилось:"
for f in "$@"; do
  l=$(md5sum < "$f" | cut -d' ' -f1); r=$(curl -s "https://pllato.kz/$f?nc=$RANDOM" | md5sum | cut -d' ' -f1)
  [ "$l" = "$r" ] && echo "$f OK" || echo "$f ОТЛИЧАЕТСЯ"
done
exit 1
