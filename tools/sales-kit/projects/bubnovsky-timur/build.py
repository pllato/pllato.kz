# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="{c}" stroke-width="7"/><path d="M50 18c-9 8 9 14 0 22s9 14 0 22-9 14 0 20" fill="none" stroke="#f26a3d" stroke-width="8" stroke-linecap="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="номер карты, телефон, фамилия"')
s=re.sub(r'<title>.*?</title>','<title>Центр Бубновского · Уральск · учёт пациентов и записи · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23173f6e'/><path d='M50 16c-10 9 10 15 0 24s10 15 0 24-10 15 0 20' fill='none' stroke='%23f26a3d' stroke-width='9' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#173f6e;--rail2:#11325a;--rail-h:#1f4f86;--rail-a:#f26a3d;
 --brand:#173f6e;--brand2:#f26a3d;--brandl:#e8eef7;--steel:#8b96a3;
 --bg:#f3f5f9;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#173f6e;--acc2:#f26a3d;--accl:#e8eef7;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(23,63,110,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#ffb08f}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">ЦЕНТР БУБНОВСКОГО</b><small class="gsub">УРАЛЬСК · ЛЕЧЕНИЕ ПОЗВОНОЧНИКА И СУСТАВОВ · КИНЕЗИТЕРАПИЯ</small></div>
  </div>
  <h1>Пациент пришёл — набрали номер карты, и сразу видно: кто это, сколько занятий прошёл и сколько осталось.<br><em>Запись, напоминания и пациенты, которые пропали, — система следит сама.</em></h1>
  <span class="gtag">демо по встрече с Тимуром · всё нажимается</span>
  <p style="margin-top:15px">Отметка визита за пару секунд вместо ручной таблицы. Запись по времени и инструкторам, напоминание в WhatsApp за день и за 3 часа с подтверждением. Курс лечения и абонемент на 12 занятий у каждого пациента. Кто не был 10 дней — подсвечивается для звонка. Бонусы инструкторам считаются сами.</p>
  <p style="color:#ffb08f">Платите один раз — без абонплаты. Система ваша, на вашем сервере.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">14</b></div>
   <div><small>Ролей</small><b>4</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>2 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый сотрудник — под своим логином. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Пациенты, диагнозы, инструкторы и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Центр Бубновского">{LOGO.format(w=30,c="#ffffff")}<b>ЦБ</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">ТМ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Центр Бубновского</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('checkin')">ОТМЕТИТЬ ВИЗИТ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/bubnovsky-timur.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/bubnovsky-timur.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'b{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/bubnovsky-timur.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
