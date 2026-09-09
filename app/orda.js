/* ОРДА СЕРВИС · единая система обслуживания объектов, услуг и поставки оборудования
   Демо собрано по техническому заданию версии 3.0 (33 сущности, 14 разделов меню). */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const mln=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n/1e6);

/* ===== РОЛИ ===== */
const ROLES={
 'Руководитель':{av:'РС',n:'Рустем',r:'руководитель',note:'Вся картина: прибыль, склад, задолженности, план/факт',
  s:['dash','chain','clients','contracts','debt','objects','maint','requests','calendar','services','acts','stock','moves','inv','purchase','suppliers','sales','invoices','money','finance','cashflow','staff','payroll','docs','reports','mobile','settings']},
 'Менеджер по клиентам':{av:'АЙ',n:'Айна',r:'клиенты и продажи',note:'Клиенты, договоры, объекты, заявки, продажи и счета',
  s:['clients','contracts','debt','objects','requests','calendar','services','sales','invoices','docs','acts']},
 'Диспетчер':{av:'ДС',n:'Дана',r:'заявки и график',note:'Приём заявок, назначение инженеров, календарь и просрочки',
  s:['requests','calendar','objects','maint','acts','staff','services']},
 'Инженер на объекте':{av:'ИН',n:'Марат',r:'выезды',note:'Свои заявки в телефоне: работа, материалы, акт на месте',
  s:['mobile','requests','calendar','objects']},
 'Кладовщик':{av:'КЛ',n:'Ерлан',r:'склад и закупки',note:'Остатки, приход и списание, перемещения, инвентаризация',
  s:['stock','moves','inv','purchase','suppliers','sales']},
 'Бухгалтер':{av:'БУ',n:'Гульмира',r:'деньги и документы',note:'Кассы и банки, дебиторка и кредиторка, счета и акты',
  s:['money','finance','cashflow','debt','invoices','docs','suppliers','purchase','reports','payroll']}
};
let role='Руководитель',cur='dash',theme='light',scope='all',period='month';

/* ===== МЕНЮ (по разделу 3 ТЗ) ===== */
const NAV=[
 ['ГЛАВНОЕ',[['dash','◧','Главная'],['chain','⇄','Сквозная связка',1]]],
 ['КЛИЕНТЫ И ОБЪЕКТЫ',[['clients','☺','Клиенты',6],['contracts','▤','Договоры'],['debt','₸','Задолженность',2],['objects','⌂','Объекты',20],['maint','◷','Обслуживание',3]]],
 ['ЗАЯВКИ И УСЛУГИ',[['requests','☰','Заявки и работы',7],['calendar','▦','Календарь'],['services','✦','Направления и услуги'],['acts','✓','Выполненные и акты',4]]],
 ['СКЛАД И ЗАКУПКИ',[['stock','▥','Остатки склада',7],['moves','⇅','Движения'],['inv','◱','Инвентаризация'],['purchase','⇩','Закупки',3],['suppliers','⊞','Поставщики']]],
 ['ПРОДАЖИ И ДЕНЬГИ',[['sales','⇧','Продажи'],['invoices','▧','Счета',5],['money','◈','Деньги'],['finance','◆','Финансы'],['cashflow','◲','Cash Flow · план/факт']]],
 ['ЛЮДИ И УПРАВЛЕНИЕ',[['staff','◍','Сотрудники'],['payroll','★','Начисления'],['docs','▣','Документы'],['reports','▩','Отчёты'],['mobile','▢','Телефон инженера'],['settings','⚙','Настройки и права']]]
];
const TITLES={
 dash:['Главная','Выручка, расходы, прибыль, деньги, склад и задолженности за период'],
 chain:['Сквозная связка','Главный принцип ТЗ: одна операция сама меняет склад, деньги, долги, себестоимость и прибыль'],
 clients:['Клиенты','Карточка клиента: реквизиты, объекты, договоры, продажи, оплаты и долг'],
 contracts:['Договоры','Условия обслуживания, сроки, суммы и приложения по каждому клиенту'],
 debt:['Задолженность','Кто должен нам и кому должны мы — с днями просрочки и актами сверки'],
 objects:['Объекты','Адреса обслуживания, установленное оборудование и история работ'],
 maint:['Обслуживание','Регламентное ТО: график по объектам, что просрочено и кто назначен'],
 requests:['Заявки и работы','От поступления до закрытия актом — с исполнителем и сроком'],
 calendar:['Календарь','Загрузка инженеров по дням: выезды, ТО и монтажи'],
 services:['Направления и услуги','Виды работ, прайс, себестоимость и рентабельность направления'],
 acts:['Выполненные и акты','Что сделано за период, чем подтверждено и что ушло в счёт'],
 stock:['Остатки склада','Оборудование и материалы: количество, стоимость, минимальный остаток'],
 moves:['Движения склада','Приход, расход, перемещение, списание и возврат — одной лентой'],
 inv:['Инвентаризация','Учёт против факта: расхождения по позициям и на какую сумму'],
 purchase:['Закупки','Заказы поставщикам, приход на склад, оплаты и долг перед поставщиком'],
 suppliers:['Поставщики','Условия, обороты, задолженность и история поставок'],
 sales:['Продажи','Продажа оборудования: цена, себестоимость, маржа и оплата'],
 invoices:['Счета','Выставлено, оплачено, просрочено — с переходом в оплату'],
 money:['Деньги','Кассы, банковские счета, приход, расход и перемещения между ними'],
 finance:['Финансы','Прибыль по направлениям, доходы и расходы по статьям'],
 cashflow:['Cash Flow · план/факт','Движение денег по месяцам и отклонение факта от плана'],
 staff:['Сотрудники','Загрузка, выполненные работы и результат по каждому'],
 payroll:['Начисления','Оклад, сдельная часть по выполненным работам и итог к выплате'],
 docs:['Документы','Счета, акты, накладные, КП и договоры — из системы, а не из Word'],
 reports:['Отчёты','Любой срез с фильтрами и выгрузкой в Excel'],
 mobile:['Телефон инженера','То, что видит инженер на объекте: заявка, материалы, акт и подпись'],
 settings:['Настройки и права','Справочники, статьи, кассы, роли и доступы'],
};

/* ===== ДАННЫЕ ===== */
/* Финансовая модель за сентябрь 2026. Все экраны считают из неё, поэтому цифры
   сходятся между разделами — это и требует пункт 1 ТЗ. */
const F={
 revEquip:11200000, revServ:7440000,
 costEquip:8120000, costMat:1336000, costWork:2400000,
 opex:2180000,
 cashDesk:1240000, bankHalyk:4820000, bankKaspi:1560000,
 ar:5340000, arOver:2080000, ap:3060000, apOver:640000,
 stockSum:9480000, stockPos:214, stockLow:7, stockOnSite:2340000,
 salesCount:34, jobsCount:128,
 objTotal:20, objActive:17, objMaint:12, objOverdue:3
};
F.rev=F.revEquip+F.revServ;
F.cost=F.costEquip+F.costMat+F.costWork;
F.gross=F.rev-F.cost;
F.profit=F.gross-F.opex;
F.cash=F.cashDesk+F.bankHalyk+F.bankKaspi;
F.grossEquip=F.revEquip-F.costEquip;
F.grossServ=F.revServ-(F.costMat+F.costWork);
F.margin=F.grossEquip/F.revEquip*100;

const CLIENTS=[
 {id:'c1',n:'ТОО «Каспий Ритейл»',t:'Сеть магазинов',bin:'140340009123',obj:8,dog:'ДГ-2026-014',mgr:'Айна',rev:5820000,debt:1840000,over:0,ph:'+7 727 350 12 40',adr:'г. Алматы, пр. Райымбека, 212',pay:'отсрочка 21 день'},
 {id:'c2',n:'ТОО «Астана Молл»',t:'Торговый центр',bin:'160140004871',obj:3,dog:'ДГ-2026-021',mgr:'Айна',rev:4360000,debt:1260000,over:14,ph:'+7 717 244 88 10',adr:'г. Астана, ул. Кабанбай батыра, 62',pay:'отсрочка 10 дней'},
 {id:'c3',n:'АО «Медцентр Аружан»',t:'Клиника',bin:'110540002233',obj:4,dog:'ДГ-2025-108',mgr:'Дамир',rev:3180000,debt:980000,over:0,ph:'+7 727 311 05 55',adr:'г. Алматы, ул. Тимирязева, 42',pay:'предоплата 50%'},
 {id:'c4',n:'ТОО «АгроТрейд KZ»',t:'Склад-холодильник',bin:'180440007712',obj:2,dog:'ДГ-2026-030',mgr:'Дамир',rev:2740000,debt:820000,over:31,ph:'+7 727 390 41 17',adr:'Алматинская обл., с. Байсерке',pay:'отсрочка 14 дней'},
 {id:'c5',n:'ТОО «СтройБаза №1»',t:'Строительная база',bin:'090740001654',obj:2,dog:'ДГ-2026-009',mgr:'Айна',rev:1620000,debt:440000,over:0,ph:'+7 727 255 63 20',adr:'г. Алматы, ул. Бекмаханова, 96',pay:'по факту'},
 {id:'c6',n:'ИП Нурланов А.',t:'Кафе',bin:'870512300145',obj:1,dog:'без договора',mgr:'Дамир',rev:920000,debt:0,over:0,ph:'+7 701 442 19 08',adr:'г. Алматы, ул. Гагарина, 124',pay:'по факту'},
];
const OBJECTS=[
 {id:'o1',n:'Магазин «Каспий» · Райымбека',cl:'c1',adr:'пр. Райымбека, 212',eq:14,to:'12.09.2026',st:'ok',last:'02.09.2026'},
 {id:'o2',n:'Магазин «Каспий» · Абая',cl:'c1',adr:'пр. Абая, 44',eq:11,to:'08.09.2026',st:'over',last:'05.08.2026'},
 {id:'o3',n:'Магазин «Каспий» · Саина',cl:'c1',adr:'ул. Саина, 30',eq:9,to:'19.09.2026',st:'ok',last:'21.08.2026'},
 {id:'o4',n:'ТРЦ «Астана Молл» · корпус А',cl:'c2',adr:'Кабанбай батыра, 62',eq:38,to:'10.09.2026',st:'soon',last:'11.08.2026'},
 {id:'o5',n:'ТРЦ «Астана Молл» · фудкорт',cl:'c2',adr:'Кабанбай батыра, 62',eq:22,to:'09.09.2026',st:'over',last:'04.08.2026'},
 {id:'o6',n:'Клиника «Аружан» · Тимирязева',cl:'c3',adr:'ул. Тимирязева, 42',eq:26,to:'24.09.2026',st:'ok',last:'27.08.2026'},
 {id:'o7',n:'Холодильный склад «АгроТрейд»',cl:'c4',adr:'с. Байсерке, трасса А-3',eq:17,to:'07.09.2026',st:'over',last:'30.07.2026'},
 {id:'o8',n:'Кафе «Нурлан»',cl:'c6',adr:'ул. Гагарина, 124',eq:5,to:'28.09.2026',st:'ok',last:'01.09.2026'},
];
const DIRS=[
 {id:'d1',n:'Вентиляция и кондиционирование',jobs:44,rev:2680000,cost:1290000,price:'от 18 000 ₸ за ТО'},
 {id:'d2',n:'Холодильное оборудование',jobs:31,rev:2140000,cost:1080000,price:'от 24 000 ₸ за выезд'},
 {id:'d3',n:'Электрика и слаботочка',jobs:22,rev:1090000,cost:560000,price:'от 14 000 ₸ за точку'},
 {id:'d4',n:'Пожарная сигнализация',jobs:19,rev:880000,cost:462000,price:'от 12 000 ₸ за ТО'},
 {id:'d5',n:'Видеонаблюдение',jobs:12,rev:650000,cost:344000,price:'от 22 000 ₸ за камеру'},
];
const REQ=[
 {id:'r1',t:'Не морозит витрина в торговом зале',cl:'c1',ob:'o2',dir:'d2',st:'new',eng:'',due:'сегодня 18:00',pri:'high',sum:0},
 {id:'r2',t:'Шум в вентиляции над фудкортом',cl:'c2',ob:'o5',dir:'d1',st:'new',eng:'',due:'завтра 12:00',pri:'mid',sum:0},
 {id:'r3',t:'Плановое ТО сплит-систем, 12 шт',cl:'c1',ob:'o1',dir:'d1',st:'set',eng:'Марат',due:'10.09 10:00',pri:'mid',sum:216000},
 {id:'r4',t:'Замена компрессора холодильной камеры',cl:'c4',ob:'o7',dir:'d2',st:'work',eng:'Аскар',due:'09.09 14:00',pri:'high',sum:485000},
 {id:'r5',t:'Монтаж 4 камер на въезде',cl:'c5',ob:'',dir:'d5',st:'work',eng:'Ильяс',due:'11.09 09:00',pri:'mid',sum:268000},
 {id:'r6',t:'ТО пожарной сигнализации, корпус А',cl:'c2',ob:'o4',dir:'d4',st:'done',eng:'Марат',due:'06.09',pri:'low',sum:96000},
 {id:'r7',t:'Ремонт щита освещения склада',cl:'c4',ob:'o7',dir:'d3',st:'done',eng:'Аскар',due:'05.09',pri:'mid',sum:74000},
 {id:'r8',t:'ТО кондиционеров операционного блока',cl:'c3',ob:'o6',dir:'d1',st:'act',eng:'Марат',due:'03.09',pri:'mid',sum:148000},
 {id:'r9',t:'Чистка дренажа, кухня',cl:'c6',ob:'o8',dir:'d1',st:'act',eng:'Ильяс',due:'01.09',pri:'low',sum:32000},
];
const RST={new:'Новая',set:'Назначена',work:'В работе',done:'Выполнена',act:'Закрыта актом'};
const STOCK=[
 {id:'s1',n:'Сплит-система 12 000 BTU',u:'шт',q:14,min:6,pr:168000},
 {id:'s2',n:'Сплит-система 24 000 BTU',u:'шт',q:6,min:4,pr:268000},
 {id:'s3',n:'Компрессор холодильный SC18',u:'шт',q:3,min:4,pr:186000},
 {id:'s4',n:'Фреон R410a, баллон 11,3 кг',u:'бал',q:9,min:5,pr:64000},
 {id:'s5',n:'Фильтр воздушный G4 (комплект)',u:'компл',q:48,min:20,pr:7400},
 {id:'s6',n:'Кабель ВВГнг 3×2,5',u:'м',q:640,min:400,pr:520},
 {id:'s7',n:'Камера IP 4 Мп купольная',u:'шт',q:11,min:6,pr:58000},
 {id:'s8',n:'Извещатель дымовой ИП-212',u:'шт',q:34,min:40,pr:4200},
 {id:'s9',n:'Регистратор NVR 16 каналов',u:'шт',q:2,min:3,pr:142000},
 {id:'s10',n:'Крепёж и расходники (набор)',u:'компл',q:26,min:15,pr:9800},
];
const MOVES=[
 {d:'08.09',t:'in',n:'Приход от «Климат Групп»',doc:'Накладная 4412',q:'12 шт · сплит 12k',sum:2016000,who:'Ерлан'},
 {d:'08.09',t:'out',n:'Списание на заявку Р-4',doc:'Заявка Р-4 · АгроТрейд',q:'1 шт · компрессор SC18',sum:186000,who:'Аскар'},
 {d:'07.09',t:'sale',n:'Продажа оборудования',doc:'Счёт СЧ-2026-118',q:'6 шт · сплит 12k',sum:1008000,who:'Айна'},
 {d:'07.09',t:'mv',n:'Перемещение на склад-2',doc:'Перемещение 214',q:'20 компл · фильтр G4',sum:148000,who:'Ерлан'},
 {d:'06.09',t:'out',n:'Списание материалов, ТО',doc:'Заявка Р-6 · Астана Молл',q:'8 шт · извещатель',sum:33600,who:'Марат'},
 {d:'05.09',t:'ret',n:'Возврат поставщику (брак)',doc:'Возврат 27',q:'1 шт · NVR 16',sum:142000,who:'Ерлан'},
 {d:'04.09',t:'in',n:'Приход от «ЭлектроСнаб»',doc:'Накладная 4390',q:'400 м · кабель ВВГнг',sum:208000,who:'Ерлан'},
];
const MVT={in:['Приход','g'],out:['Списание','a'],sale:['Продажа','b'],mv:['Перемещение','v'],ret:['Возврат','r']};
const SUPPL=[
 {id:'p1',n:'ТОО «Климат Групп»',t:'Кондиционеры, сплит-системы',turn:6840000,debt:1840000,over:0,pay:'отсрочка 30 дней'},
 {id:'p2',n:'ТОО «ХолодТехСервис»',t:'Холодильное оборудование',turn:4120000,debt:820000,over:12,pay:'отсрочка 21 день'},
 {id:'p3',n:'ТОО «ЭлектроСнаб»',t:'Кабель, щиты, автоматика',turn:1960000,debt:400000,over:0,pay:'предоплата'},
 {id:'p4',n:'ИП Сериков (крепёж)',t:'Расходники и крепёж',turn:640000,debt:0,over:0,pay:'по факту'},
];
const PURCH=[
 {id:'z1',n:'Заказ 118 · «Климат Групп»',d:'08.09.2026',sum:2016000,st:'in',pay:'не оплачен',pos:'сплит 12k — 12 шт'},
 {id:'z2',n:'Заказ 117 · «ЭлектроСнаб»',d:'04.09.2026',sum:208000,st:'in',pay:'оплачен',pos:'кабель ВВГнг — 400 м'},
 {id:'z3',n:'Заказ 119 · «ХолодТехСервис»',d:'09.09.2026',sum:744000,st:'way',pay:'предоплата 50%',pos:'компрессор SC18 — 4 шт'},
 {id:'z4',n:'Заказ 120 · «Климат Групп»',d:'09.09.2026',sum:536000,st:'new',pay:'не оплачен',pos:'сплит 24k — 2 шт'},
];
const PST={new:['Черновик','a'],way:['В пути','b'],in:['Оприходован','g']};
const SALES=[
 {id:'v1',d:'07.09',cl:'c1',n:'Сплит-система 12k, 6 шт',rev:1380000,cost:1008000,pay:'50% оплачено'},
 {id:'v2',d:'05.09',cl:'c3',n:'Камеры IP 4 Мп, 8 шт + NVR',rev:742000,cost:606000,pay:'оплачено'},
 {id:'v3',d:'04.09',cl:'c2',n:'Сплит-система 24k, 3 шт',rev:1020000,cost:804000,pay:'отсрочка'},
 {id:'v4',d:'02.09',cl:'c4',n:'Компрессор SC18, 2 шт',rev:512000,cost:372000,pay:'оплачено'},
 {id:'v5',d:'01.09',cl:'c5',n:'Щит освещения в сборе',rev:286000,cost:214000,pay:'оплачено'},
];
const INV=[
 {id:'i1',n:'СЧ-2026-118',cl:'c1',d:'07.09.2026',sum:1380000,paid:690000,st:'part'},
 {id:'i2',n:'СЧ-2026-117',cl:'c2',d:'04.09.2026',sum:1020000,paid:0,st:'over'},
 {id:'i3',n:'СЧ-2026-116',cl:'c3',d:'03.09.2026',sum:742000,paid:742000,st:'paid'},
 {id:'i4',n:'СЧ-2026-115',cl:'c4',d:'02.09.2026',sum:820000,paid:0,st:'over'},
 {id:'i5',n:'СЧ-2026-114',cl:'c5',d:'01.09.2026',sum:286000,paid:286000,st:'paid'},
];
const IST={paid:['Оплачен','g'],part:['Частично','a'],over:['Просрочен','r']};
const OPS=[
 {d:'09.09',t:'in',n:'Оплата от «Медцентр Аружан»',art:'Выручка · оборудование',acc:'Halyk',sum:742000},
 {d:'08.09',t:'out',n:'Оплата «ЭлектроСнаб» по заказу 117',art:'Закуп оборудования',acc:'Halyk',sum:208000},
 {d:'08.09',t:'in',n:'Предоплата «Каспий Ритейл» по счёту 118',art:'Выручка · оборудование',acc:'Kaspi',sum:690000},
 {d:'07.09',t:'mv',n:'Инкассация кассы в банк',art:'Перемещение',acc:'Касса → Halyk',sum:400000},
 {d:'06.09',t:'out',n:'ГСМ и транспорт по выездам',art:'Транспорт',acc:'Касса',sum:96000},
 {d:'05.09',t:'out',n:'Аренда офиса и склада, сентябрь',art:'Аренда',acc:'Halyk',sum:520000},
 {d:'04.09',t:'in',n:'Оплата по акту, кафе «Нурлан»',art:'Выручка · услуги',acc:'Касса',sum:32000},
];
const ART=[
 {n:'Выручка · оборудование',t:'in',sum:11200000},
 {n:'Выручка · услуги',t:'in',sum:7440000},
 {n:'Закуп оборудования и материалов',t:'out',sum:9456000},
 {n:'Оплата труда и сдельная часть',t:'out',sum:2400000},
 {n:'Аренда офиса и склада',t:'out',sum:520000},
 {n:'Транспорт и ГСМ',t:'out',sum:640000},
 {n:'Связь, ПО, банк',t:'out',sum:196000},
 {n:'Инструмент и хозрасходы',t:'out',sum:344000},
 {n:'Налоги и отчисления',t:'out',sum:480000},
];
const STAFF=[
 {id:'e1',n:'Марат Тлеуов',p:'Инженер-механик',jobs:38,rev:2140000,ok:97,sal:280000,piece:214000},
 {id:'e2',n:'Аскар Жумабаев',p:'Инженер-холодильщик',jobs:31,rev:2010000,ok:94,sal:300000,piece:201000},
 {id:'e3',n:'Ильяс Сагинтаев',p:'Монтажник',jobs:27,rev:1280000,ok:91,sal:240000,piece:128000},
 {id:'e4',n:'Дана Ахметова',p:'Диспетчер',jobs:0,rev:0,ok:99,sal:220000,piece:0},
 {id:'e5',n:'Ерлан Кабылов',p:'Кладовщик',jobs:0,rev:0,ok:98,sal:230000,piece:0},
 {id:'e6',n:'Айна Серикова',p:'Менеджер по клиентам',jobs:0,rev:4360000,ok:96,sal:260000,piece:218000},
];
const CFLOW=[
 {m:'Май',plan:12800000,fact:12140000,out:9600000},
 {m:'Июнь',plan:14200000,fact:15060000,out:10840000},
 {m:'Июль',plan:15000000,fact:14320000,out:10960000},
 {m:'Август',plan:16400000,fact:17280000,out:12400000},
 {m:'Сентябрь',plan:18000000,fact:18640000,out:14036000},
];
const DOCS=[
 {n:'Счёт СЧ-2026-118',t:'Счёт',cl:'ТОО «Каспий Ритейл»',d:'07.09.2026',sum:1380000},
 {n:'Акт АВР-2026-204',t:'Акт выполненных работ',cl:'АО «Медцентр Аружан»',d:'03.09.2026',sum:148000},
 {n:'Накладная НК-2026-091',t:'Накладная',cl:'ТОО «Астана Молл»',d:'04.09.2026',sum:1020000},
 {n:'КП-2026-047',t:'Коммерческое предложение',cl:'ТОО «СтройБаза №1»',d:'02.09.2026',sum:640000},
 {n:'Договор ДГ-2026-030',t:'Договор обслуживания',cl:'ТОО «АгроТрейд KZ»',d:'15.08.2026',sum:0},
];

const clOf=id=>(CLIENTS.find(c=>c.id===id)||{n:'—'}).n;
const obOf=id=>(OBJECTS.find(o=>o.id===id)||{n:'—'}).n;
const dirOf=id=>(DIRS.find(d=>d.id===id)||{n:'—'}).n;
const PERIODS={day:'Сегодня',week:'Неделя',month:'Месяц',quarter:'Квартал',year:'Год'};
const PK={day:0.041,week:0.24,month:1,quarter:2.9,year:11.4};
const pv=n=>Math.round(n*PK[period]);

/* ===== ЭКРАНЫ ===== */
const SC={};

/* --- Главная: dashboard руководителя (раздел 4 ТЗ) --- */
function pchips(){return `<div class="chain" style="margin:0 0 11px">${Object.entries(PERIODS).map(([k,v])=>
 `<button class="cs ${period===k?'on':''}" onclick="setPeriod('${k}')">${v}</button>`).join('')}
 <span class="ca">·</span><span class="mini">фильтры: клиент, объект, направление, проект, сотрудник</span></div>`}
function setPeriod(p){period=p;render();
 toast(`Период: <b>${PERIODS[p]}</b>. Все показатели дашборда пересчитаны — по ТЗ фильтр общий для всех блоков.`)}

SC.dash=()=>`
 ${pchips()}
 <div class="strip">
  <div><small>ВЫРУЧКА</small><b class="a">${fmt(pv(F.rev))} ₸</b><span>оборудование ${fmt(pv(F.revEquip))} + услуги ${fmt(pv(F.revServ))}</span></div>
  <div><small>РАСХОДЫ</small><b>${fmt(pv(F.cost+F.opex))} ₸</b><span>себестоимость + операционные</span></div>
  <div><small>ПРИБЫЛЬ</small><b class="g">${fmt(pv(F.profit))} ₸</b><span class="g">рентабельность ${num(F.profit/F.rev*100)}%</span></div>
  <div><small>ДЕНЬГИ</small><b>${fmt(F.cash)} ₸</b><span>касса + два банка</span></div>
  <div><small>ДОЛГИ</small><b class="r">${fmt(F.ar)} ₸</b><span class="r">нам должны · мы ${fmt(F.ap)}</span></div>
 </div>
 <div class="g11">
  <div class="panel"><b>Склад</b>
   <div class="kv"><span>Общая стоимость склада</span><b>${fmt(F.stockSum)} ₸</b></div>
   <div class="kv"><span>Позиций номенклатуры</span><b>${F.stockPos}</b></div>
   <div class="kv"><span>Ниже минимального остатка</span><b style="color:var(--red)">${F.stockLow}</b></div>
   <div class="kv"><span>Оборудование на объектах (выдано)</span><b>${fmt(F.stockOnSite)} ₸</b></div>
   <div class="btns" style="margin-top:9px"><button class="btn" onclick="go('stock')">Открыть остатки</button><button class="btn" onclick="go('purchase')">Что дозаказать</button></div>
  </div>
  <div class="panel"><b>Продажи оборудования</b>
   <div class="kv"><span>Выручка</span><b>${fmt(pv(F.revEquip))} ₸</b></div>
   <div class="kv"><span>Количество продаж</span><b>${Math.max(1,Math.round(F.salesCount*PK[period]))}</b></div>
   <div class="kv"><span>Валовая прибыль</span><b style="color:var(--green)">${fmt(pv(F.grossEquip))} ₸</b></div>
   <div class="kv"><span>Средняя маржа</span><b>${num(F.margin)}%</b></div>
   <div class="btns" style="margin-top:9px"><button class="btn" onclick="go('sales')">Открыть продажи</button></div>
  </div>
 </div>
 <div class="g11">
  <div class="panel"><b>Услуги и работы</b>
   <div class="kv"><span>Выручка от услуг</span><b>${fmt(pv(F.revServ))} ₸</b></div>
   <div class="kv"><span>Выполнено работ</span><b>${Math.max(1,Math.round(F.jobsCount*PK[period]))}</b></div>
   <div class="kv"><span>Себестоимость (материалы + работа)</span><b>${fmt(pv(F.costMat+F.costWork))} ₸</b></div>
   <div class="kv"><span>Прибыль по услугам</span><b style="color:var(--green)">${fmt(pv(F.grossServ))} ₸</b></div>
   <div class="btns" style="margin-top:9px"><button class="btn" onclick="go('services')">По направлениям</button><button class="btn" onclick="go('acts')">Акты</button></div>
  </div>
  <div class="panel"><b>Объекты</b>
   <div class="kv"><span>Всего объектов</span><b>${F.objTotal}</b></div>
   <div class="kv"><span>Активные</span><b>${F.objActive}</b></div>
   <div class="kv"><span>На регламентном обслуживании</span><b>${F.objMaint}</b></div>
   <div class="kv"><span>Просроченные задачи</span><b style="color:var(--red)">${F.objOverdue}</b></div>
   <div class="btns" style="margin-top:9px"><button class="btn" onclick="go('objects')">Все объекты</button><button class="btn" onclick="go('maint')">График ТО</button></div>
  </div>
 </div>
 <div class="hint">Цифры на дашборде не вводятся руками. Выручка собирается из продаж и закрытых актов, себестоимость — из списаний со склада и работ сотрудников, долги — из счетов и оплат. Поэтому «Прибыль» здесь всегда равна тому, что покажет раздел «Финансы»: это один и тот же расчёт.</div>
 <div class="note" style="--tone:var(--wheat)"><b>Что ещё выводится на дашборд по ТЗ</b><p>Фильтры «сегодня / неделя / месяц / квартал / год / произвольный период» и разрезы по клиенту, объекту, направлению, проекту и сотруднику. Набор плиток настраивается: руководитель сам решает, что видит первым.</p></div>`;

/* --- Сквозная связка: главный принцип ТЗ --- */
const CH_BASE={stock:F.stockSum,cash:F.cash,ar:F.ar,ap:F.ap,cost:F.cost,rev:F.rev};
let CH={...CH_BASE},CHLOG=[],CHHIT=[];
const CH_OPS={
 buy:{n:'Закупили оборудование',d:'12 сплит-систем у «Климат Групп» по 168 000 ₸ с отсрочкой 30 дней',
  post:[['stock',2016000,'Склад пополнен на 12 позиций'],['ap',2016000,'Долг перед поставщиком вырос']],
  note:'Денег не тронули — купили в долг. Себестоимость этих 12 штук зафиксирована и будет списана в момент продажи, а не сейчас.'},
 sell:{n:'Продали оборудование',d:'6 сплит-систем «Каспий Ритейл» за 1 380 000 ₸, оплата 50% сразу',
  post:[['stock',-1008000,'Со склада списано 6 шт по себестоимости'],['rev',1380000,'Признана выручка'],['cost',1008000,'Признана себестоимость продажи'],['cash',690000,'Поступила предоплата 50%'],['ar',690000,'Остаток ушёл в дебиторскую задолженность']],
  note:'Одна операция закрыла пять разделов сразу. Прибыль по сделке — 372 000 ₸, она уже в общей прибыли компании.'},
 serv:{n:'Оказали услугу на объекте',d:'ТО кондиционеров в клинике «Аружан» на 148 000 ₸, акт подписан',
  post:[['rev',148000,'Выручка по акту'],['stock',-28000,'Списаны материалы: фильтры и фреон'],['cost',66000,'Себестоимость: материалы 28 000 + работа 32 000 + транспорт 6 000'],['ar',148000,'Клиент платит по договору с отсрочкой']],
  note:'Работа инженера учтена в себестоимости и одновременно попала в его сдельные начисления. Прибыль по услуге — 82 000 ₸.'}
};
function chRun(k){const op=CH_OPS[k];CHHIT=[];
 op.post.forEach(([f,v])=>{CH[f]+=v;if(!CHHIT.includes(f))CHHIT.push(f)});
 CHLOG.unshift({n:op.n,d:op.d,post:op.post,note:op.note});
 render();toast(`<b>${op.n}.</b> ${op.note}`)}
function chReset(){CH={...CH_BASE};CHLOG=[];CHHIT=[];render();
 toast('Показатели вернулись к состоянию на начало демонстрации.')}
function chCard(f,label,sub,cls){const d=CH[f]-CH_BASE[f];
 return `<div class="mcard${CHHIT.includes(f)?' hit':''}"><small>${label}</small>
  <b class="${cls||''}">${fmt(CH[f])} ₸</b>
  <div class="d mini">${sub}${d?` · <b style="color:${d>0?'var(--green)':'var(--red)'}">${d>0?'+':''}${fmt(d)}</b>`:''}</div></div>`}
SC.chain=()=>{const profit=CH.rev-CH.cost-F.opex,base=CH_BASE.rev-CH_BASE.cost-F.opex;
 return `
 <div class="head"><div><h2>Одна операция — все связанные разделы</h2>
  <p>Пункт 1 вашего ТЗ: «любая хозяйственная операция должна автоматически отражаться во всех связанных разделах системы». Нажмите операцию — и смотрите, что меняется. Ничего вводить второй раз не нужно.</p></div>
  <div class="btns"><button class="btn" onclick="chReset()">Сбросить</button></div></div>
 <div class="g3">
  ${Object.entries(CH_OPS).map(([k,o])=>`<div class="panel" style="cursor:pointer" onclick="chRun('${k}')">
   <b>${o.n}</b><p class="mini" style="margin:5px 0 9px">${o.d}</p>
   <button class="btn acc">Провести операцию →</button></div>`).join('')}
 </div>
 <div class="mgrid">
  ${chCard('stock','СКЛАД','стоимость остатков')}
  ${chCard('cash','ДЕНЬГИ','касса и банки')}
  ${chCard('ar','ДЕБИТОРКА','нам должны клиенты','r')}
  ${chCard('ap','КРЕДИТОРКА','мы должны поставщикам','r')}
  ${chCard('rev','ВЫРУЧКА','признанный доход','a')}
  ${chCard('cost','СЕБЕСТОИМОСТЬ','списано на реализацию')}
 </div>
 <div class="panel" style="margin-top:11px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap">
  <div><b>Прибыль после всех операций</b><p class="mini">Выручка − себестоимость − операционные расходы (${fmt(F.opex)} ₸)</p></div>
  <div style="text-align:right"><div style="font-size:26px;font-weight:800;letter-spacing:-.03em;color:var(--green)">${fmt(profit)} ₸</div>
   ${profit!==base?`<div class="mini">было ${fmt(base)} ₸ · <b style="color:var(--green)">+${fmt(profit-base)}</b></div>`:'<div class="mini">проведите операцию слева</div>'}</div>
 </div>
 ${CHLOG.length?`<div class="panel" style="padding:0"><div style="padding:12px 14px 4px"><b>Проводки системы</b><p class="mini">Столько записей делает система сама после одного вашего действия</p></div>
  <div class="tw"><table class="data" style="min-width:640px"><thead><tr><th>Операция</th><th>Раздел</th><th class="right">Изменение</th><th>Что произошло</th></tr></thead><tbody>
  ${CHLOG.slice(0,4).flatMap(l=>l.post.map((p,i)=>`<tr>
   <td>${i===0?`<b>${esc(l.n)}</b>`:''}</td>
   <td><span class="badge b">${{stock:'Склад',cash:'Деньги',ar:'Дебиторка',ap:'Кредиторка',rev:'Выручка',cost:'Себестоимость'}[p[0]]}</span></td>
   <td class="right mono" style="color:${p[1]>0?'var(--green)':'var(--red)'}">${p[1]>0?'+':''}${fmt(p[1])} ₸</td>
   <td class="mini">${esc(p[2])}</td></tr>`)).join('')}
  </tbody></table></div></div>`:''}
 <div class="hint">Так же связаны и остальные разделы: закрытие заявки актом создаёт выручку и списывает материалы, оплата счёта уменьшает дебиторку и увеличивает деньги, возврат поставщику уменьшает склад и наш долг. Двойного ввода нет нигде — в этом и смысл замены Excel и мессенджеров.</div>`};

/* --- Клиенты --- */
SC.clients=()=>`
 <div class="head"><div><h2>Клиенты · ${CLIENTS.length}</h2><p>Карточка клиента по ТЗ: реквизиты, контактные лица, объекты, договоры, продажи, оплаты и задолженность — в одном месте.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Форма нового клиента: тип, название, БИН/ИИН, адреса, телефон, email, сайт, контактное лицо, менеджер, банковские реквизиты и комментарий — всё по разделу 6 ТЗ.')">+ Клиент</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px">
  <thead><tr><th>Клиент</th><th>Тип</th><th class="right">Объектов</th><th>Договор</th><th>Менеджер</th><th class="right">Выручка за месяц</th><th class="right">Долг</th><th>Просрочка</th></tr></thead><tbody>
  ${CLIENTS.map(c=>`<tr onclick="openClient('${c.id}')">
   <td><b>${esc(c.n)}</b><div class="sub">${esc(c.bin)}</div></td>
   <td>${esc(c.t)}</td><td class="right mono">${c.obj}</td>
   <td>${c.dog==='без договора'?'<span class="badge a">без договора</span>':esc(c.dog)}</td>
   <td>${esc(c.mgr)}</td>
   <td class="right mono">${fmt(c.rev)} ₸</td>
   <td class="right mono">${c.debt?fmt(c.debt)+' ₸':'—'}</td>
   <td>${c.over?`<span class="badge r">${c.over} дн.</span>`:'<span class="badge g">нет</span>'}</td></tr>`).join('')}
  <tr><td><b>Итого</b></td><td></td><td class="right mono"><b>${CLIENTS.reduce((a,c)=>a+c.obj,0)}</b></td><td></td><td></td>
   <td class="right mono"><b>${fmt(CLIENTS.reduce((a,c)=>a+c.rev,0))} ₸</b></td>
   <td class="right mono"><b style="color:var(--red)">${fmt(CLIENTS.reduce((a,c)=>a+c.debt,0))} ₸</b></td><td></td></tr>
 </tbody></table></div></div>
 <div class="hint">Итог по колонке «Выручка» совпадает с дашбордом (${fmt(F.rev)} ₸), а итог по долгу — с разделом «Задолженность». Это не три отдельные таблицы, а один и тот же расчёт в разных разрезах.</div>`;
function openClient(id){const c=CLIENTS.find(x=>x.id===id);const objs=OBJECTS.filter(o=>o.cl===id);
 const sales=SALES.filter(s=>s.cl===id),inv=INV.filter(i=>i.cl===id),reqs=REQ.filter(r=>r.cl===id);
 openD(c.n,`${c.t} · БИН ${c.bin} · менеджер ${c.mgr}`,
  [['Основная','openClient(\''+id+'\')',1],['Объекты ('+objs.length+')','go(\'objects\')'],['Заявки ('+reqs.length+')','go(\'requests\')'],['Счета ('+inv.length+')','go(\'invoices\')']],
  `<div class="kv"><span>Юридический адрес</span><b>${esc(c.adr)}</b></div>
   <div class="kv"><span>Телефон</span><b>${esc(c.ph)}</b></div>
   <div class="kv"><span>Договор</span><b>${esc(c.dog)}</b></div>
   <div class="kv"><span>Условия оплаты</span><b>${esc(c.pay)}</b></div>
   <div class="kv"><span>Объектов на обслуживании</span><b>${c.obj}</b></div>
   <div class="kv"><span>Выручка за месяц</span><b>${fmt(c.rev)} ₸</b></div>
   <div class="kv"><span>Задолженность</span><b style="color:${c.debt?'var(--red)':'inherit'}">${c.debt?fmt(c.debt)+' ₸':'нет'}</b></div>
   ${c.over?`<div class="note" style="--tone:var(--red)"><b>Просрочка ${c.over} дней</b><p>Система сама поставила задачу менеджеру и предложила акт сверки. При превышении лимита долга новые отгрузки блокируются — настраивается в правах.</p></div>`:''}
   <div class="panel" style="margin-top:11px"><b>Продажи оборудования</b>
    ${sales.length?sales.map(s=>`<div class="kv"><span>${s.d} · ${esc(s.n)}</span><b>${fmt(s.rev)} ₸</b></div>`).join(''):'<p class="mini">За период продаж не было.</p>'}</div>
   <div class="panel"><b>Последние работы</b>
    ${reqs.length?reqs.map(r=>`<div class="kv"><span>${esc(r.t)}</span><b><span class="badge ${r.st==='act'?'g':r.st==='new'?'a':'b'}">${RST[r.st]}</span></b></div>`).join(''):'<p class="mini">Заявок нет.</p>'}</div>`)}

/* --- Договоры --- */
SC.contracts=()=>`
 <div class="head"><div><h2>Договоры</h2><p>Условия обслуживания, срок, сумма и приложения. Из договора подтягиваются цены в заявку и условия оплаты в счёт.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px">
  <thead><tr><th>Договор</th><th>Клиент</th><th>Предмет</th><th>Условия оплаты</th><th class="right">Сумма за месяц</th><th>Статус</th></tr></thead><tbody>
  ${CLIENTS.filter(c=>c.dog!=='без договора').map(c=>`<tr onclick="toast('Карточка договора: предмет, срок, приложения с прайсом, регламент ТО, ответственные и связанные объекты. Отсюда же продлеваем и печатаем допсоглашение.')">
   <td><b>${esc(c.dog)}</b></td><td>${esc(c.n)}</td>
   <td>Обслуживание ${c.obj} объект(ов)</td><td>${esc(c.pay)}</td>
   <td class="right mono">${fmt(c.rev)} ₸</td><td><span class="badge g">действует</span></td></tr>`).join('')}
  <tr onclick="toast('Клиент работает без договора — разовые заказы. Система подсвечивает такие сделки: по ним нет согласованного прайса и отсрочки.')">
   <td><b>—</b></td><td>ИП Нурланов А.</td><td>Разовые работы</td><td>по факту</td><td class="right mono">920 000 ₸</td><td><span class="badge a">без договора</span></td></tr>
 </tbody></table></div></div>
 <div class="note" style="--tone:var(--acc)"><b>Зачем договор в системе</b><p>Прайс из приложения к договору подставляется в заявку автоматически — инженер не считает стоимость в уме, а менеджер не открывает Excel. Отсрочка из договора управляет тем, когда счёт становится просроченным.</p></div>`;

/* --- Задолженность --- */
SC.debt=()=>`
 <div class="strip" style="grid-template-columns:repeat(4,1fr)">
  <div><small>НАМ ДОЛЖНЫ</small><b class="r">${fmt(F.ar)} ₸</b><span>дебиторская задолженность</span></div>
  <div><small>ИЗ НИХ ПРОСРОЧЕНО</small><b class="r">${fmt(F.arOver)} ₸</b><span>${num(F.arOver/F.ar*100)}% долга</span></div>
  <div><small>МЫ ДОЛЖНЫ</small><b>${fmt(F.ap)} ₸</b><span>кредиторская задолженность</span></div>
  <div><small>ЧИСТАЯ ПОЗИЦИЯ</small><b class="g">${fmt(F.ar-F.ap)} ₸</b><span>дебиторка минус кредиторка</span></div>
 </div>
 <div class="g11">
  <div class="panel" style="padding:0"><div style="padding:12px 14px 2px"><b>Должны нам</b></div>
   <div class="tw"><table class="data"><thead><tr><th>Клиент</th><th class="right">Долг</th><th>Просрочка</th><th>Условия</th></tr></thead><tbody>
   ${CLIENTS.filter(c=>c.debt).map(c=>`<tr onclick="openClient('${c.id}')">
    <td><b>${esc(c.n)}</b></td><td class="right mono">${fmt(c.debt)} ₸</td>
    <td>${c.over?`<span class="badge r">${c.over} дн.</span>`:'<span class="badge g">в сроке</span>'}</td>
    <td class="mini">${esc(c.pay)}</td></tr>`).join('')}
   </tbody></table></div></div>
  <div class="panel" style="padding:0"><div style="padding:12px 14px 2px"><b>Должны мы</b></div>
   <div class="tw"><table class="data"><thead><tr><th>Поставщик</th><th class="right">Долг</th><th>Просрочка</th><th>Условия</th></tr></thead><tbody>
   ${SUPPL.filter(s=>s.debt).map(s=>`<tr onclick="toast('Карточка поставщика: обороты, история поставок, задолженность и график платежей. Отсюда же создаётся заказ и оплата.')">
    <td><b>${esc(s.n)}</b></td><td class="right mono">${fmt(s.debt)} ₸</td>
    <td>${s.over?`<span class="badge r">${s.over} дн.</span>`:'<span class="badge g">в сроке</span>'}</td>
    <td class="mini">${esc(s.pay)}</td></tr>`).join('')}
   </tbody></table></div></div>
 </div>
 <div class="hint">Долг не вводится руками: он появляется, когда счёт выставлен и не оплачен, и уменьшается в момент поступления денег. Акт сверки по любому клиенту формируется за пару секунд — спор «мы же платили» закрывается документом, а не памятью.</div>`;

/* --- Объекты --- */
SC.objects=()=>`
 <div class="head"><div><h2>Объекты · ${F.objTotal}</h2><p>Адрес обслуживания со своим оборудованием, историей работ и графиком ТО. Показаны 8 из ${F.objTotal}.</p></div>
  <div class="btns"><button class="btn" onclick="toast('Фильтры по ТЗ: все, активные, архив, на обслуживании. Плюс срезы по клиенту, городу и направлению.')">Фильтры</button>
   <button class="btn acc" onclick="toast('Новый объект: клиент, адрес, тип, ответственный, список оборудования и регламент обслуживания.')">+ Объект</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:860px">
  <thead><tr><th>Объект</th><th>Клиент</th><th>Адрес</th><th class="right">Оборудования</th><th>Последнее ТО</th><th>Следующее ТО</th></tr></thead><tbody>
  ${OBJECTS.map(o=>`<tr onclick="openObject('${o.id}')">
   <td><b>${esc(o.n)}</b></td><td>${esc(clOf(o.cl))}</td><td class="mini">${esc(o.adr)}</td>
   <td class="right mono">${o.eq}</td><td class="mini">${o.last}</td>
   <td><span class="badge ${o.st==='over'?'r':o.st==='soon'?'a':'g'}">${o.to}${o.st==='over'?' · просрочено':o.st==='soon'?' · скоро':''}</span></td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="note" style="--tone:var(--red)"><b>Три объекта с просроченным ТО</b><p>Система ставит задачу диспетчеру сама, по регламенту из договора. Без системы такие объекты вспоминаются только когда оборудование встало и клиент звонит с претензией.</p></div>`;
function openObject(id){const o=OBJECTS.find(x=>x.id===id);const reqs=REQ.filter(r=>r.ob===id);
 openD(o.n,`${clOf(o.cl)} · ${o.adr}`,[['Оборудование','openObject(\''+id+'\')',1],['История работ','go(\'acts\')'],['График ТО','go(\'maint\')']],
  `<div class="kv"><span>Единиц оборудования</span><b>${o.eq}</b></div>
   <div class="kv"><span>Последнее обслуживание</span><b>${o.last}</b></div>
   <div class="kv"><span>Следующее по регламенту</span><b style="color:${o.st==='over'?'var(--red)':'inherit'}">${o.to}</b></div>
   <div class="panel" style="margin-top:11px"><b>Установленное оборудование</b>
    <div class="kv"><span>Сплит-система 12 000 BTU · 6 шт</span><b>серийные номера ведутся</b></div>
    <div class="kv"><span>Холодильная витрина · 3 шт</span><b>гарантия до 04.2027</b></div>
    <div class="kv"><span>Извещатели дымовые · 12 шт</span><b>ТО раз в полгода</b></div>
    <p class="mini" style="margin-top:7px">Каждая единица привязана к объекту: видно, что мы сюда ставили, когда и на какую сумму. При продаже оборудование уходит со склада прямо на объект.</p></div>
   <div class="panel"><b>Заявки по объекту</b>
    ${reqs.length?reqs.map(r=>`<div class="kv"><span>${esc(r.t)}</span><b><span class="badge ${r.st==='act'?'g':r.st==='new'?'a':'b'}">${RST[r.st]}</span></b></div>`).join(''):'<p class="mini">Активных заявок нет.</p>'}</div>`)}

/* --- Обслуживание (регламент) --- */
SC.maint=()=>`
 <div class="head"><div><h2>Регламентное обслуживание</h2><p>График ТО по объектам из условий договора. Система сама создаёт заявку заранее и назначает инженера.</p></div></div>
 <div class="g3">
  <div class="panel"><small class="mini">НА ОБСЛУЖИВАНИИ</small><div style="font-size:24px;font-weight:800">${F.objMaint}</div><p class="mini">объектов с регламентом ТО</p></div>
  <div class="panel"><small class="mini">ТО НА ЭТОЙ НЕДЕЛЕ</small><div style="font-size:24px;font-weight:800;color:var(--wheat)">5</div><p class="mini">заявки созданы автоматически</p></div>
  <div class="panel"><small class="mini">ПРОСРОЧЕНО</small><div style="font-size:24px;font-weight:800;color:var(--red)">${F.objOverdue}</div><p class="mini">эскалация руководителю</p></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:780px">
  <thead><tr><th>Объект</th><th>Регламент</th><th>Последнее ТО</th><th>Следующее</th><th>Инженер</th><th>Статус</th></tr></thead><tbody>
  ${OBJECTS.map((o,i)=>`<tr onclick="openObject('${o.id}')">
   <td><b>${esc(o.n)}</b></td><td class="mini">${i%2?'раз в месяц':'раз в квартал'}</td>
   <td class="mini">${o.last}</td><td>${o.to}</td><td>${['Марат','Аскар','Ильяс'][i%3]}</td>
   <td><span class="badge ${o.st==='over'?'r':o.st==='soon'?'a':'g'}">${o.st==='over'?'просрочено':o.st==='soon'?'на этой неделе':'в графике'}</span></td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint">Регламент задаётся один раз в договоре, дальше система работает сама: за три дня до срока создаётся заявка, назначается инженер, клиенту уходит уведомление. Просроченное ТО поднимается руководителю — это прямой источник претензий и потери клиента.</div>`;

/* --- Заявки: канбан с перетаскиванием --- */
let dragR=null;
function reqDrag(e,id){dragR=id;e.target.classList.add('drag')}
function reqDrop(e,k){e.preventDefault();colOut(k);const r=REQ.find(x=>x.id===dragR);if(!r)return;const was=r.st;r.st=k;render();
 const msg={new:'Заявка возвращена в новые — исполнитель снят.',
  set:'Инженер назначен, ему ушло уведомление в телефон, время выезда в календаре.',
  work:'Инженер на объекте. С этого момента можно списывать материалы на заявку.',
  done:'Работа выполнена. Осталось закрыть актом — тогда появится выручка.',
  act:'Акт подписан: признана выручка, списаны материалы, работа ушла в сдельные начисления инженера, сумма встала в счёт клиенту.'}[k];
 toast(`<b>${esc(r.t)}</b> · ${RST[was]} → ${RST[k]}. ${msg}`)}
function colOver(e,k){e.preventDefault();const el=document.getElementById('col-'+k);if(el)el.classList.add('over')}
function colOut(k){const el=document.getElementById('col-'+k);if(el)el.classList.remove('over')}
SC.requests=()=>{const cols=['new','set','work','done','act'];
 return `<div class="head"><div><h2>Заявки и работы</h2><p>Карточку можно тянуть мышью между колонками. Перевод в «Закрыта актом» — это и есть та операция, которая создаёт выручку и списывает материалы.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Новая заявка: клиент, объект, направление, описание, срок и приоритет. Заявка может прийти сама — с почты, из WhatsApp или из регламента ТО.')">+ Заявка</button></div></div>
 <div class="board" style="grid-template-columns:repeat(5,1fr)">
  ${cols.map(k=>{const list=REQ.filter(r=>r.st===k);
   return `<div class="col" id="col-${k}" ondragover="colOver(event,'${k}')" ondragleave="colOut('${k}')" ondrop="reqDrop(event,'${k}')">
    <div class="col-h"><b>${RST[k]}</b><span class="badge">${list.length}</span></div>
    ${list.map(r=>`<div class="kc" draggable="true" style="--pr:${r.pri==='high'?'var(--red)':r.pri==='mid'?'var(--wheat)':'var(--acc)'}"
      ondragstart="reqDrag(event,'${r.id}')" ondragend="this.classList.remove('drag')" onclick="openReq('${r.id}')">
     <b>${esc(r.t)}</b>
     <div class="kmeta">${esc(clOf(r.cl))}${r.ob?' · '+esc(obOf(r.ob)):''}</div>
     <div class="krow"><span class="badge ${r.eng?'b':'a'}">${r.eng||'не назначен'}</span>
      <span class="mini">${r.sum?fmt(r.sum)+' ₸':r.due}</span></div></div>`).join('')||'<p class="mini">Пусто</p>'}
   </div>`}).join('')}
 </div>
 <div class="hint">Заявка тянет за собой всё: направление задаёт прайс, объект — оборудование и историю, инженер — сдельные начисления, материалы — списание со склада. Поэтому закрытая заявка сразу видна и в выручке, и в складе, и в зарплате.</div>`};
function openReq(id){const r=REQ.find(x=>x.id===id);
 openD(r.t,`${clOf(r.cl)}${r.ob?' · '+obOf(r.ob):''} · ${dirOf(r.dir)}`,
  [['Заявка','openReq(\''+id+'\')',1],['Материалы','go(\'stock\')'],['Акт','go(\'acts\')']],
  `<div class="kv"><span>Статус</span><b><span class="badge ${r.st==='act'?'g':r.st==='new'?'a':'b'}">${RST[r.st]}</span></b></div>
   <div class="kv"><span>Исполнитель</span><b>${r.eng||'не назначен'}</b></div>
   <div class="kv"><span>Срок</span><b>${r.due}</b></div>
   <div class="kv"><span>Приоритет</span><b>${{high:'Высокий',mid:'Обычный',low:'Низкий'}[r.pri]}</b></div>
   <div class="kv"><span>Стоимость по прайсу договора</span><b>${r.sum?fmt(r.sum)+' ₸':'считается после осмотра'}</b></div>
   <div class="panel" style="margin-top:11px"><b>Материалы на заявку</b>
    <div class="kv"><span>Фильтр воздушный G4 · 4 компл</span><b>29 600 ₸</b></div>
    <div class="kv"><span>Фреон R410a · 0,4 бал</span><b>25 600 ₸</b></div>
    <p class="mini" style="margin-top:7px">Инженер отмечает материалы в телефоне — они списываются со склада на эту заявку и попадают в её себестоимость. Кладовщику ничего не диктуют по телефону.</p></div>
   <div class="panel"><b>Что произойдёт при закрытии актом</b>
    <div class="kv"><span>Выручка</span><b style="color:var(--green)">+${fmt(r.sum||0)} ₸</b></div>
    <div class="kv"><span>Списание материалов</span><b>−55 200 ₸</b></div>
    <div class="kv"><span>Сдельная часть инженеру</span><b>+${fmt(Math.round((r.sum||0)*0.1))} ₸</b></div>
    <div class="kv"><span>Счёт клиенту</span><b>формируется автоматически</b></div></div>`)}

/* --- Календарь --- */
SC.calendar=()=>{const days=['Пн 08','Вт 09','Ср 10','Чт 11','Пт 12','Сб 13','Вс 14'];
 const plan={0:[['Марат','ТО сплит-систем · Каспий Абая']],1:[['Аскар','Замена компрессора · АгроТрейд'],['Ильяс','Монтаж камер · СтройБаза']],
  2:[['Марат','ТО 12 сплит-систем · Каспий Райымбека'],['Аскар','Диагностика витрин · Каспий Саина']],
  3:[['Ильяс','Монтаж камер · СтройБаза'],['Марат','ТО фудкорт · Астана Молл']],
  4:[['Аскар','Профилактика склада · АгроТрейд']],5:[],6:[]};
 return `<div class="head"><div><h2>Календарь работ · 8–14 сентября</h2><p>Загрузка инженеров по дням. Выезды, регламентные ТО и монтажи в одном графике — видно, кто перегружен, а кто свободен.</p></div></div>
 <div class="board" style="grid-template-columns:repeat(7,1fr)">
  ${days.map((d,i)=>`<div class="col"><div class="col-h"><b>${d}</b><span class="badge">${(plan[i]||[]).length}</span></div>
   ${(plan[i]||[]).map(([e,t])=>`<div class="kc" style="--pr:var(--acc)" onclick="toast('Из календаря открывается заявка: клиент, объект, что делать, какие материалы нужны. Инженер видит тот же список в телефоне.')">
    <b>${esc(t)}</b><div class="kmeta">${esc(e)}</div></div>`).join('')||'<p class="mini">Свободно</p>'}
  </div>`).join('')}
 </div>
 <div class="note" style="--tone:var(--acc)"><b>Зачем календарь руководителю</b><p>Видно реальную загрузку: если у одного инженера три выезда в день, а у другого один — заявки перераспределяются мышью. Это же и защита от «я не успел, мне не сказали».</p></div>`};

/* --- Направления и услуги --- */
SC.services=()=>{const tr=DIRS.reduce((a,d)=>a+d.rev,0),tc=DIRS.reduce((a,d)=>a+d.cost,0);
 return `<div class="head"><div><h2>Направления услуг</h2><p>Прибыльность каждого направления: выручка, себестоимость и рентабельность. Видно, чем стоит заниматься, а что кормит вас плохо.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:860px">
  <thead><tr><th>Направление</th><th class="right">Работ</th><th class="right">Выручка</th><th class="right">Себестоимость</th><th class="right">Прибыль</th><th class="right">Рентабельность</th><th>Прайс</th></tr></thead><tbody>
  ${DIRS.map(d=>{const p=d.rev-d.cost,r=p/d.rev*100;
   return `<tr onclick="toast('Внутри направления — виды услуг с ценой и нормой времени. Прайс подставляется в заявку, а норма времени — в загрузку инженера.')">
   <td><b>${esc(d.n)}</b></td><td class="right mono">${d.jobs}</td>
   <td class="right mono">${fmt(d.rev)} ₸</td><td class="right mono">${fmt(d.cost)} ₸</td>
   <td class="right mono" style="color:var(--green)">${fmt(p)} ₸</td>
   <td class="right mono"><b style="color:${r>50?'var(--green)':r>45?'var(--wheat)':'var(--red)'}">${num(r)}%</b></td>
   <td class="mini">${esc(d.price)}</td></tr>`}).join('')}
  <tr><td><b>Итого по услугам</b></td><td class="right mono"><b>${DIRS.reduce((a,d)=>a+d.jobs,0)}</b></td>
   <td class="right mono"><b>${fmt(tr)} ₸</b></td><td class="right mono"><b>${fmt(tc)} ₸</b></td>
   <td class="right mono"><b style="color:var(--green)">${fmt(tr-tc)} ₸</b></td>
   <td class="right mono"><b>${num((tr-tc)/tr*100)}%</b></td><td></td></tr>
 </tbody></table></div></div>
 <div class="hint">Себестоимость услуги — это материалы со склада плюс работа сотрудника плюс дополнительные расходы (транспорт, подъёмник, субподряд). Всё это уже учтено в цифрах выше, поэтому «прибыль» здесь настоящая, а не выручка минус зарплата на глаз.</div>`};

/* --- Выполненные и акты --- */
SC.acts=()=>`
 <div class="strip" style="grid-template-columns:repeat(4,1fr)">
  <div><small>ВЫПОЛНЕНО РАБОТ</small><b>${F.jobsCount}</b><span>за сентябрь</span></div>
  <div><small>ЗАКРЫТО АКТАМИ</small><b class="g">121</b><span>подписано клиентом</span></div>
  <div><small>ЖДУТ ПОДПИСИ</small><b class="w">7</b><span>акт сформирован</span></div>
  <div><small>ВЫРУЧКА ПО АКТАМ</small><b class="a">${fmt(F.revServ)} ₸</b><span>вошла в прибыль</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:860px">
  <thead><tr><th>Работа</th><th>Клиент / объект</th><th>Инженер</th><th class="right">Сумма</th><th class="right">Себестоимость</th><th>Документ</th></tr></thead><tbody>
  ${REQ.filter(r=>r.st==='act'||r.st==='done').map(r=>`<tr onclick="openReq('${r.id}')">
   <td><b>${esc(r.t)}</b><div class="sub">${esc(dirOf(r.dir))}</div></td>
   <td class="mini">${esc(clOf(r.cl))}${r.ob?'<br>'+esc(obOf(r.ob)):''}</td>
   <td>${esc(r.eng)}</td><td class="right mono">${fmt(r.sum)} ₸</td>
   <td class="right mono">${fmt(Math.round(r.sum*0.47))} ₸</td>
   <td>${r.st==='act'?'<span class="badge g">акт подписан</span>':'<span class="badge a">ждёт акта</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="note" style="--tone:var(--green)"><b>Акт формируется системой</b><p>Из заявки: что сделано, какие материалы израсходованы, сколько часов. Печатная форма и подпись на планшете у клиента прямо на объекте — не надо возвращаться в офис и набирать в Word.</p></div>`;

/* --- Склад --- */
SC.stock=()=>`
 <div class="strip" style="grid-template-columns:repeat(4,1fr)">
  <div><small>СТОИМОСТЬ СКЛАДА</small><b class="a">${fmt(F.stockSum)} ₸</b><span>${F.stockPos} позиций</span></div>
  <div><small>НИЖЕ МИНИМУМА</small><b class="r">${F.stockLow}</b><span>нужно дозаказать</span></div>
  <div><small>НА ОБЪЕКТАХ</small><b>${fmt(F.stockOnSite)} ₸</b><span>выдано, не списано</span></div>
  <div><small>ОБОРАЧИВАЕМОСТЬ</small><b>34 дн.</b><span>средний срок хранения</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px">
  <thead><tr><th>Номенклатура</th><th>Ед.</th><th class="right">Остаток</th><th class="right">Минимум</th><th class="right">Цена</th><th class="right">Сумма</th><th>Статус</th></tr></thead><tbody>
  ${STOCK.map(s=>`<tr onclick="toast('Карточка позиции: движение за период, на каких объектах установлено, серийные номера, поставщики и цены закупки. Отсюда же создаётся заказ поставщику.')">
   <td><b>${esc(s.n)}</b></td><td class="mini">${s.u}</td>
   <td class="right mono"><b>${s.q}</b></td><td class="right mono">${s.min}</td>
   <td class="right mono">${fmt(s.pr)} ₸</td><td class="right mono">${fmt(s.q*s.pr)} ₸</td>
   <td>${s.q<s.min?'<span class="badge r">ниже минимума</span>':s.q<s.min*1.5?'<span class="badge a">на исходе</span>':'<span class="badge g">в норме</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint">Показаны 10 позиций из ${F.stockPos}. Остаток меняется сам: приход от поставщика увеличивает, продажа и списание на заявку уменьшают. Когда позиция падает ниже минимума, система предлагает заказ поставщику — вручную следить не нужно.</div>`;

SC.moves=()=>`
 <div class="head"><div><h2>Движения склада</h2><p>Приход, расход, перемещение, списание и возврат — одной лентой с документом-основанием. Любую строку видно, откуда она взялась.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:860px">
  <thead><tr><th>Дата</th><th>Тип</th><th>Операция</th><th>Документ</th><th>Количество</th><th class="right">Сумма</th><th>Кто</th></tr></thead><tbody>
  ${MOVES.map(m=>`<tr onclick="toast('Каждое движение привязано к документу: накладной, заявке, счёту или акту списания. Это ответ на вопрос «куда делись 12 кондиционеров» без разбирательств.')">
   <td class="mono">${m.d}</td><td><span class="badge ${MVT[m.t][1]}">${MVT[m.t][0]}</span></td>
   <td><b>${esc(m.n)}</b></td><td class="mini">${esc(m.doc)}</td><td class="mini">${esc(m.q)}</td>
   <td class="right mono" style="color:${m.t==='in'?'var(--green)':m.t==='mv'?'inherit':'var(--red)'}">${m.t==='in'?'+':m.t==='mv'?'':'−'}${fmt(m.sum)} ₸</td>
   <td>${esc(m.who)}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="note" style="--tone:var(--wheat)"><b>Списание только по основанию</b><p>Материал нельзя списать «просто так» — нужна заявка, продажа или акт. Поэтому склад сходится, а недостача видна сразу, а не на годовой инвентаризации.</p></div>`;

SC.inv=()=>`
 <div class="head"><div><h2>Инвентаризация · 31.08.2026</h2><p>Учёт против факта. Расхождения по позициям с суммой и ответственным.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Инвентаризация с телефона: сканируете позицию, вводите факт. Система сама считает расхождение и формирует акт списания или оприходования излишков.')">Начать инвентаризацию</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:780px">
  <thead><tr><th>Позиция</th><th class="right">По учёту</th><th class="right">По факту</th><th class="right">Расхождение</th><th class="right">Сумма</th><th>Причина</th></tr></thead><tbody>
  ${[['Фильтр воздушный G4 (комплект)',52,48,-4,7400,'списано на заявку без отметки'],
     ['Кабель ВВГнг 3×2,5',680,640,-40,520,'обрезки на монтаже'],
     ['Извещатель дымовой ИП-212',34,34,0,4200,'—'],
     ['Фреон R410a, баллон',9,9,0,64000,'—'],
     ['Крепёж и расходники (набор)',29,26,-3,9800,'не оформлено списание']].map(([n,u,f,d,pr,why])=>`<tr>
   <td><b>${esc(n)}</b></td><td class="right mono">${u}</td><td class="right mono">${f}</td>
   <td class="right mono" style="color:${d?'var(--red)':'var(--green)'}">${d||'0'}</td>
   <td class="right mono">${d?fmt(Math.abs(d*pr))+' ₸':'—'}</td><td class="mini">${esc(why)}</td></tr>`).join('')}
  <tr><td><b>Итого расхождений</b></td><td></td><td></td><td class="right mono"><b style="color:var(--red)">−47</b></td>
   <td class="right mono"><b style="color:var(--red)">80 900 ₸</b></td><td class="mini">по трём позициям</td></tr>
 </tbody></table></div></div>
 <div class="hint">80 900 ₸ за месяц — это 970 тысяч в год, которые сейчас просто исчезают. Причина почти всегда одна: материал взяли на объект и не оформили. В системе списание делает сам инженер в телефоне, поэтому расхождение видно на следующий день, а не через год.</div>`;

/* --- Закупки и поставщики --- */
SC.purchase=()=>`
 <div class="head"><div><h2>Закупки</h2><p>Заказ поставщику → приход на склад → оплата. Каждый шаг меняет склад и задолженность автоматически.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Система сама предлагает заказ: берёт позиции ниже минимума, средний расход за месяц и сроки поставки. Вам остаётся подтвердить.')">Сформировать заказ</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px">
  <thead><tr><th>Заказ</th><th>Дата</th><th>Позиции</th><th class="right">Сумма</th><th>Статус</th><th>Оплата</th></tr></thead><tbody>
  ${PURCH.map(z=>`<tr onclick="toast('Оприходование заказа увеличивает склад и создаёт долг перед поставщиком. Оплата уменьшает деньги и этот долг. Двух записей вручную не нужно.')">
   <td><b>${esc(z.n)}</b></td><td class="mono">${z.d}</td><td class="mini">${esc(z.pos)}</td>
   <td class="right mono">${fmt(z.sum)} ₸</td>
   <td><span class="badge ${PST[z.st][1]}">${PST[z.st][0]}</span></td>
   <td>${z.pay==='оплачен'?'<span class="badge g">оплачен</span>':z.pay==='не оплачен'?'<span class="badge r">не оплачен</span>':'<span class="badge a">'+esc(z.pay)+'</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><b>Нужно дозаказать</b>
   ${STOCK.filter(s=>s.q<s.min).map(s=>`<div class="kv"><span>${esc(s.n)}</span><b style="color:var(--red)">${s.q} из ${s.min}</b></div>`).join('')}
   <p class="mini" style="margin-top:7px">Позиции ниже минимального остатка. Система считает потребность по среднему расходу и сроку поставки.</p></div>
  <div class="panel"><b>Платежи поставщикам на неделе</b>
   ${SUPPL.filter(s=>s.debt).map(s=>`<div class="kv"><span>${esc(s.n)}</span><b>${fmt(s.debt)} ₸${s.over?` · <span style="color:var(--red)">просрочка ${s.over} дн.</span>`:''}</b></div>`).join('')}
   <p class="mini" style="margin-top:7px">Платёжный календарь: видно, сколько нужно денег и хватает ли их на счетах.</p></div>
 </div>`;

SC.suppliers=()=>`
 <div class="head"><div><h2>Поставщики</h2><p>Условия, обороты, задолженность и история поставок по каждому.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:760px">
  <thead><tr><th>Поставщик</th><th>Что поставляет</th><th>Условия</th><th class="right">Оборот за месяц</th><th class="right">Наш долг</th><th>Просрочка</th></tr></thead><tbody>
  ${SUPPL.map(s=>`<tr onclick="toast('Карточка поставщика: прайс, история цен по позициям, сроки поставки и надёжность. Видно, у кого дешевле, а кто срывает сроки.')">
   <td><b>${esc(s.n)}</b></td><td class="mini">${esc(s.t)}</td><td class="mini">${esc(s.pay)}</td>
   <td class="right mono">${fmt(s.turn)} ₸</td>
   <td class="right mono">${s.debt?fmt(s.debt)+' ₸':'—'}</td>
   <td>${s.over?`<span class="badge r">${s.over} дн.</span>`:'<span class="badge g">нет</span>'}</td></tr>`).join('')}
  <tr><td><b>Итого</b></td><td></td><td></td><td class="right mono"><b>${fmt(SUPPL.reduce((a,s)=>a+s.turn,0))} ₸</b></td>
   <td class="right mono"><b style="color:var(--red)">${fmt(SUPPL.reduce((a,s)=>a+s.debt,0))} ₸</b></td><td></td></tr>
 </tbody></table></div></div>
 <div class="hint">Итог по долгу совпадает с кредиторской задолженностью на дашборде — ${fmt(F.ap)} ₸. История цен по позиции показывает, как менялась закупочная цена: это прямой аргумент в переговорах о скидке.</div>`;

/* --- Продажи и счета --- */
SC.sales=()=>{const rev=SALES.reduce((a,s)=>a+s.rev,0),cost=SALES.reduce((a,s)=>a+s.cost,0);
 return `<div class="strip" style="grid-template-columns:repeat(4,1fr)">
  <div><small>ПРОДАЖИ ЗА МЕСЯЦ</small><b class="a">${fmt(F.revEquip)} ₸</b><span>${F.salesCount} сделок</span></div>
  <div><small>СЕБЕСТОИМОСТЬ</small><b>${fmt(F.costEquip)} ₸</b><span>списано со склада</span></div>
  <div><small>ВАЛОВАЯ ПРИБЫЛЬ</small><b class="g">${fmt(F.grossEquip)} ₸</b><span>по проданному оборудованию</span></div>
  <div><small>СРЕДНЯЯ МАРЖА</small><b>${num(F.margin)}%</b><span>считается по каждой сделке</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:840px">
  <thead><tr><th>Дата</th><th>Клиент</th><th>Что продано</th><th class="right">Выручка</th><th class="right">Себестоимость</th><th class="right">Маржа</th><th>Оплата</th></tr></thead><tbody>
  ${SALES.map(s=>{const m=(s.rev-s.cost)/s.rev*100;
   return `<tr onclick="toast('Продажа списывает товар со склада по себестоимости, создаёт выручку и счёт клиенту. Маржа считается по каждой сделке — видно, где продали слишком дёшево.')">
   <td class="mono">${s.d}</td><td>${esc(clOf(s.cl))}</td><td><b>${esc(s.n)}</b></td>
   <td class="right mono">${fmt(s.rev)} ₸</td><td class="right mono">${fmt(s.cost)} ₸</td>
   <td class="right mono"><b style="color:${m>25?'var(--green)':m>18?'var(--wheat)':'var(--red)'}">${num(m)}%</b></td>
   <td>${s.pay==='оплачено'?'<span class="badge g">оплачено</span>':s.pay==='отсрочка'?'<span class="badge a">отсрочка</span>':'<span class="badge b">'+esc(s.pay)+'</span>'}</td></tr>`}).join('')}
  <tr><td></td><td><b>Показано 5 из ${F.salesCount}</b></td><td></td>
   <td class="right mono"><b>${fmt(rev)} ₸</b></td><td class="right mono"><b>${fmt(cost)} ₸</b></td>
   <td class="right mono"><b>${num((rev-cost)/rev*100)}%</b></td><td></td></tr>
 </tbody></table></div></div>
 <div class="note" style="--tone:var(--acc)"><b>Маржа по каждой сделке</b><p>Себестоимость берётся не средняя по прайсу, а фактическая — по цене той партии, из которой ушёл товар. Поэтому видно реальную прибыль, а не «примерно 30%».</p></div>`};

SC.invoices=()=>`
 <div class="head"><div><h2>Счета</h2><p>Выставлено, оплачено, просрочено. Оплата счёта сама уменьшает дебиторку и увеличивает деньги на счёте.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Счёт формируется из продажи или закрытой заявки — с реквизитами клиента из карточки и позициями из документа. Отправляется клиенту ссылкой или PDF.')">+ Счёт</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:800px">
  <thead><tr><th>Счёт</th><th>Клиент</th><th>Дата</th><th class="right">Сумма</th><th class="right">Оплачено</th><th class="right">Остаток</th><th>Статус</th></tr></thead><tbody>
  ${INV.map(i=>`<tr onclick="toast('Из счёта видно основание — продажа или акт, — и все поступления по нему. Оплата отмечается один раз и сразу отражается в деньгах, дебиторке и карточке клиента.')">
   <td><b>${esc(i.n)}</b></td><td>${esc(clOf(i.cl))}</td><td class="mono">${i.d}</td>
   <td class="right mono">${fmt(i.sum)} ₸</td><td class="right mono">${fmt(i.paid)} ₸</td>
   <td class="right mono" style="color:${i.sum-i.paid?'var(--red)':'inherit'}">${i.sum-i.paid?fmt(i.sum-i.paid)+' ₸':'—'}</td>
   <td><span class="badge ${IST[i.st][1]}">${IST[i.st][0]}</span></td></tr>`).join('')}
 </tbody></table></div></div>`;

/* --- Деньги --- */
SC.money=()=>`
 <div class="strip" style="grid-template-columns:repeat(4,1fr)">
  <div><small>ВСЕГО ДЕНЕГ</small><b class="a">${fmt(F.cash)} ₸</b><span>касса и два счёта</span></div>
  <div><small>КАССА</small><b>${fmt(F.cashDesk)} ₸</b><span>наличные</span></div>
  <div><small>HALYK</small><b>${fmt(F.bankHalyk)} ₸</b><span>основной счёт</span></div>
  <div><small>KASPI</small><b>${fmt(F.bankKaspi)} ₸</b><span>приём оплат</span></div>
 </div>
 <div class="panel" style="padding:0"><div style="padding:12px 14px 2px"><b>Все операции</b><p class="mini">Приход, расход и перемещения между кассой и счетами — с указанием статьи</p></div>
  <div class="tw"><table class="data" style="min-width:820px">
  <thead><tr><th>Дата</th><th>Тип</th><th>Операция</th><th>Статья</th><th>Счёт</th><th class="right">Сумма</th></tr></thead><tbody>
  ${OPS.map(o=>`<tr onclick="toast('Каждая операция привязана к статье и к документу-основанию. Поэтому отчёт по расходам собирается сам, без разбора выписки в конце месяца.')">
   <td class="mono">${o.d}</td>
   <td><span class="badge ${o.t==='in'?'g':o.t==='mv'?'v':'r'}">${o.t==='in'?'Приход':o.t==='mv'?'Перемещение':'Расход'}</span></td>
   <td><b>${esc(o.n)}</b></td><td class="mini">${esc(o.art)}</td><td class="mini">${esc(o.acc)}</td>
   <td class="right mono" style="color:${o.t==='in'?'var(--green)':o.t==='mv'?'inherit':'var(--red)'}">${o.t==='in'?'+':o.t==='mv'?'':'−'}${fmt(o.sum)} ₸</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint">Деньги и прибыль — разные вещи, и система показывает обе. Прибыль за месяц ${fmt(F.profit)} ₸, а на счетах ${fmt(F.cash)} ₸: разница в том, что ${fmt(F.ar)} ₸ клиенты ещё не заплатили, а ${fmt(F.ap)} ₸ мы ещё должны поставщикам.</div>`;

/* --- Финансы --- */
SC.finance=()=>`
 <div class="strip">
  <div><small>ВЫРУЧКА</small><b class="a">${fmt(F.rev)} ₸</b><span>оборудование + услуги</span></div>
  <div><small>СЕБЕСТОИМОСТЬ</small><b>${fmt(F.cost)} ₸</b><span>товар, материалы, работа</span></div>
  <div><small>ВАЛОВАЯ ПРИБЫЛЬ</small><b class="g">${fmt(F.gross)} ₸</b><span>${num(F.gross/F.rev*100)}% от выручки</span></div>
  <div><small>ОПЕРАЦИОННЫЕ</small><b class="w">${fmt(F.opex)} ₸</b><span>аренда, транспорт, связь</span></div>
  <div><small>ЧИСТАЯ ПРИБЫЛЬ</small><b class="g">${fmt(F.profit)} ₸</b><span class="g">${num(F.profit/F.rev*100)}% рентабельности</span></div>
 </div>
 <div class="g11">
  <div class="panel"><b>Прибыль по источникам</b>
   <div class="kv"><span>Продажа оборудования</span><b>${fmt(F.grossEquip)} ₸</b></div>
   <div class="bar" style="--w:${F.grossEquip/F.gross*100}%"><i></i></div>
   <div class="kv" style="margin-top:9px"><span>Услуги и работы</span><b>${fmt(F.grossServ)} ₸</b></div>
   <div class="bar" style="--w:${F.grossServ/F.gross*100}%"><i></i></div>
   <p class="mini" style="margin-top:9px">Услуги дают ${num(F.grossServ/F.gross*100)}% валовой прибыли при ${num(F.revServ/F.rev*100)}% выручки — они рентабельнее продажи оборудования. Без раздельного учёта этого не видно.</p></div>
  <div class="panel" style="padding:0"><div style="padding:12px 14px 2px"><b>Статьи доходов и расходов</b></div>
   <div class="tw"><table class="data"><thead><tr><th>Статья</th><th>Тип</th><th class="right">Сумма</th></tr></thead><tbody>
   ${ART.map(a=>`<tr><td>${esc(a.n)}</td>
    <td><span class="badge ${a.t==='in'?'g':'r'}">${a.t==='in'?'доход':'расход'}</span></td>
    <td class="right mono">${fmt(a.sum)} ₸</td></tr>`).join('')}
   </tbody></table></div></div>
 </div>
 <div class="note" style="--tone:var(--green)"><b>Проверка сходимости</b><p>Выручка ${fmt(F.rev)} − себестоимость ${fmt(F.cost)} − операционные ${fmt(F.opex)} = ${fmt(F.profit)} ₸. Ровно эта цифра стоит на «Главной» и получается из тех же продаж, актов и списаний — пересчитывать в Excel нечего.</p></div>`;

SC.cashflow=()=>{const mx=Math.max(...CFLOW.map(c=>Math.max(c.plan,c.fact)));
 return `<div class="head"><div><h2>Cash Flow · план / факт</h2><p>Поступления и выплаты по месяцам, отклонение факта от плана и остаток денег.</p></div></div>
 <div class="panel"><b>Поступления: план и факт</b>
  ${CFLOW.map(c=>{const d=c.fact-c.plan;
   return `<div style="margin-top:11px"><div class="kv" style="border:0;padding:0 0 4px">
    <span><b>${c.m}</b></span>
    <b>факт ${fmt(c.fact)} ₸ · план ${fmt(c.plan)} ₸ · <span style="color:${d>=0?'var(--green)':'var(--red)'}">${d>=0?'+':''}${fmt(d)}</span></b></div>
   <div class="bar" style="--w:${c.fact/mx*100}%"><i style="background:${d>=0?'var(--green)':'var(--red)'}"></i></div></div>`}).join('')}
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:700px">
  <thead><tr><th>Месяц</th><th class="right">Поступления</th><th class="right">Выплаты</th><th class="right">Чистый поток</th><th class="right">План</th><th class="right">Отклонение</th></tr></thead><tbody>
  ${CFLOW.map(c=>`<tr><td><b>${c.m}</b></td>
   <td class="right mono">${fmt(c.fact)} ₸</td><td class="right mono">${fmt(c.out)} ₸</td>
   <td class="right mono" style="color:var(--green)">${fmt(c.fact-c.out)} ₸</td>
   <td class="right mono">${fmt(c.plan)} ₸</td>
   <td class="right mono" style="color:${c.fact>=c.plan?'var(--green)':'var(--red)'}">${c.fact>=c.plan?'+':''}${fmt(c.fact-c.plan)} ₸</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint">План ставится на месяц вперёд, факт собирается сам из оплат. Кассовый разрыв виден заранее: система показывает, что 18-го числа нужно заплатить поставщикам 3 060 000 ₸, а поступлений к этой дате ожидается меньше.</div>`};

/* --- Люди --- */
SC.staff=()=>`
 <div class="head"><div><h2>Сотрудники</h2><p>Загрузка, выполненные работы и выручка, которую принёс каждый. Основание для сдельной части — не «на глаз», а закрытые акты.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:800px">
  <thead><tr><th>Сотрудник</th><th>Должность</th><th class="right">Работ за месяц</th><th class="right">Выручка</th><th class="right">Без замечаний</th><th>Статус</th></tr></thead><tbody>
  ${STAFF.map(e=>`<tr onclick="go('payroll')">
   <td><b>${esc(e.n)}</b></td><td class="mini">${esc(e.p)}</td>
   <td class="right mono">${e.jobs||'—'}</td>
   <td class="right mono">${e.rev?fmt(e.rev)+' ₸':'—'}</td>
   <td class="right mono">${e.ok}%</td>
   <td>${e.ok>=95?'<span class="badge g">норма</span>':'<span class="badge a">есть замечания</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="note" style="--tone:var(--acc)"><b>Прозрачность вместо споров</b><p>Инженер видит свои закрытые работы и начисленную сдельную часть в телефоне. Вопрос «почему мне столько заплатили» закрывается списком актов, а не разговором.</p></div>`;

SC.payroll=()=>{const tot=STAFF.reduce((a,e)=>a+e.sal+e.piece,0);
 return `<div class="head"><div><h2>Начисления за сентябрь</h2><p>Оклад плюс сдельная часть по закрытым актам. Сумма попадает в расходы и в себестоимость услуг.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:760px">
  <thead><tr><th>Сотрудник</th><th>Должность</th><th class="right">Оклад</th><th class="right">Сдельная часть</th><th class="right">Итого</th><th>Основание</th></tr></thead><tbody>
  ${STAFF.map(e=>`<tr><td><b>${esc(e.n)}</b></td><td class="mini">${esc(e.p)}</td>
   <td class="right mono">${fmt(e.sal)} ₸</td><td class="right mono">${e.piece?fmt(e.piece)+' ₸':'—'}</td>
   <td class="right mono"><b>${fmt(e.sal+e.piece)} ₸</b></td>
   <td class="mini">${e.jobs?e.jobs+' закрытых работ':'оклад'}</td></tr>`).join('')}
  <tr><td><b>Итого к выплате</b></td><td></td>
   <td class="right mono"><b>${fmt(STAFF.reduce((a,e)=>a+e.sal,0))} ₸</b></td>
   <td class="right mono"><b>${fmt(STAFF.reduce((a,e)=>a+e.piece,0))} ₸</b></td>
   <td class="right mono"><b>${fmt(tot)} ₸</b></td><td></td></tr>
 </tbody></table></div></div>
 <div class="hint">Сдельная часть считается автоматически: процент от суммы закрытых актов по каждому инженеру. Пока акт не подписан клиентом — начисления нет, поэтому у инженера есть прямой интерес довести работу до документа.</div>`};

SC.docs=()=>`
 <div class="head"><div><h2>Документы</h2><p>Счета, акты, накладные, КП и договоры формируются из данных системы. Печатные формы настраиваются под ваш бланк.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Печатные формы под ваши бланки: логотип, реквизиты, подписи и печать. Отправка клиенту ссылкой, PDF или в WhatsApp прямо из карточки.')">Печатные формы</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:760px">
  <thead><tr><th>Документ</th><th>Тип</th><th>Контрагент</th><th>Дата</th><th class="right">Сумма</th></tr></thead><tbody>
  ${DOCS.map(d=>`<tr onclick="toast('Документ открывается в печатной форме и уходит клиенту одной кнопкой. Он же связан с продажей, заявкой или договором — искать в папках не нужно.')">
   <td><b>${esc(d.n)}</b></td><td><span class="badge b">${esc(d.t)}</span></td>
   <td>${esc(d.cl)}</td><td class="mono">${d.d}</td>
   <td class="right mono">${d.sum?fmt(d.sum)+' ₸':'—'}</td></tr>`).join('')}
 </tbody></table></div></div>`;

SC.reports=()=>`
 <div class="head"><div><h2>Отчёты</h2><p>Любой срез с фильтрами по периоду, клиенту, объекту, направлению и сотруднику. Выгрузка в Excel одной кнопкой.</p></div></div>
 <div class="g3">
  ${[['Прибыль по клиентам','Кто из клиентов приносит деньги, а кто съедает время'],
     ['Прибыль по направлениям','Рентабельность вентиляции, холода, электрики, сигнализации'],
     ['Движение по складу','Приход, расход и остатки за период по каждой позиции'],
     ['Дебиторская задолженность','Долги с разбивкой по срокам: до 7, 8–30, свыше 30 дней'],
     ['Выработка сотрудников','Работы, выручка и качество по каждому инженеру'],
     ['Доходы и расходы по статьям','Управленческий отчёт о прибылях и убытках']].map(([n,d])=>
   `<div class="panel" style="cursor:pointer" onclick="toast('Отчёт «${esc(n)}» строится по текущим фильтрам и выгружается в Excel. Можно поставить на расписание — приходит на почту каждый понедельник.')">
    <b>${esc(n)}</b><p class="mini" style="margin-top:5px">${esc(d)}</p>
    <div class="btns" style="margin-top:9px"><button class="btn">Построить</button><button class="btn">В Excel</button></div></div>`).join('')}
 </div>
 <div class="note" style="--tone:var(--wheat)"><b>Отчёты на расписании</b><p>Сводка за неделю приходит руководителю в WhatsApp сама: выручка, прибыль, долги, просроченные ТО. Не нужно заходить в систему, чтобы понять, как идут дела.</p></div>`;

/* --- Телефон инженера --- */
SC.mobile=()=>`
 <div class="g21">
  <div>
   <div class="panel"><b>Что делает инженер на объекте</b>
    <p class="mini" style="margin-top:6px">Он не звонит диспетчеру и не пишет в WhatsApp. Всё в телефоне: список выездов на день, что за оборудование на объекте, какие материалы взял, фото до и после, акт и подпись клиента прямо на экране.</p>
    <div class="kv" style="margin-top:9px"><span>Отметил материалы</span><b>списались со склада на эту заявку</b></div>
    <div class="kv"><span>Закрыл заявку актом</span><b>появилась выручка и счёт клиенту</b></div>
    <div class="kv"><span>Клиент расписался</span><b>акт ушёл в документы и в бухгалтерию</b></div>
    <div class="kv"><span>Работа засчитана</span><b>сдельная часть в его начислениях</b></div>
   </div>
   <div class="hint">Это тот самый узел, где сейчас теряются деньги: материал взяли — не списали, работу сделали — акт подписали через неделю, клиенту выставили с опозданием. Здесь всё закрывается на объекте за две минуты.</div>
  </div>
  <div class="phone">
   <div class="ph-top"><b>Мои выезды · 9 сентября</b><span class="badge a">3</span></div>
   <div class="ph">
    <div class="ph-title">10:00 · АгроТрейд KZ</div>
    <div class="ph-sub">Замена компрессора холодильной камеры<br>с. Байсерке, трасса А-3</div>
    <div class="btns" style="margin-top:8px"><button class="btn acc" onclick="toast('Инженер отмечает приезд — время фиксируется. Клиент видит статус «мастер на объекте» в своём кабинете.')">Я на объекте</button></div>
   </div>
   <div class="ph">
    <div class="ph-title">Материалы на заявку</div>
    <div class="kv" style="font-size:10px"><span>Компрессор SC18 · 1 шт</span><b>186 000 ₸</b></div>
    <div class="kv" style="font-size:10px"><span>Фреон R410a · 0,6 бал</span><b>38 400 ₸</b></div>
    <div class="btns" style="margin-top:8px"><button class="btn" onclick="toast('Списание со склада прямо с объекта: кладовщик видит движение сразу, остаток уменьшается, себестоимость заявки растёт. Никаких записок на бумаге.')">+ Добавить материал</button></div>
   </div>
   <div class="ph">
    <div class="ph-title">Закрыть работу</div>
    <div class="ph-sub">Фото до и после, что сделано, время работ. Акт формируется сам.</div>
    <div class="btns" style="margin-top:8px"><button class="btn g" onclick="sparks();toast('<b>Акт подписан на объекте.</b> Выручка 485 000 ₸ признана, материалы 224 400 ₸ списаны, инженеру начислена сдельная часть, клиенту сформирован счёт. Всё — одним нажатием, без возврата в офис.')">Подписать акт у клиента</button></div>
   </div>
  </div>
 </div>`;

SC.settings=()=>`
 <div class="head"><div><h2>Настройки и права</h2><p>Справочники, статьи, кассы и роли. Кто что видит — решаете вы, а не разработчик.</p></div></div>
 <div class="g11">
  <div class="panel"><b>Справочники</b>
   <div class="kv"><span>Направления и виды услуг</span><b>5 / 34</b></div>
   <div class="kv"><span>Номенклатура склада</span><b>${F.stockPos} позиций</b></div>
   <div class="kv"><span>Статьи доходов и расходов</span><b>${ART.length}</b></div>
   <div class="kv"><span>Кассы и банковские счета</span><b>3</b></div>
   <div class="kv"><span>Типы объектов и оборудования</span><b>12</b></div>
   <p class="mini" style="margin-top:7px">Справочники ведёте сами: новое направление услуг или статья расхода добавляется без обращения к разработчику.</p></div>
  <div class="panel" style="padding:0"><div style="padding:12px 14px 2px"><b>Роли и доступы</b></div>
   <div class="tw"><table class="data"><thead><tr><th>Роль</th><th>Видит</th><th>Прибыль и себестоимость</th></tr></thead><tbody>
   ${Object.entries(ROLES).map(([n,r])=>`<tr><td><b>${esc(n)}</b></td><td class="mini">${r.s.length} разделов</td>
    <td>${n==='Руководитель'?'<span class="badge g">да</span>':n==='Бухгалтер'?'<span class="badge a">частично</span>':'<span class="badge r">нет</span>'}</td></tr>`).join('')}
   </tbody></table></div></div>
 </div>
 <div class="hint">Себестоимость, маржа и зарплаты закрыты от всех, кроме руководителя. Инженер видит только свои заявки, кладовщик — только склад. Это настройка в интерфейсе, а не переписывание кода.</div>`;

/* ===== ИНФРАСТРУКТУРА ===== */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>
 `<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function enter(n){role=n;const r=ROLES[n];
 document.getElementById('gate').classList.add('hidden');
 document.getElementById('app').classList.remove('hidden');
 document.getElementById('rav').textContent=r.av;
 document.getElementById('rname').textContent=r.n;
 document.getElementById('rrole').textContent=r.r;
 const sel=document.getElementById('rsel');
 sel.innerHTML=Object.keys(ROLES).map(x=>`<option ${x===n?'selected':''}>${x}</option>`).join('');
 sel.onchange=()=>enter(sel.value);
 buildScope();
 if(!r.s.includes(cur))cur=r.s[0];
 buildNav();render();
 toast(`Роль <b>${n}</b> — так система выглядит у этого сотрудника. Разделы и данные ограничены его работой.`)}
function buildScope(){const s=document.getElementById('scopeSel');
 const opts=role==='Инженер на объекте'?[['my','Мои выезды на сегодня']]
  :[['all','Вся компания'],['ala','Алматы'],['ast','Астана'],['serv','Только услуги'],['equip','Только оборудование']];
 s.innerHTML=opts.map(o=>`<option value="${o[0]}" ${scope===o[0]?'selected':''}>${o[1]}</option>`).join('');
 if(role==='Инженер на объекте')scope='my';else if(!opts.some(o=>o[0]===scope))scope='all'}
function setScope(v){scope=v;render();
 toast(v==='all'?'Показана <b>вся компания</b>: объекты, склад, деньги.':'Данные отфильтрованы по выбранному срезу. Одна система — разные разрезы под разные задачи.')}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{
  const av=items.filter(i=>al.includes(i[0]));if(!av.length)return '';
  return `<div class="nav-g">${g}</div>`+av.map(i=>
   `<a class="${cur===i[0]?'on':''}" onclick="go('${i[0]}')"><i>${i[1]}</i>${i[2]}${i[3]?`<span class="b">${i[3]}</span>`:''}</a>`).join('')}).join('')}
const PREF={requests:'Диспетчер',calendar:'Диспетчер',maint:'Диспетчер',mobile:'Инженер на объекте',
 stock:'Кладовщик',moves:'Кладовщик',inv:'Кладовщик',purchase:'Кладовщик',suppliers:'Кладовщик',
 money:'Бухгалтер',invoices:'Бухгалтер',docs:'Бухгалтер',payroll:'Бухгалтер',
 clients:'Менеджер по клиентам',contracts:'Менеджер по клиентам',sales:'Менеджер по клиентам'};
const ownerOf=s=>(PREF[s]&&ROLES[PREF[s]].s.includes(s))?PREF[s]:(Object.entries(ROLES).find(([n,r])=>r.s.includes(s))||['Руководитель'])[0];
function go(s){if(!ROLES[role].s.includes(s))enter(ownerOf(s));
 cur=s;buildNav();render();document.getElementById('content').scrollTop=0;
 try{const u=new URL(location.href);u.searchParams.set('s',s);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function render(){document.getElementById('content').innerHTML=`<div class="screen">${SC[cur]?SC[cur]():'<p class="mini">Раздел в разработке.</p>'}</div>`;
 const t=TITLES[cur]||['',''];document.getElementById('ttl').textContent=t[0];document.getElementById('sub').textContent=t[1]}
function openD(t,s,tabs,body){document.getElementById('dt').textContent=t;document.getElementById('ds').textContent=s;
 document.getElementById('dtabs').innerHTML=(tabs||[]).map(x=>`<button class="dtab ${x[2]?'on':''}" onclick="${x[1]}">${x[0]}</button>`).join('');
 document.getElementById('db').innerHTML=body;document.getElementById('dbg').classList.add('show')}
function closeD(){document.getElementById('dbg').classList.remove('show')}
let tt;function toast(h){const el=document.getElementById('toast');el.innerHTML=h;el.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),6500)}
function sparks(){const c=['#1f5fa8','#2f7fd0','#c9761f','#2e9e5f','#ffffff','#7c5bd6'];
 for(let i=0;i<52;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2300)}}
function waPing(){toast('Каналы внутри системы: WhatsApp, выделенная почта и телефония. Заявка от клиента попадает в общую ленту и превращается в заказ-наряд — переписка остаётся в компании, а не в личном телефоне менеджера.')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';try{localStorage.setItem('orda-theme',theme)}catch(e){}applyTheme()}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark');
 const b=document.getElementById('themeBtn');if(b)b.textContent=theme==='dark'?'☀ Светлая':'◐ Тёмная'}
(function(){try{const t=localStorage.getItem('orda-theme');if(t)theme=t}catch(e){}
 const q=new URLSearchParams(location.search).get('theme');if(q)theme=q;applyTheme()})();

/* ===== СЦЕНАРИЙ ПОКАЗА ===== */
const TOUR=[
 ['Руководитель','dash','<b>Шаг 1.</b> Главная по разделу 4 ТЗ: выручка, расходы, прибыль, деньги, долги, склад, продажи, услуги и объекты. Период переключается одной кнопкой — все блоки пересчитываются вместе.',7000],
 ['Руководитель','chain','<b>Шаг 2.</b> Главный принцип вашего ТЗ. Нажмите «Продали оборудование» — и увидите, как одна операция сама меняет склад, деньги, дебиторку, себестоимость и прибыль. Двойного ввода нет.',8200],
 ['Менеджер по клиентам','clients','<b>Шаг 3.</b> Клиенты: объекты, договор, выручка и долг в одной строке. Итог по выручке совпадает с дашбордом — это один расчёт, а не три таблицы.',6800],
 ['Диспетчер','requests','<b>Шаг 4.</b> Заявки. Карточка тянется мышью. Перевод в «Закрыта актом» — та самая операция, которая создаёт выручку и списывает материалы.',7000],
 ['Инженер на объекте','mobile','<b>Шаг 5.</b> Телефон инженера: материалы списываются с объекта, акт подписывается у клиента. Тот узел, где сегодня теряются деньги и время.',7000],
 ['Кладовщик','stock','<b>Шаг 6.</b> Склад: остатки, минимумы, стоимость. Семь позиций ниже минимума — система сама предложит заказ поставщику.',6600],
 ['Кладовщик','inv','<b>Шаг 7.</b> Инвентаризация: расхождение 80 900 ₸ за месяц. Это почти миллион в год, который сейчас просто исчезает — материал взяли и не оформили.',7200],
 ['Кладовщик','purchase','<b>Шаг 8.</b> Закупки: заказ поставщику, приход на склад, оплата. Приход увеличивает склад и долг перед поставщиком одновременно.',6600],
 ['Бухгалтер','debt','<b>Шаг 9.</b> Задолженность в обе стороны: нам должны 5 340 000, мы должны 3 060 000. Просрочка видна сразу, акт сверки — за секунды.',7000],
 ['Руководитель','finance','<b>Шаг 10.</b> Финансы: услуги дают половину валовой прибыли при меньшей выручке. Без раздельного учёта этого не видно — и не понятно, куда расти.',7200],
 ['Руководитель','cashflow','<b>Шаг 11.</b> Cash Flow и план/факт по месяцам. Кассовый разрыв виден заранее, а не в день платежа поставщику.',6800],
 ['Руководитель','dash','<b>Итог.</b> Один контур вместо Excel, мессенджеров и отдельных программ: от заявки клиента до прибыли на счёте. Дальше мы проходим по каждому экрану вместе с вами и правим под то, как работает именно ваша компания.',7600]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();
  toast('<b>Это демо-макет по вашему ТЗ версии 3.0.</b> На созвонах мы проходим по каждому экрану и правим под вашу компанию — из этого получается финальное техническое задание на разработку.');return}
 const [r,s,txt,ms]=TOUR[tourI++];
 if(role!==r)enter(r);
 setTimeout(()=>{go(s);toast(txt)},role!==r?380:0);
 tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');
 if(q&&SC[q]){enter(ownerOf(q));go(q)}})();
