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
