import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: силуэт каблука в рамке, как на коробке обуви
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 6l36 13v27c0 24-15 40-36 48C29 86 14 70 14 46V19z" fill="{c}"/><path d="M36 30v40M36 50l22-20M42 46l18 24" stroke="#d4a640" stroke-width="8" stroke-linecap="round" fill="none"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Кугуар-секьюрити · сайт, мини-CRM и личный кабинет по ТЗ · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M50 6l36 13v27c0 24-15 40-36 48C29 86 14 70 14 46V19z' fill='%2310233f'/><path d='M36 30v40M36 50l22-20M42 46l18 24' stroke='%23d4a640' stroke-width='8' stroke-linecap='round' fill='none'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=Exo+2:wght@500;600;700;800&family=Golos+Text:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600&display=swap')
root=''':root{
 --rail:#10233f;--rail2:#0b1a30;--rail-h:#1a3358;--rail-a:#d4a640;
 --brand:#10233f;--brand2:#d4a640;--brandl:#e6ecf5;--steel:#8b96a3;
 --bg:#eef1f5;--card:#ffffff;--card2:#f6f8fb;--card3:#e4e9f0;
 --text:#121c2c;--muted:#5a6578;--muted2:#8a94a6;--line:#dfe5ee;--line2:#c8d1de;
 --acc:#ea6a1f;--acc2:#d4a640;--accl:#fdeee4;
 --ok:#2b7a4b;--ok-l:#e2f1e8;--bad:#c23a2c;--bad-l:#f9e4e1;--warn:#b07a12;--warn-l:#f8eed6;
 --info:#2c5f9e;--info-l:#e5eef9;--violet:#6a5a9a;--violet-l:#efecf6;
 --r:10px;--sh:none;--sh2:0 16px 40px rgba(16,35,63,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0c1220;--card:#131c2e;--card2:#18233a;--card3:#22304b;--brand:#9fb6dc;
 --text:#e6ebf3;--muted:#9ea8bb;--muted2:#6c768a;--line:#22304b;--line2:#30405f;
 --brandl:#1a2a46;--accl:#33200f;--ok-l:#15261c;--bad-l:#2e1915;--warn-l:#2e2614;--info-l:#18243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=60,c='#ffffff')}<div><b class="gname">КУГУАР-СЕКЬЮРИТИ</b><small class="gsub">САЙТ · МИНИ-CRM · ЛИЧНЫЙ КАБИНЕТ · ЛОЯЛЬНОСТЬ</small></div></div>
  <h1>Демо по техническому заданию договора KUG-2026-01. <em>Так будет работать система после сдачи.</em></h1>
  <span class="gtag">по ТЗ и бизнес-процессам Приложения № 3 · всё кликается</span>
  <p style="margin-top:15px">Посетитель сайта нажимает «Хочу быть в безопасности!», заявка падает в CRM, бот пишет клиенту и менеджеру в WhatsApp. Менеджер квалифицирует заявку, система формирует смету и договор и отправляет их клиенту, монтажник получает задачу в телефон, клиенту приходит акт — и открывается личный кабинет.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">13</b></div><div><small>Ролей</small><b>5</b></div><div><small>Процессов</small><b>7</b></div><div><small>Договор</small><b>KUG-2026-01</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в демо</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Клиенты, телефоны, суммы и цены оборудования придуманы. Вёрстка сайта — условная: в работе делается по вашему макету. Кнопка ▶ — сценарий.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="mast">
  <div class="brandm">{MARK.format(w=30,c='currentColor')}<b>КУГУАР</b></div>
  <nav id="rail"></nav>
  <div class="top-r">
   <div class="srch"><i>⌕</i><input placeholder="заявка, клиент, телефон" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
   <button class="ib" id="tourBtn" onclick="tour()" title="Сценарий показа">▶</button>
   <button class="ib" id="themeBtn" onclick="toggleTheme()" title="Тема">◐</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">БМ</div>
  </div>
 </header>
 <nav id="sub"></nav>
 <main class="main"><h1 id="ttl" class="vh">Кугуар</h1><div class="content" id="content"></div></main>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/kuguar-crm.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
s=s.replace("'JetBrains Mono'","'Roboto Mono'")
rep('</style>',css+'\n</style>')
open(ROOT+'/app/kuguar-crm.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'k{i}.js'),encoding='utf-8').read() for i in range(1,4))
open(ROOT+'/app/kuguar-crm.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
