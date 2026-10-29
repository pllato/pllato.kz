/* ГРУЗДЕТАЛЬ — единая система магазина запчастей для самосвалов и грузовиков вместо 20 групп WhatsApp и бумажных накладных: продажа с телефона (фото, артикул, цена, оплата), журнал оплат QR / наличные / безнал, долги клиентов, электронные накладные, клиенты и кэшбэк, каталог 1000+ позиций по маркам, остатки, приход контейнеров и инвентаризация, закуп, сайт с каталогом, выгрузка в 1С, пульт владельца. Название, клиенты, запчасти и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='30.10.2026',NOW='12:40';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8l36 21v42L50 92 14 71V29z" fill="currentColor"/><circle cx="50" cy="50" r="15" fill="var(--brand2,#d9661a)"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;
const TC={ok:'g',warn:'w',bad:'r',info:'i',violet:'v'};
const tag=(t,c)=>`<span class="tag ${TC[c]||c||''}">${t}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const PART='<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><rect x="1" y="1" width="38" height="38" rx="7" fill="var(--card3)"/><circle cx="20" cy="20" r="9" fill="none" stroke="var(--brand2)" stroke-width="3"/><circle cx="20" cy="20" r="3" fill="var(--brand)"/></svg>';
const SC={},CARD={};
const SEC=[
 {k:'top',n:'Владельцу',sub:[['dash','Пульт'],['money','Журнал оплат']]},
 {k:'sl',n:'Продажи',sub:[['groups','Продажи вместо групп'],['orders','Заказы клиентов'],['clients','Клиенты и кэшбэк']]},
 {k:'dt',n:'Долги',sub:[['debts','Долги клиентов'],['nakl','Накладные']]},
 {k:'wh',n:'Склад',sub:[['catalog','Каталог и прайс'],['stock','Остатки'],['income','Приход контейнеров'],['inv','Инвентаризация']]},
 {k:'buy',n:'Закуп',sub:[['purchase','Что заказать']]},
 {k:'sys',n:'Внедрение',sub:[['site','Сайт с каталогом'],['launch','Стоимость и этапы']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Владелец':{av:'ВЛ',n:'Старший брат',note:'Всё: продажи, долги, склад, закуп, деньги',s:ALL.slice()},
 'Закуп':{av:'СН',n:'Султан',note:'Остатки, закуп, приход контейнеров, каталог',s:['purchase','income','stock','catalog','dash','money']},
 'Оператор продаж':{av:'ОП',n:'Продажи и оплаты',note:'Продажи, заказы, журнал оплат, клиенты',s:['groups','orders','money','clients','catalog','stock']},
 'Оператор по долгам':{av:'ОД',n:'Долги',note:'Долги клиентов, накладные, напоминания',s:['debts','nakl','clients']},
 'Склад':{av:'СК',n:'Кладовщик',note:'Приход, остатки, инвентаризация',s:['income','stock','inv','catalog']}
};
let role='Владелец',cur='dash',theme='light';

/* Данные */
let CAT=[
 {a:'SH-2911-05',n:'Рессора передняя 10 листов',m:'Shacman F3000',pr:186000,c:121000,q:14,min:6,cell:'А-02'},
 {a:'HW-0420-11',n:'Колодки тормозные задние, к-т',m:'HOWO A7',pr:24500,c:14200,q:62,min:30,cell:'Б-14'},
 {a:'FW-1105-02',n:'Фильтр топливный тонкой очистки',m:'FAW J6',pr:6800,c:3100,q:9,min:40,cell:'В-03'},
 {a:'KM-5511-07',n:'Крестовина карданного вала',m:'КамАЗ 6520',pr:12900,c:6800,q:31,min:20,cell:'Б-06'},
 {a:'SH-3104-01',n:'Ступица задняя в сборе',m:'Shacman X3000',pr:148000,c:96000,q:3,min:4,cell:'А-09'},
 {a:'HW-8500-30',n:'Гидроцилиндр подъёма кузова',m:'HOWO ZZ3257',pr:612000,c:418000,q:2,min:1,cell:'Д-01'},
 {a:'UN-M16-80',n:'Болт стремянки М16×80 с гайкой',m:'универсальный',pr:850,c:310,q:1240,min:400,cell:'Г-21'},
 {a:'UN-W16',n:'Шайба гроверная 16',m:'универсальная',pr:60,c:18,q:3800,min:1000,cell:'Г-22'}
];
let CL=[['ТОО «КарьерСтрой»','+7 701 *** 44 10','Золото',38,9640000,96400,1820000],['Ерлан (водитель Shacman)','+7 747 *** 12 93','Серебро',14,1260000,25200,0],['ИП «Самосвал-Транс»','+7 705 *** 70 51','Золото',27,6310000,63100,940000],['ТОО «ДорМехСервис»','+7 777 *** 08 32','Серебро',9,2180000,21800,610000],['Бауыржан (частник HOWO)','+7 702 *** 61 77','Новый',1,49000,490,0]];
let PAYS=[['12:31','Ерлан (водитель Shacman)','Колодки HW-0420-11 × 2','qr',49000],['12:18','ТОО «КарьерСтрой»','Рессора SH-2911-05','debt',186000],['11:56','Частный клиент','Крестовина KM-5511-07 × 3','cash',38700],['11:40','ТОО «ДорМехСервис»','Гидроцилиндр HW-8500-30','bank',612000],['11:12','ИП «Самосвал-Транс»','Болты М16 × 40, шайбы × 40','debt',36400]];
const PT={qr:['Kaspi QR','info'],cash:['наличные','ok'],bank:['безнал','violet'],debt:['в долг','warn']};

/* Пульт */
SC.dash=()=>`<div class="hd"><div><h2>Пульт владельца · ${TODAY}</h2><p>Всё, что сейчас разбросано по 20 группам и бумажным журналам: продажи за день, деньги по видам оплаты, кто сколько должен, что заканчивается на складе. Цифры собираются сами из продаж, оплат и склада.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('groups')"><small>Продажи сегодня</small><b class="a">${tg(PAYS.reduce((t,p)=>t+p[4],0)+1460000)}</b><span>${PAYS.length+19} продаж</span></div>
  <div class="clk" onclick="go('money')"><small>Пришло денег</small><b class="g">${tg(1810000)}</b><span>QR · наличные · безнал</span></div>
  <div class="clk" onclick="go('debts')"><small>Должны клиенты</small><b class="r">${tg(CL.reduce((t,c)=>t+c[6],0))}</b><span>просрочено ${tg(1550000)}</span></div>
  <div class="clk" onclick="go('stock')"><small>Заканчивается</small><b>${CAT.filter(p=>p.q<p.min).length} позиции</b><span>ниже минимума</span></div>
  <div class="clk" onclick="go('income')"><small>Контейнеры в пути</small><b>3</b><span>ближайший — 04.11</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Продажи за октябрь по маркам</h3>${bars([['Shacman',14200000,'14,2 млн'],['HOWO',11800000,'11,8 млн'],['FAW',5400000,'5,4 млн'],['КамАЗ',3900000,'3,9 млн'],['Метизы и расходники',2100000,'2,1 млн']])}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('debts')"><i></i><div><b>ТОО «КарьерСтрой» — долг 1 820 000 ₸, просрочка 12 дней</b><span>лимит долга превышен — новые отгрузки в долг заблокированы</span></div></div>
  <div class="rf" onclick="go('stock')"><i></i><div><b>Фильтр топливный FW-1105-02 — 9 шт. при минимуме 40</b><span>уходит 25 шт. в неделю — в закуп</span></div></div>
  <div class="rf" onclick="go('money')"><i></i><div><b>Безнал 612 000 ₸ от ДорМехСервис не подтверждён банком</b><span>сверка выписки в 17:00</span></div></div>
  <div class="rf" onclick="go('inv')"><i></i><div><b>Расхождение по инвентаризации — ступица SH-3104-01</b><span>по учёту 4, по факту 3</span></div></div>
 </div></div>
 ${said('Бухгалтерию ведём в 1С, но там видит только бухгалтер. У нас по всем — ничего нет','Пульт для владельца: продажи, деньги, долги и склад — каждый день, без звонков и групп.')}`;

/* Журнал оплат */
SC.money=()=>`<div class="hd"><div><h2>Журнал оплат</h2><p>Раньше один человек следил за группами и переписывал оплаты в журнал. Теперь журнал ведётся сам: продавец при продаже отмечает вид оплаты, Kaspi QR и безнал сверяются с выпиской, наличные — с кассой в конце дня.</p></div></div>
 <div class="wid">${Object.entries(PT).map(([k,v])=>`<div><small>${v[0]}</small><b>${tg(PAYS.filter(p=>p[3]===k).reduce((t,p)=>t+p[4],0))}</b><span>${PAYS.filter(p=>p[3]===k).length} продаж сегодня</span></div>`).join('')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Клиент</th><th>Что</th><th>Оплата</th><th class="r">Сумма</th><th></th></tr></thead><tbody>${PAYS.map((p,i)=>`<tr><td class="mono">${p[0]}</td><td><b>${p[1]}</b></td><td>${p[2]}</td><td>${tag(PT[p[3]][0],PT[p[3]][1])}</td><td class="r"><b>${tg(p[4])}</b></td><td>${p[3]==='bank'?`<button class="bt sm" onclick="bankOk(${i})">Сверить с банком</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Сверка','Выписку Kaspi и банка загружаем раз в день — система сама находит платежи по сумме и клиенту. Несошедшиеся видны сразу.')}`;
function bankOk(i){toast(`${PAYS[i][1]}: ${tg(PAYS[i][4])} найден в выписке банка. Оплата подтверждена.`);PAYS[i][3]='bank';render()}

/* Продажи вместо групп */
SC.groups=()=>`<div class="hd"><div><h2>Продажи вместо групп</h2><p>Было: продавец фотографирует запчасть, кидает фото и цену в одну из 20 групп, оператор переписывает в журнал. Стало: продавец оформляет продажу с телефона — фото, артикул из каталога, цена, оплата. Склад, журнал оплат и долг клиента обновляются сами.</p></div></div>
 <div class="g2"><div class="pan"><h3>Новая продажа · с телефона</h3>
  <div class="kv"><span>Фото</span><b>${PART} снято с телефона</b></div>
  <div class="kv"><span>Запчасть</span><b>${SALE.p.n} · ${SALE.p.a}</b></div>
  <div class="kv"><span>Марка</span><b>${SALE.p.m}</b></div>
  <div class="kv"><span>Количество</span><b><button class="bt sm" onclick="saleQ(-1)">−</button> ${SALE.q} <button class="bt sm" onclick="saleQ(1)">+</button></b></div>
  <div class="kv"><span>Клиент</span><b>${SALE.c}</b></div>
  <div class="kv"><span>Сумма</span><b>${tg(SALE.p.pr*SALE.q)}</b></div>
  <div class="dpcity" style="margin-top:10px">${Object.entries(PT).map(([k,v])=>`<button class="${SALE.t===k?'on':''}" onclick="SALE.t='${k}';render()">${v[0]}</button>`).join('')}</div>
  <div style="margin-top:12px"><button class="bt p" onclick="saleGo()">Оформить продажу</button></div></div>
 <div class="pan"><h3>Лента продаж · вместо 20 групп</h3>${PAYS.map(p=>`<div class="kv"><span>${p[0]} · ${p[1]}<br><small class="mut">${p[2]}</small></span><b>${tg(p[4])} ${tag(PT[p[3]][0],PT[p[3]][1])}</b></div>`).join('')}</div></div>
 ${tip('Группы можно оставить','Если продавцам привычнее группы — подключим их через WhatsApp: сообщение «фото + цена» станет черновиком продажи, оператор только подтверждает. Переписывать в журнал больше не нужно.')}
 ${said('Мы фотографируем запчасть, высылаем в группу и пишем цену. Один человек следит за группами и пишет журнал оплаты')}`;
let SALE={p:CAT[1],q:2,c:'Бауыржан (частник HOWO)',t:'qr'};
function saleQ(d){SALE.q=Math.max(1,SALE.q+d);render()}
function saleGo(){const s=SALE;s.p.q-=s.q;PAYS.unshift([NOW,s.c,`${s.p.n.split(',')[0]} ${s.p.a} × ${s.q}`,s.t,s.p.pr*s.q]);if(s.t==='debt'){const c=CL.find(x=>x[0]===s.c);if(c)c[6]+=s.p.pr*s.q}toast(`Продано: ${s.p.a} × ${s.q} на ${tg(s.p.pr*s.q)} (${PT[s.t][0]}). Склад: осталось ${s.p.q} шт. Запись — в журнале оплат${s.t==='debt'?', долг клиента увеличен':''}.`);render()}
