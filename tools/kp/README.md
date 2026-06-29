# tools/kp — конвейер КП / ТЗ / счетов (HTML → PDF)

Генератор премиальных документов Pllato: КП, ТЗ, счета. Рендер через Chromium (Playwright),
шрифты Inter лежат рядом — движок самодостаточный и не теряется между сессиями.

## Установка (новая сессия)
```bash
pip install --quiet playwright pdf2image
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers   # Chromium предустановлен
```
Шрифты Inter уже в `tools/kp/fonts/` (Regular/Medium/SemiBold/Bold/ExtraBold).
Путь к бинарю Chromium зашит в `render.py` (`/opt/pw-browsers/chromium-*/chrome-linux/chrome`).

## Рендер
```bash
python3 tools/kp/render.py pdf  tools/kp/<doc>.html  app/<slug>/<Out>.pdf
python3 tools/kp/render.py shots app/<slug>/index.html  app/<slug>/shots/pref  s1 s2 s3
```

## Фирстиль
- Navy `#0a1628`, Bronze `#b8895a` / `#d4a978`, Off `#f7f6f1`, Green `#3f7d52`.
- Обложка: тёмная, кикер (Коммерческое предложение / Техническое задание), крупный заголовок,
  ценовой бэнд внизу (`price_value` коротким — `$2 700`, детали справа).
- `@page{size:A4;margin:0}`, поля внутри `.page`. Футер абсолютом снизу.

## Структура КП (по хендофу)
обложка → 01 что услышали (+цитата) → 02 что строим (карточки) → 03+ экраны со скринами демо →
интеграции → как работаем → стоимость (скидка + таблица этапов + price band) → что отдельно → о Pllato.

## Шаблоны в этой папке
- `schet_oceanglass_final.html` — счёт OceanGlass OG-2026-004 (Шаг 2, финал). Копировать под новые счета.
- `kp_logistika.html` — КП фулфилмент-сервиса (Iliyas). Скрины из `app/logistika/shots/`.
- `tz_logistika.html` — ТЗ того же проекта.

## Цены (канон)
$3 000 «под ключ», 4–6 недель. Скидка 10% за решение в 24ч → $2 700.
Предоплата $300 + 2 этапа постоплатой (обычно $1 200 + $1 200). Поддержка $20/час.
Реквизиты счетов: ИП «STUDYSTORIES.APP», БИН 880607300110, Kaspi Bank, IBAN KZ31722S000010366450.
