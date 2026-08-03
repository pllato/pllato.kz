(function(){
const cities=['Алматы','Астана','Шымкент','Караганда','Актобе','Атырау','Тараз','Павлодар','Костанай','Усть-Каменогорск'];
const locations=['Достык','Туран','Арбат','MEGA','Бухар Жырау','Абая','Сатпаева','Назарбаева','Республики','Мангилик Ел','Орбита','Самал','Кабанбай','Толе би','Жибек Жолы','Есиль','Ауэзова','Сарыарка','Аль-Фараби','Астана Mall','Достык Plaza','Grand Park'];
const managers=['Данияр К.','Алия С.','Руслан М.','Сауле Н.','Марат Б.','Жанна Т.','Ерлан А.','Айгуль Р.'];
const restaurants=locations.map((name,i)=>({id:'r'+(i+1),name:'Шафран · '+name,city:cities[i%cities.length],manager:managers[i%managers.length],revenue:2.35+(i*0.19)%2.8,plan:[108,101,94,99,92,104,97,106,89,102,98,111,96,103,91,100,105,95,107,93,109,99][i],food:[29.4,31.1,34.8,30.2,33.7,28.9,30.4,29.7,32.9,30.1,31.5,28.7,32.1,29.6,34.1,30.8,28.8,33.2,29.2,32.6,28.5,30.3][i],check:10500+(i*370)%4300,guests:225+(i*29)%210,staff:28+(i%5)*4,status:[2,6,14,18].includes(i)?'risk':[1,4,8,10,12,17,19].includes(i)?'warn':'ok'}));
const stock=[
 {id:'s1',name:'Лосось охлаждённый',cat:'Рыба',unit:'кг',balance:218,days:0.4,min:310,price:5750,delta:14,supplier:'Ocean Fish KZ'},
 {id:'s2',name:'Куриное филе',cat:'Мясо',unit:'кг',balance:486,days:1.2,min:620,price:1780,delta:6,supplier:'FoodMaster Trade'},
 {id:'s3',name:'Говядина мякоть',cat:'Мясо',unit:'кг',balance:740,days:2.1,min:680,price:3450,delta:4,supplier:'Qazaq Meat'},
 {id:'s4',name:'Рис басмати',cat:'Бакалея',unit:'кг',balance:2140,days:8,min:1300,price:920,delta:-3,supplier:'Asia Grain'},
 {id:'s5',name:'Шафран',cat:'Специи',unit:'кг',balance:4.2,days:3,min:6,price:98500,delta:9,supplier:'Silk Road Spices'},
 {id:'s6',name:'Томаты',cat:'Овощи',unit:'кг',balance:895,days:2.8,min:720,price:780,delta:-7,supplier:'Green Market'},
 {id:'s7',name:'Масло сливочное',cat:'Молочное',unit:'кг',balance:178,days:4.2,min:150,price:3250,delta:2,supplier:'FoodMaster'},
 {id:'s8',name:'Баранина',cat:'Мясо',unit:'кг',balance:392,days:1.7,min:450,price:3980,delta:11,supplier:'Et Market'},
 {id:'s9',name:'Баклажаны',cat:'Овощи',unit:'кг',balance:325,days:3.6,min:260,price:1120,delta:1,supplier:'Green Market'},
 {id:'s10',name:'Лепёшка тандырная',cat:'Выпечка',unit:'шт',balance:1640,days:1.1,min:1800,price:115,delta:0,supplier:'Собственное производство'}
];
const dishes=[
 {id:'d1',name:'Плов «Шафран»',cat:'Горячее',price:6900,cost:2190,sales:3240,trend:12,label:'Хит',ingredients:[['s3',0.18],['s4',0.16],['s5',0.001],['s6',0.08]]},
 {id:'d2',name:'Стейк из лосося',cat:'Горячее',price:8900,cost:3840,sales:1180,trend:-4,label:'Пересмотреть',ingredients:[['s1',0.22],['s7',0.02],['s6',0.12]]},
 {id:'d3',name:'Манты с говядиной',cat:'Горячее',price:5900,cost:2560,sales:2490,trend:7,label:'Хит',ingredients:[['s3',0.2],['s10',0.5]]},
 {id:'d4',name:'Салат с баклажанами',cat:'Салаты',price:4700,cost:1870,sales:1940,trend:18,label:'Рост',ingredients:[['s9',0.18],['s6',0.1]]},
 {id:'d5',name:'Шашлык из баранины',cat:'Мангал',price:7200,cost:3180,sales:2210,trend:3,label:'Стабильно',ingredients:[['s8',0.24],['s6',0.08]]},
 {id:'d6',name:'Суп шурпа',cat:'Супы',price:4400,cost:1380,sales:1670,trend:5,label:'Маржинально',ingredients:[['s8',0.13],['s6',0.1]]}
];
const campaigns=[
 {id:'c1',name:'Семейный ужин',channel:'Meta Ads',spend:4200000,reach:1840000,bookings:2140,visits:1819,revenue:28900000,trend:-27,status:'risk'},
 {id:'c2',name:'Бизнес-ланч',channel:'Instagram + TikTok',spend:2800000,reach:1290000,bookings:1870,visits:1664,revenue:21300000,trend:18,status:'ok'},
 {id:'c3',name:'День рождения в Шафран',channel:'CRM + WhatsApp',spend:780000,reach:114000,bookings:740,visits:682,revenue:14800000,trend:31,status:'ok'},
 {id:'c4',name:'Новый ресторан · Астана',channel:'Google + 2GIS',spend:1950000,reach:620000,bookings:910,visits:776,revenue:10700000,trend:6,status:'warn'}
];
const integrations=[
 {id:'iiko',name:'iiko',scope:'Продажи, чеки, склад, техкарты',status:'connected',last:'2 мин назад',events:18432},
 {id:'crm',name:'Собственная CRM',scope:'Гости, брони, история касаний',status:'connected',last:'1 мин назад',events:3842},
 {id:'onec',name:'1С / бухгалтерия',scope:'Проводки, выплаты, налоги',status:'connected',last:'14 мин назад',events:1260},
 {id:'meta',name:'Meta / Instagram',scope:'Реклама, контент, лиды',status:'connected',last:'8 мин назад',events:2470},
 {id:'kaspi',name:'Kaspi / банки',scope:'Платежи, сверка, cash flow',status:'pending',last:'Ожидает доступа',events:0},
 {id:'ai',name:'AI-агенты',scope:'Аналитика, прогноз, действия',status:'connected',last:'сейчас',events:538}
];
const tasks=[
 {id:'t1',title:'Разобрать фудкост ресторана Арбат',type:'Критично',owner:'Региональный управляющий',due:'Сегодня · 14:00',status:'open',source:'AI: фудкост 34,8%'},
 {id:'t2',title:'Согласовать закуп лосося 310 кг',type:'Закуп',owner:'Руководитель снабжения',due:'Сегодня · 12:30',status:'open',source:'AI: остаток на 9 часов'},
 {id:'t3',title:'Пересчитать цену стейка из лосося',type:'Меню',owner:'Бренд-шеф',due:'Сегодня · 17:00',status:'progress',source:'AI: сырьё +14%'},
 {id:'t4',title:'Остановить кампанию «Семейный ужин»',type:'Маркетинг',owner:'Head of Marketing',due:'Сегодня · 13:00',status:'open',source:'AI: CPL +27%'},
 {id:'t5',title:'Проверить расхождение кассы · Туран',type:'Финансы',owner:'Финансовый контролёр',due:'Завтра · 10:00',status:'review',source:'Сверка iiko ↔ банк'},
 {id:'t6',title:'Утвердить план открытия ресторана в Актау',type:'Развитие',owner:'Директор по развитию',due:'05 августа',status:'backlog',source:'Проектный офис'},
 {id:'t7',title:'Обновить стандарты подачи бизнес-ланча',type:'Производство',owner:'Бренд-шеф',due:'06 августа',status:'done',source:'Контроль качества'}
];
const pipelines={
 sales:{title:'Продажи и банкеты',kicker:'CRM · ВОРОНКА ПРОДАЖ',description:'От входящего обращения до проведённого банкета и повторной продажи.',unit:'16,4 млн ₸ в активной работе',columns:[['new','Новые лиды'],['qualified','Квалификация'],['proposal','КП отправлено'],['negotiation','Переговоры'],['won','Бронь подтверждена']],cards:[
  {id:'sl1',title:'Корпоративный ужин · BI Group',column:'new',value:'2,8 млн ₸',place:'Шафран · Туран',owner:'Алия С.',due:'Сегодня · 13:30',label:'Корпоратив',contact:'Мадина · +7 701 840 22 16',source:'Instagram',checklist:['Уточнить дату и количество гостей','Зафиксировать формат рассадки','Передать банкетному менеджеру'],done:1},
  {id:'sl2',title:'Свадебный банкет · 180 гостей',column:'qualified',value:'7,2 млн ₸',place:'Шафран · Достык',owner:'Данияр К.',due:'Сегодня · 16:00',label:'Банкет',contact:'Аружан · +7 777 318 44 02',source:'WhatsApp',checklist:['Подтвердить бюджет','Согласовать зал','Собрать меню','Назначить дегустацию'],done:2},
  {id:'sl3',title:'День рождения · 35 гостей',column:'qualified',value:'1,1 млн ₸',place:'Шафран · MEGA',owner:'Жанна Т.',due:'Завтра · 11:00',label:'Событие',contact:'Ермек · +7 702 514 31 28',source:'CRM-реактивация',checklist:['Позвонить гостю','Подобрать пакет'],done:1},
  {id:'sl4',title:'Новогодний пакет · Air Astana',column:'proposal',value:'3,6 млн ₸',place:'Шафран · Арбат',owner:'Руслан М.',due:'04 августа',label:'Корпоратив',contact:'Асем · отдел закупок',source:'Рекомендация',checklist:['КП отправлено','Получить обратную связь','Согласовать договор'],done:1},
  {id:'sl5',title:'Кейтеринг · форум предпринимателей',column:'negotiation',value:'1,7 млн ₸',place:'Выездное обслуживание',owner:'Сауле Н.',due:'05 августа',label:'Кейтеринг',contact:'Тимур · +7 705 440 18 11',source:'Сайт',checklist:['Смета','Логистика','Договор','Предоплата'],done:2},
  {id:'sl6',title:'Юбилей · семья Алиевых',column:'won',value:'890 000 ₸',place:'Шафран · Самал',owner:'Айгуль Р.',due:'09 августа',label:'Оплачено 50%',contact:'Динара · +7 747 183 90 20',source:'Повторный гость',checklist:['Договор','Предоплата','Меню','Сценарий вечера'],done:4}
 ]},
 production:{title:'Производство и кухня',kicker:'ОПЕРАЦИОННАЯ ВОРОНКА',description:'Запуск новинок и производственных партий — от заявки до контроля качества.',unit:'12 процессов · 4 требуют внимания',columns:[['request','Заявка'],['planning','Планирование'],['supply','Снабжение'],['production','В производстве'],['quality','Контроль качества'],['ready','Готово']],cards:[
  {id:'pr1',title:'Сезонное меню · осень 2026',column:'request',value:'18 блюд',place:'Вся сеть',owner:'Бренд-шеф',due:'10 августа',label:'Новое меню',contact:'Инициатор: маркетинг',source:'План развития',checklist:['Концепция','Матрица блюд','Целевой фудкост','Фото-бриф'],done:1},
  {id:'pr2',title:'Партия маринованной баранины',column:'planning',value:'480 кг',place:'Центральный цех',owner:'Шеф производства',due:'Сегодня · 15:00',label:'Цех',contact:'Заявки 18 ресторанов',source:'iiko forecast',checklist:['Сводная заявка','Производственный план','Смена назначена'],done:2},
  {id:'pr3',title:'Заготовки для бизнес-ланча',column:'supply',value:'2 400 порций',place:'Алматы · 8 точек',owner:'Руководитель снабжения',due:'Сегодня · 17:00',label:'Дефицит',contact:'Поставщик: FoodMaster',source:'AI-прогноз',checklist:['Проверить остатки','Заказать сырьё','Подтвердить слот поставки'],done:1},
  {id:'pr4',title:'Плов «Шафран» · центральная заготовка',column:'production',value:'1 100 порций',place:'Центральный цех',owner:'Марат Б.',due:'Сегодня · 19:00',label:'В работе',contact:'Смена №2 · 14 человек',source:'Суточный план',checklist:['Сырьё выдано','Температурная карта','Фасовка','Маркировка'],done:2},
  {id:'pr5',title:'Стейк из лосося · новая техкарта',column:'quality',value:'Фудкост 43,1%',place:'Шафран · Арбат',owner:'Технолог',due:'Сегодня · 18:00',label:'На проверке',contact:'Версия ТК-204.7',source:'Изменение цены сырья',checklist:['Контроль выхода','Дегустация','Расчёт себестоимости','Подпись бренд-шефа'],done:3},
  {id:'pr6',title:'Соус шафрановый · партия №184',column:'ready',value:'320 л',place:'22 ресторана',owner:'Контроль качества',due:'Доставлено',label:'Принято',contact:'QC-акт №581',source:'Производственный план',checklist:['Лаборатория','Фасовка','Маркировка','Распределение'],done:4}
 ]},
 construction:{title:'Открытие новых ресторанов',kicker:'DEVELOPMENT · КАНБАН',description:'Единая воронка строительства: локация, проект, стройка, оснащение и запуск.',unit:'4 проекта · бюджет 3,38 млрд ₸',columns:[['idea','Локация'],['concept','Концепция'],['design','Проектирование'],['build','Строительство'],['equipment','Оснащение'],['opening','Запуск']],cards:[
  {id:'co1',title:'Шафран · Актау, набережная',column:'idea',value:'620 млн ₸',place:'Актау · 1 180 м²',owner:'Директор по развитию',due:'Решение · 08 августа',label:'Go / No-Go',contact:'Арендодатель: Caspian Group',source:'Карта развития',checklist:['Трафик и конкуренты','Финмодель','Условия аренды','Технический аудит'],done:2},
  {id:'co2',title:'Шафран · Астана, Expo',column:'concept',value:'780 млн ₸',place:'Астана · 1 420 м²',owner:'Проектный директор',due:'15 августа',label:'Концепция',contact:'Архитектор: Forma Bureau',source:'Инвесткомитет',checklist:['Планировочное решение','Концепт кухни','Гостевой путь','Бренд-дизайн'],done:2},
  {id:'co3',title:'Шафран · Шымкент Plaza',column:'design',value:'690 млн ₸',place:'Шымкент · 1 260 м²',owner:'Главный инженер',due:'28 августа',label:'РД',contact:'Генпроектировщик: Archline',source:'Утверждённый CAPEX',checklist:['АР','ОВиК','ЭОМ','ВК','Согласование ТРЦ'],done:3},
  {id:'co4',title:'Шафран · Алматы, Аль-Фараби',column:'build',value:'940 млн ₸',place:'Алматы · 1 580 м²',owner:'Руководитель строительства',due:'Открытие · 12 октября',label:'62% готово',contact:'Генподрядчик: Bazis Build',source:'Стройконтроль',checklist:['Демонтаж','Инженерные сети','Черновая отделка','Чистовая отделка','Авторский надзор'],done:3},
  {id:'co5',title:'Шафран · Караганда City Mall',column:'equipment',value:'350 млн ₸',place:'Караганда · 980 м²',owner:'Менеджер запуска',due:'Открытие · 26 августа',label:'88% готово',contact:'Поставки: 14 контрагентов',source:'Чек-лист открытия',checklist:['Кухонное оборудование','Мебель','IT и iiko','Посуда','Приёмка'],done:4},
  {id:'co6',title:'Шафран · Атырау Riverside',column:'opening',value:'Открытие 9 августа',place:'Атырау · 1 110 м²',owner:'Операционный директор',due:'6 дней',label:'Soft opening',contact:'Команда: 86 из 92',source:'Штаб открытия',checklist:['Найм','Обучение','Тест кухни','Маркетинг открытия','Soft opening'],done:3}
 ]}
};
window.SHAFRAN_DATA={restaurants,stock,dishes,campaigns,integrations,tasks,pipelines};
})();
