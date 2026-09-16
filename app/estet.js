/* Estetica Clinic · демо портала клиники эстетической медицины
   Собрано по встрече 16.09.2026 (Санжар, директор клиники).
   Заменяет связку Altegio + amoCRM одной системой. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const pct=(a,b)=>num(a/b*100)+'%';
const mln=n=>num(n/1000000)+' млн';
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
/* пометка «это вы просили на встрече» */
const said=t=>`<span class="tag b" title="прозвучало на встрече 16 сентября">${t}</span>`;

const SEC=[
 {k:'dash', ic:'▦', n:'Пульт',     sub:[['dash','Пульт директора'],['day','Сценарий дня']]},
 {k:'sales',ic:'◎', n:'Продажи',   sub:[['funnel','Воронки и сделки'],['leads','Лиды и источники'],['chats','Диалоги'],['calls','Телефония']]},
 {k:'rec',  ic:'▤', n:'Запись',    sub:[['sched','Расписание кабинетов'],['online','Онлайн-запись']]},
 {k:'pat',  ic:'☺', n:'Пациенты',  sub:[['clients','Картотека'],['card','Карта пациента'],['photo','Фото до и после'],['docs','Согласия и договоры']]},
 {k:'med',  ic:'✚', n:'Лечение',   sub:[['plan','План лечения'],['blank','Бланк и отправка'],['price','Прайсы и акции']]},
 {k:'wh',   ic:'⬢', n:'Склад',     sub:[['stock','Препараты и партии'],['writeoff','Списание и себестоимость']]},
 {k:'money',ic:'₸', n:'Деньги',    sub:[['cash','Касса и оплаты'],['payroll','Зарплата врачей'],['fin','Финансы клиники']]},
 {k:'an',   ic:'▥', n:'Аналитика', sub:[['mark','Маркетинг и ROMI'],['ltv','Повторные и LTV'],['econ','Сколько это экономит']]},
 {k:'bots', ic:'⚡', n:'Роботы',    sub:[['robots','Триггеры и напоминания'],['review','Отзывы и репутация']]},
 {k:'set',  ic:'⚙', n:'Настройки', sub:[['roles','Права доступа'],['integr','Интеграции'],['migr','Переход с Altegio и amo'],['stack','Состав релиза']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));

const ROLES={
 'Директор':{av:'СЖ',n:'Санжар',r:'директор клиники',note:'Всё: воронки, запись, план лечения, деньги, склад, роботы и настройки',
  s:['dash','day','funnel','leads','chats','calls','sched','online','clients','card','photo','docs','plan','blank','price','stock','writeoff','cash','payroll','fin','mark','ltv','econ','robots','review','roles','integr','migr','stack']},
 'Собственник':{av:'ВЛ',n:'владелица',r:'смотрит сверху',note:'Показатели, деньги, маржа и зарплаты — без ежедневной операционки',
  s:['dash','sched','clients','plan','price','stock','cash','payroll','fin','mark','ltv','econ','review','roles','migr','stack']},
 'Врач-косметолог':{av:'АЙ',n:'Айгерим',r:'кабинет № 1',note:'Свой приём, карта пациента, план лечения, фото, списание препаратов',
  s:['day','sched','clients','card','photo','docs','plan','blank','price','stock','writeoff','payroll']},
 'Администратор':{av:'МД',n:'Мадина',r:'ресепшн',note:'Лиды, диалоги, звонки, запись, касса и напоминания. Себестоимость не видит',
  s:['day','funnel','leads','chats','calls','sched','online','clients','card','docs','price','cash','robots','review']},
 'Маркетолог':{av:'ТИ',n:'Тимур',r:'таргет и контент',note:'Источники лидов, воронки, окупаемость рекламы, отзывы',
  s:['funnel','leads','chats','online','mark','ltv','econ','robots','review']},
 'Бухгалтер':{av:'ГУ',n:'Гульнара',r:'деньги и отчёты',note:'Касса, оплаты, зарплаты, склад и закрытие месяца',
  s:['cash','fin','payroll','stock','writeoff','clients','docs']},
 'Старшая медсестра':{av:'ЖА',n:'Жанна',r:'процедурный блок',note:'Расписание кабинетов, препараты, сроки годности, согласия',
  s:['day','sched','card','photo','docs','stock','writeoff']}
};
let role='Директор',cur='dash',theme='light';

/* ====== ДАННЫЕ ====== */
const F={
 rev:18400000, pats:214, avg:86000, leads:340, conv:38, show:81, rep:44,
 docs:3, rooms:3, staff:9, plans:62, planSum:16600000, planConv:57,
 amo:46000, altegio:32000, waAmo:36000, waGreen:5000
};

/* прайс: цена базовая, себестоимость расходников, единица */
const PRICE=[
 {k:'cons', n:'Консультация врача',        u:'приём',  p:10000,  c:0,     g:'Приём',    note:'зачитывается в план лечения'},
 {k:'botox',n:'Ботулинотерапия',           u:'единица',p:2200,   c:900,   g:'Инъекции', note:'лоб, межбровье, вокруг глаз'},
 {k:'fill', n:'Филлер гиалуроновый',       u:'мл',     p:95000,  c:38000, g:'Инъекции', note:'скулы, губы, носогубные'},
 {k:'biore',n:'Биоревитализация',          u:'процед.',p:65000,  c:22000, g:'Инъекции', note:'курс 3–4 процедуры'},
 {k:'mezo', n:'Мезотерапия',               u:'процед.',p:28000,  c:8500,  g:'Инъекции', note:'лицо, шея, зона декольте'},
 {k:'plasm',n:'Плазмотерапия',             u:'пробирка',p:32000, c:9000,  g:'Инъекции', note:'своя плазма пациента'},
 {k:'threa',n:'Нитевая подтяжка',          u:'нить',   p:38000,  c:15000, g:'Нити',     note:'мезонити и армирующие'},
 {k:'lipo', n:'Липофилинг лица',           u:'зона',   p:420000, c:120000,g:'Операционная',note:'забор жира и пересадка'},
 {k:'laser',n:'Лазерная шлифовка',         u:'зона',   p:180000, c:35000, g:'Аппаратные',note:'фракционный лазер'},
 {k:'rf',   n:'RF-лифтинг',                u:'процед.',p:38000,  c:6000,  g:'Аппаратные',note:'курс от 6 процедур'},
 {k:'peel', n:'Пилинг срединный',          u:'процед.',p:45000,  c:12000, g:'Уход',     note:'реабилитация 5–7 дней'},
 {k:'clean',n:'Чистка лица',               u:'процед.',p:25000,  c:5000,  g:'Уход',     note:'часто как вход в клинику'}
];
const PMAP={};PRICE.forEach(p=>PMAP[p.k]=p);

/* три прайса, как у стоматологии из разговора */
const TARIFF={base:{n:'Базовый',k:1,note:'обычный приём'},
 promo:{n:'Акционный',k:.85,note:'акция месяца, −15%'},
 vip:{n:'VIP / врач-эксперт',k:1.35,note:'приём у главного врача'}};
let tariff='base';

/* стадии воронок */
const FUNNELS={
 prim:{n:'Первичные пациенты', st:[
  ['new','Новый лид','#7a6595'],['qual','Квалификация','#3b7a9e'],['rec','Записан на консультацию','#cf8a22'],
  ['come','Был на консультации','#a8764a'],['plan','План лечения выдан','#c0637f'],['pay','Оплата / аванс','#2f8f5b'],['done','Процедура сделана','#241b28']]},
 rep:{n:'Повторные по плану лечения', st:[
  ['wait','Ждёт этап 2','#7a6595'],['call','Позвонить','#3b7a9e'],['rec2','Записан','#cf8a22'],['pay2','Оплатил этап','#2f8f5b'],['done2','Этап закрыт','#241b28']]},
 mark:{n:'Акция «Осенний уход»', st:[
  ['send','Отправлено','#7a6595'],['open','Прочитал','#3b7a9e'],['ans','Ответил','#cf8a22'],['rec3','Записался','#2f8f5b']]}
};
let funnel='prim';

let DEALS=[
 {id:'L-1042',n:'Аружан К.',ph:'+7 707 ··· 41 08',s:'new',  f:'prim',src:'Таргет · лид-форма',proc:'Нитевая подтяжка',sum:190000,d:'сегодня 09:14',hot:1},
 {id:'L-1041',n:'Динара С.',ph:'+7 701 ··· 77 22',s:'new',  f:'prim',src:'Instagram Direct',  proc:'Филлеры губы',   sum:95000, d:'сегодня 08:40',hot:0},
 {id:'L-1039',n:'Мадина Т.',ph:'+7 747 ··· 19 63',s:'qual', f:'prim',src:'Таргет · лид-форма',proc:'Липофилинг',     sum:420000,d:'вчера 18:20',hot:1},
 {id:'L-1036',n:'Асель Б.', ph:'+7 705 ··· 30 51',s:'qual', f:'prim',src:'WhatsApp · органика',proc:'Ботокс',        sum:66000, d:'вчера 15:05',hot:0},
 {id:'L-1033',n:'Жанель Н.',ph:'+7 778 ··· 84 90',s:'rec',  f:'prim',src:'2ГИС',             proc:'Консультация',   sum:0,     d:'запись на 18.09 11:00',hot:0},
 {id:'L-1031',n:'Алия Ж.',  ph:'+7 701 ··· 12 47',s:'rec',  f:'prim',src:'Рекомендация',     proc:'Лазер',          sum:180000,d:'запись на 17.09 14:30',hot:1},
 {id:'L-1028',n:'Камила Р.',ph:'+7 702 ··· 55 38',s:'come', f:'prim',src:'Таргет · лид-форма',proc:'Биоревитализация',sum:195000,d:'консультация 15.09',hot:0},
 {id:'L-1024',n:'Сауле М.', ph:'+7 707 ··· 63 19',s:'plan', f:'prim',src:'Instagram Direct', proc:'Нити + филлер',  sum:361000,d:'план выдан 14.09',hot:1},
 {id:'L-1019',n:'Гульнар А.',ph:'+7 775 ··· 28 44',s:'plan',f:'prim',src:'WhatsApp · органика',proc:'Липофилинг',   sum:420000,d:'план выдан 12.09',hot:1},
 {id:'L-1015',n:'Айнур Д.', ph:'+7 701 ··· 90 06',s:'pay',  f:'prim',src:'Таргет · лид-форма',proc:'Нити 6 шт',     sum:228000,d:'аванс 100 000 ₸',hot:0},
 {id:'L-1011',n:'Дана Е.',  ph:'+7 747 ··· 71 25',s:'done', f:'prim',src:'Рекомендация',     proc:'Ботокс + мезо',  sum:94000, d:'сделано 11.09',hot:0},
 {id:'R-908', n:'Камила Р.',ph:'+7 702 ··· 55 38',s:'wait', f:'rep', src:'План · этап 2',    proc:'Биоревитализация №2',sum:65000,d:'по плану 22.09',hot:0},
 {id:'R-904', n:'Айнур Д.', ph:'+7 701 ··· 90 06',s:'call', f:'rep', src:'План · этап 2',    proc:'Нити · докоррекция',sum:76000,d:'звонок сегодня',hot:1},
 {id:'R-901', n:'Дана Е.',  ph:'+7 747 ··· 71 25',s:'rec2', f:'rep', src:'План · этап 3',    proc:'Мезотерапия №3', sum:28000, d:'запись 19.09',hot:0},
 {id:'R-898', n:'Сауле М.', ph:'+7 707 ··· 63 19',s:'pay2', f:'rep', src:'План · этап 2',    proc:'Филлер 1 мл',    sum:95000, d:'оплачен 15.09',hot:0},
 {id:'M-210', n:'Асель Б.', ph:'+7 705 ··· 30 51',s:'send', f:'mark',src:'Рассылка 12.09',   proc:'Осенний уход −15%',sum:38250,d:'отправлено',hot:0},
 {id:'M-206', n:'Жанель Н.',ph:'+7 778 ··· 84 90',s:'open', f:'mark',src:'Рассылка 12.09',   proc:'Осенний уход −15%',sum:38250,d:'прочитано',hot:0},
 {id:'M-201', n:'Алия Ж.',  ph:'+7 701 ··· 12 47',s:'ans',  f:'mark',src:'Рассылка 12.09',   proc:'Осенний уход −15%',sum:38250,d:'спросила цену',hot:1}
];

const LEADSRC=[
 {n:'Таргет · лид-форма Instagram',c:118,cost:2100000,rec:52,pay:19,rev:5460000,tag:'таргет'},
 {n:'Таргет · WhatsApp-переход',   c:64, cost:980000, rec:24,pay:8, rev:1820000,tag:'таргет'},
 {n:'Instagram Direct · органика', c:71, cost:0,      rec:31,pay:12,rev:3180000,tag:'органика'},
 {n:'WhatsApp · органика',         c:38, cost:0,      rec:19,pay:9, rev:2940000,tag:'органика'},
 {n:'2ГИС и карты',                c:26, cost:140000, rec:12,pay:5, rev:1210000,tag:'органика'},
 {n:'Рекомендации пациентов',      c:23, cost:0,      rec:18,pay:14,rev:3790000,tag:'органика'}
];

const PATIENTS=[
 {id:'P-0142',n:'Сауле Мукашева',    age:41,ph:'+7 707 ··· 63 19',first:'12.03.2025',visits:9, sum:1840000,plan:'Нити + филлер · этап 2 из 3',next:'22.09 · 11:00',doc:'Айгерим',tags:['VIP','нити']},
 {id:'P-0198',n:'Камила Рахимова',   age:34,ph:'+7 702 ··· 55 38',first:'04.06.2025',visits:5, sum:690000, plan:'Биоревитализация · курс 4',next:'22.09 · 15:30',doc:'Айгерим',tags:['курс']},
 {id:'P-0233',n:'Айнур Дюсенова',    age:38,ph:'+7 701 ··· 90 06',first:'18.08.2025',visits:3, sum:328000, plan:'Нити 6 шт · оплачен аванс',next:'17.09 · 10:00',doc:'Нурлан',tags:['аванс']},
 {id:'P-0251',n:'Дана Ержанова',     age:29,ph:'+7 747 ··· 71 25',first:'02.02.2026',visits:6, sum:412000, plan:'Мезотерапия · этап 3 из 4',next:'19.09 · 16:00',doc:'Айгерим',tags:['курс','рекомендует']},
 {id:'P-0277',n:'Гульнар Абишева',   age:46,ph:'+7 775 ··· 28 44',first:'09.09.2026',visits:1, sum:10000,  plan:'Липофилинг · план выдан',next:'ждём решения',doc:'Нурлан',tags:['крупный чек']},
 {id:'P-0281',n:'Алия Жумабекова',   age:36,ph:'+7 701 ··· 12 47',first:'14.09.2026',visits:0, sum:0,      plan:'—',next:'17.09 · 14:30',doc:'Айгерим',tags:['первичная']}
];

const APPTS=[
 {id:'A1',t:'09:00',r:0,n:'Дана Е.',p:'Мезотерапия №3',dur:1,c:'#7a6595',st:'подтверждена'},
 {id:'A2',t:'10:00',r:0,n:'Айнур Д.',p:'Нити · 6 шт',dur:2,c:'#a8764a',st:'подтверждена'},
 {id:'A3',t:'11:00',r:1,n:'Сауле М.',p:'Филлер 1 мл',dur:1,c:'#c0637f',st:'подтверждена'},
 {id:'A4',t:'12:00',r:2,n:'Жанель Н.',p:'Консультация',dur:1,c:'#3b7a9e',st:'ждёт подтверждения'},
 {id:'A5',t:'14:00',r:1,n:'Алия Ж.',p:'Лазерная шлифовка',dur:2,c:'#cf8a22',st:'подтверждена'},
 {id:'A6',t:'15:00',r:0,n:'Камила Р.',p:'Биоревитализация №2',dur:1,c:'#2f8f5b',st:'подтверждена'},
 {id:'A7',t:'16:00',r:2,n:'Мадина Т.',p:'Консультация · липофилинг',dur:1,c:'#3b7a9e',st:'ждёт подтверждения'}
];
const ROOMS=['Кабинет № 1 · Айгерим','Кабинет № 2 · Нурлан','Консультационная'];
const HOURS=['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

const CHATS=[
 {id:'C1',n:'Аружан К.',ch:'wa',last:'Здравствуйте! Сколько стоят нити?',t:'09:14',unread:2},
 {id:'C2',n:'Динара С.',ch:'ig',last:'Видела вашу сторис про губы',t:'08:40',unread:1},
 {id:'C3',n:'Сауле М.',ch:'wa',last:'Спасибо, буду 22-го в 11',t:'вчера',unread:0},
 {id:'C4',n:'Мадина Т.',ch:'tg',last:'Отправьте, пожалуйста, план лечения',t:'вчера',unread:0},
 {id:'C5',n:'Асель Б.',ch:'wa',last:'А акция ещё действует?',t:'14.09',unread:0}
];
const CHN={wa:{n:'WhatsApp',c:'#2f8f5b',i:'✆'},ig:{n:'Instagram',c:'#c0637f',i:'◉'},tg:{n:'Telegram',c:'#3b7a9e',i:'➤'}};

const CALLS=[
 {n:'Аружан К.',ph:'+7 707 ··· 41 08',dir:'in', t:'09:12',dur:'2:41',who:'Мадина',res:'записана на консультацию',rec:1},
 {n:'Неизвестный',ph:'+7 776 ··· 52 11',dir:'in',t:'09:03',dur:'0:18',who:'—',res:'пропущенный · робот отправил WhatsApp',rec:0},
 {n:'Мадина Т.',ph:'+7 747 ··· 19 63',dir:'out',t:'08:55',dur:'4:02',who:'Мадина',res:'перенесла на 16:00',rec:1},
 {n:'Айнур Д.',ph:'+7 701 ··· 90 06',dir:'out',t:'вчера',dur:'1:36',who:'Айгерим',res:'напомнили про этап 2',rec:1},
 {n:'Гульнар А.',ph:'+7 775 ··· 28 44',dir:'in',t:'вчера',dur:'6:12',who:'Санжар',res:'обсуждали липофилинг, думает',rec:1}
];

const STOCK=[
 {n:'Филлер гиалуроновый 1 мл',lot:'FL-2409',left:14,min:8, exp:'03.2027',price:38000,st:'ok'},
 {n:'Ботулотоксин 100 ед.',    lot:'BT-1181',left:3, min:4, exp:'11.2026',price:74000,st:'low'},
 {n:'Мезонить 2D 25 шт',       lot:'TH-0742',left:46,min:20,exp:'06.2027',price:15000,st:'ok'},
 {n:'Препарат биоревит. 2 мл', lot:'BR-3310',left:9, min:6, exp:'10.2026',price:22000,st:'exp'},
 {n:'Пробирки для плазмы',     lot:'PL-0090',left:38,min:15,exp:'08.2027',price:9000, st:'ok'},
 {n:'Пилинг срединный, набор', lot:'PE-2201',left:5, min:5, exp:'02.2027',price:12000,st:'low'}
];

const ROBOTS=[
 {n:'Подтверждение записи за 3 дня',c:'#3b7a9e',on:1,ch:'WhatsApp',w:'за 72 часа до визита',
  txt:'Здравствуйте, {имя}! Напоминаем: {дата} в {время} вы записаны к врачу {врач}. Подтвердите, пожалуйста: 1 — приду, 2 — перенести.',
  stat:'за месяц 186 отправок · 91% подтвердили'},
 {n:'Напоминание за сутки',c:'#cf8a22',on:1,ch:'WhatsApp',w:'за 24 часа до визита',
  txt:'{имя}, ждём вас завтра в {время}. Адрес: {адрес}. Если планы изменились — напишите, перенесём.',
  stat:'за месяц 174 отправки · неявки упали с 19% до 7%'},
 {n:'Пациент не пришёл',c:'#c33c32',on:1,ch:'Задача администратору',w:'через 30 минут после времени визита',
  txt:'Пациент {имя} не пришёл. Позвонить и предложить ближайшее окно. Сделка возвращается в воронку на стадию «Записан».',
  stat:'за месяц 14 случаев · 9 перезаписались'},
 {n:'Этап плана лечения подошёл',c:'#7a6595',on:1,ch:'WhatsApp + задача врачу',w:'за 5 дней до даты из плана',
  txt:'{имя}, по вашему плану лечения {дата} — {процедура}, этап {n} из {всего}. Записать вас?',
  stat:'это и есть «мультиворонка повторных» со встречи'},
 {n:'Запрос отзыва после визита',c:'#2f8f5b',on:1,ch:'WhatsApp',w:'через 2 дня после процедуры',
  txt:'{имя}, как ощущения? Если всё нравится — будем благодарны за отзыв в 2ГИС: {ссылка}. Если что-то беспокоит — напишите нам, а не в отзыв.',
  stat:'за месяц 96 отправок · 41 отзыв · средняя 4,9'},
 {n:'Пропущенный звонок',c:'#a8764a',on:1,ch:'WhatsApp',w:'через 2 минуты после пропущенного',
  txt:'Здравствуйте! Мы не успели ответить. Клиника {название}, чем можем помочь?',
  stat:'за месяц 38 пропущенных · 22 вернулись в диалог'},
 {n:'День рождения пациента',c:'#c0637f',on:0,ch:'WhatsApp',w:'в 10:00 в день рождения',
  txt:'{имя}, с днём рождения! Дарим уход за лицом в подарок — действует 30 дней.',
  stat:'выключен · включается одним тумблером'},
 {n:'Аванс без визита 7 дней',c:'#cf8a22',on:0,ch:'Задача администратору',w:'если аванс внесён, а запись не сделана',
  txt:'Пациент {имя} внёс аванс {сумма} и не записался. Позвонить.',
  stat:'выключен'}
];

const REVIEWS=[
 {n:'Сауле М.',st:5,t:'Айгерим — золотые руки. Нити встали ровно, отёк ушёл за три дня.',src:'2ГИС',ans:1},
 {n:'Дана Е.', st:5,t:'Приятно, что напоминают в WhatsApp. Никогда не забываю про визит.',src:'2ГИС',ans:1},
 {n:'Асель Б.',st:4,t:'Всё хорошо, но ждала 20 минут — врач задержался.',src:'Instagram',ans:1},
 {n:'Аноним',  st:3,t:'Дорого по сравнению с соседями.',src:'2ГИС',ans:0}
];

const PAYROLL=[
 {n:'Айгерим, врач-косметолог', base:350000,pct:25,rev:7420000,bonus:0,   done:64},
 {n:'Нурлан, врач-хирург',      base:450000,pct:30,rev:6180000,bonus:150000,done:21},
 {n:'Жанна, старшая медсестра', base:280000,pct:3, rev:13600000,bonus:0,  done:0},
 {n:'Мадина, администратор',    base:220000,pct:2, rev:18400000,bonus:60000,done:0}
];

const SC={};
/* ====== ПУЛЬТ ====== */
SC.dash=()=>{
 const money=role==='Администратор'||role==='Маркетолог';
 return `<div class="hd"><div><h2>Клиника за сентябрь</h2>
  <p>Один экран вместо двух вкладок. Слева — деньги и пациенты, справа — что происходит прямо сейчас. Всё, что вы видите, собирается автоматически: из записей, оплат, планов лечения и звонков — руками ничего не заносят.</p></div>
  <div class="btns"><button class="bt" onclick="go('day')">Сценарий дня</button><button class="bt p" onclick="go('plan')">План лечения</button></div></div>
 <div class="wid">
  <div><small>Выручка</small><b class="a">${mln(F.rev)} ₸</b><span>+18% к августу</span></div>
  <div><small>Пациентов</small><b>${F.pats}</b><span>из них первичных 68</span></div>
  <div><small>Средний чек</small><b class="g">${fmt(F.avg)} ₸</b><span>по плану лечения — 268 000 ₸</span></div>
  <div><small>Лиды → запись</small><b class="i">${F.conv}%</b><span>${F.leads} обращений</span></div>
  <div><small>Дошли до визита</small><b class="w">${F.show}%</b><span>было 63% без напоминаний</span></div>
 </div>
 <div class="g21">
  <div class="pan"><h3>Воронка первичных пациентов</h3>
   <p>Сколько людей на каждой стадии и сколько денег в этой стадии «висит». Нажмите на любую полосу — откроется список сделок.</p>
   ${FUNNELS.prim.st.map(([k,n,c])=>{const d=DEALS.filter(x=>x.f==='prim'&&x.s===k);
    const w=Math.max(6,d.length/7*100);
    return `<div class="fr"><span>${n}</span><div class="bar" onclick="go('funnel')" style="cursor:pointer"><i style="--w:${w}%;background:${c}"></i></div>
     <b>${d.length} · ${fmt(d.reduce((a,x)=>a+x.sum,0))} ₸</b></div>`}).join('')}
   <div class="flow" style="grid-template-columns:repeat(4,1fr);margin-top:14px">
    <div class="fbx"><code>ЛИД → ЗАПИСЬ</code><b>38%</b><p>340 обращений за месяц</p></div>
    <div class="fbx"><code>ЗАПИСЬ → ВИЗИТ</code><b>81%</b><p>роботы подтверждения и напоминания</p></div>
    <div class="fbx"><code>ВИЗИТ → ПЛАН</code><b>72%</b><p>врач выдал план лечения</p></div>
    <div class="fbx on"><code>ПЛАН → ОПЛАТА</code><b>57%</b><p>здесь теряются самые большие деньги</p></div>
   </div>
   <div class="said"><b>Вы сказали на встрече</b><i>«Мне нужна воронка, чтобы я мог смотреть: вот первичные, а вот те, кто по плану лечения должен прийти восьмого».</i> Это две разные воронки — они на экране «Воронки и сделки», переключаются одной кнопкой.</div>
  </div>
  <div>
   <div class="pan"><h3>Сейчас в клинике</h3>
    ${APPTS.slice(0,5).map(a=>`<div class="li ${a.st==='подтверждена'?'':'w'}"><i>${a.st==='подтверждена'?'✓':'!'}</i><span><b>${a.t} · ${esc(a.n)}</b><span class="sub">${esc(a.p)} · ${esc(ROOMS[a.r])} · ${a.st}</span></span></div>`).join('')}
    <button class="bt" style="margin-top:9px;width:100%" onclick="go('sched')">Открыть расписание</button>
   </div>
   <div class="pan"><h3>Требует вас</h3>
    <div class="li r"><i>!</i><span><b>Гульнар А. · липофилинг 420 000 ₸</b><span class="sub">план выдан 4 дня назад, решения нет — робот предложит позвонить</span></span></div>
    <div class="li w"><i>!</i><span><b>Ботулотоксин: 3 флакона</b><span class="sub">минимум 4 — на неделю хватит, дальше стоп</span></span></div>
    <div class="li w"><i>!</i><span><b>Две записи без подтверждения</b><span class="sub">робот отправит WhatsApp за 3 дня, если не подтвердят — позвонит администратор</span></span></div>
   </div>
  </div>
 </div>
 ${money?'':`<div class="g3">
  <div class="pan"><h3>Деньги за месяц</h3>
   <div class="kv"><span>Выручка</span><b>${fmt(F.rev)} ₸</b></div>
   <div class="kv"><span>Расходники (списано со склада)</span><b>4 120 000 ₸</b></div>
   <div class="kv"><span>Зарплаты и проценты врачам</span><b>5 340 000 ₸</b></div>
   <div class="kv"><span>Аренда, реклама, прочее</span><b>3 980 000 ₸</b></div>
   <div class="kv"><span>Прибыль</span><b style="color:var(--ok)">4 960 000 ₸</b></div>
  </div>
  <div class="pan"><h3>Планы лечения</h3>
   <div class="kv"><span>Выдано за месяц</span><b>${F.plans}</b></div>
   <div class="kv"><span>На сумму</span><b>${mln(F.planSum)} ₸</b></div>
   <div class="kv"><span>Оплачено полностью или частично</span><b>${F.planConv}%</b></div>
   <div class="kv"><span>Средний план</span><b>${fmt(F.planSum/F.plans)} ₸</b></div>
   <div class="note"><b>Почему это главная цифра</b><p>Пока план пишется от руки на А4, посчитать эту конверсию нельзя. Когда план собирается в системе — видно, какой врач и какая процедура продаются, а какие планы «зависают».</p></div>
  </div>
  <div class="pan"><h3>Что заменили</h3>
   <div class="li"><i>✓</i><span><b>Altegio</b><span class="sub">запись, расписание кабинетов, напоминания</span></span></div>
   <div class="li"><i>✓</i><span><b>amoCRM</b><span class="sub">воронки, сделки, задачи, интеграция WhatsApp</span></span></div>
   <div class="li"><i>✓</i><span><b>Бумажный план лечения</b><span class="sub">теперь калькулятор, бланк и отправка в WhatsApp</span></span></div>
   <div class="li n"><i>+</i><span><b>Появилось сверху</b><span class="sub">себестоимость процедуры, маржа, зарплаты, склад, ROMI по таргету</span></span></div>
   <button class="bt" style="margin-top:9px;width:100%" onclick="go('econ')">Посчитать экономию</button>
  </div>
 </div>`}`};

SC.day=()=>`<div class="hd"><div><h2>Сценарий дня: как система ведёт клинику от открытия до закрытия</h2>
 <p>Вы сказали: «нужны сценарии — начало рабочего дня, конец рабочего дня». Вот они. Утром система сама собирает день, вечером — сама закрывает и показывает, что не доделали.</p></div></div>
<div class="g2">
 <div class="pan"><h3>08:30 · Открытие</h3>
  <div class="tl">
   <div class="tli ok"><span class="who">автоматически</span><b>Собрала день</b><p>7 записей, 3 кабинета, 2 врача. Кто не подтвердил визит — подсвечено красным.</p></div>
   <div class="tli ok"><span class="who">робот</span><b>Отправила напоминания за сутки</b><p>Всем, кто записан на завтра. Ответы «перенесите» падают в диалоги администратора.</p></div>
   <div class="tli ok"><span class="who">склад</span><b>Проверила препараты под записи дня</b><p>На лазер и нити расходники есть. Ботулотоксина хватит на 3 приёма — заявка поставщику создана.</p></div>
   <div class="tli on"><span class="who">администратор</span><b>Разобрать ночные обращения</b><p>4 новых лида: 2 с таргета, 2 из Instagram. Каждый уже в воронке с тегом источника.</p></div>
  </div>
 </div>
 <div class="pan"><h3>19:30 · Закрытие</h3>
  <div class="tl">
   <div class="tli ok"><span class="who">касса</span><b>Сверила деньги</b><p>Наличные 340 000 ₸, Kaspi 1 180 000 ₸, карта 260 000 ₸. Расхождений нет.</p></div>
   <div class="tli ok"><span class="who">врачи</span><b>Закрыла приёмы</b><p>6 из 7 закрыты, препараты списаны, фото «до/после» приложены к двум визитам.</p></div>
   <div class="tli on"><span class="who">требует решения</span><b>Один приём не закрыт</b><p>Кабинет № 2, 14:00 — врач не отметил процедуру. Пока не закроет, процедура не попадёт ни в зарплату, ни в выручку.</p></div>
   <div class="tli"><span class="who">завтра в 09:00</span><b>Отчёт собственнику</b><p>Выручка дня, новые пациенты, планы лечения, что зависло. Приходит в WhatsApp одним сообщением.</p></div>
  </div>
  <div class="hint"><b>Смысл сценариев:</b> вам не нужно помнить, что проверить. Утром и вечером система сама показывает короткий список — и он всегда один и тот же.</div>
 </div>
</div>
<div class="pan"><h3>Задачи на сегодня</h3>
 <div class="li w"><i>1</i><span><b>Позвонить Гульнар А. — липофилинг 420 000 ₸</b><span class="sub">план выдан 12.09, решения нет · поставил робот «план без решения 3 дня»</span></span></div>
 <div class="li n"><i>2</i><span><b>Подтвердить две записи на 18.09</b><span class="sub">WhatsApp отправлен, ответа нет — нужен звонок</span></span></div>
 <div class="li b"><i>3</i><span><b>Принять поставку филлеров, партия FL-2411</b><span class="sub">после приёмки себестоимость пересчитается автоматически</span></span></div>
 <div class="li"><i>4</i><span><b>Ответить на отзыв 3 звезды в 2ГИС</b><span class="sub">черновик ответа система уже подготовила</span></span></div>
</div>`;

/* ====== ВОРОНКИ ====== */
SC.funnel=()=>{
 const F0=FUNNELS[funnel];
 const list=DEALS.filter(d=>d.f===funnel);
 return `<div class="hd"><div><h2>Воронки и сделки</h2>
  <p>Одна воронка не закрывает клинику: первичные, повторные по плану лечения и маркетинговые акции живут по разным правилам. Переключайте вкладки, перетаскивайте карточки мышкой — стадия и задачи меняются сразу.</p></div>
  <div class="btns"><button class="bt" onclick="addLead()">+ Лид</button><button class="bt p" onclick="simLead()">Пришёл лид с таргета</button></div></div>
 <div class="ptabs">
  ${Object.entries(FUNNELS).map(([k,v])=>`<button class="ptab ${k===funnel?'on':''}" onclick="setFunnel('${k}')">${esc(v.n)} · ${DEALS.filter(d=>d.f===k).length}</button>`).join('')}
  <button class="ptab add" onclick="addFunnel()">+ Создать воронку</button>
 </div>
 <div class="pipe">
  ${F0.st.map(([k,n,c])=>{const d=list.filter(x=>x.s===k);
   return `<div><div class="phead" style="background:${c}">${esc(n)}</div>
    <div class="pmeta"><span>${d.length} ${plural(d.length,['сделка','сделки','сделок'])}</span><b>${fmt(d.reduce((a,x)=>a+x.sum,0))} ₸</b></div>
    <div class="pbody" ondragover="colOver(event,this)" ondragleave="this.classList.remove('over')" ondrop="dropDeal(event,'${k}',this)">
     ${d.map(x=>`<div class="pc" draggable="true" ondragstart="dragDeal(event,'${x.id}')" ondragend="this.classList.remove('drag')" onclick="openDeal('${x.id}')">
      <b>${esc(x.n)} ${x.hot?'<span class="tag r">горячий</span>':''}</b>
      <span class="pn">${esc(x.proc)}</span>
      <span class="pp">${x.sum?fmt(x.sum)+' ₸':'—'}</span>
      <span class="prow"><span class="tag ${/[Тт]аргет/.test(x.src)?'w':'a'}">${esc(x.src)}</span></span>
      <span class="pn" style="margin-top:5px">${esc(x.d)}</span></div>`).join('')}
    </div></div>`}).join('')}
 </div>
 <div class="g2">
  <div class="pan"><h3>Что умеет воронка, чего не умеет связка Altegio + amo</h3>
   <div class="li"><i>✓</i><span><b>Сделка знает про запись</b><span class="sub">карточка сама переезжает в «Записан», когда администратор поставил время в расписании. Дважды вносить не нужно</span></span></div>
   <div class="li"><i>✓</i><span><b>Сделка знает про план лечения</b><span class="sub">сумма в карточке — это сумма плана, а не то, что менеджер вписал от руки</span></span></div>
   <div class="li"><i>✓</i><span><b>Сделка знает про оплату</b><span class="sub">внесли аванс в кассе — стадия и остаток меняются сами</span></span></div>
   <div class="li"><i>✓</i><span><b>Новая воронка — кнопкой</b><span class="sub">запустили акцию — создали воронку, задали стадии, подключили рассылку. Без программиста и без оплаты за каждое поле</span></span></div>
  </div>
  <div class="pan"><h3>Правила стадий (настраиваются вами)</h3>
   <div class="kv"><span>Лид без ответа 15 минут</span><b>задача администратору</b></div>
   <div class="kv"><span>Стадия «Записан» без подтверждения 3 дня</span><b>WhatsApp + звонок</b></div>
   <div class="kv"><span>Стадия «План выдан» дольше 3 дней</span><b>задача директору</b></div>
   <div class="kv"><span>Оплата принята</span><b>стадия закрывается автоматически</b></div>
   <div class="kv"><span>Процедура сделана</span><b>сделка уходит в воронку повторных</b></div>
   <div class="hint">Правила — это и есть то, что вы назвали «тысяча мелочей». Мы их закладываем в первый месяц полировки, и дальше вы меняете их сами в настройках.</div>
  </div>
 </div>`};

SC.leads=()=>{
 const tot=LEADSRC.reduce((a,x)=>({c:a.c+x.c,cost:a.cost+x.cost,rec:a.rec+x.rec,pay:a.pay+x.pay,rev:a.rev+x.rev}),{c:0,cost:0,rec:0,pay:0,rev:0});
 return `<div class="hd"><div><h2>Лиды и источники</h2>
  <p>Вы сказали: «есть лиды с таргета, за которые я плачу, и есть органика — их нужно отделять». Здесь источник проставляется сам: из лид-формы, из перехода по рекламной ссылке, из Direct, из 2ГИС. Никто не выбирает источник руками — значит, никто его не путает.</p></div>
  <div class="btns"><button class="bt p" onclick="simLead()">Смоделировать лид с таргета</button></div></div>
 <div class="wid">
  <div><small>Обращений за месяц</small><b>${tot.c}</b><span>из них таргет ${LEADSRC.filter(x=>x.tag==='таргет').reduce((a,x)=>a+x.c,0)}</span></div>
  <div><small>Расходы на рекламу</small><b class="w">${fmt(tot.cost)} ₸</b><span>по данным кабинета</span></div>
  <div><small>Цена обращения</small><b class="i">${fmt(tot.cost/LEADSRC.filter(x=>x.tag==='таргет').reduce((a,x)=>a+x.c,0))} ₸</b><span>только платный трафик</span></div>
  <div><small>Дошли до оплаты</small><b class="g">${tot.pay}</b><span>${pct(tot.pay,tot.c)} от всех обращений</span></div>
  <div><small>Выручка с этих лидов</small><b class="a">${mln(tot.rev)} ₸</b><span>окупаемость рекламы ×${num(tot.rev/tot.cost)}</span></div>
 </div>
 <div class="tw"><table class="t">
  <thead><tr><th>Источник</th><th>Тип</th><th class="r">Обращений</th><th class="r">Затраты</th><th class="r">Цена лида</th><th class="r">Записались</th><th class="r">Оплатили</th><th class="r">Выручка</th><th class="r">Окупаемость</th></tr></thead>
  <tbody>${LEADSRC.map(s=>`<tr onclick="openSrc('${esc(s.n)}')">
   <td><b>${esc(s.n)}</b></td>
   <td><span class="tag ${s.tag==='таргет'?'w':'g'}">${s.tag}</span></td>
   <td class="r">${s.c}</td><td class="r">${s.cost?fmt(s.cost)+' ₸':'—'}</td>
   <td class="r">${s.cost?fmt(s.cost/s.c)+' ₸':'0 ₸'}</td>
   <td class="r">${s.rec}</td><td class="r"><b>${s.pay}</b></td>
   <td class="r">${fmt(s.rev)} ₸</td>
   <td class="r">${s.cost?'<b style="color:var(--ok)">×'+num(s.rev/s.cost)+'</b>':'—'}</td></tr>`).join('')}
   <tr class="total"><td>Итого</td><td></td><td class="r">${tot.c}</td><td class="r">${fmt(tot.cost)} ₸</td><td class="r"></td><td class="r">${tot.rec}</td><td class="r">${tot.pay}</td><td class="r">${fmt(tot.rev)} ₸</td><td class="r">×${num(tot.rev/tot.cost)}</td></tr>
  </tbody></table></div>
 <div class="g2" style="margin-top:12px">
  <div class="pan"><h3>Как лид попадает в систему</h3>
   <div class="flow" style="grid-template-columns:repeat(4,1fr)">
    <div class="fbx on"><code>1 · ФОРМА</code><b>Лид-форма</b><p>Instagram/Facebook. В форме есть поле «какая процедура интересует» — оно приезжает в карточку</p></div>
    <div class="fbx"><code>2 · ТЕГ</code><b>Источник и процедура</b><p>Проставляются автоматически: таргет / органика, кампания, объявление</p></div>
    <div class="fbx"><code>3 · ВОРОНКА</code><b>Новый лид</b><p>Карточка в воронке, задача администратору, таймер ответа 15 минут</p></div>
    <div class="fbx"><code>4 · ДИАЛОГ</code><b>WhatsApp сам</b><p>Робот пишет первым: «Здравствуйте, вы оставили заявку на {процедура}»</p></div>
   </div>
   <div class="said"><b>Вы сказали на встрече</b><i>«Если это таргет, то там прям пишется, какая процедура»</i> — поэтому процедура из лид-формы становится тегом сделки и попадает в отчёт: какая реклама приносит нити, а какая — только чистки.</div>
  </div>
  <div class="pan"><h3>Почему не через WhatsApp напрямую</h3>
   <p>На встрече прозвучало, что часть лидов сейчас приходит перепиской. Мы советуем лид-форму: ответ приходит в систему целиком и сразу в воронку, а переписка остаётся для общения.</p>
   <div class="kv"><span>Лид-форма → воронка</span><b>0 секунд, 100% данных</b></div>
   <div class="kv"><span>Переход в WhatsApp</span><b>зависит от того, напишет ли человек</b></div>
   <div class="kv"><span>Комментарий под постом</span><b>ловим тоже, но вручную</b></div>
   <div class="note" style="--tone:var(--ok)"><b>Мы так работаем сами</b><p>Свои заявки ведём через форму-опросник: человек сразу попадает в воронку, а не «сидит в переписке». Вам советуем то же самое.</p></div>
  </div>
 </div>`};

/* ====== ДИАЛОГИ ====== */
let chatCur='C1';
SC.chats=()=>{
 const c=CHATS.find(x=>x.id===chatCur)||CHATS[0];
 return `<div class="hd"><div><h2>Диалоги: WhatsApp, Instagram и Telegram в одном окне</h2>
  <p>Переписка не живёт отдельно от сделки. Каждый диалог привязан к пациенту и к карточке в воронке: видно, что человеку обещали, какой план лечения выдан и сколько он уже заплатил.</p></div>
  <div class="btns"><button class="bt" onclick="go('integr')">Как подключается</button></div></div>
 <div class="g12">
  <div class="pan"><h3>Входящие · ${CHATS.reduce((a,x)=>a+x.unread,0)} непрочитанных</h3>
   ${CHATS.map(x=>`<div class="dlg ${x.id===chatCur?'on':''}" onclick="openChat('${x.id}')">
    <div class="ch" style="background:${CHN[x.ch].c}">${CHN[x.ch].i}</div>
    <div style="flex:1;min-width:0"><b>${esc(x.n)}</b><p>${esc(x.last)}</p></div>
    <div style="text-align:right"><span class="sub">${x.t}</span>${x.unread?`<span class="tag r" style="margin-top:3px;display:inline-block">${x.unread}</span>`:''}</div></div>`).join('')}
   <div class="hint">WhatsApp подключается через Green API — 5 000 ₸ в месяц за номер, платите напрямую сервису. В amoCRM та же интеграция стоит 36 000 ₸ в месяц.</div>
  </div>
  <div>
   <div class="pan"><h3>${esc(c.n)} · ${CHN[c.ch].n}</h3>
    <p>${esc(c.n)} · карточка сделки открыта справа от переписки — администратор видит историю, а не «кто это вообще».</p>
    <div class="chat">
     <div class="msg sys">Лид с таргета · процедура из формы: нитевая подтяжка · кампания «Осень · 45+»</div>
     <div class="msg in">${esc(c.last)}<small>${c.t}</small></div>
     <div class="msg out">Здравствуйте! Нити от 38 000 ₸ за штуку, обычно нужно от 4 до 8 — точную схему врач подберёт на консультации. Консультация 10 000 ₸ и полностью засчитывается в план лечения.<small>09:15 · Мадина</small></div>
     <div class="msg in">А когда можно прийти?<small>09:16</small></div>
     <div class="msg out">Завтра в 11:00 или в четверг в 14:30. Какое удобнее?<small>09:16 · Мадина</small></div>
     <div class="msg sys">Администратор нажал «Записать» прямо из диалога → сделка перешла в стадию «Записан на консультацию», в расписании занят кабинет № 1</div>
     <div class="msg out">Записали вас на 17 сентября, 11:00, врач Айгерим. За сутки пришлём напоминание.<small>09:18 · робот</small></div>
    </div>
    <div class="btns" style="margin-top:12px;justify-content:flex-start">
     <button class="bt p" onclick="toast('Из диалога открывается расписание — время выбирается в два клика, и сделка сама переходит на следующую стадию.')">Записать</button>
     <button class="bt" onclick="go('plan')">Собрать план лечения</button>
     <button class="bt" onclick="toast('Шаблоны ответов: цены, адрес, подготовка к процедуре, реабилитация. Администратор не печатает одно и то же по сто раз.')">Шаблон ответа</button>
     <button class="bt" onclick="toast('Вся переписка хранится в карточке пациента — даже если администратор уволится, история останется в клинике, а не в его телефоне.')">История</button>
    </div>
   </div>
   <div class="pan"><h3>Почему это важнее, чем кажется</h3>
    <div class="li"><i>✓</i><span><b>Переписка остаётся клинике</b><span class="sub">сейчас она в личном телефоне администратора — вместе с базой пациентов</span></span></div>
    <div class="li"><i>✓</i><span><b>Видно время ответа</b><span class="sub">сколько минут человек ждал; по таргету это прямо влияет на конверсию</span></span></div>
    <div class="li"><i>✓</i><span><b>Из диалога — запись и план</b><span class="sub">не нужно переключаться между Altegio и amo и вносить одно и то же дважды</span></span></div>
   </div>
  </div>
 </div>`};

/* ====== ТЕЛЕФОНИЯ ====== */
SC.calls=()=>`<div class="hd"><div><h2>Телефония: ваш SIP-номер внутри портала</h2>
 <p>Вы сегодня получаете SIP-номер у оператора. Дальше вы даёте нам доступ в кабинет Sipuni (или Binotel) — мы подключаем его к порталу. Звонки идут из браузера, записи и история хранятся у оператора, а в портале видно, кто звонил, кому и чем закончилось.</p></div>
 <div class="btns"><button class="bt p" onclick="incomingCall()">Входящий звонок</button></div></div>
<div class="wid">
 <div><small>Звонков за месяц</small><b>612</b><span>входящих 418 · исходящих 194</span></div>
 <div><small>Пропущенных</small><b class="r">38</b><span>робот написал в WhatsApp по каждому</span></div>
 <div><small>Вернулись в диалог</small><b class="g">22</b><span>из 38 пропущенных</span></div>
 <div><small>Среднее время ответа</small><b class="i">11 сек</b><span>до 3 гудков</span></div>
 <div><small>Записей разговоров</small><b>574</b><span>хранятся в кабинете оператора</span></div>
</div>
<div class="g21">
 <div class="pan"><h3>Журнал звонков</h3>
  <p>Номер определяется по базе пациентов: до того, как администратор снял трубку, он видит, кто звонит, какой план лечения и когда был последний визит.</p>
  <div id="calllog">${CALLS.map((c,i)=>`<div class="callbar">
   <span class="av ${c.dir==='in'?'g':'a'}">${c.dir==='in'?'↙':'↗'}</span>
   <div style="flex:1"><b>${esc(c.n)}</b><span class="sub">${esc(c.ph)} · ${c.t} · ${c.dur} · ${esc(c.who)}</span></div>
   <span class="tag ${/пропущ/.test(c.res)?'r':'g'}">${esc(c.res)}</span>
   ${c.rec?`<button class="bt" onclick="playRec(${i})">▶ Запись</button>`:''}</div>`).join('')}</div>
  <div class="hint"><b>Звонилка из браузера.</b> Нажали «Позвонить» в карточке пациента — звонок пошёл с вашего рабочего номера. Ни телефона в руках, ни ручного набора, ни «а какой у неё номер».</div>
 </div>
 <div>
  <div class="pan"><h3>Что подключаем мы, а что оператор</h3>
   <div class="kv"><span>SIP-номер и АТС</span><b>оператор (Altel / Tele2)</b></div>
   <div class="kv"><span>Кабинет телефонии</span><b>Sipuni или Binotel</b></div>
   <div class="kv"><span>Хранение записей</span><b>кабинет телефонии</b></div>
   <div class="kv"><span>Связка с порталом</span><b>мы, входит в пакет</b></div>
   <div class="kv"><span>Определение пациента</span><b>мы</b></div>
   <div class="kv"><span>Робот на пропущенный</span><b>мы</b></div>
   <div class="note"><b>Что нужно от вас</b><p>Логин и пароль от кабинета Sipuni после того, как оператор пришлёт доступы. Всё остальное — наша часть работы.</p></div>
  </div>
  <div class="pan"><h3>Sipuni или Binotel</h3>
   <div class="li"><i>+</i><span><b>Sipuni дешевле</b><span class="sub">функционал урезан, но для клиники с одним номером хватает</span></span></div>
   <div class="li n"><i>+</i><span><b>Binotel навороченнее</b><span class="sub">сложные сценарии переадресации, если появится вторая клиника</span></span></div>
   <div class="li b"><i>=</i><span><b>Портал работает с обеими</b><span class="sub">выбор за вами, переключение не требует переделки системы</span></span></div>
  </div>
 </div>
</div>`;
/* ====== РАСПИСАНИЕ ====== */
SC.sched=()=>{
 const cell=(ri,t)=>{const a=APPTS.filter(x=>x.r===ri&&x.t===t);
  return `<div class="slot" ondragover="slotOver(event,this)" ondragleave="this.classList.remove('over')" ondrop="dropAppt(event,${ri},'${t}',this)">
   ${a.map(x=>`<div class="appt" draggable="true" ondragstart="dragAppt(event,'${x.id}')" ondragend="this.classList.remove('drag')" style="background:${x.c}" onclick="openAppt('${x.id}')">
    <b>${esc(x.n)}</b><small>${esc(x.p)}${x.st==='подтверждена'?'':' · ждёт'}</small></div>`).join('')}</div>`};
 return `<div class="hd"><div><h2>Расписание кабинетов · среда, 17 сентября</h2>
  <p>То, ради чего держали Altegio. Три кабинета, два врача, перенос записи мышкой. При переносе пациенту автоматически уходит сообщение с новым временем — вручную никто ничего не пишет.</p></div>
  <div class="btns"><button class="bt" onclick="toast('В полной версии — день, неделя, месяц, по врачам и по кабинетам, с блокировкой отпусков и перерывов.')">Неделя</button><button class="bt p" onclick="go('online')">Онлайн-запись</button></div></div>
 <div class="wid">
  <div><small>Записей на день</small><b>${APPTS.length}</b><span>занято 9 из 30 часов</span></div>
  <div><small>Загрузка кабинетов</small><b class="i">62%</b><span>кабинет № 2 свободен после 16:00</span></div>
  <div><small>Не подтвердили</small><b class="w">${APPTS.filter(a=>a.st!=='подтверждена').length}</b><span>робот напомнит за сутки</span></div>
  <div><small>Неявки за месяц</small><b class="g">7%</b><span>было 19% до напоминаний</span></div>
  <div><small>Сумма записей дня</small><b class="a">742 000 ₸</b><span>по планам лечения</span></div>
 </div>
 <div class="pan"><h3>Перетащите запись в другое время или кабинет</h3>
  <div class="schw"><div class="sch" style="--c:${ROOMS.length}">
   <div class="hcell"></div>${ROOMS.map(r=>`<div class="hcell">${esc(r)}</div>`).join('')}
   ${HOURS.map(t=>`<div class="tcell">${t}</div>${ROOMS.map((r,ri)=>cell(ri,t)).join('')}`).join('')}
  </div></div>
  <div class="said"><b>Вы сказали на встрече</b><i>«Из Altegio мне нужны записи и напоминалка: подтверждение за три дня и напоминание за сутки»</i> — расписание и роботы стоят рядом и работают от одной записи. Отдельная система для этого не нужна.</div>
 </div>
 <div class="g3">
  <div class="pan"><h3>Правила записи</h3>
   <div class="kv"><span>Длительность процедуры</span><b>из карточки процедуры</b></div>
   <div class="kv"><span>Кабинет под аппарат</span><b>лазер только в кабинете № 2</b></div>
   <div class="kv"><span>Уборка между приёмами</span><b>15 минут, закладываются сами</b></div>
   <div class="kv"><span>Двойная запись</span><b>система не даст</b></div>
   <div class="kv"><span>Перенос</span><b>уведомление пациенту сразу</b></div>
  </div>
  <div class="pan"><h3>Если пациент не пришёл</h3>
   <div class="li r"><i>1</i><span><b>Через 30 минут — задача администратору</b><span class="sub">позвонить и предложить окно</span></span></div>
   <div class="li w"><i>2</i><span><b>Сделка возвращается в воронку</b><span class="sub">не теряется, как в бумажном журнале</span></span></div>
   <div class="li n"><i>3</i><span><b>Счётчик неявок в карточке</b><span class="sub">третья подряд — предоплата за запись</span></span></div>
  </div>
  <div class="pan"><h3>Для врача</h3>
   <p>Врач видит только свой кабинет и своих пациентов, с планом лечения и историей. Ему не нужно листать общее расписание клиники.</p>
   <div class="kv"><span>Его приёмы на сегодня</span><b>4</b></div>
   <div class="kv"><span>Из них этап курса</span><b>2</b></div>
   <div class="kv"><span>Сумма к выработке</span><b>386 000 ₸</b></div>
   <button class="bt" style="margin-top:9px;width:100%" onclick="switchRole('Врач-косметолог')">Посмотреть глазами врача</button>
  </div>
 </div>`};

let slotSel='';
SC.online=()=>`<div class="hd"><div><h2>Онлайн-запись — как в Bitrix, только ваша</h2>
 <p>Ссылка ставится в шапку Instagram, в 2ГИС и на сайт. Пациент выбирает процедуру, врача и время сам, запись сразу занимает кабинет в расписании и создаёт сделку в воронке. Комиссии за запись нет — это ваша страница, а не чужой сервис.</p></div></div>
<div class="g21">
 <div class="pan"><h3>Что видит пациент</h3>
  <div style="display:flex;gap:22px;flex-wrap:wrap;align-items:flex-start">
   <div class="phone">
    <div class="pht"><b>Estetica Clinic</b><small>онлайн-запись · Астана</small></div>
    <div class="pb">
     <div class="pi"><span>Процедура</span><b>Нитевая подтяжка</b></div>
     <div class="pi"><span>Врач</span><b>Айгерим</b></div>
     <div class="pi"><span>Длительность</span><b>1 ч 30 мин</b></div>
     <div class="pi"><span>Стоимость</span><b>от 38 000 ₸/нить</b></div>
     <div style="margin-top:10px;font-size:10.6px;color:var(--muted)">Свободное время, 17 сентября</div>
     <div class="sgrid">${['09:00','11:00','12:30','14:00','16:00','17:30'].map(t=>`<div class="slotb ${slotSel===t?'on':''}" onclick="pickSlot('${t}')">${t}</div>`).join('')}</div>
     <div class="pbtn" onclick="bookSlot()">Записаться</div>
     <div style="margin-top:9px;font-size:9.6px;color:var(--muted);line-height:1.5">Нажимая «Записаться», вы соглашаетесь с обработкой персональных данных. Подтверждение придёт в WhatsApp.</div>
    </div>
   </div>
   <div style="flex:1;min-width:240px">
    <div class="li"><i>1</i><span><b>Выбор процедуры</b><span class="sub">список берётся из вашего прайса, с длительностью и подготовкой</span></span></div>
    <div class="li"><i>2</i><span><b>Свободное время</b><span class="sub">только реальные окна: кабинет свободен, врач на месте, аппарат не занят</span></span></div>
    <div class="li"><i>3</i><span><b>Подтверждение в WhatsApp</b><span class="sub">сразу после записи, с адресом и правилами подготовки</span></span></div>
    <div class="li"><i>4</i><span><b>Сделка в воронке</b><span class="sub">источник «онлайн-запись», процедура — тегом</span></span></div>
    <div class="li n"><i>+</i><span><b>Депозит по желанию</b><span class="sub">для дорогих процедур можно включить предоплату через Kaspi — тогда неявок почти не бывает</span></span></div>
   </div>
  </div>
 </div>
 <div class="pan"><h3>Где размещается</h3>
  <div class="kv"><span>Instagram · шапка профиля</span><b>ссылка</b></div>
  <div class="kv"><span>2ГИС · кнопка «Записаться»</span><b>ссылка</b></div>
  <div class="kv"><span>Сайт клиники</span><b>виджет-кнопка</b></div>
  <div class="kv"><span>WhatsApp · автоответ</span><b>ссылка в первом сообщении</b></div>
  <div class="note"><b>Важное отличие</b><p>Запись живёт в вашей базе. Если завтра вы уйдёте от любого сервиса — пациенты, история и расписание останутся у вас, а не «в личном кабинете подрядчика».</p></div>
  <div class="hint">Онлайн-запись входит в первый релиз. Оплата предоплаты картой — опция второго этапа, подключается после запуска Kaspi-эквайринга.</div>
 </div>
</div>`;

/* ====== ПАЦИЕНТЫ ====== */
SC.clients=()=>`<div class="hd"><div><h2>Картотека пациентов</h2>
 <p>Одна база вместо двух: в Altegio были записи, в amo — сделки, и это разные списки людей. Здесь пациент один, и у него сразу видно: сколько визитов, на какую сумму, какой план лечения и когда следующий этап.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Поиск по имени, телефону, процедуре, врачу, тегу и даже по фразе из переписки.')">Фильтры</button><button class="bt p" onclick="go('card')">Открыть карту</button></div></div>
<div class="wid">
 <div><small>Пациентов в базе</small><b>1 248</b><span>перенесём из Altegio и amo</span></div>
 <div><small>Активных за 12 мес.</small><b class="a">614</b><span>были хотя бы раз</span></div>
 <div><small>Повторных</small><b class="g">${F.rep}%</b><span>доля визитов не первых</span></div>
 <div><small>С открытым планом</small><b class="w">47</b><span>кто-то ждёт этап, кто-то думает</span></div>
 <div><small>Средний LTV</small><b class="i">312 000 ₸</b><span>за всё время</span></div>
</div>
<div class="tw"><table class="t">
 <thead><tr><th>Пациент</th><th>Телефон</th><th class="r">Визитов</th><th class="r">Оплачено всего</th><th>План лечения</th><th>Следующий визит</th><th>Врач</th><th>Метки</th></tr></thead>
 <tbody>${PATIENTS.map(p=>`<tr onclick="go('card')">
  <td><span class="av ${p.visits>5?'p':'a'}">${esc(p.n.split(' ').map(x=>x[0]).join(''))}</span> <b>${esc(p.n)}</b><span class="sub">${p.age} лет · с ${p.first}</span></td>
  <td>${esc(p.ph)}</td><td class="r">${p.visits}</td><td class="r">${fmt(p.sum)} ₸</td>
  <td>${esc(p.plan)}</td><td>${esc(p.next)}</td><td>${esc(p.doc)}</td>
  <td>${p.tags.map(t=>`<span class="tag ${t==='VIP'?'w':'a'}">${esc(t)}</span>`).join(' ')}</td></tr>`).join('')}
 </tbody></table></div>
<div class="g2" style="margin-top:12px">
 <div class="pan"><h3>Что хранится в карточке</h3>
  <div class="li"><i>✓</i><span><b>Медицинская часть</b><span class="sub">аллергии, противопоказания, перенесённые процедуры, препараты и партии, которыми работали</span></span></div>
  <div class="li"><i>✓</i><span><b>Коммерческая часть</b><span class="sub">планы лечения, оплаты, авансы, остаток, скидки и кто их дал</span></span></div>
  <div class="li"><i>✓</i><span><b>Общение</b><span class="sub">переписка, звонки, записи разговоров, напоминания</span></span></div>
  <div class="li"><i>✓</i><span><b>Фото до и после</b><span class="sub">с датой, врачом и согласием на использование</span></span></div>
 </div>
 <div class="pan"><h3>Кто что видит</h3>
  <div class="kv"><span>Врач</span><b>медицина + план, без себестоимости</b></div>
  <div class="kv"><span>Администратор</span><b>контакты, запись, оплаты</b></div>
  <div class="kv"><span>Бухгалтер</span><b>только деньги</b></div>
  <div class="kv"><span>Директор и собственник</span><b>всё</b></div>
  <div class="note" style="--tone:var(--bad)"><b>Медицинские данные</b><p>Доступ к медицинской части — по ролям, с журналом: кто открыл карту, когда и что изменил. Выгрузка базы целиком — только директору.</p></div>
 </div>
</div>`;

SC.card=()=>{const p=PATIENTS[0];
 return `<div class="hd"><div><h2>Карта пациента · ${esc(p.n)}</h2>
  <p>Всё об одном человеке на одном экране: визиты, план лечения, деньги, переписка, фото. Врачу не нужно спрашивать «а что мы делали в прошлый раз» — он видит.</p></div>
  <div class="btns"><button class="bt" onclick="toast('Звонок идёт из браузера через ваш SIP-номер. Разговор запишется и приложится к карте.')">☎ Позвонить</button><button class="bt" onclick="go('chats')">Написать</button><button class="bt p" onclick="go('plan')">План лечения</button></div></div>
 <div class="wid">
  <div><small>Визитов</small><b>${p.visits}</b><span>с ${p.first}</span></div>
  <div><small>Оплачено всего</small><b class="a">${fmt(p.sum)} ₸</b><span>средний чек 204 000 ₸</span></div>
  <div><small>Текущий план</small><b class="w">361 000 ₸</b><span>оплачено 190 000 ₸</span></div>
  <div><small>Остаток</small><b class="r">171 000 ₸</b><span>этап 2 из 3</span></div>
  <div><small>Следующий визит</small><b class="g">22.09</b><span>11:00 · Айгерим</span></div>
 </div>
 <div class="g21">
  <div class="pan"><h3>История визитов</h3>
   <div class="tl">
    <div class="tli on"><span class="who">22 сентября · запланировано</span><b>Филлер 1 мл · скулы</b><p>Этап 2 по плану лечения. Препарат забронирован на складе: партия FL-2409.</p></div>
    <div class="tli ok"><span class="who">14 сентября · Айгерим</span><b>Нити 6 шт · средняя треть лица</b><p>Списано: мезонить 2D — 6 шт, партия TH-0742. Фото до и после приложены. Оплачено 190 000 ₸ (Kaspi).</p></div>
    <div class="tli ok"><span class="who">12 сентября · Айгерим</span><b>Консультация и план лечения</b><p>План на 361 000 ₸ из трёх этапов. Отправлен в WhatsApp, пациент открыл через 4 минуты.</p></div>
    <div class="tli ok"><span class="who">03 июня · Нурлан</span><b>Биоревитализация №4</b><p>Курс закрыт. Через 6 месяцев — рекомендован повтор, робот напомнит 03 декабря.</p></div>
    <div class="tli ok"><span class="who">12 марта 2025 · первый визит</span><b>Чистка лица</b><p>Пришла с рекламы в Instagram, кампания «Уход · весна». С тех пор — 9 визитов на 1 840 000 ₸.</p></div>
   </div>
  </div>
  <div>
   <div class="pan"><h3>Медицинская часть</h3>
    <div class="kv"><span>Аллергии</span><b style="color:var(--bad)">лидокаин</b></div>
    <div class="kv"><span>Противопоказания</span><b>нет</b></div>
    <div class="kv"><span>Согласия подписаны</span><b>3 из 3</b></div>
    <div class="kv"><span>Фото до/после</span><b>6 пар</b></div>
    <div class="note" style="--tone:var(--bad)"><b>Аллергия видна везде</b><p>Метка выводится в расписании, в плане лечения и в списании препаратов. Врач физически не сможет её не заметить.</p></div>
   </div>
   <div class="pan"><h3>Деньги</h3>
    <div class="kv"><span>Оплачено по текущему плану</span><b>190 000 ₸</b></div>
    <div class="kv"><span>Остаток</span><b>171 000 ₸</b></div>
    <div class="kv"><span>Скидка</span><b>5% · дала Айгерим</b></div>
    <div class="kv"><span>Способ оплаты</span><b>Kaspi перевод</b></div>
    <div class="kv"><span>Чек</span><b>отправлен в WhatsApp</b></div>
   </div>
  </div>
 </div>`};

SC.photo=()=>`<div class="hd"><div><h2>Фото до и после</h2>
 <p>Для эстетической медицины это одновременно медицинский документ и главный маркетинговый материал. Фото привязаны к визиту и к процедуре, а согласие на публикацию — отдельная галочка, и без неё фото не уйдёт в рекламу.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Снимок делается на телефон и попадает в карту сразу — врач открывает камеру прямо в портале.')">Снять с телефона</button></div></div>
<div class="pan"><h3>Сауле М. · нитевая подтяжка · 14 сентября</h3>
 <div class="ph">
  <div class="phi"><div class="im"><u>ДО</u><i>◑</i></div><div class="cp"><b>Фас · до процедуры</b>14.09, 10:12 · Айгерим</div></div>
  <div class="phi"><div class="im"><u>ДО</u><i>◐</i></div><div class="cp"><b>Профиль · до процедуры</b>14.09, 10:13 · Айгерим</div></div>
  <div class="phi"><div class="im"><u>ПОСЛЕ</u><i>◑</i></div><div class="cp"><b>Фас · 14-й день</b>28.09 · контроль</div></div>
  <div class="phi"><div class="im"><u>ПОСЛЕ</u><i>◐</i></div><div class="cp"><b>Профиль · 14-й день</b>28.09 · контроль</div></div>
 </div>
 <div class="g3" style="margin-top:12px">
  <div class="pan" style="margin:0"><h3>Согласие на публикацию</h3>
   <div class="kv"><span>Использование в соцсетях</span><b style="color:var(--ok)">разрешено</b></div>
   <div class="kv"><span>Без лица (фрагмент)</span><b>разрешено</b></div>
   <div class="kv"><span>С лицом</span><b style="color:var(--bad)">запрещено</b></div>
   <div class="hint">Маркетолог в своём разделе видит только те фото, на которые есть согласие. Ошибиться нельзя технически.</div>
  </div>
  <div class="pan" style="margin:0"><h3>Контроль результата</h3>
   <div class="li"><i>✓</i><span><b>Робот напоминает о фото</b><span class="sub">через 14 дней после процедуры — задача врачу и сообщение пациенту</span></span></div>
   <div class="li"><i>✓</i><span><b>Пары «до/после» собираются сами</b><span class="sub">по одному ракурсу и одному освещению</span></span></div>
   <div class="li n"><i>+</i><span><b>Готовый материал для Instagram</b><span class="sub">выгрузка коллажа в один клик</span></span></div>
  </div>
  <div class="pan" style="margin:0"><h3>Зачем это деньгам</h3>
   <p>Пациенты с фотоконтролем возвращаются чаще: видно результат, и разговор о следующем этапе идёт сам собой.</p>
   <div class="kv"><span>Повторный визит с фото</span><b>61%</b></div>
   <div class="kv"><span>Повторный визит без фото</span><b>38%</b></div>
  </div>
 </div>
</div>`;

SC.docs=()=>`<div class="hd"><div><h2>Согласия и договоры</h2>
 <p>Медицинская клиника не может работать без подписанных согласий. Здесь они формируются из карточки пациента: подставляются ФИО, процедура, дата — и печатаются или подписываются по ссылке с телефона.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Шаблоны согласий и договора готовите вы или ваш юрист — мы подставляем данные и храним подписанное.')">Шаблоны</button></div></div>
<div class="g21">
 <div class="pan"><h3>Документы пациента · Сауле М.</h3>
  <div class="tw"><table class="t">
   <thead><tr><th>Документ</th><th>Процедура</th><th>Дата</th><th>Как подписан</th><th>Статус</th></tr></thead>
   <tbody>
    <tr><td><b>Информированное согласие</b></td><td>Нитевая подтяжка</td><td>14.09.2026</td><td>планшет на ресепшн</td><td><span class="tag g">подписано</span></td></tr>
    <tr><td><b>Согласие на обработку данных</b></td><td>—</td><td>12.03.2025</td><td>бумага, скан в карте</td><td><span class="tag g">подписано</span></td></tr>
    <tr><td><b>Согласие на фото</b></td><td>Нитевая подтяжка</td><td>14.09.2026</td><td>ссылка в WhatsApp</td><td><span class="tag g">подписано</span></td></tr>
    <tr><td><b>Договор на услуги</b></td><td>План лечения 361 000 ₸</td><td>12.09.2026</td><td>ссылка · ЭЦП</td><td><span class="tag w">ждёт подписи</span></td></tr>
    <tr><td><b>Согласие на анестезию</b></td><td>Филлер · этап 2</td><td>22.09.2026</td><td>—</td><td><span class="tag">создастся к визиту</span></td></tr>
   </tbody></table></div>
  <div class="said"><b>Вы сказали на встрече</b><i>«В WhatsApp присылаете: подпиши договор — они нажимают, подписывают, и всё, договор заключён»</i> — это отдельный модуль подписания по ссылке. В стандартный пакет разработки он не входит, подключается опцией.</div>
 </div>
 <div>
  <div class="pan"><h3>Три способа подписать</h3>
   <div class="li"><i>1</i><span><b>Печать на ресепшн</b><span class="sub">формируется из карты, подписывается ручкой, скан возвращается в карту</span></span></div>
   <div class="li n"><i>2</i><span><b>Планшет в клинике</b><span class="sub">пациент расписывается пальцем, документ сразу в карте — входит в пакет</span></span></div>
   <div class="li b"><i>3</i><span><b>Ссылка в WhatsApp · ЭЦП</b><span class="sub">одна ссылка на документ: видно, кто уже подписал, и тут же подписывают — опция</span></span></div>
  </div>
  <div class="pan"><h3>Что это даёт клинике</h3>
   <div class="kv"><span>Согласие не забыли</span><b>система не даст закрыть приём</b></div>
   <div class="kv"><span>Поиск документа</span><b>секунда вместо папки</b></div>
   <div class="kv"><span>Спор с пациентом</span><b>есть дата, версия, подпись</b></div>
   <div class="kv"><span>Проверка</span><b>выгрузка по любому периоду</b></div>
  </div>
 </div>
</div>`;
/* ====== ПЛАН ЛЕЧЕНИЯ · КАЛЬКУЛЯТОР ====== */
let CART={threa:6,fill:1,botox:0,biore:0};
let disc=5, stages=3, planPat='Сауле Мукашева';
const seeCost=()=>role==='Директор'||role==='Собственник'||role==='Бухгалтер';
function planCalc(){
 const k=TARIFF[tariff].k;
 const items=Object.keys(CART).filter(x=>CART[x]>0).map(x=>{
  const p=PMAP[x],q=CART[x],price=Math.round(p.p*k);
  return {k:x,n:p.n,u:p.u,q,price,sum:price*q,cost:p.c*q}});
 const sum=items.reduce((a,x)=>a+x.sum,0);
 const cost=items.reduce((a,x)=>a+x.cost,0);
 const dsum=Math.round(sum*disc/100);
 const total=sum-dsum;
 const marg=total?Math.round((total-cost)/total*100):0;
 return {items,sum,cost,dsum,total,marg,per:Math.round(total/stages)};
}
SC.plan=()=>{
 const r=planCalc();
 const groups=[...new Set(PRICE.map(p=>p.g))];
 return `<div class="hd"><div><h2>План лечения — то, что сейчас пишут от руки на А4</h2>
  <p>Врач набирает процедуры кнопками, система сама считает сумму, скидку, этапы и рассрочку. Тариф переключается одной кнопкой — базовый, акционный или приём у врача-эксперта. Дальше — печать на фирменном бланке и отправка пациенту в WhatsApp.</p></div>
  <div class="btns"><button class="bt" onclick="clearPlan()">Очистить</button><button class="bt v" onclick="go('blank')">Бланк для печати</button><button class="bt p" onclick="sendPlan()">Отправить в WhatsApp</button></div></div>
 <div class="said"><b>Вы сказали на встрече</b><i>«Пациенту прямо от руки пишут план лечения на А4 — там расписывается всё, и прайс тоже, потому что план индивидуальный»</i>. Комбинаций у врача не десятки тысяч — их тридцать-сто. Все они собраны здесь в кнопки: врач нажимает, а не пишет.</div>
 <div class="g2">
  <div class="pan"><h3>1. Врач набирает процедуры · пациент ${esc(planPat)}</h3>
   <p>Нажмите на процедуру — она добавится в план. Повторное нажатие увеличивает количество.</p>
   <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:11px">
    ${Object.entries(TARIFF).map(([k,v])=>`<button class="ptab ${k===tariff?'on':''}" onclick="setTariff('${k}')">${esc(v.n)} · ${esc(v.note)}</button>`).join('')}
   </div>
   ${groups.map(g=>`<div style="margin-bottom:11px">
    <div style="font:700 9px 'IBM Plex Mono',monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--muted2);margin-bottom:6px">${esc(g)}</div>
    <div class="cat">${PRICE.filter(p=>p.g===g).map(p=>`<button class="pb2 ${CART[p.k]>0?'on':''}" onclick="addProc('${p.k}')">
     <b>${esc(p.n)}</b><span>${esc(p.note)}</span>
     <u>${fmt(p.p*TARIFF[tariff].k)} ₸</u>${CART[p.k]>0?`<span class="qn">${CART[p.k]} ${esc(p.u)}</span>`:''}</button>`).join('')}</div></div>`).join('')}
  </div>
  <div>
   <div class="pan"><h3>2. План собирается сам</h3>
    <div class="cart">
     <div class="ci h"><span>Процедура</span><span class="r">Кол-во</span><span class="r">Сумма</span><span></span></div>
     ${r.items.length?r.items.map(x=>`<div class="ci">
      <span><b>${esc(x.n)}</b><span class="sub">${fmt(x.price)} ₸ / ${esc(x.u)}</span></span>
      <span class="qbtn"><button onclick="incP('${x.k}',-1)">−</button><button onclick="incP('${x.k}',1)">+</button></span>
      <span class="r"><b>${fmt(x.sum)} ₸</b><span class="sub">${x.q} ${esc(x.u)}</span></span>
      <span class="r"><button onclick="incP('${x.k}',-99)" title="Убрать" style="color:var(--muted2)">×</button></span></div>`).join(''):
      '<div class="empty">Нажмите на процедуру слева — план начнёт собираться</div>'}
     <div class="tot"><span>Стоимость процедур</span><b>${fmt(r.sum)} ₸</b></div>
     <div class="tot"><span>Скидка ${disc}%</span><b>− ${fmt(r.dsum)} ₸</b></div>
     <div class="tot hi"><span>Итого по плану</span><b>${fmt(r.total)} ₸</b></div>
     ${seeCost()?`<div class="tot"><span>Расходники (себестоимость)</span><b>${fmt(r.cost)} ₸</b></div>
     <div class="tot"><span>Маржа плана</span><b style="color:${r.marg>60?'var(--ok)':'var(--warn)'}">${r.marg}%</b></div>`:
     '<div class="tot"><span>Себестоимость</span><b class="mini">скрыта для вашей роли</b></div>'}
    </div>
    <div class="crow" style="margin-top:14px"><label>Скидка врача <b>${disc}%</b></label>
     <input type="range" min="0" max="20" step="1" value="${disc}" oninput="setDisc(this.value)"></div>
    <div class="crow"><label>Разбить на этапы (визитов) <b>${stages}</b></label>
     <input type="range" min="1" max="6" step="1" value="${stages}" oninput="setStages(this.value)"></div>
    <div class="res">
     <div class="rr"><span>Платёж за визит</span><b>${fmt(r.per)} ₸</b></div>
     <div class="rr"><span>Аванс при старте (30%)</span><b>${fmt(Math.round(r.total*.3))} ₸</b></div>
     <div class="rr hi"><span>Итого пациенту</span><b>${fmt(r.total)} ₸</b></div>
    </div>
    <div class="btns" style="margin-top:12px;justify-content:flex-start">
     <button class="bt p" onclick="sendPlan()">Отправить в WhatsApp</button>
     <button class="bt v" onclick="go('blank')">Печать на бланке</button>
     <button class="bt" onclick="toast('План сохранён в карте пациента, сделка в воронке получила сумму '+fmt(planCalc().total)+' ₸ и перешла в стадию «План лечения выдан». Робот напомнит через 3 дня, если решения не будет.')">Сохранить в карту</button>
    </div>
   </div>
   <div class="pan"><h3>Что происходит после сохранения</h3>
    <div class="li"><i>1</i><span><b>Сумма плана уходит в воронку</b><span class="sub">сделка становится реальной цифрой, а не «ну тысяч триста»</span></span></div>
    <div class="li"><i>2</i><span><b>Этапы становятся повторной воронкой</b><span class="sub">этап 2 и 3 попадают в воронку повторных с датами — это ваш «прийти восьмого числа»</span></span></div>
    <div class="li"><i>3</i><span><b>Препараты бронируются на складе</b><span class="sub">филлер и нити под этот план не уйдут другому пациенту</span></span></div>
    <div class="li"><i>4</i><span><b>Врачу считается выработка</b><span class="sub">его процент начисляется после того, как процедура выполнена, а не когда план выдан</span></span></div>
   </div>
  </div>
 </div>`};

SC.blank=()=>{const r=planCalc();
 return `<div class="hd"><div><h2>Бланк плана лечения</h2>
  <p>Тот самый лист, который пациент уносит с собой, — но напечатанный на фирменном бланке, с расчётом, датами этапов и подписью врача. Вы говорили про эстетику: бумага здесь работает на чек так же, как кабинет и запах.</p></div>
  <div class="btns"><button class="bt" onclick="window.print()">Печать</button><button class="bt p" onclick="sendPlan()">Отправить в WhatsApp</button></div></div>
 <div class="blank">
  <div class="bh">
   <div><div class="bl">ESTETICA<small>CLINIC · ЭСТЕТИЧЕСКАЯ МЕДИЦИНА</small></div></div>
   <div style="text-align:right;font-size:10px;color:#736a79;line-height:1.6">г. Астана, ул. Достык, 12<br>+7 7172 ·· ·· ··<br>instagram.com/estetica</div>
  </div>
  <h4>Индивидуальный план лечения</h4>
  <div style="font-size:10.6px;color:#736a79;margin-bottom:12px">Пациент: <b style="color:#241b28">${esc(planPat)}</b> · Врач: <b style="color:#241b28">Айгерим С.</b> · Дата: 16.09.2026 · План № PL-2026-0184</div>
  <div class="brow h"><span>Процедура</span><span class="r">Кол-во</span><span class="r">Сумма, ₸</span></div>
  ${r.items.length?r.items.map(x=>`<div class="brow"><span>${esc(x.n)}<br><span style="font-size:9.6px;color:#8d8391">${fmt(x.price)} ₸ за ${esc(x.u)}</span></span><span class="r">${x.q}</span><span class="r">${fmt(x.sum)}</span></div>`).join(''):'<div class="brow"><span style="color:#8d8391">Процедуры не выбраны — вернитесь на экран «План лечения»</span><span class="r"></span><span class="r"></span></div>'}
  <div class="brow"><span>Скидка ${disc}%</span><span class="r"></span><span class="r">− ${fmt(r.dsum)}</span></div>
  <div class="bsum"><span>Итого по плану</span><span>${fmt(r.total)} ₸</span></div>
  <div style="margin-top:14px;font-size:10.6px;line-height:1.7">
   <b>Этапы и даты</b><br>
   ${Array.from({length:stages},(_,i)=>`Этап ${i+1} — ${['22 сентября','13 октября','10 ноября','8 декабря','12 января','9 февраля'][i]} · ${fmt(r.per)} ₸`).join('<br>')}
  </div>
  <div style="margin-top:12px;font-size:10px;color:#736a79;line-height:1.65">
   План действителен 30 дней. Стоимость зафиксирована на срок действия плана. Перед каждым этапом врач оценивает результат предыдущего и может скорректировать схему — изменения согласовываются с вами.
  </div>
  <div class="bfoot">
   <div><b style="color:#241b28">Подготовка к визиту</b><br>За 3 дня — без алкоголя и разжижающих кровь препаратов. В день процедуры — без макияжа. При простуде визит переносится.</div>
   <div class="qr">QR<br>план<br>в WhatsApp</div>
  </div>
  <div class="sgn"><span>Врач: <u></u></span><span>Пациент: <u></u></span></div>
 </div>
 <div class="g3" style="margin-top:14px">
  <div class="pan"><h3>Почему бланк, а не тетрадь</h3>
   <p>От руки на А4 — это «девяностые». Фирменный бланк с расчётом и датами читается как документ, а документ легче оплатить. Тот же текст на хорошей бумаге поднимает чек, а не стоимость услуги.</p>
  </div>
  <div class="pan"><h3>Уходит сразу в WhatsApp</h3>
   <p>Пациент выходит из клиники с бумагой, а дома открывает тот же план в телефоне — с ценами, датами и кнопкой «записаться на этап 2».</p>
   <div class="kv"><span>Открывают план в WhatsApp</span><b>86%</b></div>
   <div class="kv"><span>Средний срок до оплаты</span><b>3,4 дня</b></div>
  </div>
  <div class="pan"><h3>И остаётся в системе</h3>
   <p>Бумага теряется, система — нет. Через полгода видно, какой план кому выдали, что из него выполнено и что не купили.</p>
   <button class="bt" style="width:100%;margin-top:6px" onclick="go('ltv')">Отчёт по планам</button>
  </div>
 </div>`};

SC.price=()=>`<div class="hd"><div><h2>Прайсы и акции</h2>
 <p>Три прайса на одну процедуру — базовый, акционный и приём у врача-эксперта. Врач не считает в уме и не помнит наизусть: он выбирает тариф, а цена подставляется. Акция ставится на период и выключается сама.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Изменение цены — с датой начала. Старые планы лечения считаются по цене, действовавшей на день выдачи.')">История цен</button></div></div>
<div class="tw"><table class="t">
 <thead><tr><th>Процедура</th><th>Группа</th><th>Ед.</th><th class="r">Базовый</th><th class="r">Акционный −15%</th><th class="r">VIP +35%</th>${seeCost()?'<th class="r">Расходники</th><th class="r">Маржа</th>':''}</tr></thead>
 <tbody>${PRICE.map(p=>`<tr onclick="openProc('${p.k}')">
  <td><b>${esc(p.n)}</b><span class="sub">${esc(p.note)}</span></td>
  <td><span class="tag a">${esc(p.g)}</span></td><td>${esc(p.u)}</td>
  <td class="r">${fmt(p.p)}</td><td class="r">${fmt(p.p*.85)}</td><td class="r">${fmt(p.p*1.35)}</td>
  ${seeCost()?`<td class="r">${p.c?fmt(p.c):'—'}</td><td class="r"><b style="color:${p.p&&(p.p-p.c)/p.p>.6?'var(--ok)':'var(--warn)'}">${p.p?Math.round((p.p-p.c)/p.p*100):0}%</b></td>`:''}</tr>`).join('')}
 </tbody></table></div>
<div class="g3" style="margin-top:12px">
 <div class="pan"><h3>Кто может дать скидку</h3>
  <div class="kv"><span>Администратор</span><b>0%</b></div>
  <div class="kv"><span>Врач</span><b>до 10%</b></div>
  <div class="kv"><span>Директор</span><b>до 25%</b></div>
  <div class="kv"><span>Собственник</span><b>без ограничений</b></div>
  <div class="note"><b>Каждая скидка именная</b><p>В отчёте видно, кто дал скидку, кому и сколько на этом потеряли. Сейчас эта цифра не считается нигде.</p></div>
 </div>
 <div class="pan"><h3>Акция месяца</h3>
  <div class="kv"><span>«Осенний уход» · −15%</span><b>до 30.09</b></div>
  <div class="kv"><span>Процедуры</span><b>чистка, пилинг, RF</b></div>
  <div class="kv"><span>Рассылка</span><b>218 пациентов</b></div>
  <div class="kv"><span>Записались</span><b>24</b></div>
  <div class="kv"><span>Выручка с акции</span><b>918 000 ₸</b></div>
  <button class="bt" style="width:100%;margin-top:8px" onclick="go('funnel')">Воронка акции</button>
 </div>
 <div class="pan"><h3>Себестоимость считается сама</h3>
  <p>Цена расходников берётся из последней принятой партии на складе. Подорожал филлер — маржа в прайсе пересчиталась, и вы это видите до того, как продали месяц в минус.</p>
  <div class="kv"><span>Пересчёт</span><b>при каждой приёмке</b></div>
  <div class="kv"><span>Сигнал</span><b>если маржа ниже 55%</b></div>
 </div>
</div>`;
/* ====== СКЛАД ====== */
SC.stock=()=>`<div class="hd"><div><h2>Препараты и партии</h2>
 <p>В косметологии склад — это не «коробки», а деньги и ответственность: у каждого препарата партия, срок годности и цена, по которой он пришёл. Отсюда берётся себестоимость процедуры, и отсюда же — предупреждение, что через неделю работать будет нечем.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Приёмка: сканируете накладную, вводите партию и срок. Цена партии сразу пересчитывает себестоимость процедур.')">Приёмка</button><button class="bt p" onclick="orderStock()">Создать заявку поставщику</button></div></div>
<div class="wid">
 <div><small>Позиций</small><b>${STOCK.length}</b><span>по 6 группам</span></div>
 <div><small>Стоимость остатка</small><b class="a">2 940 000 ₸</b><span>по ценам партий</span></div>
 <div><small>Ниже минимума</small><b class="r">${STOCK.filter(s=>s.st==='low').length}</b><span>нужна заявка</span></div>
 <div><small>Истекает за 60 дней</small><b class="w">${STOCK.filter(s=>s.st==='exp').length}</b><span>списать или использовать</span></div>
 <div><small>Забронировано под планы</small><b class="i">7 позиций</b><span>под оплаченные этапы</span></div>
</div>
<div class="tw"><table class="t">
 <thead><tr><th>Препарат</th><th>Партия</th><th class="r">Остаток</th><th class="r">Минимум</th><th>Срок годности</th><th class="r">Цена партии</th><th>Состояние</th></tr></thead>
 <tbody>${STOCK.map(s=>`<tr onclick="openStock('${esc(s.n)}')">
  <td><b>${esc(s.n)}</b></td><td class="mono">${esc(s.lot)}</td>
  <td class="r"><b>${s.left}</b></td><td class="r">${s.min}</td><td>${esc(s.exp)}</td>
  <td class="r">${fmt(s.price)} ₸</td>
  <td>${s.st==='ok'?'<span class="tag g">норма</span>':s.st==='low'?'<span class="tag r">ниже минимума</span>':'<span class="tag w">истекает</span>'}</td></tr>`).join('')}
 </tbody></table></div>
<div class="g3" style="margin-top:12px">
 <div class="pan"><h3>Списание идёт от процедуры</h3>
  <p>Врач закрывает приём — препараты списываются по норме процедуры, с указанием партии. Ничего не нужно заносить отдельно.</p>
  <div class="kv"><span>Нити · 1 процедура</span><b>по факту, 4–8 шт</b></div>
  <div class="kv"><span>Филлер · 1 мл</span><b>1 шприц из партии</b></div>
  <div class="kv"><span>Ботулотоксин</span><b>единицы из флакона</b></div>
  <div class="hint">Остаток флакона тоже учитывается: система знает, что во флаконе 100 единиц и сколько из них уже израсходовано.</div>
 </div>
 <div class="pan"><h3>Партия попадает в карту пациента</h3>
  <p>Если у поставщика отзыв партии или у пациента реакция — за минуту видно, кому и когда этой партией работали.</p>
  <div class="li"><i>✓</i><span><b>Партия в карте визита</b><span class="sub">препарат, серия, срок, врач</span></span></div>
  <div class="li"><i>✓</i><span><b>Обратный поиск</b><span class="sub">«кому кололи FL-2409» — список за секунду</span></span></div>
 </div>
 <div class="pan"><h3>Заявки поставщику</h3>
  <div class="li w"><i>!</i><span><b>Ботулотоксин 100 ед.</b><span class="sub">остаток 3 при минимуме 4 · хватит на 3 приёма</span></span></div>
  <div class="li w"><i>!</i><span><b>Пилинг срединный, набор</b><span class="sub">остаток 5 при минимуме 5</span></span></div>
  <div class="li"><i>✓</i><span><b>Филлеры · партия FL-2411</b><span class="sub">в пути, ожидается 18.09</span></span></div>
  <button class="bt p" style="width:100%;margin-top:8px" onclick="orderStock()">Собрать заявку автоматически</button>
 </div>
</div>`;

SC.writeoff=()=>`<div class="hd"><div><h2>Списание и себестоимость процедуры</h2>
 <p>Вы сказали: «финансы — чтобы увидеть себестоимость». Вот она, по каждой процедуре: сколько ушло препаратов, сколько стоит время врача и кабинета, и что осталось клинике.</p></div></div>
<div class="tw"><table class="t">
 <thead><tr><th>Процедура</th><th class="r">Цена</th><th class="r">Препараты</th><th class="r">Врач (%)</th><th class="r">Кабинет и расходка</th><th class="r">Остаётся клинике</th><th class="r">Маржа</th></tr></thead>
 <tbody>${[['Нити · 6 шт',228000,90000,57000,9000],['Филлер · 1 мл',95000,38000,23750,4000],['Липофилинг',420000,120000,126000,22000],['Биоревитализация',65000,22000,16250,3000],['Лазерная шлифовка',180000,35000,45000,12000],['Чистка лица',25000,5000,6250,2500]].map(([n,p,m,d,o])=>{
  const left=p-m-d-o;return `<tr><td><b>${n}</b></td><td class="r">${fmt(p)}</td><td class="r">${fmt(m)}</td><td class="r">${fmt(d)}</td><td class="r">${fmt(o)}</td>
  <td class="r"><b>${fmt(left)}</b></td><td class="r"><b style="color:${left/p>.45?'var(--ok)':'var(--warn)'}">${Math.round(left/p*100)}%</b></td></tr>`}).join('')}
 </tbody></table></div>
<div class="g2" style="margin-top:12px">
 <div class="pan"><h3>Что это меняет в решениях</h3>
  <div class="li"><i>✓</i><span><b>Видно, какая процедура кормит клинику</b><span class="sub">не та, где чек больше, а та, где остаётся больше</span></span></div>
  <div class="li"><i>✓</i><span><b>Видно, когда скидка съедает всё</b><span class="sub">15% на процедуре с маржой 40% — это минус треть прибыли с визита</span></span></div>
  <div class="li"><i>✓</i><span><b>Видно рост закупа</b><span class="sub">подорожал препарат — маржа упала, сигнал приходит сразу, а не в конце квартала</span></span></div>
  <div class="li"><i>✓</i><span><b>Видно, что рекламировать</b><span class="sub">маркетолог ведёт трафик на маржинальные процедуры, а не на самые дешёвые</span></span></div>
 </div>
 <div class="pan"><h3>Списания за сегодня</h3>
  <div class="li"><i>✓</i><span><b>Мезонить 2D — 6 шт</b><span class="sub">партия TH-0742 · Айнур Д. · Айгерим · 90 000 ₸</span></span></div>
  <div class="li"><i>✓</i><span><b>Филлер 1 мл — 1 шприц</b><span class="sub">партия FL-2409 · Сауле М. · Айгерим · 38 000 ₸</span></span></div>
  <div class="li"><i>✓</i><span><b>Препарат биоревит. — 1 шт</b><span class="sub">партия BR-3310 · Камила Р. · Нурлан · 22 000 ₸</span></span></div>
  <div class="li w"><i>!</i><span><b>Приём 14:00 не закрыт</b><span class="sub">препараты не списаны, выручка не учтена, процент врачу не начислен</span></span></div>
  <div class="note"><b>Правило</b><p>Пока врач не закрыл приём, процедура не попадает ни в деньги, ни в зарплату. Это единственный способ, при котором цифры в конце месяца сходятся.</p></div>
 </div>
</div>`;

/* ====== ДЕНЬГИ ====== */
SC.cash=()=>`<div class="hd"><div><h2>Касса и оплаты</h2>
 <p>Оплаты привязаны к плану лечения: видно, сколько внесено, сколько осталось и чем платили. Аванс, рассрочка по этапам и доплата в день процедуры — это три разные строки, а не «заплатил и ладно».</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Чек уходит пациенту в WhatsApp. Фискализация — через вашу онлайн-кассу, подключается на втором этапе.')">Принять оплату</button></div></div>
<div class="wid">
 <div><small>Касса за сегодня</small><b class="a">1 780 000 ₸</b><span>9 оплат</span></div>
 <div><small>Kaspi перевод</small><b>1 180 000 ₸</b><span>66%</span></div>
 <div><small>Карта</small><b>260 000 ₸</b><span>15%</span></div>
 <div><small>Наличные</small><b>340 000 ₸</b><span>19%</span></div>
 <div><small>Ожидается по планам</small><b class="w">3 640 000 ₸</b><span>остатки по этапам</span></div>
</div>
<div class="g21">
 <div class="pan"><h3>Оплаты сегодня</h3>
  <div class="tw"><table class="t">
   <thead><tr><th>Время</th><th>Пациент</th><th>За что</th><th>Способ</th><th class="r">Сумма</th><th>Остаток по плану</th></tr></thead>
   <tbody>
    <tr><td>09:40</td><td><b>Дана Е.</b></td><td>Мезотерапия · этап 3</td><td><span class="tag g">Kaspi</span></td><td class="r">28 000 ₸</td><td>28 000 ₸</td></tr>
    <tr><td>11:20</td><td><b>Сауле М.</b></td><td>Филлер · этап 2</td><td><span class="tag g">Kaspi</span></td><td class="r">95 000 ₸</td><td>76 000 ₸</td></tr>
    <tr><td>12:05</td><td><b>Айнур Д.</b></td><td>Нити · аванс 30%</td><td><span class="tag i">карта</span></td><td class="r">100 000 ₸</td><td>128 000 ₸</td></tr>
    <tr><td>14:30</td><td><b>Алия Ж.</b></td><td>Лазер · полная оплата</td><td><span class="tag">наличные</span></td><td class="r">180 000 ₸</td><td>0 ₸</td></tr>
    <tr><td>16:10</td><td><b>Камила Р.</b></td><td>Биоревитализация №2</td><td><span class="tag g">Kaspi</span></td><td class="r">65 000 ₸</td><td>65 000 ₸</td></tr>
    <tr class="total"><td colspan="4">Итого</td><td class="r">468 000 ₸</td><td></td></tr>
   </tbody></table></div>
  <div class="hint"><b>Возврат</b> оформляется из этой же строки: причина, сумма, кто согласовал. В отчёте возвраты видны отдельно, а не «уменьшили выручку».</div>
 </div>
 <div>
  <div class="pan"><h3>Рассрочка по этапам</h3>
   <p>Дорогой план делится на визиты. Пациенту проще решиться, клинике — видно график поступлений.</p>
   <div class="kv"><span>Планов в рассрочку</span><b>18</b></div>
   <div class="kv"><span>Ожидается в этом месяце</span><b>2 140 000 ₸</b></div>
   <div class="kv"><span>Просрочено (этап прошёл, оплаты нет)</span><b style="color:var(--bad)">2 плана</b></div>
   <div class="note"><b>Робот следит сам</b><p>За 5 дней до этапа — напоминание пациенту. Через 3 дня после пропущенного этапа — задача администратору.</p></div>
  </div>
  <div class="pan"><h3>Закрытие смены</h3>
   <div class="li"><i>✓</i><span><b>Сверка наличных</b><span class="sub">фактическая сумма в кассе против системы</span></span></div>
   <div class="li"><i>✓</i><span><b>Выписка Kaspi</b><span class="sub">сверяется по сумме и времени</span></span></div>
   <div class="li n"><i>+</i><span><b>Инкассация</b><span class="sub">отметка о сдаче в банк</span></span></div>
  </div>
 </div>
</div>`;

SC.payroll=()=>{const rows=PAYROLL.map(p=>({...p,pay:Math.round(p.base+p.rev*p.pct/100+p.bonus)}));
 const tot=rows.reduce((a,x)=>a+x.pay,0);
 return `<div class="hd"><div><h2>Зарплата и проценты врачей</h2>
  <p>Процент врача считается от выполненных процедур, а не от выданных планов. Пока приём не закрыт — выработки нет. Это снимает вечный спор «я же сделал» в конце месяца.</p></div>
  <div class="btns"><button class="bt" onclick="toast('Расчёт можно выгрузить в Excel и отдать бухгалтеру — с расшифровкой по каждой процедуре.')">Выгрузить</button></div></div>
 <div class="tw"><table class="t">
  <thead><tr><th>Сотрудник</th><th class="r">Оклад</th><th class="r">%</th><th class="r">База (выручка)</th><th class="r">Процент</th><th class="r">Премия</th><th class="r">К выплате</th><th class="r">Процедур</th></tr></thead>
  <tbody>${rows.map(p=>`<tr><td><b>${esc(p.n)}</b></td><td class="r">${fmt(p.base)}</td><td class="r">${p.pct}%</td>
   <td class="r">${fmt(p.rev)}</td><td class="r">${fmt(p.rev*p.pct/100)}</td><td class="r">${p.bonus?fmt(p.bonus):'—'}</td>
   <td class="r"><b>${fmt(p.pay)} ₸</b></td><td class="r">${p.done||'—'}</td></tr>`).join('')}
   <tr class="total"><td>Фонд оплаты труда</td><td class="r"></td><td class="r"></td><td class="r"></td><td class="r"></td><td class="r"></td><td class="r">${fmt(tot)} ₸</td><td class="r"></td></tr>
  </tbody></table></div>
 <div class="g3" style="margin-top:12px">
  <div class="pan"><h3>Врач видит свою выработку сам</h3>
   <p>В своём кабинете врач в любой момент видит: сколько процедур закрыл, на какую сумму и сколько заработал. Вопросов в конце месяца становится меньше.</p>
   <div class="kv"><span>Айгерим · закрыто</span><b>64 процедуры</b></div>
   <div class="kv"><span>Выработка</span><b>7 420 000 ₸</b></div>
   <div class="kv"><span>Её процент</span><b>1 855 000 ₸</b></div>
  </div>
  <div class="pan"><h3>Схемы оплаты</h3>
   <div class="kv"><span>Оклад + процент</span><b>врачи</b></div>
   <div class="kv"><span>Процент от клиники</span><b>медсестра, администратор</b></div>
   <div class="kv"><span>Премия за план</span><b>если выполнен месячный</b></div>
   <div class="kv"><span>Разные % по процедурам</span><b>настраивается</b></div>
   <div class="hint">Например: за нити 30%, за аппаратные 20%, за уход 15% — считается автоматически по каждой процедуре.</div>
  </div>
  <div class="pan"><h3>Кто это видит</h3>
   <div class="kv"><span>Собственник и директор</span><b>всех</b></div>
   <div class="kv"><span>Бухгалтер</span><b>всех, для расчёта</b></div>
   <div class="kv"><span>Врач</span><b>только себя</b></div>
   <div class="kv"><span>Администратор</span><b>никого</b></div>
   <div class="note" style="--tone:var(--bad)"><b>Это важно</b><p>Зарплаты — самая чувствительная таблица в клинике. Права на неё настраиваются отдельно от всего остального.</p></div>
  </div>
 </div>`};

SC.fin=()=>`<div class="hd"><div><h2>Финансы клиники</h2>
 <p>Отчётность, которую вы попросили: сколько заработали, сколько потратили и где деньги. Всё собирается из кассы, склада и зарплат — отдельную таблицу в Excel вести не нужно.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Период, сравнение с прошлым месяцем, выгрузка в Excel и отправка отчёта в WhatsApp собственнику по расписанию.')">Период и выгрузка</button></div></div>
<div class="wid">
 <div><small>Выручка</small><b class="a">${fmt(F.rev)} ₸</b><span>+18% к августу</span></div>
 <div><small>Прямые расходы</small><b>4 120 000 ₸</b><span>препараты и расходка</span></div>
 <div><small>ФОТ</small><b>5 340 000 ₸</b><span>оклады и проценты</span></div>
 <div><small>Постоянные</small><b>3 980 000 ₸</b><span>аренда, реклама, сервисы</span></div>
 <div><small>Прибыль</small><b class="g">4 960 000 ₸</b><span>маржа 27%</span></div>
</div>
<div class="g21">
 <div class="pan"><h3>Куда уходит каждый тенге выручки</h3>
  <div class="yld">
   <div style="flex:22.4;background:#a8764a">22%<small>препараты</small></div>
   <div style="flex:29;background:#7a6595">29%<small>зарплаты</small></div>
   <div style="flex:11;background:#cf8a22">11%<small>реклама</small></div>
   <div style="flex:10.6;background:#3b7a9e">11%<small>аренда</small></div>
   <div style="flex:27;background:#2f8f5b">27%<small>прибыль</small></div>
  </div>
  <div class="yld-l"><span><i style="background:#a8764a"></i>Препараты и расходка</span><span><i style="background:#7a6595"></i>Зарплаты и проценты</span><span><i style="background:#cf8a22"></i>Реклама</span><span><i style="background:#3b7a9e"></i>Аренда и сервисы</span><span><i style="background:#2f8f5b"></i>Прибыль</span></div>
  <div class="tw" style="margin-top:14px"><table class="t">
   <thead><tr><th>Статья</th><th class="r">Июль</th><th class="r">Август</th><th class="r">Сентябрь</th><th class="r">Доля</th></tr></thead>
   <tbody>
    <tr><td><b>Выручка</b></td><td class="r">14 200 000</td><td class="r">15 600 000</td><td class="r"><b>18 400 000</b></td><td class="r">100%</td></tr>
    <tr><td>Препараты и расходка</td><td class="r">3 380 000</td><td class="r">3 610 000</td><td class="r">4 120 000</td><td class="r">22%</td></tr>
    <tr><td>Зарплаты и проценты</td><td class="r">4 420 000</td><td class="r">4 780 000</td><td class="r">5 340 000</td><td class="r">29%</td></tr>
    <tr><td>Реклама</td><td class="r">1 840 000</td><td class="r">2 010 000</td><td class="r">2 060 000</td><td class="r">11%</td></tr>
    <tr><td>Аренда, сервисы, прочее</td><td class="r">1 900 000</td><td class="r">1 920 000</td><td class="r">1 920 000</td><td class="r">11%</td></tr>
    <tr class="total"><td>Прибыль</td><td class="r">2 660 000</td><td class="r">3 280 000</td><td class="r">4 960 000</td><td class="r">27%</td></tr>
   </tbody></table></div>
 </div>
 <div>
  <div class="pan"><h3>Отчёт собственнику</h3>
   <p>Каждое утро в 9:00 в WhatsApp — короткое сообщение: выручка вчера, новые пациенты, планы лечения, что зависло. Без входа в систему.</p>
   <div class="msg out" style="max-width:100%;margin-top:8px">Вчера: выручка 742 000 ₸ · пациентов 7 · новых 2<br>Планов выдано 2 на 616 000 ₸<br>Не закрыт 1 приём · ботулотоксин ниже минимума<small>сегодня 09:00 · робот</small></div>
  </div>
  <div class="pan"><h3>Что считается автоматически</h3>
   <div class="li"><i>✓</i><span><b>Выручка</b><span class="sub">из закрытых приёмов и оплат</span></span></div>
   <div class="li"><i>✓</i><span><b>Препараты</b><span class="sub">из списаний по партиям</span></span></div>
   <div class="li"><i>✓</i><span><b>Зарплаты</b><span class="sub">из выработки врачей</span></span></div>
   <div class="li n"><i>+</i><span><b>Постоянные расходы</b><span class="sub">заносятся один раз в месяц вручную</span></span></div>
  </div>
 </div>
</div>`;
/* ====== АНАЛИТИКА ====== */
SC.mark=()=>{
 const t=LEADSRC.filter(x=>x.tag==='таргет'),o=LEADSRC.filter(x=>x.tag==='органика');
 const sum=a=>a.reduce((x,y)=>({c:x.c+y.c,cost:x.cost+y.cost,pay:x.pay+y.pay,rev:x.rev+y.rev}),{c:0,cost:0,pay:0,rev:0});
 const T=sum(t),O=sum(o);
 return `<div class="hd"><div><h2>Маркетинг: за что вы платите и что это приносит</h2>
  <p>Главный вопрос рекламы — не «сколько лидов», а «сколько денег дошло до кассы». Здесь путь считается целиком: объявление → обращение → запись → визит → оплата → повторный визит.</p></div></div>
 <div class="g2">
  <div class="pan"><h3>Платный трафик · таргет</h3>
   <div class="kv"><span>Обращений</span><b>${T.c}</b></div>
   <div class="kv"><span>Затраты</span><b>${fmt(T.cost)} ₸</b></div>
   <div class="kv"><span>Цена обращения</span><b>${fmt(T.cost/T.c)} ₸</b></div>
   <div class="kv"><span>Дошли до оплаты</span><b>${T.pay} · ${pct(T.pay,T.c)}</b></div>
   <div class="kv"><span>Цена пациента</span><b>${fmt(T.cost/T.pay)} ₸</b></div>
   <div class="kv"><span>Выручка</span><b>${fmt(T.rev)} ₸</b></div>
   <div class="kv"><span>Окупаемость рекламы</span><b style="color:var(--ok)">×${num(T.rev/T.cost)}</b></div>
  </div>
  <div class="pan"><h3>Бесплатный трафик · органика</h3>
   <div class="kv"><span>Обращений</span><b>${O.c}</b></div>
   <div class="kv"><span>Затраты</span><b>${fmt(O.cost)} ₸</b></div>
   <div class="kv"><span>Дошли до оплаты</span><b>${O.pay} · ${pct(O.pay,O.c)}</b></div>
   <div class="kv"><span>Выручка</span><b>${fmt(O.rev)} ₸</b></div>
   <div class="kv"><span>Доля в выручке</span><b>${pct(O.rev,O.rev+T.rev)}</b></div>
   <div class="note" style="--tone:var(--ok)"><b>Что это показывает</b><p>Рекомендации и органика конвертируются лучше платного трафика почти вдвое. Значит, отзывы и повторные визиты — не «приятная мелочь», а второй по величине канал продаж.</p></div>
  </div>
 </div>
 <div class="pan"><h3>Путь от объявления до кассы</h3>
  <div class="flow" style="grid-template-columns:repeat(6,1fr)">
   <div class="fbx on"><code>ПОКАЗЫ</code><b>184 200</b><p>охват кампаний</p></div>
   <div class="fbx"><code>КЛИКИ</code><b>3 140</b><p>1,7% · CTR</p></div>
   <div class="fbx"><code>ЛИДЫ</code><b>${T.c}</b><p>5,8% с клика</p></div>
   <div class="fbx"><code>ЗАПИСЬ</code><b>${t.reduce((a,x)=>a+x.rec,0)}</b><p>42% с лида</p></div>
   <div class="fbx"><code>ВИЗИТ</code><b>58</b><p>76% дошли</p></div>
   <div class="fbx"><code>ОПЛАТА</code><b>${T.pay}</b><p>${fmt(T.rev)} ₸</p></div>
  </div>
  <div class="said"><b>Вы сказали на встрече</b><i>«Лиды с таргета, за которые я плачу, и органика — их нужно отделять между собой»</i>. Здесь они разделены не тегом ради тега: по каждому каналу видна цена пациента и окупаемость, а значит, понятно, куда добавить бюджет.</div>
 </div>
 <div class="g3">
  <div class="pan"><h3>По процедурам из лид-форм</h3>
   <div class="fr"><span>Нити</span><div class="bar"><i class="b" style="--w:78%"></i></div><b>34 лида · ×6,1</b></div>
   <div class="fr"><span>Филлеры и губы</span><div class="bar"><i class="b" style="--w:62%"></i></div><b>28 лидов · ×4,4</b></div>
   <div class="fr"><span>Липофилинг</span><div class="bar"><i class="b" style="--w:41%"></i></div><b>18 лидов · ×9,2</b></div>
   <div class="fr"><span>Чистка и уход</span><div class="bar"><i class="r" style="--w:86%"></i></div><b>38 лидов · ×1,3</b></div>
   <div class="hint">Чистки дают больше всего обращений и меньше всего денег. Это повод не убирать их, а вести с них в план лечения.</div>
  </div>
  <div class="pan"><h3>Время ответа и конверсия</h3>
   <div class="kv"><span>Ответ до 5 минут</span><b>конверсия 47%</b></div>
   <div class="kv"><span>От 5 до 30 минут</span><b>31%</b></div>
   <div class="kv"><span>Больше часа</span><b style="color:var(--bad)">12%</b></div>
   <div class="kv"><span>Ваш средний ответ</span><b>8 минут</b></div>
   <div class="note"><b>Поэтому таймер</b><p>Лид без ответа 15 минут превращается в задачу, а потом — в звонок. Это одна настройка, которая окупает себя быстрее всех.</p></div>
  </div>
  <div class="pan"><h3>Куда девать бюджет</h3>
   <div class="li"><i>↑</i><span><b>Липофилинг · ×9,2</b><span class="sub">добавить бюджет, но следить за очередью врача</span></span></div>
   <div class="li"><i>↑</i><span><b>Нити · ×6,1</b><span class="sub">стабильный канал, расширять аудитории</span></span></div>
   <div class="li w"><i>↓</i><span><b>Чистки · ×1,3</b><span class="sub">перевести из прямой продажи в «вход» с планом лечения</span></span></div>
   <div class="li n"><i>+</i><span><b>Рекомендации</b><span class="sub">самый дешёвый канал: работать отзывами и роботом благодарности</span></span></div>
  </div>
 </div>`};

SC.ltv=()=>`<div class="hd"><div><h2>Повторные визиты и ценность пациента</h2>
 <p>В эстетической медицине деньги не в первом визите, а во втором, пятом и десятом. Поэтому повторная воронка — это не «ещё одна доска», а основной источник выручки.</p></div></div>
<div class="wid">
 <div><small>Доля повторных</small><b class="a">${F.rep}%</b><span>визитов за месяц</span></div>
 <div><small>Средний LTV</small><b class="g">312 000 ₸</b><span>за всё время</span></div>
 <div><small>Средний срок жизни</small><b>2,4 года</b><span>от первого визита</span></div>
 <div><small>Возврат через 90 дней</small><b class="i">58%</b><span>было 34% без напоминаний</span></div>
 <div><small>Потерянные</small><b class="r">96</b><span>не были больше года — можно вернуть</span></div>
</div>
<div class="g21">
 <div class="pan"><h3>Когда пациент возвращается</h3>
  <div class="fr"><span>Этап плана лечения</span><div class="bar"><i class="g" style="--w:92%"></i></div><b>86% приходят</b></div>
  <div class="fr"><span>Курс (биоревит., мезо, RF)</span><div class="bar"><i class="g" style="--w:78%"></i></div><b>74%</b></div>
  <div class="fr"><span>Повтор через 6–9 мес.</span><div class="bar"><i class="b" style="--w:54%"></i></div><b>51%</b></div>
  <div class="fr"><span>Акционная рассылка</span><div class="bar"><i class="w" style="--w:22%"></i></div><b>11%</b></div>
  <div class="fr"><span>Без всякого повода</span><div class="bar"><i class="r" style="--w:12%"></i></div><b>6%</b></div>
  <div class="said"><b>Вы сказали на встрече</b><i>«Есть первичные, а потом по плану лечения надо, чтобы восьмого числа пришли»</i>. Робот «этап плана подошёл» и есть та самая механика — она даёт 86% возврата против 11% у обычной рассылки.</div>
 </div>
 <div>
  <div class="pan"><h3>Кого вернуть в первую очередь</h3>
   <div class="li w"><i>1</i><span><b>Не закончили курс — 23 человека</b><span class="sub">оплачено 2 этапа из 4, потенциал 1 240 000 ₸</span></span></div>
   <div class="li n"><i>2</i><span><b>План выдан, не оплачен — 18</b><span class="sub">на 4 860 000 ₸, самые тёплые</span></span></div>
   <div class="li b"><i>3</i><span><b>Были год назад — 96</b><span class="sub">разовая процедура, повод для контакта — обновление</span></span></div>
   <button class="bt p" style="width:100%;margin-top:9px" onclick="toast('Одна кнопка: выбрать сегмент → создать воронку → включить рассылку и задачи администратору. Это и есть «маркетинговая воронка», которую вы просили.')">Создать воронку возврата</button>
  </div>
  <div class="pan"><h3>Ценность по источникам</h3>
   <div class="kv"><span>Рекомендация</span><b>486 000 ₸</b></div>
   <div class="kv"><span>Органика Instagram</span><b>344 000 ₸</b></div>
   <div class="kv"><span>Таргет</span><b>268 000 ₸</b></div>
   <div class="kv"><span>2ГИС</span><b>212 000 ₸</b></div>
   <div class="hint">Пациент по рекомендации приносит почти вдвое больше таргетного — потому и нужен робот, который просит отзыв и благодарит за приведённого друга.</div>
  </div>
 </div>
</div>`;

/* ====== ЭКОНОМИКА ПЕРЕХОДА ====== */
const ECON={users:4,years:3,alt:0,wa:1,amoU:14000,altM:32000,waAmo:36000,waGreen:5000,host:12000,dev:1500000};
function econCalc(){
 const oldM=ECON.users*ECON.amoU+(ECON.alt?ECON.altM:0)+(ECON.wa?ECON.waAmo:0);
 const newM=ECON.host+(ECON.wa?ECON.waGreen:0);
 const save=oldM-newM;
 const months=ECON.years*12;
 const oldT=oldM*months, newT=newM*months+ECON.dev;
 return {oldM,newM,save,oldT,newT,diff:oldT-newT,be:save>0?ECON.dev/save:0,months};
}
SC.econ=()=>{const r=econCalc();
 return `<div class="hd"><div><h2>Сколько это экономит — честный счёт</h2>
  <p>Считаем только то, что вы платите сейчас или будете платить. Разработка — разовая: за систему не нужно платить каждый месяц и она не дорожает от того, что вы наняли ещё одного администратора.</p></div></div>
 <div class="calc">
  <div class="pan"><h3>Ваши условия</h3>
   <div class="crow"><label>Сотрудников с доступом в CRM <b>${ECON.users}</b></label>
    <input type="range" min="2" max="15" step="1" value="${ECON.users}" oninput="econSet('users',this.value)"></div>
   <div class="crow"><label>Горизонт расчёта <b>${ECON.years} ${plural(ECON.years,['год','года','лет'])}</b></label>
    <input type="range" min="1" max="5" step="1" value="${ECON.years}" oninput="econSet('years',this.value)"></div>
   <div class="srow"><span class="nm">Считать WhatsApp-интеграцию<span class="sub">в amoCRM 36 000 ₸/мес, через Green API 5 000 ₸/мес</span></span>
    <div class="sw ${ECON.wa?'on':''}" onclick="econToggle('wa')"></div></div>
   <div class="srow"><span class="nm">Считать экономию на Altegio<span class="sub">у вас оплачен на 3 года вперёд — по умолчанию выключено</span></span>
    <div class="sw ${ECON.alt?'on':''}" onclick="econToggle('alt')"></div></div>
   <div class="note" style="--tone:var(--bad)"><b>Почему Altegio выключен по умолчанию</b>
    <p>Вы сказали, что владелица оплатила Altegio на три года вперёд. Эти деньги уже потрачены — считать их экономией было бы нечестно. Портал заменит Altegio функционально, но в расчёте ниже мы эту строку не берём, пока вы сами не включите тумблер.</p></div>
  </div>
  <div>
   <div class="res">
    <div class="rr"><span>Сейчас: amoCRM (${ECON.users} ${plural(ECON.users,['сотрудник','сотрудника','сотрудников'])})</span><b>${fmt(ECON.users*ECON.amoU)} ₸/мес</b></div>
    ${ECON.alt?`<div class="rr"><span>Сейчас: Altegio</span><b>${fmt(ECON.altM)} ₸/мес</b></div>`:''}
    ${ECON.wa?`<div class="rr"><span>Сейчас: WhatsApp в amoCRM</span><b>${fmt(ECON.waAmo)} ₸/мес</b></div>`:''}
    <div class="rr hi"><span>Итого сейчас</span><b>${fmt(r.oldM)} ₸/мес</b></div>
    <div class="rr"><span>Свой портал: сервер и обслуживание</span><b>${fmt(ECON.host)} ₸/мес</b></div>
    ${ECON.wa?`<div class="rr"><span>Свой портал: WhatsApp через Green API</span><b>${fmt(ECON.waGreen)} ₸/мес</b></div>`:''}
    <div class="rr hi"><span>Итого со своим порталом</span><b>${fmt(r.newM)} ₸/мес</b></div>
    <div class="rr"><span>Экономия в месяц</span><b style="color:var(--ok)">${fmt(r.save)} ₸</b></div>
    <div class="rr"><span>Разработка (разово)</span><b>${fmt(ECON.dev)} ₸</b></div>
    <div class="rr hi"><span>Окупаемость</span><b>${r.be?num(r.be)+' '+plural(Math.round(r.be),['месяц','месяца','месяцев']):'—'}</b></div>
   </div>
   <div class="pan" style="margin-top:12px"><h3>За ${ECON.years} ${plural(ECON.years,['год','года','лет'])}</h3>
    <div class="kv"><span>Аренда чужих систем</span><b>${fmt(r.oldT)} ₸</b></div>
    <div class="kv"><span>Своя система (разработка + обслуживание)</span><b>${fmt(r.newT)} ₸</b></div>
    <div class="kv"><span>Разница</span><b style="color:${r.diff>0?'var(--ok)':'var(--bad)'}">${r.diff>0?'+':''}${fmt(r.diff)} ₸</b></div>
    <div class="note" style="--tone:var(--ok)"><b>И это только про деньги за подписку</b>
     <p>Отдельно остаётся то, что не измеряется абонплатой: планы лечения считаются и не теряются, повторные визиты приходят по роботу, себестоимость видна, база пациентов принадлежит клинике, а любая доработка делается вами, а не покупается пакетом.</p></div>
   </div>
  </div>
 </div>
 <div class="g3">
  <div class="pan"><h3>Что не входит и стоит отдельно</h3>
   <div class="kv"><span>WhatsApp · Green API</span><b>5 000 ₸/мес сервису</b></div>
   <div class="kv"><span>Телефония · Sipuni</span><b>по тарифу оператора</b></div>
   <div class="kv"><span>SIP-номер</span><b>оператор связи</b></div>
   <div class="kv"><span>Подписание договоров ЭЦП</span><b>опция, отдельно</b></div>
   <div class="kv"><span>Онлайн-касса и фискализация</span><b>второй этап</b></div>
  </div>
  <div class="pan"><h3>Про рост</h3>
   <p>Аренда дорожает вместе с вами: каждый новый администратор, врач или вторая клиника — это плюс к ежемесячному счёту. Своя система при росте не дорожает: добавили сотрудника — просто завели ему доступ.</p>
   <div class="kv"><span>Сейчас, ${ECON.users} ${plural(ECON.users,['сотрудник','сотрудника','сотрудников'])}</span><b>${fmt(ECON.users*ECON.amoU)} ₸/мес</b></div>
   <div class="kv"><span>При 10 сотрудниках</span><b>${fmt(10*ECON.amoU)} ₸/мес</b></div>
   <div class="kv"><span>Своя система</span><b>${fmt(ECON.host)} ₸/мес · не меняется</b></div>
  </div>
  <div class="pan"><h3>Считайте вдвое скромнее</h3>
   <p>Даже если убрать из расчёта WhatsApp-интеграцию, оставить один Altegio оплаченным и считать только amoCRM на четверых — разница за три года всё равно остаётся в пользу своей системы. А главный эффект не здесь, а в планах лечения и повторных визитах.</p>
   <button class="bt p" style="width:100%;margin-top:8px" onclick="go('stack')">Состав и стоимость релиза</button>
  </div>
 </div>`};

/* ====== РОБОТЫ ====== */
SC.robots=()=>`<div class="hd"><div><h2>Роботы: подтверждения, напоминания и возвраты</h2>
 <p>Вы сказали: «по функционалу Altegio — за три дня подтверждение записи и за сутки напоминалка». Они здесь, и рядом ещё шесть, которых в Altegio нет. Каждый включается тумблером, текст меняете вы сами.</p></div>
 <div class="btns"><button class="bt p" onclick="runDay()">Прогнать день</button></div></div>
<div class="wid">
 <div><small>Сообщений за месяц</small><b>612</b><span>через Green API</span></div>
 <div><small>Подтверждают запись</small><b class="g">91%</b><span>за 3 дня до визита</span></div>
 <div><small>Неявки</small><b class="a">7%</b><span>было 19%</span></div>
 <div><small>Возвращено пациентов</small><b class="i">31</b><span>роботом «этап подошёл»</span></div>
 <div><small>Стоимость всех сообщений</small><b>5 000 ₸/мес</b><span>один номер Green API</span></div>
</div>
<div class="g21">
 <div><div id="robotlist">${ROBOTS.map((r,i)=>`<div class="robot" style="--c:${r.c}">
  <div class="rh"><b>${esc(r.n)}</b><span class="tag ${r.on?'g':''}">${r.on?'включён':'выключен'}</span><div class="sw ${r.on?'on':''}" onclick="toggleRobot(${i})"></div></div>
  <div class="meta"><span>Канал: <b>${esc(r.ch)}</b></span><span>Когда: <b>${esc(r.w)}</b></span></div>
  <div class="chain"><div><span class="st ${r.on?'ok':''}">текст</span><span class="mini">${esc(r.txt)}</span></div>
   <div><span class="st go">факт</span><span class="mini">${esc(r.stat)}</span></div></div></div>`).join('')}</div>
 </div>
 <div>
  <div class="pan"><h3>Что будет сегодня</h3>
   <div id="dayrun"><div class="li"><i>·</i><span><b>Нажмите «Прогнать день»</b><span class="sub">покажем по шагам, какие сообщения и задачи создаст система</span></span></div></div>
  </div>
  <div class="pan"><h3>Как это не превращается в спам</h3>
   <div class="li"><i>✓</i><span><b>Только ожидаемые сообщения</b><span class="sub">подтверждение записи, напоминание, этап плана — человек их ждёт</span></span></div>
   <div class="li"><i>✓</i><span><b>Не больше 2 сообщений в неделю</b><span class="sub">ограничение настраивается</span></span></div>
   <div class="li"><i>✓</i><span><b>Отписка работает</b><span class="sub">пациент пишет «стоп» — рассылки выключаются, служебные остаются</span></span></div>
   <div class="note" style="--tone:var(--bad)"><b>Честно про WhatsApp</b><p>Green API работает через протокол WhatsApp Web. Если клиенты массово жмут «спам», номер могут заблокировать. Поэтому роботы отправляют то, чего человек ждёт, а рекламные рассылки — отдельно и аккуратно.</p></div>
  </div>
 </div>
</div>`;

SC.review=()=>`<div class="hd"><div><h2>Отзывы и репутация</h2>
 <p>Вы сказали, что нужна кнопка «чтобы отзыв написали». Она здесь: робот просит отзыв через два дня после процедуры — но сначала спрашивает, всё ли хорошо. Недовольный пациент попадает к вам, а не в 2ГИС.</p></div></div>
<div class="g21">
 <div class="pan"><h3>Развилка, которая бережёт рейтинг</h3>
  <div class="flow" style="grid-template-columns:repeat(4,1fr)">
   <div class="fbx on"><code>1 · ЧЕРЕЗ 2 ДНЯ</code><b>Как ощущения?</b><p>сообщение в WhatsApp от имени клиники</p></div>
   <div class="fbx"><code>2 · ХОРОШО</code><b>Ссылка на 2ГИС</b><p>просим отзыв там, где он нужен</p></div>
   <div class="fbx"><code>2 · НЕ ОЧЕНЬ</code><b>Задача директору</b><p>звонок в тот же день, до публичного отзыва</p></div>
   <div class="fbx"><code>3 · ИТОГ</code><b>4,9 из 5</b><p>41 отзыв за месяц</p></div>
  </div>
  <div style="margin-top:12px">${REVIEWS.map(r=>`<div class="li ${r.st>=5?'':r.st>=4?'n':'r'}"><i>${r.st}</i><span><b>${esc(r.n)} · ${esc(r.src)}</b><span class="sub">${esc(r.t)}</span>${r.ans?'<span class="tag g" style="margin-top:4px;display:inline-block">ответ дан</span>':'<span class="tag r" style="margin-top:4px;display:inline-block">нужен ответ</span>'}</span></div>`).join('')}</div>
 </div>
 <div>
  <div class="pan"><h3>Рейтинг</h3>
   <div class="odo"><div class="gauge" style="--p:98;--gc:var(--ok)"><div><b>4,9</b><small>2ГИС · 41 отзыв</small></div></div>
   <div><div class="kv"><span>За месяц</span><b>+17 отзывов</b></div>
    <div class="kv"><span>Средняя оценка</span><b>4,9</b></div>
    <div class="kv"><span>Отвечено</span><b>3 из 4</b></div>
    <div class="kv"><span>Перехвачено до публикации</span><b>6 недовольных</b></div></div></div>
  </div>
  <div class="pan"><h3>Рекомендации как канал</h3>
   <p>Пациент по рекомендации приносит 486 000 ₸ против 268 000 ₸ у таргетного. Робот благодарит за приведённого друга и предлагает уход в подарок.</p>
   <div class="kv"><span>Приведено за месяц</span><b>14 человек</b></div>
   <div class="kv"><span>Выручка с них</span><b>3 790 000 ₸</b></div>
   <div class="kv"><span>Стоимость канала</span><b>подарочные процедуры</b></div>
  </div>
 </div>
</div>`;
/* ====== НАСТРОЙКИ ====== */
SC.roles=()=>{
 const rows=[['Расписание и запись',1,1,1,1,0,0,1],['Карта пациента · медицина',1,0,1,0,0,0,1],
  ['План лечения · создать',1,0,1,0,0,0,0],['Скидка в плане',1,1,'до 10%',0,0,0,0],
  ['Прайс · изменить',1,1,0,0,0,0,0],['Себестоимость и маржа',1,1,0,0,0,1,0],
  ['Касса и оплаты',1,1,0,1,0,1,0],['Зарплаты',1,1,'своя',0,0,1,0],
  ['Воронки и сделки',1,0,0,1,1,0,0],['Реклама и отчёты',1,1,0,0,1,0,0],
  ['Склад и списания',1,1,1,0,0,1,1],['Выгрузка базы пациентов',1,0,0,0,0,0,0]];
 const cols=['Директор','Собственник','Врач','Админ','Маркет.','Бухг.','Медсестра'];
 const cell=v=>v===1?'<span class="tag g">да</span>':v===0?'<span class="tag">нет</span>':`<span class="tag w">${v}</span>`;
 return `<div class="hd"><div><h2>Права доступа</h2>
  <p>Вы сказали: «настройки прав, чтобы каждый видел своё». Права — это не только «показать или скрыть меню»: это ещё и запрет на действие. Администратор не поставит скидку, врач не выгрузит базу, маркетолог не увидит зарплаты.</p></div></div>
 <div class="tw"><table class="t">
  <thead><tr><th>Что можно</th>${cols.map(c=>`<th class="r">${c}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r=>`<tr><td><b>${r[0]}</b></td>${r.slice(1).map(v=>`<td class="r">${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <div class="g3" style="margin-top:12px">
  <div class="pan"><h3>Журнал действий</h3>
   <div class="li"><i>·</i><span><b>Айгерим открыла карту Сауле М.</b><span class="sub">сегодня 10:04</span></span></div>
   <div class="li"><i>·</i><span><b>Мадина изменила запись 14:00 → 16:00</b><span class="sub">сегодня 08:55 · пациент уведомлён</span></span></div>
   <div class="li w"><i>!</i><span><b>Попытка выгрузить базу пациентов</b><span class="sub">роль «Администратор» · отказано, событие записано</span></span></div>
   <div class="li"><i>·</i><span><b>Санжар изменил цену на нити</b><span class="sub">вчера 19:12 · 36 000 → 38 000 ₸</span></span></div>
  </div>
  <div class="pan"><h3>Когда сотрудник уходит</h3>
   <div class="li"><i>✓</i><span><b>Доступ выключается за секунду</b><span class="sub">переписка, база и записи остаются в клинике</span></span></div>
   <div class="li"><i>✓</i><span><b>Его пациенты переназначаются</b><span class="sub">другому врачу, с историей</span></span></div>
   <div class="li"><i>✓</i><span><b>Видно, что он делал</b><span class="sub">журнал за весь период работы</span></span></div>
   <div class="note" style="--tone:var(--bad)"><b>Сейчас это риск</b><p>Пока переписка ведётся с личного телефона администратора, вместе с ним уходит и база. В портале так не получится.</p></div>
  </div>
  <div class="pan"><h3>Роли настраиваются</h3>
   <p>Семь ролей — это старт. Добавить «управляющую», «старшего врача» или «маркетолога на аутсорсе» с урезанным доступом можно за пять минут, без разработки.</p>
   <button class="bt" style="width:100%;margin-top:8px" onclick="switchRole('Администратор')">Посмотреть глазами администратора</button>
  </div>
 </div>`};

SC.integr=()=>`<div class="hd"><div><h2>Интеграции: что и как подключается</h2>
 <p>Ничего «замудрённого». Всё, что нужно от вас, — доступы. Подключение, настройка и проверка — наша часть работы и входит в стоимость.</p></div></div>
<div class="tw"><table class="t">
 <thead><tr><th>Что подключаем</th><th>Через что</th><th>Что нужно от вас</th><th>Стоимость сервиса</th><th>Когда</th></tr></thead>
 <tbody>
  <tr><td><b>WhatsApp · бизнес-номер</b><span class="sub">переписка, напоминания, планы лечения</span></td><td>Green API</td><td>телефон и сканирование QR</td><td>5 000 ₸/мес сервису</td><td><span class="tag b">1-й этап</span></td></tr>
  <tr><td><b>Instagram Direct</b><span class="sub">сообщения и заявки из Direct</span></td><td>официальный API</td><td>доступ к бизнес-аккаунту</td><td>бесплатно</td><td><span class="tag b">1-й этап</span></td></tr>
  <tr><td><b>Лид-формы Instagram / Facebook</b><span class="sub">заявки сразу в воронку с процедурой</span></td><td>официальный API</td><td>доступ к рекламному кабинету</td><td>бесплатно</td><td><span class="tag b">1-й этап</span></td></tr>
  <tr><td><b>Телефония · ваш SIP-номер</b><span class="sub">звонки из браузера, записи, история</span></td><td>Sipuni или Binotel</td><td>логин и пароль от кабинета</td><td>по тарифу оператора</td><td><span class="tag b">1-й этап</span></td></tr>
  <tr><td><b>Telegram</b><span class="sub">второй канал переписки</span></td><td>бот клиники</td><td>ничего</td><td>бесплатно</td><td><span class="tag b">1-й этап</span></td></tr>
  <tr><td><b>Онлайн-запись на сайт и в Instagram</b><span class="sub">ссылка и виджет</span></td><td>наш модуль</td><td>доступ к сайту</td><td>входит</td><td><span class="tag b">1-й этап</span></td></tr>
  <tr><td><b>Kaspi · оплата по ссылке</b><span class="sub">предоплата за запись, оплата этапа</span></td><td>Kaspi Business</td><td>договор эквайринга</td><td>комиссия банка</td><td><span class="tag w">2-й этап</span></td></tr>
  <tr><td><b>Онлайн-касса и фискализация</b><span class="sub">чек пациенту</span></td><td>ваш оператор ККМ</td><td>доступы к кассе</td><td>по тарифу</td><td><span class="tag w">2-й этап</span></td></tr>
  <tr><td><b>Подписание документов ЭЦП</b><span class="sub">договор по ссылке из WhatsApp</span></td><td>отдельный модуль</td><td>шаблоны договоров</td><td>опция, отдельно</td><td><span class="tag">опция</span></td></tr>
  <tr><td><b>1С / бухгалтерия</b><span class="sub">выгрузка выручки и зарплат</span></td><td>обмен файлами</td><td>требования бухгалтера</td><td>опция, отдельно</td><td><span class="tag">опция</span></td></tr>
 </tbody></table></div>
<div class="g2" style="margin-top:12px">
 <div class="pan"><h3>Почему WhatsApp именно так</h3>
  <div class="kv"><span>WhatsApp Business API (официальный)</span><b>от 15 до 60 ₸ за сообщение + согласования</b></div>
  <div class="kv"><span>Green API (протокол WhatsApp Web)</span><b>5 000 ₸/мес за номер</b></div>
  <div class="kv"><span>Интеграция WhatsApp в amoCRM</span><b>36 000 ₸/мес</b></div>
  <div class="note"><b>Что выбираем</b><p>Для клиники с системными сообщениями — Green API: дешевле в семь раз и ставится за день. Риск один: если пациенты массово жмут «спам», номер могут заблокировать. Поэтому роботы шлют только то, чего человек ждёт.</p></div>
 </div>
 <div class="pan"><h3>Кто за что отвечает</h3>
  <div class="li"><i>✓</i><span><b>Мы</b><span class="sub">подключение, настройка, проверка, поддержка связок после запуска</span></span></div>
  <div class="li n"><i>·</i><span><b>Вы</b><span class="sub">доступы: рекламный кабинет, бизнес-аккаунт, кабинет телефонии, номер WhatsApp</span></span></div>
  <div class="li b"><i>·</i><span><b>Сервисы</b><span class="sub">оплачиваются напрямую им, не через нас, без наценки</span></span></div>
  <div class="said"><b>Вы сказали на встрече</b><i>«Ещё оплатить отдельного человечка, который бы всё это настроил, — ну как бы нет»</i>. Отдельный человек не нужен: настройка входит в работу, а дальше всё работает без администрирования.</div>
 </div>
</div>`;

SC.migr=()=>`<div class="hd"><div><h2>Переход с Altegio и amoCRM — за 2–3 месяца, без остановки клиники</h2>
 <p>Никто не выключает старые системы в понедельник утром. Мы запускаем ядро, переносим данные, две-три недели работаем параллельно — и только когда в новом портале всё, от Altegio и amo можно отказываться.</p></div></div>
<div class="bays">
 <div class="bay" style="--c:#2f8f5b"><small>Недели 1–3</small><b>Ядро</b><div class="who">Воронки, запись, карточка пациента, план лечения</div><div class="prg"><i style="--w:100%"></i></div><div class="tm"><span>перенос базы пациентов</span><span>готово</span></div></div>
 <div class="bay" style="--c:#a8764a"><small>Недели 3–5</small><b>Связки</b><div class="who">WhatsApp, Instagram, лид-формы, телефония, роботы</div><div class="prg"><i style="--w:64%"></i></div><div class="tm"><span>параллельная работа</span><span>идёт</span></div></div>
 <div class="bay" style="--c:#cf8a22"><small>Недели 5–6</small><b>Полировка</b><div class="who">Ваши правки: поля, кнопки, тексты, отчёты</div><div class="prg"><i style="--w:28%"></i></div><div class="tm"><span>по вашему списку</span><span>—</span></div></div>
 <div class="bay" style="--c:#7a6595"><small>Месяц 2–3</small><b>Отказ от аренды</b><div class="who">Altegio и amoCRM больше не нужны</div><div class="prg"><i style="--w:0%"></i></div><div class="tm"><span>когда вы скажете</span><span>—</span></div></div>
</div>
<div class="g21">
 <div class="pan"><h3>Что переносим и как</h3>
  <div class="tw"><table class="t">
   <thead><tr><th>Что</th><th>Откуда</th><th class="r">Объём</th><th>Как</th><th>Статус</th></tr></thead>
   <tbody>
    <tr><td><b>Пациенты и контакты</b></td><td>Altegio + amoCRM</td><td class="r">1 248</td><td>выгрузка + склейка дублей</td><td><span class="tag g">перенесено</span></td></tr>
    <tr><td><b>История визитов</b></td><td>Altegio</td><td class="r">4 610</td><td>выгрузка по датам и врачам</td><td><span class="tag g">перенесено</span></td></tr>
    <tr><td><b>Сделки и этапы</b></td><td>amoCRM</td><td class="r">862</td><td>раскладываем по новым воронкам</td><td><span class="tag w">идёт</span></td></tr>
    <tr><td><b>Переписка WhatsApp</b></td><td>amoCRM</td><td class="r">за 12 мес.</td><td>привязываем к пациентам</td><td><span class="tag w">идёт</span></td></tr>
    <tr><td><b>Записи на будущее</b></td><td>Altegio</td><td class="r">74</td><td>переносим в расписание с уведомлением</td><td><span class="tag">после связок</span></td></tr>
    <tr><td><b>Прайс и услуги</b></td><td>Altegio</td><td class="r">86</td><td>с группировкой и себестоимостью</td><td><span class="tag g">перенесено</span></td></tr>
   </tbody></table></div>
  <div class="hint"><b>Склейка дублей</b> — отдельная работа: один и тот же человек часто заведён и в Altegio, и в amo с разными телефонами. Мы показываем список спорных пар, вы подтверждаете — база получается чистой с первого дня.</div>
 </div>
 <div>
  <div class="pan"><h3>Про оплаченный Altegio</h3>
   <div class="li"><i>·</i><span><b>Деньги уже потрачены</b><span class="sub">оплачено на три года вперёд — это не аргумент против портала, но и не экономия</span></span></div>
   <div class="li n"><i>·</i><span><b>Можно не спешить</b><span class="sub">Altegio остаётся включённым сколько нужно: параллельная работа ничего не стоит</span></span></div>
   <div class="li b"><i>·</i><span><b>Можно попробовать перерасчёт</b><span class="sub">некоторые сервисы возвращают неиспользованный период — вопрос к вашему менеджеру</span></span></div>
   <div class="li w"><i>·</i><span><b>А вот amoCRM выключается сразу</b><span class="sub">как только воронки переедут — это ежемесячный платёж по числу сотрудников</span></span></div>
  </div>
  <div class="pan"><h3>Обучение</h3>
   <div class="kv"><span>Администратор</span><b>2 часа</b></div>
   <div class="kv"><span>Врачи</span><b>1 час · план лечения</b></div>
   <div class="kv"><span>Директор</span><b>2 часа · отчёты и настройки</b></div>
   <div class="kv"><span>Видеоинструкции</span><b>остаются у вас</b></div>
   <div class="kv"><span>Первый месяц</span><b>отвечаем на вопросы ежедневно</b></div>
  </div>
 </div>
</div>`;

SC.stack=()=>`<div class="hd"><div><h2>Состав первого релиза и стоимость</h2>
 <p>Стандартный пакет разработки — 1 500 000 ₸. Это разовая стоимость: абонентской платы за систему нет, количество сотрудников на цену не влияет. Срок — 4–6 недель, ядро вы увидите через 2–3 недели.</p></div>
 <div class="btns"><button class="bt p" onclick="go('econ')">Посчитать экономию</button></div></div>
<div class="g2">
 <div class="pan"><h3>Что входит в 1 500 000 ₸</h3>
  <div class="li"><i>✓</i><span><b>Воронки и сделки</b><span class="sub">первичная, повторная по плану лечения, маркетинговые; создание новых воронок кнопкой</span></span></div>
  <div class="li"><i>✓</i><span><b>Лиды и источники</b><span class="sub">лид-формы, разделение таргет / органика, процедура из формы, таймер ответа</span></span></div>
  <div class="li"><i>✓</i><span><b>Диалоги</b><span class="sub">WhatsApp, Instagram Direct, Telegram в одном окне, привязка к пациенту</span></span></div>
  <div class="li"><i>✓</i><span><b>Телефония</b><span class="sub">ваш SIP-номер через Sipuni/Binotel, звонок из браузера, история и записи</span></span></div>
  <div class="li"><i>✓</i><span><b>Расписание и онлайн-запись</b><span class="sub">кабинеты, врачи, перенос мышкой, ссылка для Instagram и 2ГИС</span></span></div>
  <div class="li"><i>✓</i><span><b>Карта пациента</b><span class="sub">история, медицинская часть, фото до/после, документы, деньги</span></span></div>
  <div class="li"><i>✓</i><span><b>План лечения с калькулятором</b><span class="sub">процедуры кнопками, три прайса, скидки, этапы, печать на бланке, отправка в WhatsApp</span></span></div>
  <div class="li"><i>✓</i><span><b>Склад и себестоимость</b><span class="sub">партии, сроки годности, списание от процедуры, маржа</span></span></div>
  <div class="li"><i>✓</i><span><b>Касса и финансы</b><span class="sub">оплаты, авансы, рассрочка по этапам, отчёт по прибыли</span></span></div>
  <div class="li"><i>✓</i><span><b>Зарплаты и KPI</b><span class="sub">проценты врачей от выполненных процедур, премии, выгрузка</span></span></div>
  <div class="li"><i>✓</i><span><b>Роботы и напоминания</b><span class="sub">подтверждение за 3 дня, напоминание за сутки, неявка, этап плана, отзыв, пропущенный звонок</span></span></div>
  <div class="li"><i>✓</i><span><b>Права доступа и журнал</b><span class="sub">роли, ограничения на действия, история изменений</span></span></div>
  <div class="li"><i>✓</i><span><b>Перенос данных и обучение</b><span class="sub">из Altegio и amoCRM, склейка дублей, обучение команды</span></span></div>
 </div>
 <div>
  <div class="pan"><h3>Стоимость и платежи</h3>
   <div class="kv"><span>Стандартный пакет разработки</span><b>1 500 000 ₸</b></div>
   <div class="kv"><span>Старт работ — 10%</span><b>150 000 ₸</b></div>
   <div class="kv"><span>Ядро принято — 45%</span><b>675 000 ₸</b></div>
   <div class="kv"><span>Полная сдача — 45%</span><b>675 000 ₸</b></div>
   <div class="kv"><span>Абонентская плата за систему</span><b style="color:var(--ok)">нет</b></div>
   <div class="kv"><span>Плата за сотрудников</span><b style="color:var(--ok)">нет</b></div>
   <div class="kv"><span>Сервер и обслуживание</span><b>12 000 ₸/мес</b></div>
   <div class="note" style="--tone:var(--ok)"><b>Почему 10% в начале</b><p>Символическая сумма на старт — подтверждение намерений с обеих сторон. Основные деньги вы платите за результат: после того, как увидели и приняли ядро.</p></div>
  </div>
  <div class="pan"><h3>Сроки</h3>
   <div class="kv"><span>Ядро системы</span><b>2–3 недели</b></div>
   <div class="kv"><span>Полная сдача</span><b>4–6 недель</b></div>
   <div class="kv"><span>Месяц полировки после запуска</span><b>входит</b></div>
   <div class="kv"><span>Гарантия</span><b>6 месяцев</b></div>
   <div class="kv"><span>Доработки после гарантии</span><b>по часам</b></div>
   <div class="hint">Срок держится при одном условии: вы согласовываете экраны в течение 1–2 дней. Это единственное, что реально сдвигает сроки.</div>
  </div>
  <div class="pan"><h3>Что не входит</h3>
   <div class="li w"><i>·</i><span><b>Подписание документов ЭЦП</b><span class="sub">отдельный модуль, считается отдельно</span></span></div>
   <div class="li w"><i>·</i><span><b>Онлайн-касса и фискализация</b><span class="sub">второй этап, после эквайринга</span></span></div>
   <div class="li w"><i>·</i><span><b>Выгрузка в 1С</b><span class="sub">опция по требованиям бухгалтера</span></span></div>
   <div class="li w"><i>·</i><span><b>Мобильное приложение для пациентов</b><span class="sub">отдельный проект; онлайн-запись работает с телефона и без него</span></span></div>
   <div class="li w"><i>·</i><span><b>Вторая и третья клиника</b><span class="sub">архитектура готова, подключение филиала — отдельная работа</span></span></div>
  </div>
 </div>
</div>`;

/* ====== ИНТЕРАКТИВ ====== */
function setFunnel(k){funnel=k;render();toast(`Воронка «${FUNNELS[k].n}». У каждой воронки свои стадии, свои правила и свои роботы — но пациент один и тот же.`)}
let newF=0;
function addFunnel(){
 newF++;const k='f'+newF;
 FUNNELS[k]={n:'Новая воронка '+newF,st:[['s1','Первый контакт','#7a6595'],['s2','В работе','#3b7a9e'],['s3','Успех','#2f8f5b']]};
 funnel=k;render();
 toast('Воронка создана за секунду: задайте стадии, подключите рассылку и правила — <b>без программиста и без доплаты за каждое поле</b>. Так запускаются акции.');
}
let dragId=null;
function dragDeal(e,id){dragId=id;e.target.classList.add('drag');try{e.dataTransfer.setData('text/plain',id)}catch(_){}}
function colOver(e,el){e.preventDefault();el.classList.add('over')}
function dropDeal(e,st,el){e.preventDefault();el.classList.remove('over');
 const d=DEALS.find(x=>x.id===dragId);if(!d)return;
 const was=FUNNELS[d.f].st.find(s=>s[0]===d.s),now=FUNNELS[funnel].st.find(s=>s[0]===st);
 d.s=st;render();
 const msg={rec:'пациенту ушло подтверждение записи, кабинет занят в расписании',
  plan:'сумма плана подтянулась в сделку, робот напомнит через 3 дня',
  pay:'оплата привязалась к плану лечения, остаток пересчитан',
  done:'процедура закрыта, препараты списаны, врачу начислен процент, сделка ушла в воронку повторных'}[st];
 toast(`«${esc(d.n)}»: ${was?was[1]:'—'} → <b>${now?now[1]:st}</b>.${msg?' Автоматически: '+msg+'.':''}`);
}
function openDeal(id){const d=DEALS.find(x=>x.id===id);if(!d)return;
 openM(esc(d.n)+' · '+esc(d.id),esc(d.proc)+' · '+esc(d.src),`
  <div class="wid" style="grid-template-columns:repeat(3,1fr)">
   <div><small>Сумма сделки</small><b class="a">${d.sum?fmt(d.sum)+' ₸':'—'}</b><span>из плана лечения</span></div>
   <div><small>Источник</small><b style="font-size:14px">${esc(d.src)}</b><span>проставлен автоматически</span></div>
   <div><small>Статус</small><b style="font-size:14px">${esc(d.d)}</b><span>${d.hot?'горячий':'в работе'}</span></div>
  </div>
  <div class="pan"><h3>Что в карточке</h3>
   <div class="kv"><span>Телефон</span><b>${esc(d.ph)}</b></div>
   <div class="kv"><span>Процедура из лид-формы</span><b>${esc(d.proc)}</b></div>
   <div class="kv"><span>Переписка</span><b>WhatsApp, 12 сообщений</b></div>
   <div class="kv"><span>Звонки</span><b>2 · последний 2:41</b></div>
   <div class="kv"><span>Ответственный</span><b>Мадина</b></div>
   <div class="kv"><span>Следующий шаг</span><b>подтвердить визит</b></div>
  </div>
  <div class="pan"><h3>Действия прямо отсюда</h3>
   <div class="btns" style="justify-content:flex-start">
    <button class="bt p" onclick="closeM();go('chats')">Написать в WhatsApp</button>
    <button class="bt" onclick="toast('Звонок идёт из браузера через ваш SIP-номер.')">Позвонить</button>
    <button class="bt" onclick="closeM();go('sched')">Записать</button>
    <button class="bt v" onclick="closeM();go('plan')">Собрать план лечения</button>
   </div>
   <div class="hint">Сейчас для этого нужно открыть amoCRM, найти сделку, потом открыть Altegio, найти окно, потом вернуться и вписать комментарий. Здесь это одна карточка.</div>
  </div>`);
}
const NAMES=['Асем Т.','Нургуль К.','Айжан С.','Меруерт Б.','Лаура Ж.','Индира М.','Диана А.','Зарина Н.'];
const PROCS=['Нитевая подтяжка','Филлеры губы','Ботокс лоб','Липофилинг','Биоревитализация','Лазерная шлифовка'];
let lid=1043;
function addLead(){simLead(0)}
function simLead(auto){
 const n=NAMES[Math.floor(Math.random()*NAMES.length)],p=PROCS[Math.floor(Math.random()*PROCS.length)];
 const src=Math.random()>.45?'Таргет · лид-форма':'Instagram Direct';
 const d={id:'L-'+(++lid),n,ph:'+7 7·· ··· '+Math.floor(10+Math.random()*89)+' '+Math.floor(10+Math.random()*89),
  s:'new',f:'prim',src,proc:p,sum:PROCS.indexOf(p)===3?420000:Math.floor(4+Math.random()*10)*19000,d:'только что',hot:src.indexOf('Таргет')===0?1:0};
 DEALS.unshift(d);
 if(cur!=='funnel'&&cur!=='leads'){funnel='prim';go('funnel')}else{funnel='prim';render()}
 const c=document.querySelector('.pc');if(c)c.classList.add('new');
 sparks(14);
 toast(`Новое обращение: <b>${esc(n)}</b> · ${esc(p)} · ${esc(src)}. Источник и процедура проставлены из формы, сделка в воронке, задача администратору, таймер ответа 15 минут пошёл.`);
}
function openSrc(n){openM('Источник · '+esc(n),'как считается и что с этим делать',`
 <div class="pan"><h3>Как определяется источник</h3>
  <div class="li"><i>1</i><span><b>Лид-форма</b><span class="sub">приходит по API вместе с кампанией, объявлением и ответами на вопросы формы</span></span></div>
  <div class="li"><i>2</i><span><b>Переход по ссылке</b><span class="sub">в рекламной ссылке метка — она сохраняется в карточке</span></span></div>
  <div class="li"><i>3</i><span><b>Direct и WhatsApp без метки</b><span class="sub">считаются органикой, администратор может уточнить «откуда о нас узнали»</span></span></div>
  <div class="li"><i>4</i><span><b>Рекомендация</b><span class="sub">выбирается из списка пациентов — тому, кто привёл, начисляется благодарность</span></span></div>
 </div>
 <div class="pan"><h3>Что дальше</h3><p class="mini">По каждому источнику считается не число лидов, а деньги: сколько дошло до кассы и сколько вернулось повторно. Бюджет двигается туда, где окупаемость выше.</p></div>`)}
function openChat(id){chatCur=id;render()}

/* телефония */
let callN=0;
function incomingCall(){
 callN++;
 const p=PATIENTS[callN%PATIENTS.length];
 openM('☎ Входящий звонок','номер определён по базе пациентов',`
  <div class="callbar ring"><span class="av p">↙</span><div style="flex:1"><b>${esc(p.n)}</b><span class="sub">${esc(p.ph)} · ${p.visits} ${plural(p.visits,['визит','визита','визитов'])} · последний план: ${esc(p.plan)}</span></div><span class="tag w">звонит…</span></div>
  <div class="pan"><h3>Что администратор видит до того, как снял трубку</h3>
   <div class="kv"><span>Пациент</span><b>${esc(p.n)}, ${p.age} ${plural(p.age,['год','года','лет'])}</b></div>
   <div class="kv"><span>Врач</span><b>${esc(p.doc)}</b></div>
   <div class="kv"><span>Оплачено всего</span><b>${fmt(p.sum)} ₸</b></div>
   <div class="kv"><span>Текущий план</span><b>${esc(p.plan)}</b></div>
   <div class="kv"><span>Следующий визит</span><b>${esc(p.next)}</b></div>
   <div class="kv"><span>Аллергии</span><b style="color:var(--bad)">лидокаин</b></div>
  </div>
  <div class="pan"><h3>После разговора</h3>
   <div class="li"><i>✓</i><span><b>Запись разговора</b><span class="sub">хранится в кабинете телефонии, ссылка — в карте пациента</span></span></div>
   <div class="li"><i>✓</i><span><b>Итог звонка</b><span class="sub">администратор выбирает из списка: записан, перенёс, думает, отказ</span></span></div>
   <div class="li"><i>✓</i><span><b>Задача и напоминание</b><span class="sub">если «думает» — перезвонить через 2 дня</span></span></div>
   <div class="li n"><i>+</i><span><b>Если пропущен</b><span class="sub">робот сам пишет в WhatsApp через 2 минуты</span></span></div>
  </div>
  <div class="btns" style="justify-content:flex-start"><button class="bt p" onclick="closeM();go('calls')">Открыть телефонию</button><button class="bt" onclick="closeM()">Закрыть</button></div>`);
}
function playRec(i){
 const c=CALLS[i];
 openM('Запись разговора · '+esc(c.n),esc(c.t)+' · '+esc(c.dur)+' · '+esc(c.who),`
  <div class="pan"><div class="play"><button class="bt p">▶</button><div class="wave"><i style="--w:38%"></i></div><span class="mono">1:02 / ${esc(c.dur)}</span></div>
   <div class="hint" style="margin-top:12px">Записи хранятся в кабинете телефонии (Sipuni), портал показывает их в карточке пациента и в журнале. Это важно: записи не занимают ваш сервер и остаются доступны по вашему тарифу оператора.</div></div>
  <div class="pan"><h3>Итог звонка</h3>
   <div class="kv"><span>Результат</span><b>${esc(c.res)}</b></div>
   <div class="kv"><span>Сделка</span><b>перешла в «Записан на консультацию»</b></div>
   <div class="kv"><span>Задача</span><b>подтвердить за 3 дня — поставлена роботом</b></div></div>`);
}

/* расписание */
let dragA=null;
function dragAppt(e,id){dragA=id;e.target.classList.add('drag')}
function slotOver(e,el){e.preventDefault();el.classList.add('over')}
function dropAppt(e,r,t,el){e.preventDefault();el.classList.remove('over');
 const a=APPTS.find(x=>x.id===dragA);if(!a)return;
 const ot=a.t,orm=a.r;a.t=t;a.r=r;render();
 toast(`${esc(a.n)}: ${ot} ${esc(ROOMS[orm])} → <b>${t} ${esc(ROOMS[r])}</b>. Пациенту автоматически ушло сообщение с новым временем, врачу — уведомление, препараты перебронированы на новую дату.`);
}
function openAppt(id){const a=APPTS.find(x=>x.id===id);if(!a)return;
 openM(esc(a.n)+' · '+esc(a.t),esc(a.p)+' · '+esc(ROOMS[a.r]),`
  <div class="pan"><h3>Запись</h3>
   <div class="kv"><span>Процедура</span><b>${esc(a.p)}</b></div>
   <div class="kv"><span>Длительность</span><b>${a.dur} ${plural(a.dur,['час','часа','часов'])}</b></div>
   <div class="kv"><span>Кабинет</span><b>${esc(ROOMS[a.r])}</b></div>
   <div class="kv"><span>Статус</span><b>${esc(a.st)}</b></div>
   <div class="kv"><span>Препараты забронированы</span><b>да, партия указана</b></div>
   <div class="kv"><span>Согласие</span><b>подписано</b></div>
  </div>
  <div class="btns" style="justify-content:flex-start">
   <button class="bt p" onclick="toast('Приём закрыт: препараты списаны по партиям, выручка учтена, врачу начислен процент, через 2 дня уйдёт запрос отзыва.');closeM()">Закрыть приём</button>
   <button class="bt" onclick="toast('Перенос: выберите новое время — пациент получит сообщение автоматически.');closeM()">Перенести</button>
   <button class="bt" onclick="closeM();go('card')">Карта пациента</button></div>`);
}
function pickSlot(t){slotSel=t;render()}
function bookSlot(){
 if(!slotSel){toast('Выберите время — так же, как это делает пациент со своего телефона.');return}
 sparks(16);
 toast(`Запись на <b>${slotSel}</b> создана: кабинет занят в расписании, сделка появилась в воронке с источником «онлайн-запись», пациенту ушло подтверждение в WhatsApp. Администратор при этом ничего не делал.`);
}

/* план лечения */
function addProc(k){CART[k]=(CART[k]||0)+1;render()}
function incP(k,d){CART[k]=Math.max(0,(CART[k]||0)+(d===-99?-999:d));render()}
function setDisc(v){disc=+v;render()}
function setStages(v){stages=+v;render()}
function setTariff(t){tariff=t;render();toast(`Тариф «${TARIFF[t].n}» — ${TARIFF[t].note}. Цены в плане пересчитались, врач ничего не считает в уме.`)}
function clearPlan(){CART={};render()}
function sendPlan(){const r=planCalc();
 if(!r.items.length){toast('Сначала соберите план — нажмите на процедуры слева.');return}
 sparks(18);
 openM('План отправлен в WhatsApp','пациент открывает его в телефоне сразу',`
  <div class="chat">
   <div class="msg out">${esc(planPat)}, спасибо за визит! Ваш план лечения от 16.09.2026:<br>
   ${r.items.map(x=>'• '+esc(x.n)+' — '+x.q+' '+esc(x.u)+' — '+fmt(x.sum)+' ₸').join('<br>')}<br>
   Скидка ${disc}% — ${fmt(r.dsum)} ₸<br><b>Итого: ${fmt(r.total)} ₸</b><br>
   Можно разбить на ${stages} ${plural(stages,['визит','визита','визитов'])} по ${fmt(r.per)} ₸.<br>
   PDF с планом и подготовкой: estetica.kz/plan/PL-2026-0184<small>16:42 · Айгерим</small></div>
   <div class="msg sys">Сделка в воронке получила сумму ${fmt(r.total)} ₸ и перешла в стадию «План лечения выдан». Робот напомнит через 3 дня, если решения не будет.</div>
  </div>
  <div class="pan" style="margin-top:12px"><h3>Почему это работает лучше бумаги</h3>
   <div class="kv"><span>Открывают план в телефоне</span><b>86%</b></div>
   <div class="kv"><span>Показывают мужу / подруге</span><b>чаще, чем бумагу</b></div>
   <div class="kv"><span>Средний срок до оплаты</span><b>3,4 дня</b></div>
   <div class="kv"><span>Бумага при этом тоже есть</span><b>печатается на бланке</b></div></div>`);
}
function openProc(k){const p=PMAP[k];
 openM(esc(p.n),esc(p.g)+' · '+esc(p.note),`
  <div class="wid" style="grid-template-columns:repeat(3,1fr)">
   <div><small>Базовая цена</small><b class="a">${fmt(p.p)} ₸</b><span>за ${esc(p.u)}</span></div>
   <div><small>Расходники</small><b>${p.c?fmt(p.c)+' ₸':'—'}</b><span>из последней партии</span></div>
   <div><small>Маржа</small><b class="g">${p.p?Math.round((p.p-p.c)/p.p*100):0}%</b><span>до зарплаты врача</span></div>
  </div>
  <div class="pan"><h3>Карточка процедуры</h3>
   <div class="kv"><span>Длительность</span><b>60–90 минут</b></div>
   <div class="kv"><span>Кабинет</span><b>процедурный</b></div>
   <div class="kv"><span>Норма списания</span><b>по факту, с указанием партии</b></div>
   <div class="kv"><span>Подготовка пациента</span><b>памятка уходит в WhatsApp</b></div>
   <div class="kv"><span>Реабилитация</span><b>памятка и контроль через 14 дней</b></div>
   <div class="kv"><span>Процент врача</span><b>настраивается отдельно</b></div>
  </div>`);
}
function openStock(n){openM('Препарат · '+esc(n),'партии, списания и себестоимость',`
 <div class="pan"><h3>Движение</h3>
  <div class="li"><i>+</i><span><b>Приход · партия FL-2409</b><span class="sub">12.08 · 20 шт · 38 000 ₸/шт · срок 03.2027</span></span></div>
  <div class="li"><i>−</i><span><b>Списание</b><span class="sub">14.09 · 1 шт · Сауле М. · Айгерим</span></span></div>
  <div class="li"><i>−</i><span><b>Списание</b><span class="sub">11.09 · 2 шт · Дана Е. · Нурлан</span></span></div>
  <div class="li w"><i>!</i><span><b>Бронь под план лечения</b><span class="sub">22.09 · 1 шт · Сауле М. · этап 2</span></span></div>
 </div>
 <div class="pan"><h3>Зачем партии</h3><p class="mini">Партия связывает препарат с пациентом. Если поставщик отзывает серию или у пациента реакция — за минуту видно, кому и когда этой партией работали. В бумажном журнале это часы работы, и то не всегда.</p></div>`)}
function orderStock(){sparks(12);
 toast('Заявка собрана автоматически по позициям ниже минимума: ботулотоксин 100 ед. — 4 шт, набор для пилинга — 5 шт. Остаётся отправить поставщику; после приёмки себестоимость пересчитается сама.');}

/* роботы */
function toggleRobot(i){ROBOTS[i].on=ROBOTS[i].on?0:1;render();
 toast(`Робот «${esc(ROBOTS[i].n)}» ${ROBOTS[i].on?'включён':'выключен'}. Тексты и время вы меняете сами — это настройка, а не разработка.`)}
function runDay(){
 const steps=[
  ['09:00','Подтверждение за 3 дня','12 пациентам, записанным на 19 сентября'],
  ['09:05','Напоминание за сутки','7 пациентам на завтра · 2 уже ответили «буду»'],
  ['11:30','Пропущенный звонок','+7 776 ··· 52 11 — робот написал в WhatsApp через 2 минуты'],
  ['14:30','Пациент не пришёл','Мадина Т. · задача администратору, сделка вернулась в воронку'],
  ['16:00','Этап плана подошёл','Камиле Р. — этап 2 через 5 дней, предложена запись'],
  ['18:00','Запрос отзыва','2 пациентам после вчерашних процедур'],
  ['19:30','Отчёт директору','выручка дня, незакрытый приём, склад ниже минимума']];
 const el=document.getElementById('dayrun');if(!el)return;
 el.innerHTML='';let i=0;
 const tick=()=>{if(i>=steps.length){toast('Это один обычный день. Семь роботов сделали 24 действия — администратор не нажал ни одной кнопки.');return}
  const [t,n,d]=steps[i++];
  el.insertAdjacentHTML('beforeend',`<div class="li b"><i>${i}</i><span><b>${t} · ${esc(n)}</b><span class="sub">${esc(d)}</span></span></div>`);
  setTimeout(tick,760)};
 tick();
}

/* экономика */
function econSet(k,v){ECON[k]=+v;render()}
function econToggle(k){ECON[k]=ECON[k]?0:1;render();
 if(k==='alt'&&ECON.alt)toast('Включили Altegio в расчёт. Помните: он у вас уже оплачен на три года — экономия по этой строке появится только после окончания оплаченного периода.');}

function searchDemo(v){
 if(!v)return;
 toast(`Поиск «${esc(v)}»: ищем по пациентам, телефонам, процедурам, сделкам, планам лечения и даже по фразам из переписки. В демо поиск показан как принцип — в системе он сквозной по всем разделам.`);
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
 role=ROLES[k]?k:'Директор';
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
 document.getElementById('ttl').textContent=SUBN[cur]||'Пульт';
 document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('funnel')?'':'none';
 const c=document.getElementById('callBtn');if(c)c.style.display=allowed('calls')?'':'none';
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
 t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6200)}
function sparks(n){for(let i=0;i<n;i++){const s=document.createElement('i');s.className='spark';
 s.style.left=(14+Math.random()*72)+'vw';
 s.style.background=['#a8764a','#e2b87e','#7a6595','#c0637f'][i%4];
 s.style.borderRadius=i%2?'50%':'2px';
 s.style.animationDelay=(Math.random()*.4)+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),2300)}}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();
 toast(theme==='dark'?'Тёмная тема — для вечерней смены и для проектора.':'Светлая тема.')}

/* ====== СЦЕНАРИЙ ПОКАЗА ====== */
const TOUR=[
 ['dash','Пульт: выручка, пациенты, воронка и то, что требует вас — на одном экране. Сейчас эти цифры лежат в двух системах и в голове.'],
 ['funnel','Воронки. Переключите вкладки: первичные, повторные по плану лечения, акция. Карточки перетаскиваются мышкой — попробуйте.'],
 ['leads','Лиды: таргет и органика разделены автоматически, процедура берётся из лид-формы. Нажмите «Смоделировать лид с таргета».'],
 ['plan','Главный экран: план лечения. Врач нажимает процедуры кнопками — сумма, скидка, этапы и рассрочка считаются сами.'],
 ['blank','И тот же план на фирменном бланке: печать для пациента и отправка в WhatsApp одной кнопкой.'],
 ['sched','Расписание кабинетов: перенесите запись мышкой — пациент получит сообщение автоматически.'],
 ['online','Онлайн-запись для Instagram и 2ГИС: пациент сам выбирает время, а сделка появляется в воронке.'],
 ['chats','WhatsApp, Instagram и Telegram в одном окне, с историей и привязкой к пациенту.'],
 ['calls','Телефония: ваш SIP-номер, звонок из браузера, определение пациента до снятия трубки.'],
 ['robots','Роботы: подтверждение за 3 дня и напоминание за сутки — как в Altegio, плюс шесть, которых там нет. Нажмите «Прогнать день».'],
 ['writeoff','Себестоимость процедуры: сколько ушло препаратов, сколько врачу и что осталось клинике.'],
 ['migr','Переход с Altegio и amoCRM за 2–3 месяца, без остановки клиники.'],
 ['econ','И счёт: сколько вы платите за аренду чужих систем и сколько стоит своя.'],
 ['stack','Состав первого релиза: 1 500 000 ₸, оплата 10 / 45 / 45, срок 4–6 недель, абонплаты нет.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;
 document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;
 if(ti>=TOUR.length){stopTour();toast('Сценарий показа закончен. Дальше можно листать разделы вручную — всё кликается: карточки, ползунки, тумблеры, расписание.');return}
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
