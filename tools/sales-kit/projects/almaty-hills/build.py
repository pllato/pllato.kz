import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# предгорья + подкова
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M6 78l24-30 14 16 18-28 32 42z" fill="{c}" opacity=".9"/><path d="M36 30a14 14 0 1 1 28 0v16" fill="none" stroke="#d9a441" stroke-width="7" stroke-linecap="round"/><path d="M36 30v16" stroke="#d9a441" stroke-width="7" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Almaty Hills · конноспортивный клуб: расписание, лошади, абонементы, приложение · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='18' fill='%231d3b30'/><path d='M8 80l24-30 14 16 18-28 28 42z' fill='%23f6f1e7'/><path d='M36 30a14 14 0 1 1 28 0v14M36 30v14' fill='none' stroke='%23d9a441' stroke-width='8' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Source+Sans+3:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap')
s=s.replace("'Golos Text'","'Source Sans 3'").replace("'JetBrains Mono'","'IBM Plex Mono'")
root=''':root{
 --rail:#1d3b30;--rail2:#16302700;--rail-h:#28493c;--rail-a:#d9a441;
 --brand:#1d3b30;--brand2:#b0703c;--brandl:#e7eee8;--steel:#8b96a3;
 --bg:#f6f1e7;--card:#fffdf8;--card2:#f8f3ea;--card3:#ece4d6;
 --text:#22261f;--muted:#5f6157;--muted2:#8f8e82;--line:#e4dccd;--line2:#cfc4b0;
 --acc:#b0703c;--acc2:#e3c39f;--accl:#f6ebde;
 --ok:#3e7d4e;--ok-l:#e5f0e6;--bad:#b0412f;--bad-l:#f7e4df;--warn:#b07a17;--warn-l:#f8eed6;
 --info:#4f6f8f;--info-l:#e8eef4;--violet:#8a5a7a;--violet-l:#f3e9ef;
 --r:3px;--sh:none;--sh2:0 16px 40px rgba(29,59,48,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#121814;--card:#18201b;--card2:#1d2721;--card3:#26322b;
 --text:#ebe7dc;--muted:#a7a596;--muted2:#77786c;--line:#26322b;--line2:#36463c;
 --brandl:#1f3229;--accl:#2c2219;--violet-l:#261d23;--ok-l:#16261b;--bad-l:#2e1915;--warn-l:#2d2414;--info-l:#18222c;--brand:#8fc0a4;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=62,c='#f6f1e7')}
   <div><b class="gname">Almaty Hills</b><small class="gsub">КОННОСПОРТИВНЫЙ КЛУБ · ПРЕДГОРЬЯ АЛМАТЫ · С 2018 ГОДА</small></div>
  </div>
  <h1>Всадник записывается сам — в своём приложении.<br>Лошадь не работает больше, чем может.<br><em>Компания на прогулку — без «виртуальных клиентов».</em></h1>
  <span class="gtag">макет по встрече 30 октября · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали: Fitbase дал учёт финансов, абонементы и приложение, но система стала зависать и задваивать единицы, прогулки для компаний приходится вести через тестовых клиентов, а за это — 800 000 ₸ в год и ещё 36 000 ₸ в месяц за WhatsApp.</p>
  <p style="color:#e7c27a">Здесь — своя система клуба: расписание манежей и левад, конюшня с нагрузкой каждой лошади, ковка и ветеринар, 600 абонементщиков с листом ожидания, прогулки, договоры с подписью по ссылке, зарплата тренеров по процентам — и приложение Almaty Hills в App Store и Google Play.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">24</b></div>
   <div><small>Ролей</small><b>8 + всадник</b></div>
   <div><small>Лимит всадников</small><b>нет</b></div>
   <div><small>Стоимость</small><b>2,5 млн</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <p>Выберите роль — система покажет только нужное. Руководитель видит весь клуб; администратор — запись и оплаты; тренер — свои занятия; конюх — каких лошадей седлать; всадник — своё приложение.</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Всадники, лошади, телефоны и суммы придуманы для примера. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <aside class="side">
  <div class="slogo">{LOGO.format(w=38,c='#f6f1e7')}<div><b>Almaty Hills</b><small>конноспортивный клуб</small></div></div>
  <nav id="rail"></nav>
  <div class="sfoot"><div class="me" id="me">БК</div><span>Батырбек · руководитель</span></div>
 </aside>
 <main class="main">
  <header class="top">
   <div class="tt"><small id="crumb">Сегодня</small><h1 id="ttl">Almaty Hills</h1></div>
   <div class="top-r">
    <div class="srch"><i>⌕</i><input placeholder="всадник, телефон, лошадь" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
    <button class="ab" id="addBtn" onclick="card('newslot','A1|16:00')">+ ЗАПИСЬ</button>
    <button class="ib" id="themeBtn" onclick="toggleTheme()" title="Тема">◐</button>
    <button class="ib" id="tourBtn" onclick="tour()" title="Сценарий показа">▶</button>
    <select class="rsel" id="rsel"></select>
   </div>
  </header>
  <div class="ribbon" id="ribbon"></div>
  <div class="content" id="content"></div>
 </main>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/almaty-hills.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/almaty-hills.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'a{i}.js'),encoding='utf-8').read() for i in range(1,8))
open(ROOT+'/app/almaty-hills.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
