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
