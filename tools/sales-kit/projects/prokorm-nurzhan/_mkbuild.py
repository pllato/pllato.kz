# -*- coding: utf-8 -*-
import re
s=open('build.py',encoding='utf-8').read()
s=re.sub(r"LOGO='.*?'\n","LOGO='<svg width=\"{w}\" height=\"{w}\" viewBox=\"0 0 100 100\" aria-hidden=\"true\"><circle cx=\"50\" cy=\"58\" r=\"16\" fill=\"#e07a3a\"/><circle cx=\"28\" cy=\"36\" r=\"8\" fill=\"{c}\"/><circle cx=\"44\" cy=\"24\" r=\"8\" fill=\"{c}\"/><circle cx=\"60\" cy=\"24\" r=\"8\" fill=\"{c}\"/><circle cx=\"74\" cy=\"36\" r=\"8\" fill=\"{c}\"/></svg>'\n",s,count=1)
R=[('placeholder="клиент, телефон, карта, клуб, абонемент"','placeholder="заказ, дилер, товар, партия, контрагент"'),
('<title>FitnessBlitz · единая система сети клубов · демо</title>','<title>ПРОКОРМ · продажи, склад, производство и деньги производителя кормов · демо</title>'),
("fill='%23980017'/><path d='M50 20l8 22h-16zM34 46l32 0M50 42v22l-12 18M50 64l12 18' stroke='%23fff' stroke-width='7' fill='none' stroke-linecap='round'/>","fill='%2323402f'/><circle cx='50' cy='60' r='16' fill='%23e07a3a'/><circle cx='28' cy='38' r='8' fill='%23fff'/><circle cx='72' cy='38' r='8' fill='%23fff'/>"),
("--rail:#7e0a1c;--rail2:#650716;--rail-h:#951428;--rail-a:#ffffff;\n --brand:#7e0a1c;--brand2:#c8102e;--brandl:#f9ecee;","--rail:#23402f;--rail2:#1a3124;--rail-h:#2e5240;--rail-a:#f2a160;\n --brand:#23402f;--brand2:#d9692a;--brandl:#eef3ef;"),
("--acc:#7e0a1c;--acc2:#c8102e;--accl:#f9ecee;","--acc:#23402f;--acc2:#d9692a;--accl:#eef3ef;"),
("--sh2:0 14px 40px rgba(126,10,28,.24)","--sh2:0 14px 40px rgba(35,64,47,.24)"),
("--bg:#f5f3f3","--bg:#f4f4f0"),
("'.gate h1 em{font-style:normal;color:#ffd0d6}'","'.gate h1 em{font-style:normal;color:#f2a160}'"),
('/app/img/blitz/logo.jpg','__NOIMG__'),
('title="FitnessBlitz">{LOGO.format(w=30,c="#ffffff")}<b>BLITZ</b>','title="ПРОКОРМ">{LOGO.format(w=30,c="#ffffff")}<b>КОРМ</b>'),
('id="me">МР</div></div>\')','id="me">НА</div></div>\')'),
('<h1 id="ttl">FitnessBlitz</h1>','<h1 id="ttl">ПРОКОРМ</h1>'),
("""onclick="go('fin')">ФИНАНСЫ</button>""","""onclick="go('orders')">+ ЗАКАЗ</button>"""),
('blitz-murat','prokorm-nurzhan'),("f'f{i}.js'","f'n{i}.js'")]
for a,b in R:
  if a=='/app/img/blitz/logo.jpg':
    continue
  assert a in s,a[:50]; s=s.replace(a,b)
i=s.index("gate=f'''");j=s.index("s=s[:g0]+gate+s[g1:]")
G="""gate=f'''<section class="gate" id="gate">
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
"""
s=s[:i]+G+s[j:]
open('build.py','w',encoding='utf-8').write(s)
print('ok')
