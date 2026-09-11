/* Цветочная сеть · CRM вместо amoCRM — демо по встрече 11.09.2026 (Сергей) */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const pct=(a,b)=>num(a/b*100)+'%';

/* ===== РОЛИ ===== */
const ROLES={
 'Руководитель продаж':{av:'СР',n:'Сергей',r:'продажи и CRM',note:'Воронка, квалификация, аналитика, KPI и настройки — вся картина продаж',
  s:['dash','path','analytics','inbox','funnel','qual','clients','loyal','orders','delivery','branches','kpi','tasks','settings','posi','wa','tel','import','economy']},
 'Владелец':{av:'ВЛ',n:'Владелец',r:'сеть',note:'Деньги, филиалы, план и стоимость владения системой',
  s:['dash','analytics','economy','kpi','branches','funnel','clients','procure','stock','users','stack']},
 'Менеджер филиала':{av:'АС',n:'Асем',r:'филиал Центральный',note:'Свои сделки, переписка, заказы и клиенты своего филиала',
  s:['inbox','funnel','qual','clients','loyal','orders','delivery','tasks']},
 'Флорист':{av:'ГМ',n:'Гульмира',r:'сборка букетов',note:'Очередь на сборку, фото готового букета, остатки и списание',
  s:['florist','orders','stock','procure','tasks']},
 'Курьер':{av:'ДН',n:'Данияр',r:'доставка',note:'Маршрут на день, статусы вручения и фото получателя',
  s:['delivery','orders','tasks']},
 'Администратор системы':{av:'ЕР',n:'Ерлан',r:'настройки',note:'Воронки, поля, права и интеграции — меняются без разработчика',
  s:['settings','users','posi','wa','tel','import','branches','stack']}
};
let role='Руководитель продаж',cur='dash',theme='light',scope='all';

/* ===== МЕНЮ ===== */
const NAV=[
 ['ГЛАВНОЕ',[['dash','◧','Пульт сети'],['path','⇄','Путь заказа',1],['analytics','◲','Аналитика']]],
 ['ПРОДАЖИ',[['inbox','✉','Обращения',7],['funnel','▦','Воронка сделок',26],['qual','✔','Квалификация'],['clients','☺','Клиенты и поводы'],['loyal','♥','Лояльность']]],
 ['ЗАКАЗЫ',[['orders','✿','Заказы'],['florist','✄','Сборка · флористы',5],['delivery','⇢','Доставка',4],['branches','⌂','Филиалы']]],
 ['СКЛАД',[['stock','▥','Остатки и списание',3],['procure','⇩','Закуп и поставки']]],
 ['ИНТЕГРАЦИИ',[['posi','⇆','Посифлора'],['wa','✆','WhatsApp и Instagram'],['tel','☎','Телефония'],['import','⇪','Перенос из amoCRM']]],
 ['УПРАВЛЕНИЕ',[['kpi','★','План и KPI'],['tasks','☑','Задачи',4],['settings','⚙','Настройки'],['users','◍','Роли и доступы'],['economy','₸','Экономика перехода'],['stack','⛭','Архитектура']]]
];
const TITLES={
 dash:['Пульт сети','Обращения, сделки, выручка и филиалы за сентябрь — одной картиной'],
 path:['Путь заказа','От сообщения в WhatsApp до закрытой сделки в аналитике: что система делает сама'],
 analytics:['Аналитика','Причины отказа, источники, каналы и конверсия — из полей квалификации, без ручных отчётов'],
 inbox:['Обращения','WhatsApp, Instagram, звонки и сайт одной лентой — канал определяется сам'],
 funnel:['Воронка сделок','Ваши статусы: новая заявка → первое касание → подборка → … → рабочий этап'],
 qual:['Квалификация','Сделка не закрывается, пока не заполнены причина, бюджет, источник и способ оплаты'],
 clients:['Клиенты и поводы','История заказов, любимые цветы, дни рождения и годовщины — с напоминанием заранее'],
 loyal:['Лояльность','Повторные продажи, скидки и напоминания о поводах по базе'],
 orders:['Заказы','Дата и время доставки, получатель, открытка, фото собранного букета'],
 florist:['Сборка · флористы','Очередь на сборку по филиалам: что собирается сейчас и к какому времени'],
 delivery:['Доставка','Маршрут курьера на день, статусы вручения и подтверждение фото'],
 branches:['Филиалы','Восемь точек: план и факт, менеджеры, загрузка и остатки'],
 stock:['Остатки и списание','Цветок — скоропорт: что в холодильнике, что списано и на какую сумму'],
 procure:['Закуп и поставки','Заявки поставщикам по расходу и приход на филиалы'],
 posi:['Посифлора','Обмен с вашей учётной системой: что забираем, что отдаём и что делаем при закрытом API'],
 wa:['WhatsApp и Instagram','Переписка внутри сделки, канал проставляется автоматически'],
 tel:['Телефония','Звонки с записью, привязка к клиенту и сделке, пропущенные без ответа'],
 import:['Перенос из amoCRM','Сделки, контакты, переписка и файлы переезжают вместе с историей'],
 kpi:['План и KPI','План по сети, филиалам и менеджерам — считается по закрытым сделкам'],
 tasks:['Задачи','Поручения и рабочий этап: то, что сейчас живёт в рабочих чатах'],
 settings:['Настройки','Воронки, поля, причины отказа и права — меняете сами, без обращения к разработчику'],
 users:['Роли и доступы','Кто что видит: чужие сделки, деньги и настройки'],
 economy:['Экономика перехода','Сколько платите сейчас, сколько будете платить и когда разработка окупится'],
 stack:['Архитектура','Где живёт система, что передаём и как её развивать дальше']
};

/* ===== ДАННЫЕ ===== */
const BR=[
 {n:'Центральный',o:318,avg:22400,m:['Асем','Жанна'],plan:7000000},
 {n:'Абая',o:276,avg:19800,m:['Дина','Айгерим'],plan:5600000},
 {n:'Достык',o:264,avg:24100,m:['Мадина','Алия'],plan:6200000},
 {n:'Сайран',o:212,avg:15900,m:['Нургуль','Сая'],plan:3600000},
 {n:'Аксай',o:198,avg:14700,m:['Камила','Аружан'],plan:3100000},
 {n:'Орбита',o:186,avg:16200,m:['Зарина','Балжан'],plan:3200000},
 {n:'Алмагуль',o:224,avg:17500,m:['Гульмира','Лаура'],plan:4100000},
 {n:'Мега',o:164,avg:21300,m:['Толкын','Динара'],plan:3700000}
];
BR.forEach(b=>{b.rev=b.o*b.avg});
const F={
 leads:3480, work:312, won:1842, lost:1326,
 get rev(){return BR.reduce((a,b)=>a+b.rev,0)},
 get avg(){return this.rev/this.won},
 get plan(){return BR.reduce((a,b)=>a+b.plan,0)},
 branches:BR.length, managers:BR.length*2
};
const CH=[['wa','WhatsApp',2118],['ig','Instagram',835],['tel','Звонки',348],['site','Сайт и 2ГИС',179]];
const CHN={wa:'WhatsApp',ig:'Instagram',tel:'Звонок',site:'Сайт'};
const REASONS=[['Дорого',312],['Клиент передумал',268],['Нет нужных цветов',196],['Не устроила дата и время',171],['Игнор · не вышел на связь',158],['Купил у конкурента',121],['Перенёс повод',64],['Дубль заявки',36]];
const SRC=[['Instagram · реклама',1042],['Повторный клиент',884],['Поиск и карты',612],['Рекомендация',487],['2ГИС',268],['Наружная реклама',187]];
const DLV=[['Курьер по городу',1284],['Самовывоз из филиала',402],['Доставка в область',96],['Забрал получатель',60]];
const PAY=[['Kaspi перевод',812],['Kaspi QR в филиале',486],['Карта на сайте',271],['Наличные',198],['Счёт юрлицу',75]];
const OCC=[['День рождения',612],['Без повода · порадовать',398],['Годовщина',286],['Выписка из роддома',171],['Свадьба',148],['Похороны',124],['Корпоративный заказ',103]];

const ST=[
 ['new','Новая заявка','#9b8692'],['first','Первое касание','#2f6fb8'],['pick','Подборка','#7c5bd6'],
 ['sent','Отправлены варианты','#2f6fb8'],['push','Игнор · дожим','#d98324'],['bill','Счёт выставлен','#d98324'],
 ['pre','Предзаказ','#bf2f6d'],['florist','Передан флористу','#3c8d59'],['courier','Передан курьеру','#3c8d59'],
 ['work','Рабочий этап','#2f6fb8']
];
const STN=Object.fromEntries(ST.map(s=>[s[0],s[1]]));

let DEALS=[
 {id:'D-4821',c:'Айгуль Сериковна',s:'new',ch:'wa',br:'Центральный',mg:'Асем',sum:24000,occ:'День рождения',when:'12.09 14:00',src:'Instagram · реклама'},
 {id:'D-4822',c:'Марат Ж.',s:'new',ch:'ig',br:'Достык',mg:'Мадина',sum:18000,occ:'Без повода',when:'12.09 18:00',src:'Instagram · реклама'},
 {id:'D-4823',c:'ТОО «Алтын»',s:'new',ch:'tel',br:'Центральный',mg:'Жанна',sum:96000,occ:'Корпоративный заказ',when:'15.09 09:00',src:'Повторный клиент'},
 {id:'D-4810',c:'Динара К.',s:'first',ch:'wa',br:'Абая',mg:'Дина',sum:15000,occ:'Годовщина',when:'12.09 12:00',src:'Поиск и карты'},
 {id:'D-4811',c:'Ерлан Т.',s:'first',ch:'wa',br:'Сайран',mg:'Нургуль',sum:12000,occ:'День рождения',when:'13.09 11:00',src:'2ГИС'},
 {id:'D-4796',c:'Сауле А.',s:'pick',ch:'ig',br:'Достык',mg:'Алия',sum:32000,occ:'Свадьба',when:'19.09 10:00',src:'Рекомендация'},
 {id:'D-4797',c:'Алма Б.',s:'pick',ch:'wa',br:'Алмагуль',mg:'Лаура',sum:21000,occ:'Выписка из роддома',when:'12.09 16:30',src:'Повторный клиент'},
 {id:'D-4798',c:'Нурлан С.',s:'pick',ch:'wa',br:'Мега',mg:'Толкын',sum:27000,occ:'День рождения',when:'14.09 13:00',src:'Instagram · реклама'},
 {id:'D-4780',c:'Жанар М.',s:'sent',ch:'ig',br:'Центральный',mg:'Асем',sum:19500,occ:'Без повода',when:'12.09 19:00',src:'Instagram · реклама'},
 {id:'D-4781',c:'Аскар К.',s:'sent',ch:'wa',br:'Орбита',mg:'Зарина',sum:16000,occ:'Годовщина',when:'13.09 15:00',src:'Поиск и карты'},
 {id:'D-4782',c:'Гүлнар О.',s:'sent',ch:'wa',br:'Аксай',mg:'Камила',sum:14000,occ:'День рождения',when:'13.09 10:00',src:'Рекомендация'},
 {id:'D-4762',c:'Бекзат Н.',s:'push',ch:'ig',br:'Абая',mg:'Айгерим',sum:23000,occ:'День рождения',when:'11.09 —',src:'Instagram · реклама',late:1},
 {id:'D-4763',c:'Лаура Ж.',s:'push',ch:'wa',br:'Сайран',mg:'Сая',sum:11000,occ:'Без повода',when:'10.09 —',src:'2ГИС',late:1},
 {id:'D-4750',c:'Асель Р.',s:'bill',ch:'wa',br:'Центральный',mg:'Жанна',sum:38000,occ:'Свадьба',when:'20.09 09:00',src:'Рекомендация'},
 {id:'D-4751',c:'ИП Кайрат',s:'bill',ch:'tel',br:'Достык',mg:'Мадина',sum:145000,occ:'Корпоративный заказ',when:'16.09 08:00',src:'Повторный клиент'},
 {id:'D-4740',c:'Сандугаш Е.',s:'pre',ch:'wa',br:'Алмагуль',mg:'Гульмира',sum:26000,occ:'День рождения',when:'18.09 12:00',src:'Повторный клиент'},
 {id:'D-4741',c:'Айдос М.',s:'pre',ch:'ig',br:'Мега',mg:'Динара',sum:31000,occ:'Годовщина',when:'21.09 17:00',src:'Instagram · реклама'},
 {id:'D-4742',c:'Камила Т.',s:'pre',ch:'wa',br:'Абая',mg:'Дина',sum:17500,occ:'Выписка из роддома',when:'17.09 11:00',src:'Поиск и карты'},
 {id:'D-4730',c:'Мадина А.',s:'florist',ch:'wa',br:'Центральный',mg:'Асем',sum:22000,occ:'День рождения',when:'11.09 15:00',src:'Повторный клиент'},
 {id:'D-4731',c:'Рустем Б.',s:'florist',ch:'ig',br:'Достык',mg:'Алия',sum:28500,occ:'Без повода',when:'11.09 16:00',src:'Instagram · реклама'},
 {id:'D-4732',c:'Айым С.',s:'florist',ch:'wa',br:'Орбита',mg:'Балжан',sum:13500,occ:'День рождения',when:'11.09 17:30',src:'Рекомендация'},
 {id:'D-4720',c:'Тимур Н.',s:'courier',ch:'wa',br:'Центральный',mg:'Жанна',sum:19000,occ:'Годовщина',when:'11.09 14:30',src:'Повторный клиент'},
 {id:'D-4721',c:'Гүлмира К.',s:'courier',ch:'tel',br:'Алмагуль',mg:'Лаура',sum:24500,occ:'Похороны',when:'11.09 13:00',src:'Поиск и карты'},
 {id:'D-4710',c:'Санжар А.',s:'work',ch:'wa',br:'Аксай',mg:'Аружан',sum:29000,occ:'Свадьба',when:'25.09 10:00',src:'Рекомендация'},
 {id:'D-4711',c:'ТОО «Астана Строй»',s:'work',ch:'tel',br:'Достык',mg:'Мадина',sum:210000,occ:'Корпоративный заказ',when:'30.09 09:00',src:'Повторный клиент'},
 {id:'D-4712',c:'Индира Ж.',s:'work',ch:'ig',br:'Мега',mg:'Толкын',sum:18500,occ:'День рождения',when:'22.09 18:00',src:'Instagram · реклама'}
];

const CLIENTS=[
 {n:'Айгуль Сериковна',ph:'+7 701 ••• 21 40',orders:14,sum:268000,last:'02.09',occ:'ДР дочери · 14.09',fav:'Пионовидные розы, персиковый',ch:'wa',seg:'Постоянный'},
 {n:'Марат Ж.',ph:'+7 707 ••• 88 12',orders:9,sum:171000,last:'28.08',occ:'Годовщина · 03.10',fav:'Белые розы, минимализм',ch:'ig',seg:'Постоянный'},
 {n:'ТОО «Алтын»',ph:'+7 727 ••• 10 05',orders:22,sum:1840000,last:'05.09',occ:'Корпоративные даты',fav:'Композиции в коробках',ch:'tel',seg:'B2B'},
 {n:'Сауле А.',ph:'+7 705 ••• 33 71',orders:3,sum:61000,last:'19.08',occ:'Свадьба · 19.09',fav:'Гортензия, пастель',ch:'ig',seg:'Новый'},
 {n:'Динара К.',ph:'+7 747 ••• 09 62',orders:6,sum:94000,last:'30.08',occ:'ДР мужа · 21.09',fav:'Тюльпаны весной',ch:'wa',seg:'Постоянный'},
 {n:'Ерлан Т.',ph:'+7 700 ••• 45 18',orders:2,sum:23000,last:'11.07',occ:'—',fav:'Бюджет до 15 000',ch:'wa',seg:'Спящий'},
 {n:'Алма Б.',ph:'+7 708 ••• 77 30',orders:11,sum:212000,last:'06.09',occ:'Выписка · 12.09',fav:'Нежные, без лилий',ch:'wa',seg:'Постоянный'},
 {n:'ИП Кайрат',ph:'+7 701 ••• 55 04',orders:17,sum:1320000,last:'04.09',occ:'Офис еженедельно',fav:'Свежесрезанные, вторник',ch:'tel',seg:'B2B'}
];

const ORDERS=[
 {id:'З-1841',cl:'Мадина А.',br:'Центральный',when:'11.09 15:00',to:'Айсулу (получатель)',addr:'ул. Абая 145, кв. 32',card:'С днём рождения! Пусть всё сбудется',sum:22000,st:'Собирается',fl:'Гульмира'},
 {id:'З-1842',cl:'Рустем Б.',br:'Достык',when:'11.09 16:00',to:'Лично в руки',addr:'пр. Достык 89, офис 401',card:'Просто так',sum:28500,st:'Собирается',fl:'Лаура'},
 {id:'З-1843',cl:'Айым С.',br:'Орбита',when:'11.09 17:30',to:'Дана',addr:'мкр. Орбита-3, д. 12',card:'С праздником!',sum:13500,st:'В очереди',fl:'—'},
 {id:'З-1839',cl:'Тимур Н.',br:'Центральный',when:'11.09 14:30',to:'Асем',addr:'ул. Сатпаева 30',card:'Люблю. Спасибо за 7 лет',sum:19000,st:'У курьера',fl:'Гульмира'},
 {id:'З-1840',cl:'Гүлмира К.',br:'Алмагуль',when:'11.09 13:00',to:'Ритуальный зал',addr:'ул. Рыскулова 12',card:'Без открытки',sum:24500,st:'Вручено',fl:'Лаура'},
 {id:'З-1838',cl:'Алма Б.',br:'Алмагуль',when:'12.09 16:30',to:'Роддом №2, палата 7',addr:'ул. Жандосова 3',card:'С новорождённой!',sum:21000,st:'Предзаказ',fl:'—'},
 {id:'З-1837',cl:'Айгуль Сериковна',br:'Центральный',when:'12.09 14:00',to:'Дочь Амина',addr:'ул. Толе би 55, кв. 9',card:'Самой любимой',sum:24000,st:'Предзаказ',fl:'—'}
];

const STOCK=[
 {n:'Роза Эквадор 60 см',u:'шт',q:840,min:600,life:'7 дней',price:620,br:'склад сети'},
 {n:'Роза пионовидная',u:'шт',q:210,min:250,life:'5 дней',price:1450,br:'склад сети',low:1},
 {n:'Гортензия',u:'шт',q:96,min:120,life:'4 дня',price:2100,br:'склад сети',low:1},
 {n:'Тюльпан микс',u:'шт',q:1240,min:800,life:'6 дней',price:280,br:'склад сети'},
 {n:'Эустома',u:'шт',q:320,min:300,life:'6 дней',price:540,br:'склад сети'},
 {n:'Хризантема кустовая',u:'шт',q:184,min:200,life:'9 дней',price:390,br:'склад сети',low:1},
 {n:'Упаковка крафт',u:'лист',q:1420,min:500,life:'—',price:110,br:'склад сети'},
 {n:'Лента атласная',u:'м',q:680,min:300,life:'—',price:45,br:'склад сети'}
];

const TASKS=[
 {id:'T-312',t:'Перезвонить по зависшим сделкам «Игнор · дожим»',who:'Асем',due:'11.09',pr:'high',col:'today'},
 {id:'T-313',t:'Согласовать макет открытки для корпоративного заказа',who:'Жанна',due:'12.09',pr:'mid',col:'today'},
 {id:'T-314',t:'Проверить остаток гортензии перед свадебным заказом',who:'Гульмира',due:'12.09',pr:'high',col:'week'},
 {id:'T-315',t:'Собрать обратную связь по доставке за неделю',who:'Сергей',due:'15.09',pr:'low',col:'week'},
 {id:'T-316',t:'Обзвонить спящих клиентов с прошлого сентября',who:'Дина',due:'16.09',pr:'mid',col:'week'},
 {id:'T-317',t:'Свести причины отказа за месяц с руководителями филиалов',who:'Сергей',due:'30.09',pr:'mid',col:'later'}
];

/* ===== СОСТОЯНИЕ ЭКРАНОВ ===== */
let tight=true, fBr='all', pathStep=0;
let QUAL={won:F.won,lost:F.lost,r:REASONS.map(r=>r[1])};
let ECON={amo:180000,wa:55000,posi:200000,dev:1500000,host:45000};

/* ===== ЭКРАНЫ ===== */
const SC={};

SC.dash=()=>{
 const conv=F.won/F.leads*100;
 return `
 <div class="head"><div><h2>Пульт сети · сентябрь 2026</h2>
  <p>Одна картина по восьми филиалам: сколько пришло обращений, сколько дошло до оплаты, сколько денег и где провал. Цифры собираются из сделок и заказов — никто не сводит их руками в таблице.</p></div>
  <div class="btns"><button class="btn acc" onclick="go('path')">Показать путь заказа →</button><button class="btn" onclick="go('analytics')">Аналитика</button></div></div>
 <div class="strip">
  <div><small>ОБРАЩЕНИЙ</small><b>${fmt(F.leads)}</b><span>WhatsApp, Instagram, звонки, сайт</span></div>
  <div><small>В РАБОТЕ</small><b class="a">${fmt(F.work)}</b><span>сделки в открытых статусах</span></div>
  <div><small>РЕАЛИЗОВАНО</small><b class="g">${fmt(F.won)}</b><span class="g">конверсия ${num(conv)}%</span></div>
  <div><small>ВЫРУЧКА</small><b>${fmt(F.rev)} ₸</b><span>план ${fmt(F.plan)} ₸ · ${pct(F.rev,F.plan)}</span></div>
  <div><small>СРЕДНИЙ ЧЕК</small><b class="v">${fmt(F.avg)} ₸</b><span>по закрытым сделкам</span></div>
 </div>
 <div class="g21">
  <div class="panel">
   <div class="ph"><div><div class="ph-title">Выручка по филиалам</div><div class="ph-sub">факт против плана · клик по строке открывает филиал</div></div>
    <button class="btn" onclick="go('branches')">Все филиалы</button></div>
   ${BR.map(b=>`<div class="fr" onclick="openBranch('${esc(b.n)}')" style="cursor:pointer">
     <span>${esc(b.n)}<div class="sub">${b.o} заказов · ${b.m.join(', ')}</div></span>
     <div class="bar" style="--w:${Math.min(100,b.rev/b.plan*100)}%"><i class="${b.rev>=b.plan?'g':''}"></i></div>
     <b style="color:${b.rev>=b.plan?'var(--green)':'var(--muted)'}">${fmt(b.rev/1000)} тыс</b></div>`).join('')}
   <div class="note" style="--tone:var(--amber)"><b>Три филиала не добирают план</b>
    <p>Сайран, Аксай и Орбита — здесь же видно, что у них ниже средний чек. Система не просто показывает отставание, а даёт разрез: меньше заказов или дешевле букет.</p></div>
  </div>
  <div class="panel">
   <div class="ph-title">Откуда пришли обращения</div>
   <div class="ph-sub" style="margin-bottom:10px">канал проставляется системой, а не менеджером вручную</div>
   ${CH.map(([k,n,v])=>`<div class="fr">
     <span><span class="ch ${k}">${esc(n)}</span></span>
     <div class="bar" style="--w:${v/F.leads*100}%"><i class="${k==='wa'?'g':k==='tel'?'b':''}"></i></div>
     <b>${fmt(v)} · ${pct(v,F.leads)}</b></div>`).join('')}
   <div class="kv" style="margin-top:10px"><span>Сделок в работе дольше 3 дней</span><b style="color:var(--red)">41</b></div>
   <div class="kv"><span>Заказов на доставку сегодня</span><b>38</b></div>
   <div class="kv"><span>Повторных клиентов в месяце</span><b>${pct(884,F.leads)}</b></div>
   <div class="hint">Вы говорили: «нужно, чтобы канал ставился сам — WhatsApp или Instagram, в зависимости от того, где переписываются». Это поле заполняется в момент создания сделки и потом живёт в аналитике.</div>
  </div>
 </div>
 <div class="panel">
  <div class="ph-title">Воронка по этапам</div><div class="ph-sub" style="margin-bottom:10px">где теряются заявки — по вашим статусам</div>
  <div class="flow">
   ${[['3 480','Новая заявка','все обращения месяца'],['2 914','Первое касание','дозвонились и ответили'],
      ['2 402','Подборка и варианты','отправили предложение'],['2 086','Счёт и предзаказ','договорились о сумме'],
      ['1 842','Реализовано','оплачено и доставлено']].map((x,i)=>
    `<div class="fb ${i===4?'on':''}"><code>ЭТАП ${i+1}</code><b>${x[0]}</b><p>${x[1]}<br>${x[2]}</p></div>`).join('')}
  </div>
  <div class="note" style="--tone:var(--red)"><b>Самая большая потеря — между первым касанием и подборкой</b>
   <p>512 заявок не дошли до предложения. Причины видны в квалификации: «нет нужных цветов» и «не устроила дата и время». Это уже не ощущение, а цифра, с которой можно работать.</p></div>
 </div>`};

/* ---- ПУТЬ ЗАКАЗА ---- */
const PATH=[
 ['Сообщение в WhatsApp','Клиент пишет на рабочий номер филиала: «Нужен букет на день рождения, завтра к 14:00, бюджет до 25 000».','Сделка создана автоматически, канал — WhatsApp, филиал определён по номеру, менеджер назначен по очереди.','Система'],
 ['Клиент опознан','Номер уже есть в базе: Айгуль Сериковна, 14 заказов на 268 000 ₸, любит пионовидные розы, не любит лилии.','Карточка подтянулась вместе с историей и поводами. Менеджер не спрашивает заново то, что уже знает компания.','Система'],
 ['Первое касание','Менеджер отвечает из карточки сделки — переписка остаётся в системе, а не в личном телефоне.','Статус перешёл в «Первое касание», время ответа зафиксировано: 2 минуты 40 секунд.','Асем · менеджер'],
 ['Подборка','Три варианта из каталога с ценой и фактическим наличием по филиалу.','Позиции и остатки — из Посифлоры. Менеджер не обещает то, чего нет в холодильнике.','Асем · менеджер'],
 ['Счёт и оплата','Клиент выбрал вариант за 24 000 ₸, менеджер отправил ссылку Kaspi прямо в переписку.','Оплата вернулась в сделку сама: статус «Счёт выставлен» → «Предзаказ», вид оплаты «Kaspi перевод» заполнен без менеджера.','Система'],
 ['Заказ оформлен','Дата и время доставки, адрес, имя получателя, текст открытки, пожелания по цветам.','Заказ ушёл в филиал Центральный, флорист увидел его в очереди на сборку со сроком «к 13:30».','Асем · менеджер'],
 ['Сборка букета','Флорист собрал, сфотографировал и отметил готовность.','Фото ушло заказчику в WhatsApp автоматически. Списание цветов с остатка прошло по составу букета.','Гульмира · флорист'],
 ['Доставка','Курьер видит адрес и время в телефоне, отмечает «вручено» и прикладывает фото.','Заказчику пришло уведомление о вручении. Статус сделки — «Рабочий этап» закрыт.','Данияр · курьер'],
 ['Сделка закрыта','Менеджер закрывает сделку: успешно, бюджет 24 000 ₸, источник «Повторный клиент», канал WhatsApp, доставка курьером, оплата Kaspi.','Все поля уже заполнены системой — менеджеру осталось подтвердить. Сделка попала в аналитику, в план филиала и в KPI менеджера.','Система']
];
SC.path=()=>{
 const auto=PATH.filter((_,i)=>i<=pathStep&&PATH[i][3]==='Система').length;
 return `
 <div class="head"><div><h2>Путь заказа</h2>
  <p>Вы спросили на встрече: «а это всё автоматизируете?». Вот ответ по шагам — что делает менеджер, а что система. Нажимайте «Следующий шаг».</p></div>
  <div class="btns">
   <button class="btn acc" onclick="pathNext()">${pathStep>=PATH.length-1?'Пройти заново':'Следующий шаг →'}</button>
   <button class="btn" onclick="pathReset()">Сбросить</button></div></div>
 <div class="strip">
  <div><small>ШАГ</small><b class="a">${pathStep+1} из ${PATH.length}</b><span>${esc(PATH[pathStep][0])}</span></div>
  <div><small>СДЕЛАЛА СИСТЕМА</small><b class="g">${auto}</b><span>шагов без участия человека</span></div>
  <div><small>УЧАСТИЕ ЧЕЛОВЕКА</small><b>${pathStep+1-auto}</b><span>ответ, подборка, сборка, доставка</span></div>
  <div><small>ВРЕМЯ ОТВЕТА</small><b>2:40</b><span>фиксируется на каждом касании</span></div>
  <div><small>СУММА СДЕЛКИ</small><b>24 000 ₸</b><span>Kaspi перевод</span></div>
 </div>
 <div class="g21">
  <div class="panel">
   <div class="ph-title">Хронология сделки D-4830</div><div class="ph-sub" style="margin-bottom:12px">Айгуль Сериковна · филиал Центральный · менеджер Асем</div>
   <div class="tl">
    ${PATH.map((p,i)=>`<div class="tli ${i<=pathStep?'on':''}" style="${i>pathStep?'opacity:.42':''}">
      <span class="who">${esc(p[3])}</span>
      <b>${i+1}. ${esc(p[0])}</b>
      <p>${esc(p[1])}</p>
      ${i<=pathStep?`<div class="note" style="--tone:${p[3]==='Система'?'var(--green)':'var(--acc)'};margin-top:6px"><p>${esc(p[2])}</p></div>`:''}
     </div>`).join('')}
   </div>
  </div>
  <div>
   <div class="panel">
    <div class="ph-title">Что заполнилось само</div><div class="ph-sub" style="margin-bottom:8px">поля квалификации к моменту закрытия</div>
    ${[['Канал','WhatsApp',1],['Филиал','Центральный',1],['Менеджер','Асем',1],['Источник заявки','Повторный клиент',pathStep>=1],
       ['Бюджет','24 000 ₸',pathStep>=4],['Вид оплаты','Kaspi перевод',pathStep>=4],['Способ доставки','Курьер по городу',pathStep>=7],
       ['Дата заказа','11.09.2026',1],['Повод','День рождения',pathStep>=5]].map(([k,v,on])=>
     `<div class="kv"><span>${esc(k)}</span><b style="color:${on?'var(--green)':'var(--muted2)'}">${on?esc(v):'—'}</b></div>`).join('')}
    <div class="hint">Именно эти поля вы перечисляли: причина, бюджет, источник заявки, мессенджер, способ доставки, вид оплаты, дата и менеджер. Менеджер не может закрыть сделку, пока они пустые.</div>
   </div>
   <div class="panel">
    <div class="ph-title">Переписка внутри сделки</div>
    <div class="chat" style="margin-top:8px">
     <div class="msg u"><span class="who">КЛИЕНТ · WHATSAPP · 10:14</span>Нужен букет на день рождения, завтра к 14:00. Бюджет до 25 000</div>
     <div class="msg a"><span class="who">АСЕМ · 10:16</span>Айгуль, здравствуйте! В прошлый раз брали пионовидные розы — собрать в той же гамме?</div>
     ${pathStep>=3?'<div class="msg u"><span class="who">КЛИЕНТ · 10:19</span>Да, только чуть светлее и без лилий</div>':''}
     ${pathStep>=4?'<div class="msg a"><span class="who">АСЕМ · 10:24</span>Отправила три варианта и ссылку на оплату Kaspi</div>':''}
     ${pathStep>=6?'<div class="msg a"><span class="who">СИСТЕМА · 13:28</span>Фото собранного букета отправлено заказчику</div>':''}
     ${pathStep>=7?'<div class="msg a"><span class="who">СИСТЕМА · 14:06</span>Вручено. Фото получателя приложено к заказу</div>':''}
    </div>
    <div class="note" style="--tone:var(--acc)"><b>Переписка принадлежит компании</b>
     <p>Менеджер ушёл — история клиента осталась. Сейчас она живёт в личных телефонах и в чужом облаке.</p></div>
   </div>
  </div>
 </div>`};
function pathNext(){pathStep=pathStep>=PATH.length-1?0:pathStep+1;render();
 if(pathStep===0){toast('Сценарий сброшен. Пройдём ещё раз — на встрече удобно вести по шагам и останавливаться там, где у вас по-другому.');return}
 const p=PATH[pathStep];toast(`<b>Шаг ${pathStep+1}. ${esc(p[0])}</b> — ${esc(p[2])}`);
 if(pathStep===PATH.length-1)sparks()}
function pathReset(){pathStep=0;render();toast('Путь заказа сброшен на первый шаг.')}

SC.analytics=()=>{
 const maxR=Math.max(...QUAL.r), maxS=Math.max(...SRC.map(s=>s[1]));
 return `
 <div class="head"><div><h2>Аналитика</h2>
  <p>Вы сказали: «чтобы потом по окончании в аналитике было видно, какая сделка какой была». Всё на этом экране считается из полей квалификации — никто не собирает отчёт руками.</p></div>
  <div class="btns"><button class="btn" onclick="go('qual')">Как заполняется →</button><button class="btn" onclick="toast('Любой срез выгружается в Excel и ставится на расписание: сводка по причинам отказа придёт вам в WhatsApp каждый понедельник.')">Выгрузить в Excel</button></div></div>
 <div class="g11">
  <div class="panel">
   <div class="ph-title">Причины отказа</div><div class="ph-sub" style="margin-bottom:10px">${fmt(QUAL.lost)} закрытых без реализации за месяц</div>
   ${REASONS.map((r,i)=>`<div class="fr">
     <span>${esc(r[0])}</span><div class="bar" style="--w:${QUAL.r[i]/maxR*100}%"><i style="background:${i<2?'var(--red)':'var(--amber)'}"></i></div>
     <b>${fmt(QUAL.r[i])} · ${pct(QUAL.r[i],QUAL.lost)}</b></div>`).join('')}
   <div class="note" style="--tone:var(--red)"><b>«Дорого» и «нет нужных цветов» — это разные проблемы</b>
    <p>Первое решается скриптом и подборкой дешевле. Второе — закупом: 196 отказов за месяц из-за отсутствия позиции это примерно 3,5 млн ₸ несостоявшейся выручки.</p></div>
  </div>
  <div class="panel">
   <div class="ph-title">Источник заявки</div><div class="ph-sub" style="margin-bottom:10px">откуда клиент пришёл — отдельно от того, где он написал</div>
   ${SRC.map(s=>`<div class="fr"><span>${esc(s[0])}</span>
     <div class="bar" style="--w:${s[1]/maxS*100}%"><i class="b"></i></div><b>${fmt(s[1])}</b></div>`).join('')}
   <div class="hint">Вы разделяли два поля: <b>источник заявки</b> — откуда он вообще про вас узнал, и <b>источник-мессенджер</b> — где именно оформился. В аналитике это два независимых разреза, их можно пересекать.</div>
  </div>
 </div>
 <div class="g3">
  ${[['Способ доставки',DLV],['Вид оплаты',PAY],['Повод заказа',OCC]].map(([t,arr])=>{
   const tot=arr.reduce((a,x)=>a+x[1],0);
   return `<div class="panel"><div class="ph-title">${esc(t)}</div>
    <div class="ph-sub" style="margin-bottom:8px">по ${fmt(tot)} закрытым сделкам</div>
    ${arr.map(x=>`<div class="kv"><span>${esc(x[0])}</span><b>${fmt(x[1])} · ${pct(x[1],tot)}</b></div>`).join('')}</div>`}).join('')}
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px">
  <thead><tr><th>Филиал</th><th class="right">Заявок</th><th class="right">Реализовано</th><th class="right">Конверсия</th><th class="right">Средний чек</th><th class="right">Выручка</th><th>План</th></tr></thead><tbody>
  ${BR.map(b=>{const l=Math.round(b.o/F.won*F.leads);return `<tr onclick="openBranch('${esc(b.n)}')">
   <td><b>${esc(b.n)}</b><div class="sub">${b.m.join(', ')}</div></td>
   <td class="right mono">${fmt(l)}</td><td class="right mono">${fmt(b.o)}</td>
   <td class="right"><span class="badge ${b.o/l>.54?'g':'a'}">${pct(b.o,l)}</span></td>
   <td class="right mono">${fmt(b.avg)} ₸</td><td class="right mono">${fmt(b.rev)} ₸</td>
   <td><span class="badge ${b.rev>=b.plan?'g':'r'}">${pct(b.rev,b.plan)}</span></td></tr>`}).join('')}
 </tbody></table></div></div>
 <div class="hint">Сейчас такой таблицы нет ни в amoCRM, ни в Посифлоре: в одной живут сделки, в другой — чеки, и свести их можно только руками. Здесь это один экран, который обновляется сам.</div>`};

SC.inbox=()=>{
 const IN=[
  ['wa','+7 701 ••• 21 40','Айгуль Сериковна','Нужен букет на день рождения, завтра к 14:00','2 мин',1,'Центральный'],
  ['ig','@marat_zh','Марат Ж.','Здравствуйте, сколько стоит такой букет с фото?','8 мин',1,'Достык'],
  ['wa','+7 747 ••• 09 62','Динара К.','Можно доставить сегодня до 19:00?','14 мин',1,'Абая'],
  ['tel','+7 727 ••• 10 05','ТОО «Алтын»','Входящий звонок 1:42 · запись разговора','26 мин',0,'Центральный'],
  ['ig','@sauleee','Сауле А.','По свадьбе — нужна консультация','41 мин',0,'Достык'],
  ['site','Форма на сайте','Новый клиент','Заявка на корпоративное обслуживание','1 ч',0,'Центральный'],
  ['wa','+7 700 ••• 45 18','Ерлан Т.','Пропущенный звонок, перезвонить','2 ч',0,'Сайран']
 ];
 return `
 <div class="head"><div><h2>Обращения</h2>
  <p>Одна лента вместо переключения между WhatsApp Web, Instagram и телефоном. Канал проставляется сам, клиент опознаётся по номеру или нику, филиал — по номеру, на который написали.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Из обращения создаётся сделка в статусе «Новая заявка»: канал, клиент, филиал и менеджер уже заполнены. Менеджеру остаётся ответить.')">Взять в работу</button></div></div>
 <div class="strip">
  <div><small>НЕ ОТВЕЧЕНО</small><b class="r">3</b><span>дольше 10 минут</span></div>
  <div><small>СЕГОДНЯ</small><b>47</b><span>обращений во все каналы</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ</small><b class="g">4 мин</b><span>по сети за неделю</span></div>
  <div><small>ПРОПУЩЕННЫХ</small><b class="a">2</b><span>звонка без перезвона</span></div>
  <div><small>ПОВТОРНЫХ</small><b class="v">31%</b><span>клиент уже покупал</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:880px">
  <thead><tr><th>Канал</th><th>Контакт</th><th>Сообщение</th><th>Филиал</th><th>Ждёт</th><th></th></tr></thead><tbody>
  ${IN.map(r=>`<tr onclick="openLead('${esc(r[2])}','${r[0]}','${esc(r[3])}','${esc(r[6])}')">
   <td><span class="ch ${r[0]}">${CHN[r[0]]}</span></td>
   <td><b>${esc(r[2])}</b><div class="sub mono">${esc(r[1])}</div></td>
   <td class="mini">${esc(r[3])}</td>
   <td class="mini">${esc(r[6])}</td>
   <td><span class="badge ${r[5]?'r':''}">${esc(r[4])}</span></td>
   <td class="right"><button class="btn" onclick="event.stopPropagation();toast('Сделка создана из обращения: канал ${CHN[r[0]]}, филиал ${esc(r[6])}, клиент подтянут из базы.')">В сделку</button></td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Как определяется канал</div>
   <div class="chk"><i>✓</i><span>Написали на рабочий номер филиала → <b>WhatsApp</b><span class="sub">номер филиала известен системе, поэтому сразу проставляется и филиал</span></span></div>
   <div class="chk"><i>✓</i><span>Написали в Direct аккаунта сети → <b>Instagram</b><span class="sub">ник сохраняется в карточке клиента, чтобы узнать его в следующий раз</span></span></div>
   <div class="chk"><i>✓</i><span>Позвонили → <b>Звонок</b><span class="sub">с записью разговора и длительностью, привязка к сделке автоматическая</span></span></div>
   <div class="chk"><i>✓</i><span>Форма на сайте или 2ГИС → <b>Сайт</b><span class="sub">вместе с UTM-меткой рекламной кампании</span></span></div>
  </div>
  <div class="panel"><div class="ph-title">Что это меняет в вашей работе</div>
   <div class="note" style="--tone:var(--green)"><b>Менеджер не переключается между приложениями</b><p>Сейчас переписка в WhatsApp, заявки в Instagram, сделки в amoCRM, чеки в Посифлоре. Здесь всё в одном окне сделки.</p></div>
   <div class="note" style="--tone:var(--amber)"><b>Видно, кому не ответили</b><p>Три обращения ждут дольше десяти минут — это прямая потеря заказов на сегодняшний день.</p></div>
   <div class="note" style="--tone:var(--acc)"><b>Переписка остаётся в компании</b><p>Не в личном телефоне сотрудника и не в чужом сервисе, из которого вы её не заберёте.</p></div>
  </div>
 </div>`};

SC.funnel=()=>{
 const list=DEALS.filter(d=>fBr==='all'||d.br===fBr);
 const sum=list.reduce((a,d)=>a+d.sum,0);
 return `
 <div class="head"><div><h2>Воронка сделок</h2>
  <p>Статусы — те, что вы продиктовали на встрече. Карточку можно перетащить мышью в следующий этап, клик открывает сделку целиком.</p></div>
  <div class="btns">
   <button class="btn ${tight?'acc':''}" onclick="setTight(true)">Компактно</button>
   <button class="btn ${tight?'':'acc'}" onclick="setTight(false)">Подробно</button>
   <button class="btn" onclick="toast('Новая сделка создаётся из обращения или вручную. Обязательные поля — клиент, филиал, повод и дата доставки.')">+ Сделка</button></div></div>
 <div class="tflt">
  <button class="tf ${fBr==='all'?'on':''}" onclick="setBr('all')">Все филиалы</button>
  ${BR.map(b=>`<button class="tf ${fBr===b.n?'on':''}" onclick="setBr('${esc(b.n)}')">${esc(b.n)}</button>`).join('')}
  <span class="mini" style="margin-left:auto">${list.length} сделок на ${fmt(sum)} ₸</span>
 </div>
 <div class="board ${tight?'tight':''}" id="board">
  ${ST.map(([k,n,c])=>{
   const col=list.filter(d=>d.s===k);
   return `<div class="col" id="col-${k}" ondragover="colOver(event,'${k}')" ondragleave="colOut('${k}')" ondrop="dealDrop(event,'${k}')">
    <div class="col-h"><b style="color:${c}">${esc(n)}</b><span>${col.length}</span></div>
    ${col.map(d=>`<div class="kc" draggable="true" ondragstart="dealDrag(event,'${d.id}')" ondragend="dealEnd(event)"
      onclick="openDeal('${d.id}')" style="--pr:${c}">
      <b>${esc(d.c)}</b>
      <div class="kmeta">${esc(d.occ)} · ${esc(d.when)}<br>${esc(d.br)} · ${esc(d.mg)}</div>
      <div class="krow"><span class="ch ${d.ch}">${CHN[d.ch]}</span>
       <span class="due ${d.late?'late':''} mono">${fmt(d.sum)} ₸</span></div>
     </div>`).join('')||'<div class="mini" style="padding:6px 2px;opacity:.6">пусто</div>'}
   </div>`}).join('')}
 </div>
 <div class="g11" style="margin-top:12px">
  <div class="panel"><div class="ph-title">Про «широкие карточки и много текста»</div>
   <div class="ph-sub" style="margin-bottom:8px">вы сказали это про amoCRM на встрече — вот две плотности одной доски</div>
   <div class="chk"><i>✓</i><span><b>Компактно</b> — имя, канал и сумма. Помещается вся воронка целиком, видно затор.<span class="sub">режим по умолчанию для руководителя</span></span></div>
   <div class="chk"><i>✓</i><span><b>Подробно</b> — плюс повод, дата доставки, филиал и менеджер.<span class="sub">удобно менеджеру, который ведёт свои сделки</span></span></div>
   <div class="chk"><i>✓</i><span>Настройка запоминается для каждого сотрудника отдельно<span class="sub">и не влияет на то, как видят доску остальные</span></span></div>
   <div class="chk no"><i>×</i><span>Ширину колонок и набор полей на карточке вы меняете сами<span class="sub">в разделе «Настройки» — без обращения к разработчику</span></span></div>
  </div>
  <div class="panel"><div class="ph-title">Закрытие сделки</div>
   <div class="ph-sub" style="margin-bottom:10px">две кнопки и обязательная квалификация</div>
   <div class="btns"><button class="btn g" onclick="go('qual')">Реализовано</button><button class="btn r" onclick="go('qual')">Не реализовано</button></div>
   <div class="note" style="--tone:var(--acc)" ><b>Рабочий этап — отдельный статус</b>
    <p>Вы рассказывали, что в «рабочий этап» складываете сделки, по которым филиалы и курьеры общаются каждый день. Он здесь есть и не попадает в конверсию — эти карточки не считаются ни успешными, ни отказными, пока не закрыты.</p></div>
   <div class="kv" style="margin-top:8px"><span>Сделок в «рабочем этапе»</span><b>${DEALS.filter(d=>d.s==='work').length}</b></div>
   <div class="kv"><span>Зависших в «дожиме» дольше 2 дней</span><b style="color:var(--red)">${DEALS.filter(d=>d.late).length}</b></div>
  </div>
 </div>`};
function setTight(v){tight=v;render();toast(v?'Компактный режим: на доске помещается вся воронка, видно, где затор.':'Подробный режим: на карточке повод, дата доставки, филиал и менеджер.')}
function setBr(b){fBr=b;render()}
let dragId=null;
function dealDrag(e,id){dragId=id;e.target.classList.add('drag');try{e.dataTransfer.setData('text/plain',id)}catch(x){}}
function dealEnd(e){e.target.classList.remove('drag')}
function colOver(e,k){e.preventDefault();const c=document.getElementById('col-'+k);if(c)c.classList.add('over')}
function colOut(k){const c=document.getElementById('col-'+k);if(c)c.classList.remove('over')}
function dealDrop(e,k){e.preventDefault();colOut(k);
 const d=DEALS.find(x=>x.id===dragId);if(!d)return;
 const from=STN[d.s];d.s=k;if(k!=='push')d.late=0;render();
 toast(`Сделка <b>${esc(d.id)}</b> · ${esc(d.c)}: «${esc(from)}» → «${esc(STN[k])}». ${k==='florist'?'Заказ ушёл флористу в очередь на сборку.':k==='courier'?'Курьер увидел адрес и время в телефоне.':'Время в статусе фиксируется — из него считается скорость воронки.'}`)}

SC.qual=()=>{
 const tot=QUAL.won+QUAL.lost, maxR=Math.max(...QUAL.r);
 return `
 <div class="head"><div><h2>Квалификация сделки</h2>
  <p>Главное требование со встречи: «чтобы все сделки квалифицировались». Ниже — настоящая форма закрытия. Нажмите любую причину и посмотрите, как цифра сразу уходит в аналитику.</p></div>
  <div class="btns"><button class="btn" onclick="qualReset()">Вернуть цифры месяца</button><button class="btn acc" onclick="go('analytics')">Открыть аналитику →</button></div></div>
 <div class="strip">
  <div><small>ВСЕГО ЗАКРЫТО</small><b>${fmt(tot)}</b><span>за сентябрь</span></div>
  <div><small>РЕАЛИЗОВАНО</small><b class="g">${fmt(QUAL.won)}</b><span class="g">${pct(QUAL.won,tot)}</span></div>
  <div><small>НЕ РЕАЛИЗОВАНО</small><b class="r">${fmt(QUAL.lost)}</b><span class="r">${pct(QUAL.lost,tot)}</span></div>
  <div><small>БЕЗ ПРИЧИНЫ</small><b>0</b><span>закрыть без причины нельзя</span></div>
  <div><small>ПОЛЕЙ В ФОРМЕ</small><b class="v">8</b><span>обязательных при успехе</span></div>
 </div>
 <div class="g11">
  <div class="panel">
   <div class="ph-title">Закрыть как «не реализовано»</div>
   <div class="ph-sub" style="margin-bottom:10px">причина обязательна — список ваш, меняется в настройках</div>
   ${REASONS.map((r,i)=>`<div class="fr" onclick="qualLost(${i})" style="cursor:pointer">
     <span>${esc(r[0])}</span><div class="bar" style="--w:${QUAL.r[i]/maxR*100}%"><i style="background:${i<2?'var(--red)':'var(--amber)'}"></i></div>
     <b>${fmt(QUAL.r[i])}</b></div>`).join('')}
   <div class="hint">Пока причина не выбрана, кнопка закрытия неактивна. Поэтому в аналитике не бывает строки «без причины» — той самой, из-за которой сейчас невозможно понять, почему теряются заявки.</div>
  </div>
  <div class="panel">
   <div class="ph-title">Закрыть как «реализовано»</div>
   <div class="ph-sub" style="margin-bottom:10px">эти поля вы перечислили на встрече слово в слово</div>
   ${[['Бюджет','24 000 ₸','сумма, которую клиент фактически потратил'],
      ['Источник заявки','Повторный клиент','откуда клиент узнал о сети'],
      ['Канал оформления','WhatsApp','проставлен системой в момент обращения'],
      ['Способ доставки','Курьер по городу','курьер, самовывоз или доставка в область'],
      ['Вид оплаты','Kaspi перевод','подтягивается из платежа автоматически'],
      ['Дата заказа','11.09.2026','и дата доставки отдельным полем'],
      ['Менеджер','Асем · Центральный','тот, кто фактически оформил сделку'],
      ['Повод','День рождения','попадает в карточку клиента для напоминания']].map(([k,v,d])=>
    `<div class="kv" style="align-items:flex-start"><span>${esc(k)}<div class="sub">${esc(d)}</div></span><b>${esc(v)}</b></div>`).join('')}
   <div class="btns" style="margin-top:10px"><button class="btn g" onclick="qualWon()">Закрыть как реализовано</button></div>
  </div>
 </div>
 <div class="panel">
  <div class="ph-title">Что даёт обязательная квалификация</div>
  <div class="g3" style="margin-top:9px">
   <div class="note" style="--tone:var(--red)"><b>Видно, сколько стоит «дорого»</b><p>312 отказов за месяц. При среднем чеке ${fmt(F.avg)} ₸ это ${fmt(312*F.avg/1000000)} млн ₸ — уже повод обсудить линейку до 15 000 ₸.</p></div>
   <div class="note" style="--tone:var(--amber)"><b>Видно, что мешает закупу</b><p>196 отказов «нет нужных цветов» напрямую связаны с остатками. Эти позиции попадают в заявку поставщику.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Видно, кто теряет</b><p>Причины раскладываются по менеджерам и филиалам. «Игнор» у одного менеджера и «дорого» у другого — разные разговоры.</p></div>
  </div>
 </div>`};
function qualLost(i){QUAL.r[i]++;QUAL.lost++;render();
 toast(`Сделка закрыта с причиной <b>«${esc(REASONS[i][0])}»</b>. Цифра сразу ушла в аналитику: ${fmt(QUAL.r[i])} за месяц. Никаких ручных отчётов — разрез собирается сам.`)}
function qualWon(){QUAL.won++;render();sparks();
 toast('Сделка закрыта как <b>реализованная</b>: бюджет, источник, канал, доставка и оплата заполнены. Она попала в выручку филиала, в KPI менеджера и в аналитику поводов.')}
function qualReset(){QUAL={won:F.won,lost:F.lost,r:REASONS.map(r=>r[1])};render();toast('Вернули фактические цифры сентября.')}

SC.clients=()=>`
 <div class="head"><div><h2>Клиенты и поводы</h2>
  <p>Вы сказали: «нам нужно больше информации о клиенте». Карточка помнит историю заказов, любимые цветы, поводы и даты — и напоминает о них заранее.</p></div>
  <div class="btns"><button class="btn" onclick="go('loyal')">Лояльность →</button></div></div>
 <div class="strip">
  <div><small>В БАЗЕ</small><b>${fmt(11480)}</b><span>клиентов с историей</span></div>
  <div><small>ПОВТОРНЫХ</small><b class="g">31%</b><span>покупали больше одного раза</span></div>
  <div><small>B2B</small><b class="v">64</b><span>юрлица и ИП со счетами</span></div>
  <div><small>ПОВОДОВ В СЕНТЯБРЕ</small><b class="a">218</b><span>дни рождения и годовщины</span></div>
  <div><small>СПЯЩИХ</small><b class="r">1 940</b><span>не покупали больше года</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px">
  <thead><tr><th>Клиент</th><th>Канал</th><th class="right">Заказов</th><th class="right">Сумма</th><th>Последний</th><th>Ближайший повод</th><th>Предпочтения</th></tr></thead><tbody>
  ${CLIENTS.map(c=>`<tr onclick="openClient('${esc(c.n)}')">
   <td><b>${esc(c.n)}</b><div class="sub mono">${esc(c.ph)}</div></td>
   <td><span class="ch ${c.ch}">${CHN[c.ch]}</span></td>
   <td class="right mono">${c.orders}</td>
   <td class="right mono">${fmt(c.sum)} ₸</td>
   <td class="mono">${esc(c.last)}</td>
   <td>${c.occ==='—'?'<span class="mini">—</span>':`<span class="badge p">${esc(c.occ)}</span>`}</td>
   <td class="mini">${esc(c.fav)}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Поводы на ближайшие 14 дней</div>
   <div class="ph-sub" style="margin-bottom:9px">система ставит задачу менеджеру за три дня до даты</div>
   ${[['12.09','Алма Б.','Выписка из роддома','Постоянный'],['14.09','Айгуль Сериковна','ДР дочери','Постоянный'],
      ['19.09','Сауле А.','Свадьба','Новый'],['21.09','Динара К.','ДР мужа','Постоянный'],
      ['24.09','Марат Ж.','ДР мамы','Постоянный']].map(x=>
    `<div class="kv"><span><b class="mono">${x[0]}</b> · ${esc(x[1])}<div class="sub">${esc(x[2])}</div></span><span class="badge ${x[3]==='Новый'?'a':'g'}">${x[3]}</span></div>`).join('')}
   <div class="hint">Это прямой ответ на ваш пример: «клиент пишет — и сразу вся информация подтягивается: карточка, повод, день рождения». Здесь она подтягивается не только в момент обращения, но и заранее — чтобы вы написали первыми.</div>
  </div>
  <div class="panel"><div class="ph-title">Что видит менеджер в карточке</div>
   <div class="chk"><i>✓</i><span>Все заказы клиента с составом букета и суммой<span class="sub">включая заказы из других филиалов сети</span></span></div>
   <div class="chk"><i>✓</i><span>Получатели: кому и на какой адрес возил раньше<span class="sub">жена, мама, офис — с адресами и телефонами</span></span></div>
   <div class="chk"><i>✓</i><span>Любимые и нежелательные цветы<span class="sub">«без лилий» — и менеджер не предложит их повторно</span></span></div>
   <div class="chk"><i>✓</i><span>Вся переписка по всем каналам в одной ленте<span class="sub">WhatsApp, Instagram и записи звонков</span></span></div>
   <div class="chk"><i>✓</i><span>Поводы и даты с напоминанием<span class="sub">день рождения, годовщина, корпоративный график</span></span></div>
  </div>
 </div>`;

SC.loyal=()=>`
 <div class="head"><div><h2>Лояльность и повторные продажи</h2>
  <p>Повторный клиент стоит дешевле нового: он уже в базе, знает сервис и покупает по поводу. Система работает с базой сама — напоминаниями и задачами менеджерам.</p></div></div>
 <div class="strip">
  <div><small>ПОВТОРНЫХ ЗАЯВОК</small><b class="g">884</b><span>25% всех обращений</span></div>
  <div><small>СРЕДНИЙ ЧЕК ПОВТОРНОГО</small><b>24 800 ₸</b><span>против 16 100 ₸ у нового</span></div>
  <div><small>ВОЗВРАТ ЗА ГОД</small><b class="v">2,4</b><span>заказа на клиента</span></div>
  <div><small>СПЯЩИХ В РАБОТЕ</small><b class="a">312</b><span>обзвон по прошлому сентябрю</span></div>
  <div><small>ОТ ПОВТОРНЫХ</small><b class="g">${fmt(884*24800/1000000)} млн ₸</b><span>выручки в месяц</span></div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Сценарии, которые работают без менеджера</div>
   ${[['За 3 дня до повода','Задача менеджеру: «Айгуль, 14.09 день рождения дочери — написать с подборкой»','Задача'],
      ['Через 2 дня после доставки','Сообщение получателю: «Как букет? Оставьте отзыв» — с ссылкой на 2ГИС','WhatsApp'],
      ['Через год после заказа','Напоминание: «В прошлом сентябре вы дарили пионовидные розы»','WhatsApp'],
      ['После третьего заказа','Клиент переходит в сегмент «Постоянный» — скидка применяется сама','Правило'],
      ['Если не покупал 12 месяцев','Уходит в «Спящие» и попадает в список на обзвон','Сегмент']].map(x=>
    `<div class="kv" style="align-items:flex-start"><span><b>${esc(x[0])}</b><div class="sub">${esc(x[1])}</div></span><span class="badge b">${esc(x[2])}</span></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Скидка — стандартное поле</b><p>Ставится персонально клиенту или на филиал целиком и подставляется в расчёт заказа автоматически.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Сегменты базы</div>
   ${[['Постоянные · 3+ заказа',2140,'g'],['Повторные · 2 заказа',1820,'b'],['Новые · 1 заказ',5580,'a'],['Спящие · больше года',1940,'r']].map(x=>
    `<div class="fr"><span>${esc(x[0])}</span><div class="bar" style="--w:${x[1]/5580*100}%"><i class="${x[2]==='g'?'g':x[2]==='b'?'b':x[2]==='a'?'w':''}" style="${x[2]==='r'?'background:var(--red)':''}"></i></div><b>${fmt(x[1])}</b></div>`).join('')}
   <div class="kv" style="margin-top:10px"><span>Доля выручки от постоянных</span><b>48%</b></div>
   <div class="kv"><span>Стоимость нового клиента с рекламы</span><b>4 100 ₸</b></div>
   <div class="kv"><span>Стоимость повторной продажи</span><b style="color:var(--green)">0 ₸</b></div>
   <div class="hint">База из Посифлоры и из amoCRM объединяется по номеру телефона — дубли схлопываются при переносе. Один клиент — одна карточка, даже если он покупал в трёх филиалах.</div>
  </div>
 </div>`;

SC.orders=()=>`
 <div class="head"><div><h2>Заказы</h2>
  <p>Сделка — это про деньги и переговоры, заказ — про то, что и куда везём. Дата и время доставки, получатель, адрес, текст открытки и фото собранного букета.</p></div>
  <div class="btns"><button class="btn" onclick="go('florist')">Очередь сборки →</button><button class="btn" onclick="go('delivery')">Доставка →</button></div></div>
 <div class="strip">
  <div><small>НА СЕГОДНЯ</small><b>38</b><span>доставок по сети</span></div>
  <div><small>В СБОРКЕ</small><b class="a">5</b><span>у флористов прямо сейчас</span></div>
  <div><small>У КУРЬЕРОВ</small><b class="v">4</b><span>в пути</span></div>
  <div><small>ВРУЧЕНО</small><b class="g">29</b><span>с фото подтверждения</span></div>
  <div><small>ПРЕДЗАКАЗОВ</small><b>142</b><span>на ближайшие 14 дней</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:940px">
  <thead><tr><th>Заказ</th><th>Заказчик</th><th>Филиал</th><th>Доставка</th><th>Получатель</th><th class="right">Сумма</th><th>Статус</th></tr></thead><tbody>
  ${ORDERS.map(o=>`<tr onclick="openOrder('${o.id}')">
   <td class="mono"><b>${o.id}</b></td>
   <td>${esc(o.cl)}</td>
   <td class="mini">${esc(o.br)}</td>
   <td class="mono">${esc(o.when)}</td>
   <td class="mini">${esc(o.to)}<div class="sub">${esc(o.addr)}</div></td>
   <td class="right mono">${fmt(o.sum)} ₸</td>
   <td><span class="badge ${o.st==='Вручено'?'g':o.st==='У курьера'?'b':o.st==='Собирается'?'a':''}">${esc(o.st)}</span></td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint">Обратите внимание: у заказа отдельно заказчик и получатель. Это цветочная специфика — платит один, получает другой, и напоминание о поводе в следующем году надо слать заказчику, а отзыв просить у получателя.</div>`;

SC.florist=()=>`
 <div class="head"><div><h2>Сборка · флористы</h2>
  <p>Очередь на сборку строится по времени доставки, а не по времени заказа. Флорист видит состав, пожелания клиента и срок, к которому букет должен стоять готовым.</p></div></div>
 <div class="strip">
  <div><small>В ОЧЕРЕДИ</small><b>5</b><span>на ближайшие 3 часа</span></div>
  <div><small>СОБИРАЕТСЯ</small><b class="a">2</b><span>в работе прямо сейчас</span></div>
  <div><small>ГОТОВО</small><b class="g">11</b><span>с фото, ждут курьера</span></div>
  <div><small>СРЕДНЯЯ СБОРКА</small><b>18 мин</b><span>по филиалу за неделю</span></div>
  <div><small>ПЕРЕДЕЛОК</small><b class="r">2</b><span>за неделю по сети</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph-title">Очередь филиала Центральный</div>
   <div class="ph-sub" style="margin-bottom:10px">порядок — по времени вручения</div>
   ${[['13:30','З-1841','Мадина А.','Пионовидные розы 15 шт, эустома, крафт','Собирается','a'],
      ['14:00','З-1839','Тимур Н.','Красные розы 25 шт, лента','Готов · фото отправлено','g'],
      ['16:00','З-1842','Рустем Б.','Гортензия 3, роза 11, коробка','Собирается','a'],
      ['17:30','З-1843','Айым С.','Тюльпаны 25, упаковка','В очереди',''],
      ['18:00','З-1838','Алма Б.','Нежная гамма, без лилий','Предзаказ на завтра','']].map(x=>
    `<div class="kv" style="align-items:flex-start" onclick="toast('Флорист открывает состав, отмечает «собрано» и прикладывает фото — оно уходит заказчику в WhatsApp автоматически, а цветы списываются с остатка.')">
      <span><b class="mono">${x[0]}</b> · ${esc(x[2])}<div class="sub">${esc(x[3])}</div></span>
      <span class="badge ${x[5]}">${esc(x[4])}</span></div>`).join('')}
   <div class="note" style="--tone:var(--green)"><b>Фото букета — часть процесса</b>
    <p>Флорист снимает готовый букет, фото прикладывается к заказу и уходит заказчику. Это и подтверждение качества, и защита от спора «прислали не то».</p></div>
  </div>
  <div class="panel"><div class="ph-title">Что происходит при отметке «собрано»</div>
   <div class="chk"><i>1</i><span>Состав букета списывается с остатка филиала<span class="sub">роза 15 шт, эустома 5 шт, крафт 1 лист</span></span></div>
   <div class="chk"><i>2</i><span>Фото уходит заказчику в тот канал, где он писал<span class="sub">WhatsApp или Instagram — тот же диалог</span></span></div>
   <div class="chk"><i>3</i><span>Заказ переходит курьеру и появляется у него в телефоне<span class="sub">с адресом, временем и телефоном получателя</span></span></div>
   <div class="chk"><i>4</i><span>Менеджер видит статус, не спрашивая флориста<span class="sub">это то, что сейчас выясняется в рабочих чатах</span></span></div>
   <div class="chk"><i>5</i><span>Время сборки попадает в статистику филиала<span class="sub">видно, где не хватает рук в пиковые дни</span></span></div>
  </div>
 </div>`;

SC.delivery=()=>`
 <div class="head"><div><h2>Доставка</h2>
  <p>Курьер получает маршрут в телефон, отмечает вручение и прикладывает фото. Заказчик получает уведомление сам — менеджер не звонит узнавать, доехали ли.</p></div></div>
 <div class="g12">
  <div>
   <div class="panel"><div class="ph-title">Телефон курьера</div><div class="ph-sub" style="margin-bottom:10px">Данияр · 4 адреса на сегодня</div>
    <div class="phone">
     <div class="ph-top"><b>Маршрут на 11 сентября</b><small>4 адреса · 2 вручено</small></div>
     <div class="pt-item"><b>13:00 · Рыскулова 12</b><span>Гүлмира К. · вручено 13:04 ✓</span></div>
     <div class="pt-item"><b>14:30 · Сатпаева 30</b><span>Тимур Н. · вручено 14:28 ✓</span></div>
     <div class="pt-item on"><b>15:00 · Абая 145, кв. 32</b><span>Айсулу · в пути · позвонить получателю</span></div>
     <div class="pt-item"><b>17:30 · Орбита-3, д. 12</b><span>Дана · ждёт сборки</span></div>
    </div>
   </div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Доставки сети сегодня</div>
    <div class="tw"><table class="data" style="min-width:600px">
     <thead><tr><th>Время</th><th>Филиал</th><th>Курьер</th><th>Адрес</th><th>Статус</th></tr></thead><tbody>
     ${[['13:00','Алмагуль','Данияр','Рыскулова 12','Вручено','g'],
        ['14:30','Центральный','Данияр','Сатпаева 30','Вручено','g'],
        ['15:00','Центральный','Данияр','Абая 145','В пути','b'],
        ['15:30','Достык','Азамат','Достык 89, офис 401','В пути','b'],
        ['17:30','Орбита','Азамат','Орбита-3, д. 12','Ждёт сборки','a'],
        ['18:00','Мега','Самовывоз','Филиал Мега','Готов к выдаче','']].map(r=>
      `<tr onclick="toast('Курьер отмечает вручение в телефоне: статус, время и фото. Заказчику уходит уведомление, сделка переходит к закрытию.')">
       <td class="mono">${r[0]}</td><td class="mini">${esc(r[1])}</td><td class="mini">${esc(r[2])}</td>
       <td class="mini">${esc(r[3])}</td><td><span class="badge ${r[5]}">${esc(r[4])}</span></td></tr>`).join('')}
    </tbody></table></div>
   </div>
   <div class="panel"><div class="ph-title">Что фиксируется по доставке</div>
    <div class="kv"><span>Время вручения против обещанного</span><b>по каждому заказу</b></div>
    <div class="kv"><span>Фото получателя или подъезда</span><b>обязательно</b></div>
    <div class="kv"><span>Причина переноса</span><b>из списка</b></div>
    <div class="kv"><span>Доля доставок вовремя за месяц</span><b style="color:var(--green)">94,2%</b></div>
    <div class="hint">Способ доставки — одно из полей квалификации, которое вы назвали. Отсюда он и берётся: курьер по городу, самовывоз из филиала или доставка в область.</div>
   </div>
  </div>
 </div>`;

SC.branches=()=>`
 <div class="head"><div><h2>Филиалы</h2>
  <p>Восемь точек, по два менеджера в каждой. Руководитель видит сеть целиком, менеджер — только свой филиал. Новый филиал добавляете сами, без разработчика.</p></div>
  <div class="btns"><button class="btn" onclick="toast('Новый филиал добавляется в настройках: название, адрес, номер WhatsApp, менеджеры и склад. Он сразу появляется во всех разрезах аналитики.')">+ Филиал</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px">
  <thead><tr><th>Филиал</th><th>Менеджеры</th><th class="right">Заказов</th><th class="right">Средний чек</th><th class="right">Выручка</th><th class="right">План</th><th>Выполнение</th></tr></thead><tbody>
  ${BR.map(b=>`<tr onclick="openBranch('${esc(b.n)}')">
   <td><b>${esc(b.n)}</b></td><td class="mini">${b.m.join(', ')}</td>
   <td class="right mono">${b.o}</td><td class="right mono">${fmt(b.avg)} ₸</td>
   <td class="right mono">${fmt(b.rev)} ₸</td><td class="right mono">${fmt(b.plan)} ₸</td>
   <td><span class="badge ${b.rev>=b.plan?'g':b.rev/b.plan>.9?'a':'r'}">${pct(b.rev,b.plan)}</span></td></tr>`).join('')}
  <tr><td><b>Итого по сети</b></td><td class="mini">${F.managers} менеджеров</td>
   <td class="right mono"><b>${fmt(F.won)}</b></td><td class="right mono"><b>${fmt(F.avg)} ₸</b></td>
   <td class="right mono"><b>${fmt(F.rev)} ₸</b></td><td class="right mono"><b>${fmt(F.plan)} ₸</b></td>
   <td><span class="badge ${F.rev>=F.plan?'g':'a'}">${pct(F.rev,F.plan)}</span></td></tr>
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Что настраивается у филиала</div>
   <div class="chk"><i>✓</i><span>Свой номер WhatsApp<span class="sub">по нему система понимает, в какой филиал пришло обращение</span></span></div>
   <div class="chk"><i>✓</i><span>Свои менеджеры и очередь распределения<span class="sub">по очереди, по загрузке или вручную</span></span></div>
   <div class="chk"><i>✓</i><span>Свой склад и остатки<span class="sub">гортензия есть в Центральном и кончилась в Аксае</span></span></div>
   <div class="chk"><i>✓</i><span>Свой план продаж на месяц<span class="sub">и своя скидка на весь филиал, если нужно</span></span></div>
   <div class="chk"><i>✓</i><span>Свои курьеры и зона доставки<span class="sub">чтобы заказ не уехал через весь город</span></span></div>
  </div>
  <div class="panel"><div class="ph-title">Перемещения между филиалами</div>
   <div class="ph-sub" style="margin-bottom:9px">частая история: цветы есть, но не там, где заказ</div>
   ${[['Роза пионовидная · 20 шт','Центральный → Аксай','Принято'],['Гортензия · 12 шт','Достык → Орбита','В пути'],
      ['Эустома · 30 шт','Склад сети → Мега','Оформлено'],['Тюльпан микс · 50 шт','Алмагуль → Сайран','Принято']].map(x=>
    `<div class="kv"><span>${esc(x[0])}<div class="sub">${esc(x[1])}</div></span><span class="badge ${x[2]==='Принято'?'g':x[2]==='В пути'?'b':'a'}">${esc(x[2])}</span></div>`).join('')}
   <div class="hint">Перемещение оформляется в два клика и сразу меняет остатки обоих филиалов. Менеджер видит, что позиция едет, и может пообещать её клиенту с точным сроком.</div>
  </div>
 </div>`;

SC.stock=()=>{
 const low=STOCK.filter(s=>s.low).length;
 const val=STOCK.reduce((a,s)=>a+s.q*s.price,0);
 return `
 <div class="head"><div><h2>Остатки и списание</h2>
  <p>Вы сказали, что склад ведёте в Посифлоре и дублировать его не нужно. Здесь остатки нужны ровно для одного: чтобы менеджер не продал то, чего нет, и чтобы отказ «нет нужных цветов» превращался в заявку на закуп.</p></div></div>
 <div class="strip">
  <div><small>ПОЗИЦИЙ</small><b>${STOCK.length}</b><span>в активном обороте</span></div>
  <div><small>НИЖЕ МИНИМУМА</small><b class="r">${low}</b><span>попали в заявку на закуп</span></div>
  <div><small>СТОИМОСТЬ ОСТАТКА</small><b>${fmt(val)} ₸</b><span>по закупочной цене</span></div>
  <div><small>СПИСАНО ЗА МЕСЯЦ</small><b class="a">418 000 ₸</b><span>увяло и не продано</span></div>
  <div><small>ДОЛЯ СПИСАНИЯ</small><b>1,2%</b><span>от выручки месяца</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:860px">
  <thead><tr><th>Позиция</th><th class="right">Остаток</th><th class="right">Минимум</th><th>Срок жизни</th><th class="right">Цена закупа</th><th class="right">Сумма</th><th>Статус</th></tr></thead><tbody>
  ${STOCK.map(s=>`<tr onclick="toast('${esc(s.n)}: остаток ${s.q} ${esc(s.u)}, срок жизни ${esc(s.life)}. Списание происходит автоматически по составу собранного букета.')">
   <td><b>${esc(s.n)}</b></td><td class="right mono">${fmt(s.q)} ${esc(s.u)}</td>
   <td class="right mono">${fmt(s.min)}</td><td class="mini">${esc(s.life)}</td>
   <td class="right mono">${fmt(s.price)} ₸</td><td class="right mono">${fmt(s.q*s.price)} ₸</td>
   <td>${s.low?'<span class="badge r">ниже минимума</span>':'<span class="badge g">норма</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Почему списание важнее остатка</div>
   <div class="note" style="--tone:var(--red)"><b>Цветок — скоропорт</b><p>Роза живёт 7 дней, гортензия — 4. Списание 418 000 ₸ за месяц это 5 млн ₸ в год, и оно почти всегда про закуп «на глаз».</p></div>
   <div class="note" style="--tone:var(--amber)"><b>Отказ «нет нужных цветов» — это тоже склад</b><p>196 таких отказов за месяц. Система сводит их с остатками: видно, каких позиций системно не хватает в пиковые дни.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Списание не вручную</b><p>Собрали букет — состав ушёл с остатка. Флорист не заполняет таблицу, ничего не забывает и не дописывает вечером по памяти.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Связь с Посифлорой</div>
   <div class="chk"><i>✓</i><span>Номенклатура и цены приходят из Посифлоры<span class="sub">она остаётся источником правды по товарам</span></span></div>
   <div class="chk"><i>✓</i><span>Остатки синхронизируются по расписанию<span class="sub">частота настраивается: раз в 15 минут или по событию</span></span></div>
   <div class="chk"><i>✓</i><span>Продажи из CRM отдаются обратно<span class="sub">чтобы касса и склад сходились</span></span></div>
   <div class="chk no"><i>×</i><span>Мы не заменяем POS-терминал и кассовый учёт<span class="sub">это остаётся в Посифлоре, как вы и просили</span></span></div>
   <div class="btns" style="margin-top:10px"><button class="btn" onclick="go('posi')">Подробнее об обмене →</button></div>
  </div>
 </div>`};

SC.procure=()=>`
 <div class="head"><div><h2>Закуп и поставки</h2>
  <p>Заявка поставщику собирается из трёх источников: расход прошлой недели, позиции ниже минимума и предзаказы на ближайшие дни. Не «на глаз», а по цифрам.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Заявка на закуп сформирована по расходу за 7 дней, минимальным остаткам и 142 предзаказам на ближайшие две недели. Отправляется поставщику в WhatsApp одним сообщением.')">Собрать заявку</button></div></div>
 <div class="g21">
  <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:760px">
   <thead><tr><th>Позиция</th><th class="right">Расход · 7 дней</th><th class="right">Остаток</th><th class="right">Предзаказы</th><th class="right">К закупу</th></tr></thead><tbody>
   ${[['Роза Эквадор 60 см',1240,840,320,720],['Роза пионовидная',380,210,145,315],
      ['Гортензия',190,96,84,178],['Тюльпан микс',960,1240,210,0],
      ['Эустома',420,320,96,196],['Хризантема кустовая',260,184,40,116]].map(r=>
    `<tr><td><b>${esc(r[0])}</b></td><td class="right mono">${fmt(r[1])}</td><td class="right mono">${fmt(r[2])}</td>
     <td class="right mono">${fmt(r[3])}</td><td class="right mono"><b style="color:${r[4]?'var(--acc)':'var(--muted2)'}">${r[4]?fmt(r[4]):'—'}</b></td></tr>`).join('')}
  </tbody></table></div></div>
  <div class="panel"><div class="ph-title">Поставки на неделе</div>
   ${[['Понедельник','Эквадор · роза','Принято'],['Среда','Голландия · гортензия, эустома','Принято'],
      ['Пятница','Местный · хризантема, зелень','Ожидается'],['Суббота','Эквадор · роза к выходным','Оформлено']].map(x=>
    `<div class="kv"><span><b>${esc(x[0])}</b><div class="sub">${esc(x[1])}</div></span><span class="badge ${x[2]==='Принято'?'g':x[2]==='Ожидается'?'a':'b'}">${esc(x[2])}</span></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Предзаказы двигают закуп</b>
    <p>142 предзаказа на две недели вперёд — это уже известный спрос. Система показывает его закупщику до того, как цветы кончатся.</p></div>
  </div>
 </div>`;

SC.posi=()=>`
 <div class="head"><div><h2>Обмен с Посифлорой</h2>
  <p>Вы прямо сказали: «эту систему вы вряд ли замените, она полностью под цветы — POS, склад, товары, база». Мы и не заменяем. CRM забирает продажи, переписку и аналитику, а с Посифлорой обменивается данными.</p></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Что CRM забирает из Посифлоры</div>
   <div class="chk"><i>→</i><span>Справочник товаров и цен<span class="sub">чтобы менеджер собирал подборку из реального каталога</span></span></div>
   <div class="chk"><i>→</i><span>Остатки по филиалам<span class="sub">не обещать то, чего нет в холодильнике</span></span></div>
   <div class="chk"><i>→</i><span>Карточку клиента и историю покупок<span class="sub">ваш пример: клиент пишет — подтянулась карточка, повод, день рождения</span></span></div>
   <div class="chk"><i>→</i><span>Чеки и оплаты в филиале<span class="sub">чтобы офлайн-продажи тоже попадали в аналитику</span></span></div>
  </div>
  <div class="panel"><div class="ph-title">Что CRM отдаёт обратно</div>
   <div class="chk"><i>←</i><span>Оформленный заказ с составом и датой доставки<span class="sub">чтобы он встал в производство и кассу</span></span></div>
   <div class="chk"><i>←</i><span>Клиента и его контакты, если он новый<span class="sub">одна база вместо двух, как вы и хотели</span></span></div>
   <div class="chk"><i>←</i><span>Оплату по Kaspi-ссылке из переписки<span class="sub">деньги видно в обеих системах</span></span></div>
   <div class="chk"><i>←</i><span>Списание цветов по собранному букету<span class="sub">если вы решите вести списание на нашей стороне</span></span></div>
  </div>
 </div>
 <div class="panel">
  <div class="ph-title">Про закрытый API — честно</div>
  <div class="ph-sub" style="margin-bottom:10px">вы сказали: «API есть, но закрытый, интегрировать будут они сами»</div>
  <div class="flow">
   <div class="fb on"><code>ВАРИАНТ 1</code><b>Открытый API</b><p>Посифлора выдаёт доступ — обмен двусторонний и в реальном времени. Наша часть работы 5–7 дней.</p></div>
   <div class="fb"><code>ВАРИАНТ 2</code><b>Обмен файлами</b><p>Выгрузка товаров и остатков по расписанию, загрузка заказов. Работает без их участия, задержка 15–30 минут.</p></div>
   <div class="fb"><code>ВАРИАНТ 3</code><b>Их подрядчик</b><p>Интеграцию делают они, мы отдаём документацию своего API и тестовый контур. Наша часть — приём и поддержка.</p></div>
   <div class="fb"><code>ВАРИАНТ 4</code><b>Без обмена</b><p>CRM работает автономно на своём каталоге. Клиенты и заказы переносятся один раз при запуске.</p></div>
   <div class="fb"><code>РЕЗЕРВ</code><b>Второй контур</b><p>Склад, закуп и остатки в CRM уже есть. Если однажды откажетесь от Посифлоры — переходить не придётся.</p></div>
  </div>
  <div class="note" style="--tone:var(--amber)"><b>Что мы не обещаем</b>
   <p>Пока Посифлора не подтвердила доступ к API, мы не закладываем в срок то, что от нас не зависит. В договоре это фиксируется отдельным пунктом: вариант обмена согласовывается на этапе ядра, и от него зависит глубина интеграции, а не работоспособность CRM.</p></div>
 </div>`;

SC.wa=()=>`
 <div class="head"><div><h2>WhatsApp и Instagram</h2>
  <p>Переписка ведётся внутри карточки сделки. Восемь номеров — по одному на филиал, чтобы обращение сразу попадало в нужную точку и к нужному менеджеру.</p></div></div>
 <div class="strip">
  <div><small>НОМЕРОВ WHATSAPP</small><b>8</b><span>по одному на филиал</span></div>
  <div><small>ДИАЛОГОВ В МЕСЯЦ</small><b>${fmt(2118)}</b><span>61% всех обращений</span></div>
  <div><small>INSTAGRAM DIRECT</small><b class="v">${fmt(835)}</b><span>один аккаунт сети</span></div>
  <div><small>СТОИМОСТЬ КАНАЛА</small><b class="g">5 000 ₸</b><span>за номер в месяц</span></div>
  <div><small>ПРОТИВ ОФИЦИАЛЬНОГО</small><b class="r">36 000 ₸</b><span>за номер в месяц</span></div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Как считается экономия по каналу</div>
   <div class="kv"><span>8 номеров через официальную интеграцию</span><b>288 000 ₸ / мес</b></div>
   <div class="kv"><span>8 номеров через Green API</span><b style="color:var(--green)">40 000 ₸ / мес</b></div>
   <div class="kv"><span>Разница в месяц</span><b style="color:var(--green)">248 000 ₸</b></div>
   <div class="kv"><span>Разница в год</span><b style="color:var(--green)">2 976 000 ₸</b></div>
   <div class="note" style="--tone:var(--amber)"><b>Оговорка по-честному</b>
    <p>Green API — неофициальный канал: дешевле, но при массовых рассылках номер может быть ограничен самим WhatsApp. Для переписки по заявкам это рабочий вариант, для рассылок по всей базе — нет. Если нужна именно рассылка, ставим официальный канал на один номер, остальные оставляем на Green API.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Что умеет канал внутри сделки</div>
   <div class="chk"><i>✓</i><span>Вся переписка в карточке, а не в телефоне менеджера<span class="sub">уволился — история осталась в компании</span></span></div>
   <div class="chk"><i>✓</i><span>Шаблоны ответов и подборок<span class="sub">менеджер не печатает одно и то же по двадцать раз в день</span></span></div>
   <div class="chk"><i>✓</i><span>Фото букета уходит автоматически<span class="sub">из карточки заказа после отметки «собрано»</span></span></div>
   <div class="chk"><i>✓</i><span>Ссылка на оплату Kaspi прямо в диалог<span class="sub">оплата возвращается в сделку и заполняет вид оплаты</span></span></div>
   <div class="chk"><i>✓</i><span>Instagram Direct в той же ленте<span class="sub">ник сохраняется, чтобы узнать клиента в следующий раз</span></span></div>
  </div>
 </div>`;

SC.tel=()=>`
 <div class="head"><div><h2>Телефония</h2>
  <p>Звонок — это тоже обращение. Он попадает в ту же ленту, привязывается к клиенту по номеру и остаётся в карточке записью, которую можно послушать.</p></div></div>
 <div class="g21">
  <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:700px">
   <thead><tr><th>Время</th><th>Номер</th><th>Клиент</th><th>Менеджер</th><th>Длительность</th><th>Итог</th></tr></thead><tbody>
   ${[['10:06','+7 727 ••• 10 05','ТОО «Алтын»','Жанна','1:42','Сделка создана','g'],
      ['10:41','+7 701 ••• 88 30','Новый номер','Асем','0:38','Консультация','b'],
      ['11:15','+7 700 ••• 45 18','Ерлан Т.','—','—','Пропущен','r'],
      ['11:52','+7 705 ••• 33 71','Сауле А.','Алия','4:11','Встреча по свадьбе','g'],
      ['12:30','+7 747 ••• 09 62','Динара К.','Дина','2:05','Перенос даты','a']].map(r=>
    `<tr onclick="toast('Запись разговора хранится в карточке клиента. Руководитель может послушать любой звонок — это разбор причин отказа не по памяти менеджера, а по факту.')">
     <td class="mono">${r[0]}</td><td class="mono">${esc(r[1])}</td><td>${esc(r[2])}</td>
     <td class="mini">${esc(r[3])}</td><td class="mono">${r[4]}</td><td><span class="badge ${r[6]}">${esc(r[5])}</span></td></tr>`).join('')}
  </tbody></table></div></div>
  <div class="panel"><div class="ph-title">Что даёт телефония в CRM</div>
   <div class="chk"><i>✓</i><span>Звонок сам открывает карточку клиента<span class="sub">менеджер видит историю до того, как поднял трубку</span></span></div>
   <div class="chk"><i>✓</i><span>Пропущенные не теряются<span class="sub">система ставит задачу перезвонить и держит её до закрытия</span></span></div>
   <div class="chk"><i>✓</i><span>Записи разговоров в карточке<span class="sub">для разбора спорных заказов и обучения новых менеджеров</span></span></div>
   <div class="chk"><i>✓</i><span>Звонок становится сделкой в один клик<span class="sub">канал «Звонок» проставляется автоматически</span></span></div>
   <div class="hint">Подключается любая облачная АТС, работающая в Казахстане. Выбор оператора остаётся за вами — мы делаем сторону CRM.</div>
  </div>
 </div>`;

SC.import=()=>`
 <div class="head"><div><h2>Перенос из amoCRM</h2>
  <p>Вы сказали важную вещь: «тут дело привычки — когда с одной системы приходишь на другую, к ней привыкнуть нужно». Поэтому переносим не только данные, но и логику: ваши статусы, поля и причины отказа остаются теми же.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Перенос делается на тестовом контуре до запуска: вы открываете новую систему и видите там свои сделки за прошлые месяцы — с историей, а не пустую базу.')">Запустить перенос</button></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Что переезжает</div>
   ${[['Контакты и компании','11 480 карточек','с номерами, никами и тегами'],
      ['Сделки с историей','34 200 сделок','включая закрытые за прошлые периоды'],
      ['Переписка','WhatsApp и Instagram','привязанная к тем же контактам'],
      ['Файлы и фото','~26 ГБ','вложения из карточек сделок'],
      ['Воронка и статусы','10 статусов','ровно те, что вы продиктовали'],
      ['Поля и списки','Причины, источники, оплаты','ваши значения, а не наши']].map(x=>
    `<div class="kv" style="align-items:flex-start"><span><b>${esc(x[0])}</b><div class="sub">${esc(x[2])}</div></span><b>${esc(x[1])}</b></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Как проходит переход</div>
   <div class="tl">
    <div class="tli on"><span class="who">НЕДЕЛЯ 1</span><b>Тестовый контур</b><p>Выгружаем данные из amoCRM, поднимаем систему, показываем вам вашу же базу внутри.</p></div>
    <div class="tli on"><span class="who">НЕДЕЛЯ 2–4</span><b>Параллельная работа</b><p>Два менеджера работают в новой системе, остальные — в amoCRM. Правим то, что мешает.</p></div>
    <div class="tli on"><span class="who">НЕДЕЛЯ 5</span><b>Обучение</b><p>Два занятия по часу плюс короткие видео по каждому экрану. Записи остаются у вас.</p></div>
    <div class="tli on"><span class="who">НЕДЕЛЯ 6</span><b>Переключение</b><p>Финальная выгрузка за последние дни, все менеджеры переходят. amoCRM остаётся в режиме чтения на месяц.</p></div>
   </div>
   <div class="note" style="--tone:var(--green)"><b>Привычка — это про интерфейс, а не про данные</b>
    <p>Мы не просим вас перестроиться под нашу логику. Наоборот: воронка, названия статусов и поля делаются под то, как вы уже работаете.</p></div>
  </div>
 </div>`;

SC.kpi=()=>{
 const MG=[];
 BR.forEach(b=>b.m.forEach((m,i)=>{const o=Math.round(b.o*(i?0.45:0.55));MG.push({m,b:b.n,o,rev:o*b.avg,plan:Math.round(b.plan*(i?0.45:0.55))})}));
 MG.sort((a,b)=>b.rev-a.rev);
 return `
 <div class="head"><div><h2>План и KPI</h2>
  <p>План ставится на сеть, филиал и менеджера. Факт считается по закрытым сделкам — тем самым, которые прошли квалификацию. Никто не сводит цифры вручную в конце месяца.</p></div></div>
 <div class="strip">
  <div><small>ПЛАН СЕТИ</small><b>${fmt(F.plan)} ₸</b><span>сентябрь</span></div>
  <div><small>ФАКТ</small><b class="a">${fmt(F.rev)} ₸</b><span>${pct(F.rev,F.plan)} плана</span></div>
  <div><small>ОСТАЛОСЬ</small><b class="r">${fmt(Math.max(0,F.plan-F.rev))} ₸</b><span>до конца месяца</span></div>
  <div><small>МЕНЕДЖЕРОВ</small><b>${F.managers}</b><span>в ${F.branches} филиалах</span></div>
  <div><small>ВЫПОЛНИЛИ ПЛАН</small><b class="g">${MG.filter(m=>m.rev>=m.plan).length}</b><span>из ${MG.length}</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px">
  <thead><tr><th>Менеджер</th><th>Филиал</th><th class="right">Сделок</th><th class="right">Выручка</th><th class="right">План</th><th>Выполнение</th><th class="right">Бонус · 3%</th></tr></thead><tbody>
  ${MG.slice(0,12).map(m=>`<tr onclick="toast('Карточка менеджера: его сделки, конверсия, причины отказа и средний чек. Бонус считается по закрытым и оплаченным заказам, а не по обещаниям.')">
   <td><b>${esc(m.m)}</b></td><td class="mini">${esc(m.b)}</td>
   <td class="right mono">${m.o}</td><td class="right mono">${fmt(m.rev)} ₸</td>
   <td class="right mono">${fmt(m.plan)} ₸</td>
   <td><span class="badge ${m.rev>=m.plan?'g':m.rev/m.plan>.9?'a':'r'}">${pct(m.rev,m.plan)}</span></td>
   <td class="right mono">${fmt(m.rev*0.03)} ₸</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Что считается автоматически</div>
   <div class="chk"><i>✓</i><span>Выручка по закрытым сделкам менеджера<span class="sub">только «реализовано», предзаказы не в счёт</span></span></div>
   <div class="chk"><i>✓</i><span>Конверсия из заявки в оплату<span class="sub">видно, кто много берёт и мало доводит</span></span></div>
   <div class="chk"><i>✓</i><span>Средний чек и доля допродаж<span class="sub">открытка, ваза, доставка в срочное время</span></span></div>
   <div class="chk"><i>✓</i><span>Скорость первого ответа<span class="sub">в цветах это прямо влияет на конверсию</span></span></div>
   <div class="chk"><i>✓</i><span>Бонус по проценту от оплаченного<span class="sub">формула настраивается, процент может отличаться по филиалам</span></span></div>
  </div>
  <div class="panel"><div class="ph-title">Разрез по филиалам</div>
   ${BR.map(b=>`<div class="fr"><span>${esc(b.n)}</span>
     <div class="bar" style="--w:${Math.min(100,b.rev/b.plan*100)}%"><i class="${b.rev>=b.plan?'g':''}"></i></div>
     <b>${pct(b.rev,b.plan)}</b></div>`).join('')}
  </div>
 </div>`};

SC.tasks=()=>`
 <div class="head"><div><h2>Задачи</h2>
  <p>Вы рассказывали про «рабочий этап», где филиалы и курьеры переписываются каждый день. Здесь это превращается в задачи со сроком и ответственным — не теряется в чате.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Задача ставится из любой сделки или заказа: исполнитель, срок, приоритет. Просроченные подсвечиваются руководителю.')">+ Задача</button></div></div>
 <div class="g3">
  ${[['today','Сегодня'],['week','На неделе'],['later','Позже']].map(([k,n])=>`
   <div class="panel"><div class="ph-title">${n}</div>
    <div class="ph-sub" style="margin-bottom:9px">${TASKS.filter(t=>t.col===k).length} задач</div>
    ${TASKS.filter(t=>t.col===k).map(t=>`
     <div class="kc" style="--pr:${t.pr==='high'?'var(--red)':t.pr==='mid'?'var(--amber)':'var(--line2)'};cursor:pointer"
      onclick="toast('Задача <b>${t.id}</b> · ${esc(t.who)}. Из карточки задачи видно, к какой сделке или заказу она относится.')">
      <b>${esc(t.t)}</b>
      <div class="krow"><span class="ava ${t.pr==='high'?'r':t.pr==='mid'?'w':'b'}">${esc(t.who.slice(0,2))}</span>
       <span class="due mono">${t.due}</span></div></div>`).join('')}
   </div>`).join('')}
 </div>
 <div class="hint">Задачи создаются и автоматически: пропущенный звонок без перезвона, сделка без движения больше двух дней, повод у клиента через три дня, позиция ниже минимума на складе.</div>`;

SC.settings=()=>`
 <div class="head"><div><h2>Настройки</h2>
  <p>Вы спрашивали на встрече, что у нас в настройках и сможете ли вы менять что-то сами. Вот честный ответ: воронки, поля, списки и права меняются в интерфейсе. Новые экраны и интеграции — это уже доработка.</p></div>
  <div class="btns"><button class="btn" onclick="toast('Изменения применяются сразу для всех сотрудников. История правок сохраняется — видно, кто и когда поменял воронку.')">Сохранить</button></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Этапы воронки</div>
   <div class="ph-sub" style="margin-bottom:9px">перетаскиванием меняется порядок, крестиком — удаление</div>
   ${ST.map(([k,n])=>`<div class="srow"><span class="gr">⋮⋮</span><span class="nm">${esc(n)}</span>
     <span class="badge">${DEALS.filter(d=>d.s===k).length}</span></div>`).join('')}
   <div class="btns" style="margin-top:8px"><button class="btn" onclick="toast('Новый этап добавляется в любое место воронки. Сделки в существующих статусах не теряются.')">+ Этап</button>
    <button class="btn" onclick="toast('Можно вести несколько воронок: розница, корпоративные заказы, свадьбы. У каждой свои этапы и свои поля.')">+ Воронка</button></div>
  </div>
  <div class="panel"><div class="ph-title">Причины отказа</div>
   <div class="ph-sub" style="margin-bottom:9px">ваш список — добавляете и убираете сами</div>
   ${REASONS.map(r=>`<div class="srow"><span class="gr">⋮⋮</span><span class="nm">${esc(r[0])}</span>
     <span class="tgl on" onclick="this.classList.toggle('on');toast('Причина «${esc(r[0])}» скрыта из списка или возвращена в него. Уже закрытые сделки сохраняют свою причину и остаются в истории.')"></span></div>`).join('')}
  </div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Поля карточки сделки</div>
   ${[['Бюджет','число','обязательное при успехе'],['Источник заявки','список','обязательное'],
      ['Канал оформления','список','заполняется системой'],['Способ доставки','список','обязательное при успехе'],
      ['Вид оплаты','список','из платежа'],['Повод','список','обязательное'],
      ['Дата и время доставки','дата','обязательное'],['Получатель и адрес','текст','обязательное для доставки']].map(f=>
    `<div class="srow"><span class="nm">${esc(f[0])}<div class="sub">${esc(f[1])} · ${esc(f[2])}</div></span>
      <span class="tgl on" onclick="this.classList.toggle('on');toast('Поле включено или выключено. Свои поля добавляются тут же: текст, число, список, дата, файл или ссылка.')"></span></div>`).join('')}
   <div class="btns" style="margin-top:8px"><button class="btn" onclick="toast('Новое поле добавляется за минуту и сразу появляется в карточке, в фильтрах и в аналитике.')">+ Поле</button></div>
  </div>
  <div class="panel"><div class="ph-title">Что меняется без нас, а что — с нами</div>
   <div class="chk"><i>✓</i><span>Этапы воронок, их порядок и количество воронок</span></div>
   <div class="chk"><i>✓</i><span>Поля карточек, списки значений, обязательность</span></div>
   <div class="chk"><i>✓</i><span>Причины отказа, источники, способы доставки и оплаты</span></div>
   <div class="chk"><i>✓</i><span>Филиалы, менеджеры, права, планы и скидки</span></div>
   <div class="chk"><i>✓</i><span>Шаблоны сообщений и автоматические напоминания</span></div>
   <div class="chk no"><i>×</i><span>Новые экраны, новые интеграции, изменение логики расчётов<span class="sub">это доработка: 20 $/час, сроком и сметой согласовываем заранее</span></span></div>
   <div class="note" style="--tone:var(--acc)"><b>Ваш вопрос со встречи</b>
    <p>«Мы получим готовый результат — вся техническая часть лежит на вас, если нам что-то потребуется изменить?» Всё из списка выше вы меняете сами. Код и документация передаются вам, поэтому дорабатывать может и другая команда.</p></div>
  </div>
 </div>`;

SC.users=()=>`
 <div class="head"><div><h2>Роли и доступы</h2>
  <p>Права настраиваются галочками. Менеджер не видит чужие сделки и не выгружает базу, руководитель видит всё по продажам, деньги сети — только у владельца.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:880px">
  <thead><tr><th>Роль</th><th class="right">Разделов</th><th>Чужие сделки</th><th>Выручка сети</th><th>Настройки</th><th>Выгрузка базы</th></tr></thead><tbody>
  ${Object.entries(ROLES).map(([n,r])=>`<tr onclick="toast('Роль «${esc(n)}»: ${r.s.length} разделов. Права меняются галочками, можно создать свою роль — например, «Управляющий филиалом» с доступом только к своему филиалу.')">
   <td><b>${esc(n)}</b><div class="sub">${esc(r.note)}</div></td>
   <td class="right mono">${r.s.length}</td>
   <td>${['Руководитель продаж','Владелец','Администратор системы'].includes(n)?'<span class="badge g">видит</span>':'<span class="badge r">только свои</span>'}</td>
   <td>${['Владелец','Руководитель продаж'].includes(n)?'<span class="badge g">видит</span>':'<span class="badge r">нет</span>'}</td>
   <td>${['Администратор системы','Руководитель продаж'].includes(n)?'<span class="badge g">да</span>':'<span class="badge r">нет</span>'}</td>
   <td>${n==='Владелец'?'<span class="badge g">да</span>':'<span class="badge r">нет</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Защита базы клиентов</div>
   <div class="chk"><i>✓</i><span>Менеджер видит только своих клиентов и свою переписку</span></div>
   <div class="chk"><i>✓</i><span>Телефоны можно показывать частично: +7 701 ••• 21 40</span></div>
   <div class="chk"><i>✓</i><span>Массовая выгрузка — только у владельца, с записью в журнал</span></div>
   <div class="chk"><i>✓</i><span>Видно, кто открывал карточки и сколько за день</span></div>
   <div class="chk"><i>✓</i><span>При увольнении доступ отключается, история остаётся</span></div>
  </div>
  <div class="panel"><div class="ph-title">Сколько сотрудников в системе</div>
   <div class="kv"><span>Менеджеры филиалов</span><b>${F.managers}</b></div>
   <div class="kv"><span>Флористы</span><b>11</b></div>
   <div class="kv"><span>Курьеры</span><b>6</b></div>
   <div class="kv"><span>Руководство и администратор</span><b>3</b></div>
   <div class="kv"><span>Всего пользователей</span><b>${F.managers+20}</b></div>
   <div class="hint">Лицензий за пользователя нет. Добавляете флористов, курьеров и новые филиалы — стоимость системы не меняется, потому что система ваша.</div>
  </div>
 </div>`;

SC.economy=()=>{
 const nowM=ECON.amo+ECON.wa, nowY=nowM*12;
 const afterM=ECON.host, afterY=afterM*12;
 const saveM=nowM-afterM, saveY=saveM*12;
 const pay=saveM>0?ECON.dev/saveM:0;
 return `
 <div class="head"><div><h2>Экономика перехода</h2>
  <p>Вы сказали прямо: «всё упирается в финансы» и попросили расписать по сумме. Цифры ниже — со встречи; поправьте их на свои, расчёт пересчитается сразу.</p></div>
  <div class="btns"><button class="btn" onclick="econReset()">Вернуть цифры со встречи</button></div></div>
 <div class="g11">
  <div class="panel">
   <div class="ph-title">Что вы платите сейчас, каждый месяц</div>
   <div class="ph-sub" style="margin-bottom:10px">меняйте суммы — всё пересчитается</div>
   <div class="rows">
    <div class="rrow h"><span>Статья</span><span>Что это</span><span>В месяц, ₸</span><span>В год, ₸</span></div>
    <div class="rrow"><span>amoCRM</span><span class="mini">${F.managers} пользователей</span>
     <input type="number" value="${ECON.amo}" oninput="econSet('amo',this.value)">
     <b class="mono" style="text-align:right">${fmt(ECON.amo*12)}</b></div>
    <div class="rrow"><span>WhatsApp-интеграция</span><span class="mini">канал к amoCRM</span>
     <input type="number" value="${ECON.wa}" oninput="econSet('wa',this.value)">
     <b class="mono" style="text-align:right">${fmt(ECON.wa*12)}</b></div>
    <div class="rrow"><span style="color:var(--muted)">Посифлора</span><span class="mini">остаётся у вас</span>
     <input type="number" value="${ECON.posi}" oninput="econSet('posi',this.value)">
     <b class="mono" style="text-align:right;color:var(--muted)">${fmt(ECON.posi*12)}</b></div>
    <div class="rtot"><span>Заменяем на свою систему</span><span class="mono">${fmt(nowM)} ₸ / мес · ${fmt(nowY)} ₸ / год</span></div>
   </div>
   <div class="note" style="--tone:var(--amber)"><b>Посифлору в расчёт экономии не берём</b>
    <p>Она остаётся: POS, склад и товары — её зона. Экономия считается только по тому, что мы реально замещаем, иначе это было бы враньём в свою пользу.</p></div>
  </div>
  <div class="panel">
   <div class="ph-title">Что будет после перехода</div>
   <div class="ph-sub" style="margin-bottom:10px">разово за разработку и дальше только содержание</div>
   <div class="rows">
    <div class="rrow h"><span>Статья</span><span>Когда</span><span>Сумма, ₸</span><span>В год, ₸</span></div>
    <div class="rrow"><span>Разработка системы</span><span class="mini">один раз</span>
     <input type="number" value="${ECON.dev}" oninput="econSet('dev',this.value)">
     <b class="mono" style="text-align:right">—</b></div>
    <div class="rrow"><span>Сервер и WhatsApp-каналы</span><span class="mini">ежемесячно</span>
     <input type="number" value="${ECON.host}" oninput="econSet('host',this.value)">
     <b class="mono" style="text-align:right">${fmt(afterY)}</b></div>
    <div class="rrow"><span>Лицензии за пользователей</span><span class="mini">нет</span>
     <b class="mono" style="text-align:right">0</b><b class="mono" style="text-align:right">0</b></div>
    <div class="rtot"><span>Содержание системы</span><span class="mono">${fmt(afterM)} ₸ / мес · ${fmt(afterY)} ₸ / год</span></div>
   </div>
   <div class="kv" style="margin-top:10px"><span>Экономия в месяц</span><b style="color:var(--green)">${fmt(saveM)} ₸</b></div>
   <div class="kv"><span>Экономия в год</span><b style="color:var(--green)">${fmt(saveY)} ₸</b></div>
   <div class="kv"><span>Разработка окупается за</span><b style="color:var(--acc)">${saveM>0?num(pay)+' мес':'—'}</b></div>
   <div class="kv"><span>За три года разница</span><b style="color:var(--green)">${fmt(saveY*3-ECON.dev)} ₸</b></div>
  </div>
 </div>
 <div class="panel">
  <div class="ph-title">Что вы получаете помимо денег</div>
  <div class="g3" style="margin-top:9px">
   <div class="note" style="--tone:var(--green)"><b>Система ваша</b><p>Исходный код, база и документация передаются вам. Никто не может поднять цену, закрыть доступ или уйти с рынка вместе с вашей базой клиентов.</p></div>
   <div class="note" style="--tone:var(--acc)"><b>Сделана под вас</b><p>Ваши статусы, ваши причины отказа, ваши поля, восемь филиалов и цветочная специфика: получатель, повод, открытка, срок жизни цветка.</p></div>
   <div class="note" style="--tone:var(--amber)"><b>Оплата в три этапа</b><p>10% при старте, 45% после сдачи ядра, 45% после приёмки. Срок 4–6 недель. Ошибки правим бесплатно, доработки после сдачи — 20 $/час.</p></div>
  </div>
  <div class="hint">Цифры amoCRM и WhatsApp в таблице — ориентировочные, со слов встречи. Пришлите суммы из счетов, и мы пересчитаем экономику под ваши фактические платежи ещё до подписания договора.</div>
 </div>`};
function econSet(k,v){ECON[k]=Math.max(0,parseInt(v)||0);
 const el=document.activeElement,p=el&&el.selectionStart;render();
 const inp=document.querySelectorAll('#content input[type=number]');
 inp.forEach(i=>{if(i.getAttribute('oninput').includes("'"+k+"'")){i.focus();try{i.setSelectionRange(p,p)}catch(e){}}})}
function econReset(){ECON={amo:180000,wa:55000,posi:200000,dev:1500000,host:45000};render();
 toast('Вернули цифры со встречи 11 сентября. Посифлора — 200 000 ₸ в месяц за восемь филиалов с ваших слов.')}

SC.stack=()=>`
 <div class="head"><div><h2>Архитектура и передача</h2>
  <p>Где живёт система, из чего сделана и что именно вы получаете на руки. Это важно, потому что вы покупаете не подписку, а актив.</p></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Что передаём</div>
   <div class="chk"><i>✓</i><span>Исходный код системы<span class="sub">репозиторий переходит к вам, доступ у вашего администратора</span></span></div>
   <div class="chk"><i>✓</i><span>База данных со всеми сделками и клиентами<span class="sub">выгружается целиком в любой момент</span></span></div>
   <div class="chk"><i>✓</i><span>Документация и вики<span class="sub">как устроено, как развернуть, как дорабатывать</span></span></div>
   <div class="chk"><i>✓</i><span>Инструкции и видео для менеджеров<span class="sub">по каждому экрану, чтобы не пересказывать вручную</span></span></div>
   <div class="chk"><i>✓</i><span>Доступы к серверу и интеграциям<span class="sub">всё оформляется на вашу компанию, не на нас</span></span></div>
  </div>
  <div class="panel"><div class="ph-title">Как устроено</div>
   <div class="kv"><span>Интерфейс</span><b>веб, работает в браузере и на телефоне</b></div>
   <div class="kv"><span>Сервер</span><b>ваш или облако на ваше юрлицо</b></div>
   <div class="kv"><span>База</span><b>PostgreSQL</b></div>
   <div class="kv"><span>Каналы</span><b>WhatsApp, Instagram, телефония</b></div>
   <div class="kv"><span>Обмен</span><b>REST API · вебхуки · файлы</b></div>
   <div class="kv"><span>Резервные копии</span><b>ежедневно, хранение 30 дней</b></div>
   <div class="note" style="--tone:var(--green)"><b>Приложения ставить не нужно</b>
    <p>Курьер и флорист открывают систему в браузере телефона — экраны сделаны под маленький экран. Это ваш вопрос про «зашёл онлайн и пользуешься».</p></div>
  </div>
 </div>
 <div class="panel">
  <div class="ph-title">Этапы работ</div>
  <div class="flow">
   <div class="fb on"><code>ЭТАП 0</code><b>10%</b><p>Старт: техническое задание по экранам этого демо, согласование воронки и полей</p></div>
   <div class="fb"><code>ЭТАП 1</code><b>45%</b><p>Ядро: воронка, сделки, клиенты, заказы, филиалы, каналы, перенос из amoCRM</p></div>
   <div class="fb"><code>ЭТАП 2</code><b>45%</b><p>Полировка: аналитика, KPI, лояльность, обмен с Посифлорой, обучение</p></div>
   <div class="fb"><code>СРОК</code><b>4–6 недель</b><p>от подписания до переключения всех менеджеров</p></div>
   <div class="fb"><code>ПОСЛЕ</code><b>12 мес</b><p>исправление ошибок бесплатно, доработки по 20 $/час</p></div>
  </div>
 </div>`;

/* ===== ДРОУЭРЫ ===== */
function openDeal(id){const d=DEALS.find(x=>x.id===id);if(!d)return;
 openD(`${d.c} · ${fmt(d.sum)} ₸`,`${d.id} · ${STN[d.s]} · ${d.br} · ${d.mg}`,
  [['Сделка','toast(\'Основные поля сделки и история статусов.\')',1],
   ['Переписка','toast(\'Вся переписка по всем каналам в одной ленте: WhatsApp, Instagram и записи звонков.\')'],
   ['Заказ','toast(\'Дата и время доставки, получатель, адрес, открытка и состав букета.\')'],
   ['История','toast(\'Кто и когда менял статус и поля — с точностью до минуты.\')']],
  `<div class="panel"><div class="ph-title">Поля сделки</div>
    <div class="kv"><span>Клиент</span><b>${esc(d.c)}</b></div>
    <div class="kv"><span>Канал оформления</span><b><span class="ch ${d.ch}">${CHN[d.ch]}</span></b></div>
    <div class="kv"><span>Источник заявки</span><b>${esc(d.src)}</b></div>
    <div class="kv"><span>Повод</span><b>${esc(d.occ)}</b></div>
    <div class="kv"><span>Доставка</span><b>${esc(d.when)}</b></div>
    <div class="kv"><span>Филиал</span><b>${esc(d.br)}</b></div>
    <div class="kv"><span>Менеджер</span><b>${esc(d.mg)}</b></div>
    <div class="kv"><span>Сумма</span><b>${fmt(d.sum)} ₸</b></div>
    <div class="kv"><span>Статус</span><b>${esc(STN[d.s])}</b></div>
   </div>
   <div class="panel"><div class="ph-title">Закрытие сделки</div>
    <p class="mini">Обязательная квалификация: без причины отказа или без заполненных полей при успехе система не даст закрыть карточку.</p>
    <div class="btns" style="margin-top:9px"><button class="btn g" onclick="closeD();go('qual')">Реализовано</button>
     <button class="btn r" onclick="closeD();go('qual')">Не реализовано</button>
     <button class="btn" onclick="toast('Задача поставлена менеджеру ${esc(d.mg)} со сроком на завтра.')">Поставить задачу</button></div>
   </div>
   <div class="hint">Карточку можно перетащить между этапами прямо на доске, а можно поменять статус здесь — результат один.</div>`)}

function openClient(n){const c=CLIENTS.find(x=>x.n===n);if(!c)return;
 openD(c.n,`${c.seg} · ${c.orders} заказов на ${fmt(c.sum)} ₸`,
  [['Карточка','toast(\'История заказов, получатели, предпочтения и поводы.\')',1],
   ['Переписка','toast(\'WhatsApp, Instagram и звонки этого клиента в одной ленте.\')'],
   ['Поводы','toast(\'Даты, к которым система напомнит менеджеру заранее.\')']],
  `<div class="panel"><div class="ph-title">Что помнит система</div>
    <div class="kv"><span>Телефон</span><b class="mono">${esc(c.ph)}</b></div>
    <div class="kv"><span>Основной канал</span><b><span class="ch ${c.ch}">${CHN[c.ch]}</span></b></div>
    <div class="kv"><span>Заказов</span><b>${c.orders}</b></div>
    <div class="kv"><span>Сумма за всё время</span><b>${fmt(c.sum)} ₸</b></div>
    <div class="kv"><span>Средний чек</span><b>${fmt(c.sum/c.orders)} ₸</b></div>
    <div class="kv"><span>Последний заказ</span><b>${esc(c.last)}</b></div>
    <div class="kv"><span>Ближайший повод</span><b>${esc(c.occ)}</b></div>
    <div class="kv"><span>Предпочтения</span><b>${esc(c.fav)}</b></div>
    <div class="kv"><span>Сегмент</span><b>${esc(c.seg)}</b></div>
   </div>
   <div class="panel"><div class="ph-title">Получатели</div>
    <p class="mini">Кому этот клиент возил раньше — с адресами. В следующий раз менеджер не переспрашивает.</p>
    <div class="kv"><span>Дочь Амина</span><b class="mono">ул. Толе би 55, кв. 9</b></div>
    <div class="kv"><span>Мама</span><b class="mono">мкр. Орбита-3, д. 12</b></div>
    <div class="kv"><span>Офис</span><b class="mono">пр. Достык 89, офис 401</b></div>
   </div>
   <div class="hint">Именно это вы описывали: «клиент пишет — и сразу вся информация подтягивается: карточка, повод, день рождения».</div>`)}

function openOrder(id){const o=ORDERS.find(x=>x.id===id);if(!o)return;
 openD(`${o.id} · ${o.cl}`,`${o.br} · доставка ${o.when} · ${o.st}`,
  [['Заказ','toast(\'Состав, получатель, адрес и открытка.\')',1],
   ['Сборка','toast(\'Флорист отмечает готовность и прикладывает фото букета.\')'],
   ['Доставка','toast(\'Курьер отмечает вручение и прикладывает фото получателя.\')']],
  `<div class="panel"><div class="ph-title">Доставка</div>
    <div class="kv"><span>Заказчик</span><b>${esc(o.cl)}</b></div>
    <div class="kv"><span>Получатель</span><b>${esc(o.to)}</b></div>
    <div class="kv"><span>Адрес</span><b class="mono">${esc(o.addr)}</b></div>
    <div class="kv"><span>Дата и время</span><b class="mono">${esc(o.when)}</b></div>
    <div class="kv"><span>Текст открытки</span><b>${esc(o.card)}</b></div>
    <div class="kv"><span>Флорист</span><b>${esc(o.fl)}</b></div>
    <div class="kv"><span>Сумма</span><b>${fmt(o.sum)} ₸</b></div>
    <div class="kv"><span>Статус</span><b>${esc(o.st)}</b></div>
   </div>
   <div class="panel"><div class="ph-title">Что уходит клиенту автоматически</div>
    <div class="chk"><i>✓</i><span>Подтверждение заказа с датой и временем</span></div>
    <div class="chk"><i>✓</i><span>Фото собранного букета перед выездом курьера</span></div>
    <div class="chk"><i>✓</i><span>Уведомление о вручении с фото</span></div>
    <div class="chk"><i>✓</i><span>Просьба об отзыве через два дня</span></div>
   </div>`)}

function openBranch(n){const b=BR.find(x=>x.n===n);if(!b)return;
 openD(`Филиал ${b.n}`,`${b.o} заказов · ${fmt(b.rev)} ₸ · план ${pct(b.rev,b.plan)}`,
  [['Показатели','toast(\'Заказы, выручка, конверсия и средний чек филиала.\')',1],
   ['Менеджеры','toast(\'Два менеджера с планом и фактом по каждому.\')'],
   ['Остатки','toast(\'Остатки этого филиала и перемещения из других точек.\')']],
  `<div class="panel"><div class="ph-title">Сентябрь</div>
    <div class="kv"><span>Заказов</span><b>${b.o}</b></div>
    <div class="kv"><span>Средний чек</span><b>${fmt(b.avg)} ₸</b></div>
    <div class="kv"><span>Выручка</span><b>${fmt(b.rev)} ₸</b></div>
    <div class="kv"><span>План</span><b>${fmt(b.plan)} ₸</b></div>
    <div class="kv"><span>Выполнение</span><b style="color:${b.rev>=b.plan?'var(--green)':'var(--red)'}">${pct(b.rev,b.plan)}</b></div>
    <div class="kv"><span>Менеджеры</span><b>${b.m.join(', ')}</b></div>
    <div class="kv"><span>Доля в выручке сети</span><b>${pct(b.rev,F.rev)}</b></div>
   </div>
   <div class="hint">Менеджер этого филиала видит только его сделки и клиентов. Руководитель — всю сеть и может сравнить филиалы между собой.</div>`)}

function openLead(n,ch,msg,br){
 openD(n,`${CHN[ch]} · ${br} · обращение не в работе`,
  [['Обращение','toast(\'Сообщение, канал и клиент, если он уже в базе.\')',1]],
  `<div class="panel"><div class="ph-title">Что известно сразу</div>
    <div class="kv"><span>Канал</span><b><span class="ch ${ch}">${CHN[ch]}</span></b></div>
    <div class="kv"><span>Филиал</span><b>${esc(br)}</b></div>
    <div class="kv"><span>Сообщение</span><b>${esc(msg)}</b></div>
    <div class="kv"><span>Клиент в базе</span><b>${CLIENTS.some(c=>c.n===n)?'да, с историей':'новый'}</b></div>
   </div>
   <div class="btns"><button class="btn acc" onclick="closeD();toast('Сделка создана: канал ${CHN[ch]}, филиал ${esc(br)}, менеджер назначен по очереди. Статус — «Новая заявка».')">Создать сделку</button></div>`)}

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
 const opts=role==='Менеджер филиала'?[['Центральный','Мой филиал · Центральный']]
  :[['all','Вся сеть · 8 филиалов'],...BR.map(b=>[b.n,'Филиал '+b.n])];
 s.innerHTML=opts.map(o=>`<option value="${o[0]}" ${scope===o[0]?'selected':''}>${o[1]}</option>`).join('');
 if(role==='Менеджер филиала'){scope='Центральный';fBr='Центральный'}
 else if(!opts.some(o=>o[0]===scope))scope='all'}
function setScope(v){scope=v;fBr=v;render();
 toast(v==='all'?'Показана <b>вся сеть</b>: восемь филиалов в одном разрезе.':`Данные отфильтрованы по филиалу <b>${esc(v)}</b>. Одна система — разные разрезы под разные задачи.`)}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{
  const av=items.filter(i=>al.includes(i[0]));if(!av.length)return '';
  return `<div class="nav-g">${g}</div>`+av.map(i=>
   `<a class="${cur===i[0]?'on':''}" onclick="go('${i[0]}')"><i>${i[1]}</i>${i[2]}${i[3]?`<span class="b">${i[3]}</span>`:''}</a>`).join('')}).join('')}
const PREF={inbox:'Менеджер филиала',funnel:'Менеджер филиала',qual:'Руководитель продаж',clients:'Менеджер филиала',
 florist:'Флорист',stock:'Флорист',procure:'Флорист',delivery:'Курьер',orders:'Менеджер филиала',
 settings:'Администратор системы',posi:'Администратор системы',wa:'Администратор системы',tel:'Администратор системы',
 import:'Администратор системы',stack:'Администратор системы',users:'Администратор системы',
 dash:'Руководитель продаж',economy:'Владелец',analytics:'Руководитель продаж',kpi:'Руководитель продаж'};
const ownerOf=s=>(PREF[s]&&ROLES[PREF[s]].s.includes(s))?PREF[s]:(Object.entries(ROLES).find(([n,r])=>r.s.includes(s))||['Руководитель продаж'])[0];
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
function sparks(){const c=['#bf2f6d','#e0578f','#f6b3cd','#3c8d59','#ffffff','#d98324'];
 for(let i=0;i<52;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2300)}}
function waPing(){toast('Восемь номеров WhatsApp — по одному на филиал, Instagram Direct и телефония падают в одну ленту. Канал проставляется системой, переписка остаётся в компании.')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';try{localStorage.setItem('fl-theme',theme)}catch(e){}applyTheme()}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark');
 const b=document.getElementById('themeBtn');if(b)b.textContent=theme==='dark'?'☀ Светлая':'◐ Тёмная'}
(function(){try{const t=localStorage.getItem('fl-theme');if(t)theme=t}catch(e){}
 const q=new URLSearchParams(location.search).get('theme');if(q)theme=q;applyTheme()})();

/* ===== СЦЕНАРИЙ ПОКАЗА ===== */
const TOUR=[
 ['Менеджер филиала','inbox','<b>Шаг 1.</b> Все обращения одной лентой: WhatsApp, Instagram, звонки и сайт. Канал проставляется системой — это ваше первое требование со встречи.',7200],
 ['Менеджер филиала','funnel','<b>Шаг 2.</b> Воронка с вашими статусами: новая заявка, первое касание, подборка, отправлены варианты, дожим, счёт, предзаказ, флорист, курьер, рабочий этап. Карточка тянется мышью.',8000],
 ['Руководитель продаж','qual','<b>Шаг 3.</b> Квалификация. Нажмите любую причину отказа — цифра сразу уходит в аналитику. Закрыть сделку без причины нельзя.',7600],
 ['Руководитель продаж','analytics','<b>Шаг 4.</b> Вот та самая аналитика, о которой вы говорили: причины отказа, источники, каналы, способы доставки и оплаты. Собирается сама из полей квалификации.',7800],
 ['Руководитель продаж','path','<b>Шаг 5.</b> Главный экран: путь одного заказа от сообщения в WhatsApp до закрытой сделки. Нажимайте «Следующий шаг» — это ответ на вопрос «а это всё автоматизируете?».',8200],
 ['Менеджер филиала','clients','<b>Шаг 6.</b> Карточка клиента: история, любимые цветы, получатели и поводы. Ваш пример — «клиент пишет, и сразу подтягивается карточка и день рождения».',7400],
 ['Флорист','florist','<b>Шаг 7.</b> Флорист: очередь по времени доставки, состав букета, фото готового букета уходит заказчику само, цветы списываются с остатка.',7200],
 ['Курьер','delivery','<b>Шаг 8.</b> Курьер: маршрут в телефоне, отметка вручения с фото. Менеджер не звонит узнавать, доехали ли.',6800],
 ['Администратор системы','posi','<b>Шаг 9.</b> Посифлора. Мы её не заменяем — вы сами сказали, что это невозможно. Четыре варианта обмена, включая работу при закрытом API.',7800],
 ['Администратор системы','settings','<b>Шаг 10.</b> Настройки — ваш вопрос «а можем ли мы сами что-то менять». Воронки, поля, причины, права меняете сами. Новые экраны — доработка.',7600],
 ['Владелец','economy','<b>Шаг 11.</b> Экономика: вы сказали, что всё упирается в финансы. Поправьте суммы на свои — расчёт окупаемости пересчитается сразу.',8000],
 ['Руководитель продаж','dash','<b>Итог.</b> Полтора миллиона один раз вместо аренды чужих систем каждый месяц. Дальше проходим по каждому экрану вместе с руководством и правим под вашу сеть — из этого получается техническое задание.',8000]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();
  toast('<b>Это демо-макет по вашему рассказу.</b> Название, логотип и названия филиалов — заглушки. На следующей встрече проходим по каждому экрану вместе с руководством и правим под вашу сеть.');return}
 const [r,s,txt,ms]=TOUR[tourI++];
 if(role!==r)enter(r);
 setTimeout(()=>{go(s);toast(txt)},role!==r?380:0);
 tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');
 if(q&&SC[q]){enter(ownerOf(q));go(q)}})();
