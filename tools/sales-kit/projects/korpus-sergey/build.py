# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect x="20" y="12" width="60" height="76" rx="4" fill="none" stroke="{c}" stroke-width="7"/><path d="M50 30c-8 10-12 16-12 24a12 12 0 0024 0c0-8-4-14-12-24z" fill="#d23a2a"/><path d="M66 46v10" stroke="{c}" stroke-width="6" stroke-linecap="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="сделка, контрагент, БИН, телефон, изделие"')
s=re.sub(r'<title>.*?</title>','<title>КОРПУС · CRM, производство и 1С в одном окне · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%232b3036'/><path d='M50 26c-9 11-13 18-13 26a13 13 0 0026 0c0-8-4-15-13-26z' fill='%23d23a2a'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#2b3036;--rail2:#1f2328;--rail-h:#3a4048;--rail-a:#e0483a;
 --brand:#2b3036;--brand2:#d23a2a;--brandl:#f1efee;--steel:#8b96a3;
 --bg:#f2f3f4;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#2b3036;--acc2:#d23a2a;--accl:#f1efee;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(43,48,54,.26);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#ff8a7a}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">КОРПУС</b><small class="gsub">МЕТАЛЛИЧЕСКИЕ КОРПУСНЫЕ ИЗДЕЛИЯ · ПОЖАРНОЕ ОБОРУДОВАНИЕ · ПРОИЗВОДСТВО И ФИЛИАЛЫ</small></div>
  </div>
  <h1>Один источник для всего предприятия: звонки, мессенджеры, сделки, производство и 1С.<br><em>Жёсткие этапы, сроки на каждом шаге и ни одной двойной работы.</em></h1>
  <span class="gtag">демо по встрече с Сергеем Вячеславовичем и Александром · всё нажимается</span>
  <p style="margin-top:15px">Все лиды из звонков, WhatsApp, Telegram, MAX, Instagram и сайта — в одной программе. Сделка не перейдёт на следующий этап, пока не заполнено обязательное. Просрочка — уведомление менеджеру до, руководителю после, и обязательное объяснение. С нужного этапа заявка уходит в производство или закупку и возвращается с ответом. Счета, реализации и остатки — в обмене с 1С, без повторного ввода.</p>
  <p style="color:#ff8a7a">Система ваша: без подписки за каждого из 50–70 пользователей.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">17</b></div>
   <div><small>Ролей</small><b>5</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>С 1С</small><b>3,3 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый сотрудник — под своим логином, в своём филиале и отделе. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Клиенты, сделки, изделия и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="КОРПУС">{LOGO.format(w=30,c="#ffffff")}<b>КОРПУС</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">СВ</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">КОРПУС</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('inbox')">ЧАТЫ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/korpus-sergey.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/korpus-sergey.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f),encoding='utf-8').read() for f in ['k1.js','k2.js','k3.js','k3x.js','k4.js'])
open(ROOT+'/app/korpus-sergey.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
