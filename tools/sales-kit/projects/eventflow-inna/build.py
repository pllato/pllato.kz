import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M10 13h80" stroke="#d9a441" stroke-width="7" stroke-linecap="round"/><path d="M15 18v70c13 0 21-17 24-37 2-13 0-24-5-33z" fill="#c4472f"/><path d="M85 18v70c-13 0-21-17-24-37-2-13 0-24 5-33z" fill="#c4472f"/><path d="M39 88h22" stroke="#f3efe8" stroke-width="5" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Кулиса · система event-агентства: продажи, сметы, проекты, реквизит · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='16' fill='%231d1b21'/><path d='M14 16h72' stroke='%23d9a441' stroke-width='7' stroke-linecap='round'/><path d='M18 21v62c11 0 18-15 21-32 2-11 0-21-4-30z' fill='%23c4472f'/><path d='M82 21v62c-11 0-18-15-21-32-2-11 0-21 4-30z' fill='%23c4472f'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=JetBrains+Mono:wght@400;500;600;700&family=Lora:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Source+Sans+3:wght@400;500;600;700;800&display=swap')
s=s.replace("'Golos Text'","'Source Sans 3'")
root=''':root{
 --rail:#1d1b21;--rail2:#16151a;--rail-h:#2c2a31;--rail-a:#d9a441;
 --brand:#b5432c;--brand2:#d9a441;--brandl:#f8ebe5;--steel:#8b96a3;
 --bg:#f3efe8;--card:#fffdf9;--card2:#f8f4ee;--card3:#ebe4d9;
 --text:#1d1b21;--muted:#6b645d;--muted2:#a1988e;--line:#e6ded2;--line2:#d0c6b8;
 --acc:#2f5d62;--acc2:#9cc3c2;--accl:#e4efee;
 --ok:#3c7a4a;--ok-l:#e7f1e8;--bad:#b3261e;--bad-l:#f8e6e3;--warn:#b7791f;--warn-l:#fbf0dc;
 --info:#2f5d62;--info-l:#e4efee;--violet:#6d4c7d;--violet-l:#f1ebf3;
 --r:3px;--sh:0 1px 0 rgba(29,27,33,.06);--sh2:0 14px 40px rgba(29,27,33,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#141317;--card:#1c1b20;--card2:#222127;--card3:#2e2c33;
 --text:#efe9e1;--muted:#a59d93;--muted2:#766f67;--line:#2e2c33;--line2:#413e46;
 --accl:#16282a;--brandl:#2f1c17;--violet-l:#251d2a;--ok-l:#17261a;--bad-l:#2e1714;--warn-l:#2e2413;--info-l:#16282a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.bt.p:hover{background:#6e4620;border-color:#6e4620;color:#fff}','.bt.p:hover{background:#962f1b;border-color:#962f1b;color:#fff}')
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:italic;color:#e3b45a}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=56)}
   <div><b class="gname">Кулиса</b><small class="gsub">СИСТЕМА EVENT-АГЕНТСТВА · ПРОДАЖИ · СМЕТЫ · ПРОЕКТЫ · РЕКВИЗИТ</small></div>
  </div>
  <h1>От первого сообщения в WhatsApp — до тайминга дня, акта и ретро:<br><em>вся история проекта в одной системе</em></h1>
  <span class="gtag">макет по встрече 30 сентября · тест-драйв: всё кликается</span>
  <p style="margin-top:15px">Вы сказали: amoCRM сейчас — архив карточек, после выявления потребности переписка уходит в личные телефоны, реализация живёт в Excel, сквозной аналитики нет. Здесь заявка из любого канала становится сделкой с источником, проходит ваши этапы — бриф, просчёт, креатив, КП, защиту, — а после аванса сама превращается в проект с командой, задачами, таймингом, внутренним и клиентским чатом.</p>
  <p style="color:#e3b45a">Индивидуальные сметы без прайса, тендеры и условные тендеры, договоры с ЭЦП или на бумаге, склад реквизита с бронями и ревизией, конверсия, задел, план-факт, LTV, путь клиента и база знаний для новичков.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">27</b></div>
   <div><small>Ролей</small><b>8</b></div>
   <div><small>Команда</small><b>15 человек</b></div>
   <div><small>Ядро</small><b>2 недели</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Выберите роль — разделы и права перестроятся. Операционный директор видит всё; руководитель продаж — свой отдел без задач реализации; проджект — свои проекты; склад — реквизит; бухгалтерия — документы и оплаты.</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Клиенты, суммы и имена придуманы. Кнопка ▶ сверху — сценарий показа за 3 минуты. Остальное — сами: создайте сделку, поменяйте смету, забронируйте реквизит.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Кулиса">{LOGO.format(w=30)}<b>Кулиса</b></div>',s,count=1,flags=re.S)
rep('<nav id="rail" style="display:flex;flex-direction:column;align-items:center"></nav>','<nav id="rail"></nav>')
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">ИН</div><span>Агентство · 15 человек</span></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Кулиса</h1>')
s=re.sub(r'placeholder="[^"]*"','placeholder="сделка, клиент, проект, реквизит"',s,count=1)
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="card('newdeal')">+ Сделка</button>''')
rep('<button class="ib" id="themeBtn"','<button class="ib" id="agBtn" onclick="toggleAg()" title="Колонка «Сегодня»">◨</button>\n    <button class="ib" id="themeBtn"')
rep('<script src="/app/uss.js"></script>','<script src="/app/eventflow-inna.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/eventflow-inna.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'k{i}.js'),encoding='utf-8').read() for i in range(1,8))
open(ROOT+'/app/eventflow-inna.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
