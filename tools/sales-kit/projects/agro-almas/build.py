# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 90V30" stroke="{c}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M50 38c-14-2-22-12-22-24 14 2 22 12 22 24zm0 0c14-2 22-12 22-24-14 2-22 12-22 24zM50 58c-14-2-22-12-22-24 14 2 22 12 22 24zm0 0c14-2 22-12 22-24-14 2-22 12-22 24z" fill="#e0a530"/><path d="M14 90h72" stroke="{c}" stroke-width="7" stroke-linecap="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="поле П-07, машина 512 ABC, склад"')
s=re.sub(r'<title>.*?</title>','<title>ДАЛА · цифровое хозяйство: поля, склады, ГСМ, техника, скот · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%231f3d2b'/><path d='M50 84V34' stroke='%23fff' stroke-width='7'/><path d='M50 42c-12-2-19-10-19-21 12 2 19 10 19 21zm0 0c12-2 19-10 19-21-12 2-19 10-19 21zM50 60c-12-2-19-10-19-21 12 2 19 10 19 21zm0 0c12-2 19-10 19-21-12 2-19 10-19 21z' fill='%23e0a530'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#1f3d2b;--rail2:#16301f;--rail-h:#2a5039;--rail-a:#e0a530;
 --brand:#1f3d2b;--brand2:#e0a530;--brandl:#edf3e8;--mapbg:#efe9d8;--steel:#8b96a3;
 --bg:#f5f4ee;--card:#fff;--card2:#f8f7f1;--card3:#e9e7dc;
 --text:#1d241c;--muted:#5a6355;--muted2:#8b9285;--line:#e3e1d5;--line2:#cfccbc;
 --acc:#1f3d2b;--acc2:#e0a530;--accl:#edf3e8;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(29,36,28,.06);--sh2:0 14px 40px rgba(31,61,43,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#11160f;--card:#181f16;--card2:#1e271b;--card3:#2a3526;--mapbg:#2a2a20;
 --text:#ecefe6;--muted:#aab3a2;--muted2:#78826f;--line:#2a3526;--line2:#3a4834;
 --accl:#22331f;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f0c46a}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">ДАЛА</b><small class="gsub">ЦИФРОВОЕ ХОЗЯЙСТВО · РАСТЕНИЕВОДСТВО · ЖИВОТНОВОДСТВО · СКЛАДЫ · ГСМ · ТЕХНИКА</small></div>
  </div>
  <h1>Всё хозяйство — онлайн, а не в конце месяца на бумаге.<br>Сколько зерна в каждом ангаре, сколько топлива в ёмкостях, какая запчасть на какой машине.<br><em>И где именно расходится, когда после уборки недостача.</em></h1>
  <span class="gtag">демо по встрече 12 октября · всё кликается</span>
  <p style="margin-top:15px">Ваши слова: «это всё на бумаге — от отчётов до начисления зарплат», «я вижу это, либо мне скидывают в WhatsApp, но не в онлайн-режиме», «столкнулись после уборки с недостачей — нет должного контроля за дизелем, за запчастями, за складом».</p>
  <p style="color:#f0c46a">20 000 га полей и история каждой клетки · склады зерна и сеновал · рейсы на элеватор · АЗС · запчасти и МТП · убойный цех → бухгалтерия → магазины · выдача населению · отчёты 20 ответственных · зарплата · 1С.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">19</b></div>
   <div><small>Ролей</small><b>9</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>2,5 млн + 1С</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Каждый — под своим логином и видит свой участок. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Поля, склады, техника, люди и цифры придуманы для примера. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Дала">{LOGO.format(w=30,c="#ffffff")}<b>ДАЛА</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">АЛ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Дала</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('tablet')">ПЛАНШЕТ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/agro-almas.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/agro-almas.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'a{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/agro-almas.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
