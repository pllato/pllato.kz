# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect x="12" y="12" width="76" height="76" rx="6" fill="none" stroke="{c}" stroke-width="7"/><path d="M24 58c10 0 12-16 26-16s16 16 26 16" fill="none" stroke="#f2b01e" stroke-width="8" stroke-linecap="round"/><path d="M24 72h52" stroke="#f2b01e" stroke-width="6" stroke-linecap="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="проект, клиент, КП, договор, артикул"')
s=re.sub(r'<title>.*?</title>','<title>ПОТОК · CRM и учёт дистрибьютора промышленного оборудования · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2322303a'/><path d='M22 58c10 0 12-16 28-16s18 16 28 16' fill='none' stroke='%23f2b01e' stroke-width='9' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#22303a;--rail2:#18232b;--rail-h:#2e3f4b;--rail-a:#f2b01e;
 --brand:#22303a;--brand2:#f2b01e;--brandl:#eef1f3;--steel:#8b96a3;
 --bg:#f2f3f1;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#22303a;--acc2:#f2b01e;--accl:#eef1f3;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(34,48,58,.24);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f2b01e}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">ПОТОК</b><small class="gsub">ДИСТРИБУЦИЯ ПРОМЫШЛЕННОГО ОБОРУДОВАНИЯ · НЕФТЬ, ГАЗ, ЭНЕРГЕТИКА · B2B</small></div>
  </div>
  <h1>Проекты заводов, которые тянутся годами, — в одной системе вместо Trello и Google-таблиц.<br><em>Заявка → КП → договор → поставка, и ни один проект не забыт.</em></h1>
  <span class="gtag">демо по встрече с Рауаном · всё нажимается</span>
  <p style="margin-top:15px">Проект завода с задачами и напоминаниями на годы вперёд. Номенклатура и прайсы с импортом из Excel, подбор по опциям, ИИ разбирает PDF-предложение поставщика в позиции. КП и договоры в любой валюте по курсу Нацбанка, подписание ЭЦП. Срок поставки сам считается от дня предоплаты. Почта, WhatsApp и телефония — в одном окне, для офиса и удалённых сотрудников.</p>
  <p style="color:#f2b01e">Своя система: без подписки за каждого сотрудника, код и данные ваши.</p>
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
   <p>Каждый сотрудник — под своим логином, из офиса или удалённо. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Проекты, клиенты, цены и курсы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="ПОТОК">{LOGO.format(w=30,c="#ffffff")}<b>ПОТОК</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">РА</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">ПОТОК</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('quote')">+ КП</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/potok-rauan.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/potok-rauan.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'p{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/potok-rauan.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
