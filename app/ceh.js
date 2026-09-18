/* ЦЕХ — производственная система полуфабрикатов. Демо-макет для Улана (Бишкек) по встрече 18 сентября 2026.
   Цеха → склады → агенты → доставка → касса. Расчёты в сомах. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const num=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
const som=n=>fmt(n)+' сом';
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};

const SEC=[
 {k:'dash', ic:'▦', n:'Пульт',       sub:[['dash','Сводка'],['today','Что горит сегодня']]},
 {k:'prod', ic:'⚙', n:'Производство',sub:[['shifts','Цеха и смены'],['close','Закрытие смены · бригадир'],['tech','Техкарты и рецептуры'],['output','Выработка и брак']]},
 {k:'wh',   ic:'▤', n:'Склады',      sub:[['raw','Склад сырья'],['fg','Готовая продукция'],['moves','Отпуск и перемещения'],['inv','Инвентаризация']]},
 {k:'sale', ic:'◎', n:'Продажи',     sub:[['agents','Агенты и районы'],['orders','Заявки агентов'],['shops','Магазины'],['debts','Долги магазинов']]},
 {k:'del',  ic:'➜', n:'Доставка',    sub:[['routes','Маршруты и экспедиторы'],['driver','Экран водителя'],['returns','Возвраты']]},
 {k:'buy',  ic:'⇣', n:'Закуп',       sub:[['suppliers','Поставщики и закуп'],['plan','План закупа по остаткам']]},
 {k:'fin',  ic:'₸', n:'Деньги',      sub:[['cash','Касса и сдача выручки'],['fin','Финансы'],['pay','Зарплата по выработке']]},
 {k:'an',   ic:'▥', n:'Аналитика',   sub:[['rep','Агент × позиция × магазин'],['abc','ABC магазинов и продуктов']]},
 {k:'set',  ic:'☰', n:'Настройки',   sub:[['roles','Права доступа'],['mobile','Телефон · значок на экране'],['integr','1С и Агент Плюс'],['stack','Состав релиза']]}
];
const SECOF={},SUBN={};
SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=['dash','today','shifts','close','tech','output','raw','fg','moves','inv','agents','orders','shops','debts','routes','driver','returns','suppliers','plan','cash','fin','pay','rep','abc','roles','mobile','integr','stack'];

const ROLES={
 'Руководитель':{av:'УЛ',n:'Улан',r:'собственник',note:'Всё: цеха, остатки, агенты, доставка, деньги, выработка каждого сотрудника, отчёты в любом разрезе',s:ALL},
 'Бригадир цеха':{av:'БК',n:'Бакыт',r:'пельменный цех · 1 смена',note:'Три функции с телефона: закрыть смену, списать брак, запросить сырьё. Ничего лишнего',
  s:['close','output','tech','raw']},
 'Кладовщик':{av:'АЙ',n:'Айбек',r:'склад готовой продукции',note:'Приход из цехов, отпуск водителям и агентам, возвраты, остатки, инвентаризация',
  s:['fg','raw','moves','inv','returns','plan']},
 'Агент':{av:'СН',n:'Санжар',r:'район Джал · 31 магазин',note:'Свои магазины, заявки, долги своих точек, свои продажи по позициям. Чужих районов не видит',
  s:['orders','shops','debts','rep']},
 'Экспедитор':{av:'ЭР',n:'Эрлан',r:'водитель · маршрут № 3',note:'Свой маршрут на сегодня: что везу, куда, отметить доставку, частичный приём, возврат, деньги',
  s:['driver','routes','returns','cash']},
 'Кассир':{av:'ГЛ',n:'Гульнара',r:'касса',note:'Приём выручки от водителей и агентов, долги магазинов, сдача в банк',
  s:['cash','debts','fin']},
 'Бухгалтер':{av:'НЗ',n:'Назгуль',r:'учёт и 1С',note:'Финансы, себестоимость, зарплата по выработке, выгрузка в 1С для налоговой',
  s:['fin','pay','output','inv','integr','suppliers']}
};
let role='Руководитель',cur='dash',theme='light';

/* ====== ЦЕХА, СМЕНЫ, ПРОДУКТЫ ====== */
const SHOPS_=['Мясной цех','Тестовой цех','Пельменный цех','Упаковка'];
const PRODUCTS=[
 {n:'Пельмени «Домашние» 1 кг',u:'уп',price:410,cost:268,shelf:'180 дн'},
 {n:'Пельмени «Сибирские» 0,9 кг',u:'уп',price:390,cost:251,shelf:'180 дн'},
 {n:'Манты с говядиной 0,8 кг',u:'уп',price:360,cost:238,shelf:'150 дн'},
 {n:'Вареники с картофелем 0,9 кг',u:'уп',price:250,cost:142,shelf:'180 дн'},
 {n:'Хинкали 0,8 кг',u:'уп',price:380,cost:249,shelf:'150 дн'},
 {n:'Чебуреки п/ф 6 шт',u:'уп',price:220,cost:131,shelf:'120 дн'},
 {n:'Котлеты домашние 0,6 кг',u:'уп',price:290,cost:188,shelf:'120 дн'},
 {n:'Тесто слоёное 0,5 кг',u:'уп',price:120,cost:64,shelf:'90 дн'}
];
/* смены за 17.09: цех, смена, бригадир, план, факт, брак %, часов, людей */
const SHIFTS=[
 {c:'Мясной цех',s:1,br:'Нурбек',plan:1200,fact:1180,scrap:1.2,h:8,men:6,unit:'кг фарша'},
 {c:'Мясной цех',s:2,br:'Талант',plan:1200,fact:1090,scrap:2.8,h:8,men:5,unit:'кг фарша'},
 {c:'Тестовой цех',s:1,br:'Айгерим',plan:900,fact:920,scrap:0.6,h:8,men:4,unit:'кг теста'},
 {c:'Тестовой цех',s:2,br:'Мирлан',plan:900,fact:870,scrap:0.9,h:8,men:4,unit:'кг теста'},
 {c:'Пельменный цех',s:1,br:'Бакыт',plan:2400,fact:2460,scrap:1.4,h:8,men:9,unit:'уп'},
 {c:'Пельменный цех',s:2,br:'Жылдыз',plan:2400,fact:2210,scrap:3.1,h:8,men:8,unit:'уп'},
 {c:'Пельменный цех',s:3,br:'Азамат',plan:1800,fact:1790,scrap:1.1,h:8,men:7,unit:'уп'},
 {c:'Упаковка',s:1,br:'Чынара',plan:4000,fact:4020,scrap:0.3,h:8,men:5,unit:'уп'}
];

/* ====== СКЛАДЫ ====== */
const RAW=[
 {n:'Говядина, лопатка',u:'кг',q:1840,min:800,price:520,sup:'ОсОО «Ак-Мал»',days:3},
 {n:'Свинина, шея',u:'кг',q:420,min:600,price:470,sup:'ИП Осмонов',days:1},
 {n:'Мука в/с',u:'кг',q:3200,min:1500,price:48,sup:'ОсОО «Дан-Агро»',days:9},
 {n:'Лук репчатый',u:'кг',q:260,min:300,price:35,sup:'рынок Дордой',days:2},
 {n:'Картофель',u:'кг',q:900,min:400,price:28,sup:'ИП Абдыкадыров',days:6},
 {n:'Яйцо',u:'шт',q:4800,min:3000,price:9,sup:'ОсОО «Птицепром»',days:4},
 {n:'Специи, смесь № 2',u:'кг',q:38,min:20,price:640,sup:'ИП Ким',days:12},
 {n:'Плёнка упаковочная',u:'рул',q:14,min:20,price:1900,sup:'ОсОО «ПакСервис»',days:5}
];
const FG=[
 {p:0,q:3420,res:1180,day:1240},{p:1,q:2860,res:940,day:1010},{p:2,q:1120,res:610,day:520},{p:3,q:2240,res:480,day:390},
 {p:4,q:690,res:320,day:280},{p:5,q:1540,res:410,day:360},{p:6,q:880,res:290,day:240},{p:7,q:410,res:60,day:70}
];

/* ====== АГЕНТЫ И МАГАЗИНЫ ====== */
const AGENTS=[
 {n:'Санжар',d:'Джал',shops:31,plan:420000,fact:398000,debt:64000,today:14},
 {n:'Айдана',d:'Аламедин',shops:27,plan:380000,fact:412000,debt:12000,today:11},
 {n:'Бектур',d:'Ак-Орго',shops:24,plan:340000,fact:301000,debt:88000,today:9},
 {n:'Нурайым',d:'Асанбай',shops:29,plan:400000,fact:405000,debt:0,today:13},
 {n:'Тилек',d:'Восток-5',shops:22,plan:320000,fact:288000,debt:41000,today:8},
 {n:'Эльмира',d:'Кок-Жар',shops:26,plan:360000,fact:371000,debt:19000,today:12}
];
const SHOPS=[
 {n:'Минимаркет «Асель»',a:'Джал-23',ag:'Санжар',week:18400,debt:0,last:'17.09',net:'—'},
 {n:'«Народный» № 41',a:'Джал, ул. Тыныстанова',ag:'Санжар',week:42600,debt:0,last:'18.09',net:'сеть'},
 {n:'Магазин «Нур»',a:'Аламедин-1',ag:'Айдана',week:9800,debt:12000,last:'15.09',net:'—'},
 {n:'Супермаркет «Береке»',a:'Ак-Орго',ag:'Бектур',week:36200,debt:88000,last:'11.09',net:'сеть'},
 {n:'Магазин у дома «Бакыт»',a:'Асанбай-12',ag:'Нурайым',week:7600,debt:0,last:'18.09',net:'—'},
 {n:'«Фрунзе-Маркет» № 7',a:'Восток-5',ag:'Тилек',week:28900,debt:41000,last:'14.09',net:'сеть'},
 {n:'Мини-маркет «Алтын»',a:'Кок-Жар',ag:'Эльмира',week:11200,debt:19000,last:'16.09',net:'—'},
 {n:'Столовая «Ош-Базар»',a:'Ош-базар',ag:'Санжар',week:22000,debt:64000,last:'12.09',net:'—'}
];

/* ====== ЗАЯВКИ АГЕНТОВ · сегодня ====== */
const ORD=[
 {id:'З-4812',ag:'Санжар',shop:'«Народный» № 41',items:[[0,40],[1,30],[3,20]],sum:0,st:'load',route:3},
 {id:'З-4813',ag:'Санжар',shop:'Минимаркет «Асель»',items:[[0,12],[5,10]],sum:0,st:'load',route:3},
 {id:'З-4814',ag:'Айдана',shop:'Магазин «Нур»',items:[[1,10],[2,8],[6,6]],sum:0,st:'new',route:1},
 {id:'З-4815',ag:'Бектур',shop:'Супермаркет «Береке»',items:[[0,60],[1,40],[4,20],[3,30]],sum:0,st:'hold',route:2},
 {id:'З-4816',ag:'Нурайым',shop:'Магазин у дома «Бакыт»',items:[[3,15],[7,10]],sum:0,st:'new',route:4},
 {id:'З-4817',ag:'Эльмира',shop:'Мини-маркет «Алтын»',items:[[0,20],[2,10]],sum:0,st:'done',route:5}
];
ORD.forEach(o=>o.sum=o.items.reduce((a,[p,q])=>a+PRODUCTS[p].price*q,0));
const OST={new:['новая','var(--acc)'],load:['на погрузке','var(--violet)'],hold:['стоп · долг','var(--bad)'],done:['доставлена','var(--ok)']};

/* ====== МАРШРУТЫ ====== */
const ROUTES=[
 {n:1,drv:'Максат',car:'Hyundai Porter · 01KG 512 AB',stops:11,done:7,sum:186000,cash:142000},
 {n:2,drv:'Улукбек',car:'Газель · 01KG 338 CD',stops:9,done:4,sum:214000,cash:96000},
 {n:3,drv:'Эрлан',car:'Porter · 01KG 907 EF',stops:12,done:9,sum:171000,cash:158000},
 {n:4,drv:'Бекжан',car:'Porter · 01KG 221 GH',stops:8,done:8,sum:124000,cash:124000},
 {n:5,drv:'Азиз',car:'Газель · 01KG 645 IJ',stops:10,done:10,sum:198000,cash:176000}
];
const SC={};
const seeMoney=()=>['Руководитель','Бухгалтер','Кассир'].indexOf(role)>=0;
const tag=(t,c)=>`<span class="tag" style="background:${c}22;color:${c}">${esc(t)}</span>`;
const barHtml=(p,c)=>`<div class="bar"><i style="display:block;height:100%;width:${Math.min(100,Math.max(0,p))}%;background:${c||'var(--brand2)'}"></i></div>`;
const P=i=>PRODUCTS[i];

/* ====== СВОДКА ====== */
SC.dash=()=>{
 const made=SHIFTS.filter(s=>s.c==='Пельменный цех'||s.c==='Упаковка').reduce((a,s)=>a+(s.c==='Упаковка'?0:s.fact),0);
 const sold=ORD.filter(o=>o.st!=='hold').reduce((a,o)=>a+o.items.reduce((x,[p,q])=>x+q,0),0);
 const stock=FG.reduce((a,f)=>a+f.q,0), rev=AGENTS.reduce((a,g)=>a+g.fact,0), debt=AGENTS.reduce((a,g)=>a+g.debt,0);
 return `<div class="hd"><div><h2>Сводка · четверг, 18 сентября 2026</h2>
 <p>Ваши слова: «Произвели десять тысяч, продали восемь, остатки должны выходить постоянно». Здесь так и есть: цеха закрыли смены — приход на склад, водители отметили доставку — расход, остаток сходится сам. Ничего не переносится из таблиц.</p></div>
 <div class="btns"><button class="bt" onclick="go('today')">Что горит</button><button class="bt p" onclick="go('rep')">Отчёт агент × позиция</button></div></div>
<div class="wid">
 <div><small>Произведено вчера</small><b class="a">${fmt(6460)} уп</b><span>3 цеха · 8 смен · брак 1,6%</span></div>
 <div><small>Остаток готовой продукции</small><b>${fmt(stock)} уп</b><span>из них ${fmt(FG.reduce((a,f)=>a+f.res,0))} в резерве под заявки</span></div>
 <div><small>Отгружено сегодня</small><b>${fmt(sold+3200)} уп</b><span>5 маршрутов · 50 точек</span></div>
 <div><small>Выручка за неделю</small><b class="g">${som(rev)}</b><span>24 агента · план ${Math.round(rev/AGENTS.reduce((a,g)=>a+g.plan,0)*100)}%</span></div>
 <div><small>Долги магазинов</small><b class="${debt>150000?'r':'w'}">${som(debt)}</b><span>4 точки на стопе</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 4px">Цеха · смены за вчера</h3>
  <p class="mini" style="margin:0 0 10px">План и факт по каждой смене. Красным — брак выше нормы 2%: это видно утром, а не в конце месяца по таблице.</p>
  ${SHIFTS.map(s=>`<div class="dl" style="--c:${s.scrap>2?'var(--bad)':s.fact<s.plan*0.95?'var(--warn)':'var(--ok)'}" onclick="go('shifts')">
   <div style="flex:1;min-width:0"><b>${esc(s.c)} · ${s.s} смена</b><div class="mini">бригадир ${esc(s.br)} · ${s.men} чел · ${s.h} ч</div></div>
   <div style="width:118px">${barHtml(s.fact/s.plan*100,s.fact>=s.plan?'var(--ok)':'var(--warn)')}<div class="mini" style="text-align:right;margin-top:3px">${fmt(s.fact)} из ${fmt(s.plan)} ${s.unit}</div></div>
   <b class="mono" style="width:64px;text-align:right;color:${s.scrap>2?'var(--bad)':'var(--muted)'}">брак ${s.scrap}%</b></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Сегодня</h3>
   <div class="kv"><span>Заявок от агентов</span><b>${ORD.length+38}</b></div>
   <div class="kv"><span>На стопе из-за долга</span><b style="color:var(--bad)">${ORD.filter(o=>o.st==='hold').length+3}</b></div>
   <div class="kv"><span>Маршрутов в пути</span><b>${ROUTES.filter(r=>r.done<r.stops).length} из ${ROUTES.length}</b></div>
   <div class="kv"><span>Сырьё ниже минимума</span><b style="color:var(--warn)">${RAW.filter(r=>r.q<r.min).length} позиции</b></div>
   <div class="kv" style="border:0"><span>Выручка сдана в кассу</span><b>${som(ROUTES.reduce((a,r)=>a+r.cash,0))}</b></div>
   <button class="bt p" style="width:100%;margin-top:10px" onclick="go('today')">Открыть список</button>
  </div>
  <div class="pan" style="background:var(--rail);color:#dce7ec;border-color:var(--rail)"><h3 style="margin:0 0 7px;color:#fff">Почему остатки сходятся</h3>
   <p class="mini" style="color:#a9bcc8;margin:0">Каждое движение вносит тот, кто его делает, в момент действия: бригадир — выпуск, кладовщик — отпуск, водитель — доставку и возврат. Нет пересчёта в конце дня по бумажкам — нет расхождений.</p></div>
 </div>
</div>
<div class="said"><b>Что здесь главное.</b> Вы говорили, что проверяете людей сами, и «они думают, хорошо работают, а когда я начинаю проверять — выработка маленькая или браков много». На этом экране это видно без проверки: вторая смена пельменного цеха — брак 3,1% и минус 8% к плану. И сам бригадир видит то же самое у себя.</div>`;
};

SC.today=()=>`<div class="hd"><div><h2>Что горит сегодня · 18 сентября</h2>
 <p>Список собирается из отклонений: брак выше нормы, сырьё ниже минимума, магазин с долгом делает заявку, водитель не сдал выручку, смена не закрыта. Если всё в порядке — экран пустой.</p></div>
 <div class="btns"><button class="bt" onclick="toast('В реальной системе нерешённое к вечеру уходит вам в WhatsApp одним сообщением.')">Разобрал</button></div></div>
<div class="g2">
 <div>
  <div class="tsk" style="--c:var(--bad)"><b>Пельменный цех · 2 смена · брак 3,1%</b>
   <p class="mini" style="margin:5px 0 8px">Норма 2%. Бригадир Жылдыз отметила при закрытии причину «тесто рвётся». Тестовой цех 2 смены дал 870 кг при плане 900 — возможно, партия муки. Себестоимость смены выросла на 4 200 сом.</p>
   <button class="bt" onclick="go('output')">Выработка по сменам</button> <button class="bt" onclick="toast('Задача технологу: проверить партию муки ОсОО «Дан-Агро» от 15.09. Списание брака 68 уп проведено по акту, себестоимость учтена.')">Задача технологу</button></div>
  <div class="tsk" style="--c:var(--warn)"><b>Свинина ниже минимума · 420 кг при минимуме 600</b>
   <p class="mini" style="margin:5px 0 8px">Хватит на 1 день при текущем плане. Поставщик ИП Осмонов — срок поставки 1 день. Система уже собрала заявку.</p>
   <button class="bt p" onclick="toast('Заявка поставщику отправлена: свинина шея 800 кг, ИП Осмонов, на завтра к 07:00. Цена по последней закупке 470 сом/кг.')">Заказать 800 кг</button></div>
  <div class="tsk" style="--c:var(--bad)"><b>«Береке» · долг 88 000 сом · заявка на 41 400 сом на стопе</b>
   <p class="mini" style="margin:5px 0 8px">Агент Бектур собрал заявку, система остановила: долг больше лимита 50 000 и старше 7 дней. Нужно ваше решение — отгрузить или ждать оплаты.</p>
   <button class="bt" onclick="toast('Разрешено под вашу ответственность: заявка ушла на погрузку в маршрут № 2, лимит для «Береке» временно 130 000. Отметка в карточке магазина: кто и когда разрешил.')">Отгрузить</button> <button class="bt" onclick="toast('Заявка удержана до оплаты. Бектуру ушло сообщение: собрать 88 000 сом при следующем визите, иначе точка на стопе.')">Ждать оплаты</button></div>
 </div>
 <div>
  <div class="tsk" style="--c:var(--violet)"><b>Маршрут № 2 · Улукбек · 4 из 9 точек, 12:40</b>
   <p class="mini" style="margin:5px 0 8px">Отстаёт от обычного графика на час. Две точки приняли частично — возврат 14 уп «Сибирских». Выручка на руках 96 000 сом.</p>
   <button class="bt" onclick="go('routes')">Открыть маршрут</button></div>
  <div class="tsk" style="--c:var(--acc)"><b>Плёнка упаковочная · 14 рулонов при минимуме 20</b>
   <p class="mini" style="margin:5px 0 8px">Хватит на 5 дней. Поставщик ОсОО «ПакСервис», срок 5 дней — заказывать сегодня.</p>
   <button class="bt" onclick="toast('Заявка на 40 рулонов отправлена. Придёт 23.09, до этого хватает.')">Заказать</button></div>
  <div class="tsk" style="--c:var(--warn)"><b>Мясной цех · 1 смена не закрыта</b>
   <p class="mini" style="margin:5px 0 8px">Смена закончилась в 16:00, бригадир Нурбек не нажал «закрыть». Без этого фарш не оприходован, пельменный цех третьей смены не сможет списать сырьё.</p>
   <button class="bt" onclick="toast('Нурбеку отправлено напоминание в WhatsApp со ссылкой на экран закрытия смены — одна кнопка.')">Напомнить</button></div>
  <div class="note" style="--tone:var(--brand)"><b>Откуда список</b><p class="mini" style="margin:5px 0 0">Никто его не составляет. Система сравнивает факт с планом, остатки с минимумами, долги с лимитами — и показывает только расхождения.</p></div>
 </div>
</div>`;

/* ====== ЦЕХА И СМЕНЫ ====== */
SC.shifts=()=>`<div class="hd"><div><h2>Цеха и смены · 17 сентября</h2>
 <p>Три производственных цеха и упаковка, до трёх смен. Каждая смена закрывается бригадиром с телефона: что произвели, сколько часов, сколько людей, брак. Из этого — приход на склад, списание сырья по техкарте, выработка и зарплата.</p></div>
 <div class="btns"><div class="ptabs" style="margin:0"><button class="ptab on">17.09</button><button class="ptab" onclick="toast('Переключение на другой день. История смен хранится бессрочно — по любому дню видно, кто, сколько и с каким браком.')">16.09</button><button class="ptab" onclick="toast('Неделя: план 42 800 уп, факт 41 950, брак 1,7%. По цехам и сменам.')">Неделя</button></div><button class="bt" onclick="toast('Новый цех добавляется кнопкой: название, продукция, техкарты, бригадиры, смены. Ваши слова: «я ещё линию производства собираюсь поставить» — это не переделка системы, а настройка.')">+ Цех</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['ЦЕХ','СМЕНА','БРИГАДИР','ЛЮДЕЙ','ПЛАН','ФАКТ','%','БРАК','СТАТУС'].map((h,i)=>`<th style="text-align:${i>2?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${SHIFTS.map(s=>{const p=Math.round(s.fact/s.plan*100);return `<tr><td style="padding:8px"><b>${esc(s.c)}</b></td><td class="mono" style="padding:8px">${s.s}</td><td style="padding:8px">${esc(s.br)}</td>
  <td class="mono" style="text-align:right;padding:8px">${s.men}</td><td class="mono" style="text-align:right;padding:8px">${fmt(s.plan)}</td><td class="mono" style="text-align:right;padding:8px"><b>${fmt(s.fact)}</b> ${s.unit}</td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:700;color:${p>=100?'var(--ok)':p>=95?'var(--warn)':'var(--bad)'}">${p}%</td>
  <td class="mono" style="text-align:right;padding:8px;color:${s.scrap>2?'var(--bad)':'var(--muted)'}">${s.scrap}%</td>
  <td style="text-align:right;padding:8px">${s.c==='Мясной цех'&&s.s===1?tag('не закрыта','var(--warn)'):tag('закрыта','var(--ok)')}</td></tr>`}).join('')}</tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Цепочка цехов</h3><p class="mini" style="margin:0">Мясной цех выпускает фарш — он приходует на промежуточный склад. Тестовой — тесто. Пельменный берёт фарш и тесто по техкарте и выпускает пельмени. Упаковка — готовые упаковки на склад. Списание сырья идёт по факту выпуска, не по плану.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Три смены</h3><p class="mini" style="margin:0">У каждой смены свой бригадир и свои цифры. Когда третья смена выпускает меньше при тех же людях — видно сразу, и не «в целом по цеху», а по конкретной смене и бригадиру.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Что делает бригадир</h3><p class="mini" style="margin:0">Три кнопки: закрыть смену, списать брак, запросить сырьё. Ваши слова: «бригадиру три функции — все три открыли, и ему удобно». Экран справа в меню — «Закрытие смены».</p></div>
</div>`;

/* ====== ЗАКРЫТИЕ СМЕНЫ ====== */
SC.close=()=>`<div class="hd"><div><h2>Закрытие смены · бригадир · телефон</h2>
 <p>Ваши слова: «В конце дня смену закрывают, люди отмечают — работал столько часов, произвели столько-то, этих штук, этих штук — и всё сразу в базу». Здесь это одна кнопка и три числа. Никаких таблиц.</p></div>
 <div class="btns"><button class="bt" onclick="go('mobile')">Как это на телефоне →</button></div></div>
<div style="display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start">
 <div class="phone">
  <div style="background:var(--rail);color:#fff;padding:13px 15px">
   <div style="font-size:9.6px;color:#8fa3b0;letter-spacing:.08em">ЧЕТВЕРГ, 18 СЕНТЯБРЯ · 1 СМЕНА</div>
   <b style="font-size:14px;display:block;margin-top:3px">Пельменный цех · Бакыт</b>
   <div style="font-size:10.4px;color:#a9bcc8;margin-top:2px">план 2 400 уп · 9 человек</div>
  </div>
  <div style="padding:13px">
   <button class="bt p" style="width:100%;padding:13px;font-size:13px;margin-bottom:8px" onclick="closeShift()">Закрыть смену</button>
   <button class="bt" style="width:100%;padding:13px;font-size:13px;margin-bottom:8px" onclick="toast('Списание брака: продукт, количество, причина из списка (тесто рвётся, фарш, оборудование, упаковка). Фото — по желанию. Уходит в себестоимость смены.')">Списать брак</button>
   <button class="bt" style="width:100%;padding:13px;font-size:13px" onclick="toast('Запрос сырья со склада: фарш 300 кг, тесто 250 кг — кладовщик увидит и отпустит, списание пройдёт по накладной, не «на словах».')">Запросить сырьё</button>
   <div style="border-top:1px solid var(--line);margin-top:13px;padding-top:11px">
    <div class="mini" style="font-weight:700;margin-bottom:6px">Смена сегодня</div>
    <div class="kv" style="font-size:11px;padding:5px 0"><span>Вышло людей</span><b>9 из 9</b></div>
    <div class="kv" style="font-size:11px;padding:5px 0"><span>Получено фарша</span><b>640 кг</b></div>
    <div class="kv" style="font-size:11px;padding:5px 0;border:0"><span>Получено теста</span><b>520 кг</b></div>
   </div>
   <div style="background:var(--ok-l);border-radius:6px;padding:9px 11px;margin-top:11px">
    <div class="mini" style="color:var(--ok);font-weight:700">Ваша выработка вчера</div>
    <div class="mini" style="margin-top:3px">2 460 уп при плане 2 400 · 103% · брак 1,4% · лучшая смена недели</div>
   </div>
  </div>
 </div>
 <div style="flex:1;min-width:330px">
  <div class="pan"><h3 style="margin:0 0 8px">Что происходит по кнопке «Закрыть смену»</h3>
   <div class="num"><i>1</i><div><b>Приход на склад готовой продукции</b><p>2 460 упаковок «Домашних» и «Сибирских» появляются в остатках — кладовщик видит их сразу.</p></div></div>
   <div class="num"><i>2</i><div><b>Списание сырья по техкарте</b><p>Фарш, тесто, специи, плёнка — по норме на фактический выпуск. Расхождение с тем, что выдал склад, — отдельной строкой.</p></div></div>
   <div class="num"><i>3</i><div><b>Выработка и зарплата</b><p>Каждому из 9 человек — доля выработки по смене. Бригадир видит итог смены, каждый рабочий — свою строку в кабинете.</p></div></div>
   <div class="num"><i>4</i><div><b>Вам — в сводку</b><p>План-факт, брак, себестоимость смены. Без пересчёта из таблицы.</p></div></div>
  </div>
  <div class="said"><b>Ваши слова:</b> «Люди не понимают, что плохо работают, пока в таблицу не посчитают». Здесь бригадир видит свой процент и брак в момент закрытия смены — зелёная плашка внизу телефона. Это не отчёт для вас, это обратная связь ему.</div>
 </div>
</div>`;

/* ====== ТЕХКАРТЫ ====== */
SC.tech=()=>`<div class="hd"><div><h2>Техкарты и рецептуры</h2>
 <p>Норма сырья на единицу продукции. По ней списывается сырьё при закрытии смены и считается себестоимость. Ваши слова: «рецептуру поменяю, и можно под любой бизнес подстроить» — техкарта правится здесь, кнопкой, без программиста.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новый продукт: название, единица, цена, техкарта из сырья с нормами. После сохранения появляется в цехах, на складе, у агентов и в отчётах.')">+ Продукт</button><button class="bt p" onclick="toast('Техкарта «Домашних» открыта на правку. Изменение нормы фарша с 0,55 до 0,52 кг: себестоимость упаковки 268 → 254 сом, маржа 35% → 38%. Применится к сменам с завтрашнего дня, история версий хранится.')">Изменить норму</button></div></div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Пельмени «Домашние» 1 кг · себестоимость 268 сом</h3>
  <table class="t" style="font-size:11.4px">
   <thead><tr style="border-bottom:1.5px solid var(--line2)">${['СЫРЬЁ','НОРМА НА УП','ЦЕНА','НА УП, СОМ','ДОЛЯ'].map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:7px 8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
   <tbody>${[['Фарш (говядина 60 / свинина 40)','0,55 кг',372,204.6],['Тесто (мука, яйцо, вода, соль)','0,48 кг',58,27.8],['Лук репчатый','0,08 кг',35,2.8],['Специи, смесь № 2','0,004 кг',640,2.6],['Плёнка и этикетка','1 шт',9,9.0],['Электроэнергия и амортизация','—',0,12.4],['Труд · по выработке','—',0,8.8]]
    .map(([n,q,p,s])=>`<tr><td style="padding:7px 8px">${n}</td><td class="mono" style="text-align:right;padding:7px 8px">${q}</td><td class="mono" style="text-align:right;padding:7px 8px">${p?fmt(p):'—'}</td><td class="mono" style="text-align:right;padding:7px 8px">${num(s)}</td><td style="padding:7px 8px;width:90px">${barHtml(s/268*100,'var(--brand)')}</td></tr>`).join('')}</tbody>
   <tfoot><tr style="border-top:1.5px solid var(--line2);font-weight:800"><td colspan="3" style="padding:8px">Себестоимость упаковки · цена 410 · маржа 35%</td><td class="mono" style="text-align:right;padding:8px">268</td><td></td></tr></tfoot>
  </table>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Все продукты</h3>
   ${PRODUCTS.map(p=>`<div class="kv"><span>${esc(p.n)}</span><b class="mono">${p.cost} → ${p.price} · ${Math.round((p.price-p.cost)/p.price*100)}%</b></div>`).join('')}
   <p class="mini" style="margin:8px 0 0">Себестоимость → цена → маржа. Пересчитывается при каждой закупке по новой цене сырья.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Когда цена сырья меняется</h3><p class="mini" style="margin:0">Закупили говядину по 560 вместо 520 — себестоимость «Домашних» станет 286, маржа упадёт до 30%. Система покажет это в день закупки, а не когда бухгалтер закроет месяц. Решение о цене — за вами, но вовремя.</p></div>
 </div>
</div>`;

/* ====== ВЫРАБОТКА И БРАК ====== */
SC.output=()=>`<div class="hd"><div><h2>Выработка и брак · сентябрь</h2>
 <p>Ваши слова: «Я проверяю — они думают, хорошо работают, а получается плохо: выработка маленькая или браков много. Чтобы они тоже наглядно видели, как работают, и чтоб я видел». Один экран для обеих сторон.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Выгружено: выработка по сменам, бригадирам и рабочим, брак по причинам, себестоимость. По цехам за месяц.')">В Excel</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Выпуск за месяц</small><b class="a">${fmt(98400)} уп</b><span>план ${fmt(102000)} · 96%</span></div>
 <div><small>Брак</small><b class="w">1,7%</b><span>норма 2% · 1 680 уп · 442 000 сом</span></div>
 <div><small>Лучшая смена</small><b class="g">Пельменный · 1</b><span>Бакыт · 103% · брак 1,4%</span></div>
 <div><small>Худшая смена</small><b class="r">Пельменный · 2</b><span>Жылдыз · 92% · брак 3,1%</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Бригадиры и смены · сентябрь</h3>
  ${[['Бакыт','Пельменный · 1',103,1.4],['Азамат','Пельменный · 3',99,1.1],['Жылдыз','Пельменный · 2',92,3.1],['Нурбек','Мясной · 1',98,1.2],['Талант','Мясной · 2',91,2.8],['Айгерим','Тестовой · 1',102,0.6],['Мирлан','Тестовой · 2',97,0.9],['Чынара','Упаковка',100,0.3]]
   .map(([n,c,p,s])=>`<div class="fr" style="grid-template-columns:200px 1fr 110px"><span><b>${n}</b> <span class="mini">· ${c}</span></span>${barHtml(p,p>=100?'var(--ok)':p>=95?'var(--brand2)':'var(--bad)')}<b class="mono" style="text-align:right;color:${s>2?'var(--bad)':'inherit'}">${p}% · брак ${s}%</b></div>`).join('')}
  <div class="hint"><b>Две смены выпадают одинаково.</b> Мясной цех 2 смена (Талант) и пельменный 2 смена (Жылдыз) — обе вторые, обе с браком выше нормы. Причина скорее в сырье второй половины дня или в оборудовании, чем в людях. Это вывод, который таблица не покажет.</div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Брак по причинам</h3>
   ${[['Тесто рвётся',38],['Недовес / перевес',24],['Упаковка',18],['Фарш · консистенция',14],['Оборудование',6]].map(([n,p])=>`<div class="fr" style="grid-template-columns:130px 1fr 40px"><span style="font-size:11px">${n}</span>${barHtml(p*2.2,'var(--bad)')}<b class="mono" style="text-align:right">${p}%</b></div>`).join('')}
   <p class="mini" style="margin:8px 0 0">Причину выбирает бригадир из списка при списании. Список — ваш.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Что видит рабочий</h3>
   <p class="mini" style="margin:0">В своём кабинете: смены за месяц, своя доля выработки, брак по своей смене, начисленная по выработке зарплата. Ваши слова: «чтобы они тоже наглядно видели». Это не наказание — это то, что делает разговор о зарплате предметным.</p>
  </div>
 </div>
</div>`;
/* ====== СКЛАД СЫРЬЯ ====== */
SC.raw=()=>`<div class="hd"><div><h2>Склад сырья</h2>
 <p>Приход от поставщиков, отпуск в цеха по запросу бригадира, списание по техкарте при закрытии смены. Минимальный остаток по каждой позиции — система сама говорит, что и когда заказать.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Приход: поставщик, позиции, количество, цена, накладная фото. Цена обновляет себестоимость продукции с этой партии.')">+ Приход</button><button class="bt p" onclick="go('plan')">План закупа</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['СЫРЬЁ','ОСТАТОК','МИНИМУМ','ХВАТИТ НА','ЦЕНА','ПОСТАВЩИК','СРОК ПОСТАВКИ','СИГНАЛ'].map((h,i)=>`<th style="text-align:${i>=1&&i<=4||i===6?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${RAW.map(r=>{const low=r.q<r.min,crit=r.days<=r.days&&r.days<=2&&low;return `<tr><td style="padding:8px"><b>${esc(r.n)}</b></td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:700;color:${low?'var(--bad)':'inherit'}">${fmt(r.q)} ${r.u}</td><td class="mono" style="text-align:right;padding:8px;color:var(--muted)">${fmt(r.min)}</td>
  <td class="mono" style="text-align:right;padding:8px">${r.days} дн</td><td class="mono" style="text-align:right;padding:8px">${fmt(r.price)}</td><td style="padding:8px">${esc(r.sup)}</td>
  <td class="mono" style="text-align:right;padding:8px">${r.days<=2?'1 день':r.n.indexOf('Плёнка')>=0?'5 дней':'2 дня'}</td>
  <td style="text-align:right;padding:8px">${low?tag('заказать','var(--bad)'):r.days<5?tag('следить','var(--warn)'):tag('норма','var(--ok)')}</td></tr>`}).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Отпуск в цех — по накладной, не на словах</h3><p class="mini" style="margin:0">Бригадир запрашивает с телефона «фарш 300 кг», кладовщик отпускает — движение записано с двух сторон. Ваши слова: «на складе кто отпускает — чуть-чуть пишет: Султан забрал столько». Теперь это не запись в тетради, а строка, которая сходится с закрытием смены.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Расхождение выдано / списано</h3><p class="mini" style="margin:0">Склад выдал 640 кг фарша, по техкарте на выпуск смены ушло 618. Разница 22 кг — либо перерасход, либо остаток в цеху. Видно в день смены, а не при инвентаризации через месяц.</p></div>
</div>`;

/* ====== ГОТОВАЯ ПРОДУКЦИЯ ====== */
SC.fg=()=>`<div class="hd"><div><h2>Склад готовой продукции</h2>
 <p>Ваши слова: «Произвели десять тысяч, продали восемь тысяч — остатки должны выходить постоянно». Здесь остаток по каждому продукту прямо сейчас: сколько всего, сколько в резерве под заявки агентов, сколько свободно.</p></div>
 <div class="btns"><button class="bt" onclick="go('inv')">Инвентаризация</button><button class="bt p" onclick="go('moves')">Отпуск водителям</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Всего на складе</small><b class="a">${fmt(FG.reduce((a,f)=>a+f.q,0))} уп</b><span>8 продуктов</span></div>
 <div><small>В резерве под заявки</small><b>${fmt(FG.reduce((a,f)=>a+f.res,0))} уп</b><span>на завтрашние маршруты</span></div>
 <div><small>Свободно</small><b class="g">${fmt(FG.reduce((a,f)=>a+f.q-f.res,0))} уп</b><span>можно продавать</span></div>
 <div><small>Продажи в день</small><b>${fmt(FG.reduce((a,f)=>a+f.day,0))} уп</b><span>среднее за неделю</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['ПРОДУКТ','ОСТАТОК','РЕЗЕРВ','СВОБОДНО','ПРОДАЖИ / ДЕНЬ','ХВАТИТ НА','СРОК ГОДНОСТИ','СИГНАЛ'].map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${FG.map(f=>{const p=PRODUCTS[f.p],free=f.q-f.res,d=Math.round(free/f.day*10)/10;return `<tr><td style="padding:8px"><b>${esc(p.n)}</b></td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:700">${fmt(f.q)}</td><td class="mono" style="text-align:right;padding:8px;color:var(--muted)">${fmt(f.res)}</td><td class="mono" style="text-align:right;padding:8px">${fmt(free)}</td>
  <td class="mono" style="text-align:right;padding:8px">${fmt(f.day)}</td><td class="mono" style="text-align:right;padding:8px;color:${d<1.5?'var(--bad)':d<3?'var(--warn)':'inherit'}">${d} дн</td><td class="mono" style="text-align:right;padding:8px;color:var(--muted)">${p.shelf}</td>
  <td style="text-align:right;padding:8px">${d<1.5?tag('план цеху','var(--bad)'):d>6?tag('затоварено','var(--warn)'):tag('норма','var(--ok)')}</td></tr>`}).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Остаток → план цеху</h3><p class="mini" style="margin:0">Хинкали: свободно 370 уп при продажах 280 в день — на 1,3 дня. Система предлагает пельменному цеху увеличить план по хинкали на завтра. Вареники: 1 760 свободно при 390 в день — 4,5 дня, план можно снизить. Производство подстраивается под продажи, а не наоборот.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Партии и сроки</h3><p class="mini" style="margin:0">Каждая смена — партия с датой. Отпуск водителям идёт с самой старой партии. Партия, у которой осталось меньше 30 дней срока, подсвечивается — успеть продать со скидкой, а не списать.</p></div>
</div>`;

/* ====== ОТПУСК И ПЕРЕМЕЩЕНИЯ ====== */
SC.moves=()=>`<div class="hd"><div><h2>Отпуск и перемещения · сегодня</h2>
 <p>Кладовщик грузит водителя по заявкам маршрута — накладная собирается сама из заявок агентов. Водитель принял — подтвердил в телефоне. Что не приняли в магазине — вернулось на склад той же накладной.</p></div>
 <div class="btns"><button class="bt p" onclick="loadRoute()">Собрать накладную · маршрут № 3</button></div></div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Движения за день</h3>
  ${[['06:10','приход','Упаковка · 1 смена → склад ГП','4 020 уп','Чынара','ok'],['06:40','отпуск','Склад ГП → маршрут № 1 · Максат','1 860 уп · 11 точек','Айбек','ok'],['06:55','отпуск','Склад ГП → маршрут № 3 · Эрлан','1 710 уп · 12 точек','Айбек','ok'],['07:20','отпуск','Склад сырья → пельменный цех · 1 смена','фарш 640 кг · тесто 520 кг','Айбек','ok'],['11:30','возврат','Маршрут № 2 → склад ГП','14 уп «Сибирские» · не приняли','Улукбек','warn'],['13:05','приход','ИП Осмонов → склад сырья','свинина 800 кг · 376 000 сом','Айбек','ok'],['14:15','отпуск','Склад ГП → маршрут № 2 · Улукбек · дозагрузка','120 уп «Домашние»','Айбек','ok']]
   .map(([t,k,w,q,who,s])=>`<div class="srow" style="border-left:3px solid ${s==='ok'?'var(--ok)':'var(--warn)'}"><b class="mono" style="width:44px;font-size:10.6px">${t}</b>${tag(k,k==='приход'?'var(--ok)':k==='возврат'?'var(--warn)':'var(--acc)')}<div style="flex:1"><b>${esc(w)}</b><div class="mini">${esc(q)} · ${esc(who)}</div></div></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Накладная маршрута № 3</h3>
   ${ORD.filter(o=>o.route===3).map(o=>`<div class="kv"><span>${esc(o.shop)}</span><b class="mono">${o.items.reduce((a,[p,q])=>a+q,0)} уп · ${som(o.sum)}</b></div>`).join('')}
   <div class="kv" style="border:0"><span>+ ещё 10 точек</span><b class="mono">1 588 уп</b></div>
   <p class="mini" style="margin:8px 0 0">Водитель видит её в телефоне по точкам: что и куда. Кладовщик — итог по продуктам для погрузки.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Подтверждение с двух сторон</h3><p class="mini" style="margin:0">Кладовщик отпустил 1 710 — водитель подтвердил 1 710. Если водитель ставит 1 690, расхождение 20 уп видно сразу и разбирается на месте, а не в конце месяца. Ваши слова: «сколько этот водитель забрал — и это тоже туда».</p></div>
 </div>
</div>`;

/* ====== ИНВЕНТАРИЗАЦИЯ ====== */
SC.inv=()=>`<div class="hd"><div><h2>Инвентаризация</h2>
 <p>Ваши слова: «Инвентаризация обязательно должна быть». Учётный остаток система знает всегда; при инвентаризации кладовщик вводит фактический — расхождения считаются сами, по партиям и по датам.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Инвентаризация склада ГП начата: 8 позиций, учётные остатки зафиксированы на 14:30. Кладовщик вводит факт с телефона по каждой позиции; отпуск на время пересчёта блокируется.')">Начать инвентаризацию</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['ПРОДУКТ','УЧЁТ','ФАКТ','РАЗНИЦА','В СОМАХ','ПРИЧИНА'].map((h,i)=>`<th style="text-align:${i&&i<5?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[[0,3420,3412,'пересорт с «Сибирскими»'],[1,2860,2871,'пересорт'],[2,1120,1120,''],[3,2240,2226,'бой упаковки · 14'],[4,690,690,''],[5,1540,1538,''],[6,880,880,''],[7,410,404,'списать · срок']]
  .map(([i,u,f,r])=>{const d=f-u,p=PRODUCTS[i];return `<tr><td style="padding:8px"><b>${esc(p.n)}</b></td><td class="mono" style="text-align:right;padding:8px">${fmt(u)}</td><td class="mono" style="text-align:right;padding:8px">${fmt(f)}</td>
   <td class="mono" style="text-align:right;padding:8px;font-weight:700;color:${d===0?'var(--ok)':d<0?'var(--bad)':'var(--warn)'}">${d>0?'+':''}${d}</td><td class="mono" style="text-align:right;padding:8px;color:var(--muted)">${d?fmt(d*p.cost):'—'}</td><td style="padding:8px;color:var(--muted)">${r||'—'}</td></tr>`}).join('')}</tbody>
 <tfoot><tr style="border-top:1.5px solid var(--line2);font-weight:800"><td style="padding:8px">Итого · 8 позиций</td><td class="mono" style="text-align:right;padding:8px">13 160</td><td class="mono" style="text-align:right;padding:8px">13 141</td><td class="mono" style="text-align:right;padding:8px;color:var(--bad)">−19</td><td class="mono" style="text-align:right;padding:8px">−4 780 сом</td><td style="padding:8px">0,14%</td></tr></tfoot>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Последняя инвентаризация · 31.08</h3><p class="mini" style="margin:0">Расхождение 0,14% — это нормально для склада, где каждое движение вносится в момент действия. При учёте в таблицах расхождение обычно 2–5%, и никто не знает, где именно.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Склад сырья — тоже</h3><p class="mini" style="margin:0">Тот же экран для сырья: мясо взвешивается, мука по мешкам. Расхождение по фаршу между складом и цехом — отдельный отчёт, который показывает, в какой смене расходится больше.</p></div>
</div>`;

/* ====== АГЕНТЫ ====== */
SC.agents=()=>`<div class="hd"><div><h2>Агенты и районы · неделя</h2>
 <p>Двадцать четыре агента по районам Бишкека. У каждого — свои магазины, свой план, свои заявки, свои долги. Ваши слова: «у агентов одинаково всё будет, просто разные люди — у кого один район, у кого второй, и мы сами делим».</p></div>
 <div class="btns"><button class="bt" onclick="toast('Команды агентов делятся кнопкой: новая команда, руководитель, районы. Ваши слова: «команды продажников буду делить, потому что ассортимент будет расти». Это настройка, не переделка.')">Разделить команды</button><button class="bt p" onclick="go('rep')">Отчёт по агенту</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['АГЕНТ','РАЙОН','МАГАЗИНОВ','ВИЗИТОВ СЕГОДНЯ','ПЛАН НЕДЕЛИ','ФАКТ','%','ДОЛГИ ТОЧЕК'].map((h,i)=>`<th style="text-align:${i>1?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${AGENTS.map(a=>{const p=Math.round(a.fact/a.plan*100);return `<tr><td style="padding:8px"><b>${esc(a.n)}</b></td><td style="padding:8px">${esc(a.d)}</td><td class="mono" style="text-align:right;padding:8px">${a.shops}</td><td class="mono" style="text-align:right;padding:8px">${a.today}</td>
  <td class="mono" style="text-align:right;padding:8px;color:var(--muted)">${fmt(a.plan)}</td><td class="mono" style="text-align:right;padding:8px"><b>${fmt(a.fact)}</b></td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:700;color:${p>=100?'var(--ok)':p>=90?'var(--warn)':'var(--bad)'}">${p}%</td>
  <td class="mono" style="text-align:right;padding:8px;color:${a.debt>50000?'var(--bad)':'var(--muted)'}">${a.debt?fmt(a.debt):'—'}</td></tr>`}).join('')}
 <tr><td style="padding:8px;color:var(--muted)" colspan="8">+ ещё 18 агентов</td></tr></tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Агент видит только своё</h3><p class="mini" style="margin:0">Свои магазины, свои заявки, долги своих точек и свои продажи по позициям. Чужие районы и общая выручка закрыты — ваши слова про коммерческую тайну.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Заявка с телефона в магазине</h3><p class="mini" style="margin:0">Агент открывает магазин, видит его прошлые заявки и долг, набирает позиции. Если долг выше лимита — заявка уходит вам на решение, а не на погрузку.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Агент Плюс остаётся или нет</h3><p class="mini" style="margin:0">Если удобно — интегрируемся с Агент Плюс и забираем заявки оттуда. Если нет — агенты работают в нашем экране, и Агент Плюс не нужен. Решаете вы, страница «1С и Агент Плюс».</p></div>
</div>`;

/* ====== ЗАЯВКИ ====== */
SC.orders=()=>`<div class="hd"><div><h2>Заявки агентов · сегодня</h2>
 <p>Заявка из магазина попадает в систему в момент, когда агент нажал «отправить». Дальше — резерв на складе, накладная маршрута, погрузка, доставка. Сейчас у вас между этим — выгрузка, обработка операционистом и распределение по водителям руками.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Заявки сгруппированы по маршрутам на завтра: 5 маршрутов, 50 точек, 8 640 уп. Операционист не нужен — распределение по районам и загрузке машин делает система, вы только подтверждаете.')">Сформировать маршруты</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Заявок сегодня</small><b class="a">${ORD.length+38}</b><span>от 24 агентов</span></div>
 <div><small>На сумму</small><b>${som(ORD.reduce((a,o)=>a+o.sum,0)+486000)}</b><span>${fmt(8640)} уп</span></div>
 <div><small>На стопе · долг</small><b class="r">${ORD.filter(o=>o.st==='hold').length+3}</b><span>ждут решения</span></div>
 <div><small>Нет на складе</small><b class="w">1</b><span>хинкали · 20 уп из 20</span></div>
</div>
<div class="pan">${ORD.map(o=>`<div class="dl" style="--c:${OST[o.st][1]}">
 <b class="mono" style="width:56px;font-size:10.6px">${o.id}</b>
 <div style="flex:1;min-width:0"><b>${esc(o.shop)}</b><div class="mini">агент ${esc(o.ag)} · ${o.items.map(([p,q])=>esc(PRODUCTS[p].n.split(' ')[0]+' '+PRODUCTS[p].n.split(' ')[1]||'')+' × '+q).join(', ')}</div></div>
 <b class="mono" style="width:100px;text-align:right">${som(o.sum)}</b>
 <span class="mini" style="width:80px;text-align:right">маршрут ${o.route}</span>
 ${tag(OST[o.st][0],OST[o.st][1])}</div>`).join('')}
 <div class="mini" style="padding:8px 4px 0">+ ещё 38 заявок</div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Заявка на стопе</h3><p class="mini" style="margin:0">«Береке»: долг 88 000 сом старше 7 дней, лимит 50 000. Агент собрал заявку — система её не пропустила и подняла вам. Правило: лимит и срок — настраиваете вы, по сети и по точке.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Резерв на складе</h3><p class="mini" style="margin:0">Как только заявка принята, продукция резервируется. Два агента не продадут одни и те же 20 упаковок хинкали: второму система покажет «нет на складе» и предложит замену.</p></div>
</div>`;

/* ====== МАГАЗИНЫ ====== */
SC.shops=()=>`<div class="hd"><div><h2>Магазины</h2>
 <p>Каждая точка — карточка: агент, история заявок, что берут, что возвращают, долг, лимит. Сеть — группа точек с общим договором. Ваши слова: «какие магазины он продал, в каждом магазине сколько продал» — отсюда и из отчёта.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новый магазин: название, адрес, агент, лимит долга, сеть. Агент может добавить точку сам с телефона — вы утверждаете.')">+ Магазин</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['МАГАЗИН','АДРЕС','АГЕНТ','СЕТЬ','ЗА НЕДЕЛЮ','ПОСЛЕДНЯЯ ПОСТАВКА','ДОЛГ'].map((h,i)=>`<th style="text-align:${i>3?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${SHOPS.map(s=>`<tr><td style="padding:8px"><b>${esc(s.n)}</b></td><td style="padding:8px;color:var(--muted)">${esc(s.a)}</td><td style="padding:8px">${esc(s.ag)}</td><td style="padding:8px">${s.net==='сеть'?tag('сеть','var(--acc)'):'—'}</td>
  <td class="mono" style="text-align:right;padding:8px">${som(s.week)}</td><td class="mono" style="text-align:right;padding:8px">${s.last}</td><td class="mono" style="text-align:right;padding:8px;font-weight:700;color:${s.debt>50000?'var(--bad)':s.debt?'var(--warn)':'var(--ok)'}">${s.debt?som(s.debt):'нет'}</td></tr>`).join('')}
 <tr><td style="padding:8px;color:var(--muted)" colspan="7">+ ещё 151 магазин</td></tr></tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 8px">Карточка «Береке» · Ак-Орго</h3>
  <div class="kv"><span>Агент</span><b>Бектур</b></div>
  <div class="kv"><span>Средний заказ</span><b class="mono">36 200 сом / нед</b></div>
  <div class="kv"><span>Берут чаще всего</span><b>«Домашние», «Сибирские», хинкали</b></div>
  <div class="kv"><span>Возвраты за месяц</span><b>3 · 28 уп</b></div>
  <div class="kv"><span>Долг</span><b style="color:var(--bad)">88 000 · с 11.09</b></div>
  <div class="kv" style="border:0"><span>Лимит</span><b>50 000</b></div>
 </div>
 <div class="pan"><h3 style="margin:0 0 6px">Точка, которая не берёт</h3><p class="mini" style="margin:0">Магазин без заявок 14 дней подсвечивается агенту и вам: либо его переманили, либо агент перестал заходить. Из 159 точек таких сейчас 6. Раньше это замечали, когда выручка района уже упала.</p></div>
</div>`;

/* ====== ДОЛГИ ====== */
SC.debts=()=>`<div class="hd"><div><h2>Долги магазинов</h2>
 <p>Ваши слова: «где-то в долг оставил». Долг возникает в момент, когда водитель отметил «отдал без денег» — не после сверки в конце месяца. По каждому долгу видно: кто оставил, когда, кто должен собрать.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Агентам ушёл список: у Бектура 3 точки на 88 000, у Санжара 2 на 64 000, у Тилека 1 на 41 000. Собрать при следующем визите, иначе точка на стопе.')">Напомнить агентам</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Всего долгов</small><b class="r">${som(AGENTS.reduce((a,g)=>a+g.debt,0)+96000)}</b><span>17 точек</span></div>
 <div><small>Старше 7 дней</small><b class="w">${som(193000)}</b><span>6 точек · на стопе</span></div>
 <div><small>Собрано за неделю</small><b class="g">${som(142000)}</b><span>агентами и водителями</span></div>
 <div><small>Доля от выручки</small><b>4,1%</b><span>норма до 5%</span></div>
</div>
<div class="pan">${SHOPS.filter(s=>s.debt).sort((a,b)=>b.debt-a.debt).map(s=>{const days={88000:7,64000:6,41000:4,19000:2,12000:3}[s.debt]||1;return `<div class="dl" style="--c:${days>=7?'var(--bad)':'var(--warn)'}">
 <div style="flex:1"><b>${esc(s.n)}</b><div class="mini">${esc(s.a)} · агент ${esc(s.ag)} · оставил водитель при поставке ${s.last}</div></div>
 <b class="mono" style="width:100px;text-align:right">${som(s.debt)}</b><span class="mini" style="width:60px;text-align:right">${days} дн</span>
 ${days>=7?tag('стоп','var(--bad)'):tag('собрать','var(--warn)')}</div>`}).join('')}</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Правило стопа</h3><p class="mini" style="margin:0">Долг больше лимита или старше N дней — новые заявки этой точки не уходят на погрузку без вашего решения. Лимит по сети и по точке разный. Настройка — ваша.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Кто собирает</h3><p class="mini" style="margin:0">Деньги за прошлую поставку берёт водитель при следующей или агент при визите. Кто взял — отмечает в телефоне, долг закрывается, сумма ждёт сдачи в кассу. Кассир видит, у кого на руках сколько.</p></div>
</div>`;
/* ====== МАРШРУТЫ ====== */
SC.routes=()=>`<div class="hd"><div><h2>Маршруты и экспедиторы · сегодня</h2>
 <p>Пять машин, пятьдесят точек. Маршрут собирается из заявок агентов по районам. Водитель ведёт его в телефоне: доставил, приняли частично, вернули, деньги. Вы видите, где каждая машина, без звонков.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Маршруты на завтра сформированы из 44 заявок по районам и загрузке машин. Порядок точек — по адресам. Правится перетаскиванием.')">Маршруты на завтра</button></div></div>
<div class="pan">${ROUTES.map(r=>`<div class="dl" style="--c:${r.done===r.stops?'var(--ok)':r.done<r.stops/2?'var(--warn)':'var(--acc)'}" onclick="go('driver')">
 <b class="mono" style="width:30px">№ ${r.n}</b>
 <div style="flex:1;min-width:0"><b>${esc(r.drv)}</b><div class="mini">${esc(r.car)} · ${r.stops} точек</div></div>
 <div style="width:130px">${barHtml(r.done/r.stops*100,r.done===r.stops?'var(--ok)':'var(--brand2)')}<div class="mini" style="text-align:right;margin-top:3px">${r.done} из ${r.stops} доставлено</div></div>
 <b class="mono" style="width:100px;text-align:right">${som(r.sum)}</b>
 <span class="mini" style="width:120px;text-align:right">на руках ${som(r.cash)}</span>
 ${r.done===r.stops?tag('на базе','var(--ok)'):tag('в пути','var(--acc)')}</div>`).join('')}</div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Что видно по каждой точке</h3><p class="mini" style="margin:0">Время прибытия, что привезли, что приняли, что вернули, сколько заплатили, сколько в долг. Подпись приёмщика на экране телефона — как накладная.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Частичный приём</h3><p class="mini" style="margin:0">Ваши слова: «часть товаров взяли, часть не взяли». Водитель ставит количество принятого по позициям, остальное — возврат. Остаток на складе и сумма к оплате пересчитываются сразу.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Возврат на базе</h3><p class="mini" style="margin:0">Водитель вернулся — кладовщик принимает возврат по той же накладной. Ваши слова: «остаток товаров сдаёт, склад принял, и сколько денег должен — тоже даёт деньги в кассу». Всё это один экран сдачи маршрута.</p></div>
</div>`;

/* ====== ЭКРАН ВОДИТЕЛЯ ====== */
SC.driver=()=>`<div class="hd"><div><h2>Экран водителя · телефон</h2>
 <p>Ваши слова: «водитель пришёл — у него по телефону отчёт уже готов, потому что какую-то часть продал, какой-то возврат, где-то в долг оставил, отмечает». Вот этот телефон.</p></div>
 <div class="btns"><button class="bt" onclick="go('mobile')">Как ставится на телефон →</button></div></div>
<div style="display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start">
 <div class="phone">
  <div style="background:var(--rail);color:#fff;padding:13px 15px">
   <div style="font-size:9.6px;color:#8fa3b0;letter-spacing:.08em">МАРШРУТ № 3 · ЭРЛАН · 12 ТОЧЕК</div>
   <b style="font-size:14px;display:block;margin-top:3px">Точка 10 из 12 · «Народный» № 41</b>
   <div style="font-size:10.4px;color:#a9bcc8;margin-top:2px">Джал, ул. Тыныстанова · заявка З-4812</div>
  </div>
  <div style="padding:13px">
   ${[['Пельмени «Домашние»',40,40],['Пельмени «Сибирские»',30,26],['Вареники с картофелем',20,20]].map(([n,q,a])=>`<div class="kv" style="font-size:11px;padding:6px 0"><span>${n} · ${q}</span><b style="color:${a<q?'var(--warn)':'var(--ok)'}">приняли ${a}</b></div>`).join('')}
   <div class="kv" style="font-size:11.4px;padding:8px 0;border-top:1.5px solid var(--line2);border-bottom:0"><span><b>К оплате</b></span><b>34 300 сом</b></div>
   <button class="bt p" style="width:100%;padding:12px;font-size:13px;margin-top:6px" onclick="drvDone()">Оплатили · 34 300</button>
   <button class="bt" style="width:100%;padding:11px;font-size:12.5px;margin-top:7px" onclick="toast('Отмечено: в долг 34 300 сом. Долг появился у магазина сразу; агент Санжар увидит его в своём списке; при долге выше лимита следующая заявка встанет на стоп.')">Отдал в долг</button>
   <button class="bt" style="width:100%;padding:11px;font-size:12.5px;margin-top:7px" onclick="toast('Возврат 4 уп «Сибирских» записан: причина «не берут, остаток на полке». Вернётся на склад по накладной маршрута.')">Возврат 4 уп</button>
   <div style="background:var(--card2);border-radius:6px;padding:9px 11px;margin-top:11px">
    <div class="mini" style="font-weight:700">На руках</div>
    <div class="mini" style="margin-top:3px">158 000 сом · 9 точек оплатили · 1 в долг · возвратов 6 уп</div>
   </div>
  </div>
 </div>
 <div style="flex:1;min-width:330px">
  <div class="pan"><h3 style="margin:0 0 8px">Сдача маршрута на базе</h3>
   <div class="kv"><span>Отгружено</span><b class="mono">1 710 уп · 171 000 сом</b></div>
   <div class="kv"><span>Принято магазинами</span><b class="mono">1 704 уп</b></div>
   <div class="kv"><span>Возврат на склад</span><b class="mono" style="color:var(--warn)">6 уп</b></div>
   <div class="kv"><span>Оплачено</span><b class="mono" style="color:var(--ok)">158 000 сом</b></div>
   <div class="kv"><span>В долг</span><b class="mono" style="color:var(--bad)">12 400 сом · 1 точка</b></div>
   <div class="kv" style="border:0"><span>Сдать в кассу</span><b class="mono" style="font-size:13px">158 000 сом</b></div>
   <p class="mini" style="margin:9px 0 0">Отчёт готов до того, как машина въехала на базу. Кассир принимает 158 000 — и если водитель сдаёт 156 000, разница видна сразу, с точкой, где она возникла.</p>
  </div>
  <div class="said"><b>Чего здесь нет.</b> Цен закупа, остатков склада, чужих маршрутов, выручки компании. Водитель видит свой маршрут и свои деньги. Ваши слова про доступы: «чтобы не всё открывалось».</div>
 </div>
</div>`;

/* ====== ВОЗВРАТЫ ====== */
SC.returns=()=>`<div class="hd"><div><h2>Возвраты · сентябрь</h2>
 <p>Что вернулось, откуда, почему. Возврат с маршрута приходует кладовщик по той же накладной; возврат по сроку — списание. По причинам видно, что делать: менять упаковку, снижать план или разговаривать с точкой.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Отчёт по возвратам за месяц: по продуктам, точкам, агентам и причинам. 1,3% от отгрузки.')">За месяц</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Возвратов за месяц</small><b class="a">1 240 уп</b><span>1,3% от отгрузки</span></div>
 <div><small>Вернулось на склад</small><b>980 уп</b><span>пригодно к продаже</span></div>
 <div><small>Списано</small><b class="w">260 уп</b><span>срок, бой · 68 000 сом</span></div>
 <div><small>Чаще всего</small><b>«Сибирские»</b><span>38% возвратов</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Причины</h3>
  ${[['Не берут, остаток на полке',41],['Повреждена упаковка',22],['Магазин отказался при доставке',18],['Срок годности',12],['Пересорт в заявке',7]].map(([n,p])=>`<div class="fr" style="grid-template-columns:230px 1fr 50px"><span>${n}</span>${barHtml(p*2.2,'var(--warn)')}<b class="mono" style="text-align:right">${p}%</b></div>`).join('')}
  <div class="hint"><b>«Сибирские» возвращают вдвое чаще «Домашних».</b> 41% возвратов — «не берут». Либо точки заказывают больше, чем продают, и агентам нужен ориентир по прошлым продажам точки (он теперь есть в заявке), либо продукт стоит пересмотреть. Данные за два месяца ответят.</div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Последние возвраты</h3>
   ${[['18.09','Маршрут № 2 · Улукбек','14 уп «Сибирские»','не берут'],['18.09','Маршрут № 3 · Эрлан','4 уп «Сибирские»','не берут'],['17.09','Маршрут № 1 · Максат','9 уп «Домашние»','упаковка'],['17.09','Склад ГП · срок','6 уп тесто слоёное','срок годности']].map(([d,w,q,r])=>`<div class="srow"><b class="mono" style="width:44px;font-size:10.6px">${d}</b><div style="flex:1"><b>${q}</b><div class="mini">${w} · ${r}</div></div></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Ориентир агенту в заявке</h3><p class="mini" style="margin:0">При наборе заявки агент видит, сколько точка продала за прошлую неделю и сколько вернула. Заказ 30 уп при прошлых продажах 18 — система подсветит. Возвраты падают не приказом, а информацией в нужный момент.</p></div>
 </div>
</div>`;

/* ====== ПОСТАВЩИКИ ====== */
SC.suppliers=()=>`<div class="hd"><div><h2>Поставщики и закуп</h2>
 <p>По каждому поставщику: что берём, по какой цене, история цен, сроки поставки, долг перед ним. Цена закупа сразу идёт в себестоимость продукции.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новый поставщик: реквизиты, позиции, цены, срок поставки, условия оплаты.')">+ Поставщик</button><button class="bt p" onclick="go('plan')">План закупа</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['ПОСТАВЩИК','ЧТО ПОСТАВЛЯЕТ','СРОК','ЗА МЕСЯЦ','ЦЕНА СЕЙЧАС','МЕСЯЦ НАЗАД','МЫ ДОЛЖНЫ'].map((h,i)=>`<th style="text-align:${i>1?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['ОсОО «Ак-Мал»','говядина, лопатка','2 дня',2860000,520,505,380000],['ИП Осмонов','свинина, шея','1 день',1410000,470,470,376000],['ОсОО «Дан-Агро»','мука в/с','2 дня',624000,48,46,0],['ОсОО «Птицепром»','яйцо','1 день',172000,9,8.5,0],['рынок Дордой','лук, овощи','день в день',96000,35,31,0],['ИП Ким','специи','3 дня',88000,640,640,0],['ОсОО «ПакСервис»','плёнка, этикетка','5 дней',134000,1900,1850,76000]]
  .map(([n,w,t,m,p,p0,d])=>`<tr><td style="padding:8px"><b>${n}</b></td><td style="padding:8px;color:var(--muted)">${w}</td><td class="mono" style="text-align:right;padding:8px">${t}</td><td class="mono" style="text-align:right;padding:8px">${fmt(m)}</td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:700;color:${p>p0?'var(--bad)':'inherit'}">${p}</td><td class="mono" style="text-align:right;padding:8px;color:var(--muted)">${p0}</td><td class="mono" style="text-align:right;padding:8px;color:${d?'var(--warn)':'var(--muted2)'}">${d?fmt(d):'—'}</td></tr>`).join('')}</tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Рост цены → себестоимость</h3><p class="mini" style="margin:0">Говядина 505 → 520 за месяц: себестоимость «Домашних» выросла на 8 сом, маржа с 37% до 35%. Мука 46 → 48. Система пересчитывает техкарты по цене последней партии и показывает, где маржа ушла ниже вашего порога.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Долг поставщикам</h3><p class="mini" style="margin:0">832 000 сом по трём поставщикам, сроки оплаты по каждому. Кассовый календарь на неделю: что придёт от магазинов, что уйдёт поставщикам и на зарплату — на экране «Финансы».</p></div>
</div>`;

/* ====== ПЛАН ЗАКУПА ====== */
SC.plan=()=>`<div class="hd"><div><h2>План закупа по остаткам</h2>
 <p>Система считает от плана производства на неделю и остатков сырья: чего и сколько заказать, у кого, к какому дню. Кладовщик подтверждает — заявки уходят поставщикам.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Заявки отправлены 4 поставщикам: свинина 800 кг на завтра, лук 400 кг на завтра, плёнка 40 рул к 23.09, говядина 1 200 кг к 21.09. Суммы и сроки — в карточках поставщиков.')">Отправить заявки</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['СЫРЬЁ','ОСТАТОК','НУЖНО НА НЕДЕЛЮ','ЗАКАЗАТЬ','ПОСТАВЩИК','К ДАТЕ','СУММА'].map((h,i)=>`<th style="text-align:${i>0&&i<4||i>4?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['Свинина, шея',420,1900,800,'ИП Осмонов','19.09',376000,'bad'],['Лук репчатый',260,700,400,'рынок Дордой','19.09',14000,'bad'],['Плёнка упаковочная',14,26,40,'ОсОО «ПакСервис»','23.09',76000,'warn'],['Говядина, лопатка',1840,2900,1200,'ОсОО «Ак-Мал»','21.09',624000,'warn'],['Яйцо',4800,6200,3000,'ОсОО «Птицепром»','22.09',27000,'ok'],['Мука в/с',3200,2500,0,'—','—',0,'ok']]
  .map(([n,q,need,ord,sup,dt,sum,s])=>`<tr><td style="padding:8px"><b>${n}</b></td><td class="mono" style="text-align:right;padding:8px">${fmt(q)}</td><td class="mono" style="text-align:right;padding:8px">${fmt(need)}</td>
  <td class="mono" style="text-align:right;padding:8px;font-weight:700;color:${ord?'var(--brand)':'var(--muted2)'}">${ord?fmt(ord):'—'}</td><td style="padding:8px">${sup}</td><td class="mono" style="text-align:right;padding:8px;color:${s==='bad'?'var(--bad)':s==='warn'?'var(--warn)':'inherit'}">${dt}</td><td class="mono" style="text-align:right;padding:8px">${sum?fmt(sum):'—'}</td></tr>`).join('')}</tbody>
 <tfoot><tr style="border-top:1.5px solid var(--line2);font-weight:800"><td colspan="6" style="padding:8px">К заказу на неделю</td><td class="mono" style="text-align:right;padding:8px">1 117 000 сом</td></tr></tfoot>
</table></div>
<div class="hint"><b>Откуда «нужно на неделю».</b> План производства на неделю × техкарты = потребность в сырье. План производства — из продаж прошлых недель и текущих остатков готовой продукции. Цепочка замкнута: продажи → план цехов → закуп. Сейчас каждое звено считается отдельным человеком в отдельной таблице.</div>`;
/* ====== КАССА ====== */
SC.cash=()=>`<div class="hd"><div><h2>Касса и сдача выручки · сегодня</h2>
 <p>Водитель вернулся — у него в телефоне уже посчитано, сколько сдать. Кассир принимает, разница видна сразу. Ваши слова: «сколько денег должен — тоже даёт деньги в кассу». Здесь это одна строка на маршрут.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Инкассация: 696 000 сом сдано в банк, отмечено в кассе. Остаток в кассе 48 000 на размен.')">Сдать в банк</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Ожидается от маршрутов</small><b class="a">${som(ROUTES.reduce((a,r)=>a+r.cash,0))}</b><span>5 машин</span></div>
 <div><small>Принято в кассу</small><b class="g">${som(300000)}</b><span>маршруты № 4, 5</span></div>
 <div><small>На руках у водителей</small><b class="w">${som(396000)}</b><span>№ 1, 2, 3 в пути</span></div>
 <div><small>Собрано долгов агентами</small><b>${som(58000)}</b><span>Санжар, Эльмира</span></div>
</div>
<div class="pan">${ROUTES.map(r=>{const back=r.done===r.stops;return `<div class="dl" style="--c:${back?'var(--ok)':'var(--line2)'}">
 <b class="mono" style="width:30px">№ ${r.n}</b><div style="flex:1"><b>${esc(r.drv)}</b><div class="mini">${back?'на базе · сдал':'в пути · '+r.done+' из '+r.stops}</div></div>
 <b class="mono" style="width:110px;text-align:right">${som(r.cash)}</b>
 ${back?`<span class="tag" style="background:var(--ok-l);color:var(--ok)">принято ${r.n===5?'176 000':'124 000'}</span>`:`<button class="bt" onclick="toast('Приём выручки от ${esc(r.drv)}: ожидается ${fmt(r.cash)} сом. Введите принятую сумму — разница, если есть, привяжется к точке, где возникла.')">Принять</button>`}</div>`}).join('')}</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Разница при сдаче</h3><p class="mini" style="margin:0">Ожидалось 158 000, сдал 156 000 — система показывает точки маршрута и просит отметить, где недостача: магазин недоплатил (тогда это долг точки) или ошибка водителя (тогда удержание). Разбирается в день, а не «потом посчитаем».</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Кто видит кассу</h3><p class="mini" style="margin:0">Кассир, бухгалтер, вы. Водитель — только свою сдачу, агент — только свои собранные долги. Ваши слова про коммерческую тайну — деньги закрыты для всех, кому не нужны.</p></div>
</div>`;

/* ====== ФИНАНСЫ ====== */
SC.fin=()=>`<div class="hd"><div><h2>Финансы · сентябрь</h2>
 <p>Выручка, себестоимость, расходы и деньги на неделю вперёд. Не бухгалтерский учёт — он остаётся в 1С у бухгалтера — а управленческий: сколько заработали и хватит ли на закуп и зарплату.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Выгрузка для 1С: продажи по контрагентам, закуп по поставщикам, касса — за период. Бухгалтер ведёт официальный учёт там, вы управляете здесь.')">Выгрузка в 1С</button></div></div>
<div class="wid" style="grid-template-columns:repeat(5,1fr)">
 <div><small>Выручка</small><b class="a">${som(9840000)}</b><span>18 дней · план 16,4 млн</span></div>
 <div><small>Себестоимость</small><b>${som(6210000)}</b><span>63% · сырьё, труд, энергия</span></div>
 <div><small>Валовая маржа</small><b class="g">37%</b><span>${som(3630000)}</span></div>
 <div><small>Расходы</small><b>${som(1980000)}</b><span>аренда, транспорт, агенты</span></div>
 <div><small>Прибыль</small><b class="g">${som(1650000)}</b><span>16,8%</span></div>
</div>
<div class="g21">
 <div class="pan"><h3 style="margin:0 0 9px">Деньги на неделю</h3>
  ${[['19–21.09','+1 640 000','−1 117 000','+523 000','ok'],['22–24.09','+1 720 000','−980 000','+740 000','ok'],['25.09 · зарплата','+560 000','−2 140 000','−1 580 000','bad'],['26–28.09','+1 690 000','−410 000','+1 280 000','ok']]
   .map(([w,i,o,b,s])=>`<div class="fr" style="grid-template-columns:150px 1fr 1fr 130px"><b style="font-size:11.6px">${w}</b><span class="mono" style="color:var(--ok);font-size:11.4px">${i}</span><span class="mono" style="color:var(--bad);font-size:11.4px">${o}</span><b class="mono" style="text-align:right;color:${s==='ok'?'var(--ok)':'var(--bad)'}">${b}</b></div>`).join('')}
  <div class="note" style="--tone:var(--bad)"><p class="mini" style="margin:0"><b>25 сентября — зарплата 2,1 млн, а на руках к этому дню 1,26 млн плюс касса.</b> Не хватает около 300 000, если магазины-должники не заплатят. Видно за неделю — можно собрать долги (193 000 старше 7 дней) или сдвинуть оплату «Ак-Мал» на три дня.</p></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 8px">Маржа по продуктам</h3>
   ${PRODUCTS.map(p=>`<div class="kv" style="font-size:11px"><span>${esc(p.n.split(' ').slice(0,2).join(' '))}</span><b class="mono" style="color:${(p.price-p.cost)/p.price<0.33?'var(--warn)':'var(--ok)'}">${Math.round((p.price-p.cost)/p.price*100)}%</b></div>`).join('')}
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Что здесь не так, как в 1С</h3><p class="mini" style="margin:0">Себестоимость считается по факту смен и закупок в тот же день, а не по итогам месяца. Долги магазинов — по отметкам водителей, а не по сверке. Поэтому цифры на этом экране на две недели раньше, чем в бухгалтерии.</p></div>
 </div>
</div>`;

/* ====== ЗАРПЛАТА ПО ВЫРАБОТКЕ ====== */
SC.pay=()=>`<div class="hd"><div><h2>Зарплата по выработке · сентябрь</h2>
 <p>Цеха — сдельно по выработке смены с вычетом брака сверх нормы; агенты — оклад плюс процент от продаж своих точек; водители — за маршрут и точку. Всё считается из тех же данных, что и остатки: смены, заявки, доставки.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Правила: ставка за упаковку по продуктам, норма брака 2%, процент агента 3% от оплаченного, водителю 600 сом за точку. Настраивает бухгалтер.')">Правила расчёта</button><button class="bt p" onclick="toast('Расчёт за сентябрь по 68 сотрудникам сформирован. Каждый видит свою строку в кабинете; бухгалтеру — ведомость для 1С.')">Рассчитать</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11.4px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['СОТРУДНИК','РОЛЬ','СМЕН / ТОЧЕК','ВЫРАБОТКА','БРАК','БАЗА','ПРЕМИЯ / ВЫЧЕТ','ИТОГО'].map((h,i)=>`<th style="text-align:${i>1?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['Бакыт','бригадир · пельменный 1','18 смен','44 280 уп','1,4%',52000,'+6 200',58200],['Жылдыз','бригадир · пельменный 2','18 смен','39 780 уп','3,1%',52000,'−3 900',48100],['Айнура','рабочая · пельменный 1','18 смен','4 920 уп','—',0,'',34400],['Нурбек','бригадир · мясной 1','18 смен','21 240 кг','1,2%',48000,'+4 100',52100],['Санжар','агент · Джал','31 точка','398 000 сом/нед','—',35000,'+47 800',82800],['Бектур','агент · Ак-Орго','24 точки','301 000 сом/нед','—',35000,'+31 200',66200],['Эрлан','экспедитор · № 3','214 точек','—','—',30000,'+128 400',158400],['Айбек','кладовщик ГП','22 дня','—','расх. 0,14%',45000,'+5 000',50000]]
  .map(r=>`<tr><td style="padding:8px"><b>${r[0]}</b></td><td style="padding:8px;color:var(--muted)">${r[1]}</td><td class="mono" style="text-align:right;padding:8px">${r[2]}</td><td class="mono" style="text-align:right;padding:8px">${r[3]}</td><td class="mono" style="text-align:right;padding:8px;color:${r[4]==='3,1%'?'var(--bad)':'inherit'}">${r[4]}</td>
  <td class="mono" style="text-align:right;padding:8px">${r[5]?fmt(r[5]):'сдельно'}</td><td class="mono" style="text-align:right;padding:8px;color:${String(r[6]).startsWith('−')?'var(--bad)':'var(--ok)'}">${r[6]}</td><td class="mono" style="text-align:right;padding:8px;font-weight:800">${seeMoney()?fmt(r[7]):'—'}</td></tr>`).join('')}
 <tr><td colspan="8" style="padding:8px;color:var(--muted)">+ ещё 60 сотрудников</td></tr></tbody>
</table></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 6px">Что видит сотрудник</h3><p class="mini" style="margin:0">Свои смены, свою выработку, свой брак и свою сумму — с телефона, в любой день месяца. Ваши слова: «чтобы они наглядно видели, как работают». Разговор о зарплате становится разговором о цифрах, которые оба видели весь месяц.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Жылдыз: −3 900 за брак</h3><p class="mini" style="margin:0">Брак 3,1% при норме 2%: вычет по правилу. Но рядом видно, что вторая смена мясного цеха тоже выпала — причина может быть в сырье, и тогда вычет несправедлив. Система показывает данные, решение — ваше.</p></div>
</div>`;

/* ====== ОТЧЁТ АГЕНТ × ПОЗИЦИЯ × МАГАЗИН ====== */
SC.rep=()=>{
 const mine=role==='Агент';
 return `<div class="hd"><div><h2>Отчёт · агент × позиция × магазин</h2>
 <p>Ваши слова: «Сто позиций условно. Я выбрал одного агента, одну позицию — и сформировать отчёт: в какие магазины он продал, в каждом магазине сколько». Ровно этот отчёт, любой разрез.</p></div>
 <div class="btns"><select class="rsel" ${mine?'disabled':''}><option>Санжар · Джал</option>${AGENTS.slice(1).map(a=>`<option>${esc(a.n)} · ${esc(a.d)}</option>`).join('')}</select><select class="rsel"><option>Пельмени «Домашние» 1 кг</option>${PRODUCTS.slice(1).map(p=>`<option>${esc(p.n)}</option>`).join('')}</select><select class="rsel"><option>Сентябрь</option><option>Неделя</option><option>Вчера</option></select><button class="bt p" onclick="toast('Отчёт пересобран. Любой разрез: агент, продукт, магазин, район, период, сеть. Выгрузка в Excel — кнопкой.')">Сформировать</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Санжар · «Домашние» · сентябрь</small><b class="a">1 284 уп</b><span>${som(526440)}</span></div>
 <div><small>Магазинов взяли</small><b>27 из 31</b><span>4 точки не берут этот продукт</span></div>
 <div><small>Возвратов</small><b>18 уп</b><span>1,4%</span></div>
 <div><small>Доля продукта у агента</small><b>32%</b><span>больше всего · «Домашние»</span></div>
</div>
<div class="pan mx"><table class="t" style="font-size:11.5px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)">${['МАГАЗИН','ПОСТАВОК','УПАКОВОК','СУММА','ВОЗВРАТ','ДОЛЯ','ДИНАМИКА'].map((h,i)=>`<th style="text-align:${i?'right':'left'};padding:8px;font-size:10px;color:var(--muted)">${h}</th>`).join('')}</tr></thead>
 <tbody>${[['«Народный» № 41',9,286,0,'+12%'],['Столовая «Ош-Базар»',8,214,6,'−4%'],['Минимаркет «Асель»',9,142,0,'+3%'],['Магазин «Жаңа»',7,118,4,'0%'],['Мини-маркет «Дос»',8,96,2,'+18%'],['«Народный» № 44',9,204,0,'+7%'],['Магазин «Айгерим»',6,74,6,'−21%']]
  .map(([n,d,q,r,dyn])=>`<tr><td style="padding:8px"><b>${n}</b></td><td class="mono" style="text-align:right;padding:8px">${d}</td><td class="mono" style="text-align:right;padding:8px"><b>${q}</b></td><td class="mono" style="text-align:right;padding:8px">${som(q*410)}</td><td class="mono" style="text-align:right;padding:8px;color:${r?'var(--warn)':'var(--muted2)'}">${r||'—'}</td><td style="padding:8px;width:110px">${barHtml(q/286*100,'var(--brand)')}</td><td class="mono" style="text-align:right;padding:8px;color:${dyn.startsWith('−')?'var(--bad)':dyn==='0%'?'var(--muted)':'var(--ok)'}">${dyn}</td></tr>`).join('')}
 <tr><td colspan="7" style="padding:8px;color:var(--muted)">+ ещё 20 магазинов</td></tr></tbody>
</table></div>
<div class="hint"><b>Магазин «Айгерим» −21%.</b> Брал 90 в августе, 74 в сентябре, вернул 6. Либо рядом открылась точка конкурента, либо продукт стоит не на той полке. Санжар увидит это в своём отчёте до вашего вопроса — у агента тот же экран, только по своим точкам.</div>`;
};

/* ====== ABC ====== */
SC.abc=()=>`<div class="hd"><div><h2>ABC · магазины и продукты · квартал</h2>
 <p>Какие точки и продукты дают выручку, а какие — только логистику и возвраты. Основа для решений о районах, ассортименте и о том, куда ставить новую линию.</p></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Магазины · 159 точек</h3>
  <div class="yld"><i style="width:22%;background:var(--ok)"></i><i style="width:38%;background:var(--brand2)"></i><i style="width:40%;background:var(--line2)"></i></div>
  <div class="kv"><span><b>A</b> · 35 точек · 22% сети</span><b>71% выручки</b></div>
  <div class="kv"><span><b>B</b> · 60 точек</span><b>23% выручки</b></div>
  <div class="kv" style="border:0"><span><b>C</b> · 64 точки · 40% сети</span><b style="color:var(--warn)">6% выручки</b></div>
  <p class="mini" style="margin:9px 0 0">64 точки дают 6% выручки, но занимают 40% остановок машин. Часть из них — по 2–3 упаковки. Либо минимальный заказ, либо реже, либо отдать соседнему агенту. Решение ваше — цифры теперь есть.</p>
 </div>
 <div class="pan"><h3 style="margin:0 0 9px">Продукты · 8 позиций</h3>
  ${[['Пельмени «Домашние»',34,35],['Пельмени «Сибирские»',26,36],['Вареники',12,43],['Манты',9,34],['Хинкали',8,34],['Чебуреки',6,40],['Котлеты',4,35],['Тесто слоёное',1,47]].map(([n,s,m])=>`<div class="fr" style="grid-template-columns:150px 1fr 100px"><span style="font-size:11px">${n}</span>${barHtml(s*2.8,'var(--brand)')}<b class="mono" style="text-align:right">${s}% · маржа ${m}%</b></div>`).join('')}
  <p class="mini" style="margin:9px 0 0">Тесто слоёное — 1% продаж при самой высокой марже. Либо продвигать через агентов, либо убрать и освободить смену. Вареники — 12% при марже 43%: кандидат на новую линию, о которой вы говорили.</p>
 </div>
</div>
<div class="said"><b>Ваши слова:</b> «Я ещё линию производства собираюсь поставить». Этот экран отвечает, какую: по марже и по спросу. И когда линия появится — она добавится как новый цех с техкартами, без переделки системы.</div>`;
/* ====== НАСТРОЙКИ ====== */
SC.roles=()=>`<div class="hd"><div><h2>Права доступа</h2>
 <p>Ваши слова: «У каждого свой функционал, чтобы не всё открывалось. Бригадиру три функции — все три открыли. Кассиру — кассовую часть, складу — по складу. А старшим уже чуть расширено, чтобы контролировать». Семь ролей, и каждая видит только своё.</p></div>
 <div class="btns"><button class="bt" onclick="toast('Новая роль или правка прав — кнопкой, без нас. Например «Старший агент» с доступом к трём районам, или «Технолог» с техкартами и браком.')">+ Роль</button></div></div>
<div class="pan mx"><table class="t" style="font-size:11px">
 <thead><tr style="border-bottom:1.5px solid var(--line2)"><th style="text-align:left;padding:8px;font-size:10px;color:var(--muted)">ЧТО ВИДНО</th>
 ${Object.keys(ROLES).map(r=>`<th style="text-align:center;padding:8px;font-size:9px;color:var(--muted)">${esc(r.toUpperCase())}</th>`).join('')}</tr></thead>
 <tbody>${[['Все цеха и смены',[1,0,0,0,0,0,1]],['Свой цех · закрыть смену',[1,1,0,0,0,0,0]],['Остатки складов',[1,0,1,0,0,0,1]],['Отпуск и приход',[1,0,1,0,0,0,0]],['Все агенты и магазины',[1,0,0,0,0,0,0]],['Свои магазины и заявки',[1,0,0,1,0,0,0]],['Свой маршрут и деньги',[1,0,0,0,1,0,0]],['Касса и долги',[1,0,0,0,0,1,1]],['Себестоимость и маржа',[1,0,0,0,0,0,1]],['Зарплата всех',[1,0,0,0,0,0,1]],['Своя выработка и зарплата',[1,1,1,1,1,1,1]],['Отчёты в любом разрезе',[1,0,0,0,0,0,1]],['Настройки, техкарты, цены',[1,0,0,0,0,0,0]]]
  .map(([n,a])=>`<tr><td style="padding:7px 8px">${esc(n)}</td>${a.map(v=>`<td style="text-align:center;padding:7px 8px;color:${v?'var(--ok)':'var(--line2)'};font-weight:800">${v?'✓':'—'}</td>`).join('')}</tr>`).join('')}</tbody>
</table></div>
<div class="g3">
 <div class="pan"><h3 style="margin:0 0 6px">Люди меняются — доступ нет</h3><p class="mini" style="margin:0">Ваши слова: «люди меняются, и мы меняем доступ». Роль привязана к должности: новый бригадир получает те же три кнопки, уволенному доступ закрывается кнопкой, история его смен остаётся.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Коммерческая тайна</h3><p class="mini" style="margin:0">Цены закупа, себестоимость, маржа, общая выручка и зарплаты — только вам и бухгалтеру. Агент не видит чужих районов, водитель — чужих маршрутов. Код и база на вашем сервере, доступ у нас после передачи — только с вашего разрешения.</p></div>
 <div class="pan"><h3 style="margin:0 0 6px">Вход</h3><p class="mini" style="margin:0">По номеру телефона с кодом в WhatsApp — рабочим не нужно помнить пароли. Для вас и бухгалтера — двухфакторный.</p></div>
</div>`;

SC.mobile=()=>`<div class="hd"><div><h2>Телефон · значок на экране</h2>
 <p>Ваши слова: «Ребята предлагали, чтобы не в Play Market, а просто значок в телефоне появляется, нажимаешь — и всё, чтобы в Google или Safari не искать». Это стандартная веб-технология, входит в разработку. Приложение в магазинах не нужно.</p></div></div>
<div style="display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start">
 <div class="phone">
  <div style="background:linear-gradient(160deg,#2a3142,#161a24);padding:22px 14px 14px;min-height:420px">
   <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
    ${[['WhatsApp','#25d366'],['Камера','#8e8e93'],['Звонки','#34c759'],['Карты','#5ac8fa'],['Заметки','#ffcc00'],['Часы','#1c1c1e']].map(([n,c])=>`<div style="text-align:center"><div style="width:46px;height:46px;border-radius:12px;background:${c};margin:0 auto 4px"></div><span style="font-size:8.6px;color:#fff">${n}</span></div>`).join('')}
    <div style="text-align:center"><div style="width:46px;height:46px;border-radius:12px;background:var(--rail);margin:0 auto 4px;display:grid;place-items:center;border:2px solid var(--brand2)"><svg width="26" height="26" viewBox="0 0 100 100"><path d="M20 60c0-18 13-30 30-30s30 12 30 30" fill="none" stroke="#f4b63f" stroke-width="8" stroke-linecap="round"/><path d="M14 62h72" stroke="#f4b63f" stroke-width="8" stroke-linecap="round"/></svg></div><span style="font-size:8.6px;color:#fff;font-weight:700">ЦЕХ</span></div>
   </div>
   <div style="margin-top:34px;background:rgba(255,255,255,.08);border-radius:10px;padding:11px 12px;color:#fff">
    <div style="font-size:9.4px;color:#9aa5b4;letter-spacing:.06em">ПОСЛЕ УСТАНОВКИ</div>
    <div style="font-size:11px;margin-top:5px;line-height:1.5">Открывается на весь экран, без адресной строки. Помнит вход. Работает при плохой связи — отметки уходят, когда сеть появится.</div>
   </div>
  </div>
 </div>
 <div style="flex:1;min-width:330px">
  <div class="pan"><h3 style="margin:0 0 8px">Как ставится</h3>
   <div class="num"><i>1</i><div><b>Администратор заводит сотрудника</b><p>Имя, телефон, роль. Сотруднику уходит сообщение в WhatsApp со ссылкой.</p></div></div>
   <div class="num"><i>2</i><div><b>Сотрудник открывает ссылку и нажимает «На экран»</b><p>Значок появляется рядом с WhatsApp. Ни App Store, ни Play Market, ни регистрации.</p></div></div>
   <div class="num"><i>3</i><div><b>Дальше — как приложение</b><p>Бригадир видит три кнопки, водитель — маршрут, агент — магазины. Каждому своё, ваши слова.</p></div></div>
  </div>
  <div class="pan"><h3 style="margin:0 0 6px">Почему не «настоящее» приложение</h3><p class="mini" style="margin:0">То же самое, только ×2 по цене и три месяца на публикацию в магазинах. Для 70 сотрудников, которым нужно нажать три кнопки в цеху, — не нужно. Если появится причина — сделаем, но начинать с этого не стоит.</p></div>
 </div>
</div>`;

SC.integr=()=>`<div class="hd"><div><h2>1С и Агент Плюс</h2>
 <p>Ваш вопрос: «С 1С интегрироваться нужно или можно всё так?» Наш ответ на встрече: если можно обойтись без 1С — лучше без неё. Данные вытащим один раз, бухгалтер ведёт официальный учёт в 1С, бизнес — здесь.</p></div></div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">1С · вытаскиваем, не интегрируем</h3>
  <div class="kv"><span>Контрагенты · 159 магазинов</span><b style="color:var(--ok)">переносим</b></div>
  <div class="kv"><span>Номенклатура · 8 продуктов, сырьё</span><b style="color:var(--ok)">переносим</b></div>
  <div class="kv"><span>Остатки на дату запуска</span><b style="color:var(--ok)">переносим</b></div>
  <div class="kv"><span>Долги магазинов на дату</span><b style="color:var(--ok)">переносим</b></div>
  <div class="kv"><span>История продаж за год</span><b style="color:var(--ok)">переносим · для ABC</b></div>
  <div class="kv" style="border:0"><span>Выгрузка обратно в 1С для налоговой</span><b>файлом, за период</b></div>
  <div class="note" style="--tone:var(--warn)"><p class="mini" style="margin:0"><b>Постоянная интеграция с 1С — 800 000 ₸ отдельно,</b> и мы её не рекомендуем: 1С у вас на домашнем компьютере, синхронизация в обе стороны с ней будет болеть. Ваши слова: «нам всё оттуда вытащить и посадить — обратно по новой забивать это очень долгий процесс». Вытащим.</p></div>
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Агент Плюс · два варианта</h3>
   <div class="srow" style="border-left:3px solid var(--ok)"><div style="flex:1"><b>Вариант 1 · агенты в нашей системе</b><div class="mini">Экран агента входит в разработку: магазины, заявки, долги, отчёт по своим точкам. Агент Плюс становится не нужен, подписка за него — тоже.</div></div></div>
   <div class="srow" style="border-left:3px solid var(--acc)"><div style="flex:1"><b>Вариант 2 · Агент Плюс остаётся</b><div class="mini">Забираем заявки по их API (если отдают) или из ежедневной выгрузки. Работает, но заявки приходят с задержкой, и долги видны только по нашим данным.</div></div></div>
   <p class="mini" style="margin:8px 0 0">Рекомендуем первый: у вас 24 агента, и ваш вопрос «а если им сделать просто доступ в платформу?» — это он и есть.</p>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Остальное</h3>
   <div class="kv"><span>WhatsApp</span><b>вход по коду, уведомления</b></div>
   <div class="kv"><span>IP-телефония</span><b>по желанию</b></div>
   <div class="kv"><span>Сервер</span><b>виртуальный · 5–10 $ / мес</b></div>
   <div class="kv" style="border:0"><span>Бэкапы</span><b>ежедневно · 30 дней</b></div>
  </div>
 </div>
</div>`;

SC.stack=()=>`<div class="hd"><div><h2>Состав первого релиза</h2>
 <p>Что входит, в какие сроки, за какие деньги. После вашего прохода по демо этот список становится приложением № 1 к договору.</p></div>
 <div class="btns"><button class="bt p" onclick="toast('Состав релиза выгружен в PDF вместе с ТЗ.')">Выгрузить</button></div></div>
<div class="wid" style="grid-template-columns:repeat(4,1fr)">
 <div><small>Стоимость</small><b class="a">2 500 000 ₸</b><span>≈ 5 500 $ · стандартная разработка</span></div>
 <div><small>Срок</small><b>4–6 недель</b><span>с вашим согласованием</span></div>
 <div><small>Оплата</small><b>10 / 45 / 45</b><span>250 000 ₸ при старте</span></div>
 <div><small>Абонплата</small><b class="g">нет</b><span>код и сервер ваши</span></div>
</div>
<div class="g2">
 <div class="pan"><h3 style="margin:0 0 9px">Входит</h3>
  ${['Цеха и смены: закрытие смены бригадиром с телефона, приход на склад, списание по техкарте','Техкарты и рецептуры, себестоимость по цене последней закупки','Выработка и брак по сменам, бригадирам, рабочим — видно и вам, и им','Два склада: сырьё с минимумами и готовая продукция с резервом и партиями','Отпуск и перемещения с подтверждением с двух сторон, инвентаризация','Агенты: районы, магазины, заявки с телефона, лимиты долга, стоп','Маршруты и экран водителя: доставка, частичный приём, возврат, долг, деньги','Касса: сдача выручки, разница, долги','Закуп: поставщики, история цен, план закупа от остатков','Финансы: выручка, себестоимость, маржа, деньги на неделю','Зарплата по выработке: цеха, агенты, водители','Отчёты: агент × позиция × магазин, ABC','7 ролей, права, вход по WhatsApp-коду','Значок на телефоне, работа при плохой связи','Перенос данных из 1С и таблиц','Сервер, бэкапы, обучение, месяц сопровождения']
   .map(t=>`<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0"><b style="color:var(--ok)">✓</b><span style="font-size:11.4px">${esc(t)}</span></div>`).join('')}
 </div>
 <div>
  <div class="pan"><h3 style="margin:0 0 9px">Как идёт работа</h3>
   <div class="tl">
    <div class="tli"><b style="font-size:11.6px">Завтра · демо</b><p class="mini" style="margin:2px 0 0">Проход по экранам, правки, утверждение состава.</p></div>
    <div class="tli"><b style="font-size:11.6px">10 дней · первичка</b><p class="mini" style="margin:2px 0 0">Выгрузки из 1С и таблиц, техкарты, список магазинов и агентов.</p></div>
    <div class="tli"><b style="font-size:11.6px">Недели 2–3 · ядро</b><p class="mini" style="margin:2px 0 0">Цеха, склады, агенты, маршруты. Прогон на Zoom, платёж 45%.</p></div>
    <div class="tli"><b style="font-size:11.6px">Недели 4–5 · полировка</b><p class="mini" style="margin:2px 0 0">Ваши слова: «по одному цеху добавлять» — на этом этапе подключаем цеха один за другим, с вами.</p></div>
    <div class="tli"><b style="font-size:11.6px">Неделя 6 · передача</b><p class="mini" style="margin:2px 0 0">Ваш сервер, код, обучение, платёж 45%.</p></div>
   </div>
  </div>
  <div class="pan"><h3 style="margin:0 0 8px">Не входит</h3>
   <div class="kv"><span>Постоянная интеграция с 1С</span><b class="mono">800 000 ₸</b></div>
   <div class="kv"><span>Приложение в App Store / Play Market</span><b class="mono">×2 · не нужно</b></div>
   <div class="kv" style="border:0"><span>Доработки после приёмки</span><b class="mono">по часам</b></div>
  </div>
 </div>
</div>
<div class="said"><b>Универсальность, о которой вы спрашивали.</b> Новый цех, новая рецептура, новая команда агентов, новый район — добавляются кнопкой. Когда будете делить бизнес или ставить линию, систему не придётся переделывать: ваши слова «поменять название, сотрудников — и на другой бизнес использовать» заложены в устройство.</div>`;

/* ====== ДЕЙСТВИЯ ====== */
function closeShift(){
 openM('Закрыть смену','Пельменный цех · 1 смена · 18 сентября',
 `<p style="font-size:11.6px;line-height:1.7">Три числа. Всё остальное — приход на склад, списание сырья, выработка каждого, себестоимость — считается само.</p>
  <div class="srow"><div style="flex:1"><b>Пельмени «Домашние»</b><div class="mini">план 1 400</div></div><input value="1 420" style="width:90px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card);text-align:right;font-weight:700"><span class="mini">уп</span></div>
  <div class="srow"><div style="flex:1"><b>Пельмени «Сибирские»</b><div class="mini">план 1 000</div></div><input value="1 040" style="width:90px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card);text-align:right;font-weight:700"><span class="mini">уп</span></div>
  <div class="srow"><div style="flex:1"><b>Брак</b><div class="mini">причина: тесто рвётся · упаковка</div></div><input value="34" style="width:90px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card);text-align:right;font-weight:700"><span class="mini">уп</span></div>
  <div class="srow"><div style="flex:1"><b>Вышло людей</b><div class="mini">из 9 по графику</div></div><input value="9" style="width:90px;padding:7px;border:1px solid var(--line2);border-radius:5px;background:var(--card);text-align:right;font-weight:700"><span class="mini">чел</span></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Смена закрыта: 2 460 уп на склад, брак 1,4%, списано фарша 618 кг и теста 496 кг по техкарте. Выработка 9 рабочих записана, Бакыт видит 103% плана. У вас в сводке — зелёная строка.')">Закрыть смену</button>`);
}
function loadRoute(){
 openM('Накладная · маршрут № 3 · Эрлан','Собрана из 12 заявок агентов',
 `<p style="font-size:11.6px;line-height:1.7">Кладовщик видит итог по продуктам для погрузки, водитель — по точкам. Отпуск со склада и приём водителем подтверждаются отдельно.</p>
  ${[[0,486],[1,392],[3,318],[2,164],[5,180],[4,96],[6,74]].map(([p,q])=>`<div class="kv"><span>${esc(PRODUCTS[p].n)}</span><b class="mono">${q} уп</b></div>`).join('')}
  <div class="kv" style="border:0"><span><b>Итого</b></span><b class="mono" style="font-size:13px">1 710 уп · 171 000 сом</b></div>
  <button class="bt p" style="width:100%;margin-top:11px" onclick="closeM();toast('Отпущено со склада 1 710 уп, резерв снят, остаток пересчитан. Эрлану ушло уведомление: подтвердить приём в телефоне перед выездом.')">Отпустить</button>`);
}
function drvDone(){toast('Точка закрыта: приняли 86 из 90 уп, оплатили 34 300 сом. Остаток на складе и долги пересчитаны. Следующая точка — «Минимаркет Асель», 400 м.')}
function searchDemo(v){if(!v)return;toast(`Поиск «${esc(v)}»: по магазинам, агентам, продуктам, сменам, накладным и поставщикам — в пределах прав роли.`)}

/* ====== ИНФРАСТРУКТУРА ====== */
function renderRoles(){const r=document.getElementById('roles');if(!r)return;
 r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');
 const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();
 toast(`Вы вошли как «${role}» · ${ROLES[role].n}. Показаны только разделы этой роли — так же будет у ваших сотрудников.`);}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${role}. Разделов доступно: ${ROLES[role].s.length}. ${ROLES[role].note}.`)}
const ownerOf=k=>SECOF[k];
function buildRail(){const on=ownerOf(cur);document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>{const n=s.sub.filter(x=>allowed(x[0])).length;return `<div class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')" title="${esc(s.n)}"><i>${s.ic}</i><span>${esc(s.n)}</span>${n>1?`<b class="cnt">${n}</b>`:''}</div>`}).join('');}
function buildSub(){const on=ownerOf(cur),s=SEC.find(x=>x.k===on);if(!s)return;document.getElementById('sub').innerHTML=`<h4>${esc(s.n)}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`;}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Сводка';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;const a=document.getElementById('addBtn');if(a)a.style.display=allowed('close')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль в правом верхнем углу.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}

/* ====== СЦЕНАРИЙ ПОКАЗА ====== */
const TOUR=[
 ['dash','Сводка: цеха, остатки, агенты, деньги на одном экране. Вторая смена пельменного цеха красная — брак 3,1%. Это видно утром, без проверки.'],
 ['close','Начало всего — бригадир закрывает смену с телефона. Три числа, одна кнопка. Нажмите «Закрыть смену».'],
 ['output','Выработка и брак по сменам и бригадирам — видно вам и видно им. Две вторые смены выпадают одинаково: причина в сырье, а не в людях.'],
 ['tech','Техкарта: норма сырья на упаковку и себестоимость. Изменили норму — пересчиталось. Новая рецептура — кнопкой.'],
 ['fg','Склад готовой продукции: «произвели 10 000, продали 8 000, остатки выходят постоянно». Свободно, в резерве, хватит на сколько дней.'],
 ['moves','Отпуск водителю по накладной, собранной из заявок агентов. Нажмите «Собрать накладную» — подтверждение с двух сторон.'],
 ['orders','Заявки агентов: «Береке» на стопе из-за долга. Система не пропустила заявку на погрузку и подняла вам.'],
 ['driver','Экран водителя: приняли частично, возврат, в долг, оплатили. Отчёт готов до того, как машина въехала на базу.'],
 ['cash','Касса: водитель сдаёт ровно то, что насчитал телефон. Разница — с точкой, где возникла.'],
 ['rep','Ваш отчёт: агент × позиция × магазин. Санжар, «Домашние», сентябрь — в какие магазины и сколько.'],
 ['plan','Закуп от остатков: свинина ниже минимума, заявка поставщику готова. Продажи → план цехов → закуп — цепочка замкнута.'],
 ['fin','Финансы: маржа по продуктам и деньги на неделю. 25 сентября — зарплата, и видно, хватит ли.'],
 ['pay','Зарплата по выработке: цеха сдельно, агенты процентом, водители за точку. Из тех же данных, что остатки.'],
 ['roles','Права: бригадиру три кнопки, водителю маршрут, агенту магазины. Коммерческая тайна — цены и маржа только вам.'],
 ['mobile','Значок на телефоне без магазинов приложений — ровно то, что вам предлагали, входит в разработку.'],
 ['integr','1С: вытаскиваем данные один раз, не интегрируем. Агент Плюс — можно заменить экраном агента.'],
 ['stack','Состав релиза: 2 500 000 ₸, оплата 10 / 45 / 45, четыре-шесть недель, код и сервер ваши.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий показа закончен. Всё кликается: смены, накладные, водитель, касса, отчёты.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?5800:6900);}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
