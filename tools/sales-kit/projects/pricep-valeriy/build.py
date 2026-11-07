import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: прицеп с фаркопом, дорожная разметка
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="14" fill="#23292f"/><path d="M14 40h56v22H14z" fill="#f2b705"/><path d="M70 54h16" stroke="#f2b705" stroke-width="6" stroke-linecap="round"/><circle cx="34" cy="68" r="9" fill="#23292f" stroke="#f2b705" stroke-width="5"/><path d="M14 30h56" stroke="#e7e9eb" stroke-width="4" stroke-dasharray="8 6"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>ТрейлерГо · аренда и продажа прицепов · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%2323292f'/><path d='M14 40h56v22H14z' fill='%23f2b705'/><circle cx='34' cy='68' r='9' fill='%2323292f' stroke='%23f2b705' stroke-width='5'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#23292f;--rail2:#191d22;--rail-h:#323a42;--rail-a:#f2b705;
 --brand:#2c4a5e;--brand2:#f2b705;--brandl:#e6edf2;--steel:#7c868e;
 --bg:#f2f2ef;--card:#ffffff;--card2:#f8f8f6;--card3:#e8e8e3;
 --text:#1b1f23;--muted:#555e66;--muted2:#8a9299;--line:#e0e0da;--line2:#c8c9c2;
 --acc:#d99f00;--acc2:#f2b705;--accl:#fdf3d2;
 --ok:#1f7a45;--ok-l:#e2f2e7;--bad:#c23b2f;--bad-l:#fae5e2;--warn:#a86a00;--warn-l:#fbf0d8;
 --info:#2e64a8;--info-l:#e5edf8;--violet:#4f6070;--violet-l:#e9edf0;
 --r:4px;--sh:none;--sh2:0 16px 40px rgba(35,41,47,.25);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#121417;--card:#1b1f23;--card2:#20252a;--card3:#2a3036;--brand:#8fb3cc;
 --text:#e8eaec;--muted:#a2abb2;--muted2:#6f7880;--line:#2a3036;--line2:#39414a;
 --brandl:#22303a;--accl:#3a2f10;--ok-l:#15281c;--bad-l:#2f1a17;--warn-l:#2f2512;--info-l:#18243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">ТРЕЙЛЕРГО</b><small class="gsub">АРЕНДА И ПРОДАЖА ПРИЦЕПОВ · ПАРКОВКИ ПО КАЗАХСТАНУ</small></div></div>
  <span class="gtag">демо для Валерия · по встрече</span>
  <h1>Открыл портал — <em>и видно всё: где каждый прицеп, кто должен вернуть и как работают менеджеры.</em></h1>
  <p>Аренда: карта парковок и GPS, камеры, проверка клиента по ИИН, договор с подписью, просрочки и триггеры, должники и суды. Продажи: воронка, калькулятор прицепа → КП в WhatsApp, история повторных покупок, все звонки и переписки только через систему. Приложение — по API, первичка — в 1С в реальном времени. Битрикс24 больше не нужен.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">20</b></div><div><small>Ролей</small><b>6</b></div><div><small>Прицепов</small><b>23</b></div><div><small>Стоимость</small><b>2,5 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, клиенты, прицепы, суммы и люди придуманы. Логотип пришлёте — перекрасим. Excel реально скачивается.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="mast">
  <div class="brandm">{MARK.format(w=30)}<b>ТРЕЙЛЕРГО</b></div>
  <nav id="rail"></nav>
  <div class="top-r">
   <div class="srch"><i>⌕</i><input placeholder="прицеп, клиент, ИИН" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
   <button class="ib" onclick="tour()" title="Сценарий">▶</button>
   <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">ВЛ</div>
  </div>
 </header>
 <div class="body2"><aside id="sub"></aside><main class="main"><h1 id="ttl" class="vh">ТрейлерГо</h1><div class="content" id="content"></div></main></div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/pricep-valeriy.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/pricep-valeriy.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'v{i}.js'),encoding='utf-8').read() for i in (1,2,3,4,9))
open(ROOT+'/app/pricep-valeriy.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
