import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: штрихкод в рамке и галочка «совпало»
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="14" fill="#14253a"/><path d="M50 16c10 16 24 26 24 44a24 24 0 0 1-48 0c0-12 7-20 12-26 1 8 4 13 9 15-2-12 0-22 3-33z" fill="none" stroke="#e2552b" stroke-width="7" stroke-linejoin="round"/><path d="M40 66h20" stroke="#8fb3d9" stroke-width="7" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Жылу-Тех · продажа и сервис газовых котлов и насосов · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='8' fill='%2314253a'/><circle cx='50' cy='50' r='26' fill='none' stroke='%23e2552b' stroke-width='10'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#14253a;--rail2:#0e1b2b;--rail-h:#1f3550;--rail-a:#e2552b;
 --brand:#2f3a42;--brand2:#e2552b;--brandl:#e8ebee;--steel:#7c868e;
 --bg:#eef0f1;--card:#ffffff;--card2:#f6f7f8;--card3:#e4e7ea;
 --text:#1a1f23;--muted:#56616a;--muted2:#8a949c;--line:#dde1e5;--line2:#c6ccd2;
 --acc:#c8431f;--acc2:#e2552b;--accl:#fdecd9;
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
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">ЖЫЛУ-ТЕХ</b><small class="gsub">ГАЗОВЫЕ КОТЛЫ · НАСОСЫ · БОЙЛЕРЫ · СЕРВИС · АЛМАТЫ</small></div></div>
  <span class="gtag">демо для Игоря · по встрече 19.11</span>
  <h1>Продажи, сервис и склад — <em>в своей системе, на своём сервере.</em></h1>
  <p>Битрикс дорожает каждый год, лишние модули, доплаты за телефонию, а база — не у вас. Здесь: воронка продаж котлов и насосов, сервисные выезды и сезонное ТО, склад 603 позиций, WhatsApp и звонки в одном окне. Без абонплаты.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">21</b></div><div><small>Ролей</small><b>6</b></div><div><small>Абонплата</small><b>0 ₸</b></div><div><small>Пакет</small><b>2,5 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только то, что разрешено.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, клиенты, суммы и люди придуманы. Ваши этапы, прайсы и шаблоны добавим после согласования.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <aside class="side">
  <div class="brandm">{MARK.format(w=34)}<div><b>Жылу-Тех</b><small>КОТЛЫ · НАСОСЫ · СЕРВИС</small></div></div>
  <nav id="rail"></nav>
  <div id="shint"></div>
 </aside>
 <div class="wrapr">
  <header class="topb"><div id="sub"></div>
   <div class="top-r">
    <div class="srch"><i>⌕</i><input placeholder="заказ, клиент, артикул" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
    <button class="ib" onclick="tour()" title="Сценарий">▶</button>
    <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
    <select class="rsel" id="rsel"></select>
    <div class="me" id="me">РК</div>
   </div>
  </header>
  <main class="main"><h1 id="ttl" class="vh">Жылу-Тех</h1><div class="content" id="content"></div></main>
 </div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('family=JetBrains+Mono','family=Golos+Text:wght@400;500;600;700&family=Onest:wght@500;600;700&family=JetBrains+Mono')
rep('<script src="/app/uss.js"></script>','<script src="/app/kotly-igor.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/kotly-igor.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'p{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/kotly-igor.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
