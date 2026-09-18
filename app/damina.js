/* DAMINA Montessori Group — система детского образовательного центра.
   Демо-макет для Екатерины (Алматы, Баганашыл) по встрече 18 сентября 2026. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const tg=n=>fmt(n)+' ₸';
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};

const SEC=[
 {k:'dash', ic:'▦', n:'Пульт',        sub:[['dash','Общая картина'],['today','Что требует решения'],['reports','Отчёты руководителю']]},
 {k:'sale', ic:'◎', n:'Набор',        sub:[['funnel','Воронка набора'],['leads','Заявки и WhatsApp'],['trial','Экскурсии и пробные'],['adapt','Адаптационный период']]},
 {k:'kids', ic:'☺', n:'Дети и группы',sub:[['kids','Дети'],['groups','Группы и форматы'],['clubs','Кружки и музыка'],['schedule','Расписание'],['calendar','Календарь центра']]},
 {k:'att',  ic:'☑', n:'Посещаемость', sub:[['att','Посещаемость детей'],['teacher','Экран педагога'],['attstaff','Сотрудники · геолокация']]},
 {k:'money',ic:'₸', n:'Оплаты',       sub:[['bill','Начисления 1-го числа'],['invoices','Квитанции и напоминания'],['debtors','Должники и пеня'],['bank','Выписка банка · сверка']]},
 {k:'par',  ic:'♥', n:'Родители',     sub:[['parent','Кабинет родителя'],['onboard','Регистрация через WhatsApp'],['chats','Чаты'],['menu','Меню и согласования']]},
 {k:'hr',   ic:'☗', n:'Сотрудники',   sub:[['staff','Сотрудники и ставки'],['pay','Зарплата и KPI'],['tasks','Задачи']]},
 {k:'set',  ic:'⚙', n:'Настройки',    sub:[['roles','Права доступа'],['integr','Интеграции'],['migr','Перенос из таблиц'],['stack','Состав релиза']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=['dash','today','reports','funnel','leads','trial','adapt','kids','groups','clubs','schedule','calendar','att','teacher','attstaff','bill','invoices','debtors','bank','parent','onboard','chats','menu','staff','pay','tasks','roles','integr','migr','stack'];

const ROLES={
 'Собственник':{av:'ШФ',n:'Шеф',r:'принимает решение',note:'Всё: набор, дети, оплаты, должники, сотрудники, зарплата, отчёты. Тот экран, за который спросят «что мы получили за эту цену»',s:ALL},
 'Руководитель центра':{av:'ЕК',n:'Екатерина',r:'управляет центром',note:'Воронка, группы, расписание, посещаемость, оплаты и должники, сотрудники и задачи. Без себестоимости и зарплат собственника',
  s:ALL.filter(k=>k!=='reports')},
 'Администратор':{av:'АД',n:'Айгерим',r:'ресепшн и набор',note:'Заявки из WhatsApp, экскурсии, пробные, регистрация родителей, расписание, чаты. Оплаты видит, но не начисляет',
  s:['dash','funnel','leads','trial','adapt','kids','groups','clubs','schedule','calendar','att','onboard','chats','menu','tasks','invoices']},
 'Педагог':{av:'МР',n:'Мария',r:'группа Casa A · 3–6',note:'Своя группа и свои кружки: отметить пришёл / не пришёл, заметка родителю, своё расписание, свой выход по геолокации',
  s:['teacher','att','schedule','attstaff','chats','calendar']},
 'Бухгалтер':{av:'НТ',n:'Наталья',r:'начисления и выписка',note:'Начисления 1-го числа, квитанции, выписка банка, сверка, должники и пеня, табель и зарплата',
  s:['bill','invoices','debtors','bank','staff','pay','att','attstaff']},
 'Родитель':{av:'РД',n:'Дана (мама Алана)',r:'Casa A · 3–6 + музыка + английский',note:'Только свой ребёнок: квитанция, оплата, посещаемость, расписание, чат с педагогом, меню',
  s:['parent','chats','menu','calendar']}
};
let role='Собственник',cur='dash',theme='light';

/* ====== ФОРМАТЫ И ГРУППЫ ====== */
const GROUPS=[
 {id:'toddler',n:'Toddler · 1,5–3 года',fmt:'полный день',cap:12,kids:12,t:'Асель Р.',price:220000,room:'здание 1, 1 этаж'},
 {id:'casaA',n:'Casa A · 3–6 лет',fmt:'полный день',cap:18,kids:18,t:'Мария К.',price:200000,room:'здание 1, 2 этаж'},
 {id:'casaB',n:'Casa B · 3–6 лет',fmt:'полный день',cap:18,kids:14,t:'Жанна С.',price:200000,room:'здание 1, 2 этаж'},
 {id:'elem',n:'Elementary · 1–4 класс',fmt:'школа',cap:27,kids:25,t:'Ольга В.',price:250000,room:'здание 2'},
 {id:'devM',n:'Развивашка · утро',fmt:'2 часа × 3 дня',cap:10,kids:8,t:'Динара Т.',price:90000,room:'здание 1, зал'},
 {id:'devE',n:'Развивашка · вечер',fmt:'2 часа × 3 дня',cap:10,kids:6,t:'Динара Т.',price:90000,room:'здание 1, зал'}
];
const CLUBS=[
 {n:'Музыка',days:'Пн Ср Пт',time:'в течение дня',price:25000,t:'Ерлан М.',kids:41,recalc:true},
 {n:'Английский',days:'Вт Чт',time:'16:00–16:45',price:30000,t:'Ms. Anna',kids:34,recalc:true},
 {n:'Шахматы',days:'Пн Ср',time:'16:00–16:45',price:22000,t:'Бахыт О.',kids:18,recalc:true},
 {n:'Робототехника',days:'Вт Чт',time:'16:45–17:00',price:35000,t:'Тимур Е.',kids:15,recalc:false},
 {n:'Хореография',days:'Пн Пт',time:'16:00–16:45',price:22000,t:'Алия Ж.',kids:27,recalc:true},
 {n:'ИЗО',days:'Ср',time:'16:00–17:00',price:18000,t:'Мадина А.',kids:22,recalc:false},
 {n:'Логопед',days:'индивидуально',time:'по записи',price:6000,t:'Гульнара Б.',kids:9,recalc:true,per:'занятие'}
];

/* ====== ДЕТИ (фрагмент из 110) ====== */
const KIDS=[
 {n:'Алан Д.',age:'4 г. 2 м.',g:'casaA',clubs:['Музыка','Английский'],par:'Дана Д.',phone:'+7 701 ···· 41 22',bal:0,since:'09.2024'},
 {n:'Амина С.',age:'5 л. 6 м.',g:'casaA',clubs:['Музыка','Хореография','Английский'],par:'Сауле С.',phone:'+7 777 ···· 18 07',bal:-275000,since:'01.2023'},
 {n:'Тимур К.',age:'2 г. 1 м.',g:'toddler',clubs:['Музыка'],par:'Карина К.',phone:'+7 705 ···· 90 33',bal:0,since:'09.2025'},
 {n:'Ева Л.',age:'8 л.',g:'elem',clubs:['Английский','Шахматы','Робототехника'],par:'Ольга Л.',phone:'+7 747 ···· 55 61',bal:0,since:'09.2022'},
 {n:'Арсен Б.',age:'3 г. 8 м.',g:'casaB',clubs:['Музыка','Хореография'],par:'Айгуль Б.',phone:'+7 701 ···· 27 84',bal:-222000,since:'03.2025'},
 {n:'София Н.',age:'9 л. 3 м.',g:'elem',clubs:['Английский','ИЗО'],par:'Наталья Н.',phone:'+7 771 ···· 63 12',bal:0,since:'09.2023'},
 {n:'Даниял А.',age:'2 г. 7 м.',g:'devM',clubs:[],par:'Асель А.',phone:'+7 708 ···· 44 90',bal:0,since:'09.2026'},
 {n:'Мирас Т.',age:'6 л. 1 м.',g:'casaB',clubs:['Шахматы','Музыка','Логопед'],par:'Айдана Т.',phone:'+7 700 ···· 71 05',bal:-60000,since:'09.2024'}
];
const G=id=>GROUPS.find(g=>g.id===id)||GROUPS[1];
let curKid=0;

/* ====== ВОРОНКА НАБОРА · стадии клиента ====== */
const FST=[['lead','Новый лид'],['tour','Экскурсия'],['trial','Пробный урок'],['adapt','Адаптационный период'],['enrolled','Зачислен']];
const LEADS=[
 {n:'Айнур (мама, 3 г.)',src:'Instagram · таргет',st:'lead',fmt:'Casa 3–6',dt:'сегодня 09:12',note:'написала в WhatsApp, спросила цену',wa:true},
 {n:'Бауыржан (папа, 2 г.)',src:'рекомендация',st:'lead',fmt:'Toddler',dt:'вчера',note:'Toddler полный — предложить лист ожидания',wa:true},
 {n:'Мадина (мама, 7 л.)',src:'Instagram · таргет',st:'tour',fmt:'Elementary',dt:'экскурсия 19.09 10:00',note:'',wa:true},
 {n:'Ольга (мама, 4 г.)',src:'2ГИС',st:'tour',fmt:'Casa 3–6',dt:'экскурсия 22.09 11:00',note:'',wa:false},
 {n:'Жанар (мама, 5 л.)',src:'рекомендация',st:'trial',fmt:'Casa 3–6',dt:'пробный 19.09',note:'после экскурсии 15.09',wa:true},
 {n:'Дмитрий (папа, 2,5 г.)',src:'сайт',st:'trial',fmt:'Развивашка',dt:'пробный 18.09 · сегодня',note:'',wa:true},
 {n:'Асем (мама, 3,5 г.)',src:'Instagram · таргет',st:'adapt',fmt:'Casa B',dt:'день 4 из 10',note:'адаптация идёт хорошо, педагог Жанна',wa:true},
 {n:'Камила (мама, 8 л.)',src:'рекомендация',st:'adapt',fmt:'Elementary',dt:'день 8 из 10',note:'договор на подписи',wa:true},
 {n:'Ерлан (папа, 4 г.)',src:'2ГИС',st:'enrolled',fmt:'Casa B',dt:'зачислен 15.09',note:'квитанция за сентябрь пропорционально',wa:true}
];
const SRC={'Instagram · таргет':34,'рекомендация':29,'2ГИС':12,'сайт':9,'проходили мимо':4};

/* ====== ОПЛАТЫ · сентябрь ====== */
const BILL={kids:110,charged:23840000,paid:19310000,debtors:14,debt:2410000,penalty:36000,day:18};

/* ====== СОТРУДНИКИ ====== */
const STAFF=[
 {n:'Мария К.',pos:'педагог Casa A · AMI 3–6',type:'оклад',rate:'420 000 / мес',geo:'08:12',out:22,plan:22},
 {n:'Жанна С.',pos:'педагог Casa B · AMI 3–6',type:'оклад',rate:'400 000 / мес',geo:'08:05',out:22,plan:22},
 {n:'Асель Р.',pos:'педагог Toddler',type:'оклад',rate:'380 000 / мес',geo:'07:58',out:21,plan:22},
 {n:'Ольга В.',pos:'учитель Elementary',type:'оклад',rate:'450 000 / мес',geo:'08:20',out:22,plan:22},
 {n:'Динара Т.',pos:'педагог развивашки',type:'за выход',rate:'12 000 / выход',geo:'09:41',out:13,plan:13},
 {n:'Ерлан М.',pos:'музыка',type:'почасовая',rate:'6 000 / час',geo:'10:02',out:12,plan:12},
 {n:'Ms. Anna',pos:'английский',type:'за занятие',rate:'8 000 / занятие',geo:'—',out:7,plan:8},
 {n:'Айгерим Н.',pos:'администратор',type:'оклад',rate:'280 000 / мес',geo:'07:45',out:22,plan:22},
 {n:'Гульнара Б.',pos:'логопед',type:'за занятие',rate:'4 000 / занятие',geo:'14:30',out:9,plan:9},
 {n:'Бакыт О.',pos:'шахматы',type:'за занятие',rate:'7 000 / занятие',geo:'15:52',out:6,plan:6}
];

/* ====== ЗАДАЧИ ====== */
const TASKS=[
 {t:'Перезвонить Айнур по цене Casa 3–6, предложить экскурсию',who:'Айгерим Н.',due:'сегодня 12:00',st:'new',src:'воронка'},
 {t:'Собрать 14 должников и связаться с проблемными',who:'Екатерина',due:'10.10',st:'work',src:'система'},
 {t:'Подготовить договор Камиле · Elementary',who:'Айгерим Н.',due:'19.09',st:'work',src:'адаптация'},
 {t:'Согласовать меню на октябрь с родителями',who:'Екатерина',due:'25.09',st:'new',src:'меню'},
 {t:'Ms. Anna не отметила выход 17.09 — уточнить',who:'Наталья',due:'сегодня',st:'late',src:'система'},
 {t:'Лист ожидания Toddler: 3 семьи — предложить развивашку',who:'Айгерим Н.',due:'20.09',st:'new',src:'воронка'}
];
const SC={};
const isOwner=()=>role==='Собственник';
const seeMoney=()=>['Собственник','Руководитель центра','Бухгалтер'].indexOf(role)>=0;
const tag=(t,c)=>`<span class="tag" style="background:${c}22;color:${c}">${esc(t)}</span>`;
const barHtml=(p,c)=>`<div class="bar"><i style="display:block;height:100%;width:${Math.min(100,Math.max(0,p))}%;background:${c||'var(--brand)'}"></i></div>`;

/* ====== ОБЩАЯ КАРТИНА ====== */
SC.dash=()=>{
 const kids=GROUPS.reduce((a,g)=>a+g.kids,0), cap=GROUPS.reduce((a,g)=>a+g.cap,0);
 return `<div class="hd"><div><h2>Общая картина · четверг, 18 сентября 2026</h2>
 <p>Ваши слова: «Чтобы всё было видно в одном месте, потому что сейчас информация разрозненна и в куче Excel-файлов». Дети, группы, кружки, оплаты, посещаемость сотрудников — здесь. Ничего не сводится руками.</p></div>
 <div class="btns"><button class="bt" onclick="go('today')">Что требует решения</button><button class="bt p" onclick="go('debtors')">Должники</button></div></div>
<div class="wid">
 <div><small>Детей в группах</small><b class="a">${kids}</b><span>из ${cap} мест · ещё 27 только кружки и логопед</span></div>
 <div><small>Записей на кружки</small><b>${CLUBS.reduce((a,c)=>a+c.kids,0)}</b><span>7 кружков и музыка</span></div>
 <div><small>Оплачено за сентябрь</small><b class="g">${Math.round(BILL.paid/BILL.charged*100)}%</b><span>${tg(BILL.paid)} из ${tg(BILL.charged)}</span></div>
 <div><small>Должников после 10-го</small><b class="r">${BILL.debtors}</b><span>${tg(BILL.debt)} · пеня ${tg(BILL.penalty)}</span></div>
 <div><small>Сотрудников на месте</small><b>19 из 21</b><span>по геолокации · 2 не отметились</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 4px">Группы и заполненность</h3>
  <p class="mini" style="margin:0 0 10px">Ваши цифры: Elementary 25 из 27, Toddler полный, Casa — набор идёт. Зелёное — есть места, красное — лист ожидания.</p>
  ${GROUPS.map(g=>`<div class="dl" style="--c:${g.kids>=g.cap?'var(--bad)':g.kids/g.cap>0.85?'var(--warn)':'var(--ok)'}" onclick="go('groups')">
   <div style="flex:1;min-width:0"><b>${esc(g.n)}</b><div class="mini">${esc(g.fmt)} · ${esc(g.t)} · ${esc(g.room)}</div></div>
   <div style="width:118px">${barHtml(g.kids/g.cap*100,g.kids>=g.cap?'var(--bad)':'var(--brand)')}<div class="mini" style="text-align:right;margin-top:3px">${g.kids} из ${g.cap}</div></div>
   <b class="mono" style="width:100px;text-align:right">${seeMoney()?tg(g.price)+'/мес':''}</b></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Набор · сентябрь</h3>
   <div class="kv"><span>Новых заявок</span><b>${LEADS.filter(l=>l.st==='lead').length+9}</b></div>
   <div class="kv"><span>Экскурсий назначено</span><b>${LEADS.filter(l=>l.st==='tour').length+2}</b></div>
   <div class="kv"><span>На пробных и адаптации</span><b>${LEADS.filter(l=>l.st==='trial'||l.st==='adapt').length}</b></div>
   <div class="kv"><span>Зачислено за месяц</span><b style="color:var(--ok)">6</b></div>
   <div class="kv" style="border:0"><span>Из Instagram-таргета</span><b>34%</b></div>
   <button class="bt p" style="width:100%;margin-top:10px" onclick="go('funnel')">Открыть воронку</button>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Сегодня</h3>
   <div class="kv"><span>Детей пришло</span><b>96 из 104 записанных</b></div>
   <div class="kv"><span>Пробный урок</span><b>Дмитрий · развивашка · 10:00</b></div>
   <div class="kv"><span>Кружков вечером</span><b>4 · 16:00–17:00</b></div>
   <div class="kv" style="border:0"><span>Не отметили выход</span><b style="color:var(--warn)">Ms. Anna, Бахыт О.</b></div>
  </div>
 </div>
</div>
<div class="said"><b>Что здесь главное для руководителя.</b> Вы сказали, что вам нужно показать шефу «что за эту цену мы получили сто процентов». Этот экран — ответ: набор, дети, кружки, оплаты, должники и сотрудники в одном месте, и каждая цифра кликается до ребёнка, квитанции или педагога.</div>`;
};

SC.today=()=>`<div class="hd"><div><h2>Что требует решения · 18 сентября</h2>
 <p>Список собирается из отклонений: должник после 10-го, заявка без ответа больше часа, сотрудник без отметки выхода, ребёнок без квитанции, свободное место в группе при листе ожидания. Если всё в порядке — пусто.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Нерешённое к вечеру уходит вам одним сообщением в WhatsApp.')">Разобрала</button></div></div>
<div class="g2">
 <div>
  <div class="tsk" style="--c:var(--bad)"><b>14 должников после 10-го · 2 410 000 ₸</b>
   <p class="mini" style="margin:5px 0 8px">Напоминания уходили каждый день с 1-го по 10-е. С 11-го начислена пеня по вашему правилу — 36 000 ₸. Ваши слова: «десятого числа открыла систему и вижу должников, связываюсь с проблемными». Трое из четырнадцати — постоянные.</p>
   <button class="bt p" onclick="go('debtors')">Открыть должников</button></div>
  <div class="tsk" style="--c:var(--warn)"><b>Айнур · заявка из Instagram 09:12 · без ответа 2 часа</b>
   <p class="mini" style="margin:5px 0 8px">Написала в WhatsApp, спросила цену Casa 3–6. Заявка в системе сразу, ответственная Айгерим. Если ответа нет час — поднимается сюда.</p>
   <button class="bt" onclick="go('leads')">Ответить из системы</button></div>
  <div class="tsk" style="--c:var(--warn)"><b>Ms. Anna и Бахыт О. не отметили выход</b>
   <p class="mini" style="margin:5px 0 8px">Английский в 16:00, шахматы в 16:00 — оба пришли, но не нажали «я здесь» по геолокации. Без отметки занятие не попадёт в их оплату за занятие.</p>
   <button class="bt" onclick="go('attstaff')">Посещаемость сотрудников</button></div>
 </div>
 <div>
  <div class="tsk" style="--c:var(--acc)"><b>Toddler полный · 3 семьи в листе ожидания</b>
   <p class="mini" style="margin:5px 0 8px">Ваши слова: «Toddler у нас полный». Три заявки ждут. Система предлагает развивашку утром — там 2 свободных места — и напомнит, когда в Toddler освободится место.</p>
   <button class="bt" onclick="toast('Трём семьям из листа ожидания предложена развивашка утро с переходом в Toddler при освобождении места. Сообщение ушло в WhatsApp из системы.')">Предложить развивашку</button></div>
  <div class="tsk" style="--c:var(--violet)"><b>Камила · адаптация день 8 из 10 · договор на подписи</b>
   <p class="mini" style="margin:5px 0 8px">Через два дня переходит в «зачислена». Квитанция за сентябрь посчитается пропорционально с даты зачисления.</p>
   <button class="bt" onclick="go('adapt')">Открыть адаптацию</button></div>
  <div class="tsk" style="--c:var(--acc)"><b>Меню на октябрь · согласование до 25.09</b>
   <p class="mini" style="margin:5px 0 8px">Черновик от повара загружен. Родителям — на голосование в кабинет, а не в чат.</p>
   <button class="bt" onclick="go('menu')">Меню</button></div>
  <div class="note" style="--tone:var(--brand)"><b>Откуда список</b><p class="mini" style="margin:5px 0 0">Никто его не составляет. Система сравнивает оплаты со сроком, заявки с временем ответа, расписание с отметками.</p></div>
 </div>
</div>`;

SC.reports=()=>`<div class="hd"><div><h2>Отчёты руководителю · сентябрь</h2>
 <p>Экран для шефа: что происходит с бизнесом в цифрах, без захода в детали. Каждая цифра кликается.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Отчёт за месяц в PDF: набор, заполненность, выручка по форматам и кружкам, должники, посещаемость, зарплата.')">PDF за месяц</button></div></div>
<div class="wid">
 <div><small>Выручка начислена</small><b class="a">${tg(BILL.charged)}</b><span>110 детей</span></div>
 <div><small>Собрано</small><b class="g">${tg(BILL.paid)}</b><span>${Math.round(BILL.paid/BILL.charged*100)}% · остальное после 10-го</span></div>
 <div><small>Фонд оплаты труда</small><b>${tg(9640000)}</b><span>21 сотрудник · 40% выручки</span></div>
 <div><small>Заполненность</small><b>${Math.round(GROUPS.reduce((a,g)=>a+g.kids,0)/GROUPS.reduce((a,g)=>a+g.cap,0)*100)}%</b><span>12 свободных мест</span></div>
 <div><small>Отток за месяц</small><b class="w">2 ребёнка</b><span>переезд · возраст</span></div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Выручка по форматам</h3>
  ${[['Elementary · 25',6250000],['Casa A + B · 32',6400000],['Toddler · 12',2640000],['Развивашки · 14',1260000],['Кружки и музыка',5210000],['Логопед · индивидуально',2080000]].map(([n,s])=>`<div class="fr" style="grid-template-columns:170px 1fr 110px"><span style="font-size:11px">${n}</span>${barHtml(s/6400000*100,'var(--brand)')}<b class="mono" style="text-align:right">${tg(s)}</b></div>`).join('')}
  <div class="hint"><b>Кружки — 22% выручки.</b> Ваши слова про факультативы «чтобы дети получали занятия здесь и не нужно было в пробках после четырёх часов» — это ещё и пятая часть дохода, которую сейчас считают руками первого числа.</div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Набор и отток</h3>
   <div class="kv"><span>Заявок за месяц</span><b>38</b></div>
   <div class="kv"><span>Экскурсий</span><b>17 · 45%</b></div>
   <div class="kv"><span>Пробных</span><b>11</b></div>
   <div class="kv"><span>Зачислено</span><b style="color:var(--ok)">6 · 16% от заявок</b></div>
   <div class="kv" style="border:0"><span>Ушло</span><b>2</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Куда расти · ваши слова</h3><p class="mini" style="margin:0">«Теоретически до двухсот можно, выходные не заняты, думаем о дополнительных продуктах, но очень много времени уходит на рутину». Отчёт показывает: свободных мест 12, выходные пустые, кружки — 22% выручки. Освободившееся от рутины время — на субботние продукты.</p></div>
 </div>
</div>`;

/* ====== ВОРОНКА ====== */
SC.funnel=()=>`<div class="hd"><div><h2>Воронка набора</h2>
 <p>Ваши стадии дословно: «новый лид, пришёл на экскурсию, пробный урок, адаптационный период и зачислен». Названия и порядок меняете сами — под каждый формат можно свою воронку.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Стадии редактируются: название, порядок, что обязательно при переходе (например, на «Зачислен» — договор и квитанция). Отдельная воронка для Elementary — кнопкой.')">Настроить стадии</button><button class="bt p" onclick="go('leads')">+ Заявка</button></div></div>
<div class="pipe" style="grid-auto-columns:minmax(210px,1fr)">${FST.map(([k,n])=>{const list=LEADS.filter(l=>l.st===k);return `<div><div class="phead" style="background:${k==='enrolled'?'var(--ok)':k==='adapt'?'var(--brand)':'var(--rail-h)'}">${n} · ${list.length}</div>
 <div class="pbody" style="background:var(--card2)">${list.map(l=>`<div class="pc" draggable="true" onclick="toast('Карточка: контакт, ребёнок, формат, источник, переписка WhatsApp, история стадий, кто ответственный. Напоминание «перезвонить» — отсюда.')"><b style="font-size:11.4px;display:block">${esc(l.n)}</b><div class="mini" style="margin-top:3px">${esc(l.fmt)} · ${esc(l.src)}</div><div class="mini" style="margin-top:2px;color:var(--muted2)">${esc(l.dt)}${l.wa?' · WhatsApp':''}</div></div>`).join('')}</div></div>`}).join('')}</div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Откуда приходят</h3>${Object.entries(SRC).map(([n,p])=>`<div class="kv" style="font-size:11px;padding:4px 0"><span>${n}</span><b>${p}%</b></div>`).join('')}</div>
 <div class="pan"><h3 style="margin:0 0 6px">Что обязательно при переходе</h3><p class="mini" style="margin:0">Экскурсия → пробный: дата и педагог. Пробный → адаптация: формат и группа с местом. Адаптация → зачислен: договор подписан, первая квитанция выставлена. Без этого карточку не перетащить.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Заявка → ребёнок</h3><p class="mini" style="margin:0">При зачислении карточка становится ребёнком в группе: родитель получает кабинет, квитанция за месяц считается пропорционально дате. Ничего не вводится второй раз.</p></div>
</div>`;

SC.leads=()=>`<div class="hd"><div><h2>Заявки и WhatsApp</h2>
 <p>Ваш вопрос: «Заявки с таргета приходят сразу в WhatsApp — как система будет брать эти контакты?» Ответ: WhatsApp подключён внутрь. Написала мама — карточка появилась сама, отвечает администратор отсюда же, переписка хранится в карточке.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Новая заявка вручную: кто позвонил или пришёл. Дальше — как из WhatsApp.')">+ Заявка</button></div></div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Сегодня и вчера</h3>
  ${LEADS.filter(l=>l.st==='lead'||l.st==='tour').map(l=>`<div class="dl" style="--c:${l.st==='lead'&&l.dt.indexOf('сегодня')>=0?'var(--warn)':'var(--acc)'}"><div style="flex:1"><b>${esc(l.n)}</b><div class="mini">${esc(l.fmt)} · ${esc(l.src)} · ${esc(l.dt)}${l.note?' · '+esc(l.note):''}</div></div>${l.wa?tag('WhatsApp','#25a55f'):tag('звонок','var(--muted)')}<button class="bt" onclick="waReply()">Ответить</button></div>`).join('')}
 </div>
 <div>
  <div class="pan" style="border-top:3px solid #25a55f"><h3 style="margin:0 0 8px">Переписка · Айнур</h3>
   <div class="msg" style="background:var(--card2);margin-bottom:6px">Здравствуйте! Увидела вас в Instagram. Дочке 3 года, сколько стоит группа полного дня?</div>
   <div class="msg" style="background:var(--brandl);margin:0 0 6px auto">Здравствуйте, Айнур! Casa 3–6 полного дня — 200 000 ₸ в месяц, с обедом и музыкой. Приглашаем на экскурсию — завтра в 10:00 или в понедельник в 11:00?</div>
   <div class="mini" style="margin-top:6px">Ответ ушёл из системы с рабочего номера. Заявка перешла на стадию «Экскурсия» при подтверждении времени.</div>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Белый и серый WhatsApp — как на встрече</h3><p class="mini" style="margin:0">Официальный WABA: рассылки согласуются, сообщение 15–60 ₸, но не блокируют. Через казахстанского провайдера ≈ 5 000 ₸ в месяц вместо 36 000. Спам-рассылок не делаем — отвечаем тем, кто написал сам, и шлём то, что ждут: квитанции, напоминания, посещаемость.</p></div>
 </div>
</div>`;

SC.trial=()=>`<div class="hd"><div><h2>Экскурсии и пробные уроки</h2>
 <p>Календарь экскурсий и пробных с привязкой к группе и педагогу. Родителю уходит подтверждение и напоминание за день; педагог видит, что завтра в группе гость.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Экскурсия назначена: 22.09 11:00, проводит Айгерим. Родителю — подтверждение в WhatsApp, за день — напоминание.')">+ Назначить</button></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Ближайшие</h3>
  ${[['18.09 10:00','Пробный · развивашка утро','Дмитрий (папа, 2,5 г.)','Динара Т.','сегодня'],['19.09 10:00','Экскурсия','Мадина (мама, 7 л.) · Elementary','Айгерим','подтверждено'],['19.09 15:00','Пробный · Casa A','Жанар (мама, 5 л.)','Мария К.','подтверждено'],['22.09 11:00','Экскурсия','Ольга (мама, 4 г.) · Casa','Айгерим','ждёт подтверждения']]
   .map(([d,k,who,t,s])=>`<div class="srow"><b class="mono" style="width:86px;font-size:10.6px">${d}</b><div style="flex:1"><b>${k}</b><div class="mini">${who} · ${t}</div></div>${tag(s,s==='сегодня'?'var(--warn)':s==='подтверждено'?'var(--ok)':'var(--muted)')}</div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Конверсия · квартал</h3>
   <div class="kv"><span>Заявка → экскурсия</span><b>45%</b></div>
   <div class="kv"><span>Экскурсия → пробный</span><b>65%</b></div>
   <div class="kv"><span>Пробный → адаптация</span><b>72%</b></div>
   <div class="kv" style="border:0"><span>Адаптация → зачислен</span><b style="color:var(--ok)">88%</b></div>
   <p class="mini" style="margin:8px 0 0">Самая слабая — первая: половина написавших не доходит до экскурсии. Обычно из-за скорости ответа. Теперь ответ без реакции час — поднимается руководителю.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">После пробного</h3><p class="mini" style="margin:0">Педагог ставит отметку «рекомендую / нужна адаптация дольше / не наш формат» — прямо после урока с телефона. Администратор видит и предлагает родителю следующий шаг в тот же день.</p></div>
 </div>
</div>`;

SC.adapt=()=>`<div class="hd"><div><h2>Адаптационный период</h2>
 <p>Ваша стадия между пробным и зачислением. Десять дней: короткие дни, заметки педагога родителю каждый день, договор к концу. Из адаптации ребёнок переходит в зачисленные без повторного ввода.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Параметры адаптации: длительность 10 дней, график сокращённых дней, обязательная заметка педагога. Настраивается по формату.')">Настроить</button></div></div>
<div class="g2">
 ${LEADS.filter(l=>l.st==='adapt').map(l=>{const d=+l.dt.match(/\d+/)[0];return `<div class="pan"><h3 style="margin:0 0 6px">${esc(l.n)} · ${esc(l.fmt)}</h3>
  ${barHtml(d/10*100,'var(--brand)')}<div class="mini" style="margin:4px 0 9px">день ${d} из 10 · ${esc(l.note)}</div>
  <div class="tl">
   <div class="tli"><b style="font-size:11.6px">День ${d} · педагог</b><p class="mini" style="margin:2px 0 0">${d>5?'Остаётся на полный день, участвует в круге, ест самостоятельно.':'Три часа, играла в среде, немного скучала по маме к обеду.'}</p></div>
   <div class="tli"><b style="font-size:11.6px">День ${d-1} · родителю</b><p class="mini" style="margin:2px 0 0">Заметка и фото ушли в кабинет и WhatsApp в 16:10.</p></div>
  </div>
  <div style="margin-top:9px">${d>=8?'<button class="bt p" onclick="toast(\'Переведена в «Зачислен»: договор загружен, группа Elementary, квитанция за сентябрь пропорционально с 22.09 — 75 000 ₸. Родителю — кабинет и квитанция.\')">Зачислить</button>':'<button class="bt" onclick="toast(\'Заметка родителю отправлена.\')">Заметка родителю</button>'}</div></div>`}).join('')}
</div>
<div class="said"><b>Зачем это как отдельная стадия.</b> Родитель в адаптации решает, остаётся ли. Ежедневная заметка педагога из системы — то, что удерживает: мама видит, что ребёнка заметили. Сейчас это зависит от того, вспомнил ли педагог написать в WhatsApp.</div>`;
/* ====== ДЕТИ ====== */
SC.kids=()=>`<div class="hd"><div><h2>Дети · 110</h2>
 <p>Карточка ребёнка: группа, кружки, родители, договор, посещаемость, квитанции и баланс. Ваши слова: «консолидировала информацию о детях» — всё, что сейчас в разных Excel-файлах, в одной карточке.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Выгрузка списка детей с группами, кружками и балансами в Excel.')">В Excel</button><button class="bt p" onclick="go('funnel')">+ Ребёнок через воронку</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['РЕБЁНОК','ВОЗРАСТ','ГРУППА','КРУЖКИ','РОДИТЕЛЬ','С','БАЛАНС'].map((h,i)=>`<th style="text-align:${i>=6?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${KIDS.map((k,i)=>`<tr style="cursor:pointer" onclick="curKid=${i};go('parent')"><td style="padding:8px"><b>${esc(k.n)}</b></td><td class="mono" style="padding:8px">${k.age}</td><td style="padding:8px">${esc(G(k.g).n.split(' · ')[0])}</td><td style="padding:8px;color:var(--muted)">${k.clubs.join(', ')||'—'}</td><td style="padding:8px">${esc(k.par)}<div class="mini">${k.phone}</div></td><td class="mono" style="padding:8px">${k.since}</td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:700;color:${k.bal<0?'var(--bad)':'var(--ok)'}">${k.bal<0?'долг '+tg(-k.bal):'оплачено'}</td></tr>`).join('')}
 <tr><td colspan="7" style="padding:8px;color:var(--muted)">+ ещё 102 ребёнка</td></tr></tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Что в карточке</h3><p class="mini" style="margin:0">Группа и формат, кружки с датами записи и отписки, родители и их телефоны, договор, медкарта и аллергии для повара, посещаемость, все квитанции и оплаты, заметки педагогов.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Кружки с датами</h3><p class="mini" style="margin:0">Записали на шахматы 12-го — в квитанции за месяц шахматы пропорционально. Отписали 20-го — тоже. Первого числа бухгалтер ничего не проверяет руками: система знает, кто на что записан на каждый день.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Братья и сёстры</h3><p class="mini" style="margin:0">Один родитель — несколько детей — одна квитанция с разбивкой и семейной скидкой, если она у вас есть.</p></div>
</div>`;

SC.groups=()=>`<div class="hd"><div><h2>Группы и форматы</h2>
 <p>Ваши форматы: Toddler 1,5–3, две группы Casa 3–6, Elementary 1–4 класс, развивашки. У каждой — вместимость, педагог, помещение, тариф. Новый формат — субботний, о котором вы думаете — добавляется кнопкой.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новая группа: формат, возраст, вместимость, педагог, помещение, дни и часы, тариф. Например «Суббота · творческая мастерская» — ваши слова про незанятые выходные.')">+ Группа</button></div></div>
<div class="g2">${GROUPS.map(g=>`<div class="pan"><h3 style="margin:0 0 6px">${esc(g.n)}</h3>
 <div class="kv"><span>Формат</span><b>${esc(g.fmt)}</b></div>
 <div class="kv"><span>Детей</span><b style="color:${g.kids>=g.cap?'var(--bad)':'inherit'}">${g.kids} из ${g.cap}${g.kids>=g.cap?' · лист ожидания 3':''}</b></div>
 <div class="kv"><span>Педагог</span><b>${esc(g.t)}</b></div>
 <div class="kv"><span>Помещение</span><b>${esc(g.room)}</b></div>
 ${seeMoney()?`<div class="kv" style="border:0"><span>Тариф</span><b class="mono">${tg(g.price)} / мес</b></div>`:''}
 </div>`).join('')}</div>
<div class="said"><b>Ваши слова:</b> «Два двухэтажных здания, полторы-две тысячи квадратов, до двухсот детей теоретически». Свободных мест сейчас 12, помещения развивашек можно уплотнить по времени. Система показывает, где ёмкость есть, — решение о новых группах принимаете вы.</div>`;

SC.clubs=()=>`<div class="hd"><div><h2>Кружки и музыка</h2>
 <p>Ваши слова: «Есть занятия, по которым мы не проводим перерасчёт, и есть, по которым проводим». У каждого кружка признак: перерасчёт по посещаемости или фиксированная оплата. Из этого — квитанция.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новый кружок: название, педагог, дни, время, тариф, признак перерасчёта, вместимость. Появится в расписании и в записи для родителей.')">+ Кружок</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['КРУЖОК','ДНИ','ВРЕМЯ','ПЕДАГОГ','ДЕТЕЙ','ТАРИФ','ПЕРЕРАСЧЁТ'].map((h,i)=>`<th style="text-align:${i>=4?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${CLUBS.map(c=>`<tr><td style="padding:8px"><b>${esc(c.n)}</b></td><td style="padding:8px">${c.days}</td><td class="mono" style="padding:8px">${c.time}</td><td style="padding:8px">${esc(c.t)}</td><td class="mono" style="text-align:right;padding:8px">${c.kids}</td><td class="mono" style="text-align:right;padding:8px">${seeMoney()?tg(c.price)+(c.per?' / '+c.per:' / мес'):'—'}</td><td style="text-align:right;padding:8px">${c.recalc?tag('по посещаемости','var(--acc)'):tag('фикс','var(--muted)')}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Как работает перерасчёт</h3><p class="mini" style="margin:0">Английский — по посещаемости: 8 занятий в месяце, ребёнок был на 6, в квитанции 6/8 тарифа. Робототехника — фикс: пропуски не пересчитываются. Признак ставите вы по каждому кружку, и он же определяет, какой лист посещаемости к нему относится.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Музыка в течение дня</h3><p class="mini" style="margin:0">Ваши слова: «музыкальное направление проходит в течение дня». Музыка привязана к группе, не к вечернему слоту: педагог отмечает по группам, тариф в квитанции отдельной строкой — как вы и пишете сейчас родителям.</p></div>
</div>`;

SC.schedule=()=>`<div class="hd"><div><h2>Расписание · четверг</h2>
 <p>Ваши слова: «Педагоги заполняют расписание и дают мне готовые слоты, я в эти слоты распределяю учеников сама». Здесь педагог ставит свои слоты, вы распределяете детей, конфликтов по помещениям и педагогам система не допускает.</p></div>
 <div class="btns"><div class="ptabs" style="margin:0"><button class="ptab on">Четверг</button><button class="ptab" onclick="toast('Расписание недели по группам, кружкам, педагогам и помещениям.')">Неделя</button><button class="ptab" onclick="toast('По педагогу: Ms. Anna — вторник и четверг 16:00–16:45, две группы английского.')">По педагогу</button></div></div></div>
<div class="pan" style="overflow-x:auto"><div style="display:grid;grid-template-columns:80px repeat(5,1fr);gap:6px;min-width:820px">
 <div></div>${['Toddler','Casa A','Casa B','Elementary','Развивашка'].map(g=>`<div class="mini" style="font-weight:800;text-align:center;padding:4px;border-bottom:2px solid var(--line)">${g}</div>`).join('')}
 ${[['08:00',['приём','приём','приём','урок 1','—']],['09:30',['среда','среда · музыка','среда','урок 2','развивашка утро']],['12:00',['обед · сон','обед','обед','обед','—']],['14:00',['прогулка','среда','среда · музыка','урок 4','—']],['16:00',['уход','английский · Ms. Anna','шахматы · Бахыт','робототехника · Тимур','развивашка вечер']],['17:00',['—','уход','уход','уход','уход']]]
  .map(([t,cells])=>`<div style="font-size:11px;font-weight:700;padding:8px 4px" class="mono">${t}</div>`+cells.map(c=>`<div style="padding:7px 8px;border-radius:5px;font-size:10.4px;min-height:40px;background:${c==='—'?'var(--card2)':c.indexOf('·')>=0?'var(--brandl)':'var(--card2)'};color:${c==='—'?'var(--muted2)':'inherit'};border:1px solid var(--line)">${c}</div>`).join('')).join('')}
</div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Слоты педагогов</h3><p class="mini" style="margin:0">Ms. Anna отметила: вторник и четверг с 16:00. Система показала свободные слоты — вы поставили две группы английского. Если педагог заболел — дети и родители получают уведомление, кружок переносится без обзвона.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Помещения</h3><p class="mini" style="margin:0">Зал в здании 1 занят развивашкой утром и вечером; днём свободен — туда можно поставить хореографию вместо аренды. Расписание помещений — тот же экран, другой фильтр.</p></div>
</div>`;

SC.calendar=()=>`<div class="hd"><div><h2>Календарь центра · сентябрь – октябрь</h2>
 <p>Праздники, каникулы, родительские собрания, мероприятия. Каникулы влияют на квитанции: дни без занятий не начисляются в форматах с перерасчётом.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Событие: дата, кому (все / формат / группа), уведомление родителям в кабинет и WhatsApp.')">+ Событие</button></div></div>
<div class="pan">
 ${[['25.09','Родительское собрание · Elementary','18:00 · здание 2','все родители Elementary'],['01.10','Каникулы Elementary · 1 неделя','01–05.10','Elementary · в квитанции не начисляется'],['10.10','Осенний праздник','16:00 · зал','все группы · родители приглашены'],['15.10','Открытый урок · музыка','10:30','Casa A и B'],['25.10','День рождения центра','12:00','все']]
  .map(([d,t,w,to])=>`<div class="srow"><b class="mono" style="width:44px;font-size:10.6px">${d}</b><div style="flex:1"><b>${t}</b><div class="mini">${w} · ${to}</div></div><button class="bt" onclick="toast('Уведомление ушло родителям в кабинет и WhatsApp. Кто открыл — видно.')">Уведомить</button></div>`).join('')}
</div>
<div class="hint"><b>Каникулы и квитанция.</b> Неделя каникул Elementary с 1 по 5 октября: в квитанции за октябрь начисляется 3 недели вместо 4, если у вас так принято. Правило — ваше; система применит его ко всем 25 детям, а не бухгалтер к каждому.</div>`;

/* ====== ПОСЕЩАЕМОСТЬ ДЕТЕЙ ====== */
SC.att=()=>`<div class="hd"><div><h2>Посещаемость детей · четверг, 18 сентября</h2>
 <p>Ваши слова: «Три отдельные задачи: занятия без перерасчёта, занятия с перерасчётом, и лист посещаемости для учёта времени сотрудника». Здесь один экран, а листы разные: по группе, по кружку, по педагогу.</p></div>
 <div class="btns"><div class="ptabs" style="margin:0"><button class="ptab on">Группы</button><button class="ptab" onclick="toast('Лист по кружкам: английский 16:00 — 12 из 14, шахматы — 9 из 10. Только кружки с перерасчётом влияют на квитанцию.')">Кружки</button><button class="ptab" onclick="toast('Лист по педагогу: сколько детей было у Ms. Anna в каждом занятии — для её оплаты за занятие.')">По педагогу</button></div></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Записано на сегодня</small><b class="a">104</b><span>6 предупредили об отсутствии</span></div>
 <div><small>Пришли</small><b class="g">96</b><span>92%</span></div>
 <div><small>Без предупреждения</small><b class="w">8</b><span>родителям ушло «всё в порядке?»</span></div>
 <div><small>Отметили педагоги</small><b>5 из 6 групп</b><span>развивашка вечер — в 16:00</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['ГРУППА','ЗАПИСАНО','ПРИШЛИ','ПРЕДУПРЕДИЛИ','БЕЗ ПРЕДУПРЕЖДЕНИЯ','ОТМЕТИЛ','ВРЕМЯ'].map((h,i)=>`<th style="text-align:${i>0&&i<5?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['Toddler',12,11,1,0,'Асель Р.','08:40'],['Casa A',18,17,0,1,'Мария К.','08:35'],['Casa B',14,13,1,0,'Жанна С.','08:50'],['Elementary',25,22,2,1,'Ольга В.','08:20'],['Развивашка утро',8,7,1,0,'Динара Т.','09:45'],['Развивашка вечер',6,'—','—','—','—','ждёт']]
  .map(r=>`<tr><td style="padding:8px"><b>${r[0]}</b></td><td class="mono" style="text-align:right;padding:8px">${r[1]}</td><td class="mono" style="text-align:right;padding:8px;font-weight:700">${r[2]}</td><td class="mono" style="text-align:right;padding:8px">${r[3]}</td><td class="mono" style="text-align:right;padding:8px;color:${r[4]&&r[4]!=='—'?'var(--warn)':'inherit'}">${r[4]}</td><td style="padding:8px">${r[5]}</td><td class="mono" style="padding:8px">${r[6]}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Два листа из одной отметки</h3><p class="mini" style="margin:0">Педагог ставит галочку один раз. Из неё — лист для родителей (влияет на квитанцию там, где перерасчёт) и лист для табеля (сколько детей было у педагога, если он на оплате за занятие или за ребёнка). Это ваши «три задачи» одним действием.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Родителю — сразу</h3><p class="mini" style="margin:0">Отметили «пришёл» — маме в кабинет и WhatsApp. Не пришёл без предупреждения — «всё в порядке?» через 30 минут. Это то, что вы называли «автоматические сообщения родителям».</p></div>
</div>`;

SC.teacher=()=>`<div class="hd"><div><h2>Экран педагога · телефон</h2>
 <p>Ваши слова: «У преподавателя отдельный интерфейс — только то, что им нужно». Своя группа, свои кружки, отметить пришёл / не пришёл, заметка родителю, свой выход по геолокации. Ни оплат, ни чужих групп.</p></div>
 <div class="btns"><button class="bt" onclick="go('attstaff')">Геолокация →</button></div></div>
<div style="display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start">
 <div class="phone">
  <div style="background:var(--rail);color:#fff;padding:13px 15px">
   <div style="font-size:9.6px;color:#8fa3b0;letter-spacing:.08em">ЧЕТВЕРГ, 18 СЕНТЯБРЯ · 08:35</div>
   <b style="font-size:14px;display:block;margin-top:3px">Casa A · Мария К.</b>
   <div style="font-size:10.4px;color:#a9bcc8;margin-top:2px">18 детей · музыка в 09:30 · английский в 16:00</div>
  </div>
  <div style="padding:13px">
   <div style="background:var(--ok-l);border-radius:6px;padding:8px 11px;margin-bottom:10px"><div class="mini" style="color:var(--ok);font-weight:700">✓ Вы на месте · 08:12 · геолокация подтверждена</div></div>
   ${[['Алан Д.',1],['Амина С.',1],['Арсен Б.',0],['Даниял К.',1],['Ева М.',1],['Камила Р.',1]].map(([n,p])=>`<div class="kv" style="font-size:11.4px;padding:7px 0"><span>${n}</span><span><button class="bt" style="padding:4px 9px;${p?'background:var(--ok);color:#fff':''}" onclick="toast('Отмечено. Родителю ушло «Алан в группе, 08:36».')">✓</button> <button class="bt" style="padding:4px 9px;${!p?'background:var(--bad);color:#fff':''}" onclick="toast('Отмечено «не пришёл». Через 30 минут родителю уйдёт «всё в порядке?», если он не предупреждал.')">×</button></span></div>`).join('')}
   <div class="mini" style="margin-top:6px;color:var(--muted2)">+ ещё 12</div>
   <button class="bt p" style="width:100%;padding:11px;margin-top:10px" onclick="toast('Заметка родителю: текст и фото. Уйдёт в кабинет и WhatsApp Даны в 16:00 одним сообщением вместе с посещаемостью.')">Заметка родителю</button>
  </div>
 </div>
 <div style="flex:1;min-width:330px">
  <div class="pan"><h3 style="margin:0 0 8px">Чего здесь нет</h3>
   <div class="li"><b style="color:var(--bad)">×</b><div><b style="font-size:11.6px">Оплат и балансов</b><div class="mini">педагог не видит, кто должен, и не участвует в этом разговоре</div></div></div>
   <div class="li"><b style="color:var(--bad)">×</b><div><b style="font-size:11.6px">Чужих групп</b><div class="mini">только своя группа и свои кружки</div></div></div>
   <div class="li"><b style="color:var(--bad)">×</b><div><b style="font-size:11.6px">Телефонов родителей</b><div class="mini">общение — через чат в системе, номера не раздаются</div></div></div>
   <div class="li" style="border:0"><b style="color:var(--ok)">✓</b><div><b style="font-size:11.6px">Своя посещаемость и оплата</b><div class="mini">выходы по геолокации, занятия, начисление — своя строка</div></div></div>
  </div>
  <div class="said"><b>Ваши слова:</b> «Педагоги заполняют расписание и дают мне готовые слоты». Педагог ставит свободные слоты в этом же телефоне — вы распределяете детей у себя.</div>
 </div>
</div>`;

/* ====== ПОСЕЩАЕМОСТЬ СОТРУДНИКОВ · ГЕОЛОКАЦИЯ ====== */
SC.attstaff=()=>`<div class="hd"><div><h2>Посещаемость сотрудников · геолокация</h2>
 <p>Ваши слова: «Я хочу, чтобы посещаемость сотрудников была привязана к геолокации. У них нет рабочих телефонов, отмечаются со своих личных — если они не здесь, никак не смогут отметить». Радиус 50 метров вокруг центра, отметка с телефона.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Настройки античита: радиус 50 м, запрет отметки при выключенной геолокации, фото при первой отметке дня — по желанию, журнал устройств. Ваш пример с «возьми мой телефон и нажми» закрывается тем, что отметка привязана к устройству и к лицу — второй телефон на одном аккаунте не пройдёт.')">Античит</button><button class="bt p" onclick="toast('Табель за сентябрь по геолокации выгружен: выходы, часы, занятия — основа зарплаты.')">Табель</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>На месте сейчас</small><b class="a">19 из 21</b><span>по геолокации</span></div>
 <div><small>Не отметились</small><b class="w">2</b><span>Ms. Anna, Бахыт О. · приходят к 16:00</span></div>
 <div><small>Опоздания за месяц</small><b>7</b><span>у 3 сотрудников</span></div>
 <div><small>Отметок вне радиуса</small><b class="g">0</b><span>отклонено системой: 2</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['СОТРУДНИК','ДОЛЖНОСТЬ','ОПЛАТА','СЕГОДНЯ','ВЫХОДОВ · МЕСЯЦ','ПО ГРАФИКУ','СТАТУС'].map((h,i)=>`<th style="text-align:${i>=3?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${STAFF.map(s=>`<tr><td style="padding:8px"><b>${esc(s.n)}</b></td><td style="padding:8px;color:var(--muted)">${esc(s.pos)}</td><td style="padding:8px">${tag(s.type,s.type==='оклад'?'var(--muted)':'var(--acc)')}</td>
  <td class="mono" style="text-align:right;padding:8px;color:${s.geo==='—'?'var(--warn)':'var(--ok)'}">${s.geo==='—'?'нет отметки':s.geo}</td><td class="mono" style="text-align:right;padding:8px">${s.out}</td><td class="mono" style="text-align:right;padding:8px;color:var(--muted)">${s.plan}</td>
  <td style="text-align:right;padding:8px">${s.out<s.plan?tag('пропуск '+(s.plan-s.out),'var(--warn)'):tag('все','var(--ok)')}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Как это выглядит у сотрудника</h3><p class="mini" style="margin:0">Открыл значок на телефоне — одна кнопка «Я на месте». Телефон отдаёт геолокацию; если она дальше 50 метров или выключена — кнопка не работает и пишет почему. Уход — та же кнопка вечером. Лог хранится: дата, время, координаты, устройство.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Разные тарифы — как вы просили</h3><p class="mini" style="margin:0">Оклад, за выход, почасовая, за занятие, за ребёнка на занятии. Динара — 12 000 за выход, 13 выходов — 156 000. Ms. Anna — за занятие, а занятие засчитывается только при отметке на месте. Ваши слова: «тарифицировать отдельно» — это оно.</p></div>
</div>`;
/* ====== НАЧИСЛЕНИЯ 1-ГО ЧИСЛА ====== */
SC.bill=()=>`<div class="hd"><div><h2>Начисления 1-го числа · сентябрь</h2>
 <p>Ваши слова: «Наступило первое число — всем родителям пришли расчётные квитанции со ссылочкой». Здесь то, что сейчас бухгалтер делает руками: собирает группу, кружки и музыку по каждому ребёнку, считает и пишет в WhatsApp ста родителям. Одна кнопка.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Предпросмотр: 110 квитанций, 23 840 000 ₸. По каждой видно строки: группа, кружки с датами записи, музыка, логопед по занятиям, каникулы, скидки. Проверить можно до отправки.')">Проверить</button><button class="bt p" onclick="billRun()">Начислить и отправить · 1 октября</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Квитанций</small><b class="a">${BILL.kids}</b><span>по 110 детям · 94 родителям</span></div>
 <div><small>Начислено</small><b>${tg(BILL.charged)}</b><span>группы, кружки, музыка</span></div>
 <div><small>Отправлено 1-го</small><b class="g">110 · 09:00</b><span>кабинет + WhatsApp + e-mail</span></div>
 <div><small>Оплачено к 10-му</small><b>81%</b><span>${tg(BILL.paid)}</span></div>
 <div><small>Время бухгалтера</small><b class="g">0 часов</b><span>раньше — два дня</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Квитанция · Амина С. · сентябрь</h3>
  <table class="t" style="font-size:11.4px">
   <thead><tr style="border-bottom:1.5px solid var(--line2)">${['СТРОКА','ОСНОВАНИЕ','СУММА'].map((h,i)=>`<th style="text-align:${i==2?'right':'left'};padding:7px 8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
   <tbody>${[['Casa A · полный день','тариф 200 000, полный месяц',200000],['Музыка','в группе, Пн Ср Пт',25000],['Хореография','Пн Пт · перерасчёт: 7 из 8 в августе → +2 750',22000],['Английский','Вт Чт · перерасчёт: 8 из 8',30000],['Перерасчёт за август','хореография −1 занятие',-2750]]
    .map(([n,b,s])=>`<tr><td style="padding:7px 8px"><b>${n}</b></td><td style="padding:7px 8px;color:var(--muted)">${b}</td><td class="mono" style="text-align:right;padding:7px 8px;${s<0?'color:var(--ok)':''}">${s<0?'−':''}${tg(Math.abs(s))}</td></tr>`).join('')}</tbody>
   <tfoot><tr style="border-top:1.5px solid var(--line2);font-weight:800"><td colspan="2" style="padding:8px">К оплате до 10 сентября</td><td class="mono" style="text-align:right;padding:8px;font-size:13px">${tg(274250)}</td></tr></tfoot>
  </table>
  <div class="mini" style="margin-top:8px">Отправлена 01.09 09:00 в кабинет, WhatsApp и на e-mail. Ссылка на оплату в приложении банка. Открыта 01.09 09:14. <b style="color:var(--bad)">Не оплачена — 18 дней, пеня 0,5% в день с 11-го.</b></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Что система знает без бухгалтера</h3>
   <div class="li"><b style="color:var(--brand)">→</b><div><b style="font-size:11.6px">На что записан каждый ребёнок</b><div class="mini">группа, кружки с датами, музыка — из карточки</div></div></div>
   <div class="li"><b style="color:var(--brand)">→</b><div><b style="font-size:11.6px">Что пересчитать</b><div class="mini">только кружки с признаком перерасчёта, по листу посещаемости</div></div></div>
   <div class="li"><b style="color:var(--brand)">→</b><div><b style="font-size:11.6px">Каникулы и даты</b><div class="mini">зачислен 22-го — пропорционально; каникулы — не начисляются</div></div></div>
   <div class="li" style="border:0"><b style="color:var(--brand)">→</b><div><b style="font-size:11.6px">Кому отправить</b><div class="mini">родителю по WhatsApp-номеру из регистрации; братья — одна квитанция</div></div></div>
  </div>
  <div class="said"><b>Ваши слова:</b> «Если родитель поздно написал — у нас уже неправильная картина мира». Записал ребёнка на кружок 28-го — это в карточке, и квитанция 1-го уже это учтёт. Человеческий фактор убран не дисциплиной, а тем, что данные вносятся в момент события.</div>
 </div>
</div>`;

SC.invoices=()=>`<div class="hd"><div><h2>Квитанции и напоминания</h2>
 <p>Ваши слова: «Автоматические уведомления о необходимости оплаты каждый день до момента оплаты». С 1-го по 10-е — мягкое напоминание раз в день тем, кто не оплатил; после 10-го — с суммой пени. Оплатил — напоминания прекращаются сами.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Тексты напоминаний: три шаблона — 1-е число, ежедневное до 10-го, после 10-го с пеней. Редактируете сами. Время отправки — 09:00.')">Шаблоны</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Отправлено 1-го</small><b class="a">110</b><span>открыли 104 в первый день</span></div>
 <div><small>Оплатили до 10-го</small><b class="g">89</b><span>81%</span></div>
 <div><small>Напоминаний ушло</small><b>412</b><span>за 18 дней · 0 руками</span></div>
 <div><small>Осталось должников</small><b class="r">14</b><span>получают ежедневно с пеней</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Как это выглядит у родителя · WhatsApp</h3>
  <div class="msg" style="background:var(--card2);margin-bottom:6px;max-width:92%"><b>1 сентября, 09:00.</b> Здравствуйте, Дана! Квитанция за сентябрь для Алана: Casa A 200 000 ₸, музыка 25 000 ₸, английский 30 000 ₸. Итого 255 000 ₸ до 10 сентября. Оплатить: [ссылка] · Квитанция в кабинете: [ссылка]</div>
  <div class="msg" style="background:var(--card2);margin-bottom:6px;max-width:92%"><b>6 сентября, 09:00.</b> Напоминаем: квитанция за сентябрь для Алана — 255 000 ₸ до 10 сентября. Оплатить: [ссылка]</div>
  <div class="msg" style="background:var(--ok-l);margin-bottom:6px;max-width:92%"><b>8 сентября, 14:22.</b> Оплата 255 000 ₸ получена. Спасибо! Квитанция закрыта.</div>
  <div class="msg" style="background:var(--warn-l);max-width:92%"><b>Если не оплачено · 11 сентября, 09:00.</b> Квитанция за сентябрь для Амины не оплачена: 274 250 ₸. С 11 сентября начисляется пеня 0,5% в день. Пожалуйста, оплатите: [ссылка]. Вопросы — администратору в чате.</div>
  <p class="mini" style="margin:9px 0 0">Ваши слова: «Мне даже раз в день не нужно будет — если стоит автоматическая напоминалка, я буду просто десятого проверять». Так и есть.</p>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Способы оплаты</h3>
   <div class="kv"><span>По ссылке в приложении банка</span><b>61%</b></div>
   <div class="kv"><span>Картой на месте</span><b>22%</b></div>
   <div class="kv"><span>Перевод по счёту</span><b>11%</b></div>
   <div class="kv" style="border:0"><span>Наличными</span><b>6% · отмечает бухгалтер</b></div>
   <p class="mini" style="margin:8px 0 0">Ваши слова: «работаем только официально». Все четыре пути — в одну квитанцию; наличные и перевод отмечаются вручную, остальное — по выписке.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Раз в сутки — не раз в секунду</h3><p class="mini" style="margin:0">Как договорились: выписка банка загружается раз в сутки, оплаты сверяются с квитанциями по назначению платежа и сумме. Родитель, оплативший в 14:22, увидит «оплачено» на следующее утро — вы сказали, что «живое в разрезе 30 секунд не нужно».</p></div>
 </div>
</div>`;

SC.debtors=()=>`<div class="hd"><div><h2>Должники и пеня · 18 сентября</h2>
 <p>Ваши слова: «Десятого числа открыла систему и вижу должников, чтобы я не могла проверить, кто мне должен, и им напомнить». Здесь список после 10-го с пеней по вашему правилу и историей напоминаний по каждому.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Правило пени: 0,5% в день с 11-го числа, не более 10% от суммы. Или без пени — как решите. Ваш вопрос «можно ли сразу начислять автоматически» — да, и правило ваше.')">Правило пени</button><button class="bt p" onclick="toast('Персональное сообщение трём постоянным должникам отправлено от вашего имени. Остальные 11 продолжают получать ежедневные напоминания.')">Связаться с проблемными</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Должников</small><b class="r">${BILL.debtors}</b><span>из 110</span></div>
 <div><small>Сумма долга</small><b>${tg(BILL.debt)}</b><span>10% от начислений</span></div>
 <div><small>Пеня начислена</small><b class="w">${tg(BILL.penalty)}</b><span>0,5% в день с 11-го</span></div>
 <div><small>Постоянных</small><b>3</b><span>третий месяц подряд</span></div>
</div>
<div class="pan">${[['Амина С.','Сауле С.',274250,8,'3-й месяц подряд · открывает, не платит'],['Арсен Б.','Айгуль Б.',222000,8,'2-й раз · обычно платит 15-го'],['Мирас Т.','Айдана Т.',60000,8,'частично: 220 000 оплачено, логопед — нет'],['Дамир К.','Ерлан К.',250000,8,'впервые · не открыл ни одну квитанцию'],['Алина Ж.','Мадина Ж.',200000,8,'написала в чат: оплатит 20-го']]
  .map(([k,p,s,d,n])=>`<div class="dl" style="--c:${n.indexOf('3-й')>=0?'var(--bad)':'var(--warn)'}"><div style="flex:1"><b>${k}</b> <span class="mini">· ${p}</span><div class="mini">${n}</div></div><b class="mono" style="width:110px;text-align:right">${tg(s)}</b><span class="mini" style="width:90px;text-align:right">пеня ${tg(Math.round(s*0.005*d))}</span><button class="bt" onclick="toast('Открыт чат с родителем в системе. История напоминаний: 1, 2, 3 … 18 сентября — все доставлены и открыты.')">Написать</button></div>`).join('')}
 <div class="mini" style="padding:8px 4px 0">+ ещё 9 должников</div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Что делать с постоянными</h3><p class="mini" style="margin:0">Три семьи — третий месяц подряд платят после 15-го. Это не забывчивость — это привычка. Система показывает это, а решение (предоплата, разговор, пеня) — за вами. Раньше это было видно только бухгалтеру, и то не сразу.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Дамир К. — не открыл ни одной квитанции</h3><p class="mini" style="margin:0">Возможно, сменился номер. Система подсвечивает «не доставлено / не открыто» отдельно от «открыл и не платит» — это разные разговоры.</p></div>
</div>`;

SC.bank=()=>`<div class="hd"><div><h2>Выписка банка · сверка</h2>
 <p>Как договорились на встрече: банк даёт выписку раз в сутки, система загружает её и сверяет с квитанциями по назначению платежа, сумме и телефону. 1С не нужна — данные хранятся здесь.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Выписка за 17.09 загружена: 23 платежа, 21 сверен автоматически, 2 требуют внимания — сумма не совпала с квитанцией.')">Загрузить выписку</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Платежей за 17.09</small><b class="a">23</b><span>${tg(4870000)}</span></div>
 <div><small>Сверено автоматически</small><b class="g">21</b><span>91%</span></div>
 <div><small>Требуют внимания</small><b class="w">2</b><span>сумма не совпала</span></div>
 <div><small>Не найден плательщик</small><b>0</b><span>по телефону в назначении</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.4px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['ДАТА','ПЛАТЕЛЬЩИК','НАЗНАЧЕНИЕ','СУММА','КВИТАНЦИЯ','СВЕРКА'].map((h,i)=>`<th style="text-align:${i===3?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['17.09','Дана Д.','Алан, сентябрь',255000,'КВ-2026-09-014 · 255 000','ok'],['17.09','Ольга Л.','образовательные услуги',315000,'КВ-2026-09-031 · 315 000','ok'],['17.09','Айдана Т.','Мирас, группа',220000,'КВ-2026-09-052 · 280 000','part'],['17.09','Карина К.','',245000,'КВ-2026-09-008 · 245 000','ok'],['17.09','Наталья Н.','София + Максим',530000,'КВ-2026-09-041 · 530 000 · 2 ребёнка','ok'],['17.09','ИП Сериков','за ребёнка',200000,'не найдена · сумма 250 000 у Дамира К.?','q']]
  .map(([d,p,n,s,q,st])=>`<tr><td class="mono" style="padding:8px">${d}</td><td style="padding:8px"><b>${p}</b></td><td style="padding:8px;color:var(--muted)">${n||'—'}</td><td class="mono" style="text-align:right;padding:8px">${tg(s)}</td><td style="padding:8px">${q}</td><td style="padding:8px">${st==='ok'?tag('сверено','var(--ok)'):st==='part'?tag('частично · 60 000 долг','var(--warn)'):tag('уточнить','var(--bad)')}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Как сверяет</h3><p class="mini" style="margin:0">По назначению платежа (имя ребёнка), по телефону плательщика из регистрации, по сумме квитанции. Три совпадения — автоматически. Одно-два — предлагает бухгалтеру вариант. Ноль — в список «уточнить». Через месяц автоматически сверяется 95%.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Почему без 1С — как договорились</h3><p class="mini" style="margin:0">Вы сказали: «1С не нужна». Система хранит квитанции, оплаты и сверку сама; бухгалтеру для отчётности — выгрузка в Excel за период. Если 1С понадобится позже — интеграция 800 000 ₸ отдельно, но пока нет причин.</p></div>
</div>`;

/* ====== КАБИНЕТ РОДИТЕЛЯ ====== */
SC.parent=()=>{const k=KIDS[curKid]||KIDS[0],g=G(k.g);return `<div class="hd"><div><h2>Кабинет родителя · ${esc(k.par)} · ${esc(k.n)}</h2>
 <p>Ваши слова: «Родители должны во внутреннем чате общаться, тогда вы коммуникацию полностью контролируете». Кабинет — то место, куда приходит всё: квитанция, посещаемость, заметки педагога, меню, чат. Открывается с телефона по ссылке из WhatsApp.</p></div>
 <div class="btns"><select class="rsel" onchange="curKid=+this.value;build()">${KIDS.map((x,i)=>`<option value="${i}"${i===curKid?' selected':''}>${esc(x.n)} · ${esc(x.par)}</option>`).join('')}</select></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Группа</small><b class="a">${esc(g.n.split(' · ')[0])}</b><span>${esc(g.t)}</span></div>
 <div><small>Кружки</small><b>${k.clubs.length}</b><span>${k.clubs.join(', ')||'нет'}</span></div>
 <div><small>Сентябрь</small><b class="${k.bal<0?'r':'g'}">${k.bal<0?'долг '+tg(-k.bal):'оплачено'}</b><span>${k.bal<0?'пеня начисляется':'квитанция закрыта'}</span></div>
 <div><small>Посещаемость</small><b>17 из 18</b><span>сентябрь</span></div>
</div>
<div class="g2">
 <div>
  <div class="pan" style="border-top:3px solid var(--brand)"><h3 style="margin:0 0 8px">Квитанция за сентябрь</h3>
   <div class="kv"><span>${esc(g.n.split(' · ')[0])} · ${esc(g.fmt)}</span><b class="mono">${tg(g.price)}</b></div>
   ${k.clubs.map(c=>{const cl=CLUBS.find(x=>x.n===c);return `<div class="kv"><span>${c}</span><b class="mono">${tg(cl?cl.price:0)}</b></div>`}).join('')}
   <div class="kv" style="border:0"><span><b>Итого до 10 сентября</b></span><b class="mono" style="font-size:13px">${tg(g.price+k.clubs.reduce((a,c)=>a+((CLUBS.find(x=>x.n===c)||{}).price||0),0))}</b></div>
   ${k.bal<0?'<button class="bt p" style="width:100%;margin-top:9px" onclick="toast(\'Переход к оплате в приложении банка с подставленной суммой и назначением. Утром после выписки статус обновится.\')">Оплатить</button>':'<div class="mini" style="margin-top:8px;color:var(--ok)">✓ Оплачено 8 сентября · спасибо</div>'}
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Сегодня</h3>
   <div class="kv"><span>08:36</span><b style="color:var(--ok)">${esc(k.n.split(' ')[0])} в группе</b></div>
   <div class="kv"><span>09:30</span><b>Музыка</b></div>
   <div class="kv"><span>16:00</span><b>${k.clubs[1]||k.clubs[0]||'уход'}</b></div>
   <div class="kv" style="border:0"><span>16:10 · заметка педагога</span><b>«Сегодня сам собрал среду, молодец»</b></div>
  </div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Чат</h3>
   <div class="msg" style="background:var(--card2);margin-bottom:6px">Мария К.: Добрый день! Завтра открытый урок по музыке в 10:30, приходите.</div>
   <div class="msg" style="background:var(--brandl);margin:0 0 6px auto">Спасибо, будем!</div>
   <button class="bt" style="margin-top:4px" onclick="go('chats')">Открыть чаты</button>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Ещё в кабинете</h3>
   <div class="kv"><span>Меню на неделю</span><b><a style="color:var(--acc);cursor:pointer" onclick="go('menu')">смотреть</a></b></div>
   <div class="kv"><span>Записаться на кружок</span><b><a style="color:var(--acc);cursor:pointer" onclick="toast('Запись на шахматы с 22.09. В квитанции за сентябрь — пропорционально. Администратор подтвердит.')">шахматы · есть места</a></b></div>
   <div class="kv"><span>Предупредить об отсутствии</span><b><a style="color:var(--acc);cursor:pointer" onclick="toast('Отмечено: завтра не будет. Педагог увидит утром, перерасчёт по кружкам — автоматически.')">завтра не будет</a></b></div>
   <div class="kv" style="border:0"><span>Договор и документы</span><b>PDF</b></div>
  </div>
 </div>
</div>`};

SC.onboard=()=>`<div class="hd"><div><h2>Регистрация через WhatsApp</h2>
 <p>Ваша боль с прошлой платформой: «просили подтверждение по почте, я как руководитель должна была регистрировать сотрудников, устала». Здесь администратор заводит родителя по телефону — ссылка с входом уходит в WhatsApp. Никаких паролей и подтверждений почты.</p></div>
 <div class="btns"><button class="bt p" onclick="onboardRun()">+ Родитель</button></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Как это происходит</h3>
  <div class="num"><i>1</i><div><b>Администратор вводит имя и телефон</b><p>При зачислении ребёнка — прямо из воронки. Один экран, два поля.</p></div></div>
  <div class="num"><i>2</i><div><b>Родителю приходит WhatsApp</b><p>«Здравствуйте, Дана! Кабинет Алана в Damina: [ссылка]. Вход по вашему номеру, код придёт сюда же.»</p></div></div>
  <div class="num"><i>3</i><div><b>Открыл — и уже внутри</b><p>Значок на экране телефона, без магазинов приложений. Ваш вопрос «в телефоне будет работать?» — да, в браузере телефона, как приложение.</p></div></div>
  <div class="num"><i>4</i><div><b>Сотрудники — так же</b><p>Педагог получает ссылку, открывает, отмечает «я на месте». Регистрировать никого не нужно.</p></div></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Сентябрь</h3>
   <div class="kv"><span>Родителей с кабинетом</span><b>94 из 94</b></div>
   <div class="kv"><span>Открыли в первый день</span><b>88</b></div>
   <div class="kv"><span>Не открыли ни разу</span><b style="color:var(--warn)">2</b></div>
   <div class="kv" style="border:0"><span>Второй родитель добавлен</span><b>61</b></div>
  </div>
  <div class="said"><b>Ваши слова:</b> «Родители не любят это — им надо прислать просто ссылку, логин и пароль на WhatsApp». Даже пароль не нужен: вход по коду в WhatsApp. Два родителя на одного ребёнка — оба получают ссылку, видят одно и то же.</div>
 </div>
</div>`;

SC.chats=()=>`<div class="hd"><div><h2>Чаты</h2>
 <p>Ваши слова про WhatsApp-чаты родителей: «два чата — с преподавателем и без преподавателя». Здесь чаты внутри системы: группа с педагогом, родитель — педагог лично, родитель — администратор. Телефоны сотрудников не раздаются.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Правила чатов: кто может создавать, кто модерирует, что сохраняется. Чат «без педагога» родители могут создать сами — но он тоже в системе, и вы видите, что там.')">Правила</button></div></div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Casa A · родители и Мария К.</h3>
  <div class="msg" style="background:var(--card2);margin-bottom:6px"><b>Мария К.</b> · 16:12 · Сегодня работали с розовой башней, все молодцы. Фото в альбоме группы.</div>
  <div class="msg" style="background:var(--card2);margin-bottom:6px"><b>Сауле С.</b> · 16:20 · Мария, а завтра музыка будет? Амина спрашивает</div>
  <div class="msg" style="background:var(--brandl);margin:0 0 6px auto"><b>Мария К.</b> · 16:22 · Будет, в 09:30, как обычно 🙂</div>
  <div class="msg" style="background:var(--card2);margin-bottom:6px"><b>Айгерим · администратор</b> · 17:05 · Напоминаю: 25.09 родительское собрание Elementary, для Casa — 2 октября.</div>
  <div style="display:flex;gap:6px;margin-top:8px"><input placeholder="Сообщение…" style="flex:1;padding:8px 10px;border:1px solid var(--line2);border-radius:6px;background:var(--card)"><button class="bt p" onclick="toast('Отправлено. Родители получат уведомление в кабинет и WhatsApp, если не открыли за час.')">Отправить</button></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Чаты</h3>
   ${[['Casa A · с педагогом',18,'16:22'],['Casa A · родители',18,'вчера'],['Toddler · с педагогом',12,'15:40'],['Elementary · с учителем',25,'14:10'],['Дана Д. ↔ Мария К.',2,'16:10'],['Сауле С. ↔ администратор',2,'11.09']].map(([n,m,t])=>`<div class="kv"><span>${n} <span class="mini">· ${m} чел</span></span><b class="mono" style="font-size:10.5px">${t}</b></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Почему не WhatsApp — как на встрече</h3><p class="mini" style="margin:0">Чат в WhatsApp — это раздача телефонов всех педагогов и хаос, который вы не контролируете. Внутренний чат: педагог в отпуске — замена видит историю; уволился — родители не остаются с его личным номером; спорный вопрос — вы видите переписку. Уведомление о новом сообщении при этом приходит в WhatsApp — родитель ничего не теряет.</p></div>
 </div>
</div>`;

SC.menu=()=>`<div class="hd"><div><h2>Меню и согласования</h2>
 <p>Предложение с встречи: утверждение меню — вечная тема родительских чатов. Здесь повар загружает меню на месяц, родители голосуют и комментируют в кабинете, аллергии из карточек детей учитываются автоматически.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Меню на октябрь отправлено родителям на согласование до 25.09. Голосование и комментарии — в кабинете, итог видите вы и повар.')">На согласование</button></div></div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Меню · неделя 22–26 сентября</h3>
  <table class="t" style="font-size:11.3px"><thead><tr style="border-bottom:1.5px solid var(--line2)">${['ДЕНЬ','ЗАВТРАК','ОБЕД','ПОЛДНИК'].map(h=>`<th style="text-align:left;padding:7px 8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
  <tbody>${[['Пн','каша овсяная, яблоко','суп с фрикадельками, гречка с курицей','творожная запеканка'],['Вт','омлет, тост','борщ, рис с рыбой','фрукты, йогурт'],['Ср','каша рисовая, банан','куриный суп, пюре с котлетой','сырники'],['Чт','сырники, кефир','щи, макароны с тефтелями','яблочный пирог'],['Пт','каша пшённая, груша','суп-пюре овощной, плов','блины с творогом']].map(r=>`<tr>${r.map((c,i)=>`<td style="padding:7px 8px;${i?'':'font-weight:700'}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <div class="mini" style="margin-top:8px">Аллергии учтены: 4 ребёнка без молочного — замена отдельной строкой у повара. Родители видят меню в кабинете, менять его в чате не нужно.</div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Согласование на октябрь</h3>
   <div class="kv"><span>Проголосовали</span><b>67 из 94</b></div>
   <div class="kv"><span>За</span><b style="color:var(--ok)">58</b></div>
   <div class="kv"><span>С замечаниями</span><b style="color:var(--warn)">9</b></div>
   <div class="kv" style="border:0"><span>Чаще всего</span><b>«меньше макарон»</b></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Другие согласования</h3><p class="mini" style="margin:0">Тот же механизм — для экскурсий, фото- и видеосъёмки, изменений расписания: вопрос в кабинет, ответ кнопкой, итог у вас. Без «кто за — поставьте плюс» в чате на сорок человек.</p></div>
 </div>
</div>`;
/* ====== СОТРУДНИКИ ====== */
SC.staff=()=>`<div class="hd"><div><h2>Сотрудники и ставки</h2>
 <p>Ваши слова: «Люди, работающие в разных графиках — оплата за выход или почасовая — сможем тарифицировать отдельно?» Пять типов ставок, у каждого сотрудника своя. Выходы и занятия — по геолокации и посещаемости, зарплата считается сама.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новый сотрудник: имя, телефон, должность, тип ставки, группы и кружки. Ссылка на вход — в WhatsApp. Регистрировать не нужно.')">+ Сотрудник</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['СОТРУДНИК','ДОЛЖНОСТЬ','ТИП СТАВКИ','СТАВКА','ВЫХОДОВ / ЗАНЯТИЙ','НАЧИСЛЕНО'].map((h,i)=>`<th style="text-align:${i>=4?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${STAFF.map(s=>`<tr><td style="padding:8px"><b>${esc(s.n)}</b></td><td style="padding:8px;color:var(--muted)">${esc(s.pos)}</td><td style="padding:8px">${tag(s.type,s.type==='оклад'?'var(--muted)':'var(--acc)')}</td><td class="mono" style="padding:8px">${seeMoney()?s.rate:'—'}</td><td class="mono" style="text-align:right;padding:8px">${s.out} из ${s.plan}</td><td class="mono" style="text-align:right;padding:8px;font-weight:700">${seeMoney()?'—':'скрыто'}</td></tr>`).join('')}
 <tr><td colspan="6" style="padding:8px;color:var(--muted)">+ ещё 11 сотрудников: ассистенты, повар, няни, охрана</td></tr></tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Оклад</h3><p class="mini" style="margin:0">Педагоги групп. Пропуск без причины по геолокации — вычет по вашему правилу или без него.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">За выход · почасовая</h3><p class="mini" style="margin:0">Развивашка, музыка. Выход засчитывается только с отметкой на месте; часы — от отметки прихода до ухода.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">За занятие · за ребёнка</h3><p class="mini" style="margin:0">Кружки и логопед. Занятие — из расписания плюс отметка; за ребёнка — из листа посещаемости. Ваши «три задачи» одним листом.</p></div>
</div>`;

SC.pay=()=>`<div class="hd"><div><h2>Зарплата и KPI · сентябрь</h2>
 <p>Обещано на встрече: «в пакет включим KPI и полное начисление зарплат, контроль рабочего времени». Начисление — из ставок, геолокации и посещаемости. KPI — из данных: заполненность группы, удержание детей, оценка родителей, отсутствие пропусков.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Правила: оклад из карточки, вычет за пропуск без причины, премия по KPI с вашими весами. Меняются без нас.')">Правила</button><button class="bt p" onclick="toast('Ведомость за сентябрь по 21 сотруднику сформирована. Каждому — своя строка в кабинете; бухгалтеру — Excel для официального начисления.')">Рассчитать</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Фонд оплаты труда</small><b class="a">${seeMoney()?tg(9640000):'—'}</b><span>21 сотрудник</span></div>
 <div><small>Из них по выходам и занятиям</small><b>${seeMoney()?tg(2180000):'—'}</b><span>7 сотрудников</span></div>
 <div><small>Вычеты за пропуски</small><b class="w">${seeMoney()?tg(48000):'—'}</b><span>2 сотрудника</span></div>
 <div><small>Премии по KPI</small><b class="g">${seeMoney()?tg(410000):'—'}</b><span>6 сотрудников</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.4px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['СОТРУДНИК','БАЗА','ВЫХОДЫ · ЗАНЯТИЯ','ЗАПОЛНЕННОСТЬ','УДЕРЖАНИЕ','ОЦЕНКА РОДИТЕЛЕЙ','KPI','ИТОГО'].map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['Мария К.','оклад','22 из 22','100%','100%','4,9',1.12],['Жанна С.','оклад','22 из 22','78%','100%','4,7',1.02],['Асель Р.','оклад','21 из 22','100%','92%','4,8',0.98],['Ольга В.','оклад','22 из 22','93%','96%','4,6',1.06],['Динара Т.','12 000 / выход','13 выходов','70%','—','4,5',0.95],['Ерлан М.','6 000 / час','24 часа','—','—','4,9',1.08],['Ms. Anna','8 000 / занятие','7 из 8','—','—','4,4',0.92]]
  .map(r=>`<tr><td style="padding:8px"><b>${r[0]}</b></td><td class="mono" style="text-align:right;padding:8px;color:var(--muted)">${seeMoney()?r[1]:'—'}</td><td class="mono" style="text-align:right;padding:8px">${r[2]}</td><td class="mono" style="text-align:right;padding:8px">${r[3]}</td><td class="mono" style="text-align:right;padding:8px">${r[4]}</td><td class="mono" style="text-align:right;padding:8px">${r[5]}</td><td class="mono" style="text-align:right;padding:8px;font-weight:800;color:${r[6]<0.95?'var(--warn)':'var(--ok)'}">${r[6].toFixed(2)}</td><td style="text-align:right;padding:8px">${seeMoney()?'<span class="mono">—</span>':'<span class="tag">скрыто</span>'}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Что говорят цифры</h3><p class="mini" style="margin:0">Casa B заполнена на 78% при 100% у Casa A — при одинаковом тарифе. Либо в Casa B меньше набирают, либо родители выбирают Марию. Оценка родителей 4,7 против 4,9 — небольшая разница, а заполненность отличается сильно. Это повод посмотреть на воронку, а не на педагога.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Оценка родителей</h3><p class="mini" style="margin:0">Раз в месяц родителю в кабинет — один вопрос: «как вам педагог?» от 1 до 5. Не публично, только вам. Заполняют 60–70%, этого достаточно, чтобы увидеть динамику.</p></div>
</div>`;

SC.tasks=()=>`<div class="hd"><div><h2>Задачи</h2>
 <p>Обещано на встрече: «задачи, коммуникация внутренняя, административные задачи». Половина задач ставится системой: заявка без ответа, должник, сотрудник без отметки. Остальное — вы и администратор друг другу.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Новая задача: кому, срок, связь с ребёнком или заявкой. Появится в кабинете исполнителя, просроченная — у вас.')">+ Задача</button></div></div>
<div class="pan">${TASKS.map(t=>`<div class="dl" style="--c:${t.st==='late'?'var(--bad)':t.st==='work'?'var(--acc)':'var(--line2)'}"><div style="flex:1;min-width:0"><b>${esc(t.t)}</b><div class="mini">${esc(t.who)} · срок ${t.due} · источник: ${esc(t.src)}</div></div>${tag(t.st==='late'?'просрочена':t.st==='work'?'в работе':'новая',t.st==='late'?'var(--bad)':t.st==='work'?'var(--acc)':'var(--muted)')}<button class="bt" onclick="toast('Задача закрыта. Постановщик увидит у себя.')">Готово</button></div>`).join('')}</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Задачи от системы</h3><p class="mini" style="margin:0">Заявка без ответа час → администратору. Должник после 10-го → вам. Педагог без отметки к началу занятия → бухгалтеру. Лист ожидания при освободившемся месте → администратору. Никто не помнит — система помнит.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Новостная лента — не делаем</h3><p class="mini" style="margin:0">Ваши слова: «новостная лента — честно, не особо, платформа нужна для административных задач, а не как Инстаграм для сада». Не делаем. Объявления родителям идут через чаты и календарь — этого достаточно.</p></div>
</div>`;

/* ====== НАСТРОЙКИ ====== */
SC.roles=()=>`<div class="hd"><div><h2>Права доступа</h2>
 <p>Шесть ролей. Педагог не видит оплат и чужих групп, родитель — только своего ребёнка, бухгалтер — деньги и табель, администратор — набор и расписание. Собственник — всё, включая зарплаты.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новая роль — кнопкой: например «Методист» с доступом к группам и посещаемости без оплат.')">+ Роль</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)"><th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">ЧТО ВИДНО</th>${Object.keys(ROLES).map(r=>`<th style="text-align:center;padding:8px;font-size:9px;color:var(--muted)">${esc(r.toUpperCase())}</th>`).join('')}</tr></thead>
 <tbody>${[['Воронка и заявки',[1,1,1,0,0,0]],['Все дети и группы',[1,1,1,0,1,0]],['Своя группа',[1,1,1,1,0,0]],['Свой ребёнок',[0,0,0,0,0,1]],['Расписание',[1,1,1,1,0,1]],['Посещаемость детей · отметка',[1,1,0,1,0,0]],['Посещаемость сотрудников',[1,1,0,0,1,0]],['Начисления и выписка',[1,1,0,0,1,0]],['Должники и пеня',[1,1,0,0,1,0]],['Своя квитанция и оплата',[0,0,0,0,0,1]],['Ставки и зарплата всех',[1,0,0,0,1,0]],['Своя зарплата',[1,1,1,1,1,0]],['Чаты',[1,1,1,1,0,1]],['Отчёты собственнику',[1,0,0,0,0,0]],['Настройки и права',[1,1,0,0,0,0]]]
  .map(([n,a])=>`<tr><td style="padding:7px 8px">${esc(n)}</td>${a.map(v=>`<td style="text-align:center;padding:7px 8px;color:${v?'var(--ok)':'var(--line2)'};font-weight:800">${v?'✓':'—'}</td>`).join('')}</tr>`).join('')}</tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Вход</h3><p class="mini" style="margin:0">По номеру телефона с кодом в WhatsApp — и родителям, и сотрудникам. Никаких паролей и подтверждений почты.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Персональные данные детей</h3><p class="mini" style="margin:0">Сервер ваш, доступ по ролям, журнал просмотра карточек. Медкарта и аллергии — только педагогу группы, повару и вам.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Уволился</h3><p class="mini" style="margin:0">Доступ закрывается кнопкой; чаты с родителями остаются в системе у замены — телефон педагога родителям не раздавался.</p></div>
</div>`;

SC.integr=()=>`<div class="hd"><div><h2>Интеграции</h2>
 <p>Что подключается в первом релизе и что отдельно — как обсуждали.</p></div></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 7px">WhatsApp</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">первый релиз</span><p class="mini" style="margin:7px 0 0">Заявки с таргета — в систему; квитанции, напоминания, посещаемость, вход по коду — родителям. Через казахстанского провайдера ≈ 5 000 ₸ вместо 36 000 в месяц.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">IP-телефония</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">первый релиз</span><p class="mini" style="margin:7px 0 0">Звонки родителям из карточки с записью. ≈ 30–35 000 ₸ в месяц провайдеру. Ваши слова: «интеграция WhatsApp и телефонии — да».</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Банк · выписка</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">первый релиз</span><p class="mini" style="margin:7px 0 0">Загрузка выписки раз в сутки и сверка с квитанциями. Без API банка — как договорились.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Геолокация</h3><span class="tag" style="background:var(--ok-l);color:var(--ok)">первый релиз</span><p class="mini" style="margin:7px 0 0">Отметка сотрудников с личного телефона в радиусе 50 м, античит, журнал.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">Договоры с ЭЦП</h3><span class="tag" style="background:var(--violet-l);color:var(--violet)">отдельно · ≈ 1 000 000 ₸</span><p class="mini" style="margin:7px 0 0">Ваш вопрос «можем договоры через вас подписывать?» — да, у нас есть такая разработка, две недели. Но остаться на онлайн-сервисе за 20 ₸ за подпись дешевле — как и решили.</p></div>
 <div class="pan"><h3 style="margin:0 0 7px">1С</h3><span class="tag">не нужна</span><p class="mini" style="margin:7px 0 0">Ваши слова: «1С не нужна». Система хранит всё сама, бухгалтеру — выгрузка. Если понадобится — 800 000 ₸ отдельно.</p></div>
</div>
<div class="said"><b>Что не делаем сознательно:</b> лицензирование («мне тоже не нужно»), новостную ленту, приложение в магазинах. Только то, что закрывает административные задачи, — ваши слова.</div>`;

SC.migr=()=>`<div class="hd"><div><h2>Перенос из таблиц</h2>
 <p>Ваши слова: «информация разрозненна, в куче Excel-файлов». Вы даёте таблицы как есть — дети, группы, кружки, родители, оплаты за последние месяцы. Мы структурируем и загружаем; повторно ничего не вводится.</p></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Что нужно от вас в первые 10 дней</h3>
  ${[['Список детей с группами и кружками','Excel, как ведёте',1],['Родители: имя, телефон WhatsApp','для регистрации кабинетов',1],['Тарифы по форматам и кружкам','и признак перерасчёта',1],['Расписание групп и кружков','по дням и помещениям',1],['Сотрудники и ставки','тип ставки по каждому',1],['Оплаты за август–сентябрь','чтобы стартовать с верными балансами',1],['Тексты сообщений родителям','те, что бухгалтер пишет сейчас — станут шаблонами',0]]
   .map(([n,d,ok])=>`<div class="kv"><span>${n} <span class="mini">· ${d}</span></span>${ok?tag('Excel','var(--ok)'):tag('текст','var(--acc)')}</div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Как идёт запуск</h3>
   <div class="num"><i>1</i><div><b>Перенос и проверка</b><p>Загружаем, показываем вам список детей и первые тестовые квитанции. Вы сверяете с тем, что было бы вручную.</p></div></div>
   <div class="num"><i>2</i><div><b>Первое число — параллельно</b><p>Первую квитанцию система считает, бухгалтер проверяет глазами. Совпало — дальше без проверки.</p></div></div>
   <div class="num"><i>3</i><div><b>Родители — ссылкой</b><p>94 ссылки в WhatsApp за одно утро. Никаких собраний по регистрации.</p></div></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Что не нужно</h3><p class="mini" style="margin:0">Писать ТЗ, участвовать шефу до утверждения ядра, останавливать текущий учёт. Таблицы живут до дня, когда вы скажете «переходим».</p></div>
 </div>
</div>`;

SC.stack=()=>`<div class="hd"><div><h2>Состав первого релиза</h2>
 <p>Ваши слова: «Мне важно, чтобы ключевые для нас моменты вы подтвердили, что это точно будет». Вот список. После прохода по демо он становится приложением № 1 к договору вместе с ТЗ.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Состав релиза выгружен в PDF вместе с ТЗ и КП.')">Выгрузить</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Стоимость</small><b class="a">3 500 000 ₸</b><span>стандартная разработка</span></div>
 <div><small>Срок</small><b>4–6 недель</b><span>запас 1–2 · до 2 месяцев</span></div>
 <div><small>Оплата</small><b>10 / 45 / 45</b><span>350 000 ₸ при старте</span></div>
 <div><small>Абонплата</small><b class="g">нет</b><span>код и сервер ваши</span></div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Ключевые моменты — подтверждаем</h3>
  ${['Воронка набора с вашими стадиями: лид → экскурсия → пробный → адаптация → зачислен','Заявки с таргета из WhatsApp попадают в систему сами, ответ из системы','Расписание: слоты педагогов, распределение детей, помещения','Посещаемость детей: один лист — три назначения (перерасчёт, без перерасчёта, табель)','Посещаемость сотрудников по геолокации с личного телефона, античит','Начисления 1-го числа: группа + кружки + музыка, квитанция со ссылкой на оплату','Напоминания каждый день до оплаты, должники 10-го, пеня автоматически','Выписка банка раз в сутки, сверка, без 1С','Кабинет родителя: квитанция, посещаемость, чат, меню; регистрация через WhatsApp','Чаты внутри системы вместо WhatsApp-групп','Сотрудники: оклад, за выход, почасовая, за занятие; зарплата и KPI','Задачи, календарь, меню и согласования','6 ролей, права, вход по коду','Телефон: значок на экране, без магазинов приложений','Перенос из таблиц, сервер, бэкапы, обучение, год бесплатных исправлений']
   .map(t=>`<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0"><b style="color:var(--ok)">✓</b><span style="font-size:11.4px">${esc(t)}</span></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Как идёт работа</h3>
   <div class="tl">
    <div class="tli"><b style="font-size:11.6px">Понедельник 11:00 · демо у вас</b><p class="mini" style="margin:2px 0 0">Проход по экранам с руководителями подразделений, правки.</p></div>
    <div class="tli"><b style="font-size:11.6px">10 дней · таблицы</b><p class="mini" style="margin:2px 0 0">Предоплата 10%, ваши Excel, тарифы, расписание.</p></div>
    <div class="tli"><b style="font-size:11.6px">Недели 2–3 · ядро</b><p class="mini" style="margin:2px 0 0">Дети, группы, квитанции, посещаемость, кабинеты. Zoom, платёж 45%.</p></div>
    <div class="tli"><b style="font-size:11.6px">Недели 4–6 · 5–10 выпусков</b><p class="mini" style="margin:2px 0 0">Ваша «тысяча мелочей» — до каждой запятой, ваши слова.</p></div>
    <div class="tli"><b style="font-size:11.6px">Передача</b><p class="mini" style="margin:2px 0 0">Ваш сервер, код, обучение, платёж 45%.</p></div>
   </div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Отдельно</h3>
   <div class="kv"><span>Договоры с ЭЦП внутри</span><b class="mono">≈ 1 000 000 ₸</b></div>
   <div class="kv"><span>1С</span><b class="mono">не нужна</b></div>
   <div class="kv" style="border:0"><span>Доработки после приёмки</span><b class="mono">по часам</b></div>
  </div>
 </div>
</div>
<div class="said"><b>Что мы не обещаем.</b> Что угадаем всё с первого раза — поэтому 5–10 выпусков с вашими правками. И что это «готовое решение с геолокацией и банкингом, у которого вроде всё есть» — ваш опыт с готовыми: «вроде функционал есть, но нет геолокации, по оплатам есть, но к банкингу не привязано». Здесь всё написано под вас.</div>`;
/* ====== ДЕЙСТВИЯ ====== */
function billRun(){
 openM('Начислить и отправить · 1 октября','110 квитанций · 94 родителя',
 `<p style="font-size:11.6px;line-height:1.7">Система собрала по каждому ребёнку группу, кружки на 1 октября, музыку, перерасчёт за сентябрь по посещаемости, каникулы Elementary и даты зачисления. Ниже — что уйдёт.</p>
  <div class="kv"><span>Группы · 6 форматов</span><b class="mono">${tg(16550000)}</b></div>
  <div class="kv"><span>Кружки и музыка</span><b class="mono">${tg(5210000)}</b></div>
  <div class="kv"><span>Логопед · по занятиям сентября</span><b class="mono">${tg(2080000)}</b></div>
  <div class="kv"><span>Перерасчёт за сентябрь</span><b class="mono" style="color:var(--ok)">− ${tg(184000)}</b></div>
  <div class="kv"><span>Каникулы Elementary 1–5.10</span><b class="mono" style="color:var(--ok)">− ${tg(1560000)}</b></div>
  <div class="kv" style="border:0"><span><b>Итого к отправке</b></span><b class="mono" style="font-size:13px">${tg(22096000)}</b></div>
  <p class="mini" style="margin:8px 0 0">Отправка: кабинет + WhatsApp + e-mail, 1 октября в 09:00. Напоминания — ежедневно до оплаты. Бухгалтер — ничего.</p>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Запланировано на 1 октября 09:00: 110 квитанций. Ваши слова: «наступило первое число — всем родителям пришли расчётные квитанции со ссылочкой». Это оно.')">Подтвердить</button>`);
}
function onboardRun(){
 openM('Новый родитель','Два поля — и ссылка в WhatsApp',
 `<div class="srow"><div style="flex:1"><b>Имя</b></div><input value="Айнур С." style="width:60%;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card)"></div>
  <div class="srow"><div style="flex:1"><b>Телефон WhatsApp</b></div><input value="+7 707 ··· ·· ··" style="width:60%;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card)"></div>
  <div class="srow"><div style="flex:1"><b>Ребёнок</b></div><select class="rsel"><option>Айша С. · Casa A · с 22.09</option></select></div>
  <div class="note" style="--tone:var(--brand)"><p class="mini" style="margin:0">Родителю уйдёт: «Здравствуйте, Айнур! Кабинет Айши в Damina: [ссылка]. Вход по вашему номеру, код придёт сюда же.» Пароля нет. Почты нет.</p></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Кабинет создан, ссылка ушла в WhatsApp. Первая квитанция — пропорционально с 22.09 — уже в кабинете.')">Создать и отправить</button>`);
}
function waReply(){
 openM('Ответить · Айнур','WhatsApp · из системы, с рабочего номера',
 `<div class="msg" style="background:var(--card2);margin-bottom:8px">Здравствуйте! Увидела вас в Instagram. Дочке 3 года, сколько стоит группа полного дня?</div>
  <div class="srow"><div style="flex:1"><b>Шаблон</b></div><select class="rsel"><option>Цена Casa 3–6 + приглашение на экскурсию</option><option>Цена Toddler</option><option>Свободный текст</option></select></div>
  <textarea style="width:100%;height:78px;padding:8px;border:1px solid var(--line2);border-radius:6px;background:var(--card);font:inherit;font-size:11.4px;margin-top:6px">Здравствуйте, Айнур! Casa 3–6 полного дня — 200 000 ₸ в месяц, с обедом и музыкой. Приглашаем на экскурсию — завтра в 10:00 или в понедельник в 11:00?</textarea>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Отправлено. Заявка перейдёт на «Экскурсия», когда Айнур подтвердит время. Переписка — в карточке.')">Отправить</button>`);
}
function searchDemo(v){if(!v)return;toast(`Поиск «${esc(v)}»: по детям, родителям, заявкам, группам, кружкам, квитанциям и сотрудникам — в пределах прав роли. Родитель найдёт только своё.`)}

/* ====== ИНФРАСТРУКТУРА ====== */
function renderRoles(){const r=document.getElementById('roles');if(!r)return;
 r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();
 toast(`Вы вошли как «${role}» · ${ROLES[role].n}. Показаны только разделы этой роли — так же будет у ваших сотрудников и родителей.`);}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${role}. Разделов доступно: ${ROLES[role].s.length}. ${ROLES[role].note}.`)}
const ownerOf=k=>SECOF[k];
function buildRail(){const on=ownerOf(cur);document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>{const n=s.sub.filter(x=>allowed(x[0])).length;return `<div class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')" title="${esc(s.n)}"><i>${s.ic}</i><span>${esc(s.n)}</span>${n>1?`<b class="cnt">${n}</b>`:''}</div>`}).join('');}
function buildSub(){const on=ownerOf(cur),s=SEC.find(x=>x.k===on);if(!s)return;document.getElementById('sub').innerHTML=`<h4>${esc(s.n)}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`;}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Общая картина';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;const a=document.getElementById('addBtn');if(a)a.style.display=allowed('leads')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль в правом верхнем углу.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

/* ====== СЦЕНАРИЙ ПОКАЗА ====== */
const TOUR=[
 ['dash','Общая картина: дети, группы, кружки, оплаты, должники, сотрудники — то, что сейчас в куче Excel-файлов, на одном экране.'],
 ['bill','Главное — первое число. Группа, кружки, музыка по каждому ребёнку, квитанция со ссылкой на оплату. Нажмите «Начислить и отправить».'],
 ['invoices','Напоминания каждый день до оплаты, сами. После 10-го — с пеней. Бухгалтер не пишет ста родителям в WhatsApp.'],
 ['debtors','Десятого числа: список должников с пеней по вашему правилу и историей напоминаний. Трое — постоянные, это видно.'],
 ['bank','Выписка банка раз в сутки, сверка с квитанциями. Без 1С — как договорились.'],
 ['funnel','Воронка набора с вашими стадиями: лид, экскурсия, пробный, адаптация, зачислен. Названия меняете сами.'],
 ['leads','Заявка с таргета из WhatsApp — в системе сама, ответ отсюда же. Нажмите «Ответить».'],
 ['attstaff','Посещаемость сотрудников по геолокации с личного телефона. Радиус 50 метров, античит, тарифы за выход и почасовые.'],
 ['att','Посещаемость детей: педагог ставит галочку один раз — три листа: перерасчёт, без перерасчёта, табель.'],
 ['teacher','Экран педагога: своя группа, отметить, заметка родителю. Ни оплат, ни чужих групп, ни телефонов родителей.'],
 ['parent','Кабинет родителя: квитанция с кнопкой оплаты, посещаемость, заметка педагога, чат, меню. Открывается по ссылке из WhatsApp.'],
 ['onboard','Регистрация через WhatsApp: администратор ввёл имя и телефон — родителю ушла ссылка. Ни паролей, ни почты — ваша боль с прошлой платформой.'],
 ['chats','Чаты внутри системы вместо WhatsApp-групп: коммуникацию контролируете вы, телефоны педагогов не раздаются.'],
 ['clubs','Кружки: признак «перерасчёт по посещаемости» или «фикс» — ваши «занятия, по которым проводим и не проводим перерасчёт».'],
 ['staff','Сотрудники: оклад, за выход, почасовая, за занятие. Выход засчитывается только с отметкой на месте.'],
 ['pay','Зарплата и KPI — обещанное на встрече. Из ставок, геолокации и посещаемости.'],
 ['roles','Права: шесть ролей, каждый видит своё. Вход по коду в WhatsApp.'],
 ['stack','Состав релиза: 3 500 000 ₸, 10 / 45 / 45, четыре-шесть недель, код и сервер ваши. Ключевые моменты — подтверждены списком.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий показа закончен. Всё кликается: квитанции, воронка, посещаемость, кабинет родителя.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?5800:6900);}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
