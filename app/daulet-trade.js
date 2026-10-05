/* ОПОРА — система оптовой торговли стройматериалами и оборудованием вместо 1С и Битрикса: товары и остатки, сделки в канбане, счёт и КП из сделки, записи звонков и переписки, приход и реализация для двух бухгалтеров, отгрузки вагонами, заявки на закупку и снабжение, касса с простым интерфейсом, авансы и командировочные, отчёты директору. Все имена, компании и суммы вымышленные. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(n<0?'−':'')+(Math.round(Math.abs(n)/10000)/100).toString().replace('.',',')+' млн';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const plural=(n,f)=>{const a=Math.abs(n)%100,b=a%10;return f[(a>10&&a<20)||b>4||b===0?2:b===1?0:1]};
const TODAY='05.10.2026',NOW='17:20';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;

const SEC=[
 {k:'dir',n:'Директор',ic:'<path d="M4 20V10 M10 20V4 M16 20v-8 M22 20H2"/>',sub:[['today','Пульт директора'],['control','Контроль трёх зон'],['reports','Отчёты в одной таблице']]},
 {k:'sales',n:'Продажи',ic:'<path d="M3 6h18M3 12h18M3 18h12"/>',sub:[['funnel','Сделки · канбан'],['deal','Карточка сделки'],['invoice','Счёт и КП'],['clients','Клиенты']]},
 {k:'wh',n:'Склад',ic:'<path d="M3 9l9-5 9 5v11H3z M8 20v-7h8v7"/>',sub:[['catalog','Товары и остатки'],['income','Приход'],['realize','Реализация'],['wagons','Отгрузка вагонами']]},
 {k:'snab',n:'Снабжение',ic:'<path d="M3 7h12v9H3z M15 10h4l2 3v3h-6z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',sub:[['preq','Заявки на закупку'],['suppliers','Поставщики']]},
 {k:'money',n:'Деньги',ic:'<rect x="3" y="6" width="18" height="12" rx="1"/><circle cx="12" cy="12" r="2.6"/>',sub:[['cash','Касса'],['payments','Оплаты по счетам'],['advances','Авансы и командировки']]},
 {k:'sys',n:'Система',ic:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',sub:[['roles','Роли и права'],['onec','Уход с 1С'],['launch','Запуск и стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Исполнительный директор':{av:'ДК',p:'DK',n:'Даулет',note:'Всё в одном месте: продажи, склад, закупки, деньги, контроль звонков и переписки, отчёты',s:ALL.slice()},
 'Собственник':{av:'СБ',p:'OW',n:'Собственник',note:'Пульт и отчёты — то же, что видит директор, без настроек',s:['today','control','reports','funnel','deal','catalog','payments','cash']},
 'Менеджер':{av:'АС',p:'AS',n:'Аслан',note:'Свои сделки: товары, счёт на оплату, КП, звонки и переписка с клиентом',s:['funnel','deal','invoice','clients','catalog']},
 'Снабженец':{av:'ЕР',p:'ER',n:'Ерик',note:'Заявки на закупку, поставщики, переписка и звонки с ними, приход товара',s:['preq','suppliers','catalog','income']},
 'Бухгалтер по приходу':{av:'СА',p:'SA',n:'Сауле',note:'Приход товара: накладные поставщиков, остатки, оплата поставщикам',s:['income','catalog','preq','suppliers','payments']},
 'Бухгалтер по реализации':{av:'ГА',p:'GA',n:'Гаухар',note:'Реализация: счета, накладные, оплаты клиентов, отгрузки и вагоны',s:['realize','payments','invoice','wagons','catalog','clients']},
 'Кассир':{av:'РП',p:'KS',n:'Раиса Петровна',note:'Только касса: принять деньги по счёту — три большие кнопки',s:['cash']}
};
let role='Исполнительный директор',cur='today',theme='light',curDeal='С-1184';

const GOODS=[
 {id:'G1',n:'Цемент М400 Д20, мешок 50 кг',g:'Сыпучие',u:'меш',q:2840,res:600,min:800,buy:2150,sell:2650,cell:'Ангар 1'},
 {id:'G2',n:'Цемент М500 навал',g:'Сыпучие',u:'т',q:168,res:120,min:60,buy:38500,sell:46000,cell:'Силос 2'},
 {id:'G3',n:'Арматура А500С Ø12, 11,7 м',g:'Металлопрокат',u:'т',q:46.4,res:22,min:20,buy:318000,sell:362000,cell:'Площадка Б'},
 {id:'G4',n:'Арматура А500С Ø16, 11,7 м',g:'Металлопрокат',u:'т',q:18.2,res:20,min:15,buy:315000,sell:358000,cell:'Площадка Б'},
 {id:'G5',n:'Труба профильная 40×20×2, 6 м',g:'Металлопрокат',u:'шт',q:910,res:200,min:300,buy:4100,sell:4950,cell:'Стеллаж М-4'},
 {id:'G6',n:'Профнастил С8 0,45 мм, RAL 3005',g:'Кровля',u:'м²',q:1280,res:0,min:500,buy:2350,sell:2890,cell:'Ангар 2'},
 {id:'G7',n:'Минвата 50 мм, 0,6 м³ упаковка',g:'Утеплитель',u:'уп',q:140,res:60,min:100,buy:7400,sell:8900,cell:'Ангар 2'},
 {id:'G8',n:'Кабель ВВГнг-LS 3×2,5, бухта 100 м',g:'Электрика',u:'бухта',q:64,res:10,min:30,buy:28900,sell:34500,cell:'Склад Э-1'},
 {id:'G9',n:'Бетономешалка 180 л, 800 Вт',g:'Оборудование',u:'шт',q:12,res:4,min:5,buy:118000,sell:149000,cell:'Склад О-2'},
 {id:'G10',n:'Генератор бензиновый 5 кВт',g:'Оборудование',u:'шт',q:3,res:2,min:4,buy:265000,sell:329000,cell:'Склад О-2'},
 {id:'G11',n:'Сварочный инвертор 250 А',g:'Оборудование',u:'шт',q:21,res:3,min:6,buy:64000,sell:82000,cell:'Склад О-1'},
 {id:'G12',n:'Сетка кладочная 50×50×4, карта 2×0,5',g:'Металлопрокат',u:'шт',q:1600,res:400,min:500,buy:620,sell:790,cell:'Стеллаж М-2'}
];
const GD=id=>GOODS.find(g=>g.id===id);
const MGR={AS:'Аслан',MR:'Мурат',AI:'Айгерим'};
const ST=[{k:'new',n:'Заявка',c:'#6c7686'},{k:'calc',n:'Подбор и расчёт',c:'#3f5f86'},{k:'kp',n:'КП отправлено',c:'#5a5a9a'},{k:'inv',n:'Счёт выставлен',c:'#b0632a'},{k:'paid',n:'Оплачен',c:'#2f7a52'},{k:'ship',n:'Отгрузка',c:'#2a7a8a'},{k:'done',n:'Закрыта',c:'#4f5d6c'}];
const STI=k=>ST.findIndex(s=>s.k===k),STN=k=>ST[STI(k)];
const DEALS=[
 {id:'С-1184',cl:'ТОО «Нур-Сити Строй»',ct:'Ербол',m:'AS',st:'inv',src:'Instagram',lines:[['G1',600],['G3',8],['G12',400]],paid:0,note:'Объект ЖК «Нурлы Жол», доставка в Караганду вагоном.'},
 {id:'С-1185',cl:'ИП Мухамеджанов',ct:'Тимур',m:'MR',st:'calc',src:'Звонок',lines:[['G6',420],['G7',30]],paid:0,note:'Кровля частного дома, просит скидку от 400 м².'},
 {id:'С-1186',cl:'ТОО «Алау Инжиниринг»',ct:'Сабина',m:'AI',st:'kp',src:'Instagram',lines:[['G9',4],['G10',2],['G11',3]],paid:0,note:'Оборудование для бригад, сравнивает с конкурентом.'},
 {id:'С-1187',cl:'ТОО «Сарыарка Курылыс»',ct:'Бахыт',m:'AS',st:'paid',src:'Повторный',lines:[['G2',120]],paid:1,note:'Цемент навалом, 2 вагона на Павлодар.'},
 {id:'С-1188',cl:'ТОО «ЭнергоМонтаж KZ»',ct:'Олег',m:'MR',st:'ship',src:'Повторный',lines:[['G8',10],['G5',200]],paid:1,note:'Самовывоз 06.10 в 10:00.'},
 {id:'С-1189',cl:'ИП Садыкова',ct:'Айнур',m:'AI',st:'new',src:'Instagram',lines:[['G12',150]],paid:0,note:''},
 {id:'С-1190',cl:'ТОО «Береке Строй»',ct:'Канат',m:'AS',st:'new',src:'Звонок',lines:[['G4',20]],paid:0,note:'Арматура Ø16 — 20 т, на складе 18,2 т: нужна закупка.'},
 {id:'С-1181',cl:'ТОО «КазДорСтрой»',ct:'Жанибек',m:'MR',st:'done',src:'Повторный',lines:[['G1',1200],['G3',14]],paid:1,note:''}
];
const DL=id=>DEALS.find(d=>d.id===id);
const dSum=d=>d.lines.reduce((a,[g,q])=>a+GD(g).sell*q,0);
const dCost=d=>d.lines.reduce((a,[g,q])=>a+GD(g).buy*q,0);

const SC={};
const stg=k=>{const s=STN(k);return `<span class="stg" style="--sc:${s.c}">${s.n}</span>`};
const PREQ=[
 {id:'З-311',who:'Аслан',why:'Сделка С-1190 · не хватает Ø16',g:'G4',q:20,sup:'ТОО «КарМет Трейд»',pr:309000,st:'agree',d:'05.10'},
 {id:'З-310',who:'Склад',why:'Ниже минимума',g:'G10',q:6,sup:'ТОО «ТехноПауэр»',pr:258000,st:'order',d:'04.10'},
 {id:'З-309',who:'Склад',why:'Ниже минимума',g:'G7',q:200,sup:'ТОО «Изол Центр»',pr:7200,st:'way',d:'02.10'},
 {id:'З-308',who:'Айгерим',why:'Сделка С-1186',g:'G9',q:6,sup:'«Shandong Mixer» (Китай)',pr:104000,st:'way',d:'28.09'},
 {id:'З-306',who:'Склад',why:'Ниже минимума',g:'G1',q:2400,sup:'АО «Карцемент»',pr:2100,st:'done',d:'24.09'}
];
const PST=[['new','Новая'],['agree','Согласование директора'],['order','Заказано, ждём счёт'],['way','Оплачено, в пути'],['done','Принято на склад']];
SC.today=()=>{const open=DEALS.filter(d=>d.st!=='done');const inv=DEALS.filter(d=>d.st==='inv').reduce((a,d)=>a+dSum(d),0);
 return `<div class="hd"><div><h2>Пульт исполнительного директора · ${TODAY}</h2><p>Всё в одном месте: продажи, склад, закупки и деньги. Не нужно ходить по сотрудникам и просить скинуть отчёт — открыли с телефона и видите.</p></div><div class="btns"><button class="bt" onclick="toast('Отчёт за день отправлен собственнику.')">Отчёт собственнику</button></div></div>
 <div class="wid">
  <div class="clk" onclick="go('funnel')"><small>Сделок в работе</small><b>${open.length}</b><span>на ${mln(open.reduce((a,d)=>a+dSum(d),0))}</span></div>
  <div class="clk" onclick="go('payments')"><small>Ждём оплату по счетам</small><b class="w">${mln(inv)}</b><span>${DEALS.filter(d=>d.st==='inv').length} счёт</span></div>
  <div class="clk" onclick="go('cash')"><small>Касса сегодня</small><b class="g">${tg(CASHDAY.reduce((a,c)=>a+c.s,0))}</b><span>${CASHDAY.length} поступления</span></div>
  <div class="clk" onclick="go('catalog')"><small>Ниже минимума</small><b class="r">${GOODS.filter(g=>g.q-g.res<g.min).length}</b><span>позиций на складе</span></div>
  <div class="clk" onclick="go('preq')"><small>Закупки</small><b>${PREQ.filter(p=>p.st!=='done').length}</b><span>${PREQ.filter(p=>p.st==='agree').length} ждёт вашего согласия</span></div>
 </div>
 <div class="g3">
  <div class="pan zone"><h3>1 · Менеджеры</h3><p class="mini">звонки и переписка</p>${[['Звонков сегодня','74'],['Минут на линии','268'],['Сообщений клиентам','131'],['Без ответа больше 30 минут','2']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}<button class="bt sm" onclick="go('control')">Записи и переписка →</button></div>
  <div class="pan zone"><h3>2 · Бухгалтерия</h3><p class="mini">пришло · продано · оплачено</p>${[['Приход сегодня','2 накладные · 4,7 млн'],['Реализация сегодня','3 накладные · 6,2 млн'],['Оплаты клиентов','5,4 млн'],['Расхождение склад / учёт','нет']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}<button class="bt sm" onclick="go('realize')">Приход и реализация →</button></div>
  <div class="pan zone"><h3>3 · Снабжение</h3><p class="mini">заявки и поставщики</p>${[['Заявок в работе',PREQ.filter(p=>p.st!=='done').length],['Ждут согласования',PREQ.filter(p=>p.st==='agree').length],['В пути','2 поставки'],['Переписок с поставщиками','18 за неделю']].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}<button class="bt sm" onclick="go('preq')">Заявки на закупку →</button></div>
 </div>
 <div class="g2"><div class="pan"><h3>Требует решения</h3>
  <div class="rf bad" onclick="go('preq')"><i></i><div><b>З-311 · закупка арматуры Ø16, 20 т на 6,18 млн</b><span>под сделку С-1190 «Береке Строй» — ждёт вашего согласия</span></div></div>
  <div class="rf" onclick="go('advances')"><i></i><div><b>Аванс на командировку — Ерик, Караганда, 85 000 ₸</b><span>встреча с поставщиком арматуры 07–08.10</span></div></div>
  <div class="rf" onclick="go('control')"><i></i><div><b>Клиент ТОО «Алау Инжиниринг» ждёт ответа 42 минуты</b><span>Айгерим · вопрос по сроку поставки бетономешалок</span></div></div>
  <div class="rf" onclick="go('wagons')"><i></i><div><b>Вагон на Павлодар — подача завтра 09:00</b><span>С-1187 · цемент навалом 60 т</span></div></div></div>
 <div class="pan"><h3>Продажи за неделю</h3>${[['пн',3.1],['вт',4.4],['ср',2.6],['чт',5.2],['пт',6.2]].map(x=>`<div class="hb"><span>${x[0]}</span><i style="width:${x[1]*15}%"></i><b class="mono">${String(x[1]).replace('.',',')} млн</b></div>`).join('')}<p class="mini">Маржа недели — 17,4 %. Лучший менеджер — Аслан, 9,8 млн.</p></div></div>
 ${said('«Чтобы ко мне не бегали сотрудники… я могу зайти в свою CRM и в одном лице увидеть, что мне нужно».')}`};

const CALLS=[
 {m:'AS',calls:31,min:118,msg:52,late:0,rec:[['исх.','11:42','6:10','С-1184 · Нур-Сити Строй — согласовали вагон до Караганды'],['вход.','14:05','2:30','новый клиент — профнастил']]},
 {m:'MR',calls:24,min:86,msg:41,late:1,rec:[['исх.','10:15','4:48','С-1185 · скидка на профнастил от 400 м²'],['исх.','15:30','—','не дозвонился']]},
 {m:'AI',calls:19,min:64,msg:38,late:1,rec:[['вход.','12:20','3:55','С-1186 · Алау Инжиниринг — сравнивают цены']]}
];
SC.control=()=>`<div class="hd"><div><h2>Контроль трёх зон</h2><p>Ваши три критерия: менеджеры — звонки и переписка; бухгалтерия — что пришло и что продано; снабжение — с кем и о чём договаривались. Всё записывается и хранится в карточках.</p></div></div>
 <div class="pan"><h3>1 · Менеджеры — звонки и переписка</h3><div class="tw"><table class="t"><thead><tr><th>Менеджер</th><th class="r">Звонков</th><th class="r">Минут</th><th class="r">Сообщений</th><th class="r">Без ответа &gt;30 мин</th><th>Последние записи</th></tr></thead><tbody>${CALLS.map(c=>`<tr><td><b>${MGR[c.m]}</b></td><td class="r mono">${c.calls}</td><td class="r mono">${c.min}</td><td class="r mono">${c.msg}</td><td class="r mono ${c.late?'neg':''}">${c.late}</td><td>${c.rec.map(r=>`<div class="rec"><span class="tag">${r[0]}</span> ${r[1]} · ${r[2]} · ${esc(r[3])} ${r[2]!=='—'?`<a class="lk" onclick="toast('Запись разговора воспроизводится.')">слушать</a>`:''}</div>`).join('')}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>2 · Бухгалтерия — приход и реализация</h3><div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Кто</th><th class="r">Сумма</th><th>Склад</th></tr></thead><tbody>${[['Приход № 412 · АО «Карцемент»','Сауле','5 040 000','принято 2 400 меш'],['Приход № 413 · ТОО «Изол Центр»','Сауле','0','в пути'],['Реализация № 918 · КазДорСтрой','Гаухар','4 245 600','отгружено'],['Реализация № 919 · ЭнергоМонтаж KZ','Гаухар','1 335 000','к отгрузке 06.10']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="r mono">${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div><p class="mini">Остаток на складе меняется сам при проведении прихода и реализации — сверять с отдельной базой не нужно.</p></div>
 <div class="pan"><h3>3 · Снабжение — поставщики</h3>${[['Ерик → «КарМет Трейд»','звонок 5:12 · цена Ø16 309 000 ₸/т, отгрузка 3 дня'],['Ерик → «Shandong Mixer»','переписка · инвойс на 6 бетономешалок, в пути до 12.10'],['Ерик → «ТехноПауэр»','звонок 2:40 · генераторы — счёт завтра']].map(r=>`<div class="kv"><span>${r[0]}</span><b class="mini">${r[1]}</b></div>`).join('')}<button class="bt sm" onclick="go('suppliers')">Все поставщики →</button></div></div>
 ${said('«Три главных критерия: контроль менеджеров — полностью звонки, переписки; контроль бухгалтерии — что пришло, товар продан; контроль снабжения — снабженцы общались, и всё тоже сохранялось».')}`;

SC.reports=()=>`<div class="hd"><div><h2>Отчёты в одной таблице</h2><p>Продажи, маржа, остатки, закупки, касса — одна таблица за выбранный период. Без запросов бухгалтеру и без выгрузок из 1С.</p></div><div class="btns"><button class="bt" onclick="toast('Таблица выгружена в Excel.')">Выгрузить в Excel</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Показатель</th><th class="r">Сегодня</th><th class="r">Неделя</th><th class="r">Сентябрь</th><th class="r">Динамика</th></tr></thead><tbody>${[['Продажи, ₸','6 180 000','21 500 000','84 300 000','+11 %'],['Маржа, ₸','1 070 000','3 740 000','14 600 000','+8 %'],['Маржа, %','17,3','17,4','17,3','—'],['Сделок закрыто','3','14','61','+6'],['Средний чек, ₸','2 060 000','1 535 000','1 382 000','−3 %'],['Закуплено, ₸','5 040 000','12 900 000','61 200 000','+4 %'],['Оплаты клиентов, ₸','5 400 000','19 800 000','80 100 000','+9 %'],['Долг клиентов, ₸','—','—','7 400 000','−12 %'],['Остаток склада, ₸','—','—','58 600 000','+2 %'],['Звонков менеджеров','74','362','1 540','+14 %'],['Касса (наличные), ₸','1 260 000','3 100 000','11 900 000','—']].map(r=>`<tr><td><b>${r[0]}</b></td>${r.slice(1).map((x,i)=>`<td class="r mono ${i===3&&x.startsWith('−')?'neg':i===3&&x.startsWith('+')?'pos':''}">${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 ${said('«Чтобы всё отчётно было в одной таблице».')}`;

const myD=()=>role==='Менеджер'?DEALS.filter(d=>d.m==='AS'):DEALS;
SC.funnel=()=>`<div class="hd"><div><h2>Сделки · канбан${role==='Менеджер'?' · мои':''}</h2><p>Заявка → подбор и расчёт → КП → счёт → оплачен → отгрузка → закрыта. На карточке — клиент, товары, сумма и маржа. Не хватает товара на складе — карточка подсвечена, снабженцу уходит заявка.</p></div><div class="btns"><button class="bt p" onclick="card('newdeal')">+ Сделка</button></div></div>
 <div class="kb">${ST.map(s=>{const X=myD().filter(d=>d.st===s.k);return `<div class="kc" style="--sc:${s.c}"><div class="kh"><b>${s.n}</b><span>${X.length}</span></div>${X.map(d=>{const lack=d.lines.some(([g,q])=>GD(g).q<q);return `<div class="kd ${lack?'alarm':''}" onclick="openDeal('${d.id}')"><div class="kt"><b>${d.id}</b><span class="src">${d.src}</span></div><div class="kr">${esc(d.cl)}</div><div class="km">${d.lines.map(([g,q])=>esc(GD(g).n.split(',')[0])).join(' · ')}</div><div class="kf"><span>${MGR[d.m]}</span><b class="mono">${mln(dSum(d))}</b></div>${lack?'<div class="lack">не хватает на складе</div>':''}</div>`}).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 ${said('«Вести, конечно, канбан нужен; чтобы запись разговоров была, переписки, чтобы записи были».')}`;

function openDeal(id){if(!allowed('deal')){toast('Карточка сделки этой роли недоступна.');return}curDeal=id;go('deal')}
SC.deal=()=>{const d=DL(curDeal)||DEALS[0];const si=STI(d.st);const S=dSum(d),C=dCost(d);
 return `<div class="hd"><div><div class="crumb"><a onclick="go('funnel')">Сделки</a> / ${d.id}</div><h2>${d.id} · ${esc(d.cl)}</h2><p>контакт ${esc(d.ct)} · источник ${d.src} · менеджер ${MGR[d.m]}</p></div><div class="btns">${d.st!=='done'?`<button class="bt p" onclick="nextSt('${d.id}')">→ ${ST[si+1].n}</button>`:''}<button class="bt" onclick="go('invoice')">Счёт и КП</button></div></div>
 <div class="stp">${ST.map((x,i)=>`<div class="${i<si?'ok':i===si?'on':''}" style="--sc:${x.c}"><i>${i<si?'✓':i+1}</i><span>${x.n}</span></div>`).join('')}</div>
 <div class="pan"><h3>Товары</h3><div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">Кол-во</th><th class="r">На складе</th><th class="r">Цена</th><th class="r">Сумма</th></tr></thead><tbody>${d.lines.map(([g,q])=>{const x=GD(g);return `<tr class="${x.q<q?'rowbad':''}"><td>${esc(x.n)}</td><td class="r mono">${fmt(q)} ${x.u}</td><td class="r mono ${x.q<q?'neg':''}">${String(x.q).replace('.',',')}</td><td class="r mono">${fmt(x.sell)}</td><td class="r mono">${fmt(x.sell*q)}</td></tr>`}).join('')}<tr class="total"><td colspan="4">Итого · маржа ${pct(S-C,S)} %</td><td class="r mono">${fmt(S)}</td></tr></tbody></table></div>${d.lines.some(([g,q])=>GD(g).q<q)?`<button class="bt sm p" onclick="go('preq');toast('Заявка на закупку З-311 уже создана по этой сделке.')">Заявка на закупку недостающего</button>`:''}</div>
 <div class="g2"><div class="pan"><h3>Переписка</h3><div class="chat">${[['in',esc(d.ct)+' · 10:02','Добрый день, нужна цена с доставкой.'],['out',MGR[d.m]+' · 10:15','Здравствуйте! Отправил КП, доставка вагоном до станции — 3 дня.'],['in',esc(d.ct)+' · 10:40','Хорошо, выставляйте счёт.']].map(m=>`<div class="msg ${m[0]}"><small>${m[1]}</small>${m[2]}</div>`).join('')}</div></div>
 <div class="pan"><h3>Звонки</h3>${[['исх.','05.10 11:42','6:10','согласовали вагон и сроки'],['вход.','04.10 16:20','3:05','запрос цены'],['исх.','03.10 09:50','—','не дозвонился']].map(c=>`<div class="kv"><span><span class="tag">${c[0]}</span> ${c[1]} · ${c[2]} · ${c[3]}</span>${c[2]!=='—'?`<b class="lk" onclick="toast('Запись разговора воспроизводится.')">слушать</b>`:'<b>—</b>'}</div>`).join('')}${d.note?`<div class="pin">${esc(d.note)}</div>`:''}</div></div>`};
function nextSt(id){const d=DL(id);const n=ST[STI(d.st)+1].k;if(n==='ship'&&!d.paid){toast('Отгрузка только после оплаты: кассир или бухгалтер отметит оплату.');return}d.st=n;if(n==='paid')d.paid=1;render();toast(`${d.id} → «${STN(n).n}».`+(n==='inv'?' Счёт сформирован из товаров сделки.':n==='paid'?' Товар зарезервирован, бухгалтеру по реализации — накладная.':n==='ship'?' Остаток на складе списан.':''))}

SC.invoice=()=>{const d=DL(curDeal)||DEALS[0];const S=dSum(d);return `<div class="hd"><div><h2>Счёт на оплату и КП</h2><p>Менеджер собирает товары в сделке — счёт и коммерческое предложение формируются сами из каталога: цены, остатки, реквизиты клиента. Без 1С.</p></div></div>
 <div class="g2"><div class="pan"><h3>Счёт на оплату · ${d.id}</h3><div class="doc"><div class="dh"><div class="dlg">ОПОРА<small>СТРОЙМАТЕРИАЛЫ И ОБОРУДОВАНИЕ</small></div><div style="text-align:right;font-size:10px">Счёт № ${d.id.slice(2)}<br>${TODAY}</div></div><h4>Счёт на оплату</h4><p style="font-size:11px">Покупатель: ${esc(d.cl)}</p><div class="drow h"><span>№</span><span>Товар</span><span class="r">Кол-во</span><span class="r">Сумма</span></div>${d.lines.map(([g,q],i)=>`<div class="drow"><span>${i+1}</span><span>${esc(GD(g).n)}</span><span class="r">${fmt(q)}</span><span class="r">${fmt(GD(g).sell*q)}</span></div>`).join('')}<div class="dsum"><span>Итого, в т. ч. НДС 12 %</span><span>${tg(S)}</span></div></div><div class="btns l" style="margin-top:10px"><button class="bt p" onclick="toast('Счёт отправлен клиенту в мессенджер, сделка → «Счёт выставлен».')">Отправить клиенту</button><button class="bt" onclick="toast('PDF счёта скачан.')">PDF</button></div></div>
 <div class="pan"><h3>Коммерческое предложение</h3><div class="doc"><div class="dh"><div class="dlg">ОПОРА<small>КП</small></div><div style="text-align:right;font-size:10px">${TODAY}</div></div><h4>${esc(d.cl)}</h4>${d.lines.map(([g,q])=>`<div class="drow"><span>${esc(GD(g).n.split(',')[0])}</span><span class="r">${fmt(q)} ${GD(g).u}</span><span class="r">${fmt(GD(g).sell)} ₸</span></div>`).join('')}<div class="dsum"><span>Итого</span><span>${tg(S)}</span></div><div class="dfoot"><span>Цены действительны 5 дней. Доставка вагоном или самовывоз со склада.</span></div></div><div class="btns l" style="margin-top:10px"><button class="bt p" onclick="toast('КП отправлено клиенту.')">Отправить КП</button></div></div></div>
 ${said('«Все товары там были, менеджеры могли счёт на оплату делать, коммерческое предложение».')}`};
SC.clients=()=>`<div class="hd"><div><h2>Клиенты</h2><p>Клиент — все сделки, счета, оплаты, долг, звонки и переписка в одной карточке. Реквизиты подставляются в счёт и накладную.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Город</th><th>Менеджер</th><th class="r">Сделок</th><th class="r">Оборот за год</th><th class="r">Долг</th></tr></thead><tbody>${[['ТОО «КазДорСтрой»','Астана','Мурат',14,'62 400 000','0'],['ТОО «Нур-Сити Строй»','Караганда','Аслан',6,'21 800 000','2 400 000'],['ТОО «Сарыарка Курылыс»','Павлодар','Аслан',9,'34 100 000','0'],['ТОО «ЭнергоМонтаж KZ»','Астана','Мурат',11,'18 700 000','1 335 000'],['ТОО «Алау Инжиниринг»','Астана','Айгерим',2,'3 900 000','0'],['ИП Мухамеджанов','Косшы','Мурат',1,'—','0']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td class="r mono">${r[3]}</td><td class="r mono">${r[4]}</td><td class="r mono ${r[5]!=='0'?'neg':''}">${r[5]}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Склад ===== */
let gF='Все';
SC.catalog=()=>{const G=['Все',...new Set(GOODS.map(g=>g.g))];const L=GOODS.filter(g=>gF==='Все'||g.g===gF);
 return `<div class="hd"><div><h2>Товары и остатки</h2><p>Как в «Моём складе»: каждый товар, остаток, резерв под оплаченные сделки, свободно, минимальный остаток, закупочная и продажная цена, место хранения. Ниже минимума — подсветка и заявка снабженцу.</p></div><div class="btns"><span class="seg">${G.map(g=>`<a class="${g===gF?'on':''}" onclick="gF='${g}';render()">${g}</a>`).join('')}</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Товар</th><th>Группа</th><th>Место</th><th class="r">Остаток</th><th class="r">Резерв</th><th class="r">Свободно</th><th class="r">Мин.</th>${role==='Менеджер'?'':'<th class="r">Закуп</th>'}<th class="r">Продажа</th></tr></thead><tbody>${L.map(g=>{const f=+(g.q-g.res).toFixed(1);return `<tr class="${f<g.min?'rowwarn':''}"><td><b>${esc(g.n)}</b></td><td>${g.g}</td><td>${g.cell}</td><td class="r mono">${String(g.q).replace('.',',')} ${g.u}</td><td class="r mono">${g.res?String(g.res).replace('.',','):'—'}</td><td class="r mono ${f<0?'neg':''}">${String(f).replace('.',',')}</td><td class="r mono">${g.min}</td>${role==='Менеджер'?'':`<td class="r mono">${fmt(g.buy)}</td>`}<td class="r mono">${fmt(g.sell)}</td></tr>`}).join('')}</tbody></table></div>
 ${said('«Мне главное, чтобы были все товары там — это как «Мой склад»».')}`};
const INC=[
 {n:'412',sup:'АО «Карцемент»',d:'05.10',lines:[['G1',2400]],sum:5040000,st:'done'},
 {n:'413',sup:'ТОО «Изол Центр»',d:'ожидается 07.10',lines:[['G7',200]],sum:1440000,st:'way'},
 {n:'414',sup:'«Shandong Mixer» (Китай)',d:'ожидается 12.10',lines:[['G9',6]],sum:624000,st:'way'}
];
SC.income=()=>`<div class="hd"><div><h2>Приход</h2><p>Бухгалтер по приходу заносит накладные поставщиков — товар появляется на складе, закупка закрывается, оплата поставщику уходит в «Оплаты». Одно действие вместо 1С плюс таблица.</p></div><div class="btns"><button class="bt p" onclick="card('income')">+ Приход</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>№</th><th>Поставщик</th><th>Дата</th><th>Товары</th><th class="r">Сумма</th><th>Статус</th><th></th></tr></thead><tbody>${INC.map((x,i)=>`<tr><td class="mono">${x.n}</td><td><b>${esc(x.sup)}</b></td><td>${x.d}</td><td>${x.lines.map(([g,q])=>esc(GD(g).n.split(',')[0])+' · '+fmt(q)+' '+GD(g).u).join('<br>')}</td><td class="r mono">${fmt(x.sum)}</td><td>${x.st==='done'?'<span class="tag g">принято</span>':'<span class="tag w">в пути</span>'}</td><td>${x.st==='done'?'':`<button class="bt sm" onclick="incDone(${i})">Принять на склад</button>`}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Два бухгалтера: один по приходу товара, другой по реализации — чтобы бухгалтер по приходу всё туда закидывал, пополнял».')}`;
function incDone(i){const x=INC[i];x.st='done';x.d=TODAY;x.lines.forEach(([g,q])=>GD(g).q+=q);const p=PREQ.find(p=>p.g===x.lines[0][0]&&p.st==='way');if(p)p.st='done';render();toast(`Приход № ${x.n} принят: остатки обновлены, заявка на закупку закрыта.`)}
SC.realize=()=>{const D=DEALS.filter(d=>['paid','ship','done'].includes(d.st));return `<div class="hd"><div><h2>Реализация</h2><p>Бухгалтер по реализации видит оплаченные сделки: накладная и ЭСФ формируются из сделки, отгрузка списывает товар со склада. Что продано, что оплачено, что отгружено — в одной таблице.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Сделка</th><th>Клиент</th><th class="r">Сумма</th><th>Оплата</th><th>Накладная</th><th>ЭСФ</th><th>Отгрузка</th></tr></thead><tbody>${D.map(d=>`<tr><td class="lk" onclick="openDeal('${d.id}')">${d.id}</td><td>${esc(d.cl)}</td><td class="r mono">${fmt(dSum(d))}</td><td><span class="tag g">оплачено</span></td><td><span class="tag ${d.st==='paid'?'w':'g'}">${d.st==='paid'?'сформировать':'№ 9'+d.id.slice(-2)}</span></td><td><span class="tag ${d.st==='done'?'g':''}">${d.st==='done'?'выписана':'—'}</span></td><td>${d.st==='done'?'отгружено':d.st==='ship'?'06.10 · самовывоз':d.note.includes('вагон')?'вагоном':'ждёт'}</td></tr>`).join('')}</tbody></table></div>
 <div class="note"><b>1С — пока параллельно</b><p>Пока налоговая отчётность в 1С, документы выгружаются туда файлом. Когда будете готовы — рабочую базу 1С отключаете полностью.</p></div>`};
const WAG=[
 {n:'№ 61284531',deal:'С-1187',to:'Павлодар',cargo:'Цемент М500 навал',t:60,st:'apply',d:'подача 06.10 09:00'},
 {n:'№ 61284549',deal:'С-1187',to:'Павлодар',cargo:'Цемент М500 навал',t:60,st:'apply',d:'подача 06.10 09:00'},
 {n:'№ 52910377',deal:'С-1184',to:'Караганда',cargo:'Цемент М400 · арматура · сетка',t:42,st:'plan',d:'после оплаты счёта'},
 {n:'№ 52844120',deal:'С-1181',to:'Шымкент',cargo:'Цемент М400 · арматура Ø12',t:74,st:'sent',d:'отправлен 01.10, прибытие 06.10'}
];
const WST={plan:'Планируется',apply:'Заявка подана · ждём подачу',load:'Погрузка',sent:'Отправлен'};
SC.wagons=()=>`<div class="hd"><div><h2>Отгрузка вагонами</h2><p>Вагон привязан к сделке: груз, тоннаж, станция, дата подачи и погрузки, ЖД-накладная. Менеджер и бухгалтер видят статус, клиент получает номер вагона.</p></div><div class="btns"><button class="bt p" onclick="card('wagon')">+ Вагон</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Вагон</th><th>Сделка</th><th>Станция</th><th>Груз</th><th class="r">Тонн</th><th>Статус</th><th>Когда</th><th></th></tr></thead><tbody>${WAG.map((w,i)=>`<tr><td class="mono"><b>${w.n}</b></td><td class="lk" onclick="openDeal('${w.deal}')">${w.deal}</td><td>${w.to}</td><td>${w.cargo}</td><td class="r mono">${w.t}</td><td><span class="tag ${w.st==='sent'?'g':w.st==='apply'?'w':''}">${WST[w.st]}</span></td><td>${w.d}</td><td>${w.st!=='sent'&&w.st!=='plan'?`<button class="bt sm" onclick="wagNext(${i})">${w.st==='apply'?'Погрузка':'Отправлен'}</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Для загрузки, например, вагонов — менеджеры со складом и бухгалтерией — чтобы всё было в одном месте».')}`;
function wagNext(i){const w=WAG[i];w.st=w.st==='apply'?'load':'sent';w.d=w.st==='load'?'погрузка '+TODAY:'отправлен '+TODAY;render();toast(w.st==='sent'?`Вагон ${w.n} отправлен — клиенту ушёл номер вагона, остаток списан.`:`Вагон ${w.n} на погрузке.`)}

/* ===== Снабжение ===== */
SC.preq=()=>`<div class="hd"><div><h2>Заявки на закупку</h2><p>Бизнес-процесс: заявку создаёт менеджер под сделку или склад, когда товар ниже минимума. Снабженец подбирает поставщика и цену, директор согласует, бухгалтер оплачивает, приход закрывает заявку.</p></div><div class="btns"><button class="bt p" onclick="card('preq')">+ Заявка</button></div></div>
 <div class="kb k5">${PST.map(([k,n])=>{const X=PREQ.filter(p=>p.st===k);return `<div class="kc" style="--sc:#3f5f86"><div class="kh"><b>${n}</b><span>${X.length}</span></div>${X.map(p=>`<div class="kd ${p.st==='agree'?'alarm':''}"><div class="kt"><b>${p.id}</b><span class="src">${p.d}</span></div><div class="kr">${esc(GD(p.g).n.split(',')[0])} · ${fmt(p.q)} ${GD(p.g).u}</div><div class="km">${esc(p.sup)} · ${fmt(p.pr)} ₸ за ${GD(p.g).u}</div><div class="km">${esc(p.who)} · ${esc(p.why)}</div><div class="kf"><span>итого</span><b class="mono">${mln(p.pr*p.q)}</b></div>${p.st==='agree'&&(role==='Исполнительный директор')?`<div class="btns l"><button class="bt sm p" onclick="pqOk('${p.id}')">Согласовать</button><button class="bt sm" onclick="toast('Возвращено снабженцу с комментарием.')">Вернуть</button></div>`:''}</div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>
 ${said('«Бизнес-процессы, типа заявка на закупку: у нас есть снабженцы, которые закупают оборудование, товары».')}`;
function pqOk(id){const p=PREQ.find(x=>x.id===id);p.st='order';render();toast(`${p.id} согласована — снабженец заказывает у ${p.sup}, бухгалтеру ушёл счёт на оплату.`)}
SC.suppliers=()=>`<div class="hd"><div><h2>Поставщики</h2><p>Карточка поставщика: что берём, по какой цене последние разы, звонки с записями и переписка снабженца. Можно сравнить, у кого дешевле, и проверить, о чём договорились.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Поставщик</th><th>Что берём</th><th>Последняя цена</th><th>Было раньше</th><th>Звонков / сообщений</th><th>Последний контакт</th></tr></thead><tbody>${[['АО «Карцемент»','цемент М400, М500','2 100 ₸/меш','2 050 ₸ (август)','12 / 34','05.10 · приход принят'],['ТОО «КарМет Трейд»','арматура, сетка','309 000 ₸/т Ø16','314 000 ₸ (сентябрь)','8 / 21','05.10 · звонок 5:12'],['ТОО «ТехноПауэр»','генераторы, инверторы','258 000 ₸ генератор','265 000 ₸','5 / 9','04.10 · ждём счёт'],['«Shandong Mixer» (Китай)','бетономешалки','104 000 ₸','118 000 ₸ (местный)','2 / 46','03.10 · инвойс'],['ТОО «Изол Центр»','минвата','7 200 ₸/уп','7 400 ₸','4 / 11','02.10 · в пути']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="mono">${r[2]}</td><td class="mono mini">${r[3]}</td><td class="mono">${r[4]}</td><td>${r[5]}</td></tr>`).join('')}</tbody></table></div>
 <div class="note"><b>Запись разговоров снабженца</b><p>Звонки поставщикам идут через ту же телефонию, что у менеджеров: запись, длительность, к какой заявке относится.</p></div>`;

/* ===== Деньги ===== */
const CASHDAY=[{t:'10:20',who:'ТОО «ЭнергоМонтаж KZ»',deal:'С-1188',s:860000},{t:'12:05',who:'ИП Ахмедов (самовывоз)',deal:'С-1179',s:214000},{t:'15:40',who:'ИП Бекова',deal:'С-1180',s:186000}];
SC.cash=()=>`<div class="hd"><div><h2>Касса</h2><p>Для кассира — самый простой экран: найти счёт, принять деньги, распечатать чек. Сделка сама становится «Оплачена», менеджер и бухгалтер видят это сразу.</p></div></div>
 <div class="cashbox">
  <div class="cb-step"><i>1</i><b>Найдите счёт</b><input id="cs_q" value="С-1184" placeholder="номер счёта или клиент"></div>
  <div class="cb-step"><i>2</i><b>Сумма</b><div class="cb-sum">${tg(dSum(DL('С-1184')))}</div><span>ТОО «Нур-Сити Строй» · счёт С-1184</span></div>
  <div class="cb-btns"><button class="cbb ok" onclick="cashIn()">Принять наличные</button><button class="cbb" onclick="toast('Оплата картой через терминал — чек распечатан.')">Картой</button><button class="cbb" onclick="toast('Чек отправлен на печать.')">Печать чека</button></div>
 </div>
 <div class="pan"><h3>Сегодня в кассе · ${tg(CASHDAY.reduce((a,c)=>a+c.s,0))}</h3>${CASHDAY.map(c=>`<div class="kv"><span>${c.t} · ${esc(c.who)} · ${c.deal}</span><b class="mono">${fmt(c.s)}</b></div>`).join('')}<button class="bt sm" onclick="toast('Смена закрыта, отчёт директору и бухгалтеру.')">Закрыть смену</button></div>
 ${said('«Кассир очень взрослая… с компьютером не очень. Нажми А, нажми Б, нажми Ц».','Платон: максимально простой интерфейс — три кнопки.')}`;
function cashIn(){const d=DL('С-1184');if(d.paid){toast('Этот счёт уже оплачен.');return}d.paid=1;d.st='paid';CASHDAY.push({t:NOW,who:d.cl,deal:d.id,s:dSum(d)});render();toast(`Принято ${tg(dSum(d))}. Сделка С-1184 → «Оплачен», менеджеру Аслану и бухгалтеру — уведомление.`)}
SC.payments=()=>`<div class="hd"><div><h2>Оплаты по счетам</h2><p>Большинство оплат — безналом: выписка банка загружается раз в день, платежи сами находят свои счета. Оплаты поставщикам — из согласованных заявок на закупку.</p></div><div class="btns"><button class="bt p" onclick="toast('Выписка загружена: 6 платежей разнесены по счетам, 1 — вручную.')">Загрузить выписку</button></div></div>
 <div class="g2"><div class="pan"><h3>От клиентов</h3>${[['С-1187 · Сарыарка Курылыс','5 520 000','банк · 04.10'],['С-1188 · ЭнергоМонтаж KZ','860 000','касса · 05.10'],['С-1181 · КазДорСтрой','4 245 600','банк · 01.10'],['С-1184 · Нур-Сити Строй','—','ждём · счёт от 04.10']].map(r=>`<div class="kv"><span>${r[0]}<br><span class="mini">${r[2]}</span></span><b class="mono">${r[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>Поставщикам</h3>${[['З-309 · Изол Центр','1 440 000','оплачено 02.10'],['З-308 · Shandong Mixer','624 000','оплачено 28.09'],['З-310 · ТехноПауэр','1 548 000','к оплате после счёта'],['З-311 · КарМет Трейд','6 180 000','после согласования директора']].map(r=>`<div class="kv"><span>${r[0]}<br><span class="mini">${r[2]}</span></span><b class="mono">${r[1]}</b></div>`).join('')}</div></div>`;
const ADV=[{id:'А-27',who:'Ерик',why:'Командировка Караганда, поставщик арматуры, 07–08.10',s:85000,st:'agree'},{id:'А-26',who:'Аслан',why:'Встреча с клиентом в Павлодаре, 02.10',s:46000,st:'report',left:4200},{id:'А-25',who:'Мурат',why:'Бензин, развоз образцов',s:20000,st:'closed'}];
SC.advances=()=>`<div class="hd"><div><h2>Авансы и командировки</h2><p>Сотрудник просит аванс или командировочные в системе — директор согласует одной кнопкой — кассир или бухгалтер выдаёт — сотрудник прикладывает чеки, остаток возвращается. Всё видно, кто сколько взял и отчитался.</p></div><div class="btns"><button class="bt p" onclick="card('adv')">+ Заявка на аванс</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>№</th><th>Кто</th><th>На что</th><th class="r">Сумма</th><th>Статус</th><th></th></tr></thead><tbody>${ADV.map(a=>`<tr><td class="mono">${a.id}</td><td><b>${a.who}</b></td><td>${esc(a.why)}</td><td class="r mono">${fmt(a.s)}</td><td>${a.st==='agree'?'<span class="tag w">ждёт согласования</span>':a.st==='paid'?'<span class="tag i">выдано</span>':a.st==='report'?`<span class="tag w">ждём чеки · остаток ${fmt(a.left)}</span>`:'<span class="tag g">закрыт</span>'}</td><td>${a.st==='agree'&&role==='Исполнительный директор'?`<button class="bt sm p" onclick="advOk('${a.id}')">Согласовать</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 ${said('«И до получения даже авансов, командировочных — чтобы всё было в одном месте».')}`;
function advOk(id){const a=ADV.find(x=>x.id===id);a.st='paid';render();toast(`${a.id} согласован — кассиру ушла задача выдать ${tg(a.s)}.`)}

/* ===== Система ===== */
SC.roles=()=>{const A=[['Пульт, контроль, отчёты',['DK','OW']],['Сделки, счёт и КП',['DK','OW','AS','GA']],['Товары и остатки',['DK','OW','AS','ER','SA','GA']],['Закупочные цены',['DK','OW','ER','SA','GA']],['Приход',['DK','ER','SA']],['Реализация и вагоны',['DK','GA']],['Заявки на закупку',['DK','ER','SA']],['Касса',['DK','OW','KS']],['Авансы — согласование',['DK']]];const R=Object.entries(ROLES);
 return `<div class="hd"><div><h2>Роли и права</h2><p>Каждый входит под своим логином и видит только своё. Менеджер не видит закупочные цены, кассир — только кассу. Собственник смотрит то же, что удобно директору.</p></div></div>
 <div class="tw"><table class="t mx"><thead><tr><th>Раздел</th>${R.map(([k,v])=>`<th class="c">${v.av}<span>${esc(k)}</span></th>`).join('')}</tr></thead><tbody>${A.map(a=>`<tr><td>${a[0]}</td>${R.map(([k,v])=>`<td class="c">${a[1].includes(v.p)?'<b class="pos">●</b>':'<span class="mini">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 ${said('«Собственник тоже будет принимать участие — он будет смотреть то, что мне будет комфортно смотреть».')}`};
SC.onec=()=>`<div class="hd"><div><h2>Уход с 1С</h2><p>Сейчас счета и накладные делаются в рабочей базе 1С. Переносим номенклатуру, остатки, контрагентов и открытые документы, какое-то время работаете параллельно — потом рабочую базу 1С отключаете. Налоговую базу можно оставить у бухгалтера, пока она нужна.</p></div></div>
 <div class="mvs">${[['1','Выгрузка из 1С','номенклатура, цены, остатки, контрагенты','ok'],['2','Склад и цены','группы, единицы, места хранения','ok'],['3','Открытые документы','неоплаченные счета, долги, заказы поставщикам','on'],['4','Параллельная работа','2 недели: документы в системе, отчётность в 1С',''],['5','Отключение рабочей базы','всё в одной системе','']].map(s=>`<div class="mv ${s[3]}"><i>${s[3]==='ok'?'✓':s[0]}</i><b>${s[1]}</b><span>${s[2]}</span></div>`).join('')}</div>
 <div class="g2"><div class="note"><b>Почему так</b><p>«Очень костлявое — даже отчёт получить проблема; если кто-то неправильно что-то сделает, уже тяжело». Здесь отчёт — экран, а исправление — одна правка с историей, кто и когда.</p></div><div class="note"><b>Битрикс не нужен</b><p>Канбан, звонки, переписка, задачи — уже здесь. Подписки нет.</p></div></div>
 ${said('«Хочу убрать этот 1С… не сразу, конечно, но планирую его полностью убрать, чтобы все работали через CRM».')}`;
SC.launch=()=>`<div class="hd"><div><h2>Запуск и стоимость</h2><p>Стандартный пакет разработки — 1 500 000 ₸ один раз, без абонентской платы. 4–6 недель с несколькими итерациями согласования. Сервер передаём вам: до 10 ГБ — бесплатно, дальше — несколько долларов в месяц.</p></div></div>
 <div class="pay3"><div><small>Старт · 10 %</small><b>150 000 ₸</b><span>выгрузка из 1С, товары, роли</span></div><div><small>Ядро · 45 %</small><b>675 000 ₸</b><span>после того, как вы приняли ядро</span></div><div><small>Сдача · 45 %</small><b>675 000 ₸</b><span>после шлифовки и передачи сервера</span></div></div>
 <div class="g2"><div class="pan"><h3>Ядро</h3>${['Товары и остатки, перенос из 1С','Сделки в канбане, счёт на оплату и КП','Приход и реализация для двух бухгалтеров','Заявки на закупку с согласованием','Касса — простой экран'].map(x=>`<div class="li"><i>✓</i><span>${x}</span></div>`).join('')}</div>
 <div class="pan"><h3>Шлифовка</h3>${['Телефония с записями, мессенджер в карточке','Отгрузка вагонами','Авансы и командировочные','Пульт директора и отчёты','Ваши доработки по ходу — около 20 % времени заложено'].map(x=>`<div class="li n"><i>→</i><span>${x}</span></div>`).join('')}</div></div>
 ${said('«Первоначально такое небольшое ТЗ, потому что нужно с чего-то начинать, а потом будем дорабатывать».','Платон: стандартный пакет точно поместимся, 4–6 недель, 1,5 млн, предоплата 10 %.')}`;

/* ===== Карточки ===== */
const CARD={};
CARD.newdeal=()=>['Новая сделка','Товары из каталога, счёт — из сделки',`<div class="form"><label>Клиент<input id="nd_c" value="ТОО «Жана Курылыс»"></label><label>Источник<select id="nd_s"><option>Instagram</option><option>Звонок</option><option>Повторный</option></select></label><label>Товар<select id="nd_g">${GOODS.map(g=>`<option value="${g.id}">${esc(g.n)}</option>`).join('')}</select></label><label>Количество<input id="nd_q" value="100"></label></div><button class="bt p" onclick="newDeal()">Создать</button>`];
function newDeal(){const v=i=>document.getElementById(i).value;const id='С-'+(1191+DEALS.length-8);DEALS.unshift({id,cl:v('nd_c'),ct:'—',m:role==='Менеджер'?'AS':'AI',st:'new',src:v('nd_s'),lines:[[v('nd_g'),+v('nd_q')||1]],paid:0,note:''});closeM();curDeal=id;go('deal');toast(`${id} создана.`)}
CARD.income=()=>['Новый приход','Накладная поставщика — остатки обновятся',`<div class="form"><label>Поставщик<input id="ic_s" value="ТОО «КарМет Трейд»"></label><label>Товар<select id="ic_g">${GOODS.map(g=>`<option value="${g.id}">${esc(g.n)}</option>`).join('')}</select></label><label>Количество<input id="ic_q" value="20"></label><label>Сумма, ₸<input id="ic_p" value="6180000"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;INC.unshift({n:String(415+INC.length-3),sup:v('ic_s'),d:'ожидается',lines:[[v('ic_g'),+v('ic_q')||0]],sum:+v('ic_p')||0,st:'way'});closeM();render();toast('Приход создан — «Принять на склад», когда товар придёт.')">Создать</button>`];
CARD.wagon=()=>['Новый вагон','Привязан к сделке',`<div class="form"><label>Сделка<select id="wg_d">${DEALS.map(d=>`<option>${d.id}</option>`).join('')}</select></label><label>Станция<input id="wg_t" value="Шымкент"></label><label>Груз<input id="wg_c" value="Арматура Ø12"></label><label>Тонн<input id="wg_q" value="60"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;WAG.unshift({n:'№ 5'+Math.floor(1e7+Math.random()*9e7),deal:v('wg_d'),to:v('wg_t'),cargo:v('wg_c'),t:+v('wg_q')||0,st:'apply',d:'заявка подана '+TODAY});closeM();render();toast('Вагон добавлен.')">Добавить</button>`];
CARD.preq=()=>['Заявка на закупку','Снабженцу и на согласование директору',`<div class="form"><label>Товар<select id="pq_g">${GOODS.map(g=>`<option value="${g.id}">${esc(g.n)}</option>`).join('')}</select></label><label>Количество<input id="pq_q" value="10"></label><label>Для чего<input id="pq_w" value="Ниже минимума"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;const g=v('pq_g');PREQ.unshift({id:'З-'+(312+PREQ.length-5),who:ROLES[role].n,why:v('pq_w'),g,q:+v('pq_q')||1,sup:'подбирает снабженец',pr:GD(g).buy,st:'new',d:'05.10'});closeM();render();toast('Заявка создана — снабженцу пришло уведомление.')">Создать</button>`];
CARD.adv=()=>['Заявка на аванс','Директор согласует, кассир выдаст',`<div class="form"><label>На что<input id="av_w" value="Командировка Алматы, 2 дня"></label><label>Сумма, ₸<input id="av_s" value="70000"></label></div><button class="bt p" onclick="const v=i=>document.getElementById(i).value;ADV.unshift({id:'А-'+(28+ADV.length-3),who:ROLES[role].n,why:v('av_w'),s:+v('av_s')||0,st:'agree'});closeM();render();toast('Заявка отправлена директору.')">Отправить</button>`];
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(k){toast('Готово.')}
function searchDemo(v){if(!v)return;const q=v.toLowerCase().trim();const d=DEALS.find(x=>(x.id+x.cl).toLowerCase().includes(q));if(d&&allowed('deal')){openDeal(d.id);return}const g=GOODS.find(x=>x.n.toLowerCase().includes(q));if(g&&allowed('catalog')){go('catalog');toast(`${g.n}: ${String(g.q).replace('.',',')} ${g.u}, ${g.cell}.`);return}toast('Не найдено: попробуйте «С-1184», «цемент», «арматура».')}

/* ===== Каркас ===== */
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Исполнительный директор';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}» · ${esc(ROLES[role].n)}.`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль: ${esc(role)}. ${esc(ROLES[role].note)}.`)}
function buildRail(){const on=SECOF[cur];document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===on?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><i><svg viewBox="0 0 24 24">${s.ic}</svg></i><span>${s.n}</span></a>`).join('')}
function buildSub(){const s=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.today;document.body.dataset.role=role==='Кассир'?'cash':'';document.getElementById('ttl').textContent=SUBN[cur]||'Опора';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();buildRail();
 const a=document.getElementById('addBtn');if(a)a.style.display=allowed('funnel')?'':'none';try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['today','1 · Пульт директора: продажи, склад, закупки, деньги и три зоны контроля — в одном месте.'],
 ['control','2 · Контроль: звонки и переписка менеджеров, приход и реализация, переговоры снабженцев.'],
 ['funnel','3 · Сделки в канбане. Не хватает товара — карточка подсвечена.'],
 ['deal','4 · Карточка сделки: товары с остатками, маржа, переписка, записи звонков.'],
 ['invoice','5 · Счёт и КП собираются из товаров сделки — без 1С.'],
 ['catalog','6 · Товары и остатки, как в «Моём складе».'],
 ['income','7 · Приход — бухгалтер по приходу.'],
 ['realize','8 · Реализация — бухгалтер по реализации.'],
 ['wagons','9 · Отгрузка вагонами.'],
 ['preq','10 · Заявки на закупку с согласованием директора.'],
 ['cash','11 · Касса — три большие кнопки.'],
 ['advances','12 · Авансы и командировочные.'],
 ['reports','13 · Отчёты в одной таблице.'],
 ['launch','14 · Стоимость: 1,5 млн, 4–6 недель, 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен. Всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
