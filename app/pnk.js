/* ПНК — портал консалтинга и реестра членов Палаты налоговых консультантов.
   Демо-макет по встрече 17 сентября 2026 и ТЗ № TZ-PNK-2026-01.
   Два контура: консалтинг (время → счёт) и Палата (кандидат → член → взнос). */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const mln=n=>num(n/1000000)+' млн';
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const hrs=h=>{const H=Math.floor(h),M=Math.round((h-H)*60);return (H?H+' ч':'')+(M?' '+M+' мин':'')||'0 мин'};

const SEC=[
 {k:'dash', ic:'▦', n:'Пульт',        sub:[['dash','Общая картина'],['today','Что требует решения']]},
 {k:'cli',  ic:'☺', n:'Клиенты',      sub:[['clients','Клиенты и договоры'],['card','Карточка клиента'],['projects','Проекты'],['funnel','Воронки направлений']]},
 {k:'time', ic:'◷', n:'Время',        sub:[['timesheet','Мой таймшит'],['approve','Согласование'],['load','Загрузка сотрудников']]},
 {k:'money',ic:'₸', n:'Отчёты и деньги',sub:[['report','Отчёт клиенту'],['invoices','Счета и дебиторка'],['cost','Себестоимость и маржа']]},
 {k:'hr',   ic:'☗', n:'Сотрудники',   sub:[['me','Кабинет сотрудника'],['tabel','Табель и отпуска'],['tasks','Поручения'],['cal','Календари'],['kpi','Зарплата и KPI']]},
 {k:'doc',  ic:'▤', n:'Документы',    sub:[['journal','Журналы вх. и исх.'],['orders','Приказы и ознакомление']]},
 {k:'pal',  ic:'◈', n:'Палата',       sub:[['members','Реестр членов'],['member','Карточка члена'],['join','Вступление'],['fees','Членские взносы'],['mcab','Кабинет члена'],['library','Разъяснения'],['publicreg','Публичный реестр']]},
 {k:'set',  ic:'⚙', n:'Настройки',    sub:[['roles','Права доступа'],['integr','Интеграции'],['migr','Перенос из старой системы'],['stack','Состав релиза']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));

const ALL=['dash','today','clients','card','projects','funnel','timesheet','approve','load','report','invoices','cost','me','tabel','tasks','cal','kpi','journal','orders','members','member','join','fees','mcab','library','publicreg','roles','integr','migr','stack'];
const ROLES={
 'Руководство':{av:'АГ',n:'Андрей Григорьевич',r:'генеральный директор',note:'Полная картина деятельности всех сотрудников от и до: проекты, время, счета, себестоимость, зарплата, члены Палаты',
  s:ALL},
 'Руководитель подразделения':{av:'ГС',n:'Гульнара С.',r:'налоговое консультирование',note:'Своё подразделение: сотрудники, их время и задачи, согласование отчётов клиентам. Без себестоимости и зарплат других',
  s:['dash','today','clients','card','projects','funnel','timesheet','approve','load','report','invoices','me','tabel','tasks','cal','journal','orders']},
 'Консультант':{av:'ДМ',n:'Дана М.',r:'старший налоговый консультант',note:'Личный кабинет: задачи, свои проекты, ввод времени, зарплата, отпуск. Чужих проектов и ставок не видит',
  s:['me','timesheet','projects','card','tasks','cal','orders','report']},
 'Бухгалтерия':{av:'АЖ',n:'Айгуль Ж.',r:'финансы трёх юрлиц',note:'Счета, оплаты, себестоимость, табель для зарплаты, взносы членов Палаты. Производственной части не видит',
  s:['dash','invoices','cost','tabel','kpi','fees','members','journal','integr']},
 'Делопроизводитель':{av:'СК',n:'Сауле К.',r:'кадры и канцелярия',note:'Журналы входящих и исходящих, приказы и ознакомление, кадровые документы',
  s:['journal','orders','tabel','tasks','cal']},
 'Администратор':{av:'ВТ',n:'Виталия',r:'ИТ и настройки',note:'Пользователи, права, справочники, интеграции, перенос данных, журнал действий',
  s:['dash','roles','integr','migr','stack','members','journal']},
 'Член Палаты':{av:'ЕБ',n:'Ерлан Б.',r:'налоговый консультант I категории',note:'Только свой кабинет: данные, статус в реестре, взносы, уведомления и разъяснения Палаты',
  s:['mcab','library','publicreg']},
 'Кандидат':{av:'НО',n:'Нурлан О.',r:'подал заявку 12.09',note:'Регистрация с сайта, загрузка документов по чек-листу, статус рассмотрения',
  s:['join','publicreg']}
};
let role='Руководство',cur='dash',theme='light';

/* ====== ЮРЛИЦА И ПОДРАЗДЕЛЕНИЯ ====== */
const LE={kons:'ТОО «ПНК Консалтинг»',audit:'ТОО «ПНК Аудит и право»',oo:'ОО «Палата налоговых консультантов»'};
const DEPT=['Налоговое консультирование','Юридическое','Бухгалтерское сопровождение','Палата · членство'];

/* ====== СОТРУДНИКИ: c — себестоимость часа, r — ставка продажи ====== */
const STAFF=[
 {n:'Андрей Григорьевич',d:'Руководство',le:'kons',c:0,r:60000,role:'генеральный директор'},
 {n:'Гульнара С.',d:DEPT[0],le:'kons',c:9800,r:45000,role:'руководитель направления'},
 {n:'Дана М.',d:DEPT[0],le:'kons',c:6200,r:30000,role:'старший консультант'},
 {n:'Ерболат Т.',d:DEPT[0],le:'kons',c:4800,r:22000,role:'консультант'},
 {n:'Бекзат А.',d:DEPT[0],le:'kons',c:3600,r:15000,role:'младший консультант'},
 {n:'Марат Ж.',d:DEPT[1],le:'audit',c:9200,r:42000,role:'руководитель направления'},
 {n:'Асель Р.',d:DEPT[1],le:'audit',c:6000,r:28000,role:'юрист'},
 {n:'Айгуль Ж.',d:DEPT[2],le:'kons',c:4500,r:18000,role:'главный бухгалтер'},
 {n:'Жанар К.',d:DEPT[2],le:'kons',c:4200,r:16000,role:'бухгалтер-консультант'},
 {n:'Сауле К.',d:'Администрация',le:'kons',c:3200,r:0,role:'делопроизводитель'},
 {n:'Виталия',d:'Администрация',le:'kons',c:5000,r:0,role:'ИТ'},
 {n:'Динара Н.',d:DEPT[3],le:'oo',c:3800,r:0,role:'менеджер Палаты'}
];
const S=n=>STAFF.find(s=>s.n===n)||STAFF[2];

/* ====== КЛИЕНТЫ ====== */
const CLI=[
 {id:'C-014',n:'ТОО «Алтын Фосфат Трейд»',bin:'080240012345',le:'kons',d:DEPT[0],own:'Гульнара С.',rates:'по категориям',since:'2021',debt:0,note:'Крупный клиент, проверка КГД идёт с августа'},
 {id:'C-009',n:'АО «Степногорск Энерго»',bin:'050140023456',le:'audit',d:DEPT[1],own:'Марат Ж.',rates:'по сотрудникам',since:'2019',debt:2840000,note:'Годовой проект по ТЦО, платят с задержкой'},
 {id:'C-021',n:'ТОО «Арна Логистик»',bin:'150340034567',le:'kons',d:DEPT[0],own:'Дана М.',rates:'по категориям',since:'2024',debt:0,note:''},
 {id:'C-003',n:'ТОО «Медикус КЗ»',bin:'110540045678',le:'kons',d:DEPT[2],own:'Айгуль Ж.',rates:'абонемент',since:'2017',debt:380000,note:'Абонентское сопровождение, счёт ежемесячно'},
 {id:'C-027',n:'ИП Абишев',bin:'820315301234',le:'kons',d:DEPT[0],own:'Ерболат Т.',rates:'разовая',since:'2026',debt:0,note:'Разовая консультация 15 минут'},
 {id:'C-018',n:'ТОО «Нур Строй Инвест»',bin:'130640056789',le:'audit',d:DEPT[1],own:'Асель Р.',rates:'по сотрудникам',since:'2023',debt:0,note:'Спор с КГД, второй этап'},
 {id:'C-026',n:'ТОО «Каспий Фуд»',bin:'170740067890',le:'kons',d:DEPT[0],own:'Гульнара С.',rates:'по категориям',since:'2026',debt:0,note:'Due diligence перед сделкой'},
 {id:'C-024',n:'ИП Ким',bin:'900912400987',le:'kons',d:DEPT[2],own:'Жанар К.',rates:'фикс',since:'2026',debt:0,note:''}
];
const C=id=>CLI.find(c=>c.id===id)||CLI[0];
let curCli='C-014';

/* ====== ПРОЕКТЫ: h — часы факт, bill — выставлено/к выставлению, cost — себестоимость ====== */
const PRJ=[
 {id:'P-2026-041',c:'C-014',n:'Сопровождение налоговой проверки',lead:'Гульнара С.',team:['Гульнара С.','Дана М.','Бекзат А.'],h:86.5,plan:120,bill:3290000,cost:640000,st:'work',start:'11.08.2026',kind:'проект'},
 {id:'P-2026-038',c:'C-009',n:'Трансфертное ценообразование · отчёт за 2025',lead:'Марат Ж.',team:['Марат Ж.','Асель Р.','Дана М.'],h:142,plan:180,bill:5680000,cost:1180000,st:'work',start:'02.06.2026',kind:'годовой'},
 {id:'P-2026-044',c:'C-021',n:'Возврат НДС по экспорту',lead:'Дана М.',team:['Дана М.','Ерболат Т.'],h:31,plan:40,bill:930000,cost:192000,st:'work',start:'01.09.2026',kind:'проект'},
 {id:'P-2026-012',c:'C-003',n:'Бухгалтерское сопровождение · абонемент',lead:'Айгуль Ж.',team:['Айгуль Ж.','Жанар К.'],h:64,plan:60,bill:380000,cost:288000,st:'work',start:'01.01.2017',kind:'многолетний'},
 {id:'P-2026-047',c:'C-027',n:'Консультация по патенту',lead:'Ерболат Т.',team:['Ерболат Т.'],h:0.25,plan:0.25,bill:7500,cost:1200,st:'done',start:'15.09.2026',kind:'5 минут'},
 {id:'P-2026-035',c:'C-018',n:'Обжалование уведомления КГД',lead:'Асель Р.',team:['Асель Р.','Марат Ж.'],h:58,plan:70,bill:1624000,cost:348000,st:'work',start:'14.07.2026',kind:'проект'},
 {id:'P-2026-046',c:'C-026',n:'Налоговый due diligence',lead:'Гульнара С.',team:['Гульнара С.','Дана М.','Ерболат Т.'],h:24,plan:50,bill:1080000,cost:235000,st:'work',start:'08.09.2026',kind:'проект'},
 {id:'P-2026-040',c:'C-024',n:'Постановка учёта и регистрация по НДС',lead:'Жанар К.',team:['Жанар К.'],h:12,plan:12,bill:192000,cost:50400,st:'done',start:'20.08.2026',kind:'фикс'},
 {id:'P-2026-029',c:'C-009',n:'Сопровождение камеральной проверки',lead:'Марат Ж.',team:['Марат Ж.'],h:19,plan:20,bill:798000,cost:175000,st:'done',start:'03.03.2026',kind:'проект'},
 {id:'P-2026-045',c:'C-014',n:'Подготовка возражений на акт',lead:'Асель Р.',team:['Асель Р.'],h:9.5,plan:10,bill:266000,cost:57000,st:'appr',start:'10.09.2026',kind:'проект'}
];
const PST={work:['в работе','var(--acc)'],done:['закрыт','var(--ok)'],appr:['на согласовании','var(--warn)']};

/* ====== ТАЙМШИТ ДАНЫ · неделя 15–19 сентября ====== */
const TS=[
 {d:'Пн 15.09',p:'P-2026-041',w:'Анализ требований КГД по акту',min:180,b:1,st:'ok'},
 {d:'Пн 15.09',p:'P-2026-044',w:'Подготовка пакета по НДС',min:150,b:1,st:'ok'},
 {d:'Пн 15.09',p:'—',w:'Планёрка направления',min:45,b:0,st:'ok'},
 {d:'Вт 16.09',p:'P-2026-038',w:'Сверка данных для ТЦО',min:240,b:1,st:'ok'},
 {d:'Вт 16.09',p:'P-2026-046',w:'Изучение договоров, встреча с клиентом',min:210,b:1,st:'ok'},
 {d:'Ср 17.09',p:'P-2026-041',w:'Письменные пояснения по п. 3 акта',min:300,b:1,st:'ok'},
 {d:'Ср 17.09',p:'—',w:'Методический семинар Палаты',min:120,b:0,st:'ok'},
 {d:'Чт 18.09',p:'P-2026-044',w:'Звонок с бухгалтером клиента, правки',min:90,b:1,st:'new'},
 {d:'Чт 18.09',p:'P-2026-046',w:'Черновик отчёта DD, раздел «Налоги»',min:270,b:1,st:'new'},
 {d:'Пт 19.09',p:'',w:'',min:0,b:1,st:'empty'}
];

/* ====== СЧЕТА ====== */
const INV=[
 {n:'КО-2026-118',le:'kons',c:'C-014',p:'P-2026-041',sum:1980000,dt:'05.09',due:'19.09',st:'paid'},
 {n:'АП-2026-064',le:'audit',c:'C-009',p:'P-2026-038',sum:2840000,dt:'29.08',due:'12.09',st:'late'},
 {n:'КО-2026-121',le:'kons',c:'C-021',p:'P-2026-044',sum:930000,dt:'17.09',due:'01.10',st:'sent'},
 {n:'КО-2026-115',le:'kons',c:'C-003',p:'P-2026-012',sum:380000,dt:'01.09',due:'10.09',st:'late'},
 {n:'КО-2026-122',le:'kons',c:'C-027',p:'P-2026-047',sum:7500,dt:'15.09',due:'22.09',st:'paid'},
 {n:'АП-2026-061',le:'audit',c:'C-018',p:'P-2026-035',sum:1120000,dt:'15.08',due:'29.08',st:'paid'},
 {n:'КО-2026-119',le:'kons',c:'C-024',p:'P-2026-040',sum:192000,dt:'08.09',due:'22.09',st:'paid'},
 {n:'КО-2026-123',le:'kons',c:'C-014',p:'P-2026-045',sum:266000,dt:'—',due:'—',st:'wait'}
];
const IST={paid:['оплачен','var(--ok)'],late:['просрочен','var(--bad)'],sent:['выставлен','var(--acc)'],wait:['ждёт согласования отчёта','var(--warn)']};

/* ====== ЧЛЕНЫ ПАЛАТЫ ====== */
const CAT=['Налоговый консультант I категории','Налоговый консультант II категории','Аттестованный налоговый консультант','Ассоциированный член'];
const FEE={[CAT[0]]:30000,[CAT[1]]:25000,[CAT[2]]:20000,[CAT[3]]:12000};
const MEM=[
 {id:'ПНК-00412',n:'Ерлан Б.',city:'Алматы',cat:CAT[0],cert:'НК-0412 · 2016',st:'act',paid:30000,since:'2016',work:'ТОО «Аудит Плюс»'},
 {id:'ПНК-01873',n:'Салтанат Е.',city:'Астана',cat:CAT[1],cert:'НК-1873 · 2020',st:'act',paid:0,since:'2020',work:'частная практика'},
 {id:'ПНК-00097',n:'Владимир К.',city:'Караганда',cat:CAT[0],cert:'НК-0097 · 2009',st:'act',paid:30000,since:'2009',work:'АО «КарМет Аудит»'},
 {id:'ПНК-02451',n:'Айнур Т.',city:'Шымкент',cat:CAT[2],cert:'НК-2451 · 2023',st:'act',paid:10000,since:'2023',work:'ТОО «Юг Консалт»'},
 {id:'ПНК-03102',n:'Данияр С.',city:'Алматы',cat:CAT[1],cert:'НК-3102 · 2025',st:'act',paid:25000,since:'2025',work:'ИП Данияр С.'},
 {id:'ПНК-00655',n:'Гульмира А.',city:'Актобе',cat:CAT[0],cert:'НК-0655 · 2012',st:'susp',paid:0,since:'2012',work:'—'},
 {id:'ПНК-02890',n:'Ринат М.',city:'Павлодар',cat:CAT[2],cert:'НК-2890 · 2024',st:'act',paid:20000,since:'2024',work:'ТОО «Север Финанс»'},
 {id:'ПНК-01234',n:'Асем Ж.',city:'Астана',cat:CAT[3],cert:'—',st:'act',paid:0,since:'2018',work:'АО «Банк Развития»'},
 {id:'ПНК-03340',n:'Тимур О.',city:'Атырау',cat:CAT[1],cert:'НК-3340 · 2026',st:'act',paid:25000,since:'2026',work:'ТОО «Нефть Сервис»'},
 {id:'ПНК-00521',n:'Людмила П.',city:'Усть-Каменогорск',cat:CAT[0],cert:'НК-0521 · 2011',st:'act',paid:30000,since:'2011',work:'частная практика'}
];
const MST={act:['действующий','var(--ok)'],susp:['приостановлен','var(--warn)'],out:['исключён','var(--bad)']};
const M=id=>MEM.find(m=>m.id===id)||MEM[0];
let curMem='ПНК-00412';

/* ====== КАНДИДАТЫ ====== */
const CAND=[
 {n:'Нурлан О.',city:'Алматы',cat:CAT[1],dt:'12.09',st:'docs',docs:[['Заявление',1],['Удостоверение личности',1],['Диплом о высшем образовании',1],['Трудовая книжка / выписка',1],['Две рекомендации членов Палаты',0],['Сертификат о квалификации',1],['Согласие на обработку ПД',1]]},
 {n:'Мадина К.',city:'Астана',cat:CAT[2],dt:'09.09',st:'check',docs:[]},
 {n:'Арман Д.',city:'Тараз',cat:CAT[1],dt:'03.09',st:'decision',docs:[]},
 {n:'Ольга В.',city:'Костанай',cat:CAT[0],dt:'28.08',st:'accepted',docs:[]}
];
const CST={docs:['требуются документы','var(--warn)'],check:['на проверке','var(--acc)'],decision:['на решении','var(--violet)'],accepted:['принят','var(--ok)']};

/* ====== ВЗНОСЫ 2026 · сводка ====== */
const F={total:3412,charged:85300000,paid:66534000,debtors:751,overpaid:38};

/* ====== ЗАДАЧИ ====== */
const TASKS=[
 {t:'Направить клиенту пояснения по п. 3 акта',who:'Дана М.',from:'Гульнара С.',c:'C-014',due:'19.09',st:'work',pr:'high'},
 {t:'Согласовать отчёт по возражениям · P-2026-045',who:'Марат Ж.',from:'система',c:'C-014',due:'18.09',st:'late',pr:'high'},
 {t:'Перезвонить: ТОО «Арна Логистик», бухгалтер просила после 15:00',who:'Дана М.',from:'Дана М.',c:'C-021',due:'18.09 15:00',st:'new',pr:'mid'},
 {t:'Собрать рекомендации для кандидата Нурлана О.',who:'Динара Н.',from:'Андрей Григорьевич',c:'—',due:'22.09',st:'work',pr:'mid'},
 {t:'Выставить абонентский счёт Медикус КЗ за сентябрь',who:'Айгуль Ж.',from:'система',c:'C-003',due:'01.10',st:'new',pr:'low'},
 {t:'Напомнить Степногорск Энерго о просрочке 6 дней',who:'Марат Ж.',from:'система',c:'C-009',due:'18.09',st:'late',pr:'high'},
 {t:'Ознакомить новых сотрудников с регламентом конфиденциальности',who:'Сауле К.',from:'Андрей Григорьевич',c:'—',due:'20.09',st:'work',pr:'mid'}
];

/* ====== ЖУРНАЛ КОРРЕСПОНДЕНЦИИ ====== */
const JRN=[
 {n:'Вх-2026-0418',dt:'18.09',dir:'in',from:'ДГД по г. Алматы',subj:'Уведомление о результатах камерального контроля · ТОО «Алтын Фосфат Трейд»',who:'Гульнара С.',due:'02.10',le:'kons'},
 {n:'Исх-2026-0391',dt:'17.09',dir:'out',from:'ТОО «Арна Логистик»',subj:'Отчёт о затраченном времени за август и счёт КО-2026-121',who:'Дана М.',due:'—',le:'kons'},
 {n:'Вх-2026-0417',dt:'17.09',dir:'in',from:'Нурлан О.',subj:'Заявление о вступлении в члены Палаты',who:'Динара Н.',due:'01.10',le:'oo'},
 {n:'Исх-2026-0390',dt:'16.09',dir:'out',from:'Апелляционная комиссия МФ РК',subj:'Жалоба на уведомление · ТОО «Нур Строй Инвест»',who:'Асель Р.',due:'—',le:'audit'},
 {n:'Вх-2026-0416',dt:'16.09',dir:'in',from:'АО «Степногорск Энерго»',subj:'Письмо о переносе срока оплаты счёта АП-2026-064',who:'Марат Ж.',due:'19.09',le:'audit'},
 {n:'Исх-2026-0389',dt:'15.09',dir:'out',from:'Все члены Палаты',subj:'Разъяснение по применению ст. 412 НК с 01.10.2026',who:'Динара Н.',due:'—',le:'oo'}
];

/* ====== ПРИКАЗЫ И ОЗНАКОМЛЕНИЕ ====== */
const ORD=[
 {n:'Приказ № 47',dt:'15.09',t:'О соглашении о конфиденциальности (новая редакция)',to:'все сотрудники',block:1,read:19,of:25},
 {n:'Приказ № 46',dt:'10.09',t:'О материальной ответственности за выданную технику',to:'3 сотрудника',block:1,read:2,of:3},
 {n:'Распоряжение № 12',dt:'08.09',t:'О графике отпусков на IV квартал',to:'все сотрудники',block:0,read:25,of:25},
 {n:'Регламент',dt:'01.09',t:'Порядок заполнения таймшитов и согласования отчётов',to:'консультанты и юристы',block:0,read:9,of:11}
];
const SC={};
const seeMoney=()=>['Руководство','Бухгалтерия'].indexOf(role)>=0;
const seeCost=()=>['Руководство','Бухгалтерия'].indexOf(role)>=0;
const isBoss=()=>['Руководство','Руководитель подразделения'].indexOf(role)>=0;
const tag=(t,c)=>`<span class="tag" style="background:${c}22;color:${c}">${esc(t)}</span>`;
const barHtml=(p,c)=>`<div class="bar"><i style="display:block;height:100%;width:${Math.min(100,p)}%;background:${c||'var(--brand)'}"></i></div>`;
const cliName=id=>(CLI.find(c=>c.id===id)||{n:'—'}).n;

/* ====== ПУЛЬТ ====== */
SC.dash=()=>{
 const work=PRJ.filter(p=>p.st!=='done');
 const bill=PRJ.reduce((a,p)=>a+p.bill,0), cost=PRJ.reduce((a,p)=>a+p.cost,0);
 const late=INV.filter(i=>i.st==='late').reduce((a,i)=>a+i.sum,0);
 return `<div class="hd"><div><h2>Общая картина · четверг, 18 сентября 2026</h2>
 <p>Оба контура на одном экране: консалтинг слева, Палата справа. Ваши слова: «чтобы полная карта деятельности всех сотрудников от и до просматривалась». Всё, что здесь видно, собирается из таймшитов, счетов и кабинетов — ничего не сводится руками.</p></div>
 <div class="btns"><button class="bt" onclick="go('today')">Что требует решения</button><button class="bt p" onclick="go('approve')">Согласование отчётов</button></div></div>
<div class="wid">
 <div><small>Проектов в работе</small><b class="a">${work.length}</b><span>${PRJ.filter(p=>p.st==='appr').length} на согласовании · ${PRJ.filter(p=>p.st==='done').length} закрыто</span></div>
 <div><small>Часов за неделю</small><b>412</b><span>из них выставляемых 318 · 77%</span></div>
 <div><small>Не заполнили таймшит</small><b class="w">3</b><span>из 11 консультантов · вчера</span></div>
 <div><small>Просроченная дебиторка</small><b class="r">${mln(late)} ₸</b><span>2 счёта · Степногорск, Медикус</span></div>
 ${seeCost()?`<div><small>Маржа по проектам</small><b class="g">${Math.round((bill-cost)/bill*100)}%</b><span>${mln(bill)} выставлено · ${mln(cost)} себестоимость</span></div>`
  :`<div><small>Отчётов ждут согласования</small><b class="w">2</b><span>без отметки не уйдут клиенту</span></div>`}
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 4px">Консалтинг · проекты по срочности</h3>
  <p class="mini" style="margin:0 0 10px">Цвет — состояние: просроченный счёт, ожидание согласования, всё в порядке.</p>
  ${PRJ.filter(p=>p.st!=='done').map(p=>{const inv=INV.find(i=>i.p===p.id);const c=inv&&inv.st==='late'?'var(--bad)':p.st==='appr'?'var(--warn)':'var(--ok)';
   return `<div class="dl" style="--c:${c}" onclick="curCli='${p.c}';go('card')">
    <div style="flex:1;min-width:0"><b style="font-size:12px">${esc(cliName(p.c))}</b><div class="mini">${esc(p.n)} · ${esc(p.lead)} · ${esc(p.kind)}</div></div>
    <div style="width:110px">${barHtml(p.h/p.plan*100,c)}<div class="mini" style="text-align:right;margin-top:3px">${num(p.h)} из ${p.plan} ч</div></div>
    <b class="mono" style="width:96px;text-align:right">${fmt(p.bill)} ₸</b></div>`}).join('')}
 </div>
 <div>
  <div class="pan" style="border-top:3px solid var(--brand2)"><h3 style="margin:0 0 8px">Палата · сегодня</h3>
   <div class="kv"><span>Членов в реестре</span><b>${fmt(F.total)}</b></div>
   <div class="kv"><span>Взносы 2026 · собрано</span><b>${Math.round(F.paid/F.charged*100)}% · ${mln(F.paid)} ₸</b></div>
   <div class="kv"><span>Должников</span><b style="color:var(--bad)">${F.debtors}</b></div>
   <div class="kv"><span>Заявок на вступление</span><b>${CAND.filter(c=>c.st!=='accepted').length}</b></div>
   <div class="kv" style="border:0"><span>Разъяснений опубликовано в сентябре</span><b>3</b></div>
   <button class="bt p" style="width:100%;margin-top:10px" onclick="go('fees')">Напомнить должникам</button>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Сотрудники</h3>
   <div class="kv"><span>Таймшиты за вчера</span><b>8 из 11</b></div>
   <div class="kv"><span>Просроченных поручений</span><b style="color:var(--bad)">${TASKS.filter(t=>t.st==='late').length}</b></div>
   <div class="kv"><span>Не ознакомились с приказом № 47</span><b style="color:var(--warn)">6</b></div>
   <div class="kv" style="border:0"><span>В отпуске</span><b>1 · Бекзат А. до 26.09</b></div>
  </div>
 </div>
</div>
<div class="said"><b>Что здесь важно.</b> Это не два дашборда двух программ, а один. Бухгалтер видит и счета консалтинга, и взносы Палаты в одном месте, руководство — всё сразу. При этом член Палаты, зайдя в свой кабинет, ни одной строки консалтинга не увидит: права разделены по ролям, а не по программам.</div>`;
};

SC.today=()=>`<div class="hd"><div><h2>Что требует решения · 18 сентября</h2>
 <p>Список собирается из отклонений: отчёт без согласования, просроченный счёт, незаполненный таймшит, просроченное поручение, кандидат с неполным пакетом. Если всё в порядке — экран пустой.</p></div>
 <div class="btns"><button class="bt" onclick="toast('В реальной системе нерешённое к концу дня уходит руководству одним сообщением в WhatsApp: три строки, без описаний.')">Разобрал</button></div></div>
<div class="g2">
 <div>
  <div class="tsk" style="--c:var(--warn)"><b>Отчёт по возражениям ждёт согласования · Алтын Фосфат</b>
   <p class="mini" style="margin:5px 0 8px">Асель Р. подготовила отчёт за 9,5 часов на 266 000 ₸ ещё 16.09. Марат Ж. не поставил отметку — отчёт и счёт КО-2026-123 не уходят клиенту. Это и есть иерархия, о которой вы говорили: без согласования отправки нет.</p>
   <button class="bt p" onclick="go('approve')">Открыть согласование</button></div>
  <div class="tsk" style="--c:var(--bad)"><b>Степногорск Энерго · просрочка 6 дней · 2 840 000 ₸</b>
   <p class="mini" style="margin:5px 0 8px">Счёт АП-2026-064 по проекту ТЦО. Клиент 16.09 прислал письмо о переносе срока (Вх-2026-0416). Годовой проект, себестоимость идёт. Нужно решение: принять перенос или приостановить работы.</p>
   <button class="bt" onclick="toast('Перенос принят до 26.09, отметка в карточке клиента и в счёте. Работы продолжаются. Если 26.09 оплаты не будет — система поднимет вопрос снова, уже с предложением приостановить.')">Принять перенос до 26.09</button> <button class="bt" onclick="go('invoices')">Дебиторка</button></div>
  <div class="tsk" style="--c:var(--warn)"><b>Три консультанта не заполнили таймшит за вчера</b>
   <p class="mini" style="margin:5px 0 8px">Ерболат Т., Бекзат А. (в отпуске — норма), Жанар К. Напоминания ушли утром. Без записей за 17.09 отчёт по Арна Логистик за сентябрь будет неполным.</p>
   <button class="bt" onclick="toast('Повторное напоминание отправлено Ерболату и Жанар в WhatsApp. Руководителям подразделений — в список «незаполненные дни».')">Напомнить ещё раз</button></div>
 </div>
 <div>
  <div class="tsk" style="--c:var(--violet)"><b>Кандидат Нурлан О. · не хватает двух рекомендаций</b>
   <p class="mini" style="margin:5px 0 8px">Подал заявку 12.09 с сайта, загрузил 6 документов из 7. Система напомнила ему дважды. Динаре Н. поставлена задача помочь с рекомендациями до 22.09.</p>
   <button class="bt" onclick="go('join')">Открыть заявку</button></div>
  <div class="tsk" style="--c:var(--acc)"><b>751 должник по взносам 2026</b>
   <p class="mini" style="margin:5px 0 8px">Собрано 78% годовых взносов. Последнее напоминание уходило 1 июля. Ваши слова: «кнопочка — и ушло уведомление всем».</p>
   <button class="bt p" onclick="go('fees')">Напомнить всем должникам</button></div>
  <div class="tsk" style="--c:var(--acc)"><b>Приказ № 47 о конфиденциальности · 6 не ознакомились</b>
   <p class="mini" style="margin:5px 0 8px">Приказ блокирующий: у шестерых кабинет закрыт до подтверждения. Двое из них — в отпуске, четверо просто не открыли.</p>
   <button class="bt" onclick="go('orders')">Список неознакомившихся</button></div>
  <div class="note" style="--tone:var(--brand)"><b>Откуда берётся список</b><p class="mini" style="margin:5px 0 0">Никто его не составляет. Система сравнивает таймшиты с рабочими днями, счета со сроками, отчёты с отметками согласования — и показывает расхождения.</p></div>
 </div>
</div>`;

/* ====== КЛИЕНТЫ ====== */
SC.clients=()=>`<div class="hd"><div><h2>Клиенты и договоры</h2>
 <p>Восемь клиентов консалтинга по двум юрлицам. В договоре каждого — таблица часовых ставок: по сотрудникам, по категориям или абонемент. Именно из неё считается счёт.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новый клиент: реквизиты, юрлицо-исполнитель, договор с таблицей ставок, ответственный. После сохранения можно сразу заводить проект и списывать время.')">+ Клиент</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">
  ${['КЛИЕНТ','ЮРЛИЦО-ИСПОЛНИТЕЛЬ','НАПРАВЛЕНИЕ','ОТВЕТСТВЕННЫЙ','СТАВКИ','ПРОЕКТОВ','ДОЛГ'].map((h,i)=>`<th style="text-align:${i>4?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${CLI.map(c=>{const n=PRJ.filter(p=>p.c===c.id).length;return `<tr style="cursor:pointer" onclick="curCli='${c.id}';go('card')">
  <td style="padding:8px"><b>${esc(c.n)}</b><div class="mini">БИН ${c.bin} · с ${c.since}</div></td>
  <td style="padding:8px;color:var(--muted)">${esc(LE[c.le])}</td><td style="padding:8px">${esc(c.d)}</td><td style="padding:8px">${esc(c.own)}</td>
  <td style="padding:8px">${esc(c.rates)}</td><td class="mono" style="text-align:right;padding:8px">${n}</td>
  <td class="mono" style="text-align:right;padding:8px;color:${c.debt?'var(--bad)':'var(--muted2)'}">${c.debt?fmt(c.debt)+' ₸':'—'}</td></tr>`}).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 8px">Три схемы ставок из ваших договоров</h3>
  <div class="kv"><span><b>По категориям</b> · руководитель / старший / консультант</span><b class="mono">45 000 · 30 000 · 22 000 ₸</b></div>
  <div class="kv"><span><b>По сотрудникам</b> · поимённо в приложении к договору</span><b class="mono">от 15 000 до 60 000 ₸</b></div>
  <div class="kv" style="border:0"><span><b>Абонемент</b> · фиксированная сумма в месяц, часы учитываются</span><b class="mono">380 000 ₸ / мес.</b></div>
  <p class="mini" style="margin:9px 0 0">Ваши слова: «Если договор расставляется так, что мы показываем, какие часовые ставки будут для какого сотрудника». Ставка берётся из договора конкретного клиента — у одного и того же консультанта она может отличаться.</p>
 </div>
 <div class="pan"><h3 style="margin:0 0 8px">Что видно только своим</h3>
  <p class="mini" style="margin:0">Консультант видит своих клиентов и свои проекты, без ставок и себестоимости. Руководитель направления — клиентов подразделения. Бухгалтерия — счета всех, но не содержание проектов. Юристы не видят бухгалтерское сопровождение — правило, которое вы назвали на встрече.</p>
 </div>
</div>`;

SC.card=()=>{
 const c=C(curCli), ps=PRJ.filter(p=>p.c===c.id), inv=INV.filter(i=>i.c===c.id);
 const bill=ps.reduce((a,p)=>a+p.bill,0), cost=ps.reduce((a,p)=>a+p.cost,0), h=ps.reduce((a,p)=>a+p.h,0);
 return `<div class="hd"><div><h2>${esc(c.n)}</h2>
 <p>БИН ${c.bin} · ${esc(LE[c.le])} · ${esc(c.d)} · ответственный ${esc(c.own)} · клиент с ${c.since}${c.note?' · '+esc(c.note):''}</p></div>
 <div class="btns"><select class="rsel" onchange="curCli=this.value;build()">${CLI.map(x=>`<option value="${x.id}"${x.id===c.id?' selected':''}>${esc(x.n)}</option>`).join('')}</select>
 <button class="bt" onclick="toast('Проект создан за два действия: название и руководитель. Ставки подставились из договора клиента, время можно списывать сразу — даже если это пять минут.')">+ Проект</button><button class="bt p" onclick="go('report')">Отчёт клиенту</button></div></div>
<div class="wid" style="grid-template-columns:repeat(${seeCost()?5:4},1fr)">
 <div><small>Проектов</small><b class="a">${ps.length}</b><span>${ps.filter(p=>p.st!=='done').length} в работе</span></div>
 <div><small>Часов всего</small><b>${num(h)}</b><span>по всем проектам</span></div>
 <div><small>Выставлено</small><b>${fmt(bill)} ₸</b><span>${inv.length} ${plural(inv.length,['счёт','счёта','счетов'])}</span></div>
 <div><small>Долг</small><b class="${c.debt?'r':''}">${c.debt?fmt(c.debt)+' ₸':'нет'}</b><span>${c.debt?'просрочка':'всё оплачено'}</span></div>
 ${seeCost()?`<div><small>Маржа по клиенту</small><b class="g">${bill?Math.round((bill-cost)/bill*100):0}%</b><span>себестоимость ${fmt(cost)} ₸</span></div>`:''}
</div>
<div class="g21">
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Проекты</h3>
   ${ps.map(p=>`<div class="dl" style="--c:${PST[p.st][1]}"><div style="flex:1"><b>${esc(p.n)}</b><div class="mini">${p.id} · ${esc(p.lead)} · с ${p.start} · ${esc(p.kind)}</div></div>
    <b class="mono" style="width:70px;text-align:right">${num(p.h)} ч</b><b class="mono" style="width:100px;text-align:right">${fmt(p.bill)} ₸</b>${tag(PST[p.st][0],PST[p.st][1])}</div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 9px">История</h3>
   <div class="tl">
    <div class="tli"><b style="font-size:11.6px">18.09 · Вх-2026-0418</b><p class="mini" style="margin:2px 0 0">Уведомление ДГД о результатах камерального контроля. Ответственная Гульнара С., срок ответа 02.10. Зарегистрировано в журнале автоматически.</p></div>
    <div class="tli"><b style="font-size:11.6px">17.09 · Дана М.</b><p class="mini" style="margin:2px 0 0">5 часов: письменные пояснения по п. 3 акта. Согласовано Гульнарой С. 18.09 09:14.</p></div>
    <div class="tli"><b style="font-size:11.6px">16.09 · Асель Р.</b><p class="mini" style="margin:2px 0 0">Отчёт по возражениям на 266 000 ₸ отправлен на согласование Марату Ж. Ждёт отметки.</p></div>
    <div class="tli"><b style="font-size:11.6px">12.09 · система</b><p class="mini" style="margin:2px 0 0">Счёт КО-2026-118 на 1 980 000 ₸ оплачен. Дебиторка по клиенту закрыта.</p></div>
    <div class="tli"><b style="font-size:11.6px">05.09 · Гульнара С.</b><p class="mini" style="margin:2px 0 0">Отчёт за август на бланке отправлен клиенту по почте из системы, вложение PDF 4 страницы.</p></div>
   </div>
  </div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Договор и ставки</h3>
   <div class="kv"><span>Договор</span><b>№ 14/2021 от 03.03.2021</b></div>
   <div class="kv"><span>Схема</span><b>${esc(c.rates)}</b></div>
   <div class="kv"><span>Руководитель направления</span><b class="mono">45 000 ₸/ч</b></div>
   <div class="kv"><span>Старший консультант</span><b class="mono">30 000 ₸/ч</b></div>
   <div class="kv"><span>Консультант</span><b class="mono">22 000 ₸/ч</b></div>
   <div class="kv" style="border:0"><span>Выставление</span><b>ежемесячно, постфактум</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Контакты и связь</h3>
   <div class="kv"><span>Финансовый директор</span><b>Айдана С.</b></div>
   <div class="kv"><span>Главный бухгалтер</span><b>Ольга Н.</b></div>
   <div class="kv" style="border:0"><span>Каналы</span><b>почта · WhatsApp · звонки</b></div>
   <button class="bt" style="width:100%;margin-top:9px" onclick="toast('Звонок из карточки через IP-телефонию: запись разговора подошьётся сюда же, к клиенту и к проекту. Ваш вопрос на встрече: «запись идёт?» — да, по каждому звонку.')">Позвонить · запись</button>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Счета</h3>
   ${inv.map(i=>`<div class="kv"><span>${i.n} · ${i.dt}</span><b class="mono" style="color:${IST[i.st][1]}">${fmt(i.sum)} ₸</b></div>`).join('')||'<p class="mini">Счетов нет</p>'}
  </div>
 </div>
</div>`;
};

SC.projects=()=>{
 const mine=role==='Консультант'?PRJ.filter(p=>p.team.indexOf('Дана М.')>=0):PRJ;
 return `<div class="hd"><div><h2>Проекты${role==='Консультант'?' · мои':''}</h2>
 <p>Проект — единица, на которую списывается время и по которой выставляется счёт. Ваши слова: «проекты могут длиться годами, а могут быть — пять минут проконсультировал». Здесь есть и то и другое.</p></div>
 <div class="btns"><button class="bt p" onclick="quickPrj()">Быстрый проект · 2 клика</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">
  ${['ПРОЕКТ','КЛИЕНТ','РУКОВОДИТЕЛЬ','ТИП','ЧАСЫ','К ВЫСТАВЛЕНИЮ'].concat(seeCost()?['МАРЖА']:[]).concat(['СТАТУС']).map((h,i)=>`<th style="text-align:${i>=4?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${mine.map(p=>`<tr style="cursor:pointer" onclick="curCli='${p.c}';go('card')">
  <td style="padding:8px"><b>${esc(p.n)}</b><div class="mini">${p.id} · с ${p.start}</div></td>
  <td style="padding:8px">${esc(cliName(p.c))}</td><td style="padding:8px">${esc(p.lead)}</td><td style="padding:8px;color:var(--muted)">${esc(p.kind)}</td>
  <td class="mono" style="text-align:right;padding:8px">${hrs(p.h)}<div class="mini">план ${p.plan}</div></td>
  <td class="mono" style="text-align:right;padding:8px">${role==='Консультант'?'—':fmt(p.bill)+' ₸'}</td>
  ${seeCost()?`<td class="mono" style="text-align:right;padding:8px;font-weight:700;color:${(p.bill-p.cost)/p.bill<0.5?'var(--warn)':'var(--ok)'}">${Math.round((p.bill-p.cost)/p.bill*100)}%</td>`:''}
  <td style="text-align:right;padding:8px">${tag(PST[p.st][0],PST[p.st][1])}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Многолетний</h3><p class="mini" style="margin:0">Медикус КЗ — абонемент с 2017 года. Часов в сентябре 64 при норме 60: клиент «переедает» абонемент, и это видно сейчас, а не при пересмотре договора через год.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Пять минут</h3><p class="mini" style="margin:0">ИП Абишев — 15 минут консультации, 7 500 ₸. Заведено в два клика из карточки, попало в счёт и в таймшит. Раньше такое просто не учитывалось.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Внутренние</h3><p class="mini" style="margin:0">Планёрки, семинары Палаты, методическая работа — проекты без клиента. Время идёт в табель, но не в счёт: та самая non-billable работа.</p></div>
</div>`;
};

SC.funnel=()=>{
 const F1=[['Обращение',[['ТОО «Тау Логистик»','вопрос по ТЦО, рекомендация Степногорска','2 дня']]],['Оценка',[['АО «Кокше Цемент»','налоговый аудит за 3 года','5 дней'],['ИП Сериков','спор по ИПН','1 день']]],['Предложение',[['ТОО «Байтерек Групп»','КП на 2 400 000 ₸ отправлено','8 дней']]],['Договор',[['ТОО «Каспий Фуд»','подписан 08.09 → проект P-2026-046','']]]];
 return `<div class="hd"><div><h2>Воронки по направлениям</h2>
 <p>У каждого направления своя воронка со своими стадиями. Обращение превращается в проект при подписании договора — без повторного ввода. Здесь нет «лидов» в смысле массовых продаж: это учёт обращений, которые приходят по рекомендации.</p></div>
 <div class="btns"><div class="ptabs" style="margin:0"><button class="ptab on">Налоговое консультирование</button><button class="ptab" onclick="toast('Воронка юридического направления: обращение → анализ перспективы → предложение → договор. Стадии свои, настраиваются руководителем направления.')">Юридическое</button><button class="ptab" onclick="toast('Бухгалтерское сопровождение: запрос → расчёт абонемента → договор. Короткая воронка, потому что услуга типовая.')">Бухгалтерское</button></div></div></div>
<div class="pipe" style="grid-auto-columns:minmax(230px,1fr)">${F1.map(([n,items])=>`<div><div class="phead" style="background:${n==='Договор'?'var(--ok)':'var(--rail-h)'}">${n} · ${items.length}</div>
 <div class="pbody" style="background:var(--card2)">${items.map(([c,d,t])=>`<div class="pc" draggable="true" onclick="toast('Карточка обращения: кто рекомендовал, суть вопроса, предварительная оценка часов, ответственный. Напоминание «перезвонить» ставится отсюда и попадает в календарь.')"><b style="font-size:11.4px;display:block">${esc(c)}</b><div class="mini" style="margin-top:3px">${esc(d)}</div>${t?`<div class="mini" style="margin-top:4px;color:var(--muted2)">на стадии ${t}</div>`:''}</div>`).join('')}</div></div>`).join('')}</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 7px">Напоминание «перезвонить»</h3><p class="mini" style="margin:0">Ваш вопрос: «бывает, клиенты говорят перезвоните в такое-то время». Из карточки ставится напоминание на время — оно приходит в системе и в WhatsApp ответственному, попадает в его календарь. Не обработанные к вечеру — в список руководителя.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Что записывается при переходе в договор</h3><p class="mini" style="margin:0">Клиент создаётся с реквизитами и таблицей ставок, проект — с руководителем и участниками, первая задача — руководителю проекта. Всё из одной карточки обращения.</p></div>
</div>`;
};
/* ====== ТАЙМШИТ ====== */
SC.timesheet=()=>{
 const tot=TS.reduce((a,t)=>a+t.min,0), bill=TS.filter(t=>t.b).reduce((a,t)=>a+t.min,0);
 return `<div class="hd"><div><h2>Мой таймшит · Дана М. · неделя 15–19 сентября</h2>
 <p>Время вносится в день работы: проект, что делал, минуты. Точность — минута. Комментарий для клиента попадёт в отчёт, внутренний — нет. Пятница пустая и подсвечена: система напомнит вечером.</p></div>
 <div class="btns"><button class="bt" onclick="tsTimer()">▶ Таймер</button><button class="bt p" onclick="tsAdd()">+ Запись</button><button class="bt" onclick="toast('Неделя отправлена на согласование Гульнаре С. До её отметки записи можно править; после — только через руководство с причиной.')">Отправить на согласование</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Всего за неделю</small><b class="a">${hrs(tot/60)}</b><span>норма 40 ч</span></div>
 <div><small>Выставляемых</small><b>${hrs(bill/60)}</b><span>${Math.round(bill/tot*100)}% · billable</span></div>
 <div><small>Внутренних</small><b>${hrs((tot-bill)/60)}</b><span>планёрка, семинар</span></div>
 <div><small>Не заполнено</small><b class="w">1 день</b><span>пятница</span></div>
</div>
<div class="pan">
 ${TS.map(t=>t.st==='empty'?`<div class="srow" style="border:1px dashed var(--warn);background:var(--warn-l)"><b style="width:74px;font-size:11px">${t.d}</b><div style="flex:1;color:var(--warn)">Записей нет — рабочий день. <button class="bt" style="margin-left:6px" onclick="tsAdd()">Заполнить</button></div></div>`
  :`<div class="srow"><b style="width:74px;font-size:11px">${t.d}</b>
   <div style="flex:1"><b>${esc(t.w)}</b><div class="mini">${t.p==='—'?'внутренняя работа':esc(t.p)+' · '+esc(cliName((PRJ.find(p=>p.id===t.p)||{}).c))}</div></div>
   ${t.b?tag('billable','var(--ok)'):tag('внутр.','var(--muted)')}
   <b class="mono" style="width:80px;text-align:right">${hrs(t.min/60)}</b>
   ${t.st==='new'?'<span class="tag" style="background:var(--warn-l);color:var(--warn)">не отправлено</span>':'<span class="tag" style="background:var(--ok-l);color:var(--ok)">согласовано</span>'}</div>`).join('')}
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 7px">Два способа ввода</h3><p class="mini" style="margin:0"><b>Ручной:</b> выбрал проект, ввёл минуты, написал строку для клиента. <b>Таймер:</b> нажал «начал», работаешь, нажал «стоп» — время само привязывается к проекту. Для консультанта, который за день трогает пять проектов, второй способ честнее.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Что видит клиент из этой недели</h3><p class="mini" style="margin:0">Только строки billable по его проекту с комментарием «для клиента». Внутренний комментарий, планёрки и другие клиенты в отчёт не попадают никогда — это разделение заложено в самой записи, а не в момент формирования отчёта.</p></div>
</div>`;
};

/* ====== СОГЛАСОВАНИЕ ====== */
SC.approve=()=>`<div class="hd"><div><h2>Согласование · руководитель направления</h2>
 <p>Ваши слова: «Чтобы руководитель согласовал, и только после этого отчёт ушёл клиенту». Здесь два уровня: согласование таймшитов сотрудников за неделю и согласование отчёта клиенту перед отправкой. Без второго отправка невозможна технически.</p></div>
 <div class="btns"><button class="bt p" onclick="approveAll()">Согласовать проверенные</button></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Таймшиты за неделю 15–19.09 · налоговое направление</h3>
  ${[['Дана М.','38 ч 15 мин','30 ч 45 мин','4 из 5','ok'],['Ерболат Т.','31 ч','26 ч','3 из 5','warn'],['Бекзат А.','отпуск','—','—','off'],['Гульнара С.','41 ч','29 ч','5 из 5','ok']]
   .map(([n,t,b,d,s])=>`<div class="srow" style="border-left:3px solid ${s==='ok'?'var(--ok)':s==='warn'?'var(--warn)':'var(--line2)'}"><div style="flex:1"><b>${n}</b><div class="mini">всего ${t} · выставляемых ${b} · дней заполнено ${d}</div></div>
   ${s==='off'?'<span class="tag">отпуск</span>':s==='ok'?'<button class="bt p" onclick="toast(\'Таймшит согласован. Записи закрыты от правок, отчёты по проектам этого сотрудника можно формировать.\')">Согласовать</button>':'<button class="bt" onclick="toast(\'Возвращено Ерболату с комментарием: не заполнены вторник и четверг. Он увидит это в кабинете и в WhatsApp.\')">Вернуть</button>'}</div>`).join('')}
  <div class="hint"><b>Закрытие периода.</b> После согласования записи блокируются. Исправить можно только через руководство с фиксацией причины — иначе отчёт клиенту и табель разойдутся.</div>
 </div>
 <div class="pan"><h3 style="margin:0 0 9px">Отчёты клиентам · ждут отметки</h3>
  <div class="tsk" style="--c:var(--warn)"><b>Алтын Фосфат Трейд · возражения на акт</b>
   <p class="mini" style="margin:5px 0 8px">Асель Р. · 9,5 ч · 266 000 ₸ · подготовлен 16.09. Согласующий: Марат Ж. Счёт КО-2026-123 создан, но заблокирован до отметки.</p>
   <button class="bt p" onclick="toast('Отметка «согласовано · Марат Ж. · 18.09 11:42» поставлена. Отчёт и счёт разблокированы — Асель может отправить их клиенту с почты системы.')">Согласовать</button> <button class="bt" onclick="toast('Возвращено Асель с комментарием. Клиенту ничего не ушло — в этом и смысл иерархии.')">Вернуть с комментарием</button></div>
  <div class="tsk" style="--c:var(--warn)"><b>Арна Логистик · возврат НДС · сентябрь</b>
   <p class="mini" style="margin:5px 0 8px">Дана М. · 31 ч · 930 000 ₸. Отчёт сформирован из согласованных записей, счёт КО-2026-121 выставлен 17.09 — согласовано Гульнарой С. 17.09 16:20.</p>
   <span class="tag" style="background:var(--ok-l);color:var(--ok)">согласовано · отправлено клиенту</span></div>
  <div class="note" style="--tone:var(--acc)"><p class="mini" style="margin:0"><b>Что записывается.</b> Кто согласовал, когда, что было возвращено и с каким комментарием. Через полгода при споре с клиентом видно, что отчёт прошёл руководителя, а не ушёл от исполнителя напрямую.</p></div>
 </div>
</div>`;

/* ====== ЗАГРУЗКА ====== */
SC.load=()=>`<div class="hd"><div><h2>Загрузка сотрудников · сентябрь</h2>
 <p>Кто сколько работает, сколько из этого выставляется клиентам и кто не заполняет таймшит. Контроль исполнения без обхода кабинетов.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Выгружено в Excel: часы по сотрудникам, billable, non-billable, незаполненные дни, по подразделениям и юрлицам.')">В Excel</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">
  ${['СОТРУДНИК','ПОДРАЗДЕЛЕНИЕ','ЧАСОВ','BILLABLE','ДОЛЯ','НЕ ЗАПОЛНЕНО','ЗАГРУЗКА'].map((h,i)=>`<th style="text-align:${i>1?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['Гульнара С.',DEPT[0],148,104,0],['Дана М.',DEPT[0],141,112,1],['Ерболат Т.',DEPT[0],122,88,3],['Бекзат А.',DEPT[0],96,61,0],['Марат Ж.',DEPT[1],152,118,0],['Асель Р.',DEPT[1],139,109,0],['Айгуль Ж.',DEPT[2],144,96,0],['Жанар К.',DEPT[2],118,84,2]]
  .map(([n,d,h,b,e])=>`<tr><td style="padding:8px"><b>${n}</b></td><td style="padding:8px;color:var(--muted)">${d}</td>
  <td class="mono" style="text-align:right;padding:8px">${h}</td><td class="mono" style="text-align:right;padding:8px">${b}</td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:700;color:${b/h<0.65?'var(--warn)':'var(--ok)'}">${Math.round(b/h*100)}%</td>
  <td style="text-align:right;padding:8px">${e?`<span class="tag" style="background:var(--warn-l);color:var(--warn)">${e} дн</span>`:'<span class="tag" style="background:var(--ok-l);color:var(--ok)">все</span>'}</td>
  <td style="padding:8px;width:120px">${barHtml(h/160*100,h/160>0.95?'var(--warn)':'var(--brand)')}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Что означает доля billable</h3><p class="mini" style="margin:0">Бекзат — 64%: младший консультант много времени тратит на внутреннее обучение, это нормально. Айгуль — 67%: у главного бухгалтера много административного, тоже ожидаемо. Если у старшего консультанта доля падает ниже 70% — вопрос к загрузке проектами, а не к нему.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Незаполненные дни</h3><p class="mini" style="margin:0">Ерболат — 3 дня за месяц. Это не только дисциплина: за три незаполненных дня по его проектам не выставится примерно 400 000 ₸, потому что отчёт клиенту собирается только из записей.</p></div>
</div>`;

/* ====== ОТЧЁТ КЛИЕНТУ ====== */
SC.report=()=>`<div class="hd"><div><h2>Отчёт клиенту · Арна Логистик · сентябрь</h2>
 <p>Формируется из согласованных записей по проекту: дата, сотрудник, работа, часы, ставка, сумма. На вашем бланке, в Word и PDF. Отправка по почте из системы — письмо и вложение остаются в истории клиента.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Скачан Word на фирменном бланке: 2 страницы, таблица по дням, итоги по сотрудникам. Шаблон бланка утверждается на первой итерации.')">Word</button><button class="bt" onclick="toast('PDF сформирован. Тот же документ, что уходит клиенту.')">PDF</button><button class="bt p" onclick="sendReport()">Отправить клиенту</button></div></div>
<div class="g21">
 <div class="pan" style="border:1px solid var(--line2);background:#fff">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid var(--brand);padding-bottom:9px;margin-bottom:10px">
   <div><b style="font-size:13px;color:var(--brand)">ТОО «ПНК Консалтинг»</b><div class="mini">г. Алматы · БИН 0801400… · договор № 21/2024</div></div>
   <div style="text-align:right"><b>Отчёт о затраченном времени</b><div class="mini">проект P-2026-044 · возврат НДС по экспорту · 01–18.09.2026</div></div>
  </div>
  <table class="t" style="font-size:11px">
   <thead><tr style="border-bottom:1px solid var(--line2)">${['ДАТА','СОТРУДНИК','РАБОТА','ЧАСЫ','СТАВКА','СУММА'].map((h,i)=>`<th style="text-align:${i>2?'right':'left'};padding:6px;font-size:9.6px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
   <tbody>${[['02.09','Дана М.','Анализ экспортных контрактов и СНТ',4,30000],['04.09','Ерболат Т.','Сверка счетов-фактур с ФНО 300.00',6,22000],['08.09','Дана М.','Подготовка заявления на возврат',3.5,30000],['11.09','Ерболат Т.','Формирование реестра документов',5,22000],['15.09','Дана М.','Подготовка пакета по НДС, ответы на запрос ДГД',2.5,30000],['16.09','Дана М.','Правки по замечаниям клиента',3,30000],['17.09','Ерболат Т.','Сдача пакета, подтверждение приёма',7,22000]]
    .map(([d,s,w,h,r])=>`<tr><td class="mono" style="padding:6px">${d}</td><td style="padding:6px">${s}</td><td style="padding:6px">${w}</td><td class="mono" style="text-align:right;padding:6px">${num(h)}</td><td class="mono" style="text-align:right;padding:6px">${fmt(r)}</td><td class="mono" style="text-align:right;padding:6px">${fmt(h*r)}</td></tr>`).join('')}</tbody>
   <tfoot><tr style="border-top:1.5px solid var(--line2);font-weight:800"><td colspan="3" style="padding:8px 6px">Итого · Дана М. 13 ч · Ерболат Т. 18 ч</td><td class="mono" style="text-align:right;padding:8px 6px">31</td><td></td><td class="mono" style="text-align:right;padding:8px 6px">930 000 ₸</td></tr></tfoot>
  </table>
  <div class="mini" style="margin-top:9px;display:flex;justify-content:space-between"><span>Согласовано: Гульнара С., руководитель направления · 17.09.2026 16:20</span><span>стр. 1 из 2</span></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Состояние</h3>
   <div class="kv"><span>Записей включено</span><b>7 из 7 согласованных</b></div>
   <div class="kv"><span>Согласование</span><b style="color:var(--ok)">✓ Гульнара С. · 17.09</b></div>
   <div class="kv"><span>Счёт</span><b>КО-2026-121 · 930 000 ₸</b></div>
   <div class="kv"><span>Отправлен</span><b>17.09 16:41 · почта</b></div>
   <div class="kv" style="border:0"><span>Открыт клиентом</span><b>17.09 17:05</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Чего здесь нет</h3>
   <p class="mini" style="margin:0">Внутренних комментариев, времени по другим клиентам, планёрок, себестоимости. Клиент видит только своё и только то, что прошло согласование. Ваш вопрос «а клиентам личный кабинет нужен?» — нет: этот документ по почте закрывает потребность.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Бланк</h3>
   <p class="mini" style="margin:0">Логотип, реквизиты юрлица-исполнителя, подпись руководителя направления, нумерация страниц. Один шаблон на юрлицо, правится администратором без нас.</p>
  </div>
 </div>
</div>`;

/* ====== СЧЕТА ====== */
SC.invoices=()=>{
 const late=INV.filter(i=>i.st==='late'), sum=s=>INV.filter(i=>i.st===s).reduce((a,i)=>a+i.sum,0);
 return `<div class="hd"><div><h2>Счета и дебиторка</h2>
 <p>Счёт создаётся из согласованного отчёта; юрлицо-исполнитель и нумерация — из договора клиента. Два юрлица, две нумерации. Просрочка считается от срока в договоре.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Напоминания отправлены по 2 просроченным счетам: с суммой, номером, датой согласования отчёта и приложенным отчётом. Для клиентов по рекомендации это важнее жёстких формулировок.')">Напомнить просроченным</button><button class="bt p" onclick="toast('Абонентские счета за сентябрь сформированы по 1 клиенту: Медикус КЗ, 380 000 ₸, КО-2026-124. Отправлены на почту.')">Выставить абонентские</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Выставлено в сентябре</small><b class="a">${fmt(INV.filter(i=>i.dt!=='—').reduce((a,i)=>a+i.sum,0))} ₸</b><span>${INV.length-1} счетов по 2 юрлицам</span></div>
 <div><small>Оплачено</small><b class="g">${fmt(sum('paid'))} ₸</b><span>4 счёта</span></div>
 <div><small>Просрочено</small><b class="r">${fmt(sum('late'))} ₸</b><span>${late.length} счёта</span></div>
 <div><small>Заблокировано</small><b class="w">${fmt(sum('wait'))} ₸</b><span>ждёт согласования отчёта</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['СЧЁТ','ЮРЛИЦО','КЛИЕНТ','ПРОЕКТ','СУММА','ВЫСТАВЛЕН','СРОК','СОСТОЯНИЕ'].map((h,i)=>`<th style="text-align:${i>=4?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${INV.map(i=>`<tr><td class="mono" style="padding:8px"><b>${i.n}</b></td><td style="padding:8px;color:var(--muted)">${esc(LE[i.le]).replace('ТОО ','')}</td><td style="padding:8px">${esc(cliName(i.c))}</td><td class="mono" style="padding:8px;color:var(--muted)">${i.p}</td>
  <td class="mono" style="text-align:right;padding:8px">${fmt(i.sum)} ₸</td><td class="mono" style="text-align:right;padding:8px">${i.dt}</td><td class="mono" style="text-align:right;padding:8px">${i.due}</td>
  <td style="text-align:right;padding:8px">${tag(IST[i.st][0],IST[i.st][1])}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 7px">Просрочка — с причиной</h3>
  <div class="srow" style="border-left:3px solid var(--bad)"><div style="flex:1"><b>Степногорск Энерго · 6 дней · 2 840 000 ₸</b><div class="mini">Письмо о переносе срока получено 16.09 (Вх-2026-0416). Решение руководства: принять до 26.09</div></div></div>
  <div class="srow" style="border-left:3px solid var(--bad)"><div style="flex:1"><b>Медикус КЗ · 8 дней · 380 000 ₸</b><div class="mini">Абонемент, обычно платят 5-го. Напоминание ушло 12.09, ответа нет</div></div></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 7px">Связь с 1С · опция</h3><p class="mini" style="margin:0">Сейчас оплата отмечается бухгалтерией по выписке — одна кнопка на счёте. С интеграцией 1С 8.x оплаты приходят сами, а счета и акты уходят в учёт без перебивки. 800 000 ₸, требует 1С не ниже восьмой версии.</p></div>
</div>`;
};

/* ====== СЕБЕСТОИМОСТЬ ====== */
SC.cost=()=>{
 const rows=PRJ.map(p=>{const m=p.bill-p.cost,mp=Math.round(m/p.bill*100);return `<tr><td style="padding:8px"><b>${esc(p.n)}</b><div class="mini">${esc(cliName(p.c))} · ${esc(p.kind)}</div></td>
  <td class="mono" style="text-align:right;padding:8px">${num(p.h)}</td><td class="mono" style="text-align:right;padding:8px">${fmt(p.bill)}</td><td class="mono" style="text-align:right;padding:8px;color:var(--muted)">${fmt(p.cost)}</td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:800;color:${mp<50?'var(--warn)':'var(--ok)'}">${mp}%</td><td class="mono" style="text-align:right;padding:8px">${fmt(Math.round(m/p.h))}</td></tr>`}).join('');
 const B=PRJ.reduce((a,p)=>a+p.bill,0),Cst=PRJ.reduce((a,p)=>a+p.cost,0);
 return `<div class="hd"><div><h2>Себестоимость и маржа</h2>
 <p>Ваши слова: «расчёт себестоимости проектов… исходя из себестоимости каждого работника, который закладывается в систему». У каждого сотрудника — себестоимость часа из оклада и нормы. Себестоимость проекта — сумма часов на ставки. Рядом — выставленная сумма и маржа. Считается каждый день, а не после закрытия.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Отчёт за квартал: маржа по клиентам, направлениям, сотрудникам и юрлицам. Видно, что юридическое направление даёт 79%, бухгалтерское сопровождение — 24%: абонемент Медикус переедает норму часов.')">Отчёт за квартал</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Выставлено</small><b class="a">${mln(B)} ₸</b><span>10 проектов</span></div>
 <div><small>Себестоимость</small><b>${mln(Cst)} ₸</b><span>часы × себестоимость часа</span></div>
 <div><small>Маржа</small><b class="g">${Math.round((B-Cst)/B*100)}%</b><span>${mln(B-Cst)} ₸</span></div>
 <div><small>Худший проект</small><b class="w">Медикус · 24%</b><span>64 ч при норме 60</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['ПРОЕКТ','ЧАСЫ','ВЫСТАВЛЕНО','СЕБЕСТОИМОСТЬ','МАРЖА','₸ / ЧАС МАРЖИ'].map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${rows}</tbody></table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 8px">Себестоимость часа по сотрудникам</h3>
  ${STAFF.filter(s=>s.r).map(s=>`<div class="kv"><span>${esc(s.n)} · <span class="mini">${esc(s.role)}</span></span><b class="mono">${fmt(s.c)} ₸ → ${fmt(s.r)} ₸</b></div>`).join('')}
  <p class="mini" style="margin:8px 0 0">Слева себестоимость, справа ставка продажи по типовому договору. Формула себестоимости: оклад с налогами и накладными ÷ норма часов. Параметры задаёте вы.</p>
 </div>
 <div class="pan"><h3 style="margin:0 0 8px">Вывод, который виден только на данных</h3>
  <p class="mini" style="margin:0 0 9px">Абонемент Медикус КЗ: 380 000 ₸ в месяц при 64 часах — это 5 900 ₸ за час против 16 000–18 000 по обычным ставкам. Клиент с 2017 года, и всё это время абонемент, скорее всего, не пересматривался. Система показывает это в сентябре, а не при случайном пересчёте.</p>
  <p class="mini" style="margin:0">Второй вывод: ТЦО для Степногорска даёт 79% маржи, но платят с задержкой в шесть дней. Рентабельность и дебиторка — на одном экране, потому что одно без другого вводит в заблуждение.</p>
 </div>
</div>`;
};
/* ====== КАБИНЕТ СОТРУДНИКА ====== */
SC.me=()=>`<div class="hd"><div><h2>Кабинет сотрудника · Дана М. · четверг, 18 сентября</h2>
 <p>Ваши слова: «Свои личные кабинеты, где они могут получать задачу руководства, где они видят свою зарплату, свой отпуск, заполняют свой отчёт по затраченной работе». Один экран на день — всё это здесь.</p></div>
 <div class="btns"><button class="bt p" onclick="go('timesheet')">Заполнить время</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Задач на сегодня</small><b class="a">3</b><span>1 срочная</span></div>
 <div><small>Время за неделю</small><b>32 ч 15 мин</b><span>пятница не заполнена</span></div>
 <div><small>Остаток отпуска</small><b>17 дней</b><span>по вашей формуле · заявка на 6–17.10 согласована</span></div>
 <div><small>Зарплата за август</small><b class="g">— ₸</b><span>видна только сотруднику и руководству</span></div>
</div>
<div class="g21">
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Задачи</h3>
   ${TASKS.filter(t=>t.who==='Дана М.').map(t=>`<div class="tsk" style="--c:${t.st==='late'?'var(--bad)':t.pr==='high'?'var(--warn)':'var(--acc)'}"><b>${esc(t.t)}</b>
    <p class="mini" style="margin:4px 0 7px">от ${esc(t.from)} · ${t.c!=='—'?esc(cliName(t.c))+' · ':''}срок ${t.due}</p>
    <button class="bt" onclick="toast('Задача переведена в «на проверке». Постановщик увидит это у себя, при просрочке — в списке руководителя.')">Выполнено</button> <button class="bt" onclick="toast('Комментарий добавлен к задаче. Переписка по задаче живёт в ней, а не в мессенджере.')">Комментарий</button></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 9px">Мои проекты</h3>
   ${PRJ.filter(p=>p.team.indexOf('Дана М.')>=0&&p.st!=='done').map(p=>`<div class="srow"><div style="flex:1"><b>${esc(p.n)}</b><div class="mini">${esc(cliName(p.c))} · руководитель ${esc(p.lead)}</div></div><b class="mono">${hrs(p.h)}</b></div>`).join('')}
   <p class="mini" style="margin:8px 0 0">Ставок и себестоимости здесь нет — консультант видит часы, не деньги клиента.</p>
  </div>
 </div>
 <div>
  <div class="pan" style="border-top:3px solid var(--bad)"><h3 style="margin:0 0 8px">Документы на ознакомление</h3>
   <div class="srow" style="border-left:3px solid var(--ok)"><div style="flex:1"><b>Приказ № 47 · соглашение о конфиденциальности</b><div class="mini">ознакомлена 16.09 10:22</div></div></div>
   <div class="srow" style="border-left:3px solid var(--warn)"><div style="flex:1"><b>Регламент заполнения таймшитов</b><div class="mini">не прочитан · не блокирует</div></div><button class="bt" onclick="toast('Отметка «ознакомлена · 18.09» поставлена. Делопроизводитель видит её в сводке по регламенту.')">Прочитала</button></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Календарь на сегодня</h3>
   <div class="kv"><span>10:00</span><b>Планёрка направления</b></div>
   <div class="kv"><span>12:30</span><b>Zoom · Каспий Фуд · DD</b></div>
   <div class="kv"><span>15:00</span><b style="color:var(--warn)">Перезвонить Арна Логистик</b></div>
   <div class="kv" style="border:0"><span>17:30</span><b>Напоминание: заполнить время</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Зарплата и KPI · август</h3>
   <div class="kv"><span>Выставляемых часов</span><b>118 · 82%</b></div>
   <div class="kv"><span>Таймшит в срок</span><b>21 из 22 дней</b></div>
   <div class="kv"><span>Задачи в срок</span><b>94%</b></div>
   <div class="kv" style="border:0"><span>Премия по KPI</span><b style="color:var(--ok)">начислена</b></div>
   <p class="mini" style="margin:8px 0 0">Суммы видны сотруднику в своём кабинете. В демо скрыты, чтобы показывать экран любому.</p>
  </div>
 </div>
</div>`;

/* ====== ТАБЕЛЬ ====== */
SC.tabel=()=>`<div class="hd"><div><h2>Табель и отпуска · сентябрь</h2>
 <p>Табель собирается из таймшитов и календаря отсутствий, по каждому юрлицу отдельно. Ваши слова: «программа тут же формирует табель, туда заложены особые условия определения отпускных — это легко программируется одной формулой».</p></div>
 <div class="btns"><div class="ptabs" style="margin:0"><button class="ptab on">ТОО «ПНК Консалтинг»</button><button class="ptab" onclick="toast('Табель ТОО «ПНК Аудит и право»: Марат Ж., Асель Р. и ещё 4 сотрудника. Отдельная форма, отдельная выгрузка.')">ПНК Аудит и право</button><button class="ptab" onclick="toast('Табель ОО «Палата»: Динара Н. и 2 сотрудника членства.')">ОО Палата</button></div><button class="bt" onclick="toast('Табель Т-2 за сентябрь по ТОО «ПНК Консалтинг» выгружен в Excel: 14 сотрудников, дни, часы, отсутствия. При интеграции с 1С уходит туда сам.')">Выгрузить</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.3px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['СОТРУДНИК','ДНЕЙ','ЧАСОВ','ОТПУСК','БОЛЬНИЧНЫЙ','КОМАНДИРОВКА','ОСТАТОК ОТПУСКА'].map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['Гульнара С.',13,104,0,0,1,21],['Дана М.',13,104,0,0,0,17],['Ерболат Т.',12,96,0,1,0,24],['Бекзат А.',9,72,4,0,0,8],['Айгуль Ж.',13,104,0,0,0,12],['Жанар К.',13,104,0,0,0,19],['Сауле К.',13,104,0,0,0,26],['Виталия',13,104,0,0,0,14]]
  .map(r=>`<tr><td style="padding:8px"><b>${r[0]}</b></td>${r.slice(1).map((v,i)=>`<td class="mono" style="text-align:right;padding:8px;${i>=2&&i<=4&&v?'color:var(--warn);font-weight:700':''}">${v}</td>`).join('')}</tr>`).join('')}</tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 7px">Заявки на отпуск</h3>
  <div class="srow" style="border-left:3px solid var(--warn)"><div style="flex:1"><b>Ерболат Т. · 13–24.10</b><div class="mini">10 дней · остаток 24 · ждёт Гульнару С.</div></div><button class="bt" onclick="toast('Отпуск согласован. Попал в календарь подразделения, табель за октябрь и остаток отпуска. Задачи на эти даты система ставить не даст.')">Согласовать</button></div>
  <div class="srow" style="border-left:3px solid var(--ok)"><div style="flex:1"><b>Дана М. · 6–17.10</b><div class="mini">согласовано 10.09</div></div></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 7px">Формула отпускных</h3><p class="mini" style="margin:0">Ваши «особые условия» задаются параметрами: базовые дни, надбавка за стаж, дни за ненормированный день, порядок округления. Меняете параметр — остатки пересчитываются у всех. В код за этим ходить не нужно.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Связь с зарплатой</h3><p class="mini" style="margin:0">Табель — основа управленческого расчёта зарплаты (раздел KPI). Официальные начисления и налоги остаются в бухгалтерской программе; сюда они не переносятся, отсюда — выгружаются.</p></div>
</div>`;

/* ====== ПОРУЧЕНИЯ ====== */
SC.tasks=()=>`<div class="hd"><div><h2>Поручения и контроль исполнения</h2>
 <p>Ваши слова: «Нам нужно, чтобы контроль за выполнением поручений соблюдался у сотрудников». Руководитель ставит задачу — она у сотрудника в кабинете и календаре. Просроченные поднимаются сюда сами.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Отчёт по дисциплине за август: в срок 87%, с опозданием 9%, не выполнено 4%. По подразделениям и сотрудникам. Это цифры, а не ощущение «вроде всё делают».')">Отчёт по дисциплине</button><button class="bt p" onclick="toast('Новая задача: исполнитель, срок, приоритет, связь с клиентом или проектом, вложения. Появится у исполнителя в кабинете и календаре, в WhatsApp — по выбору.')">+ Поручение</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Открытых</small><b class="a">${TASKS.length}</b><span>по всем сотрудникам</span></div>
 <div><small>Просрочено</small><b class="r">${TASKS.filter(t=>t.st==='late').length}</b><span>поднято руководству</span></div>
 <div><small>Срочных</small><b class="w">${TASKS.filter(t=>t.pr==='high').length}</b><span>на этой неделе</span></div>
 <div><small>От системы</small><b>${TASKS.filter(t=>t.from==='система').length}</b><span>просрочки счетов, согласования</span></div>
</div>
<div class="pan">${TASKS.map(t=>`<div class="dl" style="--c:${t.st==='late'?'var(--bad)':t.st==='work'?'var(--acc)':'var(--line2)'}">
 <div style="flex:1;min-width:0"><b>${esc(t.t)}</b><div class="mini">исполнитель <b>${esc(t.who)}</b> · от ${esc(t.from)}${t.c!=='—'?' · '+esc(cliName(t.c)):''}</div></div>
 <span class="mini" style="width:92px">${t.due}</span>
 ${tag(t.pr==='high'?'срочно':t.pr==='mid'?'обычно':'низкий',t.pr==='high'?'var(--bad)':'var(--muted)')}
 ${tag(t.st==='late'?'просрочена':t.st==='work'?'в работе':'новая',t.st==='late'?'var(--bad)':t.st==='work'?'var(--acc)':'var(--muted)')}</div>`).join('')}</div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Три уровня задач</h3><p class="mini" style="margin:0">Административные — между коллегами; личные — себе; связанные с клиентом или воронкой. Как вы и уточняли: «руководитель поставил — у сотрудника отображается, сам поставил — тоже, напоминалки — тоже».</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Задачи от системы</h3><p class="mini" style="margin:0">Просроченный счёт, отчёт без согласования, кандидат без документов — система сама ставит задачу ответственному. Половина списка выше создана без участия людей.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Переписка внутри</h3><p class="mini" style="margin:0">Комментарии и вложения — в задаче. Через месяц видно, кто что сказал, а не «где-то в WhatsApp было».</p></div>
</div>`;

/* ====== КАЛЕНДАРИ ====== */
SC.cal=()=>`<div class="hd"><div><h2>Календари · неделя 15–19 сентября</h2>
 <p>Личный календарь у каждого плюс общие по подразделениям и компании. Встреча, задача, звонок и отсутствие попадают сюда сами. Руководитель видит календари своих сотрудников; сотрудник — свой и общие.</p></div>
 <div class="btns"><div class="ptabs" style="margin:0"><button class="ptab on">Налоговое направление</button><button class="ptab" onclick="toast('Личный календарь: только свои встречи, задачи и напоминания.')">Мой</button><button class="ptab" onclick="toast('Общий календарь компании: семинары Палаты, общие собрания, отсутствия руководства.')">Компания</button></div></div></div>
<div class="pan" style="overflow-x:auto"><div style="display:grid;grid-template-columns:110px repeat(5,1fr);gap:6px;min-width:820px">
 <div></div>${['Пн 15','Вт 16','Ср 17','Чт 18','Пт 19'].map(d=>`<div class="mini" style="font-weight:800;text-align:center;padding:4px;border-bottom:2px solid ${d==='Чт 18'?'var(--brand2)':'var(--line)'}">${d}</div>`).join('')}
 ${[['Гульнара С.',[['Планёрка','acc'],['ДГД · выезд','warn'],['Согласование','ok'],['Планёрка · Каспий Фуд','acc'],['—','']]],
    ['Дана М.',[['Планёрка','acc'],['Степногорск · сверка','acc'],['Семинар Палаты','violet'],['Каспий Фуд · Zoom · 15:00 звонок','warn'],['не заполнено','bad']]],
    ['Ерболат Т.',[['—',''],['Арна · документы','acc'],['—',''],['—',''],['—','']]],
    ['Бекзат А.',[['отпуск','muted'],['отпуск','muted'],['отпуск','muted'],['отпуск','muted'],['отпуск','muted']]]]
  .map(([n,days])=>`<div style="font-size:11.4px;font-weight:700;padding:8px 4px">${n}</div>`+days.map(([t,c])=>`<div style="padding:7px 8px;border-radius:5px;font-size:10.4px;min-height:44px;background:${c?`var(--${c==='muted'?'card3':c+'-l'})`:'var(--card2)'};color:${c&&c!=='muted'?`var(--${c})`:'var(--muted2)'};border:1px solid var(--line)">${t}</div>`).join('')).join('')}
</div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 7px">Напоминание, поставленное из карточки клиента</h3><p class="mini" style="margin:0">Четверг, 15:00 у Даны — «перезвонить Арна Логистик» — поставлено из карточки клиента во вторник. Придёт в системе и в WhatsApp. Если к вечеру не отмечено сделанным — попадёт в список руководителя.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Права на календари</h3><p class="mini" style="margin:0">Ваш вопрос: «отделу необязательно знать, что там юридический отдел делает». Юристы видят свой календарь направления, налоговики — свой; руководство — все. Внешние календари Google и Outlook — по желанию, на полировочном этапе.</p></div>
</div>`;

/* ====== ЗАРПЛАТА И KPI ====== */
SC.kpi=()=>`<div class="hd"><div><h2>Зарплата и KPI · август</h2>
 <p>Ваши слова: «Главное, чтобы учёт был самой зарплаты, KPI сотрудников возможно стоит предусмотреть». Показатели берутся из системы, а не заполняются руками: часы, доля billable, своевременность таймшитов, задачи в срок, выручка по проектам.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Правила: оклад из карточки, премия = базовая × коэффициент KPI. Веса показателей — ваши: например, billable 40%, задачи в срок 30%, таймшит в срок 15%, выручка 15%. Меняются администратором.')">Настроить веса</button><button class="bt p" onclick="toast('Расчёт за август сформирован по 14 сотрудникам ТОО «ПНК Консалтинг». Выгружен бухгалтеру для официального начисления в 1С.')">Рассчитать за месяц</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.3px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['СОТРУДНИК','ЧАСОВ','BILLABLE','ТАЙМШИТ В СРОК','ЗАДАЧИ В СРОК','ВЫРУЧКА','KPI','ПРЕМИЯ'].map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['Гульнара С.',148,'70%','100%','96%','4 120 000',1.12],['Дана М.',141,'82%','95%','94%','3 540 000',1.08],['Ерболат Т.',122,'72%','82%','88%','2 240 000',0.91],['Бекзат А.',96,'64%','100%','100%','960 000',0.97],['Марат Ж.',152,'78%','100%','92%','5 010 000',1.10],['Асель Р.',139,'78%','100%','97%','3 280 000',1.09],['Айгуль Ж.',144,'67%','100%','90%','1 720 000',1.00],['Жанар К.',118,'71%','86%','85%','1 080 000',0.88]]
  .map(r=>`<tr><td style="padding:8px"><b>${r[0]}</b></td><td class="mono" style="text-align:right;padding:8px">${r[1]}</td><td class="mono" style="text-align:right;padding:8px">${r[2]}</td><td class="mono" style="text-align:right;padding:8px">${r[3]}</td><td class="mono" style="text-align:right;padding:8px">${r[4]}</td><td class="mono" style="text-align:right;padding:8px">${r[5]} ₸</td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:800;color:${r[6]<0.95?'var(--warn)':'var(--ok)'}">${r[6].toFixed(2)}</td><td style="text-align:right;padding:8px">${seeMoney()?'<span class="mono">— ₸</span>':'<span class="tag">скрыто</span>'}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 7px">Что говорят цифры</h3><p class="mini" style="margin:0">Ерболат и Жанар ниже 0,95 по одной и той же причине — таймшит заполняется с опозданием, и из-за этого часть часов не попадает в отчёты клиентам вовремя. Это не про наказание: премия сама объясняет, что именно нужно делать иначе.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Границы</h3><p class="mini" style="margin:0">Расчёт здесь управленческий. Суммы видит руководство, бухгалтерия и сам сотрудник — в своём кабинете. Официальное начисление, налоги и выплаты — в бухгалтерской программе; при интеграции с 1С табель и расчёт уходят туда автоматически.</p></div>
</div>`;

/* ====== ЖУРНАЛЫ ====== */
SC.journal=()=>`<div class="hd"><div><h2>Журналы входящих и исходящих</h2>
 <p>Ваши слова: «Бывали ситуации, когда Excel-документ то потерялся, то слетел, а сотрудники один номер присвоили и тот, и тот — бардак». Здесь номер присваивается системой, сквозной по каждому юрлицу, и два одинаковых невозможны.</p></div>
 <div class="btns"><div class="ptabs" style="margin:0"><button class="ptab on">Все юрлица</button><button class="ptab" onclick="toast('Только ТОО «ПНК Консалтинг»: своя нумерация Вх/Исх.')">Консалтинг</button><button class="ptab" onclick="toast('Только ОО «Палата»: переписка с членами и госорганами.')">Палата</button></div><button class="bt p" onclick="regDoc()">+ Зарегистрировать</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.4px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['НОМЕР','ДАТА','КОРРЕСПОНДЕНТ','ТЕМА','ОТВЕТСТВЕННЫЙ','СРОК','ЮРЛИЦО'].map((h,i)=>`<th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${JRN.map(j=>`<tr><td class="mono" style="padding:8px"><b style="color:${j.dir==='in'?'var(--acc)':'var(--violet)'}">${j.n}</b></td><td class="mono" style="padding:8px">${j.dt}</td><td style="padding:8px">${esc(j.from)}</td><td style="padding:8px">${esc(j.subj)}</td><td style="padding:8px">${esc(j.who)}</td><td class="mono" style="padding:8px;${j.due!=='—'&&j.due<'20.09'?'color:var(--warn);font-weight:700':''}">${j.due}</td><td style="padding:8px;color:var(--muted)">${esc(LE[j.le]).replace(/ТОО |ОО /,'')}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Автонумерация</h3><p class="mini" style="margin:0">Вх-2026-0418 — следующий будет 0419, и только он. Номер не редактируется руками. По каждому юрлицу своя последовательность. Удалённая запись остаётся в журнале с пометкой «аннулировано».</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Связь с делом</h3><p class="mini" style="margin:0">Уведомление ДГД по Алтын Фосфат подшито к клиенту и к проекту P-2026-041; ответ до 02.10 стоит задачей Гульнаре. Когда придёт ответ — зарегистрируется исходящим со ссылкой на входящий.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Другие журналы</h3><p class="mini" style="margin:0">Договоры, доверенности, приказы — добавляются администратором как тип журнала со своей нумерацией. Интеграция с «Документологом» — по желанию, если он у вас останется.</p></div>
</div>`;

/* ====== ПРИКАЗЫ И ОЗНАКОМЛЕНИЕ ====== */
SC.orders=()=>`<div class="hd"><div><h2>Приказы и ознакомление</h2>
 <p>Ваши слова: «Чтобы каждый прочитал, и была отметка, что он прочитал… пока он не ознакомился — доступа не имеется». Обычный документ — отметка. Блокирующий — кабинет закрыт до подтверждения.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Новый документ: файл, кому (все / подразделение / список), признак «блокирующий». После публикации у каждого адресата появится карточка в кабинете, у блокирующих — поверх всего.')">+ Опубликовать</button></div></div>
<div class="pan">${ORD.map(o=>`<div class="dl" style="--c:${o.read<o.of?(o.block?'var(--bad)':'var(--warn)'):'var(--ok)'}">
 <div style="flex:1;min-width:0"><b>${esc(o.n)} · ${esc(o.t)}</b><div class="mini">${o.dt} · ${esc(o.to)}${o.block?' · <b style="color:var(--bad)">блокирующий</b>':''}</div></div>
 <div style="width:140px">${barHtml(o.read/o.of*100,o.read<o.of?'var(--warn)':'var(--ok)')}<div class="mini" style="text-align:right;margin-top:3px">${o.read} из ${o.of}</div></div>
 ${o.read<o.of?`<button class="bt" onclick="toast('Не ознакомились: ${o.of-o.read} ${plural(o.of-o.read,['сотрудник','сотрудника','сотрудников'])}. Список с датой публикации и напоминаниями — делопроизводителю и руководству. Напоминание отправлено.')">Кто не прочитал</button>`:'<span class="tag" style="background:var(--ok-l);color:var(--ok)">все</span>'}</div>`).join('')}</div>
<div class="g2">
 <div class="pan" style="border-top:3px solid var(--bad)"><h3 style="margin:0 0 8px">Как выглядит блокировка у сотрудника</h3>
  <div style="border:1px solid var(--line);border-radius:6px;padding:14px;background:var(--card2);text-align:center">
   <b style="font-size:13px">Приказ № 47 · соглашение о конфиденциальности</b>
   <p class="mini" style="margin:6px 0 10px">Для продолжения работы необходимо ознакомиться с документом и подтвердить согласие. Остальные разделы кабинета недоступны.</p>
   <button class="bt" onclick="toast('Документ открыт для чтения, 3 страницы.')">Открыть документ</button> <button class="bt p" onclick="toast('Подтверждено: «ознакомлен и согласен · 18.09 · Ерболат Т.». Кабинет разблокирован. Отметка в истории ознакомлений — для кадровых проверок.')">Ознакомлен и согласен</button>
  </div>
 </div>
 <div class="pan"><h3 style="margin:0 0 8px">Зачем это кадрам</h3>
  <p class="mini" style="margin:0 0 8px">История ознакомлений выгружается: кто, когда, с чем. При проверке или споре с сотрудником это подтверждение, а не «мы же всем говорили».</p>
  <div class="kv"><span>Ноутбук выдан · материальная ответственность</span><b style="color:var(--warn)">2 из 3</b></div>
  <div class="kv"><span>Конфиденциальность · новая редакция</span><b style="color:var(--warn)">19 из 25</b></div>
  <div class="kv" style="border:0"><span>График отпусков</span><b style="color:var(--ok)">25 из 25</b></div>
 </div>
</div>`;
/* ====== РЕЕСТР ЧЛЕНОВ ====== */
SC.members=()=>`<div class="hd"><div><h2>Реестр членов Палаты</h2>
 <p>Ваши слова: «Более пяти тысяч налоговых консультантов Республики Казахстан заложены в нашей системе». В демо — десять карточек, структура полная: категория, сертификат, статус, взносы. Реестры по категориям формируются отсюда и публикуются на сайт.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Реестр действующих членов I категории выгружен в Excel и PDF: 1 204 записи. Тот же список публикуется на сайте — только поля, которые вы решили открыть.')">Реестр по категории</button><button class="bt p" onclick="toast('Поиск по реестру: ФИО, номер сертификата, город, место работы. Публичный поиск на сайте — по ФИО и номеру.')">Поиск</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>В реестре</small><b class="a">${fmt(F.total)}</b><span>действующих</span></div>
 <div><small>I категории</small><b>1 204</b><span>35%</span></div>
 <div><small>II категории</small><b>1 418</b><span>42%</span></div>
 <div><small>Аттестованных</small><b>612</b><span>18%</span></div>
 <div><small>Ассоциированных</small><b>178</b><span>5%</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.4px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['НОМЕР','ЧЛЕН ПАЛАТЫ','ГОРОД','КАТЕГОРИЯ','СЕРТИФИКАТ','С ГОДА','ВЗНОС 2026','СТАТУС'].map((h,i)=>`<th style="text-align:${i>=5?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${MEM.map(m=>{const fee=FEE[m.cat],d=fee-m.paid;return `<tr style="cursor:pointer" onclick="curMem='${m.id}';go('member')">
  <td class="mono" style="padding:8px">${m.id}</td><td style="padding:8px"><b>${esc(m.n)}</b><div class="mini">${esc(m.work)}</div></td><td style="padding:8px">${esc(m.city)}</td>
  <td style="padding:8px">${esc(m.cat).replace('Налоговый консультант ','НК ')}</td><td class="mono" style="padding:8px;color:var(--muted)">${m.cert}</td><td class="mono" style="text-align:right;padding:8px">${m.since}</td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:700;color:${d<=0?'var(--ok)':m.paid?'var(--warn)':'var(--bad)'}">${d<=0?'оплачен':m.paid?'долг '+fmt(d):'долг '+fmt(d)}</td>
  <td style="text-align:right;padding:8px">${tag(MST[m.st][0],MST[m.st][1])}</td></tr>`}).join('')}</tbody>
</table></div>
<div class="hint"><b>Персональные данные.</b> Открытие карточки члена пишется в журнал: кто и когда смотрел. Публичный реестр показывает только ФИО, город, категорию и номер сертификата — набор полей задаёте вы.</div>`;

SC.member=()=>{
 const m=M(curMem),fee=FEE[m.cat],d=fee-m.paid;
 return `<div class="hd"><div><h2>${esc(m.n)} · ${m.id}</h2>
 <p>${esc(m.cat)} · ${esc(m.city)} · ${esc(m.work)} · сертификат ${m.cert} · в Палате с ${m.since}</p></div>
 <div class="btns"><select class="rsel" onchange="curMem=this.value;build()">${MEM.map(x=>`<option value="${x.id}"${x.id===m.id?' selected':''}>${esc(x.n)} · ${x.id}</option>`).join('')}</select>
 <button class="bt" onclick="toast('Выписка из реестра сформирована в PDF на бланке Палаты: номер, категория, сертификат, статус на дату.')">Выписка</button><button class="bt p" onclick="toast('Уведомление отправлено в кабинет и на e-mail. Текст — из шаблона, редактируется вами.')">Уведомить</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Статус</small><b class="${m.st==='act'?'g':'w'}">${MST[m.st][0]}</b><span>с ${m.since} года</span></div>
 <div><small>Взнос 2026</small><b class="${d<=0?'g':'r'}">${d<=0?'оплачен':'долг '+fmt(d)+' ₸'}</b><span>начислено ${fmt(fee)} · оплачено ${fmt(m.paid)}</span></div>
 <div><small>Документов</small><b>7</b><span>проверены при вступлении</span></div>
 <div><small>Уведомлений за год</small><b>4</b><span>взнос, 2 разъяснения, семинар</span></div>
</div>
<div class="g21">
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Взносы по годам</h3>
   ${[[2026,fee,m.paid],[2025,fee,fee],[2024,fee,fee],[2023,fee,fee]].map(([y,ch,pd])=>`<div class="kv"><span>${y}</span><span><b class="mono">${fmt(pd)} из ${fmt(ch)} ₸</b> ${pd>=ch?tag('оплачен','var(--ok)'):pd?tag('частично','var(--warn)'):tag('долг','var(--bad)')}</span></div>`).join('')}
   <p class="mini" style="margin:8px 0 0">Оплата отмечается бухгалтерией по Kaspi-платежу или выписке; с интеграцией 1С — приходит сама. Ваши слова: «1С формирует показатели по наличию задолженности либо переплате, и вся эта информация автоматически попадает в нашу систему».</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 9px">История</h3>
   <div class="tl">
    <div class="tli"><b style="font-size:11.6px">15.09 · система</b><p class="mini" style="margin:2px 0 0">Разъяснение по ст. 412 НК отправлено в кабинет и на почту. Открыто 15.09 19:40.</p></div>
    <div class="tli"><b style="font-size:11.6px">02.04 · Kaspi</b><p class="mini" style="margin:2px 0 0">Оплата взноса 2026 · ${fmt(m.paid)} ₸. Подтверждено автоматически.</p></div>
    <div class="tli"><b style="font-size:11.6px">31.03 · система</b><p class="mini" style="margin:2px 0 0">Начислен годовой взнос ${fmt(fee)} ₸ по категории. Уведомление в кабинет и на e-mail.</p></div>
    <div class="tli"><b style="font-size:11.6px">${m.since} · Палата</b><p class="mini" style="margin:2px 0 0">Принят в члены, присвоен номер ${m.id}, выдан сертификат ${m.cert}.</p></div>
   </div>
  </div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Документы</h3>
   ${['Заявление о вступлении','Удостоверение личности','Диплом','Трудовая книжка','Рекомендации · 2','Сертификат о квалификации','Согласие на обработку ПД'].map(x=>`<div class="kv" style="padding:5px 0"><span>${x}</span><b style="color:var(--ok)">✓</b></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Заявления из кабинета</h3>
   <p class="mini" style="margin:0">Изменение данных, приостановка членства, выход — член подаёт из кабинета, заявление попадает Динаре Н. задачей. Смена статуса здесь меняет публичный реестр на сайте автоматически.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Журнал доступа</h3>
   <div class="kv" style="font-size:11px"><span>18.09 11:02 · Динара Н.</span><b>открыла карточку</b></div>
   <div class="kv" style="font-size:11px;border:0"><span>02.04 09:15 · Айгуль Ж.</span><b>отметила оплату</b></div>
  </div>
 </div>
</div>`;
};

/* ====== ВСТУПЛЕНИЕ ====== */
SC.join=()=>{
 const me=role==='Кандидат';
 const c=CAND[0];
 return `<div class="hd"><div><h2>${me?'Моя заявка на вступление':'Вступление в члены Палаты'}</h2>
 <p>${me?'Вы зарегистрировались с сайта pnk.kz 12 сентября. Загрузите документы по списку — статус рассмотрения виден здесь же.':'Кандидат регистрируется с сайта, загружает документы по чек-листу, система напоминает о недостающих. Сотрудник Палаты проверяет и выносит на решение. Ваш вопрос «можно ли, чтобы с сайта заявка попадала в систему?» — да, именно так.'}</p></div>
 <div class="btns">${me?'<button class="bt p" onclick="toast(\'Файл загружен и привязан к пункту «Рекомендации». Проверка — до 3 рабочих дней, о результате придёт письмо.\')">Загрузить документ</button>':'<button class="bt p" onclick="toast(\'Кандидату отправлен запрос недостающих документов: две рекомендации членов Палаты. Динаре Н. — задача помочь с рекомендациями до 22.09.\')">Запросить недостающее</button>'}</div></div>
<div class="g21">
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">${esc(c.n)} · ${esc(c.city)} · ${esc(c.cat).replace('Налоговый консультант ','НК ')} · подано ${c.dt}</h3>
   <div class="chk">${c.docs.map(([d,ok])=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--line)"><b style="color:${ok?'var(--ok)':'var(--bad)'};font-size:13px">${ok?'✓':'×'}</b><span style="flex:1;font-size:11.6px">${esc(d)}</span>${ok?'<span class="tag" style="background:var(--ok-l);color:var(--ok)">загружено</span>':'<span class="tag" style="background:var(--bad-l);color:var(--bad)">не хватает</span>'}</div>`).join('')}</div>
   <div class="note" style="--tone:var(--warn)"><p class="mini" style="margin:0"><b>Статус: требуются документы.</b> 6 из 7 загружено. Напоминание кандидату уходило 15.09 и 17.09. Заявка не уйдёт на решение, пока список не закрыт — но и не потеряется.</p></div>
  </div>
  ${me?'':`<div class="pan"><h3 style="margin:0 0 9px">Все заявки</h3>
   ${CAND.map(x=>`<div class="srow" style="border-left:3px solid ${CST[x.st][1]}"><div style="flex:1"><b>${esc(x.n)}</b><div class="mini">${esc(x.city)} · ${esc(x.cat).replace('Налоговый консультант ','НК ')} · подано ${x.dt}</div></div>${tag(CST[x.st][0],CST[x.st][1])}</div>`).join('')}
  </div>`}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Путь заявки</h3>
   <div class="tl">
    <div class="tli"><b style="font-size:11.6px">Регистрация с сайта</b><p class="mini" style="margin:2px 0 0">Кнопка «Войти / Регистрация» на pnk.kz → кабинет кандидата. Данные сразу в системе.</p></div>
    <div class="tli"><b style="font-size:11.6px">Документы по чек-листу</b><p class="mini" style="margin:2px 0 0">Список зависит от категории. Напоминания по e-mail, пока не загружено всё.</p></div>
    <div class="tli"><b style="font-size:11.6px">Проверка</b><p class="mini" style="margin:2px 0 0">Сотрудник Палаты проверяет, запрашивает недостающее, выносит на решение.</p></div>
    <div class="tli"><b style="font-size:11.6px">Решение и номер</b><p class="mini" style="margin:2px 0 0">Принят — номер в реестре, сертификат, кабинет члена; уведомление. Отказ — с причиной.</p></div>
   </div>
  </div>
  ${me?'':`<div class="pan"><h3 style="margin:0 0 8px">Решение по Арману Д.</h3><p class="mini" style="margin:0 0 8px">Документы проверены, категория II. Ждёт решения.</p>
   <button class="bt p" onclick="toast('Принят. Присвоен номер ПНК-03412, категория II, сертификат НК-3412. Кандидату ушло уведомление, кабинет переведён в режим члена, публичный реестр обновлён.')">Принять в члены</button> <button class="bt" onclick="toast('Отказ с указанием причины. Кандидат увидит её в кабинете и сможет подать заново.')">Отказать</button></div>`}
 </div>
</div>`;
};

/* ====== ЧЛЕНСКИЕ ВЗНОСЫ ====== */
SC.fees=()=>`<div class="hd"><div><h2>Членские взносы · 2026</h2>
 <p>Ваши слова: «31 марта каждого года начисляется определённая сумма годового взноса… человек в кабинете видит, чего он доплатил, не доплатил… кнопочка — и ушло уведомление». Начисление по дате и категории, оплата через Kaspi, напоминание всем должникам одной кнопкой.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Выгружено: начислено, оплачено, задолженность и переплата по каждому члену, по категориям и городам. Тот же файл — бухгалтеру и в 1С.')">В Excel</button><button class="bt p" onclick="feesRemind()">Напомнить всем должникам</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Начислено 31.03</small><b class="a">${mln(F.charged)} ₸</b><span>${fmt(F.total)} членов</span></div>
 <div><small>Оплачено</small><b class="g">${mln(F.paid)} ₸</b><span>${Math.round(F.paid/F.charged*100)}%</span></div>
 <div><small>Должников</small><b class="r">${F.debtors}</b><span>${mln(F.charged-F.paid)} ₸</span></div>
 <div><small>Переплата</small><b>${F.overpaid}</b><span>зачтётся в 2027</span></div>
 <div><small>Через Kaspi</small><b>71%</b><span>остальное — выписка</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Сбор по месяцам</h3>
  ${[['Апрель',48],['Май',14],['Июнь',7],['Июль · напоминание',5],['Август',2],['Сентябрь',2]].map(([m,p])=>`<div class="fr" style="grid-template-columns:150px 1fr 60px"><span>${m}</span>${barHtml(p*2,'var(--brand)')}<b class="mono" style="text-align:right">${p}%</b></div>`).join('')}
  <div class="hint"><b>Что видно.</b> Половина платит в первый месяц, потом сбор затухает. Напоминание в июле дало 5%. Второе напоминание сейчас — с прямой кнопкой оплаты в кабинете — обычно даёт ещё 8–10%.</div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Правила начисления</h3>
   <div class="kv"><span>Дата</span><b>31 марта</b></div>
   ${CAT.map(c=>`<div class="kv"><span>${esc(c).replace('Налоговый консультант ','НК ')}</span><b class="mono">${fmt(FEE[c])} ₸</b></div>`).join('')}
   <div class="kv" style="border:0"><span>Приостановленным</span><b>не начисляется</b></div>
   <p class="mini" style="margin:8px 0 0">Дата и тарифы — настройка, а не код. Меняете — следующее начисление пойдёт по новым.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Связь с 1С · опция</h3><p class="mini" style="margin:0">Сейчас оплаты отмечаются по Kaspi-уведомлению автоматически, по выписке — бухгалтером. С 1С 8.x задолженность и переплата приходят из учёта сами, и финансовый результат Палаты формируется в системе.</p></div>
 </div>
</div>`;

/* ====== КАБИНЕТ ЧЛЕНА ====== */
SC.mcab=()=>{
 const m=M('ПНК-00412'),fee=FEE[m.cat];
 return `<div class="hd"><div><h2>Мой кабинет · ${esc(m.n)}</h2>
 <p>Так кабинет видит член Палаты: свои данные, статус, взносы, уведомления и разъяснения. Ничего из консалтинга здесь нет и быть не может — это другой контур с другими правами.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Заявление на изменение данных отправлено. Динара Н. получит задачу, вы — уведомление о результате.')">Изменить данные</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Статус</small><b class="g">действующий</b><span>${esc(m.cat).replace('Налоговый консультант ','НК ')}</span></div>
 <div><small>Номер в реестре</small><b>${m.id}</b><span>сертификат ${m.cert}</span></div>
 <div><small>Взнос 2026</small><b class="g">оплачен</b><span>${fmt(fee)} ₸ · 02.04 · Kaspi</span></div>
 <div><small>Новых разъяснений</small><b class="a">1</b><span>по ст. 412 НК</span></div>
</div>
<div class="g2">
 <div>
  <div class="pan" style="border-top:3px solid var(--brand2)"><h3 style="margin:0 0 8px">Взносы</h3>
   <div class="kv"><span>2026 · начислено 31.03</span><b class="mono">${fmt(fee)} ₸ · оплачен</b></div>
   <div class="kv"><span>2025</span><b class="mono">${fmt(fee)} ₸ · оплачен</b></div>
   <div class="kv" style="border:0"><span>Задолженность</span><b style="color:var(--ok)">нет</b></div>
   <div style="border:1px dashed var(--line2);border-radius:6px;padding:11px;margin-top:10px;background:var(--card2)">
    <div class="mini" style="margin-bottom:7px">Так выглядит кабинет должника:</div>
    <div class="kv" style="padding:4px 0"><span>Взнос 2026</span><b style="color:var(--bad)">долг 25 000 ₸</b></div>
    <button class="bt p" style="width:100%;margin-top:7px" onclick="toast('Переход на оплату Kaspi с подставленной суммой и назначением. После оплаты статус обновится автоматически.')">Оплатить через Kaspi · 25 000 ₸</button>
   </div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Мои документы</h3>
   <div class="kv"><span>Сертификат ${m.cert}</span><b><a onclick="toast('PDF сертификата открыт.')" style="color:var(--acc);cursor:pointer">скачать</a></b></div>
   <div class="kv"><span>Выписка из реестра на дату</span><b><a onclick="toast('Выписка сформирована на бланке Палаты с датой и подписью.')" style="color:var(--acc);cursor:pointer">сформировать</a></b></div>
   <div class="kv" style="border:0"><span>Загруженные при вступлении · 7</span><b>просмотр</b></div>
  </div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Уведомления</h3>
   <div class="srow" style="border-left:3px solid var(--brand)"><div style="flex:1"><b>Разъяснение по применению ст. 412 НК с 01.10.2026</b><div class="mini">15.09 · Палата · новое</div></div><button class="bt" onclick="go('library')">Открыть</button></div>
   <div class="srow"><div style="flex:1"><b>Семинар «Изменения в НК с 2027 года» · 10 октября, Алматы</b><div class="mini">08.09 · регистрация открыта</div></div><button class="bt" onclick="toast('Вы зарегистрированы на семинар. Подтверждение — на почту.')">Записаться</button></div>
   <div class="srow"><div style="flex:1"><b>Взнос 2026 оплачен</b><div class="mini">02.04 · автоматически</div></div></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Как вы сюда входите</h3><p class="mini" style="margin:0">По e-mail или телефону с кодом подтверждения — пароль помнить не нужно. С сайта pnk.kz по кнопке «Войти», с телефона — через браузер, приложение не требуется.</p></div>
 </div>
</div>`;
};

/* ====== РАЗЪЯСНЕНИЯ ====== */
SC.library=()=>`<div class="hd"><div><h2>Разъяснения и материалы Палаты</h2>
 <p>Ваш вопрос: «как своя библиотека — разъяснения, анонсы, что-то копилось». Разделы наполняются сотрудниками Палаты, публикация — с уведомлением в кабинет и на почту, всем или отдельной категории.</p></div>
 <div class="btns">${role==='Член Палаты'?'':'<button class="bt p" onclick="toast(\'Новый материал: заголовок, текст, вложения, категория, кому (все / I категория / город). При публикации — уведомление в кабинеты и на e-mail с вашего домена.\')">+ Опубликовать</button>'}</div></div>
<div class="g21">
 <div class="pan">
  ${[['15.09','Разъяснение','Применение ст. 412 НК с 01.10.2026: порядок выписки ЭСФ при экспорте','все члены',1842],['08.09','Анонс','Семинар «Изменения в Налоговом кодексе с 2027 года» · 10 октября, Алматы','все члены',1210],['01.09','Методика','Рекомендации по документированию консультаций для целей споров с КГД','I и II категории',960],['20.08','Разъяснение','Позиция Палаты по вопросу применения СНР для ИП с сотрудниками','все члены',2104],['05.08','Новости','Итоги заседания Совета Палаты 31 июля','все члены',1560]]
   .map(([d,k,t,to,r])=>`<div class="srow"><b class="mono" style="width:44px;font-size:10.6px">${d}</b><div style="flex:1"><b>${esc(t)}</b><div class="mini">${k} · ${to} · открыли ${fmt(r)}</div></div><button class="bt" onclick="toast('Материал открыт. Вложения: PDF разъяснения и ссылка на НПА.')">Читать</button></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Разделы</h3>
   <div class="kv"><span>Разъяснения Палаты</span><b>24</b></div>
   <div class="kv"><span>Методические материалы</span><b>11</b></div>
   <div class="kv"><span>Анонсы и семинары</span><b>6</b></div>
   <div class="kv" style="border:0"><span>Новости Совета</span><b>9</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Уведомления входят, рассылки — опция</h3><p class="mini" style="margin:0">Уведомление о публикации — часть ядра. Произвольные рассылки с конструктором писем и корпоративными шаблонами — отдельная прикладная программа, 350 000 ₸, как обсуждали на встрече.</p></div>
 </div>
</div>`;

/* ====== ПУБЛИЧНЫЙ РЕЕСТР ====== */
SC.publicreg=()=>`<div class="hd"><div><h2>Публичный реестр · как на сайте pnk.kz</h2>
 <p>Ваши слова: «формирование реестров, которые мы публикуем на всю страну». Реестр на сайте формируется из системы: изменился статус в карточке — изменился на сайте. Только те поля, которые Палата решила открыть.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Настройка публикуемых полей: ФИО, город, категория, номер сертификата — открыты. Место работы, контакты, документы — закрыты. Меняется администратором.')">Какие поля публиковать</button></div></div>
<div class="pan" style="border:1px solid var(--line2);background:#fff;max-width:860px;margin:0 auto 12px">
 <div style="display:flex;gap:10px;margin-bottom:12px"><input placeholder="ФИО или номер сертификата" style="flex:1;padding:9px 12px;border:1px solid var(--line2);border-radius:6px;background:var(--card)"><select class="rsel"><option>Все категории</option>${CAT.map(c=>`<option>${esc(c)}</option>`).join('')}</select><select class="rsel"><option>Все города</option><option>Алматы</option><option>Астана</option></select><button class="bt p">Найти</button></div>
 <table class="t" style="font-size:11.4px">
  <thead><tr style="border-bottom:1.5px solid var(--line2)">${['№ В РЕЕСТРЕ','ФИО','ГОРОД','КАТЕГОРИЯ','СЕРТИФИКАТ','СТАТУС'].map(h=>`<th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
  <tbody>${MEM.filter(m=>m.st==='act').map(m=>`<tr><td class="mono" style="padding:8px">${m.id}</td><td style="padding:8px"><b>${esc(m.n)}</b></td><td style="padding:8px">${esc(m.city)}</td><td style="padding:8px">${esc(m.cat)}</td><td class="mono" style="padding:8px">${m.cert}</td><td style="padding:8px">${tag('действующий','var(--ok)')}</td></tr>`).join('')}</tbody>
 </table>
 <div class="mini" style="margin-top:9px;text-align:center">Показано 9 из ${fmt(F.total)} · данные обновляются автоматически из реестра Палаты</div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Что здесь нет</h3><p class="mini" style="margin:0">Гульмиры А. — членство приостановлено, из публичного реестра она исчезла в момент смены статуса. Места работы и контактов — закрытые поля. Так публикация становится следствием реестра, а не отдельной работой.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Где живёт</h3><p class="mini" style="margin:0">На текущем сайте WordPress — как встроенный блок, данные подтягиваются из системы. На новом сайте (опция) — как раздел. В обоих случаях верстается один раз и не требует ручного обновления.</p></div>
</div>`;
/* ====== НАСТРОЙКИ ====== */
SC.roles=()=>`<div class="hd"><div><h2>Права доступа</h2>
 <p>Восемь ролей: шесть внутренних и две внешних. Права — по подразделениям и юрлицам. Ваши формулировки: «отделу необязательно знать, что там юридический отдел делает», «бухгалтерские вопросы — только бухгалтерии и руководства».</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новая роль: например, «Совет Палаты» с доступом только к реестру и взносам, без консалтинга. Настраивается администратором без нас.')">+ Роль</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)"><th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">ЧТО ВИДНО</th>
 ${Object.keys(ROLES).map(r=>`<th style="text-align:center;padding:8px;font-size:9px;color:var(--muted)">${esc(r.toUpperCase())}</th>`).join('')}</tr></thead>
 <tbody>${[['Все клиенты и проекты',[1,0,0,0,0,0,0,0]],['Клиенты своего подразделения',[1,1,0,0,0,0,0,0]],['Свои проекты и время',[1,1,1,0,0,0,0,0]],['Ставки клиентов',[1,1,0,1,0,0,0,0]],['Себестоимость и маржа',[1,0,0,1,0,0,0,0]],['Согласование отчётов',[1,1,0,0,0,0,0,0]],['Счета и дебиторка',[1,1,0,1,0,0,0,0]],['Табель и зарплата всех',[1,0,0,1,0,0,0,0]],['Своя зарплата и отпуск',[1,1,1,1,1,1,0,0]],['Журналы и приказы',[1,1,0,0,1,1,0,0]],['Реестр членов и взносы',[1,0,0,1,0,1,0,0]],['Свой кабинет члена',[0,0,0,0,0,0,1,1]],['Настройки и права',[1,0,0,0,0,1,0,0]]]
  .map(([n,a])=>`<tr><td style="padding:7px 8px">${esc(n)}</td>${a.map(v=>`<td style="text-align:center;padding:7px 8px;color:${v?'var(--ok)':'var(--line2)'};font-weight:800">${v?'✓':'—'}</td>`).join('')}</tr>`).join('')}</tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Двухфакторный вход</h3><p class="mini" style="margin:0">Сотрудники — пароль плюс код в приложении или SMS. Члены Палаты — код на e-mail или телефон. Автовыход по бездействию. Уволенному доступ закрывается кнопкой, история остаётся.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Журнал действий</h3><p class="mini" style="margin:0">Кто, что, когда изменил — по таймшитам, отчётам, счетам, документам, настройкам. И отдельно: кто открывал карточки членов Палаты. Для персональных данных это обязательное требование.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Три юрлица</h3><p class="mini" style="margin:0">У документа, счёта, сотрудника и журнала указано юрлицо. Бухгалтер видит все три, руководитель направления — только своё, член Палаты — только ОО.</p></div>
</div>`;

SC.integr=()=>`<div class="hd"><div><h2>Интеграции</h2>
 <p>То, что подключается в первом релизе, и то, что оценивается отдельно — как обсуждали на встрече.</p></div></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 7px">WhatsApp</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">первый релиз</span><p class="mini" style="margin:7px 0 0">Переписка с клиентами из карточки, напоминания сотрудникам. Через казахстанского провайдера ≈ 5 000 ₸ за номер вместо 36 000 у обычных сервисов. Мы на этом не зарабатываем.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">IP-телефония</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">первый релиз</span><p class="mini" style="margin:7px 0 0">Звонок из карточки, определение звонящего, запись разговора в карточке клиента. 3–5 многоканальных номеров ≈ 30 000 ₸ в месяц.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Почта и сайт</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">первый релиз</span><p class="mini" style="margin:7px 0 0">Отчёты, счета, уведомления с вашего домена. Регистрация и вход с pnk.kz, публичный реестр на сайте. WordPress остаётся.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Kaspi</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">первый релиз</span><p class="mini" style="margin:7px 0 0">Кнопка оплаты взноса в кабинете члена; при договоре с Kaspi — автоматическое подтверждение платежа.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">1С</h3><span class="tag" style="background:var(--violet-l);color:var(--violet)">опция · 800 000 ₸</span><p class="mini" style="margin:7px 0 0">Счета и оплаты, взносы с задолженностью и переплатой, табель — двусторонний обмен. Только 1С версии 8.x: семёрка не интегрируется, ваши слова услышаны — «сейчас уже все на восьмёрке».</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Тендерные площадки</h3><span class="tag" style="background:var(--violet-l);color:var(--violet)">опция · от 300 000 ₸</span><p class="mini" style="margin:7px 0 0">Подборка лотов с goszakup.gov.kz и площадок с API по вашим услугам, руководителю направления. Точная цена — после проверки, что площадки отдают.</p></div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 7px">Сервис рассылок · опция 350 000 ₸</h3><p class="mini" style="margin:0">Конструктор писем с корпоративными шаблонами, сегменты по категориям, статистика открытий. Уведомления по событиям — входят в ядро без этого.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Мобильное приложение · не рекомендуем</h3><p class="mini" style="margin:0">Кабинет открывается в браузере телефона. Приложение — ×2 от портала и три месяца на публикацию. Для 3 500 консультантов, заходящих по событию, — не нужно; если появится маркетинговая причина — сделаем.</p></div>
</div>`;

SC.migr=()=>`<div class="hd"><div><h2>Перенос из старой системы</h2>
 <p>Ваши слова: «Нам нужно будет обойтись без нашего программиста». Поэтому мы не заходим в код старой системы и не просим настраивать шлюзы. Два пути, оба входят в стоимость.</p></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Путь 1 · Excel-выгрузки</h3>
  <p class="mini" style="margin:0 0 9px">Вы подтвердили: данные из текущей системы выгружаются в Excel. Мы структурируем и загружаем.</p>
  ${[['Клиенты и договоры','8 клиентов · ставки · история',1],['Проекты и время','активные и за 2 года',1],['Счета и оплаты','за 2 года',1],['Сотрудники и юрлица','25 · 3',1],['Члены Палаты','5 000+ карточек · категории',1],['Документы членов','файлы по номеру в реестре',0],['Взносы по годам','начисления и оплаты с 2020',1]]
   .map(([n,d,ok])=>`<div class="kv"><span>${n} <span class="mini">· ${d}</span></span>${ok?tag('Excel есть','var(--ok)'):tag('парсер / архив','var(--warn)')}</div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Путь 2 · парсер</h3><p class="mini" style="margin:0">Если выгрузка неполная — по административному доступу настраиваем считывание с экранов старой системы. Файлы документов членов, скорее всего, пойдут именно так. Входит в стандартную разработку.</p></div>
  <div class="pan"><h3 style="margin:0 0 9px">Что нужно от вас в первые 10 дней</h3>
   <div class="num"><i>1</i><div><b>Доступ для просмотра</b><p>Административный вход в текущую систему — чтобы мы увидели, чем именно пользуются, и учли мелочи.</p></div></div>
   <div class="num"><i>2</i><div><b>Excel-выгрузки</b><p>По списку слева. Делает любой сотрудник, у кого есть кнопка выгрузки.</p></div></div>
   <div class="num"><i>3</i><div><b>Один человек на вопросы</b><p>Не руководство и не программист — тот, кто знает, где что лежит.</p></div></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Параллельная работа</h3><p class="mini" style="margin:0">Старая система работает до дня переключения, который назначаете вы. Данные переносятся повторно перед переключением — ничего, введённое за время разработки, не теряется.</p></div>
 </div>
</div>`;

SC.stack=()=>`<div class="hd"><div><h2>Состав первого релиза</h2>
 <p>Что входит в стандартную разработку, в какие сроки и за какие деньги. После вашего прохода по демо этот список становится приложением № 1 к договору — вместе с ТЗ № TZ-PNK-2026-01.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Состав релиза выгружен в PDF. Он совпадает с разделами 1–15 ТЗ; правки после демо вносятся туда же.')">Выгрузить</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Стоимость</small><b class="a">2 500 000 ₸</b><span>стандартная разработка</span></div>
 <div><small>Срок</small><b>6 недель</b><span>запас до 8</span></div>
 <div><small>Оплата</small><b>10 / 45 / 45</b><span>250 000 при старте</span></div>
 <div><small>Абонплата</small><b class="g">нет</b><span>код и сервер ваши</span></div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Входит</h3>
  ${['8 ролей, права по подразделениям и юрлицам, 2FA, журнал действий','Клиенты, договоры со ставками, проекты от 5 минут до многолетних, воронки','Таймшиты до минуты, billable / non-billable, таймер, согласование, закрытие периода','Отчёт клиенту на бланке в Word и PDF, отправка из системы','Счета по юрлицам, дебиторка, напоминания','Себестоимость сотрудника и проекта, маржа','Кабинет сотрудника, табель по юрлицам, отпуска по формуле, зарплата и KPI','Поручения с контролем, личные и общие календари','Журналы вх/исх с автонумерацией, приказы с блокирующим ознакомлением','Реестр членов, вступление с сайта, документы, публичный реестр','Взносы 31 марта, кабинет члена, Kaspi, напоминания, библиотека разъяснений','WhatsApp, IP-телефония с записью, почта, сайт, Excel','Перенос данных из выгрузок или парсером','Сервер, SSL, бэкапы, обучение, месяц сопровождения']
   .map(t=>`<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0"><b style="color:var(--ok)">✓</b><span style="font-size:11.4px">${esc(t)}</span></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Как идёт работа</h3>
   <div class="tl">
    <div class="tli"><b style="font-size:11.6px">Понедельник · демо</b><p class="mini" style="margin:2px 0 0">Проход по экранам, правки, утверждение состава ядра.</p></div>
    <div class="tli"><b style="font-size:11.6px">10 дней · только технарь</b><p class="mini" style="margin:2px 0 0">Выгрузки и доступ. Руководство не нужно.</p></div>
    <div class="tli"><b style="font-size:11.6px">Недели 2–3 · ядро</b><p class="mini" style="margin:2px 0 0">Прогон на Zoom, платёж 45%.</p></div>
    <div class="tli"><b style="font-size:11.6px">Недели 4–5 · 5–10 выпусков</b><p class="mini" style="margin:2px 0 0">Правки вживую, раз в неделю или чаще.</p></div>
    <div class="tli"><b style="font-size:11.6px">Неделя 6 · полировка и передача</b><p class="mini" style="margin:2px 0 0">Тысяча мелочей, обучение, платёж 45%.</p></div>
   </div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Опции</h3>
   <div class="kv"><span>Интеграция с 1С 8.x</span><b class="mono">800 000 ₸</b></div>
   <div class="kv"><span>Новый сайт без WordPress</span><b class="mono">1 000 000 ₸</b></div>
   <div class="kv"><span>Сервис рассылок</span><b class="mono">350 000 ₸</b></div>
   <div class="kv"><span>Подборка тендеров</span><b class="mono">от 300 000 ₸</b></div>
   <div class="kv" style="border:0"><span>Мобильное приложение</span><b class="mono">×2 · не рекомендуем</b></div>
  </div>
 </div>
</div>
<div class="said"><b>Чего мы не обещаем.</b> Что угадаем всё с первого раза — поэтому 5–10 выпусков с вашими правками, а не один запуск в конце. И что система будет «как у большой четвёрки»: она будет как у вас, потому что собрана из ваших мелочей.</div>`;

/* ====== ДЕЙСТВИЯ ====== */
function quickPrj(){
 openM('Быстрый проект','Консультация — пять минут, но в учёте',
 `<p style="font-size:11.6px;line-height:1.7">Два поля. Клиент подставляется из последних, ставка — из его договора. После сохранения можно сразу списать время таймером.</p>
  <div class="srow"><div style="flex:1"><b>Клиент</b></div><select class="rsel"><option>ИП Абишев</option>${CLI.slice(0,4).map(c=>`<option>${esc(c.n)}</option>`).join('')}</select></div>
  <div class="srow"><div style="flex:1"><b>Что делали</b></div><input value="Консультация по патенту, телефон" style="width:60%;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card)"></div>
  <div class="srow"><div style="flex:1"><b>Время</b></div><input value="15 мин" style="width:90px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card);text-align:right"></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Проект P-2026-048 создан, 15 минут списаны Ерболату Т., ставка 22 000 ₸/ч → 5 500 ₸ в счёт по итогам месяца. Раньше такое просто терялось.')">Сохранить</button>`);
}
function tsTimer(){toast('Таймер запущен по проекту «Налоговый due diligence · Каспий Фуд». Нажмёте стоп — минуты запишутся в таймшит с точностью до минуты и попросят одну строку комментария для клиента.')}
function tsAdd(){
 openM('Запись времени · пятница 19.09','Проект, работа, минуты — и всё',
 `<div class="srow"><div style="flex:1"><b>Проект</b></div><select class="rsel">${PRJ.filter(p=>p.team.indexOf('Дана М.')>=0&&p.st!=='done').map(p=>`<option>${esc(p.n)} · ${esc(cliName(p.c))}</option>`).join('')}<option>— внутренняя работа</option></select></div>
  <div class="srow"><div style="flex:1"><b>Для клиента</b><div class="mini">попадёт в отчёт</div></div><input placeholder="Что сделано, одной строкой" style="width:60%;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card)"></div>
  <div class="srow"><div style="flex:1"><b>Внутренний комментарий</b><div class="mini">в отчёт не попадёт</div></div><input placeholder="необязательно" style="width:60%;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card)"></div>
  <div class="srow"><div style="flex:1"><b>Минут</b></div><input value="180" style="width:90px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card);text-align:right;font-weight:700"></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Записано: 3 часа по Каспий Фуд. Неделя закрыта — 35 ч 15 мин. Отправлено на согласование Гульнаре С.')">Сохранить</button>`);
}
function approveAll(){toast('Согласованы таймшиты Даны М. и Гульнары С. за неделю. Записи закрыты, отчёты клиентам по их проектам можно формировать. Ерболату — возврат с комментарием о двух незаполненных днях.')}
function sendReport(){
 openM('Отправить отчёт клиенту','ТОО «Арна Логистик» · сентябрь · 930 000 ₸',
 `<p style="font-size:11.6px;line-height:1.7">Письмо уходит с вашего почтового домена, отчёт в PDF и счёт — вложениями. Копия письма и вложений — в истории клиента. Отправка возможна только потому, что отчёт согласован Гульнарой С.</p>
  <div class="kv"><span>Кому</span><b>buh@arna-logistic.kz · копия: fin@arna-logistic.kz</b></div>
  <div class="kv"><span>Тема</span><b>Отчёт о затраченном времени за сентябрь и счёт КО-2026-121</b></div>
  <div class="kv"><span>Вложения</span><b>Отчёт_Арна_09-2026.pdf · Счёт_КО-2026-121.pdf</b></div>
  <div class="kv" style="border:0"><span>Согласование</span><b style="color:var(--ok)">✓ Гульнара С. · 17.09 16:20</b></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Отправлено 18.09 12:04. Когда клиент откроет письмо — система отметит это в истории. Счёт перешёл в статус «выставлен», срок оплаты 01.10.')">Отправить</button>`);
}
function feesRemind(){
 openM('Напоминание должникам','751 член · задолженность 18 766 000 ₸',
 `<p style="font-size:11.6px;line-height:1.7">Ваши слова: «кнопочка — и ушло уведомление всем». Уходит в кабинет и на e-mail каждому должнику: сумма, категория, реквизиты и кнопка оплаты Kaspi с подставленной суммой.</p>
  <div class="kv"><span>Получателей</span><b>751</b></div>
  <div class="kv"><span>Каналы</span><b>кабинет · e-mail с домена pnk.kz</b></div>
  <div class="kv"><span>Текст</span><b>шаблон «Задолженность по взносу» · редактируется</b></div>
  <div class="kv" style="border:0"><span>Повтор</span><b>через 14 дней тем, кто не оплатил</b></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Отправлено 751 члену. В карточке каждого — отметка о напоминании. По опыту прошлого напоминания — ещё 8–10% оплат в две недели, статус обновится сам по Kaspi.')">Отправить всем</button>`);
}
function regDoc(){
 openM('Зарегистрировать документ','Номер присвоит система',
 `<div class="srow"><div style="flex:1"><b>Направление</b></div><select class="rsel"><option>Входящий</option><option>Исходящий</option></select></div>
  <div class="srow"><div style="flex:1"><b>Юрлицо</b></div><select class="rsel">${Object.values(LE).map(l=>`<option>${esc(l)}</option>`).join('')}</select></div>
  <div class="srow"><div style="flex:1"><b>Корреспондент</b></div><input placeholder="организация или лицо" style="width:60%;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card)"></div>
  <div class="srow"><div style="flex:1"><b>Тема</b></div><input placeholder="о чём документ" style="width:60%;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card)"></div>
  <div class="srow"><div style="flex:1"><b>Номер</b><div class="mini">присваивается автоматически</div></div><b class="mono" style="color:var(--acc)">Вх-2026-0419</b></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Зарегистрировано под номером Вх-2026-0419. Следующий будет 0420 — и только он. Файл подшит, ответственному поставлена задача со сроком.')">Зарегистрировать</button>`);
}
function searchDemo(v){if(!v)return;
 toast(`Поиск «${esc(v)}»: сквозной по клиентам, проектам, записям времени, счетам, документам и реестру членов — в пределах прав роли. Член Палаты найдёт только своё.`);}

/* ====== ИНФРАСТРУКТУРА ====== */
function renderRoles(){
 const r=document.getElementById('roles');if(!r)return;
 r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')">
  <div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');
 if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');
}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){
 role=ROLES[k]?k:'Руководство';
 document.getElementById('gate').classList.add('hidden');
 document.getElementById('app').classList.remove('hidden');
 const s=document.getElementById('rsel');if(s)s.value=role;
 document.getElementById('me').textContent=ROLES[role].av;
 if(!allowed(cur))cur=ROLES[role].s[0];
 build();
 toast(`Вы вошли как «${role}» · ${ROLES[role].n}. Показаны только те разделы, которые нужны этой роли — так же будет и у ваших сотрудников.`);
}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;
 const s=document.getElementById('rsel');if(s)s.value=role;
 if(!allowed(cur))cur=ROLES[role].s[0];build();
 toast(`Роль: ${role}. Разделов доступно: ${ROLES[role].s.length}. ${ROLES[role].note}.`)}
const ownerOf=k=>SECOF[k];
function buildRail(){
 const on=ownerOf(cur);
 document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>{
  const n=s.sub.filter(x=>allowed(x[0])).length;
  return `<div class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')" title="${esc(s.n)}">
   <i>${s.ic}</i><span>${esc(s.n)}</span>${n>1?`<b class="cnt">${n}</b>`:''}</div>`}).join('');
}
function buildSub(){
 const on=ownerOf(cur),s=SEC.find(x=>x.k===on);if(!s)return;
 document.getElementById('sub').innerHTML=`<h4>${esc(s.n)}</h4>`+
  s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')+
  `<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`;
}
function build(){buildRail();buildSub();render()}
function render(){
 const f=SC[cur]||SC.dash;
 document.getElementById('ttl').textContent=SUBN[cur]||'Общая картина';
 document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('timesheet')?'':'none';
 try{history.replaceState(null,'','?s='+cur)}catch(e){}
}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права доступа. Переключите роль в правом верхнем углу, чтобы посмотреть.');return}
 cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){
 document.getElementById('mt').innerHTML=t;
 document.getElementById('ms').innerHTML=s;
 document.getElementById('mbody').innerHTML=b;
 document.getElementById('mbg').classList.add('show');
}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;
function toast(m){const t=document.getElementById('toast');
 t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();
 toast(theme==='dark'?'Тёмная тема — для вечерней работы и для проектора.':'Светлая тема.')}

/* ====== СЦЕНАРИЙ ПОКАЗА ====== */
const TOUR=[
 ['dash','Оба контура на одном экране: консалтинг слева, Палата справа. Руководство видит всё, и ничего из этого не сводится руками.'],
 ['timesheet','Начало всего — таймшит консультанта. Точность до минуты, billable и внутренняя работа, пятница подсвечена как незаполненная. Нажмите «+ Запись».'],
 ['approve','Иерархия, о которой вы говорили: руководитель согласовывает таймшиты и отчёты. Без отметки отчёт клиенту не уйдёт — технически.'],
 ['report','Отчёт клиенту на вашем бланке: из согласованных записей, в Word и PDF, отправка с почты системы. Нажмите «Отправить клиенту».'],
 ['invoices','Счёт из отчёта, по юрлицу из договора. Два юрлица — две нумерации. Просрочка — с причиной, а не просто красным.'],
 ['cost','Себестоимость и маржа по каждому проекту — сегодня, а не после закрытия. Абонемент Медикус даёт 24%: клиент с 2017 года переедает норму часов.'],
 ['me','Кабинет сотрудника: задачи, время, отпуск, зарплата, документы на ознакомление. Всё, что вы перечислили, — на одном экране.'],
 ['tasks','Поручения с контролем исполнения. Половина задач поставлена системой: просроченный счёт, отчёт без согласования, кандидат без документов.'],
 ['tabel','Табель из таймшитов, по каждому юрлицу, отпускные по вашей формуле — параметрами, а не кодом.'],
 ['journal','Журналы с автонумерацией. Вх-2026-0418 — следующий будет 0419 и только он. Excel, который «то слетел, то потерялся», больше не нужен.'],
 ['orders','Приказы с отметкой «ознакомлен». Приказ № 47 — блокирующий: у шестерых кабинет закрыт, пока не подтвердят. Ровно как вы описали.'],
 ['members','Второй контур. Реестр членов Палаты: категории, сертификаты, взносы, статусы. Открытие карточки пишется в журнал доступа.'],
 ['join','Вступление: кандидат зарегистрировался с сайта, загрузил 6 документов из 7. Система напоминает ему сама, заявка не потеряется.'],
 ['fees','Взносы 31 марта: начислено, собрано 78%, 751 должник. Нажмите «Напомнить всем должникам» — та самая кнопочка.'],
 ['mcab','Кабинет члена Палаты: статус, взносы, кнопка оплаты Kaspi, разъяснения. Ничего из консалтинга здесь нет и не может быть.'],
 ['publicreg','Публичный реестр на сайте — из системы, автоматически. Приостановленный член исчезает из него в момент смены статуса.'],
 ['roles','Права: восемь ролей, по подразделениям и юрлицам. Юристы не видят бухгалтерию, бухгалтерия — только у бухгалтерии и руководства.'],
 ['migr','Перенос без вашего программиста: Excel-выгрузки или парсер, оба входят в стоимость. В код старой системы не заходим.'],
 ['stack','Состав первого релиза: 2 500 000 ₸, оплата 10 / 45 / 45, шесть недель, код и сервер ваши, абонплаты нет.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;
 document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;
 if(ti>=TOUR.length){stopTour();toast('Сценарий показа закончен. Дальше можно листать разделы вручную — всё кликается: таймшиты, согласование, отчёт, взносы, кабинеты.');return}
 const [k,m]=TOUR[ti];
 if(!allowed(k)){step();return}
 cur=k;build();toast(m);
 setTimeout(step,ti===0?5800:6900);
}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}

/* ====== СТАРТ ====== */
(function(){
 renderRoles();applyTheme();
 const s=document.getElementById('rsel');
 if(s)s.addEventListener('change',e=>switchRole(e.target.value));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){
  const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);
  if(r){cur=q;enter(r)}
 }
})();
