import re,os
D=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.abspath(os.path.join(D,'..','..','..','..'))
s=open(ROOT+'/app/uss.html',encoding='utf-8').read()
def rep(a,b):
    global s
    assert a in s,'missing: '+a[:70]
    s=s.replace(a,b,1)
LOGO='<svg width="{w}" height="{w}" viewBox="0 0 100 100" aria-hidden="true"><rect x="18" y="10" width="64" height="80" rx="3" fill="none" stroke="#d9a35b" stroke-width="7"/><path d="M50 10v80" stroke="#d9a35b" stroke-width="6"/><path d="M42 44v12M58 44v12" stroke="#f3ece2" stroke-width="6" stroke-linecap="round"/><path d="M24 90v6M76 90v6" stroke="#d9a35b" stroke-width="6" stroke-linecap="round"/></svg>'
s=re.sub(r'<title>.*?</title>','<title>КОРПУС · мебель на заказ: заказы, конструкторы, подрядчики, склад, монтаж · демо</title>',s,count=1)
fav="<link rel=\"icon\" href=\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='14' fill='%232b2420'/><rect x='22' y='14' width='56' height='72' rx='3' fill='none' stroke='%23d9a35b' stroke-width='8'/><path d='M50 14v72' stroke='%23d9a35b' stroke-width='7'/><path d='M42 44v12M58 44v12' stroke='%23f3ece2' stroke-width='7' stroke-linecap='round'/></svg>\">"
s=re.sub(r'<link rel="icon"[^\n]*>',fav,s,count=1)
rep('family=JetBrains+Mono:wght@400;500;600;700&family=Golos+Text:wght@400;500;600;700;800&display=swap','family=Source+Code+Pro:wght@400;500;600&family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap')
s=s.replace("'Golos Text'","'Source Sans 3'").replace("'JetBrains Mono'","'Source Code Pro'")
root=''':root{
 --rail:#2b2420;--rail2:#221c19;--rail-h:#3a312b;--rail-a:#d9a35b;
 --brand:#8a5a2e;--brand2:#d9a35b;--brandl:#f5ece1;--steel:#8b96a3;
 --bg:#f3f0eb;--card:#fffdfa;--card2:#f8f5f0;--card3:#ebe5dc;
 --text:#231d18;--muted:#65594e;--muted2:#9a8e82;--line:#e4ddd3;--line2:#cfc5b8;
 --acc:#3f6f6a;--acc2:#a9c7c2;--accl:#e6f0ee;
 --ok:#3d7a3d;--ok-l:#e7f2e5;--bad:#b23a2b;--bad-l:#f8e6e2;--warn:#b57d14;--warn-l:#faf0dc;
 --info:#2f5d7a;--info-l:#e6eef4;--violet:#6a4f86;--violet-l:#f0ebf5;
 --r:4px;--sh:none;--sh2:0 14px 40px rgba(34,28,25,.22);
}'''
s=re.sub(r':root\{.*?\n\}',root,s,count=1,flags=re.S)
dark='''body.dark{
 --bg:#171310;--card:#1f1a16;--card2:#26201b;--card3:#332b24;
 --text:#efe7dd;--muted:#b0a395;--muted2:#7d7166;--line:#332b24;--line2:#463b32;
 --brandl:#33261a;--accl:#16262a;--violet-l:#231c2b;--ok-l:#16261a;--bad-l:#2e1814;--warn-l:#2e2410;--info-l:#14232d;--brand:#c88a52;
}'''
s=re.sub(r'body\.dark\{.*?\n\}',dark,s,count=1,flags=re.S)
rep('.gate h1 em{font-style:normal;color:#d8b25a}','.gate h1 em{font-style:normal;color:#d9a35b}')
g0=s.index('<section class="gate" id="gate">');g1=s.index('</section>',g0)+len('</section>')
gate=f'''<section class="gate" id="gate">
 <div class="gate-l">
  <div class="glogo">{LOGO.format(w=58)}
   <div><b class="gname">КОРПУС</b><small class="gsub">МЕБЕЛЬ НА ЗАКАЗ · АЛМАТЫ · ПРОИЗВОДСТВО И МОНТАЖ</small></div>
  </div>
  <h1>Заказ — от замера до акта в одной карточке.<br>Каждый видит свой этап и идёт по чек-листу.<br><em>Подрядчики, склад и деньги — в той же карточке, а не в восемнадцати таблицах.</em></h1>
  <span class="gtag">макет по встрече 3 октября и вашему ТЗ · всё кликается</span>
  <p style="margin-top:15px">Вы рассказали: 18 человек — 4 менеджера, 3 конструктора, 2 руководителя, 6 сборщиков. После договора заказ идёт к конструкторам, потом снабжение и подрядчики — малярка, металл, камень, стекло, алюминий, шпон, распил, — сборка в цеху и монтаж корпуса и фасадов. Сейчас это Битрикс, МойСклад и около восемнадцати Google-таблиц.</p>
  <p style="color:#d9a35b">Здесь — воронка с вашими этапами и шкалой готовности, конструкторская воронка с чек-листами, карточка, которая размножается на доски подрядчиков со сроками и сальдо, склад с ячейками и заявками, загрузка бригад и отпуска, рейсы водителя, WhatsApp в карточке, расчёт по вашей таблице, КП и договор с ЭЦП, приходы, расходы и зарплаты.</p>
  <div class="gstat">
   <div><small>Экранов</small><b class="a">33</b></div>
   <div><small>Ролей</small><b>9</b></div>
   <div><small>Подрядчиков</small><b>9</b></div>
   <div><small>Стоимость</small><b>2,2 млн ₸</b></div>
  </div>
 </div>
 <div class="gate-r">
  <div class="lform">
   <h2>Вход в систему</h2>
   <div class="lgn"><input placeholder="Логин" disabled><input placeholder="Пароль" type="password" disabled><button disabled>Войти</button></div>
   <p>В рабочей системе каждый входит по своему логину и сразу попадает в свою часть. Для показа — выберите роль:</p>
   <div class="roles" id="roles"></div>
   <div class="lnote"><b>Демо-макет на вымышленных данных</b>
    Название, клиенты, подрядчики, артикулы и суммы придуманы для примера; этапы и процессы — из встречи. Кнопка ▶ сверху — сценарий показа.</div>
  </div>
 </div>
</section>'''
s=s[:g0]+gate+s[g1:]
s=re.sub(r'<div class="rail-logo".*?</div>','<div class="rail-logo"></div>',s,count=1,flags=re.S)
rep('<h1 id="ttl">Реестр 01</h1>','<h1 id="ttl">Корпус</h1>')
rep('placeholder="объект, бригада, артикул, накладная, заявка, КП"','placeholder="заказ, клиент, артикул, ячейка"')
rep('''<button class="ab" id="addBtn" onclick="act('payreq-new')">+ ЗАЯВКА НА ОПЛАТУ</button>''','''<button class="ab" id="addBtn" onclick="card('newlead')">+ ЗАЯВКА</button>''')
rep('<script src="/app/uss.js"></script>','<script src="/app/mebel-vasiliy.js"></script>')
css=open(os.path.join(D,'style.css'),encoding='utf-8').read()
rep('</style>',css+'\n</style>')
open(ROOT+'/app/mebel-vasiliy.html','w',encoding='utf-8').write(s)
js=''.join(open(os.path.join(D,f'f{i}.js'),encoding='utf-8').read() for i in (1,2,3,4,6,5))
open(ROOT+'/app/mebel-vasiliy.js','w',encoding='utf-8').write(js)
print('ok',len(s),len(js))
# Автономная версия: один HTML без гейта, JS внутри, работает без сервера (шрифты — при наличии сети, иначе системные)
st=s.replace('<script src="/app/gate.js"></script>','',1)
st=st.replace('<script src="/app/mebel-vasiliy.js"></script>','<script>\n'+js.replace('</script>','<\\/script>')+'\n</script>',1)
assert '/app/' not in st, 'остались ссылки на /app/'
if 'noindex' not in st: st=st.replace('<head>','<head>\n<meta name="robots" content="noindex,nofollow">',1)
st=st.replace('<!doctype html>','<!doctype html>\n<!--\n  Автономная версия демо «КОРПУС · мебель на заказ».\n  Один файл: разметка, стили и вся логика внутри. Интернет не нужен —\n  шрифты подгружаются при наличии сети, иначе берутся системные.\n  Собирается из tools/sales-kit/projects/mebel-vasiliy (build.py), правки вносить туда.\n-->',1)
st=re.sub(r'<title>(.*?) · демо</title>',r'<title>\1 · демо (автономный файл)</title>',st,count=1)
open(ROOT+'/app/mebel-vasiliy-standalone.html','w',encoding='utf-8').write(st)
print('standalone ok',len(st))
