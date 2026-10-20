# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<img src="/app/img/tigers/logo.jpg" width="{w}" height="{w}" alt="" style="border-radius:50%;border:2px solid {c};object-fit:cover;display:block">'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="заказ, клиент, телефон, товар, артикул"')
s=re.sub(r'<title>.*?</title>','<title>Tigers · заказы, склад и точки продаж в одной системе · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23161412'/><path d='M30 34l10 8M70 34l-10 8M36 62c8 8 20 8 28 0' stroke='%23e8862a' stroke-width='8' fill='none' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#161412;--rail2:#0e0d0c;--rail-h:#2a2622;--rail-a:#e8862a;
 --brand:#1d1a17;--brand2:#e8862a;--brandl:#f6efe7;--steel:#8b96a3;
 --bg:#f4f2ef;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#1d1a17;--acc2:#e8862a;--accl:#f6efe7;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(20,18,16,.28);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f0a24e}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=64,c='#e8862a')}
   <div><b class="gname">TIGERS</b><small class="gsub">ВСЁ ДЛЯ ОТДЫХА, РЫБАЛКИ И ОХОТЫ · АЛМАТЫ · @TIGERS001_TEAM</small></div>
  </div>
  <h1>Заявка из Instagram или TikTok — в воронке за секунду, товар — только тот, что есть на складе.<br><em>Заказы, остатки, приходы, касса и точки продаж — в одной системе.</em></h1>
  <span class="gtag">демо по встрече с Алибеком · всё нажимается</span>
  <p style="margin-top:15px">Все заявки из соцсетей и WhatsApp — в одном окне. Заказ собирается из того, что реально лежит на складе: резерв, оплата, сборка, доставка или самовывоз. Приходы и закуп, остатки по точкам, инвентаризация камерой телефона. Касса точки, продажи онлайн и офлайн, маржа — без ручного Excel. Видно, какое видео приводит заявки.</p>
  <p style="color:#f0a24e">Платите один раз — без абонплаты за amoCRM и за каждого продавца.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">16</b></div>
   <div><small>Ролей</small><b>5</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>2,5 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый сотрудник — под своим логином и видит свой участок. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Клиенты, заказы, остатки и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Tigers">{LOGO.format(w=30,c="#e8862a")}<b>TIGERS</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">МГ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Tigers</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('pos')">КАССА</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/tigers-alibek.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/tigers-alibek.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f't{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/tigers-alibek.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
