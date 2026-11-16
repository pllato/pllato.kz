/* ПАРТСМАРКЕТ — автозапчасти на легковые, 3 точки, Алматы (Берік). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='16.11.2026',NOW='16:40';
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>Из встречи</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const SEC=[
 {k:'sum',n:'Пульт',sub:[['dash','Пульт собственника'],['reports','Отчёты']]},
 {k:'cat',n:'Каталог',sub:[['catalog','Каталог запчастей'],['card','Карточка товара'],['xls','Переезд из Excel']]},
 {k:'sale',n:'Продажи',sub:[['pos','Продажа на точке'],['web','Заказы с сайта'],['clients','Клиенты'],['wa','WhatsApp'],['mgr','Менеджеры']]},
 {k:'wh',n:'Склад',sub:[['shelves','Склад по полкам'],['inb','Приходы'],['moves','Перемещения'],['inv','Инвентаризация'],['buy','Что заказать']]},
 {k:'fin',n:'Деньги',sub:[['money','Выручка и маржа']]},
 {k:'go',n:'Запуск',sub:[['site','Сайт-каталог'],['roles','Роли и права'],['launch','Стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'БА',n:'Берік',note:'Всё: продажи по точкам и менеджерам, склад, деньги, закупки',s:ALL.slice()},
 'Менеджер точки':{av:'МН',n:'Нурлан · менеджер, точка «Рыскулова»',note:'Каталог, продажа, заказы с сайта, клиенты, WhatsApp. Закупочные цены и деньги не видит',s:['catalog','card','pos','web','clients','wa']},
 'Кладовщик':{av:'КЛ',n:'Ерлан · склад',note:'Полки, приходы, перемещения, инвентаризация, сборка заказов',s:['shelves','inb','moves','inv','web','catalog','card']},
 'Бухгалтер':{av:'БХ',n:'Айгерим · бухгалтер',note:'Деньги, отчёты, приходы от поставщиков',s:['money','reports','inb','dash']}
};
let role='Собственник',cur='dash';
const PT=[{id:'R',n:'Рыскулова',c:'#d7261e'},{id:'S',n:'Сатпаева',c:'#22252a'},{id:'T',n:'Толе би',c:'#8a8f96'}];
const ptN=id=>(PT.find(p=>p.id===id)||PT[0]).n;
const MGR=[{id:'M1',n:'Нурлан',pt:'R',day:412000,week:2610000,mon:10840000,plan:12000000,chk:68},{id:'M2',n:'Айдос',pt:'R',day:286000,week:1930000,mon:8120000,plan:10000000,chk:51},{id:'M3',n:'Ринат',pt:'S',day:358000,week:2240000,mon:9460000,plan:10000000,chk:59},{id:'M4',n:'Санжар',pt:'T',day:197000,week:1480000,mon:6370000,plan:9000000,chk:44}];
/* запчасти: art — артикул, oem, марка/модель/годы, цены, остатки по точкам, полка, аналоги */
let SKU=[
 {id:'P1',n:'Колодки тормозные передние',br:'Akebono',art:'AN-746WK',oem:'04465-33471',car:'Toyota Camry 50/55',yr:'2011–2017',buy:11800,ret:18500,opt:16200,q:{R:6,S:3,T:0},cell:'R-A-03-2',min:4,an:['P2']},
 {id:'P2',n:'Колодки тормозные передние',br:'Kashiyama',art:'D2276',oem:'04465-33471',car:'Toyota Camry 50/55',yr:'2011–2017',buy:7600,ret:12900,opt:11200,q:{R:10,S:5,T:4},cell:'R-A-03-3',min:4,an:['P1']},
 {id:'P3',n:'Фильтр масляный',br:'Toyota',art:'90915-YZZE1',oem:'90915-YZZE1',car:'Toyota / Lexus',yr:'2005–2023',buy:2100,ret:3900,opt:3300,q:{R:48,S:30,T:22},cell:'R-B-01-1',min:20,an:['P4']},
 {id:'P4',n:'Фильтр масляный',br:'Mann',art:'W 68/3',oem:'90915-YZZE1',car:'Toyota / Lexus',yr:'2005–2023',buy:1500,ret:2900,opt:2500,q:{R:36,S:12,T:9},cell:'R-B-01-2',min:20,an:['P3']},
 {id:'P5',n:'Амортизатор передний правый',br:'KYB',art:'339023',oem:'54661-2S100',car:'Hyundai Tucson / Kia Sportage',yr:'2010–2015',buy:24500,ret:36900,opt:33000,q:{R:2,S:1,T:0},cell:'R-C-07-1',min:2,an:[]},
 {id:'P6',n:'Свеча зажигания иридиевая',br:'NGK',art:'ILKAR7B11',oem:'90919-01253',car:'Toyota / Hyundai / Kia',yr:'2008–2022',buy:3900,ret:6400,opt:5600,q:{R:64,S:40,T:28},cell:'R-B-04-2',min:24,an:['P7']},
 {id:'P7',n:'Свеча зажигания иридиевая',br:'Denso',art:'FK20HBR11',oem:'90919-01253',car:'Toyota / Hyundai / Kia',yr:'2008–2022',buy:4100,ret:6600,opt:5800,q:{R:12,S:8,T:16},cell:'R-B-04-3',min:24,an:['P6']},
 {id:'P8',n:'Ремень ГРМ, комплект',br:'Gates',art:'K015603XS',oem:'24312-23500',car:'Hyundai Elantra / Kia Cerato',yr:'2006–2016',buy:28700,ret:42500,opt:38900,q:{R:3,S:2,T:1},cell:'R-C-02-1',min:2,an:[]},
 {id:'P9',n:'Фара передняя левая',br:'Depo',art:'212-11V4L',oem:'92101-2W000',car:'Hyundai Santa Fe',yr:'2012–2018',buy:61000,ret:89000,opt:81000,q:{R:1,S:0,T:1},cell:'R-D-01-1',min:1,an:[]},
 {id:'P10',n:'Радиатор охлаждения',br:'Nissens',art:'646888',oem:'25310-2S500',car:'Hyundai Tucson / ix35',yr:'2010–2015',buy:46200,ret:68500,opt:62000,q:{R:2,S:1,T:0},cell:'R-D-03-2',min:2,an:[]},
 {id:'P11',n:'Ступица задняя в сборе',br:'SKF',art:'VKBA 6881',oem:'42410-06030',car:'Toyota Camry 40/50',yr:'2006–2017',buy:31800,ret:47900,opt:43500,q:{R:0,S:2,T:1},cell:'S-A-05-1',min:2,an:[]},
 {id:'P12',n:'Масло моторное 5W-30, 4 л',br:'Mobil',art:'152560',oem:'—',car:'Универсальное',yr:'—',buy:17900,ret:24900,opt:22800,q:{R:40,S:26,T:18},cell:'R-E-01-1',min:20,an:[]},
 {id:'P13',n:'Рычаг передний нижний левый',br:'CTR',art:'CQKK-31L',oem:'54500-2S000',car:'Hyundai Tucson / Kia Sportage',yr:'2010–2015',buy:16400,ret:25900,opt:23000,q:{R:4,S:2,T:3},cell:'R-C-05-2',min:2,an:[]},
 {id:'P14',n:'Фильтр салонный угольный',br:'Bosch',art:'1 987 432 597',oem:'87139-07010',car:'Toyota / Lexus',yr:'2004–2020',buy:3400,ret:5900,opt:5100,q:{R:22,S:3,T:2},cell:'R-B-02-1',min:10,an:[]},
 {id:'P15',n:'Датчик ABS передний',br:'Mobiletron',art:'AB-JP016',oem:'89542-33090',car:'Toyota Camry 40',yr:'2006–2011',buy:9800,ret:15900,opt:14200,q:{R:1,S:0,T:0},cell:'R-D-06-1',min:2,an:[]},
 {id:'P16',n:'Лампа LED H7, комплект',br:'Philips',art:'11972U2500CX',oem:'—',car:'Универсальная',yr:'—',buy:21000,ret:32900,opt:29500,q:{R:8,S:6,T:5},cell:'S-E-02-1',min:4,an:[]}
];
const SK=id=>SKU.find(s=>s.id===id)||SKU[0];
const totQ=s=>s.q.R+s.q.S+s.q.T;
const MARK_BR=['Toyota','Lexus','Hyundai','Kia','Nissan','Mitsubishi','Chevrolet','Haval','Volkswagen','Mercedes'];
let CL=[
 {id:'C1',n:'СТО «Гараж 77»',t:'СТО',ph:'+7 701 555 12 40',disc:10,sum:4280000,last:'16.11',ord:62},
 {id:'C2',n:'Мастер Тимур (ходовая)',t:'Мастер',ph:'+7 707 321 88 10',disc:7,sum:1940000,last:'15.11',ord:38},
 {id:'C3',n:'Асхат Б., Camry 55',t:'Частник',ph:'+7 777 410 22 35',disc:0,sum:186000,last:'16.11',ord:4},
 {id:'C4',n:'Автосервис «Кайрат»',t:'СТО',ph:'+7 705 600 41 77',disc:10,sum:3120000,last:'14.11',ord:47},
 {id:'C5',n:'Дана К., Tucson',t:'Частник',ph:'+7 747 228 90 11',disc:0,sum:74000,last:'12.11',ord:2},
 {id:'C6',n:'Мастер Олжас (электрика)',t:'Мастер',ph:'+7 702 819 03 56',disc:5,sum:860000,last:'11.11',ord:19}
];
let SALES=[
 {id:'ЧК-10482',t:'16:31',pt:'R',m:'M1',cl:'C1',lines:[['P2',2],['P3',4]],pay:'Kaspi'},
 {id:'ЧК-10481',t:'16:12',pt:'S',m:'M3',cl:'C3',lines:[['P6',4]],pay:'наличные'},
 {id:'ЧК-10480',t:'15:48',pt:'R',m:'M2',cl:'C2',lines:[['P13',1],['P5',1]],pay:'Kaspi'},
 {id:'ЧК-10479',t:'15:20',pt:'T',m:'M4',cl:'C5',lines:[['P10',1]],pay:'Kaspi'},
 {id:'ЧК-10478',t:'14:55',pt:'S',m:'M3',cl:'C4',lines:[['P12',3],['P4',3]],pay:'перевод'}
];
let WEB=[
 {id:'С-2291',d:'16.11 16:05',cl:'Ерболат, Sportage 2013',ph:'+7 701 990 14 22',lines:[['P13',2],['P5',1]],st:'new',dl:'самовывоз · Рыскулова'},
 {id:'С-2290',d:'16.11 14:40',cl:'Марина, Camry 2015',ph:'+7 777 301 55 70',lines:[['P1',1],['P14',1]],st:'pick',dl:'доставка · Алмалинский р-н'},
 {id:'С-2289',d:'16.11 11:12',cl:'СТО «Гараж 77»',ph:'+7 701 555 12 40',lines:[['P3',10],['P6',8]],st:'ready',dl:'самовывоз · Рыскулова'},
 {id:'С-2288',d:'15.11 19:30',cl:'Нуржан, Elantra 2012',ph:'+7 705 117 40 09',lines:[['P8',1]],st:'done',dl:'доставка · Бостандыкский р-н'}
];
const WST=[['new','Новый'],['pick','Собирается'],['ready','Готов к выдаче'],['done','Выдан']];
let INB=[
 {id:'ПР-618',sup:'ТОО «Japan Parts KZ»',d:'16.11',pt:'R',lines:[['P1',6],['P15',4]],st:'ждёт приёмки'},
 {id:'ПР-617',sup:'ИП «Корея Авто Опт»',d:'15.11',pt:'S',lines:[['P13',6],['P5',2]],st:'принят'},
 {id:'ПР-616',sup:'ТОО «Евро Детали»',d:'14.11',pt:'R',lines:[['P4',30],['P14',20]],st:'принят'}
];
let MOV=[
 {id:'ПМ-208',from:'R',to:'T',lines:[['P3',10],['P6',12]],st:'в пути',d:'16.11'},
 {id:'ПМ-207',from:'S',to:'R',lines:[['P11',1]],st:'принят',d:'15.11'}
];
let REV=[{d:'31.10',pt:'R',pos:1012,diff:9,sum:-46800},{d:'30.09',pt:'R',pos:984,diff:14,sum:-71200}];
let REVRUN=null;
let CART={};
let POSCART={P2:2,P3:4},POSCL='C1',POSPAY='Kaspi';
let VAR=1;
let CAT_Q='',CAT_BR='',CAT_IN=false;
const EXP=[['Аренда трёх точек',1350000],['Зарплата менеджеров и склада',2640000],['Реклама (таргет, 2ГИС)',420000],['Доставка и такси',190000],['Связь и сервисы',85000],['Прочее',140000]];
const SC={};
const lineSum=(lines,f)=>lines.reduce((a,l)=>a+SK(l[0])[f||'ret']*l[1],0);
const CLN=id=>(CL.find(c=>c.id===id)||{n:'—'}).n;
const MN=id=>(MGR.find(m=>m.id===id)||{n:'—'}).n;
let CARD='P1';
/* ===== Пульт ===== */
SC.dash=()=>{const day=MGR.reduce((a,m)=>a+m.day,0),wk=MGR.reduce((a,m)=>a+m.week,0),mon=MGR.reduce((a,m)=>a+m.mon,0);const val=SKU.reduce((a,s)=>a+totQ(s)*s.buy,0);const low=SKU.filter(s=>totQ(s)<s.min*1.5);const nw=WEB.filter(w=>w.st==='new').length;
return `<div class="hd"><div><h2>Пульт собственника · ${TODAY}, ${NOW}</h2><p>Три точки и четыре менеджера на одном экране: продажи сегодня, за неделю и месяц, деньги, остатки и что пора заказать. Excel больше не нужен.</p></div><div class="btns"><button class="bt" onclick="xls()">Excel</button><button class="bt p" onclick="go('pos')">Продажа</button></div></div>
${said('Делали amoCRM весной — как началось, так и осталось. Склад сделали в Excel, но сложно.','Здесь всё в одной системе: склад, продажи, сайт и деньги.')}
<div class="strip"><div><small>Продажи сегодня</small><b>${tg(day)}</b><span>${SALES.length + 27} чеков · 3 точки</span></div><div><small>За неделю</small><b>${tg(wk)}</b><span>+8% к прошлой</span></div><div><small>За месяц</small><b>${tg(mon)}</b><span>план ${tg(41000000)}</span></div><div><small>Маржа месяца</small><b class="ok">${tg(mon*0.34)}</b><span>34% от продаж</span></div><div><small>Товар на складах</small><b>${tg(val*62)}</b><span>≈ 1 000 позиций · по закупу</span></div></div>
<div class="g21"><div>
 <div class="pan"><h3>Точки сегодня</h3><div class="tw"><table class="t"><thead><tr><th>Точка</th><th class="r">Сегодня</th><th class="r">Неделя</th><th class="r">Месяц</th><th style="width:22%">К плану месяца</th></tr></thead><tbody>${PT.map(p=>{const ms=MGR.filter(m=>m.pt===p.id);const d=ms.reduce((a,m)=>a+m.day,0),w=ms.reduce((a,m)=>a+m.week,0),mo=ms.reduce((a,m)=>a+m.mon,0),pl=ms.reduce((a,m)=>a+m.plan,0);return `<tr onclick="go('mgr')"><td><i class="tm" style="background:${p.c}"></i><b>${p.n}</b></td><td class="r">${tg(d)}</td><td class="r">${tg(w)}</td><td class="r">${tg(mo)}</td><td>${bar(pct(mo,pl),pct(mo,pl)<75?'r':'g')}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Менеджеры сегодня</h3><div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th>Точка</th><th class="r">Сегодня</th><th class="r">Месяц</th><th class="r">План</th><th class="r">Чеков за месяц</th></tr></thead><tbody>${MGR.map(m=>`<tr onclick="go('mgr')"><td><b>${m.n}</b></td><td>${ptN(m.pt)}</td><td class="r">${tg(m.day)}</td><td class="r">${tg(m.mon)}</td><td class="r ${pct(m.mon,m.plan)<75?'bad':''}">${pct(m.mon,m.plan)}%</td><td class="r">${m.chk*7}</td></tr>`).join('')}</tbody></table></div></div>
</div><div>
 <div class="pan"><h3>Требует внимания</h3><div class="alist">
  <a onclick="go('web')"><i class="dt w"></i><b>${nw} новый заказ с сайта</b><span>собрать на точке Рыскулова</span></a>
  <a onclick="go('buy')"><i class="dt r"></i><b>Заканчиваются позиции: ${low.length}</b><span>колодки, датчики, ступицы — пора заказать</span></a>
  <a onclick="go('inb')"><i class="dt i"></i><b>Приход ПР-618 ждёт приёмки</b><span>Japan Parts KZ · колодки и датчики ABS</span></a>
  <a onclick="go('moves')"><i class="dt w"></i><b>Перемещение ПМ-208 в пути</b><span>Рыскулова → Толе би</span></a>
  <a onclick="go('mgr')"><i class="dt r"></i><b>Санжар — 71% к плану месяца</b><span>точка Толе би</span></a>
 </div></div>
 <div class="pan"><h3>Последние продажи</h3><div class="tw"><table class="t sm"><thead><tr><th>Чек</th><th>Точка</th><th>Менеджер</th><th class="r">Сумма</th></tr></thead><tbody>${SALES.slice(0,5).map(s=>`<tr onclick="go('pos')"><td class="mono">${s.id} · ${s.t}</td><td>${ptN(s.pt)}</td><td>${MN(s.m)}</td><td class="r">${tg(lineSum(s.lines))}</td></tr>`).join('')}</tbody></table></div></div>
</div></div>`};
/* ===== Каталог ===== */
function catMatch(s){const q=CAT_Q.toLowerCase().trim();if(CAT_BR&&s.car.indexOf(CAT_BR)<0)return false;if(CAT_IN&&totQ(s)===0)return false;if(!q)return true;return (s.n+' '+s.br+' '+s.art+' '+s.oem+' '+s.car).toLowerCase().includes(q)}
SC.catalog=()=>{const L=SKU.filter(catMatch);const own=role==='Собственник'||role==='Бухгалтер';
return `<div class="hd"><div><h2>Каталог запчастей</h2><p>Поиск по артикулу, OEM-номеру, марке и модели. Аналоги показываются рядом: если нужной нет, менеджер сразу предложит замену.</p></div><div class="btns"><button class="bt" onclick="go('xls')">Загрузить из Excel</button></div></div>
<div class="pan"><div class="btns l" style="flex-wrap:wrap;gap:8px"><input class="sel" style="min-width:260px" placeholder="Например: 04465-33471, колодки, Camry" value="${esc(CAT_Q)}" oninput="CAT_Q=this.value" onkeydown="if(event.key==='Enter')render()"><button class="bt p" onclick="render()">Найти</button>
<select class="sel" onchange="CAT_BR=this.value;render()"><option value="">Все марки</option>${MARK_BR.map(b=>`<option ${CAT_BR===b?'selected':''}>${b}</option>`).join('')}</select>
<button class="bt ${CAT_IN?'p':''}" onclick="CAT_IN=!CAT_IN;render()">Только в наличии</button>${CAT_Q||CAT_BR||CAT_IN?`<button class="bt" onclick="CAT_Q='';CAT_BR='';CAT_IN=false;render()">Сбросить</button>`:''}</div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Запчасть</th><th>Бренд · артикул</th><th>OEM</th><th>Авто</th><th class="r">Розница</th>${own?'<th class="r">Закуп</th>':''}${PT.map(p=>`<th class="r">${p.n}</th>`).join('')}<th>Аналоги</th></tr></thead><tbody>${L.length?L.map(s=>`<tr onclick="CARD='${s.id}';go('card')"><td><b>${esc(s.n)}</b></td><td>${esc(s.br)} · <span class="mono">${esc(s.art)}</span></td><td class="mono">${esc(s.oem)}</td><td>${esc(s.car)}<br><span class="mini">${s.yr}</span></td><td class="r">${tg(s.ret)}</td>${own?`<td class="r">${tg(s.buy)}</td>`:''}${PT.map(p=>`<td class="r ${s.q[p.id]===0?'bad':''}">${s.q[p.id]}</td>`).join('')}<td>${s.an.length?s.an.map(a=>tag(SK(a).br,'g')).join(' '):'<span class="mini">—</span>'}</td></tr>`).join(''):`<tr><td colspan="10">Ничего не нашли. Попробуйте «колодки», «90915» или «Tucson».</td></tr>`}</tbody></table></div><p class="mini">В демо ${SKU.length} позиций. После переезда из Excel здесь будут все ~1 000.</p></div>`};
SC.card=()=>{const s=SK(CARD);const own=role==='Собственник'||role==='Бухгалтер';
return `<div class="hd"><div><h2>${esc(s.n)} · ${esc(s.br)}</h2><p>Артикул <span class="mono">${esc(s.art)}</span> · OEM <span class="mono">${esc(s.oem)}</span> · полка <span class="mono">${s.cell}</span></p></div><div class="btns"><button class="bt" onclick="go('catalog')">← Каталог</button><button class="bt p" onclick="posAdd('${s.id}');go('pos')">Продать</button></div></div>
<div class="g2"><div class="pan"><h3>Остатки по точкам</h3>${PT.map(p=>`<div class="kv"><span>${p.n}</span><b class="${s.q[p.id]===0?'bad':''}">${s.q[p.id]} шт</b></div>`).join('')}<div class="kv tot"><span>Всего</span><b>${totQ(s)} шт</b></div><div class="kv"><span>Минимальный остаток</span><b>${s.min} шт</b></div>${s.q.T===0&&s.q.R>2?`<button class="bt p full" onclick="newMove('${s.id}')">Переместить 2 шт с Рыскулова на Толе би</button>`:''}</div>
<div class="pan"><h3>Цены</h3><div class="kv"><span>Розница</span><b>${tg(s.ret)}</b></div><div class="kv"><span>Опт (СТО, мастера)</span><b>${tg(s.opt)}</b></div>${own?`<div class="kv"><span>Закуп</span><b>${tg(s.buy)}</b></div><div class="kv"><span>Наценка</span><b class="ok">${pct(s.ret-s.buy,s.buy)}%</b></div>`:`<p class="mini">Закупочную цену менеджер не видит.</p>`}</div></div>
<div class="g2"><div class="pan"><h3>Подходит на</h3><div class="kv"><span>${esc(s.car)}</span><b>${s.yr}</b></div><p class="mini">Совместимость по OEM-номеру. Клиент на сайте ищет по своей машине и видит только то, что подходит.</p></div>
<div class="pan"><h3>Аналоги</h3>${s.an.length?s.an.map(a=>{const x=SK(a);return `<div class="kv"><span>${esc(x.br)} · ${esc(x.art)} · ${totQ(x)} шт</span><b><a onclick="CARD='${x.id}';render()">${tg(x.ret)} →</a></b></div>`}).join(''):'<p class="mini">Аналогов в базе нет — можно добавить кросс-номер.</p>'}</div></div>`};
function newMove(id){MOV.unshift({id:'ПМ-'+(209+MOV.length),from:'R',to:'T',lines:[[id,2]],st:'в пути',d:'16.11'});SK(id).q.R-=2;toast('Перемещение создано: 2 шт с Рыскулова на Толе би. Кладовщик увидит задачу.');go('moves')}
SC.xls=()=>`<div class="hd"><div><h2>Переезд из Excel</h2><p>Берём ваш Excel как есть: товары, артикулы, цены, остатки по точкам. Сопоставляем колонки один раз — и всё в системе. Ничего заново не вбиваете.</p></div></div>
${said('Сейчас всё в Excel. Около тысячи наименований.','Загружаем ваш файл за один день, проверяем вместе с вами.')}
<div class="g2"><div class="pan"><h3>Ваш файл → система</h3><div class="tw"><table class="t sm"><thead><tr><th>Колонка в Excel</th><th>Поле в системе</th></tr></thead><tbody>${[['Наименование','Запчасть'],['Артикул','Артикул'],['Номер оригинала','OEM'],['Марка / модель','Совместимость'],['Цена прихода','Закуп'],['Цена','Розница'],['Остаток Рыскулова','Остаток · Рыскулова'],['Остаток Сатпаева','Остаток · Сатпаева'],['Остаток Толе би','Остаток · Толе би']].map(r=>`<tr><td>${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join('')}</tbody></table></div></div>
<div class="pan"><h3>Результат проверки</h3><div class="kv"><span>Строк в файле</span><b>1 038</b></div><div class="kv"><span>Загружено</span><b class="ok">1 017</b></div><div class="kv"><span>Дубли артикула — объединить</span><b class="bad">14</b></div><div class="kv"><span>Без цены — заполнить</span><b class="bad">7</b></div><button class="bt p full" onclick="toast('Загрузка подтверждена: 1 017 позиций в каталоге. 21 строку покажем отдельным списком.')">Подтвердить загрузку</button></div></div>`;
/* ===== Продажа на точке ===== */
function posAdd(id){POSCART[id]=(POSCART[id]||0)+1}
function posSum(){const c=CL.find(x=>x.id===POSCL);const d=c?c.disc:0;const sub=Object.entries(POSCART).reduce((a,[id,q])=>a+(d?SK(id).opt:SK(id).ret)*q,0);return sub}
SC.pos=()=>{const items=Object.entries(POSCART).filter(x=>x[1]>0);const c=CL.find(x=>x.id===POSCL);
return `<div class="hd"><div><h2>Продажа на точке · Рыскулова</h2><p>Нашли запчасть — добавили — выбрали клиента и оплату. Чек за минуту, остаток списывается сам, продажа сразу видна собственнику.</p></div></div>
<div class="g21"><div><div class="pan"><h3>Быстрый подбор</h3><div class="tw"><table class="t sm"><thead><tr><th>Запчасть</th><th>Артикул</th><th class="r">Цена</th><th class="r">На точке</th><th></th></tr></thead><tbody>${SKU.slice(0,10).map(s=>`<tr><td>${esc(s.n)} · ${esc(s.br)}</td><td class="mono">${esc(s.art)}</td><td class="r">${tg(s.ret)}</td><td class="r ${s.q.R===0?'bad':''}">${s.q.R}</td><td><button class="bt sm p" onclick="posAdd('${s.id}');render()">+</button></td></tr>`).join('')}</tbody></table></div></div></div>
<div><div class="pan"><h3>Чек</h3><select class="sel" style="width:100%" onchange="POSCL=this.value;render()">${CL.map(x=>`<option value="${x.id}" ${x.id===POSCL?'selected':''}>${esc(x.n)}${x.disc?' · опт':''}</option>`).join('')}</select>
${items.length?items.map(([id,q])=>`<div class="kv"><span>${esc(SK(id).n)} · ${esc(SK(id).br)} × ${q}</span><b>${tg((c&&c.disc?SK(id).opt:SK(id).ret)*q)}</b></div>`).join(''):'<p class="mini">Добавьте запчасти слева.</p>'}
<div class="kv tot"><span>Итого${c&&c.disc?' (оптовая цена)':''}</span><b>${tg(posSum())}</b></div>
<div class="zseg">${['Kaspi','наличные','перевод'].map(p=>`<button class="${POSPAY===p?'on':''}" onclick="POSPAY='${p}';render()">${p}</button>`).join('')}</div>
<button class="bt p full" onclick="posClose()">Пробить чек</button></div></div></div>`};
function posClose(){const items=Object.entries(POSCART).filter(x=>x[1]>0);if(!items.length){toast('Чек пустой — добавьте запчасть.');return}const id='ЧК-'+(10483+SALES.length-5);SALES.unshift({id,t:NOW,pt:'R',m:'M1',cl:POSCL,lines:items.map(x=>[x[0],x[1]]),pay:POSPAY});items.forEach(([s,q])=>SK(s).q.R=Math.max(0,SK(s).q.R-q));const sum=posSum();MGR[0].day+=sum;POSCART={};render();toast(`Чек <b>${id}</b> пробит: ${tg(sum)}, ${POSPAY}. Остаток на точке списан, собственник видит продажу.`)}
/* ===== Заказы с сайта ===== */
SC.web=()=>`<div class="hd"><div><h2>Заказы с сайта</h2><p>Клиент выбрал запчасти на сайте — заказ сам появился здесь. Менеджер подтверждает, кладовщик собирает, клиент забирает или получает доставкой.</p></div><div class="btns"><button class="bt" onclick="go('site')">Как это видит клиент</button></div></div>
<div class="kanban k4">${WST.map(([k,n])=>`<div class="kcol"><div class="kh"><b>${n}</b><span>${WEB.filter(w=>w.st===k).length}</span></div>${WEB.filter(w=>w.st===k).map(w=>`<div class="kc"><code>${w.id} · ${w.d}</code><b>${esc(w.cl)}</b><span>${w.lines.map(l=>esc(SK(l[0]).n.split(' ')[0])+' × '+l[1]).join(', ')}</span><em>${tg(lineSum(w.lines))}</em><span>${esc(w.dl)}</span>${k!=='done'?`<button class="bt sm p" onclick="webNext('${w.id}')">${k==='new'?'Подтвердить':k==='pick'?'Собрано':'Выдать'}</button>`:''}</div>`).join('')||'<div class="kempty">пусто</div>'}</div>`).join('')}</div>`;
function webNext(id){const w=WEB.find(x=>x.id===id);const i=WST.findIndex(s=>s[0]===w.st);w.st=WST[i+1][0];render();toast(w.st==='pick'?'Заказ подтверждён, кладовщик видит, что собрать.':w.st==='ready'?'Собрано. Клиенту ушло сообщение в WhatsApp: «Заказ готов».':'Заказ выдан, остаток списан, продажа в отчёте.')}
/* ===== Клиенты ===== */
SC.clients=()=>`<div class="hd"><div><h2>Клиенты</h2><p>СТО, мастера и частники: история покупок, скидка, долг. Постоянным СТО и мастерам — оптовая цена автоматически.</p></div><div class="btns"><button class="bt p" onclick="CL.unshift({id:'C'+(CL.length+1),n:'Новый клиент',t:'Частник',ph:'+7 ___',disc:0,sum:0,last:'16.11',ord:0});render();toast('Клиент добавлен.')">+ Клиент</button></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Тип</th><th>Телефон</th><th class="r">Скидка</th><th class="r">Покупок</th><th class="r">Всего</th><th>Последняя</th></tr></thead><tbody>${CL.map(c=>`<tr onclick="openCl('${c.id}')"><td><b>${esc(c.n)}</b></td><td>${tag(c.t,c.t==='СТО'?'g':c.t==='Мастер'?'w':'')}</td><td class="mono">${c.ph}</td><td class="r">${c.disc}%</td><td class="r">${c.ord}</td><td class="r">${tg(c.sum)}</td><td>${c.last}</td></tr>`).join('')}</tbody></table></div></div>`;
function openCl(id){const c=CL.find(x=>x.id===id);const s=SALES.filter(x=>x.cl===id);openM(esc(c.n),c.t+' · '+c.ph,`<div class="kv"><span>Скидка</span><b>${c.disc}%</b></div><div class="kv"><span>Покупок всего</span><b>${c.ord} · ${tg(c.sum)}</b></div>${s.map(x=>`<div class="kv"><span>${x.id} · ${ptN(x.pt)} · ${x.lines.map(l=>esc(SK(l[0]).n.split(' ')[0])).join(', ')}</span><b>${tg(lineSum(x.lines))}</b></div>`).join('')||'<p class="mini">Сегодня покупок нет.</p>'}`)}
/* ===== WhatsApp ===== */
let WAQ=0;
const WA=[
 {n:'Ерболат, Sportage 2013',ph:'+7 701 990 14 22',last:'Есть передние рычаги на Спортейдж 2013?',t:'16:02',m:[['c','Есть передние рычаги на Спортейдж 2013?'],['o','Да, CTR, левый и правый по 25 900 ₸. Оформить на самовывоз с Рыскулова?'],['c','Да, оба и амортизатор правый']]},
 {n:'СТО «Гараж 77»',ph:'+7 701 555 12 40',last:'Нужно 10 фильтров Toyota и 8 свечей',t:'11:05',m:[['c','Нужно 10 фильтров Toyota и 8 свечей'],['o','Собираем, через час можно забирать. Цена оптовая.']]},
 {n:'Асхат, Camry 55',ph:'+7 777 410 22 35',last:'Колодки Akebono есть?',t:'10:40',m:[['c','Колодки Akebono есть?'],['o','На Рыскулова 6 шт, 18 500 ₸. Есть аналог Kashiyama за 12 900 ₸.']]}
];
SC.wa=()=>{const c=WA[WAQ];return `<div class="hd"><div><h2>WhatsApp</h2><p>Переписка с клиентами внутри системы: видно, кто что спрашивал, и из чата можно сразу сделать заказ. Если менеджер уйдёт — клиенты остаются у вас.</p></div></div>
<div class="g21"><div class="pan"><h3>${esc(c.n)} · <span class="mono">${c.ph}</span></h3>${c.m.map(x=>`<div class="kv"><span>${x[0]==='c'?'<b>Клиент:</b> ':'<b>Менеджер:</b> '}${esc(x[1])}</span><b class="mini">${c.t}</b></div>`).join('')}<div class="btns l" style="margin-top:8px"><button class="bt p" onclick="toast('Заказ из чата создан и передан на сборку.')">Создать заказ из чата</button><button class="bt" onclick="toast('Ответ отправлен с рабочего номера.')">Ответить</button></div></div>
<div class="pan"><h3>Диалоги</h3><div class="alist">${WA.map((x,i)=>`<a onclick="WAQ=${i};render()"><i class="dt ${i===WAQ?'r':'i'}"></i><b>${esc(x.n)}</b><span>${esc(x.last)} · ${x.t}</span></a>`).join('')}</div></div></div>`};
/* ===== Менеджеры ===== */
SC.mgr=()=>`<div class="hd"><div><h2>Менеджеры</h2><p>Продажи каждого из четырёх менеджеров: сегодня, неделя, месяц, план и средний чек. Видно, кто тянет точку, а кто нет.</p></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th>Точка</th><th class="r">Сегодня</th><th class="r">Неделя</th><th class="r">Месяц</th><th class="r">План</th><th style="width:18%"></th><th class="r">Средний чек</th></tr></thead><tbody>${MGR.map(m=>`<tr><td><b>${m.n}</b></td><td>${ptN(m.pt)}</td><td class="r">${tg(m.day)}</td><td class="r">${tg(m.week)}</td><td class="r">${tg(m.mon)}</td><td class="r">${tg(m.plan)}</td><td>${bar(pct(m.mon,m.plan),pct(m.mon,m.plan)<75?'r':'g')}</td><td class="r">${tg(m.mon/(m.chk*7))}</td></tr>`).join('')}</tbody></table></div></div>`;
/* ===== Склад ===== */
SC.shelves=()=>{const rows=['A','B','C','D','E'];return `<div class="hd"><div><h2>Склад по полкам · Рыскулова</h2><p>У каждой запчасти свой адрес: точка, стеллаж, полка, место. Новый продавец найдёт деталь без подсказок.</p></div></div>
${rows.map(r=>`<div class="pan"><h3>Стеллаж ${r}</h3><div class="cellg">${Array.from({length:8},(_,n)=>{const code='R-'+r+'-'+String(n+1).padStart(2,'0');const s=SKU.filter(x=>x.cell.startsWith(code));return s.length?s.map(x=>`<div class="cell" onclick="CARD='${x.id}';go('card')"><b>${x.cell}</b><span>${esc(x.n.split(' ').slice(0,2).join(' '))}</span><span>${x.q.R} шт</span></div>`).join(''):`<div class="cell free"><b>${code}</b><span>свободно</span></div>`}).join('')}</div></div>`).join('')}`};
SC.inb=()=>`<div class="hd"><div><h2>Приходы от поставщиков</h2><p>Пришёл товар — кладовщик принимает по списку, остатки растут сами, долг поставщику фиксируется.</p></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Приход</th><th>Поставщик</th><th>Дата</th><th>Точка</th><th>Позиции</th><th class="r">Сумма закупа</th><th>Статус</th><th></th></tr></thead><tbody>${INB.map((p,k)=>`<tr><td class="mono">${p.id}</td><td>${esc(p.sup)}</td><td>${p.d}</td><td>${ptN(p.pt)}</td><td>${p.lines.map(l=>esc(SK(l[0]).n.split(' ')[0])+' × '+l[1]).join(', ')}</td><td class="r">${tg(lineSum(p.lines,'buy'))}</td><td>${tag(p.st,p.st==='принят'?'g':'w')}</td><td>${p.st!=='принят'?`<button class="bt sm p" onclick="acceptInb(${k})">Принять</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>`;
function acceptInb(k){const p=INB[k];p.st='принят';p.lines.forEach(l=>SK(l[0]).q[p.pt]+=l[1]);render();toast('Приход принят, остатки обновлены на точке '+ptN(p.pt)+'.')}
SC.moves=()=>`<div class="hd"><div><h2>Перемещения между точками</h2><p>На Толе би нет детали, а на Рыскулова есть — перемещение в два клика, остатки меняются у обеих точек.</p></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Откуда</th><th>Куда</th><th>Что</th><th>Дата</th><th>Статус</th><th></th></tr></thead><tbody>${MOV.map((m,k)=>`<tr><td class="mono">${m.id}</td><td>${ptN(m.from)}</td><td>${ptN(m.to)}</td><td>${m.lines.map(l=>esc(SK(l[0]).n.split(' ')[0])+' × '+l[1]).join(', ')}</td><td>${m.d}</td><td>${tag(m.st,m.st==='принят'?'g':'w')}</td><td>${m.st!=='принят'?`<button class="bt sm p" onclick="acceptMove(${k})">Принять</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
<div class="g2"><div class="pan"><h3>Как это работает</h3><div class="kv"><span>1. Менеджер видит в карточке, что на его точке 0</span><b>а на другой есть</b></div><div class="kv"><span>2. Создаёт перемещение</span><b>в два клика</b></div><div class="kv"><span>3. Кладовщик отправляет, точка принимает</span><b>остатки меняются сами</b></div></div><div class="pan"><h3>Остатки по точкам</h3>${PT.map(p=>`<div class="kv"><span>${p.n}</span><b>${fmt(SKU.reduce((a,s)=>a+s.q[p.id],0))} шт в демо</b></div>`).join('')}</div></div>`;
function acceptMove(k){const m=MOV[k];m.st='принят';m.lines.forEach(l=>SK(l[0]).q[m.to]+=l[1]);render();toast('Перемещение принято на точке '+ptN(m.to)+'.')}
SC.inv=()=>`<div class="hd"><div><h2>Инвентаризация</h2><p>Пересчёт по полкам: система показывает, сколько должно быть, кладовщик вводит факт. Разница сразу в деньгах.</p></div><div class="btns"><button class="bt p" onclick="startRev()">Начать пересчёт полки R-A-03</button></div></div>
${REVRUN?`<div class="pan"><h3>Идёт пересчёт · полка R-A-03</h3><div class="tw"><table class="t"><thead><tr><th>Запчасть</th><th class="r">Учёт</th><th class="r">Факт</th><th class="r">Разница</th><th></th></tr></thead><tbody>${REVRUN.map((r,k)=>`<tr><td>${esc(SK(r.s).n)} · ${esc(SK(r.s).br)}</td><td class="r">${r.book}</td><td class="r">${r.fact===null?'—':r.fact}</td><td class="r ${r.fact!==null&&r.fact!==r.book?'bad':''}">${r.fact===null?'':r.fact-r.book}</td><td>${r.fact===null?`<button class="bt sm p" onclick="revScan(${k})">Посчитано</button>`:''}</td></tr>`).join('')}</tbody></table></div>${REVRUN.every(r=>r.fact!==null)?`<button class="bt p" onclick="revClose()">Закрыть пересчёт</button>`:''}</div>`:''}
<div class="pan"><h3>История</h3><div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Точка</th><th class="r">Позиций</th><th class="r">Расхождений</th><th class="r">Сумма</th></tr></thead><tbody>${REV.map(r=>`<tr><td>${r.d}</td><td>${ptN(r.pt)}</td><td class="r">${r.pos}</td><td class="r">${r.diff}</td><td class="r ${r.sum<0?'bad':''}">${tg(r.sum)}</td></tr>`).join('')}</tbody></table></div></div>
<div class="pan"><h3>Два вида пересчёта</h3><div class="kv"><span>Быстрый: одна полка или одна группа (колодки, фильтры)</span><b>10–15 минут</b></div><div class="kv"><span>Полный: вся точка раз в месяц</span><b>акт с разницей в деньгах</b></div><div class="kv"><span>Кто посчитал и когда</span><b>видно в истории</b></div></div>`;
function startRev(){REVRUN=[{s:'P1',book:SK('P1').q.R,fact:null},{s:'P2',book:SK('P2').q.R,fact:null}];render()}
function revScan(k){const r=REVRUN[k];r.fact=k===1?r.book-1:r.book;render()}
function revClose(){const d=REVRUN.reduce((a,r)=>a+(r.fact-r.book)*SK(r.s).buy,0);REV.unshift({d:'16.11',pt:'R',pos:2,diff:REVRUN.filter(r=>r.fact!==r.book).length,sum:d});REVRUN.forEach(r=>SK(r.s).q.R=r.fact);REVRUN=null;render();toast('Пересчёт закрыт. Разница '+tg(d)+' — в отчёте собственника.')}
SC.buy=()=>{const L=SKU.filter(s=>totQ(s)<s.min*1.5).sort((a,b)=>totQ(a)/a.min-totQ(b)/b.min);return `<div class="hd"><div><h2>Что заказать у поставщиков</h2><p>Система сравнивает остаток с минимумом и подсказывает, что заканчивается. Заявку поставщику — одной кнопкой.</p></div><div class="btns"><button class="bt p" onclick="toast('Заявка поставщику сформирована: ${L.length} позиций. Можно отправить в WhatsApp или Excel.')">Сформировать заявку</button></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Запчасть</th><th>Бренд</th><th class="r">Всего</th><th class="r">Минимум</th><th class="r">Заказать</th><th class="r">Сумма закупа</th></tr></thead><tbody>${L.map(s=>{const z=Math.max(s.min*2-totQ(s),1);return `<tr><td>${esc(s.n)}</td><td>${esc(s.br)}</td><td class="r ${totQ(s)<s.min?'bad':''}">${totQ(s)}</td><td class="r">${s.min}</td><td class="r"><b>${z}</b></td><td class="r">${tg(z*s.buy)}</td></tr>`}).join('')}</tbody></table></div></div>
<div class="pan"><h3>Откуда цифры</h3><div class="kv"><span>Минимальный остаток задаёте вы для каждой запчасти</span><b>например, колодки — 4 шт</b></div><div class="kv"><span>Система считает остаток по всем 3 точкам</span><b>и подсказывает, сколько заказать</b></div><div class="kv"><span>Заявку можно отправить поставщику</span><b>WhatsApp или Excel</b></div></div>`};
/* ===== Деньги и отчёты ===== */
SC.money=()=>{const rev=34790000,cogs=rev*0.66,gp=rev-cogs,ex=EXP.reduce((a,e)=>a+e[1],0);return `<div class="hd"><div><h2>Выручка и маржа · ноябрь</h2><p>Сколько продали, сколько заработали на наценке, какие расходы и что осталось. Без отдельной программы.</p></div><div class="btns"><button class="bt" onclick="xls()">Excel</button></div></div>
<div class="strip"><div><small>Выручка</small><b>${tg(rev)}</b><span>3 точки + сайт</span></div><div><small>Закуп проданного</small><b>${tg(cogs)}</b><span>66%</span></div><div><small>Маржа</small><b class="ok">${tg(gp)}</b><span>34%</span></div><div><small>Расходы</small><b class="bad">${tg(ex)}</b><span>${EXP.length} статей</span></div><div><small>Прибыль</small><b class="ok">${tg(gp-ex)}</b><span>до налогов</span></div></div>
<div class="g2"><div class="pan"><h3>Выручка по точкам</h3>${PT.map(p=>{const v=MGR.filter(m=>m.pt===p.id).reduce((a,m)=>a+m.mon,0);return `<div class="kv"><span>${p.n}</span><b>${tg(v)}</b></div>`}).join('')}<div class="kv"><span>Сайт</span><b>${tg(1180000)}</b></div></div>
<div class="pan"><h3>Расходы</h3>${EXP.map(e=>`<div class="kv"><span>${e[0]}</span><b>${tg(e[1])}</b></div>`).join('')}</div></div>`};
SC.reports=()=>`<div class="hd"><div><h2>Отчёты</h2><p>Готовые отчёты на любой период: сегодня, неделя, месяц. Любой — в Excel.</p></div></div>
<div class="g2">${[['Продажи по точкам и менеджерам','каждый день, неделя, месяц'],['Что продаётся лучше всего','топ запчастей и брендов'],['Что лежит без движения','товар без продаж 60+ дней'],['Маржа по брендам','где зарабатываем больше'],['Долги клиентов СТО','кто и сколько должен'],['Остатки по точкам','в штуках и в деньгах']].map(r=>`<div class="pan"><h3>${r[0]}</h3><p class="mini">${r[1]}</p><button class="bt sm" onclick="xls()">Скачать Excel</button></div>`).join('')}</div>`;
/* ===== Сайт-каталог (вид клиента) ===== */
let SITECAR='Toyota Camry';
SC.site=()=>{const L=SKU.filter(s=>s.car.indexOf(SITECAR.split(' ')[1]||SITECAR)>=0||s.car.indexOf('Универс')>=0);const n=Object.values(CART).reduce((a,b)=>a+b,0);
return `<div class="hd"><div><h2>Сайт-каталог · вид клиента</h2><p>Новый сайт вместо старого: клиент выбирает свою машину, видит подходящие запчасти и цену, кладёт в корзину. Заказ сразу появляется у менеджера.</p></div></div>
<div class="g2"><div class="phw"><div class="phone3"><div class="phs"><div class="phtop"><b>ПартсМаркет</b><span>Корзина: ${n}</span></div>
<select class="sel" style="width:100%" onchange="SITECAR=this.value;render()">${['Toyota Camry','Hyundai Tucson','Kia Sportage','Hyundai Santa Fe'].map(c=>`<option ${SITECAR===c?'selected':''}>${c}</option>`).join('')}</select>
${L.slice(0,5).map(s=>`<div class="kv"><span>${esc(s.n)}<br><span class="mini">${esc(s.br)} · ${totQ(s)>0?'в наличии':'под заказ'}</span></span><b>${tg(s.ret)} <button class="bt sm p" onclick="CART['${s.id}']=(CART['${s.id}']||0)+1;render()">+</button></b></div>`).join('')}
<button class="bt p full" onclick="siteOrder()">Оформить заказ</button></div></div></div>
<div class="pan"><h3>Как это работает</h3><div class="kv"><span>1. Клиент выбирает марку и модель</span><b>поиск по авто</b></div><div class="kv"><span>2. Видит цену и наличие из системы</span><b>в реальном времени</b></div><div class="kv"><span>3. Корзина → оплата Kaspi или при получении</span><b>самовывоз / доставка</b></div><div class="kv"><span>4. Заказ падает менеджеру</span><b>«Заказы с сайта»</b></div>${said('Сайт купили, но там старые вещи, старая модель.','Делаем новый сайт, который берёт цены и остатки прямо из системы.')}</div></div>`};
function siteOrder(){const items=Object.entries(CART).filter(x=>x[1]>0);if(!items.length){toast('Корзина пустая — добавьте запчасть.');return}WEB.unshift({id:'С-'+(2292+WEB.length-4),d:'16.11 '+NOW,cl:'Клиент сайта, '+SITECAR,ph:'+7 7__ ___ __ __',lines:items.map(x=>[x[0],x[1]]),st:'new',dl:'самовывоз · Рыскулова'});CART={};toast('Заказ оформлен — он уже в разделе «Заказы с сайта».');go('web')}
/* ===== Роли и стоимость ===== */
SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>Каждый заходит под своим логином и видит только своё. Пользователей сколько угодно — без доплаты.</p></div></div>
<div class="pan"><div class="tw"><table class="t"><thead><tr><th>Роль</th><th>Что видит</th><th>Чего не видит</th></tr></thead><tbody>
<tr><td><b>Собственник</b></td><td>Всё: продажи, деньги, склад, закупки, менеджеры</td><td>—</td></tr>
<tr><td><b>Менеджер точки</b></td><td>Каталог, продажа, заказы с сайта, клиенты, WhatsApp</td><td>Закупочные цены, деньги, чужие продажи</td></tr>
<tr><td><b>Кладовщик</b></td><td>Полки, приходы, перемещения, инвентаризация, сборка</td><td>Деньги, клиенты</td></tr>
<tr><td><b>Бухгалтер</b></td><td>Деньги, отчёты, приходы</td><td>Чаты с клиентами</td></tr></tbody></table></div></div>`;
SC.launch=()=>{const t=VAR===1?3300000:2500000;return `<div class="hd"><div><h2>Стоимость</h2><p>Платите один раз. Без абонплаты, без ограничений по пользователям. Сервер и код — ваши.</p></div><div class="btns"><div class="zseg"><button class="${VAR===1?'on':''}" onclick="VAR=1;render()">Портал + сайт</button><button class="${VAR===2?'on':''}" onclick="VAR=2;render()">Только портал</button></div></div></div>
<div class="g2"><div class="pan price"><h3>Состав</h3><div class="kv"><span>Портал: каталог, склад по полкам, 3 точки, продажи, заказы, клиенты, WhatsApp, менеджеры, деньги, отчёты, переезд из Excel</span><b>2 500 000 ₸</b></div>${VAR===1?`<div class="kv"><span>Новый сайт-каталог с корзиной и связью с порталом</span><b>800 000 ₸</b></div>`:''}<div class="kv tot"><span>Итого</span><b>${tg(t)}</b></div><div class="kv"><span>1С</span><b>не нужна — всё внутри</b></div></div>
<div class="pan"><h3>Оплата 30 / 40 / 30</h3><div class="kv"><span>Старт</span><b>${tg(t*.3)}</b></div><div class="kv"><span>После приёмки базы</span><b>${tg(t*.4)}</b></div><div class="kv"><span>После сдачи</span><b>${tg(t*.3)}</b></div><div class="kv"><span>Срок</span><b>4–6 недель</b></div><div class="kv"><span>Поддержка</span><b>3 месяца включены</b></div></div></div>`};
/* ===== Каркас ===== */
function searchDemo(v){if(!v)return;CAT_Q=v;go('catalog')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><span>${s.n}</span></a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=`<h4>${esc(S.n)}</h4>`+S.sub.filter(x=>allowed(x[0])).map((x,i)=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><code>${String(i+1).padStart(2,'0')}</code>${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ПартсМаркет';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function xls(){const h=`<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>Запчасть</th><th>Бренд</th><th>Артикул</th><th>OEM</th>${PT.map(p=>`<th>${p.n}</th>`).join('')}<th>Розница</th></tr>${SKU.map(s=>`<tr><td>${esc(s.n)}</td><td>${esc(s.br)}</td><td>${esc(s.art)}</td><td>${esc(s.oem)}</td>${PT.map(p=>`<td>${s.q[p.id]}</td>`).join('')}<td>${s.ret}</td></tr>`).join('')}</table></body></html>`;try{const b=new Blob(['﻿'+h],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Остатки_'+TODAY+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}toast('Файл <b>Остатки.xls</b> скачан.')}
let theme='light';function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[['dash','1 · Пульт: продажи по точкам и менеджерам, деньги, что заказать.'],['catalog','2 · Каталог: артикул, OEM, марка, аналоги.'],['card','3 · Карточка: остатки по 3 точкам, цены, совместимость.'],['pos','4 · Продажа на точке за минуту.'],['site','5 · Новый сайт: клиент выбирает машину и кладёт в корзину.'],['web','6 · Заказ с сайта падает менеджеру.'],['shelves','7 · Склад по полкам: у каждой детали адрес.'],['buy','8 · Что заказать у поставщика.'],['money','9 · Выручка, маржа, расходы.'],['xls','10 · Переезд из Excel за день.'],['launch','11 · 2,5 млн портал + 0,8 млн сайт, оплата 30/40/30.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
