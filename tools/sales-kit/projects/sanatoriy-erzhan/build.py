# -*- coding: utf-8 -*-
import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 12C36 34 26 48 26 62a24 24 0 0048 0c0-14-10-28-24-50z" fill="{c}"/><path d="M38 64c4 8 14 10 20 4" stroke="#c9a24a" stroke-width="6" fill="none" stroke-linecap="round"/></svg>'
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="гость, номер, карточка"')
s=re.sub(r'<title>.*?</title>','<title>Санаторий · шахматка, медблок, ресторан и склады · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230f4a52'/><path d='M50 18C38 36 30 48 30 60a20 20 0 0040 0c0-12-8-24-20-42z' fill='%23fff'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#0f4a52;--rail2:#0a3439;--rail-h:#1a5c65;--rail-a:#e0bf6e;
 --brand:#0f4a52;--brand2:#c08a2a;--brandl:#e8f2f2;--steel:#8b96a3;
 --bg:#f4f4f0;--card:#fff;--card2:#f8fafb;--card3:#e3ebf0;
 --text:#12293a;--muted:#55697a;--muted2:#8a9aa8;--line:#e0e8ee;--line2:#c9d6df;
 --acc:#0f4a52;--acc2:#c08a2a;--accl:#e8f2f2;
 --ok:#1f8a5b;--ok-l:#e2f4ea;--bad:#d2412c;--bad-l:#fce8e4;--warn:#c27a0e;--warn-l:#fdf1dc;
 --info:#0a6bb0;--info-l:#e4f1fb;--violet:#5d5fa8;--violet-l:#ecedf8;
 --r:14px;--sh:0 1px 3px rgba(18,41,58,.06);--sh2:0 14px 40px rgba(15,74,82,.24);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0b1820;--card:#12222d;--card2:#182b38;--card3:#223a4a;
 --text:#eaf2f7;--muted:#a6bccb;--muted2:#748c9c;--line:#223a4a;--line2:#2f4b5e;
 --accl:#173445;--ok-l:#13261a;--bad-l:#2e1613;--warn-l:#2e2210;--info-l:#13283a;--violet-l:#1e1e30;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#e0bf6e}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58,c='#ffffff')}
   <div><b class="gname">САНАТОРИЙ</b><small class="gsub">ЕДИНАЯ СИСТЕМА · НОМЕРА · МЕДБЛОК · ПИТАНИЕ · СКЛАДЫ</small></div>
  </div>
  <h1>Шахматка номеров и медблок в одной системе.<br><em>Врач нажимает «автораспределение» — пациент подтверждает процедуру с телефона.</em></h1>
  <span class="gtag">демо по встрече с Ержаном · всё нажимается</span>
  <p style="margin-top:15px">Ресепшн заселяет гостя — главный врач сразу видит пациента, ресторан знает, сколько готовить. Программы путёвок раскладываются по дням, часам и кабинетам, медсёстры работают с планшетов. Платные процедуры — в фолио. Продукты списываются по калькуляции, масло и расходники — по процедурам. Хаускипинг отмечает уборку номеров.</p>
  <p style="color:#e0bf6e">В облаке — отключение света в санатории не останавливает работу.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">18</b></div>
   <div><small>Ролей</small><b>8</b></div>
   <div><small>Срок</small><b>4–6 недель</b></div>
   <div><small>Пакет</small><b>2,5 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход</h2>
   <p>Каждый видит только своё: медсестра — свои кабинеты, пациент — своё расписание, повар — сколько готовить. Для показа выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо на придуманных данных</b>
    Гости, сотрудники, процедуры и суммы придуманы для примера. Кнопка ▶ сверху — показ по шагам.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>',f'<div class="rail-logo" title="Санаторий">{LOGO.format(w=30,c="#ffffff")}<b>САН</b></div>',s,count=1,flags=re.S)
rep('<div class="rail-bot"><div class="me" id="me">РК</div></div>','<div class="rail-bot"><div class="me" id="me">ЕР</div></div>')
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">САНАТОРИЙ</h1>')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="go('chess')">+ БРОНЬ</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/sanatoriy-erzhan.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/sanatoriy-erzhan.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f's{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/sanatoriy-erzhan.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
