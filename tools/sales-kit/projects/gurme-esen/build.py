import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: реторт-пакет, хаки и медь
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="12" fill="#3b4228"/><path d="M28 30h44l-4 50H32z" fill="#c9922e"/><path d="M28 30h44v8H28z" fill="#e9d9a8"/><path d="M38 52h24M38 62h18" stroke="#3b4228" stroke-width="5" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Сапар Гурме · производство, склад, маркетплейсы · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='12' fill='%233b4228'/><path d='M28 30h44l-4 50H32z' fill='%23c9922e'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
root=''':root{
 --rail:#2f3520;--rail2:#232817;--rail-h:#454d30;--rail-a:#d9a441;
 --brand:#4f5a32;--brand2:#d9a441;--brandl:#ecefe1;--steel:#7d8170;
 --bg:#f3f1ea;--card:#ffffff;--card2:#f8f7f1;--card3:#e8e6dc;
 --text:#1e2116;--muted:#575c4a;--muted2:#8b8f7e;--line:#e1dfd3;--line2:#c9c6b6;
 --acc:#b9822a;--acc2:#d9a441;--accl:#f8edd5;
 --ok:#2f7a3f;--ok-l:#e3f1e3;--bad:#b8392c;--bad-l:#f8e4e0;--warn:#a26a0b;--warn-l:#faefd8;
 --info:#3a6489;--info-l:#e6edf4;--violet:#5d6450;--violet-l:#eceee6;
 --r:4px;--sh:none;--sh2:0 16px 40px rgba(47,53,32,.25);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#14160f;--card:#1d2016;--card2:#22261a;--card3:#2c3122;--brand:#a9b67c;
 --text:#e9eadf;--muted:#a9ad98;--muted2:#737866;--line:#2c3122;--line2:#3c4230;
 --brandl:#2a3020;--accl:#3a2e12;--ok-l:#16281a;--bad-l:#2f1a17;--warn-l:#2f2512;--info-l:#18243a;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54)}<div><b class="gname">САПАР ГУРМЕ</b><small class="gsub">ПИТАНИЕ ДЛИТЕЛЬНОГО ХРАНЕНИЯ · ПОХОДНОЕ И ВОЕННОЕ</small></div></div>
  <span class="gtag">демо для Есена · по встрече 07.11</span>
  <h1>Тонна мяса пришла — <em>сканер «пикнул», и через смену видно, сколько вышло пакетов и куда делся каждый килограмм.</em></h1>
  <p>Приёмка сырья сканером, выдача в цех по техкарте из 1С, смена: выход пакетов, ужарка и потери против нормы. Склад готовой продукции с адресами ячеек, отгрузка магазинам, консигнация и долги. Цена меняется в базе — через 30 минут она на Kaspi, Ozon, Wildberries и сайте. Claude видит портал и подсказывает, что выпускать в этом месяце.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">20</b></div><div><small>Ролей</small><b>6</b></div><div><small>Видов продукции</small><b>36</b></div><div><small>Стоимость</small><b>2,5 млн ₸</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо на вымышленных данных</b>Название, рецептуры, магазины, суммы и люди придуманы. Логотип пришлёте — перекрасим. Excel реально скачивается.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="mast">
  <div class="brandm">{MARK.format(w=30)}<b>САПАР ГУРМЕ</b></div>
  <nav id="rail"></nav>
  <div class="top-r">
   <div class="srch"><i>⌕</i><input placeholder="блюдо, партия, магазин" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
   <button class="ib" onclick="tour()" title="Сценарий">▶</button>
   <button class="ib" onclick="toggleTheme()" title="Тема">◐</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">ЕС</div>
  </div>
 </header>
 <div class="body2"><aside id="sub"></aside><main class="main"><h1 id="ttl" class="vh">Сапар Гурме</h1><div class="content" id="content"></div></main></div>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/gurme-esen.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/gurme-esen.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'g{i}.js'),encoding='utf-8').read() for i in (1,2,3,4,9))
open(ROOT+'/app/gurme-esen.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
