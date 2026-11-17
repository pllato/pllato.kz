import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: штрихкод в рамке и галочка «совпало»
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="6" fill="#1f2428"/><circle cx="50" cy="50" r="26" fill="none" stroke="#f08a1c" stroke-width="8"/><path d="M50 14v10M50 76v10M14 50h10M76 50h10M25 25l7 7M68 68l7 7M75 25l-7 7M32 68l-7 7" stroke="#f08a1c" stroke-width="8" stroke-linecap="square"/><circle cx="50" cy="50" r="8" fill="#c7cdd2"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Степь Индастриал · поставки промышленного оборудования: тендеры, заводы, спецификации, отгрузки · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='8' fill='%231f2428'/><circle cx='50' cy='50' r='26' fill='none' stroke='%23f08a1c' stroke-width='10'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#1f2428;--rail2:#16191c;--rail-h:#2b3237;--rail-a:#f08a1c;
 --brand:#2f3a42;--brand2:#f08a1c;--brandl:#e8ebee;--steel:#7c868e;
 --bg:#eef0f1;--card:#ffffff;--card2:#f6f7f8;--card3:#e4e7ea;
 --text:#1a1f23;--muted:#56616a;--muted2:#8a949c;--line:#dde1e5;--line2:#c6ccd2;
 --acc:#d0700c;--acc2:#f08a1c;--accl:#fdecd9;
 --ok:#2a7a46;--ok-l:#e1f1e6;--bad:#b8322b;--bad-l:#f8e0dd;--warn:#96610b;--warn-l:#f8edd5;
 --info:#2c5a87;--info-l:#e2ebf5;--violet:#5d6670;--violet-l:#eceef1;
 --r:3px;--sh:none;--sh2:0 16px 40px rgba(22,25,28,.28);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#121518;--card:#1a1f23;--card2:#20262b;--card3:#2a3137;--brand:#c7cdd2;
 --text:#e9ecee;--muted:#a7b0b7;--muted2:#707a82;--line:#2a3036;--line2:#38414a;
 --brandl:#232a30;--accl:#3a2a17;--ok-l:#15281c;--bad-l:#33191a;--warn-l:#31270f;--info-l:#18263a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">СТЕПЬ ИНДАСТРИАЛ</b><small class="gsub">ОБОРУДОВАНИЕ ДЛЯ ТЯЖЁЛОЙ ПРОМЫШЛЕННОСТИ · СНГ · ПОД ЗАКАЗ</small></div></div>
  <span class="gtag">демо для Айгуль и директора · по встрече 17.11</span>
  <h1>От тендера до последней отгрузки — <em>в одном окне, даже с другого континента.</em></h1>
  <p>Тендеры с площадок по вашему профилю, запросы цены на заводы Китая и России, чертежи и ГОСТ в позициях спецификации, КП с наценкой и валютой, договоры, частичные отгрузки и дебиторка. WhatsApp, Telegram, MAX, WeChat и почта — в карточке сделки.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">20</b></div><div><small>Ролей</small><b>5</b></div><div><small>Абонплата</small><b>0 ₸</b></div><div><small>Пакет</small><b>2,8 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только то, что разрешено.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, заказчики, заводы, суммы и люди придуманы. Ваши этапы, шаблоны и площадки добавим после согласования.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <aside class="side">
  <div class="brandm">{MARK.format(w=34)}<div><b>Степь Индастриал</b><small>ПРОМОБОРУДОВАНИЕ · СНГ</small></div></div>
  <nav id="rail"></nav>
  <div id="shint"></div>
 </aside>
 <div class="wrapr">
  <header class="topb"><div id="sub"></div>
   <div class="top-r">
    <div class="srch"><i>⌕</i><input placeholder="сделка, заказчик, позиция" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
    <button class="ib" onclick="tour()" title="Сценарий">▶</button>
    <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
    <select class="rsel" id="rsel"></select>
    <div class="me" id="me">ДР</div>
   </div>
  </header>
  <main class="main"><h1 id="ttl" class="vh">Степь Индастриал</h1><div class="content" id="content"></div></main>
 </div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('family=JetBrains+Mono','family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=JetBrains+Mono')
rep('<script src="/app/uss.js"></script>','<script src="/app/promoborud-aigul.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/promoborud-aigul.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'p{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/promoborud-aigul.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
