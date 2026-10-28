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
/* Ежедневные оплаты */
let PAYS=[
 ['21:08','017','Ерлан К.',9000,'ok'],['21:02','119','Айдос Р.',15000,'ok'],['20:57','046','Данияр М.',15000,'ok'],['20:51','134','Тимур О.',13000,'ok'],['20:44','052','Руслан А.',13000,'ok'],['20:40','108','Нурлан Б.',9000,'ok'],['20:31','24','Азамат Т.',5000,'part'],['19:58','—','код не указан',9000,'unk']
];
const pcar=id=>CARS.find(c=>c.id===id);
SC.pays=()=>{const rows=PAYS.filter(r=>{const c=pcar(r[1]);return !c||inCity(c)});return `<div class="hd"><div><h2>Ежедневные оплаты</h2><p>Водитель платит в Каспий Платежах: вводит сумму и код своей машины. Каспий присылает подтверждение на почту парка, система разбирает письмо за 10–15 минут, ставит оплату на машину и продлевает аренду на сутки. Без 3 % банку за API — только стандартная функция писем.</p></div>${citySw()}</div>
 <div class="dpflow">${['Водитель платит в Каспий Платежах · код 017','Каспий присылает письмо на почту парка','Система разбирает письмо','Оплата на машине № 017','Аренда продлена до завтра 21:00'].map((x,i)=>`<div><small>${i+1}</small><b>${x}</b></div>`).join('')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Код машины</th><th>Водитель</th><th class="r">Сумма</th><th>Разнесено</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r[4]==='unk'?'rowwarn':''}"><td class="mono">${r[0]}</td><td class="mono">${r[1]}</td><td>${r[2]}</td><td class="r">${tg(r[3])}</td><td>${r[4]==='ok'?tag('продлено на сутки','ok'):r[4]==='part'?tag('частично · ошибка в коде','warn'):`<button class="bt p sm" onclick="assignPay()">Привязать вручную</button>`}</td></tr>`).join('')}</tbody></table></div>
 <div style="margin-top:10px"><button class="bt p" onclick="newPay()">Показать: пришла оплата по № 024</button></div></div>
 ${tip('Ошибся кодом','Водитель указал «24» вместо «024» или не указал код — оплата попадает в «разобрать вручную» и не теряется. Система подсказывает машину по сумме и номеру телефона плательщика.')}
 ${said('Раздали QR на каждую машину, Каспий говорит — показывать только через API, а сторонние берут до 3 %','Через Каспий Платежи с кодом машины и письма-подтверждения — бесплатно; так работает сеть франшиз нашего клиента два года.')}`};
function newPay(){const c=pcar('024');if(c.st==='line'){toast('№024 уже оплачена.');return}c.st='line';c.debt=0;c.till='29.10';PAYS.unshift(['21:12','024','Азамат Т.',17000,'ok']);toast('Письмо Каспия разобрано: 17 000 ₸ по коду 024 → долг закрыт, аренда до 29.10 21:00. Блокировка отменена, водителю ушло «Оплата получена, спасибо».');render()}
function assignPay(){const r=PAYS.find(x=>x[4]==='unk');if(!r)return;r[1]='108';r[2]='Нурлан Б.';r[4]='ok';toast('Оплата 9 000 ₸ привязана к № 108 по телефону плательщика. Аренда продлена.');render()}

/* Должники и блокировка */
SC.debt=()=>{const cs=carsC().filter(c=>c.debt>0||c.st==='block'||c.st==='debt');return `<div class="hd"><div><h2>Должники и блокировка</h2><p>В 21:00 система сама видит, кто не оплатил. В 21:30 машина блокируется через нужный GPS-сервис — лизингодателя или ваш, — без ручного захода в разные программы. Пришла оплата — разблокировка автоматически. Каждое действие в журнале.</p></div>${citySw()}</div>
 <div class="wid"><div><small>Не оплатили к 21:00</small><b>${cs.filter(c=>c.st==='debt').length}</b><span>предупреждение ушло в 21:00</span></div><div><small>Заблокированы</small><b>${cs.filter(c=>c.st==='block').length}</b><span>по правилу или вручную</span></div><div><small>Общий долг</small><b>${tg(cs.reduce((a,c)=>a+c.debt,0))}</b><span>по выбранному городу</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Машина</th><th>Водитель</th><th>Город</th><th>Оплачено до</th><th class="r">Долг</th><th>Статус</th><th></th></tr></thead><tbody>${cs.map(c=>`<tr><td><b>№${c.id}</b> ${c.p}</td><td>${c.dr}</td><td>${CITY[c.c]}</td><td>${c.till}</td><td class="r">${tg(c.debt)}</td><td>${stTag(c.st)}</td><td>${c.st==='block'?`<button class="bt sm" onclick="unblock('${c.id}')">Разблокировать</button>`:`<button class="bt p sm" onclick="blockCar('${c.id}')">Заблокировать</button>`}</td></tr>`).join('')||'<tr><td colspan="7">Должников нет</td></tr>'}</tbody></table></div></div>
 <div class="pan"><h3>Журнал за сегодня</h3>${[['21:00','Система','Предупреждение 15 водителям: «Оплата не поступила, блокировка в 21:30»'],['20:12','Менеджер Астана','Отсрочка до завтра 12:00 — № 017, ДТП, водитель в полиции'],['09:00','Система','Разблокированы 4 машины после ночных оплат']].map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b style="font-weight:500">${r[2]}</b></div>`).join('')}</div>
 ${said('Неделю два-три раза проверяем все машины; видим — два-три дня не платит, заходим в разные программы GPS и отключаем','Теперь — каждый день в 21:00, сами, из одного окна.')}`};

/* Правила */
let RULES={time:'21:00',grace:30,warn:true,partial:true,fines:false,fineDays:10};
SC.rules=()=>`<div class="hd"><div><h2>Правила блокировки</h2><p>Вы задаёте правила один раз — дальше система работает без людей. Исключения (ДТП, болезнь, договорённость) менеджер ставит в карточке машины, с комментарием.</p></div></div>
 <div class="pan">${[['warn','Предупредить водителя в WhatsApp, если оплаты нет к '+RULES.time],['partial','Частичная оплата — не блокировать, долг переносится на завтра'],['fines','Блокировать за неоплаченный штраф дольше '+RULES.fineDays+' дней']].map(r=>`<div class="kv"><span>${r[1]}</span><b><button class="bt sm ${RULES[r[0]]?'p':''}" onclick="RULES.${r[0]}=!RULES.${r[0]};toast('Правило ${RULES[r[0]]?'выключено':'включено'}.');render()">${RULES[r[0]]?'Включено':'Выключено'}</button></b></div>`).join('')}
  <div class="kv"><span>Время проверки оплаты</span><b>${RULES.time}</b></div><div class="kv"><span>Блокировка после предупреждения через</span><b>${RULES.grace} минут</b></div><div class="kv"><span>Разблокировка после оплаты</span><b>автоматически, 10–15 минут</b></div><div class="kv"><span>Блокировать только на стоянке (скорость 0)</span><b>да — безопасно для водителя</b></div></div>
 ${tip('Безопасность','Двигатель блокируется на следующей остановке, а не на ходу. Это настройка трекера; согласуем с поставщиками GPS.')}
 ${said('Если в 9 часов оплата не пришла — сразу блокируется без человеческого участия','Так и настроено: проверка в 21:00, блокировка в 21:30.')}`;

/* Реестр машин */
SC.cars=()=>{const cs=carsC();return `<div class="hd"><div><h2>Реестр машин</h2><p>Каждая машина: госномер, модель, город, собственная или в лизинге, GPS-сервис, ставка, текущий водитель, оплаты, ремонты, штрафы. От бюджетных до бизнес-седанов и электромобилей.</p></div>${citySw()}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Код</th><th>Госномер</th><th>Модель</th><th>Город</th><th>Владение</th><th class="r">Ставка</th><th>Водитель</th><th>Статус</th></tr></thead><tbody>${cs.map(c=>`<tr onclick="card('car','${c.id}')" style="cursor:pointer"><td class="mono">${c.id}</td><td><b>${c.p}</b></td><td>${c.m}</td><td>${CITY[c.c]}</td><td>${c.own}</td><td class="r">${tg(c.rate)}</td><td>${c.dr}</td><td>${stTag(c.st)}</td></tr>`).join('')}</tbody></table></div>
 <p class="mut" style="margin-top:8px">Показано ${cs.length} из ${TOT[city]} — в демо часть машин.</p></div>
 ${tip('Лизинг','По каждой машине — график лизингового платежа и когда она станет вашей. Видно, какие машины окупаются, а какие больше стоят в ремонте.')}`};

/* Ремонт */
let REP=[['058','Hyundai Elantra','ДТП · бампер, фара','Ждём запчасти',4,44000],['141','Kia Rio','Подвеска · стойки','В работе',1,8500],['077','Chevrolet Nexia','ТО 60 000 км','Готово',0,7000]];
SC.repair=()=>`<div class="hd"><div><h2>Ремонт и ДТП</h2><p>Машина сломалась — механик заводит ремонт: что случилось, какие запчасти купить, сколько стоит. Видно, сколько дней машина стоит и сколько аренды теряется. Задача — быстрее вернуть на линию.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Машина</th><th>Что случилось</th><th>Этап</th><th class="r">Дней</th><th class="r">Потеря аренды</th><th></th></tr></thead><tbody>${REP.map((r,i)=>`<tr class="${r[4]>=3?'rowwarn':''}"><td><b>№${r[0]}</b> ${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td class="r">${r[4]}</td><td class="r">${tg(r[4]*11000)}</td><td>${r[3]!=='Готово'?`<button class="bt p sm" onclick="repNext(${i})">Дальше</button>`:tag('на линию','ok')}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Запчасти по ремонту № 058</h3><div class="kv"><span>Бампер передний</span><b>32 000 ₸ · заказан</b></div><div class="kv"><span>Фара левая</span><b>12 000 ₸ · куплена</b></div><div class="kv"><span>Виновник ДТП</span><b>водитель · удержание по договору</b></div></div>
 <div class="pan"><h3>Ремонты за октябрь</h3>${bars([['ДТП',9,'9'],['Подвеска',7,'7'],['ТО',14,'14'],['Электрика',3,'3']])}</div></div>
 ${said('Если машина поломалась — в краткие сроки поставить обратно на линию')}`;
function repNext(i){const r=REP[i];const st=['Ждём запчасти','В работе','Готово'];r[3]=st[Math.min(st.indexOf(r[3])+1,2)];if(r[3]==='Готово'){r[4]=0;toast(`№${r[0]} готова — машина свободна, менеджер видит её в воронке водителей.`)}else toast(`№${r[0]}: «${r[3]}».`);render()}

/* Воронка водителей */
const DST=[['lead','Заявка'],['check','Проверка'],['deal','Условия'],['sign','Договор'],['give','Выдача машины'],['line','На линии'],['back','Возврат']];
let DRV=[
 {n:'Ержан С.',ph:'+7 701 *** 12 40',st:'lead',car:'',rate:0,c:'ast',src:'Instagram'},
 {n:'Марат К.',ph:'+7 777 *** 88 15',st:'check',car:'',rate:0,c:'ast',src:'Рекомендация'},
 {n:'Ильяс Н.',ph:'+7 705 *** 30 09',st:'deal',car:'063 · Kia K5',rate:13000,c:'ast',src:'OLX'},
 {n:'Арман Д.',ph:'+7 747 *** 61 77',st:'sign',car:'058 · Elantra',rate:11000,c:'ast',src:'Звонок'},
 {n:'Сакен У.',ph:'+7 702 *** 44 21',st:'give',car:'145 · Accent',rate:9000,c:'alm',src:'Instagram'},
 {n:'Ерлан К.',ph:'+7 701 *** 05 60',st:'line',car:'017 · Accent',rate:9000,c:'ast',src:'Рекомендация'},
 {n:'Канат Ж.',ph:'+7 708 *** 77 31',st:'back',car:'099 · Cobalt',rate:7500,c:'alm',src:'OLX'}
];
SC.dfunnel=()=>`<div class="hd"><div><h2>Воронка водителей</h2><p>От заявки до машины на линии: проверка документов, индивидуальные условия (ставка, залог, срок от двух месяцев), договор, выдача с фото и актом. Возврат — тоже этап: осмотр, удержания, залог. Нажмите на карточку — она перейдёт дальше.</p></div>${citySw()}</div>
 <div class="oxk" style="grid-template-columns:repeat(7,minmax(140px,1fr))">${DST.map(f=>`<div class="oxkc"><h4>${f[1]} <small>${DRV.filter(d=>d.st===f[0]&&inCity(d)).length}</small></h4>${DRV.filter(d=>d.st===f[0]&&inCity(d)).map(d=>`<div class="oxkt" onclick="drNext('${d.n}')"><b>${d.n}</b><span>${d.car||'машина не выбрана'}</span><small>${CITY[d.c]} · ${d.rate?tg(d.rate)+'/день':d.src}</small></div>`).join('')}</div>`).join('')}</div>
 ${said('С каждым водителем условия индивидуально: у одной машины 15 000, другой попросит скидку — сдадим за 13')}`;
function drNext(n){const d=DRV.find(x=>x.n===n);const i=DST.findIndex(f=>f[0]===d.st);if(i>=DST.length-1){toast(`${d.n}: машина возвращена, залог рассчитан.`);return}d.st=DST[i+1][0];if(d.st==='deal'&&!d.car){d.car='063 · Kia K5';d.rate=13000}
 toast(`${d.n} → «${DST[i+1][1]}».`+(d.st==='sign'?' Договор собран с индивидуальной ставкой — выберите способ подписи в «Договорах».':d.st==='line'?' Машине присвоен водитель, код оплаты отправлен в WhatsApp.':d.st==='check'?' Проверка: удостоверение, стаж, штрафы, судебные исполнители.':''));render()}

/* Водители */
SC.drivers=()=>`<div class="hd"><div><h2>Водители</h2><p>Карточка водителя: документы, машина, ставка, история оплат, долги, штрафы и заявление о переводе штрафов на его ИИН, переписка WhatsApp. Водитель меняется — история машины остаётся.</p></div>${citySw()}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Водитель</th><th>Машина</th><th>Город</th><th class="r">Ставка</th><th>Договор</th><th>Штрафы</th><th>Оплаты за 30 дней</th></tr></thead><tbody>${CARS.filter(c=>c.dr!=='—'&&inCity(c)).map((c,i)=>`<tr onclick="card('drv','${c.id}')" style="cursor:pointer"><td><b>${c.dr}</b></td><td>№${c.id} · ${c.p}</td><td>${CITY[c.c]}</td><td class="r">${tg(c.rate)}</td><td>${i%3===1?tag('бумага · скан','warn'):tag('ЭЦП','ok')}</td><td>${i%4===2?tag('2 не оплачено','bad'):'—'}</td><td>${c.st==='line'?'30 из 30':c.st==='debt'?'27 из 30':'24 из 30'}</td></tr>`).join('')}</tbody></table></div></div>`;
CARD.drv=id=>{const c=CARS.find(x=>x.id===id);return [c.dr,`Водитель · машина №${c.id} · ${CITY[c.c]}`,`<div class="kv"><span>Удостоверение</span><b>проверено · стаж 6 лет</b></div><div class="kv"><span>Договор аренды</span><b>№ ДА-${c.id}-26 · от 2 месяцев</b></div><div class="kv"><span>Ставка</span><b>${tg(c.rate)} в день</b></div><div class="kv"><span>Залог</span><b>${tg(50000)}</b></div><div class="kv"><span>Заявление о переводе штрафов на ИИН</span><b>подписано при выдаче</b></div><div class="kv"><span>Долг</span><b>${c.debt?tg(c.debt):'нет'}</b></div>
 <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="bt p" onclick="act('Шаблон «Напоминание об оплате» ушёл в WhatsApp.')">Написать в WhatsApp</button><button class="bt" onclick="closeM();go('contracts')">Договор</button></div>`]};

/* Договоры */
let CTR=[['ДА-063-26','Ильяс Н.','063 · Kia K5',13000,'ast','new'],['ДА-058-26','Арман Д.','058 · Elantra',11000,'ast','sent'],['ДА-145-26','Сакен У.','145 · Accent',9000,'alm','paper'],['ДА-017-26','Ерлан К.','017 · Accent',9000,'ast','ecp']];
const CTS={new:['Черновик',''],sent:['Ссылка отправлена','info'],ecp:['Подписан ЭЦП / eGov','ok'],paper:['Бумага · скан в архиве','warn']};
SC.contracts=()=>`<div class="hd"><div><h2>Договоры: ЭЦП, eGov, бумага</h2><p>Договор собирается из карточки водителя: машина, ставка, залог, срок, юрлицо своего города, заявление о переводе штрафов на ИИН. Подписать можно по ссылке — ЭЦП или eGov Mobile, — а если у водителя нет ЭЦП, печатаем и храним скан. Два реестра: электронные и бумажные.</p></div>${citySw()}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Номер</th><th>Водитель</th><th>Машина</th><th class="r">Ставка</th><th>Город</th><th>Подписание</th><th></th></tr></thead><tbody>${CTR.filter(r=>city==='all'||r[4]===city).map((r,i)=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td class="r">${tg(r[3])}</td><td>${CITY[r[4]]}</td><td>${tag(CTS[r[5]][0],CTS[r[5]][1])}</td><td>${r[5]==='new'?`<button class="bt p sm" onclick="card('sign','${r[0]}')">Подписать</button>`:r[5]==='sent'?`<button class="bt sm" onclick="signed('${r[0]}')">Показать: подписал</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Реестр электронных</h3><div class="kv"><span>Подписано ЭЦП и eGov Mobile</span><b>148</b></div><div class="kv"><span>Ждут подписи</span><b>3</b></div></div><div class="pan"><h3>Реестр бумажных</h3><div class="kv"><span>Подписано на бумаге, скан в карточке</span><b>61</b></div><div class="kv"><span>Оригинал в папке</span><b>полка и номер папки</b></div></div></div>
 ${said('Оставить возможность подписать электронно, а если у человека нет ЭЦП — распечатать и получить ручную подпись')}`;
CARD.sign=n=>{const r=CTR.find(x=>x[0]===n);return ['Подписание · '+r[0],r[1]+' · '+r[2]+' · '+tg(r[3])+' в день',`<p>Как подписывает водитель?</p><div style="display:grid;gap:8px">${[['ecp','ЭЦП по ссылке','ссылка уходит в WhatsApp, подпись NCALayer или eGov Mobile'],['egov','eGov Mobile','QR на экране менеджера — водитель сканирует'],['paper','На бумаге','печатаем, подписывает ручкой, менеджер загружает скан']].map(x=>`<button class="bt" style="text-align:left" onclick="signHow('${n}','${x[0]}')"><b>${x[1]}</b><br><small>${x[2]}</small></button>`).join('')}</div>`]};
function signHow(n,w){const r=CTR.find(x=>x[0]===n);r[5]=w==='paper'?'paper':'sent';closeM();toast(w==='paper'?`${n}: договор распечатан. Загрузите скан — он ляжет в реестр бумажных.`:`${n}: ссылка на подписание ушла ${r[1]} в WhatsApp.`);render()}
function signed(n){const r=CTR.find(x=>x[0]===n);r[5]='ecp';toast(`${n} подписан. Подписанный PDF — в карточке водителя и в реестре электронных.`);render()}
/* Штрафы */
let FINES=[
 {id:'ШТ-2291',car:'024',dr:'Азамат Т.',what:'Превышение скорости на 22 км/ч · пр. Туран',d:'27.10 23:41',sum:29525,st:'sent',c:'ast'},
 {id:'ШТ-2290',car:'119',dr:'Айдос Р.',what:'Проезд на красный · ул. Абая — Байзакова',d:'27.10 18:05',sum:59050,st:'new',c:'alm'},
 {id:'ШТ-2287',car:'031',dr:'Бауыржан С.',what:'Превышение на 15 км/ч · ш. Алаш',d:'21.10 09:12',sum:14763,st:'iin',c:'ast'},
 {id:'ШТ-2281',car:'127',dr:'Максат Е.',what:'Стоянка в запрещённом месте',d:'14.10 13:30',sum:14763,st:'over',c:'alm'},
 {id:'ШТ-2276',car:'046',dr:'Данияр М.',what:'Превышение на 12 км/ч · пр. Кабанбай батыра',d:'11.10 22:48',sum:8858,st:'paid',c:'ast'}
];
const FS={new:['Новый — протокол не отправлен','warn'],sent:['Протокол у водителя','info'],over:['Не оплачен > 10 дней','bad'],iin:['Перевод на ИИН подан','violet'],paid:['Оплачен','ok']};
SC.fines=()=>{const fs=FINES.filter(inCity);return `<div class="hd"><div><h2>Штрафы по камерам</h2><p>Каждое утро в 9:00 система проверяет штрафы по госномеру и номеру техпаспорта каждой машины. Новый штраф сразу ставится на водителя, который был за рулём в это время, протокол уходит ему в WhatsApp. Дальше система следит за оплатой; не оплатил — заявление о переводе на ИИН или блокировка по правилу.</p></div>${citySw()}</div>
 <div class="wid"><div><small>Новых за ночь</small><b class="a">5</b><span>проверка в 9:00</span></div><div><small>Не оплачены</small><b>${fs.filter(f=>f.st!=='paid').length+18}</b><span>на сумму ${tg(412000)}</span></div><div><small>Переведено на ИИН за месяц</small><b>14</b><span>штраф не на компании</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Штраф</th><th>Машина · водитель</th><th>Нарушение</th><th>Когда</th><th class="r">Сумма</th><th>Статус</th><th></th></tr></thead><tbody>${fs.map(f=>`<tr class="${f.st==='over'?'rowwarn':''}"><td class="mono">${f.id}</td><td><b>№${f.car}</b> · ${f.dr}</td><td>${f.what}</td><td>${f.d}</td><td class="r">${tg(f.sum)}</td><td>${tag(FS[f.st][0],FS[f.st][1])}</td><td>${f.st==='new'?`<button class="bt p sm" onclick="fineSend('${f.id}')">Протокол в WhatsApp</button>`:f.st==='over'?`<button class="bt p sm" onclick="fineIin('${f.id}')">Перевести на ИИН</button>`:f.st==='sent'?`<button class="bt sm" onclick="finePaid('${f.id}')">Показать: оплатил</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Кто был за рулём','Штраф сопоставляется с водителем по дате и времени нарушения и периоду аренды машины — даже если водитель уже сменился.')}
 ${said('Головная боль — штрафы по камерам: выгружаем вручную, протокол скачиваем и отправляем водителю в WhatsApp, потом перекидываем на ИИН через заявление')}`};
function fineSend(id){const f=FINES.find(x=>x.id===id);f.st='sent';toast(`${f.dr}: в WhatsApp ушёл протокол ${f.id} (PDF), сумма ${tg(f.sum)}, срок оплаты со скидкой 50 % — 7 дней. Вопросов «где, когда, какой штраф» больше нет.`);render()}
function fineIin(id){const f=FINES.find(x=>x.id===id);f.st='iin';toast(`${f.id}: собран пакет — протокол, договор аренды, заявление водителя о переводе на ИИН. Юристу осталось подать его в «Комкор» под ЭЦП компании.`);render()}
function finePaid(id){const f=FINES.find(x=>x.id===id);f.st='paid';toast(`${f.id} оплачен — проверка в 9:00 подтвердила, что штраф закрыт.`);render()}

/* Робот */
SC.robot=()=>`<div class="hd"><div><h2>Сбор штрафов: робот</h2><p>Два пути. Если государственный сервис даст доступ через Smart Bridge за разумные деньги — подключаемся официально. Если нет — робот на облачном сервере сам заходит на портал проверки штрафов, вводит госномер и техпаспорт по каждой машине, скачивает новые протоколы и разносит их в систему.</p></div></div>
 <div class="g2"><div class="pan"><h3>Вариант А · официально</h3><div class="kv"><span>Сервис</span><b>Smart Bridge · «поиск штрафов ЕРАП»</b></div><div class="kv"><span>Запрос</span><b>госномер + номер техпаспорта</b></div><div class="kv"><span>Стоимость</span><b>уточняем у оператора</b></div><div class="kv"><span>Плюс</span><b>самый надёжный путь</b></div></div>
 <div class="pan"><h3>Вариант Б · робот</h3><div class="kv"><span>Где работает</span><b>облачный сервер, ≈ 30 € в месяц</b></div><div class="kv"><span>Когда</span><b>каждый день 9:00</b></div><div class="kv"><span>ИИ-агент</span><b>≈ 10–15 $ в месяц</b></div><div class="kv"><span>Плюс</span><b>не нужен ничей компьютер</b></div></div></div>
 <div class="pan"><h3>Сегодня, 9:00 — журнал робота</h3>${[['09:00','Старт: 216 машин в очереди'],['09:14','Проверено 124 машины Астаны · новых штрафов 3'],['09:26','Проверено 92 машины Алматы · новых штрафов 2'],['09:27','5 протоколов скачано и привязано к водителям'],['09:28','Протоколы отправлены водителям в WhatsApp']].map(r=>`<div class="kv"><span class="mono">${r[0]}</span><b style="font-weight:500">${r[1]}</b></div>`).join('')}
 <div style="margin-top:10px"><button class="bt p" onclick="robotRun()">Запустить проверку сейчас</button></div></div>
 ${said('Сторонние сервисы просят 2 500–3 000 ₸ за машину в месяц — на 200 машин это 600 тысяч, мне легче сотрудника нанять','Робот или Smart Bridge — десятки долларов в месяц на весь парк, без оплаты за машину.')}`;
function robotRun(){toast('Робот запущен: 216 машин, около 25 минут. Новые штрафы появятся в «Штрафах по камерам», протоколы уйдут водителям сами.')}

/* WhatsApp */
let WAT=[['Оплата не поступила','Оплата за сегодня не поступила. Оплатите по коду машины {код} до 21:30, иначе машина будет заблокирована.','21:00 · автоматически'],['Оплата получена','Оплата {сумма} получена, аренда продлена до {дата} 21:00. Спасибо!','после каждой оплаты'],['Новый штраф','Новый штраф по машине {код}: {нарушение}, {сумма}. Протокол во вложении. Со скидкой 50 % — 7 дней.','утром, если штраф новый'],['Машина заблокирована','Машина заблокирована за неоплату. Долг {сумма}. Оплатите — разблокировка автоматически.','при блокировке']];
SC.wa=()=>`<div class="hd"><div><h2>WhatsApp-рассылки</h2><p>Системные сообщения водителям — с номера своего города: астанинские водители получают сообщения с астанинского номера, алматинские — с алматинского. Водитель отвечает — переписка ложится в его карточку, менеджер отвечает из системы.</p></div>${citySw()}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Шаблон</th><th>Текст</th><th>Когда уходит</th></tr></thead><tbody>${WAT.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
 <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="bt p" onclick="act('Рассылка «Оплата не поступила» ушла 9 водителям ${city==='alm'?'Алматы':'Астаны'} с номера своего города.')">Отправить должникам ${city==='alm'?'Алматы':'Астаны'}</button><button class="bt" onclick="act('Новый шаблон: название, текст с полями {код}, {сумма}, {дата}.')">+ Шаблон</button></div></div>
 <div class="g2"><div class="pan"><h3>Канал</h3><div class="kv"><span>Подключение</span><b>Green API</b></div><div class="kv"><span>Стоимость</span><b>≈ 5 000 ₸ в месяц за номер</b></div><div class="kv"><span>Вместо</span><b>36 000 ₸ в месяц у официальных провайдеров</b></div><div class="kv"><span>Номеров</span><b>2 — Астана и Алматы</b></div></div>
 <div class="pan"><h3>Ответы водителей сегодня</h3><div class="rf" onclick="card('car','024')"><i></i><div><b>Азамат Т. · №024</b><span>«Брат, завтра утром закину, сегодня мало заказов»</span></div></div><div class="rf" onclick="card('car','031')"><i></i><div><b>Бауыржан С. · №031</b><span>«Разблокируйте, оплачу половину сейчас»</span></div></div></div></div>
 ${said('Мы пишем, что такая-то задолженность, они начинают возражать, обсуждать — то есть отвечают в любом случае')}`;

/* Интеграции */
SC.integr=()=>`<div class="hd"><div><h2>Интеграции</h2><p>Что подключаем на старте, через что и сколько это стоит в месяц. Все платные сервисы — по тарифам владельцев, напрямую на вас.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Что</th><th>Как</th><th>В месяц</th></tr></thead><tbody>${[['Оплаты аренды','Каспий Платежи с кодом машины → письма-подтверждения на почту → разбор','0 ₸'],['GPS лизингодателя','API трекера: координаты, скорость, блокировка','по договору лизинга'],['Свои GPS-трекеры','API трекера: координаты, скорость, блокировка','текущий тариф'],['Штрафы','Smart Bridge (официально) или робот на облачном сервере','≈ 30 € + 10–15 $'],['WhatsApp','Green API, номер на каждый город','≈ 5 000 ₸ за номер'],['Подписание','ЭЦП (NCALayer) и eGov Mobile по ссылке','0 ₸'],['Сервер','облачный сервер на ваше имя','≈ 15–30 $']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Каспий-API','Если позже найдём партнёра с API Каспия по фиксированной цене (≈ 10 000 ₸ в месяц, без процента от оборота), подключим — оплаты будут приходить мгновенно, а не через письма.')}
 ${said('Ребята просили 3 % от оборота — с 30 миллионов это 900 тысяч в месяц; я так платить не готов')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Стандартный пакет разработки и второй город с отдельной базой, номером WhatsApp и юрлицом в договорах. Система ваша: код, ключи и сервер — у вас, без абонплаты.</p></div></div>
 <div class="pk1"><div><small>Пакет + второй город</small><b>2 875 000 ₸</b><span>2 500 000 ₸ + 15 % за филиал (375 000 ₸)</span></div><div><small>Срок</small><b>4–6 недель</b><span>первая версия через 7–10 дней</span></div></div>
 <div class="pay3"><div><small>1 · Старт · 10%</small><b>287 500 ₸</b><span>поднимаем интеграции: GPS, Каспий, WhatsApp</span></div><div><small>2 · Первая версия · 45%</small><b>1 293 750 ₸</b><span>всё обговорённое работает на сервере, вы утвердили</span></div><div><small>3 · Полировка и сдача · 45%</small><b>1 293 750 ₸</b><span>договоры, воронки, кнопки, отчёты; ключи и код — ваши</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['Ежедневные оплаты и автоблокировка','Карта и реестр машин из двух GPS-сервисов','Воронка водителей, договоры ЭЦП / eGov / бумага','Штрафы: сбор, протокол в WhatsApp, перевод на ИИН','Ремонт и ДТП','Астана и Алматы: раздельные базы, номера, юрлица','3 месяца сопровождения после сдачи'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Отдельно, напрямую владельцам</h3><div class="kv"><span>WhatsApp (Green API)</span><b>≈ 5 000 ₸ в месяц за номер</b></div><div class="kv"><span>Сервер</span><b>≈ 15–30 $ в месяц</b></div><div class="kv"><span>Робот штрафов</span><b>≈ 30 € + 10–15 $ в месяц</b></div><div class="kv"><span>Smart Bridge</span><b>по тарифу, если выберем</b></div><div class="kv"><span>Доработки после сдачи</span><b>20 $ в час</b></div></div></div>
 ${tip('Сравните','Готовые решения на рынке — 2 500–3 000 ₸ за машину в месяц плюс до 3 % от оборота за оплаты. На 216 машинах это больше 1,5 млн ₸ каждый месяц. Здесь — один раз.')}`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const c=CARS.find(x=>(x.id+x.p+x.m+x.dr).toLowerCase().includes(v));if(c&&v){if(!allowed('cars')){toast('Нет доступа к реестру машин.');return}go('cars');card('car',c.id);return}toast('Ищите по коду, госномеру, модели или водителю: «031», «ABK», «Camry», «Ерлан».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Управляющий';city=role==='Менеджер парка'?'ast':'all';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;city=role==='Менеджер парка'?'ast':'all';document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ДРАЙВ АРЕНДА</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='debt'?'<em>'+CARS.filter(c=>c.st==='debt'||c.st==='block').length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['map','Карта'],['pays','Оплаты'],['debt','Долги'],['fines','Штрафы'],['repair','Ремонт']].filter(x=>allowed(x[0])).slice(0,5).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ДРАЙВ АРЕНДА';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: машины на линии, оплаты сегодня, должники, штрафы.'],
 ['pays','2 · Оплата в Каспий Платежах по коду машины — продление на сутки само.'],
 ['debt','3 · Не оплатил к 21:00 — блокировка через GPS без людей.'],
 ['map','4 · Все машины на карте из двух GPS-сервисов.'],
 ['dfunnel','5 · Воронка водителей с индивидуальной ставкой.'],
 ['contracts','6 · Договор: ЭЦП, eGov Mobile или бумага со сканом.'],
 ['fines','7 · Штрафы каждое утро — протокол водителю в WhatsApp.'],
 ['branches','8 · Астана и Алматы: раздельные базы и номера.'],
 ['launch','9 · 2 875 000 ₸, 4–6 недель, без абонплаты.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
