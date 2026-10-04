"""Сборка КП: стили берутся из app/kp-bobek.html (эталон вёрстки КП), страницы — из kp_pages.html проекта,
палитра и шрифты — из kpcfg.py проекта.

Использование:
    python3 tools/sales-kit/scripts/kp-build.py tools/sales-kit/projects/<проект>/kpcfg.py

В kpcfg.py доступны переменные ROOT (корень репозитория) и HERE (папка kpcfg.py) и функция build({...}):
    out    — куда писать: ROOT+'/app/kp-<имя>.html'
    pages  — HERE+'/kp_pages.html' (листы <section class="page">…; LOGO48 заменяется на logo)
    logo   — SVG-логотип 48×48 для обложки
    title  — <title> страницы
    fav    — <link rel="icon" …> одной строкой (SVG data-URI)
    fonts  — ссылка Google Fonts css2 (полная кириллица; не Inter/Nunito)
    root   — CSS-переменные --ink --ink2 --y --y2 --y3 (тёмный, тёмный-2, акцент, акцент тёмный, светлый акцент)
    head / body / mono — шрифты заголовков / текста / цифр; fallback — 'serif' или 'sans-serif'
    colors — список замен [(старый цвет, новый)] для светлых подложек эталона
    extra  — дополнительный CSS проекта
    fixes  — необязательно: [(что, на что)] точечные замены в pages
ВАЖНО: app/kp-bobek.html — живое КП клиента и одновременно эталон стилей. Не менять его ради другого проекта.
"""
import re, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))


def build(cfg):
    b = open(os.path.join(ROOT, 'app', 'kp-bobek.html'), encoding='utf-8').read()
    head = b[:b.index('</style>')]
    pages = open(cfg['pages'], encoding='utf-8').read()
    for a, c in cfg.get('fixes', []):
        assert a in pages, 'нет в pages: ' + a[:60]
        pages = pages.replace(a, c)
    pages = pages.replace('LOGO48', cfg['logo'])
    head = re.sub(r'<title>.*?</title>', '<title>' + cfg['title'] + '</title>', head)
    head = re.sub(r'<link rel="icon"[^\n]*>', cfg['fav'], head)
    head = re.sub(r'<link href="https://fonts.googleapis.com/css2[^"]*"', '<link href="' + cfg['fonts'] + '"', head)
    a = ':root{--ink:#17301f;--ink2:#23402c;--y:#2e7d4f;--y2:#1f5e3a;--y3:#eec170;'
    assert a in head, 'в kp-bobek.html изменились переменные :root — поправь kp-build.py'
    head = head.replace(a, ':root{' + cfg['root'])
    head = head.replace("'JetBrains Mono'", "'" + cfg['mono'] + "'").replace("'Manrope'", "'" + cfg['body'] + "'")
    for x, y in cfg['colors']:
        head = head.replace(x, y)
    head = head.replace("h1,h2,.wmk b{font-family:'Unbounded','" + cfg['body'] + "',sans-serif;letter-spacing:-.01em}",
                        "h1,h2,.wmk b{font-family:'" + cfg['head'] + "','" + cfg['body'] + "'," + cfg.get('fallback', 'serif') + ";letter-spacing:-.005em}")
    assert 'Unbounded' not in head and 'Manrope' not in head, 'остался шрифт эталона'
    out = head + cfg['extra'] + '</style>\n</head><body>\n\n' + pages
    open(cfg['out'], 'w', encoding='utf-8').write(out)
    print('ok', os.path.relpath(cfg['out'], ROOT), len(out))


if __name__ == '__main__':
    cfgp = os.path.abspath(sys.argv[1])
    exec(open(cfgp, encoding='utf-8').read(), {'build': build, 'ROOT': ROOT, 'HERE': os.path.dirname(cfgp)})
