/* САЛЬДО KZ — демо системы бухгалтерского аутсорсинга.
   Макет для Гульнары (ИП «САЛЬДО KZ», Акмолинская обл., с. Талапкер).
   Собран по образцу системы, сделанной для бухгалтерской компании PROFBUH. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const num2=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n);
const pct=(a,b)=>num(a/b*100)+'%';
const mln=n=>num(n/1000000)+' млн';
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};

const SEC=[
 {k:'dash', ic:'▦', n:'Пульт',      sub:[['dash','Общая картина'],['day','День бухгалтера']]},
 {k:'cli',  ic:'☺', n:'Клиенты',    sub:[['clients','Картотека клиентов'],['card','Карточка клиента'],['tariff','Расчёт стоимости']]},
 {k:'work', ic:'☑', n:'Работа',     sub:[['tasks','Доска задач'],['matrix','Матрица обязанностей'],['time','Учёт времени']]},
 {k:'rep',  ic:'◷', n:'Отчётность', sub:[['cal','Календарь отчётности'],['ready','Готовность к сдаче'],['risk','Риски и уведомления']]},
 {k:'doc',  ic:'▤', n:'Документы',  sub:[['docs','Приём первички'],['esf','ЭСФ, СНТ и банк'],['miss','Чего не хватает']]},
 {k:'com',  ic:'✆', n:'Связь',      sub:[['wa','WhatsApp и роботы'],['chat','Диалог с клиентом']]},
 {k:'sale', ic:'◎', n:'Продажи',    sub:[['funnel','Заявки и воронка'],['price','Прайс услуг']]},
 {k:'money',ic:'₸', n:'Деньги',     sub:[['bill','Начисления и счета'],['debt','Дебиторка'],['fin','Финансы компании']]},
 {k:'an',   ic:'▥', n:'Аналитика',  sub:[['profit','Прибыль по клиентам'],['load','Нагрузка бухгалтеров'],['kpi','KPI и премии']]},
 {k:'set',  ic:'⚙', n:'Настройки',  sub:[['roles','Права доступа'],['integr','Интеграции'],['migr','Перенос из таблиц'],['stack','Состав релиза']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));

const ROLES={
 'Руководитель':{av:'ГС',n:'Гульнара',r:'собственник и руководитель',note:'Вся компания: клиенты, сроки, деньги, нагрузка и рентабельность каждого клиента',
  s:['dash','day','clients','card','tariff','tasks','matrix','time','cal','ready','risk','docs','esf','miss','wa','chat','funnel','price','bill','debt','fin','profit','load','kpi','roles','integr','migr','stack']},
 'Главный бухгалтер':{av:'АЙ',n:'Айгуль',r:'ведёт сложных клиентов и проверяет отчёты',note:'Все клиенты и сроки, распределение нагрузки, проверка перед сдачей. Без финансов компании',
  s:['dash','day','clients','card','tasks','matrix','time','cal','ready','risk','docs','esf','miss','wa','chat','load','kpi','price']},
 'Бухгалтер':{av:'ДН',n:'Динара',r:'ведёт своих клиентов',note:'Свои клиенты, свои задачи и сроки, документы и переписка. Чужих клиентов не видит',
  s:['day','clients','card','tasks','time','cal','ready','docs','esf','miss','wa','chat']},
 'Помощник бухгалтера':{av:'МД',n:'Мадина',r:'первичка и напоминания',note:'Приём документов, разбор первички, напоминания клиентам. Отчёты не сдаёт',
  s:['day','docs','esf','miss','wa','chat','tasks','clients']},
 'Менеджер по продажам':{av:'АС',n:'Асем',r:'новые клиенты',note:'Заявки, воронка, расчёт стоимости обслуживания, договоры. Учёт не ведёт',
  s:['funnel','price','tariff','clients','chat','wa']},
 'Клиент (кабинет)':{av:'КЛ',n:'ТОО «Есиль Трейд»',r:'кабинет клиента',note:'Свой статус по отчётности, что нужно прислать, счета и переписка с бухгалтером',
  s:['card','miss','bill','chat']}
};
let role='Руководитель',cur='dash',theme='light';

/* ====== ДАННЫЕ ====== */
const F={
 clients:34, staff:5, rev:2860000, collected:83, tasks:41, urgent:6,
 waiting:9, risk:3, hoursMonth:684, normHours:760, avgCheck:84100,
 margin:38, newLeads:7
};

/* режимы налогообложения и базовые тарифы */
const MODE={
 upr:  {n:'Упрощёнка (910.00)',    c:'#1f7a5a', base:45000, h:6,  forms:['910.00','200.00']},
 upr0: {n:'Упрощёнка без сотрудников',c:'#4fc38f',base:25000,h:3,  forms:['910.00']},
 retail:{n:'Розничный налог (913.00)',c:'#cf8a22',base:55000, h:8,  forms:['913.00','200.00']},
 our:  {n:'ОУР без НДС (100.00)',  c:'#2f6f9e', base:95000, h:14, forms:['100.00','200.00']},
 nds:  {n:'ОУР + НДС (300.00)',    c:'#c33c32', base:150000,h:22, forms:['100.00','200.00','300.00']},
 ip:   {n:'ИП на ОУР (220.00)',    c:'#6b4ea8', base:70000, h:11, forms:['220.00','200.00']}
};

const CLIENTS=[
 {id:'K-004',n:'ТОО «Астана Строй Групп»',bin:'180540··2214',m:'nds',  emp:24,acc:'Айгуль',fee:180000,debt:0,      st:'ok',   docs:'полный',   note:'строительство, НДС ежеквартально, много актов'},
 {id:'K-009',n:'ТОО «Есиль Трейд»',       bin:'200340··8871',m:'nds',  emp:11,acc:'Айгуль',fee:150000,debt:150000, st:'wait', docs:'нет выписки',note:'оптовая торговля, ЭСФ и СНТ'},
 {id:'K-012',n:'ТОО «Талапкер Агро»',     bin:'150740··4402',m:'upr',  emp:8, acc:'Динара',fee:60000, debt:0,      st:'ok',   docs:'полный',   note:'КХ, сезонность, субсидии'},
 {id:'K-015',n:'ИП Нурланов (грузоперевозки)',bin:'840612··0345',m:'upr',emp:3,acc:'Динара',fee:45000,debt:45000,  st:'wait', docs:'нет путевых',note:'не присылает путевые листы вовремя'},
 {id:'K-018',n:'ИП Сейтказы (магазин)',   bin:'910408··1129',m:'retail',emp:4,acc:'Динара',fee:55000, debt:0,      st:'ok',   docs:'полный',   note:'розничный налог, Z-отчёты кассы'},
 {id:'K-021',n:'ТОО «Сарыарка Логистик»', bin:'190240··6690',m:'our',  emp:9, acc:'Асем',  fee:95000, debt:190000, st:'risk', docs:'частично', note:'долг 2 месяца, обсуждается график'},
 {id:'K-024',n:'ИП Ахметова (салон)',     bin:'880920··7712',m:'upr',  emp:5, acc:'Асем',  fee:45000, debt:0,      st:'ok',   docs:'полный',   note:'услуги, зарплата 5 мастеров'},
 {id:'K-027',n:'ТОО «Медтехника KZ»',     bin:'210640··3318',m:'nds',  emp:6, acc:'Айгуль',fee:150000,debt:0,      st:'ok',   docs:'полный',   note:'импорт, СНТ обязательны'},
 {id:'K-030',n:'ИП Кажымукан (услуги)',   bin:'950215··5540',m:'upr0', emp:0, acc:'Динара',fee:25000, debt:25000,  st:'wait', docs:'нет банка',note:'один человек, простой учёт'},
 {id:'K-033',n:'ТОО «Целиноград Пром»',   bin:'170840··9903',m:'our',  emp:14,acc:'Асем',  fee:95000, debt:0,      st:'risk', docs:'полный',   note:'пришло уведомление КГД по расхождению'}
];
const CMAP={};CLIENTS.forEach(c=>CMAP[c.id]=c);

const STAFF=[
 {n:'Айгуль',role:'главный бухгалтер',cli:9, hours:168,norm:168,fee:640000,salary:420000},
 {n:'Динара',role:'бухгалтер',        cli:12,hours:154,norm:168,fee:520000,salary:300000},
 {n:'Асем',  role:'бухгалтер',        cli:8, hours:176,norm:168,fee:480000,salary:300000},
 {n:'Мадина',role:'помощник',         cli:0, hours:186,norm:168,fee:0,     salary:180000},
 {n:'Гульнара',role:'руководитель',   cli:5, hours:0,  norm:0,  fee:220000,salary:0}
];

/* налоговый календарь: месяц (0–11), день, форма, кому, цвет */
const CALEV=[
 {m:0,d:15,f:'910.00',n:'Упрощёнка за 2-е полугодие',who:'упрощёнка · 14 клиентов',c:'#1f7a5a'},
 {m:0,d:25,f:'платежи',n:'ИПН, ОПВ, СО, ОСМС за декабрь',who:'все с сотрудниками',c:'#2f6f9e'},
 {m:1,d:15,f:'200.00',n:'ИПН и соцналог за 4 квартал',who:'все с сотрудниками · 21',c:'#2f6f9e'},
 {m:1,d:15,f:'300.00',n:'НДС за 4 квартал',who:'плательщики НДС · 6',c:'#c33c32'},
 {m:1,d:15,f:'913.00',n:'Розничный налог за 4 квартал',who:'розница · 4',c:'#cf8a22'},
 {m:2,d:31,f:'100.00',n:'КПН за год',who:'ТОО на ОУР · 9',c:'#6b4ea8'},
 {m:2,d:31,f:'220.00',n:'ИПН за год',who:'ИП на ОУР · 3',c:'#6b4ea8'},
 {m:3,d:15,f:'200.00',n:'ИПН и соцналог за 1 квартал',who:'все с сотрудниками',c:'#2f6f9e'},
 {m:3,d:15,f:'300.00',n:'НДС за 1 квартал',who:'плательщики НДС',c:'#c33c32'},
 {m:4,d:15,f:'701.01',n:'Налог на транспорт и имущество',who:'у кого есть объекты · 7',c:'#8b9dab'},
 {m:6,d:15,f:'200.00',n:'ИПН и соцналог за 2 квартал',who:'все с сотрудниками',c:'#2f6f9e'},
 {m:6,d:15,f:'300.00',n:'НДС за 2 квартал',who:'плательщики НДС',c:'#c33c32'},
 {m:7,d:15,f:'910.00',n:'Упрощёнка за 1-е полугодие',who:'упрощёнка · 14 клиентов',c:'#1f7a5a'},
 {m:9,d:15,f:'200.00',n:'ИПН и соцналог за 3 квартал',who:'все с сотрудниками',c:'#2f6f9e'},
 {m:9,d:15,f:'300.00',n:'НДС за 3 квартал',who:'плательщики НДС',c:'#c33c32'},
 {m:9,d:15,f:'913.00',n:'Розничный налог за 3 квартал',who:'розница',c:'#cf8a22'}
];
const MONTHS=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MON3=['ЯНВ','ФЕВ','МАР','АПР','МАЙ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'];

/* ближайшие дедлайны с готовностью */
const DEADLINES=[
 {d:25,mo:'СЕН',f:'Платежи по зарплате за август',who:'ИПН, ОПВ, СО, ОСМС · 21 клиент',done:17,total:21,c:'#2f6f9e'},
 {d:15,mo:'ОКТ',f:'200.00 за 3 квартал',who:'ИПН и соцналог · 21 клиент',done:4,total:21,c:'#2f6f9e'},
 {d:15,mo:'ОКТ',f:'300.00 за 3 квартал',who:'НДС · 6 клиентов',done:1,total:6,c:'#c33c32'},
 {d:15,mo:'ОКТ',f:'913.00 за 3 квартал',who:'розничный налог · 4 клиента',done:0,total:4,c:'#cf8a22'},
 {d:15,mo:'ФЕВ',f:'910.00 за 2-е полугодие',who:'упрощёнка · 14 клиентов',done:0,total:14,c:'#1f7a5a'}
];

/* задачи */
let TASKS=[
 {id:'T-511',n:'Закрыть сентябрь по ТОО «Есиль Трейд»',cl:'K-009',acc:'Айгуль',due:'до 10.10',s:'work',p:'высокий'},
 {id:'T-512',n:'Сверка ЭСФ за 3 квартал · Медтехника KZ',cl:'K-027',acc:'Айгуль',due:'до 08.10',s:'work',p:'высокий'},
 {id:'T-514',n:'Путевые листы за сентябрь · ИП Нурланов',cl:'K-015',acc:'Динара',due:'просрочено 2 дня',s:'wait',p:'высокий'},
 {id:'T-515',n:'Начислить зарплату · Талапкер Агро',cl:'K-012',acc:'Динара',due:'до 05.10',s:'new',p:'обычный'},
 {id:'T-517',n:'Ответить на уведомление КГД · Целиноград Пром',cl:'K-033',acc:'Асем',due:'до 03.10',s:'work',p:'срочно'},
 {id:'T-519',n:'Z-отчёты кассы за сентябрь · ИП Сейтказы',cl:'K-018',acc:'Динара',due:'до 04.10',s:'wait',p:'обычный'},
 {id:'T-520',n:'Акты сверки с поставщиками · Астана Строй',cl:'K-004',acc:'Айгуль',due:'до 12.10',s:'new',p:'обычный'},
 {id:'T-522',n:'Выставить счета на абонплату за октябрь',cl:'',acc:'Мадина',due:'до 01.10',s:'new',p:'обычный'},
 {id:'T-523',n:'Договор на 2027 год · Сарыарка Логистик',cl:'K-021',acc:'Гульнара',due:'до 15.10',s:'new',p:'обычный'},
 {id:'T-525',n:'Проверить 300.00 перед сдачей · Астана Строй',cl:'K-004',acc:'Айгуль',due:'до 13.10',s:'check',p:'высокий'},
 {id:'T-527',n:'Восстановить учёт за июль · Кажымукан',cl:'K-030',acc:'Динара',due:'до 20.10',s:'work',p:'обычный'},
 {id:'T-530',n:'Сдано: 910.00 за 1 полугодие · 14 клиентов',cl:'',acc:'Айгуль',due:'сдано 14.08',s:'done',p:'обычный'}
];
const TCOL=[['new','Новые','#6b4ea8'],['work','В работе','#2f6f9e'],['wait','Ждём документы','#cf8a22'],['check','На проверке','#1f7a5a'],['done','Сдано','#16232e']];

/* документы, которых не хватает */
const MISS=[
 {cl:'K-009',n:'ТОО «Есиль Трейд»',doc:'Банковская выписка за сентябрь',days:4,ch:'WhatsApp',st:'напомнили 2 раза'},
 {cl:'K-015',n:'ИП Нурланов',doc:'Путевые листы за сентябрь',days:6,ch:'WhatsApp',st:'напомнили 3 раза'},
 {cl:'K-030',n:'ИП Кажымукан',doc:'Выписка Kaspi Business',days:3,ch:'WhatsApp',st:'напомнили 1 раз'},
 {cl:'K-021',n:'ТОО «Сарыарка Логистик»',doc:'Акты выполненных работ, 4 шт',days:8,ch:'звонок',st:'обещали до пятницы'},
 {cl:'K-018',n:'ИП Сейтказы',doc:'Z-отчёты кассы за 3 недели',days:2,ch:'WhatsApp',st:'напомнили 1 раз'},
 {cl:'K-004',n:'ТОО «Астана Строй Групп»',doc:'Счета-фактуры от 3 поставщиков',days:5,ch:'WhatsApp',st:'ждём ответ'}
];

/* воронка заявок */
const FUN=[['new','Новая заявка','#6b4ea8'],['call','Созвон и анкета','#2f6f9e'],['calc','Расчёт стоимости','#cf8a22'],['dog','Договор','#1f7a5a'],['start','Принят на обслуживание','#16232e']];
let LEADS=[
 {id:'L-88',n:'ТОО «Нур Курылыс»',m:'nds',emp:12,s:'calc',src:'рекомендация',fee:150000,d:'расчёт отправлен',hot:1},
 {id:'L-86',n:'ИП Сагындыков',    m:'upr',emp:2, s:'call',src:'2ГИС',        fee:45000, d:'созвон завтра',hot:0},
 {id:'L-84',n:'ТОО «Ак Жол Трейд»',m:'our',emp:7, s:'dog',src:'рекомендация',fee:95000, d:'договор на подписи',hot:1},
 {id:'L-82',n:'ИП Мусаева (кафе)', m:'retail',emp:6,s:'new',src:'Instagram',  fee:55000, d:'вчера',hot:0},
 {id:'L-79',n:'ТОО «Степной Ветер»',m:'upr',emp:4,s:'start',src:'рекомендация',fee:60000,d:'с 01.10',hot:0},
 {id:'L-77',n:'ИП Абенов',        m:'upr0',emp:0,s:'new',src:'сайт',         fee:25000, d:'сегодня',hot:0}
];

/* шаблоны сообщений */
const TPL=[
 {n:'Просьба прислать документы',t:'Здравствуйте, {клиент}! Для закрытия {месяц} не хватает: {список}. Пришлите, пожалуйста, до {дата} — иначе не успеем подготовить отчёт вовремя.',use:214},
 {n:'Напоминание о сроке сдачи',t:'{клиент}, напоминаем: {форма} нужно сдать до {дата}. У нас всё готово, отчёт отправим сами — от вас ничего не требуется.',use:186},
 {n:'Отчёт сдан',t:'{клиент}, отчёт {форма} за {период} сдан {дата}. Квитанция о приёме во вложении. Сумма к уплате: {сумма} ₸, срок — до {срок}.',use:158},
 {n:'Счёт на абонплату',t:'{клиент}, направляем счёт на абонентское обслуживание за {месяц} — {сумма} ₸. Оплатить можно по ссылке или по реквизитам в счёте.',use:142},
 {n:'Напоминание об оплате',t:'{клиент}, по нашему учёту не оплачено обслуживание за {месяц} — {сумма} ₸. Подскажите, когда планируете оплату?',use:96},
 {n:'Уведомление из КГД',t:'{клиент}, к вам пришло уведомление из налоговой по {причина}. Срок ответа — {дата}. Мы готовим ответ, от вас нужно: {список}.',use:31}
];

/* риски */
const RISKS=[
 {cl:'ТОО «Целиноград Пром»',t:'Уведомление КГД о расхождении по НДС',due:'ответ до 03.10',lvl:'high',n:'расхождение по ЭСФ с поставщиком на 2,4 млн ₸'},
 {cl:'ТОО «Сарыарка Логистик»',t:'Долг за обслуживание 2 месяца',due:'решение до 05.10',lvl:'high',n:'190 000 ₸ · обсуждается график погашения'},
 {cl:'ИП Нурланов',t:'Нет путевых листов — расходы не подтверждены',due:'до 10.10',lvl:'mid',n:'риск снятия расходов при проверке'},
 {cl:'ТОО «Есиль Трейд»',t:'Приближается порог по НДС у клиента на упрощёнке',due:'следить',lvl:'mid',n:'оборот 78% от порога — нужно предупредить заранее'},
 {cl:'ИП Сейтказы',t:'Касса не снималась 3 недели',due:'до 04.10',lvl:'low',n:'нужны Z-отчёты для 913.00'}
];

const SC={};
/* ====== ПУЛЬТ ====== */
const seeMoney=()=>['Руководитель'].indexOf(role)>=0;
const seeAll=()=>['Руководитель','Главный бухгалтер'].indexOf(role)>=0;

SC.dash=()=>`<div class="hd"><div><h2>Общая картина · сентябрь 2026</h2>
 <p>Один экран вместо таблицы клиентов, блокнота со сроками и чатов с бухгалтерами. Всё, что здесь видно, собирается само: из задач, календаря отчётности, документов от клиентов и оплат.</p></div>
 <div class="btns"><button class="bt" onclick="go('day')">День бухгалтера</button><button class="bt p" onclick="go('cal')">Календарь отчётности</button></div></div>
<div class="wid">
 <div><small>Клиентов на обслуживании</small><b class="a">${F.clients}</b><span>упрощёнка 14 · ОУР 12 · розница 4 · НДС 6</span></div>
 <div><small>Задач в работе</small><b>${F.tasks}</b><span>${F.urgent} срочных на этой неделе</span></div>
 <div><small>Ждём документы</small><b class="w">${F.waiting}</b><span>напоминания уходят в WhatsApp сами</span></div>
 <div><small>Требуют внимания</small><b class="r">${F.risk}</b><span>уведомление КГД · долг · просрочка</span></div>
 ${seeMoney()?`<div><small>Абонплата за месяц</small><b class="g">${fmt(F.rev)} ₸</b><span>собрано ${F.collected}%</span></div>`
 :`<div><small>Ваша нагрузка</small><b class="i">154 ч</b><span>из нормы 168 часов</span></div>`}
</div>
<div class="g21">
 <div class="pan"><h3>Ближайшие сроки сдачи</h3>
  <p>Система считает готовность по каждому клиенту: сколько отчётов уже подготовлено из общего числа. Красный — значит, до срока не успеваем текущим темпом.</p>
  ${DEADLINES.map(d=>`<div class="dl" style="--c:${d.c}">
   <div class="dt"><b>${d.d}</b><small>${d.mo}</small></div>
   <div class="dn"><b>${esc(d.f)}</b><span class="sub">${esc(d.who)}</span></div>
   <div class="prg"><div class="bar"><i class="${d.done/d.total>.6?'g':d.done/d.total>.25?'w':'r'}" style="--w:${Math.round(d.done/d.total*100)}%"></i></div>
    <span>${d.done} из ${d.total}</span></div></div>`).join('')}
  <div class="said"><b>Главная боль аутсорсинга</b><i>Пропущенный срок стоит дороже, чем месяц обслуживания клиента.</i> Поэтому календарь здесь не «напоминалка», а источник задач: из каждого дедлайна создаются задачи всем подходящим клиентам, и видно, кто из них ещё не готов.</div>
 </div>
 <div>
  <div class="pan"><h3>Клиенты, требующие внимания</h3>
   ${CLIENTS.filter(c=>c.st!=='ok').slice(0,5).map(c=>`<div class="li ${c.st==='risk'?'r':'w'}"><i>!</i><span><b>${esc(c.n)}</b><span class="sub">${esc(c.note)}</span></span></div>`).join('')}
   <button class="bt" style="margin-top:9px;width:100%" onclick="go('clients')">Вся картотека</button>
  </div>
  <div class="pan"><h3>Что сегодня сделает система сама</h3>
   <div class="li"><i>✓</i><span><b>Напомнит 6 клиентам про документы</b><span class="sub">WhatsApp, по списку недостающего — без участия бухгалтера</span></span></div>
   <div class="li"><i>✓</i><span><b>Поставит задачи по дедлайну 15.10</b><span class="sub">200.00 и 300.00 — всем, кому сдавать</span></span></div>
   <div class="li"><i>✓</i><span><b>Выставит счета на абонплату</b><span class="sub">34 счёта по тарифам из карточек клиентов</span></span></div>
   <div class="li w"><i>!</i><span><b>Попросит решения по двум клиентам</b><span class="sub">долг больше двух месяцев — приостанавливать обслуживание или нет</span></span></div>
  </div>
 </div>
</div>
${seeMoney()?`<div class="g3">
 <div class="pan"><h3>Деньги за месяц</h3>
  <div class="kv"><span>Начислено абонплаты</span><b>${fmt(F.rev)} ₸</b></div>
  <div class="kv"><span>Оплачено</span><b>2 374 000 ₸</b></div>
  <div class="kv"><span>Разовые услуги</span><b>385 000 ₸</b></div>
  <div class="kv"><span>Фонд оплаты труда</span><b>1 200 000 ₸</b></div>
  <div class="kv"><span>Прибыль</span><b style="color:var(--ok)">1 086 000 ₸</b></div>
 </div>
 <div class="pan"><h3>Портфель клиентов</h3>
  <div class="yld">
   <div style="flex:41;background:#1f7a5a">41%<small>упрощёнка</small></div>
   <div style="flex:35;background:#2f6f9e">35%<small>ОУР</small></div>
   <div style="flex:12;background:#cf8a22">12%<small>розница</small></div>
   <div style="flex:12;background:#c33c32">12%<small>НДС</small></div>
  </div>
  <div class="kv"><span>Средний чек</span><b>${fmt(F.avgCheck)} ₸</b></div>
  <div class="kv"><span>Клиентов на одного бухгалтера</span><b>9,7</b></div>
  <div class="kv"><span>Новых за месяц</span><b>3</b></div>
  <div class="kv"><span>Ушло за месяц</span><b>1</b></div>
 </div>
 <div class="pan"><h3>Что заменяет система</h3>
  <div class="li"><i>✓</i><span><b>Таблицу клиентов в Excel</b><span class="sub">режимы, сроки, тарифы, ответственные — в одной картотеке</span></span></div>
  <div class="li"><i>✓</i><span><b>Блокнот со сроками</b><span class="sub">налоговый календарь сам ставит задачи</span></span></div>
  <div class="li"><i>✓</i><span><b>Переписку в личных WhatsApp</b><span class="sub">история остаётся компании, а не уходит с бухгалтером</span></span></div>
  <div class="li"><i>✓</i><span><b>Ручной счёт абонплаты</b><span class="sub">начисления и счета формируются пакетом</span></span></div>
  <div class="li n"><i>+</i><span><b>Появляется сверху</b><span class="sub">рентабельность клиента, нагрузка бухгалтеров, риски</span></span></div>
 </div>
</div>`:''}`;

SC.day=()=>`<div class="hd"><div><h2>День бухгалтера: что система делает за вас</h2>
 <p>Утром — короткий список на день, вечером — что осталось. Не нужно помнить, кому звонить и что просить: система показывает это сама, в одном месте.</p></div></div>
<div class="g2">
 <div class="pan"><h3>09:00 · Начало дня</h3>
  <div class="tl">
   <div class="tli ok"><span class="who">автоматически</span><b>Собран список на сегодня</b><p>7 задач: 2 срочные (уведомление КГД и просроченные путевые листы), 3 по закрытию месяца, 2 по документам.</p></div>
   <div class="tli ok"><span class="who">робот</span><b>Отправлены напоминания о документах</b><p>6 клиентам в WhatsApp — с конкретным списком, чего не хватает. Ответы падают в диалоги.</p></div>
   <div class="tli ok"><span class="who">календарь</span><b>Проверены сроки</b><p>До 15 октября — 200.00 и 300.00. Готово 5 из 27 отчётов, темп ниже нужного — подсвечено красным.</p></div>
   <div class="tli on"><span class="who">вы</span><b>Разобрать входящие документы</b><p>14 файлов пришло за ночь: банковские выписки, накладные, фото чеков. Система разложила их по клиентам.</p></div>
  </div>
 </div>
 <div class="pan"><h3>18:00 · Конец дня</h3>
  <div class="tl">
   <div class="tli ok"><span class="who">задачи</span><b>Закрыто 5 из 7</b><p>Две перенесены: ждём документы от клиентов, обе с напоминанием на завтра.</p></div>
   <div class="tli ok"><span class="who">время</span><b>Учтено 7,5 часа</b><p>По клиентам: Есиль Трейд 2,5 ч, Астана Строй 2 ч, остальное — текучка. Отсюда считается рентабельность клиента.</p></div>
   <div class="tli bad"><span class="who">требует решения</span><b>ИП Нурланов: путевые листы просрочены на 2 дня</b><p>Третье напоминание отправлено. Дальше — звонок руководителя и вопрос о переносе срока закрытия.</p></div>
   <div class="tli"><span class="who">завтра в 09:00</span><b>Сводка руководителю</b><p>Готовность по срокам, ждём документы, долги, нагрузка. Одно сообщение в WhatsApp.</p></div>
  </div>
  <div class="hint"><b>Смысл в том,</b> что бухгалтер перестаёт держать в голове десяток клиентов и три календаря. Система помнит за него, а он делает работу.</div>
 </div>
</div>
<div class="pan"><h3>Задачи на сегодня</h3>
 ${TASKS.filter(t=>t.s!=='done').slice(0,5).map((t,i)=>`<div class="li ${t.p==='срочно'?'r':t.p==='высокий'?'w':'n'}"><i>${i+1}</i><span><b>${esc(t.n)}</b><span class="sub">${t.cl?esc((CMAP[t.cl]||{}).n||''):'без клиента'} · ${esc(t.acc)} · ${esc(t.due)}</span></span></div>`).join('')}
 <button class="bt" style="margin-top:9px" onclick="go('tasks')">Вся доска задач</button>
</div>`;

/* ====== КЛИЕНТЫ ====== */
SC.clients=()=>{
 const my=role==='Бухгалтер'?CLIENTS.filter(c=>c.acc==='Динара'):CLIENTS;
 return `<div class="hd"><div><h2>Картотека клиентов${role==='Бухгалтер'?' · мои':''}</h2>
  <p>Главная таблица компании. Режим налогообложения определяет, какие формы сдавать и какие задачи создавать; тариф — сколько начислять; ответственный — кто ведёт. Всё остальное строится отсюда.</p></div>
  <div class="btns"><button class="bt" onclick="go('tariff')">Расчёт стоимости</button><button class="bt p" onclick="go('card')">Карточка клиента</button></div></div>
 <div class="wid">
  <div><small>Клиентов</small><b>${F.clients}</b><span>${role==='Бухгалтер'?'у вас '+my.length:'на обслуживании'}</span></div>
  <div><small>С сотрудниками</small><b>21</b><span>значит, 200.00 и платежи ежемесячно</span></div>
  <div><small>Плательщиков НДС</small><b class="r">6</b><span>300.00 ежеквартально</span></div>
  <div><small>Ждут документы</small><b class="w">${CLIENTS.filter(c=>c.st==='wait').length}</b><span>по ним закрытие месяца стоит</span></div>
  <div><small>В зоне риска</small><b class="r">${CLIENTS.filter(c=>c.st==='risk').length}</b><span>долг или уведомление КГД</span></div>
 </div>
 <div class="tw"><table class="t">
  <thead><tr><th>Клиент</th><th>БИН / ИИН</th><th>Режим</th><th class="r">Сотр.</th><th>Бухгалтер</th>${seeMoney()?'<th class="r">Абонплата</th><th class="r">Долг</th>':''}<th>Документы</th><th>Состояние</th></tr></thead>
  <tbody>${my.map(c=>`<tr onclick="openClient('${c.id}')">
   <td><span class="av ${c.m==='nds'?'w':c.m==='our'?'a':''}">${esc(c.n.replace(/[^А-ЯA-Zа-яa-z]/g,'').slice(0,2).toUpperCase())}</span> <b>${esc(c.n)}</b><span class="sub">${esc(c.note)}</span></td>
   <td class="mono">${esc(c.bin)}</td>
   <td><span class="tag" style="background:${MODE[c.m].c}18;color:${MODE[c.m].c}">${esc(MODE[c.m].n.split(' (')[0])}</span></td>
   <td class="r">${c.emp||'—'}</td><td>${esc(c.acc)}</td>
   ${seeMoney()?`<td class="r">${fmt(c.fee)} ₸</td><td class="r">${c.debt?'<b style="color:var(--bad)">'+fmt(c.debt)+'</b>':'—'}</td>`:''}
   <td>${c.docs==='полный'?'<span class="tag g">всё есть</span>':'<span class="tag w">'+esc(c.docs)+'</span>'}</td>
   <td>${c.st==='ok'?'<span class="tag g">в порядке</span>':c.st==='wait'?'<span class="tag w">ждём документы</span>':'<span class="tag r">риск</span>'}</td></tr>`).join('')}
  </tbody></table></div>
 <div class="g3" style="margin-top:12px">
  <div class="pan"><h3>Что хранится в карточке</h3>
   <div class="li"><i>✓</i><span><b>Юридическое</b><span class="sub">БИН, режим, коды ОКЭД, ЭЦП-ключи и сроки их действия, доступы в кабинет налогоплательщика</span></span></div>
   <div class="li"><i>✓</i><span><b>Учётное</b><span class="sub">какие формы сдаём, периодичность, сотрудники, объекты налогообложения, особенности</span></span></div>
   <div class="li"><i>✓</i><span><b>Коммерческое</b><span class="sub">тариф, что входит, что сверх тарифа, договор и срок, история изменения цены</span></span></div>
   <div class="li"><i>✓</i><span><b>История</b><span class="sub">все сданные отчёты с квитанциями, вся переписка, все документы по месяцам</span></span></div>
  </div>
  <div class="pan"><h3>Почему режим — ключевое поле</h3>
   <p>От него зависит всё: список форм, сроки, трудоёмкость и цена. Поэтому режим в системе — не текст, а настройка, из которой автоматически появляются задачи и календарь.</p>
   ${Object.entries(MODE).map(([k,m])=>`<div class="kv"><span>${esc(m.n)}</span><b>${m.forms.join(', ')}</b></div>`).join('')}
  </div>
  <div class="pan"><h3>Смена режима у клиента</h3>
   <div class="li w"><i>!</i><span><b>Превышение порога по НДС</b><span class="sub">система следит за оборотом и предупреждает заранее, а не по факту нарушения</span></span></div>
   <div class="li n"><i>·</i><span><b>Переход с упрощёнки на ОУР</b><span class="sub">меняются формы, задачи и тариф — всё пересобирается автоматически</span></span></div>
   <div class="li"><i>·</i><span><b>Появились сотрудники</b><span class="sub">добавляются 200.00 и ежемесячные платежи, тариф пересчитывается</span></span></div>
   <div class="note"><b>Это частая причина штрафов</b><p>Клиент «вырос», а обслуживание идёт по старой схеме. В таблице Excel это заметно не сразу — в системе видно в момент.</p></div>
  </div>
 </div>`};

SC.card=()=>{const c=CMAP['K-009'];
 return `<div class="hd"><div><h2>Карточка клиента · ${esc(c.n)}</h2>
  <p>Всё об одном клиенте на одном экране: режим и формы, сроки, документы, задачи, деньги и переписка. Бухгалтеру не нужно искать по папкам и чатам.</p></div>
  <div class="btns"><button class="bt" onclick="go('chat')">Написать</button><button class="bt" onclick="go('ready')">Готовность к сдаче</button><button class="bt p" onclick="openInvoice()">Выставить счёт</button></div></div>
 <div class="wid">
  <div><small>Режим</small><b class="r" style="font-size:15px">ОУР + НДС</b><span>100.00 · 200.00 · 300.00</span></div>
  <div><small>Сотрудников</small><b>${c.emp}</b><span>зарплата и платежи ежемесячно</span></div>
  <div><small>Абонплата</small><b class="a">${fmt(c.fee)} ₸</b><span>по договору от 01.2026</span></div>
  <div><small>Задолженность</small><b class="w">${fmt(c.debt)} ₸</b><span>счёт за сентябрь</span></div>
  <div><small>Ответственный</small><b style="font-size:15px">${esc(c.acc)}</b><span>главный бухгалтер</span></div>
 </div>
 <div class="g21">
  <div class="pan"><h3>Отчётность клиента</h3>
   <div class="tw"><table class="t">
    <thead><tr><th>Форма</th><th>Период</th><th>Срок</th><th>Статус</th><th>Квитанция</th></tr></thead>
    <tbody>
     <tr><td><b>300.00</b> · НДС</td><td>3 квартал 2026</td><td>15.10.2026</td><td><span class="tag w">готовим</span></td><td>—</td></tr>
     <tr><td><b>200.00</b> · ИПН и соцналог</td><td>3 квартал 2026</td><td>15.10.2026</td><td><span class="tag w">готовим</span></td><td>—</td></tr>
     <tr><td><b>300.00</b> · НДС</td><td>2 квартал 2026</td><td>15.07.2026</td><td><span class="tag g">сдано 14.07</span></td><td>№ 4418290</td></tr>
     <tr><td><b>200.00</b> · ИПН и соцналог</td><td>2 квартал 2026</td><td>15.07.2026</td><td><span class="tag g">сдано 14.07</span></td><td>№ 4418291</td></tr>
     <tr><td><b>100.00</b> · КПН</td><td>2025 год</td><td>31.03.2026</td><td><span class="tag g">сдано 27.03</span></td><td>№ 3910044</td></tr>
    </tbody></table></div>
   <div class="note" style="--tone:var(--warn)"><b>Закрытие сентября стоит</b>
    <p>Нет банковской выписки за сентябрь — просили дважды. Пока её нет, НДС за квартал посчитать нельзя. Робот напомнит ещё раз завтра, послезавтра задача уйдёт руководителю.</p></div>
  </div>
  <div>
   <div class="pan"><h3>Документы и доступы</h3>
    <div class="kv"><span>ЭЦП руководителя</span><b>действует до 14.02.2027</b></div>
    <div class="kv"><span>ЭЦП организации</span><b style="color:var(--warn)">истекает через 38 дней</b></div>
    <div class="kv"><span>Кабинет налогоплательщика</span><b>доступ есть</b></div>
    <div class="kv"><span>ИС ЭСФ</span><b>доступ есть</b></div>
    <div class="kv"><span>Договор</span><b>от 09.01.2026, бессрочный</b></div>
    <div class="note"><b>Про ЭЦП</b><p>Система следит за сроком действия ключей: когда до окончания меньше 45 дней — задача клиенту и бухгалтеру. Просроченный ключ в день сдачи — это сорванный срок.</p></div>
   </div>
   <div class="pan"><h3>Деньги клиента</h3>
    <div class="kv"><span>Начислено с начала года</span><b>1 350 000 ₸</b></div>
    <div class="kv"><span>Оплачено</span><b>1 200 000 ₸</b></div>
    <div class="kv"><span>Задолженность</span><b style="color:var(--bad)">150 000 ₸</b></div>
    <div class="kv"><span>Сверх тарифа за год</span><b>85 000 ₸</b></div>
    <div class="kv"><span>Средний срок оплаты</span><b>9 дней</b></div>
   </div>
  </div>
 </div>`};
/* ====== РАСЧЁТ СТОИМОСТИ ОБСЛУЖИВАНИЯ ====== */
const TAR={mode:'nds',emp:11,docs:120,esf:1,ved:0,cash:0,hourCost:2800};
function tarCalc(){
 const m=MODE[TAR.mode];
 const emp=TAR.emp*3000;
 const over=Math.max(0,TAR.docs-50)*250;
 const esf=TAR.esf?15000:0, ved=TAR.ved?25000:0, cash=TAR.cash?10000:0;
 const price=m.base+emp+over+esf+ved+cash;
 const hours=m.h+TAR.emp*0.4+TAR.docs/25+(TAR.esf?3:0)+(TAR.ved?4:0)+(TAR.cash?2:0);
 const cost=hours*TAR.hourCost;
 const marg=price?Math.round((price-cost)/price*100):0;
 return {m,price,hours,cost,marg,emp,over,esf,ved,cash};
}
SC.tariff=()=>{const r=tarCalc();
 return `<div class="hd"><div><h2>Расчёт стоимости обслуживания</h2>
  <p>Цена в аутсорсинге обычно называется «по ощущению»: похожий клиент — похожая цена. Здесь она считается от того, что реально определяет трудозатраты: режим, число сотрудников, объём документов и особенности вроде ЭСФ и импорта.</p></div>
  <div class="btns"><button class="bt" onclick="sendCalc()">Отправить расчёт клиенту</button><button class="bt p" onclick="go('price')">Прайс услуг</button></div></div>
 <div class="calc">
  <div class="pan"><h3>Параметры клиента</h3>
   <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:13px">
    ${Object.entries(MODE).map(([k,m])=>`<button class="ptab ${k===TAR.mode?'on':''}" onclick="tarSet('mode','${k}')">${esc(m.n.split(' (')[0])}</button>`).join('')}
   </div>
   <div class="crow"><label>Сотрудников у клиента <b>${TAR.emp}</b></label>
    <input type="range" min="0" max="40" step="1" value="${TAR.emp}" oninput="tarSet('emp',this.value)"></div>
   <div class="crow"><label>Документов в месяц (накладные, счета, банк) <b>${TAR.docs}</b></label>
    <input type="range" min="10" max="500" step="10" value="${TAR.docs}" oninput="tarSet('docs',this.value)"></div>
   <div class="srow"><span class="nm">ЭСФ и СНТ<span class="sub">выписка счетов-фактур и сопроводительных накладных</span></span>
    <div class="sw ${TAR.esf?'on':''}" onclick="tarTog('esf')"></div></div>
   <div class="srow"><span class="nm">ВЭД, импорт<span class="sub">заявления о ввозе, НДС на импорт, валютный контроль</span></span>
    <div class="sw ${TAR.ved?'on':''}" onclick="tarTog('ved')"></div></div>
   <div class="srow"><span class="nm">Касса и Z-отчёты<span class="sub">розница, ежедневные отчёты кассы</span></span>
    <div class="sw ${TAR.cash?'on':''}" onclick="tarTog('cash')"></div></div>
   <div class="said"><b>Зачем это нужно</b><i>Самая частая ошибка аутсорсинга — взять сложного клиента по цене простого.</i> Через полгода выясняется, что он съедает половину времени бухгалтера, а платит как ИП без сотрудников. Здесь это видно до подписания договора.</div>
  </div>
  <div>
   <div class="res">
    <div class="rr"><span>Базовый тариф · ${esc(r.m.n)}</span><b>${fmt(r.m.base)} ₸</b></div>
    <div class="rr"><span>Сотрудники · ${TAR.emp} × 3 000 ₸</span><b>${fmt(r.emp)} ₸</b></div>
    <div class="rr"><span>Документы сверх 50 в месяц</span><b>${fmt(r.over)} ₸</b></div>
    ${r.esf?`<div class="rr"><span>ЭСФ и СНТ</span><b>${fmt(r.esf)} ₸</b></div>`:''}
    ${r.ved?`<div class="rr"><span>ВЭД и импорт</span><b>${fmt(r.ved)} ₸</b></div>`:''}
    ${r.cash?`<div class="rr"><span>Касса и Z-отчёты</span><b>${fmt(r.cash)} ₸</b></div>`:''}
    <div class="rr hi"><span>Абонплата в месяц</span><b>${fmt(r.price)} ₸</b></div>
    <div class="rr"><span>Оценка трудозатрат</span><b>${num(r.hours)} ч/мес</b></div>
    ${seeAll()?`<div class="rr"><span>Себестоимость (по ${fmt(TAR.hourCost)} ₸/час)</span><b>${fmt(r.cost)} ₸</b></div>
     <div class="rr hi"><span>Рентабельность</span><b style="color:${r.marg<25?'var(--bad)':r.marg<40?'var(--warn)':'var(--ok)'}">${r.marg}%</b></div>`:
     '<div class="rr"><span>Себестоимость и рентабельность</span><b class="mini">скрыты для вашей роли</b></div>'}
   </div>
   ${seeAll()&&r.marg<25?`<div class="note" style="--tone:var(--bad)"><b>Такого клиента брать нельзя</b>
    <p>При этих параметрах обслуживание почти не окупается. Варианты: поднять цену, ограничить объём документов в договоре или вынести часть работ в разовые услуги.</p></div>`:''}
   <div class="pan" style="margin-top:12px"><h3>Что входит в абонплату, а что сверх</h3>
    <div class="li"><i>✓</i><span><b>Входит</b><span class="sub">ведение учёта, сдача форм по режиму, зарплата и платежи, консультации по текущим вопросам, ответы на стандартные уведомления</span></span></div>
    <div class="li w"><i>·</i><span><b>Сверх тарифа</b><span class="sub">восстановление учёта за прошлые периоды, налоговые проверки, регистрация и ликвидация, кадровое делопроизводство, свыше оговорённого объёма документов</span></span></div>
    <div class="hint">Когда границы тарифа записаны в системе и в договоре, спор «это же входит» решается за минуту, а не портит отношения с клиентом.</div>
   </div>
  </div>
 </div>`};

/* ====== ДОСКА ЗАДАЧ ====== */
SC.tasks=()=>{
 const my=role==='Бухгалтер'?TASKS.filter(t=>t.acc==='Динара'):TASKS;
 return `<div class="hd"><div><h2>Доска задач</h2>
  <p>Задачи появляются сами: из календаря отчётности, из недостающих документов, из уведомлений налоговой. Руками создают только то, что не укладывается в правила. Карточки перетаскиваются мышкой.</p></div>
  <div class="btns"><button class="bt" onclick="addTask()">+ Задача</button><button class="bt p" onclick="makeTasks()">Создать задачи по дедлайну 15.10</button></div></div>
 <div class="wid">
  <div><small>Всего в работе</small><b>${my.filter(t=>t.s!=='done').length}</b><span>${role==='Бухгалтер'?'ваши задачи':'по всей компании'}</span></div>
  <div><small>Срочных</small><b class="r">${my.filter(t=>t.p==='срочно'||t.p==='высокий').length}</b><span>с дедлайном на этой неделе</span></div>
  <div><small>Ждут документы</small><b class="w">${my.filter(t=>t.s==='wait').length}</b><span>задача стоит не по нашей вине</span></div>
  <div><small>На проверке</small><b class="i">${my.filter(t=>t.s==='check').length}</b><span>перед отправкой в налоговую</span></div>
  <div><small>Сдано за месяц</small><b class="g">38</b><span>без единой просрочки</span></div>
 </div>
 <div class="pipe">
  ${TCOL.map(([k,n,c])=>{const d=my.filter(x=>x.s===k);
   return `<div><div class="phead" style="background:${c}">${esc(n)}</div>
    <div class="pmeta"><span>${d.length} ${plural(d.length,['задача','задачи','задач'])}</span></div>
    <div class="pbody" ondragover="colOver(event,this)" ondragleave="this.classList.remove('over')" ondrop="dropTask(event,'${k}',this)">
     ${d.map(x=>`<div class="pc" draggable="true" ondragstart="dragTask(event,'${x.id}')" ondragend="this.classList.remove('drag')" onclick="openTask('${x.id}')">
      <b>${esc(x.n)}</b>
      <span class="pn">${x.cl?esc((CMAP[x.cl]||{}).n||''):'внутренняя задача'}</span>
      <span class="prow"><span class="tag ${x.p==='срочно'?'r':x.p==='высокий'?'w':''}">${esc(x.p)}</span><span class="tag a">${esc(x.acc)}</span></span>
      <span class="pn" style="margin-top:5px">${esc(x.due)}</span></div>`).join('')}
    </div></div>`}).join('')}
 </div>
 <div class="g2">
  <div class="pan"><h3>Откуда задачи берутся сами</h3>
   <div class="li"><i>·</i><span><b>Из календаря отчётности</b><span class="sub">за 10 дней до срока — задача каждому клиенту, кому сдавать эту форму</span></span></div>
   <div class="li w"><i>·</i><span><b>Из недостающих документов</b><span class="sub">клиент не прислал выписку — задача помощнику напомнить, потом бухгалтеру позвонить</span></span></div>
   <div class="li r"><i>·</i><span><b>Из уведомлений КГД</b><span class="sub">срок ответа ограничен — задача сразу с приоритетом «срочно»</span></span></div>
   <div class="li n"><i>·</i><span><b>Из договора</b><span class="sub">окончание срока, изменение тарифа, продление, истечение ЭЦП</span></span></div>
   <div class="li b"><i>·</i><span><b>Из денег</b><span class="sub">не оплачен счёт — задача напомнить, при двух месяцах — решение руководителя</span></span></div>
  </div>
  <div class="pan"><h3>Правила, которые вы настраиваете сами</h3>
   <div class="kv"><span>Задача по дедлайну создаётся</span><b>за 10 дней</b></div>
   <div class="kv"><span>Напоминание клиенту о документах</span><b>каждые 2 дня</b></div>
   <div class="kv"><span>Эскалация руководителю</span><b>после 3 напоминаний</b></div>
   <div class="kv"><span>Проверка отчёта главбухом</span><b>обязательна для ОУР и НДС</b></div>
   <div class="kv"><span>Задача не закрывается без</span><b>квитанции о приёме</b></div>
   <div class="note"><b>Последнее правило — самое важное</b><p>«Сдано» в системе означает, что приложена квитанция из кабинета налогоплательщика. Иначе через месяц выясняется, что отчёт «сдали», но он не ушёл.</p></div>
  </div>
 </div>`};

/* ====== МАТРИЦА ОБЯЗАННОСТЕЙ ====== */
SC.matrix=()=>{
 const people=['Айгуль','Динара','Асем','Мадина'];
 const rows=[['Первичка и разбор документов',['Мадина']],['Банковские выписки',['Мадина','Динара']],
  ['Зарплата и кадры',['Динара','Асем']],['ЭСФ и СНТ',['Айгуль','Асем']],
  ['НДС и 300.00',['Айгуль']],['Годовая отчётность 100.00',['Айгуль']],
  ['Упрощёнка 910.00',['Динара','Асем']],['Розничный налог 913.00',['Динара']],
  ['Ответы на уведомления КГД',['Айгуль']],['Общение с клиентом',['Динара','Асем','Айгуль']],
  ['Счета и контроль оплат',['Мадина']]];
 return `<div class="hd"><div><h2>Матрица обязанностей: кто что делает</h2>
  <p>Это тот самый вопрос, из-за которого в аутсорсинге теряются задачи: «а я думала, это делает Динара». Матрица делает зоны ответственности явными — и по участкам работы, и по конкретным клиентам.</p></div>
  <div class="btns"><button class="bt p" onclick="go('load')">Нагрузка бухгалтеров</button></div></div>
 <div class="pan"><h3>По участкам работы · перетащите исполнителя в другую ячейку</h3>
  <div class="mx"><div class="mxg" style="--c:${people.length}">
   <div class="h"></div>${people.map(p=>`<div class="h">${esc(p)}</div>`).join('')}
   ${rows.map((r,ri)=>`<div class="rw">${esc(r[0])}</div>${people.map(p=>`
    <div class="cellm" ondragover="cellOver(event,this)" ondragleave="this.classList.remove('over')" ondrop="dropChip(event,${ri},'${p}',this)">
     ${r[1].indexOf(p)>=0?`<div class="chip" draggable="true" ondragstart="dragChip(event,${ri},'${p}')" ondragend="this.classList.remove('drag')" style="background:${['#1f7a5a','#2f6f9e','#cf8a22','#6b4ea8'][people.indexOf(p)]}"><b>${esc(p)}</b></div>`:''}
    </div>`).join('')}`).join('')}
  </div></div>
  <div class="hint"><b>Что даёт матрица:</b> при уходе сотрудника в отпуск или на больничный видно, что именно нужно передать и кому. А при найме нового — что он должен уметь.</div>
 </div>
 <div class="g2">
  <div class="pan"><h3>По клиентам</h3>
   <div class="tw"><table class="t">
    <thead><tr><th>Клиент</th><th>Основной бухгалтер</th><th>Замена на отпуск</th><th>Проверяет</th></tr></thead>
    <tbody>${CLIENTS.slice(0,7).map(c=>`<tr><td><b>${esc(c.n)}</b></td><td>${esc(c.acc)}</td>
     <td>${c.acc==='Айгуль'?'Асем':c.acc==='Динара'?'Мадина':'Айгуль'}</td>
     <td>${c.m==='nds'||c.m==='our'?'Айгуль':'—'}</td></tr>`).join('')}
    </tbody></table></div>
  </div>
  <div class="pan"><h3>Передача клиента</h3>
   <div class="li"><i>1</i><span><b>Всё уже в системе</b><span class="sub">история отчётов, переписка, документы, особенности клиента — не в голове бухгалтера</span></span></div>
   <div class="li"><i>2</i><span><b>Чек-лист передачи</b><span class="sub">доступы, ЭЦП, незакрытые задачи, договорённости с клиентом</span></span></div>
   <div class="li"><i>3</i><span><b>Клиент получает уведомление</b><span class="sub">кто теперь его ведёт и как связаться</span></span></div>
   <div class="note" style="--tone:var(--bad)"><b>Риск, который закрывает система</b><p>Когда бухгалтер уходит вместе с перепиской в личном WhatsApp и файлами на своём компьютере — клиент уходит следом. Здесь всё остаётся компании.</p></div>
  </div>
 </div>`};

/* ====== УЧЁТ ВРЕМЕНИ ====== */
SC.time=()=>`<div class="hd"><div><h2>Учёт времени</h2>
 <p>Без учёта времени невозможно узнать, какой клиент прибыльный, а какой съедает всё. Отметка занимает несколько секунд: выбрал клиента, вид работы, поставил время — или включил таймер.</p></div></div>
<div class="wid">
 <div><small>Часов за месяц</small><b class="a">${F.hoursMonth}</b><span>норма ${F.normHours} по четырём сотрудникам</span></div>
 <div><small>Оплачиваемых</small><b class="g">78%</b><span>остальное — внутренние дела</span></div>
 <div><small>Час стоит компании</small><b>2 800 ₸</b><span>средняя себестоимость</span></div>
 <div><small>Средний час клиента</small><b class="i">4 520 ₸</b><span>абонплата / часы</span></div>
 <div><small>Перегруз</small><b class="w">1 сотрудник</b><span>Асем — 176 часов при норме 168</span></div>
</div>
<div class="g21">
 <div class="pan"><h3>Куда ушло время в сентябре</h3>
  <div class="fr"><span>Разбор первички и банк</span><div class="bar"><i class="b" style="--w:82%"></i></div><b>186 ч · 27%</b></div>
  <div class="fr"><span>Подготовка и сдача отчётов</span><div class="bar"><i style="--w:68%"></i></div><b>154 ч · 23%</b></div>
  <div class="fr"><span>Зарплата и кадры</span><div class="bar"><i class="v" style="--w:44%"></i></div><b>98 ч · 14%</b></div>
  <div class="fr"><span>Общение с клиентами</span><div class="bar"><i class="w" style="--w:52%"></i></div><b>118 ч · 17%</b></div>
  <div class="fr"><span>ЭСФ, СНТ, сверки</span><div class="bar"><i style="--w:34%"></i></div><b>76 ч · 11%</b></div>
  <div class="fr"><span>Внутренние дела и обучение</span><div class="bar"><i class="r" style="--w:23%"></i></div><b>52 ч · 8%</b></div>
  <div class="note" style="--tone:var(--warn)"><b>27% времени — разбор первички</b>
   <p>Это самая дорогая строка и одновременно самая простая работа. Здесь и лежит рост прибыли: часть этого времени снимается тем, что клиенты присылают документы вовремя и в нужном виде, а часть — загрузкой банковских выписок файлом.</p></div>
 </div>
 <div>
  <div class="pan"><h3>По сотрудникам</h3>
   ${STAFF.filter(s=>s.norm).map(s=>`<div class="fr" style="grid-template-columns:90px 1fr 74px"><span>${esc(s.n)}</span>
    <div class="bar"><i class="${s.hours>s.norm?'r':s.hours>s.norm*0.9?'g':'w'}" style="--w:${Math.min(100,Math.round(s.hours/s.norm*100))}%"></i></div>
    <b>${s.hours} / ${s.norm} ч</b></div>`).join('')}
   <div class="hint">Недогруз — тоже сигнал: значит, можно взять новых клиентов без найма. Перегруз — что пора либо нанимать, либо перераспределять.</div>
  </div>
  <div class="pan"><h3>Как отмечается время</h3>
   <div class="li"><i>✓</i><span><b>Таймер в задаче</b><span class="sub">начал работу — нажал, закончил — остановил</span></span></div>
   <div class="li"><i>✓</i><span><b>Вручную в конце дня</b><span class="sub">три клика: клиент, вид работы, часы</span></span></div>
   <div class="li"><i>✓</i><span><b>Автоматически по задачам</b><span class="sub">типовые работы имеют норматив, можно не отмечать вручную</span></span></div>
   <div class="li n"><i>+</i><span><b>Без надзора</b><span class="sub">учёт времени здесь не про контроль сотрудников, а про цену клиента — это важно проговорить команде</span></span></div>
  </div>
 </div>
</div>`;
/* ====== КАЛЕНДАРЬ ОТЧЁТНОСТИ ====== */
SC.cal=()=>`<div class="hd"><div><h2>Календарь отчётности на год</h2>
 <p>Главный инструмент аутсорсинга. Здесь не просто даты: система знает, какие формы сдаёт каждый клиент по своему режиму, и сама ставит задачи — за десять дней до срока, конкретному бухгалтеру, по каждому клиенту.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Календарь обновляется при изменении налогового законодательства — это часть сопровождения: сроки и формы актуализируются централизованно, а не каждым бухгалтером в своём блокноте.')">Обновление сроков</button><button class="bt p" onclick="makeTasks()">Создать задачи по ближайшему сроку</button></div></div>
<div class="wid">
 <div><small>Форм в календаре</small><b>9</b><span>910.00 · 913.00 · 200.00 · 300.00 · 100.00 · 220.00 · 701.01 и платежи</span></div>
 <div><small>Событий за год</small><b>${CALEV.length}</b><span>по всем клиентам — 312 задач</span></div>
 <div><small>Ближайший срок</small><b class="w">25 сентября</b><span>платежи по зарплате за август</span></div>
 <div><small>Готовность к 15.10</small><b class="r">19%</b><span>5 из 27 отчётов</span></div>
 <div><small>Просрочек за год</small><b class="g">0</b><span>это и есть главный показатель</span></div>
</div>
<div class="pan"><h3>Год целиком</h3>
 <div class="cal">
  ${MONTHS.map((mo,i)=>`<div class="mo ${i===8?'now':''}"><h4>${esc(mo)}</h4>
   ${CALEV.filter(e=>e.m===i).map(e=>`<div class="ev" style="--c:${e.c}"><b>${e.d} · ${esc(e.f)}</b>${esc(e.who)}</div>`).join('')||'<div class="mini" style="font-size:9.6px;color:var(--muted2)">только ежемесячные платежи</div>'}
  </div>`).join('')}
 </div>
 <div class="said"><b>Что это меняет</b><i>Пропущенный срок — это штраф клиенту и репутация компании.</i> Когда календарь в голове или в блокноте, риск растёт с каждым новым клиентом. Когда он в системе — тридцать четвёртый клиент добавляется так же спокойно, как десятый.</div>
</div>
<div class="g2">
 <div class="pan"><h3>Ежемесячные платежи · до 25 числа</h3>
  <div class="li"><i>·</i><span><b>ИПН с зарплаты</b><span class="sub">удержанный за предыдущий месяц</span></span></div>
  <div class="li"><i>·</i><span><b>ОПВ, ОППВ</b><span class="sub">пенсионные взносы</span></span></div>
  <div class="li"><i>·</i><span><b>Социальные отчисления и соцналог</b><span class="sub">по каждому сотруднику</span></span></div>
  <div class="li"><i>·</i><span><b>ОСМС и ВОСМС</b><span class="sub">медицинское страхование</span></span></div>
  <div class="note"><b>21 клиент с сотрудниками</b><p>Это 21 пакет платежей каждый месяц. Система формирует список, суммы и напоминания клиентам — по каждому видно, оплачено или нет.</p></div>
 </div>
 <div class="pan"><h3>Что система делает с дедлайном</h3>
  <div class="flow" style="grid-template-columns:repeat(2,1fr)">
   <div class="fbx done"><code>ЗА 10 ДНЕЙ</code><b>Задачи</b><p>создаются всем клиентам по этой форме, с ответственным</p></div>
   <div class="fbx done"><code>ЗА 7 ДНЕЙ</code><b>Документы</b><p>клиентам уходит запрос недостающего в WhatsApp</p></div>
   <div class="fbx on"><code>ЗА 3 ДНЯ</code><b>Проверка</b><p>главный бухгалтер проверяет ОУР и НДС перед отправкой</p></div>
   <div class="fbx"><code>В ДЕНЬ СРОКА</code><b>Контроль</b><p>руководитель видит, по кому ещё нет квитанции</p></div>
  </div>
  <div class="hint">Ни один из этих шагов не требует, чтобы кто-то помнил о сроке. Это и есть разница между «работаем аккуратно» и «система не даёт ошибиться».</div>
 </div>
</div>`;

/* ====== ГОТОВНОСТЬ К СДАЧЕ ====== */
let READY={bank:1,esf:1,prim:0,zp:1,sver:0,ost:0};
const RITEMS=[
 ['bank','Банковские выписки загружены за весь период','помощник'],
 ['esf','ЭСФ выписаны и сверены с покупками','бухгалтер'],
 ['prim','Первичные документы получены от клиента','клиент'],
 ['zp','Зарплата начислена, платежи посчитаны','бухгалтер'],
 ['sver','Акты сверки с контрагентами','клиент'],
 ['ost','Остатки и обороты проверены','главный бухгалтер']
];
SC.ready=()=>{
 const done=Object.values(READY).filter(Boolean).length,total=RITEMS.length;
 const ok=done===total;
 return `<div class="hd"><div><h2>Готовность к сдаче · ТОО «Есиль Трейд» · 300.00 за 3 квартал</h2>
  <p>Отчёт нельзя отправить, пока не закрыт чек-лист. Это защита и от спешки в последний день, и от ситуации «сдали без выписки, потом пересдавали».</p></div>
  <div class="btns"><button class="bt" onclick="resetReady()">Сбросить</button><button class="bt ${ok?'g':'p'}" onclick="sendReport()">${ok?'Отправить отчёт':'Проверить готовность'}</button></div></div>
 <div class="g21">
  <div class="pan"><h3>Чек-лист · ${done} из ${total}</h3>
   <div class="chk">${RITEMS.map(([k,n,w])=>`<div class="ci">
    <div class="bx ${READY[k]?'on':''}" onclick="togReady('${k}')">${READY[k]?'✓':''}</div>
    <span class="nm">${esc(n)}</span><span class="who">${esc(w)}</span></div>`).join('')}</div>
   ${ok?`<div class="note" style="--tone:var(--ok)"><b>Всё готово — можно отправлять</b>
    <p>После отправки система приложит квитанцию о приёме к задаче и к карточке клиента, уведомит клиента в WhatsApp с суммой к уплате и сроком, и закроет задачу.</p></div>`:
   `<div class="note" style="--tone:var(--warn)"><b>Не хватает ${total-done} ${plural(total-done,['пункта','пунктов','пунктов'])}</b>
    <p>${RITEMS.filter(([k])=>!READY[k]).map(([,n])=>esc(n)).join('; ')}. По пунктам, которые зависят от клиента, можно отправить запрос одной кнопкой.</p></div>`}
   <div class="btns" style="margin-top:12px;justify-content:flex-start">
    <button class="bt w" onclick="askClient()">Запросить у клиента недостающее</button>
    <button class="bt" onclick="go('esf')">Открыть ЭСФ и банк</button>
   </div>
  </div>
  <div>
   <div class="pan"><h3>Расчёт по отчёту</h3>
    <div class="kv"><span>Оборот по реализации</span><b>18 420 000 ₸</b></div>
    <div class="kv"><span>НДС начисленный</span><b>1 973 571 ₸</b></div>
    <div class="kv"><span>НДС в зачёт</span><b>1 412 040 ₸</b></div>
    <div class="kv"><span>К уплате</span><b style="color:var(--bad)">561 531 ₸</b></div>
    <div class="kv"><span>Срок уплаты</span><b>25.11.2026</b></div>
    <div class="hint">Клиент получит эту сумму сообщением сразу после сдачи — вместе со сроком и реквизитами. Это снимает половину звонков «сколько платить».</div>
   </div>
   <div class="pan"><h3>Проверки перед отправкой</h3>
    <div class="li"><i>✓</i><span><b>Сверка ЭСФ с декларацией</b><span class="sub">расхождения подсвечиваются до отправки, а не в уведомлении из КГД</span></span></div>
    <div class="li"><i>✓</i><span><b>Контроль контрагентов</b><span class="sub">проверка статуса: снят с НДС, лжепредприятие, ликвидация</span></span></div>
    <div class="li"><i>✓</i><span><b>Сроки действия ЭЦП</b><span class="sub">ключ не истёк — иначе отправить не получится</span></span></div>
    <div class="li"><i>✓</i><span><b>Подпись главбуха</b><span class="sub">для ОУР и НДС проверка обязательна</span></span></div>
   </div>
  </div>
 </div>`};

/* ====== РИСКИ ====== */
SC.risk=()=>`<div class="hd"><div><h2>Риски и уведомления налоговой</h2>
 <p>То, что нельзя пропустить: уведомления из КГД с ограниченным сроком ответа, приближение порогов, просроченные документы и клиенты с долгом. Всё, что может закончиться штрафом или потерей клиента.</p></div></div>
<div class="wid">
 <div><small>Активных рисков</small><b class="r">${RISKS.length}</b><span>по ${new Set(RISKS.map(r=>r.cl)).size} клиентам</span></div>
 <div><small>Уведомлений КГД</small><b class="w">1</b><span>срок ответа до 03.10</span></div>
 <div><small>Клиентов с долгом</small><b class="w">${CLIENTS.filter(c=>c.debt>0).length}</b><span>на ${fmt(CLIENTS.reduce((a,c)=>a+c.debt,0))} ₸</span></div>
 <div><small>Штрафов за год</small><b class="g">0</b><span>по вине компании</span></div>
 <div><small>Клиентов у порога НДС</small><b class="i">2</b><span>предупредить заранее</span></div>
</div>
${RISKS.map(r=>`<div class="tsk" style="--c:${r.lvl==='high'?'#c33c32':r.lvl==='mid'?'#cf8a22':'#8b9dab'}">
 <div class="th"><b>${esc(r.t)}</b><span class="tag ${r.lvl==='high'?'r':r.lvl==='mid'?'w':''}">${esc(r.due)}</span></div>
 <div class="meta"><span>Клиент: <b>${esc(r.cl)}</b></span><span>${esc(r.n)}</span></div>
</div>`).join('')}
<div class="g2">
 <div class="pan"><h3>Что система отслеживает постоянно</h3>
  <div class="li r"><i>·</i><span><b>Уведомления из кабинета налогоплательщика</b><span class="sub">срок ответа обычно ограничен — задача создаётся сразу</span></span></div>
  <div class="li w"><i>·</i><span><b>Порог по НДС</b><span class="sub">когда оборот клиента приближается — предупреждение за несколько месяцев</span></span></div>
  <div class="li w"><i>·</i><span><b>Срок действия ЭЦП</b><span class="sub">за 45 дней до окончания</span></span></div>
  <div class="li n"><i>·</i><span><b>Контрагенты клиента</b><span class="sub">изменение статуса поставщика бьёт по зачёту НДС</span></span></div>
  <div class="li b"><i>·</i><span><b>Долг за обслуживание</b><span class="sub">два месяца — вопрос о приостановке</span></span></div>
 </div>
 <div class="pan"><h3>Почему это отдельный экран</h3>
  <p>В аутсорсинге неприятности приходят не равномерно: девять клиентов идут ровно, а один требует внимания именно сегодня. Если смотреть общую таблицу, этот один теряется среди остальных.</p>
  <div class="kv"><span>Уведомление без ответа</span><b>штраф и блокировка счёта клиента</b></div>
  <div class="kv"><span>Пропущенный порог НДС</span><b>доначисление за весь период</b></div>
  <div class="kv"><span>Просроченная ЭЦП</span><b>невозможно сдать вовремя</b></div>
  <div class="kv"><span>Долг клиента 3 месяца</span><b>почти всегда невозврат</b></div>
  <div class="note" style="--tone:var(--bad)"><b>Цена одной ошибки</b><p>Один штраф клиенту за просрочку — это и компенсация, и потеря клиента, и удар по репутации в маленьком городе, где все друг друга знают. Экран рисков стоит дешевле любой такой истории.</p></div>
 </div>
</div>`;
/* ====== ДОКУМЕНТЫ ====== */
SC.docs=()=>`<div class="hd"><div><h2>Приём первичных документов</h2>
 <p>Самая трудоёмкая часть работы: собрать у клиента документы и разложить их по периодам. Здесь клиент присылает их одним способом — в WhatsApp или через свой кабинет, — а система сама раскладывает по клиенту, месяцу и виду.</p></div>
 <div class="btns"><button class="bt p" onclick="askAll()">Запросить недостающее у всех</button></div></div>
<div class="wid">
 <div><small>Документов за месяц</small><b class="a">1 842</b><span>по 34 клиентам</span></div>
 <div><small>Пришло сегодня</small><b>64</b><span>из них 41 разобрано автоматически</span></div>
 <div><small>Требуют разбора</small><b class="w">23</b><span>фото чеков и нестандартные формы</span></div>
 <div><small>Ждём от клиентов</small><b class="r">${MISS.length}</b><span>по ним закрытие стоит</span></div>
 <div><small>Среднее время сбора</small><b class="i">6 дней</b><span>было 11 до напоминаний</span></div>
</div>
<div class="g21">
 <div class="pan"><h3>Поток документов</h3>
  <div class="flow" style="grid-template-columns:repeat(5,1fr)">
   <div class="fbx done"><code>1 · КЛИЕНТ</code><b>Прислал</b><p>WhatsApp, кабинет клиента или почта</p></div>
   <div class="fbx done"><code>2 · РАЗБОР</code><b>По клиенту</b><p>система узнаёт отправителя и подшивает к нужному месяцу</p></div>
   <div class="fbx on"><code>3 · ПРОВЕРКА</code><b>Комплектность</b><p>сверяет с тем, что должно быть по этому клиенту</p></div>
   <div class="fbx"><code>4 · УЧЁТ</code><b>Обработка</b><p>бухгалтер отражает операции</p></div>
   <div class="fbx"><code>5 · АРХИВ</code><b>Хранение</b><p>по месяцам и видам, доступно и через год</p></div>
  </div>
  <div class="tw" style="margin-top:12px"><table class="t">
   <thead><tr><th>Клиент</th><th>Документ</th><th>Период</th><th>Канал</th><th>Статус</th></tr></thead>
   <tbody>
    <tr><td><b>ТОО «Астана Строй Групп»</b></td><td>Банковская выписка</td><td>сентябрь</td><td><span class="tag g">файл 1С</span></td><td><span class="tag g">загружено</span></td></tr>
    <tr><td><b>ИП Сейтказы</b></td><td>Z-отчёты кассы, 18 шт</td><td>сентябрь</td><td><span class="tag b">WhatsApp</span></td><td><span class="tag w">разбирается</span></td></tr>
    <tr><td><b>ТОО «Медтехника KZ»</b></td><td>Накладные поставщиков, 12 шт</td><td>сентябрь</td><td><span class="tag a">кабинет</span></td><td><span class="tag g">принято</span></td></tr>
    <tr><td><b>ИП Ахметова</b></td><td>Табель за сентябрь</td><td>сентябрь</td><td><span class="tag b">WhatsApp</span></td><td><span class="tag g">принято</span></td></tr>
    <tr><td><b>ТОО «Талапкер Агро»</b></td><td>Договоры на субсидии</td><td>3 квартал</td><td><span class="tag a">кабинет</span></td><td><span class="tag w">на проверке</span></td></tr>
   </tbody></table></div>
 </div>
 <div>
  <div class="pan"><h3>Кабинет клиента</h3>
   <p>Клиенту не нужно разбираться в бухгалтерии — ему нужно понимать, что от него хотят и когда. Кабинет показывает ровно это.</p>
   <div class="phone" style="margin:0 auto">
    <div class="pht"><b>САЛЬДО KZ · кабинет</b><small>ТОО «Есиль Трейд»</small></div>
    <div class="pb">
     <div class="pi"><span>Нужно прислать</span><b style="color:var(--bad)">1 документ</b></div>
     <div class="pi"><span>Банковская выписка</span><b>за сентябрь</b></div>
     <div class="pi"><span>Ближайший отчёт</span><b>300.00 · 15.10</b></div>
     <div class="pi"><span>К уплате после сдачи</span><b>561 531 ₸</b></div>
     <div class="pi"><span>Счёт за сентябрь</span><b style="color:var(--warn)">150 000 ₸</b></div>
     <div class="pbtn" onclick="toast('Клиент прикрепляет файл или фото — документ сразу попадает в нужный месяц нужного клиента, бухгалтеру приходит уведомление. Ничего не теряется в переписке.')">📎 Прикрепить документ</div>
    </div>
   </div>
  </div>
 </div>
</div>`;

SC.esf=()=>`<div class="hd"><div><h2>ЭСФ, СНТ и банковские выписки</h2>
 <p>Три источника данных, из которых собирается почти весь учёт. Чем меньше их вводят руками, тем дешевле обслуживание и тем меньше ошибок.</p></div></div>
<div class="g3">
 <div class="pan"><h3>Электронные счета-фактуры</h3>
  <div class="kv"><span>Выписано за квартал</span><b>486</b></div>
  <div class="kv"><span>Получено от поставщиков</span><b>612</b></div>
  <div class="kv"><span>Расхождений при сверке</span><b style="color:var(--bad)">7</b></div>
  <div class="kv"><span>На сумму</span><b>2 410 000 ₸</b></div>
  <div class="note" style="--tone:var(--bad)"><b>Расхождения — это будущее уведомление</b><p>Система сверяет данные до сдачи декларации, а не после получения уведомления из КГД.</p></div>
 </div>
 <div class="pan"><h3>Сопроводительные накладные</h3>
  <div class="kv"><span>Оформлено СНТ</span><b>128</b></div>
  <div class="kv"><span>По импорту</span><b>34</b></div>
  <div class="kv"><span>Просроченных</span><b class="g">0</b></div>
  <div class="kv"><span>Клиентов с СНТ</span><b>4</b></div>
  <div class="hint">СНТ обязательны по подакцизным и импортным товарам. Пропуск — штраф клиенту, поэтому по ним отдельный контроль.</div>
 </div>
 <div class="pan"><h3>Банковские выписки</h3>
  <div class="kv"><span>Загружено за месяц</span><b>29 из 34</b></div>
  <div class="kv"><span>Автоматически</span><b>21 клиент</b></div>
  <div class="kv"><span>Вручную (фото, PDF)</span><b>8 клиентов</b></div>
  <div class="kv"><span>Не прислали</span><b style="color:var(--bad)">5 клиентов</b></div>
  <div class="note"><b>Куда уходит время</b><p>Восемь клиентов, присылающих выписку картинкой, стоят компании дороже, чем двадцать один с выгрузкой файлом. Это видно в учёте времени и учитывается в тарифе.</p></div>
 </div>
</div>
<div class="pan"><h3>Сверка ЭСФ перед сдачей НДС · ТОО «Есиль Трейд»</h3>
 <div class="tw"><table class="t">
  <thead><tr><th>Контрагент</th><th>Документ</th><th class="r">У нас</th><th class="r">В ИС ЭСФ</th><th>Расхождение</th><th>Действие</th></tr></thead>
  <tbody>
   <tr><td><b>ТОО «Строй Ресурс»</b></td><td>ЭСФ-4482</td><td class="r">1 240 000</td><td class="r">1 240 000</td><td><span class="tag g">нет</span></td><td>—</td></tr>
   <tr><td><b>ТОО «Караван Логистик»</b></td><td>ЭСФ-1190</td><td class="r">860 000</td><td class="r">0</td><td><span class="tag r">нет в ИС ЭСФ</span></td><td>запросить у поставщика</td></tr>
   <tr><td><b>ИП Жаксылык</b></td><td>ЭСФ-0774</td><td class="r">312 000</td><td class="r">331 000</td><td><span class="tag w">19 000 ₸</span></td><td>уточнить сумму</td></tr>
   <tr><td><b>ТОО «Альфа Снаб»</b></td><td>ЭСФ-9921</td><td class="r">0</td><td class="r">540 000</td><td><span class="tag w">нет у нас</span></td><td>получить оригинал</td></tr>
   <tr class="total"><td>Итого расхождений</td><td></td><td class="r"></td><td class="r"></td><td>4 позиции</td><td>до сдачи 15.10</td></tr>
  </tbody></table></div>
 <div class="said"><b>Смысл экрана</b><i>Расхождение по ЭСФ — самая частая причина уведомлений из налоговой.</i> Когда сверка делается системой до сдачи, уведомлений просто не появляется — а это и штрафы, и часы работы, и нервы клиента.</div>
</div>`;

SC.miss=()=>`<div class="hd"><div><h2>Чего не хватает от клиентов</h2>
 <p>Отдельный экран, потому что это главная причина срыва сроков. Здесь видно, кто что должен прислать, сколько дней ждём и сколько раз уже напоминали.</p></div>
 <div class="btns"><button class="bt p" onclick="askAll()">Напомнить всем в WhatsApp</button></div></div>
<div class="tw"><table class="t">
 <thead><tr><th>Клиент</th><th>Какой документ</th><th class="r">Ждём</th><th>Канал</th><th>Напоминания</th><th>Последствие</th></tr></thead>
 <tbody>${MISS.map(m=>`<tr onclick="openClient('${m.cl}')">
  <td><b>${esc(m.n)}</b></td><td>${esc(m.doc)}</td>
  <td class="r"><b style="color:${m.days>5?'var(--bad)':m.days>3?'var(--warn)':'inherit'}">${m.days} дн.</b></td>
  <td><span class="tag ${m.ch==='WhatsApp'?'g':'a'}">${esc(m.ch)}</span></td>
  <td>${esc(m.st)}</td>
  <td>${m.days>5?'<span class="tag r">срок сдачи под угрозой</span>':m.days>3?'<span class="tag w">закрытие месяца стоит</span>':'<span class="tag">в пределах нормы</span>'}</td></tr>`).join('')}
 </tbody></table></div>
<div class="g2" style="margin-top:12px">
 <div class="pan"><h3>Как система добивается документов</h3>
  <div class="li"><i>1</i><span><b>Автоматический запрос</b><span class="sub">через 3 дня после начала месяца — список того, что нужно именно от этого клиента</span></span></div>
  <div class="li"><i>2</i><span><b>Повтор каждые 2 дня</b><span class="sub">с обновлённым списком: что уже прислали, чего ещё ждём</span></span></div>
  <div class="li w"><i>3</i><span><b>Звонок бухгалтера</b><span class="sub">после трёх напоминаний задача уходит человеку</span></span></div>
  <div class="li r"><i>4</i><span><b>Эскалация руководителю</b><span class="sub">если срок сдачи под угрозой — вопрос решается на уровне договора</span></span></div>
  <div class="note" style="--tone:var(--ok)"><b>Результат в цифрах</b><p>Средний срок сбора документов падает с 11 до 6 дней. Это не только сроки — это разгруженный конец месяца, когда обычно вся работа сваливается в три дня.</p></div>
 </div>
 <div class="pan"><h3>Фиксация в договоре</h3>
  <p>Система показывает историю: сколько раз напоминали и когда клиент прислал. Это аргумент в разговоре о переносе сроков и о доплате за срочность.</p>
  <div class="kv"><span>Срок предоставления документов</span><b>до 5 числа</b></div>
  <div class="kv"><span>Задержка больше 10 дней</span><b>работа в режиме срочности</b></div>
  <div class="kv"><span>Ответственность за просрочку</span><b>переходит на клиента</b></div>
  <div class="kv"><span>Подтверждение</span><b>история напоминаний в системе</b></div>
  <div class="hint">Без такой истории спор «мы вам присылали» — это слово против слова. С ней — вопрос закрыт за минуту.</div>
 </div>
</div>`;

/* ====== СВЯЗЬ ====== */
SC.wa=()=>`<div class="hd"><div><h2>WhatsApp и роботы</h2>
 <p>Почти всё общение с клиентами идёт в WhatsApp. Здесь оно перестаёт быть личной перепиской бухгалтера: сообщения уходят от компании, история хранится в карточке клиента, а рутинные напоминания отправляются сами.</p></div>
 <div class="btns"><button class="bt p" onclick="runDay()">Прогнать день</button></div></div>
<div class="wid">
 <div><small>Сообщений за месяц</small><b>827</b><span>из них 614 — автоматических</span></div>
 <div><small>Экономия времени</small><b class="g">≈ 34 ч</b><span>напоминания и рассылки</span></div>
 <div><small>Ответили на запрос</small><b class="i">78%</b><span>в течение суток</span></div>
 <div><small>Шаблонов</small><b>${TPL.length}</b><span>тексты меняете вы сами</span></div>
 <div><small>Стоимость канала</small><b>5 000 ₸/мес</b><span>один номер через сервис</span></div>
</div>
<div class="g2">
 <div class="pan"><h3>Шаблоны сообщений</h3>
  ${TPL.map((t,i)=>`<div class="tpl" onclick="openTpl(${i})"><b>${esc(t.n)}</b><span>${esc(t.t)}</span>
   <span class="sub" style="margin-top:5px">отправлено за год: ${t.use}</span></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3>Что робот делает без бухгалтера</h3>
   <div class="li"><i>✓</i><span><b>Просит документы</b><span class="sub">с 3 числа, по списку недостающего, каждые 2 дня</span></span></div>
   <div class="li"><i>✓</i><span><b>Напоминает о сроках</b><span class="sub">клиенту — чтобы был спокоен, что всё под контролем</span></span></div>
   <div class="li"><i>✓</i><span><b>Сообщает, что отчёт сдан</b><span class="sub">с квитанцией, суммой налога и сроком уплаты</span></span></div>
   <div class="li"><i>✓</i><span><b>Отправляет счёт на абонплату</b><span class="sub">1 числа каждого месяца</span></span></div>
   <div class="li"><i>✓</i><span><b>Напоминает об оплате</b><span class="sub">через 5 и 10 дней, потом — задача руководителю</span></span></div>
   <div class="li w"><i>·</i><span><b>Не делает</b><span class="sub">не консультирует и не отвечает на содержательные вопросы — это работа бухгалтера</span></span></div>
  </div>
  <div class="pan"><h3>Что будет сегодня</h3>
   <div id="dayrun"><div class="li"><i>·</i><span><b>Нажмите «Прогнать день»</b><span class="sub">покажем по шагам, какие сообщения уйдут и какие задачи создадутся</span></span></div></div>
  </div>
 </div>
</div>`;

SC.chat=()=>`<div class="hd"><div><h2>Диалог с клиентом · ТОО «Есиль Трейд»</h2>
 <p>Переписка привязана к клиенту, а не к телефону сотрудника. Видно всю историю: что просили, что обещали, когда прислали.</p></div>
 <div class="btns"><button class="bt" onclick="go('miss')">Чего не хватает</button><button class="bt p" onclick="openInvoice()">Выставить счёт</button></div></div>
<div class="g21">
 <div class="pan"><h3>Переписка</h3>
  <div class="chat">
   <div class="msg sys">1 октября · робот отправил счёт на абонплату за сентябрь — 150 000 ₸</div>
   <div class="msg out">Здравствуйте! Для закрытия сентября не хватает банковской выписки за месяц. Пришлите, пожалуйста, до 8 октября — иначе не успеем подготовить 300.00 к сроку.<small>02.10, 09:12 · робот</small></div>
   <div class="msg in">Добрый день. Постараюсь на этой неделе, бухгалтер в отпуске.<small>02.10, 11:40</small></div>
   <div class="msg out">Поняли. Напомним ещё раз 4 октября. Если нужно — можем сами выгрузить из банка, дайте доступ к интернет-банкингу только на чтение.<small>02.10, 11:52 · Айгуль</small></div>
   <div class="msg sys">4 октября · автоматическое напоминание, ответа нет</div>
   <div class="msg out">Напоминаем: не хватает банковской выписки за сентябрь. До срока сдачи 300.00 осталось 11 дней.<small>04.10, 09:00 · робот</small></div>
   <div class="msg sys">Задача «позвонить клиенту» создана автоматически после третьего напоминания · ответственная Айгуль</div>
  </div>
  <div class="btns" style="margin-top:12px;justify-content:flex-start">
   <button class="bt p" onclick="askClient()">Запросить документы</button>
   <button class="bt" onclick="openTpl(2)">Шаблон «отчёт сдан»</button>
   <button class="bt" onclick="toast('Вся переписка хранится в карточке клиента. Если бухгалтер уходит — история, договорённости и документы остаются в компании.')">История</button>
  </div>
 </div>
 <div>
  <div class="pan"><h3>Карточка клиента рядом</h3>
   <div class="kv"><span>Режим</span><b>ОУР + НДС</b></div>
   <div class="kv"><span>Ближайший срок</span><b>300.00 · 15.10</b></div>
   <div class="kv"><span>Готовность</span><b style="color:var(--warn)">4 из 6 пунктов</b></div>
   <div class="kv"><span>Долг по абонплате</span><b style="color:var(--bad)">150 000 ₸</b></div>
   <div class="kv"><span>Ответственная</span><b>Айгуль</b></div>
   <button class="bt" style="width:100%;margin-top:9px" onclick="go('card')">Открыть карточку</button>
  </div>
  <div class="pan"><h3>Почему это важно</h3>
   <div class="li"><i>✓</i><span><b>Клиент один — переписка одна</b><span class="sub">не нужно искать по трём чатам и телефонам сотрудников</span></span></div>
   <div class="li"><i>✓</i><span><b>Видно, кто что обещал</b><span class="sub">и когда; спорные ситуации закрываются историей</span></span></div>
   <div class="li"><i>✓</i><span><b>Отпуск и уход сотрудника</b><span class="sub">заменяющий видит всё и продолжает с того же места</span></span></div>
  </div>
 </div>
</div>`;
/* ====== ПРОДАЖИ ====== */
SC.funnel=()=>`<div class="hd"><div><h2>Заявки и воронка</h2>
 <p>Аутсорсинг растёт рекомендациями, и именно поэтому заявки нельзя терять: каждая — это клиент на годы. Карточки перетаскиваются мышкой, на каждой стадии своя задача.</p></div>
 <div class="btns"><button class="bt" onclick="addLead()">+ Заявка</button><button class="bt p" onclick="go('tariff')">Рассчитать стоимость</button></div></div>
<div class="wid">
 <div><small>Заявок за месяц</small><b class="a">${F.newLeads}</b><span>4 по рекомендации</span></div>
 <div><small>В работе</small><b>${LEADS.filter(l=>l.s!=='start').length}</b><span>на ${fmt(LEADS.filter(l=>l.s!=='start').reduce((a,l)=>a+l.fee,0))} ₸/мес</span></div>
 <div><small>Конверсия в договор</small><b class="g">57%</b><span>по рекомендациям — 80%</span></div>
 <div><small>Средний чек новых</small><b class="i">72 000 ₸</b><span>выше среднего по базе</span></div>
 <div><small>Срок до договора</small><b>6 дней</b><span>от заявки до подписания</span></div>
</div>
<div class="pipe">
 ${FUN.map(([k,n,c])=>{const d=LEADS.filter(x=>x.s===k);
  return `<div><div class="phead" style="background:${c}">${esc(n)}</div>
   <div class="pmeta"><span>${d.length} ${plural(d.length,['заявка','заявки','заявок'])}</span><b>${fmt(d.reduce((a,x)=>a+x.fee,0))} ₸</b></div>
   <div class="pbody" ondragover="colOver(event,this)" ondragleave="this.classList.remove('over')" ondrop="dropLead(event,'${k}',this)">
    ${d.map(x=>`<div class="pc" draggable="true" ondragstart="dragLead(event,'${x.id}')" ondragend="this.classList.remove('drag')" onclick="openLead('${x.id}')">
     <b>${esc(x.n)} ${x.hot?'<span class="tag r">важно</span>':''}</b>
     <span class="pn">${esc(MODE[x.m].n.split(' (')[0])} · ${x.emp} ${plural(x.emp,['сотрудник','сотрудника','сотрудников'])}</span>
     <span class="pp">${fmt(x.fee)} ₸/мес</span>
     <span class="prow"><span class="tag ${x.src==='рекомендация'?'g':'a'}">${esc(x.src)}</span></span>
     <span class="pn" style="margin-top:5px">${esc(x.d)}</span></div>`).join('')}
   </div></div>`}).join('')}
</div>
<div class="g2">
 <div class="pan"><h3>Что происходит на каждой стадии</h3>
  <div class="li"><i>1</i><span><b>Новая заявка</b><span class="sub">откуда пришла, чем занимается, какой режим — минимум полей, чтобы не отпугнуть</span></span></div>
  <div class="li"><i>2</i><span><b>Созвон и анкета</b><span class="sub">сотрудники, обороты, документы, особенности — это и есть входные данные для расчёта</span></span></div>
  <div class="li"><i>3</i><span><b>Расчёт стоимости</b><span class="sub">из калькулятора, с обоснованием: почему именно столько</span></span></div>
  <div class="li"><i>4</i><span><b>Договор</b><span class="sub">формируется из карточки, подписывается и хранится в системе</span></span></div>
  <div class="li"><i>5</i><span><b>Принят на обслуживание</b><span class="sub">клиент появляется в картотеке, назначается бухгалтер, создаются задачи по календарю</span></span></div>
 </div>
 <div class="pan"><h3>Откуда приходят клиенты</h3>
  <div class="fr"><span>Рекомендации</span><div class="bar"><i class="g" style="--w:78%"></i></div><b>48%</b></div>
  <div class="fr"><span>2ГИС и карты</span><div class="bar"><i class="b" style="--w:38%"></i></div><b>21%</b></div>
  <div class="fr"><span>Instagram</span><div class="bar"><i style="--w:28%"></i></div><b>16%</b></div>
  <div class="fr"><span>Сайт</span><div class="bar"><i style="--w:20%"></i></div><b>10%</b></div>
  <div class="fr"><span>Прочее</span><div class="bar"><i class="w" style="--w:10%"></i></div><b>5%</b></div>
  <div class="note" style="--tone:var(--ok)"><b>Рекомендации — половина базы</b>
   <p>Значит, главный канал продаж — это довольные действующие клиенты. Отсюда и приоритет системы: не пропускать сроки и не терять документы, а не «усилить маркетинг».</p></div>
 </div>
</div>`;

SC.price=()=>`<div class="hd"><div><h2>Прайс услуг</h2>
 <p>Прозрачный прайс снимает половину переговоров и защищает от работы бесплатно. Абонплата — за регулярное ведение, всё остальное — отдельными позициями.</p></div>
 <div class="btns"><button class="bt p" onclick="go('tariff')">Калькулятор под клиента</button></div></div>
<div class="tw"><table class="t">
 <thead><tr><th>Услуга</th><th>Единица</th><th class="r">Цена</th>${seeAll()?'<th class="r">Часы</th><th class="r">Рентабельность</th>':''}<th>Комментарий</th></tr></thead>
 <tbody>
  ${Object.entries(MODE).map(([k,m])=>{const cost=m.h*2800;const mg=Math.round((m.base-cost)/m.base*100);
   return `<tr onclick="tarSet('mode','${k}');go('tariff')"><td><b>Ведение · ${esc(m.n)}</b></td><td>месяц</td><td class="r">${fmt(m.base)} ₸</td>
   ${seeAll()?`<td class="r">${m.h}</td><td class="r"><b style="color:${mg>40?'var(--ok)':mg>25?'var(--warn)':'var(--bad)'}">${mg}%</b></td>`:''}
   <td>базовый тариф, без сотрудников и допуслуг</td></tr>`}).join('')}
  <tr><td><b>Сотрудник в расчёте зарплаты</b></td><td>чел./мес</td><td class="r">3 000 ₸</td>${seeAll()?'<td class="r">0,4</td><td class="r">63%</td>':''}<td>расчёт, ведомости, платежи</td></tr>
  <tr><td><b>Документы сверх 50 в месяц</b></td><td>документ</td><td class="r">250 ₸</td>${seeAll()?'<td class="r">0,04</td><td class="r">55%</td>':''}<td>накладные, счета, банк</td></tr>
  <tr><td><b>ЭСФ и СНТ</b></td><td>месяц</td><td class="r">15 000 ₸</td>${seeAll()?'<td class="r">3</td><td class="r">44%</td>':''}<td>выписка и сверка</td></tr>
  <tr><td><b>ВЭД и импорт</b></td><td>месяц</td><td class="r">25 000 ₸</td>${seeAll()?'<td class="r">4</td><td class="r">55%</td>':''}<td>заявления о ввозе, НДС на импорт</td></tr>
  <tr><td><b>Восстановление учёта</b></td><td>месяц периода</td><td class="r">от 40 000 ₸</td>${seeAll()?'<td class="r">8+</td><td class="r">30%</td>':''}<td>считается после оценки объёма</td></tr>
  <tr><td><b>Регистрация ИП или ТОО</b></td><td>разово</td><td class="r">35 000 ₸</td>${seeAll()?'<td class="r">4</td><td class="r">68%</td>':''}<td>включая постановку на учёт</td></tr>
  <tr><td><b>Сопровождение налоговой проверки</b></td><td>час</td><td class="r">12 000 ₸</td>${seeAll()?'<td class="r">1</td><td class="r">77%</td>':''}<td>по факту затраченного времени</td></tr>
  <tr><td><b>Кадровое делопроизводство</b></td><td>чел./мес</td><td class="r">2 000 ₸</td>${seeAll()?'<td class="r">0,3</td><td class="r">57%</td>':''}<td>приказы, договоры, отпуска</td></tr>
 </tbody></table></div>
<div class="g3" style="margin-top:12px">
 <div class="pan"><h3>Границы тарифа</h3>
  <p>Главный источник конфликтов — «а это разве не входит?». В системе состав тарифа хранится в карточке клиента и печатается в договоре, поэтому спор решается ссылкой на документ.</p>
  <div class="kv"><span>Входит</span><b>ведение, отчёты, зарплата, консультации</b></div>
  <div class="kv"><span>Сверх тарифа</span><b>восстановление, проверки, кадры</b></div>
  <div class="kv"><span>Превышение объёма</span><b>считается автоматически</b></div>
 </div>
 <div class="pan"><h3>Индексация цен</h3>
  <div class="kv"><span>Пересмотр тарифов</span><b>раз в год</b></div>
  <div class="kv"><span>Уведомление клиента</span><b>за месяц</b></div>
  <div class="kv"><span>Клиентов по старым ценам</span><b style="color:var(--warn)">7</b></div>
  <div class="kv"><span>Потенциал повышения</span><b>+186 000 ₸/мес</b></div>
  <div class="note" style="--tone:var(--warn)"><b>Это деньги, которые лежат на столе</b><p>Семь клиентов обслуживаются по ценам двухлетней давности просто потому, что об этом некому было вспомнить. Система напоминает.</p></div>
 </div>
 <div class="pan"><h3>Скидки</h3>
  <div class="kv"><span>Может дать менеджер</span><b>0%</b></div>
  <div class="kv"><span>Руководитель</span><b>до 15%</b></div>
  <div class="kv"><span>Ниже себестоимости</span><b style="color:var(--bad)">система не даст</b></div>
  <div class="kv"><span>Оплата за год вперёд</span><b>−10%, стандартно</b></div>
  <div class="hint">Каждая скидка именная: видно, кто дал, кому и сколько на этом потеряли за год.</div>
 </div>
</div>`;

/* ====== ДЕНЬГИ ====== */
SC.bill=()=>`<div class="hd"><div><h2>Начисления и счета</h2>
 <p>Первого числа система начисляет абонплату всем клиентам по их тарифам, добавляет услуги сверх тарифа за прошлый месяц и формирует счета. Раньше это был день ручной работы.</p></div>
 <div class="btns"><button class="bt" onclick="openInvoice()">Показать счёт</button><button class="bt p" onclick="billRun()">Начислить за октябрь</button></div></div>
<div class="wid">
 <div><small>Начислено за месяц</small><b class="a">${fmt(F.rev)} ₸</b><span>34 счёта</span></div>
 <div><small>Оплачено</small><b class="g">2 374 000 ₸</b><span>${F.collected}% начисленного</span></div>
 <div><small>Сверх тарифа</small><b class="i">385 000 ₸</b><span>разовые услуги</span></div>
 <div><small>Не оплачено</small><b class="w">486 000 ₸</b><span>по 5 клиентам</span></div>
 <div><small>Средний срок оплаты</small><b>7 дней</b><span>от выставления счёта</span></div>
</div>
<div class="tw"><table class="t">
 <thead><tr><th>Клиент</th><th>Период</th><th class="r">Абонплата</th><th class="r">Сверх тарифа</th><th class="r">К оплате</th><th>Счёт</th><th>Статус</th></tr></thead>
 <tbody>${CLIENTS.slice(0,8).map((c,i)=>{const extra=[0,0,15000,0,0,45000,0,25000][i]||0;
  return `<tr onclick="openClient('${c.id}')">
  <td><b>${esc(c.n)}</b></td><td>сентябрь 2026</td>
  <td class="r">${fmt(c.fee)} ₸</td><td class="r">${extra?fmt(extra)+' ₸':'—'}</td>
  <td class="r"><b>${fmt(c.fee+extra)} ₸</b></td>
  <td class="mono">№ 26-09-${String(i+101)}</td>
  <td>${c.debt?'<span class="tag r">не оплачен</span>':'<span class="tag g">оплачен</span>'}</td></tr>`}).join('')}
 </tbody></table></div>
<div class="g2" style="margin-top:12px">
 <div class="pan"><h3>Что происходит 1 числа</h3>
  <div class="li"><i>1</i><span><b>Начисление по тарифам</b><span class="sub">из карточек клиентов, с учётом изменений: добавились сотрудники — сумма другая</span></span></div>
  <div class="li"><i>2</i><span><b>Добавляются услуги сверх тарифа</b><span class="sub">из учёта времени и закрытых задач за прошлый месяц</span></span></div>
  <div class="li"><i>3</i><span><b>Формируются счета</b><span class="sub">с реквизитами, номерами и актами выполненных работ</span></span></div>
  <div class="li"><i>4</i><span><b>Уходят клиентам</b><span class="sub">в WhatsApp и в кабинет клиента — одним пакетом</span></span></div>
  <div class="li n"><i>5</i><span><b>Контроль оплат</b><span class="sub">напоминания на 5-й и 10-й день, потом задача руководителю</span></span></div>
 </div>
 <div class="pan"><h3>Акты и закрывающие документы</h3>
  <div class="kv"><span>Акт выполненных работ</span><b>формируется вместе со счётом</b></div>
  <div class="kv"><span>Подписание</span><b>ЭЦП по ссылке или бумага</b></div>
  <div class="kv"><span>Хранение</span><b>в карточке клиента</b></div>
  <div class="kv"><span>Выгрузка для бухгалтерии</span><b>Excel или 1С</b></div>
  <div class="hint">Для клиентов на ОУР закрывающие документы обязательны — без акта они не примут расходы. Автоматическое формирование снимает этот вопрос совсем.</div>
 </div>
</div>`;

SC.debt=()=>{
 const tot=CLIENTS.reduce((a,c)=>a+c.debt,0);
 return `<div class="hd"><div><h2>Дебиторка</h2>
  <p>В аутсорсинге долг растёт незаметно: клиент «заплатит на следующей неделе», а через три месяца это уже сумма, с которой не хочется расставаться ни ему, ни вам. Здесь долг виден с первого дня.</p></div>
  <div class="btns"><button class="bt w" onclick="remindDebt()">Напомнить всем должникам</button></div></div>
 <div class="wid">
  <div><small>Дебиторка</small><b class="a">${fmt(tot)} ₸</b><span>по ${CLIENTS.filter(c=>c.debt>0).length} клиентам</span></div>
  <div><small>Просрочено больше месяца</small><b class="r">190 000 ₸</b><span>1 клиент</span></div>
  <div><small>Собираемость</small><b class="g">${F.collected}%</b><span>цель — 95%</span></div>
  <div><small>Средний срок оплаты</small><b>7 дней</b><span>от счёта</span></div>
  <div><small>В стоп-листе</small><b class="w">1</b><span>обслуживание приостановлено</span></div>
 </div>
 <div class="tw"><table class="t">
  <thead><tr><th>Клиент</th><th class="r">Абонплата</th><th class="r">Долг</th><th class="r">Месяцев</th><th>Последняя оплата</th><th>Напоминания</th><th>Решение</th></tr></thead>
  <tbody>${CLIENTS.filter(c=>c.debt>0).map(c=>{const mo=Math.round(c.debt/c.fee);
   return `<tr onclick="openClient('${c.id}')">
   <td><b>${esc(c.n)}</b><span class="sub">${esc(c.acc)}</span></td>
   <td class="r">${fmt(c.fee)} ₸</td><td class="r"><b style="color:var(--bad)">${fmt(c.debt)} ₸</b></td>
   <td class="r">${mo}</td><td>${mo>1?'июль':'август'}</td>
   <td>${mo>1?'3 напоминания + звонок':'1 напоминание'}</td>
   <td>${mo>1?'<span class="tag r">приостановить обслуживание</span>':'<span class="tag w">напомнить</span>'}</td></tr>`}).join('')}
  </tbody></table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Лестница работы с долгом</h3>
   <div class="li"><i>1</i><span><b>День 5</b><span class="sub">мягкое напоминание в WhatsApp от имени компании</span></span></div>
   <div class="li"><i>2</i><span><b>День 10</b><span class="sub">повторное напоминание со ссылкой на счёт и акт</span></span></div>
   <div class="li w"><i>3</i><span><b>День 20</b><span class="sub">задача бухгалтеру: позвонить и выяснить причину</span></span></div>
   <div class="li r"><i>4</i><span><b>Второй месяц</b><span class="sub">решение руководителя: график погашения или приостановка</span></span></div>
   <div class="li r"><i>5</i><span><b>Приостановка</b><span class="sub">клиент уведомляется письменно, задачи по нему замораживаются, отчётность не сдаётся</span></span></div>
   <div class="note" style="--tone:var(--bad)"><b>Почему это должна делать система</b><p>Напоминать об оплате неудобно — особенно клиенту, которого ведёшь третий год. Когда напоминание уходит автоматически от компании, это перестаёт быть личным разговором.</p></div>
  </div>
  <div class="pan"><h3>Профилактика</h3>
   <div class="kv"><span>Оплата вперёд за месяц</span><b>18 клиентов</b></div>
   <div class="kv"><span>Оплата за год со скидкой</span><b>4 клиента</b></div>
   <div class="kv"><span>Постоплата</span><b>12 клиентов</b></div>
   <div class="kv"><span>Средний долг при постоплате</span><b style="color:var(--warn)">в 3 раза выше</b></div>
   <div class="hint">Данные из системы — хороший аргумент, чтобы постепенно перевести клиентов на предоплату: видно, что это не «недоверие», а статистика.</div>
  </div>
 </div>`};

SC.fin=()=>`<div class="hd"><div><h2>Финансы компании</h2>
 <p>Управленческая картина: сколько заработали, сколько ушло на зарплаты и сколько осталось. Всё собирается из начислений, оплат и учёта времени — отдельную таблицу вести не нужно.</p></div></div>
<div class="wid">
 <div><small>Выручка за месяц</small><b class="a">${fmt(F.rev+385000)} ₸</b><span>абонплата + разовые</span></div>
 <div><small>Фонд оплаты труда</small><b>1 200 000 ₸</b><span>4 сотрудника</span></div>
 <div><small>Аренда, связь, ПО</small><b>274 000 ₸</b><span>включая сервисы</span></div>
 <div><small>Прибыль</small><b class="g">1 086 000 ₸</b><span>маржа ${F.margin}%</span></div>
 <div><small>Прибыль на клиента</small><b class="i">31 900 ₸</b><span>в среднем</span></div>
</div>
<div class="g21">
 <div class="pan"><h3>Структура расходов</h3>
  <div class="yld">
   <div style="flex:37;background:#2f6f9e">37%<small>зарплаты</small></div>
   <div style="flex:8.5;background:#6b4ea8">9%<small>аренда и связь</small></div>
   <div style="flex:5;background:#cf8a22">5%<small>сервисы и ПО</small></div>
   <div style="flex:10;background:#8b9dab">10%<small>налоги компании</small></div>
   <div style="flex:38;background:#1f7a5a">38%<small>прибыль</small></div>
  </div>
  <div class="tw" style="margin-top:14px"><table class="t">
   <thead><tr><th>Статья</th><th class="r">Июль</th><th class="r">Август</th><th class="r">Сентябрь</th></tr></thead>
   <tbody>
    <tr><td><b>Выручка</b></td><td class="r">2 910 000</td><td class="r">3 040 000</td><td class="r"><b>3 245 000</b></td></tr>
    <tr><td>Абонплата</td><td class="r">2 660 000</td><td class="r">2 740 000</td><td class="r">2 860 000</td></tr>
    <tr><td>Разовые услуги</td><td class="r">250 000</td><td class="r">300 000</td><td class="r">385 000</td></tr>
    <tr><td>Зарплаты и налоги с ФОТ</td><td class="r">1 180 000</td><td class="r">1 190 000</td><td class="r">1 200 000</td></tr>
    <tr><td>Аренда, связь, сервисы</td><td class="r">268 000</td><td class="r">271 000</td><td class="r">274 000</td></tr>
    <tr><td>Налоги компании</td><td class="r">612 000</td><td class="r">640 000</td><td class="r">685 000</td></tr>
    <tr class="total"><td>Прибыль</td><td class="r">850 000</td><td class="r">939 000</td><td class="r">1 086 000</td></tr>
   </tbody></table></div>
 </div>
 <div>
  <div class="pan"><h3>Сводка руководителю</h3>
   <p>Каждое утро одним сообщением: сроки, документы, деньги. Без входа в систему.</p>
   <div class="msg out" style="max-width:100%;margin-top:6px">
    Вчера: сдано 3 отчёта, все в срок<br>
    Ждём документы: 6 клиентов<br>
    Оплачено за вчера: 320 000 ₸<br>
    Долг: 486 000 ₸ · 1 клиент 2 месяца<br>
    Требует решения: 2 позиции
    <small>сегодня 09:00 · портал</small></div>
  </div>
  <div class="pan"><h3>Куда смотреть при росте</h3>
   <div class="li"><i>·</i><span><b>Прибыль на клиента</b><span class="sub">если падает — берёте слишком сложных по низкой цене</span></span></div>
   <div class="li"><i>·</i><span><b>Часы на клиента</b><span class="sub">растут — значит, пора пересматривать тариф</span></span></div>
   <div class="li"><i>·</i><span><b>Клиентов на бухгалтера</b><span class="sub">выше 12 — риск просрочек и выгорания</span></span></div>
   <div class="li"><i>·</i><span><b>Собираемость</b><span class="sub">ниже 90% — деньги есть на бумаге, а не на счёте</span></span></div>
  </div>
 </div>
</div>`;
/* ====== АНАЛИТИКА ====== */
SC.profit=()=>`<div class="hd"><div><h2>Прибыль по клиентам</h2>
 <p>Вопрос, на который без системы ответить невозможно: какой клиент приносит деньги, а какой работает в минус. Считается просто — абонплата минус потраченные часы по себестоимости.</p></div></div>
<div class="tw"><table class="t">
 <thead><tr><th>Клиент</th><th>Режим</th><th class="r">Абонплата</th><th class="r">Часов</th><th class="r">Себестоимость</th><th class="r">Прибыль</th><th class="r">Рентабельность</th><th>Вывод</th></tr></thead>
 <tbody>${CLIENTS.map((c,i)=>{const h=[22,26,9,14,12,18,7,19,4,21][i];const cost=h*2800;const pr=c.fee-cost;const mg=Math.round(pr/c.fee*100);
  return `<tr onclick="openClient('${c.id}')">
  <td><b>${esc(c.n)}</b></td>
  <td><span class="tag" style="background:${MODE[c.m].c}18;color:${MODE[c.m].c}">${esc(MODE[c.m].n.split(' (')[0])}</span></td>
  <td class="r">${fmt(c.fee)}</td><td class="r">${h}</td><td class="r">${fmt(cost)}</td>
  <td class="r"><b style="color:${pr>0?'var(--ok)':'var(--bad)'}">${fmt(pr)}</b></td>
  <td class="r"><b style="color:${mg>40?'var(--ok)':mg>20?'var(--warn)':'var(--bad)'}">${mg}%</b></td>
  <td>${mg<20?'<span class="tag r">пересмотреть тариф</span>':mg<40?'<span class="tag w">на границе</span>':'<span class="tag g">хороший клиент</span>'}</td></tr>`}).join('')}
 </tbody></table></div>
<div class="g3" style="margin-top:12px">
 <div class="pan"><h3>Кто съедает время</h3>
  <div class="li r"><i>!</i><span><b>ИП Нурланов · рентабельность 13%</b><span class="sub">45 000 ₸ при 14 часах: документы приходят с задержкой и не в том виде</span></span></div>
  <div class="li w"><i>!</i><span><b>ТОО «Есиль Трейд» · 51%</b><span class="sub">при этом 26 часов — самый трудоёмкий клиент, но и самый дорогой</span></span></div>
  <div class="li"><i>✓</i><span><b>ИП Ахметова · 56%</b><span class="sub">простой учёт, документы вовремя — эталонный клиент</span></span></div>
  <div class="note"><b>Что с этим делать</b><p>Не расставаться, а менять условия: поднять тариф, ограничить объём документов или перевести часть работ в разовые услуги. Разговор с цифрами воспринимается спокойно.</p></div>
 </div>
 <div class="pan"><h3>По режимам</h3>
  <div class="fr" style="grid-template-columns:150px 1fr 60px"><span>Упрощёнка</span><div class="bar"><i class="g" style="--w:62%"></i></div><b>52%</b></div>
  <div class="fr" style="grid-template-columns:150px 1fr 60px"><span>Упрощёнка без сотр.</span><div class="bar"><i class="g" style="--w:72%"></i></div><b>66%</b></div>
  <div class="fr" style="grid-template-columns:150px 1fr 60px"><span>Розница</span><div class="bar"><i class="w" style="--w:44%"></i></div><b>39%</b></div>
  <div class="fr" style="grid-template-columns:150px 1fr 60px"><span>ОУР без НДС</span><div class="bar"><i style="--w:52%"></i></div><b>44%</b></div>
  <div class="fr" style="grid-template-columns:150px 1fr 60px"><span>ОУР + НДС</span><div class="bar"><i class="b" style="--w:56%"></i></div><b>48%</b></div>
  <div class="hint">Вывод неочевидный: самые прибыльные — простые клиенты без сотрудников, а не крупные на НДС. Но крупные дают объём и стабильность.</div>
 </div>
 <div class="pan"><h3>Что считается в себестоимость</h3>
  <div class="kv"><span>Часы бухгалтера</span><b>по учёту времени</b></div>
  <div class="kv"><span>Стоимость часа</span><b>2 800 ₸</b></div>
  <div class="kv"><span>Включает</span><b>зарплату, налоги, аренду, ПО</b></div>
  <div class="kv"><span>Пересчёт</span><b>раз в квартал</b></div>
  <div class="note" style="--tone:var(--ok)"><b>Простая формула — рабочая формула</b><p>Сложные методики распределения затрат в компании из пяти человек не нужны. Часы и ставка дают достаточно точную картину, чтобы принимать решения.</p></div>
 </div>
</div>`;

SC.load=()=>`<div class="hd"><div><h2>Нагрузка бухгалтеров</h2>
 <p>Ответ на вопрос «пора ли нанимать» и на вопрос «почему Динара не успевает». Нагрузка считается не по числу клиентов, а по часам и сложности.</p></div></div>
<div class="g21">
 <div class="pan"><h3>Сентябрь</h3>
  ${STAFF.filter(s=>s.norm).map(s=>{const p=Math.round(s.hours/s.norm*100);
   return `<div class="fr"><span><b>${esc(s.n)}</b><span class="sub">${esc(s.role)} · ${s.cli} ${plural(s.cli,['клиент','клиента','клиентов'])}</span></span>
   <div class="bar"><i class="${p>105?'r':p>90?'g':'w'}" style="--w:${Math.min(100,p)}%"></i></div>
   <b>${s.hours} / ${s.norm} ч · ${p}%</b></div>`}).join('')}
  <div class="note" style="--tone:var(--warn)"><b>Асем перегружена, Динара недогружена</b>
   <p>При этом клиентов у Динары больше. Причина в сложности: у Асем два клиента на ОУР и один с уведомлением КГД. Перераспределение по числу клиентов было бы ошибкой — нужно по часам.</p></div>
 </div>
 <div>
  <div class="pan"><h3>Можно ли взять ещё клиентов</h3>
   <div class="odo"><div class="gauge" style="--p:${Math.round(F.hoursMonth/F.normHours*100)};--gc:var(--ok)"><div><b>${Math.round(F.hoursMonth/F.normHours*100)}%</b><small>загрузка команды</small></div></div>
   <div><div class="kv"><span>Свободных часов</span><b>${F.normHours-F.hoursMonth} ч</b></div>
    <div class="kv"><span>Это примерно</span><b>5–7 клиентов</b></div>
    <div class="kv"><span>Дополнительная выручка</span><b>≈ 420 000 ₸/мес</b></div>
    <div class="kv"><span>Без найма</span><b style="color:var(--ok)">да</b></div></div></div>
  </div>
  <div class="pan"><h3>Когда нанимать</h3>
   <div class="li w"><i>·</i><span><b>Загрузка выше 95% два месяца подряд</b><span class="sub">дальше начинаются просрочки и ошибки</span></span></div>
   <div class="li w"><i>·</i><span><b>Переработки больше 10 часов в месяц</b><span class="sub">у любого сотрудника</span></span></div>
   <div class="li n"><i>·</i><span><b>Появился крупный клиент на НДС</b><span class="sub">это сразу 20+ часов в месяц</span></span></div>
   <div class="li"><i>·</i><span><b>Сначала — помощник</b><span class="sub">первичка занимает 27% времени; помощник высвобождает бухгалтеров дешевле, чем новый бухгалтер</span></span></div>
  </div>
 </div>
</div>`;

SC.kpi=()=>`<div class="hd"><div><h2>KPI и премии</h2>
 <p>Премия в аутсорсинге обычно считается «по ощущению». Здесь — по данным, которые и так собираются: сроки, клиенты, часы, качество.</p></div></div>
<div class="tw"><table class="t">
 <thead><tr><th>Сотрудник</th><th class="r">Клиентов</th><th class="r">Часов</th><th class="r">Ведёт на сумму</th><th class="r">Сдано в срок</th><th class="r">Ошибки</th><th class="r">Оклад</th><th class="r">Премия</th></tr></thead>
 <tbody>${STAFF.filter(s=>s.salary).map((s,i)=>{const bonus=[92000,64000,58000,32000][i]||0;
  return `<tr><td><b>${esc(s.n)}</b><span class="sub">${esc(s.role)}</span></td>
  <td class="r">${s.cli||'—'}</td><td class="r">${s.hours}</td><td class="r">${s.fee?fmt(s.fee)+' ₸':'—'}</td>
  <td class="r">${['100%','100%','100%','—'][i]}</td><td class="r">${['0','1','0','0'][i]}</td>
  <td class="r">${fmt(s.salary)} ₸</td><td class="r"><b style="color:var(--ok)">${fmt(bonus)} ₸</b></td></tr>`}).join('')}
 </tbody></table></div>
<div class="g2" style="margin-top:12px">
 <div class="pan"><h3>Из чего складывается премия</h3>
  <div class="kv"><span>Сдача отчётов в срок</span><b>базовое условие</b></div>
  <div class="kv"><span>Процент от абонплаты своих клиентов</span><b>10–12%</b></div>
  <div class="kv"><span>Доплата за сложных клиентов</span><b>ОУР и НДС дороже</b></div>
  <div class="kv"><span>Минус за ошибку с последствиями</span><b style="color:var(--bad)">пересдача, штраф клиенту</b></div>
  <div class="kv"><span>Бонус за приведённого клиента</span><b>одна абонплата</b></div>
  <div class="note"><b>Прозрачность важнее величины</b><p>Когда сотрудник видит, из чего складывается его премия, и может проверить цифры сам, вопросов «почему так мало» становится меньше.</p></div>
 </div>
 <div class="pan"><h3>Качество работы</h3>
  <div class="li"><i>✓</i><span><b>Сдано в срок</b><span class="sub">главный показатель: 100% за год по всем</span></span></div>
  <div class="li"><i>✓</i><span><b>Пересдачи отчётов</b><span class="sub">1 случай за год — считается ошибкой</span></span></div>
  <div class="li"><i>✓</i><span><b>Уведомления КГД по вине компании</b><span class="sub">0 за год</span></span></div>
  <div class="li"><i>✓</i><span><b>Отток клиентов</b><span class="sub">1 клиент, причина — закрытие бизнеса</span></span></div>
  <div class="hint">Эти же цифры — лучший аргумент в продажах: «за год ни одной просрочки по 34 клиентам» звучит сильнее любой рекламы.</div>
 </div>
</div>`;

/* ====== НАСТРОЙКИ ====== */
SC.roles=()=>{
 const rows=[['Картотека клиентов',1,1,'свои','смотрит','смотрит',0],['Карточка клиента · медицина учёта',1,1,'свои',0,0,'своя'],
  ['Тарифы и цены',1,'смотрит',0,0,1,0],['Себестоимость и рентабельность',1,1,0,0,0,0],
  ['Календарь и задачи',1,1,'свои','свои',0,0],['Отправка отчётности',1,1,1,0,0,0],
  ['Документы клиентов',1,1,'свои',1,0,'свои'],['WhatsApp от имени компании',1,1,1,1,1,0],
  ['Счета и начисления',1,0,0,'создаёт',0,'смотрит'],['Дебиторка',1,'смотрит',0,0,0,0],
  ['Финансы компании',1,0,0,0,0,0],['Выгрузка базы клиентов',1,0,0,0,0,0]];
 const cols=['Руководитель','Главбух','Бухгалтер','Помощник','Менеджер','Клиент'];
 const cell=v=>v===1?'<span class="tag g">да</span>':v===0?'<span class="tag">нет</span>':`<span class="tag w">${v}</span>`;
 return `<div class="hd"><div><h2>Права доступа</h2>
  <p>В бухгалтерии права — это не удобство, а безопасность: у вас персональные данные, ЭЦП-ключи и финансовая информация десятков компаний. Каждое действие в системе записывается.</p></div></div>
 <div class="tw"><table class="t">
  <thead><tr><th>Что можно</th>${cols.map(c=>`<th class="r">${c}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r=>`<tr><td><b>${r[0]}</b></td>${r.slice(1).map(v=>`<td class="r">${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="g3" style="margin-top:12px">
  <div class="pan"><h3>Журнал действий</h3>
   <div class="li"><i>·</i><span><b>Айгуль отправила 300.00 · Астана Строй</b><span class="sub">сегодня 11:20 · квитанция приложена</span></span></div>
   <div class="li"><i>·</i><span><b>Мадина выставила 34 счёта</b><span class="sub">сегодня 09:05 · пакетное начисление за сентябрь</span></span></div>
   <div class="li w"><i>!</i><span><b>Попытка выгрузить базу клиентов</b><span class="sub">роль «Бухгалтер» · отказано, событие записано</span></span></div>
   <div class="li"><i>·</i><span><b>Гульнара изменила тариф · Есиль Трейд</b><span class="sub">вчера 17:40 · 130 000 → 150 000 ₸ с октября</span></span></div>
  </div>
  <div class="pan"><h3>Защита данных клиентов</h3>
   <div class="li"><i>✓</i><span><b>ЭЦП-ключи</b><span class="sub">доступ только у назначенного бухгалтера и руководителя, с журналом использования</span></span></div>
   <div class="li"><i>✓</i><span><b>Персональные данные сотрудников клиентов</b><span class="sub">ИИН, зарплаты — по ролям</span></span></div>
   <div class="li"><i>✓</i><span><b>Выгрузка базы</b><span class="sub">только руководитель; попытки фиксируются</span></span></div>
   <div class="li"><i>✓</i><span><b>Уход сотрудника</b><span class="sub">доступ выключается за секунду, данные остаются в компании</span></span></div>
  </div>
  <div class="pan"><h3>Кабинет клиента</h3>
   <p>Отдельная роль с минимальными правами: клиент видит только себя — что прислать, какие сроки, какие счета и переписку со своим бухгалтером.</p>
   <button class="bt" style="width:100%;margin-top:8px" onclick="switchRole('Клиент (кабинет)')">Посмотреть глазами клиента</button>
  </div>
 </div>`};

SC.integr=()=>`<div class="hd"><div><h2>Интеграции</h2>
 <p>Система не заменяет 1С и кабинет налогоплательщика — она связывает то, что уже используется, и снимает ручной перенос данных между ними.</p></div></div>
<div class="tw"><table class="t">
 <thead><tr><th>Что подключаем</th><th>Зачем</th><th>Что нужно от вас</th><th>Стоимость</th><th>Когда</th></tr></thead>
 <tbody>
  <tr><td><b>WhatsApp · номер компании</b></td><td>напоминания, документы, счета, переписка</td><td>номер и подтверждение</td><td>≈ 5 000 ₸/мес сервису</td><td><span class="tag b">1-й этап</span></td></tr>
  <tr><td><b>Кабинет клиента</b></td><td>клиент присылает документы и видит свои сроки</td><td>ничего</td><td>входит</td><td><span class="tag b">1-й этап</span></td></tr>
  <tr><td><b>Выгрузка в Excel</b></td><td>счета, акты, реестры, отчёты руководителю</td><td>ничего</td><td>входит</td><td><span class="tag b">1-й этап</span></td></tr>
  <tr><td><b>1С · обмен документами</b></td><td>перенос реализаций и актов, чтобы не вводить дважды</td><td>доступ к базе</td><td>опция</td><td><span class="tag w">2-й этап</span></td></tr>
  <tr><td><b>Банковские выписки</b></td><td>загрузка файлом вместо ручного ввода</td><td>формат выписки клиента</td><td>опция</td><td><span class="tag w">2-й этап</span></td></tr>
  <tr><td><b>Kaspi / оплата по ссылке</b></td><td>клиент оплачивает счёт в один клик</td><td>договор эквайринга</td><td>комиссия банка</td><td><span class="tag w">2-й этап</span></td></tr>
  <tr><td><b>Подписание документов ЭЦП</b></td><td>договоры и акты по ссылке</td><td>шаблоны</td><td>опция</td><td><span class="tag">опция</span></td></tr>
 </tbody></table></div>
<div class="g2" style="margin-top:12px">
 <div class="pan"><h3>Чего система принципиально не делает</h3>
  <div class="li w"><i>·</i><span><b>Не сдаёт отчёты за бухгалтера</b><span class="sub">отправка идёт через кабинет налогоплательщика, как и сейчас; система готовит, напоминает и хранит квитанции</span></span></div>
  <div class="li w"><i>·</i><span><b>Не ведёт сам учёт вместо 1С</b><span class="sub">она управляет работой компании: клиенты, сроки, задачи, документы, деньги</span></span></div>
  <div class="li w"><i>·</i><span><b>Не консультирует клиентов</b><span class="sub">роботы отправляют только служебные сообщения</span></span></div>
  <div class="note" style="--tone:var(--ok)"><b>Это честная граница</b><p>Попытка заменить всё сразу — главная причина, по которой такие проекты не доводят до конца. Мы закрываем управление аутсорсингом, а учёт остаётся там, где он уже работает.</p></div>
 </div>
 <div class="pan"><h3>Работает с телефона</h3>
  <p>Портал открывается ссылкой в браузере — на компьютере, планшете и телефоне. Устанавливать ничего не нужно, обновления приходят сами.</p>
  <div class="kv"><span>Бухгалтер</span><b>задачи и документы с телефона</b></div>
  <div class="kv"><span>Руководитель</span><b>сводка и решения</b></div>
  <div class="kv"><span>Клиент</span><b>кабинет и отправка документов</b></div>
 </div>
</div>`;

SC.migr=()=>`<div class="hd"><div><h2>Перенос из таблиц и запуск</h2>
 <p>Переход не требует остановки работы: сначала переносим клиентов и сроки, потом подключаем задачи и документы, и только затем — деньги. Каждый шаг работает сам по себе.</p></div></div>
<div class="bays">
 <div class="bay" style="--c:#1f7a5a"><small>НЕДЕЛИ 1–3</small><b>Ядро</b><div class="who">Клиенты, режимы, календарь отчётности, задачи</div><div class="prg"><i style="--w:100%"></i></div><div class="tm"><span>перенос из Excel</span><span>готово</span></div></div>
 <div class="bay" style="--c:#2f6f9e"><small>НЕДЕЛИ 3–5</small><b>Работа</b><div class="who">Документы, WhatsApp-роботы, чек-листы, учёт времени</div><div class="prg"><i style="--w:56%"></i></div><div class="tm"><span>параллельно с текущей работой</span><span>идёт</span></div></div>
 <div class="bay" style="--c:#cf8a22"><small>НЕДЕЛИ 5–6</small><b>Деньги</b><div class="who">Начисления, счета, дебиторка, аналитика, кабинет клиента</div><div class="prg"><i style="--w:22%"></i></div><div class="tm"><span>по вашему списку правок</span><span>—</span></div></div>
 <div class="bay" style="--c:#6b4ea8"><small>МЕСЯЦ ПОСЛЕ</small><b>Сопровождение</b><div class="who">Правки по итогам первого реального месяца</div><div class="prg"><i style="--w:0%"></i></div><div class="tm"><span>входит в договор</span><span>—</span></div></div>
</div>
<div class="g21">
 <div class="pan"><h3>Что переносим</h3>
  <div class="tw"><table class="t">
   <thead><tr><th>Что</th><th>Откуда</th><th class="r">Объём</th><th>Как</th><th>Статус</th></tr></thead>
   <tbody>
    <tr><td><b>Клиенты и реквизиты</b></td><td>Excel, папки</td><td class="r">34</td><td>таблицей, с проверкой БИН</td><td><span class="tag g">перенесено</span></td></tr>
    <tr><td><b>Режимы и формы</b></td><td>знания бухгалтеров</td><td class="r">34</td><td>заполняем вместе на созвоне</td><td><span class="tag g">перенесено</span></td></tr>
    <tr><td><b>Тарифы и договоры</b></td><td>Excel, бумага</td><td class="r">34</td><td>сканы в карточки</td><td><span class="tag w">идёт</span></td></tr>
    <tr><td><b>История сданных отчётов</b></td><td>кабинет налогоплательщика</td><td class="r">за 2 года</td><td>по необходимости, выборочно</td><td><span class="tag">по желанию</span></td></tr>
    <tr><td><b>Задолженность клиентов</b></td><td>Excel</td><td class="r">на дату старта</td><td>вводим остатки</td><td><span class="tag">при запуске</span></td></tr>
    <tr><td><b>Контакты для WhatsApp</b></td><td>телефоны сотрудников</td><td class="r">34</td><td>с согласия клиентов</td><td><span class="tag w">идёт</span></td></tr>
   </tbody></table></div>
  <div class="said"><b>Самая ценная часть переноса</b><i>Знания, которые сейчас есть только в голове у бухгалтера:</i> у этого клиента особый порядок с субсидиями, у того документы всегда с опозданием, у третьего два ключа ЭЦП. В системе это становится полем в карточке, а не риском при увольнении.</div>
 </div>
 <div>
  <div class="pan"><h3>Обучение</h3>
   <div class="kv"><span>Руководитель</span><b>2 часа</b></div>
   <div class="kv"><span>Бухгалтеры</span><b>2 часа</b></div>
   <div class="kv"><span>Помощник</span><b>1 час</b></div>
   <div class="kv"><span>Видеоинструкции</span><b>остаются у вас</b></div>
   <div class="kv"><span>Первый месяц</span><b>отвечаем на вопросы ежедневно</b></div>
  </div>
  <div class="pan"><h3>Что нужно от вас</h3>
   <div class="li"><i>·</i><span><b>Таблица клиентов</b><span class="sub">в любом виде, даже неполная</span></span></div>
   <div class="li"><i>·</i><span><b>Прайс и границы тарифов</b><span class="sub">что входит, что сверх</span></span></div>
   <div class="li"><i>·</i><span><b>Номер для WhatsApp</b><span class="sub">рабочий номер компании</span></span></div>
   <div class="li"><i>·</i><span><b>1–2 дня на согласование экранов</b><span class="sub">это единственное, что двигает сроки</span></span></div>
  </div>
 </div>
</div>`;

SC.stack=()=>`<div class="hd"><div><h2>Состав первого релиза</h2>
 <p>Этот список станет приложением № 1 к договору — согласованным составом работ. После просмотра макета вы скажете, что убрать и что добавить.</p></div></div>
<div class="g2">
 <div class="pan"><h3>Что входит</h3>
  <div class="li"><i>✓</i><span><b>Картотека клиентов</b><span class="sub">режимы налогообложения, формы, сотрудники, доступы и ЭЦП со сроками, тариф и договор, особенности клиента</span></span></div>
  <div class="li"><i>✓</i><span><b>Календарь отчётности</b><span class="sub">формы 910.00, 913.00, 200.00, 300.00, 100.00, 220.00, 701.01 и ежемесячные платежи; автоматическое создание задач по срокам</span></span></div>
  <div class="li"><i>✓</i><span><b>Доска задач</b><span class="sub">стадии, приоритеты, ответственные, перетаскивание, закрытие только с квитанцией</span></span></div>
  <div class="li"><i>✓</i><span><b>Чек-лист готовности к сдаче</b><span class="sub">по каждому отчёту, с запросом недостающего у клиента</span></span></div>
  <div class="li"><i>✓</i><span><b>Матрица обязанностей</b><span class="sub">кто какой участок и какого клиента ведёт, замены на отпуск</span></span></div>
  <div class="li"><i>✓</i><span><b>Документы клиентов</b><span class="sub">приём через WhatsApp и кабинет, раскладка по клиенту и месяцу, контроль недостающего</span></span></div>
  <div class="li"><i>✓</i><span><b>WhatsApp-роботы</b><span class="sub">запрос документов, напоминания о сроках, отчёт сдан, счёт, напоминание об оплате; шаблоны меняете сами</span></span></div>
  <div class="li"><i>✓</i><span><b>Кабинет клиента</b><span class="sub">что прислать, какие сроки, какие счета, переписка</span></span></div>
  <div class="li"><i>✓</i><span><b>Учёт времени</b><span class="sub">по клиентам и видам работ, нагрузка сотрудников</span></span></div>
  <div class="li"><i>✓</i><span><b>Воронка заявок и расчёт стоимости</b><span class="sub">калькулятор абонплаты с оценкой трудозатрат и рентабельности</span></span></div>
  <div class="li"><i>✓</i><span><b>Начисления, счета и дебиторка</b><span class="sub">пакетное начисление, акты, контроль оплат, лестница напоминаний</span></span></div>
  <div class="li"><i>✓</i><span><b>Аналитика</b><span class="sub">прибыль по клиентам, нагрузка, KPI и премии, финансы компании, утренняя сводка руководителю</span></span></div>
  <div class="li"><i>✓</i><span><b>Права доступа и журнал</b><span class="sub">шесть ролей, ограничения на действия, история изменений</span></span></div>
  <div class="li"><i>✓</i><span><b>Перенос данных и обучение</b><span class="sub">клиенты, режимы, тарифы, задолженность; обучение команды и видеоинструкции</span></span></div>
 </div>
 <div>
  <div class="pan"><h3>Стоимость и платежи</h3>
   <div class="kv"><span>Разработка системы</span><b>1 500 000 ₸</b></div>
   <div class="kv"><span>Предоплата 10% — старт</span><b>150 000 ₸</b></div>
   <div class="kv"><span>После сдачи ядра — 30%</span><b>450 000 ₸</b></div>
   <div class="kv"><span>После полной сдачи — 30%</span><b>450 000 ₸</b></div>
   <div class="kv"><span>Через месяц после сдачи — 30%</span><b>450 000 ₸</b></div>
   <div class="kv"><span>Абонентская плата за систему</span><b style="color:var(--ok)">нет</b></div>
   <div class="kv"><span>Сервер и обслуживание</span><b>12 000 ₸/мес</b></div>
   <div class="note" style="--tone:var(--ok)"><b>Последний платёж — через месяц после сдачи</b><p>Этот месяц вы работаете в системе по-настоящему: с реальными клиентами, сроками и деньгами. Всё, что всплывёт, мы дорабатываем — и только потом закрываем расчёт.</p></div>
  </div>
  <div class="pan"><h3>Сроки и гарантии</h3>
   <div class="kv"><span>Ядро системы</span><b>2–3 недели</b></div>
   <div class="kv"><span>Полная сдача</span><b>6 недель</b></div>
   <div class="kv"><span>Месяц сопровождения</span><b>входит</b></div>
   <div class="kv"><span>Гарантия</span><b>6 месяцев</b></div>
   <div class="kv"><span>Права на систему</span><b>передаются вам</b></div>
  </div>
  <div class="pan"><h3>Что считается отдельно</h3>
   <div class="li w"><i>·</i><span><b>Обмен с 1С</b><span class="sub">по требованиям вашей бухгалтерии</span></span></div>
   <div class="li w"><i>·</i><span><b>Загрузка банковских выписок</b><span class="sub">форматы разных банков</span></span></div>
   <div class="li w"><i>·</i><span><b>Оплата счетов по ссылке</b><span class="sub">после подключения эквайринга</span></span></div>
   <div class="li w"><i>·</i><span><b>Подписание документов ЭЦП</b><span class="sub">готовый модуль, подключается опцией</span></span></div>
   <div class="li w"><i>·</i><span><b>Новый функционал после сдачи</b><span class="sub">по часам, по вашему решению</span></span></div>
  </div>
 </div>
</div>`;
/* ====== ИНТЕРАКТИВ ====== */
/* задачи */
let dragT=null;
function dragTask(e,id){dragT=id;e.target.classList.add('drag');try{e.dataTransfer.setData('text/plain',id)}catch(_){}}
function colOver(e,el){e.preventDefault();el.classList.add('over')}
function dropTask(e,st,el){e.preventDefault();el.classList.remove('over');
 const t=TASKS.find(x=>x.id===dragT);if(!t)return;
 const was=(TCOL.find(c=>c[0]===t.s)||['','—'])[1],now=(TCOL.find(c=>c[0]===st)||['',st])[1];
 t.s=st;render();
 const msg={wait:'клиенту ушёл запрос недостающих документов, таймер напоминаний запущен',
  check:'задача отправлена главному бухгалтеру на проверку — для ОУР и НДС это обязательный шаг',
  done:'система попросит приложить квитанцию о приёме: без неё задача не закроется'}[st];
 toast(`«${esc(t.n)}»: ${was} → <b>${now}</b>.${msg?' Автоматически: '+msg+'.':''}`);
}
let tid=540;
function addTask(){
 const t={id:'T-'+(++tid),n:'Новая задача',cl:'',acc:ROLES[role].n,due:'без срока',s:'new',p:'обычный'};
 TASKS.unshift(t);render();
 const c=document.querySelector('.pc');if(c)c.classList.add('new');
 toast('Задача создана. В реальной работе большинство задач появляется само — из календаря, из документов и из денег; руками заводят только нетиповое.');
}
function makeTasks(){
 sparks(14);
 const n=27;
 toast(`Создано ${n} ${plural(n,['задача','задачи','задач'])} по сроку 15 октября: 21 по форме 200.00 и 6 по форме 300.00. Каждая — на своего бухгалтера, с клиентом, сроком и чек-листом готовности. Раньше этот список составляли вручную.`);
}
function openTask(id){const t=TASKS.find(x=>x.id===id);if(!t)return;
 const c=CMAP[t.cl];
 openM(esc(t.n),(c?esc(c.n):'внутренняя задача')+' · '+esc(t.acc),`
  <div class="wid" style="grid-template-columns:repeat(3,1fr)">
   <div><small>Срок</small><b style="font-size:15px">${esc(t.due)}</b><span>приоритет: ${esc(t.p)}</span></div>
   <div><small>Ответственный</small><b style="font-size:15px">${esc(t.acc)}</b><span>${c?'ведёт этого клиента':'внутренняя задача'}</span></div>
   <div><small>Стадия</small><b style="font-size:15px">${esc((TCOL.find(x=>x[0]===t.s)||['','—'])[1])}</b><span>перетаскивается на доске</span></div>
  </div>
  ${c?`<div class="pan"><h3>Клиент</h3>
   <div class="kv"><span>Режим</span><b>${esc(MODE[c.m].n)}</b></div>
   <div class="kv"><span>Формы</span><b>${MODE[c.m].forms.join(', ')}</b></div>
   <div class="kv"><span>Сотрудников</span><b>${c.emp||'нет'}</b></div>
   <div class="kv"><span>Документы</span><b>${esc(c.docs)}</b></div>
   <div class="kv"><span>Абонплата</span><b>${fmt(c.fee)} ₸</b></div>
  </div>`:''}
  <div class="pan"><h3>Что можно сделать отсюда</h3>
   <div class="btns" style="justify-content:flex-start">
    <button class="bt p" onclick="closeM();go('ready')">Чек-лист готовности</button>
    <button class="bt" onclick="closeM();go('chat')">Написать клиенту</button>
    <button class="bt" onclick="closeM();go('docs')">Документы клиента</button>
    <button class="bt v" onclick="toast('Время по задаче учтено: 1 ч 40 мин. Оно попадёт в расчёт рентабельности клиента и в нагрузку сотрудника.');closeM()">Отметить время</button>
   </div>
   <div class="hint">Задача — это не просто напоминание: из неё видно клиента, его режим, документы и переписку. Бухгалтеру не нужно искать контекст по папкам.</div>
  </div>`);
}

/* матрица */
let dragC=null;
function dragChip(e,ri,p){dragC={ri,p};e.target.classList.add('drag')}
function cellOver(e,el){e.preventDefault();el.classList.add('over')}
function dropChip(e,ri,p,el){e.preventDefault();el.classList.remove('over');
 if(!dragC)return;
 const same=dragC.ri===ri;
 toast(same?`Участок передан: <b>${esc(dragC.p)} → ${esc(p)}</b>. Все текущие задачи по этому участку переназначены, клиенты уведомлены не будут — это внутреннее распределение.`
 :'Переносить исполнителя можно только в пределах одной строки — участка работы. Для передачи клиента целиком есть отдельная кнопка в карточке клиента.');
 dragC=null;
}

/* клиенты */
function openClient(id){const c=CMAP[id];if(!c)return;
 openM(esc(c.n),esc(MODE[c.m].n)+' · '+esc(c.acc),`
  <div class="wid" style="grid-template-columns:repeat(3,1fr)">
   <div><small>Формы</small><b style="font-size:14px">${MODE[c.m].forms.join(' · ')}</b><span>по режиму налогообложения</span></div>
   <div><small>Сотрудников</small><b>${c.emp||'нет'}</b><span>${c.emp?'200.00 и платежи ежемесячно':'зарплатных отчётов нет'}</span></div>
   ${seeMoney()?`<div><small>Абонплата</small><b class="a">${fmt(c.fee)} ₸</b><span>${c.debt?'долг '+fmt(c.debt)+' ₸':'оплачено'}</span></div>`
   :`<div><small>Документы</small><b style="font-size:14px">${esc(c.docs)}</b><span>${c.st==='ok'?'всё получено':'часть не прислали'}</span></div>`}
  </div>
  ${c.st!=='ok'?`<div class="note" style="--tone:${c.st==='risk'?'var(--bad)':'var(--warn)'}"><b>${c.st==='risk'?'Требует решения':'Ждём документы'}</b><p>${esc(c.note)}</p></div>`:''}
  <div class="pan"><h3>Ближайшие сроки</h3>
   ${MODE[c.m].forms.map((f,i)=>`<div class="li ${i===0?'w':'n'}"><i>${i+1}</i><span><b>${esc(f)}</b><span class="sub">${f==='300.00'?'НДС за 3 квартал · до 15.10':f==='200.00'?'ИПН и соцналог за 3 квартал · до 15.10':f==='910.00'?'упрощёнка за 2-е полугодие · до 15.02':f==='913.00'?'розничный налог за 3 квартал · до 15.10':'годовая · до 31.03'}</span></span></div>`).join('')}
  </div>
  <div class="pan"><h3>Действия</h3>
   <div class="btns" style="justify-content:flex-start">
    <button class="bt p" onclick="closeM();go('card')">Карточка клиента</button>
    <button class="bt" onclick="closeM();go('chat')">Написать</button>
    <button class="bt" onclick="closeM();go('ready')">Готовность к сдаче</button>
    ${seeMoney()?'<button class="bt v" onclick="closeM();openInvoice()">Счёт</button>':''}
   </div>
  </div>`);
}

/* расчёт стоимости */
function tarSet(k,v){TAR[k]=(k==='mode')?v:+v;render()}
function tarTog(k){TAR[k]=TAR[k]?0:1;render()}
function sendCalc(){const r=tarCalc();
 sparks(12);
 openM('Расчёт отправлен клиенту','так это выглядит в WhatsApp',`
  <div class="chat">
   <div class="msg out">Здравствуйте! Мы посчитали стоимость бухгалтерского обслуживания для вас.<br><br>
   Режим: <b>${esc(r.m.n)}</b><br>
   Сотрудников: ${TAR.emp}<br>
   Документов в месяц: около ${TAR.docs}<br>
   ${TAR.esf?'ЭСФ и СНТ: да<br>':''}${TAR.ved?'ВЭД и импорт: да<br>':''}${TAR.cash?'Касса и Z-отчёты: да<br>':''}
   <b>Абонентская плата: ${fmt(r.price)} ₸ в месяц</b><br><br>
   В стоимость входит ведение учёта, сдача всей отчётности по вашему режиму, расчёт зарплаты и платежей, консультации по текущим вопросам. Отдельно оплачиваются восстановление учёта за прошлые периоды, сопровождение проверок и кадровое делопроизводство.
   <small>сегодня · САЛЬДО KZ</small></div>
   <div class="msg sys">Заявка перешла в стадию «Расчёт стоимости», создана задача связаться через 2 дня, если не будет ответа</div>
  </div>
  <div class="pan" style="margin-top:12px"><h3>Почему это работает лучше устного ответа</h3>
   <div class="kv"><span>Клиент видит, за что платит</span><b>состав и границы</b></div>
   <div class="kv"><span>Цена обоснована</span><b>не «с потолка»</b></div>
   <div class="kv"><span>Расчёт сохранён</span><b>в карточке заявки</b></div>
   <div class="kv"><span>Через год при споре</span><b>видно, о чём договаривались</b></div></div>`);
}

/* готовность к сдаче */
function togReady(k){READY[k]=READY[k]?0:1;render()}
function resetReady(){Object.keys(READY).forEach(k=>READY[k]=0);render();toast('Чек-лист сброшен. Отметьте пункты — увидите, как меняется вывод системы.')}
function sendReport(){
 const done=Object.values(READY).filter(Boolean).length;
 if(done<RITEMS.length){toast(`Отправить нельзя: закрыто ${done} из ${RITEMS.length} ${plural(RITEMS.length,['пункта','пунктов','пунктов'])}. Это правило и есть защита от сдачи «на глаз» в последний день.`);return}
 sparks(16);
 openM('Отчёт 300.00 отправлен','квитанция приложена, клиент уведомлён',`
  <div class="note" style="--tone:var(--ok)"><b>Что произошло автоматически</b>
   <p>Квитанция о приёме приложена к задаче и в карточку клиента; задача закрыта; клиенту в WhatsApp ушло сообщение с суммой налога и сроком уплаты; время по задаче учтено в рентабельности клиента.</p></div>
  <div class="chat" style="margin-top:12px">
   <div class="msg out">ТОО «Есиль Трейд», отчёт 300.00 за 3 квартал 2026 сдан 13.10. Квитанция о приёме во вложении.<br>Сумма к уплате: <b>561 531 ₸</b>, срок — до 25.11.2026.<br>Реквизиты для оплаты приложены.<small>13.10, 15:42 · САЛЬДО KZ</small></div>
  </div>
  <div class="pan" style="margin-top:12px"><h3>Почему важна квитанция</h3>
   <p class="mini">Задача не считается выполненной, пока квитанции нет. Это исключает самую опасную ситуацию в аутсорсинге: все уверены, что отчёт сдан, а он не ушёл — и об этом узнают через месяц из уведомления о просрочке.</p></div>`);
}
function askClient(){
 sparks(10);
 toast('Клиенту отправлен запрос в WhatsApp с точным списком: банковская выписка за сентябрь и акты сверки. Через 2 дня напоминание повторится автоматически, после третьего — задача бухгалтеру позвонить.');
}
function askAll(){
 sparks(14);
 toast(`Запросы отправлены ${MISS.length} клиентам — каждому свой список недостающего. Ответы придут в диалоги, документы автоматически подошьются к нужному месяцу.`);
}

/* WhatsApp */
function openTpl(i){const t=TPL[i];if(!t)return;
 openM('Шаблон · '+esc(t.n),'отправлено за год: '+t.use,`
  <div class="pan"><h3>Текст шаблона</h3>
   <div class="msg out" style="max-width:100%">${esc(t.t)}<small>переменные подставляются автоматически</small></div>
   <div class="hint" style="margin-top:12px">Фигурные скобки — это подстановки: имя клиента, месяц, сумма, список документов, срок. Тексты вы меняете сами в настройках, без обращения к разработчику.</div>
  </div>
  <div class="pan"><h3>Когда отправляется</h3>
   <div class="kv"><span>Триггер</span><b>${i===0?'нет документов после 3 числа':i===1?'за 7 дней до срока':i===2?'после сдачи отчёта':i===3?'1 числа месяца':i===4?'через 5 дней после счёта':'при появлении уведомления'}</b></div>
   <div class="kv"><span>Повтор</span><b>${i===0?'каждые 2 дня':i===4?'через 10 дней':'однократно'}</b></div>
   <div class="kv"><span>Кому</span><b>${i===0||i===1?'клиентам по условию':'конкретному клиенту'}</b></div>
   <div class="kv"><span>От кого</span><b>от номера компании</b></div>
  </div>`);
}
function runDay(){
 const steps=[
  ['09:00','Запрос документов','6 клиентам — у каждого свой список недостающего'],
  ['09:05','Сводка руководителю','сроки, документы, деньги — одним сообщением'],
  ['10:00','Задачи по сроку 15.10','27 задач на трёх бухгалтеров с чек-листами'],
  ['12:00','Напоминание о сроке','клиентам, у кого отчёт готов — «от вас ничего не требуется»'],
  ['14:00','Напоминание об оплате','3 клиентам, счёт выставлен более 5 дней назад'],
  ['16:00','Эскалация','ИП Нурланов не прислал путевые после 3 напоминаний — задача бухгалтеру позвонить'],
  ['18:00','Итоги дня','что закрыто, что перенесено, что требует решения руководителя']];
 const el=document.getElementById('dayrun');if(!el)return;
 el.innerHTML='';let i=0;
 const tick=()=>{if(i>=steps.length){toast('Это обычный день: 7 автоматических действий, десятки сообщений — и ни одного напоминания, которое кто-то должен был помнить.');return}
  const [t,n,d]=steps[i++];
  el.insertAdjacentHTML('beforeend',`<div class="li b"><i>${i}</i><span><b>${t} · ${esc(n)}</b><span class="sub">${esc(d)}</span></span></div>`);
  setTimeout(tick,740)};
 tick();
}

/* воронка заявок */
let dragL=null;
function dragLead(e,id){dragL=id;e.target.classList.add('drag')}
function dropLead(e,st,el){e.preventDefault();el.classList.remove('over');
 const l=LEADS.find(x=>x.id===dragL);if(!l)return;
 const was=(FUN.find(f=>f[0]===l.s)||['','—'])[1],now=(FUN.find(f=>f[0]===st)||['',st])[1];
 l.s=st;render();
 const msg={calc:'открылся калькулятор стоимости — расчёт сохранится в карточке заявки',
  dog:'договор сформирован из карточки: реквизиты, тариф, состав услуг и границы',
  start:'клиент добавлен в картотеку, назначен бухгалтер, созданы задачи по календарю его режима'}[st];
 toast(`«${esc(l.n)}»: ${was} → <b>${now}</b>.${msg?' Автоматически: '+msg+'.':''}`);
}
let lid=90;
function addLead(){
 const names=['ТОО «Байтерек Сервис»','ИП Жумабек','ТОО «Акмола Строй»','ИП Тулегенова (аптека)'];
 const n=names[Math.floor(Math.random()*names.length)];
 LEADS.unshift({id:'L-'+(++lid),n,m:'upr',emp:3,s:'new',src:'рекомендация',fee:45000,d:'только что',hot:0});
 render();const c=document.querySelector('.pc');if(c)c.classList.add('new');
 sparks(10);
 toast(`Заявка «${esc(n)}» создана. Источник важен: почти половина клиентов приходит по рекомендации — это видно в отчёте и помогает понять, что действительно работает.`);
}
function openLead(id){const l=LEADS.find(x=>x.id===id);if(!l)return;
 openM(esc(l.n),esc(MODE[l.m].n)+' · '+esc(l.src),`
  <div class="wid" style="grid-template-columns:repeat(3,1fr)">
   <div><small>Расчётная абонплата</small><b class="a">${fmt(l.fee)} ₸</b><span>по калькулятору</span></div>
   <div><small>Сотрудников</small><b>${l.emp||'нет'}</b><span>влияет на цену и часы</span></div>
   <div><small>Состояние</small><b style="font-size:14px">${esc(l.d)}</b><span>${l.hot?'требует внимания':'в работе'}</span></div>
  </div>
  <div class="pan"><h3>Анкета клиента</h3>
   <div class="kv"><span>Режим налогообложения</span><b>${esc(MODE[l.m].n)}</b></div>
   <div class="kv"><span>Формы отчётности</span><b>${MODE[l.m].forms.join(', ')}</b></div>
   <div class="kv"><span>Документов в месяц</span><b>около 60</b></div>
   <div class="kv"><span>Кто ведёт сейчас</span><b>сам директор</b></div>
   <div class="kv"><span>Причина обращения</span><b>нет времени и боится штрафов</b></div>
  </div>
  <div class="btns" style="justify-content:flex-start">
   <button class="bt p" onclick="closeM();go('tariff')">Посчитать стоимость</button>
   <button class="bt" onclick="closeM();sendCalc()">Отправить расчёт</button></div>`);
}

/* деньги */
function billRun(){
 sparks(18);
 openM('Начисление за октябрь выполнено','34 счёта, 2 860 000 ₸ — за 4 секунды вместо дня работы',`
  <div class="note" style="--tone:var(--ok)"><b>Что сделала система</b>
   <p>Начислила абонплату по тарифам из карточек клиентов; добавила услуги сверх тарифа за сентябрь по данным учёта времени; сформировала счета и акты; отправила их клиентам в WhatsApp и в кабинеты; поставила контроль оплаты на 5-й и 10-й день.</p></div>
  <div class="pan"><h3>Итоги начисления</h3>
   <div class="kv"><span>Счетов создано</span><b>34</b></div>
   <div class="kv"><span>Абонплата</span><b>2 860 000 ₸</b></div>
   <div class="kv"><span>Сверх тарифа</span><b>385 000 ₸</b></div>
   <div class="kv"><span>Клиентов с изменением тарифа</span><b>2 · добавились сотрудники</b></div>
   <div class="kv"><span>Не начислено</span><b>1 · обслуживание приостановлено</b></div>
  </div>
  <div class="btns" style="justify-content:flex-start"><button class="bt p" onclick="closeM();openInvoice()">Показать счёт</button><button class="bt" onclick="closeM()">Закрыть</button></div>`);
}
function openInvoice(){
 openM('Счёт № 26-09-104','формируется из карточки клиента вместе с актом',`
  <div class="doc">
   <div class="dh">
    <div><div class="dl">САЛЬДО KZ<small>БУХГАЛТЕРСКИЙ АУТСОРСИНГ</small></div></div>
    <div style="text-align:right;font-size:9.6px;color:#5e7280;line-height:1.6">Акмолинская обл., Целиноградский р-н,<br>с. Талапкер, ул. Кунаева, 35<br>сальдо.kz</div>
   </div>
   <h4>Счёт на оплату № 26-09-104 от 01.10.2026</h4>
   <div style="font-size:10.4px;color:#5e7280;margin-bottom:11px">Плательщик: <b style="color:#142430">ТОО «Есиль Трейд»</b> · период: сентябрь 2026 · договор от 09.01.2026</div>
   <div class="drow h"><span>№</span><span>Наименование услуги</span><span class="r">Кол-во</span><span class="r">Сумма, ₸</span></div>
   <div class="drow"><span>1</span><span>Бухгалтерское обслуживание (ОУР + НДС) за сентябрь 2026</span><span class="r">1 мес</span><span class="r">150 000</span></div>
   <div class="drow"><span>2</span><span>Расчёт зарплаты, 11 сотрудников</span><span class="r">11</span><span class="r">включено</span></div>
   <div class="drow"><span>3</span><span>ЭСФ и сверка с ИС ЭСФ</span><span class="r">1 мес</span><span class="r">включено</span></div>
   <div class="dsum"><span>Итого к оплате</span><span>150 000 ₸</span></div>
   <div style="font-size:10px;color:#5e7280;margin-top:8px">Оплата до 10 числа. К счёту приложен акт выполненных работ за сентябрь 2026.</div>
   <div class="dfoot"><div><b style="color:#142430">Исполнитель</b><br>ИП «САЛЬДО KZ»<br>руководитель Сабитова Г. Г.</div>
    <div><b style="color:#142430">Оплатить</b><br>по реквизитам в счёте<br>или по ссылке из WhatsApp</div></div>
   <div class="sgn"><span>Исполнитель: <u></u></span><span>Заказчик: <u></u></span></div>
  </div>
  <div class="hint" style="margin-top:12px">Счёт и акт формируются пакетом по всем клиентам первого числа. Сейчас это день работы: посчитать, сделать, отправить, потом вспоминать, кто оплатил.</div>`);
}
function remindDebt(){
 sparks(10);
 toast('Напоминания отправлены 5 клиентам с суммой и номером счёта. По клиенту с долгом за 2 месяца создана задача руководителю: решить, приостанавливать обслуживание или согласовать график.');
}

function searchDemo(v){
 if(!v)return;
 toast(`Поиск «${esc(v)}»: сквозной по клиентам, БИН, задачам, документам, счетам и переписке. Например, по номеру формы видно всех клиентов, кто её сдаёт, и текущую готовность по каждому.`);
}

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
 role=ROLES[k]?k:'Руководитель';
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
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('tasks')?'':'none';
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
function sparks(n){for(let i=0;i<n;i++){const s=document.createElement('i');s.className='spark';
 s.style.left=(14+Math.random()*72)+'vw';
 s.style.background=['#1f7a5a','#4fc38f','#2f6f9e','#16232e'][i%4];
 s.style.borderRadius=i%2?'50%':'2px';
 s.style.animationDelay=(Math.random()*.4)+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),2300)}}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();
 toast(theme==='dark'?'Тёмная тема — для вечерней работы и для проектора.':'Светлая тема.')}

/* ====== СЦЕНАРИЙ ПОКАЗА ====== */
const TOUR=[
 ['dash','Общая картина: клиенты, сроки, документы и деньги на одном экране. Сейчас это три таблицы и память бухгалтеров.'],
 ['cal','Календарь отчётности на год: система знает, какие формы сдаёт каждый клиент, и ставит задачи за 10 дней до срока.'],
 ['tasks','Доска задач. Карточки перетаскиваются; нажмите «Создать задачи по дедлайну» — увидите, как появляются 27 задач разом.'],
 ['ready','Чек-лист готовности: отчёт нельзя отправить, пока не закрыты все пункты. Попробуйте отметить их и нажать «Отправить».'],
 ['miss','Чего не хватает от клиентов — главная причина срыва сроков. Робот просит документы сам, каждые два дня.'],
 ['wa','WhatsApp и роботы: нажмите «Прогнать день» — увидите, что система делает без участия бухгалтера.'],
 ['tariff','Калькулятор стоимости: режим, сотрудники, документы — и сразу видно цену, часы и рентабельность клиента.'],
 ['profit','Прибыль по клиентам: кто приносит деньги, а кто работает в минус. Без учёта времени этот вопрос не имеет ответа.'],
 ['load','Нагрузка бухгалтеров: пора ли нанимать и кого именно — помощника или бухгалтера.'],
 ['bill','Начисления и счета: нажмите «Начислить за октябрь» — 34 счёта вместо дня ручной работы.'],
 ['debt','Дебиторка: лестница напоминаний от мягкого до приостановки обслуживания.'],
 ['matrix','Матрица обязанностей: кто какой участок ведёт и кто заменяет на отпуске.'],
 ['roles','Права доступа: у вас персональные данные и ЭЦП десятков компаний — доступ по ролям и журнал действий.'],
 ['stack','И состав первого релиза: 1 500 000 ₸, оплата 10 / 30 / 30 / 30, срок 6 недель, абонплаты за систему нет.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;
 document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;
 if(ti>=TOUR.length){stopTour();toast('Сценарий показа закончен. Дальше можно листать разделы вручную — всё кликается: задачи, чек-листы, календарь, калькулятор.');return}
 const [k,m]=TOUR[ti];
 if(!allowed(k)){step();return}
 cur=k;build();toast(m);
 setTimeout(step,ti===0?5800:6800);
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
