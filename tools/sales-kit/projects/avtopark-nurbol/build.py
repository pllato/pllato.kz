# -*- coding: utf-8 -*-
# Демо «ДРАЙВ АРЕНДА» (Нурбол · аренда авто под такси, Астана + Алматы): каркас app/uss.html + n1–n3.js → app/avtopark-nurbol.html/.js
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="{c}"/><circle cx="50" cy="50" r="26" fill="#f5b800"/><circle cx="50" cy="50" r="9" fill="{c}"/><rect x="47" y="24" width="6" height="18" fill="{c}"/><rect x="47" y="58" width="6" height="18" fill="{c}"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="код, госномер, модель, водитель"')
s=re.sub(r'<title>.*?</title>','<title>Драйв Аренда · оплаты, блокировка, водители и штрафы автопарка · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23141d2b'/><circle cx='50' cy='50' r='28' fill='%23f5b800'/><circle cx='50' cy='50' r='10' fill='%23141d2b'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#141d2b;--rail2:#0e1520;--rail-h:#22304a;--rail-a:#f5b800;
 --brand:#1b2a42;--brand2:#e0a500;--brandl:#eef1f6;--steel:#8b96a3;
 --bg:#f3f4f1;--card:#fff;--card2:#f8fafb;--card3:#e3e9f0;
 --text:#13233a;--muted:#55657a;--muted2:#8a98a8;--line:#e0e6ee;--line2:#c9d3df;
 --acc:#1b2a42;--acc2:#e0a500;--accl:#eef1f6;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(19,35,58,.06);--sh2:0 14px 40px rgba(20,29,43,.28);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1520;--card:#121f2d;--card2:#182838;--card3:#22364a;
 --text:#eaf1f7;--muted:#a6b8cb;--muted2:#74889c;--line:#22364a;--line2:#2f475e;
 --accl:#17283d;--brandl:#17283d;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f5b800}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">ДРАЙВ АРЕНДА</b><small class="gsub">АРЕНДА АВТО ПОД ТАКСИ · АСТАНА · АЛМАТЫ · 216 МАШИН</small></div>
  </div>
  <h1>Не оплатил к 21:00 — машина блокируется сама.<br><em>Оплаты, машины, водители и штрафы в одном окне.</em></h1>
  <span class="gtag">демо по встрече с Нурболом · всё нажимается</span>
  <p style="margin-top:15px">Оплата в Каспий Платежах по коду машины продлевает аренду на сутки без людей. Все машины на одной карте из обоих GPS-сервисов. Воронка водителей, договоры с ЭЦП, eGov или на бумаге. Штрафы по камерам каждое утро — протокол водителю в WhatsApp. Астана и Алматы — раздельно.</p>
  <p style="color:#f5b800">Без платы за каждую машину и процента от оборота: система ваша, один раз.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">16</b></div>
   <div><small>Ролей</small><b>5</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Пакет</small><b>2,875 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый видит своё: управляющий — весь парк, менеджер — только свой город, механик — ремонты, юрист — штрафы. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Машины, водители, госномера и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Драйв Аренда">{LOGO.format(w=30,c="#ffffff")}<b>ДА</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">НБ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">ДРАЙВ АРЕНДА</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('dfunnel')">+ ВОДИТЕЛЬ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/avtopark-nurbol.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/avtopark-nurbol.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'n{i}.js'),encoding='utf-8').read() for i in range(1,4))
open(ROOT+'/app/avtopark-nurbol.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
