/* ОХРАНА — единая система охранного агентства вместо Excel: абоненты и полный цикл обслуживания (счета, акты, напоминания об оплате и отключении, отключение и включение), пульт директоров с цифрами в телефоне, заявки и подключение новых клиентов, договоры с ЭЦП, пульт тревог с картой объектов и экипажей, приложение экипажа с маршрутом в 2ГИС, личный кабинет клиента с документами, кадровый учёт и электронные заявления с визой директора, 1С, сайт, свой сервер. Название агентства, клиенты, сотрудники и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='26.10.2026',NOW='10:40';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8l34 13v26c0 22-15 38-34 45C31 85 16 69 16 47V21z" fill="currentColor"/><path d="M50 26v40M34 46h32" stroke="var(--brand2,#e0453a)" stroke-width="8" stroke-linecap="round"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const SC={},CARD={};

const SEC=[
 {k:'top',n:'Директорам',sub:[['dash','Пульт директоров'],['money','Начисления и оплаты']]},
 {k:'ab',n:'Абоненты',sub:[['subs','База абонентов'],['card','Карточка абонента'],['billing','Счета и акты за месяц'],['remind','Напоминания'],['cut','Отключение и включение']]},
 {k:'sl',n:'Новые клиенты',sub:[['funnel','Заявки и подключение'],['contracts','Договоры и ЭЦП']]},
 {k:'pu',n:'Пульт',sub:[['alarm','Тревоги сейчас'],['map','Карта объектов и экипажей'],['crew','Приложение экипажа'],['journal','Журнал событий']]},
 {k:'lk',n:'Клиенту',sub:[['lk','Личный кабинет клиента']]},
 {k:'hr',n:'Персонал',sub:[['staff','Кадровый учёт'],['apps','Заявления и визы']]},
 {k:'sys',n:'Внедрение',sub:[['onec','Обмен с 1С'],['site','Сайт и кабинет'],['server','Ваш сервер и безопасность'],['launch','Стоимость и этапы']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Директор':{av:'ДР',n:'Директор',note:'Все цифры в телефоне, визы на заявления, решения об отключении',s:ALL.slice()},
 'Бухгалтерия':{av:'БХ',n:'Главный бухгалтер',note:'Счета, акты, оплаты, долги, 1С, заявления после визы',s:['money','subs','card','billing','remind','cut','apps','onec']},
 'Абонентский отдел':{av:'АО',n:'Менеджер',note:'Абоненты, заявки, договоры, напоминания',s:['subs','card','funnel','contracts','remind','cut','billing']},
 'Дежурный пульта':{av:'ДП',n:'Оператор смены',note:'Тревоги, карта, экипажи, журнал',s:['alarm','map','journal','card']},
 'Экипаж':{av:'ЭК',n:'ГБР-3 · Ержан и Талгат',note:'Только свои вызовы и маршрут',s:['crew']},
 'Сотрудник':{av:'СТ',n:'Охранник · Нурлан',note:'Заявления, график, документы',s:['apps']},
 'Клиент':{av:'КЛ',n:'ТОО «Алем Маркет»',note:'Свои объекты, документы, оплата, заявки',s:['lk']}
};
let role='Директор',cur='dash',theme='light';

/* Абоненты: id, название, объект, тариф, абонплата, статус, долг, просрочка дней, кнопок */
const ST={ok:['обслуживается','g'],debt:['долг',''],warn:['предупреждён','w'],cutq:['на отключение','r'],cut:['отключён','r'],conn:['подключение','i']};
let SUB=[
 {id:'А-0412',n:'ТОО «Алем Маркет»',obj:'Магазин · мкр Самал-2, 58',plan:'Пульт + ГБР + тревожная кнопка',fee:65000,st:'ok',debt:0,days:0,btn:2,ph:'+7 701 *** 12 40'},
 {id:'А-1187',n:'ИП Касымова',obj:'Аптека · ул. Жандосова, 14',plan:'Пульт + ГБР',fee:38000,st:'debt',debt:38000,days:6,btn:1,ph:'+7 705 *** 77 01'},
 {id:'А-0933',n:'ТОО «Нур Строй»',obj:'Склад · ул. Рыскулова, 102',plan:'Пульт + ГБР + пожарная',fee:92000,st:'warn',debt:184000,days:12,btn:3,ph:'+7 777 *** 30 19'},
 {id:'А-2041',n:'Квартира · Ахметов Б.',obj:'ЖК «Есентай», кв. 118',plan:'Пульт + ГБР',fee:18000,st:'cutq',debt:54000,days:41,btn:1,ph:'+7 702 *** 08 33'},
 {id:'А-1502',n:'Кафе «Самса Хаус»',obj:'ул. Толе би, 210',plan:'Тревожная кнопка + ГБР',fee:25000,st:'cut',debt:75000,days:63,btn:1,ph:'+7 708 *** 41 66'},
 {id:'А-3310',n:'Школа «Зерде»',obj:'мкр Аксай-4, 12',plan:'Пульт + ГБР + пожарная + физ. пост',fee:410000,st:'ok',debt:0,days:0,btn:4,ph:'+7 727 *** 55 00'},
 {id:'А-3402',n:'Стоматология «Дент Люкс»',obj:'пр. Абая, 150',plan:'Пульт + ГБР',fee:42000,st:'conn',debt:0,days:0,btn:2,ph:'+7 747 *** 26 61'},
 {id:'А-0771',n:'ТЦ «Арена»',obj:'ул. Момышулы, 2',plan:'Физическая охрана · 6 постов',fee:2860000,st:'ok',debt:0,days:0,btn:6,ph:'+7 727 *** 10 10'}
];
const SD=id=>SUB.find(s=>s.id===id);
const TOT={all:4126,paid:3612,debt:386,cutq:74,cut:54,conn:38};
/* Тревоги */
let ALR=[
 {id:'Т-58817',t:'10:31',sub:'А-0412',type:'Тревожная кнопка',st:'new',crew:'',x:62,y:38,lat:'43.2172',lon:'76.9061'},
 {id:'Т-58816',t:'10:18',sub:'А-0933',type:'Проникновение · зона 2',st:'go',crew:'ГБР-3',x:30,y:52,lat:'43.2622',lon:'76.8817'},
 {id:'Т-58812',t:'09:47',sub:'А-3310',type:'Пожарный датчик',st:'arr',crew:'ГБР-1',x:18,y:76,lat:'43.2306',lon:'76.8541'},
 {id:'Т-58809',t:'09:12',sub:'А-1187',type:'Нет связи с объектом',st:'closed',crew:'—',x:48,y:60,lat:'43.2398',lon:'76.9006'}
];
const AST={new:['новая','r'],go:['экипаж выехал','w'],arr:['на месте','i'],closed:['закрыта','g']};
const CREWS=[['ГБР-1','на вызове',20,70],['ГБР-2','свободен',70,64],['ГБР-3','едет',38,46],['ГБР-4','свободен',80,24]];
/* Пульт директоров */
SC.dash=()=>`<div class="hd"><div><h2>Пульт директоров · ${TODAY}</h2><p>Готовые цифры без звонков в бухгалтерию: сколько абонентов, кто оплатил, кто должен, кто на отключении, сколько договоров в работе и что сейчас на пульте. Тот же экран открывается в телефоне.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('subs')"><small>Абонентов</small><b class="a">${fmt(TOT.all)}</b><span>+${TOT.conn} на подключении</span></div>
  <div class="clk" onclick="go('money')"><small>Оплатили за октябрь</small><b class="g">${fmt(TOT.paid)}</b><span>${Math.round(TOT.paid/TOT.all*100)}% · ${tg(118400000)}</span></div>
  <div class="clk" onclick="go('remind')"><small>Должны</small><b>${fmt(TOT.debt)}</b><span>${tg(21650000)} · напоминания идут</span></div>
  <div class="clk" onclick="go('cut')"><small>На отключение</small><b>${TOT.cutq}</b><span>ждут решения директора</span></div>
  <div class="clk" onclick="go('cut')"><small>Отключены</small><b>${TOT.cut}</b><span>${tg(3240000)} долга</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Договоры по стадиям</h3>${bars([['Заявка',26,'26'],['Обследование объекта',14,'14'],['Смета и КП',11,'11'],['Договор на подписи (ЭЦП)',9,'9'],['Монтаж',7,'7'],['Подключение к пульту',5,'5']])}
  <h3 style="margin-top:14px">Оплаты по месяцам, млн ₸</h3>${bars([['май',104.2,'104,2'],['июнь',106.9,'106,9'],['июль',109.5,'109,5'],['август',112.0,'112,0'],['сентябрь',115.6,'115,6'],['октябрь',118.4,'118,4']])}</div>
 <div class="pan"><h3>Сейчас</h3>
  <div class="rf bad" onclick="go('alarm')"><i></i><div><b>Тревожная кнопка · ТОО «Алем Маркет»</b><span>10:31 · мкр Самал-2, 58 · экипаж не назначен</span></div></div>
  <div class="rf" onclick="go('alarm')"><i></i><div><b>2 вызова в работе</b><span>ГБР-3 едет · ГБР-1 на месте</span></div></div>
  <div class="rf" onclick="go('apps')"><i></i><div><b>4 заявления ждут вашей визы</b><span>отпуск, аванс, приём на работу</span></div></div>
  <div class="rf" onclick="go('cut')"><i></i><div><b>${TOT.cutq} абонента на отключение</b><span>просрочка больше 30 дней</span></div></div>
  <div class="rf" onclick="go('staff')"><i></i><div><b>Сотрудники: 124 · на постах 86</b><span>2 больничных · 3 в отпуске</span></div></div>
 </div></div>
 ${said('Чтобы директора в реальном времени видели, сколько клиентов, сколько оплатили, сколько на отключение, сколько отключены — в мобильном телефоне, готовые цифры, чтобы не звонили бухгалтеру')}`;

SC.money=()=>`<div class="hd"><div><h2>Начисления и оплаты</h2><p>Каждый месяц система сама начисляет абонплату по договорам, оплаты приходят из банка и Kaspi и закрывают счета. Долг каждого абонента считается автоматически, без сверок в Excel.</p></div></div>
 <div class="wid"><div><small>Начислено за октябрь</small><b>${tg(140050000)}</b><span>${fmt(TOT.all)} абонентов</span></div><div><small>Оплачено</small><b class="g">${tg(118400000)}</b><span>банк 71% · Kaspi 26% · касса 3%</span></div><div><small>Долг всего</small><b class="a">${tg(21650000)}</b><span>${TOT.debt+TOT.cutq+TOT.cut} абонентов</span></div><div><small>Физическая охрана</small><b>${tg(46300000)}</b><span>38 объектов · посты</span></div></div>
 <div class="pan"><h3>Последние оплаты</h3><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Абонент</th><th>Откуда</th><th style="text-align:right">Сумма</th><th>Закрыто</th></tr></thead><tbody>${[['10:22','ТЦ «Арена»','Halyk · платёжное поручение',2860000,'счёт № 10-0771'],['10:05','ИП Касымова','Kaspi · по ссылке из напоминания',38000,'счёт № 10-1187'],['09:41','Школа «Зерде»','Банк · платёжное поручение',410000,'счёт № 10-3310'],['09:13','ТОО «Нур Строй»','Kaspi',92000,'частично · 1 из 2 счетов']].map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td class="mono" style="text-align:right">${fmt(r[3])}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Абоненты */
let subF='all';
SC.subs=()=>{const list=SUB.filter(s=>subF==='all'||s.st===subF);
 return `<div class="hd"><div><h2>База абонентов</h2><p>Все ${fmt(TOT.all)} абонентов в одной базе вместо Excel: объект, тариф, кнопки, договор, долг и статус. Статус меняется сам — по оплатам и срокам.</p></div><div class="btns"><button class="bt p" onclick="go('funnel')">+ Новый клиент</button></div></div>
 <div class="oxf">${[['all','Все',TOT.all],['ok','Обслуживаются',TOT.paid],['debt','Долг',TOT.debt],['cutq','На отключение',TOT.cutq],['cut','Отключены',TOT.cut],['conn','Подключение',TOT.conn]].map(c=>`<button class="oxc ${subF===c[0]?'on':''}" onclick="subF='${c[0]}';render()">${c[1]} <b>${fmt(c[2])}</b></button>`).join('')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Абонент</th><th>Объект</th><th>Тариф</th><th style="text-align:right">Абонплата</th><th style="text-align:right">Долг</th><th>Статус</th></tr></thead><tbody>${list.map(s=>`<tr class="clk ${s.st==='cutq'||s.st==='cut'?'rowbad':s.st==='warn'?'rowwarn':''}" onclick="curSub='${s.id}';go('card')"><td><b>${s.n}</b><br><small class="mono">${s.id}</small></td><td>${s.obj}</td><td><small>${s.plan}</small></td><td class="mono" style="text-align:right">${fmt(s.fee)}</td><td class="mono ${s.debt?'neg':''}" style="text-align:right">${s.debt?fmt(s.debt):'—'}</td><td>${tag(...ST[s.st])}</td></tr>`).join('')||'<tr><td colspan="6" class="hint">В демо по этому статусу нет строк.</td></tr>'}</tbody></table></div><p class="hint">В демо — 8 абонентов из ${fmt(TOT.all)}.</p></div>
 ${said('Есть пул клиентов, которые платят абонентскую плату, — по ним полный цикл обслуживания: счета, договоры, напоминания об оплате, об отключении')}`};

let curSub='А-0933';
SC.card=()=>{const s=SD(curSub);
 return `<div class="hd"><div><h2>${s.n} <small class="mono">${s.id}</small></h2><p>Карточка абонента: объекты, кнопки и датчики, договор, начисления и оплаты, документы, история напоминаний и вызовов. Поля карточки настраиваются под вас.</p></div><div class="btns"><select onchange="curSub=this.value;render()">${SUB.map(x=>`<option value="${x.id}" ${x.id===curSub?'selected':''}>${x.n}</option>`).join('')}</select></div></div>
 <div class="g2"><div class="pan"><h3>Абонент и объект</h3><div class="kv"><span>Статус</span><b>${tag(...ST[s.st])}</b></div><div class="kv"><span>Объект</span><b>${s.obj}</b></div><div class="kv"><span>Тариф</span><b>${s.plan}</b></div><div class="kv"><span>Абонплата</span><b class="mono">${tg(s.fee)} / мес</b></div><div class="kv"><span>Тревожных кнопок и датчиков</span><b>${s.btn}</b></div><div class="kv"><span>Договор</span><b>№ ОХ-${s.id.slice(2)} · подписан ЭЦП</b></div><div class="kv"><span>Контакт</span><b>${s.ph}</b></div>
 <h3 style="margin-top:12px">Ваши поля</h3><div class="kv"><span>Ответственный на объекте</span><b>заведующий складом</b></div><div class="kv"><span>Ключи от объекта</span><b>на пульте, ячейка 41</b></div><div class="kv"><span>Код снятия с охраны</span><b>скрыт · виден дежурному</b></div></div>
 <div class="pan"><h3>Деньги</h3><div class="kv"><span>Долг</span><b class="mono ${s.debt?'neg':''}">${s.debt?tg(s.debt):'нет'}</b></div><div class="kv"><span>Просрочка</span><b>${s.days?s.days+' дн.':'—'}</b></div>
 <h3 style="margin-top:12px">Документы · в кабинете клиента</h3>${['Счёт на оплату за октябрь','Акт выполненных работ за сентябрь','ЭСФ за сентябрь (из 1С)','Договор и приложения'].map(d=>`<div class="kv"><span>${d}</span><b>PDF</b></div>`).join('')}
 <h3 style="margin-top:12px">История</h3>${[['26.10','Напоминание о долге · WhatsApp','отправлено'],['21.10','Тревога: проникновение · ГБР-3','ложная, закрыта'],['05.10','Счёт за октябрь · в кабинет и на e-mail','отправлен']].map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}</div></div>`};
/* Счета и акты */
let billed=false;
SC.billing=()=>`<div class="hd"><div><h2>Счета и акты за месяц</h2><p>Первого числа система сама формирует счета и акты по всем договорам, кладёт их в личные кабинеты клиентов и отправляет на e-mail и в WhatsApp. ЭСФ уходят через 1С. Бухгалтерия только проверяет итог.</p></div><div class="btns">${billed?'':`<button class="bt p" onclick="bill()">Сформировать за ноябрь</button>`}</div></div>
 <div class="wid"><div><small>Счетов</small><b class="a">${billed?fmt(TOT.all):'—'}</b><span>${billed?'сформированы 01.11 в 06:00':'по расписанию 01.11 в 06:00'}</span></div><div><small>Актов</small><b>${billed?fmt(TOT.all-TOT.cut):'—'}</b><span>отключённым акт не выставляется</span></div><div><small>Сумма</small><b>${billed?tg(140920000):'—'}</b><span>с учётом новых договоров</span></div><div><small>Доставлено</small><b class="g">${billed?'в кабинет · e-mail · WhatsApp':'—'}</b><span>с ссылкой на оплату Kaspi</span></div></div>
 <div class="pan"><h3>Как это устроено</h3>${[['Тарифы и абонплата','берутся из договора и карточки абонента; скидки и физическая охрана — по постам и часам'],['Счёт и акт','по вашим шаблонам, нумерация по порядку, PDF'],['Отправка','личный кабинет, e-mail, WhatsApp со ссылкой на оплату'],['1С','в 1С уходят реализации и контрагенты; ЭСФ выписываются там'],['Оплата','приходит из банка и Kaspi и сама закрывает счёт']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>
 ${said('Выставление счетов, договоров, уведомления — чтобы это всё было уже готово')}`;
function bill(){billed=true;toast(`Сформировано ${fmt(TOT.all)} счетов и ${fmt(TOT.all-TOT.cut)} актов. Документы в кабинетах клиентов, отправлены на e-mail и в WhatsApp.`);render()}

/* Напоминания */
SC.remind=()=>`<div class="hd"><div><h2>Напоминания</h2><p>Правила задаёте один раз — дальше система сама напоминает клиентам об оплате и предупреждает об отключении. Оплатил — напоминания останавливаются, отключённый абонент включается автоматически.</p></div></div>
 <div class="g2"><div class="pan"><h3>Правила</h3><div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Что делает система</th><th>Канал</th></tr></thead><tbody>${[['за 5 дней до оплаты','напоминание с суммой и ссылкой на оплату','WhatsApp · SMS · кабинет'],['в день оплаты','повторное напоминание','WhatsApp'],['+3 дня','напоминание о долге','WhatsApp · звонок робота'],['+10 дней','предупреждение об отключении с датой','WhatsApp · e-mail · письмо в кабинет'],['+30 дней','в очередь на отключение — решает директор','задача директору'],['после оплаты','включение и сообщение «обслуживание возобновлено»','WhatsApp']].map(r=>`<tr><td class="mono"><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Сегодня отправлено</h3>${[['Напоминание до оплаты',412],['Напоминание о долге',96],['Предупреждение об отключении',31],['Обслуживание возобновлено',7]].map(r=>`<div class="kv"><span>${r[0]}</span><b class="mono">${r[1]}</b></div>`).join('')}${tip('Текст сообщений','Шаблоны пишете вы: вежливо, с суммой, номером договора и ссылкой на оплату. Для разных типов клиентов — разные тексты.')}</div></div>
 ${said('Напоминания об оплате, напоминания об отключении')}`;

/* Отключение */
SC.cut=()=>{const q=SUB.filter(s=>s.st==='cutq'||s.st==='cut'||s.st==='warn');
 return `<div class="hd"><div><h2>Отключение и включение</h2><p>Абоненты с долгом больше 30 дней попадают в очередь. Директор одной кнопкой подтверждает отключение — объект снимается с пульта, клиент получает уведомление. Оплатил — включение автоматически.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Абонент</th><th>Объект</th><th style="text-align:right">Долг</th><th>Просрочка</th><th>Статус</th><th></th></tr></thead><tbody>${q.map(s=>`<tr><td><b>${s.n}</b><br><small class="mono">${s.id}</small></td><td>${s.obj}</td><td class="mono neg" style="text-align:right">${fmt(s.debt)}</td><td class="mono">${s.days} дн.</td><td>${tag(...ST[s.st])}</td><td>${s.st==='cutq'?`<button class="bt sm" onclick="cutGo('${s.id}')">Отключить</button>`:s.st==='cut'?`<button class="bt p sm" onclick="payGo('${s.id}')">Оплатил — включить</button>`:'<small>предупреждён 21.10</small>'}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Сколько на отключение подали, сколько отключены — всё должно просматриваться в полном объёме')}`};
function cutGo(id){const s=SD(id);if(!confirm('Отключить '+s.n+' от пульта?'))return;s.st='cut';TOT.cutq--;TOT.cut++;toast(`${s.n}: объект снят с пульта, клиенту отправлено уведомление. В журнале — кто и когда отключил.`);render()}
function payGo(id){const s=SD(id);s.st='ok';s.debt=0;s.days=0;TOT.cut--;TOT.paid++;toast(`${s.n}: оплата получена, объект снова на пульте, клиенту отправлено «обслуживание возобновлено».`);render()}

/* Заявки и подключение */
const FST=['Заявка','Обследование','Смета и КП','Договор (ЭЦП)','Монтаж','На пульте'];
let LEADS=[['Л-2210','ТОО «Восток Логистик»','склад · 1 800 м²','сайт',0],['Л-2207','Квартира · Сериков Д.','ЖК «Алтын Булак»','звонок',1],['Л-2201','Ресторан «Тау»','пр. Достык, 85','сайт · кабинет',2],['Л-2196','ТОО «Мед Центр»','2 филиала','рекомендация',3],['Л-2190','Стоматология «Дент Люкс»','пр. Абая, 150','сайт',4],['Л-2188','Магазин «Свежее»','мкр Орбита-3','звонок',5]];
SC.funnel=()=>`<div class="hd"><div><h2>Заявки и подключение</h2><p>Заявка с сайта, из кабинета или по звонку попадает в воронку: обследование объекта, смета, договор с ЭЦП, монтаж, подключение к пульту. После подключения клиент сам становится абонентом с начислением абонплаты.</p></div></div>
 <div class="oxk">${FST.map((f,i)=>`<div class="oxkc"><h4>${f} <small>${LEADS.filter(l=>l[4]===i).length}</small></h4>${LEADS.filter(l=>l[4]===i).map(l=>`<div class="oxkt" onclick="lNext('${l[0]}')"><b>${l[1]}</b><span>${l[2]}</span><small>${l[3]} · ${l[0]}</small></div>`).join('')}</div>`).join('')}</div>
 <p class="hint">Нажмите на карточку — она перейдёт на следующий этап. Этапы и поля карточки настраиваем под вас.</p>
 ${said('Карточка клиента — свои поля, по этим полям заводить новых клиентов, и дальше он пошёл по воронке')}`;
function lNext(id){const l=LEADS.find(x=>x[0]===id);if(l[4]>=FST.length-1){toast(`${l[1]} уже на пульте — создан абонент, абонплата начислится с 1-го числа.`);return}l[4]++;toast(`${l[1]} → «${FST[l[4]]}».`+(FST[l[4]]==='Договор (ЭЦП)'?' Договор сформирован по шаблону и отправлен клиенту на подпись ЭЦП.':''));render()}

SC.contracts=()=>`<div class="hd"><div><h2>Договоры и ЭЦП</h2><p>Договор собирается из карточки клиента по вашему шаблону: объект, тариф, кнопки, сумма. Клиент подписывает ЭЦП по ссылке, подписанный договор сразу в его кабинете и в карточке.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Договор</th><th>Клиент</th><th>Сумма в месяц</th><th>Статус</th></tr></thead><tbody>${[['ОХ-3402','Стоматология «Дент Люкс»',42000,['подписан обеими сторонами','g']],['ОХ-3409','ТОО «Мед Центр»',96000,['ждёт подписи клиента','w']],['ОХ-3411','Ресторан «Тау»',55000,['на согласовании у юриста','']],['ДС-0771-3','ТЦ «Арена» · доп. соглашение','+ 1 пост',['подписан','g']]].map(r=>`<tr><td class="mono"><b>${r[0]}</b></td><td>${r[1]}</td><td class="mono">${typeof r[2]==='number'?fmt(r[2]):r[2]}</td><td>${tag(...r[3])}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Конфиденциальность','С вами подписываем NDA до начала работ. Доступ к данным клиентов в системе — по ролям, все действия пишутся в журнал.')}`;
/* Пульт: тревоги */
SC.alarm=()=>`<div class="hd"><div><h2>Тревоги сейчас</h2><p>Срабатывание тревожной кнопки или датчика приходит с оборудования на пульте прямо в систему: объект, адрес, тип тревоги, ключи и контакты. Дежурный назначает экипаж одной кнопкой — экипажу в приложение приходит вызов с координатами и маршрутом.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Объект</th><th>Тревога</th><th>Статус</th><th>Экипаж</th><th></th></tr></thead><tbody>${ALR.map((a,i)=>{const s=SD(a.sub);return `<tr class="${a.st==='new'?'rowbad':''}"><td class="mono"><b>${a.t}</b></td><td><b>${s.n}</b><br><small>${s.obj}</small></td><td>${a.type}</td><td>${tag(...AST[a.st])}</td><td>${a.crew||'—'}</td><td>${a.st==='new'?`<button class="bt p sm" onclick="aSend(${i})">Отправить ГБР-2</button>`:a.st==='arr'?`<button class="bt sm" onclick="aClose(${i})">Закрыть</button>`:''}</td></tr>`}).join('')}</tbody></table></div></div>
 ${tip('Оборудование','Тревожные кнопки и приборы на объектах уже передают сигналы на ваш пульт. Подключаем систему к пультовому ПО или к его выгрузке событий — способ уточним по вашему оборудованию.')}
 ${said('Тревожные кнопки должны быть все сведены в систему, чтобы проходили уведомления, где какой был сигнал, по какому адресу')}`;
function aSend(i){const a=ALR[i];a.st='go';a.crew='ГБР-2';toast(`Вызов ${a.id} отправлен ГБР-2: адрес, координаты ${a.lat}, ${a.lon} и кнопка маршрута в 2ГИС — в приложении экипажа.`);render()}
function aClose(i){const a=ALR[i];a.st='closed';toast(`Тревога ${a.id} закрыта, отчёт экипажа сохранён в журнале и в карточке абонента.`);render()}

SC.map=()=>`<div class="hd"><div><h2>Карта объектов и экипажей</h2><p>Объекты под охраной и экипажи на одной схеме: где тревога, кто свободен и кто ближе. Положение экипажа — по телефону в приложении.</p></div></div>
 <div class="g2 g21"><div class="pan"><svg viewBox="0 0 100 90" class="oxmap" role="img" aria-label="Схема города с объектами и экипажами">
  <rect width="100" height="90" fill="var(--card2)"/><path d="M0 30H100M0 58H100M25 0V90M55 0V90M80 0V90" stroke="var(--line2)" stroke-width="1.6"/><path d="M0 80L100 12" stroke="var(--line2)" stroke-width="2.4"/>
  ${SUB.map((s,i)=>`<circle cx="${10+i*11}" cy="${18+(i*23)%60}" r="1.6" fill="var(--muted2)"/>`).join('')}
  ${ALR.filter(a=>a.st!=='closed').map(a=>`<g><circle cx="${a.x}" cy="${a.y}" r="4.5" fill="none" stroke="var(--bad)" stroke-width=".8"/><circle cx="${a.x}" cy="${a.y}" r="2" fill="var(--bad)"/><text x="${a.x+5}" y="${a.y+1}" font-size="3" fill="var(--text)">${SD(a.sub).n}</text></g>`).join('')}
  ${CREWS.map(c=>`<g><rect x="${c[2]-3.5}" y="${c[3]-2.2}" width="7" height="4.4" rx="1" fill="${c[1]==='свободен'?'var(--ok)':'var(--brand)'}"/><text x="${c[2]}" y="${c[3]+1}" font-size="2.4" fill="#fff" text-anchor="middle">${c[0].slice(4)}</text></g>`).join('')}
 </svg></div>
 <div class="pan"><h3>Экипажи</h3>${CREWS.map(c=>`<div class="kv"><span>${c[0]}</span><b>${c[1]}</b></div>`).join('')}<h3 style="margin-top:12px">Объекты</h3><div class="kv"><span>Под охраной</span><b>${fmt(TOT.all-TOT.cut)}</b></div><div class="kv"><span>Тревог сегодня</span><b>${ALR.length+19}</b></div><div class="kv"><span>Среднее время прибытия</span><b>7 мин 40 с</b></div></div></div>
 ${tip('Карта','Схема в демо условная. В системе — бесплатная карта с объектами и экипажами; карты 2ГИС внутри системы подключаются по их платному API, а маршрут для экипажа открывается в приложении 2ГИС бесплатно.')}`;

SC.crew=()=>{const a=ALR.find(x=>x.st==='go'&&x.crew==='ГБР-3')||ALR[1],s=SD(a.sub);
 return `<div class="hd"><div><h2>Приложение экипажа · ГБР-3</h2><p>Экипаж получает вызов в телефоне: объект, адрес, тип тревоги, контакт и где ключи. Кнопка «Маршрут» открывает 2ГИС с построенным маршрутом до координат — без ввода адреса. На месте экипаж отмечает «Прибыл» и пишет итог.</p></div></div>
 <div class="oxph-wrap"><div class="oxph"><div class="oxph-top"><small>ВЫЗОВ ${a.id} · ${a.t}</small><b>${a.type}</b></div>
 <div class="kv"><span>Объект</span><b>${s.n}</b></div><div class="kv"><span>Адрес</span><b>${s.obj}</b></div><div class="kv"><span>Координаты</span><b class="mono">${a.lat}, ${a.lon}</b></div><div class="kv"><span>Контакт</span><b>${s.ph}</b></div><div class="kv"><span>Ключи</span><b>на пульте, ячейка 41</b></div>
 <button class="bt p oxbig" onclick="act('Откроется 2ГИС с маршрутом до точки ${a.lat}, ${a.lon}. Карты 2ГИС в самой системе — платный API; переход в приложение 2ГИС по координатам — бесплатно.')">Маршрут в 2ГИС</button>
 <button class="bt oxbig" onclick="crewArr()">Прибыл на объект</button></div>
 ${said('Чтобы экипажу заявка поступала автоматически в приложение и были указаны координаты в 2ГИС — нажали на кнопку, и маршрут сразу построился')}</div>`};
function crewArr(){const a=ALR.find(x=>x.crew==='ГБР-3');if(a)a.st='arr';toast('Отмечено: ГБР-3 на объекте в '+NOW+'. Дежурный и директор видят время прибытия.');render()}

SC.journal=()=>`<div class="hd"><div><h2>Журнал событий</h2><p>Всё, что произошло на пульте, — с временем до секунды: тревога, кто принял, какой экипаж, когда выехал и прибыл, чем закончилось. Отчёт для клиента и для разбора спорных случаев.</p></div><div class="btns"><button class="bt" onclick="act('Журнал выгружен в Excel.')">Excel</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Событие</th><th>Объект</th><th>Кто</th></tr></thead><tbody>${[['10:31:07','Тревожная кнопка','ТОО «Алем Маркет»','прибор → пульт'],['10:18:44','ГБР-3 выехал','ТОО «Нур Строй»','дежурный Айдана'],['10:18:02','Проникновение · зона 2','ТОО «Нур Строй»','прибор → пульт'],['09:55:30','ГБР-1 прибыл · 8 мин','Школа «Зерде»','экипаж'],['09:47:12','Пожарный датчик','Школа «Зерде»','прибор → пульт'],['09:20:00','Восстановлена связь','ИП Касымова','прибор'],['08:02:15','Снят с охраны · по графику','ТЦ «Арена»','клиент']].map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Кабинет клиента */
SC.lk=()=>`<div class="hd"><div><h2>Личный кабинет клиента · ТОО «Алем Маркет»</h2><p>Клиент входит по логину и паролю — на вашем сайте или в приложении. Все документы готовы: счета, акты, ЭСФ, договор. Оплата по кнопке, заявки на монтаж и обслуживание, события по своим объектам.</p></div></div>
 <div class="g2"><div class="pan"><h3>Документы</h3>${[['Счёт № 10-0412 за октябрь','65 000 ₸','оплачен'],['Акт за сентябрь','65 000 ₸','подписан'],['ЭСФ за сентябрь','65 000 ₸','в ИС ЭСФ'],['Договор ОХ-0412 и приложения','','подписан ЭЦП']].map(r=>`<div class="kv"><span>${r[0]}${r[1]?' · '+r[1]:''}</span><b>${r[2]} · <a href="#" onclick="act('Документ скачан в PDF.');return false">PDF</a></b></div>`).join('')}
 <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="act('Откроется оплата Kaspi с суммой и номером счёта.')">Оплатить</button><button class="bt" onclick="act('Заявка на обслуживание принята — менеджер свяжется сегодня.')">Заявка: монтаж, ремонт, новый объект</button></div></div>
 <div class="pan"><h3>Мои объекты</h3><div class="kv"><span>Магазин · мкр Самал-2, 58</span><b>${tag('под охраной','g')}</b></div><div class="kv"><span>Тревожных кнопок</span><b>2</b></div>
 <h3 style="margin-top:12px">События</h3>${[['сегодня 10:31','Тревожная кнопка · экипаж направлен'],['вчера 21:02','Поставлен на охрану'],['вчера 09:00','Снят с охраны']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div></div>
 ${said('У клиентов должен быть личный кабинет, куда они заходят по логину и паролю и получают все документы — акты, счета на оплату, ЭСФ — уже в готовом виде')}`;

/* Персонал */
SC.staff=()=>`<div class="hd"><div><h2>Кадровый учёт</h2><p>124 сотрудника: должность, пост, график, документы и сроки (удостоверение, медкомиссия, обучение). Система заранее напоминает о сроках и считает табель по графику. Рассчитано на рост до 200+ человек.</p></div><div class="btns"><button class="bt p" onclick="act('Приём на работу: анкета, документы, пост — заявление сразу уходит на визу директору.')">+ Сотрудник</button></div></div>
 <div class="wid"><div><small>Сотрудников</small><b class="a">124</b><span>охранники 112 · ГБР 8 · офис 4</span></div><div><small>На постах сейчас</small><b>86</b><span>по графику 86</span></div><div><small>Отпуск · больничный</small><b>3 · 2</b><span></span></div><div><small>Истекают документы</small><b>5</b><span>в ближайшие 30 дней</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Должность</th><th>Пост</th><th>График</th><th>Документы</th></tr></thead><tbody>${[['Нурлан Ж.','Охранник','ТЦ «Арена» · пост 2','сутки через двое','в порядке'],['Ержан К.','Старший ГБР-3','мобильная группа','12 ч · день','медкомиссия до 14.11'],['Талгат С.','Водитель ГБР-3','мобильная группа','12 ч · день','в порядке'],['Айдана М.','Дежурный пульта','пульт','12 ч · ночь','в порядке'],['Бауыржан А.','Охранник','Школа «Зерде»','5/2','удостоверение до 02.11']].map(r=>`<tr class="${/до/.test(r[4])?'rowwarn':''}"><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div></div>`;

let APPS=[['З-301','Нурлан Ж.','Отпуск 10–24.11',0],['З-302','Талгат С.','Аванс 50 000 ₸',0],['З-303','Бауыржан А.','Перевод на пост ТЦ «Арена»',1],['З-299','Айдана М.','Отгул 28.10',3]];
const APST=['ждёт визы директора','виза ЭЦП · в бухгалтерии','в работе у бухгалтерии','исполнено'];
SC.apps=()=>`<div class="hd"><div><h2>Заявления и визы</h2><p>Сотрудник подаёт заявление с телефона — без бумаги и подписи от руки. Директор ставит визу ЭЦП, бухгалтерия видит и исполняет. Каждый видит, на каком шаге его заявление.</p></div>${role==='Сотрудник'?`<div class="btns"><button class="bt p" onclick="act('Заявление подано директору: отпуск, аванс, отгул, перевод, увольнение — по шаблону.')">+ Заявление</button></div>`:''}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>№</th><th>Сотрудник</th><th>Заявление</th><th>Шаг</th><th></th></tr></thead><tbody>${APPS.map((a,i)=>`<tr><td class="mono">${a[0]}</td><td><b>${a[1]}</b></td><td>${a[2]}</td><td>${tag(APST[a[3]],a[3]===3?'g':a[3]===0?'w':'')}</td><td>${a[3]===0&&role==='Директор'?`<button class="bt p sm" onclick="visa(${i})">Виза ЭЦП</button>`:a[3]>0&&a[3]<3&&role==='Бухгалтерия'?`<button class="bt sm" onclick="apDone(${i})">Исполнено</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Заявления писать — всё через систему: подали, видит директор, ставит свою визу электронную, бухгалтерия отрабатывает')}`;
function visa(i){APPS[i][3]=1;toast(`Виза поставлена ЭЦП. Заявление ${APPS[i][0]} ушло в бухгалтерию, сотрудник получил уведомление.`);render()}
function apDone(i){APPS[i][3]=3;toast(`Заявление ${APPS[i][0]} исполнено.`);render()}

/* Внедрение */
SC.onec=()=>`<div class="hd"><div><h2>Обмен с 1С</h2><p>Документы формируем в системе, в 1С уходит только то, что нужно бухгалтерии. 1С перестаёт быть местом, где работают отделы, и больше не зависает от объёма.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Данные</th><th>Направление</th></tr></thead><tbody>${[['Контрагенты · 4 000+','перенос из 1С и Excel при старте, дальше — из системы в 1С'],['Реализации (акты) за месяц','система → 1С'],['ЭСФ','выписываются в 1С по реализациям'],['Оплаты из банка','банк → система (или 1С → система)'],['Заработная плата','остаётся в 1С; табель — из системы']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('1С не справляется с объёмом, Excel не справляется — надо исключить ручные операции полностью')}`;

SC.site=()=>`<div class="hd"><div><h2>Сайт и кабинет</h2><p>Дизайн сайта у вас готов. Делаем рабочую часть: личный кабинет клиента (документы, оплата, заявки, события) и формы заявок на подключение и монтаж, которые сразу попадают в воронку. С Tilda переносим на свою площадку, чтобы кабинет и сайт были одним целым.</p></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['Вёрстка по вашему готовому макету','Личный кабинет клиента: вход, документы, оплата, заявки, события','Формы заявок → воронка в системе','Базовая SEO-оптимизация, мобильная версия'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Стоимость</h3><div class="kv"><span>Сайт с кабинетом</span><b>800 000 ₸</b></div><div class="kv"><span>Срок</span><b>параллельно с порталом</b></div></div></div>`;

SC.server=()=>`<div class="hd"><div><h2>Ваш сервер и безопасность</h2><p>Разработку ведём на облачном сервере, к запуску переносим систему на ваш выделенный сервер. Требования небольшие — главное стабильность.</p></div></div>
 <div class="g2"><div class="pan"><h3>Минимум под 200 сотрудников и 4 000+ абонентов</h3>${[['Виртуальная машина','Ubuntu или Debian — без разницы'],['Процессор','4 ядра'],['Память','8–16 ГБ'],['Диск','100 ГБ SSD на старте'],['Сеть','статический IP, постоянный интернет'],['Питание','ИБП — без него сервер уязвим при отключении света'],['Резервные копии','ежедневно — у вас уже настроено зеркалирование']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Безопасность</h3>${[['NDA','подписываем до начала работ'],['Доступ','по ролям: каждый видит только своё'],['Журнал','все действия с данными записываются'],['Доступ разработчиков','по VPN/SSH, который выдаёте вы'],['Данные','на вашем сервере, на территории Казахстана']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div></div>
 ${said('У нас есть свой сервер, бэкап уже настроен, зеркалится — какие у вас системные требования?')}`;

SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Всё, что обсудили, входит в стандартный пакет разработки портала. 1С и сайт с кабинетом — отдельными блоками. Три этапа: старт, база на сервере, полировка с вашей командой до полной сдачи.</p></div></div>
 <div class="pk1"><div><small>Портал + 1С + сайт</small><b>4 100 000 ₸</b><span>2 500 000 + 800 000 + 800 000 ₸</span></div><div><small>Со скидкой 5 % за быстрый старт</small><b>3 895 000 ₸</b><span>при подписании до понедельника 26.10</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>389 500 ₸</b><span>при подписании</span></div><div><small>База · 45%</small><b>1 752 750 ₸</b><span>база развёрнута на сервере</span></div><div><small>Сдача · 45%</small><b>1 752 750 ₸</b><span>после полировки и приёмки</span></div></div>
 <div class="g2"><div class="pan"><h3>Срок</h3><div class="kv"><span>Весь проект</span><b>4–6 недель</b></div><div class="kv"><span>База на сервере</span><b>около недели после старта</b></div><div class="kv"><span>Полировка</span><b>версии с правками, ответ от вас — за 1–2 дня</b></div></div>
 <div class="pan"><h3>После сдачи</h3><div class="kv"><span>Исправление ошибок</span><b>3 месяца бесплатно</b></div><div class="kv"><span>Доработки</span><b>по часам или ежемесячный договор сопровождения</b></div><div class="kv"><span>Карты 2ГИС внутри системы</span><b>по тарифу 2ГИС (опция)</b></div></div></div>`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const x=SUB.find(s=>(s.id+s.n+s.obj).toLowerCase().includes(v));if(x&&v){curSub=x.id;go('card');return}toast('Ищите по абоненту, адресу или номеру: «Алем», «Самал», «А-0933».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ОХРАНА</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='alarm'?'<em>'+ALR.filter(a=>a.st==='new').length+'</em>':x[0]==='apps'?'<em>'+APPS.filter(a=>a[3]===0).length+'</em>':x[0]==='cut'?'<em>'+SUB.filter(s=>s.st==='cutq').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Цифры'],['subs','Абоненты'],['alarm','Тревоги'],['apps','Заявления'],['crew','Вызов'],['lk','Кабинет']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ОХРАНА';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт директоров: абоненты, оплаты, долги, отключения — готовые цифры в телефоне.'],
 ['subs','2 · База абонентов вместо Excel.'],
 ['billing','3 · Счета и акты за месяц формируются сами.'],
 ['remind','4 · Напоминания об оплате и отключении — по правилам.'],
 ['cut','5 · Отключение по решению директора, включение после оплаты — само.'],
 ['funnel','6 · Новые клиенты: заявка → договор с ЭЦП → монтаж → пульт.'],
 ['alarm','7 · Тревожные кнопки сведены в систему.'],
 ['crew','8 · Экипажу — вызов с координатами и маршрутом в 2ГИС.'],
 ['lk','9 · Кабинет клиента: документы, оплата, заявки.'],
 ['apps','10 · Заявления сотрудников с визой директора ЭЦП.'],
 ['launch','11 · Портал, 1С и сайт: 4,1 млн ₸, со скидкой 5 % — 3 895 000 ₸.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
