# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect x="14" y="30" width="72" height="40" rx="20" fill="{c}"/><path d="M30 42v16M42 42v16M54 42v16M66 42v16" stroke="#e0a33a" stroke-width="5" stroke-linecap="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="позиция, код, клиент"')
s=re.sub(r'<title>.*?</title>','<title>Мясокомбинат · заявки, склады и производство · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%234a1418'/><rect x='18' y='34' width='64' height='32' rx='16' fill='%23e0a33a'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#4a1418;--rail2:#350d10;--rail-h:#5e1c21;--rail-a:#f0b44c;
 --brand:#5a1a1f;--brand2:#c98a1e;--brandl:#f6eeee;--steel:#8b96a3;
 --bg:#f4f4f0;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#5a1a1f;--acc2:#c98a1e;--accl:#f6eeee;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(74,20,24,.28);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f0b44c}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">МЯСОКОМБИНАТ</b><small class="gsub">КОЛБАСНЫЕ ИЗДЕЛИЯ · ЩУЧИНСК · АКМОЛИНСКАЯ ОБЛАСТЬ</small></div>
  </div>
  <h1>Заявка на производство считается сама — без пересортов и «на глаз».<br><em>Торговый видит, что на складе и что уже в пути.</em></h1>
  <span class="gtag">демо по встрече с Виталием · всё нажимается</span>
  <p style="margin-top:15px">Заявки торговых из МОБИЭС, от операторов и оптовиков — в одной ленте. Единая номенклатура для портала, МОБИЭС и 1С. Склад готовой продукции, рейсы и склад реализации с приёмкой одной кнопкой. Партии не дольше 5 дней на складе. Мастер жмёт «готово» — продукция на складе. 1С остаётся бухгалтерией.</p>
  <p style="color:#f0b44c">МОБИЭС остаётся у торговых — интегрируемся, ничего не ломаем.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">18</b></div>
   <div><small>Ролей</small><b>6</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>С интеграциями</small><b>2,8 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый видит своё: оператор — заявки, склад — приёмку и сроки, мастер — заявку на производство, торговый — остатки с телефона. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Продукция, клиенты, объёмы и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Мясокомбинат">{LOGO.format(w=30,c="#ffffff")}<b>МК</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">ВТ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">МЯСОКОМБИНАТ</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('orders')">+ ЗАЯВКА</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/myaso-vitaliy.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/myaso-vitaliy.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'm{i}.js'),encoding='utf-8').read() for i in range(1,4))
open(ROOT+'/app/myaso-vitaliy.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
