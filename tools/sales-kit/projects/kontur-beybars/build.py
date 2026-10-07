# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M14 86V30l36-18 36 18v56" fill="none" stroke="{c}" stroke-width="7" stroke-linejoin="round"/><path d="M54 30L40 56h14l-6 24 18-32H52l8-18z" fill="#f2b705"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="объект, задача, журнал, заявка"')
s=re.sub(r'<title>.*?</title>','<title>КОНТУР · стройплощадки генподрядчика: объекты, задачи, журналы, ИИ · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%231d2329'/><path d='M18 84V34l32-16 32 16v50' fill='none' stroke='%23e8edf2' stroke-width='8'/><path d='M54 32L40 58h14l-6 22 18-30H52l8-18z' fill='%23f2b705'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap')
s=s.replace("'Golos Text'","'IBM Plex Sans'").replace("'JetBrains Mono'","'IBM Plex Mono'")
root=''':root{
 --rail:#1d2329;--rail2:#161b20;--rail-h:#2b333b;--rail-a:#f2b705;
 --brand:#9a6c00;--brand2:#f2b705;--brandl:#fdf3d6;--steel:#8b96a3;
 --bg:#eceff1;--card:#fff;--card2:#f5f7f8;--card3:#e2e6e9;
 --text:#1a1f24;--muted:#56616b;--muted2:#8a949d;--line:#dde2e6;--line2:#c4ccd2;
 --acc:#2c5d7c;--acc2:#a8c2d4;--accl:#e6eff5;
 --ok:#2e7a4f;--ok-l:#e3f2e9;--bad:#c0392b;--bad-l:#fbe7e4;--warn:#a86a00;--warn-l:#fdf1d8;
 --info:#2c5d7c;--info-l:#e6eff5;--violet:#5a5a8a;--violet-l:#eeeef6;
 --r:3px;--sh:none;--sh2:0 14px 40px rgba(22,27,32,.24);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#111519;--card:#181d22;--card2:#1e242a;--card3:#2a3138;--brand:#f2b705;
 --text:#e9edf0;--muted:#a3adb6;--muted2:#6f7a84;--line:#2a3138;--line2:#3a434c;
 --brandl:#2e2608;--accl:#14232d;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2208;--info-l:#14232d;--violet-l:#1e1e2c;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f2b705}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#e8edf2')}
   <div><b class="gname">КОНТУР</b><small class="gsub">ГЕНПОДРЯД ПО ГОСЗАКАЗУ · ПОДСТАНЦИИ · ЗДАНИЯ · СЕТИ</small></div>
  </div>
  <h1>Все стройплощадки — в одном приложении.<br>Объём из проекта, задачи, журналы и люди — без бумаги.<br><em>ИИ разбирает журналы и фото, отвечает на вопросы и предупреждает заранее.</em></h1>
  <span class="gtag">макет по встрече 7 октября · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали: три объекта строятся параллельно — подстанция при парогазовой установке в Туркестанской области (около 80 человек), объект на Алаколе (около 15) и третий. Постоянный состав — руководители; подсобники, монтажники и сварщики меняются под объём и сроки. Журналы ведутся ручкой на бумаге, задачи из проекта — в голове и в чатах. На стройке много бардака.</p>
  <p style="color:#f2b705">Здесь: объекты в проектном канбане, объём работ из проекта → задачи с приоритетом, дневной отчёт прораба и журналы с печатью, фото с разбором ИИ, ИИ-ассистент, прогноз по материалам, людям и технике, снабжение, деньги и акты.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">20</b></div>
   <div><small>Ролей</small><b>6</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>2,5 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Работает в браузере — с телефона и компьютера. Каждый входит под своим логином и видит своё. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Название, объекты, люди, поставщики и суммы придуманы для примера. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Контур">{LOGO.format(w=32,c="#e8edf2")}</div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">ОС</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Контур</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="card('newtask')">+ ЗАДАЧА</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/kontur-beybars.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/kontur-beybars.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'k{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/kontur-beybars.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
