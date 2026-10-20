/* Tigers — магазин товаров для отдыха, рыбалки и охоты (Алматы): заявки из Instagram, TikTok, WhatsApp в одном окне, воронка заказов, заказ из того, что есть на складе, резерв, оплата, сборка, доставка; касса точки, две точки продаж, остатки, приход и закуп, инвентаризация камерой, комплекты, продажи и маржа, контент → заявки, команда, расходы. Все клиенты, заказы и суммы вымышленные. */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt=n=>new Intl.NumberFormat('ru-RU').format(Math.round(n));
const tg=n=>fmt(n)+' ₸';
const TODAY='20.10.2026',NOW='15:10';
const LOGO_I='<img src="/app/img/tigers/logo.jpg" width="28" height="28" alt="" style="border-radius:50%;border:1.5px solid var(--brand2,#e8862a);object-fit:cover;display:block">';
const said=(q,a)=>`<div class="said"><b>Вы сказали на встрече</b><i>«${q}»</i>${a?`<div class="said-a">${a}</div>`:''}</div>`;
const tip=(h,t)=>`<div class="said bz-tip"><b>${h}</b><div class="said-a" style="margin-top:2px">${t}</div></div>`;

const SEC=[
 {k:'top',n:'Главное',sub:[['dash','Пульт собственника']]},
 {k:'sl',n:'Онлайн-продажи',sub:[['inbox','Заявки: Instagram, TikTok, WhatsApp'],['funnel','Воронка заказов'],['order','Карточка заказа'],['clients','Клиенты']]},
 {k:'pt',n:'Точки продаж',sub:[['pos','Касса точки'],['shops','Точки и перемещения']]},
 {k:'wh',n:'Склад',sub:[['stock','Остатки'],['receipt','Приход и закуп'],['invent','Инвентаризация'],['kits','Комплекты']]},
 {k:'an',n:'Цифры',sub:[['reports','Продажи и маржа'],['content','Видео → заявки']]},
 {k:'tm',n:'Команда и запуск',sub:[['team','Сотрудники и задачи'],['costs','Расходы: сейчас и после'],['launch','Стоимость и запуск']]}
];
const SECOF={},SUBN={};SEC.forEach(s=>s.sub.forEach(x=>{SECOF[x[0]]=s.k;SUBN[x[0]]=x[1]}));
const ALL=[];SEC.forEach(s=>s.sub.forEach(x=>ALL.push(x[0])));
const ROLES={
 'Руководитель':{av:'МГ',n:'Миндегали',note:'Всё: заказы, склад, точки, цифры, команда',s:ALL.slice()},
 'Менеджер онлайн-продаж':{av:'МН',n:'Алибек',note:'Заявки из соцсетей, воронка, заказы, клиенты, остатки',s:['inbox','funnel','order','clients','stock','kits']},
 'Склад и закуп':{av:'СК',n:'Даурен',note:'Приход, закуп, остатки, сборка заказов, инвентаризация',s:['funnel','order','stock','receipt','invent','shops','kits']},
 'Продавец точки':{av:'ПР',n:'Айбек · точка у Барахолки',note:'Касса, остатки своей точки, перемещения',s:['pos','stock','shops']},
 'Контент':{av:'КН',n:'SMM',note:'Видео, публикации, сколько заявок принесло',s:['content','inbox']}
};
let role='Руководитель',cur='dash',theme='light';

const CH={ig:['Instagram','#c13584'],tt:['TikTok','#111111'],wa:['WhatsApp','#1f9a56'],yt:['YouTube','#d22'],off:['Точка','#8a5a2b'],kaspi:['Kaspi','#e5332a']};
const chTag=k=>`<span class="srct" style="--sc:${CH[k][1]}">${CH[k][0]}</span>`;
/* Товары: артикул, название, категория, цена, себестоимость, остаток по точкам [склад, точка Барахолка, точка город] */
let GOODS=[
 ['TG-101','Палатка 4-местная «Камчатка 4»','Палатки',89000,56000,[14,3,0]],
 ['TG-102','Палатка 2-местная «Трекинг 2»','Палатки',42000,26000,[9,2,0]],
 ['TG-105','Шатёр-кухня 3×3 м','Палатки',118000,74000,[2,1,0]],
 ['TG-210','Раскладушка алюминиевая','Мебель',24000,13500,[22,6,0]],
 ['TG-215','Кресло складное с подлокотниками','Мебель',14500,7800,[31,8,0]],
 ['TG-220','Стол складной 120 см','Мебель',19000,10500,[0,2,0]],
 ['TG-305','Газовая плитка портативная','Газ',12500,6900,[18,5,0]],
 ['TG-310','Газовый баллон цанговый 450 г','Газ',1800,950,[140,36,0]],
 ['TG-320','Газовый обогреватель для палатки','Газ',21000,12400,[3,0,0]],
 ['TG-410','Спальник -10°C','Сон',27000,15800,[12,4,0]],
 ['TG-505','Набор для рыбалки «Старт»','Рыбалка',33000,19500,[7,1,0]],
 ['TG-610','Фонарь кемпинговый аккумуляторный','Свет',8500,4300,[46,12,0]]
];
const GD=a=>GOODS.find(g=>g[0]===a);
const total=g=>g[5].reduce((a,b)=>a+b,0);
/* Заказы */
const OST=[['new','Заявка','#7a8792'],['talk','Консультация','#2f6fb0'],['res','Резерв','#b0731a'],['paid','Оплачен','#1f8a5b'],['pack','Сборка','#6b5bd3'],['ship','Доставка / самовывоз','#0a8aa0'],['done','Выдан','#3d4a55']];
const OS=k=>OST.find(s=>s[0]===k);
let ORD=[
 {id:'З-1284',cl:'Ерлан К.',ph:'+7 701 *** 42 10',ch:'ig',st:'res',items:[['TG-101',1],['TG-210',2],['TG-310',4]],dlv:'Доставка по Алматы · 21.10',m:'Алибек',vid:'Рилс «Палатка за 3 минуты»',late:false},
 {id:'З-1285',cl:'Айгуль Б.',ph:'+7 777 *** 18 55',ch:'tt',st:'talk',items:[['TG-105',1],['TG-215',4]],dlv:'Самовывоз · точка у Барахолки',m:'Алибек',vid:'TikTok «Кухня на природе»',late:true},
 {id:'З-1286',cl:'Марат Т.',ph:'+7 705 *** 77 31',ch:'wa',st:'paid',items:[['TG-505',1],['TG-610',2]],dlv:'Казпочта · Караганда',m:'Алибек',vid:'—',late:false},
 {id:'З-1287',cl:'Семья Нурлановых',ph:'+7 702 *** 64 08',ch:'ig',st:'new',items:[['TG-101',1],['TG-410',4]],dlv:'—',m:'—',vid:'Рилс «Семейный кемпинг»',late:true},
 {id:'З-1281',cl:'Данияр С.',ph:'+7 707 *** 50 12',ch:'ig',st:'pack',items:[['TG-102',1],['TG-305',1],['TG-310',6]],dlv:'Доставка · 20.10 вечер',m:'Алибек',vid:'Рилс «Палатка за 3 минуты»',late:false},
 {id:'З-1279',cl:'Олжас Р.',ph:'+7 747 *** 26 90',ch:'tt',st:'ship',items:[['TG-320',1],['TG-410',2]],dlv:'Курьер · в пути',m:'Алибек',vid:'TikTok «Тепло в палатке»',late:false},
 {id:'З-1276',cl:'Руслан А.',ph:'+7 701 *** 18 03',ch:'off',st:'done',items:[['TG-215',2],['TG-220',1]],dlv:'Выдан на точке',m:'Айбек',vid:'—',late:false},
 {id:'З-1288',cl:'Асель М.',ph:'+7 776 *** 31 44',ch:'wa',st:'new',items:[['TG-220',2]],dlv:'—',m:'—',vid:'—',late:false}
];
const OD=id=>ORD.find(o=>o.id===id);
let curOrd='З-1284';
const osum=o=>o.items.reduce((a,i)=>a+GD(i[0])[3]*i[1],0);
let AUDIT=[];
const SC={};
const tag=(t,c)=>`<span class="tag ${c||''}">${t}</span>`;
const oTag=k=>{const s=OS(k);return `<span class="srct" style="--sc:${s[2]}">${s[1]}</span>`};
function bars(rows){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(r=>`<div class="hb"><span>${r[0]}</span><i style="width:${r[1]/mx*100}%"></i><b>${r[2]||fmt(r[1])}</b></div>`).join('')}
function openOrd(id){curOrd=id;go('order')}
const low=()=>GOODS.filter(g=>total(g)<=3);

/* Пульт */
SC.dash=()=>`<div class="hd"><div><h2>Пульт собственника · ${TODAY}</h2><p>То, что сейчас «только в голове»: сколько продали сегодня онлайн и на точке, сколько заявок пришло и откуда, что заканчивается на складе, сколько денег и какая маржа.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('reports')"><small>Продажи сегодня</small><b>${tg(612400)}</b><span>онлайн 418 000 · точка 194 400</span></div>
  <div class="clk" onclick="go('inbox')"><small>Новых заявок</small><b class="a">27</b><span>Instagram 16 · TikTok 7 · WhatsApp 4</span></div>
  <div class="clk" onclick="go('funnel')"><small>Заказов в работе</small><b>${ORD.filter(o=>o.st!=='done').length}</b><span>${ORD.filter(o=>o.late).length} ждут ответа дольше 15 минут</span></div>
  <div class="clk" onclick="go('stock')"><small>Заканчивается</small><b class="w">${low().length}</b><span>товаров ≤ 3 шт. — в закуп</span></div>
  <div class="clk" onclick="go('reports')"><small>Маржа за октябрь</small><b class="g">41%</b><span>выручка ${tg(9840000)}</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Продажи за неделю, тыс. ₸</h3>${bars([['Понедельник',486],['Вторник',522],['Среда',398],['Четверг',611],['Пятница',734],['Суббота',1120],['Воскресенье',968]].map(r=>[r[0],r[1],fmt(r[1])]))}
  <h3 style="margin-top:14px">Откуда заказы за октябрь</h3>${bars([['Instagram',214],['TikTok',96],['WhatsApp (повторные)',58],['Точка — пришли сами',131],['Kaspi',9]])}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('inbox')"><i></i><div><b>2 заявки ждут ответа больше 15 минут</b><span>семья Нурлановых (Instagram), Айгуль Б. (TikTok)</span></div></div>
  <div class="rf bad" onclick="go('stock')"><i></i><div><b>Стол складной 120 см — на складе 0</b><span>2 шт. на точке · 2 заказа ждут</span></div></div>
  <div class="rf" onclick="go('receipt')"><i></i><div><b>Приход от поставщика — завтра</b><span>палатки и шатры, 64 позиции</span></div></div>
  <div class="rf" onclick="go('shops')"><i></i><div><b>Новая точка в городе — подготовить товар</b><span>перемещение 120 позиций со склада</span></div></div>
  <div class="rf" onclick="go('content')"><i></i><div><b>Рилс «Палатка за 3 минуты» — 38 заявок</b><span>лучшее видео месяца</span></div></div></div></div>
 ${said('Мы никакой учёт по факту не ведём — цифры не видим, остатки не видим, приходы не видим, всё в голове')}`;

/* Заявки */
let INB=[
 ['ig','Семья Нурлановых','12:58','Здравствуйте! Палатка 4-местная есть в наличии? И спальники на 4 человек — сколько всё вместе?','Рилс «Семейный кемпинг»','З-1287'],
 ['tt','Айгуль Б.','12:41','Шатёр-кухня ещё есть? Нужен на выходные, заберу сама','TikTok «Кухня на природе»','З-1285'],
 ['wa','Асель М.','12:30','Добрый день, 2 стола складных можно заказать?','—','З-1288'],
 ['ig','@arman_fishing','12:12','А набор для рыбалки с доставкой в Талдыкорган?','Рилс «Рыбалка на Капшагае»',''],
 ['yt','Комментарий YouTube','11:50','Где купить такую плитку?','YouTube «Обзор газовых плиток»','']
];
SC.inbox=()=>`<div class="hd"><div><h2>Заявки: Instagram, TikTok, WhatsApp</h2><p>Все сообщения из соцсетей и WhatsApp — в одном окне, без переключения между телефонами. Менеджер отвечает отсюда, видит, есть ли товар на складе, и одним нажатием превращает переписку в заказ. Система запоминает, с какого видео пришёл клиент.</p></div></div>
 <div class="g2 g21"><div class="pan"><div class="tw"><table class="t"><thead><tr><th>Канал</th><th>Клиент</th><th>Время</th><th>Сообщение</th><th>С какого видео</th><th></th></tr></thead><tbody>${INB.map((m,i)=>`<tr class="${i<2?'rowwarn':''}"><td>${chTag(m[0]==='yt'?'yt':m[0])}</td><td><b>${esc(m[1])}</b></td><td class="mono">${m[2]}</td><td>${esc(m[3])}</td><td>${esc(m[4])}</td><td>${m[5]?`<a class="clk mono" onclick="openOrd('${m[5]}')">${m[5]}</a>`:`<button class="bt sm p" onclick="act('Заказ создан из переписки: клиент, канал и видео подставлены сами.')">+ заказ</button>`}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Семья Нурлановых · Instagram</h3><div class="msgs"><div class="mg"><small>12:58 · клиент</small>Здравствуйте! Палатка 4-местная есть в наличии? И спальники на 4 человек — сколько всё вместе?</div><div class="mg mout"><small>подсказка системы</small>«Камчатка 4» — 17 шт., спальник −10°C — 16 шт. Вместе: 89 000 + 4 × 27 000 = <b>197 000 ₸</b>. Предложите комплект «Семейный выезд».</div></div><div class="qin"><input placeholder="Ответ в Instagram"><button class="bt p" onclick="act('Ответ ушёл в Instagram, переписка сохранена в карточке клиента.')">Отправить</button></div>
  <div class="btns l"><button class="bt sm" onclick="openOrd('З-1287')">Открыть заказ</button><button class="bt sm" onclick="go('kits')">Комплекты</button></div></div></div>
 ${said('Основной поток заявок — Instagram, TikTok, YouTube, Threads. Органика: сняли видео — клиент заинтересовался — пишет')}`;

/* Воронка */
SC.funnel=()=>`<div class="hd"><div><h2>Воронка заказов</h2><p>Каждая заявка проходит одинаковый путь — от первого сообщения до выдачи товара. Так процесс стандартизирован: новый сотрудник видит, что делать дальше, а руководитель — где застряло. Резерв снимает товар со свободного остатка.</p></div><div class="btns"><button class="bt p" onclick="act('Новый заказ: клиент, канал, товары со склада.')">+ Заказ</button></div></div>
 <div class="kb k7">${OST.map(s=>`<div class="kc" style="--sc:${s[2]}"><div class="kh"><b>${s[1]}</b><span>${ORD.filter(o=>o.st===s[0]).length}</span></div>${ORD.filter(o=>o.st===s[0]).map(o=>`<div class="kd ${o.late?'alarm':''}" onclick="openOrd('${o.id}')"><div class="kt"><b>${o.id}</b>${chTag(o.ch)}</div><div class="kr">${esc(o.cl)}</div><div class="km">${o.items.map(i=>GD(i[0])[1].split(' ').slice(0,2).join(' ')+' ×'+i[1]).join(', ')}</div><div class="km mono">${tg(osum(o))}</div>${s[0]!=='done'?`<div class="kf"><span>${o.m}</span><a class="mvb" onclick="event.stopPropagation();oNext('${o.id}')">дальше →</a></div>`:''}</div>`).join('')||'<div class="kempty">пусто</div>'}</div>`).join('')}</div>
 ${said('От получения заявки до выдачи заказа процессов много — их мы хотим стандартизировать')}`;
function oNext(id){const o=OD(id),i=OST.findIndex(s=>s[0]===o.st);if(i<OST.length-1){o.st=OST[i+1][0];o.late=false;render();toast(`${o.id} → «${OST[i+1][1]}».${o.st==='res'?' Товар зарезервирован на складе.':o.st==='paid'?' Оплата Kaspi привязана к заказу.':o.st==='pack'?' Кладовщик получил лист сборки.':o.st==='done'?' Остатки списаны, продажа в отчётах.':''}`)}}

/* Карточка заказа */
SC.order=()=>{const o=OD(curOrd),i=OST.findIndex(s=>s[0]===o.st);
 return `<div class="hd"><div><h2>${o.id} · ${esc(o.cl)}</h2><p>${o.ph} · ${CH[o.ch][0]} · менеджер ${o.m} · пришёл с видео: ${esc(o.vid)}</p></div><div class="btns"><button class="bt" onclick="go('funnel')">← Воронка</button><button class="bt" onclick="act('Ссылка на оплату Kaspi отправлена клиенту.')">Ссылка на оплату</button><button class="bt p" onclick="oNext('${o.id}')">Следующий этап →</button></div></div>
 <div class="stp" style="grid-template-columns:repeat(7,1fr)">${OST.map((s,k)=>`<div class="${k===i?'on':k<i?'ok':''}" style="--sc:${s[2]}"><i>${k+1}</i>${s[1]}</div>`).join('')}</div>
 <div class="g2 g21"><div class="pan"><h3>Товары — только то, что есть</h3><div class="tw"><table class="t"><thead><tr><th>Товар</th><th>Кол-во</th><th>Свободно</th><th style="text-align:right">Цена</th><th style="text-align:right">Сумма</th></tr></thead><tbody>${o.items.map(it=>{const g=GD(it[0]);const fr=total(g);return `<tr class="${fr<it[1]?'rowbad':''}"><td><b>${g[1]}</b><br><small class="mono">${g[0]}</small></td><td class="mono">${it[1]}</td><td class="mono ${fr<it[1]?'neg':''}">${fr} шт.${fr<it[1]?' · не хватает':''}</td><td class="mono" style="text-align:right">${fmt(g[3])}</td><td class="mono" style="text-align:right">${fmt(g[3]*it[1])}</td></tr>`}).join('')}<tr><td colspan="4"><b>Итого</b></td><td class="mono" style="text-align:right"><b>${tg(osum(o))}</b></td></tr></tbody></table></div>
  <div class="btns l" style="margin-top:8px"><button class="bt sm" onclick="act('Поиск товара по складу: название, артикул, категория — видно остаток по точкам.')">+ Товар со склада</button><button class="bt sm" onclick="go('kits')">+ Комплект</button></div>
  <h3 style="margin-top:14px">Доставка</h3><div class="kv"><span>Способ</span><b>${o.dlv}</b></div><div class="kv"><span>Сборка</span><b>склад · лист сборки уходит кладовщику</b></div></div>
 <div class="pan"><h3>Оплата</h3><div class="kv"><span>Сумма</span><b>${tg(osum(o))}</b></div><div class="kv"><span>Способ</span><b>Kaspi QR / перевод / наличные</b></div><div class="kv"><span>Статус</span><b>${['paid','pack','ship','done'].includes(o.st)?'<span class="pos">оплачено</span>':'ждём оплату'}</b></div>
  <h3 style="margin-top:12px">Переписка</h3><div class="cm"><small>${CH[o.ch][0]} · клиент</small>Здравствуйте, это есть в наличии?</div><div class="cm"><small>${o.m}</small>Да, всё в наличии, резервирую за вами до завтра.</div>
  <div class="pin">Клиент: 2-й заказ · прошлый — сентябрь, 46 000 ₸</div></div></div>
 ${said('Продавать то, что есть на складе','Резерв снимает товар со свободного остатка — никто не продаст одну палатку дважды.')}`};

/* Клиенты */
SC.clients=()=>`<div class="hd"><div><h2>Клиенты</h2><p>Все, кто писал и покупал, — с каналом, историей заказов и интересом: семейный отдых, рыбалка, охота. По этим группам удобно делать рассылки к сезону и предлагать новые товары тем, кому они нужны.</p></div><div class="btns"><button class="bt" onclick="act('Рассылка в WhatsApp выбранной группе — например, рыбакам перед сезоном.')">Рассылка группе</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Клиент</th><th>Канал</th><th>Интерес</th><th>Заказов</th><th style="text-align:right">Сумма</th><th>Последний</th></tr></thead><tbody>${[['Ерлан К.','ig','семейный кемпинг',3,212000,'20.10'],['Марат Т.','wa','рыбалка',5,184500,'19.10'],['Олжас Р.','tt','зимний отдых',2,75000,'18.10'],['Руслан А.','off','кемпинг',1,48000,'17.10'],['Айгуль Б.','tt','кухня на природе',1,0,'сегодня — заявка'],['@arman_fishing','ig','рыбалка',0,0,'сегодня — заявка']].map(r=>`<tr><td><b>${r[0]}</b></td><td>${chTag(r[1])}</td><td>${r[2]}</td><td class="mono">${r[3]}</td><td class="mono" style="text-align:right">${fmt(r[4])}</td><td class="mono">${r[5]}</td></tr>`).join('')}</tbody></table></div></div>`;
/* Касса точки */
let CART=[['TG-215',2],['TG-310',4],['TG-610',1]];
SC.pos=()=>{const s=CART.reduce((a,c)=>a+GD(c[0])[3]*c[1],0);
 return `<div class="hd"><div><h2>Касса точки · у Барахолки</h2><p>Продавец пробивает продажу здесь: товар списывается с остатка точки, чек уходит в онлайн-кассу (Webkassa или ваша), продажа сразу видна в отчётах. Больше не нужно вечером переписывать продажи в Excel.</p></div></div>
 <div class="g2 g21"><div class="pan"><div class="bz-ci"><input placeholder="Сканируйте штрихкод или введите название" value="кресло"><button class="bt p" onclick="posAdd()">Добавить</button></div>
  <div class="tw"><table class="t"><thead><tr><th>Товар</th><th>Кол-во</th><th>На точке</th><th style="text-align:right">Цена</th><th style="text-align:right">Сумма</th></tr></thead><tbody>${CART.map(c=>{const g=GD(c[0]);return `<tr><td><b>${g[1]}</b></td><td class="mono">${c[1]}</td><td class="mono">${g[5][1]}</td><td class="mono" style="text-align:right">${fmt(g[3])}</td><td class="mono" style="text-align:right">${fmt(g[3]*c[1])}</td></tr>`}).join('')}<tr><td colspan="4"><b>К оплате</b></td><td class="mono" style="text-align:right"><b>${tg(s)}</b></td></tr></tbody></table></div>
  <div class="btns l" style="margin-top:10px"><button class="bt p" onclick="posPay('Kaspi QR')">Kaspi QR</button><button class="bt" onclick="posPay('картой')">Картой</button><button class="bt" onclick="posPay('наличными')">Наличными</button></div></div>
 <div class="pan"><h3>Смена · Айбек</h3><div class="kv"><span>Открыта</span><b>10:00</b></div><div class="kv"><span>Чеков</span><b>14</b></div><div class="kv"><span>Выручка</span><b>${tg(194400)}</b></div><div class="kv"><span>Kaspi / карта / наличные</span><b>128 / 31 / 35 тыс.</b></div><div class="kv"><span>Возвратов</span><b>0</b></div><div class="btns l"><button class="bt sm" onclick="act('Смена закрыта: Z-отчёт, сверка наличных, итоги дня — руководителю.')">Закрыть смену</button></div></div></div>
 ${said('Будут продавцы на точке — через кассовый аппарат продажи пробивать')}`};
function posAdd(){CART.push(['TG-215',1]);render();toast('Кресло добавлено. Остаток точки уменьшится после оплаты.')}
function posPay(m){const s=CART.reduce((a,c)=>a+GD(c[0])[3]*c[1],0);CART.forEach(c=>{const g=GD(c[0]);g[5][1]=Math.max(0,g[5][1]-c[1])});CART=[];render();toast(`Оплачено ${m}: ${tg(s)}. Чек отправлен в онлайн-кассу, остатки точки списаны.`)}

/* Точки и перемещения */
SC.shops=()=>`<div class="hd"><div><h2>Точки и перемещения</h2><p>Склад, точка у Барахолки и новая точка в городе — у каждой свои остатки и свои продавцы. Перемещение со склада на точку — документом: отправили, приняли, остатки поменялись у обоих. Открытие новой точки — это просто ещё одна точка в системе.</p></div><div class="btns"><button class="bt p" onclick="act('Перемещение: откуда, куда, товары — точка подтверждает приём.')">+ Перемещение</button></div></div>
 <div class="g3 bz-shops">${[['Склад','основной · приход и закуп','Даурен',GOODS.reduce((a,g)=>a+g[5][0],0),'работает'],['Точка у Барахолки','офлайн-продажи · касса','Айбек',GOODS.reduce((a,g)=>a+g[5][1],0),'работает'],['Точка в городе','скоро открытие','набираем 2 продавцов',GOODS.reduce((a,g)=>a+g[5][2],0),'готовим']].map(s=>`<div class="pan"><h3>${s[0]}</h3><div class="kv"><span>Назначение</span><b>${s[1]}</b></div><div class="kv"><span>Ответственный</span><b>${s[2]}</b></div><div class="kv"><span>Товаров, шт.</span><b class="mono">${fmt(s[3])}</b></div><div class="kv"><span>Статус</span><b>${s[4]}</b></div></div>`).join('')}</div>
 <div class="pan"><h3>Перемещения</h3><div class="tw"><table class="t"><thead><tr><th>№</th><th>Откуда → куда</th><th>Позиций</th><th>Статус</th></tr></thead><tbody>${[['ПМ-041','Склад → Точка в городе','120','готовим к открытию'],['ПМ-040','Склад → Точка у Барахолки','18','принято 19.10'],['ПМ-039','Точка у Барахолки → Склад','2','возврат брака · принято']].map(r=>`<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td class="mono">${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table></div></div>
 ${said('Сейчас выстроить систему вокруг одной точки, чтобы потом масштабировать корректно: откроем точку в городе — людей обучить, чтобы приходы и движение товара были учтены')}`;

/* Остатки */
let sf='all';
SC.stock=()=>{let L=GOODS.slice();if(sf==='low')L=L.filter(g=>total(g)<=3);if(sf!=='all'&&sf!=='low')L=L.filter(g=>g[2]===sf);
 return `<div class="hd"><div><h2>Остатки</h2><p>Около 2 000 товаров — с остатком по складу и каждой точке, ценой, себестоимостью и маржой. Что заканчивается — подсвечено и попадает в список закупа. Вместо таблицы, где учтено только 350 позиций.</p></div><div class="btns"><button class="bt" onclick="act('Загрузка товаров из Excel — артикул, название, категория, цена, себестоимость.')">⇪ Из Excel</button></div></div>
 <div class="seg"><a class="${sf==='all'?'on':''}" onclick="sf='all';render()">Все</a><a class="${sf==='low'?'on':''}" onclick="sf='low';render()">Заканчивается</a>${['Палатки','Мебель','Газ','Сон','Рыбалка','Свет'].map(c=>`<a class="${sf===c?'on':''}" onclick="sf='${c}';render()">${c}</a>`).join('')}</div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Артикул</th><th>Товар</th><th>Категория</th><th>Склад</th><th>Барахолка</th><th>Город</th><th>Всего</th><th style="text-align:right">Цена</th><th>Маржа</th></tr></thead><tbody>${L.map(g=>`<tr class="${total(g)<=3?'rowwarn':''}"><td class="mono">${g[0]}</td><td><b>${g[1]}</b></td><td>${g[2]}</td>${g[5].map(v=>`<td class="mono ${v===0?'neg':''}">${v}</td>`).join('')}<td class="mono"><b>${total(g)}</b></td><td class="mono" style="text-align:right">${fmt(g[3])}</td><td class="mono">${Math.round((g[3]-g[4])/g[3]*100)}%</td></tr>`).join('')}</tbody></table></div></div>`};

/* Приход и закуп */
SC.receipt=()=>`<div class="hd"><div><h2>Приход и закуп</h2><p>Ответственный за склад видит, что заканчивается и что продаётся быстрее, — и формирует заказ поставщику. Пришёл товар — приход по накладной: количество, себестоимость, остатки обновились, расход на доставку распределён.</p></div><div class="btns"><button class="bt p" onclick="act('Приход: поставщик, накладная, товары — можно загрузить из Excel поставщика.')">+ Приход</button></div></div>
 <div class="g2"><div class="pan"><h3>Предложение к закупу</h3><div class="tw"><table class="t"><thead><tr><th>Товар</th><th>Остаток</th><th>Продано за 30 дней</th><th>Заказать</th></tr></thead><tbody>${[['Стол складной 120 см',2,14,20],['Газовый обогреватель для палатки',3,11,15],['Шатёр-кухня 3×3 м',3,9,10],['Палатка 2-местная «Трекинг 2»',11,26,25]].map(r=>`<tr class="${r[1]<=3?'rowwarn':''}"><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td><td class="mono"><b>${r[3]}</b></td></tr>`).join('')}</tbody></table></div><div class="btns l" style="margin-top:8px"><button class="bt sm p" onclick="act('Заказ поставщику сформирован — PDF или сообщение в WhatsApp.')">Заказ поставщику</button></div></div>
 <div class="pan"><h3>Приходы</h3>${[['ПР-118','завтра','Поставщик палаток, Китай','64 поз.','в пути'],['ПР-117','14.10','Газ и плитки, Алматы','12 поз.','принято · 1 расхождение'],['ПР-116','08.10','Мебель кемпинговая','30 поз.','принято']].map(r=>`<div class="fc ${r[4].startsWith('в пути')?'w':r[4].includes('расхожд')?'r':'g'}"><b>${r[0]} · ${r[2]}</b><span>${r[4]}</span><em>${r[1]} · ${r[3]}</em></div>`).join('')}</div></div>
 ${said('Человек, ответственный за склад, отвечает за приход, за закуп, за хранение товара')}`;

/* Инвентаризация */
let INV=[['TG-101','Палатка «Камчатка 4»',14,14],['TG-210','Раскладушка алюминиевая',22,21],['TG-310','Газовый баллон 450 г',140,138],['TG-610','Фонарь кемпинговый',46,46],['TG-215','Кресло складное',31,null]];
SC.invent=()=>`<div class="hd"><div><h2>Инвентаризация</h2><p>Сотрудники считают товар телефоном: камера читает штрихкод, количество вводится одной кнопкой. Несколько человек считают одновременно разные зоны. В конце — расхождения с учётом, их причины и корректировка одним документом.</p></div><div class="btns"><button class="bt p" onclick="act('Новая инвентаризация: склад или точка, зоны, кто считает.')">+ Инвентаризация</button></div></div>
 <div class="g2 g21"><div class="pan"><h3>ИНВ-012 · Склад · идёт сейчас</h3><div class="tw"><table class="t"><thead><tr><th>Товар</th><th>По учёту</th><th>Факт</th><th>Разница</th></tr></thead><tbody>${INV.map(r=>`<tr class="${r[3]!==null&&r[3]!==r[2]?'rowwarn':''}"><td><b>${r[1]}</b><br><small class="mono">${r[0]}</small></td><td class="mono">${r[2]}</td><td class="mono">${r[3]===null?'<span class="neg">не посчитано</span>':r[3]}</td><td class="mono ${r[3]!==null&&r[3]<r[2]?'neg':''}">${r[3]===null?'—':r[3]-r[2]}</td></tr>`).join('')}</tbody></table></div><div class="btns l" style="margin-top:8px"><button class="bt sm p" onclick="act('Инвентаризация закрыта: расхождения списаны с причиной, остатки исправлены.')">Завершить и списать расхождения</button></div></div>
 <div class="pan"><h3>Как это видит сотрудник</h3><div class="phmini"><b>Инвентаризация · зона А</b><span>камера наведена на штрихкод</span><div class="bz-scan">▮▯▮▮▯▮▯▮▮▯▮</div><div class="mg" style="max-width:100%">Раскладушка алюминиевая · TG-210<br><b>Посчитано: 21</b></div><a>+1</a></div></div></div>`;

/* Комплекты */
SC.kits=()=>`<div class="hd"><div><h2>Комплекты</h2><p>Покупатель палатки почти всегда берёт ещё раскладушку, кресла и газ. Комплект собирается в заказ одним нажатием, а система следит, чтобы все части были в наличии. Средний чек растёт без уговоров.</p></div><div class="btns"><button class="bt p" onclick="act('Новый комплект: товары и цена комплекта.')">+ Комплект</button></div></div>
 <div class="g3 bz-shops">${[['Семейный выезд',[['TG-101',1],['TG-410',4],['TG-215',4],['TG-305',1],['TG-310',4]],5],['Рыбалка с ночёвкой',[['TG-102',1],['TG-210',1],['TG-505',1],['TG-610',1]],5],['Тёплая палатка',[['TG-320',1],['TG-310',6],['TG-410',2]],3]].map(k=>{const s=k[1].reduce((a,i)=>a+GD(i[0])[3]*i[1],0);const can=Math.min(...k[1].map(i=>Math.floor(total(GD(i[0]))/i[1])));return `<div class="pan"><h3>${k[0]}</h3>${k[1].map(i=>`<div class="kv"><span>${GD(i[0])[1]}</span><b class="mono">× ${i[1]}</b></div>`).join('')}<div class="kv on"><span><strong>Цена комплекта · −${k[2]}%</strong></span><b>${tg(s*(1-k[2]/100))}</b></div><div class="kv"><span>Можно собрать сейчас</span><b class="${can<3?'neg':'pos'}">${can} шт.</b></div></div>`}).join('')}</div>
 ${said('Основной товар — палатки, но доп. комплектующие туда берут: раскладушки, кресла, газовые баллоны')}`;
/* Продажи и маржа */
SC.reports=()=>`<div class="hd"><div><h2>Продажи и маржа</h2><p>Онлайн и офлайн, по каналам, категориям и товарам — с себестоимостью и маржой. Всё считается из заказов и чеков кассы, без ручного Excel. Видно, что продаётся и на чём вы зарабатываете.</p></div><div class="btns"><div class="seg"><a onclick="act('Период: день.')">День</a><a onclick="act('Период: неделя.')">Неделя</a><a class="on">Октябрь</a></div></div></div>
 <div class="wid"><div><small>Выручка</small><b>${tg(9840000)}</b><span>онлайн 6,1 млн · точка 3,7 млн</span></div><div><small>Валовая прибыль</small><b class="g">${tg(4034000)}</b><span>маржа 41%</span></div><div><small>Заказов</small><b>508</b><span>средний чек ${tg(19370)}</span></div><div><small>Комплектов продано</small><b>62</b><span>+18% к чеку</span></div></div>
 <div class="g2"><div class="pan"><h3>По категориям, тыс. ₸</h3>${bars([['Палатки',3920],['Мебель',1840],['Газ',1210],['Сон',1180],['Рыбалка',920],['Свет',770]].map(r=>[r[0],r[1],fmt(r[1])]))}</div>
 <div class="pan"><h3>Топ товаров</h3><div class="tw"><table class="t"><thead><tr><th>Товар</th><th>Продано</th><th style="text-align:right">Выручка</th><th>Маржа</th></tr></thead><tbody>${[['Палатка «Камчатка 4»',31,2759000,'37%'],['Кресло складное',96,1392000,'46%'],['Газовый баллон 450 г',410,738000,'47%'],['Спальник −10°C',27,729000,'41%'],['Раскладушка',29,696000,'44%']].map(r=>`<tr><td><b>${r[0]}</b></td><td class="mono">${r[1]}</td><td class="mono" style="text-align:right">${fmt(r[2])}</td><td class="mono">${r[3]}</td></tr>`).join('')}</tbody></table></div></div></div>
 ${said('Даже продажи вручную записываем — три человека, при большом потоке это нереально, недосчёты')}`;

/* Видео → заявки */
SC.content=()=>`<div class="hd"><div><h2>Видео → заявки</h2><p>Продажи идут с органики: сняли видео — пошли сообщения. Менеджер отмечает в заявке, с какого видео пришёл клиент, и система считает, сколько заявок, заказов и денег принесло каждое видео. Контент-план строится по цифрам, а не наугад.</p></div><div class="btns"><button class="bt p" onclick="act('Новая публикация в контент-плане: площадка, тема, дата, кто снимает.')">+ В контент-план</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Видео</th><th>Площадка</th><th>Дата</th><th>Заявок</th><th>Заказов</th><th style="text-align:right">Продажи</th></tr></thead><tbody>${[['Палатка за 3 минуты','ig','02.10',38,21,1640000],['Кухня на природе','tt','06.10',24,9,780000],['Семейный кемпинг','ig','10.10',19,8,1120000],['Тепло в палатке','tt','12.10',17,11,610000],['Рыбалка на Капшагае','ig','15.10',11,4,198000],['Обзор газовых плиток','yt','30.09',8,5,96000]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${chTag(r[1])}</td><td class="mono">${r[2]}</td><td class="mono">${r[3]}</td><td class="mono">${r[4]}</td><td class="mono" style="text-align:right">${fmt(r[5])}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="g2"><div class="pan"><h3>Контент-план · неделя</h3>${[['Пн','Instagram','Как выбрать спальник к зиме'],['Ср','TikTok','Тёплая палатка: тест ночью'],['Пт','Instagram','Комплект «Семейный выезд» за 1 минуту'],['Вс','YouTube','Обзор: 5 палаток до 100 000 ₸']].map(r=>`<div class="kv"><span><b>${r[0]}</b> · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}</div>
 <div class="pan">${tip('Почему это важно','Вы не запускаете рекламу и живёте на органике — значит, видео и есть ваш маркетинг. Когда видно, какое видео приносит деньги, понятно, что снимать дальше.')}</div></div>
 ${said('Хотим придерживаться контент-плана и системно заниматься контентом, каждый день')}`;

/* Команда */
SC.team=()=>`<div class="hd"><div><h2>Сотрудники и задачи</h2><p>Сейчас трое, скоро — продавцы на две точки и новые люди в онлайн-продажи. Каждый входит под своим логином и видит свой участок. Новички учатся по системе: воронка подсказывает, что делать дальше.</p></div><div class="btns"><button class="bt p" onclick="act('Новый сотрудник: роль, точка — доступ появится сразу.')">+ Сотрудник</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Сотрудник</th><th>Роль</th><th>Где</th><th>Заказов / чеков за неделю</th><th>Продажи</th><th>Задач</th></tr></thead><tbody>${[['Миндегали','Руководитель','всё','—','—',3],['Алибек','Онлайн-продажи','офис',96,2140000,5],['Даурен','Склад и закуп','склад','сборка 88','—',4],['Айбек','Продавец','точка у Барахолки',71,1236000,1],['Вакансия','Продавец','точка в городе','—','—',0],['Вакансия','Продавец','точка в городе','—','—',0]].map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td class="mono">${r[3]}</td><td class="mono">${typeof r[4]==='number'?fmt(r[4]):r[4]}</td><td class="mono">${r[5]}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Задачи</h3>${[['Даурен','Принять приход ПР-118 и разложить по зонам','21.10'],['Алибек','Перезвонить 6 клиентам, не забравшим резерв','сегодня'],['Миндегали','Утвердить ассортимент новой точки','23.10'],['SMM','Снять видео «Комплект Семейный выезд»','22.10']].map(r=>`<div class="kv"><span><b>${r[0]}</b> · ${r[1]}</span><b>${r[2]}</b></div>`).join('')}</div>`;

/* Расходы */
SC.costs=()=>`<div class="hd"><div><h2>Расходы: сейчас и после</h2><p>Система ваша: без ежемесячной оплаты за amoCRM и за каждого сотрудника. Остаются только каналы связи — и они дешевле, чем сейчас.</p></div></div>
 <div class="g2"><div class="pan cmp bad"><h3>Сейчас</h3><div class="kv"><span>amoCRM — за каждого пользователя</span><b>каждый месяц</b></div><div class="kv"><span>Wazzup (WhatsApp)</span><b>≈ 30 000 ₸ / мес</b></div><div class="kv"><span>Excel и учёт «в голове»</span><b>время и недосчёты</b></div><div class="kv"><span>Новый продавец</span><b>+ ещё одна подписка</b></div></div>
 <div class="pan cmp good"><h3>После</h3><div class="kv"><span>Своя система</span><b>0 ₸ — абонплаты нет</b></div><div class="kv"><span>WhatsApp через Green API</span><b>≈ 5 000 ₸ за номер</b></div><div class="kv"><span>Instagram</span><b>≈ 10–15 $ / мес</b></div><div class="kv"><span>TikTok</span><b>проверим способ подключения</b></div><div class="kv"><span>IP-телефония, если понадобится</span><b>30–50 тыс. ₸ / мес</b></div><div class="kv"><span>Сервер</span><b>бесплатно или 5–10 $</b></div><div class="kv"><span>Сотрудников</span><b>до 50 без доплат</b></div></div></div>
 ${said('Вот расходы в виде чего — мы и так будем платить за интеграции с соцсетями и WhatsApp?','Да, за каналы платите их владельцам, но меньше: WhatsApp — 5 000 ₸ вместо 30 000 ₸.')}`;

/* Стоимость */
SC.launch=()=>`<div class="hd"><div><h2>Стоимость и запуск</h2><p>Стандартный пакет разработки: одно окно для заявок, воронка заказов, склад и точки, касса, инвентаризация, цифры. Делаем под вас, разворачиваем на вашем сервере и передаём — дальше платить за систему не нужно.</p></div></div>
 <div class="pk1"><div><small>Стандартный пакет</small><b>2 500 000 ₸</b><span>при решении в течение суток — скидка 5%: 2 375 000 ₸</span></div><div><small>Срок</small><b>4–6 недель</b><span>база → полировка → запуск</span></div></div>
 <div class="pay3"><div><small>Старт · 10%</small><b>237 500 ₸</b><span>при подписании</span></div><div><small>База · 45%</small><b>1 068 750 ₸</b><span>после приёмки базы</span></div><div><small>Сдача · 45%</small><b>1 068 750 ₸</b><span>после полировки и запуска</span></div></div>
 <div class="g2"><div class="pan"><h3>Как идём</h3><div class="kv"><span><b>1.</b> Демо и согласование</span><b>сейчас</b></div><div class="kv"><span><b>2.</b> База: заявки, воронка, склад, касса — на вашем сервере</span><b>2–3 недели</b></div><div class="kv"><span><b>3.</b> Полировка: кнопки, этапы, инвентаризация — версии до «нравится»</span><b>2–3 недели</b></div><div class="kv"><span><b>4.</b> Загрузка товаров, обучение, запуск</span><b>входит</b></div></div>
 <div class="pan"><h3>После запуска</h3><div class="kv"><span>Поддержка</span><b>3 месяца бесплатно</b></div><div class="kv"><span>Доработки потом</span><b>по часам</b></div><div class="kv"><span>Новая точка</span><b>добавляется в настройках</b></div><p class="hint">Цены без скидки: 250 000 / 1 125 000 / 1 125 000 ₸.</p></div></div>`;

/* Каркас */
const CARD={};
function card(k,id){const f=CARD[k];if(!f)return;let r;try{r=f(id)}catch(e){toast('Карточка не найдена');return}openM(r[0],r[1],r[2])}
function act(m){toast(m||'В рабочей системе здесь откроется форма.')}
function searchDemo(v){v=(v||'').toLowerCase().trim();const o=ORD.find(x=>(x.id+x.cl+x.ph).toLowerCase().includes(v));if(o&&v){openOrd(o.id);return}const g=GOODS.find(x=>(x[0]+x[1]).toLowerCase().includes(v));if(g&&v){sf='all';go('stock');return}toast('Ищите по заказу, клиенту или товару: «З-1284», «Ерлан», «палатка».')}
function renderRoles(){const r=document.getElementById('roles');if(r)r.innerHTML=Object.entries(ROLES).map(([k,v])=>`<div class="role" onclick="enter('${esc(k)}')"><div class="rav">${esc(v.av)}</div><div><b>${esc(k)}</b><span>${esc(v.n)} · ${esc(v.note)}</span></div></div>`).join('');
 const s=document.getElementById('rsel');if(s)s.innerHTML=Object.keys(ROLES).map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');}
const allowed=k=>ROLES[role].s.indexOf(k)>=0;
function enter(k){role=ROLES[k]?k:'Руководитель';document.getElementById('gate').classList.add('hidden');document.getElementById('app').classList.remove('hidden');const s=document.getElementById('rsel');if(s)s.value=role;document.getElementById('me').textContent=ROLES[role].av;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`Вы вошли как «${esc(role)}».`)}
function switchRole(k){role=k;document.getElementById('me').textContent=ROLES[role].av;const s=document.getElementById('rsel');if(s)s.value=role;if(!allowed(cur))cur=ROLES[role].s[0];build();toast(`${esc(role)}: ${esc(ROLES[role].note)}.`)}
function buildRail(){document.getElementById('rail').innerHTML=''}
function buildSub(){document.getElementById('sub').innerHTML=`<div class="sbh"><span class="blogo">${LOGO_I}</span><b class="bname">TIGERS</b></div>`+SEC.filter(s=>s.sub.some(x=>allowed(x[0]))).map(s=>`<h4>${s.n}</h4>`+s.sub.filter(x=>allowed(x[0])).map(x=>`<a class="${x[0]===cur?'on':''}" onclick="go('${x[0]}')">${esc(x[1])}${x[0]==='inbox'?'<em>'+INB.length+'</em>':x[0]==='stock'&&low().length?'<em>'+low().length+'</em>':''}</a>`).join('')).join('');
 let bn=document.getElementById('bnav');if(!bn){bn=document.createElement('nav');bn.id='bnav';document.getElementById('app').appendChild(bn)}bn.innerHTML=[['dash','Пульт'],['inbox','Заявки'],['funnel','Заказы'],['pos','Касса'],['stock','Склад']].filter(x=>allowed(x[0])).map(x=>`<a class="${cur===x[0]?'on':''}" onclick="go('${x[0]}')">${x[1]}</a>`).join('')}
function build(){buildRail();buildSub();render()}
function render(){const f=SC[cur]||SC.dash;document.getElementById('ttl').textContent=SUBN[cur]||'Tigers';document.getElementById('content').innerHTML=`<div class="screen">${f()}</div>`;buildSub();try{history.replaceState(null,'','?s='+cur)}catch(e){}}
function go(k){if(!allowed(k)){toast('Этой должности раздел не нужен — поэтому его не видно. Переключите должность справа вверху.');return}cur=k;build();const c=document.querySelector('.content');if(c)c.scrollTop=0}
function openM(t,s,b){document.getElementById('mt').innerHTML=t;document.getElementById('ms').innerHTML=s;document.getElementById('mbody').innerHTML=b;document.getElementById('mbg').classList.add('show');document.querySelector('.modal').scrollTop=0}
function closeM(){document.getElementById('mbg').classList.remove('show')}
let tt=null;function toast(m){const t=document.getElementById('toast');t.innerHTML=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),6400)}
function applyTheme(){document.body.classList.toggle('dark',theme==='dark')}
function toggleTheme(){theme=theme==='dark'?'light':'dark';applyTheme();toast(theme==='dark'?'Тёмная тема.':'Светлая тема.')}
const TOUR=[
 ['dash','1 · Пульт: продажи онлайн и на точке, заявки, что заканчивается, маржа.'],
 ['inbox','2 · Instagram, TikTok, WhatsApp — в одном окне. Видно, есть ли товар.'],
 ['funnel','3 · Воронка заказов: от заявки до выдачи — одинаково для всех.'],
 ['order','4 · Заказ из того, что есть на складе: резерв, оплата, доставка.'],
 ['pos','5 · Касса точки: чек — и остаток списан, продажа в отчётах.'],
 ['stock','6 · Остатки по складу и точкам, что заканчивается.'],
 ['invent','7 · Инвентаризация камерой телефона.'],
 ['kits','8 · Комплекты: палатка + раскладушки + газ.'],
 ['content','9 · Какое видео приносит заявки и деньги.'],
 ['costs','10 · Расходы: WhatsApp 5 000 ₸ вместо 30 000 ₸, без подписок.'],
 ['launch','11 · Стоимость: 2,5 млн, −5% при решении за сутки.']
];
let ti=-1,tRun=false;
function tour(){if(tRun){stopTour();return}tRun=true;ti=-1;document.getElementById('tourBtn').textContent='■';step()}
function step(){if(!tRun)return;ti++;if(ti>=TOUR.length){stopTour();toast('Показ закончен. Всё нажимается.');return}const [k,m]=TOUR[ti];if(!allowed(k)){step();return}cur=k;build();toast(m);setTimeout(step,ti===0?6500:7200)}
function stopTour(){tRun=false;ti=-1;const b=document.getElementById('tourBtn');if(b)b.textContent='▶'}
(function(){renderRoles();applyTheme();const s=document.getElementById('rsel');if(s)s.addEventListener('change',e=>switchRole(e.target.value));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();stopTour()}});
 let q='';try{q=new URLSearchParams(location.search).get('s')||''}catch(e){}
 if(q&&SECOF[q]){const r=Object.keys(ROLES).find(k=>ROLES[k].s.indexOf(q)>=0);if(r){cur=q;enter(r)}}})();
