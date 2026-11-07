/* САПАР ГУРМЕ — производство питания длительного хранения (Есен). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const fmt1=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const tg=n=>fmt(n)+' ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='07.11.2026',NOW='15:20';
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>Из встречи</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const vbars=(arr,lab,yi)=>{const m=Math.max(...arr);return `<div class="vbars">${arr.map((v,i)=>`<div class="${yi&&yi.includes(i)?'y':''}" style="height:${Math.max(4,Math.round(v/m*100))}%"><em>${fmt(v)}</em></div>`).join('')}</div><div class="vlab">${lab.map(l=>`<span>${l}</span>`).join('')}</div>`};
const SEC=[
 {k:'sum',n:'Пульт',sub:[['dash','Пульт собственника'],['sales','Продажи и финансы'],['claude','Claude · аналитика на ТВ']]},
 {k:'raw',n:'Сырьё',sub:[['recv','Приёмка сканером'],['raw','Склад сырья'],['loss','Недостачи и потери']]},
 {k:'prod',n:'Производство',sub:[['tech','Техкарты из 1С'],['order','Заказ на смену и выдача'],['shift','Смена: выход и ужарка'],['scan','Сканеры в цехах'],['plan','План выпуска']]},
 {k:'wh',n:'Склад и отгрузка',sub:[['fg','Склад ГП · адреса'],['ship','Отгрузка магазинам'],['debts','Консигнация и долги'],['reps','Торговые представители']]},
 {k:'mp',n:'E-market',sub:[['mp','Маркетплейсы и цены']]},
 {k:'go',n:'Связи',sub:[['onec','Обмен с 1С'],['roles','Роли и права'],['launch','Стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'ЕС',n:'Есен',note:'Всё: сырьё, цех, склад, продажи, маркетплейсы, деньги, Claude',s:ALL.slice()},
 'Кладовщик':{av:'КЛ',n:'Бауыржан · склад',note:'Приёмка сканером, склад сырья, выдача в цех, склад ГП, отгрузка',s:['recv','raw','order','fg','ship','scan','loss']},
 'Технолог':{av:'ТХ',n:'Гульмира · начальник цеха',note:'Техкарты, заказ на смену, выход пакетов, ужарка, потери, план',s:['tech','order','shift','scan','loss','plan','raw']},
 'Бухгалтер':{av:'БХ',n:'Сауле · бухгалтер',note:'Приёмки к оплате, накладные, долги, обмен с 1С',s:['recv','ship','debts','onec','sales','loss']},
 'Менеджер e-market':{av:'ЕМ',n:'Дана · e-market',note:'Цены и остатки на Kaspi, Ozon, Wildberries и сайте',s:['mp','fg','sales']},
 'Торговый представитель':{av:'ТП',n:'Ерлан · торговый',note:'Свои магазины: заказы, консигнация, долги',s:['reps','debts','ship']}
};
let role='Собственник',cur='dash';
/* Сырьё */
let RAW=[
 {id:'С-01',n:'Говядина, лопатка охл.',u:'кг',q:1840,min:800,res:620,pr:3650,cell:'Х-1 · камера −2°'},
 {id:'С-02',n:'Баранина, корейка',u:'кг',q:310,min:200,res:180,pr:4200,cell:'Х-1 · камера −2°'},
 {id:'С-03',n:'Курица, бедро б/к',u:'кг',q:960,min:400,res:240,pr:1750,cell:'Х-2 · камера −2°'},
 {id:'С-04',n:'Картофель',u:'кг',q:2400,min:1000,res:700,pr:190,cell:'О-1 · овощной'},
 {id:'С-05',n:'Морковь',u:'кг',q:640,min:300,res:210,pr:210,cell:'О-1 · овощной'},
 {id:'С-06',n:'Лук репчатый',u:'кг',q:520,min:300,res:260,pr:160,cell:'О-1 · овощной'},
 {id:'С-07',n:'Рис длиннозёрный',u:'кг',q:1150,min:500,res:420,pr:640,cell:'Б-2 · бакалея'},
 {id:'С-08',n:'Гречка',u:'кг',q:380,min:400,res:300,pr:520,cell:'Б-2 · бакалея'},
 {id:'С-09',n:'Макароны рожки',u:'кг',q:870,min:300,res:150,pr:410,cell:'Б-3 · бакалея'},
 {id:'С-10',n:'Масло подсолнечное',u:'л',q:410,min:200,res:95,pr:720,cell:'Б-1 · бакалея'},
 {id:'С-11',n:'Специи «Плов»',u:'кг',q:42,min:20,res:9,pr:3900,cell:'Б-1 · бакалея'},
 {id:'С-12',n:'Реторт-пакет 250 г',u:'шт',q:18400,min:10000,res:6000,pr:38,cell:'У-1 · упаковка'},
 {id:'С-13',n:'Короб гофро 24 шт',u:'шт',q:960,min:400,res:250,pr:210,cell:'У-1 · упаковка'}
];
const RW=id=>RAW.find(r=>r.id===id);
/* Продукция (36 видов, показываем 12) */
const PROD=[
 {id:'Г-01',n:'Плов с говядиной',w:250,cost:742,price:1490,mp:1590,q:5280,cell:'A-01-2',sold:[3100,3400,3650,3920],m:'A'},
 {id:'Г-02',n:'Гречка с говядиной',w:250,cost:698,price:1390,mp:1490,q:3120,cell:'A-02-1',sold:[2800,2650,2900,3050],m:'A'},
 {id:'Г-03',n:'Макароны по-флотски',w:250,cost:560,price:1190,mp:1290,q:4410,cell:'A-03-3',sold:[2100,2200,2050,2300],m:'A'},
 {id:'Г-04',n:'Картофель с говядиной',w:250,cost:610,price:1290,mp:1390,q:2860,cell:'B-01-2',sold:[1900,1750,1980,2150],m:'B'},
 {id:'Г-05',n:'Рис с курицей',w:250,cost:520,price:1150,mp:1250,q:3940,cell:'B-02-1',sold:[2400,2600,2550,2750],m:'B'},
 {id:'Г-06',n:'Плов с бараниной',w:250,cost:890,price:1790,mp:1890,q:640,cell:'B-03-1',sold:[900,1150,1300,1420],m:'B'},
 {id:'Г-07',n:'Борщ с говядиной',w:300,cost:480,price:1090,mp:1190,q:2210,cell:'C-01-1',sold:[700,620,540,480],m:'C'},
 {id:'Г-08',n:'Каша овсяная с яблоком',w:200,cost:260,price:690,mp:750,q:5900,cell:'C-02-2',sold:[600,540,410,380],m:'C'},
 {id:'Г-09',n:'Тушёная говядина',w:325,cost:1150,price:2190,mp:2290,q:1740,cell:'C-03-1',sold:[1200,1260,1380,1450],m:'C'},
 {id:'Г-10',n:'Фасоль с говядиной',w:250,cost:590,price:1250,mp:1350,q:3320,cell:'D-01-2',sold:[400,380,300,260],m:'D'},
 {id:'ИРП-1',n:'ИРП суточный (3 приёма)',w:1600,cost:5400,price:9800,mp:10500,q:820,cell:'D-02-1',sold:[300,420,510,640],m:'D'},
 {id:'ИРП-П',n:'Походный набор «Тау»',w:900,cost:3100,price:5900,mp:6400,q:410,cell:'D-03-1',sold:[180,260,390,470],m:'D'}
];
const PR=id=>PROD.find(p=>p.id===id)||PROD[0];
let fgSel='Г-01';
/* Техкарты (из 1С): на 1 000 пакетов */
const TECH={
 'Г-01':{out:1000,loss:{'обжарка':28,'ужарка мяса':34},rows:[['С-01',96],['С-07',88],['С-05',42],['С-06',24],['С-10',11],['С-11',2.6],['С-12',1000]]},
 'Г-02':{out:1000,loss:{'варка':12,'ужарка мяса':34},rows:[['С-01',92],['С-08',84],['С-06',22],['С-10',8],['С-12',1000]]},
 'Г-03':{out:1000,loss:{'ужарка фарша':30},rows:[['С-01',78],['С-09',96],['С-06',26],['С-10',9],['С-12',1000]]},
 'Г-05':{out:1000,loss:{'ужарка курицы':26},rows:[['С-03',88],['С-07',94],['С-05',30],['С-06',20],['С-10',9],['С-12',1000]]}
};
/* Партии/смены */
let BATCH=[
 {id:'П-118',d:'07.11',p:'Г-01',plan:3000,out:2912,st:'идёт',who:'Гульмира',raw:{'С-01':[288,301],'С-07':[264,266],'С-05':[126,128],'С-06':[72,79]}},
 {id:'П-117',d:'06.11',p:'Г-05',plan:3000,out:2986,st:'закрыта',who:'Гульмира',raw:{'С-03':[264,266],'С-07':[282,283]}},
 {id:'П-116',d:'06.11',p:'Г-02',plan:2000,out:1904,st:'закрыта',who:'Асан',raw:{'С-01':[184,198],'С-08':[168,170]}},
 {id:'П-115',d:'05.11',p:'Г-03',plan:2500,out:2491,st:'закрыта',who:'Гульмира',raw:{'С-01':[195,196],'С-09':[240,241]}}
];
/* Приёмки */
let RECV=[
 {id:'ПР-341',t:'07.11 08:12',sup:'ТОО «Агро-Мясо Нура»',raw:'С-01',doc:1000,fact:1000,temp:'+1,8°',st:'принято',pay:'к оплате',sum:3650000},
 {id:'ПР-340',t:'07.11 07:40',sup:'КХ «Береке»',raw:'С-04',doc:1500,fact:1472,temp:'—',st:'недостача',pay:'ждёт решения',sum:285000},
 {id:'ПР-339',t:'06.11 16:05',sup:'ТОО «Зерно-Трейд»',raw:'С-07',doc:800,fact:800,temp:'—',st:'принято',pay:'оплачено',sum:512000},
 {id:'ПР-338',t:'06.11 10:20',sup:'ТОО «ПакПром»',raw:'С-12',doc:20000,fact:20000,temp:'—',st:'принято',pay:'к оплате',sum:760000},
 {id:'ПР-337',t:'05.11 09:00',sup:'ИП Касымов (курица)',raw:'С-03',doc:600,fact:594,temp:'+3,9°',st:'возврат части',pay:'оплачено',sum:1039500}
];
/* Магазины и долги */
const SHOPS=[
 {id:'М-01',n:'Сеть «Арай Маркет», 6 точек',rep:'Ерлан',mode:'реализация',debt:1840000,lim:2500000,days:12},
 {id:'М-02',n:'Туристический «Альпинист»',rep:'Ерлан',mode:'консигнация',debt:620000,lim:800000,days:34},
 {id:'М-03',n:'Охота и рыбалка «Беркут»',rep:'Айжан',mode:'консигнация',debt:410000,lim:600000,days:21},
 {id:'М-04',n:'АЗС «Дала Ойл», 9 станций',rep:'Айжан',mode:'реализация',debt:960000,lim:1500000,days:8},
 {id:'М-05',n:'ТОО «СнабВоенКомплект»',rep:'Есен',mode:'договор поставки',debt:4200000,lim:6000000,days:28},
 {id:'М-06',n:'Магазин «Турист», Талгар',rep:'Ерлан',mode:'консигнация',debt:185000,lim:200000,days:47}
];
let SHIPS=[
 {id:'Н-2210',d:'07.11',shop:'М-01',items:[['Г-01',240],['Г-03',192],['Г-05',144]],st:'собирается',sum:0},
 {id:'Н-2209',d:'07.11',shop:'М-04',items:[['Г-01',96],['ИРП-П',24]],st:'в пути',sum:0},
 {id:'Н-2208',d:'06.11',shop:'М-05',items:[['ИРП-1',300],['Г-09',480]],st:'доставлено',sum:0},
 {id:'Н-2207',d:'06.11',shop:'М-02',items:[['Г-06',48],['ИРП-П',36],['Г-08',72]],st:'доставлено',sum:0}
];
SHIPS.forEach(s=>s.sum=s.items.reduce((a,[p,q])=>a+PR(p).price*q,0));
const SH=id=>SHOPS.find(s=>s.id===id);
/* Площадки */
const MPL=[['kaspi','Kaspi.kz','#d9a441'],['ozon','Ozon','#3a6489'],['wb','Wildberries','#8b5a6b'],['site','Сайт gurme','#4f5a32']];
let MPLOG=[['15:00','синхронизация: 12 цен, 36 остатков','ok'],['14:30','синхронизация: 0 изменений','ok'],['14:00','Wildberries: 1 карточка — ошибка габаритов','w'],['13:30','синхронизация: 3 цены','ok']];
let LAST='15:00';
const SC={};
/* Пульт */
SC.dash=()=>{const b=BATCH[0];const debt=SHOPS.reduce((a,s)=>a+s.debt,0);const fgq=PROD.reduce((a,p)=>a+p.q,0);const low=RAW.filter(r=>r.q-r.res<r.min);
 return `<div class="hd"><div><h2>Пульт собственника · ${TODAY}, ${NOW}</h2><p>Система одного окна: сырьё, цех, склад готовой продукции, магазины, маркетплейсы и деньги. Цифры собираются из сканеров и документов — никто не пересказывает «со слов».</p></div><div class="btns"><button class="bt" onclick="xlsDash()">Excel</button><button class="bt p" onclick="go('claude')">Спросить Claude</button></div></div>
 <div class="strip"><div><small>Смена ${b.id} · ${PR(b.p).n}</small><b>${fmt(b.out)} / ${fmt(b.plan)} пак.</b>${bar(pct(b.out,b.plan),'g')}<span>идёт · начальник цеха ${b.who}</span></div><div><small>Потери сырья за неделю</small><b class="bad">1,9%</b><span>норма 1,2% · перерасход 64 кг мяса</span></div><div><small>Склад ГП</small><b>${fmt(fgq)} пак.</b><span>36 видов · 12 на схеме</span></div><div><small>Долги магазинов</small><b>${tg(debt)}</b><span>просрочка 30+: ${tg(1305000)}</span></div><div><small>Октябрь, валовая прибыль</small><b class="ok">${tg(21400000)}</b><span>выручка ${tg(46800000)}</span></div></div>
 <div class="g21"><div>
  <div class="pan"><h3>Выпуск по неделям, пакетов</h3><p>Медью — неделя с расширением смены.</p>${vbars([14200,15100,13800,16400,17900,16200,18800,19400],['39','40','41','42','43','44','45','46'],[6,7])}</div>
  <div class="pan"><h3>Цепочка сегодня</h3><div class="flow4"><div><b>1</b>Приёмка: <strong>2 машины</strong><br>говядина 1 000 кг ✓, картофель −28 кг</div><div><b>2</b>Выдача в цех: <strong>${fmt(1031)} кг</strong><br>по техкарте Г-01 × 3 000</div><div><b>3</b>Выход: <strong>${fmt(b.out)} пак.</strong><br>ужарка 34,8% · норма 34%</div><div><b>4</b>Отгрузка: <strong>2 накладные</strong><br>«Арай Маркет», «Дала Ойл»</div></div></div>
 </div><div>
  <div class="pan"><h3>Требует внимания</h3><div class="alist">
   <a onclick="go('loss')"><i class="dt r"></i><b>Смена П-118: лук −7 кг, говядина −13 кг сверх нормы</b><span>расхождение выдано / по техкарте · ответственный Гульмира</span></a>
   <a onclick="go('recv')"><i class="dt w"></i><b>Картофель: пришло 1 472 из 1 500 кг</b><span>КХ «Береке» · недостача 28 кг ждёт решения</span></a>
   <a onclick="go('raw')"><i class="dt w"></i><b>${low.length} позиции сырья ниже минимума</b><span>${low.map(r=>r.n.split(',')[0]).join(', ')}</span></a>
   <a onclick="go('debts')"><i class="dt r"></i><b>«Турист», Талгар — 47 дней консигнации</b><span>185 000 из 200 000 ₸ · отгрузки на паузе</span></a>
   <a onclick="go('mp')"><i class="dt i"></i><b>Wildberries: ошибка карточки «Тау»</b><span>габариты упаковки · Дана исправляет</span></a>
   <a onclick="go('plan')"><i class="dt i"></i><b>Борщ и фасоль падают 3-й месяц</b><span>Claude: не выпускать в ноябре, остатка хватит на 4 мес.</span></a>
  </div></div>${said('«Вот этот весь расчёт нам нужен. То есть учёт»','Каждый шаг — приёмка, выдача, выход, отгрузка — пишется сканером, поэтому расчёт сходится сам.')}
 </div></div>`};
function xlsDash(){const h=`<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>Код</th><th>Продукция</th><th>Остаток, пак.</th><th>Ячейка</th><th>Себестоимость</th><th>Цена</th></tr>${PROD.map(p=>`<tr><td>${p.id}</td><td>${p.n}</td><td>${p.q}</td><td>${p.cell}</td><td>${p.cost}</td><td>${p.price}</td></tr>`).join('')}</table></body></html>`;try{const b=new Blob(['﻿'+h],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Склад_ГП_'+TODAY+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}toast('Файл <b>Склад_ГП.xls</b> скачан.')}
/* Продажи и финансы */
SC.sales=()=>{const ch=[['Магазины и АЗС',18.2],['Госзаказ и снабжение',14.6],['Kaspi',6.1],['Ozon',3.4],['Wildberries',2.7],['Сайт',1.8]];const tot=ch.reduce((a,c)=>a+c[1],0);
 return `<div class="hd"><div><h2>Продажи и финансы · октябрь</h2><p>Выручка по каналам, маржа по блюдам, P&amp;L. Себестоимость берётся из фактического расхода сырья по сменам, а не из нормы.</p></div><div class="btns"><div class="seg"><a class="on">Октябрь</a><a onclick="toast('Период переключается: неделя, месяц, квартал, год.')">Квартал</a></div></div></div>
 <div class="strip"><div><small>Выручка</small><b>${tg(46800000)}</b><span>+18% к сентябрю</span></div><div><small>Себестоимость факт</small><b>${tg(25400000)}</b><span>по сменам</span></div><div><small>Валовая прибыль</small><b class="ok">${tg(21400000)}</b><span>маржа 45,7%</span></div><div><small>Расходы</small><b>${tg(9300000)}</b><span>ФОТ, аренда, логистика, комиссии МП</span></div><div><small>Чистая прибыль</small><b class="ok">${tg(12100000)}</b><span>25,9%</span></div></div>
 <div class="g2"><div class="pan"><h3>Выручка по каналам, млн ₸</h3>${ch.map(([n,v],i)=>`<div class="hb"><span>${n}</span><i class="${i>1?'y':''}" style="width:${pct(v,ch[0][1])}%"></i><b>${fmt1(v)}</b></div>`).join('')}<p>Маркетплейсы — ${pct(14,tot)}% выручки и растут быстрее всех.</p></div>
 <div class="pan"><h3>Маржа по блюдам</h3><div class="tw"><table class="t sm"><thead><tr><th>Блюдо</th><th class="r">Себест.</th><th class="r">Цена</th><th class="r">Маржа</th><th class="r">Продано</th></tr></thead><tbody>${PROD.map(p=>`<tr><td>${esc(p.n)}</td><td class="r">${fmt(p.cost)}</td><td class="r">${fmt(p.price)}</td><td class="r ${pct(p.price-p.cost,p.price)<45?'bad':''}">${pct(p.price-p.cost,p.price)}%</td><td class="r">${fmt(p.sold[3])}</td></tr>`).join('')}</tbody></table></div></div></div>
 <div class="pan"><h3>P&amp;L, тыс. ₸</h3><div class="tw"><table class="t pnl"><thead><tr><th>Статья</th><th class="r">Июль</th><th class="r">Август</th><th class="r">Сентябрь</th><th class="r">Октябрь</th></tr></thead><tbody>${[['Выручка',31200,34800,39600,46800],['Себестоимость (факт по сменам)',17900,19600,21800,25400],['Валовая прибыль',13300,15200,17800,21400,1],['ФОТ',4100,4200,4400,4900],['Аренда цеха и склада',1200,1200,1200,1200],['Логистика',820,910,1040,1310],['Комиссии маркетплейсов',690,820,1050,1340],['Прочее',480,510,500,550],['Чистая прибыль',6010,7560,9610,12100,1]].map(r=>`<tr class="${r[5]?'sum':''}"><td>${r[0]}</td>${r.slice(1,5).map(v=>`<td class="r">${fmt(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`};
/* Claude через MCP */
let cq=0;const CQ=[
 ['Что не выпускать в ноябре?','Борщ с говядиной (Г-07) и фасоль с говядиной (Г-10): продажи падают 3-й месяц подряд (−31% и −35% с июля), остатка 2 210 и 3 320 пакетов хватит на 4,6 и 12,8 месяца. Каша овсяная — тоже пауза: 5 900 пакетов, продажи 380 в месяц. Освободившиеся смены лучше отдать плову с бараниной: остаток 640, продажи 1 420 в месяц — закончится через 13 дней.'],
 ['Сколько говядины нужно на план ноября?','По плану выпуска 41 000 пакетов и техкартам из 1С нужно 3 860 кг говядины с учётом нормы ужарки. На складе 1 840 кг, из них 620 в резерве под смены этой недели. Заказать ~2 650 кг до 14.11; при текущей цене 3 650 ₸/кг — 9,67 млн ₸.'],
 ['Где мы теряем деньги на сырье?','За 4 недели перерасход сверх нормы — 64 кг говядины и 19 кг лука, ~260 000 ₸. 71% перерасхода — в сменах с обжаркой плова; в сменах Асана ужарка мяса стабильно 36–37% при норме 34%. Стоит проверить температуру и время обжарки на линии 2.'],
 ['Какой канал растёт быстрее?','Маркетплейсы: +62% за квартал (Kaspi +48%, Ozon +71%, WB +94%). ИРП и походный набор «Тау» — лидеры роста. Магазины растут на 9%, госзаказ — ровно.']
];
SC.claude=()=>`<div class="hd"><div><h2>Claude · аналитика на ТВ</h2><p>Портал отдаёт данные Claude через MCP-сервер — защищённый шлюз только на чтение. Claude у вас в кабинете видит остатки, смены, продажи и деньги в реальном времени и отвечает на вопросы. Входит в пакет без доплаты.</p></div><div class="btns"><button class="bt p" onclick="tvMode()">ТВ-режим</button></div></div>
 <div class="g21"><div><div class="pan"><h3>Вопрос — ответ</h3><div class="chipr">${CQ.map((c,i)=>`<a class="${i===cq?'on':''}" onclick="cq=${i};render()">${esc(c[0])}</a>`).join('')}</div><div class="wchat"><div class="wm out">${esc(CQ[cq][0])}</div><div class="wm in">${esc(CQ[cq][1])}<br><small>источники: склад ГП, продажи, техкарты 1С, смены · ${NOW}</small></div></div></div>
 ${said('«Я хочу на телевизор вывести… какой товар продаётся, какой не продаётся, чтобы он мне сделал анализ: этот товар не надо выпускать в этом месяце»','Это и есть связка Claude ↔ портал: вопросы обычными словами, ответы на живых данных.')}</div>
 <div><div class="pan"><h3>Что видит Claude</h3>${['Остатки сырья и готовой продукции','Смены: выход, ужарка, потери','Техкарты и себестоимость','Продажи по каналам и магазинам','Долги и консигнация','Цены на маркетплейсах'].map(x=>`<div class="ck">✓ ${x}</div>`).join('')}<div class="ck no">· Только чтение — Claude ничего не меняет в портале</div><div class="ck no">· Доступ по ключу, отзывается одной кнопкой</div></div>
 <div class="pan"><h3>Как подключается</h3><div class="kv"><span>Протокол</span><b>MCP (Model Context Protocol)</b></div><div class="kv"><span>Где работает</span><b>ваш сервер портала</b></div><div class="kv"><span>Стоимость</span><b>в пакете</b></div></div></div></div>`;
function tvMode(){openM('ТВ-режим · кабинет','обновляется каждые 5 минут',`<div class="strip"><div><small>Сегодня выпущено</small><b>${fmt(BATCH[0].out)}</b></div><div><small>Склад ГП</small><b>${fmt(PROD.reduce((a,p)=>a+p.q,0))}</b></div><div><small>Продано за неделю</small><b>${fmt(9840)}</b></div><div><small>Долги</small><b>${tg(SHOPS.reduce((a,s)=>a+s.debt,0))}</b></div><div><small>Потери</small><b class="bad">1,9%</b></div></div><div class="pan"><h3>Claude: совет дня</h3><p>${esc(CQ[0][1])}</p></div>`)}
/* Приёмка */
SC.recv=()=>`<div class="hd"><div><h2>Приёмка сырья сканером</h2><p>Кладовщик сканирует штрихкод партии и ставит на весы — портал сравнивает с накладной поставщика. Совпало — приёмка проведена, бухгалтер сразу видит её «к оплате». Не совпало — недостача фиксируется с фото, решение — возврат, допоставка или скидка.</p></div><div class="btns"><button class="bt p" onclick="recvNew()">▣ Сканировать партию</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>№</th><th>Время</th><th>Поставщик</th><th>Сырьё</th><th class="r">По накладной</th><th class="r">Факт</th><th class="r">Разница</th><th>t°</th><th>Приёмка</th><th>Оплата</th></tr></thead><tbody>${RECV.map(r=>{const d=r.fact-r.doc;return `<tr onclick="openRecv('${r.id}')"><td class="mono">${r.id}</td><td>${r.t}</td><td>${esc(r.sup)}</td><td>${esc(RW(r.raw).n)}</td><td class="r">${fmt(r.doc)} ${RW(r.raw).u}</td><td class="r">${fmt(r.fact)}</td><td class="r ${d<0?'bad':''}">${d?fmt(d):'—'}</td><td>${r.temp}</td><td>${tag(r.st,r.st==='принято'?'g':'r')}</td><td>${tag(r.pay,r.pay==='оплачено'?'g':r.pay==='к оплате'?'b':'w')}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Проверка соответствия</h3>${['Вес и количество против накладной','Температура охлаждённого мяса ≤ +4 °C','Ветсправка и сертификат — фото к партии','Срок годности и маркировка партии','Целостность упаковки'].map(x=>`<div class="ck">✓ ${x}</div>`).join('')}</div>
 ${said('«Пистолетом повели — тонна говядины зашла, она поступила сразу в базу, что одну тонну мы приняли. Бухгалтер уже видит, что есть принятие — накладную может оплачивать»','ПР-341: 1 000 кг говядины принято сканером в 08:12 — в 08:13 приёмка у бухгалтера в статусе «к оплате».')}</div>`;
function openRecv(id){const r=RECV.find(x=>x.id===id);openM('Приёмка '+id,esc(r.sup)+' · '+r.t,`<div class="kv"><span>Сырьё</span><b>${esc(RW(r.raw).n)}</b></div><div class="kv"><span>По накладной / факт</span><b>${fmt(r.doc)} / ${fmt(r.fact)} ${RW(r.raw).u}</b></div><div class="kv"><span>Температура</span><b>${r.temp}</b></div><div class="kv"><span>Ячейка</span><b>${RW(r.raw).cell}</b></div><div class="kv tot"><span>Сумма к оплате</span><b>${tg(r.sum*(r.fact/r.doc))}</b></div><div class="btns l"><button class="bt p" onclick="closeM();toast('Приёмка передана бухгалтеру и в 1С (поступление товаров).')">Провести</button>${r.fact<r.doc?`<button class="bt" onclick="closeM();toast('Акт расхождения отправлен поставщику в WhatsApp.')">Акт расхождения</button>`:''}</div>`)}
function recvNew(){RECV.unshift({id:'ПР-'+(342+RECV.length-5),t:TODAY.slice(0,5)+' '+NOW,sup:'ТОО «Агро-Мясо Нура»',raw:'С-02',doc:200,fact:200,temp:'+2,1°',st:'принято',pay:'к оплате',sum:840000});RW('С-02').q+=200;render();toast('▣ Пик! Баранина 200 кг — совпало с накладной. Остаток обновлён, бухгалтер видит «к оплате».')}
/* Склад сырья */
SC.raw=()=>`<div class="hd"><div><h2>Склад сырья · онлайн</h2><p>Каждая выдача в цех по сканеру сразу уменьшает остаток. «Резерв» — сырьё под запланированные смены: его не выдадут на другое блюдо.</p></div><div class="btns"><button class="bt" onclick="toast('Заказ поставщикам сформирован по позициям ниже минимума и отправлен в WhatsApp.')">Заказать недостающее</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Код</th><th>Сырьё</th><th>Ячейка</th><th class="r">Остаток</th><th class="r">Резерв</th><th class="r">Свободно</th><th style="width:16%"></th><th class="r">Мин.</th><th class="r">Цена</th></tr></thead><tbody>${RAW.map(r=>{const f=r.q-r.res;return `<tr><td class="mono">${r.id}</td><td><b>${esc(r.n)}</b></td><td>${r.cell}</td><td class="r">${fmt(r.q)} ${r.u}</td><td class="r">${fmt(r.res)}</td><td class="r ${f<r.min?'bad':''}">${fmt(f)}</td><td>${bar(pct(f,r.min*2),f<r.min?'r':'g')}</td><td class="r">${fmt(r.min)}</td><td class="r">${fmt(r.pr)}</td></tr>`}).join('')}</tbody></table></div></div>
 ${said('«Чтобы мы видели в онлайне, сколько у нас осталось мяса на складе, овощей… сколько пакетов вышло и сколько на складе остаток»')}`;
/* Недостачи */
SC.loss=()=>`<div class="hd"><div><h2>Недостачи и потери</h2><p>Три точки контроля: приёмка (пришло меньше, чем в накладной), цех (выдано больше нормы техкарты), склад (инвентаризация сканером). Каждое расхождение — с ответственным, временем и решением.</p></div></div>
 <div class="strip"><div><small>Потери за 4 недели</small><b class="bad">${tg(412000)}</b><span>1,9% сырья · норма 1,2%</span></div><div><small>На приёмке</small><b>${tg(118000)}</b><span>3 случая, 2 возмещены</span></div><div><small>В цехе сверх нормы</small><b class="bad">${tg(260000)}</b><span>64 кг мяса, 19 кг лука</span></div><div><small>Инвентаризация</small><b>${tg(34000)}</b><span>−22 пакета ГП</span></div><div><small>Открытых расследований</small><b>2</b></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Где</th><th>Что</th><th class="r">Кол-во</th><th class="r">Сумма</th><th>Ответственный</th><th>Статус</th></tr></thead><tbody>${[['07.11','Цех · смена П-118','Говядина выдано сверх нормы','13 кг',47450,'Гульмира','разбор'],['07.11','Цех · смена П-118','Лук сверх нормы','7 кг',1120,'Гульмира','разбор'],['07.11','Приёмка ПР-340','Картофель недовес','28 кг',5320,'КХ «Береке»','ждёт поставщика'],['06.11','Цех · смена П-116','Говядина: ужарка 37% при норме 34%','14 кг',51100,'Асан','принято: настройка печи'],['03.11','Склад ГП, A-02','Инвентаризация: гречка с говядиной','−22 пак.',15356,'Бауыржан','видео камеры запрошено'],['05.11','Приёмка ПР-337','Курица: 6 кг — нарушена упаковка','6 кг',10500,'ИП Касымов','возврат']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="r">${r[3]}</td><td class="r">${fmt(r[4])}</td><td>${r[5]}</td><td>${tag(r[6],/принято|возврат/.test(r[6])?'g':'w')}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('«Склад должен быть максимально электронный»','Где сканер, там след: кто, когда и сколько взял. Потеря или кража перестают быть «непонятными».')}`;
/* Техкарты */
let tSel='Г-01';
SC.tech=()=>{const t=TECH[tSel];const p=PR(tSel);const cost=t.rows.reduce((a,[r,q])=>a+RW(r).pr*q,0)/t.out;
 return `<div class="hd"><div><h2>Техкарты из 1С</h2><p>Рецептура и калькуляция каждого блюда ведутся в 1С — портал забирает их автоматически. На 1 000 пакетов: сколько сырья, какие потери на обжарке и ужарке, какая себестоимость.</p></div><div class="btns"><button class="bt" onclick="toast('Техкарты перезагружены из 1С: 36 блюд, изменений 0.')">Обновить из 1С</button></div></div>
 <div class="chipr">${Object.keys(TECH).map(k=>`<a class="${k===tSel?'on':''}" onclick="tSel='${k}';render()">${esc(PR(k).n)}</a>`).join('')}</div>
 <div class="g21"><div class="pan"><h3>${esc(p.n)} · ${p.w} г · на ${fmt(t.out)} пакетов</h3><div class="tw"><table class="t"><thead><tr><th>Сырьё</th><th class="r">Норма</th><th class="r">На 1 пакет</th><th class="r">Цена</th><th class="r">Сумма</th></tr></thead><tbody>${t.rows.map(([r,q])=>`<tr><td>${esc(RW(r).n)}</td><td class="r">${fmt1(q)} ${RW(r).u}</td><td class="r">${RW(r).u==='шт'?'1 шт':fmt(q/t.out*1000)+' г'}</td><td class="r">${fmt(RW(r).pr)}</td><td class="r">${fmt(RW(r).pr*q)}</td></tr>`).join('')}<tr class="sum"><td><b>Себестоимость сырья на 1 пакет</b></td><td></td><td></td><td></td><td class="r"><b>${tg(cost)}</b></td></tr></tbody></table></div></div>
 <div><div class="pan"><h3>Нормы потерь</h3>${Object.entries(t.loss).map(([k,v])=>`<div class="kv"><span>${k}</span><b>${v}%</b></div>`).join('')}<div class="kv"><span>Цена продажи</span><b>${tg(p.price)}</b></div><div class="kv tot"><span>Маржа по сырью</span><b>${pct(p.price-cost,p.price)}%</b></div></div>
 ${said('«На определённое блюдо, которое должно уже сидеть в 1С, то есть калькуляцию… мы там учтём, что это обжарка, ужарка»','Нормы ужарки из техкарты — это планка, с которой портал сравнивает каждую смену.')}</div></div>`};
/* Заказ на смену и выдача */
let oSel='Г-01',oQty=3000,issued={};
SC.order=()=>{const t=TECH[oSel]||TECH['Г-01'];const k=oQty/t.out;
 return `<div class="hd"><div><h2>Заказ на смену и выдача в цех</h2><p>Технолог ставит заказ: блюдо и количество пакетов. Портал по техкарте считает, сколько сырья выдать, и резервирует его. Кладовщик выдаёт по сканеру — каждая позиция отмечается «пиком», остаток склада уменьшается сразу.</p></div></div>
 <div class="pan"><div class="btns l"><select class="sel" onchange="oSel=this.value;issued={};render()">${Object.keys(TECH).map(x=>`<option value="${x}" ${x===oSel?'selected':''}>${esc(PR(x).n)}</option>`).join('')}</select><div class="seg">${[1000,2000,3000,5000].map(q=>`<a class="${q===oQty?'on':''}" onclick="oQty=${q};issued={};render()">${fmt(q)} пак.</a>`).join('')}</div></div></div>
 <div class="g21"><div class="pan"><h3>Выдача: ${esc(PR(oSel).n)} × ${fmt(oQty)}</h3><div class="tw"><table class="t"><thead><tr><th>Сырьё</th><th class="r">По техкарте</th><th class="r">Свободно</th><th>Ячейка</th><th>Выдано</th></tr></thead><tbody>${t.rows.map(([r,q])=>{const need=q*k;const f=RW(r).q-RW(r).res;return `<tr><td><b>${esc(RW(r).n)}</b></td><td class="r">${fmt1(need)} ${RW(r).u}</td><td class="r ${f<need?'bad':''}">${fmt(f)}</td><td>${RW(r).cell}</td><td>${issued[r]?tag('▣ выдано','g'):`<button class="bt sm" onclick="issued['${r}']=1;render();toast('▣ Пик! ${esc(RW(r).n)} — ${fmt1(need)} ${RW(r).u} выдано в цех.')">Сканировать</button>`}</td></tr>`}).join('')}</tbody></table></div>
 <button class="bt p full" onclick="t0Issue()">Выдать всё одним листом</button></div>
 <div><div class="pan"><h3>Итог заказа</h3><div class="kv"><span>Пакетов</span><b>${fmt(oQty)}</b></div><div class="kv"><span>Сырья, кг</span><b>${fmt(t.rows.filter(([r])=>RW(r).u!=='шт').reduce((a,[r,q])=>a+q*k,0))}</b></div><div class="kv"><span>Себестоимость</span><b>${tg(t.rows.reduce((a,[r,q])=>a+RW(r).pr*q*k,0))}</b></div><div class="kv"><span>Выдано позиций</span><b>${Object.keys(issued).length} / ${t.rows.length}</b></div></div>
 ${said('«…оттуда она должна выходить на производственный цех по заказу: 10 кг мяса, 10 кг картошки на определённое блюдо»')}</div></div>`};
function t0Issue(){const t=TECH[oSel];t.rows.forEach(([r])=>issued[r]=1);render();toast('Все позиции выданы. Остатки списаны, лист выдачи — в 1С (требование-накладная).')}
/* Смена */
SC.shift=()=>`<div class="hd"><div><h2>Смена: выход пакетов и ужарка</h2><p>По итогам смены: сколько сырья выдано, сколько пакетов вышло, сколько должно было выйти по техкарте. Ужарка и потери считаются сами и сравниваются с нормой.</p></div><div class="btns"><button class="bt p" onclick="closeShift()">Закрыть смену П-118</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Партия</th><th>Дата</th><th>Блюдо</th><th class="r">План</th><th class="r">Вышло</th><th style="width:14%"></th><th class="r">Мясо: выдано / норма</th><th class="r">Перерасход</th><th>Начальник</th><th>Статус</th></tr></thead><tbody>${BATCH.map(b=>{const mk=Object.keys(b.raw)[0];const [n,f]=b.raw[mk];return `<tr onclick="openBatch('${b.id}')"><td class="mono">${b.id}</td><td>${b.d}</td><td>${esc(PR(b.p).n)}</td><td class="r">${fmt(b.plan)}</td><td class="r">${fmt(b.out)}</td><td>${bar(pct(b.out,b.plan),pct(b.out,b.plan)<96?'r':'g')}</td><td class="r">${fmt(f)} / ${fmt(n)} кг</td><td class="r ${f-n>5?'bad':''}">${f-n>0?'+'+fmt(f-n)+' кг':'—'}</td><td>${b.who}</td><td>${tag(b.st,b.st==='идёт'?'b':'g')}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>П-118 · плов с говядиной</h3>${Object.entries(BATCH[0].raw).map(([r,[n,f]])=>`<div class="hb"><span>${esc(RW(r).n.split(',')[0])}</span><i class="${f-n>3?'y':''}" style="width:${pct(f,n*1.1)}%"></i><b>${fmt(f)} / ${fmt(n)}</b></div>`).join('')}<div class="kv"><span>Ужарка мяса факт / норма</span><b class="bad">34,8% / 34%</b></div><div class="kv"><span>Выход</span><b>${fmt(BATCH[0].out)} из ${fmt(BATCH[0].plan)} · 97%</b></div></div>
 ${said('«…при выходе уже сколько пакетов — скажем, тысячу пакетов вышло — это всё должно отниматься и выходить на склад»','Закрытие смены: сырьё списано по факту, пакеты оприходованы на склад ГП в ячейку, себестоимость партии — в 1С.')}</div>`;
function openBatch(id){const b=BATCH.find(x=>x.id===id);openM('Партия '+id,esc(PR(b.p).n)+' · '+b.d+' · '+b.who,`<table class="t sm"><thead><tr><th>Сырьё</th><th class="r">Норма</th><th class="r">Выдано</th><th class="r">Разница</th></tr></thead><tbody>${Object.entries(b.raw).map(([r,[n,f]])=>`<tr><td>${esc(RW(r).n)}</td><td class="r">${fmt(n)}</td><td class="r">${fmt(f)}</td><td class="r ${f-n>3?'bad':''}">${f-n?'+'+(f-n):'—'}</td></tr>`).join('')}</tbody></table><div class="kv tot"><span>Выход</span><b>${fmt(b.out)} / ${fmt(b.plan)} пакетов</b></div><div class="kv"><span>Штрихкод партии</span><b class="mono">2${id.replace(/\D/g,'')}0711${b.p.replace(/\D/g,'')}</b></div>`)}
function closeShift(){const b=BATCH[0];if(b.st==='закрыта'){toast('Смена уже закрыта.');return}b.out=2968;b.st='закрыта';PR(b.p).q+=b.out;render();toast('Смена П-118 закрыта: 2 968 пакетов оприходовано в ячейку A-01-2. Перерасход 13 кг говядины — в «Недостачи и потери».')}
/* Сканеры */
SC.scan=()=>`<div class="hd"><div><h2>Сканеры в цехах</h2><p>В каждом блоке — свой сканер, привязанный к участку: мясной цех, кухня, фасовка, склад сырья, склад ГП. «Чтобы руками не тыкали» — работник только сканирует, количество берётся с весов или из этикетки.</p></div></div>
 <div class="phg">${[['Склад сырья','приёмка, выдача в цех','14:58 говядина 301 кг → П-118'],['Мясной цех','взвешивание после разделки','14:40 лопатка 288 кг → обжарка'],['Кухня','закладка по техкарте','14:12 рис 266 кг → котёл 2'],['Фасовка','этикетка партии на короб','15:16 короб №121 · 24 пак.'],['Склад ГП','размещение в ячейку, отбор','15:18 A-01-2 ← 5 коробов'],['Отгрузка','сверка накладной','13:30 Н-2209 · 120 пак. ✓']].map(([n,d,l])=>`<div class="phc"><span>▣ сканер · ${d}</span><b>${n}</b><span>${l}</span></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Последние события</h3><table class="t sm"><tbody>${[['15:18','Склад ГП','Бауыржан','5 коробов Г-01 → A-01-2'],['15:16','Фасовка','Мира','этикетка короба №121'],['14:58','Склад сырья','Бауыржан','говядина 13 кг сверх нормы → П-118 ⚠'],['14:40','Мясной цех','Асан','разделка: 288 кг'],['14:12','Кухня','Гульмира','рис 266 кг → котёл 2']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td><b>${r[2]}</b></td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Свой блок будет стоять на кухне, свой блок… чтобы оно к блоку было подсоединено, и чтобы не тыкали руками больше»','Подходят любые USB/Bluetooth-сканеры и камера телефона; этикетки печатаются на термопринтере.')}</div>`;
/* План выпуска */
SC.plan=()=>{const rows=PROD.map(p=>{const avg=p.sold[3];const cover=p.q/avg;const tr=pct(p.sold[3]-p.sold[0],p.sold[0]);const need=Math.max(0,Math.round((avg*1.6-p.q)/100)*100);return {p,avg,cover,tr,need,dec:cover>3?'не выпускать':need>0?'выпустить':'по остатку'}});
 return `<div class="hd"><div><h2>План выпуска · ноябрь</h2><p>Портал считает по каждому блюду: продажи за 4 месяца, тренд, сколько месяцев хватит остатка, — и предлагает план. Технолог правит, Claude объясняет решение.</p></div><div class="btns"><button class="bt p" onclick="toast('План ноября утверждён: заказы на смены созданы, сырьё зарезервировано.')">Утвердить план</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Блюдо</th><th class="r">Продажи/мес</th><th class="r">Тренд</th><th class="r">Остаток</th><th class="r">Хватит, мес</th><th class="r">Выпустить</th><th>Решение</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.p.n)}</b></td><td class="r">${fmt(r.avg)}</td><td class="r ${r.tr<0?'bad':'ok'}">${r.tr>0?'+':''}${r.tr}%</td><td class="r">${fmt(r.p.q)}</td><td class="r">${fmt1(r.cover)}</td><td class="r">${r.need?fmt(r.need):'—'}</td><td>${tag(r.dec,r.dec==='не выпускать'?'r':r.dec==='выпустить'?'g':'')}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('«…этот товар не надо выпускать в этом месяце, а вот надо выпускать, условно, 500 тысяч пакетов вот такого товара»')}`};
/* Склад ГП: адресное хранение */
SC.fg=()=>{const p=PR(fgSel);const zones=['A','B','C','D'];
 return `<div class="hd"><div><h2>Склад готовой продукции · адреса</h2><p>Каждая коробка — в своей ячейке: зона-стеллаж-ярус. Кладовщик не ищет: сканирует заказ — портал показывает, откуда брать, в порядке FIFO по датам выпуска.</p></div><div class="btns"><button class="bt" onclick="toast('Инвентаризация зоны A запущена: сканируйте коробы, расхождения подсветятся.')">Инвентаризация</button></div></div>
 <div class="g21"><div class="pan"><h3>Схема склада</h3><div class="fgmap">${zones.map(z=>`<div class="fgz"><b>Зона ${z}</b>${[1,2,3].map(st=>{const it=PROD.find(x=>x.cell.startsWith(z+'-0'+st));return `<a class="fgc ${it&&it.id===fgSel?'on':''} ${it&&it.q<1000?'lo':''}" onclick="${it?`fgSel='${it.id}';render()`:''}"><code>${z}-0${st}</code><span>${it?esc(it.n):'свободно'}</span><em>${it?fmt(it.q)+' пак.':''}</em></a>`}).join('')}</div>`).join('')}</div><p>Медью — выбранное блюдо, красным — остаток меньше 1 000 пакетов.</p></div>
 <div><div class="pan"><h3>${esc(p.n)}</h3><div class="kv"><span>Ячейка</span><b class="mono">${p.cell}</b></div><div class="kv"><span>Остаток</span><b>${fmt(p.q)} пак. · ${fmt(Math.floor(p.q/24))} коробов</b></div><div class="kv"><span>Партии</span><b>П-118 (07.11), П-109 (31.10)</b></div><div class="kv"><span>Годен до</span><b>07.11.2028 · 24 мес.</b></div><div class="kv"><span>Себестоимость / цена</span><b>${fmt(p.cost)} / ${fmt(p.price)} ₸</b></div></div>
 ${said('«…чтобы этот завсклад не запутался, в каком отделении, в какой ячейке стоит этот товар. У нас 30–40 видов товаров»')}</div></div>`};
/* Отгрузка */
const SST=['собирается','в пути','доставлено'];
SC.ship=()=>`<div class="hd"><div><h2>Отгрузка магазинам</h2><p>Накладная создаётся из заказа магазина или торгового. Кладовщик собирает по адресам и сканирует каждый короб — пересорт невозможен. Накладная и счёт-фактура уходят в 1С.</p></div><div class="btns"><button class="bt p" onclick="newShip()">+ Накладная</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>№</th><th>Дата</th><th>Покупатель</th><th>Состав</th><th class="r">Сумма</th><th>Условия</th><th>Статус</th><th></th></tr></thead><tbody>${SHIPS.map(s=>`<tr><td class="mono">${s.id}</td><td>${s.d}</td><td><b>${esc(SH(s.shop).n)}</b></td><td>${s.items.map(([p,q])=>esc(PR(p).n)+' × '+q).join('<br>')}</td><td class="r">${fmt(s.sum)}</td><td>${SH(s.shop).mode}</td><td>${tag(s.st,s.st==='доставлено'?'g':s.st==='в пути'?'b':'w')}</td><td>${s.st!=='доставлено'?`<button class="bt sm" onclick="nextShip('${s.id}')">Дальше →</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('«Выписал накладную и ушёл — у нас же различная реализация есть: на консигнацию подаётся… чтобы мы отслеживали»')}`;
function nextShip(id){const s=SHIPS.find(x=>x.id===id);s.st=SST[SST.indexOf(s.st)+1];if(s.st==='в пути')s.items.forEach(([p,q])=>PR(p).q-=q);render();toast(s.st==='в пути'?'Короба отсканированы, остаток ГП списан, накладная — в 1С.':'Доставлено. Подпись получателя сохранена, долг магазина обновлён.')}
function newShip(){SHIPS.unshift({id:'Н-'+(2211+SHIPS.length-4),d:'07.11',shop:'М-03',items:[['ИРП-П',24],['Г-09',48]],st:'собирается',sum:0});SHIPS[0].sum=SHIPS[0].items.reduce((a,[p,q])=>a+PR(p).price*q,0);render();toast('Накладная создана для «Беркут» (консигнация). Лист отбора: D-03-1, C-03-1.')}
/* Консигнация и долги */
SC.debts=()=>{const S=role==='Торговый представитель'?SHOPS.filter(s=>s.rep==='Ерлан'):SHOPS;
 return `<div class="hd"><div><h2>Консигнация и долги</h2><p>По каждому магазину: условия, лимит, сколько товара лежит на консигнации, сколько продано и оплачено. Превышен лимит или срок — новая отгрузка блокируется.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Покупатель</th><th>Торговый</th><th>Условия</th><th class="r">Долг</th><th class="r">Лимит</th><th style="width:14%"></th><th class="r">Дней</th><th>Статус</th></tr></thead><tbody>${S.map(s=>`<tr><td><b>${esc(s.n)}</b></td><td>${s.rep}</td><td>${s.mode}</td><td class="r">${fmt(s.debt)}</td><td class="r">${fmt(s.lim)}</td><td>${bar(pct(s.debt,s.lim),pct(s.debt,s.lim)>85?'r':'g')}</td><td class="r ${s.days>30?'bad':''}">${s.days}</td><td>${s.days>45||s.debt/s.lim>.9?tag('отгрузки на паузе','r'):s.days>30?tag('напомнить','w'):tag('в норме','g')}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Консигнация: что лежит у магазинов</h3>${[['«Альпинист»','Г-06 × 48, ИРП-П × 36','продано 41%'],['«Беркут»','ИРП-1 × 60, Г-09 × 96','продано 58%'],['«Турист», Талгар','Г-08 × 144','продано 12% · вернуть?']].map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Напоминания</h3><p>За 3 дня до срока и в день оплаты — сообщение магазину в WhatsApp и задача торговому. Сверка остатков на консигнации — раз в 2 недели с фото полки.</p></div></div>`};
/* Торговые */
SC.reps=()=>`<div class="hd"><div><h2>Торговые представители</h2><p>У каждого — свои магазины, план, заказы, долги. С телефона: заказ, фото полки, сверка консигнации.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Торговый</th><th class="r">Магазинов</th><th class="r">План, ₸</th><th class="r">Факт</th><th style="width:16%"></th><th class="r">Долг клиентов</th><th class="r">Визиты</th></tr></thead><tbody>${[['Ерлан Сапаров',24,9000000,7420000,2645000,61],['Айжан Нуртаева',18,7000000,7310000,1370000,54],['Есен (госзаказ)',4,15000000,14600000,4200000,9]].map(r=>`<tr><td><b>${r[0]}</b></td><td class="r">${r[1]}</td><td class="r">${fmt(r[2])}</td><td class="r">${fmt(r[3])}</td><td>${bar(pct(r[3],r[2]),pct(r[3],r[2])<90?'r':'g')}</td><td class="r">${fmt(r[4])}</td><td class="r">${r[5]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="phw"><div class="phone3"><div class="phs"><div class="phtop"><b>Ерлан · сегодня</b><span>7 визитов</span></div>${[['«Арай Маркет», Абая 12','заказ 48 коробов ✓'],['АЗС «Дала Ойл» №4','фото полки ✓'],['«Турист», Талгар','долг 47 дней — оплата?']].map(r=>`<div class="ci2"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}<button class="bt p full" onclick="toast('Заказ отправлен на склад: лист отбора готов.')">+ Заказ магазина</button></div></div>
 <div class="pan"><h3>Каналы связи</h3><p>WhatsApp и Instagram — в карточке магазина или клиента; IP-телефония: звонок в один клик, запись в карточке. Переписка не теряется, если торговый уволился.</p></div></div>`;
/* Маркетплейсы */
let mpEdit=null;
SC.mp=()=>`<div class="hd"><div><h2>Маркетплейсы и цены</h2><p>Цена и остаток меняются в одном месте — в портале. Каждые 30 минут портал отправляет их на Kaspi, Ozon, Wildberries и ваш сайт. Остатки берутся со склада ГП за вычетом резерва под магазины.</p></div><div class="btns"><span class="live">● синхронизация · последняя ${LAST}</span><button class="bt p" onclick="mpSync()">Синхронизировать сейчас</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Блюдо</th><th class="r">Цена в базе</th>${MPL.map(m=>`<th class="r">${m[1]}</th>`).join('')}<th class="r">Остаток для МП</th><th></th></tr></thead><tbody>${PROD.map(p=>`<tr><td><b>${esc(p.n)}</b></td><td class="r">${mpEdit===p.id?`<input class="qin" id="mpv" value="${p.mp}">`:fmt(p.mp)}</td>${MPL.map((m,i)=>`<td class="r">${p.id==='ИРП-П'&&i===2?tag('ошибка','r'):fmt(p.mp+(i===2?40:0))}</td>`).join('')}<td class="r">${fmt(Math.floor(p.q*.3))}</td><td>${mpEdit===p.id?`<button class="bt sm p" onclick="mpSave('${p.id}')">Сохранить</button>`:`<button class="bt sm" onclick="mpEdit='${p.id}';render()">Цена</button>`}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Журнал синхронизации</h3><table class="t sm"><tbody>${MPLOG.map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${tag(r[2]==='ok'?'ок':'внимание',r[2]==='ok'?'g':'w')}</td></tr>`).join('')}</tbody></table></div>
 ${said('«…если изменение цен идёт, она должна автоматом менять цены на всех маркетплейсах и в нашем интернет-магазине»','Сейчас это делает программа от студентов. Мы подключимся к ней или заменим на официальные API площадок — так стабильнее.')}</div>`;
function mpSave(id){const v=+document.getElementById('mpv').value||PR(id).mp;PR(id).mp=v;mpEdit=null;MPLOG.unshift([NOW,'цена «'+PR(id).n+'» → '+fmt(v)+' ₸: в очереди на 4 площадки','ok']);render();toast('Цена сохранена. Уйдёт на Kaspi, Ozon, WB и сайт в ближайшую синхронизацию.')}
function mpSync(){LAST=NOW;MPLOG.unshift([NOW,'ручная синхронизация: '+PROD.length+' цен, 36 остатков','ok']);render();toast('Синхронизировано: Kaspi ✓, Ozon ✓, Wildberries ✓, сайт ✓.')}
/* 1С */
SC.onec=()=>`<div class="hd"><div><h2>Обмен с 1С</h2><p>Техкарты и справочники живут в 1С — портал их забирает. Операции (приёмка, выдача, выпуск, отгрузка) ведутся в портале и сразу уходят в 1С документами. Бухгалтер работает в привычной 1С.</p></div><div class="btns"><span class="live">● онлайн · 15:18</span></div></div>
 <div class="g2"><div class="pan"><h3>Из 1С → в портал</h3>${['Техкарты и калькуляции 36 блюд','Номенклатура сырья и продукции','Контрагенты: поставщики и магазины','Цены закупа'].map(x=>`<div class="ck">✓ ${x}</div>`).join('')}</div>
 <div class="pan"><h3>Из портала → в 1С</h3>${['Поступление товаров (приёмка сканером)','Требование-накладная (выдача в цех)','Отчёт производства за смену (выпуск, списание)','Реализация и счёт-фактура (отгрузка)','Оплаты и возвраты'].map(x=>`<div class="ck">✓ ${x}</div>`).join('')}</div></div>
 <div class="pan"><h3>Журнал обмена</h3><table class="t sm"><tbody>${[['15:18','→ 1С','Оприходование ГП: 5 коробов Г-01','ок'],['14:58','→ 1С','Требование-накладная П-118 (7 позиций)','ок'],['13:30','→ 1С','Реализация Н-2209 «Дала Ойл»','ок'],['08:13','→ 1С','Поступление ПР-341 говядина 1 000 кг','ок'],['06:00','← 1С','Техкарты: изменений 0','ок']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${tag(r[3],'g')}</td></tr>`).join('')}</tbody></table></div>
 ${said('«…чтобы с 1С связано было, потому что в 1С будет забита вся калькуляция на каждое блюдо»')}`;
/* Роли */
const PERM=['Пульт и P&L','Приёмка','Склад сырья','Техкарты','Смены','Склад ГП','Отгрузка','Долги','Маркетплейсы'];
const PM={'Собственник':'111111111','Кладовщик':'011001100','Технолог':'001110000','Бухгалтер':'110000110','Менеджер e-market':'000001001','Торговый представитель':'000000110'};
SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>Каждый видит своё: кладовщик не видит деньги, торговый — только свои магазины. Права — галочками, журнал: кто, когда, что изменил.</p></div></div>
 <div class="pan"><div class="tw"><table class="t perm"><thead><tr><th>Роль</th>${PERM.map(p=>`<th class="c">${p}</th>`).join('')}</tr></thead><tbody>${Object.keys(PM).map(r=>`<tr><td><b>${r}</b><br><small>${esc(ROLES[r].note)}</small></td>${PM[r].split('').map((v,i)=>`<td class="c"><span class="pm ${v==='1'?'on':''}" onclick="this.classList.toggle('on');toast('Право «${PERM[i]}» изменено — запись в журнале.')">${v==='1'?'✓':''}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Журнал действий</h3><table class="t sm"><tbody>${[['15:18','Бауыржан','разместил 5 коробов Г-01 в A-01-2'],['14:58','Бауыржан','выдал говядину 301 кг на П-118'],['13:30','Дана','изменила цену «Тау» → 6 400 ₸'],['08:13','Сауле','поставила ПР-341 в оплату'],['08:12','Бауыржан','принял говядину 1 000 кг']].map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
 <div class="pan"><h3>Пользователи и сервер</h3><p>Без ограничений по количеству пользователей — платить за каждого не нужно. При расширении цеха добавляете людей и сканеры сами.</p><div class="kv"><span>Сервер</span><b>~5–10 $ / мес</b></div><div class="kv"><span>Резервные копии</span><b>ежедневно</b></div></div></div>`;
SC.launch=()=>`<div class="hd"><div><h2>Стоимость</h2><p>Своя система под ваше производство. Платите один раз — код, данные и сервер ваши. Без абонплаты и без оплаты за пользователей.</p></div></div>
 <div class="g2"><div class="pan price"><h3>Стандартный пакет · 2 500 000 ₸ · 4–6 недель</h3>
 ${['Пульт собственника, продажи и финансы, P&L','Приёмка сырья сканером, контроль соответствия, недостачи','Склад сырья онлайн, резервы под смены','Заказ на смену, выдача в цех по техкарте, выход и ужарка','Склад ГП с адресным хранением, инвентаризация','Отгрузка, накладные, консигнация и долги, торговые','Маркетплейсы Kaspi, Ozon, Wildberries + сайт: цены и остатки каждые 30 мин','Claude через MCP: аналитика и ТВ-режим — без доплаты','WhatsApp, Instagram, IP-телефония, роли и журнал','Перенос данных, сервер, бэкапы, обучение, 3 месяца поддержки'].map(x=>`<div class="ck">✓ ${x}</div>`).join('')}</div>
 <div><div class="pan"><h3>Оплата по этапам</h3><table class="t"><tbody><tr><td>Старт · 30%</td><td class="r">${tg(750000)}</td></tr><tr><td>Выкатка базы · 40%</td><td class="r">${tg(1000000)}</td></tr><tr><td>Полировка и сдача · 30%</td><td class="r">${tg(750000)}</td></tr><tr class="sum"><td><b>Пакет</b></td><td class="r"><b>${tg(2500000)}</b></td></tr><tr><td>Интеграция с 1С (техкарты, документы)</td><td class="r">+${tg(800000)}</td></tr></tbody></table></div>
 <div class="pan"><h3>Не входит</h3><div class="ck no">· Сканеры, весы, термопринтер — оборудование ваше</div><div class="ck no">· Подписка Claude и тарифы WhatsApp, телефонии — по факту</div><div class="ck no">· Мобильное приложение в сторе — работает в браузере телефона</div></div></div></div>`;
/* ===== Каркас: верхние вкладки + левая колонка ===== */
function searchDemo(v){if(!v)return;const q=v.toLowerCase();const p=PROD.find(x=>(x.n+x.id).toLowerCase().includes(q));if(p&&allowed('fg')){fgSel=p.id;go('fg');return}const sh=SHOPS.find(x=>(x.n+x.id).toLowerCase().includes(q));if(sh&&allowed('debts')){go('debts');toast('Магазин: <b>'+esc(sh.n)+'</b>');return}const b=BATCH.find(x=>x.id.toLowerCase().includes(q));if(b&&allowed('shift')){go('shift');return}toast('Не найдено. Попробуйте: «плов», «П-118», «Арай».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><span>${s.n}</span></a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=`<h4>${esc(S.n)}</h4>`+S.sub.filter(x=>allowed(x[0])).map((x,i)=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><code>${String(i+1).padStart(2,'0')}</code>${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Сапар Гурме';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
let theme='light';function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[['dash','1 · Пульт: сырьё, смены, склад, продажи, долги — одно окно.'],['recv','2 · Приёмка сканером: тонна говядины — бухгалтер сразу видит.'],['raw','3 · Склад сырья онлайн: минус по каждой выдаче.'],['tech','4 · Техкарты из 1С: нормы, ужарка, выход.'],['order','5 · Заказ на смену → выдача в цех по техкарте.'],['shift','6 · Смена: вышло 3 000 пакетов, потери против нормы.'],['loss','7 · Недостача: где расхождение и кто отвечал.'],['fg','8 · Склад готовой продукции: адрес каждой коробки.'],['ship','9 · Отгрузка магазинам по накладным.'],['debts','10 · Консигнация и дебиторка.'],['mp','11 · Цена в базе → Kaspi, Ozon, WB и сайт за 30 минут.'],['plan','12 · План выпуска: что выпускать в этом месяце.'],['claude','13 · Claude видит портал: вопросы и ТВ-режим.'],['onec','14 · Обмен с 1С: техкарты, приходы, выпуск, реализация.'],['launch','15 · 2,5 млн + 1С 800 тыс., 4–6 недель.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
function stopTour(){tRun=false}
