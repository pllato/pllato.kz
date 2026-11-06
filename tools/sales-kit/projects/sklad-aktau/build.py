import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: метка маршрута над коробкой
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="14" fill="#0d2a44"/><path d="M14 48 50 26l36 22v34H14z" fill="#e8eef4"/><path d="M26 56h48v8H26zm0 12h48v8H26z" fill="#0d2a44"/><path d="M12 84q9-6 19 0t19 0 19 0 19 0v6H12z" fill="#ff7a1a"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Каспий Терминал · ответственное хранение, карта склада, приёмка, счета · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%230d2a44'/><path d='M14 48 50 26l36 22v34H14z' fill='%23e8eef4'/><path d='M12 84q9-6 19 0t19 0 19 0 19 0v6H12z' fill='%23ff7a1a'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#0d2a44;--rail2:#081d31;--rail-h:#173b5c;--rail-a:#ff7a1a;
 --brand:#145a8a;--brand2:#ff7a1a;--brandl:#e3eef7;--steel:#7d8a96;
 --bg:#eef2f5;--card:#ffffff;--card2:#f6f8fa;--card3:#e3e9ee;
 --text:#132230;--muted:#536271;--muted2:#8794a0;--line:#dbe2e8;--line2:#c3ccd5;
 --acc:#ff7a1a;--acc2:#ff7a1a;--accl:#ffeedd;
 --ok:#1f7a45;--ok-l:#e2f2e7;--bad:#c23b2f;--bad-l:#fae5e2;--warn:#b0700a;--warn-l:#fbf0d8;
 --info:#2e64a8;--info-l:#e5edf8;--violet:#6a5a9a;--violet-l:#efecf6;
 --r:6px;--sh:none;--sh2:0 16px 40px rgba(13,42,68,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0c141c;--card:#132029;--card2:#182733;--card3:#20313f;--brand:#5aa8dc;
 --text:#e5ecf2;--muted:#9eacb9;--muted2:#6b7a88;--line:#22323f;--line2:#2f4252;
 --brandl:#16304a;--accl:#3a2412;--ok-l:#15281c;--bad-l:#2f1a17;--warn-l:#2f2512;--info-l:#18243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">КАСПИЙ ТЕРМИНАЛ</b><small class="gsub">АКТАУ · 1 КМ ОТ ПОРТА · ЖД-ТУПИК · 8 ЗОН ХРАНЕНИЯ</small></div></div>
  <span class="gtag">демо для Каната · по встрече</span>
  <h1>Каждая секция склада — <em>в цифрах и в телефоне.</em></h1>
  <p>«Меня бесит, что всё на бумажке». Цифровая карта склада: зоны, комнаты, секции, ячейки. Приёмка с весами и штрихкодом, отгрузка, заявки клиентов, автоматические счета за хранение, дебиторка, доходность каждой секции в ₸ за м². Кабинет клиента и боксы self-storage. Обмен с 1С.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">20</b></div><div><small>Ролей</small><b>6</b></div><div><small>Зон</small><b>8</b></div><div><small>Портал</small><b>2 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, клиенты, грузы, суммы и люди придуманы. Логотип пришлёте — перекрасим. Excel реально скачивается.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="mast">
  <div class="brandm">{MARK.format(w=30)}<b>КАСПИЙ</b></div>
  <nav id="rail"></nav>
  <div class="top-r">
   <div class="srch"><i>⌕</i><input placeholder="клиент, ячейка, партия" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
   <button class="ib" onclick="tour()" title="Сценарий">▶</button>
   <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">КМ</div>
  </div>
 </header>
 <div class="body2"><aside id="sub"></aside><main class="main"><h1 id="ttl" class="vh">Каспий Терминал</h1><div class="content" id="content"></div></main></div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/sklad-aktau.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/sklad-aktau.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'k{i}.js'),encoding='utf-8').read() for i in range(1,4))
open(ROOT+'/app/sklad-aktau.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
