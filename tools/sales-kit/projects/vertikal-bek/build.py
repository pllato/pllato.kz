import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# знак: оранжевый квадрат (как в GTA Detailing) + вертикаль этажей
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="26" fill="#ff7a1a"/><path d="M50 18v64M34 82h32M38 34h24M38 50h24M38 66h24" stroke="#2b1200" stroke-width="8" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Вертикаль · учёт проектов и времени строительной компании · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='26' fill='%23ff7a1a'/><path d='M50 18v64M34 82h32M38 34h24M38 50h24M38 66h24' stroke='%232b1200' stroke-width='9' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap')
s=s.replace("'Golos Text'","'Manrope'").replace("'JetBrains Mono'","'IBM Plex Mono'")
root=''':root{
 --rail:#0e1116;--rail2:#0a0c0f;--rail-h:#171d27;--rail-a:#ff7a1a;
 --brand:#ff7a1a;--brand2:#ffa055;--brandl:#ff7a1a1f;--steel:#93a0b4;
 --bg:#0a0c0f;--card:#12161d;--card2:#171d27;--card3:#1f2733;
 --text:#eef2f7;--muted:#93a0b4;--muted2:#5f6b7e;--line:#1f2733;--line2:#2c3a4e;
 --acc:#ff7a1a;--acc2:#ffa055;--accl:#ff7a1a1f;
 --ok:#22c55e;--ok-l:#22c55e1f;--bad:#ef4444;--bad-l:#ef44441f;--warn:#f59e0b;--warn-l:#f59e0b1f;
 --info:#3b82f6;--info-l:#3b82f61f;--violet:#a855f7;--violet-l:#a855f71f;
 --r:12px;--sh:none;--sh2:0 18px 48px rgba(0,0,0,.5);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
light='''body.light{
 --rail:#ffffff;--rail2:#f6f7f9;--rail-h:#f1f3f6;
 --bg:#f4f5f7;--card:#ffffff;--card2:#f7f8fa;--card3:#eceff3;
 --text:#151a22;--muted:#5b6575;--muted2:#8b94a3;--line:#e3e7ed;--line2:#cfd6df;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',light,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=50)}<div><b class="gname">Вертикаль</b><small class="gsub">УЧЁТ ПРОЕКТОВ И ВРЕМЕНИ · СТРОИТЕЛЬНАЯ КОМПАНИЯ</small></div></div>
  <div class="kicker">Демо под вашу компанию · 25 человек · 5 объектов</div>
  <h1>Каждый час каждого человека — <span>на своём проекте. И сразу в деньгах.</span></h1>
  <p class="glead">Рабочий отмечается на объекте с телефона, время ложится на наряд и этап, табель собирается сам, а себестоимость и маржа каждого объекта видны руководителю в моменте — не после сдачи. Зарплата и акты уходят в 1С.</p>
  <div class="gstat">
   <div><small>ЭКРАНОВ</small><b class="a">21</b></div>
   <div><small>РОЛЕЙ</small><b>7</b></div>
   <div><small>ОБМЕН</small><b>1С</b></div>
   <div><small>СТОИМОСТЬ</small><b>11,3 млн</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Выберите роль — система покажет только нужное.</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>Объекты, люди, ставки и суммы придуманы для примера. Кнопка «Сценарий» — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <aside class="side">
  <div class="slogo">{MARK.format(w=34)}<div><b>Вертикаль</b><small>СТРОИТЕЛЬНАЯ КОМПАНИЯ</small></div></div>
  <nav id="rail"></nav>
  <div class="sfoot"><div class="me" id="me">БК</div><div id="mename"></div></div>
 </aside>
 <main class="main">
  <header class="top">
   <div class="tt"><h1 id="ttl">Вертикаль</h1><p id="subt"></p></div>
   <div class="top-r">
    <div class="srch"><i>⌕</i><input placeholder="проект, заказчик, сотрудник" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
    <span class="live"><i></i>1С · обмен 09:00</span>
    <button class="tb" id="tourBtn" onclick="tour()">▶ Сценарий</button>
    <button class="tb acc" onclick="go('mobile')">Отметка рабочего</button>
    <button class="ib" id="themeBtn" onclick="toggleTheme()" title="Тема">◐</button>
    <select class="rsel" id="rsel"></select>
   </div>
  </header>
  <div class="content" id="content"></div>
 </main>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/vertikal-bek.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/vertikal-bek.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'b{i}.js'),encoding='utf-8').read() for i in range(1,6))
open(ROOT+'/app/vertikal-bek.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
