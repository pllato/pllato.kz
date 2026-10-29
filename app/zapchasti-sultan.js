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

/* Заказы клиентов */
const FST=[['new','Запрос'],['find','Подбор'],['offer','Счёт отправлен'],['paid','Оплачен'],['ship','Отгружен']];
let DL=[
 {id:'З-1201',cl:'ТОО «КарьерСтрой»',it:'Рессоры Shacman × 4, стремянки × 16',st:'offer',sum:812000},
 {id:'З-1204',cl:'Ерлан (водитель Shacman)',it:'Ступица задняя — по VIN',st:'find',sum:0},
 {id:'З-1198',cl:'ИП «Самосвал-Транс»',it:'Фильтры FAW, 20 к-тов',st:'paid',sum:136000},
 {id:'З-1206',cl:'+7 771 *** 30 45',it:'Гидроцилиндр кузова HOWO — есть?',st:'new',sum:0},
 {id:'З-1190',cl:'ТОО «ДорМехСервис»',it:'Гидроцилиндр HW-8500-30',st:'ship',sum:612000}
];
SC.orders=()=>`<div class="hd"><div><h2>Заказы клиентов</h2><p>Крупные и сложные заказы: запрос (по фото, VIN или артикулу) → подбор по каталогу и остаткам → счёт → оплата → отгрузка с накладной. Нажмите на карточку — она перейдёт дальше.</p></div></div>
 <div class="oxk" style="grid-template-columns:repeat(5,minmax(150px,1fr))">${FST.map(f=>`<div class="oxkc"><h4>${f[1]} <small>${DL.filter(d=>d.st===f[0]).length}</small></h4>${DL.filter(d=>d.st===f[0]).map(d=>`<div class="oxkt" onclick="dNext('${d.id}')"><b>${d.cl}</b><span>${d.it}</span><small>${d.sum?tg(d.sum):'сумма после подбора'}</small></div>`).join('')}</div>`).join('')}</div>
 ${tip('Резерв под заказ','Подобранные запчасти резервируются на складе: их не продадут другому клиенту, пока заказ не оплачен или не отменён.')}`;
function dNext(id){const d=DL.find(x=>x.id===id);const i=FST.findIndex(f=>f[0]===d.st);if(i>=FST.length-1){toast(d.cl+': заказ отгружен, накладная подписана.');return}d.st=FST[i+1][0];if(!d.sum)d.sum=148000;toast(`${d.cl} → «${FST[i+1][1]}».`+(d.st==='offer'?' Счёт ушёл клиенту в WhatsApp.':d.st==='ship'?' Склад списан, накладная создана.':''));render()}

/* Клиенты и кэшбэк */
SC.clients=()=>`<div class="hd"><div><h2>Клиенты и кэшбэк</h2><p>Одна карточка на клиента: покупки, долг, лимит долга, кэшбэк, на какой технике ездит. Кэшбэк начисляется с каждой оплаченной покупки и списывается при следующей — клиенты возвращаются к вам.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Телефон</th><th>Уровень</th><th class="r">Покупок</th><th class="r">Сумма</th><th class="r">Кэшбэк</th><th class="r">Долг</th></tr></thead><tbody>${CL.map(r=>`<tr onclick="card('cl','${esc(r[0])}')" style="cursor:pointer"><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td>${tag(r[2],r[2]==='Золото'?'warn':r[2]==='Серебро'?'info':'')}</td><td class="r">${r[3]}</td><td class="r">${tg(r[4])}</td><td class="r">${fmt(r[5])}</td><td class="r">${r[6]?`<b class="r">${tg(r[6])}</b>`:'—'}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g3"><div class="pan"><h3>Новый</h3><div class="kv"><span>Кэшбэк</span><b>1 %</b></div></div><div class="pan"><h3>Серебро · от 1 млн ₸</h3><div class="kv"><span>Кэшбэк</span><b>2 %</b></div></div><div class="pan"><h3>Золото · от 5 млн ₸</h3><div class="kv"><span>Кэшбэк</span><b>3 % + отсрочка 30 дней</b></div></div></div>`;
CARD.cl=n=>{const r=CL.find(x=>x[0]===n);return [r[0],r[1]+' · '+r[2],`<div class="kv"><span>Техника</span><b>${r[0].indexOf('ТОО')===0?'Shacman × 12, HOWO × 6':'Shacman F3000'}</b></div><div class="kv"><span>Покупок</span><b>${r[3]} на ${tg(r[4])}</b></div><div class="kv"><span>Кэшбэк</span><b>${fmt(r[5])} ₸</b></div><div class="kv"><span>Долг</span><b>${r[6]?tg(r[6]):'нет'}</b></div><div class="kv"><span>Лимит долга</span><b>${r[2]==='Золото'?tg(1500000):r[2]==='Серебро'?tg(500000):'без долга'}</b></div>
 <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="bt p" onclick="act('Клиенту ушло в WhatsApp: «Пришёл контейнер — рессоры и ступицы Shacman в наличии».')">Написать в WhatsApp</button>${r[6]?`<button class="bt" onclick="closeM();go('debts')">Открыть долг</button>`:''}</div>`]};

/* Долги */
let DB=[['ТОО «КарьерСтрой»','Н-0884 · рессоры, стремянки',1820000,'18.10.2026',12],['ИП «Самосвал-Транс»','Н-0912 · болты, шайбы, фильтры',940000,'27.10.2026',3],['ТОО «ДорМехСервис»','Н-0897 · колодки, крестовины',610000,'02.11.2026',0]];
SC.debts=()=>`<div class="hd"><div><h2>Долги клиентов</h2><p>Раньше долги писали в отдельную группу и на бумажные накладные. Теперь продажа «в долг» сама создаёт долг с накладной и сроком. Видно, кто сколько должен и сколько дней просрочки. Клиенту уходят напоминания, при превышении лимита новая отгрузка в долг блокируется.</p></div></div>
 <div class="wid"><div><small>Всего должны</small><b class="r">${tg(DB.reduce((t,d)=>t+d[2],0))}</b><span>${DB.length} клиента</span></div><div><small>Просрочено</small><b>${tg(DB.filter(d=>d[4]>0).reduce((t,d)=>t+d[2],0))}</b><span>${DB.filter(d=>d[4]>0).length} клиента</span></div><div><small>Собрано за октябрь</small><b class="g">${tg(4870000)}</b><span>из долгов</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Накладная</th><th class="r">Долг</th><th>Срок</th><th>Просрочка</th><th></th></tr></thead><tbody>${DB.map((d,i)=>`<tr class="${d[4]>7?'rowwarn':''}"><td><b>${d[0]}</b></td><td>${d[1]}</td><td class="r"><b>${tg(d[2])}</b></td><td>${d[3]}</td><td>${d[4]?tag(d[4]+' дн.',d[4]>7?'bad':'warn'):tag('в срок','ok')}</td><td style="white-space:nowrap"><button class="bt sm" onclick="dbRem(${i})">Напомнить</button> <button class="bt sm" onclick="dbPay(${i})">Оплатил</button></td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Напоминания сами','За 3 дня до срока, в день срока и каждые 5 дней просрочки клиенту уходит сообщение в WhatsApp: сумма, накладная, Kaspi QR для оплаты.')}
 ${said('Вторая группа — по долгам: приходит клиент, кто в долг берёт, и один человек пишет на бумажную накладную','Долг, накладная и напоминания — в системе, без отдельной группы и бумаги.')}`;
function dbRem(i){toast(`${DB[i][0]}: ушло напоминание в WhatsApp — долг ${tg(DB[i][2])} по ${DB[i][1].split(' ·')[0]}, ссылка на Kaspi QR.`)}
function dbPay(i){const d=DB.splice(i,1)[0];const c=CL.find(x=>x[0]===d[0]);if(c)c[6]=0;toast(`${d[0]}: оплата ${tg(d[2])} принята, долг закрыт. Запись — в журнале оплат.`);render()}

/* Накладные */
let NK=[['Н-0915','30.10.2026','ТОО «КарьерСтрой»',186000,'долг','sign'],['Н-0914','30.10.2026','ТОО «ДорМехСервис»',612000,'безнал','ok'],['Н-0912','27.10.2026','ИП «Самосвал-Транс»',940000,'долг','ok'],['Н-0911','27.10.2026','Ерлан (водитель Shacman)',49000,'QR','ok']];
SC.nakl=()=>`<div class="hd"><div><h2>Накладные</h2><p>Накладная создаётся из продажи сама — без бумажного бланка. Клиент подписывает на телефоне продавца или получает PDF в WhatsApp. Все накладные клиента в одном месте, их видно в долге.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>№</th><th>Дата</th><th>Клиент</th><th class="r">Сумма</th><th>Оплата</th><th>Подпись</th><th></th></tr></thead><tbody>${NK.map((n,i)=>`<tr><td class="mono"><b>${n[0]}</b></td><td>${n[1]}</td><td>${n[2]}</td><td class="r">${tg(n[3])}</td><td>${n[4]}</td><td>${n[5]==='ok'?tag('подписана','ok'):tag('ждёт подписи','warn')}</td><td>${n[5]!=='ok'?`<button class="bt sm" onclick="nkSign(${i})">Подписал на телефоне</button>`:`<button class="bt sm" onclick="card('nk','${n[0]}')">Открыть</button>`}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Для бухгалтера','Накладные и оплаты выгружаются в 1С файлом — бухгалтер ничего не набирает заново.')}`;
function nkSign(i){NK[i][5]='ok';toast(`${NK[i][0]}: клиент расписался пальцем на телефоне. PDF ушёл ему в WhatsApp.`);render()}
CARD.nk=id=>{const n=NK.find(x=>x[0]===id);return ['Накладная '+n[0],n[1]+' · '+n[2],`<div class="tw"><table class="t"><thead><tr><th>Запчасть</th><th class="r">Кол-во</th><th class="r">Цена</th></tr></thead><tbody><tr><td>${CAT[0].n} · ${CAT[0].a}</td><td class="r">1</td><td class="r">${tg(CAT[0].pr)}</td></tr><tr><td>${CAT[6].n}</td><td class="r">4</td><td class="r">${tg(CAT[6].pr)}</td></tr></tbody></table></div><div class="kv"><span>Итого</span><b>${tg(n[3])}</b></div><div class="kv"><span>Оплата</span><b>${n[4]}</b></div>
 <div style="margin-top:12px"><button class="bt p" onclick="act('PDF накладной ушёл клиенту в WhatsApp.')">Отправить PDF клиенту</button></div>`]};

/* Каталог */
let BR='all';
SC.catalog=()=>`<div class="hd"><div><h2>Каталог и прайс</h2><p>Больше 1000 позиций — от кузова до шайбы. У каждой: артикул, фото, марка и модель самосвала, ячейка на складе, закупочная цена и цена продажи. Продавец находит запчасть по артикулу, названию или марке.</p></div><div class="dpcity">${['all','Shacman','HOWO','FAW','КамАЗ'].map(b=>`<button class="${BR===b?'on':''}" onclick="BR='${b}';render()">${b==='all'?'Все марки':b}</button>`).join('')}</div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th></th><th>Артикул</th><th>Запчасть</th><th>Марка</th><th>Ячейка</th><th class="r">Остаток</th><th class="r">Цена</th><th class="r">Наценка</th></tr></thead><tbody>${CAT.filter(p=>BR==='all'||p.m.indexOf(BR)===0).map(p=>`<tr><td>${PART}</td><td class="mono"><b>${p.a}</b></td><td>${p.n}</td><td>${p.m}</td><td class="mono">${p.cell}</td><td class="r">${fmt(p.q)}</td><td class="r"><b>${tg(p.pr)}</b></td><td class="r">${Math.round((p.pr/p.c-1)*100)} %</td></tr>`).join('')}</tbody></table></div></div>
 <div style="margin-top:4px"><button class="bt" onclick="act('Прайс выгружен в Excel и PDF — можно отправить оптовому клиенту.')">Выгрузить прайс для клиента</button> <button class="bt" onclick="act('Новые цены загружены из файла поставщика: 214 позиций обновлено, наценка пересчитана.')">Обновить цены из файла</button></div>`;

/* Остатки */
SC.stock=()=>`<div class="hd"><div><h2>Остатки</h2><p>Продажа списывает со склада сразу — по артикулу или штрихкоду. Видно, что ниже минимума, сколько уходит в неделю и на сколько хватит.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Артикул</th><th>Запчасть</th><th class="r">Остаток</th><th class="r">Минимум</th><th>Состояние</th><th></th></tr></thead><tbody>${CAT.map((p,i)=>{const low=p.q<p.min;return `<tr class="${low?'rowwarn':''}"><td class="mono">${p.a}</td><td><b>${p.n}</b><br><small class="mut">${p.m} · ${p.cell}</small></td><td class="r">${fmt(p.q)}</td><td class="r">${fmt(p.min)}</td><td>${low?tag('ниже минимума','bad'):tag('в норме','ok')}</td><td>${low?`<button class="bt sm" onclick="toBuy(${i})">В закуп</button>`:''}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="wid"><div><small>Позиций</small><b>1 186</b><span>в каталоге</span></div><div><small>Склад по закупу</small><b>${tg(184600000)}</b><span>замороженные деньги</span></div><div><small>Не продавалось 90 дней</small><b>${tg(11200000)}</b><span>142 позиции — в акцию</span></div></div>`;
function toBuy(i){const p=CAT[i];if(!BUY.find(b=>b[0]===p.a))BUY.unshift([p.a,p.n,p.m,p.min*2-p.q,p.c]);toast(`${p.a}: добавлено в закуп — ${p.min*2-p.q} шт.`);go('purchase')}

/* Приход контейнеров */
let CN=[['CN-14','HOWO и Shacman · ходовая, рессоры','Урумчи → Хоргос','04.11.2026','road'],['CN-15','FAW · фильтры, колодки, расходники','Урумчи → Хоргос','09.11.2026','road'],['CN-16','Гидроцилиндры, ступицы','Гуанчжоу','22.11.2026','sea'],['CN-13','Shacman · кузовные и метизы','получен 21.10.2026','21.10.2026','done']];
SC.income=()=>`<div class="hd"><div><h2>Приход контейнеров</h2><p>Каждый контейнер — с составом из инвойса поставщика: что едет, когда прибудет. При приходе склад принимает по списку, сканирует артикулы, расхождения видно сразу, себестоимость считается с доставкой и растаможкой.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Контейнер</th><th>Что везёт</th><th>Маршрут</th><th>Прибытие</th><th>Статус</th><th></th></tr></thead><tbody>${CN.map((c,i)=>`<tr><td class="mono"><b>${c[0]}</b></td><td>${c[1]}</td><td>${c[2]}</td><td>${c[3]}</td><td>${c[4]==='done'?tag('принят','ok'):c[4]==='sea'?tag('море','info'):tag('в пути','warn')}</td><td>${c[4]!=='done'?`<button class="bt sm" onclick="cnIn(${i})">Принять</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Себестоимость с доставкой · CN-13</h3><div class="kv"><span>Товар по инвойсу</span><b>${tg(21400000)}</b></div><div class="kv"><span>Доставка</span><b>${tg(2900000)}</b></div><div class="kv"><span>Растаможка и сборы</span><b>${tg(3100000)}</b></div><div class="kv"><span>Распределено по 312 позициям</span><b>+28 % к цене поставщика</b></div></div>
 <div class="pan"><h3>Как принимаем</h3><div class="kv"><span>Список из инвойса</span><b>загружается файлом</b></div><div class="kv"><span>Приёмка</span><b>сканируем артикулы с телефона</b></div><div class="kv"><span>Расхождения</span><b>акт для поставщика</b></div></div></div>`;
function cnIn(i){CN[i][4]='done';CN[i][2]='получен '+TODAY;CAT[0].q+=20;toast(`${CN[i][0]} принят: позиции оприходованы, расхождений 2 — акт для поставщика готов. Клиентам, кто ждал эти запчасти, ушло сообщение.`);render()}

/* Инвентаризация */
let INV=[['А-02','Рессора передняя SH-2911-05',14,14],['А-09','Ступица задняя SH-3104-01',4,3],['Б-14','Колодки HW-0420-11',62,62],['Г-21','Болт стремянки М16×80',1240,1228]];
SC.inv=()=>`<div class="hd"><div><h2>Инвентаризация</h2><p>Склад считают по ячейкам с телефона: сканируют артикул и вводят количество. Можно считать несколько человек сразу. Система сама сводит расхождения в акт.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Ячейка</th><th>Позиция</th><th class="r">По учёту</th><th class="r">По факту</th><th class="r">Разница</th></tr></thead><tbody>${INV.map(r=>`<tr class="${r[2]!==r[3]?'rowwarn':''}"><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td class="r">${fmt(r[2])}</td><td class="r">${fmt(r[3])}</td><td class="r">${r[2]===r[3]?'—':`<b class="r">${r[3]-r[2]}</b>`}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Кто считает сейчас</h3><div class="kv"><span>Кладовщик · ряды А, Б</span><b>212 из 340 ячеек</b></div><div class="kv"><span>Помощник · ряды В, Г</span><b>188 из 296 ячеек</b></div><div class="kv"><span>Продажи во время подсчёта</span><b>не останавливаем — система учтёт</b></div></div>
 <div class="pan"><h3>Итог прошлой инвентаризации · сентябрь</h3><div class="kv"><span>Недостача</span><b>${tg(412000)}</b></div><div class="kv"><span>Излишки</span><b>${tg(96000)}</b></div><div class="kv"><span>Больше всего расхождений</span><b>метизы, ряд Г</b></div></div></div>
 <div><button class="bt p" onclick="act('Акт инвентаризации сформирован: 2 расхождения на 160 200 ₸. Остатки исправлены, подпись владельца.')">Закрыть инвентаризацию</button></div>`;

/* Закуп */
let BUY=[['FW-1105-02','Фильтр топливный тонкой очистки','FAW J6',71,3100],['SH-3104-01','Ступица задняя в сборе','Shacman X3000',5,96000]];
SC.purchase=()=>`<div class="hd"><div><h2>Что заказать</h2><p>Система предлагает закуп сама: что ниже минимума, что быстро уходит, что ждут клиенты под заказ. Султан правит количество и собирает заказ поставщику в контейнер — с весом и суммой.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Артикул</th><th>Запчасть</th><th>Марка</th><th class="r">Заказать</th><th class="r">Цена закупа</th><th class="r">Сумма</th></tr></thead><tbody>${BUY.map(b=>`<tr><td class="mono">${b[0]}</td><td><b>${b[1]}</b></td><td>${b[2]}</td><td class="r">${fmt(b[3])}</td><td class="r">${tg(b[4])}</td><td class="r"><b>${tg(b[3]*b[4])}</b></td></tr>`).join('')}</tbody></table></div></div>
 <div class="wid"><div><small>Заказ поставщику</small><b>${tg(BUY.reduce((t,b)=>t+b[3]*b[4],0))}</b><span>${BUY.length} позиций</span></div><div><small>Заполнение контейнера</small><b>34 %</b><span>≈ 13,6 из 40 т</span></div><div><small>Ждут клиенты</small><b>6 заказов</b><span>под этот контейнер</span></div></div>
 <div><button class="bt p" onclick="act('Заказ поставщику сформирован: Excel на китайском и русском, артикулы поставщика подставлены. Контейнер CN-17 создан.')">Сформировать заказ поставщику</button></div>
 ${said('Закупом, наверное, я буду заниматься — я занимаюсь закупом','Закуп по данным: продажи, остатки, минимумы и заказы клиентов — в одном списке.')}`;

/* Сайт */
SC.site=()=>`<div class="hd"><div><h2>Сайт с каталогом</h2><p>Отдельно от системы, но связан с ней: каталог на сайте берёт наличие и цены прямо со склада, заявка с сайта сразу попадает в «Заказы клиентов». Клиент ищет по марке, модели или артикулу.</p></div></div>
 <div class="pan"><h3>Как это выглядит у клиента</h3><div class="kv"><span>Поиск</span><b>«ступица Shacman X3000» или артикул</b></div><div class="kv"><span>Карточка запчасти</span><b>фото, подходит к моделям, наличие, цена</b></div><div class="kv"><span>Заявка</span><b>в один клик → в воронку, ответ в WhatsApp</b></div><div class="kv"><span>Для оптовиков</span><b>вход с персональными ценами</b></div></div>
 <div class="pk1"><div><small>Сайт с каталогом</small><b>800 000 ₸</b><span>отдельно от пакета · связан со складом</span></div><div><small>Срок</small><b>вместе с системой</b><span>каталог — из той же базы</span></div></div>
 ${said('Сайта нет. Тоже нужен — чтобы каталог был и заявки могли оставлять')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Стандартный пакет разработки под ваш бизнес. Система ваша: код, сервер и данные у вас, без аренды и абонплаты. Пользователей — до 50.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>2 000 000 ₸</b><span>всё из демо, до 50 пользователей</span></div><div><small>Срок</small><b>≈ 6 недель</b><span>первая версия через 2–3 недели</span></div></div>
 <div class="pay3"><div><small>1 · Старт · 10%</small><b>200 000 ₸</b><span>поднимаем сервер, загружаем каталог и остатки</span></div><div><small>2 · Первая версия · 45%</small><b>900 000 ₸</b><span>продажи, оплаты, долги, склад работают — вы утвердили</span></div><div><small>3 · Сдача · 45%</small><b>900 000 ₸</b><span>закуп, контейнеры, кэшбэк, 1С; код и ключи — ваши</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['Продажи с телефона, журнал оплат','Долги, лимиты, напоминания, накладные','Заказы клиентов, клиенты и кэшбэк','Каталог 1000+ позиций, прайс, остатки','Приход контейнеров, инвентаризация, закуп','WhatsApp и телефония — внутри системы','Выгрузка бухгалтеру в 1С, поддержка после сдачи'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Отдельно</h3><div class="kv"><span>Сайт с каталогом</span><b>800 000 ₸</b></div><div class="kv"><span>WhatsApp (Green API)</span><b>≈ 5 000 ₸ в месяц</b></div><div class="kv"><span>Сервер</span><b>≈ 15–30 $ в месяц</b></div></div></div>
 ${tip('Работаем вместе','Разрабатываем этапами и согласовываем с вами каждый: показываем версию, вы правите. После сдачи поддерживаем — обычно обращаются 1–2 раза в год.')}`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const p=CAT.find(x=>(x.a+x.n+x.m).toLowerCase().includes(v));if(p&&v&&allowed('catalog')){BR='all';go('catalog');toast(`${p.a} · ${p.n}: ${fmt(p.q)} шт., ячейка ${p.cell}, ${tg(p.pr)}.`);return}const c=CL.find(x=>x[0].toLowerCase().includes(v));if(c&&v&&allowed('clients')){go('clients');card('cl',c[0]);return}toast('Ищите по артикулу, запчасти, марке или клиенту: «рессора», «HOWO», «КарьерСтрой».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Владелец';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ГРУЗДЕТАЛЬ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='debts'?'<em>'+DB.filter(d=>d[4]>0).length+'</em>':x[0]==='stock'?'<em>'+CAT.filter(p=>p.q<p.min).length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['groups','Продажа'],['money','Оплаты'],['debts','Долги'],['nakl','Накладные'],['stock','Остатки'],['purchase','Закуп'],['income','Приход'],['inv','Инвент.'],['catalog','Каталог'],['clients','Клиенты']].filter(x=>allowed(x[0])).slice(0,5).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ГРУЗДЕТАЛЬ';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: продажи, деньги, долги, склад — каждый день.'],
 ['groups','2 · Продажа с телефона вместо 20 групп.'],
 ['money','3 · Журнал оплат ведётся сам: QR, наличные, безнал.'],
 ['debts','4 · Долги: сроки, лимиты, напоминания в WhatsApp.'],
 ['nakl','5 · Накладные без бумаги, подпись на телефоне.'],
 ['catalog','6 · Каталог 1000+ позиций по маркам самосвалов.'],
 ['income','7 · Контейнеры: что едет, приёмка, себестоимость.'],
 ['purchase','8 · Закуп по данным — для Султана.'],
 ['launch','9 · 2 000 000 ₸, ≈ 6 недель, без абонплаты.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
