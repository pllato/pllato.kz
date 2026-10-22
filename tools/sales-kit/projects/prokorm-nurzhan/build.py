# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="58" r="16" fill="#e07a3a"/><circle cx="28" cy="36" r="8" fill="{c}"/><circle cx="44" cy="24" r="8" fill="{c}"/><circle cx="60" cy="24" r="8" fill="{c}"/><circle cx="74" cy="36" r="8" fill="{c}"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="заказ, дилер, товар, партия, контрагент"')
s=re.sub(r'<title>.*?</title>','<title>ПРОКОРМ · продажи, склад, производство и деньги производителя кормов · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2323402f'/><circle cx='50' cy='60' r='16' fill='%23e07a3a'/><circle cx='28' cy='38' r='8' fill='%23fff'/><circle cx='72' cy='38' r='8' fill='%23fff'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#23402f;--rail2:#1a3124;--rail-h:#2e5240;--rail-a:#f2a160;
 --brand:#23402f;--brand2:#d9692a;--brandl:#eef3ef;--steel:#8b96a3;
 --bg:#f4f4f0;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#23402f;--acc2:#d9692a;--accl:#eef3ef;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(35,64,47,.24);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f2a160}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">ПРОКОРМ</b><small class="gsub">ПРОИЗВОДСТВО КОРМОВ ДЛЯ ДОМАШНИХ ЖИВОТНЫХ · ДИЛЕРЫ ПО КАЗАХСТАНУ</small></div>
  </div>
  <h1>Вместо МойСклад и Битрикса — одна система: продажи, склад, производство и деньги.<br><em>Кто кому должен, сколько и когда — на одном экране.</em></h1>
  <span class="gtag">демо по встрече с Нуржаном · всё нажимается</span>
  <p style="margin-top:15px">Заказы дилеров, Kaspi Магазина и Halyk Market в одной воронке. Склад сырья и готовой продукции, выпуск партий по рецептуре. Дебиторка и кредиторка со сроками, консигнация с датой закрытия, движение денег. ABC-анализ продаж. Дилеры подают заявки в своём кабинете, водители видят свои рейсы. Обмен с 1С.</p>
  <p style="color:#f2a160">Один раз — без подписок МойСклад и Битрикс за каждого пользователя.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">16</b></div>
   <div><small>Ролей</small><b>6</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>С 1С</small><b>2,8 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый видит только своё: дилер — свои заявки, водитель — свои рейсы. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Товары, дилеры, суммы и сроки придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="ПРОКОРМ">{LOGO.format(w=30,c="#ffffff")}<b>КОРМ</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">НА</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">ПРОКОРМ</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('orders')">+ ЗАКАЗ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/prokorm-nurzhan.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/prokorm-nurzhan.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'n{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/prokorm-nurzhan.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
