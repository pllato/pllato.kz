# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<img src="/app/img/blitz/logo.jpg" width="{w}" height="{w}" alt="" style="border-radius:50%;border:2px solid {c};object-fit:cover;display:block">'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="клиент, телефон, карта, клуб, абонемент"')
s=re.sub(r'<title>.*?</title>','<title>FitnessBlitz · единая система сети клубов · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23980017'/><path d='M50 20l8 22h-16zM34 46l32 0M50 42v22l-12 18M50 64l12 18' stroke='%23fff' stroke-width='7' fill='none' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#7e0a1c;--rail2:#650716;--rail-h:#951428;--rail-a:#ffffff;
 --brand:#7e0a1c;--brand2:#c8102e;--brandl:#f9ecee;--steel:#8b96a3;
 --bg:#f5f3f3;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#7e0a1c;--acc2:#c8102e;--accl:#f9ecee;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(126,10,28,.24);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#ffd0d6}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=64,c='#ffffff')}
   <div><b class="gname">FITNESSBLITZ</b><small class="gsub">18 КЛУБОВ · 1 АБОНЕМЕНТ · ЕДИНАЯ СИСТЕМА СЕТИ</small></div>
  </div>
  <h1>Финансы всей сети — прозрачно и онлайн, как у Додо.<br><em>Одно ядро: продажи, касса и бар, турникеты, приложение, тренеры, инвесторы.</em></h1>
  <span class="gtag">демо по встрече с Муратом · всё нажимается</span>
  <p style="margin-top:15px">Доходы из кассы и эквайринга, расходы — по безналу из выписок банков, по наличным из кассы и по снятиям со счёта — сходятся в одном отчёте по каждому клубу. Инвестор и франчайзи видят свои цифры в своём кабинете. Клиент по одному QR проходит в любой из 18 клубов, продлевает абонемент и записывается на групповые занятия из приложения. Тренер ведёт вес, питание и программу клиента.</p>
  <p style="color:#ffd0d6">Своё ядро без абонплаты: модули добавляются к нему по очереди.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">22</b></div>
   <div><small>Ролей</small><b>5</b></div>
   <div><small>Этап 1</small><b>3 млн ₸</b></div>
   <div><small>Вся система</small><b>6,5 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый — под своим логином и видит свой уровень: сеть, клуб, тренер или инвестор. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Клубы, клиенты, суммы и показатели придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="FitnessBlitz">{LOGO.format(w=30,c="#ffffff")}<b>BLITZ</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">МР</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">FitnessBlitz</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('fin')">ФИНАНСЫ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/blitz-murat.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/blitz-murat.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f),encoding='utf-8').read() for f in ['f1.js','f2.js','f3.js','f5.js','f4.js'])
open(ROOT+'/app/blitz-murat.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
