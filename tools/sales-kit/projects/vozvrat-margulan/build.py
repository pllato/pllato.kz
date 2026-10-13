# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 12a38 38 0 1 0 38 38" fill="none" stroke="{c}" stroke-width="9" stroke-linecap="round"/><path d="M70 10l20 4-6 19" fill="none" stroke="#2fb67c" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 52l10 10 20-22" fill="none" stroke="#2fb67c" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="ФИО, ИИН, телефон, номер займа"')
s=re.sub(r'<title>.*?</title>','<title>ВОЗВРАТ · CRM взыскания: должники, портфели, звонки, платежи · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%2317324d'/><path d='M34 52l11 11 22-24' fill='none' stroke='%232fb67c' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#17324d;--rail2:#10263b;--rail-h:#21425f;--rail-a:#2fb67c;
 --brand:#17324d;--brand2:#2fb67c;--brandl:#e8f0f6;--steel:#8b96a3;
 --bg:#f2f5f8;--card:#fff;--card2:#f7f9fb;--card3:#e4eaf0;
 --text:#142233;--muted:#55657a;--muted2:#8796a8;--line:#e0e7ee;--line2:#c9d4df;
 --acc:#17324d;--acc2:#2fb67c;--accl:#e8f0f6;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(20,34,51,.06);--sh2:0 14px 40px rgba(23,50,77,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0d1520;--card:#142030;--card2:#1a283a;--card3:#243548;
 --text:#e8eef5;--muted:#a3b2c3;--muted2:#71839a;--line:#243548;--line2:#33475e;
 --accl:#1c3048;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#7fe0b0}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">ВОЗВРАТ</b><small class="gsub">CRM КОЛЛЕКТОРСКОГО АГЕНТСТВА · ПОРТФЕЛИ · ДОЛЖНИКИ · ЗВОНКИ · ПЛАТЕЖИ · EXCEL</small></div>
  </div>
  <h1>Все 10 000 должников — в одной системе, а не в Excel.<br>Остаток долга, комментарий, звонок с записью и обещание — в карточке.<br><em>Сколько зашло сегодня против плана — с телефона.</em></h1>
  <span class="gtag">демо по встрече 13 октября · всё кликается</span>
  <p style="margin-top:15px">Ваши слова: «видеть всех должников и чтобы комментарий по ним можно было забивать — по суммам, по остаткам задолженности», «по Excel тяжеловато и нам, и аналитикам», «всё должно в Excel выгружаться — мы его зашиваем в Нацбанк».</p>
  <p style="color:#7fe0b0">Портфели, выкупленные у МФО · должники и карточка · воронка взыскания · обещания оплаты · IP-телефония с записью и WhatsApp · разноска платежей · план коллекторов · Excel и Нацбанк · загрузка нового портфеля.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">15</b></div>
   <div><small>Ролей</small><b>6</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>1,5 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Каждый — под своим логином: коллектор видит своих должников, руководитель — всё. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Должники, ИИН, телефоны, портфели и суммы придуманы для примера. Внешний вид подстроим по видео CRM, которая вам нравится. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Возврат">{LOGO.format(w=30,c="#ffffff")}<b>ВОЗВРАТ</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">АЛ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Возврат</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('debtors')">ДОЛЖНИКИ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/vozvrat-margulan.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/vozvrat-margulan.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'm{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/vozvrat-margulan.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
