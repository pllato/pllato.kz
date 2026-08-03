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
 {id:'t5',title:'Проверить расхождение кассы · Туран',type:'Финансы',owner:'Финансовый контролёр',due:'Завтра · 10:00',status:'open',source:'Сверка iiko ↔ банк'}
];
window.SHAFRAN_DATA={restaurants,stock,dishes,campaigns,integrations,tasks};
})();
