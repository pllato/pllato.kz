# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="38" fill="{c}"/><circle cx="50" cy="50" r="22" fill="#f07b16"/><circle cx="50" cy="50" r="10" fill="{c}"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="клиент, изделие, номер сделки"')
s=re.sub(r'<title>.*?</title>','<title>ПУ Деталь · CRM и производство изделий из полиуретана · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%231e2228'/><circle cx='50' cy='50' r='30' fill='%23f07b16'/><circle cx='50' cy='50' r='12' fill='%231e2228'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#1e2228;--rail2:#15181c;--rail-h:#2b3038;--rail-a:#ff9a3c;
 --brand:#2a2f37;--brand2:#e86f0c;--brandl:#eef0f2;--steel:#8b96a3;
 --bg:#f4f4f0;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#2a2f37;--acc2:#e86f0c;--accl:#eef0f2;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(30,34,40,.28);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#ff9a3c}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">ПУ ДЕТАЛЬ</b><small class="gsub">ПРОИЗВОДСТВО ИЗДЕЛИЙ ИЗ ПОЛИУРЕТАНА · ВТУЛКИ · САЙЛЕНТБЛОКИ · ФУТЕРОВКА</small></div>
  </div>
  <h1>Каждое обращение — сразу к менеджеру, от чертежа до отгрузки.<br><em>Расчёт, КП, счёт и договор — одной кнопкой в WhatsApp.</em></h1>
  <span class="gtag">демо по встрече с Оксаной · всё нажимается</span>
  <p style="margin-top:15px">WhatsApp, телефония, сайт, Instagram и площадки в одной ленте. Воронка заказного изделия: фото и чертёж, расчёт цены по вашим нормам, КП, счёт, оплата, цех, отгрузка. Источники рекламы и KPI менеджеров. Производство по этапам, пресс-формы, склад сырья и готовой продукции.</p>
  <p style="color:#ff9a3c">Не подписка за каждого пользователя: система ваша, один раз.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">16</b></div>
   <div><small>Ролей</small><b>5</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Пакет</small><b>1,5 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый видит своё: менеджер — свои обращения и расчёты, цех — заказы по этапам, склад — остатки. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Клиенты, изделия, цены и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="ПУ Деталь">{LOGO.format(w=30,c="#ffffff")}<b>ПУ</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">ОК</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">ПУ ДЕТАЛЬ</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('inbox')">+ ОБРАЩЕНИЕ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/pu-oksana.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/pu-oksana.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'u{i}.js'),encoding='utf-8').read() for i in range(1,4))
open(ROOT+'/app/pu-oksana.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
