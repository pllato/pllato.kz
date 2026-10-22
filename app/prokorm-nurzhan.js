/* ПРОКОРМ — система производителя кормов для домашних животных вместо МойСклад и Битрикс: заказы (дилеры, Kaspi Магазин, Halyk Market, прямые), ABC-анализ, кабинет дилера, консигнация, дебиторка и кредиторка, движение денег, склад сырья, производство по рецептуре, склад готовой продукции, инвентаризация, логистика и водители, маркетплейсы, 1С, переход. Все товары, дилеры и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='22.10.2026',NOW='16:40';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="58" r="16" fill="var(--brand2,#d9692a)"/><circle cx="28" cy="36" r="8" fill="currentColor"/><circle cx="44" cy="24" r="8" fill="currentColor"/><circle cx="60" cy="24" r="8" fill="currentColor"/><circle cx="74" cy="36" r="8" fill="currentColor"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;

const SEC=[
 {k:'top',n:'Главное',sub:[['dash','Пульт собственника'],['cash','Движение денег']]},
 {k:'sl',n:'Продажи',sub:[['orders','Заказы: все каналы'],['abc','ABC-анализ продаж'],['dealer','Кабинет дилера'],['mp','Kaspi Магазин и Halyk Market']]},
 {k:'db',n:'Долги',sub:[['ar','Дебиторка и кредиторка'],['consign','Консигнация']]},
 {k:'wh',n:'Склад и производство',sub:[['raw','Склад сырья'],['prod','Производство партий'],['fg','Склад готовой продукции'],['inv','Инвентаризация']]},
 {k:'lg',n:'Логистика',sub:[['logi','Рейсы и водители']]},
 {k:'sys',n:'Переход',sub:[['onec','Обмен с 1С'],['migrate','Вместо МойСклад и Битрикс'],['launch','Стоимость и запуск']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'НА',n:'Нуржан',note:'Всё: продажи, долги, деньги, склад, производство',s:ALL.slice()},
 'Финансовый директор':{av:'ФД',n:'Асель',note:'Деньги, дебиторка, кредиторка, консигнация, 1С',s:['dash','cash','ar','consign','abc','onec']},
 'Менеджер продаж':{av:'МП',n:'Ерлан',note:'Заказы, дилеры, маркетплейсы, остатки ГП',s:['orders','abc','dealer','mp','fg','ar','consign','logi']},
 'Склад и производство':{av:'СП',n:'Бауыржан',note:'Сырьё, выпуск партий, готовая продукция, отгрузки',s:['raw','prod','fg','inv','orders','logi']},
 'Дилер':{av:'ДЛ',n:'ТОО «ЗооМир» · Караганда',note:'Только свои заявки, остатки к заказу, долг',s:['dealer']},
 'Водитель':{av:'ВД',n:'Серик',note:'Только свои рейсы и точки доставки',s:['logi']}
};
let role='Собственник',cur='dash',theme='light';

/* Товары ГП: код, название, вес упаковки, цена дилеру, себест., остаток шт */
const GP=[['К-101','Корм для собак взрослых · курица',15,18900,11200,412],['К-102','Корм для собак взрослых · говядина',15,19900,11900,268],['К-110','Корм для щенков · курица',3,5200,3050,530],['К-201','Корм для кошек взрослых · курица',10,14800,8600,344],['К-205','Корм для стерилизованных кошек',2,3900,2250,610],['К-210','Корм для котят',2,3700,2100,96],['Л-301','Лакомства для собак · говяжьи палочки',0.2,1200,560,1240]];
const GD=c=>GP.find(g=>g[0]===c);
const CH={dl:['Дилер','#23402f'],ks:['Kaspi Магазин','#e5332a'],hl:['Halyk Market','#1f8a5b'],dr:['Прямой','#6b5bd3']};
const chTag=k=>`<span class="srct" style="--sc:${CH[k][1]}">${CH[k][0]}</span>`;
const OST=[['new','Новый','#7a8792'],['conf','Подтверждён','#2f6fb0'],['pick','Сборка','#b0731a'],['ship','В пути','#0a8aa0'],['done','Доставлен','#1f8a5b']];
let ORD=[
 {id:'З-2214',cl:'ТОО «ЗооМир»',city:'Караганда',ch:'dl',items:[['К-101',40],['К-201',30],['Л-301',200]],st:'new',pay:'отсрочка 30 дней',cons:false},
 {id:'З-2213',cl:'ИП «Хвостики»',city:'Астана',ch:'dl',items:[['К-110',60],['К-205',80]],st:'conf',pay:'консигнация',cons:true},
 {id:'З-2212',cl:'Kaspi · покупатель',city:'Алматы',ch:'ks',items:[['К-102',1]],st:'pick',pay:'оплачено Kaspi',cons:false},
 {id:'З-2211',cl:'Halyk · покупатель',city:'Шымкент',ch:'hl',items:[['К-201',2]],st:'ship',pay:'оплачено Halyk',cons:false},
 {id:'З-2210',cl:'ТОО «ПетЛайн»',city:'Алматы',ch:'dl',items:[['К-101',80],['К-102',40]],st:'ship',pay:'отсрочка 14 дней',cons:false},
 {id:'З-2209',cl:'Ветклиника «Айболит»',city:'Алматы',ch:'dr',items:[['К-210',20],['К-205',20]],st:'done',pay:'оплачено',cons:false}
];
const OD=id=>ORD.find(o=>o.id===id);
const osum=o=>o.items.reduce((a,i)=>a+GD(i[0])[3]*i[1],0);
let AUDIT=[];
const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const oTag=k=>{const s=OST.find(x=>x[0]===k);return `<span class="srct" style="--sc:${s[2]}">${s[1]}</span>`};
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const AR=[['ТОО «ПетЛайн»','Алматы',3840000,'02.11',0],['ТОО «ЗооМир»','Караганда',2460000,'28.10',0],['ИП «Хвостики»','Астана',1720000,'консигнация',0],['ТОО «Зоомаркет Север»','Петропавловск',980000,'15.10',7],['ИП Сейткали','Актобе',640000,'10.10',12]];
const AP=[['ТОО «АгроЗерно» · кукуруза, пшеница','сырьё',4200000,'30.10'],['ТОО «МясоПром» · мясная мука','сырьё',2850000,'25.10'],['ТОО «ПакСервис» · мешки 15 кг','упаковка',960000,'05.11'],['Аренда цеха','аренда',1500000,'01.11']];
const arSum=()=>AR.reduce((a,r)=>a+r[2],0),apSum=()=>AP.reduce((a,r)=>a+r[2],0);

/* Пульт */
SC.dash=()=>`<div class="hd"><div><h2>Пульт собственника · ${TODAY}</h2><p>То, ради чего сейчас приходится прыгать между МойСклад, Битриксом и 1С: продажи по каналам, остатки, кому мы должны и кто должен нам, деньги на счетах — на одном экране.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('orders')"><small>Продажи за октябрь</small><b>${tg(48620000)}</b><span>дилеры 79% · маркетплейсы 14% · прямые 7%</span></div>
  <div class="clk" onclick="go('ar')"><small>Нам должны</small><b class="a">${tg(arSum())}</b><span>просрочено ${tg(1620000)} · 2 клиента</span></div>
  <div class="clk" onclick="go('ar')"><small>Мы должны</small><b>${tg(apSum())}</b><span>ближайший платёж 25.10 · ${tg(2850000)}</span></div>
  <div class="clk" onclick="go('cash')"><small>Деньги на счетах</small><b class="g">${tg(12480000)}</b><span>Kaspi 7,9 млн · Halyk 4,6 млн</span></div>
  <div class="clk" onclick="go('fg')"><small>Готовой продукции</small><b>${fmt(GP.reduce((a,g)=>a+g[5],0))} уп.</b><span>${tg(GP.reduce((a,g)=>a+g[4]*g[5],0))} по себестоимости</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Продажи по месяцам, млн ₸</h3>${bars([['май',31.4],['июнь',34.9],['июль',38.2],['август',41.6],['сентябрь',45.1],['октябрь',48.6]].map(r=>[r[0],r[1],r[1].toFixed(1).replace('.',',')]))}
  <h3 style="margin-top:14px">По каналам за октябрь</h3>${bars([['Дилеры (8)',38.4,'38,4 млн'],['Kaspi Магазин',4.9,'4,9 млн'],['Halyk Market',1.9,'1,9 млн'],['Прямые: клиники, зоомагазины',3.4,'3,4 млн']])}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('ar')"><i></i><div><b>ИП Сейткали: просрочка 12 дней</b><span>640 000 ₸ · новые отгрузки остановлены</span></div></div>
  <div class="rf bad" onclick="go('consign')"><i></i><div><b>Консигнация «Хвостики» — закрыть до 31.10</b><span>продано 58% · 1 720 000 ₸</span></div></div>
  <div class="rf" onclick="go('raw')"><i></i><div><b>Мясная мука — на 4 дня производства</b><span>заказ поставщику сформирован</span></div></div>
  <div class="rf" onclick="go('fg')"><i></i><div><b>Корм для котят 2 кг — 96 уп.</b><span>в плане выпуска на 24.10</span></div></div>
  <div class="rf" onclick="go('dealer')"><i></i><div><b>Новая заявка дилера «ЗооМир»</b><span>из кабинета дилера · подтвердить</span></div></div></div></div>
 ${said('Всё собрать в одно место и видеть аналитику хотя бы в виде дашбордов — чтобы с программы на программу не прыгать')}`;

/* Движение денег */
SC.cash=()=>`<div class="hd"><div><h2>Движение денег</h2><p>Поступления от дилеров и маркетплейсов, оплаты поставщикам сырья и упаковки, зарплата и аренда — по счетам и статьям. Остаток на сегодня и прогноз на месяц вперёд по ожидаемым оплатам и платежам.</p></div></div>
 <div class="wid"><div><small>Поступило в октябре</small><b class="g">${tg(44180000)}</b><span>дилеры 35,6 млн · маркетплейсы 6,4 млн</span></div><div><small>Оплачено</small><b>${tg(39720000)}</b><span>сырьё 22,1 млн · ФОТ 7,8 млн</span></div><div><small>Остаток на счетах</small><b>${tg(12480000)}</b><span>на ${TODAY}</span></div><div><small>Прогноз на 30 дней</small><b class="g">+${tg(4900000)}</b><span>ожидаем 13,2 млн · платим 8,3 млн</span></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Дата</th><th>Счёт</th><th>Контрагент</th><th>Статья</th><th style="text-align:right">Сумма</th></tr></thead><tbody>${[['22.10','Kaspi','ТОО «ПетЛайн»','Оплата по З-2198',2840000],['22.10','Kaspi','Kaspi Магазин','Выплата за 21.10',384000],['21.10','Halyk','ТОО «АгроЗерно»','Сырьё · кукуруза',-1800000],['21.10','Halyk','Halyk Market','Выплата за неделю',512000],['20.10','Kaspi','ТОО «ПакСервис»','Упаковка',-620000],['20.10','Kaspi','Сотрудники','Аванс октябрь',-2400000]].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td><b>${r[2]}</b></td><td>${r[3]}</td><td class="mono ${r[4]>0?'pos':''}" style="text-align:right">${r[4]>0?'+':''}${fmt(r[4])}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Заказы */
SC.orders=()=>`<div class="hd"><div><h2>Заказы: все каналы</h2><p>Заявки дилеров из их кабинета, заказы Kaspi Магазина и Halyk Market, прямые продажи — в одной воронке. Заказ резервирует готовую продукцию на складе, проверяет лимит долга клиента и уходит на сборку и в рейс.</p></div><div class="btns"><button class="bt p" onclick="act('Новый заказ: клиент, товары со склада, условия оплаты — лимит долга проверится сам.')">+ Заказ</button></div></div>
 <div class="kb k5">${OST.map(s=>`<div class="kc" style="--sc:${s[2]}"><div class="kh"><b>${s[1]}</b><span>${ORD.filter(o=>o.st===s[0]).length}</span></div>${ORD.filter(o=>o.st===s[0]).map(o=>`<div class="kd"><div class="kt"><b>${o.id}</b>${chTag(o.ch)}</div><div class="kr">${esc(o.cl)}</div><div class="km">${o.city} · ${o.items.length} поз.</div><div class="km mono">${tg(osum(o))}</div><div class="km">${o.cons?tag('консигнация','w'):o.pay}</div>${s[0]!=='done'?`<div class="kf"><a class="mvb" onclick="oNext('${o.id}')">дальше →</a></div>`:''}</div>`).join('')||'<div class="kempty">пусто</div>'}</div>`).join('')}</div>`;
function oNext(id){const o=OD(id),i=OST.findIndex(s=>s[0]===o.st);o.st=OST[i+1][0];render();toast(`${o.id} → «${OST[i+1][1]}».${o.st==='conf'?' Товар зарезервирован, лимит долга в норме.':o.st==='ship'?' Рейс назначен водителю, накладная — в 1С.':o.st==='done'?' Отгрузка закрыта, долг клиента обновлён.':''}`)}

/* ABC */
SC.abc=()=>`<div class="hd"><div><h2>ABC-анализ продаж</h2><p>Какие товары и клиенты дают основную выручку и маржу. A — 80% выручки, B — следующие 15%, C — последние 5%. Видно, что держать в наличии всегда, а что выпускать под заказ; каким дилерам давать лучшие условия.</p></div><div class="btns"><div class="seg"><a class="on">Товары</a><a onclick="act('ABC по клиентам и дилерам.')">Клиенты</a><a onclick="act('ABC по каналам продаж.')">Каналы</a></div></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Группа</th><th>Товар</th><th style="text-align:right">Выручка, октябрь</th><th>Доля</th><th>Маржа</th><th>Рекомендация</th></tr></thead><tbody>${[['A','Корм для собак взрослых · курица',16840000,'34,6%','41%','всегда в наличии'],['A','Корм для кошек взрослых · курица',10360000,'21,3%','42%','всегда в наличии'],['A','Корм для собак взрослых · говядина',8360000,'17,2%','40%','всегда в наличии'],['B','Корм для стерилизованных кошек',4290000,'8,8%','42%','запас на 2 недели'],['B','Корм для щенков · курица',3640000,'7,5%','41%','запас на 2 недели'],['C','Лакомства · говяжьи палочки',1800000,'3,7%','53%','высокая маржа — продвигать'],['C','Корм для котят',1110000,'2,3%','43%','выпускать под заказ']].map(r=>`<tr><td>${tag(r[0],r[0]==='A'?'g':r[0]==='B'?'i':'')}</td><td><b>${r[1]}</b></td><td class="mono" style="text-align:right">${fmt(r[2])}</td><td class="mono">${r[3]}</td><td class="mono">${r[4]}</td><td>${r[5]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('По продажам ABC разбить можно?','Да — по товарам, клиентам и каналам, с маржой.')}`;

/* Кабинет дилера */
let DQ={'К-101':40,'К-201':30,'Л-301':200};
SC.dealer=()=>{const s=Object.entries(DQ).reduce((a,[k,v])=>a+GD(k)[3]*v,0);
 return `<div class="hd"><div><h2>Кабинет дилера · ТОО «ЗооМир» · Караганда</h2><p>Дилер заходит со своего логина, видит каталог с ценами для него, наличие, свою задолженность и лимит — и подаёт заявку сам. Заявка сразу в воронке у менеджера. Свои прошлые заказы и статусы доставки дилер видит здесь же.</p></div></div>
 <div class="g2 g21"><div class="pan"><h3>Новая заявка</h3><div class="tw"><table class="t"><thead><tr><th>Товар</th><th>Цена дилера</th><th>Наличие</th><th>Количество</th><th style="text-align:right">Сумма</th></tr></thead><tbody>${GP.map(g=>`<tr><td><b>${g[1]}</b><br><small>${g[2]} кг</small></td><td class="mono">${fmt(g[3])}</td><td>${g[5]>100?tag('есть','g'):tag('мало','w')}</td><td><input class="bz-qty" type="number" value="${DQ[g[0]]||0}" onchange="DQ['${g[0]}']=+this.value||0;render()"></td><td class="mono" style="text-align:right">${fmt(g[3]*(DQ[g[0]]||0))}</td></tr>`).join('')}<tr><td colspan="4"><b>Итого заявка</b></td><td class="mono" style="text-align:right"><b>${tg(s)}</b></td></tr></tbody></table></div>
  <div class="btns l" style="margin-top:8px"><button class="bt p" onclick="act('Заявка отправлена — менеджер получил её в воронке, вы получите уведомление о подтверждении.')">Отправить заявку</button></div></div>
 <div class="pan"><h3>Мои условия</h3><div class="kv"><span>Долг сейчас</span><b>${tg(2460000)}</b></div><div class="kv"><span>Лимит</span><b>${tg(5000000)}</b></div><div class="kv"><span>Отсрочка</span><b>30 дней</b></div><div class="kv"><span>Ближайшая оплата</span><b>28.10 · ${tg(2460000)}</b></div>
  <h3 style="margin-top:12px">Мои заказы</h3>${[['З-2214','новая','—'],['З-2187','доставлен','12.10'],['З-2160','доставлен','28.09']].map(r=>`<div class="kv"><span><b class="mono">${r[0]}</b> · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}</div></div>
 ${said('Отгрузки дилерам и дистрибьюторам по Казахстану — можно ли их добавлять, чтобы они видели?','Да: у каждого дилера свой кабинет — заявки, наличие, долг.')}`};

/* Маркетплейсы */
SC.mp=()=>`<div class="hd"><div><h2>Kaspi Магазин и Halyk Market</h2><p>Заказы маркетплейсов приходят в систему сами, остатки и цены уходят на маркетплейсы из склада готовой продукции. Нет ситуации, когда товар продан на Kaspi, а на складе его уже нет.</p></div></div>
 <div class="g2"><div class="pan"><h3>Kaspi Магазин</h3><div class="kv"><span>Заказов за октябрь</span><b>312</b></div><div class="kv"><span>Выручка</span><b>${tg(4880000)}</b></div><div class="kv"><span>Остатки на Kaspi</span><b class="pos">синхронизированы 16:30</b></div><div class="kv"><span>Комиссия маркетплейса</span><b>учитывается в марже</b></div></div>
 <div class="pan"><h3>Halyk Market</h3><div class="kv"><span>Заказов за октябрь</span><b>124</b></div><div class="kv"><span>Выручка</span><b>${tg(1940000)}</b></div><div class="kv"><span>Остатки</span><b class="pos">синхронизированы 16:30</b></div><div class="kv"><span>Выплаты</span><b>сверяются с поступлениями</b></div></div></div>
 ${said('И Kaspi Магазин, Halyk Market')}`;
/* Дебиторка и кредиторка */
SC.ar=()=>`<div class="hd"><div><h2>Дебиторка и кредиторка</h2><p>Кто нам должен и кому должны мы — с суммами и сроками. Долги клиентов растут с каждой отгрузкой и уменьшаются с оплатой из выписки. Просрочка — сигнал менеджеру, а при превышении лимита новые отгрузки этому клиенту останавливаются.</p></div></div>
 <div class="g2"><div class="pan"><h3>Нам должны · ${tg(arSum())}</h3><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th style="text-align:right">Долг</th><th>Срок</th><th>Просрочка</th></tr></thead><tbody>${AR.map(r=>`<tr class="${r[4]>0?'rowbad':''}"><td><b>${r[0]}</b><br><small>${r[1]}</small></td><td class="mono" style="text-align:right">${fmt(r[2])}</td><td class="mono">${r[3]}</td><td class="mono ${r[4]?'neg':''}">${r[4]?r[4]+' дн.':'—'}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Мы должны · ${tg(apSum())}</h3><div class="tw"><table class="t"><thead><tr><th>Поставщик</th><th>Тип</th><th style="text-align:right">Сумма</th><th>Оплатить до</th></tr></thead><tbody>${AP.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="mono" style="text-align:right">${fmt(r[2])}</td><td class="mono">${r[3]}</td></tr>`).join('')}</tbody></table></div></div></div>
 ${said('Кредиторскую задолженность тоже видеть: кому мы должны, кто нам должен, сколько, когда')}`;

/* Консигнация */
let CS=[['ИП «Хвостики»','Астана','01.10',2960000,1720000,'31.10',58],['ТОО «ЗооЛенд»','Алматы','15.09',1840000,1840000,'15.10',100],['ИП «Котофей»','Костанай','10.10',920000,310000,'10.11',34]];
SC.consign=()=>`<div class="hd"><div><h2>Консигнация</h2><p>Товар, переданный на реализацию: сколько передали, сколько продано, сколько вернётся, и до какой даты консигнацию нужно закрыть. Система напоминает заранее и считает, какую сумму выставить к оплате.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Партнёр</th><th>Передано</th><th style="text-align:right">На сумму</th><th style="text-align:right">Продано</th><th>Продано, %</th><th>Закрыть до</th><th></th></tr></thead><tbody>${CS.map((r,i)=>`<tr class="${r[6]===100?'':(/31\.10/.test(r[5])?'rowwarn':'')}"><td><b>${r[0]}</b><br><small>${r[1]}</small></td><td class="mono">${r[2]}</td><td class="mono" style="text-align:right">${fmt(r[3])}</td><td class="mono" style="text-align:right">${fmt(r[4])}</td><td><div class="bz-occ"><i style="width:${r[6]}%"></i></div><small class="mono">${r[6]}%</small></td><td class="mono">${r[5]}</td><td>${r[6]===100?tag('закрыта','g'):`<button class="bt sm" onclick="csClose(${i})">Закрыть</button>`}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('У нас товары по консигнации идут — видеть, когда эту консигнацию закрывать')}`;
function csClose(i){const r=CS[i];toast(`Консигнация ${r[0]} закрыта: к оплате ${tg(r[4])}, возврат на склад на ${tg(r[3]-r[4])}.`);r[6]=100;render()}

/* Склад сырья */
SC.raw=()=>`<div class="hd"><div><h2>Склад сырья</h2><p>Зерновые, мясная мука, жиры, витамины, упаковка — остатки в кг и на сколько дней производства их хватит по плану выпуска. Приход по накладной поставщика, списание — автоматически при выпуске партии по рецептуре.</p></div><div class="btns"><button class="bt p" onclick="act('Приход сырья: поставщик, накладная, вес, цена — партия сырья с датой.')">+ Приход</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сырьё</th><th>Остаток</th><th>Расход в день</th><th>Хватит на</th><th style="text-align:right">Цена, ₸/кг</th></tr></thead><tbody>${[['Кукуруза','кг',38400,2100,95],['Пшеница','кг',26200,1600,88],['Мясная мука','кг',3200,800,620],['Куриный жир','кг',2900,260,780],['Витаминно-минеральный премикс','кг',410,22,2400],['Мешки 15 кг','шт',1800,90,210],['Пакеты 2–3 кг','шт',9400,520,64]].map(r=>{const d=Math.floor(r[2]/r[3]);return `<tr class="${d<7?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono">${fmt(r[2])} ${r[1]}</td><td class="mono">${fmt(r[3])} ${r[1]}</td><td class="mono ${d<7?'neg':''}">${d} дн.</td><td class="mono" style="text-align:right">${fmt(r[4])}</td></tr>`}).join('')}</tbody></table></div></div>`;

/* Производство */
SC.prod=()=>`<div class="hd"><div><h2>Производство партий</h2><p>Выпуск партии по рецептуре: система списывает сырьё в нужных пропорциях, приходует готовую продукцию на склад и считает себестоимость партии. План выпуска строится от остатков ГП и заказов дилеров.</p></div><div class="btns"><button class="bt p" onclick="act('Новая партия: рецептура, вес, смена — сырьё зарезервируется.')">+ Партия</button></div></div>
 <div class="g2 g21"><div class="pan"><h3>План и партии</h3><div class="tw"><table class="t"><thead><tr><th>Партия</th><th>Продукт</th><th>Выпуск</th><th>Статус</th><th style="text-align:right">Себестоимость, ₸/кг</th></tr></thead><tbody>${[['П-1022','Корм для собак · курица','6 000 кг · 400 мешков','выпущена 21.10',748],['П-1023','Корм для кошек · курица','3 000 кг · 300 уп.','в цехе',861],['П-1024','Корм для котят','1 000 кг · 500 уп.','план 24.10','—'],['П-1025','Корм для собак · говядина','4 500 кг · 300 мешков','план 25.10','—']].map(r=>`<tr><td class="mono"><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${tag(r[3],r[3].startsWith('выпущ')?'g':r[3]==='в цехе'?'w':'')}</td><td class="mono" style="text-align:right">${r[4]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Рецептура · корм для собак, курица · на 1 000 кг</h3>${[['Кукуруза','350 кг'],['Пшеница','250 кг'],['Мясная мука','220 кг'],['Куриный жир','80 кг'],['Премикс','8 кг'],['Прочее','92 кг']].map(r=>`<div class="kv"><span>${r[0]}</span><b class="mono">${r[1]}</b></div>`).join('')}<p class="hint">Рецептуры задаёте вы; изменения — с журналом и датой.</p></div></div>`;

/* Склад ГП */
SC.fg=()=>`<div class="hd"><div><h2>Склад готовой продукции</h2><p>Остатки по каждому продукту и партии, резерв под заказы, свободно к продаже — с себестоимостью и ценой. Эти же остатки видят дилеры в кабинете и маркетплейсы.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Код</th><th>Продукт</th><th>Упаковка</th><th>Остаток</th><th>В резерве</th><th>Свободно</th><th style="text-align:right">Цена дилеру</th><th>Маржа</th></tr></thead><tbody>${GP.map(g=>{const rs=ORD.filter(o=>['new','conf','pick'].includes(o.st)).reduce((a,o)=>a+(o.items.find(i=>i[0]===g[0])||[0,0])[1],0);return `<tr class="${g[5]-rs<150?'rowwarn':''}"><td class="mono">${g[0]}</td><td><b>${g[1]}</b></td><td class="mono">${g[2]} кг</td><td class="mono">${g[5]}</td><td class="mono">${rs}</td><td class="mono"><b>${g[5]-rs}</b></td><td class="mono" style="text-align:right">${fmt(g[3])}</td><td class="mono">${Math.round((g[3]-g[4])/g[3]*100)}%</td></tr>`}).join('')}</tbody></table></div></div>`;

/* Инвентаризация */
SC.inv=()=>`<div class="hd"><div><h2>Инвентаризация</h2><p>Пересчёт склада сырья и готовой продукции с телефона: сканер штрихкода или ввод количества. Расхождения с учётом показываются сразу; корректировка — одним документом с причиной.</p></div><div class="btns"><button class="bt p" onclick="act('Инвентаризация склада ГП запущена, назначен Бауыржан.')">+ Инвентаризация</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th>По учёту</th><th>Факт</th><th>Разница</th></tr></thead><tbody>${[['Корм для собак · курица 15 кг',412,412],['Корм для кошек · курица 10 кг',344,342],['Мешки 15 кг',1800,1760],['Мясная мука, кг',3200,3185]].map(r=>`<tr class="${r[1]!==r[2]?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono">${fmt(r[1])}</td><td class="mono">${fmt(r[2])}</td><td class="mono ${r[2]<r[1]?'neg':''}">${r[2]-r[1]||'—'}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('С телефона','Кладовщик открывает инвентаризацию на телефоне, сканирует штрихкод мешка или вводит количество. Пересчёт можно делать по зонам: сырьё отдельно, готовая продукция отдельно, — склад при этом не останавливается.')}
 <div class="pan"><h3>История</h3>${[['01.10','Склад ГП','расхождение −3 мешка, списано: повреждение'],['01.09','Склад сырья','расхождений нет'],['01.08','Склад ГП','излишек +2 уп., оприходовано']].map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}</div>`;

/* Логистика */
SC.logi=()=>{const mine=role==='Водитель';
 return `<div class="hd"><div><h2>${mine?'Мои рейсы · Серик':'Рейсы и водители'}</h2><p>Заказы собираются в рейсы по направлениям. Водитель видит со своего телефона только свои рейсы: адреса, товары, документы — и отмечает «доставлено» с фото накладной. Менеджер и дилер видят статус доставки.</p></div>${mine?'':`<div class="btns"><button class="bt p" onclick="act('Новый рейс: водитель, машина, заказы по маршруту.')">+ Рейс</button></div>`}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Рейс</th><th>Водитель</th><th>Маршрут</th><th>Заказы</th><th>Вес</th><th>Статус</th></tr></thead><tbody>${[['Р-418','Серик','Алматы · клиники и зоомагазины','З-2209, З-2210','1 980 кг','в пути · 2 из 4 точек'],['Р-419','Даурен','Алматы → Караганда','З-2214','1 100 кг','загрузка завтра 08:00'],['Р-420','ТК «КазЛогистик»','Алматы → Астана','З-2213','1 440 кг','передан перевозчику']].filter(r=>!mine||r[1]==='Серик').map(r=>`<tr><td class="mono"><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td class="mono">${r[3]}</td><td class="mono">${r[4]}</td><td>${r[5]}</td></tr>`).join('')}</tbody></table></div>${mine?`<div class="btns l" style="margin-top:8px"><button class="bt p" onclick="act('Точка отмечена: доставлено, фото накладной сохранено.')">Отметить «доставлено»</button></div>`:''}</div>
 ${said('По логистике — заявки на водителей добавлять, такая возможность есть?','Да: у водителя свой доступ только к своим рейсам.')}`};
/* 1С */
SC.onec=()=>`<div class="hd"><div><h2>Обмен с 1С</h2><p>Бухгалтерия остаётся в 1С, но вводить в неё повторно ничего не нужно: реализации, поступления, оплаты и контрагенты уходят из системы сами, а данные бухгалтерии — обратно.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Данные</th><th>Направление</th><th>Когда</th></tr></thead><tbody>${[['Контрагенты и договоры','⇄ в обе стороны','при изменении'],['Реализации (накладные) дилерам и клиентам','система → 1С','при отгрузке'],['Поступления сырья и упаковки','система → 1С','при приходе'],['Оплаты из банка','1С → система','каждый час'],['Выпуск продукции и списание сырья','система → 1С','при закрытии партии']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div>`;

/* Переход */
SC.migrate=()=>`<div class="hd"><div><h2>Вместо МойСклад и Битрикс</h2><p>Всё, что сейчас разбросано по трём программам, — в одной. Данные переносим: товары, остатки, контрагенты, заказы и сделки из МойСклад и Битрикс. После запуска подписки этих сервисов можно отключить.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сейчас</th><th>Для чего</th><th>В новой системе</th></tr></thead><tbody>${[['МойСклад','склад, остатки, заказы — основное','Склад сырья и ГП, производство, заказы, инвентаризация'],['Битрикс24','сделки, клиенты','Заказы и клиенты во всех каналах, кабинет дилера'],['1С','бухгалтерия','Остаётся — обмен с системой'],['Excel и звонки','долги, консигнация','Дебиторка, кредиторка, консигнация со сроками']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Битрикс, МойСклад есть, 1С; в основном МойСклад')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Стандартный пакет разработки: всё из демо, кроме обмена с 1С, который считается отдельно. Делаем под ваши процессы: база, затем версии на согласование, пока система не станет удобной. Система ваша — дальше платить не нужно.</p></div></div>
 <div class="pk1"><div><small>Пакет + обмен с 1С</small><b>2 800 000 ₸</b><span>2 000 000 ₸ система + 800 000 ₸ обмен с 1С · один раз</span></div><div><small>Срок</small><b>4–6 недель</b><span>база → полировка → запуск</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>280 000 ₸</b><span>при подписании</span></div><div><small>База · 45%</small><b>1 260 000 ₸</b><span>после приёмки базы на вашем сервере</span></div><div><small>Сдача · 45%</small><b>1 260 000 ₸</b><span>после полировки и передачи</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3><div class="kv"><span>Продажи, дилеры, маркетплейсы, ABC</span><b>✓</b></div><div class="kv"><span>Склады, производство, инвентаризация, логистика</span><b>✓</b></div><div class="kv"><span>Дебиторка, кредиторка, консигнация, деньги</span><b>✓</b></div><div class="kv"><span>Перенос из МойСклад и Битрикс, мобильная версия, до 50 пользователей</span><b>✓</b></div></div>
 <div class="pan"><h3>После сдачи</h3><div class="kv"><span>Сопровождение</span><b>3 месяца бесплатно</b></div><div class="kv"><span>Дальше</span><b>20 $ в час, по необходимости</b></div><div class="kv"><span>Сервер</span><b>бесплатно или 5–10 $</b></div></div></div>`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const o=ORD.find(x=>(x.id+x.cl+x.city).toLowerCase().includes(v));if(o&&v){go('orders');return}const g=GP.find(x=>(x[0]+x[1]).toLowerCase().includes(v));if(g&&v){go('fg');return}toast('Ищите по заказу, клиенту или товару: «З-2214», «ЗооМир», «котят».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ПРОКОРМ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='orders'?'<em>'+ORD.filter(o=>o.st==='new').length+'</em>':x[0]==='ar'?'<em>'+AR.filter(r=>r[4]>0).length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['orders','Заказы'],['ar','Долги'],['fg','Склад'],['logi','Рейсы']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ПРОКОРМ';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: продажи по каналам, долги, деньги, остатки — вместо трёх программ.'],
 ['orders','2 · Заказы дилеров, Kaspi, Halyk и прямые — в одной воронке.'],
 ['abc','3 · ABC-анализ: что приносит выручку и маржу.'],
 ['dealer','4 · Кабинет дилера: заявка, наличие, долг.'],
 ['ar','5 · Кто нам должен и кому должны мы — со сроками.'],
 ['consign','6 · Консигнация: когда закрывать и сколько выставить.'],
 ['raw','7 · Склад сырья: на сколько дней хватит.'],
 ['prod','8 · Выпуск партий по рецептуре и себестоимость.'],
 ['logi','9 · Рейсы и водители.'],
 ['launch','10 · Стоимость: 2 млн + 1С 800 тыс., 10 / 45 / 45.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
