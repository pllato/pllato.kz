import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M22 8h40l18 18v66H22z" fill="none" stroke="{c}" stroke-width="7" stroke-linejoin="round"/><path d="M62 8v18h18" fill="none" stroke="{c}" stroke-width="6" stroke-linejoin="round"/><path d="M34 40h30M34 52h22" stroke="{c}" stroke-width="6" stroke-linecap="round"/><circle cx="62" cy="72" r="14" fill="#c99a4a"/><path d="M55 72l5 5 9-10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="сделка, клиент, фирма, город"')
s=re.sub(r'<title>.*?</title>','<title>РЕЕСТР · лицензирование и готовые фирмы: продажи, маркетплейс, звонки · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%235c1a28'/><path d='M26 14h36l14 14v58H26z' fill='none' stroke='%23f4ede2' stroke-width='7'/><circle cx='60' cy='70' r='13' fill='%23c99a4a'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=PT+Mono&family=Onest:wght@400;500;600;700;800&display=swap')
s=s.replace("'Golos Text'","'Onest'").replace("'JetBrains Mono'","'PT Mono'")
root=''':root{
 --rail:#3e111b;--rail2:#2f0c14;--rail-h:#561a27;--rail-a:#c99a4a;
 --brand:#7a2337;--brand2:#c99a4a;--brandl:#f6e9ea;--steel:#8b96a3;
 --bg:#f5f1ea;--card:#fffdf9;--card2:#f9f5ef;--card3:#ece5da;
 --text:#22181a;--muted:#6b5c5e;--muted2:#9d8f8f;--line:#e7ddd2;--line2:#d2c4b6;
 --acc:#2f5f6b;--acc2:#a9c4ca;--accl:#e6f0f1;
 --ok:#2f7a4f;--ok-l:#e4f2e9;--bad:#b3301f;--bad-l:#f9e5e1;--warn:#a8701a;--warn-l:#faefdc;
 --info:#2f5f6b;--info-l:#e6f0f1;--violet:#6a4f86;--violet-l:#f0ebf5;
 --r:5px;--sh:none;--sh2:0 14px 40px rgba(47,12,20,.24);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#160d0f;--card:#1f1416;--card2:#261a1c;--card3:#33242a;
 --text:#f1e8e6;--muted:#b7a5a6;--muted2:#806f71;--line:#33242a;--line2:#47333a;
 --brandl:#3a1620;--brand:#d0607a;--accl:#13262a;--ok-l:#13261a;--bad-l:#2e1612;--warn-l:#2e2210;--info-l:#13262a;--violet-l:#221c2b;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#e0b56a}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#f4ede2')}
   <div><b class="gname">РЕЕСТР</b><small class="gsub">ЛИЦЕНЗИРОВАНИЕ · ГОТОВЫЕ ФИРМЫ · АСТАНА · ВЕСЬ КАЗАХСТАН</small></div>
  </div>
  <h1>Всё, что сейчас в amoCRM, — в своей системе.<br>Заявки поровну, документы без лимита памяти.<br><em>Маркетплейс фирм, прайсы, мессенджер и звонки — в карточке сделки.</em></h1>
  <span class="gtag">макет по встрече 5 октября · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали: консалтинг, лицензирование и продажа готовых фирм, около 30 человек, в отделе продаж 3 менеджера и руководитель. В amoCRM — технические сбои, память заканчивается и просят купить пакет, заявки распределяются неравномерно. WhatsApp заблокировал, телефонию меняете.</p>
  <p style="color:#e0b56a">Здесь — ваши воронки (отдел продаж, «продают компанию», постоянные клиенты), распределение по правилам, маркетплейс фирм с сайта, прайс и калькулятор, КП и договор из сделки, мессенджер и телефония с аналитикой, хранилище тяжёлых документов, мобильная версия с пушами и переезд с amoCRM.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">18</b></div>
   <div><small>Ролей</small><b>4</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>1,5 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Каждый входит под своим логином. Для показа выберите роль: руководитель видит всё, РОП — отдел и распределение, менеджер — свои сделки, юрист — документы и проверку фирм.</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Название, клиенты, фирмы, цены и суммы придуманы для примера; этапы воронки — как у вас в amoCRM. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Реестр">{LOGO.format(w=30,c="#f4ede2")}<b>РЕЕСТР</b></div>',s,count=1,flags=re.S)
rep('<nav id="rail" style="display:flex;flex-direction:column;align-items:center"></nav>','<nav id="rail"></nav>')
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">ЭЛ</div></div>')
rep(' <aside id="sub"></aside>\n','')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Реестр</h1>')
rep('  </header>\n','  </header>\n  <nav id="sub"></nav>\n')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="card('newlead')">+ ЗАЯВКА</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/eldar-consult.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/eldar-consult.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'g{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/eldar-consult.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
