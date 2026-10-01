/* КУЛИСА — система event-агентства: входящие из всех каналов, развёрнутая воронка, индивидуальные сметы и креатив, договоры с ЭЦП, проекты с командой и таймингом, внутренние и клиентские чаты, склад реквизита с бронями и ревизией, аналитика, база знаний. Все имена, компании и суммы вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const dd=s=>{const [y,m,d]=s.split('-');return d+'.'+m};
const dl=s=>{const [y,m,d]=s.split('-');return d+'.'+m+'.'+y};
const TODAY='2026-10-01';
const addDays=(s,n)=>new Date(new Date(s+'T00:00:00').getTime()+n*864e5).toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
const dayOf=s=>['вс','пн','вт','ср','чт','пт','сб'][new Date(s+'T00:00:00').getDay()];
const MON=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const dlong=s=>{const [y,m,d]=s.split('-');return (+d)+' '+MON[+m-1]};

const SEC=[
 {k:'home',n:'Пульт',sub:[['dash','Пульт операционного директора'],['inbox','Входящие · все каналы']]},
 {k:'sales',n:'Продажи',sub:[['pipeline','Воронка продаж'],['deal','Карточка сделки'],['estimate','Смета и версии'],['creative','Креатив и презентации'],['tenders','Тендеры'],['clients','Клиенты и LTV']]},
 {k:'money',n:'Деньги и документы',sub:[['docs','Договоры, счета, акты · ЭЦП'],['finance','Бюджеты и оплаты проектов']]},
 {k:'proj',n:'Реализация',sub:[['projects','Портфель проектов'],['project','Карточка проекта'],['tasks','Задачи команды'],['ros','Тайминг дня · run-of-show'],['contractors','Подрядчики'],['chats','Чаты · команда и клиент']]},
 {k:'props',n:'Реквизит',sub:[['props','Склад реквизита'],['propcal','Брони по датам'],['revision','Ревизия, выдача, поломки']]},
 {k:'an',n:'Аналитика',sub:[['analytics','Продажи и конверсия'],['sources','Источники и путь клиента'],['managers','План-факт менеджеров']]},
 {k:'team',n:'Компания',sub:[['kb','База знаний и онбординг'],['roles','Роли и структура'],['mobile','Мобильная версия'],['integr','Каналы и интеграции'],['migrate','Переезд с amoCRM']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Операционный директор':{av:'ИН',p:'IN',n:'Инна',note:'Всё агентство: продажи, задел, реализация, реквизит, деньги, аналитика и база знаний',s:ALL.slice()},
 'Руководитель продаж':{av:'ДС',p:'DS',n:'Дана',note:'Свой отдел: входящие, воронка, сметы, тендеры, клиенты, план-факт менеджеров. Задачи реализации не видит',s:['inbox','pipeline','deal','estimate','creative','tenders','clients','docs','propcal','props','analytics','sources','managers','kb','mobile']},
 'Менеджер продаж':{av:'АБ',p:'AB',n:'Алина',note:'Свои сделки и заявки, сметы, КП, договоры, бронь реквизита под сделку',s:['inbox','pipeline','deal','estimate','creative','tenders','clients','docs','props','propcal','kb','mobile']},
 'Клиентский сервис':{av:'МК',p:'MK',n:'Мадина',note:'Клиент после подписания: клиентская группа, документы, тайминг, обратная связь',s:['deal','clients','docs','projects','project','ros','chats','kb','mobile']},
 'Креатив · group head':{av:'АС',p:'AS',n:'Аскар',note:'Очередь креатива: концепции, key visual, презентации, защиты; задачи своей группы',s:['creative','deal','projects','project','tasks','chats','kb','mobile']},
 'Проджект-менеджер':{av:'РТ',p:'RT',n:'Руслан',note:'Свои проекты: команда, задачи, тайминг, подрядчики, бюджет план-факт, реквизит',s:['projects','project','tasks','ros','contractors','chats','finance','props','propcal','kb','mobile']},
 'Склад реквизита':{av:'СЕ',p:'SE',n:'Серик',note:'Реквизит: брони по датам, выдача и возврат, ревизия, поломки и списание',s:['props','propcal','revision','tasks','kb','mobile']},
 'Бухгалтерия · аутсорс':{av:'АГ',p:'AG',n:'Айгерим',note:'Счета, акты, оплаты и остатки по проектам. Без доступа к переписке и сметам',s:['docs','finance','clients','kb']}
};
let role='Операционный директор',cur='dash',theme='light';

const TEAM={
 IN:{n:'Инна',f:'Инна Ковалёва',r:'Операционный директор',av:'ИН'},
 DS:{n:'Дана',f:'Дана Сапарова',r:'Руководитель отдела продаж',av:'ДС'},
 AB:{n:'Алина',f:'Алина Бекова',r:'Менеджер продаж',av:'АБ'},
 TM:{n:'Тимур',f:'Тимур Мусин',r:'Менеджер продаж',av:'ТМ'},
 MK:{n:'Мадина',f:'Мадина Каирова',r:'Клиентский сервис',av:'МК'},
 AS:{n:'Аскар',f:'Аскар Сулейменов',r:'Креатив · group head',av:'АС'},
 ZH:{n:'Жанель',f:'Жанель Омарова',r:'Дизайнер',av:'ЖО'},
 OL:{n:'Ольга',f:'Ольга Ли',r:'Копирайтер, сценарист',av:'ОЛ'},
 RT:{n:'Руслан',f:'Руслан Тлеубаев',r:'Проджект-менеджер',av:'РТ'},
 EK:{n:'Ерлан',f:'Ерлан Касымов',r:'Продюсер, проджект',av:'ЕК'},
 KA:{n:'Камила',f:'Камила Нуртаева',r:'Ивент-ассистент',av:'КН'},
 SE:{n:'Серик',f:'Серик Жумабеков',r:'Склад реквизита',av:'СЖ'},
 DA:{n:'Даурен',f:'Даурен Абдиев',r:'Техник, монтаж',av:'ДА'},
 NU:{n:'Нурлан',f:'Нурлан Сеитов',r:'Водитель, логистика',av:'НС'},
 AG:{n:'Айгерим',f:'Айгерим Тасова',r:'Бухгалтерия · аутсорс',av:'АТ'}
};
const who=k=>TEAM[k]?TEAM[k].n:'—';

const DIRS={MKT:{n:'Маркетинг',c:'#b5432c'},HR:{n:'HR',c:'#2f5d62'},B2G:{n:'B2G',c:'#6d4c7d'}};
const TENDER={none:'Не тендер',cond:'Условный тендер',tender:'Тендер'};
const SRC={ads:'Google Ads → сайт',seo:'Сайт · поиск',ig:'Instagram',gis:'2ГИС',ref:'Рекомендация',repeat:'Постоянный клиент',mail:'Почта',goszakup:'Портал госзакупок'};

const CLIENTS=[
 {id:'K1',n:'Nomad Telecom',ind:'Телеком',city:'Алматы',since:'2022',contact:'Гаухар Ахметова, HR-директор',src:'ref',dirs:['HR','MKT'],ltv:118400000,projects:9,last:'2026-09-12'},
 {id:'K2',n:'Steppe Pharma',ind:'Фармацевтика',city:'Алматы',since:'2025',contact:'Елена Ким, бренд-менеджер',src:'ads',dirs:['MKT'],ltv:15600000,projects:2,last:'2026-09-25'},
 {id:'K3',n:'Тенгри Девелопмент',ind:'Девелопмент',city:'Алматы',since:'2026',contact:'Арман Сериков, директор по маркетингу',src:'ig',dirs:['MKT'],ltv:0,projects:0,last:'—'},
 {id:'K4',n:'Qazaq Retail Group',ind:'Ритейл',city:'Алматы',since:'2023',contact:'Динара Жуматова, HR BP',src:'repeat',dirs:['HR','MKT'],ltv:74200000,projects:6,last:'2026-08-30'},
 {id:'K5',n:'Фонд «Жас Талант»',ind:'Некоммерческий фонд',city:'Астана',since:'2025',contact:'Ержан Абенов, руководитель программ',src:'goszakup',dirs:['B2G'],ltv:31800000,projects:2,last:'2026-06-14'},
 {id:'K6',n:'Ассоциация экспортёров «Шанырак»',ind:'Отраслевая ассоциация',city:'Астана',since:'2026',contact:'Сауле Нурпеисова, исполнительный директор',src:'mail',dirs:['B2G'],ltv:0,projects:0,last:'—'},
 {id:'K7',n:'Altay Mining Services',ind:'Горнодобыча',city:'Усть-Каменогорск',since:'2024',contact:'Виктор Ланг, директор по персоналу',src:'ref',dirs:['HR'],ltv:28900000,projects:3,last:'2026-08-29'},
 {id:'K8',n:'Medeu Auto',ind:'Автодилер',city:'Алматы',since:'2026',contact:'Тимур Ахмедов, маркетолог',src:'gis',dirs:['MKT'],ltv:0,projects:0,last:'—'},
 {id:'K9',n:'BRB Logistics',ind:'Логистика',city:'Алматы',since:'2026',contact:'Айдана Касенова, офис-менеджер',src:'ref',dirs:['HR'],ltv:0,projects:0,last:'—'},
 {id:'K10',n:'Esil Group',ind:'Холдинг',city:'Астана',since:'2026',contact:'Мирас Ташенов, PR',src:'gis',dirs:['MKT'],ltv:0,projects:0,last:'—'},
 {id:'K11',n:'Dala Med',ind:'Сеть клиник',city:'Алматы',since:'2026',contact:'Асель Нуриева, маркетинг',src:'seo',dirs:['MKT'],ltv:0,projects:0,last:'—'},
 {id:'K12',n:'Kaspiy Agro',ind:'Агрохолдинг',city:'Атырау',since:'2026',contact:'Бауыржан Ж., коммерческий директор',src:'ig',dirs:['MKT'],ltv:0,projects:0,last:'—'}
];
const CL=id=>CLIENTS.find(c=>c.id===id);

/* ===== Воронка: этапы как у агентства ===== */
const STG=[
 {k:'new',n:'Новая заявка',c:'#8a8178'},
 {k:'brief',n:'Бриф · потребность',c:'#6f7d84'},
 {k:'calc',n:'Просчёт',c:'#2f5d62'},
 {k:'creative',n:'Креатив',c:'#6d4c7d'},
 {k:'kp',n:'КП · презентация',c:'#b7791f'},
 {k:'defense',n:'Защита',c:'#b5432c'},
 {k:'wait',n:'Ждём ответ',c:'#9c6b3f'},
 {k:'confirmed',n:'Подтверждён · не подписан',c:'#3c7a4a'},
 {k:'contract',n:'Договор · аванс',c:'#1d1b21'}
];
const STGOF=k=>STG.find(s=>s.k===k)||{n:k==='lost'?'Проигран':k==='won'?'Выиграна → проект':k,c:k==='won'?'#3c7a4a':'#a39b92'};
const PROB={new:5,brief:10,calc:20,creative:25,kp:35,defense:45,wait:50,confirmed:80,contract:95};

let DEALS=[
 {id:'D1',cl:'K4',t:'Новогодний корпоратив, 600 гостей',dir:'HR',ten:'none',src:'repeat',mgr:'AB',st:'kp',sum:38500000,mg:24,date:'2026-12-19',guests:600,cr:true,days:3,next:'Презентация концепции «Зимний Шёлковый путь» — 03.10, 11:00',city:'Алматы'},
 {id:'D2',cl:'K2',t:'Запуск препарата для 300 врачей',dir:'MKT',ten:'cond',src:'ads',mgr:'TM',st:'defense',sum:21800000,mg:27,date:'2026-11-14',guests:300,cr:true,days:2,next:'Защита у клиента против двух агентств — 02.10, 15:00',city:'Алматы'},
 {id:'D3',cl:'K5',t:'Республиканский молодёжный форум, 1 200 участников',dir:'B2G',ten:'tender',src:'goszakup',mgr:'DS',st:'calc',sum:64000000,mg:14,date:'2026-11-27',guests:1200,cr:false,days:5,next:'Подача заявки на портале до 08.10, 18:00',city:'Астана'},
 {id:'D4',cl:'K3',t:'Презентация ЖК для брокеров',dir:'MKT',ten:'none',src:'ig',mgr:'AB',st:'creative',sum:9400000,mg:31,date:'2026-10-30',guests:150,cr:true,days:4,next:'Креатив: 2 концепции к 05.10',city:'Алматы'},
 {id:'D5',cl:'K7',t:'Тимбилдинг в Бурабае, 120 человек',dir:'HR',ten:'none',src:'ref',mgr:'TM',st:'wait',sum:12600000,mg:26,date:'2026-10-24',guests:120,cr:false,days:8,next:'Клиент молчит 8 дней — позвонить',city:'Бурабай'},
 {id:'D6',cl:'K8',t:'Тест-драйв новой модели для прессы',dir:'MKT',ten:'none',src:'gis',mgr:'TM',st:'brief',sum:7000000,mg:30,date:'2026-11-07',guests:80,cr:true,days:1,next:'Встреча по брифу — 02.10, 10:00',city:'Алматы'},
 {id:'D7',cl:'K9',t:'Юбилей компании 10 лет, 350 гостей',dir:'HR',ten:'none',src:'ref',mgr:'AB',st:'confirmed',sum:26300000,mg:25,date:'2026-11-21',guests:350,cr:true,days:6,next:'Подписание договора — ждём реквизиты',city:'Алматы'},
 {id:'D8',cl:'K6',t:'Экспортный форум, 800 участников',dir:'B2G',ten:'cond',src:'mail',mgr:'DS',st:'contract',sum:41200000,mg:18,date:'2026-11-05',guests:800,cr:true,days:2,next:'Договор подписан нами по ЭЦП — ждём подпись и аванс 30%',city:'Астана'},
 {id:'D9',cl:'K1',t:'Выездная стратегическая сессия правления',dir:'HR',ten:'none',src:'repeat',mgr:'AB',st:'new',sum:0,mg:0,date:'2026-12-05',guests:25,cr:false,days:0,next:'Связаться сегодня — постоянный клиент',city:'—'},
 {id:'D10',cl:'K12',t:'Дилерская конференция',dir:'MKT',ten:'none',src:'ig',mgr:'TM',st:'new',sum:0,mg:0,date:'2027-02-12',guests:200,cr:false,days:0,next:'Первый звонок — выявить потребность',city:'Атырау'},
 {id:'D11',cl:'K11',t:'Научная конференция для врачей',dir:'MKT',ten:'none',src:'seo',mgr:'AB',st:'brief',sum:5800000,mg:28,date:'2026-12-03',guests:180,cr:false,days:2,next:'Ждём заполненный бриф',city:'Алматы'},
 {id:'D12',cl:'K10',t:'Гала-ужин партнёров, 200 гостей',dir:'MKT',ten:'none',src:'gis',mgr:'TM',st:'kp',sum:15900000,mg:29,date:'2026-10-17',guests:200,cr:true,days:1,next:'КП v2 отправлено 30.09 — созвон 02.10',city:'Астана'},
 {id:'D13',cl:'K1',t:'Летний фестиваль для сотрудников',dir:'HR',ten:'none',src:'repeat',mgr:'AB',st:'lost',sum:33000000,mg:22,date:'2026-07-04',guests:900,cr:true,days:0,next:'',lost:'Перенесли на следующий год — вернуться в марте',city:'Алматы'},
 {id:'D14',cl:'K3',t:'Открытие шоурума',dir:'MKT',ten:'tender',src:'ig',mgr:'TM',st:'lost',sum:11200000,mg:24,date:'2026-09-20',guests:120,cr:true,days:0,next:'',lost:'Цена: выбрали агентство на 18% дешевле',city:'Алматы'}
];
const DL=id=>DEALS.find(d=>d.id===id);
let curDeal='D2';

/* ===== Проекты: после договора и аванса ===== */
const PST=[{k:'prep',n:'Подготовка',c:'#2f5d62'},{k:'prod',n:'Производство · монтаж',c:'#b7791f'},{k:'event',n:'День мероприятия',c:'#b5432c'},{k:'close',n:'Закрытие · акты, отчёт',c:'#6d4c7d'},{k:'done',n:'Архив · ретро',c:'#3c7a4a'}];
const PSTOF=k=>PST.find(s=>s.k===k)||PST[0];
let PROJECTS=[
 {id:'P1',cl:'K1',deal:'',t:'Incentive-поездка лучших продавцов: Туркестан, 3 дня, 80 человек',dir:'HR',ten:'none',pm:'RT',st:'prep',from:'2026-10-17',to:'2026-10-19',sum:46800000,plan:35200000,fact:12400000,paid:23400000,ready:62,risk:'Чартер: ждём подтверждение борта до 03.10',team:['RT','AB','MK','AS','ZH','EK','SE','KA'],city:'Туркестан'},
 {id:'P2',cl:'K4',deal:'',t:'Открытие флагманского магазина',dir:'MKT',ten:'none',pm:'EK',st:'prod',from:'2026-10-10',to:'2026-10-10',sum:18200000,plan:13100000,fact:9800000,paid:12740000,ready:78,risk:'',team:['EK','AB','MK','ZH','DA','SE','KA'],city:'Алматы'},
 {id:'P5',cl:'K5',deal:'',t:'Региональный этап форума, Шымкент',dir:'B2G',ten:'tender',pm:'EK',st:'prep',from:'2026-10-24',to:'2026-10-24',sum:19600000,plan:16900000,fact:2100000,paid:5880000,ready:35,risk:'Площадка: не подписан договор с конгресс-холлом',team:['EK','DS','MK','OL','SE','NU'],city:'Шымкент'},
 {id:'P3',cl:'K2',deal:'',t:'Школа медпредставителей, 2 дня',dir:'MKT',ten:'none',pm:'RT',st:'close',from:'2026-09-24',to:'2026-09-25',sum:8900000,plan:6600000,fact:6700000,paid:4450000,ready:100,risk:'Остаток 4 450 000 — акт отправлен 29.09',team:['RT','TM','MK','OL','KA'],city:'Алматы'},
 {id:'P4',cl:'K7',deal:'',t:'День горняка: праздник для 900 сотрудников',dir:'HR',ten:'none',pm:'RT',st:'done',from:'2026-08-29',to:'2026-08-29',sum:14300000,plan:10600000,fact:10450000,paid:14300000,ready:100,risk:'',team:['RT','TM','MK','AS','DA','SE'],city:'Усть-Каменогорск'}
];
const PR=id=>PROJECTS.find(p=>p.id===id);
let curProj='P1';

/* бюджет проекта P1: план/факт по статьям */
const BUDGET={P1:[
 {n:'Чартер Алматы — Туркестан — Алматы, борт на 90 мест',c:'Air Charter KZ',plan:14200000,fact:7100000,st:'аванс 50%'},
 {n:'Отель, 2 ночи, 80 номеров',c:'Hotel Silk Way',plan:9800000,fact:4900000,st:'аванс 50%'},
 {n:'Гала-ужин в караван-сарае: площадка и кейтеринг',c:'Караван-сарай',plan:5400000,fact:0,st:'договор'},
 {n:'Трансферы и экскурсии',c:'Turan Bus',plan:1900000,fact:0,st:'бронь'},
 {n:'Ведущий, этно-шоу, фотограф и видео',c:'подрядчики',plan:2300000,fact:400000,st:'аванс'},
 {n:'Мерч: худи, флажки с логотипом, бейджи',c:'Print Lab',plan:900000,fact:0,st:'макеты на согласовании'},
 {n:'Реквизит со склада: указатели, неон, барные стойки',c:'свой склад',plan:0,fact:0,st:'бронь'},
 {n:'Страховка, медик, непредвиденное',c:'—',plan:700000,fact:0,st:'—'}
]};

/* ===== Смета сделки D2: версии и строки ===== */
const EST_CATS=['Площадка','Техника: звук, свет, LED','Сценография и креатив','Кейтеринг','Ведущий и спикеры','Логистика и персонал','Полиграфия и мерч'];
let EST={D2:{ver:3,comm:10,cr:true,vers:[
  {v:1,d:'2026-09-18',sum:19400000,note:'Базовый: зал отеля, стандартная сцена'},
  {v:2,d:'2026-09-24',sum:22600000,note:'Добавили сценографию «молекула» и LED-экран 12 м'},
  {v:3,d:'2026-09-29',sum:0,note:'Оптимизация: LED 8 м, кофе-брейк вместо фуршета на 2-й части'}],
 lines:[
  {cat:'Площадка',n:'Конгресс-зал отеля, 300 мест, театральная рассадка',c:'Rixos Almaty',q:1,u:'день',cost:2900000,price:3480000},
  {cat:'Техника: звук, свет, LED',n:'LED-экран 8×3,5 м с монтажом',c:'Light Pro',q:1,u:'комплект',cost:1850000,price:2400000},
  {cat:'Техника: звук, свет, LED',n:'Звук, свет, синхроперевод на 2 языка',c:'Sound Hall',q:1,u:'комплект',cost:1640000,price:2150000},
  {cat:'Сценография и креатив',n:'Концепция, KV, сценарий, режиссура',c:'креативная группа',q:1,u:'проект',cost:900000,price:2100000},
  {cat:'Сценография и креатив',n:'Сценическая конструкция «молекула», производство',c:'Decor Factory',q:1,u:'шт',cost:2100000,price:2780000},
  {cat:'Кейтеринг',n:'Кофе-брейк × 2 и фуршет',c:'Rixos Almaty',q:300,u:'чел',cost:9800,price:12500},
  {cat:'Ведущий и спикеры',n:'Ведущий-медик, модератор панели',c:'подрядчик',q:1,u:'день',cost:650000,price:850000},
  {cat:'Логистика и персонал',n:'Регистрация, хостес, гардероб',c:'свой персонал',q:12,u:'чел',cost:28000,price:38000},
  {cat:'Полиграфия и мерч',n:'Бейджи, пресс-волл, раздаточные материалы',c:'Print Lab',q:300,u:'компл',cost:3100,price:4600},
  {cat:'Полиграфия и мерч',n:'Флажки с логотипом на столы',c:'Print Lab',q:60,u:'шт',cost:900,price:1500}
 ]}};

/* ===== Креатив: очередь группы ===== */
let CREATIVE=[
 {id:'CR1',deal:'D4',t:'Две концепции презентации ЖК',who:'AS',st:'work',due:'2026-10-05',kind:'Концепция + KV',ver:1},
 {id:'CR2',deal:'D1',t:'«Зимний Шёлковый путь» — презентация к защите',who:'ZH',st:'review',due:'2026-10-02',kind:'Презентация',ver:3},
 {id:'CR3',deal:'D2',t:'Сценография «молекула» — визуализация зала',who:'ZH',st:'done',due:'2026-09-29',kind:'3D-визуализация',ver:2},
 {id:'CR4',deal:'D7',t:'Сценарий юбилея и видеоролик «10 лет BRB»',who:'OL',st:'work',due:'2026-10-08',kind:'Сценарий',ver:1},
 {id:'CR5',deal:'D12',t:'Мудборд гала-ужина',who:'AS',st:'queue',due:'2026-10-03',kind:'Мудборд',ver:0},
 {id:'CR6',deal:'D6',t:'Креатив не нужен — техническое мероприятие',who:'',st:'skip',due:'',kind:'—',ver:0}
];
const CRST=[['queue','В очереди'],['work','В работе'],['review','На согласовании'],['done','Готово к защите']];

/* ===== Тендеры ===== */
const TENDERS=[
 {deal:'D3',kind:'tender',plat:'Портал госзакупок',no:'№ 1184522-ОК1',due:'2026-10-08',docs:[['Заявка',1],['Техническая спецификация',1],['Банковская гарантия',0],['Справка об отсутствии налоговой задолженности',1],['Опыт аналогичных работ',1],['Ценовое предложение',0]],note:'Цена ограничена выделенной суммой 64 млн; маржа низкая, но опыт для портфеля'},
 {deal:'D2',kind:'cond',plat:'Сравнение трёх агентств',no:'—',due:'2026-10-02',docs:[['КП и смета',1],['Презентация концепции',1],['Кейсы фармы',1]],note:'Защита у клиента 02.10 в 15:00; конкуренты — два агентства'},
 {deal:'D8',kind:'cond',plat:'Отбор ассоциации',no:'—',due:'2026-09-26',docs:[['КП',1],['Смета',1],['Опыт',1]],note:'Выиграли, договор на подписи'},
 {deal:'D14',kind:'tender',plat:'Закрытый тендер клиента',no:'—',due:'2026-09-05',docs:[['КП',1],['Смета',1]],note:'Проиграли по цене: −18%'}
];

/* ===== Документы ===== */
let DOCS=[
 {id:'DC1',k:'Договор',ref:'D8',no:'EV-2026/041',sum:41200000,mode:'ЭЦП',st:'our',d:'2026-09-30'},
 {id:'DC2',k:'Счёт на аванс 30%',ref:'D8',no:'СЧ-2026/118',sum:12360000,mode:'ЭЦП',st:'sent',d:'2026-09-30'},
 {id:'DC3',k:'Договор',ref:'D7',no:'EV-2026/042',sum:26300000,mode:'Бумага',st:'draft',d:'2026-10-01'},
 {id:'DC4',k:'Акт выполненных работ',ref:'P3',no:'АВР-2026/087',sum:8900000,mode:'ЭЦП',st:'sent',d:'2026-09-29'},
 {id:'DC5',k:'Счёт на остаток 50%',ref:'P3',no:'СЧ-2026/115',sum:4450000,mode:'ЭЦП',st:'sent',d:'2026-09-29'},
 {id:'DC6',k:'Договор',ref:'P1',no:'EV-2026/033',sum:46800000,mode:'Бумага',st:'signed',d:'2026-08-28'},
 {id:'DC7',k:'Счёт на аванс 50%',ref:'P1',no:'СЧ-2026/096',sum:23400000,mode:'Бумага',st:'paid',d:'2026-08-29'},
 {id:'DC8',k:'Договор с подрядчиком',ref:'P1',no:'Air Charter KZ',sum:14200000,mode:'ЭЦП',st:'signed',d:'2026-09-02'},
 {id:'DC9',k:'Договор',ref:'P5',no:'EV-2026/038',sum:19600000,mode:'ЭЦП',st:'signed',d:'2026-09-15'},
 {id:'DC10',k:'Акт и отчёт с фото',ref:'P4',no:'АВР-2026/072',sum:14300000,mode:'ЭЦП',st:'signed',d:'2026-09-03'}
];
const DOCST={draft:['Черновик','#8a8178'],our:['Подписан нами · ждём клиента','#b7791f'],sent:['Отправлен клиенту','#2f5d62'],signed:['Подписан обеими сторонами','#3c7a4a'],paid:['Оплачен','#3c7a4a']};

/* ===== Реквизит ===== */
let PROPS=[
 {id:'R1',n:'Указатель напольный «стрелка», 1,8 м',cat:'Навигация',tot:10,ok:7,broken:3,cell:'A-1',val:18000},
 {id:'R2',n:'Фотозона «Арка» 3×2,5 м',cat:'Фотозоны',tot:2,ok:2,broken:0,cell:'B-4',val:240000},
 {id:'R3',n:'Стул Кьявари золотой',cat:'Мебель',tot:120,ok:118,broken:2,cell:'C-1…C-3',val:14000},
 {id:'R4',n:'Барная стойка с LED-подсветкой',cat:'Мебель',tot:4,ok:4,broken:0,cell:'C-6',val:180000},
 {id:'R5',n:'Неоновая вывеска сменная',cat:'Свет и декор',tot:3,ok:2,broken:1,cell:'D-2',val:95000},
 {id:'R6',n:'Ковровая дорожка красная, 10 м',cat:'Декор',tot:6,ok:6,broken:0,cell:'D-5',val:42000},
 {id:'R7',n:'Стойка-ограждение с лентой',cat:'Навигация',tot:24,ok:24,broken:0,cell:'A-3',val:12000},
 {id:'R8',n:'Подиум модульный 1×2 м',cat:'Сцена',tot:16,ok:16,broken:0,cell:'E-1',val:65000},
 {id:'R9',n:'Ширма-перегородка тканевая',cat:'Декор',tot:10,ok:9,broken:1,cell:'D-7',val:23000},
 {id:'R10',n:'Пресс-волл 4×2,5 м, каркас',cat:'Фотозоны',tot:2,ok:2,broken:0,cell:'B-1',val:160000}
];
const RP=id=>PROPS.find(p=>p.id===id);
let BOOK=[
 {id:'B1',p:'R1',q:6,from:'2026-10-17',to:'2026-10-19',ref:'P1',by:'RT',st:'confirmed'},
 {id:'B2',p:'R4',q:2,from:'2026-10-18',to:'2026-10-18',ref:'P1',by:'RT',st:'confirmed'},
 {id:'B3',p:'R5',q:2,from:'2026-10-18',to:'2026-10-18',ref:'P1',by:'RT',st:'confirmed'},
 {id:'B4',p:'R3',q:110,from:'2026-10-10',to:'2026-10-10',ref:'P2',by:'EK',st:'confirmed'},
 {id:'B5',p:'R2',q:1,from:'2026-10-10',to:'2026-10-10',ref:'P2',by:'EK',st:'confirmed'},
 {id:'B6',p:'R7',q:16,from:'2026-10-10',to:'2026-10-10',ref:'P2',by:'EK',st:'confirmed'},
 {id:'B7',p:'R10',q:1,from:'2026-10-24',to:'2026-10-24',ref:'P5',by:'EK',st:'confirmed'},
 {id:'B8',p:'R8',q:12,from:'2026-10-24',to:'2026-10-24',ref:'P5',by:'EK',st:'confirmed'},
 {id:'B9',p:'R2',q:1,from:'2026-10-30',to:'2026-10-30',ref:'D4',by:'AB',st:'tentative'},
 {id:'B10',p:'R1',q:4,from:'2026-10-17',to:'2026-10-17',ref:'D12',by:'TM',st:'tentative'}
];
const REVLOG=[
 {d:'2026-09-28',who:'SE',p:'R1',was:10,now:7,why:'3 шт — сломано крепление основания после «Дня горняка»',act:'2 в ремонт, 1 списать'},
 {d:'2026-09-28',who:'SE',p:'R5',was:3,now:2,why:'Мерцает трансформатор',act:'в ремонт до 10.10'},
 {d:'2026-09-28',who:'SE',p:'R3',was:120,now:118,why:'Треснула ножка',act:'списать'},
 {d:'2026-09-28',who:'SE',p:'R9',was:10,now:9,why:'Порвана ткань',act:'перетяжка'}
];
const ISSUES=[
 {d:'2026-10-09',p:'R3',q:110,ref:'P2',kind:'Выдача',who:'SE',to:'DA',st:'plan'},
 {d:'2026-10-09',p:'R7',q:16,ref:'P2',kind:'Выдача',who:'SE',to:'DA',st:'plan'},
 {d:'2026-09-30',p:'R8',q:6,ref:'P3',kind:'Возврат',who:'SE',to:'',st:'done',note:'Все 6 целы'},
 {d:'2026-08-30',p:'R1',q:10,ref:'P4',kind:'Возврат',who:'SE',to:'',st:'done',note:'3 с повреждением — фото в карточке'}
];

/* ===== Входящие ===== */
let INBOX=[
 {id:'I1',ch:'WhatsApp',from:'+7 701 *** 44 18',name:'Гаухар, Nomad Telecom',txt:'Добрый день! Нам нужна выездная стратсессия правления на 25 человек в начале декабря, 2 дня. Сможете предложить варианты?',t:'09:12',cl:'K1',deal:'D9',st:'deal'},
 {id:'I2',ch:'Instagram',from:'@kaspiy.agro',name:'Kaspiy Agro',txt:'Здравствуйте, ищем агентство на дилерскую конференцию в феврале, около 200 человек, Атырау',t:'10:05',cl:'K12',deal:'D10',st:'deal'},
 {id:'I3',ch:'Почта',from:'events@quantumbank.kz',name:'Quantum Bank (новый)',txt:'Просим направить коммерческое предложение на проведение новогоднего вечера для 450 сотрудников. Техническое задание во вложении.',t:'10:41',cl:'',deal:'',st:'new',file:'ТЗ_новогодний_вечер.pdf'},
 {id:'I4',ch:'Сайт',from:'форма «Рассчитать мероприятие»',name:'Самал, Kazakh Tourism Hub',txt:'Конференция 2 дня, 300 участников, Астана, март 2027. Бюджет 25–30 млн.',t:'11:02',cl:'',deal:'',st:'new',utm:'google / cpc / event-astana'},
 {id:'I5',ch:'Звонок',from:'+7 727 *** 90 03',name:'Medeu Auto',txt:'Входящий звонок 4 мин 12 с — договорились о встрече по брифу 02.10 в 10:00. Запись разговора в карточке.',t:'11:20',cl:'K8',deal:'D6',st:'deal'},
 {id:'I6',ch:'2ГИС',from:'кнопка «Позвонить» в карточке 2ГИС',name:'Пропущенный звонок',txt:'Пропущенный 11:34. Перезвонить в течение 15 минут — правило отдела продаж.',t:'11:34',cl:'',deal:'',st:'new'}
];
const CHANNELS={WhatsApp:'#3c7a4a',Instagram:'#b5432c',Почта:'#2f5d62',Сайт:'#6d4c7d',Звонок:'#b7791f','2ГИС':'#4b7f2f'};

/* ===== Задачи ===== */
let TASKS=[
 {id:'T1',ref:'P1',t:'Получить подтверждение борта и списки пассажиров',who:'RT',due:'2026-10-03',st:'work',pr:'high'},
 {id:'T2',ref:'P1',t:'Согласовать с клиентом рассадку на гала-ужине',who:'MK',due:'2026-10-06',st:'todo',pr:'mid'},
 {id:'T3',ref:'P1',t:'Макеты худи и флажков — на согласование клиенту',who:'ZH',due:'2026-10-02',st:'work',pr:'high'},
 {id:'T4',ref:'P1',t:'Собрать указатели, неон и барные стойки к 16.10',who:'SE',due:'2026-10-16',st:'todo',pr:'mid'},
 {id:'T5',ref:'P2',t:'Монтаж фотозоны и рассадки 09.10 с 22:00',who:'DA',due:'2026-10-09',st:'todo',pr:'high'},
 {id:'T6',ref:'P2',t:'Финальный тайминг открытия — клиенту на подпись',who:'EK',due:'2026-10-03',st:'work',pr:'mid'},
 {id:'T7',ref:'P5',t:'Подписать договор с конгресс-холлом Шымкента',who:'EK',due:'2026-09-30',st:'todo',pr:'high'},
 {id:'T8',ref:'P5',t:'Сценарий открытия на двух языках',who:'OL',due:'2026-10-10',st:'todo',pr:'mid'},
 {id:'T9',ref:'P3',t:'Отчёт с фото и цифрами для клиента',who:'MK',due:'2026-10-01',st:'done',pr:'mid'},
 {id:'T10',ref:'D2',t:'Подготовить защиту: 12 слайдов + смета v3',who:'TM',due:'2026-10-02',st:'work',pr:'high'},
 {id:'T11',ref:'D5',t:'Позвонить Виктору Лангу: решение по Бурабаю',who:'TM',due:'2026-10-01',st:'todo',pr:'high'},
 {id:'T12',ref:'D7',t:'Запросить реквизиты и подготовить договор',who:'AB',due:'2026-10-01',st:'work',pr:'mid'},
 {id:'T13',ref:'D2',t:'Согласовать скидку 5% для Steppe Pharma до защиты',who:'IN',due:'2026-10-02',st:'todo',pr:'high'},
 {id:'T14',ref:'D3',t:'Решение по тендеру форума: подаём при марже 14% или нет',who:'IN',due:'2026-10-03',st:'todo',pr:'high'},
 {id:'T15',ref:'P5',t:'Созвон с Ерланом: площадка в Шымкенте',who:'IN',due:'2026-10-01',st:'todo',pr:'mid'}
];
const PRI={high:['Срочно','#b3261e'],mid:['Обычная','#b7791f'],low:['Низкая','#6b6560']};

/* ===== Тайминг дня: P1, гала-ужин 18.10 ===== */
let ROS=[
 {t:'16:00',d:30,n:'Заезд техники, монтаж сцены и света в караван-сарае',who:'DA',z:'Сцена',done:true},
 {t:'17:30',d:30,n:'Расстановка указателей, неона, барных стоек',who:'SE',z:'Вход и бар',done:true},
 {t:'18:30',d:30,n:'Саунд-чек, прогон с ведущим',who:'EK',z:'Сцена',done:false},
 {t:'19:00',d:30,n:'Трансфер гостей из отеля, 2 автобуса',who:'NU',z:'Логистика',done:false},
 {t:'19:30',d:30,n:'Велком: этно-музыканты, фотозона, напитки',who:'KA',z:'Вход',done:false},
 {t:'20:00',d:20,n:'Открытие: приветствие председателя правления',who:'RT',z:'Сцена',done:false},
 {t:'20:20',d:40,n:'Ужин, первая часть шоу',who:'RT',z:'Зал',done:false},
 {t:'21:00',d:30,n:'Награждение лучших продавцов, 12 номинаций',who:'MK',z:'Сцена',done:false},
 {t:'21:30',d:60,n:'Этно-шоу и танцевальная программа',who:'EK',z:'Сцена',done:false},
 {t:'22:30',d:15,n:'Финал: фейерверк над караван-сараем',who:'DA',z:'Площадь',done:false},
 {t:'23:00',d:30,n:'Трансфер в отель, демонтаж',who:'NU',z:'Логистика',done:false}
];

/* ===== Подрядчики ===== */
const CONTRACTORS=[
 {n:'Air Charter KZ',cat:'Авиаперевозки',city:'Алматы',rate:'от 2,4 млн за рейс',score:4.6,proj:3,note:'Подтверждают борт за 14 дней'},
 {n:'Light Pro',cat:'Свет, LED-экраны',city:'Алматы',rate:'LED от 185 000 ₸ за м²',score:4.8,proj:21,note:'Свой монтаж, работают ночью'},
 {n:'Sound Hall',cat:'Звук, синхроперевод',city:'Алматы, Астана',rate:'от 1,2 млн комплект',score:4.7,proj:17,note:'Кабины синхроперевода — свои'},
 {n:'Decor Factory',cat:'Сценография, производство',city:'Алматы',rate:'по проекту',score:4.4,proj:12,note:'Срок производства 10–14 дней'},
 {n:'Rixos Almaty',cat:'Площадки, кейтеринг',city:'Алматы',rate:'зал 2,9 млн/день',score:4.5,proj:8,note:'Агентская скидка 10%'},
 {n:'Караван-сарай',cat:'Площадки',city:'Туркестан',rate:'по запросу',score:4.3,proj:2,note:'Только наличный аванс 30%'},
 {n:'Print Lab',cat:'Полиграфия, мерч',city:'Алматы',rate:'по прайсу',score:4.6,proj:34,note:'Срочный тираж за 48 часов'},
 {n:'Turan Bus',cat:'Трансферы',city:'Туркестан, Шымкент',rate:'от 45 000 ₸ / авто',score:4.2,proj:4,note:''}
];

/* ===== Чаты проекта P1 ===== */
let CHATS={
 team:{n:'Команда агентства',kind:'Внутренний чат',members:['IN','DS','AB','TM','MK','AS','RT','EK','SE'],msgs:[
  {w:'IN',t:'09:02',m:'Коллеги, по Nomad до пятницы закрываем все брони реквизита и списки пассажиров.'},
  {w:'SE',t:'09:20',m:'Ревизия 28.09: указателей теперь 7, а не 10. Бронируйте с учётом этого.'},
  {w:'TM',t:'09:31',m:'Принял. На 17.10 для Esil Group беру стойки-ограждения вместо указателей.'}]},
 p1in:{n:'P1 · Nomad · рабочая группа',kind:'Внутренний чат проекта',members:['RT','AB','MK','AS','ZH','EK','SE','KA'],msgs:[
  {w:'RT',t:'08:45',m:'Air Charter обещает подтвердить борт до 03.10. Без этого не отправляем клиенту финальную программу.'},
  {w:'ZH',t:'09:10',m:'Макеты худи и флажков загрузила в файлы проекта, v2.'},
  {w:'MK',t:'09:14',m:'Клиент просит добавить в программу 15 минут на фото команды у мавзолея.'},
  {w:'RT',t:'09:16',m:'Добавляю в тайминг 18.10, сдвигаю обед на 13:15.'}]},
 p1cl:{n:'P1 · Nomad · клиентская группа',kind:'WhatsApp-группа с рабочего номера',members:['CLIENT','AB','MK','RT'],msgs:[
  {w:'CLIENT',t:'09:05',m:'Добрый день! Можно в программу добавить общее фото у мавзолея Ходжи Ахмеда Ясави?'},
  {w:'MK',t:'09:13',m:'Гаухар, добрый день! Да, добавим 15 минут во второй день, пришлю обновлённую программу сегодня.'},
  {w:'CLIENT',t:'09:40',m:'Отлично. И напомните, до какого числа нужны списки пассажиров?'},
  {w:'RT',t:'09:44',m:'До 03.10, 18:00 — паспортные данные для авиакомпании. Шаблон таблицы прикрепил.'}]}
};
let curChat='p1in';

/* ===== Аналитика ===== */
const FUNNEL=[['Заявки',64],['Бриф получен',41],['Просчёт',30],['КП и презентация',24],['Защита',15],['Подтверждён',11],['Подписан',9]];
const BYDIR=[
 {d:'MKT',won:6,lost:4,inwork:6,rev:84300000,mg:27},
 {d:'HR',won:5,lost:2,inwork:4,rev:121700000,mg:25},
 {d:'B2G',won:2,lost:3,inwork:2,rev:51400000,mg:16}];
const BYTEN=[{k:'none',n:21,won:12},{k:'cond',n:7,won:3},{k:'tender',n:5,won:1}];
const PLANFACT=[['Июль',55,48.2],['Август',55,61.9],['Сентябрь',60,57.3],['Октябрь',60,41.0],['Ноябрь',70,0],['Декабрь',90,0]];
const SOURCES=[
 {k:'ads',leads:18,deals:4,rev:30700000,path:'Google Ads → лендинг → форма «Рассчитать» → WhatsApp'},
 {k:'seo',leads:6,deals:1,rev:5800000,path:'Поиск → сайт → почта'},
 {k:'ig',leads:14,deals:2,rev:9400000,path:'Instagram → Direct → WhatsApp'},
 {k:'gis',leads:9,deals:2,rev:22900000,path:'2ГИС → звонок'},
 {k:'ref',leads:8,deals:4,rev:52800000,path:'Рекомендация → звонок руководителю'},
 {k:'repeat',leads:6,deals:5,rev:96400000,path:'Постоянный клиент → WhatsApp менеджеру'},
 {k:'goszakup',leads:3,deals:1,rev:19600000,path:'Портал госзакупок → тендер'}
];
const MGRS=[
 {k:'DS',plan:90000000,fact:66700000,deals:4,won:2,conv:18,avg:33400000},
 {k:'AB',plan:80000000,fact:71300000,deals:9,won:5,conv:31,avg:14300000},
 {k:'TM',plan:70000000,fact:42900000,deals:10,won:3,conv:21,avg:14300000}
];

/* ===== База знаний ===== */
const KB=[
 {s:'Как мы продаём',items:['Этапы воронки и что сделать на каждом','Бриф: 14 вопросов первой встречи','Как готовить защиту: структура 12 слайдов','Работа с тендерами и условными тендерами']},
 {s:'Шаблоны',items:['Бриф','Смета с наценкой и комиссией','КП и презентация','Договор, счёт, акт','Тайминг дня','Отчёт клиенту после мероприятия']},
 {s:'Реализация',items:['Чек-лист подготовки проекта за 30 дней','Работа с подрядчиками и рейтинг','Выезд на площадку: что проверить','Закрытие проекта: акты, фото, ретро']},
 {s:'Реквизит',items:['Как забронировать реквизит под сделку','Выдача и возврат: фото состояния','Что делать при поломке']},
 {s:'Компания',items:['Структура и кто за что отвечает','Ценности и стандарты сервиса','Регламент внутренних чатов']}
];
let ONB=[
 ['Прочитать «Как мы продаём» и пройти тест',true],['Посмотреть 3 проекта в архиве с ретро',true],['Сделать тренировочную смету по шаблону',false],
 ['Пройти на склад реквизита с Сериком',false],['Сходить на мероприятие ассистентом',false],['Получить доступы: почта, WhatsApp, система',true]];

/* ===== помощники ===== */
const SC={};
const dirTag=d=>DIRS[d]?`<span class="dtag" style="--c:${DIRS[d].c}">${DIRS[d].n}</span>`:'';
const tenTag=t=>t==='none'?'':`<span class="ttag ${t}">${t==='tender'?'Тендер':'Усл. тендер'}</span>`;
const stTag=k=>{const s=STGOF(k);return `<span class="stg" style="--sc:${s.c}">${esc(s.n)}</span>`};
const pstTag=k=>{const s=PSTOF(k);return `<span class="stg" style="--sc:${s.c}">${esc(s.n)}</span>`};
const av=(k,cls='')=>TEAM[k]?`<span class="av ${cls}" title="${esc(TEAM[k].f+' · '+TEAM[k].r)}">${esc(TEAM[k].av)}</span>`:'';
const clL=id=>CL(id)?`<a class="lk" onclick="card('cl','${id}')">${esc(CL(id).n)}</a>`:'—';
const dealL=id=>DL(id)?`<a class="lk" onclick="openDeal('${id}')">${esc(DL(id).t)}</a>`:'—';
const projL=id=>PR(id)?`<a class="lk" onclick="openProj('${id}')">${esc(PR(id).t)}</a>`:'—';
const refL=r=>r&&r[0]==='P'?projL(r):dealL(r);
const refCl=r=>{const x=r&&r[0]==='P'?PR(r):DL(r);return x?CL(x.cl):null};
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const dleft=d=>{const n=daysBetween(TODAY,d);return n<0?`<span class="neg">${-n} дн. назад</span>`:n===0?'<b class="neg">сегодня</b>':`через ${n} ${plural(n,['день','дня','дней'])}`};
function openDeal(id){curDeal=id;dealTab='over';go('deal')}
function openProj(id){curProj=id;go('project')}
const weighted=d=>d.sum*(PROB[d.st]||0)/100;
const active=()=>DEALS.filter(d=>d.st!=='lost');
const myKey=()=>ROLES[role].p;

/* ===== Пульт ===== */
SC.dash=()=>{
 const newIn=INBOX.filter(i=>i.st==='new').length;
 const sales=DEALS.filter(d=>['new','brief','calc','creative','kp','defense','wait'].includes(d.st));
 const zadel=DEALS.filter(d=>['confirmed','contract'].includes(d.st));
 const real=PROJECTS.filter(p=>['prep','prod','event'].includes(p.st));
 const close=PROJECTS.filter(p=>p.st==='close');
 const life=[
  ['inbox','Входящие',newIn,'не разобрано',''],
  ['pipeline','Продажи',sales.length,mln(sales.reduce((a,d)=>a+d.sum,0)),'взвешенно '+mln(sales.reduce((a,d)=>a+weighted(d),0))],
  ['pipeline','Задел',zadel.length,mln(zadel.reduce((a,d)=>a+d.sum,0)),'подтверждено, не подписано'],
  ['projects','Реализация',real.length,mln(real.reduce((a,p)=>a+p.sum,0)),'в подготовке и монтаже'],
  ['finance','Закрытие',close.length,mln(close.reduce((a,p)=>a+p.sum-p.paid,0)),'ждём остаток по актам'],
  ['projects','Архив',PROJECTS.filter(p=>p.st==='done').length,'ретро','история сохранена']];
 const events=[...PROJECTS.filter(p=>p.st!=='done'&&p.st!=='close').map(p=>({d:p.from,t:p.t,cl:p.cl,who:p.pm,ready:p.ready,kind:'P',id:p.id,risk:p.risk})),
   ...DEALS.filter(d=>['confirmed','contract'].includes(d.st)).map(d=>({d:d.date,t:d.t,cl:d.cl,who:d.mgr,ready:0,kind:'D',id:d.id,risk:'не подписан'}))].sort((a,b)=>a.d<b.d?-1:1);
 const alerts=[
  ['r','Задача просрочена','Подписать договор с конгресс-холлом Шымкента — Ерлан, срок был 30.09','project','P5'],
  ['r','Конфликт брони реквизита','17.10: указателей нужно 10, на складе после ревизии 7 — Руслан и Тимур','propcal',''],
  ['w','Сделка без движения 8 дней','Тимбилдинг Altay Mining в Бурабае — клиент молчит, 12,6 млн','deal','D5'],
  ['w','Тендер: не хватает документов','Молодёжный форум — банковская гарантия и ценовое предложение до 08.10','tenders',''],
  ['w','Ждём остаток','Школа медпредставителей Steppe Pharma — 4 450 000 ₸ по акту от 29.09','docs',''],
  ['i','Защита завтра','Steppe Pharma: запуск препарата, против двух агентств — 02.10, 15:00','deal','D2']];
 return `<div class="hd"><div><h2>Пульт · ${dlong(TODAY)}</h2><p>Весь путь агентства на одном экране: от заявки в WhatsApp до акта и ретро. Каждая цифра открывается.</p></div>
  <div class="btns"><button class="bt" onclick="act('weekly')">Отчёт за неделю</button><button class="bt p" onclick="card('newdeal')">+ Сделка</button></div></div>
 <div class="life">${life.map((l,i)=>`<div class="lf" onclick="go('${l[0]}')"><small>${String(i+1).padStart(2,'0')} · ${l[1]}</small><b>${l[2]}</b><span>${l[3]}</span>${l[4]?`<em>${l[4]}</em>`:''}</div>`).join('')}</div>
 <div class="g21">
  <div class="pan"><h3>Ближайшие мероприятия</h3><p>Проекты в работе и подтверждённые сделки — по дате. Готовность считается по закрытым задачам проекта.</p>
   ${events.map(e=>`<div class="ev" onclick="${e.kind==='P'?`openProj('${e.id}')`:`openDeal('${e.id}')`}"><div class="evd"><b>${e.d.slice(8)}</b><small>${MON[+e.d.slice(5,7)-1].slice(0,3)}</small></div>
    <div class="evn"><b>${esc(e.t)}</b><span>${esc(CL(e.cl).n)} · ${e.kind==='P'?'PM':'менеджер'} ${who(e.who)} · ${dleft(e.d)}</span>${e.risk?`<span class="evr">${esc(e.risk)}</span>`:''}</div>
    <div class="evp">${e.kind==='P'?`<div class="bar"><i style="--w:${e.ready}%"></i></div><small>${e.ready}% готово</small>`:'<small class="warnt">задел</small>'}</div></div>`).join('')}
  </div>
  <div class="pan"><h3>Требует решения</h3><p>Правила, а не ручной обзвон: просрочки, конфликты брони, сделки без движения, тендеры, неоплаты.</p>
   ${alerts.map(a=>`<div class="al ${a[0]}" onclick="${a[4]?(a[3]==='deal'?`openDeal('${a[4]}')`:`openProj('${a[4]}')`):`go('${a[3]}')`}"><b>${a[1]}</b><span>${a[2]}</span></div>`).join('')}
  </div>
 </div>
 <div class="pan"><h3>Направления: в работе, задел и результат квартала</h3>
  <div class="tw"><table class="t"><thead><tr><th>Направление</th><th class="r">Сделок в работе</th><th class="r">Сумма в работе</th><th class="r">Взвешенно</th><th class="r">Задел</th><th class="r">Выиграно за квартал</th><th class="r">Проиграно</th><th class="r">Маржа</th></tr></thead><tbody>
  ${Object.keys(DIRS).map(k=>{const a=DEALS.filter(d=>d.dir===k&&!['lost','confirmed','contract'].includes(d.st)),z=DEALS.filter(d=>d.dir===k&&['confirmed','contract'].includes(d.st)),b=BYDIR.find(x=>x.d===k);
   return `<tr onclick="pipeDir='${k}';go('pipeline')"><td>${dirTag(k)}</td><td class="r">${a.length}</td><td class="r">${mln(a.reduce((s,d)=>s+d.sum,0))}</td><td class="r">${mln(a.reduce((s,d)=>s+weighted(d),0))}</td><td class="r">${mln(z.reduce((s,d)=>s+d.sum,0))}</td><td class="r">${b.won} · ${mln(b.rev)}</td><td class="r">${b.lost}</td><td class="r">${b.mg}%</td></tr>`}).join('')}
  </tbody></table></div>
  ${said('«Сколько проектов на этапе переговоров? Сколько на этапе просчётов? Сколько на этапе защиты? Сколько на этапе ожидания обратной связи?»','Это верхняя полоса и воронка: каждый этап — со счётчиком и суммой, задел — отдельно.')}
 </div>`;
};

/* ===== Входящие ===== */
SC.inbox=()=>{
 const rr=INBOX.filter(i=>i.st==='new').length;
 return `<div class="hd"><div><h2>Входящие · все каналы</h2><p>WhatsApp рабочего номера, почта, форма сайта, звонки, Instagram и 2ГИС — в одной ленте. Из сообщения — сделка с источником в один клик, переписка остаётся в карточке.</p></div>
  <div class="btns"><button class="bt" onclick="act('distrib')">Распределение: по очереди</button></div></div>
 <div class="chips">${Object.entries(CHANNELS).map(([k,c])=>`<span class="chip" style="--c:${c}">${k} · ${INBOX.filter(i=>i.ch===k).length}</span>`).join('')}<span class="chip off">не разобрано: ${rr}</span></div>
 <div class="inb">${INBOX.map(i=>`<div class="im ${i.st}"><div class="imch" style="--c:${CHANNELS[i.ch]}">${esc(i.ch)}</div>
   <div class="imb"><div class="imh"><b>${esc(i.name)}</b><span>${esc(i.from)} · ${i.t}</span></div><p>${esc(i.txt)}</p>
    ${i.file?`<span class="file">${esc(i.file)}</span>`:''}${i.utm?`<span class="file">UTM: ${esc(i.utm)}</span>`:''}
    <div class="imf">${i.st==='deal'?`<span class="tag g">сделка создана</span> ${dealL(i.deal)} · ${av(DL(i.deal).mgr)}`:`<button class="bt p" onclick="mkDeal('${i.id}','AB')">Сделка → Алина</button><button class="bt" onclick="mkDeal('${i.id}','TM')">Сделка → Тимур</button><button class="bt" onclick="act('spam')">Не заявка</button>`}</div></div></div>`).join('')}</div>
 ${said('«Заявки могут прийти на WhatsApp, на почту, могут позвонить» · «Нам важно понимать, откуда приходят заявки: с сайта через Google-рекламу, через Instagram, через 2ГИС или по рекомендации»','Канал и путь клиента записываются в сделку автоматически — из UTM сайта, номера WhatsApp, кнопки 2ГИС.')}`;
};
function mkDeal(iid,m){const i=INBOX.find(x=>x.id===iid);if(!i)return;const id='D'+(DEALS.length+1);const cid='K'+(CLIENTS.length+1);
 const nm=i.name.split(',').pop().trim().replace(' (новый)','');CLIENTS.push({id:cid,n:nm,ind:'—',city:'—',since:'2026',contact:i.name,src:i.ch==='Сайт'?'ads':i.ch==='Почта'?'mail':i.ch==='2ГИС'?'gis':'ig',dirs:['MKT'],ltv:0,projects:0,last:'—'});
 DEALS.unshift({id,cl:cid,t:i.ch==='Почта'?'Новогодний вечер, 450 сотрудников':i.ch==='Сайт'?'Конференция 2 дня, 300 участников':'Новая заявка',dir:i.ch==='Почта'?'HR':'MKT',ten:'none',src:i.ch==='Сайт'?'ads':i.ch==='Почта'?'mail':i.ch==='2ГИС'?'gis':'ig',mgr:m,st:'new',sum:0,mg:0,date:'2026-12-20',guests:0,cr:false,days:0,next:'Первый контакт в течение 15 минут',city:'—'});
 i.st='deal';i.deal=id;i.cl=cid;render();toast(`Сделка создана и отдана ${who(m)}: этап «Новая заявка», источник — ${esc(i.ch)}. Сообщение и файлы — в карточке.`)}

/* ===== Воронка ===== */
let pipeDir='all',pipeMgr='all';
SC.pipeline=()=>{
 const f=d=>!['lost','won'].includes(d.st)&&(pipeDir==='all'||d.dir===pipeDir)&&(pipeMgr==='all'||d.mgr===pipeMgr)&&(role!=='Менеджер продаж'||d.mgr==='AB');
 const L=DEALS.filter(f);const lost=DEALS.filter(d=>d.st==='lost');
 return `<div class="hd"><div><h2>Воронка продаж</h2><p>Этапы — как у вас: бриф, просчёт, креатив, КП и презентация, защита, ожидание ответа, подтверждён, договор и аванс. Карточки перетаскиваются; после аванса сделка сама становится проектом.</p></div>
  <div class="btns"><button class="bt p" onclick="card('newdeal')">+ Сделка</button></div></div>
 <div class="filt"><span>Направление</span>${[['all','Все'],...Object.entries(DIRS).map(([k,v])=>[k,v.n])].map(x=>`<button class="${pipeDir===x[0]?'on':''}" onclick="pipeDir='${x[0]}';render()">${x[1]}</button>`).join('')}
  <span>Менеджер</span>${[['all','Все'],['DS','Дана'],['AB','Алина'],['TM','Тимур']].map(x=>`<button class="${pipeMgr===x[0]?'on':''}" onclick="pipeMgr='${x[0]}';render()">${x[1]}</button>`).join('')}
  <em>В работе ${L.length} · ${mln(L.reduce((a,d)=>a+d.sum,0))} · взвешенно ${mln(L.reduce((a,d)=>a+weighted(d),0))}</em></div>
 <div class="kanban">${STG.map(s=>{const c=L.filter(d=>d.st===s.k);return `<div class="kcol" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="this.classList.remove('over');moveDeal(event.dataTransfer.getData('t'),'${s.k}')">
  <div class="khead" style="--c:${s.c}"><b>${s.n}</b><span>${c.length} · ${mln(c.reduce((a,d)=>a+d.sum,0))}</span></div>
  ${c.map(d=>`<div class="kcard" draggable="true" ondragstart="event.dataTransfer.setData('t','${d.id}')" onclick="openDeal('${d.id}')"><div class="kt">${dirTag(d.dir)}${tenTag(d.ten)}</div><b>${esc(CL(d.cl).n)}</b><span>${esc(d.t)}</span>
   <div class="km"><strong>${d.sum?mln(d.sum):'сумма —'}</strong>${av(d.mgr)}</div><div class="kf"><span>${d.date?dd(d.date):''}${d.guests?' · '+d.guests+' гостей':''}</span>${d.days>=7?`<span class="neg">${d.days} дн. без движения</span>`:''}</div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 <div class="pan"><h3>Проигранные — с причиной</h3><p>Причина обязательна при закрытии: так видно, где теряем — цена, сроки, перенос.</p>
  ${lost.map(d=>`<div class="kv"><span>${dirTag(d.dir)} ${clL(d.cl)} · ${esc(d.t)} · ${tg(d.sum)}</span><b>${esc(d.lost)}</b></div>`).join('')}</div>`;
};
function moveDeal(id,k){const d=DL(id);if(!d||d.st===k)return;d.st=k;d.days=0;render();
 toast(k==='contract'?`«${esc(d.t)}» → Договор и аванс. Как только аванс поступит, нажмите в карточке «Аванс получен» — проект создастся с командой и задачами.`:k==='confirmed'?`Сделка в заделе: подтверждена, но не подписана — попадает в отдельную строку аналитики.`:`«${esc(d.t)}» → ${STGOF(k).n}. История этапов записана.`)}

/* ===== Карточка сделки ===== */
let dealTab='over';
const BRIEF={D2:[['Цель','Запуск нового препарата: 300 врачей-кардиологов узнают о механизме действия и записываются на программу пробных назначений'],['Аудитория','Кардиологи и терапевты Алматы и области, 30–60 лет'],['Формат','Научная конференция + интерактивная зона «молекула» + фуршет'],['Дата и время','14 ноября 2026, 10:00–17:00'],['Площадка','Отель уровня 5*, театральная рассадка, синхроперевод'],['Бюджет клиента','до 23 млн ₸ с НДС'],['KPI','Не менее 280 пришедших, 120 записей на программу'],['Креатив','Нужен: сценография и KV — участвуем в сравнении трёх агентств'],['Ограничения','Требования фармкодекса: без развлекательной программы, без подарков дороже 5 МРП'],['ЛПР','Елена Ким — бренд-менеджер, финальное решение — медицинский директор']]};
SC.deal=()=>{
 const d=DL(curDeal)||DEALS[1];const c=CL(d.cl);const si=STG.findIndex(s=>s.k===d.st);
 const tabs=[['over','Обзор'],['brief','Бриф'],['est','Смета'],['cr','Креатив'],['chat','Переписка'],['doc','Документы'],['hist','История']];
 let body='';
 if(dealTab==='over')body=`<div class="g2"><div class="pan"><h3>Сделка</h3>
   ${[['Клиент',clL(d.cl)],['Контакт',esc(c.contact)],['Направление',dirTag(d.dir)],['Формат отбора',TENDER[d.ten]],['Источник',esc(SRC[d.src])],['Менеджер',av(d.mgr)+' '+esc(TEAM[d.mgr].f)],['Дата мероприятия',d.date?dl(d.date)+' · '+dleft(d.date):'—'],['Гостей · город',(d.guests||'—')+' · '+esc(d.city)],['Бюджет',d.sum?tg(d.sum):'—'],['Маржа по смете',d.mg?d.mg+'%':'—'],['Вероятность',(PROB[d.st]||0)+'%']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
  <div class="pan"><h3>Следующий шаг</h3><div class="nx">${esc(d.next||'—')}</div>
   <h3 style="margin-top:14px">Задачи по сделке</h3>${TASKS.filter(t=>t.ref===d.id).map(taskRow).join('')||'<p class="mini">Задач нет.</p>'}
   <button class="bt" onclick="card('task','${d.id}')">+ Задача</button>
   <h3 style="margin-top:14px">Реквизит под сделку</h3>${BOOK.filter(b=>b.ref===d.id).map(b=>`<div class="kv"><span>${esc(RP(b.p).n)} · ${b.q} шт · ${dd(b.from)}</span><b>${b.st==='tentative'?'<span class="tag w">предварительно</span>':'<span class="tag g">подтверждено</span>'}</b></div>`).join('')||'<p class="mini">Нет броней. Предварительная бронь сгорает, если сделка не подписана.</p>'}
  </div></div>`;
 if(dealTab==='brief')body=`<div class="pan"><h3>Бриф</h3><p>14 вопросов первой встречи — из шаблона базы знаний. Заполняет менеджер или клиент по ссылке.</p>
   ${(BRIEF[d.id]||[['Цель','—'],['Аудитория','—'],['Формат','—'],['Дата',d.date?dl(d.date):'—'],['Гостей',String(d.guests||'—')],['Бюджет клиента','—'],['Креатив',d.cr?'Нужен':'Не нужен']]).map(x=>`<div class="kv"><span>${x[0]}</span><b class="wrap">${esc(x[1])}</b></div>`).join('')}
   <button class="bt" onclick="act('brieflink')">Отправить бриф клиенту ссылкой</button></div>`;
 if(dealTab==='est')body=`<div class="pan"><h3>Сметы и версии</h3>${EST[d.id]?EST[d.id].vers.map(v=>`<div class="kv"><span>v${v.v} · ${dd(v.d)} · ${esc(v.note)}</span><b>${tg(v.sum||estTotal(d.id).client)}</b></div>`).join('')+`<button class="bt p" onclick="curEst='${d.id}';go('estimate')">Открыть смету v${EST[d.id].ver}</button>`:`<p class="mini">Сметы пока нет.</p><button class="bt p" onclick="newEst('${d.id}')">Создать смету из шаблона</button>`}</div>`;
 if(dealTab==='cr')body=`<div class="pan"><h3>Креатив по сделке</h3><div class="kv"><span>Подключается креатор</span><b><span class="sw ${d.cr?'on':''}" onclick="DL('${d.id}').cr=!DL('${d.id}').cr;render()"></span></b></div>
   ${CREATIVE.filter(x=>x.deal===d.id).map(x=>`<div class="kv"><span>${esc(x.t)} · ${esc(x.kind)} · ${av(x.who)}</span><b>${esc((CRST.find(s=>s[0]===x.st)||['','Без креатива'])[1])}</b></div>`).join('')||'<p class="mini">Креативных задач нет.</p>'}
   <button class="bt" onclick="go('creative')">Очередь креативной группы</button></div>`;
 if(dealTab==='chat')body=`<div class="pan"><h3>Переписка с клиентом</h3><p>WhatsApp рабочего номера, почта и звонки — в одной ленте сделки. Менеджер пишет отсюда, клиент — из обычного WhatsApp.</p>
   <div class="chat">${(d.id==='D2'?[['in','Елена Ким','18.09 10:14','Добрый день! Нам нужно агентство на запуск препарата, 300 врачей, 14 ноября. Можете прислать КП?'],['sys','','18.09 10:31','Звонок 6 мин 40 с · запись в карточке'],['out','Тимур','19.09 09:05','Елена, бриф по итогам звонка во вложении, проверьте, пожалуйста, ограничения фармкодекса.'],['in','Елена Ким','26.09 16:20','Получили КП v2. Можно ужать бюджет до 22 млн и оставить сценографию?'],['out','Тимур','29.09 12:10','Да — v3: LED 8 м вместо 12, кофе-брейк вместо фуршета во второй части. Итог ниже 22 млн.'],['in','Елена Ким','30.09 11:02','Ждём вас на защите 2 октября в 15:00.']]:[['in',c.contact,'—','Первое сообщение клиента появится здесь.']]).map(m=>`<div class="msg ${m[0]}">${m[1]?`<b>${esc(m[1])}</b> `:''}${esc(m[3])}<small>${m[2]}</small></div>`).join('')}</div>
   <div class="send"><input id="dmsg" placeholder="Сообщение клиенту в WhatsApp"><button class="bt p" onclick="act('wa')">Отправить</button></div></div>`;
 if(dealTab==='doc')body=`<div class="pan"><h3>Документы сделки</h3>${DOCS.filter(x=>x.ref===d.id).map(docRow).join('')||'<p class="mini">Документов нет. На этапе «Договор» договор и счёт формируются из реквизитов клиента.</p>'}<button class="bt" onclick="card('newdoc','${d.id}')">Сформировать договор и счёт</button></div>`;
 if(dealTab==='hist')body=`<div class="pan"><h3>История — от первого сообщения</h3><div class="tl">${(d.id==='D2'?[['18.09','Заявка с сайта','Google Ads → лендинг → форма «Рассчитать мероприятие»'],['18.09','Звонок и квалификация','Тимур · 6 мин 40 с'],['19.09','Бриф','согласован с клиентом'],['22.09','Просчёт v1','19,4 млн'],['24.09','Креатив','сценография «молекула», 3D-визуализация'],['26.09','КП v2 и презентация','22,6 млн'],['29.09','Смета v3','оптимизация под бюджет'],['02.10','Защита','против двух агентств']]:[['—','Создана',SRC[d.src]]]).map((h,i,a)=>`<div class="tli ${i===a.length-1?'on':'ok'}"><span class="who">${h[0]}</span><b>${esc(h[1])}</b><p>${esc(h[2])}</p></div>`).join('')}</div></div>`;
 return `<div class="crumb"><a onclick="go('pipeline')">Воронка</a> › ${esc(c.n)}</div>
 <div class="hd"><div><h2>${esc(d.t)}</h2><p>${clL(d.cl)} · ${dirTag(d.dir)} ${tenTag(d.ten)} · ${esc(SRC[d.src])} · ${av(d.mgr)} ${esc(TEAM[d.mgr].f)}</p></div>
  <div class="btns">${d.st==='contract'?`<button class="bt g" onclick="toProject('${d.id}')">Аванс получен → проект</button>`:si>=0&&si<STG.length-1?`<button class="bt p" onclick="moveDeal('${d.id}','${STG[si+1].k}')">→ ${STG[si+1].n}</button>`:''}<button class="bt" onclick="card('lost','${d.id}')">Проиграна</button></div></div>
 <div class="steps">${STG.map((s,i)=>`<div class="stp ${i<si?'done':i===si?'on':''}" onclick="moveDeal('${d.id}','${s.k}')"><i>${i<si?'✓':i+1}</i>${s.n}</div>`).join('')}</div>
 <div class="tabs">${tabs.map(t=>`<a class="tab ${dealTab===t[0]?'on':''}" onclick="dealTab='${t[0]}';render()">${t[1]}</a>`).join('')}</div>
 ${body}
 ${said('«CRM по сути для нас сейчас является неким архиватором клиентских карточек… Коммуникация переходит в рабочие личные телефоны, и она не ведётся в рамках CRM. Нет всей истории проекта»','Здесь вся история — бриф, сметы, креатив, переписка, документы — живёт в одной карточке и переходит в проект.')}`;
};
function toProject(id){const d=DL(id);if(!d)return;const pid='P'+(PROJECTS.length+2);
 PROJECTS.unshift({id:pid,cl:d.cl,deal:id,t:d.t,dir:d.dir,ten:d.ten,pm:'EK',st:'prep',from:d.date,to:d.date,sum:d.sum,plan:Math.round(d.sum*(1-d.mg/100)),fact:0,paid:Math.round(d.sum*.3),ready:5,risk:'',team:['EK',d.mgr,'MK','SE'],city:d.city});
 TASKS.push({id:'T'+(TASKS.length+1),ref:pid,t:'Стартовая встреча команды проекта',who:'EK',due:addDays(TODAY,1),st:'todo',pr:'high'},{id:'T'+(TASKS.length+2),ref:pid,t:'Создать клиентскую группу в WhatsApp',who:'MK',due:addDays(TODAY,1),st:'todo',pr:'mid'});
 d.st='won';d.proj=pid;curProj=pid;go('project');toast(`Проект создан без повторного ввода: смета стала бюджетом, команда и стартовые задачи назначены, история сделки перенесена.`)}

/* ===== Смета ===== */
let curEst='D2';
function estTotal(id){const e=EST[id];if(!e)return {cost:0,price:0,comm:0,client:0,mg:0};
 const L=e.lines.filter(l=>e.cr||l.cat!=='Сценография и креатив'||!/Концепция/.test(l.n));
 const cost=L.reduce((a,l)=>a+l.q*l.cost,0),price=L.reduce((a,l)=>a+l.q*l.price,0),comm=Math.round(price*e.comm/100),client=price+comm;
 return {cost,price,comm,client,mg:client-cost,mgp:pct(client-cost,client)}}
function setL(i,f,v){const e=EST[curEst];const n=+String(v).replace(/\s/g,'').replace(',','.');if(isNaN(n)||n<0){toast('Нужно число');render();return}e.lines[i][f]=n;render()}
function addLine(){const e=EST[curEst];const v=id=>document.getElementById(id).value.trim();const n=v('nl_n');if(!n){toast('Введите название статьи — любую: от аренды самолёта до флажков');return}
 e.lines.push({cat:v('nl_c'),n,c:v('nl_k')||'подрядчик',q:+v('nl_q')||1,u:'шт',cost:+v('nl_s')||0,price:+v('nl_p')||0});render();toast('Статья добавлена — смета и маржа пересчитаны.')}
function delLine(i){EST[curEst].lines.splice(i,1);render()}
function newEst(id){EST[id]={ver:1,comm:10,cr:!!DL(id).cr,vers:[{v:1,d:TODAY,sum:0,note:'Создана из шаблона «Конференция»'}],lines:EST.D2.lines.slice(0,6).map(l=>Object.assign({},l))};curEst=id;go('estimate');toast('Смета создана из шаблона: статьи можно менять, удалять, добавлять свои.')}
function saveVer(){const e=EST[curEst];const t=estTotal(curEst);e.vers[e.vers.length-1].sum=t.client;e.ver++;e.vers.push({v:e.ver,d:TODAY,sum:0,note:'Новая версия от '+dd(TODAY)});render();toast(`Версия v${e.ver-1} зафиксирована: ${tg(t.client)}. Работаем в v${e.ver}.`)}
SC.estimate=()=>{
 const d=DL(curEst);const e=EST[curEst];
 if(!e)return `<div class="hd"><div><h2>Смета · ${esc(d.t)}</h2><p>Сметы ещё нет.</p></div></div><div class="pan"><button class="bt p" onclick="newEst('${d.id}')">Создать из шаблона</button></div>`;
 const t=estTotal(curEst);
 const cats=[...new Set(e.lines.map(l=>l.cat))];
 return `<div class="crumb"><a onclick="openDeal('${d.id}')">${esc(CL(d.cl).n)} · ${esc(d.t)}</a> › смета</div>
 <div class="hd"><div><h2>Смета v${e.ver} · ${esc(CL(d.cl).n)}</h2><p>Индивидуальная смета без типовых услуг: любые статьи вручную, себестоимость подрядчика и цена клиенту в одной строке, агентская комиссия и маржа считаются сразу. Каждая отправленная версия сохраняется.</p></div>
  <div class="btns"><button class="bt" onclick="card('vers')">Сравнить версии</button><button class="bt" onclick="saveVer()">Зафиксировать версию</button><button class="bt p" onclick="card('kp','${d.id}')">Сформировать КП</button></div></div>
 <div class="vers">${e.vers.map(v=>`<div class="vr ${v.v===e.ver?'on':''}"><small>v${v.v} · ${dd(v.d)}</small><b>${v.sum?mln(v.sum):mln(t.client)}</b><span>${esc(v.note)}</span></div>`).join('')}</div>
 <div class="esum"><div><small>Себестоимость</small><b>${tg(t.cost)}</b></div><div><small>Цена статей клиенту</small><b>${tg(t.price)}</b></div><div><small>Комиссия, %</small><b><input class="qin" value="${e.comm}" onchange="EST[curEst].comm=+this.value||0;render()"> ${fmt(t.comm)}</b></div><div class="hi"><small>Итого клиенту</small><b>${tg(t.client)}</b></div><div><small>Маржа агентства</small><b class="${t.mgp<20?'warnt':'pos'}">${tg(t.mg)} · ${t.mgp}%</b></div><div><small>Креатив в смете</small><b><span class="sw ${e.cr?'on':''}" onclick="EST[curEst].cr=!EST[curEst].cr;render()"></span></b></div></div>
 <p class="mini" style="margin:-4px 0 10px">Бюджет клиента по брифу — до 23 млн. ${t.client<=23000000?'<b class="pos">Укладываемся.</b>':'<b class="neg">Выше бюджета на '+mln(t.client-23000000)+'.</b>'} Себестоимость и маржа в КП клиенту не попадают.</p>
 <div class="tw"><table class="t est"><thead><tr><th>Статья</th><th>Подрядчик</th><th class="r">Кол-во</th><th class="r">Себест. за ед.</th><th class="r">Цена клиенту за ед.</th><th class="r">Сумма клиенту</th><th class="r">Маржа</th><th></th></tr></thead><tbody>
 ${cats.map(c=>`<tr class="grp"><td colspan="8">${esc(c)}</td></tr>`+e.lines.map((l,i)=>l.cat!==c?'':`<tr class="${!e.cr&&/Концепция/.test(l.n)?'off':''}"><td><b>${esc(l.n)}</b></td><td class="mini">${esc(l.c)}</td>
  <td class="r"><input class="qin" value="${l.q}" onchange="setL(${i},'q',this.value)"> <small>${esc(l.u)}</small></td>
  <td class="r"><input class="qin w" value="${l.cost}" onchange="setL(${i},'cost',this.value)"></td>
  <td class="r"><input class="qin w" value="${l.price}" onchange="setL(${i},'price',this.value)"></td>
  <td class="r"><b>${fmt(l.q*l.price)}</b></td><td class="r ${l.price<=l.cost?'neg':''}">${pct(l.price-l.cost,l.price)}%</td><td><button class="xb" onclick="delLine(${i})" title="Удалить">×</button></td></tr>`).join('')).join('')}
 <tr class="add"><td><input id="nl_n" placeholder="Новая статья: например, аренда самолёта"></td><td><input id="nl_k" placeholder="подрядчик"></td><td class="r"><input id="nl_q" class="qin" placeholder="1"></td><td class="r"><input id="nl_s" class="qin w" placeholder="0"></td><td class="r"><input id="nl_p" class="qin w" placeholder="0"></td>
  <td colspan="2"><select id="nl_c">${EST_CATS.map(c=>`<option>${c}</option>`).join('')}</select></td><td><button class="bt p" onclick="addLine()">+</button></td></tr>
 </tbody></table></div>
 ${said('«У нас нет стандартных историй. Каждый проект индивидуальный… одна смета не похожа на другую, в одной смете нет типовых услуг» · «Всё что угодно — от аренды самолёта до…»','Поэтому здесь нет прайса: строки вписываются от руки, шаблоны лишь подсказывают структуру.')}`;
};

/* ===== Креатив ===== */
SC.creative=()=>{
 const load={};CREATIVE.filter(c=>['work','review','queue'].includes(c.st)&&c.who).forEach(c=>load[c.who]=(load[c.who]||0)+1);
 return `<div class="hd"><div><h2>Креатив и презентации</h2><p>Креатив — отдельный трек сделки: подключается креатор или нет, концепция, key visual, презентация, версии и согласование до защиты. Аскар видит загрузку группы, менеджер — где его задача.</p></div>
  <div class="btns"><button class="bt p" onclick="card('crnew')">+ Задача креативу</button></div></div>
 <div class="loads">${['AS','ZH','OL'].map(k=>`<div class="ld">${av(k)}<div><b>${esc(TEAM[k].f)}</b><span>${esc(TEAM[k].r)}</span></div><strong>${load[k]||0}</strong></div>`).join('')}</div>
 <div class="kanban cr">${CRST.map(s=>`<div class="kcol" ondragover="event.preventDefault()" ondrop="moveCr(event.dataTransfer.getData('t'),'${s[0]}')"><div class="khead" style="--c:#6d4c7d"><b>${s[1]}</b><span>${CREATIVE.filter(c=>c.st===s[0]).length}</span></div>
  ${CREATIVE.filter(c=>c.st===s[0]).map(c=>`<div class="kcard" draggable="true" ondragstart="event.dataTransfer.setData('t','${c.id}')" onclick="openDeal('${c.deal}')"><div class="kt"><span class="ttag">${esc(c.kind)}</span>${c.ver?`<span class="ttag">v${c.ver}</span>`:''}</div><b>${esc(CL(DL(c.deal).cl).n)}</b><span>${esc(c.t)}</span><div class="km"><strong>${c.due?'до '+dd(c.due):''}</strong>${av(c.who)}</div></div>`).join('')}</div>`).join('')}</div>
 <div class="pan"><h3>Без креатива</h3>${CREATIVE.filter(c=>c.st==='skip').map(c=>`<div class="kv"><span>${dealL(c.deal)}</span><b>${esc(c.t)}</b></div>`).join('')}</div>
 ${said('«Коммерческое предложение имеет расчёт ценовой и имеет подготовку креативную… Есть проекты, которые требуют креативных разработок, есть которые не требуют — подключается креатор или не подключается»')}`;
};
function moveCr(id,k){const c=CREATIVE.find(x=>x.id===id);if(!c)return;c.st=k;if(k==='review')c.ver++;render();toast(k==='done'?'Креатив готов к защите — менеджер получил уведомление.':`Креатив → ${(CRST.find(s=>s[0]===k)||[,''])[1]}.`)}

/* ===== Тендеры ===== */
SC.tenders=()=>`<div class="hd"><div><h2>Тендеры</h2><p>Три формата отбора — тендер, условный тендер, без тендера — у каждой сделки. Для тендеров: площадка, номер, дедлайн и чек-лист документов. Аналитика считает выигрыши по каждому формату.</p></div></div>
 <div class="g3">${BYTEN.map(b=>`<div class="pan stat"><small>${TENDER[b.k]}</small><b>${b.n}</b><span>выиграно ${b.won} · конверсия ${pct(b.won,b.n)}%</span></div>`).join('')}</div>
 ${TENDERS.map((t,ti)=>{const d=DL(t.deal);const ok=t.docs.filter(x=>x[1]).length;return `<div class="pan"><div class="row"><div><h3>${dealL(t.deal)}</h3><p>${clL(d.cl)} · ${tenTag(t.kind)} · ${esc(t.plat)} ${esc(t.no)} · ${dirTag(d.dir)}</p></div><div class="dl0"><b>${dd(t.due)}</b><span>${dleft(t.due)}</span></div></div>
  <div class="docs">${t.docs.map((x,i)=>`<label class="dck ${x[1]?'on':''}" onclick="TENDERS[${ti}].docs[${i}][1]=TENDERS[${ti}].docs[${i}][1]?0:1;render()"><i>${x[1]?'✓':''}</i>${esc(x[0])}</label>`).join('')}</div>
  <div class="mini">Документов ${ok} из ${t.docs.length}. ${esc(t.note)}</div></div>`}).join('')}
 ${said('«Какие проекты тендерные, какие условные тендеры, какие нетендерные»')}`;

/* ===== Клиенты ===== */
SC.clients=()=>{
 const L=CLIENTS.slice().sort((a,b)=>b.ltv-a.ltv);
 return `<div class="hd"><div><h2>Клиенты и LTV</h2><p>Сколько клиент принёс за всё время, сколько проектов, по каким направлениям, откуда пришёл и когда был последний проект. Постоянные клиенты — отдельной меткой.</p></div><div class="btns"><button class="bt" onclick="act('export')">Выгрузить в Excel</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Отрасль</th><th>Направления</th><th>Откуда пришёл</th><th class="r">Проектов</th><th class="r">LTV</th><th>Последний проект</th><th>В работе</th></tr></thead><tbody>
 ${L.map(c=>{const a=DEALS.filter(d=>d.cl===c.id&&!['lost','won'].includes(d.st));return `<tr onclick="card('cl','${c.id}')"><td><b>${esc(c.n)}</b>${c.projects>=3?' <span class="tag g">постоянный</span>':''}<span class="sub">${esc(c.contact)}</span></td><td>${esc(c.ind)}</td><td>${c.dirs.map(dirTag).join(' ')}</td><td>${esc(SRC[c.src]||'—')}</td><td class="r">${c.projects}</td><td class="r"><b>${c.ltv?tg(c.ltv):'—'}</b></td><td>${c.last==='—'?'—':dl(c.last)}</td><td>${a.length?a.map(d=>stTag(d.st)).join(' '):'—'}</td></tr>`}).join('')}
 </tbody></table></div>
 ${said('«Постоянный клиент к нам обращается — какой объём, лайфтайм вэлью клиента, то есть понимать, сколько клиент нам в целом принёс денег»')}`;
};

/* ===== Документы и ЭЦП ===== */
const docRow=x=>{const s=DOCST[x.st];return `<div class="dr"><div><b>${esc(x.k)} ${esc(x.no)}</b><span>${refL(x.ref)} · ${dd(x.d)} · ${esc(x.mode)}</span></div><div class="r"><b>${tg(x.sum)}</b><span class="stg" style="--sc:${s[1]}">${s[0]}</span></div>
 <div class="da">${x.st==='draft'?(x.mode==='ЭЦП'?`<button class="bt p" onclick="signDoc('${x.id}')">Подписать ЭЦП</button>`:`<button class="bt" onclick="paperDoc('${x.id}')">Распечатан и подписан</button>`):x.st==='our'||x.st==='sent'?`<button class="bt" onclick="signDoc('${x.id}')">${x.st==='our'?'Клиент подписал':'Отметить подпись'}</button>`:`<button class="bt" onclick="card('docv','${x.id}')">Открыть</button>`}</div></div>`};
function signDoc(id){const x=DOCS.find(d=>d.id===id);if(!x)return;if(x.st==='draft'){x.st='our';toast('NCALayer: документ подписан ЭЦП директора. Клиент получил ссылку и подписывает своей ЭЦП — без бумаги и курьера.')}else{x.st='signed';toast('Документ подписан обеими сторонами: две подписи и QR-код проверки, файл в карточке.')}render()}
function paperDoc(id){const x=DOCS.find(d=>d.id===id);if(!x)return;x.st='signed';render();toast('Бумажный вариант: скан с подписями загружен, статус — подписан.')}
SC.docs=()=>`<div class="hd"><div><h2>Договоры, счета, акты · ЭЦП</h2><p>Документ формируется из реквизитов клиента и сметы. Дальше — как попросит клиент: электронно с ЭЦП или на бумаге со сканом. Статус виден в сделке, проекте и здесь.</p></div><div class="btns"><button class="bt p" onclick="card('newdoc','D7')">+ Документ</button></div></div>
 <div class="flow">${[['01','Сформировать','из шаблона и реквизитов'],['02','Отправить','ссылкой в WhatsApp или на почту'],['03','Подписать нами','ЭЦП директора через NCALayer'],['04','Подписать клиентом','своей ЭЦП, без установки системы'],['05','В архив проекта','PDF с двумя подписями и QR']].map((f,i)=>`<div class="fbx ${i===2?'on':''}"><code>${f[0]}</code><b>${f[1]}</b><p>${f[2]}</p></div>`).join('')}</div>
 <div class="pan">${DOCS.map(docRow).join('')}</div>
 ${said('«Иногда бумажные варианты, иногда электронный вариант — это зависит от того, как клиент просит»')}`;

/* ===== Бюджеты и оплаты ===== */
SC.finance=()=>{
 const L=PROJECTS;const recv=L.reduce((a,p)=>a+p.sum-p.paid,0);
 return `<div class="hd"><div><h2>Бюджеты и оплаты проектов</h2><p>Смета после подписания становится бюджетом: план себестоимости, факт по подрядчикам, оплаты клиента и остаток к получению. Маржа план и факт — по каждому проекту.</p></div></div>
 <div class="g3"><div class="pan stat"><small>Ждём от клиентов</small><b>${tg(recv)}</b><span>по актам и графику оплат</span></div><div class="pan stat"><small>Маржа портфеля, план</small><b>${pct(L.reduce((a,p)=>a+p.sum-p.plan,0),L.reduce((a,p)=>a+p.sum,0))}%</b><span>${mln(L.reduce((a,p)=>a+p.sum-p.plan,0))}</span></div><div class="pan stat"><small>Перерасход по факту</small><b class="neg">1 проект</b><span>Школа медпредставителей: +100 000 ₸</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Проект</th><th>Этап</th><th class="r">Сумма клиенту</th><th class="r">Себест. план</th><th class="r">Себест. факт</th><th class="r">Оплачено клиентом</th><th class="r">Остаток</th><th class="r">Маржа план</th></tr></thead><tbody>
 ${L.map(p=>`<tr onclick="openProj('${p.id}')"><td><b>${esc(CL(p.cl).n)}</b><span class="sub">${esc(p.t)}</span></td><td>${pstTag(p.st)}</td><td class="r">${fmt(p.sum)}</td><td class="r">${fmt(p.plan)}</td><td class="r ${p.fact>p.plan?'neg':''}">${fmt(p.fact)}</td><td class="r">${fmt(p.paid)}</td><td class="r"><b>${p.sum-p.paid?fmt(p.sum-p.paid):'—'}</b></td><td class="r">${pct(p.sum-p.plan,p.sum)}%</td></tr>`).join('')}
 </tbody></table></div>
 <div class="note"><b>Adesk остаётся как есть</b><p>Управленческий учёт у вас в Adesk — система не дублирует его. По желанию проекты и оплаты можно передавать в Adesk по API — оцениваем отдельно.</p></div>`;
};

/* ===== Портфель проектов ===== */
const myProj=()=>PROJECTS.filter(p=>role!=='Проджект-менеджер'||p.pm==='RT');
SC.projects=()=>{
 const L=myProj();const t0='2026-08-24',days=126;const x=d=>Math.max(0,Math.min(100,daysBetween(t0,d)/days*100));
 const weeks=[];for(let i=0;i<days;i+=7)weeks.push(addDays(t0,i));
 const rows=[...L.map(p=>({id:p.id,P:1,t:p.t,cl:p.cl,from:p.from,to:p.to,st:p.st,c:PSTOF(p.st).c})),...DEALS.filter(d=>['confirmed','contract'].includes(d.st)).map(d=>({id:d.id,P:0,t:d.t,cl:d.cl,from:d.date,to:d.date,st:d.st,c:'#a39b92'}))].sort((a,b)=>a.from<b.from?-1:1);
 return `<div class="hd"><div><h2>Портфель проектов</h2><p>После аванса сделка становится проектом сама: смета → бюджет, менеджер и клиентский сервис остаются в команде, добавляется проджект. Сверху — календарь агентства, ниже — карточки.</p></div><div class="btns"><button class="bt" onclick="go('tasks')">Задачи команды</button></div></div>
 <div class="pan gantt"><div class="gh">${weeks.map(w=>`<span style="left:${x(w)}%">${dd(w)}</span>`).join('')}<i class="now" style="left:${x(TODAY)}%"></i></div>
  ${rows.map(r=>`<div class="gr" onclick="${r.P?`openProj('${r.id}')`:`openDeal('${r.id}')`}"><div class="gl"><b>${esc(CL(r.cl).n)}</b><span>${esc(r.t)}</span></div><div class="gt"><i style="left:${x(r.from)}%;width:${Math.max(1.2,x(addDays(r.to,1))-x(r.from))}%;--c:${r.c}" class="${r.P?'':'tent'}"></i><i class="now" style="left:${x(TODAY)}%"></i></div></div>`).join('')}
  <div class="legend">${PST.map(s=>`<span><i style="background:${s.c}"></i>${s.n}</span>`).join('')}<span><i class="tent"></i>задел: подтверждён, не подписан</span></div></div>
 <div class="ogrid">${L.map(p=>`<div class="ocard" onclick="openProj('${p.id}')"><div class="oh"><b>${esc(CL(p.cl).n)}</b>${pstTag(p.st)}</div><p>${esc(p.t)}</p>
  <div class="kv"><span>Даты · город</span><b>${dd(p.from)}${p.to!==p.from?'–'+dd(p.to):''} · ${esc(p.city)}</b></div><div class="kv"><span>Проджект</span><b>${av(p.pm)} ${who(p.pm)}</b></div><div class="kv"><span>Бюджет</span><b>${mln(p.sum)}</b></div>
  <div class="bar"><i style="--w:${p.ready}%"></i></div><div class="om"><span>готовность ${p.ready}%</span><span>${dirTag(p.dir)}</span></div>${p.risk?`<div class="evr">${esc(p.risk)}</div>`:''}</div>`).join('')}</div>
 ${said('«Задачи по реализации мероприятия… они ведутся уже просто в Excel» · «от поступления заявки до вообще успешной реализации, включая все этапы производства — как-то фиксируется история проекта»')}`;
};

/* ===== Карточка проекта ===== */
const taskRow=t=>`<div class="tk ${t.st==='done'?'done':''}"><span class="bx ${t.st==='done'?'on':''}" onclick="event.stopPropagation();toggleTask('${t.id}')">${t.st==='done'?'✓':''}</span><div><b>${esc(t.t)}</b><span>${av(t.who)} ${who(t.who)} · до ${dd(t.due)} ${t.st!=='done'&&t.due<TODAY?'<span class="neg">просрочено</span>':''}</span></div><span class="pri" style="--c:${PRI[t.pr][1]}">${PRI[t.pr][0]}</span></div>`;
function toggleTask(id){const t=TASKS.find(x=>x.id===id);if(!t)return;t.st=t.st==='done'?'todo':'done';const p=PR(t.ref);if(p){const all=TASKS.filter(x=>x.ref===p.id);p.ready=Math.max(p.ready,Math.round(all.filter(x=>x.st==='done').length/all.length*100))}render();toast(t.st==='done'?'Задача закрыта — руководитель и команда видят это сразу.':'Задача снова открыта.')}
SC.project=()=>{
 const p=PR(curProj)||PROJECTS[0];const si=PST.findIndex(s=>s.k===p.st);const B=BUDGET[p.id];
 return `<div class="crumb"><a onclick="go('projects')">Портфель</a> › ${esc(CL(p.cl).n)}</div>
 <div class="hd"><div><h2>${esc(p.t)}</h2><p>${clL(p.cl)} · ${dirTag(p.dir)} · ${dl(p.from)}${p.to!==p.from?' — '+dl(p.to):''} · ${esc(p.city)} · проджект ${av(p.pm)} ${esc(TEAM[p.pm].f)}</p></div>
  <div class="btns"><button class="bt" onclick="curChat='p1in';go('chats')">Чат проекта</button><button class="bt" onclick="go('ros')">Тайминг дня</button>${si<PST.length-1?`<button class="bt p" onclick="PR('${p.id}').st='${PST[Math.min(si+1,PST.length-1)].k}';render();toast('Этап проекта изменён — команда получила уведомление.')">→ ${PST[Math.min(si+1,PST.length-1)].n}</button>`:''}</div></div>
 <div class="steps">${PST.map((s,i)=>`<div class="stp ${i<si?'done':i===si?'on':''}"><i>${i<si?'✓':i+1}</i>${s.n}</div>`).join('')}</div>
 ${p.risk?`<div class="al r" style="margin-bottom:12px"><b>Риск</b><span>${esc(p.risk)}</span></div>`:''}
 <div class="g21"><div>
  <div class="pan"><h3>Задачи проекта</h3><p>Каждая задача — с ответственным и сроком. У Руслана она в «Моих задачах», у Инны — в общей картине.</p>${TASKS.filter(t=>t.ref===p.id).map(taskRow).join('')||'<p class="mini">Задач пока нет.</p>'}<button class="bt" onclick="card('task','${p.id}')">+ Задача</button></div>
  ${B?`<div class="pan"><h3>Бюджет: план и факт по статьям</h3><div class="tw"><table class="t"><thead><tr><th>Статья</th><th>Подрядчик</th><th class="r">План</th><th class="r">Факт</th><th>Статус</th></tr></thead><tbody>${B.map(b=>`<tr><td>${esc(b.n)}</td><td class="mini">${esc(b.c)}</td><td class="r">${fmt(b.plan)}</td><td class="r">${fmt(b.fact)}</td><td><span class="tag">${esc(b.st)}</span></td></tr>`).join('')}<tr class="total"><td>Итого себестоимость</td><td></td><td class="r">${fmt(B.reduce((a,b)=>a+b.plan,0))}</td><td class="r">${fmt(B.reduce((a,b)=>a+b.fact,0))}</td><td></td></tr></tbody></table></div>
   <div class="kv"><span>Клиент платит</span><b>${tg(p.sum)}</b></div><div class="kv"><span>Оплачено клиентом</span><b>${tg(p.paid)}</b></div><div class="kv"><span>Маржа по плану</span><b class="pos">${tg(p.sum-B.reduce((a,b)=>a+b.plan,0))} · ${pct(p.sum-B.reduce((a,b)=>a+b.plan,0),p.sum)}%</b></div></div>`:`<div class="pan"><h3>Бюджет</h3><div class="kv"><span>Клиент платит</span><b>${tg(p.sum)}</b></div><div class="kv"><span>Себестоимость план · факт</span><b>${tg(p.plan)} · ${tg(p.fact)}</b></div><div class="kv"><span>Оплачено клиентом</span><b>${tg(p.paid)}</b></div></div>`}
 </div><div>
  <div class="pan"><h3>Рабочая группа</h3><p>Только команда агентства — внутренний чат проекта.</p>${p.team.map(k=>`<div class="mem">${av(k)}<div><b>${esc(TEAM[k].f)}</b><span>${esc(TEAM[k].r)}</span></div></div>`).join('')}</div>
  <div class="pan"><h3>Клиентская группа</h3><p>WhatsApp-группа с рабочего номера: клиент пишет из обычного WhatsApp, переписка падает сюда.</p>
   <div class="mem"><span class="av cl">КЛ</span><div><b>${esc(CL(p.cl).contact)}</b><span>представитель клиента</span></div></div>
   ${[p.team.find(k=>['AB','TM','DS'].includes(k)),'MK',p.pm].filter(Boolean).map(k=>`<div class="mem">${av(k)}<div><b>${esc(TEAM[k].f)}</b><span>${esc(TEAM[k].r)}</span></div></div>`).join('')}</div>
  <div class="pan"><h3>Реквизит</h3>${BOOK.filter(b=>b.ref===p.id).map(b=>`<div class="kv"><span>${esc(RP(b.p).n)}</span><b>${b.q} шт · ${dd(b.from)}</b></div>`).join('')||'<p class="mini">Нет броней.</p>'}<button class="bt" onclick="go('propcal')">Брони по датам</button></div>
  <div class="pan"><h3>Документы</h3>${DOCS.filter(x=>x.ref===p.id).map(x=>`<div class="kv"><span>${esc(x.k)} ${esc(x.no)}</span><b>${DOCST[x.st][0]}</b></div>`).join('')||'<p class="mini">Нет документов.</p>'}</div>
 </div></div>`;
};

/* ===== Задачи ===== */
let taskMode='all';
SC.tasks=()=>{
 const me=myKey();const L=TASKS.filter(t=>taskMode==='mine'?t.who===me:true).filter(t=>role!=='Склад реквизита'||t.who==='SE'||taskMode==='all').sort((a,b)=>a.st==='done'?1:b.st==='done'?-1:a.due<b.due?-1:1);
 const people=[...new Set(L.map(t=>t.who))];
 return `<div class="hd"><div><h2>Задачи команды</h2><p>Задача ставится в карточке проекта или сделки и сразу появляется у ответственного. Руководитель видит всё: кто, что, к какому сроку, что просрочено.</p></div>
  <div class="btns"><div class="seg"><button class="${taskMode==='mine'?'on':''}" onclick="taskMode='mine';render()">Мои</button><button class="${taskMode==='all'?'on':''}" onclick="taskMode='all';render()">Вся команда</button></div><button class="bt p" onclick="card('task','P1')">+ Задача</button></div></div>
 <div class="g3">${[['Сегодня и раньше',L.filter(t=>t.st!=='done'&&t.due<=TODAY).length,'r'],['На неделе',L.filter(t=>t.st!=='done'&&t.due>TODAY&&t.due<=addDays(TODAY,7)).length,''],['Закрыто',L.filter(t=>t.st==='done').length,'g']].map(x=>`<div class="pan stat"><small>${x[0]}</small><b class="${x[2]==='r'?'neg':x[2]==='g'?'pos':''}">${x[1]}</b></div>`).join('')}</div>
 ${people.map(k=>`<div class="pan"><h3>${av(k)} ${esc(TEAM[k].f)} <span class="mini">· ${esc(TEAM[k].r)}</span></h3>${L.filter(t=>t.who===k).map(t=>taskRow(t).replace('</b><span>',`</b><span>${refL(t.ref)} · `)).join('')}</div>`).join('')||'<div class="pan"><p class="mini">Задач нет.</p></div>'}`;
};

/* ===== Тайминг дня ===== */
let rosNow=6;
function shiftRos(i,m){ROS.forEach((r,j)=>{if(j>=i){const [h,mm]=r.t.split(':').map(Number);const t=h*60+mm+m;r.t=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}});render();toast(`Тайминг сдвинут на ${m} минут начиная с «${esc(ROS[i].n)}». Команда и клиентская группа получили обновление.`)}
SC.ros=()=>`<div class="hd"><div><h2>Тайминг дня · гала-ужин 18 октября</h2><p>${projL('P1')} · караван-сарай, Туркестан. Поминутный план с зонами и ответственными; на площадке проджект отмечает пункты с телефона, сдвиг тайминга уходит всей команде.</p></div>
  <div class="btns"><button class="bt" onclick="act('rosprint')">PDF для подрядчиков</button></div></div>
 <div class="ros">${ROS.map((r,i)=>`<div class="rr ${r.done?'done':''} ${i===rosNow?'now':''}"><span class="rt">${r.t}</span><span class="rd">${r.d} мин</span><div class="rn"><b>${esc(r.n)}</b><span>${esc(r.z)} · ${av(r.who)} ${who(r.who)}</span></div>
  <div class="ra"><span class="bx ${r.done?'on':''}" onclick="ROS[${i}].done=!ROS[${i}].done;rosNow=ROS.findIndex(x=>!x.done);render()">${r.done?'✓':''}</span><button class="bt" onclick="shiftRos(${i},15)">+15 мин</button></div></div>`).join('')}</div>
 ${said('«Создаётся рабочая группа по проекту… и создаётся клиентская группа» ','Тайминг виден обеим группам: команде — с подрядчиками и зонами, клиенту — программа для гостей.')}`;

/* ===== Подрядчики ===== */
SC.contractors=()=>`<div class="hd"><div><h2>Подрядчики</h2><p>База подрядчиков с условиями и рейтингом по прошлым проектам: проджект выбирает подрядчика в смету и бюджет, оценка ставится при закрытии проекта.</p></div><div class="btns"><button class="bt p" onclick="act('contr')">+ Подрядчик</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Подрядчик</th><th>Категория</th><th>Город</th><th>Условия</th><th class="r">Проектов с нами</th><th class="r">Рейтинг</th><th>Заметка</th></tr></thead><tbody>
 ${CONTRACTORS.map(c=>`<tr onclick="act('contrcard')"><td><b>${esc(c.n)}</b></td><td>${esc(c.cat)}</td><td>${esc(c.city)}</td><td>${esc(c.rate)}</td><td class="r">${c.proj}</td><td class="r"><b>${c.score.toFixed(1).replace('.',',')}</b> <span class="stars" style="--p:${c.score/5*100}%"></span></td><td class="mini">${esc(c.note)}</td></tr>`).join('')}
 </tbody></table></div>`;

/* ===== Чаты ===== */
const chatWho=k=>k==='CLIENT'?'Гаухар · Nomad Telecom':who(k);
function sendChat(){const i=document.getElementById('cmsg');if(!i||!i.value.trim())return;CHATS[curChat].msgs.push({w:myKey(),t:'11:58',m:i.value.trim()});render();toast(curChat==='p1cl'?'Сообщение ушло в WhatsApp-группу клиента с рабочего номера.':'Сообщение во внутреннем чате — клиент его не видит.')}
SC.chats=()=>{const c=CHATS[curChat];
 return `<div class="hd"><div><h2>Чаты · команда и клиент</h2><p>Внутренние чаты живут в системе — телефоны сотрудников подключать не нужно. Клиентская группа — это WhatsApp-группа рабочего номера: клиент пишет как обычно, команда видит и отвечает из системы.</p></div></div>
 <div class="chatw"><div class="chl">${Object.entries(CHATS).map(([k,x])=>`<a class="${k===curChat?'on':''}" onclick="curChat='${k}';render()"><b>${esc(x.n)}</b><span>${esc(x.kind)} · ${x.members.length} уч.</span></a>`).join('')}</div>
  <div class="chm"><div class="chh"><b>${esc(c.n)}</b><span>${esc(c.kind)} · ${c.members.map(m=>m==='CLIENT'?'клиент':who(m)).join(', ')}</span></div>
   <div class="chat">${c.msgs.map(m=>`<div class="msg ${m.w===myKey()?'out':m.w==='CLIENT'?'in cl':'in'}"><b>${esc(chatWho(m.w))}</b> ${esc(m.m)}<small>${m.t}</small></div>`).join('')}</div>
   <div class="send"><input id="cmsg" placeholder="${curChat==='p1cl'?'Ответ клиенту — уйдёт в WhatsApp':'Сообщение команде'}" onkeydown="if(event.key==='Enter')sendChat()"><button class="bt p" onclick="sendChat()">Отправить</button></div></div></div>
 ${said('«По каждому проекту создаётся рабочая группа, где только участники команды, и создаётся клиентская группа, в которую подключается представитель клиента, менеджер отдела продаж, клиентской службы и проджект»','Так и сделано: две группы на проект, обе привязаны к карточке. Клиент не видит внутреннюю переписку.')}`;
};

/* ===== Реквизит ===== */
const bookedOn=(pid,day,skip)=>BOOK.filter(b=>b.p===pid&&b.id!==skip&&b.from<=day&&b.to>=day).reduce((a,b)=>a+b.q,0);
let propDay='2026-10-17';
SC.props=()=>`<div class="hd"><div><h2>Склад реквизита</h2><p>Реквизит не продаётся: он уходит на ваши мероприятия или в аренду и возвращается. Поэтому главное — сколько исправных и сколько свободно на нужную дату. Бронь видят все менеджеры.</p></div>
  <div class="btns"><label class="dsel">Свободно на <input type="date" value="${propDay}" onchange="propDay=this.value;render()"></label><button class="bt p" onclick="card('book')">+ Бронь</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Позиция</th><th>Категория</th><th>Ячейка</th><th class="r">Всего</th><th class="r">Исправно</th><th class="r">В ремонте</th><th class="r">Занято ${dd(propDay)}</th><th class="r">Свободно ${dd(propDay)}</th></tr></thead><tbody>
 ${PROPS.map(p=>{const b=bookedOn(p.id,propDay),f=p.ok-b;return `<tr onclick="card('prop','${p.id}')"><td><b>${esc(p.n)}</b></td><td>${esc(p.cat)}</td><td class="mono">${esc(p.cell)}</td><td class="r">${p.tot}</td><td class="r">${p.ok}</td><td class="r ${p.broken?'warnt':''}">${p.broken||'—'}</td><td class="r">${b||'—'}</td><td class="r"><b class="${f<0?'neg':f===0?'warnt':'pos'}">${f}</b></td></tr>`}).join('')}
 </tbody></table></div>
 ${said('«Один менеджер бронирует определённый объём реквизита на определённую дату… бывает, что пересекаются датой, и один менеджер может не знать, что забронировал другой»')}`;
function bookProp(){const v=id=>document.getElementById(id).value;const p=v('bk_p'),q=+v('bk_q'),fr=v('bk_f'),to=v('bk_t')||fr,ref=v('bk_r');if(!q||q<1){toast('Укажите количество');return}
 const P=RP(p);let worst=P.ok,day=fr;for(let d=fr;d<=to;d=addDays(d,1)){const free=P.ok-bookedOn(p,d);if(free<worst){worst=free;day=d}}
 if(q>worst){document.getElementById('bk_res').innerHTML=`<div class="al r"><b>Не хватает ${q-worst} шт на ${dd(day)}</b><span>Исправно ${P.ok}, уже забронировано ${bookedOn(p,day)}: ${BOOK.filter(b=>b.p===p&&b.from<=day&&b.to>=day).map(b=>who(b.by)+' — '+b.q+' шт').join(', ')}. Возьмите меньше, другую позицию или договоритесь в чате.</span></div>`;return}
 BOOK.push({id:'B'+(BOOK.length+1),p,q,from:fr,to,ref,by:myKey(),st:ref[0]==='P'?'confirmed':'tentative'});closeM();render();toast(`Забронировано: ${esc(P.n)} — ${q} шт, ${dd(fr)}${to!==fr?'–'+dd(to):''}. Остальные менеджеры видят бронь сразу.`)}
SC.propcal=()=>{
 const days=[];for(let i=0;i<31;i++)days.push(addDays('2026-10-05',i));
 const conf=[];PROPS.forEach(p=>days.forEach(d=>{if(bookedOn(p.id,d)>p.ok)conf.push([p,d])}));
 return `<div class="hd"><div><h2>Брони по датам</h2><p>Каждая клетка — сколько штук занято в этот день. Красная — забронировали больше, чем исправно на складе. Предварительная бронь под сделку сгорает, если сделка не подписана.</p></div><div class="btns"><button class="bt p" onclick="card('book')">+ Бронь</button></div></div>
 ${conf.length?conf.map(c=>`<div class="al r"><b>Конфликт: ${esc(c[0].n)} · ${dd(c[1])}</b><span>Исправно ${c[0].ok}, забронировано ${bookedOn(c[0].id,c[1])}: ${BOOK.filter(b=>b.p===c[0].id&&b.from<=c[1]&&b.to>=c[1]).map(b=>`${who(b.by)} — ${b.q} шт (${refL(b.ref)})`).join('; ')}. <a class="lk" onclick="fixConflict('${c[0].id}','${c[1]}')">Заменить у предварительной брони на стойки-ограждения</a></span></div>`).join(''):'<div class="al g"><b>Конфликтов нет</b><span>Все брони помещаются в исправный остаток.</span></div>'}
 <div class="pan cal"><div class="cg" style="--n:${days.length}"><div class="ch0"></div>${days.map(d=>`<div class="ch ${['сб','вс'].includes(dayOf(d))?'we':''} ${d===TODAY?'td':''}"><b>${d.slice(8)}</b><small>${dayOf(d)}</small></div>`).join('')}
  ${PROPS.map(p=>`<div class="cn"><b>${esc(p.n)}</b><span>исправно ${p.ok}</span></div>${days.map(d=>{const b=bookedOn(p.id,d);return `<div class="cc ${b>p.ok?'bad':b?'on':''}" title="${b} из ${p.ok}">${b||''}</div>`}).join('')}`).join('')}</div></div>`;
};
function fixConflict(pid,day){const b=BOOK.filter(x=>x.p===pid&&x.from<=day&&x.to>=day&&x.st==='tentative').pop();if(!b){toast('Подтверждённые брони меняет только руководитель — напишите в чат.');return}b.p='R7';render();toast(`Бронь ${who(b.by)} переведена на стойки-ограждения — конфликт снят, ${who(b.by)} получил уведомление.`)}
SC.revision=()=>`<div class="hd"><div><h2>Ревизия, выдача, поломки</h2><p>Кладовщик пересчитывает склад с телефона: ввёл факт — система показала расхождение, причину и действие. Было 10 указателей — стало 7, и все брони сразу считают от семи.</p></div><div class="btns"><button class="bt p" onclick="doRev()">Провести ревизию</button></div></div>
 <div class="g21"><div class="pan"><h3>Пересчёт · ${dlong(TODAY)}</h3><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th class="r">По учёту</th><th class="r">Факт</th><th class="r">Разница</th></tr></thead><tbody>
  ${PROPS.map(p=>`<tr><td>${esc(p.n)}<span class="sub">${esc(p.cell)}</span></td><td class="r">${p.ok}</td><td class="r"><input class="qin" id="rv_${p.id}" value="${p.ok}" onchange="revDiff('${p.id}',this.value)"></td><td class="r" id="rd_${p.id}">—</td></tr>`).join('')}
 </tbody></table></div></div>
 <div><div class="pan"><h3>Журнал ревизий и поломок</h3>${REVLOG.map(r=>`<div class="tli bad"><span class="who">${dd(r.d)} · ${who(r.who)}</span><b>${esc(RP(r.p).n)}: ${r.was} → ${r.now}</b><p>${esc(r.why)} · ${esc(r.act)}</p></div>`).join('')}</div>
 <div class="pan"><h3>Выдача и возврат</h3>${ISSUES.map((x,i)=>`<div class="kv"><span>${dd(x.d)} · ${esc(x.kind)} · ${esc(RP(x.p).n)} × ${x.q}<span class="sub">${refL(x.ref)}${x.note?' · '+esc(x.note):''}</span></span><b>${x.st==='done'?'<span class="tag g">проведено</span>':`<button class="bt" onclick="ISSUES[${i}].st='done';render();toast('Выдача проведена: фото состояния и подпись получателя в карточке.')">Выдать</button>`}</b></div>`).join('')}</div></div></div>
 ${said('«Чек, который отвечает за хранение на складе, делает периодические ревизии и понимает, что у него там три указателя сломались… помечают, что у него теперь не десять указателей, а семь»')}`;
function revDiff(id,v){const p=RP(id),n=+v,el=document.getElementById('rd_'+id);if(el)el.innerHTML=n===p.ok?'—':`<b class="${n<p.ok?'neg':'pos'}">${n-p.ok>0?'+':''}${n-p.ok}</b>`}
function doRev(){let c=0;PROPS.forEach(p=>{const i=document.getElementById('rv_'+p.id);if(!i)return;const n=+i.value;if(n!==p.ok&&n>=0){REVLOG.unshift({d:TODAY,who:'SE',p:p.id,was:p.ok,now:n,why:'Ревизия',act:n<p.ok?'в ремонт / списать':'найдено'});p.broken+=Math.max(0,p.ok-n);p.ok=n;c++}});render();toast(c?`Ревизия проведена: изменено позиций — ${c}. Брони пересчитаны от нового остатка.`:'Расхождений нет — ревизия записана.')}

/* ===== Аналитика ===== */
SC.analytics=()=>{
 const zadel=DEALS.filter(d=>['confirmed','contract'].includes(d.st));
 return `<div class="hd"><div><h2>Продажи и конверсия</h2><p>Конверсия по этапам, задел, план-факт, выигрыши и потери по направлениям и форматам отбора. Всё считается из воронки — без ручных сводов в Excel.</p></div><div class="btns"><button class="bt" onclick="act('export')">Выгрузить</button></div></div>
 <div class="g2"><div class="pan"><h3>Конверсия по этапам · III квартал</h3>${FUNNEL.map((f,i)=>`<div class="fr"><span>${f[0]}</span><div class="bar"><i style="--w:${pct(f[1],FUNNEL[0][1])}%"></i></div><b>${f[1]}${i?` · ${pct(f[1],FUNNEL[i-1][1])}%`:''}</b></div>`).join('')}<p class="mini">Из заявки в подписанный договор — ${pct(FUNNEL[6][1],FUNNEL[0][1])}%. Больше всего теряем между защитой и подтверждением.</p></div>
 <div class="pan"><h3>Задел: подтверждено, но не подписано</h3>${zadel.map(d=>`<div class="kv"><span>${dealL(d.id)}<span class="sub">${esc(CL(d.cl).n)} · ${stTag(d.st)}</span></span><b>${tg(d.sum)}</b></div>`).join('')}<div class="kv big"><span>Итого задел</span><b>${tg(zadel.reduce((a,d)=>a+d.sum,0))}</b></div></div></div>
 <div class="pan"><h3>План-факт по месяцам, млн ₸</h3><div class="pf">${PLANFACT.map(m=>`<div class="pfc"><div class="pfb"><i class="p" style="height:${m[1]/90*100}%"></i><i class="f ${m[2]<m[1]?'lo':''}" style="height:${m[2]/90*100}%"></i></div><b>${String(m[2]||'—').replace('.',',')}</b><small>${m[0]} · план ${m[1]}</small></div>`).join('')}</div><div class="legend"><span><i style="background:var(--card3)"></i>план</span><span><i style="background:var(--acc)"></i>факт</span><span><i style="background:var(--warn)"></i>ниже плана</span></div></div>
 <div class="g2"><div class="pan"><h3>Направления</h3><div class="tw"><table class="t"><thead><tr><th>Направление</th><th class="r">Выиграно</th><th class="r">Проиграно</th><th class="r">Win rate</th><th class="r">Выручка</th><th class="r">Маржа</th></tr></thead><tbody>${BYDIR.map(b=>`<tr><td>${dirTag(b.d)}</td><td class="r">${b.won}</td><td class="r">${b.lost}</td><td class="r">${pct(b.won,b.won+b.lost)}%</td><td class="r">${mln(b.rev)}</td><td class="r">${b.mg}%</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Формат отбора</h3><div class="tw"><table class="t"><thead><tr><th>Формат</th><th class="r">Сделок</th><th class="r">Выиграно</th><th class="r">Конверсия</th></tr></thead><tbody>${BYTEN.map(b=>`<tr><td>${TENDER[b.k]}</td><td class="r">${b.n}</td><td class="r">${b.won}</td><td class="r">${pct(b.won,b.n)}%</td></tr>`).join('')}</tbody></table></div>
  <h3 style="margin-top:12px">Почему проигрываем</h3><div class="kv"><span>Цена</span><b>5</b></div><div class="kv"><span>Перенос или отмена мероприятия</span><b>3</b></div><div class="kv"><span>Выбрали агентство клиента</span><b>1</b></div></div></div>
 ${said('«Нам нужно понимать конверсию, сколько проектов в работе, сколько подтверждены, но не подписаны — хороший задел… план-факт… сколько проектов мы потеряли или реализовали в направлении маркетинг, HR, B2G»')}`;
};
SC.sources=()=>`<div class="hd"><div><h2>Источники и путь клиента</h2><p>Источник записывается в момент заявки: UTM сайта, номер WhatsApp, кнопка 2ГИС, Direct. Дальше система ведёт его до выручки — видно, какой канал приносит деньги, а не просто заявки.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Источник</th><th>Путь клиента</th><th class="r">Заявок</th><th class="r">Сделок</th><th class="r">Конверсия</th><th class="r">Выручка</th><th class="r">Выручка на заявку</th></tr></thead><tbody>
 ${SOURCES.map(s=>`<tr><td><b>${esc(SRC[s.k])}</b></td><td class="mini">${esc(s.path)}</td><td class="r">${s.leads}</td><td class="r">${s.deals}</td><td class="r">${pct(s.deals,s.leads)}%</td><td class="r">${mln(s.rev)}</td><td class="r"><b>${mln(s.rev/s.leads)}</b></td></tr>`).join('')}
 </tbody></table></div>
 <div class="note"><b>Расход на рекламу</b><p>Если вносить бюджет Google Ads и Instagram по месяцам, рядом появится цена заявки и окупаемость канала.</p></div>
 ${said('«Запрос пришёл с сайта. На сайт человек попал через Google-рекламу, или через наш Instagram, или через 2ГИС, или по рекомендации… путь клиента нам тоже важно понимать»')}`;
SC.managers=()=>`<div class="hd"><div><h2>План-факт менеджеров · IV квартал</h2><p>План у каждого менеджера, факт — по подписанным договорам. Рядом — конверсия и средний чек: видно, кому помочь со сделками, а кому — с новыми заявками.</p></div></div>
 ${MGRS.map(m=>`<div class="pan mg"><div class="mgh">${av(m.k)}<div><b>${esc(TEAM[m.k].f)}</b><span>${esc(TEAM[m.k].r)}</span></div><strong>${pct(m.fact,m.plan)}%</strong></div><div class="bar big"><i style="--w:${Math.min(100,pct(m.fact,m.plan))}%"></i></div>
  <div class="mgk"><div><small>План</small><b>${mln(m.plan)}</b></div><div><small>Факт</small><b>${mln(m.fact)}</b></div><div><small>Сделок в работе</small><b>${m.deals}</b></div><div><small>Выиграно</small><b>${m.won}</b></div><div><small>Конверсия</small><b>${m.conv}%</b></div><div><small>Средний чек</small><b>${mln(m.avg)}</b></div></div></div>`).join('')}`;

/* ===== Компания ===== */
SC.kb=()=>`<div class="hd"><div><h2>База знаний и онбординг</h2><p>Всё, что сейчас живёт в головах и чатах: как мы продаём, шаблоны, регламенты реализации и склада. Новичок открывает одну страницу и проходит чек-лист первой недели.</p></div><div class="btns"><button class="bt p" onclick="act('kbnew')">+ Статья</button></div></div>
 <div class="g21"><div class="kbg">${KB.map(s=>`<div class="pan"><h3>${esc(s.s)}</h3>${s.items.map(x=>`<a class="kbi" onclick="act('kbopen')">${esc(x)}</a>`).join('')}</div>`).join('')}</div>
 <div class="pan"><h3>Онбординг новичка · первая неделя</h3><p>Камила, ивент-ассистент · вышла 28.09</p><div class="bar"><i class="g" style="--w:${pct(ONB.filter(o=>o[1]).length,ONB.length)}%"></i></div><p class="mini">${ONB.filter(o=>o[1]).length} из ${ONB.length}</p>
  ${ONB.map((o,i)=>`<div class="tk ${o[1]?'done':''}"><span class="bx ${o[1]?'on':''}" onclick="ONB[${i}][1]=!ONB[${i}][1];render()">${o[1]?'✓':''}</span><div><b>${esc(o[0])}</b></div></div>`).join('')}</div></div>
 ${said('«Онбординг людей, когда джун приходит, и в одном месте собрано всё, что ему нужно знать сразу»')}`;
SC.roles=()=>{
 const areas=[['Входящие и воронка',['IN','DS','AB']],['Сметы и маржа',['IN','DS','AB']],['Креатив',['IN','DS','AB','AS']],['Проекты и задачи',['IN','MK','AS','RT']],['Бюджеты и оплаты',['IN','RT','AG']],['Реквизит',['IN','DS','AB','RT','SE']],['Аналитика',['IN','DS']],['База знаний',['IN','DS','AB','MK','AS','RT','SE','AG']]];
 const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и структура</h2><p>У каждого руководителя — свой контур. Руководитель продаж не видит задачи реализации, проджект — переписку отдела продаж, бухгалтерия — только документы и оплаты. Права меняет операционный директор.</p></div></div>
 <div class="org">${[['IN',[]],['DS',['AB','TM']],['MK',[]],['AS',['ZH','OL']],['RT',['EK','KA']],['SE',['DA','NU']],['AG',[]]].map(([h,s],i)=>`<div class="onode ${i===0?'top':''}"><div class="oh">${av(h)}<b>${esc(TEAM[h].f)}</b><span>${esc(TEAM[h].r)}</span></div>${s.map(k=>`<div class="os">${av(k)} ${esc(TEAM[k].f)}<span>${esc(TEAM[k].r)}</span></div>`).join('')}</div>`).join('')}</div>
 <div class="pan"><h3>Кто что видит</h3><div class="tw"><table class="t mx"><thead><tr><th>Раздел</th>${R.map(([k,v])=>`<th class="c">${esc(v.av)}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>
 ${areas.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1].includes(v.p)?'<b class="pos">●</b>':'<span class="mini">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
 ${said('«Руководителю отдела реализации вовсе не обязательно быть в курсе задач отдела продаж»')}`;
};
SC.mobile=()=>`<div class="hd"><div><h2>Мобильная версия</h2><p>Та же система в браузере телефона, ярлык на рабочий стол. Менеджер отвечает клиенту, проджект ведёт тайминг на площадке, склад выдаёт реквизит с фото.</p></div></div>
 <div class="phones">
  <div class="phone"><div class="pht"><b>Алина · сделки</b><small>сегодня 4 задачи</small></div><div class="pb">${DEALS.filter(d=>d.mgr==='AB'&&!['lost','won'].includes(d.st)).slice(0,4).map(d=>`<div class="pi"><span>${esc(CL(d.cl).n)}<small>${STGOF(d.st).n}</small></span><b>${d.sum?mln(d.sum):'—'}</b></div>`).join('')}<div class="pbtn" onclick="act('wa')">Ответить в WhatsApp</div></div></div>
  <div class="phone"><div class="pht"><b>Руслан · тайминг 18.10</b><small>караван-сарай · сейчас ${ROS[rosNow]?ROS[rosNow].t:'—'}</small></div><div class="pb">${ROS.slice(4,9).map(r=>`<div class="pi"><span>${r.t} · ${esc(r.n.slice(0,34))}…</span><b>${r.done?'✓':''}</b></div>`).join('')}<div class="pbtn" onclick="shiftRos(${rosNow<0?0:rosNow},15)">Сдвинуть на +15 мин</div></div></div>
  <div class="phone"><div class="pht"><b>Серик · склад</b><small>выдача 09.10 · Qazaq Retail</small></div><div class="pb">${ISSUES.filter(x=>x.st==='plan').map(x=>`<div class="pi"><span>${esc(RP(x.p).n)}</span><b>${x.q} шт</b></div>`).join('')}<div class="pi"><span>Фото состояния</span><b>2 из 2</b></div><div class="pbtn" onclick="act('issue')">Выдать Даурену</div></div></div>
 </div>`;
SC.integr=()=>`<div class="hd"><div><h2>Каналы и интеграции</h2><p>Что подключаем в стандартном пакете и что — по желанию. Телефонию оставляем вашу: звонок из карточки и запись разговора в истории.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Канал</th><th>Как работает</th><th>Статус</th></tr></thead><tbody>
 ${[['WhatsApp рабочего номера','Заявки и переписка в карточке, клиентские группы проектов. Провайдер — около 5 000 ₸ в месяц за номер','в пакете'],['Почта','Письма с заявками и вложениями падают во входящие и в карточку сделки','в пакете'],['Ваша телефония','Звонок из карточки, запись разговора и пропущенные — во входящих','в пакете'],['Форма сайта и UTM','Источник и рекламная кампания записываются в сделку','в пакете'],['Instagram Direct','Сообщения во входящих с источником Instagram','в пакете'],['2ГИС','Звонки с кнопки 2ГИС помечаются источником','в пакете'],['ЭЦП НУЦ РК · NCALayer','Подписание договоров и актов, клиент подписывает по ссылке','в пакете'],['Telegram-уведомления','Задачи, брони, отчёт в 09:00 — каждому свой','в пакете'],['Adesk','Передача проектов и оплат по API','по желанию'],['1С бухгалтерии на аутсорсе','Выгрузка счетов и актов для бухгалтера','по желанию']].map(x=>`<tr><td><b>${x[0]}</b></td><td>${x[1]}</td><td><span class="tag ${x[2]==='в пакете'?'g':'w'}">${x[2]}</span></td></tr>`).join('')}
 </tbody></table></div>`;
SC.migrate=()=>`<div class="hd"><div><h2>Переезд с amoCRM</h2><p>Лицензия amoCRM заканчивается в конце октября. Ядро — входящие, воронка, карточка сделки, сметы, документы — поднимаем за две недели, и продажи переходят сюда до конца лицензии. Остальное шлифуем параллельно.</p></div></div>
 <div class="tl big">${[['01.10','Показ демо','Тест-драйв: всё кликается, роли переключаются',1],['после 10%','Старт','Выгрузка контактов и компаний из amoCRM, ваш файл этапов и аналитики',0],['+2 недели','Ядро в работе','Входящие, воронка с вашими этапами, сделка, сметы, документы — продажи переходят из amoCRM',0],['+3–4 недели','Проекты и реквизит','Портфель, задачи, тайминг, чаты, склад реквизита, бронь и ревизия',0],['+4–6 недель','Аналитика и база знаний','Конверсия, задел, план-факт, источники, LTV, онбординг — приёмка',0]].map(x=>`<div class="tli ${x[3]?'ok':'on'}"><span class="who">${x[0]}</span><b>${x[1]}</b><p>${x[2]}</p></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Что переносим из amoCRM</h3><div class="li"><i>✓</i><span>Контакты и компании с телефонами и почтой</span></div><div class="li"><i>✓</i><span>Открытые сделки — с этапом по вашей новой воронке</span></div><div class="li no"><i>—</i><span>Старые закрытые сделки — по желанию, архивом</span></div></div>
  <div class="pan"><h3>Что нужно от вас</h3><div class="li n"><i>1</i><span>Файл с описанием этапов воронки</span></div><div class="li n"><i>2</i><span>Файл с аналитикой, которую вы уже продумали</span></div><div class="li n"><i>3</i><span>Выгрузка из amoCRM (Excel)</span></div><div class="li n"><i>4</i><span>Шаблоны договора, счёта, акта</span></div></div></div>
 ${said('«Немножко смущает тот момент, что у нас заканчивается лицензия на amo… успеть внедрить свою собственную систему, переехать в неё и отказаться»','Ирина ответила: через две недели подключаетесь с воронкой продаж, остальное — параллельно.')}`;

/* ===== Карточки и формы ===== */
const CARD={};
CARD.cl=id=>{const c=CL(id);const D=DEALS.filter(d=>d.cl===id),P=PROJECTS.filter(p=>p.cl===id);
 return [esc(c.n),`${esc(c.ind)} · ${esc(c.city)} · клиент с ${c.since}`,`<div class="g2"><div class="pan"><h3>Клиент</h3>${[['Контакт',esc(c.contact)],['Откуда пришёл',esc(SRC[c.src]||'—')],['Направления',c.dirs.map(dirTag).join(' ')],['Проектов',c.projects],['LTV',c.ltv?tg(c.ltv):'—'],['Последний проект',c.last==='—'?'—':dl(c.last)]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
  <div class="pan"><h3>Сделки и проекты</h3>${D.map(d=>`<div class="kv"><span>${dealL(d.id)}</span><b>${stTag(d.st)}</b></div>`).join('')}${P.map(p=>`<div class="kv"><span>${projL(p.id)}</span><b>${pstTag(p.st)}</b></div>`).join('')||(D.length?'':'<p class="mini">Пока нет.</p>')}</div></div>`]};
CARD.newdeal=()=>['Новая сделка','Источник и направление — обязательны: из них строится аналитика',`<div class="form">
  <label>Клиент<select id="nd_c">${CLIENTS.map(c=>`<option value="${c.id}">${esc(c.n)}</option>`).join('')}</select></label>
  <label>Название<input id="nd_t" value="Корпоративный вечер"></label>
  <label>Направление<select id="nd_d">${Object.entries(DIRS).map(([k,v])=>`<option value="${k}">${v.n}</option>`).join('')}</select></label>
  <label>Формат отбора<select id="nd_ten">${Object.entries(TENDER).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
  <label>Источник<select id="nd_s">${Object.entries(SRC).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
  <label>Менеджер<select id="nd_m"><option value="AB">Алина</option><option value="TM">Тимур</option><option value="DS">Дана</option></select></label>
  <label>Дата мероприятия<input id="nd_dt" type="date" value="2026-12-12"></label>
  <label>Ориентир бюджета, ₸<input id="nd_sum" value="15000000"></label>
 </div><button class="bt p" onclick="saveDeal()">Создать сделку</button>`];
function saveDeal(){const v=id=>document.getElementById(id).value;const id='D'+(DEALS.length+1);DEALS.unshift({id,cl:v('nd_c'),t:v('nd_t')||'Новая сделка',dir:v('nd_d'),ten:v('nd_ten'),src:v('nd_s'),mgr:v('nd_m'),st:'new',sum:+v('nd_sum')||0,mg:0,date:v('nd_dt'),guests:0,cr:false,days:0,next:'Первый контакт',city:'—'});closeM();curDeal=id;dealTab='over';go('deal');toast('Сделка создана в «Новой заявке» — ответственный получил уведомление.')}
CARD.task=ref=>['Новая задача',`к ${esc(ref)}`,`<div class="form"><label>Задача<input id="nt_t" value="Согласовать с клиентом меню"></label><label>Ответственный<select id="nt_w">${Object.entries(TEAM).map(([k,v])=>`<option value="${k}">${esc(v.f)} · ${esc(v.r)}</option>`).join('')}</select></label><label>Срок<input id="nt_d" type="date" value="${addDays(TODAY,3)}"></label><label>Важность<select id="nt_p"><option value="high">Срочно</option><option value="mid" selected>Обычная</option><option value="low">Низкая</option></select></label></div><button class="bt p" onclick="saveTask('${ref}')">Поставить задачу</button>`];
function saveTask(ref){const v=id=>document.getElementById(id).value;TASKS.push({id:'T'+(TASKS.length+1),ref,t:v('nt_t')||'Задача',who:v('nt_w'),due:v('nt_d'),st:'todo',pr:v('nt_p')});closeM();render();toast(`Задача поставлена: ${who(v('nt_w'))} увидит её в «Моих задачах» и в Telegram.`)}
CARD.lost=id=>['Сделка проиграна','Причина обязательна — из неё строится аналитика потерь',`<div class="form"><label>Причина<select id="lr">${['Цена','Перенос или отмена мероприятия','Выбрали агентство клиента','Не успеваем по срокам','Другое'].map(x=>`<option>${x}</option>`).join('')}</select></label><label>Комментарий<input id="lc" value=""></label></div><button class="bt" onclick="const d=DL('${id}');d.st='lost';d.lost=document.getElementById('lr').value;closeM();go('pipeline');toast('Сделка закрыта как проигранная — причина в аналитике.')">Закрыть сделку</button>`];
CARD.kp=id=>{const d=DL(id),t=estTotal(id),e=EST[id];return ['Коммерческое предложение',`${esc(CL(d.cl).n)} · смета v${e.ver}`,`<div class="doc"><div class="dh"><div class="dlg">КУЛИСА<small>EVENT-АГЕНТСТВО</small></div><div style="text-align:right;font-size:10px">КП № ${id}-v${e.ver}<br>${dl(TODAY)}</div></div>
 <h4>${esc(d.t)}</h4><p style="font-size:11px;color:#6b6560;margin:0 0 10px">${esc(CL(d.cl).n)} · ${d.date?dl(d.date):''} · ${d.guests} гостей</p>
 <div class="drow h"><span>№</span><span>Статья</span><span class="r">Кол-во</span><span class="r">Сумма, ₸</span></div>
 ${e.lines.map((l,i)=>`<div class="drow"><span>${i+1}</span><span>${esc(l.n)}</span><span class="r">${l.q} ${esc(l.u)}</span><span class="r">${fmt(l.q*l.price)}</span></div>`).join('')}
 <div class="drow"><span></span><span>Агентская комиссия ${e.comm}%</span><span></span><span class="r">${fmt(t.comm)}</span></div>
 <div class="dsum"><span>Итого</span><span>${tg(t.client)}</span></div><div class="dfoot"><span>Себестоимость и маржа в КП не попадают — клиент видит только свои цены.</span></div></div>
 <div class="btns" style="margin-top:12px"><button class="bt p" onclick="closeM();toast('КП и презентация отправлены клиенту в WhatsApp и на почту, версия зафиксирована в истории.')">Отправить клиенту</button></div>`]};
CARD.vers=()=>{const e=EST[curEst];return ['Сравнение версий сметы',esc(DL(curEst).t),`<div class="tw"><table class="t"><thead><tr><th>Версия</th><th>Дата</th><th>Что изменили</th><th class="r">Итого клиенту</th></tr></thead><tbody>${e.vers.map(v=>`<tr><td>v${v.v}</td><td>${dd(v.d)}</td><td>${esc(v.note)}</td><td class="r">${tg(v.sum||estTotal(curEst).client)}</td></tr>`).join('')}</tbody></table></div>`]};
CARD.crnew=()=>['Задача креативу','Попадёт в очередь Аскара',`<div class="form"><label>Сделка<select id="cr_d">${DEALS.filter(d=>!['lost','won'].includes(d.st)).map(d=>`<option value="${d.id}">${esc(CL(d.cl).n)} · ${esc(d.t)}</option>`).join('')}</select></label><label>Что нужно<input id="cr_t" value="Концепция и мудборд"></label><label>Срок<input id="cr_due" type="date" value="${addDays(TODAY,4)}"></label></div><button class="bt p" onclick="CREATIVE.push({id:'CR'+(CREATIVE.length+1),deal:document.getElementById('cr_d').value,t:document.getElementById('cr_t').value,who:'AS',st:'queue',due:document.getElementById('cr_due').value,kind:'Концепция',ver:0});closeM();render();toast('Задача в очереди креативной группы.')">Отправить в креатив</button>`];
CARD.book=()=>['Бронь реквизита','Система проверит, хватит ли исправного реквизита на каждый день',`<div class="form"><label>Позиция<select id="bk_p">${PROPS.map(p=>`<option value="${p.id}">${esc(p.n)} · исправно ${p.ok}</option>`).join('')}</select></label><label>Количество<input id="bk_q" value="4"></label><label>С<input id="bk_f" type="date" value="2026-10-17"></label><label>По<input id="bk_t" type="date" value="2026-10-17"></label>
 <label>Под что<select id="bk_r">${[...PROJECTS.filter(p=>p.st!=='done').map(p=>[p.id,'Проект · '+CL(p.cl).n]),...DEALS.filter(d=>!['lost','won'].includes(d.st)).map(d=>[d.id,'Сделка · '+CL(d.cl).n+' (предварительно)'])].map(x=>`<option value="${x[0]}">${esc(x[1])}</option>`).join('')}</select></label></div><div id="bk_res"></div><button class="bt p" onclick="bookProp()">Забронировать</button>`];
CARD.prop=id=>{const p=RP(id);return [esc(p.n),`${esc(p.cat)} · ячейка ${esc(p.cell)} · оценка ${tg(p.val)} за шт`,`<div class="g2"><div class="pan"><h3>Состояние</h3><div class="kv"><span>Всего</span><b>${p.tot}</b></div><div class="kv"><span>Исправно</span><b>${p.ok}</b></div><div class="kv"><span>В ремонте или списано</span><b>${p.broken}</b></div></div>
 <div class="pan"><h3>Брони</h3>${BOOK.filter(b=>b.p===id).map(b=>`<div class="kv"><span>${dd(b.from)}${b.to!==b.from?'–'+dd(b.to):''} · ${who(b.by)} · ${refL(b.ref)}</span><b>${b.q} шт</b></div>`).join('')||'<p class="mini">Нет броней.</p>'}</div></div>
 <div class="pan"><h3>История</h3>${REVLOG.filter(r=>r.p===id).map(r=>`<div class="kv"><span>${dd(r.d)} · ревизия · ${esc(r.why)}</span><b>${r.was} → ${r.now}</b></div>`).join('')}${ISSUES.filter(x=>x.p===id).map(x=>`<div class="kv"><span>${dd(x.d)} · ${esc(x.kind)} · ${refL(x.ref)}</span><b>${x.q} шт</b></div>`).join('')||''}</div>`]};
CARD.newdoc=ref=>['Новый документ','Формируется из реквизитов клиента и сметы',`<div class="form"><label>Тип<select id="dc_k"><option>Договор</option><option>Счёт на аванс</option><option>Акт выполненных работ</option></select></label><label>Как подписываем<select id="dc_m"><option>ЭЦП</option><option>Бумага</option></select></label></div><button class="bt p" onclick="const d=DL('${ref}')||PR('${ref}');DOCS.unshift({id:'DC'+(DOCS.length+1),k:document.getElementById('dc_k').value,ref:'${ref}',no:'EV-2026/0'+(43+DOCS.length),sum:d?d.sum:0,mode:document.getElementById('dc_m').value,st:'draft',d:TODAY});closeM();go('docs');toast('Документ сформирован из шаблона — проверьте и подпишите.')">Сформировать</button>`];
CARD.docv=id=>{const x=DOCS.find(d=>d.id===id);return [esc(x.k+' '+x.no),DOCST[x.st][0],`<div class="doc"><div class="dh"><div class="dlg">КУЛИСА<small>ДОКУМЕНТ</small></div><div style="text-align:right;font-size:10px">${esc(x.no)}<br>${dl(x.d)}</div></div><h4>${esc(x.k)}</h4><p style="font-size:11px">${refL(x.ref)}</p><div class="dsum"><span>Сумма</span><span>${tg(x.sum)}</span></div><div class="dfoot"><span>${x.mode==='ЭЦП'?'Подписи ЭЦП: агентство ✓ · клиент ✓ · QR-код проверки':'Скан бумажного оригинала с подписями и печатями'}</span></div></div>`]};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}

function act(k){const M={
 weekly:'Еженедельный отчёт собран: заявки, конверсия, задел, проекты недели — уходит вам в Telegram по пятницам.',
 distrib:'Распределение заявок: по очереди между Алиной и Тимуром, постоянные клиенты — своему менеджеру, B2G — Дане.',
 spam:'Отмечено «не заявка» — в аналитику источников не попадает.',
 brieflink:'Ссылка на бриф отправлена клиенту: ответы сами попадут в карточку сделки.',
 wa:'Сообщение отправлено с рабочего номера WhatsApp и сохранено в истории сделки.',
 export:'Выгрузка в Excel готова.',
 rosprint:'Тайминг в PDF для подрядчиков — с зонами и ответственными, без внутренних заметок.',
 contr:'Новый подрядчик: категория, город, условия, контакты. Рейтинг появится после первого проекта.',
 contrcard:'Карточка подрядчика: договоры, проекты, оценки проджектов и заметки.',
 kbnew:'Новая статья базы знаний: текст, файлы, видео, кому показывать.',
 kbopen:'Статья открыта. Новичок отмечает «прочитал» — это видно в онбординге.',
 issue:'Выдача проведена: фото состояния, подпись получателя, реквизит числится за проектом до возврата.'
};toast(M[k]||'Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();
 const d=DEALS.find(x=>(x.t+' '+CL(x.cl).n).toLowerCase().includes(q));if(d){openDeal(d.id);toast('Найдена сделка: '+esc(d.t));return}
 const p=PROJECTS.find(x=>(x.t+' '+CL(x.cl).n).toLowerCase().includes(q));if(p){openProj(p.id);toast('Найден проект: '+esc(p.t));return}
 const r=PROPS.find(x=>x.n.toLowerCase().includes(q));if(r){go('props');card('prop',r.id);return}
 const c=CLIENTS.find(x=>x.n.toLowerCase().includes(q));if(c){card('cl',c.id);return}
 toast('Ничего не найдено: попробуйте «Nomad», «указатель», «форум».')}

/* ===== Каркас ===== */
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Операционный директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}. Показаны разделы этой роли.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
const CNT={inbox:()=>INBOX.filter(i=>i.st==='new').length,pipeline:()=>DEALS.filter(d=>!['lost','won'].includes(d.st)).length,projects:()=>PROJECTS.filter(p=>p.st!=='done').length,tasks:()=>TASKS.filter(t=>t.st!=='done'&&t.due<=TODAY).length,propcal:()=>{let n=0;PROPS.forEach(p=>{for(let i=0;i<31;i++){if(bookedOn(p.id,addDays('2026-10-05',i))>p.ok){n++;break}}});return n},docs:()=>DOCS.filter(d=>['draft','our'].includes(d.st)).length};
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<div class="grp"><h5>${esc(s.n)}</h5>${s.sub.filter(x=>allowed(x[0])).map(x=>{const c=CNT[x[0]]?CNT[x[0]]():0;return `<a class="nv ${x[0]===cur?'on':''} ${['tasks','propcal'].includes(x[0])&&c?'hot':''}" onclick="go('${x[0]}')"><span>${esc(x[1])}</span>${c?`<em>${c}</em>`:''}</a>`}).join('')}</div>`).join('')}
function buildSub(){const me=myKey();const T=TASKS.filter(t=>t.who===me&&t.st!=='done').sort((a,b)=>a.due<b.due?-1:1);const ev=PROJECTS.filter(p=>p.from>=TODAY).sort((a,b)=>a.from<b.from?-1:1).slice(0,3);
 document.getElementById('sub').innerHTML=`<div class="ag"><div class="agh"><small>Сегодня</small><b>${dayOf(TODAY)}, ${dlong(TODAY)}</b><span>${esc(ROLES[role].n)} · ${esc(role)}</span></div>
 <h6>Мои задачи</h6>${T.length?T.slice(0,5).map(t=>`<div class="agt ${t.due<TODAY?'late':''}" onclick="toggleTask('${t.id}')"><i></i><div><b>${esc(t.t)}</b><span>до ${dd(t.due)} · ${t.ref[0]==='P'?esc(CL(PR(t.ref).cl).n):DL(t.ref)?esc(CL(DL(t.ref).cl).n):''}</span></div></div>`).join(''):`<p class="agn">${me==='IN'?'Личных задач нет. Просрочено у команды: '+TASKS.filter(t=>t.st!=='done'&&t.due<TODAY).length:'На сегодня пусто.'}</p>`}
 <h6>Ближайшие мероприятия</h6>${ev.map(p=>`<div class="age" onclick="${allowed('project')?`openProj('${p.id}')`:''}"><b>${p.from.slice(8)}.${p.from.slice(5,7)}</b><div><span>${esc(CL(p.cl).n)}</span><small>${esc(p.t.slice(0,48))}${p.t.length>48?'…':''}</small></div></div>`).join('')}
 <h6>Сегодня в 16:00</h6><div class="agx">Созвон с Nomad Telecom: списки пассажиров чартера и рассадка гала-ужина.</div></div>`}
function build(){buildRail();buildSub();render()}
const WIDE=['pipeline','estimate','propcal','creative','projects'];let agOff=false,agWide=false;
function toggleAg(){if(WIDE.includes(cur))agWide=!agWide;else agOff=!agOff;render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('app').classList.toggle('noag',WIDE.includes(cur)?!agWide:agOff);document.getElementById('ttl').textContent=SUBN[cur]||'Кулиса';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('pipeline')?'':'none';try{history.replaceState(null,'','?s='+cur+(cur==='deal'?'&d='+curDeal:cur==='project'?'&p='+curProj:''))}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

/* ===== Сценарий показа ===== */
const TOUR=[
 ['dash','1 · Пульт: весь путь агентства — входящие, продажи, задел, реализация, закрытие. Справа — ваш день: задачи и ближайшие мероприятия.'],
 ['inbox','2 · Входящие: WhatsApp, почта, сайт, звонки, Instagram, 2ГИС — в одной ленте. Из сообщения — сделка с источником в один клик.'],
 ['pipeline','3 · Воронка с вашими этапами: бриф, просчёт, креатив, КП, защита, ждём ответ, подтверждён, договор. Фильтр по направлениям: маркетинг, HR, B2G.'],
 ['deal','4 · Карточка сделки: бриф, сметы, креатив, переписка, документы и история — от первого сообщения. Ничего не уходит в личные телефоны.'],
 ['estimate','5 · Смета без прайса: любые статьи от руки, себестоимость и цена клиенту, комиссия и маржа сразу. Каждая версия сохраняется.'],
 ['creative','6 · Креатив отдельным треком: подключается креатор или нет, концепция, презентация, версии до защиты.'],
 ['tenders','7 · Тендер, условный тендер, без тендера — у каждой сделки, с документами и дедлайном.'],
 ['docs','8 · Договор, счёт, акт: электронно с ЭЦП или на бумаге — как попросит клиент.'],
 ['projects','9 · После аванса сделка сама становится проектом. Портфель с календарём агентства вместо Excel.'],
 ['project','10 · Карточка проекта: задачи с ответственными, бюджет план-факт, рабочая и клиентская группы, реквизит.'],
 ['chats','11 · Две группы на проект: внутренняя — только команда, клиентская — WhatsApp-группа рабочего номера.'],
 ['ros','12 · Тайминг дня: поминутно, с зонами и ответственными. Сдвиг на 15 минут — вся команда видит сразу.'],
 ['propcal','13 · Реквизит: брони по датам, конфликт подсвечен — два менеджера больше не возьмут одни указатели.'],
 ['revision','14 · Ревизия: было 10 указателей, стало 7 — и все брони считают от семи.'],
 ['analytics','15 · Конверсия, задел, план-факт, направления и форматы отбора, причины потерь.'],
 ['sources','16 · Путь клиента: Google Ads, Instagram, 2ГИС, рекомендации — до выручки.'],
 ['roles','17 · У каждого руководителя свой контур: продажи не видят задачи реализации.'],
 ['kb','18 · База знаний и онбординг: новичок открывает одну страницу.'],
 ['migrate','19 · Переезд с amoCRM: ядро за две недели, до конца лицензии.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Дальше — сами: всё кликается, роли переключаются справа вверху.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;if(k==='deal'){curDeal='D2';dealTab='over'}if(k==='project')curProj='P1';if(k==='estimate')curEst='D2';build();toast(m);setTimeout(step,ti===0?6500:7400)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='',d='',p='';try{const u=new URLSearchParams(location.search);q=u.get('s')||'';d=u.get('d')||'';p=u.get('p')||''}catch(e){}if(d&&DL(d))curDeal=d;if(p&&PR(p))curProj=p;
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
