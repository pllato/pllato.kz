import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: штрихкод в рамке и галочка «совпало»
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="10" fill="#1d2126"/><rect x="18" y="22" width="64" height="44" fill="none" stroke="#f2c230" stroke-width="6"/><path d="M28 32v24M36 32v24M42 32v24M50 32v24M56 32v24M64 32v24M72 32v24" stroke="#f2f2ee" stroke-width="3"/><path d="M30 78l10 8 20-16" fill="none" stroke="#3ccf7a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Дала Трейд · сборка без пересорта, 3 склада, обмен с 1С · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='10' fill='%231d2126'/><rect x='18' y='22' width='64' height='44' fill='none' stroke='%23f2c230' stroke-width='6'/><path d='M30 78l10 8 20-16' fill='none' stroke='%233ccf7a' stroke-width='7'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#1d2126;--rail2:#14171b;--rail-h:#2c3238;--rail-a:#f2c230;
 --brand:#2c3a47;--brand2:#f2c230;--brandl:#eef0f2;--steel:#7f8790;
 --bg:#f2f2ef;--card:#ffffff;--card2:#f7f7f4;--card3:#e8e8e3;
 --text:#1a1e22;--muted:#565e66;--muted2:#8a9097;--line:#e0e0da;--line2:#c9cac3;
 --acc:#d9a400;--acc2:#f2c230;--accl:#fdf4d3;
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
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">ДАЛА ТРЕЙД</b><small class="gsub">ДИСТРИБУЦИЯ ПРОДУКТОВ · ПЕТРОПАВЛОВСК · АСТАНА · КОКШЕТАУ</small></div></div>
  <span class="gtag">демо для Рахата · по встрече 12.11</span>
  <h1>Не тот товар — <em>сканер не пропустит.</em></h1>
  <p>Накладная из 1С приходит на склад сама. Кладовщик пикает каждую позицию штрихкодом: если взял детские салфетки вместо кухонных, система остановит сборку. Остатки и ревизия по трём складам в любой момент. Advance Agent и 1С остаются как есть.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">18</b></div><div><small>Ролей</small><b>4</b></div><div><small>Складов</small><b>3</b></div><div><small>Склад + 1С</small><b>2,3 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, товары, магазины, суммы и люди придуманы. Логотип пришлёте — перекрасим. Excel реально скачивается.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="mast">
  <div class="brandm">{MARK.format(w=30)}<b>ДАЛА ТРЕЙД</b></div>
  <nav id="rail"></nav>
  <div class="top-r">
   <div class="srch"><i>⌕</i><input placeholder="товар, накладная, штрихкод" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
   <button class="ib" onclick="tour()" title="Сценарий">▶</button>
   <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">РМ</div>
  </div>
 </header>
 <div class="body2"><aside id="sub"></aside><main class="main"><h1 id="ttl" class="vh">Дала Трейд</h1><div class="content" id="content"></div></main></div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/sklad-rakhat.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/sklad-rakhat.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'r{i}.js'),encoding='utf-8').read() for i in range(1,4))
open(ROOT+'/app/sklad-rakhat.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
