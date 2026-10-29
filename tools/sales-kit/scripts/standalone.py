# -*- coding: utf-8 -*-
"""Автономная версия демо: один HTML без гейта, JS и локальные картинки внутри, + ссылка в «Материалах проекта» карточки app.html.

Использование:
    python3 tools/sales-kit/scripts/standalone.py <имя-демо> [<имя-демо> …]
    (имя-демо = файл app/<имя>.html, рядом app/<имя>.js)

Результат: app/<имя>-standalone.html. Ссылка «⬇ Автономный файл демо» добавляется в карточку,
у которой кнопка «Открыть демо» ведёт на app/<имя>.html (если ссылки ещё нет).
Правило (21.10.2026): для каждого нового демо сразу собирать standalone и подшивать в материалы.
"""
import os, re, sys, base64, mimetypes

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))


def inline_assets(s):
    def rep(m):
        p = m.group(2)
        f = os.path.join(ROOT, p.lstrip('/'))
        if not os.path.isfile(f):
            return m.group(0)
        mt = mimetypes.guess_type(f)[0] or 'application/octet-stream'
        return m.group(1) + 'data:' + mt + ';base64,' + base64.b64encode(open(f, 'rb').read()).decode() + m.group(3)
    return re.sub(r'''(["'(])(/app/img/[^"')\s]+)(["')])''', rep, s)


def build(name):
    html = open(os.path.join(ROOT, 'app', name + '.html'), encoding='utf-8').read()
    jsf = os.path.join(ROOT, 'app', name + '.js')
    st = html.replace('<script src="/app/gate.js"></script>', '', 1)
    if os.path.isfile(jsf):
        js = open(jsf, encoding='utf-8').read()
        tag = '<script src="/app/%s.js"></script>' % name
        assert tag in st, 'нет подключения ' + tag
        st = st.replace(tag, '<script>\n' + inline_assets(js).replace('</script>', '<\\/script>') + '\n</script>', 1)
    st = inline_assets(st)
    left = re.findall(r'''["'(]/app/[^"')\s]+''', st)
    assert not left, 'остались ссылки на /app/: ' + ', '.join(sorted(set(left))[:5])
    if 'noindex' not in st:
        st = st.replace('<head>', '<head>\n<meta name="robots" content="noindex,nofollow">', 1)
    m = re.search(r'<title>(.*?)</title>', st)
    title = m.group(1) if m else name
    st = re.sub(r'<title>(.*?)</title>', lambda mm: '<title>' + mm.group(1) + ' (автономный файл)</title>', st, count=1)
    note = ('<!--\n  Автономная версия демо «%s».\n  Один файл: разметка, стили, логика и картинки внутри. Интернет не нужен —\n'
            '  шрифты подгружаются при наличии сети, иначе берутся системные.\n  Собирается скриптом tools/sales-kit/scripts/standalone.py из app/%s.html.\n-->' % (title, name))
    st = re.sub(r'(?i)<!doctype html>', lambda mm: mm.group(0) + '\n' + note, st, count=1)
    out = os.path.join(ROOT, 'app', name + '-standalone.html')
    open(out, 'w', encoding='utf-8').write(st)
    return len(st)


def link(name):
    p = os.path.join(ROOT, 'app.html')
    s = open(p, encoding='utf-8').read()
    href = 'app/%s-standalone.html' % name
    if href in s:
        return 'ссылка уже есть'
    cta = 'class="tool-cta as-link" href="app/%s.html"' % name
    i = s.find(cta)
    if i < 0:
        return 'карточка не найдена'
    j = s.find('<div class="tool-dd-menu">', i)
    if j < 0:
        return 'нет блока материалов'
    m = re.compile(r'</div>\s*</details>').search(s, j)  # конец списка материалов (в старых карточках — с переносом строки)
    nxt = s.find('class="tool-card"', i)
    if not m or (nxt > 0 and m.start() > nxt):
        return 'нет конца блока материалов'
    j += len('<div class="tool-dd-menu">')
    if s[j:j+1] == '\n': j += 1
    line = '          <a href="%s" download target="_blank" rel="noopener"><span class="dot"></span>Скачать Standalone · демо одним HTML-файлом</a>\n' % href
    s = s[:j] + line + s[j:]
    open(p, 'w', encoding='utf-8').write(s)
    return 'ссылка добавлена'


if __name__ == '__main__':
    for n in sys.argv[1:]:
        size = build(n)
        print(n, 'ok', round(size / 1024), 'КБ ·', link(n))
