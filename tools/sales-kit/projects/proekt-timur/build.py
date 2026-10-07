# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect x="14" y="14" width="72" height="72" fill="none" stroke="{c}" stroke-width="6"/><path d="M50 6v88M6 50h88" stroke="#e0533a" stroke-width="5" stroke-dasharray="14 6 3 6"/><circle cx="50" cy="50" r="9" fill="#5fb3d9"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="проект, раздел, клиент, файл"')
s=re.sub(r'<title>.*?</title>','<title>ОСЬ · проектная компания под ключ: проекты, разделы, экспертиза, стройка, слаботочка · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%230f2a44'/><rect x='20' y='20' width='60' height='60' fill='none' stroke='%23e8f1f7' stroke-width='7'/><path d='M50 10v80M10 50h80' stroke='%23e0533a' stroke-width='6'/><circle cx='50' cy='50' r='9' fill='%235fb3d9'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=PT+Mono&family=Onest:wght@400;500;600;700;800&display=swap')
s=s.replace("'Golos Text'","'Onest'").replace("'JetBrains Mono'","'PT Mono'")
root=''':root{
 --rail:#0f2a44;--rail2:#0b2036;--rail-h:#173a5c;--rail-a:#5fb3d9;
 --brand:#1f5f8b;--brand2:#5fb3d9;--brandl:#e6f1f8;--steel:#8b96a3;
 --bg:#f2f5f8;--card:#fff;--card2:#f6f9fb;--card3:#e3eaf0;
 --text:#14212e;--muted:#536273;--muted2:#8796a5;--line:#dce4eb;--line2:#c3cfd9;
 --acc:#2a7f9e;--acc2:#a8d0e0;--accl:#e4f2f7;
 --ok:#2e7a4f;--ok-l:#e3f2e9;--bad:#c8402a;--bad-l:#fbe8e4;--warn:#b0632a;--warn-l:#fcefe2;
 --info:#1f5f8b;--info-l:#e6f1f8;--violet:#5a6aa0;--violet-l:#eceff8;
 --r:2px;--sh:none;--sh2:0 14px 40px rgba(15,42,68,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0c1724;--card:#12202f;--card2:#172838;--card3:#213448;--brand:#5fb3d9;
 --text:#e6eef5;--muted:#9fb0c0;--muted2:#6d7f90;--line:#213448;--line2:#2f465d;
 --brandl:#12304a;--accl:#12303a;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2010;--info-l:#12304a;--violet-l:#1c2236;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#5fb3d9}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#e8f1f7')}
   <div><b class="gname">ОСЬ</b><small class="gsub">ПРОЕКТИРОВАНИЕ ПОД КЛЮЧ · СТРОИТЕЛЬСТВО · МОНТАЖ СЛАБОТОЧНЫХ СИСТЕМ</small></div>
  </div>
  <h1>Проекты, разделы, экспертиза и стройка — в одной системе.<br>Вместо Битрикса и пяти Excel-файлов, которые не связаны.<br><em>Каждый по должности видит своё, директор — всё сразу.</em></h1>
  <span class="gtag">макет по встрече 7 октября · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали: компания ведёт клиента от а до я — участок, разрешительные документы, проект, экспертиза, строительство, монтаж инженерных и слаботочных сетей, узаконение. 40 человек на проектировании, 40 на стройке, около 50 на монтаже. На один проект 20–30 документов, у каждого свой исполнитель. Проекты в одном Excel, бухгалтерия в другом, общение — в WhatsApp. Битрикс не прижился.</p>
  <p style="color:#5fb3d9">Здесь: воронка клиентов, канбан проектов по вашим стадиям, разделы с исполнителями, ИРД и экспертиза, загрузка проектировщиков, отдельные воронки стройки и слаботочки, переписка, календарь, бухгалтерия и аналитика.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">20</b></div>
   <div><small>Ролей</small><b>7</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>2 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Портал в браузере — с компьютера и телефона. Каждый входит под своим логином и видит свою часть. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Название, объекты, клиенты, сотрудники и суммы придуманы для примера. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Ось">{LOGO.format(w=30,c="#e8f1f7")}<b>ОСЬ</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">ДП</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Ось</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="card('newpr')">+ ПРОЕКТ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/proekt-timur.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/proekt-timur.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'p{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/proekt-timur.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
