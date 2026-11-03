/* ГЛЯНЕЦ — CRM, склад и задачи для компании по продаже профессиональной уборочной техники
   (Александр и Руслан, 15 человек). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(Math.round(n/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const TODAY='04.11.2026',NOW='10:30';
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>Из встречи</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const crumbs=(...a)=>`<div class="crumbl">${a.map((x,i)=>i<a.length-1?`<a onclick="${x[1]}">${esc(x[0])}</a>`:`<b>${esc(x[0])}</b>`).join(' <i>/</i> ')}</div>`;

const SEC=[
 {k:'day',n:'Сегодня',sub:[['dash','Пульт','DSH']]},
 {k:'crm',n:'Продажи',sub:[['funnel','Воронка продаж','FNL'],['deal','Карточка сделки','DEAL'],['clients','Клиенты и объекты','CLI'],['inbox','WhatsApp и звонки','MSG'],['kp','Коммерческие предложения','KP']]},
 {k:'wh',n:'Склад',sub:[['stock','Остатки','STK'],['product','Карточка товара','SKU'],['receive','Приход','IN'],['ship','Резерв и отгрузки','OUT'],['moves','Перемещения','MOV'],['inv','Инвентаризация','INV'],['whrep','Отчёты и Excel','XLS']]},
 {k:'svc',n:'Сервис',sub:[['service','Сервис и ТО','SVC']]},
 {k:'tasks',n:'Задачи',sub:[['tasks','Доска задач','TSK'],['task','Карточка задачи','CRD'],['feed','Лента','FD']]},
 {k:'team',n:'Команда',sub:[['team','Сотрудники','TM'],['roles','Роли и права','ROL']]},
 {k:'sys',n:'Система',sub:[['multi','Мультибизнес','MLT'],['launch','Запуск и стоимость','LNC']]}
];
const SECOF={},SUBN={},CODE={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1];CODE[x[0]]=x[2]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'АЛ',n:'Александр',note:'Все бизнесы, деньги, воронки, склады, команда',s:ALL.slice()},
 'Руководитель продаж':{av:'РС',n:'Руслан',note:'Воронка, сделки, КП, задачи команды, склад для продаж',s:['dash','funnel','deal','clients','inbox','kp','stock','product','ship','service','tasks','task','feed','team']},
 'Менеджер':{av:'ДН',n:'Дана · менеджер',note:'Свои сделки, звонки, WhatsApp, КП, резерв техники, задачи',s:['funnel','deal','clients','inbox','kp','stock','product','tasks','task','feed']},
 'Кладовщик':{av:'ЕР',n:'Ерлан · склад',note:'Приход, отгрузки, перемещения, инвентаризация, Excel',s:['stock','product','receive','ship','moves','inv','whrep','tasks','task','feed']},
 'Сервисный инженер':{av:'ТМ',n:'Тимур · сервис',note:'Пусконаладка, ТО, ремонт, запчасти со склада',s:['service','stock','product','tasks','task','feed']},
 'Бухгалтер':{av:'СВ',n:'Светлана',note:'Оплаты, отгрузки, остатки в деньгах, Excel',s:['dash','ship','stock','whrep','clients']}
};
let role='Собственник',cur='dash';

/* ===== Бизнесы (мультибизнес) ===== */
const BIZ=[
 {id:'B1',n:'Глянец · Техника',d:'продажа уборочной техники',c:'#0e7c86',rev:48600000,deals:23,stock:186400000,tasks:41},
 {id:'B2',n:'Глянец · Сервис',d:'ремонт и ТО техники',c:'#e0a823',rev:6200000,deals:14,stock:12800000,tasks:27},
 {id:'B3',n:'Глянец · Химия',d:'моющие средства оптом',c:'#7a5ad0',rev:9800000,deals:31,stock:21300000,tasks:12}
];
let biz='B1';

/* ===== Команда ===== */
let STAFF=[
 {id:'AL',n:'Александр Ким',pos:'Собственник',dep:'Руководство',ph:'+7 701 100 20 30',st:'on',tasks:3},
 {id:'RS',n:'Руслан Абенов',pos:'Руководитель продаж',dep:'Продажи',ph:'+7 701 200 31 40',st:'on',tasks:6},
 {id:'DN',n:'Дана Сейтова',pos:'Менеджер по продажам',dep:'Продажи',ph:'+7 707 310 22 18',st:'on',tasks:8},
 {id:'MR',n:'Марат Исаев',pos:'Менеджер по продажам',dep:'Продажи',ph:'+7 705 411 30 72',st:'on',tasks:7},
 {id:'AI',n:'Айгерим Нуркенова',pos:'Менеджер по продажам · Астана',dep:'Продажи',ph:'+7 777 520 41 05',st:'on',tasks:5},
 {id:'KM',n:'Камила Ахметова',pos:'Менеджер по тендерам',dep:'Продажи',ph:'+7 702 630 12 90',st:'on',tasks:4},
 {id:'ER',n:'Ерлан Жумабаев',pos:'Кладовщик',dep:'Склад',ph:'+7 701 744 55 10',st:'on',tasks:5},
 {id:'BS',n:'Бекзат Оспанов',pos:'Кладовщик · Астана',dep:'Склад',ph:'+7 708 812 19 27',st:'on',tasks:2},
 {id:'TM',n:'Тимур Ли',pos:'Сервисный инженер',dep:'Сервис',ph:'+7 701 903 33 41',st:'on',tasks:6},
 {id:'NS',n:'Нурлан Сарсенов',pos:'Сервисный инженер',dep:'Сервис',ph:'+7 776 104 28 63',st:'on',tasks:4},
 {id:'SV',n:'Светлана Пак',pos:'Бухгалтер',dep:'Финансы',ph:'+7 701 215 47 80',st:'on',tasks:3},
 {id:'GL',n:'Гульнара Тулеуова',pos:'Офис-менеджер',dep:'Офис',ph:'+7 747 326 64 19',st:'on',tasks:2},
 {id:'DM',n:'Данияр Мусин',pos:'Водитель-экспедитор',dep:'Склад',ph:'+7 707 437 81 52',st:'on',tasks:3},
 {id:'AS',n:'Асхат Байжанов',pos:'Маркетолог',dep:'Маркетинг',ph:'+7 705 548 92 36',st:'on',tasks:2},
 {id:'OL',n:'Ольга Ким',pos:'Менеджер по сервису',dep:'Сервис',ph:'+7 702 659 13 44',st:'vac',tasks:1}
];
const SF=id=>STAFF.find(s=>s.id===id)||{n:'—',id:'—'};
const ini=id=>{const s=STAFF.find(x=>x.id===id);return s?s.n.split(' ').map(w=>w[0]).join('').slice(0,2):id};
const fn=id=>SF(id).n.split(' ')[0];

/* ===== Товары ===== kind: m — техника (учёт по серийным номерам), p — запчасти и расходники, c — химия */
let PRODUCTS=[
 {id:'SC-55',n:'Поломоечная машина AquaLine SC-55',kind:'m',cat:'Поломоечные с сиденьем',price:8950000,cost:6120000,min:2,cell:'A-01',spec:'ширина 55 см · бак 70 л · АКБ 240 А·ч · 2 400 м²/ч'},
 {id:'SC-43',n:'Поломоечная машина AquaLine SC-43 с ручным управлением',kind:'m',cat:'Поломоечные ручные',price:3290000,cost:2180000,min:3,cell:'A-02',spec:'ширина 43 см · бак 40 л · АКБ 105 А·ч · 1 500 м²/ч'},
 {id:'RX-75',n:'Поломоечная машина Nordmax RX-75 для ТРЦ',kind:'m',cat:'Поломоечные с сиденьем',price:14600000,cost:10200000,min:1,cell:'A-03',spec:'ширина 75 см · бак 120 л · 5 000 м²/ч · для ТРЦ и аэропортов'},
 {id:'SW-90',n:'Подметальная машина SweepPro S-90',kind:'m',cat:'Подметальные',price:5400000,cost:3700000,min:1,cell:'A-04',spec:'ширина 90 см · бункер 60 л · для парковок'},
 {id:'MINI-30',n:'Мини-поломойка Compact 30',kind:'m',cat:'Компактные',price:1190000,cost:760000,min:4,cell:'A-05',spec:'ширина 30 см · для кафе и бутиков'},
 {id:'BR-55',n:'Щётка дисковая 55 см',kind:'p',cat:'Щётки и пады',price:68000,cost:39000,min:10,cell:'B-11',spec:'для SC-55'},
 {id:'PD-43',n:'Пад полировальный 43 см, красный',kind:'p',cat:'Щётки и пады',price:9500,cost:4200,min:40,cell:'B-12',spec:'упаковка 5 шт'},
 {id:'SQ-75',n:'Резина сквиджа 75 см',kind:'p',cat:'Запчасти',price:42000,cost:23000,min:8,cell:'B-14',spec:'для RX-75'},
 {id:'AKB-240',n:'Аккумулятор тяговый 240 А·ч',kind:'p',cat:'Аккумуляторы',price:620000,cost:410000,min:4,cell:'C-01',spec:'гелевый, 12 В'},
 {id:'CH-DET',n:'Средство для поломоечных машин, 20 л',kind:'c',cat:'Химия',price:38000,cost:19500,min:60,cell:'D-02',spec:'низкопенное, pH 9'}
];
const PR=id=>PRODUCTS.find(p=>p.id===id)||PRODUCTS[0];
let curP='SC-55';
const WH=[{id:'W1',n:'Склад Алматы',addr:'ул. Бокейханова, 510'},{id:'W2',n:'Склад Астана',addr:'пр. Тәуелсіздік, 33'},{id:'W3',n:'Демо-зал',addr:'Алматы, шоурум'},{id:'W4',n:'Сервис',addr:'Алматы, мастерская'}];
const WN=id=>(WH.find(w=>w.id===id)||WH[0]).n;
let whF='all';

/* ===== Серийные номера техники ===== st: free — свободна, res — в резерве под сделку, demo — демо-машина, svc — в ремонте, sold — продана */
let SERIALS=[
 {sn:'SC55-24-0412',p:'SC-55',wh:'W1',st:'free',in:'12.09'},{sn:'SC55-24-0413',p:'SC-55',wh:'W1',st:'res',deal:'D-118',in:'12.09'},{sn:'SC55-24-0419',p:'SC-55',wh:'W2',st:'free',in:'12.09'},{sn:'SC55-23-0288',p:'SC-55',wh:'W3',st:'demo',in:'15.03'},
 {sn:'SC43-24-1104',p:'SC-43',wh:'W1',st:'free',in:'02.10'},{sn:'SC43-24-1105',p:'SC-43',wh:'W1',st:'free',in:'02.10'},{sn:'SC43-24-1106',p:'SC-43',wh:'W2',st:'res',deal:'D-121',in:'02.10'},
 {sn:'RX75-24-0031',p:'RX-75',wh:'W1',st:'res',deal:'D-115',in:'20.08'},{sn:'RX75-23-0017',p:'RX-75',wh:'W3',st:'demo',in:'10.11.25'},
 {sn:'SW90-24-0205',p:'SW-90',wh:'W1',st:'free',in:'18.07'},{sn:'SW90-23-0144',p:'SW-90',wh:'W4',st:'svc',in:'01.06.25'},
 {sn:'MC30-24-3301',p:'MINI-30',wh:'W1',st:'free',in:'05.10'},{sn:'MC30-24-3302',p:'MINI-30',wh:'W1',st:'free',in:'05.10'},{sn:'MC30-24-3303',p:'MINI-30',wh:'W2',st:'free',in:'05.10'}
];
const SST={free:['свободна','g'],res:['резерв','w'],demo:['демо-зал','i'],svc:['в ремонте','r'],sold:['продана','']};
let curSN='SC55-24-0413';
/* количество для штучных товаров по складам */
let QTY={'BR-55':{W1:14,W2:6,W4:3},'PD-43':{W1:120,W2:35,W4:10},'SQ-75':{W1:5,W2:1,W4:2},'AKB-240':{W1:7,W2:2,W4:1},'CH-DET':{W1:210,W2:64}};
const qty=(p,w)=>{const P=PR(p);if(P.kind==='m')return SERIALS.filter(s=>s.p===p&&s.st!=='sold'&&(!w||w==='all'||s.wh===w)).length;const q=QTY[p]||{};return w&&w!=='all'?(q[w]||0):Object.values(q).reduce((a,x)=>a+x,0)};
const freeQ=p=>PR(p).kind==='m'?SERIALS.filter(s=>s.p===p&&s.st==='free').length:qty(p);

/* ===== Клиенты и сделки ===== */
let CLIENTS=[
 {id:'C1',n:'ТРЦ «Mega Alma-Ata»',type:'ТРЦ',city:'Алматы',area:'150 000 м²',lpr:'Ербол Сапаров, директор по эксплуатации',ph:'+7 727 330 10 10',owned:['RX75-22-0004','SC55-23-0201']},
 {id:'C2',n:'Dostyk Plaza',type:'ТРЦ',city:'Алматы',area:'90 000 м²',lpr:'Инна Ли, главный инженер',ph:'+7 727 330 20 20',owned:[]},
 {id:'C3',n:'Международный аэропорт Астана',type:'Аэропорт',city:'Астана',area:'60 000 м²',lpr:'Тендерный отдел',ph:'+7 7172 70 00 00',owned:[]},
 {id:'C4',n:'ТОО «CleanPro»',type:'Клининговая компания',city:'Алматы',area:'—',lpr:'Самат Ермеков, директор',ph:'+7 701 555 20 31',owned:['SC43-23-0880','SC43-23-0881','MC30-23-1102']},
 {id:'C5',n:'Гипермаркет «Magnum» Аль-Фараби',type:'Ритейл',city:'Алматы',area:'12 000 м²',lpr:'Руслан Каримов, АХО',ph:'+7 727 300 40 40',owned:['SC55-22-0112']},
 {id:'C6',n:'Бизнес-центр «Нурлы Тау»',type:'Бизнес-центр',city:'Алматы',area:'45 000 м²',lpr:'УК «Нурлы»',ph:'+7 727 311 50 50',owned:[]},
 {id:'C7',n:'Школа-лицей № 165',type:'Госучреждение',city:'Алматы',area:'8 000 м²',lpr:'Завхоз',ph:'+7 727 260 11 22',owned:[]}
];
const CL=id=>CLIENTS.find(c=>c.id===id)||CLIENTS[0];
const STG=[['lead','Лид'],['qual','Квалификация'],['demo','Демо-показ'],['kp','КП отправлено'],['agree','Согласование / тендер'],['bill','Счёт'],['paid','Оплата'],['ship','Отгрузка и пусконаладка']];
const STN=k=>(STG.find(s=>s[0]===k)||['','Закрыта'])[1];
let DEALS=[
 {id:'D-115',cl:'C2',biz:'B1',t:'2 машины RX-75 для Dostyk Plaza',sum:29200000,stg:'agree',mgr:'RS',src:'Повторный клиент',items:[['RX-75',2]],next:'Согласование у собственника ТРЦ до 08.11',days:3,prob:70},
 {id:'D-118',cl:'C1',biz:'B1',t:'Замена парка: SC-55 × 3',sum:26850000,stg:'kp',mgr:'DN',src:'Звонок',items:[['SC-55',3]],next:'Перезвонить по КП 05.11',days:1,prob:50},
 {id:'D-121',cl:'C4',biz:'B1',t:'CleanPro: SC-43 × 4 + пады',sum:13540000,stg:'bill',mgr:'MR',src:'WhatsApp',items:[['SC-43',4],['PD-43',10]],next:'Ждём оплату по счёту № 412',days:2,prob:90},
 {id:'D-124',cl:'C3',biz:'B1',t:'Тендер: 6 поломоечных машин',sum:71400000,stg:'agree',mgr:'KM',src:'Госзакупки',items:[['SC-55',4],['RX-75',2]],next:'Подача заявки до 12.11',days:8,prob:35},
 {id:'D-126',cl:'C5',biz:'B1',t:'Magnum: аккумуляторы и щётки',sum:1648000,stg:'paid',mgr:'DN',src:'Сервис',items:[['AKB-240',2],['BR-55',6]],next:'Отгрузка 05.11',days:0,prob:100},
 {id:'D-127',cl:'C6',biz:'B1',t:'Нурлы Тау: демо RX-75',sum:14600000,stg:'demo',mgr:'MR',src:'Сайт',items:[['RX-75',1]],next:'Демо-показ 06.11 в 10:00',days:2,prob:40},
 {id:'D-129',cl:'C7',biz:'B1',t:'Школа: мини-поломойки × 2',sum:2380000,stg:'qual',mgr:'AI',src:'Instagram',items:[['MINI-30',2]],next:'Уточнить бюджет',days:4,prob:25},
 {id:'D-130',cl:'C2',biz:'B1',t:'Dostyk: химия на год',sum:2280000,stg:'lead',mgr:'DN',src:'WhatsApp',items:[['CH-DET',60]],next:'Связаться сегодня',days:0,prob:15},
 {id:'D-131',cl:'C1',biz:'B2',t:'Mega: ТО парка, 6 машин',sum:1450000,stg:'bill',mgr:'OL',src:'Сервис',items:[],next:'Счёт подписан',days:1,prob:90},
 {id:'D-132',cl:'C4',biz:'B3',t:'CleanPro: химия ежемесячно',sum:860000,stg:'paid',mgr:'MR',src:'Повторный',items:[['CH-DET',20]],next:'Автозаказ 01.12',days:0,prob:100}
];
const DL=id=>DEALS.find(d=>d.id===id)||DEALS[0];
let curD='D-118';

/* ===== Сообщения и звонки ===== */
let INBOX=[
 {id:'m1',ch:'WhatsApp',who:'Самат Ермеков · CleanPro',deal:'D-121',t:'10:12',un:1,msgs:[['in','Счёт получили, оплатим сегодня-завтра. Когда сможете привезти?','10:12']]},
 {id:'m2',ch:'Звонок',who:'Ербол Сапаров · Mega',deal:'D-118',t:'09:48',dur:'6:41',dir:'входящий',rec:true,sum:'Спросил про лизинг и сроки поставки SC-55; просит сравнение с текущими машинами.'},
 {id:'m3',ch:'WhatsApp',who:'Инна Ли · Dostyk Plaza',deal:'D-130',t:'09:31',un:2,msgs:[['in','Здравствуйте, нужна химия для машин на год, какие объёмы посоветуете?','09:30'],['in','У нас 4 машины, 2 смены','09:31']]},
 {id:'m4',ch:'Звонок',who:'+7 701 909 11 55 · новый номер',deal:null,t:'09:05',dur:'—',dir:'пропущенный',rec:false,sum:'Пропущенный — система создала задачу «перезвонить» дежурному менеджеру.'},
 {id:'m5',ch:'Звонок',who:'Тендерный отдел · Аэропорт',deal:'D-124',t:'вчера',dur:'12:03',dir:'исходящий',rec:true,sum:'Уточнили техническое задание тендера: ширина уборки от 55 см, гарантия 2 года.'}
];
let curM='m1';

/* ===== Задачи и лента ===== st: new — новая, work — в работе, check — на проверке, done — готово */
let TASKS=[
 {id:'T-301',t:'Перезвонить Ерболу (Mega) по КП на SC-55',who:'DN',by:'RS',due:'05.11',st:'new',pr:'high',deal:'D-118',chk:[['Сравнение с текущими машинами',true],['Расчёт лизинга на 24 мес',false],['Отправить в WhatsApp',false]],com:[['RS','09:50','Ербол спрашивал про лизинг — подготовь 2 варианта.']],watch:['RS']},
 {id:'T-302',t:'Демо-показ RX-75 в «Нурлы Тау»',who:'MR',by:'RS',due:'06.11',st:'work',pr:'high',deal:'D-127',chk:[['Забронировать демо-машину RX75-23-0017',true],['Водитель и газель на 08:30',true],['Химия и пады с собой',false],['Акт демо-показа подписать',false]],com:[['ER','вчера','Демо-машина заряжена, стоит у ворот 2.']],watch:['RS','ER']},
 {id:'T-303',t:'Отгрузить заказ Magnum: АКБ × 2, щётки × 6',who:'ER',by:'DN',due:'05.11',st:'work',pr:'mid',deal:'D-126',chk:[['Собрать по ячейкам C-01, B-11',true],['Накладная и счёт-фактура',false],['Передать водителю Данияру',false]],com:[],watch:['DN','SV']},
 {id:'T-304',t:'Подготовить заявку на тендер аэропорта',who:'KM',by:'AL',due:'11.11',st:'work',pr:'high',deal:'D-124',chk:[['Техническая спецификация',true],['Сертификаты соответствия',true],['Банковская гарантия',false],['Подписать ЭЦП',false]],com:[['AL','03.11','Цену согласовать со мной до подачи.']],watch:['AL','RS']},
 {id:'T-305',t:'ТО машины SW90-23-0144 — замена щётки',who:'TM',by:'OL',due:'04.11',st:'check',pr:'mid',deal:null,chk:[['Диагностика',true],['Заменить щётку BR-55',true],['Тест-драйв',true]],com:[['TM','10:05','Готово, проверьте.']],watch:['OL']},
 {id:'T-306',t:'Перезвонить на пропущенный +7 701 909 11 55',who:'AI',by:'Система',due:'сегодня',st:'new',pr:'high',deal:null,chk:[],com:[['Система','09:05','Пропущенный звонок на общий номер. Задача создана автоматически.']],watch:[]},
 {id:'T-307',t:'Пусконаладка SC-43 у CleanPro после оплаты',who:'NS',by:'MR',due:'08.11',st:'new',pr:'mid',deal:'D-121',chk:[['Доставка',false],['Сборка и запуск',false],['Обучение операторов',false],['Акт ввода в эксплуатацию',false]],com:[],watch:['MR']},
 {id:'T-308',t:'Инвентаризация ячеек B (запчасти)',who:'ER',by:'AL',due:'07.11',st:'new',pr:'low',deal:null,chk:[],com:[],watch:['AL']},
 {id:'T-309',t:'Выложить кейс Dostyk Plaza в Instagram',who:'AS',by:'RS',due:'10.11',st:'done',pr:'low',deal:null,chk:[['Фото',true],['Текст',true]],com:[],watch:[]}
];
const TST=[['new','Новые'],['work','В работе'],['check','На проверке'],['done','Готово']];
const PRN={high:['срочно','r'],mid:['обычная','w'],low:['низкая','']};
let curT='T-302',tView='board',tWho='all';
let FEED=[
 ['10:12','MR','написал в сделке D-121','«Счёт получили, оплатим сегодня-завтра» — клиент в WhatsApp','wa'],
 ['10:05','TM','отправил задачу на проверку','T-305 · ТО SW90-23-0144','task'],
 ['09:52','ER','принял приход','ПР-0087 · 3 × MINI-30, 120 падов · ячейки A-05, B-12','wh'],
 ['09:48','DN','поговорила 6:41 с Mega','Запись разговора прикреплена к сделке D-118','call'],
 ['09:20','RS','перевёл сделку на «Согласование»','D-115 · Dostyk Plaza · 29,2 млн','deal'],
 ['09:05','Система','создала задачу «перезвонить»','Пропущенный звонок, назначено Айгерим','task'],
 ['вчера','AL','утвердил скидку 4%','D-115 · согласование цены','deal'],
 ['вчера','BS','закончил перемещение','ПМ-0031 · SC55-24-0419 Алматы → Астана','wh']
];

/* ===== Пульт ===== */
const SC={};
const bizDeals=()=>DEALS.filter(d=>d.biz===biz);
SC.dash=()=>{const B=BIZ.find(b=>b.id===biz);const D=bizDeals(),open=D.filter(d=>d.stg!=='paid'),won=D.filter(d=>d.stg==='paid');
 const pipe=open.reduce((a,d)=>a+d.sum,0),wpipe=open.reduce((a,d)=>a+d.sum*d.prob/100,0);
 const low=PRODUCTS.filter(p=>freeQ(p.id)<p.min);const stockV=PRODUCTS.reduce((a,p)=>a+qty(p.id)*p.cost,0);
 const myT=TASKS.filter(t=>t.st!=='done');const over=myT.filter(t=>t.due==='сегодня'||t.due==='04.11');
 return `<div class="hd"><div><h2>Доброе утро, ${esc(ROLES[role].n.split(' ')[0])}</h2><p>${esc(B.n)} · ${TODAY}, ${NOW}. Что произошло за ночь и что требует решения сегодня.</p></div><div class="btns"><button class="bt" onclick="xlsDash()">Выгрузить в Excel</button><button class="bt p" onclick="newDeal()">+ Сделка</button></div></div>
 <div class="ledger">
  <div><small>Воронка, открыто</small><b>${mln(pipe)} ₸</b><span>${open.length} ${plural(open.length,['сделка','сделки','сделок'])} · с учётом вероятности ${mln(wpipe)}</span></div>
  <div><small>Продажи ноября</small><b class="ok">${mln(B.rev)} ₸</b><span>план 60 млн · ${pct(B.rev,60000000)}%</span>${bar(pct(B.rev,60000000),'g')}</div>
  <div><small>Склад в закупочных</small><b>${mln(stockV)} ₸</b><span>${SERIALS.filter(s=>s.st==='free').length} машин свободно · ${SERIALS.filter(s=>s.st==='res').length} в резерве</span></div>
  <div><small>Ниже минимума</small><b class="${low.length?'bad':''}">${low.length} SKU</b><span>${low.map(p=>p.id).join(', ')||'всё в норме'}</span></div>
  <div><small>Задачи на сегодня</small><b>${over.length}</b><span>${myT.length} открыто · ${TASKS.filter(t=>t.st==='check').length} ждут проверки</span></div>
 </div>
 <div class="g21"><div>
  <div class="pan"><h3>Воронка по этапам</h3><p>Нажмите на этап — откроется доска с фильтром.</p>
   <div class="stbar">${STG.map(([k,n])=>{const x=D.filter(d=>d.stg===k);const s=x.reduce((a,d)=>a+d.sum,0);return `<a onclick="go('funnel')"><em>${n}</em><b>${x.length}</b><i style="--w:${Math.min(100,pct(s,pipe||1)*1.6+4)}%"></i><span>${s?mln(s):'—'}</span></a>`}).join('')}</div></div>
  <div class="pan"><h3>Требует решения</h3><p>Система сама собирает то, что нельзя пропустить.</p>
   <div class="alist">
    <a onclick="openDeal('D-121')"><i class="dt w"></i><b>CleanPro не оплатил счёт № 412</b><span>2 дня · резерв SC-43 × 4 сгорит 07.11</span></a>
    <a onclick="go('stock')"><i class="dt r"></i><b>RX-75: свободных нет, резерв на 2 машины</b><span>в тендере ещё 2 · закажите у поставщика сейчас — поставка 45 дней</span></a>
    <a onclick="openTask('T-306')"><i class="dt r"></i><b>Пропущенный звонок 09:05 — ещё не перезвонили</b><span>задача у Айгерим</span></a>
    <a onclick="go('service')"><i class="dt i"></i><b>3 машины клиентов подходят к ТО в ноябре</b><span>Mega, Magnum, CleanPro — это повторные продажи расходников</span></a>
    <a onclick="openTask('T-305')"><i class="dt g"></i><b>Тимур закрыл ТО SW-90 — проверьте</b><span>задача на проверке</span></a>
   </div></div>
 </div><div>
  <div class="pan"><h3>Менеджеры за ноябрь</h3><p>Продажи, звонки, ответ в WhatsApp.</p>
   <table class="t sm"><thead><tr><th>Менеджер</th><th class="r">Продажи</th><th class="r">Звонки</th><th class="r">Ответ</th></tr></thead><tbody>
   ${[['RS',18.2,41,'4 мин'],['DN',12.9,96,'3 мин'],['MR',9.8,77,'6 мин'],['AI',4.4,58,'11 мин'],['KM',3.3,22,'—']].map(r=>`<tr onclick="go('team')"><td>${esc(SF(r[0]).n)}</td><td class="r">${r[1].toString().replace('.',',')} млн</td><td class="r">${r[2]}</td><td class="r ${r[3]==='11 мин'?'bad':''}">${r[3]}</td></tr>`).join('')}</tbody></table></div>
  <div class="pan"><h3>Лента</h3><p>Последнее по компании.</p>${FEED.slice(0,5).map(feedRow).join('')}<a class="more" onclick="go('feed')">Вся лента →</a></div>
 </div></div>
 ${said('«Нам нужна CRM: воронка, задачи, склады, инвентаризация, WhatsApp и IP-телефония — в одном месте.»','Пульт собирает всё это на одном экране: деньги в воронке, склад в тенге, задачи и что горит.')}`};
const FIC={wa:'WA',task:'ЗД',wh:'СК',call:'ТЛ',deal:'СД'};
const feedRow=f=>`<div class="frow"><span class="fic ${f[4]}">${FIC[f[4]]||'•'}</span><div><b>${esc(f[1]==='Система'?'Система':fn(f[1]))}</b> ${esc(f[2])}<small>${esc(f[3])}</small></div><time>${f[0]}</time></div>`;

/* ===== Воронка ===== */
let fMgr='all';
SC.funnel=()=>{const D=bizDeals().filter(d=>fMgr==='all'||d.mgr===fMgr);
 return `<div class="hd"><div><h2>Воронка продаж</h2><p>Перетащите карточку на другой этап или нажмите, чтобы открыть сделку. Каждый этап — свои обязательные действия: без КП не перейти в «Согласование», без оплаты — в «Отгрузку».</p></div><div class="btns"><select class="sel" onchange="fMgr=this.value;render()"><option value="all">Все менеджеры</option>${['RS','DN','MR','AI','KM'].map(m=>`<option value="${m}" ${fMgr===m?'selected':''}>${esc(SF(m).n)}</option>`).join('')}</select><button class="bt" onclick="xlsDeals()">Excel</button><button class="bt p" onclick="newDeal()">+ Сделка</button></div></div>
 <div class="kanban">${STG.map(([k,n])=>{const x=D.filter(d=>d.stg===k);return `<div class="kcol" ondragover="event.preventDefault()" ondrop="dropDeal(event,'${k}')"><div class="kh"><b>${n}</b><span>${x.length} · ${x.length?mln(x.reduce((a,d)=>a+d.sum,0)):'0'}</span></div>
 ${x.map(d=>`<div class="kc" draggable="true" ondragstart="event.dataTransfer.setData('t','${d.id}')" onclick="openDeal('${d.id}')"><code>${d.id}</code><b>${esc(CL(d.cl).n)}</b><span>${esc(d.t)}</span><div class="kf"><em>${tg(d.sum)}</em><i class="av">${ini(d.mgr)}</i></div><div class="kn ${d.days>3?'late':''}">${esc(d.next)}</div></div>`).join('')||'<div class="kempty">пусто</div>'}</div>`}).join('')}</div>`};
function dropDeal(e,k){const id=e.dataTransfer.getData('t');const d=DL(id);if(!d)return;const iFrom=STG.findIndex(s=>s[0]===d.stg),iTo=STG.findIndex(s=>s[0]===k);
 if(iTo>=STG.findIndex(s=>s[0]==='ship')&&d.stg!=='paid'){toast('Нельзя отгрузить без оплаты — сначала этап «Оплата». Так система бережёт склад от отгрузок в долг.');return}
 d.stg=k;FEED.unshift([NOW,'RS','перевёл сделку на «'+STN(k)+'»',d.id+' · '+CL(d.cl).n,'deal']);render();toast(`${d.id} → <b>${STN(k)}</b>. Клиенту ушло сообщение в WhatsApp, ответственному — задача по этапу.`)}
function newDeal(){openM('Новая сделка','Из звонка, WhatsApp или вручную',`<div class="form">
 <label>Клиент<select id="ndc">${CLIENTS.map(c=>`<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select></label>
 <label>Что хочет<input id="ndt" value="Поломоечная машина для паркинга"></label>
 <label>Сумма, ₸<input id="nds" value="5400000"></label>
 <label>Ответственный<select id="ndm">${['DN','MR','AI','KM','RS'].map(m=>`<option value="${m}">${esc(SF(m).n)}</option>`).join('')}</select></label>
 <label>Источник<select><option>Звонок</option><option>WhatsApp</option><option>Сайт</option><option>Instagram</option><option>Госзакупки</option></select></label></div>
 <div class="btns l"><button class="bt p" onclick="saveDeal()">Создать</button></div>`)}
function saveDeal(){const id='D-'+(133+DEALS.length-10);DEALS.unshift({id,cl:document.getElementById('ndc').value,biz,t:document.getElementById('ndt').value,sum:+document.getElementById('nds').value||0,stg:'lead',mgr:document.getElementById('ndm').value,src:'Вручную',items:[],next:'Квалифицировать',days:0,prob:10});closeM();curD=id;go('deal');toast(`Сделка ${id} создана. Ответственному ушла задача «связаться в течение 15 минут».`)}
function openDeal(id){curD=id;go('deal')}

/* ===== Карточка сделки ===== */
SC.deal=()=>{const d=DL(curD),c=CL(d.cl);const si=STG.findIndex(s=>s[0]===d.stg);
 const msgs=INBOX.filter(m=>m.deal===d.id);const tk=TASKS.filter(t=>t.deal===d.id);const res=SERIALS.filter(s=>s.deal===d.id);
 return crumbs(['Воронка',"go('funnel')"],[d.id])+`<div class="hd"><div><h2>${esc(d.t)}</h2><p><a class="lnk" onclick="openClient('${c.id}')">${esc(c.n)}</a> · ${esc(c.type)} · ответственный ${esc(SF(d.mgr).n)} · источник ${esc(d.src)}</p></div><div class="btns"><button class="bt" onclick="go('kp')">Сформировать КП</button><button class="bt" onclick="mkBill()">Выставить счёт</button><button class="bt p" onclick="shipDeal()">Отгрузить</button></div></div>
 <div class="chainS">${STG.map(([k,n],i)=>`<a class="${i<si?'ok':i===si?'cur':''}" onclick="setStage('${k}')">${n}</a>`).join('')}</div>
 <div class="g21"><div>
  <div class="pan"><h3>Товары в сделке</h3><p>Наличие — живое со склада. Техника резервируется по серийному номеру, чтобы другой менеджер не продал ту же машину.</p>
   <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">Кол-во</th><th class="r">Свободно</th><th class="r">Цена</th><th class="r">Сумма</th><th></th></tr></thead><tbody>
   ${d.items.map(([p,q])=>{const P=PR(p),f=freeQ(p);const r=res.filter(s=>s.p===p).length;return `<tr onclick="openProd('${p}')"><td><b>${esc(P.n)}</b><span class="sub">${P.id} · ${esc(P.spec)}</span></td><td class="r">${q}</td><td class="r ${f<q-r?'bad':'ok'}">${f}${r?` <span class="tag w">+${r} ваш резерв</span>`:''}</td><td class="r">${tg(P.price)}</td><td class="r">${tg(P.price*q)}</td><td>${P.kind==='m'&&r<q?`<button class="bt sm" onclick="event.stopPropagation();reserve('${d.id}','${p}')">Резерв</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="6" class="mini">Услуга без товаров со склада</td></tr>'}
   <tr class="total"><td colspan="4">Итого по сделке</td><td class="r">${tg(d.sum)}</td><td></td></tr></tbody></table></div>
   ${res.length?`<div class="sns">${res.map(s=>`<a onclick="openSN('${s.sn}')"><code>${s.sn}</code> ${WN(s.wh)} · резерв до 07.11</a>`).join('')}</div>`:''}</div>
  <div class="pan"><h3>История общения</h3><p>WhatsApp и звонки с записью — всё в одной ленте сделки.</p>
   <div class="tl2">${msgs.map(m=>m.ch==='Звонок'?`<div class="ti call"><span>${m.t}</span><div><b>Звонок · ${m.dir} · ${m.dur}</b>${m.rec?`<button class="play" onclick="playRec('${m.id}')">▶ запись</button>`:''}<p>${esc(m.sum)}</p></div></div>`:m.msgs.map(x=>`<div class="ti wa"><span>${x[2]}</span><div><b>WhatsApp · ${esc(m.who.split(' · ')[0])}</b><p>${esc(x[1])}</p></div></div>`).join('')).join('')}
   <div class="ti sys"><span>03.11</span><div><b>Система</b><p>Сделка создана, источник — ${esc(d.src.toLowerCase())}. Задача менеджеру — связаться за 15 минут.</p></div></div></div>
   <div class="wsend"><input id="wtx" placeholder="Сообщение клиенту в WhatsApp…" value="${esc(c.lpr.split(',')[0])}, добрый день! Отправляю КП и спецификацию."><button class="bt g" onclick="sendWA('${d.id}')">Отправить в WhatsApp</button><button class="bt" onclick="callC('${c.ph}')">Позвонить</button></div></div>
 </div><div>
  <div class="pan"><h3>Сделка</h3>
   <div class="kv"><span>Сумма</span><b>${tg(d.sum)}</b></div><div class="kv"><span>Вероятность</span><b>${d.prob}%</b></div><div class="kv"><span>Маржа</span><b>${tg(d.items.reduce((a,[p,q])=>a+(PR(p).price-PR(p).cost)*q,0))}</b></div><div class="kv"><span>Следующий шаг</span><b class="wrap">${esc(d.next)}</b></div><div class="kv"><span>Контакт</span><b class="wrap">${esc(c.lpr)}<br>${c.ph}</b></div></div>
  <div class="pan"><h3>Задачи по сделке</h3>${tk.map(t=>`<a class="trow" onclick="openTask('${t.id}')"><i class="dt ${t.st==='done'?'g':PRN[t.pr][1]}"></i><b>${esc(t.t)}</b><span>${fn(t.who)} · до ${t.due}</span></a>`).join('')||'<p class="mini">Задач нет.</p>'}<button class="bt sm" onclick="newTask('${d.id}')">+ Задача</button></div>
  <div class="pan"><h3>Документы</h3>${['КП № 118-2 · PDF','Спецификация · PDF',d.stg==='bill'||d.stg==='paid'?'Счёт № 412 · PDF':null].filter(Boolean).map(x=>`<div class="doc2"><code>PDF</code>${x}</div>`).join('')}</div>
 </div></div>`};
function setStage(k){const d=DL(curD);if(k==='ship'&&d.stg!=='paid'){toast('Отгрузка открывается только после оплаты.');return}d.stg=k;render();toast(`Этап: <b>${STN(k)}</b>. Клиенту — сообщение в WhatsApp, ответственному — задача.`)}
function reserve(id,p){const s=SERIALS.find(x=>x.p===p&&x.st==='free');if(!s){toast('Свободных машин нет — система предложит заказ поставщику.');return}s.st='res';s.deal=id;render();toast(`Зарезервирована <b>${s.sn}</b> (${WN(s.wh)}) до 07.11. Другие менеджеры видят её как занятую.`)}
function mkBill(){const d=DL(curD);d.stg='bill';render();toast(`Счёт № 413 на ${tg(d.sum)} сформирован по шаблону и ушёл клиенту в WhatsApp. Бухгалтер видит его в списке «ждём оплату».`)}
function shipDeal(){const d=DL(curD);if(d.stg!=='paid'&&d.stg!=='ship'){toast('Сначала оплата. Кнопка станет активной, когда бухгалтер отметит поступление или придёт выписка банка.');return}go('ship')}
function sendWA(id){const v=document.getElementById('wtx').value;const m=INBOX.find(x=>x.deal===id&&x.ch==='WhatsApp');if(m)m.msgs.push(['out',v,NOW]);else INBOX.unshift({id:'m'+Date.now(),ch:'WhatsApp',who:CL(DL(id).cl).lpr,deal:id,t:NOW,un:0,msgs:[['out',v,NOW]]});render();toast('Сообщение ушло с общего WhatsApp-номера компании и сохранилось в сделке.')}
function callC(ph){toast(`Звоним ${ph} через IP-телефонию… Разговор запишется и прикрепится к сделке.`)}
function playRec(id){const m=INBOX.find(x=>x.id===id);openM('Запись разговора',esc(m.who)+' · '+m.dur,`<div class="player"><button class="bt p">▶</button><div class="wave">${Array.from({length:60},(_,i)=>`<i style="height:${6+Math.abs(Math.sin(i*1.7))*26}px"></i>`).join('')}</div><span>0:00 / ${m.dur}</span></div><div class="pan"><h3>Кратко о разговоре</h3><p>${esc(m.sum)}</p></div><p class="mini">Записи хранятся в облаке АТС, в CRM — ссылка и плеер. Руководитель слушает любой звонок из карточки сделки.</p>`)}

/* ===== Клиенты ===== */
let curC='C1';
SC.clients=()=>`<div class="hd"><div><h2>Клиенты и объекты</h2><p>ТРЦ, аэропорты, клининговые компании. По каждому — какие машины у него стоят, когда ТО и что докупить.</p></div><div class="btns"><button class="bt" onclick="xlsClients()">Excel</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Тип</th><th>Город</th><th>Площадь</th><th class="r">Машин у клиента</th><th class="r">Сделки</th><th>ЛПР</th></tr></thead><tbody>
 ${CLIENTS.map(c=>`<tr onclick="openClient('${c.id}')"><td><b>${esc(c.n)}</b></td><td>${esc(c.type)}</td><td>${c.city}</td><td>${c.area}</td><td class="r">${c.owned.length}</td><td class="r">${DEALS.filter(d=>d.cl===c.id).length}</td><td class="mini">${esc(c.lpr)}</td></tr>`).join('')}</tbody></table></div>`;
function openClient(id){const c=CL(id);openM(esc(c.n),esc(c.type)+' · '+c.city+' · '+c.area,`<div class="kv"><span>ЛПР</span><b>${esc(c.lpr)}</b></div><div class="kv"><span>Телефон</span><b>${c.ph}</b></div>
 <div class="pan" style="margin-top:12px"><h3>Техника у клиента</h3>${c.owned.map(s=>`<div class="kv"><span><code>${s}</code></span><b>ТО через ${(s.length%5)+1} нед.</b></div>`).join('')||'<p class="mini">Пока не покупал технику.</p>'}</div>
 <div class="pan"><h3>Сделки</h3>${DEALS.filter(d=>d.cl===id).map(d=>`<a class="trow" onclick="closeM();openDeal('${d.id}')"><i class="dt i"></i><b>${esc(d.t)}</b><span>${STN(d.stg)} · ${tg(d.sum)}</span></a>`).join('')}</div>`)}

/* ===== WhatsApp и звонки ===== */
SC.inbox=()=>{const m=INBOX.find(x=>x.id===curM)||INBOX[0];
 return `<div class="hd"><div><h2>WhatsApp и звонки</h2><p>Один общий номер WhatsApp на всю команду и IP-телефония. Входящий с нового номера — сразу лид в воронке; пропущенный — задача «перезвонить».</p></div><div class="btns"><span class="live"><i></i>WhatsApp подключён</span><span class="live"><i></i>АТС · 4 линии</span></div></div>
 <div class="inbox"><div class="ilist">${INBOX.map(x=>`<a class="${x.id===m.id?'on':''}" onclick="curM='${x.id}';render()"><span class="ch ${x.ch==='WhatsApp'?'wa':'tel'}">${x.ch==='WhatsApp'?'WA':'ТЛ'}</span><div><b>${esc(x.who)}</b><small>${x.ch==='WhatsApp'?esc(x.msgs[x.msgs.length-1][1]):esc(x.dir+' · '+x.dur)}</small></div><time>${x.t}${x.un?`<em>${x.un}</em>`:''}</time></a>`).join('')}</div>
 <div class="ichat"><div class="ich"><div><b>${esc(m.who)}</b><small>${m.deal?`сделка <a class="lnk" onclick="openDeal('${m.deal}')">${m.deal}</a>`:'без сделки'}</small></div>${m.deal?'':`<button class="bt sm p" onclick="leadFrom('${m.id}')">Создать сделку</button>`}</div>
  ${m.ch==='WhatsApp'?`<div class="bubbles">${m.msgs.map(x=>`<div class="bb ${x[0]}"><p>${esc(x[1])}</p><time>${x[2]}</time></div>`).join('')}</div>
  <div class="tpls">${['Счёт во вложении','Пришлите реквизиты','Когда удобно демо-показ?','Машина в наличии, резерв на 3 дня'].map(t=>`<a onclick="document.getElementById('itx').value='${t}'">${t}</a>`).join('')}</div>
  <div class="wsend"><input id="itx" placeholder="Ответ…"><button class="bt g" onclick="replyWA('${m.id}')">Отправить</button></div>`
  :`<div class="callc"><b>${m.dir==='пропущенный'?'Пропущенный звонок':'Звонок · '+m.dir+' · '+m.dur}</b><p>${esc(m.sum)}</p>${m.rec?`<button class="bt" onclick="playRec('${m.id}')">▶ Прослушать запись</button>`:`<button class="bt p" onclick="callC('+7 701 909 11 55')">Перезвонить</button>`}</div>`}
 </div></div>`};
function replyWA(id){const m=INBOX.find(x=>x.id===id);const v=document.getElementById('itx').value;if(!v)return;m.msgs.push(['out',v,NOW]);m.un=0;render()}
function leadFrom(id){const m=INBOX.find(x=>x.id===id);const nid='D-140';DEALS.unshift({id:nid,cl:'C6',biz,t:'Новый лид со звонка',sum:0,stg:'lead',mgr:'AI',src:'Звонок',items:[],next:'Квалифицировать',days:0,prob:10});m.deal=nid;render();toast(`Создана сделка ${nid}, звонок и запись привязаны к ней.`)}

/* ===== КП ===== */
SC.kp=()=>{const d=DL(curD),c=CL(d.cl);
 return crumbs(['Воронка',"go('funnel')"],[d.id,"openDeal('"+d.id+"')"],['КП'])+`<div class="hd"><div><h2>Коммерческое предложение</h2><p>Собирается из карточки сделки: фото и характеристики машин, цена со склада, условия. Отправка в WhatsApp одной кнопкой, клиент открывает PDF — вы видите, что открыл.</p></div><div class="btns"><button class="bt" onclick="toast('PDF скачан.')">PDF</button><button class="bt g" onclick="toast('КП ушло в WhatsApp ${esc(c.lpr.split(',')[0])}. Когда клиент откроет — придёт уведомление.')">Отправить в WhatsApp</button></div></div>
 <div class="kpdoc"><div class="kph"><b>ГЛЯНЕЦ</b><span>Профессиональная уборочная техника · Алматы · Астана</span></div>
  <h3>Коммерческое предложение № 118-2 для ${esc(c.n)}</h3><p class="mini">от ${TODAY} · действительно 14 дней · площадь объекта ${c.area}</p>
  ${d.items.map(([p,q])=>{const P=PR(p);return `<div class="kpi"><div class="kpimg">${machineSVG(P.kind)}</div><div><b>${esc(P.n)}</b><p>${esc(P.spec)}</p><span>${q} шт × ${tg(P.price)} = <b>${tg(P.price*q)}</b></span></div></div>`}).join('')}
  <div class="kv"><span>Итого с НДС</span><b>${tg(d.sum)}</b></div><div class="kv"><span>Доставка и пусконаладка</span><b>бесплатно</b></div><div class="kv"><span>Гарантия</span><b>24 месяца</b></div><div class="kv"><span>Обучение операторов</span><b>на объекте</b></div></div>`};
const machineSVG=k=>k==='m'?`<svg viewBox="0 0 80 60"><rect x="10" y="14" width="46" height="28" rx="6" fill="var(--brand)"/><rect x="40" y="6" width="14" height="10" rx="2" fill="var(--rail)"/><circle cx="20" cy="46" r="7" fill="var(--rail)"/><circle cx="50" cy="46" r="7" fill="var(--rail)"/><rect x="56" y="38" width="16" height="6" rx="2" fill="var(--acc)"/></svg>`:`<svg viewBox="0 0 80 60"><circle cx="40" cy="30" r="20" fill="none" stroke="var(--brand)" stroke-width="6"/><circle cx="40" cy="30" r="6" fill="var(--acc)"/></svg>`;

/* ===== Склад: остатки ===== */
let stCat='all',stQ='';
const KIND={m:'Техника',p:'Запчасти и расходники',c:'Химия'};
SC.stock=()=>{const P=PRODUCTS.filter(p=>(stCat==='all'||p.kind===stCat)&&(!stQ||(p.n+p.id).toLowerCase().includes(stQ)));
 const val=PRODUCTS.reduce((a,p)=>a+qty(p.id,whF)*p.cost,0);
 return `<div class="hd"><div><h2>Остатки</h2><p>Четыре склада, ячейки, серийные номера. Техника учитывается поштучно по серийнику — видно, какая машина свободна, какая в резерве под сделку, какая стоит в демо-зале или в ремонте.</p></div><div class="btns"><button class="bt" onclick="go('receive')">Приход</button><button class="bt" onclick="go('moves')">Перемещение</button><button class="bt" onclick="go('inv')">Инвентаризация</button><button class="bt p" onclick="xlsStock()">Excel</button></div></div>
 <div class="whtabs"><a class="${whF==='all'?'on':''}" onclick="whF='all';render()"><b>Все склады</b><span>${tg(PRODUCTS.reduce((a,p)=>a+qty(p.id)*p.cost,0))}</span></a>${WH.map(w=>`<a class="${whF===w.id?'on':''}" onclick="whF='${w.id}';render()"><b>${w.n}</b><span>${tg(PRODUCTS.reduce((a,p)=>a+qty(p.id,w.id)*p.cost,0))}</span></a>`).join('')}</div>
 <div class="fbar"><div class="seg">${[['all','Всё'],['m','Техника'],['p','Запчасти'],['c','Химия']].map(([k,n])=>`<a class="${stCat===k?'on':''}" onclick="stCat='${k}';render()">${n}</a>`).join('')}</div><input class="sel" placeholder="Поиск: артикул, название" value="${esc(stQ)}" onchange="stQ=this.value.toLowerCase();render()"><span class="mini">${P.length} позиций · ${tg(val)} в закупочных ценах</span></div>
 <div class="tw"><table class="t"><thead><tr><th>Артикул</th><th>Товар</th><th>Ячейка</th><th class="r">Остаток</th><th class="r">Свободно</th><th class="r">Резерв</th><th class="r">Мин.</th><th class="r">Сумма</th><th></th></tr></thead><tbody>
 ${P.map(p=>{const q=qty(p.id,whF),f=freeQ(p.id),r=p.kind==='m'?SERIALS.filter(s=>s.p===p.id&&s.st==='res').length:0;const low=f<p.min;return `<tr onclick="openProd('${p.id}')"><td class="mono">${p.id}</td><td><b>${esc(p.n)}</b><span class="sub">${esc(p.cat)}${p.kind==='m'?' · учёт по серийным номерам':''}</span></td><td class="mono">${p.cell}</td><td class="r"><b>${q}</b></td><td class="r ${low?'bad':''}">${f}</td><td class="r">${r||'—'}</td><td class="r mini">${p.min}</td><td class="r">${tg(q*p.cost)}</td><td>${low?tag('заказать','r'):tag('норма','g')}</td></tr>`}).join('')}</tbody></table></div>
 ${said('«Склад максимально крутой: сколько, где, что в резерве, что заказать.»','Остаток живой: приход, отгрузка, перемещение и инвентаризация меняют его сразу. Ниже минимума — красным, с кнопкой заказа.')}`};

/* ===== Карточка товара → серийный номер ===== */
function openProd(id){curP=id;go('product')}
SC.product=()=>{const p=PR(curP);const sn=SERIALS.filter(s=>s.p===p.id);
 const hist=[['04.11 09:52','Приход','ПР-0087','+3','Ерлан'],['03.11 16:10','Резерв','D-118','−1 своб.','Дана'],['01.11 11:00','Отгрузка','ОТ-0412 · Magnum','−1','Ерлан'],['28.10 14:30','Перемещение','ПМ-0031 Алматы → Астана','±1','Бекзат'],['15.10 10:00','Инвентаризация','ИНВ-0009','0 расх.','Ерлан']];
 return crumbs(['Остатки',"go('stock')"],[p.id])+`<div class="hd"><div><h2>${esc(p.n)}</h2><p>${esc(p.cat)} · ${esc(p.spec)} · ячейка ${p.cell}</p></div><div class="btns"><button class="bt" onclick="printLabel('${p.id}')">Печать этикеток</button><button class="bt" onclick="orderSup('${p.id}')">Заказать поставщику</button></div></div>
 <div class="pcard"><div class="pimg">${machineSVG(p.kind)}</div><div class="pnums">
  <div><small>Цена продажи</small><b>${tg(p.price)}</b></div><div><small>Закупка</small><b>${tg(p.cost)}</b></div><div><small>Наценка</small><b>${pct(p.price-p.cost,p.cost)}%</b></div>
  ${WH.map(w=>`<div><small>${w.n}</small><b>${qty(p.id,w.id)}</b></div>`).join('')}<div><small>Мин. остаток</small><b>${p.min}</b></div></div></div>
 <div class="g21"><div>
 ${p.kind==='m'?`<div class="pan"><h3>Серийные номера</h3><p>Нажмите на номер — откроется вся жизнь машины: приход, демо, резерв, продажа, ТО.</p>
  <div class="tw"><table class="t"><thead><tr><th>Серийный №</th><th>Склад</th><th>Статус</th><th>Сделка</th><th>Пришла</th></tr></thead><tbody>
  ${sn.map(s=>`<tr onclick="openSN('${s.sn}')"><td class="mono">${s.sn}</td><td>${WN(s.wh)}</td><td>${tag(SST[s.st][0],SST[s.st][1])}</td><td>${s.deal?`<a class="lnk" onclick="event.stopPropagation();openDeal('${s.deal}')">${s.deal}</a>`:'—'}</td><td class="mono">${s.in}</td></tr>`).join('')||'<tr><td colspan="5" class="mini">Нет на складе</td></tr>'}</tbody></table></div></div>`:
 `<div class="pan"><h3>Совместимость</h3><p>Подходит к машинам: ${esc(p.spec)}. Менеджер видит это при продаже техники и сразу предлагает комплект расходников.</p></div>`}
 </div><div><div class="pan"><h3>Движение</h3><p>Каждое изменение остатка — с документом и человеком.</p>${hist.map(h=>`<div class="mv"><time>${h[0]}</time><b>${h[1]}</b><span>${h[2]}</span><em>${h[3]}</em><small>${h[4]}</small></div>`).join('')}</div></div></div>`};
function openSN(sn){const s=SERIALS.find(x=>x.sn===sn)||{sn,p:'SC-55',wh:'W1',st:'sold',in:'—'};const p=PR(s.p);
 openM('<code>'+esc(sn)+'</code>',esc(p.n)+' · '+WN(s.wh)+' · '+SST[s.st][0],`<div class="snlife">
 ${[['Приход от поставщика','ПР-0071 · '+s.in+' · Ерлан','g'],['Предпродажная проверка','Тимур · 20 мин · ок','g'],s.st==='demo'?['Демо-зал','показана 14 клиентам · моточасы 86','i']:null,s.st==='res'?['Резерв под сделку '+s.deal,esc(CL(DL(s.deal).cl).n)+' · до 07.11','w']:null,s.st==='svc'?['В ремонте','замена щётки · задача T-305','r']:null,['Дальше','отгрузка → пусконаладка → ТО каждые 250 моточасов','']].filter(Boolean).map(x=>`<div class="sl ${x[2]}"><i></i><div><b>${x[0]}</b><span>${x[1]}</span></div></div>`).join('')}</div>
 <div class="qr">${qrSVG(sn)}<div><b>Этикетка с QR</b><p class="mini">Кладовщик сканирует телефоном при приходе, отгрузке и инвентаризации — без ручного ввода серийника.</p></div></div>`)}
const qrSVG=t=>{let h=0;for(const c of t)h=(h*31+c.charCodeAt(0))>>>0;let r='';for(let y=0;y<9;y++)for(let x=0;x<9;x++){h=(h*1103515245+12345)>>>0;const fx=(x<3&&y<3)||(x>5&&y<3)||(x<3&&y>5);if(fx?!(x%3===1&&y%3===1):h%2)r+=`<rect x="${x*10}" y="${y*10}" width="10" height="10"/>`}return `<svg viewBox="0 0 90 90" class="qrs">${r}</svg>`};
function printLabel(id){toast(`На печать ушло ${qty(id)} этикеток ${id} с QR-кодом и ячейкой.`)}
function orderSup(id){const p=PR(id);toast(`Заявка поставщику: ${esc(p.n)} × ${Math.max(p.min*2-freeQ(id),1)}. Ожидаемый приход — через 45 дней, менеджеры видят «в пути».`)}

/* ===== Приход ===== */
let RCV={st:'draft',sup:'AquaLine Europe GmbH',doc:'ПР-0088',wh:'W1',lines:[{p:'SC-55',q:2,sn:[]},{p:'SC-43',q:3,sn:[]},{p:'PD-43',q:50,sn:[]},{p:'CH-DET',q:40,sn:[]}]};
SC.receive=()=>{const all=RCV.lines.every(l=>PR(l.p).kind!=='m'||l.sn.length>=l.q);
 return crumbs(['Склад',"go('stock')"],['Приход '+RCV.doc])+`<div class="hd"><div><h2>Приход ${RCV.doc} · ${esc(RCV.sup)}</h2><p>Три шага: 1 — сверить поставку с заказом, 2 — отсканировать серийные номера техники, 3 — провести. После проведения остаток, ячейки и себестоимость обновятся сами.</p></div><div class="btns">${RCV.st==='done'?tag('проведён','g'):`<button class="bt" onclick="scanAll()">Сканировать всё (демо)</button><button class="bt p" ${all?'':'disabled'} onclick="postRcv()">Провести приход</button>`}</div></div>
 <div class="steps3"><div class="ok"><b>1</b>Сверено с заказом ЗП-0044</div><div class="${all?'ok':'cur'}"><b>2</b>Серийные номера ${RCV.lines.filter(l=>PR(l.p).kind==='m').reduce((a,l)=>a+l.sn.length,0)}/${RCV.lines.filter(l=>PR(l.p).kind==='m').reduce((a,l)=>a+l.q,0)}</div><div class="${RCV.st==='done'?'ok':''}"><b>3</b>Проведение</div></div>
 <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">Кол-во</th><th>Ячейка</th><th>Серийные номера</th><th class="r">Закупка</th></tr></thead><tbody>
 ${RCV.lines.map((l,i)=>{const P=PR(l.p);return `<tr><td><b>${esc(P.n)}</b><span class="sub">${P.id}</span></td><td class="r">${l.q}</td><td class="mono">${P.cell}</td><td>${P.kind==='m'?(l.sn.map(s=>`<code class="snc">${s}</code>`).join(' ')+(l.sn.length<l.q&&RCV.st!=='done'?` <button class="bt sm" onclick="scanOne(${i})">Сканировать</button>`:'')):'<span class="mini">поштучно не нужно</span>'}</td><td class="r">${tg(P.cost*l.q)}</td></tr>`}).join('')}
 <tr class="total"><td colspan="4">Итого приход</td><td class="r">${tg(RCV.lines.reduce((a,l)=>a+PR(l.p).cost*l.q,0))}</td></tr></tbody></table></div>`};
function scanOne(i){const l=RCV.lines[i];const P=PR(l.p);l.sn.push(P.id.replace('-','').slice(0,4)+'-24-'+(1200+Math.floor(Math.random()*800)));render()}
function scanAll(){RCV.lines.forEach((l,i)=>{while(PR(l.p).kind==='m'&&l.sn.length<l.q)scanOne(i)});render()}
function postRcv(){RCV.lines.forEach(l=>{const P=PR(l.p);if(P.kind==='m')l.sn.forEach(s=>SERIALS.push({sn:s,p:l.p,wh:RCV.wh,st:'free',in:TODAY.slice(0,5)}));else{QTY[l.p]=QTY[l.p]||{};QTY[l.p][RCV.wh]=(QTY[l.p][RCV.wh]||0)+l.q}});RCV.st='done';FEED.unshift([NOW,'ER','провёл приход',RCV.doc+' · '+RCV.sup,'wh']);render();toast('Приход проведён. Остатки обновились, менеджеры видят машины свободными, этикетки ушли на печать.')}

/* ===== Резерв и отгрузки ===== */
let SHIPS=[{id:'ОТ-0413',deal:'D-126',st:'pick',drv:'DM',date:'05.11'},{id:'ОТ-0414',deal:'D-121',st:'wait',drv:'DM',date:'07.11'},{id:'ОТ-0412',deal:'D-132',st:'done',drv:'DM',date:'01.11'}];
const SHS={wait:['ждёт оплату','w'],pick:['сборка','i'],road:['в пути','a'],done:['доставлено','g']};
SC.ship=()=>`<div class="hd"><div><h2>Резерв и отгрузки</h2><p>Отгрузка создаётся из оплаченной сделки: лист сборки по ячейкам, накладная, водитель, фото подписи клиента. После доставки сервис получает задачу на пусконаладку.</p></div><div class="btns"><button class="bt" onclick="xlsShips()">Excel</button></div></div>
 <div class="g2"><div class="pan"><h3>Отгрузки</h3><div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Клиент</th><th>Дата</th><th>Статус</th><th></th></tr></thead><tbody>
 ${SHIPS.map(s=>{const d=DL(s.deal);return `<tr onclick="openShip('${s.id}')"><td class="mono">${s.id}</td><td>${esc(CL(d.cl).n)}<span class="sub">${esc(d.t)}</span></td><td class="mono">${s.date}</td><td>${tag(SHS[s.st][0],SHS[s.st][1])}</td><td>${s.st==='pick'?`<button class="bt sm p" onclick="event.stopPropagation();shipGo('${s.id}')">Отгрузить</button>`:''}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Резервы техники</h3><p>Резерв держится 3 дня, потом снимается сам — с уведомлением менеджеру.</p>${SERIALS.filter(s=>s.st==='res').map(s=>`<a class="trow" onclick="openSN('${s.sn}')"><i class="dt w"></i><b><code>${s.sn}</code> ${esc(PR(s.p).n.split(' ').slice(-1)[0])}</b><span>${s.deal} · ${esc(CL(DL(s.deal).cl).n)} · до 07.11</span></a>`).join('')}</div></div>`;
function openShip(id){const s=SHIPS.find(x=>x.id===id),d=DL(s.deal);openM('Отгрузка '+id,esc(CL(d.cl).n)+' · водитель '+esc(SF(s.drv).n),`<div class="pan"><h3>Лист сборки</h3>${d.items.map(([p,q])=>`<div class="kv"><span><code>${PR(p).cell}</code> ${esc(PR(p).n)}</span><b>${q} шт</b></div>`).join('')}</div>
 <div class="chk">${['Собрано по ячейкам','Серийные номера отсканированы','Накладная распечатана','Подпись клиента и фото'].map((x,i)=>`<div class="ci"><span class="bx ${i<(s.st==='done'?4:s.st==='pick'?1:0)?'on':''}" onclick="this.classList.toggle('on')">✓</span><span class="nm">${x}</span></div>`).join('')}</div>`)}
function shipGo(id){const s=SHIPS.find(x=>x.id===id);s.st='road';FEED.unshift([NOW,'DM','выехал с отгрузкой',id,'wh']);render();toast(`${id} в пути. Клиенту ушло сообщение в WhatsApp, остаток списан, Нурлану — задача на пусконаладку.`)}

/* ===== Перемещения ===== */
let MOVES=[{id:'ПМ-0032',from:'W1',to:'W3',p:'SC-43',sn:'SC43-24-1105',st:'new',who:'ER'},{id:'ПМ-0031',from:'W1',to:'W2',p:'SC-55',sn:'SC55-24-0419',st:'done',who:'BS'},{id:'ПМ-0030',from:'W1',to:'W4',p:'PD-43',q:10,st:'done',who:'ER'}];
SC.moves=()=>`<div class="hd"><div><h2>Перемещения</h2><p>Между складами, в демо-зал, в сервис. Отправил один кладовщик — принял другой; пока в пути, товар виден как «в пути» и не продаётся дважды.</p></div><div class="btns"><button class="bt p" onclick="newMove()">+ Перемещение</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Откуда → куда</th><th>Что</th><th>Кто</th><th>Статус</th><th></th></tr></thead><tbody>
 ${MOVES.map(m=>`<tr><td class="mono">${m.id}</td><td>${WN(m.from)} → <b>${WN(m.to)}</b></td><td>${esc(PR(m.p).n)}<span class="sub">${m.sn||m.q+' шт'}</span></td><td>${fn(m.who)}</td><td>${tag(m.st==='done'?'принято':m.st==='road'?'в пути':'создано',m.st==='done'?'g':'w')}</td><td>${m.st==='new'?`<button class="bt sm" onclick="mvStep('${m.id}','road')">Отправить</button>`:m.st==='road'?`<button class="bt sm p" onclick="mvStep('${m.id}','done')">Принять</button>`:''}</td></tr>`).join('')}</tbody></table></div>`;
function mvStep(id,st){const m=MOVES.find(x=>x.id===id);m.st=st;if(st==='done'&&m.sn){const s=SERIALS.find(x=>x.sn===m.sn);if(s){s.wh=m.to;if(m.to==='W3')s.st='demo'}}render();toast(st==='road'?'Отправлено. Принимающий склад получил задачу.':'Принято. Машина числится на новом складе.')}
function newMove(){openM('Новое перемещение','',`<div class="form"><label>Откуда<select>${WH.map(w=>`<option>${w.n}</option>`).join('')}</select></label><label>Куда<select>${WH.map((w,i)=>`<option ${i===1?'selected':''}>${w.n}</option>`).join('')}</select></label><label>Товар или серийный №<input value="MC30-24-3302"></label></div><div class="btns l"><button class="bt p" onclick="MOVES.unshift({id:'ПМ-0033',from:'W1',to:'W2',p:'MINI-30',sn:'MC30-24-3302',st:'new',who:'ER'});closeM();render()">Создать</button></div>`)}

/* ===== Инвентаризация ===== st: plan → count → diff → posted */
let INV={id:'ИНВ-0010',wh:'W1',zone:'Все ячейки',st:'plan',who:['ER','DM'],rows:[]};
const INVHIST=[['ИНВ-0009','15.10','Склад Алматы','ячейки B',0,0],['ИНВ-0008','01.10','Склад Астана','полная',-2,-19000],['ИНВ-0007','15.09','Склад Алматы','полная',-1,-68000]];
function invBuild(){INV.rows=PRODUCTS.map(p=>{const b=qty(p.id,INV.wh);return {p:p.id,book:b,fact:null}})}
SC.inv=()=>{const st=INV.st;const S=['plan','count','diff','posted'];const si=S.indexOf(st);
 const head=`<div class="hd"><div><h2>Инвентаризация ${INV.id}</h2><p>Как это работает: <b>1</b> — запланировать (склад, зона, кто считает), склад «замораживается» на время пересчёта; <b>2</b> — кладовщики сканируют телефоном ячейки и серийники; <b>3</b> — система сама показывает расхождения; <b>4</b> — руководитель утверждает и проводит акт, остатки «садятся» на факт; <b>5</b> — выгрузка акта в Excel.</p></div><div class="btns"><button class="bt" onclick="xlsInv()">Акт в Excel</button></div></div>
 <div class="steps3 s4">${[['Планирование','склад, зона, люди'],['Подсчёт','сканирование'],['Расхождения','сверка с учётом'],['Проведено','остатки = факт']].map((x,i)=>`<div class="${i<si?'ok':i===si?'cur':''}"><b>${i+1}</b>${x[0]}<small>${x[1]}</small></div>`).join('')}</div>`;
 if(st==='plan')return head+`<div class="g21"><div class="pan"><h3>Новая инвентаризация</h3><p>Выберите что и кем считаем.</p><div class="form">
  <label>Склад<select onchange="INV.wh=this.value">${WH.map(w=>`<option value="${w.id}" ${INV.wh===w.id?'selected':''}>${w.n}</option>`).join('')}</select></label>
  <label>Зона<select onchange="INV.zone=this.value"><option>Все ячейки</option><option>Ячейки A — техника</option><option>Ячейки B — запчасти</option><option>Ячейки D — химия</option></select></label>
  <label>Тип<select><option>Полная</option><option>Выборочная (циклическая)</option><option>Только серийные номера</option></select></label>
  <label>Считают<select multiple size="3">${STAFF.filter(s=>s.dep==='Склад').map(s=>`<option selected>${esc(s.n)}</option>`).join('')}</select></label>
  <label class="cbx"><input type="checkbox" checked> Заморозить движения по складу на время подсчёта</label>
  <label class="cbx"><input type="checkbox" checked> Слепой подсчёт — кладовщик не видит учётный остаток</label></div>
  <div class="btns l"><button class="bt p" onclick="invStart()">Начать инвентаризацию</button></div></div>
  <div class="pan"><h3>Прошлые инвентаризации</h3><div class="tw"><table class="t sm"><thead><tr><th>№</th><th>Дата</th><th>Склад</th><th class="r">Расх.</th><th class="r">Сумма</th></tr></thead><tbody>${INVHIST.map(h=>`<tr onclick="toast('Акт ${h[0]} открыт: ${h[2]}, ${h[3]}.')"><td class="mono">${h[0]}</td><td class="mono">${h[1]}</td><td>${h[2]}<span class="sub">${h[3]}</span></td><td class="r ${h[4]?'bad':''}">${h[4]}</td><td class="r">${tg(h[5])}</td></tr>`).join('')}</tbody></table></div><p class="mini" style="margin-top:9px">Совет системы: ячейки B (мелкие запчасти) считать раз в 2 недели, технику — раз в месяц, по серийникам.</p></div></div>`;
 if(st==='count'){const done=INV.rows.filter(r=>r.fact!==null).length;
  return head+`<div class="g21"><div class="pan"><h3>Подсчёт · ${WN(INV.wh)} · ${INV.zone}</h3><p>Слепой подсчёт: учётного остатка не видно. Введите факт или «сканируйте» ячейку. Посчитано ${done} из ${INV.rows.length}.</p>${bar(pct(done,INV.rows.length),'g')}
  <div class="tw" style="margin-top:10px"><table class="t"><thead><tr><th>Ячейка</th><th>Товар</th><th class="r">Факт</th><th></th></tr></thead><tbody>
  ${INV.rows.map((r,i)=>{const P=PR(r.p);return `<tr><td class="mono">${P.cell}</td><td><b>${esc(P.n)}</b><span class="sub">${P.id}</span></td><td class="r"><input class="qin" type="number" value="${r.fact===null?'':r.fact}" onchange="INV.rows[${i}].fact=+this.value;render()"></td><td><button class="bt sm" onclick="invScan(${i})">Скан</button></td></tr>`}).join('')}</tbody></table></div>
  <div class="btns l"><button class="bt" onclick="invScanAll()">Досчитать всё (демо)</button><button class="bt p" ${done<INV.rows.length?'disabled':''} onclick="INV.st='diff';render()">Завершить подсчёт</button></div></div>
  <div class="pan phone2"><h3>Так выглядит у кладовщика</h3><div class="ph2"><div class="ph2s"><b>${INV.id}</b><small>${WN(INV.wh)}</small><div class="scanbox"><i></i><span>Наведите на QR ячейки</span></div><div class="kv"><span>Ячейка</span><b>A-02</b></div><div class="kv"><span>SC43-24-1104</span><b>✓</b></div><div class="kv"><span>SC43-24-1105</span><b>✓</b></div><button class="bt p full">Ячейка готова</button></div></div></div></div>`}
 if(st==='diff'){const D=INV.rows.map(r=>({...r,d:r.fact-r.book})).filter(r=>r.d!==0);const sum=D.reduce((a,r)=>a+r.d*PR(r.p).cost,0);
  return head+`<div class="pan"><h3>Расхождения: ${D.length} ${plural(D.length,['позиция','позиции','позиций'])} · ${tg(sum)}</h3><p>Система сравнила факт с учётом. По каждой строке — причина, затем руководитель утверждает акт. Недостача по технике с серийником сразу видна поштучно.</p>
  <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">Учёт</th><th class="r">Факт</th><th class="r">Разница</th><th class="r">Сумма</th><th>Причина</th></tr></thead><tbody>
  ${D.map(r=>{const P=PR(r.p);return `<tr><td><b>${esc(P.n)}</b><span class="sub">${P.cell}</span></td><td class="r">${r.book}</td><td class="r">${r.fact}</td><td class="r ${r.d<0?'bad':'ok'}">${r.d>0?'+':''}${r.d}</td><td class="r">${tg(r.d*P.cost)}</td><td><select class="sel sm"><option>Пересорт</option><option>Списание — брак</option><option>Не проведён расход</option><option>Недостача — на кладовщика</option></select></td></tr>`}).join('')||'<tr><td colspan="6">Расхождений нет</td></tr>'}</tbody></table></div>
  <div class="btns l"><button class="bt" onclick="INV.st='count';render()">Пересчитать</button><button class="bt p" onclick="invPost()">Утвердить и провести акт</button></div></div>`}
 return head+`<div class="pan done"><h3>Акт ${INV.id} проведён · остатки «сели» на факт</h3><p>${TODAY}, ${NOW}. Утвердил ${esc(ROLES[role].n)}. Склад разморожен. Движения по остаткам записаны с документом ${INV.id} — в карточке каждого товара видно, откуда изменение.</p>
  <div class="btns l"><button class="bt p" onclick="xlsInv()">Скачать акт в Excel</button><button class="bt" onclick="toast('Акт ИНВ-0010 отправлен на печать, форма ИНВ-3.')">Печать акта</button><button class="bt" onclick="INV={id:'ИНВ-0011',wh:'W1',zone:'Все ячейки',st:'plan',who:[],rows:[]};render()">Новая инвентаризация</button></div></div>`};
function invStart(){invBuild();INV.st='count';FEED.unshift([NOW,'ER','начал инвентаризацию',INV.id+' · '+WN(INV.wh),'wh']);render();toast('Склад заморожен. Кладовщикам ушла задача с листом подсчёта в телефон.')}
function invScan(i){const r=INV.rows[i];r.fact=r.book;render()}
function invScanAll(){INV.rows.forEach((r,i)=>{if(r.fact===null)r.fact=r.book+(r.p==='PD-43'?-3:r.p==='CH-DET'?2:r.p==='SQ-75'?-1:0)});render()}
function invPost(){INV.rows.forEach(r=>{const P=PR(r.p);if(P.kind!=='m'&&r.fact!==null){QTY[r.p]=QTY[r.p]||{};QTY[r.p][INV.wh]=r.fact}});INV.st='posted';FEED.unshift([NOW,'AL','провёл акт инвентаризации',INV.id,'wh']);render()}

/* ===== Excel ===== */
function xls(name,head,rows,title){const h=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>${title?`<h3>${esc(title)}</h3>`:''}<table border="1"><tr>${head.map(x=>`<th style="background:#0e7c86;color:#fff">${esc(x)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td${typeof c==='number'?' style="mso-number-format:\'#,##0\'"':''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></body></html>`;
 try{const b=new Blob(['﻿'+h],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}
 toast(`Файл <b>${esc(name)}.xls</b> скачан — откройте в Excel.`)}
const xlsStock=()=>xls('Остатки_'+TODAY,['Артикул','Товар','Категория','Ячейка',...WH.map(w=>w.n),'Всего','Свободно','Закупка','Сумма'],PRODUCTS.map(p=>[p.id,p.n,p.cat,p.cell,...WH.map(w=>qty(p.id,w.id)),qty(p.id),freeQ(p.id),p.cost,qty(p.id)*p.cost]),'Остатки на '+TODAY);
const xlsDeals=()=>xls('Воронка_'+TODAY,['Сделка','Клиент','Что','Этап','Сумма','Вероятность','Менеджер','Следующий шаг'],bizDeals().map(d=>[d.id,CL(d.cl).n,d.t,STN(d.stg),d.sum,d.prob+'%',SF(d.mgr).n,d.next]));
const xlsClients=()=>xls('Клиенты',['Клиент','Тип','Город','Площадь','ЛПР','Телефон','Машин'],CLIENTS.map(c=>[c.n,c.type,c.city,c.area,c.lpr,c.ph,c.owned.length]));
const xlsInv=()=>{if(!INV.rows.length)invBuild();xls('Акт_'+INV.id,['Ячейка','Артикул','Товар','Учёт','Факт','Разница','Сумма расхождения'],INV.rows.map(r=>{const P=PR(r.p),f=r.fact===null?r.book:r.fact;return [P.cell,P.id,P.n,r.book,f,f-r.book,(f-r.book)*P.cost]}),'Акт инвентаризации '+INV.id+' · '+WN(INV.wh))};
const xlsShips=()=>xls('Отгрузки',['Документ','Клиент','Дата','Статус'],SHIPS.map(s=>[s.id,CL(DL(s.deal).cl).n,s.date,SHS[s.st][0]]));
const xlsDash=()=>xls('Пульт_'+TODAY,['Показатель','Значение'],[['Продажи ноября',BIZ[0].rev],['Открыто в воронке',bizDeals().filter(d=>d.stg!=='paid').reduce((a,d)=>a+d.sum,0)],['Склад в закупочных',PRODUCTS.reduce((a,p)=>a+qty(p.id)*p.cost,0)],['Открытых задач',TASKS.filter(t=>t.st!=='done').length]]);
const REPS=[
 ['Остатки по складам','все склады, ячейки, свободно/резерв, сумма',()=>xlsStock()],
 ['Движение товара за период','приход, расход, перемещения по каждому SKU',()=>xls('Движение_ноябрь',['Дата','Документ','Товар','Склад','Приход','Расход'],[['04.11','ПР-0087','MINI-30','Склад Алматы',3,0],['01.11','ОТ-0412','CH-DET','Склад Алматы',0,20],['28.10','ПМ-0031','SC-55','Склад Астана',1,0]])],
 ['Серийные номера','где каждая машина и в каком статусе',()=>xls('Серийные_номера',['Серийный №','Модель','Склад','Статус','Сделка','Пришла'],SERIALS.map(s=>[s.sn,PR(s.p).n,WN(s.wh),SST[s.st][0],s.deal||'',s.in]))],
 ['Ниже минимума — к заказу','что и сколько заказать поставщику',()=>xls('К_заказу',['Артикул','Товар','Свободно','Минимум','Заказать'],PRODUCTS.filter(p=>freeQ(p.id)<p.min).map(p=>[p.id,p.n,freeQ(p.id),p.min,p.min*2-freeQ(p.id)]))],
 ['Оборачиваемость и неликвид','сколько дней товар лежит',()=>xls('Оборачиваемость',['Товар','Средний срок, дней','Неликвид >180'],PRODUCTS.map((p,i)=>[p.n,30+i*17,i===3?'да':'нет']))],
 ['Акт инвентаризации','последний акт с расхождениями',()=>xlsInv()],
 ['Воронка продаж','все сделки с этапами и суммами',()=>xlsDeals()],
 ['Продажи по менеджерам','выручка, маржа, звонки',()=>xls('Менеджеры',['Менеджер','Продажи','Маржа','Звонки'],[['Руслан Абенов',18200000,5400000,41],['Дана Сейтова',12900000,3900000,96],['Марат Исаев',9800000,2700000,77]])]
];
SC.whrep=()=>`<div class="hd"><div><h2>Отчёты и Excel</h2><p>Любой отчёт — в Excel одной кнопкой. Попробуйте: файлы реально скачиваются. Регулярные отчёты система присылает сама — в почту или WhatsApp по расписанию.</p></div></div>
 <div class="reps">${REPS.map((r,i)=>`<div class="rep"><code>XLS</code><div><b>${r[0]}</b><span>${r[1]}</span></div><button class="bt" onclick="REPS[${i}][2]()">Скачать</button></div>`).join('')}</div>
 <div class="pan" style="margin-top:12px"><h3>По расписанию</h3>${[['Остатки и «к заказу»','каждый понедельник 09:00','Александр, Ерлан'],['Воронка и продажи менеджеров','ежедневно 19:00','Руслан'],['Движение товара за месяц','1-го числа','Светлана']].map(x=>`<div class="kv"><span><b>${x[0]}</b> · ${x[1]}</span><b>${x[2]}</b></div>`).join('')}</div>`;

/* ===== Сервис и ТО ===== */
const SVC=[
 {sn:'RX75-22-0004',cl:'C1',m:'RX-75',hrs:742,next:750,st:'soon',eng:'TM'},
 {sn:'SC55-23-0201',cl:'C1',m:'SC-55',hrs:488,next:500,st:'soon',eng:'TM'},
 {sn:'SC55-22-0112',cl:'C5',m:'SC-55',hrs:1240,next:1250,st:'soon',eng:'NS'},
 {sn:'SC43-23-0880',cl:'C4',m:'SC-43',hrs:302,next:500,st:'ok',eng:'NS'},
 {sn:'SW90-23-0144',cl:'C6',m:'SW-90',hrs:610,next:500,st:'repair',eng:'TM'}
];
SC.service=()=>`<div class="hd"><div><h2>Сервис и ТО</h2><p>Каждая проданная машина остаётся в системе: моточасы, ТО каждые 250 часов, ремонты, запчасти со склада. За 2 недели до ТО менеджер получает задачу — это повторная продажа щёток, падов и химии.</p></div><div class="btns"><button class="bt p" onclick="newTask(null,'Сервисная заявка')">+ Заявка в сервис</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Машина</th><th>Клиент</th><th class="r">Моточасы</th><th>До ТО</th><th>Инженер</th><th>Статус</th><th></th></tr></thead><tbody>
 ${SVC.map(s=>`<tr onclick="openSN('${s.sn}')"><td class="mono">${s.sn}<span class="sub">${esc(PR(s.m).n)}</span></td><td>${esc(CL(s.cl).n)}</td><td class="r">${s.hrs}</td><td style="min-width:120px">${bar(pct(s.hrs%250||250,250),s.st==='repair'?'r':s.st==='soon'?'w':'g')}<span class="sub">${s.st==='repair'?'в ремонте':Math.max(0,s.next-s.hrs)+' ч'}</span></td><td>${fn(s.eng)}</td><td>${tag(s.st==='repair'?'ремонт':s.st==='soon'?'скоро ТО':'в норме',s.st==='repair'?'r':s.st==='soon'?'w':'g')}</td><td>${s.st==='soon'?`<button class="bt sm" onclick="event.stopPropagation();svcPlan('${s.sn}')">Назначить ТО</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Комплект на ТО SC-55</h3>${[['BR-55',2],['SQ-75',1],['CH-DET',2]].map(([p,q])=>`<div class="kv"><span>${esc(PR(p).n)}</span><b>${q} шт · ${tg(PR(p).price*q)}</b></div>`).join('')}<p class="mini">Списывается со склада сервиса автоматически при закрытии задачи.</p></div>
 <div class="pan"><h3>Выручка сервиса, ноябрь</h3><div class="kv"><span>ТО и ремонты</span><b>${tg(2100000)}</b></div><div class="kv"><span>Запчасти и расходники</span><b>${tg(4100000)}</b></div><div class="kv"><span>Повторные продажи из ТО</span><b>${tg(1650000)}</b></div></div></div>`;
function svcPlan(sn){const s=SVC.find(x=>x.sn===sn);TASKS.unshift({id:'T-3'+(10+TASKS.length),t:'ТО '+sn+' · '+CL(s.cl).n,who:s.eng,by:'OL',due:'12.11',st:'new',pr:'mid',deal:null,chk:[['Комплект со склада',false],['ТО по регламенту',false],['Акт клиенту',false]],com:[],watch:['OL']});render();toast(`ТО назначено на 12.11, ${fn(s.eng)} получил задачу, клиенту — напоминание в WhatsApp, менеджеру — задача предложить расходники.`)}

/* ===== Задачи ===== */
const tFilt=()=>TASKS.filter(t=>tWho==='all'||t.who===tWho||(tWho==='me'&&t.who===meId()));
const meId=()=>({'Собственник':'AL','Руководитель продаж':'RS','Менеджер':'DN','Кладовщик':'ER','Сервисный инженер':'TM','Бухгалтер':'SV'}[role]);
const tcard=t=>`<div class="tc" draggable="true" ondragstart="event.dataTransfer.setData('t','${t.id}')" onclick="openTask('${t.id}')"><div class="tch"><code>${t.id}</code>${tag(PRN[t.pr][0],PRN[t.pr][1])}</div><b>${esc(t.t)}</b>${t.chk.length?`<div class="tchk">${bar(pct(t.chk.filter(c=>c[1]).length,t.chk.length),'g')}<span>${t.chk.filter(c=>c[1]).length}/${t.chk.length}</span></div>`:''}<div class="tcf"><i class="av">${ini(t.who)}</i><span>${esc(fn(t.who))}</span><time class="${t.due==='сегодня'||t.due==='04.11'?'bad':''}">${t.due}</time>${t.com.length?`<em>${t.com.length}</em>`:''}</div></div>`;
SC.tasks=()=>{const T=tFilt();
 return `<div class="hd"><div><h2>Задачи</h2><p>Задачи ставятся из сделки, звонка, склада или вручную. Чек-лист, наблюдатели, комментарии, сроки. Пропущенный звонок, оплата, отгрузка и ТО создают задачи сами.</p></div><div class="btns"><div class="seg">${[['board','Доска'],['list','Список'],['people','По людям']].map(([k,n])=>`<a class="${tView===k?'on':''}" onclick="tView='${k}';render()">${n}</a>`).join('')}</div><select class="sel" onchange="tWho=this.value;render()"><option value="all">Все</option><option value="me" ${tWho==='me'?'selected':''}>Мои</option>${STAFF.map(s=>`<option value="${s.id}" ${tWho===s.id?'selected':''}>${esc(s.n)}</option>`).join('')}</select><button class="bt p" onclick="newTask()">+ Задача</button></div></div>
 ${tView==='board'?`<div class="kanban k4">${TST.map(([k,n])=>{const x=T.filter(t=>t.st===k);return `<div class="kcol" ondragover="event.preventDefault()" ondrop="dropTask(event,'${k}')"><div class="kh"><b>${n}</b><span>${x.length}</span></div>${x.map(tcard).join('')||'<div class="kempty">перетащите сюда</div>'}</div>`}).join('')}</div>`
 :tView==='list'?`<div class="tw"><table class="t"><thead><tr><th>№</th><th>Задача</th><th>Исполнитель</th><th>Поставил</th><th>Срок</th><th>Статус</th></tr></thead><tbody>${T.map(t=>`<tr onclick="openTask('${t.id}')"><td class="mono">${t.id}</td><td><b>${esc(t.t)}</b>${t.deal?`<span class="sub">сделка ${t.deal}</span>`:''}</td><td>${esc(SF(t.who).n)}</td><td>${t.by==='Система'?'Система':fn(t.by)}</td><td class="mono">${t.due}</td><td>${tag(TST.find(s=>s[0]===t.st)[1],t.st==='done'?'g':t.st==='check'?'i':t.st==='work'?'w':'')}</td></tr>`).join('')}</tbody></table></div>`
 :`<div class="people">${STAFF.filter(s=>s.st!=='off').map(s=>{const x=TASKS.filter(t=>t.who===s.id&&t.st!=='done');return `<div class="pcol"><div class="pch"><i class="av">${ini(s.id)}</i><div><b>${esc(s.n)}</b><small>${esc(s.pos)}</small></div><em class="${x.length>4?'bad':''}">${x.length}</em></div>${x.map(t=>`<a onclick="openTask('${t.id}')"><i class="dt ${PRN[t.pr][1]}"></i>${esc(t.t)}<time>${t.due}</time></a>`).join('')||'<span class="mini">свободен</span>'}</div>`}).join('')}</div>`}`};
function dropTask(e,k){const t=TASKS.find(x=>x.id===e.dataTransfer.getData('t'));if(!t)return;t.st=k;FEED.unshift([NOW,meId()||'RS','перевёл задачу в «'+TST.find(s=>s[0]===k)[1]+'»',t.id+' · '+t.t,'task']);render();toast(k==='check'?`${t.id} на проверке — постановщику ${fn(t.by)} пришло уведомление.`:`${t.id} → ${TST.find(s=>s[0]===k)[1]}.`)}
function openTask(id){curT=id;go('task')}
SC.task=()=>{const t=TASKS.find(x=>x.id===curT)||TASKS[0];const si=TST.findIndex(s=>s[0]===t.st);
 return crumbs(['Задачи',"go('tasks')"],[t.id])+`<div class="hd"><div><h2>${esc(t.t)}</h2><p>Поставил ${t.by==='Система'?'Система':esc(SF(t.by).n)} · исполнитель ${esc(SF(t.who).n)} · срок ${t.due}${t.deal?` · сделка <a class="lnk" onclick="openDeal('${t.deal}')">${t.deal}</a>`:''}</p></div><div class="btns">${t.st!=='done'?`<button class="bt" onclick="reassign('${t.id}')">Передать</button>`:''}${t.st==='check'?`<button class="bt" onclick="tSet('${t.id}','work');toast('Возвращено на доработку.')">Вернуть</button><button class="bt g" onclick="tSet('${t.id}','done')">Принять</button>`:t.st!=='done'?`<button class="bt p" onclick="tSet('${t.id}','check')">Сдать на проверку</button>`:tag('готово','g')}</div></div>
 <div class="chainS c4">${TST.map(([k,n],i)=>`<a class="${i<si?'ok':i===si?'cur':''}" onclick="tSet('${t.id}','${k}')">${n}</a>`).join('')}</div>
 <div class="g21"><div>
  <div class="pan"><h3>Чек-лист</h3><div class="chk">${t.chk.map((c,i)=>`<div class="ci"><span class="bx ${c[1]?'on':''}" onclick="tChk('${t.id}',${i})">✓</span><span class="nm">${esc(c[0])}</span></div>`).join('')}<div class="ci"><input class="qin wide" placeholder="+ пункт и Enter" onkeydown="if(event.key==='Enter'&&this.value){TASKS.find(x=>x.id==='${t.id}').chk.push([this.value,false]);render()}"></div></div></div>
  <div class="pan"><h3>Обсуждение</h3>${t.com.map(c=>`<div class="cm"><i class="av">${c[0]==='Система'?'С':c[0]}</i><div><b>${c[0]==='Система'?'Система':esc(SF(c[0]).n)}</b><time>${c[1]}</time><p>${esc(c[2])}</p></div></div>`).join('')||'<p class="mini">Пока пусто.</p>'}
   <div class="wsend"><input id="ctx" placeholder="Комментарий… @имя — упомянуть"><button class="bt p" onclick="tCom('${t.id}')">Отправить</button></div></div>
 </div><div>
  <div class="pan"><h3>Параметры</h3><div class="kv"><span>Исполнитель</span><b>${esc(SF(t.who).n)}</b></div><div class="kv"><span>Приоритет</span><b>${PRN[t.pr][0]}</b></div><div class="kv"><span>Срок</span><b>${t.due}</b></div><div class="kv"><span>Наблюдатели</span><b>${t.watch.map(fn).join(', ')||'—'}</b></div><div class="kv"><span>Напоминание</span><b>за 2 часа в WhatsApp</b></div></div>
  <div class="pan"><h3>История</h3>${[['создана',t.by==='Система'?'Система':fn(t.by)],['принята в работу',fn(t.who)]].map(h=>`<div class="kv"><span>${h[0]}</span><b>${h[1]}</b></div>`).join('')}</div>
 </div></div>`};
function tSet(id,k){const t=TASKS.find(x=>x.id===id);t.st=k;FEED.unshift([NOW,meId()||'RS','изменил статус задачи',t.id+' → '+TST.find(s=>s[0]===k)[1],'task']);render()}
function tChk(id,i){const t=TASKS.find(x=>x.id===id);t.chk[i][1]=!t.chk[i][1];render()}
function tCom(id){const v=document.getElementById('ctx').value;if(!v)return;TASKS.find(x=>x.id===id).com.push([meId()||'RS',NOW,v]);render();toast('Комментарий отправлен. Исполнитель и наблюдатели получили уведомление.')}
function reassign(id){const t=TASKS.find(x=>x.id===id);openM('Передать задачу',esc(t.t),`<div class="form"><label>Кому<select id="rto">${STAFF.filter(s=>s.st==='on'&&s.id!==t.who).map(s=>`<option value="${s.id}">${esc(s.n)} · ${TASKS.filter(x=>x.who===s.id&&x.st!=='done').length} задач</option>`).join('')}</select></label><label>Комментарий<input value="Подхвати, пожалуйста"></label></div><div class="btns l"><button class="bt p" onclick="const t=TASKS.find(x=>x.id==='${id}');t.who=document.getElementById('rto').value;closeM();render();toast('Задача передана '+esc(SF(t.who).n)+'.')">Передать</button></div>`)}
function newTask(deal,title){openM('Новая задача',deal?'по сделке '+deal:'',`<div class="form"><label>Что сделать<input id="ntt" value="${esc(title||'Подготовить спецификацию для тендера')}"></label><label>Исполнитель<select id="ntw">${STAFF.filter(s=>s.st==='on').map(s=>`<option value="${s.id}">${esc(s.n)}</option>`).join('')}</select></label><label>Срок<input id="ntd" value="07.11"></label><label>Приоритет<select id="ntp"><option value="high">срочно</option><option value="mid" selected>обычная</option><option value="low">низкая</option></select></label><label>Чек-лист (через ;)<input id="ntc" value="Собрать данные; Согласовать с Русланом; Отправить клиенту"></label><label class="cbx"><input type="checkbox" checked> Повторять каждую неделю</label></div><div class="btns l"><button class="bt p" onclick="saveTask('${deal||''}')">Поставить</button></div>`)}
function saveTask(deal){const id='T-'+(320+TASKS.length);TASKS.unshift({id,t:document.getElementById('ntt').value,who:document.getElementById('ntw').value,by:meId()||'RS',due:document.getElementById('ntd').value,st:'new',pr:document.getElementById('ntp').value,deal:deal||null,chk:document.getElementById('ntc').value.split(';').map(x=>[x.trim(),false]).filter(x=>x[0]),com:[],watch:[]});FEED.unshift([NOW,meId()||'RS','поставил задачу',id,'task']);closeM();curT=id;go('task');toast(`Задача ${id} поставлена. Исполнителю — уведомление в WhatsApp.`)}

/* ===== Лента ===== */
let fType='all';
SC.feed=()=>`<div class="hd"><div><h2>Лента</h2><p>Всё, что происходит в компании, в одном потоке: сделки, звонки, WhatsApp, склад, задачи. Можно написать объявление всей команде.</p></div><div class="btns"><div class="seg">${[['all','Всё'],['deal','Сделки'],['call','Звонки'],['wa','WhatsApp'],['wh','Склад'],['task','Задачи']].map(([k,n])=>`<a class="${fType===k?'on':''}" onclick="fType='${k}';render()">${n}</a>`).join('')}</div></div></div>
 <div class="g21"><div class="pan"><div class="post"><textarea id="ptx" placeholder="Объявление команде…">С понедельника демо-зал работает до 20:00. Записывайте клиентов через задачи.</textarea><button class="bt p" onclick="FEED.unshift([NOW,meId()||'AL','написал всем',document.getElementById('ptx').value,'post']);render();toast('Объявление ушло 15 сотрудникам.')">Опубликовать</button></div>
 ${FEED.filter(f=>fType==='all'||f[4]===fType).map(feedRow).join('')}</div>
 <div class="pan"><h3>Сегодня в цифрах</h3><div class="kv"><span>Звонков</span><b>47</b></div><div class="kv"><span>Сообщений WhatsApp</span><b>112</b></div><div class="kv"><span>Новых лидов</span><b>6</b></div><div class="kv"><span>Задач закрыто</span><b>14</b></div><div class="kv"><span>Отгрузок</span><b>2</b></div></div></div>`;

/* ===== Команда ===== */
SC.team=()=>{const deps=[...new Set(STAFF.map(s=>s.dep))];
 return `<div class="hd"><div><h2>Сотрудники · ${STAFF.filter(s=>s.st!=='off').length}</h2><p>Добавление — за минуту: роль задаёт доступы, WhatsApp и внутренний номер АТС выдаются сразу. Удаление — без потерь: сделки, задачи и клиенты передаются другому сотруднику, доступ закрывается мгновенно.</p></div><div class="btns"><button class="bt p" onclick="addEmp()">+ Сотрудник</button></div></div>
 ${deps.map(d=>`<div class="dep"><h4>${d}</h4><div class="tw"><table class="t"><tbody>${STAFF.filter(s=>s.dep===d).map(s=>{const dl=DEALS.filter(x=>x.mgr===s.id).length,tk=TASKS.filter(x=>x.who===s.id&&x.st!=='done').length;return `<tr class="${s.st==='off'?'off':''}"><td style="width:40%"><i class="av">${ini(s.id)}</i> <b>${esc(s.n)}</b><span class="sub">${esc(s.pos)}</span></td><td class="mono">${s.ph}</td><td>${s.st==='on'?tag('работает','g'):s.st==='vac'?tag('отпуск','w'):tag('отключён','r')}</td><td class="r">${dl} сделок · ${tk} задач</td><td class="r">${s.st!=='off'&&s.id!=='AL'?`<button class="bt sm" onclick="delEmp('${s.id}')">Удалить</button>`:''}</td></tr>`}).join('')}</tbody></table></div></div>`).join('')}`};
function addEmp(){openM('Новый сотрудник','Доступы выдаются по роли',`<div class="form"><label>ФИО<input id="ena" value="Алия Мукашева"></label><label>Телефон (WhatsApp)<input id="eph" value="+7 701 777 12 34"></label><label>Должность<input id="epo" value="Менеджер по продажам"></label><label>Роль<select id="ero">${Object.keys(ROLES).filter(r=>r!=='Собственник').map(r=>`<option>${r}</option>`).join('')}</select></label><label>Отдел<select id="ede"><option>Продажи</option><option>Склад</option><option>Сервис</option><option>Финансы</option></select></label><label>Бизнесы<select multiple size="3">${BIZ.map((b,i)=>`<option ${i===0?'selected':''}>${b.n}</option>`).join('')}</select></label></div>
 <div class="pan" style="margin-top:10px"><h3>Что произойдёт</h3><div class="kv"><span>Приглашение в WhatsApp со ссылкой на вход</span><b>сразу</b></div><div class="kv"><span>Внутренний номер АТС</span><b>116</b></div><div class="kv"><span>Задача «Онбординг» руководителю</span><b>на 3 дня</b></div></div><div class="btns l"><button class="bt p" onclick="saveEmp()">Добавить</button></div>`)}
function saveEmp(){const n=document.getElementById('ena').value;const id=n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2)+'2';STAFF.push({id,n,pos:document.getElementById('epo').value,dep:document.getElementById('ede').value,ph:document.getElementById('eph').value,st:'on',tasks:0});FEED.unshift([NOW,meId()||'AL','добавил сотрудника',n,'post']);closeM();render();toast(`${esc(n)} добавлен. Приглашение ушло в WhatsApp, внутренний номер 116.`)}
function delEmp(id){const s=SF(id);const dl=DEALS.filter(x=>x.mgr===id),tk=TASKS.filter(x=>x.who===id&&x.st!=='done');
 openM('Удалить: '+esc(s.n),esc(s.pos),`<p class="mini">Ничего не теряется: всё, что было на сотруднике, передаётся другому. Доступ закроется сразу, история останется.</p>
 <div class="pan"><h3>Передать дела</h3><div class="kv"><span>Сделки (${dl.length})</span><b><select class="sel sm" id="dto">${STAFF.filter(x=>x.st==='on'&&x.id!==id).map(x=>`<option value="${x.id}" ${x.id==='RS'?'selected':''}>${esc(x.n)}</option>`).join('')}</select></b></div>
 <div class="kv"><span>Открытые задачи (${tk.length})</span><b>тому же</b></div><div class="kv"><span>Клиенты и переписка WhatsApp</span><b>тому же</b></div><div class="kv"><span>Внутренний номер АТС</span><b>освобождается</b></div></div>
 <div class="btns l"><button class="bt w" onclick="doDel('${id}')">Передать и отключить</button></div>`)}
function doDel(id){const to=document.getElementById('dto').value;DEALS.forEach(d=>{if(d.mgr===id)d.mgr=to});TASKS.forEach(t=>{if(t.who===id&&t.st!=='done')t.who=to});SF(id).st='off';FEED.unshift([NOW,meId()||'AL','отключил сотрудника',SF(id).n+' · дела переданы '+SF(to).n,'post']);closeM();render();toast(`Доступ закрыт. Сделки и задачи переданы <b>${esc(SF(to).n)}</b>.`)}

/* ===== Роли ===== */
const PERM=['Воронка — все сделки','Воронка — только свои','Цены закупки и маржа','Склад — просмотр','Склад — приход и отгрузка','Инвентаризация — проводить акт','Задачи — ставить всем','Сотрудники — добавлять','Записи звонков','Excel-выгрузки','Все бизнесы'];
const PM={'Собственник':'11111111111','Руководитель продаж':'10111001111','Менеджер':'01010000010','Кладовщик':'00011000010','Сервисный инженер':'00010000000','Бухгалтер':'10111000010'};
SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>Каждый видит своё. Нажмите на клетку — право переключится. Роль можно скопировать и создать свою.</p></div></div>
 <div class="tw"><table class="t perm"><thead><tr><th>Право</th>${Object.keys(PM).map(r=>`<th class="c">${r}</th>`).join('')}</tr></thead><tbody>${PERM.map((p,i)=>`<tr><td>${p}</td>${Object.keys(PM).map(r=>`<td class="c"><a class="pm ${PM[r][i]==='1'?'on':''}" onclick="PM['${r}']=PM['${r}'].slice(0,${i})+(PM['${r}'][${i}]==='1'?'0':'1')+PM['${r}'].slice(${i+1});render()">${PM[r][i]==='1'?'✓':''}</a></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

/* ===== Мультибизнес ===== */
SC.multi=()=>{const tot=BIZ.reduce((a,b)=>a+b.rev,0);
 return `<div class="hd"><div><h2>Мультибизнес · опция +400 000 ₸</h2><p>Если Александр захочет вести несколько своих бизнесов в одной системе: у каждого своя воронка, свой склад, свои задачи и команда — а у собственника один сводный пульт. Переключатель бизнеса — слева вверху.</p></div></div>
 <div class="mbiz">${BIZ.map(b=>`<a class="${b.id===biz?'on':''}" style="--c:${b.c}" onclick="setBiz('${b.id}')"><i></i><b>${b.n}</b><span>${b.d}</span>
  <div class="kv"><span>Продажи ноября</span><b>${mln(b.rev)} ₸</b></div><div class="kv"><span>Открытых сделок</span><b>${b.deals}</b></div><div class="kv"><span>Склад</span><b>${mln(b.stock)} ₸</b></div><div class="kv"><span>Задач</span><b>${b.tasks}</b></div><div class="share"><i style="width:${pct(b.rev,tot)}%"></i></div><small>${pct(b.rev,tot)}% выручки группы</small></a>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Что даёт опция</h3>${[['Мультиворонки','у каждого бизнеса свои этапы: техника — через демо и тендер, химия — через автозаказ'],['Мультисклады','отдельные остатки и инвентаризации, перемещения между бизнесами — документом'],['Мультизадачи','сотрудник может работать в двух бизнесах, задачи помечены цветом бизнеса'],['Мультидашборд','сводный пульт собственника: выручка, маржа, склад, долги — по группе и по каждому']].map(x=>`<div class="kv"><span><b>${x[0]}</b><br><span class="mini">${x[1]}</span></span></div>`).join('')}</div>
 <div class="pan"><h3>Сводно по группе</h3><div class="kv"><span>Выручка ноября</span><b>${tg(tot)}</b></div><div class="kv"><span>Склад, все бизнесы</span><b>${tg(BIZ.reduce((a,b)=>a+b.stock,0))}</b></div><div class="kv"><span>Открытых сделок</span><b>${BIZ.reduce((a,b)=>a+b.deals,0)}</b></div><div class="kv"><span>Клиенты в нескольких бизнесах</span><b>Mega, CleanPro, Magnum</b></div><p class="mini">Общий клиент виден во всех бизнесах: продали машину — сервис и химия сразу знают.</p></div></div>`};
function setBiz(id){biz=id;const s=document.getElementById('bizsel');if(s)s.value=id;build();toast(`Бизнес: <b>${esc(BIZ.find(b=>b.id===id).n)}</b>. Воронка, склад и задачи переключились.`)}

/* ===== Запуск и стоимость ===== */
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Система под ваш процесс: CRM, склады, инвентаризация, задачи, WhatsApp и IP-телефония. Без абонплаты за пользователей.</p></div></div>
 <div class="g21"><div class="pan"><h3>Состав</h3><div class="tw"><table class="t"><tbody>${[['CRM: воронка, сделки, клиенты, КП и счета из шаблонов'],['WhatsApp: общий номер, переписка в сделке, шаблоны, уведомления клиенту'],['IP-телефония: звонки из CRM, записи, пропущенные → задачи, лид с нового номера'],['Склады: 4 склада, ячейки, серийные номера, резерв, приход, отгрузки, перемещения'],['Инвентаризация: план, слепой подсчёт с телефона, расхождения, акт, проведение'],['Отчёты в Excel и отчёты по расписанию'],['Задачи: доска, чек-листы, наблюдатели, авто-задачи, лента'],['Сотрудники и роли: добавление, отключение с передачей дел, права'],['Сервис и ТО по моточасам'],['Перенос клиентов и остатков из Excel, обучение команды']].map((x,i)=>`<tr><td class="mono" style="width:40px">${String(i+1).padStart(2,'0')}</td><td>${x[0]}</td></tr>`).join('')}</tbody></table></div></div>
 <div><div class="pan price"><h3>Стоимость</h3><div class="kv"><span>Разработка и внедрение</span><b>${tg(2000000)}</b></div><div class="kv opt"><span>Опция «Мультибизнес» +20%: мультиворонки, мультисклады, мультизадачи, мультидашборд</span><b>+ ${tg(400000)}</b></div><div class="kv tot"><span>С мультибизнесом</span><b>${tg(2400000)}</b></div></div>
 <div class="pan"><h3>Оплата и сроки</h3><div class="kv"><span>Предоплата</span><b>10%</b></div><div class="kv"><span>После демонстрации CRM и склада</span><b>45%</b></div><div class="kv"><span>После запуска</span><b>45%</b></div><div class="kv"><span>Срок</span><b>8–10 недель</b></div></div></div></div>`;

/* ===== Каркас ===== */
const SUBT={dash:'Деньги, склад и задачи на одном экране',funnel:'От лида до пусконаладки',deal:'Товары, резерв, переписка, звонки',clients:'Объекты и техника у клиента',inbox:'Общий номер и АТС',kp:'Из сделки — в WhatsApp',stock:'Склады, ячейки, серийники',product:'Остатки и движение',receive:'Сверка, сканирование, проведение',ship:'Сборка, доставка, резерв',moves:'Между складами',inv:'План → подсчёт → акт',whrep:'Скачивается по кнопке',service:'Моточасы и ТО',tasks:'Доска, список, по людям',task:'Чек-лист и обсуждение',feed:'Всё, что происходит',team:'Добавить и отключить',roles:'Кто что видит',multi:'Несколько бизнесов в одном',launch:'Цена и сроки'};
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const s=SERIALS.find(x=>x.sn.toLowerCase().includes(q));if(s){openSN(s.sn);return}const p=PRODUCTS.find(x=>(x.n+' '+x.id).toLowerCase().includes(q));if(p&&allowed('product')){openProd(p.id);return}const d=DEALS.find(x=>(x.t+' '+CL(x.cl).n+' '+x.id).toLowerCase().includes(q));if(d&&allowed('deal')){openDeal(d.id);return}toast('Не найдено. Попробуйте: «Mega», «SC-55», «SC55-24».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('');
 const b=document.getElementById('bizsel');if(b){b.innerHTML=BIZ.map(x=>`<option value="${x.id}">${esc(x.n)}</option>`).join('');b.onchange=e=>setBiz(e.target.value)}}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;setMe();if(!allowed(cur))cur=ROLES[role].s[0];build()}
function setMe(){document.getElementById('me').textContent=ROLES[role].av;const n=document.getElementById('mename');if(n)n.innerHTML=`<b>${esc(ROLES[role].n)}</b><small>${esc(role)}</small>`;const b=document.getElementById('bizw');if(b)b.style.display=role==='Собственник'?'':'none'}
function switchRole(k){role=k;setMe();const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){const cnt={inbox:INBOX.reduce((a,m)=>a+(m.un||0),0),tasks:TASKS.filter(t=>t.st==='new').length,stock:PRODUCTS.filter(p=>freeQ(p.id)<p.min).length,ship:SHIPS.filter(s=>s.st==='pick').length,service:SVC.filter(s=>s.st!=='ok').length};
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<div class="ng">${s.n}</div>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="ri ${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><code>${x[2]}</code><span>${esc(x[1])}</span>${cnt[x[0]]?`<em>${cnt[x[0]]}</em>`:''}</a>`).join('')).join('');
 const bz=BIZ.find(b=>b.id===biz);const d=document.getElementById('bizdot');if(d)d.style.background=bz.c}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Глянец';const sb=document.getElementById('subt');if(sb)sb.textContent=SUBT[cur]||'';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0;document.body.classList.remove('nav')}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
let theme='light';
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[
 ['dash','1 · Пульт собственника: деньги в воронке, продажи, склад в тенге, что горит сегодня.'],
 ['funnel','2 · Воронка: от лида до пусконаладки. Перетаскивание, без оплаты не отгрузить.'],
 ['deal','3 · Сделка: товары с живым остатком, резерв машины по серийнику, WhatsApp и звонки.'],
 ['inbox','4 · Общий WhatsApp и IP-телефония: новый номер — лид, пропущенный — задача.'],
 ['stock','5 · Склад: 4 склада, ячейки, серийники, свободно/резерв, ниже минимума — к заказу.'],
 ['product','6 · Карточка товара: остатки по складам, серийные номера, движение.'],
 ['receive','7 · Приход: сверка, скан серийников, провести — остатки обновились.'],
 ['inv','8 · Инвентаризация: план → слепой подсчёт с телефона → расхождения → акт → Excel.'],
 ['whrep','9 · Отчёты в Excel одной кнопкой и по расписанию.'],
 ['tasks','10 · Задачи: доска, по людям, авто-задачи из звонков, оплат и ТО.'],
 ['team','11 · Команда: добавить за минуту, удалить — с передачей сделок и задач.'],
 ['multi','12 · Опция «Мультибизнес»: несколько бизнесов, один пульт. +400 000 ₸.'],
 ['launch','13 · Стоимость: 2 000 000 ₸.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■ Стоп';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
