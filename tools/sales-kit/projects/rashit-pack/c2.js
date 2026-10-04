
/* ===== КОРОБКИ ===== */
const DIV=[['pizza','Коробки для пиццы'],['gofra','Гофрокороба'],['lotok','Лотки и фастфуд'],['konditer','Кондитерская упаковка'],['print','С печатью логотипа · под заказ']];
const DIVN=k=>(DIV.find(d=>d[0]===k)||['',''])[1];
let PRODUCTS=[
 {id:'PZ25',div:'pizza',n:'Пицца 25 см, бурая',size:'250×250×40',mat:'Т-22, Е-гофра',price:72,cost:51,stock:6400,ready:true},
 {id:'PZ30',div:'pizza',n:'Пицца 30 см, бурая',size:'300×300×40',mat:'Т-22, Е-гофра',price:88,cost:62,stock:9200,ready:true},
 {id:'PZ33',div:'pizza',n:'Пицца 33 см, белая',size:'330×330×40',mat:'Т-23, Е-гофра',price:104,cost:73,stock:3100,ready:true},
 {id:'PZ40',div:'pizza',n:'Пицца 40 см, бурая',size:'400×400×45',mat:'Т-23, Е-гофра',price:136,cost:96,stock:1800,ready:true},
 {id:'GK43',div:'gofra',n:'Гофрокороб 400×300×300, 3 слоя',size:'400×300×300',mat:'Т-23, B-гофра',price:310,cost:214,stock:2600,ready:true},
 {id:'GK64',div:'gofra',n:'Гофрокороб 600×400×400, 5 слоёв',size:'600×400×400',mat:'П-32, BC-гофра',price:640,cost:452,stock:900,ready:true},
 {id:'GK32',div:'gofra',n:'Короб для маркетплейсов 320×230×120',size:'320×230×120',mat:'Т-22, B-гофра',price:148,cost:101,stock:4200,ready:true},
 {id:'LT01',div:'lotok',n:'Лоток для бургера',size:'150×150×80',mat:'картон 300 г',price:46,cost:31,stock:12000,ready:true},
 {id:'LT02',div:'lotok',n:'Коробка для картофеля фри',size:'М',mat:'картон 300 г',price:28,cost:18,stock:15000,ready:true},
 {id:'KD20',div:'konditer',n:'Торт-бокс 20 см с окном',size:'200×200×120',mat:'картон 320 г',price:210,cost:142,stock:1300,ready:true},
 {id:'KD10',div:'konditer',n:'Коробка для 4 пирожных',size:'180×180×70',mat:'картон 300 г',price:96,cost:63,stock:2400,ready:true},
 {id:'PR33',div:'print',n:'Пицца 33 см с логотипом, 1 цвет',size:'330×330×40',mat:'Т-23 + флексопечать',price:126,cost:86,stock:0,ready:false},
 {id:'PR43',div:'print',n:'Гофрокороб с логотипом, 2 цвета',size:'по заказу',mat:'Т-23 + флексопечать',price:420,cost:288,stock:0,ready:false}
];
const PRD=id=>PRODUCTS.find(p=>p.id===id);
const BCLIENTS=[
 {id:'C1',n:'Пиццерия «Папа Нико»',kind:'Сеть, 6 точек',city:'Астана',contact:'Нико, +7 701 *** 18 44',src:'Instagram',repeat:30,last:'2026-09-04',avg:1240000,orders:11,debt:0,contract:true},
 {id:'C2',n:'Кофейни Daily Cup',kind:'Сеть кофеен',city:'Астана',contact:'Алия, закупки',src:'2ГИС',repeat:30,last:'2026-09-08',avg:310000,orders:7,debt:0,contract:true},
 {id:'C3',n:'Кондитерская «Бал Тәтті»',kind:'Производство',city:'Астана',contact:'Жанар',src:'Рекомендация',repeat:14,last:'2026-09-22',avg:270000,orders:16,debt:135000,contract:true},
 {id:'C4',n:'Склад-магазин «Мега Упак»',kind:'Опт',city:'Караганда',contact:'Виталий',src:'Сайт',repeat:45,last:'2026-08-20',avg:2860000,orders:4,debt:0,contract:true},
 {id:'C5',n:'Бургерная Grill Point',kind:'Кафе',city:'Астана',contact:'Ержан',src:'Instagram',repeat:21,last:'2026-09-12',avg:185000,orders:5,debt:0,contract:false},
 {id:'C6',n:'Продавец маркетплейса «Ақ Жол Трейд»',kind:'Интернет-торговля',city:'Астана',contact:'Самат',src:'Реклама Google',repeat:0,last:'—',avg:0,orders:0,debt:0,contract:false},
 {id:'C7',n:'Суши-бар «Суши Дом»',kind:'Доставка',city:'Астана',contact:'Ирина, администратор',src:'WhatsApp',repeat:30,last:'2026-09-01',avg:220000,orders:6,debt:0,contract:true}
];
const BC=id=>BCLIENTS.find(c=>c.id===id);
const BST=[
 {k:'new',n:'Заявка',c:'#8b8f88'},{k:'calc',n:'Расчёт',c:'#6c7a86'},{k:'inv',n:'Счёт выставлен',c:'#b07d2a'},{k:'pre',n:'Предоплата',c:'#9a6a32'},
 {k:'prod',n:'В производстве',c:'#7a4f22'},{k:'ready',n:'Готово · сообщили',c:'#2f7a4f'},{k:'rest',n:'Оплата остатка',c:'#b07d2a'},{k:'ship',n:'Отгрузка',c:'#2e5d8a'},{k:'got',n:'Получено клиентом',c:'#2e3a46'}
];
const BSTOF=k=>BST.find(s=>s.k===k)||BST[0];
let ORDERS=[
 {id:'Z-2026-142',cl:'C1',lines:[['PR33',8000]],st:'prod',d:'2026-09-24',due:'2026-10-03',pre:50,paid:504000,deliv:'Доставка',mgr:'DN',note:'Логотип 1 цвет, клише готово'},
 {id:'Z-2026-145',cl:'C3',lines:[['KD20',800],['KD10',1200]],st:'ready',d:'2026-09-26',due:'2026-10-01',pre:50,paid:141600,deliv:'Самовывоз',mgr:'DN',note:''},
 {id:'Z-2026-147',cl:'C4',lines:[['GK43',5000],['GK64',1500]],st:'pre',d:'2026-09-29',due:'2026-10-09',pre:30,paid:753000,deliv:'Доставка',mgr:'DN',note:'Фура в Караганду, 20 т'},
 {id:'Z-2026-148',cl:'C2',lines:[['KD10',3000]],st:'inv',d:'2026-09-30',due:'2026-10-06',pre:50,paid:0,deliv:'Доставка',mgr:'DN',note:'Повтор заказа от 08.09'},
 {id:'Z-2026-149',cl:'C5',lines:[['LT01',3000],['LT02',4000]],st:'calc',d:'2026-09-30',due:'2026-10-07',pre:100,paid:0,deliv:'Самовывоз',mgr:'DN',note:'Новый клиент — нужен договор'},
 {id:'Z-2026-150',cl:'C6',lines:[['GK32',10000]],st:'new',d:'2026-10-01',due:'2026-10-12',pre:50,paid:0,deliv:'Доставка',mgr:'DN',note:'Заявка с сайта, реклама Google'},
 {id:'Z-2026-139',cl:'C7',lines:[['PZ30',3000]],st:'ship',d:'2026-09-20',due:'2026-09-30',pre:50,paid:264000,deliv:'Доставка',mgr:'DN',note:'Машина в пути, ETA 14:30'},
 {id:'Z-2026-136',cl:'C1',lines:[['PZ33',6000],['PZ40',2000]],st:'got',d:'2026-09-04',due:'2026-09-10',pre:50,paid:896000,deliv:'Доставка',mgr:'DN',note:'Получено 10.09, подтверждено фото'},
 {id:'Z-2026-144',cl:'C3',lines:[['KD20',1000]],st:'rest',d:'2026-09-22',due:'2026-09-29',pre:50,paid:105000,deliv:'Самовывоз',mgr:'DN',note:'Готово 29.09, ждём остаток'}
];
const OR=id=>ORDERS.find(o=>o.id===id);
const oSum=o=>o.lines.reduce((a,l)=>a+l[1]*PRD(l[0]).price,0);
const oCost=o=>o.lines.reduce((a,l)=>a+l[1]*PRD(l[0]).cost,0);
let curOrd='Z-2026-142';
let LEADS=[
 {id:'L1',ch:'Сайт',src:'Реклама Google · «гофрокороба оптом»',name:'Ақ Жол Трейд',txt:'Нужны короба 320×230×120 для маркетплейса, 10 000 шт, доставка по Астане',t:'09:14',st:'order',ord:'Z-2026-150'},
 {id:'L2',ch:'WhatsApp',src:'Instagram → WhatsApp',name:'Кафе «Самса Хаус»',txt:'Сколько стоят лотки для самсы, 2 000 шт, с логотипом?',t:'10:02',st:'new'},
 {id:'L3',ch:'Звонок',src:'2ГИС',name:'Магазин «Цветы 24»',txt:'Коробки для цветов, нестандартный размер, нужен расчёт',t:'10:40',st:'new'},
 {id:'L4',ch:'WhatsApp',src:'Постоянный клиент',name:'Кофейни Daily Cup',txt:'Повторите прошлый заказ коробок для пирожных, 3 000 шт',t:'вчера',st:'order',ord:'Z-2026-148'}
];

/* производство: очередь по сменам */
let PRODQ=[
 {ord:'Z-2026-142',item:'PR33',q:8000,done:5200,line:'Линия 1 · высечка + печать',shift:'01.10 · день',st:'work',scrap:140},
 {ord:'Z-2026-147',item:'GK43',q:5000,done:0,line:'Линия 2 · гофроагрегат',shift:'02.10 · день',st:'plan',scrap:0},
 {ord:'Z-2026-147',item:'GK64',q:1500,done:0,line:'Линия 2 · гофроагрегат',shift:'03.10 · день',st:'plan',scrap:0},
 {ord:'Z-2026-145',item:'KD20',q:800,done:800,line:'Линия 3 · склейка',shift:'30.09 · день',st:'done',scrap:12},
 {ord:'Z-2026-145',item:'KD10',q:1200,done:1200,line:'Линия 3 · склейка',shift:'30.09 · ночь',st:'done',scrap:20}
];
const BMAT=[['Картон Т-23, рулоны','18,4 т','на 9 смен'],['Картон Т-22','11,2 т','на 7 смен'],['Картон 300 г, листы','6 800 л','на 4 смены'],['Краска флексо, чёрная','62 кг','норма'],['Клей ПВА','140 кг','заказать до 05.10']];

/* ===== ВТОРСЫРЬЁ ===== */
const MAT={
 KRT:{n:'Картон МС-5Б',c:'#9a6a32',buy:32,sell:46,to:'Свой завод'},
 PVD:{n:'Плёнка ПВД',c:'#2e5d8a',buy:48,sell:92,to:'Переработчик'},
 PET:{n:'ПЭТ-бутылка',c:'#2f7a4f',buy:55,sell:112,to:'Переработчик'},
 PND:{n:'Пластик ПНД',c:'#6b4f8f',buy:60,sell:120,to:'Переработчик'},
 ALU:{n:'Алюминиевая банка',c:'#7d8790',buy:330,sell:520,to:'Переработчик'}
};
const matTag=k=>`<span class="mt" style="--c:${MAT[k].c}">${MAT[k].n}</span>`;
const CARS=[
 {id:'500',n:'Газель 500',drv:'KN',cap:2000},
 {id:'712',n:'Газель 712',drv:'MR',cap:2000},
 {id:'318',n:'Газель 318',drv:'AR',cap:2000}
];
let POINTS=[
 {id:'T1',n:'ТРЦ «Сарыарка Плаза»',kind:'Компания',addr:'пр. Туран, 24',mats:['KRT','PVD'],sch:'Ежедневно, 08:00',pay:'Безнал',price:{KRT:30,PVD:45},month:14200,last:'2026-10-01'},
 {id:'T2',n:'Супермаркет «Береке», 3 магазина',kind:'Компания',addr:'Сарыарка, Алматинский р-н',mats:['KRT','PVD'],sch:'Пн, ср, пт',pay:'Безнал',price:{KRT:32,PVD:48},month:9800,last:'2026-10-01'},
 {id:'T3',n:'Склад «Ақ Жол Логистик»',kind:'Компания',addr:'промзона, ул. Шарбакты',mats:['KRT','PVD','PND'],sch:'По звонку, от 500 кг',pay:'Безнал',price:{KRT:34,PVD:50,PND:62},month:11400,last:'2026-09-29'},
 {id:'T4',n:'Типография «Полиграф-Сервис»',kind:'Компания',addr:'ул. Кенесары, 70',mats:['KRT'],sch:'Вт, пт',pay:'Безнал',price:{KRT:36},month:5600,last:'2026-09-29'},
 {id:'T5',n:'Рынок «Шапағат»',kind:'Рынок',addr:'ул. Бейбитшилик',mats:['KRT','PET'],sch:'Ежедневно, 18:00',pay:'Наличные на месте',price:{KRT:28,PET:52},month:12600,last:'2026-09-30'},
 {id:'T6',n:'ЖК «Жасыл Аул» · дворник Серик',kind:'Дворник',addr:'ул. Сыганак, 15',mats:['KRT','PET','ALU'],sch:'Пн, чт',pay:'Наличные в кассе',price:{KRT:30,PET:55,ALU:330},month:1900,last:'2026-09-28'},
 {id:'T7',n:'Завод напитков «Таза Су»',kind:'Компания',addr:'Индустриальный парк',mats:['PET','PVD'],sch:'1 раз в неделю',pay:'Безнал',price:{PET:58,PVD:50},month:6400,last:'2026-09-25'},
 {id:'T8',n:'Бар «Хмель и Солод»',kind:'Компания',addr:'ул. Достык, 5',mats:['ALU'],sch:'По звонку',pay:'Наличные в кассе',price:{ALU:340},month:420,last:'2026-09-22'}
];
const PT=id=>POINTS.find(p=>p.id===id);
/* рейсы сегодня: строки по точкам */
let TRIPS=[
 {car:'500',n:1,st:'done',lines:[{pt:'T1',m:'KRT',kg:1180,ph:true,ts:'08:20'},{pt:'T1',m:'PVD',kg:160,ph:true,ts:'08:25'}],weighed:1318},
 {car:'500',n:2,st:'done',lines:[{pt:'T2',m:'KRT',kg:1240,ph:true,ts:'10:05'}],weighed:1236},
 {car:'500',n:3,st:'done',lines:[{pt:'T4',m:'KRT',kg:1420,ph:true,ts:'12:10'}],weighed:1398},
 {car:'500',n:4,st:'go',lines:[{pt:'T3',m:'KRT',kg:1520,ph:true,ts:'14:02'},{pt:'T3',m:'PND',kg:180,ph:false,ts:'14:09'}],weighed:0},
 {car:'712',n:1,st:'done',lines:[{pt:'T5',m:'KRT',kg:860,ph:true,ts:'08:40'},{pt:'T5',m:'PET',kg:240,ph:true,ts:'08:48'}],weighed:1052},
 {car:'712',n:2,st:'done',lines:[{pt:'T7',m:'PET',kg:1320,ph:true,ts:'11:15'}],weighed:1310},
 {car:'712',n:3,st:'done',lines:[{pt:'T2',m:'PVD',kg:420,ph:true,ts:'13:30'},{pt:'T6',m:'ALU',kg:96,ph:true,ts:'13:55'},{pt:'T6',m:'KRT',kg:240,ph:true,ts:'14:00'}],weighed:742},
 {car:'712',n:4,st:'done',lines:[{pt:'T5',m:'KRT',kg:824,ph:true,ts:'15:10'}],weighed:818},
 {car:'318',n:1,st:'done',lines:[{pt:'T1',m:'KRT',kg:1350,ph:true,ts:'09:10'}],weighed:1352},
 {car:'318',n:2,st:'plan',lines:[{pt:'T8',m:'ALU',kg:0,ph:false,ts:''}],weighed:0}
];
const lineSum=l=>{const p=PT(l.pt);return l.kg*((p.price&&p.price[l.m])||MAT[l.m].buy)};
const tripKg=t=>t.lines.reduce((a,l)=>a+l.kg,0);
let curCar='500';
/* склад вторсырья */
let RSTOCK={KRT:{kg:24600,bales:41,avg:31.4},PVD:{kg:3820,bales:9,avg:47.2},PET:{kg:2650,bales:11,avg:55.8},PND:{kg:910,bales:3,avg:61.0},ALU:{kg:384,bales:2,avg:333}};
const INV=[
 {d:'2026-09-30',who:'NZ',m:'KRT',was:25120,now:24600,why:'Влажность и засор после дождя',act:'списано 520 кг'},
 {d:'2026-09-30',who:'NZ',m:'PET',was:2700,now:2650,why:'Посторонние примеси, отбраковка',act:'брак 50 кг'}
];
let SALES=[
 {id:'S-87',m:'KRT',kg:18000,to:'Свой завод · линия переработки',price:46,st:'done',d:'2026-09-28',pay:'внутреннее перемещение'},
 {id:'S-88',m:'PET',kg:2400,to:'«ЭкоПласт», Караганда',price:112,st:'plan',d:'2026-10-03',pay:'предоплата 50%'},
 {id:'S-89',m:'PVD',kg:3200,to:'«ПолиПак», Алматы',price:92,st:'ship',d:'2026-10-01',pay:'по факту'},
 {id:'S-90',m:'ALU',kg:380,to:'«Металл-Ресурс»',price:520,st:'plan',d:'2026-10-05',pay:'наличные'},
 {id:'S-86',m:'PND',kg:1100,to:'«ЭкоПласт», Караганда',price:120,st:'done',d:'2026-09-21',pay:'оплачено'}
];
let PAYOUTS=[
 {id:'V1',to:'T5',who:'Рынок «Шапағат»',sum:0,how:'Наличные на месте · водитель',st:'paid',by:'MR',d:'2026-10-01',note:'860 кг картона + 240 кг ПЭТ'},
 {id:'V2',to:'T6',who:'Дворник Серик · ЖК «Жасыл Аул»',sum:0,how:'Наличные в кассе',st:'wait',by:'',d:'2026-10-01',note:'96 кг банки + 240 кг картона'},
 {id:'V3',to:'T8',who:'Бар «Хмель и Солод»',sum:31620,how:'Наличные в кассе',st:'paid',by:'GL',d:'2026-09-22',note:'93 кг банки'},
 {id:'V4',to:'T1',who:'ТРЦ «Сарыарка Плаза»',sum:0,how:'Безнал · акт за неделю',st:'wait',by:'',d:'2026-10-02',note:'сверка по весам за 28.09–04.10'},
 {id:'V5',to:'',who:'Водитель Канат · подотчёт на топливо',sum:25000,how:'Наличные в кассе',st:'paid',by:'GL',d:'2026-10-01',note:'Газель 500'}
];
/* касса смены */
let CASH={open:1200000,lines:[
 {t:'08:05',k:'out',n:'Подотчёт на топливо · Канат, Газель 500',sum:25000},
 {t:'08:07',k:'out',n:'Подотчёт на топливо и выплаты · Мейрам, Газель 712',sum:120000},
 {t:'10:30',k:'in',n:'Оплата остатка Z-2026-144 · «Бал Тәтті» · наличные',sum:105000},
 {t:'11:10',k:'in',n:'Самовывоз лотков · кафе (разовая продажа)',sum:46000},
 {t:'12:40',k:'out',n:'Выплата за банку · бар «Хмель и Солод»',sum:31620}
]};
const BANK=[['01.10','Kaspi · «Мега Упак» · предоплата 30% Z-2026-147',753000],['30.09','Kaspi · «Суши Дом» · предоплата',264000],['30.09','Банк · ТРЦ «Сарыарка Плаза» · оплата вывоза за сентябрь (мы платим)',-412000]];

/* аналитика */
const MONTHS=['Апр','Май','Июн','Июл','Авг','Сен'];
const BOXREV=[14.2,15.8,17.1,16.4,18.9,21.3];
const RAWTON=[{KRT:212,PVD:31,PET:24,PND:7,ALU:2.1},{KRT:228,PVD:34,PET:29,PND:8,ALU:2.4},{KRT:241,PVD:36,PET:33,PND:9,ALU:2.9},{KRT:236,PVD:38,PET:41,PND:9,ALU:3.4},{KRT:258,PVD:40,PET:44,PND:10,ALU:3.6},{KRT:274,PVD:43,PET:39,PND:11,ALU:3.3}];
const GROWTH=[
 ['Сейчас','Две площадки в одной системе: цех коробок и база вторсырья. Касса общая, учёт раздельный.'],
 ['Весна 2027','Стройка нового завода: в системе появляется площадка «Завод», склады, смены, линии.'],
 ['Запуск завода','Производство и реализация завода, логистика между площадками, картон с базы — сырьём на завод.'],
 ['Дальше','1С, телефония, кабинет клиента для повторных заказов — по мере необходимости, по часам.']
];
