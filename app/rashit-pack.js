/* ЦИКЛ — система для двух направлений: производство и продажа бумажных коробок и сбор вторсырья (картон, плёнка, пластик, ПЭТ, алюминий). Заявки и повторные заказы, расчёт и счёт, производство, отгрузка с подтверждением клиента; рейсы водителей с телефона, приёмка и весы, склад, выплаты в кассе, продажа партий переработчикам, аналитика собственника. Все имена, компании и суммы вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/100000)/10).toString().replace('.',',')+' млн';
const tn=kg=>(Math.round(kg/100)/10).toString().replace('.',',')+' т';
const kgf=kg=>fmt(kg)+' кг';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const dd=s=>{const [y,m,d]=s.split('-');return d+'.'+m};
const dl=s=>{const [y,m,d]=s.split('-');return d+'.'+m+'.'+y};
const TODAY='2026-10-01';
const addDays=(s,n)=>new Date(new Date(s+'T00:00:00').getTime()+n*864e5).toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
const dayOf=s=>['вс','пн','вт','ср','чт','пт','сб'][new Date(s+'T00:00:00').getDay()];

const DIRS={own:{n:'Собственник',c:'#2e3a46'},box:{n:'Коробки',c:'#9a6a32'},raw:{n:'Вторсырьё',c:'#2f7a4f'},sys:{n:'Система',c:'#5b6470'}};
const SEC=[
 {k:'own',sub:[['today','Сводка дня'],['money','Касса и деньги'],['analytics','Аналитика'],['growth','Новый завод · рост']]},
 {k:'box',sub:[['leads','Заявки'],['bfunnel','Воронка заказов'],['border','Карточка заказа'],['bclients','Клиенты и повторы'],['catalog','Изделия и цены'],['calc','Расчёт и счёт'],['prod','Производство'],['bstock','Склад коробок'],['ship','Отгрузки'],['docs','Договоры и счета']]},
 {k:'raw',sub:[['trips','Рейсы и машины'],['trip','Рейс водителя'],['points','Точки и сдатчики'],['schedule','График вывоза'],['intake','Приёмка и весы'],['rawstock','Склад вторсырья'],['sales','Отгрузка переработчикам'],['payouts','Выплаты сдатчикам']]},
 {k:'sys',sub:[['roles','Роли и права'],['mobile','Мобильная версия'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Руководитель':{av:'РШ',p:'RS',n:'Рашит',note:'Оба направления: заказы и производство коробок, рейсы и тоннаж, касса, остатки, аналитика',s:ALL.slice()},
 'Менеджер коробок':{av:'ДН',p:'DN',n:'Динара',note:'Заявки, расчёт и счёт, заказы, повторные клиенты, отгрузки и договоры',s:['leads','bfunnel','border','bclients','catalog','calc','bstock','ship','docs','mobile']},
 'Менеджер вторсырья':{av:'ЕБ',p:'EB',n:'Ербол',note:'Точки и сдатчики, цены закупа, график вывоза, продажа партий переработчикам',s:['points','schedule','trips','trip','rawstock','sales','payouts','mobile']},
 'Логист':{av:'СТ',p:'ST',n:'Саят',note:'Машины и рейсы, график вывоза, доставка коробок клиентам',s:['trips','trip','schedule','points','ship','mobile']},
 'Водитель':{av:'КН',p:'KN',n:'Канат · Газель 500',note:'Свой рейс в телефоне: точка, вид сырья, вес, цена, фото',s:['trip','mobile']},
 'Кассир':{av:'ГЛ',p:'GL',n:'Гульнара',note:'Смена кассы: оплаты клиентов, выплаты сдатчикам и водителям, сверка',s:['money','payouts','docs','mobile']},
 'Кладовщик-приёмщик':{av:'НЖ',p:'NZ',n:'Нуржан',note:'Весы и приёмка, засор, остатки, инвентаризация, брак и списание',s:['intake','rawstock','bstock','mobile']},
 'Мастер производства':{av:'ОЛ',p:'OL',n:'Олег',note:'Очередь заказов по сменам, материалы, выпуск, брак',s:['prod','bstock','border','mobile']}
};
let role='Руководитель',cur='today',theme='light';
const STAFF={RS:'Рашит',DN:'Динара',EB:'Ербол',ST:'Саят',KN:'Канат',MR:'Мейрам',AR:'Арман',GL:'Гульнара',NZ:'Нуржан',OL:'Олег'};

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

const SC={};
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const bst=k=>{const s=BSTOF(k);return `<span class="stg" style="--sc:${s.c}">${esc(s.n)}</span>`};
const clL=id=>BC(id)?`<a class="lk" onclick="card('cl','${id}')">${esc(BC(id).n)}</a>`:'—';
const ordL=id=>OR(id)?`<a class="lk mono" onclick="openOrd('${id}')">${esc(id)}</a>`:'—';
const ptL=id=>PT(id)?`<a class="lk" onclick="card('pt','${id}')">${esc(PT(id).n)}</a>`:'—';
function openOrd(id){curOrd=id;go('border')}
const carKg=c=>TRIPS.filter(t=>t.car===c).reduce((a,t)=>a+tripKg(t),0);
const carSum=c=>TRIPS.filter(t=>t.car===c).reduce((a,t)=>a+t.lines.reduce((s,l)=>s+lineSum(l),0),0);
const todayMat=()=>{const r={};TRIPS.forEach(t=>t.lines.forEach(l=>r[l.m]=(r[l.m]||0)+l.kg));return r};
const ptToday=id=>TRIPS.reduce((a,t)=>a+t.lines.filter(l=>l.pt===id).reduce((s,l)=>s+lineSum(l),0),0);
const nextRepeat=c=>c.repeat&&c.last!=='—'?addDays(c.last,c.repeat):'';
const cashIn=()=>CASH.lines.filter(l=>l.k==='in').reduce((a,l)=>a+l.sum,0),cashOut=()=>CASH.lines.filter(l=>l.k==='out').reduce((a,l)=>a+l.sum,0);
const myKey=()=>ROLES[role].p;

/* ===== Сводка дня ===== */
SC.today=()=>{
 const tm=todayMat(),tot=Object.values(tm).reduce((a,b)=>a+b,0);
 const inProd=ORDERS.filter(o=>o.st==='prod'),ready=ORDERS.filter(o=>['ready','rest'].includes(o.st)),shipping=ORDERS.filter(o=>o.st==='ship');
 const due=BCLIENTS.filter(c=>nextRepeat(c)&&nextRepeat(c)<=addDays(TODAY,7));
 return `<div class="hd"><div><h2>Сводка дня · ${dl(TODAY)}</h2><p>Два направления работают отдельно, но собственник видит их на одном экране: что в производстве и отгрузке, сколько тонн привезли машины и сколько за это заплатили, что в кассе.</p></div>
  <div class="btns"><button class="bt" onclick="act('report')">Отчёт в WhatsApp в 19:00</button></div></div>
 <div class="split">
  <div class="half box"><div class="hh"><span>КОРОБКИ</span><a onclick="go('bfunnel')">воронка заказов ›</a></div>
   <div class="nums"><div onclick="go('prod')"><b>${inProd.length}</b><small>в производстве</small><em>${fmt(inProd.reduce((a,o)=>a+o.lines.reduce((s,l)=>s+l[1],0),0))} шт</em></div>
    <div onclick="go('bfunnel')"><b>${ready.length}</b><small>готово, ждём оплату остатка</small><em>${mln(ready.reduce((a,o)=>a+oSum(o)-o.paid,0))}</em></div>
    <div onclick="go('ship')"><b>${shipping.length}</b><small>в пути к клиенту</small><em>ETA 14:30</em></div>
    <div onclick="go('bclients')"><b>${due.length}</b><small>повторных заказов ждём на неделе</small><em>${due.map(c=>c.n.replace(/[«»]/g,'').split(' ').slice(-2).join(' ')).join(', ')}</em></div></div>
   <div class="ol">${ORDERS.filter(o=>!['got'].includes(o.st)).slice(0,6).map(o=>`<div class="or" onclick="openOrd('${o.id}')"><span class="mono">${o.id}</span><b>${esc(BC(o.cl).n)}</b>${bst(o.st)}<strong>${tg(oSum(o))}</strong></div>`).join('')}</div></div>
  <div class="half raw"><div class="hh"><span>ВТОРСЫРЬЁ</span><a onclick="go('trips')">рейсы ›</a></div>
   <div class="nums"><div onclick="go('trips')"><b>${tn(tot)}</b><small>собрано сегодня</small><em>${TRIPS.filter(t=>t.st==='done').length} рейсов закрыто</em></div>
    <div onclick="go('payouts')"><b>${mln(TRIPS.reduce((a,t)=>a+t.lines.reduce((s,l)=>s+lineSum(l),0),0))}</b><small>за сырьё по ценам точек</small><em>наличными и безналом</em></div>
    <div onclick="go('rawstock')"><b>${tn(Object.values(RSTOCK).reduce((a,x)=>a+x.kg,0))}</b><small>на складе базы</small><em>${Object.values(RSTOCK).reduce((a,x)=>a+x.bales,0)} тюков</em></div>
    <div onclick="go('sales')"><b>${SALES.filter(x=>x.st!=='done').length}</b><small>партии к отгрузке</small><em>${tn(SALES.filter(x=>x.st!=='done').reduce((a,x)=>a+x.kg,0))}</em></div></div>
   <div class="cars">${CARS.map(c=>{const kg=carKg(c.id);return `<div class="car" onclick="curCar='${c.id}';go('trip')"><b>${esc(c.n)}</b><span>${STAFF[c.drv]} · ${TRIPS.filter(t=>t.car===c.id).length} ${plural(TRIPS.filter(t=>t.car===c.id).length,['рейс','рейса','рейсов'])}</span><strong>${tn(kg)}</strong><div class="mbar">${Object.keys(MAT).map(m=>{const v=TRIPS.filter(t=>t.car===c.id).reduce((a,t)=>a+t.lines.filter(l=>l.m===m).reduce((s,l)=>s+l.kg,0),0);return v?`<i style="--c:${MAT[m].c};flex:${v}" title="${MAT[m].n}: ${kgf(v)}"></i>`:''}).join('')}</div></div>`}).join('')}</div>
   <div class="legend">${Object.entries(MAT).map(([k,m])=>`<span><i style="background:${m.c}"></i>${m.n} · ${kgf(tm[k]||0)}</span>`).join('')}</div></div>
 </div>
 <div class="g2"><div class="pan"><h3>Касса сегодня</h3><div class="kv"><span>На начало смены</span><b>${tg(CASH.open)}</b></div><div class="kv"><span>Пришло</span><b class="pos">+ ${tg(cashIn())}</b></div><div class="kv"><span>Выдано: подотчёт водителям и выплаты сдатчикам</span><b class="neg">− ${tg(cashOut())}</b></div><div class="kv big"><span>Должно быть в кассе</span><b>${tg(CASH.open+cashIn()-cashOut())}</b></div><button class="bt" onclick="go('money')">Смена кассира</button></div>
 <div class="pan"><h3>Требует внимания</h3>
  ${[['r','Расхождение по весам','Газель 712, рейс 3: водитель записал 756 кг, весы — 742 кг (−14 кг).','intake'],['w','Долг клиента','«Бал Тәтті» — остаток 135 000 ₸ по заказу Z-2026-144, готово с 29.09.','bfunnel'],['w','Не сфотографировано','Газель 500, рейс 4: пластик ПНД 180 кг без фото.','trip'],['w','Клей ПВА','Осталось 140 кг — заказать до 05.10, иначе встанет склейка.','prod'],['i','Новый клиент без договора','Grill Point — договор нужен до предоплаты.','docs']].map(a=>`<div class="al ${a[0]}" onclick="go('${a[3]}')"><b>${a[1]}</b><span>${a[2]}</span></div>`).join('')}</div></div>
 ${said('«Нет общей информации: на WhatsApp пишешь, на бумаге пишет» · «Мы будем видеть, например, Газель номер 500 — сегодня завезла пять тонн семьсот»','Сводка собирается сама из рейсов, весов, заказов и кассы — без ручных отчётов.')}`;
};

/* ===== Касса ===== */
SC.money=()=>{const need=CASH.open+cashIn()-cashOut();
 return `<div class="hd"><div><h2>Касса и деньги</h2><p>Смена кассира: подотчёт водителям, выплаты сдатчикам за сырьё, оплаты клиентов за коробки. Каждая строка связана с рейсом, точкой или заказом — видно, кто, сколько и за что.</p></div><div class="btns"><button class="bt" onclick="card('cashop','in')">+ Приход</button><button class="bt" onclick="card('cashop','out')">+ Расход</button></div></div>
 <div class="g21"><div class="pan"><h3>Смена · ${dl(TODAY)} · кассир Гульнара</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Операция</th><th class="r">Приход</th><th class="r">Расход</th></tr></thead><tbody>
  <tr><td>08:00</td><td>Остаток на начало смены</td><td class="r">${fmt(CASH.open)}</td><td></td></tr>
  ${CASH.lines.map(l=>`<tr><td class="mono">${l.t}</td><td>${esc(l.n)}</td><td class="r pos">${l.k==='in'?fmt(l.sum):''}</td><td class="r neg">${l.k==='out'?fmt(l.sum):''}</td></tr>`).join('')}
  <tr class="total"><td></td><td>Должно быть в кассе</td><td class="r" colspan="2">${tg(need)}</td></tr></tbody></table></div>
  <div class="close"><label>Фактически в кассе <input id="cash_fact" class="qin w" value="${need}"></label><button class="bt p" onclick="closeShift(${need})">Закрыть смену</button></div></div>
 <div><div class="pan"><h3>Банк и Kaspi</h3>${BANK.map(b=>`<div class="kv"><span>${b[0]} · ${esc(b[1])}</span><b class="${b[2]<0?'neg':'pos'}">${b[2]<0?'− ':'+ '}${tg(Math.abs(b[2]))}</b></div>`).join('')}</div>
  <div class="pan"><h3>Кто нам должен</h3>${ORDERS.filter(o=>['ready','rest','ship'].includes(o.st)&&oSum(o)>o.paid).map(o=>`<div class="kv"><span>${clL(o.cl)} · ${ordL(o.id)}</span><b>${tg(oSum(o)-o.paid)}</b></div>`).join('')}</div>
  <div class="pan"><h3>Кому должны мы</h3>${PAYOUTS.filter(v=>v.st==='wait').map(v=>`<div class="kv"><span>${esc(v.who)}<span class="sub">${esc(v.how)}</span></span><b>${tg(v.sum||ptToday(v.to))}</b></div>`).join('')}</div></div></div>
 ${said('«Кассир — учёт денег, расчёт… Они должны видеть, кто сколько привёз и на какую сумму»')}`;};
function closeShift(d){const f=+String(document.getElementById('cash_fact').value).replace(/\s/g,'');const r=f-d;toast(r===0?'Смена закрыта: касса сходится до тенге. Отчёт ушёл руководителю.':`Смена закрыта с расхождением ${r>0?'+':''}${fmt(r)} ₸ — руководитель получил уведомление, строку можно разобрать.`)}

/* ===== Аналитика ===== */
SC.analytics=()=>{
 const last=RAWTON[RAWTON.length-1];const maxT=Math.max(...RAWTON.map(r=>Object.values(r).reduce((a,b)=>a+b,0)));
 return `<div class="hd"><div><h2>Аналитика</h2><p>Коробки: выручка, маржа по видам, повторные клиенты. Вторсырьё: тонны по видам, цена закупа против цены продажи, лучшие точки и машины, засор. Всё из ежедневной работы.</p></div></div>
 <div class="g2"><div class="pan"><h3>Коробки · выручка по месяцам, млн ₸</h3><div class="cols">${BOXREV.map((v,i)=>`<div class="col"><div class="cb"><i style="height:${v/22*100}%;background:#9a6a32"></i></div><b>${String(v).replace('.',',')}</b><small>${MONTHS[i]}</small></div>`).join('')}</div>
  <div class="tw"><table class="t"><thead><tr><th>Вид</th><th class="r">Цена</th><th class="r">Себест.</th><th class="r">Маржа</th></tr></thead><tbody>${DIV.map(d=>{const P=PRODUCTS.filter(p=>p.div===d[0]);const pr=P.reduce((a,p)=>a+p.price,0),co=P.reduce((a,p)=>a+p.cost,0);return `<tr><td>${d[1]}</td><td class="r">${fmt(pr/P.length)} ₸</td><td class="r">${fmt(co/P.length)} ₸</td><td class="r">${pct(pr-co,pr)}%</td></tr>`}).join('')}</tbody></table></div>
  <p class="mini">Повторные клиенты — 78% выручки сентября.</p></div>
 <div class="pan"><h3>Вторсырьё · тонны по месяцам</h3><div class="cols">${RAWTON.map((r,i)=>{const s=Object.values(r).reduce((a,b)=>a+b,0);return `<div class="col"><div class="cb"><div class="stack" style="height:${s/maxT*100}%">${Object.keys(MAT).map(k=>`<i style="flex:${r[k]};background:${MAT[k].c}"></i>`).join('')}</div></div><b>${Math.round(s)} т</b><small>${MONTHS[i]}</small></div>`}).join('')}</div>
  <div class="tw"><table class="t"><thead><tr><th>Вид</th><th class="r">Сентябрь</th><th class="r">Закуп ₸/кг</th><th class="r">Продажа ₸/кг</th><th class="r">Маржа с тонны</th></tr></thead><tbody>${Object.entries(MAT).map(([k,m])=>`<tr><td>${matTag(k)}</td><td class="r">${String(last[k]).replace('.',',')} т</td><td class="r">${m.buy}</td><td class="r">${m.sell}</td><td class="r"><b>${fmt((m.sell-m.buy)*1000)} ₸</b></td></tr>`).join('')}</tbody></table></div></div></div>
 <div class="g2"><div class="pan"><h3>Точки: кто даёт больше всего</h3>${POINTS.slice().sort((a,b)=>b.month-a.month).slice(0,6).map(p=>`<div class="fr"><span>${esc(p.n)}</span><div class="bar"><i style="--w:${p.month/14200*100}%;background:#2f7a4f"></i></div><b>${tn(p.month)} / мес</b></div>`).join('')}</div>
 <div class="pan"><h3>Машины за сентябрь</h3><div class="tw"><table class="t"><thead><tr><th>Машина</th><th class="r">Рейсов</th><th class="r">Тонн</th><th class="r">Т за рейс</th><th class="r">Расхождение с весами</th></tr></thead><tbody>${[['Газель 500','KN',96,118.4,'−0,4%'],['Газель 712','MR',91,104.6,'−1,1%'],['Газель 318','AR',74,82.0,'−0,3%']].map(r=>`<tr><td>${r[0]} · ${STAFF[r[1]]}</td><td class="r">${r[2]}</td><td class="r">${String(r[3]).replace('.',',')}</td><td class="r">${(r[3]/r[2]).toFixed(2).replace('.',',')}</td><td class="r ${r[4]==='−1,1%'?'warnt':''}">${r[4]}</td></tr>`).join('')}</tbody></table></div><p class="mini">Расхождение — разница между тем, что записал водитель, и весами на базе. Больше 1% — повод разобраться.</p></div></div>`;
};

/* ===== Рост ===== */
SC.growth=()=>`<div class="hd"><div><h2>Новый завод · рост</h2><p>Весной начинается стройка нового завода: производство, реализация, логисты. Систему делаем сразу так, чтобы новая площадка добавлялась как ещё один склад, цех и касса — без переписывания.</p></div></div>
 <div class="tl big">${GROWTH.map((g,i)=>`<div class="tli ${i===0?'ok':'on'}"><span class="who">${g[0]}</span><p>${esc(g[1])}</p></div>`).join('')}</div>
 <div class="sites"><div class="site on"><small>Площадка 1</small><b>Цех коробок</b><span>3 линии · склад готовой продукции · отгрузки</span></div><div class="site on"><small>Площадка 2</small><b>База вторсырья</b><span>весы · сортировка · пресс · 3 машины</span></div><div class="site plan"><small>Площадка 3 · весна 2027</small><b>Новый завод</b><span>появится в системе кнопкой «Добавить площадку»</span></div></div>
 ${said('«Весной уже будет стройка… будет завод, и производство, и реализация, логисты будут» · «Чтобы не было так, что мы сейчас делаем, а она будет недоработанная для нас»','Ирина предложила внедрить систему на текущем производстве и потом доработать под завод — так и заложено.')}`;

/* ===== Заявки ===== */
SC.leads=()=>`<div class="hd"><div><h2>Заявки</h2><p>Реклама, WhatsApp, звонки, сайт — заявки в одном списке с источником. Из заявки — заказ в один клик: клиент находится по телефону, если уже покупал, или заводится новый.</p></div></div>
 <div class="lead-l">${LEADS.map(l=>`<div class="ld ${l.st}"><div class="ldc">${esc(l.ch)}<small>${l.t}</small></div><div class="ldb"><b>${esc(l.name)}</b><span class="src">${esc(l.src)}</span><p>${esc(l.txt)}</p>
  ${l.st==='order'?`<span class="tag g">заказ ${esc(l.ord)}</span> ${ordL(l.ord)}`:`<div class="btns l"><button class="bt p" onclick="leadToOrder('${l.id}')">Создать заказ</button><button class="bt" onclick="go('calc')">Посчитать</button></div>`}</div></div>`).join('')}</div>
 <div class="note"><b>Воронки сейчас нет — теперь будет</b><p>Каждая заявка проходит этапы: заявка → расчёт → счёт → предоплата → производство → готово → остаток → отгрузка → получено. Видно, где заявки теряются и какой канал рекламы приносит заказы.</p></div>`;
function leadToOrder(id){const l=LEADS.find(x=>x.id===id);if(!l)return;const oid='Z-2026-'+(151+ORDERS.length-9);
 const cid='C'+(BCLIENTS.length+1);BCLIENTS.push({id:cid,n:l.name,kind:'Новый',city:'Астана',contact:l.ch,src:l.src,repeat:0,last:'—',avg:0,orders:0,debt:0,contract:false});
 ORDERS.unshift({id:oid,cl:cid,lines:[[/лотк/i.test(l.txt)?'LT01':'GK43',2000]],st:'new',d:TODAY,due:addDays(TODAY,7),pre:50,paid:0,deliv:'Самовывоз',mgr:'DN',note:'Из заявки: '+l.txt});
 l.st='order';l.ord=oid;curOrd=oid;go('border');toast(`Заказ ${oid} создан из заявки. Источник «${esc(l.src)}» сохранён — он попадёт в аналитику рекламы.`)}

/* ===== Воронка заказов ===== */
SC.bfunnel=()=>`<div class="hd"><div><h2>Воронка заказов</h2><p>Как у вас: стоимость → счёт → клиент оплачивает → заявка передаётся на производство → готово, сообщаем клиенту → он оплачивает остаток → самовывоз или доставка → клиент подтвердил, что получил. Карточки перетаскиваются.</p></div><div class="btns"><button class="bt p" onclick="go('calc')">+ Заказ</button></div></div>
 <div class="kanban">${BST.map(s=>{const c=ORDERS.filter(o=>o.st===s.k);return `<div class="kcol" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="this.classList.remove('over');moveOrd(event.dataTransfer.getData('t'),'${s.k}')">
  <div class="khead" style="--c:${s.c}"><b>${s.n}</b><span>${c.length} · ${mln(c.reduce((a,o)=>a+oSum(o),0))}</span></div>
  ${c.map(o=>`<div class="kcard" draggable="true" ondragstart="event.dataTransfer.setData('t','${o.id}')" onclick="openOrd('${o.id}')"><span class="mono">${o.id}</span><b>${esc(BC(o.cl).n)}</b><span>${o.lines.map(l=>esc(PRD(l[0]).n)+' × '+fmt(l[1])).join('; ')}</span>
   <div class="km"><strong>${tg(oSum(o))}</strong><em class="${o.paid?'':'no'}">${o.paid?'оплачено '+pct(o.paid,oSum(o))+'%':'не оплачено'}</em></div><div class="kf"><span>до ${dd(o.due)} · ${esc(o.deliv)}</span>${o.due<TODAY&&o.st!=='got'?'<span class="neg">срок прошёл</span>':''}</div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 ${said('«Когда стоимость — счёт на оплату выставляет, клиент оплачивает. Оплата поступила — заявка передаётся на производство. Как готова — клиенту сообщаем, что готова, он оплачивает остаток» · «Отслеживать, когда он получил»')}`;
function moveOrd(id,k){const o=OR(id);if(!o||o.st===k)return;const i=BST.findIndex(s=>s.k===k);
 if(i>=4&&!o.paid){toast('В производство — только после предоплаты. Отметьте оплату в карточке заказа или в кассе.');return}
 if(k==='ship'&&o.paid<oSum(o)&&o.pre<100){toast('Отгрузка — после оплаты остатка. Система не даст отгрузить неоплаченный заказ.');return}
 o.st=k;if(k==='prod'&&!PRODQ.find(p=>p.ord===id))o.lines.forEach(l=>PRODQ.push({ord:id,item:l[0],q:l[1],done:0,line:'Линия 1 · высечка + печать',shift:dd(addDays(TODAY,1))+' · день',st:'plan',scrap:0}));
 render();toast(k==='ready'?`Клиенту ушло сообщение в WhatsApp: «Заказ ${id} готов, остаток к оплате ${tg(oSum(o)-o.paid)}».`:k==='prod'?'Заказ передан мастеру производства — появился в очереди смен.':k==='got'?'Клиент подтвердил получение — заказ закрыт, следующий повтор система ждёт по периодичности.':`${id} → ${BSTOF(k).n}`)}

/* ===== Карточка заказа ===== */
function payOrd(id,kind){const o=OR(id);const s=oSum(o);if(kind==='pre'){o.paid=Math.round(s*o.pre/100);if(o.st==='inv'||o.st==='calc'||o.st==='new')o.st='pre'}else{o.paid=s;if(o.st==='rest'||o.st==='ready')o.st='rest'}render();toast(kind==='pre'?`Предоплата ${o.pre}% отмечена: ${tg(o.paid)}. Заказ можно передавать в производство.`:'Заказ оплачен полностью — можно отгружать.')}
SC.border=()=>{const o=OR(curOrd)||ORDERS[0];const c=BC(o.cl);const s=oSum(o),si=BST.findIndex(x=>x.k===o.st);
 return `<div class="crumb"><a onclick="go('bfunnel')">Воронка заказов</a> › ${esc(o.id)}</div>
 <div class="hd"><div><h2>Заказ ${esc(o.id)} · ${esc(c.n)}</h2><p>${clL(o.cl)} · от ${dl(o.d)} · срок ${dl(o.due)} · ${esc(o.deliv)} · менеджер ${STAFF[o.mgr]}${o.note?' · '+esc(o.note):''}</p></div>
  <div class="btns"><button class="bt" onclick="card('inv','${o.id}')">Счёт на оплату</button>${o.paid<s*o.pre/100?`<button class="bt p" onclick="payOrd('${o.id}','pre')">Предоплата получена</button>`:o.paid<s?`<button class="bt p" onclick="payOrd('${o.id}','all')">Остаток получен</button>`:''}${si<BST.length-1?`<button class="bt" onclick="moveOrd('${o.id}','${BST[si+1].k}')">→ ${BST[si+1].n}</button>`:''}</div></div>
 <div class="steps">${BST.map((x,i)=>`<div class="stp ${i<si?'done':i===si?'on':''}"><i>${i<si?'✓':i+1}</i>${x.n}</div>`).join('')}</div>
 <div class="g21"><div class="pan"><h3>Состав заказа</h3><div class="tw"><table class="t"><thead><tr><th>Изделие</th><th>Размер · материал</th><th class="r">Кол-во</th><th class="r">Цена</th><th class="r">Сумма</th></tr></thead><tbody>
  ${o.lines.map(l=>{const p=PRD(l[0]);return `<tr><td><b>${esc(p.n)}</b><span class="sub">${esc(DIVN(p.div))}</span></td><td class="mini">${esc(p.size)} · ${esc(p.mat)}</td><td class="r">${fmt(l[1])}</td><td class="r">${p.price} ₸</td><td class="r">${fmt(l[1]*p.price)}</td></tr>`}).join('')}
  <tr class="total"><td>Итого</td><td></td><td class="r">${fmt(o.lines.reduce((a,l)=>a+l[1],0))} шт</td><td></td><td class="r">${tg(s)}</td></tr></tbody></table></div>
  <div class="kv"><span>Себестоимость · маржа</span><b>${tg(oCost(o))} · ${pct(s-oCost(o),s)}%</b></div></div>
 <div><div class="pan"><h3>Оплата</h3><div class="kv"><span>Предоплата ${o.pre}%</span><b>${tg(s*o.pre/100)}</b></div><div class="kv"><span>Оплачено</span><b class="pos">${tg(o.paid)}</b></div><div class="kv big"><span>Остаток</span><b>${tg(s-o.paid)}</b></div><div class="bar"><i class="g" style="--w:${pct(o.paid,s)}%"></i></div></div>
  <div class="pan"><h3>Производство</h3>${PRODQ.filter(p=>p.ord===o.id).map(p=>`<div class="kv"><span>${esc(PRD(p.item).n)} · ${esc(p.shift)}</span><b>${fmt(p.done)} / ${fmt(p.q)}</b></div>`).join('')||'<p class="mini">Попадёт в очередь после предоплаты.</p>'}</div>
  <div class="pan"><h3>Отгрузка</h3><div class="kv"><span>Способ</span><b>${esc(o.deliv)}</b></div><div class="kv"><span>Подтверждение клиента</span><b>${o.st==='got'?'<span class="tag g">получено · фото</span>':'ждём'}</b></div>${!c.contract?'<div class="al w"><b>Новый клиент</b><span>Договор нужен до предоплаты — сформируйте из реквизитов.</span></div>':''}</div></div></div>`;};

/* ===== Клиенты и повторы ===== */
SC.bclients=()=>`<div class="hd"><div><h2>Клиенты и повторы</h2><p>Постоянные клиенты заказывают каждый месяц или две недели. Система помнит, что и сколько брали, когда была последняя заявка и когда ждать следующую. Повтор — одной кнопкой: копия прошлого заказа с актуальными ценами.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Откуда</th><th class="r">Заказов</th><th class="r">Средний заказ</th><th>Периодичность</th><th>Последний</th><th>Ждём следующий</th><th class="r">Долг</th><th></th></tr></thead><tbody>
 ${BCLIENTS.map(c=>{const n=nextRepeat(c);const late=n&&n<TODAY;return `<tr onclick="card('cl','${c.id}')"><td><b>${esc(c.n)}</b><span class="sub">${esc(c.kind)} · ${esc(c.contact)}</span></td><td>${esc(c.src)}</td><td class="r">${c.orders}</td><td class="r">${c.avg?tg(c.avg):'—'}</td><td>${c.repeat?'каждые '+c.repeat+' дн.':'—'}</td><td>${c.last==='—'?'—':dl(c.last)}</td><td>${n?`<b class="${late?'neg':n<=addDays(TODAY,7)?'warnt':''}">${dl(n)}</b>${late?' <span class="tag r">позвонить</span>':''}`:'—'}</td><td class="r ${c.debt?'neg':''}">${c.debt?fmt(c.debt):'—'}</td><td>${c.orders?`<button class="bt" onclick="event.stopPropagation();repeatOrd('${c.id}')">Повторить</button>`:''}</td></tr>`}).join('')}
 </tbody></table></div>
 ${said('«Есть постоянные, которые ежемесячно заказывают… Заявка поступила — обновили и заново скопировали… Мы видим, сколько этот клиент заказал, когда он заказывал, когда последняя заявка была»')}`;
function repeatOrd(cid){const last=ORDERS.filter(o=>o.cl===cid).sort((a,b)=>a.d<b.d?1:-1)[0];const oid='Z-2026-'+(151+ORDERS.length-9);
 ORDERS.unshift({id:oid,cl:cid,lines:last?last.lines.map(l=>[l[0],l[1]]):[['PZ30',2000]],st:'inv',d:TODAY,due:addDays(TODAY,7),pre:50,paid:0,deliv:last?last.deliv:'Доставка',mgr:'DN',note:'Повтор заказа'+(last?' '+last.id:'')});
 const c=BC(cid);c.last=TODAY;c.orders++;curOrd=oid;go('border');toast(`Повтор готов: ${oid} — те же позиции, цены актуальные, счёт сформирован. Осталось отправить клиенту.`)}

/* ===== Изделия ===== */
let divF='all';
SC.catalog=()=>`<div class="hd"><div><h2>Изделия и цены</h2><p>Подразделения — пицца, гофрокороба, лотки, кондитерская упаковка, с печатью под заказ — и внутри размеры. Есть готовые на складе и изготавливаемые под заказ с логотипом клиента.</p></div><div class="btns"><button class="bt p" onclick="act('newprod')">+ Изделие</button></div></div>
 <div class="filt">${[['all','Все'],...DIV].map(d=>`<button class="${divF===d[0]?'on':''}" onclick="divF='${d[0]}';render()">${d[1]}</button>`).join('')}</div>
 <div class="tw"><table class="t"><thead><tr><th>Изделие</th><th>Подразделение</th><th>Размер, мм</th><th>Материал</th><th class="r">Цена за шт</th><th class="r">Себестоимость</th><th class="r">Маржа</th><th class="r">На складе</th></tr></thead><tbody>
 ${PRODUCTS.filter(p=>divF==='all'||p.div===divF).map(p=>`<tr onclick="calcP='${p.id}';go('calc')"><td><b>${esc(p.n)}</b>${p.ready?'':' <span class="tag w">под заказ</span>'}</td><td>${esc(DIVN(p.div))}</td><td class="mono">${esc(p.size)}</td><td class="mini">${esc(p.mat)}</td><td class="r">${p.price} ₸</td><td class="r">${p.cost} ₸</td><td class="r">${pct(p.price-p.cost,p.price)}%</td><td class="r">${p.stock?fmt(p.stock):'—'}</td></tr>`).join('')}
 </tbody></table></div>`;

/* ===== Расчёт и счёт ===== */
let calcP='PZ33',calcQ=5000,calcPrint=0,calcCl='C6';
const calcPrice=()=>{const p=PRD(calcP);const disc=calcQ>=10000?.06:calcQ>=5000?.03:0;const pr=Math.round(p.price*(1-disc))+(calcPrint?[0,18,30][calcPrint]:0);return {p,disc,pr,sum:pr*calcQ,cost:(p.cost+(calcPrint?[0,11,19][calcPrint]:0))*calcQ}};
SC.calc=()=>{const r=calcPrice();
 return `<div class="hd"><div><h2>Расчёт и счёт</h2><p>Менеджер выбирает изделие, тираж и печать — цена со скидкой за объём считается сразу, маржа видна только руководителю и менеджеру. Счёт формируется по реквизитам клиента; номер и дата — по вашей нумерации, позже можно связать с 1С.</p></div></div>
 <div class="g2"><div class="pan"><h3>Параметры</h3><div class="form">
  <label>Клиент<select onchange="calcCl=this.value">${BCLIENTS.map(c=>`<option value="${c.id}" ${c.id===calcCl?'selected':''}>${esc(c.n)}</option>`).join('')}</select></label>
  <label>Изделие<select onchange="calcP=this.value;render()">${PRODUCTS.map(p=>`<option value="${p.id}" ${p.id===calcP?'selected':''}>${esc(p.n)}</option>`).join('')}</select></label>
  <label>Тираж, шт<input value="${calcQ}" onchange="calcQ=Math.max(1,+this.value||1);render()"></label>
  <label>Печать логотипа<select onchange="calcPrint=+this.value;render()">${['Без печати','1 цвет (+18 ₸/шт)','2 цвета (+30 ₸/шт)'].map((x,i)=>`<option value="${i}" ${i===calcPrint?'selected':''}>${x}</option>`).join('')}</select></label></div>
  <p class="mini">Скидка за объём: от 5 000 шт — 3%, от 10 000 шт — 6%. Правила задаёт руководитель.</p></div>
 <div class="pan"><h3>Итог</h3><div class="kv"><span>${esc(r.p.n)}</span><b>${fmt(calcQ)} шт</b></div><div class="kv"><span>Цена за шт${r.disc?` · скидка ${r.disc*100}%`:''}</span><b>${r.pr} ₸</b></div><div class="kv big"><span>Сумма</span><b>${tg(r.sum)}</b></div><div class="kv"><span>Себестоимость · маржа</span><b>${tg(r.cost)} · ${pct(r.sum-r.cost,r.sum)}%</b></div><div class="kv"><span>Предоплата 50%</span><b>${tg(r.sum/2)}</b></div>
  <div class="btns l"><button class="bt" onclick="act('kp')">КП в WhatsApp</button><button class="bt p" onclick="calcToOrder()">Создать заказ и счёт</button></div></div></div>`;};
function calcToOrder(){const r=calcPrice();const oid='Z-2026-'+(151+ORDERS.length-9);ORDERS.unshift({id:oid,cl:calcCl,lines:[[calcP,calcQ]],st:'inv',d:TODAY,due:addDays(TODAY,7),pre:50,paid:0,deliv:'Доставка',mgr:'DN',note:calcPrint?'Печать логотипа':''});curOrd=oid;go('border');toast(`Заказ ${oid} создан, счёт на предоплату 50% — ${tg(r.sum/2)} — сформирован и готов к отправке.`)}

/* ===== Производство ===== */
SC.prod=()=>`<div class="hd"><div><h2>Производство</h2><p>После предоплаты заказ попадает мастеру: линия, смена, план и факт выпуска, брак. Менеджер видит, на каком этапе его заказ, без звонков в цех.</p></div><div class="btns"><button class="bt" onclick="act('plan')">План на неделю</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Заказ</th><th>Изделие</th><th>Линия</th><th>Смена</th><th class="r">План</th><th class="r">Сделано</th><th>Выпуск</th><th class="r">Брак</th><th></th></tr></thead><tbody>
 ${PRODQ.map((p,i)=>`<tr><td>${ordL(p.ord)}<span class="sub">${esc(BC(OR(p.ord).cl).n)}</span></td><td>${esc(PRD(p.item).n)}</td><td class="mini">${esc(p.line)}</td><td>${esc(p.shift)}</td><td class="r">${fmt(p.q)}</td><td class="r"><b>${fmt(p.done)}</b></td><td style="min-width:120px"><div class="bar"><i class="${p.done>=p.q?'g':''}" style="--w:${pct(p.done,p.q)}%"></i></div></td><td class="r ${p.scrap?'warnt':''}">${p.scrap||'—'}</td><td>${p.done<p.q?`<button class="bt" onclick="prodAdd(${i})">+ выпуск смены</button>`:'<span class="tag g">готово</span>'}</td></tr>`).join('')}
 </tbody></table></div>
 <div class="g2"><div class="pan"><h3>Материалы цеха</h3>${BMAT.map(m=>`<div class="kv"><span>${esc(m[0])}</span><b>${esc(m[1])} · <span class="${/заказать/.test(m[2])?'warnt':'mini'}">${esc(m[2])}</span></b></div>`).join('')}</div>
 <div class="pan"><h3>Картон с базы — на переработку</h3><p class="mini">Картон, собранный второй бригадой, передаётся на свой завод внутренним перемещением — видно, сколько своего сырья ушло в производство.</p><div class="kv"><span>Сентябрь: передано с базы</span><b>18 т</b></div><div class="kv"><span>Внутренняя цена</span><b>46 ₸/кг</b></div></div></div>`;
function prodAdd(i){const p=PRODQ[i];const add=Math.min(p.q-p.done,Math.round(p.q*.35));p.done+=add;p.scrap+=Math.round(add*.015);p.st=p.done>=p.q?'done':'work';const o=OR(p.ord);if(o&&PRODQ.filter(x=>x.ord===o.id).every(x=>x.done>=x.q)&&o.st==='prod'){o.st='ready';toast(`Заказ ${o.id} изготовлен полностью — переведён в «Готово», клиенту ушло сообщение.`)}else toast(`Выпуск смены: +${fmt(add)} шт. Брак ${Math.round(add*.015)} шт записан.`);render()}

/* ===== Склад коробок ===== */
SC.bstock=()=>`<div class="hd"><div><h2>Склад коробок</h2><p>Готовые изделия и сырьё цеха: поступления из производства, резерв под заказы, отгрузки, инвентаризация, брак и списание.</p></div><div class="btns"><button class="bt" onclick="act('inv')">Инвентаризация</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Изделие</th><th>Подразделение</th><th class="r">На складе</th><th class="r">В резерве</th><th class="r">Свободно</th><th class="r">Стоимость</th></tr></thead><tbody>
 ${PRODUCTS.filter(p=>p.ready).map(p=>{const r=ORDERS.filter(o=>['inv','pre','ready','rest'].includes(o.st)).reduce((a,o)=>a+o.lines.filter(l=>l[0]===p.id).reduce((s,l)=>s+l[1],0),0);const f=p.stock-r;return `<tr><td><b>${esc(p.n)}</b></td><td>${esc(DIVN(p.div))}</td><td class="r">${fmt(p.stock)}</td><td class="r">${r?fmt(r):'—'}</td><td class="r"><b class="${f<0?'neg':''}">${fmt(f)}</b></td><td class="r">${fmt(p.stock*p.cost)}</td></tr>`}).join('')}
 </tbody></table></div>
 ${said('«Остатки… инвентаризации… списание, брак бывает»')}`;

/* ===== Отгрузки ===== */
SC.ship=()=>`<div class="hd"><div><h2>Отгрузки</h2><p>Самовывоз или доставка — как договорились с клиентом. Отгрузка открывается только после оплаты остатка. Клиент подтверждает получение — фото накладной в карточке.</p></div></div>
 <div class="g2">${ORDERS.filter(o=>['ready','rest','ship','got'].includes(o.st)).map(o=>`<div class="pan shp"><div class="row"><div><h3>${ordL(o.id)} · ${esc(BC(o.cl).n)}</h3><p>${o.lines.map(l=>esc(PRD(l[0]).n)+' × '+fmt(l[1])).join('; ')}</p></div>${bst(o.st)}</div>
  <div class="kv"><span>Способ</span><b>${esc(o.deliv)}${o.deliv==='Доставка'?' · Газель 318, Арман':''}</b></div><div class="kv"><span>Оплата</span><b>${o.paid>=oSum(o)?'<span class="pos">оплачено полностью</span>':'остаток '+tg(oSum(o)-o.paid)}</b></div>
  <div class="btns l">${o.st==='ship'?`<button class="bt p" onclick="moveOrd('${o.id}','got')">Клиент получил</button>`:o.st==='got'?'<span class="tag g">получено, подтверждено фото</span>':`<button class="bt" onclick="moveOrd('${o.id}','ship')">Отгрузить</button>`}</div></div>`).join('')}</div>`;

/* ===== Договоры и счета ===== */
SC.docs=()=>`<div class="hd"><div><h2>Договоры и счета</h2><p>С новым клиентом составляется договор, с постоянным — только счета. Документы формируются из реквизитов, нумерация ваша. Интеграцию с 1С можно добавить позже — номера и даты счетов тогда совпадут.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Клиент</th><th>Основание</th><th class="r">Сумма</th><th>Статус</th></tr></thead><tbody>
 ${[['Договор поставки № 26/031','C5','новый клиент','—','черновик'],['Счёт № 412','C2','Z-2026-148',oSum(OR('Z-2026-148')),'отправлен в WhatsApp'],['Счёт № 409','C4','Z-2026-147',oSum(OR('Z-2026-147')),'оплачено 30%'],['Счёт № 404','C1','Z-2026-142',oSum(OR('Z-2026-142')),'оплачено 50%'],['Накладная № 388','C1','Z-2026-136',oSum(OR('Z-2026-136')),'подписана клиентом'],['Договор поставки № 26/024','C4','рамочный, 2026','—','подписан']].map(d=>`<tr><td><b>${d[0]}</b></td><td>${clL(d[1])}</td><td>${d[2].startsWith('Z-')?ordL(d[2]):esc(d[2])}</td><td class="r">${typeof d[3]==='number'?fmt(d[3]):d[3]}</td><td><span class="tag ${/подписан|оплачено 5|оплачено 3/.test(d[4])?'g':/черновик/.test(d[4])?'w':''}">${d[4]}</span></td></tr>`).join('')}
 </tbody></table></div>`;

/* ===== Рейсы и машины ===== */
SC.trips=()=>`<div class="hd"><div><h2>Рейсы и машины · ${dl(TODAY)}</h2><p>Водитель заполняет рейс в телефоне: точка, вид сырья, вес, цена, фото. Здесь это сразу видно по каждой машине: сколько рейсов, сколько тонн и на какую сумму, и что показали весы на базе.</p></div><div class="btns"><button class="bt" onclick="go('schedule')">График вывоза</button></div></div>
 ${CARS.map(c=>{const T=TRIPS.filter(t=>t.car===c.id);return `<div class="pan carp"><div class="row"><div><h3>${esc(c.n)} · ${STAFF[c.drv]}</h3><p>${T.length} ${plural(T.length,['рейс','рейса','рейсов'])} · собрано ${tn(carKg(c.id))} · по ценам точек ${tg(carSum(c.id))}</p></div><button class="bt" onclick="curCar='${c.id}';go('trip')">Открыть как водитель</button></div>
  <div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Точки и сырьё</th><th class="r">Записал водитель</th><th class="r">Весы на базе</th><th class="r">Разница</th><th class="r">Сумма</th><th>Статус</th></tr></thead><tbody>
  ${T.map(t=>{const kg=tripKg(t),d=t.weighed?t.weighed-kg:0;return `<tr><td class="mono">№${t.n}</td><td>${t.lines.map(l=>`${ptL(l.pt)} · ${matTag(l.m)} ${l.kg?kgf(l.kg):''}${l.ph?'':' <span class="tag w">нет фото</span>'}`).join('<br>')}</td><td class="r">${kg?kgf(kg):'—'}</td><td class="r">${t.weighed?kgf(t.weighed):'—'}</td><td class="r ${Math.abs(d)>kg*.01?'neg':''}">${t.weighed?(d>0?'+':'')+fmt(d)+' кг':'—'}</td><td class="r">${fmt(t.lines.reduce((a,l)=>a+lineSum(l),0))}</td><td>${t.st==='done'?'<span class="tag g">на базе</span>':t.st==='go'?'<span class="tag w">в пути</span>':'<span class="tag">план</span>'}</td></tr>`}).join('')}</tbody></table></div></div>`}).join('')}
 ${said('«Забивает точку А: например, сколько тонн картона забрали, по какой цене; точка Б — сколько картона забрали… И мы будем видеть, например, Газель номер 500»')}`;

/* ===== Рейс водителя: большой телефон ===== */
let tripPt='T3',tripM='KRT',tripKgv='',tripPh=false;
SC.trip=()=>{const c=CARS.find(x=>x.id===curCar)||CARS[0];const T=TRIPS.filter(t=>t.car===c.id);const cur=T.find(t=>t.st==='go')||T[T.length-1];const p=PT(tripPt);const pr=(p.price&&p.price[tripM])||MAT[tripM].buy;
 return `<div class="hd"><div><h2>Рейс водителя · ${esc(c.n)}</h2><p>Так это выглядит у водителя в телефоне: крупные кнопки, цена подставляется из договорённости с точкой, фото обязательно. Интернет пропал — запись сохранится и отправится, когда появится связь.</p></div>
  <div class="btns">${CARS.map(x=>`<button class="bt ${x.id===c.id?'p':''}" onclick="curCar='${x.id}';render()">${esc(x.n)}</button>`).join('')}</div></div>
 <div class="drv"><div class="phone big"><div class="pht"><b>${esc(c.n)} · ${STAFF[c.drv]}</b><small>рейс №${cur.n} · сегодня ${tn(carKg(c.id))}</small></div><div class="pb">
  <div class="dlab">Точка</div><div class="dbtns">${POINTS.map(x=>`<button class="${x.id===tripPt?'on':''}" onclick="tripPt='${x.id}';tripM=PT('${x.id}').mats[0];render()">${esc(x.n.replace(/«|»/g,'').slice(0,22))}</button>`).join('')}</div>
  <div class="dlab">Что забрали</div><div class="dbtns m">${p.mats.map(m=>`<button class="${m===tripM?'on':''}" style="--c:${MAT[m].c}" onclick="tripM='${m}';render()">${MAT[m].n}</button>`).join('')}</div>
  <div class="dlab">Вес, кг</div><input class="dkg" id="tkg" inputmode="numeric" value="${tripKgv}" placeholder="например, 640" oninput="tripKgv=this.value;document.getElementById('tsum').textContent=new Intl.NumberFormat('ru-RU').format((+this.value||0)*${pr})+' ₸'">
  <div class="dprice"><span>Цена точки: ${pr} ₸/кг</span><b id="tsum">${fmt((+tripKgv||0)*pr)} ₸</b></div>
  <div class="dph ${tripPh?'on':''}" onclick="tripPh=!tripPh;render()">${tripPh?'✓ Фото сделано':'Сфотографировать груз'}</div>
  <div class="pbtn" onclick="addTripLine()">Записать</div>
  <div class="dlist">${cur.lines.filter(l=>l.kg).map(l=>`<div class="pi"><span>${esc(PT(l.pt).n.slice(0,24))}<small>${MAT[l.m].n} · ${l.ts}</small></span><b>${kgf(l.kg)}</b></div>`).join('')}</div>
  <div class="pbtn alt" onclick="finishTrip()">Еду на базу — закрыть рейс</div></div></div>
 <div class="drvr"><div class="pan"><h3>Как оплачивается сдатчик</h3><div class="kv"><span>Точка</span><b>${esc(p.n)}</b></div><div class="kv"><span>Договорённость</span><b>${Object.entries(p.price||{}).map(([m,v])=>MAT[m].n+' — '+v+' ₸/кг').join('; ')}</b></div><div class="kv"><span>Оплата</span><b>${esc(p.pay)}</b></div><div class="kv"><span>График</span><b>${esc(p.sch)}</b></div><p class="mini">Если «наличные на месте» — сумма списывается с подотчёта водителя; если «в кассе» — кассир видит выплату в своей смене.</p></div>
 ${said('«Водителю, который ездит на Газели, ему в телефоне это всё заполнять» · «Чтобы удобно было и водителям, и нам — заполнять данные в телефоне»')}</div></div>`;};
function addTripLine(){const kg=+String(tripKgv).replace(/\s/g,'');if(!kg||kg<1){toast('Введите вес в килограммах');return}if(!tripPh){toast('Сделайте фото груза — без фото запись не принимается.');return}
 const T=TRIPS.filter(t=>t.car===curCar);let cur=T.find(t=>t.st==='go');if(!cur){cur={car:curCar,n:T.length+1,st:'go',lines:[],weighed:0};TRIPS.push(cur)}
 cur.lines.push({pt:tripPt,m:tripM,kg,ph:true,ts:'15:4'+cur.lines.length});const s=lineSum(cur.lines[cur.lines.length-1]);tripKgv='';tripPh=false;render();
 toast(`Записано: ${esc(PT(tripPt).n)} · ${MAT[tripM].n} ${kgf(kg)} на ${tg(s)}. Руководитель и кассир видят это сразу.`)}
function finishTrip(){const cur=TRIPS.find(t=>t.car===curCar&&t.st==='go');if(!cur){toast('Открытого рейса нет.');return}cur.st='done';cur.weighed=Math.round(tripKg(cur)*.992);render();toast(`Рейс №${cur.n} закрыт. Весы на базе: ${kgf(cur.weighed)} — разница с записью водителя ${fmt(cur.weighed-tripKg(cur))} кг.`)}

/* ===== Точки и сдатчики ===== */
SC.points=()=>`<div class="hd"><div><h2>Точки и сдатчики</h2><p>Компании, магазины, рынки и дворники — у каждой точки свои виды сырья, цены за килограмм, способ оплаты и график. Видно, когда забирали в последний раз и сколько точка даёт в месяц.</p></div><div class="btns"><button class="bt p" onclick="card('newpt')">+ Точка</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Точка</th><th>Тип</th><th>Сырьё и цена, ₸/кг</th><th>График</th><th>Оплата</th><th>Последний вывоз</th><th class="r">В месяц</th></tr></thead><tbody>
 ${POINTS.map(p=>`<tr onclick="card('pt','${p.id}')"><td><b>${esc(p.n)}</b><span class="sub">${esc(p.addr)}</span></td><td>${esc(p.kind)}</td><td>${p.mats.map(m=>matTag(m)+' '+(p.price[m]||'—')).join(' ')}</td><td>${esc(p.sch)}</td><td class="mini">${esc(p.pay)}</td><td>${dd(p.last)}${daysBetween(p.last,TODAY)>=4?' <span class="tag w">'+daysBetween(p.last,TODAY)+' дн.</span>':''}</td><td class="r">${tn(p.month)}</td></tr>`).join('')}
 </tbody></table></div>
 ${said('«Разные компании… мы сами забираем, у дворников это есть» · «Есть картон, есть плёнка, есть пластик и есть бутылки, пластиковые и алюминиевые банки»')}`;

/* ===== График вывоза ===== */
SC.schedule=()=>{const days=[];for(let i=0;i<7;i++)days.push(addDays(TODAY,i));
 const on=(p,d)=>{const w=dayOf(d);if(/Ежедневно/.test(p.sch))return true;if(/Пн, ср, пт/.test(p.sch))return ['пн','ср','пт'].includes(w);if(/Вт, пт/.test(p.sch))return ['вт','пт'].includes(w);if(/Пн, чт/.test(p.sch))return ['пн','чт'].includes(w);if(/неделю/.test(p.sch))return w==='пт';return false};
 return `<div class="hd"><div><h2>График вывоза</h2><p>Постоянные точки — по расписанию: каждый день, по дням недели, раз в неделю. «По звонку» — заявка от точки ставится логистом на ближайший рейс. Логист видит загрузку машин на неделю.</p></div></div>
 <div class="pan"><div class="wk"><div></div>${days.map(d=>`<div class="wkh ${d===TODAY?'td':''}"><b>${dd(d)}</b><small>${dayOf(d)}</small></div>`).join('')}
 ${POINTS.map(p=>`<div class="wkn"><b>${esc(p.n)}</b><span>${esc(p.sch)}</span></div>${days.map(d=>`<div class="wkc ${on(p,d)?'on':''}">${on(p,d)?(p.id==='T1'||p.id==='T4'?'500':p.id==='T5'||p.id==='T7'?'712':p.id==='T2'?'500':'318'):''}</div>`).join('')}`).join('')}</div>
 <div class="legend"><span><i style="background:#2f7a4f"></i>вывоз по графику · номер машины</span><span>По звонку: Ақ Жол Логистик (от 500 кг), бар «Хмель и Солод»</span></div></div>`;};

/* ===== Приёмка и весы ===== */
SC.intake=()=>`<div class="hd"><div><h2>Приёмка и весы</h2><p>Машина заезжает на весы: брутто, тара, нетто. Приёмщик отмечает засор и сорт. Система сравнивает с тем, что записал водитель на точках, — расхождение больше 1% подсвечивается.</p></div><div class="btns"><button class="bt p" onclick="weighNext()">Взвесить машину в очереди</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Машина · рейс</th><th>Сырьё</th><th class="r">Брутто</th><th class="r">Тара</th><th class="r">Нетто</th><th class="r">По записи водителя</th><th class="r">Разница</th><th class="r">Засор</th></tr></thead><tbody>
 ${TRIPS.filter(t=>t.weighed).map(t=>{const kg=tripKg(t),d=t.weighed-kg;const tara=CARS.find(c=>c.id===t.car).id==='500'?2140:2210;return `<tr><td>${esc(CARS.find(c=>c.id===t.car).n)} · №${t.n}</td><td>${[...new Set(t.lines.map(l=>l.m))].map(matTag).join(' ')}</td><td class="r">${fmt(t.weighed+tara)}</td><td class="r">${fmt(tara)}</td><td class="r"><b>${fmt(t.weighed)}</b></td><td class="r">${fmt(kg)}</td><td class="r ${Math.abs(d)>kg*.01?'neg':''}">${d>0?'+':''}${fmt(d)}</td><td class="r">${t.lines.some(l=>l.pt==='T5')?'3%':'1%'}</td></tr>`}).join('')}
 </tbody></table></div>
 <div class="note"><b>Засор вычитается из веса</b><p>Мокрый картон и мусор в мешках — процент засора по точке копится в аналитике: видно, с кем пересмотреть цену.</p></div>`;
function weighNext(){const t=TRIPS.find(x=>x.st==='go');if(!t){toast('Очередь на весах пуста.');return}t.st='done';t.weighed=Math.round(tripKg(t)*.991);render();toast(`${esc(CARS.find(c=>c.id===t.car).n)}, рейс ${t.n}: нетто ${kgf(t.weighed)}. Остатки склада пополнены.`)}

/* ===== Склад вторсырья ===== */
SC.rawstock=()=>`<div class="hd"><div><h2>Склад вторсырья</h2><p>Остатки по видам после приёмки и прессовки: килограммы, тюки, средняя цена закупа и стоимость. Инвентаризация, брак и списание — с причиной.</p></div><div class="btns"><button class="bt" onclick="card('inv')">Инвентаризация</button></div></div>
 <div class="stk">${Object.entries(RSTOCK).map(([k,v])=>`<div class="sk" style="--c:${MAT[k].c}"><small>${MAT[k].n}</small><b>${tn(v.kg)}</b><span>${v.bales} тюков · закуп ${String(v.avg).replace('.',',')} ₸/кг</span><em>${tg(v.kg*v.avg)}</em><i>→ ${MAT[k].to}</i></div>`).join('')}</div>
 <div class="pan"><h3>Инвентаризации и списания</h3>${INV.map(r=>`<div class="kv"><span>${dd(r.d)} · ${STAFF[r.who]} · ${matTag(r.m)} ${esc(r.why)}</span><b>${fmt(r.was)} → ${fmt(r.now)} кг · ${esc(r.act)}</b></div>`).join('')}</div>
 ${said('«Нам нужно видеть остатки… инвентаризации… списание, брак бывает»')}`;

/* ===== Отгрузка переработчикам ===== */
SC.sales=()=>`<div class="hd"><div><h2>Отгрузка переработчикам</h2><p>Картон уходит на свой завод внутренним перемещением, плёнка, ПЭТ, ПНД и алюминий — партиями компаниям, которые перерабатывают. Видно цену продажи против цены закупа и маржу партии.</p></div><div class="btns"><button class="bt p" onclick="card('sale')">+ Партия</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Партия</th><th>Сырьё</th><th>Кому</th><th class="r">Вес</th><th class="r">Цена ₸/кг</th><th class="r">Сумма</th><th class="r">Маржа партии</th><th>Дата</th><th>Статус</th></tr></thead><tbody>
 ${SALES.map(x=>`<tr><td class="mono">${x.id}</td><td>${matTag(x.m)}</td><td>${esc(x.to)}<span class="sub">${esc(x.pay)}</span></td><td class="r">${tn(x.kg)}</td><td class="r">${x.price}</td><td class="r">${fmt(x.kg*x.price)}</td><td class="r pos">${fmt(x.kg*(x.price-RSTOCK[x.m].avg))}</td><td>${dd(x.d)}</td><td>${x.st==='done'?'<span class="tag g">закрыто</span>':x.st==='ship'?'<span class="tag w">в пути</span>':`<button class="bt" onclick="SALES.find(s=>s.id==='${x.id}').st='ship';RSTOCK['${x.m}'].kg-=${x.kg};render();toast('Партия отгружена — остаток склада уменьшен.')">Отгрузить</button>`}</td></tr>`).join('')}
 </tbody></table></div>
 ${said('«Картон — наш завод уже перерабатывает» · «Мы сдаём компаниям, которые уже сами перерабатывают. Мы занимаемся сбором»')}`;

/* ===== Выплаты сдатчикам ===== */
SC.payouts=()=>`<div class="hd"><div><h2>Выплаты сдатчикам</h2><p>За сырьё платим по-разному: наличными на месте (с подотчёта водителя), в кассе базы или безналом по акту. Кассир видит, кому и сколько, — сумма считается из рейсов и цен точки.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Кому</th><th>Основание</th><th>Как платим</th><th class="r">Сумма</th><th>Статус</th></tr></thead><tbody>
 ${PAYOUTS.map(v=>`<tr><td><b>${esc(v.who)}</b></td><td class="mini">${esc(v.note)}</td><td>${esc(v.how)}</td><td class="r"><b>${tg(v.sum||ptToday(v.to))}</b></td><td>${v.st==='paid'?`<span class="tag g">выплачено${v.by?' · '+STAFF[v.by]:''}</span>`:`<button class="bt p" onclick="payOut('${v.id}')">Выплатить</button>`}</td></tr>`).join('')}
 </tbody></table></div>`;
function payOut(id){const v=PAYOUTS.find(x=>x.id===id);if(!v)return;const s=v.sum||ptToday(v.to);v.sum=s;v.st='paid';v.by='GL';if(/кассе/.test(v.how))CASH.lines.push({t:'15:20',k:'out',n:'Выплата за сырьё · '+v.who,sum:s});render();toast(/кассе/.test(v.how)?`Выплачено ${tg(s)} из кассы — строка появилась в смене кассира.`:`Платёж ${tg(s)} отмечен — акт сверки по весам приложен.`)}

/* ===== Система ===== */
SC.roles=()=>{const areas=[['Заявки, заказы, клиенты',['RS','DN']],['Цены и маржа коробок',['RS','DN']],['Производство',['RS','OL']],['Рейсы и точки',['RS','EB','ST','KN']],['Цены закупа сырья',['RS','EB']],['Весы и склад',['RS','NZ']],['Касса',['RS','GL']],['Аналитика обоих направлений',['RS']]];const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и права</h2><p>Два направления — отдельные сотрудники. Менеджер коробок не видит закупочные цены сырья, водитель — только свой рейс, кассир — деньги без маржи. Руководитель видит всё и меняет права сам.</p></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Что видно</th>${R.map(([k,v])=>`<th class="c">${esc(v.av)}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>
 ${areas.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1].includes(v.p)?'<b class="pos">●</b>':'<span class="mini">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="g2">${R.map(([k,v])=>`<div class="pan"><h3>${esc(k)} · ${esc(v.n)}</h3><p>${esc(v.note)}</p><span class="mini">${v.s.length} ${plural(v.s.length,['экран','экрана','экранов'])}</span></div>`).join('')}</div>`;};
SC.mobile=()=>`<div class="hd"><div><h2>Мобильная версия</h2><p>Ссылка открывается в браузере телефона и сохраняется на рабочий стол как приложение — ничего скачивать из магазина не нужно. Водители, менеджеры и кассир работают с телефона, руководитель — где удобно.</p></div></div>
 <div class="phones">
  <div class="phone"><div class="pht"><b>Газель 500 · Канат</b><small>рейс №4 · ${tn(carKg('500'))} сегодня</small></div><div class="pb">${TRIPS.filter(t=>t.car==='500').slice(-2).flatMap(t=>t.lines).map(l=>`<div class="pi"><span>${esc(PT(l.pt).n.slice(0,22))}<small>${MAT[l.m].n}</small></span><b>${kgf(l.kg)}</b></div>`).join('')}<div class="pbtn" onclick="curCar='500';go('trip')">+ Точка</div></div></div>
  <div class="phone"><div class="pht"><b>Динара · заказы</b><small>3 ждут действия</small></div><div class="pb">${ORDERS.filter(o=>['inv','ready','rest'].includes(o.st)).map(o=>`<div class="pi"><span>${esc(BC(o.cl).n.slice(0,24))}<small>${BSTOF(o.st).n}</small></span><b>${mln(oSum(o)-o.paid)}</b></div>`).join('')}<div class="pbtn" onclick="act('wa')">Напомнить в WhatsApp</div></div></div>
  <div class="phone"><div class="pht"><b>Касса · Гульнара</b><small>смена ${dd(TODAY)}</small></div><div class="pb"><div class="pi"><span>На начало</span><b>${fmt(CASH.open)}</b></div><div class="pi"><span>Приход</span><b>${fmt(cashIn())}</b></div><div class="pi"><span>Расход</span><b>${fmt(cashOut())}</b></div><div class="pi"><span>В кассе</span><b>${fmt(CASH.open+cashIn()-cashOut())}</b></div><div class="pbtn" onclick="go('payouts')">Выплаты сдатчикам</div></div></div>
 </div>
 <div class="note"><b>Если пропал интернет</b><p>Водитель продолжает записывать точки — данные сохраняются в телефоне и отправляются, как только появится связь.</p></div>`;
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки — 1 500 000 ₸, один раз, без абонентской платы. Ядро — за две недели, полностью — за 4–6 недель. Доработки потом — по часам.</p></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>150 000 ₸</b><span>начинаем работу</span></div><div><small>Ядро через 2 недели · 45%</small><b>675 000 ₸</b><span>после того, как вы приняли ядро</span></div><div><small>Сдача через 4–6 недель · 45%</small><b>675 000 ₸</b><span>после приёмки всей системы</span></div></div>
 <div class="g2"><div class="pan"><h3>Ядро — первые 2 недели</h3>${['Заявки и воронка заказов коробок','Клиенты с повторами и расчёт','Рейсы водителей с телефона','Точки и сдатчики с ценами','Касса: выплаты и оплаты'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Дальше, до сдачи</h3>${['Производство и склад коробок','Приёмка, весы, склад вторсырья','Отгрузка переработчикам','Отгрузки клиентам с подтверждением','Аналитика, роли, мобильная версия'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div></div>
 <div class="g2"><div class="pan"><h3>По желанию, позже</h3><div class="li no"><i>—</i><span>Интеграция с 1С — сейчас не нужна, как вы сказали</span></div><div class="li no"><i>—</i><span>Телефония и WhatsApp из карточки — когда будут рабочие номера</span></div><div class="li no"><i>—</i><span>Площадка «Новый завод» — весной, по часам</span></div></div>
 <div class="pan"><h3>Доработки после сдачи</h3><p class="mini">Около 20 $ в час; обычно новая функция — 5–10 часов. Система ваша: код и права передаём, работает на вашем сервере.</p></div></div>
 ${said('«Это мы один раз оплачиваем, и всё, да?» · «Если дополнительно какие-то функции добавить — это уже отдельно?»','Ирина: да, один раз; доработки — около 20 долларов в час.')}`;

/* ===== Карточки ===== */
const CARD={};
CARD.cl=id=>{const c=BC(id);const O=ORDERS.filter(o=>o.cl===id);return [esc(c.n),`${esc(c.kind)} · ${esc(c.city)} · ${esc(c.src)}`,`<div class="g2"><div class="pan"><h3>Клиент</h3>${[['Контакт',esc(c.contact)],['Заказов',c.orders],['Средний заказ',c.avg?tg(c.avg):'—'],['Периодичность',c.repeat?'каждые '+c.repeat+' дн.':'—'],['Последний заказ',c.last==='—'?'—':dl(c.last)],['Следующий',nextRepeat(c)?dl(nextRepeat(c)):'—'],['Договор',c.contract?'подписан':'нужен'],['Долг',c.debt?tg(c.debt):'—']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Заказы</h3>${O.map(o=>`<div class="kv"><span>${ordL(o.id)} · ${dd(o.d)}</span><b>${bst(o.st)} ${tg(oSum(o))}</b></div>`).join('')||'<p class="mini">Пока нет.</p>'}${c.orders?`<button class="bt p" onclick="closeM();repeatOrd('${id}')">Повторить последний заказ</button>`:''}</div></div>`]};
CARD.pt=id=>{const p=PT(id);const L=[];TRIPS.forEach(t=>t.lines.filter(l=>l.pt===id).forEach(l=>L.push([t,l])));return [esc(p.n),`${esc(p.kind)} · ${esc(p.addr)}`,`<div class="g2"><div class="pan"><h3>Условия</h3>${[['Сырьё и цены',p.mats.map(m=>MAT[m].n+' — '+(p.price[m]||'—')+' ₸/кг').join('; ')],['График',esc(p.sch)],['Оплата',esc(p.pay)],['В месяц',tn(p.month)],['Последний вывоз',dl(p.last)]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Сегодня</h3>${L.map(([t,l])=>`<div class="kv"><span>${esc(CARS.find(c=>c.id===t.car).n)} · ${l.ts} · ${MAT[l.m].n}</span><b>${kgf(l.kg)} · ${tg(lineSum(l))}</b></div>`).join('')||'<p class="mini">Сегодня не забирали.</p>'}</div></div>`]};
CARD.newpt=()=>['Новая точка','Компания, магазин, рынок или дворник',`<div class="form"><label>Название<input id="np_n" value="Магазин «Достык»"></label><label>Тип<select id="np_k"><option>Компания</option><option>Рынок</option><option>Дворник</option></select></label><label>Сырьё<select id="np_m">${Object.entries(MAT).map(([k,m])=>`<option value="${k}">${m.n}</option>`).join('')}</select></label><label>Цена, ₸/кг<input id="np_p" value="30"></label><label>График<select id="np_s"><option>Ежедневно, 09:00</option><option>Пн, ср, пт</option><option>По звонку</option></select></label><label>Оплата<select id="np_pay"><option>Наличные на месте</option><option>Наличные в кассе</option><option>Безнал</option></select></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;POINTS.push({id:'T'+(POINTS.length+1),n:v('np_n'),kind:v('np_k'),addr:'—',mats:[v('np_m')],sch:v('np_s'),pay:v('np_pay'),price:{[v('np_m')]:+v('np_p')||0},month:0,last:'${TODAY}'});closeM();render();toast('Точка добавлена — водители видят её в телефоне.')">Добавить</button>`];
CARD.inv=id=>{if(id&&OR(id)){const o=OR(id),s=oSum(o);return ['Счёт на оплату',`${esc(o.id)} · ${esc(BC(o.cl).n)}`,`<div class="doc"><div class="dh"><div class="dlg">ЦИКЛ<small>КОРОБКИ И УПАКОВКА</small></div><div style="text-align:right;font-size:10px">Счёт № ${400+ORDERS.indexOf(o)}<br>${dl(TODAY)}</div></div><h4>Счёт на оплату</h4><p style="font-size:11px">Покупатель: ${esc(BC(o.cl).n)}</p>
 <div class="drow h"><span>№</span><span>Товар</span><span class="r">Кол-во</span><span class="r">Сумма, ₸</span></div>${o.lines.map((l,i)=>`<div class="drow"><span>${i+1}</span><span>${esc(PRD(l[0]).n)}</span><span class="r">${fmt(l[1])}</span><span class="r">${fmt(l[1]*PRD(l[0]).price)}</span></div>`).join('')}
 <div class="dsum"><span>Итого</span><span>${tg(s)}</span></div><div class="dfoot"><span>Предоплата ${o.pre}% — ${tg(s*o.pre/100)}. Остаток — перед отгрузкой.</span></div></div><div class="btns l" style="margin-top:12px"><button class="bt p" onclick="closeM();toast('Счёт отправлен клиенту в WhatsApp, статус заказа — «Счёт выставлен».')">Отправить в WhatsApp</button></div>`]}
 return ['Инвентаризация вторсырья','Факт по видам — разница спишется с причиной',`<div class="form">${Object.entries(RSTOCK).map(([k,v])=>`<label>${MAT[k].n} · по учёту ${fmt(v.kg)} кг<input id="iv_${k}" value="${v.kg}"></label>`).join('')}</div><button class="bt p" onclick="doInv()">Провести</button>`]};
function doInv(){let c=0;Object.keys(RSTOCK).forEach(k=>{const n=+document.getElementById('iv_'+k).value;if(n>=0&&n!==RSTOCK[k].kg){INV.unshift({d:TODAY,who:'NZ',m:k,was:RSTOCK[k].kg,now:n,why:'Инвентаризация',act:n<RSTOCK[k].kg?'списано '+fmt(RSTOCK[k].kg-n)+' кг':'найдено'});RSTOCK[k].kg=n;c++}});closeM();render();toast(c?`Инвентаризация проведена, изменено видов: ${c}.`:'Расхождений нет.')}
CARD.sale=()=>['Новая партия','Продажа переработчику или передача на свой завод',`<div class="form"><label>Сырьё<select id="sl_m">${Object.entries(MAT).map(([k,m])=>`<option value="${k}">${m.n} · на складе ${fmt(RSTOCK[k].kg)} кг</option>`).join('')}</select></label><label>Вес, кг<input id="sl_kg" value="2000"></label><label>Кому<input id="sl_to" value="«ЭкоПласт», Караганда"></label><label>Цена, ₸/кг<input id="sl_p" value="110"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;const m=v('sl_m'),kg=+v('sl_kg');if(kg>RSTOCK[m].kg){toast('На складе столько нет: '+fmt(RSTOCK[m].kg)+' кг');return}SALES.unshift({id:'S-'+(91+SALES.length-5),m,kg,to:v('sl_to'),price:+v('sl_p'),st:'plan',d:'${addDays(TODAY,2)}',pay:'по договорённости'});closeM();render();toast('Партия создана.')">Создать</button>`];
CARD.cashop=k=>[k==='in'?'Приход в кассу':'Расход из кассы','Строка попадёт в смену кассира',`<div class="form"><label>Основание<input id="co_n" value="${k==='in'?'Оплата наличными за коробки':'Выплата за сырьё'}"></label><label>Сумма, ₸<input id="co_s" value="50000"></label></div><button class="bt p" onclick="CASH.lines.push({t:'15:30',k:'${k}',n:document.getElementById('co_n').value,sum:+document.getElementById('co_s').value||0});closeM();render();toast('Операция проведена.')">Провести</button>`];
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(k){const M={report:'Каждый вечер в 19:00 руководителю в WhatsApp: тонны по машинам, выплаты, заказы в производстве, отгрузки, касса.',wa:'Сообщение отправлено клиенту в WhatsApp.',kp:'КП с ценой и сроком отправлено клиенту.',newprod:'Новое изделие: подразделение, размер, материал, цена, себестоимость.',plan:'План производства на неделю по линиям и сменам.',inv:'Инвентаризация склада коробок: факт по позициям, разница — в брак или списание.'};toast(M[k]||'Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const o=ORDERS.find(x=>(x.id+' '+BC(x.cl).n).toLowerCase().includes(q));if(o){openOrd(o.id);return}
 const p=POINTS.find(x=>x.n.toLowerCase().includes(q));if(p){go('points');card('pt',p.id);return}const c=BCLIENTS.find(x=>x.n.toLowerCase().includes(q));if(c){go('bclients');card('cl',c.id);return}
 const car=CARS.find(x=>x.n.toLowerCase().includes(q)||x.id===q);if(car){curCar=car.id;go('trip');return}toast('Не найдено: попробуйте «Папа Нико», «Береке», «500».')}

/* ===== Каркас: направления сверху ===== */
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const on=SECOF[cur];document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="dir ${s.k===on?'on':''}" style="--dc:${DIRS[s.k].c}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')">${s.k==='box'?'<svg viewBox="0 0 24 24"><path d="M3 8l9-4 9 4v9l-9 4-9-4z M3 8l9 4 9-4 M12 12v9"/></svg>':s.k==='raw'?'<svg viewBox="0 0 24 24"><path d="M7 19l-4-7 3-5h6 M17 5l4 7-3 5h-6 M8 7l4-3 M16 17l-4 3"/></svg>':s.k==='own'?'<svg viewBox="0 0 24 24"><path d="M4 20V10 M10 20V4 M16 20v-8 M22 20H2"/></svg>':'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3 M12 19v3 M2 12h3 M19 12h3"/></svg>'}<span>${DIRS[s.k].n}</span></a>`).join('')}
function buildSub(){const s=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function buildTick(){const el=document.getElementById('tick');if(!el)return;const tm=todayMat();el.innerHTML=`<span class="live">СЕГОДНЯ</span><span>Собрано <b>${tn(Object.values(tm).reduce((a,b)=>a+b,0))}</b></span>${CARS.map(c=>`<span>${esc(c.n)} <b>${tn(carKg(c.id))}</b></span>`).join('')}<span>В производстве <b>${ORDERS.filter(o=>o.st==='prod').length}</b></span><span>Готово к отгрузке <b>${ORDERS.filter(o=>['ready','rest'].includes(o.st)).length}</b></span><span>Касса <b>${tg(CASH.open+cashIn()-cashOut())}</b></span>`}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.today;document.body.dataset.dir=SECOF[cur];document.getElementById('ttl').textContent=SUBN[cur]||'Цикл';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();buildTick();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('calc')?'':'none';try{history.replaceState(null,'','?s='+cur+(cur==='border'?'&o='+curOrd:cur==='trip'?'&car='+curCar:''))}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

const TOUR=[
 ['today','1 · Сводка дня: оба направления на одном экране — заказы и производство коробок, машины и тонны вторсырья, касса. Внизу — живая строка дня.'],
 ['leads','2 · Заявки из рекламы, WhatsApp и звонков — с источником. Из заявки — заказ в один клик.'],
 ['bfunnel','3 · Воронка заказов по вашему порядку: счёт → предоплата → производство → готово → остаток → отгрузка → получено.'],
 ['border','4 · Заказ: состав, оплата, производство, отгрузка и подтверждение клиента. Без предоплаты в цех не уйдёт.'],
 ['bclients','5 · Постоянные клиенты: сколько брали, когда последний заказ, когда ждать следующий. Повтор — одной кнопкой.'],
 ['calc','6 · Расчёт: изделие, тираж, печать — цена со скидкой за объём и счёт сразу.'],
 ['prod','7 · Производство: линии, смены, план и факт, брак, материалы цеха.'],
 ['trips','8 · Рейсы: каждая Газель — точки, тонны, суммы и что показали весы на базе.'],
 ['trip','9 · Телефон водителя: точка, сырьё, вес, цена подставляется, фото обязательно.'],
 ['points','10 · Точки и сдатчики: компании, рынки, дворники — цены, график, способ оплаты.'],
 ['intake','11 · Весы: брутто, тара, нетто, засор — и расхождение с записью водителя.'],
 ['rawstock','12 · Склад вторсырья: остатки по видам, тюки, инвентаризация, брак и списание.'],
 ['sales','13 · Картон — на свой завод, остальное — партиями переработчикам, с маржой партии.'],
 ['money','14 · Касса: подотчёт водителям, выплаты сдатчикам, оплаты клиентов, закрытие смены.'],
 ['analytics','15 · Аналитика: выручка и маржа коробок, тонны и цена закупа против продажи, точки и машины.'],
 ['growth','16 · Новый завод весной — добавляется в систему как ещё одна площадка.'],
 ['launch','17 · Стоимость: 1,5 млн один раз, 10 / 45 / 45, ядро за 2 недели.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается: заявки, заказы, рейсы, весы, касса.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;if(k==='border')curOrd='Z-2026-142';if(k==='trip')curCar='500';build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='',o='',c='';try{const u=new URLSearchParams(location.search);q=u.get('s')||'';o=u.get('o')||'';c=u.get('car')||''}catch(e){}if(o&&OR(o))curOrd=o;if(c&&CARS.find(x=>x.id===c))curCar=c;
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
