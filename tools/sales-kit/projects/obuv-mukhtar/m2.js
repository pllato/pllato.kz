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
