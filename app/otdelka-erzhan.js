/* ТЕКСТУРА ОПТ — оптовые склады отделочных материалов (Ержан). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const mln=n=>(Math.round(n/100000)/10).toString().replace('.',',')+' млн ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='20.11.2026';
const bar=w=>`<div class="bar"><i style="width:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>ЕРЖАН, 20.11</b><i>«${q}»</i>${a?`<div class="sa">${a}</div>`:''}</div>`;
const tbl=(h,rows)=>`<div class="tw"><table class="t"><thead><tr>${h.map(x=>`<th${x[0]==='>'?' class="r"':''}>${x.replace(/^>/,'')}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;

const SEC=[
 {k:'own',n:'Собственник',sub:[['dash','Пульт собственника'],['fin','Доходы и расходы'],['rep','Аналитика']]},
 {k:'sale',n:'Продажи',sub:[['funnel','Воронка'],['deal','Карточка сделки'],['calc','Калькулятор'],['docs','КП, счёт, накладная'],['robots','Роботы по стадиям']]},
 {k:'stock',n:'Склады',sub:[['stock','Остатки по городам'],['move','Перемещения'],['inv','Инвентаризация'],['cont','Контейнер из Китая']]},
 {k:'comm',n:'Связь',sub:[['inbox','WhatsApp и звонки'],['mail','Рассылки']]},
 {k:'base',n:'Базы',sub:[['clients','Клиенты'],['firms','Компании и доступы'],['buh','Бухгалтеру · Excel и 1С']]},
 {k:'sys',n:'Система',sub:[['brand','Ваш бренд'],['content','Контент · опция'],['ai','Про ИИ честно'],['launch','Стоимость']]}
];
const SECOF={},SUBN={},ALL=[];SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1];ALL.push(x[0])}));
const ROLES={
 'Собственник':{av:'СБ',n:'Ержан',note:'всё: деньги, склады трёх городов, обе компании, доступы',s:ALL.slice()},
 'Менеджер · Алматы':{av:'МА',n:'Дана',note:'свои сделки, калькулятор, КП, остатки всех складов; закупочные цены не видит',s:['funnel','deal','calc','docs','robots','stock','inbox','mail','clients']},
 'Менеджер · Шымкент':{av:'МШ',n:'Нурлан',note:'то же для Шымкента, компания «Текстура Юг»',s:['funnel','deal','calc','docs','stock','move','inbox','clients']},
 'Кладовщик':{av:'КЛ',n:'Серик · Алматы',note:'остатки, перемещения, инвентаризация, приход контейнера',s:['stock','move','inv','cont']},
 'Бухгалтер':{av:'БХ',n:'Айгерим',note:'оплаты, расходы, выгрузки в Excel и 1С',s:['fin','docs','firms','buh']}
};
let role='Собственник',cur='dash';
const CITY={A:'Алматы',S:'Шымкент',N:'Астана'};
const FIRM={T1:'ТОО «Текстура Опт»',T2:'ТОО «Текстура Юг»'};
const MGR={M1:'Дана Абилова',M2:'Нурлан Ташев',M3:'Асель Нуркен'};
const meId=()=>role==='Менеджер · Алматы'?'M1':role==='Менеджер · Шымкент'?'M2':null;

let P=[
 {sku:'LV-120-OAK',n:'Лувер МДФ 2800×120, дуб натуральный',c:'Лувер',m2:0.336,p:6900,cost:3900,st:{A:640,S:210,N:180},min:150},
 {sku:'LV-160-GRF',n:'Лувер 2800×160, графит',c:'Лувер',m2:0.448,p:8900,cost:5100,st:{A:320,S:40,N:95},min:80},
 {sku:'FM-TRV-06',n:'Гибкий мрамор 1200×600, травертин',c:'Гибкий мрамор',m2:0.72,p:14500,cost:8200,st:{A:410,S:120,N:60},min:100},
 {sku:'FM-CAL-24',n:'Гибкий мрамор 1200×2400, калакатта',c:'Гибкий мрамор',m2:2.88,p:52000,cost:31000,st:{A:86,S:12,N:30},min:25},
 {sku:'BM-NAT-24',n:'Бамбуковая панель 2440×1220, натуральная',c:'Бамбук',m2:2.977,p:38500,cost:22800,st:{A:140,S:35,N:48},min:40},
 {sku:'BM-CRB-24',n:'Бамбук карбонизированный 2440×1220',c:'Бамбук',m2:2.977,p:42000,cost:25000,st:{A:62,S:8,N:20},min:30},
 {sku:'AP-WAL-24',n:'Акупанель 2400×600, орех на чёрном фетре',c:'Акупанели',m2:1.44,p:24900,cost:14300,st:{A:230,S:64,N:90},min:60},
 {sku:'AP-GRY-24',n:'Акупанель 2400×600, серый дуб',c:'Акупанели',m2:1.44,p:23900,cost:13800,st:{A:180,S:22,N:15},min:60},
 {sku:'WPC-219-TK',n:'WPC-панель 2900×219, тик',c:'WPC',m2:0.635,p:11200,cost:6400,st:{A:520,S:160,N:140},min:120},
 {sku:'PR-AL-27',n:'Профиль алюминиевый торцевой 2,7 м',c:'Профили и клей',m2:0,p:2400,cost:1100,st:{A:1900,S:400,N:520},min:300},
 {sku:'GL-MS-290',n:'Клей MS-полимер 290 мл',c:'Профили и клей',m2:0,p:2900,cost:1450,st:{A:2400,S:180,N:600},min:400},
 {sku:'MD-CRN-28',n:'Молдинг угловой 2,8 м, под дерево',c:'Профили и клей',m2:0,p:1900,cost:850,st:{A:760,S:90,N:210},min:150}
];
const PS=s=>P.find(x=>x.sku===s);
const CL=[
 {id:'K1',n:'Студия интерьера «Линия»',t:'Дизайнер',city:'A',ph:'+7 701 *** 44 10',sum12:8400000},
 {id:'K2',n:'Бригада Мейрама',t:'Бригада',city:'A',ph:'+7 777 *** 18 92',sum12:5200000},
 {id:'K3',n:'ЖК «Алтын Сай», ТОО «Сай Девелопмент»',t:'Объект',city:'N',ph:'+7 717 *** 50 30',sum12:21600000},
 {id:'K4',n:'Гульнара Ж.',t:'Розница',city:'A',ph:'+7 705 *** 72 11',sum12:410000},
 {id:'K5',n:'Ресторан «Самал», ремонт зала',t:'Объект',city:'S',ph:'+7 725 *** 31 48',sum12:3100000},
 {id:'K6',n:'Дизайнер Алина Р.',t:'Дизайнер',city:'N',ph:'+7 702 *** 08 63',sum12:2900000},
 {id:'K7',n:'Бригада «Юг Ремонт»',t:'Бригада',city:'S',ph:'+7 708 *** 64 05',sum12:4700000},
 {id:'K8',n:'Тимур К.',t:'Розница',city:'S',ph:'+7 747 *** 19 27',sum12:180000}
];
const CN=id=>(CL.find(c=>c.id===id)||{n:'—'}).n;
const ST=[['new','Заявка'],['calc','Расчёт'],['kp','КП отправлено'],['bill','Счёт'],['pay','Оплачено'],['ship','Отгрузка'],['done','Закрыто']];
const STN=k=>(ST.find(s=>s[0]===k)||['',k])[1];
let DL=[
 {id:'С-2318',t:'Стена в гостиной: лувер дуб + торцевой профиль',cl:'K4',m:'M1',city:'A',firm:'T1',st:'kp',sum:268000,src:'Instagram',items:[['LV-120-OAK',34],['PR-AL-27',6],['GL-MS-290',8]]},
 {id:'С-2317',t:'Шоурум студии «Линия»: акупанели орех, 42 м²',cl:'K1',m:'M1',city:'A',firm:'T1',st:'bill',sum:796800,src:'Повторный',items:[['AP-WAL-24',32]]},
 {id:'С-2316',t:'ЖК «Алтын Сай»: холлы 1–4 подъездов, гибкий мрамор',cl:'K3',m:'M3',city:'N',firm:'T1',st:'pay',sum:3640000,src:'Тендер',items:[['FM-CAL-24',70]]},
 {id:'С-2315',t:'Ресторан «Самал»: бамбук на потолок',cl:'K5',m:'M2',city:'S',firm:'T2',st:'calc',sum:0,src:'Звонок',items:[]},
 {id:'С-2314',t:'Бригада Мейрама: WPC тик, фасад частного дома',cl:'K2',m:'M1',city:'A',firm:'T1',st:'ship',sum:1176000,src:'WhatsApp',items:[['WPC-219-TK',105]]},
 {id:'С-2319',t:'Ванная: гибкий мрамор травертин',cl:'K8',m:'M2',city:'S',firm:'T2',st:'new',sum:0,src:'WhatsApp',items:[]},
 {id:'С-2320',t:'Кабинет: акупанели серый дуб, 18 м²',cl:'K6',m:'M3',city:'N',firm:'T1',st:'new',sum:0,src:'Instagram',items:[]},
 {id:'С-2309',t:'«Юг Ремонт»: лувер графит, 3 квартиры',cl:'K7',m:'M2',city:'S',firm:'T2',st:'done',sum:640800,src:'Повторный',items:[['LV-160-GRF',72]]}
];
let CURD='С-2317';
const seeD=d=>{const m=meId();return !m||d.m===m};

/* ===== экраны ===== */
const SC={};
SC.dash=()=>{const W=DL.filter(d=>d.st!=='done');const s=W.reduce((a,d)=>a+d.sum,0);const low=P.filter(p=>Object.values(p.st).some(v=>v<p.min));const frozen=P.reduce((a,p)=>a+(p.st.A+p.st.S+p.st.N)*p.cost,0);
return `<div class="hd"><div><h2>Пульт собственника · ${TODAY}</h2><p>Продажи трёх городов, деньги в товаре, что заканчивается и кто из менеджеров что делает — одним экраном, с телефона тоже.</p></div><div class="btns"><button class="bt" onclick="xls('пульт')">Excel</button><button class="bt p" onclick="go('funnel')">Воронка</button></div></div>
${said('Человек будет сам сидеть и обновлять всё, правильно?','Да: менеджер ведёт сделку, а напоминания, сообщения клиенту по стадиям и остатки система делает сама.')}
<div class="strip"><div><small>Сделок в работе</small><b>${W.length}</b><span>${W.filter(d=>d.st==='new').length} новые заявки</span></div><div><small>Сумма в работе</small><b>${mln(s)}</b><span>все города</span></div><div><small>Выручка · ноябрь</small><b>38,6 млн ₸</b><span>план 42 млн · 92%</span></div><div><small>Деньги в товаре</small><b>${mln(frozen)}</b><span>по закупочной цене</span></div><div><small>Ниже минимума</small><b class="bad">${low.length}</b><span>позиций хоть в одном городе</span></div></div>
<div class="g21"><div class="pan"><h3>Города <small>ноябрь, выручка и сделки</small></h3>${tbl(['Город','Компания','>Выручка','>Сделок','>Средний чек',''],[['A','T1',21400000,104],['S','T2',7900000,41],['N','T1',9300000,38]].map(r=>`<tr onclick="go('rep')"><td><b>${CITY[r[0]]}</b></td><td class="sm2">${FIRM[r[1]]}</td><td class="r">${tg(r[2])}</td><td class="r">${r[3]}</td><td class="r">${tg(r[2]/r[3])}</td><td style="width:22%">${bar(r[2]/214000)}</td></tr>`))}</div>
<div class="pan"><h3>Требует внимания</h3>${low.slice(0,4).map(p=>{const c=Object.keys(p.st).find(k=>p.st[k]<p.min);return `<div class="kv"><span><span class="dot r"></span>${esc(p.n.split(',')[0])} · ${CITY[c]}</span><b class="num">${p.st[c]} шт</b></div>`}).join('')}<div class="kv"><span><span class="dot w"></span>Счёт С-2317 не оплачен 3 дня</span><b>Дана</b></div><div class="btns l"><button class="bt sm" onclick="go('move')">Перемещение</button><button class="bt sm" onclick="go('cont')">Контейнер</button></div></div></div>
<div class="g2"><div class="pan"><h3>Менеджеры <small>сегодня</small></h3>${tbl(['Менеджер','Город','>Сделок','>КП за неделю','>Ответ, мин'],[['M1','A',3,14,6],['M2','S',3,8,11],['M3','N',2,9,9]].map(r=>`<tr><td>${MGR[r[0]]}</td><td>${CITY[r[1]]}</td><td class="r">${r[2]}</td><td class="r">${r[3]}</td><td class="r">${r[4]}</td></tr>`))}</div>
<div class="pan"><h3>Продажи по категориям <small>ноябрь</small></h3>${[['Лувер',11.2],['Гибкий мрамор',9.6],['Акупанели',7.4],['Бамбук',5.1],['WPC',3.6],['Профили и клей',1.7]].map(c=>`<div class="kv"><span>${c[0]}</span><b class="num">${String(c[1]).replace('.',',')} млн ₸</b></div>`).join('')}</div></div>`};

SC.fin=()=>{const M=[['Июнь',36.2,29.8],['Июль',39.5,31.2],['Август',44.1,35.9],['Сентябрь',41.8,33.4],['Октябрь',43.6,34.1],['Ноябрь',38.6,30.2]];
return `<div class="hd"><div><h2>Доходы и расходы</h2><p>Поступления от клиентов и расходы по статьям обеих компаний. Бухгалтер видит то же самое и выгружает в Excel.</p></div><div class="btns"><button class="bt" onclick="xls('доходы-расходы')">Excel</button><button class="bt p" onclick="addExp()">+ Расход</button></div></div>
<div class="strip"><div><small>Поступления · 6 мес</small><b>243,8 млн ₸</b><span>≈ 0,5 млрд в год</span></div><div><small>Расходы · 6 мес</small><b>194,6 млн ₸</b><span>с закупом</span></div><div><small>Валовая прибыль</small><b>49,2 млн ₸</b><span>20%</span></div><div><small>Дебиторка</small><b class="bad">6,8 млн ₸</b><span>12 клиентов</span></div><div><small>На счетах</small><b>14,1 млн ₸</b><span>2 компании</span></div></div>
<div class="g21"><div class="pan"><h3>По месяцам</h3>${tbl(['Месяц','>Доход','>Расход','>Прибыль',''],M.map(m=>`<tr><td>${m[0]}</td><td class="r">${String(m[1]).replace('.',',')} млн</td><td class="r">${String(m[2]).replace('.',',')} млн</td><td class="r"><b>${(m[1]-m[2]).toFixed(1).replace('.',',')} млн</b></td><td style="width:26%">${bar(m[1]/0.45)}</td></tr>`))}</div>
<div class="pan"><h3>Расходы · ноябрь</h3>${[['Закуп в Китае',19.8],['Доставка контейнеров',3.1],['Аренда складов (3 города)',2.4],['Зарплата',3.6],['Реклама',0.8],['Прочее',0.5]].map(e=>`<div class="kv"><span>${e[0]}</span><b class="num">${String(e[1]).replace('.',',')} млн</b></div>`).join('')}<div class="kv tot"><span>Итого</span><b>30,2 млн ₸</b></div></div></div>
<div class="pan"><h3>Последние операции</h3>${tbl(['Дата','Компания','Статья','Контрагент','>Сумма'],[['20.11','T1','Оплата С-2316','ЖК «Алтын Сай»',3640000],['19.11','T1','Оплата С-2314','Бригада Мейрама',1176000],['19.11','T2','Аренда склада Шымкент','ИП Ахметов',780000],['18.11','T1','Предоплата контейнера CN-47','Foshan Decor Co.',-9400000],['18.11','T2','Оплата С-2309','«Юг Ремонт»',640800]].map(r=>`<tr><td class="mono">${r[0]}</td><td class="sm2">${FIRM[r[1]]}</td><td>${r[2]}</td><td>${r[3]}</td><td class="r ${r[4]<0?'bad':'ok'}">${r[4]<0?'−':'+'}${tg(Math.abs(r[4]))}</td></tr>`))}</div>`};

SC.rep=()=>`<div class="hd"><div><h2>Аналитика</h2><p>Что продаётся, что лежит, откуда приходят клиенты и какие типы клиентов приносят деньги.</p></div><div class="btns"><button class="bt" onclick="xls('аналитика')">Excel</button></div></div>
<div class="g2"><div class="pan"><h3>Источники заявок <small>ноябрь</small></h3>${[['WhatsApp',96],['Instagram',71],['Повторные клиенты',44],['Звонки',31],['Сайт',19],['Тендеры',3]].map(s=>`<div class="kv"><span>${s[0]}</span><b class="num">${s[1]}</b></div>${bar(s[1])}`).join('')}</div>
<div class="pan"><h3>Типы клиентов <small>выручка, 12 мес</small></h3>${[['Объекты и застройщики',41],['Бригады',24],['Дизайнеры',22],['Розница',13]].map(s=>`<div class="kv"><span>${s[0]}</span><b class="num">${s[1]}%</b></div>${bar(s[1]*2)}`).join('')}<p class="sm2 mut" style="margin-top:8px">Средний чек ≈ 200 000 ₸, от 30–50 тыс. в рознице до 3–4 млн на объект.</p></div></div>
<div class="pan"><h3>Залежавшийся товар <small>дней на складе</small></h3>${tbl(['Позиция','Город','>Остаток','>Дней','>Заморожено'],[['BM-CRB-24','A',62,148],['AP-GRY-24','N',15,121],['LV-160-GRF','A',320,96],['FM-TRV-06','N',60,88]].map(r=>{const p=PS(r[0]);return `<tr><td>${esc(p.n)}</td><td>${CITY[r[1]]}</td><td class="r">${r[2]}</td><td class="r ${r[3]>120?'bad':''}">${r[3]}</td><td class="r">${tg(r[2]*p.cost)}</td></tr>`}))}<p class="sm2 mut" style="margin-top:8px">Подсказка: бамбук карбон в Алматы лежит 148 дней — предложить дизайнерам со скидкой через рассылку.</p></div>`;

SC.funnel=()=>{const L=DL.filter(seeD);return `<div class="hd"><div><h2>Воронка продаж</h2><p>Семь этапов от заявки до отгрузки. При переходе на этап робот сам отправляет клиенту нужное сообщение — менеджер только ведёт разговор.</p></div><div class="btns"><button class="bt" onclick="go('robots')">Роботы</button><button class="bt p" onclick="newDeal()">+ Сделка</button></div></div>
<div class="kan">${ST.map(([k,n])=>{const X=L.filter(d=>d.st===k);return `<div class="kcol"><div class="kh">${n}<span>${X.length}</span></div>${X.map(d=>`<div class="kc" onclick="openD('${d.id}')"><span class="lbl">${d.id} · ${CITY[d.city]}</span><b>${esc(CN(d.cl))}</b>${esc(d.t)}<div class="num">${d.sum?tg(d.sum):'сумма после расчёта'}</div></div>`).join('')||'<p class="sm2 mut" style="padding:10px">пусто</p>'}</div>`}).join('')}</div>
<p class="sm2 mut">Нажмите на карточку — откроется сделка с составом, расчётом и перепиской.</p>`};
function openD(id){CURD=id;go('deal')}
function newDeal(){const id='С-'+(2321+DL.length-8);DL.unshift({id,t:'Новая заявка из WhatsApp',cl:'K4',m:meId()||'M1',city:'A',firm:'T1',st:'new',sum:0,src:'WhatsApp',items:[]});build();toast(`Создана сделка <b>${id}</b>. Робот уже отправил клиенту приветствие и каталог.`)}

SC.deal=()=>{let d=DL.find(x=>x.id===CURD&&seeD(x))||DL.find(seeD);CURD=d.id;const it=d.items.map(([s,q])=>{const p=PS(s);return {p,q,sum:p.p*q}});
return `<div class="hd"><div><span class="lbl">${d.id} · ${CITY[d.city]} · ${FIRM[d.firm]}</span><h2>${esc(d.t)}</h2><p>${esc(CN(d.cl))} · источник: ${d.src} · менеджер ${MGR[d.m]}</p></div><div class="btns"><button class="bt" onclick="go('calc')">Пересчитать</button><button class="bt" onclick="go('docs')">Документы</button><button class="bt p" onclick="nextSt()">Следующий этап →</button></div></div>
<div class="chips">${ST.map(([k,n])=>`<a class="${k===d.st?'on':''}" onclick="setSt('${k}')">${n}</a>`).join('')}</div>
<div class="g21"><div class="pan"><h3>Состав заказа</h3>${it.length?tbl(['Позиция','>Кол-во','>Цена','>Сумма','Наличие'],it.map(x=>`<tr><td>${esc(x.p.n)}<div class="sm2 mut mono">${x.p.sku}</div></td><td class="r">${x.q}</td><td class="r">${tg(x.p.p)}</td><td class="r">${tg(x.sum)}</td><td>${x.p.st[d.city]>=x.q?'<span class="lbl ok">есть в '+CITY[d.city]+'</span>':'<span class="lbl bad">мало · '+x.p.st[d.city]+'</span>'}</td></tr>`)):'<p class="mut">Состав ещё не посчитан. Откройте калькулятор — он подставит количество панелей, профилей и клея.</p>'}
<div class="kv tot"><span>Итого</span><b>${d.sum?tg(d.sum):'—'}</b></div></div>
<div><div class="pan"><h3>Переписка <small>WhatsApp</small></h3><div class="msg">Здравствуйте, нужна цена и наличие, отправьте расчёт<small>09:12 · клиент</small></div><div class="msg me">Робот: Здравствуйте! Менеджер ${MGR[d.m].split(' ')[0]} свяжется в течение 15 минут. Каталог: texture.kz/cat<small>09:12 · автоматически</small></div><div class="msg me">Отправила КП с расчётом, панели есть на складе ${CITY[d.city]}<small>09:31 · ${MGR[d.m].split(' ')[0]}</small></div><button class="bt sm" onclick="go('inbox')">Открыть чат</button></div>
<div class="pan"><h3>Следующее действие</h3><div class="kv"><span>Задача</span><b>Перезвонить по КП</b></div><div class="kv"><span>Срок</span><b>сегодня 15:00</b></div><button class="bt sm" onclick="toast('Задача перенесена на завтра 11:00, менеджер получит напоминание.')">Перенести</button></div></div></div>`};
function setSt(k){const d=DL.find(x=>x.id===CURD);d.st=k;build();const r=ROB.find(x=>x[0]===k);toast(`Этап «${STN(k)}». ${r?'Робот: '+esc(r[2]):''}`)}
function nextSt(){const d=DL.find(x=>x.id===CURD);const i=ST.findIndex(s=>s[0]===d.st);setSt(ST[Math.min(i+1,ST.length-1)][0])}

let CALC={sku:'AP-WAL-24',w:6.2,h:2.8,open:1.6,waste:10};
SC.calc=()=>{const p=PS(CALC.sku);const area=Math.max(0,CALC.w*CALC.h-CALC.open);const need=area*(1+CALC.waste/100);const pcs=Math.ceil(need/p.m2);const prof=Math.ceil((CALC.w*2+CALC.h*2)/2.7);const glue=Math.ceil(area/(p.c==='Гибкий мрамор'?1:1.6));const tot=pcs*p.p+prof*2400+glue*2900;
return `<div class="hd"><div><h2>Калькулятор расчёта</h2><p>Менеджер вводит размеры стены — система считает панели с запасом на подрезку, торцевой профиль и клей, проверяет остаток в городе и собирает КП.</p></div><div class="btns"><button class="bt" onclick="toast('Расчёт сохранён в сделку '+CURD+'.')">В сделку</button><button class="bt a" onclick="sendKP(${tot})">КП в WhatsApp</button></div></div>
${said('Он считал, сколько штук, сколько где понадобится, варианты, скидки.','Это и есть калькулятор: тот же расчёт, только его делает менеджер за минуту, а не бот за клиента.')}
<div class="g2"><div class="pan"><h3>Параметры</h3>
<label class="fld"><span>Материал</span><select class="inp" onchange="CALC.sku=this.value;build()">${P.filter(x=>x.m2).map(x=>`<option value="${x.sku}" ${x.sku===CALC.sku?'selected':''}>${esc(x.n)}</option>`).join('')}</select></label>
<div class="g3"><label class="fld"><span>Ширина стены, м</span><input class="inp num" type="number" step="0.1" value="${CALC.w}" onchange="CALC.w=+this.value||0;build()"></label><label class="fld"><span>Высота, м</span><input class="inp num" type="number" step="0.1" value="${CALC.h}" onchange="CALC.h=+this.value||0;build()"></label><label class="fld"><span>Проёмы, м²</span><input class="inp num" type="number" step="0.1" value="${CALC.open}" onchange="CALC.open=+this.value||0;build()"></label></div>
<label class="fld"><span>Запас на подрезку, %</span><input class="inp num" type="number" value="${CALC.waste}" onchange="CALC.waste=+this.value||0;build()"></label>
<div class="chips">${['Розница','Дизайнер −7%','Бригада −10%','Объект — по договору'].map((x,i)=>`<a class="${i===0?'on':''}" onclick="toast('Цена пересчитается по прайсу «${x}». Скидки задаёт собственник.')">${x}</a>`).join('')}</div></div>
<div class="pan"><h3>Результат <small>${esc(p.sku)}</small></h3>
<div class="kv"><span>Площадь под отделку</span><b class="num">${area.toFixed(2).replace('.',',')} м²</b></div>
<div class="kv"><span>С запасом ${CALC.waste}%</span><b class="num">${need.toFixed(2).replace('.',',')} м²</b></div>
<div class="kv"><span>Панели · ${p.m2.toString().replace('.',',')} м² в штуке</span><b class="num">${pcs} шт × ${tg(p.p)}</b></div>
<div class="kv"><span>Профиль торцевой 2,7 м</span><b class="num">${prof} шт × 2 400 ₸</b></div>
<div class="kv"><span>Клей MS-полимер</span><b class="num">${glue} шт × 2 900 ₸</b></div>
<div class="kv"><span>Остаток в Алматы</span><b class="${p.st.A>=pcs?'ok':'bad'}">${p.st.A} шт ${p.st.A>=pcs?'· хватает':'· не хватает'}</b></div>
<div class="kv tot"><span>Итого для клиента</span><b>${tg(tot)}</b></div></div></div>`};
function sendKP(t){toast(`КП на <b>${tg(t)}</b> собрано в PDF с фото материала и отправлено клиенту в WhatsApp. Сделка перешла в «КП отправлено».`)}

SC.docs=()=>{const d=DL.find(x=>x.id===CURD)||DL[1];return `<div class="hd"><div><h2>КП, счёт, накладная</h2><p>Документы собираются из сделки по шаблону вашей компании — с логотипом, реквизитами нужного юрлица и фото материалов. Отправка в WhatsApp или на почту одной кнопкой.</p></div></div>
<div class="g3">${[['Коммерческое предложение','Расчёт, фото, сроки, условия доставки','КП'],['Счёт на оплату','Реквизиты '+FIRM[d.firm]+', Kaspi QR','Счёт'],['Расходная накладная','Для склада и клиента, подпись при отгрузке','Накладная']].map(x=>`<div class="pan"><h3>${x[0]}</h3><p class="mut sm2">${x[1]}</p><div class="kv"><span>Сделка</span><b>${d.id}</b></div><div class="kv"><span>Клиент</span><b>${esc(CN(d.cl))}</b></div><div class="btns l"><button class="bt sm" onclick="toast('${x[2]} открыт для просмотра (PDF).')">Открыть</button><button class="bt sm a" onclick="toast('${x[2]} отправлен клиенту в WhatsApp.')">В WhatsApp</button></div></div>`).join('')}</div>
<div class="pan"><h3>ЭСФ и электронные документы</h3><p>Электронные счёт-фактуры выписываются <b>через 1С</b> (при интеграции) или бухгалтером по выгрузке. Подписание ЭЦП на портале ИС ЭСФ — вручную бухгалтером: так требует порядок работы с ЭЦП. Система подсказывает, по каким отгрузкам ЭСФ ещё не выписан.</p>${tbl(['Отгрузка','Компания','>Сумма','ЭСФ'],[['С-2314','T1',1176000,'не выписан'],['С-2309','T2',640800,'выписан 18.11']].map(r=>`<tr><td>${r[0]}</td><td class="sm2">${FIRM[r[1]]}</td><td class="r">${tg(r[2])}</td><td>${r[3].startsWith('не')?'<span class="lbl bad">'+r[3]+'</span>':'<span class="lbl ok">'+r[3]+'</span>'}</td></tr>`))}</div>`};

const ROB=[['new','Заявка','Приветствие + каталог со ссылкой, менеджеру задача «ответить за 15 минут»'],['calc','Расчёт','Клиенту: «Считаем, пришлите размеры или фото стены»'],['kp','КП отправлено','Через 24 ч без ответа — напоминание менеджеру и мягкое сообщение клиенту'],['bill','Счёт','Счёт + Kaspi QR; через 2 дня без оплаты — напоминание'],['pay','Оплачено','Спасибо + дата отгрузки, задача кладовщику собрать заказ'],['ship','Отгрузка','Накладная, номер водителя, фото погрузки'],['done','Закрыто','Через 14 дней: «Как смонтировали? Пришлите фото» — для портфолио и отзывов']];
let ROBON={new:1,calc:1,kp:1,bill:1,pay:1,ship:1,done:0};
SC.robots=()=>`<div class="hd"><div><h2>Роботы по стадиям</h2><p>Не ИИ, а понятные правила: на каждом этапе система сама отправляет клиенту нужное сообщение и ставит менеджеру задачу. Тексты пишете вы.</p></div></div>
${said('Бот обрабатывал клиента, но мы его отключили — клиенты предпочитают живое общение.','Поэтому робот не «продаёт», а только присылает документы, напоминания и ставит задачи. Разговор ведёт человек.')}
<div class="pan">${ROB.map((r,i)=>`<div class="step"><code>${String(i+1).padStart(2,'0')}</code><div><b>${r[1]}</b> · <span class="lbl ${ROBON[r[0]]?'ok':''}">${ROBON[r[0]]?'включён':'выключен'}</span><div class="mut">${r[2]}</div><button class="bt sm" style="margin-top:5px" onclick="ROBON['${r[0]}']=ROBON['${r[0]}']?0:1;build()">${ROBON[r[0]]?'Выключить':'Включить'}</button> <button class="bt sm" onclick="openM('Текст робота · ${r[1]}','Можно менять в любой момент','<textarea class=&quot;inp&quot; style=&quot;height:110px;padding:8px&quot;>${esc(r[2])}</textarea>')">Текст</button></div></div>`).join('')}</div>`;

let CITYF='all';
SC.stock=()=>{const cols=CITYF==='all'?['A','S','N']:[CITYF];const own=role==='Собственник'||role==='Кладовщик';
return `<div class="hd"><div><h2>Остатки по городам</h2><p>Три склада в одной базе: менеджер Шымкента видит, что есть в Алматы, и может запросить перемещение. В демо показаны 12 позиций из ≈200.</p></div><div class="btns"><button class="bt" onclick="xls('остатки')">Excel</button><button class="bt p" onclick="go('move')">Перемещение</button></div></div>
<div class="chips">${[['all','Все склады'],['A','Алматы'],['S','Шымкент'],['N','Астана']].map(c=>`<a class="${CITYF===c[0]?'on':''}" onclick="CITYF='${c[0]}';build()">${c[1]}</a>`).join('')}</div>
<div class="pan">${tbl(['Позиция','Категория',...cols.map(c=>'>'+CITY[c]),'>Цена',...(own?['>Закуп']:[]),'Статус'],P.map(p=>{const low=cols.some(c=>p.st[c]<p.min);return `<tr onclick="toast('${esc(p.sku)}: минимальный остаток ${p.min} шт на склад. При падении ниже — сигнал собственнику и в закуп.')"><td>${esc(p.n)}<div class="sm2 mut mono">${p.sku}</div></td><td class="sm2">${p.c}</td>${cols.map(c=>`<td class="r ${p.st[c]<p.min?'bad':''}">${fmt(p.st[c])}</td>`).join('')}<td class="r">${tg(p.p)}</td>${own?`<td class="r mut">${tg(p.cost)}</td>`:''}<td>${low?'<span class="lbl bad">ниже минимума</span>':'<span class="lbl ok">норма</span>'}</td></tr>`}))}</div>`};

let MV=[{id:'П-118',sku:'AP-WAL-24',q:40,from:'A',to:'S',st:'в пути',d:'19.11'},{id:'П-117',sku:'FM-TRV-06',q:60,from:'A',to:'N',st:'принято',d:'15.11'},{id:'П-116',sku:'LV-120-OAK',q:120,from:'A',to:'S',st:'принято',d:'12.11'}];
SC.move=()=>`<div class="hd"><div><h2>Перемещения между складами</h2><p>Заявка на перемещение → отгрузка со склада-отправителя → приёмка в другом городе. Остатки меняются автоматически на обоих складах.</p></div><div class="btns"><button class="bt p" onclick="newMove()">+ Перемещение</button></div></div>
<div class="pan">${tbl(['№','Позиция','>Кол-во','Откуда','Куда','Дата','Статус',''],MV.map(m=>`<tr><td class="mono">${m.id}</td><td>${esc(PS(m.sku).n)}</td><td class="r">${m.q}</td><td>${CITY[m.from]}</td><td>${CITY[m.to]}</td><td class="mono">${m.d}</td><td>${m.st==='принято'?'<span class="lbl ok">принято</span>':'<span class="lbl w">'+m.st+'</span>'}</td><td>${m.st!=='принято'?`<button class="bt sm" onclick="acceptMove('${m.id}')">Принять</button>`:''}</td></tr>`))}</div>
<div class="pan"><h3>Подсказка системы</h3><p>В Шымкенте бамбук карбонизированный — 8 шт при минимуме 30, в Алматы — 62. Предлагаем переместить 25 шт.</p><button class="bt sm a" onclick="newMove('BM-CRB-24',25)">Создать перемещение</button></div>`;
function newMove(sku,q){sku=sku||'AP-GRY-24';q=q||20;const id='П-'+(119+MV.length-3);MV.unshift({id,sku,q,from:'A',to:'S',st:'в пути',d:'20.11'});PS(sku).st.A-=q;build();toast(`Перемещение <b>${id}</b>: ${q} шт ${esc(PS(sku).n.split(',')[0])}, Алматы → Шымкент. Кладовщик получил задачу.`)}
function acceptMove(id){const m=MV.find(x=>x.id===id);m.st='принято';PS(m.sku).st[m.to]+=m.q;build();toast(`Перемещение ${id} принято в ${CITY[m.to]}, остаток обновлён.`)}

let INV={};
SC.inv=()=>`<div class="hd"><div><h2>Инвентаризация · Алматы</h2><p>Кладовщик вводит факт с телефона, система сразу показывает расхождения и сумму. Собственник подтверждает списание или оприходование.</p></div><div class="btns"><button class="bt p" onclick="toast('Инвентаризация проведена. Расхождения отправлены собственнику на подтверждение.')">Провести</button></div></div>
<div class="pan">${tbl(['Позиция','>По системе','Факт','>Разница','>Сумма'],P.slice(0,8).map(p=>{const f=INV[p.sku]!==undefined?INV[p.sku]:p.st.A-(p.sku==='LV-120-OAK'?4:p.sku==='GL-MS-290'?0:0);const df=f-p.st.A;return `<tr><td>${esc(p.n)}</td><td class="r">${p.st.A}</td><td style="width:110px"><input class="inp num" type="number" value="${f}" onchange="INV['${p.sku}']=+this.value;build()"></td><td class="r ${df<0?'bad':df>0?'ok':''}">${df>0?'+':''}${df}</td><td class="r">${df?tg(df*p.cost):'—'}</td></tr>`}))}<p class="sm2 mut" style="margin-top:8px">Пример: по луверу дуб недостача 4 шт — повреждены при погрузке, причина пишется в акте.</p></div>`;

let CONT={id:'CN-47',st:'в пути',eta:'27.11'};
SC.cont=()=>{const L=[['FM-CAL-24',120],['BM-NAT-24',200],['AP-GRY-24',300],['LV-160-GRF',400],['GL-MS-290',1500]];const sum=L.reduce((a,x)=>a+PS(x[0]).cost*x[1],0);
return `<div class="hd"><div><h2>Контейнер из Китая · ${CONT.id}</h2><p>Заказ поставщику, предоплата, путь, растаможка, приход на склад. При приёмке остатки сразу появляются у менеджеров, а себестоимость считается с доставкой.</p></div><div class="btns"><button class="bt a" onclick="acceptCont()" ${CONT.st==='принят'?'disabled':''}>${CONT.st==='принят'?'Принят':'Принять на склад'}</button></div></div>
<div class="strip"><div><small>Поставщик</small><b style="font-size:15px">Foshan Decor Co.</b><span>Гуанчжоу</span></div><div><small>Статус</small><b>${CONT.st}</b><span>прибытие ${CONT.eta}</span></div><div><small>Товар</small><b>${mln(sum)}</b><span>по закупу</span></div><div><small>Доставка + таможня</small><b>3,1 млн ₸</b><span>распределяется на себестоимость</span></div><div><small>Склад</small><b>Алматы</b><span>потом перемещения</span></div></div>
<div class="g21"><div class="pan"><h3>Состав контейнера</h3>${tbl(['Позиция','>Кол-во','>Закуп','>Сумма'],L.map(x=>{const p=PS(x[0]);return `<tr><td>${esc(p.n)}</td><td class="r">${x[1]}</td><td class="r">${tg(p.cost)}</td><td class="r">${tg(p.cost*x[1])}</td></tr>`}))}</div>
<div class="pan"><h3>Этапы</h3>${[['Заказ поставщику','02.10',1],['Предоплата 30%','04.10',1],['Отгружен из порта','28.10',1],['Граница Хоргос','21.11',CONT.st!=='в пути'?1:0],['Приход на склад',CONT.eta,CONT.st==='принят'?1:0]].map(s=>`<div class="kv"><span><span class="dot ${s[2]?'g':''}"></span>${s[0]}</span><b class="mono">${s[1]}</b></div>`).join('')}</div></div>`};
function acceptCont(){if(CONT.st==='принят')return;[['FM-CAL-24',120],['BM-NAT-24',200],['AP-GRY-24',300],['LV-160-GRF',400],['GL-MS-290',1500]].forEach(x=>PS(x[0]).st.A+=x[1]);CONT.st='принят';build();toast('Контейнер CN-47 принят на склад Алматы. Остатки обновлены, менеджеры видят новый товар.')}

let CH='K1';
const CHATS={K1:[['c','Добрый день, для шоурума нужны акупанели орех, 42 м². Есть в наличии?','09:05'],['m','Здравствуйте! Есть, 230 шт в Алматы. Сейчас посчитаю и пришлю КП.','09:08'],['m','КП и счёт во вложении, доставка завтра.','09:40'],['c','Спасибо, оплатим сегодня','10:02']],K2:[['c','Мейрам: машина будет в 14:00, погрузите WPC?','08:51'],['m','Да, заказ собран, накладная готова.','08:55']],K5:[['call','Входящий звонок 4:12 · запись разговора','11:20'],['m','Отправил варианты бамбука на потолок, жду размеры зала.','11:31']],K8:[['c','Сколько стоит гибкий мрамор травертин?','12:40']]};
SC.inbox=()=>{const L=Object.keys(CHATS);return `<div class="hd"><div><h2>WhatsApp и звонки в одном окне</h2><p>Все переписки и записи разговоров привязаны к клиенту и сделке. Если менеджер ушёл — история остаётся у компании.</p></div></div>
<div class="chat"><div class="pan cl" style="padding:0">${L.map(k=>`<a class="${k===CH?'on':''}" onclick="CH='${k}';build()"><b>${esc(CN(k))}</b><span>${esc(CHATS[k][CHATS[k].length-1][1].slice(0,46))}</span></a>`).join('')}</div>
<div class="pan"><h3>${esc(CN(CH))} <small>${CL.find(c=>c.id===CH).ph}</small></h3>${CHATS[CH].map(m=>m[0]==='call'?`<div class="msg"><span class="dot i"></span>${m[1]}<small>${m[2]}</small></div>`:`<div class="msg ${m[0]==='m'?'me':''}">${esc(m[1])}<small>${m[2]}</small></div>`).join('')}
<div class="btns l"><input class="inp" id="msgi" placeholder="Сообщение клиенту" style="flex:1;min-width:140px"><button class="bt p" onclick="sendMsg()">Отправить</button><button class="bt" onclick="toast('Звонок через телефонию: запись сохранится в карточке клиента.')">Позвонить</button><button class="bt" onclick="go('calc')">Расчёт</button></div></div></div>`};
function sendMsg(){const i=document.getElementById('msgi');const v=(i&&i.value)||'Добрый день! Отправляю расчёт.';CHATS[CH].push(['m',v,'сейчас']);build();toast('Сообщение отправлено в WhatsApp.')}

SC.mail=()=>`<div class="hd"><div><h2>Рассылки</h2><p>Сообщения по сегментам клиентов: новинки контейнера дизайнерам, акции бригадам, напоминания постоянным. Через WhatsApp-шлюз с паузами, чтобы номер не заблокировали.</p></div><div class="btns"><button class="bt p" onclick="toast('Рассылка запланирована на завтра 11:00, 64 получателя.')">Запланировать</button></div></div>
<div class="g2"><div class="pan"><h3>Новая рассылка</h3><label class="fld"><span>Сегмент</span><select class="inp"><option>Дизайнеры · Алматы и Астана (64)</option><option>Бригады · все города (38)</option><option>Объекты, покупали за 12 мес (21)</option></select></label><label class="fld"><span>Текст</span><textarea class="inp" style="height:110px;padding:8px">Пришёл контейнер: гибкий мрамор калакатта 1200×2400 и акупанели серый дуб. Для дизайнеров −7% до 30.11. Каталог с фото — по ссылке.</textarea></label></div>
<div class="pan"><h3>Прошлые рассылки</h3>${tbl(['Дата','Сегмент','>Отправлено','>Ответили','>Сделок'],[['12.11','Дизайнеры',61,14,5],['01.11','Бригады',36,9,3],['18.10','Розница, Instagram',220,31,7]].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td class="r">${r[2]}</td><td class="r">${r[3]}</td><td class="r">${r[4]}</td></tr>`))}</div></div>`;

SC.clients=()=>`<div class="hd"><div><h2>Клиенты и контрагенты</h2><p>Розница, дизайнеры, бригады и объекты — у каждого свой прайс, история покупок и переписка. Видно, кто давно не покупал.</p></div><div class="btns"><button class="bt" onclick="xls('клиенты')">Excel</button></div></div>
<div class="pan">${tbl(['Клиент','Тип','Город','Телефон','>Покупки, 12 мес',''],CL.map(c=>`<tr onclick="CH='${c.id}';CHATS['${c.id}']=CHATS['${c.id}']||[['c','История переписки с клиентом','—']];go('inbox')"><td><b>${esc(c.n)}</b></td><td><span class="lbl ${c.t==='Объект'?'i':c.t==='Дизайнер'?'w':''}">${c.t}</span></td><td>${CITY[c.city]}</td><td class="mono sm2">${c.ph}</td><td class="r">${tg(c.sum12)}</td><td class="sm2 mut">переписка →</td></tr>`))}</div>`;

let FIRMON='all';
SC.firms=()=>`<div class="hd"><div><h2>Компании и доступы</h2><p>Две компании в одной системе. Сотрудник входит по своему логину, без привязки к юрлицу: документ оформляется от той компании, к которой относится склад или сделка.</p></div></div>
${said('Если, например, в Шымкенте другая компания, другое юрлицо — тоже без проблем?','Да. Логины отдельно, компании отдельно. Отчёты можно смотреть по каждой или вместе.')}
<div class="g2">${Object.entries(FIRM).map(([k,v])=>`<div class="pan"><h3>${v}</h3><div class="kv"><span>Склады</span><b>${k==='T1'?'Алматы, Астана':'Шымкент'}</b></div><div class="kv"><span>Учёт</span><b>${k==='T1'?'1С (действующая база)':'новая компания, база открывается'}</b></div><div class="kv"><span>Выручка · ноябрь</span><b>${k==='T1'?'30,7 млн ₸':'7,9 млн ₸'}</b></div></div>`).join('')}</div>
<div class="pan"><h3>Сотрудники</h3>${tbl(['Логин','Имя','Роль','Города'],[['erzhan','Ержан','Собственник','все'],['dana','Дана Абилова','Менеджер','Алматы'],['nurlan','Нурлан Ташев','Менеджер','Шымкент'],['asel','Асель Нуркен','Менеджер','Астана'],['serik','Серик','Кладовщик','Алматы'],['aigerim','Айгерим','Бухгалтер','обе компании']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`))}<button class="bt sm" style="margin-top:8px" onclick="toast('Сотрудник добавлен, логин и пароль отправлены в WhatsApp.')">+ Сотрудник</button></div>`;

SC.buh=()=>`<div class="hd"><div><h2>Бухгалтеру · Excel и 1С</h2><p>Два варианта на выбор. Начать можно без интеграции: склад и продажи живут в системе, бухгалтер получает выгрузку. Интеграцию с 1С можно добавить позже.</p></div></div>
<div class="g2"><div class="pan"><h3>Вариант 1 · выгрузка в Excel <small>в пакете</small></h3>${['Реализации за период по компании','Поступления оплат','Приход контейнеров с себестоимостью','Остатки по складам на дату'].map(x=>`<div class="kv"><span>${x}</span><button class="bt sm" onclick="xls('${x}')">Скачать</button></div>`).join('')}</div>
<div class="pan"><h3>Вариант 2 · интеграция с 1С <small>опция</small></h3><p>Документы реализации и поступления сами попадают в 1С нужной компании, ЭСФ выписывается из 1С. Подпись ЭЦП — вручную бухгалтером.</p><div class="kv"><span>Базы 1С</span><b>1 сейчас + 1 для новой компании</b></div><div class="kv"><span>Обмен</span><b>каждые 15 минут</b></div><button class="bt sm" style="margin-top:8px" onclick="go('launch')">Стоимость опции</button></div></div>`;

let TH='';
SC.brand=()=>`<div class="hd"><div><h2>Ваш бренд</h2><p>Система делается в цветах вашей компании, с вашим логотипом и шаблонами документов. Нажмите вариант — так будет выглядеть весь интерфейс.</p></div></div>
${said('Мне понравилось, что подстраивание под наш бизнес и весь интерфейс с нашим логотипом, с нашим колоритом.','Ниже три варианта палитры. В работе возьмём цвета из вашего логотипа.')}
<div class="sw">${[['','Камень и бамбук',['#24271f','#a5772f','#efe9df']],['th-b','Бетон и бирюза',['#1d2a33','#2f7f86','#eaeef0']],['th-c','Терракота',['#2b1f1c','#b0503a','#f2ebe7']]].map(t=>`<div class="${TH===t[0]?'on':''}" onclick="setTh('${t[0]}')"><i>${t[2].map(c=>`<s style="background:${c}"></s>`).join('')}</i><b>${t[1]}</b><div class="sm2 mut">применить ко всей системе</div></div>`).join('')}</div>
<div class="pan" style="margin-top:12px"><h3>Название в шапке</h3><div class="btns"><input class="inp" id="bn" value="${esc(document.getElementById('bname').textContent)}" style="max-width:260px"><button class="bt p" onclick="document.getElementById('bname').textContent=(document.getElementById('bn').value||'ТЕКСТУРА').toUpperCase();toast('Название обновлено.')">Применить</button></div><p class="sm2 mut" style="margin-top:8px">Логотип загружается файлом SVG или PNG и попадает в шапку, КП, счета и накладные.</p></div>`;
function setTh(t){document.body.classList.remove('th-b','th-c');if(t)document.body.classList.add(t);TH=t;build();toast('Палитра применена ко всей системе.')}

SC.content=()=>`<div class="hd"><div><h2>Контент · будущий модуль</h2><p>Генерация роликов для Instagram на нейросетевых сервисах (вроде Higgsfield) и запуск таргета — это отдельное направление. В демо показано, как модуль встанет в систему потом; в первый пакет он не входит.</p></div><div class="btns"><button class="bt" onclick="toast('Модуль подключается отдельным этапом после запуска основной системы.')">Подробнее</button></div></div>
${said('Хотели бы сразу интегрировать с соцсетями, чтобы автоматизированно выкладывал ролики и пускал таргет.','Сначала — основа: воронка, склады, деньги. Сервис роликов подключим к ней отдельным этапом: товары и фото возьмутся из каталога.')}
<div class="pan"><h3>Как будет работать <small>опция</small></h3>${[['Выбор товара','Из каталога: фото, название, цена, остаток'],['Генерация ролика','Через API сервиса генерации видео, 3–4 варианта'],['Проверка человеком','Маркетолог выбирает и правит текст'],['Публикация','Instagram, по расписанию'],['Заявки','Входящие из рекламы сразу падают в воронку']].map((s,i)=>`<div class="step"><code>${i+1}</code><div><b>${s[0]}</b><div class="mut">${s[1]}</div></div></div>`).join('')}</div>
<div class="pan"><h3>Черновики роликов <small>макет</small></h3><div class="ph"><div>Гибкий мрамор · травертин в ванной</div><div>Лувер графит · ТВ-зона</div><div>Акупанели · кабинет</div><div>Бамбук · потолок ресторана</div></div></div>`;

SC.ai=()=>`<div class="hd"><div><h2>Про ИИ — честно</h2><p>Коротко о том, что сегодня реально работает в оптовых продажах отделочных материалов, а что пока реклама.</p></div></div>
<div class="g2"><div class="pan"><h3>Работает сейчас</h3>${['Роботы по стадиям: сообщения, напоминания, документы','Калькулятор и сборка КП за минуту','Сигналы: заканчивается товар, не оплачен счёт, клиент давно не покупал','Аналитика собственника без ручных отчётов','Подсказки менеджеру по переписке — как эксперимент через шлюз'].map(x=>`<div class="kv"><span><span class="dot g"></span>${x}</span></div>`).join('')}</div>
<div class="pan"><h3>Пока не работает</h3>${['Робот, который сам продаёт и закрывает сделки','Голосовые роботы на русском — низкая конверсия, клиенты узнают','Отдел продаж «без людей» — продажи остаются за менеджерами'].map(x=>`<div class="kv"><span><span class="dot r"></span>${x}</span></div>`).join('')}<p class="sm2 mut" style="margin-top:8px">По вашим цифрам (≈0,5 млрд ₸ в год, средний чек ≈200 тыс.) это 7–15 заявок в день: на город хватает 1–2 менеджеров с хорошим инструментом.</p></div></div>`;

SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Разработка один раз, система ваша, на вашем сервере, без подписки. 4–6 недель, несколько версий с вашим утверждением.</p></div><div class="btns"><button class="bt a" onclick="toast('Показ демо — понедельник, 23.11, 10:00.')">Показ демо</button></div></div>
<div class="g3">${[['Базовый','1 800 000 ₸','Воронка, роботы, калькулятор, КП и документы, клиенты, WhatsApp и звонки, финансы, аналитика, бренд'],['Со складом · рекомендуем','2 000 000 ₸','Всё из базового + склады трёх городов, перемещения, инвентаризация, приход контейнеров, две компании'],['Со складом и 1С','2 600 000 ₸','Всё выше + двусторонняя интеграция с 1С (+800 000 ₸), ЭСФ из 1С']].map((x,i)=>`<div class="pan" style="${i===1?'border:2px solid var(--ink)':''}"><span class="lbl">${x[0]}</span><h3 style="font-size:22px;margin:6px 0">${x[1]}</h3><p class="sm2 mut">${x[2]}</p></div>`).join('')}</div>
<div class="pan"><h3>Оплата 30 / 40 / 30 <small>для пакета 2 000 000 ₸</small></h3><div class="kv"><span>Старт, утверждение этапов и прототипа</span><b>600 000 ₸</b></div><div class="kv"><span>Развёрнутая система на вашем сервере</span><b>800 000 ₸</b></div><div class="kv"><span>Полировка и передача</span><b>600 000 ₸</b></div><div class="kv"><span>Поддержка</span><b>3 месяца включены, далее 20 $/час</b></div></div>`;

/* ===== каркас ===== */
function xls(n){toast(`Файл «${esc(n)}» выгружен в Excel.`)}
function addExp(){openM('Новый расход','Статья, сумма, компания','<label class="fld"><span>Статья</span><select class="inp"><option>Аренда склада</option><option>Доставка</option><option>Реклама</option></select></label><label class="fld"><span>Сумма</span><input class="inp" value="250000"></label><button class="bt p" onclick="closeM();toast(\'Расход добавлен.\')">Сохранить</button>')}
function renderRoles(){document.getElementById('roles').innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${v.av}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');document.getElementById('rsel').innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('rsel').value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;document.getElementById('rsel').value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map((s,i)=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><code>${String(i+1).padStart(2,'0')}</code>${s.n}</a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('');
 document.getElementById('shint').textContent=role+' · '+ROLES[role].n}
function build(){if(!allowed(cur))cur=ROLES[role].s[0];buildRail();document.getElementById('ttl').textContent=SUBN[cur];document.getElementById('content').innerHTML=SC[cur]();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль вверху.');return}cur=k;build();window.scrollTo(0,0)}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6000)}
const TOUR=[['dash','1 · Пульт собственника: три города, деньги в товаре.'],['funnel','2 · Воронка с роботами по стадиям.'],['calc','3 · Калькулятор: панели, профиль, клей, КП в WhatsApp.'],['stock','4 · Остатки трёх складов.'],['move','5 · Перемещения между городами.'],['cont','6 · Приход контейнера из Китая.'],['inbox','7 · WhatsApp и звонки в одном окне.'],['firms','8 · Две компании, одни логины.'],['brand','9 · Ваши цвета и логотип.'],['launch','10 · Стоимость: от 1,8 млн ₸, без подписки.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false}
(function(){renderRoles();document.getElementById('rsel').addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
