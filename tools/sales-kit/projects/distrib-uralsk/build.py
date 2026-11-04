import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: метка маршрута над коробкой
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="18" fill="#1f4d3a"/><path d="M50 12a18 18 0 0 1 18 18c0 13-18 30-18 30S32 43 32 30a18 18 0 0 1 18-18z" fill="#f0a020"/><circle cx="50" cy="30" r="6" fill="#1f4d3a"/><path d="M22 66h56v20H22z" fill="#fff"/><path d="M22 66l8-8h40l8 8" fill="#cfe3d8"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Жайык Дистрибуция · торговые, маршруты, заказы, склад и долги · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%231f4d3a'/><path d='M50 12a18 18 0 0 1 18 18c0 13-18 30-18 30S32 43 32 30a18 18 0 0 1 18-18z' fill='%23f0a020'/><path d='M22 66h56v20H22z' fill='%23fff'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#17382b;--rail2:#102a20;--rail-h:#21503d;--rail-a:#f0a020;
 --brand:#1f6b4f;--brand2:#f0a020;--brandl:#e4f1ea;--steel:#7f8c86;
 --bg:#f3f2ec;--card:#ffffff;--card2:#f8f7f2;--card3:#e9e7df;
 --text:#18231e;--muted:#58655e;--muted2:#8c968f;--line:#e2e0d6;--line2:#cbc8bb;
 --acc:#f0a020;--acc2:#f0a020;--accl:#fdf1da;
 --ok:#1f7a45;--ok-l:#e2f2e7;--bad:#c23b2f;--bad-l:#fae5e2;--warn:#b0700a;--warn-l:#fbf0d8;
 --info:#2e64a8;--info-l:#e5edf8;--violet:#6a5a9a;--violet-l:#efecf6;
 --r:6px;--sh:none;--sh2:0 16px 40px rgba(23,56,43,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0f1512;--card:#17201b;--card2:#1c2721;--card3:#25322b;--brand:#4fb58a;
 --text:#e6ece8;--muted:#9fada5;--muted2:#6c7a72;--line:#26332c;--line2:#34443b;
 --brandl:#1a3328;--accl:#33280f;--ok-l:#15281c;--bad-l:#2f1a17;--warn-l:#2f2512;--info-l:#18243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">ЖАЙЫК ДИСТРИБУЦИЯ</b><small class="gsub">УРАЛЬСК · 1 300 ТОРГОВЫХ ТОЧЕК · 2 КОМАНДЫ</small></div></div>
  <span class="gtag">демо для Александра · по встрече</span>
  <h1>Торговый был на точке — <em>это видно по GPS и фото полки.</em></h1>
  <p>Маршруты на неделю, визит с телефона: отметка, фото, заказ или отказ с причиной. Склад собирает, экспедитор везёт и принимает оплату. Дебиторка по консигнации, KPI торговых, задачи, расходы и P&amp;L. Мобильная 1С больше не нужна.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">21</b></div><div><small>Ролей</small><b>6</b></div><div><small>Точек</small><b>1 300</b></div><div><small>Стоимость</small><b>2,5 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, точки, товары, суммы и люди придуманы. Логотип пришлёте — перекрасим. Excel реально скачивается.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="mast">
  <div class="brandm">{MARK.format(w=30)}<b>ЖАЙЫК</b></div>
  <nav id="rail"></nav>
  <div class="top-r">
   <div class="srch"><i>⌕</i><input placeholder="точка, адрес" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
   <button class="ib" onclick="tour()" title="Сценарий">▶</button>
   <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">АЛ</div>
  </div>
 </header>
 <div class="body2"><aside id="sub"></aside><main class="main"><h1 id="ttl" class="vh">Жайык</h1><div class="content" id="content"></div></main></div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/distrib-uralsk.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/distrib-uralsk.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'u{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/distrib-uralsk.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
