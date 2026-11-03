/* КАРАСУ ТАРА — производство пластиковых ящиков и корзинок (Дмитрий, Карасу). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const kg=n=>fmt(n)+' кг';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='04.11.2026',NOW='11:40';
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>Из встречи 03.11</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const crumbs=(...a)=>`<div class="crumbl">${a.map((x,i)=>i<a.length-1?`<a onclick="${x[1]}">${esc(x[0])}</a>`:`<b>${esc(x[0])}</b>`).join(' <i>/</i> ')}</div>`;
const G=d=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const SEC=[
 {k:'day',n:'Пульт',ic:G('<path d="M3 13h4v8H3zM10 8h4v13h-4zM17 3h4v18h-4z"/>'),sub:[['dash','Пульт владельца']]},
 {k:'sale',n:'Продажи',ic:G('<path d="M3 4h18l-7 8v7l-4 2v-9z"/>'),sub:[['funnel','Воронка заказов'],['order','Заказ и калькулятор'],['clients','Клиенты']]},
 {k:'prod',n:'Цех',ic:G('<path d="M3 21V9l6 4V9l6 4V5h6v16z"/>'),sub:[['prod','Производство'],['shift','Смена оператора'],['raw','Сырьё'],['types','Виды ящиков']]},
 {k:'wh',n:'Склад',ic:G('<path d="M3 9l9-5 9 5v11H3z"/><path d="M8 20v-6h8v6"/>'),sub:[['stock','Готовые ящики'],['ship','Отгрузки и бой'],['inv','Инвентаризация']]},
 {k:'dl',n:'Посредники',ic:G('<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c1-4 4-6 6-6s5 2 6 6M14 15c3 0 6 2 7 5"/>'),sub:[['dealers','Консигнация и долги'],['cabinet','Кабинет посредника']]},
 {k:'team',n:'Команда',ic:G('<path d="M4 20c0-4 4-6 8-6s8 2 8 6"/><circle cx="12" cy="8" r="4"/>'),sub:[['staff','Сотрудники и доступы'],['reports','Отчёты в Excel'],['launch','Стоимость и этапы']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Владелец':{av:'ДВ',n:'Дмитрий Винер',note:'Всё: заказы, цех, сырьё, склад, посредники, деньги',s:ALL.filter(x=>x!=='cabinet')},
 'Менеджер':{av:'АС',n:'Асель · продажи',note:'Заказы, калькулятор, счета, клиенты, отгрузки',s:['funnel','order','clients','stock','ship','dealers']},
 'Оператор':{av:'ЕК',n:'Ерке · оператор ТПА-2',note:'С телефона: выпуск за смену и брак',s:['shift']},
 'Мастер цеха':{av:'СМ',n:'Сергей · мастер',note:'План цеха, смены, сырьё, виды ящиков',s:['prod','shift','raw','types','stock']},
 'Кладовщик':{av:'НБ',n:'Нуржан · склад',note:'Приход сырья, отгрузки, бой при погрузке, инвентаризация',s:['stock','ship','inv','raw']},
 'Посредник':{av:'БМ',n:'Бахыт · рынок «Алтын Орда»',note:'Свой кабинет: что получил, что продал, сколько должен',s:['cabinet']}
};
let role='Владелец',cur='dash';

/* ===== Виды ящиков ===== w — вес изделия, кг; cyc — секунд на цикл ТПА */
let TYPES=[
 {id:'Я-60',n:'Ящик ягодный 600×400×110',w:0.62,price:520,cost:340,col:'чёрный',min:5000,cyc:42},
 {id:'Я-62',n:'Ящик овощной 600×400×200',w:0.95,price:780,cost:510,col:'чёрный',min:3000,cyc:55},
 {id:'Я-50',n:'Ящик фруктовый 500×300×160',w:0.71,price:610,cost:395,col:'чёрный',min:3000,cyc:46},
 {id:'К-10',n:'Корзинка ягодная 1 кг',w:0.065,price:48,cost:27,col:'чёрный',min:20000,cyc:14},
 {id:'К-05',n:'Корзинка ягодная 0,5 кг',w:0.042,price:34,cost:19,col:'чёрный',min:20000,cyc:12}
];
const TY=id=>TYPES.find(t=>t.id===id)||TYPES[0];
let STOCK={'Я-60':18400,'Я-62':4200,'Я-50':2650,'К-10':61000,'К-05':14800};
let RES={'Я-60':6000,'Я-62':1500,'Я-50':0,'К-10':20000,'К-05':0};
const free=id=>STOCK[id]-(RES[id]||0);

/* ===== Сырьё ===== */
let RAW=[{id:'R1',n:'ПНД вторичный, гранула',unit:'кг',q:21400,min:15000,price:310},{id:'R2',n:'ПП вторичный, гранула',unit:'кг',q:6800,min:5000,price:340},{id:'R3',n:'Краситель чёрный, суперконцентрат',unit:'кг',q:410,min:300,price:1450}];
const RW=id=>RAW.find(r=>r.id===id);
const RAWIN=[['01.11','ТОО «ПолимерВтор»','ПНД вторичный',20000,'Нуржан'],['28.10','ИП Ахметов','ПП вторичный',8000,'Нуржан'],['20.10','ТОО «ПолимерВтор»','Краситель',500,'Нуржан']];
const WASTE=0.03; /* литники и отход 3% */

/* ===== Станки и смены ===== */
const MACH=['ТПА-1','ТПА-2','ТПА-3','ТПА-4'];
let SHIFTS=[
 {d:'04.11',sh:'день',m:'ТПА-1',op:'AB',t:'Я-60',plan:1400,fact:1120,br:18,st:'go'},
 {d:'04.11',sh:'день',m:'ТПА-2',op:'EK',t:'К-10',plan:5200,fact:4310,br:60,st:'go'},
 {d:'04.11',sh:'день',m:'ТПА-3',op:'MZ',t:'Я-62',plan:1000,fact:760,br:9,st:'go'},
 {d:'04.11',sh:'день',m:'ТПА-4',op:'—',t:'Я-50',plan:0,fact:0,br:0,st:'stop'},
 {d:'03.11',sh:'ночь',m:'ТПА-1',op:'RK',t:'Я-60',plan:1400,fact:1390,br:22,st:'done'},
 {d:'03.11',sh:'ночь',m:'ТПА-2',op:'TS',t:'К-10',plan:5200,fact:5240,br:51,st:'done'},
 {d:'03.11',sh:'ночь',m:'ТПА-3',op:'DO',t:'Я-62',plan:1000,fact:980,br:14,st:'done'},
 {d:'03.11',sh:'день',m:'ТПА-4',op:'AB',t:'Я-50',plan:1200,fact:1150,br:16,st:'done'}
];

/* ===== Команда ===== */
let STAFF=[
 {id:'DV',n:'Дмитрий Винер',pos:'Владелец',ph:'+7 701 300 10 20',st:'on',login:'dmitriy'},
 {id:'AS',n:'Асель Нурланова',pos:'Менеджер по продажам',ph:'+7 707 412 50 31',st:'on',login:'asel'},
 {id:'SM',n:'Сергей Мельник',pos:'Мастер цеха',ph:'+7 705 221 77 40',st:'on',login:'sergey'},
 {id:'NB',n:'Нуржан Бекетов',pos:'Кладовщик',ph:'+7 702 118 03 66',st:'on',login:'nurzhan'},
 {id:'EK',n:'Ерке Касымова',pos:'Оператор ТПА',ph:'+7 747 501 29 14',st:'on',login:'erke'},
 {id:'AB',n:'Арман Бейсенов',pos:'Оператор ТПА',ph:'+7 776 300 41 88',st:'on',login:'arman'},
 {id:'MZ',n:'Марат Жумабаев',pos:'Оператор ТПА',ph:'+7 701 640 19 05',st:'on',login:'marat'},
 {id:'RK',n:'Руслан Ким',pos:'Оператор ТПА · ночь',ph:'+7 708 115 62 30',st:'on',login:'ruslan'},
 {id:'TS',n:'Тимур Садыков',pos:'Оператор ТПА · ночь',ph:'+7 705 773 08 47',st:'on',login:'timur'},
 {id:'DO',n:'Данияр Омаров',pos:'Оператор ТПА · ночь',ph:'+7 777 209 51 63',st:'on',login:'daniyar'},
 {id:'GA',n:'Гульмира Аханова',pos:'Бухгалтер',ph:'+7 701 812 44 70',st:'on',login:'gulmira'},
 {id:'VP',n:'Виктор Пак',pos:'Грузчик-водитель',ph:'+7 707 330 26 12',st:'on',login:'viktor'}
];
const SF=id=>STAFF.find(s=>s.id===id)||{n:'—',id:'—',pos:''};
const fn=id=>SF(id).n.split(' ')[0];

/* ===== Клиенты и заказы ===== */
let CLIENTS=[
 {id:'C1',n:'КХ «Ягодная долина»',type:'Фермер, клубника',city:'Есик',ph:'+7 701 455 18 20',vol:'40 000 корзинок за сезон'},
 {id:'C2',n:'ТОО «Талгар Агро»',type:'Овощи, теплицы',city:'Талгар',ph:'+7 727 400 22 10',vol:'8 000 ящиков в месяц'},
 {id:'C3',n:'ИП Сейтказиев',type:'Сад, яблоки',city:'Каскелен',ph:'+7 705 311 70 02',vol:'6 000 ящиков за сезон'},
 {id:'C4',n:'ТОО «FreshLine»',type:'Дистрибуция фруктов',city:'Алматы',ph:'+7 727 355 81 00',vol:'постоянно'},
 {id:'C5',n:'КХ «Байтерек»',type:'Малина, смородина',city:'Карасу',ph:'+7 777 520 43 19',vol:'15 000 корзинок'}
];
const CL=id=>CLIENTS.find(c=>c.id===id)||CLIENTS[0];
const STG=[['new','Новый'],['calc','Расчёт'],['bill','Счёт отправлен'],['make','В производстве'],['ready','Готов'],['ship','Отгружен'],['paid','Оплачен']];
const STN=k=>(STG.find(s=>s[0]===k)||['',''])[1];
let ORDERS=[
 {id:'З-512',cl:'C1',items:[['К-10',20000]],stg:'make',date:'02.11',due:'08.11',pay:'перевод',paid:0,mgr:'AS'},
 {id:'З-514',cl:'C2',items:[['Я-62',1500],['Я-60',2000]],stg:'ready',date:'01.11',due:'05.11',pay:'перевод',paid:0,mgr:'AS'},
 {id:'З-515',cl:'C4',items:[['Я-60',4000]],stg:'bill',date:'03.11',due:'10.11',pay:'перевод',paid:0,mgr:'AS'},
 {id:'З-516',cl:'C3',items:[['Я-50',3000]],stg:'calc',date:'04.11',due:'15.11',pay:'наличные',paid:0,mgr:'DV'},
 {id:'З-517',cl:'C5',items:[['К-05',15000],['К-10',5000]],stg:'new',date:'04.11',due:'—',pay:'—',paid:0,mgr:'AS'},
 {id:'З-509',cl:'C2',items:[['Я-62',2000]],stg:'ship',date:'28.10',due:'31.10',pay:'перевод',paid:800000,mgr:'AS'},
 {id:'З-505',cl:'C4',items:[['Я-60',3000],['Я-50',1000]],stg:'paid',date:'24.10',due:'27.10',pay:'перевод',paid:2104000,mgr:'AS'}
];
const OR=id=>ORDERS.find(o=>o.id===id)||ORDERS[0];
let curO='З-514';
/* скидка за объём */
const disc=q=>q>=10000?0.1:q>=3000?0.05:0;
const oSum=o=>o.items.reduce((a,[t,q])=>a+TY(t).price*q*(1-disc(q)),0);
const oKg=o=>o.items.reduce((a,[t,q])=>a+TY(t).w*q*(1+WASTE),0);

/* ===== Посредники (консигнация) ===== */
let DEALERS=[
 {id:'P1',n:'Бахыт · рынок «Алтын Орда»',ph:'+7 701 777 31 40',lim:1500000,ship:[['20.10','Я-60',1500,520],['28.10','К-10',10000,46],['02.11','Я-62',600,760]],sold:[['Я-60',1300],['К-10',7200],['Я-62',150]],pays:[['25.10',500000],['01.11',320000]]},
 {id:'P2',n:'Ольга · Талгарский рынок',ph:'+7 705 600 12 88',lim:1000000,ship:[['22.10','Я-60',1000,520],['30.10','Я-50',800,600]],sold:[['Я-60',1000],['Я-50',520]],pays:[['29.10',520000]]},
 {id:'P3',n:'ТОО «АгроТара Шымкент»',ph:'+7 725 300 44 00',lim:3000000,ship:[['15.10','Я-62',2000,750],['27.10','Я-60',3000,500]],sold:[['Я-62',2000],['Я-60',1900]],pays:[['20.10',1000000],['30.10',1000000]]}
];
const DLR=id=>DEALERS.find(d=>d.id===id)||DEALERS[0];
const dShip=d=>d.ship.reduce((a,s)=>a+s[2]*s[3],0);
const dSold=d=>d.sold.reduce((a,[t,q])=>{const s=d.ship.find(x=>x[1]===t);return a+q*(s?s[3]:TY(t).price)},0);
const dPaid=d=>d.pays.reduce((a,p)=>a+p[1],0);
const dDebt=d=>dSold(d)-dPaid(d);
const dLeft=d=>dShip(d)-dSold(d);
let curD='P1';
let BREAK=[['03.11','З-509','Я-62',12,'Погрузка, Виктор'],['31.10','З-505','Я-60',8,'Погрузка, Виктор'],['28.10','—','К-10',140,'Склад: упала паллета']];

const SC={};
/* ===== Пульт ===== */
SC.dash=()=>{const today=SHIFTS.filter(s=>s.d==='04.11'),yest=SHIFTS.filter(s=>s.d==='03.11');
 const made=yest.reduce((a,s)=>a+s.fact,0),br=yest.reduce((a,s)=>a+s.br,0);
 const month=96400,plan=100000;const debt=DEALERS.reduce((a,d)=>a+dDebt(d),0),cons=DEALERS.reduce((a,d)=>a+dLeft(d),0);
 const openO=ORDERS.filter(o=>!['paid'].includes(o.stg));const lowRaw=RAW.filter(r=>r.q<r.min*1.5);
 return `<div class="hd"><div><h2>Доброе утро, Дмитрий</h2><p>${TODAY}, ${NOW}. Цех, сырьё, склад, заказы и посредники — на одном экране. Раньше это было в Excel.</p></div><div class="btns"><button class="bt" onclick="xlsDash()">Excel</button><button class="bt p" onclick="newOrder()">+ Заказ</button></div></div>
 <div class="tape">
  <div><small>Сделано за ноябрь</small><b>${fmt(month)} шт</b>${bar(pct(month,plan),'g')}<span>план ${fmt(plan)} · можно до 170 000 при полной загрузке</span></div>
  <div><small>Вчера, 2 смены</small><b>${fmt(made)} шт</b><span>брак ${fmt(br)} шт · ${(br/made*100).toFixed(1).replace('.',',')}%</span></div>
  <div><small>Сырьё на складе</small><b>${kg(RAW[0].q+RAW[1].q)}</b><span>хватит на ~${Math.round((RAW[0].q+RAW[1].q)/2600)} дней работы</span></div>
  <div><small>Открытые заказы</small><b>${openO.length}</b><span>${tg(openO.reduce((a,o)=>a+oSum(o)-o.paid,0))} к оплате</span></div>
  <div><small>Долг посредников</small><b class="bad">${tg(debt)}</b><span>ещё у них на реализации ${tg(cons)}</span></div>
 </div>
 <div class="g21"><div>
  <div class="pan"><h3>Цех сейчас · дневная смена</h3><p>Операторы вносят выпуск с телефона — цифры обновляются в течение смены.</p>
   <div class="machs">${today.map(s=>`<a class="mch ${s.st}" onclick="go('prod')"><code>${s.m}</code><b>${s.st==='stop'?'Стоит':esc(TY(s.t).n)}</b>${s.st==='stop'?'<span>ждёт пресс-форму Я-50 · с 08:00</span>':`<span>${fn(s.op)} · ${fmt(s.fact)} из ${fmt(s.plan)}</span>${bar(pct(s.fact,s.plan),pct(s.fact,s.plan)>70?'g':'w')}`}</a>`).join('')}</div></div>
  <div class="pan"><h3>Склад готовых ящиков</h3><p>По каждому виду: сколько есть, сколько зарезервировано под заказы, сколько свободно.</p>
   <table class="t sm"><thead><tr><th>Вид</th><th class="r">На складе</th><th class="r">Резерв</th><th class="r">Свободно</th><th style="width:28%"></th></tr></thead><tbody>${TYPES.map(t=>`<tr onclick="go('stock')"><td><b>${t.id}</b> ${esc(t.n)}</td><td class="r">${fmt(STOCK[t.id])}</td><td class="r">${fmt(RES[t.id]||0)}</td><td class="r ${free(t.id)<t.min?'bad':''}">${fmt(free(t.id))}</td><td>${bar(pct(free(t.id),t.min*3),free(t.id)<t.min?'r':'g')}</td></tr>`).join('')}</tbody></table></div>
 </div><div>
  <div class="pan"><h3>Требует внимания</h3><div class="alist">
   <a onclick="go('raw')"><i class="dt w"></i><b>Краситель: ${kg(RAW[2].q)}</b><span>хватит на 6 дней — пора заказать</span></a>
   <a onclick="openDealer('P1')"><i class="dt r"></i><b>Бахыт должен ${tg(dDebt(DLR('P1')))}</b><span>продал больше, чем оплатил · лимит ${tg(DLR('P1').lim)}</span></a>
   <a onclick="openOrder('З-514')"><i class="dt g"></i><b>З-514 «Талгар Агро» готов к отгрузке</b><span>3 500 ящиков · счёт не оплачен</span></a>
   <a onclick="go('prod')"><i class="dt w"></i><b>ТПА-4 стоит с утра</b><span>смена без оператора · план Я-50 сорван</span></a>
   <a onclick="go('stock')"><i class="dt r"></i><b>Я-50 свободно ${fmt(free('Я-50'))} — ниже минимума</b><span>заказ З-516 на 3 000 шт · поставьте в план</span></a>
  </div></div>
  <div class="pan"><h3>Деньги за ноябрь</h3><div class="kv"><span>Отгружено клиентам</span><b>${tg(31800000)}</b></div><div class="kv"><span>Оплачено</span><b>${tg(26400000)}</b></div><div class="kv"><span>Себестоимость (сырьё + смены)</span><b>${tg(20900000)}</b></div><div class="kv"><span>Валовая прибыль</span><b class="ok">${tg(10900000)}</b></div></div>
 </div></div>
 ${said('«Сейчас я это всё сам делаю в Excel… мне нужно больше понимания — объёмы выросли.»','Пульт собирает всё сам: операторы, кладовщик и менеджер вносят свои данные, Дмитрий видит итог.')}`};

/* ===== Воронка ===== */
SC.funnel=()=>`<div class="hd"><div><h2>Воронка заказов</h2><p>Каждый клиент и каждый заказ — карточкой. Перетащите заказ на следующий этап или откройте его. Широкая сверху и узкая снизу: не все, кто спросил, покупают — это и видно.</p></div><div class="btns"><button class="bt" onclick="xlsOrders()">Excel</button><button class="bt p" onclick="newOrder()">+ Заказ</button></div></div>
 <div class="kanban">${STG.map(([k,n])=>{const x=ORDERS.filter(o=>o.stg===k);return `<div class="kcol" ondragover="event.preventDefault()" ondrop="dropO(event,'${k}')"><div class="kh"><b>${n}</b><span>${x.length}</span></div>${x.map(o=>`<div class="kc" draggable="true" ondragstart="event.dataTransfer.setData('t','${o.id}')" onclick="openOrder('${o.id}')"><code>${o.id} · ${o.date}</code><b>${esc(CL(o.cl).n)}</b><span>${o.items.map(([t,q])=>fmt(q)+' × '+t).join(', ')}</span><div class="kf"><em>${tg(oSum(o))}</em><i>${kg(oKg(o))}</i></div></div>`).join('')||'<div class="kempty">пусто</div>'}</div>`}).join('')}</div>`;
function dropO(e,k){const o=OR(e.dataTransfer.getData('t'));if(!o)return;o.stg=k;if(k==='make')o.items.forEach(([t,q])=>RES[t]=(RES[t]||0)+0);render();toast(`${o.id} → <b>${STN(k)}</b>${k==='ship'?'. Ящики списаны со склада, клиенту ушла накладная.':k==='make'?'. Мастер цеха получил задание в план.':''}`)}
function openOrder(id){curO=id;go('order')}
function newOrder(){const id='З-'+(518+ORDERS.length-7);ORDERS.unshift({id,cl:'C1',items:[['К-10',10000]],stg:'calc',date:'04.11',due:'—',pay:'—',paid:0,mgr:'AS'});curO=id;go('order');toast(`Заказ ${id} создан. Выберите клиента и ящики — калькулятор посчитает цену, вес и сырьё.`)}

/* ===== Заказ и калькулятор ===== */
SC.order=()=>{const o=OR(curO),c=CL(o.cl);const si=STG.findIndex(s=>s[0]===o.stg);const sum=oSum(o);
 return crumbs(['Воронка',"go('funnel')"],[o.id])+`<div class="hd"><div><h2>Заказ ${o.id} · ${esc(c.n)}</h2><p>${esc(c.type)} · ${c.city} · ${c.ph} · срок ${o.due}</p></div><div class="btns"><button class="bt" onclick="bill()">Счёт в WhatsApp</button><button class="bt" onclick="toMake()">В производство</button><button class="bt p" onclick="shipO()">Отгрузить</button></div></div>
 <div class="chainS">${STG.map(([k,n],i)=>`<a class="${i<si?'ok':i===si?'cur':''}" onclick="OR(curO).stg='${k}';render()">${n}</a>`).join('')}</div>
 <div class="g21"><div>
  <div class="pan"><h3>Калькулятор заказа</h3><p>Выберите вид и количество — цена со скидкой за объём, вес и сырьё считаются сразу. Скидка: от 3 000 шт — 5%, от 10 000 — 10%.</p>
   <div class="tw"><table class="t"><thead><tr><th>Вид ящика</th><th class="r">Кол-во</th><th class="r">Цена</th><th class="r">Скидка</th><th class="r">Сумма</th><th class="r">Сырьё</th><th class="r">Свободно</th><th></th></tr></thead><tbody>
   ${o.items.map(([t,q],i)=>{const T=TY(t),d=disc(q);return `<tr><td><select class="sel sm" onchange="OR(curO).items[${i}][0]=this.value;render()">${TYPES.map(x=>`<option value="${x.id}" ${x.id===t?'selected':''}>${x.id} · ${esc(x.n)}</option>`).join('')}</select></td><td class="r"><input class="qin" type="number" value="${q}" onchange="OR(curO).items[${i}][1]=+this.value||0;render()"></td><td class="r">${tg(T.price)}</td><td class="r">${d?'−'+d*100+'%':'—'}</td><td class="r"><b>${tg(T.price*q*(1-d))}</b></td><td class="r">${kg(T.w*q*(1+WASTE))}</td><td class="r ${free(t)<q?'bad':'ok'}">${fmt(free(t))}</td><td><button class="xb" onclick="OR(curO).items.splice(${i},1);render()">×</button></td></tr>`}).join('')}
   <tr><td colspan="8"><a class="lnk" onclick="OR(curO).items.push(['Я-60',1000]);render()">+ добавить вид ящика</a></td></tr>
   <tr class="total"><td>Итого</td><td class="r">${fmt(o.items.reduce((a,x)=>a+x[1],0))} шт</td><td></td><td></td><td class="r">${tg(sum)}</td><td class="r">${kg(oKg(o))}</td><td></td><td></td></tr></tbody></table></div>
   ${o.items.some(([t,q])=>free(t)<q)?`<div class="warnb">Части ящиков нет на складе. Не хватает: ${o.items.filter(([t,q])=>free(t)<q).map(([t,q])=>fmt(q-free(t))+' × '+t).join(', ')}. «В производство» — мастер получит задание, система посчитает смены: ~${Math.ceil(o.items.reduce((a,[t,q])=>a+Math.max(0,q-free(t))*TY(t).cyc,0)/3600/11)} смен на одном ТПА.</div>`:'<div class="okb">Всё есть на складе — можно отгружать сразу после оплаты.</div>'}</div>
  <div class="pan"><h3>История заказа</h3>${[[o.date+' 10:12','Асель','Заказ из WhatsApp: «'+o.items.map(([t,q])=>fmt(q)+' '+TY(t).n.toLowerCase()).join(', ')+'»'],[o.date+' 10:30','Система','Расчёт: '+tg(sum)+', сырья '+kg(oKg(o))],si>=2?[o.date+' 11:00','Асель','Счёт № '+o.id.slice(2)+' отправлен клиенту в WhatsApp']:null,si>=3?['03.11 08:00','Сергей','Поставлен в план цеха: ТПА-1, ТПА-3']:null].filter(Boolean).map(h=>`<div class="kv"><span><code>${h[0]}</code> ${h[1]}</span><b class="wrap">${esc(h[2])}</b></div>`).join('')}</div>
 </div><div>
  <div class="pan inv"><div class="invh"><b>СЧЁТ № ${o.id.slice(2)}</b><span>от ${o.date}.2026</span></div><p class="mini">Покупатель: ${esc(c.n)}</p>${o.items.map(([t,q])=>`<div class="kv"><span>${esc(TY(t).n)} × ${fmt(q)}</span><b>${tg(TY(t).price*q*(1-disc(q)))}</b></div>`).join('')}<div class="kv tot"><span>К оплате</span><b>${tg(sum)}</b></div><div class="kv"><span>Оплачено</span><b>${tg(o.paid)}</b></div><div class="kv"><span>Способ</span><b>${o.pay}</b></div><button class="bt full" onclick="payO()">Отметить оплату</button></div>
  <div class="pan"><h3>Клиент</h3><div class="kv"><span>Объём</span><b>${esc(c.vol)}</b></div><div class="kv"><span>Заказов</span><b>${ORDERS.filter(x=>x.cl===c.id).length}</b></div><div class="kv"><span>Ответственный</span><b>${esc(SF(o.mgr).n)}</b></div></div>
 </div></div>`};
function bill(){const o=OR(curO);o.stg='bill';render();toast(`Счёт на ${tg(oSum(o))} сформирован и ушёл клиенту в WhatsApp.`)}
function toMake(){const o=OR(curO);o.stg='make';o.items.forEach(([t,q])=>RES[t]=(RES[t]||0)+Math.min(q,free(t)));render();toast('Заказ в производстве: свободные ящики зарезервированы, недостающие — в плане цеха у мастера.')}
function payO(){const o=OR(curO);o.paid=oSum(o);if(o.stg!=='ship')o.stg='paid';render();toast('Оплата отмечена. Бухгалтер видит её в отчёте, долг клиента закрыт.')}
function shipO(){go('ship');toast('Оформите отгрузку: количество, машина, бой при погрузке.')}

/* ===== Клиенты ===== */
SC.clients=()=>`<div class="hd"><div><h2>Клиенты</h2><p>Фермеры, сады, дистрибьюторы. Кто, что берёт, когда сезон — чтобы заранее напомнить и запланировать цех.</p></div><div class="btns"><button class="bt" onclick="xls('Клиенты',['Клиент','Тип','Город','Телефон','Объём'],CLIENTS.map(c=>[c.n,c.type,c.city,c.ph,c.vol]))">Excel</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Что выращивает</th><th>Город</th><th>Объём</th><th class="r">Заказов</th><th class="r">Сумма</th></tr></thead><tbody>${CLIENTS.map(c=>{const os=ORDERS.filter(o=>o.cl===c.id);return `<tr onclick="${os[0]?`openOrder('${os[0].id}')`:''}"><td><b>${esc(c.n)}</b><span class="sub">${c.ph}</span></td><td>${esc(c.type)}</td><td>${c.city}</td><td class="mini">${esc(c.vol)}</td><td class="r">${os.length}</td><td class="r">${tg(os.reduce((a,o)=>a+oSum(o),0))}</td></tr>`}).join('')}</tbody></table></div>
 <div class="pan" style="margin-top:12px"><h3>Сезонность</h3><p>Клубника — май–июнь, малина — июль, яблоки — сентябрь. Система напомнит менеджеру связаться за месяц до сезона, а мастеру — нарастить корзинки на склад.</p><div class="season">${['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'].map((m,i)=>`<div><i style="height:${[10,12,25,55,95,100,80,60,85,50,20,12][i]}%"></i><span>${m}</span></div>`).join('')}</div></div>`;

/* ===== Производство ===== */
let pDay='04.11';
SC.prod=()=>{const S=SHIFTS.filter(s=>s.d===pDay);const f=S.reduce((a,s)=>a+s.fact,0),p=S.reduce((a,s)=>a+s.plan,0),b=S.reduce((a,s)=>a+s.br,0);const used=S.reduce((a,s)=>a+s.fact*TY(s.t).w*(1+WASTE),0);
 return `<div class="hd"><div><h2>Производство</h2><p>План и факт по станкам и сменам. Операторы сами вносят выпуск и брак с телефона — Дмитрию не нужно собирать цифры. Сырьё списывается автоматически: ящики × вес + 3% отхода.</p></div><div class="btns"><div class="seg">${['03.11','04.11'].map(d=>`<a class="${pDay===d?'on':''}" onclick="pDay='${d}';render()">${d==='04.11'?'Сегодня':'Вчера'}</a>`).join('')}</div><button class="bt" onclick="xlsProd()">Excel</button><button class="bt p" onclick="planM()">+ Задание на смену</button></div></div>
 <div class="tape t4"><div><small>Выпуск</small><b>${fmt(f)} шт</b><span>план ${fmt(p)} · ${pct(f,p)}%</span></div><div><small>Брак</small><b>${fmt(b)} шт</b><span>${(b/(f||1)*100).toFixed(1).replace('.',',')}% · идёт в дробилку</span></div><div><small>Сырья ушло</small><b>${kg(used)}</b><span>по весу изделий</span></div><div><small>Себестоимость</small><b>${tg(used*315+S.filter(s=>s.st!=='stop').length*18000)}</b><span>сырьё + смены</span></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Станок</th><th>Смена</th><th>Оператор</th><th>Изделие</th><th class="r">План</th><th class="r">Факт</th><th style="width:16%"></th><th class="r">Брак</th><th class="r">Сырьё</th><th>Статус</th></tr></thead><tbody>
 ${S.map(s=>`<tr><td class="mono">${s.m}</td><td>${s.sh}</td><td>${s.op==='—'?'<span class="bad">нет оператора</span>':esc(SF(s.op).n)}</td><td>${s.st==='stop'?'—':esc(TY(s.t).id+' '+TY(s.t).n)}</td><td class="r">${fmt(s.plan)}</td><td class="r"><b>${fmt(s.fact)}</b></td><td>${bar(pct(s.fact,s.plan||1),pct(s.fact,s.plan||1)>=90?'g':'w')}</td><td class="r">${s.br}</td><td class="r">${kg(s.fact*TY(s.t).w*(1+WASTE))}</td><td>${tag(s.st==='go'?'идёт':s.st==='done'?'закрыта':'стоит',s.st==='go'?'i':s.st==='done'?'g':'r')}</td></tr>`).join('')}</tbody></table></div>
 ${said('«Отчёт, сколько ящиков сделали мои операторы, — можно сделать, чтобы они сами куда-то вносили, а не я?»','Да: у каждого оператора свой логин, он открывает смену на телефоне и вносит выпуск и брак. Посмотрите «Смена оператора».')}`};
function planM(){openM('Задание на смену','Мастер ставит план — оператор видит его на телефоне',`<div class="form"><label>Станок<select>${MACH.map(m=>`<option>${m}</option>`).join('')}</select></label><label>Смена<select><option>день 08:00–20:00</option><option>ночь 20:00–08:00</option></select></label><label>Изделие<select>${TYPES.map(t=>`<option>${t.id} · ${esc(t.n)}</option>`).join('')}</select></label><label>Оператор<select>${STAFF.filter(s=>s.pos.startsWith('Оператор')).map(s=>`<option>${esc(s.n)}</option>`).join('')}</select></label><label>План, шт<input value="1200"></label><label>Под заказ<select><option>З-516 · ИП Сейтказиев</option><option>на склад</option></select></label></div><div class="btns l"><button class="bt p" onclick="SHIFTS.find(s=>s.m==='ТПА-4'&&s.d==='04.11').op='AB';SHIFTS.find(s=>s.m==='ТПА-4'&&s.d==='04.11').plan=1200;SHIFTS.find(s=>s.m==='ТПА-4'&&s.d==='04.11').st='go';closeM();render();toast('Задание отправлено оператору. ТПА-4 в работе.')">Поставить</button></div>`)}

/* ===== Смена оператора (телефон) ===== */
let shOut=0,shBr=0;
SC.shift=()=>{const s=SHIFTS.find(x=>x.m==='ТПА-2'&&x.d==='04.11');
 return `<div class="hd"><div><h2>Смена оператора</h2><p>Так видит оператор на своём телефоне. Логин и пароль — свои у каждого. Вносит выпуск каждые 2 часа или в конце смены, брак — отдельно. Если оператор уволился — владелец отключает его кнопкой и добавляет нового.</p></div></div>
 <div class="phw"><div class="phone3"><div class="phs">
  <div class="phtop"><b>Ерке К.</b><span>${s.m} · дневная смена</span></div>
  <div class="phbig"><small>Сделано</small><b>${fmt(s.fact)}</b><span>из ${fmt(s.plan)} · ${esc(TY(s.t).n)}</span>${bar(pct(s.fact,s.plan),'g')}</div>
  <label>Добавить выпуск, шт<div class="stepr"><button onclick="shOut=Math.max(0,shOut-100);render()">−</button><input value="${shOut}" onchange="shOut=+this.value||0"><button onclick="shOut+=100;render()">+</button></div></label>
  <label>Брак, шт<div class="stepr"><button onclick="shBr=Math.max(0,shBr-1);render()">−</button><input value="${shBr}" onchange="shBr=+this.value||0"><button onclick="shBr+=1;render()">+</button></div></label>
  <div class="chipr">${['Облой','Недолив','Трещина','Цвет'].map(x=>`<a onclick="this.classList.toggle('on')">${x}</a>`).join('')}</div>
  <button class="bt p full" onclick="shSave()">Внести</button>
  <button class="bt full" onclick="toast('Простой отмечен: «нет сырья». Мастер и владелец получили уведомление.')">Станок стоит</button>
  <div class="phlog">${[['10:00','+1 100'],['08:00','смена открыта']].map(x=>`<div><time>${x[0]}</time>${x[1]}</div>`).join('')}</div>
 </div></div>
 <div class="pan"><h3>Что происходит после «Внести»</h3><div class="kv"><span>Склад готовых ящиков</span><b>+ выпуск</b></div><div class="kv"><span>Сырьё</span><b>− выпуск × ${TY(s.t).w} кг + 3%</b></div><div class="kv"><span>Брак</span><b>в журнал, в дробилку</b></div><div class="kv"><span>Пульт владельца и мастера</span><b>сразу</b></div><div class="kv"><span>Зарплата оператора</span><b>сдельно, по факту</b></div></div></div>`};
function shSave(){if(!shOut&&!shBr){toast('Укажите выпуск или брак.');return}const s=SHIFTS.find(x=>x.m==='ТПА-2'&&x.d==='04.11');s.fact+=shOut;s.br+=shBr;STOCK[s.t]+=shOut;RAW[0].q-=Math.round(shOut*TY(s.t).w*(1+WASTE));toast(`Внесено: +${fmt(shOut)} шт, брак ${shBr}. Склад и сырьё обновились.`);shOut=0;shBr=0;render()}

/* ===== Сырьё ===== */
SC.raw=()=>`<div class="hd"><div><h2>Сырьё</h2><p>Купили гранулу — кладовщик вносит приход в кг. Расход считается сам: каждый ящик имеет свой вес. Остаток сырья = приход − (ящики × вес + 3% отхода). Видно, на сколько дней хватит.</p></div><div class="btns"><button class="bt p" onclick="rawIn()">+ Приход сырья</button></div></div>
 <div class="rawg">${RAW.map(r=>{const days=Math.round(r.q/(r.id==='R3'?68:r.id==='R2'?700:1900));return `<div class="pan"><code>${r.id}</code><h3>${esc(r.n)}</h3><b class="big">${kg(r.q)}</b>${bar(pct(r.q,r.min*3),r.q<r.min*1.5?'w':'g')}<div class="kv"><span>Хватит</span><b class="${days<8?'bad':''}">~${days} дн.</b></div><div class="kv"><span>Минимум</span><b>${kg(r.min)}</b></div><div class="kv"><span>Цена</span><b>${tg(r.price)}/кг</b></div><div class="kv"><span>Стоимость остатка</span><b>${tg(r.q*r.price)}</b></div></div>`}).join('')}</div>
 <div class="g2"><div class="pan"><h3>Расход за ноябрь по видам</h3><table class="t sm"><thead><tr><th>Вид</th><th class="r">Сделано</th><th class="r">Вес, кг</th><th class="r">Сырьё + отход</th></tr></thead><tbody>${TYPES.map((t,i)=>{const q=[31200,9800,7400,38600,9400][i];return `<tr><td>${t.id}</td><td class="r">${fmt(q)}</td><td class="r">${String(t.w).replace('.',',')}</td><td class="r">${kg(q*t.w*(1+WASTE))}</td></tr>`}).join('')}</tbody></table></div>
 <div class="pan"><h3>Приходы</h3>${RAWIN.map(x=>`<div class="kv"><span><code>${x[0]}</code> ${esc(x[1])} · ${x[2]}</span><b>${kg(x[3])}</b></div>`).join('')}<p class="mini">Сверка: по весу сырья и по выпуску — расхождение больше 3% подсвечивается красным (утечки, неучтённый брак).</p></div></div>`;
function rawIn(){openM('Приход сырья','',`<div class="form"><label>Сырьё<select>${RAW.map(r=>`<option value="${r.id}">${esc(r.n)}</option>`).join('')}</select></label><label>Поставщик<input value="ТОО «ПолимерВтор»"></label><label>Вес, кг<input id="rq" value="20000"></label><label>Цена за кг<input value="305"></label></div><div class="btns l"><button class="bt p" onclick="RAW[0].q+=+document.getElementById('rq').value||0;RAWIN.unshift(['04.11','ТОО «ПолимерВтор»','ПНД вторичный',+document.getElementById('rq').value,'Нуржан']);closeM();render();toast('Приход проведён — остаток сырья обновился.')">Провести</button></div>`)}

/* ===== Виды ящиков ===== */
SC.types=()=>`<div class="hd"><div><h2>Виды ящиков</h2><p>Сейчас 5 видов. Появился новый — нажмите «+», укажите вес и цену: он сразу появится в калькуляторе, на складе, в плане цеха и в отчётах. Программиста звать не нужно.</p></div><div class="btns"><button class="bt p" onclick="addType()">+ Новый вид</button></div></div>
 <div class="typeg">${TYPES.map(t=>`<div class="tcard">${crateSVG(t.id[0]==='К')}<code>${t.id}</code><b>${esc(t.n)}</b><div class="kv"><span>Вес</span><b>${String(t.w).replace('.',',')} кг</b></div><div class="kv"><span>Цена</span><b>${tg(t.price)}</b></div><div class="kv"><span>Себестоимость</span><b>${tg(t.cost)}</b></div><div class="kv"><span>Цикл ТПА</span><b>${t.cyc} с · ${fmt(Math.floor(39600/t.cyc))}/смена</b></div><div class="kv"><span>Мин. на складе</span><b>${fmt(t.min)}</b></div></div>`).join('')}</div>`;
const crateSVG=k=>k?`<svg viewBox="0 0 80 50" class="crs"><path d="M14 14h52l-6 30H20z" fill="#24272b"/><path d="M22 20h36M24 28h32M26 36h28" stroke="#4b5058" stroke-width="3"/><circle cx="30" cy="12" r="6" fill="#c8323f"/><circle cx="42" cy="10" r="6" fill="#c8323f"/><circle cx="53" cy="12" r="6" fill="#c8323f"/></svg>`:`<svg viewBox="0 0 80 50" class="crs"><rect x="8" y="12" width="64" height="32" rx="2" fill="#24272b"/><path d="M14 18h12v8H14zM30 18h12v8H30zM46 18h12v8H46zM62 18h4v8h-4zM14 30h52v8H14z" fill="#3a3e45"/><rect x="32" y="8" width="16" height="6" rx="2" fill="#24272b"/></svg>`;
function addType(){openM('Новый вид ящика','',`<div class="form"><label>Артикул<input id="tid" value="Я-40"></label><label>Название<input id="tn" value="Ящик для черешни 400×300×100"></label><label>Вес, кг<input id="tw" value="0.38"></label><label>Цена, ₸<input id="tp" value="340"></label><label>Цикл ТПА, сек<input value="34"></label><label>Мин. остаток<input value="2000"></label></div><div class="btns l"><button class="bt p" onclick="const id=document.getElementById('tid').value;TYPES.push({id,n:document.getElementById('tn').value,w:+document.getElementById('tw').value,price:+document.getElementById('tp').value,cost:210,col:'чёрный',min:2000,cyc:34});STOCK[id]=0;RES[id]=0;closeM();render();toast('Новый вид добавлен — уже есть в калькуляторе, на складе и в плане цеха.')">Добавить</button></div>`)}

/* ===== Склад ===== */
SC.stock=()=>`<div class="hd"><div><h2>Склад готовых ящиков</h2><p>Отдельно по каждому виду. Остаток растёт от выпуска смен и уменьшается от отгрузок, боя и передачи посредникам.</p></div><div class="btns"><button class="bt" onclick="go('inv')">Инвентаризация</button><button class="bt p" onclick="xlsStock()">Excel</button></div></div>
 <div class="typeg">${TYPES.map(t=>`<div class="tcard st">${crateSVG(t.id[0]==='К')}<code>${t.id}</code><b>${esc(t.n)}</b><div class="bign">${fmt(STOCK[t.id])}</div><div class="kv"><span>Резерв под заказы</span><b>${fmt(RES[t.id]||0)}</b></div><div class="kv"><span>Свободно</span><b class="${free(t.id)<t.min?'bad':'ok'}">${fmt(free(t.id))}</b></div><div class="kv"><span>У посредников</span><b>${fmt(DEALERS.reduce((a,d)=>{const s=d.ship.filter(x=>x[1]===t.id).reduce((b,x)=>b+x[2],0),so=(d.sold.find(x=>x[0]===t.id)||[0,0])[1];return a+s-so},0))}</b></div><div class="kv"><span>В деньгах</span><b>${tg(STOCK[t.id]*t.cost)}</b></div></div>`).join('')}</div>
 <div class="pan"><h3>Движение за сегодня</h3>${[['10:00','Выпуск','ТПА-2 · Ерке','+1 100 К-10'],['09:20','Отгрузка','З-509 · Талгар Агро','−2 000 Я-62'],['09:20','Бой при погрузке','Виктор','−12 Я-62'],['08:00','Передано посреднику','Бахыт','−600 Я-62']].map(m=>`<div class="mv"><time>${m[0]}</time><b>${m[1]}</b><span>${m[2]}</span><em>${m[3]}</em></div>`).join('')}</div>`;

/* ===== Отгрузки и бой ===== */
SC.ship=()=>`<div class="hd"><div><h2>Отгрузки и бой</h2><p>Отгрузка списывает ящики со склада. Если при погрузке что-то сломалось — кладовщик вносит бой одной строкой, и этих ящиков больше нет на складе.</p></div><div class="btns"><button class="bt w" onclick="breakM()">Внести бой</button><button class="bt p" onclick="shipM()">+ Отгрузка</button></div></div>
 <div class="g21"><div class="pan"><h3>Отгрузки</h3><div class="tw"><table class="t"><thead><tr><th>Заказ</th><th>Клиент</th><th>Что</th><th>Статус</th></tr></thead><tbody>${ORDERS.filter(o=>['ready','ship','paid'].includes(o.stg)).map(o=>`<tr onclick="openOrder('${o.id}')"><td class="mono">${o.id}</td><td>${esc(CL(o.cl).n)}</td><td>${o.items.map(([t,q])=>fmt(q)+' × '+t).join(', ')}</td><td>${o.stg==='ready'?`<button class="bt sm p" onclick="event.stopPropagation();doShip('${o.id}')">Отгрузить</button>`:tag(STN(o.stg),'g')}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Журнал боя</h3>${BREAK.map(b=>`<div class="kv"><span><code>${b[0]}</code> ${b[1]} · ${esc(b[4])}</span><b class="bad">−${b[3]} ${b[2]}</b></div>`).join('')}<div class="kv"><span>За октябрь</span><b>${tg(BREAK.reduce((a,b)=>a+b[3]*TY(b[2]).cost,0))}</b></div></div></div>`;
function doShip(id){const o=OR(id);o.items.forEach(([t,q])=>{STOCK[t]-=q;RES[t]=Math.max(0,(RES[t]||0)-q)});o.stg='ship';render();toast(`${id} отгружен. Склад списан, клиенту — накладная в WhatsApp. Если что-то сломалось при погрузке — «Внести бой».`)}
function breakM(){openM('Бой при погрузке','Ящики списываются со склада',`<div class="form"><label>Вид<select id="bt">${TYPES.map(t=>`<option value="${t.id}">${t.id} · ${esc(t.n)}</option>`).join('')}</select></label><label>Сколько, шт<input id="bq" value="15"></label><label>Отгрузка<select><option>З-514 · Талгар Агро</option><option>склад, без отгрузки</option></select></label><label>Кто<input value="Виктор Пак"></label><label class="cbx"><input type="checkbox" checked> Бой — в дробилку, сырьё вернётся в работу</label></div><div class="btns l"><button class="bt w" onclick="const t=document.getElementById('bt').value,q=+document.getElementById('bq').value;STOCK[t]-=q;BREAK.unshift(['04.11','З-514',t,q,'Погрузка, Виктор']);closeM();render();toast('Списано '+q+' шт '+t+'. На складе их больше нет.')">Списать</button></div>`)}
function shipM(){openM('Отгрузка','',`<div class="form"><label>Заказ<select><option>З-514 · Талгар Агро</option></select></label><label>Машина<input value="ГАЗель 777 ABK 02"></label></div><div class="btns l"><button class="bt p" onclick="closeM();doShip('З-514')">Отгрузить</button></div>`)}

/* ===== Инвентаризация ===== */
let INV={st:'count',rows:null};
SC.inv=()=>{if(!INV.rows)INV.rows=TYPES.map(t=>({t:t.id,book:STOCK[t.id],fact:null}));const done=INV.rows.every(r=>r.fact!==null);
 return `<div class="hd"><div><h2>Инвентаризация склада</h2><p>Кладовщик пересчитывает паллеты по видам, система сравнивает с учётом и показывает разницу. После утверждения остаток становится фактическим, акт — в Excel.</p></div><div class="btns"><button class="bt" onclick="xls('Акт_инвентаризации',['Вид','Учёт','Факт','Разница'],INV.rows.map(r=>[r.t,r.book,r.fact===null?r.book:r.fact,(r.fact===null?r.book:r.fact)-r.book]))">Акт в Excel</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Вид</th><th class="r">Паллет × шт</th><th class="r">Учёт</th><th class="r">Факт</th><th class="r">Разница</th><th class="r">Сумма</th></tr></thead><tbody>${INV.rows.map((r,i)=>{const d=r.fact===null?null:r.fact-r.book;return `<tr><td><b>${r.t}</b> ${esc(TY(r.t).n)}</td><td class="r mini">по ${r.t[0]==='К'?'2 000':'200'} шт</td><td class="r">${fmt(r.book)}</td><td class="r"><input class="qin" type="number" value="${r.fact===null?'':r.fact}" onchange="INV.rows[${i}].fact=+this.value;render()"></td><td class="r ${d<0?'bad':''}">${d===null?'—':(d>0?'+':'')+fmt(d)}</td><td class="r">${d===null?'':tg(d*TY(r.t).cost)}</td></tr>`}).join('')}</tbody></table></div>
 <div class="btns l"><button class="bt" onclick="INV.rows.forEach((r,i)=>{if(r.fact===null)r.fact=r.book-[40,0,12,600,0][i]});render()">Посчитать (демо)</button><button class="bt p" ${done?'':'disabled'} onclick="INV.rows.forEach(r=>STOCK[r.t]=r.fact);INV.rows=null;render();toast('Акт проведён, остатки стали фактическими.')">Утвердить акт</button></div>`};

/* ===== Посредники: консигнация ===== */
SC.dealers=()=>`<div class="hd"><div><h2>Посредники · консигнация</h2><p>Посредникам отгружаете без оплаты, они продают и платят потом. По каждому видно: сколько отгружено, сколько он уже продал, сколько оплатил — и сколько должен. Лимит: больше лимита не отгрузить без вашего разрешения.</p></div><div class="btns"><button class="bt" onclick="xlsDealers()">Excel</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Посредник</th><th class="r">Отгружено</th><th class="r">Продал</th><th class="r">Оплатил</th><th class="r">Должен</th><th class="r">Ещё у него</th><th style="width:15%">Лимит</th></tr></thead><tbody>
 ${DEALERS.map(d=>`<tr onclick="openDealer('${d.id}')"><td><b>${esc(d.n)}</b><span class="sub">${d.ph}</span></td><td class="r">${tg(dShip(d))}</td><td class="r">${tg(dSold(d))}</td><td class="r">${tg(dPaid(d))}</td><td class="r"><b class="${dDebt(d)>0?'bad':''}">${tg(dDebt(d))}</b></td><td class="r">${tg(dLeft(d))}</td><td>${bar(pct(dDebt(d)+dLeft(d),d.lim),dDebt(d)+dLeft(d)>d.lim*.8?'r':'g')}<span class="sub">${pct(dDebt(d)+dLeft(d),d.lim)}% из ${tg(d.lim)}</span></td></tr>`).join('')}
 <tr class="total"><td>Итого</td><td class="r">${tg(DEALERS.reduce((a,d)=>a+dShip(d),0))}</td><td class="r">${tg(DEALERS.reduce((a,d)=>a+dSold(d),0))}</td><td class="r">${tg(DEALERS.reduce((a,d)=>a+dPaid(d),0))}</td><td class="r">${tg(DEALERS.reduce((a,d)=>a+dDebt(d),0))}</td><td class="r">${tg(DEALERS.reduce((a,d)=>a+dLeft(d),0))}</td><td></td></tr></tbody></table></div>
 ${said('«Есть посредники — я им отгружаю, а деньги они платят потом. Это можно учитывать?»','Да: карточка на каждого, отгрузки, продажи по его отчёту, оплаты и долг. Напоминание о долге — в WhatsApp.')}`;
function openDealer(id){curD=id;const d=DLR(id);openM(esc(d.n),d.ph+' · лимит '+tg(d.lim),`<div class="tape t4"><div><small>Отгружено</small><b>${tg(dShip(d))}</b></div><div><small>Продал</small><b>${tg(dSold(d))}</b></div><div><small>Оплатил</small><b>${tg(dPaid(d))}</b></div><div><small>Должен</small><b class="bad">${tg(dDebt(d))}</b></div></div>
 <div class="pan"><h3>Отгрузки на реализацию</h3><table class="t sm"><thead><tr><th>Дата</th><th>Вид</th><th class="r">Шт</th><th class="r">Цена</th><th class="r">Продано</th><th class="r">Осталось</th></tr></thead><tbody>${d.ship.map(s=>{const so=(d.sold.find(x=>x[0]===s[1])||[0,0])[1];return `<tr><td class="mono">${s[0]}</td><td>${s[1]}</td><td class="r">${fmt(s[2])}</td><td class="r">${tg(s[3])}</td><td class="r">${fmt(so)}</td><td class="r">${fmt(s[2]-so)}</td></tr>`}).join('')}</tbody></table></div>
 <div class="pan"><h3>Оплаты</h3>${d.pays.map(p=>`<div class="kv"><span>${p[0]}</span><b>${tg(p[1])}</b></div>`).join('')}</div>
 <div class="btns l"><button class="bt p" onclick="DLR('${id}').pays.push(['04.11',200000]);openDealer('${id}');toast('Оплата 200 000 ₸ принята, долг уменьшился.')">+ Оплата</button><button class="bt" onclick="toast('Посреднику ушло напоминание в WhatsApp: долг ${tg(dDebt(d))}.')">Напомнить о долге</button><button class="bt" onclick="toast('Отгрузка на реализацию создана. Ящики списаны со склада и числятся у посредника.')">+ Отгрузить на реализацию</button></div>`)}

/* ===== Кабинет посредника ===== */
SC.cabinet=()=>{const d=DLR('P1');return `<div class="hd"><div><h2>Кабинет посредника</h2><p>Посредник заходит по своему логину с телефона: видит, что получил, отмечает, сколько продал, и видит свой долг. Вам не нужно обзванивать — отчёт приходит сам.</p></div></div>
 <div class="phw"><div class="phone3"><div class="phs"><div class="phtop"><b>Бахыт</b><span>рынок «Алтын Орда»</span></div>
 <div class="phbig"><small>Ваш долг</small><b class="bad">${tg(dDebt(d))}</b><span>ещё на реализации: ${tg(dLeft(d))}</span></div>
 ${d.ship.map((s,i)=>{const so=(d.sold.find(x=>x[0]===s[1])||[0,0])[1];return `<div class="kv"><span>${s[1]} · получено ${fmt(s[2])}</span><b>продано ${fmt(so)}</b></div>`}).join('')}
 <label>Отметить продажу<div class="stepr"><select class="sel sm">${d.ship.map(s=>`<option>${s[1]}</option>`).join('')}</select><input value="100"></div></label>
 <button class="bt p full" onclick="DLR('P1').sold[0][1]+=100;render();toast('Продажа отмечена — Дмитрий видит её у себя.')">Сохранить</button>
 <button class="bt full" onclick="toast('Заявка на 2 000 Я-60 отправлена Асель.')">Заказать ещё</button></div></div>
 <div class="pan"><h3>Что видит посредник</h3><p>Только своё: свои отгрузки, свои продажи, свой долг. Цены других клиентов и остатки склада ему не видны.</p></div></div>`};

/* ===== Сотрудники ===== */
SC.staff=()=>`<div class="hd"><div><h2>Сотрудники и доступы</h2><p>Новый оператор — кнопка «+»: имя, телефон, роль. Логин и пароль приходят ему в WhatsApp. Уволили — «Отключить»: доступ закрыт сразу, история его смен сохраняется.</p></div><div class="btns"><button class="bt p" onclick="addEmp()">+ Сотрудник</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Должность</th><th>Телефон</th><th>Логин</th><th>Статус</th><th></th></tr></thead><tbody>${STAFF.map(s=>`<tr class="${s.st==='off'?'off':''}"><td><b>${esc(s.n)}</b></td><td>${esc(s.pos)}</td><td class="mono">${s.ph}</td><td class="mono">${s.login}</td><td>${s.st==='on'?tag('работает','g'):tag('отключён','r')}</td><td class="r">${s.st==='on'&&s.id!=='DV'?`<button class="bt sm" onclick="offEmp('${s.id}')">Отключить</button>`:''}</td></tr>`).join('')}</tbody></table></div>`;
function addEmp(){openM('Новый сотрудник','Логин и пароль придут ему в WhatsApp',`<div class="form"><label>Имя<input id="en" value="Айдос Сериков"></label><label>Телефон<input id="ep" value="+7 701 555 44 33"></label><label>Роль<select id="er"><option>Оператор ТПА</option><option>Кладовщик</option><option>Менеджер по продажам</option><option>Мастер цеха</option></select></label><label>Станок / смена<select><option>ТПА-4 · день</option><option>ТПА-1 · ночь</option></select></label></div><div class="btns l"><button class="bt p" onclick="const n=document.getElementById('en').value;STAFF.push({id:'N'+STAFF.length,n,pos:document.getElementById('er').value,ph:document.getElementById('ep').value,st:'on',login:'aidos'});closeM();render();toast(esc(n)+' добавлен. Логин aidos и пароль ушли в WhatsApp.')">Добавить</button></div>`)}
function offEmp(id){SF(id).st='off';render();toast(esc(SF(id).n)+' отключён: войти больше не сможет, его смены и отчёты сохранены.')}

/* ===== Excel ===== */
function xls(name,head,rows,title){const h=`<html><head><meta charset="utf-8"></head><body>${title?`<h3>${esc(title)}</h3>`:''}<table border="1"><tr>${head.map(x=>`<th style="background:#24272b;color:#fff">${esc(x)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></body></html>`;
 try{const b=new Blob(['﻿'+h],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}
 toast(`Файл <b>${esc(name)}.xls</b> скачан — откройте в Excel.`)}
const xlsStock=()=>xls('Склад_'+TODAY,['Вид','Название','На складе','Резерв','Свободно','Себестоимость','Сумма'],TYPES.map(t=>[t.id,t.n,STOCK[t.id],RES[t.id]||0,free(t.id),t.cost,STOCK[t.id]*t.cost]));
const xlsOrders=()=>xls('Заказы',['Заказ','Клиент','Состав','Этап','Сумма','Оплачено'],ORDERS.map(o=>[o.id,CL(o.cl).n,o.items.map(([t,q])=>q+' × '+t).join(', '),STN(o.stg),Math.round(oSum(o)),o.paid]));
const xlsProd=()=>xls('Производство_'+pDay,['Дата','Смена','Станок','Оператор','Изделие','План','Факт','Брак','Сырьё, кг'],SHIFTS.map(s=>[s.d,s.sh,s.m,SF(s.op).n,s.t,s.plan,s.fact,s.br,Math.round(s.fact*TY(s.t).w*(1+WASTE))]));
const xlsDealers=()=>xls('Посредники',['Посредник','Отгружено','Продал','Оплатил','Должен','Ещё у него'],DEALERS.map(d=>[d.n,dShip(d),dSold(d),dPaid(d),dDebt(d),dLeft(d)]));
const xlsDash=()=>xls('Сводка_'+TODAY,['Показатель','Значение'],[['Сделано за ноябрь, шт',96400],['Сырьё, кг',RAW[0].q+RAW[1].q],['Долг посредников',DEALERS.reduce((a,d)=>a+dDebt(d),0)]]);
const REPS=[['Склад готовых ящиков','по видам: остаток, резерв, свободно, в деньгах',()=>xlsStock()],['Производство по сменам','станок, оператор, план, факт, брак, сырьё',()=>xlsProd()],['Выработка операторов за месяц','для сдельной зарплаты',()=>xls('Выработка',['Оператор','Смен','Сделано','Брак'],[['Ерке Касымова',22,98400,1120],['Арман Бейсенов',21,27300,390],['Марат Жумабаев',20,18100,240]])],['Сырьё: приход, расход, остаток','сверка по весу',()=>xls('Сырьё',['Сырьё','Остаток, кг','Цена','Сумма'],RAW.map(r=>[r.n,r.q,r.price,r.q*r.price]))],['Заказы и оплаты','воронка, суммы, долги клиентов',()=>xlsOrders()],['Посредники и долги','консигнация',()=>xlsDealers()],['Бой и брак','потери в штуках и деньгах',()=>xls('Бой',['Дата','Заказ','Вид','Шт','Кто'],BREAK)]];
SC.reports=()=>`<div class="hd"><div><h2>Отчёты в Excel</h2><p>Всё, что сейчас ведётся в Excel вручную, — одной кнопкой. Файлы реально скачиваются.</p></div></div><div class="reps">${REPS.map((r,i)=>`<div class="rep"><code>XLS</code><div><b>${r[0]}</b><span>${r[1]}</span></div><button class="bt" onclick="REPS[${i}][2]()">Скачать</button></div>`).join('')}</div>`;

/* ===== Стоимость ===== */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Пишем с нуля под ваше производство. Сервер, код и все ключи передаём вам — один раз платите, дальше платить никому не надо.</p></div></div>
 <div class="g21"><div class="pan"><h3>Как работаем</h3>${[['~10 дней','Поднимаем базу: заказы, цех, сырьё, склад, посредники; заносим ваш Excel'],['2–3 недели','Полировка: 2–3 созвона в неделю по часу, вы кликаете и говорите, что поправить'],['4–6 недель','Боевая версия, обучение вас и сотрудников, передача сервера и кода']].map((x,i)=>`<div class="stp"><b>${i+1}</b><div><em>${x[0]}</em><p>${x[1]}</p></div></div>`).join('')}</div>
 <div><div class="pan price"><h3>Стоимость</h3><div class="kv tot"><span>Разработка и внедрение</span><b>${tg(2000000)}</b></div><div class="kv"><span>Старт · 30%</span><b>${tg(600000)}</b></div><div class="kv"><span>База работает · 30%</span><b>${tg(600000)}</b></div><div class="kv"><span>Сдача · 40%</span><b>${tg(800000)}</b></div><div class="kv"><span>Доработки после сдачи</span><b>20 $ в час</b></div><div class="kv"><span>Абонентская плата</span><b>нет</b></div></div></div></div>`;

/* ===== Каркас ===== */
function searchDemo(v){if(!v)return;const q=v.toLowerCase();const c=CLIENTS.find(x=>x.n.toLowerCase().includes(q));if(c){const o=ORDERS.find(x=>x.cl===c.id);if(o&&allowed('order')){openOrder(o.id);return}}const d=DEALERS.find(x=>x.n.toLowerCase().includes(q));if(d&&allowed('dealers')){go('dealers');openDealer(d.id);return}toast('Не найдено. Попробуйте: «Талгар», «Бахыт».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Владелец';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<div class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')" title="${esc(s.n)}"><i>${s.ic}</i><span>${esc(s.n)}</span></div>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=`<h4>${esc(S.n)}</h4>`+S.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Карасу Тара';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
let theme='light';function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[['dash','1 · Пульт: цех сейчас, склад по 5 видам, сырьё, заказы, долги посредников.'],['funnel','2 · Воронка заказов: от «Новый» до «Оплачен».'],['order','3 · Заказ: калькулятор — цена со скидкой за объём, вес, сырьё, счёт в WhatsApp.'],['prod','4 · Производство: план и факт по станкам и сменам.'],['shift','5 · Оператор вносит выпуск и брак с телефона — не вы.'],['raw','6 · Сырьё: остаток = приход − ящики × вес. На сколько дней хватит.'],['types','7 · Новый вид ящика — кнопкой «+».'],['stock','8 · Склад готовых ящиков по видам.'],['ship','9 · Отгрузки и бой при погрузке — списывается сразу.'],['dealers','10 · Посредники: отгружено, продано, оплачено, долг.'],['staff','11 · Новый оператор — кнопкой «+», уволенный — «Отключить».'],['reports','12 · Excel одной кнопкой.'],['launch','13 · 2 000 000 ₸, 4–6 недель, 30/30/40.']];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Владелец');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
function stopTour(){tRun=false;ti=-1}
function act(){}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
