import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M26 90L44 10M74 90L56 10" stroke="{c}" stroke-width="8" stroke-linecap="round"/><path d="M50 84v-12M50 58v-10M50 36v-8M50 18v-5" stroke="#f0a020" stroke-width="7" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>ТРАССА · экспедиция: перевозки, мои и не мои деньги, календарь платежей, фонды · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%2315191e'/><path d='M28 88L45 12M72 88L55 12' stroke='%23dfe5ea' stroke-width='9' stroke-linecap='round'/><path d='M50 82v-12M50 56v-10M50 34v-8' stroke='%23f0a020' stroke-width='8' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap')
s=s.replace("'Golos Text'","'IBM Plex Sans'").replace("'JetBrains Mono'","'IBM Plex Mono'")
root=''':root{
 --rail:#15191e;--rail2:#0f1216;--rail-h:#252c34;--rail-a:#f0a020;
 --brand:#c2541b;--brand2:#f0a020;--brandl:#fbefe6;--steel:#8b96a3;
 --bg:#eff1f3;--card:#fff;--card2:#f6f7f9;--card3:#e5e9ed;
 --text:#161b21;--muted:#56606b;--muted2:#8d96a0;--line:#dde2e7;--line2:#c3cad2;
 --acc:#2a5f8f;--acc2:#a8c3dc;--accl:#e8f0f7;
 --ok:#2e7d4f;--ok-l:#e4f2ea;--bad:#c62f2f;--bad-l:#fbe7e6;--warn:#b5700f;--warn-l:#fcf0dc;
 --info:#2a5f8f;--info-l:#e8f0f7;--violet:#7a52b0;--violet-l:#f1ecf8;
 --r:3px;--sh:none;--sh2:0 14px 40px rgba(15,18,22,.24);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0e1114;--card:#161a1f;--card2:#1c2127;--card3:#272e36;
 --text:#e7ebef;--muted:#9aa4ae;--muted2:#6c7681;--line:#262d35;--line2:#36404a;
 --brandl:#2c1c12;--accl:#122230;--violet-l:#221a2c;--ok-l:#12261a;--bad-l:#2e1414;--warn-l:#2e2210;--info-l:#122230;--warn:#e09a30;--brand:#e06a2c;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f0a020}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#dfe5ea')}
   <div><b class="gname">ТРАССА</b><small class="gsub">ТРАНСПОРТНАЯ ЭКСПЕДИЦИЯ · АСТАНА · РОССИЯ · КИТАЙ · КАЗАХСТАН</small></div>
  </div>
  <h1>Пришло пять миллионов — видно, что ваших из них пятьсот тысяч.<br>Календарь платежей на месяц вперёд.<br><em>Перевозки — без Битрикса и без забытых водителей.</em></h1>
  <span class="gtag">макет по встрече 3 октября · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали: 12 человек, 179 фур в сентябре, 8–10 машин в день. Клиент платит вперёд, водителю — после выгрузки и документов, и в эти дни деньги водителей лежат на счёте как будто ваши. Прибыль приходит кусками по 50–300 тысяч, а зарплаты, аренда и кредиты уходят миллионами в первых числах. Битрикс — только ради статусов и базы, уведомления в колокольчике никто не видит.</p>
  <p style="color:#f0a020">Здесь каждый тенге на счёте разложен: водителям, НДС, сотрудникам, налоги, обязательные — и ваше свободное. Календарь платежей с остатком на каждый день, фонды по вашим процентам, долги клиентов, перевозки с договорами и шестью документами, задачи с красными флагами и блоком дашборда, громкие уведомления, KPI логистов, переезд 1 500 перевозчиков.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">21</b></div>
   <div><small>Ролей</small><b>5</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>2 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Выберите роль — система покажет только нужное. Руководитель видит деньги и всё остальное; логист — свои рейсы и свой заработок, без оборота компании; куратор — клиентов и оплаты; офис-менеджер — договоры; бухгалтер — кому платить и какие документы нужны.</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Название, клиенты, водители, номера и суммы придуманы для примера; процессы и цифры масштаба — из встречи. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Трасса">{LOGO.format(w=32,c="#dfe5ea")}</div>',s,count=1,flags=re.S)
rep('<nav id="rail" style="display:flex;flex-direction:column;align-items:center"></nav>','<nav id="rail"></nav>')
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">АМ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Трасса</h1>')
s=re.sub(r'placeholder="[^"]*"','placeholder="рейс, клиент, водитель, госномер, город"',s,count=1)
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="card('newdeal')">+ ПЕРЕВОЗКА</button>\n    <button class="ib bell" id="bell" onclick="beep();go('alerts')" title="Уведомления"></button>''')
rep('  </header>\n','  </header>\n  <div class="mbar" id="mbar"></div>\n')
rep('<script src="/app/uss.js"></script>','<script src="/app/cargo-amirbek.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/cargo-amirbek.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'k{i}.js'),encoding='utf-8').read() for i in range(1,7))
open(ROOT+'/app/cargo-amirbek.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
