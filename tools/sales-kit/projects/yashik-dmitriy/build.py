import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа пока нет — знак от продукта: чёрный ягодный ящик с ягодами
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><path d="M14 40h72l-8 44H22z" fill="#f4f2ee"/><path d="M24 52h52M27 64h46M30 76h40" stroke="#24272b" stroke-width="5"/><circle cx="36" cy="30" r="10" fill="#d23c48"/><circle cx="52" cy="26" r="10" fill="#d23c48"/><circle cx="67" cy="31" r="9" fill="#d23c48"/><path d="M52 16l4-8" stroke="#5aa152" stroke-width="5" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Карасу Тара · заказы, цех, сырьё, склад и посредники · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='16' fill='%2324272b'/><path d='M14 40h72l-8 44H22z' fill='%23f4f2ee'/><circle cx='36' cy='30' r='10' fill='%23d23c48'/><circle cx='52' cy='26' r='10' fill='%23d23c48'/><circle cx='67' cy='31' r='9' fill='%23d23c48'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=Source+Sans+3:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap')
s=s.replace("'Golos Text'","'Source Sans 3'")
root=''':root{
 --rail:#24272b;--rail2:#1b1d20;--rail-h:#33373d;--rail-a:#d23c48;
 --brand:#c8323f;--brand2:#e9a43b;--brandl:#fbe9ea;--steel:#7c8189;
 --bg:#f4f2ee;--card:#ffffff;--card2:#f8f7f4;--card3:#ebe8e2;
 --text:#1f2125;--muted:#5e6168;--muted2:#8f9298;--line:#e4e0d8;--line2:#cfcac0;
 --acc:#3f8a3c;--acc2:#e9a43b;--accl:#e6f2e4;
 --ok:#2f7d32;--ok-l:#e3f1e2;--bad:#c8323f;--bad-l:#fbe7e8;--warn:#a96d0c;--warn-l:#fbf0d9;
 --info:#2c5e9a;--info-l:#e5edf8;--violet:#6a5a9a;--violet-l:#efecf6;
 --r:3px;--sh:none;--sh2:0 14px 36px rgba(36,39,43,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#141517;--card:#1d1f22;--card2:#222428;--card3:#2c2f34;--brand:#e5606a;
 --text:#ece9e4;--muted:#a3a29e;--muted2:#73757a;--line:#2e3135;--line2:#3c4046;
 --brandl:#3a1d20;--accl:#1d2e1c;--ok-l:#1a2c1a;--bad-l:#33191b;--warn-l:#302612;--info-l:#18243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=56)}<div><b class="gname">КАРАСУ ТАРА</b><small class="gsub">ПЛАСТИКОВЫЕ ЯЩИКИ И КОРЗИНКИ · ПРОИЗВОДСТВО</small></div></div>
  <span class="gtag">демо для Дмитрия · встреча 03.11</span>
  <h1>100 000 ящиков в месяц — <em>без Excel.</em></h1>
  <p>Заказы с калькулятором и счётом, цех по станкам и сменам — операторы вносят выпуск с телефона, сырьё списывается по весу ящика, склад по каждому виду, бой при погрузке, посредники на консигнации с долгами, отчёты в Excel.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">16</b></div><div><small>Ролей</small><b>6</b></div><div><small>Видов ящиков</small><b>5 + «плюс»</b></div><div><small>Стоимость</small><b>2 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — у каждого свой логин и свой экран.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, клиенты, цены, веса и объёмы придуманы — заменим на ваши из Excel. Логотип пришлёте — перекрасим под него.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo"[^>]*>.*?</div>',f'<div class="rail-logo" title="Карасу Тара">{MARK.format(w=34)}</div>',s,count=1,flags=re.S)
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Карасу Тара</h1>')
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="клиент, посредник"')
rep('<button class="ab" id="addBtn" onclick="act(\'payreq-new\')">+ ЗАЯВКА НА ОПЛАТУ</button>','<button class="ab" id="addBtn" onclick="if(allowed(\'order\'))newOrder();else toast(\'Нет доступа\')">+ ЗАКАЗ</button>')
rep('<div class="me" id="me">РК</div>','<div class="me" id="me">ДВ</div>')
rep('<script src="/app/uss.js"></script>','<script src="/app/yashik-dmitriy.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/yashik-dmitriy.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'y{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/yashik-dmitriy.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
