# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 88C24 70 14 52 14 36a18 18 0 0 1 36-4 18 18 0 0 1 36 4c0 16-10 34-36 52z" fill="none" stroke="{c}" stroke-width="7" stroke-linejoin="round"/><path d="M50 34v34M33 51h34" stroke="#d08a52" stroke-width="8" stroke-linecap="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="пациент, телефон, курс, препарат"')
s=re.sub(r'<title>.*?</title>','<title>ДАРУ · клиника комплексного лечения: пациенты, курсы, звонки, склад, касса · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%231f4d3f'/><path d='M50 84C26 68 18 52 18 38a16 16 0 0 1 32-4 16 16 0 0 1 32 4c0 14-8 30-32 46z' fill='none' stroke='%23f4efe6' stroke-width='7'/><path d='M50 36v30M35 51h30' stroke='%23d08a52' stroke-width='8' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=JetBrains+Mono:wght@400;500;600&family=Literata:opsz,wght@7..72,500;7..72,600;7..72,700&family=Commissioner:wght@400;500;600;700&display=swap')
s=s.replace("'Golos Text'","'Commissioner'")
root=''':root{
 --rail:#1f4d3f;--rail2:#183e33;--rail-h:#2a5f4f;--rail-a:#d08a52;
 --brand:#1f6b55;--brand2:#d08a52;--brandl:#e7f1ec;--steel:#8b96a3;
 --bg:#f4f1ea;--card:#fffdf9;--card2:#f8f5ef;--card3:#ece6db;
 --text:#1d2a25;--muted:#5d6b64;--muted2:#8d998f;--line:#e4ded2;--line2:#d0c8b9;
 --acc:#2f6f8f;--acc2:#a9c7d6;--accl:#e6f0f5;
 --ok:#2e7a4f;--ok-l:#e3f2e9;--bad:#b9412f;--bad-l:#f9e6e2;--warn:#b26a1f;--warn-l:#fbefdf;
 --info:#2f6f8f;--info-l:#e6f0f5;--violet:#6a5a8a;--violet-l:#efecf5;
 --r:12px;--sh:0 1px 2px rgba(29,42,37,.05);--sh2:0 14px 40px rgba(24,62,51,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#111a17;--card:#17221e;--card2:#1c2924;--card3:#26352f;--brand:#5fbf9a;
 --text:#e8efeb;--muted:#a3b2aa;--muted2:#71827a;--line:#26352f;--line2:#344840;
 --brandl:#1a3a2f;--accl:#14262e;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#14262e;--violet-l:#201d2c;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#e3a877}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#f4efe6')}
   <div><b class="gname">ДАРУ</b><small class="gsub">КЛИНИКА КОМПЛЕКСНОГО ЛЕЧЕНИЯ · ДНЕВНОЙ СТАЦИОНАР</small></div>
  </div>
  <h1>Пациент, курс, звонки, склад и касса — в одном окне.<br>Курс собирается индивидуально, а не пакетом под копирку.<br><em>Без amoCRM, МоегоСклада, Excel и таблиц.</em></h1>
  <span class="gtag">макет по встрече 8 октября и вашей схеме бизнеса · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали: пациент приходит с рекламы, колл-центр записывает, врач подбирает лечение — 10 дней капельниц по методике и 5 дней очищения, плюс физиолечение, хиджама, иглотерапия, фитотерапия. Каждый раз набор свой, а программы для стоматологии умеют только одинаковые пакеты. Сейчас amoCRM, МойСклад с лекарствами, касса в Excel, менеджеры работают удалённо.</p>
  <p style="color:#e3a877">Здесь: путь пациента, оценка звонков ИИ, дисциплина менеджеров, конструктор курса из прайса, лечебный лист на 15 дней, расписание кабинетов, склад со списанием по процедурам, касса, отчёты, задачи отделов, HR, роботы и кабинет пациента.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">24</b></div>
   <div><small>Ролей</small><b>10</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Портал + сайт</small><b>3,3 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Каждый входит под своим логином и видит своё — пароли не передаются. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Название, пациенты, сотрудники, препараты и суммы придуманы для примера. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Дару">{LOGO.format(w=30,c="#f4efe6")}<b>ДАРУ</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">КУ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Дару</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="card('newlead')">+ ЗАЯВКА</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/daru-kunduzay.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/daru-kunduzay.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'd{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/daru-kunduzay.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
