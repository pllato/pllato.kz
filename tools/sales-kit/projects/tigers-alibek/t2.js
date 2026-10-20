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
