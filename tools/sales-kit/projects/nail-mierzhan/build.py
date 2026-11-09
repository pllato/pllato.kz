import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: флакон гель-лака, винный и розовое золото
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill="#5a1a2b"/><rect x="40" y="14" width="20" height="30" rx="4" fill="#e7c9b8"/><path d="M30 44h40v34a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z" fill="#c48b72"/><path d="M38 58h24" stroke="#5a1a2b" stroke-width="5" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Лакмус Про · касса, опт, производство, кабинеты · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%235a1a2b'/><path d='M30 44h40v34a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z' fill='%23c48b72'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#2b1118;--rail2:#1f0b11;--rail-h:#4a1c28;--rail-a:#e2b39c;
 --brand:#7a2238;--brand2:#e2b39c;--brandl:#f6e6e3;--steel:#8a7b7e;
 --bg:#f8f3f0;--card:#ffffff;--card2:#fbf7f5;--card3:#efe5e1;
 --text:#26161b;--muted:#6b5a5f;--muted2:#9a888c;--line:#ebdfdb;--line2:#d6c5c0;
 --acc:#b37661;--acc2:#e2b39c;--accl:#f8e8df;
 --ok:#2f7a4f;--ok-l:#e3f1e8;--bad:#b8322e;--bad-l:#f9e3e1;--warn:#a5650d;--warn-l:#faeedb;
 --info:#3d5f86;--info-l:#e6edf5;--violet:#6b5a5f;--violet-l:#f0eaea;
 --r:10px;--sh:none;--sh2:0 16px 40px rgba(43,17,24,.25);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#160b0e;--card:#211216;--card2:#28161b;--card3:#331d23;--brand:#e2a3b1;
 --text:#f2e6e8;--muted:#b7a2a7;--muted2:#806b70;--line:#33202a;--line2:#462c35;
 --brandl:#3a1a24;--accl:#3a2219;--ok-l:#16281c;--bad-l:#2f1717;--warn-l:#2f2412;--info-l:#18243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">ЛАКМУС ПРО</b><small class="gsub">ПРОИЗВОДСТВО И ТОРГОВЛЯ ДЛЯ МАСТЕРОВ МАНИКЮРА · 10 ФИЛИАЛОВ</small></div></div>
  <span class="gtag">демо для Миержана · по встрече 09.11</span>
  <h1>Своя экосистема вместо 1С — <em>касса работает даже без интернета, а салон заказывает сам с телефона.</em></h1>
  <p>Кассы в 10 филиалах со сканером и бонусами, офлайн-режим с досылкой чеков. Оптовые заказы от заявки до оплаты с чеком. Цех: розлив и автосписание по спецификации. Склады и перемещения. Телефон торгового агента, кабинеты салона, оптовика и инструктора. Kaspi, WhatsApp и Instagram в одном окне.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">23</b></div><div><small>Ролей и входов</small><b>9</b></div><div><small>Филиалов</small><b>10</b></div><div><small>Подписок</small><b>0</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Сотрудники и клиенты входят в одну систему — каждый видит своё.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, товары, цены, филиалы, клиенты и люди придуманы. Пришлёте логотип — перекрасим. Excel реально скачивается.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <aside class="side">
  <div class="brandm">{MARK.format(w=32)}<div><b>ЛАКМУС</b><small>ПРО</small></div></div>
  <nav id="rail"></nav>
  <div class="sidef"><select class="rsel" id="rsel"></select></div>
 </aside>
 <div class="col">
  <header class="topb"><div id="sub"></div>
   <div class="top-r">
    <div class="srch"><i>⌕</i><input placeholder="товар, клиент, город" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
    <button class="ib" onclick="tour()" title="Сценарий">▶</button>
    <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
    <div class="me" id="me">МЖ</div>
   </div>
  </header>
  <main class="main"><h1 id="ttl" class="vh">Лакмус Про</h1><div class="content" id="content"></div></main>
 </div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/nail-mierzhan.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
s=s.replace('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800','family=JetBrains+Mono:wght@400;500;600;700&family=Onest:wght@400;500;600;700;800&family=Lora:wght@600;700')
open(ROOT+'/app/nail-mierzhan.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'n{i}.js'),encoding='utf-8').read() for i in (1,2,3,4,9))
open(ROOT+'/app/nail-mierzhan.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
