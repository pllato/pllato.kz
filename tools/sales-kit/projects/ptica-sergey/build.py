# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M14 40l36-22 36 22v44H14z" fill="none" stroke="{c}" stroke-width="7" stroke-linejoin="round"/><rect x="30" y="56" width="40" height="28" fill="none" stroke="#f0a830" stroke-width="6"/><path d="M30 70h40" stroke="#f0a830" stroke-width="6"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="паллета, партия, заявка, машина, сотрудник"')
s=re.sub(r'<title>.*?</title>','<title>Склад готовой продукции · птицефабрика · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23163447'/><rect x='28' y='46' width='44' height='32' fill='none' stroke='%23f0a830' stroke-width='8'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#163447;--rail2:#102838;--rail-h:#1f4459;--rail-a:#f0a830;
 --brand:#163447;--brand2:#e09a1c;--brandl:#eef3f6;--steel:#8b96a3;
 --bg:#f2f3f4;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#163447;--acc2:#e09a1c;--accl:#eef3f6;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(22,52,71,.24);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f6c25a}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">СКЛАД ГП</b><small class="gsub">ПТИЦЕФАБРИКА · СКЛАД ГОТОВОЙ ПРОДУКЦИИ · ПИЛОТНЫЙ БЛОК</small></div>
  </div>
  <h1>Каждый короб — по весу, каждая паллета — по четырём взвешиваниям, каждая машина — по семи подтверждениям.<br><em>Ошибиться нельзя: процесс просто не пойдёт дальше.</em></h1>
  <span class="gtag">демо по встрече с Сергеем · всё нажимается</span>
  <p style="margin-top:15px">Приёмка из убойного цеха сверяет этикетки коробов, паллетные весы цеха и чистой зоны и пересканирование ТСД. Паллета получает QR и ячейку, отбор — строго по FIFO. Отгрузка: сборка по ТСД против заявки, вес, номер машины с камеры, пломба, документы, охрана — и только тогда открывается шлагбаум. У каждого шага — фамилия. Утром — отчёт в кг и в деньгах.</p>
  <p style="color:#f6c25a">Склад — первый блок. Дальше: КПП, учёт рабочего времени, производство, продажи.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">16</b></div>
   <div><small>Ролей</small><b>5</b></div>
   <div><small>Пилот</small><b>3–4 недели</b></div>
   <div><small>Объём</small><b>5–6 тыс. т/год</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый — под своим логином и PIN: подпись в системе равна подписи на бумаге. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Позиции, веса, покупатели и фамилии придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Склад ГП">{LOGO.format(w=30,c="#ffffff")}<b>СКЛАД</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">СД</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Склад ГП</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('tsd')">ТСД</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/ptica-sergey.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/ptica-sergey.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'p{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/ptica-sergey.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
