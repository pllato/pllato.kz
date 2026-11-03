import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: капля геля и линия кожи, голубой
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill="#1556b8"/><path d="M50 18c10 15 20 26 20 38a20 20 0 0 1-40 0c0-12 10-23 20-38z" fill="#fff"/><path d="M18 80c10-6 22-6 32 0s22 6 32 0" stroke="#7cc4ff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Skinline CRM · продажи, дебиторка, финансы и интеграции по ТЗ · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%231556b8'/><path d='M50 18c10 15 20 26 20 38a20 20 0 0 1-40 0c0-12 10-23 20-38z' fill='%23fff'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap')
s=s.replace("'Golos Text'","'IBM Plex Sans'").replace("'JetBrains Mono'","'IBM Plex Mono'")
root=''':root{
 --rail:#0b2545;--rail2:#081c36;--rail-h:#13345f;--rail-a:#7cc4ff;
 --brand:#1556b8;--brand2:#7cc4ff;--brandl:#e7f0fc;--steel:#7d8ea6;
 --bg:#f2f6fb;--card:#ffffff;--card2:#f7faff;--card3:#e6eef8;
 --text:#0f1f33;--muted:#53657c;--muted2:#8797ab;--line:#dde6f1;--line2:#c3d2e5;
 --acc:#1556b8;--acc2:#0ea5c6;--accl:#e7f0fc;
 --ok:#16804a;--ok-l:#e2f3ea;--bad:#c62f3c;--bad-l:#fbe6e8;--warn:#b2700a;--warn-l:#fbf1dc;
 --info:#1556b8;--info-l:#e7f0fc;--violet:#5b4fc4;--violet-l:#eeecfb;
 --r:8px;--sh:0 1px 2px rgba(11,37,69,.06);--sh2:0 18px 44px rgba(11,37,69,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#08121f;--card:#0f1c2e;--card2:#13233a;--card3:#1b2e4a;--brand:#5aa2ff;--acc:#5aa2ff;
 --text:#e4edf8;--muted:#9db0c8;--muted2:#6b7f99;--line:#1e3150;--line2:#2b4268;
 --brandl:#132c50;--accl:#132c50;--ok-l:#0f2a1d;--bad-l:#33161b;--warn-l:#2f2410;--info-l:#132c50;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">SKINLINE</b><small class="gsub">CRM · ДЕБИТОРКА · ФИНАНСЫ · ИНТЕГРАЦИИ</small></div></div>
  <span class="gtag">демо по техническому заданию · 12 разделов</span>
  <h1>Продажи, долги и деньги в одном контуре — <em>вместо разрозненных таблиц.</em></h1>
  <p>Калькулятор прибыли в каждой сделке, кредитные лимиты и блокировка отгрузки должникам, оплаты из банка привязываются сами, расходы с чеками с телефона, буфер ликвидности перед дивидендами, KPI от прибыли, P&L с YoY, 1С ERP, СДЭК, АТС, WhatsApp Business API и ИИ.</p>
  <div class="gstat"><div><small>Разделов ТЗ</small><b class="a">12 / 12</b></div><div><small>Экранов</small><b>19</b></div><div><small>Ролей</small><b>5</b></div><div><small>Интеграций</small><b>7</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Контрагенты, суммы, цены препаратов и сотрудники придуманы. Структура и логика — строго по ТЗ. Excel реально скачивается.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="mast">
  <div class="brandm">{MARK.format(w=30)}<b>SKINLINE</b></div>
  <nav id="rail"></nav>
  <div class="top-r">
   <div class="srch"><i>⌕</i><input placeholder="контрагент, БИН" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
   <button class="ib" onclick="tour()" title="Сценарий">▶</button>
   <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">УЧ</div>
  </div>
 </header>
 <nav id="sub"></nav>
 <main class="main"><h1 id="ttl" class="vh">Skinline</h1><div class="content" id="content"></div></main>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/skinline-crm.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/skinline-crm.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f's{i}.js'),encoding='utf-8').read() for i in range(1,6))
open(ROOT+'/app/skinline-crm.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
