# -*- coding: utf-8 -*-
# Демо «АҚ ТІС» (Адеми · сеть стоматологий, 4 филиала): каркас app/uss.html + d1–d3.js → app/stom-ademi.html/.js
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M22 30c0-12 10-18 20-14l8 3 8-3c10-4 20 2 20 14 0 14-6 22-8 36-2 12-5 20-10 20-6 0-5-16-10-16s-4 16-10 16c-5 0-8-8-10-20-2-14-8-22-8-36z" fill="{c}"/><circle cx="70" cy="26" r="9" fill="#3fc1b0"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="пациент, телефон, врач"')
s=re.sub(r'<title>.*?</title>','<title>Ақ тіс · сеть стоматологий: запись, подтверждения в WhatsApp, планы лечения, ОСМС, склад · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230e3b4a'/><path d='M24 32c0-11 9-16 18-13l8 3 8-3c9-3 18 2 18 13 0 13-5 20-7 33-2 11-5 18-9 18-5 0-5-14-10-14s-5 14-10 14c-4 0-7-7-9-18-2-13-7-20-7-33z' fill='%23ffffff'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#0e3b4a;--rail2:#0a2c38;--rail-h:#16505f;--rail-a:#5fd3c3;
 --brand:#0e3b4a;--brand2:#14998a;--brandl:#e3f4f1;--steel:#8b96a3;
 --bg:#f2f6f7;--card:#fff;--card2:#f8fafb;--card3:#e2ecee;
 --text:#122a33;--muted:#56707a;--muted2:#8aa0a8;--line:#dfe8ea;--line2:#c6d5d9;
 --acc:#0e3b4a;--acc2:#14998a;--accl:#e3f4f1;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(14,59,74,.06);--sh2:0 14px 40px rgba(14,59,74,.28);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1520;--card:#121f2d;--card2:#182838;--card3:#22364a;
 --text:#eaf1f7;--muted:#a6b8cb;--muted2:#74889c;--line:#22364a;--line2:#2f475e;
 --accl:#17283d;--brandl:#17283d;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#5fd3c3}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">АҚ ТІС</b><small class="gsub">СЕТЬ СТОМАТОЛОГИЙ · 4 ФИЛИАЛА · ДЕТИ И БЕРЕМЕННЫЕ ПО ОСМС</small></div>
  </div>
  <h1>Запись, пациенты, лечение, склад и госзаказ — в одной системе.<br><em>Вместо MacDent с оплатой за каждый филиал.</em></h1>
  <span class="gtag">демо по встрече с Адеми · всё нажимается</span>
  <p style="margin-top:15px">Расписание врачей по креслам во всех филиалах. Каждое утро пациенты получают в WhatsApp «у вас сегодня запись — подтверждаете?». Чаты и воронка, карта пациента с зубной формулой, планы лечения, прайсы. Склад материалов со списанием на приём. Услуги детям и беременным по ОСМС — с проверкой кодов до отправки.</p>
  <p style="color:#5fd3c3">4 филиала с запасом до 6, без ограничения по сотрудникам. Система ваша, платите один раз.</p>
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
   <p>Каждый видит своё: руководитель — всю сеть и деньги, администратор — запись и чаты, врач — своё расписание и карты, специалист по ОСМС — госзаказ, медсестра — склад. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Пациенты, врачи, цены и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Ақ тіс">{LOGO.format(w=30,c="#ffffff")}<b>АТ</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">АД</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">АҚ ТІС</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('sched')">+ ЗАПИСЬ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/stom-ademi.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/stom-ademi.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'd{i}.js'),encoding='utf-8').read() for i in range(1,4))
open(ROOT+'/app/stom-ademi.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
