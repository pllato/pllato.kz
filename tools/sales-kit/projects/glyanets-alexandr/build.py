import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: след поломоечной машины — диск щётки и блеск на полу
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="14" fill="#0e7c86"/><circle cx="44" cy="54" r="24" fill="none" stroke="#fff" stroke-width="8"/><circle cx="44" cy="54" r="7" fill="#fff"/><path d="M74 14v18M65 23h18" stroke="#f2c230" stroke-width="7" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Глянец · CRM, склады и задачи для продажи уборочной техники · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%230e7c86'/><circle cx='44' cy='54' r='24' fill='none' stroke='%23fff' stroke-width='8'/><circle cx='44' cy='54' r='7' fill='%23fff'/><path d='M74 14v18M65 23h18' stroke='%23f2c230' stroke-width='7' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=Rubik:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap')
s=s.replace("'Golos Text'","'Rubik'").replace("'JetBrains Mono'","'IBM Plex Mono'")
root=''':root{
 --rail:#1d252c;--rail2:#151b20;--rail-h:#28323b;--rail-a:#f2c230;
 --brand:#0e7c86;--brand2:#f2c230;--brandl:#e1f1f2;--steel:#7d8a94;
 --bg:#f1f3f2;--card:#ffffff;--card2:#f7f8f8;--card3:#e8ecec;
 --text:#1a2228;--muted:#56636c;--muted2:#88949c;--line:#e0e5e6;--line2:#c9d1d3;
 --acc:#0e7c86;--acc2:#f2c230;--accl:#e1f1f2;
 --ok:#24804a;--ok-l:#e3f2e8;--bad:#c4372b;--bad-l:#f9e3e0;--warn:#a87508;--warn-l:#fbf0d4;
 --info:#2b62a3;--info-l:#e4edf8;--violet:#6a5a9a;--violet-l:#efecf6;
 --r:6px;--sh:none;--sh2:0 16px 40px rgba(29,37,44,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#11171b;--card:#192127;--card2:#1e272e;--card3:#28323a;--brand:#3fb3bd;--acc:#3fb3bd;
 --text:#e6ecee;--muted:#9aa7ae;--muted2:#6b7880;--line:#27323a;--line2:#35424b;
 --brandl:#16343a;--accl:#16343a;--ok-l:#15281d;--bad-l:#2e1916;--warn-l:#2d2512;--info-l:#17243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=52)}<div><b class="gname">ГЛЯНЕЦ</b><small class="gsub">ПРОФЕССИОНАЛЬНАЯ УБОРОЧНАЯ ТЕХНИКА · CRM И СКЛАД</small></div></div>
  <div class="kicker">Демо для Александра Разинкова и Руслана · 15 человек · 3 филиала</div>
  <h1>Продали машину в ТРЦ — <em>склад, сервис и задачи знают об этом сразу.</em></h1>
  <p class="glead">Воронка от лида до пусконаладки, общий WhatsApp и IP-телефония в карточке сделки, склады с ячейками и серийными номерами, инвентаризация с телефона, отчёты в Excel и задачи для всей команды.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">21</b></div><div><small>Ролей</small><b>6</b></div><div><small>Филиалов</small><b>3</b></div><div><small>Интеграции</small><b>WA · АТС</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Клиенты, модели машин, цены и остатки придуманы. Кнопки работают, Excel реально скачивается. «Сценарий» — показ по шагам.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <aside class="side">
  <div class="slogo">{MARK.format(w=32)}<div><b>Глянец</b><small>CRM · СКЛАД · ЗАДАЧИ</small></div><button class="burg" onclick="document.body.classList.toggle('nav')">☰</button></div>
  <div class="bizw" id="bizw"><i id="bizdot"></i><select id="bizsel" title="Бизнес"></select></div>
  <nav id="rail"></nav>
  <div class="sfoot"><div class="me" id="me">АЛ</div><div id="mename"></div></div>
 </aside>
 <main class="main">
  <header class="top">
   <div class="tt"><h1 id="ttl">Глянец</h1><p id="subt"></p></div>
   <div class="top-r">
    <div class="srch"><i>⌕</i><input placeholder="сделка, клиент, серийный №" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
    <button class="tb" id="tourBtn" onclick="tour()">▶ Сценарий</button>
    <button class="tb acc" onclick="if(allowed('tasks'))newTask();else toast('Нет доступа')">+ Задача</button>
    <button class="ib" id="themeBtn" onclick="toggleTheme()" title="Тема">◐</button>
    <select class="rsel" id="rsel"></select>
   </div>
  </header>
  <div class="content" id="content"></div>
 </main>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/glyanets-alexandr.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/glyanets-alexandr.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'c{i}.js'),encoding='utf-8').read() for i in range(1,7))
open(ROOT+'/app/glyanets-alexandr.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
