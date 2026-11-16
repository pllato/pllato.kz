import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: коробка на тележке-рохле
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill="#ef6c1a"/><rect x="30" y="24" width="38" height="34" rx="3" fill="#fff"/><path d="M30 36h38" stroke="#ef6c1a" stroke-width="4"/><path d="M20 22v46h56" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="34" cy="78" r="7" fill="#fff"/><circle cx="66" cy="78" r="7" fill="#fff"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Жүк Сервис · CRM грузчиков: заказы, оплаты, исполнители, WhatsApp · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23ef6c1a'/><rect x='30' y='24' width='38' height='34' rx='3' fill='%23fff'/><path d='M20 22v46h56' fill='none' stroke='%23fff' stroke-width='7'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
s=s.replace('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800','family=JetBrains+Mono:wght@400;500;600;700&family=Onest:wght@400;500;600;700;800')
s=s.replace("font-family:'Golos Text',system-ui,sans-serif","font-family:'Onest',system-ui,sans-serif")
root=''':root{
 --rail:#ffffff;--rail2:#f6f4f1;--rail-h:#fbeee4;--rail-a:#ef6c1a;
 --brand:#ef6c1a;--brand2:#ef6c1a;--brandl:#fdf0e6;--steel:#7c8590;
 --bg:#f5f4f1;--card:#ffffff;--card2:#faf9f7;--card3:#efede9;
 --text:#1f2329;--muted:#5d6570;--muted2:#8f969f;--line:#e8e5e0;--line2:#d6d2cb;
 --acc:#ef6c1a;--acc2:#ef6c1a;--accl:#fdf0e6;
 --ok:#1f8a54;--ok-l:#e4f4ea;--bad:#d23a2b;--bad-l:#fce6e3;--warn:#b26a00;--warn-l:#fdf1dc;
 --info:#2563b8;--info-l:#e6eef9;--violet:#5d6570;--violet-l:#eef0f2;
 --r:10px;--sh:0 1px 2px rgba(31,35,41,.05);--sh2:0 18px 44px rgba(31,35,41,.18);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#14161a;--card:#1c1f24;--card2:#21252b;--card3:#2a2f36;--rail:#1c1f24;--rail2:#1c1f24;--rail-h:#2a2f36;
 --text:#eceef0;--muted:#a6adb5;--muted2:#737b84;--line:#2b3037;--line2:#3a4049;
 --brandl:#33241a;--accl:#33241a;--ok-l:#15291e;--bad-l:#321b18;--warn-l:#30260f;--info-l:#18243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">ЖҮК СЕРВИС</b><small class="gsub">ГРУЗЧИКИ И «ГАЗЕЛЬ» · АСТАНА · КОСТАНАЙ</small></div></div>
  <span class="gtag">демо по вашему ТЗ от 10.11 · 13 разделов</span>
  <h1>Заказ, часы, оплата и грузчики — <em>в одной CRM, с телефона.</em></h1>
  <p>Заявки из WhatsApp и звонков сразу у менеджера. Часы считаются сами: минимум 2 часа, дальше шаг 30 минут. Оплаты от клиентов — тремя столбцами, выплаты исполнителям — галочкой. Руководитель видит выручку по городам и менеджерам и управляет удалённо.</p>
  <div class="gstat"><div><small>Разделов</small><b class="a">13</b></div><div><small>Ролей</small><b>2</b></div><div><small>Города</small><b>2 + новые</b></div><div><small>Разработка</small><b>2,5 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в CRM</h2><p>Выберите роль — руководитель видит всё, менеджер только своё.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, клиенты, грузчики, номера и суммы придуманы. Логотип пришлёте — перекрасим. Excel реально скачивается.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <aside class="side">
  <div class="brandm">{MARK.format(w=32)}<div><b>ЖҮК СЕРВИС</b><small>CRM грузчиков</small></div></div>
  <nav id="rail"></nav>
  <div id="sub"></div>
 </aside>
 <div class="mainw">
  <header class="topb">
   <div id="cities" class="cities"></div>
   <div class="top-r">
    <div class="srch"><i>⌕</i><input placeholder="телефон, клиент, БИН" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
    <button class="ib" onclick="tour()" title="Сценарий">▶</button>
    <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
    <select class="rsel" id="rsel"></select>
    <div class="me" id="me">РК</div>
   </div>
  </header>
  <main class="main"><h1 id="ttl" class="vh">Жүк Сервис</h1><div class="content" id="content"></div></main>
 </div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/gruzchiki-crm.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/gruzchiki-crm.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'g{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/gruzchiki-crm.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
