import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: силуэт каблука в рамке, как на коробке обуви
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect x="8" y="22" width="84" height="64" rx="4" fill="none" stroke="{c}" stroke-width="7"/><path d="M8 42h84M38 22v20M62 22v20" stroke="{c}" stroke-width="7"/><rect x="40" y="56" width="20" height="14" fill="#e2a52b"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Тауар · опт и розница одежды и носков: касса, упаковки, надбавки, склад · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%2324345a'/><rect x='14' y='28' width='72' height='54' fill='none' stroke='%23fff' stroke-width='7'/><path d='M14 46h72' stroke='%23fff' stroke-width='7'/><rect x='40' y='58' width='20' height='12' fill='%23e2a52b'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=Unbounded:wght@500;600;700&family=Onest:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap')
root=''':root{
 --rail:#24345a;--rail2:#1b2848;--rail-h:#2f4270;--rail-a:#e2a52b;
 --brand:#24345a;--brand2:#e2a52b;--brandl:#e7ebf4;--steel:#8b96a3;
 --bg:#f2f1ec;--card:#ffffff;--card2:#f7f6f2;--card3:#e9e7df;
 --text:#1b2236;--muted:#5d6475;--muted2:#8d93a0;--line:#e2e0d8;--line2:#cfccc1;
 --acc:#e2a52b;--acc2:#c98a12;--accl:#fbf0d6;
 --ok:#2f7d4f;--ok-l:#e3f1e8;--bad:#c2412d;--bad-l:#f9e5e1;--warn:#c98a12;--warn-l:#fbf0d6;
 --info:#2f5f9e;--info-l:#e6eef8;--violet:#6a5a9a;--violet-l:#efecf6;
 --r:8px;--sh:none;--sh2:0 16px 40px rgba(27,34,54,.2);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#11151f;--card:#181d2a;--card2:#1d2333;--card3:#262d40;--brand:#9fb2e0;
 --text:#e8ebf2;--muted:#a0a7b8;--muted2:#6d7487;--line:#262d40;--line2:#343c54;
 --brandl:#1e2840;--accl:#2e2614;--ok-l:#15261c;--bad-l:#2e1915;--warn-l:#2e2614;--info-l:#18243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=56,c='#ffffff')}<div><b class="gname">ТАУАР</b><small class="gsub">ОПТ И РОЗНИЦА · ОДЕЖДА И НОСКИ · АКТОБЕ</small></div></div>
  <h1>Всё, как в Umag. <em>Плюс поштучно из упаковки, надбавка к товару, фото и проценты продавцам.</em></h1>
  <span class="gtag">макет по встрече 3 ноября · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали: работаете в Umag, в основном оптом. Товар в упаковках, а продаётся и поштучно; надбавку за неполную упаковку приходится пробивать «универсальным продуктом» — и не видно, сколько прибыли принёс каждый товар. Больше 10 000 позиций, заказы идут через WhatsApp.</p>
  <p style="color:#f3c66b">Здесь — касса с продажей упаковкой и поштучно, автоматическое вскрытие упаковки, надбавка, привязанная к товару, с отчётом, фото у каждого товара, оптовые заказы с уровнями цен и долгами, WhatsApp и Kaspi, проценты продавцам. Переезд с Umag — наш.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">20</b></div><div><small>Ролей</small><b>6</b></div><div><small>Срок</small><b>4–6 недель</b></div><div><small>Стоимость</small><b>от 2 млн</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо-макет на вымышленных данных</b>Товары, клиенты, цены и суммы придуманы для примера. Кнопка ▶ — сценарий показа.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="mast">
  <div class="brandm">{MARK.format(w=30,c='currentColor')}<b>ТАУАР</b></div>
  <nav id="rail"></nav>
  <div class="top-r">
   <div class="srch"><i>⌕</i><input placeholder="код, товар, клиент" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
   <button class="ib" id="tourBtn" onclick="tour()" title="Сценарий показа">▶</button>
   <button class="ib" id="themeBtn" onclick="toggleTheme()" title="Тема">◐</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">НС</div>
  </div>
 </header>
 <nav id="sub"></nav>
 <main class="main"><h1 id="ttl" class="vh">Тауар</h1><div class="content" id="content"></div></main>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/tauar-nursultan.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
s=s.replace("'Golos Text'","'Onest'")
rep('</style>',css+'\n</style>')
open(ROOT+'/app/tauar-nursultan.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f't{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/tauar-nursultan.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
