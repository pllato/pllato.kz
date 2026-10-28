/* ШАГОМ — единая система обувного магазина вместо МойСклад + отдельных чатов: два магазина (Алматы, Астана), остатки по моделям и размерам, касса на моноблоке, Kaspi-магазин, WhatsApp, Instagram и телефония в одной ленте, воронка заявок, клиенты и программа лояльности, инвентаризация с QR, реклама и креативы, финансы (прибыль, движение денег, дебиторка), пульт собственников. Название, модели, клиенты и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='28.10.2026',NOW='17:20';
const LOGO_I='<svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="40" cy="58" rx="17" ry="30" fill="currentColor"/><ellipse cx="66" cy="34" rx="12" ry="20" fill="var(--brand2,#c8783e)"/></svg>';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;
const TC={ok:'g',warn:'w',bad:'r',info:'i',violet:'v'};
const tag=(t,c)=>`<span class="tag ${TC[c]||c||''}">${t}</span>`;
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
const SC={},CARD={};
const SEC=[
 {k:'top',n:'Собственникам',sub:[['dash','Пульт собственников'],['money','Финансы и движение денег'],['ads','Реклама и креативы']]},
 {k:'sl',n:'Продажи',sub:[['inbox','Все чаты и звонки'],['funnel','Воронка заявок'],['clients','Клиенты'],['loyal','Программа лояльности']]},
 {k:'sh',n:'Магазины',sub:[['pos','Касса'],['kaspi','Kaspi-магазин']]},
 {k:'st',n:'Склад',sub:[['stock','Остатки по размерам'],['move','Приход и перемещения'],['inv','Инвентаризация с QR']]},
 {k:'sys',n:'Внедрение',sub:[['migr','Переход с МойСклад'],['launch','Стоимость и этапы']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Собственник':{av:'МХ',n:'Мухтар',note:'Всё: продажи, склад, финансы, реклама',s:ALL.slice()},
 'Совладелец':{av:'СП',n:'Супруга',note:'Пульт, финансы, клиенты, лояльность, остатки',s:['dash','money','ads','clients','loyal','stock','launch']},
 'Менеджер чатов':{av:'МЧ',n:'WhatsApp · Instagram',note:'Чаты, заявки, клиенты, резерв размера',s:['inbox','funnel','clients','loyal','stock','kaspi']},
 'Продавец-кассир':{av:'ПК',n:'Магазин Алматы',note:'Касса, остатки, бонусы клиента',s:['pos','stock','clients']},
 'Склад':{av:'СК',n:'Кладовщик',note:'Приход, перемещения, инвентаризация',s:['stock','move','inv']}
};
let role='Собственник',cur='dash',theme='light',shop='all';
const SHOP={all:'Оба магазина',alm:'Алматы',ast:'Астана'};
function shopSw(){return `<div class="dpcity">${Object.entries(SHOP).map(([k,v])=>`<button class="${shop===k?'on':''}" onclick="setShop('${k}')">${v}</button>`).join('')}</div>`}
function setShop(k){shop=k;toast(k==='all'?'Оба магазина вместе.':`Магазин ${SHOP[k]}.`);render()}
const SZ=[36,37,38,39,40,41,42,43,44];
/* Модели: остатки по размерам [Алматы], [Астана] */
let MD=[
 {sku:'ШГ-2041',n:'Ботинки челси женские · кожа · чёрные',pr:42900,cost:21500,a:[0,2,3,4,2,1,0,0,0],s:[1,1,2,2,1,0,0,0,0]},
 {sku:'ШГ-2057',n:'Кроссовки мужские · белые',pr:36900,cost:17800,a:[0,0,0,1,3,4,3,2,1],s:[0,0,0,0,2,2,1,1,0]},
 {sku:'ШГ-1988',n:'Сапоги зимние женские · замша · беж',pr:58900,cost:29000,a:[1,1,2,1,0,0,0,0,0],s:[0,2,1,1,1,0,0,0,0]},
 {sku:'ШГ-2063',n:'Лоферы мужские · кожа · коричневые',pr:39900,cost:19200,a:[0,0,0,0,1,2,2,1,0],s:[0,0,0,0,0,1,1,0,0]},
 {sku:'ШГ-2072',n:'Кеды женские · текстиль · молочные',pr:24900,cost:11000,a:[2,3,4,3,1,0,0,0,0],s:[1,2,2,1,0,0,0,0,0]},
 {sku:'ШГ-1931',n:'Дутики детские · синие',pr:19900,cost:8600,a:[3,2,0,0,0,0,0,0,0],s:[2,1,1,0,0,0,0,0,0]}
];
const qty=(m,i)=>shop==='alm'?m.a[i]:shop==='ast'?m.s[i]:m.a[i]+m.s[i];
const tot=m=>SZ.reduce((t,_,i)=>t+qty(m,i),0);
const K={all:1,alm:.58,ast:.42};
/* Пульт */
SC.dash=()=>{const k=K[shop];return `<div class="hd"><div><h2>Пульт собственников · ${TODAY}</h2><p>Выручка обоих магазинов и Kaspi за день и месяц, сколько обращений пришло из WhatsApp и Instagram и сколько из них купили, остатки, что заканчивается по ходовым размерам, прибыль. Цифры собираются сами из кассы, Kaspi и чатов.</p></div>${shopSw()}</div>
 <div class="wid">
  <div class="clk" onclick="go('pos')"><small>Выручка сегодня</small><b class="g">${tg(1184000*k)}</b><span>${Math.round(31*k)} чеков · средний ${tg(38200)}</span></div>
  <div class="clk" onclick="go('inbox')"><small>Обращений сегодня</small><b class="a">${Math.round(47*k)}</b><span>Instagram ${Math.round(29*k)} · WhatsApp ${Math.round(14*k)} · звонки ${Math.round(4*k)}</span></div>
  <div class="clk" onclick="go('funnel')"><small>Купили из чатов</small><b>${Math.round(12*k)}</b><span>конверсия 26 %</span></div>
  <div class="clk" onclick="go('kaspi')"><small>Kaspi сегодня</small><b>${Math.round(9*k)} заказов</b><span>${tg(318000*k)}</span></div>
  <div class="clk" onclick="go('money')"><small>Прибыль за октябрь</small><b class="g">${tg(6420000*k)}</b><span>маржа 47 % после скидок</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Выручка за октябрь по каналам</h3>${bars([['Магазин Алматы',14800000,'14,8 млн'],['Магазин Астана',10700000,'10,7 млн'],['Kaspi-магазин',6900000,'6,9 млн'],['Instagram / WhatsApp с доставкой',3300000,'3,3 млн']])}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('stock')"><i></i><div><b>Челси ШГ-2041 · 39 размер — осталось 1 пара в Астане</b><span>продаётся 6 пар в неделю — заказать поставщику</span></div></div>
  <div class="rf" onclick="go('inbox')"><i></i><div><b>3 чата Instagram без ответа больше 20 минут</b><span>менеджер на обеде — передать продавцу</span></div></div>
  <div class="rf" onclick="go('inv')"><i></i><div><b>Расхождение по инвентаризации · Алматы · 2 пары</b><span>кроссовки ШГ-2057, 42 размер</span></div></div>
  <div class="rf" onclick="go('money')"><i></i><div><b>Поставщик «Обувь-Опт» — оплата 1 200 000 ₸ до 31.10</b><span>в календаре платежей</span></div></div>
 </div></div>
 ${said('Всё практически по цифрам — кто написал, сколько лидов, сколько людей зашло, сколько купили')}`};

/* Финансы */
SC.money=()=>`<div class="hd"><div><h2>Финансы и движение денег</h2><p>Прибыль по магазинам и каналам, движение денег по дням, долги поставщикам и календарь платежей. Себестоимость берётся из прихода, скидки и бонусы лояльности учитываются — видно настоящую маржу, а не выручку.</p></div>${shopSw()}</div>
 <div class="wid"><div><small>Выручка · октябрь</small><b>${tg(35700000*K[shop])}</b><span>все каналы</span></div><div><small>Себестоимость</small><b>${tg(17400000*K[shop])}</b><span>по приходам</span></div><div><small>Расходы</small><b>${tg(11880000*K[shop])}</b><span>аренда, зарплаты, реклама, Kaspi</span></div><div><small>Прибыль</small><b class="g">${tg(6420000*K[shop])}</b><span>18 % от выручки</span></div></div>
 <div class="g2"><div class="pan"><h3>Расходы за октябрь</h3>${bars([['Аренда двух магазинов',3600000,'3,6 млн'],['Зарплаты и проценты',4200000,'4,2 млн'],['Реклама Instagram',1900000,'1,9 млн'],['Комиссия Kaspi',1240000,'1,24 млн'],['Прочее',940000,'0,94 млн']].map(r=>[r[0],r[1]*K[shop],r[2]]))}</div>
 <div class="pan"><h3>Календарь платежей</h3>${[['31.10','Поставщик «Обувь-Опт» · партия зима','1 200 000 ₸'],['01.11','Аренда · Алматы','1 900 000 ₸'],['01.11','Аренда · Астана','1 700 000 ₸'],['05.11','Зарплаты','3 100 000 ₸']].map(r=>`<div class="kv"><span>${r[0]} · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}<div class="kv"><span>Долг поставщикам всего</span><b>${tg(2840000)}</b></div></div></div>
 <div class="pan"><h3>Движение денег за неделю</h3><div class="tw"><table class="t"><thead><tr><th>День</th><th class="r">Пришло</th><th class="r">Ушло</th><th class="r">Остаток</th></tr></thead><tbody>${[['22.10',1210000,380000,4120000],['23.10',1080000,1450000,3750000],['24.10',1320000,240000,4830000],['25.10',1590000,610000,5810000],['26.10',1740000,90000,7460000],['27.10',1150000,2100000,6510000]].map(r=>`<tr><td>${r[0]}</td><td class="r">${tg(r[1])}</td><td class="r">${tg(r[2])}</td><td class="r"><b>${tg(r[3])}</b></td></tr>`).join('')}</tbody></table></div></div>
 ${said('Финансы, прибыль, движение, кэшфлоу, дебиторка, касса — скорее всего нужна будет','Да: касса, финансы и долги — в той же системе, без отдельных программ.')}`;

/* Реклама */
SC.ads=()=>`<div class="hd"><div><h2>Реклама и креативы</h2><p>Каждое обращение помечено, с какой рекламы и какого креатива пришло. Видно, сколько стоит обращение и покупатель по каждому креативу — и какой выключить.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Креатив</th><th class="r">Потрачено</th><th class="r">Обращений</th><th class="r">Купили</th><th class="r">Выручка</th><th class="r">Цена покупателя</th><th></th></tr></thead><tbody>${[['Reels «Челси на зиму»',240000,186,41,1760000],['Сторис «Скидка 15 % на кроссовки»',180000,152,22,790000],['Карусель «Новая коллекция»',210000,98,9,410000],['Таргет «Дутики детские»',90000,64,19,380000]].map(r=>{const c=r[1]/r[3];return `<tr class="${c>20000?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="r">${tg(r[1])}</td><td class="r">${r[2]}</td><td class="r">${r[3]}</td><td class="r">${tg(r[4])}</td><td class="r">${tg(c)}</td><td>${c>20000?tag('выключить?','bad'):tag('работает','ok')}</td></tr>`}).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Откуда покупатели · октябрь</h3>${bars([['Instagram реклама',91,'91'],['Instagram без рекламы',54,'54'],['Kaspi',208,'208'],['Повторные (лояльность)',137,'137'],['Проходящие мимо',312,'312']])}</div>
 <div class="pan"><h3>Как это считается</h3><div class="kv"><span>Метка креатива</span><b>из ссылки рекламы в чат</b></div><div class="kv"><span>Покупка</span><b>чек на кассе по телефону клиента</b></div><div class="kv"><span>Расход</span><b>из рекламного кабинета</b></div></div></div>
 ${said('Сейчас делают — с какого креатива пришёл лид; тоже можно сделать?','Без проблем, проинтегрируемся.')}`;
/* Чаты */
const SRC={ig:['Instagram','#c13584'],wa:['WhatsApp','#1f8a5b'],ph:['Звонок','#6b7280'],ks:['Kaspi','#e5332a']};
const srcTag=k=>`<span class="srct" style="--sc:${SRC[k][1]}">${SRC[k][0]}</span>`;
let INB=[['17:14','ig','@aida.style','Челси чёрные 38 есть? Сколько стоят?','',1,'Reels «Челси на зиму»'],['17:02','wa','+7 701 *** 55 12','Можно отложить кроссовки 42 до вечера?','Айгерим',0,'—'],['16:48','ph','+7 777 *** 09 31','Звонок 2:14 · запись · спрашивали детские дутики','Айгерим',0,'—'],['16:30','ig','@dana_kz','Доставка в Астану есть?','Айгерим',0,'Сторис «Скидка 15 %»']];
SC.inbox=()=>`<div class="hd"><div><h2>Все чаты и звонки</h2><p>WhatsApp, Instagram Direct, звонки и вопросы Kaspi — в одной ленте, а не в разных телефонах. Видно, кто ответил и как быстро, с какого креатива пришёл человек. Переписка остаётся в карточке клиента, даже если менеджер сменился.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Время</th><th>Канал</th><th>Клиент</th><th>Сообщение</th><th>Креатив</th><th>Менеджер</th><th></th></tr></thead><tbody>${INB.map((r,i)=>`<tr class="${r[5]?'rowwarn':''}"><td class="mono">${r[0]}</td><td>${srcTag(r[1])}</td><td><b>${r[2]}</b></td><td>${r[3]}</td><td>${r[6]}</td><td>${r[4]||'—'}</td><td>${r[5]?`<button class="bt p sm" onclick="take(${i})">Ответить</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
 ${tip('Быстрые ответы','Менеджер отвечает из системы: «есть в наличии» с фото и остатком по размерам, «отложить», «ссылка на оплату Kaspi», «доставка». Остаток подтягивается со склада — не нужно бежать проверять полку.')}
 ${said('WhatsApp и Instagram по отдельности, менеджеры отвечают, и мы это сильно не фиксируем')}`;
function take(i){INB[i][4]='Айгерим';INB[i][5]=0;DL.unshift({id:'З-'+(318+DL.length),cl:'@aida.style',it:'Челси ШГ-2041 · 38',st:'size',sum:42900,src:'ig'});toast('Айгерим ответила: «Есть, 38 — 3 пары в Алматы, 2 в Астане, 42 900 ₸» с фото. Создана заявка в воронке.');render()}

/* Воронка */
const FST=[['new','Обращение'],['size','Подбор размера'],['res','Отложено / резерв'],['pay','Ждём оплату'],['give','Выдача / доставка'],['done','Купил']];
let DL=[
 {id:'З-312',cl:'@madina.k',it:'Сапоги ШГ-1988 · 37',st:'res',sum:58900,src:'ig'},
 {id:'З-311',cl:'+7 701 *** 55 12',it:'Кроссовки ШГ-2057 · 42',st:'res',sum:36900,src:'wa'},
 {id:'З-309',cl:'@dana_kz',it:'Кеды ШГ-2072 · 38 · доставка в Астану',st:'pay',sum:24900,src:'ig'},
 {id:'З-305',cl:'Ерлан С.',it:'Лоферы ШГ-2063 · 42',st:'give',sum:39900,src:'ph'},
 {id:'З-301',cl:'Асель Б.',it:'Челси ШГ-2041 · 39',st:'done',sum:42900,src:'ig'},
 {id:'З-314',cl:'+7 777 *** 09 31',it:'Дутики детские — какой размер?',st:'new',sum:0,src:'ph'}
];
SC.funnel=()=>`<div class="hd"><div><h2>Воронка заявок</h2><p>Из чата — в покупку: подбор размера по остаткам, резерв пары на полке (её не продадут другому), ссылка на оплату или оплата в магазине, выдача или доставка. Нажмите на карточку — она перейдёт дальше.</p></div></div>
 <div class="oxk" style="grid-template-columns:repeat(6,minmax(150px,1fr))">${FST.map(f=>`<div class="oxkc"><h4>${f[1]} <small>${DL.filter(d=>d.st===f[0]).length}</small></h4>${DL.filter(d=>d.st===f[0]).map(d=>`<div class="oxkt" onclick="dNext('${d.id}')"><b>${d.cl}</b><span>${d.it}</span><small>${SRC[d.src][0]} · ${d.sum?tg(d.sum):'сумма после подбора'}</small></div>`).join('')}</div>`).join('')}</div>
 ${tip('Резерв','Отложенная пара списывается из «свободного остатка»: продавец в другом магазине и Kaspi её не продадут. Не забрали за 24 часа — резерв снимается сам.')}`;
function dNext(id){const d=DL.find(x=>x.id===id);const i=FST.findIndex(f=>f[0]===d.st);if(i>=FST.length-1){toast(d.cl+': покупка завершена, бонусы начислены.');return}d.st=FST[i+1][0];if(!d.sum)d.sum=19900;toast(`${d.cl} → «${FST[i+1][1]}».`+(d.st==='res'?' Пара отложена на 24 часа.':d.st==='pay'?' Ссылка на оплату Kaspi ушла в чат.':d.st==='done'?' Чек пробит, начислено '+fmt(d.sum*.05)+' бонусов.':''));render()}

/* Клиенты */
let CL=[['Асель Б.','+7 701 *** 20 14','Золото',7,412000,3100],['Мадина К.','+7 747 *** 81 02','Серебро',3,148000,1240],['Ерлан С.','+7 705 *** 33 70','Серебро',2,79800,860],['Дана Т.','+7 777 *** 45 19','Новый',0,0,0]];
SC.clients=()=>`<div class="hd"><div><h2>Клиенты</h2><p>Один клиент — одна карточка: телефон, Instagram, покупки в обоих магазинах и на Kaspi, размер обуви, бонусы, переписка. Продавец на кассе находит клиента по телефону и видит его уровень.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Телефон</th><th>Уровень</th><th class="r">Покупок</th><th class="r">Сумма</th><th class="r">Бонусы</th></tr></thead><tbody>${CL.map(r=>`<tr onclick="card('cl','${r[0]}')" style="cursor:pointer"><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td>${tag(r[2],r[2]==='Золото'?'warn':r[2]==='Серебро'?'info':'')}</td><td class="r">${r[3]}</td><td class="r">${tg(r[4])}</td><td class="r">${fmt(r[5])}</td></tr>`).join('')}</tbody></table></div></div>`;
CARD.cl=n=>{const r=CL.find(x=>x[0]===n);return [r[0],r[1]+' · '+r[2],`<div class="kv"><span>Размер</span><b>38 · полнота стандарт</b></div><div class="kv"><span>Покупок</span><b>${r[3]} на ${tg(r[4])}</b></div><div class="kv"><span>Бонусы</span><b>${fmt(r[5])}</b></div><div class="kv"><span>Последняя покупка</span><b>Челси ШГ-2041 · Алматы</b></div><div class="kv"><span>Откуда пришла</span><b>Instagram · Reels «Челси на зиму»</b></div>
 <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="bt p" onclick="act('Сообщение «Новая коллекция в вашем размере 38» ушло в WhatsApp.')">Написать в WhatsApp</button></div>`]};

/* Лояльность */
let LV=[['Новый',0,3],['Серебро',100000,5],['Золото',300000,7]];
SC.loyal=()=>`<div class="hd"><div><h2>Программа лояльности</h2><p>Бонусы с каждой покупки, уровни по сумме покупок, списание бонусами до 30 % чека, день рождения, «приведи подругу». Работает одинаково в обоих магазинах и в чатах. Повторные покупки видны в пульте.</p></div></div>
 <div class="g3">${LV.map(l=>`<div class="pan"><h3>${l[0]}</h3><div class="kv"><span>Сумма покупок от</span><b>${tg(l[1])}</b></div><div class="kv"><span>Бонусы с покупки</span><b>${l[2]} %</b></div></div>`).join('')}</div>
 <div class="pan"><h3>Правила</h3><div class="kv"><span>Списание бонусами</span><b>до 30 % чека</b></div><div class="kv"><span>День рождения</span><b>+5 000 бонусов, сообщение в WhatsApp</b></div><div class="kv"><span>Приведи подругу</span><b>по 3 000 бонусов обеим</b></div><div class="kv"><span>Сгорание</span><b>через 6 месяцев без покупок, напоминание за 7 дней</b></div>
 <div style="margin-top:10px"><button class="bt" onclick="act('Правила лояльности меняются здесь — без программиста.')">Изменить правила</button></div></div>
 <div class="wid"><div><small>Участников</small><b>2 418</b><span>за 3 месяца</span></div><div><small>Повторные покупки</small><b>38 %</b><span>октябрь</span></div><div><small>Бонусов списано</small><b>${tg(284000)}</b><span>октябрь</span></div></div>
 ${tip('Сравните','Отдельные сервисы лояльности берут ежемесячную плату. Здесь программа встроена в кассу и чаты.')}`;

/* Касса */
let CART=[];
SC.pos=()=>{const sum=CART.reduce((t,c)=>t+c.pr,0),bon=Math.min(Math.round(sum*.3),3100);return `<div class="hd"><div><h2>Касса · магазин Алматы</h2><p>Касса на моноблоке у стойки: продавец сканирует QR с коробки или выбирает модель и размер, находит клиента по телефону, списывает бонусы, принимает карту, Kaspi QR или наличные. Остаток уменьшается сразу — в обоих магазинах и на Kaspi.</p></div></div>
 <div class="g2 g21"><div class="pan"><h3>Товары</h3><div class="shpos">${MD.map(m=>`<button onclick="addCart('${m.sku}')"><b>${m.n}</b><small>${m.sku} · ${tg(m.pr)}</small></button>`).join('')}</div></div>
 <div class="pan"><h3>Чек</h3>${CART.length?CART.map(c=>`<div class="kv"><span>${c.n} · ${c.size}</span><b>${tg(c.pr)}</b></div>`).join(''):'<p class="mut">Отсканируйте QR с коробки или нажмите на модель слева.</p>'}
  <div class="kv"><span>Клиент</span><b>Асель Б. · Золото · 3 100 бонусов</b></div>
  <div class="kv"><span>Списать бонусами</span><b>${CART.length?'− '+tg(bon):'—'}</b></div>
  <div class="kv" style="font-size:16px"><span><b>К оплате</b></span><b>${tg(Math.max(sum-(CART.length?bon:0),0))}</b></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${['Карта','Kaspi QR','Наличные'].map(x=>`<button class="bt ${x==='Kaspi QR'?'p':''}" onclick="payCart('${x}')">${x}</button>`).join('')}</div></div></div>
 ${said('Касса тоже через МойСклад, пробиваем через собственный телефон','Касса на моноблоке — стабильно и безопасно; отдельный модуль, 200 000 ₸.')}`};
function addCart(sku){const m=MD.find(x=>x.sku===sku);const i=m.a.findIndex(v=>v>0);if(i<0){toast('В Алматы этой модели нет — есть в Астане, можно сделать перемещение.');return}CART.push({n:m.n.split(' · ')[0],size:SZ[i],pr:m.pr,sku});toast(`${m.n.split(' · ')[0]}, ${SZ[i]} размер — в чеке.`);render()}
function payCart(w){if(!CART.length){toast('Чек пустой.');return}CART.forEach(c=>{const m=MD.find(x=>x.sku===c.sku);const i=SZ.indexOf(c.size);if(m.a[i]>0)m.a[i]--});toast(`Оплачено: ${w}. Чек отправлен клиенту в WhatsApp, остатки уменьшены, бонусы начислены.`);CART=[];render()}

/* Kaspi */
SC.kaspi=()=>`<div class="hd"><div><h2>Kaspi-магазин</h2><p>Заказы Kaspi падают в систему, остатки на Kaspi обновляются сами после каждой продажи в магазине — нет продаж того, чего уже нет. Видно, из какого магазина собрать заказ.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Заказ</th><th>Товар</th><th>Размер</th><th class="r">Сумма</th><th>Собрать в</th><th>Статус</th></tr></thead><tbody>${[['KS-88214','Кроссовки ШГ-2057',42,36900,'Алматы','Новый'],['KS-88209','Кеды ШГ-2072',37,24900,'Астана','Собран'],['KS-88201','Челси ШГ-2041',38,42900,'Алматы','Передан в доставку'],['KS-88190','Дутики ШГ-1931',36,19900,'Алматы','Выдан']].map(r=>`<tr><td class="mono">${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td><td class="r">${tg(r[3])}</td><td>${r[4]}</td><td>${tag(r[5],r[5]==='Новый'?'warn':r[5]==='Выдан'?'ok':'info')}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Синхронизация остатков</h3><div class="kv"><span>Последняя выгрузка на Kaspi</span><b>17:15 · каждые 15 минут</b></div><div class="kv"><span>Карточек на Kaspi</span><b>384</b></div><div class="kv"><span>Снято с продажи (нет остатка)</span><b>27</b></div></div>
 <div class="pan"><h3>Kaspi за октябрь</h3><div class="kv"><span>Заказов</span><b>208</b></div><div class="kv"><span>Выручка</span><b>${tg(6900000)}</b></div><div class="kv"><span>Комиссия Kaspi</span><b>${tg(828000)}</b></div></div></div>`;
/* Остатки по размерам */
SC.stock=()=>`<div class="hd"><div><h2>Остатки по размерам</h2><p>Каждая модель — сеткой размеров по магазинам. Сразу видно «дыры» в ходовых размерах и где пара лежит: в Алматы или в Астане. Красным — ходовой размер закончился, жёлтым — осталась одна пара.</p></div>${shopSw()}</div>
 <div class="pan"><div class="tw"><table class="t shgrid"><thead><tr><th>Модель</th>${SZ.map(z=>`<th class="r">${z}</th>`).join('')}<th class="r">Всего</th><th class="r">Цена</th></tr></thead><tbody>${MD.map(m=>`<tr><td><b>${m.n}</b><br><small class="mono mut">${m.sku}</small></td>${SZ.map((z,i)=>{const q=qty(m,i);return `<td class="r ${q===0&&(m.a[i]+m.s[i]===0)?'':q===0?'z0':q===1?'z1':''}">${q||'·'}</td>`}).join('')}<td class="r"><b>${tot(m)}</b></td><td class="r">${tg(m.pr)}</td></tr>`).join('')}</tbody></table></div>
 <div class="dpleg"><span><i class="dpdot block"></i>в этом магазине нет, в другом есть</span><span><i class="dpdot debt"></i>осталась 1 пара</span></div></div>
 ${tip('Заказ поставщику','Система считает, сколько пар каждого размера продаётся в неделю, и предлагает заказ: «Челси 39 — 6 пар, 40 — 4 пары». Заказ уходит поставщику из системы.')}
 ${said('Складской учёт через МойСклад; из Retail CRM не все данные переводились, большие разницы','Один учёт: касса, Kaspi и чаты списывают из одних остатков — разниц нет.')}`;

/* Приход и перемещения */
let MV=[['П-0412','Приход','Поставщик «Обувь-Опт» → Алматы','Зима · 148 пар','Принят'],['Т-0207','Перемещение','Алматы → Астана','Челси ШГ-2041 · 39, 40 · 4 пары','В пути'],['Т-0206','Перемещение','Астана → Алматы','Кроссовки ШГ-2057 · 43 · 1 пара','Создан'],['В-0031','Возврат','Клиент → Алматы','Лоферы ШГ-2063 · 42 · брак','Принят']];
SC.move=()=>`<div class="hd"><div><h2>Приход и перемещения</h2><p>Приход от поставщика с себестоимостью, перемещения между Алматы и Астаной, возвраты от клиентов. Каждый документ меняет остатки и себестоимость — финансы считаются верно.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Документ</th><th>Тип</th><th>Откуда → куда</th><th>Что</th><th>Статус</th><th></th></tr></thead><tbody>${MV.map((r,i)=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${tag(r[4],r[4]==='Принят'?'ok':r[4]==='В пути'?'info':'warn')}</td><td>${r[4]!=='Принят'?`<button class="bt p sm" onclick="mvNext(${i})">${r[4]==='Создан'?'Отправить':'Принять'}</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 <div style="margin-top:10px"><button class="bt" onclick="act('Новый приход: поставщик, модели, размеры, количество, себестоимость. Можно загрузить накладную Excel.')">+ Приход</button></div></div>`;
function mvNext(i){const r=MV[i];r[4]=r[4]==='Создан'?'В пути':'Принят';toast(`${r[0]}: «${r[4]}».`+(r[4]==='Принят'?' Остатки обновлены в обоих магазинах и на Kaspi.':''));render()}

/* Инвентаризация */
let INV={done:186,all:214,diff:[['ШГ-2057 · Кроссовки · 42','2','0','недостача 2'],['ШГ-2072 · Кеды · 37','3','4','излишек 1']]};
SC.inv=()=>`<div class="hd"><div><h2>Инвентаризация с QR</h2><p>Каждая коробка — с QR-этикеткой: модель, цвет, размер. Двое-трое сотрудников одновременно сканируют телефонами свои стеллажи, система сама сводит результат и показывает расхождения. Магазин не закрывается на день.</p></div></div>
 <div class="wid"><div><small>Отсканировано · Алматы</small><b class="a">${INV.done} из ${INV.all}</b><span>3 сотрудника · 42 минуты</span></div><div><small>Расхождений</small><b>${INV.diff.length}</b><span>на ${tg(61800)}</span></div><div><small>Последняя полная</small><b>01.10</b><span>Астана — 03.10</span></div></div>
 <div class="g2 g21"><div class="pan"><h3>Расхождения</h3><div class="tw"><table class="t"><thead><tr><th>Позиция</th><th class="r">По учёту</th><th class="r">Факт</th><th>Итог</th></tr></thead><tbody>${INV.diff.map(r=>`<tr><td><b>${r[0]}</b></td><td class="r">${r[1]}</td><td class="r">${r[2]}</td><td>${tag(r[3],r[3].startsWith('недостача')?'bad':'warn')}</td></tr>`).join('')}</tbody></table></div>
  <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="bt p" onclick="invScan()">Сканировать коробку</button><button class="bt" onclick="act('Акт инвентаризации собран: расхождения, кто сканировал, подпись. Остатки исправлены.')">Закрыть инвентаризацию</button></div></div>
 <div class="pan"><h3>QR-этикетка</h3><div class="shqr"><div class="shqrc">${Array.from({length:49},(_,i)=>`<i class="${[0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,10,16,24,30,38,18,22,26,32].includes(i)?'on':''}"></i>`).join('')}</div><div><b>ШГ-2041 · Челси</b><span>чёрные · кожа · 39</span><span class="mono">42 900 ₸</span></div></div>
 <button class="bt" style="margin-top:10px" onclick="act('Печать этикеток для прихода П-0412: 148 штук на термопринтере.')">Печать этикеток</button></div></div>
 ${said('Инвентаризацию сделаем, QR-коды, если нужны','В МиксБьюти 3–4 человека одновременно делают инвентаризацию — так же сделаем у вас.')}`;
function invScan(){if(INV.done>=INV.all){toast('Всё отсканировано.');return}INV.done++;toast(`Отсканировано: ШГ-2041 · Челси · 39. ${INV.done} из ${INV.all}.`);render()}

/* Переход */
SC.migr=()=>`<div class="hd"><div><h2>Переход с МойСклад</h2><p>Переносим всё, что есть: модели и размеры, остатки по магазинам, себестоимость, клиентов и историю продаж. Работаете в МойСклад до дня переключения, потом — в новой системе. Сверяем остатки до и после.</p></div></div>
 <div class="dpflow">${['Выгрузка из МойСклад','Перенос моделей, размеров, цен','Остатки и себестоимость','Клиенты и история продаж','Сверка и переключение'].map((x,i)=>`<div><small>${i+1}</small><b>${x}</b></div>`).join('')}</div>
 <div class="g2"><div class="pan"><h3>Что переносим</h3>${[['Моделей и размеров','≈ 1 900 позиций'],['Остатки','оба магазина'],['Клиенты','с телефонами и покупками'],['История продаж','за 12 месяцев']].map(r=>`<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>
 <div class="pan"><h3>От чего отказываетесь</h3><div class="kv"><span>МойСклад</span><b>не нужен</b></div><div class="kv"><span>Retail CRM, Битрикс, amoCRM</span><b>не нужны</b></div><div class="kv"><span>Power BI</span><b>отчёты внутри системы</b></div></div></div>
 ${said('До этого работали через Retail CRM — поняли, что складской учёт через МойСклад; смотрели Битрикс','Всё в одном окне: CRM, склад, касса, финансы и пульт — без мешанины программ.')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и этапы</h2><p>Стандартный пакет разработки и касса отдельным модулем. Система ваша: код, сервер и данные у вас, без абонплаты за пользователей и магазины.</p></div></div>
 <div class="pk1"><div><small>Пакет + касса</small><b>2 000 000 ₸</b><span>стандартный пакет 1 800 000 ₸ + касса 200 000 ₸</span></div><div><small>Срок</small><b>4–6 недель</b><span>первая версия через 10 дней</span></div></div>
 <div class="pay3"><div><small>1 · Старт · 10%</small><b>200 000 ₸</b><span>договорились — начинаем, выгружаем МойСклад</span></div><div><small>2 · Ядро · 45%</small><b>900 000 ₸</b><span>чаты, воронка, склад, касса работают на сервере — вы утвердили</span></div><div><small>3 · Полировка и сдача · 45%</small><b>900 000 ₸</b><span>лояльность, инвентаризация, отчёты, Kaspi; код и ключи — ваши</span></div></div>
 <div class="g2"><div class="pan"><h3>Входит</h3>${['WhatsApp, Instagram, звонки — одна лента','Воронка, клиенты, программа лояльности','Остатки по размерам, приход, перемещения','Инвентаризация с QR и этикетки','Kaspi-магазин: заказы и остатки','Финансы, реклама и креативы, пульт','Перенос из МойСклад, 3 месяца сопровождения'].map(x=>`<div class="kv"><span>${x}</span><b>✓</b></div>`).join('')}</div>
 <div class="pan"><h3>Отдельно</h3><div class="kv"><span>WhatsApp (Green API)</span><b>≈ 5 000 ₸ в месяц вместо 36 000</b></div><div class="kv"><span>Сервер</span><b>≈ 15–30 $ в месяц</b></div><div class="kv"><span>Моноблоки для касс</span><b>покупаете сами</b></div><div class="kv"><span>Доработки после сдачи</span><b>20 $ в час</b></div></div></div>
 ${tip('Работаем вместе','Каждую неделю — 1–2 зума: показываем новую версию, вы принимаете или правите. В пакете запас 10–15 % на то, что всплывёт по ходу.')}`;

/* Каркас */
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const m=MD.find(x=>(x.sku+x.n).toLowerCase().includes(v));if(m&&v&&allowed('stock')){go('stock');toast(`${m.n}: всего ${tot(m)} пар.`);return}const c=CL.find(x=>(x[0]+x[1]).toLowerCase().includes(v));if(c&&v&&allowed('clients')){go('clients');card('cl',c[0]);return}toast('Ищите по модели, артикулу или клиенту: «челси», «ШГ-2057», «Асель».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Собственник';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">ШАГОМ</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='inbox'?'<em>'+INB.filter(r=>r[5]).length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['inbox','Чаты'],['pos','Касса'],['stock','Остатки'],['funnel','Заявки'],['inv','Инвент.']].filter(x=>allowed(x[0])).slice(0,5).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'ШАГОМ';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт собственников: выручка, чаты, покупки, прибыль.'],
 ['inbox','2 · WhatsApp, Instagram и звонки — одна лента, с креативом.'],
 ['funnel','3 · Из чата в покупку: размер, резерв, оплата, выдача.'],
 ['stock','4 · Остатки сеткой размеров по магазинам.'],
 ['pos','5 · Касса на моноблоке: QR, бонусы, Kaspi QR.'],
 ['inv','6 · Инвентаризация с QR — несколько человек сразу.'],
 ['loyal','7 · Программа лояльности в кассе и чатах.'],
 ['money','8 · Прибыль, движение денег, платежи поставщикам.'],
 ['launch','9 · 2 000 000 ₸ с кассой, 4–6 недель.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
