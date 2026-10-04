import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 12a38 38 0 1 1-35 23" fill="none" stroke="#c99a5b" stroke-width="9" stroke-linecap="round"/><path d="M6 28l10 12 12-9" fill="none" stroke="#c99a5b" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 42l16-8 16 8v18l-16 8-16-8z" fill="none" stroke="#5fb27e" stroke-width="7" stroke-linejoin="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Цикл · коробки и вторсырьё: заказы, производство, рейсы, весы, касса · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%2320251f'/><path d='M50 16a34 34 0 1 1-31 20' fill='none' stroke='%23c99a5b' stroke-width='9' stroke-linecap='round'/><path d='M34 42l16-8 16 8v18l-16 8-16-8z' fill='none' stroke='%235fb27e' stroke-width='7'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=PT+Mono&family=PT+Sans+Narrow:wght@400;700&family=PT+Sans:ital,wght@0,400;0,700;1,400&display=swap')
s=s.replace("'Golos Text'","'PT Sans'").replace("'JetBrains Mono'","'PT Mono'")
root=''':root{
 --rail:#20251f;--rail2:#191d18;--rail-h:#2d332b;--rail-a:#c99a5b;
 --brand:#2e3a46;--brand2:#c99a5b;--brandl:#e6eaee;--steel:#8b96a3;
 --bg:#eceeea;--card:#fff;--card2:#f6f7f4;--card3:#e3e6e0;
 --text:#1f2420;--muted:#5f685f;--muted2:#959d94;--line:#dde1db;--line2:#c4cac2;
 --acc:#2e5d8a;--acc2:#a9c3db;--accl:#e8f0f7;
 --ok:#2f7a4f;--ok-l:#e3f0e7;--bad:#b3341f;--bad-l:#f8e5e1;--warn:#b07d2a;--warn-l:#f8eedb;
 --info:#2e5d8a;--info-l:#e8f0f7;--violet:#6b4f8f;--violet-l:#efebf5;
 --r:2px;--sh:none;--sh2:0 14px 40px rgba(20,26,20,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#121512;--card:#1a1e1a;--card2:#20251f;--card3:#2c322b;
 --text:#e8ece6;--muted:#9ea79c;--muted2:#6f786d;--line:#2c322b;--line2:#3c443a;
 --accl:#13202c;--brandl:#232a30;--violet-l:#211c2b;--ok-l:#132519;--bad-l:#2e1714;--warn-l:#2e2413;--info-l:#13202c;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#c99a5b}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58)}
   <div><b class="gname">ЦИКЛ</b><small class="gsub">КОРОБКИ · ВТОРСЫРЬЁ · ОДНА СИСТЕМА ДЛЯ ДВУХ НАПРАВЛЕНИЙ</small></div>
  </div>
  <h1>Коробки — от заявки до «получено».<br>Вторсырьё — от точки до весов и кассы.<br><em>Собственник видит оба направления на одном экране.</em></h1>
  <span class="gtag">макет по встрече 30 сентября · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали про два направления. Коробки для пиццы, гофрокороба, лотки: постоянные клиенты заказывают каждый месяц, счёт — предоплата — производство — готово — остаток — самовывоз или доставка — клиент подтвердил. Вторсырьё: картон, плёнка, пластик, ПЭТ и алюминиевые банки — водитель на Газели записывает в телефоне точку, вес и цену, кассир видит, кому и сколько платить.</p>
  <p style="color:#c99a5b">Сейчас это WhatsApp и бумага — общей информации нет. Здесь — заявки с источником, повторы одной кнопкой, производство по сменам, рейсы и весы с контролем расхождений, склад, касса и аналитика. Весной добавится новый завод — как ещё одна площадка.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">25</b></div>
   <div><small>Ролей</small><b>8</b></div>
   <div><small>Направления</small><b>2 + собственник</b></div>
   <div><small>Стоимость</small><b>1,5 млн</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Выберите роль — система покажет только нужное. Руководитель видит всё; менеджер коробок — заказы и клиентов; водитель — свой рейс в телефоне; кассир — деньги; приёмщик — весы и склад.</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Клиенты, точки, цены и суммы придуманы для примера. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Цикл">{LOGO.format(w=30)}<b>ЦИКЛ</b></div>',s,count=1,flags=re.S)
rep('<nav id="rail" style="display:flex;flex-direction:column;align-items:center"></nav>','<nav id="rail"></nav>')
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><span>Астана</span><div class="me" id="me">РШ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Цикл</h1>')
s=re.sub(r'placeholder="[^"]*"','placeholder="заказ, клиент, точка, машина"',s,count=1)
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('calc')">+ ЗАКАЗ</button>''')
rep('  <div class="content" id="content"></div>','  <div class="content" id="content"></div>\n  <div class="tick" id="tick"></div>')
rep('<script src="/app/uss.js"></script>','<script src="/app/rashit-pack.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/rashit-pack.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'c{i}.js'),encoding='utf-8').read() for i in range(1,7))
open(ROOT+'/app/rashit-pack.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
