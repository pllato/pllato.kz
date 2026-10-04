import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M37 9h26v28h28v26H63v28H37V63H9V37h28z" fill="none" stroke="{c}" stroke-width="7" stroke-linejoin="round"/><circle cx="50" cy="50" r="9" fill="#e8b04a"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>BIPHARM · две аптеки: заказы Kaspi, Halyk, Forte, Wolt, склад, маркировка · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='16' fill='%230f5b52'/><path d='M39 14h22v25h25v22H61v25H39V61H14V39h25z' fill='%23fff'/><circle cx='50' cy='50' r='8' fill='%23e8b04a'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=Fira+Code:wght@400;500;600&family=Fira+Sans+Condensed:wght@500;600;700&family=Fira+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap')
s=s.replace("'Golos Text'","'Fira Sans'").replace("'JetBrains Mono'","'Fira Code'")
root=''':root{
 --rail:#0d3b36;--rail2:#082b27;--rail-h:#14504a;--rail-a:#e8b04a;
 --brand:#0f5b52;--brand2:#e8b04a;--brandl:#e1efec;--steel:#8b96a3;
 --bg:#eef2f1;--card:#fff;--card2:#f5f8f7;--card3:#e2e9e7;
 --text:#14211f;--muted:#55625e;--muted2:#8a9692;--line:#dbe3e0;--line2:#c2cecb;
 --acc:#2d6fa3;--acc2:#a9c6de;--accl:#e9f1f8;
 --ok:#2b7a3d;--ok-l:#e4f1e6;--bad:#c0392b;--bad-l:#f9e6e3;--warn:#a86d14;--warn-l:#fbf0dc;
 --info:#2d6fa3;--info-l:#e9f1f8;--violet:#7a5c8e;--violet-l:#f1ecf4;
 --r:4px;--sh:none;--sh2:0 12px 34px rgba(8,40,36,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1514;--card:#111e1c;--card2:#162624;--card3:#20322f;
 --text:#e4eeec;--muted:#9aaba6;--muted2:#6b7d78;--line:#20322f;--line2:#2f4540;
 --brandl:#12332f;--accl:#122433;--violet-l:#221c28;--ok-l:#132619;--bad-l:#2e1714;--warn-l:#2e2413;--info-l:#122433;--warn:#d9a040;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#e8b04a}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
ints=''.join(f'<span><i class="dot {c}"></i>{n}</span>' for n,c in [('Kaspi','ok'),('Halyk','ok'),('Forte','ok'),('Wolt','wait'),('Провизор','ok'),('НКТ','ok'),('ИС МПТ','ok'),('ОФД','ok'),('WhatsApp','ok')])
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#5fc6b4')}
   <div><b class="gname">BIPHARM</b><small class="gsub">ДВЕ АПТЕКИ · ЧЕТЫРЕ ПЛОЩАДКИ · ОДИН УЧЁТ</small></div>
  </div>
  <h1>Заказ с Kaspi, Halyk, Forte или Wolt — сразу в резерв.<br>Фискальный чек — только когда выдан.<br><em>Отказ — товар вернулся на полку одной кнопкой.</em></h1>
  <span class="gtag">макет по встречам 30 сентября и 1 октября · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали: сейчас на площадки уходят только цены и остатки, а каждый заказ вы заводите вручную — номер, товар, сумма, откуда пришёл, в какой магазин. Чек пробивается раньше выдачи, и при отказе приходится делать возврат.</p>
  <p style="color:#e8b04a">Здесь заказ приходит сам, товар резервируется на нужной аптеке, до выдачи — только товарный чек. Плюс два склада с партиями и сроками, несколько штрихкодов у товара, разукомплектация, НДС 5% и 16%, НКТ, маркировка ИС МПТ, договоры и накладные с PDF, накладные из Провизора, своя доставка с курьером на карте.</p>
  <div class="gints">{ints}</div>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">29</b></div>
   <div><small>Ролей</small><b>8</b></div>
   <div><small>Интеграций</small><b>9</b></div>
   <div><small>Стоимость</small><b>1,5 млн</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Выберите роль — система покажет только нужное. Руководитель видит обе аптеки; фармацевт — свою; сборщик — очередь заказов; курьер — свои адреса на карте; менеджер площадок — цены и витрины; бухгалтер — чеки, НДС и оплаты.</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Клиенты, номера заказов, поставщики, коды и суммы придуманы для примера. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
rep('<div class="app hidden" id="app">\n <aside class="rail">','<div class="app hidden" id="app">\n <div class="sync" id="sync"></div>\n <aside class="rail">')
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="BIPHARM">{LOGO.format(w=30,c="#0f5b52")}<b>BIPHARM</b></div>',s,count=1,flags=re.S)
rep('<nav id="rail" style="display:flex;flex-direction:column;align-items:center"></nav>','<nav id="rail"></nav>')
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">ЕР</div></div>')
rep(' <aside id="sub"></aside>\n','')
rep('<h1 id="ttl">Реестр 01</h1>','<div class="tt"><small id="crumb">Сегодня</small><h1 id="ttl">BIPHARM</h1></div>')
rep('  </header>\n','  </header>\n  <nav id="sub"></nav>\n')
s=re.sub(r'placeholder="[^"]*"','placeholder="заказ, клиент, телефон, штрихкод, артикул"',s,count=1)
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('pos')">+ ПРОДАЖА</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/apteka-flow-yerlan.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/apteka-flow-yerlan.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'p{i}.js'),encoding='utf-8').read() for i in range(1,8))
open(ROOT+'/app/apteka-flow-yerlan.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
