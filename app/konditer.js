/* Кондитерская · единый портал сети — демо по карте бизнес-процессов. Данные демонстрационные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const mln=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n/1e6);

/* ===== РОЛИ ===== */
const ROLES={
 'Собственник':{av:'СБ',n:'Жасулан',r:'управляющая компания',note:'Вся сеть: продажи, производство, деньги, франчайзи',
  s:['dash','inbox','orders','points','delivery','clients','loyalty','prod','plan','recipes','writeoff','stock','purchase','suppliers','moves','menu','campaigns','site','franch','fdash','staff','finance','reports','integr','audit']},
 'Оператор колл-центра':{av:'КЦ',n:'Айгерим',r:'приём заказов',note:'Обращения из всех каналов, заказы тортов на дату',
  s:['inbox','orders','clients','delivery','menu']},
 'Кассир на точке':{av:'КА',n:'Динара',r:'точка 1 · Абая',note:'Касса, продажи с витрины, остатки и заявка на завтра',
  s:['pos','point','moves','menu','writeoff']},
 'Технолог производства':{av:'ТП',n:'Гульмира',r:'цех',note:'План выпуска, горячий и холодный цех, техкарты, списание',
  s:['prod','recipes','plan','writeoff','stock']},
 'Заведующий складом':{av:'СК',n:'Ержан',r:'склад и закуп',note:'Сырьё, поставщики, приём, перемещения и возвраты',
  s:['stock','purchase','moves','suppliers']},
 'Диспетчер доставки':{av:'ДД',n:'Марат',r:'логистика',note:'Заказы на доставку, курьеры, маршруты и статусы',
  s:['delivery','orders','points','clients']},
 'Маркетолог':{av:'МК',n:'Алина',r:'маркетинг и CRM',note:'Лояльность, клиентская база, кампании и лиды',
  s:['loyalty','clients','campaigns','site','reports']},
 'Франчайзи':{av:'ФР',n:'Партнёр · Караганда',r:'франшиза',note:'Свой кабинет: продажи, заказ в УК, обучение, поддержка',
  s:['fdash','forder','fsupport','pos']},
 'Администратор':{av:'АД',n:'Администратор',r:'настройки',note:'Роли, точки, интеграции, журнал действий',
  s:['users','integr','audit','reports']}
};
let role='Собственник',cur='dash',theme='light',scope='all';

const NAV=[
 ['ПРОДАЖИ И КЛИЕНТЫ',[['dash','◧','Сводка сети'],['inbox','✉','Обращения',6],['orders','▦','Заказы',4],['pos','▤','Касса'],['point','◍','Моя точка'],['points','⌂','Точки сети'],['delivery','⇢','Доставка',3],['clients','◉','Клиенты'],['loyalty','♥','Лояльность']]],
 ['ПРОИЗВОДСТВО',[['prod','⚗','Цех и выпуск',2],['plan','◱','План на завтра'],['recipes','☰','Техкарты'],['writeoff','⊘','Списание и брак']]],
 ['СКЛАД И ЗАКУП',[['stock','▥','Склад',1],['purchase','⇩','Закуп'],['suppliers','⛭','Поставщики'],['moves','⇄','Перемещения',2],['menu','☷','Ассортимент']]],
 ['МАРКЕТИНГ',[['campaigns','◎','Кампании и лиды'],['site','⌸','Сайт и приложение']]],
 ['ФРАНШИЗА И УК',[['franch','⚑','Франчайзинговая сеть'],['fdash','◨','Кабинет франчайзи'],['forder','⇪','Заказ в УК'],['fsupport','☏','Поддержка УК'],['staff','☺','Персонал и обучение']]],
 ['ДЕНЬГИ И НАСТРОЙКИ',[['finance','₸','Финансы'],['reports','◲','Отчёты'],['users','◍','Пользователи'],['integr','⚟','Интеграции'],['audit','◷','Журнал']]]
];
const TITLES={
 dash:['Сводка сети','Продажи всех точек, производство, доставка и деньги на одном экране'],
 inbox:['Обращения','Instagram, TikTok, сайт, приложение и звонки — одной лентой с таймером ответа'],
 orders:['Заказы','Заказные торты на дату и онлайн-заказы: от заявки до выдачи'],
 pos:['Касса точки','Продажа с витрины: чек за несколько касаний, оплата Kaspi или наличными'],
 point:['Моя точка','Витрина, остатки, выручка смены и заявка на завтрашний привоз'],
 points:['Точки сети','Три собственные точки: выручка, средний чек, остатки и списания'],
 delivery:['Доставка','Заказы, курьеры, маршруты и статусы — от сборки до вручения'],
 clients:['Клиенты','База с историей заказов, любимыми позициями и датами праздников'],
 loyalty:['Система лояльности','Карты, бонусы, сегменты и напоминания о днях рождения'],
 prod:['Цех и выпуск','Горячий и холодный цех: что печём сейчас, что уже готово'],
 plan:['План на завтра','Система считает выпуск из заказов, остатков точек и прогноза продаж'],
 recipes:['Техкарты','Состав, нормы сырья и себестоимость каждой позиции'],
 writeoff:['Списание и брак','Что списали по сроку и браку — с причиной и виновником'],
 stock:['Склад','Сырьё и готовая продукция: остатки, сроки годности, минимальные запасы'],
 purchase:['Закуп','Потребность в сырье, заявки поставщикам и приход'],
 suppliers:['Поставщики','Цены, сроки поставки и качество по каждому поставщику'],
 moves:['Перемещения и возвраты','Отгрузка продукции на точки и возврат нереализованного'],
 menu:['Ассортимент','Витринные позиции и заказные торты с ценами и себестоимостью'],
 campaigns:['Кампании и лиды','Таргет, блогеры, TikTok: расход, лиды, заказы и стоимость заказа'],
 site:['Сайт и приложение','Витрина, заказ онлайн, разделы для франшизы и поставщиков'],
 franch:['Франчайзинговая сеть','Партнёры, их выручка, роялти, закуп в УК и соблюдение стандартов'],
 fdash:['Кабинет франчайзи','То, что видит партнёр: свои продажи, заказы и поддержка'],
 forder:['Заказ в управляющую компанию','Партнёр заказывает продукцию и сырьё у УК'],
 fsupport:['Поддержка УК','Заявки партнёра в управляющую компанию и база знаний'],
 staff:['Персонал и обучение','Сотрудники, смены и корпоративный университет'],
 finance:['Финансы','Выручка, себестоимость и маржа по точкам, продуктам и каналам'],
 reports:['Отчёты','Любой срез выгружается в Excel'],
 users:['Пользователи','Кто в системе, какая роль и что видит'],
 integr:['Интеграции','WhatsApp, телефония, Kaspi, 1С, сайт и приложение'],
 audit:['Журнал','Кто, что и когда изменил']
};

/* ===== ДАННЫЕ ===== */
const POINTS=[
 {id:'p1',n:'Точка 1 · пр. Абая',rev:1840000,checks:214,avg:8598,ret:3.1,type:'своя'},
 {id:'p2',n:'Точка 2 · ТРЦ «Мега»',rev:2260000,checks:281,avg:8043,ret:2.4,type:'своя'},
 {id:'p3',n:'Точка 3 · ул. Сатпаева',rev:1420000,checks:176,avg:8068,ret:4.8,type:'своя'}
];
const FRANCH=[
 {id:'f1',n:'Караганда · ТРЦ City Mall',owner:'Асхат Б.',rev:1980000,royalty:99000,orders:14,open:'02.2026',st:'работает'},
 {id:'f2',n:'Астана · Сарыарка',owner:'Динара К.',rev:2640000,royalty:132000,orders:19,open:'11.2025',st:'работает'},
 {id:'f3',n:'Шымкент · пр. Кунаева',owner:'Ерлан Т.',rev:0,royalty:0,orders:2,open:'запуск 09.2026',st:'открытие'}
];
const MENU=[
 {id:'m1',n:'Торт «Наполеон» 1 кг',cat:'Торты',price:9800,cost:4100,shelf:3,type:'витрина'},
 {id:'m2',n:'Торт «Медовик» 1 кг',cat:'Торты',price:9200,cost:3850,shelf:3,type:'витрина'},
 {id:'m3',n:'Чизкейк Нью-Йорк 1 кг',cat:'Торты',price:11500,cost:4900,shelf:2,type:'витрина'},
 {id:'m4',n:'Заказной торт (от 2 кг)',cat:'Заказные',price:15000,cost:6200,shelf:2,type:'заказ'},
 {id:'m5',n:'Эклер классический',cat:'Пирожные',price:750,cost:280,shelf:1,type:'витрина'},
 {id:'m6',n:'Макарон, коробка 6 шт',cat:'Пирожные',price:3200,cost:1180,shelf:5,type:'витрина'},
 {id:'m7',n:'Капкейк ассорти, 4 шт',cat:'Пирожные',price:2400,cost:900,shelf:2,type:'витрина'},
 {id:'m8',n:'Круассан с миндалём',cat:'Выпечка',price:900,cost:310,shelf:1,type:'витрина'},
 {id:'m9',n:'Чизкейк порционный',cat:'Пирожные',price:1400,cost:520,shelf:2,type:'витрина'},
 {id:'m10',n:'Кофе латте 0,3',cat:'Напитки',price:1200,cost:340,shelf:0,type:'витрина'}
];
const menu=id=>MENU.find(m=>m.id===id);
const SRC={ig:['Instagram · таргет','var(--violet)'],tt:['TikTok','var(--cyan)'],blog:['Блогеры','var(--amber)'],site:['Сайт','var(--blue)'],app:['Приложение','var(--green)'],call:['Звонок','var(--acc)'],wa:['WhatsApp','var(--wa)']};
const OSTAGES=[['new','НОВЫЙ','var(--blue)'],['confirm','ПОДТВЕРЖДЁН','var(--cyan)'],['pay','ПРЕДОПЛАТА','var(--violet)'],['prod','В ПРОИЗВОДСТВЕ','var(--amber)'],['ready','ГОТОВ','var(--green)'],['done','ВЫДАН','var(--muted)']];
let ORDERS=[
 {id:4218,st:'prod',cl:'Айгерим С.',ph:'+7 707 445 90 12',src:'ig',what:'Торт «Наполеон» 3 кг, надпись «С юбилеем!»',date:'05.09',time:'12:00–14:00',
  sum:30000,paid:15000,cost:12400,deliv:'Доставка · Алматы-1',mgr:'Айгерим',
  chat:[['Клиент','Здравствуйте! Нужен «Наполеон» 3 кг на 5 сентября, с надписью','вчера 14:20','in'],['Айгерим','Да, сделаем. 30 000 ₸, предоплата 50%. Доставим 5-го с 12 до 14.','вчера 14:23','']]},
 {id:4217,st:'ready',cl:'Ерасыл Т.',ph:'+7 701 220 44 18',src:'app',what:'Чизкейк Нью-Йорк 2 кг',date:'сегодня',time:'до 18:00',
  sum:23000,paid:23000,cost:9800,deliv:'Самовывоз · Точка 2',mgr:'Айгерим',chat:[]},
 {id:4216,st:'pay',cl:'ТОО «Астра Офис»',ph:'+7 727 355 10 09',src:'site',what:'Корпоративный заказ: 40 капкейков с логотипом',date:'06.09',time:'к 10:00',
  sum:48000,paid:24000,cost:18600,deliv:'Доставка · офис',mgr:'Айгерим',
  chat:[['Клиент','Нужны капкейки с нашим логотипом на конференцию','сегодня 09:40','in']]},
 {id:4215,st:'confirm',cl:'Мадина К.',ph:'+7 705 918 77 40',src:'tt',what:'Торт «Медовик» 2 кг + 12 макарон',date:'07.09',time:'15:00',
  sum:26400,paid:0,cost:10300,deliv:'Доставка · Алматы-2',mgr:'Айгерим',chat:[]},
 {id:4214,st:'new',cl:'Данияр А.',ph:'+7 747 302 88 15',src:'wa',what:'Заказной торт «единорог» 3 кг, детский',date:'09.09',time:'—',
  sum:34000,paid:0,cost:13800,deliv:'уточняется',mgr:'—',chat:[['Клиент','Скиньте варианты детских тортов','20 мин назад','in']]},
 {id:4213,st:'done',cl:'Гульмира Н.',ph:'+7 702 448 19 03',src:'blog',what:'Торт «Наполеон» 2 кг',date:'31.08',time:'выдан',
  sum:19600,paid:19600,cost:8200,deliv:'Самовывоз · Точка 1',mgr:'Айгерим',chat:[]}
];
let orderSeq=4219;
let LEADS=[
 {id:1,src:'ig',who:'@aliya_k · Instagram',txt:'Сколько стоит торт 3 кг на день рождения? Можно с фото?',t:'3 мин назад',sla:'ok',fresh:1},
 {id:2,src:'tt',who:'+7 747 991 03 55 · TikTok',txt:'Видела ваш ролик, хочу такой же торт-медовик на субботу',t:'11 мин назад',sla:'warn',fresh:1},
 {id:3,src:'call',who:'+7 727 355 10 09 · звонок',txt:'Пропущенный звонок с рекламного номера',t:'18 мин назад',sla:'warn',fresh:1},
 {id:4,src:'app',who:'Приложение · Ерасыл Т.',txt:'Оформил заказ в приложении: чизкейк 2 кг, самовывоз',t:'32 мин назад',sla:'ok',fresh:1},
 {id:5,src:'site',who:'Сайт · форма «Корпоративные заказы»',txt:'40 капкейков с логотипом на конференцию 6 сентября',t:'1 ч назад',sla:'ok',fresh:1},
 {id:6,src:'blog',who:'@astana_food · блогер',txt:'Обсудить бартер: обзор на новый чизкейк',t:'2 ч назад',sla:'ok',fresh:0}
];
let leadSeq=7;
/* производство */
const PSTAGES=[['plan','В ПЛАНЕ','var(--blue)'],['hot','ГОРЯЧИЙ ЦЕХ','var(--red)'],['cold','ХОЛОДНЫЙ ЦЕХ','var(--cyan)'],['pack','УПАКОВКА','var(--violet)'],['ready','ГОТОВО К ОТГРУЗКЕ','var(--green)']];
let BATCH=[
 {id:'ПР-0912',st:'hot',menu:'m1',qty:24,who:'Смена А',start:'05:40',need:'Точки 1–3 + заказ 4218',cost:98400},
 {id:'ПР-0913',st:'cold',menu:'m3',qty:16,who:'Смена А',start:'06:10',need:'Точка 2 + заказ 4217',cost:78400},
 {id:'ПР-0914',st:'pack',menu:'m6',qty:40,who:'Смена А',start:'07:00',need:'Все точки',cost:47200},
 {id:'ПР-0915',st:'plan',menu:'m2',qty:18,who:'Смена Б',start:'план 04.09',need:'Точки 1–3',cost:69300},
 {id:'ПР-0911',st:'ready',menu:'m5',qty:120,who:'Смена А',start:'05:00',need:'Все точки',cost:33600}
];
const RECIPES=[
 {menu:'m1',out:'1 торт 1 кг',items:[['Мука высший сорт','420 г',180],['Масло сливочное 82%','380 г',1520],['Молоко','300 мл',210],['Яйцо','6 шт',420],['Сахар','260 г',150],['Упаковка и коробка','1 шт',620]],work:1000,time:'3,5 ч'},
 {menu:'m3',out:'1 чизкейк 1 кг',items:[['Сыр творожный','700 г',2450],['Печенье песочное','180 г',320],['Масло сливочное 82%','120 г',480],['Яйцо','4 шт',280],['Сахар','180 г',110],['Упаковка','1 шт',560]],work:700,time:'4 ч'},
 {menu:'m5',out:'20 эклеров',items:[['Мука высший сорт','300 г',130],['Масло сливочное 82%','200 г',800],['Яйцо','8 шт',560],['Крем заварной (сырьё)','600 г',1900],['Упаковка','20 шт',400]],work:1800,time:'2,5 ч'},
 {menu:'m6',out:'10 коробок по 6 шт',items:[['Мука миндальная','450 г',3600],['Сахарная пудра','450 г',540],['Белок яичный','360 г',720],['Начинка ассорти','400 г',1800],['Коробка подарочная','10 шт',1900]],work:2600,time:'5 ч'}
];
/* склад */
let STOCK=[
 {n:'Мука высший сорт',cat:'Сырьё',unit:'кг',qty:186,min:80,exp:'12.2026',price:430},
 {n:'Масло сливочное 82%',cat:'Сырьё',unit:'кг',qty:42,min:60,exp:'21.09.2026',price:4000},
 {n:'Сыр творожный',cat:'Сырьё',unit:'кг',qty:64,min:40,exp:'28.09.2026',price:3500},
 {n:'Сахар',cat:'Сырьё',unit:'кг',qty:240,min:100,exp:'06.2027',price:580},
 {n:'Яйцо С1',cat:'Сырьё',unit:'дес.',qty:96,min:60,exp:'14.09.2026',price:700},
 {n:'Мука миндальная',cat:'Сырьё',unit:'кг',qty:11,min:15,exp:'11.2026',price:8000},
 {n:'Коробки под торт 1 кг',cat:'Упаковка',unit:'шт',qty:820,min:400,exp:'—',price:620},
 {n:'Сливки 33%',cat:'Сырьё',unit:'л',qty:58,min:40,exp:'19.09.2026',price:2400}
];
const SUPPLIERS=[
 {n:'ТОО «МолПродукт»',what:'Масло, сливки, молоко',days:2,quality:96,debt:340000,last:'31.08'},
 {n:'ИП Ахметов · мука и сахар',what:'Мука, сахар, крахмал',days:1,quality:99,debt:0,last:'30.08'},
 {n:'ТОО «СырТрейд»',what:'Сыр творожный, маскарпоне',days:3,quality:92,debt:180000,last:'28.08'},
 {n:'ТОО «ПакСервис»',what:'Коробки, подложки, ленты',days:5,quality:98,debt:0,last:'25.08'}
];
let MOVES=[
 {id:'ПМ-1188',dir:'на точку',point:'p1',what:'Наполеон 8, эклеры 40, макарон 6',when:'сегодня 07:20',st:'принято',sum:186000},
 {id:'ПМ-1189',dir:'на точку',point:'p2',what:'Чизкейк 6, капкейки 12, круассаны 30',when:'сегодня 07:35',st:'в пути',sum:214000},
 {id:'ПМ-1190',dir:'возврат',point:'p3',what:'Эклеры 8 (не реализованы)',when:'вчера 21:10',st:'списано',sum:6000}
];
let DELIV=[
 {id:'Д-2094',order:4218,addr:'Алматы, ул. Жандосова 58',when:'05.09 12:00–14:00',courier:'Ерлан',st:'назначена',sum:30000},
 {id:'Д-2093',order:4216,addr:'Алматы, пр. Достык 132, офис 4',when:'06.09 к 10:00',courier:'—',st:'ожидает',sum:48000},
 {id:'Д-2092',order:4215,addr:'Алматы, мкр. Самал-2, д. 33',when:'07.09 15:00',courier:'—',st:'ожидает',sum:26400},
 {id:'Д-2091',order:4213,addr:'Самовывоз · Точка 1',when:'31.08 17:00',courier:'—',st:'выдан',sum:19600}
];
const CLIENTS=[
 {n:'Айгерим С.',ph:'+7 707 445 90 12',orders:7,sum:142000,fav:'Наполеон',bday:'12.09',card:'Золотая',bonus:4260},
 {n:'Ерасыл Т.',ph:'+7 701 220 44 18',orders:4,sum:78000,fav:'Чизкейк',bday:'03.11',card:'Серебряная',bonus:1560},
 {n:'ТОО «Астра Офис»',ph:'+7 727 355 10 09',orders:12,sum:520000,fav:'Капкейки',bday:'—',card:'Корпоратив',bonus:0},
 {n:'Мадина К.',ph:'+7 705 918 77 40',orders:2,sum:34000,fav:'Медовик',bday:'28.09',card:'Базовая',bonus:680},
 {n:'Гульмира Н.',ph:'+7 702 448 19 03',orders:9,sum:187000,fav:'Наполеон',bday:'05.09',card:'Золотая',bonus:5610}
];
const CAMPS=[
 {n:'Instagram · таргет «торты на заказ»',spend:280000,leads:142,orders:38,rev:1140000},
 {n:'TikTok · короткие ролики цеха',spend:120000,leads:96,orders:21,rev:588000},
 {n:'Блогеры · бартер и обзоры',spend:90000,leads:64,orders:18,rev:504000},
 {n:'Сайт и приложение · органика',spend:0,leads:88,orders:34,rev:952000}
];
let TASKS=[];
const AUDIT=[
 ['02.09 08:12','Гульмира','Партия ПР-0912','Запущена в горячий цех, сырьё списано по техкарте'],
 ['02.09 07:35','Ержан','Перемещение ПМ-1189','Отгружено на точку 2, ожидает приёмки'],
 ['02.09 07:20','Динара','Точка 1','Приняла привоз ПМ-1188, расхождений нет'],
 ['01.09 21:10','Айдана','Точка 3','Возврат 8 эклеров, списание по сроку'],
 ['01.09 14:23','Айгерим','Заказ 4218','Создан из обращения Instagram, предоплата 15 000 ₸'],
 ['01.09 10:05','Жасулан','Франшиза Шымкент','Открытие перенесено на сентябрь']
];

/* ===== ЭКРАНЫ ===== */
const SC={};
const netRev=()=>POINTS.reduce((a,p)=>a+p.rev,0);
const ostName=k=>OSTAGES.find(s=>s[0]===k)[1];
const ostColor=k=>OSTAGES.find(s=>s[0]===k)[2];
const scopePoints=()=>scope==='all'?POINTS:POINTS.filter(p=>p.id===scope);

/* --- СВОДКА --- */
SC.dash=()=>{
 const fr=FRANCH.filter(f=>f.rev>0);
 const low=STOCK.filter(s=>s.qty<s.min);
 return `<div class="head"><div><h2>Сводка сети</h2><p>Всё, что раньше было в Yuma и Битриксе, плюс производство и франшиза — в одном экране. Цифры собираются из касс, цеха, склада и заказов: никто не сводит их вручную.</p></div>
 <div class="btns"><button class="btn" onclick="go('finance')">Финансы</button><button class="btn acc" onclick="go('plan')">План на завтра</button></div></div>
 <div class="strip">
  <div><small>ВЫРУЧКА ЗА АВГУСТ</small><b>${mln(netRev()+fr.reduce((a,f)=>a+f.rev,0))} млн ₸</b><span class="g">+14% к июлю</span></div>
  <div><small>СОБСТВЕННЫЕ ТОЧКИ</small><b class="c">${mln(netRev())} млн ₸</b><span>${POINTS.length} точки · чек ${fmt(netRev()/POINTS.reduce((a,p)=>a+p.checks,0))} ₸</span></div>
  <div><small>ФРАНЧАЙЗИ</small><b>${mln(fr.reduce((a,f)=>a+f.rev,0))} млн ₸</b><span>роялти ${fmt(fr.reduce((a,f)=>a+f.royalty,0))} ₸</span></div>
  <div><small>ЗАКАЗОВ В РАБОТЕ</small><b class="a">${ORDERS.filter(o=>o.st!=='done').length}</b><span>на ${fmt(ORDERS.filter(o=>o.st!=='done').reduce((a,o)=>a+o.sum,0))} ₸</span></div>
  <div><small>СЫРЬЁ НИЖЕ МИНИМУМА</small><b class="${low.length?'r':'g'}">${low.length}</b><span>${low.length?low.slice(0,2).map(s=>s.n.split(' ')[0]).join(', '):'всё в норме'}</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Точки сети сегодня</div>
   <div class="ph-sub">выручка, чеки, остатки на витрине и процент списаний</div></div>
   <button class="btn" onclick="go('points')">Все точки →</button></div>
   <div class="tw"><table class="data" style="min-width:700px"><thead><tr><th>Точка</th><th class="right">Выручка за месяц</th><th class="right">Чеков</th><th class="right">Средний чек</th><th class="right">Списания</th><th>Витрина сейчас</th></tr></thead><tbody>
   ${POINTS.map(p=>`<tr onclick="openPoint('${p.id}')"><td><b>${esc(p.n)}</b></td>
    <td class="right mono">${fmt(p.rev)}</td><td class="right mono">${p.checks}</td>
    <td class="right mono">${fmt(p.avg)}</td>
    <td class="right mono" style="color:${p.ret>4?'var(--red)':'var(--green)'}">${num(p.ret)}%</td>
    <td>${p.ret>4?'<span class="badge a">много остатков</span>':'<span class="badge g">в норме</span>'}</td></tr>`).join('')}
   ${FRANCH.filter(f=>f.rev>0).map(f=>`<tr onclick="go('franch')" style="opacity:.85"><td><b>${esc(f.n)}</b><div class="sub">франчайзи · ${f.owner}</div></td>
    <td class="right mono">${fmt(f.rev)}</td><td class="right mono">—</td><td class="right mono">—</td><td class="right mono">—</td>
    <td><span class="badge v">франшиза</span></td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Главное, чего нет сейчас:</b> продажи точек, заказы из Instagram и производство лежат в разных системах, и цифры сходятся только вручную. Здесь чек с кассы, заказ из директа и списание сырья в цехе попадают в один контур в момент события.</div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Требует решения сегодня</div>
    <div class="note" style="--tone:var(--red)"><b>Масло сливочное: 42 кг при минимуме 60</b><p>Хватит на 2 дня выпуска. Заявка поставщику «МолПродукт» подготовлена, поставка — 2 дня.</p></div>
    <div class="note" style="--tone:var(--amber)"><b>Точка 3: списания 4,8% при норме 3%</b><p>Возят больше, чем продают. Система предлагает урезать привоз эклеров и капкейков на 20%.</p></div>
    <div class="note" style="--tone:var(--acc)"><b>3 обращения без ответа дольше 10 минут</b><p>TikTok и пропущенный звонок с рекламного номера — в ленте обращений.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Производство прямо сейчас</div>
    ${BATCH.filter(b=>b.st!=='ready'&&b.st!=='plan').map(b=>{const s=PSTAGES.find(x=>x[0]===b.st);
     return `<div class="kv" style="cursor:pointer" onclick="go('prod')"><span>${esc(menu(b.menu).n)} · ${b.qty} шт</span>
     <b><span class="badge" style="background:${s[2]}1f;color:${s[2]}">${s[1]}</span></b></div>`}).join('')}
    <div class="kv"><span>Выпуск за смену</span><b class="mono">218 позиций</b></div>
    <div class="kv"><span>Себестоимость смены</span><b class="mono">327 000 ₸</b></div>
    <button class="btn" style="width:100%;margin-top:9px" onclick="go('prod')">Открыть цех</button>
   </div>
  </div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Откуда приходят заказы</div>
   ${[['Instagram · таргет',34,'var(--violet)'],['Сайт и приложение',27,'var(--blue)'],['Точки офлайн',21,'var(--acc)'],['TikTok',11,'var(--cyan)'],['Блогеры и рекомендации',7,'var(--amber)']].map(x=>
    `<div class="fr" style="grid-template-columns:180px 1fr 44px"><span>${x[0]}</span><div class="bar"><i style="--w:${x[1]}%;background:${x[2]}"></i></div><b>${x[1]}%</b></div>`).join('')}
   <button class="btn" style="margin-top:8px" onclick="go('campaigns')">Разбор по кампаниям</button>
  </div>
  <div class="panel"><div class="ph-title">Ближайшие заказы на дату</div>
   ${ORDERS.filter(o=>['confirm','pay','prod','ready'].includes(o.st)).slice(0,4).map(o=>
    `<div class="kv" style="cursor:pointer" onclick="openOrder(${o.id})"><span>${o.date} · ${esc(o.cl)}</span>
    <b>${esc(o.what.slice(0,32))}${o.what.length>32?'…':''}</b></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Заказные торты — отдельный поток</b><p>У них своя дата, предоплата и место в плане цеха. Забыть про такой заказ невозможно: он сам встаёт в план производства накануне.</p></div>
  </div>
 </div>`};

/* --- ОБРАЩЕНИЯ --- */
SC.inbox=()=>`
 <div class="head"><div><h2>Обращения</h2><p>Instagram и TikTok, заявки с сайта и приложения, звонки и WhatsApp — в одной ленте. Каждое обращение с таймером ответа: клиент, который ждёт полчаса, уходит к конкуренту.</p></div>
 <div class="btns"><button class="btn" onclick="simLead()">⚡ Показать новое обращение</button><button class="btn acc" onclick="go('orders')">К заказам</button></div></div>
 <div class="strip">
  <div><small>ОБРАЩЕНИЙ СЕГОДНЯ</small><b>${LEADS.length+18}</b><span>по всем каналам</span></div>
  <div><small>БЕЗ ОТВЕТА</small><b class="a">${LEADS.filter(l=>l.sla==='warn').length}</b><span>дольше 10 минут</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ</small><b class="g">4 мин</b><span>норматив 10 минут</span></div>
  <div><small>КОНВЕРСИЯ В ЗАКАЗ</small><b class="c">38%</b><span>из обращения</span></div>
  <div><small>СРЕДНИЙ ЗАКАЗ</small><b>26 400 ₸</b><span>заказные торты</span></div>
 </div>
 <div class="g21">
  <div class="panel" style="padding:0">
   <div style="padding:13px 15px;border-bottom:1px solid var(--line)"><div class="ph-title">Лента обращений</div>
    <div class="ph-sub">из обращения одним нажатием создаётся заказ с датой и предоплатой</div></div>
   ${LEADS.map(l=>`<div style="padding:12px 15px;border-bottom:1px solid var(--line);cursor:pointer;${l.fresh?'background:var(--card2)':''}" onclick="openLead(${l.id})">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
     <div style="flex:1">
      <b style="font-size:11.2px">${esc(l.who)}</b>
      <p style="margin:5px 0 0;font-size:10.6px;color:var(--muted);line-height:1.5">${esc(l.txt)}</p>
      <div style="margin-top:6px"><span class="badge" style="background:${SRC[l.src][1]}22;color:${SRC[l.src][1]}">${SRC[l.src][0]}</span></div>
     </div>
     <span class="badge ${l.sla==='warn'?'a':'g'}">${l.t}</span></div>
   </div>`).join('')}
  </div>
  <div>
   <div class="panel"><div class="ph-title">Что видит оператор</div>
    <div class="note" style="--tone:var(--violet)"><b>直 Директ и комментарии</b><p>Сообщения из Instagram и TikTok приходят в ту же ленту, что и звонки. Оператор не переключается между шестью приложениями.</p></div>
    <div class="note" style="--tone:var(--acc)"><b>История клиента сразу под рукой</b><p>Если человек заказывал раньше — видно, что брал, на какие даты и какой у него любимый торт. Это половина продажи.</p></div>
    <div class="note" style="--tone:var(--green)"><b>Заказ создаётся за одно нажатие</b><p>Клиент, дата, состав, предоплата и адрес доставки переносятся автоматически — оператор не набирает ничего дважды.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Каналы за месяц</div>
    ${[['Instagram',44,'var(--violet)'],['Сайт и приложение',24,'var(--blue)'],['TikTok',14,'var(--cyan)'],['Звонки',11,'var(--acc)'],['Блогеры',7,'var(--amber)']].map(x=>
     `<div class="fr" style="grid-template-columns:140px 1fr 40px"><span>${x[0]}</span><div class="bar"><i style="--w:${x[1]}%;background:${x[2]}"></i></div><b>${x[1]}%</b></div>`).join('')}
   </div>
  </div>
 </div>`;
function openLead(id){const l=LEADS.find(x=>x.id===id);if(!l)return;
 openD(esc(l.who),`${SRC[l.src][0]} · ${l.t}`,[],
 `<div class="panel"><div class="ph-title" style="margin-bottom:8px">Обращение</div>
  <div class="msg in"><div class="mh"><b>Клиент</b><time>${l.t}</time></div><p>${esc(l.txt)}</p></div>
  <div class="msg"><div class="mh"><b>Автоответ</b><time>сразу</time></div><p>Здравствуйте! Спасибо за обращение — ответим в течение 10 минут. Каталог и цены: konditer.kz, доставка по городу ежедневно с 10:00 до 21:00.</p></div>
  <div style="display:flex;gap:7px;margin-top:9px"><input class="search" style="flex:1" placeholder="Ответить в ${SRC[l.src][0]}…">
  <button class="btn acc" onclick="toast('Ответ отправлен. Переписка сохранена в карточке клиента.')">Отправить</button></div></div>
  <div class="panel"><div class="ph-title">Быстрые действия</div>
   <div class="btns"><button class="btn acc" onclick="leadToOrder(${id})">Создать заказ</button>
   <button class="btn" onclick="toast('Клиенту отправлен каталог с ценами и фото — прямо из системы.')">Отправить каталог</button>
   <button class="btn" onclick="toast('Звонок через телефонию: разговор записывается и прикрепится к клиенту.')">☎ Позвонить</button></div>
  </div>`)}
function leadToOrder(id){const l=LEADS.find(x=>x.id===id);
 ORDERS.unshift({id:orderSeq++,st:'new',cl:l.who.split('·')[0].trim(),ph:'+7 7',src:l.src,what:l.txt.slice(0,54),date:'08.09',time:'—',
  sum:24000,paid:0,cost:9800,deliv:'уточняется',mgr:ROLES[role].n,chat:[['Клиент',l.txt,l.t,'in']]});
 LEADS=LEADS.filter(x=>x.id!==id);closeD();go('orders');sparks();
 toast('Заказ создан из обращения: клиент, канал и переписка перенесены автоматически.')}
function simLead(){LEADS.unshift({id:leadSeq++,src:'ig',who:'@nurgul_a · Instagram',txt:'Здравствуйте! Хочу торт на свадьбу, 5 кг, 20 сентября. Можно обсудить?',t:'только что',sla:'ok',fresh:1});
 render();sparks();toast('Новое обращение из Instagram — <b>автоответ ушёл за 4 секунды</b>, таймер ответа пошёл.')}

/* --- ЗАКАЗЫ --- */
let dragOrder=null;
SC.orders=()=>`
 <div class="head"><div><h2>Заказы</h2><p>Заказные торты на дату и онлайн-заказы. Карточка тянется мышью по этапам; при переходе в производство заказ автоматически встаёт в план цеха на нужный день.</p></div>
 <div class="btns"><button class="btn acc" onclick="newOrder()">+ Заказ</button></div></div>
 <div class="board" style="grid-template-columns:repeat(6,1fr)">
 ${OSTAGES.map(([k,name,color])=>{const l=ORDERS.filter(o=>o.st===k);
  return `<div class="col" id="ocol_${k}" ondragover="colOver(event,'ocol_${k}')" ondragleave="colOut('ocol_${k}')" ondrop="orderDrop('${k}')">
   <div class="col-h"><b style="color:${color}">${name}</b><span class="badge">${l.length}</span></div>
   ${l.map(o=>`<div class="kc" style="border-left:3px solid ${color}" draggable="true" ondragstart="dragOrder=${o.id};this.classList.add('drag')" ondragend="this.classList.remove('drag')" onclick="openOrder(${o.id})">
     <b>${esc(o.cl)}</b>
     <div class="sub" style="margin-top:4px">${esc(o.what.slice(0,40))}${o.what.length>40?'…':''}</div>
     <div style="font:800 11.4px 'IBM Plex Mono',monospace;color:var(--acc);margin-top:6px">${fmt(o.sum)} ₸</div>
     <div class="krow"><span>на ${o.date}</span>${o.paid?`<span class="badge g">предоплата</span>`:'<span class="badge a">без оплаты</span>'}</div>
    </div>`).join('')||'<p class="mini" style="padding:7px 2px">—</p>'}
  </div>`}).join('')}
 </div>
 <div class="hint"><b>Почему заказные торты нельзя вести в общей воронке:</b> у них есть дата, к которой торт должен быть готов, предоплата и место в плане цеха. Система связывает три вещи — заказ, производство и доставку: перенесли заказ на другую дату, и план цеха пересчитался сам.</div>`;
function colOver(e,id){e.preventDefault();const el=document.getElementById(id);if(el)el.classList.add('over')}
function colOut(id){const el=document.getElementById(id);if(el)el.classList.remove('over')}
function orderDrop(st){colOut('ocol_'+st);if(!dragOrder)return;const o=ORDERS.find(x=>x.id===dragOrder);
 if(o.st!==st){const was=ostName(o.st);o.st=st;
  if(st==='prod'){BATCH.unshift({id:'ПР-09'+(16+BATCH.length),st:'plan',menu:'m4',qty:1,who:'Смена А',start:'план '+o.date,need:'Заказ '+o.id,cost:o.cost});
   render();sparks();toast(`Заказ <b>${o.id}</b> встал в план цеха на ${o.date} — сырьё зарезервировано по техкарте, технолог видит его у себя.`)}
  else if(st==='ready'){render();toast(`Заказ <b>${o.id}</b> готов. Клиенту ушло сообщение в WhatsApp, диспетчер видит его в доставке.`)}
  else{render();toast(`Заказ ${o.id}: <b>${was} → ${ostName(st)}</b>.`)}}
 dragOrder=null}
let oTab=0;
function openOrder(id,tab){const o=ORDERS.find(x=>x.id===id);if(!o)return;if(tab!==undefined)oTab=tab;
 const tabs=['Заказ','Переписка','Производство','Оплата и доставка'];
 let body='';
 if(oTab===0){body=`
  <div class="chain">${OSTAGES.map(s=>{const i=OSTAGES.findIndex(x=>x[0]===s[0]),c=OSTAGES.findIndex(x=>x[0]===o.st);
   return `<div class="st ${i===c?'now':i<c?'done':''}"><code>${i<c?'ПРОЙДЕН':i===c?'СЕЙЧАС':''}</code><b style="font-size:9px">${s[1]}</b></div>`}).join('')}</div>
  <div class="panel">
   <div class="kv"><span>Клиент</span><b>${esc(o.cl)} · ${o.ph}</b></div>
   <div class="kv"><span>Что заказали</span><b style="max-width:62%">${esc(o.what)}</b></div>
   <div class="kv"><span>Дата и время</span><b>${o.date} · ${o.time}</b></div>
   <div class="kv"><span>Канал</span><b>${SRC[o.src][0]}</b></div>
   <div class="kv"><span>Получение</span><b>${esc(o.deliv)}</b></div>
   <div class="kv"><span>Оператор</span><b>${o.mgr}</b></div>
  </div>
  <div class="panel"><div class="ph-title">Деньги по заказу</div>
   <div class="kv"><span>Сумма заказа</span><b class="mono">${tg(o.sum)}</b></div>
   <div class="kv"><span>Предоплата</span><b class="mono" style="color:${o.paid?'var(--green)':'var(--red)'}">${o.paid?tg(o.paid):'не внесена'}</b></div>
   <div class="kv"><span>Остаток при выдаче</span><b class="mono">${tg(o.sum-o.paid)}</b></div>
   <div class="kv"><span>Себестоимость</span><b class="mono">${tg(o.cost)}</b></div>
   <div class="kv"><span>Маржа</span><b class="mono" style="color:var(--green)">${tg(o.sum-o.cost)} · ${Math.round((o.sum-o.cost)/o.sum*100)}%</b></div>
  </div>
  <div class="btns"><button class="btn acc" onclick="toast('Ссылка на оплату Kaspi отправлена клиенту в WhatsApp. Оплата придёт в систему автоматически.')">Отправить ссылку на оплату</button>
  <button class="btn" onclick="toast('Макет торта прикреплён к заказу — кондитер видит его в цехе.')">Прикрепить макет</button>
  <button class="btn" onclick="toast('Клиенту отправлено напоминание о дате и времени получения.')">Напомнить клиенту</button></div>`}
 if(oTab===1){body=`<div class="panel">
  ${o.chat.length?o.chat.map(m=>`<div class="msg ${m[3]==='in'?'in':''}"><div class="mh"><b>${esc(m[0])}</b><time>${m[2]}</time></div><p>${esc(m[1])}</p></div>`).join(''):'<p class="mini">Переписки пока нет.</p>'}
  <div style="display:flex;gap:7px;margin-top:9px"><input class="search" style="flex:1" id="omsg" placeholder="Написать клиенту…" onkeydown="if(event.key==='Enter')orderMsg(${id})">
  <button class="btn acc" onclick="orderMsg(${id})">Отправить</button></div>
  <div class="note" style="--tone:var(--wa)"><b>Вся переписка в компании</b><p>Оператор ушёл в отпуск — заказ ведёт другой и видит всю историю: что обещали, какой макет согласовали, какая предоплата.</p></div></div>`}
 if(oTab===2){body=`<div class="panel"><div class="ph-title">Место в производстве</div>
  ${['prod','ready','done'].includes(o.st)?`
   <div class="kv"><span>В плане цеха</span><b>${o.date==='сегодня'?'сегодня':'накануне, '+o.date}</b></div>
   <div class="kv"><span>Цех</span><b>Горячий · смена А</b></div>
   <div class="kv"><span>Сырьё по техкарте</span><b class="mono">${tg(o.cost*0.72)}</b></div>
   <div class="kv"><span>Статус</span><b>${o.st==='prod'?'<span class="badge a">в работе</span>':'<span class="badge g">готово</span>'}</b></div>
   <div class="note" style="--tone:var(--green)"><b>Сырьё списывается автоматически</b><p>Когда кондитер отмечает выпуск, мука, масло и упаковка уходят со склада по техкарте — кладовщику не нужно вести отдельную тетрадь.</p></div>`
   :`<p class="mini">Заказ ещё не передан в производство. Как только он перейдёт на этап «В производстве», система поставит его в план цеха на день перед выдачей и зарезервирует сырьё.</p>
   <button class="btn acc" style="margin-top:9px" onclick="toOrderProd(${id})">Передать в производство</button>`}
  </div>`}
 if(oTab===3){body=`<div class="panel"><div class="ph-title">Оплата</div>
   <div class="kv"><span>Способ</span><b>Kaspi перевод / карта / наличные</b></div>
   <div class="kv"><span>Предоплата 50%</span><b class="mono">${o.paid?tg(o.paid)+' · получена':'ожидается'}</b></div>
   <div class="kv"><span>Остаток</span><b class="mono">${tg(o.sum-o.paid)}</b></div>
  </div>
  <div class="panel"><div class="ph-title">Доставка</div>
   ${(()=>{const d=DELIV.find(x=>x.order===id);
    return d?`<div class="kv"><span>Номер</span><b class="mono">${d.id}</b></div>
    <div class="kv"><span>Адрес</span><b>${esc(d.addr)}</b></div>
    <div class="kv"><span>Когда</span><b>${d.when}</b></div>
    <div class="kv"><span>Курьер</span><b>${d.courier}</b></div>
    <div class="kv"><span>Статус</span><b><span class="badge ${d.st==='выдан'?'g':d.st==='назначена'?'b':'a'}">${d.st}</span></b></div>`
    :'<p class="mini">Доставка ещё не оформлена — заказ на самовывоз или адрес уточняется.</p>'})()}
   <button class="btn acc" style="margin-top:9px" onclick="closeD();go('delivery')">Открыть доставку</button>
  </div>`}
 openD(`Заказ №${o.id}`,`${esc(o.cl)} · ${ostName(o.st)} · на ${o.date}`,tabs.map((t,i)=>[t,`openOrder(${id},${i})`,i===oTab]),body)}
function orderMsg(id){const el=document.getElementById('omsg');const v=el.value.trim();if(!v)return;
 ORDERS.find(x=>x.id===id).chat.push([ROLES[role].n,v,'сейчас','']);openOrder(id,1);toast('Сообщение отправлено клиенту.')}
function toOrderProd(id){const o=ORDERS.find(x=>x.id===id);o.st='prod';
 BATCH.unshift({id:'ПР-09'+(16+BATCH.length),st:'plan',menu:'m4',qty:1,who:'Смена А',start:'план '+o.date,need:'Заказ '+id,cost:o.cost});
 openOrder(id,2);sparks();toast('Заказ передан в цех и встал в план на день перед выдачей. Сырьё зарезервировано.')}
function newOrder(){openD('Новый заказ','Клиент, что и на какую дату',[],
 `<div class="f2"><div class="fld"><label>Клиент</label><input id="noC" placeholder="Имя или компания"></div>
  <div class="fld"><label>Телефон</label><input id="noP" value="+7 7"></div></div>
  <div class="fld"><label>Что заказывают</label><input id="noW" placeholder="Торт «Наполеон» 3 кг, надпись"></div>
  <div class="f3"><div class="fld"><label>Дата выдачи</label><input id="noD" value="08.09"></div>
  <div class="fld"><label>Сумма, ₸</label><input id="noS" value="28000" inputmode="numeric"></div>
  <div class="fld"><label>Канал</label><select id="noSrc">${Object.entries(SRC).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select></div></div>
  <div class="btns"><button class="btn acc" onclick="saveOrder()">Создать заказ</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function saveOrder(){const cl=document.getElementById('noC').value.trim()||'Новый клиент';
 const sum=parseInt(document.getElementById('noS').value)||20000;
 ORDERS.unshift({id:orderSeq++,st:'new',cl,ph:document.getElementById('noP').value,src:document.getElementById('noSrc').value,
  what:document.getElementById('noW').value||'Заказной торт',date:document.getElementById('noD').value,time:'—',
  sum,paid:0,cost:Math.round(sum*0.41),deliv:'уточняется',mgr:ROLES[role].n,chat:[]});
 closeD();render();sparks();toast('Заказ создан. Осталось взять предоплату — и он сам встанет в план цеха на нужную дату.')}

/* --- КАССА --- */
let CART=[],posCat='Все';
SC.pos=()=>{
 const cats=['Все',...new Set(MENU.filter(m=>m.type==='витрина').map(m=>m.cat))];
 const list=MENU.filter(m=>m.type==='витрина'&&(posCat==='Все'||m.cat===posCat));
 const sum=CART.reduce((a,c)=>a+menu(c.id).price*c.q,0);
 return `<div class="head"><div><h2>Касса точки</h2><p>Так продавец работает на точке: три касания — и чек пробит. Продажа сразу списывает позицию с витрины, попадает в выручку смены и в аналитику сети.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Открытие смены: пересчёт витрины, внесение размена, отчёт по предыдущей смене.')">Открыть смену</button>
 <button class="btn acc" onclick="go('point')">Моя точка</button></div></div>
 <div class="g21">
  <div>
   <div class="filters">${cats.map(c=>`<button class="filter ${posCat===c?'on':''}" onclick="posCat='${c}';render()">${c}</button>`).join('')}</div>
   <div class="grid-prod">
   ${list.map(m=>`<button class="pcard" onclick="addCart('${m.id}')">
     <div class="pimg">${m.cat==='Торты'?'🎂':m.cat==='Пирожные'?'🧁':m.cat==='Выпечка'?'🥐':'☕'}</div>
     <div class="pb"><b>${esc(m.n)}</b><div class="sub">${m.cat}${m.shelf?' · срок '+m.shelf+' дн.':''}</div>
     <div class="pp">${fmt(m.price)} ₸</div></div></button>`).join('')}
   </div>
   <div class="hint"><b>Кассир не думает о складе:</b> продал эклер — он ушёл с витрины точки, попал в выручку смены и в отчёт сети. Вечером система сама покажет, сколько осталось и что заказать на завтра.</div>
  </div>
  <div>
   <div class="receipt">
    <h4>Кондитерская · Точка 1</h4>
    <div class="rsub">пр. Абая · кассир Динара · смена 02.09</div>
    ${CART.length?CART.map(c=>`<div class="rrow"><span>${esc(menu(c.id).n)} × ${c.q}</span><b>${fmt(menu(c.id).price*c.q)}</b></div>`).join('')
     :'<p class="mini" style="text-align:center;padding:14px 0">Нажмите на позицию слева — она попадёт в чек</p>'}
    ${CART.length?`<div class="rtot"><span>Итого</span><span>${fmt(sum)} ₸</span></div>`:''}
   </div>
   ${CART.length?`<div class="btns" style="margin-top:10px">
    <button class="btn acc" onclick="payCart('Kaspi')">Оплата Kaspi</button>
    <button class="btn g" onclick="payCart('картой')">Картой</button>
    <button class="btn" onclick="payCart('наличными')">Наличными</button>
    <button class="btn r" onclick="CART=[];render()">Очистить</button></div>
   <div class="panel" style="margin-top:10px"><div class="ph-title">Клиент</div>
    <div class="kv"><span>Карта лояльности</span><b>+7 707 445 90 12 · Айгерим С.</b></div>
    <div class="kv"><span>Бонусов на карте</span><b class="mono">4 260 ₸</b></div>
    <div class="kv"><span>Начислим с этой покупки</span><b class="mono" style="color:var(--green)">${fmt(sum*0.03)} ₸</b></div>
    <button class="btn" style="width:100%;margin-top:8px" onclick="toast('Бонусы списаны с карты клиента, чек пересчитан.')">Списать бонусы</button></div>`:''}
   <div class="panel" style="margin-top:${CART.length?'10px':'0'}"><div class="ph-title">Смена сейчас</div>
    <div class="kv"><span>Выручка</span><b class="mono">184 600 ₸</b></div>
    <div class="kv"><span>Чеков</span><b class="mono">23</b></div>
    <div class="kv"><span>Средний чек</span><b class="mono">8 026 ₸</b></div>
    <div class="kv"><span>Наличные в кассе</span><b class="mono">62 400 ₸</b></div>
   </div>
  </div>
 </div>`};
function addCart(id){const c=CART.find(x=>x.id===id);if(c)c.q++;else CART.push({id,q:1});render();}
function payCart(way){const sum=CART.reduce((a,c)=>a+menu(c.id).price*c.q,0);const n=CART.reduce((a,c)=>a+c.q,0);
 CART=[];render();sparks();
 toast(`Чек пробит: <b>${n} позиц. на ${fmt(sum)} ₸</b>, оплата ${way}. Позиции списаны с витрины точки, выручка смены и аналитика сети обновились. Бонусы клиенту начислены.`)}

/* --- МОЯ ТОЧКА --- */
SC.point=()=>{const p=POINTS[0];
 return `<div class="head"><div><h2>Моя точка · ${esc(p.n)}</h2><p>Что есть на витрине, что продалось, что осталось к вечеру и сколько заказать на завтра. Заявка уходит в цех и на склад одной кнопкой.</p></div>
 <div class="btns"><button class="btn" onclick="go('pos')">Открыть кассу</button><button class="btn acc" onclick="orderTomorrow()">Заявка на завтра</button></div></div>
 <div class="strip">
  <div><small>ВЫРУЧКА СМЕНЫ</small><b>184 600 ₸</b><span>23 чека</span></div>
  <div><small>ВЫРУЧКА ЗА МЕСЯЦ</small><b class="c">${fmt(p.rev)} ₸</b><span>${p.checks} чеков</span></div>
  <div><small>СРЕДНИЙ ЧЕК</small><b>${fmt(p.avg)} ₸</b><span class="g">+6% к июлю</span></div>
  <div><small>СПИСАНИЯ</small><b class="a">${num(p.ret)}%</b><span>норма до 3%</span></div>
  <div><small>ОСТАТОК НА ВИТРИНЕ</small><b>34 позиции</b><span>к вечеру</span></div>
 </div>
 <div class="g21">
  <div class="panel" style="padding:0"><div style="padding:13px 15px;border-bottom:1px solid var(--line)">
   <div class="ph-title">Витрина сейчас</div><div class="ph-sub">привоз минус продажи — остаток обновляется с каждым чеком</div></div>
   <div class="tw"><table class="data" style="min-width:660px"><thead><tr><th>Позиция</th><th class="right">Привезли</th><th class="right">Продали</th><th class="right">Осталось</th><th>Срок годности</th><th>Что делать</th></tr></thead><tbody>
   ${[['m1',8,6,2,'до завтра'],['m3',4,4,0,'—'],['m5',40,31,9,'сегодня'],['m6',6,2,4,'5 дней'],['m7',12,7,5,'завтра'],['m8',30,26,4,'сегодня']].map(r=>{
    const m=menu(r[0]);const left=r[3];
    return `<tr onclick="toast('Карточка позиции: продажи по дням, остаток, себестоимость и рекомендация по привозу.')">
    <td><b>${esc(m.n)}</b></td><td class="right mono">${r[1]}</td><td class="right mono">${r[2]}</td>
    <td class="right mono"><b>${left}</b></td><td class="mini">${r[4]}</td>
    <td>${r[4]==='сегодня'&&left>5?'<span class="badge r">скидка −30%</span>':left===0?'<span class="badge b">закончилось</span>':'<span class="badge g">в норме</span>'}</td></tr>`}).join('')}
   </tbody></table></div>
   <div class="hint"><b>Товар со сроком «сегодня» система подсвечивает сама:</b> продавец видит, что 9 эклеров не уйдут до закрытия, и ставит на них скидку 30% — это лучше, чем списать их в ноль вечером.</div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Заявка на завтра</div>
    <p class="mini" style="margin-bottom:9px">Система считает по продажам за 4 недели, дню недели и заказам на дату:</p>
    ${[['Наполеон',8,'+2 к среднему: заказ на 05.09'],['Чизкейк',5,'по среднему'],['Эклеры',32,'−8: много списаний'],['Макарон',6,'по среднему'],['Круассаны',28,'по среднему']].map(r=>
     `<div class="kv"><span>${r[0]}</span><b>${r[1]} шт<div class="sub">${r[2]}</div></b></div>`).join('')}
    <button class="btn acc" style="width:100%;margin-top:9px" onclick="orderTomorrow()">Отправить заявку в цех</button>
   </div>
   <div class="panel"><div class="ph-title">Смена</div>
    <div class="kv"><span>Кассир</span><b>Динара</b></div>
    <div class="kv"><span>Открыта</span><b>09:00</b></div>
    <div class="kv"><span>Приняла привоз</span><b>ПМ-1188 · 07:20</b></div>
    <div class="kv"><span>Инкассация</span><b>вечером, 21:00</b></div>
   </div>
  </div>
 </div>`};
function orderTomorrow(){MOVES.unshift({id:'ПМ-'+(1191+MOVES.length),dir:'на точку',point:'p1',what:'Заявка точки 1 на 03.09: 79 позиций',when:'сейчас',st:'в цехе',sum:238000});
 sparks();render();
 toast('Заявка ушла в цех и на склад. Технолог увидит её в плане на завтра, кладовщик — в перемещениях.')}

/* --- ТОЧКИ СЕТИ --- */
SC.points=()=>`
 <div class="head"><div><h2>Точки сети</h2><p>Три собственные точки в одном окне: выручка, чеки, списания и остатки. Плюс франчайзинговые точки — они видны отдельно, но по тем же метрикам.</p></div>
 <div class="btns"><button class="btn" onclick="go('franch')">Франчайзи</button><button class="btn acc" onclick="toast('Сравнение точек за период выгружено в Excel.')">Выгрузить</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Точка</th><th>Тип</th><th class="right">Выручка</th><th class="right">Чеков</th><th class="right">Средний чек</th><th class="right">Списания</th><th class="right">Маржа</th><th>Состояние</th></tr></thead><tbody>
 ${POINTS.map(p=>`<tr onclick="openPoint('${p.id}')"><td><b>${esc(p.n)}</b></td><td><span class="badge c">своя</span></td>
  <td class="right mono">${fmt(p.rev)}</td><td class="right mono">${p.checks}</td><td class="right mono">${fmt(p.avg)}</td>
  <td class="right mono" style="color:${p.ret>4?'var(--red)':'var(--green)'}">${num(p.ret)}%</td>
  <td class="right mono" style="color:var(--green)">${Math.round(58-p.ret)}%</td>
  <td>${p.ret>4?'<span class="badge a">много списаний</span>':'<span class="badge g">в норме</span>'}</td></tr>`).join('')}
 ${FRANCH.map(f=>`<tr onclick="go('franch')"><td><b>${esc(f.n)}</b><div class="sub">${f.owner}</div></td>
  <td><span class="badge v">франшиза</span></td>
  <td class="right mono">${f.rev?fmt(f.rev):'—'}</td><td class="right mono">—</td><td class="right mono">—</td><td class="right mono">—</td>
  <td class="right mono">роялти ${f.royalty?fmt(f.royalty):'—'}</td>
  <td>${f.st==='работает'?'<span class="badge g">работает</span>':'<span class="badge b">открытие</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Что продаётся лучше по точкам</div>
   ${[['Наполеон','Точка 2',34],['Чизкейк','Точка 1',28],['Эклеры','Точка 3',22],['Макарон','Точка 2',16]].map(r=>
    `<div class="fr" style="grid-template-columns:120px 1fr 96px"><span>${r[0]}</span><div class="bar"><i style="--w:${r[2]*2.6}%"></i></div><b>${r[1]} · ${r[2]}%</b></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Ассортимент под точку</b><p>В ТРЦ берут макарон и подарочные коробки, на Сатпаева — выпечку к кофе. Система показывает это цифрами, и привоз можно сделать разным.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Списания по точкам</div>
   ${POINTS.map(p=>`<div class="fr" style="grid-template-columns:170px 1fr 64px"><span>${esc(p.n)}</span>
    <div class="bar"><i style="--w:${p.ret*18}%;background:${p.ret>4?'var(--red)':'var(--green)'}"></i></div><b>${num(p.ret)}%</b></div>`).join('')}
   <div class="kv" style="margin-top:9px"><span>Списано за месяц по сети</span><b class="mono">318 000 ₸</b></div>
   <div class="kv"><span>Если довести до нормы 3%</span><b class="mono" style="color:var(--green)">+112 000 ₸ в месяц</b></div>
  </div>
 </div>`;
function openPoint(id){const p=POINTS.find(x=>x.id===id);
 openD(esc(p.n),`Собственная точка · выручка за август ${fmt(p.rev)} ₸`,[],
 `<div class="strip" style="grid-template-columns:repeat(3,1fr)">
   <div><small>ВЫРУЧКА</small><b>${fmt(p.rev)} ₸</b><span>${p.checks} чеков</span></div>
   <div><small>СРЕДНИЙ ЧЕК</small><b>${fmt(p.avg)} ₸</b><span>по сети ${fmt(netRev()/POINTS.reduce((a,x)=>a+x.checks,0))} ₸</span></div>
   <div><small>СПИСАНИЯ</small><b class="${p.ret>4?'r':'g'}">${num(p.ret)}%</b><span>норма 3%</span></div>
  </div>
  <div class="panel"><div class="ph-title">Что происходит на точке</div>
   <div class="kv"><span>Привоз сегодня</span><b>ПМ-1188 · принят в 07:20</b></div>
   <div class="kv"><span>Продано за смену</span><b class="mono">184 600 ₸ · 23 чека</b></div>
   <div class="kv"><span>Остаток на витрине</span><b>34 позиции</b></div>
   <div class="kv"><span>Возврат вчера</span><b class="mono">8 эклеров · 6 000 ₸</b></div>
   <div class="kv"><span>Кассиры</span><b>Динара, Айдана</b></div>
  </div>
  <div class="btns"><button class="btn acc" onclick="closeD();go('pos')">Открыть кассу точки</button>
  <button class="btn" onclick="toast('Отчёт по точке за период: продажи по позициям, часам и кассирам.')">Отчёт по точке</button></div>`)}

/* --- ПРОИЗВОДСТВО --- */
let dragBatch=null;
SC.prod=()=>`
 <div class="head"><div><h2>Цех и выпуск</h2><p>Горячий и холодный цех в одном экране. Партия тянется мышью по этапам; при запуске сырьё списывается со склада по техкарте, при готовности продукция уходит на точки.</p></div>
 <div class="btns"><button class="btn" onclick="go('plan')">План на завтра</button><button class="btn acc" onclick="newBatch()">+ Запустить партию</button></div></div>
 <div class="strip">
  <div><small>ПАРТИЙ В РАБОТЕ</small><b>${BATCH.filter(b=>!['ready'].includes(b.st)).length}</b><span>смена А с 05:00</span></div>
  <div><small>ВЫПУСК ЗА СМЕНУ</small><b>218 позиций</b><span>план 240</span></div>
  <div><small>СЕБЕСТОИМОСТЬ СМЕНЫ</small><b class="c">327 000 ₸</b><span>сырьё и работа</span></div>
  <div><small>БРАК</small><b class="g">1,2%</b><span>норма до 2%</span></div>
  <div><small>ЗАКАЗОВ НА ДАТУ</small><b class="a">${ORDERS.filter(o=>['pay','prod'].includes(o.st)).length}</b><span>встают в план сами</span></div>
 </div>
 <div class="board" style="grid-template-columns:repeat(5,1fr)">
 ${PSTAGES.map(([k,name,color])=>{const l=BATCH.filter(b=>b.st===k);
  return `<div class="col" id="pcol_${k}" ondragover="colOver(event,'pcol_${k}')" ondragleave="colOut('pcol_${k}')" ondrop="batchDrop('${k}')">
   <div class="col-h"><b style="color:${color}">${name}</b><span class="badge">${l.length}</span></div>
   ${l.map(b=>`<div class="kc" style="border-left:3px solid ${color}" draggable="true" ondragstart="dragBatch='${b.id}';this.classList.add('drag')" ondragend="this.classList.remove('drag')" onclick="openBatch('${b.id}')">
     <b>${esc(menu(b.menu).n)}</b>
     <div class="sub" style="margin-top:4px">${b.id} · ${b.qty} шт</div>
     <div style="font:700 10px 'IBM Plex Mono',monospace;margin-top:6px">${fmt(b.cost)} ₸</div>
     <div class="krow"><span>${b.who}</span><span>${b.start}</span></div>
    </div>`).join('')||'<p class="mini" style="padding:7px 2px">—</p>'}
  </div>`}).join('')}
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Что стоит за каждой партией</div>
   <div class="note" style="--tone:var(--red)"><b>Списание сырья по техкарте</b><p>Запустили 24 «Наполеона» — мука, масло, яйцо и коробки ушли со склада автоматически. Кладовщик не ведёт тетрадь, а остаток всегда честный.</p></div>
   <div class="note" style="--tone:var(--acc)"><b>Себестоимость по факту</b><p>Считается из фактического расхода и работы смены. Видно настоящую маржу по каждой позиции, а не «в среднем по кондитерской».</p></div>
   <div class="note" style="--tone:var(--green)"><b>Готово → на точки</b><p>Партия переходит в «Готово», и создаётся перемещение на точки по их заявкам. Кладовщику остаётся собрать и отгрузить.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Загрузка цеха на смене</div>
   ${[['Горячий цех',82],['Холодный цех',64],['Упаковка',48],['Декор заказных тортов',71]].map(r=>
    `<div class="fr" style="grid-template-columns:190px 1fr 46px"><span>${r[0]}</span><div class="bar"><i style="--w:${r[1]}%;background:${r[1]>85?'var(--red)':'var(--acc)'}"></i></div><b>${r[1]}%</b></div>`).join('')}
   <div class="kv" style="margin-top:9px"><span>Смена</span><b>А · 6 кондитеров</b></div>
   <div class="kv"><span>Начало смены</span><b>05:00</b></div>
   <div class="kv"><span>Отгрузка на точки</span><b>07:00–07:40</b></div>
  </div>
 </div>`;
function batchDrop(st){colOut('pcol_'+st);if(!dragBatch)return;const b=BATCH.find(x=>x.id===dragBatch);
 if(b.st!==st){const was=PSTAGES.find(s=>s[0]===b.st)[1];b.st=st;
  if(st==='hot'||st==='cold'){
   const r=RECIPES.find(x=>x.menu===b.menu);
   STOCK.forEach(s=>{if(['Мука высший сорт','Масло сливочное 82%','Сахар'].includes(s.n))s.qty=Math.max(0,s.qty-Math.round(b.qty*0.4))});
   render();toast(`Партия <b>${b.id}</b> запущена в ${st==='hot'?'горячий':'холодный'} цех. Сырьё списано со склада по техкарте: ${r?r.items.slice(0,3).map(i=>i[0].toLowerCase()).join(', '):'мука, масло, сахар'}.`)}
  else if(st==='ready'){MOVES.unshift({id:'ПМ-'+(1191+MOVES.length),dir:'на точку',point:'p1',what:`${menu(b.menu).n} · ${b.qty} шт`,when:'сейчас',st:'к отгрузке',sum:b.qty*menu(b.menu).price});
   render();sparks();toast(`Партия <b>${b.id}</b> готова: ${b.qty} шт. Создано перемещение на точки по их заявкам — кладовщик видит задание на отгрузку.`)}
  else{render();toast(`Партия ${b.id}: <b>${was} → ${PSTAGES.find(s=>s[0]===st)[1]}</b>.`)}}
 dragBatch=null}
function openBatch(id){const b=BATCH.find(x=>x.id===id);const m=menu(b.menu);const r=RECIPES.find(x=>x.menu===b.menu);
 const per=Math.round(b.cost/b.qty);
 openD(`Партия ${b.id}`,`${esc(m.n)} · ${b.qty} шт · ${b.who} · ${b.start}`,[],
 `<div class="calc"><div class="cl">СЕБЕСТОИМОСТЬ ПАРТИИ</div>
   <div class="cg"><div><b>${fmt(b.cost)}</b><small>всего, ₸</small></div><div><b>${fmt(per)}</b><small>за штуку, ₸</small></div>
   <div><b>${Math.round((m.price-per)/m.price*100)}%</b><small>маржа при цене ${fmt(m.price)} ₸</small></div></div>
   <div class="cn">Считается по факту: сырьё по техкарте, работа смены, упаковка. Не «в среднем по месяцу», а именно по этой партии.</div></div>
  ${r?`<div class="panel" style="padding:0"><div class="tw"><table class="data"><thead><tr><th>Сырьё по техкарте</th><th class="right">Норма</th><th class="right">Сумма</th></tr></thead><tbody>
   ${r.items.map(i=>`<tr style="cursor:default"><td>${i[0]}</td><td class="right mono">${i[1]}</td><td class="right mono">${fmt(i[2]*b.qty/ (parseInt(r.out)||1))} ₸</td></tr>`).join('')}
   <tr style="cursor:default"><td class="mini">Работа смены</td><td class="right mono">${r.time}</td><td class="right mono">${fmt(r.work*b.qty/(parseInt(r.out)||1))} ₸</td></tr>
   </tbody></table></div></div>`:''}
  <div class="panel"><div class="ph-title">Для кого эта партия</div>
   <div class="kv"><span>Назначение</span><b>${esc(b.need)}</b></div>
   <div class="kv"><span>Цех</span><b>${b.st==='hot'?'Горячий':b.st==='cold'?'Холодный':'—'}</b></div>
   <div class="kv"><span>Смена</span><b>${b.who}</b></div>
   <div class="kv"><span>Срок годности продукции</span><b>${m.shelf} дн.</b></div>
  </div>
  <div class="btns"><button class="btn g" onclick="closeD();toast('Партия отмечена готовой, продукция ушла на точки по заявкам.')">Отметить готовой</button>
  <button class="btn r" onclick="closeD();toast('Брак зафиксирован: количество, причина и виновник записаны в журнал списаний.')">Списать брак</button></div>`)}
function newBatch(){openD('Запуск партии','Что печём, сколько и в какой цех',[],
 `<div class="fld"><label>Позиция</label><select id="nbM" onchange="nbPrev()">${MENU.filter(m=>m.type==='витрина'&&m.cat!=='Напитки').map(m=>`<option value="${m.id}">${m.n}</option>`).join('')}</select></div>
  <div class="f2"><div class="fld"><label>Количество</label><input id="nbQ" value="20" inputmode="numeric" oninput="nbPrev()"></div>
  <div class="fld"><label>Цех</label><select id="nbC"><option value="hot">Горячий</option><option value="cold">Холодный</option></select></div></div>
  <div class="calc"><div class="cl">РАСЧЁТ ПО ТЕХКАРТЕ</div><div class="cg" id="nbCalc"></div>
   <div class="cn" id="nbNote">Система считает потребность в сырье и проверяет остаток на складе.</div></div>
  <div class="btns"><button class="btn acc" onclick="saveBatch()">Запустить</button><button class="btn" onclick="closeD()">Отмена</button></div>`);nbPrev()}
function nbPrev(){const id=document.getElementById('nbM').value;const q=parseInt(document.getElementById('nbQ').value)||0;
 const m=menu(id);const r=RECIPES.find(x=>x.menu===id);
 const base=r?(parseInt(r.out)||1):1;
 const cost=r?Math.round((r.items.reduce((a,i)=>a+i[2],0)+r.work)*q/base):Math.round(m.cost*q);
 document.getElementById('nbCalc').innerHTML=`<div><b>${fmt(q)}</b><small>штук</small></div><div><b>${fmt(cost)}</b><small>себестоимость, ₸</small></div><div><b>${fmt(q?cost/q:0)}</b><small>за штуку, ₸</small></div>`;
 document.getElementById('nbNote').innerHTML=r?`Потребность: ${r.items.slice(0,3).map(i=>`<b style="color:#fff">${i[0].toLowerCase()}</b>`).join(', ')} и упаковка. Хватит ли сырья — система проверит при запуске.`
  :'Техкарта для позиции не заведена — себестоимость взята из карточки.';}
function saveBatch(){const id=document.getElementById('nbM').value;const q=parseInt(document.getElementById('nbQ').value)||10;
 const m=menu(id);const r=RECIPES.find(x=>x.menu===id);const base=r?(parseInt(r.out)||1):1;
 const cost=r?Math.round((r.items.reduce((a,i)=>a+i[2],0)+r.work)*q/base):Math.round(m.cost*q);
 BATCH.unshift({id:'ПР-09'+(16+BATCH.length),st:document.getElementById('nbC').value,menu:id,qty:q,who:'Смена А',start:'сейчас',need:'План на сегодня',cost});
 closeD();render();sparks();
 toast(`Партия запущена: ${q} × ${esc(m.n)}. Сырьё списано по техкарте, себестоимость ${fmt(cost)} ₸.`)}

/* --- ПЛАН НА ЗАВТРА --- */
SC.plan=()=>`
 <div class="head"><div><h2>План на завтра</h2><p>Система считает, сколько чего испечь: берёт заказы на дату, заявки точек, продажи за четыре недели и остатки. Технологу остаётся проверить и утвердить.</p></div>
 <div class="btns"><button class="btn" onclick="toast('План отправлен в цех и на склад: кондитеры видят задание, кладовщик — потребность в сырье.')">Отправить в цех</button>
 <button class="btn acc" onclick="sparks();toast('План на 03.09 утверждён. Потребность в сырье пересчитана, дефицит выделен.')">Утвердить план</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Позиция</th><th class="right">Заказы на дату</th><th class="right">Заявки точек</th><th class="right">Средние продажи</th><th class="right">Остаток</th><th class="right">К выпуску</th><th>Цех</th></tr></thead><tbody>
 ${[['m1',3,22,26,4,'Горячий'],['m2',1,14,16,2,'Горячий'],['m3',2,11,13,1,'Холодный'],['m5',0,96,104,12,'Горячий'],['m6',0,18,20,6,'Холодный'],['m7',4,26,24,3,'Холодный'],['m8',0,78,84,6,'Горячий']].map(r=>{
  const m=menu(r[0]);const make=Math.max(0,r[1]+r[2]-r[4]);
  return `<tr onclick="newBatch()"><td><b>${esc(m.n)}</b></td>
  <td class="right mono">${r[1]||'—'}</td><td class="right mono">${r[2]}</td><td class="right mono">${r[3]}</td>
  <td class="right mono">${r[4]}</td><td class="right mono"><b>${make}</b></td>
  <td><span class="badge ${r[5]==='Горячий'?'r':'b'}">${r[5]}</span></td></tr>`}).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Потребность в сырье под план</div>
   ${[['Мука высший сорт','48 кг',186,1],['Масло сливочное 82%','62 кг',42,0],['Сыр творожный','18 кг',64,1],['Яйцо С1','34 дес.',96,1],['Мука миндальная','4 кг',11,1]].map(r=>
    `<div class="fr" style="grid-template-columns:190px 84px 1fr"><span>${r[0]}</span><b>нужно ${r[1]}</b>
    <b style="text-align:left;color:${r[3]?'var(--green)':'var(--red)'}">есть ${r[2]} · ${r[3]?'хватает':'не хватает'}</b></div>`).join('')}
   <div class="note" style="--tone:var(--red)"><b>Масла не хватает на план</b><p>Нужно 62 кг, на складе 42. Система подготовила заявку в «МолПродукт» — поставка 2 дня, значит заказывать надо сегодня.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Как считается план</div>
   <div class="chain" style="flex-direction:column;gap:0">
    <div class="st done" style="border-radius:10px 10px 0 0"><code>1</code><b>Заказы на дату</b><small>торты, которые обещаны клиентам</small></div>
    <div class="st done"><code>2</code><b>Заявки точек</b><small>что просят на завтрашнюю витрину</small></div>
    <div class="st done"><code>3</code><b>Средние продажи</b><small>по дню недели за 4 недели</small></div>
    <div class="st now" style="border-radius:0 0 10px 10px"><code>4</code><b>Минус остатки</b><small>то, что уже стоит на точках</small></div>
   </div>
   <div class="note" style="--tone:var(--acc)"><b>Почему это важнее, чем кажется</b><p>Пересчёт «на глаз» даёт либо списания вечером, либо пустую витрину днём. У сети из трёх точек это сотни тысяч тенге в месяц.</p></div>
  </div>
 </div>`;

/* --- ТЕХКАРТЫ --- */
SC.recipes=()=>`
 <div class="head"><div><h2>Техкарты</h2><p>Состав и нормы по каждой позиции. От них считается потребность в сырье, списание при выпуске и себестоимость — а значит, и настоящая маржа.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Новая техкарта создаётся с версией: старые партии остаются привязаны к своей версии.')">+ Техкарта</button></div></div>
 <div class="g11">
 ${RECIPES.map(r=>{const m=menu(r.menu);const mat=r.items.reduce((a,i)=>a+i[2],0);const total=mat+r.work;const base=parseInt(r.out)||1;
  return `<div class="panel"><div class="ph"><div><div class="ph-title">${esc(m.n)}</div>
   <div class="ph-sub">выход: ${r.out} · время ${r.time}</div></div><span class="badge c">${m.cat}</span></div>
   <div class="tw"><table class="data"><thead><tr><th>Сырьё</th><th class="right">Норма</th><th class="right">Сумма</th></tr></thead><tbody>
   ${r.items.map(i=>`<tr style="cursor:default"><td>${i[0]}</td><td class="right mono">${i[1]}</td><td class="right mono">${fmt(i[2])} ₸</td></tr>`).join('')}
   <tr style="cursor:default"><td class="mini">Работа кондитера</td><td class="right mono">${r.time}</td><td class="right mono">${fmt(r.work)} ₸</td></tr>
   </tbody></table></div>
   <div class="kv" style="margin-top:8px"><span>Себестоимость единицы</span><b class="mono">${fmt(total/base)} ₸</b></div>
   <div class="kv"><span>Цена продажи</span><b class="mono">${fmt(m.price)} ₸ · маржа ${Math.round((m.price-total/base)/m.price*100)}%</b></div>
  </div>`}).join('')}
 </div>
 <div class="hint"><b>Что меняется, когда техкарты в системе:</b> при подорожании масла себестоимость всех позиций пересчитывается сама, и сразу видно, где маржа упала ниже нормы и что пора поднимать в цене.</div>`;

/* --- СПИСАНИЕ --- */
SC.writeoff=()=>`
 <div class="head"><div><h2>Списание и брак</h2><p>Всё, что не продалось или испорчено: причина, количество, деньги и ответственный. Без этого списания растворяются в «усушке» и съедают маржу.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Списание оформлено: позиция, причина, фото и ответственный записаны.')">+ Списание</button></div></div>
 <div class="strip">
  <div><small>СПИСАНО ЗА МЕСЯЦ</small><b class="r">318 000 ₸</b><span>3,4% от выручки</span></div>
  <div><small>ПО СРОКУ ГОДНОСТИ</small><b>214 000 ₸</b><span>67% списаний</span></div>
  <div><small>БРАК В ЦЕХЕ</small><b>68 000 ₸</b><span>1,2% выпуска</span></div>
  <div><small>БОЙ И ПОВРЕЖДЕНИЯ</small><b>36 000 ₸</b><span>при перевозке</span></div>
  <div><small>ЕСЛИ ДОВЕСТИ ДО НОРМЫ</small><b class="g">+112 000 ₸</b><span>в месяц</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:860px"><thead><tr>
  <th>Дата</th><th>Где</th><th>Позиция</th><th class="right">Кол-во</th><th class="right">Сумма</th><th>Причина</th><th>Кто оформил</th></tr></thead><tbody>
 ${[['01.09 21:10','Точка 3','Эклер классический',8,6000,'истёк срок','Айдана'],
    ['01.09 20:45','Точка 1','Круассан с миндалём',4,3600,'истёк срок','Динара'],
    ['01.09 14:20','Цех','Чизкейк Нью-Йорк',1,11500,'брак: треснул корж','Гульмира'],
    ['31.08 21:00','Точка 2','Капкейк ассорти',3,7200,'истёк срок','Асель'],
    ['31.08 08:15','Перевозка','Торт «Медовик»',1,9200,'повреждён при доставке','Марат']]
  .map(r=>`<tr onclick="toast('Карточка списания: фото, причина, ответственный и влияние на маржу точки.')">
  <td class="mono">${r[0]}</td><td class="mini">${r[1]}</td><td><b>${r[2]}</b></td>
  <td class="right mono">${r[3]}</td><td class="right mono">${fmt(r[4])} ₸</td>
  <td><span class="badge ${r[5].includes('брак')?'r':r[5].includes('поврежд')?'a':''}">${r[5]}</span></td>
  <td class="mini">${r[6]}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Списание — это не «мелочь в конце дня»:</b> 318 000 ₸ в месяц по сети. Когда каждая позиция попадает в систему с причиной, видно, что на Сатпаева возят слишком много эклеров, а не «люди стали меньше покупать».</div>`;

/* --- СКЛАД --- */
SC.stock=()=>{const low=STOCK.filter(s=>s.qty<s.min);
 return `<div class="head"><div><h2>Склад</h2><p>Сырьё и упаковка с остатками, сроками и минимальными запасами. Расход списывается автоматически при выпуске партий — вручную ничего не заносят.</p></div>
 <div class="btns"><button class="btn" onclick="go('purchase')">Закуп</button><button class="btn acc" onclick="toast('Приёмка оформлена: партия, срок годности и документы поставщика прикреплены.')">+ Приём</button></div></div>
 <div class="strip">
  <div><small>ПОЗИЦИЙ НА СКЛАДЕ</small><b>${STOCK.length}</b><span>сырьё и упаковка</span></div>
  <div><small>СТОИМОСТЬ ОСТАТКОВ</small><b>${fmt(STOCK.reduce((a,s)=>a+s.qty*s.price,0))} ₸</b><span>по закупу</span></div>
  <div><small>НИЖЕ МИНИМУМА</small><b class="${low.length?'r':'g'}">${low.length}</b><span>${low.length?low.map(s=>s.n.split(' ')[0]).join(', '):'всё в норме'}</span></div>
  <div><small>ИСТЕКАЕТ ЗА 14 ДНЕЙ</small><b class="a">2</b><span>яйцо, сливки</span></div>
  <div><small>РАСХОД ЗА СМЕНУ</small><b>214 000 ₸</b><span>списано по техкартам</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:880px"><thead><tr>
  <th>Позиция</th><th>Тип</th><th class="right">Остаток</th><th class="right">Минимум</th><th class="right">Хватит на</th><th>Годен до</th><th class="right">Сумма</th><th>Состояние</th></tr></thead><tbody>
 ${STOCK.map(s=>{const days=Math.round(s.qty/(s.min/5));
  return `<tr onclick="openStock('${esc(s.n)}')"><td><b>${esc(s.n)}</b></td><td class="mini">${s.cat}</td>
  <td class="right mono"><b>${fmt(s.qty)}</b> ${s.unit}</td><td class="right mono">${s.min}</td>
  <td class="right mono">${days} дн.</td><td class="mono">${s.exp}</td>
  <td class="right mono">${fmt(s.qty*s.price)} ₸</td>
  <td>${s.qty<s.min?'<span class="badge r">заказать</span>':s.qty<s.min*1.4?'<span class="badge a">заканчивается</span>':'<span class="badge g">в норме</span>'}</td></tr>`}).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Что заказать сегодня</div>
   ${low.map(s=>`<div class="kv"><span>${esc(s.n)}</span><b>нужно ${Math.round(s.min*1.6-s.qty)} ${s.unit}<div class="sub">поставка 2 дня</div></b></div>`).join('')||'<p class="mini">Дефицита нет.</p>'}
   <button class="btn acc" style="width:100%;margin-top:9px" onclick="go('purchase')">Сформировать заявку поставщикам</button>
  </div>
  <div class="panel"><div class="ph-title">Как расходуется сырьё</div>
   <div class="note" style="--tone:var(--acc)"><b>Списание по техкарте при выпуске</b><p>Запустили партию — сырьё ушло. Остаток на экране всегда равен факту в холодильнике, если инвентаризация не показала иного.</p></div>
   <div class="note" style="--tone:var(--amber)"><b>Сроки годности сырья</b><p>Яйцо до 14.09, сливки до 19.09. Система подсказывает пустить их в ближайший выпуск, а не держать «на потом».</p></div>
   <button class="btn" style="width:100%;margin-top:9px" onclick="toast('Инвентаризация: вводим факт, система показывает расхождение по каждой позиции и сумму.')">Инвентаризация</button>
  </div>
 </div>`};
function openStock(n){const s=STOCK.find(x=>x.n===n);
 openD(esc(s.n),`${s.cat} · остаток ${fmt(s.qty)} ${s.unit}`,[],
 `<div class="strip" style="grid-template-columns:repeat(3,1fr)">
   <div><small>ОСТАТОК</small><b class="${s.qty<s.min?'r':''}">${fmt(s.qty)} ${s.unit}</b><span>минимум ${s.min}</span></div>
   <div><small>СУММА</small><b>${fmt(s.qty*s.price)} ₸</b><span>${fmt(s.price)} ₸ за ${s.unit}</span></div>
   <div><small>ГОДЕН ДО</small><b>${s.exp}</b><span>${s.exp==='—'?'без срока':'следим'}</span></div>
  </div>
  <div class="panel"><div class="ph-title">Движение за неделю</div>
   ${[['02.09','Списание в цех','−34 '+s.unit],['01.09','Приход от поставщика','+80 '+s.unit],['31.08','Списание в цех','−41 '+s.unit],['30.08','Списание в цех','−28 '+s.unit]]
    .map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b class="mono">${r[2]}</b></div>`).join('')}
  </div>
  <div class="btns"><button class="btn acc" onclick="closeD();go('purchase')">Заказать у поставщика</button>
  <button class="btn" onclick="toast('Списание оформлено с указанием причины.')">Списать</button></div>`)}

/* --- ЗАКУП --- */
SC.purchase=()=>`
 <div class="head"><div><h2>Закуп</h2><p>Потребность считается из плана производства и минимальных остатков. Заявка уходит поставщику, приход встаёт на склад с партией и сроком.</p></div>
 <div class="btns"><button class="btn acc" onclick="sparks();toast('Заявки отправлены трём поставщикам: «МолПродукт», «СырТрейд» и ИП Ахметов. Ожидаемая поставка — 04.09.')">Отправить заявки</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:880px"><thead><tr>
  <th>Позиция</th><th class="right">Нужно по плану</th><th class="right">На складе</th><th class="right">Заказать</th><th>Поставщик</th><th class="right">Сумма</th><th>Срок</th></tr></thead><tbody>
 ${[['Масло сливочное 82%','62 кг',42,'60 кг','ТОО «МолПродукт»',240000,'2 дня'],
    ['Мука миндальная','4 кг',11,'10 кг','ТОО «СырТрейд»',80000,'3 дня'],
    ['Сыр творожный','18 кг',64,'—','ТОО «СырТрейд»',0,'—'],
    ['Яйцо С1','34 дес.',96,'60 дес.','ИП Ахметов',42000,'1 день'],
    ['Коробки под торт','120 шт',820,'—','ТОО «ПакСервис»',0,'—']]
  .map(r=>`<tr onclick="toast('Заявка поставщику: позиции, количество, цена и срок поставки. После приёмки товар встаёт на склад партией.')">
  <td><b>${r[0]}</b></td><td class="right mono">${r[1]}</td><td class="right mono">${r[2]}</td>
  <td class="right mono"><b>${r[3]}</b></td><td class="mini">${r[4]}</td>
  <td class="right mono">${r[5]?fmt(r[5])+' ₸':'—'}</td><td class="mini">${r[6]}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Последние приходы</div>
   ${[['01.09','ИП Ахметов','Мука 80 кг, сахар 100 кг','78 400'],['31.08','ТОО «МолПродукт»','Масло 40 кг, сливки 30 л','232 000'],['28.08','ТОО «СырТрейд»','Сыр творожный 45 кг','157 500']]
    .map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}<div class="sub">${r[2]}</div></span><b class="mono">${r[3]} ₸</b></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Долги поставщикам</div>
   ${SUPPLIERS.filter(s=>s.debt).map(s=>`<div class="kv"><span>${esc(s.n)}</span><b class="mono" style="color:var(--red)">${fmt(s.debt)} ₸</b></div>`).join('')}
   <div class="kv"><span>Итого к оплате</span><b class="mono">${fmt(SUPPLIERS.reduce((a,s)=>a+s.debt,0))} ₸</b></div>
   <div class="note" style="--tone:var(--acc)"><b>Закуп связан с производством</b><p>Потребность берётся не «на глаз», а из утверждённого плана выпуска и заказов на даты. Поэтому масло не заканчивается в среду утром.</p></div>
  </div>
 </div>`;

SC.suppliers=()=>`
 <div class="head"><div><h2>Поставщики</h2><p>Кто чем поставляет, за сколько дней привозит, сколько раз подводил по качеству и сколько мы должны.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Карточка поставщика создана: договор, цены, условия оплаты и контакты.')">+ Поставщик</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px"><thead><tr>
  <th>Поставщик</th><th>Что поставляет</th><th class="right">Срок поставки</th><th class="right">Качество</th><th class="right">Долг</th><th>Последняя поставка</th></tr></thead><tbody>
 ${SUPPLIERS.map(s=>`<tr onclick="toast('История поставок, цены по позициям и претензии по качеству.')">
  <td><b>${esc(s.n)}</b></td><td class="mini">${s.what}</td>
  <td class="right mono">${s.days} дн.</td>
  <td class="right"><span class="badge ${s.quality>95?'g':'a'}">${s.quality}%</span></td>
  <td class="right mono" style="color:${s.debt?'var(--red)':'var(--green)'}">${s.debt?fmt(s.debt):'—'}</td>
  <td class="mono">${s.last}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Зачем это в системе:</b> когда масло дорожает на 12%, видно, как это меняет себестоимость каждого торта и какие позиции уходят в минус по марже. Решение о цене принимается по цифрам, а не по ощущению «вроде подорожало».</div>`;

/* --- ПЕРЕМЕЩЕНИЯ --- */
SC.moves=()=>`
 <div class="head"><div><h2>Перемещения и возвраты</h2><p>Отгрузка продукции из цеха на точки и возврат нереализованного. Точка принимает привоз в один клик — расхождения видны сразу.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Задание на отгрузку сформировано из заявок точек и готовых партий.')">+ Отгрузка на точки</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:880px"><thead><tr>
  <th>Документ</th><th>Направление</th><th>Точка</th><th>Состав</th><th>Когда</th><th class="right">Сумма</th><th>Статус</th></tr></thead><tbody>
 ${MOVES.map(m=>`<tr onclick="openMove('${m.id}')"><td class="mono"><b>${m.id}</b></td>
  <td><span class="badge ${m.dir==='возврат'?'a':'b'}">${m.dir}</span></td>
  <td class="mini">${POINTS.find(p=>p.id===m.point)?.n||'—'}</td>
  <td class="mini">${esc(m.what)}</td><td class="mono">${m.when}</td>
  <td class="right mono">${fmt(m.sum)} ₸</td>
  <td><span class="badge ${m.st==='принято'?'g':m.st==='списано'?'r':'a'}">${m.st}</span></td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Как проходит день</div>
   <div class="chain">
    <div class="st done"><code>05:00</code><b>Цех печёт</b><small>по плану на день</small></div>
    <div class="st done"><code>07:00</code><b>Сборка на точки</b><small>по заявкам точек</small></div>
    <div class="st now"><code>07:40</code><b>Приёмка на точке</b><small>кассир принимает в один клик</small></div>
    <div class="st"><code>21:00</code><b>Возврат и списание</b><small>что не продалось</small></div>
   </div>
   <div class="note" style="--tone:var(--acc)"><b>Расхождения видны сразу</b><p>Если из цеха ушло 8 «Наполеонов», а точка приняла 7 — система покажет разницу в момент приёмки, а не в конце месяца при инвентаризации.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Возвраты за неделю</div>
   ${[['Точка 1',12,9000],['Точка 2',6,4800],['Точка 3',28,21600]].map(r=>
    `<div class="fr" style="grid-template-columns:120px 1fr 96px"><span>${r[0]}</span>
    <div class="bar"><i style="--w:${r[1]*3}%;background:${r[1]>20?'var(--red)':'var(--acc)'}"></i></div><b>${r[1]} шт · ${fmt(r[2])} ₸</b></div>`).join('')}
   <div class="note" style="--tone:var(--red)"><b>Точка 3 возвращает втрое больше</b><p>Система предлагает урезать привоз эклеров и капкейков на 20% — это минус 15 000 ₸ списаний в неделю.</p></div>
  </div>
 </div>`;
function openMove(id){const m=MOVES.find(x=>x.id===id);
 openD(`Перемещение ${m.id}`,`${m.dir} · ${POINTS.find(p=>p.id===m.point)?.n||''} · ${m.when}`,[],
 `<div class="panel">
   <div class="kv"><span>Состав</span><b style="max-width:62%">${esc(m.what)}</b></div>
   <div class="kv"><span>Сумма по себестоимости</span><b class="mono">${fmt(m.sum*0.42)} ₸</b></div>
   <div class="kv"><span>Сумма по продаже</span><b class="mono">${fmt(m.sum)} ₸</b></div>
   <div class="kv"><span>Статус</span><b><span class="badge ${m.st==='принято'?'g':'a'}">${m.st}</span></b></div>
  </div>
  ${m.st!=='принято'&&m.dir==='на точку'?`<div class="btns"><button class="btn g" onclick="acceptMove('${id}')">Принять на точке</button>
  <button class="btn r" onclick="toast('Расхождение зафиксировано: указывается позиция, количество и причина. Уходит уведомление в цех.')">Есть расхождение</button></div>`:''}
  <div class="note" style="--tone:var(--acc)"><b>Приёмка в один клик</b><p>Кассир на точке открывает документ на телефоне и подтверждает привоз — витрина точки обновляется автоматически.</p></div>`)}
function acceptMove(id){const m=MOVES.find(x=>x.id===id);m.st='принято';closeD();render();sparks();
 toast(`Привоз <b>${id}</b> принят на точке. Позиции встали на витрину, остатки точки обновились.`)}

/* --- АССОРТИМЕНТ --- */
SC.menu=()=>`
 <div class="head"><div><h2>Ассортимент</h2><p>Позиции с ценой, себестоимостью и маржой. Один справочник для кассы, сайта, приложения и производства — не три разных прайса.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Позиция создана и появилась в кассе, на сайте и в приложении.')">+ Позиция</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:860px"><thead><tr>
  <th>Позиция</th><th>Категория</th><th class="right">Цена</th><th class="right">Себестоимость</th><th class="right">Маржа</th><th class="right">Срок годности</th><th>Где продаётся</th></tr></thead><tbody>
 ${MENU.map(m=>`<tr onclick="toast('Карточка позиции: техкарта, продажи по точкам, фото для сайта и приложения.')">
  <td><b>${esc(m.n)}</b></td><td><span class="badge c">${m.cat}</span></td>
  <td class="right mono">${fmt(m.price)}</td><td class="right mono">${fmt(m.cost)}</td>
  <td class="right mono" style="color:var(--green)"><b>${Math.round((m.price-m.cost)/m.price*100)}%</b></td>
  <td class="right mono">${m.shelf?m.shelf+' дн.':'—'}</td>
  <td class="mini">${m.type==='заказ'?'заказ на дату':'витрина, сайт, приложение'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Одна номенклатура вместо трёх:</b> сейчас позиции живут в Yuma, в Битриксе и в прайсе для сайта. Поменяли цену в одном месте — она поменялась в кассе, на витрине сайта и в приложении.</div>`;

/* --- ДОСТАВКА --- */
SC.delivery=()=>`
 <div class="head"><div><h2>Доставка</h2><p>Заказы с адресами и временем, курьеры и статусы. Клиент получает сообщение, когда курьер выехал, — звонков «где мой торт» становится меньше.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Маршрут собран: заказы сгруппированы по районам и времени доставки.')">Собрать маршрут</button>
 <button class="btn acc" onclick="toast('Курьеру отправлено задание в телефон: адреса, время, контакты и суммы к получению.')">Отправить курьерам</button></div></div>
 <div class="strip">
  <div><small>ДОСТАВОК СЕГОДНЯ</small><b>${DELIV.filter(d=>d.st!=='выдан').length}</b><span>активных</span></div>
  <div><small>КУРЬЕРОВ НА СМЕНЕ</small><b>2</b><span>Ерлан, Азамат</span></div>
  <div><small>ВОВРЕМЯ</small><b class="g">94%</b><span>за месяц</span></div>
  <div><small>СРЕДНЕЕ ВРЕМЯ</small><b>48 мин</b><span>от сборки до вручения</span></div>
  <div><small>СТОИМОСТЬ ДОСТАВКИ</small><b>1 500 ₸</b><span>бесплатно от 25 000 ₸</span></div>
 </div>
 <div class="g21">
  <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px"><thead><tr>
   <th>Доставка</th><th>Заказ</th><th>Адрес</th><th>Когда</th><th>Курьер</th><th class="right">Сумма</th><th>Статус</th></tr></thead><tbody>
  ${DELIV.map(d=>`<tr onclick="openDeliv('${d.id}')"><td class="mono"><b>${d.id}</b></td>
   <td class="mono">№${d.order}</td><td class="mini">${esc(d.addr)}</td><td class="mono">${d.when}</td>
   <td class="mini">${d.courier}</td><td class="right mono">${fmt(d.sum)} ₸</td>
   <td><span class="badge ${d.st==='выдан'?'g':d.st==='назначена'?'b':'a'}">${d.st}</span></td></tr>`).join('')}
  </tbody></table></div></div>
  <div>
   <div class="panel"><div class="ph-title">Что видит курьер в телефоне</div>
    <div class="chain" style="flex-direction:column;gap:6px">
     <div class="st done" style="border-radius:10px"><code>ТОЧКА 1 · ВЫПОЛНЕНО</code><b>Жандосова 58</b><small>вручено в 12:40, фото торта приложено</small></div>
     <div class="st now" style="border-radius:10px"><code>ТОЧКА 2 · СЕЙЧАС</code><b>Достык 132, офис 4</b><small>к 10:00 · получить 24 000 ₸</small></div>
     <div class="st" style="border-radius:10px"><code>ТОЧКА 3</code><b>Самал-2, д. 33</b><small>15:00 · оплачено полностью</small></div>
    </div>
    <div class="note" style="--tone:var(--acc)"><b>Торт — хрупкий груз</b><p>Курьер обязан приложить фото при вручении. Это снимает споры «привезли помятый» и защищает от необоснованных возвратов.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Клиенту уходит автоматически</div>
    ${[['Заказ принят','сразу'],['Предоплата получена','при оплате'],['Торт готов','из цеха'],['Курьер выехал','при старте'],['Доставлено','с фото']]
     .map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}
   </div>
  </div>
 </div>`;
function openDeliv(id){const d=DELIV.find(x=>x.id===id);const o=ORDERS.find(x=>x.id===d.order);
 openD(`Доставка ${d.id}`,`Заказ №${d.order} · ${d.when}`,[],
 `<div class="panel">
   <div class="kv"><span>Клиент</span><b>${o?esc(o.cl)+' · '+o.ph:'—'}</b></div>
   <div class="kv"><span>Что везём</span><b style="max-width:60%">${o?esc(o.what):'—'}</b></div>
   <div class="kv"><span>Адрес</span><b>${esc(d.addr)}</b></div>
   <div class="kv"><span>Время</span><b>${d.when}</b></div>
   <div class="kv"><span>Курьер</span><b>${d.courier}</b></div>
   <div class="kv"><span>К оплате при вручении</span><b class="mono">${o?tg(o.sum-o.paid):'—'}</b></div>
  </div>
  ${d.st!=='выдан'?`<div class="btns"><button class="btn acc" onclick="assignCourier('${id}')">Назначить курьера</button>
  <button class="btn g" onclick="deliverDone('${id}')">Отметить доставленным</button>
  <button class="btn" onclick="toast('Клиенту отправлено сообщение: курьер выехал, будет в течение 40 минут.')">Уведомить клиента</button></div>`
  :`<div class="note" style="--tone:var(--green)"><b>Доставлено</b><p>Фото вручения приложено, оплата получена, заказ закрыт.</p></div>`}`)}
function assignCourier(id){const d=DELIV.find(x=>x.id===id);d.courier='Азамат';d.st='назначена';closeD();render();
 toast('Курьер назначен, задание ушло ему в телефон: адрес, время, контакт и сумма к получению.')}
function deliverDone(id){const d=DELIV.find(x=>x.id===id);d.st='выдан';
 const o=ORDERS.find(x=>x.id===d.order);if(o){o.st='done';o.paid=o.sum}
 closeD();render();sparks();
 toast(`Доставка <b>${id}</b> закрыта: фото вручения приложено, остаток оплаты получен, заказ переведён в «Выдан».`)}

/* --- КЛИЕНТЫ --- */
SC.clients=()=>`
 <div class="head"><div><h2>Клиенты</h2><p>База с историей заказов, любимыми позициями и датами праздников. Именно она приносит повторные заказы: торт нужен каждый год в одну и ту же дату.</p></div>
 <div class="btns"><input class="search" placeholder="Поиск по имени, телефону, заказу…"><button class="btn acc" onclick="go('loyalty')">Лояльность</button></div></div>
 <div class="strip">
  <div><small>КЛИЕНТОВ В БАЗЕ</small><b>3 480</b><span>с историей заказов</span></div>
  <div><small>ПОВТОРНЫЕ ЗАКАЗЫ</small><b class="c">46%</b><span>от всех заказов</span></div>
  <div><small>ДНИ РОЖДЕНИЯ НА НЕДЕЛЕ</small><b class="a">28</b><span>повод написать</span></div>
  <div><small>СРЕДНИЙ ЧЕК ПОВТОРНОГО</small><b>31 200 ₸</b><span>против 24 800 ₸ у новых</span></div>
  <div><small>КОРПОРАТИВНЫХ</small><b>64</b><span>компании и офисы</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Клиент</th><th>Телефон</th><th class="right">Заказов</th><th class="right">Сумма за год</th><th>Любимое</th><th>Праздник</th><th>Карта</th><th class="right">Бонусы</th></tr></thead><tbody>
 ${CLIENTS.map(c=>`<tr onclick="openClient('${esc(c.n)}')"><td><b>${esc(c.n)}</b></td><td class="mono">${c.ph}</td>
  <td class="right mono">${c.orders}</td><td class="right mono">${fmt(c.sum)}</td>
  <td class="mini">${c.fav}</td><td class="mono">${c.bday}</td>
  <td><span class="badge ${c.card==='Золотая'?'a':c.card==='Корпоратив'?'v':'c'}">${c.card}</span></td>
  <td class="right mono">${c.bonus?fmt(c.bonus):'—'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Что это даёт:</b> за неделю до дня рождения клиента система напоминает менеджеру или сама отправляет сообщение с предложением. Из тех, кто заказывал торт год назад, откликается около трети — это продажи без единого тенге на рекламу.</div>`;
function openClient(n){const c=CLIENTS.find(x=>x.n===n);
 openD(esc(c.n),`${c.ph} · ${c.orders} заказов на ${fmt(c.sum)} ₸`,[],
 `<div class="strip" style="grid-template-columns:repeat(3,1fr)">
   <div><small>ЗАКАЗОВ</small><b>${c.orders}</b><span>за год</span></div>
   <div><small>СУММА</small><b>${fmt(c.sum)} ₸</b><span>средний ${fmt(c.sum/c.orders)} ₸</span></div>
   <div><small>БОНУСЫ</small><b class="c">${fmt(c.bonus)} ₸</b><span>карта «${c.card}»</span></div>
  </div>
  <div class="panel"><div class="ph-title">История заказов</div>
   ${[['15.08','Торт «Наполеон» 2 кг','19 600'],['12.05','Капкейки 12 шт','7 200'],['09.03','Торт «Медовик» 3 кг','27 600'],['12.09.25','Торт на день рождения 3 кг','29 400']]
    .map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b class="mono">${r[2]} ₸</b></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Что знает о клиенте система</div>
   <div class="kv"><span>Любимая позиция</span><b>${c.fav}</b></div>
   <div class="kv"><span>День рождения</span><b>${c.bday}</b></div>
   <div class="kv"><span>Как чаще заказывает</span><b>Instagram · доставка</b></div>
   <div class="kv"><span>Средний интервал</span><b>раз в 2,5 месяца</b></div>
  </div>
  <div class="btns"><button class="btn acc" onclick="toast('Сообщение отправлено в WhatsApp: поздравление и предложение любимого торта со скидкой 10%.')">Написать к празднику</button>
  <button class="btn" onclick="toast('Создан заказ на основе прошлого: тот же торт, размер и адрес — осталось уточнить дату.')">Повторить заказ</button></div>`)}

/* --- ЛОЯЛЬНОСТЬ --- */
SC.loyalty=()=>`
 <div class="head"><div><h2>Система лояльности</h2><p>Карты, бонусы и сегменты. Работает на кассе, в приложении и при заказе через оператора — одна база на всю сеть, включая франчайзи.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Правила начисления настраиваются: процент, повышенные категории, акции по дням недели.')">Правила начисления</button>
 <button class="btn acc" onclick="sparks();toast('Рассылка запущена: 28 клиентам с днём рождения на неделе ушло поздравление и промокод на 10%.')">Запустить рассылку</button></div></div>
 <div class="strip">
  <div><small>УЧАСТНИКОВ</small><b>2 140</b><span>61% клиентской базы</span></div>
  <div><small>НАЧИСЛЕНО ЗА МЕСЯЦ</small><b>486 000 ₸</b><span>3% с покупок</span></div>
  <div><small>СПИСАНО</small><b class="c">312 000 ₸</b><span>вернулись покупками</span></div>
  <div><small>ДОЛЯ ПОКУПОК С КАРТОЙ</small><b>58%</b><span>видим, кто покупает</span></div>
  <div><small>ПОВТОРНЫЕ С КАРТОЙ</small><b class="g">×1,7</b><span>чаще, чем без карты</span></div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Уровни карт</div>
   <div class="tw"><table class="data"><thead><tr><th>Уровень</th><th class="right">Условие</th><th class="right">Кэшбэк</th><th class="right">Клиентов</th></tr></thead><tbody>
   ${[['Базовая','с первой покупки','3%',1420],['Серебряная','от 60 000 ₸ за год','5%',540],['Золотая','от 150 000 ₸ за год','7%',180],['Корпоратив','договор с компанией','отсрочка',64]]
    .map(r=>`<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="right mini">${r[1]}</td><td class="right mono">${r[2]}</td><td class="right mono">${r[3]}</td></tr>`).join('')}
   </tbody></table></div>
  </div>
  <div class="panel"><div class="ph-title">Сегменты для рассылок</div>
   ${[['День рождения на неделе',28,'поздравление и скидка 10%'],['Не заказывали 3 месяца',312,'напоминание о себе'],['Заказывали торт год назад',96,'«годовщина» — повод'],['Корпоративные клиенты',64,'предложение на праздники']].map(r=>
    `<div class="kv" style="cursor:pointer" onclick="toast('Сегмент «${r[0]}»: ${r[1]} клиентов. Рассылка уходит в WhatsApp с персональным предложением.')">
    <span>${r[0]}<div class="sub">${r[2]}</div></span><b>${r[1]} чел.</b></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Это не спам, а поводы</b><p>Система пишет клиенту тогда, когда ему действительно нужен торт: день рождения, годовщина прошлого заказа, корпоративные праздники.</p></div>
  </div>
 </div>`;

/* --- КАМПАНИИ --- */
SC.campaigns=()=>{const tot=CAMPS.reduce((a,c)=>({spend:a.spend+c.spend,leads:a.leads+c.leads,orders:a.orders+c.orders,rev:a.rev+c.rev}),{spend:0,leads:0,orders:0,rev:0});
 return `<div class="head"><div><h2>Кампании и лиды</h2><p>Сколько потратили на таргет и блогеров и что это принесло — не «охваты», а заказы и выручку. Источник фиксируется в момент обращения и ведётся до оплаты.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Отчёт по кампаниям за период выгружен в Excel.')">Выгрузить</button></div></div>
 <div class="strip">
  <div><small>РАСХОД НА РЕКЛАМУ</small><b>${fmt(tot.spend)} ₸</b><span>за август</span></div>
  <div><small>ОБРАЩЕНИЙ</small><b>${tot.leads}</b><span>цена лида ${fmt(tot.spend/tot.leads)} ₸</span></div>
  <div><small>ЗАКАЗОВ</small><b class="c">${tot.orders}</b><span>цена заказа ${fmt(tot.spend/tot.orders)} ₸</span></div>
  <div><small>ВЫРУЧКА С РЕКЛАМЫ</small><b class="g">${mln(tot.rev)} млн ₸</b><span>окупаемость ×${num(tot.rev/tot.spend)}</span></div>
  <div><small>СРЕДНИЙ ЗАКАЗ</small><b>${fmt(tot.rev/tot.orders)} ₸</b><span>по всем каналам</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Кампания</th><th class="right">Расход</th><th class="right">Лидов</th><th class="right">Цена лида</th><th class="right">Заказов</th><th class="right">Цена заказа</th><th class="right">Выручка</th><th class="right">Окупаемость</th></tr></thead><tbody>
 ${CAMPS.map(c=>`<tr onclick="toast('Разрез по кампании: обращения по дням, какие торты заказывали, средний чек и повторные покупки.')">
  <td><b>${esc(c.n)}</b></td>
  <td class="right mono">${c.spend?fmt(c.spend):'—'}</td><td class="right mono">${c.leads}</td>
  <td class="right mono">${c.spend?fmt(c.spend/c.leads):'—'}</td>
  <td class="right mono"><b>${c.orders}</b></td>
  <td class="right mono">${c.spend?fmt(c.spend/c.orders):'—'}</td>
  <td class="right mono">${fmt(c.rev)}</td>
  <td class="right mono" style="color:var(--green)">${c.spend?'×'+num(c.rev/c.spend):'—'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Главный вывод такой таблицы:</b> TikTok даёт лид дешевле, но заказы там мельче; таргет в Instagram дороже, зато приносит заказные торты со средним чеком выше 30 000 ₸. Это видно только тогда, когда источник тянется от обращения до оплаченного заказа.</div>`};

/* --- САЙТ --- */
SC.site=()=>`
 <div class="head"><div><h2>Сайт и приложение</h2><p>Витрина с ценами, заказ на дату, разделы для франшизы и поставщиков. Всё на одной базе с порталом: заказ с сайта сразу падает оператору.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Заказ с сайта появился в ленте обращений и в воронке заказов.')">Проверить заказ с сайта</button></div></div>
 <div class="g3">
  <div class="panel"><div class="ph-title">Витрина и заказ</div>
   <p class="mini" style="margin-top:4px">Каталог тортов и пирожных с ценами и фото, выбор даты и времени, предоплата картой или Kaspi. Заказ падает оператору с указанием источника.</p>
   <div class="kv" style="margin-top:8px"><span>Заказов с сайта за месяц</span><b>34</b></div>
   <div class="kv"><span>Средний чек</span><b class="mono">28 000 ₸</b></div>
  </div>
  <div class="panel"><div class="ph-title">Раздел «Франшиза»</div>
   <p class="mini" style="margin-top:4px">Условия, окупаемость, форма заявки. Заявка попадает в отдельную воронку франчайзинга — не смешивается с заказами тортов.</p>
   <div class="kv" style="margin-top:8px"><span>Заявок на франшизу</span><b>12 за месяц</b></div>
   <div class="kv"><span>Дошли до договора</span><b>2</b></div>
  </div>
  <div class="panel"><div class="ph-title">Раздел «Поставщикам»</div>
   <p class="mini" style="margin-top:4px">Форма для поставщиков сырья и упаковки: что предлагают, цены, сроки. Заявка уходит в закуп, а не теряется на общей почте.</p>
   <div class="kv" style="margin-top:8px"><span>Предложений за месяц</span><b>7</b></div>
   <div class="kv"><span>Взяли в работу</span><b>2</b></div>
  </div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Приложение для клиентов</div>
   <div class="note" style="--tone:var(--acc)"><b>Повторный заказ в два касания</b><p>История заказов, любимые позиции, бонусы на карте и заказ на дату. Постоянному клиенту не нужно писать в директ.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Бонусы видны клиенту</b><p>Человек видит накопленное и приходит их потратить — это работает лучше скидок.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Что связывает сайт с порталом</div>
   ${[['Каталог и цены','из общей номенклатуры'],['Остатки и доступность','из склада и точек'],['Заказ','в воронку оператора'],['Оплата','Kaspi, приходит в финансы'],['Статус заказа','виден клиенту в приложении']]
    .map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}
  </div>
 </div>`;

/* --- ФРАНШИЗА --- */
SC.franch=()=>`
 <div class="head"><div><h2>Франчайзинговая сеть</h2><p>Партнёры получают тот же портал, но видят только свою точку. Управляющая компания видит всех: выручку, роялти, закуп и соблюдение стандартов.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Пакет для нового партнёра: доступы в портал, стандарты, обучение и первый заказ у УК.')">Подключить партнёра</button>
 <button class="btn acc" onclick="go('fdash')">Открыть кабинет франчайзи</button></div></div>
 <div class="strip">
  <div><small>ПАРТНЁРОВ</small><b>${FRANCH.length}</b><span>${FRANCH.filter(f=>f.st==='работает').length} работают, 1 открывается</span></div>
  <div><small>ВЫРУЧКА ПАРТНЁРОВ</small><b>${mln(FRANCH.reduce((a,f)=>a+f.rev,0))} млн ₸</b><span>за август</span></div>
  <div><small>РОЯЛТИ</small><b class="c">${fmt(FRANCH.reduce((a,f)=>a+f.royalty,0))} ₸</b><span>5% с выручки</span></div>
  <div><small>ЗАКУП У УК</small><b>${FRANCH.reduce((a,f)=>a+f.orders,0)} заказов</b><span>сырьё и полуфабрикаты</span></div>
  <div><small>ЗАЯВОК НА ФРАНШИЗУ</small><b class="a">12</b><span>с сайта за месяц</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Партнёр</th><th>Владелец</th><th>Открытие</th><th class="right">Выручка</th><th class="right">Роялти</th><th class="right">Заказов в УК</th><th>Стандарты</th><th>Статус</th></tr></thead><tbody>
 ${FRANCH.map(f=>`<tr onclick="openFranch('${f.id}')"><td><b>${esc(f.n)}</b></td><td class="mini">${f.owner}</td>
  <td class="mono">${f.open}</td>
  <td class="right mono">${f.rev?fmt(f.rev):'—'}</td><td class="right mono">${f.royalty?fmt(f.royalty):'—'}</td>
  <td class="right mono">${f.orders}</td>
  <td>${f.st==='работает'?'<span class="badge g">соблюдает</span>':'<span class="badge b">обучение</span>'}</td>
  <td><span class="badge ${f.st==='работает'?'g':'a'}">${f.st}</span></td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Как это устроено технически</div>
   <div class="note" style="--tone:var(--acc)"><b>Одна система, разные кабинеты</b><p>Партнёр входит в тот же портал, но видит только свою точку: продажи, заказы, склад и обучение. Чужие данные ему недоступны.</p></div>
   <div class="note" style="--tone:var(--violet)"><b>Портал как часть франшизы</b><p>Партнёр покупает не только рецепты и бренд, но и готовую систему управления. Это заметно повышает ценность пакета — и вы сами владеете этой системой.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Роялти считается само</b><p>Процент берётся от выручки, которая видна в системе. Не нужно просить у партнёра отчёты и сверять их вручную.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Что УК контролирует у партнёров</div>
   ${[['Выручка и средний чек','онлайн'],['Закуп сырья у УК','по заказам'],['Ассортимент и цены','по стандарту сети'],['Списания','не выше нормы'],['Обучение персонала','через корпоративный университет']]
    .map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}
   <button class="btn" style="width:100%;margin-top:9px" onclick="go('staff')">Корпоративный университет</button>
  </div>
 </div>`;
function openFranch(id){const f=FRANCH.find(x=>x.id===id);
 openD(esc(f.n),`Франчайзи · ${f.owner} · открытие ${f.open}`,[],
 `<div class="strip" style="grid-template-columns:repeat(3,1fr)">
   <div><small>ВЫРУЧКА</small><b>${f.rev?fmt(f.rev):'—'} ₸</b><span>за август</span></div>
   <div><small>РОЯЛТИ 5%</small><b class="c">${f.royalty?fmt(f.royalty):'—'} ₸</b><span>считается автоматически</span></div>
   <div><small>ЗАКАЗОВ В УК</small><b>${f.orders}</b><span>сырьё и полуфабрикаты</span></div>
  </div>
  <div class="panel"><div class="ph-title">Что видит партнёр в своём кабинете</div>
   ${['Свои продажи и кассу','Заказ продукции и сырья в УК','Стандарты, рецептуры и обучение','Заявки в поддержку УК','Свою аналитику и списания']
    .map(t=>`<div class="chk on ev"><i>✓</i><span>${t}</span></div>`).join('')}
   <div class="note" style="--tone:var(--red)"><b>Чего партнёр не видит</b><p>Выручку других точек, себестоимость УК, условия поставщиков и клиентскую базу всей сети.</p></div>
  </div>
  <div class="btns"><button class="btn acc" onclick="closeD();go('fdash')">Войти в кабинет партнёра</button>
  <button class="btn" onclick="toast('Акт сверки по роялти и закупу сформирован за период.')">Акт сверки</button></div>`)}

SC.fdash=()=>`
 <div class="head"><div><h2>Кабинет франчайзи</h2><p>Так портал выглядит у партнёра: только его точка, свои продажи и заказы в управляющую компанию. Тот же интерфейс, что и у собственной сети.</p></div>
 <div class="btns"><button class="btn acc" onclick="go('forder')">Заказать в УК</button></div></div>
 <div class="strip">
  <div><small>ВЫРУЧКА ЗА АВГУСТ</small><b>1 980 000 ₸</b><span class="g">+9% к июлю</span></div>
  <div><small>ЧЕКОВ</small><b>243</b><span>средний 8 148 ₸</span></div>
  <div><small>РОЯЛТИ К ОПЛАТЕ</small><b class="a">99 000 ₸</b><span>5% с выручки</span></div>
  <div><small>ЗАКАЗ В УК</small><b>14</b><span>за месяц</span></div>
  <div><small>СПИСАНИЯ</small><b class="g">2,8%</b><span>норма сети 3%</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph-title">Мои продажи по позициям</div>
   <div class="tw"><table class="data"><thead><tr><th>Позиция</th><th class="right">Продано</th><th class="right">Выручка</th><th class="right">Доля</th></tr></thead><tbody>
   ${[['Торт «Наполеон» 1 кг',68,666400,34],['Чизкейк Нью-Йорк 1 кг',42,483000,24],['Эклер классический',380,285000,14],['Макарон, коробка',54,172800,9],['Прочее',0,372800,19]].map(r=>
    `<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="right mono">${r[1]||'—'}</td><td class="right mono">${fmt(r[2])}</td><td class="right mono">${r[3]}%</td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Партнёр видит те же цифры, что и УК</b> — по своей точке. Спорить о выручке и роялти не приходится: данные одни и те же, считаются автоматически с кассы.</div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Ближайшие поставки от УК</div>
    <div class="kv"><span>03.09 · сырьё и полуфабрикаты</span><b>в пути</b></div>
    <div class="kv"><span>05.09 · упаковка с логотипом</span><b>подтверждено</b></div>
    <button class="btn acc" style="width:100%;margin-top:9px" onclick="go('forder')">Новый заказ в УК</button>
   </div>
   <div class="panel"><div class="ph-title">Обучение и стандарты</div>
    ${[['Рецептуры и техкарты','обновлено 28.08'],['Стандарт витрины','видео 12 мин'],['Работа на кассе','пройдено'],['Аттестация кондитера','до 15.09']]
     .map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}
    <button class="btn" style="width:100%;margin-top:9px" onclick="go('fsupport')">Написать в поддержку УК</button>
   </div>
  </div>
 </div>`;

SC.forder=()=>`
 <div class="head"><div><h2>Заказ в управляющую компанию</h2><p>Партнёр заказывает сырьё, полуфабрикаты и упаковку у УК по внутренним ценам. Заявка попадает на склад и в производство головной компании.</p></div>
 <div class="btns"><button class="btn acc" onclick="sparks();toast('Заявка отправлена в УК. Склад видит её в перемещениях, поставка — 03.09.')">Отправить заявку</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px"><thead><tr>
  <th>Позиция</th><th>Тип</th><th class="right">Цена для партнёра</th><th class="right">Заказать</th><th class="right">Сумма</th><th>Срок</th></tr></thead><tbody>
 ${[['Полуфабрикат коржей «Наполеон»','полуфабрикат',3200,20,'2 дня'],['Крем заварной, готовый','полуфабрикат',2400,15,'2 дня'],
    ['Коробки с логотипом сети','упаковка',620,200,'5 дней'],['Мука миндальная','сырьё',8000,6,'3 дня'],['Декор и топперы','упаковка',450,80,'5 дней']]
  .map(r=>`<tr onclick="toast('Позиция добавлена в заявку. Цена для партнёра ниже рыночной — это часть ценности франшизы.')">
  <td><b>${r[0]}</b></td><td><span class="badge ${r[1]==='сырьё'?'b':r[1]==='упаковка'?'v':'c'}">${r[1]}</span></td>
  <td class="right mono">${fmt(r[2])} ₸</td><td class="right mono">${r[3]}</td>
  <td class="right mono">${fmt(r[2]*r[3])} ₸</td><td class="mini">${r[4]}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Итого по заявке</div>
   <div class="kv"><span>Позиций</span><b>5</b></div>
   <div class="kv"><span>Сумма</span><b class="mono">302 000 ₸</b></div>
   <div class="kv"><span>Условия оплаты</span><b>предоплата 50%</b></div>
   <div class="kv"><span>Поставка</span><b>03.09 · транспорт УК</b></div>
  </div>
  <div class="panel"><div class="ph-title">Почему закуп идёт через УК</div>
   <div class="note" style="--tone:var(--acc)"><b>Одинаковый вкус во всей сети</b><p>Коржи и кремы приходят с центрального производства — клиент в Караганде получает тот же «Наполеон», что и в Алматы.</p></div>
   <div class="note" style="--tone:var(--green)"><b>И это доход управляющей компании</b><p>Помимо роялти, УК зарабатывает на поставках. В системе видно и то, и другое по каждому партнёру.</p></div>
  </div>
 </div>`;

SC.fsupport=()=>`
 <div class="head"><div><h2>Поддержка УК</h2><p>Заявки партнёра в управляющую компанию и база знаний: стандарты, рецептуры, маркетинговые макеты. Всё в одном месте, без переписки в разных чатах.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Заявка создана. Ответственный в УК получил уведомление, срок ответа — 1 рабочий день.')">+ Заявка в УК</button></div></div>
 <div class="g21">
  <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:700px"><thead><tr>
   <th>Заявка</th><th>Тема</th><th>Кто ведёт</th><th>Создана</th><th>Статус</th></tr></thead><tbody>
  ${[['ЗУ-118','Нужны макеты для витрины на осень','Маркетинг УК','01.09','в работе'],
     ['ЗУ-117','Вопрос по технологии сборки чизкейка','Технолог','31.08','отвечено'],
     ['ЗУ-116','Заказать дополнительную упаковку','Склад УК','29.08','выполнено'],
     ['ЗУ-115','Обучение нового кондитера','HR УК','27.08','выполнено']]
   .map(r=>`<tr onclick="toast('Заявка открыта: переписка с УК, вложения и срок ответа.')">
   <td class="mono"><b>${r[0]}</b></td><td>${r[1]}</td><td class="mini">${r[2]}</td><td class="mono">${r[3]}</td>
   <td><span class="badge ${r[4]==='выполнено'?'g':r[4]==='в работе'?'a':'b'}">${r[4]}</span></td></tr>`).join('')}
  </tbody></table></div></div>
  <div class="panel"><div class="ph-title">База знаний сети</div>
   ${['Технологические карты всех позиций','Стандарт оформления витрины','Скрипты для продавцов','Маркетинговые макеты и шаблоны','Требования к помещению и оборудованию','Регламент открытия новой точки']
    .map(t=>`<div class="kv" style="cursor:pointer" onclick="toast('Материал открыт: документ, видео и чек-лист для самопроверки.')"><span>${t}</span><b>→</b></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Один источник правды</b><p>Партнёр не спрашивает «а как правильно» в чате — он открывает актуальную версию стандарта. При обновлении рецептуры все получают уведомление.</p></div>
  </div>
 </div>`;

/* --- ПЕРСОНАЛ --- */
SC.staff=()=>`
 <div class="head"><div><h2>Персонал и обучение</h2><p>Сотрудники сети и франчайзи, смены и корпоративный университет: обучение, аттестация и допуск к работе.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Сотрудник добавлен: роль, точка, доступ в портал и программа обучения.')">+ Сотрудник</button></div></div>
 <div class="strip">
  <div><small>СОТРУДНИКОВ</small><b>47</b><span>сеть и франчайзи</span></div>
  <div><small>В ЦЕХЕ</small><b>14</b><span>две смены</span></div>
  <div><small>НА ТОЧКАХ</small><b>18</b><span>кассиры и продавцы</span></div>
  <div><small>ПРОШЛИ АТТЕСТАЦИЮ</small><b class="g">38</b><span>81%</span></div>
  <div><small>ТЕКУЧЕСТЬ</small><b class="a">14%</b><span>за год</span></div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Корпоративный университет</div>
   ${[['Вводный курс для продавца','6 модулей · 2 часа',34],['Работа на кассе и лояльность','4 модуля · 1 час',28],['Технология: базовые кремы','8 модулей · 4 часа',12],['Стандарт витрины и выкладка','3 модуля · 40 минут',31],['Обучение для франчайзи','12 модулей · 8 часов',3]].map(r=>
    `<div class="kv" style="cursor:pointer" onclick="toast('Курс открыт: видео, материалы, тест и автоматический допуск к работе после сдачи.')">
    <span>${r[0]}<div class="sub">${r[1]}</div></span><b>${r[2]} прошли</b></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Обучение — часть франшизы</b><p>Новый партнёр и его персонал проходят те же курсы, что и своя сеть. Стандарт держится не на словах, а на аттестации с допуском.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Смены на сегодня</div>
   ${[['Цех · смена А','05:00–17:00','6 человек'],['Точка 1 · Абая','09:00–21:00','Динара, Айдана'],['Точка 2 · Мега','10:00–22:00','Асель, Жанна'],['Точка 3 · Сатпаева','09:00–21:00','Ерке'],['Доставка','10:00–21:00','Ерлан, Азамат']].map(r=>
    `<div class="kv"><span>${r[0]}<div class="sub">${r[1]}</div></span><b>${r[2]}</b></div>`).join('')}
  </div>
 </div>`;

/* --- ФИНАНСЫ --- */
SC.finance=()=>`
 <div class="head"><div><h2>Финансы</h2><p>Выручка, себестоимость и маржа по точкам, каналам и позициям. Цифры берутся из касс, производства и склада — их не сводят вручную из двух систем.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Выгрузка в Excel: P&L по сети за выбранный период.')">Выгрузить</button></div></div>
 <div class="strip">
  <div><small>ВЫРУЧКА ЗА АВГУСТ</small><b>${mln(netRev()+FRANCH.reduce((a,f)=>a+f.rev,0))} млн ₸</b><span class="g">+14% к июлю</span></div>
  <div><small>СЕБЕСТОИМОСТЬ</small><b>4,1 млн ₸</b><span>сырьё, работа цеха</span></div>
  <div><small>ВАЛОВАЯ МАРЖА</small><b class="c">5,4 млн ₸</b><span>57%</span></div>
  <div><small>РАСХОДЫ</small><b>3,2 млн ₸</b><span>аренда, зарплаты, реклама</span></div>
  <div><small>ПРИБЫЛЬ</small><b class="g">2,2 млн ₸</b><span>23% от выручки</span></div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">По каналам продаж</div>
   <div class="tw"><table class="data"><thead><tr><th>Канал</th><th class="right">Выручка</th><th class="right">Себестоимость</th><th class="right">Маржа</th><th class="right">%</th></tr></thead><tbody>
   ${[['Точки офлайн',5520000,2420000],['Заказные торты',2180000,890000],['Доставка онлайн',1240000,520000],['Франчайзи · роялти и закуп',560000,240000]].map(r=>
    `<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="right mono">${fmt(r[1])}</td><td class="right mono">${fmt(r[2])}</td>
    <td class="right mono" style="color:var(--green)">${fmt(r[1]-r[2])}</td><td class="right mono"><b>${Math.round((r[1]-r[2])/r[1]*100)}%</b></td></tr>`).join('')}
   </tbody></table></div>
   <div class="note" style="--tone:var(--acc)"><b>Заказные торты — самый маржинальный канал</b><p>59% против 56% на витрине, и без списаний: заказ оплачен заранее и точно будет забран.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Куда уходят деньги</div>
   ${[['Сырьё и упаковка',2420000,'var(--acc)'],['Зарплаты цеха и точек',1680000,'var(--violet)'],['Аренда точек',820000,'var(--blue)'],['Реклама',490000,'var(--amber)'],['Списания',318000,'var(--red)']].map(r=>
    `<div class="fr" style="grid-template-columns:200px 1fr 104px"><span>${r[0]}</span>
    <div class="bar"><i style="--w:${r[1]/2420000*100}%;background:${r[2]}"></i></div><b>${fmt(r[1])} ₸</b></div>`).join('')}
   <div class="kv" style="margin-top:9px"><span>Себестоимость одного чека</span><b class="mono">3 480 ₸</b></div>
   <div class="kv"><span>Прибыль с чека</span><b class="mono" style="color:var(--green)">2 010 ₸</b></div>
  </div>
 </div>`;

SC.reports=()=>`
 <div class="head"><div><h2>Отчёты</h2><p>Любой срез выгружается в Excel за выбранный период. Данные берутся из работы сотрудников, а не собираются вручную к совещанию.</p></div></div>
 <div class="g3">
 ${[['Продажи по точкам','выручка, чеки, средний чек, часы пик','⌂'],
    ['Ассортимент','что продаётся, что залёживается, маржа по позициям','☷'],
    ['Производство','выпуск, себестоимость смены, брак и выход','⚗'],
    ['Списания','по точкам, причинам и позициям','⊘'],
    ['Заказы на дату','сколько заказных тортов, средний чек, каналы','▦'],
    ['Клиенты и лояльность','новые, повторные, бонусы, сегменты','♥'],
    ['Реклама','расход, лиды, заказы, окупаемость по кампаниям','◎'],
    ['Франчайзи','выручка, роялти, закуп, соблюдение стандартов','⚑'],
    ['Прибыль по сети','P&L с разбивкой по каналам и точкам','₸']]
  .map(r=>`<div class="panel" style="cursor:pointer" onclick="toast('Отчёт «${r[0]}» сформирован и выгружен в Excel.')">
   <div style="font-size:19px;color:var(--acc)">${r[2]}</div>
   <div class="ph-title" style="margin-top:7px">${r[0]}</div><p class="mini" style="margin-top:4px">${r[1]}</p></div>`).join('')}
 </div>`;

SC.users=()=>`
 <div class="head"><div><h2>Пользователи</h2><p>Каждый видит только своё: кассир — свою точку, технолог — цех, франчайзи — свою точку, собственник — всё.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Пользователь добавлен: вход по номеру телефона с кодом, роль и точка назначены.')">+ Сотрудник</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:860px"><thead><tr>
  <th>Роль</th><th>Сотрудник</th><th>Что видит</th><th>Себестоимость</th><th>Чужие точки</th><th>Может менять цены</th></tr></thead><tbody>
 ${Object.entries(ROLES).map(([n,r])=>`<tr onclick="toast('Права роли «${n}» настраиваются по каждому разделу отдельно.')">
  <td><b>${n}</b></td><td class="mini">${r.n}</td><td class="mono" style="font-size:9.4px">${r.s.length} разделов</td>
  <td>${['Собственник','Технолог производства','Администратор'].includes(n)?'<span class="badge g">да</span>':'<span class="badge r">нет</span>'}</td>
  <td>${['Собственник','Администратор','Диспетчер доставки'].includes(n)?'<span class="badge g">да</span>':'<span class="badge r">нет</span>'}</td>
  <td>${['Собственник','Администратор'].includes(n)?'<span class="badge g">да</span>':'<span class="badge r">нет</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Франчайзи — отдельный случай:</b> он работает в том же портале, но видит только свою точку. Клиентская база сети, себестоимость УК и условия поставщиков ему недоступны.</div>`;

SC.integr=()=>`
 <div class="head"><div><h2>Интеграции</h2><p>Что подключается к порталу. Всё, кроме 1С и кассового оборудования, входит в стандартный пакет.</p></div></div>
 <div class="g3">
 ${[['WhatsApp','переписка с клиентами из карточки заказа','входит','var(--wa)'],
    ['Телефония','звонки с записью, карточка клиента при звонке','входит','var(--blue)'],
    ['Instagram и TikTok','сообщения и заявки падают в общую ленту','входит','var(--violet)'],
    ['Kaspi','оплата заказов ссылкой, предоплата за торты','входит','var(--red)'],
    ['Сайт и приложение','каталог, заказ на дату, статусы и бонусы','опция','var(--cyan)'],
    ['1С','обмен документами и бухгалтерия','отдельно','var(--amber)']]
  .map(i=>`<div class="panel"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
   <div><div class="ph-title">${i[0]}</div><p class="mini" style="margin-top:3px">${i[2]}</p></div>
   <span class="badge ${i[2]==='входит'?'g':i[2]==='опция'?'b':'a'}">${i[2]}</span></div>
   <div class="note" style="--tone:${i[3]};margin-top:9px"><p>${i[1]}</p></div></div>`).join('')}
 </div>
 <div class="panel"><div class="ph-title">Что заменяет портал</div>
  <div class="tw"><table class="data" style="min-width:660px"><thead><tr><th>Сейчас</th><th>Для чего используется</th><th>После запуска</th></tr></thead><tbody>
  ${[['Yuma','продажи, точки, учёт','заменяется полностью'],['Битрикс24','воронка, задачи, коммуникации операторов','заменяется полностью'],
     ['Excel и заметки','план цеха, списания, заявки точек','заменяется полностью'],['1С','бухгалтерия','остаётся, подключается обменом']]
   .map(r=>`<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="mini">${r[1]}</td>
   <td>${r[2].includes('остаётся')?'<span class="badge b">'+r[2]+'</span>':'<span class="badge g">'+r[2]+'</span>'}</td></tr>`).join('')}
  </tbody></table></div>
  <div class="hint">Главное, что уходит вместе с двумя системами — <b>ручное дублирование продаж</b>. Сейчас заказ из Битрикса переносят в Yuma, чтобы сходился учёт; в портале он изначально один.</div>
 </div>`;

SC.audit=()=>`
 <div class="head"><div><h2>Журнал действий</h2><p>Кто что сделал в системе: списания, изменения цен, приёмка привоза. Записи не удаляются.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:780px"><thead><tr>
  <th>Время</th><th>Кто</th><th>Объект</th><th>Что сделал</th></tr></thead><tbody>
 ${AUDIT.map(a=>`<tr style="cursor:default"><td class="mono">${a[0]}</td><td><b>${a[1]}</b></td>
  <td class="mono">${a[2]}</td><td class="mini">${a[3]}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Типичная история в сети точек:</b> «кто поставил скидку 30% на весь чизкейк» или «почему списали 12 эклеров». В журнале это видно за секунды, вместе с автором и временем.</div>`;

/* ===== МЕХАНИКА ===== */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>
 `<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function enter(n){role=n;const r=ROLES[n];
 document.getElementById('gate').classList.add('hidden');
 document.getElementById('app').classList.remove('hidden');
 document.getElementById('rav').textContent=r.av;
 document.getElementById('rname').textContent=r.n;
 document.getElementById('rrole').textContent=r.r;
 const sel=document.getElementById('rsel');
 sel.innerHTML=Object.keys(ROLES).map(x=>`<option ${x===n?'selected':''}>${x}</option>`).join('');
 sel.onchange=()=>enter(sel.value);
 buildScope();
 if(!r.s.includes(cur))cur=r.s[0];
 buildNav();render();
 toast(`Роль <b>${n}</b> — так портал выглядит у этого сотрудника. Разделы и данные ограничены его правами.`)}
function buildScope(){const s=document.getElementById('scopeSel');
 const opts=role==='Франчайзи'?[['f1','Караганда · моя точка']]
  :role==='Кассир на точке'?[[POINTS[0].id,POINTS[0].n]]
  :[['all','Вся сеть'],...POINTS.map(p=>[p.id,p.n]),...FRANCH.map(f=>['fr'+f.id,'Франчайзи · '+f.n.split('·')[0].trim()])];
 s.innerHTML=opts.map(o=>`<option value="${o[0]}" ${scope===o[0]?'selected':''}>${o[1]}</option>`).join('');
 if(role==='Франчайзи')scope='f1';else if(role==='Кассир на точке')scope=POINTS[0].id;else if(!opts.some(o=>o[0]===scope))scope='all';}
function setScope(v){scope=v;render();
 toast(v==='all'?'Показана <b>вся сеть</b>: собственные точки и франчайзи.':`Данные отфильтрованы: <b>${document.getElementById('scopeSel').selectedOptions[0].textContent}</b>. Так работает мультитенантность — один портал, разные срезы.`)}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{
  const av=items.filter(i=>al.includes(i[0]));if(!av.length)return '';
  return `<div class="nav-g">${g}</div>`+av.map(i=>
   `<a class="${cur===i[0]?'on':''}" onclick="go('${i[0]}')"><i>${i[1]}</i>${i[2]}${i[3]?`<span class="b">${i[3]}</span>`:''}</a>`).join('')}).join('')}
const PREF={pos:'Кассир на точке',point:'Кассир на точке',inbox:'Оператор колл-центра',orders:'Оператор колл-центра',
 prod:'Технолог производства',plan:'Технолог производства',recipes:'Технолог производства',writeoff:'Технолог производства',
 stock:'Заведующий складом',purchase:'Заведующий складом',suppliers:'Заведующий складом',moves:'Заведующий складом',
 delivery:'Диспетчер доставки',clients:'Маркетолог',loyalty:'Маркетолог',campaigns:'Маркетолог',site:'Маркетолог',
 fdash:'Франчайзи',forder:'Франчайзи',fsupport:'Франчайзи',users:'Администратор',integr:'Администратор',audit:'Администратор'};
const ownerOf=s=>(PREF[s]&&ROLES[PREF[s]].s.includes(s))?PREF[s]:(Object.entries(ROLES).find(([n,r])=>r.s.includes(s))||['Собственник'])[0];
function go(s){if(!ROLES[role].s.includes(s))enter(ownerOf(s));
 cur=s;buildNav();render();document.getElementById('content').scrollTop=0;
 try{const u=new URL(location.href);u.searchParams.set('s',s);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function render(){document.getElementById('content').innerHTML=`<div class="screen">${SC[cur]?SC[cur]():'<p class="mini">Раздел в разработке.</p>'}</div>`;
 const t=TITLES[cur]||['',''];document.getElementById('ttl').textContent=t[0];document.getElementById('sub').textContent=t[1]}
function openD(t,s,tabs,body){document.getElementById('dt').textContent=t;document.getElementById('ds').textContent=s;
 document.getElementById('dtabs').innerHTML=(tabs||[]).map(x=>`<button class="dtab ${x[2]?'on':''}" onclick="${x[1]}">${x[0]}</button>`).join('');
 document.getElementById('db').innerHTML=body;document.getElementById('dbg').classList.add('show')}
function closeD(){document.getElementById('dbg').classList.remove('show')}
let tt;function toast(h){const el=document.getElementById('toast');el.innerHTML=h;el.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),5200)}
function sparks(){const c=['#c2456c','#d9628a','#d98324','#2f9e5f','#ffffff','#8b5cf6'];
 for(let i=0;i<56;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2300)}}
function waPing(){toast('WhatsApp, Instagram и телефония работают внутри портала: переписка по заказу хранится в его карточке, а не в личном телефоне оператора.')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';try{localStorage.setItem('kd-theme',theme)}catch(e){}applyTheme()}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark');
 const b=document.getElementById('themeBtn');if(b)b.textContent=theme==='dark'?'☀ Светлая':'◐ Тёмная'}
(function(){try{const t=localStorage.getItem('kd-theme');if(t)theme=t}catch(e){}
 const q=new URLSearchParams(location.search).get('theme');if(q)theme=q;applyTheme()})();

/* ===== СЦЕНАРИЙ ===== */
const TOUR=[
 ['Оператор колл-центра','inbox','<b>Шаг 1.</b> Instagram, TikTok, сайт, приложение и звонки — в одной ленте. Сейчас это Битрикс плюс шесть приложений в телефоне у оператора.',6400],
 ['Оператор колл-центра','orders','<b>Шаг 2.</b> Заказные торты на дату: предоплата, макет, дата выдачи. Заказ сам встаёт в план цеха накануне — забыть про него невозможно.',6400],
 ['Кассир на точке','pos','<b>Шаг 3.</b> Касса на точке: три касания — чек пробит. Продажа сразу списывает позицию с витрины и попадает в выручку сети.',6200],
 ['Технолог производства','prod','<b>Шаг 4.</b> Горячий и холодный цех. При запуске партии сырьё списывается со склада по техкарте, себестоимость считается по факту.',6400],
 ['Технолог производства','plan','<b>Шаг 5.</b> План на завтра: заказы на дату, заявки точек и средние продажи минус остатки. Меньше списаний вечером и пустой витрины днём.',6400],
 ['Заведующий складом','stock','<b>Шаг 6.</b> Склад: сырьё, сроки и минимальные остатки. Масла хватает на два дня — система уже подготовила заявку поставщику.',6200],
 ['Диспетчер доставки','delivery','<b>Шаг 7.</b> Доставка: адреса, курьеры, статусы и фото при вручении. Клиенту сообщения уходят автоматически.',6000],
 ['Маркетолог','loyalty','<b>Шаг 8.</b> Лояльность и клиентская база: карты, бонусы и поводы написать — день рождения, годовщина прошлого заказа.',6000],
 ['Собственник','franch','<b>Шаг 9.</b> Франчайзинговая сеть: партнёр работает в том же портале, но видит только свою точку. Роялти считается автоматически с его выручки.',6400],
 ['Собственник','dash','<b>Итог.</b> Один портал вместо Yuma, Битрикса и таблиц: производство, точки, доставка, маркетинг и франшиза — с цифрами, которые никто не сводит руками.',6600]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();
  toast('<b>Это демо, собранное по вашей карте бизнес-процессов.</b> Каждый экран дорабатывается под то, как работает именно ваша кондитерская.');return}
 const [r,s,txt,ms]=TOUR[tourI++];
 if(role!==r)enter(r);
 setTimeout(()=>{go(s);toast(txt)},role!==r?380:0);
 tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');
 if(q&&SC[q]){enter(ownerOf(q));go(q)}})();
