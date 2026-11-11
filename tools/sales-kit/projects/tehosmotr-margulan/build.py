import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: галочка «прошёл ТО»
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="16" fill="#22272b"/><circle cx="50" cy="50" r="30" fill="none" stroke="#3fbf6e" stroke-width="9"/><path d="M36 51l10 10 19-22" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
s=re.sub(r'<title>Техосмотр QZ · 21 станция: операции, качество, маркетинг, колл-центр, HR, финансы, 1С · демо</title>','<title>Техосмотр QZ · 22 станции техосмотра, колл-центр, операторы, HR, ИИ-ассистент · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%2322272b'/><path d='M50 12a18 18 0 0 1 18 18c0 13-18 30-18 30S32 43 32 30a18 18 0 0 1 18-18z' fill='none'/><circle cx='50' cy='50' r='30' fill='none' stroke='%233fbf6e' stroke-width='9'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#1d2226;--rail2:#15191c;--rail-h:#2c3338;--rail-a:#3fbf6e;
 --brand:#1f8a4c;--brand2:#3fbf6e;--brandl:#e3f3e9;--steel:#7d868c;
 --bg:#f2f3f1;--card:#ffffff;--card2:#f7f8f6;--card3:#e7eae6;
 --text:#191e21;--muted:#566067;--muted2:#8b949a;--line:#e0e3df;--line2:#c8cdc8;
 --acc:#e0a400;--acc2:#e0a400;--accl:#fbf1d3;
 --ok:#1f8a4c;--ok-l:#e3f3e9;--bad:#c9302c;--bad-l:#fbe4e2;--warn:#b07500;--warn-l:#fbefd6;
 --info:#2d64a8;--info-l:#e5edf8;--violet:#56606a;--violet-l:#eceef0;
 --r:4px;--sh:none;--sh2:0 16px 40px rgba(20,25,28,.25);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#111416;--card:#191d20;--card2:#1e2326;--card3:#272d31;--brand:#4fd083;
 --text:#e7ebe9;--muted:#a0aaa5;--muted2:#6d7772;--line:#272d30;--line2:#363e42;
 --brandl:#17301f;--accl:#332a10;--ok-l:#15281c;--bad-l:#2f1a17;--warn-l:#2f2512;--info-l:#18243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">ТЕХОСМОТР QZ</b><small class="gsub">СЕТЬ СТАНЦИЙ ТЕХОСМОТРА · 21 СТАНЦИЯ · 24/7 И ДНЕВНЫЕ</small></div></div>
  <span class="gtag">демо по договору TZO-2026-01 · ТЗ операций, ОКК и маркетинга</span>
  <h1>Каждый осмотр, смена и тенге — <em>в одном портале, по отделам.</em></h1>
  <p>21 станция: осмотры с обязательными полями, смены 24/7 и дневные, ремонты и простои, закупки и OPEX, аудиты качества и рейтинг операторов, маркетинг — активности, контент, партнёры, допуслуги, рассылки и ребрендинг, колл-центр и напоминания, HR, ОПиУ и ДДС, обмен с 1С.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">41</b></div><div><small>Ролей</small><b>12</b></div><div><small>Станций</small><b>21</b></div><div><small>Портал</small><b>2,8 млн ₸ · с 1С</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, станции, клиенты, суммы и люди придуманы. Пришлёте логотип — перекрасим. Excel реально скачивается.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="mast">
  <div class="brandm">{MARK.format(w=30)}<b>ТЕХОСМОТР QZ</b></div>
  <nav id="rail"></nav>
  <div class="top-r">
   <div class="srch"><i>⌕</i><input placeholder="станция, клиент, госномер" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
   <button class="ib" onclick="tour()" title="Сценарий">▶</button>
   <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">МГ</div>
  </div>
 </header>
 <div class="body2"><aside id="sub"></aside><main class="main"><h1 id="ttl" class="vh">Техосмотр QZ</h1><div class="content" id="content"></div></main></div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/tehosmotr-margulan.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/tehosmotr-margulan.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f't{i}.js'),encoding='utf-8').read() for i in (1,2,3,4,5,6,9))
open(ROOT+'/app/tehosmotr-margulan.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
