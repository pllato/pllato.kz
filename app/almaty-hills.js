/* ALMATY HILLS — портал управления конноспортивным клубом и приложение для всадников.
   Демо-макет на вымышленных данных: всадники, лошади, суммы и телефоны придуманы для примера. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const dd=s=>{const [y,m,d]=s.split('-');return d+'.'+m};
const dl=s=>{const [y,m,d]=s.split('-');return d+'.'+m+'.'+y};
const TODAY='2026-10-31',NOW='10:40';
const addDays=(s,n)=>new Date(new Date(s+'T00:00:00').getTime()+n*864e5).toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
const dow=s=>['вс','пн','вт','ср','чт','пт','сб'][new Date(s+'T00:00:00').getDay()];
const DOWF=s=>['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'][new Date(s+'T00:00:00').getDay()];
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tm=t=>{const [h,m]=t.split(':');return +h*60+ +m};
const ts=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');

const SEC=[
 {k:'day',n:'Сегодня',sub:[['today','Пульт дня'],['sched','Расписание манежей'],['walks','Прогулки и компании']]},
 {k:'cli',n:'Всадники',sub:[['clients','База всадников'],['client','Карточка всадника'],['subs','Абонементы'],['wait','Лист ожидания']]},
 {k:'stab',n:'Конюшня',sub:[['horses','Лошади'],['horse','Карточка лошади'],['vet','Ветеринар и ковка'],['arenas','Манежи и левады']]},
 {k:'sale',n:'Продажи',sub:[['leads','Заявки и воронка'],['wa','WhatsApp'],['contracts','Договоры и подпись']]},
 {k:'money',n:'Деньги',sub:[['cash','Касса и оплаты'],['pay','Зарплата тренеров'],['dash','Отчёты собственника']]},
 {k:'app',n:'Приложение',sub:[['app','Приложение всадника'],['rules','Правила записи'],['push','Сообщения клиентам']]},
 {k:'sys',n:'Система',sub:[['move','Переезд с Fitbase'],['roles','Роли и права'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Руководитель':{av:'БК',p:'BK',n:'Батырбек',note:'Весь клуб: расписание, всадники, лошади, деньги, зарплаты, отчёты',s:ALL.slice()},
 'Администратор':{av:'АЙ',p:'AI',n:'Айгерим · ресепшн',note:'Запись, прогулки, абонементы, касса, WhatsApp — с телефона на ногах',s:['today','sched','walks','clients','client','subs','wait','horses','leads','wa','contracts','cash','app','rules','push']},
 'Старший тренер':{av:'ДС',p:'T1',n:'Данияр Сапаров',tr:'T1',note:'Тренеры и нагрузка лошадей, расписание, уровни всадников',s:['today','sched','walks','clients','client','wait','horses','horse','vet','arenas','pay']},
 'Тренер':{av:'МА',p:'T2',n:'Мадина Ахметова',tr:'T2',note:'Свои занятия на сегодня, отметка «пришёл», заметки по всаднику',s:['sched','clients','client','horses','horse']},
 'Конюх':{av:'ЕЖ',p:'EJ',n:'Ержан · старший конюх',note:'Какую лошадь к какому времени седлать, кто отдыхает, ковка',s:['sched','horses','horse','vet']},
 'Ветеринар':{av:'АС',p:'AS',n:'Асель Нурланова',note:'Осмотры, прививки, ковка, ограничения по нагрузке',s:['horses','horse','vet']},
 'Бухгалтер':{av:'СА',p:'SA',n:'Сауле',note:'Оплаты, долги, зарплата тренеров по процентам, отчёты',s:['cash','pay','dash','subs','contracts']},
 'Маркетолог':{av:'КМ',p:'KM',n:'Камила',note:'Заявки из Instagram и таргета, воронка, рассылки',s:['leads','wa','push','dash']}
};
let role='Руководитель',cur='today',theme='light';
const STAFF={BK:'Батырбек',AI:'Айгерим',T1:'Данияр',T2:'Мадина',T3:'Руслан',T4:'Аружан',T5:'Ерболат',EJ:'Ержан',AS:'Асель',SA:'Сауле',KM:'Камила'};

/* ===== Тренеры и площадки ===== */
const TRAINERS=[
 {id:'T1',n:'Данияр Сапаров',s:'Данияр С.',sp:'выездка, конкур, спортивная группа',pct:45,c:'#1d3b30'},
 {id:'T2',n:'Мадина Ахметова',s:'Мадина А.',sp:'новички и средний уровень',pct:40,c:'#b0703c'},
 {id:'T3',n:'Руслан Ким',s:'Руслан К.',sp:'прогулки в предгорья, тропа',pct:35,c:'#4f6f8f'},
 {id:'T4',n:'Аружан Бекова',s:'Аружан Б.',sp:'дети, пони-клуб',pct:40,c:'#8a5a7a'},
 {id:'T5',n:'Ерболат Жумабаев',s:'Ерболат Ж.',sp:'инструктор прогулок',pct:35,c:'#6f7d3a'}
];
const TR=id=>TRAINERS.find(t=>t.id===id)||TRAINERS[0];
const ARENAS=[
 {id:'A1',n:'Крытый манеж',cap:6,st:'open',d:'20×40 м, освещение, круглый год'},
 {id:'A2',n:'Открытый плац',cap:8,st:'open',d:'конкурные препятствия, до заката'},
 {id:'A3',n:'Левада 1',cap:4,st:'open',d:'обучение новичков и детей'},
 {id:'A4',n:'Левада 2',cap:4,st:'soon',d:'открывается 7 ноября — снимет стоп-продажу абонементов'},
 {id:'A5',n:'Тропа в предгорья',cap:10,st:'open',d:'прогулки 1 и 2 часа, до 17:00'}
];
const AR=id=>ARENAS.find(a=>a.id===id)||ARENAS[0];

/* ===== Лошади =====
 lvl: pony — пони; beg — новички и прогулки; mid — средний; pro — спорт
 max — сколько занятий в день лошадь может отработать без вреда */
let HORSES=[
 {id:'H01',n:'Алтын',br:'ахалтекинская',age:9,sex:'мерин',lvl:'pro',max:2,st:'work',stall:'А-1',own:'club',far:'2026-11-04',vac:'2027-03-12',w:520,c:'#c79a3b',note:'Чувствительный рот — только опытным всадникам'},
 {id:'H02',n:'Буран',br:'тракененская',age:11,sex:'мерин',lvl:'pro',max:2,st:'work',stall:'А-2',own:'club',far:'2026-11-12',vac:'2027-02-20',w:610,c:'#5b4a3f'},
 {id:'H03',n:'Ласточка',br:'русская верховая',age:13,sex:'кобыла',lvl:'beg',max:4,st:'work',stall:'А-3',own:'club',far:'2026-11-02',vac:'2027-04-01',w:540,c:'#8b5a35',note:'Самая спокойная — для первых занятий'},
 {id:'H04',n:'Самал',br:'кустанайская',age:10,sex:'мерин',lvl:'beg',max:4,st:'work',stall:'А-4',own:'club',far:'2026-11-18',vac:'2027-01-15',w:560,c:'#a06b3f'},
 {id:'H05',n:'Тулпар',br:'ахалтекинская',age:7,sex:'жеребец',lvl:'pro',max:2,st:'work',stall:'А-5',own:'stay',far:'2026-11-07',vac:'2027-05-02',w:500,c:'#d4b06a',ownr:'Ерлан Абдрахманов',note:'Постой: работает только владелец и Данияр'},
 {id:'H06',n:'Жулдыз',br:'полукровная',age:12,sex:'кобыла',lvl:'mid',max:3,st:'work',stall:'Б-1',own:'club',far:'2026-11-09',vac:'2027-02-10',w:530,c:'#6e4b3a'},
 {id:'H07',n:'Арман',br:'ганноверская',age:14,sex:'мерин',lvl:'mid',max:3,st:'rest',stall:'Б-2',own:'club',far:'2026-11-20',vac:'2027-03-01',w:620,c:'#4a3a30',note:'Отдых до 02.11 после двух дней по 3 занятия'},
 {id:'H08',n:'Медовая',br:'русская верховая',age:15,sex:'кобыла',lvl:'beg',max:4,st:'work',stall:'Б-3',own:'club',far:'2026-11-03',vac:'2027-01-30',w:520,c:'#b6823f'},
 {id:'H09',n:'Каспер',br:'орловский рысак',age:12,sex:'мерин',lvl:'beg',max:4,st:'work',stall:'Б-4',own:'club',far:'2026-11-14',vac:'2027-04-18',w:540,c:'#d9d2c4'},
 {id:'H10',n:'Ветер',br:'кустанайская',age:9,sex:'мерин',lvl:'mid',max:3,st:'vet',stall:'Б-5',own:'club',far:'2026-11-25',vac:'2027-02-01',w:550,c:'#7a5536',note:'Лёгкая хромота слева — только шаг до осмотра 02.11'},
 {id:'H11',n:'Сауле',br:'полукровная',age:10,sex:'кобыла',lvl:'mid',max:3,st:'work',stall:'В-1',own:'club',far:'2026-11-06',vac:'2027-03-22',w:510,c:'#9a6a44'},
 {id:'H12',n:'Граф',br:'голштинская',age:13,sex:'мерин',lvl:'pro',max:2,st:'work',stall:'В-2',own:'stay',far:'2026-11-10',vac:'2027-01-08',w:640,c:'#3c312b',ownr:'Динара Сейтова'},
 {id:'H13',n:'Пломбир',br:'шетлендский пони',age:8,sex:'мерин',lvl:'pony',max:4,st:'work',stall:'П-1',own:'club',far:'2026-11-15',vac:'2027-02-14',w:190,c:'#efe6d6'},
 {id:'H14',n:'Ириска',br:'уэльский пони',age:9,sex:'кобыла',lvl:'pony',max:4,st:'work',stall:'П-2',own:'club',far:'2026-11-05',vac:'2027-04-22',w:240,c:'#c08a52'},
 {id:'H15',n:'Байтерек',br:'кустанайская',age:8,sex:'мерин',lvl:'beg',max:4,st:'work',stall:'В-3',own:'club',far:'2026-11-11',vac:'2027-05-10',w:570,c:'#875c3a'},
 {id:'H16',n:'Аида',br:'тракененская',age:6,sex:'кобыла',lvl:'mid',max:2,st:'work',stall:'В-4',own:'club',far:'2026-11-19',vac:'2027-03-30',w:530,c:'#57402f',note:'Молодая — не больше 2 занятий в день'}
];
const HO=id=>HORSES.find(h=>h.id===id)||HORSES[0];
const LVL={pony:{n:'пони',c:'#8a5a7a'},beg:{n:'новички',c:'#3e7d4e'},mid:{n:'средний',c:'#4f6f8f'},pro:{n:'спорт',c:'#b0703c'}};
const HST={work:{n:'в работе',c:'ok'},rest:{n:'отдых',c:'w'},vet:{n:'ветеринар',c:'r'}};

/* ===== Услуги и абонементы ===== */
const SVC={
 ind:{n:'Индивидуальное занятие',p:15000,d:60},
 grp:{n:'Групповое занятие',p:9000,d:60},
 kid:{n:'Детское занятие · пони',p:8000,d:45},
 walk:{n:'Прогулка в предгорья · 1 ч',p:12000,d:60},
 walk2:{n:'Прогулка в предгорья · 2 ч',p:20000,d:120},
 photo:{n:'Фотосессия с лошадью',p:25000,d:60}
};
const SUBT={
 S4:{n:'4 занятия',p:52000,days:30,cnt:4},
 S8:{n:'8 занятий',p:96000,days:45,cnt:8},
 S12:{n:'12 занятий',p:132000,days:60,cnt:12},
 K8:{n:'Детский · 8 занятий',p:76000,days:45,cnt:8},
 G8:{n:'Групповой · 8 занятий',p:64000,days:45,cnt:8}
};

/* ===== Всадники ===== */
let CLIENTS=[
 {id:'C01',n:'Асем Каримова',ph:'+7 701 412 18 30',lvl:'mid',tr:'T2',sub:'S8',left:5,to:'2026-11-28',since:'2024-03-12',visits:96,last:'2026-10-29',src:'Instagram',horse:'H06',sign:true},
 {id:'C02',n:'Тимур Жаксылыков',ph:'+7 777 230 44 19',lvl:'pro',tr:'T1',sub:'S12',left:9,to:'2026-12-20',since:'2021-06-01',visits:310,last:'2026-10-30',src:'Сарафан',horse:'H02',sign:true},
 {id:'C03',n:'Дана Мусина',ph:'+7 705 118 72 04',lvl:'beg',tr:'T2',sub:'S4',left:1,to:'2026-11-06',since:'2026-09-14',visits:7,last:'2026-10-28',src:'Таргет',horse:'H03',sign:true},
 {id:'C04',n:'Алихан Оспанов',ph:'+7 701 909 11 55',lvl:'pony',tr:'T4',sub:'K8',left:6,to:'2026-12-02',since:'2025-05-20',visits:44,last:'2026-10-26',src:'Сарафан',horse:'H13',kid:'мама — Жанна Оспанова',sign:true},
 {id:'C05',n:'Мадина Ерланова',ph:'+7 702 455 61 20',lvl:'mid',tr:'T1',sub:'S8',left:0,to:'2026-10-30',since:'2023-08-10',visits:128,last:'2026-10-30',src:'Instagram',horse:'H11',sign:true},
 {id:'C06',n:'Ерлан Абдрахманов',ph:'+7 701 777 00 12',lvl:'pro',tr:'T1',sub:'S12',left:4,to:'2026-11-14',since:'2019-04-03',visits:520,last:'2026-10-31',src:'Сарафан',horse:'H05',stay:'H05',sign:true},
 {id:'C07',n:'Айым Нургалиева',ph:'+7 708 320 15 77',lvl:'beg',tr:'T2',sub:'G8',left:7,to:'2026-12-10',since:'2026-10-20',visits:1,last:'2026-10-24',src:'Таргет',horse:'H04',sign:false},
 {id:'C08',n:'Арина Ким',ph:'+7 747 901 33 81',lvl:'pony',tr:'T4',sub:'K8',left:2,to:'2026-11-09',since:'2025-09-01',visits:52,last:'2026-10-29',src:'Instagram',horse:'H14',kid:'папа — Виктор Ким',sign:true},
 {id:'C09',n:'Нурсултан Бейсенов',ph:'+7 700 621 08 90',lvl:'mid',tr:'T1',sub:'S8',left:3,to:'2026-11-20',since:'2024-11-11',visits:61,last:'2026-10-27',src:'2ГИС',horse:'H06',sign:true},
 {id:'C10',n:'Динара Сейтова',ph:'+7 701 300 42 42',lvl:'pro',tr:'T1',sub:'S12',left:10,to:'2026-12-24',since:'2020-02-15',visits:402,last:'2026-10-30',src:'Сарафан',horse:'H12',stay:'H12',sign:true},
 {id:'C11',n:'Жанель Абилова',ph:'+7 776 515 90 03',lvl:'beg',tr:'T2',sub:'S4',left:3,to:'2026-11-21',since:'2026-10-03',visits:3,last:'2026-10-29',src:'Таргет',horse:'H08',sign:true},
 {id:'C12',n:'Роман Ли',ph:'+7 705 777 26 18',lvl:'mid',tr:'T2',sub:'S8',left:6,to:'2026-12-05',since:'2025-01-22',visits:73,last:'2026-10-25',src:'Instagram',horse:'H11',sign:true},
 {id:'C13',n:'Камила Тулеуова',ph:'+7 701 640 51 14',lvl:'beg',tr:'T2',sub:'G8',left:4,to:'2026-11-30',since:'2026-07-09',visits:18,last:'2026-10-30',src:'Instagram',horse:'H15',sign:true},
 {id:'C14',n:'Санжар Ибраев',ph:'+7 707 288 13 64',lvl:'mid',tr:'T1',sub:'S8',left:2,to:'2026-11-03',since:'2025-04-17',visits:59,last:'2026-10-18',src:'Сарафан',horse:'H16',sign:true,risk:'не был 13 дней, осталось 2 занятия, абонемент до 03.11'},
 {id:'C15',n:'Аяжан Темирова',ph:'+7 702 140 67 25',lvl:'pony',tr:'T4',sub:'K8',left:8,to:'2026-12-15',since:'2026-10-30',visits:0,last:'—',src:'Таргет',horse:'H13',kid:'мама — Сабина Темирова',sign:false},
 {id:'C16',n:'Маржан Утебаева',ph:'+7 747 330 25 70',lvl:'beg',tr:'T2',sub:'S4',left:0,to:'2026-10-25',since:'2026-08-01',visits:12,last:'2026-10-10',src:'Таргет',horse:'H09',sign:true,risk:'абонемент закончился 25.10, не продлила'},
 {id:'C17',n:'Ольга Пак',ph:'+7 701 228 14 49',lvl:'mid',tr:'T1',sub:'S12',left:7,to:'2026-12-01',since:'2022-10-05',visits:211,last:'2026-10-31',src:'Сарафан',horse:'H16',sign:true},
 {id:'C18',n:'Бауыржан Сарсенов',ph:'+7 777 515 20 08',lvl:'beg',tr:'T2',sub:'G8',left:5,to:'2026-12-08',since:'2026-09-28',visits:4,last:'2026-10-29',src:'2ГИС',horse:'H03',sign:true}
];
const CL=id=>CLIENTS.find(c=>c.id===id)||CLIENTS[0];
let curCl='C01',curHorse='H03';
const SRC={'Instagram':'#a8543a','Таргет':'#4f6f8f','Сарафан':'#3e7d4e','2ГИС':'#6f7d3a','WhatsApp':'#2b8a57','Приложение':'#1d3b30'};

/* ===== Расписание на сегодня =====
 k — услуга; cl — всадник; g — группа всадников; w — компания на прогулке {who,ph,n,kids}; h — лошади; tr — тренер; ar — площадка
 st: done — прошло; in — идёт; booked — записаны; noshow — не пришёл. src — откуда запись */
let SLOTS=[
 {id:'S01',t:'09:00',k:'ind',cl:'C06',h:['H05'],tr:'T1',ar:'A2',st:'done',src:'app'},
 {id:'S02',t:'09:00',k:'kid',cl:'C04',h:['H13'],tr:'T4',ar:'A3',st:'done',src:'app'},
 {id:'S03',t:'10:00',k:'grp',g:['C13','C18','C11'],h:['H15','H03','H08'],tr:'T2',ar:'A1',st:'in',src:'app'},
 {id:'S04',t:'10:00',k:'walk',w:{who:'Самат Ермеков',ph:'+7 701 555 20 31',n:4,kids:0,paid:'предоплата Kaspi 48 000 ₸'},h:['H04','H09','H06','H11'],tr:'T3',ar:'A5',st:'in',src:'wa'},
 {id:'S05',t:'10:00',k:'ind',cl:'C17',h:['H16'],tr:'T1',ar:'A2',st:'in',src:'app'},
 {id:'S06',t:'11:00',k:'kid',cl:'C08',h:['H14'],tr:'T4',ar:'A3',st:'booked',src:'app'},
 {id:'S07',t:'11:00',k:'ind',cl:'C02',h:['H02'],tr:'T1',ar:'A2',st:'booked',src:'app'},
 {id:'S08',t:'12:00',k:'walk2',w:{who:'Компания «QazTech»',ph:'+7 707 300 11 90',n:6,kids:0,paid:'счёт оплачен 120 000 ₸'},h:['H03','H04','H08','H09','H15','H06'],tr:'T3',ar:'A5',st:'booked',src:'admin'},
 {id:'S09',t:'12:00',k:'grp',g:['C01','C12','C09'],h:['H11','H01','H16'],tr:'T2',ar:'A1',st:'booked',src:'app'},
 {id:'S10',t:'13:00',k:'photo',w:{who:'Алия и Даурен · свадебная',ph:'+7 778 901 20 20',n:2,kids:0,paid:'предоплата 12 500 ₸'},h:['H01'],tr:'T5',ar:'A2',st:'booked',src:'wa'},
 {id:'S11',t:'14:00',k:'ind',cl:'C10',h:['H12'],tr:'T1',ar:'A2',st:'booked',src:'app'},
 {id:'S12',t:'14:00',k:'kid',cl:'C15',h:['H13'],tr:'T4',ar:'A3',st:'booked',src:'app',first:true},
 {id:'S13',t:'15:00',k:'walk',w:{who:'Гульнара Тасова',ph:'+7 701 812 44 60',n:3,kids:1,paid:'оплата на месте'},h:['H08','H15','H14'],tr:'T5',ar:'A5',st:'booked',src:'admin'},
 {id:'S14',t:'15:00',k:'grp',g:['C03','C07'],h:['H03','H04'],tr:'T2',ar:'A1',st:'booked',src:'app'},
 {id:'S15',t:'16:00',k:'ind',cl:'C09',h:['H06'],tr:'T1',ar:'A1',st:'booked',src:'app'},
 {id:'S16',t:'17:00',k:'grp',g:['C01','C12'],h:['H11','H16'],tr:'T2',ar:'A1',st:'booked',src:'app'},
 {id:'S17',t:'18:00',k:'ind',cl:'C17',h:['H02'],tr:'T1',ar:'A1',st:'booked',src:'app'}
];
let SKN=17;
const SST={done:{n:'прошло',c:''},in:{n:'идёт',c:'g'},booked:{n:'записаны',c:'i'},noshow:{n:'не пришёл',c:'r'},cancel:{n:'отменено',c:'w'}};
const SRCN={app:'приложение',admin:'администратор',wa:'WhatsApp'};
const riders=s=>s.cl?1:s.g?s.g.length:s.w?s.w.n:0;
const slotWho=s=>s.cl?CL(s.cl).n:s.g?s.g.map(c=>CL(c).n.split(' ')[0]).join(', '):s.w.who+' · '+s.w.n+' '+plural(s.w.n,['человек','человека','человек']);
const slotSum=s=>s.w?SVC[s.k].p*s.w.n:SVC[s.k].p*riders(s);
const hLoad=(id,list)=>(list||SLOTS).filter(s=>s.st!=='cancel'&&s.h.includes(id)).length;

/* ===== Лист ожидания ===== */
let WAIT=[
 {id:'W1',cl:'C05',d:'2026-11-01',t:'11:00',k:'ind',want:'Сауле или любая среднего уровня',since:'30.10 21:14',src:'app'},
 {id:'W2',cl:'C14',d:'2026-11-01',t:'12:00',k:'ind',want:'Аида',since:'31.10 08:02',src:'app'},
 {id:'W3',cl:'C12',d:'2026-11-02',t:'19:00',k:'grp',want:'любая',since:'29.10 18:40',src:'app'},
 {id:'W4',cl:'C11',d:'2026-11-01',t:'10:00',k:'grp',want:'Медовая',since:'31.10 09:31',src:'wa'},
 {id:'W5',cl:'C07',d:'2026-11-03',t:'18:00',k:'grp',want:'любая',since:'30.10 12:05',src:'app'}
];

/* ===== Заявки ===== */
const LST=[['new','Новая'],['talk','Ответили'],['trial','Записан на пробное'],['came','Пришёл'],['sub','Купил абонемент'],['lost','Отказ']];
let LEADS=[
 {id:'L01',n:'Акерке Сулейменова',ph:'+7 701 920 18 44',src:'Таргет',want:'Абонемент для себя, новичок',st:'new',d:'31.10 10:22',mgr:'AI'},
 {id:'L02',n:'Мария Волкова',ph:'+7 777 111 72 90',src:'Instagram',want:'Ребёнок 6 лет — пони',st:'new',d:'31.10 09:48',mgr:'AI'},
 {id:'L03',n:'Компания «Kaz Minerals Team»',ph:'+7 701 300 50 50',src:'WhatsApp',want:'Прогулка для 12 человек, ноябрь',st:'talk',d:'30.10 17:05',mgr:'AI',sum:240000},
 {id:'L04',n:'Ерасыл Кенжебеков',ph:'+7 705 202 33 18',src:'2ГИС',want:'Прогулка на двоих',st:'trial',d:'30.10 14:30',mgr:'AI',sum:24000},
 {id:'L05',n:'Сабина Темирова',ph:'+7 702 140 67 25',src:'Таргет',want:'Дочь 7 лет — пони',st:'sub',d:'28.10 11:10',mgr:'AI',sum:76000},
 {id:'L06',n:'Лаура Ахметжанова',ph:'+7 747 640 12 05',src:'Instagram',want:'Фотосессия с лошадью',st:'talk',d:'30.10 20:40',mgr:'KM',sum:25000},
 {id:'L07',n:'Даулет Ибрагимов',ph:'+7 776 330 90 21',src:'Таргет',want:'Абонемент, ездил в детстве',st:'came',d:'27.10 13:15',mgr:'AI',sum:96000},
 {id:'L08',n:'Гаухар Нуртаева',ph:'+7 701 830 45 66',src:'Сарафан',want:'Двое детей — пони',st:'trial',d:'29.10 16:20',mgr:'AI',sum:152000},
 {id:'L09',n:'Игорь Шевченко',ph:'+7 705 717 82 30',src:'Таргет',want:'Прогулка, но дорого',st:'lost',d:'26.10 10:00',mgr:'AI',why:'Цена'},
 {id:'L10',n:'Айнур Жаналиева',ph:'+7 708 910 11 07',src:'Instagram',want:'Абонемент 8 занятий',st:'came',d:'28.10 18:30',mgr:'KM',sum:96000},
 {id:'L11',n:'Тимур Ахмедов',ph:'+7 777 410 63 92',src:'WhatsApp',want:'Прогулка 2 часа на выходные, нас трое',st:'talk',d:'31.10 08:55',mgr:'KM',sum:110000}
];

/* ===== Оплаты сегодня ===== */
let PAYS=[
 {t:'08:52',who:'Самат Ермеков',what:'Прогулка 1 ч · 4 человека',sum:48000,m:'Kaspi',src:'предоплата по ссылке'},
 {t:'09:15',who:'Ерлан Абдрахманов',what:'Постой Тулпара · ноябрь',sum:180000,m:'Перевод',src:'счёт'},
 {t:'09:40',who:'Айым Нургалиева',what:'Абонемент «Групповой · 8»',sum:64000,m:'Kaspi',src:'приложение'},
 {t:'10:05',who:'Алия и Даурен',what:'Фотосессия · предоплата 50%',sum:12500,m:'Kaspi',src:'предоплата по ссылке'},
 {t:'10:31',who:'Сабина Темирова',what:'Абонемент «Детский · 8»',sum:76000,m:'Карта',src:'ресепшн'}
];
let DEBTS=[
 {who:'Маржан Утебаева',what:'Абонемент закончился 25.10 — продление не оплачено',sum:52000},
 {who:'Гульнара Тасова',what:'Прогулка 15:00 · оплата на месте',sum:36000},
 {who:'Динара Сейтова',what:'Постой Графа · ноябрь, счёт от 28.10',sum:180000}
];

/* ===== Договоры ===== */
let CONTRACTS=[
 {no:'AH-2026-312',cl:'C07',what:'Договор оказания услуг + согласие на риски верховой езды',st:'sent',d:'2026-10-20'},
 {no:'AH-2026-318',cl:'C15',what:'Договор для несовершеннолетнего · подписывает мама',st:'sent',d:'2026-10-30'},
 {no:'AH-2026-305',cl:'C13',what:'Договор оказания услуг',st:'signed',d:'2026-07-09',sign:'ЭЦП через ссылку · 09.07 19:12'},
 {no:'AH-2026-290',cl:'C06',what:'Договор постоя лошади Тулпар',st:'signed',d:'2026-01-05',sign:'ЭЦП · 05.01 11:40'},
 {no:'AH-2026-311',cl:'C18',what:'Договор оказания услуг',st:'signed',d:'2026-09-28',sign:'SMS-код · 28.09 15:03'},
 {no:'AH-2026-319',cl:'C03',what:'Дополнительное соглашение: продление абонемента',st:'draft',d:'2026-10-31'}
];

/* ===== Ветеринар и ковка ===== */
let VETS=[
 {h:'H10',d:'2026-11-02',k:'Осмотр',t:'Хромота слева: осмотр, при необходимости снимок',who:'AS',st:'plan'},
 {h:'H03',d:'2026-11-02',k:'Ковка',t:'Перековка, передние подковы',who:'Кузнец Марат',st:'plan'},
 {h:'H08',d:'2026-11-03',k:'Ковка',t:'Расчистка, без подков',who:'Кузнец Марат',st:'plan'},
 {h:'H01',d:'2026-11-04',k:'Ковка',t:'Перековка на зимние с шипами',who:'Кузнец Марат',st:'plan'},
 {h:'H14',d:'2026-11-05',k:'Ковка',t:'Расчистка',who:'Кузнец Марат',st:'plan'},
 {h:'H07',d:'2026-10-29',k:'Отдых',t:'После двух дней по 3 занятия — отдых до 02.11',who:'T1',st:'done'},
 {h:'H16',d:'2026-10-24',k:'Зубы',t:'Обработка зубов, всё в порядке',who:'AS',st:'done'},
 {h:'H02',d:'2026-10-20',k:'Прививка',t:'Грипп лошадей, ринопневмония',who:'AS',st:'done'},
 {h:'H13',d:'2026-11-08',k:'Глистогонка',t:'Плановая, весь пони-клуб',who:'AS',st:'plan'}
];


const SC={};
const SO=k=>SST[k]||SST.booked;
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const dot=c=>`<i class="hd-dot" style="background:${c}"></i>`;
const span=s=>[tm(s.t),tm(s.t)+SVC[s.k].d];
const busyAt=(hid,t,d,skip)=>SLOTS.some(s=>s.id!==skip&&s.st!=='cancel'&&s.h.includes(hid)&&tm(s.t)<tm(t)+d&&tm(t)<span(s)[1]);
function freeHorses(t,d,lv){return HORSES.filter(h=>h.st==='work'&&h.own==='club'&&lv.includes(h.lvl)&&!busyAt(h.id,t,d)&&hLoad(h.id)<h.max)}
const lvlFor=k=>k==='kid'?['pony']:k==='walk'||k==='walk2'?['beg','mid']:k==='grp'?['beg','mid']:['mid','pro','beg'];
function horseChip(id){const h=HO(id);return `<span class="hchip" onclick="event.stopPropagation();openHorse('${h.id}')"><i style="background:${h.c}"></i>${esc(h.n)}</span>`}

/* ===== Пульт дня ===== */
SC.today=()=>{
 const act=SLOTS.filter(s=>s.st!=='cancel');const rid=act.reduce((a,s)=>a+riders(s),0);
 const inW=HORSES.filter(h=>h.st==='work').length;const used=new Set();act.forEach(s=>s.h.forEach(x=>used.add(x)));
 const sum=act.reduce((a,s)=>a+(s.w?slotSum(s):0),0)+PAYS.reduce((a,p)=>a+p.sum,0);
 const low=CLIENTS.filter(c=>c.left<=1&&c.sub);const now=act.filter(s=>s.st==='in');const next=act.filter(s=>s.st==='booked').slice(0,6);
 const al=[
  ['r',`Ветер — хромота слева`,'Только шаг до осмотра 02.11. Система уже не даёт поставить его на занятия.','horse','H10'],
  ['w',`${WAIT.length} ${plural(WAIT.length,['всадник','всадника','всадников'])} в листе ожидания`,'Освободится место — первому в очереди уйдёт предложение в приложение.','wait',''],
  ['w',`${low.length} ${plural(low.length,['абонемент','абонемента','абонементов'])} на последнем занятии или закончились`,low.map(c=>c.n.split(' ')[0]).join(', ')+' — пора предложить продление.','subs',''],
  ['i',`${CONTRACTS.filter(c=>c.st!=='signed').length} договора ждут подписи`,'Ссылка на подпись ушла в WhatsApp — без подписи первое занятие не начнётся.','contracts',''],
  ['i',`${LEADS.filter(l=>l.st==='new').length} новые заявки из таргета и Instagram`,'Ответить в течение 15 минут — дальше конверсия падает вдвое.','leads',''],
  ['r',`Долги: ${tg(DEBTS.reduce((a,d)=>a+d.sum,0))}`,DEBTS.map(d=>d.who.split(' ')[0]).join(', '),'cash','']
 ];
 return `<div class="hd"><div><h2>Суббота, 31 октября</h2><p>Всё, что происходит в клубе сегодня: кто в седле прямо сейчас, кто следующий, какие лошади отработали и что требует решения. Администратору не нужно держать это в голове и в WhatsApp.</p></div><div class="btns"><button class="bt" onclick="go('sched')">Расписание</button><button class="bt p" onclick="card('newslot','A1|16:00')">+ Запись</button></div></div>
 <div class="wid">
  <div><small>Занятий сегодня</small><b class="a">${act.length}</b><span>${act.filter(s=>s.src==='app').length} записались сами в приложении</span></div>
  <div><small>Всадников</small><b>${rid}</b><span>с прогулками и детьми</span></div>
  <div><small>Лошадей задействовано</small><b class="g">${used.size} из ${inW}</b><span>${HORSES.length-inW} отдыхают или у ветеринара</span></div>
  <div><small>Свободных мест</small><b class="i">${freeSeats()}</b><span>на сегодня, с учётом нагрузки лошадей</span></div>
  <div><small>Оплачено сегодня</small><b>${tg(PAYS.reduce((a,p)=>a+p.sum,0))}</b><span>${PAYS.length} ${plural(PAYS.length,['оплата','оплаты','оплат'])}, из них по ссылке Kaspi — ${PAYS.filter(p=>p.m==='Kaspi').length}</span></div>
 </div>
 <div class="g21"><div>
  <div class="pan"><h3>Сейчас в седле · ${now.length}</h3><p>Отметка «пришёл» ставится в телефоне тренера — занятие списывается с абонемента само.</p>
   ${now.map(s=>slotRow(s)).join('')||'<p class="mini">Сейчас занятий нет.</p>'}</div>
  <div class="pan"><h3>Дальше по расписанию</h3>${next.map(s=>slotRow(s)).join('')}<button class="bt sm" style="margin-top:8px" onclick="go('sched')">Всё расписание →</button></div>
 </div><div>
  <div class="pan"><h3>Требует решения</h3>${al.map(a=>`<div class="al ${a[0]}" onclick="${a[3]==='horse'?`openHorse('${a[4]}')`:`go('${a[3]}')`}"><b>${esc(a[1])}</b><span>${esc(a[2])}</span></div>`).join('')}</div>
  <div class="pan"><h3>Лошади сегодня</h3><p>Сколько занятий отработала каждая из допустимого. Красная полоса — дошла до предела.</p>${HORSES.filter(h=>h.own==='club').slice(0,10).map(h=>hLoadRow(h)).join('')}<button class="bt sm" style="margin-top:6px" onclick="go('horses')">Вся конюшня →</button></div>
 </div></div>`};
function freeSeats(){let n=0;['11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'].forEach(t=>{n+=Math.min(3,freeHorses(t,60,['beg','mid','pro']).length)});return n}
function slotRow(s){const tr=TR(s.tr);return `<div class="srow2" onclick="card('slot','${s.id}')"><span class="st-t">${s.t}</span><div class="st-b"><b>${esc(SVC[s.k].n)}</b><span>${esc(slotWho(s))}</span><div class="st-h">${s.h.map(horseChip).join('')}</div></div><div class="st-r">${tag(SO(s.st).n,SO(s.st).c)}<small>${esc(tr.s)} · ${esc(AR(s.ar).n)}</small></div></div>`}
function hLoadRow(h){const n=hLoad(h.id);const w=Math.min(100,pct(n,h.max));return `<div class="hl" onclick="openHorse('${h.id}')"><span><i style="background:${h.c}"></i>${esc(h.n)}<small>${LVL[h.lvl].n}</small></span><div class="bar"><i class="${n>=h.max?'r':n?'g':''}" style="--w:${w||3}%"></i></div><b>${n} / ${h.max}</b></div>`}

/* ===== Расписание ===== */
let schedView='arena',schedDay=TODAY;
const HOURS=['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
SC.sched=()=>{
 const days=[0,1,2,3,4,5,6,7].map(i=>addDays(TODAY,i));
 const isT=schedDay===TODAY;
 const rows=schedView==='arena'?ARENAS.map(a=>({id:a.id,n:a.n,sub:a.st==='soon'?'с 7 ноября':`до ${a.cap} всадников`,soon:a.st==='soon'})):HORSES.map(h=>({id:h.id,n:h.n,sub:LVL[h.lvl].n+' · '+hLoad(h.id)+'/'+h.max,c:h.c,off:h.st!=='work'}));
 const list=isT?SLOTS.filter(s=>s.st!=='cancel'):fakeDay(schedDay);
 const cell=(r,t)=>{const here=list.filter(s=>s.t===t&&(schedView==='arena'?s.ar===r.id:s.h.includes(r.id)));
  if(here.length)return `<td>${here.map(s=>`<div class="blk k-${s.k} ${s.st}" ${isT?`onclick="card('slot','${s.id}')"`:''}><b>${esc(SVC[s.k].n.split(' · ')[0])}</b><span>${esc(slotWho(s))}</span><em>${schedView==='arena'?s.h.map(x=>HO(x).n).join(', '):AR(s.ar).n}</em></div>`).join('')}</td>`;
  if(r.soon||r.off)return `<td class="off"></td>`;
  return `<td class="free" ${isT&&schedView==='arena'?`onclick="card('newslot','${r.id}|${t}')"`:''}></td>`};
 return `<div class="hd"><div><h2>Расписание манежей</h2><p>Одна сетка для приложения, администратора и тренеров. Запись видна сразу везде — двойной записи на одну лошадь или в переполненный манеж система не допустит. ${schedView==='horse'?'Вид «по лошадям» — для конюха: какую лошадь к какому часу седлать.':''}</p></div><div class="btns"><div class="seg"><button class="${schedView==='arena'?'on':''}" onclick="schedView='arena';render()">По площадкам</button><button class="${schedView==='horse'?'on':''}" onclick="schedView='horse';render()">По лошадям</button></div><button class="bt p" onclick="card('newslot','A1|16:00')">+ Запись</button></div></div>
 <div class="dsel">${days.map((d,i)=>`<button class="${d===schedDay?'on':''} ${i===7?'lock':''}" onclick="${i===7?`toast('Запись на ${dd(d)} откроется в ${DOWF(addDays(d,-7))} в 00:00 — одинаково для приложения и администратора. Правило — в разделе «Правила записи».')`:`schedDay='${d}';render()`}"><small>${dow(d)}</small><b>${dd(d)}</b><span>${i===7?'откроется завтра':i===0?'сегодня':fakeDay(d).length+' занятий'}</span></button>`).join('')}</div>
 <div class="tw sched"><table class="gridt"><thead><tr><th class="rh">${schedView==='arena'?'Площадка':'Лошадь'}</th>${HOURS.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr class="${r.soon||r.off?'dim':''}"><th class="rh">${r.c?`<i class="hd-dot" style="background:${r.c}"></i>`:''}<b>${esc(r.n)}</b><small>${esc(r.sub)}</small></th>${HOURS.map(t=>cell(r,t)).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="legend">${Object.entries({ind:'индивидуальное',grp:'группа',kid:'дети · пони',walk:'прогулка',photo:'фотосессия'}).map(([k,n])=>`<span><i class="k-${k}"></i>${n}</span>`).join('')}<span><i class="free"></i>свободно — нажмите, чтобы записать</span></div>
 ${said('«Открывается запись за неделю вперёд… люди писали напрямую менеджеру — запишите нас на субботу, и их записывали. Я ругал: тогда приложение не будет работать.»','Правило «запись открывается за 7 дней» действует одинаково в приложении и у администратора. Обойти его может только руководитель — и это видно в журнале.')}`};
function fakeDay(d){const n=daysBetween(TODAY,d);if(n<=0)return [];const base=SLOTS.filter(s=>s.k!=='photo');return base.filter((s,i)=>(i+n)%4!==0).map((s,i)=>Object.assign({},s,{id:'F'+n+i,st:'booked',t:HOURS[(HOURS.indexOf(s.t)+n)%HOURS.length]}))}

/* ===== Прогулки и компании ===== */
let walkN=4,walkKids=1,walkLong=false,walkT='14:00';
SC.walks=()=>{
 const W=SLOTS.filter(s=>s.w);const k=walkLong?'walk2':'walk';const d=SVC[k].d;
 const hs=freeHorses(walkT,d,['beg','mid']);const pony=freeHorses(walkT,d,['pony']);
 const need=walkN-walkKids;const pick=hs.slice(0,need).concat(pony.slice(0,walkKids));const ok=pick.length>=walkN;
 const instr=Math.ceil(walkN/5);const sum=SVC[k].p*walkN;
 return `<div class="hd"><div><h2>Прогулки и компании</h2><p>Заказчик — один человек с телефоном. Остальные — просто количество: взрослые и дети. Не нужно заводить «виртуальных клиентов» на каждого гостя. Лошадей и инструкторов система подбирает сама — по уровню, по свободному времени и по нагрузке за день.</p></div></div>
 <div class="g21"><div class="pan"><h3>Новая прогулка</h3><p>Попробуйте поменять количество людей или время — подбор пересчитается.</p>
  <div class="wform"><label>Заказчик<input id="wk_n" value="Тимур Ахмедов"></label><label>Телефон<input id="wk_p" value="+7 777 410 63 92"></label>
  <label>Сколько человек<div class="stp"><button onclick="walkN=Math.max(1,walkN-1);walkKids=Math.min(walkKids,walkN);render()">−</button><b>${walkN}</b><button onclick="walkN=Math.min(12,walkN+1);render()">+</button></div></label>
  <label>Из них детей до 10 лет<div class="stp"><button onclick="walkKids=Math.max(0,walkKids-1);render()">−</button><b>${walkKids}</b><button onclick="walkKids=Math.min(walkN,walkKids+1);render()">+</button></div></label>
  <label>Длительность<div class="seg"><button class="${!walkLong?'on':''}" onclick="walkLong=false;render()">1 час</button><button class="${walkLong?'on':''}" onclick="walkLong=true;render()">2 часа</button></div></label>
  <label>Время<select onchange="walkT=this.value;render()">${['11:00','13:00','14:00','15:00','16:00'].map(t=>`<option ${t===walkT?'selected':''}>${t}</option>`).join('')}</select></label></div>
  <div class="pick ${ok?'':'bad'}"><div><small>Лошади</small>${pick.map(h=>horseChip(h.id)).join('')||'—'}${ok?'':`<p>Свободно только ${pick.length} из ${walkN} — предложите ${walkT==='16:00'?'15:00':'16:00'} или поставьте в лист ожидания.</p>`}</div>
   <div><small>Инструкторы</small><b>${instr} · ${instr>1?'Руслан К. и Ерболат Ж.':'Ерболат Ж.'}</b><span>один на пятерых всадников</span></div>
   <div><small>Сумма</small><b>${tg(sum)}</b><span>${walkN} × ${tg(SVC[k].p)} · предоплата 50% по ссылке Kaspi</span></div></div>
  <div class="btns" style="justify-content:flex-start;margin-top:10px"><button class="bt p" onclick="${ok?'newWalk()':`toast('Не хватает лошадей на это время — система не даст записать больше, чем есть.')`}">Записать и отправить ссылку на оплату</button></div></div>
 <div class="pan"><h3>Как было в Fitbase</h3>${[['Компания из 4 человек','заводили заказчика и трёх «тестовых клиентов»'],['Виртуальные клиенты','засоряют базу и отчёты о новых всадниках'],['Подбор лошадей','вручную, по памяти администратора']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="wrapb">${x[1]}</b></div>`).join('')}
  <h3 style="margin-top:14px">Как здесь</h3>${[['Заказчик','одна карточка с телефоном'],['Гости','количество взрослых и детей'],['Лошади','подбираются по уровню и нагрузке'],['Оплата','ссылка Kaspi — в WhatsApp заказчику']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="wrapb">${x[1]}</b></div>`).join('')}</div></div>
 <div class="pan"><h3>Прогулки и фотосессии сегодня</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Заказчик</th><th class="r">Людей</th><th>Лошади</th><th>Инструктор</th><th>Оплата</th><th>Откуда</th></tr></thead><tbody>${W.map(s=>`<tr onclick="card('slot','${s.id}')"><td class="mono">${s.t}</td><td><b>${esc(s.w.who)}</b><div class="mini">${esc(SVC[s.k].n)}</div></td><td class="r">${s.w.n}${s.w.kids?` <span class="mini">· ${s.w.kids} реб.</span>`:''}</td><td>${s.h.map(horseChip).join('')}</td><td>${esc(TR(s.tr).s)}</td><td class="mini">${esc(s.w.paid)}</td><td>${tag(SRCN[s.src])}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('«Если вы записываете четверых — компания хочет на прогулку — мы должны были записать заказчика, а остальных прописывать… Мы начали делать тестовых клиентов.»')}`};
function newWalk(){const k=walkLong?'walk2':'walk';const d=SVC[k].d;const hs=freeHorses(walkT,d,['beg','mid']).slice(0,walkN-walkKids).concat(freeHorses(walkT,d,['pony']).slice(0,walkKids));
 SKN++;SLOTS.push({id:'S'+SKN,t:walkT,k,w:{who:document.getElementById('wk_n').value,ph:document.getElementById('wk_p').value,n:walkN,kids:walkKids,paid:'ссылка на предоплату отправлена'},h:hs.map(h=>h.id),tr:'T5',ar:'A5',st:'booked',src:'admin'});
 SLOTS.sort((a,b)=>tm(a.t)-tm(b.t));render();toast(`Прогулка в ${walkT} записана: ${walkN} ${plural(walkN,['человек','человека','человек'])}, лошади закреплены. Заказчику ушли в WhatsApp время, адрес и ссылка на предоплату.`)}

/* ===== База всадников ===== */
let cliF='all';
const subSt=c=>!c.sub?'нет':c.left<=0||daysBetween(TODAY,c.to)<0?'закончился':c.left<=1||daysBetween(TODAY,c.to)<=5?'заканчивается':'действует';
SC.clients=()=>{
 const F={all:['Все',()=>true],end:['Заканчивается',c=>subSt(c)!=='действует'],risk:['Риск ухода',c=>!!c.risk],kids:['Дети',c=>!!c.kid],stay:['Постой',c=>!!c.stay],nosign:['Без договора',c=>!c.sign]};
 const L=CLIENTS.filter(F[cliF][1]);
 return `<div class="hd"><div><h2>База всадников</h2><p>Около 600 абонементщиков и гости. Карточка одна на всё: абонемент, уровень, тренер, любимая лошадь, история занятий, договор и оплаты. Ребёнок — с данными родителя.</p></div><div class="btns"><button class="bt" onclick="act('import')">Перенести из Fitbase</button><button class="bt p" onclick="card('newcl')">+ Всадник</button></div></div>
 <div class="wid"><div><small>Активных абонементов</small><b class="a">584</b><span>в демо показаны 18</span></div><div><small>Заканчиваются за 7 дней</small><b class="w">47</b><span>им уже ушло предложение продлить</span></div><div><small>Риск ухода</small><b class="r">23</b><span>не были 10+ дней</span></div><div><small>Записываются сами</small><b class="g">81%</b><span>через приложение</span></div><div><small>Новых за октябрь</small><b>38</b><span>из них с таргета — 21</span></div></div>
 <div class="filt">${Object.entries(F).map(([k,v])=>`<button class="${k===cliF?'on':''}" onclick="cliF='${k}';render()">${v[0]} · ${CLIENTS.filter(v[1]).length}</button>`).join('')}</div>
 <div class="tw"><table class="t"><thead><tr><th>Всадник</th><th>Уровень</th><th>Тренер</th><th>Абонемент</th><th class="r">Осталось</th><th>До</th><th>Был</th><th>Откуда</th></tr></thead><tbody>${L.map(c=>`<tr onclick="openCl('${c.id}')"><td><b>${esc(c.n)}</b>${c.kid?`<div class="mini">${esc(c.kid)}</div>`:''}${c.risk?`<div class="mini red">${esc(c.risk)}</div>`:''}</td><td>${dot(LVL[c.lvl].c)}${LVL[c.lvl].n}</td><td>${esc(TR(c.tr).s)}</td><td>${esc(SUBT[c.sub].n)}</td><td class="r mono ${c.left<=1?'red':''}">${c.left} из ${SUBT[c.sub].cnt}</td><td class="mono">${dd(c.to)}</td><td class="mono">${c.last==='—'?'—':dd(c.last)}</td><td>${dot(SRC[c.src]||'#888')}${esc(c.src)}</td></tr>`).join('')}</tbody></table></div>`};
function openCl(id){curCl=id;go('client')}

/* ===== Карточка всадника ===== */
const NOTES={C01:[['29.10','Мадина А.','Рысь уверенно, начали галоп на корде. Посадка — держать пятку ниже.'],['24.10','Мадина А.','Боится на выезде из манежа — пока только крытый.']],C03:[['28.10','Мадина А.','Третье занятие: шаг самостоятельно, рысь с инструктором.']]};
SC.client=()=>{
 const c=CL(curCl);const st=SUBT[c.sub];const used=st.cnt-c.left;const tr=TR(c.tr);const h=HO(c.horse);
 const hist=[0,2,4,7,9,12].map((n,i)=>[addDays(c.last==='—'?TODAY:c.last,-n),i===3&&c.risk?'не пришёл':'пришёл',HORSES[(i*3+c.id.charCodeAt(2))%HORSES.length].n]);
 const ct=CONTRACTS.find(x=>x.cl===c.id);const nb=SLOTS.find(s=>(s.cl===c.id||(s.g||[]).includes(c.id))&&s.st==='booked');
 return `<div class="hd"><div><div class="crumbl"><a onclick="go('clients')">База всадников</a> / ${esc(c.n)}</div><h2>${esc(c.n)}</h2><p>${LVL[c.lvl].n} · тренер ${esc(tr.n)} · с нами с ${dl(c.since)} · ${c.visits} ${plural(c.visits,['занятие','занятия','занятий'])}${c.kid?' · '+esc(c.kid):''}</p></div><div class="btns"><select class="rsel" onchange="openCl(this.value)">${CLIENTS.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${esc(x.n)}</option>`).join('')}</select><button class="bt" onclick="go('wa')">WhatsApp</button><button class="bt p" onclick="card('newslot','A1|16:00|${c.id}')">Записать</button></div></div>
 ${c.risk?`<div class="note"><b>Риск ухода.</b> ${esc(c.risk)}. Система предлагает: написать от имени тренера и предложить удобное время.<button class="bt sm" onclick="toast('Сообщение от имени тренера отправлено: «${esc(c.n.split(' ')[0])}, скучаем! Есть окно в воскресенье в 12:00 — записать?»')">Отправить</button></div>`:''}
 <div class="g3">
  <div class="pan"><h3>Абонемент · ${esc(st.n)}</h3><div class="subring"><div class="ring" style="--p:${pct(used,st.cnt)}"><b>${c.left}</b><small>осталось</small></div><div>${[['Использовано',used+' из '+st.cnt],['Действует до',dl(c.to)],['Цена',tg(st.p)],['Заморозка','до 14 дней, 1 раз']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div>
   <div class="btns" style="justify-content:flex-start;margin-top:8px"><button class="bt p" onclick="card('sell','${c.id}')">Продлить</button><button class="bt" onclick="toast('Абонемент заморожен на 14 дней — срок сдвинут до ${dl(addDays(c.to,14))}. Всаднику ушло уведомление.')">Заморозить</button></div></div>
  <div class="pan"><h3>Лошадь и уровень</h3><div class="hcard" onclick="openHorse('${h.id}')"><i style="background:${h.c}"></i><div><b>${esc(h.n)}</b><span>${esc(h.br)}, ${h.age} лет · ${LVL[h.lvl].n}</span></div></div>
   <p class="mini" style="margin-top:8px">Уровень определяет, на каких лошадей всадник может записаться в приложении. Новичок не увидит спортивных.</p>
   <div class="lvlbar">${['pony','beg','mid','pro'].map(l=>`<span class="${l===c.lvl?'on':''}">${LVL[l].n}</span>`).join('')}</div></div>
  <div class="pan"><h3>Документы и связь</h3>${[['Телефон',esc(c.ph)],['Договор',ct?`${esc(ct.no)} · ${ct.st==='signed'?'подписан':'ждёт подписи'}`:'подписан · 2024'],['Приложение','установлено · пуш включены'],['Откуда пришёл',esc(c.src)],['Ближайшая запись',nb?nb.t+' сегодня':'нет']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 </div>
 <div class="g2"><div class="pan"><h3>Заметки тренера</h3><p>Видит сам всадник в приложении — понятно, над чем работать.</p>${(NOTES[c.id]||[['30.10',tr.s,'Хорошая работа на рыси, следующий шаг — упражнения без стремян.']]).map(n=>`<div class="li"><i>${n[0]}</i><span><b>${esc(n[1])}</b> — ${esc(n[2])}</span></div>`).join('')}</div>
 <div class="pan"><h3>Последние занятия</h3>${hist.map(x=>`<div class="kv"><span>${dl(x[0])} · ${esc(x[2])}</span><b class="${x[1]==='пришёл'?'':'red'}">${x[1]}</b></div>`).join('')}</div></div>`};

/* ===== Абонементы ===== */
let stopSale=true;
SC.subs=()=>{
 const end=CLIENTS.filter(c=>subSt(c)!=='действует');
 return `<div class="hd"><div><h2>Абонементы</h2><p>Виды, цены и сроки настраиваются здесь. Продажа — у администратора или в приложении с оплатой Kaspi; занятие списывается по отметке «пришёл» или по отмене позже 12 часов.</p></div><div class="btns"><button class="bt p" onclick="card('sell','C16')">Продать абонемент</button></div></div>
 <div class="note ${stopSale?'':'ok'}"><b>${stopSale?'Стоп-продажа новых абонементов включена':'Продажа открыта'}.</b> ${stopSale?'Мест не хватает до открытия Левады 2. Желающие встают в очередь на покупку — 7 ноября им автоматически уйдёт предложение.':'Новые абонементы продаются в приложении и на ресепшн.'} <span class="sw ${stopSale?'on':''}" onclick="stopSale=!stopSale;render();toast(stopSale?'Стоп-продажа: в приложении кнопка «Купить» сменилась на «Встать в очередь».':'Продажа открыта — в приложении снова кнопка «Купить».')"></span></div>
 <div class="g21"><div class="pan"><h3>Виды абонементов</h3><div class="tw"><table class="t"><thead><tr><th>Абонемент</th><th class="r">Занятий</th><th class="r">Срок</th><th class="r">Цена</th><th class="r">За занятие</th><th class="r">Продано в октябре</th></tr></thead><tbody>${Object.entries(SUBT).map(([k,s],i)=>`<tr><td><b>${esc(s.n)}</b></td><td class="r">${s.cnt}</td><td class="r">${s.days} дн.</td><td class="r mono">${tg(s.p)}</td><td class="r mono">${tg(s.p/s.cnt)}</td><td class="r">${[31,64,22,27,19][i]}</td></tr>`).join('')}</tbody></table></div>
  <div class="g2" style="margin:12px 0 0">${[['Отмена позже 12 часов','занятие списывается'],['Не пришёл без отмены','занятие списывается, тренер видит'],['Заморозка','до 14 дней, один раз за абонемент'],['Перенос остатка','при продлении до окончания — сохраняется']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="wrapb">${x[1]}</b></div>`).join('')}</div></div>
 <div class="pan"><h3>Заканчиваются · ${end.length}</h3><p>За 3 дня до конца — предложение продлить в приложении, за день — сообщение в WhatsApp.</p>${end.map(c=>`<div class="kv" onclick="openCl('${c.id}')" style="cursor:pointer"><span><b>${esc(c.n)}</b><br><small class="mini">${esc(SUBT[c.sub].n)} · осталось ${c.left} · до ${dd(c.to)}</small></span><button class="bt sm" onclick="event.stopPropagation();card('sell','${c.id}')">Продлить</button></div>`).join('')}</div></div>`};
function sellSub(id){const c=CL(id);const t=document.getElementById('sl_t').value;const s=SUBT[t];c.sub=t;c.left+=s.cnt;c.to=addDays(TODAY,s.days);delete c.risk;PAYS.push({t:'10:40',who:c.n,what:'Абонемент «'+s.n+'»',sum:s.p,m:document.getElementById('sl_m').value,src:'ресепшн'});closeM();render();toast(`Абонемент «${esc(s.n)}» продан: ${c.left} занятий до ${dl(c.to)}. Чек и договор ушли в WhatsApp, в приложении баланс обновился.`)}

/* ===== Лист ожидания ===== */
SC.wait=()=>`<div class="hd"><div><h2>Лист ожидания</h2><p>Если свободных лошадей нет — всадник встаёт в очередь в приложении. Кто-то отменил — первому в очереди приходит предложение, на ответ 30 минут, дальше — следующему. Администратор ничего не ищет вручную, и правила для всех одинаковые.</p></div><div class="btns"><button class="bt p" onclick="freeSlot()">Показать: кто-то отменил</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>#</th><th>Всадник</th><th>Когда хочет</th><th>Занятие</th><th>Лошадь</th><th>В очереди с</th><th>Откуда</th><th></th></tr></thead><tbody>${WAIT.map((w,i)=>{const c=CL(w.cl);return `<tr><td class="mono">${i+1}</td><td><b>${esc(c.n)}</b><div class="mini">${esc(SUBT[c.sub].n)} · осталось ${c.left}</div></td><td class="mono">${dow(w.d)} ${dd(w.d)} · ${w.t}</td><td>${esc(SVC[w.k].n)}</td><td>${esc(w.want)}</td><td class="mono">${w.since}</td><td>${tag(SRCN[w.src])}</td><td><button class="bt sm" onclick="offerW('${w.id}')">Предложить</button></td></tr>`}).join('')||'<tr><td colspan="8" class="mini">Очередь пуста.</td></tr>'}</tbody></table></div>
 <div class="g3">${[['Почему очередь','Свободных лошадей нужного уровня нет. Лошадь не может работать больше своего предела в день — это бережёт лошадей.'],['Что видит всадник','Своё место в очереди и сообщение, когда появилось окно. Не нужно писать менеджеру.'],['Что видит администратор','Ту же очередь. Поставить «мимо очереди» может только руководитель.']].map(x=>`<div class="pan"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('')}</div>
 ${said('«Очень часто бывает, что в приложении я стою в листе ожидания… и мне неудобно, я напрямую пишу менеджеру.»','«Если в приложении в листе ожидания — значит нет свободных лошадей. И менеджер вам скажет то же самое.» Здесь очередь одна и для приложения, и для администратора.')}`;
function offerW(id){const w=WAIT.find(x=>x.id===id);const c=CL(w.cl);toast(`${esc(c.n.split(' ')[0])} получила предложение в приложении: ${dd(w.d)} в ${w.t}. 30 минут на подтверждение — дальше место уйдёт следующему.`)}
function freeSlot(){const w=WAIT[0];if(!w){toast('Очередь пуста.');return}const c=CL(w.cl);WAIT.shift();render();toast(`Отменили запись на ${dd(w.d)} ${w.t}. Первая в очереди — ${esc(c.n)} — подтвердила в приложении за 4 минуты. Запись создана, лошадь закреплена.`)}

/* ===== Конюшня ===== */
let hF='all';
SC.horses=()=>{
 const F={all:['Все',()=>true],work:['В работе',h=>h.st==='work'],rest:['Отдых и ветеринар',h=>h.st!=='work'],club:['Клубные',h=>h.own==='club'],stay:['На постое',h=>h.own==='stay']};
 const L=HORSES.filter(F[hF][1]);
 return `<div class="hd"><div><h2>Лошади</h2><p>Каждая лошадь — со своим пределом нагрузки в день, уровнем всадников, ковкой и прививками. Лошадь на отдыхе или у ветеринара не появится в записи ни в приложении, ни у администратора.</p></div><div class="btns"><button class="bt p" onclick="toast('Новая лошадь: кличка, порода, возраст, уровень всадников, предел занятий в день, денник, владелец.')">+ Лошадь</button></div></div>
 <div class="wid"><div><small>Всего</small><b>${HORSES.length}</b><span>в демо; в клубе — 42</span></div><div><small>В работе</small><b class="g">${HORSES.filter(h=>h.st==='work').length}</b><span>сегодня</span></div><div><small>Отдых и ветеринар</small><b class="w">${HORSES.filter(h=>h.st!=='work').length}</b><span>не попадают в запись</span></div><div><small>На постое</small><b>${HORSES.filter(h=>h.own==='stay').length}</b><span>работают только с владельцем</span></div><div><small>Ковка за 7 дней</small><b class="i">${VETS.filter(v=>v.k==='Ковка'&&v.st==='plan').length}</b><span>кузнец — понедельник и среда</span></div></div>
 <div class="filt">${Object.entries(F).map(([k,v])=>`<button class="${k===hF?'on':''}" onclick="hF='${k}';render()">${v[0]} · ${HORSES.filter(v[1]).length}</button>`).join('')}</div>
 <div class="hgrid">${L.map(h=>{const n=hLoad(h.id);return `<div class="hbox ${h.st}" onclick="openHorse('${h.id}')"><div class="hb-top"><i style="background:${h.c}"></i><div><b>${esc(h.n)}</b><span>${esc(h.br)} · ${h.sex}, ${h.age} лет</span></div><span class="tag ${HST[h.st].c}">${HST[h.st].n}</span></div>
  <div class="hb-m"><div><small>Денник</small><b>${h.stall}</b></div><div><small>Уровень</small><b>${LVL[h.lvl].n}</b></div><div><small>Сегодня</small><b class="${n>=h.max?'red':''}">${n} из ${h.max}</b></div><div><small>Ковка</small><b>${dd(h.far)}</b></div></div>
  ${h.own==='stay'?`<div class="mini">Постой · владелец ${esc(h.ownr)}</div>`:''}${h.note?`<div class="mini">${esc(h.note)}</div>`:''}</div>`}).join('')}</div>`};
function openHorse(id){if(!allowed('horse')){toast('Карточка лошади этой роли недоступна.');return}curHorse=id;go('horse')}

/* ===== Карточка лошади ===== */
SC.horse=()=>{
 const h=HO(curHorse);const my=SLOTS.filter(s=>s.h.includes(h.id)&&s.st!=='cancel');const vv=VETS.filter(v=>v.h===h.id);
 const wk=[3,2,3,1,0,2,my.length];
 return `<div class="hd"><div><div class="crumbl"><a onclick="go('horses')">Лошади</a> / ${esc(h.n)}</div><h2>${esc(h.n)}</h2><p>${esc(h.br)} · ${h.sex}, ${h.age} лет · ${h.w} кг · денник ${h.stall} · ${h.own==='club'?'клубная':'постой, владелец '+esc(h.ownr)}</p></div><div class="btns"><select class="rsel" onchange="openHorse(this.value)">${HORSES.map(x=>`<option value="${x.id}" ${x.id===h.id?'selected':''}>${esc(x.n)}</option>`).join('')}</select>
  <div class="seg">${Object.entries(HST).map(([k,v])=>`<button class="${h.st===k?'on':''}" onclick="setHst('${k}')">${v.n}</button>`).join('')}</div></div></div>
 ${h.note?`<div class="note"><b>Заметка.</b> ${esc(h.note)}</div>`:''}
 <div class="g3"><div class="pan"><h3>Нагрузка</h3><div class="hload"><b class="${my.length>=h.max?'red':''}">${my.length} / ${h.max}</b><span>занятий сегодня из допустимого</span></div>
  <div class="wkbars">${wk.map((n,i)=>`<div><i style="height:${n*22+4}px" class="${n>=h.max?'r':''}"></i><small>${dow(addDays(TODAY,i-6))}</small></div>`).join('')}</div>
  <p class="mini">Предел меняет старший тренер или ветеринар. После двух дней на пределе система предложит день отдыха.</p></div>
 <div class="pan"><h3>Сегодня</h3>${my.map(s=>`<div class="kv" onclick="card('slot','${s.id}')" style="cursor:pointer"><span>${s.t} · ${esc(slotWho(s))}</span><b>${esc(TR(s.tr).s)}</b></div>`).join('')||'<p class="mini">Сегодня не работает.</p>'}
  <h3 style="margin-top:12px">Кто может ездить</h3><p class="mini">${h.own==='stay'?'Только владелец и Данияр С. — в приложении другим не показывается.':'Всадники уровня «'+LVL[h.lvl].n+'»'+(h.lvl==='pro'?' и выше':' и выше; спортивные — по согласованию тренера')+'.'}</p></div>
 <div class="pan"><h3>Уход</h3>${[['Ковка',dl(h.far)],['Прививки до',dl(h.vac)],['Рацион','овёс 4 кг, сено 9 кг, 2 раза'],['Седло и амуниция','седло №'+h.stall.replace('-','')+', трензель'],['Последний осмотр','24.10 · без замечаний']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div>
 <div class="pan"><h3>Журнал ветеринара и кузнеца</h3>${vv.map(v=>`<div class="li"><i>${dd(v.d)}</i><span><b>${esc(v.k)}</b> — ${esc(v.t)} · ${esc(STAFF[v.who]||v.who)} ${v.st==='plan'?tag('запланировано','i'):tag('сделано','g')}</span></div>`).join('')||'<p class="mini">Записей нет — всё по плану.</p>'}</div>`};
function setHst(k){const h=HO(curHorse);h.st=k;render();toast(k==='work'?`${esc(h.n)} снова в работе — появилась в записи.`:`${esc(h.n)}: ${HST[k].n}. Из записи убрана, всадникам на будущие занятия предложена замена лошади.`)}

/* ===== Ветеринар и ковка ===== */
SC.vet=()=>{
 const plan=VETS.filter(v=>v.st==='plan').sort((a,b)=>a.d<b.d?-1:1),done=VETS.filter(v=>v.st==='done');
 return `<div class="hd"><div><h2>Ветеринар и ковка</h2><p>План на две недели: ковка, прививки, зубы, глистогонка, осмотры. В день ковки лошадь автоматически не ставится на утренние занятия.</p></div><div class="btns"><button class="bt p" onclick="toast('Новая запись в журнал: лошадь, что сделано, кто, следующая дата — напоминание придёт ветеринару и конюху.')">+ Запись</button></div></div>
 <div class="days">${[0,1,2,3,4,5,6,7,8].map(i=>{const d=addDays(TODAY,i);const n=plan.filter(v=>v.d===d);return `<div class="day ${n.length>1?'warn':''}"><small>${dow(d)} ${dd(d)}</small><span>${n.map(v=>esc(HO(v.h).n)).join(', ')||'—'}</span><b>${n.length?n.map(v=>v.k).join(', '):''}</b></div>`}).join('')}</div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Запланировано</h3>${plan.map(v=>`<div class="li" onclick="openHorse('${v.h}')" style="cursor:pointer"><i>${dd(v.d)}</i><span><b>${esc(HO(v.h).n)} · ${esc(v.k)}</b> — ${esc(v.t)}<br><small class="mini">${esc(STAFF[v.who]||v.who)}</small></span></div>`).join('')}</div>
 <div class="pan"><h3>Сделано</h3>${done.map(v=>`<div class="li ok"><i>${dd(v.d)}</i><span><b>${esc(HO(v.h).n)} · ${esc(v.k)}</b> — ${esc(v.t)}</span></div>`).join('')}
  <h3 style="margin-top:12px">Прививки истекают</h3>${HORSES.slice().sort((a,b)=>a.vac<b.vac?-1:1).slice(0,4).map(h=>`<div class="kv"><span>${esc(h.n)}</span><b>${dl(h.vac)}</b></div>`).join('')}</div></div>`};

/* ===== Манежи и левады ===== */
SC.arenas=()=>`<div class="hd"><div><h2>Манежи и левады</h2><p>У каждой площадки — вместимость и часы работы. Запись сверх вместимости невозможна. Новая левада добавляется одной строкой — и сразу появляется в приложении.</p></div></div>
 <div class="agrid">${ARENAS.map(a=>{const sl=SLOTS.filter(s=>s.ar===a.id&&s.st!=='cancel');const r=sl.reduce((x,s)=>x+riders(s),0);return `<div class="abox ${a.st}"><div class="ab-h"><b>${esc(a.n)}</b>${a.st==='soon'?tag('с 7 ноября','w'):tag('открыта','g')}</div><p>${esc(a.d)}</p>
  ${[['Вместимость',a.cap+' всадников'],['Занятий сегодня',sl.length],['Всадников сегодня',r],['Загрузка',a.st==='soon'?'—':pct(r,a.cap*HOURS.length)+'%']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}
  ${a.st==='soon'?`<button class="bt p sm" onclick="openLev()">Открыть запись с 7 ноября</button>`:''}</div>`}).join('')}</div>
 ${said('«Мы поставили на стоп продажу абонементов и ждём второе место — леваду, где обучение проходит… через неделю-две откроется.»','Когда левада откроется — одна кнопка: площадка появляется в расписании и в приложении, стоп-продажа снимается, очередь на покупку получает предложение.')}`;
function openLev(){const a=AR('A4');a.st='open';a.d='обучение новичков · открыта';stopSale=false;render();toast('Левада 2 открыта с 7 ноября: +4 места в час. Стоп-продажа снята, 31 человеку из очереди на покупку ушло предложение купить абонемент.')}


/* ===== Заявки и воронка ===== */
SC.leads=()=>{
 const bySrc={};LEADS.forEach(l=>{bySrc[l.src]=(bySrc[l.src]||0)+1});
 return `<div class="hd"><div><h2>Заявки и воронка</h2><p>Каждая заявка — из таргета, Instagram, WhatsApp, 2ГИС — попадает сюда сама. Видно, кто ответил, сколько дошло до пробного и до абонемента. Весной поток вырастет вдвое — воронка нужна к этому моменту.</p></div><div class="btns"><button class="bt p" onclick="card('newlead')">+ Заявка</button></div></div>
 <div class="wid"><div><small>Заявок за октябрь</small><b class="a">94</b><span>таргет 41 · Instagram 33 · WhatsApp 20</span></div><div><small>Ответ в среднем</small><b class="g">11 мин</b><span>цель — до 15 минут</span></div><div><small>Дошли до пробного</small><b>52%</b><span>49 человек</span></div><div><small>Купили абонемент</small><b class="g">38</b><span>40% от заявок</span></div><div><small>Цена клиента с таргета</small><b>${tg(9800)}</b><span>бюджет 206 000 ₸ / 21</span></div></div>
 <div class="pipe">${LST.map(([k,n])=>{const L=LEADS.filter(l=>l.st===k);return `<div><div class="pch"><b>${n}</b><span>${L.length}</span></div>${L.map(l=>`<div class="pc" onclick="advLead('${l.id}')"><b>${esc(l.n)}</b><span class="pn">${esc(l.want)}</span>${l.sum?`<span class="pp">${tg(l.sum)}</span>`:''}<div class="prow">${tag(esc(l.src))}<span class="mini">${esc(l.d)}</span>${l.why?tag('причина: '+esc(l.why),'r'):''}</div></div>`).join('')}</div>`}).join('')}</div>
 <p class="mini">Нажмите на карточку — заявка перейдёт на следующий этап. «Записан на пробное» создаёт запись в расписании, «Купил абонемент» — всадника в базе.</p>
 <div class="g2"><div class="pan"><h3>Источники в этом месяце</h3>${Object.entries({'Таргет':41,'Instagram':33,'WhatsApp':20,'2ГИС':9,'Сарафан':14}).map(([k,v])=>`<div class="hl"><span>${dot(SRC[k])}${k}</span><div class="bar"><i style="--w:${v*2.2}%;background:${SRC[k]}"></i></div><b>${v}</b></div>`).join('')}</div>
 <div class="pan"><h3>Весна: поток ×2</h3>${[['Сейчас заявок в месяц','≈ 95'],['Весной','≈ 190'],['Администраторов нужно без системы','+2'],['С приложением и воронкой','те же, ответ — шаблоном'],['Новые площадки','Левада 2 и ещё локации к весне']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div>
 ${said('«Весной мы ждём поток ×2… расчёт за зиму всё подготовить.»')}`};
function advLead(id){const l=LEADS.find(x=>x.id===id);const o=LST.map(x=>x[0]);const i=o.indexOf(l.st);if(l.st==='lost'||l.st==='sub'){toast('Заявка закрыта.');return}l.st=o[Math.min(i+1,4)];render();toast(`${esc(l.n)}: ${LST.find(x=>x[0]===l.st)[1].toLowerCase()}.${l.st==='trial'?' Пробное занятие записано, в WhatsApp ушли время, адрес и что взять с собой.':l.st==='sub'?' Всадник создан, договор отправлен на подпись.':''}`)}

/* ===== WhatsApp ===== */
let curChat=0;
const CHATS=[
 {n:'Акерке Сулейменова',src:'Таргет',last:'Здравствуйте! Хочу научиться ездить, с чего начать?',t:'10:22',un:1,m:[['in','Здравствуйте! Хочу научиться ездить, с чего начать?','10:22']]},
 {n:'Компания «Kaz Minerals Team»',src:'WhatsApp',last:'Нас 12 человек, можно 15 ноября?',t:'вчера',un:0,m:[['in','Добрый день! Хотим корпоративную прогулку, нас 12 человек. Можно 15 ноября?','17:05'],['out','Добрый день! 15 ноября в 11:00 свободно 12 лошадей. Прогулка 2 часа — 20 000 ₸ с человека. Забронировать?','17:09'],['in','Да, давайте. Счёт на компанию нужен','17:20']]},
 {n:'Сабина Темирова',src:'Таргет',last:'Спасибо, договор подписала',t:'08:40',un:0,m:[['sys','Абонемент «Детский · 8» оплачен · 76 000 ₸','31.10 10:31'],['out','Сабина, вот ссылка на договор для подписи. Первое занятие Аяжан — сегодня в 14:00, Пломбир и тренер Аружан.','10:33'],['in','Спасибо, договор подписала','10:40']]},
 {n:'Гульнара Тасова',src:'2ГИС',last:'Ребёнку 8 лет, пони будет?',t:'вчера',un:0,m:[['in','Ребёнку 8 лет, пони будет?','19:12'],['out','Да, Ириска — пони для детей. Прогулка в 15:00 записана на троих.','19:15']]}
];
const TPL=[['Как начать','Первое занятие — индивидуальное с тренером, 15 000 ₸. Подберём лошадь по росту и опыту. Удобно в будни или в выходные?'],['Прогулка','Прогулка в предгорья: 1 час — 12 000 ₸, 2 часа — 20 000 ₸ с человека. Сколько вас будет и в какой день?'],['Адрес и что взять','Мы в предгорьях Алматы, точка в 2ГИС — «Almaty Hills». Возьмите удобные брюки и закрытую обувь, шлем дадим.'],['Ссылка на приложение','Записывайтесь сами в приложении Almaty Hills: свободные окна, лошади и ваш абонемент — в одном месте.']];
SC.wa=()=>{const c=CHATS[curChat];
 return `<div class="hd"><div><h2>WhatsApp</h2><p>Переписка всех администраторов в одном окне — с телефона тоже. Из чата: записать, отправить ссылку на оплату или договор. Подключение через Green-API — около 5 000 ₸ в месяц вместо 36 000 ₸ сейчас.</p></div></div>
 <div class="wa"><div class="wal">${CHATS.map((x,i)=>`<div class="wac ${i===curChat?'on':''}" onclick="curChat=${i};render()"><b>${esc(x.n)}</b><span>${esc(x.last)}</span><em>${x.t}${x.un?` · <i>${x.un}</i>`:''}</em></div>`).join('')}</div>
 <div class="war"><div class="wah"><b>${esc(c.n)}</b><span>${esc(c.src)}</span><div class="btns"><button class="bt sm" onclick="card('newslot','A1|16:00')">Записать</button><button class="bt sm" onclick="toast('Ссылка на оплату Kaspi отправлена в чат.')">Ссылка на оплату</button><button class="bt sm" onclick="toast('Договор на подпись отправлен — клиент подписывает по ссылке с телефона.')">Договор</button></div></div>
  <div class="chat">${c.m.map(m=>`<div class="msg ${m[0]}">${esc(m[1])}<small>${m[2]}</small></div>`).join('')}</div>
  <div class="tpls">${TPL.map((t,i)=>`<span class="tpl" onclick="waSend(${i})"><b>${t[0]}</b></span>`).join('')}</div></div></div>
 <div class="g3">${[['Сейчас','Wazzup — 36 000 ₸ в месяц за канал'],['Будет','Green-API — около 5 000 ₸ в месяц'],['Экономия','≈ 31 000 ₸ в месяц, 372 000 ₸ в год']].map(x=>`<div class="pan"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('')}</div>`};
function waSend(i){CHATS[curChat].m.push(['out',TPL[i][1],NOW]);CHATS[curChat].last=TPL[i][1];CHATS[curChat].un=0;render()}

/* ===== Договоры ===== */
SC.contracts=()=>`<div class="hd"><div><h2>Договоры и подпись</h2><p>Договор формируется из карточки всадника сам: ФИО, абонемент, для ребёнка — данные родителя и согласие на риски. Ссылка на подпись уходит в WhatsApp, клиент подписывает с телефона — кодом из SMS или ЭЦП. Без отдельной платы за сервис подписи.</p></div><div class="btns"><button class="bt p" onclick="toast('Новый договор: выберите всадника — шаблон заполнится сам.')">+ Договор</button></div></div>
 <div class="wid"><div><small>Подписано за октябрь</small><b class="g">41</b><span>в среднем за 2 часа после отправки</span></div><div><small>Ждут подписи</small><b class="w">${CONTRACTS.filter(c=>c.st==='sent').length}</b><span>напоминание через 24 часа</span></div><div><small>Черновики</small><b>${CONTRACTS.filter(c=>c.st==='draft').length}</b><span></span></div><div><small>Шаблонов</small><b>4</b><span>услуги, ребёнок, постой, прокат</span></div><div><small>Бумаги</small><b class="g">0</b><span>архив в системе</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>№</th><th>Всадник</th><th>Документ</th><th>Дата</th><th>Статус</th><th></th></tr></thead><tbody>${CONTRACTS.map((c,i)=>`<tr><td class="mono">${c.no}</td><td><b>${esc(CL(c.cl).n)}</b></td><td>${esc(c.what)}</td><td class="mono">${dd(c.d)}</td><td>${c.st==='signed'?tag('подписан','g')+`<div class="mini">${esc(c.sign)}</div>`:c.st==='sent'?tag('отправлен','w'):tag('черновик')}</td><td>${c.st!=='signed'?`<button class="bt sm" onclick="signC(${i})">${c.st==='draft'?'Отправить':'Показать подпись'}</button>`:`<button class="bt sm" onclick="card('contract',${i})">Открыть</button>`}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Мы работаем по договорам… это всё интегрируется с CRM, заносится в базу.»','Подпись — внутри системы. Не нужен отдельный платный сервис: договор, подпись и оплата лежат в карточке всадника.')}`;
function signC(i){const c=CONTRACTS[i];if(c.st==='draft'){c.st='sent';render();toast('Ссылка на подпись ушла в WhatsApp.');return}c.st='signed';c.sign='SMS-код · сегодня '+NOW;CL(c.cl).sign=true;render();toast(`${esc(CL(c.cl).n)} подписал(а) договор ${c.no} по ссылке. Копия ушла в WhatsApp, PDF — в карточке.`)}

/* ===== Касса и оплаты ===== */
SC.cash=()=>{const s=PAYS.reduce((a,p)=>a+p.sum,0);const by={};PAYS.forEach(p=>{by[p.m]=(by[p.m]||0)+p.sum});
 return `<div class="hd"><div><h2>Касса и оплаты</h2><p>Каждая оплата привязана к всаднику, абонементу или прогулке. Предоплата по ссылке Kaspi приходит сама. Долги видны сразу — не нужно сверять тетрадь и выписку.</p></div><div class="btns"><button class="bt p" onclick="card('sell','C16')">Принять оплату</button></div></div>
 <div class="wid"><div><small>Сегодня</small><b class="a">${tg(s)}</b><span>${PAYS.length} ${plural(PAYS.length,['оплата','оплаты','оплат'])}</span></div>${Object.entries(by).map(([k,v])=>`<div><small>${k}</small><b>${tg(v)}</b><span>${pct(v,s)}%</span></div>`).join('')}<div><small>Долги</small><b class="r">${tg(DEBTS.reduce((a,d)=>a+d.sum,0))}</b><span>${DEBTS.length} человека</span></div></div>
 <div class="g21"><div class="pan"><h3>Оплаты сегодня</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Кто</th><th>За что</th><th>Способ</th><th class="r">Сумма</th></tr></thead><tbody>${PAYS.map(p=>`<tr><td class="mono">${p.t}</td><td><b>${esc(p.who)}</b></td><td>${esc(p.what)}<div class="mini">${esc(p.src)}</div></td><td>${tag(p.m,p.m==='Kaspi'?'r':'')}</td><td class="r mono">${tg(p.sum)}</td></tr>`).join('')}<tr class="total"><td colspan="4">Итого</td><td class="r">${tg(s)}</td></tr></tbody></table></div></div>
 <div class="pan"><h3>Долги</h3>${DEBTS.map((d,i)=>`<div class="kv"><span><b>${esc(d.who)}</b><br><small class="mini">${esc(d.what)}</small></span><button class="bt sm" onclick="DEBTS.splice(${i},1);render();toast('Ссылка на оплату отправлена в WhatsApp. Как оплатят — долг закроется сам.')">${tg(d.sum)} · ссылка</button></div>`).join('')}</div></div>`};

/* ===== Зарплата тренеров ===== */
const PAYM={T1:{ind:68,grp:22,kid:0,walk:4},T2:{ind:31,grp:74,kid:6,walk:0},T3:{ind:0,grp:0,kid:0,walk:58},T4:{ind:4,grp:0,kid:96,walk:0},T5:{ind:0,grp:0,kid:0,walk:47}};
const BONUS={T1:40000,T2:25000,T3:0,T4:30000,T5:0};
let payT='T1';
SC.pay=()=>{
 const row=id=>{const m=PAYM[id],t=TR(id);const base=Object.entries(m).reduce((a,[k,n])=>a+n*SVC[k].p*(k==='grp'?3:k==='walk'?3.4:1),0);const sal=base*t.pct/100+BONUS[id];return {t,m,base,sal}};
 const R=TRAINERS.map(t=>row(t.id));const c=row(payT);
 return `<div class="hd"><div><h2>Зарплата тренеров · октябрь</h2><p>Процент считается от фактически проведённых занятий — по отметкам «пришёл» в расписании. Скидки, бесплатные и пробные занятия учитываются по правилам, которые вы задаёте. Всё сходится копейка в копейку с кассой.</p></div><div class="btns"><button class="bt" onclick="toast('Ведомость в Excel сформирована.')">Ведомость в Excel</button><button class="bt p" onclick="toast('Зарплата утверждена. Тренеры видят свой расчёт в приложении.')">Утвердить</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Тренер</th><th class="r">Индив.</th><th class="r">Группы</th><th class="r">Дети</th><th class="r">Прогулки</th><th class="r">Выручка занятий</th><th class="r">Процент</th><th class="r">Премия</th><th class="r">К выплате</th></tr></thead><tbody>${R.map(r=>`<tr class="${r.t.id===payT?'sel':''}" onclick="payT='${r.t.id}';render()"><td><b>${esc(r.t.n)}</b><div class="mini">${esc(r.t.sp)}</div></td><td class="r">${r.m.ind}</td><td class="r">${r.m.grp}</td><td class="r">${r.m.kid}</td><td class="r">${r.m.walk}</td><td class="r mono">${tg(r.base)}</td><td class="r">${r.t.pct}%</td><td class="r mono">${tg(BONUS[r.t.id])}</td><td class="r mono"><b>${tg(r.sal)}</b></td></tr>`).join('')}<tr class="total"><td colspan="8">Фонд оплаты тренеров</td><td class="r">${tg(R.reduce((a,r)=>a+r.sal,0))}</td></tr></tbody></table></div>
 <div class="g2"><div class="pan"><h3>Расчёт · ${esc(c.t.n)}</h3>${Object.entries(c.m).filter(([k,n])=>n).map(([k,n])=>`<div class="kv"><span>${esc(SVC[k].n)} × ${n}</span><b>${tg(n*SVC[k].p*(k==='grp'?3:k==='walk'?3.4:1))}</b></div>`).join('')}<div class="kv"><span>Процент тренера</span><b>${c.t.pct}%</b></div><div class="kv"><span>Премия за удержание всадников</span><b>${tg(BONUS[c.t.id])}</b></div><div class="kv"><span><b>К выплате</b></span><b>${tg(c.sal)}</b></div></div>
 <div class="pan"><h3>Правила расчёта</h3>${[['Процент','от суммы проведённых занятий, у каждого свой'],['Групповое','считается по числу пришедших всадников'],['Пробное и бесплатное','по фиксированной ставке 3 000 ₸'],['Скидка клиенту','процент тренера — от суммы со скидкой'],['Премия','если продлили ≥ 80% его всадников']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="wrapb">${x[1]}</b></div>`).join('')}</div></div>
 ${said('«Зарплатный фонд полностью: процентаж, проценты, скидки, оплаты — всё считает система, копейка в копейку… вплоть до зарплат сотрудников.»')}`};

/* ===== Отчёты собственника ===== */
SC.dash=()=>{const rev=[['Абонементы',14820000],['Прогулки',3960000],['Постой',1980000],['Фотосессии',600000]];const t=rev.reduce((a,r)=>a+r[1],0);
 return `<div class="hd"><div><h2>Отчёты собственника · октябрь</h2><p>Главные цифры клуба на одном экране и в WhatsApp каждый вечер в 21:00. Источник — то, что администраторы и тренеры и так отмечают в работе.</p></div><div class="btns"><button class="bt" onclick="toast('Вечерний отчёт в WhatsApp: занятия, выручка, новые абонементы, кто не продлил, лошади на пределе.')">Отчёт в WhatsApp</button></div></div>
 <div class="wid"><div><small>Выручка</small><b class="a">${mln(t)}</b><span>+12% к сентябрю</span></div><div><small>Продлили абонемент</small><b class="g">83%</b><span>цель — 85%</span></div><div><small>Занятий проведено</small><b>2 940</b><span>не пришли без отмены — 3,1%</span></div><div><small>Загрузка лошадей</small><b class="w">91%</b><span>на пределе — нужна Левада 2</span></div><div><small>Записались сами</small><b class="g">81%</b><span>через приложение</span></div></div>
 <div class="g2"><div class="pan"><h3>Выручка по направлениям</h3>${rev.map(r=>`<div class="hl"><span>${r[0]}</span><div class="bar"><i class="b" style="--w:${pct(r[1],rev[0][1])}%"></i></div><b>${mln(r[1])}</b></div>`).join('')}</div>
 <div class="pan"><h3>По неделям: занятия</h3><div class="wkbars big">${[640,702,688,744,166].map((n,i)=>`<div><i style="height:${n/6}px"></i><small>${['1–7','8–14','15–21','22–28','29–31'][i]}</small><b>${n}</b></div>`).join('')}</div></div></div>
 <div class="g3">${[['Самая загруженная лошадь','Ласточка — 3 занятия в день 24 дня из 31'],['Лучший тренер по продлениям','Мадина А. — 91% её всадников продлили'],['Свободные окна','будни 12:00–15:00 — предложить пакет «обед + прогулка»']].map(x=>`<div class="pan"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('')}</div>`};

/* ===== Приложение всадника ===== */
let appTab='home',appDay=TODAY,appMe='C01',appTr=['S03','S09','S14','S16'];
const appSlots=d=>{const L=CL(appMe).lvl;const lv=L==='pro'?['pro','mid']:L==='mid'?['mid','beg']:L==='pony'?['pony']:['beg'];
 return ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00','19:00'].filter(t=>d!==TODAY||tm(t)>tm(NOW)).map((t,i)=>{let hs;if(d===TODAY)hs=freeHorses(t,60,lv);else{const n=(daysBetween(TODAY,d)*3+i)%5;hs=HORSES.filter(h=>lv.includes(h.lvl)&&h.st==='work'&&h.own==='club').slice(0,n===4?0:n)}return {t,hs,tr:i%3?'T2':'T1'}})};
function appBook(t,hid){const c=CL(appMe);if(c.left<=0){toast('В абонементе не осталось занятий — продлите в разделе «Абонемент».');return}
 if(appDay===TODAY){SKN++;SLOTS.push({id:'S'+SKN,t,k:'ind',cl:c.id,h:[hid],tr:'T2',ar:'A1',st:'booked',src:'app'});SLOTS.sort((a,b)=>tm(a.t)-tm(b.t))}
 c.left--;appTab='home';render();toast(`Асем записалась сама: ${dd(appDay)} в ${t}, лошадь ${esc(HO(hid).n)}. В расписании администратора запись появилась сразу, в абонементе осталось ${c.left}.`)}
function appWait(t){WAIT.push({id:'W'+(WAIT.length+9),cl:appMe,d:appDay,t,k:'ind',want:'любая',since:dd(TODAY)+' '+NOW,src:'app'});render();toast(`Асем в листе ожидания на ${dd(appDay)} ${t} — №${WAIT.length}. Освободится место — придёт уведомление.`)}
const mtab=(k,n,ic)=>`<a class="${appTab===k?'on':''}" onclick="appTab='${k}';render()"><svg viewBox="0 0 24 24">${ic}</svg>${n}</a>`;
function phoneClient(){const c=CL(appMe);const st=SUBT[c.sub];const nb=SLOTS.find(s=>(s.cl===c.id||(s.g||[]).includes(c.id))&&s.st==='booked');let b='';
 if(appTab==='home')b=`<div class="mh1"><small>Добрый день,</small><b>${esc(c.n.split(' ')[0])}</b></div>
  <div class="mcard dark"><small>Ближайшее занятие</small><b>${nb?'Сегодня, '+nb.t:'Не записаны'}</b>${nb?`<span>${esc(SVC[nb.k].n)} · ${esc(nb.h.map(x=>HO(x).n).join(', '))} · ${esc(TR(nb.tr).s)}</span>`:''}<div class="mrow"><button onclick="toast('Отмена позже чем за 12 часов списывает занятие — система предупредит перед отменой.')">Отменить</button><button onclick="toast('Маршрут в 2ГИС открыт.')">Как доехать</button></div></div>
  <div class="mcard"><small>Абонемент · ${esc(st.n)}</small><div class="mbal"><b>${c.left}</b><span>из ${st.cnt} · до ${dd(c.to)}</span></div><div class="bar"><i class="b" style="--w:${pct(c.left,st.cnt)}%"></i></div></div>
  <div class="mcard"><small>Тренер Мадина пишет</small><span>Рысь уверенно, начали галоп на корде. Посадка — держать пятку ниже.</span></div>
  <button class="mbtn" onclick="appTab='book';render()">Записаться</button>`;
 if(appTab==='book'){const days=[0,1,2,3,4,5,6,7].map(i=>addDays(TODAY,i));const sl=appSlots(appDay);
  b=`<div class="mh1"><b>Запись</b><small>Видны только лошади вашего уровня</small></div><div class="mdays">${days.map((d,i)=>`<a class="${d===appDay?'on':''} ${i===7?'lock':''}" onclick="${i===7?`toast('Запись на ${dd(d)} откроется завтра в 00:00 — за 7 дней, для всех одинаково.')`:`appDay='${d}';render()`}"><small>${dow(d)}</small><b>${d.slice(8)}</b></a>`).join('')}</div>
  ${sl.map(s=>`<div class="mslot ${s.hs.length?'':'full'}"><div><b>${s.t}</b><small>${esc(TR(s.tr).s)}</small></div><div class="mhs">${s.hs.length?s.hs.slice(0,3).map(h=>`<a onclick="appBook('${s.t}','${h.id}')"><i style="background:${h.c}"></i>${esc(h.n)}</a>`).join(''):'<span>мест нет</span>'}</div>${s.hs.length?'':`<button onclick="appWait('${s.t}')">В очередь</button>`}</div>`).join('')}`}
 if(appTab==='sub')b=`<div class="mh1"><b>Абонемент</b></div><div class="mcard"><small>${esc(st.n)}</small><div class="mbal"><b>${c.left}</b><span>занятий до ${dd(c.to)}</span></div></div>${Object.entries(SUBT).filter(([k])=>k!=='K8').map(([k,s])=>`<div class="mslot"><div><b>${esc(s.n)}</b><small>${s.days} дней</small></div><div class="mhs"><span>${tg(s.p)}</span></div><button onclick="${stopSale?`toast('Сейчас продажа новых абонементов на паузе — вы в очереди, 7 ноября придёт предложение.')`:`toast('Оплата через Kaspi — абонемент продлится сразу после оплаты.')`}">${stopSale?'Очередь':'Купить'}</button></div>`).join('')}<div class="mnote">Заморозка до 14 дней — в один клик, без звонка администратору.</div>`;
 if(appTab==='me')b=`<div class="mh1"><b>${esc(c.n)}</b><small>${LVL[c.lvl].n} · с ${dd(c.since)}.${c.since.slice(2,4)}</small></div>${[['Занятий всего',c.visits],['Любимая лошадь',HO(c.horse).n],['Договор','подписан'],['Уведомления','включены'],['Мои платежи','история и чеки']].map(x=>`<div class="mslot"><div><b>${x[0]}</b></div><div class="mhs"><span>${x[1]}</span></div></div>`).join('')}<div class="mnote">Сертификаты, правила клуба и техника безопасности — тоже здесь.</div>`;
 return `<div class="mph"><div class="mtop"><span>9:41</span><b>Almaty Hills</b><span>●●●</span></div><div class="mbody">${b}</div><nav class="mnav">${mtab('home','Главная','<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>')}${mtab('book','Запись','<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>')}${mtab('sub','Абонемент','<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>')}${mtab('me','Профиль','<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>')}</nav></div>`}
let gN=4,gLong=false,gDay=1,gPaid=false;
function phoneWalk(){const d=addDays(TODAY,gDay);const k=gLong?'walk2':'walk';const sum=SVC[k].p*gN;return `<div class="mph"><div class="mtop"><span>9:41</span><b>Almaty Hills</b><span>●●●</span></div><div class="mbody"><div class="mh1"><b>Прогулка в предгорья</b><small>Для гостей без абонемента — компанией или вдвоём</small></div>
 ${gPaid?`<div class="mcard dark"><small>Забронировано</small><b>${DOWF(d)}, ${dd(d)} · 11:00</b><span>${gN} ${plural(gN,['человек','человека','человек'])} · ${gLong?'2 часа':'1 час'} · предоплата ${tg(sum/2)} получена</span><div class="mrow"><button onclick="toast('Маршрут в 2ГИС открыт.')">Как доехать</button><button onclick="gPaid=false;render()">Новая бронь</button></div></div><div class="mcard"><small>Что взять</small><span>Удобные брюки и закрытую обувь. Шлем выдадим. Приезжайте за 15 минут — инструктор проведёт инструктаж.</span></div><div class="mcard"><small>Гостям</small><span>Пришлите друзьям ссылку — они увидят время и адрес. Имена и телефоны каждого не нужны.</span></div>`:
 `<div class="mcard"><small>Сколько вас</small><div class="mbal"><button class="mst" onclick="gN=Math.max(1,gN-1);render()">−</button><b>${gN}</b><button class="mst" onclick="gN=Math.min(12,gN+1);render()">+</button><span>${plural(gN,['человек','человека','человек'])}</span></div></div>
 <div class="mcard"><small>Длительность</small><div class="mrow"><button class="${gLong?'':'ok'}" onclick="gLong=false;render()">1 час · 12 000 ₸</button><button class="${gLong?'ok':''}" onclick="gLong=true;render()">2 часа · 20 000 ₸</button></div></div>
 <div class="mcard"><small>Когда</small><div class="mdays">${[1,2,3,4,5,6,7].map(i=>`<a class="${i===gDay?'on':''}" onclick="gDay=${i};render()"><small>${dow(addDays(TODAY,i))}</small><b>${addDays(TODAY,i).slice(8)}</b></a>`).join('')}</div><span>Свободно в 11:00 — лошадей хватит на ${gN} ${plural(gN,['человека','человек','человек'])}</span></div>
 <button class="mbtn" onclick="gPaid=true;render();toast('Гость забронировал прогулку сам и оплатил 50% через Kaspi. Бронь сразу появилась в расписании клуба, лошади закреплены.')">Оплатить 50% · ${tg(sum/2)}</button><div class="mnote">Итого ${tg(sum)} · остаток — на месте</div>`}</div></div>`}
let offerOk=false;
function phoneNotif(){return `<div class="mph"><div class="mtop"><span>9:41</span><b>Уведомления</b><span>●●●</span></div><div class="mbody"><div class="mh1"><b>Для вас</b><small>Без звонков администратору</small></div>
 <div class="mcard dark"><small>Освободилось место · 10:52</small><b>Завтра, 11:00 · Сауле</b><span>Вы первая в листе ожидания. Место держим 30 минут.</span><div class="mrow">${offerOk?'<span>Вы записаны ✓</span>':`<button onclick="offerOk=true;render();toast('Мадина приняла место из очереди в приложении — администратор ничего не делал.')">Записаться</button><button onclick="toast('Место ушло следующему в очереди.')">Не смогу</button>`}</div></div>
 <div class="mcard"><small>Напоминание · сегодня</small><b>Занятие в 17:00</b><span>Крытый манеж · Сауле · тренер Мадина. Отмена бесплатно — до 05:00.</span></div>
 <div class="mcard"><small>Абонемент</small><b>Осталось 1 занятие</b><span>Продлите сейчас — остаток сохранится.</span><div class="mrow"><button class="ok" onclick="toast('Оплата через Kaspi — абонемент продлён сразу.')">Продлить · 96 000 ₸</button></div></div>
 <div class="mcard"><small>Клуб</small><b>С 7 ноября открывается Левада 2</b><span>Больше свободных окон по вечерам.</span></div></div></div>`}
SC.app=()=>`<div class="hd"><div><h2>Приложение для клиентов</h2><p>Приложение для всадников и гостей клуба — не для сотрудников. Своё приложение с названием Almaty Hills в App Store и Google Play — без чужого бренда снизу. Всадник сам видит свободные окна и лошадей своего уровня, записывается, встаёт в очередь, продлевает абонемент. Всё это — тот же портал, поэтому запись из приложения и от администратора — одна и та же запись.</p></div><div class="btns"><button class="bt" onclick="appTab='book';render()">Показать запись</button></div></div>
 <div class="phones3"><div>${phoneClient()}<p class="pcap"><b>Всадник с абонементом</b> · запись, очередь, абонемент</p></div><div>${phoneWalk()}<p class="pcap"><b>Гость</b> · прогулка компанией с оплатой Kaspi</p></div><div>${phoneNotif()}<p class="pcap"><b>Уведомления</b> · место из очереди, напоминание, продление</p></div></div>
 <div class="g3">${[['Сначала — мобильная версия','Кабинет всадника открывается по ссылке и ставится на экран телефона. Отлаживаем его вместе с вами.'],['Потом — магазины','Тот же кабинет собираем в одно приложение для iPhone и Android и проходим проверки Apple и Google — обычно 1–1,5 месяца.'],['От вашего имени','Публикуем в ваш аккаунт разработчика: приложение и его отзывы принадлежат клубу.']].map(x=>`<div class="pan"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('')}</div>
 ${said('«Я настоял на том, чтобы у нас было именно приложение… Это сильно разгружает администратора: они сами видят список, видят окна свободные, записываются. У нас 500–600 абонементщиков.»')}`;
function mark(id,st){const s=SLOTS.find(x=>x.id===id);s.st=st;if(st==='done'||st==='noshow'){(s.g||[s.cl]).filter(Boolean).forEach(c=>{if(st==='noshow')return;})}render();toast(st==='done'?`Отмечено: пришли. Занятие списано с абонемента, тренеру начислен процент.`:'Отмечено: не пришёл без отмены — занятие списано по правилам клуба.')}

/* ===== Правила записи ===== */
let RULES=[
 ['Запись открывается за','7 дней',true,'одинаково в приложении и у администратора'],
 ['Отмена без списания','за 12 часов',true,'позже — занятие списывается'],
 ['Предложение из очереди','30 минут на ответ',true,'потом — следующему'],
 ['Администратор может записать вне окна',' только руководитель',false,'каждое исключение — в журнале'],
 ['Предел занятий лошади в день','по карточке лошади',true,'2 — молодые и спортивные, 3 — средний уровень, 4 — прокатные и пони'],
 ['Новичок видит только лошадей своего уровня','',true,'уровень меняет тренер'],
 ['Предоплата за прогулку','50% по ссылке Kaspi',true,'без предоплаты бронь держится 2 часа'],
 ['Напоминание о занятии','за 3 часа в приложении',true,'и за сутки — для прогулок в WhatsApp']
];
SC.rules=()=>`<div class="hd"><div><h2>Правила записи</h2><p>Правила клуба записаны в системе, а не в голове администратора. Они действуют одинаково для приложения и ресепшн — поэтому приложением выгодно пользоваться, а «записать по знакомству» не получится.</p></div></div>
 <div class="pan">${RULES.map((r,i)=>`<div class="srow"><div class="nm"><b>${esc(r[0])}${r[1]?' · '+esc(r[1]):''}</b><span class="mini">${esc(r[3])}</span></div><span class="sw ${r[2]?'on':''}" onclick="RULES[${i}][2]=!RULES[${i}][2];render();toast(RULES[${i}][2]?'Правило включено.':'Правило выключено.')"></span></div>`).join('')}</div>
 <div class="pan"><h3>Журнал исключений</h3>${[['30.10 19:20','Батырбек','Записал Тимура Ж. на 07.11 вне окна — турнир'],['28.10 11:02','Айгерим','Попытка записать вне окна — система не дала, предложила очередь']].map(x=>`<div class="li"><i>${x[0]}</i><span><b>${x[1]}</b> — ${x[2]}</span></div>`).join('')}</div>`;

/* ===== Сообщения клиентам ===== */
SC.push=()=>`<div class="hd"><div><h2>Сообщения клиентам</h2><p>Уведомления в приложении бесплатны — туда уходит всё. В WhatsApp — только важное: оплата, договор, прогулка. Так сообщения не тонут, а лимиты WhatsApp не тратятся.</p></div><div class="btns"><button class="bt p" onclick="toast('Рассылка «Открылась Левада 2» уйдёт 187 всадникам в приложение в 10:00.')">Новая рассылка</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Что получает клиент</th><th>Канал</th><th class="r">За октябрь</th></tr></thead><tbody>${[['Записался','Время, лошадь, тренер, как доехать','приложение',2410],['За 3 часа до занятия','Напоминание и кнопка «отменить»','приложение',2290],['Место из очереди','Предложение и 30 минут на ответ','приложение',164],['Осталось 1 занятие','Предложение продлить с оплатой Kaspi','приложение + WhatsApp',88],['Не был 10 дней','Сообщение от тренера и свободное окно','WhatsApp',23],['Прогулка забронирована','Адрес, что взять, ссылка на предоплату','WhatsApp',121],['День рождения','Поздравление и прогулка в подарок со скидкой','приложение',41]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${tag(r[2],r[2].includes('WhatsApp')?'g':'i')}</td><td class="r">${r[3]}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Переезд с Fitbase ===== */
SC.move=()=>`<div class="hd"><div><h2>Переезд с Fitbase</h2><p>Сначала забираем всё, что в Fitbase работает хорошо, и выписываем всё, что мешает. Потом переносим данные: всадники, абонементы с остатками, история, лошади, тренеры. Обе системы работают параллельно неделю — потом переключаемся.</p></div></div>
 <div class="g2"><div class="pan"><h3>Что забираем из Fitbase</h3>${['Финансовый учёт и отчётность','Абонементы и разные услуги','Своё приложение с названием клуба','Расчёт зарплат: проценты, скидки, оплаты','Договоры и связь с WhatsApp'].map(x=>`<div class="li ok"><i>+</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Что исправляем</h3>${['Зависания и сбои — своя система на надёжных серверах','Вводили 1 — система записывала 2: каждая операция в журнале','Компании на прогулку — без виртуальных клиентов','Лимит 600–700 абонементов — без лимитов','Общая база для фитнес-клубов — система под конный клуб: лошади, левады, ковка','Платёж каждый год — разработка один раз, система ваша'].map(x=>`<div class="li"><i>−</i><span>${x}</span></div>`).join('')}</div></div>
 <div class="pan"><h3>Сравнение за 3 года</h3><div class="tw"><table class="t"><thead><tr><th></th><th class="r">Год 1</th><th class="r">Год 2</th><th class="r">Год 3</th><th class="r">Итого</th></tr></thead><tbody>
  <tr><td><b>Fitbase + Wazzup</b><div class="mini">≈ 800 000 ₸ в год + 36 000 ₸ в месяц</div></td><td class="r mono">1 232 000</td><td class="r mono">1 232 000</td><td class="r mono">1 232 000</td><td class="r mono"><b>3 696 000 ₸</b></td></tr>
  <tr><td><b>Almaty Hills</b><div class="mini">разработка один раз + Green-API, сервер, аккаунт Apple</div></td><td class="r mono">2 660 000</td><td class="r mono">160 000</td><td class="r mono">160 000</td><td class="r mono"><b>2 980 000 ₸</b></td></tr></tbody></table></div>
  <p class="mini">Расходы после запуска — оценка: WhatsApp через Green-API ≈ 5 000 ₸ в месяц, сервер 0–10 $ в месяц, аккаунт разработчика Apple — 99 $ в год. Со второго года система окупается сама.</p></div>
 ${said('«Сейчас потихонечку вылазят нюансы: зависает система, начинает накидывать единицы — одну забили, закидывает две… Платёж — 800 тысяч в год.»')}`;

/* ===== Роли и права ===== */
SC.roles=()=>`<div class="hd"><div><h2>Роли и права</h2><p>Каждый видит только своё. Права настраиваются руководителем — ниже то, что показано в демо.</p></div></div>
 <div class="tw"><table class="t rmx"><thead><tr><th>Раздел</th>${Object.keys(ROLES).map(r=>`<th class="c">${esc(r)}</th>`).join('')}</tr></thead><tbody>${SEC.map(s=>`<tr class="grp"><td colspan="${Object.keys(ROLES).length+1}"><b>${s.n}</b></td></tr>`+s.sub.map(x=>`<tr><td>${esc(x[1])}</td>${Object.values(ROLES).map(r=>`<td class="c">${r.s.includes(x[0])?'<i class="ck"></i>':''}</td>`).join('')}</tr>`).join('')).join('')}</tbody></table></div>`;

/* ===== Запуск и стоимость ===== */
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Портал с мобильной версией — стандартный пакет. Приложение в App Store и Google Play — отдельным этапом, когда мобильная версия отточена вместе с вами. Без абонентской платы, система принадлежит клубу.</p></div></div>
 <div class="pay3"><div><small>Портал · стандартный пакет</small><b>2 000 000 ₸</b><span>всё, что в демо</span></div><div><small>Приложение iOS + Android</small><b>500 000 ₸</b><span>сборка и публикация от имени клуба</span></div><div><small>Итого</small><b>2 500 000 ₸</b><span>один раз</span></div></div>
 <div class="g2"><div class="pan"><h3>Как платите</h3>${[['10% · после договора','250 000 ₸'],['45% · после запуска ядра на сервере','1 125 000 ₸'],['45% · после полной сдачи','1 125 000 ₸']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}<p class="mini" style="margin-top:8px">Пока не увидели работу — основную сумму не платите.</p></div>
 <div class="pan"><h3>Сроки</h3>${[['Демо и ТЗ','сейчас'],['Портал и мобильная версия','1–1,5 месяца'],['Публикация приложения','ещё 1–1,5 месяца: проверки Apple и Google'],['К весне','всё работает, поток ×2 встречаем готовыми']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="wrapb">${x[1]}</b></div>`).join('')}</div></div>
 <div class="g2"><div class="pan"><h3>После запуска</h3>${[['Исправление ошибок','3 месяца бесплатно'],['Доработки','по часам, около 20 $ в час'],['Сервер','0–10 $ в месяц'],['WhatsApp · Green-API','≈ 5 000 ₸ в месяц'],['Аккаунт Apple','99 $ в год']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Что получаете</h3>${['Исходный код и документацию','Данные — на вашем сервере','Приложение — в вашем аккаунте разработчика','Без лимитов на всадников, администраторов и лошадей','Дизайн меняется под вас за 1–2 дня'].map(x=>`<div class="li ok"><i>+</i><span>${x}</span></div>`).join('')}</div></div>`;

/* ===== Карточки ===== */
const CARD={};
CARD.slot=id=>{const s=SLOTS.find(x=>x.id===id);const tr=TR(s.tr);
 return [`${s.t} · ${esc(SVC[s.k].n)}`,`${esc(AR(s.ar).n)} · ${esc(tr.n)} · запись: ${SRCN[s.src]}`,`<div class="pan"><h3>${esc(slotWho(s))}</h3>${[['Статус',SO(s.st).n],['Длительность',SVC[s.k].d+' мин'],['Всадников',riders(s)],['Сумма',s.w?tg(slotSum(s))+' · '+esc(s.w.paid):'по абонементу'],['Телефон',s.w?esc(s.w.ph):esc(CL(s.cl||s.g[0]).ph)]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Лошади</h3>${s.h.map(x=>{const h=HO(x);return `<div class="kv"><span>${horseChip(x)} ${esc(h.br)}</span><b>${hLoad(x)} из ${h.max} сегодня</b></div>`}).join('')}</div>
 <div class="btns" style="justify-content:flex-start">${s.st==='booked'||s.st==='in'?`<button class="bt g" onclick="mark('${s.id}','done');closeM()">Пришли</button><button class="bt" onclick="mark('${s.id}','noshow');closeM()">Не пришёл</button><button class="bt w" onclick="cancelSlot('${s.id}')">Отменить</button>`:''}${s.cl?`<button class="bt" onclick="closeM();openCl('${s.cl}')">Карточка всадника</button>`:''}</div>`]};
function cancelSlot(id){const s=SLOTS.find(x=>x.id===id);s.st='cancel';closeM();render();const w=WAIT.find(x=>x.d===TODAY);toast(`Запись в ${s.t} отменена, лошади освободились.${w?'':' Место ушло в приложение — его увидят всадники своего уровня.'}`)}
CARD.newslot=x=>{const [ar,t,cl]=(x||'A1|16:00').split('|');const c=CL(cl||'C09');const hs=freeHorses(t,60,['beg','mid','pro']);
 return ['Новая запись',`${esc(AR(ar).n)} · сегодня, ${t}`,`<div class="form"><label>Всадник<select id="ns_c">${CLIENTS.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${esc(x.n)} · ${LVL[x.lvl].n} · осталось ${x.left}</option>`).join('')}</select></label>
 <label>Занятие<select id="ns_k">${['ind','grp','kid'].map(k=>`<option value="${k}">${SVC[k].n}</option>`).join('')}</select></label>
 <label>Время<select id="ns_t">${HOURS.map(h=>`<option ${h===t?'selected':''}>${h}</option>`).join('')}</select></label>
 <label>Лошадь<select id="ns_h">${hs.map(h=>`<option value="${h.id}">${esc(h.n)} · ${LVL[h.lvl].n} · ${hLoad(h.id)}/${h.max}</option>`).join('')||'<option value="">нет свободных — в очередь</option>'}</select></label>
 <label>Тренер<select id="ns_tr">${TRAINERS.map(r=>`<option value="${r.id}">${esc(r.n)}</option>`).join('')}</select></label>
 <input type="hidden" id="ns_a" value="${ar}"></div><p class="mini">В списке — только свободные лошади, у которых не исчерпан предел на сегодня.</p><div class="btns" style="justify-content:flex-start;margin-top:10px"><button class="bt p" onclick="newSlot()">Записать</button></div>`]};
function newSlot(){const v=i=>document.getElementById(i).value;const h=v('ns_h');const c=CL(v('ns_c'));if(!h){WAIT.push({id:'W'+(WAIT.length+20),cl:c.id,d:TODAY,t:v('ns_t'),k:v('ns_k'),want:'любая',since:dd(TODAY)+' '+NOW,src:'admin'});closeM();render();toast('Свободных лошадей нет — всадник поставлен в лист ожидания.');return}
 if(busyAt(h,v('ns_t'),60)){toast('Эта лошадь в это время уже занята.');return}
 SKN++;SLOTS.push({id:'S'+SKN,t:v('ns_t'),k:v('ns_k'),cl:c.id,h:[h],tr:v('ns_tr'),ar:v('ns_a'),st:'booked',src:'admin'});SLOTS.sort((a,b)=>tm(a.t)-tm(b.t));closeM();render();toast(`${esc(c.n)} записан(а) на ${v('ns_t')}, лошадь ${esc(HO(h).n)}. Уведомление ушло в приложение.`)}
CARD.sell=id=>{const c=CL(id);return ['Продажа абонемента',`${esc(c.n)} · сейчас: ${esc(SUBT[c.sub].n)}, осталось ${c.left}`,`<div class="form"><label>Абонемент<select id="sl_t">${Object.entries(SUBT).map(([k,s])=>`<option value="${k}" ${k===c.sub?'selected':''}>${esc(s.n)} · ${tg(s.p)} · ${s.days} дн.</option>`).join('')}</select></label><label>Оплата<select id="sl_m"><option>Kaspi</option><option>Карта</option><option>Наличные</option><option>Перевод</option></select></label></div><p class="mini">Остаток старого абонемента переносится, если продление до его окончания.</p><div class="btns" style="justify-content:flex-start;margin-top:10px"><button class="bt p" onclick="sellSub('${c.id}')">Оплачено</button><button class="bt" onclick="closeM();toast('Ссылка на оплату Kaspi отправлена — абонемент продлится сам после оплаты.')">Отправить ссылку</button></div>`]};
CARD.newcl=()=>['Новый всадник','Карточка, абонемент, договор',`<div class="form"><label>ФИО<input id="nc_n" value="Акерке Сулейменова"></label><label>Телефон<input id="nc_p" value="+7 701 920 18 44"></label><label>Уровень<select id="nc_l">${Object.entries(LVL).map(([k,v])=>`<option value="${k}" ${k==='beg'?'selected':''}>${v.n}</option>`).join('')}</select></label><label>Тренер<select id="nc_t">${TRAINERS.map(r=>`<option value="${r.id}" ${r.id==='T2'?'selected':''}>${esc(r.n)}</option>`).join('')}</select></label></div><div class="btns" style="justify-content:flex-start;margin-top:10px"><button class="bt p" onclick="newCl()">Создать и отправить договор</button></div>`];
function newCl(){const v=i=>document.getElementById(i).value;const id='C'+(CLIENTS.length+1);CLIENTS.unshift({id,n:v('nc_n'),ph:v('nc_p'),lvl:v('nc_l'),tr:v('nc_t'),sub:'S4',left:4,to:addDays(TODAY,30),since:TODAY,visits:0,last:'—',src:'Таргет',horse:'H03',sign:false});closeM();cliF='all';render();toast('Всадник создан. Договор и ссылка на приложение ушли в WhatsApp.')}
CARD.newlead=()=>['Новая заявка','Источник и интерес',`<div class="form"><label>Имя<input id="nl_n" value="Аружан Касымова"></label><label>Источник<select id="nl_s">${Object.keys(SRC).map(s=>`<option>${s}</option>`).join('')}</select></label><label>Что хочет<input id="nl_w" value="Прогулка на двоих в субботу"></label></div><div class="btns" style="justify-content:flex-start;margin-top:10px"><button class="bt p" onclick="newLead()">Добавить</button></div>`];
function newLead(){const v=i=>document.getElementById(i).value;LEADS.unshift({id:'L'+(LEADS.length+20),n:v('nl_n'),ph:'',src:v('nl_s'),want:v('nl_w'),st:'new',d:dd(TODAY)+' '+NOW,mgr:'AI'});closeM();render();toast('Заявка добавлена — администратору ушло уведомление.')}
CARD.contract=i=>{const c=CONTRACTS[i];const cl=CL(c.cl);return [`Договор ${c.no}`,esc(c.what),`<div class="doc"><div class="dh"><b>ALMATY HILLS</b><span>конноспортивный клуб · Алматы</span></div><h4>${esc(c.what)}</h4><p>г. Алматы, ${dl(c.d)}</p><p>Клуб оказывает услуги по обучению верховой езде и прокату лошадей, а ${esc(cl.n)} оплачивает их по выбранному абонементу. Всадник подтверждает, что ознакомлен с правилами клуба и техникой безопасности и принимает риски верховой езды.</p><div class="sgn"><span>Клуб: подписано</span><span>${esc(cl.n)}: ${esc(c.sign||'ждёт подписи')}</span></div></div>`]};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(k){const M={import:'Перенос из Fitbase: всадники, абонементы с остатками, история посещений, тренеры. Обе системы работают параллельно неделю.'};toast(M[k]||'Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const c=CLIENTS.find(x=>(x.n+' '+x.ph).toLowerCase().includes(q));if(c&&allowed('client')){openCl(c.id);return}const h=HORSES.find(x=>x.n.toLowerCase().includes(q));if(h&&allowed('horse')){openHorse(h.id);return}toast('Не найдено. Попробуйте: «Асем», «Ласточка», «+7 701».')}

/* ===== Каркас: дерево разделов слева, лента условий дня сверху ===== */
const ICON={day:'<path d="M3 12h3M18 12h3M12 3v3M12 18v3"/><circle cx="12" cy="12" r="4"/>',cli:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 3.6-6 7-6s6 2 7 6"/>',stab:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>',sale:'<path d="M4 6h16l-2 9H6z"/><circle cx="9" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/>',money:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>',app:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',glamp:'<path d="M3 20L12 5l9 15z"/><path d="M12 20v-6"/>',sys:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>'};
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('')+`<div class="role cli" onclick="enterApp()"><div class="rav">АК</div><div><b>Всадник · приложение</b><span>Асем Каримова · запись, очередь, абонемент в телефоне</span></div></div>`;
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function enterApp(){cur='app';appTab='book';enter('Руководитель')}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const cnt={today:SLOTS.filter(s=>s.st==='booked').length,wait:WAIT.length,leads:LEADS.filter(l=>l.st==='new').length,vet:VETS.filter(v=>v.st==='plan'&&v.d<=addDays(TODAY,3)).length,contracts:CONTRACTS.filter(c=>c.st!=='signed').length,subs:CLIENTS.filter(c=>subSt(c)!=='действует').length};
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<div class="tg ${s.k===SECOF[cur]?'on':''}"><div class="tgh"><svg viewBox="0 0 24 24">${ICON[s.k]}</svg>${s.n}</div>${s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="ri ${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><span>${esc(x[1])}</span>${cnt[x[0]]?`<em>${cnt[x[0]]}</em>`:''}</a>`).join('')}</div>`).join('')}
function buildSub(){}
function buildRibbon(){const el=document.getElementById('ribbon');if(!el)return;const inW=HORSES.filter(h=>h.st==='work').length;
 el.innerHTML=[['Сб, 31 октября','10:40'],['Погода','+7°, ясно, без ветра'],['Крытый манеж','открыт'],['Тропа','открыта до 17:00'],['Лошадей в работе',inW+' из '+HORSES.length],['Левада 2','откроется 7 ноября']].map(x=>`<span><small>${x[0]}</small><b>${x[1]}</b></span>`).join('')}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Almaty Hills';const cr=document.getElementById('crumb');if(cr)cr.textContent=(SEC.find(s=>s.k===SECOF[cur])||{n:''}).n;document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();buildRibbon();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('sched')&&role!=='Конюх'?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

const TOUR=[
 ['today','1 · Пульт дня: кто в седле, кто следующий, какие лошади отработали и что требует решения.'],
 ['sched','2 · Расписание манежей: одна сетка для приложения, ресепшн и тренеров. Запись открывается за 7 дней — для всех одинаково.'],
 ['walks','3 · Прогулка для компании: заказчик и количество гостей — без виртуальных клиентов. Лошади подбираются сами.'],
 ['app','4 · Приложение для клиентов: запись, прогулки для гостей, очередь, абонемент, уведомления.'],
 ['wait','5 · Лист ожидания: кто-то отменил — первому в очереди уходит предложение.'],
 ['horses','6 · Конюшня: у каждой лошади предел занятий в день, ковка, прививки. На отдыхе — не попадает в запись.'],
 ['client','7 · Карточка всадника: абонемент, уровень, тренер, заметки, договор.'],
 ['subs','8 · Абонементы и стоп-продажа до открытия Левады 2.'],
 ['leads','9 · Заявки из таргета и Instagram — к весеннему потоку ×2.'],
 ['wa','10 · WhatsApp в одном окне через Green-API: ≈ 5 000 ₸ вместо 36 000 ₸ в месяц.'],
 ['contracts','11 · Договор — подпись по ссылке с телефона.'],
 ['pay','12 · Зарплата тренеров по процентам — из отметок «пришли».'],
 ['dash','13 · Отчёт собственника — каждый вечер в WhatsApp.'],
 ['move','14 · Переезд с Fitbase: забираем плюсы, убираем минусы. За 3 года дешевле.'],
 ['launch','15 · Стоимость: портал 2 000 000 ₸ + приложение 500 000 ₸, оплата 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается: запись, прогулка, очередь, лошади, абонементы, договоры, зарплаты.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Руководитель');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
