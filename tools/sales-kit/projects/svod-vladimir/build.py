# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M26 14h34l16 16v56H26z" fill="none" stroke="{c}" stroke-width="7" stroke-linejoin="round"/><path d="M38 50h26M38 62h26M38 74h16" stroke="#d08442" stroke-width="7" stroke-linecap="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="номер, название, контрагент, текст документа"')
s=re.sub(r'<title>.*?</title>','<title>СВОД · внутренний документооборот и архив · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23173a3a'/><path d='M36 50h28M36 64h28M36 78h18' stroke='%23d08442' stroke-width='9' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#173a3a;--rail2:#102b2b;--rail-h:#214c4c;--rail-a:#d08442;
 --brand:#173a3a;--brand2:#d08442;--brandl:#ebf2f1;--steel:#8b96a3;
 --bg:#f3f4f2;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#173a3a;--acc2:#d08442;--accl:#ebf2f1;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(23,58,58,.24);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#e9a46a}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">СВОД</b><small class="gsub">ВНУТРЕННИЙ ДОКУМЕНТООБОРОТ И АРХИВ · ПРОИЗВОДСТВО КАБЕЛЬНОЙ ПРОДУКЦИИ</small></div>
  </div>
  <h1>Все документы компании — в одном архиве на вашем сервере.<br><em>Согласование, поручения и права доступа — с полным следом: кто, когда, что решил.</em></h1>
  <span class="gtag">демо по встрече с Владимиром · всё нажимается</span>
  <p style="margin-top:15px">Договоры, письма, приказы, протоколы и решения органов управления — в реестре и в папках, с поиском по тексту. Документ проходит маршрут согласования, каждое действие сохраняется. Поручения с отметками об исполнении, продлении и снятии. Права доступа руководитель настраивает сам — мышкой, без программиста. Резервные копии на второй сервер — каждую ночь.</p>
  <p style="color:#e9a46a">Не коробка и не подписка: код и данные принадлежат компании.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">14</b></div>
   <div><small>Ролей</small><b>5</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Стоимость</small><b>1,5 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый сотрудник видит только то, к чему у него есть доступ. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Документы, контрагенты и сотрудники придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="СВОД">{LOGO.format(w=30,c="#ffffff")}<b>СВОД</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">РК</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">СВОД</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('newdoc')">+ ДОКУМЕНТ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/svod-vladimir.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/svod-vladimir.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'v{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/svod-vladimir.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
