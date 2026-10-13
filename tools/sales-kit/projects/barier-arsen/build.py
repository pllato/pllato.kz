# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8 86 22v26c0 22-15 37-36 44C29 85 14 70 14 48V22z" fill="none" stroke="{c}" stroke-width="8" stroke-linejoin="round"/><path d="M34 50l11 11 22-24" fill="none" stroke="#ff7a3d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="имя, телефон, адрес"')
s=re.sub(r'<title>.*?</title>','<title>БАРЬЕР · служба дезинсекции: заявки, выезды, дезинфекторы, оплаты · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23103b3a'/><path d='M34 50l11 11 22-24' fill='none' stroke='%23ff7a3d' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#103b3a;--rail2:#0b2b2a;--rail-h:#174c4a;--rail-a:#ff7a3d;
 --brand:#103b3a;--brand2:#ff7a3d;--brandl:#e6f1ef;--steel:#8b96a3;
 --bg:#f3f6f5;--card:#fff;--card2:#f7faf9;--card3:#e2ebe9;
 --text:#132422;--muted:#566a67;--muted2:#879896;--line:#dfe8e6;--line2:#c6d5d2;
 --acc:#103b3a;--acc2:#ff7a3d;--accl:#e6f1ef;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(19,36,34,.06);--sh2:0 14px 40px rgba(16,59,58,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0c1615;--card:#13211f;--card2:#192a28;--card3:#233836;
 --text:#e7f1ef;--muted:#a3b8b5;--muted2:#718784;--line:#233836;--line2:#33504d;
 --accl:#1a3533;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#ffb08a}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">БАРЬЕР</b><small class="gsub">СЛУЖБА ДЕЗИНСЕКЦИИ И ДЕРАТИЗАЦИИ · АЛМАТЫ · ЗАЯВКИ · ВЫЕЗДЫ · ОПЛАТЫ</small></div>
  </div>
  <h1>Заявка пришла — через минуту она у дезинфектора в телефоне.<br>Адрес, время, вредитель, фото и оплата — без блокнота и WhatsApp.<br><em>Вечером не надо сводить Excel: отчёт уже готов.</em></h1>
  <span class="gtag">демо по встрече 14 октября · всё кликается</span>
  <p style="margin-top:15px">Сейчас: заявка — в блокнот, потом через WhatsApp дезинфектору, он отчитывается в WhatsApp, в блокноте отмечаете, вечером всё в Excel, в конце месяца — отчётность.</p>
  <p style="color:#ffb08a">Заявки из Google, 2ГИС, OLX, Instagram и WhatsApp · распределение по дезинфекторам · приложение дезинфектора с фото и видео · оплаты и наличные · склад препаратов · зарплата · гарантийные повторы · реклама и отчёты.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">14</b></div>
   <div><small>Ролей</small><b>4</b></div>
   <div><small>Срок</small><b>~ месяц</b></div>
   <div><small>Стоимость</small><b>1,5 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Каждый — под своим логином. Дезинфектор видит только свои выезды в телефоне. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Название, клиенты, адреса, препараты и суммы придуманы для примера. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Барьер">{LOGO.format(w=30,c="#ffffff")}<b>БАРЬЕР</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">АЛ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Барьер</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="card('newjob')">+ ЗАЯВКА</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/barier-arsen.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/barier-arsen.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'd{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/barier-arsen.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
