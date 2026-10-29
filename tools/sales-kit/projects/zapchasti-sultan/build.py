# -*- coding: utf-8 -*-
# Демо «ГРУЗДЕТАЛЬ» (Султан · запчасти для самосвалов и грузовиков): каркас app/uss.html + z1–z3.js → app/zapchasti-sultan.html/.js
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8l36 21v42L50 92 14 71V29z" fill="{c}"/><circle cx="50" cy="50" r="15" fill="#e8731a"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="артикул, запчасть, клиент"')
s=re.sub(r'<title>.*?</title>','<title>Груздеталь · запчасти для спецтехники: продажи, долги, склад, каталог, закуп · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23262b30'/><path d='M50 14l31 18v36L50 86 19 68V32z' fill='%23ffffff'/><circle cx='50' cy='50' r='13' fill='%23e8731a'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#262b30;--rail2:#1b1f23;--rail-h:#353b42;--rail-a:#f39a4a;
 --brand:#262b30;--brand2:#d9661a;--brandl:#fcefe4;--steel:#8b96a3;
 --bg:#f3f3f1;--card:#fff;--card2:#f8f8f6;--card3:#e8e7e3;
 --text:#1d2125;--muted:#5f656b;--muted2:#8f959a;--line:#e3e2de;--line2:#cfcdc7;
 --acc:#262b30;--acc2:#d9661a;--accl:#fcefe4;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(29,33,37,.06);--sh2:0 14px 40px rgba(29,33,37,.28);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1520;--card:#121f2d;--card2:#182838;--card3:#22364a;
 --text:#eaf1f7;--muted:#a6b8cb;--muted2:#74889c;--line:#22364a;--line2:#2f475e;
 --accl:#17283d;--brandl:#17283d;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f39a4a}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">ГРУЗДЕТАЛЬ</b><small class="gsub">ЗАПЧАСТИ ДЛЯ САМОСВАЛОВ И ГРУЗОВИКОВ · ОТ КУЗОВА ДО ШАЙБЫ</small></div>
  </div>
  <h1>Продажи, долги, склад и закуп — в одном окне.<br><em>Вместо 20 групп WhatsApp и бумажных накладных.</em></h1>
  <span class="gtag">демо по встрече с Султаном · всё нажимается</span>
  <p style="margin-top:15px">Продажа оформляется в один клик с телефона: фото, артикул, цена, оплата. Журнал оплат QR, наличными и безналом ведётся сам. Долги по каждому клиенту со сроками и напоминаниями, электронные накладные вместо бумажных. Каталог 1000+ позиций по маркам самосвалов, остатки, приход контейнеров, закуп. Кэшбэк клиентам и выгрузка бухгалтеру в 1С.</p>
  <p style="color:#f39a4a">До 50 пользователей, без аренды и абонплаты. Система ваша, на вашем сервере.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">14</b></div>
   <div><small>Ролей</small><b>5</b></div>
   <div><small>Срок</small><b>≈ 6 недель</b></div>
   <div><small>Пакет</small><b>2 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый видит своё: владелец — всё и деньги, закупщик — остатки и закуп, оператор продаж — продажи и оплаты, оператор по долгам — долги и накладные, склад — приход и инвентаризацию. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Название, клиенты, запчасти, цены и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Груздеталь">{LOGO.format(w=30,c="#ffffff")}<b>ГД</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">ВЛ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">ГРУЗДЕТАЛЬ</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('groups')">+ ПРОДАЖА</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/zapchasti-sultan.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/zapchasti-sultan.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'z{i}.js'),encoding='utf-8').read() for i in range(1,4))
open(ROOT+'/app/zapchasti-sultan.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
