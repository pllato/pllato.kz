import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: капля и лист, изумруд и песок
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill="#0f4c45"/><path d="M50 16C50 16 26 44 26 60a24 24 0 0 0 48 0C74 44 50 16 50 16z" fill="#d9b98a"/><path d="M50 74V50M50 58l-10-8M50 64l10-8" stroke="#0f4c45" stroke-width="4" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Таза Өмір · клиника: запись, пациенты, продажи, финансы · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230f4c45'/><path d='M50 16C50 16 26 44 26 60a24 24 0 0 0 48 0C74 44 50 16 50 16z' fill='%23d9b98a'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#0b302c;--rail2:#082522;--rail-h:#14453f;--rail-a:#d9b98a;
 --brand:#0f5c53;--brand2:#d9b98a;--brandl:#e3f0ec;--steel:#7d8a86;
 --bg:#f5f2ec;--card:#ffffff;--card2:#faf8f4;--card3:#ece6db;
 --text:#14231f;--muted:#566661;--muted2:#8d9a96;--line:#e4ded3;--line2:#cfc6b7;
 --acc:#b08850;--acc2:#d9b98a;--accl:#f6ecdc;
 --ok:#1f7a4f;--ok-l:#e2f2e8;--bad:#b8322e;--bad-l:#f9e3e1;--warn:#a5650d;--warn-l:#faeedb;
 --info:#2f5f86;--info-l:#e5edf5;--violet:#566661;--violet-l:#eceeed;
 --r:10px;--sh:none;--sh2:0 16px 40px rgba(11,48,44,.25);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0a1513;--card:#10201d;--card2:#142824;--card3:#1b322d;--brand:#6fc7b4;
 --text:#e6efec;--muted:#9fb3ad;--muted2:#6b7f79;--line:#1e3530;--line2:#2a4740;
 --brandl:#123a33;--accl:#33281a;--ok-l:#15281c;--bad-l:#2f1717;--warn-l:#2f2412;--info-l:#18243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">ТАЗА ӨМІР</b><small class="gsub">ЦЕНТР ИНТЕГРАТИВНОЙ МЕДИЦИНЫ · АЛМАТЫ · ОНЛАЙН И ОФЛАЙН</small></div></div>
  <span class="gtag">демо для Еркина · по встрече 12.11</span>
  <h1>Одно окно вместо шести программ — <em>видно, куда уходят деньги, ещё до конца месяца.</em></h1>
  <p>Запись к врачам и карточка пациента вместо Bumpix и MedElement. Продажи МОП, звонки и WhatsApp вместо Битрикса. Доходы, расходы, ФОТ и РНП вместо Excel. БАДы и медикаменты со списанием по назначениям. Выгрузка в МИС и 1С для государства. Дашборд собственника — по кнопке.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">25</b></div><div><small>Ролей</small><b>8</b></div><div><small>Программ заменяем</small><b>6</b></div><div><small>Абонплата</small><b>0 ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, пациенты, врачи, цены и суммы придуманы. Пришлёте логотип — перекрасим. Excel реально скачивается.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <aside class="side">
  <div class="brandm">{MARK.format(w=32)}<div><b>ТАЗА ӨМІР</b><small>КЛИНИКА</small></div></div>
  <nav id="rail"></nav>
  <div class="sidef"><select class="rsel" id="rsel"></select></div>
 </aside>
 <div class="col">
  <header class="topb"><div id="sub"></div>
   <div class="top-r">
    <div class="srch"><i>⌕</i><input placeholder="пациент, телефон, БАД" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
    <button class="ib" onclick="tour()" title="Сценарий">▶</button>
    <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
    <div class="me" id="me">ЕК</div>
   </div>
  </header>
  <main class="main"><h1 id="ttl" class="vh">Таза Өмір</h1><div class="content" id="content"></div></main>
 </div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/clinic-erkin.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
s=s.replace('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800','family=JetBrains+Mono:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700;800&family=PT+Serif:wght@700')
open(ROOT+'/app/clinic-erkin.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'c{i}.js'),encoding='utf-8').read() for i in (1,2,3,4,9))
open(ROOT+'/app/clinic-erkin.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
