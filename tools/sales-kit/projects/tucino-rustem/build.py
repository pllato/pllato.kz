# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<img src="/app/img/tucino/logo.jpg" width="{w}" height="{w}" style="border-radius:50%;display:block" alt="TUCINO">'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="модель, артикул, размер"')
s=re.sub(r'<title>.*?</title>','<title>TUCINO · система обувных магазинов: касса, склад, бонусы, Kaspi · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"/app/img/tucino/logo.jpg\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#111111;--rail2:#000000;--rail-h:#262626;--rail-a:#c8202f;
 --brand:#151515;--brand2:#c8202f;--brandl:#f3efee;--steel:#8b96a3;
 --bg:#f5f4f2;--card:#fff;--card2:#faf9f7;--card3:#e9e6e2;
 --text:#151515;--muted:#5f5c58;--muted2:#95918c;--line:#e7e3df;--line2:#d2ccc6;
 --acc:#151515;--acc2:#c8202f;--accl:#f3efee;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(0,0,0,.06);--sh2:0 14px 40px rgba(0,0,0,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0e0e0e;--card:#181818;--card2:#1f1f1f;--card3:#2b2b2b;
 --text:#f2f0ee;--muted:#b5b0aa;--muted2:#837e78;--line:#2b2b2b;--line2:#3a3a3a;
 --accl:#2a1a1b;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#ff8a93}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=64,c='#ffffff')}
   <div><b class="gname">TUCINO</b><small class="gsub">ОБУВЬ · СУМКИ · АКСЕССУАРЫ · АСТАНА · MEGA SILK WAY · ASIA PARK</small></div>
  </div>
  <h1>Своя система вместо UMAG и SAGI.<br>Касса, склад, размеры, бонусы и Kaspi — в одном месте.<br><em>Нужная модель и размер — находится за секунды во всех магазинах.</em></h1>
  <span class="gtag">демо по встрече с Рустемом · всё нажимается</span>
  <p style="margin-top:15px">Модель заводится один раз — карточки и штрихкоды на все размеры создаются сами. Продавцы работают на кассе под своим кодом, бонусы клиента начисляются сами. Приём новинок, перемещения, инвентаризация со сканером, рассылки по базе, заявки из WhatsApp, Instagram и Kaspi.</p>
  <p style="color:#ff8a93">Платите один раз — без подписки. Новый магазин — кнопкой.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">16</b></div>
   <div><small>Должностей</small><b>6</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>1,8 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый сотрудник — под своим логином и видит только свою работу. Для показа выберите должность:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Модели, цены, клиенты и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="TUCINO">{LOGO.format(w=30,c="#ffffff")}<b>TUCINO</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">АЛ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">TUCINO</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('pos')">КАССА</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/tucino-rustem.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/tucino-rustem.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'u{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/tucino-rustem.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
