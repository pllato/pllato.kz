# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8l34 13v26c0 22-15 38-34 45C31 85 16 69 16 47V21z" fill="{c}"/><path d="M50 26v40M34 46h32" stroke="#e0453a" stroke-width="8" stroke-linecap="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="абонент, адрес, номер договора"')
s=re.sub(r'<title>.*?</title>','<title>Охрана · абоненты, пульт, кабинет клиента и персонал · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23141b24'/><path d='M50 16l26 10v20c0 17-11 29-26 35C35 75 24 63 24 46V26z' fill='%23fff'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#141b24;--rail2:#0c1118;--rail-h:#222c39;--rail-a:#ff7a6e;
 --brand:#1c2a3a;--brand2:#e0453a;--brandl:#eaeef3;--steel:#8b96a3;
 --bg:#f4f4f0;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#1c2a3a;--acc2:#e0453a;--accl:#eaeef3;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(20,27,36,.28);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#ff7a6e}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">ОХРАНА</b><small class="gsub">ЕДИНАЯ СИСТЕМА ОХРАННОГО АГЕНТСТВА · АБОНЕНТЫ · ПУЛЬТ · ПЕРСОНАЛ</small></div>
  </div>
  <h1>Без Excel: абоненты, счета, долги и отключения — сами.<br><em>Директора видят готовые цифры в телефоне.</em></h1>
  <span class="gtag">демо по встрече с Кадыржаном · всё нажимается</span>
  <p style="margin-top:15px">Полный цикл обслуживания абонентов: счета и акты за месяц, напоминания об оплате и отключении, отключение и включение. Новые клиенты — от заявки до договора с ЭЦП и подключения к пульту. Тревожные кнопки сведены в систему, экипажу — вызов с маршрутом в 2ГИС. Кабинет клиента с документами. Кадры и электронные заявления с визой директора.</p>
  <p style="color:#ff7a6e">На вашем сервере · под NDA · рассчитано на 200+ сотрудников и 4 000+ абонентов.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">20</b></div>
   <div><small>Ролей</small><b>7</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Портал</small><b>2,5 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый видит своё: директор — всё, экипаж — свои вызовы, сотрудник — свои заявления, клиент — свой кабинет. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Название агентства, клиенты, сотрудники и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Охрана">{LOGO.format(w=30,c="#ffffff")}<b>ОХР</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">ДР</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">ОХРАНА</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('funnel')">+ КЛИЕНТ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/ohrana-kadyrzhan.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/ohrana-kadyrzhan.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'o{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/ohrana-kadyrzhan.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
