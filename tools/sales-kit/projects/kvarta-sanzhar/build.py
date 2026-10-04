import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# четыре направления — четыре квадрата
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect x="10" y="10" width="36" height="36" rx="9" fill="#23935f"/><rect x="54" y="10" width="36" height="36" rx="9" fill="#1f7aa8"/><rect x="10" y="54" width="36" height="36" rx="9" fill="#c98a1b"/><rect x="54" y="54" width="36" height="36" rx="9" fill="#c4506e"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Кварта · B2B-платформа аутсорсинга: бухгалтерия, юристы, налоги, HR · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect x='8' y='8' width='38' height='38' rx='9' fill='%2323935f'/><rect x='54' y='8' width='38' height='38' rx='9' fill='%231f7aa8'/><rect x='8' y='54' width='38' height='38' rx='9' fill='%23c98a1b'/><rect x='54' y='54' width='38' height='38' rx='9' fill='%23c4506e'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=Geologica:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600&family=Wix+Madefor+Text:wght@400;500;600;700&display=swap')
s=s.replace("'Golos Text'","'Wix Madefor Text'").replace("'JetBrains Mono'","'Source Code Pro'")
root=''':root{
 --rail:#15171d;--rail2:#101217;--rail-h:#232733;--rail-a:#2f5bea;
 --brand:#2f5bea;--brand2:#8fa9ff;--brandl:#eaf0ff;--steel:#8b96a3;
 --bg:#f4f5f8;--card:#fff;--card2:#f8f9fb;--card3:#eceef3;
 --text:#151821;--muted:#5d6475;--muted2:#8a919f;--line:#e4e7ee;--line2:#cfd4de;
 --acc:#2f5bea;--acc2:#b9c8fb;--accl:#eef2ff;
 --ok:#23935f;--ok-l:#e5f4ec;--bad:#d1453a;--bad-l:#fbe9e7;--warn:#c98a1b;--warn-l:#fbf2df;
 --info:#1f7aa8;--info-l:#e6f2f8;--violet:#6b5a9a;--violet-l:#efecf6;
 --r:12px;--sh:none;--sh2:0 14px 40px rgba(16,20,30,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#0f1116;--card:#171a21;--card2:#1c2029;--card3:#262b36;
 --text:#e7eaf1;--muted:#9aa2b3;--muted2:#6c7486;--line:#262b36;--line2:#343b4a;
 --brandl:#1a2340;--accl:#1a2340;--violet-l:#211e2b;--ok-l:#13261c;--bad-l:#2e1715;--warn-l:#2e2614;--info-l:#14242e;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
dirs=''.join(f'<span style="--c:{c}">{n}</span>' for n,c in [('Бухгалтерия','#23935f'),('Юридическое','#1f7aa8'),('Налоги','#c98a1b'),('HR и кадры','#c4506e')])
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58)}
   <div><b class="gname">КВАРТА</b><small class="gsub">B2B-ПЛАТФОРМА АУТСОРСИНГА · ПОРТАЛ И ПРИЛОЖЕНИЕ</small></div>
  </div>
  <h1>Пятьсот клиентов — без WhatsApp и Telegram.<br>Каждый запрос — заявка со сроком и ответственным.<br><em>Сотрудник переключается между клиентами в один клик.</em></h1>
  <span class="gtag">макет по встрече · всё кликается</span>
  <div class="gdirs">{dirs}</div>
  <p style="margin-top:12px">Вы рассказали: это не просто CRM, а полноценная B2B-платформа — веб-версия с личным кабинетом сотрудника и обратной стороной для клиентов. Четыре направления, около пятисот клиентов на обслуживании, запросы каждый месяц — сейчас всё через WhatsApp и Telegram.</p>
  <p style="color:#8fa9ff">Здесь — заявки по направлениям, рабочее место каждого клиента, мессенджер с аудио- и видеозвонками, ИИ-шаблоны документов, счета, внутренние задачи вместо Битрикс24, кабинет клиента и приложение для iOS и Android. Серверы — в Казахстане.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">24</b></div>
   <div><small>Ролей</small><b>7</b></div>
   <div><small>Портал</small><b>2,5 млн</b></div>
   <div><small>Приложение</small><b>3,5 млн</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Выберите роль — система покажет только нужное. Руководитель видит всех клиентов и команду; специалист — клиентов своего направления; менеджер — входящие и счета; клиент — свой кабинет.</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Компании, БИН, имена и суммы придуманы для примера. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <aside class="rail">
  <div class="rail-logo" title="Кварта">{LOGO.format(w=32)}</div>
  <nav id="rail"></nav>
  <div class="rail-bot"><div class="me" id="me">СЖ</div></div>
 </aside>
 <aside id="clist"></aside>
 <main class="main">
  <header class="top">
   <div class="ctx" id="ctx"></div>
   <div class="top-r">
    <div class="srch"><i>⌕</i><input placeholder="клиент, БИН, номер заявки" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
    <button class="ab" id="addBtn" onclick="card('newreq')">+ ЗАЯВКА</button>
    <button class="ib" id="themeBtn" onclick="toggleTheme()" title="Тема">◐</button>
    <button class="ib" id="tourBtn" onclick="tour()" title="Сценарий показа">▶</button>
    <select class="rsel" id="rsel"></select>
   </div>
  </header>
  <nav id="sub"></nav>
  <h1 id="ttl" class="vh">Кварта</h1>
  <div class="content" id="content"></div>
 </main>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/kvarta-sanzhar.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/kvarta-sanzhar.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f's{i}.js'),encoding='utf-8').read() for i in range(1,8))
open(ROOT+'/app/kvarta-sanzhar.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
