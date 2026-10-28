/* ДРАЙВ АРЕНДА — система парка аренды авто под такси (Астана + Алматы, 216 машин): ежедневные оплаты по коду машины через Каспий Платежи (разбор писем-подтверждений), автоматическая блокировка через GPS при неоплате к 21:00, реестр машин и водителей, воронка водителей, договоры с ЭЦП / eGov / на бумаге, штрафы по камерам (робот или Smart Bridge) с отправкой протокола водителю в WhatsApp, рассылки через Green API с номера своего города, два филиала с раздельными базами. Название, машины, водители и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='28.10.2026',NOW='21:12';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="currentColor"/><circle cx="50" cy="50" r="26" fill="var(--brand2,#f5b800)"/><circle cx="50" cy="50" r="9" fill="currentColor"/><rect x="47" y="24" width="6" height="18" fill="currentColor"/><rect x="47" y="58" width="6" height="18" fill="currentColor"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;
const TC={ok:'g',warn:'w',bad:'r',info:'i',violet:'v'};
const tag=(t,c)=>`<span class="tag ${TC[c]||c||''}">${t}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const SC={},CARD={};
const SEC=[
 {k:'top',n:'Руководителю',sub:[['dash','Пульт парка'],['map','Карта машин'],['branches','Филиалы: Астана и Алматы']]},
 {k:'mn',n:'Деньги',sub:[['pays','Ежедневные оплаты'],['debt','Должники и блокировка'],['rules','Правила блокировки']]},
 {k:'fl',n:'Автопарк',sub:[['cars','Реестр машин'],['repair','Ремонт и ДТП']]},
 {k:'dr',n:'Водители',sub:[['dfunnel','Воронка водителей'],['drivers','Водители'],['contracts','Договоры: ЭЦП, eGov, бумага']]},
 {k:'fn',n:'Штрафы',sub:[['fines','Штрафы по камерам'],['robot','Сбор штрафов: робот']]},
 {k:'cm',n:'Связь',sub:[['wa','WhatsApp-рассылки']]},
 {k:'sys',n:'Внедрение',sub:[['integr','Интеграции'],['launch','Стоимость и этапы']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Управляющий':{av:'НБ',n:'Нурбол',note:'Весь парк, оба города, деньги, штрафы, договоры',s:ALL.slice()},
 'Собственник':{av:'СБ',n:'Старший брат',note:'Пульт, филиалы, оплаты, должники, машины',s:['dash','map','branches','pays','debt','cars','repair','launch']},
 'Менеджер парка':{av:'МП',n:'Астана',note:'Водители, договоры, оплаты, блокировка — только свой город',s:['dash','map','pays','debt','dfunnel','drivers','contracts','wa','cars']},
 'Механик':{av:'МХ',n:'Сервис',note:'Ремонт, ДТП, запчасти, машина обратно на линию',s:['repair','cars','map']},
 'Юрист':{av:'ЮР',n:'Штрафы',note:'Штрафы, протоколы, перевод на ИИН водителя',s:['fines','robot','drivers','contracts']}
};
let role='Управляющий',cur='dash',theme='light',city='all';
const CITY={all:'Оба города',ast:'Астана',alm:'Алматы'};
const inCity=c=>city==='all'||c.c===city;
function citySw(){return `<div class="dpcity">${Object.entries(CITY).map(([k,v])=>`<button class="${city===k?'on':''}" onclick="setCity('${k}')">${v}</button>`).join('')}</div>`}
function setCity(k){city=k;toast(k==='all'?'Консолидация: оба города.':`${CITY[k]}: только машины, водители и рассылки этого города.`);render()}
/* Машины. st: line — на линии, debt — долг, block — заблокирована, repair — ремонт, free — свободна */
let CARS=[
 {id:'017',p:'217 ABK 01',m:'Hyundai Accent 2023',c:'ast',dr:'Ерлан К.',rate:9000,till:'29.10',st:'line',own:'Лизинг',gps:'Трекер лизингодателя',debt:0,x:38,y:42},
 {id:'024',p:'544 KLM 01',m:'Kia Rio 2022',c:'ast',dr:'Азамат Т.',rate:8500,till:'27.10',st:'debt',own:'Собственная',gps:'Свой трекер',debt:17000,x:55,y:30},
 {id:'031',p:'903 DPA 01',m:'Chevrolet Nexia 2023',c:'ast',dr:'Бауыржан С.',rate:7000,till:'25.10',st:'block',own:'Собственная',gps:'Свой трекер',debt:28000,x:62,y:58},
 {id:'046',p:'118 TRA 01',m:'Toyota Camry 2022',c:'ast',dr:'Данияр М.',rate:15000,till:'29.10',st:'line',own:'Лизинг',gps:'Трекер лизингодателя',debt:0,x:30,y:64},
 {id:'052',p:'771 BYD 01',m:'BYD Qin Plus EV 2025',c:'ast',dr:'Руслан А.',rate:13000,till:'29.10',st:'line',own:'Лизинг',gps:'Трекер лизингодателя',debt:0,x:47,y:52},
 {id:'058',p:'330 HNA 01',m:'Hyundai Elantra 2022',c:'ast',dr:'—',rate:11000,till:'—',st:'repair',own:'Собственная',gps:'Свой трекер',debt:0,x:72,y:40},
 {id:'063',p:'402 KZT 01',m:'Kia K5 2023',c:'ast',dr:'—',rate:14000,till:'—',st:'free',own:'Лизинг',gps:'Трекер лизингодателя',debt:0,x:24,y:36},
 {id:'108',p:'655 ALM 02',m:'Hyundai Accent 2022',c:'alm',dr:'Нурлан Б.',rate:9000,till:'29.10',st:'line',own:'Собственная',gps:'Свой трекер',debt:0,x:40,y:46},
 {id:'112',p:'208 OPT 02',m:'Chevrolet Cobalt 2023',c:'alm',dr:'Серик Ж.',rate:7500,till:'28.10',st:'debt',own:'Лизинг',gps:'Трекер лизингодателя',debt:7500,x:58,y:62},
 {id:'119',p:'919 JET 02',m:'Toyota Camry 2023',c:'alm',dr:'Айдос Р.',rate:15000,till:'29.10',st:'line',own:'Лизинг',gps:'Трекер лизингодателя',debt:0,x:33,y:28},
 {id:'127',p:'512 VKK 02',m:'Kia Rio 2022',c:'alm',dr:'Максат Е.',rate:8500,till:'26.10',st:'block',own:'Собственная',gps:'Свой трекер',debt:25500,x:66,y:34},
 {id:'134',p:'087 ZXC 02',m:'Hyundai Sonata 2022',c:'alm',dr:'Тимур О.',rate:13000,till:'29.10',st:'line',own:'Собственная',gps:'Свой трекер',debt:0,x:50,y:72}
];
const CST={line:['На линии','ok'],debt:['Долг','warn'],block:['Заблокирована','bad'],repair:['Ремонт','info'],free:['Свободна','']};
const stTag=s=>tag(CST[s][0],CST[s][1]);
const carsC=()=>CARS.filter(inCity);
const TOT={all:216,ast:124,alm:92};
/* Пульт */
SC.dash=()=>{const cs=carsC(),k=city==='all'?18:city==='ast'?10.3:7.7;const dl=cs.filter(c=>c.st==='debt').length,bl=cs.filter(c=>c.st==='block').length;
return `<div class="hd"><div><h2>Пульт парка · ${TODAY} · ${NOW}</h2><p>Сколько машин на линии, кто оплатил сегодня, у кого долг и кто заблокирован, какие машины в ремонте и сколько штрафов не оплачено. Всё собирается само: оплаты — из Каспий Платежей, статусы — из GPS-трекеров, штрафы — роботом.</p></div>${citySw()}</div>
 <div class="wid">
  <div class="clk" onclick="go('map')"><small>Машин в парке</small><b class="a">${TOT[city]}</b><span>на линии ${Math.round(TOT[city]*.86)} · ремонт ${Math.round(TOT[city]*.06)} · свободны ${Math.round(TOT[city]*.03)}</span></div>
  <div class="clk" onclick="go('pays')"><small>Оплачено сегодня</small><b class="g">${tg(Math.round(1620000*k/18))}</b><span>${Math.round(171*k/18)} оплат из ${Math.round(186*k/18)}</span></div>
  <div class="clk" onclick="go('debt')"><small>Не оплатили к 21:00</small><b>${Math.round(15*k/18)+dl}</b><span>блокировка ушла автоматически</span></div>
  <div class="clk" onclick="go('debt')"><small>Заблокированы</small><b>${Math.round(6*k/18)+bl}</b><span>долг ${tg(Math.round(214000*k/18))}</span></div>
  <div class="clk" onclick="go('fines')"><small>Штрафы не оплачены</small><b>${Math.round(23*k/18)}</b><span>протоколы у водителей в WhatsApp</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Сбор аренды за неделю</h3>${bars([['Пн 21.10',1580000,'1 580 тыс.'],['Вт 22.10',1610000,'1 610 тыс.'],['Ср 23.10',1540000,'1 540 тыс.'],['Чт 24.10',1650000,'1 650 тыс.'],['Пт 25.10',1690000,'1 690 тыс.'],['Сб 26.10',1520000,'1 520 тыс.'],['Вс 27.10',1470000,'1 470 тыс.']].map(r=>[r[0],Math.round(r[1]*k/18),(r[1]*k/18/1e6).toFixed(2).replace('.',',')+' млн']))}
  <div class="kv" style="margin-top:8px"><span>План по аренде на день</span><b>${tg(Math.round(1730000*k/18))}</b></div></div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="card('car','031')"><i></i><div><b>№031 · Nexia · 3 дня без оплаты — заблокирована</b><span>долг 28 000 ₸ · водитель пишет в WhatsApp</span></div></div>
  <div class="rf" onclick="card('car','024')"><i></i><div><b>№024 · Kia Rio · не оплатил к 21:00</b><span>блокировка в 21:30, если оплата не придёт</span></div></div>
  <div class="rf" onclick="go('repair')"><i></i><div><b>№058 · Elantra · 4 дня в ремонте</b><span>ждём бампер — машина не приносит 11 000 ₸ в день</span></div></div>
  <div class="rf" onclick="go('fines')"><i></i><div><b>5 новых штрафов за ночь</b><span>протоколы отправлены водителям</span></div></div>
 </div></div>
 ${said('Мне нужно всё это оцифровать, автоматизировать — сейчас больше всего по оплате')}`};

/* Карта */
SC.map=()=>{const cs=carsC();return `<div class="hd"><div><h2>Карта машин</h2><p>Все машины на одной карте из обоих GPS-сервисов — трекеров лизингодателя и ваших. Цвет — статус по оплате. Нажмите на машину: водитель, оплачено до, долг, кнопки «заблокировать» и «написать водителю».</p></div>${citySw()}</div>
 <div class="g2 g21"><div class="pan"><div class="dpmap">${city!=='alm'?'<span class="dpcl" style="left:8px;top:8px">'+(city==='all'?'Астана · Алматы — переключите город':'Астана')+'</span>':'<span class="dpcl" style="left:8px;top:8px">Алматы</span>'}<i class="dprd" style="top:44%"></i><i class="dprd v" style="left:46%"></i><i class="dprd" style="top:70%;opacity:.5"></i>
  ${cs.map(c=>`<button class="dppin ${c.st}" style="left:${c.x}%;top:${c.y}%" onclick="card('car','${c.id}')" title="${c.p}">${c.id}</button>`).join('')}</div>
  <div class="dpleg">${Object.entries(CST).map(([k,v])=>`<span><i class="dpdot ${k}"></i>${v[0]}</span>`).join('')}</div></div>
 <div class="pan"><h3>Сейчас</h3>${cs.map(c=>`<div class="rf ${c.st==='block'?'bad':''}" onclick="card('car','${c.id}')"><i></i><div><b>№${c.id} · ${c.p} · ${c.m}</b><span>${CST[c.st][0]} · ${c.dr} · ${c.st==='line'?'едет, 34 км/ч':c.st==='block'?'стоит 1 д. 4 ч':c.st==='repair'?'в сервисе':c.st==='free'?'на стоянке парка':'едет'}</span></div></div>`).join('')}</div></div>
 ${said('GPS-трекинг нам дадут — это наше имущество','Тогда и карта, и статусы машин, и сколько стоит или ездит — в одном окне.')}`};
CARD.car=id=>{const c=CARS.find(x=>x.id===id);return [`№${c.id} · ${c.p}`,`${c.m} · ${CITY[c.c]} · ${c.own}`,`<div class="kv"><span>Статус</span><b>${stTag(c.st)}</b></div><div class="kv"><span>Водитель</span><b>${c.dr}</b></div><div class="kv"><span>Аренда в день</span><b>${tg(c.rate)}</b></div><div class="kv"><span>Оплачено до</span><b>${c.till}</b></div><div class="kv"><span>Долг</span><b>${c.debt?tg(c.debt):'нет'}</b></div><div class="kv"><span>Код оплаты в Каспий Платежах</span><b class="mono">${c.id}</b></div><div class="kv"><span>GPS</span><b>${c.gps}</b></div>
 <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${c.st==='block'?`<button class="bt p" onclick="unblock('${c.id}')">Разблокировать</button>`:c.dr!=='—'?`<button class="bt p" onclick="blockCar('${c.id}')">Заблокировать</button>`:''}<button class="bt" onclick="act('Сообщение водителю ушло в WhatsApp с номера парка «${CITY[c.c]}».')">Написать водителю</button><button class="bt" onclick="closeM();go('fines')">Штрафы машины</button></div>`]};
function blockCar(id){const c=CARS.find(x=>x.id===id);c.st='block';closeM();toast(`№${c.id} заблокирована через ${c.gps.toLowerCase()}. Водителю ушло сообщение: «Машина заблокирована за неоплату. Оплатите ${tg(c.debt||c.rate)} по коду ${c.id} — разблокируем автоматически».`);render()}
function unblock(id){const c=CARS.find(x=>x.id===id);c.st='line';c.debt=0;c.till='29.10';closeM();toast(`№${c.id} разблокирована. Действие записано в журнал: кто и когда.`);render()}

/* Филиалы */
SC.branches=()=>`<div class="hd"><div><h2>Филиалы: Астана и Алматы</h2><p>Две отдельные базы машин и водителей, два WhatsApp-номера, договоры на разные юрлица. Руководитель выбирает город или смотрит консолидацию. Менеджер Астаны видит только Астану, его рассылки уходят только астанинским водителям.</p></div></div>
 <div class="g2">${[['ast','Астана',124,1040000,9,'ТОО «Драйв Аренда Астана»','+7 7xx *** 11 01'],['alm','Алматы',92,770000,6,'ТОО «Драйв Аренда Алматы»','+7 7xx *** 22 02']].map(b=>`<div class="pan dpbr" onclick="setCity('${b[0]}');go('dash')"><h3>${b[1]}</h3><div class="kv"><span>Машин</span><b>${b[2]}</b></div><div class="kv"><span>Аренда сегодня</span><b>${tg(b[3])}</b></div><div class="kv"><span>Должники</span><b>${b[4]}</b></div><div class="kv"><span>Юрлицо в договорах</span><b>${b[5]}</b></div><div class="kv"><span>WhatsApp-номер</span><b>${b[6]}</b></div><div class="kv"><span>Сервер и база</span><b>отдельные</b></div></div>`).join('')}</div>
 <div class="pan"><h3>Консолидация</h3><div class="kv"><span>Аренда за октябрь, оба города</span><b>${tg(46800000)}</b></div><div class="kv"><span>Средняя ставка в день</span><b>${tg(9900)}</b></div><div class="kv"><span>Простой из-за ремонта</span><b>${tg(1940000)} за месяц</b></div></div>
 ${said('Чтобы друг другу кашу не делать — базу автомобилей отделить: выбрать Астана или Алматы, и рассылка с его WhatsApp — на его машины','Отдельные базы и номера, общий пульт для руководителя. Второй город — +15 % к стандартному пакету.')}`;
