# -*- coding: utf-8 -*-
# Демо «ШАГОМ» (Мухтар · магазины обуви, Алматы + Астана): каркас app/uss.html + m1–m3.js → app/obuv-mukhtar.html/.js
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="40" cy="58" rx="17" ry="30" fill="{c}"/><ellipse cx="66" cy="34" rx="12" ry="20" fill="#d08a4e"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="модель, артикул, клиент"')
s=re.sub(r'<title>.*?</title>','<title>Шагом · магазины обуви: чаты, склад по размерам, касса, лояльность · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%233a2418'/><ellipse cx='42' cy='58' rx='15' ry='26' fill='%23f3e7d6'/><ellipse cx='66' cy='34' rx='10' ry='17' fill='%23d08a4e'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#3a2418;--rail2:#2b1a11;--rail-h:#4d3122;--rail-a:#e9a46a;
 --brand:#4a2e1f;--brand2:#b8682c;--brandl:#f4ece3;--steel:#8b96a3;
 --bg:#f6f2ec;--card:#fff;--card2:#f8fafb;--card3:#ece4da;
 --text:#2a1d15;--muted:#6e5f54;--muted2:#9c8d82;--line:#e9e0d6;--line2:#d6c9bb;
 --acc:#4a2e1f;--acc2:#b8682c;--accl:#f4ece3;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(42,29,21,.06);--sh2:0 14px 40px rgba(42,29,21,.28);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1520;--card:#121f2d;--card2:#182838;--card3:#22364a;
 --text:#eaf1f7;--muted:#a6b8cb;--muted2:#74889c;--line:#22364a;--line2:#2f475e;
 --accl:#17283d;--brandl:#17283d;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#e9a46a}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">ШАГОМ</b><small class="gsub">МАГАЗИНЫ ОБУВИ · АЛМАТЫ · АСТАНА · KASPI · INSTAGRAM</small></div>
  </div>
  <h1>Чаты, склад, касса и деньги — в одном окне.<br><em>Вместо МойСклад, отдельных телефонов и таблиц.</em></h1>
  <span class="gtag">демо по встрече с Мухтаром · всё нажимается</span>
  <p style="margin-top:15px">WhatsApp, Instagram и звонки в одной ленте с меткой креатива. Остатки по размерам в двух магазинах и на Kaspi из одного учёта. Касса на моноблоке с бонусами, инвентаризация с QR, программа лояльности. Прибыль, движение денег и пульт собственников.</p>
  <p style="color:#e9a46a">Без абонплаты за пользователей и магазины: система ваша, один раз.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">14</b></div>
   <div><small>Ролей</small><b>5</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Пакет</small><b>2 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый видит своё: собственники — всё и деньги, менеджер — чаты и заявки, продавец — кассу, склад — остатки и инвентаризацию. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Модели, клиенты, цены и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Шагом">{LOGO.format(w=30,c="#ffffff")}<b>ШГ</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">МХ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">ШАГОМ</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('pos')">+ ПРОДАЖА</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/obuv-mukhtar.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/obuv-mukhtar.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'm{i}.js'),encoding='utf-8').read() for i in range(1,4))
open(ROOT+'/app/obuv-mukhtar.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
