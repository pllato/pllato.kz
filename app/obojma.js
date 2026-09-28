/* ОБОЙМА — система поставок подшипников для горнодобывающих предприятий: договоры, спецификации, заказы по складам заказчика, подбор по трём складам трёх юрлиц, воронка исполнения, реализации и 1С. Демо-макет по встрече 28.09.2026. Названия компаний, суммы и фамилии вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const dd=s=>{const [y,m,d]=s.split('-');return d+'.'+m};
const dl=s=>{const [y,m,d]=s.split('-');return d+'.'+m+'.'+y};
const TODAY='2026-09-28';
const addDays=(s,n)=>new Date(new Date(s+'T00:00:00').getTime()+n*864e5).toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
const dayOf=s=>['вс','пн','вт','ср','чт','пт','сб'][new Date(s+'T00:00:00').getDay()];

const SEC=[
 {k:'home',n:'Главная',sub:[['dash','Панель руководителя'],['alerts','Что горит · сроки и риски']]},
 {k:'dog',n:'Договоры',sub:[['contracts','Договоры и лимиты'],['contract','Карточка договора'],['specs','Спецификации'],['spec','Карточка спецификации'],['clients','Заказчики и их склады']]},
 {k:'ord',n:'Заказы',sub:[['orders','Заказы в исполнении'],['order','Карточка заказа'],['pick','Подбор по складам'],['funnel','Воронка исполнения']]},
 {k:'wh',n:'Склады',sub:[['stock','Остатки трёх складов'],['catalog','Номенклатура и аналоги'],['moves','Перемещения и межфирменные'],['purchase','Закуп · дефицит']]},
 {k:'fin',n:'Деньги',sub:[['realiz','Реализации и накладные'],['receiv','Оплаты и дебиторка']]},
 {k:'rep',n:'Отчёты',sub:[['analytics','Аналитика поставок'],['managers','Менеджеры · план-факт'],['daily','Ежедневный отчёт']]},
 {k:'onec',n:'1С',sub:[['sync','Обмен с тремя базами 1С'],['mapping','Что и куда передаётся']]},
 {k:'sys',n:'Система',sub:[['calendar','Календарь'],['mobile','Мобильная версия'],['roles','Роли и права'],['launch','Запуск без переноса из Bitrix']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Руководитель':{av:'ВИ',n:'Вадим',r:'все юрлица',note:'Договоры и лимиты, что в исполнении, что горит по срокам поставки и оплаты, остатки трёх складов, отгрузки и дебиторка. Всё кликается до позиции спецификации и накладной',s:ALL},
 'Менеджер продаж':{av:'МП',n:'Ерлан · продажи',r:'свои договоры',note:'Договоры, спецификации, заказы от заказчика, подбор по складам, отправка в работу, контроль отгрузок и оплат своих клиентов',
  s:['alerts','contracts','contract','specs','spec','clients','orders','order','pick','funnel','stock','catalog','receiv','calendar','mobile']},
 'Кладовщик':{av:'КЛ',n:'Сергей · склад №1',r:'склады',note:'Листы сборки, сборка и отгрузка, перемещения между складами юрлиц, остатки. Цены и договоры не видит',
  s:['funnel','order','stock','catalog','moves','mobile']},
 'Снабжение':{av:'СН',n:'Айгуль · закуп',r:'дефицит и поставщики',note:'Дефицит по заказам, заявки поставщикам, ожидаемые поступления, остатки и аналоги',
  s:['purchase','stock','catalog','orders','order','alerts']},
 'Бухгалтерия':{av:'БХ',n:'Наталья · 3 базы 1С',r:'реализации и оплаты',note:'Реализации и межфирменные документы, обмен с тремя базами 1С, оплаты и дебиторка по срокам договоров',
  s:['realiz','receiv','moves','sync','mapping','contracts','contract']},
 'Логистика':{av:'ЛГ',n:'Бахыт · доставка',r:'отгрузки',note:'Ожидание отгрузки, отправка на склады заказчика в Караганду, Жезказган и Балхаш, подтверждение получения',
  s:['funnel','order','clients','mobile']}
};
let role='Руководитель',cur='dash',theme='light',curEnt='all',curCon='C1',curSpec='SP1',curOrd='ZK1',curClient='K1';

/* ====== НАШИ ЮРЛИЦА · СКЛАДЫ · БАЗЫ 1С ====== */
const ENT=[
 {id:'E1',n:'ТОО «КарБеаринг»',short:'КарБеаринг',wh:'Склад №1 · Караганда, Юго-Восток',base:'1С · база «КарБеаринг»',c:'#b07a00'},
 {id:'E2',n:'ТОО «СтальОпора»',short:'СтальОпора',wh:'Склад №2 · Караганда, Майкудук',base:'1С · база «СтальОпора»',c:'#1f5f8b'},
 {id:'E3',n:'ТОО «ГорМашСнаб»',short:'ГорМашСнаб',wh:'Склад №3 · Темиртау',base:'1С · база «ГорМашСнаб»',c:'#6b4f8f'}
];
const EN=id=>ENT.find(e=>e.id===id);
const inEnt=x=>curEnt==='all'||x.ent===curEnt;

/* ====== ЗАКАЗЧИКИ И ИХ СКЛАДЫ ====== */
const CLIENTS=[
 {id:'K1',n:'АО «Сарыарка ГМК»',short:'Сарыарка ГМК',ind:'медь · рудники и обогатительные фабрики',pts:['Караганда · центральный склад','Жезказган · склад рудника','Балхаш · склад фабрики'],mgr:'Ерлан',bin:'990240001234'},
 {id:'K2',n:'ТОО «Тентек Көмір»',short:'Тентек Көмір',ind:'уголь · шахты',pts:['Шахтинск · склад шахты','Караганда · ремонтный цех'],mgr:'Ерлан',bin:'080340004567'},
 {id:'K3',n:'ТОО «Нұра Руда»',short:'Нұра Руда',ind:'железная руда · карьер',pts:['Темиртау · склад карьера'],mgr:'Асель',bin:'150140007890'},
 {id:'K4',n:'АО «Темір Прокат Сервис»',short:'Темір Прокат',ind:'металлургия · ремонт прокатных станов',pts:['Темиртау · склад РМЦ'],mgr:'Асель',bin:'010840003210'},
 {id:'K5',n:'ТОО «Балқаш Кен Жөндеу»',short:'Балқаш Кен',ind:'ремонт горного оборудования',pts:['Балхаш · склад','Приозёрск · участок'],mgr:'Ерлан',bin:'170540006543'}
];
const CL=id=>CLIENTS.find(c=>c.id===id);

/* ====== ДОГОВОРЫ ====== */
/* lim — сумма договора; spec — сумма подписанных спецификаций; ship — отгружено; paid — оплачено; dt — срок поставки, дней от заказа; pt — срок оплаты, дней от реализации */
const CONS=[
 {id:'C1',no:'ДГ-2026/014',cl:'K1',ent:'E1',d:'2026-02-10',to:'2026-12-31',lim:25000000,spec:21440000,ship:8406000,paid:3120000,dt:39,pt:60,mgr:'Ерлан',st:'active'},
 {id:'C2',no:'ДГ-2026/021',cl:'K2',ent:'E2',d:'2026-03-04',to:'2027-03-03',lim:12000000,spec:7340000,ship:5210000,paid:5210000,dt:30,pt:45,mgr:'Ерлан',st:'active'},
 {id:'C3',no:'ДГ-2026/027',cl:'K3',ent:'E1',d:'2026-04-18',to:'2026-12-31',lim:8500000,spec:8120000,ship:6980000,paid:5514000,dt:45,pt:60,mgr:'Асель',st:'limit'},
 {id:'C4',no:'ДГ-2026/033',cl:'K4',ent:'E3',d:'2026-05-22',to:'2026-11-30',lim:6000000,spec:3960000,ship:1880000,paid:1880000,dt:21,pt:30,mgr:'Асель',st:'active'},
 {id:'C5',no:'ДГ-2026/038',cl:'K5',ent:'E2',d:'2026-07-01',to:'2027-06-30',lim:9200000,spec:2450000,ship:0,paid:0,dt:39,pt:60,mgr:'Ерлан',st:'active'},
 {id:'C6',no:'ДГ-2025/102',cl:'K1',ent:'E1',d:'2025-03-12',to:'2026-03-11',lim:18000000,spec:17640000,ship:17640000,paid:17640000,dt:39,pt:60,mgr:'Ерлан',st:'done'}
];
const CN=id=>CONS.find(c=>c.id===id);
const CST={active:['действует','g'],limit:['лимит почти исчерпан','w'],done:['исполнен','']};

/* ====== СПЕЦИФИКАЦИИ ====== */
/* строки: n — наименование как у заказчика; q — по спецификации; p — цена; ship — отгружено ранее; ord — в текущих заказах */
const SPECS=[
 {id:'SP1',no:'4503085694',con:'C1',d:'2026-08-19',src:'прислал заказчик · PDF',lines:[
  {n:'Подшипник 3638 ГОСТ 5721-75',q:10,p:612000,ship:4,ord:3},
  {n:'Подшипник 7222А ГОСТ 27365-87',q:12,p:96000,ship:12,ord:0},
  {n:'Подшипник 23144 CC/W33',q:8,p:684000,ship:2,ord:5},
  {n:'Подшипник 3053740 Н',q:4,p:1180000,ship:1,ord:1},
  {n:'Подшипник 180312 ГОСТ 8882-75',q:40,p:14500,ship:20,ord:0},
  {n:'Подшипник 32620 Л',q:6,p:238000,ship:0,ord:0}]},
 {id:'SP2',no:'4503079120',con:'C1',d:'2026-06-02',src:'прислал заказчик · PDF',lines:[
  {n:'Подшипник 22222 ЕК',q:6,p:188000,ship:6,ord:0},
  {n:'Подшипник 30218 (7218)',q:20,p:42000,ship:20,ord:0}]},
 {id:'SP3',no:'СП-2026/021-03',con:'C2',d:'2026-08-27',src:'заполнили сами по письму',lines:[
  {n:'Подшипник 6312-2RS',q:30,p:16800,ship:18,ord:12},
  {n:'Подшипник NU 2320 ECP',q:4,p:264000,ship:2,ord:0},
  {n:'Подшипник 24140 CC/W33',q:2,p:1340000,ship:0,ord:2}]},
 {id:'SP4',no:'РН-7781',con:'C3',d:'2026-09-02',src:'прислал заказчик · скан',lines:[
  {n:'Подшипник 3622 ГОСТ 5721',q:10,p:176000,ship:6,ord:4},
  {n:'Подшипник 7218 ГОСТ 27365',q:16,p:41000,ship:10,ord:0}]},
 {id:'SP5',no:'СП-2026/033-02',con:'C4',d:'2026-09-10',src:'заполнили сами',lines:[
  {n:'Подшипник 23140 CC/W33',q:2,p:960000,ship:0,ord:2},
  {n:'Подшипник 32222 J2',q:8,p:98000,ship:4,ord:0}]}
];
const SP=id=>SPECS.find(s=>s.id===id);
const specSum=s=>s.lines.reduce((a,l)=>a+l.q*l.p,0);
const specShip=s=>s.lines.reduce((a,l)=>a+l.ship*l.p,0);
const left=l=>l.q-l.ship-l.ord;

/* ====== НАША НОМЕНКЛАТУРА (из 1С, три базы) ====== */
/* st: остатки по складам E1/E2/E3; an — аналоги (ГОСТ ↔ ISO) для поиска; c — себестоимость */
const CAT=[
 {id:'N-101',n:'22338 CC/W33 SKF',an:'3638, 3638Н, 22338',brand:'SKF',dim:'190×400×132',st:{E1:2,E2:0,E3:1},c:405000},
 {id:'N-102',n:'3638 ГПЗ-4',an:'22338, 3638',brand:'ГПЗ-4',dim:'190×400×132',st:{E1:0,E2:2,E3:0},c:352000},
 {id:'N-103',n:'22338 MB FAG',an:'3638, 22338',brand:'FAG',dim:'190×400×132',st:{E1:0,E2:1,E3:0},c:428000},
 {id:'N-110',n:'23144 CC/W33 SKF',an:'3053744, 23144',brand:'SKF',dim:'220×370×120',st:{E1:1,E2:0,E3:0},c:462000},
 {id:'N-111',n:'3053744 Н ЕПК',an:'23144, 3053744',brand:'ЕПК',dim:'220×370×120',st:{E1:0,E2:1,E3:1},c:398000},
 {id:'N-120',n:'23140 CC/W33 SKF',an:'3053740, 23140',brand:'SKF',dim:'200×340×112',st:{E1:0,E2:0,E3:1},c:770000},
 {id:'N-121',n:'3053740 Н ЕПК',an:'23140, 3053740',brand:'ЕПК',dim:'200×340×112',st:{E1:1,E2:0,E3:0},c:690000},
 {id:'N-130',n:'6312-2RS1 SKF',an:'180312, 6312',brand:'SKF',dim:'60×130×31',st:{E1:18,E2:6,E3:0},c:9800},
 {id:'N-131',n:'180312 ГПЗ',an:'6312-2RS, 180312',brand:'ГПЗ',dim:'60×130×31',st:{E1:30,E2:0,E3:12},c:7200},
 {id:'N-140',n:'32222 J2 SKF',an:'7222А, 7222, 32222',brand:'SKF',dim:'110×200×56',st:{E1:4,E2:0,E3:2},c:61000},
 {id:'N-150',n:'NU 2320 ECP SKF',an:'32620, 32620Л',brand:'SKF',dim:'100×215×73',st:{E1:3,E2:2,E3:0},c:171000},
 {id:'N-160',n:'30218 J2 SKF',an:'7218, 30218',brand:'SKF',dim:'90×160×32,5',st:{E1:8,E2:0,E3:4},c:27000},
 {id:'N-170',n:'22222 EK SKF',an:'3622, 113622, 22222',brand:'SKF',dim:'110×200×53',st:{E1:0,E2:5,E3:0},c:121000},
 {id:'N-180',n:'24140 CC/W33 SKF',an:'4053740, 24140',brand:'SKF',dim:'200×340×140',st:{E1:0,E2:0,E3:1},c:910000}
];
const CT=id=>CAT.find(c=>c.id===id);
const stTot=c=>c.st.E1+c.st.E2+c.st.E3;
const norm=s=>String(s).toLowerCase().replace(/подшипник|гост[\s\d\-]*/g,'').replace(/[^0-9a-zа-яё]/g,'');
const findCands=name=>{const q=norm(name).replace(/[а-яё]+$/,'');return CAT.filter(c=>c.an.split(',').some(a=>{const x=norm(a);return x&&q&&(q.startsWith(x)||x.startsWith(q))})||norm(c.n).startsWith(q))};
/* ====== ЗАКАЗЫ ПО СПЕЦИФИКАЦИЯМ ====== */
/* lines: li — строка спецификации; q — заказано; pt — склад заказчика (куда везти) */
const ORDERS=[
 {id:'ZK1',no:'ЗК-2026/0928-01',ext:'заявка заказчика № 7700-112',sp:'SP1',d:'2026-09-28',st:'pick',lines:[{li:0,q:3,pt:'Караганда · центральный склад'},{li:2,q:5,pt:'Жезказган · склад рудника'},{li:3,q:1,pt:'Балхаш · склад фабрики'}]},
 {id:'ZK2',no:'ЗК-2026/0828-02',ext:'письмо от 28.08',sp:'SP3',d:'2026-08-28',st:'build',lines:[{li:0,q:12,pt:'Шахтинск · склад шахты'},{li:2,q:2,pt:'Караганда · ремонтный цех'}],note:'ждём 1 шт 24140 CC/W33 от поставщика · 03.10'},
 {id:'ZK3',no:'ЗК-2026/0924-01',ext:'заявка № 45-0912',sp:'SP4',d:'2026-09-24',st:'wait',lines:[{li:0,q:4,pt:'Темиртау · склад карьера'}]},
 {id:'ZK4',no:'ЗК-2026/0921-02',ext:'письмо главного механика',sp:'SP5',d:'2026-09-21',st:'sent',lines:[{li:0,q:2,pt:'Темиртау · склад РМЦ'}],note:'отправлено 26.09 · Газель 045 AKZ 09'},
 {id:'ZK5',no:'ЗК-2026/0915-01',ext:'заявка № 7700-098',sp:'SP1',d:'2026-09-15',st:'real',lines:[{li:4,q:20,pt:'Караганда · центральный склад'}],rn:'РН-000842'},
 {id:'ZK6',no:'ЗК-2026/0818-03',ext:'заявка № 7700-071',sp:'SP1',d:'2026-08-18',st:'pay',lines:[{li:0,q:4,pt:'Жезказган · склад рудника'},{li:2,q:2,pt:'Балхаш · склад фабрики'},{li:3,q:1,pt:'Балхаш · склад фабрики'}],rn:'РН-000781'},
 {id:'ZK7',no:'ЗК-2026/0701-01',ext:'заявка № 45-0655',sp:'SP4',d:'2026-07-01',st:'pay',lines:[{li:0,q:6,pt:'Темиртау · склад карьера'},{li:1,q:10,pt:'Темиртау · склад карьера'}],rn:'РН-000702'},
 {id:'ZK8',no:'ЗК-2026/0610-02',ext:'заявка № 7700-034',sp:'SP2',d:'2026-06-10',st:'paid',lines:[{li:0,q:6,pt:'Караганда · центральный склад'},{li:1,q:20,pt:'Жезказган · склад рудника'}],rn:'РН-000655'}
];
const OR=id=>ORDERS.find(o=>o.id===id);
const FUN=[
 {k:'pick',n:'Подбор',c:'#7a8594'},{k:'work',n:'В работе · печать',c:'#5f6f82'},{k:'build',n:'Сборка',c:'#1f5f8b'},{k:'wait',n:'Ожидание отгрузки',c:'#2f7d6d'},
 {k:'sent',n:'Отправлено',c:'#b07a00'},{k:'real',n:'Реализация · накладная',c:'#8a5a2b'},{k:'pay',n:'Ждём оплату',c:'#a0412d'},{k:'paid',n:'Оплачено',c:'#2e6b3f'}];
const FN=k=>FUN.find(f=>f.k===k);
const ordCon=o=>CN(SP(o.sp).con);
const ordSum=o=>o.lines.reduce((a,l)=>a+l.q*SP(o.sp).lines[l.li].p,0);
const ordDue=o=>addDays(o.d,ordCon(o).dt);
const ordLate=o=>['pick','work','build','wait'].includes(o.st)&&ordDue(o)<TODAY;

/* ====== ПОДБОР ПО СКЛАДАМ (заказ ЗК-2026/0928-01) ====== */
/* по каждой строке заказа: какие позиции нашей номенклатуры и с каких складов берём; остальное — в закуп */
const PICK={ZK1:[
 {cand:['N-102','N-101','N-103'],alloc:{'N-102':{E1:0,E2:2,E3:0},'N-101':{E1:1,E2:0,E3:0},'N-103':{E1:0,E2:0,E3:0}},buy:0},
 {cand:['N-110','N-111'],alloc:{'N-110':{E1:1,E2:0,E3:0},'N-111':{E1:0,E2:1,E3:1}},buy:2},
 {cand:['N-121','N-120'],alloc:{'N-121':{E1:1,E2:0,E3:0},'N-120':{E1:0,E2:0,E3:0}},buy:0}
]};
const pickedQ=pl=>Object.values(pl.alloc).reduce((a,x)=>a+x.E1+x.E2+x.E3,0);

/* ====== РЕАЛИЗАЦИИ И ОПЛАТЫ ====== */
const REAL=[
 {no:'РН-000842',d:'2026-09-22',ord:'ZK5',ent:'E1',cl:'K1',sum:290000,paid:0,esf:'выписан 22.09'},
 {no:'РН-000781',d:'2026-08-29',ord:'ZK6',ent:'E1',cl:'K1',sum:4996000,paid:0,esf:'выписан 29.08'},
 {no:'РН-000702',d:'2026-07-14',ord:'ZK7',ent:'E1',cl:'K3',sum:1466000,paid:0,esf:'выписан 14.07'},
 {no:'РН-000655',d:'2026-06-24',ord:'ZK8',ent:'E1',cl:'K1',sum:1968000,paid:1968000,esf:'выписан 24.06',pd:'2026-08-20'},
 {no:'РН-000611',d:'2026-06-05',ord:null,ent:'E2',cl:'K2',sum:2140000,paid:2140000,esf:'выписан 05.06',pd:'2026-07-17'},
 {no:'РН-000590',d:'2026-05-28',ord:null,ent:'E3',cl:'K4',sum:1880000,paid:1880000,esf:'выписан 28.05',pd:'2026-06-25'}
];
const realDue=r=>{const o=r.ord?OR(r.ord):null;const pt=o?ordCon(o).pt:(r.cl==='K4'?30:45);return addDays(r.d,pt)};

/* межфирменные реализации: товар со склада одного юрлица продаётся по договору другого */
const MOVES=[
 {no:'МФ-0113',d:TODAY,from:'E2',to:'E1',items:[['N-102',2],['N-111',1]],ord:'ZK1',st:'draft',why:'по договору ДГ-2026/014 поставщик — КарБеаринг, товар на складе СтальОпоры'},
 {no:'МФ-0114',d:TODAY,from:'E3',to:'E1',items:[['N-111',1]],ord:'ZK1',st:'draft',why:'23144 / 3053744 — 1 шт со склада Темиртау'},
 {no:'МФ-0109',d:'2026-09-27',from:'E3',to:'E2',items:[['N-180',1]],ord:'ZK2',st:'done',why:'24140 CC/W33 для Тентек Көмір, договор на СтальОпоре'},
 {no:'МФ-0104',d:'2026-09-19',from:'E1',to:'E3',items:[['N-120',1]],ord:'ZK4',st:'done',why:'23140 для Темір Прокат, договор на ГорМашСнабе'},
 {no:'ПМ-0221',d:'2026-09-25',from:'E1',to:'E1',items:[['N-131',10]],ord:null,st:'done',why:'внутреннее перемещение: склад №1 → участок комплектации'}
];
const MST={draft:['черновик · ждёт отправки в работу','w'],done:['проведено в 1С','g']};

/* закуп: дефицит по заказам и минимальным остаткам */
const BUY=[
 {n:'23144 CC/W33 (или 3053744)',q:2,for:'ZK1',why:'не хватает под заказ ЗК-2026/0928-01',sup:'ТОО «Подшипник-Трейд» · Алматы',eta:'2026-10-06',st:'new',price:455000},
 {n:'24140 CC/W33',q:1,for:'ZK2',why:'не хватает под заказ ЗК-2026/0828-02',sup:'дистрибьютор SKF · Астана',eta:'2026-10-03',st:'ordered',price:905000},
 {n:'3638 / 22338',q:4,for:null,why:'остаток ниже минимума после заказа (минимум 4)',sup:'ГПЗ-4 · Самара',eta:'—',st:'new',price:350000},
 {n:'32620 Л / NU 2320',q:6,for:null,why:'позиция 6 спецификации 4503085694 — заказа ещё нет, остатка 5',sup:'дистрибьютор SKF · Астана',eta:'—',st:'plan',price:170000}
];
const BST={new:['к заказу','w'],ordered:['заказано','i'],plan:['в плане','']};

/* ====== ЧТО ГОРИТ ====== */
const ALERTS=[
 {lv:'r',t:'Просрочена поставка',x:'ЗК-2026/0828-02 · Тентек Көмір: срок 30 дней истёк 27.09, стоит на сборке — ждём 24140 CC/W33 от поставщика до 03.10',go:"openOrd('ZK2')",b:'Заказ'},
 {lv:'r',t:'Просрочена оплата',x:'РН-000702 · Нұра Руда · 1 466 000 ₸: срок 60 дней истёк 12.09 — 16 дней просрочки',go:"go('receiv')",b:'Дебиторка'},
 {lv:'w',t:'Лимит договора почти исчерпан',x:'ДГ-2026/027 · Нұра Руда: спецификаций на 8,12 млн из 8,5 млн — 96 %. Новая спецификация не поместится',go:"openCon('C3')",b:'Договор'},
 {lv:'w',t:'Дефицит под заказ',x:'ЗК-2026/0928-01: 23144 CC/W33 — нужно 5, на трёх складах 3. В закуп 2 шт',go:"go('pick')",b:'Подбор'},
 {lv:'w',t:'Срок оплаты через 30 дней',x:'РН-000781 · Сарыарка ГМК · 4 996 000 ₸ — до 28.10',go:"go('receiv')",b:'Оплаты'},
 {lv:'i',t:'Позиции спецификации без заказа',x:'4503085694: 32620 Л — 6 шт на 1,43 млн ещё не заказаны, договор до 31.12',go:"openSpec('SP1')",b:'Спецификация'},
 {lv:'i',t:'Договор заканчивается',x:'ДГ-2026/033 · Темір Прокат: до 30.11 осталось 63 дня, по спецификациям не отгружено 2,08 млн',go:"openCon('C4')",b:'Договор'},
 {lv:'b',t:'Обмен с 1С',x:'База «ГорМашСнаб»: 2 позиции без единицы измерения — не выгружены. Остальные базы — обмен 07:30 без ошибок',go:"go('sync')",b:'1С'}
];

/* ====== 1С ====== */
const ONEC=[
 {ent:'E1',ver:'1С:Бухгалтерия для Казахстана 3.0 · сервер в офисе',last:'28.09 07:30',items:1842,stock:'по складу №1',docs:'реализации, межфирменные, поступления денег',err:0},
 {ent:'E2',ver:'1С:Бухгалтерия для Казахстана 3.0 · сервер в офисе',last:'28.09 07:30',items:1127,stock:'по складу №2',docs:'реализации, межфирменные, поступления денег',err:0},
 {ent:'E3',ver:'1С:Бухгалтерия для Казахстана 3.0 · сервер в офисе',last:'28.09 07:31',items:964,stock:'по складу №3',docs:'реализации, межфирменные, поступления денег',err:2}
];
const SYNCLOG=[
 ['07:31','E3','← номенклатура','964 позиции · 2 без единицы измерения — пропущены','w'],
 ['07:30','E1','← остатки','склад №1 · 1 842 позиции','g'],
 ['07:30','E2','← остатки','склад №2 · 1 127 позиций','g'],
 ['07:30','E1','← поступления денег','2 платежа · Сарыарка ГМК, Темір Прокат','g'],
 ['27.09 18:12','E3→E2','→ межфирменная реализация','МФ-0109 · 24140 CC/W33 · 1 шт','g'],
 ['27.09 16:40','E1','→ реализация','РН-000842 · Сарыарка ГМК · 290 000 ₸','g']
];

/* ====== КАЛЕНДАРЬ ====== */
const CAL=[
 {d:'2026-09-28',t:'10:00',n:'Планёрка отдела продаж',k:'meet'},
 {d:'2026-09-28',t:'15:00',n:'Звонок: главный механик Сарыарка ГМК · спецификация на IV квартал',k:'meet'},
 {d:'2026-09-29',t:'',n:'Срок: ответ поставщика по 23144 CC/W33 · 2 шт',k:'task'},
 {d:'2026-09-30',t:'11:00',n:'Встреча: Балқаш Кен Жөндеу · первая спецификация',k:'meet'},
 {d:'2026-10-03',t:'',n:'Поступление 24140 CC/W33 от дистрибьютора · под ЗК-2026/0828-02',k:'task'},
 {d:'2026-10-06',t:'',n:'Поступление 23144 CC/W33 × 2 от поставщика · под ЗК-2026/0928-01',k:'task'},
 {d:'2026-10-28',t:'',n:'Срок оплаты РН-000781 · 4 996 000 ₸',k:'pay'},
 {d:'2026-11-06',t:'',n:'Срок поставки ЗК-2026/0928-01 · 39 дней',k:'dl'},
 {d:'2026-11-08',t:'',n:'Срок поставки ЗК-2026/0924-01 · Нұра Руда · 45 дней',k:'dl'},
 {d:'2026-11-30',t:'',n:'Окончание договора ДГ-2026/033 · Темір Прокат',k:'dl'}
];

/* ====== МЕНЕДЖЕРЫ ====== */
const MGRS=[
 {n:'Ерлан Жумабаев',plan:12000000,fact:9870000,cons:4,ord:5,late:1,rec:5286000},
 {n:'Асель Нурпеисова',plan:8000000,fact:5140000,cons:2,ord:3,late:0,rec:1466000}
];
const MONTHS=[['апр',6.2],['май',7.9],['июн',9.1],['июл',5.4],['авг',8.8],['сен',7.6]];
/* ====== ХЕЛПЕРЫ ====== */
const SC={};
const entTag=id=>{const e=EN(id);return e?`<span class="tag ent" style="--ec:${e.c}">${esc(e.short)}</span>`:''};
const conL=(id,t)=>{const c=CN(id);return c?`<a class="lk mono" onclick="openCon('${id}')">${esc(t||c.no)}</a>`:'—'};
const specL=(id,t)=>{const s=SP(id);return s?`<a class="lk mono" onclick="openSpec('${id}')">${esc(t||'№ '+s.no)}</a>`:'—'};
const ordL=(id,t)=>{const o=OR(id);return o?`<a class="lk mono" onclick="openOrd('${id}')">${esc(t||o.no)}</a>`:'—'};
const clL=(id,t)=>{const c=CL(id);return c?`<a class="lk" onclick="card('cl','${id}')">${esc(t||c.short)}</a>`:'—'};
const catL=id=>{const c=CT(id);return `<a class="lk mono" onclick="card('cat','${id}')">${esc(c.n)}</a>`};
const stageTag=k=>{const f=FN(k);return `<span class="stg" style="--sc:${f.c}">${esc(f.n)}</span>`};
const barRow=(n,v,max,cls,lbl)=>`<div class="fr"><span>${n}</span><div class="bar"><i class="${cls||''}" style="--w:${Math.min(100,pct(v,max))}%"></i></div><b>${lbl||fmt(v)}</b></div>`;
const said=(t,x)=>`<div class="said"><b>Ваши слова на встрече</b><i>${t}</i>${x?`<span>${x}</span>`:''}</div>`;
const consIn=()=>CONS.filter(c=>inEnt(c));
function openCon(id){curCon=id;if(!allowed('contract')){card('con',id);return}go('contract')}
function openSpec(id){curSpec=id;if(!allowed('spec')){card('spec',id);return}go('spec')}
function openOrd(id){curOrd=id;if(!allowed('order')){card('ord',id);return}go('order')}
const tri=(c)=>`<div class="tri"><i class="t1" style="--w:${pct(c.spec,c.lim)}%"></i><i class="t2" style="--w:${pct(c.ship,c.lim)}%"></i><i class="t3" style="--w:${pct(c.paid,c.lim)}%"></i></div>`;

/* ====== ГЛАВНАЯ ====== */
SC.dash=()=>{const cs=consIn().filter(c=>c.st!=='done');const L=cs.reduce((a,c)=>({lim:a.lim+c.lim,spec:a.spec+c.spec,ship:a.ship+c.ship,paid:a.paid+c.paid}),{lim:0,spec:0,ship:0,paid:0});
 const actv=ORDERS.filter(o=>['pick','work','build','wait','sent'].includes(o.st)&&inEnt(ordCon(o)));const late=actv.filter(ordLate);
 const debt=REAL.filter(r=>inEnt(r)&&r.paid<r.sum);const over=debt.filter(r=>realDue(r)<TODAY);
 const stockV=CAT.reduce((a,c)=>a+(curEnt==='all'?stTot(c):c.st[curEnt]||0)*c.c,0);
 return `<div class="hd"><div><h2>Панель руководителя</h2><p>Вы сказали: «Сколько осталось, наименование какое отгружено, сколько отгрузили, сколько не отгрузили». Здесь все договоры трёх юрлиц: сумма договора, сколько закрыто спецификациями, отгружено и оплачено. Ниже — заказы в работе, что горит по срокам и остатки трёх складов.</p></div>
 <div class="btns"><button class="bt" onclick="go('daily')">Ежедневный отчёт</button><button class="bt p" onclick="go('alerts')">Что горит · ${ALERTS.filter(a=>a.lv==='r'||a.lv==='w').length}</button></div></div>
 <div class="wid"><div><small>Договоров действует</small><b class="a">${cs.length}</b><span>на ${mln(L.lim)} · заказчиков ${new Set(cs.map(c=>c.cl)).size}</span></div><div><small>Спецификации</small><b>${mln(L.spec)}</b><span>${pct(L.spec,L.lim)} % лимитов договоров</span></div><div><small>Отгружено</small><b class="g">${mln(L.ship)}</b><span>${pct(L.ship,L.spec)} % от спецификаций</span></div><div><small>Дебиторка</small><b class="r">${mln(debt.reduce((a,r)=>a+r.sum-r.paid,0))}</b><span>просрочено ${mln(over.reduce((a,r)=>a+r.sum-r.paid,0))} · ${over.length} ${plural(over.length,['накладная','накладные','накладных'])}</span></div><div><small>Заказы в исполнении</small><b class="${late.length?'w':''}">${actv.length}</b><span>просрочена поставка · ${late.length}</span></div></div>
 <div class="tw"><table class="t"><tr><th>Договор</th><th>Заказчик</th><th>Наше юрлицо</th><th class="r">Сумма договора</th><th>Спецификации · отгружено · оплачено</th><th class="r">Остаток по договору</th><th class="r">Не отгружено</th><th class="r">Сроки</th><th>Статус</th></tr><tbody>
 ${cs.map(c=>`<tr onclick="openCon('${c.id}')"><td>${conL(c.id)}<span class="sub">до ${dl(c.to)} · ${esc(c.mgr)}</span></td><td><b>${esc(CL(c.cl).short)}</b></td><td>${entTag(c.ent)}</td><td class="r">${fmt(c.lim)}</td><td>${tri(c)}<span class="sub">${mln(c.spec)} · ${mln(c.ship)} · ${mln(c.paid)}</span></td><td class="r">${fmt(c.lim-c.spec)}</td><td class="r ${c.spec-c.ship>0?'warnt':''}">${fmt(c.spec-c.ship)}</td><td class="r mono">${c.dt} / ${c.pt} дн.</td><td><span class="tag ${CST[c.st][1]}">${CST[c.st][0]}</span></td></tr>`).join('')}
 </tbody></table></div>
 <div class="legend"><span><i class="t1"></i>закрыто спецификациями</span><span><i class="t2"></i>отгружено</span><span><i class="t3"></i>оплачено</span><span class="mini">полная полоса — сумма договора</span></div>
 <div class="g21"><div class="pan"><h3>Что горит</h3>${ALERTS.slice(0,5).map(a=>`<div class="li ${a.lv}"><i>!</i><span><b>${esc(a.t)}.</b> ${esc(a.x)}</span><button class="bt" onclick="${a.go}">${esc(a.b)}</button></div>`).join('')}</div>
 <div><div class="pan"><h3>Воронка исполнения</h3>${FUN.slice(0,7).map(f=>{const n=ORDERS.filter(o=>o.st===f.k&&inEnt(ordCon(o))).length;return barRow(esc(f.n),n,3,'',String(n))}).join('')}<div class="btns" style="justify-content:flex-start;margin-top:8px"><button class="bt" onclick="go('funnel')">Открыть канбан</button></div></div>
 <div class="pan"><h3>Склады · себестоимость остатков</h3>${ENT.filter(e=>curEnt==='all'||e.id===curEnt).map(e=>`<div class="kv"><span>${entTag(e.id)} ${esc(e.wh)}</span><b>${mln(CAT.reduce((a,c)=>a+c.st[e.id]*c.c,0))}</b></div>`).join('')}<div class="kv"><span><b>Всего</b> · выборка ${CAT.length} позиций</span><b>${mln(stockV)}</b></div></div></div></div>`};

SC.alerts=()=>`<div class="hd"><div><h2>Что горит · сроки и риски</h2><p>Вы просили ежедневную отчётность: что прогорело, где непоставка. Система сама проверяет каждый договор, спецификацию, заказ и накладную по формулам ниже и приносит список. Тот же список уходит вам в 08:00.</p></div><div class="btns"><button class="bt" onclick="go('daily')">Как выглядит отчёт</button><button class="bt p" onclick="act('rules')">Настроить правила</button></div></div>
 <div class="g21"><div class="pan"><h3>Сегодня · понедельник, 28 сентября</h3>${ALERTS.map(a=>`<div class="li ${a.lv}"><i>!</i><span><b>${esc(a.t)}.</b> ${esc(a.x)}</span><button class="bt" onclick="${a.go}">${esc(a.b)}</button></div>`).join('')}</div>
 <div><div class="pan"><h3>Правила · формулы</h3><div class="formula">
 <code>Просрочена поставка</code><span>дата заказа + срок поставки из договора &lt; сегодня, и заказ не отгружен</span>
 <code>Скоро срок поставки</code><span>до срока осталось 7 дней, а заказ ещё в подборе или сборке</span>
 <code>Просрочена оплата</code><span>дата реализации + срок оплаты из договора &lt; сегодня, и не оплачено полностью</span>
 <code>Лимит договора</code><span>спецификаций больше 90 % суммы договора</span>
 <code>Позиция без заказа</code><span>строка спецификации без заказов, до конца договора меньше 100 дней</span>
 <code>Дефицит</code><span>в заказе нужно больше, чем на трёх складах, — строка в закуп</span>
 <code>Обмен с 1С</code><span>ошибка или нет обмена дольше 2 часов</span></div></div>
 ${said('«Чтобы тебе конкретно ежемесячно, ежедневно давала отчётность по тем событиям, что вот здесь прогорели, здесь непоставка».','Платон: «Это всё сводится к формулам»: каждое правило ниже — формула, её можно поменять.')}</div></div>`;

/* ====== ДОГОВОРЫ ====== */
let conF='all';
SC.contracts=()=>{const list=consIn().filter(c=>conF==='all'||c.st===conF);
 return `<div class="hd"><div><h2>Договоры и лимиты</h2><p>Договор с заказчиком: какое из трёх наших юрлиц поставщик, срок поставки и срок оплаты в днях, сумма договора. К договору подкидывают спецификации — они расходуют сумму договора. Сколько осталось по договору и сколько по спецификациям ещё не отгружено — видно сразу.</p></div>
 <div class="btns"><button class="bt" onclick="act('xls')">⇩ Excel</button><button class="bt p" onclick="card('newcon')">+ Договор</button></div></div>
 <div class="ptabs">${[['all','Все'],['active','Действуют'],['limit','Лимит почти исчерпан'],['done','Исполнены']].map(x=>`<button class="ptab ${conF===x[0]?'on':''}" onclick="conF='${x[0]}';render()">${x[1]}</button>`).join('')}</div>
 <div class="tw"><table class="t"><tr><th>Договор</th><th>Заказчик</th><th>Поставщик</th><th>Подписан · до</th><th class="r">Поставка</th><th class="r">Оплата</th><th class="r">Сумма</th><th class="r">Спецификации</th><th class="r">Отгружено</th><th class="r">Оплачено</th><th>Статус</th></tr><tbody>
 ${list.map(c=>`<tr onclick="openCon('${c.id}')"><td>${conL(c.id)}<span class="sub">${SPECS.filter(s=>s.con===c.id).length} ${plural(SPECS.filter(s=>s.con===c.id).length,['спецификация','спецификации','спецификаций'])} в выборке</span></td><td><b>${esc(CL(c.cl).short)}</b><span class="sub">${esc(c.mgr)}</span></td><td>${entTag(c.ent)}</td><td class="mono">${dd(c.d)} · ${dl(c.to)}</td><td class="r">${c.dt} дн.</td><td class="r">${c.pt} дн.</td><td class="r">${fmt(c.lim)}</td><td class="r">${fmt(c.spec)}<span class="sub">${pct(c.spec,c.lim)} %</span></td><td class="r">${fmt(c.ship)}</td><td class="r">${fmt(c.paid)}</td><td><span class="tag ${CST[c.st][1]}">${CST[c.st][0]}</span></td></tr>`).join('')}</tbody></table></div>`};

SC.contract=()=>{const c=CN(curCon);const cl=CL(c.cl);const sps=SPECS.filter(s=>s.con===c.id);const ords=ORDERS.filter(o=>SP(o.sp).con===c.id);const rls=REAL.filter(r=>r.ord&&ords.some(o=>o.id===r.ord));
 return `<div class="hd"><div><div class="crumb"><a onclick="go('contracts')">Договоры</a> › <b>${esc(c.no)}</b></div><h2>Договор ${esc(c.no)} · ${esc(cl.short)} <span class="tag ${CST[c.st][1]}">${CST[c.st][0]}</span></h2><p>Поставщик по договору — ${entTag(c.ent)} ${esc(EN(c.ent).n)}. Подписан ${dl(c.d)}, действует до ${dl(c.to)}. Срок поставки ${c.dt} дней от заказа, срок оплаты ${c.pt} дней от реализации. Менеджер — ${esc(c.mgr)}.</p></div>
 <div class="btns"><button class="bt" onclick="act('doc-body')">Тело договора · PDF</button><button class="bt" onclick="card('newspec','${c.id}')">+ Спецификация</button><button class="bt p" onclick="${sps[0]?`openSpec('${sps[0].id}')`:"act('no-spec')"}">Заказ по спецификации</button></div></div>
 <div class="wid"><div><small>Сумма договора</small><b>${tg(c.lim)}</b><span>фиксированная</span></div><div><small>Закрыто спецификациями</small><b class="a">${tg(c.spec)}</b><span>${pct(c.spec,c.lim)} % · свободно ${fmt(c.lim-c.spec)}</span></div><div><small>Отгружено</small><b class="g">${tg(c.ship)}</b><span>не отгружено по спецификациям ${fmt(c.spec-c.ship)}</span></div><div><small>Оплачено</small><b>${tg(c.paid)}</b><span>ждём ${fmt(c.ship-c.paid)}</span></div><div><small>Заказов</small><b>${ords.length}</b><span>в исполнении ${ords.filter(o=>!['real','pay','paid'].includes(o.st)).length}</span></div></div>
 <div class="pan"><h3>Как расходуется договор</h3><div class="tri big">${''}<i class="t1" style="--w:${pct(c.spec,c.lim)}%"></i><i class="t2" style="--w:${pct(c.ship,c.lim)}%"></i><i class="t3" style="--w:${pct(c.paid,c.lim)}%"></i></div><div class="legend"><span><i class="t1"></i>спецификации ${mln(c.spec)}</span><span><i class="t2"></i>отгружено ${mln(c.ship)}</span><span><i class="t3"></i>оплачено ${mln(c.paid)}</span><span class="mini">вся полоса — ${mln(c.lim)}</span></div></div>
 <div class="g2"><div class="pan"><h3>Спецификации к договору</h3><div class="tw"><table class="t"><tr><th>Спецификация</th><th>Дата</th><th class="r">Позиций</th><th class="r">Сумма</th><th class="r">Отгружено</th><th>Источник</th></tr><tbody>${sps.map(s=>`<tr onclick="openSpec('${s.id}')"><td>${specL(s.id)}</td><td class="mono">${dd(s.d)}</td><td class="r">${s.lines.length}</td><td class="r">${fmt(specSum(s))}</td><td class="r">${pct(specShip(s),specSum(s))} %</td><td class="mini">${esc(s.src)}</td></tr>`).join('')||'<tr><td colspan="6" class="mini">В выборке нет.</td></tr>'}</tbody></table></div></div>
 <div class="pan"><h3>Заказы по договору</h3><div class="tw"><table class="t"><tr><th>Заказ</th><th>Дата</th><th class="r">Сумма</th><th>Этап</th><th>Срок</th></tr><tbody>${ords.map(o=>`<tr onclick="openOrd('${o.id}')"><td>${ordL(o.id)}</td><td class="mono">${dd(o.d)}</td><td class="r">${fmt(ordSum(o))}</td><td>${stageTag(o.st)}</td><td class="mono ${ordLate(o)?'neg':''}">${dd(ordDue(o))}</td></tr>`).join('')||'<tr><td colspan="5" class="mini">Заказов нет.</td></tr>'}</tbody></table></div></div></div>
 <div class="g2"><div class="pan"><h3>Реализации и оплаты</h3>${rls.map(r=>`<div class="kv"><span><b class="mono">${r.no}</b> · ${dd(r.d)} · оплатить до ${dd(realDue(r))}</span><b class="${r.paid>=r.sum?'pos':realDue(r)<TODAY?'neg':''}">${fmt(r.sum)} · ${r.paid>=r.sum?'оплачено':'ждём'}</b></div>`).join('')||'<p class="mini">Реализаций нет.</p>'}</div>
 <div class="pan"><h3>Файлы</h3>${[['Тело договора · подписано ЭЦП',dl(c.d)],...sps.map(s=>['Спецификация № '+s.no+' · '+s.src,dl(s.d)])].map(x=>`<div class="kv"><span>${esc(x[0])}</span><b class="mono">${x[1]}</b></div>`).join('')}</div></div>`};

SC.specs=()=>{const list=SPECS.filter(s=>inEnt(CN(s.con)));
 return `<div class="hd"><div><h2>Спецификации</h2><p>Спецификация — приложение к договору: наименования так, как их пишет заказчик, количество и цена. Прайса нет — строки заносятся вручную из присланного документа. От спецификации идут заказы, а по каждой строке видно, сколько заказано, отгружено и осталось.</p></div><div class="btns"><button class="bt p" onclick="card('newspec','C1')">+ Спецификация</button></div></div>
 <div class="tw"><table class="t"><tr><th>Спецификация</th><th>Договор · заказчик</th><th>Дата</th><th class="r">Строк</th><th class="r">Сумма</th><th>Отгружено</th><th class="r">В заказах</th><th class="r">Осталось заказать</th><th>Источник</th></tr><tbody>
 ${list.map(s=>{const c=CN(s.con);const ordq=s.lines.reduce((a,l)=>a+l.ord*l.p,0);const lf=s.lines.reduce((a,l)=>a+left(l)*l.p,0);return `<tr onclick="openSpec('${s.id}')"><td>${specL(s.id)}</td><td>${conL(c.id)}<span class="sub">${esc(CL(c.cl).short)} · ${esc(EN(c.ent).short)}</span></td><td class="mono">${dd(s.d)}</td><td class="r">${s.lines.length}</td><td class="r">${fmt(specSum(s))}</td><td><div class="bar" style="width:90px"><i class="g" style="--w:${pct(specShip(s),specSum(s))}%"></i></div><span class="sub">${pct(specShip(s),specSum(s))} %</span></td><td class="r">${fmt(ordq)}</td><td class="r ${lf?'':'pos'}">${fmt(lf)}</td><td class="mini">${esc(s.src)}</td></tr>`}).join('')}</tbody></table></div>`};

SC.spec=()=>{const s=SP(curSpec);const c=CN(s.con);
 return `<div class="hd"><div><div class="crumb"><a onclick="go('specs')">Спецификации</a> › <b>№ ${esc(s.no)}</b></div><h2>Спецификация № ${esc(s.no)}</h2><p>К договору ${conL(c.id)} · ${esc(CL(c.cl).short)} · поставщик ${entTag(c.ent)} · от ${dl(s.d)} · ${esc(s.src)}. Наименования — как у заказчика; сопоставление с нашей номенклатурой делается при подборе заказа.</p></div>
 <div class="btns"><button class="bt" onclick="act('spec-edit')">Редактировать</button><button class="bt p" onclick="card('neworder','${s.id}')">Создать заказ по спецификации</button></div></div>
 <div class="wid"><div><small>Сумма спецификации</small><b>${tg(specSum(s))}</b><span>${s.lines.length} ${plural(s.lines.length,['позиция','позиции','позиций'])}</span></div><div><small>Отгружено</small><b class="g">${tg(specShip(s))}</b><span>${pct(specShip(s),specSum(s))} %</span></div><div><small>В текущих заказах</small><b class="a">${tg(s.lines.reduce((a,l)=>a+l.ord*l.p,0))}</b><span>ещё не отгружено</span></div><div><small>Осталось заказать</small><b class="w">${tg(s.lines.reduce((a,l)=>a+left(l)*l.p,0))}</b><span>до ${dl(c.to)}</span></div><div><small>Срок поставки</small><b>${c.dt} дн.</b><span>от даты каждого заказа</span></div></div>
 <div class="tw"><table class="t"><tr><th class="r">№</th><th>Наименование у заказчика</th><th class="r">По спец.</th><th class="r">Цена</th><th class="r">Сумма</th><th class="r">Отгружено</th><th class="r">В заказах</th><th class="r">Осталось</th><th style="width:150px">Исполнение</th></tr><tbody>
 ${s.lines.map((l,i)=>`<tr><td class="r mono">${i+1}</td><td><b>${esc(l.n)}</b><span class="sub">у нас: ${findCands(l.n).map(x=>esc(x.n)).join(' · ')||'нет аналога в каталоге'}</span></td><td class="r">${l.q}</td><td class="r">${fmt(l.p)}</td><td class="r">${fmt(l.q*l.p)}</td><td class="r">${l.ship}</td><td class="r">${l.ord||'—'}</td><td class="r ${left(l)?'':'pos'}"><b>${left(l)}</b></td><td><div class="seg3"><i class="s1" style="--w:${pct(l.ship,l.q)}%"></i><i class="s2" style="--o:${pct(l.ship,l.q)}%;--w:${pct(l.ord,l.q)}%"></i></div></td></tr>`).join('')}
 <tr class="total"><td></td><td>Итого</td><td class="r">${s.lines.reduce((a,l)=>a+l.q,0)}</td><td></td><td class="r">${fmt(specSum(s))}</td><td class="r">${s.lines.reduce((a,l)=>a+l.ship,0)}</td><td class="r">${s.lines.reduce((a,l)=>a+l.ord,0)}</td><td class="r">${s.lines.reduce((a,l)=>a+left(l),0)}</td><td></td></tr></tbody></table></div>
 <div class="legend"><span><i class="t3"></i>отгружено</span><span><i class="t1"></i>в заказах</span><span class="mini">серое — ещё не заказано</span></div>
 <div class="g2" style="margin-top:10px"><div class="pan"><h3>Заказы по этой спецификации</h3>${ORDERS.filter(o=>o.sp===s.id).map(o=>`<div class="kv"><span>${ordL(o.id)} · ${dd(o.d)} · ${o.lines.map(l=>'№'+(l.li+1)+' × '+l.q).join(', ')}</span><b>${stageTag(o.st)}</b></div>`).join('')||'<p class="mini">Заказов нет.</p>'}</div>
 ${said('«К договору подкидывают спецификации. Прайса нет — спецификацию забиваем вручную. Вы мне присылаете заказ на подшипник номер один, три и четыре — не все десять по договору, а три».')}</div>`};

SC.clients=()=>`<div class="hd"><div><h2>Заказчики и их склады</h2><p>У заказчика несколько складов: одна позиция заказа едет в Караганду, другая — в Жезказган, третья — в Балхаш. Склады заказчика хранятся в карточке и выбираются в каждой строке заказа.</p></div><div class="btns"><button class="bt p" onclick="act('client-new')">+ Заказчик</button></div></div>
 <div class="tw"><table class="t"><tr><th>Заказчик</th><th>Отрасль</th><th>Склады заказчика · куда везём</th><th class="r">Договоров</th><th class="r">Отгружено</th><th class="r">Долг</th><th>Менеджер</th></tr><tbody>${CLIENTS.map(k=>{const cs=CONS.filter(c=>c.cl===k.id);const debt=REAL.filter(r=>r.cl===k.id).reduce((a,r)=>a+r.sum-r.paid,0);return `<tr onclick="card('cl','${k.id}')"><td><b>${esc(k.n)}</b><span class="sub">БИН ${k.bin}</span></td><td class="mini">${esc(k.ind)}</td><td>${k.pts.map(p=>`<span class="tag">${esc(p)}</span>`).join(' ')}</td><td class="r">${cs.length}</td><td class="r">${fmt(cs.reduce((a,c)=>a+c.ship,0))}</td><td class="r ${debt?'neg':''}">${fmt(debt)}</td><td>${esc(k.mgr)}</td></tr>`}).join('')}</tbody></table></div>`;
/* ====== ЗАКАЗЫ ====== */
let ordF='act';
SC.orders=()=>{const F={act:o=>!['real','pay','paid'].includes(o.st),late:o=>ordLate(o),done:o=>['real','pay','paid'].includes(o.st),all:o=>true};const list=ORDERS.filter(o=>inEnt(ordCon(o))&&F[ordF](o));
 return `<div class="hd"><div><h2>Заказы в исполнении</h2><p>Заказ — это часть спецификации, которую заказчик попросил сейчас: не все десять по договору, а три, пять и один, и каждая позиция — на свой склад заказчика. У заказа срок поставки из договора, этап исполнения и ответственный.</p></div>
 <div class="btns"><button class="bt" onclick="go('funnel')">Канбан</button><button class="bt p" onclick="card('neworder','SP1')">+ Заказ по спецификации</button></div></div>
 <div class="ptabs">${[['act','В исполнении'],['late','Просрочена поставка'],['done','Отгружены'],['all','Все']].map(x=>`<button class="ptab ${ordF===x[0]?'on':''}" onclick="ordF='${x[0]}';render()">${x[1]} · ${ORDERS.filter(o=>inEnt(ordCon(o))&&F[x[0]](o)).length}</button>`).join('')}</div>
 <div class="tw"><table class="t"><tr><th>Заказ</th><th>Заказчик · договор</th><th>Позиции и куда</th><th class="r">Сумма</th><th>Дата</th><th>Срок поставки</th><th>Этап</th></tr><tbody>
 ${list.map(o=>{const s=SP(o.sp),c=ordCon(o);const dl_=daysBetween(TODAY,ordDue(o));return `<tr onclick="openOrd('${o.id}')"><td>${ordL(o.id)}<span class="sub">${esc(o.ext)}</span></td><td><b>${esc(CL(c.cl).short)}</b><span class="sub">${esc(c.no)} · ${esc(EN(c.ent).short)}</span></td><td class="mini">${o.lines.map(l=>`${esc(s.lines[l.li].n.replace('Подшипник ',''))} × ${l.q} → ${esc(l.pt.split(' · ')[0])}`).join('<br>')}</td><td class="r">${fmt(ordSum(o))}</td><td class="mono">${dd(o.d)}</td><td class="mono ${ordLate(o)?'neg':dl_<8&&!['real','pay','paid','sent'].includes(o.st)?'warnt':''}">${dd(ordDue(o))}${['real','pay','paid','sent'].includes(o.st)?'':ordLate(o)?' · просрочен '+(-dl_)+' дн.':' · через '+dl_+' дн.'}</td><td>${stageTag(o.st)}${o.note?`<span class="sub">${esc(o.note)}</span>`:''}</td></tr>`}).join('')}</tbody></table></div>`};

SC.order=()=>{const o=OR(curOrd);const s=SP(o.sp);const c=ordCon(o);const i=FUN.findIndex(f=>f.k===o.st);const r=o.rn?REAL.find(x=>x.no===o.rn):null;const pk=PICK[o.id];
 return `<div class="hd"><div><div class="crumb"><a onclick="go('orders')">Заказы</a> › <b>${esc(o.no)}</b></div><h2>Заказ ${esc(o.no)} ${stageTag(o.st)}</h2><p>${esc(CL(c.cl).n)} · ${esc(o.ext)} · по спецификации ${specL(s.id)} к договору ${conL(c.id)} · поставщик ${entTag(c.ent)} · заказ от ${dl(o.d)}, поставить до ${dl(ordDue(o))}${ordLate(o)?' — <b class="neg">просрочен</b>':''}.</p></div>
 <div class="btns">${o.st==='pick'?`<button class="bt p" onclick="curOrd='${o.id}';go('pick')">Подбор по складам</button>`:''}${i<FUN.length-1&&o.st!=='pick'?`<button class="bt p" onclick="moveStage('${o.id}','${FUN[i+1].k}')">→ ${esc(FUN[i+1].n)}</button>`:''}<button class="bt" onclick="act('print-list','${o.id}')">Лист сборки</button></div></div>
 <div class="steps">${FUN.map((f,j)=>`<div class="stp ${j<i?'done':j===i?'on':''}" style="--sc:${f.c}"><i>${j<i?'✓':j+1}</i><span>${esc(f.n)}</span></div>`).join('')}</div>
 <div class="tw"><table class="t"><tr><th>Строка спец.</th><th>Наименование у заказчика</th><th class="r">Кол-во</th><th class="r">Цена</th><th class="r">Сумма</th><th>Куда</th><th>Подобрано у нас</th></tr><tbody>
 ${o.lines.map((l,j)=>{const sl=s.lines[l.li];const p=pk?pk[j]:null;const got=p?Object.entries(p.alloc).flatMap(([nid,a])=>ENT.filter(e=>a[e.id]).map(e=>`${esc(CT(nid).n)} × ${a[e.id]} · ${esc(EN(e.id).short)}`)):[];return `<tr><td class="mono">№ ${l.li+1}</td><td><b>${esc(sl.n)}</b></td><td class="r">${l.q}</td><td class="r">${fmt(sl.p)}</td><td class="r">${fmt(sl.p*l.q)}</td><td>${esc(l.pt)}</td><td class="mini">${p?got.join('<br>')+(p.buy?`<br><span class="warnt">в закуп × ${p.buy}</span>`:''):o.st==='pick'?'—':findCands(sl.n).slice(0,1).map(x=>esc(x.n)).join('')+' · подобрано'}</td></tr>`}).join('')}
 <tr class="total"><td></td><td>Итого</td><td class="r">${o.lines.reduce((a,l)=>a+l.q,0)}</td><td></td><td class="r">${fmt(ordSum(o))}</td><td></td><td></td></tr></tbody></table></div>
 <div class="g3" style="margin-top:12px"><div class="pan"><h3>Документы</h3><div class="kv"><span>Заявка заказчика</span><b>${esc(o.ext)}</b></div><div class="kv"><span>Лист сборки</span><b>${i>=1?'напечатан':'после подбора'}</b></div><div class="kv"><span>Межфирменные</span><b>${MOVES.filter(m=>m.ord===o.id).map(m=>m.no).join(', ')||'не нужны'}</b></div><div class="kv"><span>Реализация · накладная</span><b>${r?r.no+' · '+dd(r.d):'после отправки'}</b></div><div class="kv"><span>ЭСФ</span><b>${r?r.esf:'—'}</b></div></div>
 <div class="pan"><h3>Сроки</h3><div class="kv"><span>Заказ</span><b>${dl(o.d)}</b></div><div class="kv"><span>Поставить до · ${c.dt} дн.</span><b class="${ordLate(o)?'neg':''}">${dl(ordDue(o))}</b></div>${r?`<div class="kv"><span>Оплатить до · ${c.pt} дн.</span><b class="${realDue(r)<TODAY&&r.paid<r.sum?'neg':''}">${dl(realDue(r))}</b></div><div class="kv"><span>Оплачено</span><b>${fmt(r.paid)} из ${fmt(r.sum)}</b></div>`:''}</div>
 <div class="pan"><h3>История</h3><div class="tl">${[['создан из спецификации',o.d],...(i>=1?[['подбор завершён, отправлен в работу',addDays(o.d,1)]]:[]),...(i>=2?[['лист сборки у склада',addDays(o.d,2)]]:[]),...(i>=4?[['отправлено заказчику',addDays(o.d,5)]]:[]),...(r?[['реализация '+r.no+' проведена в 1С',r.d]]:[])].map(x=>`<div class="tli on"><span class="who">${dl(x[1])}</span><b>${esc(x[0])}</b></div>`).join('')}</div></div></div>`};

/* ====== ПОДБОР ====== */
const pickId=()=>PICK[curOrd]?curOrd:'ZK1';
function setAlloc(j,nid,e,v){const id=pickId();const p=PICK[id][j];const max=CT(nid).st[e];v=Math.max(0,Math.min(max,parseInt(v)||0));p.alloc[nid][e]=v;const need=OR(id).lines[j].q;p.buy=Math.max(0,need-pickedQ(p));render()}
function setBuy(j,v){PICK[pickId()][j].buy=Math.max(0,parseInt(v)||0);render()}
SC.pick=()=>{const id=pickId();const o=OR(id);const s=SP(o.sp);const c=ordCon(o);const pk=PICK[id];
 const inter=[];pk.forEach(p=>Object.entries(p.alloc).forEach(([nid,a])=>ENT.forEach(e=>{if(a[e.id]&&e.id!==c.ent)inter.push([e.id,nid,a[e.id]])})));
 const done=o.st!=='pick';
 return `<div class="hd"><div><div class="crumb"><a onclick="openOrd('${id}')">${esc(o.no)}</a> › <b>подбор</b></div><h2>Подбор по складам · ${esc(o.no)}</h2><p>Наименование в заказе — как у заказчика: «3638 ГОСТ». На складе оно может лежать как 22338 CC/W33 или 3638 другого завода. Система ищет по каталогу и аналогам ГОСТ ↔ ISO и показывает остатки трёх складов трёх юрлиц. Решение, что брать, — за человеком, как вы и сказали. Чего нет — уходит в закуп.</p></div>
 <div class="btns"><button class="bt" onclick="act('print-list','${id}')">Печать листа сборки</button><button class="bt p" ${done?'disabled':''} onclick="sendToWork()">${done?'Отправлено в работу':'Отправить в работу'}</button></div></div>
 ${pk.map((p,j)=>{const l=o.lines[j];const sl=s.lines[l.li];const got=pickedQ(p);const ok=got+p.buy>=l.q;return `<div class="pan pickln">
  <div class="pkh"><div><small class="mono">строка № ${l.li+1} спецификации ${esc(s.no)}</small><h3>${esc(sl.n)}</h3><span class="mini">нужно <b>${l.q} шт</b> → ${esc(l.pt)} · цена по спецификации ${fmt(sl.p)} ₸</span></div>
  <div class="pkst"><div><small>подобрано</small><b class="${got>=l.q?'pos':''}">${got}</b></div><div><small>в закуп</small><b class="${p.buy?'warnt':''}"><input class="qin" type="number" min="0" value="${p.buy}" onchange="setBuy(${j},this.value)" ${done?'disabled':''}></b></div><div><small>итого</small><b class="${ok?'pos':'neg'}">${got+p.buy} / ${l.q}</b></div></div></div>
  <div class="srch2"><span>⌕</span><input value="${esc(sl.n.replace('Подшипник ','').replace(/ ГОСТ.*$/,''))}" readonly><em>найдено ${p.cand.length} · по наименованию и аналогам</em></div>
  <table class="t pk"><tr><th>Наша позиция (1С)</th><th>Аналоги</th><th>Размер</th>${ENT.map(e=>`<th class="c">${esc(e.short)}<span class="sub">${esc(e.wh.split(' · ')[0])}</span></th>`).join('')}<th class="r">Себест.</th></tr>
  ${p.cand.map(nid=>{const ct=CT(nid);return `<tr><td>${catL(nid)}<span class="sub">${esc(ct.brand)}</span></td><td class="mini mono">${esc(ct.an)}</td><td class="mini mono">${esc(ct.dim)}</td>${ENT.map(e=>`<td class="c"><div class="cell ${ct.st[e.id]?'':'zero'}"><span>есть ${ct.st[e.id]}</span>${ct.st[e.id]?`<input class="qin" type="number" min="0" max="${ct.st[e.id]}" value="${p.alloc[nid][e.id]}" onchange="setAlloc(${j},'${nid}','${e.id}',this.value)" ${done?'disabled':''}>`:'<i>—</i>'}</div></td>`).join('')}<td class="r">${fmt(ct.c)}</td></tr>`}).join('')}</table>
  <label class="remember"><input type="checkbox" ${j===0?'checked':''} onchange="act('remember')"> запомнить: «${esc(sl.n.replace('Подшипник ',''))}» у ${esc(CL(c.cl).short)} = ${p.cand[0]?esc(CT(p.cand[0]).n):'—'} и аналоги — предлагать первым в следующий раз</label></div>`}).join('')}
 <div class="g3"><div class="pan"><h3>С каких складов</h3>${ENT.map(e=>{const n=pk.reduce((a,p)=>a+Object.values(p.alloc).reduce((b,x)=>b+x[e.id],0),0);return `<div class="kv"><span>${entTag(e.id)} ${esc(e.wh)}</span><b>${n} шт</b></div>`}).join('')}</div>
 <div class="pan"><h3>Межфирменные реализации в 1С</h3>${inter.length?inter.map(x=>`<div class="kv"><span>${entTag(x[0])} → ${entTag(c.ent)} · ${esc(CT(x[1]).n)}</span><b>${x[2]} шт</b></div>`).join('')+`<p class="mini" style="margin-top:6px">Поставщик по договору — ${esc(EN(c.ent).short)}. Товар с чужого склада сначала продаётся между нашими юрлицами — документ уйдёт в обе базы 1С.</p>`:'<p class="mini">Всё с склада поставщика по договору — межфирменные не нужны.</p>'}</div>
 <div class="pan"><h3>В закуп</h3>${pk.map((p,j)=>p.buy?`<div class="kv"><span>${esc(s.lines[o.lines[j].li].n.replace('Подшипник ',''))}</span><b class="warnt">${p.buy} шт</b></div>`:'').join('')||'<p class="mini">Дефицита нет.</p>'}<p class="mini" style="margin-top:6px">Строки закупа уходят снабжению вместе с заказом и сроком поставки.</p></div></div>
 ${said('«Наименование идёт по спецификации, а нам нужно наименование на складе. Методом подбора — три склада, три юрлица. 3638 он у нас может быть на складе 22338. Это ручной подбор — автоматику пока применять не будем, чисто человеческий фактор».')}`};
function sendToWork(){const id=pickId();const o=OR(id);if(o.st!=='pick')return;const bad=PICK[id].some((p,j)=>pickedQ(p)+p.buy<o.lines[j].q);if(bad){toast('Не все строки закрыты: подберите со складов или поставьте в закуп.');return}o.st='work';render();const buy=PICK[id].reduce((a,p)=>a+p.buy,0);toast(`Заказ ${esc(o.no)} отправлен в работу: листы сборки — складам, межфирменные реализации — в 1С черновиками${buy?', '+buy+' шт — снабжению в закуп':''}. Карточка переехала в «В работе · печать».`)}

/* ====== ВОРОНКА ====== */
let dragId=null;
function moveStage(id,k){const o=OR(id);if(!o)return;if(o.st==='pick'&&k!=='pick'){toast('Сначала подбор по складам — без него не понятно, что собирать.');curOrd=id;go('pick');return}o.st=k;render();toast(`${esc(o.no)} → «${esc(FN(k).n)}». ${k==='real'?'Реализация уйдёт в 1С базы поставщика по договору.':k==='sent'?'Заказчику — уведомление об отгрузке.':k==='paid'?'Оплата сверится с поступлением из 1С.':''}`)}
SC.funnel=()=>{const list=ORDERS.filter(o=>inEnt(ordCon(o)));
 return `<div class="hd"><div><h2>Воронка исполнения</h2><p>Вы описали этапы: подбор, в работу и печать, начало сборки, ожидание отгрузки, отправка, реализация с номером накладной. Добавили «ждём оплату» — срок из договора. Карточки перетаскиваются между этапами мышкой или на телефоне кнопкой.</p></div><div class="btns"><button class="bt" onclick="go('orders')">Списком</button></div></div>
 <div class="kanban">${FUN.map(f=>{const cs=list.filter(o=>o.st===f.k);return `<div class="kcol" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="this.classList.remove('over');moveStage(dragId,'${f.k}')"><div class="khead" style="--sc:${f.c}"><b>${esc(f.n)}</b><span>${cs.length} · ${mln(cs.reduce((a,o)=>a+ordSum(o),0))}</span></div>
 ${cs.map(o=>{const c=ordCon(o);return `<div class="kcard ${ordLate(o)?'late':''}" draggable="true" ondragstart="dragId='${o.id}'" onclick="openOrd('${o.id}')"><b class="mono">${esc(o.no)}</b><span>${esc(CL(c.cl).short)} ${entTag(c.ent)}</span><em>${fmt(ordSum(o))} ₸ · ${o.lines.length} ${plural(o.lines.length,['позиция','позиции','позиций'])}</em><small>${o.rn?esc(o.rn)+' · ':''}${['real','pay','paid'].includes(o.st)&&o.rn?'оплата до '+dd(realDue(REAL.find(r=>r.no===o.rn))):'срок '+dd(ordDue(o))}${ordLate(o)?' · просрочен':''}</small></div>`}).join('')||'<div class="mini" style="padding:8px">—</div>'}</div>`}).join('')}</div>
 ${said('«Стадии исполнения: начало, сборка товара, ожидание отгрузки, отправка товаров». «Воронка — реализации, накладной. Скажем, назовём номер».','Платон: «Называется так — так и сделаем». Визуально — канбан, как вы просили.')}`};
/* ====== СКЛАДЫ ====== */
SC.stock=()=>{const res=nid=>Object.values(PICK).flat().reduce((a,p)=>a+(p.alloc[nid]?Object.values(p.alloc[nid]).reduce((b,x)=>b+x,0):0),0);
 const ents=ENT.filter(e=>curEnt==='all'||e.id===curEnt);
 return `<div class="hd"><div><h2>Остатки трёх складов</h2><p>Номенклатура и остатки приходят из трёх баз 1С — по складу каждого юрлица. Резерв — то, что уже подобрано под заказы. Нажмите на позицию — увидите аналоги, движения и под какие заказы она зарезервирована. Выборка из ${fmt(1842+1127+964)} позиций трёх баз.</p></div><div class="btns"><button class="bt" onclick="act('xls')">⇩ Excel</button><button class="bt p" onclick="act('add-wh')">+ Склад</button></div></div>
 <div class="wid">${ents.map(e=>`<div><small>${esc(e.short)}</small><b style="font-size:17px">${mln(CAT.reduce((a,c)=>a+c.st[e.id]*c.c,0))}</b><span>${esc(e.wh)} · ${CAT.filter(c=>c.st[e.id]).length} позиций в выборке</span></div>`).join('')}<div><small>Зарезервировано</small><b class="a" style="font-size:17px">${CAT.reduce((a,c)=>a+res(c.id),0)} шт</b><span>под заказы в подборе</span></div><div><small>Обмен с 1С</small><b class="g" style="font-size:17px">07:30</b><span>остатки обновляются каждые 15 минут</span></div></div>
 <div class="tw"><table class="t"><tr><th>Позиция</th><th>Аналоги (поиск)</th><th>Размер</th>${ents.map(e=>`<th class="r">${esc(e.short)}</th>`).join('')}<th class="r">Всего</th><th class="r">Резерв</th><th class="r">Себестоимость</th></tr><tbody>
 ${CAT.map(c=>{const tot=ents.reduce((a,e)=>a+c.st[e.id],0);const r=res(c.id);return `<tr onclick="card('cat','${c.id}')"><td>${catL(c.id)}<span class="sub">${esc(c.brand)} · ${c.id}</span></td><td class="mini mono">${esc(c.an)}</td><td class="mini mono">${esc(c.dim)}</td>${ents.map(e=>`<td class="r ${c.st[e.id]?'':'mini'}">${c.st[e.id]||'—'}</td>`).join('')}<td class="r"><b>${tot}</b></td><td class="r ${r?'warnt':''}">${r||'—'}</td><td class="r">${fmt(c.c)}</td></tr>`}).join('')}</tbody></table></div>
 ${said('«Количество на складе он должен показывать: имеется, не имеется, в закуп. Сколько штук надо там на складе, чтоб он подбирал».','Платон: «Три склада — сделаем кнопку, чтобы вы в любой момент могли открыть дополнительный склад самостоятельно».')}`};

let catQ='3638';
function catSearch(v){catQ=v;const el=document.getElementById('catres');if(el)el.innerHTML=catRows()}
const catRows=()=>{const q=catQ.trim();const list=q?findCands(q).concat(CAT.filter(c=>c.n.toLowerCase().includes(q.toLowerCase())&&!findCands(q).includes(c))):CAT;return list.length?list.map(c=>`<tr onclick="card('cat','${c.id}')"><td>${catL(c.id)}</td><td class="mono mini">${esc(c.an)}</td><td class="mono mini">${esc(c.dim)}</td>${ENT.map(e=>`<td class="r">${c.st[e.id]||'—'}</td>`).join('')}<td class="r"><b>${stTot(c)}</b></td></tr>`).join(''):`<tr><td colspan="7" class="mini">Ничего не найдено по «${esc(q)}» — проверьте обозначение или добавьте аналог.</td></tr>`};
SC.catalog=()=>`<div class="hd"><div><h2>Номенклатура и аналоги</h2><p>Один и тот же подшипник называется по-разному: 3638 по ГОСТ, 22338 по ISO, 22338 CC/W33 у SKF, 22338 MB у FAG. Поиск идёт по нашему наименованию и по таблице аналогов — наберите обозначение из спецификации заказчика.</p></div><div class="btns"><button class="bt p" onclick="act('an-add')">+ Аналог</button></div></div>
 <div class="pan"><div class="srch2 big"><span>⌕</span><input value="${esc(catQ)}" oninput="catSearch(this.value)" placeholder="3638, 23144, 180312, 7222…"><em>ищет по наименованию и аналогам ГОСТ ↔ ISO</em></div>
 <div class="ptabs" style="margin-top:8px">${['3638','23144','3053740','180312','7222А','32620'].map(x=>`<button class="ptab" onclick="catQ='${x}';render()">${x}</button>`).join('')}</div>
 <div class="tw"><table class="t"><thead><tr><th>Позиция</th><th>Аналоги</th><th>Размер d×D×B</th>${ENT.map(e=>`<th class="r">${esc(e.short)}</th>`).join('')}<th class="r">Всего</th></tr></thead><tbody id="catres">${catRows()}</tbody></table></div></div>
 <div class="g3"><div class="pan"><h3>Откуда аналоги</h3><p>Таблица соответствий ГОСТ ↔ ISO ↔ бренды загружается один раз из вашего справочника или Excel, дальше пополняется при подборе кнопкой «запомнить».</p></div><div class="pan"><h3>Размер как проверка</h3><p>У аналогов одинаковые внутренний и наружный диаметр и ширина — размер показан рядом, чтобы не ошибиться при ручном подборе.</p></div><div class="pan"><h3>Новая позиция</h3><p>Заводится в 1С — через 15 минут появляется в системе. Двойного ввода нет.</p></div></div>`;

SC.moves=()=>`<div class="hd"><div><h2>Перемещения и межфирменные реализации</h2><p>Вы сказали: «Чтобы в 1С передавалась реализация — что между нашими компаниями произошла реализация сделки». Когда товар для договора одного юрлица лежит на складе другого, система создаёт межфирменную реализацию: продажа из базы одного юрлица и поступление в базу другого. Бухгалтер проводит — документ уходит в обе базы 1С.</p></div><div class="btns"><button class="bt p" onclick="act('mf-post')">Провести черновики в 1С</button></div></div>
 <div class="tw"><table class="t"><tr><th>Документ</th><th>Дата</th><th>Откуда → куда</th><th>Позиции</th><th>Под заказ</th><th>Зачем</th><th>Статус</th></tr><tbody>${MOVES.map(m=>`<tr onclick="${m.ord?`openOrd('${m.ord}')`:''}"><td class="mono"><b>${m.no}</b></td><td class="mono">${dd(m.d)}</td><td>${entTag(m.from)} → ${entTag(m.to)}</td><td class="mini">${m.items.map(x=>esc(CT(x[0]).n)+' × '+x[1]).join('<br>')}</td><td>${m.ord?ordL(m.ord):'—'}</td><td class="mini">${esc(m.why)}</td><td><span class="tag ${MST[m.st][1]}">${MST[m.st][0]}</span></td></tr>`).join('')}</tbody></table></div>
 <div class="g3" style="margin-top:12px"><div class="pan"><h3>1 · Подбор</h3><p>Менеджер берёт 2 шт со склада СтальОпоры под договор КарБеаринга — система видит, что юрлица разные.</p></div><div class="pan"><h3>2 · Черновик</h3><p>При отправке заказа в работу создаётся межфирменная реализация СтальОпора → КарБеаринг по себестоимости или вашей внутренней цене.</p></div><div class="pan"><h3>3 · В 1С</h3><p>Бухгалтер проводит: «Реализация» в базе СтальОпоры и «Поступление» в базе КарБеаринга. Затем обычная реализация заказчику из базы КарБеаринга.</p></div></div>`;

SC.purchase=()=>`<div class="hd"><div><h2>Закуп · дефицит</h2><p>Всё, чего не хватило при подборе, и всё, что опустилось ниже минимума, — одним списком для снабжения. У строки — под какой заказ, к какому сроку поставки заказчику и у какого поставщика берём.</p></div><div class="btns"><button class="bt p" onclick="act('buy-send')">Заявка поставщику</button></div></div>
 <div class="wid"><div><small>Строк в закуп</small><b class="a">${BUY.length}</b><span>под заказы ${BUY.filter(b=>b.for).length} · под минимум ${BUY.filter(b=>!b.for).length}</span></div><div><small>Сумма закупа</small><b>${mln(BUY.reduce((a,b)=>a+b.q*b.price,0))}</b><span>по последним ценам</span></div><div><small>Заказано</small><b class="i">${BUY.filter(b=>b.st==='ordered').length}</b><span>ждём поступления</span></div><div><small>Горит</small><b class="r">1</b><span>ЗК-2026/0828-02 ждёт 24140</span></div></div>
 <div class="tw"><table class="t"><tr><th>Позиция</th><th class="r">Кол-во</th><th>Под что</th><th>Поставщик</th><th>Ожидаем</th><th class="r">Сумма</th><th>Статус</th></tr><tbody>${BUY.map(b=>`<tr><td><b>${esc(b.n)}</b></td><td class="r">${b.q}</td><td>${b.for?ordL(b.for)+'<span class="sub">'+esc(b.why)+'</span>':'<span class="mini">'+esc(b.why)+'</span>'}</td><td class="mini">${esc(b.sup)}</td><td class="mono">${b.eta==='—'?'—':dd(b.eta)}</td><td class="r">${fmt(b.q*b.price)}</td><td><span class="tag ${BST[b.st][1]}">${BST[b.st][0]}</span></td></tr>`).join('')}</tbody></table></div>`;

/* ====== ДЕНЬГИ ====== */
SC.realiz=()=>{const list=REAL.filter(inEnt);
 return `<div class="hd"><div><h2>Реализации и накладные</h2><p>После отправки заказ становится реализацией: номер накладной, юрлицо, заказчик, сумма. Документ создаётся в системе и уходит в базу 1С нужного юрлица, ЭСФ выписывается из 1С. Отсюда же считается срок оплаты по договору.</p></div><div class="btns"><button class="bt p" onclick="act('real-new')">+ Реализация по заказу</button></div></div>
 <div class="tw"><table class="t"><tr><th>Накладная</th><th>Дата</th><th>Юрлицо</th><th>Заказчик</th><th>Заказ</th><th class="r">Сумма</th><th>1С · ЭСФ</th><th>Оплатить до</th><th class="r">Оплачено</th></tr><tbody>${list.map(r=>`<tr onclick="card('real','${r.no}')"><td class="mono"><b>${r.no}</b></td><td class="mono">${dd(r.d)}</td><td>${entTag(r.ent)}</td><td>${esc(CL(r.cl).short)}</td><td>${r.ord?ordL(r.ord):'<span class="mini">до запуска</span>'}</td><td class="r">${fmt(r.sum)}</td><td class="mini">проведена · ЭСФ ${esc(r.esf)}</td><td class="mono ${r.paid<r.sum&&realDue(r)<TODAY?'neg':''}">${dd(realDue(r))}</td><td class="r ${r.paid>=r.sum?'pos':''}">${fmt(r.paid)}</td></tr>`).join('')}</tbody></table></div>`};

SC.receiv=()=>{const list=REAL.filter(r=>inEnt(r)&&r.paid<r.sum);const b={ok:0,soon:0,over:0};list.forEach(r=>{const d=daysBetween(TODAY,realDue(r));const v=r.sum-r.paid;if(d<0)b.over+=v;else if(d<=30)b.soon+=v;else b.ok+=v});
 return `<div class="hd"><div><h2>Оплаты и дебиторка</h2><p>Срок оплаты — из договора: 30, 45 или 60 дней от реализации. Поступления денег приходят из 1С каждой базы и закрывают накладные. Просрочка — красным, и попадает в утренний отчёт.</p></div><div class="btns"><button class="bt" onclick="act('xls')">⇩ Акт сверки</button><button class="bt p" onclick="act('remind')">Напомнить заказчику</button></div></div>
 <div class="wid"><div><small>Ждём оплату</small><b class="a">${mln(b.ok+b.soon+b.over)}</b><span>${list.length} ${plural(list.length,['накладная','накладные','накладных'])}</span></div><div><small>Срок не наступил</small><b class="g">${mln(b.ok)}</b><span>больше 30 дней</span></div><div><small>В ближайшие 30 дней</small><b class="w">${mln(b.soon)}</b><span>планируем поступление</span></div><div><small>Просрочено</small><b class="r">${mln(b.over)}</b><span>звонок и письмо заказчику</span></div><div><small>Поступило в сентябре</small><b>${mln(3120000)}</b><span>из 1С · три базы</span></div></div>
 <div class="tw"><table class="t"><tr><th>Накладная</th><th>Заказчик</th><th>Договор</th><th class="r">Сумма</th><th>Реализация</th><th>Срок оплаты</th><th>Осталось</th></tr><tbody>${list.map(r=>{const d=daysBetween(TODAY,realDue(r));const o=r.ord?OR(r.ord):null;return `<tr onclick="card('real','${r.no}')"><td class="mono"><b>${r.no}</b></td><td><b>${esc(CL(r.cl).short)}</b></td><td>${o?conL(ordCon(o).id):'—'}</td><td class="r">${fmt(r.sum-r.paid)}</td><td class="mono">${dd(r.d)}</td><td class="mono">${dl(realDue(r))}</td><td class="${d<0?'neg':d<=30?'warnt':'pos'}"><b>${d<0?'просрочено '+(-d)+' дн.':d+' дн.'}</b></td></tr>`}).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>По заказчикам</h3>${CLIENTS.map(k=>{const v=list.filter(r=>r.cl===k.id).reduce((a,r)=>a+r.sum-r.paid,0);return v?barRow(esc(k.short),v,6000000,list.some(r=>r.cl===k.id&&realDue(r)<TODAY)?'r':'',fmt(v)):''}).join('')}</div><div class="pan"><h3>Как закрывается</h3><p>Платёж заказчика проводится бухгалтером в 1С нужного юрлица → через 15 минут приходит в систему → закрывает накладные по договору от старой к новой. Частичная оплата — остаток виден в строке.</p></div></div>`};
/* ====== ОТЧЁТЫ ====== */
SC.analytics=()=>{const mx=Math.max(...MONTHS.map(m=>m[1]));const byCl=CLIENTS.map(k=>[k.short,CONS.filter(c=>c.cl===k.id&&c.st!=='done').reduce((a,c)=>a+c.ship,0)]).sort((a,b)=>b[1]-a[1]);
 const byEnt=ENT.map(e=>[e,CONS.filter(c=>c.ent===e.id&&c.st!=='done').reduce((a,c)=>a+c.ship,0)]);
 return `<div class="hd"><div><h2>Аналитика поставок</h2><p>Отгрузки по месяцам, заказчикам и юрлицам, поставки в срок, маржа по позициям — цена из спецификации против себестоимости из 1С. Каждая цифра — формула над договорами, заказами и реализациями, без ручного свода.</p></div><div class="btns"><button class="bt" onclick="act('xls')">⇩ Excel</button></div></div>
 <div class="wid"><div><small>Отгружено за 6 месяцев</small><b class="a">${String(MONTHS.reduce((a,m)=>a+m[1],0).toFixed(1)).replace('.',',')} млн</b><span>три юрлица</span></div><div><small>Поставки в срок</small><b class="g">87 %</b><span>13 из 15 заказов за квартал</span></div><div><small>Средний срок исполнения</small><b>11 дней</b><span>от заказа до отгрузки · по договорам 21–45</span></div><div><small>Валовая маржа</small><b>31 %</b><span>спецификация − себестоимость 1С</span></div><div><small>Не заказано по спецификациям</small><b class="w">${mln(SPECS.reduce((a,s)=>a+s.lines.reduce((b,l)=>b+left(l)*l.p,0),0))}</b><span>деньги, которые ещё можно отгрузить</span></div></div>
 <div class="g2"><div class="pan"><h3>Отгрузки по месяцам, млн ₸</h3><div class="cols">${MONTHS.map(m=>`<div class="col"><div class="cb" style="height:${pct(m[1],mx)}%"><span>${String(m[1]).replace('.',',')}</span></div><small>${m[0]}</small></div>`).join('')}</div></div>
 <div class="pan"><h3>По заказчикам · действующие договоры</h3>${byCl.map(x=>barRow(esc(x[0]),x[1],byCl[0][1],'',mln(x[1]))).join('')}<h3 style="margin-top:12px">По юрлицам</h3>${byEnt.map(x=>barRow(entTag(x[0].id),x[1],Math.max(...byEnt.map(y=>y[1])),'',mln(x[1]))).join('')}</div></div>
 <div class="pan"><h3>Маржа по позициям спецификации № 4503085694</h3><div class="tw"><table class="t"><tr><th>Позиция у заказчика</th><th>Чем закрываем</th><th class="r">Цена</th><th class="r">Себестоимость</th><th class="r">Маржа</th></tr><tbody>${SP('SP1').lines.map(l=>{const c=findCands(l.n)[0];return c?`<tr><td>${esc(l.n)}</td><td>${catL(c.id)}</td><td class="r">${fmt(l.p)}</td><td class="r">${fmt(c.c)}</td><td class="r ${pct(l.p-c.c,l.p)<25?'warnt':'pos'}"><b>${pct(l.p-c.c,l.p)} %</b></td></tr>`:''}).join('')}</tbody></table></div></div>`};

SC.managers=()=>`<div class="hd"><div><h2>Менеджеры · план-факт</h2><p>По каждому менеджеру: план отгрузок на квартал, факт по реализациям, договоры и заказы в работе, просрочки поставки и дебиторка его заказчиков.</p></div><div class="btns"><button class="bt p" onclick="act('plan-set')">Задать план</button></div></div>
 <div class="tw"><table class="t"><tr><th>Менеджер</th><th class="r">План · квартал</th><th class="r">Факт</th><th style="width:170px"></th><th class="r">Договоров</th><th class="r">Заказов в работе</th><th class="r">Просрочено поставок</th><th class="r">Дебиторка</th></tr><tbody>${MGRS.map(m=>`<tr><td><b>${esc(m.n)}</b></td><td class="r">${fmt(m.plan)}</td><td class="r">${fmt(m.fact)}</td><td><div class="bar"><i class="${pct(m.fact,m.plan)>=80?'g':'w'}" style="--w:${pct(m.fact,m.plan)}%"></i></div><span class="sub">${pct(m.fact,m.plan)} %</span></td><td class="r">${m.cons}</td><td class="r">${m.ord}</td><td class="r ${m.late?'neg':''}">${m.late||'—'}</td><td class="r">${fmt(m.rec)}</td></tr>`).join('')}</tbody></table></div>
 <div class="g3" style="margin-top:12px"><div class="pan"><h3>Формула факта</h3><p>Сумма реализаций менеджера за период по данным 1С — без ручного отчёта.</p></div><div class="pan"><h3>Просрочка</h3><p>Заказы, у которых дата заказа + срок поставки по договору прошла, а отгрузки нет.</p></div><div class="pan"><h3>Дебиторка</h3><p>Неоплаченные накладные заказчиков менеджера; просроченные — отдельно.</p></div></div>`;

SC.daily=()=>`<div class="hd"><div><h2>Ежедневный отчёт · 08:00</h2><p>Каждое утро система собирает, что прогорело за вчера и что горит сегодня, и присылает в Telegram или на почту: руководителю — всё, менеджеру — по своим договорам, снабжению — дефицит, бухгалтерии — оплаты и 1С. Раз в месяц — итог месяца теми же формулами.</p></div><div class="btns"><button class="bt" onclick="act('daily-cfg')">Кому и что</button><button class="bt p" onclick="act('daily-send')">Отправить сейчас</button></div></div>
 <div class="g2"><div class="phone"><div class="pbar"><b>Обойма · отчёт</b><span>пн 28.09 · 08:00</span></div><div class="pin"><div class="pcard"><small>Вчера</small><div class="kv"><span>Отгружено</span><b>1 заказ · 0,29 млн</b></div><div class="kv"><span>Поступило денег</span><b>0</b></div><div class="kv"><span>Новых заказов</span><b>1 · Сарыарка ГМК</b></div></div>
 <div class="pcard"><small>Горит</small>${ALERTS.filter(a=>a.lv==='r').map(a=>`<div class="li r"><i>!</i><span><b>${esc(a.t)}</b><br>${esc(a.x)}</span></div>`).join('')}</div>
 <div class="pcard"><small>На этой неделе</small>${ALERTS.filter(a=>a.lv==='w').slice(0,3).map(a=>`<div class="li w"><i>!</i><span>${esc(a.x)}</span></div>`).join('')}</div>
 <div class="pcard"><small>Цифры</small><div class="kv"><span>В исполнении</span><b>${ORDERS.filter(o=>['pick','work','build','wait','sent'].includes(o.st)).length} заказов</b></div><div class="kv"><span>Дебиторка · просрочено</span><b class="neg">1,47 млн</b></div><div class="kv"><span>Не заказано по спецификациям</span><b>${mln(SPECS.reduce((a,s)=>a+s.lines.reduce((b,l)=>b+left(l)*l.p,0),0))}</b></div></div></div></div>
 <div><div class="pan"><h3>Что входит</h3>${['Непоставка: просроченные и «горящие» заказы','Неоплата: просроченные накладные и ближайшие сроки','Дефицит: что не хватает под заказы и что в закупе','Договоры: лимит больше 90 %, окончание срока, неотгруженные спецификации','Обмен с 1С: ошибки и задержки'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div>
 ${said('«И тебе она конкретно ежемесячно, ежедневно будет давать отчётность по тем событиям, что вот здесь прогорели, здесь непоставка или ещё что-то».','Платон: «Это всё сводится к формулам». Отчёт собирается из тех же правил, что «Что горит».')}</div></div>`;

/* ====== 1С ====== */
SC.sync=()=>`<div class="hd"><div><h2>Обмен с тремя базами 1С</h2><p>У каждого юрлица своя база 1С:Бухгалтерии на сервере в офисе. Система подключается к каждой по стандартному протоколу обмена 1С. Сначала — к тестовой копии одной базы вместе с вашим бухгалтером, после проверки — к боевым базам.</p></div><div class="btns"><button class="bt" onclick="act('sync-log')">Журнал целиком</button><button class="bt p" onclick="act('sync-now')">Обменяться сейчас</button></div></div>
 <div class="g3">${ONEC.map(b=>`<div class="pan"><h3>${entTag(b.ent)} ${esc(EN(b.ent).base)}</h3><div class="kv"><span>Версия</span><b>${esc(b.ver)}</b></div><div class="kv"><span>Последний обмен</span><b>${b.last}</b></div><div class="kv"><span>Номенклатура</span><b>${fmt(b.items)} позиций</b></div><div class="kv"><span>Остатки</span><b>${esc(b.stock)}</b></div><div class="kv"><span>Документы</span><b>${esc(b.docs)}</b></div><div class="kv"><span>Ошибки</span><b class="${b.err?'neg':'pos'}">${b.err||'нет'}</b></div></div>`).join('')}</div>
 <div class="pan"><h3>Журнал обмена</h3><div class="tw"><table class="t"><tr><th>Когда</th><th>База</th><th>Направление</th><th>Что</th><th>Статус</th></tr><tbody>${SYNCLOG.map(x=>`<tr><td class="mono">${x[0]}</td><td>${x[1].split('→').map(e=>entTag(e)).join(' → ')}</td><td class="mono">${esc(x[2])}</td><td class="mini">${esc(x[3])}</td><td><span class="tag ${x[4]}">${x[4]==='g'?'ок':'внимание'}</span></td></tr>`).join('')}</tbody></table></div></div>
 <div class="hint"><b>Порядок подключения.</b> 1 — ваш бухгалтер делает тестовую копию одной базы. 2 — настраиваем обмен и проверяем на тестовой: номенклатура, остатки, реализации, межфирменные. 3 — переносим на три боевые базы. Все три базы — стандартная 1С:Бухгалтерия без доработок, поэтому схема одна.</div>`;

SC.mapping=()=>`<div class="hd"><div><h2>Что и куда передаётся</h2><p>Правило простое: справочники и деньги живут в 1С, договоры, спецификации, заказы и исполнение — в системе. Документы, которые бухгалтерия должна провести, система готовит и отдаёт в нужную базу.</p></div></div>
 <div class="tw"><table class="t"><tr><th>Данные</th><th class="c">Направление</th><th>Когда</th><th>Кто проверяет</th></tr><tbody>${[
 ['Номенклатура · наименования, артикулы, единицы','1С → система','каждые 15 минут','—'],
 ['Остатки по складам трёх юрлиц','1С → система','каждые 15 минут','—'],
 ['Контрагенты · заказчики с БИН','1С → система','раз в час, новые — сразу','менеджер привязывает к договору'],
 ['Поступления денег от заказчиков','1С → система','каждые 15 минут','закрывают накладные автоматически'],
 ['Реализация товаров · накладная заказчику','система → 1С базы поставщика','при переводе заказа в «Реализация»','бухгалтер проводит'],
 ['Межфирменная реализация и поступление','система → 1С обеих баз','при отправке заказа в работу · черновик','бухгалтер проводит'],
 ['Перемещение между складами одного юрлица','система → 1С','при сборке','кладовщик'],
 ['ЭСФ','выписывается в 1С','после проведения реализации','бухгалтер'],
 ['Договоры, спецификации, заказы, подбор, этапы','только в системе','—','—']
 ].map(r=>`<tr><td><b>${esc(r[0])}</b></td><td class="c mono">${esc(r[1])}</td><td class="mini">${esc(r[2])}</td><td class="mini">${esc(r[3])}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Нам надо так сделать, чтобы в 1С передавалась реализация — что между нашими компаниями произошла реализация сделки».','Платон: «Синхронизацию с 1С надо сразу закладывать — портал, все воронки и все склады внутри».')}`;

/* ====== СИСТЕМА ====== */
SC.calendar=()=>{const days=Array.from({length:14},(_,i)=>addDays(TODAY,i));const far=CAL.filter(e=>e.d>days[13]);
 return `<div class="hd"><div><h2>Календарь</h2><p>Ваш рабочий календарь: встречи и звонки плюс сроки, которые система ставит сама — поставка по заказу, оплата по накладной, поступление от поставщика, окончание договора. Открывается с телефона.</p></div><div class="btns"><button class="bt p" onclick="act('cal-new')">+ Встреча</button></div></div>
 <div class="calgrid">${days.map(d=>{const ev=CAL.filter(e=>e.d===d);return `<div class="cday ${d===TODAY?'today':''} ${['сб','вс'].includes(dayOf(d))?'we':''}"><small>${dayOf(d)} ${dd(d)}</small>${ev.map(e=>`<div class="cev k-${e.k}">${e.t?`<b>${e.t}</b> `:''}${esc(e.n)}</div>`).join('')}</div>`}).join('')}</div>
 <div class="pan"><h3>Дальше</h3>${far.map(e=>`<div class="kv"><span><span class="cdot k-${e.k}"></span>${esc(e.n)}</span><b class="mono">${dl(e.d)}</b></div>`).join('')}<div class="legend" style="margin-top:8px"><span><span class="cdot k-meet"></span>встреча</span><span><span class="cdot k-task"></span>задача</span><span><span class="cdot k-dl"></span>срок поставки · договора</span><span><span class="cdot k-pay"></span>срок оплаты</span></div></div>`};

SC.mobile=()=>`<div class="hd"><div><h2>Мобильная версия</h2><p>Вы спросили: «На мобилку как мы потом перейдём?» — переходить не нужно: система сразу адаптирована под телефон. Руководитель видит, что горит; менеджер — заказ и подбор; кладовщик — лист сборки и отметку «собрано»; логист — отгрузку и фото накладной.</p></div></div>
 <div class="g3"><div class="phone"><div class="pbar"><b>Обойма</b><span>Вадим · руководитель</span></div><div class="pin"><div class="pcard"><small>Горит сегодня</small>${ALERTS.slice(0,3).map(a=>`<div class="li ${a.lv}"><i>!</i><span><b>${esc(a.t)}</b><br>${esc(a.x.split(':')[0])}</span></div>`).join('')}</div><div class="pcard"><small>Деньги</small><div class="kv"><span>Дебиторка</span><b>6,75 млн</b></div><div class="kv"><span>Просрочено</span><b class="neg">1,47 млн</b></div></div></div></div>
 <div class="phone"><div class="pbar"><b>Обойма · склад №2</b><span>Сергей · лист сборки</span></div><div class="pin"><div class="pcard"><small>ЗК-2026/0928-01 · Сарыарка ГМК</small>${[['3638 ГПЗ-4','2 шт','ячейка B-14',true],['3053744 Н ЕПК','1 шт','ячейка C-03',false]].map(x=>`<div class="chk"><span><b>${x[0]}</b><em>${x[1]} · ${x[2]}</em></span><button class="bt ${x[3]?'p':''}" onclick="act('picked')">${x[3]?'✓ собрано':'собрать'}</button></div>`).join('')}<p class="mini" style="margin-top:6px">После сборки — межфирменная реализация СтальОпора → КарБеаринг уходит бухгалтеру.</p></div><div class="pcard"><small>Куда</small><span>Караганда · Жезказган · Балхаш — три места доставки в одном заказе</span></div></div></div>
 <div class="phone"><div class="pbar"><b>Обойма · логистика</b><span>Бахыт</span></div><div class="pin"><div class="pcard"><small>Ожидают отгрузки</small><div class="kv"><span>ЗК-2026/0924-01 · Нұра Руда</span><b>Темиртау</b></div><button class="bt p" style="width:100%;margin-top:6px" onclick="act('shipped')">Отправлено · фото накладной</button></div><div class="pcard"><small>В пути</small><div class="kv"><span>ЗК-2026/0921-02 · Темір Прокат</span><b>с 26.09</b></div><button class="bt" style="width:100%;margin-top:6px" onclick="act('delivered')">Заказчик получил</button></div></div></div></div>`;

SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>32 сотрудника, почти все работают в системе. У каждой роли — свои разделы: кладовщик не видит цены и договоры, бухгалтерия не правит спецификации, менеджер видит своих заказчиков. Переключите роль в правом верхнем углу.</p></div></div>
 <div class="tw"><table class="t roles"><tr><th>Раздел</th>${Object.keys(ROLES).map(k=>`<th class="c">${esc(k)}</th>`).join('')}</tr><tbody>${SEC.map(s=>s.sub.map((x,i)=>`<tr><td>${i===0?`<b>${esc(s.n)}</b> · `:''}${esc(x[1])}</td>${Object.values(ROLES).map(r=>`<td class="c">${r.s.includes(x[0])?'<span class="dot on"></span>':'<span class="dot"></span>'}</td>`).join('')}</tr>`).join('')).join('')}</tbody></table></div>`;

SC.launch=()=>`<div class="hd"><div><h2>Запуск без переноса из Bitrix</h2><p>Договорились на встрече: интеграцию с Bitrix не делаем — это дольше, чем своя система. Перенос данных тоже не нужен: текущие сделки дожимаете в Bitrix до конца ноября, договоры следующего года заводите уже здесь. Ядро поднимаем первым, дальше 3–5 версий по вашим правкам — и в бой.</p></div></div>
 <div class="tl">${[['Старт','Документы и доступы','Реквизиты, договор с подписанием ЭЦП на нашей платформе, предоплата. Админский доступ к вашему Bitrix — посмотреть текущую логику. Контакт бухгалтера.','on'],['Неделя 1–2','Ядро','Договоры и спецификации, заказы по складам заказчика, подбор по трём складам с поиском по аналогам, воронка исполнения, роли, мобильная версия. Показ по Zoom — вы говорите «это классно, это не надо».',''],['Параллельно','1С · тестовая база','Бухгалтер делает тестовую копию одной базы. Обмен номенклатурой и остатками, реализации и межфирменные — проверяем на тесте.',''],['Неделя 3–6','Версии 2–5','Реализации и дебиторка, закуп, отчёты и утренний отчёт, календарь. Подключение трёх боевых баз 1С. Правки по вашим замечаниям после каждой версии.',''],['Конец ноября','В бой','Новые договоры и спецификации — в системе. Bitrix закрываете, когда дожмёте текущие сделки. Код и права на код — ваши, система на вашем сервере.',''],['3 месяца после','Поддержка','Отладка под реальной нагрузкой — на связи в режиме реального времени. Дальше доработки по часам.','']].map(x=>`<div class="tli ${x[3]}"><span class="who">${esc(x[0])}</span><b>${esc(x[1])}</b><p>${esc(x[2])}</p></div>`).join('')}</div>
 <div class="g3" style="margin-top:12px"><div class="pan"><h3>Не делаем</h3><div class="li no"><i>—</i><span>Интеграцию с Bitrix</span></div><div class="li no"><i>—</i><span>Перенос сделок из Bitrix</span></div><div class="li no"><i>—</i><span>Автоматическое сопоставление наименований — пока ручной подбор, по вашему решению</span></div></div>
 <div class="pan"><h3>Что нужно от вас</h3><div class="li"><i>1</i><span>Реквизиты для договора</span></div><div class="li"><i>2</i><span>Админский доступ к Bitrix · только просмотр</span></div><div class="li"><i>3</i><span>Тестовая копия одной базы 1С через бухгалтера</span></div><div class="li"><i>4</i><span>Пример договора, спецификации и заявки заказчика</span></div></div>
 ${said('«Не надо будет перенос данных делать — если сейчас начнём, это будет конец ноября, мы уже дожмём по Bitrix, а следующий год будем заносить сюда».')}</div>`;
/* ====== КАРТОЧКИ И ФОРМЫ ====== */
const CARD={};
CARD.con=id=>{const c=CN(id);return [`Договор ${esc(c.no)} <span class="tag ${CST[c.st][1]}">${CST[c.st][0]}</span>`,`${esc(CL(c.cl).n)} · поставщик ${esc(EN(c.ent).n)} · ${dl(c.d)} — ${dl(c.to)}`,
 `<div class="kv"><span>Сумма договора</span><b>${tg(c.lim)}</b></div><div class="kv"><span>Спецификации</span><b>${tg(c.spec)}</b></div><div class="kv"><span>Отгружено</span><b>${tg(c.ship)}</b></div><div class="kv"><span>Оплачено</span><b>${tg(c.paid)}</b></div><div class="kv"><span>Срок поставки · оплаты</span><b>${c.dt} · ${c.pt} дн.</b></div>`]};
CARD.spec=id=>{const s=SP(id);return [`Спецификация № ${esc(s.no)}`,`к договору ${esc(CN(s.con).no)} · ${dl(s.d)}`,s.lines.map((l,i)=>`<div class="kv"><span>${i+1}. ${esc(l.n)}</span><b>${l.q} × ${fmt(l.p)} · осталось ${left(l)}</b></div>`).join('')]};
CARD.ord=id=>{const o=OR(id);const s=SP(o.sp);return [`Заказ ${esc(o.no)} ${stageTag(o.st)}`,`${esc(CL(ordCon(o).cl).short)} · ${esc(o.ext)} · срок ${dl(ordDue(o))}`,o.lines.map(l=>`<div class="kv"><span>${esc(s.lines[l.li].n)} → ${esc(l.pt)}</span><b>${l.q} шт</b></div>`).join('')]};
CARD.cat=id=>{const c=CT(id);const ords=Object.entries(PICK).filter(([k,v])=>v.some(p=>p.alloc[id]&&Object.values(p.alloc[id]).some(x=>x))).map(([k])=>k);return [esc(c.n),`${esc(c.brand)} · ${esc(c.dim)} мм · ${c.id} · из 1С`,
 `<div class="wid" style="grid-template-columns:repeat(4,1fr)">${ENT.map(e=>`<div><small>${esc(e.short)}</small><b>${c.st[e.id]}</b></div>`).join('')}<div><small>Всего</small><b class="a">${stTot(c)}</b></div></div>
 <div class="kv"><span>Аналоги · по ним ищет подбор</span><b class="mono">${esc(c.an)}</b></div><div class="kv"><span>Себестоимость · 1С</span><b>${tg(c.c)}</b></div><div class="kv"><span>Резерв под заказы</span><b>${ords.map(o=>OR(o).no).join(', ')||'—'}</b></div>
 <h4 style="margin:12px 0 6px">Под какие строки спецификаций подходит</h4>${SPECS.flatMap(s=>s.lines.filter(l=>findCands(l.n).includes(c)).map(l=>`<div class="kv"><span>№ ${esc(s.no)} · ${esc(l.n)}</span><b>осталось ${left(l)}</b></div>`)).join('')||'<p class="mini">Нет в действующих спецификациях.</p>'}`]};
CARD.cl=id=>{const k=CL(id);return [esc(k.n),`${esc(k.ind)} · БИН ${k.bin} · менеджер ${esc(k.mgr)}`,
 `<h4 style="margin:0 0 6px">Склады заказчика · куда везём</h4>${k.pts.map(p=>`<div class="kv"><span>${esc(p)}</span><b>${ORDERS.filter(o=>ordCon(o).cl===id&&o.lines.some(l=>l.pt===p)).length} заказов</b></div>`).join('')}
 <h4 style="margin:12px 0 6px">Договоры</h4>${CONS.filter(c=>c.cl===id).map(c=>`<div class="kv"><span>${esc(c.no)} · ${esc(EN(c.ent).short)}</span><b>${mln(c.lim)} · ${CST[c.st][0]}</b></div>`).join('')}
 <div class="btns" style="margin-top:10px"><button class="bt" onclick="closeM();act('pt-add')">+ Склад заказчика</button></div>`]};
CARD.real=no=>{const r=REAL.find(x=>x.no===no);return [`Накладная ${esc(r.no)}`,`${dl(r.d)} · ${esc(EN(r.ent).n)} → ${esc(CL(r.cl).n)}`,
 `<div class="kv"><span>Сумма</span><b>${tg(r.sum)}</b></div><div class="kv"><span>Оплатить до</span><b class="${r.paid<r.sum&&realDue(r)<TODAY?'neg':''}">${dl(realDue(r))}</b></div><div class="kv"><span>Оплачено</span><b>${tg(r.paid)}${r.pd?' · '+dl(r.pd):''}</b></div><div class="kv"><span>1С</span><b>проведена в ${esc(EN(r.ent).base)}</b></div><div class="kv"><span>ЭСФ</span><b>${esc(r.esf)}</b></div>${r.ord?`<div class="btns" style="margin-top:10px"><button class="bt p" onclick="closeM();openOrd('${r.ord}')">Заказ</button></div>`:''}`]};
/* формы */
CARD.newcon=()=>[`Новый договор`,`как вы показали на встрече: заказчик, поставщик — одно из трёх юрлиц, сроки и сумма`,
 `<div class="form"><label>Заказчик<select id="f_cl">${CLIENTS.map(k=>`<option value="${k.id}">${esc(k.n)}</option>`).join('')}</select></label>
 <label>Поставщик · наше юрлицо<select id="f_ent">${ENT.map(e=>`<option value="${e.id}">${esc(e.n)}</option>`).join('')}</select></label>
 <label>Номер договора<input id="f_no" value="ДГ-2026/041"></label><label>Сумма договора, ₸<input id="f_lim" type="number" value="10000000"></label>
 <label>Срок поставки, дней от заказа<input id="f_dt" type="number" value="39"></label><label>Срок оплаты, дней от реализации<input id="f_pt" type="number" value="60"></label>
 <label class="wide">Тело договора<span class="file">перетащите PDF или выберите файл</span></label></div>
 <div class="btns" style="margin-top:12px"><button class="bt" onclick="closeM()">Отмена</button><button class="bt p" onclick="saveCon()">Создать договор</button></div>`];
function saveCon(){const v=id=>document.getElementById(id).value;const id='C'+(CONS.length+1);CONS.unshift({id,no:v('f_no'),cl:v('f_cl'),ent:v('f_ent'),d:TODAY,to:'2027-09-27',lim:+v('f_lim')||0,spec:0,ship:0,paid:0,dt:+v('f_dt')||39,pt:+v('f_pt')||60,mgr:'Ерлан',st:'active'});closeM();curCon=id;go('contract');toast(`Договор ${esc(v('f_no'))} создан. Следующий шаг — спецификация: «+ Спецификация».`)}
let nsRows=3;
CARD.newspec=cid=>{const c=CN(cid)||CN('C1');return [`Спецификация к договору ${esc(c.no)}`,`${esc(CL(c.cl).short)} · прайса нет — строки заносятся вручную из присланной спецификации`,
 `<div class="form"><label>Номер спецификации<input id="s_no" value="4503091207"></label><label>Дата<input id="s_d" type="date" value="${TODAY}"></label></div>
 <table class="t fl"><tr><th>№</th><th>Наименование у заказчика</th><th class="r">Кол-во</th><th class="r">Цена, ₸</th></tr>${Array.from({length:nsRows},(_,i)=>`<tr><td class="mono">${i+1}</td><td><input class="ns_n" value="${['Подшипник 3638 ГОСТ 5721-75','Подшипник 7222А ГОСТ 27365-87','Подшипник 180312 ГОСТ 8882-75','',''][i]||''}"></td><td><input class="ns_q qin" type="number" value="${[10,6,40][i]||''}"></td><td><input class="ns_p" type="number" value="${[612000,96000,14500][i]||''}"></td></tr>`).join('')}</table>
 <div class="btns" style="justify-content:flex-start;margin-top:8px"><button class="bt" onclick="nsRows++;card('newspec','${c.id}')">+ строка</button><span class="mini">или загрузите Excel заказчика — колонки сопоставятся</span></div>
 <div class="btns" style="margin-top:12px"><button class="bt" onclick="closeM()">Отмена</button><button class="bt p" onclick="saveSpec('${c.id}')">Сохранить спецификацию</button></div>`]};
function saveSpec(cid){const n=[...document.querySelectorAll('.ns_n')].map(x=>x.value),q=[...document.querySelectorAll('.ns_q')].map(x=>+x.value),p=[...document.querySelectorAll('.ns_p')].map(x=>+x.value);const lines=n.map((x,i)=>({n:x,q:q[i]||0,p:p[i]||0,ship:0,ord:0})).filter(l=>l.n&&l.q);if(!lines.length){toast('Добавьте хотя бы одну строку.');return}const id='SP'+(SPECS.length+1);const s={id,no:document.getElementById('s_no').value,con:cid,d:TODAY,src:'заполнили вручную',lines};SPECS.push(s);const c=CN(cid);c.spec+=specSum(s);if(c.spec>c.lim*0.9)c.st='limit';nsRows=3;closeM();curSpec=id;go('spec');toast(`Спецификация № ${esc(s.no)} на ${tg(specSum(s))} добавлена к договору ${esc(c.no)}. Свободно по договору ${tg(c.lim-c.spec)}.`)}
CARD.neworder=sid=>{const s=SP(sid)||SP('SP1');const c=CN(s.con);const k=CL(c.cl);return [`Заказ по спецификации № ${esc(s.no)}`,`${esc(k.short)} · поставщик ${esc(EN(c.ent).short)} · срок поставки ${c.dt} дней — до ${dl(addDays(TODAY,c.dt))}`,
 `<div class="form"><label>Номер заявки заказчика<input id="o_ext" value="заявка № 7700-118"></label><label>Дата заказа<input type="date" value="${TODAY}"></label></div>
 <table class="t fl"><tr><th>Строка спецификации</th><th class="r">Осталось</th><th class="r">Заказ</th><th>Склад заказчика · куда</th></tr>${s.lines.map((l,i)=>`<tr><td><b>${esc(l.n)}</b></td><td class="r">${left(l)}</td><td><input class="no_q qin" type="number" min="0" max="${left(l)}" value="${i===0&&left(l)?Math.min(2,left(l)):0}" ${left(l)?'':'disabled'}></td><td><select class="no_pt">${k.pts.map(p=>`<option>${esc(p)}</option>`).join('')}</select></td></tr>`).join('')}</table>
 <p class="mini" style="margin-top:6px">Можно заказать не всё: система следит, чтобы по строке не заказали больше, чем осталось по спецификации.</p>
 <div class="btns" style="margin-top:12px"><button class="bt" onclick="closeM()">Отмена</button><button class="bt p" onclick="saveOrder('${s.id}')">Сохранить и перейти к подбору</button></div>`]};
function saveOrder(sid){const s=SP(sid);const q=[...document.querySelectorAll('.no_q')].map(x=>+x.value||0),pt=[...document.querySelectorAll('.no_pt')].map(x=>x.value);const lines=[];let over=false;s.lines.forEach((l,i)=>{if(q[i]>left(l))over=true;if(q[i]>0)lines.push({li:i,q:q[i],pt:pt[i]})});if(over){toast('По строке заказано больше, чем осталось по спецификации.');return}if(!lines.length){toast('Укажите количество хотя бы по одной строке.');return}
 const id='ZK'+(ORDERS.length+1);const no='ЗК-2026/'+TODAY.slice(5,7)+TODAY.slice(8)+'-0'+(ORDERS.filter(o=>o.d===TODAY).length+1);ORDERS.unshift({id,no,ext:document.getElementById('o_ext').value,sp:sid,d:TODAY,st:'pick',lines});lines.forEach(l=>s.lines[l.li].ord+=l.q);
 PICK[id]=lines.map(l=>{const cand=findCands(s.lines[l.li].n).map(c=>c.id);const alloc={};cand.forEach(n=>alloc[n]={E1:0,E2:0,E3:0});return {cand,alloc,buy:l.q}});closeM();curOrd=id;go('pick');toast(`Заказ ${esc(no)} создан. Подберите позиции со складов — по умолчанию всё стоит в закупе.`)}

function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена: '+esc(k)+' · '+esc(id));return}const [t,s,b]=r;openM(t,s,b)}

/* ====== ДЕЙСТВИЯ ====== */
function act(k,a){const M={
 'rules':'Правила «что горит» настраиваются: пороги дней, процент лимита, кому уходит сигнал.',
 'xls':'Выгрузка текущей таблицы в Excel.',
 'doc-body':'Тело договора открывается в просмотре — PDF, подписанный ЭЦП.',
 'no-spec':'К договору ещё нет спецификаций — добавьте первую.',
 'spec-edit':'Спецификация редактируется, пока по ней нет отгрузок; после — через дополнительное соглашение.',
 'client-new':'Новый заказчик: из 1С по БИН — реквизиты подтянутся сами. Добавьте склады заказчика.',
 'pt-add':'Новый склад заказчика: город, адрес, контакт приёмщика — появится в выборе при заказе.',
 'print-list':()=>`Лист сборки по заказу ${esc(OR(a).no)}: по каждому складу — позиции, количество, ячейка. Уходит на печать и в телефон кладовщика.`,
 'remember':'Сопоставление запомнено: в следующий раз эта позиция будет первой в подборе. Автоматически система ничего не выбирает.',
 'add-wh':'Новый склад: юрлицо, адрес, база 1С. Появится в остатках и в подборе — без программиста.',
 'an-add':'Новый аналог: обозначение ГОСТ, ISO или бренда — поиск начнёт его находить сразу.',
 'mf-post':'Черновики МФ-0113 и МФ-0114 отправлены в базы СтальОпоры, ГорМашСнаба и КарБеаринга. Бухгалтер проводит.',
 'buy-send':'Заявка поставщику сформирована: позиции, количество, желаемый срок. Отправляется письмом или в WhatsApp.',
 'real-new':'Реализация создаётся из заказа на этапе «Отправлено» — позиции и цены берутся из спецификации.',
 'remind':'Письмо заказчику со списком неоплаченных накладных и актом сверки.',
 'plan-set':'План отгрузок на квартал по менеджеру — факт считается из реализаций 1С.',
 'daily-cfg':'Кому и что: руководитель — всё, менеджер — свои договоры, снабжение — дефицит, бухгалтерия — оплаты и 1С.',
 'daily-send':'Отчёт отправлен в Telegram и на почту.',
 'sync-log':'Полный журнал обмена по трём базам — с фильтром по документу.',
 'sync-now':'Обмен с тремя базами 1С запущен. Остатки и оплаты обновятся через минуту.',
 'cal-new':'Новая встреча: дата, время, с кем, привязка к заказчику или договору.',
 'picked':'Позиция отмечена собранной. Когда соберут всё — заказ уйдёт в «Ожидание отгрузки».',
 'shipped':'Отгрузка подтверждена, фото накладной приложено. Заказ — в «Отправлено».',
 'delivered':'Заказчик получил. Заказ готов к реализации в 1С.'
 };const m=M[k];if(!m){toast('Действие в демо: '+esc(k));return}toast(typeof m==='function'?m():m)}

function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();
 const c=CONS.find(x=>x.no.toLowerCase().includes(q));if(c){openCon(c.id);return}
 const s=SPECS.find(x=>x.no.toLowerCase().includes(q));if(s){openSpec(s.id);return}
 const o=ORDERS.find(x=>x.no.toLowerCase().includes(q));if(o){openOrd(o.id);return}
 const r=REAL.find(x=>x.no.toLowerCase().includes(q));if(r){card('real',r.no);return}
 const k=CLIENTS.find(x=>x.n.toLowerCase().includes(q));if(k){card('cl',k.id);return}
 const f=findCands(q);if(f.length){catQ=v;go('catalog');return}
 toast(`Поиск «${esc(v)}»: по договорам, спецификациям, заказам, накладным, заказчикам и номенклатуре с аналогами. Попробуйте «3638», «4503085694», «Сарыарка», «РН-000781».`)}

/* ====== ИНФРАСТРУКТУРА: модули сверху, экраны слева, цепочка документа ====== */
function renderRoles(){const r=document.getElementById('roles');if(!r)return;
 r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();
 toast(`Вы вошли как «${role}» · ${ROLES[role].n}. Показаны только разделы этой роли.`);}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${role}. Разделов: ${ROLES[role].s.length}. ${ROLES[role].note}.`)}
const ownerOf=k=>SECOF[k];
function buildRail(){const on=ownerOf(cur);document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="mod ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')">${esc(s.n)}</a>`).join('');}
function buildSub(){const on=ownerOf(cur),s=SEC.find(x=>x.k===on);if(!s)return;document.getElementById('sub').innerHTML=`<h4>${esc(s.n)}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`;}
const CHAIN=[['Договоры','contracts',()=>CONS.filter(c=>c.st!=='done'&&inEnt(c)).length,['contracts','contract','clients']],['Спецификации','specs',()=>SPECS.filter(s=>inEnt(CN(s.con))).length,['specs','spec']],['Заказы','orders',()=>ORDERS.filter(o=>!['real','pay','paid'].includes(o.st)&&inEnt(ordCon(o))).length,['orders','order']],['Подбор','pick',()=>ORDERS.filter(o=>o.st==='pick'&&inEnt(ordCon(o))).length,['pick']],['Сборка и отгрузка','funnel',()=>ORDERS.filter(o=>['work','build','wait','sent'].includes(o.st)&&inEnt(ordCon(o))).length,['funnel','moves']],['Реализации · 1С','realiz',()=>REAL.filter(r=>inEnt(r)).length,['realiz','sync','mapping']],['Оплата','receiv',()=>REAL.filter(r=>inEnt(r)&&r.paid<r.sum).length,['receiv']]];
function buildChain(){const el=document.getElementById('chain');if(!el)return;el.innerHTML=CHAIN.map((c,i)=>`<a class="ch ${c[3].includes(cur)?'on':''} ${allowed(c[1])?'':'dis'}" onclick="go('${c[1]}')"><b>${c[2]()}</b><span>${c[0]}</span></a>${i<CHAIN.length-1?'<i>›</i>':''}`).join('');}
function buildEnt(){const el=document.getElementById('entsw');if(!el)return;el.innerHTML=[['all','Все юрлица'],...ENT.map(e=>[e.id,e.short])].map(x=>`<button class="${curEnt===x[0]?'on':''}" onclick="curEnt='${x[0]}';build()">${esc(x[1])}</button>`).join('');}
function build(){buildRail();buildSub();buildChain();buildEnt();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Обойма';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildChain();const a=document.getElementById('addBtn');if(a)a.style.display=allowed('contracts')?'':'none';try{history.replaceState(null,'','?s='+cur+(cur==='order'?'&o='+curOrd:cur==='contract'?'&c='+curCon:''))}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль в правом верхнем углу.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

/* ====== СЦЕНАРИЙ ПОКАЗА ====== */
const TOUR=[
 ['dash','1 · Панель руководителя: все договоры трёх юрлиц — сумма, спецификации, отгружено, оплачено, что осталось. Цепочка сверху — где сейчас документы.'],
 ['contracts','2 · Договоры: заказчик, наше юрлицо-поставщик, срок поставки 39 дней, срок оплаты 60, сумма. Лимит почти исчерпан — жёлтым.'],
 ['contract','3 · Карточка договора: как расходуется сумма — спецификации, отгрузки, оплаты. Спецификации, заказы, накладные и файлы в одном месте.'],
 ['spec','4 · Спецификация 4503085694: наименования как у заказчика, заносятся вручную. По каждой строке — отгружено, в заказах, осталось.'],
 ['orders','5 · Заказы: не все десять, а три, пять и один — и каждая позиция на свой склад заказчика: Караганда, Жезказган, Балхаш.'],
 ['pick','6 · Подбор: «3638 ГОСТ» на складе лежит как 22338 CC/W33 или 3638 другого завода. Поиск по аналогам, остатки трёх складов, выбирает человек, дефицит — в закуп.'],
 ['moves','7 · Товар со склада другого юрлица — межфирменная реализация в обе базы 1С, как вы просили.'],
 ['funnel','8 · Воронка исполнения: подбор → в работу → сборка → ожидание отгрузки → отправлено → реализация → оплата. Канбан, карточки перетаскиваются.'],
 ['stock','9 · Остатки трёх складов из трёх баз 1С и резерв под заказы. Новый склад — кнопкой.'],
 ['purchase','10 · Закуп: всё, чего не хватило при подборе, и что ниже минимума, — под какой заказ и к какому сроку.'],
 ['realiz','11 · Реализации: накладная уходит в базу 1С поставщика, ЭСФ — из 1С.'],
 ['receiv','12 · Дебиторка по срокам договоров: не наступил, ближайшие 30 дней, просрочено.'],
 ['alerts','13 · Что горит: непоставка, неоплата, лимит договора, дефицит, ошибки 1С — формулы, а не ручной свод.'],
 ['daily','14 · Ежедневный отчёт в 08:00 в Telegram или на почту — каждому свой.'],
 ['sync','15 · Обмен с тремя базами 1С: сначала тестовая копия с вашим бухгалтером, потом боевые.'],
 ['mobile','16 · Мобильная версия сразу: руководитель, склад, логист.'],
 ['launch','17 · Запуск без интеграции и переноса из Bitrix: дожимаете сделки до конца ноября, следующий год — здесь.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий показа закончен. Всё кликается: договоры, спецификации, заказы, подбор, склады, накладные.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;if(k==='contract')curCon='C1';if(k==='spec')curSpec='SP1';if(k==='pick')curOrd='ZK1';build();toast(m);setTimeout(step,ti===0?6200:7200);}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});let q='',o='',c='';try{const u=new URLSearchParams(location.search);q=u.get('s')||'';o=u.get('o')||'';c=u.get('c')||''}catch(e){}if(o&&OR(o))curOrd=o;if(c&&CN(c))curCon=c;if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
