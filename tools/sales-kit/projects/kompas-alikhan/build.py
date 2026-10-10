# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="{c}" stroke-width="8"/><path d="M50 18 62 50 50 82 38 50z" fill="#ff6b4a"/><circle cx="50" cy="50" r="6" fill="{c}"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="заказ, турист, телефон, рейс"')
s=re.sub(r'<title>.*?</title>','<title>КОМПАС · админка турагентства: заказы, рейсы, push, финансы · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230b4f6c'/><circle cx='50' cy='50' r='32' fill='none' stroke='%23fff' stroke-width='8'/><path d='M50 22 60 50 50 78 40 50z' fill='%23ff6b4a'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=JetBrains+Mono:wght@400;500;600&family=Unbounded:wght@500;600;700&family=Rubik:wght@400;500;600;700&display=swap')
s=s.replace("'Golos Text'","'Rubik'")
root=''':root{
 --rail:#0b4f6c;--rail2:#083b51;--rail-h:#0f6185;--rail-a:#ff6b4a;
 --brand:#0b4f6c;--brand2:#ff6b4a;--brandl:#e6f0f4;--steel:#8b96a3;
 --bg:#f3f6f8;--card:#fff;--card2:#f6f9fb;--card3:#e5ecf0;
 --text:#122430;--muted:#516573;--muted2:#8697a3;--line:#dfe7ec;--line2:#c7d3db;
 --acc:#0b4f6c;--acc2:#ff6b4a;--accl:#e6f0f4;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,36,48,.06);--sh2:0 14px 40px rgba(11,79,108,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0d171d;--card:#13212a;--card2:#182a35;--card3:#223744;
 --text:#e7f0f5;--muted:#a1b4c0;--muted2:#6f8594;--line:#223744;--line2:#2f4857;
 --accl:#13303d;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#ffb39f}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">КОМПАС</b><small class="gsub">АДМИН-ПАНЕЛЬ ТУРАГЕНТСТВА · ЗАКАЗЫ · РЕЙСЫ · ПРИЛОЖЕНИЕ ТУРИСТА</small></div>
  </div>
  <h1>Заказы, рейсы и туристы — под контролем с телефона.<br>Перенос рейса — и все туристы узнают за минуту.<br><em>Финансы, документы и история каждого изменения — в одном месте.</em></h1>
  <span class="gtag">макет по вашему ТЗ · все 11 пунктов · всё кликается</span>
  <p style="margin-top:15px">Ваше ТЗ: дашборд с аналитикой, удобная админка с телефона, фирменные цвета, массовые push по рейсу, дате, направлению и авиакомпании, история изменений заказа, журнал действий, финансы, автоуведомления туристам, информативная карточка заказа, выгрузки в Excel, сохранённые фильтры.</p>
  <p style="color:#ffb39f">Плюс то, что нужно турагентству каждый день: рейсы с переносом и задержками, туристы и приложение, направления и туры, роли сотрудников.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">15</b></div>
   <div><small>Ролей</small><b>5</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>2,5 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Каждый сотрудник — под своим логином. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Название, туристы, рейсы, авиакомпании, отели и суммы придуманы для примера. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Компас">{LOGO.format(w=30,c="#ffffff")}<b>КОМПАС</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">АЛ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Компас</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="card('neword')">+ ЗАКАЗ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/kompas-alikhan.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/kompas-alikhan.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f't{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/kompas-alikhan.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
