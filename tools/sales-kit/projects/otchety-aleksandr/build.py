# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 10C38 30 28 44 28 60a22 22 0 0044 0c0-16-10-30-22-50z" fill="{c}"/><path d="M36 64h8l5-12 6 20 5-8h6" stroke="#f2a20c" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="товар, код, филиал"')
s=re.sub(r'<title>.*?</title>','<title>Пульс · отчёты из 1С: склады, продажи, ABC · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2310202b'/><path d='M50 16C40 32 32 44 32 58a18 18 0 0036 0c0-14-8-26-18-42z' fill='%23f2a20c'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#10202b;--rail2:#0a161e;--rail-h:#1c3140;--rail-a:#f6b73c;
 --brand:#173244;--brand2:#e08e00;--brandl:#e9f0f4;--steel:#8b96a3;
 --bg:#f4f4f0;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#173244;--acc2:#e08e00;--accl:#e9f0f4;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(16,32,43,.28);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f6b73c}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">ПУЛЬС</b><small class="gsub">ОТЧЁТЫ ИЗ 1С · ДИСТРИБУЦИЯ МАСЕЛ И ТЕХЖИДКОСТЕЙ · 11 ФИЛИАЛОВ</small></div>
  </div>
  <h1>Отчёты из 1С за секунду — в телефоне и в Битрикс24.<br><em>Склады, движение, ABC и продажи без 5-минутного формирования.</em></h1>
  <span class="gtag">демо по встрече с Александром · всё нажимается</span>
  <p style="margin-top:15px">Отдельный портал отчётов поверх 1С: остатки и движение по 11 складам, оборачиваемость и запас в днях, ABC/XYZ, план-факт по филиалам и менеджерам, дебиторка. Ваши нестандартные отчёты — в конструкторе, права на каждый отчёт, рассылка задачами в Битрикс24. Битрикс и ваши процессы остаются как есть.</p>
  <p style="color:#f6b73c">Гибче Power BI · подключение к 1С по OData · сначала тестовая база.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">14</b></div>
   <div><small>Ролей</small><b>5</b></div>
   <div><small>Срок</small><b>3–4 недели</b></div>
   <div><small>С 1С</small><b>1 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый видит только свои отчёты: руководитель филиала — свой склад, менеджер получает отчёт задачей в Битрикс24. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Товары, бренды, клиенты и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Пульс">{LOGO.format(w=30,c="#ffffff")}<b>ПЛС</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">АК</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">ПУЛЬС</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('builder')">+ ОТЧЁТ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/otchety-aleksandr.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/otchety-aleksandr.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'a{i}.js'),encoding='utf-8').read() for i in range(1,4))
open(ROOT+'/app/otchety-aleksandr.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
