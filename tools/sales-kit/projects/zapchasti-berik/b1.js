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
