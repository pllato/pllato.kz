/* КАМЕРТОН — система для ЛОР-клиники и центра слуха: запись и расписание врачей, карта пациента, аудиограммы и слуховые аппараты, отдел заботы с планами лечения и напоминаниями, кабинет пациента по ссылке, воронка продаж, разбор звонков, найм и тренажёр, трансфер пациентов, дашборд главврача, приказы с подписью, отчёты вместо Excel, филиалы. Все имена, диагнозы и суммы вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/100000)/10).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const dd=s=>{const [y,m,d]=s.split('-');return d+'.'+m};
const dl=s=>{const [y,m,d]=s.split('-');return d+'.'+m+'.'+y};
const TODAY='2026-10-01',NOW='11:40';
const addDays=(s,n)=>new Date(new Date(s+'T00:00:00').getTime()+n*864e5).toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
const dow=s=>['вс','пн','вт','ср','чт','пт','сб'][new Date(s+'T00:00:00').getDay()];

const SEC=[
 {k:'day',n:'Сегодня',sub:[['today','Пульт клиники'],['schedule','Расписание врачей'],['transfer','Трансфер пациентов']]},
 {k:'pat',n:'Пациенты',sub:[['patients','База пациентов'],['card','Карта пациента'],['hearing','Слух и аппараты']]},
 {k:'care',n:'Забота',sub:[['carefunnel','Отдел заботы'],['plans','Планы лечения'],['remind','Напоминания'],['chronic','Хронические · контроль'],['feedback','Отзывы и NPS'],['cabinet','Кабинет пациента']]},
 {k:'sales',n:'Продажи',sub:[['funnel','Воронка новых'],['calls','Звонки и разбор'],['trainer','Найм и тренажёр'],['price','Прайс и абонементы'],['marketing','Маркетинг']]},
 {k:'mgmt',n:'Управление',sub:[['dash','Дашборд руководителя'],['money','Касса и оплаты'],['docs','Приказы и подписи'],['reports','Отчёты']]},
 {k:'sys',n:'Система',sub:[['growth','Филиалы и развитие'],['roles','Роли и права'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));

const ROLES={
 'Руководитель':{av:'АК',p:'AK',n:'Акмарал',note:'Вся клиника: отделения, забота, продажи, деньги, приказы, дашборд',s:ALL.slice()},
 'Главный врач':{av:'ГВ',p:'GV',n:'Ерлан Байжанов',note:'Врачи и расписание, карты и планы лечения, качество, приказы и отчёты',s:['today','schedule','patients','card','hearing','plans','chronic','feedback','dash','docs','reports','roles']},
 'Врач-ЛОР':{av:'ДС',p:'DS',n:'Даурен Сейткали',doc:'D1',note:'Свой приём: карта, назначения, план лечения — забота подхватит сама',s:['schedule','patients','card','plans','docs']},
 'Сурдолог':{av:'ЕК',p:'EK',n:'Елена Ким',doc:'D3',note:'Аудиограммы, подбор и настройка аппаратов, пробное ношение',s:['schedule','patients','card','hearing','plans','docs']},
 'Администратор':{av:'ДН',p:'DN',n:'Дана',note:'Запись, приход пациентов, трансфер, оплата, новые обращения',s:['today','schedule','transfer','patients','card','funnel','money','price']},
 'Отдел заботы':{av:'ГМ',p:'GM',n:'Гульмира',note:'Действующие пациенты: курсы, напоминания, контроль, повторные визиты, отзывы',s:['carefunnel','plans','remind','chronic','feedback','cabinet','patients','card']},
 'Менеджер продаж':{av:'АБ',p:'AB',n:'Алибек',note:'Новые обращения, звонки, запись, аппараты и абонементы',s:['funnel','calls','trainer','price','marketing','patients']},
 'Водитель':{av:'СК',p:'SK',n:'Серик · трансфер',note:'Свои поездки за пациентами в телефоне',s:['transfer']}
};
let role='Руководитель',cur='today',theme='light';
const STAFF={AK:'Акмарал',GV:'Ерлан Байжанов',DS:'Даурен Сейткали',EK:'Елена Ким',DN:'Дана',GM:'Гульмира',AB:'Алибек',SK:'Серик',MD:'Мадина',TM:'Тимур'};

/* ===== Отделения и врачи ===== */
const DEPS={
 lor:{n:'ЛОР',c:'#2f6f9e'},
 surd:{n:'Сурдология',c:'#c75b3c'},
 oto:{n:'Отоневрология',c:'#a87a1e'},
 hir:{n:'Хирургия',c:'#8e3a4a'},
 care:{n:'Отдел заботы',c:'#4b8468'}
};
const DOCS=[
 {id:'D1',n:'Сейткали Даурен Маратович',s:'Сейткали Д. М.',dep:'lor',room:'каб. 1',sp:'врач-оториноларинголог'},
 {id:'D2',n:'Ахметова Жанар Ериковна',s:'Ахметова Ж. Е.',dep:'lor',room:'каб. 2',sp:'врач-оториноларинголог'},
 {id:'D3',n:'Ким Елена Викторовна',s:'Ким Е. В.',dep:'surd',room:'каб. 3',sp:'врач-сурдолог'},
 {id:'D4',n:'Нурпеисов Арман Болатович',s:'Нурпеисов А. Б.',dep:'oto',room:'каб. 4',sp:'врач-отоневролог'},
 {id:'D5',n:'Байжанов Ерлан Сапарович',s:'Байжанов Е. С.',dep:'hir',room:'операционная',sp:'ЛОР-хирург, главный врач'},
 {id:'D6',n:'Смагулова Айгерим',s:'Смагулова А.',dep:'surd',room:'каб. 3б',sp:'сурдоакустик · подбор аппаратов'}
];
const DOC=id=>DOCS.find(d=>d.id===id);

/* ===== Пациенты ===== */
let PATIENTS=[
 {id:'P01',n:'Омаров Кайрат Серикович',age:54,ph:'+7 701 555 14 22',dep:'lor',doc:'D1',dx:'Хронический тонзиллит',icd:'J35.0',stage:'course',src:'2ГИС',since:'2026-09-10',ltv:118000,last:'2026-09-29',next:'2026-10-01',chronic:true,cab:true},
 {id:'P02',n:'Петрова Галина Ивановна',age:71,ph:'+7 777 555 30 61',dep:'surd',doc:'D3',dx:'Нейросенсорная тугоухость II ст., двусторонняя',icd:'H90.3',stage:'control',src:'Сарафан',since:'2026-08-28',ltv:1064000,last:'2026-09-12',next:'2026-10-01',chronic:true,cab:true,transfer:true},
 {id:'P03',n:'Абенов Нурлан Ерикович',age:38,ph:'+7 705 555 82 10',dep:'hir',doc:'D5',dx:'После септопластики 24.09',icd:'J34.2',stage:'course',src:'Instagram',since:'2026-09-02',ltv:468000,last:'2026-09-30',next:'2026-10-07',chronic:false,cab:true},
 {id:'P04',n:'Жумабаева Сауле Кенесовна',age:62,ph:'+7 702 555 47 93',dep:'oto',doc:'D4',dx:'Головокружение, ДППГ',icd:'H81.1',stage:'risk',src:'Сайт',since:'2026-09-18',ltv:52000,last:'2026-09-18',next:'2026-10-09',chronic:false,cab:true,transfer:true},
 {id:'P05',n:'Ли Виктор Андреевич',age:45,ph:'+7 701 555 66 04',dep:'lor',doc:'D2',dx:'Хронический синусит, обострение',icd:'J32.0',stage:'course',src:'2ГИС',since:'2026-09-24',ltv:34000,last:'2026-09-27',next:'2026-10-03',chronic:true,cab:true},
 {id:'P06',n:'Сарсенова Айжан Муратовна',age:33,ph:'+7 747 555 21 58',dep:'lor',doc:'D1',dx:'Острый средний отит',icd:'H66.0',stage:'new',src:'Instagram',since:'2026-10-01',ltv:12000,last:'2026-10-01',next:'2026-10-04',chronic:false,cab:false},
 {id:'P07',n:'Мухамедов Бауыржан Каримович',age:67,ph:'+7 708 555 90 17',dep:'surd',doc:'D6',dx:'Тугоухость III ст. справа · пробное ношение',icd:'H90.4',stage:'trial',src:'Наружная реклама',since:'2026-09-23',ltv:27000,last:'2026-09-26',next:'2026-10-03',chronic:true,cab:true,transfer:true},
 {id:'P08',n:'Иванова Тамара Николаевна',age:74,ph:'+7 777 555 08 39',dep:'surd',doc:'D3',dx:'Тугоухость, аппараты с 2023',icd:'H90.3',stage:'chronic',src:'Сарафан',since:'2023-04-11',ltv:1390000,last:'2025-08-20',next:'',chronic:true,cab:false,transfer:true},
 {id:'P09',n:'Касымов Ерик Сагатович',age:41,ph:'+7 701 555 73 12',dep:'lor',doc:'D2',dx:'Хронический тонзиллит · абонемент',icd:'J35.0',stage:'repeat',src:'Сарафан',since:'2026-06-14',ltv:142000,last:'2026-09-22',next:'2026-10-06',chronic:true,cab:true},
 {id:'P10',n:'Нуриева Динара Талгатовна',age:36,ph:'+7 705 555 19 85',dep:'lor',doc:'D1',dx:'Аллергический ринит, сезонный',icd:'J30.1',stage:'chronic',src:'Сайт',since:'2025-03-02',ltv:61000,last:'2026-04-12',next:'2026-10-15',chronic:true,cab:true},
 {id:'P11',n:'Тлеуов Марат Ерланович',age:58,ph:'+7 702 555 55 40',dep:'oto',doc:'D4',dx:'Шум в ушах, субъективный',icd:'H93.1',stage:'course',src:'2ГИС',since:'2026-09-15',ltv:96000,last:'2026-09-29',next:'2026-10-13',chronic:true,cab:true},
 {id:'P12',n:'Ахметжанова Роза Кайратовна',age:66,ph:'+7 747 555 61 77',dep:'surd',doc:'D6',dx:'Тугоухость II ст. · думает о покупке',icd:'H90.3',stage:'lead',src:'Instagram',since:'2026-09-25',ltv:15000,last:'2026-09-25',next:'',chronic:true,cab:false},
 {id:'P13',n:'Беков Асхат Нурланович',age:49,ph:'+7 701 555 38 26',dep:'hir',doc:'D5',dx:'Искривление перегородки, храп',icd:'J34.2',stage:'booked',src:'Сайт',since:'2026-09-20',ltv:24000,last:'2026-09-28',next:'2026-10-08',chronic:false,cab:true},
 {id:'P14',n:'Оспанова Гульнар Ахметовна',age:52,ph:'+7 777 555 92 03',dep:'lor',doc:'D2',dx:'Евстахиит · курс завершён',icd:'H68.0',stage:'done',src:'2ГИС',since:'2026-09-01',ltv:88000,last:'2026-09-30',next:'2026-12-30',chronic:false,cab:true}
];
const PT=id=>PATIENTS.find(p=>p.id===id);
let curPat='P01';

/* стадии отдела заботы */
const CST=[
 {k:'new',n:'Первый визит',c:'#6b7a8f',d:'Пришёл впервые, план ещё не назначен'},
 {k:'course',n:'Курс идёт',c:'#2f6f9e',d:'Лечение по плану, напоминания каждый день'},
 {k:'trial',n:'Пробное ношение',c:'#c75b3c',d:'Аппарат на 7 дней, звонок на 3-й день'},
 {k:'control',n:'Контроль',c:'#a87a1e',d:'Контрольный визит или настройка'},
 {k:'risk',n:'Риск: пропускает',c:'#b23a3a',d:'Не отмечает выполнение 2 дня и больше'},
 {k:'repeat',n:'Повторный записан',c:'#4b8468',d:'Следующий визит уже в расписании'},
 {k:'chronic',n:'На контроле',c:'#5f6f62',d:'Хронический: плановые визиты раз в 3–12 месяцев'},
 {k:'done',n:'Курс завершён',c:'#3e7d4e',d:'Опрос, отзыв, следующий контроль'}
];
const CSTOF=k=>CST.find(s=>s.k===k)||{k,n:'Новое обращение',c:'#8a8f98',d:'Ещё не пациент — в воронке продаж'};

/* ===== Расписание на сегодня ===== */
let APPTS=[
 {id:'A01',doc:'D1',t:'09:00',dur:30,p:'P01',svc:'Промывка миндалин «Тонзиллор» · 6/10',st:'done'},
 {id:'A02',doc:'D1',t:'09:30',dur:30,p:'P10',svc:'Консультация · сезонный контроль',st:'noshow'},
 {id:'A03',doc:'D1',t:'10:30',dur:30,p:'P06',svc:'Первичная консультация ЛОР',st:'done'},
 {id:'A04',doc:'D1',t:'11:30',dur:30,p:'X1',pn:'Ермеков Д. (новый)',svc:'Первичная консультация ЛОР',st:'in'},
 {id:'A05',doc:'D1',t:'14:00',dur:30,p:'P01',svc:'Промывка миндалин · 7/10',st:'plan'},
 {id:'A06',doc:'D1',t:'16:00',dur:30,p:'X2',pn:'Сагинтаева А.',svc:'Повторная консультация',st:'plan'},
 {id:'A07',doc:'D2',t:'09:00',dur:30,p:'P09',svc:'Абонемент: промывка 4/10',st:'done'},
 {id:'A08',doc:'D2',t:'10:00',dur:30,p:'X3',pn:'Дюсенова Г.',svc:'Первичная консультация ЛОР',st:'done'},
 {id:'A09',doc:'D2',t:'12:00',dur:30,p:'X4',pn:'Абдрахманов С.',svc:'Удаление серной пробки',st:'wait'},
 {id:'A10',doc:'D2',t:'15:00',dur:30,p:'P05',svc:'Промывка пазух «кукушка» · 3/5',st:'plan'},
 {id:'A11',doc:'D3',t:'10:00',dur:60,p:'X5',pn:'Жаксылыков Н. (новый)',svc:'Аудиометрия + консультация сурдолога',st:'done'},
 {id:'A12',doc:'D3',t:'11:30',dur:45,p:'P07',svc:'Пробное ношение: проверка, 3-й день',st:'in'},
 {id:'A13',doc:'D3',t:'14:30',dur:45,p:'P02',svc:'Настройка аппаратов через 2 недели',st:'plan',tr:true},
 {id:'A14',doc:'D3',t:'16:00',dur:60,p:'P12',svc:'Повторный разговор: выбор аппарата',st:'plan'},
 {id:'A15',doc:'D4',t:'10:00',dur:45,p:'X6',pn:'Рахимова Л.',svc:'ВНГ + консультация отоневролога',st:'done'},
 {id:'A16',doc:'D4',t:'12:00',dur:45,p:'P11',svc:'Контроль · шум в ушах',st:'wait'},
 {id:'A17',doc:'D4',t:'15:30',dur:45,p:'X7',pn:'Ким С. (новый)',svc:'Первичная консультация отоневролога',st:'plan'},
 {id:'A18',doc:'D5',t:'09:00',dur:120,p:'X8',pn:'Мусин Т.',svc:'Аденотомия (операция)',st:'done'},
 {id:'A19',doc:'D5',t:'13:00',dur:30,p:'P03',svc:'Осмотр после септопластики (д. 7)',st:'plan',tr:false},
 {id:'A20',doc:'D5',t:'16:30',dur:30,p:'P13',svc:'Предоперационная консультация',st:'plan'},
 {id:'A21',doc:'D6',t:'12:30',dur:60,p:'X9',pn:'Бекмуратова Ж.',svc:'Подбор слухового аппарата',st:'plan',tr:true},
 {id:'A22',doc:'D6',t:'17:00',dur:60,p:'X10',pn:'Ильясов К.',svc:'Настройка · 1 месяц',st:'plan'}
];
const AST={plan:{n:'Записан',c:'#6b7a8f'},wait:{n:'Ждёт в холле',c:'#a87a1e'},in:{n:'На приёме',c:'#2f6f9e'},done:{n:'Принят',c:'#3e7d4e'},noshow:{n:'Не пришёл',c:'#b23a3a'}};
const apN=a=>a.p&&PT(a.p)?PT(a.p).n.split(' ').slice(0,2).join(' '):a.pn;

/* ===== Планы лечения =====
 kind: proc — процедура в клинике, home — дома, visit — контрольный визит, test — исследование */
let PLANS=[
 {id:'L1',p:'P01',doc:'D1',start:'2026-09-17',days:21,goal:'Санировать миндалины, убрать обострения',steps:[
  {t:'Промывка миндалин «Тонзиллор»',kind:'proc',freq:'через день',tot:10,done:6},
  {t:'Полоскание горла раствором',kind:'home',freq:'3 раза в день · 14 дней',tot:14,done:10,miss:1},
  {t:'Спрей для горла',kind:'home',freq:'утро и вечер · 10 дней',tot:10,done:10},
  {t:'Контрольный осмотр ЛОР',kind:'visit',date:'2026-10-09'}]},
 {id:'L2',p:'P03',doc:'D5',start:'2026-09-24',days:14,goal:'Заживление после септопластики без осложнений',steps:[
  {t:'Промывка носа солевым раствором',kind:'home',freq:'3 раза в день · 14 дней',tot:14,done:7},
  {t:'Мазь в носовые ходы',kind:'home',freq:'2 раза в день · 10 дней',tot:10,done:7},
  {t:'Осмотр хирурга — 7-й день',kind:'visit',date:'2026-10-01'},
  {t:'Осмотр хирурга — 14-й день',kind:'visit',date:'2026-10-08'}]},
 {id:'L3',p:'P04',doc:'D4',start:'2026-09-18',days:21,goal:'Снять приступы головокружения',steps:[
  {t:'Вестибулярная гимнастика (видео в кабинете)',kind:'home',freq:'ежедневно · 21 день',tot:21,done:11,miss:3},
  {t:'Препарат по назначению',kind:'home',freq:'2 раза в день · 21 день',tot:21,done:12,miss:2},
  {t:'Контроль отоневролога',kind:'visit',date:'2026-10-09'}]},
 {id:'L4',p:'P05',doc:'D2',start:'2026-09-24',days:14,goal:'Убрать обострение синусита',steps:[
  {t:'Промывка пазух «кукушка»',kind:'proc',freq:'через 3 дня',tot:5,done:2},
  {t:'Назальный спрей',kind:'home',freq:'2 раза в день · 14 дней',tot:14,done:7},
  {t:'Контроль ЛОР',kind:'visit',date:'2026-10-08'}]},
 {id:'L5',p:'P02',doc:'D3',start:'2026-09-12',days:90,goal:'Привыкание к аппаратам, разборчивость речи',steps:[
  {t:'Ношение аппаратов',kind:'home',freq:'не меньше 8 часов в день',tot:19,done:17,miss:2},
  {t:'Настройка через 2 недели',kind:'visit',date:'2026-10-01'},
  {t:'Замена батареек',kind:'home',freq:'каждые 10 дней',tot:2,done:2},
  {t:'Аудиометрия контроль',kind:'test',date:'2026-12-12'}]},
 {id:'L6',p:'P11',doc:'D4',start:'2026-09-15',days:30,goal:'Снизить шум, улучшить сон',steps:[
  {t:'Звуковая терапия (аудио в кабинете)',kind:'home',freq:'перед сном · 30 дней',tot:16,done:15},
  {t:'Препарат по назначению',kind:'home',freq:'утром · 30 дней',tot:16,done:16},
  {t:'Контроль',kind:'visit',date:'2026-10-13'}]},
 {id:'L7',p:'P07',doc:'D6',start:'2026-09-26',days:7,goal:'Пробное ношение: понять, подходит ли аппарат',steps:[
  {t:'Ношение пробного аппарата',kind:'home',freq:'ежедневно · 7 дней',tot:6,done:5},
  {t:'Звонок заботы — 3-й день',kind:'visit',date:'2026-09-29'},
  {t:'Решение о покупке',kind:'visit',date:'2026-10-03'}]}
];
const KIND={proc:'В клинике',home:'Дома',visit:'Визит',test:'Исследование'};
const planOf=pid=>PLANS.find(l=>l.p===pid);
const adh=l=>{let a=0,b=0;l.steps.forEach(s=>{if(s.tot){a+=s.done;b+=s.done+(s.miss||0)}});return b?pct(a,b):100};
const prog=l=>{let a=0,b=0;l.steps.forEach(s=>{if(s.tot){a+=s.done;b+=s.tot}});return b?pct(a,b):0};

/* ===== Напоминания на сегодня ===== */
let REMS=[
 {id:'R01',t:'08:00',p:'P03',txt:'Промывка носа — утро',ch:'cab',st:'done'},
 {id:'R02',t:'08:00',p:'P01',txt:'Полоскание горла — утро',ch:'cab',st:'done'},
 {id:'R03',t:'08:30',p:'P04',txt:'Вестибулярная гимнастика, 10 минут',ch:'cab',st:'nores'},
 {id:'R04',t:'09:00',p:'P05',txt:'Назальный спрей — утро',ch:'cab',st:'done'},
 {id:'R05',t:'09:00',p:'P11',txt:'Препарат — утром',ch:'cab',st:'done'},
 {id:'R06',t:'10:00',p:'P02',txt:'Сегодня в 14:30 настройка аппаратов. Машина заберёт в 13:45',ch:'wa',st:'read'},
 {id:'R07',t:'10:00',p:'P07',txt:'Пробный аппарат: как вам слышно? Ответьте одной кнопкой',ch:'cab',st:'done'},
 {id:'R08',t:'12:00',p:'P03',txt:'Сегодня осмотр хирурга в 13:00',ch:'cab',st:'read'},
 {id:'R09',t:'14:00',p:'P03',txt:'Промывка носа — день',ch:'cab',st:'plan'},
 {id:'R10',t:'14:00',p:'P01',txt:'Полоскание горла — день',ch:'cab',st:'plan'},
 {id:'R11',t:'18:00',p:'P09',txt:'Напоминание: 6 октября промывка по абонементу',ch:'cab',st:'plan'},
 {id:'R12',t:'20:00',p:'P04',txt:'Вестибулярная гимнастика — вечер',ch:'cab',st:'plan'},
 {id:'R13',t:'21:00',p:'P11',txt:'Звуковая терапия перед сном',ch:'cab',st:'plan'},
 {id:'R14',t:'10:30',p:'P08',txt:'Пора проверить слух: год с последней аудиометрии',ch:'wa',st:'nores'}
];
const RST={plan:{n:'Запланировано',c:'#6b7a8f'},sent:{n:'Отправлено',c:'#2f6f9e'},read:{n:'Прочитано',c:'#a87a1e'},done:{n:'Отметил «сделал»',c:'#3e7d4e'},nores:{n:'Нет ответа → звонок',c:'#b23a3a'},call:{n:'Позвонили',c:'#4b8468'}};

/* ===== Отзывы ===== */
let FEED=[
 {p:'P14',d:'2026-09-30',nps:10,txt:'Курс помог, ухо больше не закладывает. Спасибо, что напоминали о каждом шаге.',doc:'D2',st:'ok'},
 {p:'P02',d:'2026-09-13',nps:9,txt:'Слышу внуков. Хорошо, что машина забирает — сама бы не доехала.',doc:'D3',st:'ok'},
 {pn:'Сагинтаева А.',d:'2026-09-27',nps:7,txt:'Долго ждала в холле — 25 минут после времени записи.',doc:'D1',st:'work',ans:'Администратор перезвонила, следующий визит — без ожидания, пометка в карте.'},
 {p:'P09',d:'2026-09-22',nps:10,txt:'Удобно, что напоминают про промывания — раньше бросал курс на середине.',doc:'D2',st:'ok'},
 {pn:'Ильясов К.',d:'2026-09-29',nps:9,txt:'Настроили аппарат за 20 минут, без очереди.',doc:'D6',st:'ok'},
 {pn:'Мусин Т.',d:'2026-09-26',nps:10,txt:'Операция прошла отлично, всё объяснили.',doc:'D5',st:'ok'},
 {pn:'Рахимова Л.',d:'2026-09-24',nps:8,txt:'Хорошо, но цены на ВНГ не было на сайте.',doc:'D4',st:'ok'},
 {pn:'Дюсенова Г.',d:'2026-09-22',nps:4,txt:'Не перезвонили с результатами, пришлось звонить самой.',doc:'D2',st:'work',ans:'Разобрали: результат не ушёл в кабинет. Теперь результаты публикуются автоматически.'}
];

/* ===== Воронка новых ===== */
const LST=[
 {k:'new',n:'Новое обращение',c:'#6b7a8f'},{k:'contact',n:'Связались',c:'#2f6f9e'},{k:'booked',n:'Записан',c:'#a87a1e'},{k:'came',n:'Пришёл',c:'#4b8468'},{k:'bought',n:'Купил · в заботу',c:'#3e7d4e'},{k:'think',n:'Думает',c:'#c75b3c'},{k:'lost',n:'Отказ',c:'#8a8f98'}
];
let LEADS=[
 {id:'N1',n:'Ермеков Даулет',age:44,src:'Instagram',want:'Консультация ЛОР',st:'came',mgr:'AB',sum:12000,d:'2026-09-30'},
 {id:'N2',n:'Бекмуратова Жанна',age:69,src:'Сарафан',want:'Слуховой аппарат',st:'booked',mgr:'MD',sum:520000,d:'2026-09-29'},
 {id:'N3',n:'Ахметжанова Роза',age:66,src:'Instagram',want:'Слуховой аппарат',st:'think',mgr:'AB',sum:890000,d:'2026-09-25',why:'«Дорого» — предложили рассрочку и пробное ношение'},
 {id:'N4',n:'Ким Сергей',age:57,src:'2ГИС',want:'Головокружение',st:'booked',mgr:'TM',sum:15000,d:'2026-09-30'},
 {id:'N5',n:'Сатпаева Мадина',age:35,src:'Сайт',want:'Храп, перегородка',st:'contact',mgr:'MD',sum:450000,d:'2026-10-01'},
 {id:'N6',n:'Утегенов Болат',age:72,src:'Наружная реклама',want:'Проверка слуха',st:'new',mgr:'AB',sum:20000,d:'2026-10-01'},
 {id:'N7',n:'Жакупова Айгуль',age:39,src:'Instagram',want:'Абонемент «Здоровое горло»',st:'new',mgr:'TM',sum:70000,d:'2026-10-01'},
 {id:'N8',n:'Абилов Нурсултан',age:51,src:'2ГИС',want:'Консультация ЛОР',st:'lost',mgr:'AB',sum:12000,d:'2026-09-27',why:'Ушёл в поликлинику по ОСМС'},
 {id:'N9',n:'Жаксылыков Нурлан',age:63,src:'Сарафан',want:'Слуховой аппарат',st:'came',mgr:'MD',sum:520000,d:'2026-09-28'},
 {id:'N10',n:'Мусин Тимур',age:9,src:'Сайт',want:'Аденотомия',st:'bought',mgr:'TM',sum:280000,d:'2026-09-15'},
 {id:'N11',n:'Ильясов Кайрат',age:70,src:'Сарафан',want:'Слуховой аппарат',st:'bought',mgr:'AB',sum:560000,d:'2026-09-02'},
 {id:'N12',n:'Сериков Ален',age:31,src:'Instagram',want:'Консультация ЛОР',st:'contact',mgr:'TM',sum:12000,d:'2026-09-30'}
];

/* ===== Звонки ===== */
const MGR={AB:{n:'Алибек',calls:64,talk:48,booked:12,came:9,bought:5,score:61},MD:{n:'Мадина',calls:58,talk:47,booked:23,came:19,bought:9,score:84},TM:{n:'Тимур',calls:41,talk:30,booked:13,came:10,bought:4,score:72}};
let CALLS=[
 {id:'C1',t:'11:12',mgr:'AB',who:'Ахметжанова Р., 66',dur:'4:18',res:'lost',score:52,want:'Слуховой аппарат',lost:'На вопрос «сколько стоит» назвал 890 000 ₸ сразу, без проверки слуха и пробного ношения',chk:[1,1,0,0,0,1]},
 {id:'C2',t:'10:47',mgr:'MD',who:'Бекмуратова Ж., 69',dur:'6:02',res:'booked',score:92,want:'Слуховой аппарат',lost:'',chk:[1,1,1,1,1,1]},
 {id:'C3',t:'10:20',mgr:'TM',who:'Ким С., 57',dur:'3:11',res:'booked',score:78,want:'Головокружение',lost:'',chk:[1,1,1,0,1,1]},
 {id:'C4',t:'09:58',mgr:'AB',who:'Абилов Н., 51',dur:'1:46',res:'lost',score:41,want:'Консультация ЛОР',lost:'Не отработал «по ОСМС бесплатно» — не рассказал, чем отличается приём и что очереди нет',chk:[1,0,0,0,0,0]},
 {id:'C5',t:'09:31',mgr:'MD',who:'Сатпаева М., 35',dur:'5:24',res:'booked',score:88,want:'Храп',lost:'',chk:[1,1,1,1,0,1]},
 {id:'C6',t:'09:05',mgr:'AB',who:'Сериков А., 31',dur:'2:09',res:'call',score:63,want:'Консультация ЛОР',lost:'Не предложил конкретное время — «перезвоните, когда удобно»',chk:[1,1,0,1,0,0]}
];
const CHK=['Поздоровался и назвал клинику','Выяснил, что беспокоит','Предложил исследование, а не цену','Назвал два времени на выбор','Отработал возражение','Предложил трансфер / напомнил адрес'];

/* ===== Найм ===== */
let CANDS=[
 {n:'Сейтжанова Аружан',src:'hh.kz',test:93,iq:128,trainer:94,st:'offer'},
 {n:'Ибраев Данияр',src:'hh.kz',test:88,iq:122,trainer:81,st:'trainer'},
 {n:'Пак Виктория',src:'Instagram',test:91,iq:125,trainer:null,st:'interview'},
 {n:'Нуртазин Ерасыл',src:'hh.kz',test:64,iq:104,trainer:null,st:'reject'},
 {n:'Касенова Алия',src:'enbek.kz',test:79,iq:118,trainer:null,st:'reject'},
 {n:'Жуматов Санжар',src:'hh.kz',test:86,iq:121,trainer:null,st:'interview'}
];
const SCEN=[['Пациент 70 лет: «аппарат дорого, у соседа дешевле»','Возражение «дорого»',86],['Дочь звонит за маму: мама не слышит, но идти не хочет','Третье лицо, страх',71],['«По ОСМС бесплатно, зачем к вам?»','Сравнение с поликлиникой',58],['Пациент после курса: «всё прошло, контроль не нужен»','Возврат на контроль',77],['Перенос записи в третий раз','Удержание',82]];

/* ===== Прайс ===== */
let PRICE=[
 ['lor','Консультация ЛОР первичная',12000],['lor','Консультация ЛОР повторная',8000],['lor','Промывка миндалин «Тонзиллор»',6000],['lor','Промывка пазух «кукушка»',4000],['lor','Удаление серной пробки',5000],
 ['surd','Консультация сурдолога',12000],['surd','Тональная аудиометрия',8000],['surd','Тимпанометрия',6000],['surd','Подбор слухового аппарата',15000],['surd','Слуховой аппарат «Базовый» (1 шт.)',280000],['surd','Слуховой аппарат «Комфорт» (1 шт.)',520000],['surd','Слуховой аппарат «Премиум» (1 шт.)',890000],
 ['oto','Консультация отоневролога',15000],['oto','Видеонистагмография (ВНГ)',25000],
 ['hir','Аденотомия',280000],['hir','Тонзиллэктомия',380000],['hir','Септопластика',450000],
 ['care','Трансфер на приём и обратно',0]
];
let ABON=[
 {n:'Здоровое горло',what:'10 промываний + 2 консультации ЛОР + напоминания',price:70000,sold:23,c:'#2f6f9e'},
 {n:'Слух под контролем · год',what:'2 аудиометрии, настройки без ограничений, батарейки на год, трансфер',price:60000,sold:41,c:'#c75b3c'},
 {n:'После операции',what:'Все осмотры и промывания 30 дней, связь с хирургом в кабинете',price:0,sold:17,c:'#8e3a4a',note:'входит в стоимость операции'},
 {n:'Спокойная голова',what:'ВНГ + 3 визита отоневролога + видео-гимнастика в кабинете',price:55000,sold:9,c:'#a87a1e'}
];

/* ===== Трансфер ===== */
let TRIPS=[
 {id:'T1',t:'08:20',p:'P08',pn:'',addr:'ул. Кенесары, 40',to:'09:00 · ЛОР',st:'done',late:0},
 {id:'T2',t:'09:30',pn:'Жаксылыков Н.',addr:'пр. Республики, 18',to:'10:00 · сурдолог',st:'done',late:4},
 {id:'T3',t:'11:50',pn:'Бекмуратова Ж.',addr:'мкр. Самал, 6',to:'12:30 · подбор аппарата',st:'way',late:0},
 {id:'T4',t:'13:45',p:'P02',addr:'ул. Сыганак, 25',to:'14:30 · настройка',st:'plan',late:0},
 {id:'T5',t:'15:20',p:'P07',addr:'ул. Ауэзова, 9',to:'обратно домой',st:'plan',late:0},
 {id:'T6',t:'17:30',p:'P02',addr:'клиника → ул. Сыганак, 25',to:'обратно домой',st:'plan',late:0}
];
const TST={plan:{n:'Запланирована',c:'#6b7a8f'},way:{n:'Едет за пациентом',c:'#2f6f9e'},pick:{n:'Пациент в машине',c:'#a87a1e'},done:{n:'Доставлен',c:'#3e7d4e'}};

/* ===== Касса ===== */
let PAYS=[
 ['09:40','P01','Промывка миндалин 6/10','абонемент',0,'lor'],['10:05','X','Аденотомия · Мусин Т.','карта',280000,'hir'],['10:55','P06','Первичная консультация ЛОР','Kaspi QR',12000,'lor'],['11:05','X','Аудиометрия + консультация · Жаксылыков Н.','наличные',20000,'surd'],['10:50','X','ВНГ + консультация · Рахимова Л.','карта',40000,'oto'],['10:35','X','Первичная ЛОР · Дюсенова Г.','Kaspi QR',12000,'lor'],['09:20','P09','Промывка по абонементу 4/10','абонемент',0,'lor'],['11:30','X','Абонемент «Слух под контролем» · Ильясов К.','Kaspi рассрочка',60000,'surd']
];

/* ===== Приказы ===== */
let ORDERS=[
 {no:'№ 47-П',d:'2026-10-01',t:'О графике работы в праздничные дни',who:'AK',sign:['AK'],need:['AK','GV'],ack:[6,14],st:'sign'},
 {no:'№ 46-П',d:'2026-09-29',t:'О новом прайсе на слуховые аппараты с 01.10',who:'AK',sign:['AK','GV'],need:['AK','GV'],ack:[12,14],st:'ack'},
 {no:'№ 45-П',d:'2026-09-25',t:'О порядке трансфера пациентов старше 65 лет',who:'AK',sign:['AK'],need:['AK'],ack:[14,14],st:'done'},
 {no:'№ 44-П',d:'2026-09-20',t:'О стандарте звонка: проверка слуха до цены',who:'AK',sign:['AK'],need:['AK'],ack:[3,3],st:'done'},
 {no:'№ 43-П',d:'2026-09-16',t:'О назначении ответственного за отдел заботы',who:'AK',sign:['AK','GV'],need:['AK','GV'],ack:[14,14],st:'done'}
];

/* ===== Общие ===== */
const SC={};
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const depm=k=>`<span class="depm" style="--c:${DEPS[k].c}">${esc(DEPS[k].n)}</span>`;
const stm=(o,k)=>{const s=o[k]||{n:k,c:'#888'};return `<span class="st" style="--sc:${s.c}">${esc(s.n)}</span>`};
const cst=k=>{const s=CSTOF(k);return `<span class="st" style="--sc:${s.c}">${esc(s.n)}</span>`};
const ptL=id=>PT(id)?`<a class="lk" onclick="event.stopPropagation();openPat('${id}')">${esc(PT(id).n.split(' ').slice(0,2).join(' '))}</a>`:'—';
const bar=(v,c)=>`<span class="pbar"><i style="width:${Math.max(0,Math.min(100,v))}%;background:${c||'var(--brand)'}"></i></span>`;
const meDoc=()=>ROLES[role].doc||null;
function openPat(id){if(!PT(id))return;curPat=id;if(allowed('card')){if(cur!=='card')go('card');else render()}else card('pat',id)}
function setAppt(id,st){const a=APPTS.find(x=>x.id===id);if(!a)return;a.st=st;render();if(document.getElementById('mbg').classList.contains('show'))card('appt',id);
 toast({wait:`${esc(apN(a))} в холле — врач видит отметку у себя.`,in:`${esc(apN(a))} на приёме у ${esc(DOC(a.doc).s)}.`,done:`Приём завершён. ${a.p&&planOf(a.p)?'План лечения уже в отделе заботы — напоминания пойдут сами.':'Если врач назначит курс, он сразу уйдёт в отдел заботы.'}`,noshow:'Отмечено «не пришёл» — администратору задача перезаписать, пациенту сообщение в кабинет.'}[st])}

/* ===== Пульт клиники ===== */
SC.today=()=>{const A=APPTS,done=A.filter(a=>a.st==='done').length,inn=A.filter(a=>a.st==='in'||a.st==='wait').length,ns=A.filter(a=>a.st==='noshow').length;
 const rev=PAYS.reduce((s,p)=>s+p[4],0),rd=REMS.filter(r=>r.st==='done').length,rsent=REMS.filter(r=>r.st!=='plan').length;
 const AL=[];
 PATIENTS.filter(p=>p.stage==='risk').forEach(p=>AL.push(['r',`${esc(p.n.split(' ').slice(0,2).join(' '))} пропускает план`,`${esc(p.dx)} · 3 дня без отметки «сделал» — позвонить`,`openPat('${p.id}')`]));
 REMS.filter(r=>r.st==='nores').forEach(r=>AL.push(['w',`Нет ответа: ${esc(PT(r.p).n.split(' ').slice(0,2).join(' '))}`,`${esc(r.txt)} · отдел заботы перезвонит`,`go('remind')`]));
 A.filter(a=>a.st==='noshow').forEach(a=>AL.push(['w',`Не пришёл: ${esc(apN(a))}`,`${a.t} · ${esc(DOC(a.doc).s)} — перезаписать`,`card('appt','${a.id}')`]));
 PATIENTS.filter(p=>p.stage==='chronic'&&(!p.next||daysBetween(TODAY,p.next)<0)&&daysBetween(p.last,TODAY)>365).forEach(p=>AL.push(['i',`Пора на контроль: ${esc(p.n.split(' ').slice(0,2).join(' '))}`,`Последняя проверка ${dl(p.last)} — пригласить, предложить трансфер`,`go('chronic')`]));
 FEED.filter(f=>f.st==='work').forEach(f=>AL.push(['w',`Отзыв ${f.nps}/10 · ${esc(f.pn||PT(f.p).n)}`,esc(f.txt),`go('feedback')`]));
 ORDERS.filter(o=>o.st==='sign').forEach(o=>AL.push(['b',`Приказ ${esc(o.no)} ждёт подписи`,esc(o.t),`card('ord','${o.no}')`]));
 LEADS.filter(l=>l.st==='think').forEach(l=>AL.push(['i',`Думает: ${esc(l.n)}`,`${esc(l.want)} · ${esc(l.why||'')}`,`go('funnel')`]));
 return `<div class="hd"><div><h2>Пульт клиники · четверг, 1 октября, ${NOW}</h2><p>Все отделения на одном экране: кто сейчас на приёме, кто ждёт, кто не пришёл, как пациенты выполняют лечение дома, что требует решения руководителя.</p></div><div class="btns"><button class="bt" onclick="go('dash')">Дашборд</button><button class="bt p" onclick="card('newappt')">+ Запись</button></div></div>
 <div class="wid"><div><small>Записей сегодня</small><b>${A.length}</b><span>принято ${done} · в клинике ${inn}</span></div><div><small>Не пришли</small><b class="r">${ns}</b><span>доходимость ${pct(A.length-ns-A.filter(a=>a.st==='plan').length,A.length-A.filter(a=>a.st==='plan').length)}%</span></div><div><small>Касса сегодня</small><b class="a">${tg(rev)}</b><span>${PAYS.length} оплат</span></div><div><small>Напоминания</small><b class="g">${rd} / ${rsent}</b><span>отметили «сделал»</span></div><div><small>Трансфер</small><b>${TRIPS.length}</b><span>поездок · машина в пути</span></div></div>
 <div class="docsnow">${DOCS.map(d=>{const L=A.filter(a=>a.doc===d.id),now=L.find(a=>a.st==='in'),wt=L.filter(a=>a.st==='wait'),nx=L.find(a=>a.st==='plan');return `<div class="dn" style="--c:${DEPS[d.dep].c}" onclick="schDoc='${d.id}';go('schedule')"><small>${esc(DEPS[d.dep].n)} · ${esc(d.room)}</small><b>${esc(d.s)}</b><div class="dnr ${now?'on':''}"><span>Сейчас</span><em>${now?esc(apN(now))+' · '+now.t:'свободен'}</em></div><div class="dnr"><span>В холле</span><em>${wt.length?wt.map(a=>esc(apN(a))).join(', '):'—'}</em></div><div class="dnr"><span>Далее</span><em>${nx?nx.t+' · '+esc(apN(nx)):'—'}</em></div><i>${L.filter(a=>a.st==='done').length} / ${L.length}</i></div>`}).join('')}</div>
 <div class="g21"><div class="pan"><h3>Требует внимания · ${AL.length}</h3><p>Система сама собирает то, что сейчас теряется между WhatsApp, Excel и памятью администратора.</p>${AL.slice(0,9).map(a=>`<div class="al ${a[0]}" onclick="${a[3]}"><b>${a[1]}</b><span>${a[2]}</span></div>`).join('')}</div>
 <div><div class="pan"><h3>Пациенты сегодня</h3>${[['Новые (первый визит)',A.filter(a=>a.svc.indexOf('Первичная')===0||a.svc.indexOf('Аудиометрия')===0).length],['Действующие (курс, контроль)',A.filter(a=>a.p&&PT(a.p)).length],['Операции',A.filter(a=>DOC(a.doc).dep==='hir'&&a.dur>=60).length],['С трансфером',TRIPS.filter(t=>t.to.indexOf('обратно')<0).length]].map(x=>`<div class="kv"><span>${x[0]}</span><b class="mono">${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Забота за неделю</h3>${[['Курсов идёт',PLANS.length],['Средняя дисциплина',Math.round(PLANS.reduce((s,l)=>s+adh(l),0)/PLANS.length)+'%'],['Повторных визитов записано',14],['Вернули на контроль',6]].map(x=>`<div class="kv"><span>${x[0]}</span><b class="mono">${x[1]}</b></div>`).join('')}<button class="bt" style="margin-top:10px" onclick="go('carefunnel')">Отдел заботы →</button></div></div></div>
 ${said('«Соединить все отделы в одной системе не можем — это, наверное, боль всех организаций.»','Здесь администратор, врачи, забота, продажи и руководитель работают в одной системе — каждый видит своё.')}`};

/* ===== Расписание ===== */
let schDoc='all',schDep='all';
const SLOTS=[];for(let h=9;h<18;h++){SLOTS.push(String(h).padStart(2,'0')+':00');SLOTS.push(String(h).padStart(2,'0')+':30')}
const slotIx=t=>SLOTS.indexOf(t);
SC.schedule=()=>{let D=DOCS.filter(d=>schDep==='all'||d.dep===schDep);if(meDoc())D=D.filter(d=>d.id===meDoc());else if(schDoc!=='all')D=D.filter(d=>d.id===schDoc);
 return `<div class="hd"><div><h2>Расписание врачей · ${dow(TODAY)}, ${dl(TODAY)}</h2><p>Сетка по кабинетам и врачам. Цвет — статус: записан, ждёт в холле, на приёме, принят, не пришёл. Отметка «пришёл» видна врачу сразу; после приёма назначения уходят в отдел заботы.</p></div><div class="btns"><button class="bt p" onclick="card('newappt')">+ Запись</button></div></div>
 ${meDoc()?'':`<div class="filt"><button class="${schDep==='all'&&schDoc==='all'?'on':''}" onclick="schDep='all';schDoc='all';render()">Все врачи</button>${Object.keys(DEPS).filter(k=>k!=='care').map(k=>`<button class="${schDep===k?'on':''}" onclick="schDep='${k}';schDoc='all';render()"><i class="sq" style="background:${DEPS[k].c}"></i>${DEPS[k].n}</button>`).join('')}</div>`}
 <div class="legend">${Object.entries(AST).map(([k,s])=>`<span><i style="background:${s.c}"></i>${s.n}</span>`).join('')}</div>
 <div class="schw"><div class="sch" style="grid-template-columns:58px repeat(${D.length},minmax(150px,1fr));grid-template-rows:auto repeat(${SLOTS.length},34px)">
  <div class="sh"></div>${D.map((d,i)=>`<div class="sh" style="grid-column:${i+2};--c:${DEPS[d.dep].c}"><b>${esc(d.s)}</b><span>${esc(DEPS[d.dep].n)} · ${esc(d.room)}</span></div>`).join('')}
  ${SLOTS.map((t,j)=>`<div class="stt" style="grid-row:${j+2}">${t.slice(3)==='00'?t:''}</div>${D.map((d,i)=>`<div class="scell ${t>NOW?'':'past'}" style="grid-row:${j+2};grid-column:${i+2}" onclick="card('newappt','${d.id}|${t}')"></div>`).join('')}`).join('')}
  ${D.map((d,i)=>APPTS.filter(a=>a.doc===d.id&&slotIx(a.t)>=0).map(a=>`<div class="ap" style="grid-column:${i+2};grid-row:${slotIx(a.t)+2} / span ${Math.max(1,Math.round(a.dur/30))};--c:${AST[a.st].c}" onclick="card('appt','${a.id}')"><b>${a.t} · ${esc(apN(a))}</b><span>${esc(a.svc)}</span>${a.tr?'<em>трансфер</em>':''}</div>`).join('')).join('')}
  <div class="nowl" style="grid-row:${slotIx('11:30')+2};grid-column:1 / -1"></div>
 </div></div>`};

/* ===== Трансфер ===== */
function tripAdv(id){const t=TRIPS.find(x=>x.id===id);const o=['plan','way','pick','done'];const i=o.indexOf(t.st);if(i<3)t.st=o[i+1];render();toast({way:'Водитель выехал — пациенту сообщение в кабинет: «Машина едет, будет через 15 минут».',pick:'Пациент в машине — администратор видит, что он будет вовремя.',done:'Пациент доставлен. Время в пути записано.'}[t.st]||'')}
SC.transfer=()=>{const drv=role==='Водитель';
 return `<div class="hd"><div><h2>Трансфер пациентов</h2><p>Машина клиники забирает пациентов старшего возраста и отвозит домой — входит в стоимость. Поездки строятся от расписания: забрать за 40 минут до приёма. Пациент видит в кабинете, что машина едет.</p></div></div>
 ${drv?'':`<div class="wid"><div><small>Поездок сегодня</small><b>${TRIPS.length}</b></div><div><small>Вовремя за неделю</small><b class="g">27 из 29</b><span>опоздание больше 10 минут — 2</span></div><div><small>Пациентов с трансфером</small><b>${PATIENTS.filter(p=>p.transfer).length}</b><span>старше 60 — 9 из 10</span></div><div><small>Пришли с трансфером</small><b class="g">100%</b><span>без трансфера — 86%</span></div><div><small>Водитель</small><b style="font-size:18px">Серик</b><span>+7 701 555 44 01</span></div></div>`}
 <div class="g21"><div class="pan"><h3>Маршрут на сегодня</h3><div class="trl">${TRIPS.map(t=>`<div class="tr ${t.st}"><div class="trt">${t.t}</div><div class="trb"><b>${t.p?esc(PT(t.p).n.split(' ').slice(0,2).join(' ')):esc(t.pn)}</b><span>${esc(t.addr)} → ${esc(t.to)}</span></div>${stm(TST,t.st)}${t.st!=='done'?`<button class="bt sm p" onclick="tripAdv('${t.id}')">${{plan:'Выехал',way:'Забрал',pick:'Доставил'}[t.st]}</button>`:`<span class="mini">${t.late?'опоздание '+t.late+' мин':'вовремя'}</span>`}</div>`).join('')}</div></div>
 <div class="phone"><div class="pht"><b>Серик · трансфер</b><small>Hyundai Staria · 6 мест</small></div><div class="pb">${TRIPS.filter(t=>t.st!=='done').slice(0,3).map(t=>`<div class="pi"><span>${t.t} · ${t.p?esc(PT(t.p).n.split(' ')[0]):esc(t.pn.split(' ')[0])}<small>${esc(t.addr)}</small></span><b>${esc(TST[t.st].n.split(' ')[0])}</b></div>`).join('')}<div class="pbtn" onclick="act('nav')">Открыть маршрут в 2ГИС</div></div></div></div>
 ${said('«Мы запустили машину, сами забираем — это входит в стоимость… Важно время: чтобы пришёл вовремя.»')}`};

/* ===== База пациентов ===== */
let patF='all',patQ='';
const PATF=[['all','Все'],['active','Действующие'],['new','Новые'],['chronic','Хронические'],['risk','Риск']];
SC.patients=()=>{let L=PATIENTS.filter(p=>!patQ||(p.n+' '+p.ph+' '+p.dx).toLowerCase().includes(patQ.toLowerCase()));
 if(meDoc())L=L.filter(p=>p.doc===meDoc());
 if(patF==='active')L=L.filter(p=>['course','trial','control','risk','repeat'].includes(p.stage));if(patF==='new')L=L.filter(p=>['new','lead','booked'].includes(p.stage));if(patF==='chronic')L=L.filter(p=>p.chronic);if(patF==='risk')L=L.filter(p=>p.stage==='risk'||(p.stage==='chronic'&&daysBetween(p.last,TODAY)>365));
 return `<div class="hd"><div><h2>База пациентов${meDoc()?' · мои пациенты':''}</h2><p>Один пациент — одна карта на всю клинику: ЛОР, сурдолог, отоневролог и хирург видят общую историю. Видно, кто новый, кто на курсе, кто хронический и давно не был.</p></div><div class="btns"><button class="bt" onclick="act('import')">Импорт из текущей CRM</button><button class="bt p" onclick="card('newpat')">+ Пациент</button></div></div>
 <div class="filt"><input class="fin" placeholder="ФИО, телефон, диагноз" value="${esc(patQ)}" onkeydown="if(event.key==='Enter'){patQ=this.value;render()}">${PATF.map(f=>`<button class="${patF===f[0]?'on':''}" onclick="patF='${f[0]}';render()">${f[1]}</button>`).join('')}</div>
 <div class="tw"><table class="t"><thead><tr><th>Пациент</th><th class="r">Возраст</th><th>Отделение</th><th>Диагноз</th><th>Врач</th><th>Забота</th><th>Дисциплина</th><th>Был</th><th>Следующий</th><th>Кабинет</th><th class="r">Принёс за всё время</th></tr></thead><tbody>${L.map(p=>{const l=planOf(p.id);return `<tr onclick="openPat('${p.id}')"><td><b>${esc(p.n)}</b><span class="sub mono">${esc(p.ph)}</span></td><td class="r mono">${p.age}</td><td>${depm(p.dep)}</td><td>${esc(p.dx)}<span class="sub mono">${p.icd}</span></td><td>${esc(DOC(p.doc).s)}</td><td>${cst(p.stage)}</td><td>${l?`<span class="adh">${bar(adh(l),adh(l)<80?'var(--bad)':'var(--ok)')}<em>${adh(l)}%</em></span>`:'<span class="mini">—</span>'}</td><td class="mono">${dd(p.last)}</td><td class="mono">${p.next?dd(p.next):'<span class="neg">не записан</span>'}</td><td>${p.cab?'<span class="pos">подключён</span>':'<span class="mini">нет</span>'}</td><td class="r mono">${fmt(p.ltv)}</td></tr>`}).join('')}</tbody></table></div>`};

/* ===== Карта пациента ===== */
const AUD={P02:{R:[35,40,50,55,60,65],L:[30,40,45,55,60,70],d:'2026-08-28'},P07:{R:[50,55,65,70,75,80],L:[25,30,35,40,45,55],d:'2026-09-23'},P08:{R:[40,45,55,60,65,70],L:[40,50,55,60,70,75],d:'2025-08-20'},P12:{R:[35,40,45,50,55,60],L:[30,35,45,50,55,65],d:'2026-09-25'}};
const FREQ=['250','500','1к','2к','4к','8к'];
function audSvg(a,w,h){w=w||340;h=h||190;const x0=36,y0=16,W=w-x0-12,H=h-y0-24;const X=i=>x0+i*W/5,Y=v=>y0+v/100*H;
 const grid=[0,20,40,60,80,100].map(v=>`<line x1="${x0}" x2="${x0+W}" y1="${Y(v)}" y2="${Y(v)}" class="ag"/><text x="${x0-6}" y="${Y(v)+3}" text-anchor="end" class="at">${v}</text>`).join('')+FREQ.map((f,i)=>`<line x1="${X(i)}" x2="${X(i)}" y1="${y0}" y2="${y0+H}" class="ag"/><text x="${X(i)}" y="${h-6}" text-anchor="middle" class="at">${f}</text>`).join('');
 const zone=`<rect x="${x0}" y="${Y(0)}" width="${W}" height="${Y(25)-Y(0)}" class="az"/>`;
 const line=(arr,c,m)=>`<polyline points="${arr.map((v,i)=>X(i)+','+Y(v)).join(' ')}" fill="none" stroke="${c}" stroke-width="2"/>`+arr.map((v,i)=>m==='o'?`<circle cx="${X(i)}" cy="${Y(v)}" r="4.5" fill="var(--card)" stroke="${c}" stroke-width="2"/>`:`<path d="M${X(i)-4} ${Y(v)-4}l8 8M${X(i)+4} ${Y(v)-4}l-8 8" stroke="${c}" stroke-width="2"/>`).join('');
 return `<svg class="aud" viewBox="0 0 ${w} ${h}" width="100%">${zone}${grid}${line(a.R,'#c0392b','o')}${line(a.L,'#2f6f9e','x')}</svg>`}
const pvis=p=>{const V=[];if(p.id==='P01')V.push(['2026-09-10','D1','Первичная консультация: хр. тонзиллит, назначен курс'],['2026-09-17','D1','Промывка 1/10 · план лечения в кабинете'],['2026-09-29','D1','Промывка 5/10'],['2026-10-01','D1','Промывка 6/10']);
 else if(p.id==='P02')V.push(['2026-08-28','D3','Аудиометрия, тимпанометрия: тугоухость II ст.'],['2026-09-05','D6','Подбор: «Комфорт» × 2, пробное ношение 7 дней'],['2026-09-12','D6','Покупка 2 аппаратов, первая настройка']);
 else if(p.id==='P03')V.push(['2026-09-02','D5','Консультация хирурга, КТ пазух'],['2026-09-24','D5','Септопластика, выписка в тот же день'],['2026-09-30','D5','Звонок заботы: самочувствие хорошее']);
 else V.push([p.since,p.doc,'Первичная консультация: '+p.dx]);if(p.last!==p.since&&!['P01','P02','P03'].includes(p.id))V.push([p.last,p.doc,'Повторный визит']);return V};
SC.card=()=>{const p=PT(curPat)||PATIENTS[0];const l=planOf(p.id),R=REMS.filter(r=>r.p===p.id),A=AUD[p.id];
 return `<div class="crumb"><a onclick="go('patients')">Пациенты</a> / ${esc(p.n)}</div>
 <div class="phd"><div class="pav" style="--c:${DEPS[p.dep].c}">${esc(p.n.split(' ').slice(0,2).map(x=>x[0]).join(''))}</div><div class="phn"><h2>${esc(p.n)}</h2><p>${p.age} ${plural(p.age,['год','года','лет'])} · ${esc(p.ph)} · пациент с ${dl(p.since)} · ${esc(p.src)}</p><div class="phtags">${depm(p.dep)} ${cst(p.stage)} ${p.chronic?'<span class="flag">хронический</span>':''} ${p.transfer?'<span class="flag">трансфер</span>':''} ${p.cab?'<span class="flag ok">кабинет подключён</span>':'<span class="flag no">кабинета нет</span>'}</div></div>
  <div class="btns"><select class="osel" onchange="curPat=this.value;render()">${PATIENTS.map(x=>`<option value="${x.id}" ${x.id===p.id?'selected':''}>${esc(x.n.split(' ').slice(0,2).join(' '))}</option>`).join('')}</select>${p.cab?'':`<button class="bt w" onclick="cabLink('${p.id}')">Отправить ссылку на кабинет</button>`}<button class="bt p" onclick="card('newappt','|'+'${p.id}')">Записать</button></div></div>
 <div class="g21"><div>
  <div class="pan"><h3>Диагноз и врач</h3>${[['Диагноз',esc(p.dx)],['МКБ-10',`<span class="mono">${p.icd}</span>`],['Лечащий врач',esc(DOC(p.doc).n)+' · '+esc(DOC(p.doc).sp)],['Координатор заботы','Гульмира'],['Принёс клинике',tg(p.ltv)]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
  ${l?`<div class="pan"><h3>План лечения · ${prog(l)}% выполнено · дисциплина ${adh(l)}%</h3><p>${esc(l.goal)} · с ${dl(l.start)}, ${l.days} дн. · назначил ${esc(DOC(l.doc).s)}</p>${l.steps.map(s=>`<div class="stepr"><span class="kd k-${s.kind}">${KIND[s.kind]}</span><div><b>${esc(s.t)}</b><span>${s.freq?esc(s.freq):'дата: '+dl(s.date)}${s.miss?` · <em class="neg">пропущено ${s.miss}</em>`:''}</span></div>${s.tot?`<div class="stprog">${bar(pct(s.done,s.tot),s.miss?'var(--warn)':'var(--ok)')}<em>${s.done}/${s.tot}</em></div>`:`<div class="stprog"><em class="${s.date<TODAY?'':'mini'}">${s.date<=TODAY?'сегодня или раньше':'через '+daysBetween(TODAY,s.date)+' дн.'}</em></div>`}</div>`).join('')}<button class="bt" style="margin-top:10px" onclick="card('plan','${l.id}')">Открыть план</button></div>`:`<div class="pan"><h3>План лечения</h3><p class="mini">Пока нет. Врач назначает план прямо из приёма — шаги, частота, дни, контроль. Пациент видит его в кабинете, забота — у себя.</p><button class="bt p" onclick="card('newplan','${p.id}')">+ Назначить план</button></div>`}
  ${A?`<div class="pan"><h3>Аудиограмма от ${dl(A.d)}</h3><div class="audw">${audSvg(A,420,210)}<div class="legend"><span><i style="background:#c0392b"></i>правое ухо (O)</span><span><i style="background:#2f6f9e"></i>левое ухо (X)</span><span><i style="background:var(--ok-l);border:1px solid var(--ok)"></i>норма до 25 дБ</span></div></div></div>`:''}
 </div><div>
  <div class="pan"><h3>История визитов</h3><div class="tl">${pvis(p).slice().reverse().map((v,j)=>`<div class="tli ${j===0?'on':'ok'}"><span class="who">${dl(v[0])} · ${esc(DOC(v[1]).s)}</span><b>${esc(v[2])}</b></div>`).join('')}</div></div>
  <div class="pan"><h3>Напоминания сегодня</h3>${R.map(r=>`<div class="kv"><span><span class="mono">${r.t}</span> · ${esc(r.txt)}</span><b>${stm(RST,r.st)}</b></div>`).join('')||'<p class="mini">На сегодня нет.</p>'}</div>
  <div class="pan"><h3>Документы</h3>${[['Информированное согласие','подписано в кабинете'],['Заключение врача','PDF · видно пациенту'],A?['Аудиограмма','PDF · видно пациенту']:null,p.dep==='hir'?['Выписка после операции','PDF']:null].filter(Boolean).map(f=>`<div class="file"><i>PDF</i><div><b>${f[0]}</b><span>${f[1]}</span></div></div>`).join('')}</div>
 </div></div>`};
function cabLink(id){const p=PT(id);p.cab=true;render();toast(`Ссылка на кабинет отправлена в WhatsApp: ${esc(p.ph)}. Дальше — напоминания и план в кабинете, без платных сообщений.`)}

/* ===== Слух и аппараты ===== */
const HST=[['test','Аудиометрия'],['pick','Подбор'],['trial','Пробное ношение'],['buy','Покупка'],['tune1','Настройка · 2 недели'],['tune2','Настройка · 1 месяц'],['year','Годовой контроль']];
let HEAR=[
 {p:'P12',st:'pick',dev:'«Комфорт» × 2 — думает',sum:1040000,note:'Возражение «дорого» → предложить рассрочку 12 мес. и пробное ношение'},
 {p:'P07',st:'trial',dev:'«Комфорт», правое ухо',sum:520000,note:'День 6 из 7 · звонок 3-го дня: «слышу телевизор тише»'},
 {p:'P02',st:'tune1',dev:'«Комфорт» × 2',sum:1040000,note:'Сегодня 14:30, трансфер в 13:45'},
 {pn:'Ильясов К.',st:'tune2',dev:'«Базовый» × 2',sum:560000,note:'Сегодня 17:00'},
 {pn:'Жаксылыков Н.',st:'test',dev:'—',sum:0,note:'Сегодня аудиометрия, II–III ст., рекомендован подбор'},
 {pn:'Бекмуратова Ж.',st:'pick',dev:'подбор сегодня 12:30',sum:0,note:'Пришла по сарафану от Петровой Г. И.'},
 {p:'P08',st:'year',dev:'«Премиум» × 2 · 2023',sum:1780000,note:'Контроль просрочен на 1 месяц — пригласить с трансфером'}
];
SC.hearing=()=>{const sel=AUD[curPat]?curPat:'P02';
 return `<div class="hd"><div><h2>Слух и слуховые аппараты</h2><p>Самый большой чек клиники — и самый длинный путь: аудиометрия → подбор → пробное ношение → покупка → две настройки → годовой контроль. Каждый шаг виден, ни один пациент не теряется после покупки.</p></div><div class="btns"><button class="bt" onclick="go('price')">Прайс аппаратов</button></div></div>
 <div class="hpath">${HST.map(([k,n],i)=>{const L=HEAR.filter(h=>h.st===k);return `<div class="hp"><small>${i+1}</small><b>${n}</b><em>${L.length}</em>${L.map(h=>`<span onclick="${h.p?`curPat='${h.p}';render()`:`toast('Новый пациент: карта создаётся при первом визите.')`}">${esc(h.p?PT(h.p).n.split(' ').slice(0,2).join(' '):h.pn)}</span>`).join('')}</div>`}).join('')}</div>
 <div class="g12"><div class="pan"><h3>Аудиограмма · ${esc(PT(sel).n.split(' ').slice(0,2).join(' '))}</h3><p>${dl(AUD[sel].d)} · ${esc(PT(sel).dx)}</p>${audSvg(AUD[sel],360,200)}<div class="legend"><span><i style="background:#c0392b"></i>правое</span><span><i style="background:#2f6f9e"></i>левое</span></div><div class="filt" style="margin-top:10px">${Object.keys(AUD).map(id=>`<button class="${id===sel?'on':''}" onclick="curPat='${id}';render()">${esc(PT(id).n.split(' ')[0])}</button>`).join('')}</div></div>
 <div class="pan"><h3>Путь пациентов</h3><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Шаг</th><th>Аппарат</th><th class="r">Сумма</th><th>Что дальше</th></tr></thead><tbody>${HEAR.map(h=>`<tr onclick="${h.p?`openPat('${h.p}')`:''}"><td>${esc(h.p?PT(h.p).n.split(' ').slice(0,2).join(' '):h.pn)}</td><td>${esc(HST.find(x=>x[0]===h.st)[1])}</td><td>${esc(h.dev)}</td><td class="r mono">${h.sum?fmt(h.sum):'—'}</td><td class="mini">${esc(h.note)}</td></tr>`).join('')}</tbody></table></div>
 <div class="kv" style="margin-top:8px"><span>Продано аппаратов в сентябре</span><b class="mono">14 шт. · 7,1 млн ₸</b></div><div class="kv"><span>Из пробного ношения в покупку</span><b class="mono">71%</b></div><div class="kv"><span>Пришли на настройку через 2 недели</span><b class="mono">93%</b></div></div></div>`};

/* ===== Отдел заботы ===== */
const CFLOW=['new','course','trial','control','risk','repeat','chronic','done'];
function moveStage(id,st){const p=PT(id);p.stage=st;render();if(document.getElementById('mbg').classList.contains('show'))closeM();toast(`${esc(p.n.split(' ').slice(0,2).join(' '))}: «${esc(CSTOF(st).n)}».${st==='repeat'?' Визит в расписании, напоминание за день и в день приёма.':st==='done'?' Отправлен опрос, следующий контроль — в календаре заботы.':''}`)}
function callPat(id){const p=PT(id);toast(`Звонок ${esc(p.ph)} — запись разговора прикрепится к карте. После звонка отметьте результат.`);if(p.stage==='risk'){p.stage='course';setTimeout(render,50)}}
SC.carefunnel=()=>{const L=PATIENTS.filter(p=>CFLOW.includes(p.stage));
 return `<div class="hd"><div><h2>Отдел заботы</h2><p>Как только пациент купил услугу, курс, абонемент или аппарат — он уходит из воронки продаж сюда. Здесь работают не «сделки», а люди на лечении: курс, контроль, повторный визит, хронический контроль. Отдельный отдел, отдельная доска — без каши с новыми обращениями.</p></div><div class="btns"><button class="bt" onclick="go('remind')">Напоминания сегодня</button></div></div>
 <div class="board">${CST.map(s=>{const C=L.filter(p=>p.stage===s.k);return `<div class="bcol"><div class="bh" style="--c:${s.c}"><b>${s.n}</b><span>${C.length} · ${esc(s.d)}</span></div>${C.map(p=>{const l=planOf(p.id);return `<div class="oc" onclick="openPat('${p.id}')"><div class="ocb">${depm(p.dep)}<span class="mono">${p.age} ${plural(p.age,['год','года','лет'])}</span></div><b>${esc(p.n.split(' ').slice(0,2).join(' '))}</b><span>${esc(p.dx)}</span>${l?`<div class="adh">${bar(adh(l),adh(l)<80?'var(--bad)':'var(--ok)')}<em>${adh(l)}%</em></div>`:''}<div class="ocf"><em>${p.next?'след. '+dd(p.next):'не записан'}</em>${p.transfer?'<em>трансфер</em>':''}</div><div class="ocbtn">${s.k==='risk'?`<button class="bt sm r" onclick="event.stopPropagation();callPat('${p.id}')">Позвонить</button>`:''}${['course','control','trial','risk','done','chronic'].includes(s.k)?`<button class="bt sm" onclick="event.stopPropagation();moveStage('${p.id}','repeat')">Записать</button>`:''}${s.k==='course'||s.k==='repeat'?`<button class="bt sm" onclick="event.stopPropagation();moveStage('${p.id}','done')">Завершить</button>`:''}</div></div>`}).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 ${said('«Чтобы это ушло в другой блок, который с действующими пациентами работает, и другой отдел этим занимался — чтобы каши не было.»','Новые обращения — в «Продажах», действующие пациенты — здесь, у Гульмиры.')}`};

/* ===== Планы лечения ===== */
SC.plans=()=>{let L=PLANS;if(meDoc())L=L.filter(l=>l.doc===meDoc());
 return `<div class="hd"><div><h2>Планы лечения</h2><p>Врач назначает план прямо в карте: что делать в клинике, что дома, как часто, сколько дней, когда контроль. Пациент получает план в кабинете и каждый день отмечает «сделал». Забота видит, кто выполняет, а кто пропускает — до того, как пациент потеряется.</p></div><div class="btns"><button class="bt p" onclick="card('newplan','P06')">+ Назначить план</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Врач</th><th>Цель</th><th>Шаги</th><th>Выполнено</th><th>Дисциплина</th><th>Контроль</th></tr></thead><tbody>${L.map(l=>{const p=PT(l.p),v=l.steps.find(s=>s.kind==='visit'&&s.date>=TODAY);return `<tr onclick="card('plan','${l.id}')"><td><b>${esc(p.n.split(' ').slice(0,2).join(' '))}</b><span class="sub">${esc(p.dx)}</span></td><td>${esc(DOC(l.doc).s)}</td><td class="mini">${esc(l.goal)}</td><td>${l.steps.map(s=>`<span class="kd k-${s.kind}" title="${esc(s.t)}">${KIND[s.kind][0]}</span>`).join('')}</td><td><span class="adh">${bar(prog(l))}<em>${prog(l)}%</em></span></td><td><span class="adh">${bar(adh(l),adh(l)<80?'var(--bad)':'var(--ok)')}<em class="${adh(l)<80?'neg':''}">${adh(l)}%</em></span></td><td class="mono">${v?dd(v.date):'—'}</td></tr>`}).join('')}</tbody></table></div>
 <div class="g3" style="margin-top:12px"><div class="pan"><h3>Шаблоны врачей</h3>${['Хр. тонзиллит: «Тонзиллор» × 10 + полоскание 14 дн.','После септопластики: промывка 3×/день 14 дн., осмотры 7 и 14 день','Синусит: «кукушка» через 3 дня × 5 + спрей','ДППГ: гимнастика 21 день + контроль','Слуховой аппарат: 8 ч/день, настройки 2 нед. и 1 мес.'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Как пациент отмечает</h3><p class="mini">В кабинете — список на сегодня крупными кнопками: «Сделал», «Не получилось», «Есть вопрос». Без ответа 2 дня подряд — карточка уходит в «Риск», заботе — задача позвонить.</p></div>
 <div class="pan"><h3>Что видит врач</h3><p class="mini">На контрольном приёме — график дисциплины по дням и вопросы пациента. Видно, помог курс или его просто не выполняли.</p></div></div>
 ${said('«ЛОР пишет: промывка через три дня, курс лечения четырнадцать дней… Вы занятой человек — вы будете забывать. А мы хотим делать пациенту здоровье, потому что забота.»')}`};

/* ===== Напоминания ===== */
function remCall(id){const r=REMS.find(x=>x.id===id);r.st='call';render();toast(`Позвонили: ${esc(PT(r.p).n.split(' ').slice(0,2).join(' '))}. Результат звонка — в карте.`)}
function remSend(){let n=0;REMS.filter(r=>r.st==='plan'&&r.t<=NOW).forEach(r=>{r.st='sent';n++});render();toast(n?`Отправлено ${n}.`:'Все напоминания до текущего часа уже ушли — остальные уйдут по расписанию.')}
SC.remind=()=>{const cab=REMS.filter(r=>r.ch==='cab').length,wa=REMS.filter(r=>r.ch==='wa').length;
 return `<div class="hd"><div><h2>Напоминания · сегодня</h2><p>Напоминания идут из плана лечения сами: в кабинет пациента (бесплатно, уведомлением на телефон) — и только важное в WhatsApp. Нет ответа — карточка в «Позвонить».</p></div><div class="btns"><button class="bt" onclick="remSend()">Отправить по расписанию</button></div></div>
 <div class="wid"><div><small>Всего на сегодня</small><b>${REMS.length}</b></div><div><small>Через кабинет</small><b class="g">${cab}</b><span>бесплатно</span></div><div><small>Через WhatsApp</small><b class="w">${wa}</b><span>только важное</span></div><div><small>Отметили «сделал»</small><b class="g">${REMS.filter(r=>r.st==='done').length}</b></div><div><small>Позвонить</small><b class="r">${REMS.filter(r=>r.st==='nores').length}</b></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Время</th><th>Пациент</th><th>Что</th><th>Канал</th><th>Статус</th><th></th></tr></thead><tbody>${REMS.slice().sort((a,b)=>a.t<b.t?-1:1).map(r=>`<tr onclick="openPat('${r.p}')"><td class="mono">${r.t}</td><td>${esc(PT(r.p).n.split(' ').slice(0,2).join(' '))}<span class="sub">${PT(r.p).age} лет</span></td><td>${esc(r.txt)}</td><td>${r.ch==='cab'?'<span class="chn cab">Кабинет</span>':'<span class="chn wa">WhatsApp</span>'}</td><td>${stm(RST,r.st)}</td><td>${r.st==='nores'?`<button class="bt sm r" onclick="event.stopPropagation();remCall('${r.id}')">Позвонил</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Не хочу, чтобы это было в WhatsApp-переписке… это всё же деньги… и не хотелось бы зависеть от стороннего сервиса.»','Поэтому основной канал — кабинет пациента по ссылке: уведомления бесплатные, история остаётся у клиники.')}`};

/* ===== Хронические ===== */
function invite(id){const p=PT(id);p.next=addDays(TODAY,6);p.stage='repeat';render();toast(`${esc(p.n.split(' ').slice(0,2).join(' '))} приглашён(а) на ${dl(p.next)}${p.transfer?', трансфер включён':''}. Сообщение — в кабинет${p.cab?'':' и WhatsApp'}.`)}
SC.chronic=()=>{const L=PATIENTS.filter(p=>p.chronic).map(p=>{const due=p.next||addDays(p.last,p.dep==='surd'?365:180);return [p,due,daysBetween(TODAY,due)]}).sort((a,b)=>a[2]-b[2]);
 return `<div class="hd"><div><h2>Хронические пациенты · контроль</h2><p>У большинства пациентов после 30 есть хроническое заболевание: тонзиллит, синусит, тугоухость, ринит. Система сама считает, когда каждому пора на контроль, и ставит задачу заботе за 2 недели — пациент остаётся у клиники, а не уходит в поликлинику.</p></div></div>
 <div class="wid"><div><small>Хронических</small><b>${L.length}</b></div><div><small>Просрочен контроль</small><b class="r">${L.filter(x=>x[2]<0).length}</b></div><div><small>В ближайшие 14 дней</small><b class="w">${L.filter(x=>x[2]>=0&&x[2]<=14).length}</b></div><div><small>Вернулись на контроль за квартал</small><b class="g">68%</b></div><div><small>Выручка от хронических</small><b class="a">41%</b><span>от всей выручки</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Заболевание</th><th>Отделение</th><th>Был</th><th>Контроль</th><th class="r">Дней</th><th>Трансфер</th><th></th></tr></thead><tbody>${L.map(([p,due,d])=>`<tr onclick="openPat('${p.id}')"><td><b>${esc(p.n.split(' ').slice(0,2).join(' '))}</b><span class="sub">${p.age} лет</span></td><td>${esc(p.dx)}</td><td>${depm(p.dep)}</td><td class="mono">${dl(p.last)}</td><td class="mono">${dl(due)}</td><td class="r mono ${d<0?'neg':d<=14?'warnt':''}"><b>${d}</b></td><td>${p.transfer?'да':'—'}</td><td>${p.stage==='repeat'?'<span class="pos">записан</span>':`<button class="bt sm p" onclick="event.stopPropagation();invite('${p.id}')">Пригласить</button>`}</td></tr>`).join('')}</tbody></table></div>
 ${said('«У каждого пациента от тридцати плюс — хронические заболевания… Я хочу оставить этого пациента у себя.»')}`};

/* ===== Отзывы ===== */
SC.feedback=()=>{const prom=FEED.filter(f=>f.nps>=9).length,det=FEED.filter(f=>f.nps<=6).length,nps=Math.round((prom-det)/FEED.length*100);
 return `<div class="hd"><div><h2>Отзывы и NPS</h2><p>После каждого визита и в конце курса пациент в кабинете ставит оценку от 0 до 10 и пишет пару слов. Низкая оценка — сразу задача руководителю: перезвонить и разобраться. Высокая — просьба оставить отзыв в 2ГИС.</p></div></div>
 <div class="wid"><div><small>NPS за сентябрь</small><b class="${nps>=50?'g':'w'}">${nps}</b></div><div><small>Оценок</small><b>${FEED.length}</b></div><div><small>Промоутеры (9–10)</small><b class="g">${prom}</b></div><div><small>Критики (0–6)</small><b class="r">${det}</b></div><div><small>Отзывов в 2ГИС</small><b>+12</b><span>за месяц</span></div></div>
 <div class="g2">${FEED.map(f=>`<div class="pan fb ${f.nps<=6?'bad':''}"><div class="fbh"><b class="nps">${f.nps}</b><div><b>${esc(f.pn||PT(f.p).n.split(' ').slice(0,2).join(' '))}</b><span>${dl(f.d)} · ${esc(DOC(f.doc).s)}</span></div></div><p>«${esc(f.txt)}»</p>${f.ans?`<div class="note" style="--tone:var(--ok)"><b>Что сделали</b><p>${esc(f.ans)}</p></div>`:''}</div>`).join('')}</div>`};

/* ===== Кабинет пациента ===== */
let cabDone={a:true,b:false,c:false};
SC.cabinet=()=>`<div class="hd"><div><h2>Кабинет пациента</h2><p>Отдельное приложение пока не нужно: пациент получает ссылку в WhatsApp один раз, открывает её в браузере и сохраняет на экран телефона. Внутри — план на сегодня, записи, трансфер, результаты и связь с отделом заботы. Крупные буквы и кнопки — для пациентов старшего возраста.</p></div><div class="btns"><button class="bt" onclick="cabLink('P08')">Отправить ссылку Ивановой Т. Н.</button></div></div>
 <div class="phones">
  <div class="phone big"><div class="pht"><b>Здравствуйте, Нурлан!</b><small>после септопластики · день 7 из 14</small></div><div class="pb"><div class="cabh">Сегодня</div>
   ${[['a','08:00','Промывка носа — утро'],['b','14:00','Промывка носа — день'],['c','20:00','Промывка носа — вечер']].map(([k,t,x])=>`<div class="cabi ${cabDone[k]?'ok':''}" onclick="cabDone.${k}=!cabDone.${k};render()"><span>${t}</span><b>${x}</b><i>${cabDone[k]?'✓ Сделал':'Отметить'}</i></div>`).join('')}
   <div class="cabn"><b>13:00 · осмотр хирурга</b><span>Байжанов Е. С. · операционная</span></div><div class="pbtn" onclick="toast('Вопрос ушёл координатору заботы — ответ придёт сюда же.')">Задать вопрос врачу</div></div></div>
  <div class="phone big"><div class="pht"><b>Галина Ивановна</b><small>слуховые аппараты · настройка</small></div><div class="pb"><div class="cabh">Ваши записи</div><div class="cabn"><b>Сегодня, 14:30 · настройка</b><span>Ким Е. В. · каб. 3</span></div><div class="cabn car"><b>Машина заберёт в 13:45</b><span>ул. Сыганак, 25 · водитель Серик</span></div><div class="cabh">Батарейки</div><div class="cabn"><b>Замена 05.10</b><span>напомним накануне</span></div><div class="pbtn" onclick="toast('Перенос записи: выберите удобное время — администратор подтвердит.')">Перенести запись</div></div></div>
  <div class="phone big"><div class="pht"><b>Как прошёл визит?</b><small>Оспанова Г. А. · курс завершён</small></div><div class="pb"><div class="npsr">${[0,1,2,3,4,5,6,7,8,9,10].map(n=>`<span class="${n===10?'on':''}">${n}</span>`).join('')}</div><div class="cabh">Результаты</div><div class="file"><i>PDF</i><div><b>Заключение ЛОР</b><span>30.09.2026</span></div></div><div class="cabh">Следующий контроль</div><div class="cabn"><b>30 декабря</b><span>напомним за 2 недели</span></div><div class="pbtn" onclick="toast('Спасибо! Отзыв в 2ГИС — по ссылке.')">Отправить оценку</div></div></div>
 </div>
 <div class="g3"><div class="note"><b>Почему не приложение сразу</b><p>Приложение в App Store и Google Play — это массовость: сотни пациентов в день и телемедицина. Для одной клиники кабинет по ссылке даёт то же самое и входит в стандартный пакет.</p></div><div class="note"><b>Уведомления</b><p>Кабинет сохраняется на экран телефона и присылает уведомления сам — без платных сообщений WhatsApp за каждое напоминание.</p></div><div class="note"><b>Что видит клиника</b><p>Каждое действие пациента: открыл, отметил, пропустил, спросил. Вы видите весь путь лечения, а не только визиты.</p></div></div>
 ${said('«Чтобы он видел, что ему пить, а мы видели все пути его действий… через приложение, чтобы не было дорого.»')}`;

/* ===== Воронка новых ===== */
const LNEXT={new:'contact',contact:'booked',booked:'came',came:'bought',think:'booked'};
function leadAdv(id){const l=LEADS.find(x=>x.id===id);const n=LNEXT[l.st];if(!n)return;l.st=n;render();toast(n==='bought'?`${esc(l.n)} купил(а) — карточка передана в отдел заботы, координатор Гульмира. В продажах больше не висит.`:`${esc(l.n)}: «${esc(LST.find(s=>s.k===n).n)}».`)}
SC.funnel=()=>`<div class="hd"><div><h2>Воронка новых обращений</h2><p>Только новые: Instagram, 2ГИС, сайт, наружная реклама, сарафан. Цель воронки — довести до первого визита и покупки. Купил — пациент уходит в отдел заботы, а не остаётся «сделкой» в продажах.</p></div><div class="btns"><button class="bt p" onclick="card('newlead')">+ Обращение</button></div></div>
 <div class="board">${LST.map(s=>{const C=LEADS.filter(l=>l.st===s.k);return `<div class="bcol"><div class="bh" style="--c:${s.c}"><b>${s.n}</b><span>${C.length} · ${fmt(C.reduce((a,l)=>a+l.sum,0))} ₸</span></div>${C.map(l=>`<div class="oc"><div class="ocb"><span class="src">${esc(l.src)}</span><span class="mono">${l.age} ${plural(l.age,['год','года','лет'])}</span></div><b>${esc(l.n)}</b><span>${esc(l.want)}</span>${l.why?`<span class="ocw">${esc(l.why)}</span>`:''}<div class="ocf"><strong>${fmt(l.sum)} ₸</strong><em>${STAFF[l.mgr]}</em></div>${LNEXT[l.st]?`<div class="ocbtn"><button class="bt sm p" onclick="leadAdv('${l.id}')">${{new:'Связались',contact:'Записать',booked:'Пришёл',came:'Купил',think:'Записать'}[l.st]}</button></div>`:''}</div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>`;

/* ===== Звонки и разбор ===== */
let curCall='C1';
SC.calls=()=>{const c=CALLS.find(x=>x.id===curCall)||CALLS[0];
 return `<div class="hd"><div><h2>Звонки и разбор</h2><p>IP-телефония в системе: каждый звонок записан и привязан к пациенту. По каждому менеджеру видно, сколько звонков дошло до записи, визита и покупки, и на каком шаге разговор «сливается». Не чтобы наказать — чтобы понять, чему учить.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th class="r">Звонков</th><th class="r">Разговоров</th><th class="r">Записал</th><th class="r">Пришли</th><th class="r">Купили</th><th>Из разговора в запись</th><th class="r">Оценка звонков</th></tr></thead><tbody>${Object.entries(MGR).map(([k,m])=>`<tr><td><b>${m.n}</b></td><td class="r mono">${m.calls}</td><td class="r mono">${m.talk}</td><td class="r mono">${m.booked}</td><td class="r mono">${m.came}</td><td class="r mono">${m.bought}</td><td><span class="adh">${bar(pct(m.booked,m.talk),pct(m.booked,m.talk)<35?'var(--bad)':'var(--ok)')}<em class="${pct(m.booked,m.talk)<35?'neg':''}">${pct(m.booked,m.talk)}%</em></span></td><td class="r mono ${m.score<70?'neg':''}"><b>${m.score}</b></td></tr>`).join('')}</tbody></table></div>
 <div class="g12" style="margin-top:12px"><div class="pan"><h3>Звонки сегодня</h3>${CALLS.map(x=>`<div class="cl ${x.id===c.id?'on':''}" onclick="curCall='${x.id}';render()"><span class="mono">${x.t}</span><div><b>${esc(x.who)}</b><span>${STAFF[x.mgr]} · ${esc(x.want)} · ${x.dur}</span></div><em class="${x.score<70?'neg':'pos'}">${x.score}</em></div>`).join('')}</div>
 <div class="pan"><h3>Разбор: ${esc(c.who)} · ${STAFF[c.mgr]}</h3><div class="wave">${Array.from({length:64},(_,i)=>`<i style="height:${8+Math.round(Math.abs(Math.sin(i*1.7+c.score))*26)}px"></i>`).join('')}</div><p class="mini" style="margin:6px 0 10px">${c.dur} · ${esc(c.want)} · ${c.res==='booked'?'<b class="pos">записан</b>':c.res==='lost'?'<b class="neg">не записан</b>':'<b class="warnt">перезвонить</b>'}</p>
  ${CHK.map((x,i)=>`<div class="li ${c.chk[i]?'':'r'}"><i>${c.chk[i]?'✓':'×'}</i><span>${x}</span></div>`).join('')}
  ${c.lost?`<div class="note" style="--tone:var(--bad)"><b>Где потеряли пациента</b><p>${esc(c.lost)}</p></div><button class="bt p" style="margin-top:10px" onclick="go('trainer')">Назначить тренажёр по этому шагу</button>`:'<div class="note" style="--tone:var(--ok)"><b>Хороший звонок</b><p>Можно сохранить как образец для новых менеджеров.</p></div>'}</div></div>
 ${said('«Из десяти разговоров восемь он слил, два закрыл — чтобы понимать предметно, кто виноват, и не тыкать его, а взращивать.»')}`};

/* ===== Найм и тренажёр ===== */
const CNST={offer:['Оффер','#3e7d4e'],trainer:['Тренажёр','#2f6f9e'],interview:['Интервью','#a87a1e'],reject:['Не прошёл','#8a8f98']};
SC.trainer=()=>`<div class="hd"><div><h2>Найм и тренажёр менеджеров</h2><p>Хороший менеджер начинается с найма. Кандидат проходит тест по ссылке за 15 минут, затем тест на логику — на интервью приходят единицы из сотен откликов. На стажировке — тренажёр на реальных сценариях клиники: допуск к звонкам с 90 баллов из 100.</p></div><div class="btns"><button class="bt" onclick="act('testlink')">Скопировать ссылку на тест</button></div></div>
 <div class="hfun">${[['200','откликов'],['20','прошли тест'],['5','прошли логику'],['3','на стажировке'],['1','допущен к звонкам']].map((x,i)=>`<div style="--w:${100-i*17}%"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Кандидаты</h3><div class="tw"><table class="t"><thead><tr><th>Кандидат</th><th>Откуда</th><th class="r">Тест</th><th class="r">Логика</th><th class="r">Тренажёр</th><th>Статус</th></tr></thead><tbody>${CANDS.map(c=>`<tr><td>${esc(c.n)}</td><td>${esc(c.src)}</td><td class="r mono ${c.test<80?'neg':''}">${c.test}</td><td class="r mono ${c.iq<120?'neg':''}">${c.iq}</td><td class="r mono">${c.trainer==null?'—':c.trainer}</td><td><span class="st" style="--sc:${CNST[c.st][1]}">${CNST[c.st][0]}</span></td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Сценарии тренажёра</h3><p>Менеджер разговаривает с «пациентом» по сценарию, система оценивает каждый шаг. Средний балл команды:</p>${SCEN.map(s=>`<div class="fr"><span>${esc(s[0])}<span class="sub">${esc(s[1])}</span></span>${bar(s[2],s[2]<70?'var(--bad)':s[2]<85?'var(--warn)':'var(--ok)')}<b>${s[2]}</b></div>`).join('')}</div></div>
 <div class="note"><b>Отдельный модуль</b><p>Тесты и тренажёр мы уже сделали и используем для своего найма. Для клиники адаптируем под ваши сценарии — считается отдельно, по часам, один раз; ежемесячной платы нет.</p></div>`;

/* ===== Прайс и абонементы ===== */
SC.price=()=>`<div class="hd"><div><h2>Прайс и абонементы</h2><p>Один прайс на всю клинику: администратор, менеджер и кабинет пациента видят одинаковые цены. Абонементы превращают разовый визит в курс — и пациент автоматически попадает в отдел заботы.</p></div><div class="btns"><button class="bt" onclick="card('ord','№ 46-П')">Приказ о новом прайсе</button></div></div>
 <div class="abons">${ABON.map(a=>`<div class="abon" style="--c:${a.c}"><small>абонемент</small><b>${esc(a.n)}</b><span>${esc(a.what)}</span><strong>${a.price?tg(a.price):esc(a.note)}</strong><em>продано ${a.sold}</em></div>`).join('')}</div>
 <div class="g3">${['lor','surd','oto','hir','care'].map(k=>`<div class="pan"><h3>${depm(k)}</h3>${PRICE.filter(x=>x[0]===k).map(x=>`<div class="kv"><span>${esc(x[1])}</span><b class="mono">${x[2]?fmt(x[2]):'входит'}</b></div>`).join('')}</div>`).join('')}</div>`;

/* ===== Маркетинг ===== */
const SRC=[['Сарафан',38,31,21,8400000,0],['2ГИС',64,41,22,2100000,180000],['Instagram',92,37,15,3900000,450000],['Сайт',41,24,11,1900000,120000],['Наружная реклама',18,9,5,2300000,250000]];
SC.marketing=()=>`<div class="hd"><div><h2>Маркетинг и источники</h2><p>Откуда приходят пациенты и сколько стоит каждый. Видно не только заявки, но и визиты, покупки и выручку до конца — включая повторные визиты и аппараты через месяц.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Источник</th><th class="r">Обращений</th><th class="r">Пришли</th><th class="r">Купили</th><th class="r">Выручка</th><th class="r">Расход</th><th class="r">Стоимость пациента</th><th class="r">Окупаемость</th></tr></thead><tbody>${SRC.map(s=>`<tr><td><b>${s[0]}</b></td><td class="r mono">${s[1]}</td><td class="r mono">${s[2]}</td><td class="r mono">${s[3]}</td><td class="r mono">${fmt(s[4])}</td><td class="r mono">${s[5]?fmt(s[5]):'—'}</td><td class="r mono">${s[5]?fmt(s[5]/s[2]):'—'}</td><td class="r mono ${s[5]&&s[4]/s[5]<5?'warnt':'pos'}">${s[5]?'×'+Math.round(s[4]/s[5]):'∞'}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Возраст пациентов</h3>${[['до 30',9],['30–45',22],['45–60',27],['60–75',31],['75+',11]].map(x=>`<div class="fr"><span>${x[0]}</span>${bar(x[1]*3)}<b>${x[1]}%</b></div>`).join('')}<p class="mini" style="margin-top:8px">Аудитория старше — поэтому трансфер, крупный кабинет и звонок дочери или сыну с разрешения пациента.</p></div>
 <div class="pan"><h3>Районы Астаны</h3>${[['Есиль',26],['Алматы',24],['Сарыарка',19],['Байконыр',17],['Нура',9],['Пригород',5]].map(x=>`<div class="fr"><span>${x[0]}</span>${bar(x[1]*3,'var(--brand2)')}<b>${x[1]}%</b></div>`).join('')}</div></div>`;

/* ===== Дашборд руководителя ===== */
const WEEKS=[['01.09',62,71,48],['08.09',65,74,51],['15.09',70,78,55],['22.09',74,83,58],['29.09',79,86,61]];
SC.dash=()=>`<div class="hd"><div><h2>Дашборд руководителя · сентябрь</h2><p>Не только выручка и новые пациенты, а то, ради чего строится забота: доходят ли записанные, возвращаются ли пациенты, выполняют ли лечение. Цифры появляются сами из записи, планов и кассы — без отчётов в Excel.</p></div><div class="btns"><button class="bt" onclick="act('report')">Отчёт в WhatsApp каждый вечер</button></div></div>
 <div class="wid"><div><small>Выручка за месяц</small><b class="a">18,6 млн</b><span>+14% к августу</span></div><div><small>Доходимость</small><b class="g">86%</b><span>записался → пришёл</span></div><div><small>Возвращаемость</small><b class="g">61%</b><span>пришли повторно за 90 дней</span></div><div><small>Курсы до конца</small><b>74%</b><span>выполнили план полностью</span></div><div><small>NPS</small><b class="g">${Math.round((FEED.filter(f=>f.nps>=9).length-FEED.filter(f=>f.nps<=6).length)/FEED.length*100)}</b><span>${FEED.length} оценок</span></div></div>
 <div class="g2"><div class="pan"><h3>Пять недель заботы</h3><p>С запуском отдела заботы растут все три показателя.</p><div class="wk">${WEEKS.map(w=>`<div class="wkc"><div class="wkb"><i style="height:${w[1]}%;background:var(--brand)"></i><i style="height:${w[2]}%;background:var(--ok)"></i><i style="height:${w[3]}%;background:var(--brand2)"></i></div><small>${w[0]}</small></div>`).join('')}</div><div class="legend"><span><i style="background:var(--brand)"></i>дисциплина по планам, %</span><span><i style="background:var(--ok)"></i>доходимость, %</span><span><i style="background:var(--brand2)"></i>возвращаемость, %</span></div></div>
 <div class="pan"><h3>Выручка по отделениям</h3>${[['lor',6.2],['surd',8.1],['oto',1.4],['hir',2.9]].map(x=>`<div class="fr"><span>${depm(x[0])}</span>${bar(x[1]/8.1*100,DEPS[x[0]].c)}<b>${x[1].toString().replace('.',',')} млн</b></div>`).join('')}
  <div class="split2"><div><small>От действующих пациентов</small><b>57%</b><span>курсы, контроль, настройки, абонементы</span></div><div><small>От новых</small><b>43%</b><span>первый визит, операции, аппараты</span></div></div></div></div>
 <div class="g3"><div class="pan"><h3>Врачи</h3>${DOCS.map(d=>`<div class="kv"><span>${esc(d.s)}</span><b class="mono">${{D1:'96%',D2:'91%',D3:'98%',D4:'84%',D5:'100%',D6:'93%'}[d.id]} загрузка</b></div>`).join('')}</div>
 <div class="pan"><h3>Продажи</h3>${Object.values(MGR).map(m=>`<div class="kv"><span>${m.n}</span><b class="mono">${pct(m.booked,m.talk)}% в запись · ${m.bought} покупок</b></div>`).join('')}</div>
 <div class="pan"><h3>Забота</h3>${[['Пациентов на курсах',PLANS.length],['В риске',PATIENTS.filter(p=>p.stage==='risk').length],['Просрочен контроль',PATIENTS.filter(p=>p.chronic&&daysBetween(p.last,TODAY)>365).length],['Напоминаний за месяц','1 284']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="mono">${x[1]}</b></div>`).join('')}</div></div>
 ${said('«Вытаскиваем цифры дашборда… чтобы главврачи или директора уже не были слепыми во взаимодействии со своими пациентами.»')}`;

/* ===== Касса ===== */
SC.money=()=>{const tot=PAYS.reduce((s,p)=>s+p[4],0);const byM={};PAYS.forEach(p=>byM[p[3]]=(byM[p[3]]||0)+p[4]);
 return `<div class="hd"><div><h2>Касса и оплаты · сегодня</h2><p>Оплата привязана к визиту и отделению: видно, что оплачено деньгами, что списано с абонемента, что в рассрочку. Закрытие смены — сверка с терминалом и Kaspi.</p></div><div class="btns"><button class="bt" onclick="act('z')">Закрыть смену</button></div></div>
 <div class="wid"><div><small>Оплачено сегодня</small><b class="a">${tg(tot)}</b></div>${Object.entries(byM).map(([k,v])=>`<div><small>${esc(k)}</small><b>${v?tg(v):PAYS.filter(p=>p[3]===k).length+' визита'}</b></div>`).join('')}</div>
 <div class="tw"><table class="t"><thead><tr><th>Время</th><th>Пациент и услуга</th><th>Отделение</th><th>Способ</th><th class="r">Сумма</th></tr></thead><tbody>${PAYS.slice().sort((a,b)=>a[0]<b[0]?-1:1).map(p=>`<tr ${p[1]!=='X'?`onclick="openPat('${p[1]}')"`:''}><td class="mono">${p[0]}</td><td>${p[1]!=='X'?esc(PT(p[1]).n.split(' ').slice(0,2).join(' '))+' · ':''}${esc(p[2])}</td><td>${depm(p[5])}</td><td>${esc(p[3])}</td><td class="r mono">${p[4]?fmt(p[4]):'абонемент'}</td></tr>`).join('')}<tr class="total"><td colspan="4">Итого</td><td class="r mono">${fmt(tot)}</td></tr></tbody></table></div>`};

/* ===== Приказы ===== */
function signOrd(no){const o=ORDERS.find(x=>x.no===no);const me=ROLES[role].p;if(!o.need.includes(me)){toast('Ваша подпись под этим приказом не нужна — подписывают '+o.need.map(x=>STAFF[x]).join(' и ')+'.');return}if(!o.sign.includes(me))o.sign.push(me);if(o.need.every(x=>o.sign.includes(x)))o.st='ack';render();if(document.getElementById('mbg').classList.contains('show'))card('ord',no);toast(o.st==='ack'?'Приказ подписан и разослан сотрудникам — каждый отметит «ознакомлен».':'Подпись поставлена, ждём остальных.')}
SC.docs=()=>`<div class="hd"><div><h2>Приказы и подписи</h2><p>Приказы, положения и регламенты — внутри системы: подготовили, подписали электронно, разослали, сотрудники отметили «ознакомлен». Не нужны отдельные платформы для подписи и папки с бумагами.</p></div><div class="btns"><button class="bt p" onclick="card('neword')">+ Приказ</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Номер</th><th>Дата</th><th>О чём</th><th>Подписи</th><th>Ознакомлены</th><th>Статус</th><th></th></tr></thead><tbody>${ORDERS.map(o=>`<tr onclick="card('ord','${o.no}')"><td class="mono"><b>${esc(o.no)}</b></td><td class="mono">${dd(o.d)}</td><td>${esc(o.t)}</td><td>${o.need.map(x=>`<span class="sig ${o.sign.includes(x)?'ok':''}">${esc(STAFF[x].split(' ')[0])}</span>`).join(' ')}</td><td><span class="adh">${bar(pct(o.ack[0],o.ack[1]))}<em>${o.ack[0]}/${o.ack[1]}</em></span></td><td>${o.st==='sign'?'<span class="warnt">на подписи</span>':o.st==='ack'?'<span class="acc">знакомятся</span>':'<span class="pos">исполнен</span>'}</td><td>${o.st==='sign'?`<button class="bt sm p" onclick="event.stopPropagation();signOrd('${o.no}')">Подписать</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 ${said('«У всех отчёты отдельно в Excel, а для того, чтобы подписывать приказы, создаются какие-то платформы. Хочется, чтобы было всё в одном и понимали все.»')}`;

/* ===== Отчёты ===== */
let repSel='doc';
const REPS={doc:['Выручка и приёмы по врачам',['Врач','Приёмов','Новых','Повторных','Выручка'],[['Сейткали Д. М.',214,71,143,'3 410 000'],['Ахметова Ж. Е.',198,64,134,'2 790 000'],['Ким Е. В.',121,52,69,'5 260 000'],['Нурпеисов А. Б.',88,41,47,'1 380 000'],['Байжанов Е. С.',46,19,27,'2 940 000'],['Смагулова А.',73,30,43,'2 820 000']]],
 course:['Курсы лечения и дисциплина',['Отделение','Курсов','Завершено','Дисциплина','Вернулись на контроль'],[['ЛОР',58,44,'84%','71%'],['Сурдология',22,19,'90%','93%'],['Отоневрология',14,9,'72%','58%'],['Хирургия',11,11,'95%','100%']]],
 dev:['Продажи слуховых аппаратов',['Модель','Продано','Пробное → покупка','Сумма','Настройки вовремя'],[['«Базовый»',4,'67%','1 120 000','100%'],['«Комфорт»',7,'78%','3 640 000','93%'],['«Премиум»',3,'60%','2 670 000','100%']]],
 src:['Источники пациентов',['Источник','Обращений','Пришли','Купили','Выручка'],SRC.map(s=>[s[0],s[1],s[2],s[3],fmt(s[4])])]};
SC.reports=()=>{const r=REPS[repSel];
 return `<div class="hd"><div><h2>Отчёты</h2><p>Отчёты строятся из того, что сотрудники и так делают в системе: запись, приём, план, оплата, звонок. Выбрал период и отделение — получил таблицу; выгрузка в Excel и PDF одной кнопкой, если нужно отправить.</p></div><div class="btns"><button class="bt" onclick="act('xls')">Выгрузить в Excel</button><button class="bt" onclick="act('pdf')">PDF</button></div></div>
 <div class="reps">${Object.entries(REPS).map(([k,v])=>`<div class="rep ${k===repSel?'on':''}" onclick="repSel='${k}';render()"><b>${esc(v[0])}</b><span>сентябрь 2026 · вся клиника</span></div>`).join('')}</div>
 <div class="pan"><h3>${esc(r[0])} · сентябрь 2026</h3><div class="tw"><table class="t"><thead><tr>${r[1].map((h,i)=>`<th class="${i?'r':''}">${h}</th>`).join('')}</tr></thead><tbody>${r[2].map(row=>`<tr>${row.map((c,i)=>`<td class="${i?'r mono':''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
 ${said('«Максимально удобно — чтобы не нужен был тяжёлый переход туда-сюда.»')}`};

/* ===== Филиалы и развитие ===== */
let BR=[{n:'Астана · основной',addr:'пр. Туран, 37',st:'live',staff:14,docs:6}];
function addBranch(){if(BR.length>1){toast('Филиал уже добавлен — в демо достаточно одного примера.');return}BR.push({n:'Астана · Сарыарка',addr:'ул. Сейфуллина, 12',st:'new',staff:0,docs:0});render();toast('Филиал создан: свои кабинеты, расписание, касса и роли. Пациенты и прайс — общие, отчёты — по каждому и вместе.')}
SC.growth=()=>`<div class="hd"><div><h2>Филиалы и развитие</h2><p>Сейчас система делается для одной клиники. Если филиальную сеть заложить с самого начала — новый филиал появляется кнопкой: свои врачи, расписание, касса и команда, общая база пациентов и сводные отчёты.</p></div><div class="btns"><button class="bt p" onclick="addBranch()">+ Филиал</button></div></div>
 <div class="brs">${BR.map(b=>`<div class="br ${b.st}"><small>${b.st==='live'?'работает':'новый'}</small><b>${esc(b.n)}</b><span>${esc(b.addr)}</span><div class="kv"><span>Сотрудников</span><b>${b.staff}</b></div><div class="kv"><span>Врачей</span><b>${b.docs}</b></div></div>`).join('')}<div class="br plan" onclick="addBranch()"><small>следующий</small><b>+ филиал</b><span>появляется за минуту, если сеть заложена сейчас</span></div></div>
 <div class="g3"><div class="pan opt"><small>Вариант 1 · сейчас</small><h3>Одна клиника</h3><b>2 500 000 ₸</b><p>Стандартный пакет: всё, что в этом демо, включая кабинет пациента по ссылке.</p></div>
 <div class="pan opt"><small>Вариант 2 · если закладываем сеть</small><h3>Филиальная сеть</h3><b>≈ 3 750 000 ₸</b><p>Примерно ×1,5 к пакету: филиалы, свои команды и роли, сводная аналитика. Дешевле, чем переделывать потом.</p></div>
 <div class="pan opt"><small>Позже · по желанию</small><h3>Приложение и телемедицина</h3><b>3 000 000 ₸</b><p>iOS и Android, когда появится массовость: онлайн-консультации, оплата, запись. Телемедицина загружает текущих врачей без новых кабинетов.</p></div></div>
 <div class="note"><b>Платформа для других клиник</b><p>Подключать сторонние медцентры как отдельных клиентов — это другая архитектура. Обсудим отдельно, когда система отработает у вас.</p></div>
 ${said('«Есть амбиции, есть желание открывать филиалы… Можем ли мы заводить других, помимо своих филиалов?»')}`;

/* ===== Роли ===== */
SC.roles=()=>{const areas=[['Расписание и запись',['AK','GV','DN','DS','EK']],['Карта пациента',['AK','GV','DS','EK','DN','GM']],['Назначение планов лечения',['AK','GV','DS','EK']],['Отдел заботы и напоминания',['AK','GM']],['Воронка и звонки',['AK','AB']],['Касса',['AK','DN']],['Приказы — подпись',['AK','GV']],['Дашборд и отчёты',['AK','GV']]];const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и права</h2><p>Врач видит своих пациентов и назначает лечение; администратор — запись, кассу и трансфер; забота — действующих пациентов; продажи — новых, без медицинских подробностей. Руководитель видит всё и меняет права сам.</p></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Что можно</th>${R.map(([k,v])=>`<th class="c">${esc(v.av)}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>${areas.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1].includes(v.p)?'<b class="pos">●</b>':'<span class="mini">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="g2" style="margin-top:12px">${R.map(([k,v])=>`<div class="pan"><h3>${esc(k)} · ${esc(v.n)}</h3><p>${esc(v.note)}</p><span class="mini">${v.s.length} ${plural(v.s.length,['экран','экрана','экранов'])}</span></div>`).join('')}</div>`};

/* ===== Запуск и стоимость ===== */
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки — 2 500 000 ₸, один раз, без абонентской платы. Обычно 4–6 недель; вы торопитесь — делаем за 3–4 недели, ускорение отдельно не считаем. Ядро — первые 2 недели.</p></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>250 000 ₸</b><span>начинаем работу</span></div><div><small>Ядро · 45%</small><b>1 125 000 ₸</b><span>после приёмки ядра</span></div><div><small>Сдача · 45%</small><b>1 125 000 ₸</b><span>после полировки и приёмки</span></div></div>
 <div class="note" style="--tone:var(--ok)"><b>Скидка за скорость — 10%</b><p>Если договор подписан в течение 3 дней после согласования ТЗ — 2 250 000 ₸ вместо 2 500 000 ₸.</p></div>
 <div class="g2" style="margin-top:12px"><div class="pan"><h3>Ядро — первые 2 недели</h3>${['Пациенты и карта, перенос базы из текущей CRM','Расписание врачей, запись, трансфер','Планы лечения и напоминания в кабинет пациента','Отдел заботы: курс, контроль, риск, повторный визит','Воронка новых обращений, касса, роли'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Полировка — до сдачи</h3>${['Слух и аппараты, аудиограммы','Хронические и контроль, отзывы и NPS','IP-телефония и разбор звонков','Приказы с подписью, отчёты, дашборд','WhatsApp: ссылка на кабинет и важные сообщения'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div></div>
 <div class="g2"><div class="pan"><h3>Отдельно, по желанию</h3>${[['Филиальная сеть с начала','≈ ×1,5 → 3 750 000 ₸'],['Приложение iOS и Android, телемедицина','3 000 000 ₸'],['Найм: тесты и тренажёр менеджеров','по часам, один раз']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>После запуска</h3><p class="mini">Доработки — 20 $ в час, считаем заранее: «такая-то функция — 15 часов». Если развитие идёт постоянно — подписка порядка 200 000 ₸ в месяц, так час выходит дешевле. Код и права ваши.</p></div></div>
 ${said('«Говорите прямо: это займёт два месяца… Мы хотим где-то до пятнадцатого запустить и посмотреть, насколько это ускорит доходимость и приходимость.»','Прямо: ядро — 2 недели после старта, вся система — 3–4 недели. ТЗ от вас — за 2–3 дня, оценку даём в понедельник.')}`;

/* ===== Карточки ===== */
const CARD={};
CARD.pat=id=>{const p=PT(id);const l=planOf(id);return [esc(p.n),`${p.age} лет · ${esc(p.dx)} · ${esc(DOC(p.doc).s)}`,`<div class="g2"><div class="pan"><h3>Пациент</h3>${[['Телефон',esc(p.ph)],['Отделение',DEPS[p.dep].n],['Стадия',CSTOF(p.stage).n],['Был',dl(p.last)],['Следующий',p.next?dl(p.next):'не записан'],['Кабинет',p.cab?'подключён':'нет']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div><div class="pan"><h3>План</h3>${l?l.steps.map(s=>`<div class="kv"><span>${esc(s.t)}</span><b>${s.tot?s.done+'/'+s.tot:dd(s.date)}</b></div>`).join(''):'<p class="mini">Нет плана.</p>'}</div></div>`]};
CARD.appt=id=>{const a=APPTS.find(x=>x.id===id);const d=DOC(a.doc);return [`${a.t} · ${esc(apN(a))}`,`${esc(d.n)} · ${esc(DEPS[d.dep].n)} · ${esc(d.room)}`,`<div class="pan"><h3>${esc(a.svc)}</h3>${[['Статус',AST[a.st].n],['Длительность',a.dur+' мин'],['Трансфер',a.tr?'да, машина заберёт за 40 минут':'нет']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}<div class="btns l" style="margin-top:12px">${a.st==='plan'?`<button class="bt w" onclick="setAppt('${id}','wait')">Пришёл, в холле</button><button class="bt" onclick="setAppt('${id}','noshow')">Не пришёл</button>`:''}${a.st==='wait'?`<button class="bt p" onclick="setAppt('${id}','in')">Пригласить на приём</button>`:''}${a.st==='in'?`<button class="bt g" onclick="setAppt('${id}','done')">Приём завершён</button>`:''}${a.p&&PT(a.p)?`<button class="bt" onclick="closeM();openPat('${a.p}')">Карта пациента</button>`:''}</div></div>`]};
CARD.newappt=x=>{const [dId,t]=(x||'').split('|');const pre=PT(t)?t:'';const tm=pre?'16:30':(t||'15:00');return ['Новая запись','Пациент, врач, время, трансфер',`<div class="form"><label>Пациент<select id="na_p"><option value="">Новый пациент…</option>${PATIENTS.map(p=>`<option value="${p.id}" ${p.id===pre?'selected':''}>${esc(p.n)}</option>`).join('')}</select></label><label>Врач<select id="na_d">${DOCS.map(d=>`<option value="${d.id}" ${d.id===(dId||(pre?PT(pre).doc:''))?'selected':''}>${esc(d.s)} · ${esc(DEPS[d.dep].n)}</option>`).join('')}</select></label><label>Время<select id="na_t">${SLOTS.map(s=>`<option ${s===tm?'selected':''}>${s}</option>`).join('')}</select></label><label>Услуга<select id="na_s">${PRICE.filter(p=>p[2]<100000).map(p=>`<option>${esc(p[1])}</option>`).join('')}</select></label><label>Трансфер<select id="na_tr"><option value="">не нужен</option><option value="1">нужен — заберём за 40 минут</option></select></label><label>Напоминание<select><option>в кабинет за день и за 2 часа</option><option>в WhatsApp за день</option></select></label></div><button class="bt p" onclick="newAppt()">Записать</button>`]};
function newAppt(){const v=i=>document.getElementById(i).value;const p=v('na_p'),d=v('na_d'),t=v('na_t');if(APPTS.some(a=>a.doc===d&&a.t===t)){toast('Это время у врача уже занято — выберите другое.');return}APPTS.push({id:'A'+(APPTS.length+1),doc:d,t,dur:30,p:p||'X',pn:p?'':'Новый пациент',svc:v('na_s'),st:'plan',tr:!!v('na_tr')});if(v('na_tr'))TRIPS.push({id:'T'+(TRIPS.length+1),t:'—',p:p||'',pn:p?'':'Новый пациент',addr:'адрес из карты',to:t+' · '+DOC(d).s,st:'plan',late:0});closeM();cur='schedule';schDoc='all';schDep='all';build();toast(`Записано: ${t}, ${esc(DOC(d).s)}.${v('na_tr')?' Трансфер добавлен в маршрут водителя.':''} Пациенту — подтверждение в кабинет.`)}
CARD.plan=id=>{const l=PLANS.find(x=>x.id===id),p=PT(l.p);return [`План лечения · ${esc(p.n.split(' ').slice(0,2).join(' '))}`,`${esc(p.dx)} · ${esc(DOC(l.doc).s)} · с ${dl(l.start)}, ${l.days} дн.`,`<div class="pan"><h3>${esc(l.goal)}</h3>${l.steps.map(s=>`<div class="stepr"><span class="kd k-${s.kind}">${KIND[s.kind]}</span><div><b>${esc(s.t)}</b><span>${s.freq?esc(s.freq):dl(s.date)}${s.miss?' · пропущено '+s.miss:''}</span></div><div class="stprog">${s.tot?bar(pct(s.done,s.tot))+'<em>'+s.done+'/'+s.tot+'</em>':''}</div></div>`).join('')}</div><div class="pan"><h3>Дисциплина по дням</h3><div class="days14">${Array.from({length:14},(_,i)=>{const miss=(i===4&&l.p!=='P11')||(l.p==='P04'&&[6,7,8,10].includes(i));const fut=i>9;return `<i class="${fut?'f':miss?'m':'ok'}" title="день ${i+1}"></i>`}).join('')}</div><div class="legend"><span><i style="background:var(--ok)"></i>выполнил</span><span><i style="background:var(--bad)"></i>пропустил</span><span><i style="background:var(--card3)"></i>впереди</span></div></div>`]};
CARD.newplan=pid=>{const p=PT(pid)||PATIENTS[5];return ['Назначить план лечения',`${esc(p.n)} · ${esc(p.dx)}`,`<div class="form"><label>Шаблон<select id="np_t"><option>Острый отит: капли 7 дней + контроль</option><option>Хр. тонзиллит: «Тонзиллор» × 10 + полоскание 14 дн.</option><option>Синусит: «кукушка» × 5 + спрей</option></select></label><label>Длительность, дней<input id="np_d" value="7"></label><label>Дома<input value="Капли в ухо — 3 раза в день"></label><label>Контроль<input value="${dl(addDays(TODAY,7))}"></label></div><button class="bt p" onclick="newPlan('${p.id}')">Назначить и отправить в кабинет</button>`]};
function newPlan(pid){const p=PT(pid);if(!planOf(pid))PLANS.push({id:'L'+(PLANS.length+1),p:pid,doc:p.doc,start:TODAY,days:+document.getElementById('np_d').value||7,goal:'Вылечить без осложнений',steps:[{t:'Капли в ухо',kind:'home',freq:'3 раза в день · 7 дней',tot:7,done:0},{t:'Контроль ЛОР',kind:'visit',date:addDays(TODAY,7)}]});p.stage='course';p.cab=true;closeM();render();toast(`План назначен. ${esc(p.n.split(' ').slice(0,2).join(' '))} получил ссылку на кабинет, отдел заботы видит пациента в «Курс идёт».`)}
CARD.newpat=()=>['Новый пациент','Карта создаётся один раз на всю клинику',`<div class="form"><label>ФИО<input id="nw_n" value="Ермеков Даулет Асанович"></label><label>Телефон<input id="nw_ph" value="+7 701 555 20 20"></label><label>Возраст<input id="nw_a" value="44"></label><label>Откуда узнал<select id="nw_s"><option>Instagram</option><option>2ГИС</option><option>Сарафан</option><option>Сайт</option></select></label></div><button class="bt p" onclick="newPat()">Создать карту</button>`];
function newPat(){const v=i=>document.getElementById(i).value;const id='P'+(PATIENTS.length+1);PATIENTS.push({id,n:v('nw_n'),age:+v('nw_a')||40,ph:v('nw_ph'),dep:'lor',doc:'D1',dx:'Первичное обращение',icd:'—',stage:'new',src:v('nw_s'),since:TODAY,ltv:0,last:TODAY,next:'',chronic:false,cab:false});curPat=id;closeM();go('card');toast('Карта создана. Отправьте ссылку на кабинет — и пациент получит подтверждение записи.')}
CARD.newlead=()=>['Новое обращение','Источник, интерес, менеджер',`<div class="form"><label>Имя<input id="nl_n" value="Тлеубаева Сауле"></label><label>Возраст<input id="nl_a" value="64"></label><label>Источник<select id="nl_s"><option>Instagram</option><option>2ГИС</option><option>Сарафан</option><option>Сайт</option><option>Наружная реклама</option></select></label><label>Интерес<select id="nl_w"><option>Проверка слуха</option><option>Консультация ЛОР</option><option>Слуховой аппарат</option><option>Операция</option></select></label></div><button class="bt p" onclick="newLead()">Добавить</button>`];
function newLead(){const v=i=>document.getElementById(i).value;LEADS.unshift({id:'N'+(LEADS.length+1),n:v('nl_n'),age:+v('nl_a')||50,src:v('nl_s'),want:v('nl_w'),st:'new',mgr:'AB',sum:v('nl_w')==='Слуховой аппарат'?520000:15000,d:TODAY});closeM();render();toast('Обращение в воронке, менеджеру — задача перезвонить за 15 минут.')}
CARD.ord=no=>{const o=ORDERS.find(x=>x.no===no);return [`Приказ ${esc(o.no)} от ${dl(o.d)}`,esc(o.t),`<div class="doc"><div class="dh"><div class="dlg">КАМЕРТОН<small>ЛОР-КЛИНИКА И ЦЕНТР СЛУХА · АСТАНА</small></div><div style="text-align:right;font-size:10px">${esc(o.no)}<br>${dl(o.d)}</div></div><h4>ПРИКАЗ</h4><p style="font-size:11.5px;line-height:1.7">${esc(o.t)}.</p><p style="font-size:11px;line-height:1.7">1. Утвердить порядок согласно приложению.<br>2. Ответственным ознакомить сотрудников через систему до ${dl(addDays(o.d,3))}.<br>3. Контроль исполнения оставляю за собой.</p><div class="sgn">${o.need.map(x=>`<span>${esc(STAFF[x])}: ${o.sign.includes(x)?'<b style="color:#3e7d4e">подписано ЭЦП</b>':'<u></u>'}</span>`).join('')}</div><div class="dfoot"><span>Ознакомлены: ${o.ack[0]} из ${o.ack[1]}</span><span>${o.st==='done'?'Исполнен':'В работе'}</span></div></div>${o.st==='sign'?`<button class="bt p" style="margin-top:12px" onclick="signOrd('${o.no}')">Подписать</button>`:''}`]};
CARD.neword=()=>['Новый приказ','Текст, кто подписывает, кого ознакомить',`<div class="form"><label>О чём<input id="no_t" value="О дежурствах отдела заботы в выходные"></label><label>Подписывают<select id="no_s"><option value="AK">Руководитель</option><option value="AK,GV">Руководитель и главный врач</option></select></label><label>Ознакомить<select><option>Всех сотрудников (14)</option><option>Отдел заботы (3)</option><option>Врачей (6)</option></select></label></div><button class="bt p" onclick="newOrd()">Создать и отправить на подпись</button>`];
function newOrd(){const v=i=>document.getElementById(i).value;const n=ORDERS.length+43;ORDERS.unshift({no:'№ '+n+'-П',d:TODAY,t:v('no_t'),who:ROLES[role].p,sign:[],need:v('no_s').split(','),ack:[0,14],st:'sign'});closeM();render();toast('Приказ на подписи — уведомление подписантам.')}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(k){const M={report:'Каждый вечер в 20:00 руководителю: приёмы, доходимость, касса, кто в риске, что подписать.',import:'Перенос из текущей CRM: пациенты, телефоны, визиты, источники — входит в пакет.',nav:'Маршрут построен по адресам пациентов в порядке времени приёма.',z:'Смена закрыта: касса сверена с терминалом и Kaspi.',xls:'Отчёт выгружен в Excel.',pdf:'Отчёт сохранён в PDF.',testlink:'Ссылка на тест скопирована — отправьте кандидату.'};toast(M[k]||'Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const p=PATIENTS.find(x=>(x.n+' '+x.ph+' '+x.dx).toLowerCase().includes(q));if(p){openPat(p.id);return}const l=LEADS.find(x=>x.n.toLowerCase().includes(q));if(l&&allowed('funnel')){go('funnel');return}toast('Не нашлось. Ищите по ФИО, телефону или диагнозу.')}

/* ===== Каркас: шапка, вкладки-папки сверху, док разделов снизу ===== */
const ICON={day:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',pat:'<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/>',care:'<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',sales:'<path d="M5 19V9M10 19V5M15 19v-7M20 19v-4"/>',mgmt:'<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',sys:'<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'};
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const on=SECOF[cur];const cnt={care:PATIENTS.filter(p=>p.stage==='risk').length+REMS.filter(r=>r.st==='nores').length,sales:LEADS.filter(l=>l.st==='new').length,mgmt:ORDERS.filter(o=>o.st==='sign').length};
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="dk ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><svg viewBox="0 0 24 24">${ICON[s.k]}</svg><span>${s.n}</span>${cnt[s.k]?`<em>${cnt[s.k]}</em>`:''}</a>`).join('')}
function buildSub(){const s=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=`<span class="subn">${esc(s.n)}</span>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function buildNow(){const el=document.getElementById('nowc');if(!el)return;const A=APPTS;el.innerHTML=`<i></i>Сейчас: <b>${A.filter(a=>a.st==='in').length}</b> на приёме · <b>${A.filter(a=>a.st==='wait').length}</b> в холле · машина <b>${TRIPS.some(t=>t.st==='way'||t.st==='pick')?'в пути':'на месте'}</b>`}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Камертон';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();buildRail();buildNow();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('schedule')&&role!=='Водитель'?'':'none';try{history.replaceState(null,'','?s='+cur+(cur==='card'?'&p='+curPat:''))}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

const TOUR=[
 ['today','1 · Пульт клиники: каждый врач — кто на приёме, кто в холле, кто следующий. Ниже — что требует внимания.'],
 ['schedule','2 · Расписание по кабинетам: пришёл, на приёме, принят, не пришёл. Клик по пустой ячейке — новая запись.'],
 ['card','3 · Карта пациента: диагноз, история, план лечения с выполнением, аудиограмма, документы.'],
 ['plans','4 · Планы лечения: врач назначает шаги — в клинике и дома, — пациент отмечает «сделал».'],
 ['carefunnel','5 · Отдел заботы: действующие пациенты отдельно от продаж — курс, контроль, риск, повторный визит.'],
 ['remind','6 · Напоминания идут сами — в кабинет бесплатно, в WhatsApp только важное. Нет ответа — звонок.'],
 ['cabinet','7 · Кабинет пациента по ссылке: план на сегодня, записи, машина, результаты, оценка.'],
 ['chronic','8 · Хронические пациенты: система считает, когда каждому пора на контроль, и приглашает.'],
 ['hearing','9 · Слух и аппараты: от аудиометрии до годового контроля — никто не теряется после покупки.'],
 ['transfer','10 · Трансфер: машина забирает за 40 минут до приёма, пациент видит, что она едет.'],
 ['funnel','11 · Воронка новых: купил — ушёл в заботу.'],
 ['calls','12 · Звонки: где менеджер теряет пациента и чему его учить.'],
 ['trainer','13 · Найм и тренажёр: на звонки — только с 90 баллами из 100.'],
 ['dash','14 · Дашборд: доходимость, возвращаемость, дисциплина, выручка от действующих пациентов.'],
 ['docs','15 · Приказы: подпись и «ознакомлен» внутри системы.'],
 ['growth','16 · Филиалы: если заложить сеть сейчас — новый филиал кнопкой.'],
 ['launch','17 · Стоимость: 2,5 млн, 3–4 недели, 10 / 45 / 45, скидка 10% за скорость.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается: запись, приём, план, напоминания, забота, звонки, приказы.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;if(k==='card')curPat='P01';build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='',o='';try{const u=new URLSearchParams(location.search);q=u.get('s')||'';o=u.get('p')||''}catch(e){}if(o&&PT(o))curPat=o;
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
