import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: штрихкод в рамке и галочка «совпало»
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="10" fill="#22252a"/><circle cx="50" cy="50" r="26" fill="none" stroke="#e8e8e4" stroke-width="7"/><circle cx="50" cy="50" r="9" fill="#d7261e"/><path d="M50 16v12M50 72v12M16 50h12M72 50h12M26 26l8 8M66 66l8 8M26 74l8-8M66 34l8-8" stroke="#e8e8e4" stroke-width="7" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>ПартсМаркет · автозапчасти: склад, 3 точки, продажи, сайт-каталог · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='10' fill='%2322252a'/><circle cx='50' cy='50' r='26' fill='none' stroke='%23e8e8e4' stroke-width='7'/><circle cx='50' cy='50' r='9' fill='%23d7261e'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#22252a;--rail2:#17191c;--rail-h:#33373e;--rail-a:#d7261e;
 --brand:#22252a;--brand2:#d7261e;--brandl:#f1efed;--steel:#7f8790;
 --bg:#f3f2ef;--card:#ffffff;--card2:#f7f7f4;--card3:#e8e8e3;
 --text:#1a1e22;--muted:#565e66;--muted2:#8a9097;--line:#e0e0da;--line2:#c9cac3;
 --acc:#d7261e;--acc2:#d7261e;--accl:#fbe6e3;
 --ok:#1c8a4c;--ok-l:#e1f3e8;--bad:#cc3226;--bad-l:#fbe3e0;--warn:#a46a00;--warn-l:#fbefd4;
 --info:#2f5f8f;--info-l:#e4edf6;--violet:#5e6c7a;--violet-l:#eceff2;
 --r:4px;--sh:none;--sh2:0 16px 40px rgba(20,23,27,.25);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#111316;--card:#1a1d21;--card2:#1f2328;--card3:#272c32;--brand:#9fb2c4;
 --text:#ecedee;--muted:#a3a9af;--muted2:#6f767d;--line:#2a2f35;--line2:#383e45;
 --brandl:#22282e;--accl:#352c10;--ok-l:#14291c;--bad-l:#311b18;--warn-l:#30260f;--info-l:#1a2533;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">ПАРТСМАРКЕТ</b><small class="gsub">АВТОЗАПЧАСТИ НА ЛЕГКОВЫЕ · АЛМАТЫ · 3 ТОЧКИ</small></div></div>
  <span class="gtag">демо для Беріка · по встрече 16.11</span>
  <h1>Вместо Excel — <em>склад, продажи и сайт в одной системе.</em></h1>
  <p>1 000 запчастей с артикулами и аналогами, остатки по трём точкам и по полкам. Продажа за минуту, заказы с сайта падают в систему сами. Вы видите продажи каждого менеджера, деньги и что заказать у поставщика. Без 1С и без абонплаты.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">19</b></div><div><small>Ролей</small><b>4</b></div><div><small>Точек</small><b>3</b></div><div><small>Портал + сайт</small><b>3,3 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, товары, клиенты, суммы и люди придуманы. Логотип пришлёте — перекрасим. Excel реально скачивается.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="mast">
  <div class="brandm">{MARK.format(w=30)}<b>ПАРТСМАРКЕТ</b></div>
  <nav id="rail"></nav>
  <div class="top-r">
   <div class="srch"><i>⌕</i><input placeholder="артикул, OEM, запчасть" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
   <button class="ib" onclick="tour()" title="Сценарий">▶</button>
   <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">БА</div>
  </div>
 </header>
 <div class="body2"><aside id="sub"></aside><main class="main"><h1 id="ttl" class="vh">ПартсМаркет</h1><div class="content" id="content"></div></main></div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/zapchasti-berik.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/zapchasti-berik.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'b{i}.js'),encoding='utf-8').read() for i in range(1,4))
open(ROOT+'/app/zapchasti-berik.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
