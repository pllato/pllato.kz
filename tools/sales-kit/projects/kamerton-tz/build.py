import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# камертон: ножка + два зубца, справа звуковые дуги
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M30 14v34a12 12 0 0 0 24 0V14" fill="none" stroke="{c}" stroke-width="8" stroke-linecap="round"/><path d="M42 60v28" stroke="{c}" stroke-width="8" stroke-linecap="round"/><path d="M66 30a22 22 0 0 1 0 30M76 22a34 34 0 0 1 0 46" fill="none" stroke="#e0684b" stroke-width="6" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Камертон · ЛОР-клиника и центр слуха: запись, забота о пациентах, планы лечения · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%231f2a44'/><path d='M30 16v32a12 12 0 0 0 24 0V16' fill='none' stroke='%23fff' stroke-width='8' stroke-linecap='round'/><path d='M42 60v26' stroke='%23fff' stroke-width='8' stroke-linecap='round'/><path d='M68 32a20 20 0 0 1 0 28' fill='none' stroke='%23e0684b' stroke-width='7' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=Commissioner:wght@400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,500;0,7..72,600;1,7..72,500;1,7..72,600&family=Roboto+Mono:wght@400;500;600&display=swap')
s=s.replace("'Golos Text'","'Commissioner'").replace("'JetBrains Mono'","'Roboto Mono'")
root=''':root{
 --rail:#1f2a44;--rail2:#18213a;--rail-h:#2a3756;--rail-a:#e0684b;
 --brand:#2a4a7f;--brand2:#e0684b;--brandl:#e8eef7;--steel:#8b96a3;
 --bg:#f4f2ee;--card:#fff;--card2:#f9f7f3;--card3:#ebe7e0;
 --text:#1c2433;--muted:#5d6675;--muted2:#8f96a3;--line:#e3dfd7;--line2:#cfc9bf;
 --acc:#2a4a7f;--acc2:#a9bddb;--accl:#edf2f9;
 --ok:#3e7d4e;--ok-l:#e8f2ec;--bad:#b23a3a;--bad-l:#f8e7e5;--warn:#a87a1e;--warn-l:#f8f0dc;
 --info:#2a4a7f;--info-l:#edf2f9;--violet:#6a5a8a;--violet-l:#f0edf5;
 --r:12px;--sh:none;--sh2:0 14px 40px rgba(20,28,48,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#11151f;--card:#171d2a;--card2:#1c2333;--card3:#262f43;
 --text:#e6eaf2;--muted:#9aa4b6;--muted2:#6b7488;--line:#262f43;--line2:#34405a;
 --brandl:#1b2740;--accl:#1b2740;--violet-l:#221e2c;--ok-l:#152519;--bad-l:#2e1616;--warn-l:#2e2614;--info-l:#1b2740;--brand:#7f9fd6;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=60,c='#ffffff')}
   <div><b class="gname">Камертон</b><small class="gsub">ЛОР · СЛУХ · ОТОНЕВРОЛОГИЯ · ХИРУРГИЯ · ЗАБОТА</small></div>
  </div>
  <h1>Все отделения — в одной системе.<br>Пациент не теряется после визита.<br><em>Забота — отдельный отдел, а не воронка продаж.</em></h1>
  <span class="gtag">версия 2 · по вашему ТЗ на 500 пунктов · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали: CRM-системы вы пробовали, но соединить все отделы не получилось. Новые обращения и действующие пациенты лежат в одной воронке, отчёты — в Excel, приказы подписываются на отдельных платформах, а лечение после визита держится на памяти пациента.</p>
  <p style="color:#f0a58f">Версия 2 — по вашему ТЗ на 500 пунктов: одна сущность «Пациент» и жизненный цикл, воронки и связи между ними, маршрут, пакеты и абонементы, повторные касания, реактивация, сегменты, LTV и когорты, сквозная аналитика, KPI, потерянные, автоматизация ЕСЛИ → ТО, коммуникации, BI, база знаний, журнал действий. Экран «Соответствие ТЗ» — где каждый из 32 разделов.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">46</b></div>
   <div><small>Ролей</small><b>12</b></div>
   <div><small>Отделений</small><b>4 + забота</b></div>
   <div><small>Стоимость</small><b>2,5 млн + 1С</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Выберите роль — система покажет только нужное. Руководитель видит всю клинику; врач — своих пациентов и назначения; отдел заботы — действующих пациентов; продажи — новые обращения и звонки; водитель — свои поездки.</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Пациенты, диагнозы, цены и суммы придуманы для примера. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="hdr">
  <div class="brand">{LOGO.format(w=34,c='#2a4a7f')}<div><b>КАМЕРТОН</b><small>ЛОР-клиника и центр слуха · Астана</small></div></div>
  <div class="srch"><i>⌕</i><input placeholder="Пациент: ФИО, телефон или диагноз" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
  <div class="nowc" id="nowc"></div>
  <div class="top-r">
   <button class="ab" id="addBtn" onclick="card('newappt')">+ ЗАПИСЬ</button>
   <button class="ib" id="themeBtn" onclick="toggleTheme()" title="Тема">◐</button>
   <button class="ib" id="tourBtn" onclick="tour()" title="Сценарий показа">▶</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">АК</div>
  </div>
 </header>
 <nav id="sub"></nav>
 <main class="main"><h1 id="ttl" class="vh">Камертон</h1><div class="content" id="content"></div></main>
 <nav class="dock" id="rail"></nav>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/kamerton-crm.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/kamerton-crm.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'k{i}.js'),encoding='utf-8').read() for i in [1,2,3,4,5,6,8,7])
open(ROOT+'/app/kamerton-crm.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
