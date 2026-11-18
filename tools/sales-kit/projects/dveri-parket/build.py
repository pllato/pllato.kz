import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: штрихкод в рамке и галочка «совпало»
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="12" fill="#2c1c11"/><rect x="28" y="16" width="44" height="70" rx="2" fill="none" stroke="#e0b277" stroke-width="6"/><circle cx="62" cy="52" r="4" fill="#e0b277"/><path d="M14 86h72" stroke="#c4904f" stroke-width="6" stroke-linecap="round"/><path d="M20 92h14M42 92h14M64 92h14" stroke="#8a5a33" stroke-width="4"/></svg>'
s=re.sub(r'<title>Дуб и Дверь · двери и паркет: КЦ, продажи, расчёт, согласования · демо</title>','<title>ПартсМаркет · автозапчасти: склад, 3 точки, продажи, сайт-каталог · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%232c1c11'/><rect x='28' y='16' width='44' height='70' rx='2' fill='none' stroke='%23e0b277' stroke-width='7'/><circle cx='62' cy='52' r='5' fill='%23e0b277'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#4a2f1f;--rail2:#3a2617;--rail-h:#5a3b26;--rail-a:#c4904f;
 --brand:#6b4428;--brand2:#c4904f;--brandl:#f3ebdf;--steel:#8a8178;
 --bg:#f4efe7;--card:#ffffff;--card2:#faf7f2;--card3:#ece4d8;
 --text:#2a2e31;--muted:#5f5a54;--muted2:#958b80;--line:#e6ddd0;--line2:#d2c5b3;
 --acc:#c4904f;--acc2:#c4904f;--accl:#f8ecd9;
 --ok:#2f7d4f;--ok-l:#e3f1e7;--bad:#b8392c;--bad-l:#f8e2de;--warn:#9a6410;--warn-l:#f8ecd4;
 --info:#3a5f7d;--info-l:#e5edf4;--violet:#6a6258;--violet-l:#efebe5;
 --r:6px;--sh:none;--sh2:0 16px 40px rgba(58,38,23,.25);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#17130f;--card:#201a15;--card2:#261f19;--card3:#30271f;--brand:#d9b07a;
 --text:#efe8de;--muted:#b3a796;--muted2:#7d7265;--line:#352b22;--line2:#46392d;
 --brandl:#2c231b;--accl:#3a2b17;--ok-l:#16291d;--bad-l:#33191a;--warn-l:#33270f;--info-l:#1b2633;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">ДУБ И ДВЕРЬ</b><small class="gsub">ДВЕРИ И ПАРКЕТ · АЛМАТЫ · АСТАНА · ШЫМКЕНТ</small></div></div>
  <span class="gtag">демо для Алексея и Айкеры · по встрече 17.11 и вашей системе</span>
  <h1>Только нужное вам — <em>на вашем сервере, без абонплаты.</em></h1>
  <p>По вашей системе: лиды с вашими стадиями, 13 воронок сделок с правами, документация и таймлайн сделки, согласование выплат и автоматизации. Колл-центр и продажи по салонам, карточка сделки со всеми чатами, звонками и расчётами, калькуляторы дверей и паркета, согласования скидок, оплат и договоров по шагам. Данные клиентов — на сервере в Казахстане, переезд с Битрикс24 без остановки.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">21</b></div><div><small>Ролей</small><b>6</b></div><div><small>Города</small><b>3</b></div><div><small>Без НДС</small><b>2,5 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, клиенты, суммы и люди придуманы. Пришлёте схемы ваших процессов — соберём маршруты как у вас.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <aside class="side">
  <div class="brandm">{MARK.format(w=34)}<div><b>Дуб и Дверь</b><small>CRM · 3 ГОРОДА · 4 САЛОНА</small></div></div>
  <nav id="rail"></nav>
  <div id="shint"></div>
 </aside>
 <div class="wrapr">
  <header class="topb"><div id="sub"></div>
   <div class="top-r">
    <div class="srch"><i>⌕</i><input placeholder="клиент, телефон, БИН" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
    <button class="ib" onclick="tour()" title="Сценарий">▶</button>
    <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
    <select class="rsel" id="rsel"></select>
    <div class="me" id="me">АЛ</div>
   </div>
  </header>
  <main class="main"><h1 id="ttl" class="vh">Дуб и Дверь</h1><div class="content" id="content"></div></main>
 </div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('family=JetBrains+Mono','family=Lora:wght@500;600;700&family=JetBrains+Mono')
rep('<script src="/app/uss.js"></script>','<script src="/app/dveri-parket.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/dveri-parket.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'd{i}.js'),encoding='utf-8').read() for i in range(1,6))
open(ROOT+'/app/dveri-parket.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
