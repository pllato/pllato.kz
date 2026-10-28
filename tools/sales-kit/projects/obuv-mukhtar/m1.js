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
