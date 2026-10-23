/* Пульт */
SC.dash=()=>`<div class="hd"><div><h2>Пульт руководителя · ${TODAY}</h2><p>Цифры из 1С без ожидания: данные подтягиваются в портал автоматически, отчёт открывается за секунду, а не формируется 5 минут. Нажмите на любую цифру — откроется подробный отчёт.</p></div></div>
 <div class="wid">
  <div class="clk" onclick="go('sales')"><small>Выручка за октябрь</small><b class="a">${tg(1284000000)}</b><span>план 1 350 млн · 95%</span></div>
  <div class="clk" onclick="go('sales')"><small>Валовая маржа</small><b>${tg(231100000)}</b><span>18,0% · −0,6 п. к сентябрю</span></div>
  <div class="clk" onclick="go('stock')"><small>Остатки на складах</small><b>${tg(2046000000)}</b><span>11 складов · 7 560 т</span></div>
  <div class="clk" onclick="go('turn')"><small>Оборачиваемость</small><b>38 дн.</b><span>цель 30 дней</span></div>
  <div class="clk" onclick="go('debt')"><small>Дебиторка</small><b>${tg(318400000)}</b><span>просрочено ${tg(46200000)}</span></div>
 </div>
 <div class="g2 g21"><div class="pan"><h3>Выручка по филиалам, млн ₸</h3>${bars(BR.map(b=>[b[0],b[2],String(b[2])]))}</div>
 <div class="pan"><h3>Требует внимания</h3>
  <div class="rf bad" onclick="go('turn')"><i></i><div><b>Масло 5W-30 в Шымкенте — на 4 дня</b><span>перемещение с центрального склада не создано</span></div></div>
  <div class="rf" onclick="go('turn')"><i></i><div><b>Смазка литиевая — запас 97 дней</b><span>группа C, деньги заморожены: 16 млн ₸</span></div></div>
  <div class="rf" onclick="go('debt')"><i></i><div><b>ТОО «АвтоМир Сервис» — просрочка 38 дней</b><span>8,4 млн ₸ · отгрузки продолжаются</span></div></div>
  <div class="rf" onclick="go('sales')"><i></i><div><b>Атырау — 71% плана</b><span>отстаёт 3-й месяц подряд</span></div></div>
 </div></div>
 ${said('Мне нужен блок отчётности: движение остатков по складам, ABC-анализ — гибче, чем в Битриксе, такая замена Power BI')}`;

SC.phone=()=>`<div class="hd"><div><h2>Отчёт в телефоне</h2><p>Зашли с телефона — нужный отчёт уже собран: цифры, фильтры по филиалу и периоду, выгрузка в Excel одной кнопкой. Без отдельного приложения: портал открывается в браузере, иконку можно вынести на экран.</p></div></div>
 <div class="oxph-wrap"><div class="oxph"><div class="oxph-top"><small>ПУЛЬС · ${TODAY}</small><b>Продажи за неделю</b></div>
 ${BR.slice(0,6).map(b=>`<div class="kv"><span>${b[0]}</span><b class="mono">${b[2]>200?'▲':'▼'} ${(b[2]/4.3).toFixed(1).replace('.',',')} млн</b></div>`).join('')}
 <button class="bt p oxbig" onclick="act('Отчёт выгружен в Excel и отправлен вам в Telegram/WhatsApp.')">Выгрузить в Excel</button></div>
 ${said('Чтобы в мобильном режиме я в любой момент на телефоне зашёл, быстро посмотрел цифры и пошёл дальше')}</div>`;

/* Склады */
let SF='Все склады';
SC.stock=()=>`<div class="hd"><div><h2>Остатки по 11 складам</h2><p>Остатки каждого товара на каждом складе, в литрах и деньгах, в резерве и свободно. Обновляется из 1С каждые 15 минут или по каждой операции.</p></div><div class="btns"><select onchange="SF=this.value;render()">${['Все склады'].concat(BR.map(b=>b[0])).map(x=>`<option ${x===SF?'selected':''}>${x}</option>`).join('')}</select><button class="bt" onclick="act('Выгружено в Excel.')">Excel</button></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Код</th><th>Товар</th><th>Группа</th><th style="text-align:right">Остаток, л</th><th style="text-align:right">В резерве</th><th style="text-align:right">Сумма</th></tr></thead><tbody>${PR.map(p=>{const k=SF==='Все склады'?1:0.12;return `<tr><td class="mono">${p[0]}</td><td><b>${p[1]}</b></td><td>${p[2]}</td><td class="mono" style="text-align:right">${fmt(p[3]*k)}</td><td class="mono" style="text-align:right">${fmt(p[3]*k*0.14)}</td><td class="mono" style="text-align:right">${fmt(p[3]*k*p[5])}</td></tr>`}).join('')}</tbody></table></div></div>`;

SC.moves=()=>`<div class="hd"><div><h2>Движение по складам</h2><p>Приход от брендодержателей, перемещения между филиалами, отгрузки клиентам, возвраты и списания — за любой период, по складу и товару. Остаток на начало, движение, остаток на конец.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Склад</th><th style="text-align:right">На 01.10, т</th><th style="text-align:right">Приход</th><th style="text-align:right">Перемещено к нам</th><th style="text-align:right">Отгружено</th><th style="text-align:right">Перемещено от нас</th><th style="text-align:right">На ${TODAY.slice(0,5)}, т</th></tr></thead><tbody>${BR.map((b,i)=>{const s=b[1],inn=i?0:2140,tin=i?Math.round(b[1]*0.42):0,out=Math.round(b[1]*0.55),tout=i?0:Math.round(BR.slice(1).reduce((a,x)=>a+x[1]*0.42,0));return `<tr><td><b>${b[0]}</b></td><td class="mono" style="text-align:right">${fmt(s)}</td><td class="mono" style="text-align:right">${inn?fmt(inn):'—'}</td><td class="mono" style="text-align:right">${tin?fmt(tin):'—'}</td><td class="mono" style="text-align:right">${fmt(out)}</td><td class="mono" style="text-align:right">${tout?fmt(tout):'—'}</td><td class="mono" style="text-align:right"><b>${fmt(s+inn+tin-out-tout)}</b></td></tr>`}).join('')}</tbody></table></div></div>
 ${said('Движение остатков по складам с качественными отчётами')}`;

SC.turn=()=>`<div class="hd"><div><h2>Оборачиваемость и запас</h2><p>Сколько дней продаж лежит на складе по каждому товару: где скоро кончится, а где заморожены деньги. Подсказка, что переместить с центрального склада.</p></div></div>
 <div class="pan"><div class="tw"><table class="t"><thead><tr><th>Товар</th><th style="text-align:right">Продажи, л/день</th><th style="text-align:right">Запас, дней</th><th>Состояние</th><th>Подсказка</th></tr></thead><tbody>${PR.map(p=>{const d=Math.round(p[3]/p[4]);return `<tr class="${d<10?'rowbad':d>60?'rowwarn':''}"><td><b>${p[1]}</b></td><td class="mono" style="text-align:right">${fmt(p[4])}</td><td class="mono" style="text-align:right">${d}</td><td>${d<10?tag('кончается','r'):d>60?tag('заморожены деньги','w'):tag('норма','g')}</td><td><small>${d<10?'заказать у поставщика · переместить в филиалы':d>60?'акция для дилеров, не закупать':'—'}</small></td></tr>`}).join('')}</tbody></table></div></div>`;

SC.abc=()=>`<div class="hd"><div><h2>ABC/XYZ-анализ</h2><p>ABC — какие товары дают 80% выручки и маржи. XYZ — насколько стабильны их продажи. Вместе — что держать всегда в наличии, а что возить под заказ.</p></div></div>
 <div class="g2 g21"><div class="pan"><div class="tw"><table class="t"><thead><tr><th>Товар</th><th>ABC</th><th>XYZ</th><th>Решение</th></tr></thead><tbody>${PR.map(p=>`<tr><td><b>${p[1]}</b></td><td>${tag(p[6],p[6]==='A'?'g':p[6]==='B'?'':'w')}</td><td>${tag(p[7],p[7]==='X'?'g':p[7]==='Y'?'':'w')}</td><td><small>${p[6]==='A'&&p[7]==='X'?'всегда в наличии на всех складах':p[6]==='C'&&p[7]==='Z'?'под заказ':p[6]==='C'?'минимальный запас':'запас по сезону'}</small></td></tr>`).join('')}</tbody></table></div></div>
 <div class="pan"><h3>Доля выручки</h3>${bars([['A · 9% товаров',78,'78%'],['B · 21% товаров',16,'16%'],['C · 70% товаров',6,'6%']])}</div></div>`;
