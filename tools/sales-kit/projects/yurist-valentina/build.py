import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: штрихкод в рамке и галочка «совпало»
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="10" fill="#14243a"/><path d="M50 18v60M30 78h40M22 34h56" stroke="#c9a45c" stroke-width="5" stroke-linecap="round"/><path d="M22 34l-9 22h18zM78 34l-9 22h18z" fill="none" stroke="#c9a45c" stroke-width="4" stroke-linejoin="round"/><circle cx="50" cy="18" r="5" fill="#c9a45c"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Аргумент · юридическая компания: продажи, дела, сроки, аутсорсеры · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='10' fill='%2314243a'/><path d='M50 18v60M30 78h40M22 34h56' stroke='%23c9a45c' stroke-width='7' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#14243a;--rail2:#0e1a2b;--rail-h:#1d3350;--rail-a:#c9a45c;
 --brand:#1e3a5f;--brand2:#c9a45c;--brandl:#e6ecf4;--steel:#7d8794;
 --bg:#f4f1ea;--card:#ffffff;--card2:#f9f7f2;--card3:#ebe6db;
 --text:#1b2430;--muted:#55606d;--muted2:#8d96a1;--line:#e3ddd0;--line2:#cfc6b5;
 --acc:#a8843c;--acc2:#c9a45c;--accl:#f5edda;
 --ok:#2b7a4b;--ok-l:#e2f1e7;--bad:#b3312a;--bad-l:#f8e0dd;--warn:#94620d;--warn-l:#f7ecd2;
 --info:#2f5b8a;--info-l:#e3ecf6;--violet:#5e6470;--violet-l:#eceef1;
 --r:4px;--sh:none;--sh2:0 16px 40px rgba(14,26,43,.28);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0e141c;--card:#151d28;--card2:#1a2430;--card3:#222e3c;--brand:#9fb8d8;
 --text:#e8ecf1;--muted:#a6b0bc;--muted2:#6f7a87;--line:#26313f;--line2:#344152;
 --brandl:#1c2a3b;--accl:#30291a;--ok-l:#15281d;--bad-l:#32191a;--warn-l:#30260f;--info-l:#18263a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">АРГУМЕНТ</b><small class="gsub">ЮРИДИЧЕСКАЯ КОМПАНИЯ · ШТАТ И ЮРИСТЫ-АУТСОРСЕРЫ</small></div></div>
  <span class="gtag">демо для Валентины и собственника · по встрече 17.11</span>
  <h1>Каждый видит своё — <em>а сроки по делам не горят.</em></h1>
  <p>Две линии продаж с ботом, воронка дел до гонорара успеха, план работ по делу в задачи с напоминаниями, судебный кабинет и цифровой след, лента поправок из Әділет, учёт времени аутсорсеров, управленческие деньги отдельно от 1С. Один раз платите — без лицензий на каждого юриста.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">24</b></div><div><small>Ролей</small><b>6</b></div><div><small>Лицензий</small><b>0</b></div><div><small>Пакет</small><b>2,8 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только то, что разрешено.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, клиенты, дела, суммы и люди придуманы. Ваши процессы и хотелки собственника добавим после согласования.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <aside class="side">
  <div class="brandm">{MARK.format(w=34)}<div><b>Аргумент</b><small>ЮРИДИЧЕСКАЯ КОМПАНИЯ</small></div></div>
  <nav id="rail"></nav>
  <div id="shint"></div>
 </aside>
 <div class="wrapr">
  <header class="topb"><div id="sub"></div>
   <div class="top-r">
    <div class="srch"><i>⌕</i><input placeholder="клиент, дело, ИИН" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
    <button class="ib" onclick="tour()" title="Сценарий">▶</button>
    <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
    <select class="rsel" id="rsel"></select>
    <div class="me" id="me">ВЛ</div>
   </div>
  </header>
  <main class="main"><h1 id="ttl" class="vh">Аргумент</h1><div class="content" id="content"></div></main>
 </div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('family=JetBrains+Mono','family=PT+Serif:wght@400;700&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono')
rep('<script src="/app/uss.js"></script>','<script src="/app/yurist-valentina.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/yurist-valentina.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'y{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/yurist-valentina.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
