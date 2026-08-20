/* CAPEX KZ · демо-система отдела продаж литейного завода. Данные вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const mln=n=>n>=1e6?(n/1e6).toFixed(2).replace('.',',').replace(/,?0+$/,'')+' млн ₸':fmt(n)+' ₸';

/* ================= РОЛИ И НАВИГАЦИЯ ================= */
const ROLES={
 'Собственник':{n:'Ербол Б.',av:'ЕБ',note:'Весь бизнес: деньги, загрузка, отчёты',s:['dash','deals','inbox','calc','kp','clients','tech','prod','stock','logi','price','reports','tasks','integr']},
 'Руководитель отдела продаж':{n:'Асанов Б.',av:'АБ',note:'План, сделки, КП и связь с производством',s:['dash','deals','inbox','calc','kp','clients','prod','stock','logi','price','reports','tasks']},
 'Менеджер по продажам':{n:'Настя К.',av:'НК',note:'Обращения, расчёты, КП и счета',s:['deals','inbox','calc','kp','clients','price','tasks']},
 'Технолог':{n:'Марат Ж.',av:'МЖ',note:'Чертежи, вес, себестоимость, подтверждение',s:['tech','calc','price','prod','deals']},
 'Производство':{n:'Цех · Шортанды',av:'ЦШ',note:'Подтверждение сроков, план цеха, готовность',s:['prod','tech','stock','tasks']},
 'Склад и логистика':{n:'Дамир С.',av:'ДС',note:'Приём с площадок, шоурум, отгрузки',s:['stock','logi','prod','tasks']},
 'Бухгалтер':{n:'Гульмира А.',av:'ГА',note:'Счета, оплаты, зеркало 1С',s:['kp','clients','integr','reports']}
};
const NAV=[
 ['ПУЛЬТ',[['dash','DSH','Командный центр']]],
 ['ПРОДАЖИ',[['deals','PIP','Воронка сделок'],['inbox','MSG','Обращения',3],['calc','CLC','Калькулятор литья'],['kp','DOC','КП и счета'],['clients','CRM','Клиенты']]],
 ['ПРОИЗВОДСТВО',[['tech','TCH','Технолог · чертежи',2],['prod','PRD','Производство'],['stock','WHS','Склад и шоурум'],['logi','LOG','Логистика']]],
 ['ДАННЫЕ',[['price','SKU','Номенклатура'],['reports','BI','Отчёты собственнику'],['tasks','TSK','Задачи'],['integr','API','1С и связи']]]
];
const TITLES={
 dash:['Командный центр','Что происходит с продажами, производством и деньгами прямо сейчас'],
 deals:['Воронка сделок','От обращения до отгрузки — каждый заказ виден на своей стадии'],
 inbox:['Обращения','WhatsApp, телефония и почта в одной очереди: фото деталей и чертежи сохраняются в сделке'],
 calc:['Калькулятор литья','Вес нетто и брутто, металл, формовка, механообработка, покраска и доставка — цена за 40 секунд'],
 kp:['КП и счета','Коммерческое предложение формируется из расчёта и уходит клиенту в WhatsApp'],
 clients:['Клиенты','История заказов, чертежи, оплаты и вся переписка по каждому контрагенту'],
 tech:['Технолог · чертежи','Заявки на расчёт, чертежи из образцов и подтверждение массы и технологии'],
 prod:['Производство','Заявка в цех, подтверждение срока и загрузка двух площадок'],
 stock:['Склад и шоурум','Готовая продукция, резервы под заказы и приёмка с производства'],
 logi:['Логистика','Доставка с площадок на склад и отгрузка клиенту'],
 price:['Номенклатура и прайсы','Изделия с весами, материалами, себестоимостью и тремя уровнями цен'],
 reports:['Отчёты собственнику','Оборот, средний чек, доходность по проектам и работа менеджеров'],
 tasks:['Задачи','Внутренние поручения, сроки и ответственные'],
 integr:['1С и связи','Двусторонний обмен с 1С 8.3, WhatsApp, телефония и права доступа']
};
let role='Собственник',cur='dash';

/* ================= СПРАВОЧНИКИ ЛИТЬЯ ================= */
const MAT={
 'СЧ20':{name:'Чугун СЧ20',price:520,k:1.28,note:'ограждения, скамьи, урны, люки'},
 'ВЧ50':{name:'Высокопрочный ВЧ50',price:690,k:1.35,note:'люки, нагруженные детали'},
 '35Л':{name:'Сталь 35Л',price:610,k:1.42,note:'машиностроение, корпуса'},
 '110Г13Л':{name:'Сталь 110Г13Л',price:1150,k:1.45,note:'зубья, футеровка, износ'},
 'АК7':{name:'Алюминий АК7',price:1290,k:1.22,note:'лёгкие детали, декор'}
};
const TECHS={
 'ПГС':{name:'ПГС · Шортанды',rate:210,km:100,trip:45000,note:'песчано-глинистая смесь, крупное литьё'},
 'ЛГМ':{name:'ЛГМ · площадка 10 км',rate:265,km:10,trip:12000,note:'по газифицируемым моделям, высокая точность'}
};
const HARD={'Простая':1,'Средняя':1.18,'Сложная':1.42};
const RATE_MACH=6800, RATE_PAINT=620, RATE_ASSY=18000, RATE_LOAD=8000, NDS=0.12;

const SKU=[
 ['ART-102','Скамья «Лайт»','Художественное литьё','СЧ20',44,'ПГС','Сложная',245000,3,1,'скамья'],
 ['ART-101','Скамья «Классика»','Художественное литьё','СЧ20',52,'ПГС','Сложная',268000,2,1,'скамья'],
 ['ART-110','Велостоянка 720-550','Художественное литьё','СЧ20',26,'ПГС','Средняя',91200,6,0,'велостоянка'],
 ['ART-120','Урна «Астана»','Художественное литьё','СЧ20',38,'ПГС','Сложная',128000,4,0,'урна'],
 ['ART-130','Ограждение перильное 2000×900','Художественное литьё','СЧ20',96,'ПГС','Сложная',245000,0,0,'ограждение'],
 ['ART-131','Ограждение мостовое, секция','Художественное литьё','СЧ20',128,'ПГС','Сложная',312000,0,0,'ограждение'],
 ['ART-140','Решётка приствольная 1200×1200','Художественное литьё','СЧ20',92,'ПГС','Средняя',196000,2,0,'решётка'],
 ['ART-150','Люк канализационный тип Т','Художественное литьё','ВЧ50',118,'ПГС','Средняя',148000,8,0,'люк'],
 ['ART-155','Дождеприёмник ДБ','Художественное литьё','СЧ20',74,'ПГС','Средняя',96000,5,0,'решётка'],
 ['ART-160','Боллард парковочный','Художественное литьё','СЧ20',42,'ЛГМ','Средняя',86000,7,0,'боллард'],
 ['MSH-201','Шестерня z=42 м8','Машиностроение','35Л',34,'ЛГМ','Сложная',214000,0,0,'шестерня'],
 ['MSH-210','Звёздочка приводная','Машиностроение','110Г13Л',18,'ЛГМ','Средняя',168000,1,0,'звёздочка'],
 ['MSH-220','Зуб ковша экскаватора','Машиностроение','110Г13Л',26,'ЛГМ','Средняя',122000,12,0,'зуб'],
 ['MSH-230','Футеровочная плита бетоносмесителя','Машиностроение','110Г13Л',48,'ПГС','Средняя',186000,4,0,'плита'],
 ['MSH-240','Колосник котла','Машиностроение','СЧ20',22,'ПГС','Простая',42000,26,0,'колосник'],
 ['MSH-250','Лопатка бетоносмесителя','Машиностроение','110Г13Л',12,'ЛГМ','Средняя',68000,9,0,'лопатка'],
 ['MSH-260','Корпус подшипника','Машиностроение','СЧ20',28,'ЛГМ','Средняя',74000,3,0,'корпус'],
 ['MSH-270','Клиновой замок опалубки','Машиностроение','35Л',3.2,'ЛГМ','Простая',12400,140,0,'замок']
].map(r=>({code:r[0],name:r[1],cat:r[2],mat:r[3],mass:r[4],tech:r[5],hard:r[6],price:r[7],stock:r[8],assy:r[9],icon:r[10]}));

/* ================= СДЕЛКИ ================= */
const STAGES=[['Новое обращение','var(--blue)'],['Квалификация','#5b87a8'],['Расчёт технолога','var(--violet)'],['КП отправлено','var(--gold)'],['Согласование','#b8811f'],['Счёт и оплата','#8a6d3b'],['В производстве','var(--molten)'],['Готово · склад','#4a7f8f'],['Отгружено','var(--green)']];
let DEALS=[
 {id:1204,cl:'ТОО «ЖайлыАктау»',st:3,sum:336200,mgr:'Настя',src:'WhatsApp',items:[['Скамья «Лайт»',245000,1],['Велостоянка 720-550',91200,1]],note:'КП0050 отправлено, ждём ответ до 17.08',next:'Позвонить по КП0050 · сегодня 16:00',files:['КП0050 от 11.08.2026'],city:'Актау',hot:0,due:'ok',
  log:[['WA','Запросили благоустройство сквера: скамьи и велопарковка','11.08 09:20'],['DOC','Сформировано КП0050 на 336 200 ₸','11.08 11:40'],['WA','КП отправлено в WhatsApp, доставлено','11.08 11:42']]},
 {id:1210,cl:'ТОО «Астана Групп Строй»',st:6,sum:4260000,mgr:'Настя',src:'Тендер',items:[['Ограждение мостовое, секция',312000,12],['Решётка приствольная 1200×1200',196000,3]],note:'Аванс 50% получен, литьё в Шортандах',next:'Контроль сроков цеха · 22.08',files:['Договор №14-08','Счёт СФ-0212','Чертёж ограждения.pdf'],city:'Астана',hot:0,due:'ok',
  log:[['1C','Аванс 2 130 000 ₸ поступил','14.08 15:10'],['PRD','Цех Шортанды подтвердил срок: 12 секций к 05.09','13.08 10:30']]},
 {id:1217,cl:'ТОО «КазБетонМикс»',st:2,sum:0,mgr:'Настя',src:'WhatsApp',items:[],note:'Фото сломанной лопатки, чертежа нет — технолог снимает размеры',next:'Технолог: обмер образца · сегодня',files:['Фото детали 1.jpg','Фото детали 2.jpg'],city:'Астана',hot:1,due:'over',
  log:[['WA','Прислали фото лопатки бетоносмесителя со сколом','сегодня 09:12'],['TCH','Заявка технологу на обмер и расчёт','сегодня 09:18']]},
 {id:1219,cl:'ИП Сатыбалдиев · агротехника',st:0,sum:0,mgr:'—',src:'WhatsApp',items:[],note:'Новое обращение, не разобрано',next:'Ответить и квалифицировать',files:['Фото звёздочки.jpg'],city:'Кокшетау',hot:1,due:'ok',sla:412,
  log:[['WA','«Можете отлить звёздочку, зубья съело»','сегодня 10:41']]},
 {id:1220,cl:'ТОО «Караганда Комфорт»',st:0,sum:0,mgr:'—',src:'Звонок',items:[],note:'Звонок с сайта, интересуют урны и скамьи для парка',next:'Перезвонить и выяснить объём',files:[],city:'Караганда',hot:0,due:'ok',sla:96,
  log:[['CALL','Входящий звонок 2 мин 14 с · запись сохранена','сегодня 10:58']]},
 {id:1215,cl:'Акимат г. Степногорск',st:4,sum:2940000,mgr:'Асанов',src:'Тендер',items:[['Ограждение перильное 2000×900',245000,12]],note:'Проходим согласование, просят снизить на 5%',next:'Ответ по цене · завтра до 12:00',files:['КП0047.pdf','Спецификация.xlsx'],city:'Степногорск',hot:0,due:'over',
  log:[['DOC','КП0047 на 2 940 000 ₸','08.08 14:20'],['NOTE','Просят скидку 5% — считаем при объёме 12 секций','18.08 16:05']]},
 {id:1212,cl:'ТОО «ГорСвет Астана»',st:5,sum:1184000,mgr:'Настя',src:'Рекомендация',items:[['Люк канализационный тип Т',148000,8]],note:'Счёт выставлен, ждём оплату',next:'Напомнить об оплате · 21.08',files:['Счёт СФ-0216'],city:'Астана',hot:0,due:'ok',
  log:[['1C','Счёт СФ-0216 создан в 1С','19.08 11:00']]},
 {id:1208,cl:'ТОО «Темир Транс»',st:7,sum:1464000,mgr:'Асанов',src:'WhatsApp',items:[['Зуб ковша экскаватора',122000,12]],note:'Отлито, лежит на складе, ждёт самовывоз',next:'Согласовать дату вывоза',files:['Акт приёмки'],city:'Астана',hot:0,due:'ok',
  log:[['WHS','Принято на склад с площадки ЛГМ · 12 шт','19.08 14:30']]},
 {id:1201,cl:'ТОО «Нур Парк»',st:8,sum:1908000,mgr:'Настя',src:'Тендер',items:[['Урна «Астана»',128000,9],['Скамья «Классика»',268000,3]],note:'Отгружено полностью, закрывающие в 1С',next:'Запросить отзыв и повторный заказ',files:['Накладная №212','Акт'],city:'Астана',hot:0,due:'ok',
  log:[['LOG','Отгружено 9 урн и 3 скамьи, накладная в 1С','15.08 12:00']]},
 {id:1218,cl:'ТОО «Стройка Плюс»',st:1,sum:0,mgr:'Настя',src:'Почта',items:[],note:'Запросили прайс на болларды, уточняем объём',next:'Уточнить количество и адрес объекта',files:[],city:'Астана',hot:0,due:'ok',
  log:[['MAIL','Письмо: запрос прайса на болларды','вчера 17:20']]}
];
let seq=1221;

/* ================= ЧАТЫ ================= */
const CONV=[
 {n:'ИП Сатыбалдиев',ch:'WHATSAPP · +7 701 245 88 10',t:'10:41',p:'Можете отлить звёздочку? Зубья съело',deal:1219,new:1,
  m:[['in','Здравствуйте! Нашёл вас по литью. Можете отлить звёздочку на комбайн? Зубья съело полностью, чертежа нет.','10:41'],
     ['in','',/*file*/'10:42','Фото звёздочки.jpg','ФОТО ДЕТАЛИ']]},
 {n:'ТОО «КазБетонМикс»',ch:'WHATSAPP · +7 700 118 42 06',t:'09:12',p:'Лопатка со сколом, нужно 9 штук',deal:1217,new:1,
  m:[['in','Добрый день. Лопатка бетоносмесителя сломалась, нужно 9 штук. Чертежа нет, есть образец.','09:12'],
     ['in','','09:13','Фото детали 1.jpg','СКОЛ · ЛОПАТКА'],
     ['out','Здравствуйте! Привезите образец на склад — технолог снимет размеры сегодня же и мы посчитаем. Или пришлите фото с рулеткой по длине и посадочному отверстию.','09:16'],
     ['in','Хорошо, привезём после обеда. Из чего льёте? Прошлые быстро стирались.','09:22'],
     ['out','Предложим 110Г13Л — высокомарганцовистая сталь, она наклёпывается под ударом и держит абразив заметно дольше обычной стали.','09:25']]},
 {n:'ТОО «ЖайлыАктау»',ch:'WHATSAPP · +7 771 900 55 21',t:'вчера',p:'Получили КП, обсуждаем с заказчиком',deal:1204,new:0,
  m:[['in','Здравствуйте! Нужны скамьи и велопарковка на сквер в Актау. Что можете предложить?','11.08 09:20'],
     ['out','Добрый день! Пришлю варианты: скамья «Классика» и «Лайт», велостоянка 720-550. Всё чугун СЧ20, порошковая покраска.','11.08 09:34'],
     ['out','','11.08 11:42','КП0050 от 11.08.2026.pdf','КП · 336 200 ₸'],
     ['in','Получили КП, обсуждаем с заказчиком. Доставку до Актау посчитаете?','вчера 16:10']]},
 {n:'ТОО «Астана Групп Строй»',ch:'WHATSAPP · +7 702 330 77 04',t:'вчера',p:'Когда будут первые секции?',deal:1210,new:0,
  m:[['in','Когда будут первые секции ограждения? Объект торопит.','вчера 14:02'],
     ['out','Цех подтвердил: первые 4 секции — 28.08, остальные 8 — к 05.09. Как только выйдут из формовки, пришлю фото.','вчера 14:20']]},
 {n:'ТОО «Караганда Комфорт»',ch:'ТЕЛЕФОНИЯ · входящий 02:14',t:'10:58',p:'Запись звонка · урны и скамьи для парка',deal:1220,new:1,
  m:[['in','[Запись разговора 02:14] Интересуют урны и скамьи для городского парка, примерно 20 урн и 8 скамей. Просят прайс и сроки.','10:58']]}
];

/* ================= ПРОИЗВОДСТВО ================= */
const PROD=[
 {id:'ПЗ-0142',deal:1210,cl:'Астана Групп Строй',item:'Ограждение мостовое · 12 секций',site:'ПГС',mass:1536,st:'Формовка',conf:1,due:'05.09',start:2,len:34,tone:'var(--molten)',prog:38},
 {id:'ПЗ-0139',deal:1212,cl:'ГорСвет Астана',item:'Люк тип Т · 8 шт',site:'ПГС',mass:944,st:'Плавка',conf:1,due:'27.08',start:0,len:19,tone:'#b8811f',prog:62},
 {id:'ПЗ-0145',deal:1215,cl:'Акимат Степногорск',item:'Ограждение перильное · 12 секций',site:'ПГС',mass:1152,st:'Ожидает подтверждения',conf:0,due:'—',start:14,len:30,tone:'#7a8798',prog:0},
 {id:'ПЗ-0141',deal:1208,cl:'Темир Транс',item:'Зуб ковша · 12 шт',site:'ЛГМ',mass:312,st:'Готово · на складе',conf:1,due:'19.08',start:0,len:11,tone:'var(--green)',prog:100},
 {id:'ПЗ-0146',deal:1217,cl:'КазБетонМикс',item:'Лопатка · 9 шт (расчёт)',site:'ЛГМ',mass:108,st:'Ждёт чертёж технолога',conf:0,due:'—',start:9,len:14,tone:'var(--violet)',prog:0},
 {id:'ПЗ-0138',deal:1201,cl:'Нур Парк',item:'Урна · 9 шт, скамья · 3 шт',site:'ПГС',mass:498,st:'Отгружено',conf:1,due:'15.08',start:0,len:8,tone:'#4a7f8f',prog:100}
];

/* ================= ОЧЕРЕДЬ ТЕХНОЛОГА (КАНБАН) ================= */
const TSTAGES=[['Заявка на расчёт','var(--blue)'],['Обмер · образец','var(--molten)'],['Чертёж AutoCAD','var(--violet)'],['Масса и технология','var(--gold)'],['Подтверждено','var(--green)']];
let TECHQ=[
 {id:'ТР-015',deal:1219,cl:'ИП Сатыбалдиев',item:'Звёздочка приводная',qty:2,ts:0,who:'Марат Ж.',due:'сегодня',files:['Фото звёздочки.jpg'],note:'Чертежа нет, нужен второй элемент пары для замера шага',mass:null,mat:'110Г13Л',tech:'ЛГМ',hot:1},
 {id:'ТР-014',deal:1217,cl:'ТОО «КазБетонМикс»',item:'Лопатка бетоносмесителя',qty:9,ts:1,who:'Марат Ж.',due:'сегодня 15:00',files:['Фото детали 1.jpg','Фото детали 2.jpg'],note:'Образец привезут после обеда, снимаем размеры',mass:null,mat:'110Г13Л',tech:'ЛГМ',hot:1},
 {id:'ТР-016',deal:1220,cl:'ТОО «Караганда Комфорт»',item:'Урна «Астана», скамья «Классика»',qty:28,ts:3,who:'Марат Ж.',due:'21.08',files:[],note:'Каталожные позиции, модели в оснастке — считаем только объём',mass:38,mat:'СЧ20',tech:'ПГС',hot:0},
 {id:'ТР-013',deal:1218,cl:'ТОО «Стройка Плюс»',item:'Боллард парковочный',qty:6,ts:2,who:'Марат Ж.',due:'22.08',files:['Эскиз заказчика.pdf'],note:'Свой эскиз клиента — переводим в чертёж под ЛГМ',mass:42,mat:'СЧ20',tech:'ЛГМ',hot:0},
 {id:'ТР-012',deal:1215,cl:'Акимат г. Степногорск',item:'Ограждение перильное 2000×900',qty:12,ts:4,who:'Марат Ж.',due:'подтверждено 18.08',files:['Чертёж ограждения.dwg'],note:'Модель в оснастке, повторный заказ — оснастку не считаем',mass:96,mat:'СЧ20',tech:'ПГС',hot:0},
 {id:'ТР-011',deal:1204,cl:'ТОО «ЖайлыАктау»',item:'Скамья «Лайт», велостоянка',qty:2,ts:4,who:'Марат Ж.',due:'подтверждено 11.08',files:[],note:'Каталог, массы подтверждены',mass:44,mat:'СЧ20',tech:'ПГС',hot:0}
];
const techOf=id=>TECHQ.find(t=>t.deal===id);
const prodOf=id=>PROD.find(p=>p.deal===id);

/* ================= ДЕБИТОРКА ================= */
const DEBT=[
 {cl:'ТОО «ГорСвет Астана»',doc:'СФ-0216',sum:1184000,days:2,mgr:'Настя',deal:1212,note:'Счёт выставлен 19.08, обещали оплату в пятницу'},
 {cl:'ТОО «Темир Транс»',doc:'СФ-0208',sum:732000,days:11,mgr:'Асанов',deal:1208,note:'Вторая половина по факту готовности, товар на складе'},
 {cl:'ТОО «Нур Парк»',doc:'СФ-0201',sum:458000,days:26,mgr:'Настя',deal:1201,note:'Отгружено 15.08, остаток по договору 30 дней'},
 {cl:'ТОО «КазБетонМикс»',doc:'СФ-0194',sum:286000,days:38,mgr:'Настя',deal:null,note:'Просрочка: переносят оплату второй раз'},
 {cl:'ТОО «Стройка Плюс»',doc:'СФ-0188',sum:164000,days:54,mgr:'Асанов',deal:null,note:'Просрочка: нужен звонок руководителя'}
];

/* ================= ЗАДАЧИ ================= */
const TCOLS=[['Новые','var(--blue)'],['В работе','var(--molten)'],['На проверке','var(--violet)'],['Готово','var(--green)']];
const PEOPLE=['Ербол Б.','Асанов Б.','Настя К.','Марат Ж.','Дамир С.','Гульмира А.','Цех Шортанды'];
let TASKS=[
 {id:101,t:'Обмерить образец лопатки КазБетонМикс',who:'Марат Ж.',col:1,due:'сегодня 15:00',pr:'high',prog:40,deal:1217,
  sub:[['Дождаться образца',1],['Снять размеры',0],['Внести массу в номенклатуру',0]],
  chat:[['Настя К.','Клиент везёт образец после обеда, нужно 9 штук','09:22'],['Марат Ж.','Принято, освобожу стол к 15:00','09:40']]},
 {id:102,t:'Ответить Акимату Степногорска по скидке 5%',who:'Асанов Б.',col:1,due:'завтра 12:00',pr:'high',prog:60,deal:1215,
  sub:[['Пересчитать при объёме 12 секций',1],['Согласовать с Ерболом',0]],
  chat:[['Ербол Б.','Маржа там 22,4%, пять процентов не даём. Предложи объём или отсрочку','18.08 17:10'],['Асанов Б.','Понял, готовлю вариант с увеличением до 14 секций','18.08 17:25']]},
 {id:103,t:'Позвонить ЖайлыАктау по КП0050',who:'Настя К.',col:0,due:'сегодня 16:00',pr:'mid',prog:0,deal:1204,
  sub:[['Уточнить решение по скамьям',0],['Посчитать доставку до Актау',0]],
  chat:[['Настя К.','Просили посчитать доставку — 2 100 км, беру фуру до 5 тонн','вчера 16:15']]},
 {id:104,t:'Согласовать дату вывоза с Темир Транс',who:'Дамир С.',col:1,due:'сегодня',pr:'mid',prog:50,deal:1208,
  sub:[['Связаться с логистом клиента',1],['Забронировать погрузчик',0]],
  chat:[['Дамир С.','12 зубьев готовы, лежат в третьем пролёте','вчера 15:02']]},
 {id:105,t:'Загрузить фото готовых секций в сделку',who:'Цех Шортанды',col:0,due:'28.08',pr:'low',prog:0,deal:1210,
  sub:[['Снять после обрубки',0],['Приложить к заявке ПЗ-0142',0]],
  chat:[['Асанов Б.','Клиент просит фото до отгрузки, это снимет половину звонков','вчера 14:22']]},
 {id:106,t:'Проверить остатки чугуна на следующую неделю',who:'Цех Шортанды',col:2,due:'21.08',pr:'mid',prog:85,deal:null,
  sub:[['Пересчитать шихту',1],['Заказать недостающее',1],['Подтвердить объём Ерболу',0]],
  chat:[['Цех Шортанды','По СЧ20 хватает на две недели, ВЧ50 нужно докупить','вчера 11:40']]},
 {id:107,t:'Выставить счёт ГорСвет Астана',who:'Гульмира А.',col:3,due:'19.08',pr:'mid',prog:100,deal:1212,
  sub:[['Проверить реквизиты',1],['Создать счёт в 1С',1],['Отправить клиенту',1]],
  chat:[['Гульмира А.','Счёт СФ-0216 выставлен и отправлен','19.08 11:05']]},
 {id:108,t:'Перенести прайс на болларды в номенклатуру',who:'Марат Ж.',col:3,due:'18.08',pr:'low',prog:100,deal:null,
  sub:[['Свести массы',1],['Проставить цены',1]],
  chat:[['Марат Ж.','Готово, шесть позиций добавлены','18.08 16:30']]}
];
let taskSeq=109;

/* ================= КАЛЬКУЛЯТОР ================= */
let C={sku:'MSH-250',name:'Лопатка бетоносмесителя',mat:'110Г13Л',tech:'ЛГМ',hard:'Средняя',mass:12,qty:9,mach:0.6,paint:0,assy:0,tooling:1,toolCost:180000,deliver:1,km:24,margin:28};
function calc(){
 const m=MAT[C.mat],t=TECHS[C.tech],h=HARD[C.hard];
 const brutto=C.mass*m.k;
 const metal=brutto*m.price*C.qty;
 const mould=brutto*t.rate*h*C.qty;
 const tool=C.tooling?C.toolCost:0;
 const mach=C.mach*RATE_MACH*C.qty;
 const paint=C.paint?C.mass*RATE_PAINT*C.qty:0;
 const assy=C.assy?RATE_ASSY*C.qty:0;
 const trip=t.trip;
 const load=Math.max(1,C.mass*C.qty/1000)*RATE_LOAD;
 const deliv=C.deliver?C.km*350:0;
 const cost=metal+mould+tool+mach+paint+assy+trip+load+deliv;
 const price=cost*(1+C.margin/100);
 const nds=price*NDS;
 return{brutto:brutto*C.qty,netto:C.mass*C.qty,metal,mould,tool,mach,paint,assy,trip,load,deliv,cost,price,nds,total:price+nds,unit:(price+nds)/C.qty,marginSum:price-cost,marginPct:(price-cost)/price*100};
}

/* ================= РЕНДЕР ЭКРАНОВ ================= */
const SC={};

SC.dash=()=>{
 const inWork=DEALS.filter(d=>d.st>=3&&d.st<8),sum=inWork.reduce((a,d)=>a+d.sum,0);
 return `
 <div class="head"><div><h2>Командный центр</h2><p>Один экран для собственника: где деньги, что в цеху, кто не отвечает клиенту. Все цифры — из живых сделок и обмена с 1С.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Сводка за день отправлена вам в WhatsApp.')">Сводка в WhatsApp</button><button class="btn gold" onclick="go('reports')">Полные отчёты</button></div></div>
 <div class="strip">
  <div><small>В РАБОТЕ · ПОДТВЕРЖДЁННЫЕ ЗАКАЗЫ</small><b>${mln(sum)}</b><span>${inWork.length} заказов от КП до отгрузки</span></div>
  <div><small>ОТГРУЖЕНО В АВГУСТЕ</small><b>7,4 млн ₸</b><span class="good">▲ 22% к июлю</span></div>
  <div><small>ЖДЁТ ОПЛАТЫ</small><b class="warn">1,18 млн ₸</b><span>1 счёт · 2 дня</span></div>
  <div><small>ЗАГРУЗКА ЦЕХОВ</small><b>78%</b><span>ПГС 86% · ЛГМ 64%</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ КЛИЕНТУ</small><b>11 мин</b><span class="good">норма до 30</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Воронка в деньгах · август</div><div class="ph-sub">сколько денег стоит на каждой стадии и где оно застревает</div></div><span class="tag gold">10 сделок</span></div>
   ${STAGES.map((s,i)=>{const d=DEALS.filter(x=>x.st===i),v=d.reduce((a,x)=>a+x.sum,0);const w=Math.max(4,v/5000000*100);
    return `<div class="funnel-row"><span>${s[0]}</span><div class="ftrack"><i style="--w:${w}%"></i></div><b>${v?mln(v):d.length+' шт'}</b></div>`}).join('')}
   <div class="hint"><b>Что видит собственник:</b> 2,94 млн ₸ стоят на согласовании у Акимата вторые сутки — система подсветила просрочку и поставила задачу РОПу ответить по цене до 12:00.</div>
  </div>
  <div class="panel dark"><div class="ph"><div><div class="ph-title">Требуют решения</div><div class="ph-sub">система собрала отклонения по правилам</div></div><span class="tag red">4</span></div>
   ${[['var(--red)','2 обращения без ответа','ИП Сатыбалдиев и Караганда Комфорт · 6 и 12 мин','inbox'],
      ['var(--molten)','Акимат ждёт ответ по скидке','2,94 млн ₸ · срок истекает завтра в 12:00','deals'],
      ['var(--gold)','Цех не подтвердил срок','ПЗ-0145 перильное ограждение · висит 2 дня','prod'],
      ['var(--blue)','Счёт не оплачен 2 дня','ГорСвет Астана · 1 184 000 ₸','kp']]
     .map(s=>`<div style="border-left:3px solid ${s[0]};background:#25334a;padding:9px 10px;margin-bottom:6px;cursor:pointer" onclick="go('${s[3]}')"><b style="font-size:9.4px">${s[1]}</b><p style="font-size:7.8px;color:#8194a8;margin:4px 0 0;line-height:1.45">${s[2]}</p></div>`).join('')}
   <div style="border-top:1px solid #33425a;margin-top:11px;padding-top:11px"><div class="ph-title" style="font-size:10px">Сквозной путь заказа</div>
    <p style="font-size:7.6px;color:#8194a8;line-height:1.6;margin:6px 0 0">Фото детали в WhatsApp → квалификация → технолог даёт вес и технологию → калькулятор считает цену → КП уходит клиенту → счёт в 1С → заявка в цех → приёмка на склад → отгрузка. Каждый шаг фиксируется: кто, когда, сколько.</p></div>
  </div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph"><div><div class="ph-title">Загрузка производства</div><div class="ph-sub">две площадки: ПГС в Шортандах и ЛГМ в 10 км</div></div><button class="btn" onclick="go('prod')">План цеха</button></div>
   <div class="load">
    ${[['ПГС · Шортанды (100 км)',86,'var(--molten)','4 заказа · 4,1 т'],['ЛГМ · площадка 10 км',64,'var(--green)','2 заказа · 0,4 т'],['Механообработка',52,'var(--blue)','участок свободен'],['Покраска порошком',71,'var(--gold)','очередь 2 дня']]
     .map(l=>`<div><div class="load-row"><b style="font-size:8.6px">${l[0]}</b><span class="mono" style="text-align:right;font-size:8.6px">${l[1]}%</span></div><div class="bar"><i style="--w:${l[1]}%;--tone:${l[2]}"></i></div><div class="mini" style="margin-top:3px">${l[3]}</div></div>`).join('')}
   </div>
   <div class="hint" style="margin-top:11px"><b>Зачем это продажам:</b> менеджер видит загрузку до того, как пообещал клиенту срок. Обещать «через неделю», когда ПГС занята на 86%, — потерять доверие.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Последние события</div><div class="ph-sub">лента по всем отделам, без переписок в WhatsApp</div></div><span class="tag green">live</span></div>
   ${[['WA','Новое обращение · ИП Сатыбалдиев','фото звёздочки, чертежа нет','10:41'],
      ['TCH','Технолог принял заявку на обмер','лопатка КазБетонМикс · 9 шт','09:18'],
      ['WHS','Приёмка с площадки ЛГМ','зуб ковша 12 шт · 312 кг','вчера 14:30'],
      ['1C','Аванс 2 130 000 ₸','Астана Групп Строй · зеркалирован в 1С','14.08'],
      ['DOC','КП0050 сформировано и отправлено','ЖайлыАктау · 336 200 ₸','11.08']]
    .map(a=>`<div style="display:flex;gap:9px;padding:8px 0;border-bottom:1px solid #ece7dd"><span class="mono" style="width:36px;height:30px;background:#eceadf;display:grid;place-items:center;font-size:6.8px;font-weight:700;flex:none">${a[0]}</span><div><b style="font-size:8.8px">${a[1]}</b><p style="font-size:7.6px;color:var(--muted);margin:3px 0">${a[2]}</p><time class="mono" style="font-size:6.6px;color:#95998f">${a[3]}</time></div></div>`).join('')}
  </div>
 </div>
 <div class="g3">
  <div class="panel"><div class="ph"><div><div class="ph-title">Средний чек</div><div class="ph-sub">по закрытым заказам, млн ₸</div></div><span class="tag green">▲ 21%</span></div>
   <div class="chart" style="height:116px">${[['мар',1.12],['апр',1.28],['май',1.41],['июн',1.52],['июл',1.53],['авг',1.84]].map(m=>`<div class="chart-col" title="${m[0]}: ${m[1]} млн ₸"><i style="--h:${Math.round(m[1]/2*100)}%;--p:0%"></i><span>${m[0]}</span></div>`).join('')}</div>
   <div class="kpi-mini"><div style="--tone:var(--gold)"><small>АВГУСТ</small><b>1,84 млн</b></div><div style="--tone:var(--blue)"><small>СРЕДНЕЕ ЗА ГОД</small><b>1,45 млн</b></div></div>
   <div class="hint" style="margin-top:9px"><b>Растёт за счёт комплектов:</b> когда берут не одну скамью, а благоустройство целиком — скамьи, урны и решётки вместе.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Позиций в заказе</div><div class="ph-sub">сколько наименований берут за раз</div></div><span class="tag gold">в среднем 3,4</span></div>
   ${[['1 позиция',9,22,'#b9b3a5'],['2–3 позиции',15,37,'var(--gold)'],['4–6 позиций',12,29,'var(--blue)'],['7 и больше',5,12,'var(--green)']]
     .map(r=>`<div class="funnel-row" style="grid-template-columns:78px 1fr 66px"><span>${r[0]}</span><div class="ftrack" style="height:16px"><i style="--w:${Math.round(r[1]/15*100)}%;background:${r[3]}"></i></div><b>${r[1]} зак · ${r[2]}%</b></div>`).join('')}
   <div class="kpi-mini"><div style="--tone:var(--green)"><small>ЧЕК ПРИ 4 И БОЛЬШЕ</small><b>2,6 млн</b></div><div style="--tone:#b9b3a5"><small>ПРИ ОДНОЙ ПОЗИЦИИ</small><b>0,7 млн</b></div></div>
   <div class="hint" style="margin-top:9px"><b>Вывод:</b> заказы от четырёх позиций дают чек втрое выше — менеджеру выгоднее предлагать комплект.</div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Топ менеджеров · август</div><div class="ph-sub">оборот, число КП и скорость ответа</div></div><span class="tag blue">3 человека</span></div>
   ${[['Настя К.',3960000,28,'11 мин',100,'var(--green)'],['Асанов Б.',3440000,21,'19 мин',87,'var(--gold)'],['Ербол Б. · личные',1180000,6,'6 мин',30,'var(--blue)']]
     .map((m,i)=>`<div style="display:grid;grid-template-columns:20px 1fr;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #ece7dd">
      <span class="mono" style="font-size:11px;font-weight:800;color:${i===0?'var(--gold2,#8b6428)':'var(--muted)'}">${i+1}</span>
      <div><div style="display:flex;justify-content:space-between;align-items:baseline;gap:6px"><b style="font-size:9px">${m[0]}</b><b class="mono" style="font-size:9px">${mln(m[1])}</b></div>
      <div class="bar" style="margin-top:4px"><i style="--w:${m[4]}%;--tone:${m[5]}"></i></div>
      <div class="mini" style="margin-top:3px">${m[2]} КП · ответ ${m[3]}</div></div></div>`).join('')}
   <div class="hint" style="margin-top:9px"><b>Честное сравнение:</b> считается не активность, а оборот, число КП и минуты до ответа клиенту.</div>
  </div>
 </div>
 <div class="panel"><div class="ph"><div><div class="ph-title">Дебиторская задолженность</div><div class="ph-sub">счета выставлены, деньги ещё не пришли · оплаты подтягиваются из 1С</div></div><span class="tag red">${mln(DEBT.reduce((a,d)=>a+d.sum,0))}</span></div>
  <div class="tw"><table class="data" style="min-width:680px"><thead><tr><th>Контрагент</th><th>Документ</th><th class="right">Сумма</th><th class="right">Дней</th><th>Состояние</th><th>Менеджер</th><th>Комментарий</th></tr></thead><tbody>
  ${DEBT.map(d=>`<tr onclick="debtCard('${esc(d.cl)}','${d.doc}',${d.sum},${d.days},'${esc(d.note)}',${d.deal||0})">
   <td><b>${esc(d.cl)}</b></td><td class="mono">${d.doc}</td><td class="right mono"><b>${fmt(d.sum)} ₸</b></td>
   <td class="right mono ${d.days>30?'bad':d.days>14?'warn':''}">${d.days}</td>
   <td><span class="tag ${d.days>30?'red':d.days>14?'gold':'green'}">${d.days>30?'просрочка':d.days>14?'на контроле':'в сроке'}</span></td>
   <td>${d.mgr}</td><td class="mini">${esc(d.note)}</td></tr>`).join('')}
  <tr style="background:#f7f4ed;cursor:default"><td><b>Итого</b></td><td></td><td class="right mono"><b>${fmt(DEBT.reduce((a,d)=>a+d.sum,0))} ₸</b></td><td colspan="4" class="mini">просрочено больше 30 дней — <b>${fmt(DEBT.filter(d=>d.days>30).reduce((a,d)=>a+d.sum,0))} ₸</b> у двух клиентов</td></tr>
  </tbody></table></div>
  <div class="hint" style="margin-top:11px"><b>Зачем это на главном экране:</b> просрочка дольше 30 дней сама ставит задачу менеджеру и попадает к вам. Деньги перестают теряться между отделом продаж и бухгалтерией.</div>
 </div>`;
};
function debtCard(cl,doc,sum,days,note,deal){openD(cl,`${doc} · ${fmt(sum)} ₸ · ${days} дней с даты выставления`,['Задолженность'],
 `<div class="dg"><div class="det"><small>СУММА</small><b>${fmt(sum)} ₸</b></div><div class="det"><small>ДНЕЙ С ВЫСТАВЛЕНИЯ</small><b class="${days>30?'bad':days>14?'warn':'good'}">${days}</b></div><div class="det"><small>ДОКУМЕНТ</small><b>${doc}</b></div><div class="det"><small>ИСТОЧНИК ДАННЫХ</small><b>1С · обмен 6 мин назад</b></div></div>
  <div class="note" style="--tone:${days>30?'var(--red)':'var(--gold)'}"><b>Комментарий менеджера</b><p>${esc(note)}</p></div>
  <div class="btns" style="margin-top:11px">
   <button class="btn" onclick="toast('Напоминание об оплате отправлено клиенту в WhatsApp вместе со счётом.')">Напомнить в WhatsApp</button>
   <button class="btn" onclick="closeD();go('tasks');toast('Задача создана: связаться по оплате ${esc(doc)}.')">Поставить задачу</button>
   ${deal?`<button class="btn dark" onclick="closeD();openDeal(${deal})">Открыть сделку</button>`:''}
  </div>`)}

SC.deals=()=>`
 <div class="head"><div><h2>Воронка сделок</h2><p>Стадии настроены под литейный цикл: от фото детали в WhatsApp до отгрузки со склада. Карточку можно перетащить мышкой — стадия и история изменятся.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Воронка выгружена в Excel: стадии, суммы, ответственные и сроки.')">Экспорт</button><button class="btn gold" onclick="newDeal()">+ Сделка</button></div></div>
 <div class="strip">
  <div><small>ВСЕГО В ВОРОНКЕ</small><b>${mln(DEALS.reduce((a,d)=>a+d.sum,0))}</b><span>${DEALS.length} сделок</span></div>
  <div><small>НОВЫХ СЕГОДНЯ</small><b>2</b><span>SLA ответа идёт</span></div>
  <div><small>ПРОСРОЧЕН ШАГ</small><b class="bad">2</b><span>требуют действия</span></div>
  <div><small>КОНВЕРСИЯ В ЗАКАЗ</small><b>38%</b><span class="good">цель 35%</span></div>
  <div><small>СРЕДНИЙ ЧЕК</small><b>1,84 млн ₸</b><span>по закрытым</span></div>
 </div>
 <div class="filters"><input class="search" id="dq" placeholder="Клиент, изделие, город, менеджер…" oninput="render()"><button class="filter on" onclick="fMgr(this,'all')">Все</button><button class="filter" onclick="fMgr(this,'Настя')">Настя</button><button class="filter" onclick="fMgr(this,'Асанов')">Асанов</button></div>
 <div class="board" id="board">${board()}</div>`;

let mgrF='all';
function fMgr(el,m){mgrF=m;el.parentElement.querySelectorAll('.filter').forEach(x=>x.classList.remove('on'));el.classList.add('on');document.getElementById('board').innerHTML=board()}
function board(){
 const q=(document.getElementById('dq')?.value||'').toLowerCase();
 const vis=DEALS.filter(d=>(mgrF==='all'||d.mgr===mgrF)&&`${d.cl} ${d.mgr} ${d.city} ${d.items.map(i=>i[0]).join(' ')}`.toLowerCase().includes(q));
 return STAGES.map((s,i)=>{const col=vis.filter(d=>d.st===i),tot=col.reduce((a,d)=>a+d.sum,0);
  return `<div class="col" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')" ondrop="this.classList.remove('dragover');drop(event,${i})">
   <div class="col-h"><b>${s[0]}</b><small>${col.length}</small></div><div class="col-sum">${tot?mln(tot):'—'}</div>
   ${col.map(d=>`<div class="card" draggable="true" style="--tone:${s[1]}" ondragstart="drag(event,${d.id})" ondragend="this.classList.remove('dragging')" onclick="openDeal(${d.id})">
     <div class="card-top"><b>${esc(d.cl)}</b><span class="card-sum">${d.sum?mln(d.sum):'—'}</span></div>
     ${d.items.length?`<div class="card-item">${esc(d.items.map(x=>x[0]+' × '+x[2]).join(' · '))}</div>`:`<div class="card-item muted">состав не собран</div>`}
     <div class="card-note ${d.due==='over'?'bad':''}">${d.due==='over'?'⚠ ':'▸ '}${esc(d.next)}</div>
     <div class="chips"><span class="chip">${esc(d.src)}</span><span class="chip">${esc(d.city)}</span>${(()=>{const t=techOf(d.id);return t?`<span class="chip ${t.ts===4?'ok':'wait'}">технолог: ${TSTAGES[t.ts][0].toLowerCase()}</span>`:''})()}${(()=>{const p=prodOf(d.id);return p?`<span class="chip ${p.prog===100?'ok':p.conf?'hot':'wait'}">цех: ${p.st.toLowerCase()}${p.conf&&p.prog<100?' '+p.prog+'%':''}</span>`:''})()}${d.files.length?`<span class="chip">${d.files.length} файл${d.files.length>1?'а':''}</span>`:''}</div>
     <div class="card-foot"><span class="who"><i>${d.mgr==='—'?'??':d.mgr.slice(0,2).toUpperCase()}</i>${d.mgr}</span>${d.st===0?`<span class="sla" data-sla="${d.id}">⏱ ${mmss(d.sla||0)}</span>`:''}</div>
    </div>`).join('')}
   ${i===0?'<button class="addc" onclick="newDeal()">+ Добавить</button>':''}
  </div>`}).join('');
}
const mmss=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
function drag(e,id){e.dataTransfer.setData('text/plain',id);e.target.classList.add('dragging')}
function drop(e,st){const id=+e.dataTransfer.getData('text/plain'),d=DEALS.find(x=>x.id===id);if(!d||d.st===st)return;
 const from=STAGES[d.st][0];d.st=st;d.log.unshift(['SYS',`Стадия: ${from} → ${STAGES[st][0]}`,'сейчас']);
 document.getElementById('board').innerHTML=board();
 if(st===8){sparks();toast(`✅ <b>${esc(d.cl)}</b> — отгружено. ${d.sum?mln(d.sum):''} закрыто, закрывающие уйдут в 1С.`)}
 else if(st===6){toast(`Заявка в цех создана автоматически: <b>${esc(d.cl)}</b>. Производство получило спецификацию и сроки.`)}
 else toast(`Сделка <b>${esc(d.cl)}</b> → «${STAGES[st][0]}».`)}
function newDeal(){const id=seq++;DEALS.unshift({id,cl:'Новое обращение',st:0,sum:0,mgr:'—',src:'WhatsApp',items:[],note:'Заполните клиента и запрос',next:'Квалифицировать',files:[],city:'Астана',hot:0,due:'ok',sla:0,log:[['SYS','Сделка создана вручную','сейчас']]});
 if(cur!=='deals')go('deals');else document.getElementById('board').innerHTML=board();openDeal(id);toast('Сделка создана. Отсчёт времени ответа клиенту уже пошёл.')}

/* ---- карточка сделки ---- */
let dOpen=null,dTab=0;
function openDeal(id,tab=0){const d=DEALS.find(x=>x.id===id);if(!d)return;dOpen=id;dTab=tab;
 const tabs=['Сводка','Переписка','Состав и расчёт','Производство','Файлы'];
 document.getElementById('dt').textContent=d.cl;
 document.getElementById('ds').textContent=`Сделка № ${d.id} · ${STAGES[d.st][0]} · ${d.mgr} · ${d.src} · ${d.city}`;
 document.getElementById('dtabs').innerHTML=tabs.map((t,i)=>`<button class="dtab ${i===tab?'on':''}" onclick="openDeal(${id},${i})">${t}</button>`).join('');
 document.getElementById('db').innerHTML=dealBody(d,tab);
 document.getElementById('dbg').classList.add('show')}
function orderState(d){const t=techOf(d.id),p=prodOf(d.id);
 return `<div class="panel" style="padding:11px;margin-bottom:11px;box-shadow:none">
  <div class="ph-title" style="font-size:11px;margin-bottom:8px">Состояние заказа</div>
  <div style="display:grid;grid-template-columns:96px 1fr 82px;gap:9px;align-items:center;padding:6px 0;border-bottom:1px solid #ece7dd">
   <b style="font-size:9px">Технолог</b>
   ${t?`<div class="bar"><i style="--w:${(t.ts+1)/5*100}%;--tone:${t.ts===4?'var(--green)':'var(--violet)'}"></i></div><span class="tag ${t.ts===4?'green':'violet'}">${TSTAGES[t.ts][0]}</span>`
      :`<div class="bar"><i style="--w:0%"></i></div><span class="tag">не заводился</span>`}
  </div>
  <div style="display:grid;grid-template-columns:96px 1fr 82px;gap:9px;align-items:center;padding:6px 0;border-bottom:1px solid #ece7dd">
   <b style="font-size:9px">Производство</b>
   ${p?`<div class="bar"><i style="--w:${p.prog}%;--tone:${p.tone}"></i></div><span class="tag ${p.prog===100?'green':p.conf?'molten':'red'}">${p.conf?p.st:'не подтверждён'}</span>`
      :`<div class="bar"><i style="--w:0%"></i></div><span class="tag">не передан</span>`}
  </div>
  <div style="display:grid;grid-template-columns:96px 1fr 82px;gap:9px;align-items:center;padding:6px 0">
   <b style="font-size:9px">Сделка</b>
   <div class="bar"><i style="--w:${(d.st+1)/9*100}%;--tone:var(--gold)"></i></div><span class="tag gold">${STAGES[d.st][0]}</span>
  </div>
  ${t&&t.ts<4?`<div class="mini" style="margin-top:7px">Цена может измениться: технолог ещё не подтвердил массу и технологию. Срок расчёта — ${esc(t.due)}.</div>`:''}
  ${p&&!p.conf?`<div class="mini bad" style="margin-top:7px">Цех не подтвердил срок — клиенту дату называть рано.</div>`:''}
 </div>`}
function dealBody(d,tab){
 if(tab===0)return `
  <div class="stage-track">${STAGES.map((s,i)=>`<div class="stage-step ${i<d.st?'done':i===d.st?'now':''}" onclick="setStage(${d.id},${i})">${i<d.st?'✓ ':''}${s[0].toUpperCase()}</div>`).join('')}</div>
  <div class="dg">
   <div class="det"><small>СУММА</small><b>${d.sum?mln(d.sum):'не рассчитана'}</b></div>
   <div class="det"><small>ОТВЕТСТВЕННЫЙ</small><b>${d.mgr}</b></div>
   <div class="det"><small>ИСТОЧНИК</small><b>${d.src}</b></div>
   <div class="det"><small>ГОРОД / ОБЪЕКТ</small><b>${d.city}</b></div>
  </div>
  ${orderState(d)}
  <div class="note" style="--tone:${d.due==='over'?'var(--red)':'var(--gold)'}"><b>Следующий шаг${d.due==='over'?' · просрочен':''}</b><p>${esc(d.next)}</p></div>
  <div class="note" style="--tone:var(--blue)"><b>Комментарий менеджера</b><p>${esc(d.note)}</p></div>
  <div class="btns" style="margin-top:12px">
   <button class="btn" onclick="closeD();go('inbox')">Открыть переписку</button>
   <button class="btn" onclick="closeD();calcFromDeal(${d.id})">Пересчитать в калькуляторе</button>
   <button class="btn dark" onclick="closeD();go('kp')">Сформировать КП</button>
   ${d.st<6?`<button class="btn gold" onclick="toProd(${d.id})">Передать в производство</button>`:''}
   ${d.st<8?`<button class="btn green" onclick="setStage(${d.id},8);sparks()">Отгружено</button>`:''}
  </div>`;
 if(tab===1)return `<div class="ph-title" style="margin-bottom:9px">История по сделке</div><div class="tl">${d.log.map(l=>`<div class="tli"><b>${({WA:'WhatsApp',CALL:'Звонок',MAIL:'Почта',DOC:'Документ',TCH:'Технолог',PRD:'Производство',WHS:'Склад',LOG:'Логистика','1C':'1С',SYS:'Система',NOTE:'Комментарий'})[l[0]]||l[0]}</b><p>${esc(l[1])}</p><time>${l[2]}</time></div>`).join('')}</div>
  <div style="display:flex;gap:6px;margin-top:10px"><input id="dnote" class="search" placeholder="Комментарий к сделке…" onkeydown="if(event.key==='Enter')addNote(${d.id})"><button class="btn dark" onclick="addNote(${d.id})">Добавить</button></div>`;
 if(tab===2){const tot=d.items.reduce((a,x)=>a+x[1]*x[2],0);
  return `<div class="ph-title" style="margin-bottom:7px">Состав заказа</div>
  ${d.items.length?d.items.map((x,i)=>`<div class="item-row"><span>${esc(x[0])}</span><span class="mono">${fmt(x[1])} ₸</span><span class="q"><button onclick="qty(${d.id},${i},-1)">−</button>${x[2]}<button onclick="qty(${d.id},${i},1)">+</button></span><b class="mono">${fmt(x[1]*x[2])} ₸</b></div>`).join(''):'<p class="mini">Состав пока не собран — посчитайте изделие в калькуляторе, и позиции появятся здесь.</p>'}
  ${d.items.length?`<div class="total"><span>ИТОГО с НДС</span><span>${fmt(tot)} ₸</span></div>`:''}
  <div class="note" style="--tone:var(--violet);margin-top:12px"><b>Расчёт технолога</b><p>${d.hot?'Чертежа нет — технолог снимает размеры с образца. После обмера подставятся масса, материал и технология, цена пересчитается автоматически.':'Масса и технология подтверждены технологом, себестоимость зафиксирована в расчёте.'}</p></div>
  <div class="btns" style="margin-top:11px"><button class="btn" onclick="closeD();calcFromDeal(${d.id})">Открыть калькулятор</button><button class="btn dark" onclick="closeD();go('kp')">Собрать КП из состава</button></div>`}
 if(tab===3){const p=PROD.find(x=>x.deal===d.id);
  return p?`<div class="dg"><div class="det"><small>ЗАКАЗ В ЦЕХ</small><b>${p.id}</b></div><div class="det"><small>ПЛОЩАДКА</small><b>${TECHS[p.site].name}</b></div><div class="det"><small>СТАДИЯ</small><b>${p.st}</b></div><div class="det"><small>СРОК</small><b>${p.due}</b></div></div>
   <div class="bar" style="height:11px"><i style="--w:${p.prog}%;--tone:${p.tone}"></i></div><div class="mini" style="margin-top:5px">Готовность ${p.prog}% · масса заказа ${fmt(p.mass)} кг</div>
   <div class="note" style="--tone:${p.conf?'var(--green)':'var(--red)'};margin-top:11px"><b>${p.conf?'Срок подтверждён цехом':'Цех ещё не подтвердил срок'}</b><p>${p.conf?'Производство приняло заявку и зафиксировало дату. Менеджер и клиент видят один и тот же срок.':'Заявка висит без ответа — система напоминает мастеру и показывает просрочку руководителю.'}</p></div>
   <div class="btns" style="margin-top:11px"><button class="btn" onclick="toast('Запрос статуса отправлен мастеру цеха.')">Запросить статус</button><button class="btn" onclick="toast('Клиенту отправлено обновление по срокам в WhatsApp.')">Сообщить клиенту</button></div>`
   :`<p class="mini">Заявка в производство ещё не создавалась.</p><div class="btns" style="margin-top:10px"><button class="btn gold" onclick="toProd(${d.id})">Передать в производство</button></div>`}
 return `${d.files.length?d.files.map(f=>`<div style="display:flex;gap:9px;align-items:center;padding:8px 0;border-bottom:1px solid #ece7dd"><div class="thumb" data-l="${f.includes('Фото')?'ФОТО':f.includes('КП')?'КП':'DOC'}"></div><div><b style="font-size:8.8px">${esc(f)}</b><small class="mini">прикреплён к сделке · доступен всем ролям</small></div><button class="btn" style="margin-left:auto" onclick="toast('Файл «${esc(f)}» скачан.')">⬇</button></div>`).join(''):'<p class="mini">Файлов пока нет. Фото и чертежи из WhatsApp прикрепляются сюда одним кликом из переписки.</p>'}
  <div class="note" style="--tone:var(--gold);margin-top:12px"><b>Как это работает у вас</b><p>Клиент кидает фото детали в WhatsApp — файл сразу виден в диалоге. Кнопка «В сделку» переносит его в карточку: технолог, производство и склад видят тот же снимок, ничего не теряется в личных телефонах менеджеров.</p></div>`;
}
function setStage(id,st){const d=DEALS.find(x=>x.id===id);const from=STAGES[d.st][0];d.st=st;d.log.unshift(['SYS',`Стадия: ${from} → ${STAGES[st][0]}`,'сейчас']);openDeal(id,dTab);if(cur==='deals')document.getElementById('board').innerHTML=board();if(st===8)sparks()}
function addNote(id){const v=document.getElementById('dnote').value.trim();if(!v)return;const d=DEALS.find(x=>x.id===id);d.log.unshift(['NOTE',v,'сейчас']);d.note=v;openDeal(id,1);toast('Комментарий сохранён в истории сделки.')}
function qty(id,i,dl){const d=DEALS.find(x=>x.id===id);d.items[i][2]=Math.max(0,d.items[i][2]+dl);if(!d.items[i][2])d.items.splice(i,1);d.sum=d.items.reduce((a,x)=>a+x[1]*x[2],0);openDeal(id,2);if(cur==='deals')document.getElementById('board').innerHTML=board()}
function toProd(id){const d=DEALS.find(x=>x.id===id);d.st=6;d.log.unshift(['PRD','Заявка передана в производство, ожидает подтверждения срока','сейчас']);
 if(!PROD.find(p=>p.deal===id))PROD.unshift({id:'ПЗ-0'+(147+PROD.length),deal:id,cl:d.cl,item:d.items.map(x=>x[0]+' · '+x[2]+' шт').join(', ')||'по спецификации',site:'ПГС',mass:0,st:'Ожидает подтверждения',conf:0,due:'—',start:16,len:22,tone:'#7a8798',prog:0});
 closeD();go('prod');toast(`Заявка в цех создана: <b>${esc(d.cl)}</b>. Мастер получил спецификацию — ждём подтверждение срока.`)}

/* ---- ОБРАЩЕНИЯ ---- */
let convI=0;
SC.inbox=()=>`
 <div class="head"><div><h2>Обращения</h2><p>Все каналы в одной очереди. Фото сломанной детали, чертёж или голосовое — всё падает в сделку и остаётся в истории клиента, а не в личном телефоне менеджера.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Все неразобранные обращения распределены между менеджерами.')">Распределить</button><button class="btn dark" onclick="toast('Новый диалог создан в WhatsApp Business.')">Новый диалог</button></div></div>
 <div class="strip">
  <div><small>ОБРАЩЕНИЙ СЕГОДНЯ</small><b>14</b><span>WhatsApp 9 · звонки 4 · почта 1</span></div>
  <div><small>БЕЗ ОТВЕТА</small><b class="bad">2</b><span>дольше 5 минут</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ</small><b>11 мин</b><span class="good">−9 мин за неделю</span></div>
  <div><small>БЕЗ ЧЕРТЕЖА</small><b>6</b><span>идут к технологу</span></div>
  <div><small>ФАЙЛОВ В СДЕЛКАХ</small><b>128</b><span>фото и чертежи</span></div>
 </div>
 <div class="panel inbox">
  <div class="conv-list">${CONV.map((c,i)=>`<div class="conv ${i===convI?'on':''}" onclick="selConv(${i})"><div class="conv-top"><b>${esc(c.n)}</b><time>${c.t}</time></div><p>${esc(c.p)}</p><span class="ch-lbl">${esc(c.ch)}</span>${c.new?'<span class="tag red" style="margin-top:5px">не отвечено</span>':''}</div>`).join('')}</div>
  <div class="chat" id="chat"></div>
  <aside class="side" id="cside"></aside>
 </div>`;
function selConv(i){convI=i;const c=CONV[i];
 document.querySelectorAll('.conv').forEach((x,k)=>x.classList.toggle('on',k===i));
 document.getElementById('chat').innerHTML=`
  <div class="chat-h"><span class="av">${c.n.replace(/[^А-ЯA-Zа-я]/g,'').slice(0,2).toUpperCase()}</span><div style="flex:1"><b>${esc(c.n)}</b><small>${esc(c.ch)} · ${c.deal?'сделка № '+c.deal:'новый контакт'}</small></div>
  ${c.deal?`<button class="btn" onclick="openDeal(${c.deal})">Сделка</button>`:''}<button class="btn gold" onclick="convToDeal(${i})">В сделку →</button></div>
  <div class="msgs">${c.m.map(m=>m[3]?`<div class="msg ${m[0]==='out'?'out':''}">${m[1]||''}<div class="msg-file" onclick="attach('${esc(m[3])}',${c.deal||0})"><div class="thumb" data-l="${esc(m[4])}"></div><div><b>${esc(m[3])}</b><small>нажмите — прикрепить к сделке</small></div></div><time>${m[2]}</time></div>`:`<div class="msg ${m[0]==='out'?'out':''}">${esc(m[1])}<time>${m[2]}</time></div>`).join('')}</div>
  <div class="composer"><input id="mi" placeholder="Написать сообщение…" onkeydown="if(event.key==='Enter')sendMsg(${i})"><button class="btn" onclick="tplKP(${i})">Вставить КП</button><button class="btn dark" onclick="sendMsg(${i})">Отправить</button></div>`;
 const d=c.deal?DEALS.find(x=>x.id===c.deal):null;
 document.getElementById('cside').innerHTML=`
  <div class="side-t">КАРТОЧКА КЛИЕНТА</div>
  <div class="side-row"><span>Статус</span><b>${d?STAGES[d.st][0]:'новый'}</b></div>
  <div class="side-row"><span>Город</span><b>${d?d.city:'—'}</b></div>
  <div class="side-row"><span>Сумма сделки</span><b>${d&&d.sum?fmt(d.sum)+' ₸':'—'}</b></div>
  <div class="side-row"><span>Заказов ранее</span><b>${d&&d.id<1215?'3':'0'}</b></div>
  <div class="side-t">СВЯЗАННЫЕ ФАЙЛЫ</div>
  ${(d?.files||[]).map(f=>`<div class="side-row"><span>${esc(f)}</span><b>⬇</b></div>`).join('')||'<p class="mini">файлов пока нет</p>'}
  <div class="side-t">ПОДСКАЗКА СИСТЕМЫ</div>
  <div class="ai-box"><b>Что предложить:</b> ${sideHint(i)}</div>
  <div class="btns" style="margin-top:10px"><button class="btn" style="width:100%" onclick="go('calc')">Открыть калькулятор</button></div>`;
}
function sideHint(i){const h=[
 'Звёздочка приводная из 110Г13Л — по прошлым заказам ходит вдвое дольше стали 35Л. На складе есть 1 шт от прошлой партии: можно отдать сразу, остальное отлить.',
 'Лопатка бетоносмесителя, 110Г13Л, ЛГМ. Похожий заказ был в мае: 12 кг, 68 000 ₸/шт. Модель в оснастке есть — оснастку заново считать не нужно.',
 'Клиент спросил про доставку в Актау: 2 100 км, фура до 5 т — ориентир 420 000 ₸. Считается в калькуляторе, добавится отдельной строкой в КП.',
 'Первые 4 секции выходят 28.08 — можно отправить фото из цеха, это снимает половину звонков «когда будет готово».',
 'Урны и скамьи для парка: собрать пакетное предложение 20 урн + 8 скамей со скидкой 4% при полной предоплате — маржа остаётся 26%.'][i];return h}
function sendMsg(i){const el=document.getElementById('mi'),v=el.value.trim();if(!v)return;CONV[i].m.push(['out',v,'сейчас']);CONV[i].new=0;selConv(i);toast('Сообщение отправлено и сохранено в истории клиента.')}
function tplKP(i){const el=document.getElementById('mi');el.value='Добрый день! Направляю коммерческое предложение с ценой, весом изделия и сроком изготовления. Все позиции — 100% казахстанское содержание, цена с НДС. Готовы приступить после согласования.';el.focus();toast('Шаблон подставлен — проверьте и отправьте.')}
function attach(f,deal){const d=DEALS.find(x=>x.id===deal);if(d&&!d.files.includes(f)){d.files.push(f);d.log.unshift(['WA',`Файл «${f}» прикреплён к сделке из переписки`,'сейчас'])}
 toast(`Файл <b>${esc(f)}</b> прикреплён к сделке — виден технологу и производству.`)}
function convToDeal(i){const c=CONV[i];if(c.deal){openDeal(c.deal);return}
 const id=seq++;DEALS.unshift({id,cl:c.n,st:1,sum:0,mgr:'Настя',src:'WhatsApp',items:[],note:c.p,next:'Квалифицировать и передать технологу',files:[],city:'Астана',hot:1,due:'ok',log:[['WA',c.p,c.t],['SYS','Сделка создана из переписки','сейчас']]});
 c.deal=id;selConv(i);toast('Обращение превращено в сделку — переписка уже внутри карточки.')}

/* ---- КАЛЬКУЛЯТОР ---- */
SC.calc=()=>{const r=calc();
 return `<div class="head"><div><h2>Калькулятор литья</h2><p>Менеджер собирает цену сам, не дожидаясь технолога: масса нетто и брутто с литниками, металл, формовка, механообработка, покраска, доставка с площадки. Технолог потом подтверждает одним нажатием.</p></div>
 <div class="btns"><button class="btn" onclick="loadSku()">Взять из номенклатуры</button><button class="btn" onclick="toast('Расчёт сохранён в сделке — технолог получил уведомление на подтверждение.')">Сохранить в сделку</button><button class="btn gold" onclick="makeKP()">⚡ Сформировать КП</button></div></div>
 <div class="calc">
  <div class="panel">
   <div class="ph"><div><div class="ph-title">Параметры изделия</div><div class="ph-sub">меняйте значения — цена, себестоимость и маржа пересчитываются мгновенно</div></div><span class="tag gold">${esc(C.sku)}</span></div>
   <div class="fld"><small>НАИМЕНОВАНИЕ ИЗДЕЛИЯ</small><input value="${esc(C.name)}" oninput="C.name=this.value"></div>
   <div class="f3">
    <div class="fld"><small>МАССА НЕТТО, КГ</small><input type="number" step="0.1" value="${C.mass}" oninput="C.mass=+this.value||0;upd()"></div>
    <div class="fld"><small>КОЛИЧЕСТВО, ШТ</small><input type="number" value="${C.qty}" oninput="C.qty=Math.max(1,+this.value||1);upd()"></div>
    <div class="fld"><small>НАЦЕНКА ОТДЕЛА, %</small><input type="number" value="${C.margin}" oninput="C.margin=+this.value||0;upd()"></div>
   </div>
   <div class="fld"><small>МАТЕРИАЛ · ЦЕНА ЖИДКОГО МЕТАЛЛА И КОЭФФИЦИЕНТ ЛИТНИКОВ</small>
    <select onchange="calcSet('mat',this.value)">${Object.entries(MAT).map(([k,m])=>`<option value="${k}" ${k===C.mat?'selected':''}>${m.name} · ${m.price} ₸/кг · к ${m.k} — ${m.note}</option>`).join('')}</select></div>
   <div class="f2">
    <div class="fld"><small>ТЕХНОЛОГИЯ И ПЛОЩАДКА</small><div class="seg">${Object.entries(TECHS).map(([k,t])=>`<button class="${k===C.tech?'on':''}" onclick="calcSet('tech','${k}')">${t.name}</button>`).join('')}</div></div>
    <div class="fld"><small>СЛОЖНОСТЬ ФОРМЫ</small><div class="seg">${Object.keys(HARD).map(k=>`<button class="${k===C.hard?'on':''}" onclick="calcSet('hard','${k}')">${k}</button>`).join('')}</div></div>
   </div>
   <div class="ph-title" style="margin:13px 0 3px;font-size:10.5px">Дополнительные операции</div>
   <div class="sw"><button class="switch ${C.mach?'on':''}" onclick="calcToggle('mach')"></button><span>Механообработка</span><b>${C.mach?fmt(C.mach*RATE_MACH*C.qty)+' ₸':'нет'}</b></div>
   <div class="sw"><button class="switch ${C.paint?'on':''}" onclick="calcToggle('paint')"></button><span>Грунт + порошковая покраска</span><b>${C.paint?fmt(C.mass*RATE_PAINT*C.qty)+' ₸':'нет'}</b></div>
   <div class="sw"><button class="switch ${C.assy?'on':''}" onclick="calcToggle('assy')"></button><span>Сборка с деревом (скамьи)</span><b>${C.assy?fmt(RATE_ASSY*C.qty)+' ₸':'нет'}</b></div>
   <div class="sw"><button class="switch ${C.tooling?'on':''}" onclick="calcToggle('tooling')"></button><span>Новая модельная оснастка</span><b>${C.tooling?fmt(C.toolCost)+' ₸':'модель есть'}</b></div>
   <div class="sw"><button class="switch ${C.deliver?'on':''}" onclick="calcToggle('deliver')"></button><span>Доставка клиенту${C.deliver?', км:':''}</span>${C.deliver?`<input type="number" value="${C.km}" style="width:64px;border:1px solid var(--line);padding:4px 6px;font-size:9px" oninput="C.km=+this.value||0;upd()">`:''}<b>${C.deliver?fmt(C.km*350)+' ₸':'самовывоз'}</b></div>
   <div class="hint"><b>Почему так считается:</b> заливается не масса детали, а масса с литниками и прибылями — для ${MAT[C.mat].name} это ×${MAT[C.mat].k}. Доставка с площадки до склада в Астане (${TECHS[C.tech].km} км, ${fmt(TECHS[C.tech].trip)} ₸ за рейс) — ваш внутренний расход, он уже сидит в себестоимости.</div>
  </div>
  <div>
   <div class="calc-out" id="cout">${coutHTML(r)}</div>
   <div class="panel" style="margin-top:10px"><div class="ph-title" style="font-size:10.5px">Что уйдёт в КП</div>
    <p class="mini" style="margin-top:6px" id="kpwill">${kpWill(r)}</p>
    <div class="btns" style="margin-top:9px"><button class="btn gold" style="width:100%" onclick="makeKP()">⚡ Сформировать КП и отправить</button></div>
   </div>
  </div>
 </div>`};
function coutHTML(r){const tone=r.marginPct>=25?'var(--green)':r.marginPct>=15?'var(--gold)':'var(--red)';
 return `<div class="ph-title" style="color:#fff;font-size:11px">Расчёт · ${C.qty} шт</div>
 <div class="co-mass"><div><small>МАССА НЕТТО</small><b>${fmt(r.netto)} кг</b></div><div><small>ЗАЛИВКА БРУТТО</small><b>${fmt(r.brutto)} кг</b></div></div>
 <div class="co-row"><span>Металл ${C.mat}</span><b>${fmt(r.metal)} ₸</b></div>
 <div class="co-row"><span>Формовка и заливка · ${C.hard.toLowerCase()}</span><b>${fmt(r.mould)} ₸</b></div>
 ${r.tool?`<div class="co-row"><span>Модельная оснастка</span><b>${fmt(r.tool)} ₸</b></div>`:''}
 ${r.mach?`<div class="co-row"><span>Механообработка</span><b>${fmt(r.mach)} ₸</b></div>`:''}
 ${r.paint?`<div class="co-row"><span>Покраска</span><b>${fmt(r.paint)} ₸</b></div>`:''}
 ${r.assy?`<div class="co-row"><span>Сборка</span><b>${fmt(r.assy)} ₸</b></div>`:''}
 <div class="co-row"><span>Доставка с площадки + погрузка</span><b>${fmt(r.trip+r.load)} ₸</b></div>
 ${r.deliv?`<div class="co-row"><span>Доставка клиенту ${C.km} км</span><b>${fmt(r.deliv)} ₸</b></div>`:''}
 <div class="co-row" style="border-top:1px solid #33425a;margin-top:5px"><span>Себестоимость</span><b>${fmt(r.cost)} ₸</b></div>
 <div class="co-row"><span>Наценка ${C.margin}%</span><b>${fmt(r.marginSum)} ₸</b></div>
 <div class="co-row"><span>НДС 12%</span><b>${fmt(r.nds)} ₸</b></div>
 <div class="co-row big"><span>Итого с НДС</span><b>${fmt(r.total)} ₸</b></div>
 <div style="margin-top:4px;font-size:8px;color:#93a2b1">за единицу ${fmt(r.unit)} ₸ · маржа ${r.marginPct.toFixed(1)}%</div>
 <div class="margin-bar"><i style="--w:${Math.min(100,r.marginPct*2.4)}%;--tone:${tone}"></i></div>
 <div style="font-size:7.6px;color:#93a2b1">${r.marginPct>=25?'Маржа в норме — можно давать скидку до 4% и остаться в зелёной зоне.':r.marginPct>=15?'Маржа ниже целевой: скидку давать нельзя, лучше добавить объём.':'Маржа опасная — проверьте оснастку и доставку, такую цену согласовывает руководитель.'}</div>`}
function calcSet(k,v){C[k]=v;const sc=document.getElementById('content').scrollTop;render();document.getElementById('content').scrollTop=sc}
function calcToggle(k){const def={mach:0.6,paint:1,assy:1,tooling:1,deliver:1};calcSet(k,C[k]?0:def[k])}
function kpWill(r){return `${esc(C.name)} — ${C.qty} шт, ${MAT[C.mat].name}, масса изделия ${C.mass} кг, ${TECHS[C.tech].name}${C.paint?', порошковая покраска':''}. Цена за единицу с НДС — <b>${fmt(r.unit)} ₸</b>, срок изготовления 12–18 рабочих дней.`}
function upd(){const r=calc();const o=document.getElementById('cout');if(o)o.innerHTML=coutHTML(r);
 const kw=document.getElementById('kpwill');if(kw)kw.innerHTML=kpWill(r);const sw=document.querySelectorAll('.sw b');if(sw.length>=4){sw[0].textContent=C.mach?fmt(C.mach*RATE_MACH*C.qty)+' ₸':'нет';sw[1].textContent=C.paint?fmt(C.mass*RATE_PAINT*C.qty)+' ₸':'нет';sw[2].textContent=C.assy?fmt(RATE_ASSY*C.qty)+' ₸':'нет';sw[3].textContent=C.tooling?fmt(C.toolCost)+' ₸':'модель есть'}}
function loadSku(){openD('Номенклатура','Выберите изделие — параметры подставятся в калькулятор',['Изделия'],
 `<div class="tw"><table class="data"><thead><tr><th>Код</th><th>Изделие</th><th>Материал</th><th class="right">Масса</th><th class="right">Цена</th></tr></thead><tbody>
 ${SKU.map(s=>`<tr onclick="pickSku('${s.code}')"><td class="mono">${s.code}</td><td><b>${esc(s.name)}</b><div class="sub">${s.cat}</div></td><td>${s.mat}</td><td class="right mono">${s.mass} кг</td><td class="right mono">${fmt(s.price)} ₸</td></tr>`).join('')}</tbody></table></div>`)}
function pickSku(code){const s=SKU.find(x=>x.code===code);C={...C,sku:s.code,name:s.name,mat:s.mat,tech:s.tech,hard:s.hard,mass:s.mass,assy:s.assy,tooling:0,paint:s.cat==='Художественное литьё'?1:0};closeD();render();toast(`Изделие <b>${esc(s.name)}</b> загружено в калькулятор.`)}
function calcFromDeal(id){const d=DEALS.find(x=>x.id===id);const s=SKU.find(x=>d.items.length&&x.name===d.items[0][0])||SKU.find(x=>x.code==='MSH-250');
 C={...C,sku:s.code,name:s.name,mat:s.mat,tech:s.tech,hard:s.hard,mass:s.mass,qty:d.items.length?d.items[0][2]:1,assy:s.assy};go('calc');toast('Калькулятор открыт с параметрами из сделки.')}

/* ---- КП И СЧЕТА ---- */
let KPDATA={num:'КП0051',cl:'ТОО «КазБетонМикс»',date:'20.08.2026',till:'27.08.2026',rows:[['Лопатка бетоносмесителя','шт',9,68000]],pay:'аванс 50%, остаток по готовности',dlv:'Самовывоз со склада в Астане'};
function makeKP(){const r=calc();KPDATA={num:'КП00'+(51+Math.floor(DEALS.length/6)),cl:'ТОО «КазБетонМикс»',date:'20.08.2026',till:'27.08.2026',rows:[[C.name,'шт',C.qty,Math.round(r.unit)]],pay:'аванс 50%, остаток по готовности',dlv:C.deliver?`Доставка до объекта, ${C.km} км`:'Самовывоз со склада в Астане'};
 go('kp');sparks();toast('КП сформировано из расчёта за <b>3 секунды</b>. Проверьте и отправьте клиенту в WhatsApp.')}
SC.kp=()=>{const tot=KPDATA.rows.reduce((a,r)=>a+r[2]*r[3],0);
 return `<div class="head"><div><h2>КП и счета</h2><p>Коммерческое предложение собирается из расчёта: ваш бланк, ваши реквизиты, фото изделий, вес и срок. Раньше менеджер набирал его вручную — теперь это одна кнопка.</p></div>
 <div class="btns"><button class="btn" onclick="toast('КП сохранено в PDF и прикреплено к сделке.')">Скачать PDF</button><button class="btn" onclick="toast('Счёт создан в 1С: номер СФ-0219, реквизиты подтянулись из карточки клиента.')">Выставить счёт в 1С</button><button class="btn gold" onclick="sendKP()">Отправить в WhatsApp</button></div></div>
 <div class="strip">
  <div><small>КП ЗА МЕСЯЦ</small><b>64</b><span>среднее время сборки 4 мин</span></div>
  <div><small>ПРИНЯТО</small><b>24</b><span class="good">конверсия 38%</span></div>
  <div><small>НА СОГЛАСОВАНИИ</small><b>9</b><span>5,9 млн ₸</span></div>
  <div><small>СЧЕТОВ ВЫСТАВЛЕНО</small><b>18</b><span>из них оплачено 15</span></div>
  <div><small>СРЕДНИЙ ЧЕК КП</small><b>1,84 млн ₸</b><span>по принятым</span></div>
 </div>
 <div class="g12">
  <div class="panel"><div class="ph-title">Последние документы</div>
   ${[['КП0050','ЖайлыАктау','336 200 ₸','отправлено','blue'],['КП0049','Караганда Комфорт','—','черновик',''],['КП0047','Акимат Степногорск','2 940 000 ₸','согласование','gold'],['СФ-0216','ГорСвет Астана','1 184 000 ₸','ждёт оплаты','red'],['СФ-0212','Астана Групп Строй','2 130 000 ₸','оплачен','green']]
    .map(x=>`<div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #ece7dd;cursor:pointer" onclick="toast('Документ ${x[0]} открыт.')"><span class="mono" style="font-size:7.4px;font-weight:700;width:52px">${x[0]}</span><div style="flex:1"><b style="font-size:8.6px">${x[1]}</b><div class="sub">${x[2]}</div></div><span class="tag ${x[4]}">${x[3]}</span></div>`).join('')}
   <div class="hint" style="margin-top:11px"><b>Нумерация сквозная.</b> КП и счета нумеруются автоматически, дублей нет. Каждый документ привязан к сделке — видно, кто, когда и на какую сумму отправил.</div>
  </div>
  <div>
   <div class="doc" id="kpdoc">
    <div class="doc-h">
     <div><b>ЖШС «Bolashak Invest LTD»</b><br>Қазақстан Республикасы, 010000<br>Астана қаласы<br>БСН: 200 540 000 653</div>
     <div class="doc-logo"><i></i><span>BOLASHAK<br>INVEST LTD</span></div>
     <div style="text-align:right"><b>ТОО «Bolashak Invest LTD»</b><br>Республика Казахстан, 010000<br>город Астана<br>БИН: 200 540 000 653</div>
    </div>
    <div class="doc-meta"><b>${KPDATA.num} от ${KPDATA.date} г.</b><b>${esc(KPDATA.cl)}</b></div>
    <p>ТОО «Bolashak Invest LTD» — торгово-производственная компания, успешно реализующая проекты в сфере литейного производства.</p>
    <p><b>ТОО «Bolashak Invest LTD» производит изделия из стали, алюминия и чугуна 100% казахстанского содержания.</b> Основные виды продукции: ограждения, садово-парковая мебель, МАФы, приствольные и ливневые решётки, а также запасные части для сельскохозяйственной и строительной техники, бетоносмесительных установок и изделия для нефтеперерабатывающей промышленности.</p>
    <p>Предлагаем к Вашему вниманию следующие позиции:</p>
    <table class="doc-t"><thead><tr><th style="width:32px">№</th><th>Наименование</th><th style="width:48px">Ед. изм</th><th style="width:74px">Кол-во</th><th style="width:92px">Цена за ед., ₸</th><th style="width:104px">Сумма с НДС, ₸</th></tr></thead><tbody>
     ${KPDATA.rows.map((r,i)=>`<tr><td class="c">${i+1}</td><td>${esc(r[0])}</td><td class="c">${r[1]}</td><td class="c">${r[2]}</td><td class="r">${fmt(r[3])}</td><td class="r">${fmt(r[2]*r[3])}</td></tr>`).join('')}
     <tr><td colspan="5"><b>Всего</b></td><td class="r"><b>${fmt(tot)}</b></td></tr></tbody></table>
    <div class="doc-imgs">${KPDATA.rows.slice(0,3).map(r=>`<div class="doc-img"><i data-l="${esc(r[0].split(' ')[0].toUpperCase())}"></i>${esc(r[0])}</div>`).join('')}</div>
    <p style="font-size:9px">Оплата: ${esc(KPDATA.pay)}.<br>Доставка: ${esc(KPDATA.dlv)}.<br>Срок изготовления: 12–18 рабочих дней с даты предоплаты.<br>Данное коммерческое предложение действительно до ${KPDATA.till} г.</p>
    <div class="doc-sign"><div><b>Менеджер проектов</b><br>ТОО «Bolashak Invest LTD»</div><div class="stamp">ТОО<br>Bolashak<br>Invest LTD</div><div style="text-align:right">Асанов Б.С.</div></div>
   </div>
   <div class="hint" style="max-width:720px;margin:11px auto 0"><b>Это ваш реальный бланк.</b> Мы взяли КП0050 от 11.08.2026, которое вы присылали, и повторили его один в один — шапка на двух языках, таблица, фото изделий, условия и подпись. Разница в том, что теперь он собирается автоматически из расчёта, а не набирается руками.</div>
  </div>
 </div>`};
function sendKP(){sparks();toast(`<b>${KPDATA.num}</b> отправлено клиенту в WhatsApp и прикреплено к сделке. Клиент видит документ через 2 секунды после расчёта.`)}

/* ---- КЛИЕНТЫ ---- */
SC.clients=()=>`
 <div class="head"><div><h2>Клиенты</h2><p>Вся история по контрагенту: заказы, чертежи, оплаты и переписка. Менеджер уходит — база остаётся.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Проверка дублей: совпадений по БИН не найдено.')">Дубликаты</button><button class="btn dark" onclick="toast('Карточка контрагента создана, реквизиты запросим у клиента.')">+ Клиент</button></div></div>
 <div class="panel"><div class="tw"><table class="data"><thead><tr><th>Контрагент</th><th>Город</th><th>Сегмент</th><th>Менеджер</th><th class="right">Заказов</th><th class="right">Оборот 2026</th><th>Последний контакт</th></tr></thead><tbody>
 ${[['ТОО «Астана Групп Строй»','Астана','Строительство','Асанов',7,12480000,'вчера'],
    ['Акимат г. Степногорск','Степногорск','Госзаказ','Асанов',3,8600000,'18.08'],
    ['ТОО «Нур Парк»','Астана','Благоустройство','Настя',5,6240000,'15.08'],
    ['ТОО «Темир Транс»','Астана','Промышленность','Асанов',4,4880000,'19.08'],
    ['ТОО «ГорСвет Астана»','Астана','Городская инфра','Настя',6,3960000,'19.08'],
    ['ТОО «ЖайлыАктау»','Актау','Благоустройство','Настя',1,0,'вчера'],
    ['ТОО «КазБетонМикс»','Астана','Промышленность','Настя',2,1420000,'сегодня'],
    ['ИП Сатыбалдиев','Кокшетау','Агротехника','—',0,0,'сегодня']]
  .map(c=>`<tr onclick="openClient('${esc(c[0])}',${c[4]},${c[5]})"><td><b>${c[0]}</b><div class="sub">${c[2]}</div></td><td>${c[1]}</td><td><span class="tag ${c[2]==='Госзаказ'?'violet':c[2]==='Промышленность'?'blue':''}">${c[2]}</span></td><td>${c[3]}</td><td class="right mono">${c[4]}</td><td class="right mono"><b>${c[5]?fmt(c[5])+' ₸':'—'}</b></td><td>${c[6]}</td></tr>`).join('')}
 </tbody></table></div></div>`;
function openClient(n,orders,turn){openD(n,`Контрагент · ${orders} заказов · оборот ${turn?fmt(turn)+' ₸':'—'}`,['Сводка','История','Изделия','Документы'],
 `<div class="dg"><div class="det"><small>ОБОРОТ 2026</small><b>${turn?fmt(turn)+' ₸':'новый клиент'}</b></div><div class="det"><small>ЗАКАЗОВ</small><b>${orders}</b></div><div class="det"><small>СРЕДНИЙ ЧЕК</small><b>${turn&&orders?fmt(turn/orders)+' ₸':'—'}</b></div><div class="det"><small>ДЕБИТОРКА · 1С</small><b class="good">нет долга</b></div></div>
  <div class="ph-title" style="margin:11px 0 8px">Что заказывали</div>
  <div class="tl"><div class="tli"><b>Ограждение мостовое · 12 секций</b><p>1 536 кг чугуна СЧ20, площадка ПГС Шортанды, порошковая покраска.</p><time>август 2026 · 3 744 000 ₸</time></div>
   <div class="tli"><b>Решётка приствольная · 8 шт</b><p>Повторный заказ по имеющейся модели — оснастку не считали.</p><time>июнь 2026 · 1 568 000 ₸</time></div>
   <div class="tli"><b>Урна «Астана» · 14 шт</b><p>Первый заказ, пришёл с тендерной площадки.</p><time>апрель 2026 · 1 792 000 ₸</time></div></div>
  <div class="note" style="--tone:var(--gold);margin-top:11px"><b>Подсказка менеджеру</b><p>Модели по всем позициям уже в оснастке — повторный заказ считается без затрат на модель, это +6 п.п. маржи. Можно предложить сезонное пополнение к весне.</p></div>`)}

/* ---- ТЕХНОЛОГ ---- */
SC.tech=()=>`
 <div class="head"><div><h2>Технолог · чертежи</h2><p>Очередь заявок от продаж: обмер образцов, чертёж, масса, материал и технология. Ответ технолога автоматически возвращается в сделку и в калькулятор.</p></div>
 <div class="btns"><button class="btn" onclick="toast('AutoCAD-файл загружен и привязан к номенклатуре.')">Загрузить чертёж</button><button class="btn gold" onclick="toast('Изделие добавлено в номенклатуру с массой, материалом и технологией — теперь его считает любой менеджер.')">+ В номенклатуру</button></div></div>
 <div class="strip">
  <div><small>ЗАЯВОК В ОЧЕРЕДИ</small><b>4</b><span>2 без чертежа · по образцу</span></div>
  <div><small>СРЕДНИЙ СРОК РАСЧЁТА</small><b>3,5 ч</b><span class="good">было 1,5 дня</span></div>
  <div><small>МОДЕЛЕЙ В ОСНАСТКЕ</small><b>212</b><span>повтор считается без оснастки</span></div>
  <div><small>ПОДТВЕРЖДЕНО СЕГОДНЯ</small><b>3</b><span>цена ушла клиенту</span></div>
  <div><small>ОТКЛОНЕНО</small><b class="bad">1</b><span>не наш профиль</span></div>
 </div>
 <div class="board" id="tboard">${tboard()}</div>
 <div class="g2" style="margin-top:2px">
 <div class="panel"><div class="ph-title">Главный ускоритель</div>
  <p class="mini" style="margin-top:6px">Менеджер не ждёт технолога, чтобы назвать цену: он считает по типовым параметрам прямо в разговоре и отправляет КП, а технолог подтверждает или корректирует в течение дня. Стадия расчёта при этом видна в сделке — продажи всегда знают, на чём стоит их заказ.</p>
  <div class="kpi-mini"><div style="--tone:var(--molten)"><small>СРОЧНЫХ</small><b>${TECHQ.filter(t=>t.hot).length}</b></div><div style="--tone:var(--gold)"><small>В РАБОТЕ</small><b>${TECHQ.filter(t=>t.ts>0&&t.ts<4).length}</b></div><div style="--tone:var(--green)"><small>ПОДТВЕРЖДЕНО</small><b>${TECHQ.filter(t=>t.ts===4).length}</b></div></div>
 </div>
 <div class="panel dark"><div class="ph-title">Как деталь попадает в систему</div>
  <div style="margin-top:11px">
  ${[['01','Фото сломанной детали в WhatsApp','файл падает в сделку и виден технологу'],
     ['02','Образец на склад или обмер','технолог снимает размеры, чертит в AutoCAD'],
     ['03','Чертёж и масса в карточке','масса нетто, материал, технология ПГС или ЛГМ'],
     ['04','Появляется в номенклатуре','следующий такой заказ считается за 40 секунд'],
     ['05','Модель в оснастке','повторный заказ идёт без затрат на модель']]
   .map(s=>`<div style="display:grid;grid-template-columns:26px 1fr;gap:10px;padding:7px 0;border-bottom:1px solid #2e3c50"><span class="mono" style="color:var(--gold);font-size:8px;font-weight:700">${s[0]}</span><div><b style="font-size:9px">${s[1]}</b><p style="font-size:7.4px;color:#8194a8;margin:3px 0 0;line-height:1.45">${s[2]}</p></div></div>`).join('')}
  </div>
 </div>
 </div>`;
function tboard(){
 return TSTAGES.map((s,i)=>{const col=TECHQ.filter(t=>t.ts===i);
  return `<div class="col" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')" ondrop="this.classList.remove('dragover');tdrop(event,${i})">
   <div class="col-h"><b>${s[0]}</b><small>${col.length}</small></div>
   ${col.map(t=>`<div class="card" draggable="true" style="--tone:${s[1]}" ondragstart="tdrag(event,'${t.id}')" ondragend="this.classList.remove('dragging')" onclick="techCard('${t.id}')">
     <div class="card-top"><b>${esc(t.item)}</b><span class="card-sum">${t.qty} шт</span></div>
     <div class="card-item">${esc(t.cl)}</div>
     <div class="card-note">${esc(t.note)}</div>
     <div class="chips"><span class="chip">${t.mat}</span><span class="chip">${t.tech}</span>${t.mass?`<span class="chip ok">${t.mass} кг</span>`:'<span class="chip hot">масса не снята</span>'}${t.files.length?`<span class="chip">${t.files.length} файл</span>`:''}</div>
     <div class="card-foot"><span class="who"><i>МЖ</i>${t.who}</span><span class="mono" style="font-size:6.6px;color:${t.hot?'var(--red)':'var(--muted)'}">${esc(t.due)}</span></div>
    </div>`).join('')}
  </div>`}).join('')}
function tdrag(e,id){e.dataTransfer.setData('text/plain',id);e.target.classList.add('dragging')}
function tdrop(e,ts){const id=e.dataTransfer.getData('text/plain'),t=TECHQ.find(x=>x.id===id);if(!t||t.ts===ts)return;
 const from=TSTAGES[t.ts][0];t.ts=ts;if(ts>=3&&!t.mass)t.mass=t.mat==='СЧ20'?38:12;
 const d=DEALS.find(x=>x.id===t.deal);if(d)d.log.unshift(['TCH',`Технолог: ${from} → ${TSTAGES[ts][0]}`,'сейчас']);
 render();
 if(ts===4)toast(`Расчёт по <b>${esc(t.item)}</b> подтверждён — масса и технология ушли в сделку и в калькулятор.`);
 else toast(`Заявка <b>${t.id}</b> → «${TSTAGES[ts][0]}». Продажи видят новый статус в сделке.`)}
function techCard(id){const t=TECHQ.find(x=>x.id===id);if(!t)return;
 openD(t.item,`${t.id} · ${t.cl} · ${t.qty} шт · ${TSTAGES[t.ts][0]}`,['Расчёт технолога'],
 `<div class="stage-track">${TSTAGES.map((s,i)=>`<div class="stage-step ${i<t.ts?'done':i===t.ts?'now':''}" onclick="setTech('${t.id}',${i})">${i<t.ts?'✓ ':''}${s[0].toUpperCase()}</div>`).join('')}</div>
  <div class="dg"><div class="det"><small>МАССА НЕТТО</small><b>${t.mass?t.mass+' кг':'не снята'}</b></div><div class="det"><small>МАССА ЗАЛИВКИ</small><b>${t.mass?(t.mass*MAT[t.mat].k).toFixed(1)+' кг':'—'}</b></div><div class="det"><small>МАТЕРИАЛ</small><b>${t.mat}</b></div><div class="det"><small>ТЕХНОЛОГИЯ</small><b>${TECHS[t.tech].name}</b></div></div>
  <div style="display:flex;gap:10px;margin-bottom:11px;flex-wrap:wrap">${(t.files.length?t.files:['нет файлов']).map(f=>`<div class="thumb" style="width:104px;height:82px" data-l="${esc(f.includes('Фото')?'ФОТО ОБРАЗЦА':f.includes('dwg')?'ЧЕРТЁЖ AUTOCAD':f.includes('pdf')?'ЭСКИЗ':'НЕТ ФАЙЛА')}"></div>`).join('')}
   <div style="flex:1;min-width:150px"><p class="mini">${esc(t.note)}</p></div></div>
  <div class="note" style="--tone:var(--green)"><b>Что уйдёт в продажи</b><p>Масса, материал, технология и трудоёмкость. Калькулятор менеджера пересчитает цену автоматически, стадия расчёта появится в карточке сделки.</p></div>
  <div class="btns" style="margin-top:12px">
   <button class="btn green" onclick="setTech('${t.id}',4);closeD()">Подтвердить и вернуть в продажи</button>
   <button class="btn" onclick="closeD();openDeal(${t.deal})">Открыть сделку</button>
   <button class="btn" onclick="closeD();go('calc')">Посчитать в калькуляторе</button>
   <button class="btn red" onclick="closeD();toast('Заявка отклонена с причиной — менеджер получил объяснение для клиента.')">Не наш профиль</button></div>`)}
function setTech(id,ts){const t=TECHQ.find(x=>x.id===id);const from=TSTAGES[t.ts][0];t.ts=ts;if(ts>=3&&!t.mass)t.mass=t.mat==='СЧ20'?38:12;
 const d=DEALS.find(x=>x.id===t.deal);if(d)d.log.unshift(['TCH',`Технолог: ${from} → ${TSTAGES[ts][0]}`,'сейчас']);
 render();if(dOpen)openDeal(dOpen,dTab);
 toast(ts===4?`Расчёт по <b>${esc(t.item)}</b> подтверждён — параметры ушли в сделку.`:`Стадия технолога обновлена: «${TSTAGES[ts][0]}».`)}

/* ---- ПРОИЗВОДСТВО ---- */
SC.prod=()=>`
 <div class="head"><div><h2>Производство</h2><p>Отдел продаж — отдельное юрлицо, но заказы идут в цеха через одну систему: спецификация, подтверждение срока, статус готовности. Никаких «позвони узнай».</p></div>
 <div class="btns"><button class="btn" onclick="toast('Сводка по цеху отправлена мастерам в WhatsApp.')">Сводка мастерам</button><button class="btn gold" onclick="toast('Заявка в цех создана из сделки со спецификацией и чертежами.')">+ Заявка в цех</button></div></div>
 <div class="strip">
  <div><small>ЗАКАЗОВ В ЦЕХАХ</small><b>6</b><span>4,6 т металла</span></div>
  <div><small>ЖДУТ ПОДТВЕРЖДЕНИЯ</small><b class="bad">2</b><span>висят дольше суток</span></div>
  <div><small>СРОК В СРЕДНЕМ</small><b>16 дней</b><span>от аванса до готовности</span></div>
  <div><small>ГОТОВО К ОТГРУЗКЕ</small><b>1</b><span>зуб ковша · 12 шт</span></div>
  <div><small>ПРОСРОЧКА</small><b class="good">0</b><span>сроки держим</span></div>
 </div>
 <div class="panel"><div class="ph"><div><div class="ph-title">План цеха · август – сентябрь</div><div class="ph-sub">две площадки: ПГС в Шортандах (100 км) и ЛГМ в 10 км от города</div></div><span class="tag gold">загрузка 78%</span></div>
  <div class="gscale"><span></span><div class="gsi"><span>20.08</span><span>27.08</span><span>03.09</span><span>10.09</span></div></div>
  <div class="gantt">${PROD.map(p=>`<div class="gr" onclick="prodCard('${p.id}')" style="cursor:pointer">
   <div class="gr-l"><b>${p.cl}</b><small>${p.id} · ${p.site} · ${p.mass?fmt(p.mass)+' кг':'расчёт'}</small></div>
   <div class="gtrack"><div class="gbar" style="--s:${p.start*2.6}%;--w:${p.len*2.6}%;--tone:${p.tone}">${p.st} ${p.due!=='—'?'· '+p.due:''}</div></div></div>`).join('')}</div>
  <div class="hint" style="margin-top:12px"><b>Что это даёт продажам:</b> менеджер видит, что ПГС занята до 5 сентября, и не обещает клиенту «две недели». А клиент вместо звонков получает статус: «формовка, готовность 38%, срок 05.09».</div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Ждут подтверждения срока</div>
   ${PROD.filter(p=>!p.conf).map(p=>`<div style="display:flex;gap:9px;align-items:center;padding:9px 0;border-bottom:1px solid #ece7dd"><div style="flex:1"><b style="font-size:9px">${p.cl}</b><div class="sub">${p.item} · ${p.site}</div></div><button class="btn green" onclick="confirmProd('${p.id}')">Подтвердить</button></div>`).join('')||'<p class="mini">Все заявки подтверждены.</p>'}
   <div class="hint" style="margin-top:10px"><b>Правило:</b> заявка без ответа цеха дольше 24 часов подсвечивается руководителю. Это главная точка потери клиентов — «мы уточним у производства и перезвоним».</div>
  </div>
  <div class="panel"><div class="ph-title">Обратная связь клиенту</div>
   <p class="mini" style="margin-top:6px">Каждый статус цеха превращается в понятное сообщение, которое менеджер отправляет одним нажатием.</p>
   ${[['Формовка начата','«Ваш заказ в работе, формовка началась 21.08, идём по графику»'],['Отлито','«Отлито, ушло на обрубку и покраску — фото прикладываю»'],['Готово','«Заказ готов и принят на склад в Астане, можно забирать или везём сами»']]
    .map(x=>`<div class="note" style="--tone:var(--blue)"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}
   <div class="btns" style="margin-top:10px"><button class="btn" onclick="toast('Клиенту отправлено обновление статуса с фото из цеха.')">Отправить статус клиенту</button></div>
  </div>
 </div>`;
function confirmProd(id){const p=PROD.find(x=>x.id===id);p.conf=1;p.st='Подтверждено · в очереди';p.due='08.09';p.tone='var(--molten)';render();toast(`Цех подтвердил срок по <b>${esc(p.cl)}</b> — дата ушла менеджеру и клиенту автоматически.`)}
function prodCard(id){const p=PROD.find(x=>x.id===id);openD(p.cl,`${p.id} · ${TECHS[p.site].name} · ${p.item}`,['Заказ в цеху'],
 `<div class="dg"><div class="det"><small>СТАДИЯ</small><b>${p.st}</b></div><div class="det"><small>СРОК</small><b>${p.due}</b></div><div class="det"><small>МАССА</small><b>${p.mass?fmt(p.mass)+' кг':'уточняется'}</b></div><div class="det"><small>ГОТОВНОСТЬ</small><b>${p.prog}%</b></div></div>
  <div class="bar" style="height:12px"><i style="--w:${p.prog}%;--tone:${p.tone}"></i></div>
  <div class="ph-title" style="margin:13px 0 7px">Технологические переделы</div>
  ${['Модель и оснастка','Формовка','Плавка и заливка','Выбивка и обрубка','Механообработка','Покраска','Приёмка ОТК'].map((s,i)=>{const done=i<Math.round(p.prog/100*7);return `<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #ece7dd;font-size:8.6px"><span style="width:16px;height:16px;border-radius:50%;background:${done?'var(--green)':'#ddd8cd'};color:#fff;display:grid;place-items:center;font-size:7px">${done?'✓':i+1}</span>${s}<span style="margin-left:auto" class="mini">${done?'выполнено':'в плане'}</span></div>`}).join('')}
  <div class="btns" style="margin-top:12px"><button class="btn" onclick="toast('Фото из цеха запрошено у мастера.')">Запросить фото</button><button class="btn dark" onclick="closeD();go('stock')">Принять на склад</button></div>`)}

/* ---- СКЛАД ---- */
let MOVES=[
 {t:'in',date:'19.08 14:30',doc:'ПР-0142',what:'Зуб ковша экскаватора',qty:12,mass:312,who:'Дамир С.',src:'Площадка ЛГМ',note:'Приёмка с производства по заказу ПЗ-0141'},
 {t:'out',date:'15.08 12:00',doc:'РН-0212',what:'Урна «Астана»',qty:9,mass:342,who:'Дамир С.',src:'ТОО «Нур Парк»',note:'Отгрузка клиенту, накладная в 1С'},
 {t:'out',date:'15.08 12:00',doc:'РН-0212',what:'Скамья «Классика»',qty:3,mass:156,who:'Дамир С.',src:'ТОО «Нур Парк»',note:'Отгрузка клиенту, накладная в 1С'},
 {t:'in',date:'12.08 10:15',doc:'ПР-0138',what:'Люк канализационный тип Т',qty:8,mass:944,who:'Дамир С.',src:'Площадка ПГС',note:'Приёмка партии из Шортандов'},
 {t:'inv',date:'01.08 09:00',doc:'ИНВ-08',what:'Плановая инвентаризация',qty:0,mass:0,who:'Дамир С. + Гульмира А.',src:'Склад Астана',note:'Пересчёт 18 позиций, расхождений с 1С нет'}
];
SC.stock=()=>{const inQ=MOVES.filter(m=>m.t==='in'),outQ=MOVES.filter(m=>m.t==='out');
 return `
 <div class="head"><div><h2>Склад и шоурум</h2><p>Готовая продукция в Астане: что стоит в шоуруме, что зарезервировано под заказ, что приехало с площадок. Менеджер видит остаток в момент разговора с клиентом.</p></div>
 <div class="btns"><button class="btn green" onclick="moveForm('in')">↓ Приход</button><button class="btn" onclick="moveForm('out')">↑ Расход</button><button class="btn gold" onclick="invForm()">⚖ Инвентаризация</button></div></div>
 <div class="strip">
  <div><small>НА СКЛАДЕ · ГОТОВАЯ ПРОДУКЦИЯ</small><b>${fmt(SKU.reduce((a,s)=>a+s.stock*s.price,0))} ₸</b><span>${SKU.reduce((a,s)=>a+s.stock,0)} единиц</span></div>
  <div><small>В ШОУРУМЕ</small><b>9</b><span>образцы для показа</span></div>
  <div><small>ЗАРЕЗЕРВИРОВАНО</small><b>12</b><span>зуб ковша · Темир Транс</span></div>
  <div><small>ПРИЁМКА СЕГОДНЯ</small><b>0</b><span>ждём с ПГС 28.08</span></div>
  <div><small>ОТГРУЗОК ЗА НЕДЕЛЮ</small><b>4</b><span>на 5,9 млн ₸</span></div>
 </div>
 <div class="panel"><div class="ph"><div><div class="ph-title">Остатки готовой продукции</div><div class="ph-sub">обновляются из 1С и приёмок с площадок</div></div><span class="tag green">синхронизировано</span></div>
  <div class="wh">${SKU.filter(s=>s.stock).map(s=>`<div class="wh-cell" onclick="skuCard('${s.code}')" style="cursor:pointer">
   <b>${esc(s.name)}</b><small>${s.code} · ${s.mat} · ${s.mass} кг</small>
   <div class="wh-q"><span class="mini">${fmt(s.price)} ₸</span><b class="${s.stock<3?'bad':'good'}">${s.stock} шт</b></div></div>`).join('')}</div>
  <div class="hint" style="margin-top:12px"><b>Зачем это отделу продаж:</b> когда клиент спрашивает «есть в наличии?», менеджер отвечает сразу, а не через полчаса звонков на склад. Позиции с остатком продаются быстрее и без ожидания цеха.</div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph"><div><div class="ph-title">Движение по складу</div><div class="ph-sub">каждая строка кликабельна: документ, кто принял, куда ушло</div></div><span class="tag">приход ${inQ.length} · расход ${outQ.length}</span></div>
   <div class="tw"><table class="data" style="min-width:520px"><thead><tr><th>Дата</th><th>Документ</th><th>Позиция</th><th class="right">Кол-во</th><th>Операция</th></tr></thead><tbody>
   ${MOVES.map((m,i)=>`<tr onclick="moveCard(${i})"><td class="mono">${m.date}</td><td class="mono">${m.doc}</td><td><b>${esc(m.what)}</b><div class="sub">${esc(m.src)}</div></td><td class="right mono">${m.qty?(m.t==='out'?'−':'+')+m.qty+' шт':'—'}</td><td><span class="tag ${m.t==='in'?'green':m.t==='out'?'blue':'gold'}">${m.t==='in'?'приход':m.t==='out'?'расход':'инвентаризация'}</span></td></tr>`).join('')}
   </tbody></table></div>
   <div class="btns" style="margin-top:10px"><button class="btn green" onclick="moveForm('in')">↓ Оформить приход</button><button class="btn" onclick="moveForm('out')">↑ Оформить расход</button></div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Инвентаризация</div><div class="ph-sub">пересчёт остатков и сверка с 1С</div></div><span class="tag green">последняя 01.08</span></div>
   <div class="kpi-mini" style="margin-top:0"><div style="--tone:var(--blue)"><small>ПОЗИЦИЙ К ПЕРЕСЧЁТУ</small><b>${SKU.filter(s=>s.stock).length}</b></div><div style="--tone:var(--green)"><small>РАСХОЖДЕНИЙ</small><b>0</b></div><div style="--tone:var(--gold)"><small>СЛЕДУЮЩАЯ</small><b>01.09</b></div></div>
   <p class="mini" style="margin-top:10px">Кладовщик открывает лист, вводит фактическое количество по каждой позиции, система сразу показывает расхождение с учётом и формирует акт. Итог зеркалится в 1С.</p>
   <div class="btns" style="margin-top:10px"><button class="btn gold" onclick="invForm()">⚖ Начать инвентаризацию</button><button class="btn" onclick="toast('Акт последней инвентаризации от 01.08 открыт: 18 позиций, расхождений нет.')">Акт от 01.08</button></div>
   <div class="hint" style="margin-top:11px"><b>Почему это важно для продаж:</b> менеджер верит остатку в системе только тогда, когда склад регулярно пересчитывается. Иначе он снова начинает звонить кладовщику.</div>
  </div>
 </div>`};
function skuCard(code){const s=SKU.find(x=>x.code===code);
 openD(s.name,`${s.code} · ${s.cat} · ${s.mat} · ${s.mass} кг`,['Карточка позиции'],
 `<div class="dg"><div class="det"><small>НА СКЛАДЕ</small><b class="${s.stock<3?'bad':'good'}">${s.stock} шт</b></div><div class="det"><small>ЦЕНА БАЗОВАЯ</small><b>${fmt(s.price)} ₸</b></div><div class="det"><small>МАССА ЗАЛИВКИ</small><b>${(s.mass*MAT[s.mat].k).toFixed(1)} кг</b></div><div class="det"><small>ТЕХНОЛОГИЯ</small><b>${TECHS[s.tech].name}</b></div></div>
  <div class="ph-title" style="margin:11px 0 7px">Последнее движение</div>
  ${MOVES.filter(m=>m.what===s.name).map(m=>`<div style="display:flex;gap:9px;align-items:center;padding:7px 0;border-bottom:1px solid #ece7dd"><span class="tag ${m.t==='in'?'green':'blue'}">${m.t==='in'?'приход':'расход'}</span><div style="flex:1"><b style="font-size:8.8px">${m.qty} шт · ${esc(m.src)}</b><div class="sub">${m.date} · ${m.doc}</div></div></div>`).join('')||'<p class="mini">Движений по этой позиции ещё не было.</p>'}
  <div class="btns" style="margin-top:11px"><button class="btn green" onclick="closeD();moveForm('in','${esc(s.name)}')">↓ Приход</button><button class="btn" onclick="closeD();moveForm('out','${esc(s.name)}')">↑ Расход</button><button class="btn" onclick="closeD();pickSku('${s.code}');go('calc')">Посчитать в калькуляторе</button></div>`)}
function moveCard(i){const m=MOVES[i];
 openD(m.what,`${m.doc} · ${m.date} · ${m.t==='in'?'приход':m.t==='out'?'расход':'инвентаризация'}`,['Документ'],
 `<div class="dg"><div class="det"><small>КОЛИЧЕСТВО</small><b>${m.qty?m.qty+' шт':'—'}</b></div><div class="det"><small>МАССА</small><b>${m.mass?fmt(m.mass)+' кг':'—'}</b></div><div class="det"><small>${m.t==='in'?'ОТКУДА':'КУДА'}</small><b>${esc(m.src)}</b></div><div class="det"><small>ОТВЕТСТВЕННЫЙ</small><b>${esc(m.who)}</b></div></div>
  <div class="note" style="--tone:var(--gold)"><b>Комментарий</b><p>${esc(m.note)}</p></div>
  <div class="btns" style="margin-top:11px"><button class="btn" onclick="toast('Документ ${m.doc} выгружен в PDF.')">Печать документа</button><button class="btn dark" onclick="toast('Документ ${m.doc} проверен в 1С: проведён, расхождений нет.')">Проверить в 1С</button></div>`)}
function moveForm(t,name){const opts=SKU.map(s=>`<option ${s.name===name?'selected':''}>${s.name}</option>`).join('');
 openD(t==='in'?'Приход на склад':'Расход со склада',t==='in'?'Приёмка готовой продукции с производственной площадки':'Отгрузка клиенту или перемещение',['Оформление'],
 `<div class="fld"><small>ПОЗИЦИЯ</small><select id="mvName">${opts}</select></div>
  <div class="f3">
   <div class="fld"><small>КОЛИЧЕСТВО, ШТ</small><input id="mvQty" type="number" value="1"></div>
   <div class="fld"><small>${t==='in'?'ПЛОЩАДКА':'ПОЛУЧАТЕЛЬ'}</small><select id="mvSrc">${t==='in'?'<option>Площадка ПГС · Шортанды</option><option>Площадка ЛГМ · 10 км</option>':DEALS.slice(0,6).map(d=>`<option>${esc(d.cl)}</option>`).join('')+'<option>Шоурум · перемещение</option>'}</select></div>
   <div class="fld"><small>ОТВЕТСТВЕННЫЙ</small><select id="mvWho"><option>Дамир С.</option><option>Гульмира А.</option><option>Цех Шортанды</option></select></div>
  </div>
  <div class="fld"><small>КОММЕНТАРИЙ</small><input id="mvNote" placeholder="${t==='in'?'по какому заказу пришло':'основание отгрузки'}"></div>
  <div class="note" style="--tone:var(--blue)"><b>Что произойдёт после сохранения</b><p>${t==='in'?'Остаток увеличится, позиция станет доступна менеджерам, а приходный документ уйдёт в 1С.':'Остаток уменьшится, сформируется расходная накладная и уйдёт в 1С, сделка перейдёт в «Отгружено».'}</p></div>
  <div class="btns" style="margin-top:12px"><button class="btn ${t==='in'?'green':'dark'}" onclick="saveMove('${t}')">Сохранить и провести</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function saveMove(t){const name=document.getElementById('mvName').value,qty=+document.getElementById('mvQty').value||0;
 if(!qty)return toast('Укажите количество.');
 const s=SKU.find(x=>x.name===name);const src=document.getElementById('mvSrc').value,who=document.getElementById('mvWho').value,note=document.getElementById('mvNote').value.trim();
 if(t==='out'&&s.stock<qty)return toast(`На складе только <b>${s.stock} шт</b> — расход больше остатка провести нельзя.`);
 s.stock+=t==='in'?qty:-qty;
 MOVES.unshift({t,date:'сейчас',doc:(t==='in'?'ПР-':'РН-')+(213+MOVES.length),what:name,qty,mass:Math.round(s.mass*qty),who,src,note:note||(t==='in'?'Приёмка с производства':'Отгрузка клиенту')});
 closeD();render();
 toast(t==='in'?`Приход проведён: <b>${name} · ${qty} шт</b>. Остаток ${s.stock} шт, документ ушёл в 1С.`:`Расход проведён: <b>${name} · ${qty} шт</b>. Остаток ${s.stock} шт, накладная в 1С.`)}
function invForm(){openD('Инвентаризация склада','Введите фактическое количество — расхождение посчитается автоматически',['Лист пересчёта'],
 `<div class="tw"><table class="data" style="min-width:460px"><thead><tr><th>Позиция</th><th class="right">Учёт</th><th class="right" style="width:96px">Факт</th><th class="right">Расхождение</th></tr></thead><tbody>
 ${SKU.filter(s=>s.stock).map((s,i)=>`<tr style="cursor:default"><td><b>${esc(s.name)}</b><div class="sub">${s.code}</div></td><td class="right mono">${s.stock}</td>
  <td class="right"><input type="number" id="iv${i}" value="${s.stock}" style="width:78px;border:1px solid var(--line);padding:5px 6px;font-size:9.4px;text-align:right" oninput="invDiff(${i},${s.stock})"></td>
  <td class="right mono" id="dv${i}">0</td></tr>`).join('')}
 </tbody></table></div>
 <div class="note" style="--tone:var(--gold);margin-top:11px"><b>Как это работает у кладовщика</b><p>Открыл лист на телефоне или планшете, прошёл по складу, ввёл фактические цифры. Система сама покажет, где недостача или излишек, сформирует акт и отправит итог в 1С.</p></div>
 <div class="btns" style="margin-top:12px"><button class="btn gold" onclick="saveInv()">Завершить и сформировать акт</button><button class="btn" onclick="closeD()">Отмена</button></div>`)}
function invDiff(i,base){const v=+document.getElementById('iv'+i).value||0,d=v-base,el=document.getElementById('dv'+i);
 el.textContent=d>0?'+'+d:d;el.className='right mono '+(d===0?'':d<0?'bad':'warn')}
function saveInv(){const list=SKU.filter(s=>s.stock);let diffs=0;
 list.forEach((s,i)=>{const v=+document.getElementById('iv'+i).value||0;if(v!==s.stock){diffs++;s.stock=v}});
 MOVES.unshift({t:'inv',date:'сейчас',doc:'ИНВ-'+(9+MOVES.filter(m=>m.t==='inv').length),what:'Инвентаризация склада',qty:0,mass:0,who:ROLES[role].n,src:'Склад Астана',note:diffs?`Пересчёт ${list.length} позиций, расхождений: ${diffs}`:`Пересчёт ${list.length} позиций, расхождений нет`});
 closeD();render();
 toast(diffs?`Инвентаризация завершена: <b>расхождений ${diffs}</b>. Акт сформирован, остатки обновлены и ушли в 1С.`:'Инвентаризация завершена: <b>расхождений нет</b>. Акт сформирован и отправлен в 1С.')}

/* ---- ЛОГИСТИКА ---- */
SC.logi=()=>`
 <div class="head"><div><h2>Логистика</h2><p>Два плеча: доставка с площадок на склад в Астане (ваш внутренний расход, входит в себестоимость) и отгрузка клиенту — самовывозом или вашей машиной.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Рейс запланирован: Шортанды → склад Астана, 28.08.')">Запланировать рейс</button><button class="btn gold" onclick="toast('Накладная сформирована и отправлена в 1С.')">Оформить отгрузку</button></div></div>
 <div class="strip">
  <div><small>РАСХОД НА ЛОГИСТИКУ · АВГУСТ</small><b>486 000 ₸</b><span>внутренние рейсы и доставка</span></div>
  <div><small>РЕЙСОВ С ПЛОЩАДОК</small><b>7</b><span>ПГС 5 · ЛГМ 2</span></div>
  <div><small>ОТГРУЖЕНО КЛИЕНТАМ</small><b>4</b><span>2 самовывоза</span></div>
  <div><small>СРЕДНЯЯ ДОСТАВКА</small><b>45 000 ₸</b><span>рейс Шортанды</span></div>
  <div><small>ДОЛЯ В СЕБЕСТОИМОСТИ</small><b>3,8%</b><span class="good">в норме</span></div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Ближайшие рейсы</div>
   ${[['28.08','Шортанды → склад Астана','Ограждение мостовое · 4 секции · 512 кг','45 000 ₸','запланирован','gold'],
      ['21.08','ЛГМ → склад Астана','Лопатка · при готовности','12 000 ₸','ожидание','',],
      ['22.08','Склад → Темир Транс','Зуб ковша · 12 шт','самовывоз','согласовать','red'],
      ['19.08','Склад → Нур Парк','Урна 9, скамья 3','28 000 ₸','выполнен','green']]
    .map(r=>`<div style="display:grid;grid-template-columns:52px 1fr auto;gap:9px;align-items:center;padding:9px 0;border-bottom:1px solid #ece7dd"><span class="mono" style="font-size:7.4px;font-weight:700">${r[0]}</span><div><b style="font-size:8.8px">${r[1]}</b><div class="sub">${r[2]} · ${r[3]}</div></div><span class="tag ${r[5]}">${r[4]}</span></div>`).join('')}
  </div>
  <div class="panel dark"><div class="ph-title">Схема движения продукции</div>
   <div style="margin-top:12px">
   ${[['ПГС Шортанды','100 км до склада · крупное литьё, ограждения и скамьи','var(--molten)'],
      ['ЛГМ площадка','10 км до склада · точные детали, запчасти','var(--gold)'],
      ['Склад и шоурум Астана','приёмка, резерв под заказы, витрина','var(--blue)'],
      ['Клиент','самовывоз со склада или доставка вашей машиной','var(--green)']]
    .map((s,i,arr)=>`<div style="border-left:3px solid ${s[2]};background:#25334a;padding:10px 11px;margin-bottom:${i<arr.length-1?'4px':'0'}"><b style="font-size:9.4px">${s[0]}</b><p style="font-size:7.6px;color:#8194a8;margin:4px 0 0;line-height:1.45">${s[1]}</p></div>${i<arr.length-1?'<div style="text-align:center;color:var(--gold);font-size:12px;margin:2px 0">↓</div>':''}`).join('')}
   </div>
   <p style="font-size:7.6px;color:#8194a8;line-height:1.6;margin-top:11px">Стоимость плеча «производство → склад» отдел продаж берёт на себя — она автоматически входит в расчёт и не съедает маржу незаметно.</p>
  </div>
 </div>`;

/* ---- НОМЕНКЛАТУРА ---- */
let catF='all';
SC.price=()=>`
 <div class="head"><div><h2>Номенклатура и прайсы</h2><p>Каждое изделие с массой, материалом, технологией и себестоимостью. Три уровня цен: базовая, для постоянных клиентов и тендерная — менеджер не считает скидку в уме.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Прайс выгружен в Excel и PDF для отправки клиентам.')">Выгрузить прайс</button><button class="btn" onclick="toast('Номенклатура синхронизирована с 1С: 18 позиций, расхождений нет.')">Синхронизация с 1С</button><button class="btn gold" onclick="toast('Позиция добавлена. Технолог подтвердит массу и технологию.')">+ Изделие</button></div></div>
 <div class="filters"><input class="search" id="pq" placeholder="Код, наименование, материал…" oninput="renderPrice()"><button class="filter ${catF==='all'?'on':''}" onclick="fCat(this,'all')">Все</button><button class="filter ${catF==='Художественное литьё'?'on':''}" onclick="fCat(this,'Художественное литьё')">Художественное литьё</button><button class="filter ${catF==='Машиностроение'?'on':''}" onclick="fCat(this,'Машиностроение')">Машиностроение</button></div>
 <div class="panel"><div class="tw"><table class="data"><thead><tr><th>Код</th><th>Изделие</th><th>Материал</th><th class="right">Масса нетто</th><th class="right">Заливка</th><th>Технология</th><th class="right">Себестоимость</th><th class="right">Базовая</th><th class="right">Постоянным</th><th class="right">Тендер</th><th class="right">Склад</th></tr></thead><tbody id="ptb"></tbody></table></div>
  <div class="hint" style="margin-top:11px"><b>Вес — ключевое поле.</b> Вы просили видеть массу каждой детали: она нужна и для цены металла, и для доставки, и для клиента в КП. Масса заливки считается автоматически с коэффициентом литников по каждому сплаву.</div></div>`;
function fCat(el,c){catF=c;el.parentElement.querySelectorAll('.filter').forEach(x=>x.classList.remove('on'));el.classList.add('on');renderPrice()}
function renderPrice(){const q=(document.getElementById('pq')?.value||'').toLowerCase();const tb=document.getElementById('ptb');if(!tb)return;
 tb.innerHTML=SKU.filter(s=>(catF==='all'||s.cat===catF)&&`${s.code} ${s.name} ${s.mat}`.toLowerCase().includes(q)).map(s=>{
  const cost=Math.round(s.price/1.34);
  return `<tr onclick="pickSku('${s.code}');go('calc')"><td class="mono">${s.code}</td><td><b>${esc(s.name)}</b><div class="sub">${s.cat}</div></td><td>${s.mat}</td><td class="right mono">${s.mass} кг</td><td class="right mono muted">${(s.mass*MAT[s.mat].k).toFixed(1)} кг</td><td><span class="tag ${s.tech==='ЛГМ'?'blue':''}">${s.tech}</span></td><td class="right mono muted">${fmt(cost)}</td><td class="right mono"><b>${fmt(s.price)}</b></td><td class="right mono">${fmt(s.price*0.95)}</td><td class="right mono">${fmt(s.price*0.92)}</td><td class="right"><span class="tag ${s.stock?'green':''}">${s.stock||'—'}</span></td></tr>`}).join('')}

/* ---- ОТЧЁТЫ ---- */
SC.reports=()=>`
 <div class="head"><div><h2>Отчёты собственнику</h2><p>Цифры собираются сами из сделок, счетов и 1С. Ербол видит оборот, средний чек, доходность по проектам и работу каждого менеджера — без Excel и без «пришлите мне отчёт».</p></div>
 <div class="btns"><button class="btn">Август 2026</button><button class="btn" onclick="toast('Отчёт выгружен в Excel и PDF.')">Экспорт</button><button class="btn gold" onclick="toast('Отчёт будет приходить вам в WhatsApp каждый понедельник в 9:00.')">Присылать еженедельно</button></div></div>
 <div class="strip">
  <div><small>ОБОРОТ · АВГУСТ</small><b>7,4 млн ₸</b><span class="good">▲ 22% к июлю</span></div>
  <div><small>ВАЛОВАЯ ПРИБЫЛЬ</small><b>2,1 млн ₸</b><span>маржа 28,4%</span></div>
  <div><small>СРЕДНИЙ ЧЕК</small><b>1,84 млн ₸</b><span class="good">▲ 310 тыс.</span></div>
  <div><small>КОНВЕРСИЯ КП → ЗАКАЗ</small><b>38%</b><span>из 64 КП</span></div>
  <div><small>ЦИКЛ СДЕЛКИ</small><b>19 дней</b><span class="good">−6 дней</span></div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph"><div><div class="ph-title">Оборот и прибыль по месяцам</div><div class="ph-sub">тёмное — оборот, золотое — валовая прибыль</div></div><span class="tag gold">6 мес.</span></div>
   <div class="chart">${[['мар',42,26],['апр',51,31],['май',58,34],['июн',63,38],['июл',61,36],['авг',74,46]].map(m=>`<div class="chart-col"><i style="--h:${m[1]}%;--p:${m[2]}%"></i><span>${m[0]}</span></div>`).join('')}</div>
   <div class="kpi-mini"><div style="--tone:var(--gold)"><small>ЛУЧШИЙ МЕСЯЦ</small><b>7,4 млн</b></div><div style="--tone:var(--blue)"><small>СРЕДНЯЯ МАРЖА</small><b>28,4%</b></div><div style="--tone:var(--green)"><small>ПОВТОРНЫЕ</small><b>46%</b></div></div>
  </div>
  <div class="panel"><div class="ph"><div><div class="ph-title">Структура выручки</div><div class="ph-sub">по направлениям продукции</div></div></div>
   <div style="display:grid;grid-template-columns:130px 1fr;gap:14px;align-items:center;margin-top:6px">
    <div class="donut" style="--a:46%;--b:74%;--c:92%"><b>7,4</b></div>
    <div class="lg">
     <div><i style="background:var(--gold)"></i>Художественное литьё · 46% · 3,40 млн</div>
     <div><i style="background:var(--blue)"></i>Машиностроение · 28% · 2,07 млн</div>
     <div><i style="background:var(--violet)"></i>Госзаказ и тендеры · 18% · 1,33 млн</div>
     <div><i style="background:#d8d3c8"></i>Прочее и склад · 8% · 0,60 млн</div>
    </div>
   </div>
   <div class="hint" style="margin-top:12px"><b>Вывод системы:</b> машиностроение даёт меньше выручки, но маржа там 34% против 26% на художественном литье — при равной загрузке цеха выгоднее брать запчасти.</div>
  </div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Доходность по проектам</div>
   <div class="tw"><table class="data" style="min-width:520px"><thead><tr><th>Проект / клиент</th><th class="right">Выручка</th><th class="right">Себестоимость</th><th class="right">Прибыль</th><th class="right">Маржа</th></tr></thead><tbody>
   ${[['Астана Групп Строй · ограждение',3744000,2620000],['Акимат Степногорск · перила',2940000,2280000],['Нур Парк · благоустройство',1908000,1390000],['Темир Транс · зуб ковша',1464000,932000],['ГорСвет · люки',1184000,864000]]
    .map(p=>{const pr=p[1]-p[2],m=pr/p[1]*100;return `<tr onclick="toast('${p[0]}: разложение по металлу, формовке, обработке и логистике.')"><td><b>${p[0]}</b></td><td class="right mono">${fmt(p[1])}</td><td class="right mono muted">${fmt(p[2])}</td><td class="right mono"><b>${fmt(pr)}</b></td><td class="right"><span class="tag ${m>32?'green':m>24?'gold':'red'}">${m.toFixed(1)}%</span></td></tr>`}).join('')}
   </tbody></table></div>
   <div class="hint" style="margin-top:10px"><b>Здесь видно то, что в Excel теряется:</b> Акимат при обороте 2,94 млн даёт маржу 22,4% — самый крупный заказ оказался не самым выгодным, и просьбу о скидке 5% давать нельзя.</div>
  </div>
  <div class="panel"><div class="ph-title">Работа менеджеров</div>
   ${[['Настя К.','НК',28,24,3960000,86],['Асанов Б.','АБ',21,18,3440000,79],['Ербол Б. · личные','ЕБ',6,5,1180000,92]]
    .map(m=>`<div style="display:grid;grid-template-columns:132px 1fr 78px;gap:9px;align-items:center;padding:9px 0;border-bottom:1px solid #ece7dd">
     <div style="display:flex;align-items:center;gap:7px"><span class="av" style="width:26px;height:26px;font-size:7px">${m[1]}</span><div><b style="font-size:8.8px">${m[0]}</b><div class="sub">${m[2]} КП · ${m[3]} ответов в срок</div></div></div>
     <div class="bar"><i style="--w:${m[5]}%;--tone:${m[5]>85?'var(--green)':'var(--gold)'}"></i></div>
     <div class="right mono" style="font-size:8.4px"><b>${mln(m[4])}</b></div></div>`).join('')}
   <div class="kpi-mini"><div style="--tone:var(--green)"><small>ОТВЕТ В СРОК</small><b>84%</b></div><div style="--tone:var(--gold)"><small>КП В ДЕНЬ ОБРАЩЕНИЯ</small><b>71%</b></div><div style="--tone:var(--blue)"><small>БЕЗ СЛЕД. ШАГА</small><b>2</b></div></div>
   <div class="hint" style="margin-top:10px"><b>Это и есть контроль отдела:</b> видно не «кто сколько сидел», а сколько КП ушло, за сколько минут ответили и где сделка стоит без следующего шага.</div>
  </div>
 </div>`;

/* ---- ЗАДАЧИ · КАНБАН ---- */
let whoF='all';
SC.tasks=()=>`
 <div class="head"><div><h2>Задачи</h2><p>Доска в стиле Trello: карточку тянут между колонками, у каждой — ответственный, срок, чек-лист с прогрессом и внутренний чат. Поручения перестают жить в WhatsApp.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Доска выгружена в Excel: задачи, ответственные, сроки и прогресс.')">Экспорт</button><button class="btn gold" onclick="newTask()">+ Задача</button></div></div>
 <div class="strip">
  <div><small>ВСЕГО ЗАДАЧ</small><b>${TASKS.length}</b><span>${TASKS.filter(t=>t.col<3).length} в работе</span></div>
  <div><small>СРОЧНЫХ</small><b class="bad">${TASKS.filter(t=>t.pr==='high'&&t.col<3).length}</b><span>приоритет высокий</span></div>
  <div><small>НА ПРОВЕРКЕ</small><b>${TASKS.filter(t=>t.col===2).length}</b><span>ждут руководителя</span></div>
  <div><small>ГОТОВО</small><b class="good">${TASKS.filter(t=>t.col===3).length}</b><span>за неделю</span></div>
  <div><small>СРЕДНИЙ ПРОГРЕСС</small><b>${Math.round(TASKS.filter(t=>t.col<3).reduce((a,t)=>a+t.prog,0)/Math.max(1,TASKS.filter(t=>t.col<3).length))}%</b><span>по открытым</span></div>
 </div>
 <div class="filters"><input class="search" id="tq" placeholder="Задача, ответственный, клиент…" oninput="document.getElementById('kb').innerHTML=kboard()"><button class="filter ${whoF==='all'?'on':''}" onclick="fWho(this,'all')">Все</button>${PEOPLE.slice(1,6).map(p=>`<button class="filter ${whoF===p?'on':''}" onclick="fWho(this,'${p}')">${p}</button>`).join('')}</div>
 <div class="board" id="kb">${kboard()}</div>`;
function fWho(el,w){whoF=w;el.parentElement.querySelectorAll('.filter').forEach(x=>x.classList.remove('on'));el.classList.add('on');document.getElementById('kb').innerHTML=kboard()}
function kboard(){const q=(document.getElementById('tq')?.value||'').toLowerCase();
 const vis=TASKS.filter(t=>(whoF==='all'||t.who===whoF)&&`${t.t} ${t.who}`.toLowerCase().includes(q));
 return TCOLS.map((c,i)=>{const col=vis.filter(t=>t.col===i);
  return `<div class="col" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')" ondrop="this.classList.remove('dragover');kdrop(event,${i})">
   <div class="col-h"><b>${c[0]}</b><small>${col.length}</small></div>
   ${col.map(t=>{const done=t.sub.filter(s=>s[1]).length;
    return `<div class="card" draggable="true" style="--tone:${c[1]}" ondragstart="kdrag(event,${t.id})" ondragend="this.classList.remove('dragging')" onclick="taskCard(${t.id})">
     <div class="card-top"><b>${esc(t.t)}</b></div>
     <div class="chips" style="margin-top:6px"><span class="chip ${t.pr==='high'?'hot':t.pr==='mid'?'':'ok'}">${t.pr==='high'?'срочно':t.pr==='mid'?'обычная':'низкий'}</span><span class="chip">${esc(t.due)}</span>${t.deal?`<span class="chip wait">сделка №${t.deal}</span>`:''}${t.chat.length?`<span class="chip">💬 ${t.chat.length}</span>`:''}</div>
     <div style="margin-top:7px"><div class="bar" style="height:6px"><i style="--w:${t.prog}%;--tone:${t.prog===100?'var(--green)':c[1]}"></i></div>
      <div class="mini" style="margin-top:3px">чек-лист ${done} из ${t.sub.length} · ${t.prog}%</div></div>
     <div class="card-foot"><span class="who"><i>${t.who.split(' ').map(w=>w[0]).join('').slice(0,2)}</i>${esc(t.who)}</span></div>
    </div>`}).join('')}
   ${i===0?'<button class="addc" onclick="newTask()">+ Добавить</button>':''}
  </div>`}).join('')}
function kdrag(e,id){e.dataTransfer.setData('text/plain',id);e.target.classList.add('dragging')}
function kdrop(e,col){const id=+e.dataTransfer.getData('text/plain'),t=TASKS.find(x=>x.id===id);if(!t||t.col===col)return;
 t.col=col;if(col===3){t.prog=100;t.sub.forEach(s=>s[1]=1)}else if(col>0&&t.prog===0)t.prog=20;
 t.chat.push(['Система',`Задача перенесена в «${TCOLS[col][0]}»`,'сейчас']);
 document.getElementById('kb').innerHTML=kboard();
 if(col===3){sparks();toast(`Задача <b>${esc(t.t)}</b> выполнена. Ответственный и время закрытия сохранены.`)}
 else toast(`Задача перенесена в «${TCOLS[col][0]}».`)}
function taskCard(id,tab=0){const t=TASKS.find(x=>x.id===id);if(!t)return;
 document.getElementById('dt').textContent=t.t;
 document.getElementById('ds').textContent=`Задача № ${t.id} · ${TCOLS[t.col][0]} · ${t.who} · до ${t.due}`;
 document.getElementById('dtabs').innerHTML=['Карточка','Обсуждение · '+t.chat.length].map((x,i)=>`<button class="dtab ${i===tab?'on':''}" onclick="taskCard(${id},${i})">${x}</button>`).join('');
 document.getElementById('db').innerHTML=tab===0?taskMain(t):taskChat(t);
 document.getElementById('dbg').classList.add('show')}
function taskMain(t){const done=t.sub.filter(s=>s[1]).length;
 return `<div class="stage-track">${TCOLS.map((c,i)=>`<div class="stage-step ${i<t.col?'done':i===t.col?'now':''}" onclick="setTaskCol(${t.id},${i})">${i<t.col?'✓ ':''}${c[0].toUpperCase()}</div>`).join('')}</div>
 <div class="dq">
  <label><small>ОТВЕТСТВЕННЫЙ</small><select onchange="taskField(${t.id},'who',this.value)">${PEOPLE.map(p=>`<option ${p===t.who?'selected':''}>${p}</option>`).join('')}</select></label>
  <label><small>СРОК</small><input value="${esc(t.due)}" onchange="taskField(${t.id},'due',this.value)"></label>
  <label><small>ПРИОРИТЕТ</small><select onchange="taskField(${t.id},'pr',this.value)"><option value="high" ${t.pr==='high'?'selected':''}>Срочный</option><option value="mid" ${t.pr==='mid'?'selected':''}>Обычный</option><option value="low" ${t.pr==='low'?'selected':''}>Низкий</option></select></label>
  <label><small>СВЯЗАННАЯ СДЕЛКА</small><input value="${t.deal?'№ '+t.deal:'—'}" ${t.deal?`onclick="closeD();openDeal(${t.deal})" readonly style="cursor:pointer"`:'readonly'}></label>
 </div>
 <div class="ph-title" style="font-size:11px;margin:4px 0 6px">Прогресс · ${t.prog}%</div>
 <div class="bar" style="height:10px"><i style="--w:${t.prog}%;--tone:${t.prog===100?'var(--green)':'var(--gold)'}"></i></div>
 <div class="mini" style="margin-top:5px">Считается по чек-листу: выполнено ${done} из ${t.sub.length} пунктов.</div>
 <div class="ph-title" style="font-size:11px;margin:12px 0 4px">Чек-лист</div>
 ${t.sub.map((s,i)=>`<div style="display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid #ece7dd;cursor:pointer" onclick="subToggle(${t.id},${i})">
   <input type="checkbox" ${s[1]?'checked':''} onclick="event.stopPropagation();subToggle(${t.id},${i})">
   <span style="font-size:9.4px;${s[1]?'text-decoration:line-through;color:var(--muted)':''}">${esc(s[0])}</span></div>`).join('')}
 <div style="display:flex;gap:6px;margin-top:9px"><input id="nsub" class="search" placeholder="Новый пункт чек-листа…" onkeydown="if(event.key==='Enter')addSub(${t.id})"><button class="btn" onclick="addSub(${t.id})">+ Пункт</button></div>
 <div class="btns" style="margin-top:12px">
  ${t.col<3?`<button class="btn green" onclick="setTaskCol(${t.id},3)">Отметить выполненной</button>`:''}
  <button class="btn" onclick="taskCard(${t.id},1)">Обсуждение</button>
  ${t.deal?`<button class="btn dark" onclick="closeD();openDeal(${t.deal})">Открыть сделку</button>`:''}
  <button class="btn red" onclick="delTask(${t.id})">Удалить</button>
 </div>`}
function taskChat(t){return `<div class="ph-title" style="font-size:11px;margin-bottom:9px">Внутреннее обсуждение</div>
 <div style="background:#f0eee7;padding:11px;max-height:340px;overflow:auto">
 ${t.chat.map(m=>`<div class="msg ${m[0]===ROLES[role].n?'out':''}" style="max-width:82%"><b style="font-size:7.6px;color:var(--muted);display:block;margin-bottom:3px">${esc(m[0])}</b>${esc(m[1])}<time>${m[2]}</time></div>`).join('')}
 </div>
 <div style="display:flex;gap:6px;margin-top:9px"><input id="tmsg" class="search" placeholder="Написать в обсуждение задачи…" onkeydown="if(event.key==='Enter')taskMsg(${t.id})"><button class="btn dark" onclick="taskMsg(${t.id})">Отправить</button></div>
 <div class="hint" style="margin-top:11px"><b>Зачем это внутри задачи:</b> переписка по конкретному поручению лежит рядом с ним, а не теряется в общем чате. Новый сотрудник открывает задачу и сразу видит, о чём договорились.</div>`}
function taskField(id,k,v){const t=TASKS.find(x=>x.id===id);t[k]=v;t.chat.push(['Система',`Изменено поле «${({who:'ответственный',due:'срок',pr:'приоритет'})[k]}»: ${v}`,'сейчас']);
 if(cur==='tasks')document.getElementById('kb').innerHTML=kboard();taskCard(id,0);toast('Изменение сохранено, ответственный уведомлён.')}
function setTaskCol(id,col){const t=TASKS.find(x=>x.id===id);t.col=col;if(col===3){t.prog=100;t.sub.forEach(s=>s[1]=1)}
 t.chat.push(['Система',`Задача перенесена в «${TCOLS[col][0]}»`,'сейчас']);
 if(cur==='tasks')render();taskCard(id,0);if(col===3){sparks();toast('Задача выполнена и записана в историю.')}}
function subToggle(id,i){const t=TASKS.find(x=>x.id===id);t.sub[i][1]=t.sub[i][1]?0:1;
 t.prog=Math.round(t.sub.filter(s=>s[1]).length/t.sub.length*100);
 if(t.prog===100&&t.col<3)t.col=2;
 if(cur==='tasks')document.getElementById('kb').innerHTML=kboard();taskCard(id,0)}
function addSub(id){const el=document.getElementById('nsub'),v=el.value.trim();if(!v)return;
 const t=TASKS.find(x=>x.id===id);t.sub.push([v,0]);t.prog=Math.round(t.sub.filter(s=>s[1]).length/t.sub.length*100);
 taskCard(id,0);toast('Пункт добавлен в чек-лист.')}
function taskMsg(id){const el=document.getElementById('tmsg'),v=el.value.trim();if(!v)return;
 const t=TASKS.find(x=>x.id===id);t.chat.push([ROLES[role].n,v,'сейчас']);taskCard(id,1);
 if(cur==='tasks')document.getElementById('kb').innerHTML=kboard();toast('Сообщение отправлено — ответственный получит уведомление.')}
function delTask(id){const i=TASKS.findIndex(x=>x.id===id);TASKS.splice(i,1);closeD();render();toast('Задача удалена.')}
function newTask(){const id=taskSeq++;TASKS.unshift({id,t:'Новая задача',who:ROLES[role].n,col:0,due:'сегодня',pr:'mid',prog:0,deal:null,sub:[['Описать, что нужно сделать',0]],chat:[['Система','Задача создана','сейчас']]});
 if(cur!=='tasks')go('tasks');else document.getElementById('kb').innerHTML=kboard();
 taskCard(id,0);toast('Задача создана — назначьте ответственного и срок.')}

/* ---- ИНТЕГРАЦИИ ---- */
SC.integr=()=>`
 <div class="head"><div><h2>1С и связи</h2><p>Система ведёт продажи, 1С остаётся системой учёта. Заказ, счёт и накладная зеркалятся автоматически — двойного ввода нет.</p></div>
 <div class="btns"><button class="btn dark" onclick="toast('Диагностика: обмен с 1С 8.3 активен, последняя синхронизация 6 минут назад, ошибок нет.')">Проверить связи</button></div></div>
 <div class="panel dark" style="margin-bottom:10px"><div class="ph"><div><div class="ph-title">Как данные ходят между системами</div><div class="ph-sub" style="color:#7e8ea0">двусторонний обмен по согласованным сценариям</div></div><span class="tag green">1С 8.3</span></div>
  <div class="flow">
   <div class="fbox"><code>КАНАЛЫ</code><b>WhatsApp · телефония · почта</b><p>Обращения, фото деталей, чертежи и записи звонков.</p></div>
   <div class="farr">→</div>
   <div class="fbox main"><code>CAPEX KZ</code><b>Продажи · расчёт · КП</b><p>Воронка, калькулятор литья, КП и счета, задачи и отчёты.</p></div>
   <div class="farr">↔</div>
   <div class="fbox"><code>1С 8.3</code><b>Учёт · склад · документы</b><p>Номенклатура, остатки, счета-фактуры, накладные, оплаты.</p></div>
   <div class="farr">→</div>
   <div class="fbox"><code>ПРОИЗВОДСТВО</code><b>Цеха ПГС и ЛГМ</b><p>Заявка со спецификацией, подтверждение срока, статус готовности.</p></div>
  </div>
 </div>
 <div class="g2">
  <div class="panel"><div class="ph-title">Подключения</div>
   ${[['1C','1С 8.3 · двусторонний обмен','номенклатура и остатки в систему; заказы, счета и накладные — в 1С',1],
      ['WA','WhatsApp Business','рабочие номера отдела продаж: переписка, файлы, отправка КП',1],
      ['TEL','IP-телефония','входящие и исходящие с записью разговора в карточке сделки',0],
      ['TG','Telegram','второй канал обращений и уведомления менеджерам',0],
      ['SITE','Заявки с сайта','форма на capex.kz падает сразу в воронку с источником',1],
      ['MAIL','Почта','КП и счета уходят с вашего домена, ответы возвращаются в сделку',1],
      ['BKP','Резервные копии','ежедневный бэкап и откат на 24 часа назад',1],
      ['ROL','Роли и права','собственник, РОП, менеджер, технолог, цех, склад, бухгалтер',1]]
    .map(x=>`<div style="display:flex;gap:10px;align-items:center;border:1px solid var(--line);background:var(--white);padding:10px;margin-bottom:6px"><div style="width:36px;height:36px;background:var(--ink);color:var(--gold);display:grid;place-items:center;font:700 6.6px 'IBM Plex Mono',monospace;flex:none">${x[0]}</div><div style="flex:1"><b style="font-size:9px">${x[1]}</b><p class="mini" style="margin:3px 0 0">${x[2]}</p></div><button class="switch ${x[3]?'on':''}" onclick="this.classList.toggle('on');toast('Настройка «${x[1]}» изменена в демо.')"></button></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Что именно зеркалится в 1С</div>
   <div class="tw"><table class="data" style="min-width:420px"><thead><tr><th>Объект</th><th>Направление</th><th>Когда</th></tr></thead><tbody>
   ${[['Номенклатура и цены','1С → система','при изменении'],['Остатки склада','1С → система','каждые 15 минут'],['Контрагент и реквизиты','система ↔ 1С','при создании'],['Заказ покупателя','система → 1С','при оплате счёта'],['Счёт на оплату','система → 1С','при выставлении'],['Оплаты','1С → система','каждые 15 минут'],['Накладная и АВР','система → 1С','при отгрузке']]
    .map(r=>`<tr><td><b>${r[0]}</b></td><td><span class="tag ${r[1].includes('↔')?'violet':r[1].startsWith('1С')?'blue':'gold'}">${r[1]}</span></td><td class="mini">${r[2]}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint" style="margin-top:11px"><b>Принцип:</b> менеджер работает только в системе продаж, бухгалтер — только в 1С. Никто ничего не переписывает вручную, и цифры сходятся.</div>
  </div>
 </div>`;

/* ================= КАРКАС ================= */
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([n,r],i)=>`<button class="role" onclick="enter('${n}')"><code>0${i+1}</code><b>${n}</b><span>${r.note}</span></button>`).join('')}
function enter(n){role=n;const r=ROLES[n];
 document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 document.getElementById('rav').textContent=r.av;document.getElementById('rname').textContent=r.n;document.getElementById('rrole').textContent=n;
 buildNav();const q=new URLSearchParams(location.search).get('s');go(q&&r.s.includes(q)?q:r.s[0]);
 toast(`Роль <b>${n}</b>: показаны только ваши разделы. Переключить можно в правом верхнем углу.`)}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{const x=items.filter(i=>al.includes(i[0]));
  return x.length?`<div class="nav-group">${g}</div>`+x.map(i=>`<button class="nav-item" data-go="${i[0]}" onclick="go('${i[0]}')"><span class="nav-code">${i[1]}</span><span>${i[2]}</span>${i[3]?`<span class="nav-badge">${i[3]}</span>`:'<span></span>'}</button>`).join(''):''}).join('');
 const s=document.getElementById('rsel');s.innerHTML=Object.keys(ROLES).map(n=>`<option ${n===role?'selected':''}>${n}</option>`).join('');s.onchange=()=>enter(s.value)}
function go(s){if(!ROLES[role].s.includes(s))s=ROLES[role].s[0];cur=s;
 document.getElementById('ttl').textContent=TITLES[s][0];document.getElementById('sub').textContent=TITLES[s][1];
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('on',x.dataset.go===s));
 render();document.getElementById('rail').classList.remove('open');document.getElementById('content').scrollTop=0;
 try{const u=new URL(location.href);u.searchParams.set('s',s);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function render(){document.getElementById('content').innerHTML=SC[cur]?SC[cur]():'<p class="mini">Раздел в разработке.</p>';
 if(cur==='inbox')selConv(convI);if(cur==='price')renderPrice()}
function openD(t,s,tabs,body){document.getElementById('dt').textContent=t;document.getElementById('ds').textContent=s;
 document.getElementById('dtabs').innerHTML=tabs.map((x,i)=>`<button class="dtab ${i===0?'on':''}" onclick="this.parentElement.querySelectorAll('.dtab').forEach(y=>y.classList.remove('on'));this.classList.add('on')">${x}</button>`).join('');
 document.getElementById('db').innerHTML=body;document.getElementById('dbg').classList.add('show')}
function closeD(){dOpen=null;document.getElementById('dbg').classList.remove('show')}
function quick(){openD('Быстрое действие','Создайте объект, не переходя между разделами',['Создать'],
 `<div class="dg">
  <button class="det" style="text-align:left;cursor:pointer" onclick="closeD();newDeal()"><small>СДЕЛКА</small><b>Новое обращение</b></button>
  <button class="det" style="text-align:left;cursor:pointer" onclick="closeD();go('calc')"><small>РАСЧЁТ</small><b>Посчитать изделие</b></button>
  <button class="det" style="text-align:left;cursor:pointer" onclick="closeD();go('kp')"><small>ДОКУМЕНТ</small><b>Сформировать КП</b></button>
  <button class="det" style="text-align:left;cursor:pointer" onclick="closeD();go('tasks')"><small>ЗАДАЧА</small><b>Поручение сотруднику</b></button>
 </div>`)}
/* ================= СЦЕНАРИЙ ЗА 4 МИНУТЫ ================= */
const TOUR=[
 ['inbox','<b>Шаг 1 · 10:41.</b> Клиент кидает в WhatsApp фото сломанной звёздочки: «зубья съело, чертежа нет». Обращение само стало сделкой, время ответа пошло.',4200],
 ['tech','<b>Шаг 2 · 10:47.</b> Заявка ушла технологу: он снимает размеры с образца, ставит массу 12 кг, материал 110Г13Л и технологию ЛГМ.',4200],
 ['calc','<b>Шаг 3 · 10:52.</b> Менеджер считает цену сам: металл, литники, формовка, механообработка и доставка. Маржа видна сразу — торговаться можно осознанно.',4800],
 ['kp','<b>Шаг 4 · 10:55.</b> Коммерческое предложение собралось на вашем бланке и ушло клиенту в WhatsApp. Раньше это занимало полдня.',4400],
 ['prod','<b>Шаг 5.</b> Клиент согласовал — заявка ушла в цех со спецификацией. Мастер подтвердил срок прямо в системе, менеджер больше не бегает узнавать.',4400],
 ['stock','<b>Шаг 6.</b> Готовые изделия приняты на склад в Астане и зарезервированы под заказ. Остаток виден менеджеру в момент разговора.',3800],
 ['logi','<b>Шаг 7.</b> Отгрузка: самовывоз или ваша машина. Накладная уходит в 1С автоматически.',3600],
 ['reports','<b>Итог.</b> Сделка закрыта, и собственник видит её в отчёте: оборот, себестоимость, маржа и работа менеджера — без единой таблицы в Excel.',5200]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}
 tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();toast('<b>Весь путь заказа</b> прошёл внутри одной системы: от фото в WhatsApp до цифры в отчёте собственника.');return}
 const [scr,txt,ms]=TOUR[tourI++];
 if(ROLES[role].s.includes(scr))go(scr);
 toast(txt);tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий';}
let tt;function toast(h){const t=document.getElementById('toast');t.innerHTML=h;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),3800)}
function sparks(){const c=['#c8a882','#ff7a18','#e3cbaa','#3f8f6a','#f0c987','#ffffff'];
 for(let i=0;i<80;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;top:-14px;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2400)}}
setInterval(()=>{DEALS.forEach(d=>{if(d.st===0&&d.sla!=null)d.sla++});
 document.querySelectorAll('[data-sla]').forEach(el=>{const d=DEALS.find(x=>x.id===+el.dataset.sla);if(d)el.textContent='⏱ '+mmss(d.sla||0)})},1000);
document.getElementById('menuBtn').onclick=()=>document.getElementById('rail').classList.toggle('open');
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');if(q&&TITLES[q])enter('Собственник')})();
