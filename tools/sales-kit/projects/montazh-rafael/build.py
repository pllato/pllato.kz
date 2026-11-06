import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: метка маршрута над коробкой
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="14" fill="#16324a"/><path d="M18 34h64M18 50h64M18 66h64" stroke="#7fc4e0" stroke-width="7" stroke-linecap="round"/><path d="M28 34c6-8 12 8 18 0s12 8 18 0" stroke="#e8833a" stroke-width="0" fill="none"/><circle cx="72" cy="28" r="10" fill="#e8833a"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>АэроСтрой Монтаж · объекты, склад, снабжение, продажи · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%2316324a'/><path d='M18 34h64M18 50h64M18 66h64' stroke='%237fc4e0' stroke-width='7'/><circle cx='72' cy='28' r='10' fill='%23e8833a'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#16324a;--rail2:#0f2536;--rail-h:#1f4562;--rail-a:#e8833a;
 --brand:#1f6390;--brand2:#e8833a;--brandl:#e3eff7;--steel:#7d8b96;
 --bg:#f1f4f6;--card:#ffffff;--card2:#f7f9fa;--card3:#e6ebef;
 --text:#15212b;--muted:#536370;--muted2:#8896a1;--line:#dde4e9;--line2:#c4ced6;
 --acc:#e8833a;--acc2:#e8833a;--accl:#fcebdc;
 --ok:#1f7a52;--ok-l:#e1f2e9;--bad:#c23b2f;--bad-l:#fae5e2;--warn:#b0700a;--warn-l:#fbf0d8;
 --info:#2e64a8;--info-l:#e5edf8;--violet:#4f6f8a;--violet-l:#e8eef3;
 --r:4px;--sh:none;--sh2:0 16px 40px rgba(22,50,74,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0e151b;--card:#162029;--card2:#1b2630;--card3:#24313c;--brand:#5aa6d6;
 --text:#e4ebf0;--muted:#9eadb8;--muted2:#6d7c87;--line:#24313b;--line2:#33424e;
 --brandl:#18303f;--accl:#3a2615;--ok-l:#15281e;--bad-l:#2f1a17;--warn-l:#2f2512;--info-l:#18243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">АЭРОСТРОЙ МОНТАЖ</b><small class="gsub">ВЕНТИЛЯЦИЯ · КОНДИЦИОНИРОВАНИЕ · ХОЛОД · СЕРВИС</small></div></div>
  <span class="gtag">демо для Рафаэля · по встрече</span>
  <h1>Объект от расчёта до сдачи — <em>и ни один материал не уходит на два объекта.</em></h1>
  <p>Объекты по стадиям и график бригад, заявки мастеров с телефона, импорт из РФ чек-листом, склад со сканером и резервами, выполнение за месяц и оплаты, продажи кондиционеров, WhatsApp, сервис по договорам. Склад — в портале, в 1С Фреш уходят готовые документы.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">19</b></div><div><small>Ролей</small><b>6</b></div><div><small>Объектов</small><b>7</b></div><div><small>Стоимость</small><b>2,5 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, объекты, заказчики, суммы и люди придуманы. Логотип пришлёте — перекрасим.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="mast">
  <div class="brandm">{MARK.format(w=30)}<b>АЭРОСТРОЙ</b></div>
  <nav id="rail"></nav>
  <div class="top-r">
   <div class="srch"><i>⌕</i><input placeholder="объект, материал" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
   <button class="ib" onclick="tour()" title="Сценарий">▶</button>
   <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">РФ</div>
  </div>
 </header>
 <div class="body2"><aside id="sub"></aside><main class="main"><h1 id="ttl" class="vh">АэроСтрой</h1><div class="content" id="content"></div></main></div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/montazh-rafael.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/montazh-rafael.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'r{i}.js'),encoding='utf-8').read() for i in (1,2,3,4,9))
open(ROOT+'/app/montazh-rafael.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
