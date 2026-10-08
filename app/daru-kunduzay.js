/* ДАРУ — единая система клиники комплексного лечения вместо amoCRM, МоегоСклада, Excel и таблиц: заявки и колл-центр, звонки с оценкой ИИ, дисциплина удалённых менеджеров, индивидуальный курс лечения из прайса (а не фиксированный пакет), лечебный лист на 15 дней, расписание кабинетов, склад лекарств со списанием по курсам, касса и отчёты финдиректору, задачи отделов, HR, роботы и личный кабинет пациента. Все имена, пациенты и суммы вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/10000)/100).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='08.10.2026',NOW='11:40';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const ai=(t,b)=>`<div class="aib"><div class="aih"><i>ИИ</i><b>${t}</b></div>${b}</div>`;

const SEC=[
 {k:'own',n:'Руководитель',ic:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',sub:[['today','Пульт клиники'],['analytics','Маркетинг и воронка'],['aiboard','ИИ-помощник']]},
 {k:'sales',n:'Продажи',ic:'<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',sub:[['leads','Заявки · воронка'],['patient','Карточка пациента'],['calls','Звонки и оценка ИИ'],['discipline','Дисциплина менеджеров'],['salary','Зарплата менеджеров']]},
 {k:'clinic',n:'Клиника',ic:'<path d="M12 3v18M3 12h18"/><rect x="5" y="5" width="14" height="14" rx="3"/>',sub:[['builder','Конструктор курса'],['sheet','Лечебный лист'],['schedule','Расписание кабинетов'],['doctor','Приём врача'],['procs','Учёт процедур']]},
 {k:'stock',n:'Склад',ic:'<path d="M4 8l8-4 8 4v10l-8 4-8-4z M4 8l8 4 8-4 M12 12v10"/>',sub:[['stock','Лекарства и расходники']]},
 {k:'money',n:'Деньги',ic:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>',sub:[['cash','Касса'],['findir','Отчёты финдиректору']]},
 {k:'team',n:'Команда',ic:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6M15 20c0-3 1.6-4.6 4-4.6"/>',sub:[['tasks','Задачи отделов'],['hr','HR и найм'],['robots','Роботы и рассылки']]},
 {k:'pt',n:'Пациенту',ic:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',sub:[['cabinet','Личный кабинет пациента'],['site','Сайт клиники']]},
 {k:'sys',n:'Система',ic:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',sub:[['roles','Роли и права'],['integr','Интеграции и переезд'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель клиники':{av:'КУ',p:'OW',n:'Кундузай',note:'Всё в одном окне: заявки, пациенты на лечении, звонки, склад, касса, команда, отчёты и ИИ',s:ALL.slice()},
 'РОП':{av:'РП',p:'RP',n:'Ерлан',note:'Воронка, звонки и оценка ИИ, дисциплина и зарплата менеджеров',s:['leads','patient','calls','discipline','salary','analytics','tasks']},
 'Менеджер колл-центра':{av:'МН',p:'MN',n:'Айжан · удалённо',note:'Свои заявки, звонки, WhatsApp, запись к врачу — кнопка «Я на работе»',s:['leads','patient','calls','tasks']},
 'Администратор':{av:'АД',p:'AD',n:'Динара',note:'Встреча пациента, расписание кабинетов, лечебный лист, касса',s:['schedule','sheet','patient','cash']},
 'Врач':{av:'ВР',p:'DR',n:'Асем Каримовна',note:'Приём, назначения, индивидуальный курс, лечебный лист своих пациентов',s:['doctor','builder','sheet','schedule','patient']},
 'Процедурная медсестра':{av:'МС',p:'NS',n:'Гульмира',note:'Свои процедуры на сегодня: отметить «сделано», расход препаратов списывается сам',s:['procs','sheet','schedule']},
 'Склад':{av:'СК',p:'SK',n:'Руслан',note:'Лекарства и расходники: остатки, сроки годности, заказ',s:['stock']},
 'Финдиректор и бухгалтер':{av:'ФД',p:'FD',n:'Мадина',note:'Касса, расходы, отчёты, зарплаты, первичка',s:['findir','cash','salary','stock']},
 'HR':{av:'HR',p:'HR',n:'Алия',note:'Найм двух блоков — коммерческий и клиника, адаптация, задачи',s:['hr','tasks']},
 'Маркетолог':{av:'МК',p:'MK',n:'Тимур',note:'Источники заявок, стоимость пациента, задачи маркетинга, рассылки',s:['analytics','tasks','robots','site']}
};
let role='Руководитель клиники',cur='today',theme='light',curPt='P-1042';

/* Прайс клиники — из него собирается индивидуальный курс */
const PRICE=[
 {g:'Основа курса',items:[['drip','Капельница по методике (медикаментозная)',18000,'день'],['clean','Очищение печени и почек',16000,'день'],['cons','Консультация врача',12000,'раз'],['lab','Анализы: ОАК, биохимия',14500,'раз']]},
 {g:'Физиолечение',items:[['uvt','УВТ',9000,'сеанс'],['magn','Магнитотерапия',6000,'сеанс'],['ozon','Озонотерапия',8000,'сеанс'],['lazer','Лазеротерапия',7000,'сеанс']]},
 {g:'Восточные методики',items:[['hijama','Хиджама',15000,'сеанс'],['igl','Иглотерапия',12000,'сеанс'],['giru','Гирудотерапия',14000,'сеанс'],['fito','Фитотерапия (сбор на курс)',22000,'курс']]},
 {g:'Сопровождение',items:[['diet','План питания от нутрициолога',18000,'курс'],['ctrl','Контрольный приём через месяц',8000,'раз']]}
];
const PR={};PRICE.forEach(g=>g.items.forEach(i=>PR[i[0]]={n:i[1],p:i[2],u:i[3],g:g.g}));

/* Пациенты */
const PST=[['new','Новая заявка'],['call','Дозвон'],['cons','Консультация КЦ'],['book','Записан к врачу'],['came','Пришёл · приём'],['buy','Курс подобран'],['treat','На лечении'],['done','Курс завершён'],['rep','Повторно · рекомендация']];
const PSI=k=>PST.findIndex(s=>s[0]===k);
let PTS=[
 {id:'P-1042',n:'Сауле Нурпеисова',age:52,ph:'+7 701 *** 44 18',src:'Instagram',st:'treat',m:'Айжан',dr:'Асем Каримовна',day:6,course:{drip:10,clean:5,cons:2,lab:2,magn:6,hijama:2,fito:1},paid:401000,note:'Давление, суставы. Хиджама — только после 5-го дня.'},
 {id:'P-1047',n:'Бахытжан Есенов',age:61,ph:'+7 777 *** 08 51',src:'Сарафан',st:'treat',m:'Ерболат',dr:'Асем Каримовна',day:11,course:{drip:10,clean:5,cons:2,lab:2,uvt:5,igl:5,diet:1},paid:442500,note:'Сахарный диабет 2 типа — контроль глюкозы каждый день.'},
 {id:'P-1051',n:'Айгуль Тлеубаева',age:44,ph:'+7 705 *** 92 07',src:'Реклама 2ГИС',st:'buy',m:'Айжан',dr:'Нурлан Серикович',day:0,course:{drip:10,clean:5,cons:2,lab:2,giru:3,ozon:4},paid:100000,note:'Начало курса 10.10. Предоплата 100 000.'},
 {id:'P-1053',n:'Ольга Ким',age:39,ph:'+7 707 *** 15 33',src:'Instagram',st:'came',m:'Ерболат',dr:'Нурлан Серикович',day:0,course:null,paid:0,note:'Сегодня 12:30 приём.'},
 {id:'P-1055',n:'Марат Абдрахманов',age:57,ph:'+7 701 *** 70 62',src:'TikTok',st:'book',m:'Айжан',dr:'Асем Каримовна',day:0,course:null,paid:0,note:'Запись 09.10 в 10:00.'},
 {id:'P-1058',n:'Динара Жуматова',age:48,ph:'+7 778 *** 21 40',src:'Instagram',st:'cons',m:'Мадияр',dr:'',day:0,course:null,paid:0,note:'Спрашивает про рассрочку.'},
 {id:'P-1060',n:'Ерлан Касымов',age:35,ph:'+7 747 *** 63 19',src:'TikTok',st:'call',m:'Мадияр',dr:'',day:0,course:null,paid:0,note:'2 недозвона.'},
 {id:'P-1061',n:'Гаухар Сапарова',age:66,ph:'+7 702 *** 88 04',src:'Реклама 2ГИС',st:'new',m:'—',dr:'',day:0,course:null,paid:0,note:'Заявка 11:32 — ещё не взята. 8 минут.'},
 {id:'P-1062',n:'Нурсултан Ахметов',age:42,ph:'+7 776 *** 30 55',src:'Instagram',st:'new',m:'—',dr:'',day:0,course:null,paid:0,note:'Заявка 11:36.'},
 {id:'P-1031',n:'Светлана Петрова',age:58,ph:'+7 701 *** 57 26',src:'Сарафан',st:'done',m:'Айжан',dr:'Асем Каримовна',day:15,course:{drip:10,clean:5,cons:2,lab:2,magn:6,fito:1},paid:368500,note:'Оценка курса 10/10. Контроль через месяц — 02.11.'},
 {id:'P-1018',n:'Кайрат Мусин',age:63,ph:'+7 705 *** 11 90',src:'Рекомендация',st:'rep',m:'Ерболат',dr:'Нурлан Серикович',day:15,course:{drip:10,clean:5,cons:2,lab:2,igl:5},paid:327000,note:'Привёл жену и брата.'}
];
const PT=id=>PTS.find(p=>p.id===id);
const cSum=c=>c?Object.entries(c).reduce((a,[k,q])=>a+PR[k].p*q,0):0;

/* Менеджеры колл-центра */
const MGR=[
 {n:'Айжан',on:true,since:'08:58',calls:41,talk:132,wa:58,slow:0,score:91,book:9,came:7,sold:5,rev:1840000},
 {n:'Ерболат',on:true,since:'09:04',calls:36,talk:118,wa:44,slow:1,score:84,book:7,came:5,sold:4,rev:1460000},
 {n:'Мадияр',on:true,since:'09:41',calls:19,talk:51,wa:22,slow:3,score:68,book:3,came:2,sold:1,rev:330000},
 {n:'Аружан',on:false,since:'—',calls:0,talk:0,wa:0,slow:0,score:0,book:0,came:0,sold:0,rev:0}
];

/* Склад лекарств — ~300 наименований, в демо часть */
const STK=[
 ['Раствор для инфузий 0,9% 250 мл','фл',1240,600,'03.2028','Б-12'],['Мельдоний 10% 5 мл','амп',380,400,'11.2027','А-04'],['Тиоктовая кислота 600 мг','амп',210,250,'06.2027','А-05'],
 ['Адеметионин 400 мг','фл',96,150,'09.2027','А-07'],['Пентоксифиллин 2% 5 мл','амп',520,300,'01.2028','А-02'],['Витамины группы B, комплекс','амп',640,400,'02.2028','А-01'],
 ['Пиявки медицинские','шт',140,120,'14.10.2026','Холод-1'],['Системы для инфузий','шт',2300,1000,'2030','Р-01'],['Катетеры периферические G22','шт',880,500,'2029','Р-02'],
 ['Фитосбор №3 «Печёночный»','уп',34,40,'05.2027','Ф-03'],['Банки для хиджамы одноразовые','шт',410,300,'2029','Р-06'],['Иглы для иглотерапии 0,25×25','уп',22,20,'2030','Р-07']
];

const SC={};
const pbar=p=>`<div class="pbr"><i style="width:${Math.min(100,p)}%"></i></div>`;
const stTag=k=>`<span class="stp-t s-${k}">${PST[PSI(k)][1]}</span>`;

SC.today=()=>{const tr=PTS.filter(p=>p.st==='treat');
 return `<div class="hd"><div><h2>Пульт клиники · ${TODAY}</h2><p>Заявки, звонки, пациенты на лечении, кабинеты, склад и касса — в одном окне. Без переключения между amoCRM, МоимСкладом, Excel и таблицами.</p></div><div class="btns"><button class="bt" onclick="go('aiboard')">Спросить ИИ</button><button class="bt p" onclick="card('newlead')">+ Заявка</button></div></div>
 <div class="wid">
  <div class="clk" onclick="go('leads')"><small>Заявок сегодня</small><b>27</b><span>2 ждут больше 5 минут</span></div>
  <div class="clk" onclick="go('leads')"><small>Записано к врачу</small><b class="a">11</b><span>конверсия заявка → запись 41%</span></div>
  <div class="clk" onclick="go('sheet')"><small>На лечении</small><b>18</b><span>капельничная: 14 из 16 мест</span></div>
  <div class="clk" onclick="go('cash')"><small>Касса сегодня</small><b class="g">1,26 млн</b><span>Kaspi 64% · наличные 36%</span></div>
  <div class="clk" onclick="go('stock')"><small>Склад</small><b class="r">4</b><span>позиции ниже минимума</span></div>
 </div>
 <div class="g3">
  <div class="pan"><h3>Путь пациента сегодня</h3>${[['Заявки',27],['Дозвонились',22],['Консультация КЦ',16],['Записаны',11],['Пришли на приём',7],['Подобран курс',5]].map((x,i,a)=>`<div class="fn"><span>${x[0]}</span><i style="width:${x[1]/a[0][1]*100}%"></i><b>${x[1]}</b></div>`).join('')}</div>
  <div class="pan"><h3>Требует внимания</h3>
   <div class="rf bad" onclick="go('leads')"><i></i><div><b>Заявка Гаухар С. висит 8 минут</b><span>никто не взял · 2ГИС</span></div></div>
   <div class="rf bad" onclick="go('stock')"><i></i><div><b>Пиявки — срок до 14.10</b><span>140 шт, по курсам нужно 9 — остальное списать или перенести</span></div></div>
   <div class="rf" onclick="go('discipline')"><i></i><div><b>Мадияр: 3 ответа в WhatsApp дольше 15 минут</b><span>вышел на линию в 09:41 вместо 09:00</span></div></div>
   <div class="rf" onclick="go('calls')"><i></i><div><b>ИИ: 4 звонка без предложения записи</b><span>за утро · Мадияр 3, Ерболат 1</span></div></div>
  </div>
  <div class="pan"><h3>Кабинеты сейчас</h3>${[['Капельничная',14,16],['Физиокабинет',3,4],['Кабинет хиджамы',1,1],['Иглотерапия',1,2],['Приём врача',2,2]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]} / ${x[2]}</b></div>`).join('')}<button class="bt sm" onclick="go('schedule')">Расписание →</button></div>
 </div>
 <div class="pan"><h3>На лечении · день курса</h3><div class="tw"><table class="t"><thead><tr><th>Пациент</th><th>Врач</th><th style="width:30%">Курс</th><th class="r">Курс, ₸</th><th class="r">Оплачено</th></tr></thead><tbody>${tr.map(p=>`<tr class="clk" onclick="curPt='${p.id}';go('sheet')"><td><b>${p.n}</b><div class="sub">${p.note}</div></td><td>${p.dr}</td><td>${pbar(p.day/15*100)}<span class="mini">день ${p.day} из 15</span></td><td class="r mono">${fmt(cSum(p.course))}</td><td class="r mono ${p.paid<cSum(p.course)?'wtx':''}">${fmt(p.paid)}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('«Индивидуально не подбирается — нужно миллион вариантов дописывать прямо в моменте. Вот какие у нас сейчас сложности».')}`};

SC.analytics=()=>`<div class="hd"><div><h2>Маркетинг и воронка</h2><p>Откуда приходят пациенты, сколько стоит заявка и пациент, кто доходит до курса — по каждому каналу. Маркетолог видит результат рекламы в деньгах, а не в лайках.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Канал</th><th class="r">Бюджет</th><th class="r">Заявки</th><th class="r">Записаны</th><th class="r">Пришли</th><th class="r">Курс</th><th class="r">Цена пациента</th><th class="r">Выручка</th><th class="r">ROMI</th></tr></thead><tbody>${[['Instagram',1200000,412,168,121,74,26400000],['TikTok',600000,260,82,51,26,8900000],['Реклама 2ГИС',300000,118,61,48,32,11300000],['Сарафан и рекомендации',0,64,52,47,39,14100000]].map(r=>`<tr><td><b>${r[0]}</b></td><td class="r mono">${r[1]?fmt(r[1]):'—'}</td><td class="r mono">${r[2]}</td><td class="r mono">${r[3]}</td><td class="r mono">${r[4]}</td><td class="r mono">${r[5]}</td><td class="r mono">${r[1]?fmt(r[1]/r[5]):'—'}</td><td class="r mono">${mln(r[6])}</td><td class="r mono pos">${r[1]?Math.round((r[6]-r[1])/r[1]*100)+'%':'—'}</td></tr>`).join('')}</tbody></table></div>
 <div class="g2"><div class="pan"><h3>Где теряем пациентов · сентябрь</h3>${[['Заявка → дозвон',82],['Дозвон → запись',47],['Запись → пришёл',76],['Пришёл → курс',64]].map(x=>`<div class="fn"><span>${x[0]}</span><i style="width:${x[1]}%"></i><b>${x[1]}%</b></div>`).join('')}<p class="mini">Самая большая потеря — на записи. ИИ по звонкам: в 38% разговоров менеджер не предложил конкретное время приёма.</p></div>
 <div class="pan"><h3>Повторные и рекомендации</h3><div class="kv"><span>Пациентов прошли курс</span><b>171</b></div><div class="kv"><span>Пришли повторно</span><b>23</b></div><div class="kv"><span>Привели знакомых</span><b>39</b></div><div class="kv"><span>Средняя оценка курса</span><b>9,4 из 10</b></div></div></div>`;

const AIQ=[
 ['Почему упала запись в понедельник?','В понедельник 27 заявок, записано 6 (обычно 11). 9 заявок пришли с 09:00 до 09:40 — на линии был один менеджер: Мадияр вышел в 09:41, Аружан не вышла. Среднее время до первого звонка — 23 минуты вместо 4. Предлагаю: утренняя смена с 08:45 и автоматическая передача заявки свободному менеджеру через 3 минуты.'],
 ['Какие процедуры чаще добавляют к курсу?','За сентябрь к основе (капельницы + очищение) добавляли: магнитотерапию — 61% курсов, хиджаму — 38%, иглотерапию — 29%, фитосбор — 54%. Средний курс вырос с 312 до 348 тыс. ₸ — врачи чаще подбирают физиолечение индивидуально.'],
 ['Хватит ли лекарств на курсы, которые стартуют на неделе?','Нет по двум позициям: адеметионин — остаток 96 фл, по 12 стартующим курсам нужно 120; мельдоний — 380 амп при потребности 410. Заказ нужен сегодня — поставщик везёт 3 дня.'],
 ['Сделай отчёт по менеджерам за неделю','Айжан — 214 звонков, 46 записей, 29 курсов, оценка разговоров 91. Ерболат — 188 / 37 / 21, оценка 84. Мадияр — 97 / 14 / 6, оценка 68: опоздания 4 из 5 дней, долгие ответы в WhatsApp. Рекомендация: разбор 5 звонков Мадияра с РОПом.']
];
let aiOpen=[0];
SC.aiboard=()=>`<div class="hd"><div><h2>ИИ-помощник руководителя</h2><p>Спрашиваете своими словами — ИИ отвечает по данным клиники: заявки, звонки, курсы, склад, касса. Плюс ИИ слушает звонки менеджеров и оценивает их по вашему скрипту.</p></div></div>
 <div class="chatai">${aiOpen.map(i=>`<div class="qq"><b>Кундузай</b>${AIQ[i][0]}</div><div class="qa"><i>ИИ</i><div>${AIQ[i][1]}</div></div>`).join('')}</div>
 <div class="qsug">${AIQ.map((q,i)=>aiOpen.includes(i)?'':`<a onclick="aiOpen.push(${i});render()">${q[0]}</a>`).join('')}</div>
 <div class="qin"><input placeholder="Например: сколько пациентов закончат курс на этой неделе?" onkeydown="if(event.key==='Enter')toast('В рабочей системе ответ придёт по вашим данным. В демо — выберите вопрос из подсказок.')"><button class="bt p" onclick="toast('В рабочей системе ответ придёт по вашим данным. В демо — выберите вопрос из подсказок.')">Спросить</button></div>
 ${said('«Мне нужен искусственный интеллект».','ИИ здесь не ставит диагнозы и не назначает лечение — это делает врач. ИИ работает на продажи, контроль и отчёты.')}`;

SC.leads=()=>`<div class="hd"><div><h2>Заявки · путь пациента</h2><p>Заявка из рекламы падает сразу в систему → колл-центр звонит и записывает → администратор встречает → врач подбирает курс → лечение 15 дней → оценка и повторный визит. Как сейчас в amoCRM, но вместе с клиникой, складом и кассой.</p></div><div class="btns"><button class="bt p" onclick="card('newlead')">+ Заявка</button></div></div>
 <div class="kb">${PST.map(([k,n])=>{const L=PTS.filter(p=>p.st===k);return `<div class="kc s-${k}"><div class="kh"><b>${n}</b><span>${L.length}</span></div>${L.map(p=>`<div class="kd ${p.st==='new'&&p.note.includes('8 минут')?'alarm':''}" onclick="curPt='${p.id}';go('patient')"><div class="kt"><b>${p.n}</b><span class="src">${p.src}</span></div><div class="km">${p.note}</div><div class="kf">${p.m}${p.course?`<b>${fmt(cSum(p.course))} ₸</b>`:''}</div></div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 <p class="mini">Новая заявка без ответа 3 минуты — уходит свободному менеджеру, через 5 минут — уведомление РОПу.</p>`;

SC.patient=()=>{const p=PT(curPt),i=PSI(p.st);
 return `<div class="hd"><div><div class="mini"><a class="lk" onclick="go('leads')">Заявки</a> / ${p.id}</div><h2>${p.n}, ${p.age}</h2><p>${p.ph} · источник ${p.src} · менеджер ${p.m}${p.dr?' · врач '+p.dr:''}</p></div><div class="btns"><button class="bt" onclick="go('builder')">Курс</button><button class="bt p" onclick="ptNext('${p.id}')">→ ${i<PST.length-1?PST[i+1][1]:'готово'}</button></div></div>
 <div class="stps">${PST.map((s,j)=>`<div class="${j<i?'ok':j===i?'on':''}"><i>${j<i?'✓':j+1}</i>${s[1]}</div>`).join('')}</div>
 <div class="g3">
  <div class="pan"><h3>Пациент</h3><div class="kv"><span>Жалобы</span><b>${p.note}</b></div><div class="kv"><span>Курс</span><b>${p.course?fmt(cSum(p.course))+' ₸':'не подобран'}</b></div><div class="kv"><span>Оплачено</span><b>${fmt(p.paid)} ₸</b></div><div class="kv"><span>День курса</span><b>${p.day?p.day+' из 15':'—'}</b></div></div>
  <div class="pan"><h3>WhatsApp</h3><div class="msgs">${[['Пациент','Здравствуйте, сколько стоит лечение суставов?'],['Айжан','Сауле, здравствуйте! Курс подбирает врач после осмотра. Консультация 12 000 ₸. Удобно завтра в 10:00 или 15:00?'],['Пациент','В 10:00'],['Робот','Напоминание: завтра в 10:00 приём, адрес и карта по ссылке.']].map(m=>`<div class="mg ${m[0]==='Пациент'?'':'me'}"><small>${m[0]}</small>${m[1]}</div>`).join('')}</div></div>
  <div class="pan"><h3>Звонки</h3>${[['исх.','25.09 · 16:12','4:38','Записала на приём 26.09 10:00','92'],['вход.','25.09 · 15:50','1:05','Первый звонок по заявке','—']].map(c=>`<div class="cl"><b>${c[0]} ${c[1]} · ${c[2]}</b><span>${c[3]}</span>${c[4]!=='—'?`<em>оценка ИИ ${c[4]}</em>`:''}</div>`).join('')}<button class="bt sm" onclick="toast('Запись разговора воспроизводится в карточке — телефония Sipuni или Binotel.')">▶ Прослушать</button></div>
 </div>
 <div class="pan"><h3>История</h3>${[['25.09 15:46','Заявка из Instagram, форма «Суставы»'],['25.09 15:50','Айжан взяла заявку через 4 минуты'],['25.09 16:12','Записана к врачу на 26.09 10:00'],['26.09 10:05','Администратор отметила приход'],['26.09 10:40','Врач подобрал курс — 371 000 ₸, старт 03.10, оплата 100%'],['08.10 10:45','Врач добавил хиджаму ×2 — доплата 30 000 ₸ оплачена']].map(x=>`<div class="evt"><span class="mono">${x[0]}</span><em>${x[1]}</em></div>`).join('')}</div>`};
function ptNext(id){const p=PT(id),i=PSI(p.st);if(i>=PST.length-1){toast('Пациент уже на финальном этапе.');return}if(PST[i+1][0]==='treat'&&!p.course){toast('Нельзя начать лечение без курса — подберите курс в конструкторе.');go('builder');return}p.st=PST[i+1][0];render();toast(`${p.n} → «${PST[i+1][1]}».`)}

const CALLS=[
 {m:'Айжан',t:'10:42',d:'5:12',pt:'Динара Ж.',sc:94,ok:['Поздоровалась по имени','Выяснила жалобы','Предложила два времени приёма','Закрыла на запись'],bad:[]},
 {m:'Мадияр',t:'10:31',d:'2:04',pt:'Ерлан К.',sc:58,ok:['Поздоровался'],bad:['Назвал цену курса до осмотра врача','Не предложил время приёма','Не договорился о следующем шаге']},
 {m:'Ерболат',t:'10:15',d:'3:47',pt:'Марат А.',sc:86,ok:['Выяснил жалобы','Записал на приём'],bad:['Не рассказал про подготовку к анализам']},
 {m:'Мадияр',t:'09:58',d:'1:31',pt:'Гаухар С.',sc:61,ok:['Перезвонил'],bad:['Не выяснил жалобы','Не предложил время приёма']}
];
SC.calls=()=>`<div class="hd"><div><h2>Звонки и оценка консультаций ИИ</h2><p>Каждый звонок записывается через телефонию и попадает в карточку пациента. ИИ расшифровывает разговор и оценивает его по вашему скрипту: что менеджер сделал, что пропустил.</p></div></div>
 <div class="wid">${MGR.filter(m=>m.on).map(m=>`<div><small>${m.n}</small><b class="${m.score>=85?'g':m.score>=75?'w':'r'}">${m.score}</b><span>${m.calls} звонков · ${m.book} записей</span></div>`).join('')}<div><small>Скрипт</small><b>9 пунктов</b><span>настраивает РОП</span></div></div>
 ${CALLS.map(c=>`<div class="pan call"><div class="ch"><b>${c.m} → ${c.pt}</b><span class="mono">${c.t} · ${c.d}</span><span class="sc ${c.sc>=85?'g':c.sc>=75?'w':'r'}">${c.sc}</span></div><div class="g2">${c.ok.length?`<div>${c.ok.map(x=>`<div class="pk ok">✓ ${x}</div>`).join('')}</div>`:'<div></div>'}<div>${c.bad.map(x=>`<div class="pk bad">! ${x}</div>`).join('')}</div></div></div>`).join('')}
 ${said('«Оценивается разговор менеджера… в amoCRM».','Здесь оценка ставится по каждому звонку автоматически — РОП разбирает только проблемные.')}`;

SC.discipline=()=>`<div class="hd"><div><h2>Дисциплина и тайм-менеджмент</h2><p>Большая часть менеджеров работает удалённо. Видно, кто на линии с какого времени, сколько звонков и минут разговора, как быстро отвечает в WhatsApp. Кнопка «Я на работе» + реальные действия в системе.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th>Статус</th><th>На линии с</th><th class="r">Звонки</th><th class="r">Минут</th><th class="r">WhatsApp</th><th class="r">Ответ >15 мин</th><th style="width:22%">Активность за день</th></tr></thead><tbody>${MGR.map(m=>`<tr class="${!m.on?'rowbad':m.slow>2?'rowwarn':''}"><td><b>${m.n}</b></td><td>${m.on?'<span class="tag g">на линии</span>':'<span class="tag r">не вышла</span>'}</td><td class="mono ${m.since>'09:05'&&m.on?'neg':''}">${m.since}</td><td class="r mono">${m.calls}</td><td class="r mono">${m.talk}</td><td class="r mono">${m.wa}</td><td class="r mono ${m.slow?'neg':''}">${m.slow}</td><td><div class="act">${Array.from({length:12},(_,i)=>`<i style="opacity:${m.on?(.25+((i*7+m.calls)%9)/12):.08}"></i>`).join('')}</div></td></tr>`).join('')}</tbody></table></div>
 <div class="g2"><div class="pan"><h3>Правила смены</h3><div class="kv"><span>Начало смены</span><b>09:00</b></div><div class="kv"><span>Опоздание</span><b>уведомление РОПу</b></div><div class="kv"><span>Нет действий 20 минут</span><b>вопрос менеджеру, потом РОПу</b></div><div class="kv"><span>Заявка без ответа 3 минуты</span><b>передать свободному</b></div></div>
 <div class="pan"><h3>Неделя</h3>${MGR.slice(0,3).map(m=>`<div class="kv"><span>${m.n}</span><b>${m.n==='Мадияр'?'опоздания 4 из 5 дней':'вовремя 5 из 5'}</b></div>`).join('')}</div></div>
 ${said('«У меня ещё дисциплина, тайм-менеджмент — большая часть менеджеров сидят удалённо онлайн, их нужно проконтролировать».')}`;

SC.salary=()=>`<div class="hd"><div><h2>Зарплата менеджеров</h2><p>Менеджер видит свою зарплату в реальном времени: оклад, процент с проданных курсов, бонус за оценку разговоров, штрафы за опоздания. Финдиректор получает итог без ручного подсчёта.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th class="r">Оклад</th><th class="r">Продано курсов</th><th class="r">Выручка</th><th class="r">5% с выручки</th><th class="r">Бонус за оценку</th><th class="r">Опоздания</th><th class="r">Итого на сегодня</th></tr></thead><tbody>${MGR.slice(0,3).map(m=>{const k=m.rev*5.5;const b=m.score>=85?50000:m.score>=75?20000:0;const f=m.n==='Мадияр'?-20000:0;return `<tr><td><b>${m.n}</b></td><td class="r mono">150 000</td><td class="r mono">${m.sold*5}</td><td class="r mono">${mln(k)}</td><td class="r mono">${fmt(k*.05)}</td><td class="r mono">${fmt(b)}</td><td class="r mono ${f?'neg':''}">${fmt(f)}</td><td class="r mono"><b>${fmt(150000+k*.05+b+f)}</b></td></tr>`}).join('')}</tbody></table></div>
 <p class="mini">Правила мотивации настраиваются: проценты, пороги, бонусы. В демо — пример.</p>`;

/* Конструктор индивидуального курса */
let BLD={drip:10,clean:5,cons:2,lab:2,magn:6,hijama:2,fito:1};let bldPt='P-1053',bldDisc=0;
const TPL=[['Базовый 15 дней',{drip:10,clean:5,cons:2,lab:2}],['Суставы',{drip:10,clean:5,cons:2,lab:2,uvt:6,magn:6,hijama:2}],['Сосуды и давление',{drip:10,clean:5,cons:2,lab:2,magn:6,giru:3,fito:1}],['Восстановление',{drip:10,clean:5,cons:2,lab:2,ozon:5,igl:5,diet:1}]];
function bq(k,d){BLD[k]=Math.max(0,(BLD[k]||0)+d);if(!BLD[k])delete BLD[k];render()}
SC.builder=()=>{const p=PT(bldPt),sum=cSum(BLD),fin=sum*(1-bldDisc/100);
 return `<div class="hd"><div><h2>Конструктор индивидуального курса</h2><p>Не фиксированный пакет, как в программах для стоматологии. Врач собирает курс под конкретного пациента из прайса: основа — капельницы и очищение, сверху — нужные процедуры в нужном количестве. Цена считается сразу, курс сохраняется пакетом и раскладывается по дням.</p></div></div>
 <div class="bld">
  <div class="pan"><div class="bh"><h3>Пациент</h3><select onchange="bldPt=this.value;render()">${PTS.filter(x=>['came','buy','book'].includes(x.st)).map(x=>`<option value="${x.id}" ${x.id===bldPt?'selected':''}>${x.n}, ${x.age}</option>`).join('')}</select></div><p class="mini">${p?esc(p.note):''}</p>
   <div class="tpls"><span class="mini">Начать с шаблона:</span>${TPL.map((t,i)=>`<a onclick="BLD=Object.assign({},TPL[${i}][1]);render()">${t[0]}</a>`).join('')}</div>
   ${PRICE.map(g=>`<div class="pg"><b>${g.g}</b>${g.items.map(([k,n,pr,u])=>`<div class="pi ${BLD[k]?'on':''}"><span>${n}<em>${fmt(pr)} ₸ / ${u}</em></span><div class="qty"><a onclick="bq('${k}',-1)">−</a><b>${BLD[k]||0}</b><a onclick="bq('${k}',1)">+</a></div></div>`).join('')}</div>`).join('')}
  </div>
  <div class="pan bsum"><h3>Курс · ${p?esc(p.n):''}</h3>${Object.entries(BLD).map(([k,q])=>`<div class="kv"><span>${PR[k].n} × ${q}</span><b class="mono">${fmt(PR[k].p*q)}</b></div>`).join('')||'<p class="mini">Добавьте процедуры слева.</p>'}
   <div class="kv"><span>Скидка</span><b><select onchange="bldDisc=+this.value;render()">${[0,5,10].map(d=>`<option value="${d}" ${d===bldDisc?'selected':''}>${d}%</option>`).join('')}</select></b></div>
   <div class="tot"><span>Итого курс</span><b>${tg(fin)}</b></div>
   <div class="mini">15 дней · ${Object.values(BLD).reduce((a,q)=>a+q,0)} процедур · списание препаратов по нормам каждой процедуры</div>
   <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="bldSave()">Сохранить курс и разложить по дням</button><button class="bt" onclick="toast('Шаблон «'+prompt0()+'» сохранён — врачи смогут начинать с него.')">Сохранить как шаблон</button></div>
   <div class="btns l"><button class="bt" onclick="toast('КП курса отправлено пациенту в WhatsApp: состав, цена, график по дням.')">Отправить пациенту в WhatsApp</button><button class="bt" onclick="toast('Рассрочка: 50% в первый день, 50% на 7-й день — график в кассе.')">Рассрочка</button></div>
  </div>
 </div>
 ${said('«Основной минус многих программ — они заточены на стоматологию: лечения фиксируются, каждому одинаковые. Индивидуально не подбирается».','«Да, только выбирается каждый раз по-новой» — поэтому здесь курс собирается из прайса за минуту, а частые наборы сохраняются шаблонами.')}`};
const prompt0=()=>'Мой шаблон';
function bldSave(){const p=PT(bldPt);if(!p)return;p.course=Object.assign({},BLD);p.st='buy';p.dr=p.dr||'Нурлан Серикович';curPt=p.id;go('sheet');toast(`Курс ${tg(cSum(p.course)*(1-bldDisc/100))} сохранён у ${p.n} и разложен по 15 дням. Склад зарезервировал препараты.`)}

/* Лечебный лист */
function plan(c){const d=[];for(let i=1;i<=15;i++){const L=[];if(i<=10&&c.drip)L.push('drip');if(i>10&&c.clean)L.push('clean');if((i===1||i===15)&&c.cons)L.push('cons');if((i===1||i===10)&&c.lab)L.push('lab');['uvt','magn','ozon','lazer'].forEach(k=>{if(c[k]&&i>1&&i<=c[k]+1)L.push(k)});['hijama','giru'].forEach(k=>{if(c[k]){const st=k==='hijama'?6:3;for(let j=0;j<c[k];j++)if(i===st+j*3)L.push(k)}});if(c.igl&&i%2===0&&i/2<=c.igl)L.push('igl');if(c.fito&&i===1)L.push('fito');if(c.diet&&i===2)L.push('diet');d.push(L)}return d}
SC.sheet=()=>{const p=PT(curPt).course?PT(curPt):PT('P-1042');const P=plan(p.course);
 return `<div class="hd"><div><h2>Лечебный лист · ${p.n}</h2><p>Курс разложен по 15 дням: 10 дней основного лечения, 5 дней очищения, процедуры — по дням назначения врача. Медсестра отмечает «сделано» — препараты списываются со склада, процедура идёт в зарплату исполнителя.</p></div><div class="btns"><button class="bt" onclick="toast('Лечебный лист распечатан для поста медсестры.')">Печать</button></div></div>
 <div class="sel">${PTS.filter(x=>x.course).map(x=>`<a class="${x.id===p.id?'on':''}" onclick="curPt='${x.id}';render()">${x.n}<em>день ${x.day||0}</em></a>`).join('')}</div>
 <div class="cdays">${P.map((L,i)=>`<div class="cdy ${i+1<p.day?'past':i+1===p.day?'now':''}"><b>День ${i+1}</b>${L.map(k=>`<span class="pr ${i+1<p.day?'ok':''}">${i+1<p.day?'✓ ':''}${PR[k].n.split(' (')[0].replace('Капельница по методике','Капельница').replace('Очищение печени и почек','Очищение')}</span>`).join('')}</div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Деньги по курсу</h3><div class="kv"><span>Курс</span><b>${tg(cSum(p.course))}</b></div><div class="kv"><span>Оплачено</span><b>${tg(p.paid)}</b></div><div class="kv"><span>Остаток</span><b class="${cSum(p.course)-p.paid>0?'neg':''}">${tg(Math.max(0,cSum(p.course)-p.paid))}</b></div></div>
 <div class="pan"><h3>Изменение курса в процессе</h3><p class="mini">Врач добавил процедуру на 8-й день — лист, цена и резерв на складе пересчитываются, пациенту уходит сообщение с доплатой.</p><button class="bt sm" onclick="curPt='${p.id}';BLD=Object.assign({},PT('${p.id}').course);bldPt='${['came','buy','book'].includes(p.st)?p.id:'P-1053'}';go('builder')">Изменить курс</button></div></div>`};

SC.schedule=()=>{const H=['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];const R=[['Капельничная · 16 мест',['14 из 16','16 из 16','15 из 16','12 из 16','—','8 из 16','6 из 16','—','—']],['Физиокабинет',['УВТ · Есенов','Магнит · Нурпеисова','Магнит · Петрова','—','—','Озон · Тлеубаева','УВТ · Мусин','—','—']],['Кабинет хиджамы',['—','—','Нурпеисова','—','—','—','Ахметов','—','—']],['Иглотерапия',['—','Есенов','—','—','—','Касымов','—','—','—']],['Приём · Асем Каримовна',['Абдрахманов','Нурпеисова','—','Ким','—','Жуматова','—','—','—']],['Приём · Нурлан Серикович',['—','Тлеубаева','—','Ким','—','—','Сапарова','—','—']]];
 return `<div class="hd"><div><h2>Расписание кабинетов · ${TODAY}</h2><p>Дневной стационар: места в капельничной, кабинеты процедур и приёмы врачей на одной сетке. Администратор видит свободные окна и сразу записывает.</p></div><div class="btns"><button class="bt p" onclick="toast('Свободное окно: физиокабинет 12:00, иглотерапия 11:00, приём Асем Каримовны 11:00.')">Найти окно</button></div></div>
 <div class="tw"><table class="t grid"><thead><tr><th>Кабинет</th>${H.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${R.map(r=>`<tr><td><b>${r[0]}</b></td>${r[1].map(c=>`<td class="${c==='—'?'free':c.startsWith('16 из')?'full':'busy'}">${c==='—'?'':c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`};

SC.doctor=()=>`<div class="hd"><div><h2>Приём врача · Ольга Ким, 39</h2><p>Врач видит всё, что собрал колл-центр, вносит жалобы, анамнез и результаты анализов, назначает курс — одной кнопкой переходит в конструктор.</p></div><div class="btns"><button class="bt p" onclick="bldPt='P-1053';go('builder')">Подобрать курс →</button></div></div>
 <div class="g2"><div class="pan"><h3>Осмотр</h3><div class="form"><label>Жалобы<input value="Усталость, отёки к вечеру, головные боли"></label><label>Давление<input value="135/85"></label><label>Анамнез<input value="Гипотиреоз, на терапии 3 года"></label><label>Противопоказания к процедурам<input value="Гирудотерапия — нет"></label></div><button class="bt sm" onclick="toast('Осмотр сохранён в карте пациента.')">Сохранить осмотр</button></div>
 <div class="pan"><h3>Из карточки колл-центра</h3><div class="kv"><span>Источник</span><b>Instagram</b></div><div class="kv"><span>С чем обратилась</span><b>«Хочу пройти курс, подруга лечилась»</b></div><div class="kv"><span>Анализы</span><b>ОАК, биохимия — загружены 07.10</b></div><div class="kv"><span>Пришла по рекомендации</span><b>Светлана Петрова (P-1031)</b></div></div></div>`;

SC.procs=()=>`<div class="hd"><div><h2>Учёт процедур · ${TODAY}</h2><p>Медсестра видит свои процедуры на сегодня и отмечает «сделано». Сразу списываются препараты, процедура попадает в лечебный лист пациента и в зарплату исполнителя.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Время</th><th>Пациент</th><th>Процедура</th><th>Кабинет</th><th>Исполнитель</th><th>Списание</th><th></th></tr></thead><tbody>${[['09:00','Бахытжан Есенов','Капельница · день 11','Капельничная','Гульмира','физраствор 250 мл, мельдоний 5 мл, система'],['09:00','Сауле Нурпеисова','Капельница · день 6','Капельничная','Гульмира','физраствор 250 мл, тиоктовая к-та 600 мг, система'],['10:00','Сауле Нурпеисова','Магнитотерапия','Физиокабинет','Жанар','—'],['11:00','Сауле Нурпеисова','Хиджама','Кабинет хиджамы','Арман','банки 6 шт'],['10:00','Бахытжан Есенов','Иглотерапия','Иглотерапия','Арман','иглы 1 уп']].map((r,i)=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td><b>${r[2]}</b></td><td>${r[3]}</td><td>${r[4]}</td><td class="mini">${r[5]}</td><td><button class="bt sm" onclick="this.outerHTML='<span class=&quot;tag g&quot;>сделано</span>';toast('Отмечено. Списано со склада: ${r[5]}.')">Сделано</button></td></tr>`).join('')}</tbody></table></div>
 <div class="pan"><h3>Процедуры за октябрь по исполнителям</h3>${[['Гульмира',212,'капельницы'],['Жанар',96,'физиолечение'],['Арман',41,'хиджама, иглотерапия']].map(x=>`<div class="kv"><span>${x[0]} · ${x[2]}</span><b>${x[1]}</b></div>`).join('')}</div>`;

SC.stock=()=>`<div class="hd"><div><h2>Лекарства и расходники</h2><p>Около 300 наименований: остатки по местам хранения, партии и сроки годности, минимальный запас. Препараты резервируются под подобранные курсы и списываются по каждой процедуре — без ручных накладных, как в МоемСкладе сейчас.</p></div><div class="btns"><button class="bt p" onclick="toast('Заказ поставщику сформирован: 4 позиции ниже минимума + резерв на курсы недели.')">Сформировать заказ</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Наименование</th><th>Ед.</th><th class="r">Остаток</th><th class="r">Минимум</th><th>Годен до</th><th>Место</th><th></th></tr></thead><tbody>${STK.map(s=>`<tr class="${s[2]<s[3]?'rowbad':s[4].length>7&&s[4].startsWith('14.10')?'rowwarn':''}"><td><b>${s[0]}</b></td><td>${s[1]}</td><td class="r mono">${fmt(s[2])}</td><td class="r mono">${fmt(s[3])}</td><td class="mono ${s[4].startsWith('14.10')?'neg':''}">${s[4]}</td><td class="mono">${s[5]}</td><td>${s[2]<s[3]?'<span class="tag r">заказать</span>':s[4].startsWith('14.10')?'<span class="tag w">срок</span>':''}</td></tr>`).join('')}</tbody></table></div>
 <p class="mini">В демо — 12 позиций из 300. Нормы расхода на каждую процедуру задаются один раз.</p>`;

SC.cash=()=>`<div class="hd"><div><h2>Касса</h2><p>Вместо Excel: каждая оплата привязана к пациенту и курсу — Kaspi, наличные, карта, рассрочка. Остаток долга пациента считается сам, кассир закрывает смену одной кнопкой.</p></div><div class="btns"><button class="bt p" onclick="toast('Оплата принята — долг пациента и касса обновились.')">+ Оплата</button></div></div>
 <div class="wid"><div><small>Сегодня</small><b class="g">1 262 000</b><span>9 оплат</span></div><div><small>Kaspi</small><b>808 000</b><span>64%</span></div><div><small>Наличные</small><b>454 000</b><span>36%</span></div><div><small>Долги пациентов</small><b class="w">1 284 000</b><span>рассрочки и доплаты</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Время</th><th>Пациент</th><th>За что</th><th>Способ</th><th class="r">Сумма</th><th>Кассир</th></tr></thead><tbody>${[['11:20','Айгуль Тлеубаева','предоплата курса','Kaspi',100000],['10:45','Сауле Нурпеисова','доплата за хиджаму','наличные',30000],['10:12','Марат Абдрахманов','консультация','Kaspi',12000],['09:40','Бахытжан Есенов','2-я часть рассрочки','Kaspi',221000],['09:05','Кайрат Мусин','фитосбор повторно','наличные',22000]].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td class="r mono">${fmt(r[4])}</td><td>Динара</td></tr>`).join('')}</tbody></table></div>
 <div class="btns l"><button class="bt" onclick="toast('Смена закрыта: 1 262 000 ₸, расхождений нет. Отчёт ушёл финдиректору.')">Закрыть смену</button></div>`;

SC.findir=()=>`<div class="hd"><div><h2>Отчёты финдиректору</h2><p>Доходы и расходы по статьям, прибыль за месяц, долги пациентов, себестоимость курса (препараты + процедуры), зарплатный фонд. Вся первичка — внутри системы.</p></div></div>
 <div class="g2"><div class="pan"><h3>Сентябрь</h3>${[['Выручка','60,7 млн','pos'],['Препараты и расходники','−11,2 млн',''],['ФОТ клиники','−14,8 млн',''],['ФОТ колл-центра и маркетинга','−6,9 млн',''],['Реклама','−2,1 млн',''],['Аренда и коммунальные','−4,4 млн',''],['Прибыль','21,3 млн','pos']].map(x=>`<div class="kv"><span>${x[0]}</span><b class="${x[2]}">${x[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Себестоимость среднего курса</h3>${[['Средний чек курса','348 000 ₸'],['Препараты','64 000 ₸'],['Процедуры (сдельно)','52 000 ₸'],['Привлечение пациента','16 400 ₸'],['Маржа курса','215 600 ₸ · 62%']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div></div>`;

const DEPS=['Маркетинг','Продажи','Услуги и клиника','Учёт и контроль','HR','IT'];
let TASKS=[
 ['Маркетинг','Запустить рекламу «Суставы» в Instagram','Тимур','09.10','work'],['Маркетинг','Снять 3 видео-отзыва пациентов','Тимур','12.10','new'],
 ['Продажи','Разбор 5 звонков Мадияра','Ерлан','08.10','work'],['Продажи','Обновить скрипт: предложение времени приёма','Ерлан','10.10','new'],
 ['Услуги и клиника','Заказать адеметионин 150 фл','Руслан','08.10','late'],['Услуги и клиника','Списать пиявки с истекающим сроком','Руслан','14.10','new'],
 ['Учёт и контроль','Сверка кассы за неделю','Мадина','09.10','work'],['Учёт и контроль','Зарплата за сентябрь','Мадина','10.10','work'],
 ['HR','Найти процедурную медсестру','Алия','20.10','work'],['HR','Адаптация нового менеджера КЦ','Алия','15.10','new'],
 ['IT','Подключить второй номер WhatsApp','—','12.10','new']
];
SC.tasks=()=>`<div class="hd"><div><h2>Задачи отделов</h2><p>Структура как в вашей схеме бизнеса: маркетинг, продажи, услуги и клиника, учёт и контроль, HR, IT. У задачи — исполнитель, срок, статус; просроченные видны руководителю.</p></div><div class="btns"><button class="bt p" onclick="toast('Новая задача: выберите отдел, исполнителя и срок.')">+ Задача</button></div></div>
 <div class="kb k6">${DEPS.map(d=>{const L=TASKS.filter(t=>t[0]===d);return `<div class="kc"><div class="kh"><b>${d}</b><span>${L.length}</span></div>${L.map(t=>`<div class="kd ${t[4]==='late'?'alarm':''}"><div class="kr">${t[1]}</div><div class="kf">${t[2]}<b>${t[3]}</b></div>${t[4]==='late'?'<div class="lack">просрочено</div>':''}</div>`).join('')}</div>`}).join('')}</div>`;

SC.hr=()=>`<div class="hd"><div><h2>HR и найм</h2><p>Два блока, как у вас: HR коммерческого блока (колл-центр, маркетинг) и HR клиники (врачи, медсёстры). Вакансии, кандидаты по этапам, онлайн-тест до собеседования — на интервью зовём только прошедших.</p></div></div>
 <div class="g2">${[['Коммерческий блок',[['Менеджер колл-центра (удалённо)',46,9,3],['Таргетолог',12,4,1]]],['Клиника',[['Процедурная медсестра',18,5,2],['Врач-терапевт',6,2,1]]]].map(b=>`<div class="pan"><h3>${b[0]}</h3><div class="tw"><table class="t"><thead><tr><th>Вакансия</th><th class="r">Откликов</th><th class="r">Прошли тест</th><th class="r">Интервью</th></tr></thead><tbody>${b[1].map(v=>`<tr><td><b>${v[0]}</b></td><td class="r mono">${v[1]}</td><td class="r mono">${v[2]}</td><td class="r mono">${v[3]}</td></tr>`).join('')}</tbody></table></div></div>`).join('')}</div>
 <p class="mini">Глубокая автоматизация найма (тренажёры по скриптам, тесты на каждую должность) — отдельно по желанию; в пакете — вакансии, кандидаты, этапы и задачи HR.</p>`;

SC.robots=()=>`<div class="hd"><div><h2>Роботы и рассылки</h2><p>Автоматические действия по пути пациента: напоминания о приёме, сообщения в дни курса, поздравления с праздниками и днём рождения, оценка курса и приглашение на контроль. Каждый робот включается переключателем.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Что делает</th><th>Канал</th><th>Вкл.</th></tr></thead><tbody>${[['Новая заявка','Передать менеджеру; через 3 минуты без ответа — свободному','система'],['За день до приёма','Напоминание, адрес, как подготовиться к анализам','WhatsApp'],['Курс подобран','КП курса с графиком по дням и суммой','WhatsApp'],['5-й день курса','Как самочувствие? Ответ уходит врачу','WhatsApp'],['Последний день курса','Оценка курса 1–10 и отзыв','WhatsApp'],['Оценка ниже 8','Задача руководителю — связаться с пациентом','система'],['Через месяц после курса','Приглашение на контрольный приём','WhatsApp'],['День рождения','Поздравление и подарок — фитосбор','WhatsApp'],['Праздники','Поздравление всем пациентам за год','WhatsApp']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="mini">${r[2]}</td><td><span class="sw on" onclick="this.classList.toggle('on')"></span></td></tr>`).join('')}</tbody></table></div>`;

SC.cabinet=()=>`<div class="hd"><div><h2>Личный кабинет пациента</h2><p>Пациент открывает кабинет по ссылке из WhatsApp или с сайта — в телефоне, как приложение, без установки. Видит запись, свой курс по дням, оплаты, переписку с клиникой, оценивает курс. Позже из этого же кабинета собирается мобильное приложение.</p></div></div>
 <div class="phones">
  <div class="mob"><div class="phh"><b>ДАРУ</b><span>Сауле Н.</span></div><div class="phb"><small>Ваш курс</small><b class="big">День 6 из 15</b>${pbar(40)}<div class="pl"><span>09:00</span>Капельница</div><div class="pl"><span>10:00</span>Магнитотерапия</div><div class="pl"><span>11:00</span>Хиджама</div><a class="pbtn">Перенести процедуру</a></div></div>
  <div class="mob"><div class="phh"><b>Оплаты</b><span>курс 401 000 ₸</span></div><div class="phb"><div class="pl"><span>26.09</span>Оплачено 371 000 ₸</div><div class="pl"><span>08.10</span>Хиджама доп. 30 000 ₸</div><a class="pbtn">Оплатить через Kaspi</a><small style="margin-top:12px">Документы</small><div class="pl"><span>PDF</span>Договор и чек</div><div class="pl"><span>PDF</span>Результаты анализов</div></div></div>
  <div class="mob"><div class="phh"><b>Чат с клиникой</b><span>врач и администратор</span></div><div class="phb"><div class="mg"><small>Клиника</small>Сауле, как самочувствие на 5-й день?</div><div class="mg me"><small>Вы</small>Лучше, давление 125/80.</div><div class="mg"><small>Асем Каримовна</small>Отлично, продолжаем по плану.</div><small style="margin-top:10px">Оцените курс</small><div class="stars">★★★★★</div></div></div>
 </div>
 ${said('«Эту программу мы ещё будем нашим клиентам передавать, чтобы они могли использовать».','Сейчас — кабинет в браузере телефона, входит в сайт. Мобильное приложение App Store / Google Play — отдельным этапом, когда кабинет обкатан.')}`;

SC.site=()=>`<div class="hd"><div><h2>Сайт клиники</h2><p>Сайт с описанием методики, процедур и врачей, отзывами и формой записи. Заявка с сайта сразу падает в воронку, вход в личный кабинет пациента — с сайта. Адаптирован под телефон.</p></div></div>
 <div class="site"><div class="sh"><b>ДАРУ</b><span>Методика · Процедуры · Врачи · Отзывы · Цены</span><a>Записаться</a></div><div class="shero"><h3>Комплексное лечение за 15 дней — дневной стационар без госпитализации</h3><p>10 дней основного курса и 5 дней очищения. Врач подбирает процедуры индивидуально: физиолечение, хиджама, иглотерапия, фитотерапия.</p><a>Записаться на консультацию</a></div><div class="sgrid">${['Капельницы по методике','Очищение печени и почек','Физиолечение','Хиджама и иглотерапия'].map(x=>`<div>${x}</div>`).join('')}</div></div>`;

SC.roles=()=>{const A=[['Пульт, ИИ, аналитика',{OW:2,RP:1,FD:1,MK:1}],['Заявки и карточка пациента',{OW:2,RP:2,MN:2,AD:1,DR:1}],['Звонки и оценка ИИ',{OW:2,RP:2,MN:1}],['Дисциплина и зарплата менеджеров',{OW:2,RP:2,FD:1}],['Конструктор курса',{OW:2,DR:2}],['Лечебный лист и процедуры',{OW:2,AD:1,DR:2,NS:2}],['Склад',{OW:2,SK:2,FD:1}],['Касса',{OW:2,AD:2,FD:2}],['Отчёты финдиректору',{OW:2,FD:2}],['Задачи, HR, роботы',{OW:2,RP:1,HR:2,MK:2}]];const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и права</h2><p>Каждый входит под своим логином: менеджер видит свои заявки, медсестра — свои процедуры, врач — своих пациентов, финдиректор — деньги. Пароли не передаются — у каждого свой вход.</p></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Раздел</th>${R.map(([k,v])=>`<th class="c">${esc(v.av)}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>${A.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1][v.p]===2?'●':a[1][v.p]===1?'○':'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <p class="mini">● — меняет · ○ — только смотрит · — — не видит.</p>`};

SC.integr=()=>`<div class="hd"><div><h2>Интеграции и переезд</h2><p>Всё в одном окне: от amoCRM, МоегоСклада, Excel-кассы и таблиц можно отказаться. Переносим данные, подключаем телефонию и WhatsApp.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Сейчас</th><th>Что делаем</th><th>Статус</th></tr></thead><tbody>${[['amoCRM','Перенос пациентов, сделок и истории; заявки с рекламы — сразу в систему','в пакете'],['МойСклад','Перенос номенклатуры (~300 позиций) и остатков','в пакете'],['Excel-касса','Перенос долгов пациентов, касса в системе','в пакете'],['Sipuni (телефония)','Звонки и записи в карточке; при желании — переход на Binotel','в пакете'],['WhatsApp','Через провайдера (Green API, около 5 000 ₸/мес за номер)','в пакете'],['Kaspi','Оплата по ссылке и QR, отметка в кассе','в пакете · по API Kaspi'],['ИИ','Расшифровка и оценка звонков, помощник руководителя','в пакете · сервис по факту'],['1С','Не используете — не нужна; если понадобится — отдельно 800 000 ₸','отдельно']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td><span class="tag ${r[2]==='отдельно'?'':'g'}">${r[2]}</span></td></tr>`).join('')}</tbody></table></div>`;

SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Делаем с нуля под вас — не адаптируем коробку. Стандартный пакет разработки: ядро → полировка с вами → передача на ваш сервер.</p></div></div>
 <div class="pk3"><div class="on"><small>Портал клиники</small><b>2 500 000 ₸</b><span>всё, что в демо, кроме сайта; +10% объёма на полировку без доплаты</span></div><div class="on"><small>Сайт + кабинет пациента</small><b>800 000 ₸</b><span>сайт, запись, личный кабинет в браузере телефона</span></div><div><small>Мобильное приложение</small><b>3 000 000 ₸</b><span>отдельный этап: 2 месяца + месяц публикации; поддержка ≈1 млн ₸ в год</span></div></div>
 <div class="tot2"><span>Портал + сайт</span><b>3 300 000 ₸</b><em>при решении в день встречи — скидка 5%: 3 135 000 ₸</em></div>
 <div class="pay3"><div><small>Старт · 10 %</small><b>330 000 ₸</b><span>предоплата, договор</span></div><div><small>Ядро · 45 %</small><b>1 485 000 ₸</b><span>после утверждения ядра</span></div><div><small>Сдача · 45 %</small><b>1 485 000 ₸</b><span>после полной сдачи портала и сайта</span></div></div>
 <div class="g3"><div class="pan"><h3>Ядро · ~1,5 недели</h3>${['Воронка и карточка пациента','Конструктор курса и лечебный лист','Склад лекарств, касса','Задачи отделов, роли'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div><div class="pan"><h3>Полировка · 3–4 недели</h3>${['1–2 созвона в неделю','Звонки, ИИ-оценка, дисциплина, зарплата','Роботы, HR, отчёты финдиректору','Сайт и кабинет пациента'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div><div class="pan"><h3>Запуск и отладка</h3>${['Сервер, документация, обучение','1–2 недели отладки в работе','Потом — по часам, 20 $/ч','Код и данные — ваши'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div></div>`;

const CARD={};
CARD.newlead=()=>['Новая заявка','Вручную или из рекламы автоматически',`<div class="form"><label>Имя<input id="nl_n" value="Жанна Омарова"></label><label>Телефон<input id="nl_p" value="+7 701 000 00 00"></label><label>Источник<select id="nl_s"><option>Instagram</option><option>TikTok</option><option>Реклама 2ГИС</option><option>Сарафан</option></select></label><label>Жалобы<input id="nl_c" value="Боли в спине, давление"></label></div><button class="bt p" onclick="newLead()">Добавить</button>`];
function newLead(){const v=i=>document.getElementById(i).value.trim();const id='P-'+(1063+PTS.length-11);PTS.unshift({id,n:v('nl_n'),age:45,ph:v('nl_p'),src:v('nl_s'),st:'new',m:'—',dr:'',day:0,course:null,paid:0,note:v('nl_c')});closeM();go('leads');toast(`${id} в воронке. Свободный менеджер получит заявку сразу.`)}
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){if(!v)return;toast('Поиск по пациентам, телефонам, курсам и препаратам: «'+esc(v)+'».')}

function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель клиники';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const on=SECOF[cur];document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><i><svg viewBox="0 0 24 24">${s.ic}</svg></i><span>${s.n}</span></a>`).join('')}
function buildSub(){const s=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.today;document.getElementById('ttl').textContent=SUBN[cur]||'Дару';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();buildRail();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('leads')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['today','1 · Пульт: заявки, пациенты на лечении, кабинеты, склад, касса — в одном окне.'],
 ['leads','2 · Путь пациента от заявки из рекламы до повторного визита.'],
 ['patient','3 · Карточка: WhatsApp, звонки с записью, история.'],
 ['calls','4 · ИИ оценивает каждый звонок по вашему скрипту.'],
 ['discipline','5 · Удалённые менеджеры: кто на линии, звонки, скорость ответов.'],
 ['builder','6 · Главное: курс собирается индивидуально из прайса, цена сразу.'],
 ['sheet','7 · Лечебный лист на 15 дней: отметки, списание, доплаты.'],
 ['schedule','8 · Расписание капельничной, кабинетов и врачей.'],
 ['stock','9 · Склад лекарств: сроки, минимум, списание по процедурам.'],
 ['cash','10 · Касса вместо Excel.'],
 ['findir','11 · Отчёты финдиректору и себестоимость курса.'],
 ['tasks','12 · Задачи отделов по вашей схеме бизнеса.'],
 ['robots','13 · Роботы: напоминания, оценка курса, праздники.'],
 ['cabinet','14 · Личный кабинет пациента — основа будущего приложения.'],
 ['aiboard','15 · ИИ-помощник руководителя.'],
 ['launch','16 · Стоимость: портал 2,5 млн + сайт 0,8 млн, приложение — отдельно.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
