import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M10 88h80" stroke="{c}" stroke-width="8" stroke-linecap="round"/><path d="M22 88V44l28-22 28 22v44" fill="none" stroke="{c}" stroke-width="8" stroke-linejoin="round"/><rect x="38" y="56" width="24" height="32" fill="#e8674a"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="сделка, клиент, товар"')
s=re.sub(r'<title>.*?</title>','<title>ОПОРА · оптовая торговля: сделки, склад, закупки, касса — вместо 1С · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%2324324a'/><path d='M24 84V46l26-20 26 20v38' fill='none' stroke='%23fff' stroke-width='8'/><rect x='39' y='56' width='22' height='28' fill='%23e8674a'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap')
s=s.replace("'Golos Text'","'Manrope'")
root=''':root{
 --rail:#1d2a3e;--rail2:#16202f;--rail-h:#2a3b55;--rail-a:#e8674a;
 --brand:#c4512f;--brand2:#e8674a;--brandl:#fcebe5;--steel:#8b96a3;
 --bg:#eef1f5;--card:#fff;--card2:#f6f8fa;--card3:#e4e9ef;
 --text:#18212e;--muted:#5a6575;--muted2:#8e98a6;--line:#dfe4ea;--line2:#c6ced8;
 --acc:#2f5f8f;--acc2:#a9c1da;--accl:#e8f0f8;
 --ok:#2f7a52;--ok-l:#e4f2ea;--bad:#c23b2b;--bad-l:#fbe8e5;--warn:#b0751a;--warn-l:#fcf1dd;
 --info:#2f5f8f;--info-l:#e8f0f8;--violet:#5a5a9a;--violet-l:#eeeef8;
 --r:6px;--sh:none;--sh2:0 14px 40px rgba(22,32,47,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0f141c;--card:#161d28;--card2:#1c2431;--card3:#26303f;
 --text:#e8edf3;--muted:#9aa6b5;--muted2:#6b7787;--line:#26303f;--line2:#36424f;
 --brandl:#33201a;--brand:#ef7a5c;--accl:#14222f;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#14222f;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f08a6c}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#fff')}
   <div><b class="gname">ОПОРА</b><small class="gsub">СТРОЙМАТЕРИАЛЫ И ОБОРУДОВАНИЕ · ОПТОВАЯ ТОРГОВЛЯ · СКЛАД · ВАГОНЫ</small></div>
  </div>
  <h1>Продажи, склад, закупки и деньги — в одном месте.<br>Счёт, КП, приход и реализация — без 1С.<br><em>Директор видит всё сам, не спрашивая отчёты.</em></h1>
  <span class="gtag">макет по встрече 5 октября · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали: работа идёт в рабочей базе 1С — счета, накладные; отчёт получить тяжело. Битрикс собирались запускать, но интересна своя разработка. Нужно: все товары как в «Моём складе», счёт и КП у менеджеров, канбан, записи звонков и переписки, заявки на закупку, два бухгалтера — приход и реализация, касса для кассира, авансы и командировочные, отгрузка вагонами.</p>
  <p style="color:#f08a6c">Три зоны контроля, как вы сказали: менеджеры — звонки и переписка; бухгалтерия — что пришло и что продано; снабжение — с кем и о чём договорились.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">19</b></div>
   <div><small>Ролей</small><b>7</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>1,5 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Каждый входит под своим логином и видит своё. Для показа выберите роль — например, кассира: у неё всего один экран и три кнопки.</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Название, клиенты, товары, поставщики и суммы придуманы для примера. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Опора">{LOGO.format(w=32,c="#fff")}</div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">ДК</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Опора</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="card('newdeal')">+ СДЕЛКА</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/daulet-trade.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/daulet-trade.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'h{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/daulet-trade.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
