/* ЖИБЕК · система управления швейным производством — демо по встрече 09.09.2026 (Айзада) */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);

/* ===== РОЛИ ===== */
const ROLES={
 'Директор':{av:'ДР',n:'Директор',r:'руководитель',note:'Вся картина: деньги, себестоимость, прибыль, бонусы',
  s:['dash','path','analytics','inbox','funnel','calc','clients','prod','ship','mat','goods','moves','inv','tasks','kpi','pay','docs','c1','integr','reports','import','users']},
 'Руководитель продаж':{av:'АЙ',n:'Айзада',r:'продажи и заказы',note:'Воронка, клиенты, заказы, загрузка менеджеров и бонусы',
  s:['dash','path','inbox','funnel','calc','clients','prod','ship','goods','tasks','kpi','pay','docs','reports','analytics']},
 'Менеджер по продажам':{av:'МП',n:'Динара',r:'свои клиенты',note:'Свой WhatsApp, свои B2B-клиенты, заказы и калькулятор',
  s:['inbox','funnel','calc','clients','goods','tasks','ship']},
 'Мастер цеха':{av:'МЦ',n:'Гульнара',r:'производство',note:'Задания на пошив, статусы, списание материалов',
  s:['prod','mat','goods','tasks','ship']},
 'Кладовщик':{av:'КЛ',n:'Ерлан',r:'склады',note:'Материалы и готовая продукция, приход, расход, инвентаризация',
  s:['mat','goods','moves','inv','tasks','import']},
 'Бухгалтер':{av:'БУ',n:'Сауле',r:'деньги и документы',note:'Оплаты, счета и накладные, обмен с 1С, начисления',
  s:['pay','docs','c1','kpi','clients','reports']}
};
let role='Руководитель продаж',cur='dash',theme='light',scope='all';

/* ===== МЕНЮ ===== */
const NAV=[
 ['ГЛАВНОЕ',[['dash','◧','Обзор'],['path','⇄','Путь заказа',1],['analytics','◲','Аналитика']]],
 ['ПРОДАЖИ',[['inbox','✉','Обращения',6],['funnel','▦','Воронка заказов',9],['calc','∑','Калькулятор заказа'],['clients','☺','Клиенты',6]]],
 ['ПРОИЗВОДСТВО',[['prod','◍','Цех · задания',5],['ship','⇢','Отгрузка',3]]],
 ['СКЛАДЫ',[['mat','▥','Склад материалов',5],['goods','▤','Готовая продукция'],['moves','⇅','Приход и расход'],['inv','◱','Инвентаризация'],['import','⇩','Импорт из Excel']]],
 ['КОМАНДА',[['tasks','☑','Задачи',4],['kpi','★','Зарплата и бонусы'],['users','◍','Роли и доступы']]],
 ['ДЕНЬГИ И ДОКУМЕНТЫ',[['pay','₸','Оплаты',3],['docs','▣','Документы'],['c1','⇆','Обмен с 1С'],['integr','⊞','Интеграции'],['reports','▩','Отчёты']]]
];
const TITLES={
 dash:['Обзор','Заказы, производство, склад и деньги за месяц — одной картиной'],
 path:['Путь заказа','От обращения в WhatsApp до отгрузки и оплаты: что система делает сама'],
 analytics:['Аналитика','Продажи по клиентам, изделиям и менеджерам, сезонность и маржа'],
 inbox:['Обращения','Пять номеров WhatsApp, Kaspi Магазин, телефония и сайт — одной лентой'],
 funnel:['Воронка заказов','Заявка → консультация → расчёт → согласование → производство → отгрузка'],
 calc:['Калькулятор заказа','Менеджер собирает заказ внутри сделки — сумма и КП считаются сразу'],
 clients:['Клиенты','B2B-база: за каждой компанией закреплён персональный менеджер'],
 prod:['Цех · задания','Что шьётся сейчас: раскрой, пошив, ВТО, упаковка — с ответственными'],
 ship:['Отгрузка','Что готово к выдаче, что отгружено и чем подтверждено'],
 mat:['Склад материалов','Ткани, фурнитура, нитки: остатки, списание в производство, себестоимость'],
 goods:['Готовая продукция','Что произведено, что отгружено, что осталось на балансе'],
 moves:['Приход и расход','Каждое движение по складам с документом-основанием'],
 inv:['Инвентаризация','Учёт против факта: расхождения по позициям и на какую сумму'],
 import:['Импорт из Excel','Перенос номенклатуры и клиентов из текущих таблиц — один раз, автоматически'],
 tasks:['Задачи','Поручения с исполнителями и сроками: кто что делает и в каком статусе'],
 kpi:['Зарплата и бонусы','Оклад плюс процент от выполненных заказов по каждому менеджеру'],
 users:['Роли и доступы','Кто что видит: себестоимость и зарплаты — только директору'],
 pay:['Оплаты','Предоплаты и остатки, задолженность клиентов и график поступлений'],
 docs:['Документы','Счета, накладные, КП и договоры — из системы, а не из Word'],
 c1:['Обмен с 1С','Документы и оплаты уходят в 1С, справочники синхронизируются'],
 integr:['Интеграции','WhatsApp на пять номеров, Kaspi Магазин, телефония и сайт'],
 reports:['Отчёты','Любой срез с фильтрами и выгрузкой в Excel'],
};

/* ===== ДАННЫЕ ===== */
const F={
 rev:14200000, costMat:5680000, costWork:2840000, opex:1960000,
 orders:38, avg:373684,
 matSum:4260000, matPos:86, matLow:4,
 goodsSum:1840000,
 debt:3120000, debtOver:740000,
 cash:5480000,
 waCost:36000, waNew:5000, waLines:5
};
F.cost=F.costMat+F.costWork;
F.gross=F.rev-F.cost;
F.profit=F.gross-F.opex;

const CLIENTS=[
 {id:'c1',n:'ТОО «Батыс Ойл Сервис»',t:'Нефтесервис · спецодежда',bin:'050340004512',mgr:'Динара',rev:4380000,debt:1240000,over:0,orders:7,pay:'предоплата 50%',ph:'+7 711 234 56 78'},
 {id:'c2',n:'Школа-лицей №21',t:'Школьная форма',bin:'980240001133',mgr:'Айгерим',rev:3260000,debt:820000,over:12,orders:4,pay:'по договору, 14 дней',ph:'+7 711 245 09 12'},
 {id:'c3',n:'ТОО «Каспий Маркет»',t:'Корпоративный мерч',bin:'170640008821',mgr:'Динара',rev:2540000,debt:640000,over:0,orders:9,pay:'предоплата 30%',ph:'+7 705 118 44 20'},
 {id:'c4',n:'Ресторан «Дастархан»',t:'Форма персонала',bin:'120540003377',mgr:'Жанна',rev:1720000,debt:420000,over:23,orders:6,pay:'по факту',ph:'+7 747 300 65 41'},
 {id:'c5',n:'ТОО «Стройка-Орал»',t:'Рабочая одежда',bin:'140940006654',mgr:'Айгерим',rev:1480000,debt:0,over:0,orders:8,pay:'предоплата 100%',ph:'+7 711 288 71 03'},
 {id:'c6',n:'ИП Ахметова (магазин)',t:'Опт · розница',bin:'890615400122',mgr:'Жанна',rev:820000,debt:0,over:0,orders:4,pay:'по факту',ph:'+7 701 559 12 88'},
];
const MGRS=[
 {n:'Динара',wa:'+7 771 100 20 01',clients:2,orders:16,rev:6920000,sal:180000,bonus:207600},
 {n:'Айгерим',wa:'+7 771 100 20 02',clients:2,orders:12,rev:4740000,sal:180000,bonus:142200},
 {n:'Жанна',wa:'+7 771 100 20 03',clients:2,orders:10,rev:2540000,sal:180000,bonus:76200},
 {n:'Асель',wa:'+7 771 100 20 04',clients:0,orders:0,rev:0,sal:180000,bonus:0},
 {n:'Мадина',wa:'+7 771 100 20 05',clients:0,orders:0,rev:0,sal:180000,bonus:0},
];
const INBOX=[
 {ch:'wa',who:'ТОО «Батыс Ойл Сервис»',mgr:'Динара',txt:'Нужно 120 комплектов зимней спецодежды, размеры пришлю таблицей',t:'12 мин назад',st:'new'},
 {ch:'kaspi',who:'Заказ Kaspi №K-88214',mgr:'—',txt:'Худи с логотипом, 2 шт, оплачен на Kaspi',t:'34 мин назад',st:'new'},
 {ch:'wa',who:'Школа-лицей №21',mgr:'Айгерим',txt:'Добрый день, когда будет готова вторая партия пиджаков?',t:'1 ч назад',st:'work'},
 {ch:'tel',who:'+7 705 118 44 20',mgr:'Динара',txt:'Входящий звонок, 4 мин 12 сек · запись разговора',t:'2 ч назад',st:'work'},
 {ch:'site',who:'Заявка с сайта',mgr:'—',txt:'Расчёт корпоративных футболок, 300 шт, с нанесением',t:'3 ч назад',st:'new'},
 {ch:'wa',who:'Ресторан «Дастархан»',mgr:'Жанна',txt:'Пришлите счёт на фартуки, пожалуйста',t:'вчера 17:40',st:'done'},
];
const CH={wa:['WhatsApp','g'],kaspi:['Kaspi Магазин','r'],tel:['Телефония','b'],site:['Сайт','v']};
const ORD=[
 {id:'Z-1042',cl:'c1',mgr:'Динара',n:'Зимняя спецодежда, 120 компл.',sum:5640000,st:'new',pay:0,due:'25.09'},
 {id:'Z-1041',cl:'c3',mgr:'Динара',n:'Худи с логотипом, 150 шт',sum:1875000,st:'cons',pay:0,due:'22.09'},
 {id:'Z-1040',cl:'c2',mgr:'Айгерим',n:'Пиджак школьный, 200 шт',sum:2400000,st:'calc',pay:0,due:'20.09'},
 {id:'Z-1039',cl:'c5',mgr:'Айгерим',n:'Куртка рабочая, 80 шт',sum:1360000,st:'appr',pay:1360000,due:'18.09'},
 {id:'Z-1038',cl:'c4',mgr:'Жанна',n:'Форма официанта, 40 компл.',sum:680000,st:'prod',pay:340000,due:'16.09'},
 {id:'Z-1037',cl:'c1',mgr:'Динара',n:'Футболка-поло, 300 шт',sum:1050000,st:'prod',pay:525000,due:'15.09'},
 {id:'Z-1036',cl:'c6',mgr:'Жанна',n:'Худи, 60 шт (опт)',sum:510000,st:'ship',pay:510000,due:'12.09'},
 {id:'Z-1035',cl:'c3',mgr:'Динара',n:'Кепка с вышивкой, 200 шт',sum:340000,st:'ship',pay:340000,due:'11.09'},
 {id:'Z-1034',cl:'c2',mgr:'Айгерим',n:'Юбка школьная, 180 шт',sum:1260000,st:'done',pay:1260000,due:'09.09'},
];
const OST={new:'Заявка',cons:'Консультация',calc:'Расчёт',appr:'Согласование',prod:'В производстве',ship:'К отгрузке',done:'Отгружен'};
const PROD=[
 {id:'P-318',ord:'Z-1038',n:'Форма официанта, 40 компл.',st:'cut',who:'Гульнара',qty:40,ready:40,due:'16.09'},
 {id:'P-317',ord:'Z-1037',n:'Футболка-поло, 300 шт',st:'sew',who:'Бригада 2',qty:300,ready:186,due:'15.09'},
 {id:'P-316',ord:'Z-1039',n:'Куртка рабочая, 80 шт',st:'sew',who:'Бригада 1',qty:80,ready:52,due:'18.09'},
 {id:'P-315',ord:'Z-1036',n:'Худи, 60 шт',st:'vto',who:'Бригада 2',qty:60,ready:60,due:'12.09'},
 {id:'P-314',ord:'Z-1035',n:'Кепка с вышивкой, 200 шт',st:'pack',who:'Гульнара',qty:200,ready:200,due:'11.09'},
];
const PST={cut:'Раскрой',sew:'Пошив',vto:'ВТО и контроль',pack:'Упаковка',ready:'Готово к отгрузке'};
const MAT=[
 {id:'m1',n:'Ткань габардин, 240 г/м²',u:'м',q:1840,min:800,pr:1250},
 {id:'m2',n:'Ткань поплин, белая',u:'м',q:620,min:400,pr:890},
 {id:'m3',n:'Ткань оксфорд 600D',u:'м',q:310,min:400,pr:1680},
 {id:'m4',n:'Утеплитель синтепон 200',u:'м',q:180,min:250,pr:740},
 {id:'m5',n:'Лента светоотражающая',u:'м',q:2400,min:1000,pr:210},
 {id:'m6',n:'Молния тракторная 60 см',u:'шт',q:840,min:400,pr:180},
 {id:'m7',n:'Нитки армированные 45ЛЛ',u:'бобина',q:96,min:60,pr:640},
 {id:'m8',n:'Пуговицы форменные',u:'шт',q:1200,min:2000,pr:38},
 {id:'m9',n:'Флизелин клеевой',u:'м',q:340,min:400,pr:420},
 {id:'m10',n:'Этикетки и бирки с логотипом',u:'шт',q:3400,min:1500,pr:26},
];
const GOODS=[
 {n:'Худи с логотипом',made:60,ship:60,left:0,pr:8500},
 {n:'Кепка с вышивкой',made:200,ship:200,left:0,pr:1700},
 {n:'Футболка-поло',made:186,ship:0,left:186,pr:3500},
 {n:'Куртка рабочая',made:52,ship:0,left:52,pr:17000},
 {n:'Юбка школьная',made:180,ship:180,left:0,pr:7000},
];
const MOVES=[
 {d:'09.09',t:'in',n:'Приход ткани от «Текстиль Азия»',doc:'Накладная 2214',q:'800 м · габардин',sum:1000000,who:'Ерлан'},
 {d:'09.09',t:'out',n:'Списание в производство П-317',doc:'Задание П-317',q:'420 м · поплин',sum:373800,who:'Гульнара'},
 {d:'08.09',t:'ready',n:'Оприходование готовой продукции',doc:'Задание П-314',q:'200 шт · кепка',sum:184000,who:'Гульнара'},
 {d:'08.09',t:'sale',n:'Отгрузка по заказу Z-1035',doc:'Накладная 1188',q:'200 шт · кепка',sum:184000,who:'Ерлан'},
 {d:'07.09',t:'out',n:'Списание в производство П-316',doc:'Задание П-316',q:'260 м · оксфорд',sum:436800,who:'Гульнара'},
 {d:'06.09',t:'in',n:'Приход фурнитуры',doc:'Накладная 2209',q:'600 шт · молния',sum:108000,who:'Ерлан'},
];
const MVT={in:['Приход','g'],out:['В производство','a'],ready:['Из цеха','b'],sale:['Отгрузка','v']};
const TASKS=[
 {id:'t1',n:'Собрать размерный ряд по «Батыс Ойл»',who:'Динара',st:'todo',due:'сегодня',pr:'high'},
 {id:'t2',n:'Заказать пуговицы форменные — ниже минимума',who:'Ерлан',st:'todo',due:'завтра',pr:'high'},
 {id:'t3',n:'Согласовать образец пиджака со школой',who:'Айгерим',st:'work',due:'11.09',pr:'mid'},
 {id:'t4',n:'Проверить качество партии поло, 300 шт',who:'Гульнара',st:'work',due:'14.09',pr:'mid'},
 {id:'t5',n:'Выставить счёт «Дастархану» на фартуки',who:'Сауле',st:'done',due:'08.09',pr:'low'},
 {id:'t6',n:'Инвентаризация склада материалов',who:'Ерлан',st:'done',due:'31.08',pr:'mid'},
];
const TST={todo:'К выполнению',work:'В работе',done:'Готово'};
const PAYS=[
 {d:'09.09',cl:'c5',n:'Предоплата 100% по Z-1039',sum:1360000,t:'in'},
 {d:'08.09',cl:'c3',n:'Оплата по Z-1035, полная',sum:340000,t:'in'},
 {d:'08.09',cl:'c1',n:'Предоплата 50% по Z-1037',sum:525000,t:'in'},
 {d:'07.09',cl:'c6',n:'Оплата по Z-1036',sum:510000,t:'in'},
 {d:'05.09',cl:'c2',n:'Оплата по Z-1034',sum:1260000,t:'in'},
];
const DOCS=[
 {n:'Счёт СЧ-1042',t:'Счёт на оплату',cl:'ТОО «Батыс Ойл Сервис»',d:'09.09.2026',sum:5640000},
 {n:'КП-2026-118',t:'Коммерческое предложение',cl:'ТОО «Каспий Маркет»',d:'09.09.2026',sum:1875000},
 {n:'Накладная НК-1188',t:'Накладная на отгрузку',cl:'ТОО «Каспий Маркет»',d:'08.09.2026',sum:340000},
 {n:'Договор ДГ-2026-041',t:'Договор поставки',cl:'Школа-лицей №21',d:'20.08.2026',sum:0},
 {n:'Акт АВР-2026-090',t:'Акт выполненных работ',cl:'ИП Ахметова',d:'07.09.2026',sum:510000},
];
const clOf=id=>(CLIENTS.find(c=>c.id===id)||{n:'—'}).n;

/* ===== ЭКРАНЫ ===== */
const SC={};

SC.dash=()=>`
 <div class="strip">
  <div><small>ВЫРУЧКА ЗА МЕСЯЦ</small><b class="a">${fmt(F.rev)} ₸</b><span>${F.orders} заказов, средний ${fmt(F.avg)} ₸</span></div>
  <div><small>СЕБЕСТОИМОСТЬ</small><b>${fmt(F.cost)} ₸</b><span>материалы ${fmt(F.costMat)} + пошив ${fmt(F.costWork)}</span></div>
  <div><small>ПРИБЫЛЬ</small><b class="g">${fmt(F.profit)} ₸</b><span class="g">рентабельность ${num(F.profit/F.rev*100)}%</span></div>
  <div><small>СКЛАД МАТЕРИАЛОВ</small><b>${fmt(F.matSum)} ₸</b><span class="r">${F.matLow} позиций ниже минимума</span></div>
  <div><small>ДОЛГ КЛИЕНТОВ</small><b class="r">${fmt(F.debt)} ₸</b><span class="r">просрочено ${fmt(F.debtOver)} ₸</span></div>
 </div>
 <div class="g11">
  <div class="panel"><b>Воронка заказов сейчас</b>
   ${Object.entries(OST).map(([k,v])=>{const list=ORD.filter(o=>o.st===k);
    return `<div class="kv"><span>${v}</span><b>${list.length} · ${fmt(list.reduce((a,o)=>a+o.sum,0))} ₸</b></div>`}).join('')}
   <div class="btns" style="margin-top:9px"><button class="btn acc" onclick="go('funnel')">Открыть воронку</button></div></div>
  <div class="panel"><b>Цех прямо сейчас</b>
   ${PROD.map(p=>`<div class="kv"><span>${esc(p.n)}<div class="sub">${PST[p.st]} · ${esc(p.who)}</div></span>
    <b>${p.ready} из ${p.qty}<div class="bar" style="--w:${p.ready/p.qty*100}%;width:80px;margin-top:4px"><i></i></div></b></div>`).join('')}
   <div class="btns" style="margin-top:9px"><button class="btn" onclick="go('prod')">Задания цеха</button></div></div>
 </div>
 <div class="g11">
  <div class="panel"><b>Обращения за сегодня</b>
   <div class="kv"><span>Новых, без ответа</span><b style="color:var(--red)">${INBOX.filter(i=>i.st==='new').length}</b></div>
   <div class="kv"><span>Из WhatsApp менеджеров</span><b>${INBOX.filter(i=>i.ch==='wa').length}</b></div>
   <div class="kv"><span>Из Kaspi Магазина</span><b>${INBOX.filter(i=>i.ch==='kaspi').length}</b></div>
   <div class="kv"><span>С сайта и телефонии</span><b>${INBOX.filter(i=>i.ch==='site'||i.ch==='tel').length}</b></div>
   <div class="btns" style="margin-top:9px"><button class="btn" onclick="go('inbox')">Открыть ленту</button></div></div>
  <div class="panel"><b>Менеджеры за месяц</b>
   ${MGRS.filter(m=>m.orders).map(m=>`<div class="kv"><span>${esc(m.n)}<div class="sub">${m.orders} заказов · ${m.clients} клиента</div></span>
    <b>${fmt(m.rev)} ₸<div class="sub">бонус ${fmt(m.bonus)} ₸</div></b></div>`).join('')}
   <div class="btns" style="margin-top:9px"><button class="btn" onclick="go('kpi')">Зарплата и бонусы</button></div></div>
 </div>
 <div class="hint">Все цифры собираются сами: выручка — из отгруженных заказов, себестоимость — из списанных материалов и работы цеха, долг — из счетов и оплат. Ничего не сводится в Excel вручную.</div>`;

/* --- Путь заказа: центральный экран --- */
const STEPS=[
 {k:'in',n:'Обращение в WhatsApp',d:'«Нужно 120 комплектов зимней спецодежды» — пишет ТОО «Батыс Ойл Сервис» на номер Динары',
  eff:[['Заявка создана автоматически','Клиент найден по номеру, к заявке подтянулась вся история и персональный менеджер']]},
 {k:'calc',n:'Расчёт в калькуляторе',d:'Менеджер собирает заказ внутри сделки: куртка + брюки + нанесение логотипа',
  eff:[['Сумма заказа 5 640 000 ₸','Считается по прайсу и количеству, вручную ничего не складывают'],
       ['Коммерческое предложение готово','Формируется одной кнопкой и уходит клиенту в тот же WhatsApp']]},
 {k:'appr',n:'Согласование и предоплата',d:'Клиент подтвердил, выставлен счёт на предоплату 50%',
  eff:[['Счёт выставлен','Документ создан из заказа, реквизиты подтянулись из карточки клиента'],
       ['Поступило 2 820 000 ₸','Оплата отмечена — остаток ушёл в задолженность клиента']]},
 {k:'prod',n:'Передача в цех',d:'Заказ уходит в производство одной кнопкой, цех видит задание у себя',
  eff:[['Задание П-319 создано','Раскрой → пошив → ВТО → упаковка, с ответственной бригадой и сроком'],
       ['Материалы зарезервированы','Система проверила остатки: габардина хватает, утеплитель надо дозаказать']]},
 {k:'mat',n:'Списание материалов',d:'Цех начинает раскрой, материалы списываются по норме на изделие',
  eff:[['Склад материалов −1 848 000 ₸','Списание привязано к заданию, а не «в общий котёл»'],
       ['Себестоимость заказа посчитана','Материалы плюс работа цеха — видно маржу до отгрузки']]},
 {k:'ready',n:'Продукция готова',d:'Партия прошла контроль и упаковку, статус «произведено»',
  eff:[['Готовая продукция +120 компл.','Попадает на баланс склада готовой продукции'],
       ['В воронке заказ перешёл в «К отгрузке»','Менеджер видит это сразу, звонить в цех не нужно']]},
 {k:'ship',n:'Отгрузка клиенту',d:'Кладовщик отгружает партию, печатает накладную',
  eff:[['Со склада списано 120 компл.','Остаток обновился в ту же секунду'],
       ['Признана выручка 5 640 000 ₸','Заказ закрыт, прибыль по нему посчитана'],
       ['Остаток к оплате 2 820 000 ₸','Встал в задолженность с датой по договору']]},
 {k:'bonus',n:'Оплата и бонус менеджера',d:'Клиент доплачивает остаток, заказ закрыт полностью',
  eff:[['Деньги +2 820 000 ₸','Задолженность обнулилась'],
       ['Бонус Динары +169 200 ₸','3% от суммы закрытого заказа — считается автоматически'],
       ['Документы ушли в 1С','Счёт, накладная и акт — без ручного переноса']]}
];
let stepI=-1;
function pathNext(){if(stepI<STEPS.length-1){stepI++;render();
  const s=STEPS[stepI];toast(`<b>${esc(s.n)}.</b> ${esc(s.eff[0][0])} — ${esc(s.eff[0][1])}`);
  if(stepI===STEPS.length-1)sparks()}}
function pathReset(){stepI=-1;render();toast('Цепочка сброшена. Пройдите её ещё раз — или покажите директору на встрече.')}
SC.path=()=>`
 <div class="head"><div><h2>Один заказ — от сообщения до денег</h2>
  <p>Вы спросили на встрече: «а это автоматически будет отражаться?» Вот ответ по шагам. Нажимайте «Следующий шаг» — и смотрите, что система делает сама, без второго ввода руками.</p></div>
  <div class="btns"><button class="btn acc" onclick="pathNext()">${stepI<STEPS.length-1?'Следующий шаг →':'Цепочка пройдена'}</button>
   <button class="btn" onclick="pathReset()">Сбросить</button></div></div>
 <div class="chain">${STEPS.map((s,i)=>`<span class="cs ${i<=stepI?'on':''}">${i+1}. ${esc(s.n)}</span>${i<STEPS.length-1?'<span class="ca">→</span>':''}`).join('')}</div>
 ${stepI<0?`<div class="panel" style="text-align:center;padding:34px">
   <b style="font-size:15px">Нажмите «Следующий шаг»</b>
   <p class="mini" style="margin-top:6px;max-width:560px;margin-left:auto;margin-right:auto">Мы пройдём реальный заказ на 120 комплектов зимней спецодежды: как он придёт в WhatsApp, посчитается в калькуляторе, уйдёт в цех, спишет ткань, попадёт на склад, отгрузится и превратится в деньги и бонус менеджера.</p></div>`
 :STEPS.slice(0,stepI+1).reverse().map((s,ri)=>{const i=stepI-ri;
   return `<div class="panel" style="${ri?'opacity:.72':'border-color:var(--acc)'}">
    <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
     <div><b style="font-size:14px">Шаг ${i+1} · ${esc(s.n)}</b><p class="mini" style="margin-top:4px">${esc(s.d)}</p></div>
     <span class="badge ${ri?'':'v'}">${ri?'пройдено':'сейчас'}</span></div>
    <div class="mgrid" style="grid-template-columns:repeat(${Math.min(3,s.eff.length)},1fr);margin:10px 0 0">
     ${s.eff.map(([t,d])=>`<div class="mcard${ri?'':' hit'}"><b style="font-size:12.5px">${esc(t)}</b><div class="d mini">${esc(d)}</div></div>`).join('')}</div>
   </div>`}).join('')}
 ${stepI===STEPS.length-1?'<div class="hint">Восемь шагов — и ни одной таблицы Excel, ни одного «перенеси потом». Именно это мы имеем в виду, когда говорим «разработаем под вас»: цепочка настраивается под то, как работает ваш цех, а не наоборот.</div>':''}`;

SC.inbox=()=>`
 <div class="head"><div><h2>Все обращения в одной ленте</h2>
  <p>Пять номеров WhatsApp менеджеров, Kaspi Магазин, телефония и форма с сайта. Переписка остаётся в компании, а не в личном телефоне — если менеджер уйдёт, история клиента останется у вас.</p></div>
  <div class="btns"><button class="btn" onclick="go('integr')">Настройка каналов</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:860px">
  <thead><tr><th>Канал</th><th>От кого</th><th>Сообщение</th><th>Менеджер</th><th>Когда</th><th>Статус</th></tr></thead><tbody>
  ${INBOX.map(i=>`<tr onclick="toast('Из обращения заказ создаётся одной кнопкой: клиент определяется по номеру, подтягивается история, договорные цены и персональный менеджер. Переписка прикрепляется к сделке.')">
   <td><span class="badge ${CH[i.ch][1]}">${CH[i.ch][0]}</span></td>
   <td><b>${esc(i.who)}</b></td><td class="mini">${esc(i.txt)}</td>
   <td>${i.mgr==='—'?'<span class="badge a">не распределено</span>':esc(i.mgr)}</td>
   <td class="mini">${esc(i.t)}</td>
   <td>${i.st==='new'?'<span class="badge r">новое</span>':i.st==='work'?'<span class="badge b">в работе</span>':'<span class="badge g">закрыто</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="note" style="--tone:var(--acc)"><b>Про пять номеров и B2B</b><p>Вы сказали: за каждой компанией закреплён персональный менеджер, и клиент пишет только ему. Так и оставляем — у каждого менеджера свой номер и свои клиенты. Но номера лучше оформить на компанию, а не на личные: тогда при увольнении номер и переписка остаются у вас.</p></div>
 <div class="hint">Каждый номер WhatsApp у обычного поставщика стоит 36 000 ₸ в месяц — пять номеров это 180 000 ₸ в месяц, или 2 160 000 ₸ в год. Мы подключаем через казахстанского поставщика по 5 000 ₸ за номер: 25 000 ₸ в месяц вместо 180 000. Экономия — 1 860 000 ₸ в год только на каналах.</div>`;

let dragO=null;
function ordDrag(e,id){dragO=id;e.target.classList.add('drag')}
function colOver(e,k){e.preventDefault();const el=document.getElementById('col-'+k);if(el)el.classList.add('over')}
function colOut(k){const el=document.getElementById('col-'+k);if(el)el.classList.remove('over')}
function ordDrop(e,k){e.preventDefault();colOut(k);const o=ORD.find(x=>x.id===dragO);if(!o)return;const was=o.st;o.st=k;render();
 const msg={new:'Заказ вернулся в заявки.',cons:'Менеджеру поставлена задача связаться с клиентом.',
  calc:'Открыт калькулятор: собираем состав заказа и считаем сумму.',
  appr:'Сформированы КП и счёт, клиенту отправлены в его WhatsApp.',
  prod:'Заказ ушёл в цех: создано задание на пошив, материалы зарезервированы.',
  ship:'Продукция готова и оприходована на склад — можно отгружать.',
  done:'Заказ отгружен: признана выручка, списана готовая продукция, начислен бонус менеджеру.'}[k];
 toast(`<b>${o.id}</b> · ${esc(clOf(o.cl))}. ${OST[was]} → ${OST[k]}. ${msg}`)}
SC.funnel=()=>{const cols=Object.keys(OST);
 return `<div class="head"><div><h2>Воронка заказов</h2><p>Карточку можно тянуть мышью. Видно, сколько заявок, кто их обрабатывает, на каком этапе заказ и что внутри — вы про это спрашивали на встрече.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Новый заказ можно создать вручную или одной кнопкой из обращения — тогда клиент, история и цены подтянутся сами.')">+ Заказ</button></div></div>
 <div class="board" style="grid-template-columns:repeat(7,1fr)">
  ${cols.map(k=>{const list=ORD.filter(o=>o.st===k);
   return `<div class="col" id="col-${k}" ondragover="colOver(event,'${k}')" ondragleave="colOut('${k}')" ondrop="ordDrop(event,'${k}')">
    <div class="col-h"><b>${OST[k]}</b><span class="badge">${list.length}</span></div>
    ${list.map(o=>`<div class="kc" draggable="true" style="--pr:${k==='done'?'var(--green)':k==='prod'?'var(--wheat)':'var(--acc)'}"
      ondragstart="ordDrag(event,'${o.id}')" ondragend="this.classList.remove('drag')" onclick="openOrd('${o.id}')">
     <b>${esc(o.n)}</b>
     <div class="kmeta">${esc(clOf(o.cl))}</div>
     <div class="krow"><span class="badge b">${esc(o.mgr)}</span><span class="mini">${fmt(o.sum)} ₸</span></div>
     <div class="krow"><span class="mini">до ${o.due}</span>${o.pay?`<span class="badge g">оплачено ${Math.round(o.pay/o.sum*100)}%</span>`:'<span class="badge a">без оплаты</span>'}</div></div>`).join('')||'<p class="mini">Пусто</p>'}
   </div>`}).join('')}
 </div>
 <div class="hint">Сумма по каждому этапу считается автоматически — видно, сколько денег «висит» в согласовании и сколько уже в цеху. Просроченные по сроку заказы подсвечиваются, а менеджеру ставится задача.</div>`};
function openOrd(id){const o=ORD.find(x=>x.id===id);const c=CLIENTS.find(x=>x.id===o.cl);
 openD(`${o.id} · ${o.n}`,`${c.n} · менеджер ${o.mgr} · срок ${o.due}`,
  [['Заказ','openOrd(\''+id+'\')',1],['Калькулятор','go(\'calc\')'],['Производство','go(\'prod\')'],['Оплаты','go(\'pay\')']],
  `<div class="kv"><span>Статус</span><b><span class="badge ${o.st==='done'?'g':o.st==='prod'?'a':'b'}">${OST[o.st]}</span></b></div>
   <div class="kv"><span>Сумма заказа</span><b>${fmt(o.sum)} ₸</b></div>
   <div class="kv"><span>Оплачено</span><b style="color:${o.pay?'var(--green)':'var(--red)'}">${o.pay?fmt(o.pay)+' ₸ ('+Math.round(o.pay/o.sum*100)+'%)':'нет'}</b></div>
   <div class="kv"><span>Остаток к оплате</span><b>${fmt(o.sum-o.pay)} ₸</b></div>
   <div class="kv"><span>Условия клиента</span><b>${esc(c.pay)}</b></div>
   <div class="panel" style="margin-top:11px"><b>Состав заказа</b>
    <div class="kv"><span>Куртка зимняя, размерный ряд</span><b>120 шт × 32 000 ₸</b></div>
    <div class="kv"><span>Брюки утеплённые</span><b>120 шт × 14 000 ₸</b></div>
    <div class="kv"><span>Нанесение логотипа</span><b>120 шт × 1 000 ₸</b></div>
    <p class="mini" style="margin-top:7px">Состав собирается в калькуляторе внутри сделки: сумма и коммерческое предложение считаются сразу, менеджер не открывает Excel.</p></div>
   <div class="panel"><b>Себестоимость и маржа</b>
    <div class="kv"><span>Материалы по норме</span><b>${fmt(o.sum*0.4)} ₸</b></div>
    <div class="kv"><span>Работа цеха</span><b>${fmt(o.sum*0.2)} ₸</b></div>
    <div class="kv"><span>Маржа по заказу</span><b style="color:var(--green)">${fmt(o.sum*0.4)} ₸ · 40%</b></div>
    <p class="mini" style="margin-top:7px">Видно до запуска в цех: если клиент просит скидку, сразу понятно, до какой границы можно идти.</p></div>`)}

const CALC=[
 {n:'Куртка зимняя рабочая',pr:32000,q:120},
 {n:'Брюки утеплённые',pr:14000,q:120},
 {n:'Нанесение логотипа (шелкография)',pr:1000,q:120},
 {n:'Упаковка индивидуальная',pr:300,q:120},
];
let calcQ=CALC.map(c=>c.q),calcDisc=0;
function calcSet(i,v){calcQ[i]=Math.max(0,parseInt(v,10)||0);render()}
function calcDiscSet(v){calcDisc=Math.min(20,Math.max(0,parseInt(v,10)||0));render()}
SC.calc=()=>{const rows=CALC.map((c,i)=>({...c,q:calcQ[i],sum:c.pr*calcQ[i]}));
 const sub=rows.reduce((a,r)=>a+r.sum,0),disc=Math.round(sub*calcDisc/100),tot=sub-disc;
 const cost=Math.round(tot*0.6);
 return `<div class="head"><div><h2>Калькулятор внутри сделки</h2>
  <p>Менеджер открывает заказ и собирает его прямо здесь: позиции, количество, скидка. Итоговая сумма и коммерческое предложение считаются сразу — не в отдельном файле.</p></div></div>
 <div class="g21">
  <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:560px">
   <thead><tr><th>Позиция</th><th class="right">Цена</th><th class="right" style="width:120px">Количество</th><th class="right">Сумма</th></tr></thead><tbody>
   ${rows.map((r,i)=>`<tr><td><b>${esc(r.n)}</b></td><td class="right mono">${fmt(r.pr)} ₸</td>
    <td class="right"><input type="number" min="0" value="${r.q}" oninput="calcSet(${i},this.value)"
      style="width:88px;padding:5px 7px;border:1px solid var(--line2);border-radius:7px;background:var(--card);color:var(--text);font:inherit;font-size:11px;text-align:right"></td>
    <td class="right mono"><b>${fmt(r.sum)} ₸</b></td></tr>`).join('')}
  </tbody></table></div></div>
  <div class="panel"><b>Итог по заказу</b>
   <div class="kv"><span>Сумма без скидки</span><b>${fmt(sub)} ₸</b></div>
   <div class="kv"><span>Скидка
    <input type="number" min="0" max="20" value="${calcDisc}" oninput="calcDiscSet(this.value)"
     style="width:56px;margin-left:7px;padding:3px 6px;border:1px solid var(--line2);border-radius:6px;background:var(--card);color:var(--text);font:inherit;font-size:11px;text-align:right">%</span>
    <b style="color:var(--red)">−${fmt(disc)} ₸</b></div>
   <div class="kv"><span><b>К оплате</b></span><b style="font-size:16px;color:var(--acc)">${fmt(tot)} ₸</b></div>
   <div class="kv"><span>Себестоимость</span><b>${fmt(cost)} ₸</b></div>
   <div class="kv"><span>Маржа</span><b style="color:${tot-cost>0?'var(--green)':'var(--red)'}">${fmt(tot-cost)} ₸ · ${tot?num((tot-cost)/tot*100):0}%</b></div>
   <div class="btns" style="margin-top:10px">
    <button class="btn acc" onclick="toast('Коммерческое предложение сформировано на фирменном бланке и готово к отправке клиенту в WhatsApp одной кнопкой.')">Сформировать КП</button>
    <button class="btn" onclick="toast('Счёт на предоплату создан из заказа: реквизиты клиента подставлены из карточки, сумма — из калькулятора.')">Выставить счёт</button></div>
   <p class="mini" style="margin-top:9px">Маржа считается на лету. Менеджер сразу видит, до какой скидки можно опуститься, чтобы заказ не ушёл в минус.</p></div>
 </div>
 <div class="hint">Прайс и нормы расхода материалов заводятся один раз в справочнике. Дальше калькулятор берёт цены оттуда — у всех менеджеров они одинаковые, «по памяти» никто не считает.</div>`};

SC.clients=()=>`
 <div class="head"><div><h2>Клиенты · ${CLIENTS.length}</h2><p>B2B-база: за каждой компанией закреплён персональный менеджер, он и ведёт переписку со своего номера.</p></div>
  <div class="btns"><button class="btn" onclick="go('import')">Импорт из Excel</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px">
  <thead><tr><th>Клиент</th><th>Профиль</th><th>Менеджер</th><th class="right">Заказов</th><th class="right">Выручка</th><th class="right">Долг</th><th>Просрочка</th></tr></thead><tbody>
  ${CLIENTS.map(c=>`<tr onclick="openClient('${c.id}')">
   <td><b>${esc(c.n)}</b><div class="sub">БИН ${esc(c.bin)}</div></td>
   <td class="mini">${esc(c.t)}</td><td><span class="badge b">${esc(c.mgr)}</span></td>
   <td class="right mono">${c.orders}</td><td class="right mono">${fmt(c.rev)} ₸</td>
   <td class="right mono">${c.debt?fmt(c.debt)+' ₸':'—'}</td>
   <td>${c.over?`<span class="badge r">${c.over} дн.</span>`:'<span class="badge g">нет</span>'}</td></tr>`).join('')}
  <tr><td><b>Итого</b></td><td></td><td></td><td class="right mono"><b>${CLIENTS.reduce((a,c)=>a+c.orders,0)}</b></td>
   <td class="right mono"><b>${fmt(CLIENTS.reduce((a,c)=>a+c.rev,0))} ₸</b></td>
   <td class="right mono"><b style="color:var(--red)">${fmt(CLIENTS.reduce((a,c)=>a+c.debt,0))} ₸</b></td><td></td></tr>
 </tbody></table></div></div>
 <div class="hint">Итог по выручке совпадает с обзором (${fmt(F.rev)} ₸), а итог по долгу — с разделом «Оплаты». Это один расчёт в разных разрезах, а не три отдельные таблицы.</div>`;
function openClient(id){const c=CLIENTS.find(x=>x.id===id);const ords=ORD.filter(o=>o.cl===id);
 openD(c.n,`${c.t} · БИН ${c.bin} · менеджер ${c.mgr}`,
  [['Карточка','openClient(\''+id+'\')',1],['Заказы ('+ords.length+')','go(\'funnel\')'],['Оплаты','go(\'pay\')'],['Документы','go(\'docs\')']],
  `<div class="kv"><span>Телефон / WhatsApp</span><b>${esc(c.ph)}</b></div>
   <div class="kv"><span>Персональный менеджер</span><b>${esc(c.mgr)}</b></div>
   <div class="kv"><span>Условия оплаты</span><b>${esc(c.pay)}</b></div>
   <div class="kv"><span>Заказов за месяц</span><b>${c.orders}</b></div>
   <div class="kv"><span>Выручка</span><b>${fmt(c.rev)} ₸</b></div>
   <div class="kv"><span>Задолженность</span><b style="color:${c.debt?'var(--red)':'inherit'}">${c.debt?fmt(c.debt)+' ₸':'нет'}</b></div>
   ${c.over?`<div class="note" style="--tone:var(--red)"><b>Просрочка ${c.over} дней</b><p>Система поставила задачу менеджеру и подготовила акт сверки. Новые заказы этого клиента подсвечиваются до погашения долга.</p></div>`:''}
   <div class="panel" style="margin-top:11px"><b>Заказы клиента</b>
    ${ords.length?ords.map(o=>`<div class="kv"><span>${o.id} · ${esc(o.n)}</span><b>${fmt(o.sum)} ₸ <span class="badge ${o.st==='done'?'g':'b'}">${OST[o.st]}</span></b></div>`).join(''):'<p class="mini">Заказов нет.</p>'}</div>
   <div class="panel"><b>История общения</b>
    <p class="mini">Вся переписка из WhatsApp, записи звонков и отправленные КП хранятся в карточке. Если менеджер уходит — клиент передаётся другому вместе с историей, а не с нуля.</p></div>`)}

let dragP=null;
function prodDrag(e,id){dragP=id;e.target.classList.add('drag')}
function prodDrop(e,k){e.preventDefault();colOut(k);const p=PROD.find(x=>x.id===dragP);if(!p)return;p.st=k;
 if(k==='ready')p.ready=p.qty;
 render();
 const msg={cut:'Раскрой начат — ткань списывается со склада материалов по норме на изделие.',
  sew:'Партия в пошиве. Бригада видит задание у себя, руководитель — процент готовности.',
  vto:'ВТО и контроль качества. Брак отмечается отдельно и не уходит клиенту.',
  pack:'Упаковка и маркировка. Готовим к оприходованию на склад.',
  ready:'Продукция оприходована на склад готовой продукции, заказ в воронке перешёл в «К отгрузке».'}[k];
 toast(`<b>${p.id}</b> · ${esc(p.n)}. ${msg}`)}
SC.prod=()=>{const cols=Object.keys(PST);
 return `<div class="head"><div><h2>Задания цеха</h2><p>Заказ из воронки приходит сюда автоматически. Карточку можно тянуть по этапам — статус сразу виден менеджеру в воронке.</p></div></div>
 <div class="board" style="grid-template-columns:repeat(5,1fr)">
  ${cols.map(k=>{const list=PROD.filter(p=>p.st===k);
   return `<div class="col" id="col-${k}" ondragover="colOver(event,'${k}')" ondragleave="colOut('${k}')" ondrop="prodDrop(event,'${k}')">
    <div class="col-h"><b>${PST[k]}</b><span class="badge">${list.length}</span></div>
    ${list.map(p=>`<div class="kc" draggable="true" style="--pr:${k==='ready'?'var(--green)':'var(--wheat)'}"
      ondragstart="prodDrag(event,'${p.id}')" ondragend="this.classList.remove('drag')" onclick="openProd('${p.id}')">
     <b>${esc(p.n)}</b><div class="kmeta">${p.id} · заказ ${p.ord} · ${esc(p.who)}</div>
     <div class="krow"><span class="mini">до ${p.due}</span><span class="badge ${p.ready===p.qty?'g':'a'}">${p.ready} / ${p.qty}</span></div>
     <div class="bar" style="--w:${p.ready/p.qty*100}%;margin-top:6px"><i></i></div></div>`).join('')||'<p class="mini">Пусто</p>'}
   </div>`}).join('')}
 </div>
 <div class="note" style="--tone:var(--acc)"><b>Про ваш процесс</b><p>Вы сказали: производим и сразу продаём, склад готовой продукции почти не держите. Так и настроено — партия проходит через склад транзитом, но остаётся след: сколько произвели, сколько отгрузили, что осталось на балансе. Без этого не посчитать себестоимость и не найти расхождение.</p></div>`};
function openProd(id){const p=PROD.find(x=>x.id===id);
 openD(`${p.id} · ${p.n}`,`Заказ ${p.ord} · ответственный ${p.who} · срок ${p.due}`,
  [['Задание','openProd(\''+id+'\')',1],['Материалы','go(\'mat\')'],['Заказ','go(\'funnel\')']],
  `<div class="kv"><span>Этап</span><b><span class="badge ${p.st==='ready'?'g':'a'}">${PST[p.st]}</span></b></div>
   <div class="kv"><span>Готово</span><b>${p.ready} из ${p.qty}</b></div>
   <div class="panel" style="margin-top:11px"><b>Материалы по норме</b>
    <div class="kv"><span>Ткань габардин · 2,4 м на изделие</span><b>${fmt(p.qty*2.4)} м</b></div>
    <div class="kv"><span>Нитки · 0,08 бобины</span><b>${num(p.qty*0.08)} бобины</b></div>
    <div class="kv"><span>Молния · 1 шт</span><b>${p.qty} шт</b></div>
    <p class="mini" style="margin-top:7px">Нормы заводятся один раз на изделие. При запуске задания материалы списываются со склада автоматически — кладовщику ничего не диктуют по телефону.</p></div>
   <div class="panel"><b>Себестоимость партии</b>
    <div class="kv"><span>Материалы</span><b>${fmt(p.qty*7400)} ₸</b></div>
    <div class="kv"><span>Работа цеха</span><b>${fmt(p.qty*3700)} ₸</b></div>
    <div class="kv"><span>Итого себестоимость</span><b>${fmt(p.qty*11100)} ₸</b></div></div>`)}

SC.ship=()=>`
 <div class="head"><div><h2>Отгрузка</h2><p>Что готово к выдаче, что уже отгружено и чем подтверждено. Отгрузка списывает продукцию со склада и закрывает заказ в воронке.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px">
  <thead><tr><th>Заказ</th><th>Клиент</th><th>Что отгружаем</th><th class="right">Сумма</th><th>Документ</th><th>Статус</th></tr></thead><tbody>
  ${ORD.filter(o=>o.st==='ship'||o.st==='done').map(o=>`<tr onclick="openOrd('${o.id}')">
   <td><b>${o.id}</b></td><td>${esc(clOf(o.cl))}</td><td class="mini">${esc(o.n)}</td>
   <td class="right mono">${fmt(o.sum)} ₸</td>
   <td class="mini">${o.st==='done'?'Накладная подписана':'Накладная готова к печати'}</td>
   <td>${o.st==='done'?'<span class="badge g">отгружено</span>':'<span class="badge a">к отгрузке</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint">Для заказов из Kaspi Магазина статус отправки проставляется автоматически: система передаёт его в Kaspi, вручную заносить ничего не нужно. Это то, о чём вы спрашивали на встрече.</div>`;

SC.mat=()=>`
 <div class="strip" style="grid-template-columns:repeat(4,1fr)">
  <div><small>СТОИМОСТЬ МАТЕРИАЛОВ</small><b class="a">${fmt(F.matSum)} ₸</b><span>${F.matPos} позиций</span></div>
  <div><small>НИЖЕ МИНИМУМА</small><b class="r">${F.matLow}</b><span>нужно дозаказать</span></div>
  <div><small>СПИСАНО В ЦЕХ ЗА МЕСЯЦ</small><b>${fmt(F.costMat)} ₸</b><span>по нормам на изделие</span></div>
  <div><small>ОБОРАЧИВАЕМОСТЬ</small><b>28 дн.</b><span>средний срок хранения</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px">
  <thead><tr><th>Материал</th><th>Ед.</th><th class="right">Остаток</th><th class="right">Минимум</th><th class="right">Цена</th><th class="right">Сумма</th><th>Статус</th></tr></thead><tbody>
  ${MAT.map(m=>`<tr onclick="toast('Карточка материала: движение за период, в какие задания списывался, поставщики и история закупочных цен. Отсюда же создаётся заявка на закуп.')">
   <td><b>${esc(m.n)}</b></td><td class="mini">${m.u}</td>
   <td class="right mono"><b>${fmt(m.q)}</b></td><td class="right mono">${fmt(m.min)}</td>
   <td class="right mono">${fmt(m.pr)} ₸</td><td class="right mono">${fmt(m.q*m.pr)} ₸</td>
   <td>${m.q<m.min?'<span class="badge r">ниже минимума</span>':m.q<m.min*1.3?'<span class="badge a">на исходе</span>':'<span class="badge g">в норме</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint">Показаны 10 позиций из ${F.matPos}. Остаток меняется сам: приход от поставщика увеличивает, запуск задания в цех уменьшает — по норме расхода на изделие. Когда позиция падает ниже минимума, система ставит задачу кладовщику.</div>`;

SC.goods=()=>{const made=GOODS.reduce((a,g)=>a+g.made*g.pr,0),ship=GOODS.reduce((a,g)=>a+g.ship*g.pr,0);
 return `<div class="strip" style="grid-template-columns:repeat(4,1fr)">
  <div><small>ПРОИЗВЕДЕНО ЗА МЕСЯЦ</small><b>${fmt(made)} ₸</b><span>в отпускных ценах</span></div>
  <div><small>ОТГРУЖЕНО</small><b class="g">${fmt(ship)} ₸</b><span>закрыто накладными</span></div>
  <div><small>ОСТАТОК НА СКЛАДЕ</small><b class="a">${fmt(F.goodsSum)} ₸</b><span>ждёт отгрузки</span></div>
  <div><small>ПОЗИЦИЙ В ОСТАТКЕ</small><b>${GOODS.filter(g=>g.left).length}</b><span>по видам изделий</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:760px">
  <thead><tr><th>Изделие</th><th class="right">Произведено</th><th class="right">Отгружено</th><th class="right">Остаток</th><th class="right">Цена</th><th class="right">Сумма остатка</th></tr></thead><tbody>
  ${GOODS.map(g=>`<tr onclick="toast('По каждому изделию видно: что произвели, что отгрузили и что осталось. Расхождение между этими цифрами — первый признак, что где-то не оформили движение.')">
   <td><b>${esc(g.n)}</b></td><td class="right mono">${g.made}</td><td class="right mono">${g.ship}</td>
   <td class="right mono"><b style="color:${g.left?'var(--wheat)':'inherit'}">${g.left}</b></td>
   <td class="right mono">${fmt(g.pr)} ₸</td>
   <td class="right mono">${g.left?fmt(g.left*g.pr)+' ₸':'—'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="note" style="--tone:var(--wheat)"><b>Произвели — сразу продали</b><p>У вас продукция почти не залёживается, и это правильно. Но след всё равно нужен: без него не видно, где партия «зависла» и почему клиент ждёт вторую неделю.</p></div>`};

SC.moves=()=>`
 <div class="head"><div><h2>Приход и расход по складам</h2><p>Каждое движение с документом-основанием: накладная, задание цеха или отгрузка. Списать «просто так» нельзя.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:860px">
  <thead><tr><th>Дата</th><th>Тип</th><th>Операция</th><th>Основание</th><th>Количество</th><th class="right">Сумма</th><th>Кто</th></tr></thead><tbody>
  ${MOVES.map(m=>`<tr onclick="toast('От любой строки можно перейти к документу и к заданию, по которому она возникла. Вопрос «куда делось 400 метров ткани» закрывается за десять секунд.')">
   <td class="mono">${m.d}</td><td><span class="badge ${MVT[m.t][1]}">${MVT[m.t][0]}</span></td>
   <td><b>${esc(m.n)}</b></td><td class="mini">${esc(m.doc)}</td><td class="mini">${esc(m.q)}</td>
   <td class="right mono" style="color:${m.t==='in'||m.t==='ready'?'var(--green)':'var(--red)'}">${m.t==='in'||m.t==='ready'?'+':'−'}${fmt(m.sum)} ₸</td>
   <td>${esc(m.who)}</td></tr>`).join('')}
 </tbody></table></div></div>`;

SC.inv=()=>`
 <div class="head"><div><h2>Инвентаризация · 31.08.2026</h2><p>Учёт против факта. Расхождения по позициям, на какую сумму и по чьей вине.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Инвентаризация с телефона: открываете список, вводите фактический остаток. Система сама считает разницу и формирует акт списания или оприходования излишков.')">Начать инвентаризацию</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:800px">
  <thead><tr><th>Позиция</th><th class="right">По учёту</th><th class="right">По факту</th><th class="right">Разница</th><th class="right">Сумма</th><th>Причина</th></tr></thead><tbody>
  ${[['Ткань габардин, 240 г/м²','м',1900,1840,-60,1250,'обрезки при раскрое, норма не уточнена'],
     ['Ткань поплин, белая','м',640,620,-20,890,'списано без отметки'],
     ['Молния тракторная 60 см','шт',860,840,-20,180,'брак при пошиве'],
     ['Нитки армированные 45ЛЛ','бобина',96,96,0,640,'—'],
     ['Лента светоотражающая','м',2400,2400,0,210,'—']].map(([n,u,uch,f,d,pr,why])=>`<tr>
   <td><b>${esc(n)}</b><div class="sub">${u}</div></td><td class="right mono">${fmt(uch)}</td><td class="right mono">${fmt(f)}</td>
   <td class="right mono" style="color:${d?'var(--red)':'var(--green)'}">${d||'0'}</td>
   <td class="right mono">${d?fmt(Math.abs(d*pr))+' ₸':'—'}</td><td class="mini">${esc(why)}</td></tr>`).join('')}
  <tr><td><b>Итого расхождений</b></td><td></td><td></td><td class="right mono"><b style="color:var(--red)">−100</b></td>
   <td class="right mono"><b style="color:var(--red)">96 400 ₸</b></td><td class="mini">по трём позициям</td></tr>
 </tbody></table></div></div>
 <div class="hint">96 400 ₸ за месяц — это больше миллиона в год. Причина почти всегда одна: материал взяли в цех и не оформили, или норма расхода на изделие не уточнялась годами. В системе списание идёт по норме автоматически, поэтому расхождение видно на следующий день, а не через год.</div>`;

SC.import=()=>`
 <div class="head"><div><h2>Импорт из Excel</h2><p>Вы сказали, что товаров много и они меняются по сезонам. Переносим один раз автоматически — руками ничего не набивают.</p></div></div>
 <div class="g3">
  <div class="panel"><small class="mini">НОМЕНКЛАТУРА</small><div style="font-size:24px;font-weight:800">1 240</div><p class="mini">позиций изделий и материалов из вашей текущей таблицы</p>
   <div class="btns" style="margin-top:9px"><button class="btn acc" onclick="toast('Загружаете файл Excel — система показывает, какие колонки к каким полям привязать, и переносит всё за один раз. Дубли находит и предлагает объединить.')">Загрузить файл</button></div></div>
  <div class="panel"><small class="mini">КЛИЕНТЫ</small><div style="font-size:24px;font-weight:800">180</div><p class="mini">компаний с реквизитами, контактами и историей заказов</p>
   <div class="btns" style="margin-top:9px"><button class="btn" onclick="toast('Клиенты переносятся с реквизитами и закреплением за менеджером. Дальше история заказов копится уже в системе.')">Загрузить файл</button></div></div>
  <div class="panel"><small class="mini">ОСТАТКИ СКЛАДА</small><div style="font-size:24px;font-weight:800">86</div><p class="mini">позиций материалов с текущими остатками и ценами</p>
   <div class="btns" style="margin-top:9px"><button class="btn" onclick="toast('Остатки загружаются на дату старта. С этого момента склад ведёт система, а таблица больше не нужна.')">Загрузить файл</button></div></div>
 </div>
 <div class="note" style="--tone:var(--acc)"><b>Сезонность — не проблема</b><p>Новая коллекция добавляется списком: загрузили файл сезона, система создала позиции с ценами и нормами расхода. Старые не удаляются, а уходят в архив — история продаж по ним остаётся.</p></div>
 <div class="hint">Тысяча позиций — это немного. Мы переносили каталоги на десятки тысяч наименований; ваш объём загружается за один вечер вместе с остатками и клиентами.</div>`;

let dragT=null;
function taskDrag(e,id){dragT=id;e.target.classList.add('drag')}
function taskDrop(e,k){e.preventDefault();colOut(k);const t=TASKS.find(x=>x.id===dragT);if(!t)return;t.st=k;render();
 toast(`<b>${esc(t.n)}</b> → ${TST[k]}. Исполнитель получил уведомление, изменение записано в историю задачи.`)}
SC.tasks=()=>{const cols=Object.keys(TST);
 return `<div class="head"><div><h2>Задачи команды</h2><p>Вы говорили: нужно видеть, кто что делает и в каком статусе. Задачи ставятся руками или создаются системой — например, когда материал упал ниже минимума.</p></div>
  <div class="btns"><button class="btn acc" onclick="toast('Задача: что сделать, кто исполнитель, срок и приоритет. Можно привязать к заказу, клиенту или заданию цеха.')">+ Задача</button></div></div>
 <div class="board" style="grid-template-columns:repeat(3,1fr)">
  ${cols.map(k=>{const list=TASKS.filter(t=>t.st===k);
   return `<div class="col" id="col-${k}" ondragover="colOver(event,'${k}')" ondragleave="colOut('${k}')" ondrop="taskDrop(event,'${k}')">
    <div class="col-h"><b>${TST[k]}</b><span class="badge">${list.length}</span></div>
    ${list.map(t=>`<div class="kc" draggable="true" style="--pr:${t.pr==='high'?'var(--red)':t.pr==='mid'?'var(--wheat)':'var(--acc)'}"
      ondragstart="taskDrag(event,'${t.id}')" ondragend="this.classList.remove('drag')">
     <b>${esc(t.n)}</b><div class="kmeta">${esc(t.who)}</div>
     <div class="krow"><span class="mini">срок: ${t.due}</span>
      <span class="badge ${t.pr==='high'?'r':t.pr==='mid'?'a':'b'}">${t.pr==='high'?'срочно':t.pr==='mid'?'обычная':'низкая'}</span></div></div>`).join('')||'<p class="mini">Пусто</p>'}
   </div>`}).join('')}
 </div>
 <div class="hint">Задачи по инвентаризации и закупу система ставит сама: увидела позицию ниже минимума — создала поручение кладовщику со сроком. Не нужно помнить об этом в голове.</div>`};

SC.kpi=()=>{const tot=MGRS.reduce((a,m)=>a+m.sal+m.bonus,0);
 return `<div class="head"><div><h2>Зарплата и бонусы менеджеров</h2>
  <p>Вы спрашивали, как считается бонус. Оклад плюс процент от суммы закрытых заказов — считается системой по факту отгрузки, а не по обещаниям.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:820px">
  <thead><tr><th>Менеджер</th><th>Номер WhatsApp</th><th class="right">Заказов</th><th class="right">Выручка</th><th class="right">Оклад</th><th class="right">Бонус 3%</th><th class="right">Итого</th></tr></thead><tbody>
  ${MGRS.map(m=>`<tr onclick="toast('Бонус начисляется только по отгруженным и оплаченным заказам. Менеджер видит свой расчёт в системе — вопрос «почему мне столько» закрывается списком заказов.')">
   <td><b>${esc(m.n)}</b></td><td class="mini mono">${esc(m.wa)}</td>
   <td class="right mono">${m.orders||'—'}</td><td class="right mono">${m.rev?fmt(m.rev)+' ₸':'—'}</td>
   <td class="right mono">${fmt(m.sal)} ₸</td>
   <td class="right mono" style="color:${m.bonus?'var(--green)':'inherit'}">${m.bonus?fmt(m.bonus)+' ₸':'—'}</td>
   <td class="right mono"><b>${fmt(m.sal+m.bonus)} ₸</b></td></tr>`).join('')}
  <tr><td><b>Итого к выплате</b></td><td></td><td class="right mono"><b>${MGRS.reduce((a,m)=>a+m.orders,0)}</b></td>
   <td class="right mono"><b>${fmt(MGRS.reduce((a,m)=>a+m.rev,0))} ₸</b></td>
   <td class="right mono"><b>${fmt(MGRS.reduce((a,m)=>a+m.sal,0))} ₸</b></td>
   <td class="right mono"><b>${fmt(MGRS.reduce((a,m)=>a+m.bonus,0))} ₸</b></td>
   <td class="right mono"><b>${fmt(tot)} ₸</b></td></tr>
 </tbody></table></div></div>
 <div class="note" style="--tone:var(--acc)"><b>Схема настраивается</b><p>Процент можно сделать разным по видам изделий, по новым и постоянным клиентам, или ступенчатым — до плана один процент, сверх плана другой. Правило задаётся в настройках, пересчёт идёт сам.</p></div>`};

SC.pay=()=>`
 <div class="strip" style="grid-template-columns:repeat(4,1fr)">
  <div><small>ПОСТУПИЛО ЗА МЕСЯЦ</small><b class="g">${fmt(PAYS.reduce((a,p)=>a+p.sum,0))} ₸</b><span>по ${PAYS.length} оплатам</span></div>
  <div><small>ДЕНЬГИ НА СЧЕТАХ</small><b>${fmt(F.cash)} ₸</b><span>касса и банк</span></div>
  <div><small>ДОЛГ КЛИЕНТОВ</small><b class="r">${fmt(F.debt)} ₸</b><span>по выставленным счетам</span></div>
  <div><small>ИЗ НИХ ПРОСРОЧЕНО</small><b class="r">${fmt(F.debtOver)} ₸</b><span>${num(F.debtOver/F.debt*100)}% долга</span></div>
 </div>
 <div class="g11">
  <div class="panel" style="padding:0"><div style="padding:12px 14px 2px"><b>Последние поступления</b></div>
   <div class="tw"><table class="data"><thead><tr><th>Дата</th><th>От кого</th><th class="right">Сумма</th></tr></thead><tbody>
   ${PAYS.map(p=>`<tr><td class="mono">${p.d}</td><td><b>${esc(clOf(p.cl))}</b><div class="sub">${esc(p.n)}</div></td>
    <td class="right mono" style="color:var(--green)">+${fmt(p.sum)} ₸</td></tr>`).join('')}
   </tbody></table></div></div>
  <div class="panel" style="padding:0"><div style="padding:12px 14px 2px"><b>Кто должен</b></div>
   <div class="tw"><table class="data"><thead><tr><th>Клиент</th><th class="right">Долг</th><th>Просрочка</th></tr></thead><tbody>
   ${CLIENTS.filter(c=>c.debt).map(c=>`<tr onclick="openClient('${c.id}')">
    <td><b>${esc(c.n)}</b><div class="sub">${esc(c.pay)}</div></td>
    <td class="right mono">${fmt(c.debt)} ₸</td>
    <td>${c.over?`<span class="badge r">${c.over} дн.</span>`:'<span class="badge g">в сроке</span>'}</td></tr>`).join('')}
   </tbody></table></div></div>
 </div>
 <div class="hint">Долг появляется сам, когда счёт выставлен и не оплачен, и уменьшается в момент поступления денег. Акт сверки по любому клиенту формируется за секунды — спор «мы же платили» закрывается документом.</div>`;

SC.docs=()=>`
 <div class="head"><div><h2>Документы</h2><p>Счета, накладные, КП, договоры и акты формируются из заказа. Печатные формы — под ваш бланк с логотипом и реквизитами.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:760px">
  <thead><tr><th>Документ</th><th>Тип</th><th>Клиент</th><th>Дата</th><th class="right">Сумма</th></tr></thead><tbody>
  ${DOCS.map(d=>`<tr onclick="toast('Документ открывается в печатной форме и отправляется клиенту одной кнопкой — в WhatsApp, на почту или ссылкой. Он же связан с заказом: искать в папках не нужно.')">
   <td><b>${esc(d.n)}</b></td><td><span class="badge b">${esc(d.t)}</span></td>
   <td>${esc(d.cl)}</td><td class="mono">${d.d}</td>
   <td class="right mono">${d.sum?fmt(d.sum)+' ₸':'—'}</td></tr>`).join('')}
 </tbody></table></div></div>`;

SC.c1=()=>`
 <div class="head"><div><h2>Обмен с 1С</h2><p>Вы сказали, что бухгалтерия ведётся в 1С. Систему с ней связываем: документы и оплаты уходят туда, справочники синхронизируются.</p></div></div>
 <div class="g11">
  <div class="panel"><b>Что уходит в 1С</b>
   <div class="kv"><span>Счета на оплату</span><b><span class="badge g">автоматически</span></b></div>
   <div class="kv"><span>Накладные на отгрузку</span><b><span class="badge g">автоматически</span></b></div>
   <div class="kv"><span>Акты выполненных работ</span><b><span class="badge g">автоматически</span></b></div>
   <div class="kv"><span>Поступления денег</span><b><span class="badge b">из выписки в систему</span></b></div>
   <div class="kv"><span>Справочник клиентов</span><b><span class="badge b">двусторонняя сверка</span></b></div>
  </div>
  <div class="panel"><b>Как это меняет работу бухгалтера</b>
   <p class="mini" style="margin-top:5px">Сейчас документы набираются дважды: менеджер делает счёт, бухгалтер заводит его же в 1С. При обмене документ создаётся один раз и уходит в 1С готовым — с номенклатурой, ценами и реквизитами.</p>
   <div class="note" style="--tone:var(--wheat)"><b>Считается отдельно от основного пакета</b><p>Стоимость зависит от версии и конфигурации вашей 1С. Обсудим, когда вы скажете, какая именно стоит и что должно уходить.</p></div>
  </div>
 </div>`;

SC.integr=()=>`
 <div class="head"><div><h2>Интеграции</h2><p>Всё, что должно попадать в систему само: сообщения клиентов, заказы из Kaspi, звонки и заявки с сайта.</p></div></div>
 <div class="g11">
  <div class="panel"><b>WhatsApp · 5 номеров менеджеров</b>
   ${MGRS.map(m=>`<div class="kv"><span>${esc(m.n)}</span><b class="mono">${esc(m.wa)}</b></div>`).join('')}
   <div class="note" style="--tone:var(--green)"><b>5 000 ₸ за номер вместо 36 000 ₸</b>
    <p>Через казахстанского поставщика. Пять номеров — 25 000 ₸ в месяц вместо 180 000 ₸. За год разница ${fmt((F.waCost-F.waNew)*F.waLines*12)} ₸.</p></div>
  </div>
  <div class="panel"><b>Остальные каналы</b>
   <div class="kv"><span>Kaspi Магазин</span><b><span class="badge g">заказы в воронку</span></b></div>
   <div class="kv"><span>Статус отправки в Kaspi</span><b><span class="badge g">проставляется из системы</span></b></div>
   <div class="kv"><span>Телефония с записью разговоров</span><b><span class="badge g">входит в пакет</span></b></div>
   <div class="kv"><span>Форма заявки с сайта</span><b><span class="badge g">входит в пакет</span></b></div>
   <div class="kv"><span>Интернет-магазин</span><b><span class="badge a">отдельная разработка</span></b></div>
   <div class="kv"><span>Обмен с 1С</span><b><span class="badge a">считается отдельно</span></b></div>
   <p class="mini" style="margin-top:7px">Заказ из Kaspi попадает в воронку с составом и суммой, менеджер видит его вместе с остальными. Отметил отгрузку — статус ушёл обратно в Kaspi.</p>
  </div>
 </div>
 <div class="hint">Личные номера менеджеров лучше перевести на компанию до подключения: тогда при увольнении номер, переписка и клиенты остаются у вас, а не уходят вместе с сотрудником.</div>`;

SC.analytics=()=>{const mx=Math.max(...CLIENTS.map(c=>c.rev));
 return `<div class="head"><div><h2>Аналитика</h2><p>Продажи по клиентам и менеджерам, маржа и загрузка цеха. Любой срез выгружается в Excel.</p></div></div>
 <div class="g11">
  <div class="panel"><b>Выручка по клиентам</b>
   ${CLIENTS.map(c=>`<div style="margin-top:9px"><div class="kv" style="border:0;padding:0 0 4px">
    <span>${esc(c.n)}</span><b>${fmt(c.rev)} ₸</b></div>
    <div class="bar" style="--w:${c.rev/mx*100}%"><i></i></div></div>`).join('')}
  </div>
  <div class="panel"><b>Ключевые показатели месяца</b>
   <div class="kv"><span>Заказов закрыто</span><b>${F.orders}</b></div>
   <div class="kv"><span>Средний чек</span><b>${fmt(F.avg)} ₸</b></div>
   <div class="kv"><span>Доля материалов в цене</span><b>${num(F.costMat/F.rev*100)}%</b></div>
   <div class="kv"><span>Доля работы цеха</span><b>${num(F.costWork/F.rev*100)}%</b></div>
   <div class="kv"><span>Валовая маржа</span><b style="color:var(--green)">${num(F.gross/F.rev*100)}%</b></div>
   <div class="kv"><span>Чистая рентабельность</span><b style="color:var(--green)">${num(F.profit/F.rev*100)}%</b></div>
   <div class="note" style="--tone:var(--acc)"><b>Сезонность видна по годам</b><p>Система копит историю с первого дня: через сезон вы увидите, когда начинается спрос на школьную форму и когда — на зимнюю спецодежду, и сможете закупать ткань заранее.</p></div>
  </div>
 </div>`};

SC.reports=()=>`
 <div class="head"><div><h2>Отчёты</h2><p>Любой срез с фильтрами по периоду, клиенту, менеджеру и изделию. Выгрузка в Excel одной кнопкой.</p></div></div>
 <div class="g3">
  ${[['Продажи по клиентам','Кто приносит деньги, а кто отнимает время'],
     ['Продажи по менеджерам','Выручка, заказы и бонусы по каждому'],
     ['Себестоимость и маржа','По изделиям и по заказам, с материалами и работой'],
     ['Движение материалов','Приход, списание в цех и остатки за период'],
     ['Задолженность клиентов','Долги по срокам: до 7, 8–30, свыше 30 дней'],
     ['Загрузка производства','Что в работе, сколько готово, где срываются сроки']].map(([n,d])=>
   `<div class="panel" style="cursor:pointer" onclick="toast('Отчёт «${esc(n)}» строится по текущим фильтрам и выгружается в Excel. Можно поставить на расписание — придёт на WhatsApp директору каждый понедельник.')">
    <b>${esc(n)}</b><p class="mini" style="margin-top:5px">${esc(d)}</p>
    <div class="btns" style="margin-top:9px"><button class="btn">Построить</button><button class="btn">В Excel</button></div></div>`).join('')}
 </div>`;

SC.users=()=>`
 <div class="head"><div><h2>Роли и доступы</h2><p>Вы просили, чтобы каждый видел только свой функционал. Настраивается в интерфейсе, без обращения к разработчику.</p></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:800px">
  <thead><tr><th>Роль</th><th>Что видит</th><th>Себестоимость и прибыль</th><th>Чужие клиенты</th></tr></thead><tbody>
  ${Object.entries(ROLES).map(([n,r])=>`<tr>
   <td><b>${esc(n)}</b><div class="sub">${esc(r.note)}</div></td>
   <td class="mini">${r.s.length} разделов</td>
   <td>${n==='Директор'?'<span class="badge g">полностью</span>':n==='Руководитель продаж'?'<span class="badge a">по своим заказам</span>':'<span class="badge r">нет</span>'}</td>
   <td>${n==='Менеджер по продажам'?'<span class="badge r">только свои</span>':'<span class="badge g">все</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint">Менеджер видит только своих клиентов и свою переписку — это защита базы. Директор видит всё, включая себестоимость и бонусы. Права меняются галочками, новую роль можно создать самим.</div>`;

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
 const opts=role==='Менеджер по продажам'?[['my','Мои клиенты · Динара']]
  :[['all','Вся компания'],['sale','Только продажи'],['prod','Только производство'],['wh','Только склады']];
 s.innerHTML=opts.map(o=>`<option value="${o[0]}" ${scope===o[0]?'selected':''}>${o[1]}</option>`).join('');
 if(role==='Менеджер по продажам')scope='my';else if(!opts.some(o=>o[0]===scope))scope='all'}
function setScope(v){scope=v;render();
 toast(v==='all'?'Показана <b>вся компания</b>: продажи, цех, склады и деньги.':'Данные отфильтрованы по выбранному срезу. Одна система — разные разрезы под разные задачи.')}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{
  const av=items.filter(i=>al.includes(i[0]));if(!av.length)return '';
  return `<div class="nav-g">${g}</div>`+av.map(i=>
   `<a class="${cur===i[0]?'on':''}" onclick="go('${i[0]}')"><i>${i[1]}</i>${i[2]}${i[3]?`<span class="b">${i[3]}</span>`:''}</a>`).join('')}).join('')}
const PREF={inbox:'Менеджер по продажам',funnel:'Менеджер по продажам',calc:'Менеджер по продажам',
 prod:'Мастер цеха',mat:'Кладовщик',moves:'Кладовщик',inv:'Кладовщик',import:'Кладовщик',goods:'Кладовщик',
 pay:'Бухгалтер',docs:'Бухгалтер',c1:'Бухгалтер',dash:'Директор',users:'Директор',integr:'Директор'};
const ownerOf=s=>(PREF[s]&&ROLES[PREF[s]].s.includes(s))?PREF[s]:(Object.entries(ROLES).find(([n,r])=>r.s.includes(s))||['Директор'])[0];
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
function sparks(){const c=['#5b3fa8','#7c5bd6','#c9761f','#2e9e5f','#ffffff','#b9a3ee'];
 for(let i=0;i<52;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2300)}}
function waPing(){toast('Пять номеров WhatsApp менеджеров, Kaspi Магазин, телефония с записью разговоров и форма с сайта — всё падает в одну ленту. Переписка остаётся в компании, а не в личном телефоне сотрудника.')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';try{localStorage.setItem('jb-theme',theme)}catch(e){}applyTheme()}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark');
 const b=document.getElementById('themeBtn');if(b)b.textContent=theme==='dark'?'☀ Светлая':'◐ Тёмная'}
(function(){try{const t=localStorage.getItem('jb-theme');if(t)theme=t}catch(e){}
 const q=new URLSearchParams(location.search).get('theme');if(q)theme=q;applyTheme()})();

/* ===== СЦЕНАРИЙ ПОКАЗА ===== */
const TOUR=[
 ['Менеджер по продажам','inbox','<b>Шаг 1.</b> Все обращения в одной ленте: пять номеров WhatsApp менеджеров, Kaspi Магазин, телефония и сайт. Переписка остаётся в компании, а не в личном телефоне.',7000],
 ['Менеджер по продажам','funnel','<b>Шаг 2.</b> Воронка заказов — то, что вы просили показать ещё раз. Видно, сколько заявок, кто обрабатывает и на каком этапе заказ. Карточка тянется мышью.',7200],
 ['Менеджер по продажам','calc','<b>Шаг 3.</b> Калькулятор внутри сделки: меняйте количество и скидку — сумма, себестоимость и маржа считаются на лету. Отсюда же формируется КП и счёт.',7400],
 ['Руководитель продаж','path','<b>Шаг 4.</b> Главный экран: путь одного заказа от сообщения в WhatsApp до денег и бонуса менеджера. Нажимайте «Следующий шаг» — это ответ на ваш вопрос про автоматику.',8000],
 ['Мастер цеха','prod','<b>Шаг 5.</b> Цех: заказ из воронки пришёл сюда сам. Раскрой, пошив, ВТО, упаковка — с процентом готовности. Статус сразу виден менеджеру.',7000],
 ['Кладовщик','mat','<b>Шаг 6.</b> Склад материалов: остатки, минимумы и списание в цех по норме на изделие. Четыре позиции ниже минимума — система уже поставила задачу на закуп.',7000],
 ['Кладовщик','inv','<b>Шаг 7.</b> Инвентаризация: расхождение 96 400 ₸ за месяц — больше миллиона в год. Причина почти всегда одна: взяли в цех и не оформили.',7200],
 ['Кладовщик','import','<b>Шаг 8.</b> Вы переживали, что товаров много. Тысяча позиций переносится из Excel за один вечер вместе с остатками и клиентами.',6800],
 ['Руководитель продаж','kpi','<b>Шаг 9.</b> Зарплата и бонусы: оклад плюс процент от закрытых заказов. Считается по факту отгрузки и оплаты — вы про это спрашивали.',7000],
 ['Директор','integr','<b>Шаг 10.</b> Интеграции: пять номеров WhatsApp по 5 000 ₸ вместо 36 000 ₸ — экономия 1 860 000 ₸ в год. Kaspi отдаёт заказы в воронку и принимает статус отгрузки.',7600],
 ['Директор','dash','<b>Шаг 11.</b> Обзор директора: выручка, себестоимость, прибыль, склад и долги. Всё собирается само из заказов, списаний и оплат.',7000],
 ['Руководитель продаж','path','<b>Итог.</b> Полтора миллиона один раз вместо миллиона каждый год за аренду чужой системы. Дальше проходим по каждому экрану вместе с вами и правим под то, как работает именно ваше производство.',7800]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();
  toast('<b>Это демо-макет по вашему рассказу.</b> На следующей встрече проходим по каждому экрану вместе с директором и правим под ваше производство — из этого получается техническое задание.');return}
 const [r,s,txt,ms]=TOUR[tourI++];
 if(role!==r)enter(r);
 setTimeout(()=>{go(s);toast(txt)},role!==r?380:0);
 tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');
 if(q&&SC[q]){enter(ownerOf(q));go(q)}})();
