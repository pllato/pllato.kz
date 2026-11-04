/* ЖАЙЫК ДИСТРИБУЦИЯ — полевые продажи и дистрибуция, Уральск (Александр). Демо на вымышленных данных. */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const TODAY='04.11.2026',NOW='14:20',DOW=3;/* среда — маршрут 3 */
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const bar=(w,c)=>`<div class="bar"><i class="${c||''}" style="--w:${Math.max(2,Math.min(100,w))}%"></i></div>`;
const said=(q,a)=>`<div class="said"><b>Из встречи</b><i>${q}</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const crumbs=(...a)=>`<div class="crumbl">${a.map((x,i)=>i<a.length-1?`<a onclick="${x[1]}">${esc(x[0])}</a>`:`<b>${esc(x[0])}</b>`).join(' <i>/</i> ')}</div>`;
const SEC=[
 {k:'sum',n:'Сводка',sub:[['dash','Сводка собственника'],['map','Где сейчас торговые']]},
 {k:'field',n:'Поле',sub:[['routes','Маршруты на неделю'],['visit','Визит с телефона'],['refusals','Отказы и проверки'],['photos','Фотоотчёты полок']]},
 {k:'ord',n:'Заказы',sub:[['orders','Заказы'],['deliv','Доставка экспедитора'],['returns','Возвраты и обмен']]},
 {k:'pts',n:'Точки',sub:[['points','1 300 торговых точек']]},
 {k:'wh',n:'Склад',sub:[['stock','Остатки по группам'],['inv','Инвентаризация']]},
 {k:'fin',n:'Деньги',sub:[['debts','Дебиторка'],['pnl','Доходы и расходы · P&L'],['pay','Зарплата']]},
 {k:'team',n:'Команда',sub:[['kpi','KPI торговых'],['tasks','Задачи'],['roles','Роли и группы']]},
 {k:'go',n:'Запуск',sub:[['move1c','Переезд с 1С'],['launch','Стоимость']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'АЛ',n:'Александр',note:'Всё: сводка, поле, заказы, деньги, KPI, P&L',s:ALL.slice()},
 'Супервайзер':{av:'СВ',n:'Ержан · супервайзер',note:'Маршруты, карта, отказы и проверки, фото, KPI торговых',s:['map','routes','visit','refusals','photos','orders','points','kpi','tasks']},
 'Торговый':{av:'ТП',n:'Нурлан · торговый, команда А',note:'С телефона: маршрут дня, визит, фото, заказ, отказ, возврат',s:['visit','points']},
 'Экспедитор':{av:'ЭК',n:'Нурлан · доставка',note:'Доставка вчерашних заказов, оплата, консигнация',s:['deliv','returns']},
 'Кладовщик':{av:'КЛ',n:'Гульнар · склад',note:'Сборка заказов, остатки, возвраты, инвентаризация',s:['orders','stock','inv','returns','tasks']},
 'Бухгалтер':{av:'БХ',n:'Светлана · бухгалтер',note:'Дебиторка, расходы, P&L, зарплата',s:['debts','pnl','pay','tasks']}
};
let role='Собственник',cur='dash';
/* Команды и группы товаров */
const TEAMS={A:{n:'Команда А',g:'Напитки и соки',c:'#1f6b4f'},B:{n:'Команда Б',g:'Снеки и бакалея',c:'#d08a10'}};
const REPS=[
 {id:'R1',n:'Нурлан Ахметов',t:'A',ph:'+7 701 411 20 30',done:23,plan:28,ord:17,sum:1184000,ref:4,late:0,gps:[62,40],st:'на точке'},
 {id:'R2',n:'Дамир Кусаинов',t:'A',ph:'+7 705 300 12 44',done:19,plan:27,ord:12,sum:836000,ref:5,late:1,gps:[30,58],st:'в пути'},
 {id:'R3',n:'Айгуль Серикова',t:'A',ph:'+7 777 520 81 09',done:25,plan:26,ord:21,sum:1402000,ref:2,late:0,gps:[78,70],st:'на точке'},
 {id:'R4',n:'Бауыржан Ли',t:'A',ph:'+7 702 641 33 18',done:11,plan:28,ord:6,sum:390000,ref:3,late:1,gps:[45,22],st:'вне маршрута'},
 {id:'R5',n:'Ерлан Жумагалиев',t:'B',ph:'+7 701 902 55 61',done:21,plan:25,ord:15,sum:968000,ref:4,late:0,gps:[20,32],st:'на точке'},
 {id:'R6',n:'Асель Утегенова',t:'B',ph:'+7 747 118 40 20',done:24,plan:27,ord:19,sum:1120000,ref:3,late:0,gps:[55,78],st:'в пути'},
 {id:'R7',n:'Тимур Исмаилов',t:'B',ph:'+7 708 223 71 05',done:17,plan:26,ord:10,sum:612000,ref:6,late:0,gps:[85,30],st:'на точке'},
 {id:'R8',n:'Мадина Кенжегалиева',t:'B',ph:'+7 776 510 29 47',done:22,plan:26,ord:16,sum:905000,ref:2,late:0,gps:[38,85],st:'на точке'}
];
const RP=id=>REPS.find(r=>r.id===id)||REPS[0];
const fn=id=>RP(id).n.split(' ')[0];
const DAYS=['Пн','Вт','Ср','Чт','Пт'];
/* Точки (выборка из 1 300) */
let POINTS=[
 {id:'T-0412',n:'Магазин «Арман»',addr:'ул. Мухита, 112',rep:'R1',day:3,debt:184000,lim:300000,last:'28.10',fmt:'магазин у дома'},
 {id:'T-0413',n:'Минимаркет «Береке»',addr:'пр. Достык, 41',rep:'R1',day:3,debt:0,lim:250000,last:'28.10',fmt:'минимаркет'},
 {id:'T-0418',n:'Супермаркет «Жайык»',addr:'ул. Ихсанова, 44/1',rep:'R1',day:3,debt:612000,lim:800000,last:'28.10',fmt:'супермаркет'},
 {id:'T-0421',n:'ИП Каримова, павильон',addr:'рынок «Мирлан», ряд 3',rep:'R1',day:3,debt:96000,lim:100000,last:'28.10',fmt:'павильон'},
 {id:'T-0425',n:'Кафе «Самал»',addr:'ул. Есенжанова, 9',rep:'R1',day:3,debt:0,lim:150000,last:'28.10',fmt:'HoReCa'},
 {id:'T-0430',n:'Магазин «Нур»',addr:'мкр. Строитель, 18',rep:'R1',day:3,debt:241000,lim:200000,last:'21.10',fmt:'магазин у дома'},
 {id:'T-0433',n:'Магазин «Алтын»',addr:'ул. Шолохова, 3',rep:'R1',day:3,debt:0,lim:150000,last:'28.10',fmt:'магазин у дома'},
 {id:'T-0810',n:'Супермаркет «Дина»',addr:'ул. Курмангазы, 160',rep:'R5',day:3,debt:420000,lim:600000,last:'28.10',fmt:'супермаркет'},
 {id:'T-0811',n:'АЗС «Helios» магазин',addr:'трасса Самара, 2 км',rep:'R5',day:3,debt:0,lim:300000,last:'28.10',fmt:'АЗС'},
 {id:'T-0905',n:'Магазин «Айгерим»',addr:'пос. Зачаганск, ул. Жангир хана, 7',rep:'R6',day:3,debt:132000,lim:150000,last:'28.10',fmt:'магазин у дома'}
];
const PT=id=>POINTS.find(p=>p.id===id)||POINTS[0];
let curPt='T-0418';
/* Визиты маршрута 3 у Нурлана: st done/ord/ref/now/next */
let ROUTE=[
 {p:'T-0412',st:'ord',t:'09:12',sum:86400,gps:'в 18 м',photo:1},
 {p:'T-0413',st:'ref',t:'09:40',why:'Нет денег, просит зайти в пятницу',gps:'в 9 м',photo:1},
 {p:'T-0418',st:'ord',t:'10:25',sum:312000,gps:'в 24 м',photo:1},
 {p:'T-0421',st:'ref',t:'11:05',why:'Лимит долга — отгрузка заблокирована',gps:'в 31 м',photo:1},
 {p:'T-0425',st:'now',t:'14:12',gps:'в 12 м',photo:0},
 {p:'T-0430',st:'next'},{p:'T-0433',st:'next'}
];
/* Товары */
let SKU=[
 {id:'A-101',t:'A',n:'Вода «Жайык» 1,5 л ×6',price:1680,cost:1150,q:820,min:300,cell:'A1'},
 {id:'A-114',t:'A',n:'Сок «Сад» яблоко 1 л ×12',price:7200,cost:5400,q:146,min:120,cell:'A2'},
 {id:'A-120',t:'A',n:'Газ. напиток «Кола» 1 л ×12',price:6600,cost:4900,q:92,min:150,cell:'A3'},
 {id:'A-131',t:'A',n:'Холодный чай 0,5 л ×24',price:9600,cost:7100,q:210,min:100,cell:'A4'},
 {id:'B-201',t:'B',n:'Чипсы 90 г ×20',price:9800,cost:7300,q:188,min:100,cell:'B1'},
 {id:'B-215',t:'B',n:'Сухарики 40 г ×50',price:7500,cost:5300,q:64,min:80,cell:'B2'},
 {id:'B-230',t:'B',n:'Макароны 400 г ×20',price:6400,cost:4900,q:340,min:120,cell:'B3'},
 {id:'B-244',t:'B',n:'Семечки 200 г ×30',price:8700,cost:6200,q:155,min:90,cell:'B4'}
];
const SK=id=>SKU.find(s=>s.id===id)||SKU[0];
/* Заказы: принят → собран → в доставке → доставлен → оплачен */
const OST=[['new','Принят'],['pick','Собирается'],['ready','Собран'],['road','В доставке'],['done','Доставлен'],['paid','Оплачен']];
const OSN=k=>(OST.find(s=>s[0]===k)||['',''])[1];
let ORDERS=[
 {id:'З-3381',p:'T-0418',rep:'R1',t:'A',items:[['A-101',60],['A-114',12],['A-131',10]],st:'new',d:'04.11',pay:'консигнация'},
 {id:'З-3380',p:'T-0412',rep:'R1',t:'A',items:[['A-101',24],['A-120',6]],st:'new',d:'04.11',pay:'наличные'},
 {id:'З-3377',p:'T-0810',rep:'R5',t:'B',items:[['B-201',10],['B-230',20],['B-244',8]],st:'pick',d:'04.11',pay:'консигнация'},
 {id:'З-3352',p:'T-0905',rep:'R6',t:'B',items:[['B-215',6],['B-244',4]],st:'road',d:'03.11',pay:'наличные'},
 {id:'З-3349',p:'T-0413',rep:'R1',t:'A',items:[['A-101',30]],st:'road',d:'03.11',pay:'Kaspi'},
 {id:'З-3340',p:'T-0811',rep:'R5',t:'B',items:[['B-201',12],['B-244',10]],st:'done',d:'03.11',pay:'консигнация'},
 {id:'З-3321',p:'T-0425',rep:'R1',t:'A',items:[['A-131',6]],st:'paid',d:'02.11',pay:'перевод'}
];
const OR=id=>ORDERS.find(o=>o.id===id)||ORDERS[0];
const oSum=o=>o.items.reduce((a,[s,q])=>a+SK(s).price*q,0);
let REFUS=[
 {d:'04.11 11:05',p:'T-0421',rep:'R1',why:'Лимит долга — отгрузка заблокирована',chk:'—'},
 {d:'04.11 09:40',p:'T-0413',rep:'R1',why:'Нет денег, просит зайти в пятницу',chk:'проверить'},
 {d:'04.11 10:50',p:'T-0811',rep:'R5',why:'Товар ещё есть на полке',chk:'фото подтверждает'},
 {d:'04.11 12:30',p:'T-0905',rep:'R6',why:'Закрыто',chk:'проверить'},
 {d:'03.11 16:10',p:'T-0430',rep:'R1',why:'Взяли у конкурента',chk:'звонок: подтверждено'}
];
let TASKS=[
 {id:'Z-41',t:'Подписать договор с сетью «Дина» на 2027',who:'Собственник',due:'08.11',st:'work'},
 {id:'Z-42',t:'Проверить отказы Дамира за неделю',who:'Супервайзер',due:'05.11',st:'new'},
 {id:'Z-43',t:'Новая линейка соков — карточки и цены',who:'Кладовщик',due:'07.11',st:'new'},
 {id:'Z-44',t:'Сверка дебиторки команды Б',who:'Бухгалтер',due:'05.11',st:'check'},
 {id:'Z-45',t:'Заменить шины на «Газели» № 2',who:'Собственник',due:'10.11',st:'done'}
];

const SC={};
/* ===== Сводка ===== */
SC.dash=()=>{const done=REPS.reduce((a,r)=>a+r.done,0),plan=REPS.reduce((a,r)=>a+r.plan,0),ord=REPS.reduce((a,r)=>a+r.ord,0),sum=REPS.reduce((a,r)=>a+r.sum,0),ref=REPS.reduce((a,r)=>a+r.ref,0);const debt=18640000;
 return `<div class="hd"><div><h2>Сводка · сегодня, ${TODAY}, ${NOW}</h2><p>Кто где, сколько точек пройдено, заказы, отказы, дебиторка и KPI — на одном экране. Данные приходят с телефонов торговых и экспедиторов.</p></div><div class="btns"><button class="bt" onclick="xlsDay()">Excel</button><button class="bt p" onclick="go('map')">Карта</button></div></div>
 <div class="strip"><div><small>Визиты сегодня</small><b>${done} / ${plan}</b>${bar(pct(done,plan),'g')}<span>маршрут среды · 8 торговых</span></div><div><small>Заказы</small><b>${ord}</b><span>${tg(sum)}</span></div><div><small>Отказы</small><b class="${ref>20?'bad':''}">${ref}</b><span>${pct(ref,done)}% визитов · 2 на проверке</span></div><div><small>Дебиторка</small><b>${tg(debt)}</b><span>просрочка 30+: ${tg(2310000)}</span></div><div><small>Октябрь, валовая прибыль</small><b class="ok">${tg(14800000)}</b><span>выручка ${tg(61200000)}</span></div></div>
 <div class="g21"><div>
  <div class="pan"><h3>Торговые сейчас</h3><p>Визиты подтверждаются GPS и фото полки. «Вне маршрута» — сразу видно.</p>
  <div class="tw"><table class="t"><thead><tr><th>Торговый</th><th>Команда</th><th class="r">Визиты</th><th style="width:18%"></th><th class="r">Заказы</th><th class="r">Сумма</th><th class="r">Отказы</th><th>Сейчас</th></tr></thead><tbody>${REPS.map(r=>`<tr onclick="go('kpi')"><td><b>${esc(r.n)}</b></td><td><i class="tm" style="background:${TEAMS[r.t].c}"></i>${TEAMS[r.t].n}</td><td class="r">${r.done}/${r.plan}</td><td>${bar(pct(r.done,r.plan),pct(r.done,r.plan)<60?'r':'g')}</td><td class="r">${r.ord}</td><td class="r">${tg(r.sum)}</td><td class="r ${r.ref>4?'bad':''}">${r.ref}</td><td>${tag(r.st,r.st==='вне маршрута'?'r':r.st==='в пути'?'w':'g')}</td></tr>`).join('')}</tbody></table></div></div>
 </div><div>
  <div class="pan"><h3>Требует внимания</h3><div class="alist">
   <a onclick="go('map')"><i class="dt r"></i><b>Бауыржан вне маршрута 40 минут</b><span>11 из 28 точек · последняя отметка 13:31</span></a>
   <a onclick="go('refusals')"><i class="dt w"></i><b>2 отказа ждут проверки супервайзером</b><span>«Нет денег», «Закрыто» — позвонить или съездить</span></a>
   <a onclick="go('debts')"><i class="dt r"></i><b>Магазин «Нур» превысил лимит долга</b><span>241 000 из 200 000 ₸ · отгрузки заблокированы</span></a>
   <a onclick="go('stock')"><i class="dt w"></i><b>«Кола» 1 л — 92 упаковки, минимум 150</b><span>заказ поставщику</span></a>
   <a onclick="go('deliv')"><i class="dt i"></i><b>Доставка вчерашних заказов: 9 из 14</b><span>2 машины в пути</span></a>
  </div></div>
  <div class="pan"><h3>Команды · ноябрь</h3>${Object.entries(TEAMS).map(([k,t])=>{const rs=REPS.filter(r=>r.t===k);const s=rs.reduce((a,r)=>a+r.sum,0)*3.1;return `<div class="kv"><span><i class="tm" style="background:${t.c}"></i>${t.n} · ${t.g}</span><b>${tg(s)}</b></div>`}).join('')}<p class="mini">Каждая команда видит только свою группу товаров и свои точки.</p></div>
 </div></div>
 ${said('«Нужно отслеживать, что торговые действительно заходят в точку… сейчас это на бумажке и в мобильной 1С.»','Визит = GPS-отметка + фото полки. Без этого визит не засчитывается в KPI.')}`};

/* ===== Карта ===== */
let mapRep='R1';
SC.map=()=>`<div class="hd"><div><h2>Где сейчас торговые</h2><p>Точки на схеме — последние GPS-отметки. Нажмите на торгового — увидите его маршрут дня: пройдено, заказ, отказ, впереди.</p></div><div class="btns"><span class="live"><i></i>обновлено ${NOW}</span></div></div>
 <div class="mapw"><div class="map"><svg viewBox="0 0 100 100" preserveAspectRatio="none" class="mbg2"><path d="M0 48 C20 44 30 60 50 54 S80 40 100 46" stroke="#9cc3d8" stroke-width="5" fill="none"/><path d="M8 0 L12 100 M40 0 L44 100 M70 0 L74 100 M0 20 L100 24 M0 72 L100 76" stroke="#e1ded5" stroke-width="1.2"/><text x="52" y="50" font-size="3" fill="#6f99b1">р. Урал</text></svg>
 ${REPS.map(r=>`<a class="pin ${r.id===mapRep?'on':''} ${r.st==='вне маршрута'?'out':''}" style="left:${r.gps[0]}%;top:${r.gps[1]}%;--c:${TEAMS[r.t].c}" onclick="mapRep='${r.id}';render()"><i></i><span>${esc(r.n.split(' ')[0])}</span></a>`).join('')}</div>
 <div class="pan"><h3>${esc(RP(mapRep).n)}</h3><p>${TEAMS[RP(mapRep).t].n} · маршрут «${DAYS[DOW-1]}» · ${RP(mapRep).done} из ${RP(mapRep).plan} точек</p>
 ${(mapRep==='R1'?ROUTE:ROUTE.slice(0,4)).map((v,i)=>`<div class="rv ${v.st}"><b>${i+1}</b><div><em>${esc(PT(v.p).n)}</em><span>${v.st==='ord'?'заказ '+tg(v.sum)+' · '+v.t+' · GPS '+v.gps:v.st==='ref'?'отказ: '+esc(v.why):v.st==='now'?'на точке с '+v.t:'впереди'}</span></div></div>`).join('')}
 ${RP(mapRep).st==='вне маршрута'?'<div class="alert">Нет отметок 40 минут, вне зоны маршрута. Супервайзеру ушло уведомление.</div>':''}<button class="bt full" onclick="toast('Звоним ${esc(RP(mapRep).ph)}…')">Позвонить</button></div></div>`;

/* ===== Маршруты ===== */
let rtTeam='A';
SC.routes=()=>`<div class="hd"><div><h2>Маршруты на неделю</h2><p>У каждого торгового 5 маршрутов — по одному на рабочий день, каждая точка раз в неделю. Точку можно перетащить в другой день или другому торговому.</p></div><div class="btns"><div class="seg">${Object.entries(TEAMS).map(([k,t])=>`<a class="${rtTeam===k?'on':''}" onclick="rtTeam='${k}';render()">${t.n}</a>`).join('')}</div><button class="bt" onclick="toast('Маршруты выгружены в Excel.')">Excel</button></div></div>
 <div class="tw"><table class="t rt"><thead><tr><th>Торговый</th>${DAYS.map((d,i)=>`<th class="${i===DOW-1?'today':''}">${d}</th>`).join('')}<th class="r">Точек</th></tr></thead><tbody>${REPS.filter(r=>r.t===rtTeam).map(r=>`<tr><td><b>${esc(r.n)}</b></td>${DAYS.map((d,i)=>{const n=[r.plan-2,r.plan+1,r.plan,r.plan-1,r.plan+2][i];return `<td class="${i===DOW-1?'today':''}" onclick="toast('Маршрут ${d} · ${esc(fn(r.id))}: ${n} точек. Порядок обхода можно менять перетаскиванием.')"><b>${n}</b> точек<span class="sub">${i===DOW-1?r.done+' пройдено':['мкр. Строитель','центр','Зачаганск','рынок «Мирлан»','Деркул'][i]}</span></td>`}).join('')}<td class="r">${r.plan*5}</td></tr>`).join('')}</tbody></table></div>
 <p class="mini" style="margin-top:8px">Всего в базе 1 300 точек: по ~160 на торгового в неделю.</p>
 ${said('«5 маршрутов у каждого торгового, 5 рабочих дней, раз в неделю посещение.»','Маршруты подтягиваем из 1С, дальше правите сами.')}`;

/* ===== Визит с телефона ===== */
let vStep='list',vPhoto=false,vCart={};
SC.visit=()=>{const v=ROUTE.find(x=>x.st==='now')||ROUTE[4];const p=PT(v.p);
 const screen=vStep==='list'?`<div class="phtop"><b>Маршрут · среда</b><span>${ROUTE.filter(x=>x.st==='ord'||x.st==='ref').length}/${ROUTE.length}</span></div>${ROUTE.map((x,i)=>`<a class="rv ${x.st}" onclick="${x.st==='now'?"vStep='in';render()":''}"><b>${i+1}</b><div><em>${esc(PT(x.p).n)}</em><span>${esc(PT(x.p).addr)}${PT(x.p).debt?' · долг '+tg(PT(x.p).debt):''}</span></div></a>`).join('')}`
 :vStep==='in'?`<div class="phtop"><b>${esc(p.n)}</b><span>${esc(p.addr)}</span></div><div class="gpsok"><i></i>Вы на точке · GPS 12 м · ${NOW}</div><div class="kv"><span>Долг точки</span><b>${tg(p.debt)}</b></div><div class="kv"><span>Лимит</span><b>${tg(p.lim)}</b></div>
  <div class="photo ${vPhoto?'ok':''}" onclick="vPhoto=true;render()">${vPhoto?'<b>Фото полки ✓</b><small>14:13 · 43.2 м от точки — геометка совпадает</small>':'<b>Сфотографировать полку</b><small>обязательно для засчёта визита</small>'}</div>
  <button class="bt p full" ${vPhoto?'':'disabled'} onclick="vStep='order';render()">Заказ</button><button class="bt full" ${vPhoto?'':'disabled'} onclick="vStep='ref';render()">Отказ</button><button class="bt full" onclick="go('returns')">Возврат / обмен</button>`
 :vStep==='order'?`<div class="phtop"><b>Заказ · ${esc(p.n)}</b><span>команда А — только напитки</span></div>${SKU.filter(s=>s.t==='A').map(s=>`<div class="ci2"><div><b>${esc(s.n)}</b><small>${tg(s.price)} · склад ${s.q}</small></div><div class="stepr"><button onclick="vCart['${s.id}']=Math.max(0,(vCart['${s.id}']||0)-1);render()">−</button><span>${vCart[s.id]||0}</span><button onclick="vCart['${s.id}']=(vCart['${s.id}']||0)+1;render()">+</button></div></div>`).join('')}<div class="kv tot"><span>Итого</span><b>${tg(Object.entries(vCart).reduce((a,[k,q])=>a+SK(k).price*q,0))}</b></div><div class="chipr">${['Наличные','Kaspi','Консигнация'].map((x,i)=>`<a class="${i===2?'on':''}" onclick="this.parentNode.querySelectorAll('a').forEach(a=>a.classList.remove('on'));this.classList.add('on')">${x}</a>`).join('')}</div><button class="bt p full" onclick="vSend()">Отправить заказ</button>`
 :`<div class="phtop"><b>Отказ · ${esc(p.n)}</b><span>причина обязательна</span></div><div class="chipr col">${['Товар ещё есть на полке','Нет денег','Закрыто','Взяли у конкурента','Нет ответственного','Другое'].map((x,i)=>`<a class="${i===0?'on':''}" onclick="this.parentNode.querySelectorAll('a').forEach(a=>a.classList.remove('on'));this.classList.add('on')">${x}</a>`).join('')}</div><textarea class="ta" placeholder="Комментарий"></textarea><button class="bt p full" onclick="vRef()">Сохранить отказ</button>`;
 return `<div class="hd"><div><h2>Визит с телефона</h2><p>Так работает торговый: открывает маршрут в браузере телефона, приходит на точку — GPS подтверждает, фотографирует полку, оформляет заказ или отказ с причиной. Приложение ставить не нужно — работает в любом браузере.</p></div><div class="btns"><button class="bt" onclick="vStep='list';vPhoto=false;vCart={};render()">Сначала</button></div></div>
 <div class="phw"><div class="phone3"><div class="phs">${screen}</div></div>
 <div class="pan"><h3>Что видит система</h3><div class="kv"><span>Визит засчитан</span><b>только GPS ≤ 100 м + фото</b></div><div class="kv"><span>Фото полки</span><b>с геометкой и временем</b></div><div class="kv"><span>Заказ</span><b>сразу на склад в сборку</b></div><div class="kv"><span>Отказ</span><b>причина → журнал проверок</b></div><div class="kv"><span>Долг выше лимита</span><b>заказ только за наличные</b></div><div class="kv"><span>Товары</span><b>только своей группы</b></div>
 ${said('«Даже если заказа нет — отказ с причиной, чтобы в любой момент отправить супервайзера и проверить.»')}</div></div>`};
function vSend(){const items=Object.entries(vCart).filter(x=>x[1]>0);if(!items.length){toast('Добавьте товары.');return}ORDERS.unshift({id:'З-3382',p:'T-0425',rep:'R1',t:'A',items,st:'new',d:'04.11',pay:'консигнация'});const v=ROUTE.find(x=>x.st==='now');v.st='ord';v.sum=items.reduce((a,[k,q])=>a+SK(k).price*q,0);v.gps='в 12 м';vStep='list';vPhoto=false;vCart={};render();toast('Заказ З-3382 ушёл на склад в сборку. Завтра его привезёт экспедитор.')}
function vRef(){const v=ROUTE.find(x=>x.st==='now');v.st='ref';v.why='Товар ещё есть на полке';REFUS.unshift({d:'04.11 14:20',p:v.p,rep:'R1',why:'Товар ещё есть на полке',chk:'фото подтверждает'});vStep='list';vPhoto=false;render();toast('Отказ сохранён с фото полки. Супервайзер видит его в журнале.')}

/* ===== Отказы ===== */
SC.refusals=()=>`<div class="hd"><div><h2>Отказы и проверки</h2><p>Каждый отказ — с причиной, временем, GPS и фото. Супервайзер выборочно проверяет: звонок в точку или выезд. Подозрительные — где у торгового много «закрыто» и «нет денег».</p></div><div class="btns"><button class="bt" onclick="toast('Журнал отказов выгружен в Excel.')">Excel</button></div></div>
 <div class="g21"><div class="tw"><table class="t"><thead><tr><th>Когда</th><th>Точка</th><th>Торговый</th><th>Причина</th><th>Проверка</th><th></th></tr></thead><tbody>${REFUS.map((r,i)=>`<tr><td class="mono">${r.d}</td><td>${esc(PT(r.p).n)}</td><td>${fn(r.rep)}</td><td>${esc(r.why)}</td><td>${tag(r.chk,r.chk==='проверить'?'w':r.chk==='—'?'':'g')}</td><td>${r.chk==='проверить'?`<button class="bt sm" onclick="REFUS[${i}].chk='звонок: подтверждено';render()">Позвонил</button> <button class="bt sm" onclick="REFUS[${i}].chk='выезд назначен';render();toast('Супервайзеру поставлена задача на выезд.')">Выезд</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 <div class="pan"><h3>Причины за неделю</h3>${[['Товар ещё есть',38],['Нет денег',22],['Закрыто',14],['Конкурент',11],['Лимит долга',9],['Другое',6]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>${bar(x[1]/38*100,'b')}`).join('')}<p class="mini">У Дамира 9 «закрыто» за неделю против 2 в среднем — система подсветила для проверки.</p></div></div>`;

/* ===== Фото ===== */
SC.photos=()=>`<div class="hd"><div><h2>Фотоотчёты полок</h2><p>Каждое фото — с геометкой, временем и торговым. Видно выкладку, остатки, конкурентов на полке.</p></div></div>
 <div class="phg">${ROUTE.filter(v=>v.photo).concat([{p:'T-0810'},{p:'T-0811'},{p:'T-0905'}]).map((v,i)=>`<div class="phc"><div class="shelf">${Array.from({length:3},(_,r)=>`<div>${Array.from({length:7},(_,c)=>`<i style="background:${['#1f6b4f','#d08a10','#c23b2f','#3d6fb6','#7a5bb0'][(i+r*2+c)%5]};height:${70+((i*3+c*7+r)%4)*8}%"></i>`).join('')}</div>`).join('')}</div><b>${esc(PT(v.p).n)}</b><span>${['Нурлан','Нурлан','Нурлан','Нурлан','Ерлан','Ерлан','Асель'][i]||'Нурлан'} · ${['09:12','09:40','10:25','11:05','10:02','10:50','12:30'][i]} · GPS ✓</span></div>`).join('')}</div>`;

/* ===== Заказы ===== */
SC.orders=()=>`<div class="hd"><div><h2>Заказы</h2><p>Торговый берёт заказ сегодня — склад собирает — завтра экспедитор везёт. Каждый статус меняется кнопкой; консигнация сразу ложится в дебиторку точки.</p></div><div class="btns"><button class="bt" onclick="toast('Заказы выгружены в Excel.')">Excel</button></div></div>
 <div class="kanban">${OST.map(([k,n])=>{const x=ORDERS.filter(o=>o.st===k);return `<div class="kcol"><div class="kh"><b>${n}</b><span>${x.length}</span></div>${x.map(o=>`<div class="kc" style="border-left-color:${TEAMS[o.t].c}" onclick="openOrd('${o.id}')"><code>${o.id} · ${o.d}</code><b>${esc(PT(o.p).n)}</b><span>${fn(o.rep)} · ${o.pay}</span><em>${tg(oSum(o))}</em>${k!=='paid'?`<button class="bt sm" onclick="event.stopPropagation();nextO('${o.id}')">→ ${OSN(OST[OST.findIndex(s=>s[0]===k)+1][0])}</button>`:''}</div>`).join('')||'<div class="kempty">—</div>'}</div>`}).join('')}</div>`;
function nextO(id){const o=OR(id);const i=OST.findIndex(s=>s[0]===o.st);o.st=OST[i+1][0];if(o.st==='done'&&o.pay==='консигнация'){PT(o.p).debt+=oSum(o)}render();toast(`${id} → ${OSN(o.st)}${o.st==='done'&&o.pay==='консигнация'?'. Сумма легла в дебиторку точки.':''}`)}
function openOrd(id){const o=OR(id);openM('Заказ '+id,esc(PT(o.p).n)+' · '+fn(o.rep)+' · '+o.pay,`<table class="t sm"><thead><tr><th>Ячейка</th><th>Товар</th><th class="r">Кол-во</th><th class="r">Сумма</th></tr></thead><tbody>${o.items.map(([s,q])=>`<tr><td class="mono">${SK(s).cell}</td><td>${esc(SK(s).n)}</td><td class="r">${q}</td><td class="r">${tg(SK(s).price*q)}</td></tr>`).join('')}<tr class="total"><td colspan="3">Итого</td><td class="r">${tg(oSum(o))}</td></tr></tbody></table><div class="btns l"><button class="bt" onclick="toast('Накладная на печать.')">Накладная</button><button class="bt p" onclick="nextO('${id}');closeM()">Следующий статус</button></div>`)}

/* ===== Доставка ===== */
SC.deliv=()=>{const D=ORDERS.filter(o=>['road','done'].includes(o.st)||o.d==='03.11');
 return `<div class="hd"><div><h2>Доставка экспедитора</h2><p>Утром экспедитор видит вчерашние заказы по порядку маршрута. На точке: отдал товар, принял оплату или оставил на консигнацию, фото подписи. Возврат и обмен — там же.</p></div></div>
 <div class="phw"><div class="phone3"><div class="phs"><div class="phtop"><b>Доставка · ${TODAY.slice(0,5)}</b><span>Газель № 2</span></div>
 ${D.map(o=>`<div class="dv ${o.st}"><div><em>${esc(PT(o.p).n)}</em><span>${o.id} · ${tg(oSum(o))} · ${o.pay}</span></div>${o.st==='road'?`<button class="bt sm p" onclick="dlv('${o.id}')">Доставлено</button>`:tag('✓','g')}</div>`).join('')}
 <div class="kv tot"><span>Наличные в машине</span><b>${tg(ORDERS.filter(o=>o.st!=='road'&&o.d==='03.11'&&o.pay==='наличные').reduce((a,o)=>a+oSum(o),0)+48000)}</b></div></div></div>
 <div class="pan"><h3>Закрытие дня экспедитора</h3><div class="kv"><span>Доставлено</span><b>${D.filter(o=>o.st!=='road').length} из ${D.length}</b></div><div class="kv"><span>Сдать в кассу наличных</span><b>${tg(96800)}</b></div><div class="kv"><span>Kaspi</span><b>${tg(50400)}</b></div><div class="kv"><span>На консигнацию</span><b>${tg(240800)}</b></div><div class="kv"><span>Возвраты</span><b>2 позиции</b></div><button class="bt p" onclick="toast('Смена закрыта: касса и дебиторка обновлены, расхождений нет.')">Закрыть смену</button></div></div>`};
function dlv(id){OR(id).st='done';render();toast('Доставлено. Фото подписи сохранено, клиенту — накладная.')}

/* ===== Возвраты ===== */
let RET=[{d:'04.11',p:'T-0418',s:'A-114',q:2,why:'Истёк срок',type:'возврат',st:'на складе'},{d:'03.11',p:'T-0810',s:'B-201',q:1,why:'Повреждена упаковка',type:'обмен',st:'обменено'},{d:'03.11',p:'T-0905',s:'B-244',q:3,why:'Не продаётся',type:'возврат',st:'в машине'}];
SC.returns=()=>`<div class="hd"><div><h2>Возвраты и обмен</h2><p>Торговый или экспедитор оформляет на точке: товар, количество, причина, фото. Долг точки уменьшается, склад видит товар «в машине», затем «на складе» или «списание».</p></div><div class="btns"><button class="bt p" onclick="RET.unshift({d:'04.11',p:'T-0425',s:'A-131',q:1,why:'Брак',type:'обмен',st:'в машине'});render();toast('Обмен оформлен, долг точки пересчитан.')">+ Возврат</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Точка</th><th>Товар</th><th class="r">Кол-во</th><th>Причина</th><th>Тип</th><th>Статус</th></tr></thead><tbody>${RET.map(r=>`<tr><td class="mono">${r.d}</td><td>${esc(PT(r.p).n)}</td><td>${esc(SK(r.s).n)}</td><td class="r">${r.q}</td><td>${r.why}</td><td>${tag(r.type,r.type==='обмен'?'i':'w')}</td><td>${r.st}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== Точки ===== */
let ptQ='',ptRep='all';
SC.points=()=>{const P=POINTS.filter(p=>(ptRep==='all'||p.rep===ptRep)&&(!ptQ||(p.n+p.addr).toLowerCase().includes(ptQ)));
 return `<div class="hd"><div><h2>Торговые точки · 1 300</h2><p>Каждая точка: торговый, день маршрута, долг и лимит, история визитов, заказов, отказов и фото. Ниже — выборка.</p></div><div class="btns"><input class="sel" placeholder="Поиск" value="${esc(ptQ)}" onchange="ptQ=this.value.toLowerCase();render()"><select class="sel" onchange="ptRep=this.value;render()"><option value="all">Все торговые</option>${REPS.map(r=>`<option value="${r.id}" ${ptRep===r.id?'selected':''}>${esc(r.n)}</option>`).join('')}</select></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Точка</th><th>Формат</th><th>Торговый</th><th>День</th><th class="r">Долг</th><th style="width:13%">Лимит</th><th>Последний визит</th></tr></thead><tbody>${P.map(p=>`<tr onclick="openPt('${p.id}')"><td><b>${esc(p.n)}</b><span class="sub">${p.id} · ${esc(p.addr)}</span></td><td>${p.fmt}</td><td>${fn(p.rep)}</td><td>${DAYS[p.day-1]}</td><td class="r ${p.debt>p.lim?'bad':''}">${tg(p.debt)}</td><td>${bar(pct(p.debt,p.lim),p.debt>p.lim?'r':'b')}</td><td class="mono">${p.last}</td></tr>`).join('')}</tbody></table></div>`};
function openPt(id){const p=PT(id);openM(esc(p.n),esc(p.addr)+' · '+p.fmt+' · '+fn(p.rep)+', '+DAYS[p.day-1],`<div class="kv"><span>Долг / лимит</span><b class="${p.debt>p.lim?'bad':''}">${tg(p.debt)} / ${tg(p.lim)}</b></div><div class="kv"><span>Средний заказ</span><b>${tg(148000)}</b></div><div class="kv"><span>Визитов за месяц</span><b>4 из 4</b></div>
 <div class="pan" style="margin-top:12px"><h3>История</h3>${[['28.10','заказ 296 000 ₸, фото'],['21.10','отказ: товар ещё есть, фото'],['14.10','заказ 318 000 ₸, фото'],['10.10','возврат 2 уп. сока']].map(h=>`<div class="kv"><span>${h[0]}</span><b>${h[1]}</b></div>`).join('')}</div>`)}

/* ===== Склад ===== */
let stT='all';
SC.stock=()=>`<div class="hd"><div><h2>Остатки по группам</h2><p>Один склад, две группы товаров — для двух команд. Торговый видит остатки только своей группы и не может заказать больше, чем есть.</p></div><div class="btns"><div class="seg">${[['all','Все'],['A','Напитки'],['B','Снеки и бакалея']].map(([k,n])=>`<a class="${stT===k?'on':''}" onclick="stT='${k}';render()">${n}</a>`).join('')}</div><button class="bt p" onclick="toast('Остатки выгружены в Excel.')">Excel</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Ячейка</th><th>Товар</th><th>Группа</th><th class="r">Остаток, уп.</th><th class="r">В заказах</th><th class="r">Мин.</th><th class="r">Закупка</th><th class="r">Сумма</th><th></th></tr></thead><tbody>${SKU.filter(s=>stT==='all'||s.t===stT).map(s=>{const r=ORDERS.filter(o=>['new','pick'].includes(o.st)).reduce((a,o)=>a+((o.items.find(i=>i[0]===s.id)||[0,0])[1]),0);return `<tr><td class="mono">${s.cell}</td><td><b>${esc(s.n)}</b><span class="sub">${s.id}</span></td><td><i class="tm" style="background:${TEAMS[s.t].c}"></i>${TEAMS[s.t].g}</td><td class="r">${s.q}</td><td class="r">${r||'—'}</td><td class="r mini">${s.min}</td><td class="r">${tg(s.cost)}</td><td class="r">${tg(s.q*s.cost)}</td><td>${s.q<s.min?tag('заказать','r'):tag('норма','g')}</td></tr>`}).join('')}</tbody></table></div>`;
let INV=null;
SC.inv=()=>{if(!INV)INV=SKU.map(s=>({s:s.id,book:s.q,fact:null}));const done=INV.every(r=>r.fact!==null);
 return `<div class="hd"><div><h2>Инвентаризация</h2><p>Кладовщик пересчитывает, система показывает расхождения, собственник утверждает — остатки становятся фактическими, акт в Excel.</p></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Товар</th><th class="r">Учёт</th><th class="r">Факт</th><th class="r">Разница</th><th class="r">Сумма</th></tr></thead><tbody>${INV.map((r,i)=>{const d=r.fact===null?null:r.fact-r.book;return `<tr><td>${esc(SK(r.s).n)}</td><td class="r">${r.book}</td><td class="r"><input class="qin" type="number" value="${r.fact===null?'':r.fact}" onchange="INV[${i}].fact=+this.value;render()"></td><td class="r ${d<0?'bad':''}">${d===null?'—':d}</td><td class="r">${d===null?'':tg(d*SK(r.s).cost)}</td></tr>`}).join('')}</tbody></table></div>
 <div class="btns l"><button class="bt" onclick="INV.forEach((r,i)=>{if(r.fact===null)r.fact=r.book-[0,2,0,1,0,3,0,0][i]});render()">Посчитать (демо)</button><button class="bt p" ${done?'':'disabled'} onclick="INV.forEach(r=>SK(r.s).q=r.fact);INV=null;render();toast('Акт проведён, остатки = факт.')">Утвердить акт</button></div>`};

/* ===== Дебиторка ===== */
SC.debts=()=>{const by=REPS.map(r=>({r,d:[2.31,1.84,2.9,1.2,2.62,2.05,3.4,2.32][REPS.indexOf(r)]*1000000}));
 return `<div class="hd"><div><h2>Дебиторка · консигнация</h2><p>Товар стоит на полках, точки платят по мере продажи. Долг — по каждой точке и по каждому торговому. Превысил лимит или просрочил — следующий заказ только за наличные.</p></div><div class="btns"><button class="bt" onclick="toast('Дебиторка выгружена в Excel.')">Excel</button><button class="bt p" onclick="toast('Напоминания о долге отправлены 46 точкам в WhatsApp.')">Напомнить должникам</button></div></div>
 <div class="g2"><div class="pan"><h3>По торговым</h3><table class="t sm"><thead><tr><th>Торговый</th><th class="r">Долг точек</th><th class="r">Просрочка 30+</th></tr></thead><tbody>${by.map(x=>`<tr><td>${esc(x.r.n)}</td><td class="r">${tg(x.d)}</td><td class="r ${x.r.id==='R7'?'bad':''}">${tg(x.d*(x.r.id==='R7'?0.34:0.11))}</td></tr>`).join('')}<tr class="total"><td>Итого</td><td class="r">${tg(by.reduce((a,x)=>a+x.d,0))}</td><td class="r">${tg(2310000)}</td></tr></tbody></table></div>
 <div class="pan"><h3>Точки выше лимита</h3>${POINTS.filter(p=>p.debt>p.lim*0.9).map(p=>`<a class="trow" onclick="openPt('${p.id}')"><i class="dt ${p.debt>p.lim?'r':'w'}"></i><b>${esc(p.n)}</b><span>${tg(p.debt)} из ${tg(p.lim)} · ${fn(p.rep)}</span></a>`).join('')}</div></div>`};

/* ===== P&L ===== */
let EXP=[['Зарплата и KPI',6240000],['Топливо и ремонт машин',1380000],['Аренда склада и офиса',900000],['Налоги',1720000],['Связь, интернет, сервер',62000],['Прочее',410000]];
SC.pnl=()=>{const rev=61200000,cogs=46400000,gp=rev-cogs,ex=EXP.reduce((a,e)=>a+e[1],0);
 return `<div class="hd"><div><h2>Доходы и расходы · октябрь</h2><p>Продажи и себестоимость — из заказов, расходы вносит бухгалтер или сотрудник с телефона (с фото чека). Отчёт о прибылях собирается сам.</p></div><div class="btns"><button class="bt p" onclick="EXP[5][1]+=25000;render();toast('Расход внесён.')">+ Расход</button><button class="bt" onclick="toast('P&L выгружен в Excel.')">Excel</button></div></div>
 <div class="g21"><div class="tw"><table class="t pnl"><tbody><tr class="sum"><td>Выручка</td><td class="r">${tg(rev)}</td></tr><tr><td>Себестоимость товара</td><td class="r">− ${tg(cogs)}</td></tr><tr class="sum"><td>Валовая прибыль</td><td class="r">${tg(gp)}</td></tr>${EXP.map(e=>`<tr><td>${e[0]}</td><td class="r">− ${tg(e[1])}</td></tr>`).join('')}<tr class="sum"><td>Чистая прибыль</td><td class="r ok">${tg(gp-ex)}</td></tr></tbody></table></div>
 <div class="pan"><h3>По командам</h3>${[['Команда А · напитки',34100000,7900000],['Команда Б · снеки',27100000,6900000]].map(t=>`<div class="kv"><span>${t[0]}</span><b>${tg(t[1])}</b></div><div class="kv"><span>валовая прибыль</span><b>${tg(t[2])}</b></div>`).join('')}</div></div>
 ${said('«Расходы, расходную часть — чтобы мы там тоже вводили. P&L — это нужно.»')}`};

/* ===== Зарплата ===== */
SC.pay=()=>`<div class="hd"><div><h2>Зарплата · октябрь</h2><p>Оклад + бонус по KPI: визиты, вовремя на работе, заказы, средний чек, сбор долгов. Считается из данных поля, без ручных таблиц.</p></div><div class="btns"><button class="bt" onclick="toast('Ведомость выгружена в Excel.')">Excel</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th class="r">Оклад</th><th class="r">KPI</th><th class="r">Бонус</th><th class="r">Итого</th></tr></thead><tbody>${REPS.map(r=>{const k=kpiOf(r);const b=Math.round(150000*k/100);return `<tr><td>${esc(r.n)}<span class="sub">торговый · ${TEAMS[r.t].n}</span></td><td class="r">${tg(180000)}</td><td class="r ${k<80?'bad':''}">${k}%</td><td class="r">${tg(b)}</td><td class="r"><b>${tg(180000+b)}</b></td></tr>`}).join('')}</tbody></table></div>`;

/* ===== KPI ===== */
const kpiOf=r=>Math.round(pct(r.done,r.plan)*0.35+Math.min(100,pct(r.ord,r.done)*1.3)*0.25+(r.late?60:100)*0.15+Math.min(100,pct(r.sum/r.ord,65000))*0.25);
SC.kpi=()=>`<div class="hd"><div><h2>KPI торговых</h2><p>Показатели — те, что вы назовёте. В демо: визиты по маршруту (с GPS и фото), вовремя на работе, доля визитов с заказом, средний чек. Чтобы не «снимали сливки» — визиты весят больше всего.</p></div></div>
 <div class="kpig">${REPS.map(r=>{const k=kpiOf(r);return `<div class="pan kp"><div class="kph"><i class="tm" style="background:${TEAMS[r.t].c}"></i><b>${esc(r.n)}</b><em class="${k<80?'bad':'ok'}">${k}%</em></div>
 ${[['Визиты',pct(r.done,r.plan)+'%',35],['С заказом',pct(r.ord,r.done)+'%',25],['Вовремя',r.late?'опоздание':'да',15],['Средний чек',tg(r.sum/r.ord),25]].map(x=>`<div class="kv"><span>${x[0]} <small>· вес ${x[2]}%</small></span><b>${x[1]}</b></div>`).join('')}${bar(k,k<80?'r':'g')}</div>`}).join('')}</div>
 ${said('«Чтобы посещали все точки, а не просто собирали сливки… вовремя на работе, количество заказов, средние чеки.»')}`;

/* ===== Задачи ===== */
const TS=[['new','Новые'],['work','В работе'],['check','На проверке'],['done','Готово']];
SC.tasks=()=>`<div class="hd"><div><h2>Задачи администрации</h2><p>Как Trello: карточки, сроки, ответственные, этапы. Текучка, новые направления, поручения собственника.</p></div><div class="btns"><button class="bt p" onclick="TASKS.unshift({id:'Z-'+(46+TASKS.length),t:'Новая задача',who:'Супервайзер',due:'07.11',st:'new'});render()">+ Задача</button></div></div>
 <div class="kanban k4">${TS.map(([k,n])=>`<div class="kcol" ondragover="event.preventDefault()" ondrop="const t=TASKS.find(x=>x.id===event.dataTransfer.getData('t'));t.st='${k}';render()"><div class="kh"><b>${n}</b><span>${TASKS.filter(t=>t.st===k).length}</span></div>${TASKS.filter(t=>t.st===k).map(t=>`<div class="kc" draggable="true" ondragstart="event.dataTransfer.setData('t','${t.id}')"><code>${t.id} · до ${t.due}</code><b>${esc(t.t)}</b><span>${t.who}</span></div>`).join('')}</div>`).join('')}</div>`;

/* ===== Роли ===== */
const PERM=['Сводка и P&L','Все точки','Точки своей команды','Заказ и отказ','Менять цену','Маршруты','Склад','Дебиторка','Зарплата'];
const PM={'Собственник':'111111111','Супервайзер':'011101010','Торговый':'001100000','Экспедитор':'001100000','Кладовщик':'010000100','Бухгалтер':'110000011'};
SC.roles=()=>`<div class="hd"><div><h2>Роли и группы</h2><p>Две команды, две группы товаров: каждая видит только своё. Торговый не может менять цену и видеть чужие точки.</p></div></div>
 <div class="tw"><table class="t perm"><thead><tr><th>Право</th>${Object.keys(PM).map(r=>`<th class="c">${r}</th>`).join('')}</tr></thead><tbody>${PERM.map((p,i)=>`<tr><td>${p}</td>${Object.keys(PM).map(r=>`<td class="c"><a class="pm ${PM[r][i]==='1'?'on':''}" onclick="PM['${r}']=PM['${r}'].slice(0,${i})+(PM['${r}'][${i}]==='1'?'0':'1')+PM['${r}'].slice(${i+1});render()">${PM[r][i]==='1'?'✓':''}</a></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

/* ===== Переезд с 1С ===== */
SC.move1c=()=>`<div class="hd"><div><h2>Переезд с 1С</h2><p>Два пути. Мы рекомендуем первый: один раз забираем данные и дальше работаем в портале. 1С остаётся только для бухгалтерии, мобильная 1С и торговая база больше не нужны.</p></div></div>
 <div class="g2"><div class="pan opt on"><code>РЕКОМЕНДУЕМ · ВХОДИТ В ЦЕНУ</code><h3>Разовый перенос</h3>${['Сейчас берём тестовую выгрузку и строим портал на ваших данных','Точки, товары, маршруты, долги, цены — всё переносим','В выбранный день забираем боевую базу и переходим','Мобильная 1С у торговых больше не нужна','Физический сервер не нужен — облако, копии за 30 дней'].map(x=>`<div class="ck">✓ ${x}</div>`).join('')}</div>
 <div class="pan opt"><code>ДОРОЖЕ И МЕНЕЕ НАДЁЖНО</code><h3>Постоянная синхронизация с 1С</h3>${['Данные гоняются туда-обратно','Если 1С зависла — встают заказы','+800 000 ₸ к стоимости'].map(x=>`<div class="ck no">· ${x}</div>`).join('')}</div></div>
 <div class="pan"><h3>План перехода</h3><div class="flow4">${['Тестовая выгрузка из 1С','База портала на ваших данных','Полировка с торговыми в поле','День X: боевая база, переход'].map((x,i)=>`<div><b>${i+1}</b>${x}</div>`).join('')}</div></div>`;

/* ===== Стоимость ===== */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость</h2><p>Своя система под ваши маршруты, команды и отчёты. Без абонентской платы: код и сервер — ваши.</p></div></div>
 <div class="g21"><div class="pan"><h3>Сравнение</h3><table class="t"><thead><tr><th></th><th>Pllato</th><th>Готовая подписка</th></tr></thead><tbody>${[['Платёж','один раз 2 500 000 ₸','каждый месяц за каждого пользователя'],['Ваши отчёты, KPI, P&L','делаем под вас','что есть в коробке'],['Код и данные','ваши, на вашем сервере','у поставщика'],['Сервер','5 $ в месяц или бесплатно','в подписке'],['Доработки','20 $ в час','по их планам']].map(r=>`<tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td class="mini">${r[2]}</td></tr>`).join('')}</tbody></table></div>
 <div class="pan price"><h3>Условия</h3><div class="kv tot"><span>Разработка и внедрение</span><b>${tg(2500000)}</b></div><div class="kv"><span>Старт · 30%</span><b>${tg(750000)}</b></div><div class="kv"><span>База на вашем сервере · 30%</span><b>${tg(750000)}</b></div><div class="kv"><span>Сдача · 40%</span><b>${tg(1000000)}</b></div><div class="kv"><span>Срок</span><b>4–6 недель</b></div><div class="kv"><span>Поддержка</span><b>3 месяца включено</b></div><div class="kv"><span>Запас на правки</span><b>~15% объёма</b></div><div class="kv"><span>Синхронизация с 1С (по желанию)</span><b>+ ${tg(800000)}</b></div></div></div>`;

/* ===== Каркас: верхние вкладки + левая колонка ===== */
function searchDemo(v){if(!v)return;const q=v.toLowerCase();const p=POINTS.find(x=>(x.n+x.addr+x.id).toLowerCase().includes(q));if(p){openPt(p.id);return}toast('Не найдено. Попробуйте: «Жайык», «Нур».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option>${esc(k)}</option>`).join('')}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build()}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Роль <b>${esc(role)}</b>: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<a class="ri ${s.k===SECOF[cur]?'on':''}" onclick="go('${s.sub.filter(x=>allowed(x[0]))[0][0]}')"><span>${s.n}</span></a>`).join('');
 const S=SEC.find(x=>x.k===SECOF[cur]);document.getElementById('sub').innerHTML=`<h4>${esc(S.n)}</h4>`+S.sub.filter(x=>allowed(x[0])).map((x,i)=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')"><code>${String(i+1).padStart(2,'0')}</code>${esc(x[1])}</a>`).join('')+`<div class="shint"><b>${esc(role)}</b><br>${esc(ROLES[role].note)}</div>`}
function build(){buildRail();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Жайык';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildRail();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой роли раздел недоступен — так работают права. Переключите роль справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show')}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function xlsDay(){const h=`<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>Торговый</th><th>Визиты</th><th>План</th><th>Заказы</th><th>Сумма</th><th>Отказы</th></tr>${REPS.map(r=>`<tr><td>${esc(r.n)}</td><td>${r.done}</td><td>${r.plan}</td><td>${r.ord}</td><td>${r.sum}</td><td>${r.ref}</td></tr>`).join('')}</table></body></html>`;try{const b=new Blob(['﻿'+h],{type:'application/vnd.ms-excel'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='Сводка_'+TODAY+'.xls';document.body.appendChild(a);a.click();a.remove()}catch(e){}toast('Файл <b>Сводка.xls</b> скачан.')}
let theme='light';function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme()}
const TOUR=[['dash','1 · Сводка: визиты, заказы, отказы, долги, прибыль.'],['map','2 · Где сейчас торговые — по GPS.'],['visit','3 · Визит с телефона: GPS + фото полки → заказ или отказ.'],['refusals','4 · Отказы с причинами — выборочная проверка супервайзером.'],['routes','5 · 5 маршрутов на 5 дней у каждого торгового.'],['orders','6 · Заказ: принят → собран → доставлен → оплачен.'],['deliv','7 · Экспедитор: доставка, оплата, консигнация.'],['debts','8 · Дебиторка по точкам и торговым, лимиты.'],['stock','9 · Склад по двум группам товаров.'],['kpi','10 · KPI: визиты, вовремя, заказы, средний чек.'],['pnl','11 · Доходы, расходы, P&L.'],['move1c','12 · Переезд с 1С за один день.'],['launch','13 · 2 500 000 ₸, 4–6 недель, без абонплаты.']];
let ti=-1,tRun=false;function tour(){if(tRun){tRun=false;return}tRun=true;ti=-1;step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){tRun=false;toast('Сценарий закончен — всё кликается.');return}const [k,m]=TOUR[ti];if(!allowed(k))switchRole('Собственник');cur=k;build();toast('<b>'+m+'</b>');setTimeout(step,5200)}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();tRun=false}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
function stopTour(){tRun=false}
