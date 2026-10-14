# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 10 88 30v8H12v-8z" fill="none" stroke="{c}" stroke-width="7" stroke-linejoin="round"/><path d="M22 42v34M40 42v34M60 42v34M78 42v34" stroke="{c}" stroke-width="7" stroke-linecap="round"/><path d="M10 86h80" stroke="#e2b04a" stroke-width="8" stroke-linecap="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="имя, телефон клиента"')
s=re.sub(r'<title>.*?</title>','<title>ОПОРА · выход на пенсию: заявки, воронки, расчёты, сопровождение · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%234a1f38'/><path d='M26 44v28M42 44v28M58 44v28M74 44v28' stroke='%23fff' stroke-width='8' stroke-linecap='round'/><path d='M18 80h64' stroke='%23e2b04a' stroke-width='8' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#4a1f38;--rail2:#3a1629;--rail-h:#5a2845;--rail-a:#e2b04a;
 --brand:#4a1f38;--brand2:#e2b04a;--brandl:#f6edf1;--steel:#8b96a3;
 --bg:#f7f4f2;--card:#fff;--card2:#faf7f5;--card3:#ece4e0;
 --text:#2a1a22;--muted:#6a5860;--muted2:#9a8890;--line:#ece3df;--line2:#d9ccc6;
 --acc:#4a1f38;--acc2:#e2b04a;--accl:#f6edf1;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(42,26,34,.06);--sh2:0 14px 40px rgba(74,31,56,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#160d12;--card:#21151b;--card2:#2a1b22;--card3:#36252d;
 --text:#f3e9ed;--muted:#c0aab4;--muted2:#8d7883;--line:#36252d;--line2:#4a3440;
 --accl:#3a2230;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#f0cd7c}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">ОПОРА</b><small class="gsub">ПОМОЩЬ С ВЫХОДОМ НА ПЕНСИЮ · ЗАЯВКИ · РАСЧЁТЫ · СОПРОВОЖДЕНИЕ</small></div>
  </div>
  <h1>Ваша собственная программа вместо Битрикса.<br>Все заявки, клиенты, расчёты и деньги — в одном месте.<br><em>Собственник видит главные цифры с телефона.</em></h1>
  <span class="gtag">демо по встрече с Татьяной · всё нажимается</span>
  <p style="margin-top:15px">Что вы получаете: 100–150 заявок в день из Instagram, TikTok, сайтов и WhatsApp — в одном списке. Каждая услуга — своя воронка, этапы меняете сами. Переписка и документы клиента — в его карточке, а не на Google Диске. Расчёты, сопровождение, сдельная оплата и статистики должностей считаются сами.</p>
  <p style="color:#f0cd7c">Платите один раз. Потом — около 20–30 тысяч тенге в месяц вместо ~300 тысяч.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">15</b></div>
   <div><small>Должностей</small><b>5</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>2 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый сотрудник входит под своим логином и видит только свою работу. Для показа выберите должность:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Название, клиенты и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Опора">{LOGO.format(w=30,c="#ffffff")}<b>ОПОРА</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">АЛ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Опора</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('leads')">ЗАЯВКИ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/opora-tatiana.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/opora-tatiana.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'p{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/opora-tatiana.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
