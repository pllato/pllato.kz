/* NUTRINAN · портал управления пекарней — демо по встрече 03.09.2026 */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const mln=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n/1e6);

/* ===== РОЛИ ===== */
const ROLES={
 'Собственник':{av:'ГТ',n:'Гульдана',r:'собственник',note:'Вся картина: деньги, сходимость, себестоимость, партнёры',
  s:['dash','match','orders','points','debt','prod','plan','stock','wh','returns','logistics','finance','kpi','tasks','reports','c1','ai','users']},
 'Операционный директор':{av:'КА',n:'Камила',r:'операции',note:'Производство, склад, отгрузки, возвраты и дебиторка',
  s:['dash','match','orders','points','debt','prod','plan','recipes','stock','purchase','wh','returns','logistics','tasks','kpi','reports','ai']},
 'Менеджер по продажам':{av:'МП',n:'Асем',r:'заказы и партнёры',note:'Обращения из всех каналов, заказы, калькулятор, точки',
  s:['inbox','orders','points','debt','returns','tasks']},
 'Технолог цеха':{av:'ТЦ',n:'Мурат',r:'производство',note:'План выпуска, замес и выпечка, техкарты, списание',
  s:['prod','plan','recipes','stock','wh','tasks']},
 'Кладовщик':{av:'КЛ',n:'Данияр',r:'склад',note:'Сырьё, приход, инвентаризация, склад готовой продукции',
  s:['stock','purchase','wh','returns','tasks']},
 'Экспедитор':{av:'ЭК',n:'Ержан',r:'доставка',note:'Маршрут на смену, отгрузка по точкам, приём возвратов',
  s:['driver','logistics','returns']},
 'Бухгалтер (аутсорс)':{av:'БУ',n:'Айгуль',r:'учёт и 1С',note:'Документы, счета и накладные, обмен с 1С, платежи',
  s:['c1','debt','finance','points','reports']}
};
let role='Собственник',cur='dash',theme='light',scope='all';

const NAV=[
 ['ПРОДАЖИ И ПАРТНЁРЫ',[['dash','◧','Сводка'],['match','⇄','Сходимость',1],['inbox','✉','Обращения',5],['orders','▦','Заказы',6],['points','⌂','Точки-партнёры'],['debt','₸','Дебиторка',3],['returns','↩','Возвраты и обмен',2]]],
 ['ПРОИЗВОДСТВО И СКЛАД',[['prod','◍','Цех',3],['plan','◱','План на завтра'],['recipes','☰','Техкарты'],['stock','▥','Склад сырья',2],['purchase','⇩','Закуп'],['wh','▤','Склад готовой продукции']]],
 ['ЛОГИСТИКА',[['logistics','⇢','Маршруты'],['driver','▣','Экран экспедитора']]],
 ['ДЕНЬГИ И УПРАВЛЕНИЕ',[['finance','◈','Финансы'],['kpi','★','KPI сотрудников'],['tasks','☑','Задачи',4],['reports','◲','Отчёты'],['c1','⇆','Обмен с 1С'],['ai','✦','AI-помощник'],['users','◍','Права доступа']]]
];
const TITLES={
 dash:['Сводка','Выпуск, отгрузки, возвраты, деньги и расхождения за сегодня'],
 match:['Сходимость','Сырьё → выпуск → отгрузка → возврат → продажа → деньги: где теряется'],
 inbox:['Обращения','WhatsApp, Instagram, почта, 2GIS, телефон и сайт — одной лентой'],
 orders:['Заказы','Заявки партнёров на дату с калькулятором по их договорным ценам'],
 points:['Точки-партнёры','21 магазин: условия договора, баланс, возвраты и оборот'],
 debt:['Дебиторка и сверка','Кто сколько должен, чем подтверждено и когда платил'],
 returns:['Возвраты и обмен','Что не продалось: обмен, списание, утилизация — по точкам и причинам'],
 prod:['Цех','Замес, расстойка, выпечка, остывание, упаковка — с себестоимостью партии'],
 plan:['План на завтра','Система считает выпуск из заказов, средних продаж и остатков'],
 recipes:['Техкарты','Рецептуры, нормы сырья, выход и себестоимость каждой позиции'],
 stock:['Склад сырья','Остатки, списание по техкарте, инвентаризация и расхождения'],
 purchase:['Закуп','Потребность в сырье, заявки поставщикам и приход'],
 wh:['Склад готовой продукции','Выпущено, отгружено, вернулось, осталось'],
 logistics:['Маршруты','Рейсы, экспедиторы, точки и статусы доставки'],
 driver:['Экран экспедитора','То, что видит водитель в телефоне на смене'],
 finance:['Финансы','Деньги, себестоимость и расходы — включая те, что вне бухгалтерии'],
 kpi:['KPI сотрудников','Выпуск, возвраты, сбор денег и качество работы по людям'],
 tasks:['Задачи','Поручения с исполнителями, сроками и историей'],
 reports:['Отчёты','Любой срез выгружается в Excel'],
 c1:['Обмен с 1С','Накладные, счета и счета-фактуры формируются в портале и уходят в 1С'],
 ai:['AI-помощник','Вопрос своими словами — ответ по вашим данным из портала'],
 users:['Права доступа','Кто что видит: зарплаты и себестоимость — только руководителю']
};

/* ===== ДАННЫЕ ===== */
const PROD=[
 {id:'p1',n:'Хлеб «Нутринан» формовой',w:'600 г',price:320,cost:168,day:520},
 {id:'p2',n:'Хлеб пшеничный подовый',   w:'500 г',price:290,cost:150,day:410},
 {id:'p3',n:'Батон нарезной',           w:'400 г',price:260,cost:132,day:380},
 {id:'p4',n:'Хлеб ржаной «Бородинский»',w:'500 г',price:350,cost:186,day:240},
 {id:'p5',n:'Хлеб мультизлаковый',      w:'400 г',price:420,cost:232,day:180},
 {id:'p6',n:'Багет французский',        w:'250 г',price:240,cost:118,day:150},
 {id:'p7',n:'Булочки для бургера, 4 шт',w:'320 г',price:380,cost:196,day:120},
 {id:'p8',n:'Лаваш тонкий',             w:'200 г',price:180,cost:86, day:200}
];
const TERMS={pre:'предоплата',real:'реализация',cons:'консигнация',ots:'отсрочка 14 дней'};
const POINTS=[
 {id:'t1',n:'Магнум · Кабанбай батыра 62',   term:'ots', rev:2840000,debt:1840000,over:12,ret:6.2,ord:26,man:'Асем'},
 {id:'t2',n:'Small · Сарыарка 31',            term:'real',rev:1260000,debt:410000, over:0, ret:9.4,ord:26,man:'Асем'},
 {id:'t3',n:'Астыкжан · Карталы 146',         term:'pre', rev:980000, debt:0,      over:0, ret:3.1,ord:26,man:'Асем'},
 {id:'t4',n:'Магазин №7 · Тлендиева 15',      term:'cons',rev:640000, debt:286000, over:21,ret:11.8,ord:13,man:'Асем'},
 {id:'t5',n:'Дастархан · Пушкина 24',         term:'real',rev:820000, debt:312000, over:4, ret:7.5,ord:26,man:'Дана'},
 {id:'t6',n:'Береке маркет · Абая 118',       term:'ots', rev:1480000,debt:520000, over:0, ret:5.4,ord:26,man:'Дана'},
 {id:'t7',n:'Anvar · Богенбай батыра 54',     term:'ots', rev:2110000,debt:740000, over:6, ret:4.8,ord:26,man:'Дана'},
 {id:'t8',n:'Продукты 24 · Жубанова 9',       term:'pre', rev:410000, debt:0,      over:0, ret:8.9,ord:13,man:'Дана'},
 {id:'t9',n:'Столовая «Дән» · Карталы 88',    term:'real',rev:360000, debt:96000,  over:2, ret:2.2,ord:26,man:'Асем'},
 {id:'t10',n:'Green Market · Туран 55',       term:'cons',rev:1180000,debt:398000, over:9, ret:10.6,ord:26,man:'Дана'}
];
const RAW=[
 {id:'r1',n:'Мука пшеничная в/с',   un:'кг', qty:2840,min:1500,price:172,life:'до 12.11',sup:'Астык Трейд'},
 {id:'r2',n:'Мука ржаная обдирная', un:'кг', qty:410, min:400, price:154,life:'до 02.11',sup:'Астык Трейд'},
 {id:'r3',n:'Дрожжи прессованные',  un:'кг', qty:38,  min:60,  price:940,life:'до 18.09',sup:'БиоЛайн'},
 {id:'r4',n:'Соль пищевая',         un:'кг', qty:220, min:100, price:78, life:'—',       sup:'Астык Трейд'},
 {id:'r5',n:'Сахар-песок',          un:'кг', qty:180, min:120, price:390,life:'—',       sup:'СладПром'},
 {id:'r6',n:'Масло растительное',   un:'л',  qty:96,  min:80,  price:640,life:'до 20.12',sup:'СладПром'},
 {id:'r7',n:'Семечки подсолнечные', un:'кг', qty:412, min:80,  price:820,life:'до 30.09',sup:'СладПром',flag:'излишек'},
 {id:'r8',n:'Кунжут',               un:'кг', qty:64,  min:30,  price:1980,life:'до 14.10',sup:'СладПром'},
 {id:'r9',n:'Солод ржаной',         un:'кг', qty:74,  min:50,  price:1240,life:'до 09.12',sup:'БиоЛайн'},
 {id:'r10',n:'Пакеты с логотипом',  un:'шт', qty:11400,min:8000,price:22, life:'—',      sup:'Пак Астана'}
];
let BATCH=[
 {id:'ПР-3121',p:'p1',qty:520,st:'zam', shift:'Ночная',t:'02:10',cost:87360},
 {id:'ПР-3122',p:'p3',qty:380,st:'rast',shift:'Ночная',t:'02:45',cost:50160},
 {id:'ПР-3123',p:'p2',qty:410,st:'pech',shift:'Ночная',t:'03:20',cost:61500},
 {id:'ПР-3124',p:'p4',qty:240,st:'ost', shift:'Ночная',t:'04:05',cost:44640},
 {id:'ПР-3125',p:'p5',qty:180,st:'upak',shift:'Ночная',t:'04:40',cost:41760},
 {id:'ПР-3126',p:'p8',qty:200,st:'gotov',shift:'Ночная',t:'05:10',cost:17200}
];
const BST=[['zam','ЗАМЕС'],['rast','РАССТОЙКА'],['pech','ВЫПЕЧКА'],['ost','ОСТЫВАНИЕ'],['upak','УПАКОВКА'],['gotov','НА СКЛАД']];
let ORD=[
 {id:'З-8841',pt:'t1',date:'04.09',ch:'WhatsApp',st:'new',  sum:186400,pos:5,man:'Асем',t:'08:12'},
 {id:'З-8840',pt:'t7',date:'04.09',ch:'Почта',   st:'new',  sum:142800,pos:4,man:'Дана',t:'08:04'},
 {id:'З-8839',pt:'t2',date:'04.09',ch:'WhatsApp',st:'conf', sum:96200, pos:6,man:'Асем',t:'07:58'},
 {id:'З-8838',pt:'t6',date:'04.09',ch:'Телефон', st:'conf', sum:118600,pos:5,man:'Дана',t:'07:41'},
 {id:'З-8837',pt:'t10',date:'03.09',ch:'Instagram',st:'prod',sum:74300,pos:3,man:'Дана',t:'вчера'},
 {id:'З-8836',pt:'t5',date:'03.09',ch:'Экспедитор',st:'ship',sum:52400,pos:4,man:'Асем',t:'вчера'},
 {id:'З-8835',pt:'t3',date:'03.09',ch:'Сайт',    st:'done', sum:48900, pos:3,man:'Асем',t:'вчера'},
 {id:'З-8834',pt:'t9',date:'03.09',ch:'WhatsApp',st:'done', sum:31200, pos:2,man:'Асем',t:'вчера'}
];
const OST=[['new','НОВЫЙ'],['conf','ПОДТВЕРЖДЁН'],['prod','В ПРОИЗВОДСТВЕ'],['ship','ОТГРУЖЕН'],['done','ЗАКРЫТ']];
const INBOX=[
 {id:1,ch:'WhatsApp', from:'Магнум · Кабанбай 62',txt:'Добрый день! На завтра: формовой 120, батон 90, ржаной 40',t:'2 мин',sla:'ok'},
 {id:2,ch:'Почта',    from:'anvar.zakaz@mail.kz',  txt:'Заявка на 04.09 во вложении, просим подтвердить сумму',t:'14 мин',sla:'ok'},
 {id:3,ch:'Instagram',from:'@green_market_astana', txt:'Можно добавить мультизлаковый 30 шт к завтрашней поставке?',t:'26 мин',sla:'warn'},
 {id:4,ch:'2GIS',     from:'Новый магазин, Сыганак',txt:'Хотим работать с вами, какие условия по реализации?',t:'1 ч 10 мин',sla:'warn'},
 {id:5,ch:'Телефон',  from:'+7 701 ••• 44 18',     txt:'Пропущенный звонок · Small Сарыарка',t:'1 ч 40 мин',sla:'bad'}
];
let RET=[
 {id:'В-1204',pt:'t4',qty:38,sum:11400,r:'не продано',act:'обмен',   d:'03.09'},
 {id:'В-1203',pt:'t10',qty:44,sum:13200,r:'не продано',act:'обмен',   d:'03.09'},
 {id:'В-1202',pt:'t2',qty:26,sum:7540, r:'не продано',act:'списание',d:'03.09'},
 {id:'В-1201',pt:'t8',qty:12,sum:3120, r:'брак упаковки',act:'списание',d:'02.09'},
 {id:'В-1200',pt:'t5',qty:19,sum:5510, r:'истёк срок',act:'утилизация',d:'02.09'}
];
const PAYS=[
 {d:'03.09',pt:'t7',sum:400000,doc:'п/п 418',src:'банк'},
 {d:'02.09',pt:'t1',sum:700000,doc:'п/п 402',src:'банк'},
 {d:'02.09',pt:'t6',sum:250000,doc:'Kaspi',  src:'перевод'},
 {d:'01.09',pt:'t5',sum:120000,doc:'нал.',   src:'экспедитор'},
 {d:'30.08',pt:'t2',sum:300000,doc:'п/п 391',src:'банк'}
];
const ROUTES=[
 {id:'М-1',n:'Левый берег',exp:'Ержан',car:'Gazelle 123 ABC',pts:11,done:7,km:64,t:'05:40 → 10:20'},
 {id:'М-2',n:'Правый берег',exp:'Азамат',car:'Hyundai 456 CDE',pts:10,done:10,km:71,t:'05:30 → 10:05'}
];
const EXP=[
 {n:'Сырьё и упаковка',sum:6420000,type:'офиц'},
 {n:'Зарплата цеха',   sum:2180000,type:'офиц'},
 {n:'Аренда и коммуналка',sum:940000,type:'офиц'},
 {n:'Топливо и обслуживание машин',sum:520000,type:'офиц'},
 {n:'Такси и курьеры',  sum:186000,type:'проч'},
 {n:'Мелкий ремонт оборудования',sum:240000,type:'проч'},
 {n:'Наличные расчёты с грузчиками',sum:164000,type:'проч'}
];
const M={raw:207200,made:2072,ship:2005,ret:139,sold:1866,money:420000,plan:2140};

/* ===== ЭКРАНЫ ===== */
const SC={};
const pn=id=>(PROD.find(p=>p.id===id)||{n:'—'}).n;
const ptn=id=>(POINTS.find(p=>p.id===id)||{n:'—'}).n;
const revAll=()=>POINTS.reduce((a,p)=>a+p.rev,0);
const debtAll=()=>POINTS.reduce((a,p)=>a+p.debt,0);

SC.dash=()=>`
 <div class="head"><div><h2>Сводка за сегодня</h2><p>Всё, что сейчас разбросано по таблицам, WhatsApp и голове: сколько испекли, сколько отгрузили, сколько вернулось, кто сколько должен и сходится ли сырьё с продажами.</p></div>
 <div class="btns"><button class="btn" onclick="go('plan')">План на завтра</button><button class="btn acc" onclick="go('match')">Сходимость</button></div></div>
 <div class="strip">
  <div><small>ВЫПУЩЕНО СЕГОДНЯ</small><b>${fmt(M.made)} шт</b><span>план ${fmt(M.plan)} · ${Math.round(M.made/M.plan*100)}%</span></div>
  <div><small>ОТГРУЖЕНО</small><b class="a">${fmt(M.ship)} шт</b><span>на ${fmt(M.ship*292)} ₸ по 21 точке</span></div>
  <div><small>ВОЗВРАТ</small><b class="r">${fmt(M.ret)} шт</b><span>${num(M.ret/M.ship*100)}% отгрузки</span></div>
  <div><small>ДЕБИТОРКА</small><b class="w">${mln(debtAll())} млн ₸</b><span>просрочено 1,2 млн ₸</span></div>
  <div><small>СЫРЬЁ НИЖЕ МИНИМУМА</small><b class="r">2</b><span>дрожжи, мука ржаная</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph"><div><div class="ph-title">Точки-партнёры сегодня</div><div class="ph-sub">отгрузка, возврат и долг по каждой</div></div>
   <button class="btn" onclick="go('points')">Все 21 точка →</button></div>
   <div class="tw"><table class="data" style="min-width:640px"><thead><tr><th>Точка</th><th>Условия</th><th class="right">Отгружено</th><th class="right">Возврат</th><th class="right">Долг</th><th>Просрочка</th></tr></thead><tbody>
   ${POINTS.slice(0,6).map(p=>`<tr onclick="openPoint('${p.id}')">
    <td><b>${esc(p.n)}</b></td><td><span class="badge ${p.term==='pre'?'g':p.term==='ots'?'b':p.term==='cons'?'v':'w'}">${TERMS[p.term]}</span></td>
    <td class="right mono">${fmt(p.rev/26)} ₸</td>
    <td class="right mono" style="color:${p.ret>8?'var(--red)':'inherit'}">${num(p.ret)}%</td>
    <td class="right mono">${p.debt?fmt(p.debt):'—'}</td>
    <td>${p.over?`<span class="badge r">${p.over} дн.</span>`:'<span class="badge g">нет</span>'}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="hint"><b>Что видно сразу:</b> у «Магазина №7» возврат 11,8% при среднем по сети 6,4% — им возят больше, чем они продают, и это ваши прямые потери. У «Магнума» долг 1,84 млн с просрочкой 12 дней.</div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Требует решения</div>
    <div class="note" style="--tone:var(--red)"><b>Дрожжи: 38 кг при минимуме 60</b><p>Хватит на 2 замеса. Заявка поставщику «БиоЛайн» подготовлена, нужно подтвердить.</p></div>
    <div class="note" style="--tone:var(--amber)"><b>Семечки: расхождение 96 кг</b><p>По учёту 412 кг, по факту инвентаризации — 316. Это 79 000 ₸ и повод разобраться, а не списывать в конце года.</p></div>
    <div class="note" style="--tone:var(--wheat)"><b>«Магнум» оспаривает долг</b><p>Мы видим 1 840 000 ₸, партнёр говорит о платеже 700 000 ₸ от 02.09. Платёж есть в системе — акт сверки формируется за 10 секунд.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Цех прямо сейчас</div>
    ${BATCH.slice(0,4).map(b=>`<div class="kv"><span>${esc(pn(b.p))} · ${b.qty} шт</span><span class="badge ${b.st==='gotov'?'g':b.st==='pech'?'a':'b'}">${(BST.find(x=>x[0]===b.st)||['',''])[1].toLowerCase()}</span></div>`).join('')}
    <div class="kv"><span>Себестоимость смены</span><b class="mono">${fmt(BATCH.reduce((a,b)=>a+b.cost,0))} ₸</b></div>
    <button class="btn acc" style="width:100%;margin-top:9px" onclick="go('prod')">Открыть цех</button>
   </div>
  </div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Деньги за месяц</div>
   <div class="kv"><span>Отгружено партнёрам</span><b class="mono">${mln(revAll())} млн ₸</b></div>
   <div class="kv"><span>Поступило на счёт и наличными</span><b class="mono">9,84 млн ₸</b></div>
   <div class="kv"><span>Дебиторка на конец периода</span><b class="mono" style="color:var(--wheat)">${mln(debtAll())} млн ₸</b></div>
   <div class="kv"><span>Себестоимость выпуска</span><b class="mono">6,42 млн ₸</b></div>
   <div class="kv"><span>Расходы вне бухгалтерии</span><b class="mono">590 000 ₸</b></div>
   <button class="btn" style="width:100%;margin-top:9px" onclick="go('finance')">Финансы</button>
  </div>
  <div class="panel"><div class="ph-title">Что этот экран заменяет</div>
   <div class="note" style="--tone:var(--acc)"><b>Excel-таблицы и переписку</b><p>Сейчас отгрузки, возвраты и долги живут в разных файлах и в WhatsApp. Здесь это одна база: заявка партнёра, накладная, возврат и платёж — записи одной цепочки.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Вопрос «а сколько мы вообще заработали»</b><p>Ответ виден в момент, а не через две недели после того, как бухгалтер сведёт документы.</p></div>
  </div>
 </div>`;

SC.match=()=>`
 <div class="head"><div><h2>Сходимость: сырьё → выпуск → продажа → деньги</h2><p>Экран, ради которого стоит всё остальное. Вопрос со встречи: «замесили на 300, продали 250, где 50?» — здесь на него отвечают цифры, а не догадки.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Период меняется: день, неделя, месяц, произвольные даты. Расхождения считаются по каждому продукту и по каждой точке отдельно.')">Период: сегодня</button>
 <button class="btn acc" onclick="toast('Отчёт по сходимости выгружен в Excel: по продуктам, точкам и причинам расхождений.')">Выгрузить</button></div></div>
 <div class="flow">
  <div class="fb on"><code>1 · СЫРЬЁ</code><b>${fmt(M.raw)} ₸</b><p>списано со склада по техкартам на замесы смены</p></div>
  <div class="fb"><code>2 · ВЫПУСК</code><b>${fmt(M.made)} шт</b><p>принято на склад готовой продукции, план был ${fmt(M.plan)}</p></div>
  <div class="fb"><code>3 · ОТГРУЗКА</code><b>${fmt(M.ship)} шт</b><p>по накладным на 21 точку</p></div>
  <div class="fb"><code>4 · ВОЗВРАТ</code><b style="color:var(--red)">${fmt(M.ret)} шт</b><p>обмен, списание и утилизация</p></div>
  <div class="fb on"><code>5 · ПРОДАНО</code><b>${fmt(M.sold)} шт</b><p>реально продано конечному покупателю</p></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph-title">Где именно теряется</div>
   <div class="tw"><table class="data" style="min-width:700px"><thead><tr><th>Разрыв</th><th class="right">Штук</th><th class="right">Сумма</th><th>Причина</th><th>Что делать</th></tr></thead><tbody>
   ${[['План → выпуск',M.plan-M.made,(M.plan-M.made)*292,'недовыпуск: подъём теста, поломка расстоечного шкафа','разбор смены, заявка на ремонт'],
      ['Выпуск → отгрузка',M.made-M.ship,(M.made-M.ship)*292,'бой при упаковке и погрузке','норма до 0,5%, сейчас 3,2%'],
      ['Отгрузка → продажа',M.ret,M.ret*292,'не продано на точках, возврат и списание','пересмотр объёма привоза по 4 точкам'],
      ['Итого потери',M.plan-M.sold,(M.plan-M.sold)*292,'','']]
    .map((r,i)=>`<tr style="cursor:default;${i===3?'font-weight:800;background:var(--card2)':''}">
    <td><b>${r[0]}</b></td><td class="right mono">${fmt(r[1])}</td><td class="right mono" style="color:var(--red)">${fmt(r[2])} ₸</td>
    <td class="mini">${r[3]}</td><td class="mini">${r[4]}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="gap"><b>Потери за сегодня — ${fmt((M.plan-M.sold)*292)} ₸, за месяц в таком темпе — около ${mln((M.plan-M.sold)*292*26)} млн ₸</b>
    <p>Сейчас эта цифра не считается вообще: сырьё списывают раз в период, возвраты учитывают на бумаге, а бой при упаковке нигде не фиксируется. Первый месяц работы в системе обычно уходит на то, чтобы просто увидеть реальную картину — и уже это меняет решения.</p></div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Сходимость по сырью</div>
    ${[['Мука пшеничная в/с','по техкартам 1 840 кг','факт 1 878 кг','+38 кг','r'],
       ['Мука ржаная','по техкартам 210 кг','факт 210 кг','сходится','g'],
       ['Дрожжи','по техкартам 24 кг','факт 26 кг','+2 кг','a'],
       ['Семечки','по техкартам 18 кг','факт 18 кг','сходится','g']].map(r=>
     `<div class="kv"><span>${r[0]}<div class="sub">${r[1]} · ${r[2]}</div></span><span class="badge ${r[4]}">${r[3]}</span></div>`).join('')}
    <div class="note" style="--tone:var(--acc)"><b>Перерасход муки 38 кг</b><p>Это 6 500 ₸ за смену и 170 000 ₸ за месяц. Причина видна по партиям: перерасход только в ночной смене на формовом хлебе.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Деньги по цепочке</div>
    <div class="kv"><span>Продано на сумму</span><b class="mono">${fmt(M.sold*292)} ₸</b></div>
    <div class="kv"><span>Себестоимость проданного</span><b class="mono">${fmt(M.sold*158)} ₸</b></div>
    <div class="kv"><span>Потери (недовыпуск, бой, возврат)</span><b class="mono" style="color:var(--red)">${fmt((M.plan-M.sold)*292)} ₸</b></div>
    <div class="kv"><span>Поступило деньгами сегодня</span><b class="mono" style="color:var(--green)">${fmt(M.money)} ₸</b></div>
    <div class="kv"><span>Ушло в дебиторку</span><b class="mono" style="color:var(--wheat)">${fmt(M.sold*292-M.money)} ₸</b></div>
    <div class="kv"><span>Сырьё в себестоимости проданного</span><b class="mono">${fmt(M.raw)} ₸</b></div>
   </div>
  </div>
 </div>`;

SC.inbox=()=>`
 <div class="head"><div><h2>Обращения</h2><p>Заявки приходят по почте и в WhatsApp, вопросы — в Instagram и 2GIS, часть звонками. Здесь всё в одной ленте с таймером ответа: ничего не теряется в личных телефонах менеджеров.</p></div>
 <div class="btns"><button class="btn" onclick="waPing()">Каналы</button><button class="btn acc" onclick="toast('Обращение превращается в заказ одной кнопкой: позиции подставляются из прошлой заявки этой точки, цены — из её договора.')">Создать заказ из обращения</button></div></div>
 <div class="strip">
  <div><small>ОБРАЩЕНИЙ СЕГОДНЯ</small><b>${INBOX.length}</b><span>из 6 каналов</span></div>
  <div><small>СРЕДНИЙ ОТВЕТ</small><b class="a">14 мин</b><span>цель — до 15 минут</span></div>
  <div><small>ЖДУТ ДОЛЬШЕ ЧАСА</small><b class="r">2</b><span>2GIS и пропущенный звонок</span></div>
  <div><small>СТАЛИ ЗАКАЗАМИ</small><b class="g">78%</b><span>за неделю</span></div>
  <div><small>НОВЫХ ТОЧЕК</small><b>1</b><span>заявка на сотрудничество</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:860px"><thead><tr>
  <th>Канал</th><th>От кого</th><th>Сообщение</th><th>Ждёт</th><th>Статус</th><th></th></tr></thead><tbody>
 ${INBOX.map(m=>`<tr onclick="openMsg(${m.id})">
  <td><span class="badge ${m.ch==='WhatsApp'?'g':m.ch==='Instagram'?'v':m.ch==='Телефон'?'b':m.ch==='2GIS'?'w':''}">${m.ch}</span></td>
  <td><b>${esc(m.from)}</b></td><td class="mini">${esc(m.txt)}</td>
  <td class="mono">${m.t}</td>
  <td><span class="badge ${m.sla==='ok'?'g':m.sla==='warn'?'a':'r'}">${m.sla==='ok'?'в норме':m.sla==='warn'?'ждёт':'просрочено'}</span></td>
  <td class="right"><button class="btn" onclick="event.stopPropagation();toast('Ответ отправлен в тот же канал, из которого пришло сообщение. Переписка сохраняется в карточке точки.')">Ответить</button></td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Почему это важно именно вам:</b> заявки на завтрашний хлеб приходят вечером и утром, вперемешку с вопросами. Если заявка потерялась в переписке — точка осталась без хлеба, а вы без выручки. Здесь у каждой заявки есть статус и ответственный.</div>`;
function openMsg(id){const m=INBOX.find(x=>x.id===id);
 openD(esc(m.from),`${m.ch} · ждёт ${m.t}`,[],
 `<div class="panel"><div class="ph-title">Сообщение</div><p class="mini" style="margin-top:5px">${esc(m.txt)}</p></div>
  <div class="panel"><div class="ph-title">Что делает менеджер</div>
   ${['Открывает заказ — позиции и цены подставляются из договора точки','Проверяет остаток на складе готовой продукции','Подтверждает сумму и дату поставки','Заказ уходит в план цеха на нужную дату']
    .map(t=>`<div class="chk"><i>✓</i><span>${t}</span></div>`).join('')}
  </div>
  <div class="btns"><button class="btn acc" onclick="closeD();go('orders')">Создать заказ</button>
  <button class="btn" onclick="toast('Ответ отправлен в ${m.ch}. Вся переписка с этой точкой хранится в её карточке.')">Ответить в ${m.ch}</button></div>`)}

/* --- ЗАКАЗЫ + КАЛЬКУЛЯТОР --- */
let CART=[];
SC.orders=()=>`
 <div class="head"><div><h2>Заказы партнёров</h2><p>Заявка на дату с ценами из договора конкретной точки. Карточка тянется мышью по этапам; подтверждённый заказ сам встаёт в план цеха на нужный день.</p></div>
 <div class="btns"><button class="btn" onclick="go('inbox')">Обращения</button><button class="btn acc" onclick="newOrder()">+ Заказ · калькулятор</button></div></div>
 <div class="strip">
  <div><small>ЗАКАЗОВ НА ЗАВТРА</small><b>${ORD.filter(o=>o.date==='04.09').length}</b><span>на ${fmt(ORD.filter(o=>o.date==='04.09').reduce((a,o)=>a+o.sum,0))} ₸</span></div>
  <div><small>НЕ ПОДТВЕРЖДЕНО</small><b class="r">${ORD.filter(o=>o.st==='new').length}</b><span>ждут менеджера</span></div>
  <div><small>СРЕДНИЙ ЗАКАЗ</small><b>${fmt(ORD.reduce((a,o)=>a+o.sum,0)/ORD.length)} ₸</b><span>по всем точкам</span></div>
  <div><small>ЧЕРЕЗ WHATSAPP</small><b class="a">46%</b><span>основной канал заявок</span></div>
  <div><small>СОБРАТЬ ЗАКАЗ</small><b class="g">40 сек</b><span>с калькулятором и прайсом</span></div>
 </div>
 <div class="board" style="grid-template-columns:repeat(5,1fr)">
 ${OST.map(([k,n])=>{const list=ORD.filter(o=>o.st===k);
  return `<div class="col" id="col-${k}" ondragover="colOver(event,'${k}')" ondragleave="colOut('${k}')" ondrop="ordDrop(event,'${k}')">
   <div class="col-h"><b style="color:${k==='done'?'var(--green)':k==='ship'?'var(--blue)':k==='prod'?'var(--wheat)':k==='conf'?'var(--acc)':'var(--muted)'}">${n}</b><span>${list.length}</span></div>
   ${list.map(o=>`<div class="kc" draggable="true" style="--pr:${o.st==='new'?'var(--amber)':'var(--acc)'}" ondragstart="ordDrag(event,'${o.id}')" ondragend="this.classList.remove('drag')" onclick="openOrder('${o.id}')">
    <b>${esc(ptn(o.pt))}</b>
    <div class="kmeta">${o.id} · на ${o.date} · ${o.pos} позиций</div>
    <div class="krow"><span class="mono" style="font-weight:800;color:var(--acc)">${fmt(o.sum)} ₸</span>
     <span class="badge ${o.ch==='WhatsApp'?'g':o.ch==='Instagram'?'v':o.ch==='Почта'?'b':''}">${o.ch}</span></div>
    <div class="kmeta">${o.man} · ${o.t}</div>
   </div>`).join('')||'<div class="mini" style="text-align:center;padding:14px 0;color:var(--muted2)">пусто</div>'}
  </div>`}).join('')}
 </div>
 <div class="hint"><b>Калькулятор — то, о чём вы спрашивали:</b> менеджер выбирает точку, система подставляет её договорные цены и условия оплаты, показывает остаток на складе и сумму с учётом возвратов. Заказ собирается за полминуты, а не пересчитывается вручную по прайсу в Excel.</div>`;
let dragOrd=null;
function ordDrag(e,id){dragOrd=id;e.target.classList.add('drag');try{e.dataTransfer.setData('text/plain',id)}catch(x){}}
function colOver(e,k){e.preventDefault();const el=document.getElementById('col-'+k);if(el)el.classList.add('over')}
function colOut(k){const el=document.getElementById('col-'+k);if(el)el.classList.remove('over')}
function ordDrop(e,k){e.preventDefault();colOut(k);const o=ORD.find(x=>x.id===dragOrd);if(!o)return;o.st=k;render();
 const msg={conf:'Заказу присвоена дата поставки, точка получила подтверждение в свой канал.',
  prod:'Заказ ушёл в план цеха на 04.09 — технолог видит его в задании на смену.',
  ship:'Сформирована накладная, заказ добавлен в маршрут экспедитора.',
  done:'Заказ закрыт: накладная подписана, сумма встала в баланс точки.'}[k]||'Статус изменён.';
 toast(`<b>${o.id}</b> · ${esc(ptn(o.pt))}. ${msg}`)}
function openOrder(id){const o=ORD.find(x=>x.id===id);const p=POINTS.find(x=>x.id===o.pt);
 openD(`${o.id} · ${esc(ptn(o.pt))}`,`на ${o.date} · ${o.ch} · менеджер ${o.man}`,[],
 `<div class="strip" style="grid-template-columns:repeat(3,1fr)">
   <div><small>СУММА</small><b>${fmt(o.sum)} ₸</b><span>${o.pos} позиций</span></div>
   <div><small>УСЛОВИЯ</small><b style="font-size:14px">${TERMS[p.term]}</b><span>по договору точки</span></div>
   <div><small>ДОЛГ ТОЧКИ</small><b style="font-size:14px;color:${p.debt?'var(--wheat)':'inherit'}">${p.debt?fmt(p.debt)+' ₸':'нет'}</b><span>${p.over?'просрочка '+p.over+' дн.':'в графике'}</span></div>
  </div>
  <div class="panel"><div class="ph-title">Состав заказа</div>
   <div class="rows"><div class="rrow h"><span>Позиция</span><span>Цена</span><span>Кол-во</span><span>Сумма</span><span></span></div>
   ${PROD.slice(0,o.pos).map(pr=>{const q=Math.round(o.sum/o.pos/pr.price);
    return `<div class="rrow"><span>${esc(pr.n)}<div class="sub">${pr.w}</div></span>
    <span class="mono">${fmt(pr.price)}</span><span class="mono">${q} шт</span><span class="mono">${fmt(q*pr.price)}</span><span></span></div>`}).join('')}
   <div class="rtot"><span>Итого</span><span class="mono">${fmt(o.sum)} ₸</span></div></div>
   <div class="note" style="--tone:var(--acc)"><b>Цены подставились сами</b><p>У каждой точки свой прайс по договору. Менеджер не ищет его в таблице и не ошибается — цена берётся из карточки партнёра.</p></div>
  </div>
  <div class="btns">
   <button class="btn acc" onclick="closeD();toast('Заказ подтверждён: точка получила подтверждение в WhatsApp, заказ встал в план цеха.')">Подтвердить</button>
   <button class="btn" onclick="toast('Накладная сформирована в портале и уходит в 1С черновиком — номер возвращается обратно в карточку заказа.')">Накладная</button>
   <button class="btn" onclick="closeD();openPoint('${o.pt}')">Карточка точки</button></div>`)}
function newOrder(){CART=[];
 openD('Новый заказ','Калькулятор: выберите точку — цены подставятся из её договора',[],calcBody('t1'))}
function calcBody(ptid){const p=POINTS.find(x=>x.id===ptid);
 const sum=CART.reduce((a,c)=>a+c.q*(PROD.find(x=>x.id===c.id).price),0);
 return `<div class="panel"><div class="ph-title">Точка-партнёр</div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
   ${POINTS.slice(0,6).map(x=>`<span class="pill ${x.id===ptid?'on':''}" onclick="document.getElementById('db').innerHTML=calcBody('${x.id}')">${esc(x.n.split('·')[0].trim())}</span>`).join('')}
  </div>
  <div class="kv" style="margin-top:9px"><span>Условия оплаты</span><b>${TERMS[p.term]}</b></div>
  <div class="kv"><span>Текущий долг</span><b class="mono" style="color:${p.debt?'var(--wheat)':'inherit'}">${p.debt?fmt(p.debt)+' ₸':'нет'}</b></div>
  <div class="kv"><span>Возвраты за месяц</span><b>${num(p.ret)}%</b></div>
 </div>
 <div class="panel"><div class="ph-title">Позиции · цены из договора точки</div>
  <div class="rows"><div class="rrow h"><span>Продукт</span><span>Цена</span><span>Остаток</span><span>Кол-во</span><span></span></div>
  ${PROD.map(pr=>{const c=CART.find(x=>x.id===pr.id);
   return `<div class="rrow"><span>${esc(pr.n)}<div class="sub">${pr.w} · себестоимость ${fmt(pr.cost)} ₸</div></span>
   <span class="mono">${fmt(pr.price)}</span><span class="mono" style="color:var(--muted)">${pr.day} шт</span>
   <span><input type="number" min="0" value="${c?c.q:0}" oninput="setQ('${pr.id}',this.value,'${ptid}')"></span>
   <span class="mono" style="text-align:right">${c&&c.q?fmt(c.q*pr.price):''}</span></div>`}).join('')}
  <div class="rtot"><span>Итого заказ</span><span class="mono">${fmt(sum)} ₸</span></div></div>
  <div class="btns" style="margin-top:11px">
   <button class="btn acc" onclick="saveOrder('${ptid}')">Создать заказ на ${fmt(sum)} ₸</button>
   <button class="btn" onclick="toast('Заказ повторён из прошлой поставки этой точки — обычно меняется только количество по двум-трём позициям.')">Повторить прошлый</button></div>
 </div>`}
function setQ(id,v,ptid){const q=Math.max(0,parseInt(v)||0);const c=CART.find(x=>x.id===id);
 if(c)c.q=q;else CART.push({id,q});
 const sum=CART.reduce((a,c)=>a+c.q*(PROD.find(x=>x.id===c.id).price),0);
 const el=document.querySelector('#db .rtot .mono');if(el)el.textContent=fmt(sum)+' ₸';
 const bt=document.querySelector('#db .btn.acc');if(bt)bt.textContent=`Создать заказ на ${fmt(sum)} ₸`}
function saveOrder(ptid){const sum=CART.reduce((a,c)=>a+c.q*(PROD.find(x=>x.id===c.id).price),0);
 if(!sum){toast('Укажите количество хотя бы по одной позиции — калькулятор считает сумму сразу, по ценам этой точки.');return}
 const id='З-'+(8842+ORD.length);
 ORD.unshift({id,pt:ptid,date:'04.09',ch:'Портал',st:'new',sum,pos:CART.filter(c=>c.q).length,man:ROLES[role].n,t:'сейчас'});
 closeD();if(cur==='orders')render();sparks();
 toast(`Заказ <b>${id}</b> на ${fmt(sum)} ₸ создан за несколько секунд. Точка получила подтверждение, заказ ждёт постановки в план цеха.`)}

/* --- ТОЧКИ --- */
SC.points=()=>`
 <div class="head"><div><h2>Точки-партнёры</h2><p>21 магазин с разными условиями: предоплата, реализация, консигнация, отсрочка. В карточке — оборот, возвраты, долг, история платежей и акт сверки.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Новая точка: договор, условия оплаты, прайс, периодичность поставок и ответственный менеджер. Дальше она сразу попадает в маршрут и в план выпуска.')">+ Точка</button>
 <button class="btn acc" onclick="go('debt')">Дебиторка</button></div></div>
 <div class="strip">
  <div><small>ТОЧЕК</small><b>21</b><span>10 показаны в демо</span></div>
  <div><small>ОБОРОТ ЗА МЕСЯЦ</small><b class="a">${mln(revAll())} млн ₸</b><span>по всем партнёрам</span></div>
  <div><small>СРЕДНИЙ ВОЗВРАТ</small><b class="w">6,4%</b><span>норма для сети — до 5%</span></div>
  <div><small>ДОЛГ</small><b class="r">${mln(debtAll())} млн ₸</b><span>у 8 точек</span></div>
  <div><small>ПРИРОСТ</small><b class="g">+5 точек</b><span>за полгода</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:920px"><thead><tr>
  <th>Точка</th><th>Условия</th><th>Менеджер</th><th class="right">Оборот за месяц</th><th class="right">Поставок</th><th class="right">Возврат</th><th class="right">Долг</th><th>Просрочка</th></tr></thead><tbody>
 ${POINTS.map(p=>`<tr onclick="openPoint('${p.id}')">
  <td><b>${esc(p.n)}</b></td>
  <td><span class="badge ${p.term==='pre'?'g':p.term==='ots'?'b':p.term==='cons'?'v':'w'}">${TERMS[p.term]}</span></td>
  <td class="mini">${p.man}</td>
  <td class="right mono">${fmt(p.rev)}</td><td class="right mono">${p.ord}</td>
  <td class="right mono" style="color:${p.ret>8?'var(--red)':p.ret>5?'var(--amber)':'var(--green)'}">${num(p.ret)}%</td>
  <td class="right mono">${p.debt?fmt(p.debt):'—'}</td>
  <td>${p.over?`<span class="badge r">${p.over} дн.</span>`:'<span class="badge g">нет</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Условия работы — как в жизни</div>
   ${Object.entries(TERMS).map(([k,v])=>`<div class="kv"><span><b>${v}</b><div class="sub">${{
    pre:'деньги вперёд, отгрузка после оплаты — долг не копится',
    real:'платят за то, что продали; непроданное возвращают',
    cons:'товар остаётся нашим до продажи, расчёт по факту',
    ots:'оплата в течение 14 дней после поставки'}[k]}</div></span>
    <b>${POINTS.filter(p=>p.term===k).length} точек</b></div>`).join('')}
   <div class="note" style="--tone:var(--acc)"><b>Условия задаются в карточке, а не помнятся наизусть</b><p>Система сама считает, когда наступает оплата, и подсвечивает просрочку по условиям конкретного договора.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Точки с высоким возвратом</div>
   ${POINTS.filter(p=>p.ret>8).map(p=>`<div class="kv"><span>${esc(p.n)}<div class="sub">возвращают ${num(p.ret)}% привоза</div></span>
    <b style="color:var(--red)">−${fmt(p.rev*p.ret/100)} ₸</b></div>`).join('')}
   <div class="note" style="--tone:var(--red)"><b>Возврат — это ваши деньги</b><p>Хлеб возвращается не деньгами, а товаром, который чаще всего идёт на списание. Снижение возврата на 1 процентный пункт по сети — около 190 000 ₸ в месяц.</p></div>
   <button class="btn" style="width:100%;margin-top:9px" onclick="go('returns')">Разбор возвратов</button>
  </div>
 </div>`;
function openPoint(id){const p=POINTS.find(x=>x.id===id);
 openD(esc(p.n),`${TERMS[p.term]} · менеджер ${p.man} · ${p.ord} поставок в месяц`,
 [['Обзор',`pointTab('${id}','o')`,true],['Платежи и сверка',`pointTab('${id}','p')`],['Возвраты',`pointTab('${id}','r')`]],
 pointBody(id,'o'))}
function pointTab(id,t){document.getElementById('dtabs').innerHTML=[['Обзор','o'],['Платежи и сверка','p'],['Возвраты','r']]
  .map(x=>`<button class="dtab ${x[1]===t?'on':''}" onclick="pointTab('${id}','${x[1]}')">${x[0]}</button>`).join('');
 document.getElementById('db').innerHTML=pointBody(id,t)}
function pointBody(id,t){const p=POINTS.find(x=>x.id===id);
 if(t==='o')return `
  <div class="strip" style="grid-template-columns:repeat(3,1fr)">
   <div><small>ОБОРОТ ЗА МЕСЯЦ</small><b>${fmt(p.rev)} ₸</b><span>${p.ord} поставок</span></div>
   <div><small>ДОЛГ</small><b style="color:${p.debt?'var(--wheat)':'inherit'}">${p.debt?fmt(p.debt):'0'} ₸</b><span>${p.over?'просрочка '+p.over+' дн.':'в графике'}</span></div>
   <div><small>ВОЗВРАТ</small><b style="color:${p.ret>8?'var(--red)':'inherit'}">${num(p.ret)}%</b><span>по сети 6,4%</span></div>
  </div>
  <div class="panel"><div class="ph-title">Что заказывают чаще всего</div>
   ${PROD.slice(0,5).map((pr,i)=>`<div class="fr" style="grid-template-columns:210px 1fr 96px"><span>${esc(pr.n)}</span>
    <div class="bar"><i style="--w:${[92,74,58,40,26][i]}%"></i></div><b>${fmt(p.rev*[0.32,0.24,0.18,0.14,0.12][i])} ₸</b></div>`).join('')}
   <div class="kv" style="margin-top:8px"><span>Средняя поставка</span><b class="mono">${fmt(p.rev/p.ord)} ₸</b></div>
   <div class="kv"><span>Периодичность</span><b>${p.ord>20?'ежедневно':'через день'}</b></div>
  </div>
  <div class="btns"><button class="btn acc" onclick="closeD();newOrder()">Создать заказ</button>
  <button class="btn" onclick="toast('Переписка с точкой: вся история WhatsApp и почты по этому партнёру в одном месте, включая заявки и споры по возвратам.')">Переписка</button>
  <button class="btn" onclick="toast('Договор, прайс и условия оплаты прикреплены к карточке — менеджеру не нужно искать их в почте.')">Документы</button></div>`;
 if(t==='p')return `
  <div class="panel"><div class="ph-title">Акт сверки · формируется за 10 секунд</div>
   <div class="tw"><table class="data"><thead><tr><th>Дата</th><th>Операция</th><th class="right">Отгрузка</th><th class="right">Оплата</th><th class="right">Сальдо</th></tr></thead><tbody>
   ${[['01.09','Поставка по накладной №4412',420000,0,2540000],
      ['02.09','Оплата п/п 402',0,700000,1840000],
      ['02.09','Возврат по акту В-1198',-60000,0,1780000],
      ['03.09','Поставка по накладной №4429',380000,0,2160000],
      ['03.09','Оплата п/п 418',0,320000,1840000]].map(r=>
    `<tr style="cursor:default"><td class="mono">${r[0]}</td><td class="mini">${r[1]}</td>
    <td class="right mono">${r[2]?fmt(r[2]):'—'}</td><td class="right mono" style="color:var(--green)">${r[3]?fmt(r[3]):'—'}</td>
    <td class="right mono"><b>${fmt(r[4])}</b></td></tr>`).join('')}
   </tbody></table></div>
   <div class="note" style="--tone:var(--green)"><b>Спор «мы же заплатили 700 тысяч» закрывается на месте</b><p>Платёж от 02.09 в системе есть, он уже учтён в сальдо. Раньше на это уходил день работы бухгалтера и полугодовой акт сверки — теперь это экран, который можно открыть при партнёре.</p></div>
   <div class="btns"><button class="btn acc" onclick="toast('Акт сверки сформирован и отправлен партнёру в WhatsApp одним файлом.')">Отправить акт партнёру</button>
   <button class="btn" onclick="toast('Платёж зафиксирован: сальдо пересчиталось сразу, менеджер видит актуальный долг.')">Внести платёж</button></div>
  </div>`;
 return `
  <div class="panel"><div class="ph-title">Возвраты этой точки</div>
   <div class="tw"><table class="data"><thead><tr><th>Дата</th><th>Позиция</th><th class="right">Штук</th><th class="right">Сумма</th><th>Что сделали</th></tr></thead><tbody>
   ${[['03.09','Хлеб формовой',18,5760,'обмен'],['03.09','Батон нарезной',12,3120,'обмен'],['02.09','Хлеб пшеничный',9,2610,'списание'],['01.09','Багет',7,1680,'утилизация']]
    .map(r=>`<tr style="cursor:default"><td class="mono">${r[0]}</td><td>${r[1]}</td><td class="right mono">${r[2]}</td>
    <td class="right mono">${fmt(r[3])}</td><td><span class="badge ${r[4]==='обмен'?'b':r[4]==='списание'?'a':'r'}">${r[4]}</span></td></tr>`).join('')}
   </tbody></table></div>
   <div class="note" style="--tone:var(--amber)"><b>Возврат ${num(p.ret)}% — это ${fmt(p.rev*p.ret/100)} ₸ в месяц</b><p>Система предлагает урезать привоз по позициям, которые стабильно возвращаются, и показывает, как это скажется на выручке точки.</p></div>
   <button class="btn acc" style="width:100%" onclick="toast('Рекомендация применена: привоз по трём позициям уменьшен на 15%. Через неделю система покажет, изменился ли возврат.')">Скорректировать привоз</button>
  </div>`}

/* --- ДЕБИТОРКА --- */
SC.debt=()=>`
 <div class="head"><div><h2>Дебиторка и сверка</h2><p>Со стороны отгрузок у вас всё понятно — вопрос в деньгах. Здесь видно, кто сколько должен, чем это подтверждено и когда платил последний раз. Сверка не ждёт бухгалтера раз в полгода.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Напоминания уходят автоматически: за 2 дня до срока оплаты и в день просрочки — в WhatsApp ответственному по точке.')">Напоминания</button>
 <button class="btn acc" onclick="toast('Акты сверки по всем точкам с долгом сформированы одним пакетом и готовы к отправке.')">Сверка по всем</button></div></div>
 <div class="strip">
  <div><small>ДЕБИТОРКА ВСЕГО</small><b class="w">${mln(debtAll())} млн ₸</b><span>у ${POINTS.filter(p=>p.debt).length} точек</span></div>
  <div><small>ПРОСРОЧЕНО</small><b class="r">${mln(POINTS.filter(p=>p.over).reduce((a,p)=>a+p.debt,0))} млн ₸</b><span>${POINTS.filter(p=>p.over).length} точки</span></div>
  <div><small>СРЕДНИЙ СРОК ОПЛАТЫ</small><b>19 дней</b><span>по договорам — 14</span></div>
  <div><small>ПОСТУПИЛО ЗА НЕДЕЛЮ</small><b class="g">1,77 млн ₸</b><span>5 платежей</span></div>
  <div><small>СПОРНЫХ СУММ</small><b class="a">1</b><span>Магнум · платёж 700 000 ₸</span></div>
 </div>
 <div class="g21">
  <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:720px"><thead><tr>
   <th>Точка</th><th>Условия</th><th class="right">Долг</th><th class="right">Просрочка</th><th>Последний платёж</th><th></th></tr></thead><tbody>
  ${POINTS.filter(p=>p.debt).sort((a,b)=>b.debt-a.debt).map(p=>{const pay=PAYS.find(x=>x.pt===p.id);
   return `<tr onclick="openPoint('${p.id}')"><td><b>${esc(p.n)}</b></td>
   <td><span class="badge ${p.term==='ots'?'b':p.term==='cons'?'v':'w'}">${TERMS[p.term]}</span></td>
   <td class="right mono"><b>${fmt(p.debt)}</b></td>
   <td class="right">${p.over?`<span class="badge r">${p.over} дн.</span>`:'<span class="badge g">в графике</span>'}</td>
   <td class="mini">${pay?pay.d+' · '+fmt(pay.sum)+' ₸ · '+pay.doc:'не было'}</td>
   <td class="right"><button class="btn" onclick="event.stopPropagation();toast('Напоминание отправлено в WhatsApp контактному лицу точки: сумма долга, номера накладных и дата, до которой ждём оплату.')">Напомнить</button></td></tr>`}).join('')}
  </tbody></table></div></div>
  <div>
   <div class="panel"><div class="ph-title">Последние поступления</div>
    ${PAYS.map(p=>`<div class="kv"><span>${esc(ptn(p.pt))}<div class="sub">${p.d} · ${p.doc} · ${p.src}</div></span><b class="mono" style="color:var(--green)">+${fmt(p.sum)}</b></div>`).join('')}
    <div class="note" style="--tone:var(--acc)"><b>Откуда берутся платежи</b><p>Банковские — из выписки и 1С, наличные от экспедитора — с его экрана в момент получения. Сальдо пересчитывается сразу, а не в конце месяца.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Что меняется в работе</div>
    ${['Долг виден в момент, а не после сверки','Спор закрывается актом за 10 секунд','Просрочка подсвечивается автоматически','Менеджер видит долг точки при приёме заказа','Отгрузка сверх лимита требует подтверждения']
     .map(t=>`<div class="chk"><i>✓</i><span>${t}</span></div>`).join('')}
   </div>
  </div>
 </div>`;

/* --- ВОЗВРАТЫ --- */
SC.returns=()=>{const tot=RET.reduce((a,r)=>a+r.sum,0);
 return `<div class="head"><div><h2>Возвраты и обмен</h2><p>Хлеб возвращается почти со всех точек — вопрос в том, сколько и почему. Каждый возврат фиксируется с причиной и решением: обмен, списание или утилизация.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Правила обмена настраиваются по договору точки: что меняем, в какой срок и что делаем с возвращённым товаром.')">Правила обмена</button>
 <button class="btn acc" onclick="toast('Возврат оформлен: акт создан, товар списан со склада точки, сумма учтена в её сальдо и в отчёте по потерям.')">+ Возврат</button></div></div>
 <div class="strip">
  <div><small>ВОЗВРАТ ЗА СЕГОДНЯ</small><b class="r">${fmt(RET.reduce((a,r)=>a+r.qty,0))} шт</b><span>на ${fmt(tot)} ₸</span></div>
  <div><small>ДОЛЯ ОТ ОТГРУЗКИ</small><b class="w">6,4%</b><span>цель — до 5%</span></div>
  <div><small>ОБМЕН</small><b>${RET.filter(r=>r.act==='обмен').reduce((a,r)=>a+r.qty,0)} шт</b><span>заменили свежим</span></div>
  <div><small>СПИСАНИЕ И УТИЛИЗАЦИЯ</small><b class="r">${RET.filter(r=>r.act!=='обмен').reduce((a,r)=>a+r.qty,0)} шт</b><span>прямые потери</span></div>
  <div><small>ЗА МЕСЯЦ</small><b>${mln(tot*26)} млн ₸</b><span>если темп сохранится</span></div>
 </div>
 <div class="g21">
  <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:720px"><thead><tr>
   <th>Акт</th><th>Точка</th><th class="right">Штук</th><th class="right">Сумма</th><th>Причина</th><th>Решение</th><th>Дата</th></tr></thead><tbody>
  ${RET.map(r=>`<tr onclick="toast('Акт возврата ${r.id}: позиции, причина, кто принял и что с товаром сделали. Сумма уже учтена в сальдо точки и в отчёте потерь.')">
   <td class="mono"><b>${r.id}</b></td><td>${esc(ptn(r.pt))}</td>
   <td class="right mono">${r.qty}</td><td class="right mono">${fmt(r.sum)}</td>
   <td class="mini">${r.r}</td>
   <td><span class="badge ${r.act==='обмен'?'b':r.act==='списание'?'a':'r'}">${r.act}</span></td>
   <td class="mono">${r.d}</td></tr>`).join('')}
  </tbody></table></div></div>
  <div>
   <div class="panel"><div class="ph-title">Возврат по точкам</div>
    ${POINTS.slice(0,6).sort((a,b)=>b.ret-a.ret).map(p=>`<div class="fr" style="grid-template-columns:170px 1fr 62px"><span>${esc(p.n.split('·')[0].trim())}</span>
     <div class="bar"><i style="--w:${p.ret/12*100}%;background:${p.ret>8?'var(--red)':p.ret>5?'var(--amber)':'var(--green)'}"></i></div><b>${num(p.ret)}%</b></div>`).join('')}
    <div class="note" style="--tone:var(--acc)"><b>Система сама предлагает объём привоза</b><p>Если точка три недели подряд возвращает 10% батонов — привоз по этой позиции уменьшается. Решение остаётся за вами, но предложение приходит само.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Куда уходит возвращённое</div>
    ${[['Обмен на свежий','82 шт','товар меняется, сумма не меняется'],['Списание','38 шт','потеря, попадает в себестоимость'],['Утилизация','19 шт','акт утилизации с подписью'],['Переработка (сухари)','—','можно добавить как отдельный поток']]
     .map(r=>`<div class="kv"><span>${r[0]}<div class="sub">${r[2]}</div></span><b>${r[1]}</b></div>`).join('')}
   </div>
  </div>
 </div>`};

/* --- ЦЕХ --- */
SC.prod=()=>`
 <div class="head"><div><h2>Цех</h2><p>Замес, расстойка, выпечка, остывание, упаковка. При запуске партии сырьё списывается по техкарте, себестоимость считается по факту, а не «в среднем по пекарне».</p></div>
 <div class="btns"><button class="btn" onclick="go('plan')">План на завтра</button>
 <button class="btn acc" onclick="newBatch()">+ Запустить партию</button></div></div>
 <div class="strip">
  <div><small>ПАРТИЙ В РАБОТЕ</small><b>${BATCH.filter(b=>b.st!=='gotov').length}</b><span>ночная смена с 01:00</span></div>
  <div><small>ВЫПУЩЕНО ЗА СМЕНУ</small><b class="a">${fmt(M.made)} шт</b><span>план ${fmt(M.plan)}</span></div>
  <div><small>СЕБЕСТОИМОСТЬ СМЕНЫ</small><b>${fmt(BATCH.reduce((a,b)=>a+b.cost,0))} ₸</b><span>сырьё и работа</span></div>
  <div><small>БРАК И БОЙ</small><b class="r">3,2%</b><span>норма до 0,5%</span></div>
  <div><small>ОТГРУЗКА В</small><b>05:40</b><span>два маршрута</span></div>
 </div>
 <div class="board" style="grid-template-columns:repeat(6,1fr)">
 ${BST.map(([k,n])=>{const list=BATCH.filter(b=>b.st===k);
  return `<div class="col" id="col-${k}" ondragover="colOver(event,'${k}')" ondragleave="colOut('${k}')" ondrop="batchDrop(event,'${k}')">
   <div class="col-h"><b style="color:${k==='gotov'?'var(--green)':k==='pech'?'var(--wheat)':'var(--acc)'}">${n}</b><span>${list.length}</span></div>
   ${list.map(b=>`<div class="kc" draggable="true" style="--pr:${k==='gotov'?'var(--green)':'var(--wheat)'}" ondragstart="batchDrag(event,'${b.id}')" ondragend="this.classList.remove('drag')" onclick="openBatch('${b.id}')">
    <b>${esc(pn(b.p))}</b>
    <div class="kmeta">${b.id} · ${b.qty} шт</div>
    <div class="krow"><span class="mono" style="font-weight:800">${fmt(b.cost)} ₸</span><span class="due">${b.t}</span></div>
   </div>`).join('')||'<div class="mini" style="text-align:center;padding:12px 0;color:var(--muted2)">—</div>'}
  </div>`}).join('')}
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Что происходит при запуске партии</div>
   ${[['Списание сырья по техкарте','мука, дрожжи, соль и упаковка уходят со склада автоматически — кладовщик не ведёт тетрадь'],
      ['Расчёт себестоимости','по фактическим ценам последнего прихода, а не по прошлогодним'],
      ['Фиксация выхода','сколько теста, сколько готовых буханок, сколько брака — с указанием смены'],
      ['Приём на склад готовой продукции','партия становится доступной для отгрузки на точки']]
    .map(r=>`<div class="chk"><i>✓</i><span><b>${r[0]}</b><span class="sub">${r[1]}</span></span></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Смена и выход</div>
   <div class="kv"><span>Смена</span><b>Ночная · 6 человек</b></div>
   <div class="kv"><span>Замесов за смену</span><b>14</b></div>
   <div class="kv"><span>Выход теста к муке</span><b class="mono">137%</b></div>
   <div class="kv"><span>Отклонение от нормы</span><b style="color:var(--red)">−2,1%</b></div>
   <div class="note" style="--tone:var(--amber)"><b>Выход ниже нормы третью смену подряд</b><p>Система сравнивает фактический выход с техкартой. Стабильное отклонение — это либо сырьё, либо процесс, и это видно до того, как посчитают месяц.</p></div>
  </div>
 </div>`;
let dragB=null;
function batchDrag(e,id){dragB=id;e.target.classList.add('drag');try{e.dataTransfer.setData('text/plain',id)}catch(x){}}
function batchDrop(e,k){e.preventDefault();colOut(k);const b=BATCH.find(x=>x.id===dragB);if(!b)return;b.st=k;render();
 if(k==='gotov'){sparks();toast(`Партия <b>${b.id}</b> принята на склад готовой продукции: ${b.qty} шт, себестоимость ${fmt(b.cost)} ₸. Продукция доступна для отгрузки на точки.`)}
 else toast(`Партия <b>${b.id}</b> переведена на этап «${(BST.find(x=>x[0]===k)||['',''])[1].toLowerCase()}». Время этапа фиксируется — по нему считается длительность цикла.`)}
function openBatch(id){const b=BATCH.find(x=>x.id===id);const p=PROD.find(x=>x.id===b.p);
 openD(`${b.id} · ${esc(p.n)}`,`${b.qty} шт · ${b.shift} смена · запуск ${b.t}`,[],
 `<div class="strip" style="grid-template-columns:repeat(3,1fr)">
   <div><small>КОЛИЧЕСТВО</small><b>${b.qty} шт</b><span>${p.w} каждая</span></div>
   <div><small>СЕБЕСТОИМОСТЬ</small><b>${fmt(b.cost)} ₸</b><span>${fmt(b.cost/b.qty)} ₸ за штуку</span></div>
   <div><small>ЦЕНА ОТГРУЗКИ</small><b>${fmt(p.price)} ₸</b><span>маржа ${Math.round((p.price-b.cost/b.qty)/p.price*100)}%</span></div>
  </div>
  <div class="panel"><div class="ph-title">Списано со склада по техкарте</div>
   <div class="tw"><table class="data"><thead><tr><th>Сырьё</th><th class="right">Норма</th><th class="right">Списано</th><th class="right">Сумма</th></tr></thead><tbody>
   ${[['Мука пшеничная в/с',(b.qty*0.42).toFixed(0)+' кг',(b.qty*0.43).toFixed(0)+' кг',fmt(b.qty*0.43*172)],
      ['Дрожжи',(b.qty*0.008).toFixed(1)+' кг',(b.qty*0.008).toFixed(1)+' кг',fmt(b.qty*0.008*940)],
      ['Соль',(b.qty*0.006).toFixed(1)+' кг',(b.qty*0.006).toFixed(1)+' кг',fmt(b.qty*0.006*78)],
      ['Масло растительное',(b.qty*0.004).toFixed(1)+' л',(b.qty*0.004).toFixed(1)+' л',fmt(b.qty*0.004*640)],
      ['Пакеты с логотипом',b.qty+' шт',b.qty+' шт',fmt(b.qty*22)]]
    .map(r=>`<tr style="cursor:default"><td>${r[0]}</td><td class="right mono">${r[1]}</td><td class="right mono">${r[2]}</td><td class="right mono">${r[3]} ₸</td></tr>`).join('')}
   </tbody></table></div>
   <div class="note" style="--tone:var(--red)"><b>Перерасход муки на этой партии</b><p>Списано на 2,3% больше нормы. По одной партии это мелочь, за месяц — около 170 000 ₸. Раньше такое расхождение всплывало только при годовой инвентаризации.</p></div>
  </div>
  <div class="btns">
   ${b.st!=='gotov'?`<button class="btn acc" onclick="closeD();(function(){const x=BATCH.find(z=>z.id==='${id}');x.st='gotov';if(cur==='prod')render();sparks();toast('Партия принята на склад готовой продукции.')})()">Принять на склад</button>`:''}
   <button class="btn" onclick="toast('Брак зафиксирован: количество, причина и ответственный. Попадает в отчёт по потерям и в KPI смены.')">Зафиксировать брак</button>
   <button class="btn" onclick="closeD();go('recipes')">Техкарта</button></div>`)}
function newBatch(){const id='ПР-'+(3127+BATCH.length);
 BATCH.unshift({id,p:'p2',qty:300,st:'zam',shift:'Дневная',t:'сейчас',cost:45000});
 if(cur==='prod')render();
 toast(`Партия <b>${id}</b> запущена: 300 шт пшеничного подового. Сырьё списано со склада по техкарте, себестоимость ${fmt(45000)} ₸ посчитана автоматически.`)}

/* --- ПЛАН, ТЕХКАРТЫ --- */
SC.plan=()=>`
 <div class="head"><div><h2>План выпуска на завтра</h2><p>Система считает, сколько печь, из трёх источников: подтверждённые заказы точек, средние продажи по дням недели и остаток на складе. Технолог утверждает, а не считает вручную вечером.</p></div>
 <div class="btns"><button class="btn" onclick="toast('План можно править вручную: система запомнит корректировку и учтёт её в следующем расчёте.')">Править вручную</button>
 <button class="btn acc" onclick="sparks();toast('План на 04.09 утверждён и передан в цех. Потребность в сырье пересчитана, по дрожжам сформирована заявка поставщику.')">Утвердить план</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Позиция</th><th class="right">Заказы точек</th><th class="right">Средние продажи</th><th class="right">Остаток</th><th class="right">К выпуску</th><th class="right">Сырьё, ₸</th><th>Смена</th></tr></thead><tbody>
 ${PROD.map((p,i)=>{const ord=[420,310,290,180,140,110,90,150][i];const avg=[520,410,380,240,180,150,120,200][i];
  const rest=[40,25,30,10,15,8,12,20][i];const make=Math.max(0,Math.round((ord+avg)/2)+ord-rest);
  return `<tr onclick="toast('Расчёт по позиции «${esc(p.n)}»: заказы ${ord} + прогноз ${avg} − остаток ${rest}. Технолог может изменить цифру, система запомнит поправку.')">
  <td><b>${esc(p.n)}</b><div class="sub">${p.w}</div></td>
  <td class="right mono">${ord}</td><td class="right mono">${avg}</td><td class="right mono">${rest}</td>
  <td class="right mono"><b style="color:var(--acc)">${make}</b></td>
  <td class="right mono">${fmt(make*p.cost*0.62)}</td>
  <td class="mini">${i<4?'ночная':'дневная'}</td></tr>`}).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Потребность в сырье на завтра</div>
   ${[['Мука пшеничная в/с','1 920 кг','хватает','g'],['Мука ржаная','280 кг','хватает впритык','a'],['Дрожжи','26 кг','не хватает 12 кг','r'],['Семечки','22 кг','хватает','g'],['Пакеты','2 140 шт','хватает','g']]
    .map(r=>`<div class="kv"><span>${r[0]}<div class="sub">${r[2]}</div></span><b class="mono">${r[1]}</b></div>`).join('')}
   <div class="note" style="--tone:var(--red)"><b>Дрожжей не хватает на завтрашний план</b><p>Система посчитала это сегодня днём, а не в 2 часа ночи, когда смена уже стоит у тестомеса. Заявка поставщику готова.</p></div>
   <button class="btn acc" style="width:100%;margin-top:9px" onclick="go('purchase')">Открыть заявку на закуп</button>
  </div>
  <div class="panel"><div class="ph-title">Почему план считает система</div>
   <div class="note" style="--tone:var(--acc)"><b>Меньше возвратов</b><p>План строится на реальных продажах точек, а не на «как обычно». Позиции, которые стабильно возвращаются, планируются меньше.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Меньше недовоза</b><p>Заказы точек попадают в план автоматически — забыть чью-то заявку невозможно.</p></div>
   <div class="note" style="--tone:var(--wheat)"><b>Понятная загрузка смены</b><p>Видно, сколько замесов нужно и хватит ли времени до отгрузки в 05:40.</p></div>
  </div>
 </div>`;

SC.recipes=()=>`
 <div class="head"><div><h2>Техкарты</h2><p>Рецептура, нормы сырья, выход и себестоимость. По ним списывается сырьё и считается стоимость каждой партии — это основа всей экономики.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Техкарта создаётся по вашей рецептуре: состав, нормы на 100 кг муки, выход, время этапов. После утверждения по ней начинает считаться себестоимость.')">+ Техкарта</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:880px"><thead><tr>
  <th>Позиция</th><th>Вес</th><th class="right">Мука, кг/100 шт</th><th class="right">Выход</th><th class="right">Себестоимость</th><th class="right">Цена</th><th class="right">Маржа</th></tr></thead><tbody>
 ${PROD.map((p,i)=>`<tr onclick="openRecipe('${p.id}')">
  <td><b>${esc(p.n)}</b></td><td class="mono">${p.w}</td>
  <td class="right mono">${[42,38,32,36,30,22,26,18][i]}</td>
  <td class="right mono">${[137,134,141,132,129,126,138,124][i]}%</td>
  <td class="right mono">${fmt(p.cost)} ₸</td><td class="right mono">${fmt(p.price)} ₸</td>
  <td class="right mono" style="color:var(--green)"><b>${Math.round((p.price-p.cost)/p.price*100)}%</b></td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Себестоимость пересчитывается сама.</b> Подорожала мука — новая цена прихода попадает в техкарту, и вы сразу видите, какие позиции стали убыточными при текущем прайсе для партнёров. Сейчас это выясняется в лучшем случае раз в квартал.</div>`;
function openRecipe(id){const p=PROD.find(x=>x.id===id);
 openD(`Техкарта · ${esc(p.n)}`,`${p.w} · себестоимость ${fmt(p.cost)} ₸ · цена ${fmt(p.price)} ₸`,[],
 `<div class="panel"><div class="ph-title">Состав на 100 изделий</div>
   <div class="tw"><table class="data"><thead><tr><th>Сырьё</th><th class="right">Норма</th><th class="right">Цена</th><th class="right">Сумма</th></tr></thead><tbody>
   ${[['Мука пшеничная в/с','42 кг',172,7224],['Дрожжи прессованные','0,8 кг',940,752],['Соль','0,6 кг',78,47],
      ['Сахар','0,4 кг',390,156],['Масло растительное','0,4 л',640,256],['Пакеты','100 шт',22,2200]]
    .map(r=>`<tr style="cursor:default"><td>${r[0]}</td><td class="right mono">${r[1]}</td><td class="right mono">${fmt(r[2])}</td><td class="right mono">${fmt(r[3])} ₸</td></tr>`).join('')}
   <tr style="cursor:default;font-weight:800;background:var(--card2)"><td>Сырьё на 100 шт</td><td></td><td></td><td class="right mono">10 635 ₸</td></tr>
   <tr style="cursor:default"><td>Работа смены и энергия</td><td></td><td></td><td class="right mono">6 165 ₸</td></tr>
   <tr style="cursor:default;font-weight:800"><td>Себестоимость одной штуки</td><td></td><td></td><td class="right mono">${fmt(p.cost)} ₸</td></tr>
   </tbody></table></div>
  </div>
  <div class="panel"><div class="ph-title">Процесс</div>
   <div class="chain">${['Замес 20 мин','Брожение 90 мин','Разделка 25 мин','Расстойка 55 мин','Выпечка 35 мин','Остывание 60 мин','Упаковка'].map((s,i,a)=>`<span class="cs ${i<3?'on':''}">${s}</span>${i<a.length-1?'<span class="ca">→</span>':''}`).join('')}</div>
   <div class="kv"><span>Полный цикл</span><b>4 часа 45 минут</b></div>
   <div class="kv"><span>Норма выхода теста</span><b>137% к муке</b></div>
   <div class="kv"><span>Допустимый брак</span><b>0,5%</b></div>
  </div>`)}

/* --- СКЛАД СЫРЬЯ --- */
SC.stock=()=>`
 <div class="head"><div><h2>Склад сырья</h2><p>То, что сейчас копится год и списывается бухгалтером «по остаткам». Здесь списание идёт по техкарте в момент замеса, а инвентаризация показывает расхождение сразу.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Инвентаризация: печатается лист, кладовщик вносит фактические остатки, система показывает расхождение по каждой позиции в штуках и в тенге.')">Инвентаризация</button>
 <button class="btn acc" onclick="go('purchase')">Заявки поставщикам</button></div></div>
 <div class="strip">
  <div><small>ПОЗИЦИЙ</small><b>${RAW.length}</b><span>сырьё и упаковка</span></div>
  <div><small>ОСТАТКИ НА СУММУ</small><b class="a">${fmt(RAW.reduce((a,r)=>a+r.qty*r.price,0))} ₸</b><span>по ценам прихода</span></div>
  <div><small>НИЖЕ МИНИМУМА</small><b class="r">${RAW.filter(r=>r.qty<r.min).length}</b><span>дрожжи, мука ржаная</span></div>
  <div><small>РАСХОЖДЕНИЕ</small><b class="w">96 кг</b><span>семечки · 79 000 ₸</span></div>
  <div><small>СПИСАНО ЗА СМЕНУ</small><b>${fmt(M.raw)} ₸</b><span>по техкартам</span></div>
 </div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:920px"><thead><tr>
  <th>Сырьё</th><th class="right">Остаток</th><th class="right">Минимум</th><th class="right">Цена</th><th class="right">Сумма</th><th>Срок</th><th>Поставщик</th><th>Статус</th></tr></thead><tbody>
 ${RAW.map(r=>`<tr onclick="openRaw('${r.id}')">
  <td><b>${esc(r.n)}</b></td>
  <td class="right mono"><b>${fmt(r.qty)} ${r.un}</b></td><td class="right mono">${fmt(r.min)}</td>
  <td class="right mono">${fmt(r.price)}</td><td class="right mono">${fmt(r.qty*r.price)}</td>
  <td class="mono">${r.life}</td><td class="mini">${r.sup}</td>
  <td>${r.qty<r.min?'<span class="badge r">закончится</span>':r.flag?'<span class="badge a">'+r.flag+'</span>':'<span class="badge g">в норме</span>'}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">История с семечками</div>
   <div class="note" style="--tone:var(--amber)"><b>По учёту 412 кг, по факту 316 кг</b><p>Разница 96 кг — это 79 000 ₸. Купили под мультизлаковый хлеб, часть ушла в другие рецептуры без списания, часть просто не нашли. Сейчас такие остатки «копятся год», а потом списываются одной строкой.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Как это работает в портале</b><p>Каждый замес списывает сырьё сам, по норме. Если фактический расход отличается — отклонение видно в тот же день, а не в конце года.</p></div>
   <button class="btn" style="width:100%;margin-top:9px" onclick="toast('Расхождение оформлено: акт инвентаризации, причина, ответственный. Дальше оно попадает в отчёт по потерям, а не растворяется в остатках.')">Оформить расхождение</button>
  </div>
  <div class="panel"><div class="ph-title">Движение за сегодня</div>
   ${[['Приход · мука в/с, 1 000 кг','+172 000 ₸','g'],['Списание на замесы','−'+fmt(M.raw)+' ₸','r'],['Списание брака','−8 400 ₸','r'],['Возврат поставщику · дрожжи','+18 800 ₸','g']]
    .map(r=>`<div class="kv"><span>${r[0]}</span><b class="mono" style="color:${r[2]==='g'?'var(--green)':'var(--red)'}">${r[1]}</b></div>`).join('')}
   <div class="kv"><span>Остаток на конец дня</span><b class="mono">${fmt(RAW.reduce((a,r)=>a+r.qty*r.price,0))} ₸</b></div>
  </div>
 </div>`;
function openRaw(id){const r=RAW.find(x=>x.id===id);
 openD(esc(r.n),`${fmt(r.qty)} ${r.un} · ${fmt(r.price)} ₸ за ${r.un} · ${r.sup}`,[],
 `<div class="strip" style="grid-template-columns:repeat(3,1fr)">
   <div><small>ОСТАТОК</small><b>${fmt(r.qty)} ${r.un}</b><span>минимум ${fmt(r.min)}</span></div>
   <div><small>НА СУММУ</small><b>${fmt(r.qty*r.price)} ₸</b><span>по цене прихода</span></div>
   <div><small>ХВАТИТ НА</small><b>${r.qty<r.min?'2 дня':'11 дней'}</b><span>по среднему расходу</span></div>
  </div>
  <div class="panel"><div class="ph-title">Движение</div>
   ${[['03.09','Списание на партию ПР-3121','−224 '+r.un],['03.09','Приход от поставщика','+1 000 '+r.un],['02.09','Списание на партии смены','−318 '+r.un],['01.09','Инвентаризация','расхождение −96 '+r.un]]
    .map(x=>`<div class="kv"><span>${x[0]} · ${x[1]}</span><b class="mono">${x[2]}</b></div>`).join('')}
  </div>
  <div class="btns"><button class="btn acc" onclick="toast('Заявка поставщику «${r.sup}» сформирована: количество рассчитано по плану выпуска на неделю вперёд.')">Заявка поставщику</button>
  <button class="btn" onclick="toast('Списание оформлено с указанием причины и ответственного.')">Списать</button></div>`)}

SC.purchase=()=>`
 <div class="head"><div><h2>Закуп</h2><p>Заявки поставщикам формируются из плана выпуска и минимальных остатков. Цены прихода сразу попадают в себестоимость — техкарты пересчитываются автоматически.</p></div>
 <div class="btns"><button class="btn acc" onclick="sparks();toast('Заявка отправлена поставщику «БиоЛайн» в WhatsApp: дрожжи 100 кг к 04.09. Приход отметит кладовщик, цена уйдёт в себестоимость.')">Отправить заявку</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:880px"><thead><tr>
  <th>Сырьё</th><th class="right">Остаток</th><th class="right">Нужно на неделю</th><th class="right">Заказать</th><th class="right">Сумма</th><th>Поставщик</th><th>Срок</th></tr></thead><tbody>
 ${[['Дрожжи прессованные',38,180,150,940,'БиоЛайн','1 день'],
    ['Мука ржаная обдирная',410,1400,1200,154,'Астык Трейд','2 дня'],
    ['Мука пшеничная в/с',2840,9600,7000,172,'Астык Трейд','2 дня'],
    ['Пакеты с логотипом',11400,14000,10000,22,'Пак Астана','5 дней'],
    ['Масло растительное',96,240,200,640,'СладПром','3 дня']]
  .map(r=>`<tr onclick="toast('Позиция «${r[0]}»: количество посчитано из плана выпуска на неделю с учётом остатка. Можно изменить перед отправкой.')">
  <td><b>${r[0]}</b></td><td class="right mono">${fmt(r[1])}</td><td class="right mono">${fmt(r[2])}</td>
  <td class="right mono"><b>${fmt(r[3])}</b></td><td class="right mono">${fmt(r[3]*r[4])} ₸</td>
  <td class="mini">${r[5]}</td><td class="mini">${r[6]}</td></tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Поставщики</div>
   ${[['Астык Трейд','мука пшеничная и ржаная','2 дня','цены с 01.09 +4%'],['БиоЛайн','дрожжи, солод','1 день','стабильно'],['СладПром','сахар, масло, семечки','3 дня','цены выросли на 7%'],['Пак Астана','упаковка и этикетки','5 дней','стабильно']]
    .map(r=>`<div class="kv"><span><b>${r[0]}</b><div class="sub">${r[1]} · поставка ${r[2]}</div></span><span class="badge ${r[3].includes('+')||r[3].includes('выросли')?'a':'g'}">${r[3]}</span></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Как рост цен виден сразу</div>
   <div class="note" style="--tone:var(--amber)"><b>Мука подорожала на 4% с 1 сентября</b><p>Себестоимость формового хлеба выросла со 161 до 168 ₸. При отпускной цене 320 ₸ маржа упала с 49,7% до 47,5%. Раньше это выяснялось в конце квартала — теперь в день прихода.</p></div>
   <div class="kv" style="margin-top:8px"><span>Позиций с упавшей маржой</span><b>3</b></div>
   <div class="kv"><span>Рекомендация системы</span><b>пересмотреть прайс по 2 позициям</b></div>
  </div>
 </div>`;

SC.wh=()=>`
 <div class="head"><div><h2>Склад готовой продукции</h2><p>Что выпущено, что отгружено, что вернулось и что осталось. По каждой позиции — движение за день, без пересчёта в тетради.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Отгрузка оформлена: накладные по маршруту сформированы, продукция списана со склада, экспедитор видит задание.')">Оформить отгрузку</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Позиция</th><th class="right">Выпущено</th><th class="right">Отгружено</th><th class="right">Возврат</th><th class="right">Остаток</th><th class="right">Сумма остатка</th><th>Статус</th></tr></thead><tbody>
 ${PROD.map((p,i)=>{const made=[520,410,380,240,180,150,120,200][i];const ship=[505,398,366,232,172,146,112,192][i];
  const ret=[26,22,18,14,12,9,7,11][i];const rest=made-ship;
  return `<tr onclick="toast('«${esc(p.n)}»: выпущено ${made}, отгружено ${ship}, вернулось ${ret}, осталось ${rest}. Остаток учитывается в плане на завтра.')">
  <td><b>${esc(p.n)}</b><div class="sub">${p.w}</div></td>
  <td class="right mono">${made}</td><td class="right mono">${ship}</td>
  <td class="right mono" style="color:var(--red)">${ret}</td>
  <td class="right mono"><b>${rest}</b></td><td class="right mono">${fmt(rest*p.cost)} ₸</td>
  <td>${rest>25?'<span class="badge a">много осталось</span>':'<span class="badge g">в норме</span>'}</td></tr>`}).join('')}
 </tbody></table></div></div>
 <div class="hint"><b>Остаток на складе — это завтрашний план.</b> Система вычитает его из потребности, чтобы не печь то, что уже лежит. Хлеб живёт сутки, поэтому каждая лишняя буханка — прямые потери.</div>`;

/* --- ЛОГИСТИКА --- */
SC.logistics=()=>`
 <div class="head"><div><h2>Маршруты</h2><p>Два рейса по городу, 21 точка. Экспедитор видит задание в телефоне, отмечает отгрузку и принимает возврат прямо на точке — накладная закрывается там же, а не вечером в офисе.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Оптимизация маршрута — отдельный модуль. На вашем объёме (постоянные точки, объезд через день) выигрыш небольшой: сейчас достаточно закреплённого порядка объезда, который система запоминает.')">Про оптимизацию маршрута</button>
 <button class="btn acc" onclick="go('driver')">Экран экспедитора</button></div></div>
 <div class="strip">
  <div><small>РЕЙСОВ СЕГОДНЯ</small><b>2</b><span>левый и правый берег</span></div>
  <div><small>ТОЧЕК В ОБЪЕЗДЕ</small><b class="a">21</b><span>17 доставлено</span></div>
  <div><small>ПРОБЕГ</small><b>135 км</b><span>топливо 8 200 ₸</span></div>
  <div><small>СРЕДНЕЕ ВРЕМЯ НА ТОЧКУ</small><b>12 мин</b><span>с выгрузкой и возвратом</span></div>
  <div><small>ОПОЗДАНИЙ</small><b class="g">0</b><span>все до 10:30</span></div>
 </div>
 <div class="g21">
  <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:700px"><thead><tr>
   <th>Рейс</th><th>Экспедитор</th><th>Машина</th><th class="right">Точек</th><th class="right">Доставлено</th><th class="right">Пробег</th><th>Время</th><th>Статус</th></tr></thead><tbody>
  ${ROUTES.map(r=>`<tr onclick="toast('Рейс ${r.n}: список точек в порядке объезда, накладные, суммы к получению и принятые возвраты. Всё закрывается в телефоне экспедитора.')">
   <td class="mono"><b>${r.id}</b></td><td><b>${r.exp}</b></td><td class="mini">${r.car}</td>
   <td class="right mono">${r.pts}</td><td class="right mono">${r.done}</td><td class="right mono">${r.km} км</td>
   <td class="mono">${r.t}</td>
   <td>${r.done===r.pts?'<span class="badge g">завершён</span>':'<span class="badge b">в пути</span>'}</td></tr>`).join('')}
  </tbody></table></div>
   <div class="note" style="--tone:var(--acc)"><b>Порядок объезда закрепляется за рейсом</b><p>Точки у вас постоянные, часть — через день. Система хранит порядок и сама подставляет его в задание, подсвечивая точки, у которых сегодня нет заказа.</p></div>
   <div class="note" style="--tone:var(--wheat)"><b>Автоматическая оптимизация — отдельная доработка</b><p>Мы честно сказали на встрече: строить свою маршрутизацию под 20 постоянных точек дорого и почти бесполезно. Если решите — подключим карты отдельным этапом.</p></div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Что экспедитор делает на точке</div>
    ${['Открывает точку в телефоне и видит накладную','Отгружает и отмечает фактическое количество','Принимает возврат: позиции и причина','Забирает деньги, если точка на предоплате','Точка подтверждает — накладная закрыта']
     .map(t=>`<div class="chk"><i>✓</i><span>${t}</span></div>`).join('')}
    <div class="note" style="--tone:var(--green)"><b>Вечером в офисе делать нечего</b><p>Все накладные, возвраты и наличные уже в системе — их не нужно переносить с бумаги.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Расходы по рейсам</div>
    <div class="kv"><span>Топливо за месяц</span><b class="mono">213 000 ₸</b></div>
    <div class="kv"><span>Обслуживание машин</span><b class="mono">307 000 ₸</b></div>
    <div class="kv"><span>Стоимость доставки одной точки</span><b class="mono">1 240 ₸</b></div>
    <div class="kv"><span>Доля логистики в выручке</span><b>4,1%</b></div>
   </div>
  </div>
 </div>`;

SC.driver=()=>`
 <div class="head"><div><h2>Экран экспедитора</h2><p>Так задание выглядит в телефоне у водителя: только его рейс, только сегодняшние точки. Никаких лишних кнопок — отгрузил, принял возврат, отметил оплату.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Отметка «доставлено» отправлена: накладная закрыта, сумма встала в баланс точки, менеджер видит статус в реальном времени.')">Отметить доставку</button></div></div>
 <div class="g12">
  <div style="display:flex;justify-content:center">
   <div class="phone">
    <div class="ph-top"><b>Рейс М-1 · Левый берег</b><small>Ержан · 11 точек · 7 из 11 выполнено</small></div>
    <div class="pt-item on"><b>4. Магнум · Кабанбай 62</b><span>сейчас · 186 400 ₸ · отсрочка 14 дней</span>
     <div style="margin-top:7px;display:flex;gap:6px"><button class="btn acc" style="padding:6px 10px;font-size:9.6px" onclick="toast('Отгрузка отмечена: 5 позиций, 640 штук. Накладная подписана представителем точки в телефоне.')">Отгрузить</button>
     <button class="btn" style="padding:6px 10px;font-size:9.6px" onclick="toast('Возврат принят: 18 буханок формового, причина «не продано». Оформлен обмен, сумма учтена в сальдо точки.')">Возврат</button></div></div>
    <div class="pt-item"><b>5. Дастархан · Пушкина 24</b><span>следующая · 52 400 ₸ · реализация</span></div>
    <div class="pt-item"><b>6. Green Market · Туран 55</b><span>74 300 ₸ · консигнация</span></div>
    <div class="pt-item"><b>7. Продукты 24 · Жубанова 9</b><span>предоплата · получить 41 000 ₸ наличными</span></div>
    <div class="pt-item" style="color:var(--muted)"><b>3. Астыкжан · Карталы 146 ✓</b><span>доставлено 07:12 · возврат 6 шт</span></div>
   </div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Что это меняет</div>
    <div class="note" style="--tone:var(--acc)"><b>Возврат фиксируется на месте</b><p>Сейчас его записывают на бумаге и переносят потом — или не переносят. В телефоне это две кнопки, и цифра сразу попадает в отчёт по потерям.</p></div>
    <div class="note" style="--tone:var(--green)"><b>Наличные не теряются</b><p>Экспедитор отмечает полученную сумму, она сразу видна в дебиторке. Вечером сходится касса, а не воспоминания.</p></div>
    <div class="note" style="--tone:var(--wheat)"><b>Точка видит, что ей везут</b><p>По желанию — короткая ссылка партнёру со списком позиций и суммой. Часть споров исчезает до того, как возникнет.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Итог рейса</div>
    <div class="kv"><span>Отгружено</span><b class="mono">1 042 шт · 312 400 ₸</b></div>
    <div class="kv"><span>Принято возвратов</span><b class="mono">64 шт · 19 100 ₸</b></div>
    <div class="kv"><span>Получено наличными</span><b class="mono">161 000 ₸</b></div>
    <div class="kv"><span>Время в пути</span><b>4 ч 40 мин</b></div>
   </div>
  </div>
 </div>`;

/* --- ФИНАНСЫ --- */
SC.finance=()=>{const off=EXP.filter(e=>e.type==='офиц').reduce((a,e)=>a+e.sum,0);
 const oth=EXP.filter(e=>e.type==='проч').reduce((a,e)=>a+e.sum,0);
 return `<div class="head"><div><h2>Финансы</h2><p>Деньги, себестоимость и расходы — включая те, которых нет в бухгалтерии. Вы говорили об этом на встрече: такси, курьеры, наличные расчёты. Они тоже влияют на прибыль, значит должны считаться.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Выгрузка: движение денег, P&L и расшифровка расходов за период в Excel.')">Выгрузить</button></div></div>
 <div class="strip">
  <div><small>ВЫРУЧКА ЗА МЕСЯЦ</small><b>${mln(revAll())} млн ₸</b><span class="g">+8% к августу</span></div>
  <div><small>СЕБЕСТОИМОСТЬ</small><b>6,42 млн ₸</b><span>сырьё и работа цеха</span></div>
  <div><small>РАСХОДЫ</small><b>${mln(off+oth-6420000)} млн ₸</b><span>без сырья</span></div>
  <div><small>ПОТЕРИ</small><b class="r">1,14 млн ₸</b><span>возвраты, брак, недовыпуск</span></div>
  <div><small>ПРИБЫЛЬ</small><b class="g">${mln(revAll()-off-oth)} млн ₸</b><span>${Math.round((revAll()-off-oth)/revAll()*100)}% от выручки</span></div>
 </div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Расходы: официальные и прочие</div>
   <div class="tw"><table class="data"><thead><tr><th>Статья</th><th>Контур</th><th class="right">Сумма</th><th class="right">Доля</th></tr></thead><tbody>
   ${EXP.map(e=>`<tr style="cursor:default"><td><b>${e.n}</b></td>
    <td><span class="badge ${e.type==='офиц'?'b':'w'}">${e.type==='офиц'?'бухгалтерия':'прочие'}</span></td>
    <td class="right mono">${fmt(e.sum)}</td><td class="right mono">${num(e.sum/(off+oth)*100)}%</td></tr>`).join('')}
   <tr style="cursor:default;font-weight:800;background:var(--card2)"><td>Итого</td><td></td><td class="right mono">${fmt(off+oth)}</td><td class="right mono">100%</td></tr>
   </tbody></table></div>
   <div class="note" style="--tone:var(--wheat)"><b>Расходы вне бухгалтерского контура — ${fmt(oth)} ₸ в месяц</b><p>Это 5,7% всех затрат. Пока они не считаются, прибыль на бумаге отличается от реальной. В портале они учитываются отдельным контуром: в управленческом отчёте видны, в бухгалтерский не уходят.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Куда уходят деньги</div>
   ${EXP.map(e=>`<div class="fr" style="grid-template-columns:220px 1fr 96px"><span>${e.n}</span>
    <div class="bar"><i style="--w:${e.sum/6420000*100}%;background:${e.type==='проч'?'var(--wheat)':'var(--acc)'}"></i></div><b>${fmt(e.sum)}</b></div>`).join('')}
   <div class="kv" style="margin-top:9px"><span>Себестоимость одной буханки</span><b class="mono">158 ₸</b></div>
   <div class="kv"><span>Средняя цена отгрузки</span><b class="mono">292 ₸</b></div>
   <div class="kv"><span>Прибыль с буханки</span><b class="mono" style="color:var(--green)">61 ₸</b></div>
   <div class="kv"><span>Потери на буханку</span><b class="mono" style="color:var(--red)">−17 ₸</b></div>
  </div>
 </div>
 <div class="panel"><div class="ph-title">Движение денег по неделям</div>
  ${[['Неделя 1',2410000,2180000],['Неделя 2',2640000,2260000],['Неделя 3',2380000,2410000],['Неделя 4',2650000,2190000]].map(w=>
   `<div class="fr" style="grid-template-columns:110px 1fr 1fr 110px"><span>${w[0]}</span>
    <div class="bar"><i style="--w:${w[1]/2700000*100}%;background:var(--green)"></i></div>
    <div class="bar"><i style="--w:${w[2]/2700000*100}%;background:var(--red)"></i></div>
    <b>${fmt(w[1]-w[2])}</b></div>`).join('')}
  <div class="mini">зелёное — поступления, красное — платежи, справа — сальдо недели</div>
 </div>`};

SC.kpi=()=>`
 <div class="head"><div><h2>KPI сотрудников</h2><p>Вы просили это на встрече. Показатели считаются из работы, а не заполняются вручную: выпуск и брак по сменам, возвраты и сбор денег по менеджерам, доставка по экспедиторам.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Формулы KPI настраиваются: какие показатели, с какими весами и за какой период. Премия считается автоматически.')">Настроить формулы</button></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Менеджеры по продажам</div>
   <div class="tw"><table class="data"><thead><tr><th>Сотрудник</th><th class="right">Оборот</th><th class="right">Возврат</th><th class="right">Собрано денег</th><th class="right">Просрочка</th></tr></thead><tbody>
   ${[['Асем',5651000,5.4,4820000,1],['Дана',6151000,7.1,4210000,3]].map(r=>
    `<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="right mono">${fmt(r[1])}</td>
    <td class="right mono" style="color:${r[2]>6?'var(--red)':'var(--green)'}">${num(r[2])}%</td>
    <td class="right mono">${fmt(r[3])}</td><td class="right mono">${r[4]} точки</td></tr>`).join('')}
   </tbody></table></div>
   <div class="note" style="--tone:var(--acc)"><b>Оборот — не единственный показатель</b><p>Можно возить много и возвращать 10%, а можно возить ровно и собирать деньги вовремя. Здесь видно и то, и другое.</p></div>
  </div>
  <div class="panel"><div class="ph-title">Смены цеха</div>
   <div class="tw"><table class="data"><thead><tr><th>Смена</th><th class="right">Выпуск</th><th class="right">План</th><th class="right">Брак</th><th class="right">Выход теста</th></tr></thead><tbody>
   ${[['Ночная · Мурат',2072,2140,3.2,134.9],['Дневная · Асхат',1180,1200,0.6,137.2]].map(r=>
    `<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="right mono">${fmt(r[1])}</td><td class="right mono">${fmt(r[2])}</td>
    <td class="right mono" style="color:${r[3]>1?'var(--red)':'var(--green)'}">${num(r[3])}%</td>
    <td class="right mono">${num(r[4])}%</td></tr>`).join('')}
   </tbody></table></div>
   <div class="note" style="--tone:var(--red)"><b>Ночная смена: брак 3,2% против 0,6% у дневной</b><p>Это 62 000 ₸ за смену. Причина может быть в оборудовании или в людях — но сначала это нужно увидеть цифрой.</p></div>
  </div>
 </div>
 <div class="panel"><div class="ph-title">Экспедиторы</div>
  <div class="tw"><table class="data"><thead><tr><th>Экспедитор</th><th class="right">Точек в день</th><th class="right">Опозданий</th><th class="right">Собрано наличными</th><th class="right">Расхождения по накладным</th></tr></thead><tbody>
  ${[['Ержан',11,0,161000,0],['Азамат',10,2,84000,1]].map(r=>
   `<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="right mono">${r[1]}</td>
   <td class="right mono" style="color:${r[2]?'var(--amber)':'var(--green)'}">${r[2]}</td>
   <td class="right mono">${fmt(r[3])}</td><td class="right mono">${r[4]}</td></tr>`).join('')}
  </tbody></table></div>
 </div>`;

SC.reports=()=>`
 <div class="head"><div><h2>Отчёты</h2><p>Любой срез выгружается в Excel за выбранный период. Данные берутся из работы сотрудников, а не собираются к совещанию.</p></div></div>
 <div class="g3">
 ${[['Сходимость','сырьё → выпуск → отгрузка → продажа, с расхождениями','⇄'],
    ['Продажи по точкам','оборот, средняя поставка, динамика','⌂'],
    ['Возвраты','по точкам, позициям и причинам','↩'],
    ['Дебиторка','долги, просрочка, поступления, сверки','₸'],
    ['Производство','выпуск, себестоимость смены, брак и выход','◍'],
    ['Склад сырья','движение, остатки, расхождения инвентаризации','▥'],
    ['Ассортимент','что продаётся, что возвращается, маржа по позициям','☰'],
    ['Логистика','рейсы, пробег, стоимость доставки точки','⇢'],
    ['Финансы','P&L, движение денег, расходы обоих контуров','◈']]
  .map(r=>`<div class="panel" style="cursor:pointer" onclick="toast('Отчёт «${r[0]}» сформирован и выгружен в Excel за выбранный период.')">
   <div style="font-size:19px;color:var(--acc)">${r[2]}</div>
   <div class="ph-title" style="margin-top:7px">${r[0]}</div><p class="mini" style="margin-top:4px">${r[1]}</p></div>`).join('')}
 </div>`;

/* --- 1С --- */
SC.c1=()=>`
 <div class="head"><div><h2>Обмен с 1С</h2><p>Документы формируются в портале и уходят в вашу облачную 1С черновиками по протоколу OData. Номер, присвоенный в 1С, возвращается обратно в карточку заказа.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Обмен идёт по расписанию — каждые 10 минут, и по кнопке при создании документа. Работает в обе стороны.')">Расписание обмена</button>
 <button class="btn acc" onclick="sparks();toast('Документ отправлен в 1С: накладная №4431 создана черновиком, номер вернулся в портал. Бухгалтер видит её у себя и проводит.')">Отправить документ</button></div></div>
 <div class="strip">
  <div><small>ВЕРСИЯ</small><b style="font-size:15px">1С 8.3 · облако</b><span>одна база</span></div>
  <div><small>ПРОТОКОЛ</small><b style="font-size:15px">OData</b><span>работает в обе стороны</span></div>
  <div><small>ДОКУМЕНТОВ ЗА ДЕНЬ</small><b class="a">34</b><span>накладные, счета, ЭСФ</span></div>
  <div><small>ОШИБОК</small><b class="g">0</b><span>повтор при сбое связи</span></div>
  <div><small>РУЧНОГО ВВОДА</small><b class="g">нет</b><span>документ создаётся один раз</span></div>
 </div>
 <div class="g21">
  <div class="panel"><div class="ph-title">Что уходит в 1С и что возвращается</div>
   <div class="tw"><table class="data" style="min-width:640px"><thead><tr><th>Документ</th><th>Куда</th><th>Что возвращается</th><th>Кто создаёт</th></tr></thead><tbody>
   ${[['Накладная на отгрузку','Реализация товаров','номер и дата проведения','менеджер или экспедитор'],
      ['Счёт на оплату','Счёт покупателю','номер счёта','менеджер'],
      ['Счёт-фактура / ЭСФ','Счёт-фактура выданный','номер, статус выписки','бухгалтер'],
      ['Возврат от покупателя','Возврат товаров','номер документа','экспедитор на точке'],
      ['Приход сырья','Поступление товаров','номер, цена прихода','кладовщик'],
      ['Оплата от покупателя','—','из выписки в портал','автоматически']]
    .map(r=>`<tr style="cursor:default"><td><b>${r[0]}</b></td><td class="mini">${r[1]}</td><td class="mini">${r[2]}</td><td class="mini">${r[3]}</td></tr>`).join('')}
   </tbody></table></div>
   <div class="note" style="--tone:var(--acc)"><b>Документ создаётся один раз</b><p>Сейчас накладную пишут в портале работы, а потом бухгалтер вбивает её в 1С заново. При обмене этот второй ввод исчезает — вместе с ошибками ввода и задержкой в неделю.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Сначала тестовая база</b><p>Бухгалтер делает копию базы, мы настраиваем обмен на ней и показываем результат. Только когда бухгалтера всё устраивает — переключаемся на рабочую базу.</p></div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Журнал обмена</div>
    ${[['09:14','Накладная №4429 → 1С','ok'],['09:02','Счёт №1180 → 1С','ok'],['08:40','Оплата п/п 418 ← 1С','ok'],['08:12','Возврат В-1204 → 1С','ok'],['07:55','Приход муки → 1С','ok']]
     .map(r=>`<div class="kv"><span class="mono" style="font-size:9.4px">${r[0]}</span><span style="flex:1;text-align:left;font-size:10px">${r[1]}</span><span class="badge g">успешно</span></div>`).join('')}
   </div>
   <div class="panel"><div class="ph-title">Почему это отдельная работа</div>
    <p class="mini" style="margin-top:4px">1С — чужая система со своей логикой документов. Нужно согласовать с бухгалтером, какие документы и в каком виде создавать, настроить обмен на тестовой базе, проверить проведение и только потом переключиться на рабочую.</p>
    <div class="kv" style="margin-top:8px"><span>Срок</span><b>2 недели параллельно</b></div>
    <div class="kv"><span>Нужен от вас</span><b>доступ к тестовой базе</b></div>
    <div class="kv"><span>Участие бухгалтера</span><b>2–3 созвона</b></div>
   </div>
  </div>
 </div>`;

/* --- AI --- */
const AIQ=[
 ['Сколько сырья ушло вчера и сходится ли это с продажами?',
  'За 02.09 списано сырья на <b>1 284 000 ₸</b>, выпущено <b>2 072</b> изделия при плане 2 140. Отгружено 2 005, вернулось 139, продано <b>1 866</b>.<br>Разрыв «план → продажа» — <b>274 штуки на 80 000 ₸</b>. Основной вклад: возвраты по четырём точкам (139 шт) и бой при упаковке (67 шт).<br>Перерасход муки за смену — 38 кг сверх техкарты.'],
 ['Кто из партнёров должен больше всего и кто не платит вовремя?',
  'Общая дебиторка — <b>4,51 млн ₸</b> у 8 точек.<br>Больше всех должен <b>Магнум · Кабанбай 62</b> — 1 840 000 ₸, просрочка 12 дней. Дальше: Anvar — 740 000 ₸, Береке маркет — 520 000 ₸.<br>Дольше всех тянет <b>Магазин №7 · Тлендиева</b> — 21 день просрочки при консигнации. У него же самый высокий возврат: 11,8%.'],
 ['Какие позиции невыгодно возить в Магазин №7?',
  'За месяц туда отгружено на 640 000 ₸, возврат <b>11,8%</b> — это 75 500 ₸.<br>Возвращаются в основном багеты (34% возврата) и мультизлаковый (28%). По этим позициям привоз стоит сократить на 30–40%: расчётный эффект — <b>+22 000 ₸</b> в месяц без потери выручки.'],
 ['Сколько мы теряем на возвратах по всей сети?',
  'Возвраты за месяц — <b>139 шт в день в среднем</b>, около <b>1,06 млн ₸</b> в месяц. Из них обмен 59%, списание 27%, утилизация 14%.<br>Снижение среднего возврата с 6,4% до 5% даст примерно <b>230 000 ₸ в месяц</b>. Наибольший потенциал — четыре точки с возвратом выше 9%.']
];
let aiI=-1;
SC.ai=()=>`
 <div class="head"><div><h2>AI-помощник по вашим данным</h2><p>То, о чём вы спрашивали: задать вопрос своими словами и получить ответ по данным портала. Не общий чат из интернета, а доступ именно к вашим цифрам — через защищённый шлюз, без выгрузки базы наружу.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Утренняя сводка приходит в WhatsApp в 8:00: выпуск, отгрузки, возвраты, поступления денег и что требует решения. Настраивается под вас.')">Утренняя сводка</button></div></div>
 <div class="g21">
  <div>
   <div class="chat">
    ${aiI<0?`<div class="msg a">Задайте вопрос по вашим данным — например, любой из тех, что справа. Ответ считается по цифрам портала за нужный период.</div>`:
     `<div class="msg u">${esc(AIQ[aiI][0])}</div><div class="msg a">${AIQ[aiI][1]}</div>`}
    <div class="cin"><input id="aiIn" placeholder="Спросите что-нибудь о работе пекарни…" onkeydown="if(event.key==='Enter')askAI()">
     <button class="btn acc" onclick="askAI()">Спросить</button></div>
   </div>
   <div class="panel" style="margin-top:11px"><div class="ph-title">Готовые вопросы — нажмите любой</div>
    ${AIQ.map((q,i)=>`<div class="kv" style="cursor:pointer" onclick="aiI=${i};render()"><span>${esc(q[0])}</span><b>→</b></div>`).join('')}
   </div>
  </div>
  <div>
   <div class="panel"><div class="ph-title">Как это устроено технически</div>
    <div class="note" style="--tone:var(--acc)"><b>Данные остаются на вашем сервере</b><p>Помощник получает доступ к порталу через отдельный шлюз с ограниченными правами: он читает нужные цифры, а не забирает базу целиком.</p></div>
    <div class="note" style="--tone:var(--green)"><b>Работает с вашим корпоративным аккаунтом</b><p>Никаких личных переписок и случайных данных: подключается один рабочий аккаунт, доступ можно отозвать в любой момент.</p></div>
    <div class="note" style="--tone:var(--wheat)"><b>Постоянные вопросы лучше делать отчётом</b><p>Если один и тот же вопрос задаётся каждый день, мы превращаем его в готовый экран или в утреннюю сводку — это быстрее и надёжнее.</p></div>
   </div>
   <div class="panel"><div class="ph-title">Что можно спрашивать</div>
    ${['Сколько замесили и сколько продали','Кто должен и сколько дней просрочки','Какие позиции возвращаются чаще всего','Что заканчивается на складе','Сколько заработали на конкретной точке','Как изменилась себестоимость после подорожания муки']
     .map(t=>`<div class="chk"><i>✓</i><span>${t}</span></div>`).join('')}
    <div class="kv" style="margin-top:8px"><span>Отдельный модуль</span><b>подключается после ядра</b></div>
   </div>
  </div>
 </div>`;
function askAI(){const el=document.getElementById('aiIn');const v=(el&&el.value||'').trim();
 aiI=v?Math.floor(Math.random()*AIQ.length):0;render();
 toast('Ответ посчитан по данным портала за выбранный период. В реальной системе помощник видит ровно те данные, к которым вы дали доступ.')}

/* --- ЗАДАЧИ --- */
const TCOLS=[['new','НОВЫЕ'],['work','В РАБОТЕ'],['check','НА ПРОВЕРКЕ'],['done','ГОТОВО']];
const USERS={'Камила':['КА','w'],'Мурат':['МУ',''],'Данияр':['ДА','b'],'Асем':['АС','v'],'Ержан':['ЕР','r'],'Гульдана':['ГТ','']};
let TASKS=[
 {id:'З-118',t:'Разобраться с расхождением по семечкам (96 кг)',col:'work',who:'Данияр',from:'Камила',due:'05.09',pr:'high',auto:true,
  d:'По учёту 412 кг, по факту 316. Проверить, куда ушло: списание в другие рецептуры, пересортица или недостача.',
  chk:[['Поднять приходы за 3 месяца',1],['Сверить списания по партиям',0],['Оформить акт расхождения',0]],
  cm:[['Камила','03.09 09:10','Это 79 тысяч. Нужно понять причину, а не просто списать.']],
  hist:[['03.09 09:05','создана автоматически по итогам инвентаризации']]},
 {id:'З-117',t:'Заказать дрожжи — остаток ниже минимума',col:'new',who:'Данияр',from:'система',due:'03.09',pr:'high',auto:true,
  d:'38 кг при минимуме 60. На завтрашний план не хватает 12 кг.',
  chk:[['Подтвердить заявку в БиоЛайн',0],['Принять приход',0]],cm:[],
  hist:[['03.09 08:00','создана автоматически: остаток ниже минимума']]},
 {id:'З-116',t:'Пересмотреть привоз в Магазин №7 · возврат 11,8%',col:'new',who:'Асем',from:'Гульдана',due:'06.09',pr:'high',auto:false,
  d:'Точка возвращает почти 12% привоза. Сократить объём по багетам и мультизлаковому, согласовать с директором магазина.',
  chk:[['Собрать статистику по позициям',1],['Согласовать новый объём',0],['Проконтролировать через неделю',0]],
  cm:[['Гульдана','02.09 18:20','Возим им больше, чем они продают. Это наши потери, а не их.']],
  hist:[['02.09 18:15','создана']]},
 {id:'З-115',t:'Акт сверки с Магнумом — спор по платежу 700 000 ₸',col:'check',who:'Асем',from:'Камила',due:'03.09',pr:'high',auto:false,
  d:'Партнёр утверждает, что платёж прошёл 02.09. Сформировать акт сверки и отправить.',
  chk:[['Найти платёж в выписке',1],['Сформировать акт',1],['Отправить партнёру',0]],
  cm:[['Асем','03.09 10:05','Платёж есть, сальдо 1 840 000 ₸ с его учётом. Акт готов, отправляю.']],
  hist:[['02.09 16:40','создана'],['03.09 10:06','перенесена на проверку']]},
 {id:'З-114',t:'Разобрать причину брака в ночной смене (3,2%)',col:'work',who:'Мурат',from:'Камила',due:'07.09',pr:'mid',auto:false,
  d:'Брак ночной смены в пять раз выше дневной. Проверить расстоечный шкаф и работу смены.',
  chk:[['Проверить оборудование',1],['Сравнить по замесам',0],['Провести разбор со сменой',0]],cm:[],
  hist:[['01.09 12:00','создана']]},
 {id:'З-113',t:'Подготовить документы для нового партнёра (Сыганак)',col:'done',who:'Асем',from:'Гульдана',due:'02.09',pr:'low',auto:false,
  d:'Заявка с 2GIS. Подготовить договор, прайс и условия по реализации.',
  chk:[['Договор',1],['Прайс',1],['Условия оплаты',1]],
  cm:[['Асем','02.09 15:30','Отправила, ждём подписания.']],
  hist:[['31.08 11:00','создана'],['02.09 15:31','закрыта']]}
];
let tFilter='all',tSeq=119;
const ME={'Собственник':'Гульдана','Операционный директор':'Камила','Менеджер по продажам':'Асем','Технолог цеха':'Мурат','Кладовщик':'Данияр','Экспедитор':'Ержан','Бухгалтер (аутсорс)':'Камила'};
const PRC={high:'var(--red)',mid:'var(--amber)',low:'var(--line2)'};
const PRN={high:'высокий',mid:'обычный',low:'низкий'};
const dueDays=d=>{if(!d)return 99;const [dd,mm]=d.split('.').map(Number);return Math.round((new Date(2026,mm-1,dd)-new Date(2026,8,3))/86400000)};
const dueState=d=>{const x=dueDays(d);return x<0?'late':x<=1?'soon':''};
const dueText=(d,col)=>{if(col==='done')return 'закрыта';const x=dueDays(d);
 return x<0?`просрочена на ${-x} дн.`:x===0?'истекает сегодня':x===1?'истекает завтра':'в срок'};
SC.tasks=()=>{const me=ME[role];const open=TASKS.filter(t=>t.col!=='done');
 const vis=TASKS.filter(t=>tFilter==='all'?1:tFilter==='me'?t.who===me:tFilter==='late'?(dueState(t.due)==='late'&&t.col!=='done'):t.auto);
 return `<div class="head"><div><h2>Задачи</h2><p>Административные поручения, о которых вы спрашивали: кто, что и к какому сроку. Часть задач система ставит сама — по остаткам сырья, расхождениям и возвратам.</p></div>
 <div class="btns"><button class="btn" onclick="toast('Уведомления: исполнителю при назначении, за день до срока и при просрочке — в WhatsApp или в портале.')">Уведомления</button>
 <button class="btn acc" onclick="newTask()">+ Задача</button></div></div>
 <div class="strip">
  <div><small>ОТКРЫТЫХ</small><b>${open.length}</b><span>всего в работе</span></div>
  <div><small>МОИ</small><b class="a">${open.filter(t=>t.who===me).length}</b><span>${me}</span></div>
  <div><small>ПРОСРОЧЕНО</small><b class="r">${open.filter(t=>dueState(t.due)==='late').length}</b><span>требуют решения</span></div>
  <div><small>ПОСТАВИЛА СИСТЕМА</small><b class="v">${TASKS.filter(t=>t.auto).length}</b><span>по событиям</span></div>
  <div><small>ЗАКРЫТО ЗА НЕДЕЛЮ</small><b class="g">9</b><span>среднее время 1,8 дня</span></div>
 </div>
 <div class="tflt">${[['all','Все'],['me','Мои'],['late','Просроченные'],['auto','Созданные системой']].map(f=>
  `<button class="tf ${tFilter===f[0]?'on':''}" onclick="tFilter='${f[0]}';render()">${f[1]}</button>`).join('')}</div>
 <div class="board" style="grid-template-columns:repeat(4,1fr)">
 ${TCOLS.map(([k,n])=>{const list=vis.filter(t=>t.col===k);
  return `<div class="col" id="col-${k}" ondragover="colOver(event,'${k}')" ondragleave="colOut('${k}')" ondrop="taskDrop(event,'${k}')">
   <div class="col-h"><b style="color:${k==='done'?'var(--green)':k==='check'?'var(--violet)':k==='work'?'var(--acc)':'var(--muted)'}">${n}</b><span>${list.length}</span></div>
   ${list.map(t=>{const u=USERS[t.who]||['??',''];
    return `<div class="kc" draggable="true" style="--pr:${PRC[t.pr]}" ondragstart="taskDrag(event,'${t.id}')" ondragend="this.classList.remove('drag')" onclick="openTask('${t.id}')">
    <b>${esc(t.t)}</b>
    <div class="kmeta">${t.id}${t.auto?' · <span style="color:var(--acc)">поставлена системой</span>':''}</div>
    <div class="krow"><span style="display:flex;align-items:center;gap:6px"><span class="ava ${u[1]}">${u[0]}</span><span style="font-size:9.2px;color:var(--muted)">${t.who}</span></span>
     <span class="due ${dueState(t.due)}">${t.col==='done'?'закрыта':'до '+t.due}</span></div>
    <div class="kmeta">чек-лист ${t.chk.filter(c=>c[1]).length} из ${t.chk.length}${t.cm.length?' · '+t.cm.length+' комм.':''}</div>
   </div>`}).join('')||'<div class="mini" style="text-align:center;padding:14px 0;color:var(--muted2)">пусто</div>'}
  </div>`}).join('')}
 </div>`};
let dragT=null;
function taskDrag(e,id){dragT=id;e.target.classList.add('drag');try{e.dataTransfer.setData('text/plain',id)}catch(x){}}
function taskDrop(e,k){e.preventDefault();colOut(k);const t=TASKS.find(x=>x.id===dragT);if(!t)return;
 t.col=k;t.hist.push(['сейчас','перенесена в «'+TCOLS.find(c=>c[0]===k)[1].toLowerCase()+'»']);render();
 if(k==='done'){sparks();toast(`Задача <b>${t.id}</b> закрыта, постановщику (${t.from}) ушло уведомление.`)}
 else toast(`Задача <b>${t.id}</b> перенесена в «${TCOLS.find(c=>c[0]===k)[1].toLowerCase()}».`)}
function openTask(id){const t=TASKS.find(x=>x.id===id);
 openD(`${t.id} · ${esc(t.t)}`,`${t.who} · срок ${t.due} · приоритет ${PRN[t.pr]}`,
 [['Задача',`taskTab('${id}','m')`,true],[`Комментарии (${t.cm.length})`,`taskTab('${id}','c')`],['История',`taskTab('${id}','h')`]],taskBody(id,'m'))}
function taskTab(id,tab){const t=TASKS.find(x=>x.id===id);
 document.getElementById('dtabs').innerHTML=[['Задача','m'],[`Комментарии (${t.cm.length})`,'c'],['История','h']]
  .map(x=>`<button class="dtab ${x[1]===tab?'on':''}" onclick="taskTab('${id}','${x[1]}')">${x[0]}</button>`).join('');
 document.getElementById('db').innerHTML=taskBody(id,tab)}
function taskBody(id,tab){const t=TASKS.find(x=>x.id===id);
 if(tab==='m')return `
  <div class="strip" style="grid-template-columns:repeat(3,1fr)">
   <div><small>ИСПОЛНИТЕЛЬ</small><b style="font-size:14px">${t.who}</b><span>поставил: ${t.from}</span></div>
   <div><small>СРОК</small><b style="font-size:14px;color:${dueState(t.due)==='late'?'var(--red)':'inherit'}">${t.due}</b><span>${dueText(t.due,t.col)}</span></div>
   <div><small>ПРИОРИТЕТ</small><b style="font-size:14px;color:${PRC[t.pr]}">${PRN[t.pr]}</b><span>${t.auto?'поставлена системой':'поставлена вручную'}</span></div>
  </div>
  <div class="panel"><div class="ph-title">Описание</div><p class="mini" style="margin-top:4px">${esc(t.d)}</p></div>
  <div class="panel"><div class="ph-title">Чек-лист · ${t.chk.filter(c=>c[1]).length} из ${t.chk.length}</div>
   ${t.chk.map((c,i)=>`<div class="chk click ${c[1]?'':'no'}" onclick="toggleChk('${id}',${i})"><i>${c[1]?'✓':'○'}</i><span style="${c[1]?'color:var(--muted)':''}">${esc(c[0])}</span></div>`).join('')}
   <div class="bar" style="margin-top:9px"><i style="--w:${Math.round(t.chk.filter(c=>c[1]).length/t.chk.length*100)}%;background:var(--green)"></i></div>
  </div>
  <div class="btns">
   ${t.col!=='done'?`<button class="btn g" onclick="moveTask('${id}','done')">Закрыть задачу</button>`:''}
   ${t.col==='new'?`<button class="btn acc" onclick="moveTask('${id}','work')">Взять в работу</button>`:''}
   <button class="btn" onclick="toast('Исполнитель изменён, ему ушло уведомление.')">Переназначить</button>
   <button class="btn" onclick="toast('Срок перенесён. Перенос виден в истории вместе с автором.')">Перенести срок</button></div>`;
 if(tab==='c')return `<div class="panel"><div class="ph-title">Комментарии</div>
   ${t.cm.length?t.cm.map(c=>{const u=USERS[c[0]]||['СИ','b'];
    return `<div class="kv" style="align-items:flex-start"><span style="display:flex;gap:9px"><span class="ava ${u[1]}">${u[0]}</span>
    <span><b>${c[0]}</b> <span class="mono" style="color:var(--muted2)">${c[1]}</span><div class="sub" style="font-size:10px;color:var(--muted)">${esc(c[2])}</div></span></span></div>`}).join('')
    :'<p class="mini">Комментариев пока нет.</p>'}
   <div class="cin" style="padding:10px 0 0"><input id="ci-${id}" placeholder="Написать комментарий…" onkeydown="if(event.key==='Enter')addComment('${id}')">
    <button class="btn acc" onclick="addComment('${id}')">Отправить</button></div>
  </div>`;
 return `<div class="panel"><div class="ph-title">История</div>
  ${t.hist.map(h=>`<div class="kv"><span class="mono" style="font-size:9.4px">${h[0]}</span><span style="flex:1;text-align:left;font-size:10px;color:var(--muted)">${esc(h[1])}</span></div>`).join('')}</div>`}
function toggleChk(id,i){const t=TASKS.find(x=>x.id===id);t.chk[i][1]=t.chk[i][1]?0:1;taskTab(id,'m');if(cur==='tasks')render()}
function addComment(id){const el=document.getElementById('ci-'+id);const v=(el&&el.value||'').trim();
 const t=TASKS.find(x=>x.id===id);t.cm.push([ME[role],'сейчас',v||'Принято, беру в работу.']);
 taskTab(id,'c');toast('Комментарий добавлен, участникам задачи ушло уведомление.')}
function moveTask(id,col){const t=TASKS.find(x=>x.id===id);t.col=col;t.hist.push(['сейчас','перенесена в «'+TCOLS.find(c=>c[0]===col)[1].toLowerCase()+'»']);
 closeD();if(cur==='tasks')render();
 if(col==='done'){sparks();toast(`Задача <b>${id}</b> закрыта.`)}else toast(`Задача <b>${id}</b> взята в работу.`)}
function newTask(){const id='З-'+(tSeq++);
 TASKS.unshift({id,t:'Новая задача',col:'new',who:ME[role],from:ME[role],due:'08.09',pr:'mid',auto:false,
  d:'Задача создана вручную: название, описание, исполнитель, срок и приоритет заполняются в форме.',
  chk:[['Уточнить задачу',0],['Выполнить',0]],cm:[],hist:[['сейчас','создана']]});
 if(cur==='tasks')render();toast(`Задача <b>${id}</b> создана и назначена. Исполнителю ушло уведомление.`)}

/* --- ПРАВА --- */
SC.users=()=>`
 <div class="head"><div><h2>Права доступа</h2><p>Вопрос со встречи: зарплаты и себестоимость не должны быть видны всем. Права настраиваются по каждому разделу: водитель видит маршрут, технолог — цех, деньги — только руководитель.</p></div>
 <div class="btns"><button class="btn acc" onclick="toast('Сотрудник добавлен: роль, доступы и вход по номеру телефона с кодом. Права можно изменить в любой момент.')">+ Сотрудник</button></div></div>
 <div class="panel" style="padding:0"><div class="tw"><table class="data" style="min-width:900px"><thead><tr>
  <th>Роль</th><th>Кто</th><th>Себестоимость</th><th>Деньги и долги</th><th>Зарплаты</th><th>Чужие точки</th><th>Настройки</th></tr></thead><tbody>
 ${[['Собственник','Гульдана',1,1,1,1,1],['Операционный директор','Камила',1,1,0,1,1],['Менеджер по продажам','Асем',0,1,0,0,0],
    ['Технолог цеха','Мурат',1,0,0,0,0],['Кладовщик','Данияр',0,0,0,0,0],['Экспедитор','Ержан',0,0,0,0,0],['Бухгалтер (аутсорс)','Айгуль',1,1,0,1,0]]
  .map(r=>`<tr onclick="toast('Права роли «${r[0]}» настраиваются по каждому разделу отдельно — вплоть до отдельных колонок в таблицах.')">
  <td><b>${r[0]}</b></td><td class="mini">${r[1]}</td>
  ${[2,3,4,5,6].map(i=>`<td>${r[i]?'<span class="badge g">да</span>':'<span class="badge r">нет</span>'}</td>`).join('')}</tr>`).join('')}
 </tbody></table></div></div>
 <div class="g11">
  <div class="panel"><div class="ph-title">Как это работает</div>
   ${['Права урезаются от полного доступа собственника','Каждый раздел включается или выключается отдельно','Отдельно закрываются колонки: себестоимость, маржа, зарплата','Экспедитор видит только свой рейс на сегодня','Бухгалтер видит документы, но не видит зарплаты','Любое действие записывается в журнал с автором']
    .map(t=>`<div class="chk"><i>✓</i><span>${t}</span></div>`).join('')}
  </div>
  <div class="panel"><div class="ph-title">Данные и сервер</div>
   <div class="note" style="--tone:var(--acc)"><b>Сервер оформляется на вас</b><p>Облачный сервер, доступ по логину и паролю — как к почте. На время работ доступ есть у нас, после сдачи вы меняете пароль, и он остаётся только у вас.</p></div>
   <div class="note" style="--tone:var(--green)"><b>Резервные копии</b><p>Ежедневная копия базы и файлов на отдельное хранилище, с проверкой восстановления. Данные не пропадают и не оказываются в открытом доступе.</p></div>
  </div>
 </div>`;

/* ===== МЕХАНИКА ===== */
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
 toast(`Роль <b>${n}</b> — так портал выглядит у этого сотрудника. Разделы и данные ограничены его работой.`)}
function buildScope(){const s=document.getElementById('scopeSel');
 const opts=role==='Экспедитор'?[['m1','Рейс М-1 · Левый берег']]
  :[['all','Вся пекарня'],['astana','Астана · 21 точка'],['ceh','Только цех'],['own','Свои точки (менеджер)']];
 s.innerHTML=opts.map(o=>`<option value="${o[0]}" ${scope===o[0]?'selected':''}>${o[1]}</option>`).join('');
 if(role==='Экспедитор')scope='m1';else if(!opts.some(o=>o[0]===scope))scope='all'}
function setScope(v){scope=v;render();
 toast(v==='all'?'Показана <b>вся пекарня</b>: производство, точки, деньги.':'Данные отфильтрованы по выбранному срезу. Один портал — разные разрезы для разных задач.')}
function buildNav(){const al=ROLES[role].s;
 document.getElementById('nav').innerHTML=NAV.map(([g,items])=>{
  const av=items.filter(i=>al.includes(i[0]));if(!av.length)return '';
  return `<div class="nav-g">${g}</div>`+av.map(i=>
   `<a class="${cur===i[0]?'on':''}" onclick="go('${i[0]}')"><i>${i[1]}</i>${i[2]}${i[3]?`<span class="b">${i[3]}</span>`:''}</a>`).join('')}).join('')}
const PREF={inbox:'Менеджер по продажам',orders:'Менеджер по продажам',prod:'Технолог цеха',plan:'Технолог цеха',
 recipes:'Технолог цеха',stock:'Кладовщик',purchase:'Кладовщик',wh:'Кладовщик',driver:'Экспедитор',c1:'Бухгалтер (аутсорс)'};
const ownerOf=s=>(PREF[s]&&ROLES[PREF[s]].s.includes(s))?PREF[s]:(Object.entries(ROLES).find(([n,r])=>r.s.includes(s))||['Собственник'])[0];
function go(s){if(!ROLES[role].s.includes(s))enter(ownerOf(s));
 cur=s;buildNav();render();document.getElementById('content').scrollTop=0;
 try{const u=new URL(location.href);u.searchParams.set('s',s);history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString())}catch(e){}}
function render(){document.getElementById('content').innerHTML=`<div class="screen">${SC[cur]?SC[cur]():'<p class="mini">Раздел в разработке.</p>'}</div>`;
 const t=TITLES[cur]||['',''];document.getElementById('ttl').textContent=t[0];document.getElementById('sub').textContent=t[1]}
function openD(t,s,tabs,body){document.getElementById('dt').textContent=t;document.getElementById('ds').textContent=s;
 document.getElementById('dtabs').innerHTML=(tabs||[]).map(x=>`<button class="dtab ${x[2]?'on':''}" onclick="${x[1]}">${x[0]}</button>`).join('');
 document.getElementById('db').innerHTML=body;document.getElementById('dbg').classList.add('show')}
function closeD(){document.getElementById('dbg').classList.remove('show')}
let tt;function toast(h){const el=document.getElementById('toast');el.innerHTML=h;el.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),6000)}
function sparks(){const c=['#27714a','#c98a25','#3d9466','#8fd0a9','#ffffff','#d98324'];
 for(let i=0;i<52;i++){const s=document.createElement('i');s.className='spark';
  s.style.cssText=`left:${Math.random()*100}vw;background:${c[i%6]};animation-delay:${Math.random()*.45}s;transform:rotate(${Math.random()*360}deg)`;
  document.body.appendChild(s);setTimeout(()=>s.remove(),2300)}}
function waPing(){toast('Каналы внутри портала: WhatsApp, Instagram, почта, 2GIS, сайт и телефония. Заявка от партнёра попадает в общую ленту и превращается в заказ — переписка остаётся в компании, а не в личном телефоне менеджера.')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';try{localStorage.setItem('nt-theme',theme)}catch(e){}applyTheme()}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark');
 const b=document.getElementById('themeBtn');if(b)b.textContent=theme==='dark'?'☀ Светлая':'◐ Тёмная'}
(function(){try{const t=localStorage.getItem('nt-theme');if(t)theme=t}catch(e){}
 const q=new URLSearchParams(location.search).get('theme');if(q)theme=q;applyTheme()})();

/* ===== СЦЕНАРИЙ ===== */
const TOUR=[
 ['Менеджер по продажам','inbox','<b>Шаг 1.</b> Заявки приходят в WhatsApp, на почту, в Instagram и 2GIS. Здесь они в одной ленте с таймером ответа — ни одна заявка на завтрашний хлеб не теряется.',6600],
 ['Менеджер по продажам','orders','<b>Шаг 2.</b> Заказ собирается калькулятором: цены подставляются из договора точки, видно её долг и остаток на складе. Карточка тянется мышью по этапам.',6600],
 ['Технолог цеха','plan','<b>Шаг 3.</b> План на завтра система считает сама: заказы точек плюс средние продажи минус остаток. Здесь же видно, что дрожжей не хватает.',6400],
 ['Технолог цеха','prod','<b>Шаг 4.</b> Цех: замес, расстойка, выпечка, упаковка. При запуске партии сырьё списывается по техкарте, себестоимость считается по факту.',6400],
 ['Кладовщик','stock','<b>Шаг 5.</b> Склад сырья. Те самые семечки: по учёту 412 кг, по факту 316. Расхождение видно сразу, а не в конце года.',6400],
 ['Экспедитор','driver','<b>Шаг 6.</b> Экран водителя: маршрут, накладные, приём возврата и наличных прямо на точке. Вечером в офисе переносить нечего.',6200],
 ['Операционный директор','returns','<b>Шаг 7.</b> Возвраты и обмен по точкам и причинам. Видно, кому возят больше, чем он продаёт.',6200],
 ['Менеджер по продажам','debt','<b>Шаг 8.</b> Дебиторка: кто должен, сколько дней просрочки и когда платил. Спор «мы же заплатили 700 тысяч» закрывается актом сверки за десять секунд.',6800],
 ['Собственник','match','<b>Шаг 9.</b> Сходимость — главный экран. Замесили на 2 140, выпустили 2 072, отгрузили 2 005, вернули 139, продали 1 866. Видно, где теряется и на какую сумму.',7400],
 ['Собственник','finance','<b>Шаг 10.</b> Финансы с двумя контурами расходов: официальные и прочие — такси, курьеры, наличные. В управленческом отчёте они есть, в бухгалтерию не уходят.',6600],
 ['Операционный директор','ai','<b>Шаг 11.</b> AI-помощник по вашим данным: вопрос своими словами — ответ по цифрам портала. Утренняя сводка приходит в WhatsApp.',6400],
 ['Собственник','dash','<b>Итог.</b> Один контур вместо таблиц: от мешка муки до денег на счёте. Дальше мы проходим по каждому экрану вместе с вами и правим под то, как работает именно ваша пекарня.',7200]
];
let tourT=null,tourI=0;
function tour(){if(tourT){stopTour();return}tourI=0;document.getElementById('tourBtn').textContent='■ Остановить';step()}
function step(){if(tourI>=TOUR.length){stopTour();sparks();
  toast('<b>Это демо-макет по вашему рассказу.</b> На созвонах мы проходим по каждому экрану и правим под вашу пекарню — из этого получается техническое задание.');return}
 const [r,s,txt,ms]=TOUR[tourI++];
 if(role!==r)enter(r);
 setTimeout(()=>{go(s);toast(txt)},role!==r?380:0);
 tourT=setTimeout(step,ms)}
function stopTour(){clearTimeout(tourT);tourT=null;const b=document.getElementById('tourBtn');if(b)b.textContent='▶ Сценарий'}
renderRoles();
(function(){const q=new URLSearchParams(location.search).get('s');
 if(q&&SC[q]){enter(ownerOf(q));go(q)}})();
