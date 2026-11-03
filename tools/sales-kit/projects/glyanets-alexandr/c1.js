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
 'Собственник':{av:'АР',n:'Александр Разинков',note:'Все бизнесы, деньги, воронки, склады, команда',s:ALL.slice()},
 'Операционный директор':{av:'РС',n:'Руслан',note:'Воронка, сделки, КП, задачи команды, склад для продаж',s:['dash','funnel','deal','clients','inbox','kp','stock','product','ship','service','tasks','task','feed','team']},
 'Менеджер':{av:'ДН',n:'Дана · менеджер',note:'Свои сделки, звонки, WhatsApp, КП, резерв техники, задачи',s:['funnel','deal','clients','inbox','kp','stock','product','tasks','task','feed']},
 'Кладовщик':{av:'ЕР',n:'Ерлан · склад',note:'Приход, отгрузки, перемещения, инвентаризация, Excel',s:['stock','product','receive','ship','moves','inv','whrep','tasks','task','feed']},
 'Сервисный инженер':{av:'ТМ',n:'Тимур · сервис',note:'Пусконаладка, ТО, ремонт, запчасти со склада',s:['service','stock','product','tasks','task','feed']},
 'Бухгалтер':{av:'СВ',n:'Светлана',note:'Оплаты, отгрузки, остатки в деньгах, Excel',s:['dash','ship','stock','whrep','clients']}
};
let role='Собственник',cur='dash';

/* ===== Бизнесы (мультибизнес) ===== */
const BIZ=[
 {id:'B1',n:'Глянец · Техника',d:'продажа уборочной техники',c:'#0e7c86',rev:48600000,deals:23,stock:186400000,tasks:41},
 {id:'B2',n:'Скалолазание',d:'ассоциация и скалодром',c:'#e0a823',rev:6200000,deals:14,stock:4800000,tasks:27},
 {id:'B3',n:'Баскетбол',d:'клуб и секции',c:'#7a5ad0',rev:3800000,deals:31,stock:1300000,tasks:12}
];
let biz='B1';

/* ===== Команда ===== */
let STAFF=[
 {id:'AL',n:'Александр Разинков',pos:'Генеральный директор, собственник · Астана',dep:'Руководство',ph:'+7 701 100 20 30',st:'on',tasks:3},
 {id:'RS',n:'Руслан',pos:'Операционный директор · Алматы',dep:'Руководство',ph:'+7 701 200 31 40',st:'on',tasks:6},
 {id:'DN',n:'Дана Сейтова',pos:'РОП филиала · Алматы',dep:'Продажи',ph:'+7 707 310 22 18',st:'on',tasks:8},
 {id:'MR',n:'Марат Исаев',pos:'Менеджер по продажам',dep:'Продажи',ph:'+7 705 411 30 72',st:'on',tasks:7},
 {id:'AI',n:'Айгерим Нуркенова',pos:'РОП филиала · Астана',dep:'Продажи',ph:'+7 777 520 41 05',st:'on',tasks:5},
 {id:'KM',n:'Камила Ахметова',pos:'РОП филиала · Костанай',dep:'Продажи',ph:'+7 702 630 12 90',st:'on',tasks:4},
 {id:'ER',n:'Ерлан Жумабаев',pos:'Кладовщик',dep:'Склад',ph:'+7 701 744 55 10',st:'on',tasks:5},
 {id:'BS',n:'Бекзат Оспанов',pos:'Кладовщик · Костанай',dep:'Склад',ph:'+7 708 812 19 27',st:'on',tasks:2},
 {id:'TM',n:'Тимур Ли',pos:'Сервисный инженер · сервисный центр Астана',dep:'Сервис',ph:'+7 701 903 33 41',st:'on',tasks:6},
 {id:'NS',n:'Нурлан Сарсенов',pos:'Сервисный инженер · Астана',dep:'Сервис',ph:'+7 776 104 28 63',st:'on',tasks:4},
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
const WH=[{id:'W1',n:'Склад Алматы',addr:'филиал Алматы · демо-зал'},{id:'W2',n:'Склад Астана',addr:'филиал Астана · сервисный центр'},{id:'W3',n:'Склад Костанай',addr:'филиал Костанай'}];
const WN=id=>(WH.find(w=>w.id===id)||WH[0]).n;
let whF='all';

/* ===== Серийные номера техники ===== st: free — свободна, res — в резерве под сделку, demo — демо-машина, svc — в ремонте, sold — продана */
let SERIALS=[
 {sn:'SC55-24-0412',p:'SC-55',wh:'W1',st:'free',in:'12.09'},{sn:'SC55-24-0413',p:'SC-55',wh:'W1',st:'res',deal:'D-118',in:'12.09'},{sn:'SC55-24-0419',p:'SC-55',wh:'W2',st:'free',in:'12.09'},{sn:'SC55-23-0288',p:'SC-55',wh:'W1',st:'demo',in:'15.03'},
 {sn:'SC43-24-1104',p:'SC-43',wh:'W1',st:'free',in:'02.10'},{sn:'SC43-24-1105',p:'SC-43',wh:'W1',st:'free',in:'02.10'},{sn:'SC43-24-1106',p:'SC-43',wh:'W2',st:'res',deal:'D-121',in:'02.10'},
 {sn:'RX75-24-0031',p:'RX-75',wh:'W1',st:'res',deal:'D-115',in:'20.08'},{sn:'RX75-23-0017',p:'RX-75',wh:'W1',st:'demo',in:'10.11.25'},
 {sn:'SW90-24-0205',p:'SW-90',wh:'W1',st:'free',in:'18.07'},{sn:'SW90-23-0144',p:'SW-90',wh:'W2',st:'svc',in:'01.06.25'},
 {sn:'MC30-24-3301',p:'MINI-30',wh:'W1',st:'free',in:'05.10'},{sn:'MC30-24-3302',p:'MINI-30',wh:'W1',st:'free',in:'05.10'},{sn:'MC30-24-3303',p:'MINI-30',wh:'W2',st:'free',in:'05.10'}
];
const SST={free:['свободна','g'],res:['резерв','w'],demo:['демо-зал','i'],svc:['в ремонте','r'],sold:['продана','']};
let curSN='SC55-24-0413';
/* количество для штучных товаров по складам */
let QTY={'BR-55':{W1:14,W2:6,W3:3},'PD-43':{W1:120,W2:35,W3:10},'SQ-75':{W1:5,W2:1,W3:2},'AKB-240':{W1:7,W2:2,W3:1},'CH-DET':{W1:210,W2:64,W3:30}};
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
 {id:'D-131',cl:'C1',biz:'B1',t:'Mega: ТО парка, 6 машин',sum:1450000,stg:'bill',mgr:'OL',src:'Сервис',items:[],next:'Счёт подписан',days:1,prob:90},
 {id:'D-132',cl:'C4',biz:'B1',t:'CleanPro: химия ежемесячно',sum:860000,stg:'paid',mgr:'MR',src:'Повторный',items:[['CH-DET',20]],next:'Автозаказ 01.12',days:0,prob:100}
];
DEALS.push({id:'S-201',cl:'C7',biz:'B2',t:'Абонементы на скалодром для лицея, 40 детей',sum:1440000,stg:'kp',mgr:'GL',src:'Сайт',items:[],next:'Согласовать расписание',days:1,prob:50},{id:'S-202',cl:'C6',biz:'B2',t:'Корпоратив на скалодроме',sum:380000,stg:'paid',mgr:'GL',src:'Instagram',items:[],next:'Мероприятие 15.11',days:0,prob:100},{id:'K-301',cl:'C6',biz:'B3',t:'Аренда зала под корпоративную лигу',sum:960000,stg:'agree',mgr:'AS',src:'Звонок',items:[],next:'Договор до 10.11',days:2,prob:60},{id:'K-302',cl:'C7',biz:'B3',t:'Детская секция, 25 абонементов',sum:625000,stg:'lead',mgr:'AS',src:'WhatsApp',items:[],next:'Пробная тренировка',days:0,prob:20});
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
INBOX.splice(3,0,{id:'m6',ch:'Telegram',who:'Олжас · ТОО «ЧистоДом»',deal:null,t:'09:12',un:1,msgs:[['in','Добрый день, нужна аренда поломойки на месяц под объект','09:12']]},{id:'m7',ch:'Сайт',who:'Заявка с glyanets.kz · Костанай',deal:null,t:'08:40',un:1,msgs:[['in','Форма «Подобрать машину»: ТЦ 6 000 м², бюджет до 4 млн','08:40']]});
let curM='m1';
