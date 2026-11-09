/* ЛАКМУС ПРО — производство и торговля товарами для маникюра (Миержан). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='09.11.2026',NOW='16:40';
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>Из встречи</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const vbars=(arr,lab,yi)=>{const m=Math.max(...arr);return `<div class="vbars">${arr.map((v,i)=>`<div class="${yi&&yi.includes(i)?'y':''}" style="height:${Math.max(4,Math.round(v/m*100))}%"><em>${fmt(v)}</em></div>`).join('')}</div><div class="vlab">${lab.map(l=>`<span>${l}</span>`).join('')}</div>`};
const SEC=[
 {k:'sum',n:'Пульт',sub:[['dash','Пульт · 10 филиалов'],['branches','Продажи по филиалам'],['reports','Отчёты']]},
 {k:'pos',n:'Магазины',sub:[['pos','Касса'],['shifts','Смены и Z-отчёт'],['kaspi','Заказы Kaspi']]},
 {k:'opt',n:'Опт',sub:[['wsale','Оптовые заказы'],['agents','Торговые агенты'],['clients','Клиенты: мастера, салоны, опт']]},
 {k:'prod',n:'Производство',sub:[['prod','Заказы на производство'],['spec','Спецификации']]},
 {k:'wh',n:'Склады',sub:[['stock','Остатки по филиалам'],['moves','Перемещения'],['inv','Инвентаризация']]},
 {k:'cab',n:'Кабинеты',sub:[['cab','Кабинет мастера / салона'],['opt','Кабинет оптовика'],['instr','Инструкторы и рефералы'],['bonus','Бонусная программа'],['auth','Проверка подлинности']]},
 {k:'msg',n:'Чаты',sub:[['chat','WhatsApp и Instagram']]},
 {k:'go',n:'Запуск',sub:[['move1c','Переезд с 1С'],['roles','Роли и права'],['launch','Стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'МЖ',n:'Миержан',note:'Всё: 10 филиалов, кассы, опт, производство, склады, кабинеты, деньги',s:ALL.slice()},
 'Оптовый менеджер':{av:'ОМ',n:'Камила · опт',note:'Оптовые заказы, оплаты с чеком, клиенты, кабинеты оптовиков, чаты',s:['wsale','clients','opt','chat','kaspi','stock','agents']},
 'Кассир':{av:'КС',n:'Динара · касса, Алматы',note:'Касса со сканером, бонусы, офлайн, смена и Z-отчёт',s:['pos','shifts','stock']},
 'Кладовщик':{av:'КЛ',n:'Ербол · центральный склад',note:'Сборка заказов, перемещения в филиалы, инвентаризация',s:['stock','moves','inv','wsale','kaspi']},
 'Производство':{av:'ПР',n:'Айгерим · цех розлива',note:'Заказы на производство, спецификации, автосписание, выход',s:['prod','spec','stock']},
 'Торговый агент':{av:'ТА',n:'Мадина · агент, Алматы',note:'С телефона: салоны, остатки, заявка за салон',s:['agents','clients','stock']},
 'Салон / мастер':{av:'СМ',n:'Салон «Люми» · кабинет',note:'Заказ, история, бонусы — с телефона',s:['cab','bonus','auth']},
 'Оптовик':{av:'ОП',n:'Магазин «НейлМаркет», Уральск',note:'Свои оптовые цены, остатки по складу, корзина',s:['opt','auth']},
 'Инструктор':{av:'ИН',n:'Асель · обучающий мастер',note:'Кто пришёл от меня и мои бонусы',s:['instr','bonus']}
};
let role='Собственник',cur='dash';
let ONLINE=true,SYNCQ=[];
const BR=[
 {id:'AKT',n:'Актобе',t:'головной · склад · цех',day:1184000,plan:1300000,chk:96,cash:'Динара Ж.',on:true},
 {id:'ALA',n:'Алматы',t:'магазин · склад',day:1462000,plan:1400000,chk:118,cash:'Динара · касса 1',on:true},
 {id:'AST',n:'Астана',t:'магазин',day:1036000,plan:1100000,chk:84,cash:'Алия',on:true},
 {id:'KRG',n:'Караганда',t:'магазин',day:612000,plan:700000,chk:57,cash:'Жанар',on:false},
 {id:'SHY',n:'Шымкент',t:'магазин',day:884000,plan:900000,chk:79,cash:'Гульназ',on:true},
 {id:'URA',n:'Уральск',t:'магазин',day:402000,plan:520000,chk:41,cash:'Сабина',on:true},
 {id:'ATY',n:'Атырау',t:'магазин',day:538000,plan:560000,chk:46,cash:'Айжан',on:true},
 {id:'AKU',n:'Актау',t:'магазин',day:466000,plan:500000,chk:44,cash:'Мерей',on:true},
 {id:'KOS',n:'Костанай',t:'магазин',day:318000,plan:420000,chk:33,cash:'Томирис',on:true},
 {id:'PAV',n:'Павлодар',t:'магазин',day:354000,plan:400000,chk:36,cash:'Индира',on:true}
];
const BRN=id=>(BR.find(b=>b.id===id)||BR[0]).n;
/* Номенклатура: розница / опт (−40–45%) / остатки по филиалам (AKT, ALA, AST, KRG, SHY, URA, ATY, AKU, KOS, PAV) */
let SKU=[
 {id:'4870101110111',a:'GL-111',n:'Гель-лак 7 мл, цвет 111 «Пион»',g:'Гель-лаки',r:2400,w:1350,st:[1840,210,160,44,120,38,52,47,30,41],min:60},
 {id:'4870101110112',a:'GL-112',n:'Гель-лак 7 мл, цвет 112 «Бордо»',g:'Гель-лаки',r:2400,w:1350,st:[1210,180,96,12,88,40,26,31,22,18],min:60},
 {id:'4870101110140',a:'GL-140',n:'Гель-лак 7 мл, цвет 140 «Нюд»',g:'Гель-лаки',r:2400,w:1350,st:[2260,320,240,90,150,66,70,58,44,60],min:60},
 {id:'4870101120010',a:'BS-10',n:'База каучуковая 15 мл',g:'База и топ',r:3900,w:2200,st:[960,140,110,38,64,22,30,26,18,24],min:40},
 {id:'4870101120020',a:'TP-20',n:'Топ без липкого слоя 15 мл',g:'База и топ',r:3900,w:2200,st:[880,96,88,30,58,9,22,20,14,16],min:40},
 {id:'4870101130030',a:'PG-30',n:'Полигель 30 г, прозрачный',g:'Моделирование',r:5200,w:2900,st:[410,64,52,14,22,11,10,9,8,10],min:20},
 {id:'4870101140005',a:'FL-5',n:'Файл 180/240, 5 шт.',g:'Расходники',r:900,w:480,st:[3200,420,380,150,260,110,90,95,80,88],min:100},
 {id:'4870101150001',a:'LMP-48',n:'Лампа UV/LED 48 Вт',g:'Оборудование',r:18900,w:11200,st:[92,14,10,3,8,2,4,3,2,3],min:5},
 {id:'4870101150020',a:'DR-35',n:'Аппарат для маникюра 35 000 об., Корея',g:'Оборудование',r:38000,w:22500,st:[38,6,5,1,3,0,2,1,1,1],min:3},
 {id:'4870101160001',a:'CL-1',n:'Кисть для дизайна, № 1',g:'Расходники',r:1200,w:650,st:[1100,130,90,40,70,30,25,28,20,22],min:40},
 {id:'4870101170001',a:'OL-15',n:'Масло для кутикулы 15 мл',g:'Уход',r:1500,w:820,st:[1500,200,150,60,90,48,40,38,30,34],min:50},
 {id:'4870101180001',a:'DG-1',n:'Дегидратор 15 мл',g:'Подготовка',r:1900,w:1050,st:[720,88,70,26,40,14,18,15,10,12],min:30}
];
const SK=id=>SKU.find(s=>s.id===id||s.a===id)||SKU[0];
const brI=id=>BR.findIndex(b=>b.id===id);
/* Оптовые заказы: заявка → сборка → накладная → оплата (чек) */
const WST=[['new','Заявка'],['pick','Сборка на складе'],['inv','Расходная накладная'],['paid','Оплачено · чек']];
let WS=[
 {id:'ОЗ-2214',c:'«НейлМаркет», Уральск',m:'Камила',sum:486000,st:'new',src:'кабинет оптовика',it:[['GL-111',120],['GL-140',100],['BS-10',40]],chk:null},
 {id:'ОЗ-2213',c:'ИП Сейткали, Атырау',m:'Камила',sum:312400,st:'new',src:'WhatsApp',it:[['TP-20',60],['FL-5',200]],chk:null},
 {id:'ОЗ-2211',c:'«Бьюти Склад», Актау',m:'Ринат',sum:828000,st:'pick',src:'агент Мадина',it:[['LMP-48',20],['GL-112',150],['DG-1',60]],chk:null},
 {id:'ОЗ-2209',c:'«Мастер-Опт», Шымкент',m:'Ринат',sum:1140000,st:'pick',src:'звонок',it:[['DR-35',20],['BS-10',100],['TP-20',100]],chk:null},
 {id:'ОЗ-2206',c:'«НейлМаркет», Уральск',m:'Камила',sum:402000,st:'inv',src:'кабинет оптовика',it:[['GL-111',80],['OL-15',120]],chk:null},
 {id:'ОЗ-2203',c:'Салон «Люми», Алматы',m:'Мадина',sum:96000,st:'inv',src:'агент Мадина',it:[['GL-140',30],['CL-1',20]],chk:null},
 {id:'ОЗ-2199',c:'«Бьюти Склад», Актау',m:'Ринат',sum:654000,st:'paid',src:'кабинет оптовика',it:[['PG-30',60],['FL-5',400]],chk:'Kaspi Pay · чек 0412'},
 {id:'ОЗ-2196',c:'ИП Нурланова, Костанай',m:'Камила',sum:228000,st:'paid',src:'WhatsApp',it:[['GL-112',100],['DG-1',40]],chk:'перевод · платёжка 118'}
];
const WO=id=>WS.find(o=>o.id===id);
/* Производство */
let PO=[
 {id:'ПЗ-0381',sku:'GL-111',q:600,st:'run',done:420,who:'Айгерим',d:'09.11'},
 {id:'ПЗ-0382',sku:'BS-10',q:400,st:'plan',done:0,who:'Айгерим',d:'10.11'},
 {id:'ПЗ-0380',sku:'GL-140',q:800,st:'done',done:796,who:'Сауле',d:'08.11'},
 {id:'ПЗ-0379',sku:'TP-20',q:400,st:'done',done:400,who:'Сауле',d:'07.11'}
];
const SPEC={
 'GL-111':{out:'Гель-лак 7 мл, цвет 111',items:[['Флакон 7 мл, чёрный','шт',1,38],['Крышка с кистью','шт',1,46],['Наклейка «Лакмус» 111','шт',1,6],['Пигмент «Пион»','г',0.42,90],['Основа гель-лака','мл',7.1,24],['Коробка-индивидуалка','шт',1,22]]},
 'GL-140':{out:'Гель-лак 7 мл, цвет 140',items:[['Флакон 7 мл, чёрный','шт',1,38],['Крышка с кистью','шт',1,46],['Наклейка «Лакмус» 140','шт',1,6],['Пигмент «Нюд»','г',0.36,84],['Основа гель-лака','мл',7.1,24],['Коробка-индивидуалка','шт',1,22]]},
 'BS-10':{out:'База каучуковая 15 мл',items:[['Флакон 15 мл, белый','шт',1,52],['Крышка с кистью','шт',1,46],['Наклейка «База»','шт',1,6],['Каучуковая основа','мл',15.2,41],['Коробка-индивидуалка','шт',1,22]]},
 'TP-20':{out:'Топ без липкого слоя 15 мл',items:[['Флакон 15 мл, белый','шт',1,52],['Крышка с кистью','шт',1,46],['Наклейка «Топ»','шт',1,6],['Основа топа','мл',15.2,44],['Коробка-индивидуалка','шт',1,22]]}
};
let MAT={'Флакон 7 мл, чёрный':[9400,'шт'],'Флакон 15 мл, белый':[2100,'шт'],'Крышка с кистью':[7800,'шт'],'Наклейка «Лакмус» 111':[1200,'шт'],'Наклейка «Лакмус» 140':[3400,'шт'],'Наклейка «База»':[900,'шт'],'Наклейка «Топ»':[1400,'шт'],'Пигмент «Пион»':[640,'г'],'Пигмент «Нюд»':[880,'г'],'Основа гель-лака':[38000,'мл'],'Каучуковая основа':[9100,'мл'],'Основа топа':[11200,'мл'],'Коробка-индивидуалка':[6100,'шт']};
/* Перемещения */
let MV=[
 {id:'ПМ-1044',to:'URA',st:'new',it:[['TP-20',40],['GL-112',60]],why:'ниже минимума'},
 {id:'ПМ-1043',to:'KRG',st:'pick',it:[['GL-112',50],['BS-10',30],['DR-35',3]],why:'заявка филиала'},
 {id:'ПМ-1042',to:'ALA',st:'road',it:[['GL-111',150],['LMP-48',8]],why:'заявка филиала'},
 {id:'ПМ-1040',to:'AST',st:'done',it:[['GL-140',100]],why:'заявка филиала'}
];
const MVS=[['new','Заявка филиала'],['pick','Собирается'],['road','В пути'],['done','Принято филиалом']];
/* Клиенты */
let CL=[
 {id:'K-0912',n:'Салон «Люми»',t:'салон',city:'Алматы',ag:'Мадина',ref:'Асель',bon:18400,ltv:1240000,last:'05.11',ph:'+7 707 512 44 10'},
 {id:'K-0877',n:'Мастер Жанель Б.',t:'мастер',city:'Алматы',ag:'—',ref:'Асель',bon:6200,ltv:286000,last:'08.11',ph:'+7 778 401 22 19'},
 {id:'K-0841',n:'Студия «Нюанс»',t:'салон',city:'Астана',ag:'Ержан',ref:'—',bon:9800,ltv:812000,last:'31.10',ph:'+7 701 300 18 77'},
 {id:'K-0790',n:'«НейлМаркет»',t:'оптовик',city:'Уральск',ag:'—',ref:'—',bon:0,ltv:6420000,last:'09.11',ph:'+7 705 611 09 31'},
 {id:'K-0766',n:'«Бьюти Склад»',t:'оптовик',city:'Актау',ag:'—',ref:'—',bon:0,ltv:9180000,last:'07.11',ph:'+7 702 455 71 02'},
 {id:'K-0731',n:'Мастер Айдана С.',t:'мастер',city:'Шымкент',ag:'—',ref:'Гульмира',bon:3100,ltv:142000,last:'02.11',ph:'+7 747 200 15 63'},
 {id:'K-0705',n:'Салон «Пальчики»',t:'салон',city:'Алматы',ag:'Мадина',ref:'—',bon:12800,ltv:968000,last:'14.10',ph:'+7 777 130 52 88'},
 {id:'K-0688',n:'«Мастер-Опт»',t:'оптовик',city:'Шымкент',ag:'—',ref:'—',bon:0,ltv:7760000,last:'06.11',ph:'+7 701 890 33 14'}
];
/* Агенты и салоны на маршруте */
let VISITS=[
 {s:'Салон «Люми», Абая 52',st:'заказ',sum:96000},
 {s:'Салон «Пальчики», Жандосова 8',st:'нет 26 дней — позвонить',sum:0},
 {s:'Студия «Нейл Арт», Сатпаева 30',st:'новый салон',sum:0},
 {s:'Салон «Шёлк», Розыбакиева 120',st:'сейчас',sum:0}
];
let ACART={};
const SC={};
/* ===== Пульт ===== */
SC.dash=()=>{const day=BR.reduce((a,b)=>a+b.day,0),plan=BR.reduce((a,b)=>a+b.plan,0),chk=BR.reduce((a,b)=>a+b.chk,0);const low=[];SKU.forEach(s=>s.st.forEach((q,i)=>{if(q<s.min&&i>0)low.push([s,i])}));
 return `<div class="hd"><div><h2>Пульт · ${TODAY}, ${NOW}</h2><p>Десять филиалов, центральный склад и цех в Актобе, опт, Kaspi и кабинеты клиентов — в одной своей системе. Открыли — увидели, не спрашивая никого.</p></div><div class="btns"><button class="bt" onclick="xlsDay()">Excel</button><button class="bt p" onclick="go('branches')">Филиалы</button></div></div>
 <div class="strip"><div><small>Розница сегодня · 10 касс</small><b>${tg(day)}</b>${bar(pct(day,plan),'g')}<span>${pct(day,plan)}% дневного плана · ${chk} чеков</span></div><div><small>Опт · заказы в работе</small><b>${WS.filter(o=>o.st!=='paid').length}</b><span>${tg(WS.filter(o=>o.st!=='paid').reduce((a,o)=>a+o.sum,0))}</span></div><div><small>Kaspi сегодня</small><b>${KASPI.length} заказов</b><span>пришли сами, без ручного ввода</span></div><div><small>Цех · розлив</small><b>${fmt(PO[0].done)} / ${fmt(PO[0].q)}</b><span>${esc(SK(PO[0].sku).n.split(',')[0])} 111</span></div><div><small>Касса без интернета</small><b class="${BR.some(b=>!b.on)?'bad':''}">${BR.filter(b=>!b.on).length}</b><span>${BR.filter(b=>!b.on).map(b=>b.n).join(', ')||'все онлайн'} · продают офлайн</span></div></div>
 <div class="g21"><div>
  <div class="pan"><h3>Филиалы сейчас</h3><div class="tw"><table class="t"><thead><tr><th>Филиал</th><th>Тип</th><th class="r">Выручка</th><th style="width:18%">к плану дня</th><th class="r">Чеков</th><th class="r">Ср. чек</th><th>Связь</th></tr></thead><tbody>${BR.map(b=>`<tr onclick="go('branches')"><td><b>${b.n}</b></td><td class="mini">${b.t}</td><td class="r">${tg(b.day)}</td><td>${bar(pct(b.day,b.plan),pct(b.day,b.plan)<85?'r':'g')}</td><td class="r">${b.chk}</td><td class="r">${tg(b.day/b.chk)}</td><td>${b.on?tag('онлайн','g'):tag('офлайн · очередь 7 чеков','w')}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="pan"><h3>Выручка по дням, тыс. ₸</h3><p>Все каналы: розница, опт, Kaspi. Выделены выходные.</p>${vbars([7420,7860,6980,8240,9610,10420,7310,7580,8100,7260],['31','01','02','03','04','05','06','07','08','09'],[5,6])}</div>
 </div><div>
  <div class="pan"><h3>Требует внимания</h3><div class="alist">
   <a onclick="go('shifts')"><i class="dt w"></i><b>Караганда без интернета 38 минут</b><span>касса продаёт офлайн · 7 чеков ждут синхронизации</span></a>
   <a onclick="go('wsale')"><i class="dt i"></i><b>2 оптовые заявки ждут сборки</b><span>«НейлМаркет» пришла из кабинета оптовика</span></a>
   <a onclick="go('stock')"><i class="dt r"></i><b>${low.length} позиций ниже минимума в филиалах</b><span>${low.slice(0,3).map(x=>x[0].a+' · '+BR[x[1]].n).join(', ')}</span></a>
   <a onclick="go('moves')"><i class="dt w"></i><b>Перемещение ПМ-1044 в Уральск не собрано</b><span>топ и «Бордо» на нуле</span></a>
   <a onclick="go('clients')"><i class="dt i"></i><b>Салон «Пальчики» не заказывал 26 дней</b><span>задача агенту Мадине</span></a>
   <a onclick="go('kaspi')"><i class="dt g"></i><b>Kaspi: ${KASPI.length} заказа сегодня — уже в системе</b><span>раньше менеджер вбивал руками</span></a>
  </div></div>
  ${said('Нам нужна целая экосистема. Не просто кассовая зона.','Здесь всё сходится в одном пульте: кассы, опт, цех, склады и кабинеты клиентов.')}
 </div></div>`};
function xlsDay(){const h=`<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>Филиал</th><th>Выручка</th><th>План</th><th>Чеков</th></tr>${BR.map(b=>`<tr><td>${b.n}</td><td>${b.day}</td><td>${b.plan}</td><td>${b.chk}</td></tr>`).join('')}</table></body></html>`;try{const b=new Blob(['﻿'+h],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Филиалы_'+TODAY+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}toast('Файл <b>Филиалы.xls</b> скачан.')}
let brSel='ALA';
SC.branches=()=>{const b=BR.find(x=>x.id===brSel);const i=brI(brSel);
 return `<div class="hd"><div><h2>Продажи по филиалам</h2><p>Розница, опт и Kaspi по каждому городу; что продаётся и чего не хватает на полке.</p></div></div>
 <div class="chipr">${BR.map(x=>`<a class="${x.id===brSel?'on':''}" onclick="brSel='${x.id}';render()">${x.n}</a>`).join('')}</div>
 <div class="strip"><div><small>${b.n} · сегодня</small><b>${tg(b.day)}</b><span>план ${tg(b.plan)}</span></div><div><small>Чеков</small><b>${b.chk}</b><span>средний ${tg(b.day/b.chk)}</span></div><div><small>Месяц к прошлому</small><b class="ok">+12%</b><span>ноябрь 1–9</span></div><div><small>Кассир</small><b style="font-size:15px">${esc(b.cash)}</b><span>${b.on?'онлайн':'офлайн-режим'}</span></div></div>
 <div class="g2"><div class="pan"><h3>Топ продаж · ${b.n}, ноябрь</h3><div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">Продано</th><th class="r">Остаток</th><th></th></tr></thead><tbody>${SKU.slice().sort((x,y)=>y.st[0]-x.st[0]).slice(0,8).map((s,k)=>`<tr><td>${esc(s.n)}</td><td class="r">${[184,162,140,96,88,71,60,44][k]}</td><td class="r ${s.st[i]<s.min?'bad':''}">${s.st[i]}</td><td>${s.st[i]<s.min?tag('пополнить','r'):''}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Каналы, ноябрь 1–9</h3><div class="kv"><span>Розница (касса)</span><b>${tg(b.day*7.6)}</b></div><div class="kv"><span>Опт из филиала</span><b>${tg(b.day*2.1)}</b></div><div class="kv"><span>Kaspi (самовывоз из филиала)</span><b>${tg(b.day*0.9)}</b></div><div class="kv"><span>Бонусами оплачено</span><b>${tg(b.day*0.18)}</b></div><div class="kv tot"><span>Итого</span><b>${tg(b.day*10.78)}</b></div><button class="bt full" onclick="go('reports')">Все отчёты →</button></div></div>`};
SC.reports=()=>`<div class="hd"><div><h2>Отчёты</h2><p>Отчёты, которые сейчас собираете из 1С вручную, — по кнопке. Список дополним на полировке под ваши вопросы.</p></div><div class="btns"><button class="bt" onclick="xlsDay()">Excel</button></div></div>
 <div class="g2"><div class="pan"><h3>Отчёты собственника</h3><div class="alist">${[['Продажи по филиалам и дням','branches'],['Валовая прибыль по товарам и группам','reports'],['Оптовые клиенты: выручка, долг, частота','clients'],['Касса: чеки, возвраты, бонусы, Z-отчёты','shifts'],['Производство: план-факт, списание материалов','prod'],['Остатки и неликвид по филиалам','stock'],['Агенты: визиты, заявки, новые салоны','agents'],['Рефералы инструкторов и начисленные бонусы','instr']].map(r=>`<a onclick="go('${r[1]}')"><i class="dt i"></i><b>${r[0]}</b><span>за день, неделю, месяц · Excel</span></a>`).join('')}</div></div>
 <div class="pan"><h3>Валовая прибыль по группам, октябрь</h3><div class="tw"><table class="t"><thead><tr><th>Группа</th><th class="r">Выручка</th><th class="r">Себест.</th><th class="r">Маржа</th></tr></thead><tbody>${[['Гель-лаки',38400000,12100000],['База и топ',16200000,5300000],['Оборудование',21800000,15600000],['Расходники',9400000,4100000],['Уход и подготовка',6100000,2000000]].map(r=>`<tr><td>${r[0]}</td><td class="r">${tg(r[1])}</td><td class="r">${tg(r[2])}</td><td class="r"><b>${pct(r[1]-r[2],r[1])}%</b></td></tr>`).join('')}</tbody></table></div></div></div>`;
/* ===== Касса ===== */
let POSC=[['GL-140',2],['BS-10',1]],POSB=false,POSN=1287;
function posAdd(a){const r=POSC.find(x=>x[0]===a);if(r)r[1]++;else POSC.push([a,1]);render()}
function posScan(){const pick=['GL-111','TP-20','FL-5','OL-15','CL-1','DG-1'][POSN%6];POSN++;posAdd(pick);toast('Пик! Штрихкод '+SK(pick).id+' — '+esc(SK(pick).n))}
function posQ(a,d){const r=POSC.find(x=>x[0]===a);r[1]+=d;if(r[1]<=0)POSC=POSC.filter(x=>x[0]!==a);render()}
function posTot(){return POSC.reduce((s,x)=>s+SK(x[0]).r*x[1],0)}
function posPay(m){if(!POSC.length){toast('Чек пустой — отсканируйте товар.');return}const t=posTot(),bon=POSB?Math.min(6200,Math.round(t*.3)):0;const c={n:'Ч-'+POSN++,t:t-bon,m,bon,at:NOW};if(ONLINE){toast(`Чек <b>${c.n}</b> на ${tg(c.t)} пробит${bon?`, списано ${tg(bon)} бонусов`:''}. Начислено ${tg(Math.round(c.t*.03))} бонусов клиенту.`)}else{SYNCQ.push(c);toast(`Нет интернета — чек <b>${c.n}</b> сохранён на кассе. В очереди: ${SYNCQ.length}. Отправим, как только появится сеть.`)}POSC=[];POSB=false;render()}
function netToggle(){ONLINE=!ONLINE;if(ONLINE&&SYNCQ.length){const n=SYNCQ.length;SYNCQ=[];toast(`Интернет вернулся — ${n} чек(ов) синхронизированы: остатки, выручка и бонусы обновлены.`)}else toast(ONLINE?'Онлайн.':'Интернет пропал. Касса продолжает продавать: чеки копятся на компьютере.');render()}
SC.pos=()=>{const t=posTot(),bon=POSB?Math.min(6200,Math.round(t*.3)):0;
 return `<div class="hd"><div><h2>Касса · Алматы, касса 1</h2><p>В браузере на весь экран, сканер штрихкодов, бонусы клиента. Если пропал интернет — касса продолжает продавать, а потом сама досылает чеки.</p></div><div class="btns"><button class="bt ${ONLINE?'':'p'}" onclick="netToggle()">${ONLINE?'⦿ Онлайн — выключить интернет':'○ Офлайн — включить интернет'}</button></div></div>
 <div class="posw ${ONLINE?'':'off'}"><div class="posl">
  <div class="posbar"><button class="bt p" onclick="posScan()">▮▯▮ Сканировать</button><span class="mini">или выберите:</span>${['GL-111','GL-112','TP-20','FL-5','LMP-48'].map(a=>`<button class="bt sm" onclick="posAdd('${a}')">${a}</button>`).join('')}</div>
  <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">Цена</th><th class="r">Кол-во</th><th class="r">Сумма</th></tr></thead><tbody>${POSC.map(x=>{const s=SK(x[0]);return `<tr><td><b>${esc(s.n)}</b><br><code class="mini">${s.id}</code></td><td class="r">${tg(s.r)}</td><td class="r"><button class="bt sm" onclick="posQ('${x[0]}',-1)">−</button> ${x[1]} <button class="bt sm" onclick="posQ('${x[0]}',1)">+</button></td><td class="r">${tg(s.r*x[1])}</td></tr>`}).join('')||'<tr><td colspan="4" class="mini">Чек пустой — нажмите «Сканировать»</td></tr>'}</tbody></table></div>
 </div><div class="posr">
  <div class="kv"><span>Клиент</span><b>Жанель Б. · мастер</b></div><div class="kv"><span>Бонусов на счёте</span><b>6 200 ₸</b></div>
  <label class="chk"><input type="checkbox" ${POSB?'checked':''} onchange="POSB=this.checked;render()"> Списать бонусы (до 30% чека)</label>
  <div class="kv"><span>Сумма</span><b>${tg(t)}</b></div>${bon?`<div class="kv"><span>Бонусы</span><b>−${tg(bon)}</b></div>`:''}<div class="kv tot"><span>К оплате</span><b>${tg(t-bon)}</b></div>
  <button class="bt p full" onclick="posPay('наличные')">Наличные</button><button class="bt p full" onclick="posPay('карта')">Карта</button><button class="bt full" onclick="posPay('Kaspi QR')">Kaspi QR</button>
  <div class="syncb ${ONLINE?'':'w'}"><b>${ONLINE?'Онлайн':'Офлайн-режим'}</b><span>${SYNCQ.length?`В очереди ${SYNCQ.length} чек(ов): ${SYNCQ.map(c=>c.n).join(', ')}`:'Очередь пустая — всё отправлено'}</span></div>
 </div></div>
 ${said('Интернет отключился… чтобы менеджеры могли работать, продавать, и как только сеть появляется — она обратно синхронизируется.','Попробуйте: выключите интернет кнопкой сверху, пробейте пару чеков и включите снова.')}`};
SC.shifts=()=>`<div class="hd"><div><h2>Смены и Z-отчёт</h2><p>Открытие и закрытие смены, наличные в кассе, возвраты, бонусы. Z-отчёт по каждому филиалу — и сводный у собственника.</p></div><div class="btns"><button class="bt p" onclick="toast('Смена закрыта. Z-отчёт № 318 сформирован и отправлен собственнику.')">Закрыть смену</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Филиал</th><th>Кассир</th><th>Смена</th><th class="r">Чеков</th><th class="r">Наличные</th><th class="r">Карта / QR</th><th class="r">Бонусы</th><th class="r">Возвраты</th><th>Связь</th></tr></thead><tbody>${BR.map((b,i)=>`<tr><td><b>${b.n}</b></td><td>${esc(b.cash)}</td><td class="mini">10:00 – открыта</td><td class="r">${b.chk}</td><td class="r">${tg(b.day*.34)}</td><td class="r">${tg(b.day*.6)}</td><td class="r">${tg(b.day*.06)}</td><td class="r">${i%4===1?tg(4800):'—'}</td><td>${b.on?tag('онлайн','g'):tag('офлайн · 7 чеков в очереди','w')}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2"><div class="pan"><h3>Z-отчёт · Алматы, вчера</h3><div class="kv"><span>Чеков</span><b>126</b></div><div class="kv"><span>Наличные</span><b>${tg(512000)}</b></div><div class="kv"><span>Карта и Kaspi QR</span><b>${tg(918000)}</b></div><div class="kv"><span>Оплачено бонусами</span><b>${tg(64000)}</b></div><div class="kv"><span>Возвраты</span><b>${tg(9600)}</b></div><div class="kv tot"><span>Выручка</span><b>${tg(1494000)}</b></div></div>
 <div class="pan"><h3>Офлайн за неделю</h3><p>Сколько касс работали без интернета и сколько чеков досланы автоматически — ни одного потерянного.</p><div class="kv"><span>Караганда, сегодня</span><b>38 мин · 7 чеков</b></div><div class="kv"><span>Уральск, 06.11</span><b>2 ч 10 мин · 31 чек ✓</b></div><div class="kv"><span>Актау, 04.11</span><b>25 мин · 4 чека ✓</b></div></div></div>`;
/* ===== Kaspi ===== */
let KASPI=[
 {id:'KSP-58201',it:'Лампа UV/LED 48 Вт',sum:18900,br:'Алматы',st:'новый'},
 {id:'KSP-58197',it:'Гель-лак 111 × 3, топ',sum:11100,br:'Астана',st:'собирается'},
 {id:'KSP-58190',it:'Аппарат 35 000 об.',sum:38000,br:'Шымкент',st:'передан курьеру'},
 {id:'KSP-58184',it:'База 15 мл × 2',sum:7800,br:'Алматы',st:'выдан'}
];
SC.kaspi=()=>`<div class="hd"><div><h2>Заказы Kaspi</h2><p>Заказы с Kaspi приходят в систему сами: товар резервируется в нужном филиале, остатки и цены на Kaspi обновляются из портала. Руками ничего не вбиваем.</p></div><div class="btns"><button class="bt" onclick="toast('Цены и остатки отправлены на Kaspi: 12 товаров, 10 складов.')">Обновить цены на Kaspi</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Заказ</th><th>Товар</th><th class="r">Сумма</th><th>Филиал выдачи</th><th>Статус</th><th></th></tr></thead><tbody>${KASPI.map((k,i)=>`<tr><td><code>${k.id}</code></td><td>${esc(k.it)}</td><td class="r">${tg(k.sum)}</td><td>${k.br}</td><td>${tag(k.st,k.st==='новый'?'w':k.st==='выдан'?'g':'')}</td><td>${k.st==='новый'?`<button class="bt sm p" onclick="KASPI[${i}].st='собирается';render();toast('Заказ принят, товар зарезервирован в филиале.')">Принять</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 ${said('Менеджеры просто руками забивают.','Теперь Kaspi-заказ сразу в системе: резерв, сборка, выдача, выручка в отчётах.')}`;
function posDemoOff(){ONLINE=false;SYNCQ=[{n:'Ч-1285'}];SYNCQ.push({n:'Ч-1286'});POSB=true}
/* ===== Опт ===== */
function wNext(id){const o=WO(id);const i=WST.findIndex(s=>s[0]===o.st);if(i>=WST.length-1)return;if(WST[i+1][0]==='paid'){wPay(id);return}o.st=WST[i+1][0];render();toast(o.st==='pick'?'Склад получил лист сборки.':'Расходная накладная № РН-'+o.id.slice(3)+' сформирована, остатки списаны.')}
function wPay(id){const o=WO(id);openM('Оплата '+id,esc(o.c)+' · '+tg(o.sum),`<div class="kv"><span>Способ</span><b><select class="sel" id="wpm"><option>Kaspi Pay</option><option>Перевод на счёт</option><option>Наличные</option></select></b></div><div class="kv"><span>Чек / платёжка</span><b><button class="bt sm" onclick="this.textContent='чек_${id}.jpg ✓'">Прикрепить фото</button></b></div><button class="bt p full" onclick="wPaid('${id}')">Отметить оплату</button>`)}
function wPaid(id){const o=WO(id);o.st='paid';o.chk=(document.getElementById('wpm')||{}).value+' · чек прикреплён';closeM();render();toast('Оплата отмечена, чек прикреплён. Собственник видит деньги в пульте.')}
function wOpen(id){const o=WO(id);openM('Заказ '+id,esc(o.c)+' · менеджер '+o.m+' · источник: '+o.src,`<table class="t sm"><thead><tr><th>Товар</th><th class="r">Кол-во</th><th class="r">Опт. цена</th><th class="r">Остаток АКТ</th></tr></thead><tbody>${o.it.map(x=>{const s=SK(x[0]);return `<tr><td>${esc(s.n)}</td><td class="r">${x[1]}</td><td class="r">${tg(s.w)}</td><td class="r ${s.st[0]<x[1]?'bad':''}">${s.st[0]}</td></tr>`}).join('')}</tbody></table><div class="kv tot"><span>Итого</span><b>${tg(o.sum)}</b></div>${o.chk?`<div class="kv"><span>Оплата</span><b>${esc(o.chk)}</b></div>`:''}`)}
SC.wsale=()=>`<div class="hd"><div><h2>Оптовые заказы</h2><p>Как сейчас в 1С, только быстрее: заявка → склад собирает → расходная накладная → менеджер отмечает оплату и прикрепляет чек. Заявки приходят и из кабинета оптовика, от агентов, из WhatsApp.</p></div><div class="btns"><button class="bt p" onclick="WS.unshift({id:'ОЗ-'+(2215+WS.length),c:'Новый клиент',m:'Камила',sum:150000,st:'new',src:'звонок',it:[['GL-140',60]],chk:null});render()">+ Заказ</button></div></div>
 <div class="kanban k4">${WST.map(([k,n])=>`<div class="kcol"><div class="kh"><b>${n}</b><span>${WS.filter(o=>o.st===k).length} · ${tg(WS.filter(o=>o.st===k).reduce((a,o)=>a+o.sum,0))}</span></div>${WS.filter(o=>o.st===k).map(o=>`<div class="kc" onclick="wOpen('${o.id}')"><code>${o.id} · ${esc(o.src)}</code><b>${esc(o.c)}</b><em>${tg(o.sum)}</em><span>${o.m}${o.chk?' · '+esc(o.chk):''}</span>${k!=='paid'?`<button class="bt sm full" onclick="event.stopPropagation();wNext('${o.id}')">${k==='inv'?'Отметить оплату →':'Дальше →'}</button>`:''}</div>`).join('')}</div>`).join('')}</div>`;
/* ===== Агенты ===== */
function agAdd(a,d){ACART[a]=Math.max(0,(ACART[a]||0)+d);render()}
function agSend(){const it=Object.entries(ACART).filter(x=>x[1]>0);if(!it.length){toast('Добавьте товары в заявку.');return}const sum=it.reduce((s,x)=>s+SK(x[0]).w*x[1],0);WS.unshift({id:'ОЗ-'+(2220+WS.length),c:'Салон «Шёлк», Алматы',m:'Мадина',sum,st:'new',src:'агент Мадина',it,chk:null});VISITS[3].st='заказ';VISITS[3].sum=sum;ACART={};render();toast('Заявка за салон «Шёлк» на '+tg(sum)+' ушла в филиал Алматы — склад начал сборку.')}
SC.agents=()=>`<div class="hd"><div><h2>Торговые агенты</h2><p>Агент ходит по салонам с телефоном: видит остатки ближайшего склада и оформляет заявку за салон. Значок на экране телефона, push-уведомления.</p></div></div>
 <div class="g21"><div>
  <div class="pan"><h3>Агенты · ноябрь</h3><div class="tw"><table class="t"><thead><tr><th>Агент</th><th>Город</th><th class="r">Визитов</th><th class="r">Заявок</th><th class="r">Сумма</th><th class="r">Новые салоны</th></tr></thead><tbody>${[['Мадина','Алматы',46,31,2840000,4],['Ержан','Астана',38,22,1960000,3],['Гульмира','Шымкент',29,18,1220000,2],['Нурлан','Караганда',21,9,640000,0]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="r">${r[2]}</td><td class="r">${r[3]}</td><td class="r">${tg(r[4])}</td><td class="r">${r[5]}</td></tr>`).join('')}</tbody></table></div></div>
  ${said('Нам нужно, чтобы у неё было приложение, на котором она сможет сразу создавать заявку.','Справа — телефон агента. Добавьте товары и отправьте заявку: она появится в «Оптовых заказах».')}
 </div><div class="phone3"><div class="phs"><div class="phtop"><b>Мадина · сегодня</b><span>${VISITS.length} салона</span></div>${VISITS.map(v=>`<div class="ci2"><span>${esc(v.s)}</span><b>${v.st}${v.sum?' · '+tg(v.sum):''}</b></div>`).join('')}
  <h4 style="margin:10px 0 4px;font-size:12px">Заявка за «Шёлк» · склад Алматы</h4>${['GL-111','GL-140','BS-10','TP-20'].map(a=>{const s=SK(a);return `<div class="ci2"><span>${esc(s.n.replace('Гель-лак 7 мл, ',''))}<br><small class="mini">остаток ${s.st[1]} · ${tg(s.w)}</small></span><b><button class="bt sm" onclick="agAdd('${a}',-5)">−</button> ${ACART[a]||0} <button class="bt sm" onclick="agAdd('${a}',5)">+</button></b></div>`}).join('')}
  <button class="bt p full" onclick="agSend()">Отправить заявку</button></div></div></div>`;
/* ===== Клиенты ===== */
let clT='all';
SC.clients=()=>{const L=CL.filter(c=>clT==='all'||c.t===clT);
 return `<div class="hd"><div><h2>Клиенты: мастера, салоны, оптовики</h2><p>Каждый клиент с типом цены: розница для мастеров и салонов, персональные оптовые цены для оптовиков. История, бонусы, кто привёл, какой агент ведёт.</p></div></div>
 <div class="seg">${[['all','Все'],['мастер','Мастера'],['салон','Салоны'],['оптовик','Оптовики']].map(x=>`<a class="${clT===x[0]?'on':''}" onclick="clT='${x[0]}';render()">${x[1]}</a>`).join('')}</div>
 <div class="tw" style="margin-top:10px"><table class="t"><thead><tr><th>Клиент</th><th>Тип</th><th>Город</th><th>Цены</th><th>Агент</th><th>Пришёл от</th><th class="r">Бонусы</th><th class="r">Покупки всего</th><th>Последний заказ</th></tr></thead><tbody>${L.map(c=>`<tr onclick="clOpen('${c.id}')"><td><b>${esc(c.n)}</b><br><span class="mini">${c.ph}</span></td><td>${tag(c.t,c.t==='оптовик'?'i':'')}</td><td>${c.city}</td><td>${c.t==='оптовик'?'опт −43%':'розница'}</td><td>${c.ag}</td><td>${c.ref}</td><td class="r">${c.bon?tg(c.bon):'—'}</td><td class="r">${tg(c.ltv)}</td><td>${c.last}</td></tr>`).join('')}</tbody></table></div>`};
function clOpen(id){const c=CL.find(x=>x.id===id);openM(esc(c.n),c.t+' · '+c.city,`<div class="kv"><span>Тип цены</span><b>${c.t==='оптовик'?'Оптовая −43% (галочка «оптовик» ✓)':'Розничная'}</b></div><div class="kv"><span>Бонусы</span><b>${tg(c.bon)}</b></div><div class="kv"><span>Пришёл от инструктора</span><b>${c.ref}</b></div><div class="kv"><span>Покупки всего</span><b>${tg(c.ltv)}</b></div><div class="kv"><span>Последние</span><b>${c.last}: гель-лаки, база, топ</b></div><button class="bt p full" onclick="closeM();go('chat')">Написать в WhatsApp</button>`)}
/* ===== Производство ===== */
function poRun(id){const o=PO.find(x=>x.id===id);if(o.st==='plan'){o.st='run';render();toast('Заказ на производство запущен: материалы выданы в цех по спецификации.');return}const sp=SPEC[o.sku];const add=o.q-o.done;sp.items.forEach(it=>{MAT[it[0]][0]-=it[2]*add});SK(o.sku).st[0]+=add;o.done=o.q;o.st='done';render();toast(`Розлив закончен: +${add} шт. «${esc(sp.out)}» на склад Актобе. Материалы списаны автоматически.`)}
SC.prod=()=>`<div class="hd"><div><h2>Заказы на производство</h2><p>Заказ → розлив → выход готовой продукции. Ингредиенты и упаковка списываются автоматически по спецификации, готовый товар приходуется на центральный склад.</p></div><div class="btns"><button class="bt p" onclick="PO.unshift({id:'ПЗ-0'+(383+PO.length),sku:'GL-140',q:500,st:'plan',done:0,who:'Айгерим',d:'11.11'});render()">+ Заказ на производство</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Заказ</th><th>Продукт</th><th class="r">План</th><th class="r">Готово</th><th style="width:16%"></th><th>Ответственный</th><th>Дата</th><th>Статус</th><th></th></tr></thead><tbody>${PO.map(o=>`<tr><td><code>${o.id}</code></td><td><b>${esc(SPEC[o.sku].out)}</b></td><td class="r">${o.q}</td><td class="r">${o.done}</td><td>${bar(pct(o.done,o.q),'g')}</td><td>${o.who}</td><td>${o.d}</td><td>${tag({plan:'план',run:'розлив',done:'готово'}[o.st],o.st==='done'?'g':o.st==='run'?'w':'')}</td><td>${o.st!=='done'?`<button class="bt sm p" onclick="poRun('${o.id}')">${o.st==='plan'?'Запустить':'Завершить розлив'}</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2"><div class="pan"><h3>Что спишется по ${PO[0].id} · ${PO[0].q} шт.</h3><div class="tw"><table class="t sm"><thead><tr><th>Материал</th><th class="r">На 1 шт.</th><th class="r">На заказ</th><th class="r">Остаток</th></tr></thead><tbody>${SPEC[PO[0].sku].items.map(it=>`<tr><td>${it[0]}</td><td class="r">${it[2]} ${it[1]}</td><td class="r">${fmt(it[2]*PO[0].q)} ${it[1]}</td><td class="r ${MAT[it[0]][0]<it[2]*PO[0].q?'bad':''}">${fmt(MAT[it[0]][0])}</td></tr>`).join('')}</tbody></table></div></div>
 <div>${said('Чтобы этот один гель-лак сделать, он там списывает крышку, списывает, наклейку списывает.','Так и работает: нажмите «Завершить розлив» — материалы спишутся, гель-лак придёт на склад.')}</div></div>`;
let spSel='GL-111';
SC.spec=()=>{const sp=SPEC[spSel];const cost=sp.items.reduce((a,x)=>a+x[2]*x[3],0);
 return `<div class="hd"><div><h2>Спецификации</h2><p>Состав каждого продукта: флакон, крышка с кистью, наклейка, пигмент, основа, коробка. Из спецификации — автосписание и себестоимость.</p></div></div>
 <div class="chipr">${Object.keys(SPEC).map(k=>`<a class="${k===spSel?'on':''}" onclick="spSel='${k}';render()">${SPEC[k].out}</a>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>${sp.out}</h3><div class="tw"><table class="t"><thead><tr><th>Компонент</th><th class="r">Норма</th><th class="r">Цена ед.</th><th class="r">В себестоимости</th></tr></thead><tbody>${sp.items.map(x=>`<tr><td>${x[0]}</td><td class="r">${x[2]} ${x[1]}</td><td class="r">${tg(x[3])}</td><td class="r">${tg(x[2]*x[3])}</td></tr>`).join('')}</tbody></table></div><div class="kv tot"><span>Себестоимость 1 шт.</span><b>${tg(cost)}</b></div></div>
 <div class="pan"><h3>Цены и маржа</h3><div class="kv"><span>Розничная цена</span><b>${tg(SK(spSel).r)}</b></div><div class="kv"><span>Оптовая цена</span><b>${tg(SK(spSel).w)}</b></div><div class="kv"><span>Маржа в рознице</span><b>${pct(SK(spSel).r-cost,SK(spSel).r)}%</b></div><div class="kv"><span>Маржа в опте</span><b>${pct(SK(spSel).w-cost,SK(spSel).w)}%</b></div><button class="bt full" onclick="toast('Новая версия спецификации сохранена. Старые заказы считаются по старой.')">Изменить состав</button></div></div>`};
/* ===== Склады ===== */
let stG='all';
SC.stock=()=>`<div class="hd"><div><h2>Остатки по филиалам</h2><p>Центральный склад в Актобе и 10 магазинов в одной таблице. Красное — ниже минимума: система предлагает перемещение.</p></div><div class="btns"><button class="bt p" onclick="mvAuto()">Сформировать перемещения</button></div></div>
 <div class="seg">${['all','Гель-лаки','База и топ','Оборудование','Расходники'].map(g=>`<a class="${stG===g?'on':''}" onclick="stG='${g}';render()">${g==='all'?'Все':g}</a>`).join('')}</div>
 <div class="tw" style="margin-top:10px"><table class="t sm"><thead><tr><th>Товар</th>${BR.map(b=>`<th class="r">${b.n.slice(0,4)}</th>`).join('')}</tr></thead><tbody>${SKU.filter(s=>stG==='all'||s.g===stG).map(s=>`<tr><td><b>${esc(s.n)}</b><br><code class="mini">${s.a} · ${s.id}</code></td>${s.st.map((q,i)=>`<td class="r ${i>0&&q<s.min?'bad':''}">${q}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function mvAuto(){MV.unshift({id:'ПМ-'+(1045+MV.length),to:'KRG',st:'new',it:[['GL-112',60],['TP-20',30]],why:'авто: ниже минимума'});toast('Создано перемещение в Караганду по минимальным остаткам.');go('moves')}
function mvNext(id){const m=MV.find(x=>x.id===id);const i=MVS.findIndex(s=>s[0]===m.st);if(i<MVS.length-1){m.st=MVS[i+1][0];if(m.st==='done'){const k=brI(m.to);m.it.forEach(x=>{SK(x[0]).st[k]+=x[1];SK(x[0]).st[0]-=x[1]})}render()}}
SC.moves=()=>`<div class="hd"><div><h2>Перемещения</h2><p>Филиал заказывает с центрального склада — склад собирает — в пути — филиал принимает сканером. Остатки меняются на обоих складах.</p></div></div>
 <div class="kanban k4">${MVS.map(([k,n])=>`<div class="kcol"><div class="kh"><b>${n}</b><span>${MV.filter(m=>m.st===k).length}</span></div>${MV.filter(m=>m.st===k).map(m=>`<div class="kc"><code>${m.id} · ${m.why}</code><b>Актобе → ${BRN(m.to)}</b><span>${m.it.map(x=>x[0]+' × '+x[1]).join(', ')}</span>${k!=='done'?`<button class="bt sm full" onclick="mvNext('${m.id}')">Дальше →</button>`:''}</div>`).join('')}</div>`).join('')}</div>`;
let INV=null;
SC.inv=()=>{if(!INV)INV=SKU.slice(0,8).map(s=>({a:s.a,book:s.st[1],fact:null}));const done=INV.filter(r=>r.fact!==null).length;
 return `<div class="hd"><div><h2>Инвентаризация · Алматы</h2><p>Сканируете полку — система сравнивает с учётом и показывает расхождения. Итог — акт и корректировка остатков.</p></div><div class="btns"><button class="bt p" onclick="invScan()">▮▯▮ Сканировать следующую</button><button class="bt" onclick="INV=null;render()">Заново</button></div></div>
 <div class="strip"><div><small>Проверено</small><b>${done} / ${INV.length}</b>${bar(pct(done,INV.length),'g')}<span>позиций</span></div><div><small>Расхождения</small><b class="${INV.some(r=>r.fact!==null&&r.fact!==r.book)?'bad':''}">${INV.filter(r=>r.fact!==null&&r.fact!==r.book).length}</b><span>ждут объяснения</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">По учёту</th><th class="r">Факт</th><th class="r">Разница</th></tr></thead><tbody>${INV.map(r=>`<tr><td>${esc(SK(r.a).n)}</td><td class="r">${r.book}</td><td class="r">${r.fact===null?'—':r.fact}</td><td class="r ${r.fact!==null&&r.fact!==r.book?'bad':''}">${r.fact===null?'':r.fact-r.book}</td></tr>`).join('')}</tbody></table></div>`};
function invScan(){const r=INV.find(x=>x.fact===null);if(!r){toast('Всё проверено. Акт инвентаризации готов к подписи.');return}r.fact=r.a==='GL-112'?r.book-2:r.book;render()}
/* ===== Кабинет мастера / салона ===== */
let CC={},CBON=18400;
function ccAdd(a,d){CC[a]=Math.max(0,(CC[a]||0)+d);render()}
function ccSend(){const it=Object.entries(CC).filter(x=>x[1]>0);if(!it.length){toast('Корзина пустая.');return}const sum=it.reduce((s,x)=>s+SK(x[0]).r*x[1],0);CBON+=Math.round(sum*.03);WS.unshift({id:'ОЗ-'+(2230+WS.length),c:'Салон «Люми», Алматы',m:'Мадина',sum,st:'new',src:'кабинет салона',it,chk:null});CC={};render();toast('Заказ на '+tg(sum)+' отправлен в филиал Алматы. Начислено '+tg(Math.round(sum*.03))+' бонусов.')}
SC.cab=()=>{const sum=Object.entries(CC).reduce((s,x)=>s+SK(x[0]).r*x[1],0);
 return `<div class="hd"><div><h2>Кабинет салона «Люми»</h2><p>Так видит кабинет мастер или салон — с телефона, по ярлыку на экране. Каталог с наличием в своём городе, корзина, история заказов, бонусы.</p></div></div>
 <div class="g21"><div><div class="pan"><h3>Каталог · наличие в Алматы</h3><div class="catg">${SKU.slice(0,9).map(s=>`<div class="catc"><i class="sw" style="background:${{'GL-111':'#d98a9b','GL-112':'#7a1f34','GL-140':'#e6c3ae'}[s.a]||'#cbb7a8'}"></i><b>${esc(s.n)}</b><span>${tg(s.r)} · ${s.st[1]>0?'есть '+s.st[1]:'нет'}</span><div><button class="bt sm" onclick="ccAdd('${s.a}',-1)">−</button> ${CC[s.a]||0} <button class="bt sm" onclick="ccAdd('${s.a}',1)">+</button></div></div>`).join('')}</div></div>
  ${said('Чтобы она могла отслеживать свои бонусы, историю, смотреть, что она покупала, когда покупала — как личный кабинет.')}</div>
 <div><div class="pan"><h3>Корзина</h3><div class="kv"><span>Товаров</span><b>${Object.values(CC).reduce((a,b)=>a+b,0)}</b></div><div class="kv tot"><span>Сумма</span><b>${tg(sum)}</b></div><button class="bt p full" onclick="ccSend()">Заказать</button></div>
 <div class="pan"><h3>Бонусы</h3><div class="kv"><span>На счёте</span><b>${tg(CBON)}</b></div><div class="kv"><span>Уровень</span><b>Салон · 3% с покупок</b></div><div class="kv"><span>Сгорят 31.12</span><b>${tg(2400)}</b></div></div>
 <div class="pan"><h3>История</h3>${[['05.11','ОЗ-2203',96000],['21.10','ОЗ-2118',142000],['02.10','ОЗ-2040',88000]].map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b>${tg(r[2])}</b></div>`).join('')}<button class="bt full" onclick="toast('Повтор заказа ОЗ-2203 добавлен в корзину.');CC={'GL-140':30,'CL-1':20};render()">Повторить последний</button></div></div></div>`};
/* ===== Кабинет оптовика ===== */
let OC={'GL-111':60,'BS-10':20},OWH='AKT';
function ocAdd(a,d){OC[a]=Math.max(0,(OC[a]||0)+d);render()}
function ocSend(){const it=Object.entries(OC).filter(x=>x[1]>0);if(!it.length){toast('Корзина пустая.');return}const sum=it.reduce((s,x)=>s+SK(x[0]).w*x[1],0);WS.unshift({id:'ОЗ-'+(2240+WS.length),c:'«НейлМаркет», Уральск',m:'Камила',sum,st:'new',src:'кабинет оптовика',it,chk:null});OC={};render();toast('Заявка на '+tg(sum)+' ушла менеджеру Камиле — она уже в «Оптовых заказах».')}
SC.opt=()=>{const k=brI(OWH);const sum=Object.entries(OC).reduce((s,x)=>s+SK(x[0]).w*x[1],0);
 return `<div class="hd"><div><h2>Кабинет оптовика · «НейлМаркет», Уральск</h2><p>Оптовик регистрируется, менеджер ставит галочку «оптовик» — и он видит свои цены (−40–45%) и живые остатки выбранного склада. Розничные мастера этих цен не видят.</p></div></div>
 <div class="seg">${['AKT','ALA','URA'].map(w=>`<a class="${OWH===w?'on':''}" onclick="OWH='${w}';render()">Склад ${BRN(w)}</a>`).join('')}</div>
 <div class="g21" style="margin-top:10px"><div class="pan"><div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">Розница</th><th class="r">Ваша цена</th><th class="r">В наличии</th><th class="r">В корзине</th></tr></thead><tbody>${SKU.map(s=>`<tr><td>${esc(s.n)}</td><td class="r mini"><s>${tg(s.r)}</s></td><td class="r"><b>${tg(s.w)}</b></td><td class="r ${s.st[k]<10?'bad':''}">${s.st[k]}</td><td class="r"><button class="bt sm" onclick="ocAdd('${s.a}',-10)">−</button> ${OC[s.a]||0} <button class="bt sm" onclick="ocAdd('${s.a}',10)">+</button></td></tr>`).join('')}</tbody></table></div></div>
 <div><div class="pan"><h3>Заявка</h3><div class="kv"><span>Склад отгрузки</span><b>${BRN(OWH)}</b></div><div class="kv"><span>Позиций</span><b>${Object.values(OC).filter(x=>x>0).length}</b></div><div class="kv tot"><span>Сумма по оптовым ценам</span><b>${tg(sum)}</b></div><button class="bt p full" onclick="ocSend()">Отправить менеджеру</button></div>
 ${said('Мы им создаём аккаунт, она заходит на этот сайт, и у неё свои цены выходят.','Сейчас у вас корзина без остатков. Здесь — свои цены и живые остатки выбранного склада.')}</div></div>`};
/* ===== Инструкторы ===== */
SC.instr=()=>`<div class="hd"><div><h2>Инструкторы и рефералы</h2><p>Обучающий мастер даёт ученикам свой код или ссылку. Ученица регистрируется — и инструктор видит, кто от него пришёл, сколько купил и какой бонус начислен.</p></div><div class="btns"><button class="bt p" onclick="toast('Ссылка скопирована: lakmus.kz/r/ASEL — QR для сертификата учениц тоже готов.')">Моя ссылка и QR</button></div></div>
 <div class="strip"><div><small>Асель · пришло учениц</small><b>23</b><span>за 3 месяца · 14 покупают</span></div><div><small>Их покупки</small><b>${tg(1846000)}</b><span>с октября</span></div><div><small>Бонус инструктора</small><b class="ok">${tg(92300)}</b><span>5% от покупок учениц</span></div></div>
 <div class="g2"><div class="pan"><h3>Кто пришёл от Асель</h3><div class="tw"><table class="t"><thead><tr><th>Ученица</th><th>Курс</th><th>Пришла</th><th class="r">Купила</th><th class="r">Бонус Асель</th></tr></thead><tbody>${[['Жанель Б.','Базовый маникюр','12.08',286000],['Салон «Люми» (Аружан)','Аппаратный','03.09',412000],['Дана К.','Базовый маникюр','12.08',96000],['Томирис А.','Дизайн','01.10',58000],['Карина Е.','Аппаратный','03.09',0]].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="r">${tg(r[3])}</td><td class="r">${tg(r[3]*.05)}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Инструкторы · рейтинг</h3>${[['Асель, Алматы',23,92300],['Гульмира, Шымкент',17,61400],['Алина, Астана',11,38900],['Жанна, Актобе',8,22100]].map(r=>`<div class="kv"><span>${r[0]} · ${r[1]} учениц</span><b>${tg(r[2])}</b></div>`).join('')}${said('Нам бы тоже хотелось, чтоб они видели, кто от них пришёл, какой бонус они получают.')}</div></div>`;
/* ===== Бонусы ===== */
SC.bonus=()=>`<div class="hd"><div><h2>Бонусная программа</h2><p>Своя бонусная система вместо модуля 1С, который «слетает». Правила настраиваются: процент, уровни, сгорание, сколько можно списать за раз.</p></div></div>
 <div class="g2"><div class="pan"><h3>Правила</h3>${[['Мастер, розница','3% с покупки'],['Салон','3% + 1% при заказе от 100 000 ₸'],['Списание','до 30% чека'],['Сгорание','через 6 месяцев без покупок'],['День рождения','+2 000 ₸'],['Инструктор','5% от покупок учениц']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}<button class="bt full" onclick="toast('Правила сохранены — действуют во всех 10 кассах и кабинетах.')">Изменить правила</button></div>
 <div class="pan"><h3>Ноябрь</h3><div class="kv"><span>Начислено</span><b>${tg(486000)}</b></div><div class="kv"><span>Списано в кассах</span><b>${tg(312000)}</b></div><div class="kv"><span>Сгорело</span><b>${tg(18400)}</b></div><div class="kv"><span>Клиентов с бонусами</span><b>3 412</b></div><div class="kv"><span>Ошибок начисления</span><b class="ok">0</b></div>${said('Одинэсовские бонусы постоянно слетают, постоянно что-то не так.')}</div></div>`;
/* ===== Проверка подлинности ===== */
let AUQ='KR-35A-2025-004812',AUR=null;
SC.auth=()=>`<div class="hd"><div><h2>Проверка подлинности аппарата</h2><p>Страница сайта: покупатель вводит серийный номер корейского аппарата — система проверяет его по базе поставок и показывает, где и когда он продан.</p></div></div>
 <div class="g2"><div class="pan"><h3>Введите серийный номер</h3><input class="sel" style="width:100%" value="${AUQ}" oninput="AUQ=this.value"><button class="bt p full" onclick="AUR=AUQ.trim().toUpperCase()==='KR-35A-2025-004812'?1:0;render()">Проверить</button>${AUR===null?'':AUR?`<div class="syncb"><b>✓ Оригинал</b><span>Аппарат 35 000 об., партия 2025-10 · продан 14.10.2026, филиал Алматы · гарантия до 14.10.2027</span></div>`:`<div class="syncb w"><b>Номер не найден</b><span>Возможно, подделка. Позвоните нам: +7 700 000 00 00</span></div>`}</div>
 <div class="pan"><h3>Откуда данные</h3><p>Серийные номера сканируются при приходе партии на склад и при продаже на кассе — отдельно вести таблицу не нужно.</p><div class="kv"><span>Аппаратов в базе</span><b>1 284</b></div><div class="kv"><span>Проверок за месяц</span><b>312</b></div><div class="kv"><span>Не найдено</span><b class="bad">9</b></div></div></div>
 <div class="pan"><h3>Последние проверки</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Серийный номер</th><th>Город</th><th>Результат</th></tr></thead><tbody>${[['16:22','KR-35A-2025-004812','Алматы',1],['15:40','KR-35A-2025-003117','Атырау',1],['14:05','KR-35A-2024-99X01','Актобе',0],['12:47','KR-48L-2025-000214','Астана',1]].map(r=>`<tr><td>${r[0]}</td><td><code>${r[1]}</code></td><td>${r[2]}</td><td>${r[3]?tag('оригинал','g'):tag('не найден','r')}</td></tr>`).join('')}</tbody></table></div></div>${said('Чтобы они могли в любой момент проверить на этом сайте, подлинный или нет.','Номера уже в базе: сканируются при приходе партии и при продаже — сайт берёт их из портала.')}`;
/* ===== Чаты ===== */
let CHS=0;
const CHATS=[
 {n:'Салон «Люми»',ch:'WhatsApp · опт',m:[['in','Добрый день! Есть «Бордо» 112 в Алматы?'],['out','Есть 180 шт. Оформить 30?'],['in','Да, и топ 10 шт']]},
 {n:'@nails_by_dana',ch:'Instagram',m:[['in','Сколько стоит лампа 48 Вт?'],['out','18 900 ₸, есть во всех филиалах']]},
 {n:'«НейлМаркет», Уральск',ch:'WhatsApp · опт',m:[['in','Заявку отправила из кабинета, посмотрите'],['out','Видим ОЗ-2214, собираем']]},
 {n:'Мастер Айдана С.',ch:'WhatsApp · розница',m:[['in','Где ближайший магазин в Шымкенте?']]}
];
SC.chat=()=>{const c=CHATS[CHS];return `<div class="hd"><div><h2>WhatsApp и Instagram</h2><p>Все номера WhatsApp (оптовый, розница, филиалы) и Instagram в одном окне. Переписка сохраняется в карточке клиента; ответить можно с оптовыми ценами и остатками под рукой.</p></div></div>
 <div class="g21"><div class="pan"><div class="chl">${CHATS.map((x,i)=>`<a class="${i===CHS?'on':''}" onclick="CHS=${i};render()"><b>${esc(x.n)}</b><span>${x.ch}</span></a>`).join('')}</div></div>
 <div class="pan"><h3>${esc(c.n)} <small class="mini">${c.ch}</small></h3><div class="wchat">${c.m.map(m=>`<div class="wm ${m[0]}">${esc(m[1])}</div>`).join('')}</div><div class="btns l"><button class="bt" onclick="CHATS[CHS].m.push(['out','Остатки: 112 «Бордо» — 180 шт. в Алматы']);render()">Вставить остатки</button><button class="bt p" onclick="CHATS[CHS].m.push(['out','Заказ оформлен, номер пришлём сюда']);render();toast('Сделка создана из чата.')">Оформить заказ</button></div></div></div>`};
/* ===== Переезд с 1С ===== */
SC.move1c=()=>`<div class="hd"><div><h2>Переезд с 1С без остановки</h2><p>Бизнес продолжает работать в 1С, пока портал не готов. Переходим филиал за филиалом, после сверки. Если нужно, бухгалтерия продолжает получать документы в 1С.</p></div></div>
 <div class="stepr">${[['1','Недели 1–2','Демо → база портала: справочники, цены, остатки из 1С'],['2','Недели 3–4','Цех, склады, опт, касса в одном филиале параллельно с 1С'],['3','Недели 5–6','Кабинеты, агенты, Kaspi, бонусы, остальные филиалы'],['4','Недели 7–8','Инвентаризация, сверка, 1С остаётся только для бухгалтерии или отключается']].map(s=>`<div><b>${s[0]}</b><strong>${s[1]}</strong><span>${s[2]}</span></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Что переносим из 1С</h3>${['Номенклатура, штрихкоды, цены (розница и опт)','Остатки по 10 складам','Клиенты, оптовики, бонусные счета','Спецификации производства','Открытые заказы и долги'].map(x=>`<div class="kv"><span>${x}</span><b class="ok">✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Что меняется для вас</h3><div class="kv"><span>Подписка 1С и сеансы</span><b>не нужна</b></div><div class="kv"><span>Пользователей</span><b>без ограничений</b></div><div class="kv"><span>Сервер</span><b>свой, ~$5–10 в мес.</b></div><div class="kv"><span>Код и база</span><b>ваши</b></div>${said('Хотелось бы свою экосистему полностью, чтоб не приходилось каждый месяц оплачивать.')}</div></div>`;
/* ===== Роли ===== */
const PERM=['Пульт и деньги','Касса','Опт и оплаты','Производство','Склады','Агентский телефон','Клиенты и бонусы','Цены и опт. цены'];
const PM={'Собственник':'11111111','Оптовый менеджер':'00100011','Кассир':'01000010','Кладовщик':'00101000','Производство':'00011000','Торговый агент':'00000110'};
SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>Каждый видит только своё: кассир не видит оптовые цены, агент — чужих салонов, клиенты — только свой кабинет. Пользователей сколько угодно, без лимита сеансов.</p></div></div>
 <div class="tw"><table class="t perm"><thead><tr><th>Роль</th>${PERM.map(p=>`<th>${p}</th>`).join('')}</tr></thead><tbody>${Object.entries(PM).map(([r,m])=>`<tr><td><b>${r}</b></td>${m.split('').map(x=>`<td>${x==='1'?'✓':'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="g2"><div class="pan"><h3>Клиентские входы</h3><div class="kv"><span>Салон / мастер</span><b>каталог, заказ, история, бонусы</b></div><div class="kv"><span>Оптовик</span><b>свои цены, остатки, заявка</b></div><div class="kv"><span>Инструктор</span><b>ученицы и бонусы</b></div></div><div class="pan"><h3>Журнал действий</h3><div class="kv"><span>16:31 Камила</span><b>ОЗ-2206 → накладная</b></div><div class="kv"><span>16:12 Айгерим</span><b>ПЗ-0381 розлив 420 шт.</b></div><div class="kv"><span>15:58 Динара</span><b>возврат 4 800 ₸</b></div></div></div>`;
/* ===== Стоимость ===== */
let OPTS={c1:true,site:true};
SC.launch=()=>{const t=2800000+(OPTS.c1?800000:0)+(OPTS.site?400000:0);
 return `<div class="hd"><div><h2>Стоимость</h2><p>Своя система, без подписок и лимитов пользователей. Демо ни к чему не обязывает — здесь просто цифры, чтобы было от чего отталкиваться.</p></div></div>
 <div class="g21"><div class="pan price"><h3>Портал · стандартный пакет — 2 800 000 ₸</h3><p>Пульт и отчёты, касса с офлайн-режимом в 10 филиалах, оптовые заказы, производство и спецификации, склады и перемещения, кабинеты салона, оптовика и инструктора, телефон агента, бонусы и рефералы, Kaspi, WhatsApp и Instagram, роли.</p>
  <label class="pan opt ${OPTS.c1?'on':''}"><input type="checkbox" ${OPTS.c1?'checked':''} onchange="OPTS.c1=this.checked;render()"> <b>Перенос и интеграция с 1С — 800 000 ₸</b><br><span class="mini">данные из 1С, параллельная работа, выгрузка документов бухгалтерии</span></label>
  <label class="pan opt ${OPTS.site?'on':''}"><input type="checkbox" ${OPTS.site?'checked':''} onchange="OPTS.site=this.checked;render()"> <b>Сайт — <s>800 000</s> 400 000 ₸</b><br><span class="mini">розница публично, опт по входу, проверка подлинности; скидка 50% при заказе вместе с порталом</span></label>
 </div><div class="pan"><h3>Итого</h3><div class="kv tot"><span>Сумма</span><b>${tg(t)}</b></div><div class="kv"><span>30% — старт</span><b>${tg(t*.3)}</b></div><div class="kv"><span>40% — база работает</span><b>${tg(t*.4)}</b></div><div class="kv"><span>30% — сдача</span><b>${tg(t*.3)}</b></div><div class="kv"><span>Срок</span><b>4–6 недель + 1–2 на 1С</b></div><div class="kv"><span>Поддержка</span><b>3 месяца бесплатно</b></div><div class="kv"><span>Абонплата</span><b>нет</b></div></div></div>`};
/* ===== Каркас: верхние вкладки + левая колонка ===== */
function searchDemo(v){if(!v)return;const q=v.toLowerCase();const c=CL.find(x=>(x.n+x.city).toLowerCase().includes(q));if(c&&allowed('clients')){go('clients');clOpen(c.id);return}const k=SKU.find(x=>(x.n+x.a+x.id).toLowerCase().includes(q));if(k&&allowed('stock')){go('stock');toast('Товар: <b>'+esc(k.n)+'</b>');return}toast('Не найдено. Попробуйте: «Люми», «111», «лампа».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><span>${s.n}</span></a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=`<h4>${esc(S.n)}</h4>`+S.sub.filter(x=>allowed(x[0])).map((x,i)=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><code>${String(i+1).padStart(2,'0')}</code>${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Лакмус Про';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
let theme='light';function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[['dash','1 · Пульт: 10 филиалов, опт, цех, Kaspi — одно окно.'],['pos','2 · Касса: сканер, бонусы и офлайн-режим.'],['shifts','3 · Смены и Z-отчёты всех касс.'],['wsale','4 · Опт: заявка → сборка → накладная → оплата с чеком.'],['agents','5 · Телефон агента: заявка за салон.'],['opt','6 · Кабинет оптовика: свои цены и остатки.'],['cab','7 · Кабинет салона: заказ, история, бонусы.'],['instr','8 · Инструкторы видят своих учениц и бонус.'],['prod','9 · Производство: розлив и автосписание.'],['stock','10 · Остатки по 10 филиалам.'],['moves','11 · Перемещения в филиалы.'],['kaspi','12 · Kaspi-заказы приходят сами.'],['chat','13 · WhatsApp и Instagram в одном окне.'],['move1c','14 · Переезд с 1С без остановки.'],['launch','15 · 2,8 млн + 1С + сайт, без подписок.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
function stopTour(){tRun=false}
