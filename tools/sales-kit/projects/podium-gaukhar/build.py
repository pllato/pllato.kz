import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
# логотипа нет — знак от отрасли: силуэт каблука в рамке, как на коробке обуви
MARK='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect x="4" y="4" width="92" height="92" fill="none" stroke="{c}" stroke-width="4"/><path d="M18 70c14 0 24-3 32-13l11-17h7l3 9c3 9 9 13 13 14v7H58l-4-6-6 6H18z" fill="{c}"/><path d="M66 70v12" stroke="{c}" stroke-width="5"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>Подиум · бутики обуви и аксессуаров: касса, коллекции, остатки · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%231a1715'/><path d='M14 70c14 0 24-3 32-13l11-17h7l3 9c3 9 9 13 15 14v7H56l-4-6-6 6H14z' fill='%23f7f3ee'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Golos+Text:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap')
root=''':root{
 --rail:#1a1715;--rail2:#12100f;--rail-h:#2a2522;--rail-a:#b08d57;
 --brand:#1a1715;--brand2:#8c2f39;--brandl:#f1e8e2;--steel:#8b96a3;
 --bg:#f7f3ee;--card:#fffdfa;--card2:#faf6f1;--card3:#eee6dc;
 --text:#1a1715;--muted:#6b6560;--muted2:#9a928a;--line:#e8dfd4;--line2:#d4c8ba;
 --acc:#8c2f39;--acc2:#b08d57;--accl:#f5e6e6;
 --ok:#3d6b4f;--ok-l:#e6efe8;--bad:#a8323e;--bad-l:#f6e4e5;--warn:#a87a2a;--warn-l:#f6eedd;
 --info:#3d5a6c;--info-l:#e6edf1;--violet:#6a5a7a;--violet-l:#efebf2;
 --r:0px;--sh:none;--sh2:0 18px 44px rgba(26,23,21,.2);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#14110f;--card:#1c1815;--card2:#221d1a;--card3:#2c2622;--brand:#efe6dc;
 --text:#efe6dc;--muted:#a89e94;--muted2:#7a7068;--line:#2c2622;--line2:#3a332e;
 --brandl:#2a2220;--accl:#2e1c1e;--ok-l:#1a261d;--bad-l:#2e1a1c;--warn-l:#2c2416;--info-l:#1a2228;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{MARK.format(w=54,c='#f7f3ee')}<div><b class="gname">Подиум</b><small class="gsub">БУТИКИ ОБУВИ И АКСЕССУАРОВ · АЛМАТЫ</small></div></div>
  <h1>Коллекция приходит файлом — <em>карточки и штрихкоды создаются сами.</em></h1>
  <span class="gtag">макет по встрече 2 ноября · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали: учёт десять лет живёт на 1С, но программисты продали компанию и уехали из Алматы — теперь всё только удалённо. Каждая модель приходит один раз за сезон, 2 500–3 000 позиций, карточки приходится заводить заново, а скидки на период и возвраты должны работать сами.</p>
  <p style="color:#d9bd8c">Здесь — касса со сканером и автоматическими скидками, приход коллекции из файла поставщика, остатки по бутикам и размерам, перемещения, возвраты по чеку, Kaspi и Instagram, покупатели и отчёт по сезону: что продаётся, а что уйдёт в распродажу.</p>
  <div class="gstat"><div><small>Экранов</small><b class="a">22</b></div><div><small>Ролей</small><b>6</b></div><div><small>Срок</small><b>4–6 недель</b></div><div><small>Стоимость</small><b>2,5 млн</b></div></div>
 </div>
 <div class="gate-r"><div class="lform"><h2>Вход в систему</h2><p>Выберите роль — система покажет только нужное.</p><div class="roles" id="roles"></div>
  <div class="lnote"><b>Демо-макет на вымышленных данных</b>Бутики, бренды, модели, покупатели и суммы придуманы для примера. Кнопка ▶ — сценарий показа.</div></div></div>
</section>'''
s=s[:g0]+gate+s[g1:]
a0=s.index('<div class="app hidden" id="app">');a1=s.index('<div class="mbg"')
app=f'''<div class="app hidden" id="app">
 <header class="mast">
  <div class="brandm">{MARK.format(w=30,c='currentColor')}<b>ПОДИУМ</b></div>
  <nav id="rail"></nav>
  <div class="top-r">
   <div class="srch"><i>⌕</i><input placeholder="модель, бренд, покупатель" onkeydown="if(event.key==='Enter')searchDemo(this.value)"></div>
   <button class="ib" id="tourBtn" onclick="tour()" title="Сценарий показа">▶</button>
   <button class="ib" id="themeBtn" onclick="toggleTheme()" title="Тема">◐</button>
   <select class="rsel" id="rsel"></select>
   <div class="me" id="me">ГА</div>
  </div>
 </header>
 <nav id="sub"></nav>
 <main class="main"><h1 id="ttl" class="vh">Подиум</h1><div class="content" id="content"></div></main>
</div>

'''
s=s[:a0]+app+s[a1:]
rep('<script src="/app/uss.js"></script>','<script src="/app/podium-gaukhar.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/podium-gaukhar.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'g{i}.js'),encoding='utf-8').read() for i in range(1,5))
open(ROOT+'/app/podium-gaukhar.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
